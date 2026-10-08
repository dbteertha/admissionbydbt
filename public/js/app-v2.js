const DBT_ADMIN_MODE=location.pathname==='/admin'||location.pathname==='/admin/';
let dbtAdminConfig={version:1,updatedAt:0,text:{},hidden:{},orders:{}};
let dbtAdminSelected=null,dbtAdminApplying=false,dbtAdminSaveTimer=null,dbtAdminKey='';
let dbtAdminUndo=[];
try{dbtAdminKey=sessionStorage.getItem('dbt-admin-key')||''}catch(e){}
if(DBT_ADMIN_MODE)document.body.classList.add('admin-mode');

function dbtAdminStableKey(el){
  if(!el||el===document.body)return 'body';
  if(el.id)return 'id:'+el.id;
  const parts=[];let cur=el,depth=0;
  while(cur&&cur!==document.body&&depth<9){
    let seg=cur.tagName.toLowerCase();
    const cls=[...cur.classList].filter(x=>!x.startsWith('admin-')).slice(0,2);
    if(cls.length)seg+='.'+cls.join('.');
    const p=cur.parentElement;
    if(p){
      const same=[...p.children].filter(x=>x.tagName===cur.tagName);
      if(same.length>1)seg+=':nth-'+(same.indexOf(cur)+1);
    }
    parts.unshift(seg);
    if(p&&p.id){parts.unshift('id:'+p.id);break}
    cur=p;depth++;
  }
  return parts.join('>');
}
function dbtAdminIsIgnored(el){
  return !el||el.closest('#adminEditor')||['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','CANVAS'].includes(el.tagName);
}
function dbtAdminCanEditText(el){
  if(!el||dbtAdminIsIgnored(el))return false;
  const kids=[...el.children].filter(x=>!['BR'].includes(x.tagName));
  return kids.length===0 && (el.textContent||'').trim().length>0;
}
function dbtAdminScan(root=document.body){
  const list=root===document.body?[...document.body.querySelectorAll('*')]:[root,...root.querySelectorAll('*')];
  for(const el of list){
    if(dbtAdminIsIgnored(el))continue;
    if(!el.dataset.adminKey)el.dataset.adminKey=dbtAdminStableKey(el);
    if(dbtAdminCanEditText(el)&&el.dataset.adminOriginalText===undefined)el.dataset.adminOriginalText=el.textContent;
  }
}
function dbtAdminFind(key){
  if(!key)return null;
  return [...document.querySelectorAll('[data-admin-key]')].find(x=>x.dataset.adminKey===key)||null;
}
function dbtAdminApply(){
  if(dbtAdminApplying)return;
  dbtAdminApplying=true;
  dbtAdminScan();
  for(const el of document.querySelectorAll('[data-admin-key]')){
    const key=el.dataset.adminKey;
    if(Object.prototype.hasOwnProperty.call(dbtAdminConfig.text,key)&&dbtAdminCanEditText(el)){
      el.textContent=dbtAdminConfig.text[key];
    }
    if(dbtAdminConfig.hidden[key]){
      el.dataset.adminHidden='1';
      if(!DBT_ADMIN_MODE)el.style.setProperty('display','none','important');
      else el.style.removeProperty('display');
    }else{
      delete el.dataset.adminHidden;
      if(el.style.getPropertyPriority('display')==='important'&&el.style.display==='none')el.style.removeProperty('display');
    }
  }
  for(const [parentKey,order] of Object.entries(dbtAdminConfig.orders||{})){
    const parent=dbtAdminFind(parentKey);
    if(!parent||!Array.isArray(order))continue;
    const map=new Map([...parent.children].map(x=>[x.dataset.adminKey,x]));
    for(const childKey of order){const child=map.get(childKey);if(child)parent.appendChild(child)}
  }
  dbtAdminApplying=false;
}
async function dbtAdminLoad(){
  try{
    const r=await fetch('/api/admin-content');
    const j=await r.json();
    if(j&&j.config){
      dbtAdminConfig=j.config;
      dbtAdminApply();
      const s=document.getElementById('adminEditorStatus');if(s&&DBT_ADMIN_MODE)s.textContent='Site content loaded.';
    }
  }catch(e){
    const s=document.getElementById('adminEditorStatus');if(s&&DBT_ADMIN_MODE)s.textContent='Could not load saved site changes.';
  }
}
function dbtAdminSnapshot(){
  dbtAdminUndo.push(JSON.stringify(dbtAdminConfig));
  if(dbtAdminUndo.length>30)dbtAdminUndo.shift();
}
function dbtAdminRecordOrder(parent){
  if(!parent||dbtAdminIsIgnored(parent))return;
  dbtAdminScan(parent);
  const pkey=parent.dataset.adminKey||dbtAdminStableKey(parent);
  parent.dataset.adminKey=pkey;
  dbtAdminConfig.orders[pkey]=[...parent.children].filter(x=>x.dataset.adminKey&&!dbtAdminIsIgnored(x)).map(x=>x.dataset.adminKey);
  dbtAdminConfig.updatedAt=Date.now();
  dbtAdminQueueSave();
}
function dbtAdminSelect(el){
  if(!DBT_ADMIN_MODE||dbtAdminIsIgnored(el))return;
  if(dbtAdminSelected)dbtAdminSelected.classList.remove('admin-selected');
  dbtAdminSelected=el;
  dbtAdminScan(el);
  el.classList.add('admin-selected');
  el.draggable=true;
  const s=document.getElementById('adminEditorStatus');
  if(s)s.textContent='Selected: '+el.tagName.toLowerCase()+(el.id?' #'+el.id:'');
}
function dbtAdminEditSelected(){
  const el=dbtAdminSelected;
  if(!el||!dbtAdminCanEditText(el)){document.getElementById('adminEditorStatus').textContent='Select a text item first.';return}
  dbtAdminSnapshot();
  el.contentEditable='true';el.dataset.adminEditing='1';el.focus();
  const finish=()=>{
    el.contentEditable='false';delete el.dataset.adminEditing;
    dbtAdminConfig.text[el.dataset.adminKey]=el.textContent;
    dbtAdminConfig.updatedAt=Date.now();
    dbtAdminQueueSave();
    el.removeEventListener('blur',finish);
  };
  el.addEventListener('blur',finish);
}
function dbtAdminDeleteSelected(){
  const el=dbtAdminSelected;if(!el)return;
  dbtAdminSnapshot();
  dbtAdminConfig.hidden[el.dataset.adminKey]=true;
  dbtAdminConfig.updatedAt=Date.now();
  el.dataset.adminHidden='1';el.classList.remove('admin-selected');dbtAdminSelected=null;
  dbtAdminQueueSave();
}
function dbtAdminMove(dir){
  const el=dbtAdminSelected;if(!el||!el.parentElement)return;
  const sib=dir<0?el.previousElementSibling:el.nextElementSibling;if(!sib)return;
  dbtAdminSnapshot();
  const p=el.parentElement;
  if(dir<0)p.insertBefore(el,sib);else p.insertBefore(sib,el);
  dbtAdminRecordOrder(p);
}
function dbtAdminResetSelected(){
  const el=dbtAdminSelected;if(!el)return;
  dbtAdminSnapshot();
  const key=el.dataset.adminKey;
  delete dbtAdminConfig.text[key];delete dbtAdminConfig.hidden[key];
  if(el.dataset.adminOriginalText!==undefined&&dbtAdminCanEditText(el))el.textContent=el.dataset.adminOriginalText;
  delete el.dataset.adminHidden;el.style.removeProperty('display');
  dbtAdminConfig.updatedAt=Date.now();dbtAdminQueueSave();
}
async function dbtAdminSave(){
  if(!DBT_ADMIN_MODE)return;
  if(!dbtAdminKey){
    document.getElementById('adminEditorStatus').textContent='Enter the admin password first.';
    return;
  }
  clearTimeout(dbtAdminSaveTimer);
  const s=document.getElementById('adminEditorStatus');s.textContent='Saving for everyone…';
  try{
    const r=await fetch('/api/admin-content',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-key':dbtAdminKey},body:JSON.stringify(dbtAdminConfig),cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(r.status===401){s.textContent='Wrong admin password.';return}
    if(r.status===503){s.textContent='ADMIN_KEY is not set in Vercel yet.';return}
    if(!r.ok)throw new Error(j.error||'save_failed');
    dbtAdminConfig=j.config||dbtAdminConfig;s.textContent='Saved for the whole site ✓';
  }catch(e){s.textContent='Save failed. Try again.'}
}
function dbtAdminQueueSave(){
  if(!DBT_ADMIN_MODE)return;
  clearTimeout(dbtAdminSaveTimer);
  dbtAdminSaveTimer=setTimeout(dbtAdminSave,850);
}
function dbtAdminBind(){
  if(!DBT_ADMIN_MODE)return;
  const input=document.getElementById('adminKeyInput');
  input.value=dbtAdminKey;
  document.getElementById('adminLoginBtn').onclick=()=>{dbtAdminKey=input.value.trim();try{sessionStorage.setItem('dbt-admin-key',dbtAdminKey)}catch(e){}dbtAdminSave()};
  document.getElementById('adminEditBtn').onclick=dbtAdminEditSelected;
  document.getElementById('adminParentBtn').onclick=()=>{if(dbtAdminSelected&&dbtAdminSelected.parentElement&&!dbtAdminIsIgnored(dbtAdminSelected.parentElement))dbtAdminSelect(dbtAdminSelected.parentElement)};
  document.getElementById('adminUpBtn').onclick=()=>dbtAdminMove(-1);
  document.getElementById('adminDownBtn').onclick=()=>dbtAdminMove(1);
  document.getElementById('adminDeleteBtn').onclick=dbtAdminDeleteSelected;
  document.getElementById('adminResetBtn').onclick=dbtAdminResetSelected;
  document.getElementById('adminUndoBtn').onclick=()=>{if(!dbtAdminUndo.length)return;dbtAdminConfig=JSON.parse(dbtAdminUndo.pop());dbtAdminSave().then(()=>location.reload())};
  document.getElementById('adminSaveBtn').onclick=dbtAdminSave;

  document.addEventListener('click',e=>{
    if(e.target.closest('#adminEditor'))return;
    const el=e.target.closest('[data-admin-key]');
    if(!el)return;
    e.preventDefault();e.stopPropagation();dbtAdminSelect(el);
  },true);
  document.addEventListener('dblclick',e=>{
    if(e.target.closest('#adminEditor'))return;
    const el=e.target.closest('[data-admin-key]');if(el){e.preventDefault();e.stopPropagation();dbtAdminSelect(el);dbtAdminEditSelected()}
  },true);
  document.addEventListener('dragstart',e=>{
    const el=e.target.closest('[data-admin-key]');
    if(!el||el!==dbtAdminSelected){e.preventDefault();return}
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',el.dataset.adminKey);
  },true);
  document.addEventListener('dragover',e=>{
    const target=e.target.closest('[data-admin-key]');
    if(!target||!dbtAdminSelected||target.parentElement!==dbtAdminSelected.parentElement)return;
    e.preventDefault();e.dataTransfer.dropEffect='move';
  },true);
  document.addEventListener('drop',e=>{
    const target=e.target.closest('[data-admin-key]');
    const el=dbtAdminSelected;
    if(!target||!el||target===el||target.parentElement!==el.parentElement)return;
    e.preventDefault();dbtAdminSnapshot();
    const r=target.getBoundingClientRect();
    const after=e.clientY>r.top+r.height/2;
    target.parentElement.insertBefore(el,after?target.nextSibling:target);
    dbtAdminRecordOrder(el.parentElement);dbtAdminSelect(el);
  },true);
}
const dbtAdminObserver=new MutationObserver(muts=>{
  if(dbtAdminApplying)return;
  let changed=false;
  for(const m of muts){for(const n of m.addedNodes){if(n.nodeType===1){dbtAdminScan(n);changed=true}}}
  if(changed)setTimeout(dbtAdminApply,0);
});
dbtAdminScan();
dbtAdminObserver.observe(document.body,{childList:true,subtree:true});
dbtAdminBind();
dbtAdminLoad();
// Public admin content is loaded once at boot; CDN handles scale.

let TARGET=new Date('2026-12-05T10:00:00+06:00'); const START=new Date('2026-08-04T00:00:00+06:00');
function phaseFor(days){
  if(days<=1)return {name:'EXAM MODE',stat:'Exam',note:'Stay calm. Execute.',msg:'You prepared for this. Keep your head clear and execute one question at a time.'};
  if(days<=7)return {name:'FINAL SPRINT',stat:'Final sprint',note:'Revise. Rest. Execute.',msg:'Protect your confidence. Revise what matters, sleep properly, and keep moving.'};
  if(days<=14)return {name:'MOCK SPRINT',stat:'Mocks',note:'Practice > new topics',msg:'The fastest gains now come from timed practice, mistakes, and focused revision.'};
  if(days<=30)return {name:'REVIEW STAGE',stat:'Revision',note:'Test what you remember',msg:'Test yourself, solve questions, check mistakes, and try again.'};
  if(days<=60)return {name:'BUILD + REVISE',stat:'Build + revise',note:'Consistency compounds',msg:'A strong day does not need to be perfect. Finish the important work and come back tomorrow.'};
  return {name:'BUILD BASICS',stat:'Build',note:'Study every day',msg:'Learn the basics now. Study one focused day at a time.'};
}
function countdown(){
  const now=new Date(), diff=Math.max(0,TARGET-now), span=(TARGET-START),
    total=Math.round(span/86400000)+1,
    passed=Math.max(0,Math.min(total,Math.floor((now-START)/86400000)));
  const days=Math.floor(diff/86400000),weeks=Math.floor(days/7),
    h=Math.floor(diff/3600000)%24,m=Math.floor(diff/60000)%60,s=Math.floor(diff/1000)%60;
  daysEl.textContent=days;weeksEl.textContent=String(weeks).padStart(2,'0');
  hoursEl.textContent=String(h).padStart(2,'0');minsEl.textContent=String(m).padStart(2,'0');secsEl.textContent=String(s).padStart(2,'0');
  const p=span>0?Math.max(0,Math.min(100,((now-START)/span)*100)):0;
  fill.style.width=p+'%';pct.textContent=p.toFixed(1)+'%';passedEl.textContent=passed+' Passed';totalEl.textContent=total+' Total';
  const ph=phaseFor(days);
  heroPhase.textContent=ph.name;heroMessage.textContent=ph.msg;
  if(typeof statPhase!=='undefined'&&statPhase){statPhase.textContent=ph.stat;if(typeof statPhaseNote!=='undefined'&&statPhaseNote)statPhaseNote.textContent=ph.note;}
}const daysEl=document.getElementById('days'),weeksEl=document.getElementById('weeks'),hoursEl=document.getElementById('hours'),minsEl=document.getElementById('mins'),secsEl=document.getElementById('secs'),fill=document.getElementById('fill'),pct=document.getElementById('pct'),passedEl=document.getElementById('passed'),totalEl=document.getElementById('total'); countdown();
const BOOT_EVENTS=(()=>{
  const node=document.getElementById('dbtBootEvents');
  if(!node)return [];
  try{return JSON.parse(node.textContent||'[]')}catch(e){return []}
})();
let all=BOOT_EVENTS.slice(),view=new Date(2026,11,1),sourceHealth=[];
const STAR_KEY='admissionbydbt-starred-v1';
const COUNTDOWN_TARGET_KEY='admissionbydbt-countdown-target-v1';
const HOME_SYNC_CODE_KEY='admissionbydbt-home-sync-code-v1';
const HOME_SYNC_STATE_KEY='admissionbydbt-home-sync-state-v1';
const EVENT_CACHE_KEY='admissionbydbt-events-cache-v1';
let homeSyncCode='';
try{homeSyncCode=localStorage.getItem(HOME_SYNC_CODE_KEY)||''}catch(e){}
let homeSyncState=null;
try{homeSyncState=JSON.parse(localStorage.getItem(HOME_SYNC_STATE_KEY)||'null')}catch(e){homeSyncState=null}
let homeSyncApplying=false,homeSyncConfigured=true;
let countdownTargetKey='';
try{countdownTargetKey=localStorage.getItem(COUNTDOWN_TARGET_KEY)||''}catch(e){}
let starred=new Set();
try{starred=new Set(JSON.parse(localStorage.getItem(STAR_KEY)||'[]'))}catch(e){starred=new Set()}

function eventKey(e){return e.title+'|'+e.date}
function isStarred(e){return starred.has(eventKey(e))}
function saveStars(){localStorage.setItem(STAR_KEY,JSON.stringify([...starred]))}
function normalizeSyncCode(v){
  const raw=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!raw)return '';
  const body=raw.startsWith('DBT')?raw.slice(3):raw;
  return 'DBT-'+body.slice(0,4)+'-'+body.slice(4,8)+'-'+body.slice(8,12)+'-'+body.slice(12,16);
}
function compactSyncCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function validSyncCode(v){return /^DBT[A-HJ-NP-Z2-9]{16}$/.test(compactSyncCode(v))}
function generateSyncCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let body='';for(let i=0;i<16;i++)body+=alphabet[bytes[i]%alphabet.length];
  return normalizeSyncCode('DBT'+body);
}
function ensureSyncCode(){
  if(validSyncCode(homeSyncCode))return normalizeSyncCode(homeSyncCode);
  homeSyncCode=generateSyncCode();
  try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
  return homeSyncCode;
}
function currentSyncState(updatedAt=Date.now()){
  return {version:1,updatedAt,starred:[...starred],countdownTargetKey,calendarView,calendarFilter};
}
function saveLocalSyncState(updatedAt=Date.now()){
  if(homeSyncApplying)return;
  const state=currentSyncState(updatedAt);
  homeSyncState=state;
  try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
  setSyncUi('','Save');
}
function setSyncUi(mode,text){
  const b=document.getElementById('homeSyncButton'),t=document.getElementById('homeSyncText');
  if(!b||!t)return;
  b.classList.remove('saved','saving','offline');
  if(mode)b.classList.add(mode);
  t.textContent=text||'Save';
}
function applySyncState(state){
  if(!state||typeof state!=='object')return;
  homeSyncApplying=true;
  if(Array.isArray(state.starred)){
    starred=new Set(state.starred);
    try{localStorage.setItem(STAR_KEY,JSON.stringify([...starred]))}catch(e){}
  }
  countdownTargetKey=String(state.countdownTargetKey||'');
  try{
    if(countdownTargetKey)localStorage.setItem(COUNTDOWN_TARGET_KEY,countdownTargetKey);
    else localStorage.removeItem(COUNTDOWN_TARGET_KEY);
  }catch(e){}
  if(['month','timeline','upcoming'].includes(state.calendarView))calendarView=state.calendarView;
  if(['all','confirmed','engineering','medical','university','starred'].includes(state.calendarFilter))calendarFilter=state.calendarFilter;
  homeSyncState=state;
  try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
  homeSyncApplying=false;
}
async function fetchCloudSync(){
  if(!validSyncCode(homeSyncCode))return null;
  const r=await fetch('/api/home-sync',{headers:{'x-dbt-sync-code':homeSyncCode},cache:'no-store'});
  if(r.status===404)return null;
  if(r.status===503){homeSyncConfigured=false;throw new Error('storage_not_configured')}
  if(!r.ok)throw new Error('sync_load_failed');
  const j=await r.json();
  return j&&j.state?j.state:null;
}
async function pushCloudSync(){
  if(!validSyncCode(homeSyncCode)||homeSyncApplying)return;
  try{
    setSyncUi('saving','Saving…');
    const state=currentSyncState(Date.now());
    homeSyncState=state;
    try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
    const r=await fetch('/api/home-sync',{method:'PUT',headers:{'Content-Type':'application/json','x-dbt-sync-code':homeSyncCode},body:JSON.stringify(state),cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(r.status===409&&j.state){
      setSyncUi('','Save');
      throw new Error('newer_cloud_state');
    }
    if(r.status===503){homeSyncConfigured=false;setSyncUi('offline',location.hostname==='localhost'||location.hostname==='127.0.0.1'?'Local preview':'Local');throw new Error('storage_not_configured')}
    if(!r.ok)throw new Error('sync_save_failed');
    setSyncUi('saved','Saved');
    return true;
  }catch(e){
    setSyncUi('offline',navigator.onLine?'Save':'Offline');
    throw e;
  }
}
function initializeSecretSync(){
  // Keep a stable Secret Code locally, but never touch cloud storage on passive visits.
  if(!validSyncCode(homeSyncCode))homeSyncCode=ensureSyncCode();
  homeSyncCode=normalizeSyncCode(homeSyncCode);
  try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
  if(!homeSyncState){
    const state=currentSyncState(Date.now());
    homeSyncState=state;
    try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
  }
  setSyncUi('','Save');
}
function openSyncModal(){
  homeSyncCode=ensureSyncCode();
  syncCodeText.textContent=homeSyncCode;
  syncExistingInput.value='';
  syncStatusLine.textContent=navigator.onLine
    ?'Saved on this device. Press Save backup to store the latest choices online.'
    :'No internet — your latest choices are still saved on this device.';
  syncModalBackdrop.classList.add('open');syncModalBackdrop.setAttribute('aria-hidden','false');
  if(!homeSyncState)saveLocalSyncState();
}
function closeSyncModal(){syncModalBackdrop.classList.remove('open');syncModalBackdrop.setAttribute('aria-hidden','true')}
async function useExistingSyncCode(){
  const code=normalizeSyncCode(syncExistingInput.value);
  if(!validSyncCode(code)){syncStatusLine.textContent='That code does not look right.';return}
  syncUseButton.disabled=true;syncStatusLine.textContent='Opening this code…';
  try{
    const oldCode=homeSyncCode;
    homeSyncCode=code;
    const cloud=await fetchCloudSync();
    if(!cloud){
      homeSyncCode=oldCode;
      syncStatusLine.textContent='Nothing was saved with that code.';
      return;
    }
    try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
    applySyncState(cloud);render();
    syncCodeText.textContent=homeSyncCode;
    syncExistingInput.value='';
    setSyncUi('','Save');
    syncStatusLine.textContent='Restored from this Secret Code. Future changes stay local until you press Save backup.';
  }catch(e){
    syncStatusLine.textContent=e&&e.message==='storage_not_configured'
      ?'Online save is not connected yet. This device is saving only on this device.'
      :'Could not open that code right now.';
  }finally{syncUseButton.disabled=false}
}
function setCountdownTarget(e){
  countdownTargetKey=e?eventKey(e):'';
  try{
    if(countdownTargetKey)localStorage.setItem(COUNTDOWN_TARGET_KEY,countdownTargetKey);
    else localStorage.removeItem(COUNTDOWN_TARGET_KEY);
  }catch(err){}
  if(e){
    TARGET=new Date(e.date);
    if(heroCountdownTarget)heroCountdownTarget.textContent='Main target • '+e.title+' • '+new Date(e.date).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'});
    if(mainTargetButton)mainTargetButton.classList.add('active');
  }else{
    if(heroCountdownTarget)heroCountdownTarget.textContent='Tap ⌖ to set the main countdown target';
    if(mainTargetButton)mainTargetButton.classList.remove('active');
  }
  countdown();
  renderStarredTargets();
  saveLocalSyncState();
  if(typeof closeTargetPicker==='function')closeTargetPicker();
}
function restoreCountdownTarget(){
  const selected=all.find(e=>eventKey(e)===countdownTargetKey);
  if(selected){
    TARGET=new Date(selected.date);
    if(heroCountdownTarget)heroCountdownTarget.textContent='Main target • '+selected.title+' • '+new Date(selected.date).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'});
    if(mainTargetButton)mainTargetButton.classList.add('active');
    countdown();
    return;
  }
  if(countdownTargetKey){countdownTargetKey='';try{localStorage.removeItem(COUNTDOWN_TARGET_KEY)}catch(e){}}
  if(mainTargetButton)mainTargetButton.classList.remove('active');
  if(heroCountdownTarget)heroCountdownTarget.textContent='Tap ⌖ to set the main countdown target';
}
function toggleStar(e){
  const key=eventKey(e);
  const adding=!starred.has(key);
  if(adding) starred.add(key); else starred.delete(key);
  saveStars();
  saveLocalSyncState();
  if(adding&&typeof makeShooter==='function'&&!reduceMotion&&!mobileLite){
    makeShooter(true,Math.max(80,innerWidth*.72),Math.max(80,innerHeight*.18));
  }
  render();
}
function starButton(e,extraClass=''){
  const b=document.createElement('button');
  b.type='button';
  b.className='star-btn '+extraClass+(isStarred(e)?' active':'');
  b.textContent=isStarred(e)?'★':'☆';
  b.title=isStarred(e)?'Remove from My Exams':'Add to My Exams';
  b.setAttribute('aria-label',b.title);
  b.onclick=ev=>{ev.stopPropagation();toggleStar(e)};
  return b;
}
function bdDate(iso){return new Date(new Date(iso).toLocaleString('en-US',{timeZone:'Asia/Dhaka'}))}
let calendarView=(homeSyncState&&['month','timeline','upcoming'].includes(homeSyncState.calendarView)?homeSyncState.calendarView:'month'),calendarFilter=(homeSyncState&&['all','confirmed','engineering','medical','university','starred'].includes(homeSyncState.calendarFilter)?homeSyncState.calendarFilter:'all'),drawerEvent=null;
function eventState(e){return e.status==='tentative'?'tentative':e.status==='pending'?'pending':'confirmed'}
function eventCategory(e){
  const t=(e.title||'').toLowerCase();
  if(/medical|dental|mbbs|bds|afmc|amc/.test(t))return 'medical';
  if(/buet|ruet|kuet|cuet|butex|mist|engineering|technology/.test(t))return 'engineering';
  return 'university';
}
function filtered(){
  const q=(search.value||'').toLowerCase().trim();
  return all.filter(e=>{
    if(q&&!e.title.toLowerCase().includes(q))return false;
    if(calendarFilter==='confirmed'&&eventState(e)!=='confirmed')return false;
    if(calendarFilter==='starred'&&!isStarred(e))return false;
    if(['engineering','medical','university'].includes(calendarFilter)&&eventCategory(e)!==calendarFilter)return false;
    return true;
  }).sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function eventTimeLabel(e){
  if(e.displayTime)return e.displayTime;
  if(eventState(e)!=='confirmed')return 'Time TBA';
  return new Date(e.date).toLocaleTimeString('en-BD',{timeZone:'Asia/Dhaka',hour:'numeric',minute:'2-digit'});
}
function calendarShortTitle(e){
  const t=String(e.title||'');
  const exact={
    'Medical & Dental':'MAT',
    'DU IBA':'DU-IBA',
    'Aviation and Aerospace University Bangladesh (AAUB)':'AAUB',
    'Dhaka University A / Science':'DU-A',
    'Dhaka University B / Arts, Law & Social Science':'DU-B',
    'Dhaka University Fine Arts':'DU-Fine Arts',
    'Dhaka University C / Business':'DU-C',
    'Khulna University A / Science':'KU-A',
    'Khulna University B / Life Science':'KU-B',
    'Khulna University C / Humanities':'KU-C',
    'Khulna University D / Business':'KU-D',
    'MIST C Unit':'MIST-C',
    'MIST A & B':'MIST-A/B',
    'Jagannath University A / Science':'JnU-A',
    'Jagannath University B / Humanities':'JnU-B',
    'Jagannath University C / Business':'JnU-C',
    'Jagannath University D / Social Science':'JnU-D',
    'Jagannath University E / Fine Arts':'JnU-E',
    'Agriculture Cluster':'ACAS',
    'Rajshahi University A / Humanities':'RU-A',
    'Rajshahi University B / Business':'RU-B',
    'Rajshahi University C / Science':'RU-C',
    'Chittagong University A / Science':'CU-A',
    'Chittagong University B':'CU-B',
    'Chittagong University B1':'CU-B1',
    'Chittagong University B2':'CU-B2',
    'Chittagong University C / Business':'CU-C',
    'Chittagong University D':'CU-D',
    'Chittagong University D1':'CU-D1',
    'Comilla University A':'CoU-A',
    'Comilla University B':'CoU-B',
    'Comilla University C':'CoU-C',
    'SUST Admission Test (unit allocation pending)':'SUST',
    'BUP BBA General':'BUP-BBA',
    'GST A / Science':'GST-A',
    'GST B / Humanities':'GST-B',
    'GST C / Business':'GST-C',
    'GST D / Architecture':'GST-D'
  };
  if(exact[t])return exact[t];
  if(/^BUP\s+/.test(t))return t.replace(/^BUP\s+/,'BUP-');
  return t;
}
function openEventDrawer(e){
  drawerEvent=e;
  const d=new Date(e.date),state=eventState(e);
  eventDrawerTitle.textContent=e.title;
  eventDrawerDate.textContent=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'full'})+' • '+eventTimeLabel(e);
  eventDrawerStatus.textContent=state==='confirmed'?'Confirmed / official date':state==='pending'?'Date announced / notice pending':'Not confirmed';
  eventDrawerStatus.className='event-drawer-status '+(state==='confirmed'?'':state);
  eventDrawerNote.textContent=currentLang==='bn'
    ?(state==='confirmed'
      ?'এই পরীক্ষার তারিখ নিশ্চিত/অফিসিয়াল তথ্য অনুযায়ী দেখানো হয়েছে। সময় ও শেষ নির্দেশনা অফিসিয়াল নোটিশে মিলিয়ে নিন।'
      :state==='pending'
        ?'পরীক্ষার তারিখ ঘোষণা বা তালিকাভুক্ত হয়েছে, তবে পূর্ণ নোটিশ বা কিছু বিস্তারিত এখনও বাকি।'
        :'এই তারিখ এখনও নিশ্চিত নয়। অফিসিয়াল নোটিশ প্রকাশ হলে আবার যাচাই করুন।')
    :(e.agreement||'Use the latest official university notice for final details.');
  eventDrawerStar.textContent=isStarred(e)?(eventKey(e)===countdownTargetKey?'★ Countdown target':'★ In My Exams'):'☆ Add to My Exams';
  eventDrawerBackdrop.classList.add('open');eventDrawerBackdrop.setAttribute('aria-hidden','false');
}
function closeEventDrawer(){eventDrawerBackdrop.classList.remove('open');eventDrawerBackdrop.setAttribute('aria-hidden','true');drawerEvent=null}
function renderHeroNext(){restoreCountdownTarget()}
function renderTimeline(es){
  const now=new Date();
  let rows=calendarView==='upcoming'?es.filter(e=>new Date(e.date)>=now).slice(0,14):es;
  if(!rows.length){calendarList.innerHTML='<div class="calendar-list-shell"><div class="timeline-empty">No exams match these filters.</div></div>';return}
  let lastMonth='',html='<div class="calendar-list-shell">';
  rows.forEach(e=>{
    const d=new Date(e.date),monthKey=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',month:'long',year:'numeric'});
    if(calendarView==='timeline'&&monthKey!==lastMonth){html+='<div class="timeline-month">'+esc(monthKey)+'</div>';lastMonth=monthKey}
    const state=eventState(e);
    const cat=eventCategory(e);
    html+='<div class="timeline-card category-'+cat+'" data-event-key="'+encodeURIComponent(eventKey(e))+'">'+
      '<div class="timeline-date"><b>'+d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'2-digit'})+'</b><span>'+d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',month:'short',weekday:'short'})+'</span></div>'+
      '<div class="timeline-main"><strong>'+esc(calendarShortTitle(e))+'</strong><small>'+esc(eventTimeLabel(e))+(isStarred(e)?' • ★ My Exam':'')+'</small></div>'+
      '<button type="button" class="star-btn timeline-star'+(isStarred(e)?' active':'')+'" data-list-star="'+encodeURIComponent(eventKey(e))+'" aria-label="'+(isStarred(e)?'Remove from My Exams':'Add to My Exams')+'" title="'+(isStarred(e)?'Remove from My Exams':'Add to My Exams')+'">'+(isStarred(e)?'★':'☆')+'</button>'+
      '<div class="timeline-status '+(state==='confirmed'?'':state)+'">'+(state==='confirmed'?'Confirmed':state==='pending'?'Notice pending':'Not confirmed')+'</div>'+
    '</div>';
  });
  html+='</div>';calendarList.innerHTML=html;
  calendarList.querySelectorAll('[data-list-star]').forEach(btn=>{
    btn.onclick=ev=>{
      ev.preventDefault();ev.stopPropagation();
      const k=decodeURIComponent(btn.dataset.listStar||'');
      const e=all.find(x=>eventKey(x)===k);
      if(e)toggleStar(e);
    };
  });
  calendarList.querySelectorAll('[data-event-key]').forEach(row=>{
    row.onclick=()=>{const k=decodeURIComponent(row.dataset.eventKey||'');const e=all.find(x=>eventKey(x)===k);if(e)openEventDrawer(e)};
  });
}
function animateCalendarMonth(direction){
  const shell=document.querySelector('#calendar .calendar-scroll');if(!shell)return;
  shell.classList.remove('month-enter-next','month-enter-prev');
  void shell.offsetWidth;
  shell.classList.add(direction>0?'month-enter-next':'month-enter-prev');
  setTimeout(()=>shell.classList.remove('month-enter-next','month-enter-prev'),240);
}
function openDayEvents(events,date){
  if(!events?.length)return;
  dayEventsTitle.textContent=events.length+' exam'+(events.length===1?'':'s');
  dayEventsDate.textContent=date.toLocaleDateString('en-BD',{dateStyle:'full'});
  dayEventsList.innerHTML=events.map(e=>'<button type="button" class="day-event-row category-'+eventCategory(e)+'" data-day-event="'+encodeURIComponent(eventKey(e))+'"><span><b>'+esc(calendarShortTitle(e))+'</b><small>'+esc(eventTimeLabel(e))+'</small></span><i>›</i></button>').join('');
  dayEventsList.querySelectorAll('[data-day-event]').forEach(btn=>btn.onclick=()=>{const key=decodeURIComponent(btn.dataset.dayEvent||'');const e=all.find(x=>eventKey(x)===key);closeDayEvents();if(e)openEventDrawer(e)});
  dayEventsBackdrop.classList.add('open');dayEventsBackdrop.setAttribute('aria-hidden','false');
}
function closeDayEvents(){dayEventsBackdrop.classList.remove('open');dayEventsBackdrop.setAttribute('aria-hidden','true')}

function render(){
  calendar.dataset.view=calendarView;
  document.querySelectorAll('[data-calendar-view]').forEach(b=>b.classList.toggle('active',b.dataset.calendarView===calendarView));
  document.querySelectorAll('[data-calendar-filter]').forEach(b=>b.classList.toggle('active',b.dataset.calendarFilter===calendarFilter));
  month.textContent=view.toLocaleString('en-US',{month:'long',year:'numeric'});
  grid.innerHTML='';
  const y=view.getFullYear(),mo=view.getMonth(),first=new Date(y,mo,1),start=new Date(y,mo,1-first.getDay());
  const es=filtered();
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const cell=document.createElement('div');
    cell.className='day'+(d.getMonth()!=mo?' muted':'');
    const now=new Date();
    if(d.toDateString()==now.toDateString())cell.classList.add('today');
    cell.innerHTML='<span class="num">'+d.getDate()+'</span>';
    const todays=es.filter(e=>{const x=bdDate(e.date);return x.getFullYear()==d.getFullYear()&&x.getMonth()==d.getMonth()&&x.getDate()==d.getDate()});
    todays.slice(0,4).forEach(e=>{
      const el=document.createElement('div');
      const state=eventState(e);
      const cat=eventCategory(e);
      el.className='event '+(state==='confirmed'?'verified':'unverified')+' category-'+cat;
      el.title=e.title;
      el.onclick=()=>openEventDrawer(e);
      const t=document.createElement('span');t.className='event-title';t.textContent=calendarShortTitle(e);el.appendChild(t);
      cell.appendChild(el);
    });
    if(todays.length>4){const more=document.createElement('button');more.type='button';more.className='calendar-more';more.textContent='+'+(todays.length-4)+' more';more.setAttribute('aria-label','Show '+todays.length+' exams on '+d.toLocaleDateString());more.onclick=ev=>{ev.stopPropagation();openDayEvents(todays,d)};cell.appendChild(more)}
    grid.appendChild(cell);
  }
  renderTimeline(es);
  renderStarredTargets();
  renderHeroNext();
}
function splitCountdown(target){
  let diff=new Date(target)-new Date();
  if(diff<=0)return {d:0,h:0,m:0,s:0,done:true};
  return {
    d:Math.floor(diff/86400000),
    h:Math.floor(diff/3600000)%24,
    m:Math.floor(diff/60000)%60,
    s:Math.floor(diff/1000)%60,
    done:false
  };
}
function animateNumberText(el,value,suffix=''){
  if(!el)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from=Number(el.dataset.numberValue||0),to=Number(value||0);
  el.dataset.numberValue=String(to);
  if(reduce||Math.abs(to-from)>150){el.textContent=to+suffix;return}
  const start=performance.now(),duration=260;
  const tick=now=>{const p=Math.min(1,(now-start)/duration),v=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));el.textContent=v+suffix;if(p<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}

function renderScheduleVisuals(){
  const counts={medical:0,engineering:0,university:0};
  const states={confirmed:0,pending:0,tentative:0};
  all.forEach(e=>{
    const cat=eventCategory(e);
    if(counts[cat]!==undefined)counts[cat]++;
    const state=eventState(e);
    if(states[state]!==undefined)states[state]++;
  });
  const total=all.length||0;
  const max=Math.max(1,counts.medical,counts.engineering,counts.university);
  const mixTotalEl=document.getElementById('mixTotal');
  const mixMedicalCountEl=document.getElementById('mixMedicalCount');
  const mixEngineeringCountEl=document.getElementById('mixEngineeringCount');
  const mixUniversityCountEl=document.getElementById('mixUniversityCount');
  const mixMedicalBarEl=document.getElementById('mixMedicalBar');
  const mixEngineeringBarEl=document.getElementById('mixEngineeringBar');
  const mixUniversityBarEl=document.getElementById('mixUniversityBar');
  if(mixTotalEl)animateNumberText(mixTotalEl,total);
  if(mixMedicalCountEl)animateNumberText(mixMedicalCountEl,counts.medical);
  if(mixEngineeringCountEl)animateNumberText(mixEngineeringCountEl,counts.engineering);
  if(mixUniversityCountEl)animateNumberText(mixUniversityCountEl,counts.university);
  if(mixMedicalBarEl)mixMedicalBarEl.style.width=(counts.medical/max*100)+'%';
  if(mixEngineeringBarEl)mixEngineeringBarEl.style.width=(counts.engineering/max*100)+'%';
  if(mixUniversityBarEl)mixUniversityBarEl.style.width=(counts.university/max*100)+'%';

  animateNumberText(statusConfirmedCount,states.confirmed);
  animateNumberText(statusPendingCount,states.pending);
  animateNumberText(statusTentativeCount,states.tentative);
  const confirmedStop=total?states.confirmed/total*100:0;
  const pendingStop=total?(states.confirmed+states.pending)/total*100:0;
  statusConfirmedPct.textContent=Math.round(confirmedStop)+'%';
  statusDonut.classList.toggle('empty',!total);
  statusDonut.style.setProperty('--confirmed-stop',confirmedStop+'%');
  statusDonut.style.setProperty('--pending-stop',pendingStop+'%');

  if(typeof monthlyExamBars!=='undefined'&&monthlyExamBars){
    const monthMap=new Map();
    all.forEach(e=>{
      const d=bdDate(e.date);
      const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      if(!monthMap.has(key))monthMap.set(key,{key,label:d.toLocaleDateString('en-US',{month:'short'}),year:d.getFullYear(),medical:0,engineering:0,university:0,total:0});
      const row=monthMap.get(key),cat=eventCategory(e);
      if(row[cat]!==undefined)row[cat]++;
      row.total++;
    });
    const months=[...monthMap.values()].sort((a,b)=>a.key.localeCompare(b.key));
    const maxMonth=Math.max(1,...months.map(m=>m.total));
    monthlyExamBars.innerHTML=months.map(m=>{
      const full=Math.max(10,m.total/maxMonth*100);
      const med=m.total?m.medical/m.total*100:0;
      const eng=m.total?m.engineering/m.total*100:0;
      const uni=Math.max(0,100-med-eng);
      return '<div class="monthly-bar-item" role="button" tabindex="0" data-month-key="'+m.key+'" aria-label="Show weekly distribution for '+esc(m.label+' '+m.year)+'" title="'+esc(m.label+' '+m.year+' • '+m.total+' exams • tap for weekly view')+'">'+
        '<b>'+m.total+'</b>'+
        '<div class="monthly-bar-shell"><div class="monthly-bar-stack" style="height:'+full+'%">'+
          (m.medical?'<i class="medical" style="height:'+med+'%"></i>':'')+
          (m.engineering?'<i class="engineering" style="height:'+eng+'%"></i>':'')+
          (m.university?'<i class="university" style="height:'+uni+'%"></i>':'')+
        '</div></div>'+
        '<span>'+esc(m.label)+'</span><small>'+m.year+'</small>'+
      '</div>';
    }).join('');
    if(!months.length)monthlyExamBars.innerHTML='<div class="monthly-empty">No schedule data yet.</div>';

    const openWeeklyMonth=monthKey=>{
      const selected=months.find(m=>m.key===monthKey);
      if(!selected||typeof weeklyDrilldown==='undefined'||!weeklyDrilldown)return;
      const monthEvents=all.filter(e=>{
        const d=bdDate(e.date);
        return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')===monthKey;
      });
      const daysInMonth=new Date(selected.year,Number(monthKey.slice(5,7)),0).getDate();
      const weeks=[0,1,2,3,4].map(i=>({
        index:i+1,start:i*7+1,end:Math.min(daysInMonth,i*7+7),
        medical:0,engineering:0,university:0,total:0
      }));
      monthEvents.forEach(e=>{
        const d=bdDate(e.date),idx=Math.min(4,Math.floor((d.getDate()-1)/7));
        const row=weeks[idx],cat=eventCategory(e);
        if(row[cat]!==undefined)row[cat]++;
        row.total++;
      });
      const maxWeek=Math.max(1,...weeks.map(w=>w.total));
      weeklyDrilldownTitle.textContent=selected.label+' '+selected.year+' — Weekly distribution';
      weeklyDrilldownMeta.textContent=selected.total+' exams • Week 1 = days 1–7';
      weeklyExamBars.innerHTML=weeks.map(w=>{
        const full=w.total?Math.max(12,w.total/maxWeek*100):4;
        const med=w.total?w.medical/w.total*100:0;
        const eng=w.total?w.engineering/w.total*100:0;
        const uni=Math.max(0,100-med-eng);
        return '<div class="weekly-bar-item" title="'+esc('Week '+w.index+' • '+w.start+'–'+w.end+' • '+w.total+' exams')+'">'+
          '<b>'+w.total+'</b>'+
          '<div class="weekly-bar-shell"><div class="weekly-bar-stack" style="height:'+full+'%">'+
            (w.medical?'<i class="medical" style="height:'+med+'%"></i>':'')+
            (w.engineering?'<i class="engineering" style="height:'+eng+'%"></i>':'')+
            (w.university?'<i class="university" style="height:'+uni+'%"></i>':'')+
          '</div></div>'+
          '<span>Week '+w.index+'</span><small>'+w.start+'–'+w.end+'</small>'+
        '</div>';
      }).join('');
      weeklyDrilldown.hidden=false;
      monthlyExamBars.querySelectorAll('.monthly-bar-item').forEach(x=>x.classList.toggle('active',x.dataset.monthKey===monthKey));
      if(innerWidth<=700)weeklyDrilldown.scrollIntoView({behavior:'smooth',block:'nearest'});
    };
    monthlyExamBars.querySelectorAll('.monthly-bar-item').forEach(item=>{
      item.addEventListener('click',()=>openWeeklyMonth(item.dataset.monthKey));
      item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWeeklyMonth(item.dataset.monthKey)}});
    });
    if(typeof weeklyDrilldownClose!=='undefined'&&weeklyDrilldownClose){
      weeklyDrilldownClose.onclick=()=>{
        weeklyDrilldown.hidden=true;
        monthlyExamBars.querySelectorAll('.monthly-bar-item').forEach(x=>x.classList.remove('active'));
      };
    }
  }
}

function updateDashboardStats(){
  renderScheduleVisuals();
  const now=new Date();
  const future=all.filter(e=>new Date(e.date)>now).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const next=future[0];
  if(typeof statStarred!=='undefined'&&statStarred)animateNumberText(statStarred,all.filter(isStarred).length);
  if(typeof statConfirmed!=='undefined'&&statConfirmed)animateNumberText(statConfirmed,all.filter(e=>eventState(e)==='confirmed').length);
  if(next){
    const d=new Date(next.date),left=Math.max(0,Math.ceil((d-now)/86400000));
    if(typeof statNext!=='undefined'&&statNext)animateNumberText(statNext,left,' days');
    if(typeof statNextNote!=='undefined'&&statNextNote)statNextNote.textContent=next.title;
  }else{
    if(typeof statNext!=='undefined'&&statNext)statNext.textContent='—';if(typeof statNextNote!=='undefined'&&statNextNote)statNextNote.textContent='No next exam';
  }
}
function renderStarredTargets(){
  const matches=all.filter(isStarred).sort((a,b)=>new Date(a.date)-new Date(b.date));
  targetCount.textContent=matches.length+' SELECTED';
  updateDashboardStats();
  if(!matches.length){
    starredCards.innerHTML='<div class="target-empty"><div class="target-empty-icon">★</div><div class="target-empty-copy"><b>Build your exam list</b><span>Tap “Add exams” and choose the exams you care about.</span><div class="target-empty-pills"><i class="medical">মেডিকেল</i><i class="engineering">ইঞ্জিনিয়ারিং</i><i class="university">বিশ্ববিদ্যালয়</i></div></div></div>';
    return;
  }
  const now=new Date();
  const future=matches.filter(e=>new Date(e.date)>=now);
  const nearestKey=future.length?eventKey(future[0]):eventKey(matches[0]);
  const catLabel=cat=>cat==='medical'?'Medical':cat==='engineering'?'Engineering':'University';
  const cards=matches.map((e,index)=>{
    const d=new Date(e.date),v=splitCountdown(e.date),key=encodeURIComponent(eventKey(e));
    const date=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'});
    const time=eventTimeLabel(e),nearest=eventKey(e)===nearestKey,cat=eventCategory(e);
    const message=v.done?'Exam time / completed':(v.d<=7?'Final stretch — revise smart.':v.d<=30?'Revision mode — stay consistent.':'Keep going — '+v.d+' days left.');
    const urgency=Math.max(6,100-Math.min(100,(v.d/90)*100));
    const nextExam=matches[index+1];
    let gapHtml='';
    if(nextExam){
      const a=bdDate(e.date),b=bdDate(nextExam.date);
      const aDay=new Date(a.getFullYear(),a.getMonth(),a.getDate());
      const bDay=new Date(b.getFullYear(),b.getMonth(),b.getDate());
      const gapDays=Math.max(0,Math.round((bDay-aDay)/86400000));
      gapHtml='<div class="exam-gap-bridge" aria-label="'+gapDays+' day gap before '+esc(nextExam.title)+'"><span></span><b>'+gapDays+' '+(gapDays===1?'DAY':'DAYS')+' GAP</b><span></span></div>';
    }
    return '<article class="starred-card compact-target category-'+cat+(nearest?' nearest':'')+'" data-star-key="'+key+'">'+
      '<div class="target-mainline">'+
        '<div class="target-copy">'+
          (nearest?'<div class="target-nearest-badge">NEXT SELECTED</div>':'')+
          '<div class="target-name">'+esc(e.title)+'</div>'+
          '<div class="target-meta"><span>'+esc(date)+' • '+esc(time)+'</span><i class="target-category-pill '+cat+'">'+catLabel(cat)+'</i></div>'+
        '</div>'+
        '<button type="button" class="star-btn active target-unstar" data-star-key="'+key+'" aria-label="Remove from My Exams" title="Remove from My Exams">★</button>'+
      '</div>'+
      '<div class="target-timer">'+
        '<div class="target-time"><b data-part="d">'+String(v.d).padStart(2,'0')+'</b><span>DAYS</span></div>'+
        '<div class="target-time"><b data-part="h">'+String(v.h).padStart(2,'0')+'</b><span>HOURS</span></div>'+
        '<div class="target-time"><b data-part="m">'+String(v.m).padStart(2,'0')+'</b><span>MIN</span></div>'+
        '<div class="target-time"><b data-part="s">'+String(v.s).padStart(2,'0')+'</b><span>SEC</span></div>'+
      '</div>'+
      '<div class="target-bottomline"><div class="target-countdown-track"><i style="width:'+urgency+'%"></i></div><div class="target-message">'+esc(message)+'</div></div>'+
    '</article>'+gapHtml;
  }).join('');
  starredCards.innerHTML='<div class="my-exam-sequence">'+cards+'</div>';
  starredCards.querySelectorAll('.target-unstar').forEach(btn=>{
    btn.onclick=()=>{
      const raw=decodeURIComponent(btn.dataset.starKey||'');
      starred.delete(raw);saveStars();saveLocalSyncState();render();
    };
  });
}
function updateStarredTimers(){
  document.querySelectorAll('.starred-card').forEach(card=>{
    const raw=decodeURIComponent(card.dataset.starKey||'');
    const e=all.find(x=>eventKey(x)===raw);
    if(!e)return;
    const v=splitCountdown(e.date);
    for(const part of ['d','h','m','s']){
      const node=card.querySelector('[data-part="'+part+'"]');
      if(node)node.textContent=String(v[part]).padStart(2,'0');
    }
    const msg=card.querySelector('.target-message');
    if(msg)msg.textContent=v.done?'Exam time / completed':'Keep going — '+v.d+' days to this target.';
  });
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderExamPicker(){
  const q=(examPickerSearch.value||'').toLowerCase().trim();
  const rows=all.filter(e=>new Date(e.date)>new Date()&&(!q||e.title.toLowerCase().includes(q))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!rows.length){examPickerList.innerHTML='<div class="target-picker-empty">No exam matches your search.</div>';return}
  examPickerList.innerHTML=rows.map(e=>{
    const selected=isStarred(e),d=new Date(e.date),key=encodeURIComponent(eventKey(e));
    return '<button type="button" class="target-picker-row category-'+eventCategory(e)+(selected?' active':'')+'" data-exam-pick="'+key+'"><span><strong>'+esc(e.title)+'</strong><small>'+esc(d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium'}))+' • '+esc(eventTimeLabel(e))+'</small></span><span class="target-picker-check">'+(selected?'✓':'+')+'</span></button>';
  }).join('');
  examPickerList.querySelectorAll('[data-exam-pick]').forEach(btn=>btn.onclick=()=>{
    const raw=decodeURIComponent(btn.dataset.examPick||'');
    const e=all.find(x=>eventKey(x)===raw);
    if(!e)return;
    if(starred.has(raw))starred.delete(raw);else starred.add(raw);
    saveStars();saveLocalSyncState();render();renderExamPicker();
  });
}
function openExamPicker(){
  examPickerSearch.value='';
  renderExamPicker();
  examPickerBackdrop.classList.add('open');
  examPickerBackdrop.setAttribute('aria-hidden','false');
  setTimeout(()=>examPickerSearch.focus(),30);
}
function closeExamPicker(){examPickerBackdrop.classList.remove('open');examPickerBackdrop.setAttribute('aria-hidden','true')}

function renderTargetPicker(){
  const q=(targetPickerSearch.value||'').toLowerCase().trim();
  const rows=all.filter(e=>new Date(e.date)>new Date()&&(!q||e.title.toLowerCase().includes(q))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!rows.length){targetPickerList.innerHTML='<div class="target-picker-empty">No next exam matches your search.</div>';return}
  targetPickerList.innerHTML=rows.map(e=>{
    const active=eventKey(e)===countdownTargetKey,d=new Date(e.date),key=encodeURIComponent(eventKey(e));
    return '<button type="button" class="target-picker-row category-'+eventCategory(e)+(active?' active':'')+'" data-main-target="'+key+'"><span><strong>'+esc(e.title)+'</strong><small>'+esc(d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium'}))+' • '+esc(eventTimeLabel(e))+'</small></span><span class="target-picker-check">'+(active?'✓':'›')+'</span></button>';
  }).join('');
  targetPickerList.querySelectorAll('[data-main-target]').forEach(btn=>btn.onclick=()=>{
    const raw=decodeURIComponent(btn.dataset.mainTarget||'');
    const e=all.find(x=>eventKey(x)===raw);
    if(e)setCountdownTarget(e);
  });
}
function openTargetPicker(){
  targetPickerSearch.value='';
  renderTargetPicker();
  targetPickerBackdrop.classList.add('open');
  targetPickerBackdrop.setAttribute('aria-hidden','false');
  setTimeout(()=>targetPickerSearch.focus(),30);
}
function closeTargetPicker(){targetPickerBackdrop.classList.remove('open');targetPickerBackdrop.setAttribute('aria-hidden','true')}
let pdfPickMonths=new Set(),pdfPickCats=new Set(['medical','engineering','university']),pdfPickVarsities=new Set(),pdfPickExcluded=new Set();

function pdfMonthKey(e){
  const d=bdDate(e.date);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function pdfInstitution(e){
  const t=String(e.title||'');
  const rules=[
    [/^Dhaka University|^DU IBA/i,'DU'],[/^Khulna University/i,'KU'],[/^Jagannath University/i,'JnU'],
    [/^Rajshahi University/i,'RU'],[/^Chittagong University/i,'CU'],[/^Comilla University/i,'CoU'],
    [/^SUST/i,'SUST'],[/^BUP/i,'BUP'],[/^GST/i,'GST'],[/^MIST/i,'MIST'],
    [/^BUET/i,'BUET'],[/^RUET/i,'RUET'],[/^KUET/i,'KUET'],[/^CUET/i,'CUET'],[/^BUTEX/i,'BUTEX'],
    [/Aviation and Aerospace University Bangladesh|AAUB/i,'AAUB'],[/Medical|Dental/i,'Medical / Dental'],
    [/Agriculture Cluster/i,'Agriculture Cluster']
  ];
  for(const [re,name] of rules)if(re.test(t))return name;
  return calendarShortTitle(e).split('-')[0]||t;
}
function pdfAllMonths(){
  return [...new Set(all.map(pdfMonthKey))].sort();
}
function pdfAllVarsities(){
  return [...new Set(all.map(pdfInstitution))].sort((a,b)=>a.localeCompare(b));
}
function pdfEligibleBase(e){
  return pdfPickMonths.has(pdfMonthKey(e))&&pdfPickCats.has(eventCategory(e))&&pdfPickVarsities.has(pdfInstitution(e));
}
function pdfSelectedEvents(){
  return all.filter(e=>pdfEligibleBase(e)&&!pdfPickExcluded.has(eventKey(e)));
}
function renderPdfPicker(){
  const months=pdfAllMonths();
  pdfMonthChips.innerHTML=months.map(key=>{
    const [y,m]=key.split('-').map(Number);
    const label=new Date(y,m-1,1).toLocaleString('en-US',{month:'short',year:'numeric'});
    return '<button type="button" class="pdf-chip'+(pdfPickMonths.has(key)?' active':'')+'" data-pdf-month="'+key+'">'+label+'</button>';
  }).join('');
  pdfVarsityChips.innerHTML=pdfAllVarsities().map(v=>'<button type="button" class="pdf-chip'+(pdfPickVarsities.has(v)?' active':'')+'" data-pdf-varsity="'+encodeURIComponent(v)+'">'+esc(v)+'</button>').join('');

  pdfCategoryChips.querySelectorAll('[data-pdf-cat]').forEach(btn=>btn.classList.toggle('active',pdfPickCats.has(btn.dataset.pdfCat)));

  const q=(pdfExamSearch.value||'').toLowerCase().trim();
  const visible=all.filter(e=>pdfEligibleBase(e)&&(!q||e.title.toLowerCase().includes(q)||pdfInstitution(e).toLowerCase().includes(q))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  pdfExamList.innerHTML=visible.length?visible.map(e=>{
    const off=pdfPickExcluded.has(eventKey(e));
    const d=bdDate(e.date);
    return '<button type="button" class="pdf-exam-row category-'+eventCategory(e)+(off?' off':'')+'" data-pdf-exam="'+encodeURIComponent(eventKey(e))+'">'+
      '<span class="pdf-exam-check">'+(off?'':'✓')+'</span>'+
      '<span><strong>'+esc(calendarShortTitle(e))+'</strong><small>'+esc(pdfInstitution(e))+' • '+esc(d.toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'}))+'</small></span>'+
      '<em>'+esc(eventCategory(e)==='medical'?'মেডিকেল':eventCategory(e)==='engineering'?'ইঞ্জিনিয়ারিং':'বিশ্ববিদ্যালয়')+'</em></button>';
  }).join(''):'<div class="target-picker-empty">No exams match these choices.</div>';

  const selected=pdfSelectedEvents();
  const pageMonths=new Set(selected.map(pdfMonthKey));
  if(typeof pdfPreview!=='undefined'&&pdfPreview){
    const pages=[...pageMonths].sort().map(key=>{
      const [y,m]=key.split('-').map(Number);
      const monthEvents=selected.filter(e=>pdfMonthKey(e)===key);
      const label=new Date(y,m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
      const sample=monthEvents.slice(0,4).map(e=>'<i>'+esc(calendarShortTitle(e))+'</i>').join('');
      return '<article><b>'+label+'</b><span>'+monthEvents.length+' exam'+(monthEvents.length===1?'':'s')+'</span><div>'+sample+(monthEvents.length>4?'<i>+'+(monthEvents.length-4)+' more</i>':'')+'</div></article>';
    }).join('');
    pdfPreview.innerHTML='<div class="pdf-preview-head"><div><b>PDF preview</b><span>A4 landscape • black & white • one month per page</span></div><strong>'+pageMonths.size+' page'+(pageMonths.size===1?'':'s')+'</strong></div><div class="pdf-preview-pages">'+(pages||'<p>No pages selected yet.</p>')+'</div>';
  }
  pdfSelectedCount.textContent=selected.length+' exam'+(selected.length===1?'':'s');
  pdfSelectedMonths.textContent=pageMonths.size+' PDF page'+(pageMonths.size===1?'':'s');
  pdfDownloadSelected.disabled=!selected.length||!pageMonths.size;

  const monthAll=document.querySelector('[data-pdf-action="months-all"]');
  const catAll=document.querySelector('[data-pdf-action="cats-all"]');
  const varsityAll=document.querySelector('[data-pdf-action="varsities-all"]');
  const examAll=document.querySelector('[data-pdf-action="exams-all"]');
  if(monthAll)monthAll.textContent=pdfPickMonths.size===months.length&&months.length?'Clear':'All';
  if(catAll)catAll.textContent=pdfPickCats.size===3?'Clear':'All';
  const allVarsities=pdfAllVarsities();
  if(varsityAll)varsityAll.textContent=pdfPickVarsities.size===allVarsities.length&&allVarsities.length?'Clear':'All';
  const eligibleKeys=all.filter(pdfEligibleBase).map(eventKey);
  const allEligibleExcluded=eligibleKeys.length&&eligibleKeys.every(k=>pdfPickExcluded.has(k));
  if(examAll)examAll.textContent=allEligibleExcluded?'All':'Clear';

  pdfMonthChips.querySelectorAll('[data-pdf-month]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.pdfMonth;pdfPickMonths.has(k)?pdfPickMonths.delete(k):pdfPickMonths.add(k);renderPdfPicker()});
  pdfVarsityChips.querySelectorAll('[data-pdf-varsity]').forEach(btn=>btn.onclick=()=>{const v=decodeURIComponent(btn.dataset.pdfVarsity||'');pdfPickVarsities.has(v)?pdfPickVarsities.delete(v):pdfPickVarsities.add(v);renderPdfPicker()});
  pdfExamList.querySelectorAll('[data-pdf-exam]').forEach(btn=>btn.onclick=()=>{const k=decodeURIComponent(btn.dataset.pdfExam||'');pdfPickExcluded.has(k)?pdfPickExcluded.delete(k):pdfPickExcluded.add(k);renderPdfPicker()});
}
function openPdfPicker(){
  pdfPickMonths=new Set(pdfAllMonths());
  pdfPickCats=new Set(['medical','engineering','university']);
  pdfPickVarsities=new Set(pdfAllVarsities());
  pdfPickExcluded=new Set();
  pdfExamSearch.value='';
  renderPdfPicker();
  pdfPickerBackdrop.classList.add('open');pdfPickerBackdrop.setAttribute('aria-hidden','false');
}
function closePdfPicker(){pdfPickerBackdrop.classList.remove('open');pdfPickerBackdrop.setAttribute('aria-hidden','true')}

let clientPdfLibraryPromise=null;
function loadClientPdfScript(src){
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-dbt-pdf-src="'+src+'"]');
    if(existing){
      if(existing.dataset.loaded==='1')return resolve();
      existing.addEventListener('load',()=>resolve(),{once:true});
      existing.addEventListener('error',()=>reject(new Error('pdf_library_failed')),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    s.dataset.dbtPdfSrc=src;
    s.onload=()=>{s.dataset.loaded='1';resolve()};
    s.onerror=()=>reject(new Error('pdf_library_failed'));
    document.head.appendChild(s);
  });
}
function ensureClientPdfLibraries(){
  if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(!clientPdfLibraryPromise){
    clientPdfLibraryPromise=(async()=>{
      await loadClientPdfScript('/vendor/jspdf.umd.min.js');
      if(!(window.jspdf&&window.jspdf.jsPDF))throw new Error('pdf_library_missing');
      return window.jspdf.jsPDF;
    })().catch(err=>{clientPdfLibraryPromise=null;throw err});
  }
  return clientPdfLibraryPromise;
}
function clientPdfFitText(doc,text,width){
  let out=String(text||'');
  if(doc.getTextWidth(out)<=width)return out;
  while(out.length>2&&doc.getTextWidth(out+'…')>width)out=out.slice(0,-1);
  return out+'…';
}
function clientPdfMonthEvents(events,year,month){
  return events.filter(e=>{
    const d=bdDate(e.date);
    return d.getFullYear()===year&&d.getMonth()===month;
  });
}
function clientPdfDrawMonth(doc,year,month,events,pageNumber,totalPages){
  const pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight();
  const left=28,right=28,top=24,contentW=pageW-left-right;
  const monthName=new Date(Date.UTC(year,month,1)).toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const monthEvents=clientPdfMonthEvents(events,year,month);

  doc.setTextColor(0,0,0);
  doc.setFont('helvetica','bold');doc.setFontSize(17);
  doc.text('Admission Calendar',left,top+13,{maxWidth:contentW*.62});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);
  doc.text('Admission by DBT • 2026–27 • Bangladesh time',left,top+34,{maxWidth:contentW*.62});

  doc.setFont('helvetica','bold');doc.setFontSize(15);
  doc.text(monthName,pageW-right,top+13,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);
  doc.text(monthEvents.length+' selected exam'+(monthEvents.length===1?'':'s'),pageW-right,top+34,{align:'right'});

  const legendY=top+42;
  doc.setDrawColor(0,0,0);doc.setLineWidth(.7);doc.rect(left,legendY,9,9);
  doc.setFont('helvetica','normal');doc.setFontSize(7.2);doc.text('Confirmed',left+14,legendY+7);
  doc.setLineWidth(1.6);doc.rect(left+82,legendY,9,9);
  doc.setFontSize(7.2);doc.text('Notice pending / not confirmed',left+96,legendY+7);
  doc.text('Black & white print layout • one month per page',pageW-right,legendY+7,{align:'right'});

  const gridY=legendY+20,headerH=19,footerH=20;
  const gridH=pageH-gridY-footerH-16;
  const cellW=contentW/7,cellH=(gridH-headerH)/6;
  const week=['SUN','MON','TUE','WED','THU','FRI','SAT'];

  for(let i=0;i<7;i++){
    const x=left+i*cellW;
    doc.setFillColor(242,242,242);doc.setDrawColor(0,0,0);doc.setLineWidth(.65);
    doc.rect(x,gridY,cellW,headerH,'FD');
    doc.setTextColor(0,0,0);doc.setFont('helvetica','bold');doc.setFontSize(7.4);
    doc.text(week[i],x+cellW/2,gridY+12,{align:'center'});
  }

  const startDay=new Date(Date.UTC(year,month,1)).getUTCDay();
  const daysInMonth=new Date(Date.UTC(year,month+1,0)).getUTCDate();

  for(let i=0;i<42;i++){
    const row=Math.floor(i/7),col=i%7;
    const x=left+col*cellW,y=gridY+headerH+row*cellH;
    doc.setFillColor(255,255,255);doc.setDrawColor(0,0,0);doc.setLineWidth(.65);doc.rect(x,y,cellW,cellH,'FD');

    const day=i-startDay+1;
    if(day<1||day>daysInMonth)continue;

    doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(0,0,0);
    doc.text(String(day),x+4,y+10);

    const todays=monthEvents.filter(e=>bdDate(e.date).getDate()===day);
    let yy=y+16;
    const usable=Math.max(34,cellH-20);
    const showCount=Math.min(todays.length,10);
    const dense=showCount>5;
    const rowStep=dense?Math.max(6.1,Math.min(9.2,usable/Math.max(1,showCount))):12.3;
    const boxH=Math.max(5.4,rowStep-1.2);
    const fontSize=dense?Math.max(4.6,Math.min(5.8,boxH-2.2)):6.3;

    for(const e of todays.slice(0,showCount)){
      const confirmed=eventState(e)==='confirmed';
      doc.setDrawColor(0,0,0);doc.setLineWidth(confirmed?.65:1.35);
      doc.rect(x+4,yy,cellW-8,boxH);
      doc.setFont('helvetica','bold');doc.setFontSize(fontSize);doc.setTextColor(0,0,0);
      const label=clientPdfFitText(doc,calendarShortTitle(e),cellW-15);
      doc.text(label,x+7,yy+Math.max(fontSize,boxH*.68),{maxWidth:cellW-14});
      yy+=rowStep;
    }
    if(todays.length>showCount){
      const overflow=todays.length-showCount;
      doc.setFont('helvetica','bold');doc.setFontSize(5.2);
      doc.text('+'+overflow+' more selected',x+cellW-5,Math.min(y+cellH-3,yy+5),{align:'right'});
    }
  }

  const footerY=pageH-26;
  doc.setFont('helvetica','normal');doc.setFontSize(6.4);doc.setTextColor(0,0,0);
  doc.text(
    'Thin border = confirmed • Thick border = notice pending / not confirmed • Always check the latest official notice before the exam.',
    left,footerY,{maxWidth:contentW-90}
  );
  doc.setFont('helvetica','bold');
  doc.text('Page '+pageNumber+' of '+totalPages,pageW-right,footerY,{align:'right'});
}
async function downloadCalendarPdf(){
  const chosen=pdfSelectedEvents();
  const months=[...new Set(chosen.map(pdfMonthKey))].sort();
  if(!chosen.length||!months.length)return;

  const btn=document.getElementById('pdfDownloadSelected');
  const old=btn?btn.textContent:'Download PDF';
  if(btn){btn.disabled=true;btn.textContent='Making PDF…'}

  try{
    const jsPDF=await ensureClientPdfLibraries();
    const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true});
    doc.setProperties({
      title:'Admission Calendar 2026-27',
      author:'Admission by DBT',
      subject:'Selected admission exam calendar'
    });

    months.forEach((key,i)=>{
      const [year,monthNumber]=key.split('-').map(Number);
      if(i>0)doc.addPage('a4','landscape');
      clientPdfDrawMonth(doc,year,monthNumber-1,chosen,i+1,months.length);
    });

    const niceMonth=k=>{
      const [y,m]=k.split('-').map(Number);
      return new Date(Date.UTC(y,m-1,1)).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).replace(' ','-');
    };
    const filename=months.length===1
      ?'DBT-Admission-Calendar-'+niceMonth(months[0])+'.pdf'
      :'DBT-Admission-Calendar-'+niceMonth(months[0])+'_to_'+niceMonth(months[months.length-1])+'.pdf';

    const blob=doc.output('blob');
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closePdfPicker();
  }catch(e){
    alert('Could not make the PDF on this device. Please try again.');
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

async function load(force=false){
  syncStatus.textContent='● checking dates…';
  try{
    const r=await fetch('/api/events'+(force?'?refresh=1':''));
    if(!r.ok)throw new Error('events_failed');
    const j=await r.json();
    all=j.events||[];
    sourceHealth=j.sources||[];
    try{localStorage.setItem(EVENT_CACHE_KEY,JSON.stringify({events:all,sources:sourceHealth,updatedAt:j.updatedAt||Date.now()}))}catch(e){}
    syncStatus.textContent='● '+all.length+' exams • updated '+new Date(j.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    render();
  }catch(e){
    let cached=null;
    try{cached=JSON.parse(localStorage.getItem(EVENT_CACHE_KEY)||'null')}catch(err){}
    if(cached&&Array.isArray(cached.events)&&cached.events.length){
      all=cached.events;sourceHealth=Array.isArray(cached.sources)?cached.sources:[];
      syncStatus.textContent=(location.hostname==='localhost'||location.hostname==='127.0.0.1'?'● local preview • ':'● offline • ')+'showing '+all.length+' saved exams';
    }else syncStatus.textContent='● could not check dates';
    render();
  }
}
prev.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render();animateCalendarMonth(-1)};
next.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render();animateCalendarMonth(1)};
refresh.onclick=()=>load(true);
calendarPdfButton.onclick=openPdfPicker;
pdfPickerClose.onclick=closePdfPicker;
pdfPickerBackdrop.onclick=e=>{if(e.target===pdfPickerBackdrop)closePdfPicker()};
pdfExamSearch.oninput=renderPdfPicker;
pdfCategoryChips.querySelectorAll('[data-pdf-cat]').forEach(btn=>btn.onclick=()=>{const cat=btn.dataset.pdfCat;pdfPickCats.has(cat)?pdfPickCats.delete(cat):pdfPickCats.add(cat);renderPdfPicker()});
document.querySelectorAll('[data-pdf-action]').forEach(btn=>btn.onclick=()=>{
  const a=btn.dataset.pdfAction;
  if(a==='months-all'){
    const vals=pdfAllMonths();
    pdfPickMonths=pdfPickMonths.size===vals.length?new Set():new Set(vals);
  }
  if(a==='cats-all'){
    pdfPickCats=pdfPickCats.size===3?new Set():new Set(['medical','engineering','university']);
  }
  if(a==='varsities-all'){
    const vals=pdfAllVarsities();
    pdfPickVarsities=pdfPickVarsities.size===vals.length?new Set():new Set(vals);
  }
  if(a==='exams-all'){
    const eligible=all.filter(pdfEligibleBase).map(eventKey);
    const allOff=eligible.length&&eligible.every(k=>pdfPickExcluded.has(k));
    if(allOff)eligible.forEach(k=>pdfPickExcluded.delete(k));
    else eligible.forEach(k=>pdfPickExcluded.add(k));
  }
  renderPdfPicker();
});
pdfDownloadSelected.onclick=downloadCalendarPdf;
dayEventsClose.onclick=closeDayEvents;
dayEventsBackdrop.onclick=e=>{if(e.target===dayEventsBackdrop)closeDayEvents()};
guideCompareClose.onclick=closeGuideCompare;
guideCompareBackdrop.onclick=e=>{if(e.target===guideCompareBackdrop)closeGuideCompare()};
search.oninput=render;
mainTargetButton.onclick=openTargetPicker;
targetAddButton.onclick=openExamPicker;

const DBT_LANG_KEY='admissionbydbt-language-v1';
let currentLang=(document.documentElement.dataset.lang==='bn'?'bn':'en');
const dbtOriginalText=new WeakMap();
const dbtOriginalAttrs=new WeakMap();
const BN_EXACT={
  'Home':'হোম','My Exams':'আমার পরীক্ষা','Circulars':'সার্কুলার','Calendar':'ক্যালেন্ডার','Admission Guide':'ভর্তি গাইড',
  'Save':'সেভ','Saved':'সেভ হয়েছে','Saving…':'সেভ হচ্ছে…','Saving...':'সেভ হচ্ছে…','Offline':'অফলাইন',
  'MISSION CONTROL • 2026–27':'ভর্তি নিয়ন্ত্রণ • ২০২৬–২৭','Admission season 2026–27':'ভর্তি মৌসুম ২০২৬–২৭',
  'BUILD BASICS':'বেসিক গুছিয়ে নিন','DAYS LEFT':'দিন বাকি','One focused day at a time.':'একদিন করে মনোযোগ দিয়ে এগিয়ে যান।',
  'WEEKS':'সপ্তাহ','HOURS':'ঘণ্টা','MINUTES':'মিনিট','SECONDS':'সেকেন্ড',
  'Main countdown target: default':'মূল কাউন্টডাউন: ডিফল্ট','AT A GLANCE':'এক নজরে','Schedule Snapshot':'পরীক্ষার সারসংক্ষেপ',
  'Live calendar data':'লাইভ ক্যালেন্ডার তথ্য','Category mix':'ক্যাটাগরি অনুযায়ী','Exams by type':'ধরন অনুযায়ী পরীক্ষা',
  'Date confidence':'তারিখের নিশ্চয়তা','Current schedule status':'বর্তমান সময়সূচির অবস্থা','confirmed':'নিশ্চিত',
  'Confirmed':'নিশ্চিত','Notice pending':'নোটিশ বাকি','Not confirmed':'নিশ্চিত নয়',
  'Monthly exam distribution':'মাসভিত্তিক পরীক্ষা','How busy each month is':'কোন মাসে কত পরীক্ষা',
  'Tap a month to see its weekly distribution.':'সাপ্তাহিক ভাগ দেখতে যেকোনো মাসে ট্যাপ করুন।',
  'Weekly distribution':'সাপ্তাহিক বণ্টন','YOUR LIST':'আপনার তালিকা','Choose exams to keep them together here.':'পছন্দের পরীক্ষাগুলো এখানে একসাথে রাখুন।',
  '＋ Add exams':'＋ পরীক্ষা যোগ করুন','SELECTED':'নির্বাচিত','OFFICIAL LINKS':'অফিসিয়াল লিংক',
  'Official links, grouped for quick access.':'দ্রুত দেখার জন্য অফিসিয়াল লিংকগুলো ক্যাটাগরি অনুযায়ী সাজানো।',
  'Official':'অফিসিয়াল','Waiting':'অপেক্ষমাণ','Checked':'যাচাই করা','Full notices':'পূর্ণ নোটিশ',
  'Latest tracked':'সর্বশেষ ট্র্যাক করা','Waiting for full notice':'পূর্ণ নোটিশের অপেক্ষায়',
  'Official link will appear here when published.':'প্রকাশ হলে অফিসিয়াল লিংক এখানে দেখা যাবে।',
  'SCHEDULE':'সময়সূচি','Exam dates in one place.':'সব পরীক্ষার তারিখ এক জায়গায়।','Print PDF':'PDF প্রিন্ট',
  'Refresh':'রিফ্রেশ','Month':'মাস','List':'তালিকা','Next exams':'পরের পরীক্ষা','All':'সব',
  '★ My Exams':'★ আমার পরীক্ষা','Audited 7 Oct 2026':'যাচাই: ৭ অক্টোবর ২০২৬',
  'Previous':'আগের','Next':'পরের','Sun':'রবি','Mon':'সোম','Tue':'মঙ্গল','Wed':'বুধ','Thu':'বৃহস্পতি','Fri':'শুক্র','Sat':'শনি',
  'REFERENCE':'তথ্য','QUICK COMPARE':'দ্রুত তুলনা','Compare admission options':'ভর্তি অপশন তুলনা করুন','Compare':'তুলনা',
  'Selected':'নির্বাচিত','Select':'নির্বাচন করুন','Selected ✓':'নির্বাচিত ✓','Compare selected':'নির্বাচিতগুলো তুলনা করুন','Compare':'তুলনা','Details':'বিস্তারিত','Less':'কম দেখুন','Clear':'মুছুন',
  'CLOUD SAVE':'ক্লাউড সেভ','Your Secret Code':'আপনার গোপন কোড',
  'Save this secret code somewhere safe. You can use it later to get back your saved exams, countdown target and calendar settings on this or another device.':'এই গোপন কোডটি নিরাপদ জায়গায় সেভ করে রাখুন। পরে এই বা অন্য ডিভাইসে আপনার সেভ করা পরীক্ষা, কাউন্টডাউন ও ক্যালেন্ডার সেটিংস ফেরত পেতে এটি ব্যবহার করতে পারবেন।',
  'Copy':'কপি','Use an existing code':'আগের কোড ব্যবহার করুন','Use code':'কোড ব্যবহার করুন',
  'Set main countdown target':'মূল কাউন্টডাউন ঠিক করুন','Add to My Exams':'আমার পরীক্ষায় যোগ করুন','Remove from My Exams':'আমার পরীক্ষা থেকে সরান',
  'Close':'বন্ধ','Download PDF':'PDF ডাউনলোড','PDF Preview':'PDF প্রিভিউ','Months':'মাস','Categories':'ক্যাটাগরি',
  'Universities':'বিশ্ববিদ্যালয়','Exams':'পরীক্ষা','Search exams/universities':'পরীক্ষা/বিশ্ববিদ্যালয় খুঁজুন',
  'All months':'সব মাস','All categories':'সব ক্যাটাগরি','All universities':'সব বিশ্ববিদ্যালয়','All exams':'সব পরীক্ষা',
  'Search university, unit or topic…':'বিশ্ববিদ্যালয়, ইউনিট বা বিষয় খুঁজুন…',
  'Search university or unit…':'বিশ্ববিদ্যালয় বা ইউনিট খুঁজুন…','Search exams…':'পরীক্ষা খুঁজুন…',
  'Build your exam list':'নিজের পরীক্ষার তালিকা বানান','Tap “Add exams” and choose the exams you care about.':'“পরীক্ষা যোগ করুন” ট্যাপ করে আপনার প্রয়োজনীয় পরীক্ষাগুলো বেছে নিন।',
  'NEXT SELECTED':'সবচেয়ে কাছের নির্বাচন','Exam time / completed':'পরীক্ষার সময় / শেষ','Final stretch — keep revision tight.':'শেষ সময় — রিভিশনে ফোকাস রাখুন।',
  'Revision matters more than collecting new topics.':'নতুন টপিকের চেয়ে রিভিশন এখন বেশি গুরুত্বপূর্ণ।',
  'Main countdown target':'মূল কাউন্টডাউন','No next exam':'পরবর্তী পরীক্ষা নেই','No schedule data yet.':'এখনও সময়সূচির তথ্য নেই।',
  'No exams found.':'কোনো পরীক্ষা পাওয়া যায়নি।','No selected exams in this month.':'এই মাসে নির্বাচিত পরীক্ষা নেই।',
  'Local preview':'লোকাল প্রিভিউ','Install app':'অ্যাপ ইনস্টল','How to use':'কীভাবে ব্যবহার করবেন',
  'Switch color theme':'থিম বদলান','Message on WhatsApp':'হোয়াটসঅ্যাপে বার্তা দিন',
  'Code copied.':'কোড কপি হয়েছে।','Could not copy. Press and hold the code to copy it.':'কপি করা যায়নি। কোডটি চেপে ধরে কপি করুন।',
  'Medical / Dental':'মেডিকেল / ডেন্টাল','Medical & Dental':'মেডিকেল ও ডেন্টাল','Agriculture Cluster':'কৃষি গুচ্ছ',
  'Dhaka University':'ঢাকা বিশ্ববিদ্যালয়','Khulna University':'খুলনা বিশ্ববিদ্যালয়','Jagannath University':'জগন্নাথ বিশ্ববিদ্যালয়',
  'Chittagong University':'চট্টগ্রাম বিশ্ববিদ্যালয়','Comilla University':'কুমিল্লা বিশ্ববিদ্যালয়','Rajshahi University':'রাজশাহী বিশ্ববিদ্যালয়',
  'Aviation and Aerospace University Bangladesh':'এভিয়েশন অ্যান্ড অ্যারোস্পেস ইউনিভার্সিটি বাংলাদেশ',
  'Science':'বিজ্ঞান','Humanities':'মানবিক','Business':'ব্যবসায় শিক্ষা','Fine Arts':'চারুকলা','Social Science':'সামাজিক বিজ্ঞান',
  'Official portal':'অফিসিয়াল পোর্টাল','Official circular':'অফিসিয়াল সার্কুলার','Official notices':'অফিসিয়াল নোটিশ',
  'Official exam dates':'অফিসিয়াল পরীক্ষার তারিখ','Official date notice':'অফিসিয়াল তারিখের নোটিশ'
};
Object.assign(BN_EXACT,{
  'EXAM MODE':'পরীক্ষা মোড','FINAL SPRINT':'শেষ দৌড়','MOCK SPRINT':'মক টেস্ট পর্ব','REVIEW STAGE':'রিভিশন পর্ব','BUILD + REVISE':'পড়া + রিভিশন',
  'Exam':'পরীক্ষা','Final sprint':'শেষ প্রস্তুতি','Mocks':'মক টেস্ট','Revision':'রিভিশন','Build + revise':'পড়া + রিভিশন','Build':'পড়া',
  'Stay calm. Execute.':'শান্ত থাকুন। পরিকল্পনা অনুযায়ী পরীক্ষা দিন।','Revise. Rest. Execute.':'রিভিশন করুন। বিশ্রাম নিন। আত্মবিশ্বাস নিয়ে পরীক্ষা দিন।',
  'Practice > new topics':'নতুন টপিকের চেয়ে অনুশীলন বেশি জরুরি','Test what you remember':'যা পড়েছেন নিজেকে পরীক্ষা করুন','Consistency compounds':'নিয়মিত পড়াই বড় ফল দেয়','Study every day':'প্রতিদিন পড়ুন',
  'You prepared for this. Keep your head clear and execute one question at a time.':'আপনি প্রস্তুতি নিয়েছেন। মাথা ঠান্ডা রেখে একবারে একটি প্রশ্নে মন দিন।',
  'Protect your confidence. Revise what matters, sleep properly, and keep moving.':'আত্মবিশ্বাস ধরে রাখুন। দরকারি বিষয় রিভিশন করুন, ঠিকমতো ঘুমান এবং এগিয়ে যান।',
  'The fastest gains now come from timed practice, mistakes, and focused revision.':'এখন সবচেয়ে বেশি উন্নতি হবে সময় ধরে অনুশীলন, ভুল বিশ্লেষণ ও ফোকাসড রিভিশনে।',
  'Test yourself, solve questions, check mistakes, and try again.':'নিজেকে পরীক্ষা করুন, প্রশ্ন সমাধান করুন, ভুল দেখুন এবং আবার চেষ্টা করুন।',
  'A strong day does not need to be perfect. Finish the important work and come back tomorrow.':'ভালো একটি দিন নিখুঁত হতে হবে না। গুরুত্বপূর্ণ কাজ শেষ করুন, আগামীকাল আবার চালিয়ে যান।',
  'Learn the basics now. Study one focused day at a time.':'এখন বেসিক শক্ত করুন। প্রতিদিন মনোযোগ দিয়ে একদিন করে এগিয়ে যান।',
  'PRINT CALENDAR':'ক্যালেন্ডার PDF','Make your calendar PDF':'নিজের ক্যালেন্ডার PDF বানান',
  'Choose months, categories, universities and individual exams.':'মাস, ক্যাটাগরি, বিশ্ববিদ্যালয় ও নির্দিষ্ট পরীক্ষা বেছে নিন।',
  'Category':'ক্যাটাগরি','University':'বিশ্ববিদ্যালয়','Individual exams':'আলাদা পরীক্ষা','PDF preview':'PDF প্রিভিউ',
  'A4 landscape • black & white • one month per page':'A4 ল্যান্ডস্কেপ • সাদা-কালো • প্রতি পেজে এক মাস',
  'No pages selected yet.':'এখনও কোনো পেজ নির্বাচন করা হয়নি।','No exams match these choices.':'এই নির্বাচনে কোনো পরীক্ষা পাওয়া যায়নি।',
  'MAIN COUNTDOWN':'মূল কাউন্টডাউন','Choose target exam':'কাউন্টডাউনের পরীক্ষা বেছে নিন',
  'MY EXAMS':'আমার পরীক্ষা','Choose exams':'পরীক্ষা বেছে নিন','No exam matches your search.':'আপনার খোঁজে কোনো পরীক্ষা পাওয়া যায়নি।',
  'No next exam matches your search.':'আপনার খোঁজে পরবর্তী কোনো পরীক্ষা পাওয়া যায়নি।',
  'DAY SCHEDULE':'দিনের সময়সূচি','ADMISSION EVENT':'ভর্তি পরীক্ষা','Done':'হয়ে গেছে',
  'Confirmed / official date':'নিশ্চিত / অফিসিয়াল তারিখ','Date announced / notice pending':'তারিখ ঘোষণা হয়েছে / নোটিশ বাকি',
  '★ Countdown target':'★ কাউন্টডাউন টার্গেট','★ In My Exams':'★ আমার পরীক্ষায় আছে','☆ Add to My Exams':'☆ আমার পরীক্ষায় যোগ করুন',
  'No exams match these filters.':'এই ফিল্টারে কোনো পরীক্ষা পাওয়া যায়নি।','My Exam':'আমার পরীক্ষা',
  'Guide':'গাইড','Quick navigation':'দ্রুত নেভিগেশন','Schedule overview':'সময়সূচির সারসংক্ষেপ',
  'Search calendar exams':'ক্যালেন্ডারে পরীক্ষা খুঁজুন','Refresh exam dates':'পরীক্ষার তারিখ রিফ্রেশ করুন',
  'Search exam or university…':'পরীক্ষা বা বিশ্ববিদ্যালয় খুঁজুন…','Close day schedule':'দিনের সময়সূচি বন্ধ করুন','Close event details':'পরীক্ষার বিস্তারিত বন্ধ করুন',
  'Close weekly distribution':'সাপ্তাহিক বণ্টন বন্ধ করুন','Switch to dark theme':'ডার্ক থিম চালু করুন','Switch to light theme':'লাইট থিম চালু করুন',
  'Jan':'জানু','Feb':'ফেব্রু','Mar':'মার্চ','Apr':'এপ্রিল','May':'মে','Jun':'জুন','Jul':'জুলাই','Aug':'আগ','Sep':'সেপ্ট','Oct':'অক্টো','Nov':'নভে','Dec':'ডিসে',
  '● checking dates…':'● তারিখ দেখা হচ্ছে…','● could not check dates':'● তারিখ দেখা যায়নি',
  'Use the latest official university notice for final details.':'চূড়ান্ত তথ্যের জন্য সর্বশেষ অফিসিয়াল বিশ্ববিদ্যালয় নোটিশ দেখুন।'
});
Object.assign(BN_EXACT,{
  'DAYS':'দিন','HOURS':'ঘণ্টা','MIN':'মিনিট','SEC':'সেকেন্ড',
  'Medical':'মেডিকেল','Engineering':'ইঞ্জিনিয়ারিং','University':'বিশ্ববিদ্যালয়',
  'Final stretch — revise smart.':'শেষ সময় — স্মার্ট রিভিশন করুন।',
  'Revision mode — stay consistent.':'রিভিশন মোড — নিয়মিত থাকুন।'
});
const BN_REPLACE=[
  ['January','জানুয়ারি'],['February','ফেব্রুয়ারি'],['March','মার্চ'],['April','এপ্রিল'],['May','মে'],['June','জুন'],['July','জুলাই'],['August','আগস্ট'],['September','সেপ্টেম্বর'],['October','অক্টোবর'],['November','নভেম্বর'],['December','ডিসেম্বর'],
  ['Sunday','রবিবার'],['Monday','সোমবার'],['Tuesday','মঙ্গলবার'],['Wednesday','বুধবার'],['Thursday','বৃহস্পতিবার'],['Friday','শুক্রবার'],['Saturday','শনিবার'],
  ['Dhaka University','ঢাকা বিশ্ববিদ্যালয়'],['Khulna University','খুলনা বিশ্ববিদ্যালয়'],['Jagannath University','জগন্নাথ বিশ্ববিদ্যালয়'],['Chittagong University','চট্টগ্রাম বিশ্ববিদ্যালয়'],['Comilla University','কুমিল্লা বিশ্ববিদ্যালয়'],['Rajshahi University','রাজশাহী বিশ্ববিদ্যালয়'],
  ['Medical & Dental','মেডিকেল ও ডেন্টাল'],['Medical / Dental','মেডিকেল / ডেন্টাল'],['Agriculture Cluster','কৃষি গুচ্ছ'],
  ['Fine Arts','চারুকলা'],['Social Science','সামাজিক বিজ্ঞান'],['Science','বিজ্ঞান'],['Humanities','মানবিক'],['Business','ব্যবসায় শিক্ষা'],
  ['Not confirmed','নিশ্চিত নয়'],['Notice pending','নোটিশ বাকি'],['Confirmed','নিশ্চিত'],['Official','অফিসিয়াল'],['Time TBA','সময় পরে জানানো হবে'],
  ['Main countdown target:','মূল কাউন্টডাউন:'],['saved exams','সেভ করা পরীক্ষা'],['local preview','লোকাল প্রিভিউ'],['days left','দিন বাকি'],['offline','অফলাইন'],['showing','দেখানো হচ্ছে'],['exams • updated','পরীক্ষা • আপডেট'],['updated','আপডেট']
];
function dbtTranslateString(value){
  const raw=String(value==null?'':value);
  const trimmed=raw.trim();
  if(!trimmed)return raw;
  let out=BN_EXACT[trimmed]||trimmed;
  for(const pair of BN_REPLACE)out=out.split(pair[0]).join(pair[1]);
  out=out.replace(/Week ([0-9]+)/g,'সপ্তাহ $1')
    .replace(/([0-9]+) exams/g,'$1 পরীক্ষা')
    .replace(/([0-9]+) days/g,'$1 দিন')
    .replace(/([0-9]+) official/g,'$1 অফিসিয়াল')
    .replace(/([0-9]+) waiting/g,'$1 অপেক্ষমাণ')
    .replace(/([0-9]+) Passed/g,'$1 শেষ')
    .replace(/([0-9]+) Total/g,'$1 মোট')
    .replace(/([0-9]+) exam([^A-Za-z]|$)/g,'$1 পরীক্ষা$2')
    .replace(/([0-9]+) page([^A-Za-z]|$)/g,'$1 পেজ$2')
    .replace(/days ([0-9]+–[0-9]+)/g,'দিন $1')
    .replace(/[+]([0-9]+) more/g,'+$1 আরও')
    .replace(/([0-9]+) DAY GAP/g,'$1 দিনের ব্যবধান')
    .replace(/([0-9]+) DAYS GAP/g,'$1 দিনের ব্যবধান');
  return raw.slice(0,raw.indexOf(trimmed))+out+raw.slice(raw.indexOf(trimmed)+trimmed.length);
}
function dbtLocalizeRoot(root){
  if(!root)return;
  const textNodes=[];
  if(root.nodeType===3)textNodes.push(root);
  else if(root.nodeType===1){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;
      return node.nodeValue&&node.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    let n;while((n=walker.nextNode()))textNodes.push(n);
  }
  textNodes.forEach(node=>{
    if(!dbtOriginalText.has(node))dbtOriginalText.set(node,node.nodeValue);
    const original=dbtOriginalText.get(node);
    node.nodeValue=currentLang==='bn'?dbtTranslateString(original):original;
  });
  const elements=[];
  if(root.nodeType===1)elements.push(root,...root.querySelectorAll('*'));
  elements.forEach(el=>{
    if(/^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName))return;
    let saved=dbtOriginalAttrs.get(el);
    if(!saved){saved={};dbtOriginalAttrs.set(el,saved)}
    ['placeholder','title','aria-label'].forEach(attr=>{
      if(el.hasAttribute&&el.hasAttribute(attr)){
        if(saved[attr]===undefined)saved[attr]=el.getAttribute(attr);
        el.setAttribute(attr,currentLang==='bn'?dbtTranslateString(saved[attr]):saved[attr]);
      }
    });
  });
}
function applyLanguage(lang){
  currentLang=lang==='bn'?'bn':'en';
  document.documentElement.dataset.lang=currentLang;
  document.documentElement.lang=currentLang==='bn'?'bn':'en';
  try{localStorage.setItem(DBT_LANG_KEY,currentLang)}catch(e){}
  document.title=currentLang==='bn'?'Admission by DBT | ভর্তি তথ্যকেন্দ্র ২০২৬–২৭':'Admission by DBT | Admission Center 2026–27';
  dbtLocalizeRoot(document.body);
  const btn=document.getElementById('languageToggle');
  if(btn){
    btn.innerHTML='<span>'+(currentLang==='bn'?'EN':'অ')+'</span>';
    const label=currentLang==='bn'?'View in English':'বাংলা ভাষায় দেখুন';
    btn.title=label;btn.setAttribute('aria-label',label);
  }
  if(typeof themeToggle!=='undefined'&&themeToggle){
    const next=document.documentElement.dataset.theme==='light'?'dark':'light';
    themeToggle.title=currentLang==='bn'?(next==='dark'?'ডার্ক থিম চালু করুন':'লাইট থিম চালু করুন'):(next==='dark'?'Switch to dark theme':'Switch to light theme');
    themeToggle.setAttribute('aria-label',themeToggle.title);
  }
}
const dbtLangObserver=new MutationObserver(records=>{
  if(currentLang!=='bn')return;
  records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)dbtLocalizeRoot(n)}));
});
dbtLangObserver.observe(document.body,{childList:true,subtree:true});
applyLanguage(currentLang);
const dbtLanguageButton=document.getElementById('languageToggle');
if(dbtLanguageButton)dbtLanguageButton.onclick=()=>applyLanguage(currentLang==='bn'?'en':'bn');

function applyTheme(theme){
  const next=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=next;
  const tm=document.getElementById('themeColorMeta');if(tm)tm.content=next==='light'?'#f5f6f8':'#07090d';
  try{localStorage.setItem('admissionbydbt-theme-v1',next)}catch(e){}
  if(typeof themeToggle!=='undefined'&&themeToggle){
    themeToggle.title=currentLang==='bn'
      ?(next==='light'?'ডার্ক থিম চালু করুন':'লাইট থিম চালু করুন')
      :(next==='light'?'Switch to dark theme':'Switch to light theme');
    themeToggle.setAttribute('aria-label',themeToggle.title);
  }
}
applyTheme(document.documentElement.dataset.theme||'dark');
themeToggle.onclick=()=>applyTheme(document.documentElement.dataset.theme==='light'?'dark':'light');
let deferredInstallPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;installAppButton.hidden=false});
installAppButton.onclick=async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installAppButton.hidden=true};
addEventListener('appinstalled',()=>{deferredInstallPrompt=null;installAppButton.hidden=true});
if('serviceWorker' in navigator&&!DBT_ADMIN_MODE)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

function initRovingTabs(rootSelector,itemSelector){
  const root=document.querySelector(rootSelector);if(!root)return;
  root.setAttribute('role','tablist');
  const sync=()=>{const items=[...root.querySelectorAll(itemSelector)];items.forEach(x=>{x.setAttribute('role','tab');x.setAttribute('aria-selected',String(x.classList.contains('active')));x.tabIndex=x.classList.contains('active')?0:-1})};
  sync();
  root.addEventListener('click',()=>setTimeout(sync,0));
  root.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const items=[...root.querySelectorAll(itemSelector)],cur=document.activeElement,idx=items.indexOf(cur);if(idx<0)return;e.preventDefault();const next=items[(idx+(e.key==='ArrowRight'?1:-1)+items.length)%items.length];next.focus();next.click()});
}
initRovingTabs('#calendarViewSwitch','[data-calendar-view]');
initRovingTabs('#circularTabs','[data-circular-tab]');

homeSyncButton.onclick=openSyncModal;
syncModalClose.onclick=closeSyncModal;
syncModalBackdrop.onclick=e=>{if(e.target===syncModalBackdrop)closeSyncModal()};
syncCopyButton.onclick=async()=>{try{await navigator.clipboard.writeText(homeSyncCode);syncStatusLine.textContent='Code copied.'}catch(e){syncStatusLine.textContent='Could not copy. Press and hold the code to copy it.'}};
syncBackupButton.onclick=async()=>{
  if(!navigator.onLine){syncStatusLine.textContent='No internet — backup was not sent. Your choices are still safe on this device.';return}
  syncBackupButton.disabled=true;
  syncStatusLine.textContent='Saving backup…';
  try{
    await pushCloudSync();
    syncStatusLine.textContent='Backup saved online. Keep this Secret Code private.';
  }catch(e){
    syncStatusLine.textContent=e&&e.message==='newer_cloud_state'
      ?'A newer backup already exists for this code. Restore it first before saving again.'
      :'Could not save backup right now. Your local copy is unchanged.';
  }finally{syncBackupButton.disabled=false}
};
syncUseButton.onclick=useExistingSyncCode;
syncExistingInput.oninput=()=>{syncExistingInput.value=syncExistingInput.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')};
examPickerClose.onclick=closeExamPicker;
examPickerBackdrop.onclick=e=>{if(e.target===examPickerBackdrop)closeExamPicker()};
examPickerSearch.oninput=renderExamPicker;
targetPickerClose.onclick=closeTargetPicker;
targetPickerBackdrop.onclick=e=>{if(e.target===targetPickerBackdrop)closeTargetPicker()};
targetPickerSearch.oninput=renderTargetPicker;
calendarViewSwitch.querySelectorAll('[data-calendar-view]').forEach(btn=>btn.onclick=()=>{calendarView=btn.dataset.calendarView;saveLocalSyncState();render()});
calendarFilters.querySelectorAll('[data-calendar-filter]').forEach(btn=>btn.onclick=()=>{calendarFilter=btn.dataset.calendarFilter;saveLocalSyncState();render()});
eventDrawerClose.onclick=closeEventDrawer;eventDrawerClose2.onclick=closeEventDrawer;
eventDrawerBackdrop.onclick=e=>{if(e.target===eventDrawerBackdrop)closeEventDrawer()};
eventDrawerStar.onclick=()=>{if(!drawerEvent)return;const current=drawerEvent;toggleStar(current);drawerEvent=current;openEventDrawer(current)};
addEventListener('keydown',e=>{if(e.key==='Escape'){if(syncModalBackdrop.classList.contains('open'))closeSyncModal();else if(examPickerBackdrop.classList.contains('open'))closeExamPicker();else if(targetPickerBackdrop.classList.contains('open'))closeTargetPicker();else if(pdfPickerBackdrop.classList.contains('open'))closePdfPicker();else if(dayEventsBackdrop.classList.contains('open'))closeDayEvents();else if(guideCompareBackdrop.classList.contains('open'))closeGuideCompare();else if(eventDrawerBackdrop.classList.contains('open'))closeEventDrawer()}});
addEventListener('online',()=>{if(validSyncCode(homeSyncCode))setSyncUi('','Save')});
addEventListener('storage',e=>{if(e.key===HOME_SYNC_STATE_KEY&&e.newValue){try{const s=JSON.parse(e.newValue);if(Number(s.updatedAt||0)>Number(homeSyncState?.updatedAt||0)){applySyncState(s);render()}}catch(err){}}});
addEventListener('resize',()=>{calendar.dataset.view=calendarView});
(function hydrateStartupEvents(){
  try{
    const cached=JSON.parse(localStorage.getItem(EVENT_CACHE_KEY)||'null');
    if(cached&&Array.isArray(cached.events)&&cached.events.length){
      all=cached.events;
      sourceHealth=Array.isArray(cached.sources)?cached.sources:[];
      syncStatus.textContent='● '+all.length+' exams • ready';
    }else{
      syncStatus.textContent='● '+all.length+' exams • ready';
    }
  }catch(e){syncStatus.textContent='● '+all.length+' exams • ready'}
})();
render();
initializeSecretSync();
const dbtBackgroundRefresh=()=>load();
if('requestIdleCallback' in window)requestIdleCallback(dbtBackgroundRefresh,{timeout:1200});
else setTimeout(dbtBackgroundRefresh,120);
const dbtUiTick=setInterval(()=>{if(document.hidden)return;countdown();updateStarredTimers()},1000);
addEventListener('visibilitychange',()=>{if(!document.hidden){countdown();updateStarredTimers()}});
// Secret Code cloud transfer is explicit only; no background polling.

const UNIVERSITY_INFO = {
  "ঢাকা বিশ্ববিদ্যালয়": {
    aliases:["DU","Dhaka University","University of Dhaka","ঢাবি"],
    current:[
      "২০২৬–২৭ আবেদন: ১১ নভেম্বর ২০২৬ দুপুর ১২টা থেকে ২৫ নভেম্বর ২০২৬ রাত ১১:৫৯ পর্যন্ত।",
      "পরীক্ষা: IBA — ৫ ডিসেম্বর; বিজ্ঞান — ১২ ডিসেম্বর; কলা, আইন ও সামাজিক বিজ্ঞান — ১৯ ডিসেম্বর; চারুকলা — ২২ ডিসেম্বর; ব্যবসায় শিক্ষা — ২৬ ডিসেম্বর ২০২৬।",
      "IBA ছাড়া অন্য ইউনিটগুলোর পরীক্ষা সকাল ১১টা–১২:৩০; IBA সকাল ১০টা–১২টা।",
      "IBA ছাড়া প্রধান ৩ ইউনিটের পরীক্ষা ঢাকাসহ ৮টি বিভাগীয় শহরে অনুষ্ঠিত হবে।"
    ],
    previous:[
      "২০২৫–২৬ আবেদন: ২৯ অক্টোবর ২০২৫ দুপুর ১২টা থেকে ১৬ নভেম্বর ২০২৫ রাত ১১:৫৯ পর্যন্ত।",
      "প্রবেশপত্র ডাউনলোড শুরু হয়েছিল ২৪ নভেম্বর ২০২৫।",
      "২০২৫–২৬ পরীক্ষার ঘোষিত সময়সূচি: IBA ২৮ নভেম্বর, চারুকলা ২৯ নভেম্বর, ব্যবসায় শিক্ষা ৬ ডিসেম্বর, কলা/আইন/সামাজিক বিজ্ঞান ১৩ ডিসেম্বর; বিজ্ঞান ইউনিটের পরীক্ষা পরে ২৭ ডিসেম্বর ২০২৫ বিকাল ৩:৩০–৫:০০-এ অনুষ্ঠিত হয়।",
      "কলা, আইন ও সামাজিক বিজ্ঞান ইউনিটে ২,৯৩৪টি আসনের বিপরীতে ১,০৭,৭০১ জন পরীক্ষার্থী ছিল।",
      "চারুকলায় ১৩০টি আসন এবং IBA-তে ১২০টি আসন ছিল।"
    ],
    eligibility:[
      "২০২৬–২৭ বিজ্ঞান ইউনিটে বিজ্ঞান বিভাগের জন্য SSC+HSC মোট GPA কমপক্ষে ৮.০০ এবং উভয় পরীক্ষায় কমপক্ষে ৩.৫০।",
      "বিজ্ঞান ইউনিটে মানবিক/ব্যবসায় শিক্ষা থেকে মোট কমপক্ষে ৭.৫০ এবং পৃথকভাবে ৩.০০।",
      "কলা, আইন ও সামাজিক বিজ্ঞান ইউনিটে মানবিক/ব্যবসায় শিক্ষার জন্য মোট ৭.৫০ ও পৃথকভাবে ৩.০০; বিজ্ঞান বিভাগের জন্য মোট ৮.০০ ও পৃথকভাবে ৩.৫০।",
      "চারুকলা ইউনিটে মোট GPA কমপক্ষে ৬.৫০ এবং পৃথকভাবে ৩.০০।"
    ],
    format:[
      "প্রধান ইউনিটে মোট ৯০ মিনিট: ৪৫ মিনিট MCQ + ৪৫ মিনিট লিখিত।",
      "ভর্তি পরীক্ষা ১০০ নম্বর + SSC/HSC ফল ২০ নম্বর = মোট ১২০ নম্বর মূল্যায়ন।",
      "চারুকলায় সাধারণ জ্ঞান ও অঙ্কন থাকে; IBA-এর প্রক্রিয়া আলাদা।"
    ],
    seats:"বর্তমান ২০২৬–২৭ পূর্ণ বিভাগভিত্তিক আসন তালিকা প্রকাশ হলে অফিসিয়াল পোর্টালকে অগ্রাধিকার দিতে হবে।",
    fee:"২০২৬–২৭ সাধারণ আবেদন ফি বর্তমান যাচাইকৃত উৎসে এখনও নিশ্চিত নয়।",
    documents:["SSC/HSC তথ্য","ছবি ও স্বাক্ষর","প্রযোজ্য কোটার কাগজপত্র","প্রবেশপত্র"],
    links:[["অফিসিয়াল ভর্তি পোর্টাল","https://admission.eis.du.ac.bd/"],["২০২৬–২৭ অফিসিয়াল ঘোষণা","https://du.edu.bd/public/du_post_details/post/28137"]]
  },

  "BUET": {
    aliases:["বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়","Bangladesh University of Engineering and Technology","বুয়েট"],
    current:["২০২৬–২৭ ভর্তি পরীক্ষা: ১৬ জানুয়ারি ২০২৭।","বর্তমান বিস্তারিত সার্কুলার প্রকাশ হলে BUET-এর অফিসিয়াল ভর্তি পোর্টালের তথ্যই চূড়ান্ত হবে।"],
    previous:[
      "২০২৫–২৬ অনলাইন আবেদন শুরু ১৬ নভেম্বর ২০২৫; শেষ ২ ডিসেম্বর ২০২৫; ফি জমার শেষ সময় ৪ ডিসেম্বর।",
      "ভর্তি পরীক্ষা অনুষ্ঠিত হয়েছিল ১০ জানুয়ারি ২০২৬, মডিউল A ও B-তে সকাল/বিকাল শিফটে।",
      "২০২৫–২৬-এ প্রাথমিক বাছাই পরীক্ষা ছিল না; মূলত লিখিত পরীক্ষার মাধ্যমে নির্বাচন, পরে মৌখিক পরীক্ষা ছিল।",
      "আবেদন ফি: প্রকৌশল/URP ক্যাটাগরিতে ১,৩০০ টাকা; স্থাপত্যসহ ক্যাটাগরিতে ১,৫০০ টাকা।",
      "নির্বাচিত ও অপেক্ষমাণ প্রার্থীর সম্ভাব্য মেধাতালিকা প্রকাশের তারিখ ছিল ৭ ফেব্রুয়ারি ২০২৬।"
    ],
    eligibility:["২০২৬–২৭ সুনির্দিষ্ট GPA/বিষয়ভিত্তিক যোগ্যতা বর্তমান অফিসিয়াল সার্কুলার প্রকাশ না হওয়া পর্যন্ত গত বছরের নিয়মকে চূড়ান্ত ধরা যাবে না।"],
    format:["২০২৫–২৬-এ লিখিত পরীক্ষা; Architecture-এর জন্য অতিরিক্ত অঙ্কন/দৃষ্টিগত-স্থানিক দক্ষতার অংশ ছিল।"],
    seats:"বর্তমান বিভাগভিত্তিক আসন অফিসিয়াল ২০২৬–২৭ প্রসপেক্টাস থেকে নিতে হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ; ২০২৫–২৬ রেফারেন্স ১,৩০০/১,৫০০ টাকা।",
    documents:["SSC/HSC তথ্য ও সনদ","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান/কোটা কাগজ"],
    links:[["BUET আন্ডারগ্র্যাজুয়েট ভর্তি পোর্টাল","https://ugadmission.buet.ac.bd/"]]
  },

  "RUET": {
    aliases:["Rajshahi University of Engineering and Technology","রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","রুয়েট"],
    current:["ক্যালেন্ডারে ১৪ জানুয়ারি ২০২৭ পরীক্ষা ট্র্যাক করা হচ্ছে; তবে ৭ অক্টোবর ২০২৬ পর্যন্ত RUET-এর অফিসিয়াল admission material-এ পূর্ণ ২০২৬–২৭ undergraduate circular পাওয়া যায়নি।","অফিসিয়াল সাইটে এখনও ২০২৫–২৬ circular দৃশ্যমান; তাই eligibility, fee, seats, application dates ও detailed exam rules আগের বছরের তথ্য মাত্র।"],
    previous:[
      "২০২৫–২৬ আবেদন: ২ ডিসেম্বর ২০২৫ সকাল ১০টা থেকে ১৩ ডিসেম্বর বিকাল ৫টা।",
      "আবেদন ফি জমার শেষ সময় ছিল ১৫ ডিসেম্বর ২০২৫ দুপুর ১২টা।",
      "যোগ্য প্রার্থীর তালিকা ৩ জানুয়ারি ২০২৬; আসনবিন্যাস ৬ জানুয়ারি; প্রবেশপত্র ১০ জানুয়ারি বিকাল ৫টা থেকে।",
      "ভর্তি পরীক্ষা ছিল ২২ জানুয়ারি ২০২৬; ফল প্রকাশের লক্ষ্য ৬ ফেব্রুয়ারি।",
      "KA গ্রুপ: ৪০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট — উচ্চতর গণিত ১২০, পদার্থ ১২০, রসায়ন ১২০, ইংরেজি ৪০।",
      "KHA/Architecture: অতিরিক্ত ২০০ নম্বর — Free-hand Drawing ১০০ + Visual-Spatial Intelligence ১০০; সময় ১ ঘণ্টা।"
    ],
    eligibility:["২০২৬–২৭ যোগ্যতা নতুন প্রসপেক্টাস অনুযায়ী নিতে হবে; আগের বছরের পূর্ণ যোগ্যতা অফিসিয়াল RUET প্রসপেক্টাসে আছে।"],
    format:["KA: ৪০০ নম্বর; Architecture-এ অতিরিক্ত ২০০ নম্বর।"],
    seats:"বর্তমান বিভাগভিত্তিক আসন ২০২৬–২৭ প্রসপেক্টাস থেকে নেওয়া হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC সনদ ও গ্রেডশিট","ছবি/স্বাক্ষর","কোটা সনদ","প্রবেশপত্র"],
    links:[["RUET ভর্তি পোর্টাল","https://admission.ruet.ac.bd/"],["২০২৫–২৬ ইংরেজি প্রসপেক্টাস","https://admission.ruet.ac.bd/notices/prospectus/en-prospectus-2025-26.pdf"]]
  },

  "KUET": {
    aliases:["Khulna University of Engineering and Technology","খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","কুয়েট"],
    current:["২০২৬–২৭ পরীক্ষা: ৮ জানুয়ারি ২০২৭।","বর্তমান অফিসিয়াল পোর্টালে কেন্দ্র হিসেবে KUET, ঢাকা বিশ্ববিদ্যালয় ও RUET দেখানো হয়েছে।"],
    previous:[
      "২০২৫–২৬ আবেদন শুরু ৩ ডিসেম্বর ২০২৫ সকাল ১০টা; শেষ ১৩ ডিসেম্বর রাত ১১:৫৯।",
      "প্রথম ধাপের ফি ১৪ ডিসেম্বর বিকাল ৫টার মধ্যে; যোগ্য তালিকা ২০ ডিসেম্বর; দ্বিতীয় ধাপের ফি ৩০ ডিসেম্বরের মধ্যে।",
      "প্রবেশপত্র ডাউনলোড শুরু ৫ জানুয়ারি ২০২৬।",
      "ভর্তি পরীক্ষা ১৫ জানুয়ারি ২০২৬ সকাল ৯:৩০–১২:৩০; Architecture অঙ্কন ১২:৪৫–১:৪৫।",
      "মোট ১,০৬৫ আসন; এর মধ্যে ৫টি সংরক্ষিত আসন।",
      "উদাহরণ: CE ১২০, URP ৬০, Architecture ৪০, EEE ১২০, CSE ১২০, ECE ৬০, BME ৩০, ME ১২০।",
      "লিখিত পরীক্ষা মোট ৫০০: গণিত ১৫০, পদার্থ ১৫০, রসায়ন ১৫০, ইংরেজি ৫০। Architecture-এ অতিরিক্ত ১০০ নম্বর মুক্তহস্ত অঙ্কন।",
      "SSC ন্যূনতম GPA ৪.০০; HSC-তে গণিত, পদার্থ, রসায়নে পৃথক GPA ৪.০০; চারটি নির্ধারিত বিষয়ের মোট গ্রেড পয়েন্ট কমপক্ষে ১৮.০০।",
      "সর্বোচ্চ প্রায় ১২,০০০ প্রার্থীকে HSC গণিত+পদার্থ+রসায়ন+ইংরেজির গ্রেড পয়েন্টের ভিত্তিতে পরীক্ষায় সুযোগ দেওয়া হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ চূড়ান্ত যোগ্যতা নতুন সার্কুলার অনুযায়ী; ২০২৫–২৬ রেফারেন্সে SSC GPA ৪.০০ এবং HSC Math/Physics/Chemistry-তে পৃথক GPA ৪.০০ ছিল।"],
    format:["গত বছর লিখিত ৫০০ নম্বর; Architecture-এ অতিরিক্ত ১০০ নম্বর অঙ্কন।"],
    seats:"গত বছর মোট ১,০৬৫; বর্তমান সংখ্যা নতুন সার্কুলারে যাচাই করতে হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC মূল রেজিস্ট্রেশন/সনদ","রঙিন প্রবেশপত্র","ছবি/স্বাক্ষর","প্রযোজ্য কোটা কাগজ"],
    links:[["KUET ভর্তি পোর্টাল","https://admission.kuet.ac.bd/"],["২০২৫–২৬ অফিসিয়াল প্রসপেক্টাস","https://admission.kuet.ac.bd/adm/fNotice/2025-2026%20Prospectus-Ban.pdf"]]
  },

  "CUET": {
    aliases:["Chittagong University of Engineering and Technology","চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","চুয়েট"],
    current:["২০২৬–২৭ ভর্তি পরীক্ষার ২৩ জানুয়ারি ২০২৭ তারিখটি CUET-এর অফিসিয়াল ঘোষণায় সম্ভাব্য/টেন্টেটিভ হিসেবে দেওয়া হয়েছে; এটি এখনও চূড়ান্ত তারিখ নয়।","এই ঘোষণায় সুনির্দিষ্ট পরীক্ষার সময় প্রতিষ্ঠিত নয়; তাই ক্যালেন্ডারে Time TBA দেখানো হবে।"],
    previous:[
      "২০২৫–২৬ আবেদন: ১৫ ডিসেম্বর ২০২৫ সকাল ৯টা থেকে ৩১ ডিসেম্বর রাত ১১:৫৯।",
      "আবেদন ফি জমার শেষ সময় ১ জানুয়ারি ২০২৬ রাত ১১:৫৯।",
      "যোগ্য তালিকা প্রকাশ ৬ জানুয়ারি; প্রবেশপত্র ডাউনলোড শুরু ১২ জানুয়ারি সকাল ১০টা।",
      "ভর্তি পরীক্ষা ১৭ জানুয়ারি ২০২৬।",
      "বাংলাদেশি শিক্ষার্থীদের জন্য HSC Math+Physics+Chemistry মোট গ্রেড পয়েন্ট কমপক্ষে ১৪.০০ এবং English-এ ৩.০০; Biomedical Engineering-এর জন্য Biology-তে ৪.০০ লাগত।"
    ],
    eligibility:["২০২৬–২৭ পূর্ণ সার্কুলার প্রকাশ হলে সেটিই চূড়ান্ত; ২০২৫–২৬ রেফারেন্সে Math+Physics+Chemistry মোট ১৪.০০ এবং English ৩.০০ ছিল।"],
    format:["বর্তমান পরীক্ষার পূর্ণ নম্বরবণ্টন নতুন সার্কুলারে যাচাই করতে হবে।"],
    seats:"বর্তমান আসন তালিকা নতুন সার্কুলার থেকে নেওয়া হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা/সমমান কাগজ"],
    links:[["CUET অফিসিয়াল ভর্তি পোর্টাল","https://admissioncuet.ac.bd/"],["CUET ভর্তি তথ্য","https://cuet.ac.bd/admission"]]
  },

  "MIST": {
    aliases:["Military Institute of Science and Technology","মিস্ট"],
    current:["২০২৬–২৭ পরীক্ষার তারিখ এখন ঘোষিত: C Unit — ১৮ ডিসেম্বর; A & B — ১৯ ডিসেম্বর ২০২৬।","বর্তমান রিপোর্ট অনুযায়ী ১৮ ডিসেম্বরের পরীক্ষা সকালে এবং ১৯ ডিসেম্বরের পরীক্ষাগুলো সকাল/বিকেলে হবে, কিন্তু unit-wise exact times ও পূর্ণ ২০২৬–২৭ circular/application details এখনও pending; MIST admission portal-এ পুরোনো cycle দেখা যাচ্ছে।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল পোর্টালে আবেদন শেষ সময় ছিল ১৯ জানুয়ারি ২০২৬।",
      "Unit A: মোট ২০০ নম্বর, ৩ ঘণ্টা — গণিত ৮০, পদার্থ ৬০, রসায়ন ৪০, ইংরেজি ২০।",
      "Unit B: Freehand Drawing & Visual-Spatial Intelligence — ২০০ নম্বর, ২ ঘণ্টা।",
      "Unit A ও B-তে পৃথকভাবে ন্যূনতম ৪০% প্রয়োজন ছিল।",
      "Unit C: ৮০ নম্বর MCQ, ৬০ মিনিট — গণিত ২৫, রসায়ন ২৫, পদার্থ ২০, ইংরেজি ১০; পাস নম্বর ৩২।",
      "ফি: Engineering ১,২০০ টাকা; Engineering+Architecture ১,৪০০ টাকা; Unit C ১,০০০ টাকা।",
      "Unit C-এর মৌলিক GPA শর্ত ছিল SSC ও HSC-তে পৃথকভাবে কমপক্ষে ৩.৫০।"
    ],
    eligibility:["প্রোগ্রামভেদে আলাদা; Biomedical Engineering-এ Biology-এর অতিরিক্ত শর্ত থাকে।"],
    format:["A: ২০০ নম্বর/৩ ঘণ্টা; B: ২০০ নম্বর/২ ঘণ্টা; C: ৮০ নম্বর MCQ/৬০ মিনিট — গত বছরের অফিসিয়াল রেফারেন্স।"],
    seats:"বর্তমান প্রোগ্রামভিত্তিক আসন নতুন সার্কুলার অনুযায়ী।",
    fee:"বর্তমান ২০২৬–২৭ ফি নতুন নোটিশে যাচাই করতে হবে।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","GCE হলে transcript/certificate"],
    links:[["MIST ভর্তি পোর্টাল","https://admission.mist.ac.bd/"],["MIST Undergraduate Information","https://research.mist.ac.bd/study-with-us/undergraduate"]]
  },

  "BUP": {
    aliases:["Bangladesh University of Professionals","বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস"],
    current:["BUP ১ সেপ্টেম্বর ২০২৬ তারিখে ২০২৬–২৭ সেশনের অফিসিয়াল Admission Notice প্রকাশ করেছে।","ক্যালেন্ডারে FASS, FST, FET, FMS, FSSS, FBS ও BBA General-এর তারিখ ট্র্যাক করা হচ্ছে; exact exam times কেবল বর্তমান বিস্তারিত নোটিশে স্পষ্টভাবে থাকলে final ধরা হবে।"],
    previous:[
      "পূর্ববর্তী আন্ডারগ্র্যাজুয়েট রেফারেন্সে আবেদন প্রসেসিং ফি ছিল প্রতি faculty-তে ১,১০০ টাকা।",
      "ভর্তি পরীক্ষা ছিল MCQ ভিত্তিক; প্রতিটি ভুল উত্তরে ০.৫০ নম্বর কাটা হতো।",
      "English-এ ন্যূনতম ৪০% পাওয়ার শর্ত ছিল।",
      "MBA ছাড়া আন্ডারগ্র্যাজুয়েট রেফারেন্সে মূল্যায়ন: ভর্তি পরীক্ষা ৫৫%, HSC ২৫%, SSC ২০%।",
      "FST ছাড়া সাধারণভাবে calculator অনুমোদিত ছিল না; FST-তে admit card-এ অনুমোদিত model উল্লেখ থাকত।"
    ],
    eligibility:["Faculty/Program ভেদে GPA ও subject requirement আলাদা; ২০২৬–২৭ অফিসিয়াল notice-ই চূড়ান্ত।"],
    format:["MCQ; negative marking ও faculty-specific details বর্তমান notice থেকে যাচাই করতে হবে।"],
    seats:"Faculty/Program ভেদে আসন ২০২৬–২৭ notice থেকে নিতে হবে।",
    fee:"গত বছরের রেফারেন্স ১,১০০ টাকা/Faculty; বর্তমান fee notice-এ যাচাই করতে হবে।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","কোটা কাগজ","সমমান সনদ","প্রবেশপত্র"],
    links:[["BUP ভর্তি পোর্টাল","https://admission.bup.edu.bd/Admission/Home"],["সব BUP Notice","https://admission.bup.edu.bd/Admission/NoticeAll"]]
  },

  "রাজশাহী বিশ্ববিদ্যালয়": {
    aliases:["University of Rajshahi","Rajshahi University","RU","রাবি"],
    current:["বর্তমান ক্যালেন্ডারে B/Business — ৮ জানুয়ারি, C/Science — ৯ জানুয়ারি এবং A/Humanities — ১৬ জানুয়ারি ২০২৭ ট্র্যাক করা হচ্ছে।","৭ অক্টোবর ২০২৬ পর্যন্ত নতুন পূর্ণ অফিসিয়াল ২০২৬–২৭ undergraduate circular পাওয়া যায়নি; eligibility, fee, seats, application dates ও detailed exam rules তাই এখনও প্রকাশ হয়নি।"],
    previous:[
      "২০২৫–২৬ অনলাইন আবেদন: ২০ নভেম্বর ২০২৫ দুপুর ১২:০১ থেকে ৭ ডিসেম্বর রাত ১১:৫৯ পর্যন্ত (অফিসিয়াল guideline)।",
      "অফিসিয়াল পোর্টালে Application Guideline, Payment Instructions, Photo/Selfie Instructions, Helpline, FAQ ও Complaint সুবিধা ছিল।",
      "পূর্ববর্তী সেশনে Unit C পরীক্ষা ১৬ জানুয়ারি, Unit A ১৭ জানুয়ারি এবং Unit B ২৪ জানুয়ারি ২০২৬ অনুষ্ঠিত হয়েছিল।",
      "গত বছর Departments/Institutes Seats নামে আলাদা অফিসিয়াল seat notice প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["Unit/Department অনুযায়ী যোগ্যতা আলাদা; ২০২৬–২৭ অফিসিয়াল guideline প্রকাশ হলে সেটিই চূড়ান্ত।"],
    format:["বর্তমান ২০২৬–২৭ পরীক্ষার পূর্ণ marks distribution অফিসিয়াল notice-এ যাচাই করতে হবে।"],
    seats:"Department/Institute seat notice থেকে বর্তমান সংখ্যা নিতে হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","Photo/Selfie","কোটা কাগজ","প্রবেশপত্র"],
    links:[["RU ভর্তি পোর্টাল","https://admission.ru.ac.bd/"],["২০২৫–২৬ Application Guideline","https://admission.ru.ac.bd/student/application-guideline"]]
  },

  "জগন্নাথ বিশ্ববিদ্যালয়": {
    aliases:["Jagannath University","JnU","জবি"],
    current:["২০২৬–২৭ অফিসিয়াল admission schedule available: A — ১ জানুয়ারি; E — ৮ জানুয়ারি; B — ১৫ জানুয়ারি; C — ২২ জানুয়ারি; D — ২৩ জানুয়ারি ২০২৭।","২০২৬–২৭ আবেদন তথ্য ও যোগ্যতাও অফিসিয়াল ভর্তি সূত্রে দেওয়া আছে; বর্তমান অফিসিয়াল তথ্য-কে আগের বছরের তথ্য-এর ওপর অগ্রাধিকার দিন।"],
    previous:[
      "২০২৫–২৬ আবেদন: ২০ নভেম্বর–৫ ডিসেম্বর ২০২৫।",
      "Admit Card: A Unit ১০–২১ ডিসেম্বর; C Unit ১০–২২ ডিসেম্বর; D Unit ২৫ ডিসেম্বর–৪ জানুয়ারি; E Unit ৭–১১ ডিসেম্বর; B Unit ১৫–২৫ জানুয়ারি।",
      "২০২৫–২৬ পরীক্ষার তারিখ: A ২৬ ডিসেম্বর, C ২৭ ডিসেম্বর, D ৯ জানুয়ারি, E ১৩ ডিসেম্বর, B ৩০ জানুয়ারি।",
      "অফিসিয়াল admission portal-এ user manual ও পূর্ণ ভর্তি নির্দেশিকা প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ Unit-wise যোগ্যতা নতুন guideline অনুযায়ী নিতে হবে।"],
    format:["Unit-wise marks ও question pattern current circular অনুযায়ী।"],
    seats:"বর্তমান seat matrix নতুন prospectus/guideline থেকে নেওয়া হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","কোটা/সমমান কাগজ","প্রবেশপত্র"],
    links:[["JnU ২০২৬–২৭ অফিসিয়াল ভর্তি ঘোষণা","https://jnu.ac.bd/newsite/newsdetails/138749"],["JnU ভর্তি পোর্টাল (পুরোনো cycle দেখা যেতে পারে)","https://admission.jnu.ac.bd/"]]
  },

  "খুলনা বিশ্ববিদ্যালয়": {
    aliases:["Khulna University","KU","খুবি"],
    current:["২০২৬–২৭: D/Business ও C/Humanities — ১৭ ডিসেম্বর; A/Science ও B/Life Science — ১৮ ডিসেম্বর ২০২৬।"],
    previous:[
      "২০২৫–২৬ A Unit ও D Unit-এর আবেদন ছিল ৭ নভেম্বর থেকে ২৭ নভেম্বর ২০২৫ রাত ১১:৫৯ পর্যন্ত।",
      "A Unit পরীক্ষা ১৯ ডিসেম্বর ২০২৫; D Unit পরীক্ষা ১৮ ডিসেম্বর ২০২৫।",
      "A Unit-এ মোট ৩২০ আসন; Architecture ৩৭, CSE ৪০, URP ৪০, ECE ৩৭, Mathematics ৪৫, Physics ৪০, Chemistry ৪০, Statistics ৪০।",
      "A Unit যোগ্যতা: SSC+HSC মোট GPA কমপক্ষে ৮.০০।",
      "A Unit পরীক্ষা ১০০ নম্বর: MCQ ৬০ + লিখিত ৪০; Architecture-এর জন্য অতিরিক্ত Freehand Drawing ৫০। MCQ ভুল উত্তরে ০.২৫ নম্বর কাটা হতো।",
      "D Unit-এ মোট ৮৮ আসন; Business Administration ৪৭ ও Human Resource Management ৪০সহ quota।",
      "D Unit যোগ্যতা: SSC ও HSC উভয়টিতে পৃথক GPA কমপক্ষে ৩.৫০ এবং HSC English-এ GPA কমপক্ষে ৩.০০।",
      "D Unit পরীক্ষা ১০০ নম্বর/১ ঘণ্টা ৩০ মিনিট: MCQ ৬০ + English Composition লিখিত ৪০; MCQ-তে ২৫% negative marking।"
    ],
    eligibility:["Unitভেদে আলাদা; A Unit Science/Engineering এবং D Unit Business-এর যোগ্যতা গত বছরের official prospectus-এ বিস্তারিত ছিল।"],
    format:["A Unit: MCQ+লিখিত; D Unit: MCQ+English Composition; Architecture-এ অতিরিক্ত অঙ্কন — ২০২৫–২৬ রেফারেন্স।"],
    seats:"গত বছর A Unit ৩২০, D Unit ৮৮; ২০২৬–২৭ নতুন circular-এ পরিবর্তন হতে পারে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC মূল grade sheet/certificate","ছবি/স্বাক্ষর","quota certificate","প্রবেশপত্র"],
    links:[["KU Application Portal","https://apply.ku.ac.bd/"],["২০২৫–২৬ A Unit Prospectus","https://apply.ku.ac.bd/images/prospectus/A-Unit.pdf"],["২০২৫–২৬ D Unit Prospectus","https://apply.ku.ac.bd/images/prospectus/D-Unit.pdf"]]
  },

  "SUST": {
    aliases:["Shahjalal University of Science and Technology","শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়","শাবিপ্রবি"],
    current:["২০২৬–২৭ ভর্তি পরীক্ষা ২৬–২৭ জানুয়ারি ২০২৭—এই দুই test day প্রতিষ্ঠিত।","A Unit কোন দিন এবং B Unit কোন দিন—unit-wise allocation এখনও প্রতিষ্ঠিত নয়; তাই ক্যালেন্ডারে A=26 / B=27 হিসেবে দেখানো হবে না। পূর্ণ application/test-plan circular pending।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল admission site department eligibility table প্রকাশ করেছে।",
      "বিভাগে ভর্তির জন্য সংশ্লিষ্ট HSC-Level prerequisite subject-এ সাধারণত কমপক্ষে GPA ৩.০০ লাগত।",
      "CSE/EEE/IPE/MEE/PHY/SWE-তে Physics ও Mathematics; ARC-এ Physics ও Mathematics; BMB/GEB-এ Biology, Chemistry, Mathematics; MAT/STA-তে Mathematics প্রয়োজন ছিল।",
      "গত বছরের অফিসিয়াল admission portal-এ SSC/HSC board, roll ও pass year দিয়ে registration শুরু করা হতো।"
    ],
    eligibility:["Unit eligibility-এর পাশাপাশি Department-specific prerequisite subject পূরণ করা বাধ্যতামূলক হতে পারে।"],
    format:["২০২৬–২৭ পূর্ণ marks distribution current circular অনুযায়ী।"],
    seats:"বিভাগভিত্তিক বর্তমান seat matrix current prospectus থেকে নিতে হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["SUST ভর্তি পোর্টাল","https://admission.sust.edu.bd/"]]
  },

  "চট্টগ্রাম বিশ্ববিদ্যালয়": {
    aliases:["University of Chittagong","Chittagong University","CU","চবি"],
    current:["২০২৬–২৭ অফিসিয়াল schedule/application announcement available: C — ২৯ জানুয়ারি; A — ৩০ জানুয়ারি; B1 — ৩ ফেব্রুয়ারি; B2 — ৪ ফেব্রুয়ারি; B — ৫ ফেব্রুয়ারি; D — ৬ ফেব্রুয়ারি; D1 — ৮ ফেব্রুয়ারি ২০২৭।","Current 2026–27 official admission source-কে previous-year prospectus-এর ওপর অগ্রাধিকার দিন।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল CU admission portal-এ Prospectus, Admission Notice, Application Process, General Eligibility, Schedule ও Fee Rules আলাদা মেনুতে প্রকাশ করা হয়েছিল।",
      "A Unit-এর helpline আলাদা ছিল Science/Biological Sciences/Engineering/Marine Sciences faculties-এর জন্য।",
      "B/B1/B2, C, D/D1-এর জন্য আলাদা faculty helpline ছিল।",
      "গত বছরের portal-এ unit-specific eligibility ও fee rules অফিসিয়ালি প্রকাশ করা হয়েছিল; ২০২৬–২৭-এ নতুন prospectus প্রকাশ হলে সেটিই ব্যবহার করতে হবে।"
    ],
    eligibility:["Unit এবং Department অনুযায়ী যোগ্যতা ভিন্ন; current prospectus-ই চূড়ান্ত।"],
    format:["Unit-wise question pattern, duration ও negative marking current prospectus অনুযায়ী।"],
    seats:"Unit/Department seat matrix current prospectus থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota documents","প্রবেশপত্র"],
    links:[["CU ভর্তি পোর্টাল","https://admission.cu.ac.bd/"],["২০২৫–২৬ Admission Notice Page","https://admission.cu.ac.bd/admission-notice"]]
  },

  "কুমিল্লা বিশ্ববিদ্যালয়": {
    aliases:["Comilla University","CoU","কুবি"],
    current:["অফিসিয়ালি ঘোষিত ২০২৬–২৭ পরীক্ষার তারিখ: A — ৫ ফেব্রুয়ারি; B — ৬ ফেব্রুয়ারি; C — ৭ ফেব্রুয়ারি ২০২৭।","পূর্ণ বিস্তারিত ভর্তি বিজ্ঞপ্তি/আবেদনের সময়সূচি ৭ অক্টোবর ২০২৬ পর্যন্ত pending; aggregator application dates-কে final হিসেবে দেখানো হবে না।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল ভর্তি বিজ্ঞপ্তি ২৫ নভেম্বর ২০২৫ এবং ভর্তি নির্দেশিকা ২৭ নভেম্বর প্রকাশ হয়েছিল।",
      "আবেদন শুরু হয়েছিল ২৭ নভেম্বর ২০২৫; সময় পরে বাড়ানো হয়েছিল।",
      "ভর্তি পরীক্ষা ৩০ ও ৩১ জানুয়ারি ২০২৬ অনুষ্ঠিত হয়েছিল।",
      "অফিসিয়াল notice অনুযায়ী ২০২৫–২৬ প্রবেশপত্র ডাউনলোড ২৬ জানুয়ারি ২০২৬ থেকে শুরু হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ Unit-wise GPA ও subject eligibility নতুন official guideline অনুযায়ী।"],
    format:["বর্তমান unit-wise marks distribution নতুন guideline অনুযায়ী।"],
    seats:"বর্তমান seat matrix নতুন guideline থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["কুমিল্লা বিশ্ববিদ্যালয় Admission Archive","https://www.cou.ac.bd/admission"],["Undergraduate Program Notices","https://www.cou.ac.bd/program-category/undergraduate-program"]]
  },

  "BUTEX": {
    aliases:["Bangladesh University of Textiles","বুটেক্স","Textile University"],
    current:["২০২৬–২৭ পরীক্ষা: ২৯ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬-এ প্রায় ৯,০০০ পরীক্ষার্থীকে ৬৪০ আসনের বিপরীতে পরীক্ষায় অংশ নিতে দেওয়া হয়েছিল।",
      "SSC GPA কমপক্ষে ৪.০০ এবং HSC GPA কমপক্ষে ৪.০০।",
      "HSC Math+Physics+Chemistry+English মোট Grade Point কমপক্ষে ১৭.৫০; প্রতিটি বিষয়ে কমপক্ষে ৩.৫০।",
      "HSC-তে Mathematics অন্তত optional subject হিসেবে থাকতে হতো।",
      "Second timer গ্রহণ করা হয়নি; শুধুমাত্র ওই বছরের HSC উত্তীর্ণরা আবেদন করতে পারত।",
      "লিখিত পরীক্ষা ২০০ নম্বর: Mathematics ৬০, Physics ৬০, Chemistry ৬০, English ২০।",
      "Admit Card download সময় ১ জানুয়ারি থেকে বাড়িয়ে ৫ জানুয়ারি ২০২৬ রাত ১১:৫৯ পর্যন্ত করা হয়েছিল।"
    ],
    eligibility:["বর্তমান ২০২৬–২৭ circular না আসা পর্যন্ত গত বছরের GPA ও passing-year নিয়মকে কেবল reference হিসেবে দেখুন।"],
    format:["গত বছর Written ২০০ marks — Math ৬০, Physics ৬০, Chemistry ৬০, English ২০।"],
    seats:"গত বছর ৬৪০ আসন; current circular-এ পরিবর্তন হতে পারে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","equivalence document"],
    links:[["BUTEX Undergraduate Admission","https://www.butex.edu.bd/admissions/"]]
  },

  "AAUB": {
    aliases:["Aviation and Aerospace University Bangladesh","Aviation and Aerospace University, Bangladesh","এএউবি"],
    current:["২০২৬–২৭ স্নাতক ভর্তি পরীক্ষা: ৫ ডিসেম্বর ২০২৬; কেন্দ্র BAF Shaheen College, Dhaka এবং AAUB Lalmonirhat Campus।"],
    previous:[
      "২০২৫–২৬ আবেদন: ৯ নভেম্বর ২০২৫ দুপুর ১২টা থেকে ১১ ডিসেম্বর রাত ১১:৫৯।",
      "সার্ভিস চার্জ/আবেদন ফি ১,০০০ টাকা; প্রদানের শেষ সময় ১৪ ডিসেম্বর রাত ১১:৫৯।",
      "যোগ্য প্রার্থীর তালিকা ১৫ ডিসেম্বর; প্রবেশপত্র ১৬ ডিসেম্বর দুপুর ১২টা থেকে ২৬ ডিসেম্বর সকাল ৯টা পর্যন্ত।",
      "ভর্তি পরীক্ষা ২৬ ডিসেম্বর ২০২৫ সকাল ১০টা–১২টা।",
      "৪ বছর মেয়াদি undergraduate program: B.Sc. Aerospace Engineering, Avionics Engineering, Aircraft Maintenance Engineering (Aerospace), Aircraft Maintenance Engineering (Avionics)।"
    ],
    eligibility:["২০২৬–২৭ current notice-ই চূড়ান্ত; গত বছরের পূর্ণ eligibility guideline official PDF-এ আছে।"],
    format:["গত বছরের written test ছিল ২ ঘণ্টা।"],
    seats:"বর্তমান program-wise seats current notice থেকে।",
    fee:"গত বছর ১,০০০ টাকা; current fee নতুন notice অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান কাগজ"],
    links:[["AAUB Admission Info","https://www.aaub.edu.bd/public/content/admission-info"],["২০২৫–২৬ Admission Guideline PDF","https://aaub.edu.bd/public/ckfinder/userfiles/files/Admission-Instruction-2025-26%281%29.pdf"]]
  },

  "GST গুচ্ছ": {
    aliases:["GST","GST Cluster","General Science and Technology Cluster","গুচ্ছ"],
    current:["ঘোষিত ২০২৬–২৭ GST schedule: B/Humanities — ১৯ মার্চ ১১টা–১২টা; C/Business — ২০ মার্চ ১১টা–১২টা; D/Architecture — ২০ মার্চ ৩টা–৪টা; A/Science — ২৭ মার্চ ১১টা–১২টা।","পূর্ণ official application circular এখনও pending; eligibility, fee, seats ও detailed rules current circular ছাড়া final নয়।"],
    previous:[
      "২০২৫–২৬ official GST portal-এর workflow অনুযায়ী ইউনিটভিত্তিক আবেদন, admit card, centre এবং subject choice এক প্ল্যাটফর্মে পরিচালিত হয়েছে।",
      "গত বছরের participating university/seat matrix ও eligibility session-specific ছিল; তাই ২০২৬–২৭-এ তালিকা পরিবর্তিত হতে পারে।"
    ],
    eligibility:["A/B/C unit অনুযায়ী group, GPA ও subject requirement current GST circular থেকে নিতে হবে।"],
    format:["বর্তমান marks distribution, duration ও negative marking current circular অনুযায়ী।"],
    seats:"Participating university-wise seat matrix current GST notice থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["GST Official Portal","https://gstadmission.ac.bd/"]]
  },

  "কৃষি গুচ্ছ": {
    aliases:["Agriculture Cluster","Agri","Agricultural Universities Cluster","ACAS"],
    current:["ক্যালেন্ডারে ২০২৬–২৭ পরীক্ষা ২ জানুয়ারি ২০২৭ ট্র্যাক করা হচ্ছে।","৭ অক্টোবর ২০২৬ পর্যন্ত নতুন পূর্ণ ২০২৬–২৭ ACAS circular পাওয়া যায়নি; eligibility, fee, seats, application schedule ও exam details এখনও প্রকাশ হয়নি।"],
    previous:[
      "২০২৫–২৬ কৃষি গুচ্ছে কৃষিবিজ্ঞান বিষয়ে ডিগ্রি প্রদানকারী ৯টি পাবলিক বিশ্ববিদ্যালয় অংশ নিয়েছিল।",
      "অফিসিয়াল ভর্তি বিজ্ঞপ্তি ও ভর্তি নির্দেশিকা প্রকাশ হয়েছিল ২৩ নভেম্বর ২০২৫; সংশোধিত বিজ্ঞপ্তি ১২ ডিসেম্বর।",
      "অফিসিয়াল seat plan প্রকাশ হয়েছিল ২৮ ডিসেম্বর ২০২৫ এবং পরীক্ষার্থী/পরিদর্শক নির্দেশনা ২ জানুয়ারি ২০২৬।",
      "পরে merit, waiting, migration, university/degree choice ও admission confirmation—সবকিছুর জন্য ধারাবাহিক official notice প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["Science background, GPA ও Biology/Chemistry/Physics/Math subject requirement current ACAS guideline অনুযায়ী।"],
    format:["বর্তমান exam marks distribution ও duration ২০২৬–২৭ guideline থেকে নিতে হবে।"],
    seats:"৯টি বিশ্ববিদ্যালয়ের university/degree-wise seat matrix current guideline অনুযায়ী।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","quota/equivalence documents"],
    links:[["ACAS Official Portal","https://acas.edu.bd/"],["ACAS Notice Archive","https://acas.edu.bd/notice"]]
  },

  "মেডিকেল ও ডেন্টাল": {
    aliases:["Medical & Dental","Medical","Dental","MBBS","BDS","মেডিকেল","ডেন্টাল"],
    current:["২০২৬–২৭ MBBS/BDS-এর ৪ ডিসেম্বর ২০২৬ তারিখটি সম্ভাব্য তারিখ; ৭ অক্টোবর ২০২৬ পর্যন্ত চূড়ান্ত DGME/DGHS ভর্তি বিজ্ঞপ্তি পাওয়া যায়নি।","পরীক্ষার চূড়ান্ত তারিখ/সময়, যোগ্যতা, ফি, আসন, আবেদনের সময়সূচি ও নম্বরের নিয়ম শুধুমাত্র নতুন DGME/DGHS circular প্রকাশের পর current ধরা হবে।"],
    previous:[
      "২০২৫–২৬ MBBS/BDS admission circular DGME ১০ নভেম্বর ২০২৫ প্রকাশ করেছিল।",
      "ভর্তি পরীক্ষা হয়েছিল ১২ ডিসেম্বর ২০২৫ সকাল ১০টা।",
      "গত বছরের reference: ১০০টি MCQ, সময় ১ ঘণ্টা ১৫ মিনিট, pass mark ৪০।",
      "বিষয়ভিত্তিক: Biology ৩০, Chemistry ২৫, Physics ১৫, English ১৫, General Knowledge/Aptitude/Human Qualities ১৫।",
      "প্রতি ভুল উত্তরে ০.২৫ নম্বর কাটা হতো।",
      "Merit calculation reference: SSC GPA×৮ (max ৪০) + HSC GPA×১২ (max ৬০) + admission test score।",
      "২০২৫–২৬ combined government/private MBBS+BDS seat reference ছিল ১৩,০৫১; এর মধ্যে সরকারি ৫,৬৪৫ এবং বেসরকারি ৭,৪০৬।"
    ],
    eligibility:["Science background, Biology/Chemistry/Physics ও GPA/passing-year শর্ত current DGME/DGHS circular অনুযায়ী।"],
    format:["গত বছর ১০০ MCQ, ৭৫ মিনিট, −০.২৫ negative marking।"],
    seats:"২০২৫–২৬ reference ১৩,০৫১; ২০২৬–২৭ সংখ্যা current circular-এ যাচাই করতে হবে।",
    fee:"বর্তমান application fee নতুন circular অনুযায়ী।",
    documents:["রঙিন প্রবেশপত্র","HSC/equivalent admit/registration card","কালো ballpoint pen","বর্তমান circular-এ চাওয়া অন্য কাগজ"],
    links:[["DGME Notice","https://dgme.gov.bd/pages/notices"],["DGHS Notice","https://dghs.gov.bd/pages/notices"]]
  },
  "AFMC, AMC & Navy": {
    aliases:["AFMC","AMC","Army Medical College","Navy Medical College","আর্মড ফোর্সেস মেডিকেল কলেজ","আর্মি মেডিকেল কলেজ","নেভি মেডিকেল কলেজ"],
    current:["২০২৬–২৭ বর্তমান বিস্তারিত সার্কুলার প্রকাশিত/যাচাইকৃত হলে এখানে অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকার পূর্ণ পূর্ববর্তী ভর্তি তথ্য নিচের ‘তথ্য কণিকা’ অংশে দেওয়া হয়েছে।"],
    eligibility:["তথ্য কণিকার পূর্ববর্তী যোগ্যতা নিচে দেখুন।"],
    format:["তথ্য কণিকার পূর্ববর্তী পরীক্ষার ধরন ও নম্বরবণ্টন নিচে দেখুন।"],
    seats:"তথ্য কণিকা অনুযায়ী ৪৩৫টি আসন।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সামরিক/মেডিকেল ভর্তি নথি"],
    links:[]
  },
  "IUT": {
    aliases:["Islamic University of Technology","ইসলামিক ইউনিভার্সিটি অব টেকনোলজি","আইইউটি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকার পূর্ণ পূর্ববর্তী ভর্তি তথ্য নিচে দেওয়া হয়েছে।"],
    eligibility:["তথ্য কণিকার পূর্ববর্তী যোগ্যতা নিচে দেখুন।"],
    format:["তথ্য কণিকার পূর্ববর্তী পরীক্ষার ধরন ও নম্বরবণ্টন নিচে দেখুন।"],
    seats:"তথ্য কণিকা অনুযায়ী ৫৫০টি আসন।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান নথি"],
    links:[["IUT Official Website","https://www.iutoic-dhaka.edu/"]]
  },
  "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়": {
    aliases:["Jahangirnagar University","JU","জাবি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকায় A, D, B, C ও C1 ইউনিটের পূর্ণ পূর্ববর্তী তথ্য দেওয়া আছে; নিচে দেখুন।"],
    eligibility:["ইউনিটভেদে আলাদা; তথ্য কণিকার পূর্ববর্তী নিয়ম নিচে দেখুন।"],
    format:["ইউনিটভেদে ৮০ নম্বর MCQ ও ৫৫ মিনিটের পূর্ববর্তী ফরম্যাট তথ্য কণিকায় আছে।"],
    seats:"তথ্য কণিকায় A&D মিলিয়ে ৭৩৬ এবং B&C মিলিয়ে ৮৫৬ আসনের তথ্য দেওয়া আছে।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা নথি"],
    links:[["JU Official Website","https://juniv.edu/"]]
  },
  "হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়": {
    aliases:["HSTU","Hajee Mohammad Danesh Science and Technology University","হাবিপ্রবি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকায় A, B ও D ইউনিটের পূর্ণ পূর্ববর্তী তথ্য দেওয়া আছে; নিচে দেখুন।"],
    eligibility:["ইউনিটভেদে SSC/HSC GPA শর্ত তথ্য কণিকায় দেওয়া আছে।"],
    format:["পূর্ববর্তী তথ্য অনুযায়ী ১০০ নম্বর MCQ, সময় ১ ঘণ্টা।"],
    seats:"তথ্য কণিকায় A,B মিলিয়ে ১২৭৫ এবং D Unit ২৪০ আসনের তথ্য দেওয়া আছে।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা নথি"],
    links:[["HSTU Official Website","https://hstu.ac.bd/"]]
  }

};


const BOOKLET_ROWS = [
  {p:"মেডিকেল ও ডেন্টাল",cat:"মেডিকেল ও ডেন্টাল",unit:"মেডিকেল ও ডেন্টাল",seats:"৫৬৪৫ টি (মেডিকেল ৫১০০ টি, ডেন্টাল ৫৪৫ টি)",elig:"SSC + HSC ন্যূনতম জিপিএ ৮.৫; HSC পরীক্ষায় জীববিজ্ঞানে জিপিএ ৩.৫-এর কম নয়।",exam:"১০০ নম্বর MCQ; সময় ১ ঘণ্টা ১৫ মিনিট; পাশ নম্বর ৪০; ক্যালকুলেটর ব্যবহার করা যাবে না।",marks:"জীববিজ্ঞান ৩০, রসায়ন ২৫, পদার্থবিজ্ঞান ১৫, ইংরেজি ১৫, সাধারণ জ্ঞান/প্রবণতা/মানবিক গুণাবলি ১৫।",result:"(SSC GPA × 8) + (HSC GPA × 12) + ভর্তি পরীক্ষার ১০০ = মোট ২০০ নম্বরের ভিত্তিতে মেধাতালিকা।"},
  {p:"AFMC, AMC & Navy",cat:"মেডিকেল ও ডেন্টাল",unit:"AFMC, AMC & Navy",seats:"৪৩৫ টি (AFMC ১২৫, Army & Navy Medical College ৩১০)",elig:"SSC + HSC ন্যূনতম জিপিএ ৮.৫০; HSC পরীক্ষায় জীববিজ্ঞানে জিপিএ ৩.৫-এর কম নয়।",exam:"১০০ নম্বর MCQ; সময় ১ ঘণ্টা ১৫ মিনিট; পাশ নম্বর ৪০; ক্যালকুলেটর ব্যবহার করা যাবে না।",marks:"জীববিজ্ঞান ৩০, রসায়ন ২৫, পদার্থবিজ্ঞান ১৫, ইংরেজি ১৫, সাধারণ জ্ঞান/প্রবণতা/মানবিক গুণাবলি ১৫।",result:"(SSC GPA × 8) + (HSC GPA × 12) + ভর্তি পরীক্ষার ১০০ = মোট ২০০ নম্বরের ভিত্তিতে মেধাতালিকা।"},

  {p:"BUET",cat:"ইঞ্জিনিয়ারিং",unit:"BUET",seats:"১৩০৫ টি + সংরক্ষিত ৪ = মোট ১৩০৯",elig:"SSC: গণিত, পদার্থবিজ্ঞান ও রসায়নসহ ৫-এর স্কেলে ন্যূনতম GPA ৪। HSC: GPA ৫ এবং উচ্চতর গণিত, পদার্থবিজ্ঞান ও রসায়নের প্রতিটিতে GP ৫।",exam:"গ্রুপ ‘ক’: লিখিত ৬০০ নম্বর, ৩ ঘণ্টা। গ্রুপ ‘খ’: Architecture ৪০০ নম্বর, ১ ঘণ্টা ৩০ মিনিট। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: উচ্চতর গণিত ২০×১০, পদার্থবিজ্ঞান ২০×১০, রসায়ন ২০×১০। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৩×১১২, দৃষ্টিগত ও স্থানিক ধীশক্তি ৪×১৬।",result:"শুধু লিখিত পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"RUET",cat:"ইঞ্জিনিয়ারিং",unit:"RUET",seats:"১২৩০ টি + সংরক্ষিত ৫ = মোট ১২৩৫",elig:"SSC/সমমানে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান ও রসায়ন—এই ৩ বিষয়ের মোট GP কমপক্ষে ১৪।",exam:"গ্রুপ ‘ক’: MCQ ৪০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট। গ্রুপ ‘খ’: Architecture ২০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: উচ্চতর গণিত ২০×৬, পদার্থবিজ্ঞান ২০×৬, রসায়ন ২০×৬, ইংরেজি ২০×২। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ২×৫০, দৃষ্টিগত ও স্থানিক ধীশক্তি ২×৫০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"KUET",cat:"ইঞ্জিনিয়ারিং",unit:"KUET",seats:"১০৬০ টি + সংরক্ষিত ৫ = মোট ১০৬৫",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়নে পৃথকভাবে GP ৪ এবং ইংরেজিসহ মোট GP ১৮। Biomedical Engineering-এর জন্য জীববিজ্ঞানে GP ৪।",exam:"গ্রুপ ‘ক’: লিখিত ৫০০ নম্বর, ৩ ঘণ্টা। গ্রুপ ‘খ’: Architecture ১০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: গণিত ১৫×১০, পদার্থবিজ্ঞান ১৫×১০, রসায়ন ১৫×১০, ইংরেজি ৫×১০। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৪×২৫।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"CUET",cat:"ইঞ্জিনিয়ারিং",unit:"CUET",seats:"৯২০ টি + সংরক্ষিত ১১ = মোট ৯৩১",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়নে মোট GP কমপক্ষে ১৪ এবং ইংরেজিতে কমপক্ষে B; Biomedical Engineering-এর জন্য Biology GP ৪।",exam:"গ্রুপ ‘ক’: MCQ ৫০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট। গ্রুপ ‘খ’: Architecture ২০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: গণিত ২৫×৬, পদার্থবিজ্ঞান ২৫×৬, রসায়ন ২৫×৬, ইংরেজি ২৫×২। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৪×৫০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"BUTEX",cat:"ইঞ্জিনিয়ারিং",unit:"BUTEX",seats:"৬৩০ টি",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে GPA ৪ এবং উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়ন ও ইংরেজিতে আলাদাভাবে GP ৩.৫০; চার বিষয়ের মোট GP কমপক্ষে ১৭.৫০।",exam:"Written ২০০ নম্বর, ২ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গণিত ৬০, পদার্থবিজ্ঞান ৬০, রসায়ন ৬০, ইংরেজি ২০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"IUT",cat:"ইঞ্জিনিয়ারিং",unit:"IUT",seats:"৫৫০ টি",elig:"SSC ও HSC প্রতিটিতে ন্যূনতম GPA ৪.৫। HSC-তে Physics, Chemistry, Mathematics প্রতিটিতে A+ এবং English-এ কমপক্ষে A।",exam:"১০০ নম্বর MCQ, সময় ২ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"BSc Engg and BBA: গণিত ৩৫, পদার্থবিজ্ঞান ৩৫, রসায়ন ১৫, ইংরেজি ১৫।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"MIST",cat:"ইঞ্জিনিয়ারিং",unit:"MIST",seats:"৫৭০ টি",elig:"SSC-তে ন্যূনতম GPA ৪ (৪র্থ বিষয় ব্যতীত)। HSC-তে গণিত, পদার্থবিজ্ঞান, রসায়নে প্রতিটিতে GPA ৪ এবং ইংরেজিসহ এই ৪ বিষয়ে মোট GPA ১৮।",exam:"A Unit: Written ২০০ নম্বর, ৩ ঘণ্টা। B Unit: Architecture ২০০ নম্বর, ২ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A Unit: গণিত ৮০, পদার্থবিজ্ঞান ৬০, রসায়ন ৪০, ইংরেজি ২০। B Unit: মুক্তহস্ত অংকন ও দৃষ্টিগত/স্থানিক ধীশক্তি ২০০।",result:"SSC ও HSC (Math+Physics+Chemistry) প্রাপ্ত নম্বরের ৪০% + লিখিত পরীক্ষার ৬০%।"},

  {p:"SUST",cat:"বিশ্ববিদ্যালয়",unit:"SUST ‘A’ Unit",seats:"৯৮৫ টি",elig:"SSC ও HSC-তে পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫; HSC-তে গণিতে ন্যূনতম GPA ৩।",exam:"Group-1 (A1): MCQ ৮০ নম্বর, ১ ঘণ্টা ৩০ মিনিট। Group-2 (A2): Architecture ৩০ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A1: পদার্থ ২০, রসায়ন ২০, গণিত ২০, ঐচ্ছিক জীববিজ্ঞান/ইংরেজি ২০। A2: Drawing ও Architecture GK ৩০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"DU ‘KA’ Unit",seats:"১৮৯১ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর নয়।",marks:"MCQ: Physics + Chemistry + নৈর্বাচনিক (৪র্থ বিষয়/বাংলা/ইংরেজি) যেকোনো ১টি; প্রতিটি বিষয়ে ১৫ প্রশ্ন/১৫ নম্বর। Written: প্রতিটি বিষয়ে ১০ নম্বর; প্রশ্নের মান ২–৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JU ‘A & D’ Unit",seats:"৭৩৬ টি (ছেলে ৩৬৮, মেয়ে ৩৬৮)",elig:"A Unit: SSC+HSC মোট GPA ৮.৫০, পৃথকভাবে কমপক্ষে ৪। D Unit: মোট GPA ৯, পৃথকভাবে কমপক্ষে ৪।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট; ক্যালকুলেটর নয়।",marks:"A: গণিত ২২, পদার্থ ২২, রসায়ন ২২, বাংলা ৩, ইংরেজি ৩, ICT ৮। D: বাংলা ৪, ইংরেজি ৪, রসায়ন ২৪, উদ্ভিদবিজ্ঞান ২২, প্রাণিবিজ্ঞান ২২, বুদ্ধিমত্তা ৪।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JnU ‘A’ Unit",seats:"৮৪০ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩.২৫ এবং মোট GPA ৭.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"পদার্থবিজ্ঞান ২৪, রসায়ন ২৪, গণিত/জীববিজ্ঞান ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC থেকে ১০ + HSC থেকে ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"RU ‘C’ Unit",seats:"১৫৩৬ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"ক আবশ্যিক: পদার্থ ২৫×১.২৫, রসায়ন ২৫×১.২৫, ICT ৫×১.২৫। খ ঐচ্ছিক: গণিত/জীববিজ্ঞান ২৫×১.২৫ যেকোনো ১টি, অথবা জীববিজ্ঞান ১৩×১.২৫ + গণিত ১২×১.২৫।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CU ‘A’ Unit",seats:"১০৯৩ টি",elig:"SSC+HSC ৪র্থ বিষয়সহ মোট GPA ৮; SSC-তে ন্যূনতম GPA ৪ এবং HSC-তে ন্যূনতম GPA ৩।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"ইংরেজি ২৫; পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান—যেকোনো ৩টি ×২৫ = ৭৫।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে অতিরিক্ত tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"বিশ্ববিদ্যালয়",unit:"BUP (FST)",seats:"৩০০ টি",elig:"SSC+HSC মোট GPA ৯; HSC-তে Physics, Chemistry, Biology-তে A এবং English-এ কমপক্ষে A−।",exam:"৬০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গণিত ২০, জীববিজ্ঞান ২০, পদার্থবিজ্ঞান ২০, রসায়ন ২০—৪টির মধ্যে ৩টি বিষয়ের উত্তর।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"GST ‘A’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"বিজ্ঞান বিভাগের প্রায় ৫৯৯৪ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.২৫ এবং মোট GPA কমপক্ষে ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫ + Chemistry ২৫ + Math/Biology ২৫-এর যেকোনো ১টি; অপরটির বদলে Bangla/English ২৫ দেওয়া যাবে।",result:"শুধু ভর্তি পরীক্ষার নম্বরের ভিত্তিতে মেধাক্রম; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"KU ‘A & B’ Unit",seats:"৬০১ টি",elig:"SSC ও HSC মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A MCQ: Math ১৫, Physics ১৫, Chemistry ১৫, English ১০, ICT ৫; Written: Math ১০, Physics ১০, Chemistry ১০, English ৫, ICT ৫। B MCQ: Biology ১৫, Chemistry ১২, Math ১২, Physics ১২, English ৯; Written: Biology ১০, Chemistry ৮, Math ৮, Physics ৮, English ৬।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CoU ‘A’ Unit",seats:"৩০০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫, Chemistry ২৫ এবং (Bangla+English ২৫) / Math ২৫ / Biology ২৫—এই ৩ option থেকে যেকোনো ২টি।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কৃষি গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"কৃষি গুচ্ছ (৯ বিশ্ববিদ্যালয়)",seats:"৩৭০১ টি",elig:"SSC ও HSC-তে Biology, Chemistry, Physics, Mathematicsসহ উত্তীর্ণ; ৪র্থ বিষয় ব্যতীত প্রতিটিতে ন্যূনতম GPA ৪ এবং SSC+HSC মোট GPA ৮.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Math ২০, Physics ২০, Chemistry ২০, Botany ১৫, Zoology ১৫, English ১০।",result:"ভর্তি পরীক্ষার নম্বর + SSC ২৫ + HSC ২৫।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"HSTU ‘A, B’ Unit",seats:"১২৭৫ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫০ এবং মোট GPA ৭.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"A: Physics ২৫, Chemistry ২৫, Biology ২৫, English ২৫। B: Physics ২৫, Chemistry ২৫, Mathematics ২৫, English ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"},

  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"DU ‘KHA’ Unit",seats:"২৯৩৪ টি (মানবিক ১৬৯৪, বিজ্ঞান ৯৬২, ব্যবসায় শিক্ষা ২৭৮)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৭.৫।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা/Advanced English ১৫ + General English ১৫ + GK ৩০। Written: বাংলা/Advanced English ২০ + General English ২০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JU ‘B & C’ Unit",seats:"৮৫৬ টি (ছেলে ৪২৮, মেয়ে ৪২৮)",elig:"মানবিক ও ব্যবসায় শিক্ষার জন্য SSC+HSC মোট GPA ৭.৫; পৃথকভাবে ন্যূনতম GPA ৩.৫।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট।",marks:"B: বাংলা ২০, English ২০, সাধারণ গণিত ২০, GK ১৫, Logical Analysis ৫। C: বাংলা ২০, English ২০, GK ও বিভাগ-সংশ্লিষ্ট ৪০। C1: বাংলা ১০, English ১০, GK ২০, বিভাগ-সংশ্লিষ্ট ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JnU ‘B & D’ Unit",seats:"১৩৯৫ টি (কলা ও আইন ৭৮৫, সামাজিক বিজ্ঞান ৬১০)",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা।",marks:"B: বাংলা ২৪, English ২৪, GK ২৪। D: বাংলা ২৪, English ২৪, গাণিতিক বুদ্ধিমত্তা ও GK ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC ১০ + HSC ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"RU ‘A’ Unit",seats:"১৮৯৭ টি (কলা ৯৩১, আইন ১৬০, সামাজিক বিজ্ঞান ৬৩৬, চারুকলা ১২০, IER ৫০)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, ইংরেজি ৩৫, সাধারণ জ্ঞান ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CU ‘B & D’ Unit",seats:"১৯৯৪ টি (কলা ৯৭০, সমাজবিজ্ঞান ৮৮৯, চারুকলা ১৩৫)",elig:"B/B1/B2: SSC GPA ৩, HSC GPA ২.৫, মোট ৬.৫। D: SSC GPA ৩.৫, HSC GPA ৩, মোট ৭.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"B: বাংলা/ঐচ্ছিক English ৩০, English ৩০, GK ৪০। B1: বাংলা/ঐচ্ছিক English ২৫, English ২৫, GK ৫০। B2: বাংলা/ঐচ্ছিক English ২০, English ২০, Arabic/Islamic Studies/Pali/GK থেকে যেকোনো ২টি ×৩০। D: বাংলা/ঐচ্ছিক English ৩০, English ৩০, Analytical Ability ২০, GK/Math/Economics ২০।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"বিশ্ববিদ্যালয়",unit:"BUP (FASS & FSSS)",seats:"৬০০ টি (FASS ৩৫০, FSSS ২৫০)",elig:"FASS: SSC+HSC মোট GPA ৭.৫–৮। FSSS: SSC+HSC মোট GPA ৮–৮.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ৪০, General Knowledge ৪০, বাংলা ২০।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"GST ‘B’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"মানবিক বিভাগের প্রায় ৩০০০ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, English ৩৫, General Knowledge ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বর; পাশ নম্বর ৩০; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"KU ‘C’ Unit",seats:"৪১৫ টি",elig:"SSC ও HSC মোট GPA ৭।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা ১০, English ২৫, GK ২৫। Written: বাংলা ১০, English ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"SUST",cat:"বিশ্ববিদ্যালয়",unit:"SUST ‘B’ Unit",seats:"৫৮১ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬।",exam:"৮০ নম্বর MCQ, সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"English ১৫, বাংলা ১৫, সাধারণ গণিত ১৫, বাংলাদেশ ও আন্তর্জাতিক ১০, ICT ১০, অর্থনীতি/পৌরনীতি/সমাজবিজ্ঞান/সমাজকল্যাণ/ইতিহাস সম্পর্কিত ১৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CoU ‘B’ Unit",seats:"৩৯০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মানবিক থেকে মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ২৫, বাংলা ২৫, General Knowledge ১০, মানবিক শাখার বিষয়ভিত্তিক ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"HSTU ‘D’ Unit",seats:"২৪০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ২৫, English ৫০, General Knowledge ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"}
];


const CATEGORY_ORDER = [
  "মেডিকেল ও ডেন্টাল",
  "ইঞ্জিনিয়ারিং",
  "বিশ্ববিদ্যালয়"
];

const CATEGORY_LABELS = {
  "বিশ্ববিদ্যালয়":"বিশ্ববিদ্যালয়",
  "ইঞ্জিনিয়ারিং":"ইঞ্জিনিয়ারিং",
  "মেডিকেল ও ডেন্টাল":"মেডিকেল"
};
let guideCompareKeys=new Set();
let guideInitialized=false;

function guideRowByKey(key){
  const raw=decodeURIComponent(key||'');
  return BOOKLET_ROWS.find(r=>(r.cat+'|'+r.unit)===raw)||null;
}
function renderGuideCompareTray(){
  const tray=document.getElementById('guideCompareTray');
  const btn=document.getElementById('guideCompareButton');
  const count=document.getElementById('guideCompareCount');
  if(!tray||!btn||!count)return;
  const rows=[...guideCompareKeys].map(guideRowByKey).filter(Boolean);
  count.textContent=rows.length;
  btn.disabled=rows.length<2;
  tray.innerHTML=rows.length?'<span>Selected:</span>'+rows.map(r=>'<button type="button" data-guide-remove="'+encodeURIComponent(r.cat+'|'+r.unit)+'">'+esc(r.unit)+' ×</button>').join(''):'';
  tray.querySelectorAll('[data-guide-remove]').forEach(x=>x.onclick=()=>{guideCompareKeys.delete(x.dataset.guideRemove);syncGuideCompareButtons();renderGuideCompareTray()});
}
function syncGuideCompareButtons(){
  document.querySelectorAll('[data-guide-compare]').forEach(btn=>{
    const on=guideCompareKeys.has(btn.dataset.guideCompare);
    btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));btn.textContent=on?'Selected ✓':'Compare';
  });
}
function openGuideCompare(){
  const rows=[...guideCompareKeys].map(guideRowByKey).filter(Boolean);
  if(rows.length<2)return;
  const fields=[
    ['University / Unit','unit'],
    ['Category','cat'],
    ['Seats','seats'],
    ['Eligibility','elig'],
    ['Exam','exam'],
    ['Marks / Questions','marks'],
    ['Result calculation','result']
  ];
  guideCompareBody.innerHTML='<div class="guide-compare-table-wrap"><table class="guide-compare-table"><thead><tr><th>Compare</th>'+
    rows.map(r=>'<th>'+esc(r.unit)+'</th>').join('')+
    '</tr></thead><tbody>'+
    fields.slice(1).map(([label,key])=>'<tr><th>'+esc(label)+'</th>'+rows.map(r=>'<td>'+esc(r[key])+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
  guideCompareBackdrop.classList.add('open');guideCompareBackdrop.setAttribute('aria-hidden','false');
}
function closeGuideCompare(){guideCompareBackdrop.classList.remove('open');guideCompareBackdrop.setAttribute('aria-hidden','true')}
function applyGuideSearch(){
  const input=document.getElementById('guideSearch');if(!input)return;
  const q=input.value.trim().toLowerCase();
  guideClearSearch.hidden=!q;
  document.querySelectorAll('.category-section').forEach(sec=>{
    let visible=0;
    sec.querySelectorAll('tbody tr').forEach(row=>{
      const show=!q||(row.dataset.guideSearch||'').includes(q);
      row.hidden=!show;if(show)visible++;
    });
    sec.classList.toggle('guide-no-results',visible===0);
    const count=sec.querySelector('.cat-count');if(count)count.textContent=visible+'টি তথ্য';
  });
}

function renderCategoryTable(cat){
  const rows=BOOKLET_ROWS.filter(r=>r.cat===cat);
  const catClass=cat==='মেডিকেল ও ডেন্টাল'?'medical':cat==='ইঞ্জিনিয়ারিং'?'engineering':'university';
  return '<section class="category-section category-'+catClass+'" data-cat="'+esc(cat)+'">'+
    '<h3>'+esc(CATEGORY_LABELS[cat]||cat)+' <span class="cat-count">'+rows.length+'টি তথ্য</span></h3>'+
    '<div class="table-wrap"><table class="admission-table">'+
      '<thead><tr>'+
        '<th>বিশ্ববিদ্যালয় / ইউনিট</th>'+
        '<th>আসন সংখ্যা</th>'+
        '<th>আবেদন যোগ্যতা</th>'+
        '<th>পরীক্ষার ধরন</th>'+
        '<th>বিষয়ভিত্তিক নম্বর / প্রশ্ন</th>'+
        '<th>ফলাফল নির্ণয় পদ্ধতি</th>'+
      '</tr></thead><tbody>'+
      rows.map(r=>{
        const key=encodeURIComponent(r.cat+'|'+r.unit);
        const hay=(r.p+' '+r.unit+' '+r.seats+' '+r.elig+' '+r.exam+' '+r.marks+' '+r.result).toLowerCase();
        return '<tr data-guide-key="'+key+'" data-guide-search="'+esc(hay)+'">'+
        '<td class="admission-name" data-label="বিশ্ববিদ্যালয় / ইউনিট"><span>'+esc(r.unit)+'</span><div class="guide-row-actions"><button class="guide-compare-toggle" type="button" data-guide-compare="'+key+'" aria-pressed="false">Compare</button><button class="guide-row-toggle" type="button" aria-expanded="false">Details</button></div></td>'+
        '<td data-label="আসন সংখ্যা">'+esc(r.seats)+'</td>'+
        '<td data-label="আবেদন যোগ্যতা">'+esc(r.elig)+'</td>'+
        '<td data-label="পরীক্ষার ধরন">'+esc(r.exam)+'</td>'+
        '<td data-label="নম্বর / প্রশ্ন">'+esc(r.marks)+'</td>'+
        '<td data-label="ফলাফল নির্ণয়">'+esc(r.result)+'</td>'+
      '</tr>';
      }).join('')+
      '</tbody></table></div></section>';
}

function renderAllCategories(){
  const tabs=document.getElementById('categoryTabs');
  const host=document.getElementById('categoryCharts');
  tabs.innerHTML=CATEGORY_ORDER.map((cat,i)=>'<button class="category-tab'+(i===0?' active':'')+'" data-cat="'+esc(cat)+'">'+esc(CATEGORY_LABELS[cat]||cat)+'</button>').join('');
  host.innerHTML=CATEGORY_ORDER.map(cat=>renderCategoryTable(cat)).join('');

  const setActiveCategory=cat=>{
    tabs.querySelectorAll('.category-tab').forEach(x=>x.classList.toggle('active',x.dataset.cat===cat));
  };

  tabs.setAttribute('role','tablist');
  tabs.querySelectorAll('.category-tab').forEach((btn,i)=>{
    btn.setAttribute('role','tab');btn.setAttribute('aria-selected',String(i===0));
    btn.onclick=()=>{
      setActiveCategory(btn.dataset.cat);
      tabs.querySelectorAll('.category-tab').forEach(x=>x.setAttribute('aria-selected',String(x===btn)));
      const sec=[...host.querySelectorAll('.category-section')].find(x=>x.dataset.cat===btn.dataset.cat);
      if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
    };
    btn.onkeydown=e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();const arr=[...tabs.querySelectorAll('.category-tab')],idx=arr.indexOf(btn),next=arr[(idx+(e.key==='ArrowRight'?1:-1)+arr.length)%arr.length];next.focus();next.click();
    };
  });
  host.querySelectorAll('.guide-row-toggle').forEach(btn=>btn.onclick=()=>{
    const row=btn.closest('tr');const open=row.classList.toggle('expanded');btn.textContent=open?'Less':'Details';btn.setAttribute('aria-expanded',String(open));
  });
  host.querySelectorAll('[data-guide-compare]').forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.guideCompare;
    if(guideCompareKeys.has(key))guideCompareKeys.delete(key);
    else guideCompareKeys.add(key);
    syncGuideCompareButtons();renderGuideCompareTray();
  });
  syncGuideCompareButtons();renderGuideCompareTray();
  const gs=document.getElementById('guideSearch');
  if(gs){gs.oninput=applyGuideSearch;guideClearSearch.onclick=()=>{gs.value='';applyGuideSearch();gs.focus()}}
  if(typeof guideCompareButton!=='undefined'&&guideCompareButton)guideCompareButton.onclick=openGuideCompare;
  applyGuideSearch();

  // Scroll-spy: keep the sticky category buttons matched to the section
  // currently under them, in both scroll directions.
  const sections=[...host.querySelectorAll('.category-section')];
  let scrollSpyTick=0;
  const updateCategoryFromScroll=()=>{
    scrollSpyTick=0;
    if(!sections.length)return;
    const stickyBottom=tabs.getBoundingClientRect().bottom;
    const marker=stickyBottom+18;
    let current=sections[0];
    for(const sec of sections){
      if(sec.getBoundingClientRect().top<=marker) current=sec;
      else break;
    }
    setActiveCategory(current.dataset.cat);
  };
  const onCategoryScroll=()=>{
    if(scrollSpyTick)return;
    scrollSpyTick=requestAnimationFrame(updateCategoryFromScroll);
  };
  addEventListener('scroll',onCategoryScroll,{passive:true});
  addEventListener('resize',onCategoryScroll,{passive:true});
  updateCategoryFromScroll();
}
(function initGuideWarm(){
  const start=()=>{if(guideInitialized)return;guideInitialized=true;renderAllCategories()};
  document.querySelectorAll('a[href="#infoCenter"]').forEach(a=>a.addEventListener('click',start,{once:true}));
  if('requestIdleCallback' in window)requestIdleCallback(start,{timeout:1600});
  else setTimeout(start,450);
})();

(function initRequestedSectionReveal(){
  const sections=[document.getElementById('circulars'),document.getElementById('infoCenter')].filter(Boolean);
  if(!sections.length)return;
  sections.forEach(s=>s.classList.add('dbt-reveal'));
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    sections.forEach(s=>s.classList.add('dbt-in-view'));return;
  }
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('dbt-in-view');io.unobserve(e.target)}
  }),{threshold:.08,rootMargin:'0px 0px -8% 0px'});
  sections.forEach(s=>io.observe(s));
})();

(function initCircularCategorySpy(){
  const tabs=document.getElementById('circularTabs');
  if(!tabs)return;
  const sections=[...document.querySelectorAll('.circular-group[data-circular-cat]')];
  if(!sections.length)return;
  const setActive=cat=>{
    tabs.querySelectorAll('[data-circular-tab]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.circularTab===cat);
    });
  };
  tabs.querySelectorAll('[data-circular-tab]').forEach(btn=>{
    btn.onclick=()=>{
      const sec=sections.find(x=>x.dataset.circularCat===btn.dataset.circularTab);
      if(!sec)return;
      setActive(btn.dataset.circularTab);
      const topnav=document.querySelector('.topnav');
      const offset=(topnav?topnav.getBoundingClientRect().height:0)+tabs.getBoundingClientRect().height+24;
      const y=Math.max(0,sec.getBoundingClientRect().top+window.scrollY-offset);
      window.scrollTo({top:y,behavior:'smooth'});
    };
  });
  let tick=0;
  const update=()=>{
    tick=0;
    const marker=tabs.getBoundingClientRect().bottom+14;
    let current=sections[0];
    for(const sec of sections){
      if(sec.getBoundingClientRect().top<=marker)current=sec;
      else break;
    }
    setActive(current.dataset.circularCat);
  };
  const queue=()=>{if(!tick)tick=requestAnimationFrame(update)};
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  update();
})();

function smoothPageJump(target){
  if(!target)return;
  const startY=window.scrollY||window.pageYOffset||0;
  const nav=document.querySelector('.topnav');
  const offset=(nav?nav.getBoundingClientRect().height:0)+16;
  const targetY=Math.max(0,target.getBoundingClientRect().top+startY-offset);
  const distance=targetY-startY;
  if(Math.abs(distance)<2)return;
  const duration=Math.min(720,Math.max(360,Math.abs(distance)*0.34));
  const start=performance.now();
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function step(now){
    const p=Math.min(1,(now-start)/duration);
    window.scrollTo(0,startY+distance*ease(p));
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
document.querySelectorAll('.navlinks a[href^="#"],.mobile-dock a[href^="#"]').forEach(link=>{
  link.addEventListener('click',ev=>{
    const sel=link.getAttribute('href');
    const target=sel&&document.querySelector(sel);
    if(!target)return;
    ev.preventDefault();
    smoothPageJump(target);
    try{history.replaceState(null,'',sel)}catch(e){}
  });
});

const pageSectionOrder=['dashboard','targets','circulars','calendar','infoCenter'];
let pageNavSpyTick=0;
function updatePageNavFromScroll(){
  pageNavSpyTick=0;
  const topnav=document.querySelector('.topnav');
  const marker=(topnav?topnav.getBoundingClientRect().bottom:0)+22;
  let activeId=pageSectionOrder[0];
  for(const id of pageSectionOrder){
    const sec=document.getElementById(id);
    if(!sec)continue;
    if(sec.getBoundingClientRect().top<=marker)activeId=id;
    else break;
  }
  document.querySelectorAll('.navlinks a[href^="#"],.mobile-dock a[href^="#"]').forEach(link=>{
    link.classList.toggle('active',link.getAttribute('href')==='#'+activeId);
  });
}
function queuePageNavSpy(){
  if(pageNavSpyTick)return;
  pageNavSpyTick=requestAnimationFrame(updatePageNavFromScroll);
}
addEventListener('scroll',queuePageNavSpy,{passive:true});
addEventListener('resize',queuePageNavSpy,{passive:true});
updatePageNavFromScroll();



// Heavy animated star canvas removed for faster loading and smoother mobile performance.



