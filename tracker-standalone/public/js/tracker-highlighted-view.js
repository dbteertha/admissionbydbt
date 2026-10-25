/* Highlighted Tracker: a dedicated live view, parallel to Weekly Routine.
   Never mutates Tracker records or highlight dates. */
(()=>{
'use strict';
if(typeof renderThisWeekView!=='function'||typeof trackerTaskHighlightActive!=='function')return;
const PATH='/tracker/highlighted';
function activeRefs(){
  const refs=[];
  for(const s of trackerState.subjects||[]){
    for(const ch of s.chapters||[]){
      for(const f of trackerVisibleFields(s)){
        const cell=trackerGetCell(s.id,ch.id,f.id);
        if(trackerTaskHighlightActive(f,cell))
          refs.push({s,ch,f,cell,key:trackerCellKey(s.id,ch.id,f.id)});
      }
    }
  }
  return refs;
}
function openPdf(){
  const refs=activeRefs();
  if(!refs.length){trackerToastMsg('No highlighted cells to print');return;}
  trackerPdfSourceMode='highlighted';
  const path='/tracker/pdf/highlighted';
  if(trackerPath()!==path)history.pushState({trackerRoute:'pdf',mode:'highlighted'},'',path);
  trackerOpenWeeklyPdfSettings();
}
function shortDate(raw){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(raw||'')))return '';
  const date=new Date(raw+'T00:00:00');
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
    : '';
}
function taskLine(r){
  const weekly=trackerCellIsWeekly(r.cell);
  const complete=r.f.type==='checkbox'&&trackerCheckboxItems(r.cell).length>0&&
    trackerCheckboxItems(r.cell).every(x=>x.checked);
  const date=trackerTaskHighlightDate(r.f,r.cell);
  return '<div class="dbt-hi-task'+(weekly?' dbt-hi-weekly':'')+'" data-highlight-key="'+esc(r.key)+'">'+
    '<div class="dbt-hi-task-name" title="'+esc(r.f.name)+'">'+
      (complete?'<span class="dbt-hi-done" aria-label="Complete">✓</span>':'')+
      '<span>'+esc(r.f.name)+'</span></div>'+
    '<div class="cell-box dbt-hi-cell-box" data-sid="'+esc(r.s.id)+'" data-cid="'+esc(r.ch.id)+'" data-fid="'+esc(r.f.id)+'">'+
      trackerWeeklyToggleHtml(r.cell)+
      '<button type="button" class="week-task-highlight-date dbt-hi-date" data-chapter-highlight="'+esc(r.key)+'" title="Change highlight date for '+esc(r.f.name)+'" aria-label="Change highlight date for '+esc(r.f.name)+'">📅 '+esc(shortDate(date))+'</button>'+
    '</div>'+
  '</div>';
}
function renderHighlighted(){
  const refs=activeRefs(),groups=[];
  trackerMobileHost.innerHTML='';
  for(const s of trackerState.subjects||[]){
    const own=refs.filter(r=>r.s.id===s.id);
    if(!own.length)continue;
    const chapters=[];
    for(const ch of s.chapters||[]){
      const tasks=own.filter(r=>r.ch.id===ch.id);
      if(tasks.length)chapters.push({ch,tasks});
    }
    groups.push({s,chapters,count:own.length});
  }
  let html='<div class="week-simple-head dbt-highlighted-view-head">'+
    '<div class="week-simple-title"><b>Highlighted</b><em><strong>'+refs.length+'</strong></em></div>'+
    '<div class="week-simple-actions">'+
       '<button type="button" class="week-pdf-btn" id="dbtHighlightedViewPdf">PDF Studio</button>'+
       '<button type="button" class="week-back-btn" id="dbtHighlightedViewBack">← Tracker</button>'+
    '</div></div>';
  if(!refs.length){
    html+='<div class="week-empty"><strong>No highlighted cells</strong></div>';
  }else{
    html+='<div class="dbt-hi-grid">'+groups.map(g=>
      '<section class="dbt-hi-subject">'+
        '<div class="dbt-hi-subject-header"><strong>'+esc(g.s.name)+'</strong><span>'+g.count+'</span></div>'+
        '<div class="dbt-hi-chapters">'+g.chapters.map(row=>
          '<div class="dbt-hi-chapter">'+
            '<div class="dbt-hi-chapter-name" title="'+esc(row.ch.name)+'">'+esc(row.ch.name)+'</div>'+
            '<div class="dbt-hi-tasks">'+row.tasks.map(taskLine).join('')+'</div>'+
          '</div>').join('')+'</div>'+
      '</section>').join('')+'</div>';
  }
  trackerTableHost.innerHTML=html;
  document.getElementById('dbtHighlightedViewPdf').onclick=openPdf;
  document.getElementById('dbtHighlightedViewBack').onclick=()=>{location.href=trackerSubjectPath(trackerActiveSubject)};
  // Retain the same W checkbox, weekly-part popover, date picker and cloud sync
  // listeners used in the main Tracker; omit its large attempt editor DOM.
  bindTrackerCells(trackerTableHost);
}
const baseRender=renderThisWeekView;
renderThisWeekView=function(){
  if(trackerPath()===PATH){renderHighlighted();return;}
  return baseRender.apply(this,arguments);
};
function addLaunch(){
  const bar=document.querySelector('#tracker .week-launchbar');
  if(!bar||document.getElementById('dbtOpenHighlighted'))return;
  const button=document.createElement('button');
  button.id='dbtOpenHighlighted';button.type='button';
  button.className='week-launch-btn dbt-open-highlighted';
  button.textContent='Open Highlighted';
  button.title='Open all currently highlighted cells';
  button.onclick=()=>window.open(PATH,'_blank','noopener');
  const weekly=document.getElementById('trackerWeekBtn');
  if(weekly)weekly.insertAdjacentElement('beforebegin',button);else bar.appendChild(button);
}
const style=document.createElement('style');
style.textContent=`
.dbt-open-highlighted{white-space:nowrap;margin-right:6px}
.dbt-hi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,350px),1fr));align-items:start;gap:12px;padding:10px 2px 18px}
.dbt-hi-subject{min-width:0;overflow:hidden;border:1px solid #253144;border-radius:10px;background:#0d131d}
.dbt-hi-subject-header{display:flex;align-items:center;gap:8px;min-height:35px;padding:9px 12px;border-bottom:1px solid #263248;color:#edf3ff;font-size:12px}
.dbt-hi-subject-header span{font-size:10px;color:#91a2b9;font-variant-numeric:tabular-nums}
.dbt-hi-chapters{display:grid}
.dbt-hi-chapter{display:grid;grid-template-columns:minmax(82px,31%) minmax(0,1fr);min-width:0;border-bottom:1px solid rgba(153,175,208,.10)}
.dbt-hi-chapter:last-child{border-bottom:0}
.dbt-hi-chapter-name{display:flex;align-items:center;padding:9px 10px;min-width:0;font-size:11px;font-weight:700;line-height:1.35;color:#e2e9f7;overflow-wrap:anywhere;border-right:1px solid rgba(153,175,208,.09)}
.dbt-hi-tasks{display:grid;min-width:0}
.dbt-hi-task{display:flex;align-items:center;justify-content:space-between;gap:7px;min-width:0;min-height:31px;padding:3px 8px;border-bottom:1px solid rgba(153,175,208,.08)}
.dbt-hi-task:last-child{border-bottom:0}
.dbt-hi-task:hover{background:rgba(88,121,170,.09)}
.dbt-hi-task-name{display:flex;align-items:center;gap:4px;min-width:0;font-size:10px;font-weight:650;color:#d5dfed}
.dbt-hi-task-name>span:last-child{min-width:0;overflow-wrap:anywhere}
.dbt-hi-done{font-size:11px;color:#8ac6a4}
.dbt-hi-cell-box.cell-box{display:flex!important;position:static!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex:0 0 auto!important;min-height:0!important;height:auto!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;width:auto!important;min-width:0!important;box-shadow:none!important}
.dbt-hi-cell-box .cell-week-tools{display:inline-flex!important;position:static!important;align-items:center!important;gap:3px!important;margin:0!important;padding:0!important;opacity:1!important;pointer-events:auto!important;transform:none!important}
.dbt-hi-cell-box .cell-week-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;pointer-events:auto!important}
.dbt-hi-cell-box .cell-week-part{opacity:1!important;pointer-events:auto!important}
.dbt-hi-cell-box .dbt-hi-date.week-task-highlight-date{position:static!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:55px!important;max-width:none!important;white-space:nowrap!important;opacity:1!important;pointer-events:auto!important;margin:0!important;padding:3px 5px!important;font-size:9px!important;line-height:1.2!important;color:#e2c47f!important;background:rgba(196,155,75,.08)!important;border:1px solid rgba(196,155,75,.19)!important;border-radius:5px!important}
.dbt-hi-cell-box .dbt-hi-date:hover{border-color:rgba(231,190,93,.55)!important}
@media(max-width:680px){.dbt-open-highlighted{font-size:10px;padding:5px 7px;margin-right:4px}.dbt-hi-grid{grid-template-columns:minmax(0,1fr);gap:8px}.dbt-hi-chapter{grid-template-columns:minmax(78px,30%) minmax(0,1fr)}}
`;
document.head.appendChild(style);
addLaunch();
if(trackerPath()===PATH){trackerWeekView=true;document.body.classList.add('tracker-week-page');renderTracker();}
})();