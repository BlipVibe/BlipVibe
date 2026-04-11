// ============================================================================
// FEED MODULE — Feed rendering, likes, comments, polls, embeds, post creation
// Depends on: app.js globals
// ============================================================================
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
var _pollMyVotes={};
var _pollVoteCounts={};
// _pollMyVotes and _pollVoteCounts loaded from skin_data via _applySkinDataFromCache
function renderPollInPost(text,postId){
    var match=text.match(/\[poll\](.*?)\[\/poll\]/);
    if(!match) return {text:text,pollHtml:''};
    var cleanText=text.replace(/\n?\[poll\].*?\[\/poll\]/,'').trim();
    var poll;
    try{poll=JSON.parse(match[1]);}catch(e){return {text:cleanText,pollHtml:''};}
    if(!poll||!poll.options) return {text:cleanText,pollHtml:''};
    // Check if user already voted (stored in skin_data)
    var myVote=_pollMyVotes[postId]!=null?String(_pollMyVotes[postId]):null;
    var voted=myVote!==null;
    // Get vote counts from skin_data
    var votes={};var totalVotes=0;
    var stored=_pollVoteCounts[postId]||{};
    votes=stored.votes||{};totalVotes=stored.total||0;
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
            // Save vote to skin_data
            _pollMyVotes[postId]=optIdx;
            if(!_pollVoteCounts[postId]) _pollVoteCounts[postId]={votes:{},total:0};
            _pollVoteCounts[postId].votes[optIdx]=(_pollVoteCounts[postId].votes[optIdx]||0)+1;
            _pollVoteCounts[postId].total=(_pollVoteCounts[postId].total||0)+1;
            saveState();
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
    showFeedSkeleton();
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
    var _ws=safeWordSplit(text,160);var short=renderPostText(_ws[0]);var rest=_ws[1]?renderPostText(_ws[1]):'';var hasMore=rest.length>0;
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
    else if(_isAdmin) html+='<a href="#" data-action="admin-delete" data-pid="'+i+'" style="color:#e74c3c;"><i class="fas fa-shield-halved"></i> Admin Delete</a>';
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
                clearOppositeReaction(btn,'like');
                try {
                    var nowLiked = await sbToggleLike(currentUser.id, 'post', postId);
                    if(nowLiked) {
                        state.likedPosts[postId]=true;
                        updateLikeDisplay(btn,true,count);
                        showCoinEarnAnimation(btn,1);
                        trackQuestProgress('like');
                        var fp=feedPosts.find(function(x){return x.idx===postId;});
                        if(fp&&fp.person&&fp.person.id&&fp.person.id!==currentUser.id){
                            var myName=currentUser.display_name||currentUser.username||'Someone';
                            sbCreateNotification(fp.person.id,'like',myName+' liked your post','',{originalType:'like',post_id:postId}).catch(function(e){console.error('Like notif error:',e);});
                        }
                    } else {
                        delete state.likedPosts[postId];
                        updateLikeDisplay(btn,false,count);
                    }
                } catch(err) { console.error('Like error:', err); }
            } else {
                // Legacy local like
                if(state.likedPosts[postId]){
                    delete state.likedPosts[postId];
                    updateLikeDisplay(btn,false,count);
                } else {
                    clearOppositeReaction(btn,'like');
                    state.likedPosts[postId]=true;
                    updateLikeDisplay(btn,true,count);
                }
            }
            var has=!!(state.likedPosts[postId]||state.dislikedPosts[postId]||_postReactions[postId]);
            if(!isOwnPost(postId)&&!had&&has){_earnCoins('postLike',1,postId).then(function(ok){if(ok)showCoinEarnAnimation(btn,1);});}
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
            if(!isOwnPost(postId)&&!had&&has){_earnCoins('postLike',1,postId).then(function(ok){if(ok)showCoinEarnAnimation(btn,1);});}
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
            else if(action==='admin-delete') confirmAdminDeletePost(pid);
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
function _hideUrlFromText(textEl,url){
    var escaped=escapeHtml(url).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    // Remove the full <a> tag wrapping the URL if linkifyText was used
    textEl.innerHTML=textEl.innerHTML.replace(new RegExp('<a[^>]*>\\s*'+escaped+'\\s*</a>','g'),'');
    // Fallback: remove raw URL text if not wrapped in <a>
    textEl.innerHTML=textEl.innerHTML.replace(new RegExp(escaped,'g'),'');
}
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
            _hideUrlFromText(textEl,url);
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
                    _hideUrlFromText(textEl,url);
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
    // Always start with a clean slate — no draft restoration
    clearDraft();
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
        _earnCoins('post',5);
        trackQuestProgress('post');
        showCoinEarnAnimation(document.getElementById('cpmPublish')||document.getElementById('openPostModal'),5);
        clearDraft(); // Clear draft on successful publish
        closeModal();
        var newPost=container.firstElementChild;
        var likeBtn=newPost.querySelector('.like-btn');
        likeBtn.addEventListener('click',async function(){var countEl=likeBtn.querySelector('.like-count');var count=parseInt(countEl.textContent);var pid=likeBtn.getAttribute('data-post-id');var isUUID=/^[0-9a-f]{8}-/.test(pid);if(state.likedPosts[pid]){delete state.likedPosts[pid];likeBtn.classList.remove('liked');likeBtn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);{}if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e){}};}else{state.likedPosts[pid]=true;likeBtn.classList.add('liked');likeBtn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;if(!isOwnPost(pid)){_earnCoins('postLike',1,pid);}if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e){}}}});
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
    var srcs=list.map(function(m){return m.src;});
    if(srcs.length) window._openLightbox(srcs,startIdx||0);
}

