/**
 * notifications.js — Notifications system (tabs, rendering, mark-read)
 * Extracted from app.js lines 1773-1894
 */
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

