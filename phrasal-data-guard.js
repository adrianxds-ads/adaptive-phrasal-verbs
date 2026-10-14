(()=>{'use strict';
const KEY=STORAGE_KEY,DB='xds-phrasal-undo-v1',clone=x=>JSON.parse(JSON.stringify(x));
async function digest(x){const bytes=new TextEncoder().encode(JSON.stringify({raw:x.raw,memory:x.memory,at:x.at}));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const status=document.createElement('p');status.id='phrasalBackupStatus';status.setAttribute('role','status');document.getElementById('importBtn').parentElement.after(status);
const undo=document.createElement('button');undo.id='phrasalUndoImport';undo.className='ghost small';undo.textContent='DESHACER IMPORTACIÓN';status.before(undo);
let busy=false;
async function db(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);r.onblocked=()=>no(Error('Recuperación bloqueada'));});}
async function journal(mode,record){const d=await db();try{return await new Promise((ok,no)=>{const t=d.transaction('snapshots',mode),s=t.objectStore('snapshots'),r=record?s.put(record):s.get('latest');t.oncomplete=()=>ok(r.result);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error||Error('Diario abortado'));});}finally{d.close();}}
function validate(x){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Copia inválida');if(x.app&&x.app!=='adaptive-phrasal-verbs')throw Error('Copia de otra aplicación');const raw=x.state||x;if(!raw.items||typeof raw.items!=='object'||Array.isArray(raw.items)||!Array.isArray(raw.history)||!Array.isArray(raw.answerHistory))throw Error('Esquema de progreso incompatible');
for(const k of ['answers','correct','sessions','level'])if(!Number.isSafeInteger(raw[k])||raw[k]<0)throw Error('Contadores inválidos');if(raw.correct>raw.answers)throw Error('Aciertos superiores a respuestas');
const queue=[raw];let count=0;while(queue.length){const v=queue.pop();if(++count>100000)throw Error('Copia demasiado compleja');for(const [k,w] of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Propiedad peligrosa');if(w&&typeof w==='object')queue.push(w);}}
return clone(raw);}
function idle(){const game=document.getElementById('gameScreen');if(game&&!game.classList.contains('hidden'))throw Error('Termina la sesión antes de importar');}
function render(){renderHome();window.AdaptiveLanguageDashboard?.refresh?.();}
async function restore(rec){if(rec.digest!==await digest(rec))throw Error('Diario de recuperación alterado');if(rec.raw===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,rec.raw);if(localStorage.getItem(KEY)!==rec.raw)throw Error('Restauración no verificada');state=clone(rec.memory);render();}
async function importSafe(file){if(busy)return;busy=true;try{idle();if(!file||file.size>25*1024*1024)throw Error('Archivo vacío o demasiado grande');const incoming=validate(JSON.parse(await file.text()));if(!confirm('Importar '+incoming.answers+' respuestas y '+incoming.sessions+' sesiones? Se guardará una copia para deshacer.'))return;
const rec={id:'latest',at:Date.now(),raw:localStorage.getItem(KEY),memory:clone(state)};rec.digest=await digest(rec);await journal('readwrite',rec);const check=await journal('readonly');if(JSON.stringify(check)!==JSON.stringify(rec))throw Error('Diario no verificado');
try{const encoded=JSON.stringify(incoming);localStorage.setItem(KEY,encoded);if(localStorage.getItem(KEY)!==encoded)throw Error('Escritura no verificada');state=loadState();render();status.textContent='Importación comprobada. Puedes deshacerla.';}
catch(e){await restore(rec);throw Error('Importación revertida: '+e.message);}
}catch(e){status.textContent=e.message;}finally{busy=false;}}
document.getElementById('importFile').addEventListener('change',e=>{e.stopImmediatePropagation();const file=e.target.files[0];e.target.value='';importSafe(file);},true);
undo.onclick=async()=>{if(busy)return;busy=true;try{idle();const rec=await journal('readonly');if(!rec)throw Error('No hay una importación anterior');if(!confirm('Recuperar el progreso anterior a la última importación?'))return;await restore(rec);status.textContent='Estado anterior recuperado y verificado.';}catch(e){status.textContent=e.message;}finally{busy=false;}};
window.PhrasalDataGuard=Object.freeze({validate,importSafe});
})();
