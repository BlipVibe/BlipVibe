/**
 * stories.js — Stories (24hr Ephemeral) + Emoji Reactions on Posts
 * Extracted from app.js lines 9909-10633
 */
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
            var vid=document.createElement('video');vid.src=URL.createObjectURL(file);vid.muted=true;vid.autoplay=true;vid.loop=true;vid.playsInline=true;vid.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
            // Check duration — if over 30s, show trimmer
            vid.addEventListener('loadedmetadata',function(){
                if(vid.duration>30){
                    // Show trim controls below canvas
                    var trimHtml='<div id="storyVideoTrim" style="background:rgba(139,92,246,.05);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;">';
                    trimHtml+='<p style="font-size:12px;color:var(--gray);margin-bottom:6px;">Video is '+Math.round(vid.duration)+'s — pick a 30-second clip:</p>';
                    trimHtml+='<div style="display:flex;align-items:center;gap:8px;">';
                    trimHtml+='<span style="font-size:11px;color:var(--gray);">Start:</span>';
                    trimHtml+='<input type="range" id="storyTrimSlider" min="0" max="'+Math.floor(vid.duration-30)+'" value="0" style="flex:1;">';
                    trimHtml+='<span id="storyTrimLabel" style="font-size:11px;color:var(--gray);font-family:monospace;min-width:70px;">0:00-0:30</span>';
                    trimHtml+='</div></div>';
                    canvas.insertAdjacentHTML('afterend',trimHtml);
                    vid._trimStart=0;
                    document.getElementById('storyTrimSlider').addEventListener('input',function(){
                        var start=parseInt(this.value);
                        vid._trimStart=start;
                        vid.currentTime=start;
                        var endSec=Math.min(start+30,Math.floor(vid.duration));
                        var sm=Math.floor(start/60),ss=start%60,em=Math.floor(endSec/60),es=endSec%60;
                        document.getElementById('storyTrimLabel').textContent=sm+':'+(ss<10?'0':'')+ss+'-'+em+':'+(es<10?'0':'')+es;
                    });
                }
            });
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
        // Save video trim start if applicable
        var storyVid=canvas.querySelector('video');
        if(storyVid&&storyVid._trimStart) overlayData.push({_videoTrim:true,start:storyVid._trimStart});
        var text='';
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
            html+='<p style="font-size:12px;color:rgba(255,255,255,.8);margin-top:1px;word-break:break-word;">'+renderPlainText(c.content)+'</p></div>';
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
    function closeStoryViewer(skipMusicResume){
        clearTimeout(overlay._timer);
        if(overlay._storyAudio){overlay._storyAudio.pause();overlay._storyAudio=null;}
        overlay.remove();
        renderStoriesBar();
        // Resume global player if it was playing (skip if navigating to profile)
        if(_wasGlobalPlaying&&!skipMusicResume){
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
            '<div class="story-header"><img src="'+avatar+'" class="story-header-avatar clickable-avatar" data-person-id="'+user.id+'" style="cursor:pointer;"><div><strong class="clickable-avatar" data-person-id="'+user.id+'" style="cursor:pointer;">'+escapeHtml(name)+'</strong><span style="font-size:11px;color:rgba(255,255,255,.6);margin-left:6px;">'+time+'</span></div><button class="story-close"><i class="fas fa-times"></i></button></div>'+
            '<div class="story-content">'+mediaHtml+(s.text?'<div class="story-text">'+escapeHtml(s.text)+'</div>':'')+'</div>'+
            '<div class="story-nav"><div class="story-nav-left"></div><div class="story-nav-right"></div></div>'+
            (isOwn?'<div class="story-viewers"><button class="story-viewers-btn"><i class="fas fa-eye"></i> Views</button><button class="story-delete-btn" style="color:#e74c3c;"><i class="fas fa-trash"></i></button></div>':'')+
            (isOwn?'':'<div class="story-input-bar"><div class="story-reactions-row">'+_reactionEmojis.map(function(em){return '<button class="story-react-btn" data-emoji="'+em+'">'+em+'</button>';}).join('')+'</div><input type="text" class="story-comment-input" id="storyCommentInput" placeholder="Send message to '+escapeHtml(name)+'..."><button class="story-send-btn"><i class="fas fa-paper-plane"></i></button></div>');
        // Apply video trim if present
        var _vidTrim=null;
        if(s.text_overlays&&s.text_overlays.length){
            s.text_overlays.forEach(function(o){if(o._videoTrim) _vidTrim=o;});
        }
        var storyVidEl=overlay.querySelector('video.story-media');
        if(storyVidEl&&_vidTrim){
            storyVidEl.currentTime=_vidTrim.start||0;
            // Auto-stop at 30 seconds
            storyVidEl.addEventListener('timeupdate',function(){
                if(storyVidEl.currentTime>=(_vidTrim.start||0)+30){
                    storyVidEl.pause();
                }
            });
        }
        // Render text overlays
        if(s.text_overlays&&s.text_overlays.length){
            var storyContent=overlay.querySelector('.story-content');
            s.text_overlays.forEach(function(o){
                if(o._videoTrim) return; // skip trim metadata
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
        var avatarEl=e.target.closest('.clickable-avatar');
        if(avatarEl&&avatarEl.dataset.personId){
            var uid=avatarEl.dataset.personId;
            closeStoryViewer(true);
            sbGetProfile(uid).then(function(p){if(p)showProfileView(profileToPerson(p));}).catch(function(){});
            return;
        }
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

