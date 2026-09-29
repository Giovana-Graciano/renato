const $=s=>document.querySelector(s);
const intro=$("#intro"),site=$("#site"),startBtn=$("#startBtn"),grid=$("#cardsGrid"),modal=$("#modal"),cardWindow=$("#cardWindow"),cardContent=$("#cardContent"),closeCard=$("#closeCard"),musicBar=$("#musicBar"),musicName=$("#musicName"),musicPause=$("#musicPause"),playlistContent=$("#playlistContent");
let cards=[];
let audio=null;
let currentTrackIndex=0;
let currentCard=null;
let opened=new Set();
let specialCard={id:"final",nome:"GIOVANA",titulo:"THE LOVE FILE",icon:"💚",tipoDeAnimacao:"secret",mensagem:"Você chegou até o final. Este site inteiro foi feito para você, Renatinho — por todos os amigos que deixaram uma memória aqui e por quem transformou tudo isso em uma pequena cápsula do tempo. Feliz aniversário.",assinatura:"Com amor, Giovana ♥",musica:"",musicaNome:""};
const fallback = [{"id": "fluminense", "nome": "AMIGO 1", "titulo": "STADIUM MODE", "icon": "⚽", "hint": "MATCH START • TRICOLOR POWER", "tipoDeAnimacao": "stadium", "mensagem": "Aqui vai a mensagem do amigo. O cartão pode receber histórias, fotos e uma trilha sonora escolhida por ele.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "dino", "nome": "AMIGO 2", "titulo": "JURASSIC MODE", "icon": "🦖", "hint": "FOSSIL FOUND • CHILDHOOD", "tipoDeAnimacao": "dino", "mensagem": "Uma homenagem jurássica para o Renatinho. Aqui entram lembranças da infância e aquela nostalgia boa.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "onepiece", "nome": "AMIGO 3", "titulo": "PIRATE MODE", "icon": "☠️", "hint": "QUEST START • NEW ADVENTURE", "tipoDeAnimacao": "pirate", "mensagem": "Uma mensagem de aventura para o capitão. Fotos, histórias e memórias podem aparecer neste cartão.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "music", "nome": "AMIGO 4", "titulo": "MUSIC MODE", "icon": "♫", "hint": "PRESS PLAY • TRACK FOUND", "tipoDeAnimacao": "music", "mensagem": "Este cartão é para uma dedicatória musical. O amigo escolhe a faixa e a música começa quando o cartão é aberto.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "books", "nome": "AMIGO 5", "titulo": "BOOK MODE", "icon": "📖", "hint": "CHAPTER FOUND • TURN PAGE", "tipoDeAnimacao": "books", "mensagem": "CAPÍTULO ESPECIAL. Uma dedicatória em formato de livro para uma amizade que merece muitas páginas.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "secret", "nome": "AMIGO 6", "titulo": "SECRET MODE", "icon": "★", "hint": "CLASSIFIED FILE • DO NOT OPEN", "tipoDeAnimacao": "secret", "mensagem": "Arquivo secreto. Esta mensagem será publicada pela administradora quando chegar a hora.", "fotos": [], "musica": "", "musicaNome": ""}];

async function loadLoveFile(){try{const r=await fetch("love-file.json?v=1",{cache:"no-store"});if(r.ok){const x=await r.json();specialCard={...specialCard,...x};}}catch(e){}}
async function loadCards(){
  await loadLoveFile();
  try{
    const r=await fetch("cards/cards.json?v=8",{cache:"no-store"});
    if(!r.ok) throw new Error("cards.json");
    cards=await r.json();
  }catch(e){cards=fallback}
  renderCards();
  renderPlaylist();
  window.dispatchEvent(new CustomEvent('renatinho:cards-loaded'));
  if(window.__refreshPhotoBooth) window.__refreshPhotoBooth();
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function renderCards(){
  grid.innerHTML=cards.map(c=>`
    <article class="memory-card card-${esc(c.tipoDeAnimacao)}" data-id="${esc(c.id)}">
      <div class="shine"></div><div class="corner">NEW!!!</div>
      <div class="icon">${esc(c.icon||"★")}</div>
      <h4>${esc(c.titulo||"MEMORY CARD")}</h4>
      <p>${esc(c.hint||"CLICK TO OPEN")}</p>
      <div class="open-label">▶ OPEN CARD ◀</div>
    </article>`).join("");
  grid.querySelectorAll(".memory-card").forEach(el=>el.addEventListener("click",()=>openCard(el.dataset.id)));
}
function renderPlaylist(){
  const tracks=cards.filter(c=>c.musica);
  if(!tracks.length)return;
  playlistContent.innerHTML=`<div class="playlist-disc">💿</div><div class="playlist-info"><b id="trackTitle">BIRTHDAY MIX</b><p id="trackMeta">Escolha uma faixa para controlar a trilha sonora.</p></div><div class="playlist-controls"><button id="prevTrack">◀◀</button><button id="playTrack">▶ PLAY</button><button id="nextTrack">▶▶</button></div>`;
  window.__tracks=tracks;
  $("#prevTrack")?.addEventListener("click",()=>cycleTrack(-1));
  $("#nextTrack")?.addEventListener("click",()=>cycleTrack(1));
  $("#playTrack")?.addEventListener("click",()=>{if(window.__tracks?.length){openCard(window.__tracks[currentTrackIndex%window.__tracks.length].id)}});
}
function initAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    if(!window._ctx)window._ctx=new C();
    if(window._ctx.state==="suspended")window._ctx.resume();
  }catch(e){}
}
function tone(freq=440,d=.05){
  try{
    initAudio();const ctx=window._ctx;if(!ctx)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=freq;o.connect(g);g.connect(ctx.destination);
    g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.start();o.stop(ctx.currentTime+d);
  }catch(e){}
}
function startMusic(c){
  stopMusic();
  const m=c.cardConfig?.musica||{};
  const type=m.type||(/spotify/i.test(c.musicaNome||"")?"spotify":/youtube/i.test(c.musicaNome||"")?"youtube":(c.musica?.startsWith("data:audio/")?"file":"none"));
  const src=c.musica||m.url||"";
  if(!src)return;
  musicName.textContent=`♫ ${c.musicaNome||"NOW PLAYING"}`;
  musicBar.classList.remove("hidden");
  if(type==="file" && src.startsWith("data:audio/")){
    audio=new Audio(src);audio.loop=true;
    audio.play().catch(()=>{});
    musicPause.textContent="❚❚";
    return;
  }
  let embed="";
  try{
    const u=new URL(src);
    if(type==="youtube"){
      const id=u.hostname.includes("youtu.be")?u.pathname.slice(1):u.searchParams.get("v");
      if(id)embed=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if(type==="spotify"){
      const m=u.pathname.match(/\/(track|album|playlist|episode|show)\/([^/?]+)/);
      if(m)embed=`https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&autoplay=1`;
    }
  }catch(e){}
  if(embed){
    const iframe=document.createElement("iframe");
    iframe.id="externalMusic";iframe.src=embed;iframe.allow="autoplay; encrypted-media";iframe.style.cssText="position:absolute;width:1px;height:1px;opacity:.01;pointer-events:none";
    cardWindow.appendChild(iframe);
  }
}
function stopMusic(){
  if(audio){audio.pause();audio.currentTime=0;audio=null}
  document.querySelector("#externalMusic")?.remove();
  musicBar.classList.add("hidden");
}
function openCard(id){
  const c=cards.find(x=>x.id===id);if(!c)return;
  currentCard=c;
  currentTrackIndex=Math.max(0,cards.findIndex(x=>x.id===id));
  opened.add(id);saveOpened();
  initAudio();tone(520,.04);setTimeout(()=>tone(780,.07),35);
  startMusic(c);
  cardWindow.className=`card-window anim-${c.tipoDeAnimacao||"secret"} opening`;
  $("#modalFile").textContent=`${String(c.id).toUpperCase()}.EXE`;
  cardContent.style.color=c.cardConfig?.textColor||"";cardContent.innerHTML=`
    <div class="card-hero">
      <div class="big-icon">${esc(c.icon||"★")}</div>
      <div><div class="tiny">★ CLASSIFIED FRIEND MESSAGE ★</div><h3>${esc(c.titulo||"FELIZ ANIVERSÁRIO")}</h3><div class="from">DE: ${esc(c.nome||"UM AMIGO")}</div></div>
    </div>
    <div class="msg">${esc(c.mensagem||"Feliz aniversário, Renatinho!").replace(/\n/g,"<br>")}</div>
    ${c.fotos?.length?`<div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap">${c.fotos.map(f=>`<img src="${f.data||f}" style="max-width:180px;max-height:180px;border:5px ridge #fff;box-shadow:5px 5px #000">`).join("")}</div>`:""}${c.gifs?.top?`<div class="card-gif-zone"><img src="${esc(c.gifs.top)}" style="max-width:180px;max-height:120px;border:5px ridge #fff;box-shadow:5px 5px #000"></div>`:""}${c.gifs?.bottom?`<div class="card-gif-zone"><img src="${esc(c.gifs.bottom)}" style="max-width:180px;max-height:120px;border:5px ridge #fff;box-shadow:5px 5px #000"></div>`:""}`;
  modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function close(){
  stopMusic();modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";
}
startBtn.addEventListener("click",()=>{tone(320,.05);setTimeout(()=>tone(520,.09),55);intro.classList.add("intro-exit");setTimeout(()=>{intro.classList.add("hidden");site.classList.remove("hidden");window.scrollTo(0,0)},550)});
closeCard.addEventListener("click",close);
$("#finalBtn")?.addEventListener("click",openFinal);
modal.addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))close()});
musicPause.addEventListener("click",()=>{if(audio){if(audio.paused){audio.play();musicPause.textContent="❚❚"}else{audio.pause();musicPause.textContent="▶"}}});
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}) ));
document.addEventListener("pointermove",e=>{const s=document.createElement("span");s.textContent=["✦","·","★","✧"][Math.floor(Math.random()*4)];s.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;color:#ffe04a;pointer-events:none;z-index:9998;font-weight:bold;animation:cursorFade .5s forwards`;document.body.appendChild(s);setTimeout(()=>s.remove(),500)});
const style=document.createElement("style");style.textContent="@keyframes cursorFade{to{transform:translateY(-15px) scale(.2);opacity:0}}.intro-exit{animation:introExit .55s forwards}@keyframes introExit{to{transform:scale(1.04);filter:brightness(2);opacity:0}}";document.head.appendChild(style);
loadOpened();

function updateFinal(){
  const total=cards.length;
  const count=opened.size;
  const status=$("#finalStatus");
  const btn=$("#finalBtn");
  if(status) status.innerHTML=`MEMORY FILES: <b>${Math.min(count,total)} / ${total}</b>`;
  if(btn){
    if(count>=total && total>0){
      btn.disabled=false;btn.textContent="★ UNLOCK FINAL CARD ★";btn.classList.add("ready");
    }else{
      btn.disabled=true;btn.textContent=`🔒 FINAL CARD LOCKED (${Math.min(count,total)}/${total})`;
    }
  }
}
function loadOpened(){
  try{opened=new Set(JSON.parse(localStorage.getItem("renatinho-opened-v9")||"[]"))}catch(e){opened=new Set()}
}
function saveOpened(){localStorage.setItem("renatinho-opened-v9",JSON.stringify([...opened]));updateFinal()}
function openFinal(){
  initAudio();tone(260,.08);setTimeout(()=>tone(520,.08),80);setTimeout(()=>tone(880,.12),160);
  currentCard=specialCard;stopMusic();
  cardWindow.className="card-window anim-secret opening final-card";
  $("#modalFile").textContent="RENATINHO_FINAL.EXE";
  cardContent.style.color=c.cardConfig?.textColor||"";cardContent.innerHTML=`<div class="final-card-hero"><div class="final-orbit">★</div><div><div class="tiny blink">★ AUTHOR DETECTED • ACCESS GRANTED ★</div><h3>${esc(specialCard.titulo)}</h3><div class="from">DE: ${esc(specialCard.nome)}</div></div></div><div class="msg">${esc(specialCard.mensagem)}</div><div class="final-signature">${esc(specialCard.assinatura||"Com amor, Giovana ♥")}<br><b>★ HAPPY BIRTHDAY, RENATINHO ★</b></div>`;
  modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
}

loadCards();
updateFinal();

function cycleTrack(dir){
  const tracks=window.__tracks||[];if(!tracks.length)return;
  currentTrackIndex=(currentTrackIndex+dir+tracks.length)%tracks.length;
  const c=tracks[currentTrackIndex];
  $("#trackTitle").textContent=`♫ ${c.nome}`;
  $("#trackMeta").textContent=c.musicaNome||"TRACK";
  startMusic(c);
  tone(dir>0?660:420,.07);
}

/* V14 FINAL RETRO MODULES */
(function(){
  const q=s=>document.querySelector(s);
  const toast=(title,msg)=>{const x=document.createElement('div');x.className='secret-toast';x.innerHTML='<b>'+title+'</b><br><br>'+msg;document.body.appendChild(x);setTimeout(()=>x.remove(),2600)};
  const esc2=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* Friends Photo Booth: uses the photos already attached to published cards. */
  let photos=[], photoIndex=0, photoTimer=null;
  function collectPhotos(){
    photos=[];
    cards.forEach(c=>(c.fotos||[]).forEach(f=>photos.push({src:f.data||f,nome:c.nome||'AMIGO',titulo:c.titulo||'MEMORY'})));
    renderPhoto();
  }
  function renderPhoto(){
    const img=q('#photoSlide'), empty=q('#photoSlideEmpty'), cap=q('#photoCaption');
    if(!img||!empty||!cap)return;
    if(!photos.length){img.hidden=true;empty.hidden=false;cap.textContent='As fotos dos cartões aparecerão aqui.';return}
    const p=photos[photoIndex%photos.length];img.src=p.src;img.hidden=false;empty.hidden=true;cap.textContent='★ '+p.nome+' — '+p.titulo+' ★';
  }
  function movePhoto(dir){if(!photos.length)return;photoIndex=(photoIndex+dir+photos.length)%photos.length;renderPhoto();tone(dir>0?760:460,.05)}
  function togglePhotoShow(){
    if(photoTimer){clearInterval(photoTimer);photoTimer=null;q('#photoPlay').textContent='▶ SLIDESHOW';return}
    if(!photos.length){toast('📸 PHOTO BOOTH','Ainda não existem fotos nos cartões publicados.');return}
    q('#photoPlay').textContent='❚❚ STOP';photoTimer=setInterval(()=>movePhoto(1),2800);
  }
  q('#photoPrev')?.addEventListener('click',()=>movePhoto(-1));
  q('#photoNext')?.addEventListener('click',()=>movePhoto(1));
  q('#photoPlay')?.addEventListener('click',togglePhotoShow);
  const originalRenderCards=window.renderCards;
  /* renderCards is lexical in the main script, so refresh the booth after the cards load below. */
  window.__refreshPhotoBooth=collectPhotos;
  collectPhotos();
  window.addEventListener('renatinho:cards-loaded',collectPhotos);

  /* Save a small, real archive snapshot to a .FLP file. */
  q('#saveFloppy')?.addEventListener('click',()=>{
    const payload={savedAt:new Date().toISOString(),site:'Renatinho Birthday Y2K Memory',cards:cards.map(c=>({id:c.id,nome:c.nome,titulo:c.titulo,musicaNome:c.musicaNome,photos:(c.fotos||[]).length}))};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RENATINHO_MEMORY.FLP';a.click();q('#floppyStatus').textContent='MEMORY SAVED ✓';toast('💾 FLOPPY SAVED','A snapshot das memórias foi salvo.');
  });

  /* Time Capsule = a downloadable snapshot of the birthday site at this moment. */
  function updateCapsule(){
    const photoCount=cards.reduce((n,c)=>n+(c.fotos||[]).length,0),musicCount=cards.filter(c=>c.musica).length;
    const stats=q('#capsuleStats');if(stats)stats.innerHTML=`CARDS: <b>${cards.length}</b><br>PHOTOS: <b>${photoCount}</b><br>MUSIC TRACKS: <b>${musicCount}</b><br>STATUS: <b>READY TO BE SEALED</b>`;
  }
  updateCapsule();setTimeout(updateCapsule,700);
  q('#sealCapsule')?.addEventListener('click',()=>{
    const stamp=new Date();const snapshot={sealedAt:stamp.toISOString(),label:'RENATINHO TIME CAPSULE',cards:cards.map(c=>({id:c.id,nome:c.nome,titulo:c.titulo,musicaNome:c.musicaNome,photos:(c.fotos||[]).length})),note:'This is a snapshot of the published birthday memories at the moment the capsule was sealed.'};
    localStorage.setItem('renatinho-time-capsule',JSON.stringify(snapshot));
    const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RENATINHO_TIME_CAPSULE.json';a.click();
    const box=q('#capsuleContent');box.classList.remove('hidden');box.innerHTML='<b>📦 CAPSULE SEALED</b><br><br>Snapshot created on '+stamp.toLocaleString('pt-BR')+'<br>It contains '+cards.length+' cards, '+cards.reduce((n,c)=>n+(c.fotos||[]).length,0)+' photos and '+cards.filter(c=>c.musica).length+' music tracks.';q('#sealCapsule').textContent='📦 CAPSULE SEALED';tone(360,.08);setTimeout(()=>tone(720,.12),100);
  });

  /* Renatinho's posterity message remains his personal local letter. */
  q('#saveFuture')?.addEventListener('click',()=>{const v=q('#futureMessage')?.value.trim();if(!v)return;localStorage.setItem('renatinho-future-message',v);q('#futureStatus').textContent='SEALED ✓';q('#futureMessage').disabled=true;q('#futureMessage').classList.add('future-sealed');q('#saveFuture').textContent='🔒 SEALED';tone(520,.06)});
  const saved=localStorage.getItem('renatinho-future-message');if(saved&&q('#futureMessage')){q('#futureMessage').value=saved;q('#futureMessage').disabled=true;q('#futureMessage').classList.add('future-sealed');q('#futureStatus').textContent='SEALED ✓';q('#saveFuture').textContent='🔒 SEALED'}

  const GUEST_KEY='renatinho-guestbook-v14';
  function guestEntries(){try{return JSON.parse(localStorage.getItem(GUEST_KEY)||'[]')}catch(e){return []}}
  function renderGuestbook(){const root=q('#guestEntries');if(!root)return;const entries=guestEntries();root.innerHTML='<div class=\"guest-entry\"><b>★ INTERNET EXPLORER</b><p>Esta página contém muitas memórias.</p><small>posted from Windows XP • 56k connection</small></div>'+entries.map(x=>'<div class=\"guest-entry\"><b>★ '+esc2(x.name)+'</b><p>'+esc2(x.message).replace(/\n/g,'<br>')+'</p><small>'+new Date(x.createdAt).toLocaleString('pt-BR')+'</small></div>').join('')}
  renderGuestbook();
  q('#guestForm')?.addEventListener('submit',e=>{e.preventDefault();const n=q('#guestName')?.value.trim(),m=q('#guestMsg')?.value.trim();if(!n||!m)return;const entries=guestEntries();entries.unshift({name:n,message:m,createdAt:new Date().toISOString()});localStorage.setItem(GUEST_KEY,JSON.stringify(entries.slice(0,100)));q('#guestName').value='';q('#guestMsg').value='';renderGuestbook();tone(700,.05);toast('✎ GUESTBOOK UPDATED','Recado salvo neste navegador.')});

  /* Easter eggs. */
  let dinoClicks=0;document.querySelector('.floating-emojis')?.addEventListener('click',e=>{if(e.target.textContent.includes('🦖')){dinoClicks++;if(dinoClicks>=3){toast('🦖 SECRET DINO MODE','RAWRSOME! You found a hidden memory.');dinoClicks=0}}});
  let avatarClicks=0;q('#renatinhoAvatar')?.addEventListener('click',()=>{avatarClicks++;if(avatarClicks>=5){toast('💚 RENATINHO.EXE','CHEAT CODE ACTIVATED: BIRTHDAY GOD MODE');avatarClicks=0}});
})();
