// =============================================================================
// BlipVibe — Supabase Client + Data Layer
// Drop-in replacement for fake/local data. Vanilla JS, async/await.
// =============================================================================

// ---- 1. INIT ----------------------------------------------------------------
const SUPABASE_URL  = 'https://jrybcihteqlqkdbrmagx.supabase.co';   // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON = 'sb_publishable_PPMPXSazIqUTmkgAx6f3Tg_VVyn1VbB';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ---- 2. AUTH ----------------------------------------------------------------

async function sbSignUp(email, password, username, birthday = null, firstName = '', lastName = '') {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username, first_name: firstName, last_name: lastName } }
  });
  if (error) throw error;

  // Insert profile row after signup.
  // Uses upsert so it won't conflict if the DB trigger already created it.
  // Only works when a session is returned (email confirmation disabled).
  if (data.user && data.session) {
    const row = {
      id: data.user.id,
      username: username,
      display_name: computeDisplayName(firstName, lastName, '', 'real_name', username),
      first_name: firstName,
      last_name: lastName,
      display_mode: 'real_name',
      email: email,
      bio: '',
      avatar_url: null,
      cover_photo_url: null
    };
    if (birthday) row.birthday = birthday;
    const { error: profileErr } = await sb.from('profiles')
      .upsert(row, { onConflict: 'id' });
    if (profileErr) console.error('Profile insert failed:', profileErr.message);
  }
  return data;
}

async function sbGetEmailByUsername(username) {
  const { data, error } = await sb.from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle();
  if (error || !data || !data.email) return null;
  return data.email;
}

async function sbSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function sbSignOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

async function sbGetUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// Ensure a profile row exists for the given auth user.
// Called after email confirmation when the signup didn't create one.
async function sbEnsureProfile(authUser) {
  // Try to fetch existing profile first
  const { data: existing, error: fetchErr } = await sb.from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();
  if (existing) return existing;
  // If the fetch failed (network error), don't create/overwrite — just throw
  if (fetchErr) throw fetchErr;

  // No profile yet — create one using metadata from signup
  // Note: do NOT include avatar_url or cover_photo_url so upsert won't overwrite them
  const username = authUser.user_metadata?.username || authUser.email.split('@')[0];
  const firstName = authUser.user_metadata?.first_name || '';
  const lastName = authUser.user_metadata?.last_name || '';
  const { data, error } = await sb.from('profiles')
    .upsert({
      id: authUser.id,
      username: username,
      display_name: computeDisplayName(firstName, lastName, '', 'real_name', username),
      first_name: firstName,
      last_name: lastName,
      display_mode: 'real_name',
      bio: ''
    }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function sbOnAuthChange(callback) {
  sb.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// ---- 3. PROFILES ------------------------------------------------------------

async function sbGetProfile(userId) {
  const { data, error } = await sb.from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Get OWN profile with private columns (skin_data, birthday, email)
// Uses SECURITY DEFINER RPC to bypass column-level revokes
async function sbGetOwnProfile() {
  const { data, error } = await sb.rpc('get_own_profile');
  if (error) throw error;
  return data;
}

async function sbGetProfileByUsername(username) {
  const { data, error } = await sb.from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error) throw error;
  return data;
}

async function sbUpdateProfile(userId, updates) {
  const { error } = await sb.from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

async function sbDeleteAccount(userId) {
  // 1. Clean up storage files (best-effort, don't block on errors)
  try {
    var { data: avatarFiles } = await sb.storage.from('avatars').list(userId);
    if (avatarFiles && avatarFiles.length) {
      await sb.storage.from('avatars').remove(avatarFiles.map(f => userId + '/' + f.name));
    }
  } catch(e) { console.warn('Avatar cleanup:', e); }
  try {
    var { data: postFiles } = await sb.storage.from('posts').list(userId);
    if (postFiles && postFiles.length) {
      await sb.storage.from('posts').remove(postFiles.map(f => userId + '/' + f.name));
    }
  } catch(e) { console.warn('Post files cleanup:', e); }
  // 2. Delete profile + auth.users via SECURITY DEFINER RPC (full cleanup)
  //    Falls back to client-side profile delete if RPC not deployed yet.
  try {
    const { error: rpcErr } = await sb.rpc('delete_own_account');
    if (rpcErr) throw rpcErr;
  } catch(e) {
    console.warn('delete_own_account RPC failed, falling back:', e);
    const { error } = await sb.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  }
  // 3. Sign out
  await sb.auth.signOut();
}

async function sbSearchProfiles(query, limit = 20) {
  // Uses parameterized SECURITY DEFINER RPC — no client-side string interpolation
  var safe = query.replace(/[,().]/g, '').trim();
  if (!safe) return [];
  const { data, error } = await sb.rpc('search_profiles', {
    p_query: safe,
    p_limit: limit || 20
  });
  if (error) throw error;
  return data || [];
}

async function sbGetAllProfiles(limit = 50) {
  const { data, error } = await sb.from('profiles')
    .select('*')
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---- 4. POSTS ---------------------------------------------------------------

async function sbCreatePost(authorId, content, imageUrl = null, groupId = null, sharedPostId = null, location = null, mediaUrls = null) {
  var row = { author_id: authorId, content: content || '', image_url: imageUrl, group_id: groupId };
  if (sharedPostId) row.shared_post_id = sharedPostId;
  if (location) row.location = location;
  if (mediaUrls && mediaUrls.length) row.media_urls = mediaUrls;
  const { data, error } = await sb.from('posts')
    .insert(row)
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)
    `)
    .single();
  if (error) throw error;
  return data;
}

async function sbGetFeed(limit = 50, offset = 0) {
  const { data, error } = await sb.from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
      comments:comments(count)
    `)
    .is('group_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  // Fetch like counts separately (no FK between posts and likes)
  for (const post of (data || [])) {
    const { count } = await sb.from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'post')
      .eq('target_id', post.id);
    post.like_count = count || 0;
  }
  return data;
}

async function sbGetFollowingFeed(userId, limit = 50, offset = 0) {
  // Get IDs the user follows
  const { data: follows } = await sb.from('follows')
    .select('followed_id')
    .eq('follower_id', userId);
  const followedIds = (follows || []).map(f => f.followed_id);
  followedIds.push(userId); // include own posts

  if (!followedIds.length) return [];

  const { data, error } = await sb.from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
      comments:comments(count)
    `)
    .is('group_id', null)
    .in('author_id', followedIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  // Fetch like counts separately (no FK between posts and likes)
  for (const post of (data || [])) {
    const { count } = await sb.from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'post')
      .eq('target_id', post.id);
    post.like_count = count || 0;
  }
  return data;
}

async function sbGetPostsByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await sb.from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)')
    .in('id', ids);
  if (error) throw error;
  return data || [];
}

async function sbGetUserPosts(userId, limit = 20) {
  const { data, error } = await sb.from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
      comments:comments(count)
    `)
    .eq('author_id', userId)
    .is('group_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function sbDeletePost(postId) {
  const { error } = await sb.from('posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

async function sbEditPost(postId, newContent) {
  const { error } = await sb.from('posts')
    .update({ content: newContent })
    .eq('id', postId);
  if (error) throw error;
}

// ---- 5. COMMENTS ------------------------------------------------------------

async function sbCreateComment(postId, authorId, content, parentCommentId = null) {
  const { data, error } = await sb.from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
      parent_comment_id: parentCommentId
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Lightweight comment fetch for inline preview (no per-comment like counts)
async function sbGetCommentsLite(postId, limit = 20) {
  const { data, error } = await sb.from('comments')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function sbGetComments(postId, sortBy = 'top') {
  const { data: rawData, error } = await sb.from('comments')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: sortBy === 'oldest' || sortBy === 'top' });
  if (error) throw error;
  var data = rawData || [];

  // Fetch like counts in parallel (not N+1 sequential)
  await Promise.all(data.map(async function(c) {
    try {
      const { count } = await sb.from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', 'comment')
        .eq('target_id', c.id);
      c.like_count = count || 0;
    } catch(e) { c.like_count = 0; }
  }));
  if (sortBy === 'top') {
    data.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
  }
  return data;
}

async function sbDeleteComment(commentId) {
  const { error } = await sb.from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

async function sbEditComment(commentId, newContent) {
  const { error } = await sb.from('comments')
    .update({ content: newContent })
    .eq('id', commentId);
  if (error) throw error;
}

// ---- 6. LIKES ---------------------------------------------------------------

async function sbToggleLike(userId, targetType, targetId) {
  // Check if already liked
  const { data: existing } = await sb.from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await sb.from('likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false; // now unliked
  } else {
    // Like
    const { error } = await sb.from('likes')
      .insert({ user_id: userId, target_type: targetType, target_id: targetId });
    if (error) throw error;
    return true; // now liked
  }
}

async function sbGetUserLikes(userId, targetType = null) {
  let query = sb.from('likes')
    .select('target_type, target_id')
    .eq('user_id', userId);
  if (targetType) query = query.eq('target_type', targetType);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function sbGetLikeCount(targetType, targetId) {
  const { count, error } = await sb.from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  if (error) throw error;
  return count;
}

async function sbGetLikers(targetType, targetId, limit = 10) {
  const { data, error } = await sb.from('likes')
    .select(`
      user:profiles!likes_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .limit(limit);
  if (error) throw error;
  return (data || []).map(d => d.user);
}

// ---- 7. FOLLOWS -------------------------------------------------------------

async function sbFollow(followerId, followedId) {
  const { error } = await sb.from('follows')
    .insert({ follower_id: followerId, followed_id: followedId });
  if (error) throw error;
}

async function sbUnfollow(followerId, followedId) {
  const { error } = await sb.from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId);
  if (error) throw error;
}

async function sbIsFollowing(followerId, followedId) {
  const { data } = await sb.from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();
  return !!data;
}

async function sbGetFollowing(userId) {
  const { data, error } = await sb.from('follows')
    .select(`
      followed:profiles!follows_followed_id_fkey(id, username, display_name, avatar_url, bio)
    `)
    .eq('follower_id', userId);
  if (error) throw error;
  return (data || []).map(d => d.followed);
}

async function sbGetFollowers(userId) {
  const { data, error } = await sb.from('follows')
    .select(`
      follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio)
    `)
    .eq('followed_id', userId);
  if (error) throw error;
  return (data || []).map(d => d.follower);
}

async function sbGetFriendsOfFriends(userId) {
  // Get users I follow
  const { data: myFollows } = await sb.from('follows')
    .select('followed_id')
    .eq('follower_id', userId);
  const followedIds = (myFollows || []).map(f => f.followed_id);
  if (!followedIds.length) return {};

  // Get users THEY follow (friends of friends)
  const { data: theirFollows } = await sb.from('follows')
    .select('followed_id')
    .in('follower_id', followedIds);
  const fofSet = {};
  (theirFollows || []).forEach(f => {
    if (f.followed_id !== userId && !followedIds.includes(f.followed_id)) {
      fofSet[f.followed_id] = true;
    }
  });
  return fofSet;
}

async function sbGetFollowCounts(userId) {
  const [{ count: following }, { count: followers }] = await Promise.all([
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', userId)
  ]);
  return { following: following || 0, followers: followers || 0 };
}

// ---- 8. NOTIFICATIONS -------------------------------------------------------

async function sbGetNotifications(userId, limit = 500) {
  const { data, error } = await sb.from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function sbMarkNotificationsRead(userId) {
  const { error } = await sb.from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

async function sbGetUnreadCount(userId) {
  const { count, error } = await sb.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

async function sbCreateNotification(userId, type, title, body, data) {
  // Map app-internal types to the DB enum: comment, reply, like, follow, purchase, system
  const typeMap = { group: 'system', skin: 'purchase', coin: 'purchase', message: 'system' };
  const dbType = typeMap[type] || ((['comment','reply','like','follow','purchase','system'].indexOf(type) !== -1) ? type : 'system');
  const { error } = await sb.from('notifications')
    .insert({ user_id: userId, type: dbType, title: title || '', body: body || '', data: data || {} });
  if (error) throw error;
}

// ---- 9. COINS ---------------------------------------------------------------

async function sbGetCoinBalance(userId) {
  const { data } = await sb.from('profiles')
    .select('coin_balance')
    .eq('id', userId)
    .single();
  return data?.coin_balance || 0;
}

async function sbGetCoinTransactions(userId, limit = 50) {
  const { data, error } = await sb.from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---- 10. STORAGE (avatars / post images) ------------------------------------

async function sbUploadFile(bucket, path, file) {
  const { data, error } = await sb.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  // Append cache-buster so browser doesn't serve stale cached image
  return urlData.publicUrl + '?t=' + Date.now();
}

// ---- Upload file validation (MIME whitelist, size limit, extension match) ----
var _UPLOAD_ALLOWED_MIMES = {
  'image/jpeg': ['jpg','jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif']
};
var _UPLOAD_BLOCKED_MIMES = ['image/svg+xml','text/html','application/javascript','application/x-javascript','text/javascript'];

function validateUploadFile(file, opts) {
  opts = opts || {};
  var label = opts.label || 'File';
  var maxSize = opts.maxSize || (10 * 1024 * 1024); // default 10MB

  // Check blocked types first
  if (_UPLOAD_BLOCKED_MIMES.indexOf(file.type) !== -1) {
    throw new Error(label + ': ' + file.type + ' files are not allowed for security reasons.');
  }
  // Check MIME whitelist
  if (!_UPLOAD_ALLOWED_MIMES[file.type]) {
    throw new Error(label + ': unsupported file type (' + (file.type || 'unknown') + '). Allowed: JPEG, PNG, WebP, GIF.');
  }
  // Check file size
  if (file.size > maxSize) {
    var maxMB = Math.round(maxSize / (1024 * 1024));
    throw new Error(label + ': file too large (' + (file.size / (1024*1024)).toFixed(1) + 'MB). Maximum: ' + maxMB + 'MB.');
  }
  // Extension-MIME match
  var ext = (file.name || '').split('.').pop().toLowerCase();
  var allowedExts = _UPLOAD_ALLOWED_MIMES[file.type];
  if (ext && allowedExts.indexOf(ext) === -1) {
    throw new Error(label + ': file extension .' + ext + ' does not match type ' + file.type + '. Expected: .' + allowedExts.join(', .'));
  }
}

async function sbUploadAvatar(userId, file) {
  validateUploadFile(file, { maxSize: 5 * 1024 * 1024, label: 'Avatar' });
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  return sbUploadFile('avatars', path, file);
}

async function sbUploadCover(userId, file) {
  validateUploadFile(file, { maxSize: 5 * 1024 * 1024, label: 'Cover photo' });
  const ext = file.name.split('.').pop();
  const path = `${userId}/cover-${Date.now()}.${ext}`;
  return sbUploadFile('avatars', path, file);
}

async function sbListUserAvatars(userId) {
  const { data, error } = await sb.storage
    .from('avatars')
    .list(userId, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter(f => f.name.startsWith('avatar'))
    .map(f => {
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(userId + '/' + f.name);
      return { src: urlData.publicUrl + '?t=' + Date.now(), date: new Date(f.created_at).getTime(), name: f.name };
    });
}

async function sbListUserCovers(userId) {
  const { data, error } = await sb.storage
    .from('avatars')
    .list(userId, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter(f => f.name.startsWith('cover'))
    .map(f => {
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(userId + '/' + f.name);
      return { src: urlData.publicUrl + '?t=' + Date.now(), date: new Date(f.created_at).getTime(), name: f.name };
    });
}

async function sbListUserBackgrounds(userId) {
  const { data, error } = await sb.storage
    .from('avatars')
    .list('backgrounds/' + userId, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter(f => f.name.match(/^bg-/))
    .map(f => {
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl('backgrounds/' + userId + '/' + f.name);
      return { src: urlData.publicUrl + '?t=' + Date.now(), date: new Date(f.created_at).getTime(), name: f.name };
    });
}

async function sbListGroupBackgrounds(groupId) {
  const { data, error } = await sb.storage
    .from('avatars')
    .list('backgrounds/group_' + groupId, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter(f => f.name.match(/^bg-/))
    .map(f => {
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl('backgrounds/group_' + groupId + '/' + f.name);
      return { src: urlData.publicUrl + '?t=' + Date.now(), date: new Date(f.created_at).getTime(), name: f.name };
    });
}

async function sbUploadPostImage(userId, file) {
  validateUploadFile(file, { maxSize: 10 * 1024 * 1024, label: 'Image' });
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  return sbUploadFile('posts', path, file);
}

async function sbUploadGroupImage(groupId, file, type) {
  validateUploadFile(file, { maxSize: 5 * 1024 * 1024, label: 'Group ' + type });
  const ext = file.name.split('.').pop();
  const path = `groups/${groupId}/${type}-${Date.now()}.${ext}`;
  return sbUploadFile('avatars', path, file);
}

// ---- 11. GROUPS -------------------------------------------------------------

async function sbGetGroups(limit = 50) {
  const { data, error } = await sb.from('groups')
    .select(`
      *,
      owner:profiles!groups_owner_id_fkey(id, username, display_name, avatar_url),
      member_count:group_members(count)
    `)
    .limit(limit);
  if (error) throw error;
  return data;
}

async function sbGetGroupMembers(groupId) {
  const { data, error } = await sb.from('group_members')
    .select(`
      *,
      user:profiles!group_members_user_id_fkey(id, username, display_name, avatar_url, bio)
    `)
    .eq('group_id', groupId);
  if (error) throw error;
  return data;
}

async function sbJoinGroup(groupId, userId) {
  const { error } = await sb.from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' });
  if (error) throw error;
}

async function sbCreateGroup(ownerId, name, description) {
  const { data, error } = await sb.from('groups')
    .insert({ owner_id: ownerId, name, description: description || '' })
    .select(`
      *,
      owner:profiles!groups_owner_id_fkey(id, username, display_name, avatar_url),
      member_count:group_members(count)
    `)
    .single();
  if (error) throw error;
  // Auto-add owner as member
  await sb.from('group_members')
    .insert({ group_id: data.id, user_id: ownerId, role: 'owner' });
  return data;
}

async function sbDeleteGroup(groupId) {
  const { error } = await sb.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}

async function sbLeaveGroup(groupId, userId) {
  const { error } = await sb.from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

async function sbGetGroupPosts(groupId, limit = 50) {
  const { data, error } = await sb.from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
      comments:comments(count)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  for (const post of (data || [])) {
    const { count } = await sb.from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'post')
      .eq('target_id', post.id);
    post.like_count = count || 0;
  }
  return data || [];
}

async function sbUpdateGroup(groupId, updates) {
  const { data, error } = await sb.from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sbAddGroupCoins(groupId, amount) {
  const { data, error } = await sb.rpc('add_group_coins', { p_group_id: groupId, p_amount: amount });
  if (error) throw error;
  return data; // returns new coin_balance
}

// ---- 12. SKINS --------------------------------------------------------------

async function sbGetSkins() {
  const { data, error } = await sb.from('skins')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

async function sbGetUserSkins(userId) {
  const { data, error } = await sb.from('user_skins')
    .select('*, skin:skins(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

// ---- 13. REALTIME HELPERS ---------------------------------------------------

function sbSubscribePosts(callback) {
  return sb.channel('public:posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
      callback(payload.new);
    })
    .subscribe();
}

function sbSubscribeFollows(userId, callback) {
  return sb.channel('follows:' + userId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: 'followed_id=eq.' + userId }, payload => {
      callback(payload.eventType, payload.new, payload.old);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: 'follower_id=eq.' + userId }, payload => {
      callback(payload.eventType, payload.new, payload.old);
    })
    .subscribe();
}

function sbSubscribeLikes(userId, callback) {
  return sb.channel('likes:' + userId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, payload => {
      callback('INSERT', payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, payload => {
      callback('DELETE', payload.old);
    })
    .subscribe();
}

function sbSubscribeNotifications(userId, callback) {
  return sb.channel('notifications:' + userId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
}

// ---- 14. MESSAGES -----------------------------------------------------------

async function sbGetConversations(userId) {
  // Get all messages where user is sender or receiver, grouped by the other person
  const { data, error } = await sb.from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(id, username, display_name, avatar_url)
    `)
    .or('sender_id.eq.' + userId + ',receiver_id.eq.' + userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Group by conversation partner
  var convos = {};
  (data || []).forEach(function(m) {
    var partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    if (!convos[partnerId]) {
      var partner = m.sender_id === userId ? m.receiver : m.sender;
      convos[partnerId] = {
        partnerId: partnerId,
        partner: partner,
        lastMessage: m,
        unread: 0
      };
    }
    if (m.receiver_id === userId && !m.is_read) convos[partnerId].unread++;
  });
  // Sort by most recent message
  return Object.values(convos).sort(function(a, b) {
    return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
  });
}

async function sbGetMessages(userId, partnerId, limit = 100) {
  const { data, error } = await sb.from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .or(
      'and(sender_id.eq.' + userId + ',receiver_id.eq.' + partnerId + '),' +
      'and(sender_id.eq.' + partnerId + ',receiver_id.eq.' + userId + ')'
    )
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function sbEditMessage(messageId, newContent) {
  const { error } = await sb.from('messages')
    .update({ content: newContent })
    .eq('id', messageId);
  if (error) throw error;
}

async function sbSendMessage(senderId, receiverId, content) {
  // Uses rate-limited SECURITY DEFINER RPC (30 msgs/60s per sender)
  // senderId param kept for backwards compat but auth.uid() used server-side
  const { data, error } = await sb.rpc('send_message_ratelimited', {
    p_receiver_id: receiverId,
    p_content: content
  });
  if (error) throw error;
  return data;
}

async function sbMarkMessagesRead(userId, partnerId) {
  const { error } = await sb.from('messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', partnerId)
    .eq('is_read', false);
  if (error) throw error;
}

function sbSubscribeMessages(userId, callback) {
  return sb.channel('messages:' + userId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'receiver_id=eq.' + userId
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
}

// ---- 15. ALBUMS -------------------------------------------------------------

async function sbGetAlbums(userId) {
  if (!userId) return [];
  // Fetch albums
  const { data: albums, error } = await sb.from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!albums || !albums.length) return [];
  // Fetch photos for all albums in one query
  const albumIds = albums.map(a => a.id);
  const { data: photos, error: pErr } = await sb.from('album_photos')
    .select('id, album_id, photo_url, created_at')
    .in('album_id', albumIds);
  if (pErr) console.warn('album_photos fetch error:', pErr);
  // Group photos by album
  const photoMap = {};
  (photos || []).forEach(function(p) {
    if (!photoMap[p.album_id]) photoMap[p.album_id] = [];
    photoMap[p.album_id].push(p);
  });
  albums.forEach(function(a) { a.album_photos = photoMap[a.id] || []; });
  return albums;
}

async function sbCreateAlbum(userId, title) {
  const { data, error } = await sb.from('albums')
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sbDeleteAlbum(albumId) {
  const { error } = await sb.from('albums').delete().eq('id', albumId);
  if (error) throw error;
}

async function sbRenameAlbum(albumId, title) {
  const { error } = await sb.from('albums').update({ title }).eq('id', albumId);
  if (error) throw error;
}

async function sbAddPhotoToAlbum(albumId, photoUrl) {
  const { data, error } = await sb.from('album_photos')
    .upsert({ album_id: albumId, photo_url: photoUrl }, { onConflict: 'album_id,photo_url' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sbRemovePhotoFromAlbum(albumPhotoId) {
  const { error } = await sb.from('album_photos').delete().eq('id', albumPhotoId);
  if (error) throw error;
}

// ---- 16. PHOTO COMMENTS -------------------------------------------------------

async function sbGetPhotoComments(photoUrl, sortBy = 'newest') {
  const { data, error } = await sb.from('photo_comments')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('photo_url', photoUrl)
    .order('created_at', { ascending: sortBy === 'oldest' });
  if (error) throw error;
  return data || [];
}

async function sbCreatePhotoComment(photoUrl, postId, authorId, content, parentCommentId = null) {
  const row = { photo_url: photoUrl, author_id: authorId, content };
  if (postId) row.post_id = postId;
  if (parentCommentId) row.parent_comment_id = parentCommentId;
  const { data, error } = await sb.from('photo_comments')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function sbDeletePhotoComment(commentId) {
  const { error } = await sb.from('photo_comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ---- 17. PHOTO LIKES/DISLIKES ------------------------------------------------

async function sbTogglePhotoReaction(photoUrl, userId, reaction) {
  // Check existing reaction
  const { data: existing } = await sb.from('photo_likes')
    .select('id, reaction')
    .eq('photo_url', photoUrl)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction === reaction) {
      // Same reaction — remove it (toggle off)
      await sb.from('photo_likes').delete().eq('id', existing.id);
      return null;
    } else {
      // Different reaction — switch it
      await sb.from('photo_likes').update({ reaction }).eq('id', existing.id);
      return reaction;
    }
  } else {
    // No existing reaction — insert
    await sb.from('photo_likes').insert({ photo_url: photoUrl, user_id: userId, reaction });
    return reaction;
  }
}

async function sbGetPhotoReactionCounts(photoUrl) {
  const { data, error } = await sb.from('photo_likes')
    .select('reaction')
    .eq('photo_url', photoUrl);
  if (error) throw error;
  var likes = 0, dislikes = 0;
  (data || []).forEach(function(r) {
    if (r.reaction === 'like') likes++;
    else if (r.reaction === 'dislike') dislikes++;
  });
  return { likes: likes, dislikes: dislikes };
}

async function sbGetUserPhotoReaction(photoUrl, userId) {
  const { data } = await sb.from('photo_likes')
    .select('reaction')
    .eq('photo_url', photoUrl)
    .eq('user_id', userId)
    .maybeSingle();
  return data ? data.reaction : null;
}

// ---- 18. ADMIN ---------------------------------------------------------------

async function sbIsAdmin() {
  try {
    const { data, error } = await sb.rpc('is_current_user_admin');
    if (error) return false;
    return !!data;
  } catch(e) { return false; }
}

async function sbAdminGetUsers(search, pageSize, pageOffset) {
  const { data, error } = await sb.rpc('admin_get_users', {
    search_query: search || '',
    page_size: pageSize || 50,
    page_offset: pageOffset || 0
  });
  if (error) throw error;
  return data || [];
}

async function sbAdminUserCount(search) {
  const { data, error } = await sb.rpc('admin_user_count', {
    search_query: search || ''
  });
  if (error) throw error;
  return data || 0;
}

async function sbAdminDeleteUser(targetId) {
  const { error } = await sb.rpc('admin_delete_user', { target_id: targetId });
  if (error) throw error;
}

async function sbAdminToggleSuspend(targetId) {
  const { data, error } = await sb.rpc('admin_toggle_suspend', { target_id: targetId });
  if (error) throw error;
  return data; // returns new is_suspended boolean
}

async function sbAdminGetLogs(limit, offset) {
  const { data, error } = await sb.rpc('admin_get_logs', {
    p_limit: limit || 50,
    p_offset: offset || 0
  });
  if (error) throw error;
  return data || [];
}

// ---- 19. UTILITY: timeAgo for real timestamps --------------------------------

function timeAgoReal(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hr' + (Math.floor(diff / 3600) > 1 ? 's' : '') + ' ago';
  if (diff < 604800) return Math.floor(diff / 86400) + ' day' + (Math.floor(diff / 86400) > 1 ? 's' : '') + ' ago';
  return new Date(dateStr).toLocaleDateString();
}

// ---- 20. DISPLAY NAME HELPER ------------------------------------------------

function computeDisplayName(firstName, lastName, nickname, displayMode, username) {
  if (displayMode === 'nickname' && nickname && nickname.trim()) return nickname.trim();
  var first = (firstName || '').trim(), last = (lastName || '').trim();
  if (first || last) return (first + ' ' + last).trim();
  return username || 'User';
}

// ---- EXPORT (globals for vanilla JS) ----------------------------------------
// All sb* functions are already global. This file must be loaded BEFORE app.js.
