const $ = s => document.querySelector(s);

const ACCESS_CODE = "RENATINHO2000";
const gate = $("#gate"), factory = $("#factory");
const gateForm = $("#gateForm"), accessCode = $("#accessCode"), gateError = $("#gateError");

gateForm.addEventListener("submit", e=>{
  e.preventDefault();
  if((accessCode.value||"").trim().toUpperCase() === ACCESS_CODE){
    gate.classList.add("hidden-page"); factory.classList.remove("hidden-page");
    sessionStorage.setItem("renatinho-friend-access","1");
    playTone("unlock");
    window.scrollTo(0,0);
  } else {
    gateError.textContent="ACCESS DENIED • CHECK THE CODE";
    playTone("error");
  }
});
if(sessionStorage.getItem("renatinho-friend-access")==="1"){
  gate.classList.add("hidden-page"); factory.classList.remove("hidden-page");
}

let audioCtx=null;
function playTone(kind="click"){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const seq = kind==="unlock" ? [[520,.05],[740,.06],[980,.09]] : kind==="error" ? [[180,.09],[120,.12]] : [[420,.035]];
    let t=audioCtx.currentTime;
    seq.forEach(([f,d])=>{
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type="square";o.frequency.value=f;o.connect(g);g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.start(t);o.stop(t+d);t+=d*.8;
    });
  }catch(e){}
}

const mkName=$("#mkName"),mkTitle=$("#mkTitle"),mkMessage=$("#mkMessage"),mkFont=$("#mkFont"),mkAlign=$("#mkAlign");
const mkImage=$("#mkImage"),mkTheme=$("#mkTheme"),mkAnim=$("#mkAnim"),mkMusicType=$("#mkMusicType"),mkMusicUrl=$("#mkMusicUrl"),mkMusicFile=$("#mkMusicFile");
const previewTitle=$("#previewTitle"),previewFrom=$("#previewFrom"),previewMessage=$("#previewMessage"),previewMusic=$("#previewMusic"),previewEmojis=$("#previewEmojis"),previewIcon=$("#previewIcon"),previewImage=$("#previewImage");
const makerPreview=$("#makerPreview"),makerStatus=$("#makerStatus"),liveStatus=$("#liveStatus");
let makerEmojis=["✨","💚","⭐"], imageData="", imageName="";
let musicData="", musicName="";

function readAudioFile(file){
  return new Promise((resolve,reject)=>{
    if(!file){ resolve(""); return; }
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}

async function updateMusicFile(){
  const f=mkMusicFile.files?.[0];
  musicName=f?.name||"";
  musicData=f ? await readAudioFile(f) : "";
  updateMaker();
}


const themeMap={green:["#42ce78","#0b5734","#30050e"],red:["#ff5165","#8e0d1e","#160006"],gold:["#ffe27a","#9b6c10","#251600"],purple:["#b56dff","#54227e","#13051e"],blue:["#64c8ff","#13588a","#031322"],pink:["#ff86c8","#9a2269","#260317"]};
const fontMap={pixel:"var(--pixel)",typewriter:'"Courier New",monospace',bubble:'Arial Rounded MT Bold,Arial,sans-serif',hand:'Comic Sans MS,cursive'};
const icons={powerpoint:"★",glitter:"✨",bounce:"💥",terminal:"⌨️",vinyl:"💿",dino:"🦖"};

function updateMaker(){
  const name=(mkName.value||"AMIGO").trim(),title=(mkTitle.value||"MEU CARTÃO").trim(),msg=(mkMessage.value||"Sua mensagem aparece aqui.").trim();
  previewTitle.textContent=title;previewFrom.textContent=`DE: ${name}`;previewMessage.textContent=msg;previewEmojis.textContent=makerEmojis.join("  ");
  const t=themeMap[mkTheme.value]||themeMap.green;
  makerPreview.style.background=`radial-gradient(circle at 50% 15%,${t[0]},${t[1]} 55%,${t[2]})`;
  previewIcon.textContent=icons[mkAnim.value]||"★";
  previewTitle.style.fontFamily=fontMap[mkFont.value]||fontMap.pixel;
  previewMessage.style.textAlign=mkAlign.value;
  previewMusic.textContent=mkMusicType.value==="none"?"♫ NO MUSIC SELECTED":mkMusicType.value==="youtube"?"▶ YOUTUBE PLAYER READY":mkMusicType.value==="spotify"?"♫ SPOTIFY PLAYER READY":`♫ ${mkMusicFile.files?.[0]?.name||"AUDIO FILE"}`;
  mkMusicUrl.classList.toggle("hidden",!(mkMusicType.value==="youtube"||mkMusicType.value==="spotify"));
  $("#mkMusicFileLabel").classList.toggle("hidden",mkMusicType.value!=="file");
  makerStatus.textContent=`● LIVE • ${name.toUpperCase()} • READY TO EXPORT`;
  liveStatus.textContent=`● LIVE • ${name.toUpperCase()} • ${title.toUpperCase()}`;
}
[mkName,mkTitle,mkMessage,mkFont,mkAlign,mkTheme,mkAnim,mkMusicType,mkMusicUrl,mkMusicFile].forEach(el=>el?.addEventListener("input",updateMaker));
[mkFont,mkAlign,mkTheme,mkAnim,mkMusicType].forEach(el=>el?.addEventListener("change",updateMaker));

$("#emojiPicks").querySelectorAll("button").forEach(btn=>{
  if(makerEmojis.includes(btn.dataset.emoji)) btn.classList.add("selected");
  btn.addEventListener("click",()=>{
    const e=btn.dataset.emoji;
    makerEmojis=makerEmojis.includes(e)?makerEmojis.filter(x=>x!==e):[...makerEmojis,e];
    btn.classList.toggle("selected",makerEmojis.includes(e));updateMaker();playTone("click");
  });
});

mkMusicFile.addEventListener("change",updateMusicFile);

mkImage.addEventListener("change",()=>{
  const f=mkImage.files?.[0]; if(!f)return;
  imageName=f.name;
  const r=new FileReader();
  r.onload=()=>{imageData=r.result;previewImage.src=imageData;previewImage.classList.remove("hidden");updateMaker()};
  r.readAsDataURL(f);
});


let previewAudio=null;
function stopPreviewAudio(){
  if(previewAudio){ previewAudio.pause(); previewAudio.currentTime=0; previewAudio=null; }
}
async function playPreviewMusic(){
  stopPreviewAudio();
  if(mkMusicType.value==="file" && musicData){
    previewAudio=new Audio(musicData);
  }else if(mkMusicType.value==="youtube" || mkMusicType.value==="spotify"){
    // Browser preview cannot reliably play third-party embeds from a plain URL.
    return;
  }else return;
  try{ await previewAudio.play(); }catch(e){}
}

function randomMaker(){
  const names=["AMIGO","MIGUXO","THE LEGEND","COMPANHEIRO","BFF","PLAYER 02"];
  const titles=["★ BEST MEMORIES ★","A MESSAGE FOR RENATINHO","LEVEL UP!","PRESS PLAY!","SECRET INTERNET FILE","BIRTHDAY 2000"];
  const msgs=[
    "Renatinho, que seu novo nível venha cheio de histórias absurdas, músicas boas e momentos que merecem virar memória.",
    "Feliz aniversário! Obrigado por todas as risadas, conversas e aventuras. Que essa fase seja inesquecível.",
    "Arquivo recuperado com sucesso: uma amizade incrível. Parabéns, Renatinho! Que nunca faltem motivos para comemorar."
  ];
  mkName.value=names[Math.floor(Math.random()*names.length)];
  mkTitle.value=titles[Math.floor(Math.random()*titles.length)];
  mkMessage.value=msgs[Math.floor(Math.random()*msgs.length)];
  mkTheme.value=Object.keys(themeMap)[Math.floor(Math.random()*6)];
  mkAnim.value=Object.keys(icons)[Math.floor(Math.random()*6)];
  makerEmojis=["✨","⭐","💚","❤️","🦖","⚽","🎵","💿","📖","🦋","💥","☠️"].sort(()=>Math.random()-.5).slice(0,3);
  $("#emojiPicks").querySelectorAll("button").forEach(b=>b.classList.toggle("selected",makerEmojis.includes(b.dataset.emoji)));
  updateMaker();playTone("unlock");
}
$("#randomMakerBtn").addEventListener("click",randomMaker);
$("#previewMakerBtn").addEventListener("click",async()=>{updateMaker();playTone("unlock");await playPreviewMusic();makerPreview.animate([{transform:"scale(.98)"},{transform:"scale(1.02)"},{transform:"scale(1)"}],{duration:450})});

$("#exportMakerBtn").addEventListener("click",()=>{
  if(!mkName.value.trim()||!mkMessage.value.trim()){makerStatus.textContent="★ NAME + MESSAGE ARE REQUIRED ★";playTone("error");return}
  const id=(mkName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"friend")+"-"+Date.now().toString(36).slice(-5);
  const imgStyle=document.querySelector('input[name="imgStyle"]:checked')?.value||"polaroid";
  const data={
    version:"renatinho-card-v5",
    id,nome:mkName.value.trim(),titulo:mkTitle.value.trim()||"MEU CARTÃO",
    icon:icons[mkAnim.value]||"★",hint:"FRIEND CARD • CLASSIFIED",
    mensagem:mkMessage.value.trim(),fotos:imageData?[{data:imageData,nome:imageName,style:imgStyle}]:[],
    musica:mkMusicType.value==="file"?musicData:mkMusicUrl.value.trim(),
    musicaNome:mkMusicType.value==="youtube"?"YouTube":mkMusicType.value==="spotify"?"Spotify":musicName,
    musicaAutoPlay:true,
    cardConfig:{
      fonte:mkFont.value,alinhamento:mkAlign.value,tema:mkTheme.value,animacao:mkAnim.value,emojis:makerEmojis,
      efeitos:{glitter:$("#fxGlitter").checked,sparkle:$("#fxSparkle").checked,floatingEmojis:$("#fxFloat").checked,scanlines:$("#fxScan").checked},
      musica:{type:mkMusicType.value,url:mkMusicUrl.value.trim(),fileName:musicName,autoPlay:true}
    },
    status:"pending-admin-approval",createdAt:new Date().toISOString()
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`cartao-${id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  makerStatus.textContent="★ CARTÃO SALVO! ENVIE O .JSON PARA A GIOVANA ★";playTone("unlock");
});

updateMaker();
