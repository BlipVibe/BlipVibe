// ============================================================================
// PROFILE MODULE — Profile view, photos, albums, cover photos
// Depends on: app.js globals
// ============================================================================
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
        // Keep _pvSaved set to block syncs until restore completes
        applyPremiumSkin(null,true);
        applySkin(null,true);
        _pvRealSkin=null;
        await loadSkinDataFromSupabase();
        _pvSaved=null; // only clear AFTER server data is loaded
        reapplyCustomizations();
    }
    // Fetch public skin data for other users (skin_data column is revoked from SELECT)
    if(!isMe&&person.id&&!person._skinLoaded){
        try{
            var pubSkin=await sbGetPublicSkinData(person.id);
            if(pubSkin){
                person.skin=pubSkin.activeSkin||person.skin||null;
                person.premiumSkin=pubSkin.activePremiumSkin||person.premiumSkin||null;
                person.font=pubSkin.activeFont||person.font||null;
                person.template=pubSkin.activeTemplate||person.template||null;
                if(pubSkin.premiumBgUrl) person.premiumBg={src:pubSkin.premiumBgUrl,overlay:pubSkin.premiumBgOverlay!=null?pubSkin.premiumBgOverlay:0,darkness:pubSkin.premiumBgDarkness!=null?pubSkin.premiumBgDarkness:0,cardTrans:pubSkin.premiumCardTransparency!=null?pubSkin.premiumCardTransparency:0.1};
                person._skinLoaded=true;
            }
        }catch(e){console.warn('Failed to load public skin data:',e);}
    }
    // Apply viewed person's skin/font/template visually WITHOUT mutating state
    _pvSaved=true; // flag: we're on a profile view, restore from Supabase/cache on exit
    if(!isMe){
        // Save our real values before any visual changes
        _pvRealSkin={premiumSkin:state.activePremiumSkin,skin:state.activeSkin,font:state.activeFont,tpl:state.activeTemplate,bgImage:premiumBgImage,bgOverlay:premiumBgOverlay,bgDarkness:premiumBgDarkness,cardTrans:premiumCardTransparency};
        if(person.premiumSkin){
            applyPremiumSkin(person.premiumSkin,true);
            if(person.premiumBg){premiumBgImage=person.premiumBg.src;premiumBgOverlay=person.premiumBg.overlay!=null?person.premiumBg.overlay:0;premiumBgDarkness=person.premiumBg.darkness!=null?person.premiumBg.darkness:0;premiumCardTransparency=person.premiumBg.cardTrans!=null?person.premiumBg.cardTrans:0.1;}
            else{premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;}
            updatePremiumBg(true);
        } else {
            premiumBgImage=null;updatePremiumBg();
            applySkin(person.skin||null,true);
        }
        applyFont(person.font||null,true);
        applyTemplate(person.template||null,true);
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
                feedHtml+='<img src="'+authorAvatar+'" alt="'+escapeHtml(authorName)+'" class="post-avatar clickable-avatar" data-person-id="'+post.author_id+'" style="cursor:pointer;">';
                feedHtml+='<div class="post-user-info"><div class="post-user-top"><h4 class="post-username clickable-avatar" data-person-id="'+post.author_id+'" style="cursor:pointer;">'+escapeHtml(authorName)+'</h4><span class="post-time">'+postTime+'</span></div></div></div>';
                feedHtml+='<div class="post-description"><p>'+renderPostText(post.content)+'</p></div>';
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
            var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)&&!had&&has){_earnCoins('postLike',1,pid).then(function(ok){if(ok)showCoinEarnAnimation(btn,1);});}
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
            var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)&&!had&&has){_earnCoins('postLike',1,pid).then(function(ok){if(ok)showCoinEarnAnimation(btn,1);});}
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

// ======================== PHOTOS (from app.js) ========================
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

