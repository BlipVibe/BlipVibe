// ============================================================
// BlipVibe video transcoder (free GitHub Actions worker)
// ------------------------------------------------------------
// Re-encodes raw iPhone .mov / HEVC uploads into web-optimized
// 720p H.264 MP4 with the moov atom moved to the front (fast-start),
// so videos start instantly and play in every browser. Swaps the
// optimized URL into the post's media_urls and flips video_status.
//
// Modes (env MODE):
//   process  -> posts where video_status = 'processing' (the live path)
//   backfill -> existing posts whose media_urls hold an un-optimized video
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, MODE, LIMIT, ONLY_POST_ID
// No npm deps — uses global fetch (Node 20) + system ffmpeg.
// ============================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SB   = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const KEY  = process.env.SUPABASE_SERVICE_KEY;
const MODE = (process.env.MODE || 'process').trim();
const LIMIT = parseInt(process.env.LIMIT || '5', 10);
const ONLY_POST_ID = (process.env.ONLY_POST_ID || '').trim();
const BUCKET = 'posts';

if (!SB || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1); }

const PUBLIC_PREFIX = `${SB}/storage/v1/object/public/${BUCKET}/`;
const VIDEO_RE = /\.(mp4|mov|webm|m4v|qt)(\?|#|$)/i;

const authHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// ---- Supabase REST helpers -------------------------------------------------
async function rest(path, init = {}) {
  const res = await fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: { ...authHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`REST ${path} -> ${res.status} ${await res.text()}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

async function patchPost(id, body) {
  await rest(`posts?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

// ---- Storage helpers -------------------------------------------------------
function urlToPath(url) {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return null;
  return decodeURIComponent(url.slice(PUBLIC_PREFIX.length).split(/[?#]/)[0]);
}
function pathToUrl(path) {
  return PUBLIC_PREFIX + path.split('/').map(encodeURIComponent).join('/');
}

async function download(path, dest) {
  const res = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, { headers: authHeaders });
  if (!res.ok) throw new Error(`download ${path} -> ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function upload(path, file, contentType) {
  const res = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: readFileSync(file),
  });
  if (!res.ok) throw new Error(`upload ${path} -> ${res.status} ${await res.text()}`);
}

// ---- The actual encode -----------------------------------------------------
// 720p cap, even dimensions, H.264 high/AAC, +faststart. veryfast keeps the
// free CI minutes low; crf 23 is visually transparent for social video.
function transcode(inFile, outFile) {
  execFileSync('ffmpeg', [
    '-y', '-i', inFile,
    '-vf', "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-preset', 'veryfast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
    '-movflags', '+faststart',
    outFile,
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
}

function optimizedPath(rawPath) {
  // {userId}/vid-123.mov -> {userId}/vid-123-opt.mp4
  return rawPath.replace(/\.[^./]+$/, '') + '-opt.mp4';
}
const isOptimized = (url) => /-opt\.mp4(\?|#|$)/i.test(url || '');

// A post may hold its video in the legacy `image_url` column OR in the newer
// `media_urls` array. Collect every un-optimized video URL across both.
function collectVideoUrls(post) {
  const out = [];
  if (post.image_url && VIDEO_RE.test(post.image_url) && !isOptimized(post.image_url)) out.push(post.image_url);
  for (const u of (post.media_urls || [])) if (VIDEO_RE.test(u) && !isOptimized(u)) out.push(u);
  return out;
}

// ---- Work selection --------------------------------------------------------
const SELECT = 'id,image_url,media_urls,video_status';
async function getWork() {
  if (ONLY_POST_ID) {
    return rest(`posts?id=eq.${ONLY_POST_ID}&select=${SELECT}`);
  }
  if (MODE === 'backfill') {
    const inImg = await rest(`posts?select=${SELECT}&or=(image_url.ilike.*.mov*,image_url.ilike.*.mp4*,image_url.ilike.*.webm*,image_url.ilike.*.m4v*)&limit=1000`);
    const inArr = await rest(`posts?media_urls=not.is.null&select=${SELECT}&limit=1000`);
    const byId = {};
    for (const p of [...inImg, ...inArr]) byId[p.id] = p;
    return Object.values(byId)
      .filter(p => collectVideoUrls(p).length)
      .slice(0, LIMIT);
  }
  // default: live pending queue
  return rest(`posts?video_status=eq.processing&select=${SELECT}&order=created_at.asc&limit=${LIMIT}`);
}

// ---- Main ------------------------------------------------------------------
async function processPost(post) {
  const work = [...new Set(collectVideoUrls(post))];
  if (!work.length) {
    // nothing to do (e.g. video already optimized) — just clear the flag
    if (post.video_status === 'processing') await patchPost(post.id, { video_status: 'ready' });
    console.log(`post ${post.id}: no un-optimized video, marked ready`);
    return;
  }

  const tmp = mkdtempSync(join(tmpdir(), 'bv-'));
  try {
    const map = {}; // rawUrl -> optimized public URL
    for (const rawUrl of work) {
      const rawPath = urlToPath(rawUrl);
      if (!rawPath) { console.log(`  skip (foreign url): ${rawUrl}`); continue; }
      const inFile = join(tmp, 'in' + (rawPath.match(/\.[^./]+$/)?.[0] || '.mov'));
      const outFile = join(tmp, 'out.mp4');
      console.log(`  downloading ${rawPath}`);
      await download(rawPath, inFile);
      console.log(`  transcoding -> 720p H.264 +faststart`);
      transcode(inFile, outFile);
      const outPath = optimizedPath(rawPath);
      console.log(`  uploading ${outPath}`);
      await upload(outPath, outFile, 'video/mp4');
      map[rawUrl] = pathToUrl(outPath);
    }
    // Rewrite whichever field(s) held the raw video.
    const body = { video_status: 'ready' };
    if (post.image_url && map[post.image_url]) body.image_url = map[post.image_url];
    if (post.media_urls) body.media_urls = post.media_urls.map(u => map[u] || u);
    await patchPost(post.id, body);
    console.log(`post ${post.id}: READY`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

(async () => {
  console.log(`mode=${MODE} limit=${LIMIT}${ONLY_POST_ID ? ` only=${ONLY_POST_ID}` : ''}`);
  const work = await getWork();
  console.log(`found ${work.length} post(s) to handle`);
  let ok = 0, fail = 0;
  for (const post of work) {
    try { await processPost(post); ok++; }
    catch (e) {
      fail++;
      console.error(`post ${post.id} FAILED: ${e.message}`);
      try { await patchPost(post.id, { video_status: 'failed' }); } catch {}
    }
  }
  console.log(`done. ok=${ok} failed=${fail}`);
  if (fail && !ok) process.exit(1);
})();
