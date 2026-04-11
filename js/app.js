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
// Unified text rendering: escape + mentions + hashtags + links + rich text
function renderPostText(text){return renderRichText(linkifyText(renderMentionsInText(escapeHtmlNl(text))));}
function renderPlainText(text){return renderMentionsInText(escapeHtmlNl(text));}
function showErrorToast(e){showToast('Error: '+((e&&e.message)||'Something went wrong'));}

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
    // Load all state from Supabase (sole source of truth)
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

// Persist state to Supabase (sole source of truth)
function saveState(){
    if(!currentUser) return;
    syncSkinDataToSupabase();
}
var _skinSyncTimer=null;
var _pvRealSkin=null; // stores our real skin values while viewing another profile
function _buildSkinData(){
    // Use real values if viewing another profile (state is mutated with their skin)
    var r=_pvRealSkin||{};
    return {
        activeSkin:(_pvRealSkin?r.skin:state.activeSkin)||null,
        activePremiumSkin:(_pvRealSkin?r.premiumSkin:state.activePremiumSkin)||null,
        activeFont:(_pvRealSkin?r.font:state.activeFont)||null,
        activeTemplate:(_pvRealSkin?r.tpl:state.activeTemplate)||null,
        activeNavStyle:state.activeNavStyle||null,
        activeIconSet:state.activeIconSet||null,
        activeLogo:state.activeLogo||null,
        activeCoinSkin:state.activeCoinSkin||null,
        premiumBgUrl:(_pvRealSkin?_pvRealSkin.bgImage:premiumBgImage)||null,
        premiumBgOverlay:(_pvRealSkin?_pvRealSkin.bgOverlay:premiumBgOverlay)||0,
        premiumBgDarkness:(_pvRealSkin?_pvRealSkin.bgDarkness:premiumBgDarkness)||0,
        premiumCardTransparency:(_pvRealSkin?_pvRealSkin.cardTrans:premiumCardTransparency)!=null?(_pvRealSkin?_pvRealSkin.cardTrans:premiumCardTransparency):0.1,
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
        earnedBadges:(currentUser&&currentUser.skin_data&&currentUser.skin_data.earnedBadges)||{},
        mutedUsers:mutedUsers||{},
        notifPrefs:_notifPrefs||{},
        closeFriends:_closeFriends||{},
        postReactions:_postReactions||{},
        postViews:_postViews||{},
        streaks:_streaks||{},
        dailyCoinCounts:_dailyCoinCounts||{},
        pinnedComments:_pinnedComments||{},
        scheduledPosts:_scheduledPosts||[],
        gcLockedChannels:_gcLockedChannels||{},
        gcChatMods:_gcChatMods||{},
        groupDms:_groupDms||[],
        msgReactions:_msgReactions||{},
        pollMyVotes:_pollMyVotes||{},
        pollVoteCounts:_pollVoteCounts||{},
        tosAcceptedVersion:_tosAccepted?TOS_VERSION:((currentUser&&currentUser.skin_data&&currentUser.skin_data.tosAcceptedVersion)||0),
        tutorialsSeen:_tutorialsSeen||{},
        infinityCoins:(currentUser&&currentUser.skin_data&&currentUser.skin_data.infinityCoins)||false
    };
}
function syncSkinDataToSupabase(immediate){
    if(!currentUser) return;
    // Never sync while viewing another profile or group — state contains their skin, not ours
    if(_pvSaved||_gvSaved) return;
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
        if(sd.settings.musicVolume!=null){settings.musicVolume=sd.settings.musicVolume;_gmpBaseVol=sd.settings.musicVolume;var _vs=document.getElementById('gmpVolume');if(_vs)_vs.value=Math.round(_gmpBaseVol*100);}
        if(sd.settings.musicMuted!==undefined){settings.musicMuted=!!sd.settings.musicMuted;var _mb=document.getElementById('gmpMuteBtn');if(_mb)_mb.innerHTML=settings.musicMuted?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';}
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
    if(sd.closeFriends&&typeof sd.closeFriends==='object') _closeFriends=sd.closeFriends;
    if(sd.postReactions&&typeof sd.postReactions==='object') _postReactions=sd.postReactions;
    if(sd.postViews&&typeof sd.postViews==='object') _postViews=sd.postViews;
    if(sd.streaks&&typeof sd.streaks==='object') _streaks=sd.streaks;
    if(sd.dailyCoinCounts&&typeof sd.dailyCoinCounts==='object') _dailyCoinCounts=sd.dailyCoinCounts;
    if(sd.pinnedComments&&typeof sd.pinnedComments==='object') _pinnedComments=sd.pinnedComments;
    if(Array.isArray(sd.scheduledPosts)) _scheduledPosts=sd.scheduledPosts;
    if(sd.gcLockedChannels&&typeof sd.gcLockedChannels==='object') _gcLockedChannels=sd.gcLockedChannels;
    if(sd.gcChatMods&&typeof sd.gcChatMods==='object') _gcChatMods=sd.gcChatMods;
    if(Array.isArray(sd.groupDms)) _groupDms=sd.groupDms;
    if(sd.msgReactions&&typeof sd.msgReactions==='object') _msgReactions=sd.msgReactions;
    if(sd.pollMyVotes&&typeof sd.pollMyVotes==='object') _pollMyVotes=sd.pollMyVotes;
    if(sd.pollVoteCounts&&typeof sd.pollVoteCounts==='object') _pollVoteCounts=sd.pollVoteCounts;
    if(sd.settings&&sd.settings.messagePrivacy) settings.messagePrivacy=sd.settings.messagePrivacy;
    // infinityCoins only checked via currentUser.skin_data (server truth)
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
        currentUser.skin_data=sd; // update server truth for _hasInfinity() etc.
        _applySkinDataFromCache(sd);
    }catch(e){console.warn('Load skin data from Supabase:',e);}
}
// loadState removed — all state loaded from Supabase
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
        } else if(_pvSaved){
            // On someone's profile — don't reapply own skin (would overwrite viewed person's)
            loadSkinDataFromSupabase().then(function(){saveState();});
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
// getPersonGroupRole removed — always returned 'Member', inlined at call site
function roleRank(role){ return role==='Admin'?4:role==='Co-Admin'?3:role==='Moderator'?2:1; }
function canManageGroupSkins(group){
    if(!currentUser) return false;
    if(group.owner&&group.owner.id===currentUser.id) return true;
    // Use permissions system if available
    if(window._activeGroupPerms&&window._activeGroupPerms.canManageShop) return true;
    return false;
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
    {id:'pastel',name:'Pastel Dream',desc:'Soft candy pastels with flowing gradient movement. Sweet and dreamy.',price:75,preview:'linear-gradient(135deg,#fbc2eb,#a6c1ee,#fdcbf1,#e6dee9)',cardBg:'#fef5ff',cardText:'#7b4a8e',cardMuted:'#b07cc3'},
    {id:'volcanic',name:'Volcanic Ash',desc:'Deep charcoal with molten lava cracks. Raw and powerful.',price:75,preview:'linear-gradient(135deg,#2c2c2c,#4a1a00)',cardBg:'#1e1e1e',cardText:'#f0c040',cardMuted:'#b08030'},
    {id:'lavender',name:'Lavender Fields',desc:'Soothing lavender purple. Calm and serene.',price:75,preview:'linear-gradient(135deg,#9b72cf,#c4a7e7)',cardBg:'#f5f0ff',cardText:'#5b3a8a',cardMuted:'#9b72cf'},
    {id:'coral',name:'Coral Reef',desc:'Vibrant coral and warm sand tones. Tropical and lively.',price:75,preview:'linear-gradient(135deg,#ff6f61,#ff9a76)',cardBg:'#fff5f2',cardText:'#cc4a3a',cardMuted:'#ff6f61'},
    {id:'graphite',name:'Graphite',desc:'Matte dark gray with cool blue undertones. Stealth mode.',price:75,preview:'linear-gradient(135deg,#2d3436,#636e72)',cardBg:'#2d3436',cardText:'#dfe6e9',cardMuted:'#b2bec3'},
    {id:'honeycomb',name:'Honeycomb',desc:'Rich amber and warm honey gold. Sweet sophistication.',price:75,preview:'linear-gradient(135deg,#f0a500,#cf7500)',cardBg:'#fff8e7',cardText:'#8a5a00',cardMuted:'#c08a20'},
    {id:'bubblegum',name:'Bubblegum Pop',desc:'Hot pink and magenta. Bold, loud, and unapologetic.',price:75,preview:'linear-gradient(135deg,#ff1493,#ff69b4)',cardBg:'#fff0f6',cardText:'#c71585',cardMuted:'#e0559a'},
    {id:'dusk',name:'Dusk',desc:'Twilight sky gradient. Deep navy fading into warm rose.',price:75,preview:'linear-gradient(135deg,#141e30,#6b2fa0,#c94b4b)',cardBg:'#1a1a2e',cardText:'#e8c4f0',cardMuted:'#a07bc0'},
    {id:'mint',name:'Mint Chip',desc:'Cool mint green with dark chocolate accents. Fresh and clean.',price:75,preview:'linear-gradient(135deg,#00b894,#55efc4)',cardBg:'#f0fff4',cardText:'#00805a',cardMuted:'#00b894'},
    {id:'sandstone',name:'Sandstone',desc:'Warm desert sand and terracotta. Earthy and grounded.',price:75,preview:'linear-gradient(135deg,#c2956a,#8b6914)',cardBg:'#fdf5e6',cardText:'#7a5230',cardMuted:'#b8860b'},
    {id:'steel',name:'Steel Blue',desc:'Industrial blue-gray. Sturdy and dependable.',price:75,preview:'linear-gradient(135deg,#4682b4,#2c5f8a)',cardBg:'#eef3f8',cardText:'#2c5f8a',cardMuted:'#4682b4'}
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
    {id:'monoton',name:'Monoton',desc:'Neon outline glow.',price:25,family:'Monoton',scale:.68},
    {id:'comfortaa',name:'Comfortaa',desc:'Rounded geometric modern.',price:25,family:'Comfortaa'},
    {id:'lobster',name:'Lobster',desc:'Bold flowing script.',price:25,family:'Lobster',scale:.88},
    {id:'cinzel',name:'Cinzel',desc:'Ancient Roman elegance.',price:25,family:'Cinzel',scale:.9},
    {id:'chakrapetch',name:'Chakra Petch',desc:'Angular Thai-tech fusion.',price:25,family:'Chakra Petch'},
    {id:'fredoka',name:'Fredoka',desc:'Chunky bubbly rounded.',price:25,family:'Fredoka'},
    {id:'oxanium',name:'Oxanium',desc:'Hexagonal sci-fi geometry.',price:25,family:'Oxanium',scale:.92},
    {id:'gloriahallelujah',name:'Gloria Hallelujah',desc:'Messy notebook scrawl.',price:25,family:'Gloria Hallelujah',scale:.78},
    {id:'doto',name:'Doto',desc:'Dot-matrix printer style.',price:25,family:'Doto',scale:.82},
    {id:'jersey10',name:'Jersey 10',desc:'Sports jersey numbers.',price:25,family:'Jersey 10',scale:.85},
    {id:'creepster',name:'Creepster',desc:'Horror movie dripping text.',price:25,family:'Creepster',scale:.82}
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
    {id:'galaxy',name:'Galaxy',desc:'Cosmic stardust energy.',price:35,text:'\uD83C\uDF0CBlipVibe'},
    {id:'dragon',name:'Dragon',desc:'Fierce mythical power.',price:35,text:'\uD83D\uDC09BlipVibe'},
    {id:'wings',name:'Wings',desc:'Angelic and free.',price:35,text:'\uD83E\uDEB6BV\uD83E\uDEB6'},
    {id:'dice',name:'Dice',desc:'Roll the vibes.',price:35,text:'\uD83C\uDFB2BlipVibe'},
    {id:'lotus',name:'Lotus',desc:'Zen peace and balance.',price:35,text:'\uD83E\uDEB7BlipVibe\uD83E\uDEB7'},
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
    {id:'minimal',name:'Minimal',desc:'Clean simple outlines.',price:35,preview:'linear-gradient(135deg,#e0e0e0,#9e9e9e)',icons:{home:'fa-circle',groups:'fa-circle-nodes',skins:'fa-circle-half-stroke',profiles:'fa-circle-user',shop:'fa-circle-dot',messages:'fa-circle-question',notifications:'fa-circle-exclamation',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment',share:'fa-up-right-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-bookmark',heart:'fa-heart'}},
    {id:'magic',name:'Magic',desc:'Wizards and spellcasting.',price:35,preview:'linear-gradient(135deg,#6c3483,#1a5276)',icons:{home:'fa-hat-wizard',groups:'fa-wand-sparkles',skins:'fa-book-open',profiles:'fa-hand-sparkles',shop:'fa-cauldron',messages:'fa-scroll',notifications:'fa-burst',like:'fa-hand-sparkles',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-nodes',search:'fa-eye',edit:'fa-wand-magic',bookmark:'fa-book',heart:'fa-fire'}},
    {id:'steampunk',name:'Steampunk',desc:'Victorian gears and brass.',price:35,preview:'linear-gradient(135deg,#8B6914,#CD853F)',icons:{home:'fa-gear',groups:'fa-gears',skins:'fa-wrench',profiles:'fa-user-gear',shop:'fa-toolbox',messages:'fa-envelope-open',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-link',search:'fa-magnifying-glass',edit:'fa-screwdriver-wrench',bookmark:'fa-key',heart:'fa-cog'}},
    {id:'cute',name:'Cute Animals',desc:'Adorable kawaii critters.',price:35,preview:'linear-gradient(135deg,#fdcb6e,#e17055)',icons:{home:'fa-paw',groups:'fa-kiwi-bird',skins:'fa-feather',profiles:'fa-hippo',shop:'fa-bone',messages:'fa-dove',notifications:'fa-crow',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen',bookmark:'fa-horse',heart:'fa-cat'}},
    {id:'travel',name:'Travel',desc:'Globetrotter adventure icons.',price:35,preview:'linear-gradient(135deg,#2980b9,#27ae60)',icons:{home:'fa-plane',groups:'fa-earth-americas',skins:'fa-map',profiles:'fa-passport',shop:'fa-suitcase',messages:'fa-envelope',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-location-dot',edit:'fa-pen',bookmark:'fa-map-pin',heart:'fa-location-crosshairs'}},
    {id:'royal',name:'Royal',desc:'Crown jewels and nobility.',price:35,preview:'linear-gradient(135deg,#d4af37,#800020)',icons:{home:'fa-crown',groups:'fa-chess-king',skins:'fa-gem',profiles:'fa-chess-queen',shop:'fa-ring',messages:'fa-scroll',notifications:'fa-bell',like:'fa-thumbs-up',dislike:'fa-thumbs-down',comment:'fa-comment-dots',share:'fa-share-from-square',search:'fa-magnifying-glass',edit:'fa-pen-fancy',bookmark:'fa-chess-rook',heart:'fa-crown'}},
    {id:'heaven',name:'Heavenly',desc:'Divine celestial icons from above.',price:35,preview:'linear-gradient(135deg,#1a3a5c,#d4af37,#87ceeb)',icons:{home:'fa-cloud-sun',groups:'fa-hands-praying',skins:'fa-sun',profiles:'fa-user',shop:'fa-dove',messages:'fa-feather',notifications:'fa-bell',like:'fa-hand-holding-heart',dislike:'fa-hand',comment:'fa-cloud',share:'fa-wind',search:'fa-eye',edit:'fa-wand-sparkles',bookmark:'fa-star',heart:'fa-cross'}}
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
    {id:'snowflake',name:'Snowflake',desc:'Frosty ice coins.',price:50,icon:'fa-snowflake',color:'#74b9ff'},
    {id:'skull',name:'Skull',desc:'Dark and deadly coins.',price:50,icon:'fa-skull',color:'#a0a0a0'},
    {id:'feather',name:'Feather',desc:'Light as air coins.',price:50,icon:'fa-feather',color:'#dfe6e9'},
    {id:'sun',name:'Sun',desc:'Radiant solar coins.',price:50,icon:'fa-sun',color:'#f9ca24'},
    {id:'music',name:'Music Note',desc:'Melodic rhythm coins.',price:50,icon:'fa-music',color:'#e91e63'},
    {id:'clover',name:'Clover',desc:'Lucky four-leaf coins.',price:50,icon:'fa-clover',color:'#2ecc71'},
    {id:'halo',name:'Halo',desc:'Divine golden halo coins.',price:50,icon:'fa-circle-notch',color:'#f5e6a3'}
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
    {id:'wheel',name:'Wheel',desc:'Swipeable mobile carousel. Center icon scales up like a wheel.',price:60,preview:'linear-gradient(135deg,#7c4dff,#448aff)'},
    {id:'tabs',name:'Tabs',desc:'Browser-style tabs. Each page is its own tab with close buttons.',price:60,preview:'linear-gradient(135deg,#546e7a,#37474f)'},
    {id:'wave',name:'Wave',desc:'Curved wavy navbar with flowing shape. Organic and unique.',price:60,preview:'linear-gradient(135deg,#00b4d8,#0077b6)'}
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
    {id:'deep-wave',name:'Deep Wave',desc:'Neon Wave turned down. Same mint and purple, darker and moodier.',price:300,preview:'linear-gradient(135deg,#007a5e,#4a1a8a)',border:'conic-gradient(from 0deg,#00f5a0,#00d9f5,#7b2ff7,#f500e5,#00f5a0)',icon:'fa-water',iconColor:'#00c088',accent:'#00c088',accentHover:'#009968',dark:true,cardBg:'#0d0a2a',cardText:'#00f5a0',cardMuted:'#7b2ff7'},
    {id:'heavens-light',name:"Heaven's Light",desc:'Divine celestial radiance. Golden wings and heavenly clouds.',price:300,preview:'linear-gradient(135deg,#1a3a5c,#d4af37,#87ceeb)',border:'conic-gradient(from 0deg,#d4af37,#f5e6a3,#87ceeb,#ffffff,#d4af37)',icon:'fa-dove',iconColor:'#f5e6a3',accent:'#d4af37',accentHover:'#b8960f',dark:false,cardBg:'#f0f4f8',cardText:'#2c3e50',cardMuted:'#7f8c8d'}
];

var guildSkins = [];

var gfLink=document.createElement('link');gfLink.rel='stylesheet';gfLink.href='https://fonts.googleapis.com/css2?family=Orbitron&family=Rajdhani&family=Quicksand&family=Pacifico&family=Baloo+2&family=Playfair+Display&family=Space+Grotesk&family=Caveat&family=Archivo&family=Silkscreen&family=Press+Start+2P&family=Righteous&family=Satisfy&family=Bungee&family=Monoton&family=Comfortaa&family=Lobster&family=Cinzel&family=Chakra+Petch&family=Fredoka&family=Oxanium&family=Gloria+Hallelujah&family=Doto&family=Jersey+10&family=Creepster&display=swap';document.head.appendChild(gfLink);


// ======================== SHARED UI HELPERS ========================
// Like/dislike display update — used by all 4 like handler locations
function updateLikeDisplay(btn,liked,count){
    if(liked){
        btn.classList.add('liked');
        btn.querySelector('i').className='fas fa-thumbs-up';
        btn.querySelector('.like-count').textContent=count+1;
        animateLikeBtn(btn);
    } else {
        btn.classList.remove('liked');
        btn.querySelector('i').className='far fa-thumbs-up';
        btn.querySelector('.like-count').textContent=Math.max(0,count-1);
    }
}
function updateDislikeDisplay(btn,disliked,count){
    if(disliked){
        btn.classList.add('disliked');
        btn.querySelector('i').className='fas fa-thumbs-down';
        btn.querySelector('.dislike-count').textContent=count+1;
    } else {
        btn.classList.remove('disliked');
        btn.querySelector('i').className='far fa-thumbs-down';
        btn.querySelector('.dislike-count').textContent=Math.max(0,count-1);
    }
}
// Clear the opposite reaction (like clears dislike, dislike clears like)
function clearOppositeReaction(btn,type){
    var container=btn.closest('.action-left')||btn.closest('.post-actions');
    if(!container) return;
    var opposite=type==='like'?container.querySelector('.dislike-btn'):container.querySelector('.like-btn');
    if(!opposite) return;
    var pid=btn.getAttribute('data-post-id');
    if(type==='like'&&state.dislikedPosts[pid]){
        delete state.dislikedPosts[pid];
        updateDislikeDisplay(opposite,false,parseInt(opposite.querySelector('.dislike-count').textContent));
    } else if(type==='dislike'&&state.likedPosts[pid]){
        delete state.likedPosts[pid];
        updateLikeDisplay(opposite,false,parseInt(opposite.querySelector('.like-count').textContent));
    }
}
// Follow button display update — used by all follow handler locations
function updateFollowBtn(btn,isFollowing){
    if(!btn) return;
    var isSmall=btn.classList.contains('follow-btn-small');
    if(isFollowing){
        btn.classList.add('followed','btn-disabled');
        btn.classList.remove('btn-primary');
        btn.innerHTML=isSmall?'<i class="fas fa-check"></i>':'<i class="fas fa-check"></i> Following';
    } else {
        btn.classList.remove('followed','btn-disabled');
        btn.classList.add('btn-primary');
        btn.innerHTML=isSmall?'<i class="fas fa-plus"></i>':'<i class="fas fa-plus"></i> Follow';
    }
}

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
        // Keep _pvSaved set to block syncs until restore completes
        applyPremiumSkin(null,true);
        applySkin(null,true);
        _pvRealSkin=null;
        loadSkinDataFromSupabase().then(function(){
            _pvSaved=null; // only clear AFTER server data is loaded
            reapplyCustomizations();
        }).catch(function(){_pvSaved=null;_pvRealSkin=null;});
    }
    // Clear active group context when leaving group view
    _activeGroupId=null;
    _cleanupGroupChat(true);
    // Restore user's skin when leaving group view
    if(_gvSaved){
        // Restore from Supabase (source of truth) — don't trust local backup
        applyPremiumSkin(null,true);
        applySkin(null,true);
        _pvRealSkin=null;
        loadSkinDataFromSupabase().then(function(){
            _gvSaved=null;
            reapplyCustomizations();
        }).catch(function(){_gvSaved=null;_pvRealSkin=null;});
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
                var short=renderPostText(_ws[0]);
                var rest=_ws[1]?renderPostText(_ws[1]):'';
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
// Server-side coin rewards — all earning goes through Supabase RPC
// Returns true if coins were awarded (for UI animation), false if capped/duplicate
async function _earnCoins(type,amount,refId){
    if(!currentUser) return false;
    if(isOwnPost&&refId&&isOwnPost(refId)) return false; // no coins for own content
    try{
        var result=await sbAwardCoins(type,amount,refId||null);
        if(result&&result.success){
            state.coins=result.balance;currentUser.coin_balance=result.balance;
            updateCoins();
            return true;
        }
    }catch(e){console.warn('Coin award error:',e);}
    return false;
}
// Legacy wrapper — returns true optimistically for UI, server validates async
function _incrementDailyCoin(type){return true;}

// Check if user has infinity status (early adopter)
function _hasInfinity(){
    if(!currentUser) return false;
    // Only trust server-loaded skin_data — never trust client state
    var sd=currentUser.skin_data;
    if(sd&&sd.infinityCoins) return true;
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
    if(btn){if(btn.disabled) return; btn.disabled=true;}
    if(!currentUser) return;
    try {
        if(state.followedUsers[userId]){
            await sbUnfollow(currentUser.id, userId);
            delete state.followedUsers[userId];
            state.following--;
            updateFollowBtn(btn,false);
            // Notify the person being unfollowed
            var myName=currentUser.display_name||currentUser.username||'Someone';
            sbCreateNotification(userId,'follow',myName+' unfollowed you','',{originalType:'follow',follower_id:currentUser.id}).catch(function(e){console.error('Unfollow notif error:',e);});
        } else {
            await sbFollow(currentUser.id, userId);
            state.followedUsers[userId]=true;
            state.following++;
            trackQuestProgress('follow');
            updateFollowBtn(btn,true);
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
    if(btn) btn.disabled=false;
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
            html+='<p style="font-size:13px;">'+renderPlainText(fp.text)+'</p>';
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
                _earnCoins('post',5);
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
            _earnCoins('post',5);
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
        h+='<p class="comment-text" style="font-size:13px;color:#555;margin-top:2px;">'+replyTag+renderPlainText(text)+'</p>';
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
        postEmbed+='<div class="post-description"><p>'+renderPostText(fp.text)+'</p></div>';
        if(fp.images) postEmbed+=buildMediaGrid(fp.images);
        if(fp.sharedPost){
            var sp=fp.sharedPost;var spAvatar=sp.avatar_url||DEFAULT_AVATAR;
            postEmbed+='<div class="share-preview" style="margin:8px 0;border:1px solid var(--border);border-radius:10px;padding:12px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><img src="'+spAvatar+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;"><strong style="font-size:12px;">'+escapeHtml(sp.name)+'</strong><span style="font-size:11px;color:var(--gray);">'+sp.time+'</span></div><p style="font-size:12px;color:var(--gray);">'+escapeHtmlNl(sp.text)+'</p>';
            if(sp.images&&sp.images.length) postEmbed+='<img src="'+sp.images[0]+'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-top:6px;">';
            postEmbed+='</div>';
        }
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
            if(!isOwnPost(postId)&&!isReplyToSelf){_earnCoins('reply',2,postId).then(function(ok){if(ok)showCoinEarnAnimation(input||document.querySelector('.comment-input'),2);});
                if(_activeGroupId&&canEarnGroupReplyCoin(_activeGroupId,postId)){addGroupCoins(_activeGroupId,2);trackGroupReplyCoin(_activeGroupId,postId);}
            }
            replyTarget=null;_replyTargetAuthorId=null;
            document.getElementById('replyIndicator').style.display='none';
            input.placeholder='Write a comment...';
        }else{
            if(!isOwnPost(postId)){_earnCoins('comment',2,postId).then(function(ok){if(ok)showCoinEarnAnimation(input||document.querySelector('.comment-input'),2);});
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
                if(!isOwn){_earnCoins('commentLike',1,cid);}
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
                if(!isOwn){_earnCoins('commentLike',1,cid);}
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
        var cContent=cGifMatch?'<img src="'+escapeHtml(cGifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy">':'<p style="font-size:12px;color:#555;margin-top:2px;">'+renderPlainText(c.text)+'</p>';
        html+='<div class="inline-comment" data-cid="'+c.cid+'"><img src="'+avatarSrc+'" class="inline-comment-avatar clickable-avatar" data-person-id="'+(c.authorId||'')+'" style="object-fit:cover;cursor:pointer;"><div><div class="inline-comment-bubble"><strong style="font-size:12px;display:block;cursor:pointer;" class="clickable-avatar" data-person-id="'+(c.authorId||'')+'">'+escapeHtml(c.name)+'</strong>'+cContent+'</div><div style="display:flex;gap:10px;margin-top:6px;margin-left:4px;"><button class="inline-comment-like" data-cid="'+c.cid+'" data-aid="'+(c.authorId||'')+'" style="background:none;font-size:11px;color:'+(liked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(liked?'fas':'far')+' fa-thumbs-up"></i>'+lc+'</button><button class="inline-comment-dislike" data-cid="'+c.cid+'" data-aid="'+(c.authorId||'')+'" style="background:none;font-size:11px;color:'+(disliked?'var(--primary)':'#999')+';display:flex;align-items:center;gap:3px;"><i class="'+(disliked?'fas':'far')+' fa-thumbs-down"></i>'+dc+'</button><button class="inline-comment-reply" data-cid="'+c.cid+'" style="background:none;font-size:11px;color:#999;cursor:pointer;"><i class="far fa-comment"></i> Reply</button>'+editBtn+deleteBtn+'</div></div></div>';
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
            var rContent=rGifMatch?'<img src="'+escapeHtml(rGifMatch[1])+'" class="comment-gif" alt="GIF" loading="lazy">':'<p style="font-size:12px;color:#555;margin-top:2px;"><i class="fas fa-reply" style="font-size:9px;color:var(--primary);margin-right:4px;transform:scaleX(-1);"></i><span style="color:var(--primary);font-size:11px;margin-right:3px;">@'+escapeHtml(c.name)+'</span>'+renderPlainText(r.text)+'</p>';
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
                if(!isOwnC){_earnCoins('commentLike',1,cid);}
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
                if(!isOwnC){_earnCoins('commentLike',1,cid);}
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
            btn.addEventListener('click',function(){toggleFollow(btn.dataset.uid,btn);});
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
        btn.addEventListener('click',function(e){e.stopPropagation();toggleFollow(btn.dataset.uid,btn);});
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
    return {html:renderPlainText(content),isMedia:false};
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
// mutedUsers loaded from skin_data via _applySkinDataFromCache
function persistMuted(){saveState();}
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
// _postReactions loaded from skin_data via _applySkinDataFromCache
function toggleReaction(postId,emoji,btn){
    var had=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
    if(_postReactions[postId]===emoji){
        delete _postReactions[postId];
    } else {
        _postReactions[postId]=emoji;
    }
    saveState();
    // Update the react button to show selected emoji or reset to default icon
    if(_postReactions[postId]){
        btn.innerHTML='<span style="font-size:16px;">'+_postReactions[postId]+'</span>';
    } else {
        btn.innerHTML='<i class="far fa-face-smile"></i>';
    }
    // Coin logic: 1 coin for first interaction (like, dislike, or reaction), no extra for additional types
    var has=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
    if(!isOwnPost(postId)&&!had&&has){_earnCoins('postLike',1,postId).then(function(ok){if(ok)showCoinEarnAnimation(btn,1);});}
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
// _closeFriends loaded from skin_data via _applySkinDataFromCache
function persistCloseFriends(){saveState();}
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
// _postViews loaded from skin_data via _applySkinDataFromCache
function trackPostView(postId){
    if(!postId) return;
    if(!_postViews[postId]) _postViews[postId]=0;
    _postViews[postId]++;
    saveState();
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
// _streaks loaded from skin_data via _applySkinDataFromCache
function persistStreaks(){saveState();}
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
// _notifPrefs loaded from skin_data via _applySkinDataFromCache
function persistNotifPrefs(){saveState();}
function isNotifEnabled(type){
    if(_notifPrefs[type]===false) return false;
    return true; // default: all enabled
}

// ======================== WHO CAN MESSAGE ME ========================
// Stored in settings.messagePrivacy: 'everyone' | 'followers' | 'nobody'
// Checked when someone tries to message via startConversation

// ======================== SCHEDULED POSTS ========================
var _scheduledPosts=[];
// _scheduledPosts loaded from skin_data via _applySkinDataFromCache
function persistScheduled(){saveState();}
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
function confirmAdminDeletePost(pid){
    showModal('<div class="modal-header"><h3><i class="fas fa-shield-halved" style="color:#e74c3c;margin-right:8px;"></i>Admin Delete Post</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:var(--gray);text-align:center;margin-bottom:16px;">Delete this post as admin? This cannot be undone.</p><div class="modal-actions"><button class="btn btn-outline modal-close">Cancel</button><button class="btn" id="confirmAdminDeleteBtn" style="background:#e74c3c;color:#fff;">Delete</button></div></div>');
    document.getElementById('confirmAdminDeleteBtn').addEventListener('click',async function(){
        closeModal();
        try{
            await sbAdminDeletePost(pid);
            feedPosts=feedPosts.filter(function(p){return p.idx!==pid;});
            var postEl=document.querySelector('.feed-post[data-post-id="'+pid+'"]')||document.querySelector('.feed-post .like-btn[data-post-id="'+pid+'"]');
            if(postEl){var card=postEl.closest('.feed-post')||postEl.closest('.card');if(card) card.remove();}
            renderFeed(activeFeedTab);
            showToast('Post deleted (admin)');
        }catch(e){
            console.error('Admin delete error:',e);
            showToast('Failed: '+(e.message||'Unknown error'));
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
    var _ws=safeWordSplit(text,160);var short=renderPostText(_ws[0]);var rest=_ws[1]?renderPostText(_ws[1]):'';var hasMore=rest.length>0;
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
                '<video src="" controls playsinline style="display:none;"></video>'+
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
            contentHtml='<p class="lb-comment-text" style="font-size:12px;color:var(--gray,#aaa);margin-top:2px;word-break:break-word;">'+tag+renderPlainText(text)+'</p>';
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

    // Collect image/video srcs from a container (strip #t=0.5 fragment from video thumbnails)
    function cleanSrc(s){return s?s.replace(/#t=[\d.]+$/,''):s;}
    function collect(container){return Array.from(container.querySelectorAll('img,video')).map(function(i){return cleanSrc(i.src);}).filter(Boolean);}

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
                    var startIdx=thumbEl?list.indexOf(cleanSrc(thumbEl.src)):0;
                    if(startIdx<0)startIdx=0;
                    var feedPost=grid.closest('.feed-post');
                    var pid=feedPost?(feedPost.querySelector('.like-btn[data-post-id]')||{}).getAttribute&&feedPost.querySelector('.like-btn[data-post-id]').getAttribute('data-post-id'):null;
                    if(list.length){open(list,startIdx,pid);e.stopPropagation();return;}
                }
            }
        }
        if(t.tagName!=='IMG'&&t.tagName!=='VIDEO')return;
        var clickedSrc=cleanSrc(t.src);
        // Post media grid
        var grid=t.closest('.post-media-grid');
        if(grid){
            var pgid=grid.dataset.pgid;var allMedia=pgid&&window['_media_'+pgid];var list;
            if(allMedia){list=allMedia.map(function(m){return m.src;});}else{list=collect(grid);}
            var feedPost=grid.closest('.feed-post');
            var pid=feedPost?(feedPost.querySelector('.like-btn[data-post-id]')||{}).getAttribute&&feedPost.querySelector('.like-btn[data-post-id]').getAttribute('data-post-id'):null;
            if(list.length){open(list,list.indexOf(clickedSrc),pid);e.stopPropagation();return;}
        }
        // Photo album grid
        var album=t.closest('.photo-album-grid');
        if(album){var list=collect(album);if(list.length){open(list,list.indexOf(clickedSrc));e.stopPropagation();return;}}
        // Photos preview sidebar
        var preview=t.closest('.photos-preview');
        if(preview){var list=collect(preview);if(list.length){open(list,list.indexOf(clickedSrc));e.stopPropagation();return;}}
        // All media modal grid
        var am=t.closest('.all-media-grid');
        if(am){var list=collect(am);if(list.length){open(list,list.indexOf(clickedSrc));e.stopPropagation();return;}}
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
// _pinnedComments loaded from skin_data via _applySkinDataFromCache
function persistPinnedComments(){saveState();}
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
        // Update local coin balance from server truth only
        if(result.new_balance!=null){
            state.coins=result.new_balance;
            currentUser.coin_balance=result.new_balance;
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
    // Protect <a> tags from formatting (URLs contain underscores, asterisks, etc.)
    var links=[];
    text=text.replace(/<a[^>]*>.*?<\/a>/g,function(m){links.push(m);return '\x00LINK'+links.length+'\x00';});
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
    // Restore <a> tags
    text=text.replace(/\x00LINK(\d+)\x00/g,function(_,i){return links[parseInt(i)-1];});
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
var _groupDms=[];
// _groupDms loaded from skin_data via _applySkinDataFromCache
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
            _groupDms.push(gdm);
            saveState();
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

// ======================== GLOBAL CLICKABLE AVATARS ========================
// Delegated handler — any element with .clickable-avatar and data-person-id
document.addEventListener('click',function(e){
    var el=e.target.closest('.clickable-avatar[data-person-id]');
    if(!el) return;
    var uid=el.getAttribute('data-person-id');
    if(!uid||uid==='undefined') return;
    e.stopPropagation();
    sbGetProfile(uid).then(function(p){
        if(p) showProfileView(profileToPerson(p));
    }).catch(function(){});
});

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
// _msgReactions loaded from skin_data via _applySkinDataFromCache
function persistMsgReactions(){saveState();}
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
    // Feed cache disabled — was causing stale avatars and like counts
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

