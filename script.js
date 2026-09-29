const $ = (selector) => document.querySelector(selector);

const enterBtn = $("#enterBtn");
const intro = $("#intro");
const wall = $("#wall");
const modal = $("#modal");
const modalBox = $("#modalBox");
const animation = $("#animation");
const message = $("#message");
const closeBtn = $("#closeBtn");
const progressEl = $("#progress");
const scoreEl = $("#score");
const allUnlocked = $("#allUnlocked");
const finalCard = $("#finalCard");
const worldStart = $("#worldStart");
const worldStartSmall = $("#worldStartSmall");
const worldStartTitle = $("#worldStartTitle");
const coinsEl = $("#coins");
const starsCollectedEl = $("#starsCollected");
const worldProgressFill = $("#worldProgressFill");
const levelClear = $("#levelClear");
const sparkleLayer = $("#sparkleLayer");
const audioPlayer = $("#audioPlayer");
const playlistList = $("#playlistList");
const nowPlaying = $("#nowPlaying");
const nowPlayingFriend = $("#nowPlayingFriend");
const playlistProgress = $("#playlistProgress");
let currentTrack = null;

const STORAGE_KEY = "renatinho-birthday-unlocked-v1";
const TOTAL_CARDS = 6;
let audioCtx = null;
let opened = new Set(loadOpened());

/*
 * ============================================================
 * CARTÕES — EDITE ESTA ÁREA QUANDO OS AMIGOS ENTREGAREM O MATERIAL
 * ============================================================
 * Cada cartão segue a estrutura:
 * { id, nome, titulo, tipoDeAnimacao, mensagem, fotos, musica }
 *
 * fotos e musica ficam como campos preparados para uso futuro.
 */
let cards = [
  {
    id:"fluminense",
    nome:"AMIGO 1",
    titulo:"STADIUM MODE",
    icon:"⚽",
    hint:"MATCH START • TRICOLOR POWER",
    tipoDeAnimacao:"stadium",
    mensagem:"Aqui entra a mensagem real do amigo. Você pode colocar histórias de futebol, provocações carinhosas, fotos de vocês e qualquer lembrança que tenha a cara do Renatinho.",
    fotos:[],
    musica:"",
    musicaNome:""
  },
  {
    id:"dino",
    nome:"AMIGO 2",
    titulo:"JURASSIC MODE",
    icon:"🦖",
    hint:"FOSSIL FOUND • LEVEL: CHILDHOOD",
    tipoDeAnimacao:"dino",
    mensagem:"Uma mensagem jurássica para lembrar o Renatinho que amava dinossauros. Aqui entram fotos antigas, histórias de infância e a descoberta científica de qual dinossauro ele seria.",
    fotos:[],
    musica:"",
    musicaNome:""
  },
  {
    id:"onepiece",
    nome:"AMIGO 3",
    titulo:"PIRATE MODE",
    icon:"☠️",
    hint:"QUEST START • NEW ADVENTURE",
    tipoDeAnimacao:"pirate",
    mensagem:"Uma aventura começa! Este espaço pode virar um mapa do tesouro com memórias, histórias, viagens, amizades e referências genéricas ao espírito pirata que ele curte.",
    fotos:[],
    musica:"",
    musicaNome:""
  },
  {
    id:"music",
    nome:"AMIGO 4",
    titulo:"MUSIC MODE",
    icon:"♫",
    hint:"PRESS PLAY • TRACK FOUND",
    tipoDeAnimacao:"music",
    mensagem:"Dê o play: este cartão pode receber uma dedicatória musical, uma capa de álbum, fotos, lembranças e uma música escolhida pelo amigo.",
    fotos:[],
    musica:"",
    musicaNome:""
  },
  {
    id:"books",
    nome:"AMIGO 5",
    titulo:"BOOK MODE",
    icon:"📖",
    hint:"CHAPTER FOUND • TURN PAGE",
    tipoDeAnimacao:"books",
    mensagem:"CAPÍTULO ESPECIAL: aqui entra uma homenagem em forma de livro — dedicatória, capítulos de memórias, histórias e a última página com a mensagem final.",
    fotos:[],
    musica:"",
    musicaNome:""
  },
  {
    id:"secret",
    nome:"AMIGO 6",
    titulo:"SECRET MODE",
    icon:"★",
    hint:"ACCESSING SECRET FILE…",
    tipoDeAnimacao:"secret",
    mensagem:"PASSWORD ACCEPTED. Este arquivo está reservado para uma mensagem que ainda é segredo.",
    fotos:[],
    musica:""
  }
];

function loadOpened(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveOpened(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...opened]));
}

function padScore(value){
  return String(value * 1000).padStart(6,"0");
}

function updateProgress(){
  const count = [...opened].filter(id => cards.some(c => c.id === id)).length;
  progressEl.textContent = `${count}/${TOTAL_CARDS}`;
  scoreEl.textContent = padScore(count);
  if(coinsEl) coinsEl.textContent = String(count * 3).padStart(2,"0");
  if(starsCollectedEl) starsCollectedEl.textContent = String(count).padStart(2,"0");
  if(worldProgressFill) worldProgressFill.style.width = `${(count / TOTAL_CARDS) * 100}%`;
  document.querySelectorAll(".card").forEach(btn=>{
    btn.classList.toggle("unlocked", opened.has(btn.dataset.card));
  });
  if(count >= TOTAL_CARDS){
    allUnlocked.classList.remove("hidden");
    levelClear?.classList.remove("hidden");
    finalCard.classList.remove("hidden");
    finalCard.setAttribute("aria-hidden","false");
  }
}

function renderCards(){
  const grid = $("#cardsGrid");
  grid.innerHTML = cards.map((c, i) => `
    <button class="card c${i+1}" data-card="${c.id}" type="button" aria-label="Abrir ${c.titulo}">
      <span class="world-number">WORLD ${String(i+1).padStart(2,"0")} • AREA ${String(i+1).padStart(2,"0")}</span>
      <span class="card-icon" aria-hidden="true">${c.icon}</span>
      <strong>${c.titulo}</strong>
      <small>${c.nome} • ${c.hint}</small>
      <span class="enter-label">[ PRESS A / ENTER ]</span>
    </button>
  `).join("");

  grid.querySelectorAll(".card").forEach(btn=>{
    btn.addEventListener("mouseenter", ()=>playTone("hover"));
    btn.addEventListener("focus", ()=>playTone("hover"));
    btn.addEventListener("click", ()=>openCard(btn.dataset.card));
  });
  updateProgress();
}

function initAudio(){
  if(!audioCtx){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(Ctx) audioCtx = new Ctx();
  }
  if(audioCtx?.state === "suspended") audioCtx.resume();
}

function tone(freq=440, duration=.08, type="square", volume=.035, when=0){
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + when);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + when + .008);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + when + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + when);
  osc.stop(audioCtx.currentTime + when + duration + .02);
}

function playTone(kind){
  initAudio();
  if(!audioCtx) return;
  if(kind==="hover") tone(880,.045,"square",.018);
  if(kind==="click"){ tone(520,.07,"square",.03); tone(780,.06,"square",.02,.055); }
  if(kind==="unlock"){ tone(330,.09,"square",.03); tone(494,.09,"square",.03,.08); tone(659,.16,"square",.035,.16); }
  if(kind==="start"){ tone(220,.12,"sawtooth",.025); tone(330,.12,"square",.03,.11); tone(440,.12,"square",.035,.22); tone(660,.25,"square",.04,.33); }
  if(kind==="stadium"){ tone(130,.12,"sawtooth",.035); tone(196,.12,"square",.03,.13); tone(392,.2,"square",.035,.26); }
  if(kind==="dino"){ tone(90,.18,"sawtooth",.04); tone(72,.25,"sawtooth",.03,.19); tone(220,.15,"square",.025,.45); }
  if(kind==="pirate"){ tone(294,.1,"triangle",.03); tone(392,.1,"triangle",.03,.11); tone(523,.18,"triangle",.035,.22); }
  if(kind==="music"){ tone(440,.1,"square",.025); tone(554,.1,"square",.025,.11); tone(659,.18,"square",.03,.22); }
  if(kind==="books"){ tone(392,.1,"triangle",.025); tone(494,.1,"triangle",.025,.12); tone(587,.22,"triangle",.03,.24); }
  if(kind==="secret"){ tone(110,.12,"square",.03); tone(220,.12,"square",.03,.15); tone(440,.22,"square",.03,.3); }
  if(kind==="final"){ tone(261,.12,"square",.03); tone(329,.12,"square",.03,.12); tone(392,.12,"square",.03,.24); tone(523,.4,"square",.04,.36); }
}

function spawnSparkles(count=14){
  for(let i=0;i<count;i++){
    const s=document.createElement("span");
    s.className="spark";
    s.textContent=["✦","★","✧","·"][Math.floor(Math.random()*4)];
    s.style.left=(35+Math.random()*30)+"%";
    s.style.top=(35+Math.random()*30)+"%";
    s.style.setProperty("--dx",`${(Math.random()-.5)*260}px`);
    s.style.setProperty("--dy",`${(Math.random()-.5)*220}px`);
    s.style.fontSize=(10+Math.random()*20)+"px";
    sparkleLayer.appendChild(s);
    setTimeout(()=>s.remove(),800);
  }
}

function renderPlaylist(){
  if(!playlistList) return;
  const tracks = cards.filter(c => c.musica);
  if(!tracks.length){
    playlistList.innerHTML=`<div class="playlist-empty">♪ NENHUMA MÚSICA ADICIONADA AINDA.<br><small>Preencha o campo <b>musica</b> de cada amigo para montar a playlist.</small></div>`;
    return;
  }
  playlistList.innerHTML=tracks.map((c,i)=>`<button class="playlist-track" type="button" data-track-id="${escapeHtml(c.id)}">
    <span class="track-number">${String(i+1).padStart(2,"0")}</span><span class="track-note">♫</span><span class="track-info"><b>${escapeHtml(c.musicaNome || c.titulo)}</b><small>${escapeHtml(c.nome)}</small></span><span class="track-play">▶</span>
  </button>`).join("");
  playlistList.querySelectorAll(".playlist-track").forEach(btn=>btn.addEventListener("click",()=>playFriendMusic(btn.dataset.trackId)));
}

function playFriendMusic(id){
  const c=cards.find(x=>x.id===id);
  if(!c?.musica || !audioPlayer) return;
  initAudio();
  playTone("music");
  currentTrack=c;
  audioPlayer.src=c.musica;
  audioPlayer.play().catch(()=>{});
  if(nowPlaying) nowPlaying.textContent=`♫ ${c.musicaNome || c.titulo}`;
  if(nowPlayingFriend) nowPlayingFriend.textContent=`DE: ${c.nome}`;
  document.querySelectorAll(".playlist-track").forEach(btn=>btn.classList.toggle("playing",btn.dataset.trackId===id));
}

function attachMusicMarkup(c){
  if(!c.musica) return "";
  return `<div class="friend-music"><div class="friend-music-label">♫ MÚSICA DO AMIGO</div><button class="music-inline" type="button" data-music-id="${escapeHtml(c.id)}">▶ OUVIR: ${escapeHtml(c.musicaNome || c.titulo)}</button></div>`;
}

function openCard(id){
  const c=cards.find(x=>x.id===id);
  if(!c) return;
  openPreview(c);
}

function openPreview(c){
  initAudio();
  playTone("click");
  const world = String(cards.findIndex(x=>x.id===c.id)+1).padStart(2,"0");
  animation.className=`anim-wrap anim-preview preview-${c.tipoDeAnimacao}`;
  $("#modalFile").textContent=`PREVIEW_${c.id.toUpperCase()}.HTML`;
  animation.innerHTML=`
    <div class="preview-envelope" aria-hidden="true">
      <div class="preview-stamp">★</div>
      <div class="preview-icon">${c.icon}</div>
      <div class="preview-postmark">WORLD ${world}</div>
    </div>`;
  message.innerHTML=`
    <div class="preview-kicker">★ VOCÊ RECEBEU UM CARTÃO VIRTUAL ★</div>
    <h3 id="modalTitle">${escapeHtml(c.titulo)}</h3>
    <div class="preview-from">DE: <b>${escapeHtml(c.nome)}</b> &nbsp; • &nbsp; ASSUNTO: ${escapeHtml(c.hint)}</div>
    <p class="preview-copy">Uma pequena prévia foi carregada. O cartão de aniversário deste amigo está esperando para ser aberto.</p>
    <button class="open-friend-card" type="button" data-open-card="${escapeHtml(c.id)}">✉ ABRIR CARTÃO DO AMIGO ✉</button>
    <button class="back-btn preview-back" type="button" onclick="closeCard()">↩ VOLTAR AOS CARTÕES</button>`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>$(".open-friend-card")?.focus(),80);
}

function revealCard(id){
  const c=cards.find(x=>x.id===id);
  if(!c) return;

  // The click on "ABRIR CARTÃO" is the user's audio gesture.
  initAudio();
  playTone(
    c.tipoDeAnimacao==="stadium"?"stadium":
    c.tipoDeAnimacao==="dino"?"dino":
    c.tipoDeAnimacao==="pirate"?"pirate":
    c.tipoDeAnimacao==="music"?"music":
    c.tipoDeAnimacao==="books"?"books":"secret"
  );

  // Start the selected friend's music immediately, when possible.
  if(window.__renatinhoPlayCardMusic){
    window.__renatinhoPlayCardMusic(c);
  }

  const world = String(cards.findIndex(x=>x.id===id)+1).padStart(2,"0");
  showWorldStart(world, c.titulo);

  if(!opened.has(id)){
    opened.add(id);
    saveOpened();
    updateProgress();
  }

  setTimeout(()=>{
    animation.className=`anim-wrap anim-${c.tipoDeAnimacao}`;
    $("#modalFile").textContent=`${id.toUpperCase()}.EXE`;
    animation.innerHTML=`<div class="fake-photo" aria-hidden="true">${c.icon}</div>`;
    message.innerHTML = buildMessage(c);
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
    spawnSparkles(c.tipoDeAnimacao==="secret"?24:12);
    setTimeout(()=>$(".back-btn")?.focus(),80);
  }, 760);
}

function showWorldStart(world,title){
  if(!worldStart) return;
  worldStartSmall.textContent=`WORLD ${world}`;
  worldStartTitle.textContent=title;
  worldStart.classList.remove("hidden");
  worldStart.setAttribute("aria-hidden","false");
  worldStart.style.animation="none";
  void worldStart.offsetWidth;
  worldStart.style.animation="worldFade .95s ease forwards";
}

function buildMessage(c){
  const extra = c.tipoDeAnimacao==="secret"
    ? `<div class="terminal-lines"><div>&gt; ACCESSING SECRET FILE...</div><div>&gt; ████████████████████</div><div>&gt; PASSWORD ACCEPTED</div><div>&gt; MEMORY DECRYPTED ✓</div></div><div class="reveal">★ ${escapeHtml(c.titulo)} ★</div>`
    : c.tipoDeAnimacao==="stadium"
    ? `<div class="progress-line">MATCH START ★ HOME 00 : 00 AWAY</div>`
    : c.tipoDeAnimacao==="pirate"
    ? `<div class="progress-line">🧭 QUEST START • TREASURE MAP LOADED</div>`
    : c.tipoDeAnimacao==="music"
    ? `<div class="progress-line">♫ TRACK FOUND • PRESS PLAY (MÚSICA REAL ENTRA DEPOIS)</div>`
    : c.tipoDeAnimacao==="books"
    ? `<div class="progress-line">CHAPTER 01 → CHAPTER 02 → SPECIAL ENDING</div>`
    : `<div class="progress-line">FOSSIL / MEMORY / DISCOVERY FOUND ✓</div>`;

  return `<h3 id="modalTitle">${escapeHtml(c.titulo)}</h3>${extra}<p>${escapeHtml(c.mensagem)}</p>${attachMusicMarkup(c)}
    <button class="back-btn" type="button" onclick="closeCard()">↩ VOLTAR AOS CARTÕES</button>`;
}

function openFinal(){
  if(opened.size < TOTAL_CARDS) return;
  initAudio();
  playTone("final");
  animation.className="anim-wrap anim-final";
  $("#modalFile").textContent="CREATOR_FINAL.EXE";
  animation.innerHTML=`<div class="fake-photo" aria-hidden="true">♥</div>`;
  message.innerHTML=`<h3 id="modalTitle">★ CONGRATULATIONS, RENATINHO! ★</h3>
    <div class="reveal">ALL MEMORIES UNLOCKED</div>
    <p>Se você chegou até aqui, completou a missão. Este arquivo é da pessoa que montou tudo isso só para te desejar um feliz aniversário.</p>
    <p><b>FELIZ ANIVERSÁRIO, RENATINHO!!!</b><br>Que nunca faltem histórias para contar, músicas para ouvir, livros para escrever, aventuras para viver e pessoas para dividir tudo isso.</p>
    <button class="back-btn" type="button" onclick="closeCard()">★ MISSÃO CONCLUÍDA ★</button>`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  spawnSparkles(35);
}

function closeCard(){
  if(window.__renatinhoStopCardMusic) window.__renatinhoStopCardMusic();
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  animation.innerHTML="";
  const frame=document.querySelector("#cardMusicEmbed");
  if(frame) frame.remove();
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

enterBtn.addEventListener("click",()=>{
  initAudio();
  playTone("start");
  playTone("click");
  spawnSparkles(25);
  intro.classList.add("hidden");
  wall.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});

modal.addEventListener("click", (e)=>{
  const openBtn=e.target.closest(".open-friend-card");
  if(openBtn){ playTone("unlock"); revealCard(openBtn.dataset.openCard); return; }
  const musicBtn=e.target.closest(".music-inline");
  if(musicBtn){ playFriendMusic(musicBtn.dataset.musicId); }
});

$("#finalCard").addEventListener("click",openFinal);
closeBtn.addEventListener("click",()=>{playTone("click");closeCard()});
document.querySelector(".modal-backdrop").addEventListener("click",closeCard);
document.addEventListener("keydown",e=>{
  if(e.key==="Escape" && !modal.classList.contains("hidden")) closeCard();
});

async function loadSavedCards(){
  try{
    const res=await fetch('./cards/cards.json?v=7',{cache:'no-store'});
    if(res.ok){ const external=await res.json(); if(Array.isArray(external) && external.length) cards=external; }
  }catch(e){}
  renderCards(); renderPlaylist();
}
loadSavedCards();

playlistList?.addEventListener("click", (e)=>{
  const track=e.target.closest(".playlist-track");
  if(track) playFriendMusic(track.dataset.trackId);
});
playlistList?.addEventListener("keydown", (e)=>{ if(e.key==="Enter" || e.key===" "){ const track=e.target.closest(".playlist-track"); if(track){ e.preventDefault(); playFriendMusic(track.dataset.trackId); } } });
$("#playlistPlay")?.addEventListener("click",()=>{ initAudio(); audioPlayer?.play().catch(()=>{}); playTone("click"); });
$("#playlistPause")?.addEventListener("click",()=>{ audioPlayer?.pause(); playTone("click"); });
$("#playlistStop")?.addEventListener("click",()=>{ if(audioPlayer){ audioPlayer.pause(); audioPlayer.currentTime=0; } playTone("click"); });
audioPlayer?.addEventListener("timeupdate",()=>{ if(audioPlayer.duration && playlistProgress) playlistProgress.style.width=`${(audioPlayer.currentTime/audioPlayer.duration)*100}%`; });
audioPlayer?.addEventListener("ended",()=>{ document.querySelectorAll(".playlist-track").forEach(btn=>btn.classList.remove("playing")); if(playlistProgress) playlistProgress.style.width="0%"; });



/* ==========================================================
   V4 POLISH — interface sound, visitor counter, hover tilt
   ========================================================== */
(function v4Polish(){
  const counter = document.querySelector("#visitorCounter");
  const counter2 = document.querySelector("#visitorNumber");
  const key = "renatinho-visitor-count-v4";
  let n = Number(localStorage.getItem(key) || "1337");
  n += 1;
  localStorage.setItem(key, String(n));
  const txt = String(n).padStart(7,"0");
  if(counter) counter.textContent = txt;
  if(counter2) counter2.textContent = txt;

  // Tiny UI sound without external assets.
  let ac = null;
  function beep(freq=520,duration=.045,type="square",gain=.025){
    try{
      ac ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=ac.createOscillator(), g=ac.createGain();
      o.type=type; o.frequency.value=freq; g.gain.value=gain;
      o.connect(g); g.connect(ac.destination);
      const now=ac.currentTime;
      g.gain.setValueAtTime(gain,now);
      g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      o.start(now); o.stop(now+duration);
    }catch(e){}
  }
  document.addEventListener("pointerdown",e=>{
    const b=e.target.closest("button,a");
    if(!b) return;
    if(b.matches("#openMakerBtn,#exportMakerBtn,#randomMakerBtn")) {
      beep(740,.055,"square",.035);
      setTimeout(()=>beep(980,.045,"square",.025),45);
    } else {
      beep(410,.035,"square",.018);
    }
  },{passive:true});

  // Gentle pseudo-3D tilt on desktop cards.
  if(matchMedia("(pointer:fine)").matches){
    document.querySelectorAll(".card,.final-card,.maker-card-inner").forEach(el=>{
      el.addEventListener("pointermove",ev=>{
        const r=el.getBoundingClientRect();
        const x=(ev.clientX-r.left)/r.width-.5;
        const y=(ev.clientY-r.top)/r.height-.5;
        el.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-3px)`;
      });
      el.addEventListener("pointerleave",()=>{
        el.style.transform="";
      });
    });
  }
})();


/* ==========================================================
   V6 — MUSIC STARTS WHEN THE CARD OPENS
   The first user click that opens a card is the gesture that
   authorizes audio playback. External URLs are handled with
   a lightweight player link; local audio is played directly.
   ========================================================== */
(function cardOpeningMusic(){
  let currentAudio=null;
  let currentCard=null;
  const audioBar=document.querySelector("#cardOpenAudio");
  const label=document.querySelector("#cardMusicLabel");
  const toggle=document.querySelector("#cardMusicToggle");

  function stop(){
    if(currentAudio){ currentAudio.pause(); currentAudio.currentTime=0; currentAudio=null; }
    if(audioBar) audioBar.classList.remove("show");
  }

  function youtubeEmbed(url){
    try{
      const u=new URL(url);
      let id="";
      if(u.hostname.includes("youtu.be")) id=u.pathname.slice(1);
      if(u.hostname.includes("youtube.com")) id=u.searchParams.get("v") || u.pathname.split("/").pop();
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : "";
    }catch(e){return ""}
  }

  function spotifyEmbed(url){
    try{
      const u=new URL(url);
      const m=u.pathname.match(/\/(track|album|playlist|episode|show)\/([^/?]+)/);
      return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&autoplay=1` : "";
    }catch(e){return ""}
  }

  async function play(card){
    stop(); currentCard=card;
    const m=card?.cardConfig?.musica || {};
    const type=m.type || (card?.musicaNome==="YouTube"?"youtube":card?.musicaNome==="Spotify"?"spotify":"none");
    const src=card?.musica || m.url || "";
    if(!src || type==="none") return;

    // Direct audio files are the most reliable autoplay-after-click path.
    if(type==="file" && src.startsWith("data:audio/")){
      currentAudio=new Audio(src);
      currentAudio.loop=true;
      try{
        await currentAudio.play();
        if(audioBar){label.textContent=`♫ ${card.musicaNome||"NOW PLAYING"}`;audioBar.classList.add("show");}
      }catch(e){}
      return;
    }

    // For YouTube/Spotify, open an in-page mini player after the click.
    // This avoids silently navigating away from the birthday site.
    const embed=type==="youtube"?youtubeEmbed(src):type==="spotify"?spotifyEmbed(src):"";
    if(embed){
      let frame=document.querySelector("#cardMusicEmbed");
      if(!frame){
        frame=document.createElement("iframe");
        frame.id="cardMusicEmbed";
        frame.allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
        frame.style.cssText="position:fixed;left:50%;bottom:72px;transform:translateX(-50%);width:min(420px,88vw);height:84px;z-index:10000;border:5px ridge #fff;box-shadow:7px 7px #000;background:#000;";
        document.body.appendChild(frame);
      }
      frame.src=embed;
      if(audioBar){label.textContent=`♫ ${card.musicaNome||"NOW PLAYING"}`;audioBar.classList.add("show");}
    }
  }

  if(toggle){
    toggle.addEventListener("click",e=>{
      e.stopPropagation();
      if(currentAudio){
        if(currentAudio.paused){currentAudio.play();toggle.textContent="❚❚"}
        else {currentAudio.pause();toggle.textContent="▶"}
      }else{
        const frame=document.querySelector("#cardMusicEmbed");
        if(frame) frame.style.display=frame.style.display==="none"?"block":"none";
      }
    });
  }

  // Expose for the card-opening code. We hook the common click paths
  // without requiring changes to the card data format.
  window.__renatinhoPlayCardMusic=play;
  window.__renatinhoStopCardMusic=stop;
})();

/* V6 bridge: if your card-opening handler has the card object available,
   call window.__renatinhoPlayCardMusic(card) after the opening animation starts. */
