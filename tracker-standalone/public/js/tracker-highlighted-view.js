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
  let html='<div class="dbt-hi-toolbar-row">'+highlightedWeekTimerHtml()+'<div class="week-simple-head dbt-hi-top">'+
    '<div class="week-simple-title"><b>Highlighted'+(date?' · '+esc(shortDate(date)):'')+'</b><em><strong>'+refs.length+'</strong></em></div>'+
    '<div class="week-simple-actions">'+
      '<button type="button" class="week-pdf-btn dbt-hi-select-all" id="dbtHighlightedSelectAll">Select all</button><button type="button" class="week-pdf-btn" id="dbtHighlightedViewPdf">PDF Studio</button>'+
      '<button type="button" class="week-pdf-btn dbt-highlighted-weekly-btn" id="dbtHighlightedViewWeekly">Open This Week</button>'+
      '<button type="button" class="week-back-btn" id="dbtHighlightedViewBack">← Tracker</button>'+
    '</div></div>'+highlights.legendHtml(date,false)+'</div>';
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
  if(bar){bar.hidden=false;bar.classList.toggle('dbt-no-attempt-selection',!attemptSelection.size);bar.querySelector('.dbt-attempt-count').textContent=attemptSelection.size+' checkboxes selected';}
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
function applyAttemptEdit(patch,targets){
  const refs=targets||attemptRefs(),stamp=new Date().toISOString();
  for(const r of refs){
    const item=materializeAttempt(r);if(!item)continue;
    if(patch.checked!==undefined)item.checked=patch.checked;
    if(patch.label!==undefined)item.label=patch.label||String(trackerCheckboxItems(r.cell).indexOf(item)+1);
    if(patch.comment!==undefined)item.comment=patch.comment;
    item.updatedAt=stamp;trackerSyncLegacyCheckbox(r.cell);
  }
  if(refs.length)trackerSave('Edited selected checkbox attempts');
  return refs.length;
}
function openAttemptHighlight(anchor,targets){
  const refs=targets||attemptRefs();if(!refs.length)return;
  trackerShowCellPopover(anchor,
    '<div class="cell-pop-title">Highlight '+refs.length+' selected checkboxes</div>'+
    '<div class="dbt-date-pop-body"><label class="dbt-date-pop-label">Date <input type="date" id="dbtAttemptHighlightDate" value="'+esc((refs.length===1?highlights.attemptDateState(refs[0].f,refs[0].cell).dates[trackerCheckboxItems(refs[0].cell).indexOf(refs[0].item)]:null)||trackerLocalDateKey())+'"></label>'+
    '<div class="dbt-date-pop-actions"><button type="button" class="cell-pop-btn" id="dbtAttemptHighlightClear">Clear dates</button><button type="button" class="cell-pop-btn" id="dbtAttemptHighlightCancel">Cancel</button><button type="button" class="cell-pop-btn primary" id="dbtAttemptHighlightApply">Apply date</button></div></div>');
  const input=trackerCellPopover.querySelector('#dbtAttemptHighlightDate');
  const apply=clear=>{
    const date=clear?'':input.value;
    if(!clear&&!/^\d{4}-\d{2}-\d{2}$/.test(date)){trackerToastMsg('Choose a date');return;}
    const current=refs;let changed=0;
    for(const r of current)if(highlights.setAttemptDate(r.f,r.cell,r.item,date))changed++;
    trackerCloseCellPopover();
    if(changed){trackerSave(clear?'Cleared selected checkbox dates':'Highlighted selected checkboxes');trackerToastMsg(changed+' checkboxes updated');}
  };
  trackerCellPopover.querySelector('#dbtAttemptHighlightApply').onclick=()=>apply(false);
  trackerCellPopover.querySelector('#dbtAttemptHighlightClear').onclick=()=>apply(true);
  trackerCellPopover.querySelector('#dbtAttemptHighlightCancel').onclick=()=>trackerCloseCellPopover();
}

function openAttemptBulk(targets){
  const refs=Array.isArray(targets)?targets:attemptRefs();if(!refs.length)return;
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
    if(Object.keys(patch).length)applyAttemptEdit(patch,refs);
    modalClose();
  };
}

/* Per-attempt weekly membership; legacy weekly cells initially mean all attempts.
   Keep the parent tag as the compatibility index for Weekly/Daily and cloud sync. */
function attemptWeekly(c,item){
  if(!trackerCellIsWeekly(c))return false;
  return c.attemptWeeklyMode===true?item.weeklySelected===true:true;
}
function setAttemptWeekly(r,on){
  const c=r.cell,checks=trackerCheckboxItems(c),was=trackerCellIsWeekly(c);
  if(c.attemptWeeklyMode!==true){
    checks.forEach(x=>{x.weeklySelected=was});
    c.attemptWeeklyMode=true;
  }else if(!was)checks.forEach(x=>{x.weeklySelected=false});
  const item=checks.find(x=>x.id===r.item.id);if(!item)return false;
  item.weeklySelected=!!on;item.updatedAt=new Date().toISOString();
  const any=checks.some(x=>x.weeklySelected===true);
  c.tagIds=Array.isArray(c.tagIds)?c.tagIds.filter(id=>id!=='tag_red'):[];
  if(any)c.tagIds.push('tag_red');
  else{c.weeklyPart='';trackerRemoveDailyGoalKey(r.key||trackerCellKey(r.s.id,r.ch.id,r.f.id));}
  c.updatedAt=new Date().toISOString();
  return true;
}
function attemptControlRefs(key,itemId){
  const id=attemptKey(key,itemId);
  if(attemptSelection.has(id))return attemptRefs();
  const r=trackerResolveCellKey(key);if(!r)return [];
  const items=trackerCheckboxItems(r.cell),index=items.findIndex(x=>x.id===itemId);
  if(index<0)return [];
  if(trackerSelectedCells.has(key)){
    const refs=[];
    for(const selectedKey of trackerSelectedCells){
      const selected=trackerResolveCellKey(selectedKey);
      if(!selected||selected.f.type!=='checkbox')continue;
      const item=trackerCheckboxItems(selected.cell)[index];
      refs.push({...selected,item,index});
    }
    return refs;
  }
  return [{...r,item:items[index],index}];
}
function materializeAttempt(r){
  const checks=trackerCheckboxItems(r.cell);
  if(r.item)return checks.find(x=>x.id===r.item.id);
  if(!Number.isInteger(r.index)||r.index<0)return null;
  while(checks.length<=r.index)checks.push({id:uid('try'),label:String(checks.length+1),checked:false,comment:'',updatedAt:new Date().toISOString()});
  return checks[r.index];
}
function selectedWholeCells(key){
  return trackerSelectedCells.size>1&&trackerSelectedCells.has(key)?trackerSelectedRefs():[];
}
function setWholeCellWeekly(refs,on){
  const stamp=new Date().toISOString();
  for(const r of refs){
    const c=r.cell;
    c.tagIds=Array.isArray(c.tagIds)?c.tagIds.filter(id=>id!=='tag_red'):[];
    if(on)c.tagIds.push('tag_red');
    if(r.f.type==='checkbox'&&c.attemptWeeklyMode===true){
      for(const item of trackerCheckboxItems(c)){item.weeklySelected=!!on;item.updatedAt=stamp;}
    }
    if(!on){c.weeklyPart='';trackerRemoveDailyGoalKey(r.key||trackerCellKey(r.s.id,r.ch.id,r.f.id));}
    c.updatedAt=stamp;
  }
  if(refs.length)trackerSave(on?'Added selected cells to weekly':'Removed selected cells from weekly');
}
function deleteAttemptTargets(refs){
  const existing=refs.filter(r=>r.item&&trackerCheckboxItems(r.cell).some(x=>x.id===r.item.id));
  if(!existing.length||!confirm('Delete '+existing.length+' selected checkbox attempts?'))return;
  const byCell=new Map();
  for(const r of existing){if(!byCell.has(r.cell))byCell.set(r.cell,{ref:r,ids:new Set()});byCell.get(r.cell).ids.add(r.item.id);}
  for(const {ref,ids} of byCell.values()){
    const c=ref.cell;c.checks=trackerCheckboxItems(c).filter(x=>!ids.has(x.id));
    c.checks.forEach((x,i)=>{if(!x.label||/^\d+$/.test(x.label))x.label=String(i+1)});
    if(c.attemptWeeklyMode===true&&trackerCellIsWeekly(c)&&!c.checks.some(x=>x.weeklySelected===true)){
      c.tagIds=(c.tagIds||[]).filter(id=>id!=='tag_red');c.weeklyPart='';trackerRemoveDailyGoalKey(ref.key||trackerCellKey(ref.s.id,ref.ch.id,ref.f.id));
    }
    trackerSyncLegacyCheckbox(c);
  }
  trackerSave('Deleted selected checkbox attempts',true);
}
function applyWeeklyToAttempts(refs,on){
  let n=0;
  for(const r of refs)if(setAttemptWeekly(r,on))n++;
  if(n)trackerSave(on?'Added selected checkboxes to weekly':'Removed selected checkboxes from weekly');
}
function attachAttemptControls(box,attempt){
  if(attempt.querySelector('.dbt-attempt-tools'))return;
  const key=trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid);
  const r=trackerResolveCellKey(key);if(!r||r.f.type!=='checkbox')return;
  const item=trackerCheckboxItems(r.cell).find(x=>x.id===attempt.dataset.attemptId);if(!item)return;
  attempt.classList.toggle('dbt-attempt-weekly',attemptWeekly(r.cell,item));
  const tools=document.createElement('span');tools.className='dbt-attempt-tools';
  const weekly=document.createElement('button');weekly.type='button';weekly.className='dbt-attempt-w'+(attemptWeekly(r.cell,item)?' active':'');weekly.innerHTML='<i aria-hidden="true"></i><span>W</span>';
  weekly.title=attemptWeekly(r.cell,item)?'Remove this checkbox from weekly':'Add this checkbox to weekly';
  weekly.setAttribute('aria-pressed',String(attemptWeekly(r.cell,item)));
  weekly.onclick=e=>{e.preventDefault();e.stopPropagation();const on=!attemptWeekly(r.cell,item),whole=selectedWholeCells(key);if(whole.length)setWholeCellWeekly(whole,on);else applyWeeklyToAttempts(attemptControlRefs(key,item.id),on)};
  const cal=document.createElement('button');cal.type='button';cal.className='dbt-attempt-calendar';
  cal.textContent='▦';cal.setAttribute('aria-label','Edit checkbox highlight date');cal.title='Highlight date: '+(highlights.attemptDateState(r.f,r.cell).dates[trackerCheckboxItems(r.cell).indexOf(item)]||'None');
  cal.onclick=e=>{e.preventDefault();e.stopPropagation();if(selectedWholeCells(key).length)trackerOpenChapterHighlightDate(key,cal);else openAttemptHighlight(cal,attemptControlRefs(key,item.id))};
  tools.append(weekly,cal);attempt.appendChild(tools);
  box.classList.add('dbt-attempt-compact');
}
function attachCompactControls(root,weeklyOnly=false){
  if(!root)return;
  root.querySelectorAll('.cell-box.multi-check[data-fid]').forEach(box=>{
    const r=trackerResolveCellKey(trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid));if(!r)return;
    let attempts=[...box.querySelectorAll('.check-attempt')];
    if(weeklyOnly){
      const checks=trackerCheckboxItems(r.cell);
      // Remove only rendered siblings, never saved records. Legacy whole-cell
      // weekly tags and merged legacy cards still display their original attempts.
      if(r.cell.attemptWeeklyMode===true){
        attempts=attempts.filter(attempt=>{
          const item=checks.find(x=>x.id===attempt.dataset.attemptId);
          if(item&&attemptWeekly(r.cell,item))return true;
          attempt.remove();return false;
        });
      }
      box.querySelectorAll('.dbt-date-pending,.add-check').forEach(el=>el.remove());
      const card=box.closest('.week-task-card'),label=card?.querySelector('.week-task-label');
      if(label&&checks.length>1&&attempts.length<checks.length&&attempts.length){
        const numbers=attempts.map(attempt=>checks.findIndex(x=>x.id===attempt.dataset.attemptId)+1);
        const badge=document.createElement('span');badge.className='dbt-week-attempt-numbers';badge.textContent=' · '+numbers.join(', ');
        label.appendChild(badge);
      }
    }
    box.classList.toggle('dbt-empty-check',attempts.length===0);
    // The compact attempt layout hides the original weekly tools. Move the
    // existing portion button out of that hidden wrapper, retaining its handler.
    if(!weeklyOnly){
      const part=box.querySelector('[data-week-part-inline]');
      if(part&&trackerCellIsWeekly(r.cell)&&!box.classList.contains('dbt-empty-check')){
        part.classList.add('dbt-week-portion-restored');part.disabled=false;box.appendChild(part);
      }
    }
    box.classList.toggle('dbt-empty-weekly',attempts.length===0&&trackerCellIsWeekly(r.cell));
    attempts.forEach(attempt=>attachAttemptControls(box,attempt));
  });
}
const originalAttemptPrint=trackerWeeklyPrintTaskText;
trackerWeeklyPrintTaskText=function(r){
  if((trackerPdfSourceMode==='week'||trackerPdfSourceMode==='day')&&r.f.type==='checkbox'){
    if(Array.isArray(r.mergedMembers)&&r.mergedMembers.length>1)return r.mergedMembers.map(m=>trackerWeeklyPrintTaskText({...m,mergedMembers:undefined})).join(' + ');
    if(r.cell.attemptWeeklyMode===true&&trackerCellIsWeekly(r.cell)){
      const checks=trackerCheckboxItems(r.cell),selected=checks.map((item,i)=>({item,i})).filter(x=>attemptWeekly(r.cell,x.item));
      if(selected.length)return selected.map(({item,i})=>(item.checked?'✓ ':'□ ')+r.f.name+(checks.length>1?' '+(i+1):'')+trackerWeekPartSuffix(r.cell)).join(' / ');
    }
  }
  return originalAttemptPrint.apply(this,arguments);
};
// Keep a single compact command row; subjects retain their own tab strip.
function compactTopBar(){
  if(trackerWeekView)return;
  const command=document.querySelector('#tracker .tracker-commandbar'),week=command?.querySelector('.week-launchbar'),toolbar=command?.querySelector('.tracker-toolbar');
  if(!command||!week||!toolbar)return;
  let row=command.querySelector('.dbt-compact-command-row');
  if(!row){row=document.createElement('div');row.className='dbt-compact-command-row';command.appendChild(row);row.append(week,toolbar);}
  const legend=document.getElementById('dbtMainHighlightLegend');
  if(legend&&legend.parentElement!==row)row.insertBefore(legend,toolbar);
  if(trackerSearch.value)trackerSearch.value='';
  if(trackerFilter.value!=='all')trackerFilter.value='all';
  const select=document.getElementById('trackerSelectAllBtn');
  if(select&&!select.dataset.dbtCompactSelect){
    const b=document.createElement('button');b.type='button';b.className='btn dbt-top-attempt-select';b.textContent='All checkboxes';
    b.title='Select all visible checkbox attempts';
    b.onclick=()=>selectAttemptKeys([...new Set([...trackerTableHost.querySelectorAll('[data-dbt-attempt-key]')].map(el=>el.dataset.dbtAttemptKey))]);
    select.after(b);select.dataset.dbtCompactSelect='1';
  }
}

function installAttemptColumns(){
  const host=trackerTableHost,table=host.querySelector('table.tracker-table');
  if(!table)return;
  const filtered=table.classList.contains('dbt-hi-main-table'),counts=new Map(),visibleIndices=new Map(),boxes=[...table.querySelectorAll('.cell-box.multi-check[data-fid]')];
  // Date decoration has already resolved active dates, including merged groups.
  // Keep original attempt positions; remove only the nonmatching rendered nodes.
  const matchesAttempt=attempt=>!!attempt?.querySelector('[data-check-toggle].dbt-dated-check');
  boxes.forEach(box=>{
    const attempts=[...box.querySelectorAll('.check-stack > .check-attempt')],id=box.dataset.fid;
    counts.set(id,Math.max(counts.get(id)||1,attempts.length));
    if(filtered){
      if(!visibleIndices.has(id))visibleIndices.set(id,new Set());
      attempts.forEach((attempt,i)=>{if(matchesAttempt(attempt))visibleIndices.get(id).add(i);});
    }
  });
  const indicesFor=id=>filtered?[...(visibleIndices.get(id)||[])].sort((a,b)=>a-b):Array.from({length:counts.get(id)||1},(_,i)=>i);
  table.querySelectorAll('thead th .dbt-attempt-head').forEach(el=>el.remove());
  table.querySelectorAll('thead th').forEach(th=>{
    const head=th.querySelector('.field-head');
    const id=head?.querySelector('[data-edit-field]')?.dataset.editField||head?.querySelector('[data-hi-select-column]')?.dataset.hiSelectColumn;
    const indices=indicesFor(id),n=indices.length;
    if(!n||(!filtered&&n<2)||(filtered&&(counts.get(id)||1)<2))return;
    th.classList.add('dbt-attempt-parent');
    const sub=document.createElement('div');sub.className='dbt-attempt-head';sub.style.setProperty('--attempt-cols',n);
    for(const i of indices){
      const b=document.createElement('button');b.type='button';b.textContent=String(i+1);
      b.dataset.dbtField=id;b.dataset.dbtAttemptColumn=String(i);b.title='Select checkbox column '+(i+1);
      b.setAttribute('aria-label',head.textContent.trim()+' checkbox column '+(i+1));
      b.onclick=e=>{e.preventDefault();e.stopPropagation();selectAttemptKeys(columnAttemptKeys(id,i))};
      sub.appendChild(b);
    }
    th.appendChild(sub);
  });
  boxes.forEach(box=>{
    const indices=indicesFor(box.dataset.fid),n=indices.length,stack=box.querySelector('.check-stack');
    if(!stack||stack.querySelector('.dbt-attempt-lane'))return;
    const attempts=[...stack.querySelectorAll(':scope > .check-attempt')],add=stack.querySelector('.add-check');
    if(n>1)box.classList.add('dbt-attempt-split');stack.style.setProperty('--attempt-cols',Math.max(1,n));
    if(filtered){
      // Hide nonmatching siblings without renumbering or modifying saved attempts.
      attempts.forEach(attempt=>{if(!matchesAttempt(attempt))attempt.remove();});
      const date=highlights.filterDate(),today=trackerLocalDateKey();
      stack.querySelectorAll('.dbt-date-pending').forEach(el=>{const d=el.dataset.dbtHighlightDate;if(!d||d<today||(date&&d!==date))el.remove();});
      // A generic add would create an unhighlighted task in this filtered view.
      if(add)add.hidden=true;
    }
    const key=trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid);
    for(const i of indices){
      const lane=document.createElement('div');lane.className='dbt-attempt-lane';
      const attempt=attempts[i];
      if(attempt&&(!filtered||matchesAttempt(attempt))){
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
            if(attemptSelection.has(k)||trackerSelectedCells.has(key)){e.stopPropagation();applyAttemptEdit({checked:toggle.checked},attemptControlRefs(key,attempt.dataset.attemptId));}
            else {if(attemptSelection.size){attemptSelection.clear();updateAttemptSelection()}if(original)original.call(toggle,e);}
          };
        }
        attempt.querySelectorAll('[data-check-edit],[data-check-comment]').forEach(b=>{
          const original=b.onclick;b.onclick=e=>{
            if(attemptSelection.has(k)||trackerSelectedCells.has(key)){e.preventDefault();e.stopPropagation();openAttemptBulk(attemptControlRefs(key,attempt.dataset.attemptId));}
            else if(original)original.call(b,e);
          };
        });
        const del=attempt.querySelector('[data-check-delete]');
        if(del){const original=del.onclick;del.onclick=e=>{
          if(attemptSelection.has(k)||selectedWholeCells(key).length){e.preventDefault();e.stopPropagation();deleteAttemptTargets(attemptControlRefs(key,attempt.dataset.attemptId));}
          else if(original)original.call(del,e);
        };}
        lane.appendChild(attempt);
      }else{lane.classList.add('dbt-attempt-missing');lane.setAttribute('aria-hidden','true');}
      stack.insertBefore(lane,add||null);
    }
    if(add){const original=add.onclick;add.onclick=e=>{
      const selected=attemptRefs();
      if(selected.some(r=>r.key===key)){
        e.preventDefault();e.stopPropagation();
        const unique=new Map(selected.map(r=>[r.key,r]));
        for(const r of unique.values()){const checks=trackerCheckboxItems(r.cell);checks.push({id:uid('try'),label:String(checks.length+1),checked:false,comment:'',updatedAt:new Date().toISOString()});trackerSyncLegacyCheckbox(r.cell);}
        trackerSave('Checkbox added to selected cells');
      }else if(original)original.call(add,e);
    };}
    // Keep existing add-attempt and calendar/weekly controls at parent-cell level.
  });
  if(!host.querySelector('.dbt-attempt-bulk')){
    const bar=document.createElement('div');bar.className='dbt-attempt-bulk';bar.hidden=true;
    bar.innerHTML='<button type="button" class="btn" data-attempt-select-all>Select all checkboxes</button><span class="dbt-attempt-count"></span><button type="button" class="btn" data-attempt-highlight>📅 Highlight selected</button><button type="button" class="btn primary" data-attempt-edit>Edit selected</button><button type="button" class="btn" data-attempt-check>✓ Check</button><button type="button" class="btn" data-attempt-uncheck>○ Uncheck</button><button type="button" class="btn" data-attempt-week>W Add weekly</button><button type="button" class="btn" data-attempt-unweek>Remove weekly</button><button type="button" class="btn" data-attempt-clear>Clear selection</button>';
    bar.querySelector('[data-attempt-select-all]').onclick=()=>selectAttemptKeys([...new Set([...host.querySelectorAll('[data-dbt-attempt-key]')].map(el=>el.dataset.dbtAttemptKey))]);
    const calendar=bar.querySelector('[data-attempt-highlight]');calendar.onclick=()=>openAttemptHighlight(calendar);
    bar.querySelector('[data-attempt-edit]').onclick=openAttemptBulk;
    bar.querySelector('[data-attempt-check]').onclick=()=>applyAttemptEdit({checked:true});
    bar.querySelector('[data-attempt-uncheck]').onclick=()=>applyAttemptEdit({checked:false});
    bar.querySelector('[data-attempt-week]').onclick=()=>applyWeeklyToAttempts(attemptRefs(),true);
    bar.querySelector('[data-attempt-unweek]').onclick=()=>applyWeeklyToAttempts(attemptRefs(),false);
    bar.querySelector('[data-attempt-clear]').onclick=()=>{attemptSelection.clear();updateAttemptSelection()};
    const wrap=table.closest('.dbt-hi-main-table-wrap')||table;
    wrap.before(bar);
  }
  attachCompactControls(host);
  attachCompactControls(trackerMobileHost);
  updateAttemptSelection();
}
document.addEventListener('pointerup',()=>{attemptDrag=false});
document.addEventListener('pointercancel',()=>{attemptDrag=false});
function visibleSelectionKey(key){
  const r=trackerResolveCellKey(key);if(!r)return key;
  const group=highlightedMerges(r.s,r.ch).find(g=>g.members.includes(r.f.id));
  return group?trackerCellKey(r.s.id,r.ch.id,group.anchor):key;
}
const baseSelectColumn=trackerSelectColumn;
trackerSelectColumn=function(s,f,additive){
  if(trackerWeekView)return baseSelectColumn.apply(this,arguments);
  const keys=[...new Set(trackerFilteredChapters(s).map(ch=>visibleSelectionKey(trackerCellKey(s.id,ch.id,f.id))))];
  const all=keys.length>0&&keys.every(k=>trackerSelectedCells.has(k));
  keys.forEach(k=>all?trackerSelectedCells.delete(k):trackerSelectedCells.add(k));
  trackerUpdateSelectionUI();trackerToastMsg((all?'Deselected column: ':'Selected column: ')+f.name);
};
const baseSelectAll=trackerSelectAllVisible;
trackerSelectAllVisible=function(){
  if(trackerPath()===PATH){trackerSelectedCells.clear();highlightedVisibleKeys().forEach(k=>trackerSelectedCells.add(k));trackerUpdateSelectionUI();return;}
  return baseSelectAll.apply(this,arguments);
};
if(typeof trackerSelectAllBtn!=='undefined')trackerSelectAllBtn.onclick=trackerSelectAllVisible;
const beforeAttemptSelection=trackerUpdateSelectionUI;
trackerUpdateSelectionUI=function(){
  if(!trackerWeekView||trackerPath()===PATH){
    const keys=[...trackerSelectedCells].map(visibleSelectionKey);
    trackerSelectedCells.clear();keys.forEach(k=>trackerSelectedCells.add(k));
  }
  const result=beforeAttemptSelection.apply(this,arguments);
  if(trackerSelectedCells.size&&attemptSelection.size){attemptSelection.clear();updateAttemptSelection()}
  return result;
};
const beforeAttemptClear=trackerClearSelection;
trackerClearSelection=function(){attemptSelection.clear();const r=beforeAttemptClear.apply(this,arguments);updateAttemptSelection();return r};
// Escape clears both independent selection sets, including after a checkbox click.
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||e.defaultPrevented||(!attemptSelection.size&&!trackerSelectedCells.size))return;
  if(typeof trackerModalBackdrop!=='undefined'&&trackerModalBackdrop.classList.contains('open'))return;
  const target=e.target,tag=target?.tagName?.toLowerCase();
  if(target?.isContentEditable||tag==='textarea'||tag==='select'||(tag==='input'&&!['checkbox','radio','button'].includes(target.type)))return;
  e.preventDefault();e.stopImmediatePropagation();attemptDrag=false;
  if(typeof trackerFinishDragSelection==='function')trackerFinishDragSelection();
  trackerClearSelection();
},true);
const bindBeforeWeeklySelection=bindTrackerCells;
bindTrackerCells=function(root){
  const result=bindBeforeWeeklySelection.apply(this,arguments);
  root.querySelectorAll('.cell-box[data-sid][data-cid][data-fid]').forEach(box=>{
    const key=trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid),r=trackerResolveCellKey(key);if(!r)return;
    const toggle=box.querySelector('[data-week-toggle]');
    if(toggle)toggle.onchange=e=>{e.stopPropagation();const refs=selectedWholeCells(key);setWholeCellWeekly(refs.length?refs:[r],toggle.checked);};
    const inline=box.querySelector('[data-cell-inline]');
    if(inline){
      // The original editor persists the selected values. Mirror them in the
      // visible inputs immediately instead of waiting for a future rerender.
      const mirror=()=>{
        if(!trackerSelectedCells.has(key))return;
        const keys=new Set(trackerCompatibleMutationRefs(r.s,r.ch,r.f).map(x=>x.key));
        document.querySelectorAll('.cell-box[data-sid][data-cid][data-fid]').forEach(other=>{
          if(other===box||!keys.has(trackerCellKey(other.dataset.sid,other.dataset.cid,other.dataset.fid)))return;
          const input=other.querySelector('[data-cell-inline]');if(input&&input.value!==inline.value)input.value=inline.value;
        });
      };
      inline.addEventListener('input',mirror);inline.addEventListener('change',mirror);
    }
    const part=box.querySelector('[data-week-part-inline]');
    if(part){part.onclick=e=>{
      const whole=selectedWholeCells(key);
      const refs=(whole.length?whole:[r]).filter(x=>trackerCellIsWeekly(x.cell));
      e.preventDefault();e.stopPropagation();if(part.disabled||!refs.length)return;
      const values=['','1','1/2','1/3','2/3','1/4','2/4','3/4'];
      const current=typeof r.cell.weeklyPart==='string'?r.cell.weeklyPart:'';
      trackerShowCellPopover(part,'<div class="cell-pop-title">Weekly part · '+(refs.length===1?esc(r.ch.name)+' • '+esc(r.f.name):refs.length+' selected cells')+'</div><div class="week-part-grid">'+values.map(v=>'<button type="button" class="week-part-option '+(current===v?'active':'')+'" data-week-part-value="'+esc(v)+'">'+esc(v||'None')+'</button>').join('')+'</div>');
      trackerCellPopover.querySelectorAll('[data-week-part-value]').forEach(b=>b.onclick=ev=>{
        ev.stopPropagation();const value=b.dataset.weekPartValue||'',stamp=new Date().toISOString();
        refs.forEach(x=>{x.cell.weeklyPart=value;x.cell.updatedAt=stamp;});trackerCloseCellPopover();trackerSave('Weekly part changed for selected cells');
      });
    };}
  });
  return result;
};
const beforeTagMutationRefs=trackerTagMutationRefs;
trackerTagMutationRefs=function(s,ch,f,tagId){
  const key=trackerCellKey(s.id,ch.id,f.id);
  if(trackerSelectedCells.has(key))return trackerSelectedRefs();
  return beforeTagMutationRefs.apply(this,arguments);
};
const beforeTagsPopover=trackerShowTagsPopover;
trackerShowTagsPopover=function(anchor,s,ch,f){
  const result=beforeTagsPopover.apply(this,arguments),cell=trackerGetCell(s.id,ch.id,f.id);
  const red=trackerCellPopover.querySelector('[data-pop-tag="tag_red"]');
  if(red)red.onclick=e=>{
    e.stopPropagation();const refs=trackerMutationRefs(s,ch,f),on=!trackerCellIsWeekly(cell);
    trackerCloseCellPopover();setWholeCellWeekly(refs,on);
  };
  const clear=trackerCellPopover.querySelector('[data-pop-clear-tags]');
  if(clear)clear.onclick=e=>{
    e.stopPropagation();const refs=trackerMutationRefs(s,ch,f),stamp=new Date().toISOString();
    refs.forEach(r=>{const c=r.cell;c.tagIds=[];c.weeklyPart='';if(r.f.type==='checkbox'&&c.attemptWeeklyMode===true)trackerCheckboxItems(c).forEach(item=>{item.weeklySelected=false;item.updatedAt=stamp;});trackerRemoveDailyGoalKey(r.key);c.updatedAt=stamp;});
    trackerCloseCellPopover();trackerSave('Cell tags cleared');
  };
  return result;
};
const beforeCellEditor=openCellEditorPopover;
openCellEditorPopover=function(anchor,s,ch,f,mode){
  const result=beforeCellEditor.apply(this,arguments),refs=trackerCompatibleMutationRefs(s,ch,f);
  if(refs.length<2)return result;
  const v=trackerCellPopover.querySelector('#popCellValue'),c=trackerCellPopover.querySelector('#popCellComment'),save=trackerCellPopover.querySelector('#popCellSave');
  if(!v||!c||!save)return result;
  const beforeV=v.value,beforeC=c.value.trim();
  save.onclick=e=>{
    e.stopPropagation();let setValue=v.value!==beforeV,setComment=c.value.trim()!==beforeC;
    if(!setValue&&!setComment){setComment=mode==='comment';setValue=!setComment;}
    const stamp=new Date().toISOString();
    refs.forEach(({cell})=>{if(setValue)cell.value=v.value;if(setComment)cell.comment=c.value.trim();cell.updatedAt=stamp;});
    trackerCloseCellPopover();trackerSave('Edited selected cells');
  };
  return result;
};
const beforeAttemptRows=renderTrackerRows;
renderTrackerRows=function(s){
  const r=beforeAttemptRows.apply(this,arguments);
  if(trackerTableHost.querySelector('table.tracker-table'))installAttemptColumns();
  if(!trackerWeekView)compactTopBar();
  return r;
};

const baseRender=renderThisWeekView;
renderThisWeekView=function(){
  if(trackerPath()===PATH){renderHighlighted();return;}
  const result=baseRender.apply(this,arguments);
  if(trackerPath()===TRACKER_WEEK_PATH){installAttemptColumns();attachCompactControls(trackerTableHost,true);}
  return result;
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
#tracker .dbt-attempt-bulk.dbt-no-attempt-selection>*:not([data-attempt-select-all]){display:none!important}
#tracker .dbt-attempt-bulk.dbt-no-attempt-selection{padding:2px 0;border:0;background:transparent}
#tracker .cell-box:not(.dbt-attempt-split) .dbt-attempt-lane{border:0;min-height:22px;flex:1 1 auto}
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
style.textContent+=`
/* One compact control row and no target buttons. */
#tracker .tracker-commandbar .tracker-tagbar,#tracker .tracker-toolbar .tracker-search,#tracker #trackerHighlightedPdfBtn,#tracker .cell-target-small,#tracker #trackerBulkTarget{display:none!important}
#tracker .dbt-compact-command-row{display:flex;align-items:center;flex-wrap:nowrap;gap:5px;min-width:0;width:100%;padding:2px 0}
#tracker .dbt-compact-command-row .week-launchbar{display:flex!important;flex:0 0 auto!important;flex-wrap:nowrap!important;justify-content:flex-start!important;gap:5px!important;width:auto!important;min-width:0!important;margin:0!important;padding:2px 4px!important;height:30px!important;min-height:30px!important}
#tracker .dbt-compact-command-row .week-date-wrap{flex:0 0 auto!important;gap:4px!important;white-space:nowrap}
#tracker .dbt-compact-command-row .week-launch-btn{height:25px!important;padding:0 6px!important;font-size:9px!important;margin:0!important}
#tracker .dbt-compact-command-row .tracker-toolbar{display:flex!important;flex:0 0 auto!important;flex-wrap:nowrap!important;min-width:0!important;width:auto!important;gap:3px!important;margin:0!important;padding:0!important;height:30px!important;min-height:30px!important}
#tracker .dbt-compact-command-row .tracker-tools{display:flex!important;flex-wrap:nowrap!important;gap:3px!important;align-items:center!important}
#tracker .dbt-compact-command-row .tracker-tools .btn,#tracker .dbt-compact-command-row .tracker-tools .icon-btn{height:25px!important;min-height:25px!important;padding:0 6px!important;font-size:9px!important;white-space:nowrap}
#tracker .dbt-compact-command-row #dbtMainHighlightLegend{flex:1 1 0!important;min-width:0!important;margin:0!important;overflow-x:auto;scrollbar-width:thin}
#tracker .dbt-compact-command-row .dbt-highlight-legend{flex-wrap:nowrap!important;gap:4px!important;padding:0!important}
#tracker .dbt-compact-command-row .dbt-highlight-legend-label{display:none!important}
#tracker .dbt-compact-command-row .dbt-highlight-legend-link{flex:none;font-size:9px!important;padding:3px 5px!important}
#tracker .dbt-compact-command-row .toolbar-cloud{max-width:100px;min-width:0}
#tracker .dbt-compact-command-row .tracker-tools{margin-left:auto}
@media(max-width:1100px){#tracker .dbt-compact-command-row{overflow-x:auto;scrollbar-width:thin}#tracker .dbt-compact-command-row #dbtMainHighlightLegend{flex:0 0 auto!important;max-width:220px}#tracker .dbt-compact-command-row .tracker-more-menu{position:fixed!important;right:8px;top:auto}}
#tracker .dbt-compact-command-row .tracker-more{flex:none}
#tracker .dbt-attempt-compact>.cell-week-tools,#tracker .dbt-attempt-compact>.cell-tags,#tracker .dbt-attempt-compact>[data-chapter-highlight],#tracker .dbt-attempt-compact>.dbt-date-stack{display:none!important}
#tracker .cell-box.dbt-attempt-compact{height:auto!important;min-height:30px!important;max-height:none!important;padding:1px 15px 1px 1px!important;overflow:visible!important}
#tracker .cell-box.dbt-attempt-compact .check-stack{min-height:26px!important;height:auto!important;padding:0!important;gap:0!important;align-items:center!important;overflow:visible!important}
#tracker .cell-box.dbt-attempt-compact .dbt-attempt-lane{min-height:26px!important;padding:0 1px!important}
#tracker .cell-box.dbt-attempt-compact .check-attempt{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:2px!important;padding:1px!important;white-space:nowrap}
#tracker .dbt-attempt-compact .check-attempt[hidden]{display:none!important}
#tracker .dbt-attempt-tools{display:inline-flex;align-items:center;gap:2px;flex:none}
#tracker .dbt-attempt-tools button{display:grid;place-items:center;flex:none;width:13px;height:15px;padding:0;border:1px solid rgba(150,165,185,.22);border-radius:3px;background:transparent;color:#929ca9;font-size:8px;font-weight:750;cursor:pointer;line-height:1}
#tracker .dbt-attempt-tools .dbt-attempt-w.active{background:rgba(255,86,114,.2);border-color:#d95b76;color:#ff8ba1}
#tracker .dbt-attempt-tools button:hover{border-color:#adb9c9;color:#fff}
#tracker .dbt-attempt-tools .dbt-attempt-calendar{font-size:12px}
#tracker .dbt-attempt-compact .check-stack>.add-check{position:absolute!important;right:2px!important;top:50%!important;transform:translateY(-50%)!important;width:12px!important;height:17px!important;min-width:0!important;margin:0!important;font-size:10px!important;grid-column:auto!important}
#tracker .dbt-attempt-compact .check-stack>.dbt-date-pending{grid-column:1/-1}
#tracker .tracker-table td:has(.dbt-attempt-compact){height:34px!important;min-height:34px!important;max-height:none!important;padding:1px 2px!important}
#tracker .tracker-table tr:has(.dbt-attempt-compact) td:first-child{height:34px!important;min-height:34px!important;max-height:none!important;padding-block:1px!important}
#tracker .tracker-table tr:has(.dbt-attempt-compact) .chapter-cell{min-height:30px!important}
#tracker .dbt-attempt-parent{min-height:34px!important;height:auto!important}
#tracker .dbt-attempt-head{min-height:18px!important}
#tracker .dbt-attempt-head button{padding:2px 0!important}
#tracker .dbt-attempt-split .check-stack{grid-template-columns:repeat(var(--attempt-cols),minmax(49px,1fr))!important}
#tracker .dbt-attempt-head{grid-template-columns:repeat(var(--attempt-cols),minmax(49px,1fr))!important}
#tracker .dbt-attempt-bulk.dbt-no-attempt-selection{display:none!important}
body.tracker-week-page #tracker .dbt-attempt-bulk.dbt-no-attempt-selection{display:flex!important}
#tracker .week-task-control>.week-task-highlight-date{display:none!important}
#tracker .dbt-hi-top{display:flex!important;flex-wrap:nowrap!important;gap:5px!important;min-height:30px!important;margin:0!important}
#tracker .dbt-hi-top .week-simple-title,#tracker .dbt-hi-top .week-simple-actions{flex-wrap:nowrap!important;white-space:nowrap}
#tracker .dbt-hi-toolbar-row{display:flex;align-items:center;gap:5px;flex-wrap:nowrap;min-width:0;overflow-x:auto;scrollbar-width:thin;margin-bottom:4px}
#tracker .dbt-hi-toolbar-row .dbt-hi-week-timer{flex:none;flex-wrap:nowrap!important;margin:0!important;min-height:30px!important;padding:2px 5px!important}
#tracker .dbt-hi-toolbar-row .dbt-hi-top{flex:none}
#tracker .dbt-hi-toolbar-row .dbt-highlight-legend{flex:none;flex-wrap:nowrap!important;margin:0!important;padding:0!important}
`;
style.textContent+=`
/* Keep compact rows readable; restore the original checkbox-style weekly tag. */
#tracker .tracker-table .chapter-name strong{font-size:14px!important;line-height:1.2!important}
#tracker .tracker-table .chapter-num{font-size:10px!important}
#tracker .tracker-table .field-head>span:not(.dbt-reorder-controls){font-size:12px!important}
#tracker .dbt-attempt-head button{font-size:11px!important}
#tracker .dbt-compact-command-row .week-launch-btn,#tracker .dbt-compact-command-row .tracker-tools .btn,#tracker .dbt-compact-command-row .dbt-highlight-legend-link{font-size:10px!important}
#tracker .dbt-attempt-tools{gap:3px!important}
#tracker .dbt-attempt-tools .dbt-attempt-w{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;width:26px!important;height:16px!important;padding:0 3px!important;border-radius:4px!important;background:#101317!important;border:1px solid rgba(255,255,255,.10)!important;color:#929ca9!important;font-size:8px!important;opacity:.8}
#tracker .dbt-attempt-w i{display:grid;place-items:center;width:8px;height:8px;flex:none;border:1px solid #4b535c;border-radius:2px;background:#090b0e}
#tracker .dbt-attempt-tools .dbt-attempt-w.active{background:#241014!important;border-color:rgba(255,107,120,.42)!important;color:#ff7886!important;opacity:1}
#tracker .dbt-attempt-w.active i{background:#ff6675;border-color:#ff6675}
#tracker .dbt-attempt-w.active i:after{content:"✓";color:#26080d;font-size:7px;font-weight:900;line-height:1}
#tracker .dbt-attempt-tools .dbt-attempt-w:hover,#tracker .dbt-attempt-tools .dbt-attempt-w:focus-visible{opacity:1;border-color:rgba(255,107,120,.6)!important}
#tracker .dbt-attempt-tools .dbt-attempt-calendar,#tracker .tracker-table .dbt-column-calendar{opacity:0!important;pointer-events:none!important}
#tracker .check-attempt:hover .dbt-attempt-calendar,#tracker .check-attempt:focus-within .dbt-attempt-calendar,#tracker .dbt-attempt-calendar:focus-visible,#tracker .tracker-table th:hover .dbt-column-calendar,#tracker .tracker-table th:focus-within .dbt-column-calendar,#tracker .dbt-column-calendar:focus-visible{opacity:1!important;pointer-events:auto!important}
#tracker .dbt-attempt-split .check-stack,#tracker .dbt-attempt-head{grid-template-columns:repeat(var(--attempt-cols),minmax(62px,1fr))!important}
@media(hover:none){#tracker .dbt-attempt-tools .dbt-attempt-calendar,#tracker .tracker-table .dbt-column-calendar{opacity:1!important;pointer-events:auto!important}}
`;
style.textContent+=`
/* Keep attempt checkboxes centered; reveal weekly and date controls without shifting them. */
#tracker .tracker-table .cell-box.dbt-attempt-compact{padding:1px 15px!important}
#tracker .tracker-table .dbt-attempt-head{padding-inline:15px!important;box-sizing:border-box}
#tracker .tracker-table .dbt-attempt-split .check-stack,#tracker .tracker-table .dbt-attempt-head{grid-template-columns:repeat(var(--attempt-cols),minmax(76px,1fr))!important}
#tracker .tracker-table .dbt-attempt-lane{min-width:76px!important;box-sizing:border-box}
#tracker .tracker-table .dbt-attempt-lane .check-attempt{position:relative!important;width:100%!important;min-width:0!important;justify-content:center!important;box-sizing:border-box}
#tracker .tracker-table .dbt-attempt-lane .dbt-attempt-tools{position:absolute!important;inset:0!important;display:block!important;pointer-events:none!important}
#tracker .tracker-table .dbt-attempt-lane .dbt-attempt-tools .dbt-attempt-w{position:absolute!important;left:1px!important;top:50%!important;transform:translateY(-50%)!important}
#tracker .tracker-table .dbt-attempt-lane .dbt-attempt-tools .dbt-attempt-calendar{position:absolute!important;right:1px!important;top:50%!important;transform:translateY(-50%)!important}
#tracker .dbt-attempt-tools .dbt-attempt-w{opacity:0!important;pointer-events:none!important}
#tracker .check-attempt:hover .dbt-attempt-w,#tracker .check-attempt:focus-within .dbt-attempt-w,#tracker .dbt-attempt-w:focus-visible,#tracker .dbt-attempt-lane:hover .dbt-attempt-w{opacity:1!important;pointer-events:auto!important}
@media(hover:none){#tracker .dbt-attempt-tools .dbt-attempt-w{opacity:1!important;pointer-events:auto!important}}
`;
style.textContent+=`
/* Empty checkbox cells use the same compact row geometry as populated cells.
   Leave the real add button and date-specific pending buttons functional. */
#tracker .tracker-table .cell-box.dbt-empty-check{display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;box-sizing:border-box!important;width:100%!important;height:30px!important;min-height:30px!important;max-height:none!important;padding:1px 15px!important;overflow:visible!important}
#tracker .tracker-table .cell-box.dbt-empty-check .check-stack{position:static!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;min-width:0!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:26px!important;gap:4px!important;padding:0!important;overflow:visible!important}
#tracker .tracker-table .dbt-empty-check .dbt-attempt-lane{display:none!important}
#tracker .tracker-table .dbt-empty-check .check-stack>.add-check{position:static!important;inset:auto!important;transform:none!important;display:grid!important;place-items:center!important;flex:0 0 auto!important;width:21px!important;height:21px!important;min-width:21px!important;margin:0!important;font-size:14px!important;opacity:.7!important;visibility:visible!important;pointer-events:auto!important}
#tracker .tracker-table .dbt-empty-check .check-stack>.add-check:hover,#tracker .tracker-table .dbt-empty-check .check-stack>.add-check:focus-visible{opacity:1!important}
#tracker .tracker-table .dbt-empty-check .check-stack>.dbt-date-pending{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-width:0!important;padding:0!important;gap:0!important}
#tracker .tracker-table .dbt-empty-check .check-stack>.dbt-date-pending .dbt-date-add-attempt{width:21px!important;height:21px!important}
#tracker .tracker-table .dbt-empty-check>.cell-week-tools{display:flex!important;position:absolute!important;left:3px!important;bottom:auto!important;top:50%!important;transform:translateY(-50%)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:4!important}
#tracker .tracker-table .dbt-empty-check>[data-chapter-highlight],#tracker .tracker-table .dbt-empty-check>.dbt-date-stack{display:inline-flex!important;position:absolute!important;right:3px!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:4!important}
#tracker .tracker-table .dbt-empty-check:hover>.cell-week-tools,#tracker .tracker-table .dbt-empty-check:focus-within>.cell-week-tools,#tracker .tracker-table .dbt-empty-check:hover>[data-chapter-highlight],#tracker .tracker-table .dbt-empty-check:focus-within>[data-chapter-highlight],#tracker .tracker-table .dbt-empty-check:hover>.dbt-date-stack,#tracker .tracker-table .dbt-empty-check:focus-within>.dbt-date-stack{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
#tracker .tracker-table td:has(>.dbt-empty-check){height:34px!important;min-height:34px!important;max-height:none!important;padding:1px 2px!important;vertical-align:middle!important}
#tracker .tracker-table tr:has(.dbt-empty-check) td:first-child{height:34px!important;min-height:34px!important;max-height:none!important;padding-block:1px!important}
#tracker .tracker-table tr:has(.dbt-empty-check) .chapter-cell{min-height:30px!important}
@media(hover:none){#tracker .tracker-table .dbt-empty-check>.cell-week-tools,#tracker .tracker-table .dbt-empty-check>[data-chapter-highlight],#tracker .tracker-table .dbt-empty-check>.dbt-date-stack{opacity:1!important;visibility:visible!important;pointer-events:auto!important}}
`;
style.textContent+=`
#tracker .dbt-hi-main-table .add-check[hidden]{display:none!important}
#tracker .dbt-hi-main-table .dbt-attempt-missing{visibility:hidden!important;pointer-events:none!important}
#tracker .dbt-hi-main-table .cell-box.dbt-empty-check .check-stack{min-height:26px!important}
`;
style.textContent+=`
#tracker .week-task-control .dbt-attempt-compact .check-stack{display:flex!important;justify-content:center!important;align-items:center!important;flex-wrap:nowrap!important;padding:0!important;gap:4px!important}
#tracker .week-task-control .cell-box.dbt-attempt-compact{padding:1px 3px!important;min-height:26px!important;max-width:none!important}
#tracker .dbt-week-attempt-numbers{font-size:inherit;opacity:.75;white-space:nowrap}
`;
style.textContent+=`
/* Keep the red weekly marker visible independently of hover controls. */
#tracker .check-attempt.dbt-attempt-weekly::before{content:'';position:absolute;left:calc(50% - 15px);top:50%;transform:translate(-50%,-50%);width:5px;height:5px;border-radius:50%;background:#ff6675;box-shadow:0 0 5px rgba(255,102,117,.55);pointer-events:none;z-index:2}
#tracker .cell-box.dbt-empty-weekly::before{content:'';position:absolute;left:7px;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:#ff6675;box-shadow:0 0 5px rgba(255,102,117,.55);pointer-events:none;z-index:2}
`;
style.textContent+=`
/* Weekly portion: compact, separate from hover-only attempt W controls. */
#tracker .cell-box.dbt-attempt-compact:has(>.dbt-week-portion-restored){padding-bottom:18px!important}
#tracker .cell-box>.dbt-week-portion-restored{display:block!important;position:absolute!important;left:50%!important;bottom:1px!important;top:auto!important;transform:translateX(-50%)!important;width:34px!important;height:15px!important;min-width:34px!important;z-index:5!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;color:#c9b46f!important;background:#15120b!important;border-color:rgba(242,199,102,.24)!important}
#tracker .cell-box>.dbt-week-portion-restored.has-part{background:#2a2110!important;color:#ffe397!important;border-color:rgba(242,199,102,.52)!important}
#tracker .cell-box>.dbt-week-portion-restored:hover{border-color:#e8d28f!important}
`;
style.textContent+=`
/* Distinguish the add control from numbered checkbox attempts. */
#tracker .dbt-attempt-head{position:relative!important;padding-right:22px!important;box-sizing:border-box!important}
#tracker .dbt-attempt-add-head{position:absolute!important;right:2px!important;top:50%!important;transform:translateY(-50%)!important;width:16px!important;height:16px!important;display:grid!important;place-items:center!important;border:1px dashed rgba(150,165,185,.42)!important;border-radius:4px!important;color:#aeb8c6!important;font-size:13px!important;font-weight:600!important;line-height:1!important;cursor:default!important}
#tracker .tracker-table .cell-box.dbt-attempt-compact .check-stack>.add-check{position:absolute!important;right:2px!important;top:50%!important;left:auto!important;transform:translateY(-50%)!important;width:16px!important;height:16px!important;min-width:16px!important;display:grid!important;place-items:center!important;border:1px dashed rgba(150,165,185,.42)!important;border-radius:4px!important;background:transparent!important;color:#c4cedb!important;font-size:13px!important;font-weight:600!important;line-height:1!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;padding:0!important}
#tracker .tracker-table .cell-box.dbt-attempt-compact .check-stack>.add-check:hover{border-color:#b7c6d8!important;color:#fff!important;background:rgba(255,255,255,.06)!important}
`;
style.textContent+=`
/* Keep the add control in its own narrow gutter, outside numbered attempt lanes. */
#tracker .dbt-attempt-head{box-sizing:border-box!important;padding-right:20px!important}
#tracker .cell-box.dbt-attempt-compact{padding:1px 0 1px 1px!important}
#tracker .cell-box.dbt-attempt-compact .check-stack{position:relative!important;box-sizing:border-box!important;padding-right:20px!important}
#tracker .cell-box.dbt-attempt-compact .check-stack>.add-check{right:1px!important;width:16px!important;height:16px!important;min-width:16px!important}
#tracker .dbt-attempt-add-head{display:none!important}
/* Weekly is a read-only list of selected work: no add-attempt controls or pseudo-columns. */
body.tracker-week-page #tracker .add-check,
body.tracker-week-page #tracker .dbt-date-add-attempt,
body.tracker-week-page #tracker .dbt-attempt-add-head,
#tracker .week-task-control .add-check,
#tracker .week-task-control .dbt-date-add-attempt{display:none!important}
body.tracker-week-page #tracker .dbt-attempt-head{padding-right:0!important}
body.tracker-week-page #tracker .cell-box.dbt-attempt-compact{padding-right:0!important}
body.tracker-week-page #tracker .cell-box.dbt-attempt-compact .check-stack{padding-right:0!important}
`;
style.textContent+=`
/* Exact shared geometry: header numbers sit on the same grid tracks as checkbox lanes. */
#tracker .tracker-table th.dbt-attempt-parent,
#tracker .tracker-table td:has(.dbt-attempt-split){padding-left:0!important;padding-right:0!important}
#tracker .tracker-table .dbt-attempt-head{
  display:grid!important;
  grid-template-columns:repeat(var(--attempt-cols),minmax(32px,1fr))!important;
  width:100%!important;max-width:100%!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;
}
#tracker .tracker-table .dbt-attempt-split .check-stack{
  display:grid!important;
  grid-template-columns:repeat(var(--attempt-cols),minmax(32px,1fr))!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  margin:0!important;padding:0!important;gap:0!important;box-sizing:border-box!important;
}
#tracker .tracker-table .dbt-attempt-lane{width:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important}
#tracker .tracker-table .dbt-attempt-head button{width:100%!important;min-width:0!important;text-align:center!important;box-sizing:border-box!important}
/* Weekly is read-only: hide add controls with enough specificity to override compact-cell styles. */
body.tracker-week-page #tracker .tracker-table .cell-box.dbt-attempt-compact .check-stack>.add-check,
body.tracker-week-page #tracker .tracker-table .cell-box.dbt-attempt-compact .check-stack>.dbt-date-pending,
body.tracker-week-page #tracker .week-task-control .cell-box .check-stack>.add-check,
body.tracker-week-page #tracker .week-task-control .cell-box .check-stack>.dbt-date-pending{display:none!important}
`;
document.head.appendChild(style);
addLaunch();
if(trackerPath()===PATH){trackerWeekView=true;document.body.classList.add('tracker-week-page');renderTracker();}
else if(!trackerWeekView){compactTopBar();renderTrackerRows(trackerSubject());}
else if(trackerPath()===TRACKER_WEEK_PATH)renderThisWeekView();
})();