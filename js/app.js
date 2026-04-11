document.addEventListener('DOMContentLoaded', function () {

// ======================== COOKIE / THIRD-PARTY CONSENT ========================
var _cookieConsent = false;
function checkCookieConsent(){ try { return localStorage.getItem('blipvibe_cookie_consent')==='1'; } catch(e){ return false; } }
function grantCookieConsent(){ _cookieConsent=true; try { localStorage.setItem('blipvibe_cookie_consent','1'); } catch(e){} var b=document.getElementById('cookieConsentBanner'); if(b) b.remove(); }
function showCookieConsent(){
    if(checkCookieConsent()||_cookieConsent) return;
    var b=document.createElement('div');b.id='cookieConsentBanner';
    b.innerHTML='<div class="cookie-banner-inner">'
        +'<p><strong>Cookies &amp; Third-Party Content</strong> — BlipVibe uses local storage for your session and preferences. Embedded content from YouTube, TikTok, Instagram, Twitter/X, Spotify, and others may set cookies. '
        +'<a href="#" id="cookiePolicyLink" style="color:var(--primary);">Privacy Policy</a></p>'
        +'<div class="cookie-banner-btns">'
        +'<button class="btn btn-primary" id="cookieAcceptBtn">Accept All</button>'
        +'<button class="btn" id="cookieDeclineBtn" style="background:var(--border);color:var(--dark);">Essential Only</button>'
        +'</div></div>';
    document.body.appendChild(b);
    document.getElementById('cookieAcceptBtn').addEventListener('click',function(){ grantCookieConsent(); location.reload(); });
    document.getElementById('cookieDeclineBtn').addEventListener('click',function(){ _cookieConsent=false; try{localStorage.setItem('blipvibe_cookie_consent','essential');}catch(e){} b.remove(); });
    document.getElementById('cookiePolicyLink').addEventListener('click',function(e){ e.preventDefault(); navigateTo('privacy'); });
}
_cookieConsent=checkCookieConsent();
// Delegated click handler for embed consent placeholder buttons
document.addEventListener('click',function(e){var btn=e.target.closest('.embed-consent-btn');if(btn){e.preventDefault();grantCookieConsent();location.reload();}});

// ======================== EMOJI-SAFE STRING HELPERS ========================
// Array.from splits by full Unicode code points so surrogate pairs / ZWJ emoji stay intact
function safeSlice(str,start,end){var a=Array.from(str||'');return a.slice(start,end).join('');}
function safeTruncate(str,max,ellipsis){var a=Array.from(str||'');if(a.length<=max)return str;return a.slice(0,max).join('')+(ellipsis||'');}
// Word-boundary-aware split: returns [visible, hidden] without cutting mid-word
function safeWordSplit(str,max){
    if(!str) return ['',''];
    var a=Array.from(str);
    if(a.length<=max) return [str,''];
    // Find the last space at or before the limit
    var cutStr=a.slice(0,max).join('');
    var lastSpace=cutStr.lastIndexOf(' ');
    if(lastSpace<max*0.5) lastSpace=max; // if no good break point, just cut at max
    var visible=a.slice(0,lastSpace).join('');
    var rest=a.slice(lastSpace).join('').replace(/^\s+/,''); // trim leading space from remainder
    if(rest) rest=' '+rest; // preserve space so words don't merge when hidden span is shown
    return [visible,rest];
}

// ======================== XSS PROTECTION ========================
function escapeHtml(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function escapeHtmlNl(s){return convertTextEmojis(escapeHtml(s)).replace(/\n/g,'<br>');}
var _emojiMap={
    ':)':'😊','(:':'😊',':-)':'😊',
    ';)':'😉',';-)':'😉',
    ':(':'😞',':-(':'😞',
    ':D':'😃',':-D':'😃',
    'D:':'😩',
    ':P':'😛',':-P':'😛',':p':'😛',
    'XD':'😆','xD':'😆',
    ':O':'😮',':-O':'😮',':o':'😮',
    'B)':'😎','B-)':'😎',
    ':/':'😕',':-/':'😕',
    ':*':'😘',':-*':'😘',
    '&lt;3':'❤️', // <3 after escapeHtml
    ':fire:':'🔥',':heart:':'❤️',':thumbsup:':'👍',':thumbsdown:':'👎',
    ':laugh:':'😂',':cry:':'😢',':angry:':'😡',':clap:':'👏',
    ':100:':'💯',':star:':'⭐',':check:':'✅',':x:':'❌',
    ':wave:':'👋',':pray:':'🙏',':muscle:':'💪',':eyes:':'👀',
    ':skull:':'💀',':ghost:':'👻',':party:':'🎉',':rocket:':'🚀',
    ':crown:':'👑',':gem:':'💎',':rainbow:':'🌈',':sun:':'☀️',
    ':moon:':'🌙',':snow:':'❄️',':tree:':'🌳',':flower:':'🌸'
};
// Build regex from keys (escape special chars, sort longest first to match :-)  before :) )
var _emojiKeys=Object.keys(_emojiMap).sort(function(a,b){return b.length-a.length;});
var _emojiRegex=new RegExp('(^|\\s|>)('+_emojiKeys.map(function(k){return k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')(?=\\s|<|$)','g');
function convertTextEmojis(s){
    return s.replace(_emojiRegex,function(match,before,emoticon){
        return before+(_emojiMap[emoticon]||emoticon);
    });
}
function linkifyText(s){return s.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');}
function isVideoUrl(u){return /\.(mp4|webm|mov)([?#]|$)/i.test(u);}
function looksLikeEmail(s){return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s);}

// ======================== RATE-LIMIT COOLDOWN HELPER ========================
var _cooldowns = {};
function checkCooldown(key, ms) {
    var now = Date.now();
    if (_cooldowns[key] && now - _cooldowns[key] < ms) {
        var secsLeft = Math.ceil((ms - (now - _cooldowns[key])) / 1000);
        return secsLeft; // returns seconds remaining (truthy = on cooldown)
    }
    _cooldowns[key] = now;
    return 0; // not on cooldown
}

// ======================== KLIPY GIF API ========================
var _KLIPY_KEY='cDQONkvWzqpz8dILu8iczUr38kTZhaGckOuJgnYLC8XixymLWYYXWuGdxH1Zw4V6';
var _gifCache={};
function _parseKlipyGif(g){
    var f=g.file||{};
    var sm=f.sm||f.md||f.hd||f.xs||{};
    var hd=f.hd||f.md||f.sm||{};
    var preview=(sm.webp&&sm.webp.url)||(sm.gif&&sm.gif.url)||'';
    var full=(hd.gif&&hd.gif.url)||(hd.webp&&hd.webp.url)||(sm.gif&&sm.gif.url)||preview;
    return{preview:preview,full:full,title:g.title||''};
}
async function searchKlipyGifs(query,perPage){
    perPage=perPage||20;var key='s:'+query+':'+perPage;
    if(_gifCache[key])return _gifCache[key];
    try{
        var r=await fetch('https://api.klipy.com/api/v1/'+_KLIPY_KEY+'/gifs/search?q='+encodeURIComponent(query)+'&per_page='+perPage);
        var d=await r.json();
        var items=(d.data&&d.data.data)||d.data||[];
        var results=items.map(_parseKlipyGif).filter(function(g){return g.preview;});
        _gifCache[key]=results;return results;
    }catch(e){console.error('Klipy search error:',e);return[];}
}
async function getKlipyTrending(perPage){
    perPage=perPage||20;var key='t:'+perPage;
    if(_gifCache[key])return _gifCache[key];
    try{
        var r=await fetch('https://api.klipy.com/api/v1/'+_KLIPY_KEY+'/gifs/trending?per_page='+perPage);
        var d=await r.json();
        var items=(d.data&&d.data.data)||d.data||[];
        var results=items.map(_parseKlipyGif).filter(function(g){return g.preview;});
        _gifCache[key]=results;return results;
    }catch(e){console.error('Klipy trending error:',e);return[];}
}

// ======================== AUTHENTICATION (Supabase) ========================
// currentUser holds the live profile row; currentAuthUser holds auth.users row
var currentUser = null;    // { id, username, display_name, bio, avatar_url, ... }
var currentAuthUser = null;
var _isAdmin = false;

var loginPage = document.getElementById('loginPage');
var appShell = document.getElementById('appShell');
var loginForm = document.getElementById('loginForm');
var loginError = document.getElementById('loginError');
var loginEmail = document.getElementById('loginEmail');
var loginPass = document.getElementById('loginPassword');
var signupForm = document.getElementById('signupForm');
var signupError = document.getElementById('signupError');

function showApp() {
    loginPage.classList.remove('visible');
    loginPage.classList.add('hidden');
    appShell.classList.add('active');
}
function showLogin() {
    appShell.classList.remove('active');
    loginPage.classList.remove('hidden');
    loginPage.classList.add('visible');
    // Remove auth cloak so login page fades in (prevents flash on refresh)
    var cloak=document.getElementById('auth-cloak');if(cloak)cloak.remove();
}

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function () {
    var inp = loginPass;
    var icon = this.querySelector('i');
    if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
});

// Login form submit
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.classList.remove('show');
    var submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    var input = loginEmail.value.trim();
    var pw = loginPass.value;
    if (!input || !pw) { loginError.textContent = 'Please enter both username/email and password.'; loginError.classList.add('show'); return; }
    var cdSecs = checkCooldown('login', 3000);
    if (cdSecs) { loginError.textContent = 'Please wait ' + cdSecs + 's before trying again.'; loginError.classList.add('show'); return; }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    try {
        var email = input;
        if (!input.includes('@')) {
            var looked = await sbGetEmailByUsername(input);
            if (!looked) throw { message: 'Username not found.' };
            email = looked;
        }
        await sbSignIn(email, pw);
        loginForm.reset();
        // onAuthStateChange will call initApp()
    } catch (err) {
        var msg = err.message || 'Invalid email or password.';
        if ((err.status === 429) || /rate/i.test(msg)) msg = 'Too many login attempts. Please wait a moment and try again.';
        loginError.textContent = msg;
        loginError.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
    }
});

// Signup form submit
signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    signupError.classList.remove('show');
    var submitBtn = signupForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    var firstName = document.getElementById('signupFirstName').value.trim();
    var lastName = document.getElementById('signupLastName').value.trim();
    var username = document.getElementById('signupUsername').value.trim();
    var email = document.getElementById('signupEmail').value.trim();
    var pw = document.getElementById('signupPassword').value;
    var birthday = document.getElementById('signupBirthday').value;
    var termsChecked = document.getElementById('signupTerms').checked;
    if (!firstName || !lastName) { signupError.textContent = 'First and last name are required.'; signupError.classList.add('show'); return; }
    if (looksLikeEmail(firstName)||looksLikeEmail(lastName)||looksLikeEmail(username)) { signupError.textContent = 'Names and usernames cannot be email addresses.'; signupError.classList.add('show'); return; }
    if (!username || !email || !pw) { signupError.textContent = 'All fields are required.'; signupError.classList.add('show'); return; }
    if (pw.length < 6) { signupError.textContent = 'Password must be at least 6 characters.'; signupError.classList.add('show'); return; }
    if (!birthday) { signupError.textContent = 'Please enter your date of birth.'; signupError.classList.add('show'); return; }
    var ageDiff = Date.now() - new Date(birthday).getTime();
    if (ageDiff < 13 * 365.25 * 24 * 60 * 60 * 1000) { signupError.textContent = 'You must be at least 13 years old to use BlipVibe.'; signupError.classList.add('show'); return; }
    if (!termsChecked) { signupError.textContent = 'You must agree to the Terms of Use.'; signupError.classList.add('show'); return; }
    var cdSecs = checkCooldown('signup', 5000);
    if (cdSecs) { signupError.textContent = 'Please wait ' + cdSecs + 's before trying again.'; signupError.classList.add('show'); return; }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    try {
        var result = await sbSignUp(email, pw, username, birthday, firstName, lastName);
        // If email confirmation is disabled, Supabase returns a session directly.
        // If enabled, session is null — user must confirm email first.
        if (result.session) {
            // Session exists: auto-signed-in, onAuthStateChange will fire
            // Mark TOS as accepted — they just agreed during signup
            _tosAccepted = true;
            try { localStorage.setItem('blipvibe_tos_v_'+result.user.id, String(TOS_VERSION)); } catch(e){}
            closeSignupModal();
        } else {
            // No session: email confirmation required
            signupError.textContent = 'Check your email to confirm your account, then sign in.';
            signupError.classList.add('show');
            signupError.style.color = '#22c55e';
            signupForm.reset();
        }
    } catch (err) {
        var msg = err.message || 'Signup failed.';
        if ((err.status === 429) || /rate/i.test(msg)) msg = 'Too many signup attempts. Please wait a moment and try again.';
        signupError.textContent = msg;
        signupError.style.color = '';
        signupError.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account <i class="fas fa-arrow-right"></i>';
    }
});

// Toggle between login and signup forms
document.querySelector('.login-create').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('signupOverlay').classList.add('active');
});
function closeSignupModal() {
    document.getElementById('signupOverlay').classList.remove('active');
    signupForm.reset();
    var err = document.getElementById('signupError'); if(err) err.style.display='none';
}
document.getElementById('signupClose').addEventListener('click', closeSignupModal);
document.getElementById('signupOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeSignupModal();
});
document.querySelector('.login-back') && document.querySelector('.login-back').addEventListener('click', function (e) {
    e.preventDefault();
    closeSignupModal();
});

// Forgot password
document.querySelector('.login-forgot').addEventListener('click', async function (e) {
    e.preventDefault();
    var email = loginEmail.value.trim();
    if (!email) { loginError.textContent = 'Enter your email first, then click Forgot password.'; loginError.classList.add('show'); return; }
    var cdSecs = checkCooldown('reset', 10000);
    if (cdSecs) { loginError.textContent = 'Please wait ' + cdSecs + 's before requesting another reset.'; loginError.classList.add('show'); return; }
    try {
        await sb.auth.resetPasswordForEmail(email);
        loginError.textContent = 'Password reset email sent! Check your inbox.';
        loginError.classList.add('show');
        loginError.style.color = 'var(--primary)';
    } catch (err) {
        var msg = err.message || 'Password reset failed.';
        if ((err.status === 429) || /rate/i.test(msg)) msg = 'Too many reset requests. Please wait a moment and try again.';
        loginError.textContent = msg;
        loginError.classList.add('show');
    }
});

// Logout handler (wired later after DOM references are set)
function handleLogout() {
    syncSkinDataToSupabase(true); // flush User A's data immediately
    clearTimeout(_skinSyncTimer); // kill any pending debounce so it can't write to User B
    _skinSyncTimer=null;
    // Clean up all realtime subscriptions to prevent duplicate listeners on re-login
    _realtimeSubs.forEach(function(ch){try{sb.removeChannel(ch);}catch(e){}});
    _realtimeSubs=[];
    // Clear the saveState interval and last seen updater
    if(_saveStateInterval){clearInterval(_saveStateInterval);_saveStateInterval=null;}
    if(_lastSeenInterval){clearInterval(_lastSeenInterval);_lastSeenInterval=null;}
    sbSignOut().then(function () {
        currentUser = null;
        currentAuthUser = null;
        _initAppDone = false;
        resetAllCustomizations();
        try{sessionStorage.removeItem('blipvibe_lastPage');}catch(e){}
        showLogin();
    });
}
// Reset all in-memory state and visual customizations so nothing leaks between accounts
function resetAllCustomizations(){
    // Kill any pending Supabase sync timer to prevent writing to the wrong user
    clearTimeout(_skinSyncTimer);_skinSyncTimer=null;
    // Reset state object to defaults
    state.coins=0;state.following=0;state.followers=0;state.followedUsers={};
    state.ownedSkins={};state.activeSkin=null;state.ownedFonts={};state.activeFont=null;
    state.ownedLogos={};state.activeLogo=null;state.notifications=[];state.joinedGroups={};
    state.messages={};state.likedPosts={};state.coverPhoto=null;state.comments={};
    state.ownedIconSets={};state.activeIconSet=null;state.ownedCoinSkins={};state.activeCoinSkin=null;
    state.ownedTemplates={};state.activeTemplate=null;state.ownedNavStyles={};state.activeNavStyle=null;
    state.ownedPremiumSkins={};state.activePremiumSkin=null;state.groupPosts={};
    state.privateFollowers=false;state.dislikedPosts={};state.pinnedPosts={};state.earnedBadges={};
    state.photos={profile:[],cover:[],post:[],albums:[]};
    // Reset social/preference data
    blockedUsers={};likedComments={};dislikedComments={};commentCoinAwarded={};
    savedFolders=[{id:'fav',name:'Favorites',posts:[]}];hiddenPosts={};reportedPosts=[];
    state.postCoinCount=0;state.commentCoinPosts={};state.replyCoinPosts={};
    state.groupCoins={};state.groupOwnedSkins={};state.groupOwnedPremiumSkins={};
    state.groupActiveSkin={};state.groupActivePremiumSkin={};state.groupPremiumBg={};
    state.groupPostCoinCount={};state.groupCommentCoinPosts={};state.groupReplyCoinPosts={};
    settings={darkMode:false,notifSound:true,privateProfile:false,autoplay:true,commentOrder:'top',showLocation:false};
    // Reset premium background globals
    premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;
    // Strip visual customizations from DOM
    applySkin(null,true); // resets colors + removes skin classes
    applyFont(null,true); // resets font
    applyTemplate(null,true); // removes template classes
    applyNavStyle(null,true); // removes nav style classes
    applyLogo(null); // resets logo text
    applyIconSet(null,true); // resets icons
    applyCoinSkin(null,true); // resets coin icon
    updatePremiumBg(); // clears premium background
    // Remove cover photo from both home timeline and profile view
    var tc=$('#timelineCover');if(tc) tc.style.backgroundImage='';
    var pvb=$('#pvCoverBanner');if(pvb) pvb.style.backgroundImage='';
    var coverBtn=$('#coverEditBtn');if(coverBtn) coverBtn.innerHTML='<i class="fas fa-camera"></i> Add Cover Photo';
    // Reset dark mode body styles
    document.body.style.background='';document.body.style.color='';
}

// ======================== TERMS OF SERVICE ACCEPTANCE ========================
// Bump this version whenever the TOS changes — all users must re-accept
var TOS_VERSION = 9; // v9 = Apr 7 2026 — AI-generated music (Suno) disclosure, music library terms, privacy policy updated
var _tosAccepted = false;

function checkTosAccepted(){
    if(!currentUser) return false;
    // Check skin_data first (cross-device), then localStorage fallback
    var sd = currentUser.skin_data || {};
    if(sd.tosAcceptedVersion >= TOS_VERSION) return true;
    try { if(parseInt(localStorage.getItem('blipvibe_tos_v_'+currentUser.id))>=TOS_VERSION) return true; } catch(e){}
    return false;
}

function markTosAccepted(){
    if(!currentUser) return;
    _tosAccepted = true;
    // Persist to localStorage immediately
    try { localStorage.setItem('blipvibe_tos_v_'+currentUser.id, String(TOS_VERSION)); } catch(e){}
    // Persist to Supabase skin_data for cross-device sync
    syncSkinDataToSupabase(true);
}

function showTosModal(){
    return new Promise(function(resolve){
        var overlay=document.createElement('div');
        overlay.className='tos-splash-overlay';
        overlay.innerHTML='<div class="tos-splash-modal">'
            +'<h3 style="margin:0 0 12px;font-size:18px;color:#1e293b;">Updated Terms of Use</h3>'
            +'<p style="margin:0 0 12px;font-size:13px;color:#64748b;">We\'ve updated our Terms of Use. Please review and accept to continue using BlipVibe.</p>'
            +'<div class="tos-splash-scroll">'
            +'<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;margin-bottom:16px;">'
            +'<h5 style="margin:0 0 8px;font-size:14px;color:#5b21b6;"><i class="fas fa-bell" style="margin-right:6px;"></i>What\u2019s Changed (v9 \u2014 April 7, 2026)</h5>'
            +'<ul style="margin:0 0 0 16px;font-size:13px;color:#1e293b;line-height:1.7;">'
            +'<li style="color:#1e293b;"><strong style="color:#1e293b;">BlipVibe Music Library</strong> \u2014 new Section 5a added: AI-generated music created via Suno AI under commercial license. Users can purchase songs with Coins for profile, group, and story use. No downloading or redistribution. AI-generated content copyright disclosure included.</li>'
            +'<li style="color:#1e293b;"><strong style="color:#1e293b;">Privacy Policy updated</strong> \u2014 music preferences, song purchases, and playback settings now disclosed. Suno AI added to third-party services list.</li>'
            +'<li style="color:#1e293b;"><strong style="color:#1e293b;">Profile &amp; Story Music</strong> \u2014 set songs on your profile and stories. Visitors control playback (play/pause/volume).</li>'
            +'</ul></div>'
            +'<h4>BlipVibe LLC \u2013 Terms of Use</h4>'
            +'<p><strong>Effective Date:</strong> April 7, 2026</p>'
            +'<p>These Terms of Use ("Terms") constitute a <strong>legally binding agreement</strong> between you and <strong>BlipVibe LLC</strong>, a Tennessee limited liability company ("BlipVibe", "we", "us", "our"), with its principal place of business at 116 Agnes Rd Ste 200, Knoxville, TN 37919. By continuing to use BlipVibe, you agree to be bound by these Terms, our <strong>Privacy Policy</strong>, <strong>Acceptable Use Policy</strong>, <strong>DMCA Policy</strong>, and <strong>Arbitration &amp; Dispute Resolution Agreement</strong> (Section 19), each incorporated herein by reference.</p>'
            +'<h5>1. Eligibility &amp; Age Requirement</h5>'
            +'<p>You must be at least <strong>13 years old</strong> to use BlipVibe. If you are between 13 and 17, you represent that your parent or legal guardian has reviewed and consents to these Terms. BlipVibe does not knowingly collect personal information from children under 13 (COPPA). If we discover a user is under 13, their account will be terminated and data deleted.</p>'
            +'<h5>2. Account Registration &amp; Security</h5>'
            +'<p>You agree to provide accurate information, keep your credentials confidential, not transfer your account, and notify us immediately of unauthorized access at <strong>hello@blipvibe.com</strong>. You are responsible for all activity under your account.</p>'
            +'<h5>3. Free Expression Policy</h5>'
            +'<p>BlipVibe supports open conversation. The following is strictly prohibited: racial slurs, sexual orientation slurs, credible threats of violence, doxing, and direct harassment or intimidation. See our Acceptable Use Policy for the complete list.</p>'
            +'<h5>4. User Content &amp; Responsibility</h5>'
            +'<p>You are solely responsible for all content you post. You must own the content or have rights to share it. You agree not to post illegal content, spam, malicious code, or copyrighted material without authorization.</p>'
            +'<p>BlipVibe does not claim ownership of your content. By posting, you grant BlipVibe a non-exclusive, worldwide, royalty-free, sublicensable license to use, display, reproduce, and distribute your content within and in connection with the Service. This license ends when you delete your content or account, except where shared by others or where retention is required by law.</p>'
            +'<h5>5. Embedded &amp; Third-Party Media</h5>'
            +'<p>BlipVibe displays embedded media from YouTube, Spotify, TikTok, Instagram, Twitter/X, Vimeo, and SoundCloud using their official embed tools. BlipVibe does not host or redistribute third-party content. These embeds may set cookies and collect data per each platform\'s own privacy policy. The Service may contain links to third-party websites; BlipVibe does not control or assume responsibility for third-party content.</p>'
            +'<h5>5a. BlipVibe Music Library (AI-Generated Music)</h5>'
            +'<p>BlipVibe offers original music created using Suno AI under a paid commercial license. Users may purchase access to these tracks using Coins for use as profile songs, group songs, or story music within BlipVibe. Users do not acquire ownership or external rights \u2014 usage is limited to the BlipVibe platform. Tracks may not be downloaded, extracted, or redistributed. All tracks are AI-generated and may not be eligible for copyright protection under current U.S. law.</p>'
            +'<h5>6. Copyright &amp; DMCA Policy</h5>'
            +'<p>BlipVibe complies with the DMCA (17 U.S.C. \u00a7 512). BlipVibe has registered its designated agent with the U.S. Copyright Office (DMCA Registration: DMCA-1070726). Send takedown notices to <strong>dmca@blipvibe.com</strong> with: your name and contact info, identification of the copyrighted work, the URL of the infringing material, a good faith belief statement, a statement under penalty of perjury that the information is accurate, and your signature. Counter-notifications and full procedures are detailed in our DMCA Policy. Knowingly false claims may result in liability under \u00a7 512(f).</p>'
            +'<p>BlipVibe does not pre-screen user content but reserves the right to remove content that violates this policy or applicable law. BlipVibe accommodates and does not interfere with standard technical measures used by copyright owners to identify or protect copyrighted works.</p>'
            +'<p>Users are responsible for ensuring they have the necessary rights to any audio content uploaded, including music. Unauthorized use of copyrighted music is prohibited.</p>'
            +'<h5>7. Repeat Infringer Policy</h5>'
            +'<p>BlipVibe may terminate, in appropriate circumstances, the accounts of users who are repeat infringers at its sole discretion.</p>'
            +'<h5>8. Virtual Currency (Coins)</h5>'
            +'<p>Coins constitute a <strong>limited, revocable license</strong>, not ownership. Coins have <strong>no real-world monetary value</strong>, no investment or speculative value, cannot be exchanged for cash, are non-transferable, and are used only for cosmetic items. Coins are non-refundable except where required by applicable law. BlipVibe may modify or reset Coin balances at any time. Coins are forfeited upon account termination. App Store purchases are subject to Apple\'s terms and refund policies.</p>'
            +'<h5>9. Direct Messages</h5>'
            +'<p>Messages are stored on our servers and are <strong>not end-to-end encrypted</strong>. BlipVibe may access messages if required by law or to enforce these Terms. Do not share sensitive personal information through messages.</p>'
            +'<h5>10. Location Features</h5>'
            +'<p>Location sharing is <strong>off by default</strong> and must be manually enabled. If enabled, only your approximate area is shown on posts. Precise GPS coordinates are not stored.</p>'
            +'<h5>11. Report Feature</h5>'
            +'<p>Users may report content that violates these Terms. BlipVibe reviews reports and may take action as necessary.</p>'
            +'<h5>12. Privacy &amp; Data</h5>'
            +'<p>Your use of the Service is governed by our Privacy Policy. BlipVibe collects account data, content, usage data, and technical data. We do <strong>not</strong> sell personal data. Data is stored using Supabase. Request account/data deletion via Settings or at <strong>hello@blipvibe.com</strong>.</p>'
            +'<h5>13. Platform Status &amp; Availability</h5>'
            +'<p>BlipVibe is in beta. Features may change or be removed. Data may be reset during development. We do not guarantee the Service will be available at all times or without interruption.</p>'
            +'<h5>14. Section 230 Safe Harbor</h5>'
            +'<p>BlipVibe is an interactive computer service under Section 230 of the Communications Decency Act (47 U.S.C. \u00a7 230). BlipVibe is not the publisher or speaker of user-generated content and does not endorse, verify, or assume responsibility for user content. Good-faith moderation actions shall not constitute editorial control.</p>'
            +'<h5>15. No Warranty</h5>'
            +'<p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. BLIPVIBE DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</strong></p>'
            +'<h5>16. Limitation of Liability</h5>'
            +'<p><strong>BLIPVIBE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, REGARDLESS OF THE THEORY OF LIABILITY. TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF AMOUNTS PAID IN THE PRECEDING 12 MONTHS OR $100 USD.</strong></p>'
            +'<h5>17. Indemnification</h5>'
            +'<p>You agree to indemnify, defend, and hold harmless BlipVibe, its operators, affiliates, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys\' fees) arising from your use of BlipVibe, your content, or your violation of these Terms.</p>'
            +'<h5>18. Account Termination</h5>'
            +'<p>BlipVibe reserves the right, at its sole discretion, to suspend or terminate your account at any time, for any reason or no reason, with or without notice. Users may request account deletion via Settings or at hello@blipvibe.com.</p>'
            +'<h5>19. Dispute Resolution &amp; Arbitration</h5>'
            +'<p><strong>PLEASE READ CAREFULLY. THIS AFFECTS YOUR RIGHT TO FILE A LAWSUIT AND HAVE A JURY TRIAL.</strong></p>'
            +'<p><strong>Informal Resolution:</strong> Contact hello@blipvibe.com and attempt to resolve disputes informally for at least 30 days before formal proceedings.</p>'
            +'<p><strong>Binding Arbitration:</strong> Unresolved disputes shall be resolved by binding individual arbitration (AAA Consumer Rules). The Federal Arbitration Act (9 U.S.C. \u00a7 1 et seq.) governs this provision. Venue: Knox County, Tennessee.</p>'
            +'<p><strong>CLASS ACTION AND JURY TRIAL WAIVER: CLAIMS MAY ONLY BE BROUGHT INDIVIDUALLY, NOT AS PART OF ANY CLASS OR REPRESENTATIVE ACTION. YOU WAIVE THE RIGHT TO A JURY TRIAL.</strong></p>'
            +'<p><strong>Small Claims Exception:</strong> Either party may bring individual claims in small claims court in Knox County, Tennessee.</p>'
            +'<p><strong>Opt-Out:</strong> Send written notice to hello@blipvibe.com within 30 days of account creation to opt out of arbitration.</p>'
            +'<p><strong>Arbitration Severability:</strong> If the class action waiver is unenforceable, the entire arbitration provision is void and disputes proceed in court in Knox County, Tennessee.</p>'
            +'<h5>20. Governing Law</h5>'
            +'<p>These Terms are governed by the laws of the State of Tennessee and applicable federal law. Any legal action not subject to arbitration shall be brought exclusively in the state or federal courts located in Knox County, Tennessee.</p>'
            +'<h5>21. Export Compliance</h5>'
            +'<p>You represent that you are not located in a U.S.-embargoed country and are not on any U.S. prohibited or restricted parties list (including OFAC Specially Designated Nationals). You agree not to use the Service in violation of U.S. export laws.</p>'
            +'<h5>22. Severability</h5>'
            +'<p>If any provision is found unenforceable, it shall be limited to the minimum extent necessary and remaining provisions remain in full force.</p>'
            +'<h5>23. Waiver</h5>'
            +'<p>Failure to enforce any provision shall not constitute a waiver. Any waiver must be in writing and signed by BlipVibe.</p>'
            +'<h5>24. Entire Agreement</h5>'
            +'<p>These Terms, together with the Privacy Policy, Acceptable Use Policy, DMCA Policy, and Arbitration Agreement, constitute the entire agreement between you and BlipVibe regarding the Service.</p>'
            +'<h5>25. Changes to Terms</h5>'
            +'<p>BlipVibe may update these Terms. All users will be required to review and accept updated Terms before continuing.</p>'
            +'<h5>26. Acceptance</h5>'
            +'<p>By continuing to use BlipVibe, you confirm you are at least 13 (and if 13\u201317, that a parent or guardian consents), have read and agree to these Terms and all incorporated policies, and understand BlipVibe is in beta.</p>'
            +'</div>'
            +'<div class="tos-splash-buttons">'
            +'<button class="btn btn-primary" id="tosAcceptBtn">I Agree</button>'
            +'<button class="btn" id="tosDeclineBtn" style="background:var(--border);color:var(--dark);">Decline</button>'
            +'</div>'
            +'</div>';
        document.body.appendChild(overlay);
        document.getElementById('tosAcceptBtn').addEventListener('click',function(){
            overlay.remove();
            markTosAccepted();
            resolve(true);
        });
        document.getElementById('tosDeclineBtn').addEventListener('click',function(){
            overlay.remove();
            resolve(false);
        });
    });
}

var DEFAULT_AVATAR = 'images/default-avatar.svg';

// Helper: get avatar URL for current user (returns placeholder if none)
function getMyAvatarUrl() {
    return (currentUser && currentUser.avatar_url) || DEFAULT_AVATAR;
}

// Helper: get avatar URL for any person/profile object
function getAvatarFor(p) {
    return (p && p.avatar_url) || DEFAULT_AVATAR;
}

// Helper: populate header UI from currentUser profile
function populateUserUI() {
    if (!currentUser) return;
    var name = currentUser.display_name || currentUser.username;
    var avatar = getMyAvatarUrl();
    // Nav bar
    var navAvatar = document.querySelector('.nav-avatar');
    if (navAvatar) navAvatar.src = avatar;
    var navUsername = document.querySelector('.nav-username');
    if (navUsername) navUsername.textContent = name;
    // Profile card sidebar
    var profAvatar = document.getElementById('profileAvatarImg');
    if (profAvatar) profAvatar.src = avatar;
    var profName = document.querySelector('.profile-name');
    if (profName) profName.textContent = name;
    var profTitle = document.querySelector('.profile-title');
    if (profTitle) profTitle.textContent = currentUser.status || '';
    var profAbout = document.querySelector('.profile-about');
    if (profAbout) profAbout.textContent = currentUser.bio || '';
    // Post create bar avatar
    var postAvatar = document.querySelector('.post-create-avatar');
    if (postAvatar) postAvatar.src = avatar;
    // Coins
    var coinEl = document.getElementById('navCoinCount');
    if (coinEl) if(_hasInfinity()){coinEl.innerHTML='<span class="infinity">\u221E</span>';}else{coinEl.textContent=currentUser.coin_balance||0;}
}

// Sync all avatar images on the page when avatar changes
function syncAllAvatars(newSrc) {
    var old = getMyAvatarUrl();
    var oldBase = old ? old.split('?')[0] : '';
    if (currentUser) currentUser.avatar_url = newSrc;
    document.querySelectorAll('img').forEach(function (img) {
        if (img.src === old || (oldBase && img.src.split('?')[0] === oldBase)) img.src = newSrc;
    });
    populateUserUI();
}

// ---- Init app after auth ----
var _initAppRunning = false;
var _initAppDone = false;
var _realtimeSubs = []; // track all realtime subscriptions for cleanup
var _saveStateInterval = null; // track the saveState interval
async function initApp() {
    if (_initAppRunning || _initAppDone) return;
    _initAppRunning = true;
    var authUser = await sbGetUser();
    if (!authUser) { _initAppRunning = false; showLogin(); return; }
    currentAuthUser = authUser;
    try {
        currentUser = await sbGetOwnProfile();
        if(!currentUser) currentUser = await sbGetProfile(authUser.id);
    } catch (e) {
        // Profile doesn't exist yet (e.g. email confirmation flow) — create it now
        try {
            currentUser = await sbEnsureProfile(authUser);
        } catch (e2) {
            console.error('Failed to create profile:', e2);
            showLogin(); return;
        }
    }
    state.coins = currentUser.coin_balance || 0;
    // Instant UI from localStorage cache (read-only hint — Supabase overwrites below)
    try{
        var cached=JSON.parse(localStorage.getItem('blipvibe_cache_'+authUser.id));
        if(cached){_applySkinDataFromCache(cached);reapplyCustomizations();}
    }catch(e){}
    // Load all state from Supabase (sole source of truth for cross-device sync)
    await loadSkinDataFromSupabase();
    // Refresh coin display after skin_data loads (infinity status may not be available earlier)
    var _coinEl=document.getElementById('navCoinCount');
    if(_coinEl) if(_hasInfinity()){_coinEl.innerHTML='<span class="infinity">\u221E</span>';}else{_coinEl.textContent=currentUser.coin_balance||0;}
    // Check TOS acceptance — existing users must accept updated terms before proceeding
    if(!checkTosAccepted()){
        populateUserUI();
        showApp();
        var accepted = await showTosModal();
        if(!accepted){
            _initAppRunning = false;
            handleLogout();
            return;
        }
    }
    populateUserUI();
    showApp();
    // Check admin status (non-blocking, UI gating only — real enforcement is server-side)
    sbIsAdmin().then(function(admin){
        _isAdmin=admin;
        var adminLink=document.getElementById('dropdownAdmin');
        if(adminLink) adminLink.style.display=admin?'':'none';
    });
    // Immediately navigate to the hash page so the user never sees home flash
    var hashPage=(location.hash||'').replace('#','');
    // Always default to home on fresh load — don't restore last page from session
    if(!hashPage) hashPage='home';
    if(hashPage&&hashPage!=='home'&&hashPage!=='profile-view'&&hashPage!=='group-view'&&hashPage.indexOf('group-view:')!==0){
        navigateTo(hashPage,true);
    }
    // Remove the pre-paint hash-nav style now that JS has taken over
    var hashFix=document.getElementById('hash-nav-fix');
    if(hashFix) hashFix.remove();
    reapplyCustomizations(); // Re-apply skins, fonts, nav styles, dark mode
    showCookieConsent(); // Show cookie banner if not yet accepted
    if(settings.showLocation) detectUserLocation(); // Only request location when user opted in
    if(currentUser.cover_photo_url) { state.coverPhoto = currentUser.cover_photo_url; applyCoverPhoto(); }
    // Parallel batch 1: Load likes, photos, follow counts, friends-of-friends concurrently
    var _parallelResults = await Promise.allSettled([
        sbGetUserLikes(currentUser.id, 'post'),
        sbGetUserLikes(currentUser.id, 'comment'),
        sbListUserAvatars(currentUser.id),
        sbListUserCovers(currentUser.id),
        sbGetUserPosts(currentUser.id, 50),
        loadFollowCounts(),
        sbGetFriendsOfFriends(currentUser.id)
    ]);
    // Process results from parallel batch
    if(_parallelResults[0].status==='fulfilled'){(_parallelResults[0].value||[]).forEach(function(l){state.likedPosts[l.target_id]=true;});}
    if(_parallelResults[1].status==='fulfilled'){(_parallelResults[1].value||[]).forEach(function(l){likedComments[l.target_id]=true;});}
    if(_parallelResults[2].status==='fulfilled'){
        var prevAvatars=_parallelResults[2].value||[];
        state.photos.profile=prevAvatars.map(function(a){return{src:a.src,date:a.date,name:a.name};});
        if(!currentUser.avatar_url&&prevAvatars.length>0){
            var latestAvatar=prevAvatars[0].src;currentUser.avatar_url=latestAvatar;populateUserUI();
            sbUpdateProfile(currentUser.id,{avatar_url:latestAvatar}).catch(function(e){console.warn('Avatar recovery error:',e);});
        }
    }
    if(_parallelResults[3].status==='fulfilled'){
        var prevCovers=_parallelResults[3].value||[];
        state.photos.cover=prevCovers.map(function(c){return{src:c.src,date:c.date,name:c.name};});
        if(!currentUser.cover_photo_url&&prevCovers.length>0){
            var latestCover=prevCovers[0].src;currentUser.cover_photo_url=latestCover;state.coverPhoto=latestCover;applyCoverPhoto();
            sbUpdateProfile(currentUser.id,{cover_photo_url:latestCover}).catch(function(e){console.warn('Cover recovery error:',e);});
        }
    }
    if(_parallelResults[4].status==='fulfilled'){
        var myPosts=_parallelResults[4].value||[];
        var postPhotos=[];
        myPosts.forEach(function(p){
            var ts=new Date(p.created_at).getTime();
            if(p.media_urls&&p.media_urls.length){
                p.media_urls.forEach(function(u){postPhotos.push({src:u,date:ts,postId:p.id,postMediaUrls:p.media_urls,isVideo:isVideoUrl(u)});});
            } else if(p.image_url){
                postPhotos.push({src:p.image_url,date:ts,postId:p.id,postMediaUrls:null,isVideo:isVideoUrl(p.image_url)});
            }
        });
        state.photos.post=postPhotos;
    }
    if(_parallelResults[6].status==='fulfilled'){_fofIds=_parallelResults[6].value||{};}else{_fofIds={};}
    renderPhotosCard();
    if(_navCurrent==='photos') renderPhotoAlbum();
    await loadGroups();
    // Load joined groups — single query instead of per-group membership check
    try {
        var myGroupIds = await sbGetUserGroupIds(currentUser.id);
        myGroupIds.forEach(function(gid){ state.joinedGroups[gid] = true; });
    } catch(e){ console.warn('Could not load group memberships:', e); }
    renderGroups();
    renderTrendingSidebar();
    await generatePosts();
    renderSuggestions();
    // Load notifications from Supabase
    try {
        var notifs = await sbGetNotifications(currentUser.id, 500);
        console.log('[Notifications] Loaded', (notifs||[]).length, 'from Supabase for user', currentUser.id);
        state.notifications = (notifs||[]).map(function(n){
            var origType=(n.data&&n.data.originalType)||n.type||'system';
            var text=n.title||n.body||'';
            if(!text&&n.data&&n.data.message) text=n.data.message;
            if(!text) text='Notification';
            return { type: origType, text: text, time: timeAgoReal(n.created_at), read: n.is_read, id: n.id, postId: (n.data&&n.data.post_id)||null, data: n.data||{} };
        });
        updateNotifBadge();
        renderNotifications();
    } catch(e){ console.error('Could not load notifications:', e); }
    // Subscribe to realtime notifications
    try {
        var _subNotif = sbSubscribeNotifications(currentUser.id, function(newNotif){
            var origType=(newNotif.data&&newNotif.data.originalType)||newNotif.type||'system';
            state.notifications.unshift({ type: origType, text: newNotif.title||newNotif.body||'', time: 'just now', read: false, id: newNotif.id, postId: (newNotif.data&&newNotif.data.post_id)||null, data: newNotif.data||{} });
            updateNotifBadge();
            renderNotifications();
        });
        if(_subNotif) _realtimeSubs.push(_subNotif);
    } catch(e){ console.warn('Realtime notifications error:', e); }
    // Subscribe to realtime posts — new posts appear without refresh
    try {
        var _subPosts = sbSubscribePosts(async function(newPost){
            if(!newPost||newPost.group_id) return; // skip group posts
            if(newPost.author_id===currentUser.id) return; // skip own posts (already in feed)
            if(blockedUsers[newPost.author_id]) return;
            try{
                var author=await sbGetProfile(newPost.author_id);
                if(!author) return;
                var fp={
                    idx:newPost.id,
                    person:{id:author.id,name:author.display_name||author.username||'User',img:null,avatar_url:author.avatar_url},
                    text:newPost.content||'',tags:[],badge:null,loc:newPost.location||null,
                    likes:0,comments:[],commentCount:0,shares:0,
                    images:newPost.media_urls&&newPost.media_urls.length?newPost.media_urls:(newPost.image_url?[newPost.image_url]:null),
                    created_at:newPost.created_at
                };
                // Don't add duplicates
                if(feedPosts.some(function(p){return p.idx===fp.idx;})) return;
                feedPosts.unshift(fp);
                renderFeed(activeFeedTab);
            }catch(e){console.warn('Realtime post enrich error:',e);}
        });
        if(_subPosts) _realtimeSubs.push(_subPosts);
    } catch(e){ console.warn('Realtime posts error:', e); }
    // Subscribe to realtime follows — follow counts update without refresh
    try {
        var _subFollows = sbSubscribeFollows(currentUser.id, function(eventType){
            loadFollowCounts().then(function(){updateFollowCounts();});
        });
        if(_subFollows) _realtimeSubs.push(_subFollows);
    } catch(e){ console.warn('Realtime follows error:', e); }
    // Subscribe to realtime likes — like counts update without refresh
    try {
        var _subLikes = sbSubscribeLikes(currentUser.id, function(eventType, row){
            if(!row||row.target_type!=='post') return;
            var post=feedPosts.find(function(p){return p.idx===row.target_id;});
            if(post){
                if(eventType==='INSERT') post.likes++;
                else if(eventType==='DELETE') post.likes=Math.max(0,post.likes-1);
                // Update the like count in the DOM without full re-render
                var likeEl=document.querySelector('.like-btn[data-id="'+row.target_id+'"] .like-count');
                if(likeEl) likeEl.textContent=post.likes;
            }
        });
        if(_subLikes) _realtimeSubs.push(_subLikes);
    } catch(e){ console.warn('Realtime likes error:', e); }
    // Load conversations and subscribe to realtime messages
    loadConversations();
    renderMsgFollowing();
    initMessageSubscription();
    _initAppRunning = false;
    _initAppDone = true;
    // Load stories
    loadStories();
    // Start last seen updater
    startLastSeenUpdater();
    // Check badges
    checkBadges();
    // Check scheduled posts
    checkScheduledPosts();
    // Show first-time feed tutorial after everything loads
    setTimeout(function(){showFeedTutorial();},500);
    // Wire up new features (join links, daily reward, push) — must run after data loads
    wireNewFeatures();
}

// Listen for auth state changes
sbOnAuthChange(function (session) {
    if (session) {
        initApp();
    } else {
        showLogin();
    }
});

// Load real stats for the login page hero section
(async function loadLoginStats() {
    try {
        var [users, posts, groups] = await Promise.all([
            sb.from('profiles').select('*', { count: 'exact', head: true }),
            sb.from('posts').select('*', { count: 'exact', head: true }),
            sb.from('groups').select('*', { count: 'exact', head: true })
        ]);
        var fmt = function(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K+' : String(n); };
        var el;
        el = document.getElementById('statUsers'); if (el) el.textContent = fmt(users.count || 0);
        el = document.getElementById('statPosts'); if (el) el.textContent = fmt(posts.count || 0);
        el = document.getElementById('statGroups'); if (el) el.textContent = fmt(groups.count || 0);
    } catch (e) { /* stats are non-critical */ }
})();

// Check session on load
(async function () {
    var user = await sbGetUser();
    if (user) {
        await initApp();
    } else {
        showLogin();
    }
})();

// ======================== STATE ========================
var myFollowers=[];
var state = {
    coins: 0,
    following: 0,
    followers: 0,
    followedUsers: {},
    ownedSkins: {},
    activeSkin: null,
    ownedFonts: {},
    activeFont: null,
    ownedLogos: {},
    activeLogo: null,
    notifications: [],
    joinedGroups: {},
    messages: {},
    likedPosts: {},
    coverPhoto: null,
    comments: {},
    ownedIconSets: {},
    activeIconSet: null,
    ownedCoinSkins: {},
    activeCoinSkin: null,
    ownedTemplates: {},
    activeTemplate: null,
    ownedNavStyles: {},
    activeNavStyle: null,
    ownedPremiumSkins: {},
    activePremiumSkin: null,
    groupPosts: {},
    privateFollowers: false,
    dislikedPosts: {},
    photos:{profile:[],cover:[],post:[],albums:[]},
    postCoinCount: 0,
    commentCoinPosts: {},
    replyCoinPosts: {},
    groupCoins: {},
    groupOwnedSkins: {},
    groupOwnedPremiumSkins: {},
    groupActiveSkin: {},
    groupActivePremiumSkin: {},
    groupPremiumBg: {},
    groupOwnedFonts: {},
    groupActiveFont: {},
    groupPostCoinCount: {},
    groupCommentCoinPosts: {},
    groupReplyCoinPosts: {}
};
var settings={darkMode:false,notifSound:true,privateProfile:false,autoplay:true,commentOrder:'top',showLocation:false};
var userLocation=null; // Detected state/region from geolocation

// Persist state to localStorage (keyed per user)
function saveState(){
    if(!currentUser) return;
    syncSkinDataToSupabase();
}
var _skinSyncTimer=null;
function _buildSkinData(){
    var _bk=_pvSaved||_gvSaved||null;
    return {
        activeSkin:(_bk?_bk.skin:state.activeSkin)||null,
        activePremiumSkin:(_bk?_bk.premiumSkin:state.activePremiumSkin)||null,
        activeFont:(_bk&&_bk.font!==undefined?_bk.font:state.activeFont)||null,
        activeTemplate:(_bk&&_bk.tpl!==undefined?_bk.tpl:state.activeTemplate)||null,
        activeNavStyle:state.activeNavStyle||null,
        activeIconSet:state.activeIconSet||null,
        activeLogo:state.activeLogo||null,
        activeCoinSkin:state.activeCoinSkin||null,
        premiumBgUrl:(_bk?_bk.bgImage:premiumBgImage)||null,
        premiumBgOverlay:(_bk?_bk.bgOverlay:premiumBgOverlay)!=null?(_bk?_bk.bgOverlay:premiumBgOverlay):0,
        premiumBgDarkness:(_bk?_bk.bgDarkness:premiumBgDarkness)!=null?(_bk?_bk.bgDarkness:premiumBgDarkness):0,
        premiumCardTransparency:(_bk?_bk.cardTrans:premiumCardTransparency)!=null?(_bk?_bk.cardTrans:premiumCardTransparency):0.1,
        ownedSkins:state.ownedSkins||{},
        ownedPremiumSkins:state.ownedPremiumSkins||{},
        ownedFonts:state.ownedFonts||{},
        ownedTemplates:state.ownedTemplates||{},
        ownedNavStyles:state.ownedNavStyles||{},
        ownedIconSets:state.ownedIconSets||{},
        ownedLogos:state.ownedLogos||{},
        ownedCoinSkins:state.ownedCoinSkins||{},
        settings:settings,
        blockedUsers:blockedUsers||{},
        dislikedPosts:state.dislikedPosts||{},
        dislikedComments:dislikedComments||{},
        commentCoinAwarded:commentCoinAwarded||{},
        savedFolders:savedFolders||[],
        hiddenPosts:hiddenPosts||{},
        reportedPosts:reportedPosts||[],
        pinnedPosts:state.pinnedPosts||{},
        earnedBadges:state.earnedBadges||{},
        mutedUsers:mutedUsers||{},
        notifPrefs:_notifPrefs||{},
        tosAcceptedVersion:_tosAccepted?TOS_VERSION:((currentUser&&currentUser.skin_data&&currentUser.skin_data.tosAcceptedVersion)||0),
        tutorialsSeen:_tutorialsSeen||{},
        infinityCoins:state._infinityCoins||(currentUser&&currentUser.skin_data&&currentUser.skin_data.infinityCoins)||false
    };
}
function syncSkinDataToSupabase(immediate){
    if(!currentUser) return;
    clearTimeout(_skinSyncTimer);
    function doSync(){
        sbUpdateProfile(currentUser.id,{skin_data:_buildSkinData()}).catch(function(e){
            console.warn('Skin data sync error:',e);
        });
    }
    if(immediate) doSync();
    else _skinSyncTimer=setTimeout(doSync,2000);
}
function _applySkinDataFromCache(sd){
    if(!sd) return;
    // Override active customizations
    if('activeSkin' in sd) state.activeSkin=sd.activeSkin||null;
    if('activePremiumSkin' in sd) state.activePremiumSkin=sd.activePremiumSkin||null;
    if('activeFont' in sd) state.activeFont=sd.activeFont||null;
    if('activeTemplate' in sd) state.activeTemplate=sd.activeTemplate||null;
    if('activeNavStyle' in sd) state.activeNavStyle=sd.activeNavStyle||null;
    if('activeIconSet' in sd) state.activeIconSet=sd.activeIconSet||null;
    if('activeLogo' in sd) state.activeLogo=sd.activeLogo||null;
    if('activeCoinSkin' in sd) state.activeCoinSkin=sd.activeCoinSkin||null;
    if('premiumBgUrl' in sd) premiumBgImage=sd.premiumBgUrl||null;
    if(sd.premiumBgOverlay!==undefined) premiumBgOverlay=sd.premiumBgOverlay;
    if(sd.premiumBgDarkness!==undefined) premiumBgDarkness=sd.premiumBgDarkness;
    if(sd.premiumCardTransparency!==undefined) premiumCardTransparency=sd.premiumCardTransparency;
    // Replace owned items
    state.ownedSkins=sd.ownedSkins||{};
    state.ownedPremiumSkins=sd.ownedPremiumSkins||{};
    state.ownedFonts=sd.ownedFonts||{};
    state.ownedTemplates=sd.ownedTemplates||{};
    state.ownedNavStyles=sd.ownedNavStyles||{};
    state.ownedIconSets=sd.ownedIconSets||{};
    state.ownedLogos=sd.ownedLogos||{};
    state.ownedCoinSkins=sd.ownedCoinSkins||{};
    // Sync settings (dark mode, etc.)
    if(sd.settings){
        if(sd.settings.darkMode!==undefined) settings.darkMode=!!sd.settings.darkMode;
        if(sd.settings.notifSound!==undefined) settings.notifSound=sd.settings.notifSound;
        if(sd.settings.privateProfile!==undefined) settings.privateProfile=!!sd.settings.privateProfile;
        if(sd.settings.commentOrder) settings.commentOrder=sd.settings.commentOrder;
        if(sd.settings.showLocation!==undefined) settings.showLocation=sd.settings.showLocation;
    }
    // Restore social/preference data (full replacement — not merge)
    if(sd.blockedUsers&&typeof sd.blockedUsers==='object') blockedUsers=sd.blockedUsers;
    if(sd.dislikedPosts&&typeof sd.dislikedPosts==='object') state.dislikedPosts=sd.dislikedPosts;
    if(sd.dislikedComments&&typeof sd.dislikedComments==='object') dislikedComments=sd.dislikedComments;
    if(sd.commentCoinAwarded&&typeof sd.commentCoinAwarded==='object') commentCoinAwarded=sd.commentCoinAwarded;
    if(Array.isArray(sd.savedFolders)&&sd.savedFolders.length) savedFolders=sd.savedFolders;
    if(sd.hiddenPosts&&typeof sd.hiddenPosts==='object') hiddenPosts=sd.hiddenPosts;
    if(Array.isArray(sd.reportedPosts)) reportedPosts=sd.reportedPosts;
    if(sd.tutorialsSeen&&typeof sd.tutorialsSeen==='object') _tutorialsSeen=sd.tutorialsSeen;
    if(sd.pinnedPosts&&typeof sd.pinnedPosts==='object') state.pinnedPosts=sd.pinnedPosts;
    if(sd.earnedBadges&&typeof sd.earnedBadges==='object') state.earnedBadges=sd.earnedBadges;
    if(sd.mutedUsers&&typeof sd.mutedUsers==='object') mutedUsers=sd.mutedUsers;
    if(sd.notifPrefs&&typeof sd.notifPrefs==='object') _notifPrefs=sd.notifPrefs;
    if(sd.settings&&sd.settings.messagePrivacy) settings.messagePrivacy=sd.settings.messagePrivacy;
    if(sd.infinityCoins) state._infinityCoins=true;
    // Group skin data now loaded from group's own skin_data column (see loadGroups)
}
async function loadSkinDataFromSupabase(){
    if(!currentUser) return;
    try{
        // Must use sbGetOwnProfile (SECURITY DEFINER RPC) — skin_data SELECT
        // is revoked from authenticated role, so sbGetProfile returns null for it
        var profile=await sbGetOwnProfile();
        if(!profile||!profile.skin_data) return;
        var sd=profile.skin_data;
        _applySkinDataFromCache(sd);
        // Write to localStorage as read-only cache for instant load on next visit
        try{localStorage.setItem('blipvibe_cache_'+currentUser.id,JSON.stringify(sd));}catch(e){}
    }catch(e){console.warn('Load skin data from Supabase:',e);}
}
function loadState(){}
function reapplyCustomizations(){
    if(state.activePremiumSkin) applyPremiumSkin(state.activePremiumSkin,true);
    else if(state.activeSkin) applySkin(state.activeSkin,true);
    // If in group view, apply group font instead of personal font
    if(_activeGroupId&&state.groupActiveFont[_activeGroupId]) applyFont(state.groupActiveFont[_activeGroupId],true);
    else if(state.activeFont) applyFont(state.activeFont,true);
    if(state.activeLogo) applyLogo(state.activeLogo);
    if(state.activeIconSet) applyIconSet(state.activeIconSet,true);
    if(state.activeCoinSkin) applyCoinSkin(state.activeCoinSkin,true);
    if(state.activeTemplate) applyTemplate(state.activeTemplate,true);
    if(state.activeNavStyle) applyNavStyle(state.activeNavStyle,true);
    if(premiumBgImage&&state.activePremiumSkin) updatePremiumBg();
    if(settings.darkMode){document.body.style.background='#1a1a2e';document.body.style.color='#eee';}
    if(settings.lightMode) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
    requestAnimationFrame(syncNavPadding);
}
// Auto-save state on page leave and periodically
window.addEventListener('beforeunload',function(){saveState();});
_saveStateInterval=setInterval(function(){saveState();},10000); // save every 10s as safety net
// Cross-device sync: push when leaving, pull when returning
document.addEventListener('visibilitychange',function(){
    if(!currentUser) return;
    if(document.visibilityState==='hidden'){
        // Sync immediately when page goes hidden (reliable on mobile unlike beforeunload)
        syncSkinDataToSupabase(true);
    } else if(document.visibilityState==='visible'){
        // Pull latest settings when tab regains focus (picks up changes from other devices)
        // Skip skin reapply if in group view — group skin should stay applied
        if(_activeGroupId){
            var _gid=_activeGroupId;
            loadSkinDataFromSupabase().then(function(){
                // Re-apply group font after state refresh from Supabase
                if(_activeGroupId===_gid){
                    var gFont=state.groupActiveFont[_gid]||null;
                    applyFont(gFont,true);
                }
                saveState();
            });
        } else {
            loadSkinDataFromSupabase().then(function(){
                reapplyCustomizations();
                saveState();
            });
        }
    }
});

// Load follow counts from Supabase
async function loadFollowCounts() {
    if (!currentUser) return;
    try {
        var counts = await sbGetFollowCounts(currentUser.id);
        state.following = counts.following;
        state.followers = counts.followers;
        updateFollowCounts();
        // Build followedUsers map
        var following = await sbGetFollowing(currentUser.id);
        state.followedUsers = {};
        following.forEach(function (p) { state.followedUsers[p.id] = true; });
    } catch (e) { console.error('loadFollowCounts:', e); }
}

function getMyAvatar(){return getMyAvatarUrl();}
// syncAllAvatars is now defined in the auth section above

// ======================== SAVED / HIDDEN / REPORTS (in-memory, persisted to Supabase later) ========================
// These stay in-memory for now — can be moved to a Supabase table later.
var savedFolders=[{id:'fav',name:'Favorites',posts:[]}];
var hiddenPosts={};
var _fofIds={}; // friends-of-friends IDs for discover tab
var reportedPosts=[];
function persistSaved(){saveState();}
function persistHidden(){saveState();}
function persistReports(){saveState();syncSkinDataToSupabase(true);}
var blockedUsers={};
var likedComments={};
var dislikedComments={};
var commentCoinAwarded={};
var _tutorialsSeen={};
function persistBlocked(){saveState();syncSkinDataToSupabase(true);}
function findPostFolder(pid){var s=String(pid);for(var i=0;i<savedFolders.length;i++){if(savedFolders[i].posts.indexOf(s)!==-1)return savedFolders[i];}return null;}

// ======================== DATA ========================
// All user/group/message data is loaded from Supabase. No fake data.
var groups = []; // Loaded from Supabase

var badgeTypes = [
    {text:'Trending',icon:'fa-fire',cls:'badge-red'},{text:'Creator',icon:'fa-camera',cls:'badge-purple'},
    {text:'Popular',icon:'fa-star',cls:'badge-orange'},{text:'Active',icon:'fa-bolt',cls:'badge-green'},
    {text:'New',icon:'fa-sparkles',cls:'badge-blue'}
];
// Detect user's state/region via browser geolocation
function detectUserLocation(){
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos){
        var lat=pos.coords.latitude,lon=pos.coords.longitude;
        fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json&zoom=5')
            .then(function(r){return r.json();})
            .then(function(data){
                var addr=data.address||{};
                userLocation=addr.state||addr.region||addr.country||null;
            })
            .catch(function(){});
    },function(){},{ enableHighAccuracy:false, timeout:10000, maximumAge:300000 });
}

// Load groups from Supabase
async function loadGroups() {
    try {
        var raw = await sbGetGroups();
        groups = raw.map(function(g){
            var gsd=g.skin_data||{};
            // Hydrate shared group skin state from group's skin_data
            if(gsd.activeSkin) state.groupActiveSkin[g.id]=gsd.activeSkin;
            if(gsd.activePremiumSkin) state.groupActivePremiumSkin[g.id]=gsd.activePremiumSkin;
            if(gsd.activeFont) state.groupActiveFont[g.id]=gsd.activeFont;
            if(gsd.premiumBg) state.groupPremiumBg[g.id]=gsd.premiumBg;
            if(gsd.ownedSkins) state.groupOwnedSkins[g.id]=gsd.ownedSkins;
            if(gsd.ownedPremiumSkins) state.groupOwnedPremiumSkins[g.id]=gsd.ownedPremiumSkins;
            if(gsd.ownedFonts) state.groupOwnedFonts[g.id]=gsd.ownedFonts;
            if(gsd.ownedSongs){if(!state.groupOwnedSongs) state.groupOwnedSongs={};state.groupOwnedSongs[g.id]=gsd.ownedSongs;}
            if(gsd.activeSong){if(!state.groupActiveSong) state.groupActiveSong={};state.groupActiveSong[g.id]=gsd.activeSong;}
            return {
                id: g.id,
                name: g.name,
                desc: g.description || '',
                icon: g.icon || 'fa-users',
                color: g.color || '#5cbdb9',
                members: (g.member_count && g.member_count[0]) ? g.member_count[0].count : 0,
                owner_id: g.owner_id,
                owner: g.owner,
                createdBy: (currentUser && g.owner_id === currentUser.id) ? 'me' : g.owner_id,
                description: g.description || '',
                member_count: g.member_count,
                mods: [],
                rules: g.rules || null,
                coverPhoto: g.cover_photo_url || null,
                profileImg: g.avatar_url || null,
                coin_balance: g.coin_balance || 0
            };
        });
    } catch(e) { console.error('loadGroups:', e); groups = []; }
}

function getMyGroupRole(group){ return currentUser && group.owner && group.owner.id === currentUser.id ? 'Admin' : (state.joinedGroups[group.id] ? 'Member' : null); }
function getPersonGroupRole(){ return 'Member'; }
function roleRank(role){ return role==='Admin'?4:role==='Co-Admin'?3:role==='Moderator'?2:1; }
function canManageGroupSkins(group){
    if(!currentUser) return false;
    if(group.owner&&group.owner.id===currentUser.id) return true;
    if(!group.mods||!group.mods.length) return false;
    var myName=currentUser.display_name||currentUser.username||'';
    return group.mods.some(function(m){return m.name===myName;});
}

var skins = [
    {id:'classic',name:'Classic',desc:'Clean teal and white. The original BlipVibe look.',price:75,preview:'linear-gradient(135deg,#5cbdb9,#4aada9)',cardBg:'#fff',cardText:'#333',cardMuted:'#777'},
    {id:'midnight',name:'Midnight Dark',desc:'Dark mode profile with neon accents. Sleek and mysterious vibes.',price:75,preview:'linear-gradient(135deg,#1a1a2e,#16213e)',cardBg:'#2a2a4a',cardText:'#eee',cardMuted:'#bbb'},
    {id:'ocean',name:'Ocean Blue',desc:'Cool ocean vibes for your profile. Calm and refreshing.',price:75,preview:'linear-gradient(135deg,#1976d2,#0d47a1)',cardBg:'#e3f2fd',cardText:'#1565c0',cardMuted:'#1976d2'},
    {id:'forest',name:'Forest Green',desc:'Nature-inspired earthy tones. Peaceful and grounded.',price:75,preview:'linear-gradient(135deg,#2e7d32,#1b5e20)',cardBg:'#e8f5e9',cardText:'#2e7d32',cardMuted:'#388e3c'},
    {id:'royal',name:'Royal Purple',desc:'Elegant purple royalty vibes. Stand out from the crowd.',price:75,preview:'linear-gradient(135deg,#7b1fa2,#4a148c)',cardBg:'#f3e5f5',cardText:'#6a1b9a',cardMuted:'#7b1fa2'},
    {id:'sunset',name:'Sunset Gold',desc:'Warm golden hour aesthetic. Radiate warmth and energy.',price:75,preview:'linear-gradient(135deg,#ef6c00,#e65100)',cardBg:'#fff8e1',cardText:'#e65100',cardMuted:'#ef6c00'},
    {id:'cherry',name:'Cherry Blossom',desc:'Soft pink sakura vibes. Delicate and romantic.',price:75,preview:'linear-gradient(135deg,#d81b60,#c2185b)',cardBg:'#fce4ec',cardText:'#c2185b',cardMuted:'#d81b60'},
    {id:'slate',name:'Slate Storm',desc:'Cool dark gray sophistication. Sleek and modern.',price:75,preview:'linear-gradient(135deg,#37474f,#263238)',cardBg:'#37474f',cardText:'#eceff1',cardMuted:'#90a4ae'},
    {id:'ember',name:'Ember Glow',desc:'Warm smoldering red-orange. Bold and fiery.',price:75,preview:'linear-gradient(135deg,#e64a19,#bf360c)',cardBg:'#fbe9e7',cardText:'#bf360c',cardMuted:'#e64a19'},
    {id:'arctic',name:'Arctic Frost',desc:'Icy cyan chill. Clean and refreshing.',price:75,preview:'linear-gradient(135deg,#00acc1,#00838f)',cardBg:'#e0f7fa',cardText:'#00838f',cardMuted:'#00acc1'},
    {id:'moss',name:'Moss Garden',desc:'Olive earth tones. Calm and grounded.',price:75,preview:'linear-gradient(135deg,#689f38,#558b2f)',cardBg:'#f1f8e9',cardText:'#558b2f',cardMuted:'#689f38'},
    {id:'pastel',name:'Pastel Dream',desc:'Soft candy pastels with flowing gradient movement. Sweet and dreamy.',price:75,preview:'linear-gradient(135deg,#fbc2eb,#a6c1ee,#fdcbf1,#e6dee9)',cardBg:'#fef5ff',cardText:'#7b4a8e',cardMuted:'#b07cc3'}
];

var fonts = [
    {id:'orbitron',name:'Orbitron',desc:'Futuristic sci-fi vibes.',price:25,family:'Orbitron',scale:.92},
    {id:'rajdhani',name:'Rajdhani',desc:'Clean tech aesthetic.',price:25,family:'Rajdhani'},
    {id:'quicksand',name:'Quicksand',desc:'Soft and rounded.',price:25,family:'Quicksand'},
    {id:'pacifico',name:'Pacifico',desc:'Fun handwritten script.',price:25,family:'Pacifico',scale:.85},
    {id:'baloo',name:'Baloo 2',desc:'Bubbly and adorable.',price:25,family:'Baloo 2'},
    {id:'playfair',name:'Playfair Display',desc:'Elegant serif style.',price:25,family:'Playfair Display'},
    {id:'spacegrotesk',name:'Space Grotesk',desc:'Modern geometric sans.',price:25,family:'Space Grotesk'},
    {id:'caveat',name:'Caveat',desc:'Casual handwriting feel.',price:25,family:'Caveat',scale:.9},
    {id:'archivo',name:'Archivo',desc:'Sharp and editorial.',price:25,family:'Archivo'},
    {id:'silkscreen',name:'Silkscreen',desc:'Retro pixel vibes.',price:25,family:'Silkscreen',scale:.78},
    {id:'pressstart',name:'Press Start 2P',desc:'Arcade pixel font.',price:25,family:'Press Start 2P',scale:.55},
    {id:'righteous',name:'Righteous',desc:'Bold retro display.',price:25,family:'Righteous',scale:.9},
    {id:'satisfy',name:'Satisfy',desc:'Smooth cursive flow.',price:25,family:'Satisfy',scale:.88},
    {id:'bungee',name:'Bungee',desc:'Chunky display type.',price:25,family:'Bungee',scale:.72},
    {id:'monoton',name:'Monoton',desc:'Neon outline glow.',price:25,family:'Monoton',scale:.68}
];

var logos = [
    {id:'bv',name:'BV',desc:'Minimal and edgy.',price:35,text:'BV'},
    {id:'electric',name:'Electric',desc:'High energy vibes.',price:35,text:'\u26A1BlipVibe'},
    {id:'sparkle',name:'Sparkle',desc:'Fancy and elegant.',price:35,text:'\u2726BlipVibe\u2726'},
    {id:'floral',name:'Floral',desc:'Soft flower energy.',price:35,text:'\uD83C\uDF38BlipVibe'},
    {id:'ribbon',name:'Ribbon',desc:'Super cute and sweet.',price:35,text:'\uD83C\uDF80BlipVibe\uD83C\uDF80'},
    {id:'crown',name:'Crown',desc:'Royal and majestic.',price:35,text:'\uD83D\uDC51BlipVibe'},
    {id:'wave',name:'Wave',desc:'Chill ocean flow.',price:35,text:'\uD83C\uDF0ABlipVibe'},
    {id:'rocket',name:'Rocket',desc:'Launch into orbit.',price:35,text:'\uD83D\uDE80BlipVibe'},
    {id:'gem',name:'Diamond',desc:'Rare and precious.',price:35,text:'\uD83D\uDC8EBV\uD83D\uDC8E'},
    {id:'minimal',name:'Minimal',desc:'Less is more.',price:35,text:'bv.'},
    {id:'fire',name:'Fire',desc:'Blazing hot energy.',price:35,text:'\uD83D\uDD25BlipVibe'},
    {id:'star',name:'Starlight',desc:'Shine bright always.',price:35,text:'\u2B50BlipVibe\u2B50'},
    {id:'ghost',name:'Ghost',desc:'Spooky and playful.',price:35,text:'\uD83D\uDC7BBlipVibe'},
    {id:'neon',name:'Neon',desc:'Glowing club vibes.',price:35,text:'\uD83D\uDCA0BV\uD83D\uDCA0'},
    {id:'sword',name:'Sword',desc:'Battle-ready branding.',price:35,text:'\u2694\uFE0FBlipVibe\u2694\uFE0F'},
    {id:'mainlogo',name:'BlipVibe Logo',desc:'The official BlipVibe mascot logo.',price:0,img:'images/blipvibe-logo-hd.webp'}
];

var defaultIcons={home:'fa-home',groups:'fa-users-rectangle',skins:'fa-palette',profiles:'fa-user-group',shop:'fa-store',messages:'fa-envelope',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment',share:'fa-share-from-square',search:'fa-search',edit:'fa-pen',bookmark:'fa-bookmark',heart:'fa-heart'};
var activeIcons=JSON.parse(JSON.stringify(defaultIcons));
var iconSets = [
    {id:'rounded',name:'Rounded',desc:'Soft rounded icons.',price:35,preview:'linear-gradient(135deg,#ff9a9e,#fad0c4)',icons:{home:'fa-house',groups:'fa-people-group',skins:'fa-brush',profiles:'fa-address-book',shop:'fa-bag-shopping',messages:'fa-comment-dots',notifications:'fa-bell-concierge',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-message',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen-fancy',bookmark:'fa-flag',heart:'fa-heart'}},
    {id:'techy',name:'Techy',desc:'Futuristic tech icons.',price:35,preview:'linear-gradient(135deg,#667eea,#764ba2)',icons:{home:'fa-microchip',groups:'fa-network-wired',skins:'fa-swatchbook',profiles:'fa-id-card',shop:'fa-cart-shopping',messages:'fa-satellite-dish',notifications:'fa-tower-broadcast',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-nodes',search:'fa-magnifying-glass',edit:'fa-wrench',bookmark:'fa-database',heart:'fa-bolt'}},
    {id:'playful',name:'Playful',desc:'Fun and cute icons.',price:35,preview:'linear-gradient(135deg,#f093fb,#f5576c)',icons:{home:'fa-heart',groups:'fa-hands-holding',skins:'fa-wand-magic-sparkles',profiles:'fa-face-smile',shop:'fa-gift',messages:'fa-paper-plane',notifications:'fa-star',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comments',share:'fa-share',search:'fa-wand-magic-sparkles',edit:'fa-pen-nib',bookmark:'fa-star',heart:'fa-face-kiss-wink-heart'}},
    {id:'nature',name:'Nature',desc:'Earth-inspired icons.',price:35,preview:'linear-gradient(135deg,#11998e,#38ef7d)',icons:{home:'fa-tree',groups:'fa-seedling',skins:'fa-leaf',profiles:'fa-sun',shop:'fa-mountain',messages:'fa-wind',notifications:'fa-cloud',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-binoculars',edit:'fa-seedling',bookmark:'fa-tree',heart:'fa-sun'}},
    {id:'cosmic',name:'Cosmic',desc:'Space-themed icons.',price:35,preview:'linear-gradient(135deg,#0f0c29,#302b63)',icons:{home:'fa-rocket',groups:'fa-meteor',skins:'fa-moon',profiles:'fa-globe',shop:'fa-shuttle-space',messages:'fa-satellite',notifications:'fa-explosion',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-arrow-up-from-bracket',search:'fa-user-astronaut',edit:'fa-screwdriver-wrench',bookmark:'fa-moon',heart:'fa-sun'}},
    {id:'medieval',name:'Medieval',desc:'Knights and castles era.',price:35,preview:'linear-gradient(135deg,#8B4513,#D2691E)',icons:{home:'fa-chess-rook',groups:'fa-shield-halved',skins:'fa-scroll',profiles:'fa-helmet-safety',shop:'fa-coins',messages:'fa-dove',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-message',share:'fa-hand-holding',search:'fa-compass',edit:'fa-hammer',bookmark:'fa-bookmark',heart:'fa-shield-heart'}},
    {id:'ocean',name:'Ocean',desc:'Deep sea aquatic icons.',price:35,preview:'linear-gradient(135deg,#006994,#00CED1)',icons:{home:'fa-anchor',groups:'fa-fish',skins:'fa-water',profiles:'fa-person-swimming',shop:'fa-ship',messages:'fa-bottle-water',notifications:'fa-otter',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-life-ring',heart:'fa-shrimp'}},
    {id:'retro',name:'Retro',desc:'80s throwback vibes.',price:35,preview:'linear-gradient(135deg,#ff6ec7,#7873f5)',icons:{home:'fa-tv',groups:'fa-compact-disc',skins:'fa-spray-can',profiles:'fa-user-secret',shop:'fa-record-vinyl',messages:'fa-phone',notifications:'fa-radio',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comments',share:'fa-share-nodes',search:'fa-magnifying-glass',edit:'fa-scissors',bookmark:'fa-floppy-disk',heart:'fa-gamepad'}},
    {id:'food',name:'Foodie',desc:'Tasty food-themed icons.',price:35,preview:'linear-gradient(135deg,#ff9a44,#fc6076)',icons:{home:'fa-house-chimney',groups:'fa-utensils',skins:'fa-ice-cream',profiles:'fa-mug-hot',shop:'fa-cart-shopping',messages:'fa-cookie-bite',notifications:'fa-lemon',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-pizza-slice',heart:'fa-candy-cane'}},
    {id:'weather',name:'Weather',desc:'Atmospheric sky icons.',price:35,preview:'linear-gradient(135deg,#89CFF0,#FFD700)',icons:{home:'fa-cloud-sun',groups:'fa-tornado',skins:'fa-rainbow',profiles:'fa-snowman',shop:'fa-umbrella',messages:'fa-snowflake',notifications:'fa-bolt-lightning',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-wind',search:'fa-temperature-half',edit:'fa-droplet',bookmark:'fa-sun',heart:'fa-cloud-moon'}},
    {id:'gamer',name:'Gamer',desc:'Controller-ready gaming icons.',price:35,preview:'linear-gradient(135deg,#7b2ff7,#00f5a0)',icons:{home:'fa-gamepad',groups:'fa-headset',skins:'fa-ghost',profiles:'fa-skull-crossbones',shop:'fa-trophy',messages:'fa-walkie-talkie',notifications:'fa-bell',like:'fa-hand-fist',dislike:'fa-hand-point-down',comment:'fa-comment-dots',share:'fa-share-nodes',search:'fa-crosshairs',edit:'fa-screwdriver-wrench',bookmark:'fa-flag-checkered',heart:'fa-heart-pulse'}},
    {id:'music',name:'Music',desc:'Jam out with musical icons.',price:35,preview:'linear-gradient(135deg,#e91e63,#ff9800)',icons:{home:'fa-music',groups:'fa-guitar',skins:'fa-sliders',profiles:'fa-microphone',shop:'fa-record-vinyl',messages:'fa-headphones',notifications:'fa-volume-high',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-compact-disc',heart:'fa-drum'}},
    {id:'horror',name:'Horror',desc:'Creepy spooky icons.',price:35,preview:'linear-gradient(135deg,#1a1a2e,#6b0000)',icons:{home:'fa-house-chimney-crack',groups:'fa-ghost',skins:'fa-skull',profiles:'fa-mask',shop:'fa-spider',messages:'fa-crow',notifications:'fa-triangle-exclamation',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-nodes',search:'fa-eye',edit:'fa-wand-sparkles',bookmark:'fa-cross',heart:'fa-brain'}},
    {id:'fitness',name:'Fitness',desc:'Pump iron with gym icons.',price:35,preview:'linear-gradient(135deg,#ff6b35,#f7dc6f)',icons:{home:'fa-dumbbell',groups:'fa-people-pulling',skins:'fa-shirt',profiles:'fa-person-running',shop:'fa-basket-shopping',messages:'fa-stopwatch',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-medal',heart:'fa-heart-pulse'}},
    {id:'minimal',name:'Minimal',desc:'Clean simple outlines.',price:35,preview:'linear-gradient(135deg,#e0e0e0,#9e9e9e)',icons:{home:'fa-circle',groups:'fa-circle-nodes',skins:'fa-circle-half-stroke',profiles:'fa-circle-user',shop:'fa-circle-dot',messages:'fa-circle-question',notifications:'fa-circle-exclamation',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment',share:'fa-up-right-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-bookmark',heart:'fa-heart'}}
];

var coinSkins = [
    {id:'diamond',name:'Diamond',desc:'Sparkly diamond coins.',price:50,icon:'fa-gem',color:'#b9f2ff'},
    {id:'star',name:'Star',desc:'Shining star coins.',price:50,icon:'fa-star',color:'#ffd700'},
    {id:'crown',name:'Crown',desc:'Royal crown coins.',price:50,icon:'fa-crown',color:'#f5c518'},
    {id:'fire',name:'Fire',desc:'Blazing fire coins.',price:50,icon:'fa-fire',color:'#ff6b35'},
    {id:'bolt',name:'Bolt',desc:'Electric bolt coins.',price:50,icon:'fa-bolt',color:'#00d4ff'},
    {id:'heart',name:'Heart',desc:'Love-filled coins.',price:50,icon:'fa-heart',color:'#ff69b4'},
    {id:'shield',name:'Shield',desc:'Armored silver coins.',price:50,icon:'fa-shield-halved',color:'#a0aec0'},
    {id:'moon',name:'Moon',desc:'Lunar glow coins.',price:50,icon:'fa-moon',color:'#9b59b6'},
    {id:'leaf',name:'Leaf',desc:'Nature energy coins.',price:50,icon:'fa-leaf',color:'#27ae60'},
    {id:'snowflake',name:'Snowflake',desc:'Frosty ice coins.',price:50,icon:'fa-snowflake',color:'#74b9ff'}
];

var templates = [
    {id:'panorama',name:'Panorama',desc:'Profile banner spans full width. Two-column feed layout below.',price:100,preview:'linear-gradient(135deg,#ff6b6b,#ee5a24)'},
    {id:'compact',name:'Compact',desc:'Centered single-column layout. Everything stacked cleanly.',price:100,preview:'linear-gradient(135deg,#6c5ce7,#a29bfe)'},
    {id:'reverse',name:'Reverse',desc:'Flipped mirror layout. Feed on the right, sidebars swapped.',price:100,preview:'linear-gradient(135deg,#00b894,#00cec9)'},
    {id:'dashboard',name:'Dashboard',desc:'Both sidebars stacked on the left. Wide feed dominates the right.',price:100,preview:'linear-gradient(135deg,#fdcb6e,#e17055)'},
    {id:'cinema',name:'Cinema',desc:'Feed takes center stage full width. Sidebars tucked below.',price:100,preview:'linear-gradient(135deg,#2d3436,#636e72)'},
    {id:'magazine',name:'Magazine',desc:'Profile header up top. Three equal columns below like a news layout.',price:100,preview:'linear-gradient(135deg,#0984e3,#6c5ce7)'},
    {id:'zen',name:'Zen',desc:'Ultra minimal. Just your feed, nothing else. Pure focus mode.',price:100,preview:'linear-gradient(135deg,#dfe6e9,#b2bec3)'},
    {id:'spotlight',name:'Spotlight',desc:'Extra-wide feed, narrow sidebars. Content takes center stage.',price:100,preview:'linear-gradient(135deg,#f39c12,#e74c3c)'},
    {id:'widescreen',name:'Widescreen',desc:'No left sidebar. Feed and right sidebar fill the page.',price:100,preview:'linear-gradient(135deg,#2ecc71,#1abc9c)'},
    {id:'duo',name:'Duo',desc:'Clean two-column split. Profile left, feed right.',price:100,preview:'linear-gradient(135deg,#3498db,#2980b9)'},
    {id:'headline',name:'Headline',desc:'Profile spans the top like a newspaper masthead.',price:100,preview:'linear-gradient(135deg,#9b59b6,#8e44ad)'},
    {id:'stack',name:'Stack',desc:'Full-width stacked layout. Everything in one vertical flow.',price:100,preview:'linear-gradient(135deg,#e67e22,#d35400)'},
    {id:'focus',name:'Focus',desc:'Extra-wide feed with no sidebars. Distraction-free browsing.',price:100,preview:'linear-gradient(135deg,#1abc9c,#16a085)'},
    {id:'grid',name:'Grid',desc:'Two equal columns. Feed and sidebar side by side.',price:100,preview:'linear-gradient(135deg,#8e44ad,#2c3e50)'},
    {id:'journal',name:'Journal',desc:'Narrow centered feed with wide margins. Blog-style reading.',price:100,preview:'linear-gradient(135deg,#f8b500,#e74c3c)'},
    {id:'wing',name:'Wing',desc:'Wide left sidebar with compact feed. Profile-forward layout.',price:100,preview:'linear-gradient(135deg,#00b4db,#0083b0)'},
    {id:'hub',name:'Hub',desc:'Profile and feed centered. Sidebars hidden until hovered.',price:100,preview:'linear-gradient(135deg,#c0392b,#8e44ad)'},
    {id:'stream',name:'Stream',desc:'Everything stacked top-down. Cover, profile, album, suggestions + groups, then feed.',price:100,preview:'linear-gradient(135deg,#4a90d9,#357abd)'}
];

var navStyles = [
    {id:'metro',name:'Metro',desc:'App-style vertical sidebar nav. Completely reimagined layout.',price:60,preview:'linear-gradient(135deg,#1e272e,#485460)'},
    {id:'dock',name:'Dock',desc:'Mobile app-style bottom navigation dock with slim top header.',price:60,preview:'linear-gradient(135deg,#0f3460,#16213e)'},
    {id:'float',name:'Float',desc:'Floating glass navbar with rounded corners. Minimal and premium.',price:60,preview:'linear-gradient(135deg,#667eea,#764ba2)'},
    {id:'pill',name:'Pill',desc:'Floating pill at bottom center. Icons only. Ultra minimal.',price:60,preview:'linear-gradient(135deg,#e91e63,#9c27b0)'},
    {id:'rail',name:'Rail',desc:'Thin icon-only sidebar. Compact and space-efficient.',price:60,preview:'linear-gradient(135deg,#455a64,#263238)'},
    {id:'shelf',name:'Shelf',desc:'Double-row top bar with tabbed navigation row below.',price:60,preview:'linear-gradient(135deg,#00897b,#004d40)'},
    {id:'slim',name:'Slim',desc:'Ultra-thin 36px bar. Maximum content space.',price:60,preview:'linear-gradient(135deg,#5c6bc0,#283593)'},
    {id:'horizon',name:'Horizon',desc:'Full navbar moved to the bottom of the screen.',price:60,preview:'linear-gradient(135deg,#f4511e,#bf360c)'},
    {id:'mirror',name:'Mirror',desc:'Right-side vertical sidebar. Flipped Metro layout.',price:60,preview:'linear-gradient(135deg,#26a69a,#00695c)'},
    {id:'island',name:'Island',desc:'Three floating islands. Logo, nav, and user all separate.',price:60,preview:'linear-gradient(135deg,#42a5f5,#0d47a1)'},
    {id:'ribbon',name:'Ribbon',desc:'Thin colored ribbon across the top with centered icons.',price:60,preview:'linear-gradient(135deg,#e91e63,#f06292)'},
    {id:'glass',name:'Glass',desc:'Transparent frosted glass bar. Content shows through.',price:60,preview:'linear-gradient(135deg,#b2ebf2,#80deea)'},
    {id:'split',name:'Split',desc:'Logo left, nav bottom. Two separate bars.',price:60,preview:'linear-gradient(135deg,#ff7043,#d84315)'},
    {id:'minimal',name:'Minimal',desc:'Just icons. No background. Invisible until hover.',price:60,preview:'linear-gradient(135deg,#cfd8dc,#90a4ae)'},
    {id:'arcade',name:'Arcade',desc:'Chunky pixel-style bar. Retro gaming feel.',price:60,preview:'linear-gradient(135deg,#7b2ff7,#00f5a0)'},
    {id:'wheel',name:'Wheel',desc:'Swipeable mobile carousel. Center icon scales up like a wheel.',price:60,preview:'linear-gradient(135deg,#7c4dff,#448aff)'}
];

var premiumSkins = [
    {id:'witchcraft',name:'Witchcraft',desc:'Mystical witch symbols with moonlit purple aura. Enchanting and magical.',price:300,preview:'linear-gradient(135deg,#2d1b69,#11001c)',border:'conic-gradient(from 0deg,#8b5cf6,#c084fc,#a855f7,#7c3aed,#8b5cf6)',icon:'fa-hat-wizard',iconColor:'#c084fc',accent:'#c084fc',accentHover:'#a855f7',dark:true,cardBg:'#1e1045',cardText:'#d4b8ff',cardMuted:'#a07de0'},
    {id:'anime-blaze',name:'Anime Blaze',desc:'Fiery anime-inspired theme with blazing red and orange energy.',price:300,preview:'linear-gradient(135deg,#ff0844,#ffb199)',border:'conic-gradient(from 45deg,#ff0844,#ff6b6b,#ffb199,#ff0844)',icon:'fa-fire',iconColor:'#ff6b6b',accent:'#ff4444',accentHover:'#cc0033',dark:true,cardBg:'#2a0a10',cardText:'#ffb199',cardMuted:'#ff6b6b'},
    {id:'kawaii-cats',name:'Kawaii Cats',desc:'Adorable pink cat-themed design. Purrfectly cute for cat lovers.',price:300,preview:'linear-gradient(135deg,#fbc2eb,#a6c1ee)',border:'conic-gradient(from 0deg,#fbc2eb,#f8a4d2,#a6c1ee,#fbc2eb)',icon:'fa-cat',iconColor:'#f8a4d2',accent:'#e91e8c',accentHover:'#c2185b',dark:false,cardBg:'#fef0f7',cardText:'#c2185b',cardMuted:'#e91e8c'},
    {id:'geo-prism',name:'Geo Prism',desc:'Sharp geometric shapes with prismatic rainbow refraction.',price:300,preview:'linear-gradient(135deg,#00c9ff,#92fe9d)',border:'conic-gradient(from 0deg,#ff0000,#ff8800,#ffff00,#00ff00,#0088ff,#8800ff,#ff0000)',icon:'fa-shapes',iconColor:'#00c9ff',accent:'#4f46e5',accentHover:'#4338ca',dark:false,cardBg:'#eef8ff',cardText:'#4f46e5',cardMuted:'#6366f1'},
    {id:'dark-prism',name:'Dark Prism',desc:'Prismatic rainbow refraction on a midnight canvas. Bold and vivid.',price:300,preview:'linear-gradient(135deg,#0a0a18,#1a1040,#0a1a1a)',border:'conic-gradient(from 0deg,#ff0000,#ff8800,#ffff00,#00ff00,#0088ff,#8800ff,#ff0000)',icon:'fa-gem',iconColor:'#00c9ff',accent:'#6366f1',accentHover:'#4f46e5',dark:true,cardBg:'#12121f',cardText:'#d0d0f0',cardMuted:'#8080aa'},
    {id:'autumn-leaves',name:'Autumn Leaves',desc:'Warm fall foliage tones. Golden amber and rustic reds.',price:300,preview:'linear-gradient(135deg,#f12711,#f5af19)',border:'conic-gradient(from 30deg,#f5af19,#f12711,#c0392b,#e67e22,#f5af19)',icon:'fa-leaf',iconColor:'#f5af19',accent:'#d35400',accentHover:'#b84500',dark:false,cardBg:'#fff5e6',cardText:'#b84500',cardMuted:'#d35400'},
    {id:'neon-wave',name:'Neon Wave',desc:'Electric neon gradient that pulses with cyberpunk energy.',price:300,preview:'linear-gradient(135deg,#00f5a0,#7b2ff7)',border:'conic-gradient(from 0deg,#00f5a0,#00d9f5,#7b2ff7,#f500e5,#00f5a0)',icon:'fa-bolt',iconColor:'#00f5a0',accent:'#00f5a0',accentHover:'#00cc88',dark:true,cardBg:'#0d0a2a',cardText:'#00f5a0',cardMuted:'#7b2ff7'},
    {id:'sakura',name:'Sakura Bloom',desc:'Delicate cherry blossom pink with soft floral elegance.',price:300,preview:'linear-gradient(135deg,#ffecd2,#fcb69f)',border:'conic-gradient(from 0deg,#fcb69f,#ff9a9e,#ffecd2,#f8b4b4,#fcb69f)',icon:'fa-spa',iconColor:'#ff9a9e',accent:'#e11d73',accentHover:'#be185d',dark:false,cardBg:'#fff5f0',cardText:'#be185d',cardMuted:'#e11d73'},
    {id:'galaxy',name:'Galaxy Swirl',desc:'Deep space nebula with cosmic purples and stellar blues.',price:300,preview:'linear-gradient(135deg,#0c0032,#6e0dd0)',border:'conic-gradient(from 0deg,#6e0dd0,#240090,#0c0032,#3500d3,#6e0dd0)',icon:'fa-star',iconColor:'#b388ff',accent:'#a855f7',accentHover:'#9333ea',dark:true,cardBg:'#120040',cardText:'#b388ff',cardMuted:'#8855dd'},
    {id:'ocean-tide',name:'Ocean Tide',desc:'Flowing ocean waves with deep aqua and seafoam gradients.',price:300,preview:'linear-gradient(135deg,#0077b6,#90e0ef)',border:'conic-gradient(from 0deg,#0077b6,#00b4d8,#90e0ef,#caf0f8,#0077b6)',icon:'fa-water',iconColor:'#90e0ef',accent:'#0891b2',accentHover:'#0e7490',dark:false,cardBg:'#e6f7fb',cardText:'#0e7490',cardMuted:'#0891b2'},
    {id:'molten-gold',name:'Molten Gold',desc:'Liquid gold with luxurious metallic shimmer. Pure opulence.',price:300,preview:'linear-gradient(135deg,#bf953f,#fcf6ba)',border:'conic-gradient(from 0deg,#bf953f,#fcf6ba,#b38728,#fbf5b7,#bf953f)',icon:'fa-crown',iconColor:'#fcf6ba',accent:'#f59e0b',accentHover:'#d97706',dark:true,cardBg:'#2a1f0a',cardText:'#fcf6ba',cardMuted:'#bf953f'},
    {id:'toxic-green',name:'Toxic Green',desc:'Radioactive neon green on pitch black. Dangerously cool.',price:300,preview:'linear-gradient(135deg,#0a0a0a,#39ff14)',border:'conic-gradient(from 0deg,#39ff14,#00ff41,#32cd32,#00ff00,#39ff14)',icon:'fa-biohazard',iconColor:'#39ff14',accent:'#39ff14',accentHover:'#32cd32',dark:true,cardBg:'#0a0f0a',cardText:'#39ff14',cardMuted:'#28cc10'},
    {id:'vaporwave',name:'Vaporwave',desc:'Retro 80s pink and cyan. Nostalgic aesthetic vibes.',price:300,preview:'linear-gradient(135deg,#ff71ce,#01cdfe)',border:'conic-gradient(from 0deg,#ff71ce,#01cdfe,#b967ff,#05ffa1,#ff71ce)',icon:'fa-vr-cardboard',iconColor:'#ff71ce',accent:'#b967ff',accentHover:'#9b4dca',dark:true,cardBg:'#1a0a2e',cardText:'#ff71ce',cardMuted:'#b967ff'},
    {id:'blood-moon',name:'Blood Moon',desc:'Deep crimson and obsidian. Dark and brooding intensity.',price:300,preview:'linear-gradient(135deg,#1a0000,#8b0000)',border:'conic-gradient(from 0deg,#8b0000,#cc0000,#660000,#990000,#8b0000)',icon:'fa-moon',iconColor:'#cc0000',accent:'#cc0000',accentHover:'#990000',dark:true,cardBg:'#1a0505',cardText:'#e05050',cardMuted:'#990000'},
    {id:'cotton-candy',name:'Cotton Candy',desc:'Soft pastel pink and baby blue. Sweet and dreamy.',price:300,preview:'linear-gradient(135deg,#ffd1dc,#b5e8ff)',border:'conic-gradient(from 0deg,#ffd1dc,#b5e8ff,#e8d5f5,#ffd1dc)',icon:'fa-cloud',iconColor:'#ffa6c9',accent:'#e91e8c',accentHover:'#c2185b',dark:false,cardBg:'#fff0f5',cardText:'#c2185b',cardMuted:'#e91e8c'},
    {id:'matrix',name:'Matrix',desc:'Digital rain green on black. Enter the simulation.',price:300,preview:'linear-gradient(135deg,#000000,#003300)',border:'conic-gradient(from 0deg,#00ff41,#008f11,#00ff41,#003300,#00ff41)',icon:'fa-terminal',iconColor:'#00ff41',accent:'#00ff41',accentHover:'#00cc33',dark:true,cardBg:'#001a00',cardText:'#00ff41',cardMuted:'#008f11'},
    {id:'pastel-aurora',name:'Pastel Aurora',desc:'Flowing pastel northern lights. Lavender, mint, and peach shift endlessly.',price:300,preview:'linear-gradient(135deg,#c3aed6,#b8e6d0,#ffd8be,#c3aed6)',border:'conic-gradient(from 0deg,#c3aed6,#b8e6d0,#ffd8be,#f5c6e0,#c3aed6)',icon:'fa-rainbow',iconColor:'#c3aed6',accent:'#9b72b0',accentHover:'#7d5a96',dark:false,cardBg:'#faf5ff',cardText:'#6b4080',cardMuted:'#9b72b0'},
    {id:'deep-wave',name:'Deep Wave',desc:'Neon Wave turned down. Same mint and purple, darker and moodier.',price:300,preview:'linear-gradient(135deg,#007a5e,#4a1a8a)',border:'conic-gradient(from 0deg,#00f5a0,#00d9f5,#7b2ff7,#f500e5,#00f5a0)',icon:'fa-water',iconColor:'#00c088',accent:'#00c088',accentHover:'#009968',dark:true,cardBg:'#0d0a2a',cardText:'#00f5a0',cardMuted:'#7b2ff7'}
];

var guildSkins = [];

var gfLink=document.createElement('link');gfLink.rel='stylesheet';gfLink.href='https://fonts.googleapis.com/css2?family=Orbitron&family=Rajdhani&family=Quicksand&family=Pacifico&family=Baloo+2&display=swap';document.head.appendChild(gfLink);


// ======================== UTILITIES ========================
function $(sel){return document.querySelector(sel);}
function $$(sel){return document.querySelectorAll(sel);}
function fmtNum(n){return n>=1000?(n/1000).toFixed(1)+'k':n.toString();}
function timeAgo(i){
    var units=['just now','1 min ago','5 min ago','15 min ago','30 min ago','1 hr ago','2 hrs ago','3 hrs ago','5 hrs ago','8 hrs ago','12 hrs ago','1 day ago','2 days ago','3 days ago','5 days ago','1 week ago'];
    return units[i%units.length];
}

// ======================== NAVIGATION ========================
var _pvSaved=null;
var _gvSaved=null;
var _navCurrent='home';var _navPrev='home';var _navFromPopstate=false;var _activeGroupId=null;
function navigateTo(page,skipPush){
    revertTryOn();
    _exitPhotoSelectMode();
    stopSongPreview(); // Stop any playing song preview when navigating
    // Resume your own music when leaving someone else's profile
    if(_viewingSong) resumeMyMusic();
    // Restore navbars if mobile chat hid them
    var _tn=document.querySelector('.navbar');var _bn=document.querySelector('.nav-center');
    if(_tn) _tn.style.display='';if(_bn) _bn.style.display='';
    // Restore user's skin/font/template when leaving profile view
    if(_pvSaved&&page!=='profile-view'){
        premiumBgImage=_pvSaved.bgImage;premiumBgOverlay=_pvSaved.bgOverlay;premiumBgDarkness=_pvSaved.bgDarkness||0;premiumCardTransparency=_pvSaved.cardTrans!=null?_pvSaved.cardTrans:0.1;
        state.activePremiumSkin=_pvSaved.premiumSkin||null;
        applySkin(_pvSaved.skin||null,true);
        if(_pvSaved.premiumSkin)applyPremiumSkin(_pvSaved.premiumSkin,true);
        else updatePremiumBg();
        applyFont(_pvSaved.font||null,true);
        _pvSaved=null;
    }
    // Clear active group context when leaving group view
    _activeGroupId=null;
    _cleanupGroupChat(true);
    // Restore user's skin when leaving group view
    if(_gvSaved){
        state.activeSkin=_gvSaved.skin||null;
        state.activePremiumSkin=_gvSaved.premiumSkin||null;
        premiumBgImage=_gvSaved.bgImage;premiumBgOverlay=_gvSaved.bgOverlay;premiumBgDarkness=_gvSaved.bgDarkness||0;premiumCardTransparency=_gvSaved.cardTrans!=null?_gvSaved.cardTrans:0.1;
        if(_gvSaved.premiumSkin) applyPremiumSkin(_gvSaved.premiumSkin,true);
        else{applySkin(_gvSaved.skin||null,true);updatePremiumBg();}
        applyFont(_gvSaved.font||null,true);
        _gvSaved=null;
    }
    $$('.page').forEach(function(p){p.classList.remove('active');});
    var target=document.getElementById('page-'+page);
    if(target) target.classList.add('active');
    $$('.nav-link').forEach(function(l){l.classList.remove('active');});
    $$('.nav-link[data-page="'+page+'"]').forEach(function(l){l.classList.add('active');});
    if(document.body.classList.contains('nav-wheel')){requestAnimationFrame(function(){_wheelCenterActive();setTimeout(_wheelUpdate,350);});}
    $('#userDropdownMenu').classList.remove('show');
    $$('.post-dropdown.show').forEach(function(m){m.classList.remove('show');});
    closeModal();
    window.scrollTo(0,0);
    if(page==='notifications'){
        state.notifications.forEach(function(n){n.read=true;});
        updateNotifBadge();
        renderNotifications();
        if(currentUser) sbMarkNotificationsRead(currentUser.id).catch(function(){});
    }
    if(page==='messages'){var ml=document.querySelector('.messages-layout');if(ml)ml.classList.remove('chat-open');loadConversations();renderMsgFollowing();}
    if(page==='profiles') renderProfiles(currentProfileTab);
    if(page==='groups'){currentGroupTab='yours';renderGroups();}
    if(page==='skins'){page='shop';_skinPageView='mine';target=document.getElementById('page-shop');if(target)target.classList.add('active');$$('.nav-link[data-page="shop"]').forEach(function(l){l.classList.add('active');});if(!skipPush){history.replaceState({page:'shop'},'','#shop');}}
    if(page==='shop'){renderSkinPage();setTimeout(function(){showShopTutorial();},300);}
    if(page==='photos'){
        if(currentUser&&(!_pvAlbums||!_pvAlbums.length)){
            sbGetAlbums(currentUser.id).then(function(a){_pvAlbums=a;renderPhotoAlbum();}).catch(function(){renderPhotoAlbum();});
        } else renderPhotoAlbum();
    }
    if(page==='saved') renderSavedPage();
    if(page==='admin') renderAdminPanel();
    _navPrev=_navCurrent;_navCurrent=page;
    if(!skipPush) history.pushState({page:page},'','#'+page);
}
// Browser back/forward support
var _initHash=(location.hash||'').replace('#','')||'home';
if(_initHash==='profile-view') _initHash='home';
if(_initHash==='skins'){_initHash='shop';_skinPageView='mine';}
if(_initHash==='group-view') _initHash='groups';
if(_initHash.indexOf('group-view:')===0) _initHash='home';
history.replaceState({page:_initHash},'','#'+_initHash);
window.addEventListener('popstate',function(e){
    var page=(e.state&&e.state.page)?e.state.page:'home';
    _navFromPopstate=true;
    if(page==='profile-view') page='home';
    if(page==='group-view'){
        // Try to restore group from state
        var gid=e.state&&e.state.groupId;
        if(gid){
            var g=groups.find(function(gr){return gr.id===gid;});
            if(g){showGroupView(g);_navFromPopstate=false;return;}
        }
        page='groups';
    }
    navigateTo(page,true);
    _navFromPopstate=false;
});

document.addEventListener('click',function(e){
    var link=e.target.closest('[data-page]');
    if(link){
        e.preventDefault();
        navigateTo(link.getAttribute('data-page'));
    }
    // Close dropdowns
    if(!e.target.closest('.post-menu-btn')&&!e.target.closest('.post-dropdown')){
        $$('.post-dropdown.show').forEach(function(m){m.classList.remove('show');});
    }
    if(!e.target.closest('.nav-user')){
        $('#userDropdownMenu').classList.remove('show');
    }
});

// User dropdown
$('#navUserDropdown').addEventListener('click',function(e){
    if(!e.target.closest('.user-dropdown a')) $('#userDropdownMenu').classList.toggle('show');
});

// Global search - open search results page on Enter
$('#globalSearch').addEventListener('keydown',function(e){
    if(e.key==='Enter'){
        var q=this.value.trim();
        if(q.length>0){performSearch(q);this.value='';this.blur();}
    }
});

var currentSearchQuery='';
var currentSearchTab='people';

function performSearch(q){
    addToSearchHistory(q);
    currentSearchQuery=q;
    currentSearchTab='people';
    navigateTo('search');
    $('#searchQuery').textContent='Results for "'+q+'"';
    // Sync the search page input
    var spi=document.getElementById('searchPageQuery');
    if(spi&&spi.value!==q) spi.value=q;
    // Update tab active states
    $$('.search-tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab==='people');});
    renderSearchResults(q,'people');
}

// Search tab clicks
document.addEventListener('click',function(e){
    var tab=e.target.closest('.search-tab');
    if(tab && currentSearchQuery){
        currentSearchTab=tab.dataset.tab;
        $$('.search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        renderSearchResults(currentSearchQuery,currentSearchTab);
    }
});

async function renderSearchResults(q,tab){
    var ql=q.toLowerCase();
    var container=$('#searchResults');
    var html='';

    // Fetch results from Supabase
    var peopleResults=[];
    try { peopleResults=await sbSearchProfiles(q, 20); } catch(e){}
    var groupResults=groups.filter(function(g){return g.name.toLowerCase().indexOf(ql)!==-1||(g.description||'').toLowerCase().indexOf(ql)!==-1;});
    // Post results counted from loaded feed
    var postResults=feedPosts.filter(function(p){return p.text.toLowerCase().indexOf(ql)!==-1;});

    // Update tab counts (only search result tabs, not shop/skins/etc)
    $$('.search-tab[data-tab]').forEach(function(t){
        var count=0;
        if(t.dataset.tab==='people') count=peopleResults.length;
        else if(t.dataset.tab==='groups') count=groupResults.length;
        else if(t.dataset.tab==='posts') count=postResults.length;
        var badge=t.querySelector('.tab-count');
        if(badge) badge.textContent=count;
        else{var sp=document.createElement('span');sp.className='tab-count';sp.textContent=count;t.appendChild(sp);}
    });

    if(tab==='people'){
        if(!peopleResults.length){html='<div class="empty-state"><i class="fas fa-user-slash"></i><p>No people found for "'+q+'"</p></div>';}
        else{html='<div class="search-results-grid">';peopleResults.forEach(function(p){html+=profileCardHtml({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url});});html+='</div>';}
        container.innerHTML=html;
        bindProfileEvents('#searchResults');
    } else if(tab==='groups'){
        if(!groupResults.length){html='<div class="empty-state"><i class="fas fa-users-slash"></i><p>No groups found for "'+q+'"</p></div>';}
        else{html='<div class="search-results-grid">';groupResults.forEach(function(g){html+=groupCardHtml(g);});html+='</div>';}
        container.innerHTML=html;
        bindGroupEvents('#searchResults');
    } else if(tab==='posts'){
        // Search posts — try full-text DB search first, fall back to local feed filter
        var postResults=[];
        try{
            var dbResults=await sbSearchPosts(q,20);
            if(dbResults&&dbResults.length){
                postResults=dbResults.map(function(p){return {
                    idx:p.id,person:{id:p.author_id,name:p.author_display_name||p.author_username||'User',avatar_url:p.author_avatar_url},
                    text:p.content||'',tags:[],badge:null,loc:p.location||null,likes:0,comments:[],commentCount:0,shares:0,
                    images:p.media_urls&&p.media_urls.length?p.media_urls:(p.image_url?[p.image_url]:null),created_at:p.created_at
                };});
            }
        }catch(e){}
        if(!postResults.length) postResults=feedPosts.filter(function(p){return p.text.toLowerCase().indexOf(ql)!==-1;});
        if(!postResults.length){html='<div class="empty-state"><i class="fas fa-file-circle-xmark"></i><p>No posts found for "'+q+'"</p></div>';}
        else{
            postResults.forEach(function(fp){
                var person=fp.person;
                var text=fp.text;
                var tags=fp.tags||[];
                var badge=fp.badge||badgeTypes[0];
                var _ws=safeWordSplit(text,200);
                var short=renderMentionsInText(escapeHtmlNl(_ws[0]));
                var rest=_ws[1]?renderMentionsInText(escapeHtmlNl(_ws[1])):'';
                var hasMore=rest.length>0;
                html+='<div class="card feed-post search-post-card">';
                var avatarSrc=person.avatar_url||DEFAULT_AVATAR;
                html+='<div class="post-header"><img src="'+avatarSrc+'" alt="'+escapeHtml(person.name)+'" class="post-avatar" data-person-id="'+person.id+'">';
                html+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username" data-person-id="'+person.id+'">'+escapeHtml(person.name)+'</h4><span class="post-time">'+(fp.created_at?timeAgoReal(fp.created_at):'')+'</span></div>';
                html+='<div class="post-badges"><span class="badge '+badge.cls+'"><i class="fas '+badge.icon+'"></i> '+badge.text+'</span></div></div></div>';
                html+='<div class="post-description"><p>'+short+(hasMore?'<span class="view-more-text hidden">'+rest+'</span>':'')+(hasMore?' . . . <button class="view-more-btn">View More</button>':'')+'</p></div>';
                html+='<div class="post-tags">';
                tags.forEach(function(t){html+='<span class="skill-tag">'+t+'</span>';});
                html+='</div></div>';
            });
        }
        container.innerHTML=html;
        bindMentionClicks('#searchResults');
        bindHashtagClicks('#searchResults');
        // Bind view more buttons in search results
        $$('#searchResults .view-more-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){
                e.preventDefault();e.stopPropagation();
                var span=btn.closest('p').querySelector('.view-more-text');
                if(!span) return;
                if(span.classList.contains('hidden')){span.classList.remove('hidden');btn.textContent='View Less';}
                else{span.classList.add('hidden');btn.textContent='View More';}
            });
        });
        // Bind username clicks to profile view
        $$('#searchResults .post-username, #searchResults .post-avatar').forEach(function(el){
            el.addEventListener('click',async function(){
                var uid=el.dataset.personId;
                if(uid){try{var p=await sbGetProfile(uid);if(p) showProfileView(profileToPerson(p));}catch(e){}}
            });
        });
    }
}

// ======================== COIN SYSTEM ========================
function updateCoins(){
    if(currentUser){
        currentUser.coin_balance=state.coins;
        sbUpdateProfile(currentUser.id,{coin_balance:state.coins}).catch(function(e){console.error('coinSync:',e);});
    }
    if(_hasInfinity()){$('#navCoinCount').innerHTML='<span class="infinity">\u221E</span>';}else{$('#navCoinCount').textContent=state.coins;}
    var el=$('#navCoins');
    el.classList.remove('coin-pop');
    void el.offsetWidth;
    el.classList.add('coin-pop');
}
// Daily coin earning caps — resets at midnight
var _dailyCoinCaps={posts:5,comments:15,replies:15,postLikes:30,commentLikes:20};
var _dailyCoinCounts={};
function _getDailyCoinKey(){return new Date().toDateString();}
function _getDailyCounts(){
    var key=_getDailyCoinKey();
    if(!_dailyCoinCounts._date||_dailyCoinCounts._date!==key){
        _dailyCoinCounts={_date:key,posts:0,comments:0,replies:0,postLikes:0,commentLikes:0};
        try{localStorage.setItem('blipvibe_daily_coins',JSON.stringify(_dailyCoinCounts));}catch(e){}
    }
    return _dailyCoinCounts;
}
function _incrementDailyCoin(type){
    var counts=_getDailyCounts();
    if(counts[type]>=_dailyCoinCaps[type]) return false; // cap reached
    counts[type]++;
    try{localStorage.setItem('blipvibe_daily_coins',JSON.stringify(counts));}catch(e){}
    return true; // allowed
}
// Load saved daily counts on startup
try{var _saved=JSON.parse(localStorage.getItem('blipvibe_daily_coins')||'{}');if(_saved._date===_getDailyCoinKey()) _dailyCoinCounts=_saved;}catch(e){}

// Check if user has infinity status (early adopter)
function _hasInfinity(){
    if(!currentUser) return false;
    var sd=currentUser.skin_data;
    if(sd&&sd.infinityCoins) return true;
    // Also check the in-memory state (loaded from skin_data cache)
    if(state&&state._infinityCoins) return true;
    return false;
}

function isOwnPost(postId){
    if(!currentUser) return false;
    var fp=feedPosts.find(function(x){return x.idx===postId;});
    if(fp&&fp.person&&fp.person.id===currentUser.id) return true;
    // Also check DOM for group posts (not in feedPosts array)
    var el=document.querySelector('.feed-post[data-post-id="'+postId+'"]');
    if(el&&el.dataset.authorId===currentUser.id) return true;
    return false;
}
function addGroupCoins(groupId,amount){
    if(!state.groupCoins[groupId]) state.groupCoins[groupId]=0;
    state.groupCoins[groupId]+=amount;
    if(state.groupCoins[groupId]<0) state.groupCoins[groupId]=0;
    updateGroupCoinDisplay(groupId);
    var coinWrap=document.getElementById('gvGroupCoins');
    if(coinWrap){coinWrap.classList.remove('coin-pop');void coinWrap.offsetWidth;coinWrap.classList.add('coin-pop');}
    // Sync to DB — fire-and-forget, update local with server truth
    sbAddGroupCoins(groupId,amount).then(function(newBalance){
        state.groupCoins[groupId]=newBalance;
        updateGroupCoinDisplay(groupId);
    }).catch(function(e){console.error('Group coin sync:',e);});
}
function getGroupCoinCount(groupId){return state.groupCoins[groupId]||0;}
function getTodayKey(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function canEarnGroupPostCoin(groupId){
    var dayKey=getTodayKey();
    if(!state.groupPostCoinCount[groupId]) state.groupPostCoinCount[groupId]={};
    return (state.groupPostCoinCount[groupId][dayKey]||0)<10;
}
function trackGroupPostCoin(groupId){
    var dayKey=getTodayKey();
    if(!state.groupPostCoinCount[groupId]) state.groupPostCoinCount[groupId]={};
    if(!state.groupPostCoinCount[groupId][dayKey]) state.groupPostCoinCount[groupId][dayKey]=0;
    state.groupPostCoinCount[groupId][dayKey]++;
}
function canEarnGroupCommentCoin(groupId,postId){
    if(!state.groupCommentCoinPosts[groupId]) state.groupCommentCoinPosts[groupId]={};
    return !state.groupCommentCoinPosts[groupId][postId];
}
function trackGroupCommentCoin(groupId,postId){
    if(!state.groupCommentCoinPosts[groupId]) state.groupCommentCoinPosts[groupId]={};
    state.groupCommentCoinPosts[groupId][postId]=true;
}
function canEarnGroupReplyCoin(groupId,postId){
    if(!state.groupReplyCoinPosts[groupId]) state.groupReplyCoinPosts[groupId]={};
    return !state.groupReplyCoinPosts[groupId][postId];
}
function trackGroupReplyCoin(groupId,postId){
    if(!state.groupReplyCoinPosts[groupId]) state.groupReplyCoinPosts[groupId]={};
    state.groupReplyCoinPosts[groupId][postId]=true;
}

$('#navCoins').addEventListener('click',function(){
    $('#userDropdownMenu').classList.remove('show');
    navigateTo('shop');
});

// ======================== FOLLOW SYSTEM ========================
function updateFollowCounts(){
    $('#followingCount').textContent=state.following;
    $('#followersCount').textContent=state.followers;
}

function updateStatClickable(){
    var priv=state.privateFollowers;
    $('#followingStat').style.opacity=priv?'.5':'';
    $('#followingStat').style.pointerEvents=priv?'none':'';
    $('#followersStat').style.opacity=priv?'.5':'';
    $('#followersStat').style.pointerEvents=priv?'none':'';
}

async function toggleFollow(userId,btn){
    if(blockedUsers[userId]) return;
    if(!currentUser) return;
    try {
        if(state.followedUsers[userId]){
            await sbUnfollow(currentUser.id, userId);
            delete state.followedUsers[userId];
            state.following--;
            if(btn){
                btn.classList.remove('followed','btn-disabled');
                btn.classList.add('btn-primary');
                btn.innerHTML=btn.classList.contains('follow-btn-small')?'<i class="fas fa-plus"></i>':'<i class="fas fa-plus"></i> Follow';
            }
            // Notify the person being unfollowed
            var myName=currentUser.display_name||currentUser.username||'Someone';
            sbCreateNotification(userId,'follow',myName+' unfollowed you','',{originalType:'follow',follower_id:currentUser.id}).catch(function(e){console.error('Unfollow notif error:',e);});
        } else {
            await sbFollow(currentUser.id, userId);
            state.followedUsers[userId]=true;
            state.following++;
            trackQuestProgress('follow');
            if(btn){
                btn.classList.add('followed');
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-disabled');
                btn.innerHTML=btn.classList.contains('follow-btn-small')?'<i class="fas fa-check"></i>':'<i class="fas fa-check"></i> Following';
            }
            sbGetProfile(userId).then(function(p){if(p)addNotification('follow','You are now following '+(p.display_name||p.username));}).catch(function(){});
            // Notify the person being followed
            var myName=currentUser.display_name||currentUser.username||'Someone';
            sbCreateNotification(userId,'follow',myName+' started following you','',{originalType:'follow',follower_id:currentUser.id}).catch(function(e){console.error('Follow notif error:',e);});
        }
        updateFollowCounts();
        renderSuggestions();
        // Re-render feed so Following/Discover tabs reflect the change
        renderFeed(activeFeedTab);
        // Refresh friends-of-friends for discover tab
        sbGetFriendsOfFriends(currentUser.id).then(function(fof){_fofIds=fof;}).catch(function(){});
        // Show suggested follows after following someone new
        if(state.followedUsers[userId]) showSuggestedFollows(userId);
    } catch(err) { console.error('toggleFollow:', err); }
}

// ======================== NOTIFICATIONS ========================
var activeNotifTab='all';
var notifTabDefs=[
    {key:'all',label:'<i class="fas fa-bell"></i> All',filter:function(n){return n.type!=='system'&&n.type!=='skin'&&n.type!=='group'&&n.type!=='coin'&&n.type!=='purchase';}},
    {key:'mention',label:'<i class="fas fa-at"></i> Mentions',filter:function(n){return n.type==='mention';}},
    {key:'comment',label:'<i class="fas fa-comment"></i> Comments',filter:function(n){return n.type==='comment';}},
    {key:'reply',label:'<i class="fas fa-reply"></i> Replies',filter:function(n){return n.type==='reply';}},
    {key:'like',label:'<i class="fas fa-heart"></i> Likes',filter:function(n){return n.type==='like';}},
    {key:'follow',label:'<i class="fas fa-user-plus"></i> Follows',filter:function(n){return n.type==='follow';}},
    {key:'message',label:'<i class="fas fa-envelope"></i> Messages',filter:function(n){return n.type==='message';}},
    {key:'system',label:'<i class="fas fa-cog"></i> System',filter:function(n){return n.type==='system'||n.type==='skin'||n.type==='group'||n.type==='coin'||n.type==='purchase';}}
];
function addNotification(type,text,postId){
    state.notifications.unshift({type:type,text:text,time:new Date().toLocaleTimeString(),read:false,postId:postId||null});
    updateNotifBadge();
    renderNotifications();
    // Persist to Supabase (pass original type in data so it survives DB enum mapping)
    if(currentUser){
        var data={originalType:type};
        if(postId) data.post_id=postId;
        sbCreateNotification(currentUser.id,type,text,'',data).catch(function(e){console.warn('Notif save error:',e);});
    }
}
var _systemTypes={system:1,skin:1,group:1,coin:1,purchase:1};
function updateNotifBadge(){
    var unread=state.notifications.filter(function(n){return !n.read&&!_systemTypes[n.type];}).length;
    var badge=$('#notifBadge');
    var mobileBadge=document.getElementById('mobileNotifBadge');
    if(unread>0){badge.style.display='flex';badge.textContent=unread;if(mobileBadge){mobileBadge.style.display='flex';mobileBadge.textContent=unread;}}
    else{badge.style.display='none';if(mobileBadge) mobileBadge.style.display='none';}
}
function getNotifIcon(type){
    var map={comment:{cls:'skin',icon:'fa-comment'},reply:{cls:'skin',icon:'fa-reply'},like:{cls:'coin',icon:'fa-heart'},follow:{cls:'follow',icon:'fa-user-plus'},mention:{cls:'follow',icon:'fa-at'},message:{cls:'group',icon:'fa-envelope'},system:{cls:'coin',icon:'fa-cog'},skin:{cls:'skin',icon:'fa-palette'},group:{cls:'group',icon:'fa-users'},group_invite:{cls:'group',icon:'fa-envelope-open-text'},coin:{cls:'coin',icon:'fa-coins'}};
    return map[type]||{cls:'coin',icon:'fa-bell'};
}
function renderNotifications(){
    // Render tabs
    var tabsContainer=$('#notifTabs');
    if(tabsContainer){
        var tabsHtml='';
        notifTabDefs.forEach(function(t){
            var count=t.filter?state.notifications.filter(function(n){return !n.read&&t.filter(n);}).length:state.notifications.filter(function(n){return !n.read;}).length;
            tabsHtml+='<button class="search-tab'+(t.key===activeNotifTab?' active':'')+'" data-ntab="'+t.key+'">'+t.label+(count>0?' <span class="tab-count">'+count+'</span>':'')+'</button>';
        });
        tabsContainer.innerHTML=tabsHtml;
        $$('#notifTabs .search-tab').forEach(function(tab){
            tab.addEventListener('click',function(){
                activeNotifTab=tab.dataset.ntab;
                $$('#notifTabs .search-tab').forEach(function(t){t.classList.remove('active');});
                tab.classList.add('active');
                renderNotifications();
            });
        });
    }
    // Render filtered list
    var container=$('#notifList');
    var activeTab=notifTabDefs.find(function(t){return t.key===activeNotifTab;});
    var rawFiltered=activeTab&&activeTab.filter?state.notifications.filter(activeTab.filter):state.notifications;
    var filtered=groupNotifications(rawFiltered);
    if(filtered.length===0){
        container.innerHTML='<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications in this category.</p></div>';
        return;
    }
    var html='';
    filtered.forEach(function(n,i){
        var ic=getNotifIcon(n.type);
        var clickable=n.postId?' data-post-id="'+n.postId+'" style="cursor:pointer;"':'';
        if(n.type==='group_invite'&&n.data&&n.data.group_id) clickable=' data-group-id="'+n.data.group_id+'" style="cursor:pointer;"';
        var newBadge=!n.read?'<span class="notif-new-badge">New</span>':'';
        html+='<div class="notif-item'+(n.read?'':' unread')+'"'+clickable+'><div class="notif-icon '+ic.cls+'"><i class="fas '+ic.icon+'"></i></div><div class="notif-text"><p>'+escapeHtml(n.text)+newBadge+'</p><span>'+n.time+'</span></div></div>';
    });
    container.innerHTML=html;
    // Click handler for post-linked notifications
    $$('#notifList .notif-item[data-post-id]').forEach(function(el){
        el.addEventListener('click',function(){
            var postId=el.getAttribute('data-post-id');
            // Navigate to home feed first, then open the post comments
            navigateTo('home');
            setTimeout(function(){ showComments(postId); },200);
        });
    });
    // Click handler for group invite notifications
    $$('#notifList .notif-item[data-group-id]').forEach(function(el){
        el.addEventListener('click',async function(){
            var gid=el.getAttribute('data-group-id');
            var g=groups.find(function(gr){return gr.id===gid;});
            if(!g){
                // Group may not be loaded yet, reload groups
                await loadGroups();
                g=groups.find(function(gr){return gr.id===gid;});
            }
            if(g){
                if(state.joinedGroups[gid]){
                    // Already a member, just navigate
                    navigateTo('groups');
                    setTimeout(function(){showGroupView(g);},200);
                } else {
                    // Show join confirmation
                    showModal('<div class="modal-header"><h3><i class="fas fa-envelope-open-text" style="color:var(--primary);margin-right:8px;"></i>Group Invite</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;margin-bottom:16px;">You\'ve been invited to join <strong>'+escapeHtml(g.name)+'</strong></p><div class="modal-actions"><button class="btn btn-outline modal-close">Decline</button><button class="btn btn-primary" id="acceptGroupInvite" data-gid="'+gid+'">Join Group</button></div></div>');
                    document.getElementById('acceptGroupInvite').addEventListener('click',async function(){
                        try{
                            await sbJoinGroup(gid,currentUser.id);
                            state.joinedGroups[gid]=true;
                            g.members++;
                            saveState();
                            closeModal();
                            showToast('Joined '+g.name+'!');
                            navigateTo('groups');
                            setTimeout(function(){showGroupView(g);},200);
                        }catch(e2){
                            closeModal();
                            showToast('Failed to join group');
                        }
                    });
                }
            } else {
                showToast('Group no longer exists');
            }
        });
    });
}

// ======================== MODAL ========================
var _modalScrollY=0;
var _gmpVisibleBeforeModal=false;
function showModal(html){
    $('#modalContent').innerHTML=html;
    var alreadyOpen=document.body.classList.contains('modal-open');
    $('#modalOverlay').classList.add('show');
    if(!alreadyOpen){
        _modalScrollY=window.scrollY;
        document.body.classList.add('modal-open');
        document.body.style.top=(-_modalScrollY)+'px';
    }
    // Hide music player when any modal opens
    var gmp=document.getElementById('globalMiniPlayer');
    if(gmp&&gmp.classList.contains('visible')){_gmpVisibleBeforeModal=true;gmp.classList.remove('visible');}
}
function closeModal(){
    $('#modalOverlay').classList.remove('show');
    document.body.classList.remove('modal-open');
    document.body.style.top='';
    window.scrollTo(0,_modalScrollY);
    // Restore music player when modal closes
    if(_gmpVisibleBeforeModal){var gmp=document.getElementById('globalMiniPlayer');if(gmp) gmp.classList.add('visible');_gmpVisibleBeforeModal=false;}
}
var _cropDragging=false;
$('#modalOverlay').addEventListener('click',function(e){
    if(e.target===this&&!_cropDragging) closeModal();
});
$('#modalOverlay').addEventListener('touchmove',function(e){
    // Allow scrolling inside scrollable children, block scroll on backdrop
    if(!e.target.closest('.comment-modal-scroll, .comment-post-embed, .modal-content')) e.preventDefault();
},{passive:false});
document.addEventListener('click',function(e){
    if(e.target.closest('.modal-close')) closeModal();
});
document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&$('#modalOverlay').classList.contains('show')) closeModal();
});

// ======================== FIRST-TIME TUTORIALS ========================
function _showTutorial(key,html){
    if(!currentUser) return;
    if(_tutorialsSeen[key]) return;
    var overlay=document.createElement('div');
    overlay.className='tut-overlay';
    overlay.innerHTML='<div class="tut-modal">'+html+'<button class="tut-ok btn btn-primary">Got it!</button></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){overlay.classList.add('show');});
    function dismiss(){
        overlay.classList.remove('show');
        setTimeout(function(){overlay.remove();},300);
        _tutorialsSeen[key]=1;
        syncSkinDataToSupabase(true);
    }
    overlay.querySelector('.tut-ok').addEventListener('click',dismiss);
    overlay.addEventListener('click',function(e){if(e.target===overlay) dismiss();});
}
function showFeedTutorial(){
    _showTutorial('feed',
        '<div class="tut-header"><div class="tut-logo">BV</div><h2>Welcome to BlipVibe!</h2></div>'
        +'<p class="tut-intro">Post, Like &amp; Comment to earn coins!</p>'
        +'<div class="tut-rules">'
        +'<div class="tut-rule"><i class="fas fa-pen-to-square"></i><span>Post <strong>+5 coins</strong></span></div>'
        +'<div class="tut-rule"><i class="fas fa-comment"></i><span>Comment <strong>+2 coins</strong></span></div>'
        +'<div class="tut-rule"><i class="fas fa-reply"></i><span>Reply <strong>+2 coins</strong></span></div>'
        +'<div class="tut-rule"><i class="fas fa-heart"></i><span>Like <strong>+1 coin</strong></span></div>'
        +'</div>'
        +'<div class="tut-divider"></div>'
        +'<h3><i class="fas fa-scroll" style="color:var(--primary);margin-right:6px;"></i>Community Rules</h3>'
        +'<ul class="tut-list">'
        +'<li>Be respectful to everyone</li>'
        +'<li>No spam or self-promotion</li>'
        +'<li>No hate speech or harassment</li>'
        +'<li>Keep it fun &amp; positive</li>'
        +'</ul>'
        +'<div class="tut-divider"></div>'
        +'<p class="tut-tip"><i class="fas fa-coins" style="color:#f59e0b;"></i> Spend your coins in the <strong>Skin Shop</strong> to customize your profile!</p>'
    );
}
function showShopTutorial(){
    _showTutorial('shop',
        '<div class="tut-header"><div class="tut-logo"><i class="fas fa-palette"></i></div><h2>Welcome to the Skin Shop!</h2></div>'
        +'<p class="tut-intro">Spend your coins here — make your page uniquely yours.</p>'
        +'<div class="tut-features">'
        +'<div class="tut-feat"><i class="fas fa-palette"></i><strong>Skins</strong><span>Change your color theme</span></div>'
        +'<div class="tut-feat"><i class="fas fa-font"></i><strong>Fonts</strong><span>Pick your text style</span></div>'
        +'<div class="tut-feat"><i class="fas fa-columns"></i><strong>Templates</strong><span>Choose your layout</span></div>'
        +'<div class="tut-feat"><i class="fas fa-star"></i><strong>Premium Skins</strong><span>Animated borders &amp; effects</span></div>'
        +'</div>'
        +'<div class="tut-divider"></div>'
        +'<p class="tut-tip"><i class="fas fa-image" style="color:var(--primary);"></i> Premium skins let you upload a <strong>custom background</strong> — scroll down in the shop and make it yours. The sky is the limit!</p>'
    );
}

// ======================== @MENTION AUTOCOMPLETE ========================
// groupId: if provided, only search group members; otherwise search all users
function initMentionAutocomplete(textareaId, groupId){
    var ta=document.getElementById(textareaId);
    if(!ta) return;
    // Create dropdown — append to body with fixed positioning to escape overflow containers
    var dd=document.createElement('div');
    dd.className='mention-dropdown';
    dd.style.display='none';
    document.body.appendChild(dd);
    var _mentionTimer=null;
    var _mentionCache={};
    function hideMention(){dd.style.display='none';dd.innerHTML='';}
    function positionDropdown(){
        var rect=ta.getBoundingClientRect();
        dd.style.position='fixed';
        dd.style.left=rect.left+'px';
        dd.style.width=rect.width+'px';
        // If input is in the bottom half of the screen, show dropdown above; otherwise below
        if(rect.top > window.innerHeight * 0.5){
            dd.style.top='auto';
            dd.style.bottom=(window.innerHeight-rect.top+4)+'px';
        } else {
            dd.style.bottom='auto';
            dd.style.top=(rect.bottom+4)+'px';
        }
    }
    function getMentionQuery(){
        var val=ta.value;var pos=ta.selectionStart;
        // Walk backward from cursor to find @
        var i=pos-1;
        while(i>=0 && val[i]!==' ' && val[i]!=='\n' && val[i]!=='@') i--;
        if(i<0 || val[i]!=='@') return null;
        // Must be start of line or preceded by space/newline
        if(i>0 && val[i-1]!==' ' && val[i-1]!=='\n') return null;
        var q=val.substring(i+1,pos);
        return {start:i,end:pos,query:q};
    }
    var _connectionsCache=null;
    async function getConnections(){
        if(_connectionsCache) return _connectionsCache;
        try{
            var following=await sbGetFollowing(currentUser.id);
            var followers=await sbGetFollowers(currentUser.id);
            // Merge and deduplicate — following first
            var seen={};var merged=[];
            (following||[]).forEach(function(u){if(u&&u.id!==currentUser.id&&!seen[u.id]){seen[u.id]=true;merged.push(u);}});
            (followers||[]).forEach(function(u){if(u&&u.id!==currentUser.id&&!seen[u.id]){seen[u.id]=true;merged.push(u);}});
            _connectionsCache=merged;
            return merged;
        }catch(e){console.warn('Connections fetch error:',e);return [];}
    }
    async function fetchMentions(q){
        if(q.length<1){hideMention();return;}
        var key=(groupId||'all')+'_'+q.toLowerCase();
        if(_mentionCache[key]){renderMentionDropdown(_mentionCache[key],q);return;}
        try{
            var results;
            // Match against all name fields: username, display_name, first_name, last_name, nickname
            function _mentionMatchesQuery(u, ql){
                if(!u||u.id===currentUser.id) return false;
                return (u.username||'').toLowerCase().indexOf(ql)!==-1||
                    (u.display_name||'').toLowerCase().indexOf(ql)!==-1||
                    (u.first_name||'').toLowerCase().indexOf(ql)!==-1||
                    (u.last_name||'').toLowerCase().indexOf(ql)!==-1||
                    (u.nickname||'').toLowerCase().indexOf(ql)!==-1;
            }
            if(groupId){
                // Search group members only
                var members=await sbGetGroupMembers(groupId);
                var ql=q.toLowerCase();
                results=(members||[]).map(function(m){return m.user||m;}).filter(function(u){
                    return _mentionMatchesQuery(u, ql);
                });
            } else {
                // Prioritize followers/following, then fill with global search
                var connections=await getConnections();
                var ql=q.toLowerCase();
                var connMatches=connections.filter(function(u){
                    return _mentionMatchesQuery(u, ql);
                });
                // Add global results that aren't already in connections
                var connIds={};
                connMatches.forEach(function(u){connIds[u.id]=true;});
                try{
                    var globalResults=await sbSearchProfiles(q,20);
                    var extras=(globalResults||[]).filter(function(u){return u.id!==currentUser.id&&!connIds[u.id];});
                    results=connMatches.concat(extras);
                }catch(searchErr){
                    console.warn('Global mention search failed, using connections only:',searchErr);
                    results=connMatches;
                }
            }
            _mentionCache[key]=results;
            renderMentionDropdown(results,q);
        }catch(e){console.warn('Mention search error:',e);}
    }
    function renderMentionDropdown(users,q){
        if(!users||!users.length){hideMention();return;}
        dd.innerHTML='';
        users.forEach(function(u){
            // Show the user's preferred display name based on their display_mode
            var name=u.display_name||u.username||'User';
            if(u.display_mode==='nickname'&&u.nickname&&u.nickname.trim()) name=u.nickname.trim();
            else if(u.first_name||u.last_name) name=((u.first_name||'')+' '+(u.last_name||'')).trim()||name;
            var uname=u.username||'';
            var avatar=u.avatar_url||DEFAULT_AVATAR;
            var item=document.createElement('div');
            item.className='mention-item';
            item.innerHTML='<img src="'+avatar+'" class="mention-avatar"><div class="mention-info"><span class="mention-name">'+escapeHtml(name)+'</span><span class="mention-uname">@'+escapeHtml(uname)+'</span></div>';
            item.addEventListener('mousedown',function(e){
                e.preventDefault(); // prevent textarea blur
                var mq=getMentionQuery();
                if(mq){
                    var before=ta.value.substring(0,mq.start);
                    var after=ta.value.substring(mq.end);
                    ta.value=before+'@'+uname+' '+after;
                    var newPos=mq.start+uname.length+2;
                    ta.setSelectionRange(newPos,newPos);
                    ta.focus();
                }
                hideMention();
            });
            dd.appendChild(item);
        });
        positionDropdown();
        dd.style.display='block';
    }
    ta.addEventListener('input',function(){
        var mq=getMentionQuery();
        if(!mq){hideMention();return;}
        clearTimeout(_mentionTimer);
        _mentionTimer=setTimeout(function(){fetchMentions(mq.query);},250);
    });
    ta.addEventListener('keydown',function(e){
        if(dd.style.display==='none') return;
        var items=dd.querySelectorAll('.mention-item');
        var active=dd.querySelector('.mention-item.active');
        var idx=-1;
        items.forEach(function(it,i){if(it===active)idx=i;});
        if(e.key==='ArrowDown'){
            e.preventDefault();
            if(active) active.classList.remove('active');
            idx=(idx+1)%items.length;
            items[idx].classList.add('active');
        } else if(e.key==='ArrowUp'){
            e.preventDefault();
            if(active) active.classList.remove('active');
            idx=(idx-1+items.length)%items.length;
            items[idx].classList.add('active');
        } else if(e.key==='Enter'&&active){
            e.preventDefault();
            active.dispatchEvent(new Event('mousedown'));
        } else if(e.key==='Escape'){
            hideMention();
        }
    });
    ta.addEventListener('blur',function(){setTimeout(hideMention,200);});
    // Clean up dropdown when textarea is removed from DOM (modal close)
    var _cleanupObserver=new MutationObserver(function(){
        if(!document.body.contains(ta)){dd.remove();_cleanupObserver.disconnect();}
    });
    _cleanupObserver.observe(document.body,{childList:true,subtree:true});
}

// Render @mentions as clickable links in post/comment text
function renderMentionsInText(html){
    // Match @username patterns (already escaped via escapeHtml/escapeHtmlNl)
    html=html.replace(/@([a-zA-Z0-9_]+)/g,function(match,uname){
        return '<span class="mention-link" data-mention="'+uname+'">@'+uname+'</span>';
    });
    // Match #hashtag patterns — must NOT be preceded by & (to avoid matching &#39; etc.)
    html=html.replace(/(^|[\s>])#([a-zA-Z][a-zA-Z0-9_]*)/g,function(match,before,tag){
        return before+'<span class="hashtag-link" data-tag="'+tag+'">#'+tag+'</span>';
    });
    return html;
}

// Bind click handlers for rendered mention links
function bindMentionClicks(containerSel){
    $$(containerSel+' .mention-link').forEach(function(el){
        el.style.cursor='pointer';
        el.addEventListener('click',function(){
            var uname=el.dataset.mention;
            if(!uname) return;
            sbGetProfileByUsername(uname).then(function(p){
                if(p) showProfileView(profileToPerson(p));
            }).catch(function(e){console.warn('Mention profile load:',e);});
        });
    });
}

// Bind click handlers for hashtag links
function bindHashtagClicks(containerSel){
    $$(containerSel+' .hashtag-link').forEach(function(el){
        if(el._hashBound) return; el._hashBound=true;
        el.style.cursor='pointer';
        el.addEventListener('click',function(){
            var tag=el.dataset.tag;
            if(!tag) return;
            showHashtagFeed(tag);
        });
    });
}

function showHashtagFeed(tag){
    var matching=feedPosts.filter(function(p){
        return p.text&&p.text.toLowerCase().indexOf('#'+tag.toLowerCase())!==-1;
    });
    var html='<div class="modal-header"><h3><i class="fas fa-hashtag" style="color:var(--primary);margin-right:6px;"></i>'+escapeHtml(tag)+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;">';
    if(!matching.length){
        html+='<p style="text-align:center;color:var(--gray);padding:20px;">No posts with #'+escapeHtml(tag)+' yet.</p>';
    } else {
        html+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">'+matching.length+' post'+(matching.length!==1?'s':'')+' with #'+escapeHtml(tag)+'</p>';
        matching.forEach(function(fp){
            var person=fp.person;
            var avatarSrc=person.avatar_url||DEFAULT_AVATAR;
            var timeStr=fp.created_at?timeAgoReal(fp.created_at):'';
            html+='<div class="card" style="padding:12px;margin-bottom:10px;">';
            html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><img src="'+avatarSrc+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"><div><strong style="font-size:13px;">'+escapeHtml(person.name)+'</strong><span style="font-size:11px;color:var(--gray);margin-left:6px;">'+timeStr+'</span></div></div>';
            html+='<p style="font-size:13px;">'+renderMentionsInText(escapeHtmlNl(fp.text))+'</p>';
            html+='</div>';
        });
    }
    html+='</div>';
    showModal(html);
    // Bind hashtag clicks inside the modal too
    bindHashtagClicks('#modalContent');
    bindMentionClicks('#modalContent');
}

// Send notifications to all @mentioned users in text
function notifyMentionedUsers(text,postId,context){
    if(!text||!currentUser) return;
    var mentions=text.match(/@([a-zA-Z0-9_]+)/g);
    if(!mentions) return;
    var seen={};
    var myName=currentUser.display_name||currentUser.username||'Someone';
    var ctx=context||'a post';
    mentions.forEach(function(m){
        var uname=m.substring(1);
        if(seen[uname]) return;
        seen[uname]=true;
        sbGetProfileByUsername(uname).then(function(p){
            if(p&&p.id&&p.id!==currentUser.id){
                sbCreateNotification(p.id,'mention',myName+' mentioned you in '+ctx,'',{originalType:'mention',post_id:postId}).catch(function(e){console.warn('Mention notif:',e);});
            }
        }).catch(function(){});
    });
}

// ======================== EMOJI PICKER ========================
var _emojiData={
    'Smileys':['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','🤪','😝','🤑','🤭','🤫','🤥','😬','😈','👿','🤡','💀','👻','👽','🤖','💩','🥳','🥺','🥹','😤','😡','🤬','😭','😱','😳','🫣','🫡','🫠'],
    'Gestures':['👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤏','💪','🦾','🖕','✍️','💅'],
    'Hearts':['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','💯','💢','💥','💫','💦','💨','🔥','⭐','🌟','✨','🎉','🎊'],
    'Animals':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🐠','🐟','🐡','🐬','🐳','🐋','🦈','🐊'],
    'Food':['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🥔','🍕','🍔','🍟','🌭','🍿','🧂','🥚','🍳','🧀','🥞','🧇','🍞','🥐','🥖','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','🍮','🍦','🍧'],
    'Activities':['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥊','🥋','🎯','⛳','🎮','🕹️','🎲','🎰','🎳','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎵','🎶'],
    'Travel':['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🚁','✈️','🛩️','🚀','🛸','🚢','⛵','🚤','🛥️','🏠','🏡','🏢','🏣','🏥','🏦','🏰','🏯','🗼','🗽','⛪','🕌','🏝️','🌍','🌎','🌏'],
    'Objects':['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📷','📸','📹','🎥','📺','📻','🎙️','⏰','🔋','🔌','💡','🔦','📡','💰','💳','💎','🔧','🔨','⚒️','🛠️','⚙️','🔩','🔑','🗝️','🔒','🔓','📦','📫','📬','📮','✏️','✒️','🖊️','🖋️','📝','📁','📂']
};
// ======================== CAMERA MENU ========================
var _activeCameraMenu=null;
function showCameraMenu(btn,galleryInput,onCaptureFile){
    // Close existing menu
    if(_activeCameraMenu){_activeCameraMenu.remove();_activeCameraMenu=null;}
    var menu=document.createElement('div');
    menu.className='camera-menu';
    menu.innerHTML='<button class="camera-menu-item" data-action="photo"><i class="fas fa-camera"></i> Take Photo</button><button class="camera-menu-item" data-action="gallery"><i class="fas fa-images"></i> Choose from Gallery</button>';
    btn.parentElement.style.position='relative';
    btn.parentElement.appendChild(menu);
    _activeCameraMenu=menu;
    // Position above the button
    menu.style.display='flex';
    // Take Photo — uses capture input
    menu.querySelector('[data-action="photo"]').addEventListener('click',function(){
        menu.remove();_activeCameraMenu=null;
        var capInput=document.createElement('input');
        capInput.type='file';capInput.accept='image/*';capInput.setAttribute('capture','environment');
        capInput.style.display='none';
        document.body.appendChild(capInput);
        capInput.addEventListener('change',function(){
            if(capInput.files&&capInput.files.length){onCaptureFile(capInput.files);}
            capInput.remove();
        });
        capInput.click();
    });
    // Choose from Gallery
    menu.querySelector('[data-action="gallery"]').addEventListener('click',function(){
        menu.remove();_activeCameraMenu=null;
        galleryInput.click();
    });
    // Close on outside click
    setTimeout(function(){
        document.addEventListener('click',function closeMenu(e){
            if(menu&&!menu.contains(e.target)&&e.target!==btn){menu.remove();_activeCameraMenu=null;document.removeEventListener('click',closeMenu);}
        });
    },0);
}

var _activeEmojiPanel=null;
function openEmojiPicker(panelId,targetEl){
    var panel=document.getElementById(panelId);
    if(!panel) return;
    if(_activeEmojiPanel&&_activeEmojiPanel!==panel){_activeEmojiPanel.classList.remove('open');_activeEmojiPanel.innerHTML='';}
    if(panel.classList.contains('open')){panel.classList.remove('open');panel.innerHTML='';_activeEmojiPanel=null;return;}
    var cats=Object.keys(_emojiData);
    var h='<div class="emoji-picker-header"><input type="text" class="post-input emoji-search-input" placeholder="Search emoji..."><button class="emoji-picker-close" style="background:none;color:#999;font-size:16px;cursor:pointer;padding:4px 8px;"><i class="fas fa-times"></i></button></div>';
    h+='<div class="emoji-picker-cats">';
    var catIcons={'Smileys':'😀','Gestures':'👍','Hearts':'❤️','Animals':'🐶','Food':'🍕','Activities':'🎮','Travel':'🚗','Objects':'💻'};
    cats.forEach(function(c,i){h+='<button data-cat="'+c+'" title="'+c+'"'+(i===0?' class="active"':'')+'>'+catIcons[c]+'</button>';});
    h+='</div>';
    h+='<div class="emoji-picker-grid">';
    _emojiData[cats[0]].forEach(function(e){h+='<span data-emoji="'+e+'">'+e+'</span>';});
    h+='</div>';
    panel.innerHTML=h;
    panel.classList.add('open');
    _activeEmojiPanel=panel;
    // Category tabs
    panel.querySelectorAll('.emoji-picker-cats button').forEach(function(btn){
        btn.addEventListener('click',function(){
            panel.querySelectorAll('.emoji-picker-cats button').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            var grid=panel.querySelector('.emoji-picker-grid');
            var emojis=_emojiData[btn.dataset.cat]||[];
            grid.innerHTML='';emojis.forEach(function(e){grid.innerHTML+='<span data-emoji="'+e+'">'+e+'</span>';});
            bindEmojiClicks(grid,targetEl);
            panel.querySelector('.emoji-search-input').value='';
        });
    });
    // Search
    panel.querySelector('.emoji-search-input').addEventListener('input',function(){
        var q=this.value.toLowerCase().trim();
        var grid=panel.querySelector('.emoji-picker-grid');
        if(!q){panel.querySelectorAll('.emoji-picker-cats button')[0].click();return;}
        var all=[];Object.keys(_emojiData).forEach(function(c){_emojiData[c].forEach(function(e){all.push(e);});});
        grid.innerHTML='';all.forEach(function(e){grid.innerHTML+='<span data-emoji="'+e+'">'+e+'</span>';});
        bindEmojiClicks(grid,targetEl);
    });
    // Close button
    panel.querySelector('.emoji-picker-close').addEventListener('click',function(){panel.classList.remove('open');panel.innerHTML='';_activeEmojiPanel=null;});
    bindEmojiClicks(panel.querySelector('.emoji-picker-grid'),targetEl);
}
function bindEmojiClicks(grid,targetEl){
    grid.querySelectorAll('span[data-emoji]').forEach(function(span){
        span.addEventListener('click',function(){
            var emoji=span.dataset.emoji;
            if(targetEl.tagName==='TEXTAREA'||targetEl.tagName==='INPUT'){
                var start=targetEl.selectionStart||targetEl.value.length;
                var end=targetEl.selectionEnd||targetEl.value.length;
                targetEl.value=targetEl.value.substring(0,start)+emoji+targetEl.value.substring(end);
                targetEl.selectionStart=targetEl.selectionEnd=start+emoji.length;
                targetEl.focus();
                targetEl.dispatchEvent(new Event('input',{bubbles:true}));
            }
        });
    });
}

function handleShare(btn){
    var post=btn.closest('.feed-post')||btn.closest('.card');
    if(!post)return;
    var avatar=post.querySelector('.post-avatar');
    var username=post.querySelector('.post-username');
    var time=post.querySelector('.post-time');
    var desc=post.querySelector('.post-description');
    var origAvatar=avatar?avatar.src:'';
    var origName=username?username.textContent:'Unknown';
    var origTime=time?time.textContent:'';
    var origText=desc?desc.innerHTML:'';
    // Get the original post UUID from the like button's data-post-id
    var likeBtn=post.querySelector('.like-btn');
    var origPostId=likeBtn?likeBtn.getAttribute('data-post-id'):null;
    var html='<div class="modal-header"><h3>Share Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body"><textarea id="shareComment" class="share-textarea" placeholder="Add your thoughts..."></textarea>';
    html+='<div class="share-preview">';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><img src="'+origAvatar+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;"><strong class="share-preview-name" style="font-size:13px;">'+origName+'</strong><span class="share-preview-time" style="font-size:12px;">'+origTime+'</span></div>';
    html+='<div class="share-preview-text" style="font-size:13px;">'+origText+'</div></div>';
    html+='<button id="sharePublishBtn" class="btn btn-primary" style="width:100%;margin-top:12px;">Share</button></div>';
    showModal(html);
    document.getElementById('sharePublishBtn').addEventListener('click',async function(){
        var comment=document.getElementById('shareComment').value.trim();
        var shareContent=comment||'Shared a post';
        var isUUID=origPostId&&/^[0-9a-f]{8}-/.test(origPostId);
        // Save to Supabase
        if(isUUID&&currentUser){
            try{
                var shareLoc=settings.showLocation?userLocation:null;
                await sbCreatePost(currentUser.id,shareContent,null,null,origPostId,shareLoc);
                if(_incrementDailyCoin('posts')){state.coins+=5;updateCoins();}
                var countEl=btn.querySelector('span');if(countEl)countEl.textContent=parseInt(countEl.textContent)+1;
                // Notify original post author
                var origAuthorEl=post.querySelector('.post-avatar[data-person-id]');
                var origAuthorId=origAuthorEl?origAuthorEl.getAttribute('data-person-id'):null;
                if(origAuthorId&&origAuthorId!==currentUser.id){
                    var myName=currentUser.display_name||currentUser.username||'Someone';
                    sbCreateNotification(origAuthorId,'like',myName+' shared your post','',{originalType:'like',post_id:origPostId}).catch(function(e){console.error('Share notif error:',e);});
                }
                closeModal();
                showToast('Post shared!');
                // Refresh feed to show the new shared post
                await generatePosts();
            }catch(e){
                console.error('Share error:',e);
                showToast('Share failed: '+(e.message||'Unknown error'));
            }
        } else {
            // Fallback: local-only share for non-Supabase posts
            var container=$('#feedContainer');
            var postId='share-'+Date.now();
            var ph='<div class="card feed-post"><div class="post-header"><img src="'+getMyAvatar()+'" alt="You" class="post-avatar">';
            ph+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username">'+(currentUser?(currentUser.display_name||currentUser.username):'You')+'</h4><span class="post-time">just now</span></div>';
            ph+='<div class="post-badges"><span class="badge badge-green"><i class="fas fa-share"></i> Shared</span></div></div></div>';
            if(comment) ph+='<div class="post-description"><p>'+comment.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p></div>';
            ph+='<div class="share-preview" style="margin:0 0 14px;">';
            ph+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><img src="'+origAvatar+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;"><strong class="share-preview-name" style="font-size:13px;">'+origName+'</strong><span class="share-preview-time" style="font-size:12px;">'+origTime+'</span></div>';
            ph+='<div class="share-preview-text" style="font-size:13px;">'+origText+'</div></div>';
            ph+='<div class="post-actions"><div class="action-left"><button class="action-btn like-btn" data-post-id="'+postId+'"><i class="far '+activeIcons.like+'"></i><span class="like-count">0</span></button>';
            ph+='<button class="action-btn dislike-btn" data-post-id="'+postId+'"><i class="far '+activeIcons.dislike+'"></i><span class="dislike-count">0</span></button>';
            ph+='<button class="action-btn comment-btn"><i class="far '+activeIcons.comment+'"></i><span>0</span></button>';
            ph+='<button class="action-btn share-btn"><i class="fas '+activeIcons.share+'"></i><span>0</span></button></div></div>';
            ph+='<div class="post-comments" data-post-id="'+postId+'"></div></div>';
            container.insertAdjacentHTML('afterbegin',ph);
            if(_incrementDailyCoin('posts')){state.coins+=5;updateCoins();}
            closeModal();
            var countEl2=btn.querySelector('span');if(countEl2)countEl2.textContent=parseInt(countEl2.textContent)+1;
            bindPostEvents();
        }
    });
}

function buildCommentHtml(cid,name,img,text,likes,isReply,authorId,replyToName){
    var liked=likedComments[cid];var lc=likes+(liked?1:0);
    var disliked=dislikedComments[cid];var dc=disliked?1:0;
    var avatarSrc=img||DEFAULT_AVATAR;
    var sz=isReply?'28':'32';
    var isOwn=currentUser&&authorId&&authorId===currentUser.id;
    var replyTag=isReply&&replyToName?'<span style="color:var(--primary);font-size:12px;margin-right:4px;"><i class="fas fa-reply" style="transform:scaleX(-1);font-size:10px;margin-right:2px;"></i>@'+escapeHtml(replyToName)+'</span>':'';
    var h='<div class="comment-item'+(isReply?' comment-reply':'')+'" data-cid="'+cid+'" data-author-id="'+(authorId||'')+'">';
    h+='<img src="'+avatarSrc+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;flex-shrink:0;object-fit:cover;">';
    h+='<div style="flex:1;"><strong style="font-size:13px;">'+escapeHtml(name)+'</strong>';
    var gifMatch=text.match(/^\[gif\](.*?)\[\/gif\]$/);
    if(gifMatch){
        h+='<div style="margin-top:4px;">'+replyTag+'<img src="'+escapeHtml(gifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy"></div>';
    }else{
        h+='<p class="comment-text" style="font-size:13px;color:#555;margin-top:2px;">'+replyTag+renderMentionsInText(escapeHtmlNl(text))+'</p>';
    }
    h+='<div class="comment-actions-row" style="display:flex;gap:12px;margin-top:8px;">';
    h+='<button class="comment-like-btn" data-cid="'+cid+'" data-aid="'+(authorId||'')+'" style="background:none;font-size:12px;color:'+(liked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:4px;"><i class="'+(liked?'fas':'far')+' fa-thumbs-up"></i><span>'+lc+'</span></button>';
    h+='<button class="comment-dislike-btn" data-cid="'+cid+'" data-aid="'+(authorId||'')+'" style="background:none;font-size:12px;color:'+(disliked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:4px;"><i class="'+(disliked?'fas':'far')+' fa-thumbs-down"></i><span>'+dc+'</span></button>';
    h+='<button class="comment-reply-btn" data-cid="'+cid+'" style="background:none;font-size:12px;color:#999;cursor:pointer;"><i class="far fa-comment"></i> Reply</button>';
    if(isOwn) h+='<button class="comment-edit-btn" data-cid="'+cid+'" data-text="'+escapeHtml(text)+'" style="background:none;font-size:12px;color:#999;cursor:pointer;"><i class="fas fa-pen"></i> Edit</button>';
    if(isOwn) h+='<button class="comment-delete-btn" data-cid="'+cid+'" style="background:none;font-size:12px;color:#e74c3c;cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>';
    h+='</div></div></div>';
    return h;
}


async function showComments(postId,countEl,sortMode,autoReplyToCid){
    sortMode=sortMode||settings.commentOrder||'top';
    var allComments=[];
    var isUUID=/^[0-9a-f]{8}-/.test(postId);
    // Load comments from Supabase for real posts
    if(isUUID){
        try{
            var sbComments=await sbGetComments(postId,sortMode);
            (sbComments||[]).forEach(function(c){
                var authorName=(c.author?c.author.display_name||c.author.username:'User');
                var authorAvatar=(c.author?c.author.avatar_url:null);
                var likeCount=c.like_count||0;
                allComments.push({cid:c.id,name:authorName,img:authorAvatar,text:c.content,likes:likeCount,parentId:c.parent_comment_id,authorId:c.author_id});
            });
        }catch(e){
            console.error('Load comments error:',e);
            // Fallback: use lite query
            try{
                var fallbackComments=await sbGetCommentsLite(postId,50);
                fallbackComments.forEach(function(c){
                    var authorName=(c.author?c.author.display_name||c.author.username:'User');
                    var authorAvatar=(c.author?c.author.avatar_url:null);
                    allComments.push({cid:c.id,name:authorName,img:authorAvatar,text:c.content,likes:0,parentId:c.parent_comment_id,authorId:c.author_id});
                });
            }catch(e2){console.error('Fallback comments error:',e2);}
        }
    }
    // Also include local-only comments (for non-UUID posts or as fallback)
    if(!isUUID){
        var user=state.comments[postId]||[];
        var _myName=currentUser?(currentUser.display_name||currentUser.username):'You';
        user.forEach(function(t,i){allComments.push({cid:postId+'-u-'+i,name:_myName,img:null,text:t,likes:0,parentId:null});});
        if(sortMode==='top'){allComments.sort(function(a,b){return b.likes-a.likes;});}
        else if(sortMode==='newest'){allComments.reverse();}
    }
    // Filter out comments from blocked users
    allComments=allComments.filter(function(c){return !c.authorId||!blockedUsers[c.authorId];});
    // Separate top-level and replies (flatten nested replies under their top-level ancestor)
    var commentById={};
    allComments.forEach(function(c){commentById[c.cid]=c;});
    var topLevel=allComments.filter(function(c){return !c.parentId;});
    var repliesByParent={};
    allComments.filter(function(c){return c.parentId;}).forEach(function(c){
        // Walk up to find the top-level ancestor
        var root=c.parentId;
        var visited={};
        while(commentById[root]&&commentById[root].parentId&&!visited[root]){visited[root]=true;root=commentById[root].parentId;}
        if(!repliesByParent[root])repliesByParent[root]=[];
        repliesByParent[root].push(c);
    });

    // Build the original post embed at the top
    var postEmbed='';
    var fp=feedPosts.find(function(x){return x.idx===postId;});
    if(fp){
        var person=fp.person;
        var avatarSrc=person.avatar_url||DEFAULT_AVATAR;
        var timeStr=fp.created_at?timeAgoReal(fp.created_at):timeAgo(typeof fp.idx==='number'?fp.idx:0);
        postEmbed+='<div class="comment-post-embed">';
        postEmbed+='<div class="post-header" style="margin-bottom:10px;position:relative;">';
        postEmbed+='<img src="'+avatarSrc+'" alt="'+escapeHtml(person.name)+'" class="post-avatar" style="width:40px;height:40px;">';
        postEmbed+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username">'+escapeHtml(person.name)+'</h4><span class="post-time">'+timeStr+'</span></div></div>';
        postEmbed+='</div>';
        postEmbed+='<div class="post-description"><p>'+escapeHtmlNl(fp.text)+'</p></div>';
        if(fp.images) postEmbed+=buildMediaGrid(fp.images);
        if(fp.tags&&fp.tags.length){postEmbed+='<div class="post-tags" style="margin-bottom:8px;">';fp.tags.forEach(function(t){postEmbed+='<span class="skill-tag">'+t+'</span>';});postEmbed+='</div>';}
        postEmbed+='<div class="post-actions" style="padding-top:10px;"><div class="action-left">';
        postEmbed+='<span class="action-btn" style="cursor:default;"><i class="fas fa-thumbs-up"></i><span>'+fp.likes+'</span></span>';
        postEmbed+='<span class="action-btn" style="cursor:default;"><i class="far fa-comment"></i><span>'+(fp.commentCount||(fp.comments||[]).length)+'</span></span>';
        postEmbed+='<span class="action-btn" style="cursor:default;"><i class="fas fa-share-from-square"></i><span>'+fp.shares+'</span></span>';
        postEmbed+='</div></div>';
        postEmbed+='</div>';
    }

    var tabsHtml='<div class="search-tabs" style="margin-bottom:12px;padding:0;">';
    tabsHtml+='<button class="search-tab comment-sort-tab'+(sortMode==='top'?' active':'')+'" data-sort="top">Top</button>';
    tabsHtml+='<button class="search-tab comment-sort-tab'+(sortMode==='newest'?' active':'')+'" data-sort="newest">Newest</button>';
    tabsHtml+='<button class="search-tab comment-sort-tab'+(sortMode==='oldest'?' active':'')+'" data-sort="oldest">Oldest</button>';
    tabsHtml+='</div>';

    var commentsHtml='';
    if(!topLevel.length) commentsHtml+='<p style="color:#777;margin-bottom:12px;" id="noCommentsMsg">No comments yet.</p>';
    // Build name lookup for "replying to" labels
    var nameById={};
    allComments.forEach(function(c){nameById[c.cid]=c.name;});
    topLevel.forEach(function(c){
        commentsHtml+=buildCommentHtml(c.cid,c.name,c.img,c.text,c.likes,false,c.authorId);
        var replies=repliesByParent[c.cid]||[];
        replies.forEach(function(r){
            var replyToName=nameById[r.parentId]||c.name;
            commentsHtml+=buildCommentHtml(r.cid,r.name,r.img,r.text,r.likes,true,r.authorId,replyToName);
        });
    });

    var html='<div class="modal-header"><h3>Comments</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="comment-modal-layout">';
    html+=postEmbed;
    html+='<div class="comment-modal-scroll">'+tabsHtml+'<div id="commentsList">'+commentsHtml+'</div></div>';
    html+='<div id="gifPickerPanel" class="gif-picker-panel comment-gif-flow" style="display:none;">';
    html+='<div class="gif-picker-header"><input type="text" id="gifSearchInput" class="post-input" placeholder="Search GIFs..." style="flex:1;font-size:13px;"><button id="gifPickerClose" style="background:none;color:#999;font-size:16px;cursor:pointer;padding:4px 8px;"><i class="fas fa-times"></i></button></div>';
    html+='<div class="gif-picker-grid" id="gifPickerGrid"></div>';
    html+='<div class="gif-picker-footer">Powered by <strong>KLIPY</strong></div>';
    html+='</div>';
    html+='<div class="comment-modal-input">';
    html+='<div id="commentEmojiPanel" class="emoji-picker-panel"></div>';
    html+='<div id="replyIndicator" style="display:none;font-size:12px;color:var(--primary);margin-bottom:6px;">Replying to <span id="replyToName"></span> <button id="cancelReply" style="background:none;color:#999;font-size:12px;margin-left:8px;cursor:pointer;">Cancel</button></div><div style="display:flex;gap:10px;align-items:center;"><input type="text" class="post-input" id="commentInput" placeholder="Write a comment..." style="flex:1;"><button class="comment-emoji-btn" id="commentEmojiBtn" title="Emoji"><i class="fas fa-face-smile"></i></button><button class="comment-gif-btn" id="commentGifBtn" title="Search GIFs">GIF</button><button class="btn btn-primary" id="postCommentBtn">Post</button></div></div>';
    html+='</div>';
    showModal(html);
    // Scroll comments to bottom
    var scrollArea=document.querySelector('.comment-modal-scroll');
    if(scrollArea) scrollArea.scrollTop=0;
    bindCommentLikes();
    bindCommentDeletes(postId,countEl);
    bindMentionClicks('#commentsList');
    bindHashtagClicks('#commentsList');
    initMentionAutocomplete('commentInput',null);
    document.getElementById('commentEmojiBtn').addEventListener('click',function(){openEmojiPicker('commentEmojiPanel',document.getElementById('commentInput'));});
    // Add mini link previews to comment text
    var commentsList=document.getElementById('commentsList');
    if(commentsList) autoFetchLinkPreviewsMini(commentsList,'.comment-text');
    var replyTarget=null;
    // Tab click handlers
    $$('.comment-sort-tab').forEach(function(tab){
        tab.addEventListener('click',function(){showComments(postId,countEl,tab.dataset.sort);});
    });
    // Bind reply buttons helper
    var _replyTargetAuthorId=null;
    function bindReplyBtns(){
        $$('.comment-reply-btn').forEach(function(btn){
            if(btn._bound)return;btn._bound=true;
            btn.addEventListener('click',function(){
                var cid=btn.dataset.cid;
                replyTarget=cid;
                var item=btn.closest('.comment-item');
                _replyTargetAuthorId=item?item.getAttribute('data-author-id'):null;
                var name=item?item.querySelector('strong').textContent:'';
                document.getElementById('replyIndicator').style.display='block';
                document.getElementById('replyToName').textContent=name;
                document.getElementById('commentInput').placeholder='Reply to '+name+'...';
                document.getElementById('commentInput').focus();
            });
        });
    }
    bindReplyBtns();
    // Auto-trigger reply if requested (e.g. from inline reply button)
    if(autoReplyToCid){
        var autoBtn=document.querySelector('.comment-reply-btn[data-cid="'+autoReplyToCid+'"]');
        if(autoBtn) autoBtn.click();
    }
    document.getElementById('cancelReply').addEventListener('click',function(){
        replyTarget=null;_replyTargetAuthorId=null;
        document.getElementById('replyIndicator').style.display='none';
        document.getElementById('commentInput').placeholder='Write a comment...';
    });
    document.getElementById('postCommentBtn').addEventListener('click', async function(){
        var input=document.getElementById('commentInput');var text=input.value.trim();if(!text)return;

        if(isUUID && currentUser) {
            try {
                var parentCid = replyTarget && /^[0-9a-f]{8}-/.test(replyTarget) ? replyTarget : null;
                await sbCreateComment(postId, currentUser.id, text, parentCid);
                // Notify post author
                var fp=feedPosts.find(function(x){return x.idx===postId;});
                if(fp&&fp.person&&fp.person.id&&fp.person.id!==currentUser.id){
                    var myName=currentUser.display_name||currentUser.username||'Someone';
                    sbCreateNotification(fp.person.id,'comment',myName+' commented on your post',text,{originalType:'comment',post_id:postId}).catch(function(e){console.error('Comment notif error:',e);});
                }
                notifyMentionedUsers(text,postId,'a comment');
            } catch(e) { console.error('Comment error:', e); showToast('Comment failed: '+(e.message||'Unknown error')); return; }
        } else {
            if(!state.comments[postId])state.comments[postId]=[];
            state.comments[postId].push(text);
        }

        if(replyTarget){
            var isReplyToSelf=currentUser&&_replyTargetAuthorId&&_replyTargetAuthorId===currentUser.id;
            if(!isOwnPost(postId)&&!isReplyToSelf&&!state.replyCoinPosts[postId]&&_incrementDailyCoin('replies')){state.replyCoinPosts[postId]=true;state.coins+=2;updateCoins();showCoinEarnAnimation(input||document.querySelector('.comment-input'),2);
                if(_activeGroupId&&canEarnGroupReplyCoin(_activeGroupId,postId)){addGroupCoins(_activeGroupId,2);trackGroupReplyCoin(_activeGroupId,postId);}
            }
            replyTarget=null;_replyTargetAuthorId=null;
            document.getElementById('replyIndicator').style.display='none';
            input.placeholder='Write a comment...';
        }else{
            if(!isOwnPost(postId)&&!state.commentCoinPosts[postId]&&_incrementDailyCoin('comments')){state.commentCoinPosts[postId]=true;state.coins+=2;updateCoins();
                showCoinEarnAnimation(input||document.querySelector('.comment-input'),2);
                if(_activeGroupId&&canEarnGroupCommentCoin(_activeGroupId,postId)){addGroupCoins(_activeGroupId,2);trackGroupCommentCoin(_activeGroupId,postId);}
            }
        }
        input.value='';if(countEl)countEl.textContent=parseInt(countEl.textContent)+1;
        renderInlineComments(postId);
        await showComments(postId,countEl,sortMode);
    });
    document.getElementById('commentInput').addEventListener('keypress',function(e){if(e.key==='Enter')document.getElementById('postCommentBtn').click();});

    // ---- GIF Picker ----
    var gifPanel=document.getElementById('gifPickerPanel');
    var gifGrid=document.getElementById('gifPickerGrid');
    var gifSearchInput=document.getElementById('gifSearchInput');
    var gifBtn=document.getElementById('commentGifBtn');
    var _gifDebounce=null;

    function renderGifGrid(gifs){
        if(!gifs||!gifs.length){gifGrid.innerHTML='<p style="color:#777;text-align:center;grid-column:1/-1;padding:20px 0;">No GIFs found</p>';return;}
        gifGrid.innerHTML=gifs.map(function(g){return '<img src="'+escapeHtml(g.preview||g.full)+'" alt="'+escapeHtml(g.title)+'" data-full="'+escapeHtml(g.full)+'" loading="lazy">';}).join('');
    }

    async function openGifPicker(){
        gifPanel.style.display='flex';
        gifSearchInput.value='';
        gifGrid.innerHTML='<p style="color:#777;text-align:center;grid-column:1/-1;padding:20px 0;">Loading...</p>';
        gifSearchInput.focus();
        var trending=await getKlipyTrending(20);
        renderGifGrid(trending);
    }

    function closeGifPicker(){gifPanel.style.display='none';gifGrid.innerHTML='';}

    gifBtn.addEventListener('click',function(){
        if(gifPanel.style.display==='flex') closeGifPicker();
        else openGifPicker();
    });
    document.getElementById('gifPickerClose').addEventListener('click',closeGifPicker);

    gifSearchInput.addEventListener('input',function(){
        clearTimeout(_gifDebounce);
        var q=gifSearchInput.value.trim();
        if(!q){
            _gifDebounce=setTimeout(async function(){renderGifGrid(await getKlipyTrending(20));},200);
            return;
        }
        _gifDebounce=setTimeout(async function(){
            gifGrid.innerHTML='<p style="color:#777;text-align:center;grid-column:1/-1;padding:20px 0;">Searching...</p>';
            var results=await searchKlipyGifs(q,20);
            renderGifGrid(results);
        },400);
    });

    gifGrid.addEventListener('click',function(e){
        var img=e.target.closest('img');if(!img)return;
        var fullUrl=img.dataset.full;if(!fullUrl)return;
        var input=document.getElementById('commentInput');
        input.value='[gif]'+fullUrl+'[/gif]';
        closeGifPicker();
        document.getElementById('postCommentBtn').click();
    });
}

function bindCommentLikes(){
    $$('.comment-like-btn').forEach(function(btn){
        btn.onclick=function(){
            var cid=btn.dataset.cid;var span=btn.querySelector('span');var ct=parseInt(span.textContent);
            var disBtn=btn.closest('.comment-actions-row')?btn.closest('.comment-actions-row').querySelector('.comment-dislike-btn'):btn.parentNode.querySelector('.comment-dislike-btn');
            if(likedComments[cid]){delete likedComments[cid];ct=Math.max(0,ct-1);btn.style.color='#999';btn.querySelector('i').className='far fa-thumbs-up';
                if(/^[0-9a-f]{8}-/.test(cid)&&currentUser) sbToggleLike(currentUser.id,'comment',cid).catch(function(){});
            }
            else{
                if(dislikedComments[cid]&&disBtn){delete dislikedComments[cid];var ds=disBtn.querySelector('span');ds.textContent=Math.max(0,parseInt(ds.textContent)-1);disBtn.style.color='#999';disBtn.querySelector('i').className='far fa-thumbs-down';}
                likedComments[cid]=true;ct++;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-up';
                var isOwn=currentUser&&btn.dataset.aid&&btn.dataset.aid===currentUser.id;
                if(!isOwn&&!commentCoinAwarded[cid]&&_incrementDailyCoin('commentLikes')){commentCoinAwarded[cid]=true;state.coins+=1;updateCoins();}
                if(/^[0-9a-f]{8}-/.test(cid)&&currentUser) sbToggleLike(currentUser.id,'comment',cid).catch(function(){});
            }
            span.textContent=ct;
        };
    });
    $$('.comment-dislike-btn').forEach(function(btn){
        btn.onclick=function(){
            var cid=btn.dataset.cid;var span=btn.querySelector('span');var ct=parseInt(span.textContent);
            var likeBtn=btn.closest('.comment-actions-row')?btn.closest('.comment-actions-row').querySelector('.comment-like-btn'):btn.parentNode.querySelector('.comment-like-btn');
            if(dislikedComments[cid]){delete dislikedComments[cid];ct=Math.max(0,ct-1);btn.style.color='#999';btn.querySelector('i').className='far fa-thumbs-down';}
            else{
                if(likedComments[cid]&&likeBtn){delete likedComments[cid];var ls=likeBtn.querySelector('span');ls.textContent=Math.max(0,parseInt(ls.textContent)-1);likeBtn.style.color='#999';likeBtn.querySelector('i').className='far fa-thumbs-up';}
                dislikedComments[cid]=true;ct++;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-down';
                var isOwn=currentUser&&btn.dataset.aid&&btn.dataset.aid===currentUser.id;
                if(!isOwn&&!commentCoinAwarded[cid]&&_incrementDailyCoin('commentLikes')){commentCoinAwarded[cid]=true;state.coins+=1;updateCoins();}
            }
            span.textContent=ct;
        };
    });
}
function bindCommentDeletes(postId,countEl){
    $$('.comment-delete-btn').forEach(function(btn){
        if(btn._delBound)return;btn._delBound=true;
        btn.addEventListener('click',async function(){
            var cid=btn.dataset.cid;
            if(!confirm('Delete this comment?'))return;
            try{
                await sbDeleteComment(cid);
                var item=btn.closest('.comment-item');
                if(item) item.remove();
                showToast('Comment deleted');
                // Refresh inline comments for the post
                if(postId) renderInlineComments(postId);
            }catch(e){
                console.error('Delete comment error:',e);
                showToast('Failed to delete: '+(e.message||'Unknown error'));
            }
        });
    });
    $$('.comment-edit-btn').forEach(function(btn){
        if(btn._editBound)return;btn._editBound=true;
        btn.addEventListener('click',function(){
            var cid=btn.dataset.cid;
            var text=btn.dataset.text||'';
            showEditCommentModal(cid,text,function(newText){
                var item=btn.closest('.comment-item');
                if(item){var p=item.querySelector('.comment-text');if(p)p.textContent=newText;}
                btn.dataset.text=newText;
                if(postId) renderInlineComments(postId);
            });
        });
    });
}

async function renderInlineComments(postId){
    var el=document.querySelector('.post-comments[data-post-id="'+postId+'"]');
    if(!el)return;
    var all=[];
    var isUUID=/^[0-9a-f]{8}-/.test(postId);
    if(isUUID){
        try{
            var sbComments=await sbGetCommentsLite(postId,20);
            sbComments.forEach(function(c){
                var authorName=(c.author?c.author.display_name||c.author.username:'User');
                var authorAvatar=(c.author?c.author.avatar_url:null);
                var isReply=!!c.parent_comment_id;
                all.push({name:authorName,img:authorAvatar,text:c.content,likes:0,cid:c.id,isReply:isReply,parentId:c.parent_comment_id||null,authorId:c.author_id});
            });
        }catch(e){
            console.error('Inline comments error for post '+postId+':',e);
            el.innerHTML='<p style="color:#e74c3c;font-size:11px;padding:4px 20px;">Comments failed: '+escapeHtml(e.message||'Unknown error')+'</p>';
            return;
        }
    } else {
        var user=state.comments[postId]||[];
        var _myN=currentUser?(currentUser.display_name||currentUser.username):'You';
        user.forEach(function(t,i){all.push({name:_myN,img:null,text:t,likes:0,cid:postId+'-u-'+i});});
    }
    // Filter out comments from blocked users
    all=all.filter(function(c){return !c.authorId||!blockedUsers[c.authorId];});
    if(!all.length){el.innerHTML='';el.style.padding='';return;}
    // Separate top-level and replies for threaded display (flatten nested under top-level ancestor)
    var commentById={};
    all.forEach(function(c){commentById[c.cid]=c;});
    var topLevel=all.filter(function(c){return !c.isReply;});
    var repliesByParent={};
    var nameById={};
    all.forEach(function(c){nameById[c.cid]=c.name;});
    all.filter(function(c){return c.isReply;}).forEach(function(c){
        var root=c.parentId;
        var visited={};
        while(commentById[root]&&commentById[root].parentId&&!visited[root]){visited[root]=true;root=commentById[root].parentId;}
        if(!repliesByParent[root])repliesByParent[root]=[];
        repliesByParent[root].push(c);
    });
    // Show up to 3 top-level comments with their replies
    var shownTop=topLevel.slice(0,3);
    var totalShown=0;
    var html='';
    shownTop.forEach(function(c){
        totalShown++;
        var liked=likedComments[c.cid];var lc=c.likes+(liked?1:0);
        var disliked=dislikedComments[c.cid];var dc=disliked?1:0;
        var avatarSrc=c.img||DEFAULT_AVATAR;
        var isOwnComment=currentUser&&c.authorId&&c.authorId===currentUser.id;
        var editBtn=isOwnComment?'<button class="inline-comment-edit" data-cid="'+c.cid+'" data-postid="'+postId+'" data-text="'+escapeHtml(c.text)+'" style="background:none;font-size:11px;color:#999;cursor:pointer;"><i class="fas fa-pen"></i></button>':'';
        var deleteBtn=isOwnComment?'<button class="inline-comment-delete" data-cid="'+c.cid+'" data-postid="'+postId+'" style="background:none;font-size:11px;color:#e74c3c;cursor:pointer;"><i class="fas fa-trash"></i></button>':'';
        var cGifMatch=c.text.match(/^\[gif\](.*?)\[\/gif\]$/);
        var cContent=cGifMatch?'<img src="'+escapeHtml(cGifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy">':'<p style="font-size:12px;color:#555;margin-top:2px;">'+renderMentionsInText(escapeHtmlNl(c.text))+'</p>';
        html+='<div class="inline-comment" data-cid="'+c.cid+'"><img src="'+avatarSrc+'" class="inline-comment-avatar" style="object-fit:cover;"><div><div class="inline-comment-bubble"><strong style="font-size:12px;display:block;">'+escapeHtml(c.name)+'</strong>'+cContent+'</div><div style="display:flex;gap:10px;margin-top:6px;margin-left:4px;"><button class="inline-comment-like" data-cid="'+c.cid+'" data-aid="'+(c.authorId||'')+'" style="background:none;font-size:11px;color:'+(liked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(liked?'fas':'far')+' fa-thumbs-up"></i>'+lc+'</button><button class="inline-comment-dislike" data-cid="'+c.cid+'" data-aid="'+(c.authorId||'')+'" style="background:none;font-size:11px;color:'+(disliked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(disliked?'fas':'far')+' fa-thumbs-down"></i>'+dc+'</button><button class="inline-comment-reply" data-cid="'+c.cid+'" style="background:none;font-size:11px;color:#999;cursor:pointer;"><i class="far fa-comment"></i> Reply</button>'+editBtn+deleteBtn+'</div></div></div>';
        // Show replies threaded under this comment
        var replies=repliesByParent[c.cid]||[];
        var shownReplies=replies.slice(0,2);
        shownReplies.forEach(function(r){
            totalShown++;
            var rLiked=likedComments[r.cid];var rlc=r.likes+(rLiked?1:0);
            var rDisliked=dislikedComments[r.cid];var rdc=rDisliked?1:0;
            var rAvatar=r.img||DEFAULT_AVATAR;
            var rIsOwn=currentUser&&r.authorId&&r.authorId===currentUser.id;
            var rEdit=rIsOwn?'<button class="inline-comment-edit" data-cid="'+r.cid+'" data-postid="'+postId+'" data-text="'+escapeHtml(r.text)+'" style="background:none;font-size:11px;color:#999;cursor:pointer;"><i class="fas fa-pen"></i></button>':'';
            var rDel=rIsOwn?'<button class="inline-comment-delete" data-cid="'+r.cid+'" data-postid="'+postId+'" style="background:none;font-size:11px;color:#e74c3c;cursor:pointer;"><i class="fas fa-trash"></i></button>':'';
            var rGifMatch=r.text.match(/^\[gif\](.*?)\[\/gif\]$/);
            var rContent=rGifMatch?'<img src="'+escapeHtml(rGifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy">':'<p style="font-size:12px;color:#555;margin-top:2px;"><i class="fas fa-reply" style="font-size:9px;color:var(--primary);margin-right:4px;transform:scaleX(-1);"></i><span style="color:var(--primary);font-size:11px;margin-right:3px;">@'+escapeHtml(c.name)+'</span>'+renderMentionsInText(escapeHtmlNl(r.text))+'</p>';
            html+='<div class="inline-comment" style="margin-left:28px;" data-cid="'+r.cid+'"><img src="'+rAvatar+'" class="inline-comment-avatar" style="object-fit:cover;"><div><div class="inline-comment-bubble"><strong style="font-size:12px;display:block;">'+escapeHtml(r.name)+'</strong>'+rContent+'</div><div style="display:flex;gap:10px;margin-top:6px;margin-left:4px;"><button class="inline-comment-like" data-cid="'+r.cid+'" data-aid="'+(r.authorId||'')+'" style="background:none;font-size:11px;color:'+(rLiked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(rLiked?'fas':'far')+' fa-thumbs-up"></i>'+rlc+'</button><button class="inline-comment-dislike" data-cid="'+r.cid+'" data-aid="'+(r.authorId||'')+'" style="background:none;font-size:11px;color:'+(rDisliked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(rDisliked?'fas':'far')+' fa-thumbs-down"></i>'+rdc+'</button><button class="inline-comment-reply" data-cid="'+r.cid+'" style="background:none;font-size:11px;color:#999;cursor:pointer;"><i class="far fa-comment"></i> Reply</button>'+rEdit+rDel+'</div></div></div>';
        });
        if(replies.length>2) html+='<a href="#" class="show-more-comments" style="font-size:11px;color:var(--primary);display:block;margin-left:28px;margin-top:2px;margin-bottom:4px;">'+( replies.length-2)+' more repl'+(replies.length-2===1?'y':'ies')+'</a>';
    });
    if(all.length>totalShown) html+='<a href="#" class="show-more-comments" style="font-size:12px;color:var(--primary);display:block;margin-top:4px;">See all '+all.length+' comments</a>';
    el.style.padding='0 20px 14px';el.innerHTML=html;
    el.querySelectorAll('.inline-comment-like').forEach(function(btn){
        btn.onclick=function(e){
            e.stopPropagation();var cid=btn.dataset.cid;var liked=likedComments[cid];
            var base=parseInt(btn.querySelector('span')?btn.querySelector('span').textContent:btn.lastChild.textContent)||0;
            var disBtn=btn.parentNode.querySelector('.inline-comment-dislike');
            if(liked){delete likedComments[cid];btn.style.color='#999';btn.querySelector('i').className='far fa-thumbs-up';btn.lastChild.textContent=Math.max(0,base-1);}
            else{
                if(dislikedComments[cid]&&disBtn){delete dislikedComments[cid];disBtn.style.color='#999';disBtn.querySelector('i').className='far fa-thumbs-down';disBtn.lastChild.textContent=0;}
                likedComments[cid]=true;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-up';btn.lastChild.textContent=base+1;
                var isOwnC=currentUser&&btn.dataset.aid&&btn.dataset.aid===currentUser.id;
                if(!isOwnC&&!commentCoinAwarded[cid]&&_incrementDailyCoin('commentLikes')){commentCoinAwarded[cid]=true;state.coins+=1;updateCoins();}
                // Like comment in Supabase
                if(/^[0-9a-f]{8}-/.test(cid)&&currentUser){sbToggleLike(currentUser.id,'comment',cid).catch(function(){});}
            }
        };
    });
    el.querySelectorAll('.inline-comment-dislike').forEach(function(btn){
        btn.onclick=function(e){
            e.stopPropagation();var cid=btn.dataset.cid;var disliked=dislikedComments[cid];
            var likeBtn=btn.parentNode.querySelector('.inline-comment-like');
            if(disliked){delete dislikedComments[cid];btn.style.color='#999';btn.querySelector('i').className='far fa-thumbs-down';btn.lastChild.textContent=0;}
            else{
                if(likedComments[cid]&&likeBtn){delete likedComments[cid];likeBtn.style.color='#999';likeBtn.querySelector('i').className='far fa-thumbs-up';var lv=parseInt(likeBtn.lastChild.textContent)||0;likeBtn.lastChild.textContent=Math.max(0,lv-1);}
                dislikedComments[cid]=true;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-down';btn.lastChild.textContent=1;
                var isOwnC=currentUser&&btn.dataset.aid&&btn.dataset.aid===currentUser.id;
                if(!isOwnC&&!commentCoinAwarded[cid]&&_incrementDailyCoin('commentLikes')){commentCoinAwarded[cid]=true;state.coins+=1;updateCoins();}
            }
        };
    });
    el.querySelectorAll('.inline-comment-reply').forEach(function(btn){
        btn.onclick=function(e){
            e.stopPropagation();
            showComments(postId,el.closest('.feed-post').querySelector('.comment-btn span'),null,btn.dataset.cid);
        };
    });
    el.querySelectorAll('.inline-comment-delete').forEach(function(btn){
        btn.onclick=async function(e){
            e.stopPropagation();
            var cid=btn.dataset.cid;
            try{
                await sbDeleteComment(cid);
                var item=btn.closest('.inline-comment');
                if(item) item.remove();
                showToast('Comment deleted');
                renderInlineComments(postId);
            }catch(err){showToast('Failed to delete comment');}
        };
    });
    el.querySelectorAll('.inline-comment-edit').forEach(function(btn){
        btn.onclick=function(e){
            e.stopPropagation();
            showEditCommentModal(btn.dataset.cid,btn.dataset.text||'',function(){renderInlineComments(btn.dataset.postid);});
        };
    });
    el.querySelectorAll('.show-more-comments').forEach(function(link){
        link.addEventListener('click',function(e){e.preventDefault();showComments(postId,el.closest('.feed-post').querySelector('.comment-btn span'));});
    });
}

async function showProfileModal(person){
    var name=person.display_name||person.name||person.username||'User';
    var bio=person.bio||'';
    var avatar=person.avatar_url||DEFAULT_AVATAR;
    var isFollowed=state.followedUsers[person.id];
    var following=0,followers=0;
    try{var fc=await sbGetFollowCounts(person.id);following=fc.following;followers=fc.followers;}catch(e){}
    var html='<div class="modal-header"><h3>Profile</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body"><div class="modal-profile-top"><img src="'+avatar+'" alt="'+name+'"><h3>'+name+'</h3><p>'+bio+'</p></div>';
    html+='<div class="modal-profile-stats"><div class="stat"><span class="stat-count">'+following+'</span><span class="stat-label">Following</span></div><div class="stat"><span class="stat-count">'+followers+'</span><span class="stat-label">Followers</span></div></div>';
    html+='<div class="modal-actions"><button class="btn '+(isFollowed?'btn-disabled':'btn-green')+'" id="modalFollowBtn" data-uid="'+person.id+'">'+(isFollowed?'<i class="fas fa-check"></i> Following':'<i class="fas fa-plus"></i> Follow')+'</button>';
    html+='<button class="btn btn-primary" id="modalMsgBtn" data-uid="'+person.id+'"><i class="fas fa-envelope"></i> Message</button>';
    html+='<button class="btn btn-outline" id="modalViewProfileBtn"><i class="fas fa-user"></i> View Profile</button>';
    html+='<button class="btn btn-outline" id="modalBlockBtn" data-uid="'+person.id+'" style="color:#e74c3c;border-color:#e74c3c;">'+(blockedUsers[person.id]?'<i class="fas fa-unlock"></i> Unblock':'<i class="fas fa-ban"></i> Block')+'</button></div>';
    html+='</div>';
    showModal(html);
    document.getElementById('modalFollowBtn').addEventListener('click',function(){
        toggleFollow(person.id,this);
    });
    document.getElementById('modalMsgBtn').addEventListener('click',function(){
        closeModal();startConversation(person.id,person.display_name||person.name||person.username,person.avatar_url);
    });
    document.getElementById('modalViewProfileBtn').addEventListener('click',function(){
        closeModal();
        showProfileView(person);
    });
    document.getElementById('modalBlockBtn').addEventListener('click',function(){
        if(blockedUsers[person.id]){
            unblockUser(person.id);
            closeModal();
            showProfileModal(person);
        } else {
            showBlockConfirmModal(person);
        }
    });
}

function showMyProfileModal(){
    var _mn=currentUser?(currentUser.display_name||currentUser.username):'You';
    var _mb=currentUser?currentUser.bio:'';
    var html='<div class="modal-header"><h3>My Profile</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body"><div class="modal-profile-top"><img src="'+getMyAvatar()+'" alt="'+_mn+'"><h3>'+_mn+'</h3><p>'+_mb+'</p></div>';
    html+='<div class="modal-profile-stats"><div class="stat"><span class="stat-count">'+state.following+'</span><span class="stat-label">Following</span></div><div class="stat"><span class="stat-count">'+state.followers+'</span><span class="stat-label">Followers</span></div></div>';
    html+='<div style="text-align:center;"><p style="color:#777;font-size:13px;">Active Skin: '+(state.activeSkin?skins.find(function(s){return s.id===state.activeSkin;}).name:'Default')+'</p></div>';
    html+='<div class="modal-actions" style="margin-top:16px;"><button class="btn btn-outline" id="modalViewMyProfileBtn"><i class="fas fa-user"></i> View Profile</button></div></div>';
    showModal(html);
    document.getElementById('modalViewMyProfileBtn').addEventListener('click',function(){
        closeModal();
        showProfileView({id:currentUser?currentUser.id:0,name:currentUser?(currentUser.display_name||currentUser.username):'You',status:currentUser?currentUser.status||'':'',bio:currentUser?currentUser.bio||'':'',img:12,avatar_url:currentUser?currentUser.avatar_url:null,cover_photo_url:state.coverPhoto||null,isMe:true});
    });
}

// Convert Supabase profile to person object for showProfileView
function profileToPerson(p){
    var sd=p.skin_data||{};
    return {
        id:p.id,
        name:p.display_name||p.username,
        status:p.status||'',
        bio:p.bio||'',
        avatar_url:p.avatar_url,
        cover_photo_url:p.cover_photo_url||null,
        website_url:p.website_url||null,
        last_seen:p.last_seen||null,
        premiumSkin:sd.activePremiumSkin||null,
        skin:sd.activeSkin||null,
        font:sd.activeFont||null,
        template:sd.activeTemplate||null,
        premiumBg:sd.premiumBgUrl?{src:sd.premiumBgUrl,overlay:sd.premiumBgOverlay!=null?sd.premiumBgOverlay:0,darkness:sd.premiumBgDarkness!=null?sd.premiumBgDarkness:0,cardTrans:sd.premiumCardTransparency!=null?sd.premiumCardTransparency:0.1}:null
    };
}
function viewProfile(userId){
    sbGetProfile(userId).then(function(p){
        if(p) showProfileView(profileToPerson(p));
    }).catch(function(e){console.warn('viewProfile error:',e);});
}
// ======================== PROFILE VIEW PAGE ========================
async function showProfileView(person){
    // Allow viewing own profile even if somehow in blockedUsers; block viewing others
    if(person.id&&!person.isMe&&blockedUsers[person.id]){showToast('This user is blocked');return;}
    pvPhotoTab='photos';
    $$('.page').forEach(function(p){p.classList.remove('active');});
    document.getElementById('page-profile-view').classList.add('active');
    $$('.nav-link').forEach(function(l){l.classList.remove('active');});
    _navPrev=_navCurrent;_navCurrent='profile-view';
    if(!_navFromPopstate) history.pushState({page:'profile-view'},'','#profile-view');
    window.scrollTo(0,0);

    var isMe=person.isMe||false;
    var isFollowed=state.followedUsers[person.id];
    var following=0, followers=0;
    if(isMe){ following=state.following; followers=state.followers; }
    else { try{ var fc=await sbGetFollowCounts(person.id); following=fc.following; followers=fc.followers; }catch(e){} }

    // Restore previous skin if we're coming from another profile view
    if(_pvSaved){
        premiumBgImage=_pvSaved.bgImage;premiumBgOverlay=_pvSaved.bgOverlay;premiumBgDarkness=_pvSaved.bgDarkness||0;premiumCardTransparency=_pvSaved.cardTrans!=null?_pvSaved.cardTrans:0.1;
        state.activePremiumSkin=_pvSaved.premiumSkin||null;state.activeSkin=_pvSaved.skin||null;state.activeFont=_pvSaved.font||null;state.activeTemplate=_pvSaved.tpl||null;
        applySkin(_pvSaved.skin||null,true);
        if(_pvSaved.premiumSkin)applyPremiumSkin(_pvSaved.premiumSkin,true);else updatePremiumBg();
        applyFont(_pvSaved.font||null,true);
        _pvSaved=null;
    }
    // Apply viewed person's skin/font/template (silent, don't change state)
    _pvSaved={skin:state.activeSkin,premiumSkin:state.activePremiumSkin,font:state.activeFont,tpl:state.activeTemplate,bgImage:premiumBgImage,bgOverlay:premiumBgOverlay,bgDarkness:premiumBgDarkness,cardTrans:premiumCardTransparency};
    if(!isMe){
        if(person.premiumSkin){
            applyPremiumSkin(person.premiumSkin,true);
            if(person.premiumBg){premiumBgImage=person.premiumBg.src;premiumBgOverlay=person.premiumBg.overlay!=null?person.premiumBg.overlay:0;premiumBgDarkness=person.premiumBg.darkness!=null?person.premiumBg.darkness:0;premiumCardTransparency=person.premiumBg.cardTrans!=null?person.premiumBg.cardTrans:0.1;}
            else{premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;}
            // Temporarily set activePremiumSkin so updatePremiumBg shows the bg
            state.activePremiumSkin=person.premiumSkin;
            updatePremiumBg();
        } else {
            premiumBgImage=null;updatePremiumBg();
            applySkin(person.skin||null,true);
        }
        applyFont(person.font||null,true);
    }

    // Cover banner
    var coverUrl=person.cover_photo_url||(isMe?state.coverPhoto:null);
    $('#pvCoverBanner').style.backgroundImage=coverUrl?'url('+coverUrl+')':'';
    // Show cover edit button on own profile
    var pvCoverBtn=$('#pvCoverEditBtn');
    if(pvCoverBtn) pvCoverBtn.style.display=isMe?'flex':'none';

    // Profile card - matches home sidebar style
    var cardHtml='<div class="profile-cover" style="background:linear-gradient(135deg,var(--primary),var(--primary-hover));"></div>';
    cardHtml+='<div class="profile-info">';
    var pvAvatarSrc=person.avatar_url||DEFAULT_AVATAR;
    cardHtml+='<div class="profile-avatar-wrap"><img src="'+pvAvatarSrc+'" alt="'+escapeHtml(person.name)+'" class="profile-avatar"></div>';
    cardHtml+='<h3 class="profile-name">'+escapeHtml(person.name)+'</h3>';
    // Badges
    if(isMe&&state.earnedBadges){
        var badgeHtml='';
        _badgeDefs.forEach(function(b){if(state.earnedBadges[b.id]) badgeHtml+='<span class="user-badge" title="'+escapeHtml(b.name)+'" style="background:'+b.color+';"><i class="fas '+b.icon+'"></i></span>';});
        if(badgeHtml) cardHtml+='<div class="badge-row" style="margin-top:4px;">'+badgeHtml+'</div>';
    }
    // Streak
    if(!isMe&&currentUser){
        var streak=getStreak(person.id);
        if(streak>0) cardHtml+='<div style="font-size:12px;color:#f59e0b;margin-top:4px;"><i class="fas fa-fire"></i> '+streak+' day streak</div>';
    }
    // Online status
    if(!isMe&&person.last_seen){
        var onlineInfo=getOnlineStatus(person.last_seen);
        cardHtml+='<div style="font-size:11px;margin-top:2px;color:'+(onlineInfo.online?'#10b981':'var(--gray)')+';">'+(onlineInfo.online?'<i class="fas fa-circle" style="font-size:8px;margin-right:4px;"></i>':'')+onlineInfo.text+'</div>';
    }
    if(person.status) cardHtml+='<p class="profile-title">'+escapeHtml(person.status)+'</p>';
    if(person.bio) cardHtml+='<p class="profile-about">'+escapeHtml(person.bio)+'</p>';
    if(person.website_url) cardHtml+='<a href="'+escapeHtml(person.website_url)+'" target="_blank" rel="noopener" class="profile-website"><i class="fas fa-link"></i> '+escapeHtml(person.website_url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])+'</a>';
    // Mutual followers placeholder (filled async below)
    if(!isMe) cardHtml+='<div id="pvMutualFollowers"></div>';
    var pvPriv=isMe?state.privateFollowers:!!person.priv;
    cardHtml+='<div class="profile-stats">';
    cardHtml+='<div class="stat stat-clickable pv-stat-following" style="'+(pvPriv?'opacity:.5;pointer-events:none;cursor:default;':'')+'"><span class="stat-count">'+following+'</span><span class="stat-label">Following'+(pvPriv?' <i class="fas fa-lock" style="font-size:10px;"></i>':'')+'</span></div>';
    cardHtml+='<div class="stat stat-clickable pv-stat-followers" style="'+(pvPriv?'opacity:.5;pointer-events:none;cursor:default;':'')+'"><span class="stat-count">'+followers+'</span><span class="stat-label">Followers'+(pvPriv?' <i class="fas fa-lock" style="font-size:10px;"></i>':'')+'</span></div>';
    cardHtml+='</div>';
    if(!isMe){
        cardHtml+='<div class="pv-actions"><button class="btn '+(isFollowed?'btn-disabled':'btn-primary')+'" id="pvFollowBtn" data-uid="'+person.id+'">'+(isFollowed?'<i class="fas fa-check"></i> Following':'<i class="fas fa-plus"></i> Follow')+'</button>';
        cardHtml+='<button class="btn btn-primary" id="pvMsgBtn"><i class="fas fa-envelope"></i> Message</button>';
        cardHtml+='<button class="btn btn-outline" id="pvMuteBtn" style="color:var(--gray);border-color:var(--gray);">'+(mutedUsers[person.id]?'<i class="fas fa-volume-up"></i> Unmute':'<i class="fas fa-volume-mute"></i> Mute')+'</button>';
        cardHtml+='<button class="btn btn-outline" id="pvBlockBtn" style="color:#e74c3c;border-color:#e74c3c;">'+(blockedUsers[person.id]?'<i class="fas fa-unlock"></i> Unblock':'<i class="fas fa-ban"></i> Block')+'</button>';
        cardHtml+='<button class="btn btn-outline" id="pvReportUserBtn" style="color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-flag"></i> Report</button>';
        cardHtml+='<button class="btn btn-outline" id="pvCloseFriendBtn" style="color:#f59e0b;border-color:#f59e0b;">'+(_closeFriends[person.id]?'<i class="fas fa-star"></i> Close Friend':'<i class="far fa-star"></i> Add Close Friend')+'</button>';
        cardHtml+='<button class="btn btn-outline" id="pvInviteGroupBtn" style="color:var(--primary);border-color:var(--primary);"><i class="fas fa-user-plus"></i> Invite to Group</button></div>';
        if(_isAdmin){
            cardHtml+='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">';
            cardHtml+='<span style="font-size:11px;color:var(--gray);display:flex;align-items:center;gap:4px;"><i class="fas fa-shield-halved" style="color:#e74c3c;"></i>Admin:</span>';
            cardHtml+='<button class="btn btn-outline" id="pvAdminSuspend" style="padding:4px 12px;font-size:11px;color:#f59e0b;border-color:#f59e0b;"><i class="fas fa-pause"></i> Suspend</button>';
            cardHtml+='<button class="btn" id="pvAdminDelete" style="padding:4px 12px;font-size:11px;background:#e74c3c;color:#fff;"><i class="fas fa-trash"></i> Delete Account</button>';
            cardHtml+='</div>';
        }
    }
    if(isMe) cardHtml+='<div class="pv-actions"><button class="btn btn-primary" id="pvEditProfileBtn"><i class="fas fa-pen"></i> Edit Profile</button></div>';
    cardHtml+='<div class="profile-links"><a href="#" class="pv-back-link" id="pvBack"><i class="fas fa-arrow-left"></i> Back to Home</a></div>';
    cardHtml+='</div>';
    $('#pvProfileCard').innerHTML=cardHtml;

    // Load mutual followers (async, non-blocking)
    if(!isMe&&currentUser){
        getMutualFollowers(person.id).then(function(mutuals){
            var mc=document.getElementById('pvMutualFollowers');
            if(mc&&mutuals&&mutuals.length) renderMutualFollowers(mc,mutuals);
        }).catch(function(){});
    }
    // Load profile song — switch to their song if not own profile
    if(!isMe){
        sbGetProfileSong(person.id).then(function(song){
            if(song) switchToProfileSong(song);
        }).catch(function(){});
    }

    // Photos card - tabbed: Photos | Albums (photos first)
    var pvUserId=isMe?currentUser.id:person.id;
    // Load viewed user's post photos if not own profile
    if(!isMe){
        try{
            var theirPosts=await sbGetUserPosts(pvUserId,50);
            var theirPhotos=[];
            (theirPosts||[]).forEach(function(p){
                var ts=new Date(p.created_at).getTime();
                if(p.media_urls&&p.media_urls.length) p.media_urls.forEach(function(u){if(!isVideoUrl(u)) theirPhotos.push({src:u,date:ts}); else theirPhotos.push({src:u,date:ts,isVideo:true});});
                else if(p.image_url){if(!isVideoUrl(p.image_url)) theirPhotos.push({src:p.image_url,date:ts}); else theirPhotos.push({src:p.image_url,date:ts,isVideo:true});}
            });
            _pvPostPhotos=theirPhotos;
        }catch(e){_pvPostPhotos=[];}
    } else { _pvPostPhotos=state.photos.post; }
    // Load albums from Supabase for viewed user
    try{_pvAlbums=await sbGetAlbums(pvUserId);console.log('[Albums] Loaded',_pvAlbums.length,'albums for',pvUserId);}catch(e){console.error('[Albums] Fetch error:',e);_pvAlbums=[];}
    var photosHtml='<div class="card photos-card"><h4 class="card-heading"><i class="fas fa-images" style="margin-right:8px;color:var(--primary);"></i>Photos</h4>';
    photosHtml+='<div class="search-tabs" id="pvPhotoTabs">';
    photosHtml+='<button class="search-tab'+(pvPhotoTab==='photos'?' active':'')+'" data-pvpt="photos"><i class="fas fa-image"></i> Photos</button>';
    photosHtml+='<button class="search-tab'+(pvPhotoTab==='albums'?' active':'')+'" data-pvpt="albums"><i class="fas fa-folder"></i> Albums</button>';
    photosHtml+='</div>';
    photosHtml+='<div id="pvPhotoContent"></div>';
    photosHtml+='</div>';
    document.getElementById('pvPhotosCard').innerHTML=photosHtml;
    _pvIsMe=isMe;_pvUserId=pvUserId;
    renderPvPhotoTab(isMe);
    $$('#pvPhotoTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        pvPhotoTab=tab.dataset.pvpt;
        $$('#pvPhotoTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        renderPvPhotoTab(_pvIsMe);
    });});

    // "What Skin Am I?" box - reads live state for own profile, person data for others
    var pvSkinId=isMe?(state.activePremiumSkin||state.activeSkin):(person.premiumSkin||person.skin);
    var pvFontId=isMe?state.activeFont:person.font;
    var pvTplId=isMe?state.activeTemplate:person.template;
    var pvSkinName=null;
    if(pvSkinId){pvSkinName=skins.find(function(s){return s.id===pvSkinId;})||premiumSkins.find(function(s){return s.id===pvSkinId;});}
    var pvFontName=pvFontId?fonts.find(function(f){return f.id===pvFontId;}):null;
    var pvTplName=pvTplId?templates.find(function(t){return t.id===pvTplId;}):null;
    var skinHtml='<div class="card" style="padding:20px;"><h4 style="font-size:15px;font-weight:600;margin-bottom:14px;"><i class="fas fa-wand-magic-sparkles" style="color:var(--primary);margin-right:8px;"></i>What Skin Am I?</h4>';
    skinHtml+='<div style="display:flex;flex-direction:column;gap:10px;">';
    skinHtml+='<div style="display:flex;align-items:center;gap:10px;font-size:13px;"><i class="fas fa-palette" style="width:16px;color:var(--primary);"></i><span style="color:var(--gray);">Skin:</span><strong>'+(pvSkinName?pvSkinName.name:'Default')+'</strong></div>';
    skinHtml+='<div style="display:flex;align-items:center;gap:10px;font-size:13px;"><i class="fas fa-font" style="width:16px;color:var(--primary);"></i><span style="color:var(--gray);">Font:</span><strong>'+(pvFontName?pvFontName.name:'Default')+'</strong></div>';
    skinHtml+='<div style="display:flex;align-items:center;gap:10px;font-size:13px;"><i class="fas fa-table-columns" style="width:16px;color:var(--primary);"></i><span style="color:var(--gray);">Template:</span><strong>'+(pvTplName?pvTplName.name:'Default')+'</strong></div>';
    skinHtml+='</div></div>';
    document.getElementById('pvSkinCard').innerHTML=skinHtml;

    // Posts feed - load from Supabase
    var feedHtml='';
    var userId=isMe?currentUser.id:person.id;
    try{
        var userPosts=await sbGetUserPosts(userId,10);
        // Re-sync like state from DB for these posts to fix any stale local state
        if(currentUser&&userPosts&&userPosts.length){
            try{
                var myLikes=await sbGetUserLikes(currentUser.id,'post');
                var likedIds={};(myLikes||[]).forEach(function(l){likedIds[l.target_id]=true;});
                userPosts.forEach(function(p){
                    if(likedIds[p.id]) state.likedPosts[p.id]=true;
                    else delete state.likedPosts[p.id];
                });
            }catch(e){}
        }
        if(!userPosts||!userPosts.length){
            feedHtml+='<div class="card" style="padding:40px;text-align:center;color:var(--gray);"><i class="fas fa-pen" style="font-size:32px;margin-bottom:12px;display:block;"></i><p>No posts yet.</p></div>';
        } else {
            userPosts.forEach(function(post){
                var authorName=person.name||(post.profiles?post.profiles.display_name||post.profiles.username:'User');
                var authorAvatar=(post.profiles?post.profiles.avatar_url:person.avatar_url)||DEFAULT_AVATAR;
                var postTime=post.created_at?timeAgo(Math.floor((Date.now()-new Date(post.created_at).getTime())/60000)):'';
                feedHtml+='<div class="card feed-post">';
                feedHtml+='<div class="post-header">';
                feedHtml+='<img src="'+authorAvatar+'" alt="'+escapeHtml(authorName)+'" class="post-avatar">';
                feedHtml+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username">'+escapeHtml(authorName)+'</h4><span class="post-time">'+postTime+'</span></div></div></div>';
                feedHtml+='<div class="post-description"><p>'+renderMentionsInText(escapeHtmlNl(post.content))+'</p></div>';
                var pvImgs=post.media_urls&&post.media_urls.length?post.media_urls:(post.image_url?[post.image_url]:[]);
                feedHtml+=buildMediaGrid(pvImgs);
                var pvLikes=post.like_count||0;
                var pvComments=(post.comments&&post.comments[0])?post.comments[0].count:0;
                var pvReaction=_postReactions[post.id];
                feedHtml+='<div class="post-actions"><div class="action-left">';
                feedHtml+='<button class="action-btn like-btn'+(state.likedPosts[post.id]?' liked':'')+'" data-post-id="'+post.id+'"><i class="'+(state.likedPosts[post.id]?'fas':'far')+' fa-thumbs-up"></i><span class="like-count">'+pvLikes+'</span></button>';
                feedHtml+='<button class="action-btn dislike-btn'+(state.dislikedPosts[post.id]?' disliked':'')+'" data-post-id="'+post.id+'"><i class="'+(state.dislikedPosts[post.id]?'fas':'far')+' fa-thumbs-down"></i><span class="dislike-count">0</span></button>';
                feedHtml+='<button class="action-btn react-btn" data-post-id="'+post.id+'" title="React">'+(pvReaction?'<span style="font-size:16px;">'+pvReaction+'</span>':'<i class="far fa-face-smile"></i>')+'</button>';
                feedHtml+='<button class="action-btn comment-btn"><i class="far fa-comment"></i><span>'+pvComments+'</span></button>';
                feedHtml+='<button class="action-btn share-btn"><i class="fas fa-share-from-square"></i><span>0</span></button>';
                feedHtml+='</div></div>';
                feedHtml+='<div class="post-comments" data-post-id="'+post.id+'"></div>';
                feedHtml+='</div>';
            });
        }
    }catch(e){
        console.error('pvPosts:',e);
        feedHtml+='<div class="card" style="padding:40px;text-align:center;color:var(--gray);"><i class="fas fa-pen" style="font-size:32px;margin-bottom:12px;display:block;"></i><p>No posts yet.</p></div>';
    }
    $('#pvPostsFeed').innerHTML=feedHtml;
    bindMentionClicks('#pvPostsFeed');
    bindHashtagClicks('#pvPostsFeed');
    autoFetchLinkPreviews(document.getElementById('pvPostsFeed'));
    // Load inline comments for profile view posts
    if(userPosts&&userPosts.length){
        userPosts.forEach(function(post){renderInlineComments(post.id);});
    }

    // Event: Back
    document.getElementById('pvBack').addEventListener('click',function(e){e.preventDefault();navigateTo('home');});
    // Event: Edit Profile (own profile)
    var pvEditBtn=document.getElementById('pvEditProfileBtn');
    if(pvEditBtn) pvEditBtn.addEventListener('click',function(){showMyProfileModal();});
    // Event: Follow
    var followBtn=document.getElementById('pvFollowBtn');
    if(followBtn){
        followBtn.addEventListener('click',function(){toggleFollow(person.id,this);});
    }
    // Event: View following/followers lists
    var pvFollowingStat=document.querySelector('.pv-stat-following');
    var pvFollowersStat=document.querySelector('.pv-stat-followers');
    if(pvFollowingStat){
        pvFollowingStat.addEventListener('click',async function(){
            var uid=isMe?currentUser.id:person.id;
            var title=isMe?'Following':person.name+'\'s Following';
            try{var list=await sbGetFollowing(uid);showFollowListModal(title,list,isMe);}catch(e){console.error(e);}
        });
    }
    if(pvFollowersStat){
        pvFollowersStat.addEventListener('click',async function(){
            var uid=isMe?currentUser.id:person.id;
            var title=isMe?'Followers':person.name+'\'s Followers';
            try{var list=await sbGetFollowers(uid);showFollowListModal(title,list,false);}catch(e){console.error(e);}
        });
    }
    // Event: Message
    var msgBtn=document.getElementById('pvMsgBtn');
    if(msgBtn){
        msgBtn.addEventListener('click',function(){
            startConversation(person.id,person.name||person.display_name||person.username,person.avatar_url);
        });
    }
    var blockBtn=document.getElementById('pvBlockBtn');
    if(blockBtn){
        blockBtn.addEventListener('click',function(){
            if(blockedUsers[person.id]){
                unblockUser(person.id);
                showProfileView(person);
            } else {
                showBlockConfirmModal(person,function(){showProfileView(person);});
            }
        });
    }
    // Event: Mute
    var muteBtn=document.getElementById('pvMuteBtn');
    if(muteBtn){
        muteBtn.addEventListener('click',function(){
            if(mutedUsers[person.id]){unmuteUser(person.id);showProfileView(person);}
            else showMuteConfirmModal(person,function(){showProfileView(person);});
        });
    }
    // Event: Close Friend
    var cfBtn=document.getElementById('pvCloseFriendBtn');
    if(cfBtn){
        cfBtn.addEventListener('click',function(){toggleCloseFriend(person.id);showProfileView(person);});
    }
    // Event: Report User
    var reportUserBtn=document.getElementById('pvReportUserBtn');
    if(reportUserBtn){
        reportUserBtn.addEventListener('click',function(){showReportUserModal(person);});
    }
    // Event: Invite to Group
    var inviteGroupBtn=document.getElementById('pvInviteGroupBtn');
    if(inviteGroupBtn){
        inviteGroupBtn.addEventListener('click',function(){
            showInviteToGroupModal(person);
        });
    }
    // Event: Admin actions on profile
    var pvAdminSuspend=document.getElementById('pvAdminSuspend');
    if(pvAdminSuspend){
        pvAdminSuspend.addEventListener('click',function(){
            showModal('<div class="modal-header"><h3><i class="fas fa-pause-circle" style="color:#f59e0b;margin-right:8px;"></i>Suspend User</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;margin-bottom:16px;">Toggle suspension for <strong>'+escapeHtml(person.name)+'</strong>?</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmPvSuspend" style="background:#f59e0b;color:#fff;">Confirm</button></div></div>');
            document.getElementById('confirmPvSuspend').addEventListener('click',async function(){closeModal();try{var s=await sbAdminToggleSuspend(person.id);showToast(person.name+(s?' suspended':' unsuspended'));}catch(e){showToast('Error: '+(e.message||'Failed'));}});
        });
    }
    var pvAdminDelete=document.getElementById('pvAdminDelete');
    if(pvAdminDelete){
        pvAdminDelete.addEventListener('click',function(){
            showModal('<div class="modal-header"><h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Admin: Delete User</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;margin-bottom:12px;">Permanently delete <strong>'+escapeHtml(person.name)+'</strong>?</p><p style="text-align:center;font-size:13px;color:#e74c3c;margin-bottom:16px;">All posts, comments, messages, and files will be permanently removed.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmPvAdminDel" style="background:#e74c3c;color:#fff;">Delete Account</button></div></div>');
            document.getElementById('confirmPvAdminDel').addEventListener('click',async function(){closeModal();try{await sbAdminDeleteUser(person.id);showToast(person.name+'\'s account deleted');navigateTo('home');}catch(e){showToast('Error: '+(e.message||'Failed'));}});
        });
    }
    // Event: Likes
    $$('#pvPostsFeed .like-btn').forEach(function(btn){
        btn.addEventListener('click',async function(e){
            var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.like-count');var count=parseInt(countEl.textContent);
            var isUUID=/^[0-9a-f]{8}-/.test(pid);
            var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);
            if(isUUID&&currentUser){
                try{
                    // Let DB be the source of truth — toggle returns new state
                    var nowLiked=await sbToggleLike(currentUser.id,'post',pid);
                    if(nowLiked){
                        state.likedPosts[pid]=true;btn.classList.add('liked');btn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;
                        // Clear dislike if active
                        if(state.dislikedPosts[pid]){var db=btn.closest('.action-left').querySelector('.dislike-btn');if(db){var dc=db.querySelector('.dislike-count');dc.textContent=Math.max(0,parseInt(dc.textContent)-1);db.classList.remove('disliked');db.querySelector('i').className='far fa-thumbs-down';}delete state.dislikedPosts[pid];}
                    } else {
                        delete state.likedPosts[pid];btn.classList.remove('liked');btn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);
                    }
                }catch(e2){console.warn('Like toggle error:',e2);}
            } else {
                // Non-UUID fallback (legacy)
                if(state.likedPosts[pid]){delete state.likedPosts[pid];btn.classList.remove('liked');btn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);}
                else{state.likedPosts[pid]=true;btn.classList.add('liked');btn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;}
            }
            var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)){if(!had&&has&&_incrementDailyCoin('postLikes')){state.coins++;updateCoins();showCoinEarnAnimation(btn,1);}else if(had&&!has){state.coins--;updateCoins();showCoinEarnAnimation(btn,-1);}}
            saveState();
        });
    });
    $$('#pvPostsFeed .dislike-btn').forEach(function(btn){
        btn.addEventListener('click',async function(){
            var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.dislike-count');var count=parseInt(countEl.textContent);
            var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);
            if(state.dislikedPosts[pid]){delete state.dislikedPosts[pid];btn.classList.remove('disliked');btn.querySelector('i').className='far fa-thumbs-down';countEl.textContent=Math.max(0,count-1);}
            else{
                if(state.likedPosts[pid]){var lb=btn.closest('.action-left').querySelector('.like-btn');var lc=lb.querySelector('.like-count');lc.textContent=Math.max(0,parseInt(lc.textContent)-1);delete state.likedPosts[pid];lb.classList.remove('liked');lb.querySelector('i').className='far fa-thumbs-up';
                    var isUUID=/^[0-9a-f]{8}-/.test(pid);
                    if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}
                }
                state.dislikedPosts[pid]=true;btn.classList.add('disliked');btn.querySelector('i').className='fas fa-thumbs-down';countEl.textContent=count+1;
            }
            var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)){if(!had&&has&&_incrementDailyCoin('postLikes')){state.coins++;updateCoins();showCoinEarnAnimation(btn,1);}else if(had&&!has){state.coins--;updateCoins();showCoinEarnAnimation(btn,-1);}}
            saveState();
        });
    });
    // Event: Comments
    $$('#pvPostsFeed .comment-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var postId=btn.closest('.action-left').querySelector('.like-btn').getAttribute('data-post-id');
            showComments(postId,btn.querySelector('span'));
        });
    });
    // Event: Share
    $$('#pvPostsFeed .share-btn').forEach(function(btn){btn.addEventListener('click',function(){handleShare(btn);});});
    // Event: Emoji reactions
    $$('#pvPostsFeed .react-btn').forEach(function(btn){btn.addEventListener('click',function(){var postId=btn.getAttribute('data-post-id');showReactionPicker(postId,btn);});});
    bindLikeCountClicks('#pvPostsFeed');
}

function showGroupModal(group){
    var joined=state.joinedGroups[group.id];
    var html='<div class="modal-header"><h3>'+escapeHtml(group.name)+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body"><div style="text-align:center;margin-bottom:20px;"><div style="width:64px;height:64px;border-radius:16px;background:'+group.color+';color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;"><i class="fas '+group.icon+'"></i></div>';
    html+='<h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">'+escapeHtml(group.name)+'</h3><p style="color:#777;font-size:14px;margin-bottom:8px;">'+escapeHtml(group.desc)+'</p>';
    html+='<span class="group-members"><i class="fas fa-users"></i> '+fmtNum(group.members)+' members</span></div>';
    html+='<div class="modal-actions"><button class="btn '+(joined?'btn-disabled':'btn-primary')+'" id="modalJoinBtn" data-gid="'+group.id+'">'+(joined?'Joined':'Join Group')+'</button></div></div>';
    showModal(html);
    document.getElementById('modalJoinBtn').addEventListener('click',async function(){
        if(!state.joinedGroups[group.id]&&currentUser){
            try{
                await sbJoinGroup(group.id,currentUser.id);
                state.joinedGroups[group.id]=true;
                group.members++;
                saveState();
                this.textContent='Joined';
                this.classList.remove('btn-primary');
                this.classList.add('btn-disabled');
                addNotification('group','You joined the group "'+group.name+'"');
            }catch(e2){console.error('Join group:',e2);showToast('Failed to join group');}
        }
    });
}

function getGroupThemeColor(group){
    var premSkin=state.groupActivePremiumSkin[group.id];
    var basicSkin=state.groupActiveSkin[group.id];
    if(premSkin){var ps=premiumSkins.find(function(s){return s.id===premSkin;});if(ps)return ps.accent;}
    if(basicSkin&&skinColors[basicSkin])return skinColors[basicSkin].primary;
    return group.color||'var(--primary)';
}
function showUnifiedCropModal(opts){
    var isSquare=!opts.aspectRatio;
    var html='<div class="modal-header"><h3>'+opts.title+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body" style="text-align:center;">';
    if(!isSquare) html+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Drag to position. Resize the selection area.</p>';
    html+='<div class="crop-container" id="cropContainer" style="position:relative;display:inline-block;max-width:100%;overflow:hidden;">';
    html+='<img src="'+opts.src+'" crossorigin="anonymous" id="cropImg" style="max-width:100%;display:block;">';
    html+='<div id="cropBox" style="position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.5);cursor:move;">';
    html+='<div id="cropResize" style="position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;background:#fff;border:1px solid #333;cursor:nwse-resize;"></div></div></div>';
    html+='<div style="margin-top:16px;"><button class="btn btn-primary" id="cropConfirmBtn">Apply</button></div></div>';
    showModal(html);
    var img=document.getElementById('cropImg');var box=document.getElementById('cropBox');var resizeHandle=document.getElementById('cropResize');
    function _initBox(){
        if(isSquare){var size=Math.min(img.clientWidth,img.clientHeight,200);if(size<10){setTimeout(_initBox,50);return;}box.style.width=size+'px';box.style.height=size+'px';box.style.left=((img.clientWidth-size)/2)+'px';box.style.top=((img.clientHeight-size)/2)+'px';}
        else{var w=Math.min(img.clientWidth,img.clientWidth*0.9);if(w<10){setTimeout(_initBox,50);return;}var h=Math.round(w/opts.aspectRatio);if(h>img.clientHeight*0.9){h=Math.round(img.clientHeight*0.9);w=Math.round(h*opts.aspectRatio);}box.style.width=w+'px';box.style.height=h+'px';box.style.left=((img.clientWidth-w)/2)+'px';box.style.top=((img.clientHeight-h)/2)+'px';}
    }
    if(img.complete&&img.naturalWidth>0) setTimeout(_initBox,50); else img.onload=function(){setTimeout(_initBox,50);};
    var dragging=false,resizing=false,startX,startY,startL,startT,startW,startH;
    function _ds(x,y,isR){_cropDragging=true;if(isR){resizing=true;startW=box.offsetWidth;startH=box.offsetHeight;}else{dragging=true;startL=box.offsetLeft;startT=box.offsetTop;}startX=x;startY=y;}
    function _dm(x,y){
        if(dragging){box.style.left=Math.max(0,Math.min(startL+(x-startX),img.clientWidth-box.offsetWidth))+'px';box.style.top=Math.max(0,Math.min(startT+(y-startY),img.clientHeight-box.offsetHeight))+'px';}
        if(resizing){
            if(isSquare){var d=Math.max(x-startX,y-startY);var ns=Math.max(40,Math.min(startW+d,img.clientWidth-box.offsetLeft,img.clientHeight-box.offsetTop));box.style.width=ns+'px';box.style.height=ns+'px';}
            else{var nw=Math.max(100,Math.min(startW+(x-startX),img.clientWidth-box.offsetLeft));var nh=Math.round(nw/opts.aspectRatio);if(nh>img.clientHeight-box.offsetTop){nh=img.clientHeight-box.offsetTop;nw=Math.round(nh*opts.aspectRatio);}box.style.width=nw+'px';box.style.height=nh+'px';}
        }
    }
    function _de(){dragging=false;resizing=false;setTimeout(function(){_cropDragging=false;},50);}
    box.addEventListener('mousedown',function(e){if(e.target===resizeHandle)return;_ds(e.clientX,e.clientY,false);e.preventDefault();});
    resizeHandle.addEventListener('mousedown',function(e){_ds(e.clientX,e.clientY,true);e.preventDefault();e.stopPropagation();});
    document.addEventListener('mousemove',function(e){_dm(e.clientX,e.clientY);});
    document.addEventListener('mouseup',_de);
    box.addEventListener('touchstart',function(e){if(e.target===resizeHandle)return;var t=e.touches[0];_ds(t.clientX,t.clientY,false);e.preventDefault();},{passive:false});
    resizeHandle.addEventListener('touchstart',function(e){var t=e.touches[0];_ds(t.clientX,t.clientY,true);e.preventDefault();e.stopPropagation();},{passive:false});
    document.addEventListener('touchmove',function(e){if(dragging||resizing){var t=e.touches[0];_dm(t.clientX,t.clientY);e.preventDefault();}},{passive:false});
    document.addEventListener('touchend',_de);
    document.getElementById('cropConfirmBtn').addEventListener('click',async function(){
        var btn=this;btn.disabled=true;btn.textContent='Saving...';
        var canvas=document.createElement('canvas');
        var scaleX=img.naturalWidth/img.clientWidth;var scaleY=img.naturalHeight/img.clientHeight;
        var sx=box.offsetLeft*scaleX,sy=box.offsetTop*scaleY,sw=box.offsetWidth*scaleX,sh=box.offsetHeight*scaleY;
        canvas.width=opts.outputWidth;canvas.height=opts.outputHeight;
        var ctx=canvas.getContext('2d');ctx.drawImage(img,sx,sy,sw,sh,0,0,opts.outputWidth,opts.outputHeight);
        var blob=await new Promise(function(r){canvas.toBlob(r,opts.format,opts.quality);});
        await opts.onConfirm(blob,canvas);
        closeModal();
    });
}
function showGroupProfileCropModal(src,group,isRecrop){
    showUnifiedCropModal({
        title:'Crop Group Photo', src:src,
        aspectRatio:null, outputWidth:400, outputHeight:400,
        format:'image/png', quality:undefined,
        onConfirm:async function(blob,canvas){
            var file=new File([blob],'group-avatar-'+Date.now()+'.png',{type:'image/png'});
            var publicUrl;
            try{
                if(isRecrop){var oldPath=sbExtractStoragePath(src,'avatars');publicUrl=oldPath?await sbUploadFile('avatars',oldPath,file):await sbUploadGroupImage(group.id,file,'avatar');}
                else publicUrl=await sbUploadGroupImage(group.id,file,'avatar');
                await sbUpdateGroup(group.id,{avatar_url:publicUrl});
                group.profileImg=publicUrl;
                if(!group.photos) group.photos={profile:[],cover:[]};
                if(!isRecrop) group.photos.profile.unshift({src:publicUrl,date:Date.now()});
            }catch(e){
                console.error('Group avatar upload:',e);showToast('Failed to save group photo: '+(e.message||''));
                group.profileImg=canvas.toDataURL('image/png');
            }
            showGroupView(group);renderGroups();
        }
    });
}
function showGroupCoverCropModal(src,group,banner,isRecrop){
    showUnifiedCropModal({
        title:'Crop Cover Photo', src:src,
        aspectRatio:1280/350, outputWidth:1280, outputHeight:350,
        format:'image/jpeg', quality:0.9,
        onConfirm:async function(blob,canvas){
            var file=new File([blob],'group-cover-'+Date.now()+'.jpg',{type:'image/jpeg'});
            var publicUrl;
            try{
                if(isRecrop){var oldPath=sbExtractStoragePath(src,'avatars');publicUrl=oldPath?await sbUploadFile('avatars',oldPath,file):await sbUploadGroupImage(group.id,file,'cover');}
                else publicUrl=await sbUploadGroupImage(group.id,file,'cover');
                await sbUpdateGroup(group.id,{cover_photo_url:publicUrl});
                group.coverPhoto=publicUrl;
                if(!group.photos) group.photos={profile:[],cover:[]};
                if(!isRecrop) group.photos.cover.unshift({src:publicUrl,date:Date.now()});
                banner.style.background='url('+publicUrl+') center/cover';
            }catch(e){
                console.error('Group cover upload:',e);showToast('Failed to save cover photo: '+(e.message||''));
                var fallback=canvas.toDataURL('image/jpeg',0.9);
                group.coverPhoto=fallback;banner.style.background='url('+fallback+') center/cover';
            }
            showGroupView(group);renderGroups();
        }
    });
}
// ======================== INVITE TO GROUP ========================
function showInviteToGroupModal(person){
    var personName=person.display_name||person.name||person.username||'User';
    // Filter to groups where current user is owner or member, and person is NOT already a member
    var myGroups=groups.filter(function(g){
        return g.owner_id===currentUser.id||state.joinedGroups[g.id];
    });
    if(!myGroups.length){showToast('You aren\'t in any groups yet');return;}
    var html='<div class="modal-header"><h3><i class="fas fa-user-plus" style="color:var(--primary);margin-right:8px;"></i>Invite to Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body" style="padding:16px;">';
    html+='<p style="text-align:center;margin-bottom:14px;font-size:14px;">Invite <strong>'+escapeHtml(personName)+'</strong> to a group:</p>';
    html+='<div id="inviteGroupList" style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;">';
    myGroups.forEach(function(g){
        var gIcon=g.profileImg?'<img src="'+g.profileImg+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">':'<div style="width:36px;height:36px;border-radius:50%;background:'+(g.color||'var(--primary)')+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;"><i class="fas '+(g.icon||'fa-users')+'"></i></div>';
        html+='<div class="invite-group-row" data-gid="'+g.id+'" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:background .15s;">';
        html+=gIcon;
        html+='<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeHtml(g.name)+'</div>';
        html+='<div style="font-size:12px;color:var(--gray);">'+g.members+' members</div></div>';
        html+='<button class="btn btn-primary invite-grp-btn" data-gid="'+g.id+'" style="font-size:12px;padding:5px 14px;flex-shrink:0;">Invite</button>';
        html+='</div>';
    });
    html+='</div></div>';
    showModal(html);
    $$('#inviteGroupList .invite-grp-btn').forEach(function(btn){
        btn.addEventListener('click',async function(e){
            e.stopPropagation();
            var gid=btn.dataset.gid;
            var g=groups.find(function(gr){return gr.id===gid;});
            if(!g) return;
            // Check if user is already a member
            try{
                var members=await sbGetGroupMembers(gid);
                if(members&&members.some(function(m){return m.user_id===person.id;})){
                    showToast(personName+' is already in '+g.name);
                    return;
                }
            }catch(e2){}
            // Send invite notification to the person
            var myName=currentUser.display_name||currentUser.username||'Someone';
            try{
                await sbCreateNotification(person.id,'group_invite',myName+' invited you to join "'+g.name+'"','',{originalType:'group_invite',group_id:gid,group_name:g.name,inviter_id:currentUser.id});
                btn.innerHTML='<i class="fas fa-check"></i> Sent';
                btn.disabled=true;
                btn.style.opacity='0.6';
                showToast('Invite sent to '+personName);
            }catch(e3){
                console.error('Invite error:',e3);
                showToast('Failed to send invite');
            }
        });
    });
    // Hover effect
    $$('#inviteGroupList .invite-group-row').forEach(function(row){
        row.addEventListener('mouseenter',function(){row.style.background='var(--border)';});
        row.addEventListener('mouseleave',function(){row.style.background='';});
    });
}

async function showGroupProfileModal(person,group){
    var personName=person.display_name||person.name||person.username||'User';
    var personBio=person.bio||'';
    var personAvatar=person.avatar_url||DEFAULT_AVATAR;
    var isFollowed=state.followedUsers[person.id];
    var myRole=getMyGroupRole(group);
    var myRank=roleRank(myRole);
    var theirRole=getPersonGroupRole(person,group);
    var theirRank=roleRank(theirRole);
    var gc=getGroupThemeColor(group);
    var following=0,followers=0;
    try{var fc=await sbGetFollowCounts(person.id);following=fc.following;followers=fc.followers;}catch(e){}
    var html='<div class="modal-header"><h3>Profile</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body" style="padding:16px;">';
    html+='<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">';
    html+='<div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;background:transparent;"><img src="'+personAvatar+'" alt="'+personName+'" style="width:100%;height:100%;object-fit:cover;display:block;border:none;"></div>';
    html+='<div><h3 style="font-size:16px;font-weight:600;margin:0;">'+personName+'</h3><p style="font-size:13px;color:var(--gray);margin:2px 0 0;">'+personBio+'</p>';
    if(theirRole!=='Member') html+='<span style="font-size:10px;background:'+(theirRole==='Admin'?'#e74c3c':gc)+';color:#fff;padding:1px 7px;border-radius:8px;display:inline-block;margin-top:3px;">'+theirRole+'</span>';
    html+='</div></div>';
    html+='<div style="display:flex;justify-content:center;gap:24px;padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:12px;"><div class="stat"><span class="stat-count" style="font-size:15px;color:'+gc+';">'+following+'</span><span class="stat-label" style="font-size:11px;">Following</span></div><div class="stat"><span class="stat-count" style="font-size:15px;color:'+gc+';">'+followers+'</span><span class="stat-label" style="font-size:11px;">Followers</span></div></div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">';
    html+='<button class="btn '+(isFollowed?'btn-disabled':'btn-green')+'" id="modalFollowBtn" data-uid="'+person.id+'" style="font-size:12px;padding:6px 12px;">'+(isFollowed?'<i class="fas fa-check"></i> Following':'<i class="fas fa-plus"></i> Follow')+'</button>';
    html+='<button class="btn btn-primary" id="modalMsgBtn" data-uid="'+person.id+'" style="font-size:12px;padding:6px 12px;background:'+gc+';border-color:'+gc+';"><i class="fas fa-envelope"></i> Message</button>';
    html+='<button class="btn btn-outline" id="modalViewProfileBtn" style="font-size:12px;padding:6px 12px;"><i class="fas fa-user"></i> View Profile</button>';
    // Role management buttons
    if(myRole==='Admin'){
        if(theirRole==='Member'){
            html+='<button class="btn btn-outline" id="grpSetMod" style="font-size:12px;padding:6px 12px;color:'+gc+';border-color:'+gc+';"><i class="fas fa-shield-halved"></i> Make Mod</button>';
            html+='<button class="btn btn-outline" id="grpSetCoAdmin" style="font-size:12px;padding:6px 12px;color:'+gc+';border-color:'+gc+';"><i class="fas fa-shield"></i> Co-Admin</button>';
        } else if(theirRole==='Moderator'){
            html+='<button class="btn btn-outline" id="grpSetCoAdmin" style="font-size:12px;padding:6px 12px;color:'+gc+';border-color:'+gc+';"><i class="fas fa-shield"></i> Promote</button>';
            html+='<button class="btn btn-outline" id="grpRemoveRole" style="font-size:12px;padding:6px 12px;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-shield-halved"></i> Remove Mod</button>';
        } else if(theirRole==='Co-Admin'){
            html+='<button class="btn btn-outline" id="grpRemoveRole" style="font-size:12px;padding:6px 12px;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-shield"></i> Demote</button>';
        }
        if(theirRole==='Co-Admin'||theirRole==='Moderator'){
            html+='<button class="btn btn-outline" id="grpTransferOwn" style="font-size:12px;padding:6px 12px;color:#f59e0b;border-color:#f59e0b;"><i class="fas fa-crown"></i> Transfer</button>';
        }
    } else if(myRole==='Co-Admin'){
        if(theirRole==='Member') html+='<button class="btn btn-outline" id="grpSetMod" style="font-size:12px;padding:6px 12px;color:'+gc+';border-color:'+gc+';"><i class="fas fa-shield-halved"></i> Make Mod</button>';
        if(theirRole==='Moderator') html+='<button class="btn btn-outline" id="grpRemoveRole" style="font-size:12px;padding:6px 12px;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-shield-halved"></i> Remove Mod</button>';
    }
    html+='</div></div>';
    showModal(html);
    document.getElementById('modalFollowBtn').addEventListener('click',function(){toggleFollow(person.id,this);});
    document.getElementById('modalMsgBtn').addEventListener('click',function(){
        closeModal();startConversation(person.id,person.display_name||person.name||person.username,person.avatar_url);
    });
    document.getElementById('modalViewProfileBtn').addEventListener('click',function(){closeModal();showProfileView(person);});
    var setModBtn=document.getElementById('grpSetMod');
    if(setModBtn){setModBtn.addEventListener('click',function(){
        group.mods.push({name:person.name,img:person.img,role:'Moderator'});
        addNotification('group','You made '+person.name+' a Moderator of "'+group.name+'"');
        closeModal();showGroupView(group);
    });}
    var setCoAdminBtn=document.getElementById('grpSetCoAdmin');
    if(setCoAdminBtn){setCoAdminBtn.addEventListener('click',function(){
        group.mods=group.mods.filter(function(m){return m.name!==person.name;});
        group.mods.unshift({name:person.name,img:person.img,role:'Co-Admin'});
        addNotification('group','You made '+person.name+' a Co-Admin of "'+group.name+'"');
        closeModal();showGroupView(group);
    });}
    var removeRoleBtn=document.getElementById('grpRemoveRole');
    if(removeRoleBtn){removeRoleBtn.addEventListener('click',function(){
        group.mods=group.mods.filter(function(m){return m.name!==person.name;});
        addNotification('group','You removed '+person.name+'\'s role in "'+group.name+'"');
        closeModal();showGroupView(group);
    });}
    var transferBtn=document.getElementById('grpTransferOwn');
    if(transferBtn){transferBtn.addEventListener('click',function(){
        showTransferOwnershipModal(person,group);
    });}
}

function showTransferOwnershipModal(person,group){
    var h='<div class="modal-header"><h3>Transfer Ownership</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    h+='<p style="text-align:center;margin-bottom:4px;">Transfer ownership of <strong>'+escapeHtml(group.name)+'</strong> to <strong>'+escapeHtml(person.name)+'</strong>?</p>';
    h+='<p style="text-align:center;color:#e74c3c;font-size:13px;margin-bottom:16px;">You will be demoted to Co-Admin.</p>';
    h+='<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Type the exact group name to confirm:</label>';
    h+='<input type="text" class="post-input" id="transferConfirmInput" placeholder="'+escapeHtml(group.name)+'" style="width:100%;margin-bottom:16px;">';
    h+='<div class="modal-actions"><button class="btn btn-outline" id="transferCancel">Cancel</button><button class="btn btn-primary" id="transferConfirm" disabled style="background:#f59e0b;border-color:#f59e0b;opacity:.5;"><i class="fas fa-crown"></i> Transfer</button></div></div>';
    showModal(h);
    var inp=document.getElementById('transferConfirmInput'),btn=document.getElementById('transferConfirm');
    inp.addEventListener('input',function(){var match=inp.value===group.name;btn.disabled=!match;btn.style.opacity=match?'1':'.5';});
    document.getElementById('transferCancel').addEventListener('click',closeModal);
    btn.addEventListener('click',function(){
        if(inp.value!==group.name)return;
        // Remove person from mods, make them admin
        group.mods=group.mods.filter(function(m){return m.name!==person.name;});
        // Add me as Co-Admin
        var myName=currentUser?(currentUser.display_name||currentUser.username):'Me';
        group.mods.unshift({name:myName,role:'Co-Admin'});
        // Transfer ownership
        group.createdBy=person.name;
        group.adminName=person.name;group.adminImg=person.img;
        addNotification('group','You transferred ownership of "'+group.name+'" to '+person.name);
        closeModal();showGroupView(group);
    });
}

function showDeleteGroupModal(group){
    var h='<div class="modal-header"><h3>Delete Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    h+='<p style="text-align:center;color:#e74c3c;font-weight:600;margin-bottom:8px;"><i class="fas fa-triangle-exclamation"></i> This action cannot be undone.</p>';
    h+='<p style="text-align:center;margin-bottom:16px;">All posts, members, and data will be permanently deleted.</p>';
    h+='<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Type the exact group name to confirm:</label>';
    h+='<input type="text" class="post-input" id="deleteConfirmInput" placeholder="'+escapeHtml(group.name)+'" style="width:100%;margin-bottom:16px;">';
    h+='<div class="modal-actions"><button class="btn btn-outline" id="deleteCancel">Cancel</button><button class="btn btn-primary" id="deleteConfirm" disabled style="background:#e74c3c;border-color:#e74c3c;opacity:.5;">Delete Group</button></div></div>';
    showModal(h);
    var inp=document.getElementById('deleteConfirmInput'),btn=document.getElementById('deleteConfirm');
    inp.addEventListener('input',function(){var match=inp.value===group.name;btn.disabled=!match;btn.style.opacity=match?'1':'.5';});
    document.getElementById('deleteCancel').addEventListener('click',closeModal);
    btn.addEventListener('click',async function(){
        if(inp.value!==group.name)return;
        try{await sbDeleteGroup(group.id);}catch(e2){console.error('Delete group:',e2);}
        var idx=groups.indexOf(group);
        if(idx!==-1)groups.splice(idx,1);
        delete state.joinedGroups[group.id];
        if(state.groupPosts)delete state.groupPosts[group.id];
        saveState();
        addNotification('group','You deleted the group "'+group.name+'"');
        closeModal();renderGroups();navigateTo('groups');
    });
}

function showSelfRoleRemovalModal(group,callback){
    var myName=currentUser?(currentUser.display_name||currentUser.username):'User';
    var h='<div class="modal-header"><h3>Remove Your Role</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    h+='<p style="text-align:center;margin-bottom:8px;">You will be downgraded to <strong>Member</strong>.</p>';
    h+='<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Type your name to confirm:</label>';
    h+='<input type="text" class="post-input" id="selfRemoveInput" placeholder="'+myName+'" style="width:100%;margin-bottom:16px;">';
    h+='<div class="modal-actions"><button class="btn btn-outline" id="selfRemoveCancel">Cancel</button><button class="btn btn-primary" id="selfRemoveConfirm" disabled style="background:#e74c3c;border-color:#e74c3c;opacity:.5;">Confirm</button></div></div>';
    showModal(h);
    var inp=document.getElementById('selfRemoveInput'),btn=document.getElementById('selfRemoveConfirm');
    inp.addEventListener('input',function(){var match=inp.value===myName;btn.disabled=!match;btn.style.opacity=match?'1':'.5';});
    document.getElementById('selfRemoveCancel').addEventListener('click',closeModal);
    btn.addEventListener('click',function(){if(inp.value!==myName)return;callback();});
}

async function showGroupMembersModal(group){
    var members=[];
    try{members=await sbGetGroupMembers(group.id);}catch(e){console.error(e);}
    var html='<div class="modal-header"><h3>'+group.name+' — Members</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    if(!members.length){html+='<p style="text-align:center;color:var(--gray);">No members yet.</p>';}
    else{
        html+='<div class="follow-list">';
        members.forEach(function(m){
            var p=m.user||{};
            var name=p.display_name||p.username||'User';
            var avatar=p.avatar_url||DEFAULT_AVATAR;
            var bio=p.bio||'';
            var followed=state.followedUsers[p.id];
            var isSelf=currentUser&&p.id===currentUser.id;
            var isOwner=p.id===group.owner_id;
            var roleTag=isOwner?' <span style="font-size:10px;background:#e74c3c;color:#fff;padding:2px 6px;border-radius:8px;margin-left:4px;">Admin</span>':'';
            html+='<div class="follow-list-item" style="flex-wrap:wrap;"><img src="'+avatar+'" alt="'+name+'" class="gvm-click" data-person-id="'+p.id+'" style="cursor:pointer;"><div class="follow-list-info" style="flex:1;"><h4>'+name+roleTag+'</h4><p>'+bio+'</p></div>';
            if(!isSelf) html+='<button class="btn follow-btn-small '+(followed?'btn-disabled':'btn-green')+' gvm-follow-btn" data-uid="'+p.id+'">'+(followed?'<i class="fas fa-check"></i>':'<i class="fas fa-plus"></i>')+'</button>';
            html+='</div>';
        });
        html+='</div>';
    }
    html+='</div>';
    showModal(html);
    $$('.gvm-follow-btn').forEach(function(btn){btn.addEventListener('click',function(){toggleFollow(btn.dataset.uid,btn);});});
    $$('.gvm-click').forEach(function(img){img.addEventListener('click',async function(){
        var uid=img.dataset.personId;if(!uid)return;
        try{var p=await sbGetProfile(uid);if(p){closeModal();showGroupProfileModal({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},group);}}catch(e){}
    });});
}

// ======================== GROUP VIEW PAGE ========================
async function showGroupView(group){
    $$('.page').forEach(function(p){p.classList.remove('active');});
    document.getElementById('page-group-view').classList.add('active');
    $$('.nav-link').forEach(function(l){l.classList.remove('active');});
    _navPrev=_navCurrent;_navCurrent='group-view';_activeGroupId=group.id;
    if(!_navFromPopstate) history.pushState({page:'group-view',groupId:group.id},'','#group-view:'+group.id);
    window.scrollTo(0,0);

    var joined=state.joinedGroups[group.id];
    var isOwner=currentUser&&group.owner_id===currentUser.id;

    // Play group song if one is set
    if(state.groupActiveSong&&state.groupActiveSong[group.id]){
        (async function(){
            if(!_shopSongs||!_shopSongs.length) await _loadShopSongs();
            var gSong=(_shopSongs||[]).find(function(s){return s.id===state.groupActiveSong[group.id];});
            if(gSong) switchToProfileSong(gSong);
        })();
    }

    // Sync group coin balance from DB if available
    if(group.coin_balance!==undefined&&group.coin_balance!==null){
        state.groupCoins[group.id]=group.coin_balance;
    }
    var themeColor=getGroupThemeColor(group);
    var banner=$('#gvCoverBanner');
    banner.style.background=group.coverPhoto?'url('+group.coverPhoto+') center/cover':themeColor;
    var coverBtn=$('#gvCoverEditBtn');
    coverBtn.style.display=isOwner?'flex':'none';

    // Profile card
    var cardHtml='<div class="profile-cover" style="background:'+themeColor+';"></div>';
    cardHtml+='<div class="profile-info">';
    if(group.profileImg){
        cardHtml+='<div class="profile-avatar-wrap"><img src="'+group.profileImg+'" class="profile-avatar" style="object-fit:cover;">';
        if(isOwner) cardHtml+='<button class="avatar-edit-btn" id="gvIconEditBtn" title="Change Photo"><i class="fas fa-camera"></i></button>';
        cardHtml+='<input type="file" id="gvProfileImgInput" accept="image/*" style="display:none;">';
        cardHtml+='</div>';
    } else {
        cardHtml+='<div class="profile-avatar-wrap"><div class="gv-icon-wrap" style="background:'+themeColor+';">';
        cardHtml+='<i class="fas '+group.icon+'" id="gvIconDisplay"></i>';
        if(isOwner) cardHtml+='<button class="avatar-edit-btn" id="gvIconEditBtn" title="Change Icon"><i class="fas fa-camera"></i></button>';
        cardHtml+='<input type="file" id="gvProfileImgInput" accept="image/*" style="display:none;">';
        cardHtml+='</div></div>';
    }
    cardHtml+='<h3 class="profile-name">'+escapeHtml(group.name)+'</h3>';
    cardHtml+='<p class="profile-title">'+escapeHtml(group.description||group.desc||'')+'</p>';
    var memberCount=group.member_count&&group.member_count[0]?group.member_count[0].count:(group.members||0);
    cardHtml+='<div class="profile-stats"><div class="stat"><span class="stat-count">'+fmtNum(memberCount)+'</span><span class="stat-label">Members</span></div><div class="stat"><span class="stat-count" id="gvPostCount">0</span><span class="stat-label">Posts</span></div><div class="stat" id="gvGroupCoins"><span class="stat-count" id="gvGroupCoinCount" style="color:#f59e0b;">'+getGroupCoinCount(group.id)+'</span><span class="stat-label"><i class="fas fa-coins" style="color:#f59e0b;font-size:11px;"></i> Group Coins</span></div></div>';
    cardHtml+='<div class="pv-actions">';
    if(isOwner) cardHtml+='<button class="btn btn-outline" id="gvEditBtn"><i class="fas fa-pen"></i> Edit Group</button>';
    cardHtml+='<button class="btn '+(joined?'btn-disabled':'btn-primary')+'" id="gvJoinBtn" data-gid="'+group.id+'">'+(joined?'Joined':'Join Group')+'</button>';
    if(joined||isOwner) cardHtml+='<button class="btn btn-outline" id="gvLeaveBtn" style="color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-right-from-bracket"></i> Leave Group</button>';
    cardHtml+='</div>';
    cardHtml+='<a href="#" class="pv-back-link" id="gvBack"><i class="fas fa-arrow-left"></i> Back to Groups</a>';
    cardHtml+='</div>';
    $('#gvProfileCard').innerHTML=cardHtml;

    // Left sidebar - About + Admin/Mods
    var adminName=group.owner?(group.owner.display_name||group.owner.username):(group.adminName||'Admin');
    var amIAdmin=currentUser&&group.owner_id===currentUser.id;
    var leftHtml='<div class="card gv-about-card"><h4 class="card-heading"><i class="fas fa-info-circle" style="color:var(--primary);margin-right:6px;"></i>About</h4>';
    leftHtml+='<div class="gv-about-body"><div class="gv-about-meta"><span><i class="fas fa-calendar"></i> Created recently</span>';
    leftHtml+='<span><i class="fas fa-globe"></i> Public group</span></div></div></div>';
    leftHtml+='<div class="card gv-staff-card"><h4 class="card-heading"><i class="fas fa-shield-halved" style="color:var(--primary);margin-right:6px;"></i>Admin & Mods</h4><div class="gv-staff-list">';
    var adminAvatar=(group.owner&&group.owner.avatar_url)?group.owner.avatar_url:(group.adminImg||DEFAULT_AVATAR);
    leftHtml+='<div class="gv-staff-item"><img src="'+adminAvatar+'" style="object-fit:cover;"><div><strong>'+adminName+'</strong><span class="gv-staff-role admin">Admin'+(amIAdmin?' (You)':'')+'</span></div></div>';
    if(group.mods&&group.mods.length){group.mods.forEach(function(m){var modAvatar=m.img||m.avatar_url||DEFAULT_AVATAR;var roleClass=m.role==='Co-Admin'?'coadmin':'mod';leftHtml+='<div class="gv-staff-item"><img src="'+modAvatar+'" style="object-fit:cover;"><div><strong>'+escapeHtml(m.name)+'</strong><span class="gv-staff-role '+roleClass+'">'+escapeHtml(m.role)+'</span></div></div>';});}
    leftHtml+='</div></div>';
    if(amIAdmin) leftHtml+='<button class="btn btn-outline btn-block" id="gvDeleteGroupBtn" style="color:#e74c3c;border-color:#e74c3c;margin-top:12px;"><i class="fas fa-trash"></i> Delete Group</button>';
    $('#gvLeftSidebar').innerHTML=leftHtml;

    // Right sidebar - rules button + members preview
    if(!group.rules) group.rules=['Be respectful to all members','No spam or self-promotion','Stay on topic','No hate speech'];
    var rightHtml='<button class="btn btn-outline btn-block gv-rules-btn" style="margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-scroll" style="color:var(--primary);"></i> Group Rules</button>';
    rightHtml+='<button class="btn btn-outline btn-block gv-invite-link-btn" style="margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-link" style="color:var(--primary);"></i> Invite Link</button>';
    rightHtml+='<div class="card"><h4 class="card-heading"><i class="fas fa-user-friends" style="color:var(--primary);margin-right:6px;"></i>Members</h4><div class="gv-members-preview">';
    rightHtml+='<p style="color:var(--gray);font-size:13px;">Loading members...</p>';
    rightHtml+='</div></div>';
    $('#gvRightSidebar').innerHTML=rightHtml;
    // Mobile duplicate (visible only on phones)
    $('#gvMobileRight').innerHTML=rightHtml;

    // Load members preview asynchronously (both desktop + mobile)
    (async function(){
        try{
            var members=await sbGetGroupMembers(group.id);
            var previews=document.querySelectorAll('.gv-members-preview');
            if(!previews.length)return;
            var html='';
            if(!members.length){html='<p style="color:var(--gray);font-size:13px;">No members yet.</p>';}
            else{
                members.slice(0,6).forEach(function(m){
                    var p=m.user||{};
                    var name=p.display_name||p.username||'User';
                    var avatar=p.avatar_url||DEFAULT_AVATAR;
                    html+='<img src="'+avatar+'" title="'+name+'" class="gv-member-click" data-person-id="'+p.id+'" style="cursor:pointer;">';
                });
                var moreCount=Math.max(0,members.length-6);
                if(moreCount>0) html+='<span class="gv-members-more gv-show-all-members" style="cursor:pointer;">+'+moreCount+' more</span>';
            }
            previews.forEach(function(el){el.innerHTML=html;});
            $$('.gv-member-click').forEach(function(img){img.addEventListener('click',async function(){
                var uid=img.dataset.personId;if(!uid)return;
                try{var p=await sbGetProfile(uid);if(p)showGroupProfileModal({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},group);}catch(e){}
            });});
            $$('.gv-show-all-members').forEach(function(btn){btn.addEventListener('click',function(){showGroupMembersModal(group);});});
        }catch(e){console.error('gvMembers:',e);}
    })();

    // Post bar (only if joined)
    if(joined||isOwner){
        $('#gvPostBar').innerHTML='<div class="card post-create-bar" id="gvOpenPostModal"><img src="'+$('#profileAvatarImg').src+'" alt="User" class="post-create-avatar"><div class="post-input-fake">Post in '+escapeHtml(group.name)+'...</div></div>';
        document.getElementById('gvOpenPostModal').addEventListener('click',function(){openGroupPostModal(group);});
    } else {
        $('#gvPostBar').innerHTML='';
    }

    // Feed posts — load from Supabase
    $('#gvPostsFeed').innerHTML='<div class="card"><h4 class="pv-posts-heading"><i class="fas fa-stream" style="color:var(--primary);margin-right:8px;"></i>Group Posts</h4></div><div class="card" style="padding:20px;text-align:center;color:var(--gray);"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
    $('#gvPostCount').textContent='0';
    (async function(){
        try{
            var groupPosts=await sbGetGroupPosts(group.id);
            var feedHtml='<div class="card"><h4 class="pv-posts-heading"><i class="fas fa-stream" style="color:var(--primary);margin-right:8px;"></i>Group Posts</h4></div>';
            groupPosts.forEach(function(p){
                var author=p.author||{};
                var name=author.display_name||author.username||'User';
                var avatar=author.avatar_url||DEFAULT_AVATAR;
                var isMe=currentUser&&author.id===currentUser.id;
                var timeStr=p.created_at?timeAgo(p.created_at):'just now';
                var commentCount=p.comments&&p.comments[0]?p.comments[0].count:0;
                var gvMenuId='gvmenu-'+p.id;
                feedHtml+='<div class="card feed-post" data-post-id="'+p.id+'" data-author-id="'+author.id+'"><div class="post-header"><img src="'+avatar+'" alt="'+escapeHtml(name)+'" class="post-avatar gv-post-author" data-uid="'+author.id+'" style="cursor:pointer;"><div class="post-user-info"><div class="post-user-top"><h4 class="post-username gv-post-author" data-uid="'+author.id+'" style="cursor:pointer;">'+escapeHtml(name)+'</h4><span class="post-time">'+timeStr+'</span></div>';
                if(isMe) feedHtml+='<div class="post-badges"><span class="badge badge-green"><i class="fas fa-user"></i> You</span></div>';
                feedHtml+='</div>';
                feedHtml+='<button class="post-menu-btn" data-menu="'+gvMenuId+'"><i class="fas fa-ellipsis-h"></i></button>';
                feedHtml+='<div class="post-dropdown" id="'+gvMenuId+'">';
                feedHtml+='<a href="#" data-action="save" data-pid="'+p.id+'"><i class="fas fa-bookmark"></i> Save Post</a>';
                feedHtml+='<a href="#" data-action="report" data-pid="'+p.id+'"><i class="fas fa-flag"></i> Report</a>';
                feedHtml+='<a href="#" data-action="hide" data-pid="'+p.id+'"><i class="fas fa-eye-slash"></i> Hide</a>';
                if(isMe) feedHtml+='<a href="#" data-action="edit" data-pid="'+p.id+'"><i class="fas fa-pen"></i> Edit</a><a href="#" data-action="delete" data-pid="'+p.id+'" style="color:#e74c3c;"><i class="fas fa-trash"></i> Delete</a>';
                feedHtml+='</div>';
                feedHtml+='</div>';
                feedHtml+='<div class="post-description">';
                if(p.content) feedHtml+='<p>'+renderMentionsInText(escapeHtmlNl(p.content))+'</p>';
                feedHtml+='</div>';
                var gvImgs=p.media_urls&&p.media_urls.length?p.media_urls:(p.image_url?[p.image_url]:[]);
                feedHtml+=buildMediaGrid(gvImgs);
                feedHtml+='<div class="post-actions"><div class="action-left"><button class="action-btn like-btn" data-post-id="'+p.id+'"><i class="'+(state.likedPosts[p.id]?'fas':'far')+' fa-thumbs-up"></i><span class="like-count">'+(p.like_count||0)+'</span></button><button class="action-btn dislike-btn" data-post-id="'+p.id+'"><i class="'+(state.dislikedPosts[p.id]?'fas':'far')+' fa-thumbs-down"></i><span class="dislike-count">0</span></button><button class="action-btn comment-btn"><i class="far fa-comment"></i><span>'+commentCount+'</span></button></div></div></div>';
            });
            if(!groupPosts.length){
                feedHtml+='<div class="card" style="padding:40px;text-align:center;color:var(--gray);"><i class="fas fa-pen" style="font-size:32px;margin-bottom:12px;display:block;"></i><p>No posts in this group yet.</p></div>';
            }
            var feedEl=$('#gvPostsFeed');
            if(feedEl){feedEl.innerHTML=feedHtml;$('#gvPostCount').textContent=groupPosts.length;}
            bindGvPostEvents();
            bindMentionClicks('#gvPostsFeed');
            bindHashtagClicks('#gvPostsFeed');
            autoFetchLinkPreviews(feedEl);
            // Author click → profile
            $$('#gvPostsFeed .gv-post-author').forEach(function(el){
                el.addEventListener('click',async function(){
                    var uid=el.dataset.uid;if(!uid)return;
                    try{var prof=await sbGetProfile(uid);if(prof)showProfileView(prof);}catch(e){}
                });
            });
        }catch(e){console.error('Load group posts:',e);}
    })();

    // Mode tabs (Feed / Group Shop) — remove old ones first to prevent duplicates
    var _oldTabs=document.getElementById('gvModeTabs');if(_oldTabs)_oldTabs.remove();
    var _oldShop=document.getElementById('gvShopSection');if(_oldShop)_oldShop.remove();
    var gvModeHtml='<div class="search-tabs" id="gvModeTabs">';
    gvModeHtml+='<button class="search-tab active" data-gvmode="feed"><i class="fas fa-stream"></i> Feed</button>';
    if(joined||isOwner) gvModeHtml+='<button class="search-tab" data-gvmode="chat"><i class="fas fa-comments"></i> Chat</button>';
    if(joined||isOwner) gvModeHtml+='<button class="search-tab" data-gvmode="shop"><i class="fas fa-store"></i> Group Shop</button>';
    gvModeHtml+='</div>';
    $('#gvPostBar').insertAdjacentHTML('beforebegin',gvModeHtml);

    // Chat container (hidden by default)
    var _oldChat=document.getElementById('gvChatSection');if(_oldChat)_oldChat.remove();
    var chatSectionHtml='<div id="gvChatSection" style="display:none;"><div class="gc-layout"><div class="gc-sidebar" id="gcSidebar"></div><div class="gc-chat-area" id="gcChatArea"><div class="gc-empty"><i class="fas fa-comments" style="font-size:48px;opacity:.3;"></i><p>Select a channel to start chatting</p></div></div><div class="gc-members-panel" id="gcMembersPanel"></div></div></div>';
    $('#gvPostsFeed').insertAdjacentHTML('afterend',chatSectionHtml);

    // Shop container (hidden by default)
    var shopSectionHtml='<div id="gvShopSection" style="display:none;">';
    shopSectionHtml+='<div class="card gv-shop-header"><div class="gv-shop-title"><i class="fas fa-store"></i> Group Shop</div>';
    shopSectionHtml+='<div class="gv-shop-coins"><i class="fas fa-coins"></i> <span id="gvGroupCoinCount2">'+getGroupCoinCount(group.id)+'</span> Group Coins</div></div>';
    shopSectionHtml+='<div class="search-tabs" id="gvShopTabs"></div>';
    shopSectionHtml+='<div id="gvShopContent"></div>';
    shopSectionHtml+='</div>';
    $('#gvPostsFeed').insertAdjacentHTML('afterend',shopSectionHtml);

    // Apply active group skin
    applyGroupSkin(group.id);

    // Event listeners
    document.getElementById('gvBack').addEventListener('click',function(e){e.preventDefault();navigateTo('groups');});
    var joinBtn=document.getElementById('gvJoinBtn');
    if(joinBtn){joinBtn.addEventListener('click',async function(){if(!state.joinedGroups[group.id]&&currentUser){try{await sbJoinGroup(group.id,currentUser.id);state.joinedGroups[group.id]=true;group.members++;saveState();this.textContent='Joined';this.classList.remove('btn-primary');this.classList.add('btn-disabled');addNotification('group','You joined "'+group.name+'"');showGroupView(group);}catch(e2){console.error('Join group:',e2);showToast('Failed to join group');}}});}
    var leaveBtn=document.getElementById('gvLeaveBtn');
    if(leaveBtn){leaveBtn.addEventListener('click',function(){
        var myRole=getMyGroupRole(group);
        if(myRole==='Admin'){
            var coAdmin=group.mods.find(function(m){return m.role==='Co-Admin';});
            if(coAdmin){
                // Auto-promote Co-Admin and leave
                var h='<div class="modal-header"><h3>Leave Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
                h+='<p style="text-align:center;margin-bottom:6px;">Are you sure you want to leave <strong>'+group.name+'</strong>?</p>';
                h+='<p style="text-align:center;color:var(--gray);font-size:13px;margin-bottom:16px;"><strong>'+coAdmin.name+'</strong> will be promoted to Admin.</p>';
                h+='<div class="modal-actions"><button class="btn btn-outline" id="gvLeaveCancel">Cancel</button><button class="btn btn-primary" id="gvLeaveConfirm" style="background:#e74c3c;border-color:#e74c3c;">Leave</button></div></div>';
                showModal(h);
                document.getElementById('gvLeaveCancel').addEventListener('click',closeModal);
                document.getElementById('gvLeaveConfirm').addEventListener('click',function(){
                    group.mods=group.mods.filter(function(m){return m.name!==coAdmin.name;});
                    group.createdBy=coAdmin.name;group.adminName=coAdmin.name;group.adminImg=coAdmin.img;
                    delete state.joinedGroups[group.id];group.members=Math.max(0,group.members-1);
                    addNotification('group','You left "'+group.name+'". '+coAdmin.name+' is now Admin.');
                    closeModal();renderGroups();navigateTo('groups');
                });
            } else {
                var h='<div class="modal-header"><h3>Cannot Leave</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
                h+='<p style="text-align:center;color:var(--gray);margin-bottom:16px;">You are the only Admin of this group.</p>';
                h+='<p style="text-align:center;font-weight:600;margin-bottom:16px;">Transfer ownership before leaving.</p>';
                h+='<div class="modal-actions"><button class="btn btn-primary modal-close-btn">OK</button></div></div>';
                showModal(h);$$('.modal-close-btn').forEach(function(b){b.addEventListener('click',closeModal);});
            }
        } else if(myRole==='Co-Admin'||myRole==='Moderator'){
            showSelfRoleRemovalModal(group,function(){
                var _myName=currentUser?(currentUser.display_name||currentUser.username):'Me';
                group.mods=group.mods.filter(function(m){return m.name!==_myName;});
                delete state.joinedGroups[group.id];group.members=Math.max(0,group.members-1);
                addNotification('group','You left "'+group.name+'"');
                closeModal();renderGroups();navigateTo('groups');
            });
        } else {
            var h='<div class="modal-header"><h3>Leave Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
            h+='<p style="text-align:center;margin-bottom:16px;">Are you sure you want to leave <strong>'+group.name+'</strong>?</p>';
            h+='<div class="modal-actions"><button class="btn btn-outline" id="gvLeaveCancel">Cancel</button><button class="btn btn-primary" id="gvLeaveConfirm" style="background:#e74c3c;border-color:#e74c3c;">Leave</button></div></div>';
            showModal(h);
            document.getElementById('gvLeaveCancel').addEventListener('click',closeModal);
            document.getElementById('gvLeaveConfirm').addEventListener('click',async function(){
                if(currentUser){try{await sbLeaveGroup(group.id,currentUser.id);}catch(e2){}}
                delete state.joinedGroups[group.id];group.members=Math.max(0,group.members-1);
                saveState();
                addNotification('group','You left "'+group.name+'"');
                closeModal();renderGroups();navigateTo('groups');
            });
        }
    });}
    var editBtn=document.getElementById('gvEditBtn');
    if(editBtn){editBtn.addEventListener('click',function(){
        var html='<div class="modal-header"><h3>Edit Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
        html+='<div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Group Name</label><input type="text" class="post-input" id="editGrpName" value="'+group.name+'" style="width:100%;"></div>';
        html+='<div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Description</label><input type="text" class="post-input" id="editGrpDesc" value="'+(group.description||group.desc||'')+'" style="width:100%;"></div>';
        html+='<button class="btn btn-primary btn-block" id="saveGrpBtn">Save Changes</button></div>';
        showModal(html);
        document.getElementById('saveGrpBtn').addEventListener('click',async function(){
            var newName=document.getElementById('editGrpName').value.trim()||group.name;
            var newDesc=document.getElementById('editGrpDesc').value.trim()||group.description||group.desc||'';
            try{await sbUpdateGroup(group.id,{name:newName,description:newDesc});}catch(e){console.warn('Save group:',e);}
            group.name=newName;group.description=newDesc;group.desc=newDesc;
            closeModal();showGroupView(group);renderGroups();
        });
    });}
    // Cover photo edit for owned groups
    if(isOwner){
        if(!group.photos) group.photos={profile:[],cover:[]};
        $('#gvCoverEditBtn').addEventListener('click',function(e){
            e.stopPropagation();
            var photos=group.photos.cover;
            var hasCover=!!group.coverPhoto;
            var h='<div class="modal-header"><h3>Change Cover Photo</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
            h+='<div style="text-align:center;margin-bottom:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><button class="btn btn-primary" id="gvCoverUploadNewBtn"><i class="fas fa-upload"></i> Upload New Photo</button>';
            if(hasCover) h+='<button class="btn btn-outline" id="gvCoverRemoveBtn" style="color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-trash"></i> Remove Cover</button>';
            h+='</div>';
            if(photos.length>0){
                h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;text-align:center;">Or select from previous uploads:</p>';
                h+='<div class="shop-scroll-row" id="gvCoverPickRow" style="gap:12px;padding:8px 4px 12px;">';
                photos.forEach(function(p,i){h+='<img src="'+p.src+'" class="gv-cover-pick-thumb" data-idx="'+i+'" style="min-width:140px;max-width:140px;height:50px;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;">';});
                h+='</div>';
            }
            h+='</div>';
            showModal(h);
            if(photos.length>0) initDragScroll('#modalContent');
            document.getElementById('gvCoverUploadNewBtn').addEventListener('click',function(){closeModal();$('#gvCoverFileInput').click();});
            var gvRemoveBtn=document.getElementById('gvCoverRemoveBtn');
            if(gvRemoveBtn) gvRemoveBtn.addEventListener('click',function(){
                group.coverPhoto=null;
                banner.style.background=themeColor;
                sbUpdateGroup(group.id,{cover_photo_url:null}).catch(function(e){console.error('Remove group cover error:',e);});
                closeModal();
                showToast('Group cover photo removed');
            });
            $$('.gv-cover-pick-thumb').forEach(function(thumb){
                thumb.addEventListener('mouseenter',function(){thumb.style.borderColor='var(--primary)';});
                thumb.addEventListener('mouseleave',function(){thumb.style.borderColor='transparent';});
                thumb.addEventListener('click',function(){
                    var src=photos[parseInt(thumb.dataset.idx)].src;
                    closeModal();showGroupCoverCropModal(src,group,banner,true);
                });
            });
        });
        $('#gvCoverFileInput').addEventListener('change',function(){
            var f=this.files[0];if(!f)return;
            var r=new FileReader();
            r.onload=function(e){showGroupCoverCropModal(e.target.result,group,banner);};
            r.readAsDataURL(f);
        });
        var iconBtn=document.getElementById('gvIconEditBtn');
        if(iconBtn){iconBtn.addEventListener('click',function(){
            if(!group.photos) group.photos={profile:[],cover:[]};
            var icons=['fa-users','fa-camera-retro','fa-gamepad','fa-utensils','fa-dumbbell','fa-music','fa-paw','fa-plane-departure','fa-book','fa-leaf','fa-film','fa-hammer','fa-mug-hot','fa-code','fa-palette','fa-rocket','fa-heart','fa-star'];
            var photos=group.photos.profile;
            var h='<div class="modal-header"><h3>Group Image</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
            h+='<div style="text-align:center;margin-bottom:16px;"><button class="btn btn-primary" id="gvUploadPhotoBtn"><i class="fas fa-upload"></i> Upload New Photo</button></div>';
            h+='<input type="file" id="gvModalImgInput" accept="image/*,image/gif" style="display:none;">';
            if(photos.length>0){
                h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;text-align:center;">Or select from previous uploads:</p>';
                h+='<div class="shop-scroll-row" id="gvProfilePickRow" style="gap:12px;padding:8px 4px 12px;">';
                photos.forEach(function(p,i){h+='<img src="'+p.src+'" class="gv-profile-pick-thumb" data-idx="'+i+'" style="min-width:80px;max-width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;">';});
                h+='</div>';
            }
            h+='<p style="text-align:center;color:var(--gray);font-size:13px;margin:12px 0;">Or pick an icon:</p>';
            var _tc=getGroupThemeColor(group);
            if(_tc){h+='<style>.gv-icon-pick.active{border-color:'+_tc+';color:'+_tc+';background:'+_tc+'22;}.gv-icon-pick:hover{background:'+_tc+'33;color:'+_tc+';}</style>';}
            h+='<div class="gv-icon-grid">';
            icons.forEach(function(ic){h+='<button class="gv-icon-pick'+(group.icon===ic&&!group.profileImg?' active':'')+'" data-icon="'+ic+'"><i class="fas '+ic+'"></i></button>';});
            h+='</div></div>';showModal(h);
            if(photos.length>0) initDragScroll('#modalContent');
            document.getElementById('gvUploadPhotoBtn').addEventListener('click',function(){document.getElementById('gvModalImgInput').click();});
            document.getElementById('gvModalImgInput').addEventListener('change',async function(){
                var f=this.files[0];if(!f)return;
                var isGif=f.type==='image/gif';
                if(isGif){
                    try{
                        var publicUrl=await sbUploadGroupImage(group.id,f,'avatar');
                        await sbUpdateGroup(group.id,{avatar_url:publicUrl});
                        group.profileImg=publicUrl;
                        if(!group.photos) group.photos={profile:[],cover:[]};
                        group.photos.profile.unshift({src:publicUrl,date:Date.now()});
                    }catch(e){
                        console.error('Group GIF upload:',e);showToast('Failed to save group photo: '+(e.message||''));
                        var r=new FileReader();r.onload=function(ev){group.profileImg=ev.target.result;};r.readAsDataURL(f);
                    }
                    closeModal();showGroupView(group);renderGroups();
                } else {
                    var r=new FileReader();
                    r.onload=function(e){showGroupProfileCropModal(e.target.result,group);};
                    r.readAsDataURL(f);
                }
            });
            $$('.gv-profile-pick-thumb').forEach(function(thumb){
                thumb.addEventListener('mouseenter',function(){thumb.style.borderColor='var(--primary)';});
                thumb.addEventListener('mouseleave',function(){thumb.style.borderColor='transparent';});
                thumb.addEventListener('click',function(){
                    var src=photos[parseInt(thumb.dataset.idx)].src;
                    closeModal();showGroupProfileCropModal(src,group,true);
                });
            });
            $$('.gv-icon-pick').forEach(function(btn){btn.addEventListener('click',async function(){group.icon=btn.dataset.icon;try{await sbUpdateGroup(group.id,{icon:group.icon});}catch(e){console.warn('Save group icon:',e);}closeModal();showGroupView(group);renderGroups();});});
        });}
    }
    $$('.gv-invite-link-btn').forEach(function(btn){btn.addEventListener('click',function(){showInviteLinkModal(group);});});
    $$('.gv-rules-btn').forEach(function(btn){btn.addEventListener('click',function(){
        _showGroupRulesModal(group,isOwner);
    });});
    function _showGroupRulesModal(grp,canEdit){
        var h='<div class="modal-header"><h3><i class="fas fa-scroll" style="color:var(--primary);margin-right:8px;"></i>Group Rules</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
        if(!canEdit){
            h+='<ol style="padding-left:20px;margin:0;">';
            grp.rules.forEach(function(r){h+='<li style="margin-bottom:8px;line-height:1.5;">'+r+'</li>';});
            h+='</ol></div>';
            showModal(h);
        } else {
            grp.rules.forEach(function(r,i){h+='<div style="margin-bottom:8px;display:flex;gap:8px;align-items:center;"><span style="font-weight:600;color:var(--gray);">'+(i+1)+'.</span><input type="text" class="post-input gv-rule-input" value="'+r+'" style="flex:1;"><button class="gv-rule-del" data-idx="'+i+'" style="background:none;color:var(--gray);font-size:14px;padding:4px;"><i class="fas fa-trash"></i></button></div>';});
            h+='<button class="btn btn-outline" id="gvAddRule" style="margin:8px 0 16px;font-size:13px;"><i class="fas fa-plus"></i> Add Rule</button>';
            h+='<button class="btn btn-primary btn-block" id="gvSaveRules">Save Rules</button></div>';
            showModal(h);
            document.getElementById('gvAddRule').addEventListener('click',function(){
                var container=this.parentElement;
                var inputs=container.querySelectorAll('.gv-rule-input');
                var idx=inputs.length;
                var div=document.createElement('div');div.style.cssText='margin-bottom:8px;display:flex;gap:8px;align-items:center;';
                div.innerHTML='<span style="font-weight:600;color:var(--gray);">'+(idx+1)+'.</span><input type="text" class="post-input gv-rule-input" placeholder="New rule..." style="flex:1;"><button class="gv-rule-del" data-idx="'+idx+'" style="background:none;color:var(--gray);font-size:14px;padding:4px;"><i class="fas fa-trash"></i></button>';
                container.insertBefore(div,this);
            });
            document.getElementById('gvSaveRules').addEventListener('click',async function(){
                var inputs=$$('.gv-rule-input');
                grp.rules=[];inputs.forEach(function(inp){var v=inp.value.trim();if(v)grp.rules.push(v);});
                try{await sbUpdateGroup(grp.id,{rules:grp.rules});}catch(e){console.warn('Save rules:',e);}
                closeModal();showGroupView(grp);
            });
            $$('.gv-rule-del').forEach(function(btn){btn.addEventListener('click',function(){btn.parentElement.remove();});});
        }
    }
    $$('.gv-member-click').forEach(function(img){img.addEventListener('click',async function(){
        var uid=img.dataset.personId;if(!uid)return;
        try{var p=await sbGetProfile(uid);if(p)showGroupProfileModal({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},group);}catch(e){}
    });});
    $$('.gv-staff-click').forEach(function(img){img.addEventListener('click',async function(){
        var uid=img.dataset.personId;if(!uid)return;
        try{var p=await sbGetProfile(uid);if(p)showGroupProfileModal({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},group);}catch(e){}
    });});
    var showAllBtn=document.getElementById('gvShowAllMembers');
    if(showAllBtn){showAllBtn.addEventListener('click',function(){showGroupMembersModal(group);});}
    var deleteGrpBtn=document.getElementById('gvDeleteGroupBtn');
    if(deleteGrpBtn){deleteGrpBtn.addEventListener('click',function(){showDeleteGroupModal(group);});}
    // Group view mode tab switching
    $$('#gvModeTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        $$('#gvModeTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        var mode=tab.dataset.gvmode;
        var ss=document.getElementById('gvShopSection');
        var cs=document.getElementById('gvChatSection');
        if(mode==='feed'){
            $('#gvPostBar').style.display='';$('#gvPostsFeed').style.display='';
            if(ss)ss.style.display='none';if(cs)cs.style.display='none';
            _cleanupGroupChat(true);
        } else if(mode==='chat'){
            $('#gvPostBar').style.display='none';$('#gvPostsFeed').style.display='none';
            if(ss)ss.style.display='none';
            // Chat always opens fullscreen
            _enterGroupChatFullscreen(group);
            initGroupChat(group);
        } else if(mode==='shop'){
            $('#gvPostBar').style.display='none';$('#gvPostsFeed').style.display='none';
            if(ss){ss.style.display='';renderGroupShop(group.id);}if(cs)cs.style.display='none';
            _cleanupGroupChat(true);
        }
    });});
    bindGvPostEvents();
}

// ======================== GROUP CHAT ========================
var _gcActiveChannel=null;
var _gcSubscription=null;
var _gcGroup=null;
var _gcMemberCache={};
var _gcFullscreen=false;

function _enterGroupChatFullscreen(group){
    _gcFullscreen=true;
    var topNav=document.querySelector('.navbar');
    var botNav=document.querySelector('.nav-center');
    if(topNav) topNav.style.display='none';
    if(botNav) botNav.style.display='none';
    var cs=document.getElementById('gvChatSection');
    if(cs){
        // Move chat section to body so it's not clipped by parent
        document.body.appendChild(cs);
        cs.className='gc-fullscreen-active';
        cs.removeAttribute('style');
    }
    document.body.style.overflow='hidden';
    // Add back button to chat section
    var existing=document.getElementById('gcBackBar');
    if(!existing&&cs){
        var bar=document.createElement('div');
        bar.id='gcBackBar';
        bar.style.cssText='flex-shrink:0;display:flex;align-items:center;gap:10px;padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top,0px));background:var(--card);border-bottom:1px solid var(--border);';
        bar.innerHTML='<button id="gcBackBtn" style="background:none;border:none;color:var(--text);font-size:18px;cursor:pointer;padding:4px 8px;"><i class="fas fa-arrow-left"></i></button><span style="font-weight:600;font-size:15px;color:var(--text);"><i class="fas fa-comments" style="margin-right:6px;color:var(--accent);"></i>'+escapeHtml(group.name)+' Chat</span>';
        cs.insertBefore(bar,cs.firstChild);
        document.getElementById('gcBackBtn').addEventListener('click',function(){
            _exitGroupChatFullscreen();
            // Switch back to feed tab
            var tabs=$$('#gvModeTabs .search-tab');
            tabs.forEach(function(t){t.classList.remove('active');});
            tabs.forEach(function(t){if(t.dataset.gvmode==='feed')t.classList.add('active');});
            $('#gvPostBar').style.display='';$('#gvPostsFeed').style.display='';
            _cleanupGroupChat(true);
        });
    }
}

function _exitGroupChatFullscreen(){
    if(!_gcFullscreen) return;
    _gcFullscreen=false;
    var topNav=document.querySelector('.navbar');
    var botNav=document.querySelector('.nav-center');
    if(topNav) topNav.style.display='';
    if(botNav) botNav.style.display='';
    document.body.style.overflow='';
    var cs=document.getElementById('gvChatSection');
    if(cs){
        // Move chat section back into the group view page
        var gvPostsFeed=document.getElementById('gvPostsFeed');
        if(gvPostsFeed) gvPostsFeed.parentNode.insertBefore(cs,gvPostsFeed.nextSibling);
        cs.className='';
        cs.style.display='none';
    }
    var bar=document.getElementById('gcBackBar');
    if(bar) bar.remove();
}

function _cleanupGroupChat(exitFullscreen){
    if(_gcSubscription){try{sb.removeChannel(_gcSubscription);}catch(e){}_gcSubscription=null;}
    _gcActiveChannel=null;
    if(exitFullscreen) _exitGroupChatFullscreen();
}

// ======================== GROUP CHAT SETTINGS ========================
var _gcLockedChannels={};
try{_gcLockedChannels=JSON.parse(localStorage.getItem('blipvibe_gc_locked')||'{}');}catch(e){}
function persistGcLocked(){try{localStorage.setItem('blipvibe_gc_locked',JSON.stringify(_gcLockedChannels));}catch(e){}}

var _gcChatMods={};
try{_gcChatMods=JSON.parse(localStorage.getItem('blipvibe_gc_mods')||'{}');}catch(e){}
function persistGcMods(){try{localStorage.setItem('blipvibe_gc_mods',JSON.stringify(_gcChatMods));}catch(e){}}

function isGcAdmin(group){
    return canManageGroupSkins(group);
}
function isGcMod(groupId){
    if(!currentUser) return false;
    var mods=_gcChatMods[groupId]||{};
    return !!mods[currentUser.id];
}
function canSendInChannel(group,channelId){
    if(isGcAdmin(group)) return true;
    if(isGcMod(group.id)) return true;
    return !_gcLockedChannels[channelId];
}

function showGcChannelContextMenu(group,channelId,channelName,x,y){
    // Remove existing
    var existing=document.querySelector('.gc-context-menu');
    if(existing) existing.remove();
    var menu=document.createElement('div');
    menu.className='gc-context-menu';
    var isLocked=_gcLockedChannels[channelId];
    menu.innerHTML='<button class="gc-ctx-item" data-action="lock"><i class="fas fa-'+(isLocked?'lock-open':'lock')+'"></i> '+(isLocked?'Unlock Channel':'Lock Channel')+'</button>'+
        '<button class="gc-ctx-item" data-action="mods"><i class="fas fa-shield-halved"></i> Chat Moderators</button>'+
        '<button class="gc-ctx-item" data-action="rename"><i class="fas fa-pen"></i> Rename</button>'+
        '<button class="gc-ctx-item gc-ctx-danger" data-action="delete"><i class="fas fa-trash"></i> Delete</button>';
    menu.style.cssText='position:fixed;top:'+y+'px;left:'+x+'px;';
    document.body.appendChild(menu);
    menu.querySelectorAll('.gc-ctx-item').forEach(function(btn){
        btn.addEventListener('click',function(){
            menu.remove();
            var action=btn.dataset.action;
            if(action==='lock'){
                if(isLocked) delete _gcLockedChannels[channelId];
                else _gcLockedChannels[channelId]=true;
                persistGcLocked();
                showToast(isLocked?'Channel unlocked':'Channel locked — only admins and mods can post');
                renderGroupChatSidebar(group);
            } else if(action==='mods'){
                showGcModsModal(group);
            } else if(action==='rename'){
                showGcChannelModal(group,null,channelId,channelName);
            } else if(action==='delete'){
                confirmGcDeleteChannel(group,channelId);
            }
        });
    });
    // Close on outside click
    setTimeout(function(){
        document.addEventListener('click',function _cls(){menu.remove();document.removeEventListener('click',_cls);},{once:true});
    },10);
}

function showGcModsModal(group){
    var gid=group.id;
    var mods=_gcChatMods[gid]||{};
    var modIds=Object.keys(mods);
    var h='<div class="modal-header"><h3><i class="fas fa-shield-halved" style="color:var(--primary);margin-right:8px;"></i>Chat Moderators</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
    h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Chat mods can post in locked channels and delete messages.</p>';
    if(!modIds.length) h+='<p style="color:var(--gray);text-align:center;padding:12px;">No chat mods yet.</p>';
    modIds.forEach(function(uid){
        var m=_gcMemberCache[uid];
        var name=m?(m.user?(m.user.display_name||m.user.username):(m.display_name||m.username)):'User';
        var avatar=m?(m.user?m.user.avatar_url:m.avatar_url):null;
        h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">';
        h+='<img src="'+(avatar||DEFAULT_AVATAR)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">';
        h+='<span style="flex:1;font-size:13px;">'+escapeHtml(name)+'</span>';
        h+='<button class="btn btn-outline gc-remove-mod" data-uid="'+uid+'" style="font-size:11px;padding:3px 10px;color:#e74c3c;border-color:#e74c3c;">Remove</button>';
        h+='</div>';
    });
    h+='<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">';
    h+='<p style="font-size:13px;font-weight:600;margin-bottom:8px;">Add a mod:</p>';
    h+='<div style="display:flex;flex-direction:column;gap:6px;" id="gcModCandidates">';
    // Show group members who aren't already mods
    Object.keys(_gcMemberCache).forEach(function(uid){
        if(mods[uid]) return;
        if(currentUser&&uid===currentUser.id) return;
        var m=_gcMemberCache[uid];
        var name=m?(m.user?(m.user.display_name||m.user.username):(m.display_name||m.username)):'User';
        var avatar=m?(m.user?m.user.avatar_url:m.avatar_url):null;
        h+='<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">';
        h+='<img src="'+(avatar||DEFAULT_AVATAR)+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">';
        h+='<span style="flex:1;font-size:13px;">'+escapeHtml(name)+'</span>';
        h+='<button class="btn btn-outline gc-add-mod" data-uid="'+uid+'" style="font-size:11px;padding:3px 10px;color:var(--primary);border-color:var(--primary);">Make Mod</button>';
        h+='</div>';
    });
    h+='</div></div></div>';
    _gcShowModal(h);
    $$('.gc-remove-mod').forEach(function(b){b.addEventListener('click',function(){
        var uid=b.dataset.uid;
        if(!_gcChatMods[gid]) _gcChatMods[gid]={};
        delete _gcChatMods[gid][uid];
        persistGcMods();
        b.textContent='Removed';b.disabled=true;
    });});
    $$('.gc-add-mod').forEach(function(b){b.addEventListener('click',function(){
        var uid=b.dataset.uid;
        if(!_gcChatMods[gid]) _gcChatMods[gid]={};
        _gcChatMods[gid][uid]=true;
        persistGcMods();
        b.textContent='Added';b.disabled=true;
        showToast('Chat mod added');
    });});
}

async function initGroupChat(group){
    _gcGroup=group;
    _gcMemberCache={};
    // Cache member profiles
    var membersList=[];
    try{
        membersList=await sbGetGroupMembers(group.id);
        (membersList||[]).forEach(function(m){_gcMemberCache[m.user_id||m.id]=m;});
    }catch(e){}
    await renderGroupChatSidebar(group);
    renderGcMembersPanel(group,membersList);
}

function renderGcMembersPanel(group,members){
    var panel=document.getElementById('gcMembersPanel');
    if(!panel) return;
    var admins=[];var mods=[];var regular=[];
    var chatMods=_gcChatMods[group.id]||{};
    (members||[]).forEach(function(m){
        var uid=m.user_id||m.id;
        var u=m.user||m;
        var entry={id:uid,name:u.display_name||u.username||'User',avatar:u.avatar_url||DEFAULT_AVATAR,role:m.role||'member'};
        if(uid===group.owner_id||entry.role==='owner'||entry.role==='admin') admins.push(entry);
        else if(entry.role==='moderator'||chatMods[uid]) mods.push(entry);
        else regular.push(entry);
    });
    var html='<div class="gc-members-header"><i class="fas fa-users" style="margin-right:6px;"></i>Members — '+(members||[]).length+'</div>';
    if(admins.length){
        html+='<div class="gc-members-group"><div class="gc-members-label">Admins — '+admins.length+'</div>';
        admins.forEach(function(a){html+=_gcMemberItem(a);});
        html+='</div>';
    }
    if(mods.length){
        html+='<div class="gc-members-group"><div class="gc-members-label">Moderators — '+mods.length+'</div>';
        mods.forEach(function(a){html+=_gcMemberItem(a);});
        html+='</div>';
    }
    if(regular.length){
        html+='<div class="gc-members-group"><div class="gc-members-label">Members — '+regular.length+'</div>';
        regular.forEach(function(a){html+=_gcMemberItem(a);});
        html+='</div>';
    }
    panel.innerHTML=html;
    panel.querySelectorAll('.gc-member-item').forEach(function(el){
        el.addEventListener('click',function(){
            var uid=el.dataset.uid;if(uid) viewProfile(uid);
        });
    });
}
function _gcMemberItem(m){
    return '<div class="gc-member-item" data-uid="'+m.id+'"><img src="'+m.avatar+'" alt="'+escapeHtml(m.name)+'"><span>'+escapeHtml(m.name)+'</span></div>';
}

async function renderGroupChatSidebar(group){
    var sidebar=document.getElementById('gcSidebar');if(!sidebar)return;
    var isAdmin=canManageGroupSkins(group);
    var sections=[];
    try{sections=await sbGetGroupChatLayout(group.id);}catch(e){console.warn('chat layout error',e);}
    var html='<div class="gc-sidebar-header"><span class="gc-sidebar-title"><i class="fas fa-comments"></i> Channels</span>';
    if(isAdmin) html+='<button class="gc-add-btn" id="gcAddSection" title="Add Section"><i class="fas fa-plus"></i></button>';
    html+='</div>';
    if(!sections.length){
        html+='<div class="gc-empty-sidebar"><p>No channels yet.</p>';
        if(isAdmin) html+='<p style="font-size:12px;color:var(--gray);">Click + to create a section.</p>';
        html+='</div>';
    }
    sections.forEach(function(sec,si){
        html+='<div class="gc-section" data-sid="'+sec.id+'"'+(isAdmin?' draggable="true"':'')+'>';
        html+='<div class="gc-section-header">';
        if(isAdmin) html+='<span class="gc-drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></span>';
        html+='<span class="gc-section-name">'+escapeHtml(sec.name)+'</span>';
        if(isAdmin) html+='<div class="gc-section-actions"><button class="gc-add-btn gc-add-ch-btn" data-sid="'+sec.id+'" title="Add Channel"><i class="fas fa-plus"></i></button><button class="gc-add-btn gc-edit-sec-btn" data-sid="'+sec.id+'" data-sname="'+escapeHtml(sec.name)+'" title="Edit Section"><i class="fas fa-pen"></i></button><button class="gc-add-btn gc-del-sec-btn" data-sid="'+sec.id+'" title="Delete Section"><i class="fas fa-trash"></i></button></div>';
        html+='</div>';
        html+='<div class="gc-channel-list" data-sid="'+sec.id+'">';
        (sec.channels||[]).forEach(function(ch,ci){
            var active=_gcActiveChannel&&_gcActiveChannel.id===ch.id;
            html+='<div class="gc-channel'+(active?' active':'')+'" data-cid="'+ch.id+'" data-cname="'+escapeHtml(ch.name)+'" data-sid="'+sec.id+'"'+(isAdmin?' draggable="true"':'')+'>';
            var chLocked=_gcLockedChannels[ch.id];
            html+='<span class="gc-channel-hash">'+(chLocked?'<i class="fas fa-lock" style="font-size:10px;"></i>':'#')+'</span> '+escapeHtml(ch.name);
            if(isAdmin) html+='<div class="gc-ch-actions"><button class="gc-add-btn gc-edit-ch-btn" data-cid="'+ch.id+'" data-cname="'+escapeHtml(ch.name)+'" title="Rename"><i class="fas fa-pen"></i></button><button class="gc-add-btn gc-del-ch-btn" data-cid="'+ch.id+'" title="Delete"><i class="fas fa-trash"></i></button></div>';
            html+='</div>';
        });
        html+='</div>';
        html+='</div>';
    });
    sidebar.innerHTML=html;
    // Bind events
    $$('#gcSidebar .gc-channel').forEach(function(el){
        el.addEventListener('click',function(e){
            if(e.target.closest('.gc-ch-actions'))return;
            var cid=el.dataset.cid;var cname=el.dataset.cname;
            openGroupChannel({id:cid,name:cname});
        });
        // Right-click context menu for admins
        if(isAdmin) el.addEventListener('contextmenu',function(e){
            e.preventDefault();
            showGcChannelContextMenu(group,el.dataset.cid,el.dataset.cname,e.clientX,e.clientY);
        });
        // Long-press for mobile admins
        if(isAdmin){
            var _lpTimer=null;
            el.addEventListener('touchstart',function(e){_lpTimer=setTimeout(function(){
                _lpTimer='fired';
                showGcChannelContextMenu(group,el.dataset.cid,el.dataset.cname,e.touches[0].clientX,e.touches[0].clientY);
            },600);},{passive:true});
            el.addEventListener('touchend',function(){if(_lpTimer&&_lpTimer!=='fired')clearTimeout(_lpTimer);});
            el.addEventListener('touchmove',function(){if(_lpTimer&&_lpTimer!=='fired')clearTimeout(_lpTimer);});
        }
    });
    var addSecBtn=document.getElementById('gcAddSection');
    if(addSecBtn) addSecBtn.addEventListener('click',function(){showGcSectionModal(group);});
    $$('#gcSidebar .gc-add-ch-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();showGcChannelModal(group,b.dataset.sid);});});
    $$('#gcSidebar .gc-edit-sec-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();showGcSectionModal(group,b.dataset.sid,b.dataset.sname);});});
    $$('#gcSidebar .gc-del-sec-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();confirmGcDeleteSection(group,b.dataset.sid);});});
    $$('#gcSidebar .gc-edit-ch-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();showGcChannelModal(group,null,b.dataset.cid,b.dataset.cname);});});
    $$('#gcSidebar .gc-del-ch-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();confirmGcDeleteChannel(group,b.dataset.cid);});});

    // Drag and drop for sections and channels (admin only)
    if(isAdmin) _initGcDragDrop(group,sidebar);
}

function _initGcDragDrop(group,sidebar){
    var _dragEl=null;
    var _dragType=null; // 'section' or 'channel'

    // --- Section drag (reorder sections) ---
    sidebar.querySelectorAll('.gc-section[draggable]').forEach(function(sec){
        sec.addEventListener('dragstart',function(e){
            // Only drag from the handle
            if(!e.target.closest('.gc-drag-handle')&&e.target.closest('.gc-channel')){e.preventDefault();return;}
            _dragEl=sec;_dragType='section';
            sec.classList.add('gc-dragging');
            e.dataTransfer.effectAllowed='move';
            e.dataTransfer.setData('text/plain',sec.dataset.sid);
        });
        sec.addEventListener('dragend',function(){
            sec.classList.remove('gc-dragging');
            sidebar.querySelectorAll('.gc-drag-over').forEach(function(el){el.classList.remove('gc-drag-over');});
            _dragEl=null;_dragType=null;
        });
        sec.addEventListener('dragover',function(e){
            if(_dragType!=='section') return;
            e.preventDefault();e.dataTransfer.dropEffect='move';
            sec.classList.add('gc-drag-over');
        });
        sec.addEventListener('dragleave',function(){sec.classList.remove('gc-drag-over');});
        sec.addEventListener('drop',async function(e){
            e.preventDefault();
            sec.classList.remove('gc-drag-over');
            if(_dragType!=='section'||!_dragEl||_dragEl===sec) return;
            // Reorder: move dragged section before this one
            sec.parentNode.insertBefore(_dragEl,sec);
            // Save new positions
            var allSections=sidebar.querySelectorAll('.gc-section');
            for(var i=0;i<allSections.length;i++){
                await sbUpdateGroupChatSection(allSections[i].dataset.sid,{position:i}).catch(function(){});
            }
            showToast('Section reordered');
        });
    });

    // --- Channel drag (reorder + move between sections) ---
    sidebar.querySelectorAll('.gc-channel[draggable]').forEach(function(ch){
        ch.addEventListener('dragstart',function(e){
            e.stopPropagation(); // don't trigger section drag
            _dragEl=ch;_dragType='channel';
            ch.classList.add('gc-dragging');
            e.dataTransfer.effectAllowed='move';
            e.dataTransfer.setData('text/plain',ch.dataset.cid);
        });
        ch.addEventListener('dragend',function(){
            ch.classList.remove('gc-dragging');
            sidebar.querySelectorAll('.gc-drag-over,.gc-drop-target').forEach(function(el){el.classList.remove('gc-drag-over');el.classList.remove('gc-drop-target');});
            _dragEl=null;_dragType=null;
        });
        ch.addEventListener('dragover',function(e){
            if(_dragType!=='channel') return;
            e.preventDefault();e.stopPropagation();
            e.dataTransfer.dropEffect='move';
            ch.classList.add('gc-drag-over');
        });
        ch.addEventListener('dragleave',function(){ch.classList.remove('gc-drag-over');});
        ch.addEventListener('drop',async function(e){
            e.preventDefault();e.stopPropagation();
            ch.classList.remove('gc-drag-over');
            if(_dragType!=='channel'||!_dragEl||_dragEl===ch) return;
            // Move dragged channel before this one (possibly in a different section)
            ch.parentNode.insertBefore(_dragEl,ch);
            // Update the dragged channel's section_id if it moved
            var newSid=ch.parentNode.dataset.sid;
            var oldSid=_dragEl.dataset.sid;
            _dragEl.dataset.sid=newSid;
            // Save positions for all channels in the target section
            var chList=ch.parentNode.querySelectorAll('.gc-channel');
            for(var i=0;i<chList.length;i++){
                var updates={position:i};
                if(chList[i].dataset.cid===_dragEl.dataset.cid&&newSid!==oldSid) updates.section_id=newSid;
                await sbUpdateGroupChatChannel(chList[i].dataset.cid,updates).catch(function(){});
            }
            showToast('Channel moved');
        });
    });

    // --- Channel drop zones on sections (drop into empty section or at end) ---
    sidebar.querySelectorAll('.gc-channel-list').forEach(function(list){
        list.addEventListener('dragover',function(e){
            if(_dragType!=='channel') return;
            e.preventDefault();
            list.classList.add('gc-drop-target');
        });
        list.addEventListener('dragleave',function(e){
            if(!list.contains(e.relatedTarget)) list.classList.remove('gc-drop-target');
        });
        list.addEventListener('drop',async function(e){
            e.preventDefault();
            list.classList.remove('gc-drop-target');
            if(_dragType!=='channel'||!_dragEl) return;
            // If dropped on the list itself (not on a channel), append to end
            if(e.target===list||e.target.closest('.gc-channel-list')===list){
                list.appendChild(_dragEl);
                var newSid=list.dataset.sid;
                _dragEl.dataset.sid=newSid;
                var chList=list.querySelectorAll('.gc-channel');
                for(var i=0;i<chList.length;i++){
                    var updates={position:i};
                    if(chList[i].dataset.cid===_dragEl.dataset.cid) updates.section_id=newSid;
                    await sbUpdateGroupChatChannel(chList[i].dataset.cid,updates).catch(function(){});
                }
                showToast('Channel moved');
            }
        });
    });
}

// Helper: show modal on top of fullscreen chat (renders inside the chat overlay)
function _gcShowModal(html){
    _gcCloseModal(); // remove any existing
    var cs=document.getElementById('gvChatSection');
    var target=cs||document.body;
    var overlay=document.createElement('div');
    overlay.className='gc-modal-overlay';
    overlay.innerHTML='<div class="gc-modal-content">'+html+'</div>';
    target.appendChild(overlay);
    // Bind close buttons
    overlay.querySelectorAll('.modal-close').forEach(function(btn){
        btn.addEventListener('click',function(){_gcCloseModal();});
    });
    // Close on backdrop click
    overlay.addEventListener('click',function(e){
        if(e.target===overlay) _gcCloseModal();
    });
    // Focus first input
    var firstInput=overlay.querySelector('input,textarea');
    if(firstInput) setTimeout(function(){firstInput.focus();},50);
    return overlay;
}
function _gcCloseModal(){
    var existing=document.querySelector('.gc-modal-overlay');
    if(existing) existing.remove();
}

function showGcSectionModal(group,editId,editName){
    var isEdit=!!editId;
    var html='<div class="create-post-modal"><div class="modal-header"><h3>'+(isEdit?'Rename Section':'New Section')+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div style="padding:16px;"><input type="text" id="gcSecNameInput" placeholder="Section name..." value="'+(editName||'')+'" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--light-bg);color:var(--dark);outline:none;font-family:inherit;">';
    html+='<button class="btn btn-primary" id="gcSecSaveBtn" style="margin-top:12px;width:100%;">'+(isEdit?'Save':'Create')+'</button></div></div>';
    _gcShowModal(html);
    var inp=document.getElementById('gcSecNameInput');if(inp)inp.focus();
    document.getElementById('gcSecSaveBtn').addEventListener('click',async function(){
        var name=(inp.value||'').trim();if(!name){showToast('Enter a name');return;}
        try{
            if(isEdit) await sbUpdateGroupChatSection(editId,{name:name});
            else await sbCreateGroupChatSection(group.id,name);
            _gcCloseModal();showToast(isEdit?'Section renamed':'Section created');
            await renderGroupChatSidebar(group);
        }catch(e){showToast('Error: '+e.message);}
    });
}

function showGcChannelModal(group,sectionId,editId,editName){
    var isEdit=!!editId;
    var html='<div class="create-post-modal"><div class="modal-header"><h3>'+(isEdit?'Rename Channel':'New Channel')+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div style="padding:16px;"><input type="text" id="gcChNameInput" placeholder="Channel name..." value="'+(editName||'')+'" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--light-bg);color:var(--dark);outline:none;font-family:inherit;">';
    html+='<button class="btn btn-primary" id="gcChSaveBtn" style="margin-top:12px;width:100%;">'+(isEdit?'Save':'Create')+'</button></div></div>';
    _gcShowModal(html);
    var inp=document.getElementById('gcChNameInput');if(inp)inp.focus();
    document.getElementById('gcChSaveBtn').addEventListener('click',async function(){
        var name=(inp.value||'').trim();if(!name){showToast('Enter a name');return;}
        name=name.toLowerCase().replace(/[^a-z0-9-_ ]/g,'').replace(/\s+/g,'-');
        try{
            if(isEdit) await sbUpdateGroupChatChannel(editId,{name:name});
            else await sbCreateGroupChatChannel(group.id,sectionId,name);
            _gcCloseModal();showToast(isEdit?'Channel renamed':'Channel created');
            await renderGroupChatSidebar(group);
        }catch(e){showToast('Error: '+e.message);}
    });
}

function confirmGcDeleteSection(group,sectionId){
    _gcShowModal('<div class="create-post-modal"><div class="modal-header"><h3>Delete Section</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div style="padding:16px;"><p>Delete this section and ALL its channels and messages? This cannot be undone.</p><div style="display:flex;gap:10px;margin-top:14px;"><button class="btn btn-primary" id="gcDelSecYes" style="flex:1;background:#e74c3c;">Delete</button><button class="btn btn-outline" id="gcDelSecNo" style="flex:1;">Cancel</button></div></div></div>');
    document.getElementById('gcDelSecYes').addEventListener('click',async function(){
        try{await sbDeleteGroupChatSection(sectionId);_gcCloseModal();showToast('Section deleted');await renderGroupChatSidebar(group);}catch(e){showToast('Error: '+e.message);}
    });
    document.getElementById('gcDelSecNo').addEventListener('click',_gcCloseModal);
}

function confirmGcDeleteChannel(group,channelId){
    _gcShowModal('<div class="create-post-modal"><div class="modal-header"><h3>Delete Channel</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div style="padding:16px;"><p>Delete this channel and all its messages?</p><div style="display:flex;gap:10px;margin-top:14px;"><button class="btn btn-primary" id="gcDelChYes" style="flex:1;background:#e74c3c;">Delete</button><button class="btn btn-outline" id="gcDelChNo" style="flex:1;">Cancel</button></div></div></div>');
    document.getElementById('gcDelChYes').addEventListener('click',async function(){
        try{
            await sbDeleteGroupChatChannel(channelId);_gcCloseModal();showToast('Channel deleted');
            if(_gcActiveChannel&&_gcActiveChannel.id===channelId){_gcActiveChannel=null;var ca=document.getElementById('gcChatArea');if(ca)ca.innerHTML='<div class="gc-empty"><i class="fas fa-comments" style="font-size:48px;opacity:.3;"></i><p>Select a channel to start chatting</p></div>';}
            await renderGroupChatSidebar(_gcGroup);
        }catch(e){showToast('Error: '+e.message);}
    });
    document.getElementById('gcDelChNo').addEventListener('click',_gcCloseModal);
}

async function openGroupChannel(channel){
    _cleanupGroupChat();
    _gcActiveChannel=channel;
    // Highlight in sidebar
    $$('#gcSidebar .gc-channel').forEach(function(el){el.classList.toggle('active',el.dataset.cid===channel.id);});
    // On mobile: switch from sidebar view to chat view
    var cs=document.getElementById('gvChatSection');
    if(cs) cs.classList.add('gc-chat-open');
    var area=document.getElementById('gcChatArea');if(!area)return;
    var isAdmin=_gcGroup?canManageGroupSkins(_gcGroup):false;
    // Build chat area
    var html='<div class="gc-chat-header"><button class="gc-mobile-nav-btn" id="gcMobileNavBtn"><i class="fas fa-bars"></i></button><span class="gc-channel-hash">#</span> <span class="gc-chat-channel-name">'+escapeHtml(channel.name)+'</span></div>';
    html+='<div class="gc-messages" id="gcMessages"><div style="text-align:center;padding:40px;color:var(--gray);"><i class="fas fa-spinner fa-spin"></i></div></div>';
    html+='<div class="gc-input-bar">';
    html+='<button class="gc-media-btn" id="gcImgBtn" title="Upload image/video"><i class="fas fa-image"></i></button>';
    html+='<input type="file" id="gcFileInput" accept="image/*,video/mp4,video/webm,video/quicktime" style="display:none;">';
    html+='<button class="gc-media-btn" id="gcGifBtn" title="Send GIF"><i class="fas fa-film"></i></button>';
    html+='<button class="gc-media-btn" id="gcEmojiBtn" title="Emoji"><i class="fas fa-face-smile"></i></button>';
    html+='<div id="gcEmojiPanel" class="emoji-picker-panel"></div>';
    html+='<div id="gcGifPicker" class="msg-gif-picker" style="display:none;">';
    html+='<div class="gif-picker-header"><input type="text" id="gcGifSearch" placeholder="Search GIFs..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px;background:var(--light-bg);color:var(--dark);outline:none;font-family:inherit;"><button id="gcGifClose" style="background:none;border:none;color:var(--gray);font-size:16px;cursor:pointer;padding:4px 8px;"><i class="fas fa-times"></i></button></div>';
    html+='<div class="gif-picker-grid" id="gcGifGrid"></div>';
    html+='<div class="gif-picker-footer">Powered by <strong>KLIPY</strong></div>';
    html+='</div>';
    var channelLocked=_gcLockedChannels[channel.id]&&!canSendInChannel(_gcGroup,channel.id);
    if(channelLocked){
        html+='<div style="flex:1;text-align:center;color:var(--gray);font-size:13px;padding:8px;"><i class="fas fa-lock" style="margin-right:6px;"></i>This channel is locked</div>';
    } else {
        html+='<textarea id="gcMsgInput" placeholder="Message #'+escapeHtml(channel.name)+'..." rows="1"></textarea>';
        html+='<button id="gcSendBtn"><i class="fas fa-paper-plane"></i></button>';
    }
    html+='</div>';
    area.innerHTML=html;
    // Load messages
    try{
        var msgs=await sbGetGroupChatMessages(channel.id);
        renderGcMessages(msgs,isAdmin);
    }catch(e){document.getElementById('gcMessages').innerHTML='<div style="text-align:center;padding:40px;color:var(--gray);">Could not load messages.</div>';}
    // Subscribe to realtime
    _gcSubscription=sbSubscribeGroupChat(channel.id,function(newMsg,deletedMsg){
        if(deletedMsg){
            var el=document.querySelector('.gc-msg[data-mid="'+deletedMsg.id+'"]');
            if(el)el.remove();
            return;
        }
        if(newMsg&&newMsg.author_id!==currentUser.id){
            // Fetch author info from cache or show username
            var author=_gcMemberCache[newMsg.author_id]||{username:'User',avatar_url:null};
            newMsg.author=author;
            appendGcMessage(newMsg,isAdmin);
        }
    });
    // Bind input
    var sendBtn=document.getElementById('gcSendBtn');
    var msgInput=document.getElementById('gcMsgInput');
    var fileInput=document.getElementById('gcFileInput');
    var imgBtn=document.getElementById('gcImgBtn');
    var gifBtn=document.getElementById('gcGifBtn');
    function doSend(){
        if(!msgInput) return;
        var text=(msgInput.value||'').trim();if(!text)return;
        msgInput.value='';
        sbSendGroupChatMessage(channel.id,text).then(function(msg){appendGcMessage(msg,isAdmin);notifyMentionedUsers(text,null,'a group chat message');}).catch(function(e){console.error('Group chat send:',e);showToast('Failed to send: '+(e.message||'Check console'));});
    }
    if(sendBtn) sendBtn.addEventListener('click',doSend);
    if(msgInput){
        msgInput.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
        // Auto-resize textarea as user types
        msgInput.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';});
    }
    // Image/video upload
    imgBtn.addEventListener('click',function(){fileInput.click();});
    fileInput.addEventListener('change',async function(){
        var file=fileInput.files[0];if(!file)return;fileInput.value='';
        try{
            var url;var mtype='image';
            if(file.type.startsWith('video/')){url=await sbUploadPostVideo(currentUser.id,file);mtype='video';}
            else{url=await sbUploadPostImage(currentUser.id,file);}
            var msg=await sbSendGroupChatMessage(channel.id,'',url,mtype);
            appendGcMessage(msg,isAdmin);
        }catch(e){showToast('Upload failed: '+e.message);}
    });
    // GIF picker
    _initGcGifPicker(channel.id,isAdmin);
    // Mention autocomplete for group chat input
    initMentionAutocomplete('gcMsgInput',_gcGroup?_gcGroup.id:null);
    // Emoji button for group chat
    var gcEmojiBtn=document.getElementById('gcEmojiBtn');
    if(gcEmojiBtn) gcEmojiBtn.addEventListener('click',function(){openEmojiPicker('gcEmojiPanel',document.getElementById('gcMsgInput'));});
    // Mobile: back to channel list button
    var mobileNavBtn=document.getElementById('gcMobileNavBtn');
    if(mobileNavBtn) mobileNavBtn.addEventListener('click',function(){
        var cs=document.getElementById('gvChatSection');
        if(cs) cs.classList.remove('gc-chat-open');
    });
}

function _initGcGifPicker(channelId,isAdmin){
    var gifBtn=document.getElementById('gcGifBtn');
    var picker=document.getElementById('gcGifPicker');
    var closeBtn=document.getElementById('gcGifClose');
    var searchInput=document.getElementById('gcGifSearch');
    var grid=document.getElementById('gcGifGrid');
    if(!gifBtn||!picker)return;
    gifBtn.addEventListener('click',function(){picker.style.display=picker.style.display==='none'?'':'none';if(picker.style.display!=='none'&&!grid.innerHTML)_gcGifLoad(grid,'trending',channelId,isAdmin);});
    closeBtn.addEventListener('click',function(){picker.style.display='none';});
    var _gcGifTimer=null;
    searchInput.addEventListener('input',function(){clearTimeout(_gcGifTimer);_gcGifTimer=setTimeout(function(){var q=searchInput.value.trim();_gcGifLoad(grid,q||'trending',channelId,isAdmin);},400);});
}

async function _gcGifLoad(grid,query,channelId,isAdmin){
    grid.innerHTML='<div style="text-align:center;padding:20px;color:var(--gray);"><i class="fas fa-spinner fa-spin"></i></div>';
    try{
        var url='https://api.klipy.co/v1/gifs/search?query='+encodeURIComponent(query)+'&limit=20';
        var res=await fetch(url);var data=await res.json();
        var gifs=data.gifs||data.results||data.data||[];
        grid.innerHTML='';
        gifs.forEach(function(g){
            var gifUrl=g.gif_url||g.url||(g.media&&g.media[0]&&g.media[0].gif&&g.media[0].gif.url)||'';
            if(!gifUrl)return;
            var img=document.createElement('img');img.src=gifUrl;img.style.cssText='width:100%;border-radius:6px;cursor:pointer;';
            img.addEventListener('click',function(){
                document.getElementById('gcGifPicker').style.display='none';
                sbSendGroupChatMessage(channelId,'[gif]'+gifUrl+'[/gif]',gifUrl,'gif').then(function(msg){appendGcMessage(msg,isAdmin);}).catch(function(){showToast('Failed to send GIF');});
            });
            grid.appendChild(img);
        });
        if(!gifs.length)grid.innerHTML='<div style="text-align:center;padding:20px;color:var(--gray);">No GIFs found</div>';
    }catch(e){grid.innerHTML='<div style="text-align:center;padding:20px;color:var(--gray);">Failed to load GIFs</div>';}
}

function renderGcMessages(msgs,isAdmin){
    var container=document.getElementById('gcMessages');if(!container)return;
    if(!msgs.length){container.innerHTML='<div class="gc-welcome"><p>This is the beginning of <strong>#'+escapeHtml(_gcActiveChannel.name)+'</strong></p><p style="font-size:13px;color:var(--gray);">Start the conversation!</p></div>';return;}
    container.innerHTML='';
    msgs.forEach(function(m){appendGcMessage(m,isAdmin,true);});
    container.scrollTop=container.scrollHeight;
}

function appendGcMessage(msg,isAdmin,skipScroll){
    var container=document.getElementById('gcMessages');if(!container)return;
    var author=msg.author||{};
    var name=author.display_name||author.username||'User';
    var avatar=author.avatar_url||'images/default-avatar.svg';
    var isOwn=msg.author_id===currentUser.id;
    var canDelete=isOwn||isAdmin;
    var time=new Date(msg.created_at);
    var timeStr=time.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    var dateStr=time.toLocaleDateString([],{month:'short',day:'numeric'});
    // Build content
    var contentHtml='';
    if(msg.media_url){
        if(msg.media_type==='video'||isVideoUrl(msg.media_url)){
            contentHtml='<video src="'+escapeHtml(msg.media_url)+'" controls style="max-width:300px;max-height:260px;border-radius:8px;"></video>';
        } else if(msg.media_type==='gif'){
            contentHtml='<img src="'+escapeHtml(msg.media_url)+'" style="max-width:250px;border-radius:8px;">';
        } else {
            contentHtml='<img src="'+escapeHtml(msg.media_url)+'" style="max-width:300px;max-height:300px;border-radius:8px;cursor:pointer;" onclick="window.open(this.src)">';
        }
    }
    if(msg.content){
        var parsed=_renderMsgContent(msg.content);
        if(parsed.isMedia) contentHtml+=parsed.html;
        else contentHtml+='<div class="gc-msg-text">'+renderMentionsInText(linkifyText(parsed.html))+'</div>';
    }
    var div=document.createElement('div');
    div.className='gc-msg'+(isOwn?' gc-msg-own':'');
    div.dataset.mid=msg.id;
    div.innerHTML='<img src="'+avatar+'" class="gc-msg-avatar" data-uid="'+(msg.author_id||'')+'">'
        +'<div class="gc-msg-body"><div class="gc-msg-header"><span class="gc-msg-name" data-uid="'+(msg.author_id||'')+'">'+escapeHtml(name)+'</span><span class="gc-msg-time">'+dateStr+' '+timeStr+'</span>'
        +(isOwn&&msg.content?'<button class="gc-msg-edit" data-mid="'+msg.id+'" title="Edit"><i class="fas fa-pen"></i></button>':'')
        +(canDelete?'<button class="gc-msg-del" data-mid="'+msg.id+'" title="Delete"><i class="fas fa-trash"></i></button>':'')
        +'</div><div class="gc-msg-content" data-raw="'+escapeHtml(msg.content||'')+'">'+contentHtml+'</div></div>';
    container.appendChild(div);
    // Bind delete
    var delBtn=div.querySelector('.gc-msg-del');
    if(delBtn) delBtn.addEventListener('click',async function(){
        try{await sbDeleteGroupChatMessage(msg.id);div.remove();}catch(e){showToast('Could not delete');}
    });
    // Bind edit
    var editBtn=div.querySelector('.gc-msg-edit');
    if(editBtn) editBtn.addEventListener('click',function(){
        var contentEl=div.querySelector('.gc-msg-content');
        var raw=contentEl?contentEl.dataset.raw:'';
        // Inline edit — replace message content with textarea right in the chat
        var origHtml=contentEl.innerHTML;
        contentEl.innerHTML='<div class="gc-inline-edit"><textarea class="gc-edit-textarea" id="gcInlineEdit">'+escapeHtml(raw)+'</textarea><div class="gc-edit-actions"><button class="btn btn-outline gc-edit-cancel" style="font-size:12px;padding:4px 12px;">Cancel</button><button class="btn btn-primary gc-edit-save" style="font-size:12px;padding:4px 12px;">Save</button></div></div>';
        var ta=document.getElementById('gcInlineEdit');
        if(ta){ta.focus();ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,Math.round(window.innerHeight*0.5))+'px';}
        contentEl.querySelector('.gc-edit-cancel').addEventListener('click',function(){
            contentEl.innerHTML=origHtml;contentEl.dataset.raw=raw;
        });
        contentEl.querySelector('.gc-edit-save').addEventListener('click',async function(){
            var newText=ta.value.trim();
            if(!newText){showToast('Message cannot be empty');return;}
            try{
                await sbEditGroupChatMessage(msg.id,newText);
                var parsed=_renderMsgContent(newText);
                var newHtml=parsed.isMedia?parsed.html:'<div class="gc-msg-text">'+renderMentionsInText(linkifyText(parsed.html))+'</div>';
                contentEl.innerHTML=newHtml;
                contentEl.dataset.raw=newText;
                showToast('Message edited');
            }catch(e){showToast('Edit failed: '+(e.message||''));}
        });
    });
    // Bind avatar/name click to profile
    div.querySelector('.gc-msg-avatar').addEventListener('click',function(){if(msg.author_id)viewProfile(msg.author_id);});
    div.querySelector('.gc-msg-name').addEventListener('click',function(){if(msg.author_id)viewProfile(msg.author_id);});
    // Bind mention clicks in this message
    div.querySelectorAll('.mention-link').forEach(function(el){
        el.style.cursor='pointer';
        el.addEventListener('click',function(){
            var uname=el.dataset.mention;
            if(!uname) return;
            sbGetProfileByUsername(uname).then(function(p){
                if(p) showProfileView(profileToPerson(p));
            }).catch(function(e){console.warn('Mention profile load:',e);});
        });
    });
    if(!skipScroll) container.scrollTop=container.scrollHeight;
}

function bindGvPostEvents(){
    $$('#gvPostsFeed .like-btn').forEach(function(btn){btn.addEventListener('click',async function(e){var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.like-count');var count=parseInt(countEl.textContent);var isUUID=/^[0-9a-f]{8}-/.test(pid);var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(state.likedPosts[pid]){delete state.likedPosts[pid];btn.classList.remove('liked');btn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}else{if(state.dislikedPosts[pid]){var db=btn.closest('.action-left').querySelector('.dislike-btn');var dc=db.querySelector('.dislike-count');dc.textContent=Math.max(0,parseInt(dc.textContent)-1);delete state.dislikedPosts[pid];db.classList.remove('disliked');db.querySelector('i').className='far fa-thumbs-down';}state.likedPosts[pid]=true;btn.classList.add('liked');btn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)){if(!had&&has){state.coins++;updateCoins();if(_activeGroupId)addGroupCoins(_activeGroupId,1);}else if(had&&!has){state.coins--;updateCoins();if(_activeGroupId&&(state.groupCoins[_activeGroupId]||0)>0)addGroupCoins(_activeGroupId,-1);}}saveState();});});
    $$('#gvPostsFeed .dislike-btn').forEach(function(btn){btn.addEventListener('click',async function(){var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.dislike-count');var count=parseInt(countEl.textContent);var isUUID=/^[0-9a-f]{8}-/.test(pid);var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(state.dislikedPosts[pid]){delete state.dislikedPosts[pid];btn.classList.remove('disliked');btn.querySelector('i').className='far fa-thumbs-down';countEl.textContent=Math.max(0,count-1);}else{if(state.likedPosts[pid]){var lb=btn.closest('.action-left').querySelector('.like-btn');var lc=lb.querySelector('.like-count');lc.textContent=Math.max(0,parseInt(lc.textContent)-1);delete state.likedPosts[pid];lb.classList.remove('liked');lb.querySelector('i').className='far fa-thumbs-up';if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}state.dislikedPosts[pid]=true;btn.classList.add('disliked');btn.querySelector('i').className='fas fa-thumbs-down';countEl.textContent=count+1;}var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)){if(!had&&has){state.coins++;updateCoins();if(_activeGroupId)addGroupCoins(_activeGroupId,1);}else if(had&&!has){state.coins--;updateCoins();if(_activeGroupId&&(state.groupCoins[_activeGroupId]||0)>0)addGroupCoins(_activeGroupId,-1);}}saveState();});});
    $$('#gvPostsFeed .comment-btn').forEach(function(btn){btn.addEventListener('click',function(){var postId=btn.closest('.action-left').querySelector('.like-btn').getAttribute('data-post-id');showComments(postId,btn.querySelector('span'));});});
    // Post menu toggle
    $$('#gvPostsFeed .post-menu-btn').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var menuId=btn.dataset.menu;var menu=document.getElementById(menuId);if(!menu)return;$$('#gvPostsFeed .post-dropdown.show').forEach(function(m){if(m!==menu)m.classList.remove('show');});menu.classList.toggle('show');});});
    // Post dropdown actions
    $$('#gvPostsFeed .post-dropdown a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();a.closest('.post-dropdown').classList.remove('show');var pid=a.dataset.pid;var action=a.dataset.action;if(action==='save') showSaveModal(pid);else if(action==='report') showReportModal(pid);else if(action==='hide'){var postEl=document.querySelector('#gvPostsFeed .feed-post[data-post-id="'+pid+'"]');if(postEl){postEl.style.display='none';showToast('Post hidden');}}else if(action==='edit') showEditGroupPostModal(pid);else if(action==='delete') confirmDeleteGroupPost(pid);});});
    bindLikeCountClicks('#gvPostsFeed');
}

function openGroupPostModal(group){
    var html='<div class="create-post-modal"><div class="modal-header"><h3>Post in '+escapeHtml(group.name)+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="cpm-scroll"><div style="display:flex;align-items:center;gap:10px;padding:16px 20px 0;"><img src="'+$('#profileAvatarImg').src+'" style="width:40px;height:40px;border-radius:50%;"><strong style="font-size:14px;">'+(currentUser?(currentUser.display_name||currentUser.username):'You')+'</strong></div>';
    html+='<textarea class="cpm-textarea" id="gvCpmText" placeholder="Write something..."></textarea>';
    html+='<div class="cpm-media-zone" id="gvCpmMediaZone"><div class="cpm-media-grid" id="gvCpmGrid"></div><div id="gvCpmDropZone"><i class="fas fa-photo-video"></i><br>Add Photos/Videos</div><input type="file" accept="image/*,video/*" multiple id="gvCpmFileInput" style="display:none;"></div>';
    html+='</div><div class="cpm-footer"><div id="gvCpmEmojiPanel" class="emoji-picker-panel"></div><div style="display:flex;gap:8px;align-items:center;width:100%;"><button class="cpm-emoji-btn" id="gvCpmEmojiBtn" title="Emoji"><i class="fas fa-face-smile"></i></button><button class="cpm-emoji-btn" id="gvCpmCameraBtn" title="Add Photos/Videos"><i class="fas fa-camera"></i></button><button class="btn btn-primary" id="gvCpmPublish" style="flex:1;">Publish</button></div></div></div>';
    showModal(html);
    document.getElementById('gvCpmEmojiBtn').addEventListener('click',function(){openEmojiPicker('gvCpmEmojiPanel',document.getElementById('gvCpmText'));});
    initMentionAutocomplete('gvCpmText',group.id);
    var mediaList=[];
    var zone=document.getElementById('gvCpmMediaZone'),grid=document.getElementById('gvCpmGrid'),dropZone=document.getElementById('gvCpmDropZone'),fileInput=document.getElementById('gvCpmFileInput');
    dropZone.addEventListener('click',function(){fileInput.click();});
    function gvAddFilesToMedia(files){
        Array.from(files).forEach(function(f){var isV=f.type.startsWith('video/');if(isV){mediaList.push({src:URL.createObjectURL(f),type:'video',file:f});renderGrid();}else{var r=new FileReader();r.onload=function(e){mediaList.push({src:e.target.result,type:'image',file:f});renderGrid();};r.readAsDataURL(f);}});
    }
    document.getElementById('gvCpmCameraBtn').addEventListener('click',function(){showCameraMenu(this,fileInput,gvAddFilesToMedia);});
    function renderGrid(){
        grid.innerHTML='';mediaList.forEach(function(m,i){var t=document.createElement('div');t.className='cpm-thumb';t.innerHTML=(m.type==='video'?'<video src="'+m.src+'#t=0.5" preload="metadata" muted></video>':'<img src="'+m.src+'">')+'<button class="remove-thumb" data-idx="'+i+'"><i class="fas fa-times"></i></button>';grid.appendChild(t);});
        zone.classList.toggle('has-media',mediaList.length>0);
        grid.querySelectorAll('.remove-thumb').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();mediaList.splice(parseInt(btn.dataset.idx),1);renderGrid();});});
    }
    fileInput.addEventListener('change',function(){gvAddFilesToMedia(this.files);this.value='';});
    document.getElementById('gvCpmPublish').addEventListener('click',async function(){
        var text=document.getElementById('gvCpmText').value.trim();
        if(!text&&!mediaList.length)return;
        if(!currentUser){showToast('Please sign in to post');return;}
        var publishBtn=this;publishBtn.disabled=true;publishBtn.textContent='Publishing...';
        try{
            var imageUrl=null;
            var allMediaUrls=[];
            for(var mi=0;mi<mediaList.length;mi++){
                try{
                    var mItem=mediaList[mi];
                    var file=mItem.file;
                    if(!file&&mItem.src.startsWith('data:')){var resp=await fetch(mItem.src);var blob=await resp.blob();file=new File([blob],'gpost-'+Date.now()+'-'+mi+(mItem.type==='video'?'.mp4':'.jpg'),{type:blob.type});}
                    if(!file) continue;
                    var url;
                    if(mItem.type==='video') url=await sbUploadPostVideo(currentUser.id,file);
                    else url=await sbUploadPostImage(currentUser.id,file);
                    if(url){allMediaUrls.push(url);if(!imageUrl)imageUrl=url;}
                }catch(e){console.error('Group media upload:',e);showToast('Upload failed: '+(e.message||''));}
            }
            var gPost=await sbCreatePost(currentUser.id,text||'',imageUrl,group.id,null,null,allMediaUrls.length>1?allMediaUrls:null);
            if(gPost) notifyMentionedUsers(text,gPost.id);
            if(_incrementDailyCoin('posts')){state.coins+=5;updateCoins();}
            if(canEarnGroupPostCoin(group.id)){addGroupCoins(group.id,5);trackGroupPostCoin(group.id);}
            saveState();
            closeModal();showGroupView(group);
        }catch(e){
            console.error('Group post:',e);
            showToast('Failed to create post: '+(e.message||'Unknown error'));
            publishBtn.disabled=false;publishBtn.textContent='Publish';
        }
    });
}

// Cover photo upload with crop + previous picker
function showCoverPickerModal(){
    var photos=state.photos.cover;
    var hasCover=!!state.coverPhoto;
    var h='<div class="modal-header"><h3>Change Cover Photo</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    h+='<div style="text-align:center;margin-bottom:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><button class="btn btn-primary" id="coverUploadNewBtn"><i class="fas fa-upload"></i> Upload New Photo</button>';
    if(hasCover) h+='<button class="btn btn-outline" id="coverRemoveBtn" style="color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-trash"></i> Remove Cover</button>';
    h+='</div>';
    if(photos.length>0){
        h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;text-align:center;">Or select from previous uploads:</p>';
        h+='<div class="shop-scroll-row" id="coverPickRow" style="gap:12px;padding:8px 4px 12px;">';
        photos.forEach(function(p,i){h+='<img src="'+p.src+'" class="cover-pick-thumb" data-idx="'+i+'" style="min-width:140px;max-width:140px;height:50px;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;">';});
        h+='</div>';
    }
    h+='</div>';
    showModal(h);
    if(photos.length>0) initDragScroll('#modalContent');
    document.getElementById('coverUploadNewBtn').addEventListener('click',function(){closeModal();$('#coverFileInput').click();});
    var removeBtn=document.getElementById('coverRemoveBtn');
    if(removeBtn) removeBtn.addEventListener('click',function(){
        state.coverPhoto=null;
        $('#timelineCover').style.backgroundImage='';
        var btn=$('#coverEditBtn');if(btn) btn.innerHTML='<i class="fas fa-camera"></i> Add Cover Photo';
        var pvBtn=$('#pvCoverEditBtn');if(pvBtn) pvBtn.innerHTML='<i class="fas fa-camera"></i> Add Cover Photo';
        var pvBanner=$('#pvCoverBanner');if(pvBanner) pvBanner.style.backgroundImage='';
        if(currentUser){
            currentUser.cover_photo_url=null;
            sbUpdateProfile(currentUser.id,{cover_photo_url:null}).catch(function(e){console.error('Remove cover error:',e);});
        }
        saveState();
        closeModal();
        showToast('Cover photo removed');
    });
    $$('.cover-pick-thumb').forEach(function(thumb){
        thumb.addEventListener('mouseenter',function(){thumb.style.borderColor='var(--primary)';});
        thumb.addEventListener('mouseleave',function(){thumb.style.borderColor='transparent';});
        thumb.addEventListener('click',function(){
            var src=photos[parseInt(thumb.dataset.idx)].src;
            closeModal();showCoverCropModal(src,true);
        });
    });
}
$('#coverEditBtn').addEventListener('click',function(e){e.stopPropagation();showCoverPickerModal();});
$('#coverFileInput').addEventListener('change',function(){
    var file=this.files[0];
    if(!file) return;
    var reader=new FileReader();
    reader.onload=function(e){showCoverCropModal(e.target.result);};
    reader.readAsDataURL(file);
});
function showCoverCropModal(src,isRecrop){
    showUnifiedCropModal({
        title:'Crop Cover Photo', src:src,
        aspectRatio:1280/350, outputWidth:1280, outputHeight:350,
        format:'image/jpeg', quality:0.9,
        onConfirm:async function(blob,canvas){
            if(!currentUser){state.coverPhoto=canvas.toDataURL('image/jpeg',0.9);if(!isRecrop) state.photos.cover.unshift({src:state.coverPhoto,date:Date.now()});renderPhotosCard();applyCoverPhoto();return;}
            var file=new File([blob],'cover.jpg',{type:'image/jpeg'});
            try{
                var uploadPromise;
                if(isRecrop){var oldPath=sbExtractStoragePath(src,'avatars');uploadPromise=oldPath?sbUploadFile('avatars',oldPath,file):sbUploadCover(currentUser.id,file);}
                else uploadPromise=sbUploadCover(currentUser.id,file);
                var publicUrl=await uploadPromise;
                await sbUpdateProfile(currentUser.id,{cover_photo_url:publicUrl});
                state.coverPhoto=publicUrl;
                if(!isRecrop) state.photos.cover.unshift({src:publicUrl,date:Date.now()});
            }catch(e){
                console.error('Cover upload error:',e);
                state.coverPhoto=canvas.toDataURL('image/jpeg',0.9);
                if(!isRecrop) state.photos.cover.unshift({src:state.coverPhoto,date:Date.now()});
            }
            renderPhotosCard();applyCoverPhoto();
        }
    });
}
function applyCoverPhoto(){
    if(state.coverPhoto){
        $('#timelineCover').style.backgroundImage='url('+state.coverPhoto+')';
        var btn=$('#coverEditBtn');
        if(btn) btn.innerHTML='<i class="fas fa-camera"></i> Change Cover Photo';
        var pvBtn=$('#pvCoverEditBtn');
        if(pvBtn) pvBtn.innerHTML='<i class="fas fa-camera"></i> Change Cover Photo';
        var pvBanner=$('#pvCoverBanner');
        if(pvBanner) pvBanner.style.backgroundImage='url('+state.coverPhoto+')';
    }
}

// Profile view cover photo upload
$('#pvCoverEditBtn').addEventListener('click',function(e){e.stopPropagation();showCoverPickerModal();});
$('#pvCoverFileInput').addEventListener('change',function(){
    var file=this.files[0];
    if(!file) return;
    var reader=new FileReader();
    reader.onload=function(e){showCoverCropModal(e.target.result);};
    reader.readAsDataURL(file);
    this.value='';
});

// View Profile links
$('#viewMyProfile').addEventListener('click',function(e){e.preventDefault();showMyProfileModal();});
$('#dropdownViewProfile').addEventListener('click',function(e){e.preventDefault();$('#userDropdownMenu').classList.remove('show');showMyProfileModal();});
$('#dropdownMySkins').addEventListener('click',function(e){e.preventDefault();$('#userDropdownMenu').classList.remove('show');_skinPageView='mine';navigateTo('shop');});
$('#dropdownSaved').addEventListener('click',function(e){e.preventDefault();$('#userDropdownMenu').classList.remove('show');navigateTo('saved');});
$('#dropdownShareProfile').addEventListener('click',function(e){e.preventDefault();$('#userDropdownMenu').classList.remove('show');showShareProfileModal();});
$('#trendingHashtagsBtn').addEventListener('click',function(){showTrendingHashtags();});
$('#mobileNotifBtn').addEventListener('click',function(e){e.preventDefault();navigateTo('notifications');});
$('#mobileSearchBtn').addEventListener('click',function(e){e.preventDefault();navigateTo('search');setTimeout(function(){var inp=document.getElementById('searchPageQuery');if(inp)inp.focus();},100);});
$('#searchPageQuery').addEventListener('keydown',function(e){
    if(e.key==='Enter'){var q=this.value.trim();if(q.length>0){performSearch(q);}}
});
$('#searchPageQuery').addEventListener('input',function(){
    var q=this.value.trim();
    if(q.length>=2){performSearch(q);}
    else if(q.length===0){var sr=$('#searchResults');if(sr) showSearchHistory(sr);}
});
$('#searchPageQuery').addEventListener('focus',function(){
    if(!this.value.trim()){var sr=$('#searchResults');if(sr) showSearchHistory(sr);}
});

// Edit Profile
$('#editProfileBtn').addEventListener('click',function(e){
    e.preventDefault();
    // Read current values from Supabase profile (authoritative) or DOM fallback
    var firstName=currentUser?currentUser.first_name||'':'';
    var lastName=currentUser?currentUser.last_name||'':'';
    var nickname=currentUser?currentUser.nickname||'':'';
    var displayMode=currentUser?currentUser.display_mode||'real_name':'real_name';
    var statusText=currentUser?currentUser.status||'':'';
    var bio=currentUser?currentUser.bio||'':'';
    var html='<div class="modal-header"><h3>Edit Profile</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body"><form class="edit-profile-form" id="editProfileForm">';
    // Display mode radio toggle
    html+='<label>Show my name as</label>';
    html+='<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">';
    html+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:0;font-weight:normal;white-space:nowrap;"><input type="radio" name="displayMode" value="real_name" '+(displayMode==='real_name'?'checked':'')+' style="margin:0;"> First &amp; Last Name</label>';
    html+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:0;font-weight:normal;white-space:nowrap;"><input type="radio" name="displayMode" value="nickname" '+(displayMode==='nickname'?'checked':'')+' style="margin:0;"> Nickname</label>';
    html+='</div>';
    // Live preview
    html+='<div id="namePreview" style="background:var(--hover);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px;color:var(--text-secondary);"><i class="fas fa-eye" style="margin-right:6px;"></i>Displays as: <strong id="namePreviewText"></strong></div>';
    // Name fields
    html+='<div style="display:flex;gap:8px;margin-bottom:8px;">';
    html+='<div style="flex:1;"><label>First Name</label><input type="text" id="editFirstName" value="'+escapeHtml(firstName)+'" placeholder="First name"></div>';
    html+='<div style="flex:1;"><label>Last Name</label><input type="text" id="editLastName" value="'+escapeHtml(lastName)+'" placeholder="Last name"></div>';
    html+='</div>';
    html+='<label>Nickname <span style="font-weight:normal;color:var(--gray);">(optional)</span></label><input type="text" id="editNickname" value="'+escapeHtml(nickname)+'" placeholder="Nickname">';
    // Status, Bio, Private Followers — unchanged
    var statusEmojis=['😊','😎','🤩','😴','😤','🥳','🤔','😂','❤️','🔥','💀','👻','🎮','📚','💻','🎵','✨','🌙'];
    html+='<label>Status</label><div class="status-emoji-picker" id="statusEmojiPicker">';
    statusEmojis.forEach(function(em){html+='<button type="button" class="status-emoji-btn'+(statusText===em?' active':'')+'" data-emoji="'+em+'">'+em+'</button>';});
    html+='<button type="button" class="status-emoji-btn'+(statusText===''?' active':'')+'" data-emoji="" title="Clear">✖</button>';
    html+='</div><input type="hidden" id="editStatus" value="'+statusText+'">';
    html+='<label>Bio</label><textarea id="editAbout" placeholder="Tell us about yourself...">'+escapeHtml(bio)+'</textarea>';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--border);margin-top:4px;"><div><label style="margin-bottom:0;"><i class="fas fa-lock" style="margin-right:6px;color:var(--gray);"></i>Private Followers</label><p style="font-size:12px;color:var(--gray);margin-top:2px;">Hide your followers and following lists</p></div><label class="toggle-switch"><input type="checkbox" id="editPrivate" '+(state.privateFollowers?'checked':'')+'><span class="toggle-slider"></span></label></div>';
    html+='<button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">Save</button></form></div>';
    showModal(html);

    // Live preview logic
    function updateNamePreview(){
        var mode=document.querySelector('input[name="displayMode"]:checked').value;
        var fn=$('#editFirstName').value;
        var ln=$('#editLastName').value;
        var nn=$('#editNickname').value;
        var uname=currentUser?currentUser.username:'User';
        var preview=computeDisplayName(fn,ln,nn,mode,uname);
        $('#namePreviewText').textContent=preview;
    }
    updateNamePreview();
    ['editFirstName','editLastName','editNickname'].forEach(function(id){
        document.getElementById(id).addEventListener('input',updateNamePreview);
    });
    document.querySelectorAll('input[name="displayMode"]').forEach(function(r){
        r.addEventListener('change',updateNamePreview);
    });

    $$('.status-emoji-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            $$('.status-emoji-btn').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            document.getElementById('editStatus').value=btn.dataset.emoji;
        });
    });
    $('#editProfileForm').addEventListener('submit', async function(ev){
        ev.preventDefault();
        var fn=$('#editFirstName').value.trim();
        var ln=$('#editLastName').value.trim();
        var nn=$('#editNickname').value.trim();
        if(looksLikeEmail(fn)||looksLikeEmail(ln)||looksLikeEmail(nn)){showToast('Names cannot be email addresses');return;}
        var mode=document.querySelector('input[name="displayMode"]:checked').value;
        var uname=currentUser?currentUser.username:'User';
        var n=computeDisplayName(fn,ln,nn,mode,uname);
        var s=$('#editStatus').value.trim();
        var a=$('#editAbout').value.trim();
        state.privateFollowers=$('#editPrivate').checked;

        // Save to Supabase
        if(currentUser) {
            try {
                await sbUpdateProfile(currentUser.id, {
                    first_name: fn,
                    last_name: ln,
                    nickname: nn,
                    display_mode: mode,
                    display_name: n,
                    status: s,
                    bio: a
                });
                currentUser.first_name = fn;
                currentUser.last_name = ln;
                currentUser.nickname = nn;
                currentUser.display_mode = mode;
                currentUser.display_name = n;
                currentUser.status = s;
                currentUser.bio = a;
            } catch(e) { console.error('Profile update:', e); showToast('Failed to save profile'); return; }
        }

        $$('.profile-name').forEach(function(el){el.textContent=n;});
        var pt=$('.profile-title'); if(pt) pt.textContent=s;
        var pa=$('.profile-about'); if(pa) pa.textContent=a;
        var nu=$('.nav-username'); if(nu) nu.textContent=n;
        updateStatClickable();
        closeModal();
        showToast('Profile updated!');
    });
});

// Followers / Following modals
async function showFollowListModal(title,list,isFollowingList){
    // Build a set of who follows the current user (for relationship badges)
    var followsMe={};
    if(currentUser){
        try{
            var myFollowers=await sbGetFollowers(currentUser.id);
            myFollowers.forEach(function(f){if(f&&f.id)followsMe[f.id]=true;});
        }catch(e){console.warn('Could not load my followers for badges:',e);}
    }
    var html='<div class="modal-header"><h3>'+title+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    var filtered=list.filter(function(p){return p&&p.id;});
    if(!filtered.length){html+='<p style="text-align:center;color:var(--gray);">No one yet.</p>';}
    else{
        html+='<div class="follow-list">';
        filtered.forEach(function(p){
            var name=p.display_name||p.name||p.username||'User';
            var avatar=p.avatar_url||DEFAULT_AVATAR;
            var followed=!!state.followedUsers[p.id];
            var followsYou=!!followsMe[p.id];
            var isSelf=currentUser&&p.id===currentUser.id;
            // Relationship badge
            var badge='';
            if(!isSelf){
                if(followed&&followsYou) badge='<span class="fl-badge fl-mutual" title="Mutual">🤝 Mutual</span>';
                else if(followsYou&&!followed) badge='<span class="fl-badge fl-follows-you" title="Follows you">👀 Follows you</span>';
                else if(followed&&!followsYou) badge='<span class="fl-badge fl-you-follow" title="You follow">💜 You follow</span>';
            }
            html+='<div class="follow-list-item fl-clickable" data-uid="'+p.id+'">';
            html+='<img src="'+avatar+'" alt="'+name+'" class="fl-avatar">';
            html+='<div class="follow-list-info"><h4 class="fl-name">'+name+'</h4>'+badge+'</div>';
            if(!isSelf) html+='<button class="btn follow-btn-small '+(followed?'btn-disabled':'btn-green')+' fl-follow-btn" data-uid="'+p.id+'">'+(followed?'<i class="fas fa-check"></i>':'<i class="fas fa-plus"></i>')+'</button>';
            html+='</div>';
        });
        html+='</div>';
    }
    html+='</div>';
    showModal(html);
    // Click avatar or name to open profile
    $$('.fl-clickable').forEach(function(item){
        var avatar=item.querySelector('.fl-avatar');
        var nameEl=item.querySelector('.fl-name');
        function openProfile(e){
            e.stopPropagation();
            var uid=item.getAttribute('data-uid');
            if(!uid)return;
            closeModal();
            sbGetProfile(uid).then(function(p){if(p)showProfileView(profileToPerson(p));}).catch(function(e){console.error(e);});
        }
        if(avatar){avatar.style.cursor='pointer';avatar.addEventListener('click',openProfile);}
        if(nameEl){nameEl.style.cursor='pointer';nameEl.addEventListener('click',openProfile);}
    });
    $$('.fl-follow-btn').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();toggleFollow(btn.dataset.uid,btn);});});
}
$('#followingStat').addEventListener('click',async function(){
    if(!currentUser)return;
    try{var list=await sbGetFollowing(currentUser.id);showFollowListModal('Following',list,true);}catch(e){console.error(e);}
});
$('#followersStat').addEventListener('click',async function(){
    if(!currentUser)return;
    try{var list=await sbGetFollowers(currentUser.id);showFollowListModal('Followers',list,false);}catch(e){console.error(e);}
});

// Avatar photo upload with selection modal
$('#avatarEditBtn').addEventListener('click',function(e){
    e.stopPropagation();
    var photos=state.photos.profile;
    var html='<div class="modal-header"><h3>Change Profile Picture</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
    html+='<div style="text-align:center;margin-bottom:16px;"><button class="btn btn-primary" id="avatarUploadNewBtn"><i class="fas fa-upload"></i> Upload New Photo</button></div>';
    if(photos.length>0){
        html+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;text-align:center;">Or select from previous uploads:</p>';
        html+='<div class="shop-scroll-row" id="avatarPickRow" style="gap:12px;padding:8px 4px 12px;">';
        photos.forEach(function(p,i){
            html+='<img src="'+p.src+'" class="avatar-pick-thumb" data-idx="'+i+'" style="min-width:80px;max-width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;">';
        });
        html+='</div>';
    }
    html+='</div>';
    showModal(html);
    if(photos.length>0) initDragScroll('#modalContent');
    document.getElementById('avatarUploadNewBtn').addEventListener('click',function(){closeModal();$('#avatarFileInput').click();});
    $$('.avatar-pick-thumb').forEach(function(thumb){
        thumb.addEventListener('mouseenter',function(){thumb.style.borderColor='var(--primary)';});
        thumb.addEventListener('mouseleave',function(){thumb.style.borderColor='transparent';});
        thumb.addEventListener('click',function(){
            var src=photos[parseInt(thumb.dataset.idx)].src;
            closeModal();showCropModal(src,true);
        });
    });
});
$('#avatarFileInput').addEventListener('change', function(){
    var file=this.files[0];
    if(!file) return;
    var isGif=file.type==='image/gif';
    if(isGif){
        // GIFs: upload directly without cropping
        if(currentUser){
            sbUploadAvatar(currentUser.id, file).then(function(publicUrl){
                return sbUpdateProfile(currentUser.id, { avatar_url: publicUrl }).then(function(){
                    syncAllAvatars(publicUrl);
                    state.photos.profile.unshift({src:publicUrl,date:Date.now()});
                    renderPhotosCard();
                });
            }).catch(function(e){console.error('Avatar upload error:', e);});
        } else {
            var reader=new FileReader();
            reader.onload=function(e){syncAllAvatars(e.target.result);state.photos.profile.unshift({src:e.target.result,date:Date.now()});renderPhotosCard();};
            reader.readAsDataURL(file);
        }
    } else {
        // Non-GIFs: show crop modal first
        var reader=new FileReader();
        reader.onload=function(e){ showCropModal(e.target.result); };
        reader.readAsDataURL(file);
    }
});

function showCropModal(src,isRecrop){
    showUnifiedCropModal({
        title:'Crop Photo', src:src,
        aspectRatio:null, outputWidth:400, outputHeight:400,
        format:'image/png', quality:undefined,
        onConfirm:async function(blob,canvas){
            if(!currentUser){var du=canvas.toDataURL('image/png');syncAllAvatars(du);if(!isRecrop) state.photos.profile.unshift({src:du,date:Date.now()});renderPhotosCard();return;}
            var file=new File([blob],'avatar.png',{type:'image/png'});
            try{
                var uploadPromise;
                if(isRecrop){var oldPath=sbExtractStoragePath(src,'avatars');uploadPromise=oldPath?sbUploadFile('avatars',oldPath,file):sbUploadAvatar(currentUser.id,file);}
                else uploadPromise=sbUploadAvatar(currentUser.id,file);
                var publicUrl=await uploadPromise;
                await sbUpdateProfile(currentUser.id,{avatar_url:publicUrl});
                syncAllAvatars(publicUrl);
                if(!isRecrop) state.photos.profile.unshift({src:publicUrl,date:Date.now()});
            }catch(e){
                console.error('Avatar upload error:',e);
                var du=canvas.toDataURL('image/png');
                syncAllAvatars(du);
                if(!isRecrop) state.photos.profile.unshift({src:du,date:Date.now()});
            }
            renderPhotosCard();
        }
    });
}

// Settings & dropdown handlers
function settingsToggle(key){return '<label style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;"><span style="font-size:14px;">'+{darkMode:'Dark Mode',notifSound:'Notification Sounds',privateProfile:'Private Profile',autoplay:'Autoplay Videos',showLocation:'Show Location on Posts'}[key]+'</span><span class="stoggle" data-key="'+key+'" style="width:42px;height:24px;border-radius:12px;background:'+(settings[key]?'var(--green)':'#ccc')+';position:relative;display:inline-block;transition:background .2s;"><span style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;'+(settings[key]?'left:20px':'left:2px')+';transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span></span></label>';}
document.addEventListener('click',function(e){
    var a=e.target.closest('.user-dropdown a');
    if(a){
        var text=a.textContent.trim();
        if(text==='Settings'){
            e.preventDefault();
            $('#userDropdownMenu').classList.remove('show');
            var h='<div class="modal-header"><h3>Settings</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
            h+=settingsToggle('darkMode')+settingsToggle('notifSound')+settingsToggle('privateProfile')+settingsToggle('autoplay')+settingsToggle('showLocation');
            // Light mode toggle
            var lmActive=document.body.classList.contains('light-mode');
            h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;"><span style="font-size:14px;">Light Mode</span><span class="light-mode-toggle" style="width:42px;height:24px;border-radius:12px;background:'+(lmActive?'var(--green)':'#ccc')+';position:relative;display:inline-block;transition:background .2s;cursor:pointer;"><span style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;'+(lmActive?'left:20px':'left:2px')+';transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span></span></label>';
            h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Comment Order</span><select id="commentOrderSelect" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:#fff;color:var(--dark);cursor:pointer;"><option value="top"'+(settings.commentOrder==='top'?' selected':'')+'>Top</option><option value="newest"'+(settings.commentOrder==='newest'?' selected':'')+'>Newest</option><option value="oldest"'+(settings.commentOrder==='oldest'?' selected':'')+'>Oldest</option></select></label>';
            var hiddenCount=Object.keys(hiddenPosts).length;
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Hidden Posts</span><button class="btn btn-outline" id="settingsViewHidden" style="padding:4px 14px;font-size:12px;">View ('+hiddenCount+')</button></div>';
            var blockedCount=Object.keys(blockedUsers).length;
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Blocked Users</span><button class="btn btn-outline" id="settingsViewBlocked" style="padding:4px 14px;font-size:12px;color:#e74c3c;border-color:#e74c3c;">View ('+blockedCount+')</button></div>';
            var cookieStatus=_cookieConsent?'Accepted':'Essential Only';
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Cookie Consent</span><button class="btn btn-outline" id="settingsManageCookies" style="padding:4px 14px;font-size:12px;">'+cookieStatus+'</button></div>';
            // Muted users
            var mutedCount=Object.keys(mutedUsers).length;
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Muted Users</span><button class="btn btn-outline" id="settingsViewMuted" style="padding:4px 14px;font-size:12px;">View ('+mutedCount+')</button></div>';
            // Message privacy
            var msgPriv=settings.messagePrivacy||'everyone';
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Who Can Message Me</span><select id="msgPrivacySelect" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:#fff;color:var(--dark);cursor:pointer;"><option value="everyone"'+(msgPriv==='everyone'?' selected':'')+'>Everyone</option><option value="followers"'+(msgPriv==='followers'?' selected':'')+'>Followers Only</option><option value="nobody"'+(msgPriv==='nobody'?' selected':'')+'>Nobody</option></select></div>';
            // Notification preferences
            h+='<div style="padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;font-weight:600;">Notification Preferences</span>';
            ['like','comment','reply','follow','mention','message','group_invite'].forEach(function(type){
                var label={like:'Likes',comment:'Comments',reply:'Replies',follow:'Follows',mention:'Mentions',message:'Messages',group_invite:'Group Invites'}[type]||type;
                var enabled=isNotifEnabled(type);
                h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;cursor:pointer;"><span>'+label+'</span><span class="notif-pref-toggle" data-ntype="'+type+'" style="width:36px;height:20px;border-radius:10px;background:'+(enabled?'var(--green)':'#ccc')+';position:relative;display:inline-block;transition:background .2s;cursor:pointer;"><span style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;'+(enabled?'left:18px':'left:2px')+';transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span></span></label>';
            });
            h+='</div>';
            // Scheduled posts
            // Old scheduled posts list replaced by calendar view above
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Developer Updates</span><button class="btn btn-outline" id="settingsDevUpdates" style="padding:4px 14px;font-size:12px;"><i class="fas fa-code-branch" style="margin-right:4px;"></i>View</button></div>';
            // Close Friends
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Close Friends</span><button class="btn btn-outline" id="settingsCloseFriends" style="padding:4px 14px;font-size:12px;color:#f59e0b;border-color:#f59e0b;"><i class="fas fa-star" style="margin-right:4px;"></i>'+Object.keys(_closeFriends).length+'</button></div>';
            // Admin: Report Queue
            if(_isAdmin){
                h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;color:#e74c3c;"><i class="fas fa-shield-halved" style="margin-right:4px;"></i>Report Queue</span><button class="btn btn-outline" id="settingsReportQueue" style="padding:4px 14px;font-size:12px;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-flag" style="margin-right:4px;"></i>'+reportedPosts.length+'</button></div>';
            }
            // Account Security section
            h+='<div style="padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;font-weight:600;">Account Security</span>';
            h+='<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">';
            h+='<button class="btn btn-outline" id="settingsChangePassword" style="padding:4px 14px;font-size:12px;"><i class="fas fa-lock" style="margin-right:4px;"></i>Change Password</button>';
            h+='<button class="btn btn-outline" id="settingsChangeEmail" style="padding:4px 14px;font-size:12px;"><i class="fas fa-envelope" style="margin-right:4px;"></i>Change Email</button>';
            h+='<button class="btn btn-outline" id="settings2FA" style="padding:4px 14px;font-size:12px;"><i class="fas fa-shield-halved" style="margin-right:4px;"></i>2FA</button>';
            h+='</div></div>';
            // Link in Bio
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Link in Bio</span><button class="btn btn-outline" id="settingsLinkInBio" style="padding:4px 14px;font-size:12px;"><i class="fas fa-link" style="margin-right:4px;"></i>'+(currentUser&&currentUser.website_url?'Edit':'Add')+'</button></div>';
            // Post Analytics
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Post Analytics</span><button class="btn btn-outline" id="settingsAnalytics" style="padding:4px 14px;font-size:12px;"><i class="fas fa-chart-line" style="margin-right:4px;"></i>View</button></div>';
            // Scheduled Posts Calendar
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Scheduled Posts</span><button class="btn btn-outline" id="settingsScheduledCal" style="padding:4px 14px;font-size:12px;"><i class="fas fa-calendar" style="margin-right:4px;"></i>Calendar</button></div>';
            // Download My Data
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;">Download My Data</span><button class="btn btn-outline" id="settingsDownloadData" style="padding:4px 14px;font-size:12px;"><i class="fas fa-download" style="margin-right:4px;"></i>Export</button></div>';
            h+='<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);text-align:center;"><button class="btn" id="settingsDeleteAccount" style="background:#e74c3c;color:#fff;padding:8px 20px;font-size:13px;border-radius:8px;cursor:pointer;"><i class="fas fa-trash" style="margin-right:6px;"></i>Delete My Account</button></div>';
            h+='<div style="margin-top:16px;text-align:center;"><button class="btn btn-primary modal-close">Done</button></div></div>';
            showModal(h);
            document.getElementById('settingsDeleteAccount').addEventListener('click',function(){
                closeModal();
                var ch='<div class="modal-header"><h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Delete Account</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
                ch+='<div class="modal-body"><p style="color:#777;text-align:center;margin-bottom:12px;">This will <strong>permanently delete</strong> your account and all your data including posts, comments, likes, and followers.</p>';
                ch+='<p style="color:#e74c3c;text-align:center;font-weight:600;margin-bottom:16px;">This action cannot be undone.</p>';
                ch+='<div class="modal-actions"><button class="btn btn-primary modal-close">Cancel</button><button class="btn" id="confirmDeleteAccount" style="background:#e74c3c;color:#fff;">Delete Forever</button></div></div>';
                showModal(ch);
                document.getElementById('confirmDeleteAccount').addEventListener('click',async function(){
                    this.disabled=true;this.textContent='Deleting...';
                    try{
                        await sbDeleteAccount(currentUser.id);
                        closeModal();
                        showToast('Account deleted. Goodbye!');
                        handleLogout();
                    }catch(e){
                        console.error('Delete account error:',e);
                        showToast('Failed to delete account: '+(e.message||'Unknown error'));
                        this.disabled=false;this.textContent='Delete Forever';
                    }
                });
            });
            document.getElementById('settingsViewHidden').addEventListener('click',function(){showHiddenPostsModal();});
            document.getElementById('settingsViewBlocked').addEventListener('click',function(){showBlockedUsersModal();});
            document.getElementById('settingsDevUpdates').addEventListener('click',function(){showDevUpdatesModal();});
            // Analytics button
            var analyticsBtn=document.getElementById('settingsAnalytics');
            if(analyticsBtn) analyticsBtn.addEventListener('click',function(){closeModal();showPostAnalytics();});
            // Light mode toggle
            var lmToggle=document.querySelector('.light-mode-toggle');
            if(lmToggle) lmToggle.addEventListener('click',function(){toggleLightMode();closeModal();});
            // Account security buttons
            var cpBtn=document.getElementById('settingsChangePassword');
            if(cpBtn) cpBtn.addEventListener('click',function(){closeModal();showChangePasswordModal();});
            var ceBtn=document.getElementById('settingsChangeEmail');
            if(ceBtn) ceBtn.addEventListener('click',function(){closeModal();showChangeEmailModal();});
            var tfaBtn=document.getElementById('settings2FA');
            if(tfaBtn) tfaBtn.addEventListener('click',function(){closeModal();showSetup2FAModal();});
            // Link in Bio
            var libBtn=document.getElementById('settingsLinkInBio');
            if(libBtn) libBtn.addEventListener('click',function(){closeModal();showEditLinkInBio();});
            // Scheduled Posts Calendar
            var scBtn=document.getElementById('settingsScheduledCal');
            if(scBtn) scBtn.addEventListener('click',function(){closeModal();showScheduledCalendar();});
            // Admin Report Queue
            var rqBtn=document.getElementById('settingsReportQueue');
            if(rqBtn) rqBtn.addEventListener('click',function(){closeModal();showAdminReportQueue();});
            document.getElementById('settingsManageCookies').addEventListener('click',function(){
                if(_cookieConsent){try{localStorage.setItem('blipvibe_cookie_consent','essential');}catch(e){}_cookieConsent=false;closeModal();showToast('Cookies revoked — third-party embeds are now blocked.');setTimeout(function(){location.reload();},800);}
                else{grantCookieConsent();closeModal();showToast('Cookies accepted — embeds will now load.');setTimeout(function(){location.reload();},800);}
            });
            document.getElementById('commentOrderSelect').addEventListener('change',function(){settings.commentOrder=this.value;saveState();});
            // Message privacy
            var msgPrivSel=document.getElementById('msgPrivacySelect');
            if(msgPrivSel) msgPrivSel.addEventListener('change',function(){settings.messagePrivacy=this.value;saveState();});
            // Muted users
            var viewMutedBtn=document.getElementById('settingsViewMuted');
            if(viewMutedBtn) viewMutedBtn.addEventListener('click',function(){
                var ids=Object.keys(mutedUsers);
                if(!ids.length){showToast('No muted users');return;}
                var mh='<div class="modal-header"><h3>Muted Users</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
                ids.forEach(function(uid){mh+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:13px;">'+uid.substring(0,8)+'...</span><button class="btn btn-outline unmute-btn" data-uid="'+uid+'" style="font-size:11px;padding:3px 10px;">Unmute</button></div>';});
                mh+='</div>';closeModal();showModal(mh);
                $$('.unmute-btn').forEach(function(b){b.addEventListener('click',function(){unmuteUser(b.dataset.uid);b.textContent='Unmuted';b.disabled=true;});});
            });
            // Notification preferences
            $$('.notif-pref-toggle').forEach(function(t){t.style.cursor='pointer';t.addEventListener('click',function(){
                var ntype=t.dataset.ntype;
                _notifPrefs[ntype]=!isNotifEnabled(ntype);
                persistNotifPrefs();
                var enabled=isNotifEnabled(ntype);
                t.style.background=enabled?'var(--green)':'#ccc';
                t.firstElementChild.style.left=enabled?'18px':'2px';
            });});
            // Close Friends manager
            var cfMgrBtn=document.getElementById('settingsCloseFriends');
            if(cfMgrBtn) cfMgrBtn.addEventListener('click',function(){closeModal();showCloseFriendsManager();});
            // Download My Data
            var dlBtn=document.getElementById('settingsDownloadData');
            if(dlBtn) dlBtn.addEventListener('click',function(){closeModal();downloadMyData();});
            // Scheduled posts
            var schedBtn=document.getElementById('settingsScheduled');
            if(schedBtn) schedBtn.addEventListener('click',function(){
                if(!_scheduledPosts.length){showToast('No scheduled posts');return;}
                var sh='<div class="modal-header"><h3>Scheduled Posts</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
                _scheduledPosts.forEach(function(s,i){sh+='<div style="padding:8px 0;border-bottom:1px solid var(--border);"><p style="font-size:13px;">'+escapeHtml(s.content.substring(0,80))+'</p><span style="font-size:11px;color:var(--gray);">Scheduled: '+new Date(s.scheduledAt).toLocaleString()+'</span> <button class="btn btn-outline cancel-sched" data-idx="'+i+'" style="font-size:11px;padding:2px 8px;color:#e74c3c;border-color:#e74c3c;">Cancel</button></div>';});
                sh+='</div>';closeModal();showModal(sh);
                $$('.cancel-sched').forEach(function(b){b.addEventListener('click',function(){_scheduledPosts.splice(parseInt(b.dataset.idx),1);persistScheduled();b.textContent='Cancelled';b.disabled=true;});});
            });
            $$('.stoggle').forEach(function(t){t.style.cursor='pointer';t.addEventListener('click',function(){
                var k=t.dataset.key;settings[k]=!settings[k];
                t.style.background=settings[k]?'var(--green)':'#ccc';
                t.firstElementChild.style.left=settings[k]?'20px':'2px';
                if(k==='darkMode'){document.body.style.background=settings[k]?'#1a1a2e':'';document.body.style.color=settings[k]?'#eee':'';}
                if(k==='autoplay'&&!settings[k]) pauseAllVideos();
                saveState();
            });});
        }
        if(text==='Submit Feedback'){
            e.preventDefault();
            $('#userDropdownMenu').classList.remove('show');
            _showFeedbackModal();
        }
        if(text==='Logout'){
            e.preventDefault();
            $('#userDropdownMenu').classList.remove('show');
            showModal('<div class="modal-header"><h3>Logout</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:#777;text-align:center;margin-bottom:16px;">Are you sure you want to logout?</p><div class="modal-actions"><button class="btn btn-primary modal-close" style="min-width:100px;">Stay</button><button class="btn btn-outline" id="logoutConfirm" style="min-width:100px;">Logout</button></div></div>');
            document.getElementById('logoutConfirm').addEventListener('click',function(){closeModal();handleLogout();});
        }
    }
});

function _showFeedbackModal(){
    var h='<div class="modal-header"><h3><i class="fas fa-envelope" style="color:var(--primary);margin-right:8px;"></i>Report / Feedback</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Subject</label>';
    h+='<input type="text" id="feedbackSubject" placeholder="What is this about?" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:12px;background:var(--card);color:var(--dark);">';
    h+='<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Message</label>';
    h+='<textarea id="feedbackBody" rows="5" placeholder="Describe the issue or share your feedback..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;resize:vertical;background:var(--card);color:var(--dark);"></textarea>';
    h+='<label style="display:block;font-size:13px;font-weight:600;margin:12px 0 4px;">Screenshot <span style="font-weight:400;color:var(--gray);">(optional)</span></label>';
    h+='<div id="feedbackScreenshotArea" style="border:2px dashed var(--border);border-radius:8px;padding:16px;text-align:center;cursor:pointer;position:relative;transition:border-color .2s;">';
    h+='<input type="file" id="feedbackFileInput" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;">';
    h+='<div id="feedbackScreenshotPlaceholder"><i class="fas fa-camera" style="font-size:20px;color:var(--gray);margin-bottom:6px;display:block;"></i><span style="font-size:13px;color:var(--gray);">Click or drag to add a screenshot</span></div>';
    h+='<div id="feedbackScreenshotPreview" style="display:none;position:relative;"><img id="feedbackPreviewImg" style="max-width:100%;max-height:200px;border-radius:6px;"><button type="button" id="feedbackRemoveImg" style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:#e74c3c;color:#fff;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-times"></i></button></div>';
    h+='</div>';
    h+='<div style="margin-top:14px;text-align:right;"><button class="btn btn-primary" id="feedbackSendBtn"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Submit</button></div>';
    h+='</div>';
    showModal(h);
    var _fbFile=null;
    var fileInput=document.getElementById('feedbackFileInput');
    var placeholder=document.getElementById('feedbackScreenshotPlaceholder');
    var preview=document.getElementById('feedbackScreenshotPreview');
    var previewImg=document.getElementById('feedbackPreviewImg');
    fileInput.addEventListener('change',function(){
        if(fileInput.files&&fileInput.files[0]){
            _fbFile=fileInput.files[0];
            var reader=new FileReader();
            reader.onload=function(e){previewImg.src=e.target.result;placeholder.style.display='none';preview.style.display='block';};
            reader.readAsDataURL(_fbFile);
        }
    });
    document.getElementById('feedbackRemoveImg').addEventListener('click',function(e){
        e.stopPropagation();_fbFile=null;fileInput.value='';preview.style.display='none';placeholder.style.display='';
    });
    document.getElementById('feedbackSendBtn').addEventListener('click',async function(){
        var subj=document.getElementById('feedbackSubject').value.trim();
        var body=document.getElementById('feedbackBody').value.trim();
        if(!subj&&!body){document.getElementById('feedbackSubject').style.borderColor='#e74c3c';document.getElementById('feedbackBody').style.borderColor='#e74c3c';return;}
        var btn=document.getElementById('feedbackSendBtn');
        btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Sending...';
        try{
            var screenshotUrl='';
            if(_fbFile){
                try{
                    var ext=_fbFile.name.split('.').pop()||'png';
                    var path='feedback/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
                    screenshotUrl=await sbUploadFile('posts',path,_fbFile);
                }catch(ue){console.error('Screenshot upload failed:',ue);}
            }
            var msg=body;
            if(screenshotUrl) msg+='\n\nScreenshot: '+screenshotUrl;
            if(state.user) msg+='\n\nUser: '+state.user.email+' ('+state.user.id+')';
            var res=await fetch('https://formsubmit.co/ajax/hello@blipvibe.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:subj||'Feedback from BlipVibe',message:msg,_template:'table'})});
            if(res.ok){closeModal();showToast('Feedback sent! Thank you.');}
            else{btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane" style="margin-right:6px;"></i>Submit';showToast('Failed to send. Please try again.');}
        }catch(e){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane" style="margin-right:6px;"></i>Submit';showToast('Network error. Please try again.');}
    });
}

// ======================== GENERATE FEED (100 POSTS) ========================
var feedPosts=[];
var activeFeedTab='following';

// ======================== INLINE MEDIA EMBED HELPER ========================
var _tiktokScriptLoaded=false;
function _loadTikTokEmbed(){
    if(!_cookieConsent) return;
    if(_tiktokScriptLoaded) { if(window.tiktokEmbed&&tiktokEmbed.lib) tiktokEmbed.lib.render(); return; }
    _tiktokScriptLoaded=true;
    var s=document.createElement('script');s.src='https://www.tiktok.com/embed.js';s.async=true;document.body.appendChild(s);
}
var _twitterScriptLoaded=false;
function _loadTwitterEmbed(){
    if(!_cookieConsent) return;
    if(_twitterScriptLoaded) { if(window.twttr&&twttr.widgets) twttr.widgets.load(); return; }
    _twitterScriptLoaded=true;
    var s=document.createElement('script');s.src='https://platform.twitter.com/widgets.js';s.async=true;document.body.appendChild(s);
}
var _instagramScriptLoaded=false;
function _loadInstagramEmbed(){
    if(!_cookieConsent) return;
    if(_instagramScriptLoaded) { if(window.instgrm&&instgrm.Embeds) instgrm.Embeds.process(); return; }
    _instagramScriptLoaded=true;
    var s=document.createElement('script');s.src='https://www.instagram.com/embed.js';s.async=true;document.body.appendChild(s);
}
function _reloadThirdPartyEmbeds(url){}
function _embedConsentPlaceholder(url,label,cls,mini){
    return '<div class="'+cls+'" style="margin:10px auto 0;max-width:560px;border-radius:8px;overflow:hidden;background:#f0f0f0;padding:20px;text-align:center;aspect-ratio:auto;position:static;"><p style="color:#666;font-size:13px;margin-bottom:8px;"><i class="fas fa-cookie-bite" style="margin-right:6px;"></i>'+escapeHtml(label)+' content blocked</p><p style="font-size:12px;color:#999;margin-bottom:10px;">Accept cookies to view embedded content</p><button class="btn btn-primary embed-consent-btn" style="font-size:12px;padding:6px 16px;" data-url="'+escapeHtml(url)+'">Allow &amp; Load</button></div>';
}
function getVideoEmbedHtml(url, mini){
    if(!url) return null;
    var id, m;
    var cls='video-embed'+(mini?' video-embed-mini':'');
    var socialCls='social-embed'+(mini?' social-embed-mini':'');
    // YouTube: watch, short, embed, youtu.be
    m=url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(m){ id=m[1]; if(!_cookieConsent) return _embedConsentPlaceholder(url,'YouTube',cls,mini);
        var isMobile=/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(isMobile){
            // Thumbnail + play button on mobile (avoids YouTube bot check)
            var thumbUrl='https://img.youtube.com/vi/'+id+'/hqdefault.jpg';
            return '<div class="'+cls+'" style="position:relative;cursor:pointer;" data-yt-id="'+id+'"><img src="'+thumbUrl+'" style="width:100%;border-radius:8px;display:block;" alt="YouTube video"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;background:rgba(255,0,0,.9);border-radius:16px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-play" style="color:#fff;font-size:24px;margin-left:4px;"></i></div></div>';
        }
        return '<div class="'+cls+'"><iframe src="https://www.youtube-nocookie.com/embed/'+id+'?enablejsapi=1" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>';
    }
    // Vimeo
    m=url.match(/vimeo\.com\/(\d+)/);
    if(m){ id=m[1]; if(!_cookieConsent) return _embedConsentPlaceholder(url,'Vimeo',cls,mini); return '<div class="'+cls+'"><iframe src="https://player.vimeo.com/video/'+id+'?api=1" frameborder="0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe></div>'; }
    // TikTok: let oEmbed API handle link preview (blockquote + embed.js unreliable)
    // Twitter / X: let Microlink handle link preview (widgets.js blockquote approach unreliable)
    // Instagram: posts, reels, TV (iframe embed — more reliable on mobile than blockquote SDK)
    m=url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if(m){ var igType=m[1]; id=m[2]; if(!_cookieConsent) return _embedConsentPlaceholder(url,'Instagram',socialCls,mini); var igUrl='https://www.instagram.com/'+igType+'/'+id+'/embed/captioned/'; return '<div class="'+socialCls+'" style="max-width:400px;overflow:hidden;border-radius:8px;"><iframe src="'+igUrl+'" width="100%" height="'+(mini?'350':'520')+'" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen style="display:block;width:100%;border:0;border-radius:8px;background:#fff;"></iframe></div>'; }
    // Spotify: tracks, albums, playlists, episodes, shows
    m=url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if(m){ var stype=m[1]; id=m[2]; if(!_cookieConsent) return _embedConsentPlaceholder(url,'Spotify',socialCls,mini); var sh=(stype==='track'||stype==='episode')?(mini?'80':'152'):(mini?'152':'352'); return '<div class="'+socialCls+'" style="max-width:560px;border-radius:12px;overflow:hidden;"><iframe src="https://open.spotify.com/embed/'+stype+'/'+id+'" width="100%" height="'+sh+'" frameborder="0" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy" style="display:block;width:100%;border-radius:12px;"></iframe></div>'; }
    // SoundCloud: any soundcloud.com URL (uses oEmbed widget)
    if(/soundcloud\.com\/.+\/.+/.test(url)){ if(!_cookieConsent) return _embedConsentPlaceholder(url,'SoundCloud',socialCls,mini); return '<div class="'+socialCls+'" style="max-width:560px;border-radius:8px;overflow:hidden;"><iframe width="100%" height="'+(mini?'120':'166')+'" scrolling="no" frameborder="0" allow="autoplay" src="https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false" style="display:block;width:100%;border-radius:8px;"></iframe></div>'; }
    // Direct video files
    if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)){ return '<div class="'+cls+'" style="margin:10px auto 0;max-width:560px;border-radius:8px;overflow:hidden;"><video src="'+url+'" controls playsinline preload="metadata" style="display:block;width:100%;border-radius:8px;max-height:'+(mini?'200px':'500px')+';background:#000;"></video></div>'; }
    return null;
}

// ======================== VIDEO AUTO-PLAY / PAUSE ON SCROLL ========================
// Respects settings.autoplay — when ON: pause off-screen, resume on-screen.
// When OFF: no auto-play/pause behavior (manual control only).
function pauseAllVideos(){
    document.querySelectorAll('video').forEach(function(v){if(!v.paused)try{v.pause();}catch(e){}});
    document.querySelectorAll('.video-embed iframe, .social-embed iframe').forEach(function(iframe){
        var src=iframe.src||'';
        if(src.indexOf('youtube')!==-1){try{iframe.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'*');}catch(e){}}
        else if(src.indexOf('vimeo')!==-1){try{iframe.contentWindow.postMessage(JSON.stringify({method:'pause'}),'*');}catch(e){}}
        else if(src && src!=='about:blank'){
            // Instagram, TikTok, Spotify, SoundCloud — blank src to stop
            if(!iframe.dataset.origSrc) iframe.dataset.origSrc=src;
            iframe.src='about:blank';
        }
    });
}
(function initVideoScrollObserver(){
    if(!('IntersectionObserver' in window)) return;
    // Pause an iframe: YouTube/Vimeo via postMessage, others by blanking src
    function pauseIframe(iframe){
        var src=iframe.src||'';
        if(src.indexOf('youtube')!==-1){
            try{iframe.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'*');}catch(e){}
        } else if(src.indexOf('vimeo')!==-1){
            try{iframe.contentWindow.postMessage(JSON.stringify({method:'pause'}),'*');}catch(e){}
        } else if(src){
            // Instagram, TikTok, Spotify, SoundCloud — no postMessage API
            // Save src and blank it to fully stop playback
            if(!iframe.dataset.origSrc) iframe.dataset.origSrc=src;
            iframe.src='about:blank';
        }
    }
    // Restore a previously blanked iframe
    function resumeIframe(iframe){
        if(iframe.dataset.origSrc){
            iframe.src=iframe.dataset.origSrc;
            delete iframe.dataset.origSrc;
        }
    }
    var observer = new IntersectionObserver(function(entries){
        if(!settings.autoplay) return; // autoplay off — don't interfere
        entries.forEach(function(entry){
            var el=entry.target;
            if(entry.isIntersecting){
                // Resume HTML5 video (muted so browsers allow it)
                var vid=el.querySelector('video');
                if(vid && vid.paused && vid.dataset.wasPlaying==='1'){
                    vid.muted=true;
                    try{vid.play();}catch(e){}
                }
                // Restore blanked iframes
                el.querySelectorAll('iframe').forEach(function(f){resumeIframe(f);});
            } else {
                // Pause everything when scrolled away
                var vid=el.querySelector('video');
                if(vid && !vid.paused){
                    vid.dataset.wasPlaying='1';
                    vid.pause();
                }
                el.querySelectorAll('iframe').forEach(function(f){pauseIframe(f);});
            }
        });
    }, {threshold:0.25});
    function observeNewEmbeds(){
        // Video + social embeds (YouTube, Vimeo, Instagram, TikTok, Spotify, SoundCloud, direct files)
        document.querySelectorAll('.video-embed:not([data-vobs]), .social-embed:not([data-vobs])').forEach(function(el){
            el.setAttribute('data-vobs','1');
            observer.observe(el);
        });
        // Standalone <video> in post media grids (uploaded videos)
        document.querySelectorAll('video[controls]:not([data-vobs])').forEach(function(vid){
            if(vid.closest('[data-vobs]')) return; // already observed via parent
            vid.setAttribute('data-vobs','1');
            // Wrap observation on the video's parent thumb/container
            var wrap=vid.closest('.pm-thumb')||vid.parentElement;
            if(wrap && !wrap.getAttribute('data-vobs')){
                wrap.setAttribute('data-vobs','1');
                observer.observe(wrap);
            }
        });
    }
    // MutationObserver to auto-watch new embeds as they appear in the DOM
    var mo=new MutationObserver(observeNewEmbeds);
    mo.observe(document.body,{childList:true,subtree:true});
    observeNewEmbeds();
})();

// ======================== POLL RENDERING ========================
function renderPollInPost(text,postId){
    var match=text.match(/\[poll\](.*?)\[\/poll\]/);
    if(!match) return {text:text,pollHtml:''};
    var cleanText=text.replace(/\n?\[poll\].*?\[\/poll\]/,'').trim();
    var poll;
    try{poll=JSON.parse(match[1]);}catch(e){return {text:cleanText,pollHtml:''};}
    if(!poll||!poll.options) return {text:cleanText,pollHtml:''};
    // Check if user already voted (stored in localStorage)
    var voteKey='blipvibe_poll_'+postId;
    var myVote=null;
    try{myVote=localStorage.getItem(voteKey);}catch(e){}
    var voted=myVote!==null;
    // Get vote counts from localStorage (shared across users on same device for now)
    var votesKey='blipvibe_pollvotes_'+postId;
    var votes={};var totalVotes=0;
    try{var stored=JSON.parse(localStorage.getItem(votesKey)||'{}');votes=stored.votes||{};totalVotes=stored.total||0;}catch(e){}
    var h='<div class="poll-container" data-postid="'+postId+'">';
    poll.options.forEach(function(opt,i){
        var count=votes[i]||0;
        var pct=totalVotes>0?Math.round((count/totalVotes)*100):0;
        var isMyVote=myVote===String(i);
        if(voted){
            h+='<div class="poll-option poll-voted'+(isMyVote?' poll-my-vote':'')+'">';
            h+='<div class="poll-bar" style="width:'+pct+'%;"></div>';
            h+='<span class="poll-label">'+escapeHtml(opt)+'</span>';
            h+='<span class="poll-pct">'+pct+'%</span>';
            h+='</div>';
        } else {
            h+='<button class="poll-option poll-vote-btn" data-optidx="'+i+'" data-postid="'+postId+'">';
            h+='<span class="poll-label">'+escapeHtml(opt)+'</span>';
            h+='</button>';
        }
    });
    h+='<div class="poll-footer">'+totalVotes+' vote'+(totalVotes!==1?'s':'')+'</div>';
    h+='</div>';
    return {text:cleanText,pollHtml:h};
}

function bindPollVotes(containerSel){
    $$(containerSel+' .poll-vote-btn').forEach(function(btn){
        if(btn._pollBound) return; btn._pollBound=true;
        btn.addEventListener('click',function(){
            var postId=btn.dataset.postid;
            var optIdx=btn.dataset.optidx;
            // Save vote
            try{localStorage.setItem('blipvibe_poll_'+postId,optIdx);}catch(e){}
            // Update counts
            var votesKey='blipvibe_pollvotes_'+postId;
            var stored={};
            try{stored=JSON.parse(localStorage.getItem(votesKey)||'{}');}catch(e){}
            if(!stored.votes) stored.votes={};
            stored.votes[optIdx]=(stored.votes[optIdx]||0)+1;
            stored.total=(stored.total||0)+1;
            try{localStorage.setItem(votesKey,JSON.stringify(stored));}catch(e){}
            // Re-render the poll
            var container=btn.closest('.poll-container');
            if(container){
                var feedPost=container.closest('.feed-post');
                if(feedPost){
                    var pid=feedPost.querySelector('.like-btn');
                    var postIdStr=pid?pid.getAttribute('data-post-id'):postId;
                    var fp=feedPosts.find(function(p){return p.idx===postIdStr;});
                    if(fp){
                        var result=renderPollInPost(fp.text,fp.idx);
                        container.outerHTML=result.pollHtml;
                    }
                }
            }
        });
    });
}

function buildMediaGrid(imgs){
    if(!imgs||!imgs.length) return '';
    var pid='pg-'+Date.now()+'-'+Math.random().toString(36).substr(2,5);
    var cnt=Math.min(imgs.length,5);
    var h='<div class="post-media-grid pm-count-'+cnt+'" data-pgid="'+pid+'">';
    var shown=imgs.slice(0,5);var extra=imgs.length-5;
    shown.forEach(function(src,i){
        var isVid=isVideoUrl(src);
        var inner=isVid
            ?'<video src="'+src+'#t=0.5" preload="metadata" muted playsinline></video><div class="pm-play-overlay"><i class="fas fa-play"></i></div>'
            :'<img src="'+src+'" alt="Post photo">';
        if(i===4&&extra>0){
            h+='<div class="pm-thumb pm-more" data-pgid="'+pid+'">'+inner+'<div class="pm-more-overlay">+'+extra+'</div></div>';
        } else {
            h+='<div class="pm-thumb">'+inner+'</div>';
        }
    });
    h+='</div>';
    window['_media_'+pid]=imgs.map(function(s){return {type:isVideoUrl(s)?'video':'image',src:s};});
    return h;
}
// ======================== INFINITE SCROLL ========================
var _feedOffset=0;
var _feedLimit=20;
var _feedLoading=false;
var _feedHasMore=true;
function _initInfiniteScroll(){
    var _infScrollRAF=null;
    window.addEventListener('scroll',function(){
        if(_infScrollRAF) return;
        _infScrollRAF=requestAnimationFrame(function(){
            _infScrollRAF=null;
            if(_feedLoading||!_feedHasMore) return;
            if(_navCurrent!=='home') return;
            var scrollBottom=window.innerHeight+window.scrollY;
            var docHeight=document.documentElement.scrollHeight;
            if(scrollBottom>=docHeight-600){
                _loadMorePosts();
            }
        });
    },{passive:true});
}
async function _loadMorePosts(){
    if(_feedLoading||!_feedHasMore) return;
    _feedLoading=true;
    var container=$('#feedContainer');
    var loader=document.createElement('div');
    loader.className='feed-load-more';
    loader.innerHTML='<i class="fas fa-spinner fa-spin"></i>';
    container.appendChild(loader);
    try{
        var posts=await sbGetFeed(_feedLimit,_feedOffset);
        if(!posts||posts.length<_feedLimit) _feedHasMore=false;
        if(posts&&posts.length){
            // Fetch shared post data
            var sharedIds=[];
            posts.forEach(function(p){if(p.shared_post_id)sharedIds.push(p.shared_post_id);});
            var sharedMap={};
            if(sharedIds.length){try{var sp=await sbGetPostsByIds(sharedIds);sp.forEach(function(s){sharedMap[s.id]=s;});}catch(e){}}
            var newFeedPosts=[];
            posts.forEach(function(p){
                if(!p||!p.author) return;
                if(feedPosts.some(function(fp){return fp.idx===p.id;})) return;
                var fp=_buildFeedPost(p,sharedMap);
                feedPosts.push(fp);
                newFeedPosts.push(fp);
            });
            _feedOffset+=posts.length;
            // Filter new posts by active tab before appending to DOM
            var filtered=_filterPostsByTab(newFeedPosts,activeFeedTab);
            if(activeFeedTab==='discover'){
                // Sort discover posts by engagement
                filtered.sort(function(a,b){return ((b.likes||0)+(b.commentCount||0))-((a.likes||0)+(a.commentCount||0));});
            }
            if(filtered.length) _appendFeedPosts(filtered);
        }
        if(!_feedHasMore){
            var endMsg=document.createElement('div');
            endMsg.className='feed-end-msg';
            endMsg.textContent='You\'ve reached the end!';
            container.appendChild(endMsg);
        }
    }catch(e){console.error('Load more posts:',e);}
    _feedLoading=false;
    if(loader.parentNode) loader.remove();
}
function _buildFeedPost(p,sharedMap){
    var fp={
        idx:p.id,
        person:{id:p.author.id,name:p.author.display_name||p.author.username||'User',img:null,avatar_url:p.author.avatar_url},
        text:p.content||'',tags:[],badge:null,loc:p.location||null,
        likes:p.like_count||0,comments:[],
        commentCount:(p.comments&&p.comments[0])?p.comments[0].count:0,
        shares:p.share_count||0,images:p.media_urls&&p.media_urls.length?p.media_urls:(p.image_url?[p.image_url]:null),
        created_at:p.created_at
    };
    if(p.shared_post_id&&sharedMap&&sharedMap[p.shared_post_id]){
        var sp=sharedMap[p.shared_post_id];
        fp.sharedPost={authorId:sp.author?sp.author.id:null,name:sp.author?(sp.author.display_name||sp.author.username):'User',avatar_url:sp.author?sp.author.avatar_url:null,text:sp.content||'',time:timeAgoReal(sp.created_at),images:sp.media_urls&&sp.media_urls.length?sp.media_urls:(sp.image_url?[sp.image_url]:null)};
        fp.badge={cls:'badge-green',icon:'fa-share',text:'Shared'};
    }
    return fp;
}
function _appendFeedPosts(newPosts){
    var container=$('#feedContainer');
    newPosts.forEach(function(p){
        if(!p) return;
        var div=document.createElement('div');
        div.innerHTML=_buildPostHtml(p);
        var card=div.firstChild;
        if(card) container.appendChild(card);
    });
    bindPostEvents();
    bindMentionClicks('#feedContainer');
    bindHashtagClicks('#feedContainer');
    bindPollVotes('#feedContainer');
    autoFetchLinkPreviews(container);
    initViewTracking();
    newPosts.forEach(function(p){if(p) renderInlineComments(p.idx);});
}
_initInfiniteScroll();

async function generatePosts(){
    feedPosts=[];
    _feedOffset=0;_feedHasMore=true;
    // Try cached feed for instant render while fresh data loads
    var cached=loadCachedFeed();
    if(cached&&cached.length){
        feedPosts=cached;
        renderFeed(activeFeedTab);
    } else {
        showFeedSkeleton();
    }
    try {
        // Always load all public posts; tab filtering happens in renderFeed
        var posts = await sbGetFeed(50);
        // Fetch shared post data in batch
        var sharedIds=[];
        posts.forEach(function(p){if(p.shared_post_id)sharedIds.push(p.shared_post_id);});
        var sharedMap={};
        if(sharedIds.length){
            try{
                var sharedPosts=await sbGetPostsByIds(sharedIds);
                sharedPosts.forEach(function(sp){sharedMap[sp.id]=sp;});
            }catch(e){console.warn('Could not load shared posts:',e);}
        }
        // Clear cached/stale data before adding fresh posts
        feedPosts=[];
        posts.forEach(function(p,i){
            if(!p||!p.author) return;
            var fp=_buildFeedPost(p,sharedMap);
            feedPosts.push(fp);
        });
        _feedOffset=posts.length;
        if(posts.length<_feedLimit) _feedHasMore=false;
    } catch(e) {
        console.error('generatePosts error:', e);
        showToast('Feed error: ' + (e.message || 'Could not load posts'));
    }
    renderFeed(activeFeedTab);
    cacheFeedData();
}
// Filter posts by the active feed tab — used by both renderFeed and infinite scroll
function _filterPostsByTab(posts,tab){
    if(tab==='myposts'){
        return posts.filter(function(p){return currentUser&&p.person.id===currentUser.id&&!hiddenPosts[p.idx];});
    } else if(tab==='following'){
        return posts.filter(function(p){return (state.followedUsers[p.person.id]||(currentUser&&p.person.id===currentUser.id))&&!hiddenPosts[p.idx]&&!blockedUsers[p.person.id]&&!mutedUsers[p.person.id];});
    } else {
        // Discover: non-followed, non-self, non-blocked/muted
        return posts.filter(function(p){
            return currentUser&&p.person.id!==currentUser.id&&!state.followedUsers[p.person.id]&&!hiddenPosts[p.idx]&&!blockedUsers[p.person.id]&&!mutedUsers[p.person.id];
        });
    }
}
var _discoverLoaded=false;
async function _loadDiscoverPosts(){
    try{
        // Fetch more posts from DB to find non-followed content
        var posts=await sbGetFeed(100,0);
        if(!posts||!posts.length) return;
        var sharedIds=[];
        posts.forEach(function(p){if(p.shared_post_id)sharedIds.push(p.shared_post_id);});
        var sharedMap={};
        if(sharedIds.length){try{var sp=await sbGetPostsByIds(sharedIds);sp.forEach(function(s){sharedMap[s.id]=s;});}catch(e){}}
        posts.forEach(function(p){
            if(!p||!p.author) return;
            if(feedPosts.some(function(fp){return fp.idx===p.id;})) return; // skip dupes
            var fp=_buildFeedPost(p,sharedMap);
            feedPosts.push(fp);
        });
    }catch(e){console.warn('Discover load error:',e);}
}
function getFollowingIds(){
    var ids={};
    if(currentUser) ids[currentUser.id]=true; // include own posts
    Object.keys(state.followedUsers).forEach(function(k){ids[k]=true;});
    return ids;
}
function _buildPostHtml(p){
    var i=p.idx,person=p.person,text=p.text,tags=p.tags||[],badge=p.badge,loc=p.loc,likes=p.likes,genComments=p.comments||[],shares=p.shares;
    var commentCount=p.commentCount||genComments.length;
    var menuId='post-menu-'+i;
    var pollResult=renderPollInPost(text,i);
    text=pollResult.text;var pollHtml=pollResult.pollHtml;
    var _ws=safeWordSplit(text,160);var short=renderRichText(renderMentionsInText(escapeHtmlNl(_ws[0])));var rest=_ws[1]?renderRichText(renderMentionsInText(escapeHtmlNl(_ws[1]))):'';var hasMore=rest.length>0;
    var avatarSrc=person.avatar_url||'images/default-avatar.svg';
    var timeStr=p.created_at?timeAgoReal(p.created_at):timeAgo(typeof i==='number'?i:0);
    var html='<div class="card feed-post">';
    html+='<div class="post-header">';
    html+='<img src="'+avatarSrc+'" alt="'+escapeHtml(person.name)+'" class="post-avatar" data-person-id="'+person.id+'">';
    html+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username" data-person-id="'+person.id+'">'+escapeHtml(person.name)+'</h4><span class="post-time">'+timeStr+'</span></div>';
    var badgesHtml='';
    if(badge) badgesHtml+='<span class="badge '+badge.cls+'"><i class="fas '+badge.icon+'"></i> '+badge.text+'</span>';
    var hideMyLoc=currentUser&&person.id===currentUser.id&&!settings.showLocation;
    if(loc&&!hideMyLoc) badgesHtml+='<span class="badge badge-blue"><i class="fas fa-map-marker-alt"></i> '+escapeHtml(loc)+'</span>';
    if(badgesHtml) html+='<div class="post-badges">'+badgesHtml+'</div>';
    html+='</div>';
    html+='<button class="post-menu-btn" data-menu="'+menuId+'"><i class="fas fa-ellipsis-h"></i></button>';
    var isOwnPost=currentUser&&person.id===currentUser.id;
    html+='<div class="post-dropdown" id="'+menuId+'"><a href="#" data-action="save" data-pid="'+i+'"><i class="fas fa-bookmark"></i> Save Post</a><a href="#" data-action="copylink" data-pid="'+i+'"><i class="fas fa-link"></i> Copy Link</a><a href="#" data-action="quote" data-pid="'+i+'"><i class="fas fa-quote-left"></i> Quote Post</a><a href="#" data-action="report" data-pid="'+i+'"><i class="fas fa-flag"></i> Report</a><a href="#" data-action="hide" data-pid="'+i+'"><i class="fas fa-eye-slash"></i> Hide</a>';
    if(isOwnPost) html+='<a href="#" data-action="pin" data-pid="'+i+'"><i class="fas fa-thumbtack"></i> '+(state.pinnedPosts&&state.pinnedPosts[i]?'Unpin':'Pin to Profile')+'</a><a href="#" data-action="edit" data-pid="'+i+'"><i class="fas fa-pen"></i> Edit</a><a href="#" data-action="delete" data-pid="'+i+'" style="color:#e74c3c;"><i class="fas fa-trash"></i> Delete</a>';
    html+='</div></div>';
    html+='<div class="post-description"><p>'+short+(hasMore?'<span class="view-more-text hidden">'+rest+'</span>':'')+(hasMore?' . . . <button class="view-more-btn">View More</button>':'')+'</p></div>';
    if(pollHtml) html+=pollHtml;
    html+='<div class="post-tags">';tags.forEach(function(t){html+='<span class="skill-tag">'+t+'</span>';});html+='</div>';
    html+=buildMediaGrid(p.images);
    if(p.sharedPost){var sp=p.sharedPost;var spAvatar=sp.avatar_url||DEFAULT_AVATAR;var spClickAttr=sp.authorId?' data-person-id="'+sp.authorId+'"':'';
        html+='<div class="share-preview" style="margin:0 20px 14px;">';
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><img src="'+spAvatar+'" class="shared-post-author"'+spClickAttr+' style="width:28px;height:28px;border-radius:50%;object-fit:cover;cursor:pointer;"><strong class="share-preview-name shared-post-author"'+spClickAttr+' style="font-size:13px;cursor:pointer;">'+escapeHtml(sp.name)+'</strong><span class="share-preview-time" style="font-size:12px;">'+sp.time+'</span></div>';
        html+='<div class="share-preview-text" style="font-size:13px;">'+escapeHtmlNl(sp.text)+'</div>';
        if(sp.images&&sp.images.length) html+=buildMediaGrid(sp.images);
        html+='</div>';
    }
    html+='<div class="post-actions"><div class="action-left">';
    html+='<button class="action-btn like-btn'+(state.likedPosts[i]?' liked':'')+'" data-post-id="'+i+'"><i class="'+(state.likedPosts[i]?'fas':'far')+' fa-thumbs-up"></i><span class="like-count">'+likes+'</span></button>';
    html+='<button class="action-btn dislike-btn" data-post-id="'+i+'"><i class="'+(state.dislikedPosts[i]?'fas':'far')+' fa-thumbs-down"></i><span class="dislike-count">0</span></button>';
    var myReaction=_postReactions[i];
    html+='<button class="action-btn react-btn" data-post-id="'+i+'" title="React">'+(myReaction?'<span style="font-size:16px;">'+myReaction+'</span>':'<i class="far fa-face-smile"></i>')+'</button>';
    html+='<button class="action-btn comment-btn"><i class="far fa-comment"></i><span>'+commentCount+'</span></button>';
    html+='<button class="action-btn share-btn"><i class="fas fa-share-from-square"></i><span>'+shares+'</span></button>';
    var vc=_postViews[i]||0;
    html+='<button class="action-btn view-count-btn" style="cursor:default;opacity:.6;"><i class="far fa-eye"></i><span>'+vc+'</span></button>';
    html+='</div><div class="action-right"><div class="liked-avatars" data-post-id="'+i+'"></div></div></div>';
    html+='<div class="post-comments" data-post-id="'+i+'"></div></div>';
    return html;
}
function renderFeed(tab){
    activeFeedTab=tab;
    var posts=_filterPostsByTab(feedPosts,tab);
    if(tab==='discover'){
        // If not enough discover posts in loaded feed, trigger a background fetch
        if(posts.length<5&&!_discoverLoaded){
            _discoverLoaded=true;
            _loadDiscoverPosts().then(function(){renderFeed('discover');});
        }
        // Sort by engagement (likes + comments) descending — trending posts first
        posts.sort(function(a,b){return ((b.likes||0)+(b.commentCount||0))-((a.likes||0)+(a.commentCount||0));});
    }
    var container=$('#feedContainer');
    if(!posts.length){
        var emptyMsg=tab==='myposts'?'You haven\'t posted anything yet!':tab==='discover'?'No new posts to discover right now. Check back later!':'No posts yet. Be the first to post!';
        var emptyIcon=tab==='myposts'?'fa-user':tab==='discover'?'fa-compass':'fa-pen';
        container.innerHTML='<div class="card" style="padding:40px;text-align:center;color:var(--gray);"><i class="fas '+emptyIcon+'" style="font-size:32px;margin-bottom:12px;display:block;"></i><p>'+emptyMsg+'</p></div>';
        $$('#feedTabs .search-tab').forEach(function(t){t.classList.toggle('active',t.dataset.feedtab===tab);});
        return;
    }
    var html='';
    posts.forEach(function(p){ html+=_buildPostHtml(p); });
    container.innerHTML=html;
    bindPostEvents();
    bindMentionClicks('#feedContainer');
    bindHashtagClicks('#feedContainer');
    bindPollVotes('#feedContainer');
    autoFetchLinkPreviews(container);
    initViewTracking();
    posts.forEach(function(p){renderInlineComments(p.idx);});
    // Load liker avatars asynchronously for Supabase posts
    posts.forEach(function(p){
        if(/^[0-9a-f]{8}-/.test(p.idx)){
            sbGetLikers('post',p.idx,3).then(function(likers){
                var avatarEl=container.querySelector('.liked-avatars[data-post-id="'+p.idx+'"]');
                if(avatarEl&&likers&&likers.length){
                    var h='';
                    likers.forEach(function(l){h+='<img src="'+(l.avatar_url||DEFAULT_AVATAR)+'" alt="'+(l.display_name||l.username||'User')+'" style="object-fit:cover;">';});
                    avatarEl.innerHTML=h;
                }
            }).catch(function(){});
        }
    });
    // Update tab active state
    $$('#feedTabs .search-tab').forEach(function(t){t.classList.toggle('active',t.dataset.feedtab===tab);});
}
// Feed tab clicks
document.getElementById('feedTabs').addEventListener('click',function(e){
    var tab=e.target.closest('[data-feedtab]');
    if(tab&&tab.dataset.feedtab!==activeFeedTab) {
        renderFeed(tab.dataset.feedtab);
    }
});

function bindPostEvents(){
    var _fc=document.getElementById('feedContainer');
    function _$$(sel){return Array.from(_fc.querySelectorAll(sel));}
    // Like buttons (Supabase-backed for UUID post IDs, local for legacy numeric IDs)
    _$$('.like-btn').forEach(function(btn){
        btn.addEventListener('click', async function(e){
            var postId=btn.getAttribute('data-post-id');
            var countEl=btn.querySelector('.like-count');
            var count=parseInt(countEl.textContent);
            var had=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);

            // If this is a UUID (Supabase post), call Supabase toggle
            var isUUID = /^[0-9a-f]{8}-/.test(postId);
            if(isUUID && currentUser) {
                // Clear dislike if active
                if(state.dislikedPosts[postId]){
                    var db=btn.closest('.action-left').querySelector('.dislike-btn');
                    if(db){var dc=db.querySelector('.dislike-count');dc.textContent=Math.max(0,parseInt(dc.textContent)-1);db.classList.remove('disliked');db.querySelector('i').className='far fa-thumbs-down';}
                    delete state.dislikedPosts[postId];
                }
                try {
                    var nowLiked = await sbToggleLike(currentUser.id, 'post', postId);
                    if(nowLiked) {
                        state.likedPosts[postId]=true;
                        btn.classList.add('liked');
                        btn.querySelector('i').className='fas fa-thumbs-up';
                        countEl.textContent=count+1;
                        animateLikeBtn(btn);
                        showCoinEarnAnimation(btn,1);
                        trackQuestProgress('like');
                        // Notify post author
                        var fp=feedPosts.find(function(x){return x.idx===postId;});
                        if(fp&&fp.person&&fp.person.id&&fp.person.id!==currentUser.id){
                            var myName=currentUser.display_name||currentUser.username||'Someone';
                            sbCreateNotification(fp.person.id,'like',myName+' liked your post','',{originalType:'like',post_id:postId}).catch(function(e){console.error('Like notif error:',e);});
                        }
                    } else {
                        delete state.likedPosts[postId];
                        btn.classList.remove('liked');
                        btn.querySelector('i').className='far fa-thumbs-up';
                        countEl.textContent=Math.max(0,count-1);
                    }
                } catch(err) { console.error('Like error:', err); }
            } else {
                // Legacy local like
                if(state.likedPosts[postId]){
                    delete state.likedPosts[postId];
                    btn.classList.remove('liked');
                    btn.querySelector('i').className='far fa-thumbs-up';
                    countEl.textContent=Math.max(0,count-1);
                } else {
                    if(state.dislikedPosts[postId]){var db=btn.closest('.action-left').querySelector('.dislike-btn');var dc=db.querySelector('.dislike-count');dc.textContent=Math.max(0,parseInt(dc.textContent)-1);delete state.dislikedPosts[postId];db.classList.remove('disliked');db.querySelector('i').className='far fa-thumbs-down';}
                    state.likedPosts[postId]=true;
                    btn.classList.add('liked');
                    btn.querySelector('i').className='fas fa-thumbs-up';
                    countEl.textContent=count+1;
                }
            }
            var has=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
            if(!isOwnPost(postId)){if(!had&&has&&_incrementDailyCoin('postLikes')){state.coins++;updateCoins();showCoinEarnAnimation(btn,1);}else if(had&&!has){state.coins--;updateCoins();showCoinEarnAnimation(btn,-1);}}
        });
    });

    // Dislike buttons
    _$$('.dislike-btn').forEach(function(btn){
        btn.addEventListener('click', async function(){
            var postId=btn.getAttribute('data-post-id');
            var countEl=btn.querySelector('.dislike-count');
            var count=parseInt(countEl.textContent);
            var had=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
            if(state.dislikedPosts[postId]){
                delete state.dislikedPosts[postId];
                btn.classList.remove('disliked');
                btn.querySelector('i').className='far fa-thumbs-down';
                countEl.textContent=Math.max(0,count-1);
            } else {
                // Clear like if active
                if(state.likedPosts[postId]){
                    var lb=btn.closest('.action-left').querySelector('.like-btn');var lc=lb.querySelector('.like-count');lc.textContent=Math.max(0,parseInt(lc.textContent)-1);delete state.likedPosts[postId];lb.classList.remove('liked');lb.querySelector('i').className='far fa-thumbs-up';
                    // Remove Supabase like
                    var isUUID=/^[0-9a-f]{8}-/.test(postId);
                    if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',postId);}catch(e){}}
                }
                state.dislikedPosts[postId]=true;
                btn.classList.add('disliked');
                btn.querySelector('i').className='fas fa-thumbs-down';
                countEl.textContent=count+1;
            }
            var has=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
            if(!isOwnPost(postId)){if(!had&&has&&_incrementDailyCoin('postLikes')){state.coins++;updateCoins();showCoinEarnAnimation(btn,1);}else if(had&&!has){state.coins--;updateCoins();showCoinEarnAnimation(btn,-1);}}
        });
    });

    // View more
    _$$('.view-more-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.preventDefault();e.stopPropagation();
            var span=btn.closest('p').querySelector('.view-more-text');
            if(!span) return;
            if(span.classList.contains('hidden')){span.classList.remove('hidden');btn.textContent='View Less';}
            else{span.classList.add('hidden');btn.textContent='View More';}
        });
    });

    // Shared post author click — navigate to their profile
    _$$('.shared-post-author').forEach(function(el){
        el.addEventListener('click',async function(){
            var uid=el.getAttribute('data-person-id');
            if(!uid) return;
            try{var p=await sbGetProfile(uid);if(p) showProfileView(profileToPerson(p));}catch(e){}
        });
    });

    // Post menus
    _$$('.post-menu-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var menuId=btn.getAttribute('data-menu');
            var menu=document.getElementById(menuId);
            _$$('.post-dropdown.show').forEach(function(m){if(m!==menu)m.classList.remove('show');});
            menu.classList.toggle('show');
        });
    });

    // Post menu actions
    _$$('.post-dropdown a').forEach(function(a){
        a.addEventListener('click',function(e){
            e.preventDefault();
            a.closest('.post-dropdown').classList.remove('show');
            var pid=a.dataset.pid;
            var action=a.dataset.action;
            if(action==='save') showSaveModal(pid);
            else if(action==='copylink') copyPostLink(pid);
            else if(action==='report') showReportModal(pid);
            else if(action==='hide') hidePost(pid);
            else if(action==='quote') showQuotePostModal(pid);
            else if(action==='pin') togglePinPost(pid);
            else if(action==='edit') showEditPostModal(pid);
            else if(action==='delete') confirmDeletePost(pid);
        });
    });

    // Click username/avatar to view profile
    _$$('.post-username, .post-avatar').forEach(function(el){
        el.addEventListener('click',async function(){
            var uid=el.getAttribute('data-person-id');
            if(!uid) return;
            try{var p=await sbGetProfile(uid);if(p)showProfileView(profileToPerson(p));}catch(e){}
        });
    });

    // Comment buttons
    _$$('.comment-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var postId=btn.closest('.action-left').querySelector('.like-btn').getAttribute('data-post-id');
            showComments(postId,btn.querySelector('span'));
        });
    });

    // Share buttons
    _$$('.share-btn').forEach(function(btn){btn.addEventListener('click',function(){handleShare(btn);});});

    // Emoji reaction buttons
    _$$('.react-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var postId=btn.getAttribute('data-post-id');
            showReactionPicker(postId,btn);
        });
    });

    // Tag clicks
    _$$('.skill-tag').forEach(function(tag){
        tag.addEventListener('click',function(){
            showModal('<div class="modal-header"><h3>'+tag.textContent+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;color:#777;">Showing all posts tagged with '+tag.textContent+'</p></div>');
        });
    });

    // Like count click to show likers
    bindLikeCountClicks('#feedContainer');
}

async function showLikersModal(postId){
    var isUUID=/^[0-9a-f]{8}-/.test(postId);
    var likers=[];
    if(isUUID){
        try{likers=await sbGetLikers('post',postId,50);}catch(e){console.error('Load likers:',e);}
    }
    if(!likers||likers.length===0){
        showModal('<div class="modal-header"><h3><i class="fas fa-thumbs-up" style="color:var(--primary);margin-right:8px;"></i>Liked by</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:#777;text-align:center;">No likes yet.</p></div>');
        return;
    }
    var h='<div class="modal-header"><h3><i class="fas fa-thumbs-up" style="color:var(--primary);margin-right:8px;"></i>Liked by</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><ul class="follow-list" style="max-height:400px;overflow-y:auto;">';
    likers.forEach(function(p){
        var name=p.display_name||p.username||'User';
        var avatar=p.avatar_url||DEFAULT_AVATAR;
        h+='<li class="follow-list-item"><img src="'+avatar+'" alt="'+name+'" style="object-fit:cover;"><div class="follow-list-info"><h4>'+name+'</h4></div></li>';
    });
    h+='</ul></div>';
    showModal(h);
}

function bindLikeCountClicks(containerSelector){
    var container=document.querySelector(containerSelector);
    if(!container) return;
    container.querySelectorAll('.like-count').forEach(function(el){
        el.addEventListener('click',function(e){
            e.stopPropagation();
            var postId=el.closest('.like-btn').getAttribute('data-post-id');
            showLikersModal(postId);
        });
    });
}

// Helper: fetch X/Twitter link preview via FxTwitter API (returns true if URL is X, false otherwise)
function _fetchXPreview(url, onResult, mini){
    var xm=url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i);
    if(!xm) return false;
    fetch('https://api.fxtwitter.com/status/'+xm[1])
        .then(function(r){return r.json();})
        .then(function(data){
            if(!data.tweet){onResult(null);return;}
            var t=data.tweet;
            var cls=mini?'link-preview link-preview-mini':'link-preview';
            var h='<a href="'+escapeHtml(url)+'" target="_blank" class="'+cls+'">';
            if(t.media&&t.media.photos&&t.media.photos.length>0) h+='<img src="'+escapeHtml(t.media.photos[0].url)+'" class="link-preview-image">';
            else if(t.media&&t.media.videos&&t.media.videos.length>0) h+='<img src="'+escapeHtml(t.media.videos[0].thumbnail_url)+'" class="link-preview-image">';
            h+='<div class="link-preview-info">';
            h+='<div class="link-preview-url">X (TWITTER)</div>';
            var title='';
            if(t.author) title+=t.author.name+': ';
            if(t.text) title+=t.text.length>120?t.text.substring(0,120)+'…':t.text;
            if(title) h+='<div class="link-preview-title">'+escapeHtml(title)+'</div>';
            h+='</div></a>';
            onResult(h,t);
        })
        .catch(function(){onResult(null);});
    return true;
}

// Helper: fetch TikTok link preview via official oEmbed API (returns true if URL is TikTok, false otherwise)
function _fetchTikTokPreview(url, onResult, mini){
    if(!/tiktok\.com/i.test(url)) return false;
    fetch('https://www.tiktok.com/oembed?url='+encodeURIComponent(url))
        .then(function(r){return r.json();})
        .then(function(data){
            if(!data.title&&!data.author_name){onResult(null);return;}
            var cls=mini?'link-preview link-preview-mini':'link-preview';
            var h='<a href="'+escapeHtml(url)+'" target="_blank" class="'+cls+'">';
            if(data.thumbnail_url) h+='<img src="'+escapeHtml(data.thumbnail_url)+'" class="link-preview-image">';
            h+='<div class="link-preview-info">';
            h+='<div class="link-preview-url">TIKTOK</div>';
            var title='';
            if(data.author_name) title+=data.author_name+': ';
            if(data.title) title+=data.title.length>120?data.title.substring(0,120)+'…':data.title;
            if(title) h+='<div class="link-preview-title">'+escapeHtml(title)+'</div>';
            h+='</div></a>';
            onResult(h);
        })
        .catch(function(){onResult(null);});
    return true;
}

// Auto-fetch compact link previews for messages, comments, and other small containers
function autoFetchLinkPreviewsMini(container,selector){
    if(!container) return;
    container.querySelectorAll(selector||'.msg-bubble,.comment-text').forEach(function(el){
        if(el.getAttribute('data-link-checked')) return;
        el.setAttribute('data-link-checked','1');
        var text=el.textContent||'';
        var urlMatch=text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
        if(!urlMatch) return;
        var url=urlMatch[1].replace(/[.,;:!?)]+$/,'');
        if(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return;
        // X/Twitter: use FxTwitter API (Microlink can't scrape X)
        if(_fetchXPreview(url,function(h){if(!h)return;el.insertAdjacentHTML('beforeend',h);var esc=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');el.innerHTML=el.innerHTML.replace(new RegExp(esc,'g'),'');},true)) return;
        // TikTok: use official oEmbed API
        if(_fetchTikTokPreview(url,function(h){if(!h)return;el.insertAdjacentHTML('beforeend',h);var esc=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');el.innerHTML=el.innerHTML.replace(new RegExp(esc,'g'),'');},true)) return;
        // Inline video embed for YouTube, Vimeo, direct video files
        var videoHtml=getVideoEmbedHtml(url,true);
        if(videoHtml){
            el.insertAdjacentHTML('beforeend',videoHtml);
            var escaped=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
            el.innerHTML=el.innerHTML.replace(new RegExp(escaped,'g'),'');
            _reloadThirdPartyEmbeds(url);
            return;
        }
        fetch('https://api.microlink.io?url='+encodeURIComponent(url))
            .then(function(r){return r.json();})
            .then(function(data){
                if(data.status==='success'&&data.data){
                    var d=data.data;
                    var domain=(d.publisher||'').toUpperCase()||url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0].toUpperCase();
                    var h='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview link-preview-mini">';
                    if(d.image&&d.image.url) h+='<img src="'+escapeHtml(d.image.url)+'" class="link-preview-image">';
                    else if(d.logo&&d.logo.url) h+='<img src="'+escapeHtml(d.logo.url)+'" class="link-preview-image">';
                    h+='<div class="link-preview-info">';
                    h+='<div class="link-preview-url">'+escapeHtml(domain)+'</div>';
                    if(d.title) h+='<div class="link-preview-title">'+escapeHtml(d.title)+'</div>';
                    h+='</div></a>';
                    el.insertAdjacentHTML('beforeend',h);
                    // Hide the raw URL in the text (use HTML-escaped URL for innerHTML match)
                    var escaped=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                    el.innerHTML=el.innerHTML.replace(new RegExp(escaped,'g'),'');
                }
            })
            .catch(function(){});
    });
}

// Auto-fetch link previews for URLs found in rendered post descriptions
function autoFetchLinkPreviews(container){
    if(!container) container=document;
    container.querySelectorAll('.post-description').forEach(function(desc){
        if(desc.getAttribute('data-link-checked')) return;
        desc.setAttribute('data-link-checked','1');
        var textEl=desc.querySelector('p');
        if(!textEl) return;
        var text=textEl.textContent||'';
        var urlMatch=text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
        if(!urlMatch) return;
        var url=urlMatch[1].replace(/[.,;:!?)]+$/,'');
        // Don't fetch for image URLs already shown as post media
        if(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return;
        // X/Twitter: use FxTwitter API (Microlink can't scrape X)
        if(_fetchXPreview(url,function(h){if(!h)return;desc.insertAdjacentHTML('beforeend',h);var esc=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');textEl.innerHTML=textEl.innerHTML.replace(new RegExp(esc,'g'),'');},false)) return;
        // TikTok: use official oEmbed API
        if(_fetchTikTokPreview(url,function(h){if(!h)return;desc.insertAdjacentHTML('beforeend',h);var esc=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');textEl.innerHTML=textEl.innerHTML.replace(new RegExp(esc,'g'),'');},false)) return;
        // Inline video embed for YouTube, Vimeo, direct video files
        var videoHtml=getVideoEmbedHtml(url,false);
        if(videoHtml){
            desc.insertAdjacentHTML('beforeend',videoHtml);
            var escaped=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
            textEl.innerHTML=textEl.innerHTML.replace(new RegExp(escaped,'g'),'');
            _reloadThirdPartyEmbeds(url);
            return;
        }
        fetch('https://api.microlink.io?url='+encodeURIComponent(url))
            .then(function(r){return r.json();})
            .then(function(data){
                if(data.status==='success'&&data.data){
                    var d=data.data;
                    var domain=(d.publisher||'').toUpperCase()||url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0].toUpperCase();
                    var h='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview">';
                    if(d.image&&d.image.url) h+='<img src="'+escapeHtml(d.image.url)+'" class="link-preview-image">';
                    else if(d.logo&&d.logo.url) h+='<img src="'+escapeHtml(d.logo.url)+'" class="link-preview-image">';
                    h+='<div class="link-preview-info">';
                    h+='<div class="link-preview-url">'+escapeHtml(domain)+'</div>';
                    if(d.title) h+='<div class="link-preview-title">'+escapeHtml(d.title)+'</div>';
                    h+='</div></a>';
                    desc.insertAdjacentHTML('beforeend',h);
                    // Hide the raw URL in the post text (use HTML-escaped URL for innerHTML match)
                    var escaped=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                    textEl.innerHTML=textEl.innerHTML.replace(new RegExp(escaped,'g'),'');
                }
            })
            .catch(function(){});
    });
}

// ======================== POST CREATION ========================
$('#openPostModal').addEventListener('click',function(){
    var html='<div class="create-post-modal"><div class="modal-header"><h3>Create a Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="cpm-scroll"><div style="display:flex;align-items:center;gap:10px;padding:16px 20px 0;"><img src="'+$('#profileAvatarImg').src+'" style="width:40px;height:40px;border-radius:50%;"><strong style="font-size:14px;">'+(currentUser?(currentUser.display_name||currentUser.username):'You')+'</strong></div>';
    html+='<textarea class="cpm-textarea" id="cpmText" placeholder="Write something..."></textarea>';
    html+='<div class="cpm-media-zone" id="cpmMediaZone"><div class="cpm-media-grid" id="cpmGrid"></div><div id="cpmDropZone"><i class="fas fa-photo-video"></i><br>Add Photos/Videos</div><input type="file" accept="image/*,video/*" multiple id="cpmFileInput" style="display:none;"></div>';
    html+='<div class="cpm-tags-section"><div class="cpm-tags-wrap" id="cpmTagsWrap"></div></div>';
    html+='<div class="cpm-link-section" id="cpmLinkSection" style="display:none;"><div id="cpmLinkPreview"></div></div>';
    html+='<div id="cpmPollSection" style="display:none;padding:0 20px 12px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><strong style="font-size:13px;"><i class="fas fa-chart-bar" style="margin-right:6px;color:var(--primary);"></i>Poll</strong><button id="cpmRemovePoll" style="background:none;color:#e74c3c;font-size:12px;cursor:pointer;"><i class="fas fa-times"></i> Remove</button></div><div id="cpmPollOptions"><div class="cpm-poll-opt"><input type="text" class="post-input cpm-poll-input" placeholder="Option 1" maxlength="80" style="font-size:13px;"></div><div class="cpm-poll-opt"><input type="text" class="post-input cpm-poll-input" placeholder="Option 2" maxlength="80" style="font-size:13px;"></div></div><button id="cpmAddPollOpt" style="background:none;color:var(--primary);font-size:12px;cursor:pointer;margin-top:6px;"><i class="fas fa-plus"></i> Add option</button></div>';
    html+='</div><div class="cpm-footer"><div id="cpmEmojiPanel" class="emoji-picker-panel"></div><div class="char-counter" id="cpmCharCounter">0 / 5000</div><div style="display:flex;gap:8px;align-items:center;width:100%;"><button class="cpm-emoji-btn" id="cpmEmojiBtn" title="Emoji"><i class="fas fa-face-smile"></i></button><button class="cpm-emoji-btn" id="cpmCameraBtn" title="Add Photos/Videos"><i class="fas fa-camera"></i></button><button class="cpm-emoji-btn" id="cpmPollBtn" title="Add Poll"><i class="fas fa-chart-bar"></i></button><button class="cpm-emoji-btn" id="cpmScheduleBtn" title="Schedule Post"><i class="far fa-clock"></i></button><button class="btn btn-primary" id="cpmPublish" style="flex:1;">Publish</button></div></div></div>';
    showModal(html);
    document.getElementById('cpmEmojiBtn').addEventListener('click',function(){openEmojiPicker('cpmEmojiPanel',document.getElementById('cpmText'));});
    initMentionAutocomplete('cpmText',null);
    // Draft auto-save
    initDraftAutoSave('cpmText');
    // Character counter
    initCharCounter('cpmText',document.getElementById('cpmCharCounter'));
    // Poll UI handlers
    var _pollActive=false;
    document.getElementById('cpmPollBtn').addEventListener('click',function(){
        _pollActive=!_pollActive;
        document.getElementById('cpmPollSection').style.display=_pollActive?'':'none';
        this.style.color=_pollActive?'var(--primary)':'';
    });
    document.getElementById('cpmRemovePoll').addEventListener('click',function(){
        _pollActive=false;
        document.getElementById('cpmPollSection').style.display='none';
        document.getElementById('cpmPollBtn').style.color='';
        document.getElementById('cpmPollOptions').innerHTML='<div class="cpm-poll-opt"><input type="text" class="post-input cpm-poll-input" placeholder="Option 1" maxlength="80" style="font-size:13px;"></div><div class="cpm-poll-opt"><input type="text" class="post-input cpm-poll-input" placeholder="Option 2" maxlength="80" style="font-size:13px;"></div>';
    });
    document.getElementById('cpmAddPollOpt').addEventListener('click',function(){
        var opts=document.querySelectorAll('.cpm-poll-input');
        if(opts.length>=6){showToast('Maximum 6 options');return;}
        var div=document.createElement('div');div.className='cpm-poll-opt';
        div.innerHTML='<input type="text" class="post-input cpm-poll-input" placeholder="Option '+(opts.length+1)+'" maxlength="80" style="font-size:13px;">';
        document.getElementById('cpmPollOptions').appendChild(div);
    });
    // Schedule post handler
    document.getElementById('cpmScheduleBtn').addEventListener('click',function(){
        var sh='<div class="modal-header"><h3><i class="far fa-clock" style="color:var(--primary);margin-right:8px;"></i>Schedule Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
        sh+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Choose when to publish this post:</p>';
        sh+='<input type="datetime-local" id="scheduleDateTime" class="post-input" style="width:100%;margin-bottom:16px;">';
        sh+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="confirmSchedule">Schedule</button></div></div>';
        showModal(sh);
        // Set min to now
        var now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
        document.getElementById('scheduleDateTime').min=now.toISOString().slice(0,16);
        document.getElementById('confirmSchedule').addEventListener('click',function(){
            var dt=document.getElementById('scheduleDateTime').value;
            if(!dt){showToast('Pick a date and time');return;}
            var schedTime=new Date(dt).getTime();
            if(schedTime<=Date.now()){showToast('Must be in the future');return;}
            var text=document.getElementById('cpmText')?document.getElementById('cpmText').value.trim():'';
            if(!text){showToast('Write something first');return;}
            _scheduledPosts.push({content:text,scheduledAt:schedTime,createdAt:Date.now()});
            persistScheduled();
            closeModal();
            showToast('Post scheduled for '+new Date(schedTime).toLocaleString());
        });
    });
    var mediaList=[];
    var zone=document.getElementById('cpmMediaZone');
    var grid=document.getElementById('cpmGrid');
    var dropZone=document.getElementById('cpmDropZone');
    var fileInput=document.getElementById('cpmFileInput');
    dropZone.addEventListener('click',function(){fileInput.click();});
    function addFilesToMedia(files){
        Array.from(files).forEach(function(f){
            var isV=f.type.startsWith('video/');
            if(isV){
                mediaList.push({src:URL.createObjectURL(f),type:'video',file:f});
                renderGrid();
            } else {
                var r=new FileReader();
                r.onload=function(e){mediaList.push({src:e.target.result,type:'image',file:f});renderGrid();};
                r.readAsDataURL(f);
            }
        });
    }
    document.getElementById('cpmCameraBtn').addEventListener('click',function(){showCameraMenu(this,fileInput,addFilesToMedia);});
    function renderGrid(){
        grid.innerHTML='';
        mediaList.forEach(function(m,i){
            var thumb=document.createElement('div');thumb.className='cpm-thumb';
            thumb.innerHTML=(m.type==='video'?'<video src="'+m.src+'#t=0.5" preload="metadata" muted></video>':'<img src="'+m.src+'">')+'<button class="remove-thumb" data-idx="'+i+'"><i class="fas fa-times"></i></button>'+(m.type!=='video'?'<button class="alt-text-btn" data-idx="'+i+'" title="Add alt text">ALT</button>':'');
            grid.appendChild(thumb);
        });
        zone.classList.toggle('has-media',mediaList.length>0);
        grid.querySelectorAll('.remove-thumb').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();mediaList.splice(parseInt(btn.dataset.idx),1);renderGrid();});});
        grid.querySelectorAll('.alt-text-btn').forEach(function(btn){btn.addEventListener('click',function(e){
            e.stopPropagation();var idx=parseInt(btn.dataset.idx);var m=mediaList[idx];
            var ah='<div class="modal-header"><h3>Alt Text</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
            ah+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:8px;">Describe this image for people who use screen readers.</p>';
            ah+='<textarea class="alt-text-input" id="altTextArea" placeholder="Describe what\'s in this image...">'+(m.altText||'')+'</textarea>';
            ah+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveAltText">Save</button></div></div>';
            showModal(ah);
            document.getElementById('saveAltText').addEventListener('click',function(){m.altText=document.getElementById('altTextArea').value.trim();closeModal();if(m.altText) btn.style.background='var(--primary)';showToast(m.altText?'Alt text saved':'Alt text cleared');});
        });});
    }
    fileInput.addEventListener('change',function(){
        addFilesToMedia(this.files);
        this.value='';
    });
    // Auto-detect URLs in textarea and fetch OG metadata
    var _linkData={url:'',title:'',desc:'',image:''};
    var _linkFetchTimer=null;
    var _lastFetchedUrl='';
    function detectAndFetchLink(){
        var text=document.getElementById('cpmText').value;
        var urlMatch=text.match(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i);
        var section=document.getElementById('cpmLinkSection');
        var preview=document.getElementById('cpmLinkPreview');
        if(!urlMatch){
            _linkData={url:'',title:'',desc:'',image:''};
            section.style.display='none';
            preview.innerHTML='';
            _lastFetchedUrl='';
            return;
        }
        var url=urlMatch[1].replace(/[.,;:!?)]+$/,'');
        if(url===_lastFetchedUrl) return;
        _lastFetchedUrl=url;
        _linkData={url:url,title:'',desc:'',image:''};
        section.style.display='';
        preview.innerHTML='<div style="padding:12px;color:var(--gray);font-size:13px;"><i class="fas fa-spinner fa-spin"></i> Fetching link preview...</div>';
        clearTimeout(_linkFetchTimer);
        _linkFetchTimer=setTimeout(function(){
            // X/Twitter: use FxTwitter API
            var xm=url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i);
            if(xm){
                fetch('https://api.fxtwitter.com/status/'+xm[1])
                    .then(function(r){return r.json();})
                    .then(function(data){
                        if(data.tweet){
                            var t=data.tweet;
                            _linkData.domain='X (TWITTER)';
                            var title='';
                            if(t.author) title+=t.author.name+': ';
                            if(t.text) title+=t.text.length>120?t.text.substring(0,120)+'…':t.text;
                            _linkData.title=title;
                            if(t.media&&t.media.photos&&t.media.photos.length>0) _linkData.image=t.media.photos[0].url;
                            else if(t.media&&t.media.videos&&t.media.videos.length>0) _linkData.image=t.media.videos[0].thumbnail_url;
                            var h='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;">';
                            if(_linkData.image) h+='<img src="'+escapeHtml(_linkData.image)+'" class="link-preview-image">';
                            h+='<div class="link-preview-info">';
                            h+='<div class="link-preview-url">'+_linkData.domain+'</div>';
                            if(_linkData.title) h+='<div class="link-preview-title">'+escapeHtml(_linkData.title)+'</div>';
                            h+='</div></a><button id="cpmLinkRemove" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px;"><i class="fas fa-times"></i></button>';
                            preview.innerHTML='<div style="position:relative;">'+h+'</div>';
                            document.getElementById('cpmLinkRemove').addEventListener('click',function(){_linkData={url:'',title:'',desc:'',image:''};_lastFetchedUrl='__removed__';section.style.display='none';preview.innerHTML='';});
                        } else {
                            preview.innerHTML='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">X (TWITTER)</div></div></a>';
                        }
                    })
                    .catch(function(){preview.innerHTML='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">'+escapeHtml(url)+'</div></div></a>';});
                return;
            }
            // TikTok: use official oEmbed API
            if(/tiktok\.com/i.test(url)){
                fetch('https://www.tiktok.com/oembed?url='+encodeURIComponent(url))
                    .then(function(r){return r.json();})
                    .then(function(data){
                        if(data.title||data.author_name){
                            _linkData.domain='TIKTOK';
                            var title='';
                            if(data.author_name) title+=data.author_name+': ';
                            if(data.title) title+=data.title.length>120?data.title.substring(0,120)+'…':data.title;
                            _linkData.title=title;
                            if(data.thumbnail_url) _linkData.image=data.thumbnail_url;
                            var h='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;">';
                            if(_linkData.image) h+='<img src="'+escapeHtml(_linkData.image)+'" class="link-preview-image">';
                            h+='<div class="link-preview-info">';
                            h+='<div class="link-preview-url">'+_linkData.domain+'</div>';
                            if(_linkData.title) h+='<div class="link-preview-title">'+escapeHtml(_linkData.title)+'</div>';
                            h+='</div></a><button id="cpmLinkRemove" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px;"><i class="fas fa-times"></i></button>';
                            preview.innerHTML='<div style="position:relative;">'+h+'</div>';
                            document.getElementById('cpmLinkRemove').addEventListener('click',function(){_linkData={url:'',title:'',desc:'',image:''};_lastFetchedUrl='__removed__';section.style.display='none';preview.innerHTML='';});
                        } else {
                            preview.innerHTML='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">TIKTOK</div></div></a>';
                        }
                    })
                    .catch(function(){preview.innerHTML='<a href="'+escapeHtml(url)+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">'+escapeHtml(url)+'</div></div></a>';});
                return;
            }
            fetch('https://api.microlink.io?url='+encodeURIComponent(url))
                .then(function(r){return r.json();})
                .then(function(data){
                    if(data.status==='success'&&data.data){
                        var d=data.data;
                        _linkData.title=d.title||'';
                        _linkData.desc=d.description||'';
                        _linkData.image=(d.image&&d.image.url)||(d.logo&&d.logo.url)||'';
                        _linkData.domain=(d.publisher||'').toUpperCase()||url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0].toUpperCase();
                        var h='<a href="'+url+'" target="_blank" class="link-preview" style="margin:0;">';
                        if(_linkData.image) h+='<img src="'+_linkData.image+'" class="link-preview-image">';
                        h+='<div class="link-preview-info">';
                        h+='<div class="link-preview-url">'+_linkData.domain+'</div>';
                        if(_linkData.title) h+='<div class="link-preview-title">'+_linkData.title+'</div>';
                        h+='</div></a><button id="cpmLinkRemove" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px;"><i class="fas fa-times"></i></button>';
                        preview.innerHTML='<div style="position:relative;">'+h+'</div>';
                        document.getElementById('cpmLinkRemove').addEventListener('click',function(){
                            _linkData={url:'',title:'',desc:'',image:''};
                            _lastFetchedUrl='__removed__';
                            section.style.display='none';
                            preview.innerHTML='';
                        });
                    } else {
                        preview.innerHTML='<a href="'+url+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">'+url+'</div></div></a>';
                    }
                })
                .catch(function(){
                    preview.innerHTML='<a href="'+url+'" target="_blank" class="link-preview" style="margin:0;"><div class="link-preview-info"><div class="link-preview-url">'+url+'</div></div></a>';
                });
        },600);
    }
    // Hashtag system — auto-extract #tags from textarea on space/enter
    var postTags=[];
    function renderPostTags(){
        var wrap=document.getElementById('cpmTagsWrap');
        wrap.innerHTML='';
        postTags.forEach(function(t,i){
            wrap.innerHTML+='<span class="cpm-tag-chip"><span>#'+t+'</span><button class="cpm-tag-remove" data-idx="'+i+'"><i class="fas fa-times"></i></button></span>';
        });
        wrap.querySelectorAll('.cpm-tag-remove').forEach(function(btn){
            btn.addEventListener('click',function(){postTags.splice(parseInt(btn.dataset.idx),1);renderPostTags();});
        });
    }
    document.getElementById('cpmText').addEventListener('input',function(){
        var ta=this;
        var text=ta.value;
        // Match a completed hashtag (followed by space or newline)
        var match=text.match(/#([a-zA-Z0-9_]+)[\s\n]/);
        if(match && postTags.length<10){
            var tag=match[1].toLowerCase();
            if(postTags.indexOf(tag)===-1){
                postTags.push(tag);
                renderPostTags();
            }
            // Remove the #tag from the textarea text
            ta.value=text.replace('#'+match[1],'').replace(/\s{2,}/g,' ');
        }
        detectAndFetchLink();
    });
    document.getElementById('cpmText').addEventListener('paste',function(){setTimeout(detectAndFetchLink,100);});
    var _publishing=false;
    document.getElementById('cpmPublish').addEventListener('click', async function(){
        if(_publishing)return;
        var postCd=checkCooldown('post',5000);
        if(postCd){showToast('Please wait a few seconds before posting again.');return;}
        var text=document.getElementById('cpmText').value.trim();
        var linkUrl=_linkData.url||'';
        var linkTitle=_linkData.title||'';
        var linkDesc=_linkData.desc||'';
        var linkImgSrc=_linkData.image||'';
        // Collect poll data if active
        var pollData=null;
        if(_pollActive){
            var pollInputs=document.querySelectorAll('.cpm-poll-input');
            var pollOpts=[];
            pollInputs.forEach(function(inp){var v=inp.value.trim();if(v)pollOpts.push(v);});
            if(pollOpts.length>=2) pollData={options:pollOpts,votes:{},totalVotes:0};
            else if(pollOpts.length>0){showToast('Poll needs at least 2 options');_publishing=false;return;}
        }
        if(!text&&!mediaList.length&&!linkUrl&&!pollData)return;
        _publishing=true;
        var pubBtn=document.getElementById('cpmPublish');
        pubBtn.disabled=true;pubBtn.textContent='Publishing...';
        var container=$('#feedContainer');

        // Upload all images to Supabase Storage
        var imageUrl = null;
        var allImageUrls = [];
        if(mediaList.length > 0 && currentUser) {
            for(var mi=0;mi<mediaList.length;mi++){
                try {
                    var mItem = mediaList[mi];
                    var file = mItem.file;
                    if(!file && mItem.src.startsWith('data:')){
                        var resp = await fetch(mItem.src);
                        var blob = await resp.blob();
                        file = new File([blob], 'post-'+Date.now()+'-'+mi+(mItem.type==='video'?'.mp4':'.jpg'), {type:blob.type});
                    }
                    if(!file) continue;
                    var url;
                    if(mItem.type === 'video') url = await sbUploadPostVideo(currentUser.id, file);
                    else url = await sbUploadPostImage(currentUser.id, file);
                    if(url){allImageUrls.push(url);if(!imageUrl)imageUrl=url;}
                } catch(e) { console.error('Media upload ' + mi + ':', e); showToast('Upload failed: '+(e.message||'')); }
            }
        }

        // Create post in Supabase — don't duplicate URL if it's already in the text
        var fullContent = text;
        if(pollData) fullContent += '\n[poll]'+JSON.stringify(pollData)+'[/poll]';
        if(linkUrl && text.indexOf(linkUrl)===-1) fullContent += '\n\n' + linkUrl;
        var sbPost = null;
        if(currentUser && (fullContent || imageUrl || allImageUrls.length)) {
            try {
                var postLoc=settings.showLocation?userLocation:null;
                sbPost = await sbCreatePost(currentUser.id, fullContent || '', imageUrl, null, null, postLoc, allImageUrls.length>1?allImageUrls:null);
                if(sbPost) notifyMentionedUsers(fullContent,sbPost.id);
            } catch(e) {
                console.error('Create post:', e);
                showToast('Post failed to save: ' + (e.message || e.details || 'Unknown error'));
                _publishing=false;pubBtn.disabled=false;pubBtn.textContent='Publish';
                return;
            }
        }

        var mediaHtml='';
        // Use uploaded URLs if available, fall back to local previews
        var previewMedia=allImageUrls.length?allImageUrls.map(function(u){return {src:u,type:isVideoUrl(u)?'video':'image'};}):mediaList;
        if(previewMedia.length>0){
            var pid='pg-'+Date.now();
            var cnt=Math.min(previewMedia.length,5);
            mediaHtml='<div class="post-media-grid pm-count-'+cnt+'" data-pgid="'+pid+'">';
            var shown=previewMedia.slice(0,5);var extra=previewMedia.length-5;
            shown.forEach(function(m,i){
                var isVid=m.type==='video';
                var inner=isVid
                    ?'<video src="'+m.src+'#t=0.5" preload="metadata" muted playsinline></video><div class="pm-play-overlay"><i class="fas fa-play"></i></div>'
                    :'<img src="'+m.src+'">';
                if(i===4&&extra>0){
                    mediaHtml+='<div class="pm-thumb pm-more" data-pgid="'+pid+'">'+inner+'<div class="pm-more-overlay">+'+extra+'</div></div>';
                } else {
                    mediaHtml+='<div class="pm-thumb">'+inner+'</div>';
                }
            });
            mediaHtml+='</div>';
            window['_media_'+pid]=previewMedia;
            previewMedia.forEach(function(m){if(m.type==='image')state.photos.post.unshift({src:m.src,date:Date.now()});});
            renderPhotosCard();
        }
        var linkHtml='';
        if(linkUrl){
            var vidEmbed=getVideoEmbedHtml(linkUrl,false);
            if(vidEmbed){
                linkHtml=vidEmbed;
            } else {
                var linkDomain=(_linkData.domain)||linkUrl.replace(/^https?:\/\/(www\.)?/,'').split('/')[0].toUpperCase();
                linkHtml='<a href="'+linkUrl+'" target="_blank" class="link-preview">';
                if(linkImgSrc){linkHtml+='<img src="'+linkImgSrc+'" class="link-preview-image">';}
                linkHtml+='<div class="link-preview-info">';
                linkHtml+='<div class="link-preview-url">'+linkDomain+'</div>';
                if(linkTitle){linkHtml+='<div class="link-preview-title">'+linkTitle+'</div>';}
                linkHtml+='</div></a>';
            }
        }
        var myName = currentUser ? (currentUser.display_name || currentUser.username) : 'You';
        var myPostId = sbPost ? sbPost.id : 'my-'+Date.now();
        var myUid=currentUser?currentUser.id:'';
        var postHtml='<div class="card feed-post"><div class="post-header"><img src="'+getMyAvatar()+'" alt="You" class="post-avatar" data-person-id="'+myUid+'">';
        postHtml+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username" data-person-id="'+myUid+'">'+myName+'</h4><span class="post-time">just now</span></div>';
        var myLocBadge=settings.showLocation&&userLocation?'<span class="badge badge-blue"><i class="fas fa-map-marker-alt"></i> '+userLocation+'</span>':'';
        postHtml+='<div class="post-badges">'+myLocBadge+'</div></div></div>';
        var tagsHtml='';
        if(postTags.length>0){tagsHtml='<div class="post-tags">';postTags.forEach(function(t){tagsHtml+='<span class="skill-tag">#'+t+'</span>';});tagsHtml+='</div>';}
        var displayText=text;
        if(linkUrl&&linkHtml){var esc=linkUrl.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');displayText=displayText.replace(new RegExp(esc,'g'),'').trim();}
        postHtml+='<div class="post-description">'+(displayText?'<p>'+escapeHtmlNl(displayText)+'</p>':'')+mediaHtml+linkHtml+'</div>'+tagsHtml;
        postHtml+='<div class="post-actions"><div class="action-left"><button class="action-btn like-btn" data-post-id="'+myPostId+'"><i class="far fa-thumbs-up"></i><span class="like-count">0</span></button>';
        postHtml+='<button class="action-btn dislike-btn" data-post-id="'+myPostId+'"><i class="far fa-thumbs-down"></i><span class="dislike-count">0</span></button>';
        postHtml+='<button class="action-btn comment-btn"><i class="far fa-comment"></i><span>0</span></button>';
        postHtml+='<button class="action-btn share-btn"><i class="fas fa-share-from-square"></i><span>0</span></button></div></div></div>';
        container.insertAdjacentHTML('afterbegin',postHtml);
        if(linkUrl) _reloadThirdPartyEmbeds(linkUrl);
        if(_incrementDailyCoin('posts')){state.coins+=5;updateCoins();}
        trackQuestProgress('post');
        showCoinEarnAnimation(document.getElementById('cpmPublish')||document.getElementById('openPostModal'),5);
        clearDraft(); // Clear draft on successful publish
        closeModal();
        var newPost=container.firstElementChild;
        var likeBtn=newPost.querySelector('.like-btn');
        likeBtn.addEventListener('click',async function(){var countEl=likeBtn.querySelector('.like-count');var count=parseInt(countEl.textContent);var pid=likeBtn.getAttribute('data-post-id');var isUUID=/^[0-9a-f]{8}-/.test(pid);if(state.likedPosts[pid]){delete state.likedPosts[pid];likeBtn.classList.remove('liked');likeBtn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);if(!isOwnPost(pid)){state.coins--;updateCoins();}if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e){}};}else{state.likedPosts[pid]=true;likeBtn.classList.add('liked');likeBtn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;if(!isOwnPost(pid)){state.coins++;updateCoins();}if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e){}}}});
        var dislikeBtn=newPost.querySelector('.dislike-btn');
        dislikeBtn.addEventListener('click',function(){var countEl=dislikeBtn.querySelector('.dislike-count');var count=parseInt(countEl.textContent);var pid=dislikeBtn.getAttribute('data-post-id');if(state.dislikedPosts[pid]){delete state.dislikedPosts[pid];dislikeBtn.classList.remove('disliked');dislikeBtn.querySelector('i').className='far fa-thumbs-down';countEl.textContent=Math.max(0,count-1);}else{state.dislikedPosts[pid]=true;dislikeBtn.classList.add('disliked');dislikeBtn.querySelector('i').className='fas fa-thumbs-down';countEl.textContent=count+1;}});
        newPost.querySelector('.comment-btn').addEventListener('click',function(){var postId=newPost.querySelector('.like-btn').getAttribute('data-post-id');showComments(postId,newPost.querySelector('.comment-btn span'));});
        newPost.querySelector('.share-btn').addEventListener('click',function(){handleShare(newPost.querySelector('.share-btn'));});
        newPost.querySelectorAll('.post-avatar, .post-username').forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',async function(){var uid=el.getAttribute('data-person-id');if(!uid)return;try{var p=await sbGetProfile(uid);if(p)showProfileView(profileToPerson(p));}catch(e){}});});
        var moreBtn=newPost.querySelector('.pm-more');
        if(moreBtn){moreBtn.addEventListener('click',function(){showAllMedia(moreBtn.dataset.pgid,4);});}
    });
});
function showAllMedia(pgid,startIdx){
    var list=window['_media_'+pgid];if(!list)return;
    var imgs=list.filter(function(m){return m.type==='image';}).map(function(m){return m.src;});
    if(imgs.length) window._openLightbox(imgs,startIdx||0);
}

// ======================== SUGGESTIONS ========================
async function renderSuggestions(){
    var list=$('#suggestionList');
    if(!list||!currentUser) return;
    try{
        var all=await sbGetAllProfiles(20);
        var suggestions=all.filter(function(p){return p.id!==currentUser.id&&!state.followedUsers[p.id]&&!blockedUsers[p.id];}).slice(0,5);
        _pillSuggestions=suggestions;
        if(!suggestions.length){list.innerHTML='<p style="text-align:center;color:var(--gray);font-size:13px;">No suggestions yet</p>';renderMobilePills();return;}
        var html='';
        suggestions.forEach(function(p){
            var name=p.display_name||p.username;
            var avatar=p.avatar_url||DEFAULT_AVATAR;
            html+='<div class="suggestion-item"><img src="'+avatar+'" alt="'+escapeHtml(name)+'" class="suggestion-avatar">';
            html+='<div class="suggestion-info"><h4>'+escapeHtml(name)+'</h4><p>'+escapeHtml(safeTruncate(p.bio||'',40))+'</p></div>';
            html+='<button class="suggestion-follow-btn" data-uid="'+p.id+'">'+(state.followedUsers[p.id]?'<i class="fas fa-check"></i>':'<i class="fas fa-plus"></i>')+'</button></div>';
        });
        list.innerHTML=html;
        list.querySelectorAll('.suggestion-follow-btn').forEach(function(btn){
            btn.addEventListener('click',async function(){
                var uid=btn.dataset.uid;
                if(state.followedUsers[uid]){await sbUnfollow(currentUser.id,uid);delete state.followedUsers[uid];}
                else{await sbFollow(currentUser.id,uid);state.followedUsers[uid]=true;}
                await loadFollowCounts();
                renderSuggestions();
            });
        });
        list.querySelectorAll('.suggestion-avatar,.suggestion-info').forEach(function(el){
            el.style.cursor='pointer';
            el.addEventListener('click',async function(){
                var item=el.closest('.suggestion-item');
                var uid=item.querySelector('.suggestion-follow-btn').dataset.uid;
                try{var p=await sbGetProfile(uid);if(p) showProfileView(profileToPerson(p));}catch(e){}
            });
        });
    }catch(e){console.error('renderSuggestions:',e);renderMobilePills();return;}
    renderMobilePills();
}

// ======================== TRENDING GROUPS SIDEBAR ========================
function renderTrendingSidebar(){
    var sorted=groups.slice().sort(function(a,b){return (b.members||0)-(a.members||0);});
    var top=sorted.slice(0,4);
    var html='';
    if(!top.length){html='<p style="color:var(--gray);font-size:13px;text-align:center;">No groups yet. Create one!</p>';}
    top.forEach(function(g){
        html+='<div class="group-item" data-gid="'+g.id+'"><div class="group-icon" style="background:'+(g.color||'#5cbdb9')+'22;color:'+(g.color||'#5cbdb9')+';"><i class="fas '+(g.icon||'fa-users')+'"></i></div>';
        html+='<div class="group-info"><h5 class="group-name">'+g.name+'</h5><p class="group-desc">'+(g.desc||'')+'</p>';
        html+='<span class="group-members"><i class="fas fa-users"></i> '+fmtNum(g.members||0)+' members</span></div></div>';
    });
    $('#trendingGroupsSidebar').innerHTML=html;
    $$('#trendingGroupsSidebar .group-item').forEach(function(el){
        el.addEventListener('click',function(){
            var gid=el.getAttribute('data-gid');
            var group=groups.find(function(g){return g.id===gid;});
            if(group) showGroupView(group);
        });
    });
    renderMobilePills();
}

// ======================== MOBILE PILLS BAR ========================
var _pillSuggestions=[];
function renderMobilePills(){
    var bar=$('#mobilePills');
    if(!bar) return;
    var html='';
    html+='<button class="mobile-pill" id="pillPeopleYouKnow"><i class="fas fa-user-plus"></i>People You May Know</button>';
    html+='<button class="mobile-pill" id="pillTrendingGroups"><i class="fas fa-fire"></i>Trending Groups</button>';
    bar.innerHTML=html;
    document.getElementById('pillPeopleYouKnow').addEventListener('click',function(){ showPeopleYouKnowModal(); });
    document.getElementById('pillTrendingGroups').addEventListener('click',function(){ showTrendingGroupsModal(); });
}

function showPeopleYouKnowModal(){
    var html='<div class="modal-header"><h3>People You May Know</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body pill-modal-scroll">';
    if(!_pillSuggestions.length){html+='<p style="text-align:center;color:var(--gray);padding:24px 0;">No suggestions right now. Check back later!</p>';}
    _pillSuggestions.forEach(function(p){
        var name=p.display_name||p.username;
        var avatar=p.avatar_url||DEFAULT_AVATAR;
        var bio=safeTruncate(p.bio||'',50);
        var followed=state.followedUsers[p.id];
        html+='<div class="pill-modal-item" data-uid="'+p.id+'">';
        html+='<img src="'+avatar+'" class="pill-modal-avatar">';
        html+='<div class="pill-modal-info"><strong>'+escapeHtml(name)+'</strong><p>'+escapeHtml(bio)+'</p></div>';
        html+='<button class="suggestion-follow-btn pill-modal-follow" data-uid="'+p.id+'">'+(followed?'<i class="fas fa-check"></i>':'<i class="fas fa-plus"></i>')+'</button>';
        html+='</div>';
    });
    html+='</div>';
    showModal(html);
    $$('.pill-modal-item[data-uid]').forEach(function(el){
        el.querySelectorAll('.pill-modal-avatar, .pill-modal-info').forEach(function(target){
            target.style.cursor='pointer';
            target.addEventListener('click',async function(){
                var uid=el.dataset.uid;
                try{var p=await sbGetProfile(uid);if(p){closeModal();showProfileView(profileToPerson(p));}}catch(e){}
            });
        });
    });
    $$('.pill-modal-follow').forEach(function(btn){
        btn.addEventListener('click',async function(e){
            e.stopPropagation();
            var uid=btn.dataset.uid;
            if(state.followedUsers[uid]){await sbUnfollow(currentUser.id,uid);delete state.followedUsers[uid];btn.innerHTML='<i class="fas fa-plus"></i>';}
            else{await sbFollow(currentUser.id,uid);state.followedUsers[uid]=true;btn.innerHTML='<i class="fas fa-check"></i>';}
            await loadFollowCounts();
            renderSuggestions();
        });
    });
}

function showTrendingGroupsModal(){
    var sorted=groups.slice().sort(function(a,b){return (b.members||0)-(a.members||0);});
    var top=sorted.slice(0,10);
    var html='<div class="modal-header"><h3>Trending Groups</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body pill-modal-scroll">';
    if(!top.length){ html+='<p style="text-align:center;color:var(--gray);">No groups yet</p>'; }
    top.forEach(function(g){
        html+='<div class="pill-modal-item" data-gid="'+g.id+'">';
        html+='<div class="group-icon" style="background:'+(g.color||'#5cbdb9')+'22;color:'+(g.color||'#5cbdb9')+';"><i class="fas '+(g.icon||'fa-users')+'"></i></div>';
        html+='<div class="pill-modal-info"><strong>'+escapeHtml(g.name)+'</strong><p>'+escapeHtml(safeTruncate(g.desc||'',50))+'</p>';
        html+='<span style="font-size:11px;color:var(--gray);"><i class="fas fa-users"></i> '+fmtNum(g.members||0)+' members</span></div>';
        html+='</div>';
    });
    html+='</div>';
    showModal(html);
    $$('.pill-modal-item[data-gid]').forEach(function(el){
        el.addEventListener('click',function(){
            var g=groups.find(function(gr){return gr.id===el.dataset.gid;});
            if(g){closeModal();showGroupView(g);}
        });
    });
}

// ======================== GROUPS PAGE ========================
function getGroupBannerBg(g){
    var ps=state.groupActivePremiumSkin[g.id];if(ps){var sk=premiumSkins.find(function(s){return s.id===ps;});if(sk)return sk.preview;}
    var bs=state.groupActiveSkin[g.id];if(bs&&groupSkinBanners[bs])return groupSkinBanners[bs];
    return g.color;
}
function groupCardHtml(g){
    var joined=state.joinedGroups[g.id];
    var isOwner=g.createdBy==='me';
    var bg=getGroupBannerBg(g);
    var avatarHtml=g.profileImg?'<img src="'+escapeHtml(g.profileImg)+'" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.3);">':'<i class="fas '+g.icon+'"></i>';
    return '<div class="group-card" data-gid="'+g.id+'"><div class="group-card-banner" style="background:'+bg+';">'+(isOwner?'<button class="gc-icon-edit-btn" data-gid="'+g.id+'" title="Change Icon"><i class="fas fa-pen"></i></button>':'')+avatarHtml+'</div><div class="group-card-body"><h4>'+g.name+'</h4><p>'+g.desc+'</p><span class="group-members"><i class="fas fa-users"></i> '+fmtNum(g.members)+' members</span></div><div class="group-card-actions"><button class="btn '+(joined?'btn-disabled':'btn-primary')+' join-group-btn" data-gid="'+g.id+'">'+(joined?'<i class="fas fa-check gc-btn-icon"></i><span class="gc-btn-text">Joined</span>':'<i class="fas fa-plus gc-btn-icon"></i><span class="gc-btn-text">Join</span>')+'</button><button class="btn btn-outline view-group-btn" data-gid="'+g.id+'"><i class="fas fa-magnifying-glass gc-btn-icon"></i><span class="gc-btn-text">View</span></button></div></div>';
}
var currentGroupTab=null;
function getGroupCategories(filter){
    var cats=[];
    var filtered=filter?groups.filter(function(g){return g.name.toLowerCase().indexOf(filter.toLowerCase())!==-1||g.desc.toLowerCase().indexOf(filter.toLowerCase())!==-1;}):groups;
    var yourGroups=[],modGroups=[],joinedGroups=[],recommended=[];
    filtered.forEach(function(g){
        var mr=getMyGroupRole(g);
        if(g.createdBy==='me') yourGroups.push(g);
        else if(mr==='Co-Admin'||mr==='Moderator') modGroups.push(g);
        else if(state.joinedGroups[g.id]) joinedGroups.push(g);
        else recommended.push(g);
    });
    if(yourGroups.length) cats.push({key:'yours',label:'<i class="fas fa-crown"></i> My Groups',items:yourGroups});
    if(modGroups.length) cats.push({key:'mod',label:'<i class="fas fa-shield-halved"></i> Moderating',items:modGroups});
    if(joinedGroups.length) cats.push({key:'joined',label:'<i class="fas fa-users"></i> Joined',items:joinedGroups});
    cats.push({key:'discover',label:'<i class="fas fa-compass"></i> Discover',items:recommended});
    return cats;
}
function renderGroups(filter){
    var cats=getGroupCategories(filter);
    if(!currentGroupTab||!cats.find(function(c){return c.key===currentGroupTab;})) currentGroupTab=cats[0].key;
    var tabsHtml='';
    cats.forEach(function(c){tabsHtml+='<button class="search-tab'+(c.key===currentGroupTab?' active':'')+'" data-gtab="'+c.key+'">'+c.label+'</button>';});
    $('#groupsTabs').innerHTML=tabsHtml;
    var active=cats.find(function(c){return c.key===currentGroupTab;});
    var html='';
    if(active.items.length){html+='<div class="shop-scroll-row scroll-2row">';active.items.forEach(function(g){html+=groupCardHtml(g);});html+='</div>';}
    else{html+='<p style="color:var(--gray);font-size:14px;padding:20px 0;text-align:center;">No groups here'+(filter?' matching "'+filter+'"':'')+'.</p>';}
    $('#groupsSections').innerHTML=html;
    bindGroupEvents('#groupsSections');
    initDragScroll('#groupsSections');
    $$('#groupsTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        $$('#groupsTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');currentGroupTab=tab.dataset.gtab;$('#groupSearch').value='';renderGroups();
    });});
}
function bindGroupEvents(container){
    $$(container+' .join-group-btn').forEach(function(btn){
        btn.addEventListener('click',async function(e){
            e.stopPropagation();
            var gid=btn.getAttribute('data-gid');
            if(!state.joinedGroups[gid]&&currentUser){
                try{
                    await sbJoinGroup(gid,currentUser.id);
                    state.joinedGroups[gid]=true;
                    var jg=groups.find(function(g){return g.id===gid;});
                    if(jg)jg.members++;
                    saveState();
                    addNotification('group','You joined "'+jg.name+'"');
                    renderGroups();
                }catch(e2){console.error('Join group:',e2);showToast('Failed to join group');}
            }
        });
    });
    $$(container+' .view-group-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var gid=btn.getAttribute('data-gid');
            var group=groups.find(function(g){return g.id===gid;});
            if(group) showGroupView(group);
        });
    });
    $$(container+' .group-card').forEach(function(card){
        card.addEventListener('click',function(){
            var gid=card.getAttribute('data-gid');
            var group=groups.find(function(g){return g.id===gid;});
            if(group) showGroupView(group);
        });
    });
    $$(container+' .gc-icon-edit-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var gid=btn.getAttribute('data-gid');
            var group=groups.find(function(g){return g.id===gid;});
            if(!group) return;
            var icons=['fa-users','fa-camera-retro','fa-gamepad','fa-utensils','fa-dumbbell','fa-music','fa-paw','fa-plane-departure','fa-book','fa-leaf','fa-film','fa-hammer','fa-mug-hot','fa-code','fa-palette','fa-rocket','fa-heart','fa-star','fa-fire','fa-bolt','fa-globe','fa-trophy','fa-gem','fa-shield'];
            var _tc=getGroupThemeColor(group);
            var h='<div class="modal-header"><h3>Change Icon</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body">';
            if(_tc){h+='<style>.gv-icon-pick.active{border-color:'+_tc+';color:'+_tc+';background:'+_tc+'22;}.gv-icon-pick:hover{background:'+_tc+'33;color:'+_tc+';}</style>';}
            h+='<div class="gv-icon-grid">';
            icons.forEach(function(ic){h+='<button class="gv-icon-pick'+(group.icon===ic?' active':'')+'" data-icon="'+ic+'"><i class="fas '+ic+'"></i></button>';});
            h+='</div></div>';showModal(h);
            $$('.gv-icon-pick').forEach(function(pick){pick.addEventListener('click',async function(){group.icon=pick.dataset.icon;try{await sbUpdateGroup(group.id,{icon:group.icon});}catch(e){console.warn('Save group icon:',e);}closeModal();renderGroups();});});
        });
    });
}
$('#groupSearch').addEventListener('input',function(){renderGroups(this.value);});
$('#createGroupBtn').addEventListener('click',function(){
    showModal('<div class="modal-header"><h3>Create Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Group Name</label><input type="text" class="post-input" id="newGroupName" placeholder="Enter group name" style="width:100%;"></div><div style="margin-bottom:14px;"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Description</label><input type="text" class="post-input" id="newGroupDesc" placeholder="What is this group about?" style="width:100%;"></div><button class="btn btn-primary btn-block" id="submitGroupBtn">Create Group</button></div>');
    document.getElementById('submitGroupBtn').addEventListener('click',async function(){
        var name=document.getElementById('newGroupName').value.trim();
        var desc=document.getElementById('newGroupDesc').value.trim();
        if(!name){return;}
        if(!currentUser){showToast('You must be logged in to create a group.');return;}
        var btn=this;btn.disabled=true;btn.textContent='Creating...';
        try{
            var g=await sbCreateGroup(currentUser.id,name,desc||'A new group on BlipVibe');
            var newGroup={id:g.id,name:g.name,desc:g.description||'',icon:'fa-users',color:'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),members:1,owner_id:g.owner_id,owner:g.owner,createdBy:'me',description:g.description||'',member_count:g.member_count,mods:[],coverPhoto:null,profileImg:null};
            groups.push(newGroup);
            state.joinedGroups[newGroup.id]=true;
            saveState();
            closeModal();
            showGroupView(newGroup);
            renderGroups();
            addNotification('group','You created the group "'+name+'"');
        }catch(e){
            console.error('Create group:',e);
            showToast('Failed to create group: '+(e.message||'Unknown error'));
            btn.disabled=false;btn.textContent='Create Group';
        }
    });
});

// ======================== PROFILES PAGE ========================
var currentProfileTab='network';
function profileCardHtml(p,opts){
    var name=p.display_name||p.name||p.username||'User';
    var bio=p.bio||'';
    var avatar=p.avatar_url||DEFAULT_AVATAR;
    var isFollowed=state.followedUsers[p.id];
    var isSelf=currentUser&&p.id===currentUser.id;
    var nfb=opts&&opts.notFollowingBack;
    var noBio=opts&&opts.noBio;
    var btnLabel=isFollowed?(nfb?'Not Following Back':'Following'):'Follow';
    var btnClass=isFollowed?(nfb?'btn-outline nfb-label':'btn-outline'):'btn-primary';
    return '<div class="profile-card-item"><img src="'+avatar+'" class="profile-card-avatar" data-uid="'+p.id+'"><h4 class="profile-card-name" data-uid="'+p.id+'">'+escapeHtml(name)+'</h4>'+(noBio?'':'<p class="profile-card-bio">'+escapeHtml(safeTruncate(bio,60))+'</p>')+(isSelf?'':'<button class="btn '+btnClass+' profile-follow-btn" data-uid="'+p.id+'">'+btnLabel+'</button>')+'</div>';
}
var _networkRenderVersion=0;
async function renderMyNetwork(container,query){
    if(!currentUser){container.innerHTML='';return;}
    var myVersion=++_networkRenderVersion;
    var html='';
    try{
        var following=await sbGetFollowing(currentUser.id);
        var followers=await sbGetFollowers(currentUser.id);
        if(myVersion!==_networkRenderVersion) return; // stale call, skip
        following=following.filter(function(p){return p&&p.id!==currentUser.id&&!blockedUsers[p.id];});
        followers=followers.filter(function(p){return p&&p.id!==currentUser.id&&!blockedUsers[p.id];});
        // Deduplicate: separate mutual follows, following-only, followers-only
        var followingIds={};
        following.forEach(function(p){followingIds[p.id]=true;});
        var mutual=following.filter(function(p){return followers.some(function(f){return f.id===p.id;});});
        var followingOnly=following.filter(function(p){return !followers.some(function(f){return f.id===p.id;});});
        var followersOnly=followers.filter(function(p){return !followingIds[p.id];});
        // Filter by search query if provided
        if(query){
            var q=query.toLowerCase();
            var matchName=function(p){return (p.display_name||p.username||'').toLowerCase().indexOf(q)!==-1;};
            mutual=mutual.filter(matchName);
            followingOnly=followingOnly.filter(matchName);
            followersOnly=followersOnly.filter(matchName);
        }
        html+='<div class="connections-wrap">';
        if(mutual.length||followersOnly.length){
            html+='<div class="connections-columns">';
            // Left column — Mutual
            html+='<div class="connections-col">';
            html+='<h3 class="connections-heading"><i class="fas fa-handshake"></i> Mutual <span class="connections-count">'+mutual.length+'</span></h3>';
            if(mutual.length){
                html+='<div class="connections-scroll"><div class="connections-grid">';
                mutual.forEach(function(p){html+=profileCardHtml({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},{noBio:true});});
                html+='</div></div>';
            } else { html+='<p class="connections-empty">No mutual connections yet.</p>'; }
            html+='</div>';
            // Right column — Followers (people who follow you but you don't follow back)
            html+='<div class="connections-col">';
            html+='<h3 class="connections-heading"><i class="fas fa-users"></i> Followers <span class="connections-count">'+followersOnly.length+'</span></h3>';
            if(followersOnly.length){
                html+='<div class="connections-scroll"><div class="connections-grid">';
                followersOnly.forEach(function(p){html+=profileCardHtml({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},{noBio:true});});
                html+='</div></div>';
            } else { html+='<p class="connections-empty">No followers-only yet.</p>'; }
            html+='</div>';
            html+='</div>';
            // Dot indicators for mobile swipe
            html+='<div class="connections-dots">';
            html+='<span class="connections-dot active" data-idx="0"></span>';
            html+='<span class="connections-dot" data-idx="1"></span>';
            html+='</div>';
        }
        html+='</div>';
        if(!mutual.length&&!followersOnly.length) html='<div class="empty-state"><i class="fas fa-user-group"></i><p>'+(query?'No results for "'+query+'"':'Your network is empty. Follow some people!')+'</p></div>';
    }catch(e){html='<div class="empty-state"><i class="fas fa-user-group"></i><p>Could not load network.</p></div>';}
    if(myVersion!==_networkRenderVersion) return;
    container.innerHTML=html;
    // Wire up mobile swipe dot indicators
    var colsEl=container.querySelector('.connections-columns');
    var dotsEl=container.querySelector('.connections-dots');
    if(colsEl&&dotsEl){
        var dots=dotsEl.querySelectorAll('.connections-dot');
        colsEl.addEventListener('scroll',function(){
            var idx=Math.round(colsEl.scrollLeft/colsEl.offsetWidth);
            dots.forEach(function(d,i){d.classList.toggle('active',i===idx);});
        });
        dots.forEach(function(d){
            d.addEventListener('click',function(){
                var idx=parseInt(d.getAttribute('data-idx'))||0;
                colsEl.scrollTo({left:idx*colsEl.offsetWidth,behavior:'smooth'});
            });
        });
    }
    var scope=container.closest('.page')?'#'+container.closest('.page').id:'#profilesSections';
    bindProfileEvents(scope);
}
var _discoverRenderVersion=0;
async function renderDiscover(container,query){
    var myVersion=++_discoverRenderVersion;
    var html='';
    try{
        var profiles;
        if(query){
            // Search: search ALL profiles on BlipVibe
            profiles=await sbSearchProfiles(query,30);
            if(currentUser) profiles=profiles.filter(function(p){return p.id!==currentUser.id;});
        } else {
            // No search: show friends-of-friends first, then fill with other users
            profiles=[];
            var all=await sbGetAllProfiles(50);
            if(currentUser){
                var fofKeys=Object.keys(_fofIds);
                profiles=all.filter(function(p){return _fofIds[p.id];});
            }
            // If not enough friends-of-friends, add other profiles
            if(profiles.length<10){
                var networkIds={};
                if(currentUser){
                    networkIds[currentUser.id]=true;
                    Object.keys(state.followedUsers).forEach(function(k){networkIds[k]=true;});
                }
                var existing={}; profiles.forEach(function(p){existing[p.id]=true;});
                var extras=all.filter(function(p){return !networkIds[p.id]&&!existing[p.id];});
                profiles=profiles.concat(extras);
            }
        }
        profiles=profiles.filter(function(p){return !blockedUsers[p.id];});
        if(!profiles.length) html='<div class="empty-state"><i class="fas fa-users"></i><p>'+(query?'No results for "'+query+'"':'No suggestions yet')+'</p></div>';
        else{html='<div class="search-results-grid">';profiles.forEach(function(p){html+=profileCardHtml({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},{noBio:true});});html+='</div>';}
    }catch(e){console.error('renderDiscover:',e);html='<div class="empty-state"><i class="fas fa-users"></i><p>Could not load profiles.</p></div>';}
    if(myVersion!==_discoverRenderVersion) return;
    container.innerHTML=html;
    bindProfileEvents(container.closest('.page')?'#'+container.closest('.page').id:'#profilesSections');
}
var _nfbRenderVersion=0;
async function renderNotFollowingBack(container,query){
    if(!currentUser){container.innerHTML='';return;}
    var myVersion=++_nfbRenderVersion;
    var html='';
    try{
        var following=await sbGetFollowing(currentUser.id);
        var followers=await sbGetFollowers(currentUser.id);
        if(myVersion!==_nfbRenderVersion) return;
        following=following.filter(function(p){return p&&p.id!==currentUser.id&&!blockedUsers[p.id];});
        var followerIds={};
        followers.forEach(function(p){if(p)followerIds[p.id]=true;});
        var notFollowingBack=following.filter(function(p){return !followerIds[p.id];});
        if(query){
            var q=query.toLowerCase();
            notFollowingBack=notFollowingBack.filter(function(p){return (p.display_name||p.username||'').toLowerCase().indexOf(q)!==-1;});
        }
        if(notFollowingBack.length){
            html='<p style="color:var(--gray);margin:12px 0 16px;font-size:14px;">'+notFollowingBack.length+' '+(notFollowingBack.length===1?'person':'people')+' you follow '+(notFollowingBack.length===1?'doesn\'t':'don\'t')+' follow you back.</p>';
            html+='<div class="search-results-grid">';
            notFollowingBack.forEach(function(p){html+=profileCardHtml({id:p.id,name:p.display_name||p.username,bio:p.bio||'',avatar_url:p.avatar_url},{notFollowingBack:true,noBio:true});});
            html+='</div>';
        } else {
            html='<div class="empty-state"><i class="fas fa-handshake"></i><p>'+(query?'No results for "'+query+'"':'Everyone you follow follows you back!')+'</p></div>';
        }
    }catch(e){html='<div class="empty-state"><i class="fas fa-user-xmark"></i><p>Could not load data.</p></div>';}
    if(myVersion!==_nfbRenderVersion) return;
    container.innerHTML=html;
    bindProfileEvents(container.closest('.page')?'#'+container.closest('.page').id:'#profilesSections');
}
function renderProfiles(tab,query){
    var container=$('#profilesSections');
    if(!container) return;
    var t=tab||currentProfileTab||'network';
    if(t==='network') renderMyNetwork(container,query||'');
    else if(t==='notfollowing') renderNotFollowingBack(container,query||'');
    else renderDiscover(container,query||'');
}
function bindProfileEvents(c){
    $$(c+' .profile-follow-btn').forEach(function(btn){btn.addEventListener('click',function(){toggleFollow(btn.dataset.uid,btn);});});
    $$(c+' .profile-view-btn').forEach(function(btn){btn.addEventListener('click',async function(){
        var uid=btn.dataset.uid;if(!uid)return;
        try{var p=await sbGetProfile(uid);if(p)showProfileView(profileToPerson(p));}catch(e){}
    });});
    $$(c+' .profile-card-avatar, '+c+' .profile-card-name').forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',async function(){
        var uid=el.dataset.uid;if(!uid)return;
        try{var p=await sbGetProfile(uid);if(p)showProfileView(profileToPerson(p));}catch(e){}
    });});
}
$$('#profilesTabs .search-tab').forEach(function(tab){
    tab.addEventListener('click',function(){
        $$('#profilesTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        currentProfileTab=tab.dataset.ptab;
        $('#profileSearch').value='';
        renderProfiles(currentProfileTab);
    });
});
$('#profileSearch').addEventListener('input',function(){
    var q=this.value.trim();
    renderProfiles(currentProfileTab,q);
});

// ======================== SKIN SHOP ========================
function tplPreviewHtml(id){
    var s='rgba(255,255,255,.25)',f='rgba(255,255,255,.55)',h='rgba(255,255,255,.4)',r='border-radius:3px;';
    var base='display:flex;flex-direction:column;width:100%;height:100%;padding:6px;gap:3px;';
    var row='display:flex;gap:3px;flex:1;';
    switch(id){
        case 'spotlight':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:0 0 16%;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div><div style="flex:0 0 16%;background:'+s+';'+r+'"></div></div></div>';
        case 'panorama':return '<div style="'+base+'"><div style="height:28%;background:'+h+';'+r+'flex:none;"></div><div style="'+row+'"><div style="flex:0 0 25%;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div></div></div>';
        case 'compact':return '<div style="'+base+'align-items:center;"><div style="width:50%;flex:1;background:'+f+';'+r+'"></div></div>';
        case 'reverse':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:0 0 18%;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div><div style="flex:0 0 22%;background:'+s+';'+r+'"></div></div></div>';
        case 'dashboard':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:0 0 28%;display:flex;flex-direction:column;gap:3px;"><div style="flex:1;background:'+s+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div><div style="flex:1;background:'+f+';'+r+'"></div></div></div>';
        case 'cinema':return '<div style="'+base+'"><div style="flex:2;background:'+f+';'+r+'"></div><div style="display:flex;gap:3px;flex:1;"><div style="flex:1;background:'+s+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div></div>';
        case 'magazine':return '<div style="'+base+'"><div style="height:25%;background:'+h+';'+r+'flex:none;"></div><div style="display:flex;gap:3px;flex:1;"><div style="flex:1;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div></div>';
        case 'zen':return '<div style="'+base+'align-items:center;"><div style="width:55%;flex:1;background:'+f+';'+r+'"></div></div>';
        case 'widescreen':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:1;background:'+f+';'+r+'"></div><div style="flex:0 0 22%;background:'+s+';'+r+'"></div></div></div>';
        case 'duo':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:0 0 35%;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div></div></div>';
        case 'headline':return '<div style="'+base+'"><div style="height:30%;background:'+h+';'+r+'flex:none;"></div><div style="flex:1;background:'+f+';'+r+'"></div></div>';
        case 'stack':return '<div style="'+base+'"><div style="flex:1;background:'+h+';'+r+'"></div><div style="flex:2;background:'+f+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div>';
        case 'focus':return '<div style="'+base+'align-items:center;"><div style="width:80%;flex:1;background:'+f+';'+r+'"></div></div>';
        case 'grid':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:1;background:'+f+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div></div>';
        case 'journal':return '<div style="'+base+'align-items:center;"><div style="width:38%;flex:1;background:'+f+';'+r+'"></div></div>';
        case 'wing':return '<div style="'+base+'"><div style="'+row+'"><div style="flex:0 0 40%;background:'+s+';'+r+'"></div><div style="flex:1;background:'+f+';'+r+'"></div></div></div>';
        case 'hub':return '<div style="'+base+'align-items:center;"><div style="width:55%;flex:1;background:'+f+';'+r+'"></div></div>';
        case 'stream':return '<div style="'+base+'"><div style="height:18%;background:'+h+';'+r+'flex:none;"></div><div style="display:flex;gap:3px;height:14%;flex:none;"><div style="width:18px;height:18px;border-radius:50%;background:'+s+';flex:none;"></div><div style="flex:1;background:'+s+';'+r+'"></div></div><div style="height:12%;background:'+s+';'+r+'flex:none;"></div><div style="display:flex;gap:3px;height:14%;flex:none;"><div style="flex:1;background:'+s+';'+r+'"></div><div style="flex:1;background:'+s+';'+r+'"></div></div><div style="flex:1;background:'+f+';'+r+'"></div></div>';
        default:return '<i class="fas fa-table-columns" style="font-size:36px;color:rgba(255,255,255,.9);"></i>';
    }
}
function navPreviewHtml(id){
    var n='rgba(255,255,255,.6)',c='rgba(255,255,255,.2)',r='border-radius:2px;';
    var wrap='width:100%;height:100%;position:relative;display:flex;flex-direction:column;padding:4px;';
    switch(id){
        case 'metro':return '<div style="'+wrap+'flex-direction:row;gap:3px;"><div style="width:22%;background:'+n+';'+r+'"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'dock':return '<div style="'+wrap+'gap:3px;"><div style="height:10%;background:'+n+';'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div><div style="height:14%;background:'+n+';'+r+'flex:none;"></div></div>';
        case 'float':return '<div style="'+wrap+'gap:3px;padding:8px 10px 4px;"><div style="height:10%;background:'+n+';border-radius:8px;flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'pill':return '<div style="'+wrap+'gap:3px;align-items:center;"><div style="flex:1;width:100%;background:'+c+';'+r+'"></div><div style="height:12%;width:55%;background:'+n+';border-radius:10px;flex:none;"></div></div>';
        case 'rail':return '<div style="'+wrap+'flex-direction:row;gap:3px;"><div style="width:10%;background:'+n+';'+r+'"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'shelf':return '<div style="'+wrap+'gap:3px;"><div style="height:10%;background:'+n+';'+r+'flex:none;"></div><div style="height:8%;background:rgba(255,255,255,.4);'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'slim':return '<div style="'+wrap+'gap:3px;"><div style="height:6%;background:'+n+';'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'horizon':return '<div style="'+wrap+'gap:3px;"><div style="flex:1;background:'+c+';'+r+'"></div><div style="height:14%;background:'+n+';border-radius:6px 6px 0 0;flex:none;"></div></div>';
        case 'mirror':return '<div style="'+wrap+'flex-direction:row;gap:3px;"><div style="flex:1;background:'+c+';'+r+'"></div><div style="width:22%;background:'+n+';'+r+'"></div></div>';
        case 'island':return '<div style="'+wrap+'gap:3px;"><div style="display:flex;gap:4px;height:10%;flex:none;"><div style="flex:1;background:'+n+';border-radius:6px;"></div><div style="flex:2;background:'+n+';border-radius:6px;"></div><div style="flex:1;background:'+n+';border-radius:6px;"></div></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'ribbon':return '<div style="'+wrap+'gap:3px;"><div style="height:7%;background:'+n+';'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'glass':return '<div style="'+wrap+'gap:3px;"><div style="height:10%;background:rgba(255,255,255,.3);'+r+'flex:none;border:1px solid rgba(255,255,255,.25);"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'split':return '<div style="'+wrap+'gap:3px;"><div style="height:10%;background:'+n+';'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div><div style="height:12%;background:'+n+';'+r+'flex:none;"></div></div>';
        case 'minimal':return '<div style="'+wrap+'gap:3px;"><div style="height:10%;background:rgba(255,255,255,.15);'+r+'flex:none;"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'arcade':return '<div style="'+wrap+'gap:3px;"><div style="height:14%;background:'+n+';'+r+'flex:none;border-bottom:3px solid rgba(0,0,0,.3);"></div><div style="flex:1;background:'+c+';'+r+'"></div></div>';
        case 'wheel':return '<div style="'+wrap+'gap:3px;"><div style="flex:1;background:'+c+';'+r+'"></div><div style="height:14%;background:'+n+';border-radius:6px 6px 0 0;flex:none;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;"><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);"></div><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);"></div><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.9);"></div><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);"></div><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);"></div></div></div>';
        default:return '<i class="fas fa-bars-staggered" style="font-size:36px;color:rgba(255,255,255,.9);"></i>';
    }
}
function shopCard(preview,body){return '<div class="skin-card"><div class="skin-preview" style="background:'+preview+';">'+body+'</div>';}
function shopBuy(owned,price,cls,attr,tryType,tryId){
    if(owned) return '<button class="btn btn-disabled">Owned</button>';
    var trying=_tryOnActive&&_tryOnActive.type===tryType&&_tryOnActive.id===tryId;
    var canBuy=_hasInfinity()||state.coins>=price;
    return '<div class="skin-price"><i class="fas fa-coins"></i> '+(_hasInfinity()?'Free':price+' Coins')+'</div><div class="shop-card-actions"><button class="btn btn-outline try-on-btn'+(trying?' trying':'')+'" data-try-type="'+tryType+'" data-try-id="'+tryId+'">'+(trying?'Trying':'Try On')+'</button><button class="btn '+(canBuy?'btn-primary':'btn-disabled')+' '+cls+'" '+attr+(canBuy?'':' disabled')+'>Buy</button></div>';
}
var currentShopTab=null;
var _skinPageView='shop'; // 'shop' or 'mine'
var _tryOnSnapshot=null;
var _tryOnActive=null;

function revertTryOn(){
    if(!_tryOnSnapshot) return;
    applySkin(_tryOnSnapshot.activeSkin||null,true);
    if(_tryOnSnapshot.activePremiumSkin) applyPremiumSkin(_tryOnSnapshot.activePremiumSkin,true);
    applyFont(_tryOnSnapshot.activeFont||null,true);
    applyLogo(_tryOnSnapshot.activeLogo||null);
    applyIconSet(_tryOnSnapshot.activeIconSet||null,true);
    applyCoinSkin(_tryOnSnapshot.activeCoinSkin||null,true);
    applyTemplate(_tryOnSnapshot.activeTemplate||null,true);
    applyNavStyle(_tryOnSnapshot.activeNavStyle||null,true);
    // Restore leaked state values
    state.activeLogo=_tryOnSnapshot.activeLogo;
    state.activeIconSet=_tryOnSnapshot.activeIconSet;
    state.activeCoinSkin=_tryOnSnapshot.activeCoinSkin;
    state.activeNavStyle=_tryOnSnapshot.activeNavStyle;
    _tryOnSnapshot=null;
    _tryOnActive=null;
    $$('.try-on-btn').forEach(function(b){b.classList.remove('trying');b.textContent='Try On';});
}

function doTryOn(type,id){
    // Take snapshot before first try-on
    if(!_tryOnSnapshot){
        _tryOnSnapshot={
            activeSkin:state.activeSkin,
            activePremiumSkin:state.activePremiumSkin,
            activeFont:state.activeFont,
            activeLogo:state.activeLogo,
            activeIconSet:state.activeIconSet,
            activeCoinSkin:state.activeCoinSkin,
            activeTemplate:state.activeTemplate,
            activeNavStyle:state.activeNavStyle
        };
    }
    // Toggle off if same item
    if(_tryOnActive&&_tryOnActive.type===type&&_tryOnActive.id===id){
        revertTryOn();
        return;
    }
    // Apply the item visually
    switch(type){
        case'skin':applySkin(id,true);break;
        case'premium':applyPremiumSkin(id,true);break;
        case'font':applyFont(id,true);break;
        case'logo':applyLogo(id);break;
        case'icons':applyIconSet(id,true);break;
        case'coins':applyCoinSkin(id,true);break;
        case'template':applyTemplate(id,true);break;
        case'navstyle':applyNavStyle(id,true);break;
    }
    // Restore leaked state values from snapshot
    state.activeLogo=_tryOnSnapshot.activeLogo;
    state.activeIconSet=_tryOnSnapshot.activeIconSet;
    state.activeCoinSkin=_tryOnSnapshot.activeCoinSkin;
    state.activeNavStyle=_tryOnSnapshot.activeNavStyle;
    _tryOnActive={type:type,id:id};
    // Update button visuals
    $$('.try-on-btn').forEach(function(b){
        var match=b.dataset.tryType===type&&b.dataset.tryId===id;
        b.classList.toggle('trying',match);
        b.textContent=match?'Trying':'Try On';
    });
}
function getShopCategories(){
    var cats=[];
    cats.push({key:'basic',label:'<i class="fas fa-palette"></i> Basic Skins',items:skins,render:function(s){return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="skin-preview-inner" style="color:#333;background:#fff;">Profile Preview</div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';">'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p>'+shopBuy(state.ownedSkins[s.id],s.price,'buy-skin-btn','data-sid="'+s.id+'"','skin',s.id)+'</div></div>';}});
    cats.push({key:'premium',label:'<i class="fas fa-gem"></i> Premium Skins',items:premiumSkins,render:function(s){return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="premium-preview-frame" style="background:'+s.border+';"><img src="images/default-avatar.svg" class="premium-preview-avatar"></div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';"><i class="fas '+s.icon+'" style="color:'+s.iconColor+';margin-right:6px;"></i>'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p>'+shopBuy(state.ownedPremiumSkins[s.id],s.price,'buy-premium-btn','data-pid="'+s.id+'"','premium',s.id)+'</div></div>';}});
    cats.push({key:'fonts',label:'<i class="fas fa-font"></i> Font Styles',items:fonts,render:function(f){return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#667eea,#764ba2);"><span style="font-family:\''+f.family+'\',sans-serif;color:#fff;font-size:24px;">Aa Bb Cc</span></div><div class="skin-card-body"><h4 style="font-family:\''+f.family+'\',sans-serif;">'+f.name+'</h4><p>'+f.desc+'</p>'+shopBuy(state.ownedFonts[f.id],f.price,'buy-font-btn','data-fid="'+f.id+'"','font',f.id)+'</div></div>';}});
    cats.push({key:'logos',label:'<i class="fas fa-star"></i> Logo Styles',items:logos,render:function(l){var preview=l.img?'<img src="'+l.img+'" style="height:80px;object-fit:contain;">':'<span style="color:#fff;font-size:22px;font-weight:700;">'+(l.text||'')+'</span>';return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#f093fb,#f5576c);display:flex;align-items:center;justify-content:center;">'+preview+'</div><div class="skin-card-body"><h4>'+l.name+'</h4><p>'+l.desc+'</p>'+shopBuy(state.ownedLogos[l.id],l.price,'buy-logo-btn','data-lid="'+l.id+'"','logo',l.id)+'</div></div>';}});
    cats.push({key:'icons',label:'<i class="fas fa-icons"></i> Icon Sets',items:iconSets,render:function(s){var prev='';Object.keys(s.icons).slice(0,5).forEach(function(k){prev+='<i class="fas '+s.icons[k]+'" style="margin:0 4px;font-size:18px;"></i>';});return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div style="color:#fff;">'+prev+'</div></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p>'+shopBuy(state.ownedIconSets[s.id],s.price,'buy-icon-btn','data-iid="'+s.id+'"','icons',s.id)+'</div></div>';}});
    cats.push({key:'coins',label:'<i class="fas fa-coins"></i> Coin Skins',items:coinSkins,render:function(s){return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><i class="fas '+s.icon+'" style="font-size:36px;color:'+s.color+';"></i></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p>'+shopBuy(state.ownedCoinSkins[s.id],s.price,'buy-coin-btn','data-cid="'+s.id+'"','coins',s.id)+'</div></div>';}});
    if(window.innerWidth>768) cats.push({key:'templates',label:'<i class="fas fa-table-columns"></i> Templates',items:templates,render:function(t){return '<div class="skin-card"><div class="skin-preview" style="background:'+t.preview+';">'+tplPreviewHtml(t.id)+'</div><div class="skin-card-body"><h4>'+t.name+'</h4><p>'+t.desc+'</p>'+shopBuy(state.ownedTemplates[t.id],t.price,'buy-tpl-btn','data-tid="'+t.id+'"','template',t.id)+'</div></div>';}});
    cats.push({key:'navstyles',label:'<i class="fas fa-bars-staggered"></i> Nav Styles',items:navStyles,render:function(n){return '<div class="skin-card"><div class="skin-preview" style="background:'+n.preview+';">'+navPreviewHtml(n.id)+'</div><div class="skin-card-body"><h4>'+n.name+'</h4><p>'+n.desc+'</p>'+shopBuy(state.ownedNavStyles[n.id],n.price,'buy-nav-btn','data-nid="'+n.id+'"','navstyle',n.id)+'</div></div>';}});
    // Songs tab (loaded from DB) — shop only shows buy, not set
    if(_shopSongs&&_shopSongs.length){
        cats.push({key:'songs',label:'<i class="fas fa-music"></i> Songs',items:_shopSongs,render:function(s){
            var owned=_shopOwnedSongs&&_shopOwnedSongs[s.id];
            var buyHtml='';
            if(owned) buyHtml='<button class="btn btn-disabled">Owned</button>';
            else buyHtml='<div class="skin-price"><i class="fas fa-coins"></i> '+(_hasInfinity()?'Free':s.price+' Coins')+'</div><button class="btn '+(_hasInfinity()||state.coins>=s.price?'btn-primary':'btn-disabled')+' buy-song-btn" data-song-id="'+s.id+'" data-price="'+s.price+'"'+(_hasInfinity()||state.coins>=s.price?'':' disabled')+'>Buy</button>';
            return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-music" style="font-size:32px;color:var(--primary);"></i><button class="song-preview-btn" data-url="'+escapeHtml(s.file_url)+'" style="background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;"><i class="fas fa-play"></i></button></div><div class="skin-card-body"><h4>'+escapeHtml(s.title)+'</h4><p>'+(s.genre||'BlipVibe Original')+'</p>'+buyHtml+'</div></div>';
        }});
    }
    return cats;
}
function renderSkinPage(){
    var shopView=$('#skinShopView');
    var mineView=$('#mySkinView');
    if(_skinPageView==='mine'){
        revertTryOn();
        shopView.style.display='none';mineView.style.display='';
        renderMySkins();
    } else {
        shopView.style.display='';mineView.style.display='none';
        if(!_shopSongsLoaded){_loadShopSongs().then(function(){renderShop();});}
        else renderShop();
    }
    $$('#skinPageToggle .search-tab').forEach(function(t){t.classList.toggle('active',t.dataset.skinView===_skinPageView);});
    $$('#skinPageToggle .search-tab').forEach(function(btn){
        btn.onclick=function(){
            if(btn.dataset.skinView===_skinPageView) return;
            _skinPageView=btn.dataset.skinView;
            stopSongPreview();renderSkinPage();
        };
    });
}
var _shopSongs=[];var _shopOwnedSongs={};var _shopSongsLoaded=false;
var _shopPreviewAudio=null;
var _wasPlayingBeforePreview=false;
var _previewTimeout=null;
function startSongPreview(url,btn){
    // Stop any existing preview
    stopSongPreview();
    // Pause the global player if playing
    var currentAudio=_getCurrentAudio();
    if(currentAudio&&!currentAudio.paused){
        _wasPlayingBeforePreview=true;
        _fadeAudio(currentAudio,currentAudio.volume,0,300,function(){currentAudio.pause();});
    }
    // Start preview (15 second limit)
    _shopPreviewAudio=new Audio(url);
    _shopPreviewAudio.volume=0;
    _shopPreviewAudio.play().then(function(){
        _fadeAudio(_shopPreviewAudio,0,0.5,300,null);
    }).catch(function(){});
    if(btn) btn.querySelector('i').className='fas fa-pause';
    // Auto-stop after 15 seconds with fade out
    _previewTimeout=setTimeout(function(){
        if(_shopPreviewAudio){
            _fadeAudio(_shopPreviewAudio,_shopPreviewAudio.volume,0,500,function(){stopSongPreview();});
        }
    },15000);
    _shopPreviewAudio.addEventListener('ended',function(){
        stopSongPreview();
        $$('.song-preview-btn i').forEach(function(i){i.className='fas fa-play';});
    });
}
function stopSongPreview(){
    clearTimeout(_previewTimeout);_previewTimeout=null;
    if(_shopPreviewAudio){
        _shopPreviewAudio.pause();
        _shopPreviewAudio=null;
    }
    $$('.song-preview-btn i').forEach(function(i){i.className='fas fa-play';});
    // Resume global player if it was playing before
    if(_wasPlayingBeforePreview){
        _wasPlayingBeforePreview=false;
        var currentAudio=_getCurrentAudio();
        if(currentAudio&&currentAudio.paused){
            currentAudio.volume=0;currentAudio.play();
            _fadeAudio(currentAudio,0,_gmpBaseVol,800,function(){
                var t=document.getElementById('gmpTitle');
                var a=document.getElementById('gmpArtist');
                _updateGlobalPlayer(t?t.textContent:null,a?a.textContent:null,true);
            });
        }
    }
}
function handleSongPreviewClick(e,btn){
    e.stopPropagation();
    var url=btn.dataset.url;
    // If this button is currently playing, stop it
    if(btn.querySelector('i').classList.contains('fa-pause')){
        stopSongPreview();
        return;
    }
    // Stop any other preview first
    stopSongPreview();
    startSongPreview(url,btn);
}
async function _loadShopSongs(){
    if(_shopSongsLoaded) return;
    try{
        _shopSongs=await sbGetMusicLibrary();
        var owned=await sbGetUserSongs(currentUser.id);
        owned.forEach(function(sid){_shopOwnedSongs[sid]=true;});
        _shopSongsLoaded=true;
    }catch(e){}
}
function renderShop(){
    var cats=getShopCategories();
    if(!currentShopTab) currentShopTab=cats[0].key;
    var tabsHtml='';
    cats.forEach(function(c){tabsHtml+='<button class="search-tab'+(c.key===currentShopTab?' active':'')+'" data-stab="'+c.key+'">'+c.label+'</button>';});
    $('#shopTabs').innerHTML=tabsHtml;
    var active=cats.find(function(c){return c.key===currentShopTab;});
    var html='<div class="shop-scroll-row scroll-2row">';
    active.items.forEach(function(item){html+=active.render(item);});
    html+='</div>';
    $('#shopGrid').innerHTML=html;
    function shopPurchased(btn,tryType,tryId){
        var body=btn.closest('.skin-card-body');
        var priceEl=body.querySelector('.skin-price');if(priceEl)priceEl.remove();
        var actions=body.querySelector('.shop-card-actions');
        if(actions){var owned=document.createElement('button');owned.className='btn btn-disabled';owned.textContent='Owned';owned.disabled=true;actions.replaceWith(owned);}
        else{btn.className='btn btn-disabled';btn.textContent='Owned';btn.disabled=true;btn.replaceWith(btn.cloneNode(true));}
        // If buying the item currently being tried on, keep it applied — clear try-on state without reverting
        if(_tryOnActive&&_tryOnActive.type===tryType&&_tryOnActive.id===tryId){_tryOnSnapshot=null;_tryOnActive=null;}
        renderMySkins();saveState();
    }
    $$('.buy-skin-btn').forEach(function(btn){btn.addEventListener('click',function(){var sid=btn.getAttribute('data-sid');var skin=skins.find(function(s){return s.id===sid;});if(_hasInfinity()||state.coins>=skin.price){if(!_hasInfinity())state.coins-=skin.price;state.ownedSkins[sid]=true;updateCoins();shopPurchased(btn,'skin',sid);addNotification('skin','You purchased the "'+skin.name+'" skin!');}});});
    $$('.buy-font-btn').forEach(function(btn){btn.addEventListener('click',function(){var fid=btn.getAttribute('data-fid');var font=fonts.find(function(f){return f.id===fid;});if(_hasInfinity()||state.coins>=font.price){if(!_hasInfinity())state.coins-=font.price;state.ownedFonts[fid]=true;updateCoins();shopPurchased(btn,'font',fid);addNotification('skin','You purchased the "'+font.name+'" font!');}});});
    $$('.buy-logo-btn').forEach(function(btn){btn.addEventListener('click',function(){var lid=btn.getAttribute('data-lid');var logo=logos.find(function(l){return l.id===lid;});if(_hasInfinity()||state.coins>=logo.price){if(!_hasInfinity())state.coins-=logo.price;state.ownedLogos[lid]=true;updateCoins();shopPurchased(btn,'logo',lid);addNotification('skin','You purchased the "'+logo.name+'" logo!');}});});
    $$('.buy-icon-btn').forEach(function(btn){btn.addEventListener('click',function(){var iid=btn.getAttribute('data-iid');var s=iconSets.find(function(x){return x.id===iid;});if(_hasInfinity()||state.coins>=s.price){if(!_hasInfinity())state.coins-=s.price;state.ownedIconSets[iid]=true;updateCoins();shopPurchased(btn,'icons',iid);addNotification('skin','You purchased the "'+s.name+'" icon set!');}});});
    $$('.buy-coin-btn').forEach(function(btn){btn.addEventListener('click',function(){var cid=btn.getAttribute('data-cid');var s=coinSkins.find(function(x){return x.id===cid;});if(_hasInfinity()||state.coins>=s.price){if(!_hasInfinity())state.coins-=s.price;state.ownedCoinSkins[cid]=true;updateCoins();shopPurchased(btn,'coins',cid);addNotification('skin','You purchased the "'+s.name+'" coin skin!');}});});
    $$('.buy-tpl-btn').forEach(function(btn){btn.addEventListener('click',function(){var tid=btn.getAttribute('data-tid');var t=templates.find(function(x){return x.id===tid;});if(_hasInfinity()||state.coins>=t.price){if(!_hasInfinity())state.coins-=t.price;state.ownedTemplates[tid]=true;updateCoins();shopPurchased(btn,'template',tid);addNotification('skin','You purchased the "'+t.name+'" template!');}});});
    $$('.buy-premium-btn').forEach(function(btn){btn.addEventListener('click',function(){var pid=btn.getAttribute('data-pid');var skin=premiumSkins.find(function(s){return s.id===pid;});if(_hasInfinity()||state.coins>=skin.price){if(!_hasInfinity())state.coins-=skin.price;state.ownedPremiumSkins[pid]=true;updateCoins();shopPurchased(btn,'premium',pid);addNotification('skin','You purchased the "'+skin.name+'" premium skin!');}});});
    $$('.buy-nav-btn').forEach(function(btn){btn.addEventListener('click',function(){var nid=btn.getAttribute('data-nid');var n=navStyles.find(function(x){return x.id===nid;});if(_hasInfinity()||state.coins>=n.price){if(!_hasInfinity())state.coins-=n.price;state.ownedNavStyles[nid]=true;updateCoins();shopPurchased(btn,'navstyle',nid);addNotification('skin','You purchased the "'+n.name+'" nav style!');}});});
    // Try On button handlers
    $$('.try-on-btn').forEach(function(btn){btn.addEventListener('click',function(){doTryOn(btn.dataset.tryType,btn.dataset.tryId);});});
    // Song preview buttons
    $$('.song-preview-btn').forEach(function(btn){btn.addEventListener('click',function(e){handleSongPreviewClick(e,btn);
    });});
    // Song buy buttons
    $$('.buy-song-btn').forEach(function(btn){btn.addEventListener('click',async function(){
        var sid=btn.dataset.songId;var price=parseInt(btn.dataset.price);
        if(!_hasInfinity()&&state.coins<price){showToast('Not enough coins');return;}
        btn.disabled=true;btn.textContent='...';
        try{
            if(!_hasInfinity()){state.coins-=price;updateCoins();}
            await sbPurchaseSong(currentUser.id,sid);
            await sbSetProfileSong(currentUser.id,sid);
            currentUser.profile_song_id=sid;_shopOwnedSongs[sid]=true;
            saveState();showToast('Song purchased and set as profile song!');refreshMyProfileMusic();renderShop();
        }catch(e){showToast('Failed: '+(e.message||'Error'));btn.disabled=false;}
    });});
    // Song set buttons (already owned)
    $$('.set-song-btn').forEach(function(btn){btn.addEventListener('click',async function(){
        var sid=btn.dataset.songId;
        btn.disabled=true;btn.textContent='...';
        try{
            await sbSetProfileSong(currentUser.id,sid);
            currentUser.profile_song_id=sid;saveState();
            showToast('Profile song updated!');refreshMyProfileMusic();renderShop();
        }catch(e){showToast('Failed');btn.disabled=false;}
    });});
    initDragScroll('#shopGrid');
    initDragScroll('#shopTabs');
    $$('#shopTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        $$('#shopTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');currentShopTab=tab.dataset.stab;stopSongPreview();renderShop();
    });});
}

// ======================== GROUP SHOP ========================
function syncGroupSkinData(groupId){
    var sd={};
    if(state.groupActiveSkin[groupId]) sd.activeSkin=state.groupActiveSkin[groupId];
    if(state.groupActivePremiumSkin[groupId]) sd.activePremiumSkin=state.groupActivePremiumSkin[groupId];
    if(state.groupActiveFont[groupId]) sd.activeFont=state.groupActiveFont[groupId];
    if(state.groupPremiumBg[groupId]&&state.groupPremiumBg[groupId].src) sd.premiumBg=state.groupPremiumBg[groupId];
    if(state.groupOwnedSkins[groupId]) sd.ownedSkins=state.groupOwnedSkins[groupId];
    if(state.groupOwnedPremiumSkins[groupId]) sd.ownedPremiumSkins=state.groupOwnedPremiumSkins[groupId];
    if(state.groupOwnedFonts[groupId]) sd.ownedFonts=state.groupOwnedFonts[groupId];
    if(state.groupOwnedSongs&&state.groupOwnedSongs[groupId]) sd.ownedSongs=state.groupOwnedSongs[groupId];
    if(state.groupActiveSong&&state.groupActiveSong[groupId]) sd.activeSong=state.groupActiveSong[groupId];
    sbUpdateGroup(groupId,{skin_data:sd}).catch(function(e){console.error('syncGroupSkinData:',e);});
}
var currentGroupShopTab=null;

function groupShopBuy(groupId,owned,price,cls,attr){
    var gc=getGroupCoinCount(groupId);
    if(owned) return '<button class="btn btn-disabled">Owned</button>';
    return '<div class="skin-price"><i class="fas fa-coins" style="color:#f59e0b;"></i> '+price+' Group Coins</div><button class="btn '+(gc>=price?'btn-primary':'btn-disabled')+' '+cls+'" '+attr+(gc<price?' disabled':'')+'>Buy</button>';
}

function getGroupShopCategories(groupId,canManage){
    var cats=[];
    if(!state.groupOwnedSkins[groupId]) state.groupOwnedSkins[groupId]={};
    if(!state.groupOwnedPremiumSkins[groupId]) state.groupOwnedPremiumSkins[groupId]={};
    var _lockHtml=canManage?'':'<div style="font-size:11px;color:var(--muted);margin-top:4px;"><i class="fas fa-lock" style="margin-right:4px;"></i>Only admins &amp; mods can manage</div>';

    // Apply tab — FIRST tab, shows all owned items organized by type
    var ownedBasic=skins.filter(function(s){return state.groupOwnedSkins[groupId][s.id];});
    var ownedPrem=premiumSkins.filter(function(s){return state.groupOwnedPremiumSkins[groupId][s.id];});
    if(!state.groupOwnedFonts[groupId]) state.groupOwnedFonts[groupId]={};
    var ownedFontsG=fonts.filter(function(f){return state.groupOwnedFonts[groupId][f.id];});
    if(!state.groupOwnedSongs) state.groupOwnedSongs={};
    if(!state.groupOwnedSongs[groupId]) state.groupOwnedSongs[groupId]={};
    var ownedSongsG=(_shopSongs||[]).filter(function(s){return state.groupOwnedSongs[groupId][s.id];});
    var allOwnedItems=[].concat(ownedBasic,ownedPrem,ownedFontsG,ownedSongsG);
    // Apply tab uses a sub-filter stored in _groupApplyFilter
    if(!window._groupApplyFilter) window._groupApplyFilter='all';
    var _applyFilteredItems=[];
    var gaf=window._groupApplyFilter;
    if(gaf==='all'){window._groupApplyFilter=gaf='basic';}
    if(gaf==='basic') _applyFilteredItems=ownedBasic;
    else if(gaf==='premium') _applyFilteredItems=ownedPrem;
    else if(gaf==='fonts') _applyFilteredItems=ownedFontsG;
    else if(gaf==='songs') _applyFilteredItems=ownedSongsG;
    // The render prepends filter pills
    function _gpill(key,icon,has){
        if(!has) return '';
        var a=gaf===key;
        return '<button class="search-tab gapply-pill'+(a?' active':'')+'" data-gapply="'+key+'" style="min-width:36px;padding:6px 10px;font-size:14px;cursor:pointer;"><i class="fas '+icon+'"></i></button>';
    }
    var _applyPillsHtml='<div style="width:100%;display:flex;gap:4px;padding:4px 0 8px;justify-content:center;">'
        +_gpill('basic','fa-palette',true)
        +_gpill('premium','fa-gem',true)
        +_gpill('fonts','fa-font',true)
        +_gpill('songs','fa-music',true)
        +'</div>';
    // Prepend pills as first "item"
    var _applyItemsWithPills=[{_pillsHtml:_applyPillsHtml}].concat(_applyFilteredItems.length?_applyFilteredItems:[null]);
    cats.push({key:'apply',label:'<i class="fas fa-check-circle"></i> Apply',items:_applyItemsWithPills,render:function(item){
        if(!item) return '<div style="padding:24px;text-align:center;color:var(--muted);width:100%;"><i class="fas fa-palette" style="font-size:2rem;margin-bottom:8px;display:block;opacity:.4;"></i>No items owned in this category yet.</div>';
        if(item._pillsHtml) return item._pillsHtml;
        // Determine type
        var isSkin=skins.some(function(s){return s.id===item.id;});
        var isPremium=premiumSkins.some(function(s){return s.id===item.id;});
        var isFont=fonts.some(function(f){return f.id===item.id;});
        var isSong=(_shopSongs||[]).some(function(s){return s.id===item.id;});
        if(isSkin){
            var isActive=state.groupActiveSkin[groupId]===item.id;
            var applyBtn=!canManage?'<button class="btn btn-disabled">'+(isActive?'Active':'Locked')+'</button>':'<button class="btn '+(isActive?'btn-disabled':'btn-primary')+' apply-gskin-btn" data-sid="'+item.id+'" data-gid="'+groupId+'" data-premium="0">'+(isActive?'Active':'Apply')+'</button>';
            return '<div class="skin-card"><div class="skin-preview" style="background:'+item.preview+';"><div class="skin-preview-inner" style="color:#333;background:#fff;">Preview</div></div><div class="skin-card-body" style="background:'+(item.cardBg||'')+';"><h4 style="color:'+(item.cardText||'')+';">'+item.name+'</h4><p style="color:'+(item.cardMuted||'')+';">Basic Skin</p>'+applyBtn+'</div></div>';
        } else if(isPremium){
            var isActive=state.groupActivePremiumSkin[groupId]===item.id;
            var applyBtn=!canManage?'<button class="btn btn-disabled">'+(isActive?'Active':'Locked')+'</button>':'<button class="btn '+(isActive?'btn-disabled':'btn-primary')+' apply-gskin-btn" data-sid="'+item.id+'" data-gid="'+groupId+'" data-premium="1">'+(isActive?'Active':'Apply')+'</button>';
            return '<div class="skin-card"><div class="skin-preview" style="background:'+item.preview+';"><div class="premium-preview-frame" style="background:'+item.border+';"><img src="images/default-avatar.svg" class="premium-preview-avatar"></div></div><div class="skin-card-body" style="background:'+(item.cardBg||'')+';"><h4 style="color:'+(item.cardText||'')+';">'+(item.icon?'<i class="fas '+item.icon+'" style="color:'+item.iconColor+';margin-right:6px;"></i>':'')+item.name+'</h4><p style="color:'+(item.cardMuted||'')+';">Premium Skin</p>'+applyBtn+'</div></div>';
        } else if(isFont){
            var isActive=state.groupActiveFont[groupId]===item.id;
            var applyBtn=!canManage?'<button class="btn btn-disabled">'+(isActive?'Active':'Locked')+'</button>':'<button class="btn '+(isActive?'btn-disabled':'btn-primary')+' apply-gfont-btn" data-fid="'+item.id+'" data-gid="'+groupId+'">'+(isActive?'Active':'Apply')+'</button>';
            return '<div class="skin-card"><div class="skin-preview" style="display:flex;align-items:center;justify-content:center;font-family:\''+item.family+'\',sans-serif;font-size:18px;background:#f0f2f5;color:#333;">Aa Bb 123</div><div class="skin-card-body"><h4>'+item.name+'</h4><p>Font</p>'+applyBtn+'</div></div>';
        } else if(isSong){
            var isSongActive=state.groupActiveSong&&state.groupActiveSong[groupId]===item.id;
            var songApplyBtn;
            if(isSongActive) songApplyBtn='<button class="btn btn-disabled">Applied</button>';
            else if(!canManage) songApplyBtn='<button class="btn btn-disabled">Owned</button>';
            else songApplyBtn='<button class="btn btn-primary set-gsong-btn" data-song-id="'+item.id+'" data-gid="'+groupId+'">Set as Group Song</button>';
            return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-music" style="font-size:32px;color:var(--primary);"></i><button class="song-preview-btn" data-url="'+escapeHtml(item.file_url)+'" style="background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;"><i class="fas fa-play"></i></button></div><div class="skin-card-body"><h4>'+escapeHtml(item.title)+'</h4><p>Song</p>'+songApplyBtn+'</div></div>';
        }
        return '';
    }});

    cats.push({key:'basic',label:'<i class="fas fa-palette"></i> Basic Skins',items:skins,render:function(s){
        var buyHtml=canManage?groupShopBuy(groupId,state.groupOwnedSkins[groupId][s.id],s.price,'buy-gskin-btn','data-sid="'+s.id+'" data-gid="'+groupId+'"'):(state.groupOwnedSkins[groupId][s.id]?'<button class="btn btn-disabled">Owned</button>':_lockHtml);
        return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="skin-preview-inner" style="color:#333;background:#fff;">Preview</div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';">'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p>'+buyHtml+'</div></div>';
    }});

    cats.push({key:'premium',label:'<i class="fas fa-gem"></i> Premium Skins',items:premiumSkins,render:function(s){
        var buyHtml=canManage?groupShopBuy(groupId,state.groupOwnedPremiumSkins[groupId][s.id],s.price,'buy-gspremium-btn','data-pid="'+s.id+'" data-gid="'+groupId+'"'):(state.groupOwnedPremiumSkins[groupId][s.id]?'<button class="btn btn-disabled">Owned</button>':_lockHtml);
        return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="premium-preview-frame" style="background:'+s.border+';"><img src="images/default-avatar.svg" class="premium-preview-avatar"></div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';"><i class="fas '+s.icon+'" style="color:'+s.iconColor+';margin-right:6px;"></i>'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p>'+buyHtml+'</div></div>';
    }});

    // Fonts tab
    if(!state.groupOwnedFonts[groupId]) state.groupOwnedFonts[groupId]={};
    cats.push({key:'fonts',label:'<i class="fas fa-font"></i> Fonts',items:fonts,render:function(f){
        var owned=state.groupOwnedFonts[groupId][f.id];
        var isActive=state.groupActiveFont[groupId]===f.id;
        var btnHtml;
        if(!canManage){
            btnHtml=owned?(isActive?'<button class="btn btn-disabled">Active</button>':'<button class="btn btn-disabled">Owned</button>'):_lockHtml;
        } else {
            btnHtml=owned?'<button class="btn '+(isActive?'btn-disabled':'btn-primary')+' apply-gfont-btn" data-fid="'+f.id+'" data-gid="'+groupId+'">'+(isActive?'Active':'Apply')+'</button>':groupShopBuy(groupId,false,f.price,'buy-gfont-btn','data-fid="'+f.id+'" data-gid="'+groupId+'"');
        }
        return '<div class="skin-card"><div class="skin-preview" style="display:flex;align-items:center;justify-content:center;font-family:\''+f.family+'\',sans-serif;font-size:'+(f.scale?Math.round(18*f.scale):18)+'px;background:#f0f2f5;color:#333;">Aa Bb 123</div><div class="skin-card-body"><h4>'+f.name+'</h4><p>'+f.desc+'</p>'+btnHtml+'</div></div>';
    }});

    // Songs tab for groups (purchase)
    if(_shopSongs&&_shopSongs.length){
        if(!state.groupOwnedSongs) state.groupOwnedSongs={};
        if(!state.groupOwnedSongs[groupId]) state.groupOwnedSongs[groupId]={};
        cats.push({key:'songs',label:'<i class="fas fa-music"></i> Songs',items:_shopSongs,render:function(s){
            var owned=state.groupOwnedSongs[groupId][s.id];
            var buyHtml;
            if(!canManage){
                buyHtml=owned?'<button class="btn btn-disabled">Owned</button>':_lockHtml;
            } else {
                buyHtml=owned?'<button class="btn btn-disabled">Owned</button>':groupShopBuy(groupId,false,s.price,'buy-gsong-btn','data-song-id="'+s.id+'" data-gid="'+groupId+'"');
            }
            return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-music" style="font-size:32px;color:var(--primary);"></i><button class="song-preview-btn" data-url="'+escapeHtml(s.file_url)+'" style="background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;"><i class="fas fa-play"></i></button></div><div class="skin-card-body"><h4>'+escapeHtml(s.title)+'</h4><p>'+(s.genre||'BlipVibe Original')+'</p>'+buyHtml+'</div></div>';
        }});
    }

    return cats;
}

function renderGroupShop(groupId){
    var container=document.getElementById('gvShopContent');
    if(!container) return;
    var _grp=groups.find(function(g){return g.id===groupId;});
    var _canManage=_grp?canManageGroupSkins(_grp):false;
    var cats=getGroupShopCategories(groupId,_canManage);
    if(!currentGroupShopTab) currentGroupShopTab=cats[0].key;
    if(!cats.find(function(c){return c.key===currentGroupShopTab;})) currentGroupShopTab=cats[0].key;

    var tabsHtml='';
    cats.forEach(function(c){tabsHtml+='<button class="search-tab'+(c.key===currentGroupShopTab?' active':'')+'" data-gstab="'+c.key+'">'+c.label+'</button>';});
    document.getElementById('gvShopTabs').innerHTML=tabsHtml;

    var active=cats.find(function(c){return c.key===currentGroupShopTab;});
    var html='';
    // Render pills above the grid for Apply tab
    if(active.key==='apply'){
        active.items.forEach(function(item){if(item&&item._pillsHtml) html+=item._pillsHtml;});
    }
    html+='<div class="shop-scroll-row scroll-2row">';
    active.items.forEach(function(item){if(!item||!item._pillsHtml) html+=active.render(item);});
    html+='</div>';
    // Reset font button on fonts tab (admin/mod only)
    if(_canManage&&currentGroupShopTab==='fonts'&&state.groupActiveFont[groupId]){
        html+='<div style="margin-top:12px;text-align:center;"><button class="btn btn-outline" id="resetGroupFont" style="font-size:13px;"><i class="fas fa-undo" style="margin-right:6px;"></i>Reset to Default Font</button></div>';
    }
    // Group premium background controls (ONLY on apply tab with premium filter selected — admin/mod only)
    if(_canManage&&currentGroupShopTab==='apply'&&window._groupApplyFilter==='premium'&&state.groupActivePremiumSkin[groupId]){
        if(!state.groupPremiumBg[groupId]) state.groupPremiumBg[groupId]={};
        var _gbg=state.groupPremiumBg[groupId];
        var bgHtml='<div class="premium-bg-controls card" style="margin-top:16px;padding:16px;border-radius:12px;">';
        bgHtml+='<h4 class="card-heading" style="margin-bottom:10px;font-size:14px;"><i class="fas fa-image" style="margin-right:6px;color:var(--primary);"></i>Background Image</h4>';
        bgHtml+='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">';
        bgHtml+='<label class="btn btn-primary" style="cursor:pointer;font-size:13px;"><i class="fas fa-upload" style="margin-right:6px;"></i>Upload<input type="file" id="groupBgUpload" accept="image/*" style="display:none;"></label>';
        if(_gbg.src){
            bgHtml+='<button class="btn btn-outline" id="groupBgRemove" style="font-size:13px;"><i class="fas fa-trash" style="margin-right:6px;"></i>Remove</button>';
            bgHtml+='<img src="'+_gbg.src+'" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:2px solid currentColor;opacity:.7;">';
        }
        bgHtml+='</div>';
        bgHtml+='<div id="groupBgHistory" style="margin-top:10px;"></div>';
        if(_gbg.src){
            var _d=Math.round((_gbg.darkness||0)*100),_o=Math.round((_gbg.overlay||0)*100),_ct=Math.round((_gbg.cardTrans!=null?_gbg.cardTrans:0.1)*100);
            bgHtml+='<div style="margin-top:12px;"><label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-moon"></i>Darkness: <span id="gBgDarknessLabel">'+_d+'%</span></label>';
            bgHtml+='<input type="range" id="gBgDarknessSlider" min="0" max="80" value="'+_d+'" style="width:100%;margin-top:6px;accent-color:var(--primary);"></div>';
            bgHtml+='<div style="margin-top:10px;"><label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-droplet"></i>Frosted Glass: <span id="gBgOverlayLabel">'+_o+'%</span></label>';
            bgHtml+='<input type="range" id="gBgOverlaySlider" min="0" max="80" value="'+_o+'" style="width:100%;margin-top:6px;accent-color:var(--primary);"></div>';
            bgHtml+='<div style="margin-top:10px;"><label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-eye"></i>Card Transparency: <span id="gBgCardTransLabel">'+_ct+'%</span></label>';
            bgHtml+='<input type="range" id="gBgCardTransSlider" min="0" max="80" value="'+_ct+'" style="width:100%;margin-top:6px;accent-color:var(--primary);"></div>';
        }
        bgHtml+='</div>';
        html+=bgHtml;
    }
    container.innerHTML=html;

    function gShopPurchased(btn){var p=btn.parentElement;var priceEl=p.querySelector('.skin-price');if(priceEl)priceEl.remove();btn.className='btn btn-disabled';btn.textContent='Owned';btn.disabled=true;btn.replaceWith(btn.cloneNode(true));}

    $$('#gvShopContent .buy-gskin-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var sid=btn.getAttribute('data-sid');var gid=btn.getAttribute('data-gid');
        var skin=skins.find(function(s){return s.id===sid;});
        if(!skin) return;
        var gc=getGroupCoinCount(gid);
        if(gc>=skin.price){
            addGroupCoins(gid,-skin.price);
            if(!state.groupOwnedSkins[gid]) state.groupOwnedSkins[gid]={};
            state.groupOwnedSkins[gid][sid]=true;
            saveState();syncGroupSkinData(gid);
            gShopPurchased(btn);
            addNotification('skin','Group purchased the "'+skin.name+'" skin!');
        }
    });});

    $$('#gvShopContent .buy-gspremium-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var pid=btn.getAttribute('data-pid');var gid=btn.getAttribute('data-gid');
        var skin=premiumSkins.find(function(s){return s.id===pid;});
        if(!skin) return;
        var gc=getGroupCoinCount(gid);
        if(gc>=skin.price){
            addGroupCoins(gid,-skin.price);
            if(!state.groupOwnedPremiumSkins[gid]) state.groupOwnedPremiumSkins[gid]={};
            state.groupOwnedPremiumSkins[gid][pid]=true;
            saveState();syncGroupSkinData(gid);
            gShopPurchased(btn);
            addNotification('skin','Group purchased the "'+skin.name+'" premium skin!');
        }
    });});

    // Apply tab sub-filter pills
    $$('#gvShopContent .gapply-pill').forEach(function(pill){pill.addEventListener('click',function(){
        window._groupApplyFilter=pill.dataset.gapply;
        stopSongPreview();renderGroupShop(groupId);
    });});
    // Set group song handler
    $$('#gvShopContent .set-gsong-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var sid=btn.dataset.songId;var gid=btn.dataset.gid||groupId;
        if(!state.groupActiveSong) state.groupActiveSong={};
        state.groupActiveSong[gid]=sid;
        saveState();syncGroupSkinData(gid);
        // Play the group song immediately
        var song=(_shopSongs||[]).find(function(s){return s.id===sid;});
        if(song) switchToProfileSong(song);
        showToast('Group song set!');
        renderGroupShop(gid);
    });});

    $$('#gvShopContent .apply-gskin-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var sid=btn.getAttribute('data-sid');var gid=btn.getAttribute('data-gid');
        var isPremium=btn.getAttribute('data-premium')==='1';
        if(isPremium){state.groupActivePremiumSkin[gid]=sid;state.groupActiveSkin[gid]=null;}
        else{state.groupActiveSkin[gid]=sid;state.groupActivePremiumSkin[gid]=null;}
        applyGroupSkin(gid);renderGroupShop(gid);renderGroups();saveState();syncGroupSkinData(gid);
    });});

    // Font buy handlers
    $$('#gvShopContent .buy-gfont-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var fid=btn.getAttribute('data-fid');var gid=btn.getAttribute('data-gid');
        var font=fonts.find(function(f){return f.id===fid;});
        if(!font) return;
        var gc=getGroupCoinCount(gid);
        if(gc>=font.price){
            addGroupCoins(gid,-font.price);
            if(!state.groupOwnedFonts[gid]) state.groupOwnedFonts[gid]={};
            state.groupOwnedFonts[gid][fid]=true;
            saveState();syncGroupSkinData(gid);
            gShopPurchased(btn);
            addNotification('skin','Group purchased the "'+font.name+'" font!');
        }
    });});

    // Font apply handlers
    $$('#gvShopContent .apply-gfont-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var fid=btn.getAttribute('data-fid');var gid=btn.getAttribute('data-gid');
        state.groupActiveFont[gid]=fid;
        applyFont(fid,true);
        renderGroupShop(gid);saveState();syncGroupSkinData(gid);
    });});

    // Group song buy handlers
    $$('#gvShopContent .buy-gsong-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var sid=btn.getAttribute('data-song-id');var gid=btn.getAttribute('data-gid');
        var song=_shopSongs.find(function(s){return s.id===sid;});
        if(!song) return;
        var gc=getGroupCoinCount(gid);
        if(gc>=song.price){
            addGroupCoins(gid,-song.price);
            if(!state.groupOwnedSongs) state.groupOwnedSongs={};
            if(!state.groupOwnedSongs[gid]) state.groupOwnedSongs[gid]={};
            state.groupOwnedSongs[gid][sid]=true;
            saveState();syncGroupSkinData(gid);
            gShopPurchased(btn);
            addNotification('skin','Group purchased the "'+song.title+'" song!');
        }
    });});
    // Group song preview handlers
    $$('#gvShopContent .song-preview-btn').forEach(function(btn){btn.addEventListener('click',function(e){handleSongPreviewClick(e,btn);
    });});

    // Reset group font
    var resetFontBtn=document.getElementById('resetGroupFont');
    if(resetFontBtn) resetFontBtn.addEventListener('click',function(){
        state.groupActiveFont[groupId]=null;
        applyFont(null,true);
        renderGroupShop(groupId);saveState();syncGroupSkinData(groupId);
    });

    initDragScroll('#gvShopContent');

    // Group premium background handlers
    var _gBgUpload=document.getElementById('groupBgUpload');
    if(_gBgUpload){
        _gBgUpload.addEventListener('change',async function(){
            var file=_gBgUpload.files[0];if(!file||!currentUser)return;
            try{validateUploadFile(file,{maxSize:5*1024*1024,label:'Background'});}catch(ve){showToast(ve.message);return;}
            if(!state.groupPremiumBg[groupId]) state.groupPremiumBg[groupId]={};
            try{
                var ext=file.name.split('.').pop()||'jpg';
                var path='backgrounds/group_'+groupId+'/bg-'+Date.now()+'.'+ext;
                var url=await sbUploadFile('avatars',path,file);
                state.groupPremiumBg[groupId].src=url;
            }catch(e){
                console.warn('Group BG upload failed, using local:',e);
                var reader=new FileReader();
                reader.onload=function(ev){state.groupPremiumBg[groupId].src=ev.target.result;applyGroupSkin(groupId);renderGroupShop(groupId);saveState();syncGroupSkinData(groupId);};
                reader.readAsDataURL(file);return;
            }
            applyGroupSkin(groupId);renderGroupShop(groupId);saveState();syncGroupSkinData(groupId);
        });
    }
    // Load group background history thumbnails
    var gBgHistoryEl=document.getElementById('groupBgHistory');
    if(gBgHistoryEl){
        sbListGroupBackgrounds(groupId).then(function(bgs){
            if(!bgs||!bgs.length)return;
            var hh='<p style="font-size:12px;color:var(--gray);margin-bottom:6px;">Previous uploads:</p><div class="shop-scroll-row" style="gap:8px;padding:4px 0 8px;">';
            bgs.forEach(function(b,i){hh+='<img src="'+b.src+'" class="grp-bg-hist-thumb" data-idx="'+i+'" style="min-width:64px;max-width:64px;height:64px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;opacity:.8;">';});
            hh+='</div>';
            gBgHistoryEl.innerHTML=hh;
            initDragScroll('#groupBgHistory');
            var bgArr=bgs;
            $$('.grp-bg-hist-thumb').forEach(function(t){
                t.addEventListener('mouseenter',function(){t.style.borderColor='var(--primary)';t.style.opacity='1';});
                t.addEventListener('mouseleave',function(){t.style.borderColor='transparent';t.style.opacity='.8';});
                t.addEventListener('click',function(){
                    if(!state.groupPremiumBg[groupId]) state.groupPremiumBg[groupId]={};
                    state.groupPremiumBg[groupId].src=bgArr[parseInt(t.dataset.idx)].src;
                    applyGroupSkin(groupId);renderGroupShop(groupId);saveState();syncGroupSkinData(groupId);
                });
            });
        }).catch(function(e){console.warn('Group BG history load:',e);});
    }
    var _gBgRemove=document.getElementById('groupBgRemove');
    if(_gBgRemove){
        _gBgRemove.addEventListener('click',function(){
            state.groupPremiumBg[groupId]={};
            applyGroupSkin(groupId);renderGroupShop(groupId);saveState();syncGroupSkinData(groupId);
        });
    }
    var _gBgDSlider=document.getElementById('gBgDarknessSlider');
    if(_gBgDSlider){
        _gBgDSlider.addEventListener('input',function(){
            var v=parseInt(_gBgDSlider.value)/100;
            state.groupPremiumBg[groupId].darkness=v;
            document.getElementById('gBgDarknessLabel').textContent=Math.round(v*100)+'%';
            premiumBgDarkness=v;updatePremiumBg();
        });
        _gBgDSlider.addEventListener('change',function(){saveState();syncGroupSkinData(groupId);});
    }
    var _gBgOSlider=document.getElementById('gBgOverlaySlider');
    if(_gBgOSlider){
        _gBgOSlider.addEventListener('input',function(){
            var v=parseInt(_gBgOSlider.value)/100;
            state.groupPremiumBg[groupId].overlay=v;
            document.getElementById('gBgOverlayLabel').textContent=Math.round(v*100)+'%';
            premiumBgOverlay=v;updatePremiumBg();
        });
        _gBgOSlider.addEventListener('change',function(){saveState();syncGroupSkinData(groupId);});
    }
    var _gBgCTSlider=document.getElementById('gBgCardTransSlider');
    if(_gBgCTSlider){
        _gBgCTSlider.addEventListener('input',function(){
            var v=parseInt(_gBgCTSlider.value)/100;
            state.groupPremiumBg[groupId].cardTrans=v;
            document.getElementById('gBgCardTransLabel').textContent=Math.round(v*100)+'%';
            premiumCardTransparency=v;updatePremiumBg();
        });
        _gBgCTSlider.addEventListener('change',function(){saveState();syncGroupSkinData(groupId);});
    }

    $$('#gvShopTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        $$('#gvShopTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');currentGroupShopTab=tab.dataset.gstab;stopSongPreview();renderGroupShop(groupId);
    });});

}

function updateGroupCoinDisplay(gid){
    var el=document.getElementById('gvGroupCoinCount');if(el)el.textContent=getGroupCoinCount(gid);
    var el2=document.getElementById('gvGroupCoinCount2');if(el2)el2.textContent=getGroupCoinCount(gid);
}

var groupSkinBgs={
    classic:'#e8f6f5',midnight:'#1a1a2e',ocean:'#d0e8f7',forest:'#dceede',royal:'#ede0f3',
    sunset:'#fff3e0',cherry:'#fce4ec',slate:'#2c3a42',ember:'#fbe9e7',arctic:'#d8f3f6',moss:'#ecf4e2'
};
var groupSkinBanners={
    classic:'linear-gradient(135deg,#5cbdb9,#4aada9)',midnight:'#1a1a2e',ocean:'linear-gradient(135deg,#1976d2,#0d47a1)',
    forest:'linear-gradient(135deg,#2e7d32,#1b5e20)',royal:'linear-gradient(135deg,#7b1fa2,#4a148c)',
    sunset:'linear-gradient(135deg,#ef6c00,#e65100)',cherry:'linear-gradient(135deg,#d81b60,#c2185b)',
    slate:'linear-gradient(135deg,#37474f,#263238)',ember:'linear-gradient(135deg,#e64a19,#bf360c)',
    arctic:'linear-gradient(135deg,#00acc1,#00838f)',moss:'linear-gradient(135deg,#689f38,#558b2f)'
};
function applyGroupSkin(groupId){
    var gvPage=document.getElementById('page-group-view');
    var banner=document.getElementById('gvCoverBanner');
    var profileCover=gvPage.querySelector('.profile-cover');
    var iconWrap=gvPage.querySelector('.gv-icon-wrap');
    var grp=groups.find(function(g){return g.id===groupId;});
    var hasCover=grp&&grp.coverPhoto;
    // Save personal skin state once when entering group view
    if(!_gvSaved) _gvSaved={skin:state.activeSkin,premiumSkin:state.activePremiumSkin,font:state.activeFont,bgImage:premiumBgImage,bgOverlay:premiumBgOverlay,bgDarkness:premiumBgDarkness,cardTrans:premiumCardTransparency};
    // Reset premium bg — will re-apply group's own bg below if applicable
    premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;
    updatePremiumBg();
    // Reset ALL body-level skin state to prevent bleeding between groups
    skins.forEach(function(s){document.body.classList.remove('skin-'+s.id);});
    premiumSkins.forEach(function(s){document.body.classList.remove('premium-'+s.id);});
    document.body.classList.remove('premium-dark');
    // Reset CSS vars to default before applying group's skin
    var root=document.documentElement;
    root.style.setProperty('--primary','#8b5cf6');
    root.style.setProperty('--primary-hover','#7c3aed');
    root.style.setProperty('--nav-bg','#0f172a');
    setThemeVars(false);
    // Clear group-specific page classes
    skins.forEach(function(s){gvPage.classList.remove('gskin-'+s.id);});
    premiumSkins.forEach(function(s){gvPage.classList.remove('gpremium-'+s.id);});
    gvPage.classList.remove('gpremium-dark');
    gvPage.style.background='';
    if(banner&&!hasCover) banner.style.background='';
    if(profileCover) profileCover.style.background='';
    var activePremium=state.groupActivePremiumSkin[groupId];
    var activeBasic=state.groupActiveSkin[groupId];
    if(iconWrap) iconWrap.style.background=activePremium||activeBasic?'':'var(--primary)';
    if(activePremium){
        var skin=premiumSkins.find(function(s){return s.id===activePremium;});
        if(skin){gvPage.classList.add('gpremium-'+activePremium);if(skin.dark)gvPage.classList.add('gpremium-dark');}
        if(banner&&!hasCover) banner.style.background=skin?'var(--ps-bg)':'';
        if(profileCover) profileCover.style.background=skin?skin.preview:'';
        if(iconWrap) iconWrap.style.background=skin?skin.accent:'';
        applyPremiumSkin(activePremium,true);
        // Apply group's own premium background if set
        var gbg=state.groupPremiumBg[groupId];
        if(gbg&&gbg.src){
            premiumBgImage=gbg.src;
            premiumBgOverlay=gbg.overlay!=null?gbg.overlay:0;
            premiumBgDarkness=gbg.darkness!=null?gbg.darkness:0;
            premiumCardTransparency=gbg.cardTrans!=null?gbg.cardTrans:0.1;
            // updatePremiumBg requires state.activePremiumSkin to be set
            state.activePremiumSkin=activePremium;
            updatePremiumBg();
            // Make page transparent so premiumBgLayer shows through
            gvPage.style.background='transparent';
        } else {
            gvPage.style.background=skin?'var(--ps-bg)':'#f0f0f0';
        }
    } else if(activeBasic){
        gvPage.classList.add('gskin-'+activeBasic);
        gvPage.style.background=groupSkinBgs[activeBasic]||'';
        if(banner&&!hasCover) banner.style.background=groupSkinBanners[activeBasic]||'';
        if(profileCover) profileCover.style.background=groupSkinBanners[activeBasic]||'';
        if(iconWrap){var sc=skinColors[activeBasic];iconWrap.style.background=sc?sc.primary:(grp?grp.color:'');}
        applySkin(activeBasic,true);
    } else {
        applySkin(null,true);
    }
    // Apply group font (or reset to personal font)
    var gFont=state.groupActiveFont[groupId]||null;
    applyFont(gFont,true);
}

var skinColors={
    classic:{primary:'#5cbdb9',hover:'#4aada9',navBg:'#5cbdb9',light:true},
    midnight:{primary:'#e94560',hover:'#c73a52',navBg:'#16213e'},
    ocean:{primary:'#1976d2',hover:'#1565c0',navBg:'#1565c0',light:true},
    forest:{primary:'#2e7d32',hover:'#1b5e20',navBg:'#2e7d32',light:true},
    royal:{primary:'#7b1fa2',hover:'#6a1b9a',navBg:'#6a1b9a',light:true},
    sunset:{primary:'#ef6c00',hover:'#e65100',navBg:'#e65100',light:true},
    cherry:{primary:'#d81b60',hover:'#c2185b',navBg:'#c2185b',light:true},
    slate:{primary:'#78909c',hover:'#607d8b',navBg:'#37474f'},
    ember:{primary:'#e64a19',hover:'#bf360c',navBg:'#bf360c',light:true},
    arctic:{primary:'#00acc1',hover:'#00838f',navBg:'#00838f',light:true},
    moss:{primary:'#689f38',hover:'#558b2f',navBg:'#558b2f',light:true}
};

function setThemeVars(light){
    var root=document.documentElement;
    if(light){
        root.style.setProperty('--dark','#333');root.style.setProperty('--gray','#777');root.style.setProperty('--light-bg','#f0f0f0');
        root.style.setProperty('--card','#fff');root.style.setProperty('--border','#e8e8e8');
        root.style.setProperty('--shadow','0 2px 8px rgba(0,0,0,.08)');root.style.setProperty('--shadow-hover','0 4px 16px rgba(0,0,0,.12)');
        document.body.style.backgroundImage='none';
    } else {
        root.style.setProperty('--dark','#e2e8f0');root.style.setProperty('--gray','#94a3b8');root.style.setProperty('--light-bg','#0f172a');
        root.style.setProperty('--card','#1e293b');root.style.setProperty('--border','#334155');
        root.style.setProperty('--shadow','0 2px 8px rgba(0,0,0,.25)');root.style.setProperty('--shadow-hover','0 4px 16px rgba(0,0,0,.35)');
        document.body.style.backgroundImage='';
    }
}
function applySkin(skinId,silent){
    var card=$('#profileCard');
    var root=document.documentElement;
    skins.forEach(function(s){card.classList.remove('skin-'+s.id);document.body.classList.remove('skin-'+s.id);});
    premiumSkins.forEach(function(s){document.body.classList.remove('premium-'+s.id);});
    document.body.classList.remove('premium-dark');
    var avatars=document.querySelectorAll('#profileAvatarImg, .pv-profile-card .profile-avatar, .nav-avatar');
    avatars.forEach(function(av){av.classList.remove('premium-border');av.removeAttribute('data-premium');});
    if(!silent){state.activePremiumSkin=null;updatePremiumBg();}
    if(skinId&&skinId!=='default'){
        card.classList.add('skin-'+skinId);
        document.body.classList.add('skin-'+skinId);
        if(!silent) state.activeSkin=skinId;
        var colors=skinColors[skinId];
        if(colors){
            root.style.setProperty('--primary',colors.primary);
            root.style.setProperty('--primary-hover',colors.hover);
            root.style.setProperty('--nav-bg',colors.navBg||colors.primary);
            setThemeVars(!!colors.light);
        }
        if(!silent){var skin=skins.find(function(s){return s.id===skinId;});addNotification('skin','You applied the "'+skin.name+'" skin!');}
    } else {
        if(!silent) state.activeSkin=null;
        root.style.setProperty('--primary','#8b5cf6');
        root.style.setProperty('--primary-hover','#7c3aed');
        root.style.setProperty('--nav-bg','#0f172a');
        setThemeVars(false);
    }
}

function applyFont(fontId,silent){
    if(fontId){var f=fonts.find(function(x){return x.id===fontId;});document.body.style.fontFamily="'"+f.family+"',sans-serif";document.documentElement.style.setProperty('--font-scale',f.scale||1);if(!silent)state.activeFont=fontId;}
    else{document.body.style.fontFamily="'Roboto',sans-serif";document.documentElement.style.setProperty('--font-scale',1);if(!silent)state.activeFont=null;}
}

function applyLogo(logoId){
    var el=$('.nav-logo');
    if(logoId){
        var l=logos.find(function(x){return x.id===logoId;});
        if(l.img){el.innerHTML='<img src="'+l.img+'" alt="BlipVibe" class="nav-logo-img">';el.classList.add('nav-logo-image');}
        else{el.textContent=l.text;el.classList.remove('nav-logo-image');}
        state.activeLogo=logoId;
    } else{el.textContent='BlipVibe';state.activeLogo=null;el.classList.remove('nav-logo-image');}
}

function applyIconSet(setId,silent){
    var prev=JSON.parse(JSON.stringify(activeIcons));
    var icons=setId?iconSets.find(function(s){return s.id===setId;}).icons:defaultIcons;
    var newMap={};
    Object.keys(defaultIcons).forEach(function(k){newMap[k]=icons[k]||defaultIcons[k];});
    Object.keys(newMap).forEach(function(k){
        if(prev[k]!==newMap[k]){
            document.querySelectorAll('i.'+prev[k]).forEach(function(el){el.classList.remove(prev[k]);el.classList.add(newMap[k]);});
        }
    });
    // Update nav icons specifically (they use data-page)
    ['home','groups','profiles','shop','messages','notifications'].forEach(function(page){var el=document.querySelector('.nav-link[data-page="'+page+'"] i');if(el){el.className='fas '+newMap[page];}});
    activeIcons=newMap;
    state.activeIconSet=setId;
    if(setId&&!silent)addNotification('skin','You applied the "'+iconSets.find(function(s){return s.id===setId;}).name+'" icon set!');
}

function applyCoinSkin(skinId,silent){
    var icon=skinId?coinSkins.find(function(s){return s.id===skinId;}).icon:'fa-coins';
    var color=skinId?coinSkins.find(function(s){return s.id===skinId;}).color:'#ffd700';
    $$('.nav-coins i, .profile-coins i').forEach(function(el){el.className='fas '+icon;});
    document.querySelector('.nav-coins').style.color=color;
    state.activeCoinSkin=skinId;
    if(skinId&&!silent)addNotification('skin','You applied the "'+coinSkins.find(function(s){return s.id===skinId;}).name+'" coin skin!');
}

function applyTemplate(tplId,silent){
    templates.forEach(function(t){document.body.classList.remove('tpl-'+t.id);});
    // Mobile always uses cinema template regardless of selection
    var isMobile=window.innerWidth<=768;
    var effectiveId=isMobile?'cinema':tplId;
    if(effectiveId){document.body.classList.add('tpl-'+effectiveId);}
    if(!silent){
        if(tplId){state.activeTemplate=tplId;addNotification('skin','You applied the "'+templates.find(function(t){return t.id===tplId;}).name+'" template!');}
        else{state.activeTemplate=null;}
    }
}

function applyNavStyle(nsId,silent){
    _wheelCleanup();
    navStyles.forEach(function(n){document.body.classList.remove('nav-'+n.id);});
    if(nsId){document.body.classList.add('nav-'+nsId);state.activeNavStyle=nsId;if(!silent)addNotification('skin','You applied the "'+navStyles.find(function(n){return n.id===nsId;}).name+'" nav style!');}
    else{state.activeNavStyle=null;}
    requestAnimationFrame(syncNavPadding);
    if(nsId==='wheel'){requestAnimationFrame(function(){_wheelBind();_wheelCenterActive();_wheelUpdate();});}
}
function syncNavPadding(){
    var nav=document.querySelector('.navbar');
    var home=document.getElementById('page-home');
    if(!nav||!home)return;
    // Float & island have special floating cover layouts — skip
    var skip=['nav-float','nav-island','nav-slim'];
    for(var i=0;i<skip.length;i++){if(document.body.classList.contains(skip[i]))return;}
    var isMobile=window.innerWidth<=768;
    // Bottom / side nav styles — no top padding on desktop
    // On mobile, metro/rail/mirror/horizon convert to top bars and need padding
    var noTop=['nav-dock','nav-pill','nav-horizon','nav-metro','nav-rail','nav-mirror','nav-wheel'];
    var staysBottom=['nav-dock','nav-pill','nav-wheel'];
    for(var i=0;i<noTop.length;i++){
        if(document.body.classList.contains(noTop[i])){
            if(!isMobile){home.style.setProperty('padding-top','0px','important');return;}
            for(var j=0;j<staysBottom.length;j++){
                if(noTop[i]===staysBottom[j]){home.style.setProperty('padding-top','0px','important');return;}
            }
            break; // converted to top bar on mobile — fall through to measure
        }
    }
    // Top navbar (or mobile-converted top bar) — set padding to exact navbar height
    var h=nav.offsetHeight;
    if(h>0) home.style.setProperty('padding-top',h+'px','important');
}

// ========== NAV STYLE: WHEEL ==========
var _wheelRAF=null;
var _wheelBound=false;
function _wheelUpdate(){
    if(window.innerWidth>768||!document.body.classList.contains('nav-wheel'))return;
    var container=document.querySelector('.nav-center');
    if(!container)return;
    var cx=container.scrollLeft+container.offsetWidth/2;
    var links=container.querySelectorAll('.nav-link');
    links.forEach(function(link){
        var linkCx=link.offsetLeft+link.offsetWidth/2;
        var dist=Math.abs(cx-linkCx);
        var maxDist=container.offsetWidth*0.5;
        var ratio=Math.min(dist/maxDist,1);
        var scale=1.4-0.55*ratio;
        var opacity=1-0.5*ratio;
        var lift=-6*(1-ratio);
        link.style.transform='scale('+scale+') translateY('+lift+'px)';
        link.style.opacity=opacity;
    });
}
function _wheelCenterActive(){
    var container=document.querySelector('.nav-center');
    var active=container&&container.querySelector('.nav-link.active');
    if(active&&container){
        var scrollTo=active.offsetLeft-container.offsetWidth/2+active.offsetWidth/2;
        container.scrollTo({left:scrollTo,behavior:'smooth'});
    }
}
function _wheelBind(){
    if(_wheelBound)return;
    var container=document.querySelector('.nav-center');
    if(!container)return;
    container.addEventListener('scroll',function(){
        if(!_wheelRAF){_wheelRAF=requestAnimationFrame(function(){_wheelUpdate();_wheelRAF=null;});}
    });
    _wheelBound=true;
}
function _wheelCleanup(){
    document.querySelectorAll('.nav-link').forEach(function(l){l.style.transform='';l.style.opacity='';});
}

// Premium background (runtime only, no persistence)
var premiumBgImage=null;
var premiumBgOverlay=0;
var premiumBgDarkness=0;
var premiumCardTransparency=0.1;

function updatePremiumBg(){
    var layer=document.getElementById('premiumBgLayer');
    if(!layer)return;
    if(premiumBgImage&&state.activePremiumSkin){
        layer.style.backgroundImage='url('+premiumBgImage+')';
        layer.style.filter='';
        var overlay=document.getElementById('premiumBgOverlay');
        if(overlay){var blurPx=Math.round(premiumBgOverlay*25);overlay.style.backdropFilter='blur('+blurPx+'px)';overlay.style.webkitBackdropFilter='blur('+blurPx+'px)';}
        var darknessEl=document.getElementById('premiumBgDarkness');
        if(darknessEl) darknessEl.style.opacity=premiumBgDarkness;
        // Set card background opacity via CSS variable
        document.documentElement.style.setProperty('--card-opacity',Math.round((1-premiumCardTransparency)*100)+'%');
        layer.classList.add('active');
        document.body.classList.add('has-premium-bg');
    } else {
        layer.style.backgroundImage='';
        layer.style.filter='';
        document.documentElement.style.removeProperty('--card-opacity');
        layer.classList.remove('active');
        document.body.classList.remove('has-premium-bg');
    }
}

function applyPremiumSkin(skinId,silent){
    var root=document.documentElement;var card=$('#profileCard');
    // Clear all premium classes
    premiumSkins.forEach(function(s){document.body.classList.remove('premium-'+s.id);});
    document.body.classList.remove('premium-dark');
    var avatars=document.querySelectorAll('#profileAvatarImg, .pv-profile-card .profile-avatar, .nav-avatar');
    avatars.forEach(function(av){av.classList.remove('premium-border');av.removeAttribute('data-premium');});
    if(skinId&&skinId!=='default'){
        // Clear basic skin first
        skins.forEach(function(s){card.classList.remove('skin-'+s.id);document.body.classList.remove('skin-'+s.id);});
        if(!silent)state.activeSkin=null;
        // Apply premium
        var skin=premiumSkins.find(function(s){return s.id===skinId;});
        document.body.classList.add('premium-'+skinId);
        if(skin.dark) document.body.classList.add('premium-dark');
        root.style.setProperty('--primary',skin.accent);
        root.style.setProperty('--primary-hover',skin.accentHover);
        root.style.setProperty('--nav-bg',skin.accent);
        avatars.forEach(function(av){av.classList.add('premium-border');av.setAttribute('data-premium',skinId);});
        if(!silent){state.activePremiumSkin=skinId;addNotification('skin','You applied the "'+skin.name+'" premium skin!');}
        updatePremiumBg();
    } else {
        if(!silent) state.activePremiumSkin=null;
        updatePremiumBg();
        applySkin(state.activeSkin,true);
    }
}

var currentMySkinsTab=null;
function getMySkinCategories(){
    var cats=[];
    var ownedS=skins.filter(function(s){return state.ownedSkins[s.id];});
    var ownedP=premiumSkins.filter(function(s){return state.ownedPremiumSkins[s.id];});
    var ownedF=fonts.filter(function(f){return state.ownedFonts[f.id];});
    var ownedL=logos.filter(function(l){return state.ownedLogos[l.id];});
    var ownedI=iconSets.filter(function(s){return state.ownedIconSets[s.id];});
    var ownedC=coinSkins.filter(function(s){return state.ownedCoinSkins[s.id];});
    var ownedT=templates.filter(function(t){return state.ownedTemplates[t.id];});
    if(ownedS.length) cats.push({key:'basic',label:'<i class="fas fa-palette"></i> Basic Skins',items:ownedS,render:function(s){var a=state.activeSkin===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="skin-preview-inner" style="color:#333;background:#fff;">Preview</div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';">'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-skin-btn" data-sid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div class="skin-preview-inner" style="color:#333;background:#fff;">Default</div></div><div class="skin-card-body"><h4>Default</h4><p>The BlipVibe signature look.</p><button class="btn '+(!state.activeSkin?'btn-disabled':'btn-primary')+' apply-skin-btn" data-sid="default">'+(!state.activeSkin?'Active':'Apply')+'</button></div></div>'});
    if(ownedP.length) cats.push({key:'premium',label:'<i class="fas fa-gem"></i> Premium Skins',items:ownedP,render:function(s){var a=state.activePremiumSkin===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="premium-preview-frame" style="background:'+s.border+';"><img src="images/default-avatar.svg" class="premium-preview-avatar"></div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';"><i class="fas '+s.icon+'" style="color:'+s.iconColor+';margin-right:6px;"></i>'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-premium-btn" data-pid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="color:#fff;font-size:14px;font-weight:600;">Default</div></div><div class="skin-card-body"><h4>Default</h4><p>The BlipVibe signature look.</p><button class="btn '+(!state.activePremiumSkin?'btn-disabled':'btn-primary')+' apply-premium-btn" data-pid="default">'+(!state.activePremiumSkin?'Active':'Apply')+'</button></div></div>'});
    if(ownedF.length) cats.push({key:'fonts',label:'<i class="fas fa-font"></i> Font Styles',items:ownedF,render:function(f){var a=state.activeFont===f.id;return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#667eea,#764ba2);"><span style="font-family:\''+f.family+'\',sans-serif;color:#fff;font-size:24px;">Aa Bb Cc</span></div><div class="skin-card-body"><h4 style="font-family:\''+f.family+'\',sans-serif;">'+f.name+'</h4><p>'+f.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-font-btn" data-fid="'+f.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#667eea,#764ba2);"><span style="font-family:Roboto,sans-serif;color:#fff;font-size:24px;">Aa Bb Cc</span></div><div class="skin-card-body"><h4>Default (Roboto)</h4><p>The original BlipVibe font.</p><button class="btn '+(!state.activeFont?'btn-disabled':'btn-primary')+' apply-font-btn" data-fid="default">'+(!state.activeFont?'Active':'Apply')+'</button></div></div>'});
    if(ownedL.length) cats.push({key:'logos',label:'<i class="fas fa-star"></i> Logo Styles',items:ownedL,render:function(l){var a=state.activeLogo===l.id;var preview=l.img?'<img src="'+l.img+'" style="height:80px;object-fit:contain;">':'<span style="color:#fff;font-size:22px;font-weight:700;">'+(l.text||'')+'</span>';return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#f093fb,#f5576c);display:flex;align-items:center;justify-content:center;">'+preview+'</div><div class="skin-card-body"><h4>'+l.name+'</h4><p>'+l.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-logo-btn" data-lid="'+l.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#f093fb,#f5576c);"><span style="color:#fff;font-size:22px;font-weight:700;">BlipVibe</span></div><div class="skin-card-body"><h4>Default</h4><p>The original BlipVibe logo.</p><button class="btn '+(!state.activeLogo?'btn-disabled':'btn-primary')+' apply-logo-btn" data-lid="default">'+(!state.activeLogo?'Active':'Apply')+'</button></div></div>'});
    if(ownedI.length) cats.push({key:'icons',label:'<i class="fas fa-icons"></i> Icon Sets',items:ownedI,render:function(s){var a=state.activeIconSet===s.id;var prev='';Object.keys(s.icons).slice(0,4).forEach(function(k){prev+='<i class="fas '+s.icons[k]+'" style="margin:0 4px;font-size:18px;"></i>';});return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div style="color:#fff;">'+prev+'</div></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-icon-btn" data-iid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="color:#fff;"><i class="fas fa-home" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-users-rectangle" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-palette" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-store" style="margin:0 4px;font-size:18px;"></i></div></div><div class="skin-card-body"><h4>Default</h4><p>The original BlipVibe icons.</p><button class="btn '+(!state.activeIconSet?'btn-disabled':'btn-primary')+' apply-icon-btn" data-iid="default">'+(!state.activeIconSet?'Active':'Apply')+'</button></div></div>'});
    if(ownedC.length) cats.push({key:'coins',label:'<i class="fas fa-coins"></i> Coin Skins',items:ownedC,render:function(s){var a=state.activeCoinSkin===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><i class="fas '+s.icon+'" style="font-size:36px;color:'+s.color+';"></i></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-coin-btn" data-cid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><i class="fas fa-coins" style="font-size:36px;color:#ffd700;"></i></div><div class="skin-card-body"><h4>Default</h4><p>The original gold coins.</p><button class="btn '+(!state.activeCoinSkin?'btn-disabled':'btn-primary')+' apply-coin-btn" data-cid="default">'+(!state.activeCoinSkin?'Active':'Apply')+'</button></div></div>'});
    if(ownedT.length&&window.innerWidth>768) cats.push({key:'templates',label:'<i class="fas fa-table-columns"></i> Templates',items:ownedT,render:function(t){var a=state.activeTemplate===t.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+t.preview+';">'+tplPreviewHtml(t.id)+'</div><div class="skin-card-body"><h4>'+t.name+'</h4><p>'+t.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-tpl-btn" data-tid="'+t.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">'+tplPreviewHtml('spotlight')+'</div><div class="skin-card-body"><h4>Default Template</h4><p>Wide feed, narrow sidebars.</p><button class="btn '+(state.activeTemplate==='spotlight'?'btn-disabled':'btn-primary')+' apply-tpl-btn" data-tid="spotlight">'+(state.activeTemplate==='spotlight'?'Active':'Apply')+'</button></div></div>'});
    var ownedN=navStyles.filter(function(n){return state.ownedNavStyles[n.id];});
    if(ownedN.length) cats.push({key:'navstyles',label:'<i class="fas fa-bars-staggered"></i> Nav Styles',items:ownedN,render:function(n){var a=state.activeNavStyle===n.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+n.preview+';">'+navPreviewHtml(n.id)+'</div><div class="skin-card-body"><h4>'+n.name+'</h4><p>'+n.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-nav-btn" data-nid="'+n.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="width:100%;height:100%;display:flex;flex-direction:column;padding:4px;gap:3px;"><div style="height:10%;background:rgba(255,255,255,.6);border-radius:2px;flex:none;"></div><div style="flex:1;background:rgba(255,255,255,.2);border-radius:2px;"></div></div></div><div class="skin-card-body"><h4>Default</h4><p>The original top navigation bar.</p><button class="btn '+(!state.activeNavStyle?'btn-disabled':'btn-primary')+' apply-nav-btn" data-nid="default">'+(!state.activeNavStyle?'Active':'Apply')+'</button></div></div>'});
    // Owned songs
    if(_shopSongs&&_shopSongs.length){
        var ownedSongs=_shopSongs.filter(function(s){return _shopOwnedSongs&&_shopOwnedSongs[s.id];});
        if(ownedSongs.length) cats.push({key:'songs',label:'<i class="fas fa-music"></i> Songs',items:ownedSongs,render:function(s){
            var isActive=currentUser&&currentUser.profile_song_id===s.id;
            return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-music" style="font-size:32px;color:var(--primary);"></i><button class="song-preview-btn" data-url="'+escapeHtml(s.file_url)+'" style="background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;"><i class="fas fa-play"></i></button></div><div class="skin-card-body"><h4>'+escapeHtml(s.title)+'</h4><p>'+(s.genre||'BlipVibe Original')+'</p><button class="btn '+(isActive?'btn-disabled':'btn-primary')+' set-song-btn" data-song-id="'+s.id+'">'+(isActive?'Active':'Set as Profile Song')+'</button></div></div>';
        }});
    }
    return cats;
}
function renderMySkins(){
    var cats=getMySkinCategories();
    if(!cats.length){
        $('#mySkinsTabs').innerHTML='';
        $('#mySkinsGrid').innerHTML='<div class="empty-state"><i class="fas fa-palette"></i><p>You don\'t own anything yet.</p><button class="btn btn-primary" id="visitShopBtn">Visit Shop</button></div>';
        var _vsBtn=$('#visitShopBtn');if(_vsBtn)_vsBtn.addEventListener('click',function(){_skinPageView='shop';renderSkinPage();});
        return;
    }
    if(!currentMySkinsTab||!cats.find(function(c){return c.key===currentMySkinsTab;})) currentMySkinsTab=cats[0].key;
    var tabsHtml='';
    cats.forEach(function(c){tabsHtml+='<button class="search-tab'+(c.key===currentMySkinsTab?' active':'')+'" data-mtab="'+c.key+'">'+c.label+'</button>';});
    $('#mySkinsTabs').innerHTML=tabsHtml;
    var active=cats.find(function(c){return c.key===currentMySkinsTab;});
    var html='<div class="shop-scroll-row scroll-2row">';
    if(active.defaultCard) html+=active.defaultCard;
    active.items.forEach(function(item){html+=active.render(item);});
    html+='</div>';
    // Premium background controls (only on premium tab with active premium skin)
    if(currentMySkinsTab==='premium'&&state.activePremiumSkin){
        var bgHtml='<div class="premium-bg-controls card" style="margin-top:16px;padding:16px;border-radius:12px;">';
        bgHtml+='<h4 class="card-heading" style="margin-bottom:10px;font-size:14px;"><i class="fas fa-image" style="margin-right:6px;color:var(--primary);"></i>Background Image</h4>';
        bgHtml+='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">';
        bgHtml+='<label class="btn btn-primary" style="cursor:pointer;font-size:13px;"><i class="fas fa-upload" style="margin-right:6px;"></i>Upload<input type="file" id="premiumBgUpload" accept="image/*" style="display:none;"></label>';
        if(premiumBgImage){
            bgHtml+='<button class="btn btn-outline" id="premiumBgRemove" style="font-size:13px;"><i class="fas fa-trash" style="margin-right:6px;"></i>Remove</button>';
            bgHtml+='<img src="'+premiumBgImage+'" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:2px solid currentColor;opacity:.7;">';
        }
        bgHtml+='</div>';
        bgHtml+='<div id="premiumBgHistory" style="margin-top:10px;"></div>';
        if(premiumBgImage){
            bgHtml+='<div style="margin-top:12px;">';
            bgHtml+='<label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-moon"></i>Darkness: <span id="darknessValLabel">'+Math.round(premiumBgDarkness*100)+'%</span></label>';
            bgHtml+='<input type="range" id="premiumBgDarknessSlider" min="0" max="80" value="'+Math.round(premiumBgDarkness*100)+'" style="width:100%;margin-top:6px;accent-color:var(--primary);">';
            bgHtml+='</div>';
            bgHtml+='<div style="margin-top:10px;">';
            bgHtml+='<label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-droplet"></i>Frosted Glass: <span id="overlayValLabel">'+Math.round(premiumBgOverlay*100)+'%</span></label>';
            bgHtml+='<input type="range" id="premiumBgOverlaySlider" min="0" max="80" value="'+Math.round(premiumBgOverlay*100)+'" style="width:100%;margin-top:6px;accent-color:var(--primary);">';
            bgHtml+='</div>';
            bgHtml+='<div style="margin-top:10px;">';
            bgHtml+='<label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:8px;"><i class="fas fa-eye"></i>Card Transparency: <span id="cardTransValLabel">'+Math.round(premiumCardTransparency*100)+'%</span></label>';
            bgHtml+='<input type="range" id="premiumCardTransSlider" min="0" max="80" value="'+Math.round(premiumCardTransparency*100)+'" style="width:100%;margin-top:6px;accent-color:var(--primary);">';
            bgHtml+='</div>';
        }
        bgHtml+='</div>';
        html+=bgHtml;
    }
    $('#mySkinsGrid').innerHTML=html;
    // Premium bg upload handler
    var bgUploadInput=document.getElementById('premiumBgUpload');
    if(bgUploadInput){
        bgUploadInput.addEventListener('change',async function(){
            var file=bgUploadInput.files[0];if(!file||!currentUser)return;
            // Validate file before upload
            try{ validateUploadFile(file, {maxSize: 5*1024*1024, label:'Background'}); }catch(ve){ showToast(ve.message); return; }
            // Upload to Supabase Storage for persistence and sharing
            try{
                var ext=file.name.split('.').pop()||'jpg';
                var path='backgrounds/'+currentUser.id+'/bg-'+Date.now()+'.'+ext;
                var url=await sbUploadFile('avatars',path,file);
                premiumBgImage=url;
                updatePremiumBg();renderMySkins();saveState();
            }catch(e){
                console.warn('BG upload to storage failed, using local:',e);
                // Fallback to base64 for local preview
                var reader=new FileReader();
                reader.onload=function(ev){premiumBgImage=ev.target.result;updatePremiumBg();renderMySkins();saveState();};
                reader.readAsDataURL(file);
            }
        });
    }
    // Load background history thumbnails
    var bgHistoryEl=document.getElementById('premiumBgHistory');
    if(bgHistoryEl&&currentUser){
        sbListUserBackgrounds(currentUser.id).then(function(bgs){
            if(!bgs||!bgs.length)return;
            var hh='<p style="font-size:12px;color:var(--gray);margin-bottom:6px;">Previous uploads:</p><div class="shop-scroll-row" style="gap:8px;padding:4px 0 8px;">';
            bgs.forEach(function(b,i){hh+='<img src="'+b.src+'" class="prem-bg-hist-thumb" data-idx="'+i+'" style="min-width:64px;max-width:64px;height:64px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:border-color .2s;flex-shrink:0;scroll-snap-align:start;opacity:.8;">';});
            hh+='</div>';
            bgHistoryEl.innerHTML=hh;
            initDragScroll('#premiumBgHistory');
            var bgArr=bgs;
            $$('.prem-bg-hist-thumb').forEach(function(t){
                t.addEventListener('mouseenter',function(){t.style.borderColor='var(--primary)';t.style.opacity='1';});
                t.addEventListener('mouseleave',function(){t.style.borderColor='transparent';t.style.opacity='.8';});
                t.addEventListener('click',function(){
                    premiumBgImage=bgArr[parseInt(t.dataset.idx)].src;
                    updatePremiumBg();renderMySkins();saveState();
                });
            });
        }).catch(function(e){console.warn('BG history load:',e);});
    }
    var bgRemoveBtn=document.getElementById('premiumBgRemove');
    if(bgRemoveBtn){
        bgRemoveBtn.addEventListener('click',function(){premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;updatePremiumBg();renderMySkins();saveState();});
    }
    var darknessSlider=document.getElementById('premiumBgDarknessSlider');
    if(darknessSlider){
        darknessSlider.addEventListener('input',function(){
            premiumBgDarkness=parseInt(darknessSlider.value)/100;
            document.getElementById('darknessValLabel').textContent=Math.round(premiumBgDarkness*100)+'%';
            updatePremiumBg();
        });
        darknessSlider.addEventListener('change',function(){saveState();});
    }
    var overlaySlider=document.getElementById('premiumBgOverlaySlider');
    if(overlaySlider){
        overlaySlider.addEventListener('input',function(){
            premiumBgOverlay=parseInt(overlaySlider.value)/100;
            document.getElementById('overlayValLabel').textContent=Math.round(premiumBgOverlay*100)+'%';
            updatePremiumBg();
        });
        overlaySlider.addEventListener('change',function(){saveState();});
    }
    var cardTransSlider=document.getElementById('premiumCardTransSlider');
    if(cardTransSlider){
        cardTransSlider.addEventListener('input',function(){
            premiumCardTransparency=parseInt(cardTransSlider.value)/100;
            document.getElementById('cardTransValLabel').textContent=Math.round(premiumCardTransparency*100)+'%';
            updatePremiumBg();
        });
        cardTransSlider.addEventListener('change',function(){saveState();});
    }
    function mySkinsRerender(){var row=$('#mySkinsGrid .shop-scroll-row');var sl=row?row.scrollLeft:0;renderMySkins();var row2=$('#mySkinsGrid .shop-scroll-row');if(row2)row2.scrollLeft=sl;saveState();}
    $$('#mySkinsGrid .apply-skin-btn').forEach(function(btn){btn.addEventListener('click',function(){applySkin(btn.dataset.sid==='default'?null:btn.dataset.sid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-font-btn').forEach(function(btn){btn.addEventListener('click',function(){applyFont(btn.dataset.fid==='default'?null:btn.dataset.fid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-logo-btn').forEach(function(btn){btn.addEventListener('click',function(){applyLogo(btn.dataset.lid==='default'?null:btn.dataset.lid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-icon-btn').forEach(function(btn){btn.addEventListener('click',function(){applyIconSet(btn.dataset.iid==='default'?null:btn.dataset.iid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-coin-btn').forEach(function(btn){btn.addEventListener('click',function(){applyCoinSkin(btn.dataset.cid==='default'?null:btn.dataset.cid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-tpl-btn').forEach(function(btn){btn.addEventListener('click',function(){applyTemplate(btn.dataset.tid==='default'?null:btn.dataset.tid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-premium-btn').forEach(function(btn){btn.addEventListener('click',function(){applyPremiumSkin(btn.dataset.pid==='default'?null:btn.dataset.pid);mySkinsRerender();});});
    $$('#mySkinsGrid .apply-nav-btn').forEach(function(btn){btn.addEventListener('click',function(){applyNavStyle(btn.dataset.nid==='default'?null:btn.dataset.nid);mySkinsRerender();});});
    // Song set + preview in My Skins
    $$('#mySkinsGrid .set-song-btn').forEach(function(btn){btn.addEventListener('click',async function(){
        var sid=btn.dataset.songId;btn.disabled=true;btn.textContent='...';
        try{await sbSetProfileSong(currentUser.id,sid);currentUser.profile_song_id=sid;saveState();showToast('Profile song updated!');refreshMyProfileMusic();renderMySkins();}catch(e){showToast('Failed');btn.disabled=false;}
    });});
    $$('#mySkinsGrid .song-preview-btn').forEach(function(btn){btn.addEventListener('click',function(e){handleSongPreviewClick(e,btn);
    });});
    initDragScroll('#mySkinsGrid');
    initDragScroll('#mySkinsTabs');
    $$('#mySkinsTabs .search-tab').forEach(function(tab){tab.addEventListener('click',function(){
        $$('#mySkinsTabs .search-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');currentMySkinsTab=tab.dataset.mtab;stopSongPreview();renderMySkins();
    });});
}

// ======================== MESSAGES (Supabase) ========================
var activeChat=null; // { partnerId, partner: {id,username,display_name,avatar_url} }
var msgConversations=[];

async function loadConversations(){
    if(!currentUser) return;
    try{
        msgConversations=await sbGetConversations(currentUser.id);
    }catch(e){console.error('loadConversations:',e);msgConversations=[];}
    renderMsgContacts();
    updateMsgBadge();
}
function updateMsgBadge(){
    var total=0;
    msgConversations.forEach(function(c){if(!blockedUsers[c.partnerId]) total+=c.unread||0;});
    var badge=$('#msgBadge');
    if(badge){
        if(total>0){badge.classList.add('has-unread');badge.style.display='';badge.textContent=total;}
        else{badge.classList.remove('has-unread');badge.style.display='none';}
    }
}

function renderMsgContacts(search){
    var list=$('#msgContactList');
    if(!list) return;
    // If searching, show the people search splash instead
    if(search && search.trim().length >= 1){
        _showMsgSearchSplash(list, search.trim());
        return;
    }
    var convos=msgConversations.filter(function(c){return !blockedUsers[c.partnerId];});
    var html='<div class="msg-contact" style="border-bottom:1px solid var(--border);cursor:pointer;" id="newGroupDmBtn"><div style="width:44px;height:44px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-users" style="color:#fff;font-size:16px;"></i></div><div class="msg-contact-info"><div class="msg-contact-name" style="color:var(--primary);">New Group Chat</div><div class="msg-contact-preview">Create a multi-person conversation</div></div></div>';
    convos.forEach(function(c){
        var name=c.partner.display_name||c.partner.username||'User';
        var avatar=c.partner.avatar_url||DEFAULT_AVATAR;
        var preview=c.lastMessage.content||'';
        if(/^\[img\]/.test(preview)) preview='Sent an image';
        else if(/^\[gif\]/.test(preview)) preview='Sent a GIF';
        else if(Array.from(preview).length>40) preview=safeTruncate(preview,40,'...');
        var time=timeAgoReal(c.lastMessage.created_at);
        var isActive=activeChat&&activeChat.partnerId===c.partnerId;
        html+='<div class="msg-contact'+(isActive?' active':'')+'" data-partner-id="'+c.partnerId+'">';
        var onlineInfo=getOnlineStatus(c.partner.last_seen);
        html+='<div style="position:relative;"><img src="'+avatar+'" alt="'+name+'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;">'+(onlineInfo.online?'<span class="online-dot"></span>':'')+'</div>';
        html+='<div class="msg-contact-info"><div class="msg-contact-name">'+name+(c.unread>0?' <span style="background:var(--primary);color:#fff;font-size:11px;padding:1px 7px;border-radius:10px;margin-left:6px;">'+c.unread+'</span>':'')+'</div>';
        html+='<div class="msg-contact-preview">'+preview+'</div></div>';
        html+='<span class="msg-contact-time">'+time+'</span>';
        html+='</div>';
    });
    if(!convos.length){
        list.innerHTML='<div class="empty-state" style="padding:40px 20px;"><i class="fas fa-envelope-open-text"></i><p>No messages yet.</p></div>';
        return;
    }
    list.innerHTML=html;
    _bindMsgContactClicks(list);
}
function _bindMsgContactClicks(container){
    var gdmBtn=container.querySelector('#newGroupDmBtn');
    if(gdmBtn) gdmBtn.addEventListener('click',function(e){e.stopPropagation();showCreateGroupDmModal();});
    container.querySelectorAll('.msg-contact').forEach(function(el){
        if(el.id==='newGroupDmBtn') return;
        el.addEventListener('click',function(){
            var pid=el.getAttribute('data-partner-id');
            var convo=msgConversations.find(function(c){return c.partnerId===pid;});
            if(convo) openChat({partnerId:convo.partnerId,partner:convo.partner});
            else openChat({partnerId:pid,partner:{id:pid,display_name:el.querySelector('.msg-contact-name').textContent,username:'',avatar_url:el.querySelector('img').src}});
        });
    });
}
var _msgSearchTimer=null;
// Full-screen splash overlay for people search in messages
function _showMsgSearchSplash(list, query){
    // Show loading state immediately
    list.innerHTML='<div style="padding:32px 16px;text-align:center;color:var(--gray);font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:20px;margin-bottom:12px;display:block;"></i>Searching people...</div>';
    clearTimeout(_msgSearchTimer);
    _msgSearchTimer=setTimeout(function(){ _runMsgSearchSplash(list, query); }, 300);
}
async function _runMsgSearchSplash(list, query){
    if(!currentUser) return;
    try{
        // Fetch search results and following/followers in parallel
        var results=await sbSearchProfiles(query, 30);
        results=(results||[]).filter(function(p){
            return p.id!==currentUser.id && !blockedUsers[p.id];
        });
        if(!results.length){
            list.innerHTML='<div style="padding:32px 16px;text-align:center;color:var(--gray);"><i class="fas fa-user-slash" style="font-size:28px;margin-bottom:12px;display:block;opacity:.5;"></i><div style="font-size:14px;">No people found for "'+escapeHtml(query)+'"</div></div>';
            return;
        }
        // Build following/follower lookup from state
        var followingMap=state.followedUsers||{};
        // Sort: following first, then others
        var followingList=[];
        var othersList=[];
        results.forEach(function(p){
            if(followingMap[p.id]) followingList.push(p);
            else othersList.push(p);
        });
        // Build HTML
        var html='<div style="overflow-y:auto;-webkit-overflow-scrolling:touch;">';
        if(followingList.length){
            html+='<div style="padding:10px 16px 4px;font-size:11px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;font-weight:600;"><i class="fas fa-user-check" style="margin-right:4px;"></i>Following</div>';
            followingList.forEach(function(p){ html+=_msgSearchPersonCard(p); });
        }
        if(othersList.length){
            html+='<div style="padding:10px 16px 4px;font-size:11px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;font-weight:600;"><i class="fas fa-users" style="margin-right:4px;"></i>Others</div>';
            othersList.forEach(function(p){ html+=_msgSearchPersonCard(p); });
        }
        html+='</div>';
        list.innerHTML=html;
        // Bind clicks
        list.querySelectorAll('.msg-contact').forEach(function(el){
            el.addEventListener('click',function(){
                var pid=el.getAttribute('data-partner-id');
                var match=results.find(function(p){return p.id===pid;});
                if(match) startConversation(match.id, match.display_name||match.username, match.avatar_url);
            });
        });
    }catch(e){
        console.error('msgSearchSplash:', e);
        list.innerHTML='<div style="padding:32px 16px;text-align:center;color:var(--gray);font-size:14px;"><i class="fas fa-exclamation-triangle" style="font-size:20px;margin-bottom:12px;display:block;opacity:.5;"></i>Search failed — try again</div>';
    }
}
function _msgSearchPersonCard(p){
    var name=p.display_name||p.username||'User';
    var avatar=p.avatar_url||DEFAULT_AVATAR;
    var username=p.username||'';
    var h='<div class="msg-contact" data-partner-id="'+p.id+'" style="cursor:pointer;">';
    h+='<img src="'+avatar+'" alt="'+escapeHtml(name)+'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;">';
    h+='<div class="msg-contact-info"><div class="msg-contact-name">'+escapeHtml(name)+'</div>';
    h+='<div class="msg-contact-preview" style="color:var(--gray);font-size:12px;">@'+escapeHtml(username)+'</div></div></div>';
    return h;
}

function _renderMsgContent(content){
    var imgMatch=content.match(/^\[img\](.*?)\[\/img\]$/);
    if(imgMatch) return {html:'<img src="'+escapeHtml(imgMatch[1])+'" style="max-width:200px;border-radius:8px;">',isMedia:true};
    var gifMatch=content.match(/^\[gif\](.*?)\[\/gif\]$/);
    if(gifMatch) return {html:'<img src="'+escapeHtml(gifMatch[1])+'" style="max-width:200px;border-radius:8px;">',isMedia:true};
    var voiceMatch=content.match(/^\[voice\](.*?)\[\/voice\]$/);
    if(voiceMatch) return {html:'<audio src="'+escapeHtml(voiceMatch[1])+'" controls style="max-width:220px;height:36px;"></audio>',isMedia:true};
    return {html:renderMentionsInText(escapeHtmlNl(content)),isMedia:false};
}
async function openChat(contact){
    if(blockedUsers[contact.partnerId]){showToast('This user is blocked');return;}
    activeChat=contact;
    renderMsgContacts();
    var name=contact.partner.display_name||contact.partner.username||'User';
    var avatar=contact.partner.avatar_url||DEFAULT_AVATAR;
    var html='<div class="msg-chat-header"><button class="msg-back-btn" id="msgBackBtn"><i class="fas fa-arrow-left"></i></button><img src="'+avatar+'" alt="'+name+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;cursor:pointer;" data-uid="'+contact.partnerId+'"><h4>'+name+'</h4></div>';
    html+='<div class="msg-chat-messages" id="chatMessages"><div style="text-align:center;padding:20px;color:var(--gray);"><i class="fas fa-spinner fa-spin"></i> Loading...</div></div>';
    // Input bar with image, GIF, text input, and send
    html+='<div class="msg-chat-input">';
    html+='<div id="msgGifPicker" class="msg-gif-picker">';
    html+='<div class="gif-picker-header"><input type="text" id="msgGifSearch" placeholder="Search GIFs..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px;background:var(--light-bg);color:var(--dark);outline:none;font-family:inherit;"><button id="msgGifClose" style="background:none;border:none;color:var(--gray);font-size:16px;cursor:pointer;padding:4px 8px;"><i class="fas fa-times"></i></button></div>';
    html+='<div class="gif-picker-grid" id="msgGifGrid"></div>';
    html+='<div class="gif-picker-footer">Powered by <strong>KLIPY</strong></div>';
    html+='</div>';
    html+='<button id="msgImgBtn" class="msg-media-btn" title="Send image"><i class="fas fa-image"></i></button>';
    html+='<input type="file" id="msgImgInput" accept="image/*" style="display:none;">';
    html+='<button id="msgGifBtn" class="msg-media-btn" title="Send GIF"><i class="fas fa-film"></i></button>';
    html+='<button id="msgVoiceBtn" class="msg-media-btn" title="Voice note"><i class="fas fa-microphone"></i></button>';
    html+='<input type="text" placeholder="Type a message..." id="msgInput">';
    html+='<button id="sendMsgBtn"><i class="fas fa-paper-plane"></i></button>';
    html+='</div>';
    $('#msgChat').innerHTML=html;
    // Mobile: show chat area full-screen
    var msgLayout=document.querySelector('.messages-layout');
    var chatEl=$('#msgChat');
    var isMobile=window.innerWidth<=900;
    if(msgLayout) msgLayout.classList.add('chat-open');
    if(isMobile&&chatEl){
        // Hide both navbars so chat takes full screen
        var topNav=document.querySelector('.navbar');
        var botNav=document.querySelector('.nav-center');
        if(topNav) topNav.style.display='none';
        if(botNav) botNav.style.display='none';
        chatEl.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;flex-direction:column;background:var(--card);';
        var hdr=chatEl.querySelector('.msg-chat-header');
        if(hdr) hdr.style.cssText='flex-shrink:0;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top,0px));background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;';
        var backBtnEl=chatEl.querySelector('.msg-back-btn');
        if(backBtnEl) backBtnEl.style.display='flex';
        var msgs=chatEl.querySelector('.msg-chat-messages');
        if(msgs) msgs.style.cssText='flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;gap:12px;';
        var inp=chatEl.querySelector('.msg-chat-input');
        if(inp) inp.style.cssText='flex-shrink:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;position:relative;';
    }
    // Back button handler
    var backBtn=document.getElementById('msgBackBtn');
    if(backBtn){backBtn.addEventListener('click',function(){
        if(isMobile){
            // Restore navbars
            var topNav=document.querySelector('.navbar');
            var botNav=document.querySelector('.nav-center');
            if(topNav) topNav.style.display='';
            if(botNav) botNav.style.display='';
            if(chatEl) chatEl.style.cssText='';
        }
        if(msgLayout) msgLayout.classList.remove('chat-open');
        activeChat=null;renderMsgContacts();
    });}

    // Load messages
    try{
        var messages=await sbGetMessages(currentUser.id,contact.partnerId);
        var msgArea=$('#chatMessages');
        if(!messages||!messages.length){
            msgArea.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray);"><p>No messages yet. Say hello!</p></div>';
        } else {
            var mhtml='';
            messages.forEach(function(m){
                var isMine=m.sender_id===currentUser.id;
                var rendered=_renderMsgContent(m.content);
                mhtml+='<div class="msg-bubble '+(isMine?'sent':'received')+'" data-mid="'+m.id+'" data-raw="'+(rendered.isMedia?'':escapeHtml(m.content))+'">'+rendered.html+(isMine&&!rendered.isMedia?'<button class="msg-edit-btn" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:10px;padding:2px 0 0;cursor:pointer;display:block;text-align:right;"><i class="fas fa-pen"></i></button>':'')+'</div>';
            });
            msgArea.innerHTML=mhtml;
            // Bind message edit buttons
            msgArea.querySelectorAll('.msg-edit-btn').forEach(function(btn){
                btn.addEventListener('click',function(e){
                    e.stopPropagation();
                    var bubble=btn.closest('.msg-bubble');
                    var mid=bubble.dataset.mid;
                    var raw=bubble.dataset.raw;
                    showEditMessageModal(mid,raw,function(newText){
                        bubble.dataset.raw=newText;
                        var editBtn=bubble.querySelector('.msg-edit-btn');
                        bubble.textContent='';
                        bubble.appendChild(document.createTextNode(newText));
                        if(editBtn) bubble.appendChild(editBtn);
                    });
                });
            });
            msgArea.scrollTop=msgArea.scrollHeight;
            autoFetchLinkPreviewsMini(msgArea,'.msg-bubble');
            bindMsgReactions();
            bindMsgReplyBtns();
            // Add read receipts to own messages
            var lastSent=msgArea.querySelector('.msg-bubble.sent:last-child');
            if(lastSent) renderReadReceipt(lastSent,true);
        }
        // Mark as read
        await sbMarkMessagesRead(currentUser.id,contact.partnerId);
        var convo=msgConversations.find(function(c){return c.partnerId===contact.partnerId;});
        if(convo) convo.unread=0;
        renderMsgContacts();
        updateMsgBadge();
    }catch(e){
        console.error('Load messages:',e);
        $('#chatMessages').innerHTML='<div style="text-align:center;padding:40px;color:#e74c3c;"><p>Failed to load messages.</p></div>';
    }

    // Send handler
    $('#sendMsgBtn').addEventListener('click',sendMessage);
    $('#msgInput').addEventListener('keypress',function(e){if(e.key==='Enter')sendMessage();});
    $('#msgInput').focus();

    // Voice note handler
    var _voiceRecording=false;
    $('#msgVoiceBtn').addEventListener('click',function(){
        if(_voiceRecording){
            _voiceRecording=false;
            this.style.color='';
            stopVoiceRecording();
        } else {
            _voiceRecording=true;
            this.style.color='#e74c3c';
            startVoiceRecording(async function(blob){
                _voiceRecording=false;
                var voiceBtn=$('#msgVoiceBtn');if(voiceBtn)voiceBtn.style.color='';
                try{
                    var url=await sbUploadVoiceNote(currentUser.id,blob);
                    await sbSendMessage(currentUser.id,activeChat.partnerId,'[voice]'+url+'[/voice]');
                    var msgArea=$('#chatMessages');
                    msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble sent"><audio src="'+url+'" controls style="max-width:200px;"></audio></div>');
                    msgArea.scrollTop=msgArea.scrollHeight;
                    await loadConversations();
                }catch(e){showToast('Voice note failed: '+escapeHtml(e.message||''));}
            });
        }
    });
    // Image send handler
    $('#msgImgBtn').addEventListener('click',function(){$('#msgImgInput').click();});
    $('#msgImgInput').addEventListener('change',async function(){
        var file=this.files[0];if(!file||!activeChat||!currentUser) return;
        try{
            validateUploadFile(file, {maxSize: 10*1024*1024, label:'Image'});
            var path=currentUser.id+'/msg-'+Date.now()+'-'+file.name;
            var url=await sbUploadFile('posts',path,file);
            var imgContent='[img]'+url+'[/img]';
            var msgArea=$('#chatMessages');
            var placeholder=msgArea.querySelector('div[style*="text-align:center"]');
            if(placeholder&&placeholder.textContent.indexOf('No messages')!==-1) msgArea.innerHTML='';
            msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble sent"><img src="'+url+'" style="max-width:200px;border-radius:8px;"></div>');
            msgArea.scrollTop=msgArea.scrollHeight;
            await sbSendMessage(currentUser.id,activeChat.partnerId,imgContent);
            await loadConversations();
        }catch(e){console.error('Send image:',e);showToast('Failed to send image');}
        this.value='';
    });

    // GIF picker handler
    _initMsgGifPicker();

    // Click avatar to view profile
    var avatarEl=$('#msgChat').querySelector('.msg-chat-header img');
    if(avatarEl) avatarEl.addEventListener('click',async function(){
        try{var p=await sbGetProfile(contact.partnerId);if(p)showProfileView(profileToPerson(p));}catch(e){}
    });
}
function _initMsgGifPicker(){
    var picker=document.getElementById('msgGifPicker');
    var grid=document.getElementById('msgGifGrid');
    var searchInput=document.getElementById('msgGifSearch');
    var gifBtn=document.getElementById('msgGifBtn');
    var closeBtn=document.getElementById('msgGifClose');
    if(!picker||!grid||!gifBtn) return;
    var _debounce=null;
    function renderGrid(gifs){
        if(!gifs||!gifs.length){grid.innerHTML='<p style="color:var(--gray);text-align:center;grid-column:1/-1;padding:20px 0;">No GIFs found</p>';return;}
        grid.innerHTML=gifs.map(function(g){return '<img src="'+escapeHtml(g.preview||g.full)+'" alt="'+escapeHtml(g.title)+'" data-full="'+escapeHtml(g.full)+'" loading="lazy">';}).join('');
    }
    async function openPicker(){
        picker.classList.add('open');
        searchInput.value='';
        grid.innerHTML='<p style="color:var(--gray);text-align:center;grid-column:1/-1;padding:20px 0;">Loading...</p>';
        searchInput.focus();
        renderGrid(await getKlipyTrending(20));
    }
    function closePicker(){picker.classList.remove('open');grid.innerHTML='';}
    gifBtn.addEventListener('click',function(){
        if(picker.classList.contains('open')) closePicker();
        else openPicker();
    });
    closeBtn.addEventListener('click',closePicker);
    searchInput.addEventListener('input',function(){
        clearTimeout(_debounce);
        var q=searchInput.value.trim();
        if(!q){_debounce=setTimeout(async function(){renderGrid(await getKlipyTrending(20));},200);return;}
        _debounce=setTimeout(async function(){
            grid.innerHTML='<p style="color:var(--gray);text-align:center;grid-column:1/-1;padding:20px 0;">Searching...</p>';
            renderGrid(await searchKlipyGifs(q,20));
        },400);
    });
    grid.addEventListener('click',async function(e){
        var img=e.target.closest('img');if(!img)return;
        var fullUrl=img.dataset.full;if(!fullUrl||!activeChat||!currentUser)return;
        closePicker();
        var gifContent='[gif]'+fullUrl+'[/gif]';
        var msgArea=$('#chatMessages');
        var placeholder=msgArea.querySelector('div[style*="text-align:center"]');
        if(placeholder&&placeholder.textContent.indexOf('No messages')!==-1) msgArea.innerHTML='';
        msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble sent"><img src="'+escapeHtml(fullUrl)+'" style="max-width:200px;border-radius:8px;"></div>');
        msgArea.scrollTop=msgArea.scrollHeight;
        try{
            await sbSendMessage(currentUser.id,activeChat.partnerId,gifContent);
            await loadConversations();
        }catch(err){console.error('Send GIF:',err);showToast('Failed to send GIF');}
    });
}

async function sendMessage(){
    var input=$('#msgInput');
    if(!input) return;
    var text=input.value.trim();
    if(!text||!activeChat||!currentUser) return;
    input.value='';
    // Optimistically show the message
    var msgArea=$('#chatMessages');
    var placeholder=msgArea.querySelector('div[style*="text-align:center"]');
    if(placeholder&&placeholder.textContent.indexOf('No messages')!==-1) msgArea.innerHTML='';
    // Include reply quote if replying to a message
    var replyHtml='';
    if(_replyingToMsg){
        var rp=_replyingToMsg.text.length>50?_replyingToMsg.text.substring(0,50)+'...':_replyingToMsg.text;
        replyHtml='<div class="msg-quoted"><i class="fas fa-reply" style="margin-right:4px;font-size:10px;"></i>'+escapeHtml(rp)+'</div>';
        text='[reply:'+_replyingToMsg.mid+']'+text;
        clearReplyTo();
    }
    msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble sent">'+replyHtml+escapeHtml(text.replace(/^\[reply:[^\]]+\]/,''))+'</div>');
    autoFetchLinkPreviewsMini(msgArea,'.msg-bubble:last-child');
    msgArea.scrollTop=msgArea.scrollHeight;
    try{
        await sbSendMessage(currentUser.id,activeChat.partnerId,text);
        recordInteraction(activeChat.partnerId);
        // Update conversation list
        await loadConversations();
    }catch(e){
        console.error('Send message:',e);
        showToast('Message failed to send');
    }
}

// Start a conversation from a profile (called by Message buttons)
function startConversation(userId, userName, userAvatar){
    // Check message privacy (own setting doesn't block outgoing, only incoming)
    navigateTo('messages');
    setTimeout(function(){
        openChat({partnerId:userId,partner:{id:userId,display_name:userName,username:userName,avatar_url:userAvatar}});
    },100);
}

$('#msgSearch').addEventListener('input',function(){clearTimeout(_msgSearchTimer);renderMsgContacts(this.value);});

// Following sidebar for messages
async function renderMsgFollowing(){
    var list=$('#msgFollowingList');
    if(!list||!currentUser) return;
    try{
        var following=await sbGetFollowing(currentUser.id);
        if(!following||!following.length){
            list.innerHTML='<div style="padding:16px;text-align:center;color:var(--gray);font-size:12px;">Not following anyone yet.</div>';
            return;
        }
        var html='';
        following.forEach(function(f){
            var p=f.followed||f;
            var name=p.display_name||p.username||'User';
            var avatar=p.avatar_url||DEFAULT_AVATAR;
            html+='<div class="msg-following-item" data-uid="'+p.id+'" data-name="'+name.replace(/"/g,'&quot;')+'" data-avatar="'+(p.avatar_url||'')+'">';
            html+='<img src="'+avatar+'" alt="'+name+'">';
            html+='<span>'+name+'</span></div>';
        });
        list.innerHTML=html;
        list.querySelectorAll('.msg-following-item').forEach(function(el){
            el.addEventListener('click',function(){
                startConversation(el.dataset.uid,el.dataset.name,el.dataset.avatar||null);
            });
        });
    }catch(e){
        console.error('renderMsgFollowing:',e);
        list.innerHTML='<div style="padding:16px;text-align:center;color:var(--gray);font-size:12px;">Could not load.</div>';
    }
}

// Subscribe to realtime messages
function initMessageSubscription(){
    if(!currentUser) return;
    var _subMsg = sbSubscribeMessages(currentUser.id, function(newMsg){
        // Reload conversations to update sidebar
        loadConversations();
        // If we're in the chat with this sender, append the message
        if(activeChat&&activeChat.partnerId===newMsg.sender_id){
            var msgArea=$('#chatMessages');
            if(msgArea){
                var content=newMsg.content;
                if(/^\[img\]/.test(content)){
                    var imgUrl=content.replace('[img]','').replace('[/img]','');
                    msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble received"><img src="'+imgUrl+'" style="max-width:200px;border-radius:8px;cursor:pointer;" onclick="window.open(this.src)"></div>');
                } else {
                    msgArea.insertAdjacentHTML('beforeend','<div class="msg-bubble received">'+content+'</div>');
                    autoFetchLinkPreviewsMini(msgArea,'.msg-bubble:last-child');
                }
                msgArea.scrollTop=msgArea.scrollHeight;
                // Mark as read immediately
                sbMarkMessagesRead(currentUser.id,newMsg.sender_id).catch(function(){});
            }
        } else {
            // Not viewing this chat — show notification
            sbGetProfile(newMsg.sender_id).then(function(sender){
                var senderName=sender?(sender.display_name||sender.username):'Someone';
                var preview=/^\[img\]/.test(newMsg.content)?'sent an image':safeTruncate(newMsg.content,40);
                addNotification('message',senderName+': '+preview);
            }).catch(function(){
                addNotification('message','New message received');
            });
        }
    });
    if(_subMsg) _realtimeSubs.push(_subMsg);
}

// ======================== PHOTOS ========================
var pvPhotoTab='photos';
var _pvAlbums=[];var _pvPostPhotos=[];var _pvIsMe=false;var _pvUserId=null;

function renderPvPhotoTab(isMe){
    var container=document.getElementById('pvPhotoContent');
    if(!container)return;
    if(pvPhotoTab==='photos'){
        // Post Photos tab — show grid with "..." menu on each photo
        var photos=_pvPostPhotos||[];
        var html='';
        if(photos.length){
            html+='<div class="photos-preview">';
            photos.slice(0,6).forEach(function(p){
                var isVid=p.isVideo||isVideoUrl(p.src);
                html+='<div class="photo-wrap" draggable="true" data-psrc="'+p.src+'">';
                if(isVid){
                    html+='<video src="'+p.src+'#t=0.5" preload="metadata" muted style="width:100%;height:100%;object-fit:cover;"></video>';
                    html+='<div class="photo-video-badge"><i class="fas fa-play"></i></div>';
                } else {
                    html+='<img src="'+p.src+'">';
                }
                if(isMe) html+='<button class="photo-menu-btn" data-psrc="'+p.src+'"><i class="fas fa-ellipsis-h"></i></button>';
                html+='</div>';
            });
            html+='</div>';
        } else {
            html+='<div style="padding:20px;text-align:center;color:var(--gray);"><p style="font-size:13px;">No post photos yet.</p></div>';
        }
        if(photos.length>6) html+='<a href="#" class="view-more-link pv-photos-link">View All</a>';
        container.innerHTML=html;
        var pvPP=container.querySelector('.photos-preview');
        if(pvPP&&document.body.classList.contains('tpl-cinema')){pvPP.classList.add('shop-scroll-row');initDragScroll('#pvPhotoContent');}
        var pvPhotosLink=container.querySelector('.pv-photos-link');
        if(pvPhotosLink)pvPhotosLink.addEventListener('click',function(e){
            e.preventDefault();
            if(isMe){renderPhotoAlbum();navigateTo('photos');}
            else{
                // Show all their photos in a modal instead of navigating to own photos
                var allPhotos=photos||_pvPostPhotos||[];
                if(!allPhotos.length){showToast('No photos to show');return;}
                var mh='<div class="modal-header"><h3><i class="fas fa-images" style="color:var(--primary);margin-right:8px;"></i>All Photos</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
                mh+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;"><div class="photos-preview" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">';
                allPhotos.forEach(function(p){
                    var src=p.src||p;
                    mh+='<img src="'+escapeHtml(src)+'" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;" loading="lazy">';
                });
                mh+='</div></div>';
                showModal(mh);
            }
        });
        // Drag start for photos
        if(isMe) container.querySelectorAll('.photo-wrap[draggable]').forEach(function(wrap){
            wrap.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',wrap.dataset.psrc);e.dataTransfer.effectAllowed='copy';});
        });
        // Photo "..." menu
        if(isMe) container.querySelectorAll('.photo-menu-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){e.stopPropagation();showPhotoMenu(btn.dataset.psrc,null,btn);});
        });
    } else {
        // Albums tab — horizontal scroll row of album cards
        var albums=_pvAlbums||[];
        var html='';
        if(!albums.length){
            html+='<div style="padding:20px;text-align:center;color:var(--gray);"><i class="fas fa-folder-open" style="font-size:28px;margin-bottom:8px;display:block;opacity:.4;"></i><p style="font-size:13px;">No albums yet.'+(isMe?' Create one!':'')+'</p></div>';
        } else {
            html+='<div class="shop-scroll-row" style="padding:10px 14px;">';
            albums.forEach(function(album){
                var photos=album.album_photos||[];
                var cover=photos.length?photos[0].photo_url:'';
                html+='<div class="pv-album-card" data-album-id="'+album.id+'">';
                if(cover) html+='<div class="pv-album-cover"><img src="'+cover+'"></div>';
                else html+='<div class="pv-album-cover pv-album-placeholder"><i class="fas fa-image"></i></div>';
                html+='<h5>'+escapeHtml(album.title)+'</h5>';
                html+='<p>'+photos.length+' photo'+(photos.length!==1?'s':'')+'</p>';
                if(isMe) html+='<button class="album-delete-btn" data-album-id="'+album.id+'" title="Delete album"><i class="fas fa-trash"></i></button>';
                html+='</div>';
            });
            html+='</div>';
        }
        if(isMe) html+='<div style="padding:8px 14px 14px;"><button class="btn btn-primary" id="pvCreateAlbumBtn" style="width:100%;"><i class="fas fa-plus"></i> Create Album</button></div>';
        container.innerHTML=html;
        // Init horizontal drag-scroll
        var scrollRow=container.querySelector('.shop-scroll-row');
        if(scrollRow) _bindDragScroll(scrollRow);
        // Create album
        var cab=document.getElementById('pvCreateAlbumBtn');
        if(cab)cab.addEventListener('click',function(){showCreateAlbumModal();});
        // Delete album buttons — use mouseup to avoid drag-scroll interference
        if(isMe) container.querySelectorAll('.album-delete-btn').forEach(function(btn){
            btn.addEventListener('mouseup',function(e){
                e.stopPropagation();e.preventDefault();
                var aid=btn.dataset.albumId;
                var album=_pvAlbums.find(function(a){return a.id===aid;});
                if(!confirm('Delete album "'+(album?album.title:'')+'?')) return;
                sbDeleteAlbum(aid).then(function(){
                    showToast('Album deleted');
                    sbGetAlbums(_pvUserId||currentUser.id).then(function(a){_pvAlbums=a;renderPvPhotoTab(true);});
                }).catch(function(){showToast('Error deleting album');});
            });
            btn.addEventListener('touchend',function(e){
                e.stopPropagation();e.preventDefault();
                btn.dispatchEvent(new MouseEvent('mouseup',{bubbles:false}));
            });
        });
        // Click album card to open album view — use mouseup to avoid drag-scroll interference
        var _albumCardMoved=false;
        container.querySelectorAll('.pv-album-card').forEach(function(card){
            card.addEventListener('mousedown',function(){_albumCardMoved=false;});
            card.addEventListener('mousemove',function(){_albumCardMoved=true;});
            card.addEventListener('mouseup',function(e){
                if(_albumCardMoved)return;
                if(e.target.closest('.album-delete-btn'))return;
                var aid=card.dataset.albumId;
                var album=_pvAlbums.find(function(a){return a.id===aid;});
                if(album) showAlbumViewModal(album,isMe);
            });
            card.addEventListener('touchend',function(e){
                if(e.target.closest('.album-delete-btn'))return;
                var aid=card.dataset.albumId;
                var album=_pvAlbums.find(function(a){return a.id===aid;});
                if(album) showAlbumViewModal(album,isMe);
            });
            // Drag & drop onto album cards
            if(isMe){
                card.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='copy';card.classList.add('drag-over');});
                card.addEventListener('dragleave',function(){card.classList.remove('drag-over');});
                card.addEventListener('drop',function(e){
                    e.preventDefault();card.classList.remove('drag-over');
                    var src=e.dataTransfer.getData('text/plain');
                    if(!src)return;
                    var aid=card.dataset.albumId;
                    sbAddPhotoToAlbum(aid,src).then(function(){
                        showToast('Photo added to album');
                        sbGetAlbums(_pvUserId||currentUser.id).then(function(a){_pvAlbums=a;renderPvPhotoTab(true);});
                    }).catch(function(err){
                        if(err.message&&err.message.indexOf('duplicate')!==-1) showToast('Photo already in this album');
                        else showToast('Error adding photo');
                    });
                });
            }
        });
    }
}

// Show "..." context menu for a photo
function showPhotoMenu(photoSrc,albumPhotoId,anchorEl){
    // Remove any existing menu
    var old=document.querySelector('.photo-context-menu');if(old)old.remove();
    var menu=document.createElement('div');
    menu.className='photo-context-menu';
    var h='';
    if(!albumPhotoId){
        h+='<button class="photo-ctx-item" data-action="add-to-album"><i class="fas fa-folder-plus"></i> Add to Album</button>';
        h+='<button class="photo-ctx-item photo-ctx-danger" data-action="delete-photo"><i class="fas fa-trash"></i> Delete Photo</button>';
    } else {
        h+='<button class="photo-ctx-item" data-action="remove-from-album"><i class="fas fa-trash"></i> Remove from Album</button>';
    }
    menu.innerHTML=h;
    document.body.appendChild(menu);
    // Position near anchor
    var rect=anchorEl.getBoundingClientRect();
    menu.style.top=(rect.bottom+window.scrollY+4)+'px';
    menu.style.left=Math.min(rect.left,window.innerWidth-180)+'px';
    // Actions
    menu.querySelector('[data-action="add-to-album"]')&&menu.querySelector('[data-action="add-to-album"]').addEventListener('click',function(){
        menu.remove();showAlbumSelectorModal(photoSrc);
    });
    menu.querySelector('[data-action="delete-photo"]')&&menu.querySelector('[data-action="delete-photo"]').addEventListener('click',function(){
        menu.remove();
        var found=_findPhotoInState(photoSrc);
        var ptype=found?found.type:'profile';
        _confirmDeletePhoto(photoSrc,ptype);
    });
    menu.querySelector('[data-action="remove-from-album"]')&&menu.querySelector('[data-action="remove-from-album"]').addEventListener('click',function(){
        menu.remove();
        sbRemovePhotoFromAlbum(albumPhotoId).then(function(){
            showToast('Photo removed from album');
            sbGetAlbums(_pvUserId||currentUser.id).then(function(a){_pvAlbums=a;renderPvPhotoTab(true);var atc=document.getElementById('albumTabContent');if(atc){atc.innerHTML=_renderAlbumTabPhotos(a,true);_bindAlbumPhotoScroll();_bindPhotoAlbumMenus();_bindAlbumUpload();}});
        }).catch(function(){showToast('Error removing photo');});
    });
    // Close on click outside
    setTimeout(function(){
        document.addEventListener('click',function handler(e){
            if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',handler);}
        });
    },0);
}

// Album selector modal — pick which album to add photo to
function showAlbumSelectorModal(photoSrc){
    var albums=_pvAlbums||[];
    var h='<div class="modal-header"><h3><i class="fas fa-folder-plus" style="color:var(--primary);margin-right:8px;"></i>Add to Album</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    if(!albums.length){
        h+='<p style="color:var(--gray);text-align:center;margin-bottom:16px;">No albums yet.</p>';
    } else {
        h+='<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">';
        albums.forEach(function(a){
            h+='<button class="btn btn-outline album-pick-btn" data-aid="'+a.id+'" style="text-align:left;justify-content:flex-start;display:flex;align-items:center;gap:8px;"><i class="fas fa-folder" style="color:var(--primary);"></i>'+a.title+' <span style="margin-left:auto;font-size:11px;color:var(--gray);">'+(a.album_photos?a.album_photos.length:0)+' photos</span></button>';
        });
        h+='</div>';
    }
    h+='<button class="btn btn-primary" id="albumSelectorCreate" style="width:100%;"><i class="fas fa-plus"></i> Create New Album</button>';
    h+='</div>';
    showModal(h);
    $$('.album-pick-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var aid=btn.dataset.aid;
            closeModal();
            sbAddPhotoToAlbum(aid,photoSrc).then(function(){
                showToast('Photo added to album');
                sbGetAlbums(_pvUserId||currentUser.id).then(function(a){_pvAlbums=a;var atc=document.getElementById('albumTabContent');if(atc){atc.innerHTML=_renderAlbumTabPhotos(a,true);_bindAlbumPhotoScroll();_bindPhotoAlbumMenus();_bindAlbumUpload();}});
            }).catch(function(err){
                if(err.message&&err.message.indexOf('duplicate')!==-1) showToast('Photo already in this album');
                else showToast('Error adding photo');
            });
        });
    });
    document.getElementById('albumSelectorCreate').addEventListener('click',function(){
        closeModal();showCreateAlbumModal(photoSrc);
    });
}

// Create album modal — optionally add a photo after creation
function showCreateAlbumModal(photoSrcToAdd){
    var h='<div class="modal-header"><h3>Create Album</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><label style="display:block;font-size:14px;font-weight:500;margin-bottom:6px;">Album Name</label>';
    h+='<input type="text" id="albumNameInput" placeholder="My Album" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:16px;font-family:inherit;">';
    h+='<button class="btn btn-primary" id="albumCreateConfirm" style="width:100%;">Create</button></div>';
    showModal(h);
    document.getElementById('albumCreateConfirm').addEventListener('click',async function(){
        var name=document.getElementById('albumNameInput').value.trim();
        if(!name)return;
        try{
            var newAlbum=await sbCreateAlbum(currentUser.id,name);
            if(photoSrcToAdd) await sbAddPhotoToAlbum(newAlbum.id,photoSrcToAdd);
            _pvAlbums=await sbGetAlbums(_pvUserId||currentUser.id);
            closeModal();pvPhotoTab='albums';
            $$('#pvPhotoTabs .search-tab').forEach(function(t){t.classList.remove('active');if(t.dataset.pvpt==='albums')t.classList.add('active');});
            renderPvPhotoTab(true);renderPhotosCard();
            if(_navCurrent==='photos') renderPhotoAlbum();
            showToast('Album "'+name+'" created');
        }catch(e){console.error('Album create error:',e);showToast('Error creating album');}
    });
}

// Album view modal — shows all photos in an album, supports drag-drop into it
function showAlbumViewModal(album,isMe){
    var photos=album.album_photos||[];
    var h='<div class="modal-header"><h3><i class="fas fa-folder-open" style="color:var(--primary);margin-right:8px;"></i>'+escapeHtml(album.title)+'</h3>';
    if(isMe) h+='<button class="btn btn-outline" id="albumDeleteBtn" style="padding:4px 12px;font-size:12px;color:#e74c3c;border-color:#e74c3c;margin-right:8px;"><i class="fas fa-trash"></i></button>';
    h+='<button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" id="albumViewBody">';
    if(!photos.length){
        h+='<div class="album-drop-zone" id="albumDropZone"><i class="fas fa-cloud-upload-alt" style="font-size:28px;margin-bottom:8px;display:block;opacity:.4;"></i><p>No photos yet. Drag photos here or use the "..." menu on your photos.</p></div>';
    } else {
        h+='<div class="photo-album-grid" id="albumDropZone">';
        photos.forEach(function(p){
            h+='<div class="photo-wrap">';
            h+='<img src="'+p.photo_url+'">';
            if(isMe) h+='<button class="photo-menu-btn" data-ap-id="'+p.id+'" data-psrc="'+p.photo_url+'"><i class="fas fa-ellipsis-h"></i></button>';
            h+='</div>';
        });
        h+='</div>';
    }
    h+='</div>';
    showModal(h);
    // Delete album
    var delBtn=document.getElementById('albumDeleteBtn');
    if(delBtn)delBtn.addEventListener('click',function(){
        if(!confirm('Delete album "'+album.title+'"?'))return;
        sbDeleteAlbum(album.id).then(function(){
            closeModal();showToast('Album deleted');
            sbGetAlbums(_pvUserId||currentUser.id).then(function(a){_pvAlbums=a;renderPvPhotoTab(true);renderPhotosCard();});
        }).catch(function(){showToast('Error deleting album');});
    });
    // Photo menu inside album view
    if(isMe){
        $$('#albumViewBody .photo-menu-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){e.stopPropagation();showPhotoMenu(btn.dataset.psrc,btn.dataset.apId,btn);});
        });
        // Drag & drop into album view
        var dropZone=document.getElementById('albumDropZone');
        if(dropZone){
            dropZone.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='copy';dropZone.classList.add('drag-over');});
            dropZone.addEventListener('dragleave',function(){dropZone.classList.remove('drag-over');});
            dropZone.addEventListener('drop',function(e){
                e.preventDefault();dropZone.classList.remove('drag-over');
                var src=e.dataTransfer.getData('text/plain');
                if(!src)return;
                sbAddPhotoToAlbum(album.id,src).then(function(){
                    showToast('Photo added to album');
                    sbGetAlbums(_pvUserId||currentUser.id).then(function(a){
                        _pvAlbums=a;
                        var updated=a.find(function(al){return al.id===album.id;});
                        if(updated){closeModal();showAlbumViewModal(updated,true);}
                        renderPvPhotoTab(true);
                    });
                }).catch(function(err){
                    if(err.message&&err.message.indexOf('duplicate')!==-1) showToast('Photo already in this album');
                    else showToast('Error adding photo');
                });
            });
        }
    }
}

function getAllPhotos(){
    var all=state.photos.profile.concat(state.photos.cover,state.photos.post);
    return all;
}
function renderPhotosCard(){
    var all=getAllPhotos();
    var el=$('#photosPreview');
    if(!el)return;
    if(!all.length){el.innerHTML='<p class="photos-empty">No photos yet</p>';return;}
    var html='';
    all.slice(0,6).forEach(function(p){html+='<img src="'+p.src+'">';});
    el.innerHTML=html;
}
var currentAlbumTab=null;
async function renderPhotoAlbum(){
    if(currentUser){try{_pvAlbums=await sbGetAlbums(currentUser.id);}catch(e){}}
    var albums=_pvAlbums||[];
    var html='';
    // 1. Profile Pictures
    html+='<div class="photo-album-section"><h3><i class="fas fa-user-circle"></i> Profile Pictures</h3>';
    if(state.photos.profile.length){html+='<div class="photo-album-grid">';state.photos.profile.forEach(function(p){html+='<div class="photo-wrap" data-ptype="profile" data-psrc="'+p.src+'"><img src="'+p.src+'"><button class="photo-delete-btn" title="Delete photo"><i class="fas fa-trash"></i></button><button class="photo-menu-btn" data-psrc="'+p.src+'"><i class="fas fa-ellipsis-h"></i></button></div>';});html+='</div>';}
    else html+='<p class="photo-album-empty">No profile pictures yet.</p>';
    html+='</div>';
    // 2. Cover Photos
    html+='<div class="photo-album-section"><h3><i class="fas fa-panorama"></i> Cover Photos</h3>';
    if(state.photos.cover.length){html+='<div class="photo-album-grid">';state.photos.cover.forEach(function(p){html+='<div class="photo-wrap" data-ptype="cover" data-psrc="'+p.src+'"><img src="'+p.src+'"><button class="photo-delete-btn" title="Delete photo"><i class="fas fa-trash"></i></button><button class="photo-menu-btn" data-psrc="'+p.src+'"><i class="fas fa-ellipsis-h"></i></button></div>';});html+='</div>';}
    else html+='<p class="photo-album-empty">No cover photos yet.</p>';
    html+='</div>';
    // 3. Created Albums — pill tab system (mirrors Skin Shop tabs)
    html+='<div class="photo-album-section"><h3 style="display:flex;align-items:center;gap:8px;"><i class="fas fa-folder"></i> Created Albums';
    html+='<button class="btn btn-primary" id="createAlbumBtn" style="padding:4px 14px;font-size:12px;margin-left:auto;"><i class="fas fa-plus"></i> Create</button>';
    if(albums.length>1) html+='<button class="btn btn-outline" id="deleteAllAlbumsBtn" style="padding:4px 14px;font-size:12px;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-trash"></i> Delete All</button>';
    html+='</h3>';
    if(albums.length){
        if(!currentAlbumTab||!albums.find(function(a){return a.id===currentAlbumTab;})) currentAlbumTab=albums[0].id;
        html+='<div class="search-tabs" id="albumPillTabs">';
        albums.forEach(function(a){
            html+='<button class="search-tab'+(a.id===currentAlbumTab?' active':'')+'" data-atab="'+a.id+'">'+a.title+' <span class="album-del-x" data-album-id="'+a.id+'" title="Delete album"><i class="fas fa-times-circle"></i></span></button>';
        });
        html+='</div>';
        html+=_renderAlbumTabPhotos(albums);
    } else {
        html+='<p class="photo-album-empty">No albums created yet.</p>';
    }
    html+='</div>';
    // 4. Post Photos
    html+='<div class="photo-album-section"><h3><i class="fas fa-newspaper"></i> Post Photos</h3>';
    if(state.photos.post.length){html+='<div class="photo-album-grid">';state.photos.post.forEach(function(p){var isVid=p.isVideo||isVideoUrl(p.src);html+='<div class="photo-wrap" data-ptype="post" data-psrc="'+p.src+'">'+(isVid?'<video src="'+p.src+'#t=0.5" preload="metadata" muted></video><div class="photo-video-badge"><i class="fas fa-play"></i></div>':'<img src="'+p.src+'">')+'<button class="photo-delete-btn" title="Delete photo"><i class="fas fa-trash"></i></button><button class="photo-menu-btn" data-psrc="'+p.src+'"><i class="fas fa-ellipsis-h"></i></button></div>';});html+='</div>';}
    else html+='<p class="photo-album-empty">No post photos yet.</p>';
    html+='</div>';
    $('#photoAlbumContent').innerHTML=html;
    // Show/hide Select button based on whether photos exist
    var selectBtn=$('#photoSelectBtn');
    var hasPhotos=state.photos.profile.length||state.photos.cover.length||state.photos.post.length;
    if(selectBtn) selectBtn.style.display=hasPhotos?'':'none';
    // Drag-scroll on pill tabs
    var pillTabs=document.getElementById('albumPillTabs');
    if(pillTabs) _bindDragScroll(pillTabs);
    _bindAlbumPhotoScroll();
    _bindPhotoAlbumMenus();
    _bindAlbumUpload();
    // Create album
    var createBtn=document.getElementById('createAlbumBtn');
    if(createBtn) createBtn.addEventListener('click',function(){showCreateAlbumModal();});
    // Pill tab clicks — switch album content with fade transition
    $$('#albumPillTabs .search-tab').forEach(function(tab){
        tab.addEventListener('click',function(e){
            if(e.target.closest('.album-del-x')) return;
            $$('#albumPillTabs .search-tab').forEach(function(t){t.classList.remove('active');});
            tab.classList.add('active');currentAlbumTab=tab.dataset.atab;
            var c=document.getElementById('albumTabContent');
            if(c){c.style.opacity='0';c.style.transform='translateX(10px)';setTimeout(function(){c.innerHTML=_renderAlbumTabPhotos(albums,true);c.style.opacity='1';c.style.transform='translateX(0)';_bindAlbumPhotoScroll();_bindPhotoAlbumMenus();_bindAlbumUpload();},200);}
        });
    });
    // Delete album (X on pill)
    $$('#albumPillTabs .album-del-x').forEach(function(x){
        x.addEventListener('click',function(e){
            e.stopPropagation();var aid=x.dataset.albumId;
            var album=albums.find(function(a){return a.id===aid;});
            if(!confirm('Delete album "'+(album?album.title:'')+'"?')) return;
            sbDeleteAlbum(aid).then(function(){showToast('Album deleted');if(currentAlbumTab===aid) currentAlbumTab=null;renderPhotoAlbum();}).catch(function(){showToast('Error deleting album');});
        });
    });
    // Delete all albums
    var delAllBtn=document.getElementById('deleteAllAlbumsBtn');
    if(delAllBtn) delAllBtn.addEventListener('click',async function(){
        if(!confirm('Delete ALL '+albums.length+' albums? This cannot be undone.')) return;
        for(var i=0;i<albums.length;i++){try{await sbDeleteAlbum(albums[i].id);}catch(e){}}
        showToast('All albums deleted');_pvAlbums=[];currentAlbumTab=null;renderPhotoAlbum();
    });
}
function _renderAlbumTabPhotos(albums,inner){
    var active=albums.find(function(a){return a.id===currentAlbumTab;});
    var photos=(active&&active.album_photos)||[];
    var h=inner?'':'<div id="albumTabContent">';
    h+='<div style="margin-bottom:10px;"><button class="btn btn-outline" id="albumUploadBtn" style="padding:5px 14px;font-size:12px;"><i class="fas fa-upload"></i> Upload Photos</button><input type="file" id="albumFileInput" accept="image/*" multiple style="display:none;"></div>';
    if(photos.length){
        h+='<div class="shop-scroll-row album-photo-scroll" id="albumPhotoScroll">';
        photos.forEach(function(p){h+='<div class="photo-wrap"><img src="'+p.photo_url+'"><button class="photo-menu-btn" data-apid="'+p.id+'" data-psrc="'+p.photo_url+'"><i class="fas fa-ellipsis-h"></i></button></div>';});
        h+='</div>';
    } else h+='<p class="photo-album-empty">No photos in this album yet. Upload some!</p>';
    if(!inner) h+='</div>';
    return h;
}
function _bindAlbumPhotoScroll(){
    var el=document.getElementById('albumPhotoScroll');
    if(!el) return;
    _bindDragScroll(el);
    el.addEventListener('wheel',function(e){if(e.deltaY&&!e.deltaX){e.preventDefault();el.scrollLeft+=e.deltaY;}},{passive:false});
}
function _bindAlbumUpload(){
    var btn=document.getElementById('albumUploadBtn');
    var inp=document.getElementById('albumFileInput');
    if(!btn||!inp) return;
    btn.addEventListener('click',function(){inp.click();});
    inp.addEventListener('change',async function(){
        if(!inp.files.length||!currentAlbumTab||!currentUser) return;
        btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Uploading...';
        var files=Array.from(inp.files);
        for(var i=0;i<files.length;i++){
            try{
                var url=await sbUploadPostImage(currentUser.id,files[i]);
                await sbAddPhotoToAlbum(currentAlbumTab,url);
            }catch(e){if(e.message&&e.message.indexOf('duplicate')!==-1) showToast('Duplicate skipped');else console.error('Upload error:',e);}
        }
        inp.value='';
        _pvAlbums=await sbGetAlbums(currentUser.id);
        var atc=document.getElementById('albumTabContent');
        if(atc){atc.innerHTML=_renderAlbumTabPhotos(_pvAlbums,true);_bindAlbumPhotoScroll();_bindPhotoAlbumMenus();_bindAlbumUpload();}
        showToast(files.length>1?files.length+' photos uploaded':'Photo uploaded');
    });
}
// ---- Photo deletion helpers ----
function _extractStoragePath(url){
    // Parse Supabase public URL → {bucket, path}
    // Format: .../storage/v1/object/public/<bucket>/<path>?t=...
    try{
        var u=new URL(url.split('?')[0]);
        var parts=u.pathname.split('/storage/v1/object/public/');
        if(parts.length<2) return null;
        var rest=parts[1];
        var slash=rest.indexOf('/');
        if(slash===-1) return null;
        return {bucket:rest.substring(0,slash),path:rest.substring(slash+1)};
    }catch(e){return null;}
}
function _findPhotoInState(src){
    var base=src.split('?')[0];
    var types=['profile','cover','post'];
    for(var i=0;i<types.length;i++){
        var arr=state.photos[types[i]];
        for(var j=0;j<arr.length;j++){
            if(arr[j].src.split('?')[0]===base) return {type:types[i],index:j,photo:arr[j]};
        }
    }
    return null;
}
function _isCurrentAvatar(src){
    if(!currentUser||!currentUser.avatar_url) return false;
    return currentUser.avatar_url.split('?')[0]===src.split('?')[0];
}
function _isCurrentCover(src){
    if(!currentUser||!currentUser.cover_photo_url) return false;
    return currentUser.cover_photo_url.split('?')[0]===src.split('?')[0];
}
async function _executePhotoDelete(src,ptype,skipRender){
    var info=_extractStoragePath(src);
    if(!info){showToast('Could not determine file path');return false;}
    try{
        // 1. Delete from storage
        await sbDeleteStorageFile(info.bucket,info.path);
        // 2. Remove from all albums
        await sbRemovePhotoFromAllAlbums(src.split('?')[0]).catch(function(){});
        // 3. If post photo, update the post's media_urls
        if(ptype==='post'){
            var found=_findPhotoInState(src);
            if(found&&found.photo.postId){
                var p=found.photo;
                var base=src.split('?')[0];
                if(p.postMediaUrls&&p.postMediaUrls.length){
                    var updated=p.postMediaUrls.filter(function(u){return u.split('?')[0]!==base;});
                    await sbUpdatePostMediaUrls(p.postId,updated.length?updated:null,updated.length?updated[0]:null);
                } else {
                    await sbUpdatePostMediaUrls(p.postId,null,null);
                }
            }
        }
        // 4. Remove from state
        var types=['profile','cover','post'];
        var base2=src.split('?')[0];
        types.forEach(function(t){
            state.photos[t]=state.photos[t].filter(function(ph){return ph.src.split('?')[0]!==base2;});
        });
        if(!skipRender){
            renderPhotoAlbum();
            renderPhotosCard();
        }
        return true;
    }catch(e){
        console.error('Photo delete error:',e);
        showToast('Error deleting photo');
        return false;
    }
}
function _bindPhotoDeleteBtns(){
    $$('#photoAlbumContent .photo-delete-btn').forEach(function(btn){
        if(btn._bound) return;btn._bound=true;
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var wrap=btn.closest('.photo-wrap');
            if(!wrap) return;
            var src=wrap.dataset.psrc;
            var ptype=wrap.dataset.ptype;
            _confirmDeletePhoto(src,ptype);
        });
    });
}
function _confirmDeletePhoto(src,ptype){
    if(ptype==='profile'&&_isCurrentAvatar(src)){
        showToast('Cannot delete your current profile picture — change it first');return;
    }
    if(ptype==='cover'&&_isCurrentCover(src)){
        showToast('Cannot delete your current cover photo — change it first');return;
    }
    var msg='Delete this photo permanently?';
    if(ptype==='post') msg='Delete this photo? It will also be removed from the original post.';
    if(!confirm(msg)) return;
    _executePhotoDelete(src,ptype,false).then(function(ok){
        if(ok) showToast('Photo deleted');
    });
}
// ---- Multi-select photo mode ----
var _photoSelectMode=false;
var _selectedPhotos=[];
function _togglePhotoSelectMode(){
    _photoSelectMode=!_photoSelectMode;
    _selectedPhotos=[];
    var content=$('#photoAlbumContent');
    var btn=$('#photoSelectBtn');
    if(_photoSelectMode){
        if(content) content.classList.add('photo-select-mode');
        if(btn){btn.innerHTML='<i class="fas fa-times"></i> Cancel';btn.classList.add('active');}
        _showPhotoSelectBar();
    } else {
        if(content) content.classList.remove('photo-select-mode');
        if(btn){btn.innerHTML='<i class="fas fa-check-circle"></i> Select';btn.classList.remove('active');}
        $$('#photoAlbumContent .photo-wrap.selected').forEach(function(w){w.classList.remove('selected');});
        _hidePhotoSelectBar();
    }
}
function _exitPhotoSelectMode(){
    if(!_photoSelectMode) return;
    _photoSelectMode=false;
    _selectedPhotos=[];
    var content=$('#photoAlbumContent');
    var btn=$('#photoSelectBtn');
    if(content) content.classList.remove('photo-select-mode');
    if(btn){btn.innerHTML='<i class="fas fa-check-circle"></i> Select';btn.classList.remove('active');}
    $$('#photoAlbumContent .photo-wrap.selected').forEach(function(w){w.classList.remove('selected');});
    _hidePhotoSelectBar();
}
function _showPhotoSelectBar(){
    var existing=$('#photoSelectBar');
    if(existing) existing.remove();
    var bar=document.createElement('div');
    bar.id='photoSelectBar';
    bar.className='photo-select-bar';
    bar.innerHTML='<span class="photo-select-count">0 selected</span><button class="btn btn-danger photo-select-delete" disabled><i class="fas fa-trash"></i> Delete</button><button class="btn btn-outline photo-select-cancel">Cancel</button>';
    document.body.appendChild(bar);
    bar.querySelector('.photo-select-delete').addEventListener('click',_confirmBulkDeletePhotos);
    bar.querySelector('.photo-select-cancel').addEventListener('click',_togglePhotoSelectMode);
}
function _hidePhotoSelectBar(){
    var bar=$('#photoSelectBar');
    if(bar) bar.remove();
}
function _updatePhotoSelectBar(){
    var bar=$('#photoSelectBar');
    if(!bar) return;
    bar.querySelector('.photo-select-count').textContent=_selectedPhotos.length+' selected';
    bar.querySelector('.photo-select-delete').disabled=_selectedPhotos.length===0;
}
function _confirmBulkDeletePhotos(){
    if(!_selectedPhotos.length) return;
    // Filter out current avatar/cover
    var toDelete=[];
    var skipped=0;
    _selectedPhotos.forEach(function(s){
        if(s.ptype==='profile'&&_isCurrentAvatar(s.src)){skipped++;return;}
        if(s.ptype==='cover'&&_isCurrentCover(s.src)){skipped++;return;}
        toDelete.push(s);
    });
    if(!toDelete.length){
        showToast('All selected photos are in use — cannot delete');return;
    }
    var msg='Delete '+toDelete.length+' photo'+(toDelete.length>1?'s':'')+'?';
    if(skipped) msg+='\n('+skipped+' in-use photo'+(skipped>1?'s':'')+' will be skipped)';
    if(!confirm(msg)) return;
    var bar=$('#photoSelectBar');
    if(bar) bar.querySelector('.photo-select-delete').innerHTML='<i class="fas fa-spinner fa-spin"></i> Deleting...';
    (async function(){
        var deleted=0;
        for(var i=0;i<toDelete.length;i++){
            var ok=await _executePhotoDelete(toDelete[i].src,toDelete[i].ptype,true);
            if(ok) deleted++;
        }
        _exitPhotoSelectMode();
        renderPhotoAlbum();
        renderPhotosCard();
        showToast(deleted+' photo'+(deleted>1?'s':'')+' deleted');
    })();
}
function _bindPhotoAlbumMenus(){
    $$('#photoAlbumContent .photo-menu-btn').forEach(function(btn){
        if(btn._bound) return;btn._bound=true;
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var apid=btn.dataset.apid||null;
            showPhotoMenu(btn.dataset.psrc,apid,btn);
        });
    });
    _bindPhotoDeleteBtns();
}
$('#viewAllPhotos').addEventListener('click',function(e){e.preventDefault();renderPhotoAlbum();navigateTo('photos');});
// Photo select mode — button + delegated click
$('#photoSelectBtn').addEventListener('click',function(){_togglePhotoSelectMode();});
$('#photoAlbumContent').addEventListener('click',function(e){
    if(!_photoSelectMode) return;
    var wrap=e.target.closest('.photo-wrap');
    if(!wrap||!wrap.dataset.psrc) return;
    // Ignore clicks on menu/delete buttons
    if(e.target.closest('.photo-menu-btn')||e.target.closest('.photo-delete-btn')) return;
    e.preventDefault();e.stopPropagation();
    var src=wrap.dataset.psrc;
    var ptype=wrap.dataset.ptype||'profile';
    var idx=_selectedPhotos.findIndex(function(s){return s.src===src;});
    if(idx>=0){_selectedPhotos.splice(idx,1);wrap.classList.remove('selected');}
    else{_selectedPhotos.push({src:src,ptype:ptype});wrap.classList.add('selected');}
    _updatePhotoSelectBar();
});
$$('.photos-back-link').forEach(function(l){l.addEventListener('click',function(e){e.preventDefault();navigateTo(_navPrev&&_navPrev!=='photos'?_navPrev:'home');});});
$$('.privacy-back-link').forEach(function(l){l.addEventListener('click',function(e){e.preventDefault();navigateTo(_navPrev&&_navPrev!=='privacy'?_navPrev:'home');});});
$$('.admin-back-link').forEach(function(l){l.addEventListener('click',function(e){e.preventDefault();navigateTo(_navPrev&&_navPrev!=='admin'?_navPrev:'home');});});
document.getElementById('dropdownAdmin').addEventListener('click',function(e){e.preventDefault();$('#userDropdownMenu').classList.remove('show');navigateTo('admin');renderAdminPanel();});
// Privacy Policy link on login page
var _ppLink=document.getElementById('loginPrivacyLink');
if(_ppLink) _ppLink.addEventListener('click',function(e){e.preventDefault();showApp();navigateTo('privacy');});

// ======================== ADMIN PANEL ========================
var _adminPage=0;var _adminSearch='';var _adminPageSize=30;
async function renderAdminPanel(){
    if(!_isAdmin){document.getElementById('adminUserList').innerHTML='<p style="text-align:center;color:#e74c3c;padding:40px;">Access denied.</p>';return;}
    var listEl=document.getElementById('adminUserList');
    var countEl=document.getElementById('adminUserCount');
    var pagEl=document.getElementById('adminPagination');
    listEl.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray);"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><p style="margin-top:8px;">Loading users...</p></div>';
    try{
        var total=await sbAdminUserCount(_adminSearch);
        var users=await sbAdminGetUsers(_adminSearch,_adminPageSize,_adminPage*_adminPageSize);
        countEl.textContent=total+' user'+(total!==1?'s':'')+(_adminSearch?' matching "'+escapeHtml(_adminSearch)+'"':'');
        var h='<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        h+='<tr style="border-bottom:2px solid var(--border);text-align:left;"><th style="padding:8px;">User</th><th style="padding:8px;">Email</th><th style="padding:8px;">Posts</th><th style="padding:8px;">Joined</th><th style="padding:8px;">Status</th><th style="padding:8px;text-align:right;">Actions</th></tr>';
        (users||[]).forEach(function(u){
            var name=escapeHtml(u.display_name||u.username||'Unknown');
            var uname=escapeHtml(u.username||'');
            var email=escapeHtml(u.email||'—');
            var avatar=u.avatar_url||DEFAULT_AVATAR;
            var joined=u.created_at?new Date(u.created_at).toLocaleDateString():'—';
            var suspended=u.is_suspended;
            var isAdmin=u.is_admin;
            var isSelf=currentUser&&u.id===currentUser.id;
            var statusBadge=isAdmin?'<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;">Admin</span>'
                :suspended?'<span style="background:#e74c3c;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;">Suspended</span>'
                :'<span style="background:var(--green);color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;">Active</span>';
            h+='<tr style="border-bottom:1px solid var(--border);">';
            h+='<td style="padding:8px;"><div style="display:flex;align-items:center;gap:8px;"><img src="'+avatar+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"><div><div style="font-weight:600;">'+name+'</div><div style="font-size:11px;color:var(--gray);">@'+uname+'</div></div></div></td>';
            h+='<td style="padding:8px;font-size:12px;">'+email+'</td>';
            h+='<td style="padding:8px;">'+((u.post_count||0))+'</td>';
            h+='<td style="padding:8px;font-size:12px;">'+joined+'</td>';
            h+='<td style="padding:8px;">'+statusBadge+'</td>';
            h+='<td style="padding:8px;text-align:right;">';
            if(!isSelf&&!isAdmin){
                h+='<button class="btn btn-outline admin-suspend-btn" data-uid="'+u.id+'" data-name="'+name+'" style="padding:4px 10px;font-size:11px;margin-right:4px;'+(suspended?'color:var(--green);border-color:var(--green);':'color:#f59e0b;border-color:#f59e0b;')+'">'+(suspended?'<i class="fas fa-check"></i> Unsuspend':'<i class="fas fa-pause"></i> Suspend')+'</button>';
                h+='<button class="btn admin-delete-btn" data-uid="'+u.id+'" data-name="'+name+'" style="padding:4px 10px;font-size:11px;background:#e74c3c;color:#fff;"><i class="fas fa-trash"></i> Delete</button>';
            } else if(isSelf){
                h+='<span style="font-size:11px;color:var(--gray);">You</span>';
            } else {
                h+='<span style="font-size:11px;color:var(--gray);">Admin</span>';
            }
            h+='</td></tr>';
        });
        h+='</table>';
        listEl.innerHTML=h;
        // Pagination
        var totalPages=Math.ceil(total/_adminPageSize);
        var ph='';
        if(totalPages>1){
            for(var i=0;i<totalPages;i++){
                ph+='<button class="btn '+(i===_adminPage?'btn-primary':'btn-outline')+' admin-page-btn" data-pg="'+i+'" style="padding:4px 12px;font-size:12px;margin:0 2px;">'+((i+1))+'</button>';
            }
        }
        pagEl.innerHTML=ph;
        // Bind events
        $$('.admin-page-btn').forEach(function(btn){btn.addEventListener('click',function(){_adminPage=parseInt(btn.dataset.pg);renderAdminPanel();});});
        $$('.admin-suspend-btn').forEach(function(btn){
            btn.addEventListener('click',function(){
                var uid=btn.dataset.uid;var name=btn.dataset.name;
                showModal('<div class="modal-header"><h3><i class="fas fa-pause-circle" style="color:#f59e0b;margin-right:8px;"></i>Toggle Suspend</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;margin-bottom:16px;">Toggle suspension for <strong>'+name+'</strong>?</p><p style="text-align:center;font-size:13px;color:var(--gray);margin-bottom:16px;">Suspended users cannot log in or interact with the platform.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmAdminSuspend" style="background:#f59e0b;color:#fff;">Confirm</button></div></div>');
                document.getElementById('confirmAdminSuspend').addEventListener('click',async function(){
                    closeModal();
                    try{var newStatus=await sbAdminToggleSuspend(uid);showToast(name+(newStatus?' suspended':' unsuspended'));renderAdminPanel();}catch(e){showToast('Error: '+(e.message||'Failed'));console.error(e);}
                });
            });
        });
        $$('.admin-delete-btn').forEach(function(btn){
            btn.addEventListener('click',function(){
                var uid=btn.dataset.uid;var name=btn.dataset.name;
                showModal('<div class="modal-header"><h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Delete User</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="text-align:center;margin-bottom:16px;">Permanently delete <strong>'+name+'</strong> and all their data?</p><p style="text-align:center;font-size:13px;color:#e74c3c;margin-bottom:16px;">This action cannot be undone. All posts, comments, messages, and files will be deleted.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmAdminDelete" style="background:#e74c3c;color:#fff;">Delete Account</button></div></div>');
                document.getElementById('confirmAdminDelete').addEventListener('click',async function(){
                    closeModal();
                    try{await sbAdminDeleteUser(uid);showToast(name+'\'s account deleted');renderAdminPanel();}catch(e){showToast('Error: '+(e.message||'Failed'));console.error(e);}
                });
            });
        });
    }catch(e){
        console.error('Admin panel:',e);
        listEl.innerHTML='<p style="text-align:center;color:#e74c3c;padding:40px;">Failed to load users: '+(e.message||'Unknown error')+'</p>';
    }
    // Search handler
    var searchInput=document.getElementById('adminSearchInput');
    var searchBtn=document.getElementById('adminSearchBtn');
    if(searchBtn&&!searchBtn._bound){
        searchBtn._bound=true;
        searchBtn.addEventListener('click',function(){_adminSearch=searchInput.value.trim();_adminPage=0;renderAdminPanel();});
        searchInput.addEventListener('keydown',function(e){if(e.key==='Enter'){_adminSearch=searchInput.value.trim();_adminPage=0;renderAdminPanel();}});
    }
    // ---- Admin action logs ----
    var logEl=document.getElementById('adminLogList');
    if(logEl){
        logEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--gray);"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>';
        try{
            var logs=await sbAdminGetLogs(50,0);
            if(!logs||!logs.length){
                logEl.innerHTML='<p style="text-align:center;color:var(--gray);padding:20px;">No admin actions logged yet.</p>';
            } else {
                var lh='<table style="width:100%;border-collapse:collapse;font-size:13px;">';
                lh+='<tr style="border-bottom:2px solid var(--border);text-align:left;"><th style="padding:8px;">Date</th><th style="padding:8px;">Admin</th><th style="padding:8px;">Action</th><th style="padding:8px;">Target</th></tr>';
                logs.forEach(function(log){
                    var date=log.created_at?new Date(log.created_at).toLocaleString():'—';
                    var actionLabel=escapeHtml(log.action||'').replace(/_/g,' ');
                    var actionColor=log.action==='delete_user'?'#e74c3c':log.action==='suspend_user'?'#f59e0b':'var(--green)';
                    lh+='<tr style="border-bottom:1px solid var(--border);">';
                    lh+='<td style="padding:8px;font-size:12px;">'+date+'</td>';
                    lh+='<td style="padding:8px;">@'+escapeHtml(log.admin_username||'—')+'</td>';
                    lh+='<td style="padding:8px;"><span style="color:'+actionColor+';font-weight:600;text-transform:capitalize;">'+actionLabel+'</span></td>';
                    lh+='<td style="padding:8px;">@'+escapeHtml(log.target_username||'—')+'</td>';
                    lh+='</tr>';
                });
                lh+='</table>';
                logEl.innerHTML=lh;
            }
        }catch(e){
            console.error('Admin logs:',e);
            logEl.innerHTML='<p style="text-align:center;color:var(--gray);padding:20px;">Failed to load logs.</p>';
        }
    }
}

// ======================== SAVE POST MODAL ========================
function showSaveModal(pid){
    var existing=findPostFolder(pid);
    var h='<div class="modal-header"><h3><i class="fas fa-bookmark" style="color:var(--primary);margin-right:8px;"></i>'+(existing?'Move Post':'Save Post')+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    if(existing) h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Currently in: <strong>'+existing.name+'</strong></p>';
    h+='<p style="font-size:14px;font-weight:600;margin-bottom:10px;">Add to Folder</p>';
    h+='<div id="saveFolderList" style="display:flex;flex-direction:column;gap:6px;">';
    savedFolders.forEach(function(f){
        var inThis=existing&&existing.id===f.id;
        h+='<button class="btn '+(inThis?'btn-disabled':'btn-outline')+' save-folder-pick" data-fid="'+f.id+'" style="text-align:left;justify-content:flex-start;display:flex;align-items:center;gap:8px;"><i class="fas fa-folder" style="color:var(--primary);"></i>'+f.name+(inThis?' <span style="margin-left:auto;font-size:11px;color:var(--gray);">Current</span>':'')+'</button>';
    });
    h+='<button class="btn btn-outline" id="saveNewFolderBtn" style="text-align:left;display:flex;align-items:center;gap:8px;"><i class="fas fa-folder-plus" style="color:var(--green);"></i>+ Create New Folder</button>';
    h+='<div id="saveNewFolderInput" style="display:none;margin-top:6px;"><div style="display:flex;gap:8px;"><input type="text" id="saveNewFolderName" placeholder="Folder name..." style="flex:1;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;"><button class="btn btn-primary" id="saveNewFolderConfirm" style="padding:8px 16px;">Add</button></div></div>';
    h+='</div></div>';
    showModal(h);
    // Bind folder picks
    $$('#saveFolderList .save-folder-pick').forEach(function(btn){
        btn.addEventListener('click',function(){
            if(btn.classList.contains('btn-disabled')) return;
            savePostToFolder(pid,btn.dataset.fid);
            closeModal();
            showToast('Post saved to '+savedFolders.find(function(f){return f.id===btn.dataset.fid;}).name);
        });
    });
    document.getElementById('saveNewFolderBtn').addEventListener('click',function(){
        document.getElementById('saveNewFolderInput').style.display='block';
        document.getElementById('saveNewFolderName').focus();
    });
    document.getElementById('saveNewFolderConfirm').addEventListener('click',function(){
        var name=document.getElementById('saveNewFolderName').value.trim();
        if(!name) return;
        var fid='folder-'+Date.now();
        savedFolders.push({id:fid,name:name,posts:[]});
        savePostToFolder(pid,fid);
        closeModal();
        showToast('Post saved to '+name);
    });
}
function savePostToFolder(pid,fid){
    var s=String(pid);
    // Remove from any existing folder
    savedFolders.forEach(function(f){var idx=f.posts.indexOf(s);if(idx!==-1)f.posts.splice(idx,1);});
    // Add to target
    var target=savedFolders.find(function(f){return f.id===fid;});
    if(target) target.posts.push(s);
    persistSaved();
}

// ======================== COPY POST LINK ========================
function copyPostLink(pid){
    var url=window.location.origin+window.location.pathname+'#post/'+pid;
    if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){showToast('Link copied!');}).catch(function(){_fallbackCopy(url);});
    } else { _fallbackCopy(url); }
}
function _fallbackCopy(text){
    var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');showToast('Link copied!');}catch(e){showToast('Copy failed');}
    ta.remove();
}

// ======================== PIN POST TO PROFILE ========================
function togglePinPost(pid){
    if(!state.pinnedPosts) state.pinnedPosts={};
    if(state.pinnedPosts[pid]){
        delete state.pinnedPosts[pid];
        showToast('Post unpinned');
    } else {
        // Max 3 pinned posts
        var pinned=Object.keys(state.pinnedPosts);
        if(pinned.length>=3){showToast('You can only pin up to 3 posts');return;}
        state.pinnedPosts[pid]=Date.now();
        showToast('Post pinned to profile!');
    }
    saveState();
}

// ======================== MUTE USERS ========================
var mutedUsers={};
try{var _mu=JSON.parse(localStorage.getItem('blipvibe_muted')||'{}');mutedUsers=_mu;}catch(e){}
function persistMuted(){try{localStorage.setItem('blipvibe_muted',JSON.stringify(mutedUsers));}catch(e){}}
function muteUser(userId){
    mutedUsers[userId]=true;
    persistMuted();
    showToast('User muted. Their posts will be hidden.');
}
function unmuteUser(userId){
    delete mutedUsers[userId];
    persistMuted();
    showToast('User unmuted');
}
function showMuteConfirmModal(person,onDone){
    var h='<div class="modal-header"><h3><i class="fas fa-volume-mute" style="color:var(--primary);margin-right:8px;"></i>Mute User</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="text-align:center;margin-bottom:16px;">Mute <strong>'+escapeHtml(person.name||'this user')+'</strong>?<br><span style="font-size:13px;color:var(--gray);">Their posts will be hidden from your feed. They won\'t be notified.</span></p>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="confirmMuteBtn">Mute</button></div></div>';
    showModal(h);
    document.getElementById('confirmMuteBtn').addEventListener('click',function(){
        muteUser(person.id);closeModal();if(onDone)onDone();
    });
}

// ======================== REPORT USER (not just posts) ========================
function showReportUserModal(person){
    var h='<div class="modal-header"><h3><i class="fas fa-flag" style="color:#e74c3c;margin-right:8px;"></i>Report User</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:14px;margin-bottom:14px;color:var(--gray);">Why are you reporting <strong>'+escapeHtml(person.name||'this user')+'</strong>?</p>';
    h+='<div style="display:flex;flex-direction:column;gap:8px;">';
    ['Spam','Harassment','Impersonation','Inappropriate Content','Other'].forEach(function(r){
        h+='<button class="btn btn-outline report-reason-btn" data-reason="'+r+'" style="text-align:left;">'+r+'</button>';
    });
    h+='</div></div>';
    showModal(h);
    $$('.report-reason-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            reportedPosts.push({type:'user',userId:person.id,reason:btn.dataset.reason,time:Date.now()});
            persistReports();
            closeModal();
            showToast('Report submitted. Thank you.');
        });
    });
}

// ======================== STORIES (24hr Ephemeral) ========================
var _storiesData=[];
var _storyViewed={};
try{_storyViewed=JSON.parse(localStorage.getItem('blipvibe_story_viewed')||'{}');}catch(e){}

async function loadStories(){
    try{
        var raw=await sbGetStories(100);
        // Group by user
        var byUser={};
        (raw||[]).forEach(function(s){
            var uid=s.user_id;
            // Only show stories from people you follow + yourself
            if(currentUser&&uid!==currentUser.id&&!state.followedUsers[uid]) return;
            if(!byUser[uid]) byUser[uid]={user:s.author||{id:uid},stories:[]};
            byUser[uid].stories.push(s);
        });
        _storiesData=Object.values(byUser);
        // Sort each user's stories by newest first
        _storiesData.forEach(function(g){
            g.stories.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
            g._newest=g.stories[0]?new Date(g.stories[0].created_at).getTime():0;
        });
        // Sort groups: own first, then unviewed newest-first, then viewed newest-first
        _storiesData.sort(function(a,b){
            var aOwn=currentUser&&a.user.id===currentUser.id?-1:0;
            var bOwn=currentUser&&b.user.id===currentUser.id?-1:0;
            if(aOwn!==bOwn) return aOwn-bOwn;
            var aViewed=a.stories.every(function(s){return _storyViewed[s.id];});
            var bViewed=b.stories.every(function(s){return _storyViewed[s.id];});
            if(aViewed!==bViewed) return aViewed?1:-1;
            return b._newest-a._newest; // newest first within same viewed status
        });
        renderStoriesBar();
    }catch(e){console.warn('Stories load error:',e);renderStoriesBar();}
}

function renderStoriesBar(){
    var bar=document.getElementById('storiesBar');
    if(!bar) return;
    if(!currentUser){bar.innerHTML='';return;}
    var html='';
    // "Your Story" add button
    if(currentUser){
        var myStory=_storiesData.find(function(s){return s.user.id===currentUser.id;});
        var myAvatar=getMyAvatarUrl();
        html+='<div class="story-item story-add" data-uid="'+(currentUser.id)+'">';
        html+='<div class="story-ring'+(myStory?' story-has':'')+'"><img src="'+myAvatar+'" alt="You"></div>';
        html+='<span class="story-name">Your Story</span>';
        if(!myStory) html+='<div class="story-plus"><i class="fas fa-plus"></i></div>';
        html+='</div>';
    }
    _storiesData.forEach(function(group){
        if(currentUser&&group.user.id===currentUser.id) return; // skip own (shown above)
        var user=group.user;
        var avatar=user.avatar_url||DEFAULT_AVATAR;
        var name=user.display_name||user.username||'User';
        var allViewed=group.stories.every(function(s){return _storyViewed[s.id];});
        html+='<div class="story-item" data-uid="'+user.id+'">';
        html+='<div class="story-ring'+(allViewed?' story-viewed':'')+'"><img src="'+avatar+'" alt="'+escapeHtml(name)+'"></div>';
        html+='<span class="story-name">'+escapeHtml(name.split(' ')[0])+'</span>';
        html+='</div>';
    });
    bar.innerHTML=html;
    // Bind clicks
    bar.querySelectorAll('.story-item').forEach(function(item){
        item.addEventListener('click',function(){
            var uid=item.dataset.uid;
            if(item.classList.contains('story-add')){
                var myStory=_storiesData.find(function(s){return s.user.id===uid;});
                if(myStory){
                    // Has stories — show choice
                    var ch='<div class="modal-header"><h3>Your Story</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
                    ch+='<div class="modal-body"><div class="modal-actions" style="flex-direction:column;gap:10px;"><button class="btn btn-primary" id="storyViewMine" style="width:100%;"><i class="fas fa-eye" style="margin-right:6px;"></i>View My Stories</button><button class="btn btn-outline" id="storyCreateNew" style="width:100%;"><i class="fas fa-plus" style="margin-right:6px;"></i>Create New Story</button></div></div>';
                    showModal(ch);
                    document.getElementById('storyViewMine').addEventListener('click',function(){closeModal();openStoryViewer(uid);});
                    document.getElementById('storyCreateNew').addEventListener('click',function(){closeModal();openCreateStory();});
                } else {
                    openCreateStory();
                }
            } else {
                openStoryViewer(uid);
            }
        });
    });
}

function openCreateStory(){
    // Hide global music player while creating story
    var _gmp=document.getElementById('globalMiniPlayer');
    var _gmpWasVisible=_gmp&&_gmp.classList.contains('visible');
    if(_gmp) _gmp.classList.remove('visible');
    var html='<div class="modal-header"><h3><i class="fas fa-plus-circle" style="color:var(--primary);margin-right:8px;"></i>Create Story</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    html+='<div class="modal-body">';
    html+='<div class="story-canvas" id="storyCanvas"><div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray);font-size:14px;">Tap "Photo/Video" or "Add Text" to start</div></div>';
    html+='<div class="story-text-toolbar" id="storyTextToolbar" style="display:none;">';
    html+='<button class="btn btn-outline" id="storyAddTextBtn" style="font-size:11px;padding:4px 10px;"><i class="fas fa-font"></i> Add Text</button>';
    html+='<select id="storyFontSelect"><option value="Roboto">Roboto</option><option value="Orbitron">Orbitron</option><option value="Pacifico">Pacifico</option><option value="Quicksand">Quicksand</option><option value="Space Grotesk">Space Grotesk</option><option value="Caveat">Caveat</option><option value="Press Start 2P">Press Start 2P</option><option value="Bungee">Bungee</option><option value="Satisfy">Satisfy</option></select>';
    html+='<input type="color" id="storyTextColor" value="#ffffff" title="Text Color">';
    html+='<input type="color" id="storyBgColor" value="#00000000" title="Background" style="opacity:.7;">';
    html+='<button class="size-btn" id="storyTextSmaller" title="Smaller">-</button>';
    html+='<button class="size-btn" id="storyTextBigger" title="Bigger">+</button>';
    html+='</div>';
    html+='<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;"><button class="btn btn-outline" id="storyAddPhoto"><i class="fas fa-image"></i> Photo/Video</button><button class="btn btn-outline" id="storyAddSong"><i class="fas fa-music"></i> Song</button><input type="file" id="storyFileInput" accept="image/*,video/*" style="display:none;"></div>';
    html+='<div id="storySongSection" style="display:none;"></div>';
    html+='<button class="btn btn-primary" id="storyPublish" style="width:100%;">Share Story</button>';
    html+='<p style="font-size:11px;color:var(--gray);text-align:center;margin-top:8px;">Stories disappear after 24 hours</p>';
    html+='</div>';
    showModal(html);
    // Restore music player when modal closes (X button or backdrop click)
    var _modalCloseRestore=function(){
        if(_storySongPreview){_storySongPreview.pause();_storySongPreview=null;}
        if(_gmpWasVisible&&_gmp) _gmp.classList.add('visible');
    };
    var _mcBtn=document.querySelector('#modalOverlay .modal-close');
    if(_mcBtn) _mcBtn.addEventListener('click',_modalCloseRestore);
    document.getElementById('modalOverlay').addEventListener('click',function _bgClose(e){
        if(e.target.id==='modalOverlay'){_modalCloseRestore();document.getElementById('modalOverlay').removeEventListener('click',_bgClose);}
    });
    var _storyFile=null;
    var _storySongId=null,_storySongStart=0,_storySongVol=0.5;
    var _storySongPreview=null;
    var _storyOverlays=[];
    var _activeOverlay=null;
    var _overlayIdCounter=0;
    var canvas=document.getElementById('storyCanvas');
    var toolbar=document.getElementById('storyTextToolbar');
    toolbar.style.display='flex';

    // Add text overlay
    document.getElementById('storyAddTextBtn').addEventListener('click',function(){
        var id='sto_'+(++_overlayIdCounter);
        var overlay={id:id,text:'Tap to edit',x:50,y:50,rotation:0,scale:1,fontSize:20,fontFamily:'Roboto',color:'#ffffff',bgColor:'rgba(0,0,0,0.5)'};
        _storyOverlays.push(overlay);
        _renderOverlay(overlay);
    });

    function _renderOverlay(o){
        var el=document.createElement('div');
        el.className='story-text-overlay';
        el.id=o.id;
        el.contentEditable='true';
        el.textContent=o.text;
        el.style.left=o.x+'%';el.style.top=o.y+'%';
        el.style.transform='rotate('+o.rotation+'deg) scale('+o.scale+')';
        el.style.fontSize=o.fontSize+'px';
        el.style.fontFamily="'"+o.fontFamily+"',sans-serif";
        el.style.color=o.color;
        el.style.backgroundColor=o.bgColor;
        el.innerHTML+='<div class="sto-resize"></div><div class="sto-rotate"></div><div class="sto-delete"><i class="fas fa-times"></i></div>';
        canvas.appendChild(el);
        // Select on click
        el.addEventListener('mousedown',function(e){if(!e.target.closest('.sto-resize,.sto-rotate,.sto-delete')) _selectOverlay(el,o);});
        el.addEventListener('touchstart',function(e){if(!e.target.closest('.sto-resize,.sto-rotate,.sto-delete')) _selectOverlay(el,o);},{passive:true});
        // Delete
        el.querySelector('.sto-delete').addEventListener('click',function(e){
            e.stopPropagation();
            _storyOverlays=_storyOverlays.filter(function(x){return x.id!==o.id;});
            el.remove();_activeOverlay=null;
        });
        // Drag
        _makeDraggable(el,o);
        // Resize handle
        _makeResizable(el,o);
        // Rotate handle
        _makeRotatable(el,o);
        _selectOverlay(el,o);
    }

    function _selectOverlay(el,o){
        canvas.querySelectorAll('.story-text-overlay').forEach(function(e){e.classList.remove('active');});
        el.classList.add('active');
        _activeOverlay=o;
        document.getElementById('storyFontSelect').value=o.fontFamily;
        document.getElementById('storyTextColor').value=o.color;
    }

    function _makeDraggable(el,o){
        var startX,startY,startLeft,startTop,dragging=false;
        function onStart(ex,ey){
            if(document.activeElement===el&&el.contentEditable==='true') return;
            dragging=true;startX=ex;startY=ey;
            var rect=el.getBoundingClientRect();var cRect=canvas.getBoundingClientRect();
            startLeft=rect.left-cRect.left;startTop=rect.top-cRect.top;
            el.style.cursor='grabbing';
        }
        function onMove(ex,ey){
            if(!dragging) return;
            var cRect=canvas.getBoundingClientRect();
            var newLeft=startLeft+(ex-startX);var newTop=startTop+(ey-startY);
            o.x=Math.max(0,Math.min(90,(newLeft/cRect.width)*100));
            o.y=Math.max(0,Math.min(90,(newTop/cRect.height)*100));
            el.style.left=o.x+'%';el.style.top=o.y+'%';
        }
        function onEnd(){dragging=false;el.style.cursor='grab';}
        el.addEventListener('mousedown',function(e){if(!e.target.closest('.sto-resize,.sto-rotate,.sto-delete')&&document.activeElement!==el) onStart(e.clientX,e.clientY);});
        document.addEventListener('mousemove',function(e){onMove(e.clientX,e.clientY);});
        document.addEventListener('mouseup',onEnd);
        el.addEventListener('touchstart',function(e){if(!e.target.closest('.sto-resize,.sto-rotate,.sto-delete')&&e.touches.length===1){var t=e.touches[0];onStart(t.clientX,t.clientY);}},{passive:true});
        document.addEventListener('touchmove',function(e){if(dragging&&e.touches.length===1){var t=e.touches[0];onMove(t.clientX,t.clientY);}},{passive:false});
        document.addEventListener('touchend',onEnd);
    }

    function _makeResizable(el,o){
        var handle=el.querySelector('.sto-resize');
        var startX,startY,startScale;
        function onStart(ex,ey){startX=ex;startY=ey;startScale=o.scale;}
        function onMove(ex,ey){
            var delta=((ex-startX)+(ey-startY))*0.005;
            o.scale=Math.max(0.3,Math.min(4,startScale+delta));
            el.style.transform='rotate('+o.rotation+'deg) scale('+o.scale+')';
        }
        handle.addEventListener('mousedown',function(e){e.stopPropagation();onStart(e.clientX,e.clientY);
            function mm(e2){onMove(e2.clientX,e2.clientY);}
            function mu(){document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);}
            document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
        });
        handle.addEventListener('touchstart',function(e){e.stopPropagation();var t=e.touches[0];onStart(t.clientX,t.clientY);
            function tm(e2){var t2=e2.touches[0];onMove(t2.clientX,t2.clientY);}
            function te(){document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',te);}
            document.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',te);
        },{passive:false});
    }

    function _makeRotatable(el,o){
        var handle=el.querySelector('.sto-rotate');
        function getAngle(cx,cy,ex,ey){return Math.atan2(ey-cy,ex-cx)*(180/Math.PI);}
        var startAngle,startRot,centerX,centerY;
        function onStart(ex,ey){
            var rect=el.getBoundingClientRect();
            centerX=rect.left+rect.width/2;centerY=rect.top+rect.height/2;
            startAngle=getAngle(centerX,centerY,ex,ey);startRot=o.rotation;
        }
        function onMove(ex,ey){
            var angle=getAngle(centerX,centerY,ex,ey);
            o.rotation=startRot+(angle-startAngle);
            el.style.transform='rotate('+o.rotation+'deg) scale('+o.scale+')';
        }
        handle.addEventListener('mousedown',function(e){e.stopPropagation();onStart(e.clientX,e.clientY);
            function mm(e2){onMove(e2.clientX,e2.clientY);}
            function mu(){document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);}
            document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
        });
        handle.addEventListener('touchstart',function(e){e.stopPropagation();var t=e.touches[0];onStart(t.clientX,t.clientY);
            function tm(e2){var t2=e2.touches[0];onMove(t2.clientX,t2.clientY);}
            function te(){document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',te);}
            document.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',te);
        },{passive:false});
    }

    // Font select
    document.getElementById('storyFontSelect').addEventListener('change',function(){
        if(!_activeOverlay) return;
        _activeOverlay.fontFamily=this.value;
        var el=document.getElementById(_activeOverlay.id);
        if(el) el.style.fontFamily="'"+this.value+"',sans-serif";
    });
    // Text color
    document.getElementById('storyTextColor').addEventListener('input',function(){
        if(!_activeOverlay) return;
        _activeOverlay.color=this.value;
        var el=document.getElementById(_activeOverlay.id);
        if(el) el.style.color=this.value;
    });
    // Bg color
    document.getElementById('storyBgColor').addEventListener('input',function(){
        if(!_activeOverlay) return;
        var hex=this.value;
        var bg='rgba('+parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16)+',0.5)';
        _activeOverlay.bgColor=bg;
        var el=document.getElementById(_activeOverlay.id);
        if(el) el.style.backgroundColor=bg;
    });
    // Size buttons
    document.getElementById('storyTextSmaller').addEventListener('click',function(){
        if(!_activeOverlay) return;
        _activeOverlay.fontSize=Math.max(10,_activeOverlay.fontSize-2);
        var el=document.getElementById(_activeOverlay.id);
        if(el) el.style.fontSize=_activeOverlay.fontSize+'px';
    });
    document.getElementById('storyTextBigger').addEventListener('click',function(){
        if(!_activeOverlay) return;
        _activeOverlay.fontSize=Math.min(60,_activeOverlay.fontSize+2);
        var el=document.getElementById(_activeOverlay.id);
        if(el) el.style.fontSize=_activeOverlay.fontSize+'px';
    });
    // Deselect on canvas click
    canvas.addEventListener('click',function(e){
        if(e.target===canvas||e.target===canvas.firstChild){
            canvas.querySelectorAll('.story-text-overlay').forEach(function(el){el.classList.remove('active');});
            _activeOverlay=null;
        }
    });

    document.getElementById('storyAddPhoto').addEventListener('click',function(){document.getElementById('storyFileInput').click();});
    // Song picker for stories
    document.getElementById('storyAddSong').addEventListener('click',async function(){
        var section=document.getElementById('storySongSection');
        if(section.style.display!=='none'){section.style.display='none';_storySongId=null;if(_storySongPreview){_storySongPreview.pause();_storySongPreview=null;}return;}
        section.style.display='';
        if(!_shopSongs||!_shopSongs.length) await _loadShopSongs();
        var ownedSongs=(_shopSongs||[]).filter(function(s){return _hasInfinity()||(_shopOwnedSongs&&_shopOwnedSongs[s.id]);});
        if(!ownedSongs.length){section.innerHTML='<p style="font-size:12px;color:var(--gray);text-align:center;padding:12px;">No songs owned. Buy songs from the Skin Shop first.</p>';return;}
        var sh='<div class="story-song-picker">';
        ownedSongs.forEach(function(s){
            sh+='<div class="story-song-item" data-song-id="'+s.id+'" data-url="'+escapeHtml(s.file_url)+'"><i class="fas fa-music" style="color:var(--primary);"></i><span class="sspi-title">'+escapeHtml(s.title)+'</span></div>';
        });
        sh+='</div>';
        sh+='<div class="story-song-controls" id="storySongControls" style="display:none;">';
        sh+='<button id="storySongPlayBtn" style="background:none;color:var(--primary);font-size:16px;"><i class="fas fa-play"></i></button>';
        sh+='<label>Start: <input type="range" id="storySongStartSlider" min="0" max="100" value="0"><span class="story-song-time" id="storySongStartLabel">0:00</span></label>';
        sh+='<label>Vol: <input type="range" id="storySongVolSlider" min="0" max="100" value="50"></label>';
        sh+='<button id="storySongRemove" style="background:none;color:#e74c3c;font-size:12px;"><i class="fas fa-times"></i> Remove</button>';
        sh+='</div>';
        section.innerHTML=sh;
        // Song selection
        section.querySelectorAll('.story-song-item').forEach(function(item){
            item.addEventListener('click',function(){
                section.querySelectorAll('.story-song-item').forEach(function(i){i.classList.remove('selected');});
                item.classList.add('selected');
                _storySongId=item.dataset.songId;
                document.getElementById('storySongControls').style.display='flex';
                // Load audio for preview/scrubbing
                if(_storySongPreview){_storySongPreview.pause();}
                _storySongPreview=new Audio(item.dataset.url);
                _storySongPreview.volume=0.5;
                _storySongPreview.addEventListener('loadedmetadata',function(){
                    var dur=_storySongPreview.duration;
                    document.getElementById('storySongStartSlider').max=Math.floor(dur);
                });
            });
        });
        // Play/pause preview
        section.querySelector('#storySongPlayBtn').addEventListener('click',function(){
            if(!_storySongPreview) return;
            if(_storySongPreview.paused){
                // Pause global player
                var ca=_getCurrentAudio();if(ca&&!ca.paused){_fadeAudio(ca,ca.volume,0,300,function(){ca.pause();});}
                _storySongPreview.currentTime=_storySongStart;
                _storySongPreview.play();
                this.innerHTML='<i class="fas fa-pause"></i>';
            } else {
                _storySongPreview.pause();
                this.innerHTML='<i class="fas fa-play"></i>';
            }
        });
        // Start time slider
        section.querySelector('#storySongStartSlider').addEventListener('input',function(){
            _storySongStart=parseInt(this.value);
            var m=Math.floor(_storySongStart/60);var s=_storySongStart%60;
            document.getElementById('storySongStartLabel').textContent=m+':'+(s<10?'0':'')+s;
            if(_storySongPreview){_storySongPreview.currentTime=_storySongStart;}
        });
        // Volume slider
        section.querySelector('#storySongVolSlider').addEventListener('input',function(){
            _storySongVol=parseInt(this.value)/100;
            if(_storySongPreview) _storySongPreview.volume=_storySongVol;
        });
        // Remove song
        section.querySelector('#storySongRemove').addEventListener('click',function(){
            _storySongId=null;_storySongStart=0;_storySongVol=0.5;
            if(_storySongPreview){_storySongPreview.pause();_storySongPreview=null;}
            section.style.display='none';
        });
    });
    document.getElementById('storyFileInput').addEventListener('change',function(){
        var file=this.files[0];if(!file) return;
        _storyFile=file;
        // Show in canvas — remove placeholder
        canvas.querySelectorAll('div').forEach(function(d){
            if(!d.classList.contains('story-text-overlay')&&!d.closest('.story-text-overlay')) d.remove();
        });
        // Remove existing media
        var oldMedia=canvas.querySelector('img:not(.story-text-overlay img),video:not(.story-text-overlay video)');
        if(oldMedia) oldMedia.remove();
        if(file.type.startsWith('video/')){
            var vid=document.createElement('video');vid.src=URL.createObjectURL(file);vid.controls=true;vid.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
            canvas.insertBefore(vid,canvas.firstChild);
        } else {
            var img=document.createElement('img');img.src=URL.createObjectURL(file);img.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
            canvas.insertBefore(img,canvas.firstChild);
        }
    });
    document.getElementById('storyPublish').addEventListener('click',async function(){
        // Collect text overlay data from the canvas
        var overlayData=[];
        _storyOverlays.forEach(function(o){
            var el=document.getElementById(o.id);
            if(el){o.text=el.textContent.replace(/[\n\r]+$/,'').trim();} // get edited text
            if(o.text) overlayData.push({text:o.text,x:o.x,y:o.y,rotation:o.rotation,scale:o.scale,fontSize:o.fontSize,fontFamily:o.fontFamily,color:o.color,bgColor:o.bgColor});
        });
        var text=''; // text field removed, overlays replace it
        if(!overlayData.length&&!_storyFile){showToast('Add a photo or text');return;}
        this.disabled=true;this.textContent='Sharing...';
        try{
            var mediaUrl=null;var mediaType='text';
            if(_storyFile){
                if(_storyFile.type.startsWith('video/')){mediaUrl=await sbUploadPostVideo(currentUser.id,_storyFile);mediaType='video';}
                else{mediaUrl=await sbUploadPostImage(currentUser.id,_storyFile);mediaType='image';}
            }
            if(_storySongPreview){_storySongPreview.pause();_storySongPreview=null;}
            await sbCreateStory(currentUser.id,mediaUrl,mediaType,text,_storySongId||null,_storySongStart||0,_storySongVol||0.5,overlayData.length?overlayData:null);
            closeModal();
            // Restore global music player
            if(_gmpWasVisible&&_gmp) _gmp.classList.add('visible');
            showToast('Story shared!');
            await loadStories();
        }catch(e){
            console.error('Create story:',e);
            showToast('Failed to share story: '+escapeHtml(e.message||''));
            this.disabled=false;this.textContent='Share Story';
        }
    });
}

async function loadStoryComments(storyId){
    var list=document.getElementById('storyCommentsList');
    var countEl=document.querySelector('.story-comment-count');
    if(!list) return;
    try{
        var comments=await sbGetStoryComments(storyId);
        if(countEl) countEl.textContent=comments.length||'';
        if(!comments.length){
            list.innerHTML='<p style="color:rgba(255,255,255,.5);text-align:center;padding:12px;font-size:12px;">No comments yet</p>';
            return;
        }
        var html='';
        comments.forEach(function(c){
            var cName=(c.author?c.author.display_name||c.author.username:'User');
            var cAvatar=(c.author?c.author.avatar_url:null)||DEFAULT_AVATAR;
            var isOwn=currentUser&&c.user_id===currentUser.id;
            html+='<div class="story-comment" data-cid="'+c.id+'">';
            html+='<img src="'+cAvatar+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">';
            html+='<div style="flex:1;min-width:0;"><strong style="font-size:12px;color:#fff;">'+escapeHtml(cName)+'</strong>';
            html+='<p style="font-size:12px;color:rgba(255,255,255,.8);margin-top:1px;word-break:break-word;">'+renderMentionsInText(escapeHtmlNl(c.content))+'</p></div>';
            if(isOwn) html+='<button class="story-comment-del" data-cid="'+c.id+'" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:11px;cursor:pointer;flex-shrink:0;"><i class="fas fa-trash"></i></button>';
            html+='</div>';
        });
        list.innerHTML=html;
        // Bind delete buttons
        list.querySelectorAll('.story-comment-del').forEach(function(btn){
            btn.addEventListener('click',function(e){
                e.stopPropagation();
                sbDeleteStoryComment(btn.dataset.cid).then(function(){loadStoryComments(storyId);}).catch(function(){showToast('Delete failed');});
            });
        });
        // Bind mention clicks
        list.querySelectorAll('.mention-link').forEach(function(el){
            el.style.cursor='pointer';
            el.addEventListener('click',function(e){
                e.stopPropagation();
                var uname=el.dataset.mention;if(!uname) return;
                sbGetProfileByUsername(uname).then(function(p){
                    if(p){var ov=document.querySelector('.story-viewer-overlay');if(ov)ov.remove();showProfileView(profileToPerson(p));}
                }).catch(function(){});
            });
        });
    }catch(e){
        console.warn('Story comments load error:',e);
        list.innerHTML='<p style="color:rgba(255,255,255,.4);text-align:center;padding:12px;font-size:12px;">Comments unavailable</p>';
    }
}

async function submitStoryComment(storyId,storyUser){
    var input=document.getElementById('storyCommentInput');
    if(!input) return;
    var text=input.value.trim();
    if(!text||!currentUser) return;
    if(!storyUser||!storyUser.id||storyUser.id===currentUser.id){showToast('Can\'t reply to your own story');return;}
    input.value='';
    try{
        // Send as DM to story owner (like Instagram)
        var storyReply='Replied to your story: '+text;
        await sbSendMessage(currentUser.id,storyUser.id,storyReply);
        showToast('Reply sent to '+escapeHtml(storyUser.display_name||storyUser.username||'user'));
        recordInteraction(storyUser.id);
    }catch(e){
        console.error('Story reply error:',e);
        showToast('Reply failed');
    }
}

function openStoryViewer(userId){
    // Build flat list of all stories across all users in order
    var startGroupIdx=_storiesData.findIndex(function(g){return g.user.id===userId;});
    if(startGroupIdx<0){showToast('No stories to show');return;}
    // Flatten: reorder so clicked user is first, then continue in order
    var orderedGroups=[].concat(_storiesData.slice(startGroupIdx),_storiesData.slice(0,startGroupIdx));
    var allStories=[];
    orderedGroups.forEach(function(g){
        g.stories.forEach(function(s){
            allStories.push({story:s,user:g.user});
        });
    });
    if(!allStories.length){showToast('No stories to show');return;}
    var stories=allStories;
    var idx=0;
    // Find first unviewed in the clicked user's stories
    for(var si=0;si<stories.length;si++){
        if(stories[si].user.id===userId&&!_storyViewed[stories[si].story.id]){idx=si;break;}
    }
    // Fade out global player when viewing stories
    var _wasGlobalPlaying=false;
    var _globalAudio=_getCurrentAudio();
    if(_globalAudio&&!_globalAudio.paused){
        _wasGlobalPlaying=true;
        _fadeAudio(_globalAudio,_globalAudio.volume,0,400,function(){_globalAudio.pause();});
    }
    var overlay=document.createElement('div');
    overlay.className='story-viewer-overlay';
    function closeStoryViewer(){
        clearTimeout(overlay._timer);
        if(overlay._storyAudio){overlay._storyAudio.pause();overlay._storyAudio=null;}
        overlay.remove();
        renderStoriesBar();
        // Resume global player if it was playing
        if(_wasGlobalPlaying){
            var ga=_getCurrentAudio();
            if(ga){ga.volume=0;ga.play().then(function(){_fadeAudio(ga,0,_gmpBaseVol,600,null);}).catch(function(){});}
        }
    }
    function render(){
        var entry=stories[idx];
        var s=entry.story;
        var user=entry.user;
        var avatar=user.avatar_url||DEFAULT_AVATAR;
        var name=user.display_name||user.username||'User';
        var time=timeAgoReal(s.created_at);
        var isOwn=currentUser&&user.id===currentUser.id;
        var mediaHtml='';
        if(s.media_url){
            if(s.media_type==='video') mediaHtml='<video src="'+s.media_url+'" autoplay playsinline class="story-media" controls></video>';
            else mediaHtml='<img src="'+s.media_url+'" class="story-media">';
        }
        overlay.innerHTML='<div class="story-progress"><div class="story-progress-fill" style="width:0%;"></div></div>'+
            '<div class="story-header"><img src="'+avatar+'" class="story-header-avatar"><div><strong>'+escapeHtml(name)+'</strong><span style="font-size:11px;color:rgba(255,255,255,.6);margin-left:6px;">'+time+'</span></div><button class="story-close"><i class="fas fa-times"></i></button></div>'+
            '<div class="story-content">'+mediaHtml+(s.text?'<div class="story-text">'+escapeHtml(s.text)+'</div>':'')+'</div>'+
            '<div class="story-nav"><div class="story-nav-left"></div><div class="story-nav-right"></div></div>'+
            (isOwn?'<div class="story-viewers"><button class="story-viewers-btn"><i class="fas fa-eye"></i> Views</button><button class="story-delete-btn" style="color:#e74c3c;"><i class="fas fa-trash"></i></button></div>':'')+
            (isOwn?'':'<div class="story-input-bar"><div class="story-reactions-row">'+_reactionEmojis.map(function(em){return '<button class="story-react-btn" data-emoji="'+em+'">'+em+'</button>';}).join('')+'</div><input type="text" class="story-comment-input" id="storyCommentInput" placeholder="Send message to '+escapeHtml(name)+'..."><button class="story-send-btn"><i class="fas fa-paper-plane"></i></button></div>');
        // Render text overlays
        if(s.text_overlays&&s.text_overlays.length){
            var storyContent=overlay.querySelector('.story-content');
            s.text_overlays.forEach(function(o){
                var oEl=document.createElement('div');
                oEl.className='story-viewer-text-overlay';
                oEl.textContent=o.text;
                oEl.style.left=o.x+'%';oEl.style.top=o.y+'%';
                oEl.style.transform='rotate('+(o.rotation||0)+'deg) scale('+(o.scale||1)+')';
                oEl.style.fontSize=(o.fontSize||20)+'px';
                oEl.style.fontFamily="'"+(o.fontFamily||'Roboto')+"',sans-serif";
                oEl.style.color=o.color||'#ffffff';
                oEl.style.backgroundColor=o.bgColor||'rgba(0,0,0,0.5)';
                storyContent.appendChild(oEl);
            });
        }
        // Story song playback — crossfade between songs
        var _oldStoryAudio=overlay._storyAudio;
        overlay._storyAudio=null;
        if(_oldStoryAudio){
            _fadeAudio(_oldStoryAudio,_oldStoryAudio.volume,0,300,function(){_oldStoryAudio.pause();});
        }
        if(s.song&&s.song.file_url){
            var songBar='<div class="story-song-bar"><i class="fas fa-music ssb-icon"></i><span class="ssb-title">'+escapeHtml(s.song.title)+'</span></div>';
            overlay.querySelector('.story-content').insertAdjacentHTML('beforeend',songBar);
            var storyAudio=new Audio(s.song.file_url);
            storyAudio.currentTime=s.song_start||0;
            storyAudio.volume=0;
            storyAudio.loop=true;
            overlay._storyAudio=storyAudio;
            // Start new song immediately, don't wait for old to finish fading
            setTimeout(function(){
                if(overlay._storyAudio!==storyAudio) return; // another render happened
                storyAudio.play().then(function(){
                    _fadeAudio(storyAudio,0,s.song_volume||0.5,500,null);
                }).catch(function(){});
            },100);
        }
        // Mark as viewed
        _storyViewed[s.id]=true;
        try{localStorage.setItem('blipvibe_story_viewed',JSON.stringify(_storyViewed));}catch(e){}
        if(currentUser) sbViewStory(s.id,currentUser.id);
        // Story reply input (sends as DM) + reactions
        var storyInput=overlay.querySelector('#storyCommentInput');
        var storySendBtn=overlay.querySelector('.story-send-btn');
        var storyVid=overlay.querySelector('video.story-media');
        if(storySendBtn) storySendBtn.addEventListener('click',function(){submitStoryComment(s.id,user);});
        if(storyInput){
            storyInput.addEventListener('keypress',function(e){if(e.key==='Enter')submitStoryComment(s.id,user);});
            storyInput.addEventListener('focus',function(){
                // Pause auto-advance and loop video while typing
                clearTimeout(overlay._timer);
                if(storyVid){storyVid.loop=true;}
                var fill=overlay.querySelector('.story-progress-fill');
                if(fill){fill.style.transition='none';fill.style.width=fill.offsetWidth+'px';}
            });
            storyInput.addEventListener('blur',function(){
                // Stop looping video and resume auto-advance
                if(storyVid){storyVid.loop=false;}
                var fill=overlay.querySelector('.story-progress-fill');
                if(fill){fill.style.transition='width 3s linear';fill.style.width='100%';}
                overlay._timer=setTimeout(function(){
                    if(idx<stories.length-1){idx++;render();}
                    else{closeStoryViewer();}
                },3000);
            });
        }
        // Story emoji reaction buttons — send reaction as DM
        overlay.querySelectorAll('.story-react-btn').forEach(function(rb){
            rb.addEventListener('click',function(e){
                e.stopPropagation();
                if(!currentUser||!user||user.id===currentUser.id) return;
                var emoji=rb.dataset.emoji;
                // Send reaction as DM
                sbSendMessage(currentUser.id,user.id,'Reacted '+emoji+' to your story').then(function(){
                    rb.style.transform='scale(1.5)';rb.style.opacity='0.5';
                    setTimeout(function(){rb.style.transform='';rb.style.opacity='';},400);
                    showToast(emoji+' sent!');
                    recordInteraction(user.id);
                }).catch(function(){showToast('Reaction failed');});
            });
        });
        // Auto-advance: 10s for images/text, video duration for videos
        var fill=overlay.querySelector('.story-progress-fill');
        var storyDuration=10000;
        var vid=overlay.querySelector('video.story-media');
        if(vid){
            // Try to play with sound; if blocked, play muted then unmute on tap
            vid.play().catch(function(){vid.muted=true;vid.play().catch(function(){});});
            vid.addEventListener('loadedmetadata',function(){
                storyDuration=Math.max(vid.duration*1000,3000);
                fill.style.transition='width '+storyDuration+'ms linear';
                fill.style.width='100%';
                clearTimeout(overlay._timer);
                overlay._timer=setTimeout(function(){
                    if(idx<stories.length-1){idx++;render();}
                    else{closeStoryViewer();}
                },storyDuration);
            },{once:true});
            // Tap video to unmute if browser muted it
            vid.addEventListener('click',function(e){e.stopPropagation();if(vid.muted){vid.muted=false;}},{once:true});
        }
        fill.style.transition='width '+storyDuration+'ms linear';
        requestAnimationFrame(function(){fill.style.width='100%';});
        clearTimeout(overlay._timer);
        overlay._timer=setTimeout(function(){
            if(idx<stories.length-1){idx++;render();}
            else{closeStoryViewer();}
        },storyDuration);
    }
    overlay.addEventListener('click',function(e){
        // Ignore clicks on interactive elements (reactions, input, buttons, song bar)
        if(e.target.closest('.story-input-bar,.story-react-btn,.story-comment-input,.story-send-btn,.story-song-bar,.story-viewers,.story-delete-btn,.story-view-list')) return;
        if(e.target.closest('.story-close')){clearTimeout(overlay._timer);closeStoryViewer();return;}
        if(e.target.closest('.story-delete-btn')){
            var sid=stories[idx].id;
            sbDeleteStory(sid).then(function(){closeStoryViewer();loadStories();showToast('Story deleted');}).catch(function(){showToast('Delete failed');});
            return;
        }
        if(e.target.closest('.story-viewers-btn')){
            sbGetStoryViews(stories[idx].id).then(function(views){
                var vh='<div style="padding:12px;color:#fff;"><strong>'+views.length+' view'+(views.length!==1?'s':'')+'</strong>';
                views.forEach(function(v){var vn=v.viewer?(v.viewer.display_name||v.viewer.username):'User';vh+='<div style="padding:4px 0;font-size:13px;">'+escapeHtml(vn)+'</div>';});
                vh+='</div>';
                var infoEl=overlay.querySelector('.story-content');
                if(infoEl) infoEl.insertAdjacentHTML('beforeend','<div class="story-view-list">'+vh+'</div>');
            }).catch(function(){});
            return;
        }
        if(e.target.closest('.story-nav-right')){clearTimeout(overlay._timer);if(idx<stories.length-1){idx++;render();}else{closeStoryViewer();}return;}
        if(e.target.closest('.story-nav-left')){clearTimeout(overlay._timer);if(idx>0){idx--;render();}return;}
    });
    document.body.appendChild(overlay);
    render();
}

// ======================== EMOJI REACTIONS ON POSTS ========================
var _reactionEmojis=['❤️','😂','😮','😢','🔥','👏'];
function showReactionPicker(postId,btn){
    // Remove existing picker
    var existing=document.querySelector('.reaction-picker');
    if(existing) existing.remove();
    var picker=document.createElement('div');
    picker.className='reaction-picker';
    _reactionEmojis.forEach(function(em){
        var b=document.createElement('button');
        b.className='reaction-emoji-btn';
        b.textContent=em;
        b.addEventListener('click',function(e){
            e.stopPropagation();
            toggleReaction(postId,em,btn);
            picker.remove();
        });
        picker.appendChild(b);
    });
    // Position relative to the button using fixed positioning
    var rect=btn.getBoundingClientRect();
    picker.style.position='fixed';
    picker.style.left=rect.left+'px';
    picker.style.top=(rect.top-44)+'px';
    picker.style.bottom='auto';
    document.body.appendChild(picker);
    // Auto-close after 4s or on outside click
    var _closeTimer=setTimeout(function(){picker.remove();},4000);
    document.addEventListener('click',function _closeReact(){picker.remove();clearTimeout(_closeTimer);document.removeEventListener('click',_closeReact);},{once:true});
}
var _postReactions={};
try{_postReactions=JSON.parse(localStorage.getItem('blipvibe_reactions')||'{}');}catch(e){}
function toggleReaction(postId,emoji,btn){
    var had=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
    if(_postReactions[postId]===emoji){
        delete _postReactions[postId];
    } else {
        _postReactions[postId]=emoji;
    }
    try{localStorage.setItem('blipvibe_reactions',JSON.stringify(_postReactions));}catch(e){}
    // Update the react button to show selected emoji or reset to default icon
    if(_postReactions[postId]){
        btn.innerHTML='<span style="font-size:16px;">'+_postReactions[postId]+'</span>';
    } else {
        btn.innerHTML='<i class="far fa-face-smile"></i>';
    }
    // Coin logic: 1 coin for first interaction (like, dislike, or reaction), no extra for additional types
    var has=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
    if(!isOwnPost(postId)){if(!had&&has&&_incrementDailyCoin('postLikes')){state.coins++;updateCoins();showCoinEarnAnimation(btn,1);}else if(had&&!has){state.coins--;updateCoins();showCoinEarnAnimation(btn,-1);}}
    saveState();
    // Save to DB if available
    if(currentUser&&/^[0-9a-f]{8}-/.test(postId)){
        if(_postReactions[postId]){
            sbSetReaction(currentUser.id,'post',postId,emoji).catch(function(){});
        } else {
            sbRemoveReaction(currentUser.id,'post',postId).catch(function(){});
        }
    }
}

// ======================== VOICE NOTES IN DMs ========================
var _voiceRecorder=null;
var _voiceChunks=[];
function startVoiceRecording(onComplete){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showToast('Voice recording not supported in this browser');return;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
        _voiceRecorder=new MediaRecorder(stream,{mimeType:'audio/webm'});
        _voiceChunks=[];
        _voiceRecorder.ondataavailable=function(e){if(e.data.size>0)_voiceChunks.push(e.data);};
        _voiceRecorder.onstop=function(){
            stream.getTracks().forEach(function(t){t.stop();});
            var blob=new Blob(_voiceChunks,{type:'audio/webm'});
            _voiceChunks=[];
            if(onComplete) onComplete(blob);
        };
        _voiceRecorder.start();
        showToast('Recording... tap again to stop');
    }).catch(function(e){showToast('Microphone access denied');});
}
function stopVoiceRecording(){
    if(_voiceRecorder&&_voiceRecorder.state==='recording'){
        _voiceRecorder.stop();
        _voiceRecorder=null;
    }
}

// ======================== CLOSE FRIENDS ========================
var _closeFriends={};
try{_closeFriends=JSON.parse(localStorage.getItem('blipvibe_closefriends')||'{}');}catch(e){}
function persistCloseFriends(){try{localStorage.setItem('blipvibe_closefriends',JSON.stringify(_closeFriends));}catch(e){}}
function toggleCloseFriend(userId){
    if(_closeFriends[userId]){delete _closeFriends[userId];showToast('Removed from Close Friends');}
    else{_closeFriends[userId]=true;showToast('Added to Close Friends');}
    persistCloseFriends();
}
function showCloseFriendsManager(){
    var ids=Object.keys(_closeFriends);
    var h='<div class="modal-header"><h3><i class="fas fa-star" style="color:#f59e0b;margin-right:8px;"></i>Close Friends</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
    if(!ids.length) h+='<p style="text-align:center;color:var(--gray);padding:20px;">No close friends added yet.<br><span style="font-size:12px;">Add people from their profile page.</span></p>';
    else{
        ids.forEach(function(uid){
            h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:13px;">'+uid.substring(0,8)+'...</span><button class="btn btn-outline remove-cf-btn" data-uid="'+uid+'" style="font-size:11px;padding:3px 10px;color:#e74c3c;border-color:#e74c3c;">Remove</button></div>';
        });
    }
    h+='</div>';
    showModal(h);
    $$('.remove-cf-btn').forEach(function(b){b.addEventListener('click',function(){delete _closeFriends[b.dataset.uid];persistCloseFriends();b.textContent='Removed';b.disabled=true;});});
}

// ======================== DOWNLOAD MY DATA (GDPR) ========================
async function downloadMyData(){
    if(!currentUser){showToast('Must be logged in');return;}
    showToast('Preparing your data...');
    try{
        var profile=await sbGetOwnProfile();
        var posts=await sbGetUserPosts(currentUser.id,500);
        var followers=await sbGetFollowers(currentUser.id);
        var following=await sbGetFollowing(currentUser.id);
        var notifs=await sbGetNotifications(currentUser.id,500);
        var data={
            exportDate:new Date().toISOString(),
            profile:{id:profile.id,username:profile.username,display_name:profile.display_name,first_name:profile.first_name,last_name:profile.last_name,bio:profile.bio,avatar_url:profile.avatar_url,created_at:profile.created_at},
            posts:(posts||[]).map(function(p){return {id:p.id,content:p.content,image_url:p.image_url,media_urls:p.media_urls,created_at:p.created_at};}),
            followers:(followers||[]).map(function(f){return {id:f.id,username:f.username,display_name:f.display_name};}),
            following:(following||[]).map(function(f){return {id:f.id,username:f.username,display_name:f.display_name};}),
            notifications:(notifs||[]).map(function(n){return {type:n.type,title:n.title,created_at:n.created_at};}),
            settings:settings,
            coins:state.coins
        };
        var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url;a.download='blipvibe-data-'+currentUser.username+'-'+new Date().toISOString().slice(0,10)+'.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data downloaded!');
    }catch(e){
        console.error('Download data error:',e);
        showToast('Failed to download data: '+escapeHtml(e.message||''));
    }
}

// ======================== POST VIEW COUNTS ========================
var _postViews={};
try{_postViews=JSON.parse(localStorage.getItem('blipvibe_views')||'{}');}catch(e){}
function trackPostView(postId){
    if(!postId) return;
    if(!_postViews[postId]) _postViews[postId]=0;
    _postViews[postId]++;
    try{localStorage.setItem('blipvibe_views',JSON.stringify(_postViews));}catch(e){}
}
// Track views when posts enter viewport
var _viewObserver=null;
function initViewTracking(){
    if(_viewObserver) _viewObserver.disconnect();
    _viewObserver=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
            if(e.isIntersecting){
                var post=e.target;
                var likeBtn=post.querySelector('.like-btn');
                if(likeBtn){
                    var pid=likeBtn.getAttribute('data-post-id');
                    if(pid&&!post._viewed){post._viewed=true;trackPostView(pid);
                        var vc=post.querySelector('.view-count-btn span');
                        if(vc) vc.textContent=_postViews[pid]||0;
                    }
                }
            }
        });
    },{threshold:0.5});
    document.querySelectorAll('.feed-post').forEach(function(p){_viewObserver.observe(p);});
}

// ======================== ONLINE / LAST SEEN STATUS ========================
var _lastSeenInterval=null;
function updateLastSeen(){
    if(!currentUser) return;
    sbUpdateProfile(currentUser.id,{last_seen:new Date().toISOString()}).catch(function(){});
}
function startLastSeenUpdater(){
    updateLastSeen();
    if(_lastSeenInterval) clearInterval(_lastSeenInterval);
    _lastSeenInterval=setInterval(updateLastSeen,60000); // update every 60s
}
function getOnlineStatus(lastSeen){
    if(!lastSeen) return {text:'Offline',online:false};
    var diff=Date.now()-new Date(lastSeen).getTime();
    if(diff<120000) return {text:'Online',online:true}; // within 2 min
    if(diff<3600000) return {text:'Active '+Math.round(diff/60000)+'m ago',online:false};
    if(diff<86400000) return {text:'Active '+Math.round(diff/3600000)+'h ago',online:false};
    return {text:'Offline',online:false};
}

// ======================== READ RECEIPTS IN DMs ========================
function renderReadReceipt(msgEl,isRead){
    var existing=msgEl.querySelector('.msg-read-receipt');
    if(existing) existing.remove();
    if(!msgEl.classList.contains('sent')) return;
    var receipt=document.createElement('span');
    receipt.className='msg-read-receipt';
    receipt.innerHTML=isRead?'<i class="fas fa-check-double" style="color:var(--primary);"></i> Seen':'<i class="fas fa-check"></i>';
    msgEl.appendChild(receipt);
}

// ======================== TYPING INDICATOR IN DMs ========================
var _typingTimer=null;
var _typingShowing=false;
function showTypingIndicator(){
    var area=$('#chatMessages');
    if(!area||_typingShowing) return;
    _typingShowing=true;
    var div=document.createElement('div');
    div.className='msg-typing-indicator';
    div.id='typingIndicator';
    div.innerHTML='<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    area.appendChild(div);
    area.scrollTop=area.scrollHeight;
}
function hideTypingIndicator(){
    _typingShowing=false;
    var el=document.getElementById('typingIndicator');
    if(el) el.remove();
}

// ======================== STREAKS ========================
var _streaks={};
try{_streaks=JSON.parse(localStorage.getItem('blipvibe_streaks')||'{}');}catch(e){}
function persistStreaks(){try{localStorage.setItem('blipvibe_streaks',JSON.stringify(_streaks));}catch(e){}}
function recordInteraction(userId){
    if(!currentUser||userId===currentUser.id) return;
    var key=userId;
    var today=new Date().toISOString().slice(0,10); // YYYY-MM-DD
    if(!_streaks[key]) _streaks[key]={lastDate:null,count:0};
    var s=_streaks[key];
    if(s.lastDate===today) return; // already recorded today
    var yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(s.lastDate===yesterday){
        s.count++;
    } else {
        s.count=1; // reset streak
    }
    s.lastDate=today;
    persistStreaks();
}
function getStreak(userId){
    if(!_streaks[userId]) return 0;
    var s=_streaks[userId];
    var today=new Date().toISOString().slice(0,10);
    var yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(s.lastDate===today||s.lastDate===yesterday) return s.count;
    return 0; // streak expired
}

// ======================== USER BADGES / ACHIEVEMENTS ========================
var _badgeDefs=[
    {id:'early_adopter',name:'Early Adopter',icon:'fa-seedling',color:'#10b981',desc:'Joined during beta'},
    {id:'first_post',name:'First Post',icon:'fa-pen',color:'#3b82f6',desc:'Created your first post'},
    {id:'social_butterfly',name:'Social Butterfly',icon:'fa-users',color:'#8b5cf6',desc:'Followed 10+ people'},
    {id:'popular',name:'Popular',icon:'fa-fire',color:'#ef4444',desc:'Received 50+ likes total'},
    {id:'commenter',name:'Commenter',icon:'fa-comment',color:'#f59e0b',desc:'Left 25+ comments'},
    {id:'group_leader',name:'Group Leader',icon:'fa-crown',color:'#eab308',desc:'Created a group'},
    {id:'skin_collector',name:'Skin Collector',icon:'fa-palette',color:'#ec4899',desc:'Own 5+ skins'},
    {id:'streak_master',name:'Streak Master',icon:'fa-fire-flame-curved',color:'#f97316',desc:'7-day streak with someone'},
    {id:'photographer',name:'Photographer',icon:'fa-camera',color:'#06b6d4',desc:'Posted 10+ photos'},
    {id:'generous',name:'Generous',icon:'fa-heart',color:'#e11d48',desc:'Liked 100+ posts'}
];
function checkBadges(){
    if(!currentUser) return;
    var earned=state.earnedBadges||{};
    var changed=false;
    // Early Adopter — always earned during beta
    if(!earned.early_adopter){earned.early_adopter=Date.now();changed=true;}
    // First Post
    if(!earned.first_post&&state.photos&&state.photos.post&&state.photos.post.length>0){earned.first_post=Date.now();changed=true;}
    // Social Butterfly
    if(!earned.social_butterfly&&state.following>=10){earned.social_butterfly=Date.now();changed=true;}
    // Popular
    var totalLikes=Object.keys(state.likedPosts).length;
    if(!earned.popular&&totalLikes>=50){earned.popular=Date.now();changed=true;}
    // Group Leader
    if(!earned.group_leader&&groups&&groups.some(function(g){return g.owner_id===currentUser.id;})){earned.group_leader=Date.now();changed=true;}
    // Skin Collector
    var skinCount=Object.keys(state.ownedSkins||{}).length+Object.keys(state.ownedPremiumSkins||{}).length;
    if(!earned.skin_collector&&skinCount>=5){earned.skin_collector=Date.now();changed=true;}
    // Streak Master
    var hasStreak7=Object.keys(_streaks).some(function(k){return getStreak(k)>=7;});
    if(!earned.streak_master&&hasStreak7){earned.streak_master=Date.now();changed=true;}
    // Photographer
    if(!earned.photographer&&state.photos&&state.photos.post&&state.photos.post.filter(function(p){return !p.isVideo;}).length>=10){earned.photographer=Date.now();changed=true;}
    if(changed){state.earnedBadges=earned;saveState();}
}
function renderBadgesForProfile(container){
    if(!container) return;
    var earned=state.earnedBadges||{};
    var html='';
    _badgeDefs.forEach(function(b){
        if(earned[b.id]){
            html+='<span class="user-badge" title="'+escapeHtml(b.name)+': '+escapeHtml(b.desc)+'" style="background:'+b.color+';"><i class="fas '+b.icon+'"></i></span>';
        }
    });
    if(html) container.innerHTML='<div class="badge-row">'+html+'</div>';
}

// ======================== NOTIFICATION PREFERENCES ========================
var _notifPrefs={};
try{_notifPrefs=JSON.parse(localStorage.getItem('blipvibe_notifprefs')||'{}');}catch(e){}
function persistNotifPrefs(){try{localStorage.setItem('blipvibe_notifprefs',JSON.stringify(_notifPrefs));}catch(e){}}
function isNotifEnabled(type){
    if(_notifPrefs[type]===false) return false;
    return true; // default: all enabled
}

// ======================== WHO CAN MESSAGE ME ========================
// Stored in settings.messagePrivacy: 'everyone' | 'followers' | 'nobody'
// Checked when someone tries to message via startConversation

// ======================== SCHEDULED POSTS ========================
var _scheduledPosts=[];
try{_scheduledPosts=JSON.parse(localStorage.getItem('blipvibe_scheduled')||'[]');}catch(e){}
function persistScheduled(){try{localStorage.setItem('blipvibe_scheduled',JSON.stringify(_scheduledPosts));}catch(e){}}
function checkScheduledPosts(){
    if(!currentUser||!_scheduledPosts.length) return;
    var now=Date.now();
    var toPublish=_scheduledPosts.filter(function(s){return s.scheduledAt<=now;});
    var remaining=_scheduledPosts.filter(function(s){return s.scheduledAt>now;});
    if(!toPublish.length) return;
    _scheduledPosts=remaining;
    persistScheduled();
    toPublish.forEach(function(s){
        sbCreatePost(currentUser.id,s.content,null,null,null,null,null).then(function(){
            showToast('Scheduled post published!');
            generatePosts();
        }).catch(function(e){console.error('Scheduled post publish:',e);});
    });
}
// Check scheduled posts every 30s
setInterval(checkScheduledPosts,30000);

// ======================== REPORT MODAL ========================
function showReportModal(pid){
    var h='<div class="modal-header"><h3><i class="fas fa-flag" style="color:#e74c3c;margin-right:8px;"></i>Report Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:14px;margin-bottom:14px;color:var(--gray);">Why are you reporting this post?</p>';
    h+='<div style="display:flex;flex-direction:column;gap:8px;">';
    ['Spam','Abuse','Other'].forEach(function(r){
        h+='<button class="btn btn-outline report-reason-btn" data-reason="'+r+'" style="text-align:left;">'+r+'</button>';
    });
    h+='</div></div>';
    showModal(h);
    $$('.report-reason-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            reportedPosts.push({pid:pid,reason:btn.dataset.reason,time:Date.now()});
            persistReports();
            closeModal();
            showToast('Report submitted. Thank you.');
        });
    });
}

// ======================== HIDE POST ========================
// ======================== EDIT POST / COMMENT / MESSAGE ========================
function showEditPostModal(pid){
    var fp=feedPosts.find(function(p){return p.idx===pid;});
    var currentText=fp?fp.text||'':'';
    var h='<div class="modal-header"><h3>Edit Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><textarea id="editPostText" class="cpm-textarea" style="min-height:100px;">'+currentText+'</textarea>';
    h+='<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveEditPostBtn">Save</button></div></div>';
    showModal(h);
    document.getElementById('saveEditPostBtn').addEventListener('click',async function(){
        var newText=$('#editPostText').value.trim();
        if(!newText){showToast('Post cannot be empty');return;}
        try{
            var isUUID=/^[0-9a-f]{8}-/.test(pid);
            if(isUUID) await sbEditPost(pid,newText);
            if(fp) fp.text=newText;
            // Update DOM
            var postEl=document.querySelector('.feed-post[data-post-id="'+pid+'"] .post-description p');
            if(postEl) postEl.textContent=newText;
            closeModal();
            showToast('Post updated');
        }catch(e){console.error('Edit post:',e);showToast('Failed to edit post');}
    });
}
function showEditCommentModal(cid,currentText,onSaved){
    var h='<div class="modal-header"><h3>Edit Comment</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="position:relative;"><textarea id="editCommentText" class="cpm-textarea" style="min-height:80px;">'+currentText+'</textarea>';
    h+='<div id="editCommentEmojiPanel" class="emoji-picker-panel"></div>';
    h+='<div class="modal-actions" style="margin-top:12px;display:flex;gap:8px;align-items:center;"><button class="cpm-emoji-btn" id="editCommentEmojiBtn" title="Emoji"><i class="fas fa-face-smile"></i></button><div style="flex:1;"></div><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveEditCommentBtn">Save</button></div></div>';
    showModal(h);
    document.getElementById('editCommentEmojiBtn').addEventListener('click',function(){openEmojiPicker('editCommentEmojiPanel',document.getElementById('editCommentText'));});
    document.getElementById('saveEditCommentBtn').addEventListener('click',async function(){
        var newText=$('#editCommentText').value.trim();
        if(!newText){showToast('Comment cannot be empty');return;}
        try{
            var isUUID=/^[0-9a-f]{8}-/.test(cid);
            if(isUUID) await sbEditComment(cid,newText);
            closeModal();
            showToast('Comment updated');
            if(onSaved) onSaved(newText);
        }catch(e){console.error('Edit comment:',e);showToast('Failed to edit comment');}
    });
}

function showEditMessageModal(mid,currentText,onSaved){
    var h='<div class="modal-header"><h3>Edit Message</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><textarea id="editMessageText" class="cpm-textarea" style="min-height:80px;">'+currentText+'</textarea>';
    h+='<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveEditMessageBtn">Save</button></div></div>';
    showModal(h);
    document.getElementById('saveEditMessageBtn').addEventListener('click',async function(){
        var newText=$('#editMessageText').value.trim();
        if(!newText){showToast('Message cannot be empty');return;}
        try{
            await sbEditMessage(mid,newText);
            closeModal();
            showToast('Message updated');
            if(onSaved) onSaved(newText);
        }catch(e){console.error('Edit message:',e);showToast('Failed to edit message');}
    });
}
function confirmDeletePost(pid){
    showModal('<div class="modal-header"><h3>Delete Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:var(--gray);text-align:center;margin-bottom:16px;">Are you sure you want to delete this post? This cannot be undone.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmDeletePostBtn" style="background:#e74c3c;color:#fff;">Delete</button></div></div>');
    document.getElementById('confirmDeletePostBtn').addEventListener('click',async function(){
        closeModal();
        try{
            await sbDeletePost(pid);
            feedPosts=feedPosts.filter(function(p){return p.idx!==pid;});
            renderFeed(activeFeedTab);
            showToast('Post deleted');
        }catch(e){
            console.error('Delete post error:',e);
            showToast('Failed to delete post: '+(e.message||'Unknown error'));
        }
    });
}
function hidePost(pid){
    hiddenPosts[pid]=true;
    persistHidden();
    renderFeed(activeFeedTab);
    showUndoToast('Post hidden from your feed',function(){
        delete hiddenPosts[pid];
        persistHidden();
        renderFeed(activeFeedTab);
    });
}
function unhidePost(pid){
    delete hiddenPosts[pid];
    persistHidden();
}
function showEditGroupPostModal(pid){
    var postEl=document.querySelector('#gvPostsFeed .feed-post[data-post-id="'+pid+'"] .post-description p');
    var currentText=postEl?postEl.textContent:'';
    var h='<div class="modal-header"><h3>Edit Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><textarea id="editPostText" class="cpm-textarea" style="min-height:100px;">'+currentText+'</textarea>';
    h+='<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveEditPostBtn">Save</button></div></div>';
    showModal(h);
    document.getElementById('saveEditPostBtn').addEventListener('click',async function(){
        var newText=$('#editPostText').value.trim();
        if(!newText){showToast('Post cannot be empty');return;}
        try{
            await sbEditPost(pid,newText);
            if(postEl) postEl.innerHTML=escapeHtmlNl(newText);
            closeModal();showToast('Post updated');
        }catch(e){console.error('Edit group post:',e);showToast('Failed to edit post');}
    });
}
function confirmDeleteGroupPost(pid){
    showModal('<div class="modal-header"><h3>Delete Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:var(--gray);text-align:center;margin-bottom:16px;">Are you sure you want to delete this post? This cannot be undone.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmDeleteGvPostBtn" style="background:#e74c3c;color:#fff;">Delete</button></div></div>');
    document.getElementById('confirmDeleteGvPostBtn').addEventListener('click',async function(){
        closeModal();
        try{
            await sbDeletePost(pid);
            var postEl=document.querySelector('#gvPostsFeed .feed-post[data-post-id="'+pid+'"]');
            if(postEl) postEl.remove();
            showToast('Post deleted');
        }catch(e){
            console.error('Delete group post:',e);
            showToast('Failed to delete post: '+(e.message||'Unknown error'));
        }
    });
}
function showHiddenPostsModal(){
    var pids=Object.keys(hiddenPosts);
    var h='<div class="modal-header"><h3><i class="fas fa-eye-slash" style="color:var(--primary);margin-right:8px;"></i>Hidden Posts ('+pids.length+')</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;">';
    if(!pids.length){
        h+='<p style="text-align:center;color:var(--gray);padding:20px;">No hidden posts.</p>';
    } else {
        pids.forEach(function(pid){
            var p=feedPosts.find(function(fp){return String(fp.idx)===String(pid);});
            if(!p) return;
            var short=safeTruncate(p.text,100,Array.from(p.text).length>100?'...':'');
            h+='<div class="hidden-post-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">';
            h+='<img src="'+(p.person.img||p.person.avatar_url||DEFAULT_AVATAR)+'" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;object-fit:cover;">';
            h+='<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;">'+p.person.name+'</div><p style="font-size:12px;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+short+'</p></div>';
            h+='<button class="btn btn-outline unhide-btn" data-pid="'+pid+'" style="padding:6px 14px;font-size:12px;flex-shrink:0;"><i class="fas fa-eye"></i> Unhide</button>';
            h+='</div>';
        });
    }
    h+='</div>';
    showModal(h);
    $$('.unhide-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            unhidePost(btn.dataset.pid);
            showHiddenPostsModal();
            renderFeed(activeFeedTab);
        });
    });
}

// ======================== BLOCK USER SYSTEM ========================
function showBlockConfirmModal(person,onDone){
    if(currentUser&&person.id===currentUser.id){showToast('You can\'t block yourself');return;}
    var h='<div class="modal-header"><h3><i class="fas fa-ban" style="color:#e74c3c;margin-right:8px;"></i>Block '+person.name+'?</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<p style="color:var(--gray);font-size:14px;text-align:center;margin-bottom:16px;">They won\'t be able to see your posts or interact with you. Their posts will be hidden from your feed.</p>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmBlockBtn" style="background:#e74c3c;color:#fff;"><i class="fas fa-ban"></i> Block</button></div>';
    h+='</div>';
    showModal(h);
    document.getElementById('confirmBlockBtn').addEventListener('click',function(){
        blockUser(person.id);
        closeModal();
        if(onDone) onDone();
    });
}
function blockUser(uid){
    if(currentUser&&uid===currentUser.id){showToast('You can\'t block yourself');return;}
    blockedUsers[uid]=true;
    persistBlocked();
    // Unfollow them if following
    if(state.followedUsers[uid]){
        delete state.followedUsers[uid];
    }
    // Remove from my followers
    var idx=myFollowers.indexOf(uid);
    if(idx!==-1){myFollowers.splice(idx,1);}
    updateFollowCounts();
    renderFeed(activeFeedTab);
    renderMsgContacts();
    updateMsgBadge();
    // If currently chatting with blocked user, clear chat
    if(activeChat&&activeChat.partnerId===uid){
        activeChat=null;
        var mc=$('#msgChat');
        if(mc) mc.innerHTML='<div class="msg-chat-placeholder"><i class="fas fa-envelope-open-text"></i><p>Select a conversation to start messaging</p></div>';
    }
    showToast('User blocked');
}
function unblockUser(uid){
    delete blockedUsers[uid];
    persistBlocked();
    renderFeed(activeFeedTab);
    showToast('User unblocked');
}
async function showBlockedUsersModal(){
    var uids=Object.keys(blockedUsers);
    var h='<div class="modal-header"><h3><i class="fas fa-ban" style="color:#e74c3c;margin-right:8px;"></i>Blocked Users ('+uids.length+')</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;">';
    if(!uids.length){
        h+='<p style="text-align:center;color:var(--gray);padding:20px;">No blocked users.</p>';
    } else {
        for(var i=0;i<uids.length;i++){
            var uid=uids[i];
            var name='User';var bio='';var avatar=DEFAULT_AVATAR;
            try{var p=await sbGetProfile(uid);if(p){name=p.display_name||p.username||'User';bio=p.bio||'';avatar=p.avatar_url||DEFAULT_AVATAR;}}catch(e){}
            h+='<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">';
            h+='<img src="'+avatar+'" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;">';
            h+='<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;">'+name+'</div><p style="font-size:12px;color:var(--gray);">'+bio+'</p></div>';
            h+='<button class="btn btn-outline unblock-btn" data-uid="'+uid+'" style="padding:6px 14px;font-size:12px;flex-shrink:0;color:#e74c3c;border-color:#e74c3c;"><i class="fas fa-unlock"></i> Unblock</button>';
            h+='</div>';
        }
    }
    h+='</div>';
    showModal(h);
    $$('.unblock-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            unblockUser(btn.dataset.uid);
            showBlockedUsersModal();
        });
    });
}

// ======================== DEVELOPER UPDATES (CHANGELOG) ========================
var _changelogData=null;
async function showDevUpdatesModal(){
    closeModal();
    // Fetch changelog (cached after first load)
    if(!_changelogData){
        try{
            var resp=await fetch('changelog.json?t='+Date.now());
            _changelogData=await resp.json();
        }catch(e){
            showToast('Failed to load updates');return;
        }
    }
    var logs=_changelogData;
    var h='<div class="modal-header"><h3><i class="fas fa-code-branch" style="color:var(--primary);margin-right:8px;"></i>Developer Updates</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="padding:16px 20px;max-height:65vh;overflow-y:auto;">';
    logs.forEach(function(entry,i){
        var d=new Date(entry.date+'T00:00:00');
        var dateStr=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
        var isFirst=i===0;
        h+='<div class="cl-entry" data-cli="'+i+'" style="border:1px solid rgba(128,128,128,.3);border-radius:10px;margin-bottom:10px;overflow:hidden;">';
        h+='<div class="cl-header" data-cli="'+i+'" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;user-select:none;transition:background .15s;">';
        h+='<span style="font-size:14px;font-weight:500;">'+dateStr+' — <span style="color:var(--primary);font-weight:600;">v'+escapeHtml(entry.version)+'</span>';
        if(isFirst) h+=' <span style="background:var(--primary);color:#fff;font-size:10px;padding:1px 6px;border-radius:8px;margin-left:6px;font-weight:600;vertical-align:middle;">NEW</span>';
        h+='</span>';
        h+='<i class="fas fa-chevron-down cl-chevron" style="font-size:12px;opacity:.5;transition:transform .25s;"></i>';
        h+='</div>';
        h+='<div class="cl-body" style="max-height:0;overflow:hidden;transition:max-height .3s ease;padding:0 16px;">';
        h+='<div style="padding-bottom:14px;">';
        if(entry.added&&entry.added.length){
            h+='<p style="font-size:12px;font-weight:600;color:var(--green);margin:8px 0 4px;"><i class="fas fa-plus" style="margin-right:4px;"></i>Added</p>';
            entry.added.forEach(function(a){h+='<p style="font-size:13px;margin:2px 0 2px 16px;opacity:.85;">'+escapeHtml(a)+'</p>';});
        }
        if(entry.changed&&entry.changed.length){
            h+='<p style="font-size:12px;font-weight:600;color:#f59e0b;margin:8px 0 4px;"><i class="fas fa-pen" style="margin-right:4px;"></i>Changed</p>';
            entry.changed.forEach(function(c){h+='<p style="font-size:13px;margin:2px 0 2px 16px;opacity:.85;">'+escapeHtml(c)+'</p>';});
        }
        if(entry.fixed&&entry.fixed.length){
            h+='<p style="font-size:12px;font-weight:600;color:#3b82f6;margin:8px 0 4px;"><i class="fas fa-bug" style="margin-right:4px;"></i>Fixed</p>';
            entry.fixed.forEach(function(f){h+='<p style="font-size:13px;margin:2px 0 2px 16px;opacity:.85;">'+escapeHtml(f)+'</p>';});
        }
        h+='</div></div></div>';
    });
    h+='</div>';
    showModal(h);
    // Accordion behavior — one open at a time
    $$('.cl-header').forEach(function(hdr){
        hdr.addEventListener('click',function(){
            var idx=hdr.dataset.cli;
            var entry=hdr.closest('.cl-entry');
            var body=entry.querySelector('.cl-body');
            var chevron=hdr.querySelector('.cl-chevron');
            var isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
            // Close all
            $$('.cl-body').forEach(function(b){b.style.maxHeight='0';});
            $$('.cl-chevron').forEach(function(c){c.style.transform='rotate(0deg)';});
            // Open clicked (if it was closed)
            if(!isOpen){
                body.style.maxHeight=body.scrollHeight+'px';
                chevron.style.transform='rotate(180deg)';
            }
        });
    });
}

// ======================== TOAST NOTIFICATION ========================
function showToast(msg){
    var t=document.createElement('div');
    t.className='dq-toast';
    t.textContent=msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('show');});
    setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2500);
}
function showUndoToast(msg,onUndo){
    $$('.dq-toast').forEach(function(el){el.remove();});
    var t=document.createElement('div');
    t.className='dq-toast dq-toast-undo';
    t.innerHTML='<span>'+msg+'</span><button class="dq-toast-undo-btn">Undo</button>';
    document.body.appendChild(t);
    var timer;
    t.querySelector('.dq-toast-undo-btn').addEventListener('click',function(){
        clearTimeout(timer);
        t.classList.remove('show');
        setTimeout(function(){t.remove();},300);
        if(onUndo) onUndo();
    });
    requestAnimationFrame(function(){t.classList.add('show');});
    timer=setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},5000);
}

// ======================== SAVED PAGE ========================
var _savedOpenFolder=null;
var _currentSavedTab='all';
var _savedPostCache={};
async function renderSavedPage(){
    _savedOpenFolder=null;
    var container=document.getElementById('savedContent');
    // Collect all saved post IDs and fetch any missing from Supabase
    var allIds=[];
    savedFolders.forEach(function(f){f.posts.forEach(function(pid){if(allIds.indexOf(pid)===-1)allIds.push(pid);});});
    var missing=allIds.filter(function(pid){
        return !_savedPostCache[pid]&&!feedPosts.find(function(fp){return String(fp.idx)===pid;});
    });
    if(missing.length){
        try{
            var rows=await sbGetPostsByIds(missing);
            rows.forEach(function(p){
                if(!p||!p.author) return;
                _savedPostCache[String(p.id)]={
                    idx:p.id,
                    person:{id:p.author.id,name:p.author.display_name||p.author.username||'User',img:null,avatar_url:p.author.avatar_url},
                    text:p.content||'',tags:[],badge:null,
                    likes:p.like_count||0,comments:[],commentCount:0,
                    shares:0,
                    images:p.media_urls&&p.media_urls.length?p.media_urls:(p.image_url?[p.image_url]:null),
                    created_at:p.created_at
                };
            });
        }catch(e){console.warn('Failed to load saved posts:',e);}
    }
    var h='';
    // Pill tabs — "All" + one per folder
    h+='<div class="search-tabs" id="savedPillTabs">';
    h+='<button class="search-tab'+(_currentSavedTab==='all'?' active':'')+'" data-stab="all"><i class="fas fa-bookmark"></i> All</button>';
    savedFolders.forEach(function(f){
        h+='<button class="search-tab'+(_currentSavedTab===f.id?' active':'')+'" data-stab="'+f.id+'">'+f.name+' <span class="saved-tab-count">'+(f.posts.length||0)+'</span>';
        if(f.id!=='fav') h+=' <span class="album-del-x" data-fid="'+f.id+'" title="Delete folder"><i class="fas fa-times-circle"></i></span>';
        h+='</button>';
    });
    h+='</div>';
    // Tab content
    h+='<div id="savedTabContent">';
    h+=_renderSavedTabPosts();
    h+='</div>';
    container.innerHTML=h;
    bindMentionClicks('#savedTabContent');
    bindHashtagClicks('#savedTabContent');
    // Drag-scroll on pill tabs
    var pillTabs=document.getElementById('savedPillTabs');
    if(pillTabs) _bindDragScroll(pillTabs);
    _bindSavedPageEvents();
}
function _renderSavedTabPosts(){
    var ids=[];
    if(_currentSavedTab==='all'){
        savedFolders.forEach(function(f){f.posts.forEach(function(pid){if(ids.indexOf(pid)===-1)ids.push(pid);});});
    } else {
        var f=savedFolders.find(function(x){return x.id===_currentSavedTab;});
        if(f) ids=f.posts.slice();
    }
    if(!ids.length){
        return '<div class="card" style="padding:40px;text-align:center;color:var(--gray);margin-top:12px;"><i class="fas fa-bookmark" style="font-size:36px;margin-bottom:12px;display:block;opacity:.4;"></i><p>'+(_currentSavedTab==='all'?'No saved posts yet.':'This folder is empty.')+'</p>'+(_currentSavedTab==='all'?'<p style="font-size:13px;margin-top:6px;">Use the <i class="fas fa-ellipsis-h"></i> menu on any post to save it.</p>':'')+'</div>';
    }
    var h='';
    ids.forEach(function(pid){
        var p=feedPosts.find(function(fp){return String(fp.idx)===pid;})||_savedPostCache[pid];
        if(p) h+=renderSavedPostCard(p);
    });
    return h||'<p style="color:var(--gray);padding:20px;">Saved posts could not be loaded.</p>';
}
function renderSavedPostCard(p){
    var i=p.idx,person=p.person,text=p.text,badge=p.badge,likes=p.likes,genComments=p.comments,shares=p.shares;
    var _ws=safeWordSplit(text,160);var short=renderMentionsInText(escapeHtmlNl(_ws[0]));var rest=_ws[1]?renderMentionsInText(escapeHtmlNl(_ws[1])):'';var hasMore=rest.length>0;
    var folder=findPostFolder(i);
    var html='<div class="card feed-post saved-post-item" data-spid="'+i+'">';
    html+='<div class="post-header">';
    html+='<img src="'+(person.img||person.avatar_url||DEFAULT_AVATAR)+'" alt="'+escapeHtml(person.name)+'" class="post-avatar" style="object-fit:cover;">';
    var timeStr=p.created_at?timeAgoReal(p.created_at):timeAgo(typeof i==='number'?i:0);
    html+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username">'+escapeHtml(person.name)+'</h4><span class="post-time">'+timeStr+'</span></div>';
    var badgesHtml='';
    if(badge) badgesHtml+='<span class="badge '+badge.cls+'"><i class="fas '+badge.icon+'"></i> '+badge.text+'</span>';
    if(folder) badgesHtml+='<span class="badge badge-blue"><i class="fas fa-folder"></i> '+folder.name+'</span>';
    if(badgesHtml) html+='<div class="post-badges">'+badgesHtml+'</div>';
    html+='</div>';
    html+='<button class="btn btn-outline saved-unsave-btn" data-pid="'+i+'" style="padding:4px 12px;font-size:12px;margin-left:auto;"><i class="fas fa-bookmark-slash"></i> Unsave</button>';
    html+='</div>';
    html+='<div class="post-description"><p>'+short+(hasMore?'<span class="view-more-text hidden">'+rest+'</span>':'')+(hasMore?' . . . <button class="view-more-btn">View More</button>':'')+'</p></div>';
    html+=buildMediaGrid(p.images);
    html+='<div class="post-actions"><div class="action-left">';
    html+='<button class="action-btn like-btn" data-post-id="'+i+'"><i class="'+(state.likedPosts[i]?'fas':'far')+' fa-thumbs-up"></i><span class="like-count">'+likes+'</span></button>';
    html+='<button class="action-btn comment-btn"><i class="far fa-comment"></i><span>'+genComments.length+'</span></button>';
    html+='<button class="action-btn share-btn"><i class="fas fa-share-from-square"></i><span>'+shares+'</span></button>';
    html+='</div></div>';
    html+='</div>';
    return html;
}
function renderSavedFolderView(fid){
    _currentSavedTab=fid;
    renderSavedPage();
}
function _bindSavedPageEvents(){
    var c=document.getElementById('savedContent');
    // Pill tab clicks — switch folder with fade transition
    $$('#savedPillTabs .search-tab').forEach(function(tab){
        tab.addEventListener('click',function(e){
            if(e.target.closest('.album-del-x')) return;
            $$('#savedPillTabs .search-tab').forEach(function(t){t.classList.remove('active');});
            tab.classList.add('active');_currentSavedTab=tab.dataset.stab;
            var tc=document.getElementById('savedTabContent');
            if(tc){tc.style.opacity='0';tc.style.transform='translateX(10px)';setTimeout(function(){tc.innerHTML=_renderSavedTabPosts();tc.style.opacity='1';tc.style.transform='translateX(0)';_bindSavedPostEvents();},200);}
        });
    });
    // Delete folder (X on pill)
    $$('#savedPillTabs .album-del-x').forEach(function(x){
        x.addEventListener('click',function(e){
            e.stopPropagation();var fid=x.dataset.fid;
            var f=savedFolders.find(function(fx){return fx.id===fid;});
            if(!f) return;
            if(!confirm('Delete folder "'+f.name+'"? Saved post references will be removed.')) return;
            savedFolders=savedFolders.filter(function(fx){return fx.id!==fid;});
            if(_currentSavedTab===fid) _currentSavedTab='all';
            persistSaved();renderSavedPage();
        });
    });
    _bindSavedPostEvents();
}
function _bindSavedPostEvents(){
    var c=document.getElementById('savedContent');
    // Unsave
    c.querySelectorAll('.saved-unsave-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var pid=btn.dataset.pid;
            savedFolders.forEach(function(f){var idx=f.posts.indexOf(String(pid));if(idx!==-1)f.posts.splice(idx,1);});
            persistSaved();
            var tc=document.getElementById('savedTabContent');
            if(tc){tc.innerHTML=_renderSavedTabPosts();_bindSavedPostEvents();}
            // Update pill counts
            $$('#savedPillTabs .search-tab').forEach(function(tab){
                var fid=tab.dataset.stab;if(fid==='all') return;
                var f=savedFolders.find(function(x){return x.id===fid;});
                var cnt=tab.querySelector('.saved-tab-count');
                if(f&&cnt) cnt.textContent=f.posts.length;
            });
            showToast('Post unsaved');
        });
    });
    // View more
    c.querySelectorAll('.view-more-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.preventDefault();e.stopPropagation();
            var span=btn.closest('p').querySelector('.view-more-text');
            if(!span) return;
            if(span.classList.contains('hidden')){span.classList.remove('hidden');btn.textContent='View Less';}
            else{span.classList.add('hidden');btn.textContent='View More';}
        });
    });
}
// Create folder button on page
document.getElementById('createFolderBtn').addEventListener('click',function(){
    var h='<div class="modal-header"><h3>Create Folder</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><input type="text" id="newFolderNameInput" placeholder="Folder name..." style="width:100%;padding:10px 14px;border:2px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:12px;"><button class="btn btn-primary" id="newFolderCreateConfirm" style="width:100%;">Create</button></div>';
    showModal(h);
    document.getElementById('newFolderNameInput').focus();
    document.getElementById('newFolderCreateConfirm').addEventListener('click',function(){
        var n=document.getElementById('newFolderNameInput').value.trim();
        if(!n) return;
        savedFolders.push({id:'folder-'+Date.now(),name:n,posts:[]});
        persistSaved();closeModal();renderSavedPage();
        showToast('Folder "'+n+'" created');
    });
});

// ======================== DRAG-TO-SCROLL ========================
function _bindDragScroll(row){
    if(row._dragBound) return;
    row._dragBound=true;
    var isDown=false,startX,scrollL,moved,velX=0,lastX=0,lastT=0,raf;
    function coast(){velX*=0.92;if(Math.abs(velX)>0.3){row.scrollLeft-=velX;raf=requestAnimationFrame(coast);}else{row.classList.remove('dragging');}};
    row.addEventListener('mousedown',function(e){isDown=true;moved=false;cancelAnimationFrame(raf);row.classList.remove('dragging');startX=e.pageX-row.offsetLeft;scrollL=row.scrollLeft;lastX=e.pageX;lastT=Date.now();velX=0;});
    row.addEventListener('mouseleave',function(){isDown=false;if(moved){coast();}else{row.classList.remove('dragging');}});
    row.addEventListener('mouseup',function(){isDown=false;if(moved){coast();}else{row.classList.remove('dragging');}});
    row.addEventListener('mousemove',function(e){if(!isDown)return;var dx=Math.abs(e.pageX-row.offsetLeft-startX);if(dx>5){moved=true;row.classList.add('dragging');}if(!moved)return;e.preventDefault();var now=Date.now(),dt=now-lastT||1;velX=0.8*velX+0.2*((e.pageX-lastX)/dt*16);lastX=e.pageX;lastT=now;row.scrollLeft=scrollL-(e.pageX-row.offsetLeft-startX);});
    row.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
}
function initDragScroll(container){
    $$(container+' .shop-scroll-row').forEach(_bindDragScroll);
    // Also bind the container itself if it's a scrollable element (e.g. .search-tabs)
    var el=$(container);
    if(el&&el.classList.contains('search-tabs')) _bindDragScroll(el);
}

// ======================== INITIALIZE ========================
// Reapply template on resize (mobile forces cinema, desktop uses user choice)
window.addEventListener('resize',function(){var _rT;return function(){clearTimeout(_rT);_rT=setTimeout(function(){applyTemplate(state.activeTemplate,true);},200);};}());
if(!state.activeTemplate){applyTemplate('spotlight',true);state.activeTemplate='spotlight';}
// generatePosts() is called in initApp() after auth — don't call here to avoid race condition
renderSuggestions();
renderTrendingSidebar();
renderGroups();
renderProfiles();
renderSkinPage();
renderMsgContacts();
renderNotifications();
renderPhotosCard();
updateCoins();
updateFollowCounts();

// ======================== PULL-TO-REFRESH (mobile) ========================
(function(){
    var ptrEl=document.createElement('div');ptrEl.className='ptr-indicator';
    ptrEl.innerHTML='<div class="ptr-spinner"><i class="fas fa-sync-alt"></i></div>';
    document.body.prepend(ptrEl);
    var startY=0,pulling=false,ptrDist=0,threshold=70,refreshing=false;
    function isAtTop(){return window.scrollY<=0;}
    function isMobile(){return window.innerWidth<=768;}
    document.addEventListener('touchstart',function(e){
        if(!isMobile()||refreshing||!isAtTop()) return;
        // Don't trigger inside scrollable sub-containers
        var el=e.target;
        while(el&&el!==document.body){
            if(el.scrollTop>0) return;
            el=el.parentElement;
        }
        startY=e.touches[0].clientY;pulling=true;ptrDist=0;
    },{passive:true});
    document.addEventListener('touchmove',function(e){
        if(!pulling||refreshing) return;
        var dy=e.touches[0].clientY-startY;
        if(dy<0){ptrDist=0;ptrEl.style.transform='translateY(-50px)';ptrEl.style.opacity='0';return;}
        ptrDist=Math.min(dy*0.4,120);
        ptrEl.style.transform='translateY('+(ptrDist-50)+'px)';
        ptrEl.style.opacity=Math.min(ptrDist/threshold,1);
        var icon=ptrEl.querySelector('i');
        if(icon) icon.style.transform='rotate('+Math.min(ptrDist/threshold*360,360)+'deg)';
        if(ptrDist>=threshold) ptrEl.classList.add('ptr-ready');
        else ptrEl.classList.remove('ptr-ready');
    },{passive:true});
    document.addEventListener('touchend',function(){
        if(!pulling) return;
        pulling=false;
        if(ptrDist>=threshold&&!refreshing){
            refreshing=true;
            var ic=ptrEl.querySelector('i');if(ic)ic.style.transform='';
            ptrEl.classList.add('ptr-loading');
            ptrEl.classList.remove('ptr-ready');
            ptrEl.style.transform='translateY(20px)';ptrEl.style.opacity='1';
            (async function(){
                try{
                    var pg=document.querySelector('.page.active');
                    var pageId=pg?pg.id.replace('page-',''):'home';
                    if(pageId==='home'){await generatePosts();renderFeed(activeFeedTab);}
                    else if(pageId==='groups'){await loadGroups();renderGroups();}
                    else if(pageId==='notifications'){if(currentUser){var n=await sbGetNotifications(currentUser.id,500);state.notifications=(n||[]).map(function(x){var ot=(x.data&&x.data.originalType)||x.type||'system';var tx=x.title||x.body||'';if(!tx&&x.data&&x.data.message)tx=x.data.message;if(!tx)tx='Notification';return{type:ot,text:tx,time:timeAgoReal(x.created_at),read:x.is_read,id:x.id,postId:(x.data&&x.data.post_id)||null,data:x.data||{}};});updateNotifBadge();renderNotifications();}}
                    else if(pageId==='profiles'){renderProfiles(currentProfileTab);}
                    else if(pageId==='messages'){loadConversations();}
                    else{await generatePosts();renderFeed(activeFeedTab);}
                }catch(e){console.error('PTR refresh error:',e);}
                setTimeout(function(){refreshing=false;ptrEl.classList.remove('ptr-loading');ptrEl.style.transform='translateY(-50px)';ptrEl.style.opacity='0';},300);
            })();
        } else {
            ptrEl.style.transform='translateY(-50px)';ptrEl.style.opacity='0';
            ptrEl.classList.remove('ptr-ready');
        }
    });
})();

// ======================== LIGHTBOX ========================
(function(){
    var overlay=document.createElement('div');overlay.className='lightbox-overlay';
    overlay.innerHTML=
        '<button class="lightbox-close"><i class="fas fa-times"></i></button>'+
        '<div class="lightbox-layout">'+
            '<div class="lightbox-media">'+
                '<button class="lightbox-arrow lightbox-prev"><i class="fas fa-chevron-left"></i></button>'+
                '<img src="" alt="">'+
                '<video src="" controls playsinline style="display:none;max-width:90vw;max-height:80vh;"></video>'+
                '<button class="lightbox-arrow lightbox-next"><i class="fas fa-chevron-right"></i></button>'+
                '<div class="lightbox-bar">'+
                    '<div class="lightbox-counter"></div>'+
                    '<div class="lightbox-reactions">'+
                        '<button class="lb-like-btn"><i class="far fa-thumbs-up"></i><span>0</span></button>'+
                        '<button class="lb-dislike-btn"><i class="far fa-thumbs-down"></i><span>0</span></button>'+
                    '</div>'+
                    '<button class="lightbox-comment-toggle"><i class="far fa-comment"></i><span>0</span></button>'+
                '</div>'+
            '</div>'+
            '<div class="lightbox-comments">'+
                '<div class="lb-comments-header"><h4>Comments</h4><button class="lb-comments-close"><i class="fas fa-times"></i></button></div>'+
                '<div class="lb-comments-scroll"><div class="lb-comments-list"></div></div>'+
                '<div class="lb-comments-input">'+
                    '<div id="lbEmojiPanel" class="emoji-picker-panel"></div>'+
                    '<div class="lb-reply-indicator" style="display:none;">Replying to <span class="lb-reply-name"></span> <button class="lb-cancel-reply" style="background:none;color:#999;font-size:12px;margin-left:8px;cursor:pointer;">Cancel</button></div>'+
                    '<div style="display:flex;gap:8px;align-items:center;"><input type="text" class="post-input lb-comment-input" id="lbCommentInput" placeholder="Write a comment..." style="flex:1;"><button class="lb-emoji-btn" title="Emoji"><i class="fas fa-face-smile"></i></button><button class="lb-gif-btn" title="Search GIFs">GIF</button><button class="btn btn-primary lb-post-btn">Post</button></div>'+
                '</div>'+
            '</div>'+
        '</div>';
    document.body.appendChild(overlay);

    var layout=overlay.querySelector('.lightbox-layout');
    var media=overlay.querySelector('.lightbox-media');
    var img=overlay.querySelector('.lightbox-media img');
    var vid=overlay.querySelector('.lightbox-media video');
    var prev=overlay.querySelector('.lightbox-prev');
    var next=overlay.querySelector('.lightbox-next');
    var counter=overlay.querySelector('.lightbox-counter');
    var commentToggle=overlay.querySelector('.lightbox-comment-toggle');
    var commentToggleCount=commentToggle.querySelector('span');
    var commentsPanel=overlay.querySelector('.lightbox-comments');
    var commentsList=overlay.querySelector('.lb-comments-list');
    var commentInput=overlay.querySelector('.lb-comment-input');
    var postBtn=overlay.querySelector('.lb-post-btn');
    var replyIndicator=overlay.querySelector('.lb-reply-indicator');
    var replyNameEl=overlay.querySelector('.lb-reply-name');
    var cancelReply=overlay.querySelector('.lb-cancel-reply');
    var commentsClose=overlay.querySelector('.lb-comments-close');
    var likeBtn=overlay.querySelector('.lb-like-btn');
    var likeBtnIcon=likeBtn.querySelector('i');
    var likeBtnCount=likeBtn.querySelector('span');
    var dislikeBtn=overlay.querySelector('.lb-dislike-btn');
    var dislikeBtnIcon=dislikeBtn.querySelector('i');
    var dislikeBtnCount=dislikeBtn.querySelector('span');

    var srcs=[],idx=0,tx=0,dragging=false,currentPostId=null,replyTarget=null,myReaction=null;

    function open(list,i,postId){srcs=list;idx=i;currentPostId=postId||null;show();}
    window._openLightbox=open;

    function show(){
        var isVid=isVideoUrl(srcs[idx]);
        if(isVid){img.style.display='none';vid.style.display='';vid.src=srcs[idx];vid.load();}
        else{vid.style.display='none';vid.pause();vid.src='';img.style.display='';img.src=srcs[idx];}
        counter.textContent=(idx+1)+' / '+srcs.length;
        prev.style.display=srcs.length>1?'':'none';
        next.style.display=srcs.length>1?'':'none';
        overlay.classList.add('show');
        document.body.style.overflow='hidden';
        resetReply();
        commentInput.value='';
        loadPhotoComments();
        loadPhotoReactions();
    }
    function close(){vid.pause();vid.src='';overlay.classList.remove('show');document.body.style.overflow='';commentsPanel.classList.remove('lb-open');}
    function go(d){idx=(idx+d+srcs.length)%srcs.length;show();}
    function resetReply(){replyTarget=null;replyIndicator.style.display='none';commentInput.placeholder='Write a comment...';}

    // Load comments for current photo
    async function loadPhotoComments(){
        var url=srcs[idx];
        commentsList.innerHTML='<p style="color:var(--gray,#777);text-align:center;padding:20px;">Loading...</p>';
        commentToggleCount.textContent='';
        try{
            var comments=await sbGetPhotoComments(url,'newest');
            commentToggleCount.textContent=comments.length||'';
            if(!comments.length){
                commentsList.innerHTML='<p style="color:var(--gray,#777);text-align:center;padding:20px;">No comments yet. Be the first!</p>';
                return;
            }
            var topLevel=comments.filter(function(c){return !c.parent_comment_id;});
            var replies={};
            comments.filter(function(c){return c.parent_comment_id;}).forEach(function(c){
                if(!replies[c.parent_comment_id])replies[c.parent_comment_id]=[];
                replies[c.parent_comment_id].push(c);
            });
            var nameById={};
            comments.forEach(function(c){nameById[c.id]=c.author?(c.author.display_name||c.author.username):'User';});
            var html='';
            topLevel.forEach(function(c){
                var name=c.author?(c.author.display_name||c.author.username):'User';
                var avatar=c.author?c.author.avatar_url:null;
                html+=buildLbComment(c.id,name,avatar,c.content,false,c.author_id);
                (replies[c.id]||[]).forEach(function(r){
                    var rName=r.author?(r.author.display_name||r.author.username):'User';
                    var rAvatar=r.author?r.author.avatar_url:null;
                    var replyTo=nameById[r.parent_comment_id]||name;
                    html+=buildLbComment(r.id,rName,rAvatar,r.content,true,r.author_id,replyTo);
                });
            });
            commentsList.innerHTML=html;
            bindLbCommentActions();
        }catch(e){
            console.error('Photo comments error:',e);
            commentsList.innerHTML='<p style="color:var(--gray,#777);text-align:center;padding:20px;">Could not load comments.</p>';
        }
    }

    function buildLbComment(cid,name,avatar,text,isReply,authorId,replyToName){
        var src=avatar||DEFAULT_AVATAR;
        var sz=isReply?26:30;
        var isOwn=currentUser&&authorId&&authorId===currentUser.id;
        var tag=isReply&&replyToName?'<span style="color:var(--primary);font-size:11px;margin-right:3px;"><i class="fas fa-reply" style="transform:scaleX(-1);font-size:9px;margin-right:2px;"></i>@'+escapeHtml(replyToName)+'</span>':'';
        var gifMatch=text.match(/^\[gif\](.*?)\[\/gif\]$/);
        var contentHtml;
        if(gifMatch){
            contentHtml='<div style="margin-top:4px;">'+tag+'<img src="'+escapeHtml(gifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy" style="max-width:200px;max-height:150px;border-radius:8px;"></div>';
        } else {
            contentHtml='<p class="lb-comment-text" style="font-size:12px;color:var(--gray,#aaa);margin-top:2px;word-break:break-word;">'+tag+renderMentionsInText(escapeHtmlNl(text))+'</p>';
        }
        var liked=likedComments[cid];var disliked=dislikedComments[cid];
        var h='<div class="lb-comment'+(isReply?' lb-comment-reply':'')+'" data-cid="'+cid+'">';
        h+='<img src="'+src+'" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;flex-shrink:0;object-fit:cover;">';
        h+='<div style="flex:1;min-width:0;"><strong style="font-size:12px;">'+escapeHtml(name)+'</strong>';
        h+=contentHtml;
        h+='<div style="display:flex;gap:10px;margin-top:4px;">';
        h+='<button class="lb-like-comment" data-cid="'+cid+'" data-aid="'+(authorId||'')+'" style="background:none;font-size:11px;color:'+(liked?'var(--primary)':'var(--gray,#999)')+';cursor:pointer;display:flex;align-items:center;gap:3px;"><i class="'+(liked?'fas':'far')+' fa-thumbs-up"></i><span>'+(liked?1:0)+'</span></button>';
        h+='<button class="lb-dislike-comment" data-cid="'+cid+'" data-aid="'+(authorId||'')+'" style="background:none;font-size:11px;color:'+(disliked?'var(--primary)':'var(--gray,#999)')+';cursor:pointer;display:flex;align-items:center;gap:3px;"><i class="'+(disliked?'fas':'far')+' fa-thumbs-down"></i><span>'+(disliked?1:0)+'</span></button>';
        h+='<button class="lb-reply-btn" data-cid="'+cid+'" data-name="'+escapeHtml(name)+'" style="background:none;font-size:11px;color:var(--gray,#999);cursor:pointer;"><i class="far fa-comment"></i> Reply</button>';
        if(isOwn) h+='<button class="lb-edit-btn" data-cid="'+cid+'" data-text="'+escapeHtml(text)+'" style="background:none;font-size:11px;color:var(--gray,#999);cursor:pointer;"><i class="fas fa-pen"></i> Edit</button>';
        if(isOwn) h+='<button class="lb-del-btn" data-cid="'+cid+'" style="background:none;font-size:11px;color:#e74c3c;cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>';
        h+='</div></div></div>';
        return h;
    }

    function bindLbCommentActions(){
        commentsPanel.querySelectorAll('.lb-reply-btn').forEach(function(btn){
            btn.addEventListener('click',function(){
                replyTarget=btn.dataset.cid;
                replyNameEl.textContent=btn.dataset.name;
                replyIndicator.style.display='block';
                commentInput.placeholder='Reply to '+btn.dataset.name+'...';
                commentInput.focus();
            });
        });
        commentsPanel.querySelectorAll('.lb-del-btn').forEach(function(btn){
            btn.addEventListener('click',async function(){
                if(!confirm('Delete this comment?'))return;
                try{await sbDeletePhotoComment(btn.dataset.cid);loadPhotoComments();}
                catch(e){console.error('Delete photo comment error:',e);}
            });
        });
        // Comment like/dislike
        commentsPanel.querySelectorAll('.lb-like-comment').forEach(function(btn){
            btn.addEventListener('click',async function(){
                var cid=btn.dataset.cid;var countEl=btn.querySelector('span');var count=parseInt(countEl.textContent);
                if(likedComments[cid]){delete likedComments[cid];btn.style.color='var(--gray,#999)';btn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);}
                else{if(dislikedComments[cid]){delete dislikedComments[cid];var db=btn.parentNode.querySelector('.lb-dislike-comment');db.style.color='var(--gray,#999)';db.querySelector('i').className='far fa-thumbs-down';db.querySelector('span').textContent=Math.max(0,parseInt(db.querySelector('span').textContent)-1);}
                likedComments[cid]=true;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;}
                if(/^[0-9a-f]{8}-/.test(cid)&&currentUser){try{await sbToggleLike(currentUser.id,'comment',cid);}catch(e2){}}
                saveState();
            });
        });
        commentsPanel.querySelectorAll('.lb-dislike-comment').forEach(function(btn){
            btn.addEventListener('click',async function(){
                var cid=btn.dataset.cid;var countEl=btn.querySelector('span');var count=parseInt(countEl.textContent);
                if(dislikedComments[cid]){delete dislikedComments[cid];btn.style.color='var(--gray,#999)';btn.querySelector('i').className='far fa-thumbs-down';countEl.textContent=Math.max(0,count-1);}
                else{if(likedComments[cid]){delete likedComments[cid];var lb=btn.parentNode.querySelector('.lb-like-comment');lb.style.color='var(--gray,#999)';lb.querySelector('i').className='far fa-thumbs-up';lb.querySelector('span').textContent=Math.max(0,parseInt(lb.querySelector('span').textContent)-1);}
                dislikedComments[cid]=true;btn.style.color='var(--primary)';btn.querySelector('i').className='fas fa-thumbs-down';countEl.textContent=count+1;}
                if(/^[0-9a-f]{8}-/.test(cid)&&currentUser){try{await sbToggleLike(currentUser.id,'comment',cid);}catch(e2){}}
                saveState();
            });
        });
        // Edit comment
        commentsPanel.querySelectorAll('.lb-edit-btn').forEach(function(btn){
            btn.addEventListener('click',function(){
                var cid=btn.dataset.cid;var oldText=btn.dataset.text;
                commentInput.value=oldText;commentInput.focus();
                // Temporarily repurpose post button for edit
                postBtn._editCid=cid;
                replyIndicator.style.display='block';
                replyNameEl.textContent='Editing comment';
                cancelReply.addEventListener('click',function editCancel(){postBtn._editCid=null;cancelReply.removeEventListener('click',editCancel);},{once:true});
            });
        });
        // Bind mention clicks in comments
        commentsPanel.querySelectorAll('.mention-link').forEach(function(el){
            el.style.cursor='pointer';
            el.addEventListener('click',function(){
                var uname=el.dataset.mention;
                if(!uname) return;
                sbGetProfileByUsername(uname).then(function(p){
                    if(p){close();showProfileView(profileToPerson(p));}
                }).catch(function(e){console.warn('Mention profile load:',e);});
            });
        });
    }

    // Helper: find post owner from currentPostId
    function getPostOwner(){
        if(!currentPostId)return null;
        var fp=feedPosts.find(function(x){return x.idx===currentPostId;});
        return fp&&fp.person?fp.person:null;
    }

    // Post comment (or edit)
    postBtn.addEventListener('click',async function(){
        var text=commentInput.value.trim();if(!text||!currentUser)return;
        // Edit mode
        if(postBtn._editCid){
            try{
                await sbEditPhotoComment(postBtn._editCid,text);
                postBtn._editCid=null;
                commentInput.value='';resetReply();
                loadPhotoComments();
            }catch(e){console.error('Edit photo comment error:',e);showToast('Edit failed');}
            return;
        }
        try{
            var parentId=replyTarget&&/^[0-9a-f]{8}-/.test(replyTarget)?replyTarget:null;
            await sbCreatePhotoComment(srcs[idx],currentPostId,currentUser.id,text,parentId);
            var myName=currentUser.display_name||currentUser.username||'Someone';
            // Notify post owner about photo comment
            var owner=getPostOwner();
            if(owner&&owner.id&&owner.id!==currentUser.id){
                sbCreateNotification(owner.id,'comment',myName+' commented on your photo',text,{originalType:'comment',post_id:currentPostId}).catch(function(e){console.error('Photo comment notif error:',e);});
            }
            notifyMentionedUsers(text,currentPostId,'a photo comment');
            // Notify parent comment author about reply
            if(parentId){
                var parentEl=commentsPanel.querySelector('[data-cid="'+parentId+'"]');
                var parentAuthorName=parentEl?parentEl.querySelector('strong'):null;
                // Look up parent comment author from the loaded comments
                var replyBtn=commentsPanel.querySelector('.lb-reply-btn[data-cid="'+parentId+'"]');
                if(replyBtn){
                    // We stored author info in the comment element, but we need the author ID
                    // Fetch parent comment to get author_id
                    sbGetPhotoComments(srcs[idx],'newest').then(function(comments){
                        var parent=comments.find(function(c){return c.id===parentId;});
                        if(parent&&parent.author_id&&parent.author_id!==currentUser.id){
                            sbCreateNotification(parent.author_id,'reply',myName+' replied to your comment',text,{originalType:'reply',post_id:currentPostId}).catch(function(e){console.error('Reply notif error:',e);});
                        }
                    }).catch(function(){});
                }
            }
            commentInput.value='';resetReply();
            loadPhotoComments();
        }catch(e){console.error('Post photo comment error:',e);showToast('Comment failed');}
    });
    commentInput.addEventListener('keypress',function(e){if(e.key==='Enter')postBtn.click();});
    cancelReply.addEventListener('click',resetReply);

    // Emoji button for lightbox comments
    var lbEmojiBtn=overlay.querySelector('.lb-emoji-btn');
    if(lbEmojiBtn) lbEmojiBtn.addEventListener('click',function(){openEmojiPicker('lbEmojiPanel',commentInput);});

    // GIF button for lightbox comments
    var lbGifBtn=overlay.querySelector('.lb-gif-btn');
    if(lbGifBtn) lbGifBtn.addEventListener('click',async function(){
        // Quick GIF picker: search modal approach
        var gifHtml='<div class="modal-header"><h3>Search GIFs</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
        gifHtml+='<div class="modal-body" style="padding:12px;"><input type="text" id="lbGifSearch" class="post-input" placeholder="Search GIFs..." style="width:100%;margin-bottom:10px;"><div id="lbGifGrid" class="gif-picker-grid" style="max-height:300px;overflow-y:auto;"></div><div style="text-align:center;font-size:11px;color:var(--gray);margin-top:8px;">Powered by <strong>KLIPY</strong></div></div>';
        showModal(gifHtml);
        var lbGifGrid=document.getElementById('lbGifGrid');
        var lbGifSearchInput=document.getElementById('lbGifSearch');
        // Load trending
        var trending=await getKlipyTrending(20);
        if(trending&&trending.length) lbGifGrid.innerHTML=trending.map(function(g){return '<img src="'+escapeHtml(g.preview||g.full)+'" alt="'+escapeHtml(g.title)+'" data-full="'+escapeHtml(g.full)+'" loading="lazy">';}).join('');
        else lbGifGrid.innerHTML='<p style="color:#777;text-align:center;padding:20px;">No GIFs found</p>';
        lbGifGrid.addEventListener('click',async function(e){
            var img=e.target.closest('img');if(!img)return;
            var gifUrl=img.dataset.full;if(!gifUrl)return;
            closeModal();
            // Submit GIF as comment
            try{
                var gifText='[gif]'+gifUrl+'[/gif]';
                var parentId=replyTarget&&/^[0-9a-f]{8}-/.test(replyTarget)?replyTarget:null;
                await sbCreatePhotoComment(srcs[idx],currentPostId,currentUser.id,gifText,parentId);
                notifyMentionedUsers(gifText,currentPostId,'a photo comment');
                resetReply();loadPhotoComments();
            }catch(e2){showToast('GIF comment failed');}
        });
        var _lbGifTimer=null;
        lbGifSearchInput.addEventListener('input',function(){
            clearTimeout(_lbGifTimer);
            _lbGifTimer=setTimeout(async function(){
                var q=lbGifSearchInput.value.trim();
                var results=q?await searchKlipyGifs(q,20):await getKlipyTrending(20);
                if(results&&results.length) lbGifGrid.innerHTML=results.map(function(g){return '<img src="'+escapeHtml(g.preview||g.full)+'" alt="'+escapeHtml(g.title)+'" data-full="'+escapeHtml(g.full)+'" loading="lazy">';}).join('');
                else lbGifGrid.innerHTML='<p style="color:#777;text-align:center;padding:20px;">No GIFs found</p>';
            },400);
        });
    });

    // Mention autocomplete for lightbox comment input
    initMentionAutocomplete('lbCommentInput',null);

    // Photo like/dislike
    async function loadPhotoReactions(){
        var url=srcs[idx];
        myReaction=null;
        likeBtnCount.textContent='0';dislikeBtnCount.textContent='0';
        likeBtnIcon.className='far fa-thumbs-up';dislikeBtnIcon.className='far fa-thumbs-down';
        likeBtn.style.color='';dislikeBtn.style.color='';
        try{
            var counts=await sbGetPhotoReactionCounts(url);
            likeBtnCount.textContent=counts.likes;
            dislikeBtnCount.textContent=counts.dislikes;
            if(currentUser){
                myReaction=await sbGetUserPhotoReaction(url,currentUser.id);
                if(myReaction==='like'){likeBtnIcon.className='fas fa-thumbs-up';likeBtn.style.color='var(--primary)';}
                if(myReaction==='dislike'){dislikeBtnIcon.className='fas fa-thumbs-down';dislikeBtn.style.color='#e74c3c';}
            }
        }catch(e){console.error('Load photo reactions error:',e);}
    }
    function updateReactionUI(newReaction,oldReaction){
        var lc=parseInt(likeBtnCount.textContent)||0;
        var dc=parseInt(dislikeBtnCount.textContent)||0;
        // Remove old
        if(oldReaction==='like')lc--;
        if(oldReaction==='dislike')dc--;
        // Add new
        if(newReaction==='like')lc++;
        if(newReaction==='dislike')dc++;
        likeBtnCount.textContent=Math.max(0,lc);
        dislikeBtnCount.textContent=Math.max(0,dc);
        likeBtnIcon.className=newReaction==='like'?'fas fa-thumbs-up':'far fa-thumbs-up';
        dislikeBtnIcon.className=newReaction==='dislike'?'fas fa-thumbs-down':'far fa-thumbs-down';
        likeBtn.style.color=newReaction==='like'?'var(--primary)':'';
        dislikeBtn.style.color=newReaction==='dislike'?'#e74c3c':'';
        myReaction=newReaction;
    }
    likeBtn.addEventListener('click',async function(e){
        e.stopPropagation();if(!currentUser)return;
        var old=myReaction;
        var isNew=old!=='like';
        updateReactionUI(old==='like'?null:'like',old);
        try{
            await sbTogglePhotoReaction(srcs[idx],currentUser.id,'like');
            if(isNew){
                var owner=getPostOwner();
                var myName=currentUser.display_name||currentUser.username||'Someone';
                if(owner&&owner.id&&owner.id!==currentUser.id){
                    sbCreateNotification(owner.id,'like',myName+' liked your photo','',{originalType:'like',post_id:currentPostId}).catch(function(er){console.error('Photo like notif error:',er);});
                }
            }
        }catch(e){console.error('Like error:',e);updateReactionUI(old,myReaction);}
    });
    dislikeBtn.addEventListener('click',async function(e){
        e.stopPropagation();if(!currentUser)return;
        var old=myReaction;
        updateReactionUI(old==='dislike'?null:'dislike',old);
        try{await sbTogglePhotoReaction(srcs[idx],currentUser.id,'dislike');}
        catch(e){console.error('Dislike error:',e);updateReactionUI(old,myReaction);}
    });

    // Mobile: toggle comment panel
    commentToggle.addEventListener('click',function(e){
        e.stopPropagation();
        commentsPanel.classList.toggle('lb-open');
    });
    commentsClose.addEventListener('click',function(e){
        e.stopPropagation();
        commentsPanel.classList.remove('lb-open');
    });

    prev.addEventListener('click',function(e){e.stopPropagation();go(-1);});
    next.addEventListener('click',function(e){e.stopPropagation();go(1);});
    overlay.querySelector('.lightbox-close').addEventListener('click',close);
    overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
    document.addEventListener('keydown',function(e){if(!overlay.classList.contains('show'))return;if(e.key==='Escape'){if(commentsPanel.classList.contains('lb-open')){commentsPanel.classList.remove('lb-open');}else{close();}}if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1);});

    // Touch swipe (only on media area)
    media.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;dragging=true;},{passive:true});
    media.addEventListener('touchend',function(e){if(!dragging)return;dragging=false;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50){dx>0?go(-1):go(1);}});
    // Prevent close/swipe when interacting with comments
    commentsPanel.addEventListener('click',function(e){e.stopPropagation();});
    commentsPanel.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:true});
    commentsPanel.addEventListener('touchend',function(e){e.stopPropagation();});

    // Collect image/video srcs from a container
    function collect(container){return Array.from(container.querySelectorAll('img,video')).map(function(i){return i.src;}).filter(Boolean);}

    // Delegate clicks on images/videos in posts, albums, previews
    document.addEventListener('click',function(e){
        var t=e.target;
        // Handle play overlay clicks — find the video in the same thumb
        if(t.closest('.pm-play-overlay')){t=t.closest('.pm-thumb').querySelector('video')||t;}
        // Handle +X overlay clicks — open lightbox at the overflow image
        var moreOverlay=t.closest('.pm-more-overlay');
        if(moreOverlay){
            var pmThumb=moreOverlay.closest('.pm-thumb');
            var grid=pmThumb?pmThumb.closest('.post-media-grid'):null;
            if(grid){
                var pgid=grid.dataset.pgid;var allMedia=pgid&&window['_media_'+pgid];
                if(allMedia){
                    var list=allMedia.map(function(m){return m.src;});
                    var thumbEl=pmThumb.querySelector('img')||pmThumb.querySelector('video');
                    var startIdx=thumbEl?list.indexOf(thumbEl.src):0;
                    if(startIdx<0)startIdx=0;
                    var feedPost=grid.closest('.feed-post');
                    var pid=feedPost?(feedPost.querySelector('.like-btn[data-post-id]')||{}).getAttribute&&feedPost.querySelector('.like-btn[data-post-id]').getAttribute('data-post-id'):null;
                    if(list.length){open(list,startIdx,pid);e.stopPropagation();return;}
                }
            }
        }
        if(t.tagName!=='IMG'&&t.tagName!=='VIDEO')return;
        // Post media grid
        var grid=t.closest('.post-media-grid');
        if(grid){
            var pgid=grid.dataset.pgid;var allMedia=pgid&&window['_media_'+pgid];var list;
            if(allMedia){list=allMedia.map(function(m){return m.src;});}else{list=collect(grid);}
            var feedPost=grid.closest('.feed-post');
            var pid=feedPost?(feedPost.querySelector('.like-btn[data-post-id]')||{}).getAttribute&&feedPost.querySelector('.like-btn[data-post-id]').getAttribute('data-post-id'):null;
            if(list.length){open(list,list.indexOf(t.src),pid);e.stopPropagation();return;}
        }
        // Photo album grid
        var album=t.closest('.photo-album-grid');
        if(album){var list=collect(album);if(list.length){open(list,list.indexOf(t.src));e.stopPropagation();return;}}
        // Photos preview sidebar
        var preview=t.closest('.photos-preview');
        if(preview){var list=collect(preview);if(list.length){open(list,list.indexOf(t.src));e.stopPropagation();return;}}
        // All media modal grid
        var am=t.closest('.all-media-grid');
        if(am){var list=collect(am);if(list.length){open(list,list.indexOf(t.src));e.stopPropagation();return;}}
    });
})();

// ======================== SKELETON LOADING STATES ========================
function showFeedSkeleton(){
    var container=$('#feedContainer');
    if(!container) return;
    var html='';
    for(var i=0;i<3;i++){
        html+='<div class="skeleton-post"><div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div style="flex:1;"><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-line" style="width:25%;height:10px;"></div></div></div><div class="skeleton skeleton-line long"></div><div class="skeleton skeleton-line medium"></div><div class="skeleton skeleton-image"></div></div>';
    }
    container.innerHTML=html;
}

// ======================== POST DRAFT AUTO-SAVE ========================
var _draftTimer=null;
function saveDraft(text){
    if(!text||!text.trim()){clearDraft();return;}
    try{localStorage.setItem('blipvibe_draft',text);}catch(e){}
}
function loadDraft(){
    try{return localStorage.getItem('blipvibe_draft')||'';}catch(e){return '';}
}
function clearDraft(){
    try{localStorage.removeItem('blipvibe_draft');}catch(e){}
}
function initDraftAutoSave(textareaId){
    var ta=document.getElementById(textareaId);
    if(!ta) return;
    var draft=loadDraft();
    if(draft){ta.value=draft;var ind=ta.parentElement.querySelector('.draft-indicator');if(ind)ind.classList.add('visible');}
    ta.addEventListener('input',function(){
        clearTimeout(_draftTimer);
        _draftTimer=setTimeout(function(){saveDraft(ta.value);},1000);
    });
}

// ======================== NOTIFICATION GROUPING ========================
function groupNotifications(notifs){
    var grouped=[];var likeMap={};var followMap={};
    notifs.forEach(function(n){
        if(n.type==='like'&&n.data&&n.data.post_id){
            var key='like:'+n.data.post_id;
            if(!likeMap[key]){likeMap[key]={base:n,count:1,names:[n.text.split(' ')[0]]};grouped.push(likeMap[key]);}
            else{likeMap[key].count++;likeMap[key].names.push(n.text.split(' ')[0]);}
        } else if(n.type==='follow'){
            var key='follow:batch';
            if(!followMap[key]){followMap[key]={base:n,count:1,names:[n.text.split(' ')[0]]};grouped.push(followMap[key]);}
            else{followMap[key].count++;followMap[key].names.push(n.text.split(' ')[0]);}
        } else {
            grouped.push({base:n,count:1,names:[]});
        }
    });
    return grouped.map(function(g){
        if(g.count>1){
            var n=Object.assign({},g.base);
            var others=g.count-1;
            if(g.base.type==='like') n.text=g.names[0]+' and '+others+' other'+(others>1?'s':'')+' liked your post';
            else if(g.base.type==='follow') n.text=g.names[0]+' and '+others+' other'+(others>1?'s':'')+' followed you';
            return n;
        }
        return g.base;
    });
}

// ======================== GROUP INVITE LINKS ========================
function generateInviteLink(groupId){
    return location.origin+location.pathname+'#join:'+groupId;
}
function showInviteLinkModal(group){
    var link=generateInviteLink(group.id);
    var h='<div class="modal-header"><h3><i class="fas fa-link" style="color:var(--primary);margin-right:8px;"></i>Invite Link</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Share this link to invite people to <strong>'+escapeHtml(group.name)+'</strong>:</p>';
    h+='<div class="invite-link-box"><input type="text" value="'+escapeHtml(link)+'" readonly id="inviteLinkInput"><button id="copyInviteLink"><i class="fas fa-copy"></i> Copy</button></div>';
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    document.getElementById('copyInviteLink').addEventListener('click',function(){
        var inp=document.getElementById('inviteLinkInput');
        inp.select();
        try{navigator.clipboard.writeText(inp.value);showToast('Link copied!');}catch(e){document.execCommand('copy');showToast('Link copied!');}
    });
}
// Handle join links from URL
function checkJoinLink(){
    var hash=(location.hash||'').replace('#','');
    if(hash.indexOf('join:')===0){
        var gid=hash.replace('join:','');
        if(gid&&currentUser){
            var g=groups.find(function(gr){return gr.id===gid;});
            if(g){
                if(state.joinedGroups[gid]){showGroupView(g);return;}
                var h='<div class="modal-header"><h3>Join Group</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
                h+='<div class="modal-body"><p style="text-align:center;margin-bottom:16px;">You\'ve been invited to join <strong>'+escapeHtml(g.name)+'</strong></p>';
                h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="confirmJoinInvite">Join Group</button></div></div>';
                showModal(h);
                document.getElementById('confirmJoinInvite').addEventListener('click',async function(){
                    try{await sbJoinGroup(gid,currentUser.id);state.joinedGroups[gid]=true;closeModal();showGroupView(g);showToast('Joined '+g.name+'!');}catch(e){showToast('Failed to join');}
                });
            }
        }
        history.replaceState(null,'','#home');
    }
}

// ======================== QUOTE POSTS ========================
function showQuotePostModal(postId){
    var original=feedPosts.find(function(p){return p.idx===postId;});
    if(!original){showToast('Post not found');return;}
    var person=original.person;
    var avatarSrc=person.avatar_url||DEFAULT_AVATAR;
    var timeStr=original.created_at?timeAgoReal(original.created_at):'';
    var h='<div class="modal-header"><h3>Quote Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<textarea id="quotePostText" class="cpm-textarea" placeholder="Add your commentary..." style="min-height:80px;"></textarea>';
    h+='<div class="quote-post-embed"><div class="quote-header"><img src="'+avatarSrc+'"><strong>'+escapeHtml(person.name)+'</strong><span>'+timeStr+'</span></div>';
    h+='<div class="quote-text">'+escapeHtml(safeSlice(original.text,0,200))+(original.text.length>200?'...':'')+'</div></div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="publishQuotePost">Post Quote</button></div></div>';
    showModal(h);
    document.getElementById('publishQuotePost').addEventListener('click',async function(){
        var commentary=document.getElementById('quotePostText').value.trim();
        if(!commentary){showToast('Add your commentary');return;}
        this.disabled=true;this.textContent='Posting...';
        try{
            await sbCreatePost(currentUser.id,commentary,null,null,null,null,postId);
            closeModal();showToast('Quote posted!');
            await generatePosts();
        }catch(e){showToast('Failed to post');this.disabled=false;this.textContent='Post Quote';}
    });
}

// ======================== COMMENT PINNING ========================
var _pinnedComments={};
try{_pinnedComments=JSON.parse(localStorage.getItem('blipvibe_pinned_comments')||'{}');}catch(e){}
function persistPinnedComments(){try{localStorage.setItem('blipvibe_pinned_comments',JSON.stringify(_pinnedComments));}catch(e){}}
function togglePinComment(postId,commentId){
    if(_pinnedComments[postId]===commentId){
        delete _pinnedComments[postId];
        showToast('Comment unpinned');
    } else {
        _pinnedComments[postId]=commentId;
        showToast('Comment pinned');
    }
    persistPinnedComments();
}

// ======================== POST ANALYTICS DASHBOARD ========================
function showPostAnalytics(){
    var h='<div class="modal-header"><h3><i class="fas fa-chart-line" style="color:var(--primary);margin-right:8px;"></i>Your Analytics</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    var myPosts=feedPosts.filter(function(p){return currentUser&&p.person.id===currentUser.id;});
    var totalLikes=0,totalViews=0,totalComments=0;
    myPosts.forEach(function(p){totalLikes+=p.likes||0;totalViews+=_postViews[p.idx]||0;totalComments+=p.commentCount||0;});
    h+='<div class="analytics-grid">';
    h+='<div class="analytics-card"><div class="stat-value">'+myPosts.length+'</div><div class="stat-label">Total Posts</div></div>';
    h+='<div class="analytics-card"><div class="stat-value">'+totalLikes+'</div><div class="stat-label">Total Likes</div></div>';
    h+='<div class="analytics-card"><div class="stat-value">'+totalViews+'</div><div class="stat-label">Total Views</div></div>';
    h+='</div>';
    h+='<div class="analytics-grid">';
    h+='<div class="analytics-card"><div class="stat-value">'+totalComments+'</div><div class="stat-label">Total Comments</div></div>';
    h+='<div class="analytics-card"><div class="stat-value">'+state.followers+'</div><div class="stat-label">Followers</div></div>';
    h+='<div class="analytics-card"><div class="stat-value">'+state.following+'</div><div class="stat-label">Following</div></div>';
    h+='</div>';
    // Top posts
    if(myPosts.length){
        var sorted=myPosts.slice().sort(function(a,b){return (b.likes||0)-(a.likes||0);});
        h+='<h4 style="margin:16px 0 8px;font-size:14px;">Top Posts</h4>';
        sorted.slice(0,5).forEach(function(p){
            var maxLikes=sorted[0].likes||1;
            var pct=Math.round(((p.likes||0)/maxLikes)*100);
            h+='<div style="margin-bottom:12px;"><p style="font-size:13px;color:var(--dark);">'+escapeHtml(safeSlice(p.text,0,60))+(p.text.length>60?'...':'')+'</p>';
            h+='<div style="display:flex;align-items:center;gap:8px;margin-top:4px;"><div class="analytics-bar" style="flex:1;"><div class="analytics-bar-fill" style="width:'+pct+'%;"></div></div><span style="font-size:12px;color:var(--gray);min-width:40px;">'+p.likes+' <i class="fas fa-heart" style="font-size:10px;"></i></span></div></div>';
        });
    }
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
}

// ======================== DAILY LOGIN REWARDS ========================
// Server-side via Supabase RPC — uses server timestamp, not device clock
// Awards 5 coins per day, once every 24 hours (cheat-proof)
async function checkDailyLoginReward(){
    if(!currentUser) return;
    try{
        var result=await sbClaimDailyReward();
        if(!result||!result.awarded) return; // Not eligible yet (< 24h since last claim)
        var reward=result.coins||5;
        var streak=result.streak||1;
        // Update local coin balance from server truth
        if(result.new_balance!=null){
            state.coins=result.new_balance;
            currentUser.coin_balance=result.new_balance;
        } else {
            state.coins+=reward;
        }
        var coinEl=document.getElementById('navCoinCount');
        if(coinEl) coinEl.textContent=state.coins;
        saveState();
        // Show reward popup
        setTimeout(function(){
            var backdrop=document.createElement('div');backdrop.className='login-reward-backdrop';
            var popup=document.createElement('div');popup.className='login-reward-popup';
            var nextTier=streak<3?'Day 3: +20':streak<7?'Day 7: +50':streak<14?'Day 14: +100':'Max tier!';
            popup.innerHTML='<div class="coin-icon"><i class="fas fa-coins"></i></div>'
                +'<h3 style="margin:12px 0 4px;font-size:18px;color:var(--dark);">Daily Reward!</h3>'
                +'<p style="font-size:24px;font-weight:700;color:#ffd700;">+'+reward+' coins</p>'
                +'<div class="streak-display" style="justify-content:center;margin-top:4px;"><i class="fas fa-fire"></i> '+streak+' day streak</div>'
                +'<p style="font-size:11px;color:var(--gray);margin-top:4px;">Next: '+nextTier+'</p>'
                +'<button class="btn btn-primary" style="margin-top:16px;" id="claimDailyReward">Claim</button>';
            document.body.appendChild(backdrop);document.body.appendChild(popup);
            document.getElementById('claimDailyReward').addEventListener('click',function(){backdrop.remove();popup.remove();});
            backdrop.addEventListener('click',function(){backdrop.remove();popup.remove();});
        },1500);
    }catch(e){console.warn('Daily reward check:',e);}
}

// ======================== RICH TEXT IN POSTS ========================
function renderRichText(text){
    // Bold: **text** or __text__
    text=text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    text=text.replace(/__(.+?)__/g,'<strong>$1</strong>');
    // Italic: *text* or _text_
    text=text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,'<em>$1</em>');
    text=text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g,'<em>$1</em>');
    // Strikethrough: ~~text~~
    text=text.replace(/~~(.+?)~~/g,'<del>$1</del>');
    // Inline code: `code`
    text=text.replace(/`([^`]+)`/g,'<code style="background:rgba(139,92,246,.1);padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
    return text;
}

// ======================== VIDEO TRIMMING ========================
function showVideoTrimModal(file,onTrimmed){
    var url=URL.createObjectURL(file);
    var h='<div class="modal-header"><h3><i class="fas fa-scissors" style="color:var(--primary);margin-right:8px;"></i>Trim Video</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<video id="trimPreview" src="'+url+'" style="width:100%;max-height:300px;border-radius:8px;" controls></video>';
    h+='<div style="display:flex;gap:12px;margin-top:12px;align-items:center;">';
    h+='<label style="font-size:13px;">Start: <input type="number" id="trimStart" value="0" min="0" step="0.1" style="width:70px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;"></label>';
    h+='<label style="font-size:13px;">End: <input type="number" id="trimEnd" value="0" min="0" step="0.1" style="width:70px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;"></label>';
    h+='<span id="trimDuration" style="font-size:12px;color:var(--gray);"></span>';
    h+='</div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-outline" id="trimSkipBtn">Use Full Video</button><button class="btn btn-primary" id="trimConfirmBtn">Trim & Use</button></div></div>';
    showModal(h);
    var video=document.getElementById('trimPreview');
    video.addEventListener('loadedmetadata',function(){
        document.getElementById('trimEnd').value=video.duration.toFixed(1);
        document.getElementById('trimEnd').max=video.duration.toFixed(1);
        document.getElementById('trimStart').max=video.duration.toFixed(1);
        document.getElementById('trimDuration').textContent='Duration: '+video.duration.toFixed(1)+'s';
    });
    document.getElementById('trimSkipBtn').addEventListener('click',function(){closeModal();onTrimmed(file);});
    document.getElementById('trimConfirmBtn').addEventListener('click',function(){
        // Note: actual trimming requires MediaRecorder + seeking which is complex
        // For now, pass through the file with trim metadata
        var start=parseFloat(document.getElementById('trimStart').value)||0;
        var end=parseFloat(document.getElementById('trimEnd').value)||video.duration;
        file._trimStart=start;file._trimEnd=end;
        closeModal();onTrimmed(file);
        showToast('Video selected ('+start.toFixed(1)+'s - '+end.toFixed(1)+'s)');
    });
}

// ======================== LIGHT MODE TOGGLE ========================
function toggleLightMode(){
    var isLight=document.body.classList.toggle('light-mode');
    settings.lightMode=isLight;
    saveState();
    showToast(isLight?'Light mode enabled':'Dark mode enabled');
}

// ======================== SHAREABLE BOOKMARK COLLECTIONS ========================
function showShareCollectionModal(folderId){
    var folder=savedFolders.find(function(f){return f.id===folderId;});
    if(!folder){showToast('Folder not found');return;}
    var link=location.origin+location.pathname+'#collection:'+currentUser.id+':'+folderId;
    var h='<div class="modal-header"><h3><i class="fas fa-share" style="color:var(--primary);margin-right:8px;"></i>Share Collection</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Share your <strong>'+escapeHtml(folder.name)+'</strong> collection ('+folder.posts.length+' posts):</p>';
    h+='<div class="invite-link-box"><input type="text" value="'+escapeHtml(link)+'" readonly id="collectionLinkInput"><button id="copyCollectionLink"><i class="fas fa-copy"></i> Copy</button></div>';
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    document.getElementById('copyCollectionLink').addEventListener('click',function(){
        var inp=document.getElementById('collectionLinkInput');
        inp.select();
        try{navigator.clipboard.writeText(inp.value);showToast('Link copied!');}catch(e){document.execCommand('copy');showToast('Link copied!');}
    });
}

// ======================== MULTI-PERSON DMS ========================
function showCreateGroupDmModal(){
    var h='<div class="modal-header"><h3><i class="fas fa-users" style="color:var(--primary);margin-right:8px;"></i>New Group Chat</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<input type="text" id="groupDmName" class="post-input" placeholder="Group name..." style="margin-bottom:12px;width:100%;">';
    h+='<input type="text" id="groupDmSearch" class="post-input" placeholder="Search people to add..." style="margin-bottom:12px;width:100%;">';
    h+='<div id="groupDmSelected" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;"></div>';
    h+='<div id="groupDmResults" style="max-height:200px;overflow-y:auto;"></div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="createGroupDmBtn" disabled>Create</button></div></div>';
    showModal(h);
    var selected=[];
    var searchInput=document.getElementById('groupDmSearch');
    var resultsDiv=document.getElementById('groupDmResults');
    var selectedDiv=document.getElementById('groupDmSelected');
    var createBtn=document.getElementById('createGroupDmBtn');
    function renderSelected(){
        selectedDiv.innerHTML=selected.map(function(p){
            return '<span style="background:var(--primary);color:#fff;padding:4px 10px;border-radius:16px;font-size:12px;display:flex;align-items:center;gap:4px;">'+escapeHtml(p.name)+' <button class="gdm-remove" data-uid="'+p.id+'" style="background:none;color:#fff;font-size:10px;"><i class="fas fa-times"></i></button></span>';
        }).join('');
        createBtn.disabled=selected.length<2;
        selectedDiv.querySelectorAll('.gdm-remove').forEach(function(b){
            b.addEventListener('click',function(){
                selected=selected.filter(function(p){return p.id!==b.dataset.uid;});
                renderSelected();
            });
        });
    }
    var _gdmTimer=null;
    searchInput.addEventListener('input',function(){
        clearTimeout(_gdmTimer);
        _gdmTimer=setTimeout(async function(){
            var q=searchInput.value.trim();
            if(q.length<2){resultsDiv.innerHTML='';return;}
            try{
                var results=await sbSearchProfiles(q,10);
                resultsDiv.innerHTML=results.filter(function(p){return p.id!==currentUser.id&&!selected.some(function(s){return s.id===p.id;});}).map(function(p){
                    return '<div class="follow-list-item gdm-result" data-uid="'+p.id+'" data-name="'+escapeHtml(p.display_name||p.username)+'" style="cursor:pointer;padding:8px;"><img src="'+(p.avatar_url||DEFAULT_AVATAR)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"><div><strong style="font-size:13px;">'+escapeHtml(p.display_name||p.username)+'</strong><p style="font-size:11px;color:var(--gray);">@'+escapeHtml(p.username)+'</p></div></div>';
                }).join('');
                resultsDiv.querySelectorAll('.gdm-result').forEach(function(el){
                    el.addEventListener('click',function(){
                        selected.push({id:el.dataset.uid,name:el.dataset.name});
                        renderSelected();
                        el.remove();
                        searchInput.value='';
                    });
                });
            }catch(e){}
        },300);
    });
    createBtn.addEventListener('click',function(){
        var name=document.getElementById('groupDmName').value.trim()||selected.map(function(p){return p.name;}).join(', ');
        // Store group DM info locally
        var gdmId='gdm_'+Date.now();
        var gdm={id:gdmId,name:name,members:selected.map(function(p){return p.id;}),created:Date.now()};
        try{
            var gdms=JSON.parse(localStorage.getItem('blipvibe_group_dms')||'[]');
            gdms.push(gdm);
            localStorage.setItem('blipvibe_group_dms',JSON.stringify(gdms));
        }catch(e){}
        closeModal();
        showToast('Group chat "'+name+'" created!');
    });
}

// ======================== CHANGE PASSWORD IN-APP ========================
function showChangePasswordModal(){
    var h='<div class="modal-header"><h3><i class="fas fa-lock" style="color:var(--primary);margin-right:8px;"></i>Change Password</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<div class="login-field" style="margin-bottom:12px;"><label style="font-size:13px;color:var(--gray);margin-bottom:4px;display:block;">New Password</label><input type="password" id="newPassword" class="post-input" placeholder="Enter new password" style="width:100%;"></div>';
    h+='<div class="login-field" style="margin-bottom:16px;"><label style="font-size:13px;color:var(--gray);margin-bottom:4px;display:block;">Confirm New Password</label><input type="password" id="confirmNewPassword" class="post-input" placeholder="Confirm new password" style="width:100%;"></div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveNewPassword">Update Password</button></div></div>';
    showModal(h);
    document.getElementById('saveNewPassword').addEventListener('click',async function(){
        var pw=document.getElementById('newPassword').value;
        var cpw=document.getElementById('confirmNewPassword').value;
        if(!pw||pw.length<6){showToast('Password must be at least 6 characters');return;}
        if(pw!==cpw){showToast('Passwords do not match');return;}
        this.disabled=true;this.textContent='Updating...';
        try{
            await sb.auth.updateUser({password:pw});
            closeModal();showToast('Password updated successfully!');
        }catch(e){showToast('Failed: '+(e.message||'Unknown error'));this.disabled=false;this.textContent='Update Password';}
    });
}

// ======================== CHANGE EMAIL IN-APP ========================
function showChangeEmailModal(){
    var currentEmail=(currentUser&&currentUser.email)||(currentAuthUser&&currentAuthUser.email)||'';
    var h='<div class="modal-header"><h3><i class="fas fa-envelope" style="color:var(--primary);margin-right:8px;"></i>Change Email</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Current email: <strong>'+escapeHtml(currentEmail)+'</strong></p>';
    h+='<div class="login-field" style="margin-bottom:16px;"><label style="font-size:13px;color:var(--gray);margin-bottom:4px;display:block;">New Email Address</label><input type="email" id="newEmailInput" class="post-input" placeholder="Enter new email" style="width:100%;"></div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveNewEmail">Update Email</button></div></div>';
    showModal(h);
    document.getElementById('saveNewEmail').addEventListener('click',async function(){
        var email=document.getElementById('newEmailInput').value.trim();
        if(!email||!email.includes('@')){showToast('Enter a valid email');return;}
        this.disabled=true;this.textContent='Updating...';
        try{
            await sb.auth.updateUser({email:email});
            closeModal();showToast('Confirmation email sent to '+email+'. Check your inbox.');
        }catch(e){showToast('Failed: '+(e.message||'Unknown error'));this.disabled=false;this.textContent='Update Email';}
    });
}

// ======================== TWO-FACTOR AUTHENTICATION ========================
function showSetup2FAModal(){
    var h='<div class="modal-header"><h3><i class="fas fa-shield-halved" style="color:var(--primary);margin-right:8px;"></i>Two-Factor Authentication</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" id="twoFaBody"><p style="text-align:center;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--primary);"></i></p></div>';
    showModal(h);
    (async function(){
        try{
            // Check if already enrolled
            var {data:factors}=await sb.auth.mfa.listFactors();
            var totp=factors&&factors.totp&&factors.totp.length?factors.totp[0]:null;
            var body=document.getElementById('twoFaBody');
            if(totp&&totp.status==='verified'){
                // Already enabled — show unenroll option
                body.innerHTML='<div style="text-align:center;"><i class="fas fa-check-circle" style="font-size:32px;color:var(--green);margin-bottom:8px;"></i><p style="font-size:14px;font-weight:600;margin-bottom:8px;">2FA is enabled</p><p style="font-size:13px;color:var(--gray);margin-bottom:16px;">Your account is protected with an authenticator app.</p><button class="btn" id="disable2FA" style="background:#e74c3c;color:#fff;">Disable 2FA</button></div>';
                document.getElementById('disable2FA').addEventListener('click',async function(){
                    try{await sb.auth.mfa.unenroll({factorId:totp.id});closeModal();showToast('2FA disabled');}catch(e){showToast('Failed: '+e.message);}
                });
            } else {
                // Enroll new TOTP factor
                var {data:enroll,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'BlipVibe Auth'});
                if(error) throw error;
                body.innerHTML='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;text-align:center;">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>'
                    +'<div style="text-align:center;margin-bottom:12px;"><img src="'+enroll.totp.qr_code+'" style="width:200px;height:200px;border-radius:8px;margin:0 auto;display:block;"></div>'
                    +'<p style="font-size:12px;color:var(--gray);margin-bottom:4px;text-align:center;">Or enter this code manually:</p>'
                    +'<div class="totp-setup-code" style="margin-bottom:16px;">'+enroll.totp.secret+'</div>'
                    +'<div class="login-field" style="margin-bottom:12px;"><input type="text" id="totpVerifyCode" class="post-input" placeholder="Enter 6-digit code from app" style="width:100%;text-align:center;font-size:18px;letter-spacing:4px;" maxlength="6"></div>'
                    +'<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="verify2FA">Verify & Enable</button></div>';
                document.getElementById('verify2FA').addEventListener('click',async function(){
                    var code=document.getElementById('totpVerifyCode').value.trim();
                    if(!code||code.length!==6){showToast('Enter the 6-digit code');return;}
                    this.disabled=true;this.textContent='Verifying...';
                    try{
                        var {data:challenge}=await sb.auth.mfa.challenge({factorId:enroll.id});
                        var {error:verifyErr}=await sb.auth.mfa.verify({factorId:enroll.id,challengeId:challenge.id,code:code});
                        if(verifyErr) throw verifyErr;
                        closeModal();showToast('2FA enabled! Your account is now more secure.');
                    }catch(e){showToast('Verification failed: '+e.message);this.disabled=false;this.textContent='Verify & Enable';}
                });
            }
        }catch(e){
            var body=document.getElementById('twoFaBody');
            if(body) body.innerHTML='<p style="color:#e74c3c;text-align:center;">2FA setup error: '+escapeHtml(e.message||'Unknown error')+'</p><div class="modal-actions"><button class="btn btn-primary modal-close">Close</button></div>';
        }
    })();
}

// ======================== LINK IN BIO ========================
function showEditLinkInBio(){
    var current=currentUser?currentUser.website_url||'':'';
    var h='<div class="modal-header"><h3><i class="fas fa-link" style="color:var(--primary);margin-right:8px;"></i>Link in Bio</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><div class="login-field" style="margin-bottom:16px;"><label style="font-size:13px;color:var(--gray);margin-bottom:4px;display:block;">Website URL</label><input type="url" id="bioLinkInput" class="post-input" placeholder="https://yourwebsite.com" value="'+escapeHtml(current)+'" style="width:100%;"></div>';
    h+='<div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="saveBioLink">Save</button></div></div>';
    showModal(h);
    document.getElementById('saveBioLink').addEventListener('click',async function(){
        var url=document.getElementById('bioLinkInput').value.trim();
        this.disabled=true;this.textContent='Saving...';
        try{
            await sbUpdateProfile(currentUser.id,{website_url:url||null});
            currentUser.website_url=url||null;
            closeModal();showToast(url?'Website link saved!':'Website link removed');
        }catch(e){showToast('Failed to save');this.disabled=false;this.textContent='Save';}
    });
}

// ======================== POST EDIT HISTORY ========================
async function showEditHistory(postId){
    var h='<div class="modal-header"><h3><i class="fas fa-history" style="color:var(--primary);margin-right:8px;"></i>Edit History</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
    try{
        var {data,error}=await sb.from('post_edits').select('*').eq('post_id',postId).order('edited_at',{ascending:false});
        if(error) throw error;
        if(!data||!data.length){
            h+='<p style="text-align:center;color:var(--gray);">No edit history for this post.</p>';
        } else {
            data.forEach(function(edit,i){
                var time=timeAgoReal(edit.edited_at);
                h+='<div style="padding:10px 0;border-bottom:1px solid var(--border);">';
                h+='<div style="font-size:12px;color:var(--gray);margin-bottom:4px;"><i class="fas fa-clock" style="margin-right:4px;"></i>'+time+'</div>';
                h+='<p style="font-size:13px;color:var(--dark);background:rgba(231,76,60,.05);padding:8px;border-radius:6px;border-left:3px solid #e74c3c;">'+escapeHtml(edit.previous_content)+'</p>';
                h+='</div>';
            });
        }
    }catch(e){
        h+='<p style="color:var(--gray);text-align:center;">Edit history not available (migration may be needed).</p>';
    }
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
}

// ======================== SEEN BY ON GROUP POSTS ========================
async function trackGroupPostView(postId){
    if(!currentUser||!_activeGroupId) return;
    try{
        await sb.from('group_post_views').upsert({post_id:postId,user_id:currentUser.id},{onConflict:'post_id,user_id'});
    }catch(e){}
}
async function showSeenByModal(postId){
    var h='<div class="modal-header"><h3><i class="fas fa-eye" style="color:var(--primary);margin-right:8px;"></i>Seen By</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:50vh;overflow-y:auto;">';
    try{
        var {data,error}=await sb.from('group_post_views').select('user_id, viewed_at, user:profiles!group_post_views_user_id_fkey(id, username, display_name, avatar_url)').eq('post_id',postId).order('viewed_at',{ascending:false});
        if(error) throw error;
        if(!data||!data.length){
            h+='<p style="text-align:center;color:var(--gray);">No one has viewed this post yet.</p>';
        } else {
            h+='<p style="font-size:13px;color:var(--gray);margin-bottom:12px;">'+data.length+' view'+(data.length!==1?'s':'')+'</p>';
            data.forEach(function(v){
                var user=v.user||{};
                var avatar=user.avatar_url||DEFAULT_AVATAR;
                var name=user.display_name||user.username||'User';
                h+='<div class="seen-by-row"><img src="'+avatar+'"><span>'+escapeHtml(name)+'</span><span style="margin-left:auto;">'+timeAgoReal(v.viewed_at)+'</span></div>';
            });
        }
    }catch(e){
        h+='<p style="color:var(--gray);text-align:center;">Seen by not available (migration may be needed).</p>';
    }
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
}

// ======================== SCHEDULED POSTS CALENDAR VIEW ========================
function showScheduledCalendar(){
    var now=new Date();
    var year=now.getFullYear();var month=now.getMonth();
    var monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var firstDay=new Date(year,month,1).getDay();
    var daysInMonth=new Date(year,month+1,0).getDate();
    var h='<div class="modal-header"><h3><i class="fas fa-calendar" style="color:var(--primary);margin-right:8px;"></i>Scheduled Posts — '+monthNames[month]+' '+year+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    // Map scheduled posts to days
    var dayMap={};
    (_scheduledPosts||[]).forEach(function(s){
        var d=new Date(s.scheduledAt);
        if(d.getMonth()===month&&d.getFullYear()===year){
            var day=d.getDate();
            if(!dayMap[day]) dayMap[day]=[];
            dayMap[day].push(s);
        }
    });
    h+='<div class="sched-calendar">';
    dayNames.forEach(function(d){h+='<div class="sched-day" style="font-weight:600;color:var(--gray);font-size:10px;">'+d+'</div>';});
    for(var i=0;i<firstDay;i++) h+='<div class="sched-day"></div>';
    for(var d=1;d<=daysInMonth;d++){
        var isToday=d===now.getDate()&&month===now.getMonth();
        var hasPost=!!dayMap[d];
        h+='<div class="sched-day'+(isToday?' today':'')+(hasPost?' has-post':'')+'" data-day="'+d+'">'+d+(hasPost?'<div class="sched-day-dot"></div>':'')+'</div>';
    }
    h+='</div>';
    // List scheduled posts below
    if(_scheduledPosts&&_scheduledPosts.length){
        h+='<div style="margin-top:16px;">';
        _scheduledPosts.forEach(function(s,i){
            h+='<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;"><div><p style="font-size:13px;">'+escapeHtml(s.content.substring(0,60))+(s.content.length>60?'...':'')+'</p><span style="font-size:11px;color:var(--gray);">'+new Date(s.scheduledAt).toLocaleString()+'</span></div><button class="btn btn-outline cancel-sched-cal" data-idx="'+i+'" style="font-size:11px;padding:2px 8px;color:#e74c3c;border-color:#e74c3c;flex-shrink:0;">Cancel</button></div>';
        });
        h+='</div>';
    } else {
        h+='<p style="text-align:center;color:var(--gray);margin-top:16px;">No scheduled posts this month.</p>';
    }
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    $$('.cancel-sched-cal').forEach(function(b){b.addEventListener('click',function(){_scheduledPosts.splice(parseInt(b.dataset.idx),1);persistScheduled();b.textContent='Cancelled';b.disabled=true;});});
}

// ======================== ADMIN REPORT QUEUE ========================
function showAdminReportQueue(){
    var h='<div class="modal-header"><h3><i class="fas fa-flag" style="color:#e74c3c;margin-right:8px;"></i>Report Queue</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;">';
    // Gather all reports from reportedPosts
    if(!reportedPosts||!reportedPosts.length){
        h+='<p style="text-align:center;color:var(--gray);padding:20px;">No reports to review.</p>';
    } else {
        reportedPosts.forEach(function(r,i){
            var typeClass=r.reason?r.reason.toLowerCase().replace(/\s+/g,''):'other';
            if(typeClass==='inappropriatecontent') typeClass='inappropriate';
            h+='<div class="report-queue-item">';
            h+='<div style="flex:1;"><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;"><span class="report-type '+(typeClass==='spam'?'spam':typeClass==='harassment'?'harassment':typeClass==='inappropriate'?'inappropriate':'other')+'">'+(r.reason||'Report')+'</span><span style="font-size:11px;color:var(--gray);">'+timeAgoReal(r.time||r.created_at||Date.now())+'</span></div>';
            h+='<p style="font-size:13px;">'+escapeHtml(r.type==='user'?'User: '+(r.userId||'').substring(0,8)+'...':'Post: '+(r.postId||r.pid||'').toString().substring(0,8)+'...')+'</p>';
            if(r.details) h+='<p style="font-size:12px;color:var(--gray);margin-top:2px;">'+escapeHtml(r.details)+'</p>';
            h+='</div>';
            h+='<button class="btn btn-outline dismiss-report" data-idx="'+i+'" style="font-size:11px;padding:4px 10px;flex-shrink:0;">Dismiss</button>';
            h+='</div>';
        });
    }
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    $$('.dismiss-report').forEach(function(b){b.addEventListener('click',function(){
        reportedPosts.splice(parseInt(b.dataset.idx),1);
        persistReports();
        b.closest('.report-queue-item').style.opacity='.3';
        b.textContent='Dismissed';b.disabled=true;
    });});
}

// ======================== ARIA LABELS FOR ICON BUTTONS ========================
(function addAriaLabels(){
    // Run after DOM is ready, add labels to common icon-only buttons
    var ariaMap={
        '.like-btn':'Like','.dislike-btn':'Dislike','.comment-btn':'Comment',
        '.share-btn':'Share','.react-btn':'React','.view-count-btn':'Views',
        '.post-menu-btn':'Post menu','.modal-close':'Close',
        '.cpm-emoji-btn':'Emoji','.cpm-camera-btn':'Add media',
        '#scrollToTopBtn':'Scroll to top'
    };
    Object.keys(ariaMap).forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
            if(!el.getAttribute('aria-label')) el.setAttribute('aria-label',ariaMap[sel]);
        });
    });
    // Re-run on mutations for dynamic content
    if('MutationObserver' in window){
        var _ariaObserver=new MutationObserver(function(){
            Object.keys(ariaMap).forEach(function(sel){
                document.querySelectorAll(sel).forEach(function(el){
                    if(!el.getAttribute('aria-label')) el.setAttribute('aria-label',ariaMap[sel]);
                });
            });
        });
        _ariaObserver.observe(document.body,{childList:true,subtree:true});
    }
})();

// ======================== MESSAGE REACTIONS ========================
var _msgReactionEmojis=['❤️','😂','😮','😢','👍','👎'];
var _msgReactions={};
try{_msgReactions=JSON.parse(localStorage.getItem('blipvibe_msg_reactions')||'{}');}catch(e){}
function persistMsgReactions(){try{localStorage.setItem('blipvibe_msg_reactions',JSON.stringify(_msgReactions));}catch(e){}}
function showMsgReactionPicker(bubble){
    var existing=document.querySelector('.msg-reaction-picker');
    if(existing) existing.remove();
    var picker=document.createElement('div');
    picker.className='msg-reaction-picker';
    picker.style.cssText='position:absolute;bottom:100%;right:0;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:4px 6px;display:flex;gap:2px;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,.3);';
    _msgReactionEmojis.forEach(function(em){
        var btn=document.createElement('button');
        btn.textContent=em;
        btn.style.cssText='background:none;font-size:18px;padding:4px;border-radius:8px;cursor:pointer;transition:transform .15s;';
        btn.addEventListener('mouseenter',function(){btn.style.transform='scale(1.3)';});
        btn.addEventListener('mouseleave',function(){btn.style.transform='scale(1)';});
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var mid=bubble.dataset.mid;
            if(!_msgReactions[mid]) _msgReactions[mid]={};
            var uid=currentUser?currentUser.id:'me';
            if(_msgReactions[mid][uid]===em) delete _msgReactions[mid][uid];
            else _msgReactions[mid][uid]=em;
            persistMsgReactions();
            renderMsgReactions(bubble);
            picker.remove();
        });
        picker.appendChild(btn);
    });
    bubble.style.position='relative';
    bubble.appendChild(picker);
    setTimeout(function(){document.addEventListener('click',function handler(e){if(!picker.contains(e.target)){picker.remove();document.removeEventListener('click',handler);}});},0);
}
function renderMsgReactions(bubble){
    var mid=bubble.dataset.mid;
    var existing=bubble.querySelector('.msg-reactions');
    if(existing) existing.remove();
    if(!_msgReactions[mid]||!Object.keys(_msgReactions[mid]).length) return;
    var uid=currentUser?currentUser.id:'me';
    var counts={};
    Object.values(_msgReactions[mid]).forEach(function(em){counts[em]=(counts[em]||0)+1;});
    var html='<div class="msg-reactions">';
    Object.keys(counts).forEach(function(em){
        var isMine=_msgReactions[mid][uid]===em;
        html+='<span class="msg-reaction-badge'+(isMine?' mine':'')+'">'+em+(counts[em]>1?' '+counts[em]:'')+'</span>';
    });
    html+='</div>';
    bubble.insertAdjacentHTML('beforeend',html);
}
function bindMsgReactions(){
    var area=$('#chatMessages');
    if(!area) return;
    area.querySelectorAll('.msg-bubble').forEach(function(bubble){
        if(bubble.querySelector('.msg-react-btn')) return;
        bubble.style.position='relative';
        var btn=document.createElement('button');
        btn.className='msg-react-btn';
        btn.innerHTML='<i class="far fa-face-smile"></i>';
        btn.addEventListener('click',function(e){e.stopPropagation();showMsgReactionPicker(bubble);});
        bubble.appendChild(btn);
        renderMsgReactions(bubble);
    });
}

// ======================== REPLY TO SPECIFIC MESSAGE ========================
var _replyingToMsg=null;
function setReplyToMessage(mid,text){
    _replyingToMsg={mid:mid,text:text};
    var bar=$('#msgReplyBar');
    if(!bar){
        bar=document.createElement('div');
        bar.id='msgReplyBar';
        bar.className='msg-reply-preview';
        var inputBar=$('#msgInput');
        if(inputBar&&inputBar.parentElement) inputBar.parentElement.insertBefore(bar,inputBar);
    }
    var preview=text.length>60?text.substring(0,60)+'...':text;
    bar.innerHTML='<i class="fas fa-reply" style="color:var(--primary);"></i><span class="reply-text">'+escapeHtml(preview)+'</span><button class="reply-close"><i class="fas fa-times"></i></button>';
    bar.querySelector('.reply-close').addEventListener('click',function(){clearReplyTo();});
    var input=$('#msgInput');
    if(input) input.focus();
}
function clearReplyTo(){
    _replyingToMsg=null;
    var bar=$('#msgReplyBar');
    if(bar) bar.remove();
}
function bindMsgReplyBtns(){
    var area=$('#chatMessages');
    if(!area) return;
    area.querySelectorAll('.msg-bubble').forEach(function(bubble){
        if(bubble.querySelector('.msg-reply-btn')) return;
        bubble.style.position='relative';
        var btn=document.createElement('button');
        btn.className='msg-reply-btn';
        btn.innerHTML='<i class="fas fa-reply"></i>';
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var raw=bubble.dataset.raw||bubble.textContent.trim();
            setReplyToMessage(bubble.dataset.mid,raw);
        });
        bubble.appendChild(btn);
    });
}

// ======================== TRENDING HASHTAGS PAGE ========================
function showTrendingHashtags(){
    // Collect hashtags from loaded feed posts
    var tagCounts={};
    feedPosts.forEach(function(p){
        var matches=(p.text||'').match(/#(\w+)/g);
        if(matches) matches.forEach(function(tag){
            var t=tag.toLowerCase();
            tagCounts[t]=(tagCounts[t]||0)+1;
        });
    });
    var sorted=Object.keys(tagCounts).sort(function(a,b){return tagCounts[b]-tagCounts[a];});
    var h='<div class="modal-header"><h3><i class="fas fa-fire" style="color:var(--primary);margin-right:8px;"></i>Trending Hashtags</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body" style="max-height:60vh;overflow-y:auto;padding:0;">';
    if(!sorted.length){
        h+='<p style="text-align:center;color:var(--gray);padding:30px;">No trending hashtags yet. Start posting with #hashtags!</p>';
    } else {
        sorted.slice(0,20).forEach(function(tag,i){
            h+='<div class="trending-tag" data-tag="'+escapeHtml(tag.replace('#',''))+'">';
            h+='<span class="tag-rank">'+(i+1)+'</span>';
            h+='<span class="tag-name">'+escapeHtml(tag)+'</span>';
            h+='<span class="tag-count">'+tagCounts[tag]+' post'+(tagCounts[tag]!==1?'s':'')+'</span>';
            h+='</div>';
        });
    }
    h+='</div>';
    showModal(h);
    $$('.trending-tag').forEach(function(el){
        el.addEventListener('click',function(){
            closeModal();
            showHashtagFeed(el.dataset.tag);
        });
    });
}

// ======================== SEARCH HISTORY ========================
var _searchHistory=[];
try{_searchHistory=JSON.parse(localStorage.getItem('blipvibe_search_history')||'[]');}catch(e){}
function persistSearchHistory(){try{localStorage.setItem('blipvibe_search_history',JSON.stringify(_searchHistory));}catch(e){}}
function addToSearchHistory(query){
    if(!query||!query.trim()) return;
    query=query.trim();
    _searchHistory=_searchHistory.filter(function(q){return q.toLowerCase()!==query.toLowerCase();});
    _searchHistory.unshift(query);
    if(_searchHistory.length>15) _searchHistory=_searchHistory.slice(0,15);
    persistSearchHistory();
}
function removeFromSearchHistory(query){
    _searchHistory=_searchHistory.filter(function(q){return q!==query;});
    persistSearchHistory();
}
function showSearchHistory(container){
    if(!_searchHistory.length) return;
    var html='<div style="padding:8px 0;">';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 16px;"><span style="font-size:13px;font-weight:600;color:var(--gray);">Recent Searches</span><button id="clearAllHistory" style="background:none;color:var(--primary);font-size:12px;">Clear All</button></div>';
    _searchHistory.forEach(function(q){
        html+='<div class="search-history-item" data-query="'+escapeHtml(q)+'"><i class="fas fa-clock"></i><span>'+escapeHtml(q)+'</span><button class="remove-history" data-query="'+escapeHtml(q)+'"><i class="fas fa-times"></i></button></div>';
    });
    html+='</div>';
    container.innerHTML=html;
    container.querySelectorAll('.search-history-item').forEach(function(item){
        item.addEventListener('click',function(e){
            if(e.target.closest('.remove-history')) return;
            performSearch(item.dataset.query);
        });
    });
    container.querySelectorAll('.remove-history').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            removeFromSearchHistory(btn.dataset.query);
            btn.closest('.search-history-item').remove();
        });
    });
    var clearBtn=document.getElementById('clearAllHistory');
    if(clearBtn) clearBtn.addEventListener('click',function(){_searchHistory=[];persistSearchHistory();container.innerHTML='';});
}

// ======================== MUTUAL FOLLOWERS ON PROFILES ========================
async function getMutualFollowers(userId){
    if(!currentUser||userId===currentUser.id) return [];
    try{
        var theirFollowers=await sbGetFollowers(userId);
        var myFollowingIds={};
        Object.keys(state.followedUsers).forEach(function(k){myFollowingIds[k]=true;});
        // Mutual = people who follow them AND who you also follow
        var mutuals=(theirFollowers||[]).filter(function(f){return myFollowingIds[f.id]&&f.id!==currentUser.id;});
        return mutuals.slice(0,5);
    }catch(e){return [];}
}
function renderMutualFollowers(container,mutuals){
    if(!mutuals||!mutuals.length) return;
    var html='<div class="mutual-followers">';
    mutuals.slice(0,3).forEach(function(m){
        html+='<img src="'+(m.avatar_url||DEFAULT_AVATAR)+'" alt="'+escapeHtml(m.display_name||m.username)+'" title="'+escapeHtml(m.display_name||m.username)+'">';
    });
    var names=mutuals.slice(0,2).map(function(m){return m.display_name||m.username;});
    var extra=mutuals.length-2;
    if(extra>0) html+='<span>Followed by '+escapeHtml(names[0])+' and '+(extra)+' other'+(extra>1?'s':'')+'</span>';
    else if(names.length===2) html+='<span>Followed by '+escapeHtml(names[0])+' and '+escapeHtml(names[1])+'</span>';
    else html+='<span>Followed by '+escapeHtml(names[0])+'</span>';
    html+='</div>';
    container.insertAdjacentHTML('beforeend',html);
}

// ======================== PUSH NOTIFICATIONS (Capacitor) ========================
async function initPushNotifications(){
    if(!window.Capacitor||!window.Capacitor.isNativePlatform()) return;
    try{
        var PushNotifications=window.Capacitor.Plugins.PushNotifications;
        if(!PushNotifications) return;
        var perm=await PushNotifications.requestPermissions();
        if(perm.receive!=='granted') return;
        await PushNotifications.register();
        PushNotifications.addListener('registration',function(token){
            console.log('[Push] Token:',token.value);
            // Store token for server-side push
            if(currentUser){
                sbUpdateProfile(currentUser.id,{push_token:token.value}).catch(function(e){console.warn('Push token save:',e);});
            }
        });
        PushNotifications.addListener('pushNotificationReceived',function(notification){
            console.log('[Push] Received:',notification);
            showToast(notification.title||notification.body||'New notification');
        });
        PushNotifications.addListener('pushNotificationActionPerformed',function(action){
            console.log('[Push] Action:',action);
            navigateTo('notifications');
        });
    }catch(e){console.warn('Push init error:',e);}
}

// ======================== SCROLL TO TOP BUTTON ========================
(function initScrollToTop(){
    var btn=document.getElementById('scrollToTopBtn');
    if(!btn) return;
    var _scrollThrottle=null;
    window.addEventListener('scroll',function(){
        if(_scrollThrottle) return;
        _scrollThrottle=requestAnimationFrame(function(){
            btn.classList.toggle('visible',window.scrollY>400);
            _scrollThrottle=null;
        });
    });
    btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
})();

// ======================== CHARACTER COUNTER ========================
var POST_MAX_CHARS=5000;
function initCharCounter(textareaId,counterEl){
    var ta=document.getElementById(textareaId);
    if(!ta||!counterEl) return;
    function update(){
        var len=Array.from(ta.value||'').length;
        var remaining=POST_MAX_CHARS-len;
        counterEl.textContent=len+' / '+POST_MAX_CHARS;
        counterEl.classList.remove('warn','over');
        if(remaining<200) counterEl.classList.add('warn');
        if(remaining<0) counterEl.classList.add('over');
    }
    ta.addEventListener('input',update);
    update();
}

// ======================== DOUBLE-TAP TO LIKE ========================
(function initDoubleTapLike(){
    var _lastTap={};
    document.addEventListener('touchend',function(e){
        var post=e.target.closest('.feed-post');
        if(!post) return;
        // Don't trigger on buttons, inputs, links, or media
        if(e.target.closest('button,a,input,textarea,video,iframe,.post-dropdown,.post-menu-btn')) return;
        var postId=post.querySelector('.like-btn')&&post.querySelector('.like-btn').getAttribute('data-post-id');
        if(!postId) return;
        var now=Date.now();
        var key='dbl_'+postId;
        if(_lastTap[key]&&now-_lastTap[key]<300){
            // Double tap detected
            delete _lastTap[key];
            var likeBtn=post.querySelector('.like-btn');
            if(likeBtn&&!state.likedPosts[postId]){
                likeBtn.click();
            }
            // Show heart animation on the post
            _showDoubleTapHeart(post);
        } else {
            _lastTap[key]=now;
        }
    });
    // Also support double-click on desktop
    document.addEventListener('dblclick',function(e){
        var post=e.target.closest('.feed-post');
        if(!post) return;
        if(e.target.closest('button,a,input,textarea,video,iframe,.post-dropdown,.post-menu-btn')) return;
        var postId=post.querySelector('.like-btn')&&post.querySelector('.like-btn').getAttribute('data-post-id');
        if(!postId) return;
        var likeBtn=post.querySelector('.like-btn');
        if(likeBtn&&!state.likedPosts[postId]){
            likeBtn.click();
        }
        _showDoubleTapHeart(post);
    });
})();
function _showDoubleTapHeart(postEl){
    var heart=document.createElement('div');
    heart.className='double-tap-heart';
    heart.innerHTML='<i class="fas fa-heart"></i>';
    var desc=postEl.querySelector('.post-description')||postEl;
    desc.style.position='relative';
    desc.appendChild(heart);
    requestAnimationFrame(function(){heart.classList.add('active');});
    setTimeout(function(){if(heart.parentNode) heart.remove();},1000);
}

// ======================== ANIMATED LIKE FEEDBACK ========================
// Add burst animation when liking a post
function animateLikeBtn(btn){
    btn.classList.add('animating');
    // Float a small heart upward
    var rect=btn.getBoundingClientRect();
    var floater=document.createElement('span');
    floater.className='like-float';
    floater.innerHTML='<i class="fas fa-thumbs-up" style="color:var(--primary);"></i>';
    floater.style.left=rect.left+'px';
    floater.style.top=(rect.top+window.scrollY)+'px';
    document.body.appendChild(floater);
    setTimeout(function(){btn.classList.remove('animating');},400);
    setTimeout(function(){if(floater.parentNode) floater.remove();},800);
}

// ======================== UNSEND MESSAGE (5s window) ========================
var _lastSentMsgId=null;
var _unsendTimer=null;
function showUnsendOption(msgEl,messageId){
    _lastSentMsgId=messageId;
    var bar=document.createElement('div');
    bar.className='msg-unsend-bar';
    bar.innerHTML='<span>Message sent</span><button id="unsendMsgBtn">Undo</button>';
    msgEl.after(bar);
    bar.querySelector('#unsendMsgBtn').addEventListener('click',async function(){
        try{
            await sbDeleteMessage(messageId);
            msgEl.remove();
            bar.remove();
            showToast('Message unsent');
        }catch(e){showToast('Could not unsend');}
        clearTimeout(_unsendTimer);
    });
    clearTimeout(_unsendTimer);
    _unsendTimer=setTimeout(function(){if(bar.parentNode) bar.remove();_lastSentMsgId=null;},5000);
}

// ======================== CONFIRM BEFORE LEAVING DRAFT ========================
function confirmDraftLeave(callback){
    var draft=loadDraft();
    if(!draft||!draft.trim()){callback();return;}
    var h='<div class="modal-header"><h3>Discard Draft?</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="text-align:center;color:var(--gray);margin-bottom:16px;">You have an unsaved draft. What would you like to do?</p>';
    h+='<div class="modal-actions"><button class="btn btn-outline" id="draftKeepBtn">Keep Draft</button><button class="btn" id="draftDiscardBtn" style="background:#e74c3c;color:#fff;">Discard</button></div></div>';
    showModal(h);
    document.getElementById('draftKeepBtn').addEventListener('click',function(){closeModal();callback();});
    document.getElementById('draftDiscardBtn').addEventListener('click',function(){clearDraft();closeModal();callback();});
}

// ======================== SHARE YOUR PROFILE ========================
function showShareProfileModal(){
    if(!currentUser) return;
    var link=location.origin+location.pathname+'#profile:'+currentUser.username;
    var h='<div class="modal-header"><h3><i class="fas fa-share-nodes" style="color:var(--primary);margin-right:8px;"></i>Share Your Profile</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<div style="text-align:center;margin-bottom:16px;"><img src="'+getMyAvatarUrl()+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto 8px;display:block;"><strong>'+escapeHtml(currentUser.display_name||currentUser.username)+'</strong><p style="font-size:12px;color:var(--gray);">@'+escapeHtml(currentUser.username)+'</p></div>';
    h+='<div class="invite-link-box"><input type="text" value="'+escapeHtml(link)+'" readonly id="shareProfileInput"><button id="copyShareProfile"><i class="fas fa-copy"></i> Copy</button></div>';
    h+='<div class="modal-actions"><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    document.getElementById('copyShareProfile').addEventListener('click',function(){
        var inp=document.getElementById('shareProfileInput');
        inp.select();
        try{navigator.clipboard.writeText(inp.value);showToast('Profile link copied!');}catch(e){document.execCommand('copy');showToast('Profile link copied!');}
    });
}

// ======================== SUGGESTED FOLLOWS AFTER FOLLOWING ========================
async function showSuggestedFollows(justFollowedId){
    try{
        var followers=await sbGetFollowing(justFollowedId);
        if(!followers||!followers.length) return;
        // Filter out people you already follow and yourself
        var suggestions=followers.filter(function(p){
            return p.id!==currentUser.id&&!state.followedUsers[p.id];
        }).slice(0,3);
        if(!suggestions.length) return;
        var h='<div style="margin-top:12px;padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(139,92,246,.03);">';
        h+='<p style="font-size:12px;color:var(--gray);margin-bottom:8px;"><i class="fas fa-user-plus" style="margin-right:4px;"></i>People they follow</p>';
        suggestions.forEach(function(p){
            var avatar=p.avatar_url||DEFAULT_AVATAR;
            var name=p.display_name||p.username||'User';
            h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;"><img src="'+avatar+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"><div style="flex:1;"><strong style="font-size:13px;">'+escapeHtml(name)+'</strong></div><button class="btn btn-primary suggested-follow-quick" data-uid="'+p.id+'" style="padding:4px 12px;font-size:11px;">Follow</button></div>';
        });
        h+='</div>';
        showToast('');// clear any existing toast
        // Append to the active modal if one is open, or show as toast-like popup
        var modal=document.querySelector('.modal-body');
        if(modal){
            modal.insertAdjacentHTML('beforeend',h);
            modal.querySelectorAll('.suggested-follow-quick').forEach(function(btn){
                btn.addEventListener('click',async function(){
                    try{
                        await sbFollow(currentUser.id,btn.dataset.uid);
                        state.followedUsers[btn.dataset.uid]=true;
                        btn.textContent='Following';btn.disabled=true;btn.style.opacity='.6';
                    }catch(e){showToast('Could not follow');}
                });
            });
        }
    }catch(e){}
}

// ======================== LAZY LOADING IMAGES ========================
// MutationObserver to add loading="lazy" to all new images in the feed
(function initLazyLoadImages(){
    if(!('MutationObserver' in window)) return;
    var observer=new MutationObserver(function(mutations){
        mutations.forEach(function(m){
            m.addedNodes.forEach(function(node){
                if(node.nodeType!==1) return;
                var imgs=node.querySelectorAll?node.querySelectorAll('img:not([loading])'):[];
                imgs.forEach(function(img){
                    // Don't lazy load above-the-fold images (nav, profile card)
                    if(!img.closest('.navbar')&&!img.closest('.profile-card')&&!img.closest('.login-page')){
                        img.setAttribute('loading','lazy');
                    }
                });
                // Also check if the node itself is an img
                if(node.tagName==='IMG'&&!node.getAttribute('loading')&&!node.closest('.navbar')){
                    node.setAttribute('loading','lazy');
                }
            });
        });
    });
    observer.observe(document.body,{childList:true,subtree:true});
})();

// ======================== FEED CACHE (sessionStorage) ========================
function cacheFeedData(){
    if(!feedPosts||!feedPosts.length) return;
    try{
        // Only cache first 50 posts to keep size reasonable
        var toCache=feedPosts.slice(0,50).map(function(p){
            return {idx:p.idx,person:p.person,text:p.text,tags:p.tags,badge:p.badge,loc:p.loc,likes:p.likes,commentCount:p.commentCount,shares:p.shares,images:p.images,created_at:p.created_at,sharedPost:p.sharedPost||null};
        });
        sessionStorage.setItem('blipvibe_feed_cache',JSON.stringify(toCache));
    }catch(e){}
}
function loadCachedFeed(){
    try{
        var cached=sessionStorage.getItem('blipvibe_feed_cache');
        if(!cached) return null;
        return JSON.parse(cached);
    }catch(e){return null;}
}

// ======================== DAILY QUEST SYSTEM ========================
var _questData=null;
async function loadDailyQuests(){
    try{
        var data=await sb.rpc('get_daily_quests');
        if(data&&!data.error) _questData=data;
    }catch(e){
        // RPC not deployed yet — use local fallback
        var key='blipvibe_quests_'+new Date().toDateString();
        try{_questData=JSON.parse(localStorage.getItem(key))||{likes_count:0,follows_count:0,posts_count:0,likes_reward_claimed:false,follows_reward_claimed:false,posts_reward_claimed:false};}catch(e2){_questData={likes_count:0,follows_count:0,posts_count:0,likes_reward_claimed:false,follows_reward_claimed:false,posts_reward_claimed:false};}
    }
    renderQuestPanel();
}
async function trackQuestProgress(type){
    try{
        var result=await sb.rpc('update_quest_progress',{p_type:type});
        if(result&&result.reward_claimed){
            showToast('Quest complete! +'+result.reward_amount+' coins!');
            if(result.new_balance!=null){state.coins=result.new_balance;currentUser.coin_balance=result.new_balance;updateCoins();}
        }
        if(result) _questData=result;
    }catch(e){
        // Local fallback
        if(!_questData) _questData={likes_count:0,follows_count:0,posts_count:0,likes_reward_claimed:false,follows_reward_claimed:false,posts_reward_claimed:false};
        if(type==='like') _questData.likes_count++;
        else if(type==='follow') _questData.follows_count++;
        else if(type==='post') _questData.posts_count++;
        var key='blipvibe_quests_'+new Date().toDateString();
        try{localStorage.setItem(key,JSON.stringify(_questData));}catch(e2){}
    }
    renderQuestPanel();
    renderCoinGoalBar();
}
function renderQuestPanel(){
    var container=document.getElementById('questPanel');
    if(!container||!_questData) return;
    var q=_questData;
    var html='<div class="quest-panel-header"><h4><i class="fas fa-scroll" style="color:var(--primary);"></i> Daily Quests</h4><span class="quest-reset">Resets daily</span></div>';
    // Quest 1: Like 3 posts
    var likePct=Math.min(100,Math.round((q.likes_count||0)/3*100));
    var likeDone=q.likes_reward_claimed||(q.likes_count||0)>=3;
    html+='<div class="quest-item"><div class="quest-icon quest-like"><i class="fas fa-heart"></i></div><div class="quest-info"><p>Like 3 posts</p><div class="quest-bar"><div class="quest-bar-fill" style="width:'+likePct+'%;background:#ef4444;"></div></div><span class="quest-progress">'+(q.likes_count||0)+' / 3</span></div>'+(likeDone?'<span class="quest-check"><i class="fas fa-check-circle"></i></span>':'<span class="quest-reward"><i class="fas fa-coins"></i> +20</span>')+'</div>';
    // Quest 2: Follow 2 users
    var followPct=Math.min(100,Math.round((q.follows_count||0)/2*100));
    var followDone=q.follows_reward_claimed||(q.follows_count||0)>=2;
    html+='<div class="quest-item"><div class="quest-icon quest-follow"><i class="fas fa-user-plus"></i></div><div class="quest-info"><p>Follow 2 users</p><div class="quest-bar"><div class="quest-bar-fill" style="width:'+followPct+'%;background:#3b82f6;"></div></div><span class="quest-progress">'+(q.follows_count||0)+' / 2</span></div>'+(followDone?'<span class="quest-check"><i class="fas fa-check-circle"></i></span>':'<span class="quest-reward"><i class="fas fa-coins"></i> +20</span>')+'</div>';
    // Quest 3: Create 1 post
    var postPct=Math.min(100,Math.round((q.posts_count||0)/1*100));
    var postDone=q.posts_reward_claimed||(q.posts_count||0)>=1;
    html+='<div class="quest-item"><div class="quest-icon quest-post"><i class="fas fa-pen"></i></div><div class="quest-info"><p>Create a post</p><div class="quest-bar"><div class="quest-bar-fill" style="width:'+postPct+'%;background:#22c55e;"></div></div><span class="quest-progress">'+(q.posts_count||0)+' / 1</span></div>'+(postDone?'<span class="quest-check"><i class="fas fa-check-circle"></i></span>':'<span class="quest-reward"><i class="fas fa-coins"></i> +35</span>')+'</div>';
    container.innerHTML=html;
}

// ======================== COIN PROGRESS BAR ========================
function renderCoinGoalBar(){
    var container=document.getElementById('coinGoalBar');
    if(!container) return;
    if(_hasInfinity()){container.innerHTML='';return;}
    var coins=state.coins||0;
    var goal=300; // Premium skin price
    var pct=Math.min(100,Math.round(coins/goal*100));
    var nextSkin=premiumSkins?premiumSkins[Math.floor(Date.now()/86400000)%premiumSkins.length]:null;
    var goalName=nextSkin?nextSkin.name:'Premium Skin';
    container.innerHTML='<p><span>'+coins+' / '+goal+' coins</span><strong>'+goalName+'</strong></p><div class="coin-goal-track"><div class="coin-goal-fill" style="width:'+pct+'%;"></div></div>';
}

// ======================== FEATURED SKIN (DAILY ROTATION) ========================
function renderFeaturedSkin(){
    var container=document.getElementById('featuredSkinBanner');
    if(!container||!premiumSkins||!premiumSkins.length) return;
    // Rotate based on day of year
    var dayOfYear=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0).getTime())/86400000);
    var skin=premiumSkins[dayOfYear%premiumSkins.length];
    if(!skin) return;
    // Calculate hours until midnight
    var now=new Date();
    var midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
    var hoursLeft=Math.floor((midnight-now)/3600000);
    var minsLeft=Math.floor(((midnight-now)%3600000)/60000);
    var owned=state.ownedPremiumSkins&&state.ownedPremiumSkins[skin.id];
    var canBuy=_hasInfinity()||state.coins>=skin.price;
    container.innerHTML='<div class="featured-header"><h4><i class="fas fa-fire"></i> Featured Skin</h4><span class="featured-timer"><i class="far fa-clock"></i> '+hoursLeft+'h '+minsLeft+'m left</span></div>'
        +'<div class="featured-body"><div class="featured-preview" style="background:'+skin.preview+';"></div>'
        +'<div class="featured-info"><h5>'+escapeHtml(skin.name)+'</h5><p>'+escapeHtml(skin.desc||'')+'</p></div>'
        +(owned?'<button class="btn btn-disabled" style="padding:6px 14px;font-size:12px;">Owned</button>':'<button class="btn '+(canBuy?'btn-primary':'btn-disabled')+' featured-buy-btn" data-pid="'+skin.id+'" style="padding:6px 14px;font-size:12px;"'+(canBuy?'':' disabled')+'>'+(_hasInfinity()?'Free':''+skin.price+' <i class="fas fa-coins"></i>')+'</button>')
        +'</div>';
    var buyBtn=container.querySelector('.featured-buy-btn');
    if(buyBtn) buyBtn.addEventListener('click',function(){
        if(_hasInfinity()||state.coins>=skin.price){
            if(!_hasInfinity()) state.coins-=skin.price;
            state.ownedPremiumSkins[skin.id]=true;
            updateCoins();saveState();
            showToast('You purchased "'+skin.name+'"!');
            renderFeaturedSkin();
            renderCoinGoalBar();
        }
    });
}

// ======================== PROFILE MUSIC SYSTEM ========================
var _profileAudio=null;
var _myAudio=null; // your own profile song that plays as you browse
var _mySong=null; // your song data
var _viewingSong=null; // the song playing from someone else's profile
var _gmpBaseVol=0.5;

// Initialize your own background music on app load
function _setupFadeLoop(audio){
    audio.loop=false;
    var _fl=null;
    audio.addEventListener('timeupdate',function(){
        if(!audio||audio.paused) return;
        var timeLeft=audio.duration-audio.currentTime;
        if(timeLeft<=3&&timeLeft>0&&!_fl){
            _fl=setInterval(function(){
                if(!audio||audio.paused){clearInterval(_fl);_fl=null;return;}
                var rem=audio.duration-audio.currentTime;
                if(rem<=0){clearInterval(_fl);_fl=null;return;}
                audio.volume=Math.max(0,_gmpBaseVol*(rem/3));
            },100);
        }
    });
    audio.addEventListener('ended',function(){
        clearInterval(_fl);_fl=null;
        if(!audio) return;
        audio.currentTime=0;audio.volume=0;audio.play();
        _fadeAudio(audio,0,_gmpBaseVol,1000,null);
    });
}
// Refresh the global player with a new song (called after setting profile song)
async function refreshMyProfileMusic(){
    try{
        var song=await sbGetProfileSong(currentUser.id);
        if(!song){_mySong=null;if(_myAudio){_myAudio.pause();_myAudio=null;}hideGlobalPlayer();return;}
        // Stop old audio
        if(_myAudio){_myAudio.pause();_myAudio=null;}
        _mySong=song;
        _myAudio=new Audio(song.file_url);
        _myAudio.volume=_gmpBaseVol;
        _setupFadeLoop(_myAudio);
        _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
        showGlobalPlayer();
        // Auto-play the new song
        _myAudio.volume=0;_myAudio.play().then(function(){
            _fadeAudio(_myAudio,0,_gmpBaseVol,500,function(){
                _updateGlobalPlayer(song.title,song.artist||'BlipVibe',true);
            });
        }).catch(function(){});
    }catch(e){console.warn('refreshMyProfileMusic:',e);}
}
async function initMyProfileMusic(){
    if(!currentUser||!currentUser.profile_song_id) return;
    try{
        var song=await sbGetProfileSong(currentUser.id);
        if(!song) return;
        _mySong=song;
        _myAudio=new Audio(song.file_url);
        _myAudio.volume=_gmpBaseVol;
        _setupFadeLoop(_myAudio);
        _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
        showGlobalPlayer();
    }catch(e){console.warn('[Music] initMyProfileMusic error:',e);}
}
function showGlobalPlayer(){
    var el=document.getElementById('globalMiniPlayer');
    if(el) el.classList.add('visible');
}
var _playerHidden=false;
function hideGlobalPlayer(){
    var el=document.getElementById('globalMiniPlayer');
    if(el) el.classList.remove('visible');
    // Pause but don't destroy — user can reopen
    var audio=_getCurrentAudio();
    if(audio&&!audio.paused) audio.pause();
    _playerHidden=true;
    // Show reopen button in nav
    var reopenBtn=document.getElementById('navMusicBtn');
    if(reopenBtn) reopenBtn.style.display='flex';
}
function reopenGlobalPlayer(){
    _playerHidden=false;
    var el=document.getElementById('globalMiniPlayer');
    if(el) el.classList.add('visible');
    var reopenBtn=document.getElementById('navMusicBtn');
    if(reopenBtn) reopenBtn.style.display='none';
}
function _updateGlobalPlayer(title,artist,isPlaying){
    var t=document.getElementById('gmpTitle');if(t) t.textContent=title||'—';
    var a=document.getElementById('gmpArtist');if(a) a.textContent=artist||'BlipVibe';
    var pb=document.getElementById('gmpPlayBtn');
    if(pb) pb.innerHTML=isPlaying?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';
    var el=document.getElementById('globalMiniPlayer');
    if(el) el.classList.toggle('playing',!!isPlaying);
}
function _getCurrentAudio(){return _profileAudio||_myAudio;}
// Fade out an audio element over duration ms
function _fadeAudio(audio,fromVol,toVol,duration,onDone){
    if(!audio) {if(onDone)onDone();return;}
    var steps=20;var stepTime=duration/steps;var volStep=(toVol-fromVol)/steps;var current=fromVol;var step=0;
    var interval=setInterval(function(){
        step++;current+=volStep;
        if(audio) audio.volume=Math.max(0,Math.min(1,current));
        if(step>=steps){
            clearInterval(interval);
            if(audio) audio.volume=Math.max(0,Math.min(1,toVol));
            if(onDone) onDone();
        }
    },stepTime);
}
// Switch to someone else's song when visiting their profile (crossfade)
function switchToProfileSong(song){
    if(!song) return;
    // Fade out your own music
    if(_myAudio&&!_myAudio.paused){
        _fadeAudio(_myAudio,_myAudio.volume,0,800,function(){if(_myAudio)_myAudio.pause();});
    }
    // Fade out any existing profile audio
    if(_profileAudio){_fadeAudio(_profileAudio,_profileAudio.volume,0,300,function(){if(_profileAudio){_profileAudio.pause();_profileAudio=null;}});}
    // Create their song with fade loop and auto-play
    _viewingSong=song;
    _profileAudio=new Audio(song.file_url);
    _profileAudio.volume=0;
    _setupFadeLoop(_profileAudio);
    _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
    showGlobalPlayer();
    // Auto-play with fade-in after a short delay (let fade-out finish)
    setTimeout(function(){
        if(!_profileAudio) return;
        _profileAudio.play().then(function(){
            _fadeAudio(_profileAudio,0,_gmpBaseVol,800,function(){
                _updateGlobalPlayer(song.title,song.artist||'BlipVibe',true);
            });
        }).catch(function(){
            // Browser blocked autoplay — user needs to click play
            _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
        });
    },500);
}
// Resume your own song when leaving someone's profile (crossfade)
function resumeMyMusic(){
    if(_profileAudio){
        _fadeAudio(_profileAudio,_profileAudio.volume,0,800,function(){
            if(_profileAudio){_profileAudio.pause();_profileAudio=null;}_viewingSong=null;
        });
    }
    if(_mySong&&_myAudio){
        _updateGlobalPlayer(_mySong.title,_mySong.artist||'BlipVibe',false);
        // Fade your song back in after the other fades out
        setTimeout(function(){
            if(!_mySong||!_myAudio) return;
            _myAudio.volume=0;
            _myAudio.play().then(function(){
                _fadeAudio(_myAudio,0,_gmpBaseVol,1000,function(){
                    _updateGlobalPlayer(_mySong.title,_mySong.artist||'BlipVibe',true);
                });
            }).catch(function(){});
        },500);
    }
}
function showSongPickerModal(){
    var h='<div class="modal-header"><h3><i class="fas fa-music" style="color:var(--primary);margin-right:8px;"></i>Profile Song</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Pick a song for your profile. Visitors will see a music player when they view your page.</p>';
    h+='<div class="song-picker-grid" id="songPickerGrid"><div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="color:var(--primary);font-size:20px;"></i></div></div>';
    h+='<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-outline" id="removeSongBtn"><i class="fas fa-times"></i> Remove Song</button><button class="btn btn-primary modal-close">Done</button></div></div>';
    showModal(h);
    (async function(){
        try{
            var songs=await sbGetMusicLibrary();
            var owned=await sbGetUserSongs(currentUser.id);
            var ownedMap={};owned.forEach(function(sid){ownedMap[sid]=true;});
            var currentSongId=currentUser.profile_song_id||null;
            var grid=document.getElementById('songPickerGrid');
            if(!grid) return;
            if(!songs.length){grid.innerHTML='<p style="text-align:center;color:var(--gray);">No songs available yet.</p>';return;}
            var gh='';
            songs.forEach(function(song){
                var isOwned=_hasInfinity()||ownedMap[song.id];
                var isActive=currentSongId===song.id;
                gh+='<div class="song-picker-item'+(isActive?' active':'')+'" data-song-id="'+song.id+'" data-url="'+escapeHtml(song.file_url)+'">';
                gh+='<div class="spi-art"><i class="fas fa-music"></i></div>';
                gh+='<div class="spi-info"><div class="spi-title">'+escapeHtml(song.title)+'</div><div class="spi-genre">'+(song.genre?escapeHtml(song.genre):'BlipVibe Original')+'</div></div>';
                gh+='<button class="spi-preview" title="Preview"><i class="fas fa-play"></i></button>';
                if(isActive) gh+='<span style="color:var(--green);font-size:14px;"><i class="fas fa-check-circle"></i></span>';
                else if(isOwned) gh+='<button class="btn btn-primary spi-set" data-sid="'+song.id+'" style="padding:4px 12px;font-size:11px;">Set</button>';
                else gh+='<button class="btn btn-primary spi-buy" data-sid="'+song.id+'" data-price="'+song.price+'" style="padding:4px 12px;font-size:11px;">'+(_hasInfinity()?'Free':song.price+' <i class="fas fa-coins"></i>')+'</button>';
                gh+='</div>';
            });
            grid.innerHTML=gh;
            // Preview buttons
            var _previewAudio=null;
            grid.querySelectorAll('.spi-preview').forEach(function(btn){
                btn.addEventListener('click',function(e){
                    e.stopPropagation();
                    var url=btn.closest('.song-picker-item').dataset.url;
                    if(_previewAudio){_previewAudio.pause();_previewAudio=null;grid.querySelectorAll('.spi-preview i').forEach(function(i){i.className='fas fa-play';});}
                    if(btn.querySelector('i').classList.contains('fa-pause')){btn.querySelector('i').className='fas fa-play';return;}
                    _previewAudio=new Audio(url);_previewAudio.volume=0.5;_previewAudio.play();
                    btn.querySelector('i').className='fas fa-pause';
                    _previewAudio.addEventListener('ended',function(){btn.querySelector('i').className='fas fa-play';_previewAudio=null;});
                });
            });
            // Buy buttons
            grid.querySelectorAll('.spi-buy').forEach(function(btn){
                btn.addEventListener('click',async function(){
                    var sid=btn.dataset.sid;var price=parseInt(btn.dataset.price);
                    if(!_hasInfinity()&&state.coins<price){showToast('Not enough coins');return;}
                    btn.disabled=true;btn.textContent='...';
                    try{
                        if(!_hasInfinity()){state.coins-=price;updateCoins();}
                        await sbPurchaseSong(currentUser.id,sid);
                        await sbSetProfileSong(currentUser.id,sid);
                        currentUser.profile_song_id=sid;
                        saveState();closeModal();
                        showToast('Song set on your profile!');
                    }catch(e){showToast('Failed: '+(e.message||'Error'));btn.disabled=false;}
                });
            });
            // Set buttons (already owned)
            grid.querySelectorAll('.spi-set').forEach(function(btn){
                btn.addEventListener('click',async function(){
                    var sid=btn.dataset.sid;
                    btn.disabled=true;btn.textContent='...';
                    try{
                        await sbSetProfileSong(currentUser.id,sid);
                        currentUser.profile_song_id=sid;
                        saveState();closeModal();
                        showToast('Profile song updated!');refreshMyProfileMusic();
                    }catch(e){showToast('Failed');btn.disabled=false;}
                });
            });
        }catch(e){
            var grid=document.getElementById('songPickerGrid');
            if(grid) grid.innerHTML='<p style="color:var(--gray);text-align:center;">Could not load songs. Run the migration first.</p>';
        }
    })();
    // Remove song button
    document.getElementById('removeSongBtn').addEventListener('click',async function(){
        try{
            await sbSetProfileSong(currentUser.id,null);
            currentUser.profile_song_id=null;
            closeModal();showToast('Profile song removed');
        }catch(e){showToast('Failed');}
    });
}
// Old renderProfileMusicPlayer removed — all audio goes through global mini player now
function stopProfileAudio(){
    if(_profileAudio){_profileAudio.pause();_profileAudio=null;}
}

// ======================== GLOBAL MINI PLAYER CONTROLS ========================
(function initGlobalMiniPlayer(){
    var playBtn=document.getElementById('gmpPlayBtn');
    var volSlider=document.getElementById('gmpVolume');
    var muteBtn=document.getElementById('gmpMuteBtn');
    var closeBtn=document.getElementById('gmpClose');
    if(playBtn) playBtn.addEventListener('click',function(){
        var audio=_getCurrentAudio();
        if(!audio){console.warn('[Music] No audio object available');return;}
        var t=document.getElementById('gmpTitle');
        var a=document.getElementById('gmpArtist');
        if(audio.paused){
            audio.volume=0;
            audio.play().then(function(){
                _fadeAudio(audio,0,_gmpBaseVol,500,null);
                _updateGlobalPlayer(t?t.textContent:null,a?a.textContent:null,true);
            }).catch(function(e){console.warn('[Music] Play failed:',e);showToast('Tap again to play');});
        } else {
            _fadeAudio(audio,audio.volume,0,300,function(){audio.pause();audio.volume=_gmpBaseVol;});
            _updateGlobalPlayer(t?t.textContent:null,a?a.textContent:null,false);
        }
    });
    if(volSlider) volSlider.addEventListener('input',function(){
        _gmpBaseVol=this.value/100;
        var audio=_getCurrentAudio();
        if(audio) audio.volume=_gmpBaseVol;
    });
    if(muteBtn) muteBtn.addEventListener('click',function(){
        var audio=_getCurrentAudio();
        if(!audio) return;
        audio.muted=!audio.muted;
        muteBtn.innerHTML=audio.muted?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';
    });
    if(closeBtn) closeBtn.addEventListener('click',function(){hideGlobalPlayer();});
    var navMusicBtn=document.getElementById('navMusicBtn');
    if(navMusicBtn) navMusicBtn.addEventListener('click',function(){reopenGlobalPlayer();});
})();
// Auto-start music after first user interaction on the page
var _musicAutoStarted=false;
function _tryAutoStartMusic(){
    if(_musicAutoStarted) return;
    var audio=_getCurrentAudio();
    if(!audio||!audio.paused) return;
    _musicAutoStarted=true;
    audio.volume=0;
    audio.play().then(function(){
        _fadeAudio(audio,0,_gmpBaseVol,800,null);
        var t=document.getElementById('gmpTitle');
        var a=document.getElementById('gmpArtist');
        _updateGlobalPlayer(t?t.textContent:null,a?a.textContent:null,true);
    }).catch(function(){_musicAutoStarted=false;});
}
document.addEventListener('click',_tryAutoStartMusic,{once:true});
document.addEventListener('touchend',_tryAutoStartMusic,{once:true});

// ======================== COIN EARN ANIMATION ========================
var _lastCoinAnim=0;
function showCoinEarnAnimation(anchorEl,amount){
    if(!anchorEl||amount===0) return;
    var now=Date.now();
    if(now-_lastCoinAnim<500) return; // debounce — one animation per 500ms
    _lastCoinAnim=now;
    var isNegative=amount<0;
    // Get the active coin skin icon and color
    var coinIcon='fa-coins';
    var coinColor='#ffd700';
    if(state.activeCoinSkin){
        var skin=coinSkins.find(function(c){return c.id===state.activeCoinSkin;});
        if(skin){coinIcon=skin.icon;coinColor=skin.color;}
    }
    var rect=anchorEl.getBoundingClientRect();
    var floater=document.createElement('div');
    floater.className='coin-earn-float '+(isNegative?'negative':'anim'+Math.floor(Math.random()*5));
    floater.style.left=(rect.left+rect.width/2)+'px';
    floater.style.top=(rect.top+window.scrollY-10)+'px';
    if(!isNegative) floater.style.color=coinColor;
    floater.innerHTML='<i class="fas '+coinIcon+'"></i> '+(isNegative?'':'+')+(amount||1);
    document.body.appendChild(floater);
    setTimeout(function(){if(floater.parentNode) floater.remove();},1000);
}

// ======================== YOUTUBE MOBILE THUMBNAIL CLICK HANDLER ========================
document.addEventListener('click',function(e){
    var thumb=e.target.closest('[data-yt-id]');
    if(thumb){
        var ytId=thumb.dataset.ytId;
        if(ytId) window.open('https://www.youtube.com/watch?v='+ytId,'_blank');
    }
});

// ======================== ADD TO HOME SCREEN (PWA INSTALL PROMPT) ========================
var _deferredInstallPrompt=null;
// Capture the native install prompt (Chrome/Android)
window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    _deferredInstallPrompt=e;
});
function showPwaInstallBanner(){
    // Don't show if already installed (standalone mode) or already dismissed
    if(window.matchMedia('(display-mode:standalone)').matches) return;
    if(window.navigator.standalone===true) return; // iOS standalone
    try{if(localStorage.getItem('blipvibe_pwa_dismissed')) return;}catch(e){}
    // Only show on mobile
    if(!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
    var isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    var banner=document.createElement('div');
    banner.className='pwa-install-banner';
    banner.innerHTML='<div class="pwa-icon"><i class="fas fa-mobile-screen-button"></i></div>'
        +'<div class="pwa-text"><h4>\ud83d\udcf1 Get the BlipVibe App!</h4><p>Add BlipVibe to your home screen for the best experience.</p></div>'
        +'<div class="pwa-actions"><button class="pwa-install-dismiss" id="pwaDismiss">Not now</button><button class="btn btn-primary" id="pwaInstall">Add</button></div>';
    document.body.appendChild(banner);
    document.getElementById('pwaDismiss').addEventListener('click',function(){
        banner.remove();
        try{localStorage.setItem('blipvibe_pwa_dismissed','1');}catch(e){}
    });
    document.getElementById('pwaInstall').addEventListener('click',function(){
        if(_deferredInstallPrompt){
            // Android/Chrome native install prompt
            _deferredInstallPrompt.prompt();
            _deferredInstallPrompt.userChoice.then(function(result){
                if(result.outcome==='accepted') showToast('BlipVibe added to home screen!');
                _deferredInstallPrompt=null;
            });
            banner.remove();
        } else if(isIOS){
            // iOS — show manual instructions
            banner.remove();
            showIosInstallInstructions();
        } else {
            // Fallback — show generic instructions
            banner.remove();
            showGenericInstallInstructions();
        }
    });
}
function showIosInstallInstructions(){
    var overlay=document.createElement('div');
    overlay.className='pwa-install-instructions';
    overlay.innerHTML='<div class="pwa-modal">'
        +'<h3>\ud83d\udcf1 Add BlipVibe to Home Screen</h3>'
        +'<div class="step"><div class="step-num">1</div><span>Tap the <strong>Share</strong> button <i class="fas fa-arrow-up-from-bracket" style="color:var(--primary);"></i> at the bottom of your browser</span></div>'
        +'<div class="step"><div class="step-num">2</div><span>Scroll down and tap <strong>"Add to Home Screen"</strong></span></div>'
        +'<div class="step"><div class="step-num">3</div><span>Tap <strong>"Add"</strong> in the top right corner</span></div>'
        +'<div style="margin-top:16px;"><button class="btn btn-primary" id="pwaIosDone" style="width:100%;">Got it!</button></div>'
        +'</div>';
    document.body.appendChild(overlay);
    document.getElementById('pwaIosDone').addEventListener('click',function(){overlay.remove();});
    overlay.addEventListener('click',function(e){if(e.target===overlay) overlay.remove();});
    try{localStorage.setItem('blipvibe_pwa_dismissed','1');}catch(e){}
}
function showGenericInstallInstructions(){
    var overlay=document.createElement('div');
    overlay.className='pwa-install-instructions';
    overlay.innerHTML='<div class="pwa-modal">'
        +'<h3>\ud83d\udcf1 Add BlipVibe to Home Screen</h3>'
        +'<div class="step"><div class="step-num">1</div><span>Tap the <strong>menu</strong> button <i class="fas fa-ellipsis-vertical" style="color:var(--primary);"></i> in your browser</span></div>'
        +'<div class="step"><div class="step-num">2</div><span>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></span></div>'
        +'<div class="step"><div class="step-num">3</div><span>Tap <strong>"Add"</strong> to confirm</span></div>'
        +'<div style="margin-top:16px;"><button class="btn btn-primary" id="pwaGenDone" style="width:100%;">Got it!</button></div>'
        +'</div>';
    document.body.appendChild(overlay);
    document.getElementById('pwaGenDone').addEventListener('click',function(){overlay.remove();});
    overlay.addEventListener('click',function(e){if(e.target===overlay) overlay.remove();});
    try{localStorage.setItem('blipvibe_pwa_dismissed','1');}catch(e){}
}

// ======================== WIRE UP NEW FEATURES ========================
// Called from initApp() after all data is loaded
function wireNewFeatures(){
    // Check for join links (needs groups to be loaded first)
    checkJoinLink();
    // Daily login reward (delayed to not block UI)
    setTimeout(checkDailyLoginReward,2000);
    // Push notifications
    initPushNotifications();
    // Cache feed data after load
    cacheFeedData();
    // Init your profile music (background song)
    initMyProfileMusic();
    // Load and render gamification features
    loadDailyQuests();
    // Show panels (unhide them after data loads)
    var _qp=document.getElementById('questPanel');if(_qp) _qp.style.display='';
    var _cgb=document.getElementById('coinGoalBar');if(_cgb) _cgb.style.display='';
    var _fsb=document.getElementById('featuredSkinBanner');if(_fsb) _fsb.style.display='';
    renderCoinGoalBar();
    renderFeaturedSkin();
    // Show PWA install banner on mobile (delayed so it doesn't compete with daily reward)
    setTimeout(showPwaInstallBanner,4000);
}

});

