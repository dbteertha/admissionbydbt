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
// Match the Main Tracker's lossless horizontal merge metadata.
function highlightedMerges(s,ch){
  const visible=trackerVisibleFields(s).map(f=>f.id),used=new Set(),groups=[];
  for(const id of visible){
    const cell=trackerGetCell(s.id,ch.id,id);
    const extras=Array.isArray(cell.mergedWith)?cell.mergedWith:[];
    if(!extras.length||used.has(id))continue;
    const all=[id,...extras];
    const start=visible.indexOf(id);
    if(all.length<2||new Set(all).size!==all.length||
       all.some((x,i)=>visible.indexOf(x)!==start+i||used.has(x)))continue;
    groups.push({anchor:id,members:all});
    all.forEach(x=>used.add(x));
  }
  return groups;
}

let highlightedSubjectId='';
function renderHighlighted(){
  const refs=activeRefs();
  trackerMobileHost.innerHTML='';
  const subjects=trackerState.subjects.filter(s=>refs.some(r=>r.s.id===s.id));
  if(!subjects.some(s=>s.id===highlightedSubjectId))
    highlightedSubjectId=subjects[0]?.id||'';
  const current=subjects.find(s=>s.id===highlightedSubjectId);
  let html='<div class="week-simple-head dbt-hi-top">'+
    '<div class="week-simple-title"><b>Highlighted</b><em><strong>'+refs.length+'</strong></em></div>'+
    '<div class="week-simple-actions">'+
      '<button type="button" class="week-pdf-btn" id="dbtHighlightedViewPdf">PDF Studio</button>'+
      '<button type="button" class="week-pdf-btn dbt-highlighted-weekly-btn" id="dbtHighlightedViewWeekly">Open This Week</button>'+
      '<button type="button" class="week-back-btn" id="dbtHighlightedViewBack">← Tracker</button>'+
    '</div></div>';
  if(!current){
    html+='<div class="week-empty"><strong>No highlighted cells</strong></div>';
  }else{
    html+='<div class="dbt-hi-subject-tabs" role="tablist" aria-label="Highlighted subjects">'+
      subjects.map(s=>'<button type="button" role="tab" aria-selected="'+(s.id===current.id?'true':'false')+'" class="dbt-hi-subtab'+(s.id===current.id?' active':'')+'" data-hi-sub="'+esc(s.id)+'">'+
        esc(s.name)+' <span>'+refs.filter(r=>r.s.id===s.id).length+'</span></button>').join('')+
      '</div>';
    const own=refs.filter(r=>r.s.id===current.id);
    const chapters=current.chapters.filter(ch=>own.some(r=>r.ch.id===ch.id));
    // Include all original columns belonging to an active merged group,
    // even when the covered member has no independent highlight.
    const included=new Set(own.map(r=>r.f.id));
    for(const ch of chapters){
      for(const group of highlightedMerges(current,ch)){
        if(group.members.some(id=>own.some(r=>r.ch.id===ch.id&&r.f.id===id)))
          group.members.forEach(id=>included.add(id));
      }
    }
    const fields=trackerVisibleFields(current).filter(f=>included.has(f.id));
    html+='<div class="dbt-hi-main-table-wrap"><table class="tracker-table dbt-hi-main-table"><thead><tr>'+
      '<th><div class="field-head"><span>'+esc(current.name)+' • CHAPTER</span></div></th>'+
      fields.map(f=>'<th><div class="field-head"><span>'+esc(f.name)+'</span></div></th>').join('')+
      '</tr></thead><tbody>'+
      chapters.map(ch=>{
        const num=String(current.chapters.indexOf(ch)+1).padStart(2,'0');
        return '<tr><td><div class="chapter-cell">'+
          '<span class="chapter-num">'+num+'</span>'+
          '<div class="chapter-name"><strong>'+esc(ch.name)+'</strong></div>'+
          '</div></td>'+
          fields.map((f,index)=>{
            const merges=highlightedMerges(current,ch);
            const group=merges.find(g=>g.members.includes(f.id));
            // Covered members disappear as TDs, exactly like Main Tracker.
            if(group&&group.anchor!==f.id)return '';
            const members=group?group.members:[f.id];
            const highlighted=members.map(id=>{
              const memberField=fields.find(x=>x.id===id);
              if(!memberField)return null;
              const memberCell=trackerGetCell(current.id,ch.id,id);
              return trackerTaskHighlightActive(memberField,memberCell)
                ?{f:memberField,cell:memberCell}:null;
            }).filter(Boolean);
            if(!highlighted.length)
              return '<td class="track-cell dbt-hi-empty"'+(group?' colspan="'+members.length+'"':'')+'></td>';
            // Use the existing anchor editor so merged cells have one visible
            // surface. Highlight badges continue pointing to their real cells.
            const display=highlighted[0],first=group?fields.find(x=>x.id===group.anchor):f;
            const dates=highlighted.map(({f:memberField,cell:memberCell})=>{
              const key=trackerCellKey(current.id,ch.id,memberField.id);
              return '<button type="button" class="week-task-highlight-date dbt-hi-short-date" data-chapter-highlight="'+esc(key)+'" title="'+esc(memberField.name)+' · Change highlight date" aria-label="Change '+esc(memberField.name)+' highlight date">📅 '+esc(shortDate(trackerTaskHighlightDate(memberField,memberCell)))+'</button>';
            }).join('');
            const content=cellHtml(current,ch,first);
            const end=content.lastIndexOf('</div>');
            const marked=end>=0?content.slice(0,end)+dates+content.slice(end):content;
            return '<td class="track-cell field-date-highlight-cell'+(group?' dbt-merged-cell dbt-hi-merged':'')+'"'+
              (group?' colspan="'+members.length+'"':'')+'>'+marked+'</td>';
          }).join('')+'</tr>';
      }).join('')+'</tbody></table></div>';
  }
  trackerTableHost.innerHTML=html;
  document.getElementById('dbtHighlightedViewPdf').onclick=openPdf;
  document.getElementById('dbtHighlightedViewWeekly').onclick=()=>window.open(TRACKER_WEEK_PATH,'_blank','noopener');
  document.getElementById('dbtHighlightedViewBack').onclick=()=>{location.href=trackerSubjectPath(trackerActiveSubject)};
  trackerTableHost.querySelectorAll('[data-hi-sub]').forEach(button=>{
    button.onclick=()=>{
      highlightedSubjectId=button.dataset.hiSub;
      renderHighlighted();
    };
  });
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
.dbt-hi-top{margin-bottom:9px!important}
.dbt-hi-subject-tabs{display:flex;gap:5px;align-items:stretch;overflow-x:auto;padding:0 0 9px;scrollbar-width:thin}
.dbt-hi-subtab{flex:1 0 105px;display:flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:7px 10px;color:#bacbe3;font-weight:750;font-size:11px;background:#101722;border:1px solid #283343;border-radius:7px;cursor:pointer}
.dbt-hi-subtab.active{background:#152236;color:#f6f9ff;border-color:#7199d6;box-shadow:inset 0 -2px #7199d6}
.dbt-hi-subtab span{font-size:9px;font-weight:600;opacity:.72}
.dbt-hi-main-table-wrap{overflow:auto;max-height:calc(100vh - 215px);min-height:220px;border:1px solid #222c3b;border-radius:8px}
.dbt-hi-main-table{width:100%;min-width:660px;border-collapse:separate;border-spacing:0}
.dbt-hi-main-table thead{position:sticky;top:0;z-index:4}
.dbt-hi-main-table th:first-child,.dbt-hi-main-table td:first-child{width:clamp(145px,18%,250px);min-width:145px}
.dbt-hi-main-table .chapter-cell{min-height:42px;display:flex;align-items:center;gap:8px}
.dbt-hi-main-table .chapter-name{min-width:0}
.dbt-hi-main-table .chapter-name strong{white-space:normal;overflow-wrap:anywhere}
.dbt-hi-main-table td.track-cell{padding:3px 4px}
.dbt-hi-main-table td.dbt-hi-merged{min-width:0!important;padding:3px 4px!important}\n.dbt-hi-main-table td.dbt-hi-empty{background:#0a0f16!important;opacity:.25}
.dbt-hi-main-table .cell-box{min-height:43px!important}
.dbt-hi-main-table .dbt-hi-short-date.week-task-highlight-date{position:absolute!important;top:3px!important;right:4px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;width:auto!important;max-width:none!important;min-width:0!important;padding:3px 5px!important;font-size:10px!important;line-height:1.2!important;color:#e5c279!important;background:rgba(199,156,75,.09)!important;border:1px solid rgba(199,156,75,.22)!important;border-radius:5px!important}
.dbt-hi-main-table .dbt-hi-short-date:hover{border-color:rgba(236,185,89,.7)!important}
@media(max-width:680px){.dbt-open-highlighted{font-size:10px;padding:5px 7px;margin-right:4px}.dbt-hi-subtab{flex-basis:90px}.dbt-hi-main-table-wrap{max-height:calc(100vh - 185px)}}
`;
document.head.appendChild(style);
addLaunch();
if(trackerPath()===PATH){trackerWeekView=true;document.body.classList.add('tracker-week-page');renderTracker();}
})();