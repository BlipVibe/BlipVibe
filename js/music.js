// ============================================================================
// MUSIC MODULE — Profile music, playlists, global mini player, video pause
// All music-related functionality extracted from app.js
// Depends on: app.js globals (state, settings, currentUser, _shopSongs, etc.)
// ============================================================================
// ======================== PROFILE MUSIC SYSTEM ========================
var _profileAudio=null;
var _myAudio=null; // your own profile song that plays as you browse
var _mySong=null; // your song data
var _viewingSong=null; // the song playing from someone else's profile
var _gmpBaseVol=(settings.musicVolume!=null?settings.musicVolume:0.5);

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
// ======================== PLAYLIST SYSTEM ========================
var _myPlaylist=[]; // array of song objects
var _myPlaylistMode='repeat'; // 'repeat' or 'shuffle'
var _playlistIndex=0;
var _shuffleOrder=[];

async function loadMyPlaylist(){
    if(!currentUser) return;
    try{
        var data=await sbGetProfilePlaylist(currentUser.id);
        if(!data) return;
        var ids=data.profile_playlist||[];
        _myPlaylistMode=data.playlist_mode||'repeat';
        if(!ids.length){_myPlaylist=[];return;}
        // Load song data
        if(!_shopSongs||!_shopSongs.length) await _loadShopSongs();
        _myPlaylist=ids.map(function(id){return (_shopSongs||[]).find(function(s){return s.id===id;});}).filter(Boolean);
        if(_myPlaylist.length) _buildShuffleOrder();
    }catch(e){console.warn('loadMyPlaylist:',e);}
}

function _buildShuffleOrder(){
    _shuffleOrder=_myPlaylist.map(function(_,i){return i;});
    if(_myPlaylistMode==='shuffle'){
        for(var i=_shuffleOrder.length-1;i>0;i--){
            var j=Math.floor(Math.random()*(i+1));
            var tmp=_shuffleOrder[i];_shuffleOrder[i]=_shuffleOrder[j];_shuffleOrder[j]=tmp;
        }
    }
}

function _getPlaylistSong(index){
    if(!_myPlaylist.length) return null;
    var actualIdx=_shuffleOrder[index%_shuffleOrder.length];
    return _myPlaylist[actualIdx]||null;
}

function playPlaylistSong(index){
    if(!_myPlaylist.length) return;
    _playlistIndex=index%_myPlaylist.length;
    var song=_getPlaylistSong(_playlistIndex);
    if(!song) return;
    if(_myAudio){_myAudio.pause();_myAudio=null;}
    _mySong=song;
    _myAudio=new Audio(song.file_url);
    _myAudio.volume=_gmpBaseVol;
    _setupFadeLoop(_myAudio);
    // Override the fade loop's ended handler for playlist advance
    _myAudio.removeEventListener('ended',_myAudio._onEnded);
    _myAudio._onEnded=function(){
        // Advance to next song in playlist
        _playlistIndex++;
        if(_playlistIndex>=_myPlaylist.length){
            _playlistIndex=0;
            if(_myPlaylistMode==='shuffle') _buildShuffleOrder();
        }
        playPlaylistSong(_playlistIndex);
    };
    _myAudio.addEventListener('ended',_myAudio._onEnded);
    _myAudio.loop=false; // we handle looping via playlist
    _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
    showGlobalPlayer();
    _myAudio.volume=0;
    _myAudio.play().then(function(){
        _fadeAudio(_myAudio,0,_gmpBaseVol,500,function(){
            _updateGlobalPlayer(song.title,song.artist||'BlipVibe',true);
        });
    }).catch(function(){});
    // Update shuffle/repeat button
    var shBtn=document.getElementById('gmpShuffleBtn');
    if(shBtn) shBtn.innerHTML=_myPlaylistMode==='shuffle'?'<i class="fas fa-shuffle"></i>':'<i class="fas fa-repeat"></i>';
}

function playNextInPlaylist(){
    if(_myPlaylist.length<=1) return;
    _playlistIndex++;
    if(_playlistIndex>=_myPlaylist.length){_playlistIndex=0;if(_myPlaylistMode==='shuffle') _buildShuffleOrder();}
    playPlaylistSong(_playlistIndex);
}

function playPrevInPlaylist(){
    if(_myPlaylist.length<=1) return;
    _playlistIndex--;
    if(_playlistIndex<0) _playlistIndex=_myPlaylist.length-1;
    playPlaylistSong(_playlistIndex);
}

function togglePlaylistMode(){
    _myPlaylistMode=_myPlaylistMode==='repeat'?'shuffle':'repeat';
    _buildShuffleOrder();
    var shBtn=document.getElementById('gmpShuffleBtn');
    if(shBtn) shBtn.innerHTML=_myPlaylistMode==='shuffle'?'<i class="fas fa-shuffle"></i>':'<i class="fas fa-repeat"></i>';
    showToast(_myPlaylistMode==='shuffle'?'Shuffle on':'Repeat all');
    // Save to DB
    if(currentUser){
        var ids=_myPlaylist.map(function(s){return s.id;});
        sbSetProfilePlaylist(currentUser.id,ids,_myPlaylistMode).catch(function(){});
    }
}

function showPlaylistManager(){
    var h='<div class="modal-header"><h3><i class="fas fa-list" style="color:var(--primary);margin-right:8px;"></i>Profile Playlist</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>';
    h+='<div class="modal-body">';
    h+='<p style="font-size:13px;color:var(--gray);margin-bottom:10px;">Add up to 5 songs. They\'ll play on your profile page.</p>';
    h+='<div class="playlist-manager" id="playlistList"></div>';
    h+='<button class="playlist-add-btn" id="playlistAddBtn"><i class="fas fa-plus" style="margin-right:6px;"></i>Add Song</button>';
    h+='<div class="playlist-mode-toggle"><button class="btn" id="plModeRepeat"><i class="fas fa-repeat"></i> Repeat</button><button class="btn" id="plModeShuffle"><i class="fas fa-shuffle"></i> Shuffle</button></div>';
    h+='<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-outline modal-close">Cancel</button><button class="btn btn-primary" id="savePlaylistBtn">Save Playlist</button></div></div>';
    showModal(h);
    var _plSongs=[].concat(_myPlaylist);
    var _plMode=_myPlaylistMode;
    function renderList(){
        var list=document.getElementById('playlistList');
        if(!list) return;
        if(!_plSongs.length){list.innerHTML='<p style="text-align:center;color:var(--gray);padding:12px;">No songs in playlist.</p>';return;}
        var lh='';
        _plSongs.forEach(function(s,i){
            lh+='<div class="playlist-item"><span class="pi-num">'+(i+1)+'</span><span class="pi-title">'+escapeHtml(s.title)+'</span><button class="pi-remove" data-idx="'+i+'"><i class="fas fa-times"></i></button></div>';
        });
        list.innerHTML=lh;
        list.querySelectorAll('.pi-remove').forEach(function(btn){
            btn.addEventListener('click',function(){_plSongs.splice(parseInt(btn.dataset.idx),1);renderList();});
        });
        // Update add button state
        var addBtn=document.getElementById('playlistAddBtn');
        if(addBtn){addBtn.disabled=_plSongs.length>=5;addBtn.textContent=_plSongs.length>=5?'Maximum 5 songs':'+ Add Song';}
    }
    renderList();
    // Mode toggle
    function updateModeUI(){
        var rBtn=document.getElementById('plModeRepeat');
        var sBtn=document.getElementById('plModeShuffle');
        if(rBtn) rBtn.className='btn '+(_plMode==='repeat'?'btn-primary':'btn-outline');
        if(sBtn) sBtn.className='btn '+(_plMode==='shuffle'?'btn-primary':'btn-outline');
    }
    updateModeUI();
    document.getElementById('plModeRepeat').addEventListener('click',function(){_plMode='repeat';updateModeUI();});
    document.getElementById('plModeShuffle').addEventListener('click',function(){_plMode='shuffle';updateModeUI();});
    // Add song
    document.getElementById('playlistAddBtn').addEventListener('click',async function(){
        if(_plSongs.length>=5){showToast('Maximum 5 songs');return;}
        if(!_shopSongs||!_shopSongs.length) await _loadShopSongs();
        var owned=(_shopSongs||[]).filter(function(s){return _shopOwnedSongs&&_shopOwnedSongs[s.id];});
        // Filter out songs already in playlist
        var inPl={};_plSongs.forEach(function(s){inPl[s.id]=true;});
        var available=owned.filter(function(s){return !inPl[s.id];});
        if(!available.length){showToast(owned.length?'All owned songs already in playlist':'No songs owned yet — buy songs from the Shop!');return;}
        var sh='<div style="max-height:200px;overflow-y:auto;">';
        available.forEach(function(s){
            sh+='<div class="song-picker-item pl-add-song" data-sid="'+s.id+'" style="cursor:pointer;padding:8px;"><i class="fas fa-music" style="color:var(--primary);margin-right:8px;"></i>'+escapeHtml(s.title)+'</div>';
        });
        sh+='</div>';
        var list=document.getElementById('playlistList');
        list.innerHTML=sh;
        list.querySelectorAll('.pl-add-song').forEach(function(el){
            el.addEventListener('click',function(){
                var sid=el.dataset.sid;
                var song=(_shopSongs||[]).find(function(s){return s.id===sid;});
                if(song) _plSongs.push(song);
                renderList();
            });
        });
    });
    // Save
    document.getElementById('savePlaylistBtn').addEventListener('click',async function(){
        this.disabled=true;this.textContent='Saving...';
        try{
            var ids=_plSongs.map(function(s){return s.id;});
            await sbSetProfilePlaylist(currentUser.id,ids,_plMode);
            _myPlaylist=_plSongs;
            _myPlaylistMode=_plMode;
            _playlistIndex=0;
            _buildShuffleOrder();
            if(_myPlaylist.length) playPlaylistSong(0);
            closeModal();showToast('Playlist saved!');
        }catch(e){showToast('Failed: '+(e.message||'Error'));this.disabled=false;this.textContent='Save Playlist';}
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
    if(!currentUser) return;
    // Try playlist first, fall back to single song
    try{
        await loadMyPlaylist();
        if(_myPlaylist.length){
            _playlistIndex=0;
            var song=_getPlaylistSong(0);
            if(song){
                _mySong=song;
                _myAudio=new Audio(song.file_url);
                _myAudio.volume=_gmpBaseVol;
                _myAudio.loop=false;
                _myAudio._onEnded=function(){_playlistIndex++;if(_playlistIndex>=_myPlaylist.length){_playlistIndex=0;if(_myPlaylistMode==='shuffle')_buildShuffleOrder();}playPlaylistSong(_playlistIndex);};
                _myAudio.addEventListener('ended',_myAudio._onEnded);
                _updateGlobalPlayer(song.title,song.artist||'BlipVibe',false);
                showGlobalPlayer();
                var shBtn=document.getElementById('gmpShuffleBtn');
                if(shBtn) shBtn.innerHTML=_myPlaylistMode==='shuffle'?'<i class="fas fa-shuffle"></i>':'<i class="fas fa-repeat"></i>';
                return;
            }
        }
    }catch(e){console.warn('[Music] playlist load error:',e);}
    // Fallback to single song
    if(!currentUser.profile_song_id) return;
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
    if(volSlider){
        volSlider.value=Math.round(_gmpBaseVol*100);
        volSlider.addEventListener('input',function(){
            _gmpBaseVol=this.value/100;
            settings.musicVolume=_gmpBaseVol;
            var audio=_getCurrentAudio();
            if(audio) audio.volume=_gmpBaseVol;
            saveState();
        });
    }
    if(muteBtn) muteBtn.addEventListener('click',function(){
        var audio=_getCurrentAudio();
        if(!audio) return;
        audio.muted=!audio.muted;
        settings.musicMuted=audio.muted;
        muteBtn.innerHTML=audio.muted?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';
        saveState();
    });
    if(closeBtn) closeBtn.addEventListener('click',function(){hideGlobalPlayer();});
    var navMusicBtn=document.getElementById('navMusicBtn');
    if(navMusicBtn) navMusicBtn.addEventListener('click',function(){reopenGlobalPlayer();});
    var prevBtn=document.getElementById('gmpPrevBtn');
    if(prevBtn) prevBtn.addEventListener('click',function(){playPrevInPlaylist();});
    var nextBtn=document.getElementById('gmpNextBtn');
    if(nextBtn) nextBtn.addEventListener('click',function(){playNextInPlaylist();});
    var shuffleBtn=document.getElementById('gmpShuffleBtn');
    if(shuffleBtn) shuffleBtn.addEventListener('click',function(){togglePlaylistMode();});
})();
// Auto-start music after first user interaction on the page
var _musicAutoStarted=false;
function _tryAutoStartMusic(){
    if(_musicAutoStarted) return;
    // Only auto-start the CORRECT audio: profile audio if viewing someone, otherwise your own
    var audio=_viewingSong?_profileAudio:_myAudio;
    if(!audio||!audio.paused) return;
    _musicAutoStarted=true;
    audio.volume=0;
    audio.play().then(function(){
        _fadeAudio(audio,0,_gmpBaseVol,800,null);
        var songName=_viewingSong?_viewingSong.title:(_mySong?_mySong.title:'');
        var songArtist=_viewingSong?(_viewingSong.artist||'BlipVibe'):(_mySong?(_mySong.artist||'BlipVibe'):'BlipVibe');
        _updateGlobalPlayer(songName,songArtist,true);
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

// ======================== PAUSE PROFILE MUSIC WHEN VIDEOS PLAY ========================
var _musicPausedForVideo=false;
// Direct <video> elements: pause music on play, resume on pause/ended
document.addEventListener('play',function(e){
    if(e.target.tagName!=='VIDEO') return;
    // Don't pause for muted thumbnail previews
    if(e.target.muted&&!e.target.controls) return;
    var audio=_getCurrentAudio();
    if(audio&&!audio.paused){
        _musicPausedForVideo=true;
        _fadeAudio(audio,audio.volume,0,300,function(){audio.pause();});
    }
},true);
document.addEventListener('pause',function(e){
    if(e.target.tagName!=='VIDEO'||!_musicPausedForVideo) return;
    _resumeMusicAfterVideo();
},true);
document.addEventListener('ended',function(e){
    if(e.target.tagName!=='VIDEO'||!_musicPausedForVideo) return;
    _resumeMusicAfterVideo();
},true);
function _resumeMusicAfterVideo(){
    // Check no other videos are still playing
    var anyPlaying=Array.from(document.querySelectorAll('video')).some(function(v){return !v.paused&&!v.muted;});
    if(anyPlaying) return;
    _musicPausedForVideo=false;
    var audio=_getCurrentAudio();
    if(audio&&audio.paused){
        audio.volume=0;audio.play().then(function(){
            _fadeAudio(audio,0,_gmpBaseVol,600,null);
        }).catch(function(){});
    }
}
// YouTube/Vimeo iframes: pause music when user clicks on embed
document.addEventListener('click',function(e){
    var embed=e.target.closest('.video-embed');
    if(embed&&embed.querySelector('iframe')){
        var audio=_getCurrentAudio();
        if(audio&&!audio.paused){
            _musicPausedForVideo=true;
            _fadeAudio(audio,audio.volume,0,300,function(){audio.pause();});
        }
    }
});
