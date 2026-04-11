// ============================================================================
// GROUPS MODULE — Group view, group chat, group shop, invites
// Depends on: app.js globals
// ============================================================================
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
    var theirRole='Member';
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
            html+='<button class="btn btn-outline" id="grpManagePerms" style="font-size:12px;padding:6px 12px;color:var(--primary);border-color:var(--primary);"><i class="fas fa-sliders"></i> Permissions</button>';
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
    var permsBtn=document.getElementById('grpManagePerms');
    if(permsBtn){permsBtn.addEventListener('click',function(){
        closeModal();showManagePermissionsModal(group,person);
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

function showManagePermissionsModal(group,person){
    var uid=person.id;
    var name=person.name||person.display_name||'User';
    var h='<div class="modal-header"><h3><i class="fas fa-shield-halved" style="color:var(--primary);margin-right:8px;"></i>Permissions: '+escapeHtml(name)+'</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body"><p style="font-size:13px;color:var(--gray);margin-bottom:12px;">Set what this user can do in <strong>'+escapeHtml(group.name)+'</strong>:</p>';
    h+='<div style="margin-bottom:12px;"><label style="font-size:14px;font-weight:600;">Role</label><select id="permRoleSelect" style="display:block;width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;margin-top:4px;background:var(--card);color:var(--dark);"><option value="member">Member</option><option value="moderator">Moderator</option><option value="co-admin">Co-Admin</option></select></div>';
    h+='<div style="display:flex;flex-direction:column;gap:10px;">';
    h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;"><i class="fas fa-store" style="margin-right:8px;color:var(--primary);"></i>Manage Shop (buy/apply skins, fonts, songs)</span><input type="checkbox" id="permShop" style="width:20px;height:20px;"></label>';
    h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;"><i class="fas fa-user-slash" style="margin-right:8px;color:#e74c3c;"></i>Boot/Ban Members</span><input type="checkbox" id="permBoot" style="width:20px;height:20px;"></label>';
    h+='<label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:14px;"><i class="fas fa-comments" style="margin-right:8px;color:#3b82f6;"></i>Manage Chat (channels, moderation)</span><input type="checkbox" id="permChat" style="width:20px;height:20px;"></label>';
    h+='</div>';
    h+='<div class="modal-actions" style="margin-top:16px;"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="savePermsBtn">Save Permissions</button></div></div>';
    showModal(h);
    // Load existing permissions
    sbGetUserGroupPermission(group.id,uid).then(function(perm){
        if(perm){
            document.getElementById('permRoleSelect').value=perm.role||'member';
            document.getElementById('permShop').checked=perm.can_manage_shop;
            document.getElementById('permBoot').checked=perm.can_boot_members;
            document.getElementById('permChat').checked=perm.can_manage_chat;
        }
    }).catch(function(){});
    // Auto-set defaults when role changes
    document.getElementById('permRoleSelect').addEventListener('change',function(){
        var role=this.value;
        if(role==='co-admin'){
            document.getElementById('permBoot').checked=true;
            document.getElementById('permChat').checked=true;
        } else if(role==='moderator'){
            document.getElementById('permBoot').checked=false;
            document.getElementById('permChat').checked=true;
            document.getElementById('permShop').checked=false;
        } else {
            document.getElementById('permShop').checked=false;
            document.getElementById('permBoot').checked=false;
            document.getElementById('permChat').checked=false;
        }
    });
    // Save
    document.getElementById('savePermsBtn').addEventListener('click',async function(){
        var role=document.getElementById('permRoleSelect').value;
        var perms={
            canManageShop:document.getElementById('permShop').checked,
            canBootMembers:document.getElementById('permBoot').checked,
            canManageChat:document.getElementById('permChat').checked
        };
        this.disabled=true;this.textContent='Saving...';
        try{
            if(role==='member'&&!perms.canManageShop&&!perms.canBootMembers&&!perms.canManageChat){
                await sbDeleteGroupPermission(group.id,uid);
            } else {
                await sbSetGroupPermission(group.id,uid,role,perms);
            }
            closeModal();showToast('Permissions updated for '+name);
        }catch(e){showToast('Failed: '+(e.message||'Error'));this.disabled=false;this.textContent='Save Permissions';}
    });
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

    // Load user's permissions for this group
    var _myPerms={role:'member',canManageShop:false,canBootMembers:false,canManageChat:false};
    if(isOwner){
        _myPerms={role:'owner',canManageShop:true,canBootMembers:true,canManageChat:true};
    } else if(currentUser){
        try{
            var perm=await sbGetUserGroupPermission(group.id,currentUser.id);
            if(perm){
                _myPerms.role=perm.role;
                _myPerms.canManageShop=perm.can_manage_shop;
                _myPerms.canBootMembers=perm.can_boot_members;
                _myPerms.canManageChat=perm.can_manage_chat;
            } else {
                // Check if they're a co-admin or mod from the group data
                var myRole=getMyGroupRole(group);
                if(myRole==='Co-Admin'){
                    _myPerms.role='co-admin';_myPerms.canBootMembers=true;_myPerms.canManageChat=true;
                } else if(myRole==='Moderator'){
                    _myPerms.role='moderator';_myPerms.canManageChat=true;
                }
            }
        }catch(e){
            // Permissions table might not exist yet — fallback to old behavior
            var myRole=getMyGroupRole(group);
            if(myRole==='Co-Admin'){_myPerms.role='co-admin';_myPerms.canBootMembers=true;_myPerms.canManageChat=true;_myPerms.canManageShop=true;}
            else if(myRole==='Moderator'){_myPerms.role='moderator';_myPerms.canManageChat=true;}
        }
    }
    // Store permissions for use in other functions
    window._activeGroupPerms=_myPerms;

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
                else if(_isAdmin) feedHtml+='<a href="#" data-action="admin-delete" data-pid="'+p.id+'" style="color:#e74c3c;"><i class="fas fa-shield-halved"></i> Admin Delete</a>';
                feedHtml+='</div>';
                feedHtml+='</div>';
                feedHtml+='<div class="post-description">';
                if(p.content) feedHtml+='<p>'+renderPostText(p.content)+'</p>';
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
    if(isOwner||_myPerms.canManageShop) gvModeHtml+='<button class="search-tab" data-gvmode="shop"><i class="fas fa-store"></i> Group Shop</button>';
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
// _gcLockedChannels loaded from skin_data via _applySkinDataFromCache
function persistGcLocked(){saveState();}

var _gcChatMods={};
// _gcChatMods loaded from skin_data via _applySkinDataFromCache
function persistGcMods(){saveState();}

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
    $$('#gvPostsFeed .like-btn').forEach(function(btn){btn.addEventListener('click',async function(e){var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.like-count');var count=parseInt(countEl.textContent);var isUUID=/^[0-9a-f]{8}-/.test(pid);var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(state.likedPosts[pid]){delete state.likedPosts[pid];btn.classList.remove('liked');btn.querySelector('i').className='far fa-thumbs-up';countEl.textContent=Math.max(0,count-1);if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}else{if(state.dislikedPosts[pid]){var db=btn.closest('.action-left').querySelector('.dislike-btn');var dc=db.querySelector('.dislike-count');dc.textContent=Math.max(0,parseInt(dc.textContent)-1);delete state.dislikedPosts[pid];db.classList.remove('disliked');db.querySelector('i').className='far fa-thumbs-down';}state.likedPosts[pid]=true;btn.classList.add('liked');btn.querySelector('i').className='fas fa-thumbs-up';countEl.textContent=count+1;if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)&&!had&&has){_earnCoins('postLike',1,pid);if(_activeGroupId)addGroupCoins(_activeGroupId,1);}saveState();});});
    $$('#gvPostsFeed .dislike-btn').forEach(function(btn){btn.addEventListener('click',async function(){var pid=btn.getAttribute('data-post-id');var countEl=btn.querySelector('.dislike-count');var count=parseInt(countEl.textContent);var isUUID=/^[0-9a-f]{8}-/.test(pid);var had=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(state.dislikedPosts[pid]){delete state.dislikedPosts[pid];btn.classList.remove('disliked');btn.querySelector('i').className='far fa-thumbs-down';countEl.textContent=Math.max(0,count-1);}else{if(state.likedPosts[pid]){var lb=btn.closest('.action-left').querySelector('.like-btn');var lc=lb.querySelector('.like-count');lc.textContent=Math.max(0,parseInt(lc.textContent)-1);delete state.likedPosts[pid];lb.classList.remove('liked');lb.querySelector('i').className='far fa-thumbs-up';if(isUUID&&currentUser){try{await sbToggleLike(currentUser.id,'post',pid);}catch(e2){}}}state.dislikedPosts[pid]=true;btn.classList.add('disliked');btn.querySelector('i').className='fas fa-thumbs-down';countEl.textContent=count+1;}var has=!!(state.likedPosts[pid]||state.dislikedPosts[pid]);if(!isOwnPost(pid)&&!had&&has){_earnCoins('postLike',1,pid);if(_activeGroupId)addGroupCoins(_activeGroupId,1);}saveState();});});
    $$('#gvPostsFeed .comment-btn').forEach(function(btn){btn.addEventListener('click',function(){var postId=btn.closest('.action-left').querySelector('.like-btn').getAttribute('data-post-id');showComments(postId,btn.querySelector('span'));});});
    // Post menu toggle
    $$('#gvPostsFeed .post-menu-btn').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var menuId=btn.dataset.menu;var menu=document.getElementById(menuId);if(!menu)return;$$('#gvPostsFeed .post-dropdown.show').forEach(function(m){if(m!==menu)m.classList.remove('show');});menu.classList.toggle('show');});});
    // Post dropdown actions
    $$('#gvPostsFeed .post-dropdown a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();a.closest('.post-dropdown').classList.remove('show');var pid=a.dataset.pid;var action=a.dataset.action;if(action==='save') showSaveModal(pid);else if(action==='report') showReportModal(pid);else if(action==='hide'){var postEl=document.querySelector('#gvPostsFeed .feed-post[data-post-id="'+pid+'"]');if(postEl){postEl.style.display='none';showToast('Post hidden');}}else if(action==='edit') showEditGroupPostModal(pid);else if(action==='delete') confirmDeleteGroupPost(pid);else if(action==='admin-delete') confirmAdminDeletePost(pid);});});
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
            _earnCoins('post',5);
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


// ======================== GROUP SHOP (from app.js) ========================
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

    // Server-side group purchase handler
    function _bindGroupBuyBtn(selector,attrName,itemType,ownedMapKey,itemList,nameKey){
        $$(selector).forEach(function(btn){btn.addEventListener('click',async function(){
            var id=btn.getAttribute(attrName);var gid=btn.getAttribute('data-gid');
            var item=itemList.find(function(x){return x.id===id;});
            if(!item) return;
            btn.disabled=true;var origText=btn.textContent;btn.textContent='...';
            try{
                var result=await sbPurchaseGroupItem(gid,itemType,id,item.price);
                if(!result.success){showToast(result.error||'Purchase failed');btn.disabled=false;btn.textContent=origText;return;}
                state.groupCoins[gid]=result.balance;updateGroupCoinDisplay(gid);
                if(!state[ownedMapKey][gid]) state[ownedMapKey][gid]={};
                state[ownedMapKey][gid][id]=true;
                syncGroupSkinData(gid);gShopPurchased(btn);
                addNotification('skin','Group purchased the "'+(item[nameKey]||item.name)+'"!');
            }catch(e){showToast('Purchase failed: '+(e.message||'Error'));btn.disabled=false;btn.textContent=origText;}
        });});
    }
    _bindGroupBuyBtn('#gvShopContent .buy-gskin-btn','data-sid','skin','groupOwnedSkins',skins,'name');
    _bindGroupBuyBtn('#gvShopContent .buy-gspremium-btn','data-pid','premium','groupOwnedPremiumSkins',premiumSkins,'name');

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
    _bindGroupBuyBtn('#gvShopContent .buy-gfont-btn','data-fid','font','groupOwnedFonts',fonts,'name');

    // Font apply handlers
    $$('#gvShopContent .apply-gfont-btn').forEach(function(btn){btn.addEventListener('click',function(){
        var fid=btn.getAttribute('data-fid');var gid=btn.getAttribute('data-gid');
        state.groupActiveFont[gid]=fid;
        applyFont(fid,true);
        renderGroupShop(gid);saveState();syncGroupSkinData(gid);
    });});

    // Group song buy handlers
    _bindGroupBuyBtn('#gvShopContent .buy-gsong-btn','data-song-id','song','groupOwnedSongs',_shopSongs||[],'title');
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
    if(!_gvSaved){
        _gvSaved=true;
        _pvRealSkin={premiumSkin:state.activePremiumSkin,skin:state.activeSkin,font:state.activeFont,tpl:state.activeTemplate,bgImage:premiumBgImage,bgOverlay:premiumBgOverlay,bgDarkness:premiumBgDarkness,cardTrans:premiumCardTransparency};
    }
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
            updatePremiumBg(true);
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

