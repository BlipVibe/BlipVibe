// ============================================================================
// SHOP MODULE — Skin shop, my skins, premium bg, try-on, quests, featured
// Depends on: app.js globals
// ============================================================================
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
    // Server-side purchase handler — all purchases validated atomically on Supabase
    function _bindBuyBtn(selector,attrName,itemType,ownedMap,itemList,nameKey){
        $$(selector).forEach(function(btn){btn.addEventListener('click',async function(){
            var id=btn.getAttribute(attrName);
            var item=itemList.find(function(x){return x.id===id;});
            if(!item) return;
            btn.disabled=true;var origText=btn.textContent;btn.textContent='...';
            try{
                var result=await sbPurchaseItem(itemType,id,item.price);
                if(!result.success){showToast(result.error||'Purchase failed');btn.disabled=false;btn.textContent=origText;return;}
                ownedMap[id]=true;
                state.coins=result.balance;currentUser.coin_balance=result.balance;
                updateCoins();shopPurchased(btn,itemType,id);
                addNotification('skin','You purchased the "'+(item[nameKey]||item.name)+'"!');
            }catch(e){showToast('Purchase failed: '+(e.message||'Error'));btn.disabled=false;btn.textContent=origText;}
        });});
    }
    _bindBuyBtn('.buy-skin-btn','data-sid','skin',state.ownedSkins,skins,'name');
    _bindBuyBtn('.buy-font-btn','data-fid','font',state.ownedFonts,fonts,'name');
    _bindBuyBtn('.buy-logo-btn','data-lid','logo',state.ownedLogos,logos,'name');
    _bindBuyBtn('.buy-icon-btn','data-iid','icons',state.ownedIconSets,iconSets,'name');
    _bindBuyBtn('.buy-coin-btn','data-cid','coins',state.ownedCoinSkins,coinSkins,'name');
    _bindBuyBtn('.buy-tpl-btn','data-tid','template',state.ownedTemplates,templates,'name');
    _bindBuyBtn('.buy-premium-btn','data-pid','premium',state.ownedPremiumSkins,premiumSkins,'name');
    _bindBuyBtn('.buy-nav-btn','data-nid','navstyle',state.ownedNavStyles,navStyles,'name');
    // Try On button handlers
    $$('.try-on-btn').forEach(function(btn){btn.addEventListener('click',function(){doTryOn(btn.dataset.tryType,btn.dataset.tryId);});});
    // Song preview buttons
    $$('.song-preview-btn').forEach(function(btn){btn.addEventListener('click',function(e){handleSongPreviewClick(e,btn);
    });});
    // Song buy buttons
    $$('.buy-song-btn').forEach(function(btn){btn.addEventListener('click',async function(){
        var sid=btn.dataset.songId;var price=parseInt(btn.dataset.price);
        btn.disabled=true;btn.textContent='...';
        try{
            var result=await sbPurchaseItem('song',sid,price);
            if(!result.success){showToast(result.error||'Purchase failed');btn.disabled=false;return;}
            state.coins=result.balance;currentUser.coin_balance=result.balance;updateCoins();
            await sbPurchaseSong(currentUser.id,sid);
            await sbSetProfileSong(currentUser.id,sid);
            currentUser.profile_song_id=sid;_shopOwnedSongs[sid]=true;
            showToast('Song purchased and set as profile song!');refreshMyProfileMusic();renderShop();
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


// ======================== NAV WHEEL + SHOP HANDLERS (from app.js) ========================
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

function updatePremiumBg(forceShow){
    var layer=document.getElementById('premiumBgLayer');
    if(!layer)return;
    if(premiumBgImage&&(forceShow||state.activePremiumSkin)){
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
function _myActiveSkin(){return _pvSaved&&currentUser&&currentUser.skin_data?currentUser.skin_data.activeSkin:state.activeSkin;}
function _myActivePremiumSkin(){return _pvSaved&&currentUser&&currentUser.skin_data?currentUser.skin_data.activePremiumSkin:state.activePremiumSkin;}
function _myActiveFont(){return _pvSaved&&currentUser&&currentUser.skin_data?currentUser.skin_data.activeFont:state.activeFont;}
function _myActiveTemplate(){return _pvSaved&&currentUser&&currentUser.skin_data?currentUser.skin_data.activeTemplate:state.activeTemplate;}
function _myActiveNavStyle(){return _pvSaved&&currentUser&&currentUser.skin_data?currentUser.skin_data.activeNavStyle:state.activeNavStyle;}
function getMySkinCategories(){
    var cats=[];
    var ownedS=skins.filter(function(s){return state.ownedSkins[s.id];});
    var ownedP=premiumSkins.filter(function(s){return state.ownedPremiumSkins[s.id];});
    var ownedF=fonts.filter(function(f){return state.ownedFonts[f.id];});
    var ownedL=logos.filter(function(l){return state.ownedLogos[l.id];});
    var ownedI=iconSets.filter(function(s){return state.ownedIconSets[s.id];});
    var ownedC=coinSkins.filter(function(s){return state.ownedCoinSkins[s.id];});
    var ownedT=templates.filter(function(t){return state.ownedTemplates[t.id];});
    if(ownedS.length) cats.push({key:'basic',label:'<i class="fas fa-palette"></i> Basic Skins',items:ownedS,render:function(s){var a=_myActiveSkin()===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="skin-preview-inner" style="color:#333;background:#fff;">Preview</div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';">'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-skin-btn" data-sid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div class="skin-preview-inner" style="color:#333;background:#fff;">Default</div></div><div class="skin-card-body"><h4>Default</h4><p>The BlipVibe signature look.</p><button class="btn '+(!_myActiveSkin()?'btn-disabled':'btn-primary')+' apply-skin-btn" data-sid="default">'+(!_myActiveSkin()?'Active':'Apply')+'</button></div></div>'});
    if(ownedP.length) cats.push({key:'premium',label:'<i class="fas fa-gem"></i> Premium Skins',items:ownedP,render:function(s){var a=_myActivePremiumSkin()===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div class="premium-preview-frame" style="background:'+s.border+';"><img src="images/default-avatar.svg" class="premium-preview-avatar"></div></div><div class="skin-card-body" style="background:'+s.cardBg+';"><h4 style="color:'+s.cardText+';"><i class="fas '+s.icon+'" style="color:'+s.iconColor+';margin-right:6px;"></i>'+s.name+'</h4><p style="color:'+s.cardMuted+';">'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-premium-btn" data-pid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="color:#fff;font-size:14px;font-weight:600;">Default</div></div><div class="skin-card-body"><h4>Default</h4><p>The BlipVibe signature look.</p><button class="btn '+(!_myActivePremiumSkin()?'btn-disabled':'btn-primary')+' apply-premium-btn" data-pid="default">'+(!_myActivePremiumSkin()?'Active':'Apply')+'</button></div></div>'});
    if(ownedF.length) cats.push({key:'fonts',label:'<i class="fas fa-font"></i> Font Styles',items:ownedF,render:function(f){var a=_myActiveFont()===f.id;return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#667eea,#764ba2);"><span style="font-family:\''+f.family+'\',sans-serif;color:#fff;font-size:24px;">Aa Bb Cc</span></div><div class="skin-card-body"><h4 style="font-family:\''+f.family+'\',sans-serif;">'+f.name+'</h4><p>'+f.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-font-btn" data-fid="'+f.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#667eea,#764ba2);"><span style="font-family:Roboto,sans-serif;color:#fff;font-size:24px;">Aa Bb Cc</span></div><div class="skin-card-body"><h4>Default (Roboto)</h4><p>The original BlipVibe font.</p><button class="btn '+(!_myActiveFont()?'btn-disabled':'btn-primary')+' apply-font-btn" data-fid="default">'+(!_myActiveFont()?'Active':'Apply')+'</button></div></div>'});
    if(ownedL.length) cats.push({key:'logos',label:'<i class="fas fa-star"></i> Logo Styles',items:ownedL,render:function(l){var a=state.activeLogo===l.id;var preview=l.img?'<img src="'+l.img+'" style="height:80px;object-fit:contain;">':'<span style="color:#fff;font-size:22px;font-weight:700;">'+(l.text||'')+'</span>';return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#f093fb,#f5576c);display:flex;align-items:center;justify-content:center;">'+preview+'</div><div class="skin-card-body"><h4>'+l.name+'</h4><p>'+l.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-logo-btn" data-lid="'+l.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#f093fb,#f5576c);"><span style="color:#fff;font-size:22px;font-weight:700;">BlipVibe</span></div><div class="skin-card-body"><h4>Default</h4><p>The original BlipVibe logo.</p><button class="btn '+(!state.activeLogo?'btn-disabled':'btn-primary')+' apply-logo-btn" data-lid="default">'+(!state.activeLogo?'Active':'Apply')+'</button></div></div>'});
    if(ownedI.length) cats.push({key:'icons',label:'<i class="fas fa-icons"></i> Icon Sets',items:ownedI,render:function(s){var a=state.activeIconSet===s.id;var prev='';Object.keys(s.icons).slice(0,4).forEach(function(k){prev+='<i class="fas '+s.icons[k]+'" style="margin:0 4px;font-size:18px;"></i>';});return '<div class="skin-card"><div class="skin-preview" style="background:'+s.preview+';"><div style="color:#fff;">'+prev+'</div></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-icon-btn" data-iid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="color:#fff;"><i class="fas fa-home" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-users-rectangle" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-palette" style="margin:0 4px;font-size:18px;"></i><i class="fas fa-store" style="margin:0 4px;font-size:18px;"></i></div></div><div class="skin-card-body"><h4>Default</h4><p>The original BlipVibe icons.</p><button class="btn '+(!state.activeIconSet?'btn-disabled':'btn-primary')+' apply-icon-btn" data-iid="default">'+(!state.activeIconSet?'Active':'Apply')+'</button></div></div>'});
    if(ownedC.length) cats.push({key:'coins',label:'<i class="fas fa-coins"></i> Coin Skins',items:ownedC,render:function(s){var a=state.activeCoinSkin===s.id;return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><i class="fas '+s.icon+'" style="font-size:36px;color:'+s.color+';"></i></div><div class="skin-card-body"><h4>'+s.name+'</h4><p>'+s.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-coin-btn" data-cid="'+s.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><i class="fas fa-coins" style="font-size:36px;color:#ffd700;"></i></div><div class="skin-card-body"><h4>Default</h4><p>The original gold coins.</p><button class="btn '+(!state.activeCoinSkin?'btn-disabled':'btn-primary')+' apply-coin-btn" data-cid="default">'+(!state.activeCoinSkin?'Active':'Apply')+'</button></div></div>'});
    if(ownedT.length&&window.innerWidth>768) cats.push({key:'templates',label:'<i class="fas fa-table-columns"></i> Templates',items:ownedT,render:function(t){var a=_myActiveTemplate()===t.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+t.preview+';">'+tplPreviewHtml(t.id)+'</div><div class="skin-card-body"><h4>'+t.name+'</h4><p>'+t.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-tpl-btn" data-tid="'+t.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">'+tplPreviewHtml('spotlight')+'</div><div class="skin-card-body"><h4>Default Template</h4><p>Wide feed, narrow sidebars.</p><button class="btn '+(state.activeTemplate==='spotlight'?'btn-disabled':'btn-primary')+' apply-tpl-btn" data-tid="spotlight">'+(state.activeTemplate==='spotlight'?'Active':'Apply')+'</button></div></div>'});
    var ownedN=navStyles.filter(function(n){return state.ownedNavStyles[n.id];});
    if(ownedN.length) cats.push({key:'navstyles',label:'<i class="fas fa-bars-staggered"></i> Nav Styles',items:ownedN,render:function(n){var a=_myActiveNavStyle()===n.id;return '<div class="skin-card"><div class="skin-preview" style="background:'+n.preview+';">'+navPreviewHtml(n.id)+'</div><div class="skin-card-body"><h4>'+n.name+'</h4><p>'+n.desc+'</p><button class="btn '+(a?'btn-disabled':'btn-primary')+' apply-nav-btn" data-nid="'+n.id+'">'+(a?'Active':'Apply')+'</button></div></div>';},defaultCard:'<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><div style="width:100%;height:100%;display:flex;flex-direction:column;padding:4px;gap:3px;"><div style="height:10%;background:rgba(255,255,255,.6);border-radius:2px;flex:none;"></div><div style="flex:1;background:rgba(255,255,255,.2);border-radius:2px;"></div></div></div><div class="skin-card-body"><h4>Default</h4><p>The original top navigation bar.</p><button class="btn '+(!_myActiveNavStyle()?'btn-disabled':'btn-primary')+' apply-nav-btn" data-nid="default">'+(!_myActiveNavStyle()?'Active':'Apply')+'</button></div></div>'});
    // Owned songs
    if(_shopSongs&&_shopSongs.length){
        var ownedSongs=_shopSongs.filter(function(s){return _shopOwnedSongs&&_shopOwnedSongs[s.id];});
        if(ownedSongs.length){
            // Add playlist manager card as first item
            var songsWithPlaylist=[{_isPlaylistBtn:true}].concat(ownedSongs);
            cats.push({key:'songs',label:'<i class="fas fa-music"></i> Songs',items:songsWithPlaylist,render:function(s){
                if(s._isPlaylistBtn) return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,var(--primary),#ffd700);display:flex;align-items:center;justify-content:center;"><i class="fas fa-list" style="font-size:32px;color:#fff;"></i></div><div class="skin-card-body"><h4>Manage Playlist</h4><p>'+_myPlaylist.length+'/5 songs</p><button class="btn btn-primary open-playlist-btn">Edit Playlist</button></div></div>';
                var isInPlaylist=_myPlaylist.some(function(ps){return ps.id===s.id;});
                return '<div class="skin-card"><div class="skin-preview" style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-music" style="font-size:32px;color:var(--primary);"></i><button class="song-preview-btn" data-url="'+escapeHtml(s.file_url)+'" style="background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;"><i class="fas fa-play"></i></button></div><div class="skin-card-body"><h4>'+escapeHtml(s.title)+'</h4><p>'+(s.genre||'BlipVibe Original')+'</p><button class="btn '+(isInPlaylist?'btn-disabled':'btn-primary')+' set-song-btn" data-song-id="'+s.id+'">'+(isInPlaylist?'In Playlist':'Set as Profile Song')+'</button></div></div>';
            }});
        }
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
    if(currentMySkinsTab==='premium'&&_myActivePremiumSkin()){
        var bgHtml='<div class="premium-bg-controls card" style="margin-top:16px;padding:16px;border-radius:12px;">';
        bgHtml+='<h4 class="card-heading" style="margin-bottom:10px;font-size:14px;"><i class="fas fa-image" style="margin-right:6px;color:var(--primary);"></i>Background Image</h4>';
        bgHtml+='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">';
        bgHtml+='<label class="btn btn-outline" style="cursor:pointer;font-size:13px;"><i class="fas fa-upload" style="margin-right:6px;"></i>Upload<input type="file" id="premiumBgUpload" accept="image/*" style="display:none;"></label>';
        bgHtml+='<button class="btn btn-primary" id="premiumBgApply" style="font-size:13px;display:none;"><i class="fas fa-check" style="margin-right:6px;"></i>Apply</button>';
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
                var optimized=await _optimizeImage(file,1920,1080,0.85);
                var ext=optimized.name.split('.').pop()||'jpg';
                var path='backgrounds/'+currentUser.id+'/bg-'+Date.now()+'.'+ext;
                showToast('Uploading...');
                var url=await sbUploadFile('avatars',path,optimized);
                window._stagedBgUrl=url;
                // Show preview
                var preview=document.createElement('img');
                preview.src=url;preview.style.cssText='width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-top:8px;border:2px solid var(--primary);';
                bgUploadInput.closest('.premium-bg-controls').appendChild(preview);
                // Show apply button
                var applyBtn=document.getElementById('premiumBgApply');
                if(applyBtn) applyBtn.style.display='';
                showToast('Background uploaded — click Apply to set it!');
            }catch(e){
                console.error('BG upload error:',e);
                showToast('Background upload failed: '+(e.message||'Unknown error'));
            }
        });
    }
    // Apply staged background
    var applyBgBtn=document.getElementById('premiumBgApply');
    if(applyBgBtn) applyBgBtn.addEventListener('click',function(){
        if(!window._stagedBgUrl) return;
        premiumBgImage=window._stagedBgUrl;
        window._stagedBgUrl=null;
        updatePremiumBg();renderMySkins();syncSkinDataToSupabase(true);
        showToast('Background applied!');
    });
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
                t.addEventListener('mouseleave',function(){if(!t.classList.contains('selected'))t.style.borderColor='transparent';t.style.opacity=t.classList.contains('selected')?'1':'.8';});
                t.addEventListener('click',function(){
                    // Deselect others
                    $$('.prem-bg-hist-thumb').forEach(function(x){x.classList.remove('selected');x.style.borderColor='transparent';x.style.opacity='.8';});
                    // Select this one
                    t.classList.add('selected');t.style.borderColor='var(--primary)';t.style.opacity='1';
                    window._stagedBgUrl=bgArr[parseInt(t.dataset.idx)].src;
                    var applyBtn=document.getElementById('premiumBgApply');
                    if(applyBtn) applyBtn.style.display='';
                });
            });
        }).catch(function(e){console.warn('BG history load:',e);});
    }
    var bgRemoveBtn=document.getElementById('premiumBgRemove');
    if(bgRemoveBtn){
        bgRemoveBtn.addEventListener('click',function(){premiumBgImage=null;premiumBgOverlay=0;premiumBgDarkness=0;premiumCardTransparency=0.1;updatePremiumBg();renderMySkins();syncSkinDataToSupabase(true);});
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
    $$('#mySkinsGrid .open-playlist-btn').forEach(function(btn){btn.addEventListener('click',function(){closeModal();showPlaylistManager();});});
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


// ======================== DAILY QUESTS / COIN BAR / FEATURED SKIN ========================
// ======================== DAILY QUEST SYSTEM ========================
var _questData=null;
async function loadDailyQuests(){
    try{
        var resp=await sb.rpc('get_daily_quests');
        if(resp.error) throw resp.error;
        var d=resp.data!=null?resp.data:resp;
        if(d) _questData=d;
    }catch(e){
        // RPC not deployed yet — use local fallback
        var key='blipvibe_quests_'+new Date().toDateString();
        try{_questData=JSON.parse(localStorage.getItem(key))||{likes_count:0,follows_count:0,posts_count:0,likes_reward_claimed:false,follows_reward_claimed:false,posts_reward_claimed:false};}catch(e2){_questData={likes_count:0,follows_count:0,posts_count:0,likes_reward_claimed:false,follows_reward_claimed:false,posts_reward_claimed:false};}
    }
    renderQuestPanel();
}
async function trackQuestProgress(type){
    try{
        var resp=await sb.rpc('update_quest_progress',{p_type:type});
        if(resp.error) throw resp.error;
        var result=resp.data!=null?resp.data:resp;
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
    if(buyBtn) buyBtn.addEventListener('click',async function(){
        buyBtn.disabled=true;buyBtn.textContent='...';
        try{
            var result=await sbPurchaseItem('premium',skin.id,skin.price);
            if(!result.success){showToast(result.error||'Purchase failed');buyBtn.disabled=false;return;}
            state.ownedPremiumSkins[skin.id]=true;
            state.coins=result.balance;currentUser.coin_balance=result.balance;
            updateCoins();
            showToast('You purchased "'+skin.name+'"!');
            renderFeaturedSkin();
            renderCoinGoalBar();
        }catch(e){showToast('Purchase failed: '+(e.message||'Error'));buyBtn.disabled=false;}
    });
}


