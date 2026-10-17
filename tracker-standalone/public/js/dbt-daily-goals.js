/* DBT Daily Goals bridge: isolated data, existing Weekly Routine stays intact. */
(()=>{
'use strict';
if(typeof renderThisWeekView!=='function'||typeof trackerDailyGoalRefs!=='function')return;
const API='https://admissionbydbt.vercel.app/api/daily-goals';
const KEY_NAME='dbt-daily-widget-key-v1';
const CACHE_NAME='dbt-daily-widget-cache-v1';
const OUTBOX_NAME='dbt-daily-widget-outbox-v1';
let key='',revision=null,remote={version:1,days:{}},busy=false,dirty=[],timer=null,renderDelay=null;
const h=s=>esc(String(s??''));
const dayKey=()=>trackerWeekDate?.value||new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});
function persistCache(){try{localStorage.setItem(CACHE_NAME,JSON.stringify(remote))}catch(_){}}
try{key=localStorage.getItem(KEY_NAME)||'';const raw=JSON.parse(localStorage.getItem(CACHE_NAME)||'null');if(raw&&raw.days)remote=raw;const pending=JSON.parse(localStorage.getItem(OUTBOX_NAME)||'[]');if(Array.isArray(pending))dirty=pending.slice(0,200)}catch(_){}
const persistOutbox=()=>{try{localStorage.setItem(OUTBOX_NAME,JSON.stringify(dirty))}catch(_){}};
function refsDay(date){
  // Read-only projection of the existing selected Weekly Routine items.
  const refs=trackerDailyGoalRefs(date),bySub=new Map();
  trackerState.subjects.forEach(s=>bySub.set(s.id,{id:s.id,name:s.name,rows:[]}));
  for(const r of refs){
    if(!bySub.has(r.s.id))bySub.set(r.s.id,{id:r.s.id,name:r.s.name,rows:[]});
    const part=r.cell.weeklyPart?' ['+r.cell.weeklyPart+']':'';
    bySub.get(r.s.id).rows.push({id:r.key,chapter:r.ch.name,task:r.f.name+part,note:'',done:false});
  }
  return {deadline:date+'T'+(trackerWeekDeadlineTime||'23:59')+':00+06:00',
    updatedAt:new Date().toISOString(),subjects:[...bySub.values()]};
}
function carryDetails(next,old){
  const previous=new Map((old?.subjects||[]).flatMap(s=>(s.rows||[]).map(r=>[r.id,r])));
  next.subjects.forEach(s=>s.rows.forEach(r=>{
    const found=previous.get(r.id);
    if(found){r.note=found.note||'';r.done=found.done===true}
  }));
  return next;
}
function ensureDay(date){
  if(!remote.days)remote.days={};
  if(!remote.days[date])remote.days[date]=refsDay(date);
  return remote.days[date];
}
function updateStatus(message,error=false){
  const el=document.getElementById('dbtdg-status');
  if(el){el.textContent=message;el.classList.toggle('dbtdg-error',error)}
}
function apply(op,target){
  if(!target.days)target.days={};
  target.activeDate=op.date;
  if(op.kind==='replace'){
    target.days[op.date]=carryDetails(structuredClone(op.day),target.days[op.date]);
  }else{
    const d=target.days[op.date];
    if(!d)return;
    for(const s of d.subjects||[]){
      const row=(s.rows||[]).find(x=>x.id===op.id);
      if(!row)continue;
      if(op.kind==='note')row.note=String(op.value||'').slice(0,1500);
      if(op.kind==='done')row.done=!!op.value;
      break;
    }
    d.updatedAt=new Date().toISOString();
  }
}
function renderPanel(){
  if(!trackerWeekView)return;
  const host=document.getElementById('trackerTableHost');
  if(!host)return;
  document.getElementById('dbtdg-panel')?.remove();
  const date=dayKey(),day=remote.days?.[date]||refsDay(date);
  const subjects=day.subjects||[],all=subjects.flatMap(s=>s.rows||[]);
  const done=all.filter(r=>r.done).length;
  const panel=document.createElement('section');
  panel.id='dbtdg-panel';panel.className='dbtdg-panel';
  panel.innerHTML=
    '<div class="dbtdg-head"><div><b>DAILY GOALS · DESKTOP WIDGET</b><small>'+h(date)+' · '+done+'/'+all.length+' done</small></div>'+
    '<div class="dbtdg-actions"><span id="dbtdg-status">'+(key?'Cloud pairing ready':'Local preview · pair to synchronize')+'</span>'+
    '<button type="button" data-dg-pair>Pair widget</button>'+
    '<button type="button" data-dg-publish>Publish selected day</button>'+
    '<button type="button" data-dg-pull>Refresh</button></div></div>'+
    '<div class="dbtdg-progress"><span style="width:'+(all.length?100*done/all.length:0)+'%"></span></div>'+
    '<div class="dbtdg-grid">'+subjects.map(s=>
      '<section class="dbtdg-subject"><h4>'+h(s.name)+'</h4>'+
      '<table><thead><tr><th>Chapter</th><th>Things to do</th></tr></thead><tbody>'+
      ((s.rows||[]).length?s.rows.map(r=>
        '<tr><td>'+h(r.chapter)+'</td><td><label class="dbtdg-task"><input type="checkbox" data-dg-done="'+h(r.id)+'" '+(r.done?'checked':'')+'><span>'+h(r.task)+'</span></label>'+
        '<textarea data-dg-note="'+h(r.id)+'" rows="1" maxlength="1500" placeholder="Notes for this row">'+h(r.note||'')+'</textarea></td></tr>'
      ).join(''):'<tr><td colspan="2" class="dbtdg-empty">No daily tasks</td></tr>')+
      '</tbody></table></section>'
    ).join('')+'</div>'+
    '<div class="dbtdg-foot">Select Today on weekly task cards above to choose daily tasks. Use Publish selected day when you want to replace the widget list for this date. Completion here is separate from your existing Tracker study-progress checkboxes.</div>';
  const header=host.querySelector('.week-simple-head');
  if(header)header.insertAdjacentElement('afterend',panel);else host.prepend(panel);
  panel.querySelector('[data-dg-pair]').onclick=pair;
  panel.querySelector('[data-dg-pull]').onclick=()=>pull(true);
  panel.querySelector('[data-dg-publish]').onclick=()=>{enqueue({kind:'replace',date,day:refsDay(date)})};
  panel.querySelectorAll('[data-dg-done]').forEach(cb=>cb.onchange=()=>{
    enqueue({kind:'done',date,id:cb.dataset.dgDone,value:cb.checked});
  });
  panel.querySelectorAll('[data-dg-note]').forEach(input=>{
    input.onchange=()=>enqueue({kind:'note',date,id:input.dataset.dgNote,value:input.value});
    input.onblur=()=>{if(input.value!==input.defaultValue)input.dispatchEvent(new Event('change'))};
  });
}
function scheduleRender(){
  clearTimeout(renderDelay);
  renderDelay=setTimeout(()=>{
    if(document.getElementById('dbtdg-panel')?.contains(document.activeElement))return;
    renderPanel();
  },150);
}
const originalRender=renderThisWeekView;
renderThisWeekView=function(...args){const result=originalRender.apply(this,args);renderPanel();return result};
// Daily PDF reflects paired row notes and task completion, without editing saved PDF drafts.
const originalPdfRefs=trackerPdfRefs;
trackerPdfRefs=function(...args){
  if(trackerPdfSourceMode==='day'&&key){
    const ids=(remote.days?.[dayKey()]?.subjects||[]).flatMap(s=>(s.rows||[]).map(r=>r.id));
    if(ids.length)return trackerRefsFromKeys(ids);
  }
  return originalPdfRefs.apply(this,args);
};
const originalTaskText=trackerWeeklyPrintTaskText;
trackerWeeklyPrintTaskText=function(r){
  if(trackerPdfSourceMode!=='day')return originalTaskText(r);
  const item=(remote.days?.[dayKey()]?.subjects||[]).flatMap(s=>s.rows||[]).find(x=>x.id===r.key);
  if(!item)return originalTaskText(r);
  return (item.done?'✓ ':'□ ')+item.task+(item.note?'  ·  Note: '+item.note:'');
};
async function request(method,body){
  if(!key)throw Error('Pair first');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(API,{
      method,headers:{'X-DBT-Daily-Key':key,...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),
      cache:'no-store',signal:controller.signal
    });
    const data=await response.json();
    return {status:response.status,data};
  }finally{clearTimeout(timeout)}
}
async function pull(show=false){
  if(!key||busy||dirty.length)return;
  busy=true;
  try{
    const {status,data}=await request('GET');
    if(status===404){
      revision=null;
      updateStatus('No cloud tasks yet · publish your selected day');
    }else if(status===200&&data.ok){
      revision=data.revision;remote=data.state;persistCache();scheduleRender();
      if(show)updateStatus('Updated from cloud');
    }else throw Error(data.error||'Sync failed');
  }catch(e){updateStatus('Offline · cached tasks kept',true)}
  finally{busy=false}
}
function enqueue(op){
  apply(op,remote);persistCache();dirty.push(op);persistOutbox();
  scheduleRender();updateStatus(key?'Saving…':'Saved on this browser · pair to sync');
  if(key){clearTimeout(timer);timer=setTimeout(flush,450)}
}
async function flush(){
  if(busy||!key||!dirty.length)return;
  busy=true;const batch=dirty.splice(0);persistOutbox();
  try{
    // Reapply only the user's pending changes after a revision conflict.
    let base=revision,working=structuredClone(remote);
    batch.forEach(op=>apply(op,working));
    for(let attempt=0;attempt<3;attempt++){
      const {status,data}=await request('PUT',{baseRevision:base,state:working});
      if(status===200&&data.ok){
        revision=data.revision;remote=data.state;persistCache();persistOutbox();
        updateStatus('Synced · '+new Date().toLocaleTimeString());break;
      }
      if(status!==409)throw Error(data.error||'Sync unavailable');
      base=data.revision;working=data.state;
      batch.forEach(op=>apply(op,working));
      if(attempt===2)throw Error('Repeated sync conflict');
    }
  }catch(e){
    // Do not discard unconfirmed changes, or overwrite other devices.
    dirty.unshift(...batch);persistOutbox();
    updateStatus('Not synced · retry with Refresh',true);
  }finally{busy=false;scheduleRender()}
  if(dirty.length){clearTimeout(timer);timer=setTimeout(flush,3000)}
}
function randomKey(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function pair(){
  const entered=prompt('Paste a pairing key from your other DBT site, or leave blank to create a new one.\nKeep this key private.',key||'');
  if(entered===null)return;
  const next=(entered.trim()||randomKey()).toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(next)){alert('The pairing key must contain 64 hexadecimal characters.');return}
  key=next;localStorage.setItem(KEY_NAME,key);
  revision=null;dirty=[];persistOutbox();remote={version:1,days:{}};
  const {status,data}=await request('GET').catch(()=>({status:0,data:{}}));
  if(status===200&&data.ok){remote=data.state;revision=data.revision;persistCache()}
  else if(status===404){enqueue({kind:'replace',date:dayKey(),day:refsDay(dayKey())});await flush()}
  else updateStatus('Connection unavailable; key saved for retry',true);
  renderPanel();
  const copy=document.getElementById('dbtdg-key');
  if(copy)copy.remove();
  const box=document.createElement('div');box.id='dbtdg-key';box.className='dbtdg-key';
  const code=document.createElement('code');code.textContent=key;
  const copyBtn=document.createElement('button');copyBtn.textContent='Copy pairing key';
  copyBtn.onclick=()=>navigator.clipboard.writeText(key).then(()=>{copyBtn.textContent='Copied'}).catch(()=>{prompt('Copy this key',key)});
  box.append('Widget pairing key: ',code,' ',copyBtn);
  document.getElementById('dbtdg-panel')?.appendChild(box);
}
document.addEventListener('change',e=>{
  if(!key)return;
  if(e.target.matches('[data-daily-goal]')){
    const date=dayKey();setTimeout(()=>enqueue({kind:'replace',date,day:refsDay(date)}),80);
  }
});
document.addEventListener('click',e=>{
  if(!key)return;
  if(e.target.closest('[data-day-all],[data-day-clear],#weekClearDaily')){
    const date=dayKey();setTimeout(()=>enqueue({kind:'replace',date,day:refsDay(date)}),80);
  }
},true);
window.addEventListener('focus',()=>{if(key)pull()});
setInterval(()=>{if(key&&!document.hidden){if(dirty.length)flush();else pull()}},30000);
if(key)setTimeout(()=>{if(dirty.length){dirty.forEach(op=>apply(op,remote));flush()}else pull()},700);
if(trackerWeekView)setTimeout(renderPanel,80);
const styles=document.createElement('style');
styles.textContent=`
.dbtdg-panel{margin:12px 0;padding:13px;border:1px solid #405269;border-radius:12px;background:#080e18;color:#e4edf8}
.dbtdg-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.dbtdg-head b{font-size:14px;letter-spacing:.045em}.dbtdg-head small{display:block;color:#aabdd7;margin-top:4px}
.dbtdg-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.dbtdg-actions button,.dbtdg-key button{background:#1e304b;border:1px solid #52729b;color:#eef5ff;border-radius:5px;cursor:pointer;padding:7px 9px;font-size:11px}
#dbtdg-status{font-size:10px;color:#9ccbba}.dbtdg-error{color:#ffc89c!important}
.dbtdg-progress{height:4px;background:#28364a;border-radius:6px;overflow:hidden;margin:12px 0}
.dbtdg-progress span{display:block;height:100%;background:#7aabec;transition:width .2s}
.dbtdg-grid{display:flex;gap:9px;overflow-x:auto;padding:1px 0 10px}
.dbtdg-subject{min-width:220px;flex:1 0 220px;max-width:340px}
.dbtdg-subject h4{font-size:12px;text-align:center;background:#16253b;padding:8px;margin:0;border:1px solid #405269}
.dbtdg-subject table{border-collapse:collapse;width:100%;table-layout:fixed}
.dbtdg-subject th,.dbtdg-subject td{border:1px solid #405269;padding:6px;font-size:11px;vertical-align:top;overflow-wrap:anywhere}
.dbtdg-subject th:first-child{width:43%}.dbtdg-subject th{color:#d3e2ff;font-size:10px}
.dbtdg-task{display:flex;gap:5px;align-items:flex-start;cursor:pointer}
.dbtdg-task input{accent-color:#7aabec;flex-shrink:0;margin-top:2px}
.dbtdg-subject textarea{background:#0b1422;color:#aebfd6;border:1px solid #344966;border-radius:3px;min-height:25px;resize:vertical;width:100%;font:10px/1.4 inherit;margin-top:4px;padding:4px}
.dbtdg-empty{color:#8c9eb4;text-align:center}
.dbtdg-foot{color:#9bacbe;font-size:10px;line-height:1.5;margin-top:7px}
.dbtdg-key{font-size:11px;margin-top:9px;overflow-wrap:anywhere}.dbtdg-key code{user-select:all;color:#b5d5ff}
@media print{.dbtdg-panel{display:none!important}}
`;
document.head.appendChild(styles);
})();
