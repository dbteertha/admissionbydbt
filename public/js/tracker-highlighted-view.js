/* Highlighted Tracker: a dedicated live view, parallel to Weekly Routine.
   Never mutates Tracker records or highlight dates. */
(()=>{
'use strict';
if(typeof renderThisWeekView!=='function'||typeof trackerTaskHighlightActive!=='function')return;
const PATH='/tracker/highlighted';
const highlights=window.dbtHighlightDates;
if(!highlights)return;
function activeRefs(){
  const refs=[],date=highlights.filterDate();
  for(const s of trackerState.subjects||[]){
    for(const ch of s.chapters||[]){
      for(const f of trackerVisibleFields(s)){
        const cell=trackerGetCell(s.id,ch.id,f.id);
        if(highlights.matches(f,cell,date))
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
  const date=highlights.filterDate();
  const path=highlights.url(date,true);
  if(location.pathname+location.search!==path)history.pushState({trackerRoute:'pdf',mode:'highlighted'},'',path);
  trackerOpenWeeklyPdfSettings();
}
function shortDate(raw){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(raw||'')))return '';
  const date=new Date(raw+'T00:00:00');
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
    : '';
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

function highlightedWeekTimerHtml(){
  return '<div class="dbt-hi-week-timer" role="group" aria-label="This Week countdown">'+
    '<span class="dbt-hi-week-label"><i></i>THIS WEEK</span>'+
    '<button type="button" class="dbt-hi-week-date" id="weekRoutineCountdownDate" title="Change weekly deadline" aria-label="Change weekly deadline">—</button>'+
    '<label class="dbt-hi-week-time"><span>TIME</span><input id="weekRoutineTime" type="time" step="60" aria-label="Weekly countdown time in Bangladesh"></label>'+
    '<div class="week-top-countdown dbt-hi-week-countdown" id="weekRoutineCountdown" role="timer" aria-live="off"></div>'+
  '</div>';
}

let highlightedSubjectId='';
function highlightedVisibleKeys(){
 const s=trackerState.subjects.find(x=>x.id===highlightedSubjectId);
 if(!s)return [];
 const keys=new Set();
 for(const ref of activeRefs().filter(x=>x.s.id===s.id)){
   const merge=highlightedMerges(s,ref.ch).find(g=>g.members.includes(ref.f.id));
   keys.add(trackerCellKey(s.id,ref.ch.id,merge?merge.anchor:ref.f.id));
 }
 return [...keys];
}
function highlightedSelectKeys(keys){
 if(!keys.length)return;
 const all=keys.every(k=>trackerSelectedCells.has(k));
 keys.forEach(k=>all?trackerSelectedCells.delete(k):trackerSelectedCells.add(k));
 trackerUpdateSelectionUI();
}
function highlightedSelectionBindings(){
 const selectAll=document.getElementById('dbtHighlightedSelectAll');
 if(selectAll)selectAll.onclick=()=>highlightedSelectKeys(highlightedVisibleKeys());
 const allowed=new Set(highlightedVisibleKeys());
 for(const key of [...trackerSelectedCells])if(!allowed.has(key))trackerSelectedCells.delete(key);
 trackerTableHost.querySelectorAll('[data-hi-select-column]').forEach(b=>b.onclick=e=>{
   e.stopPropagation();e.preventDefault();
   const s=trackerState.subjects.find(x=>x.id===highlightedSubjectId);
   if(!s)return;
   highlightedSelectKeys([...new Set(s.chapters.map(ch=>{const id=b.dataset.hiSelectColumn;const merge=highlightedMerges(s,ch).find(g=>g.members.includes(id));return trackerCellKey(s.id,ch.id,merge?merge.anchor:id)}).filter(k=>allowed.has(k)))]);
 });
 trackerTableHost.querySelectorAll('[data-hi-select-row]').forEach(b=>b.onclick=e=>{
   e.stopPropagation();e.preventDefault();
   highlightedSelectKeys([...allowed].filter(k=>k.split('|')[1]===b.dataset.hiSelectRow));
 });
 trackerUpdateSelectionUI();
}

function renderHighlighted(){
  const date=highlights.filterDate();
  const refs=activeRefs();
  trackerMobileHost.innerHTML='';
  const subjects=trackerState.subjects.filter(s=>refs.some(r=>r.s.id===s.id));
  if(!subjects.some(s=>s.id===highlightedSubjectId))
    highlightedSubjectId=subjects[0]?.id||'';
  const current=subjects.find(s=>s.id===highlightedSubjectId);
  let html=highlightedWeekTimerHtml()+'<div class="week-simple-head dbt-hi-top">'+
    '<div class="week-simple-title"><b>Highlighted'+(date?' · '+esc(shortDate(date)):'')+'</b><em><strong>'+refs.length+'</strong></em></div>'+
    '<div class="week-simple-actions">'+
      '<button type="button" class="week-pdf-btn dbt-hi-select-all" id="dbtHighlightedSelectAll">Select all</button><button type="button" class="week-pdf-btn" id="dbtHighlightedViewPdf">PDF Studio</button>'+
      '<button type="button" class="week-pdf-btn dbt-highlighted-weekly-btn" id="dbtHighlightedViewWeekly">Open This Week</button>'+
      '<button type="button" class="week-back-btn" id="dbtHighlightedViewBack">← Tracker</button>'+
    '</div></div>'+highlights.legendHtml(date,false);
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
      fields.map(f=>'<th><div class="field-head"><button type="button" class="axis-select-btn col-select-btn dbt-hi-axis" data-hi-select-column="'+esc(f.id)+'" title="Select highlighted column">↓</button><span>'+esc(f.name)+'</span></div></th>').join('')+
      '</tr></thead><tbody>'+
      chapters.map(ch=>{
        const num=String(current.chapters.indexOf(ch)+1).padStart(2,'0');
        return '<tr><td><div class="chapter-cell">'+
          '<button type="button" class="axis-select-btn row-select-btn dbt-hi-axis" data-hi-select-row="'+esc(ch.id)+'" title="Select highlighted row">→</button><span class="chapter-num">'+num+'</span>'+
          '<div class="chapter-name"><strong>'+esc(ch.name)+'</strong></div>'+
          '</div></td>'+
          fields.map((f,index)=>{
            const merges=highlightedMerges(current,ch);
            const group=merges.find(g=>g.members.includes(f.id)&&g.members.some(id=>own.some(r=>r.ch.id===ch.id&&r.f.id===id)));
            // Covered members disappear as TDs, exactly like Main Tracker.
            if(group&&group.anchor!==f.id)return '';
            const members=group?group.members:[f.id];
            const highlighted=members.map(id=>{
              const memberField=fields.find(x=>x.id===id);
              if(!memberField)return null;
              const memberCell=trackerGetCell(current.id,ch.id,id);
              return highlights.matches(memberField,memberCell,date)
                ?{f:memberField,cell:memberCell}:null;
            }).filter(Boolean);
            if(!highlighted.length)
              return '<td class="track-cell dbt-hi-empty"'+(group?' colspan="'+members.length+'"':'')+'></td>';
            // Use the existing anchor editor so merged cells have one visible
            // surface. Highlight badges continue pointing to their real cells.
            const first=group?fields.find(x=>x.id===group.anchor):f;
            const dates=highlighted.map(({f:memberField,cell:memberCell})=>trackerTaskHighlightBadge(current,ch,memberField,memberCell)).join('');
            const content=cellHtml(current,ch,first);
            const end=content.lastIndexOf('</div>');
            const marked=end>=0?content.slice(0,end)+dates+content.slice(end):content;
            return '<td class="track-cell field-date-highlight-cell'+(group?' dbt-merged-cell dbt-hi-merged':'')+'"'+
              (group?' colspan="'+members.length+'"':'')+'>'+marked+'</td>';
          }).join('')+'</tr>';
      }).join('')+'</tbody></table></div>';
  }
  trackerTableHost.innerHTML=html;
  trackerTableHost.querySelectorAll('.dbt-highlight-legend-link').forEach(link=>{
    link.onclick=e=>{
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();
      const next=link.getAttribute('href');
      if(next===location.pathname+location.search)return;
      trackerClearSelection();
      history.pushState({trackerRoute:'highlighted'},'',next);
      renderHighlighted();
    };
  });
  document.getElementById('dbtHighlightedViewPdf').onclick=openPdf;
  document.getElementById('dbtHighlightedViewWeekly').onclick=()=>window.open(TRACKER_WEEK_PATH,'_blank','noopener');
  document.getElementById('dbtHighlightedViewBack').onclick=()=>{location.href=trackerSubjectPath(trackerActiveSubject)};
  // Share the same deadline, server clock, and per-second updater as Main Tracker.
  const deadline=document.getElementById('weekRoutineCountdownDate');
  if(deadline)deadline.onclick=()=>{
    try{
      if(typeof trackerWeekDate.showPicker==='function')trackerWeekDate.showPicker();
      else trackerWeekDate.focus();
    }catch(_){trackerWeekDate.focus()}
  };
  trackerUpdateWeekCountdown();
  trackerTableHost.querySelectorAll('[data-hi-sub]').forEach(button=>{
    button.onclick=()=>{
      trackerClearSelection();
      highlightedSubjectId=button.dataset.hiSub;
      renderHighlighted();
    };
  });
  bindTrackerCells(trackerTableHost);
  highlights.bindColumnDateButtons(trackerTableHost,current);
  highlightedSelectionBindings();
  installAttemptColumns();
}

// Numbered attempt columns are a presentation of existing check IDs, not new fields.
const attemptSelection=new Set();
let attemptDrag=false,attemptDragAdd=true;
const attemptKey=(key,id)=>key+'|'+id;
function attemptRefs(){
  const refs=[];
  for(const k of attemptSelection){
    const at=k.lastIndexOf('|'),r=trackerResolveCellKey(k.slice(0,at));
    if(!r||r.f.type!=='checkbox')continue;
    const item=trackerCheckboxItems(r.cell).find(x=>x.id===k.slice(at+1));
    if(item)refs.push({...r,item});
  }
  return refs;
}
function updateAttemptSelection(){
  const host=trackerTableHost;
  if(!host)return;
  const visible=new Set([...host.querySelectorAll('[data-dbt-attempt-key]')].map(el=>el.dataset.dbtAttemptKey));
  for(const k of [...attemptSelection])if(!visible.has(k))attemptSelection.delete(k);
  host.querySelectorAll('[data-dbt-attempt-key]').forEach(el=>el.classList.toggle('dbt-attempt-selected',attemptSelection.has(el.dataset.dbtAttemptKey)));
  host.querySelectorAll('[data-dbt-attempt-column]').forEach(b=>{
    const keys=columnAttemptKeys(b.dataset.dbtField,b.dataset.dbtAttemptColumn);
    const all=keys.length>0&&keys.every(k=>attemptSelection.has(k));
    b.classList.toggle('active',all);b.setAttribute('aria-pressed',String(!!all));
  });
  const bar=host.querySelector('.dbt-attempt-bulk');
  if(bar){bar.hidden=!attemptSelection.size;bar.querySelector('.dbt-attempt-count').textContent=attemptSelection.size+' checkboxes selected';}
}
function columnAttemptKeys(fid,index){
  return [...trackerTableHost.querySelectorAll('[data-dbt-attempt-key]')].filter(el=>el.dataset.dbtField===fid&&el.dataset.dbtAttemptIndex===String(index)).map(el=>el.dataset.dbtAttemptKey);
}
function selectAttemptKeys(keys){
  if(!keys.length)return;
  if(trackerSelectedCells.size){trackerSelectedCells.clear();trackerUpdateSelectionUI();}
  const all=keys.every(k=>attemptSelection.has(k));
  keys.forEach(k=>all?attemptSelection.delete(k):attemptSelection.add(k));
  updateAttemptSelection();
}
function applyAttemptEdit(patch){
  const refs=attemptRefs(),stamp=new Date().toISOString();
  for(const r of refs){
    if(patch.checked!==undefined)r.item.checked=patch.checked;
    if(patch.label!==undefined)r.item.label=patch.label||String(trackerCheckboxItems(r.cell).indexOf(r.item)+1);
    if(patch.comment!==undefined)r.item.comment=patch.comment;
    r.item.updatedAt=stamp;trackerSyncLegacyCheckbox(r.cell);
  }
  if(refs.length)trackerSave('Edited selected checkbox attempts');
  return refs.length;
}
function openAttemptBulk(){
  const refs=attemptRefs();if(!refs.length)return;
  modalOpen('Edit selected checkboxes',refs.length+' checkboxes selected',
    '<div class="form-row"><label>State</label><select id="dbtAttemptState"><option value="keep">Keep existing</option><option value="true">Checked</option><option value="false">Unchecked</option></select></div>'+
    '<div class="form-row"><label>Label</label><input id="dbtAttemptLabel" placeholder="Keep existing"></div>'+
    '<div class="form-row"><label>Comment</label><textarea id="dbtAttemptComment" placeholder="Keep existing"></textarea></div>'+
    '<div class="form-row"><label>Comment action</label><select id="dbtAttemptCommentMode"><option value="keep">Keep existing</option><option value="replace">Replace</option><option value="clear">Clear</option></select></div>',
    '<button type="button" class="btn" id="dbtAttemptCancel">Cancel</button><button type="button" class="btn primary" id="dbtAttemptSave">Apply</button>');
  document.getElementById('dbtAttemptCancel').onclick=()=>modalClose();
  document.getElementById('dbtAttemptSave').onclick=()=>{
    const patch={},state=document.getElementById('dbtAttemptState').value,label=document.getElementById('dbtAttemptLabel').value.trim(),mode=document.getElementById('dbtAttemptCommentMode').value;
    if(state!=='keep')patch.checked=state==='true';
    if(label)patch.label=label;
    if(mode!=='keep')patch.comment=mode==='clear'?'':document.getElementById('dbtAttemptComment').value.trim();
    if(Object.keys(patch).length)applyAttemptEdit(patch);
    modalClose();
  };
}
function installAttemptColumns(){
  const host=trackerTableHost,table=host.querySelector('table.tracker-table');
  if(!table)return;
  const counts=new Map(),boxes=[...table.querySelectorAll('.cell-box.multi-check[data-fid]')];
  boxes.forEach(box=>{
    const count=box.querySelectorAll('.check-stack > .check-attempt').length;
    counts.set(box.dataset.fid,Math.max(counts.get(box.dataset.fid)||1,count));
  });
  table.querySelectorAll('thead th').forEach(th=>{
    const head=th.querySelector('.field-head');
    const id=head?.querySelector('[data-edit-field]')?.dataset.editField||head?.querySelector('[data-hi-select-column]')?.dataset.hiSelectColumn;
    const n=counts.get(id)||1;
    if(n<2||th.querySelector('.dbt-attempt-head'))return;
    th.classList.add('dbt-attempt-parent');
    const sub=document.createElement('div');sub.className='dbt-attempt-head';sub.style.setProperty('--attempt-cols',n);
    for(let i=0;i<n;i++){
      const b=document.createElement('button');b.type='button';b.textContent=String(i+1);
      b.dataset.dbtField=id;b.dataset.dbtAttemptColumn=String(i);b.title='Select checkbox column '+(i+1);
      b.setAttribute('aria-label',head.textContent.trim()+' checkbox column '+(i+1));
      b.onclick=e=>{e.preventDefault();e.stopPropagation();selectAttemptKeys(columnAttemptKeys(id,i))};
      sub.appendChild(b);
    }
    th.appendChild(sub);
  });
  boxes.forEach(box=>{
    const n=counts.get(box.dataset.fid)||1,stack=box.querySelector('.check-stack');
    if(n<2||!stack||stack.querySelector('.dbt-attempt-lane'))return;
    const attempts=[...stack.querySelectorAll(':scope > .check-attempt')],add=stack.querySelector('.add-check');
    box.classList.add('dbt-attempt-split');stack.style.setProperty('--attempt-cols',n);
    const key=trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid);
    for(let i=0;i<n;i++){
      const lane=document.createElement('div');lane.className='dbt-attempt-lane';
      const attempt=attempts[i];
      if(attempt){
        lane.dataset.dbtAttemptKey=attemptKey(key,attempt.dataset.attemptId);lane.dataset.dbtField=box.dataset.fid;lane.dataset.dbtAttemptIndex=String(i);
        const k=lane.dataset.dbtAttemptKey;
        lane.tabIndex=0;lane.setAttribute('aria-label','Select checkbox '+(i+1));
        lane.onpointerdown=e=>{
          if(e.button!==0||e.target.closest('input,button,.attempt-actions'))return;
          e.preventDefault();e.stopPropagation();
          if(trackerSelectedCells.size){trackerSelectedCells.clear();trackerUpdateSelectionUI();}
          attemptDrag=true;attemptDragAdd=!attemptSelection.has(k);
          if(attemptDragAdd)attemptSelection.add(k);else attemptSelection.delete(k);
          updateAttemptSelection();
        };
        lane.onpointerenter=()=>{if(attemptDrag){if(attemptDragAdd)attemptSelection.add(k);else attemptSelection.delete(k);updateAttemptSelection()}};
        lane.onkeydown=e=>{
          if(e.target!==lane)return;
          if(e.key===' '){e.preventDefault();e.stopPropagation();selectAttemptKeys([k])}
          if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!attemptSelection.has(k))selectAttemptKeys([k]);openAttemptBulk()}
        };
        const toggle=attempt.querySelector('[data-check-toggle]');
        if(toggle){
          const original=toggle.onchange;
          toggle.onchange=e=>{
            if(attemptSelection.has(k)){e.stopPropagation();applyAttemptEdit({checked:toggle.checked});}
            else {if(attemptSelection.size){attemptSelection.clear();updateAttemptSelection()}if(original)original.call(toggle,e);}
          };
        }
        attempt.querySelectorAll('[data-check-edit],[data-check-comment]').forEach(b=>{
          const original=b.onclick;b.onclick=e=>{
            if(attemptSelection.has(k)){e.preventDefault();e.stopPropagation();openAttemptBulk();}
            else if(original)original.call(b,e);
          };
        });
        lane.appendChild(attempt);
      }else{lane.classList.add('dbt-attempt-missing');lane.setAttribute('aria-hidden','true');}
      stack.insertBefore(lane,add||null);
    }
    // Keep existing add-attempt and calendar/weekly controls at parent-cell level.
  });
  if(!host.querySelector('.dbt-attempt-bulk')){
    const bar=document.createElement('div');bar.className='dbt-attempt-bulk';bar.hidden=true;
    bar.innerHTML='<span class="dbt-attempt-count"></span><button type="button" class="btn primary" data-attempt-edit>Edit selected</button><button type="button" class="btn" data-attempt-check>✓ Check</button><button type="button" class="btn" data-attempt-uncheck>○ Uncheck</button><button type="button" class="btn" data-attempt-clear>Clear selection</button>';
    bar.querySelector('[data-attempt-edit]').onclick=openAttemptBulk;
    bar.querySelector('[data-attempt-check]').onclick=()=>applyAttemptEdit({checked:true});
    bar.querySelector('[data-attempt-uncheck]').onclick=()=>applyAttemptEdit({checked:false});
    bar.querySelector('[data-attempt-clear]').onclick=()=>{attemptSelection.clear();updateAttemptSelection()};
    const wrap=table.closest('.dbt-hi-main-table-wrap')||table;
    wrap.before(bar);
  }
  updateAttemptSelection();
}
document.addEventListener('pointerup',()=>{attemptDrag=false});
document.addEventListener('pointercancel',()=>{attemptDrag=false});
const beforeAttemptSelection=trackerUpdateSelectionUI;
trackerUpdateSelectionUI=function(){
  const result=beforeAttemptSelection.apply(this,arguments);
  if(trackerSelectedCells.size&&attemptSelection.size){attemptSelection.clear();updateAttemptSelection()}
  return result;
};
const beforeAttemptClear=trackerClearSelection;
trackerClearSelection=function(){attemptSelection.clear();const r=beforeAttemptClear.apply(this,arguments);updateAttemptSelection();return r};
const beforeAttemptRows=renderTrackerRows;
renderTrackerRows=function(s){
  const r=beforeAttemptRows.apply(this,arguments);
  if(!trackerWeekView)installAttemptColumns();
  return r;
};

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
  button.title='Open all active highlight dates';
  button.onclick=()=>window.open(PATH,'_blank','noopener');
  const weekly=document.getElementById('trackerWeekBtn');
  if(weekly)weekly.insertAdjacentElement('beforebegin',button);else bar.appendChild(button);
}
const style=document.createElement('style');
style.textContent=`

#tracker .dbt-attempt-parent{height:auto!important;min-height:48px!important;padding-bottom:0!important}
#tracker .dbt-attempt-head{display:grid;grid-template-columns:repeat(var(--attempt-cols),minmax(24px,1fr));border-top:1px solid rgba(255,255,255,.10);width:100%;min-height:24px}
#tracker .dbt-attempt-head button{position:static!important;transform:none!important;opacity:1!important;pointer-events:auto!important;border:0;border-right:1px solid rgba(255,255,255,.10);border-radius:0;background:transparent;color:#aeb9c8;font-size:10px;cursor:pointer;padding:4px 0}
#tracker .dbt-attempt-head button:last-child{border-right:0}
#tracker .dbt-attempt-head button:hover,#tracker .dbt-attempt-head button.active{background:#26364c;color:#fff}
#tracker .cell-box.dbt-attempt-split{height:auto!important;min-height:43px!important;overflow:visible!important;padding:0 0 15px!important}
#tracker .cell-box.dbt-attempt-split .check-stack{display:grid!important;grid-template-columns:repeat(var(--attempt-cols),minmax(24px,1fr));width:100%!important;max-width:none!important;min-width:0!important;gap:0!important;padding:0!important;overflow:visible!important;align-items:stretch!important}
#tracker .dbt-attempt-lane{display:flex;align-items:center;justify-content:center;min-height:30px;min-width:0;border-right:1px solid rgba(255,255,255,.10);cursor:cell;position:relative}
#tracker .dbt-attempt-lane:last-of-type{border-right:0}
#tracker .dbt-attempt-lane .check-attempt{display:flex!important;justify-content:center!important;align-items:center!important;padding:2px!important}
#tracker .dbt-attempt-lane.dbt-attempt-selected{background:rgba(104,166,255,.19);outline:1px solid #76a9ed;outline-offset:-1px}
#tracker .dbt-attempt-split .check-stack>.add-check,#tracker .dbt-attempt-split .check-stack>.dbt-date-pending{grid-column:1/-1;justify-self:center}
#tracker .dbt-attempt-bulk{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:5px 8px;background:#111820;border:1px solid #32445d;border-radius:6px;margin:4px 0;flex:none}
#tracker .dbt-attempt-bulk[hidden]{display:none!important}
#tracker .dbt-attempt-count{font-size:11px;color:#d3e0f0;font-weight:700;margin-right:4px}

.dbt-open-highlighted{white-space:nowrap;margin-right:6px}
body.tracker-week-page:has(.dbt-hi-main-table) #trackerBulkBar.show{display:flex!important;position:relative!important;flex-wrap:wrap;gap:5px;padding:7px 9px;max-height:180px;overflow:auto}
body.tracker-week-page:has(.dbt-hi-main-table) #trackerBulkBar.show .bulk-live-hint{display:none!important}
.dbt-hi-axis{position:static!important;display:inline-flex!important;opacity:.7!important;pointer-events:auto!important;margin-right:5px!important}
.dbt-hi-axis:hover{opacity:1!important}
.dbt-hi-select-all{white-space:nowrap}
.dbt-hi-main-table .cell-box.selected{outline:2px solid rgba(104,166,255,.76)!important;background:rgba(74,119,228,.13)!important}

.dbt-hi-week-timer{display:flex;align-items:center;gap:9px;flex-wrap:wrap;min-height:40px;padding:6px 10px;margin:0 0 9px;border:1px solid #263244;border-radius:8px;background:#0c121b}
.dbt-hi-week-label{display:inline-flex;align-items:center;gap:6px;color:#d6e2f6;letter-spacing:.08em;font-weight:850;font-size:10px;white-space:nowrap}
.dbt-hi-week-label i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f56582;box-shadow:0 0 8px rgba(245,101,130,.45)}
.dbt-hi-week-date{padding:5px 6px;color:#f0f4ff;border:1px solid transparent;border-radius:5px;background:transparent;font-weight:750;font-size:11px;cursor:pointer}
.dbt-hi-week-date:hover,.dbt-hi-week-date:focus-visible{border-color:#425778;background:#182337}
.dbt-hi-week-time{display:inline-flex;align-items:center;gap:7px;padding:3px 7px;border:1px solid #27364d;border-radius:5px;background:#111927}
.dbt-hi-week-time span{font-size:9px;color:#96a9c2;font-weight:700}
.dbt-hi-week-time input{border:0;outline-offset:2px;background:transparent;color:#f3f6ff;font-size:11px;font-weight:650;min-width:82px;color-scheme:dark}
.dbt-hi-week-countdown.week-top-countdown{margin:0;display:flex;align-items:center;gap:4px;min-height:29px;padding:4px 8px;white-space:nowrap}
@media(max-width:680px){.dbt-hi-week-timer{gap:6px;padding:6px}.dbt-hi-week-date{font-size:10px}.dbt-hi-week-time{gap:3px;padding:3px 5px}.dbt-hi-week-countdown.week-top-countdown{font-size:10px}}

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
.dbt-hi-main-table td.dbt-hi-merged{min-width:0!important;padding:3px 4px!important}
.dbt-hi-main-table td.dbt-hi-empty{background:#0a0f16!important;opacity:.25}
.dbt-hi-main-table .cell-box{min-height:43px!important}
@media(max-width:680px){.dbt-open-highlighted{font-size:10px;padding:5px 7px;margin-right:4px}.dbt-hi-subtab{flex-basis:90px}.dbt-hi-main-table-wrap{max-height:calc(100vh - 185px)}}
`;
document.head.appendChild(style);
addLaunch();
if(trackerPath()===PATH){trackerWeekView=true;document.body.classList.add('tracker-week-page');renderTracker();}
else if(!trackerWeekView)renderTrackerRows(trackerSubject());
})();