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
    '<div class="week-simple-title"><b>Highlighted</b><em><strong>'+refs.length+'</strong> cells</em></div>'+
    '<div class="week-simple-actions">'+
       '<button type="button" class="week-pdf-btn" id="dbtHighlightedViewPdf">⬇ PDF Studio</button>'+
       '<button type="button" class="week-back-btn" id="dbtHighlightedViewBack">← Tracker</button>'+
    '</div></div>';
  if(!refs.length){
    html+='<div class="week-empty"><strong>No highlighted cells</strong></div>';
  }else{
    html+='<div class="week-subject-grid simple-week-grid dbt-highlighted-grid" style="--week-subject-count:'+groups.length+';--week-grid-min:'+(Math.max(1,groups.length)*280)+'px">'+
    groups.map(g=>'<section class="week-subject-column">'+
      '<div class="week-subject-title"><div class="week-subject-name"><strong>'+esc(g.s.name)+'</strong><span>'+g.count+'</span></div></div>'+
      '<div class="week-subheaders"><span>CHAPTER</span><span>HIGHLIGHTED TASKS</span></div>'+
      '<div class="week-subject-rows">'+g.chapters.map(row=>
        '<div class="week-subject-row">'+
          '<div class="week-chapter-name"><strong>'+esc(row.ch.name)+'</strong></div>'+
          '<div class="week-task-list">'+row.tasks.map(r=>
            '<div class="week-task-card" data-highlight-key="'+esc(r.key)+'">'+
              '<div class="week-task-label">'+esc(r.f.name)+'</div>'+
              '<div class="week-task-control">'+cellHtml(r.s,r.ch,r.f)+
                '<span class="dbt-highlighted-date" title="Highlight until">'+esc(trackerWeekDateText(trackerTaskHighlightDate(r.f,r.cell)))+'</span>'+
              '</div>'+
            '</div>').join('')+'</div>'+
        '</div>').join('')+'</div>'+
      '</section>').join('')+'</div>';
  }
  trackerTableHost.innerHTML=html;
  document.getElementById('dbtHighlightedViewPdf').onclick=openPdf;
  document.getElementById('dbtHighlightedViewBack').onclick=()=>{location.href=trackerSubjectPath(trackerActiveSubject)};
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
.dbt-highlighted-date{font-size:10px;color:#ddb969;white-space:nowrap;padding:0 4px}
.dbt-highlighted-grid .week-task-card{min-width:0}
.dbt-highlighted-grid .week-task-control{min-width:0}
@media(max-width:680px){.dbt-open-highlighted{font-size:10px;padding:5px 7px;margin-right:4px}}
`;
document.head.appendChild(style);
addLaunch();
if(trackerPath()===PATH){trackerWeekView=true;document.body.classList.add('tracker-week-page');renderTracker();}
})();