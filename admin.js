const $=s=>document.querySelector(s);
const ADMIN_CODE="RENATO-ADMIN-2026";
let cards=[];

$("#adminGateForm").addEventListener("submit",e=>{
  e.preventDefault();
  if($("#adminCode").value===ADMIN_CODE){
    $("#adminGate").classList.add("hidden-page");$("#adminPanel").classList.remove("hidden-page");
    sessionStorage.setItem("renatinho-admin-access","1");loadCurrent();
  }else $("#adminGateError").textContent="ACCESS DENIED";
});
if(sessionStorage.getItem("renatinho-admin-access")==="1"){ $("#adminGate").classList.add("hidden-page");$("#adminPanel").classList.remove("hidden-page"); loadCurrent(); }

function status(t,kind=""){const el=$("#adminStatus");el.textContent=t;el.className="access-status "+kind}
function render(){
  const list=$("#pendingList");
  if(!cards.length){list.innerHTML='<div class="admin-note">Nenhum cartão carregado.</div>';return}
  list.innerHTML=cards.map((c,i)=>`<div class="pending-item"><span><b>${escapeHtml(c.nome||"AMIGO")}</b><br>${escapeHtml(c.titulo||"SEM TÍTULO")}</span><button data-i="${i}" type="button">REMOVE</button></div>`).join("");
  list.querySelectorAll("button").forEach(b=>b.onclick=()=>{cards.splice(Number(b.dataset.i),1);render();status("● CARD REMOVED FROM QUEUE")});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

async function addFiles(files){
  for(const f of files){
    try{
      const d=JSON.parse(await f.text());
      if(!d.id||!d.nome||!d.mensagem) throw new Error("Formato inválido");
      d.status="approved";
      cards.push(d);
    }catch(e){status(`⚠ NÃO FOI POSSÍVEL IMPORTAR ${f.name}`,"error")}
  }
  render();status(`● ${cards.length} CARD(S) NA FILA`);
}
$("#cardFiles").addEventListener("change",e=>addFiles([...e.target.files]));
const dz=$("#dropZone");
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag")}));
dz.addEventListener("drop",e=>addFiles([...e.dataTransfer.files].filter(f=>f.name.endsWith(".json"))));

async function loadCurrent(){
  try{
    const r=await fetch("./cards/cards.json",{cache:"no-store"});
    const data=await r.json();
    if(Array.isArray(data)){cards=data;render();status(`● ${cards.length} PUBLICADOS CARREGADOS`)}
  }catch(e){status("⚠ NÃO FOI POSSÍVEL CARREGAR CARDS.JSON","error")}
}
$("#loadCurrentBtn").addEventListener("click",loadCurrent);

$("#exportCardsBtn").addEventListener("click",()=>{
  if(!cards.length){status("⚠ NÃO HÁ CARDS PARA PUBLICAR","warning");return}
  const clean=cards.map(c=>({...c,status:"published"}));
  const blob=new Blob([JSON.stringify(clean,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cards.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  status("★ CARDS.JSON PUBLICADO LOCALMENTE — SUBSTITUA NO GITHUB ★");
});
