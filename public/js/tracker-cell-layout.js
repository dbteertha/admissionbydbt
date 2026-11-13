/* DBT Tracker cell-level highlight exclusions and lossless horizontal merges.
   Layout metadata is kept on the anchor cell and synced with its updatedAt.
   Underlying cells, checks, comments, targets, and history are never combined or deleted. */
(()=>{
'use strict';
if(typeof trackerGetCell!=='function'||typeof renderTrackerRows!=='function')return;
const currentColumnActive=trackerFieldHighlightActive;
// A cell-specific highlight date never changes other cells. Legacy column
// highlights remain supported unless the user explicitly selects cell-only mode.
function validDate(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T00:00:00'))}
function datesFor(f,c){
 if(c?.highlightExcluded===true)return [];
 const own=[...new Set([...(Array.isArray(c?.highlightDates)?c.highlightDates:[]),c?.chapterHighlightUntil].filter(validDate))].sort();
 if(own.length)return own;
 return f?.highlightScope!=='individual'&&validDate(f?.highlightUntil)?[f.highlightUntil]:[];
}
function putDates(c,ds){
 c.highlightDates=[...new Set(ds.filter(validDate))].sort();
 c.chapterHighlightUntil=c.highlightDates.at(-1)||'';
 c.highlightExcluded=!c.highlightDates.length;
 c.updatedAt=new Date().toISOString();
}
function hue(d){return ((Math.round(Date.parse(d+'T00:00:00Z')/86400000)*137.508)%360+360)%360}
function short(d){return new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function dateLabels(ds){return ds.slice(0,2).map(d=>esc(short(d))).join(' · ')+(ds.length>2?' +'+(ds.length-2):'')}
trackerTaskHighlightDate=function(f,c){return datesFor(f,c).at(-1)||''};
trackerFieldHighlightActive=function(f){return !!(f&&f.highlightScope!=='individual'&&currentColumnActive(f))};
trackerTaskHighlightBadge=function(s,ch,f,c){
 const key=trackerCellKey(s.id,ch.id,f.id),ds=datesFor(f,c);
 return '<button type="button" class="week-task-highlight-date dbt-multi-date'+(f.type==='checkbox'||!ds.length?' dbt-highlight-icon':'')+'" data-chapter-highlight="'+esc(key)+'" title="'+esc(ds.join(', ')||'Set highlight dates')+'" aria-label="Edit highlight dates">📅'+(f.type==='checkbox'||!ds.length?'':' '+dateLabels(ds))+'</button>';
};
trackerOpenChapterHighlightDate=function(key){
 const ref=trackerResolveCellKey(key);if(!ref)return;
 const {ch,f,cell}=ref;
 const anchors=[...document.querySelectorAll('[data-chapter-highlight],[data-dbt-edit-date]')].filter(el=>el.dataset.chapterHighlight===key||el.dataset.dbtEditDate===key);
 const anchor=anchors.find(el=>el===document.activeElement||el.matches(':hover'))||anchors[0];if(!anchor)return;
 let draft=datesFor(f,cell).slice(),pending=!draft.length;
 trackerShowCellPopover(anchor,'<div class="cell-pop-title">'+esc(ch.name)+' · '+esc(f.name)+'</div>'+
 '<div class="dbt-date-pop-body"><div id="dbtDatesList"></div><label class="dbt-date-pop-label">Date <input id="dbtCellHighlightDate" type="date" value="'+esc(draft.at(-1)||trackerLocalDateKey())+'"></label>'+
 '<div class="dbt-date-pop-actions dbt-date-pop-actions-wrap"><button type="button" class="cell-pop-btn" id="dbtDateAdd">+ Add date</button><button type="button" class="cell-pop-btn" id="dbtDateClear">Clear</button><button type="button" class="cell-pop-btn" id="dbtDateCancel">Cancel</button><button type="button" class="cell-pop-btn primary" id="dbtDateSave">Save</button><button type="button" class="cell-pop-btn" id="dbtDateColumn">Whole column</button></div></div>');
 const q=x=>trackerCellPopover.querySelector(x),input=q('#dbtCellHighlightDate'),list=q('#dbtDatesList');
 function redraw(){
  list.innerHTML=draft.map(d=>'<div class="dbt-date-entry"><span>'+esc(short(d))+'</span><button type="button" class="cell-pop-btn" data-remove-date="'+esc(d)+'" aria-label="Remove '+esc(d)+'">×</button></div>').join('');
  list.querySelectorAll('[data-remove-date]').forEach(b=>b.onclick=()=>{draft=draft.filter(d=>d!==b.dataset.removeDate);pending=false;redraw()});
 }
 function add(){if(!validDate(input.value)){trackerToastMsg('Choose a valid date');return false}draft=[...new Set([...draft,input.value])].sort();pending=false;redraw();return true}
 q('#dbtDateAdd').onclick=add;
 q('#dbtDateCancel').onclick=()=>trackerCloseCellPopover();
 q('#dbtDateClear').onclick=()=>{draft=[];pending=false;redraw()};
 q('#dbtDateSave').onclick=()=>{
  if(pending&&!add())return;
  putDates(cell,draft);trackerCloseCellPopover();trackerSave('Cell highlight dates changed');
 };
 input.onchange=()=>{pending=true};
 q('#dbtDateColumn').onclick=()=>{
  if(!validDate(input.value)){trackerToastMsg('Choose a valid date');return}
  const hadOwn=cell.highlightExcluded===true||validDate(cell.chapterHighlightUntil)||(Array.isArray(cell.highlightDates)&&cell.highlightDates.length>0);
  if(hadOwn)putDates(cell,[...datesFor(f,cell),input.value]);
  f.highlightUntil=input.value;f.highlightScope='column';f.updatedAt=new Date().toISOString();
  trackerCloseCellPopover();trackerSave('Column highlight changed');
 };
 redraw();
};
// Present dates in chronological attempt order; never mutate data during rendering.
function attemptDateSlots(r,td){
  const refs=[r];
  if(td?.colSpan>1){
    const group=groups(r.s,r.ch).find(g=>g.anchor===r.f.id);
    if(group)for(const id of group.fields.slice(1)){
      const f=r.s.fields.find(x=>x.id===id);
      if(f)refs.push({s:r.s,ch:r.ch,f,cell:trackerGetCell(r.s.id,r.ch.id,id),key:trackerCellKey(r.s.id,r.ch.id,id)});
    }
  }
  const byDate=new Map();
  for(const ref of refs)for(const date of datesFor(ref.f,ref.cell)){
    if(!byDate.has(date))byDate.set(date,{date,ref});
  }
  return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function appendAttemptDate(parent,slot){
  const label=document.createElement('button');
  label.type='button';label.className='dbt-attempt-date';
  label.textContent=short(slot.date);
  label.title=slot.ref.f.name+' · '+slot.date+' — edit dates';
  label.setAttribute('aria-label','Edit '+slot.ref.f.name+' highlight date '+slot.date);
  label.dataset.dbtEditDate=slot.ref.key;
  label.onclick=e=>{e.preventDefault();e.stopPropagation();trackerOpenChapterHighlightDate(slot.ref.key)};
  parent.appendChild(label);
}
function addAttemptForDate(r,index){
  const checks=trackerCheckboxItems(r.cell);
  while(checks.length<=index)checks.push({
    id:uid('try'),label:String(checks.length+1),checked:false,comment:'',updatedAt:new Date().toISOString()
  });
  trackerSyncLegacyCheckbox(r.cell);
  trackerSave('Checkbox added for highlight date');
}
function decorateDates(root){
  if(!root)return;
  // Retire the old full-cell and column-header highlight styles.
  root.querySelectorAll('.field-date-highlight-head,.field-date-highlight-cell,.dbt-date-colored').forEach(el=>{
    el.classList.remove('field-date-highlight-head','field-date-highlight-cell','dbt-date-colored');
    el.style.removeProperty('--dbt-date-fill');
  });
  root.querySelectorAll('.cell-box[data-sid][data-cid][data-fid]').forEach(box=>{
    const r=trackerResolveCellKey(trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid));
    if(!r)return;
    const td=box.closest('td')||box.closest('.mobile-field');
    const stack=box.querySelector('.check-stack');
    const slots=attemptDateSlots(r,td);
    if(stack){
      // A merged surface uses the visible anchor's attempts, with all unique
      // dates from its covered members. Date editors still target their source.
      const has=slots.length>0;
      box.classList.toggle('dbt-dated-attempts',has);
      if(td)td.classList.toggle('dbt-has-attempt-dates',has);
      stack.querySelectorAll('.dbt-date-pending,.dbt-attempt-date').forEach(el=>el.remove());
      const attempts=[...stack.querySelectorAll('.check-attempt')];
      attempts.forEach((attempt,i)=>{
        const check=attempt.querySelector('[data-check-toggle]');
        if(!check)return;
        check.classList.remove('dbt-dated-check');
        check.style.removeProperty('--dbt-check-color');
        check.style.removeProperty('--dbt-check-tint');
        if(check.dataset.dbtHighlightDate){
          check.removeAttribute('title');check.removeAttribute('aria-label');delete check.dataset.dbtHighlightDate;
        }
        const slot=slots[i];
        attempt.classList.toggle('dbt-attempt-slot',has);
        if(!slot)return;
        check.dataset.dbtHighlightDate=slot.date;
        check.title='Attempt '+(i+1)+' · '+slot.date;
        check.setAttribute('aria-label','Attempt '+(i+1)+', '+slot.date);
        if(slot.date>=trackerLocalDateKey()){
          const h=hue(slot.date);
          check.classList.add('dbt-dated-check');
          check.style.setProperty('--dbt-check-color','hsl('+h+' 72% 65%)');
          check.style.setProperty('--dbt-check-tint','hsl('+h+' 58% 25%)');
        }
        appendAttemptDate(attempt,slot);
      });
      // Existing dates without attempts remain visible. Only an explicit click
      // creates real unchecked attempts, avoiding a silent change to progress.
      slots.slice(attempts.length).forEach((slot,j)=>{
        const index=attempts.length+j,wrap=document.createElement('div');
        wrap.className='dbt-date-pending dbt-attempt-slot';
        const plus=document.createElement('button');
        plus.type='button';plus.className='dbt-date-add-attempt';plus.textContent='+';
        plus.title='Add missing checkboxes through '+slot.date;
        plus.setAttribute('aria-label','Add checkbox for '+slot.date);
        plus.onclick=e=>{e.preventDefault();e.stopPropagation();addAttemptForDate(r,index)};
        wrap.appendChild(plus);appendAttemptDate(wrap,slot);
        const add=stack.querySelector('.add-check');
        if(add)stack.insertBefore(wrap,add);else stack.appendChild(wrap);
      });
    }
    if(td?.colSpan>1){
      const group=groups(r.s,r.ch).find(g=>g.anchor===r.f.id);
      if(group)for(const id of group.fields.slice(1)){
        const f=r.s.fields.find(x=>x.id===id);if(!f)continue;
        const key=trackerCellKey(r.s.id,r.ch.id,id),member=trackerGetCell(r.s.id,r.ch.id,id);
        if(!datesFor(f,member).length)continue;
        if(![...box.querySelectorAll('[data-chapter-highlight]')].some(b=>b.dataset.chapterHighlight===key)){
          const b=document.createElement('button');b.type='button';b.className='week-task-highlight-date dbt-multi-date';
          b.dataset.chapterHighlight=key;box.appendChild(b);
        }
      }
      const badges=[...box.querySelectorAll('[data-chapter-highlight]')];
      if(badges.length>1&&!box.querySelector('.dbt-date-stack')){
        const group=document.createElement('div');group.className='dbt-date-stack';
        box.appendChild(group);badges.forEach(b=>group.appendChild(b));
      }
    }
  });
  // Checkbox cells use a calendar icon, with their dates below the attempts.
  // Non-checkbox cells retain a neutral short-date label.
  root.querySelectorAll('button[data-chapter-highlight]').forEach(b=>{
    const ref=trackerResolveCellKey(b.dataset.chapterHighlight);if(!ref)return;
    const dates=datesFor(ref.f,ref.cell),iconOnly=ref.f.type==='checkbox'||!!b.closest('.multi-check');
    b.innerHTML='📅'+(!iconOnly&&dates.length?' '+dateLabels(dates):'');
    b.title=ref.f.name+' · '+(dates.join(', ')||'Set highlight dates');
    b.setAttribute('aria-label','Edit '+ref.f.name+' highlight dates');
    b.classList.add('dbt-multi-date');b.classList.toggle('dbt-highlight-icon',iconOnly||!dates.length);
    b.onclick=e=>{e.preventDefault();e.stopPropagation();trackerOpenChapterHighlightDate(b.dataset.chapterHighlight)};
  });
}
const baseBind=bindTrackerCells;
bindTrackerCells=function(root){const out=baseBind.apply(this,arguments);decorateDates(root);return out};
const isWeek=()=>!!trackerWeekView;
function fields(s){return trackerVisibleFields(s)}
function parseSelection(){
  if(isWeek())return {error:'Open a subject on the main Tracker first.'};
  const refs=trackerSelectedRefs();
  if(refs.length<2)return {error:'Select at least two neighboring cells in one row.'};
  const sid=refs[0].s.id,cid=refs[0].ch.id;
  if(refs.some(r=>r.s.id!==sid||r.ch.id!==cid))return {error:'Only cells in the same chapter row can be merged.'};
  const s=refs[0].s,order=fields(s).map(f=>f.id);
  const idx=refs.map(r=>order.indexOf(r.f.id)).sort((a,b)=>a-b);
  if(idx.some(i=>i<0)||idx[idx.length-1]-idx[0]+1!==idx.length||new Set(idx).size!==idx.length)
    return {error:'Select consecutive, side-by-side cells without gaps.'};
  return {s,ch:refs[0].ch,fieldIds:idx.map(i=>order[i])};
}
function groups(s,ch){
  const visible=fields(s).map(f=>f.id);
  const used=new Set(),result=[];
  for(const id of visible){
    const cell=trackerGetCell(s.id,ch.id,id);
    const entries=Array.isArray(cell.mergedWith)?cell.mergedWith:[];
    if(!entries.length||used.has(id))continue;
    const members=[id,...entries].filter(x=>visible.includes(x));
    const pos=members.map(x=>visible.indexOf(x));
    // Invalid or stale metadata must not hide anything.
    if(members.length<2||new Set(members).size!==members.length||
      pos.some((v,i)=>v!==visible.indexOf(id)+i)||members.some(x=>used.has(x)))continue;
    result.push({anchor:id,fields:members});
    members.forEach(x=>used.add(x));
  }
  return result;
}
function saveChange(message){
  trackerSelectedCells.clear();
  trackerSave(message);
}
function mergeSelected(){
  const choice=parseSelection();
  if(choice.error){trackerToastMsg(choice.error);return}
  const {s,ch,fieldIds}=choice;
  const allGroups=groups(s,ch);
  if(allGroups.some(g=>g.fields.some(id=>fieldIds.includes(id)))){
    trackerToastMsg('These cells are already merged. Unmerge them first.');return;
  }
  const anchor=trackerGetCell(s.id,ch.id,fieldIds[0]);
  anchor.mergedWith=fieldIds.slice(1);
  anchor.updatedAt=new Date().toISOString();
  saveChange('Adjacent cells merged');
  trackerToastMsg('Merged '+fieldIds.length+' neighboring cells. All original data preserved.');
}
function unmerge(sid,cid,anchorId){
  const s=trackerState.subjects.find(x=>x.id===sid),ch=s?.chapters.find(x=>x.id===cid);
  if(!s||!ch)return;
  const cell=trackerGetCell(sid,cid,anchorId);
  if(!Array.isArray(cell.mergedWith)||!cell.mergedWith.length)return;
  delete cell.mergedWith;
  cell.updatedAt=new Date().toISOString();
  saveChange('Merged cells separated');
  trackerToastMsg('Cells separated; no values or checkboxes were lost.');
}
function unmergeSelected(){
  const refs=trackerSelectedRefs();
  if(!refs.length){trackerToastMsg('Select a merged cell first.');return}
  const found=new Map();
  for(const ref of refs){
    for(const g of groups(ref.s,ref.ch)){
      if(g.fields.includes(ref.f.id))found.set(ref.s.id+'|'+ref.ch.id+'|'+g.anchor,{sid:ref.s.id,cid:ref.ch.id,anchor:g.anchor});
    }
  }
  if(!found.size){trackerToastMsg('No merged cells in the selection.');return}
  found.forEach(x=>{
    const cell=trackerGetCell(x.sid,x.cid,x.anchor);
    delete cell.mergedWith;
    cell.updatedAt=new Date().toISOString();
  });
  saveChange('Merged cells separated');
  trackerToastMsg('Unmerged '+found.size+' group(s) without losing data.');
}
function addButtons(){
  const bar=document.getElementById('trackerBulkBar');
  if(!bar||bar.querySelector('#dbtMergeCells'))return;
  const first=bar.querySelector('#trackerBulkDone')||bar.lastElementChild;
  const merge=document.createElement('button'),split=document.createElement('button');
  merge.className='btn dbt-merge-action';merge.id='dbtMergeCells';merge.type='button';
  merge.textContent='⇔ Merge cells';merge.title='Combine adjacent cells horizontally in one chapter row';
  split.className='btn dbt-merge-action';split.id='dbtUnmergeCells';split.type='button';
  split.textContent='↔ Unmerge';split.title='Separate selected merged cells, retaining all data';
  merge.onclick=mergeSelected;split.onclick=unmergeSelected;
  first.before(merge,split);
}
function applyMerges(s){
  if(isWeek()||!s)return;
  const table=document.querySelector('#trackerTableHost table.tracker-table');
  if(!table)return;
  const rows=[...table.querySelectorAll('tbody > tr')],chs=trackerFilteredChapters(s);
  const vis=fields(s);
  rows.forEach((tr,i)=>{
    const ch=chs[i];if(!ch)return;
    const merged=groups(s,ch);
    if(!merged.length)return;
    const cells=[...tr.children];
    for(const g of merged){
      const firstIndex=vis.findIndex(f=>f.id===g.anchor);
      const master=cells[firstIndex+1];
      if(!master)continue;
      // One real HTML table cell. Remove neighboring TD nodes entirely;
      // preserve their data exclusively in trackerState for lossless unmerge.
      master.colSpan=g.fields.length;
      master.classList.add('dbt-merged-cell');
      master.dataset.mergeAnchor=trackerCellKey(s.id,ch.id,g.anchor);
      for(const hiddenId of g.fields.slice(1)){
        const at=vis.findIndex(f=>f.id===hiddenId);
        if(at>=0&&cells[at+1])cells[at+1].remove();
      }
      // The anchor's existing editor/checkbox remains fully functional.
      const split=document.createElement('button');
      split.type='button';split.className='dbt-inline-unmerge';
      split.title='Restore the original adjacent cells and their saved contents';
      split.textContent='↔ Unmerge';
      split.onclick=e=>{e.preventDefault();e.stopPropagation();unmerge(s.id,ch.id,g.anchor)};
      master.appendChild(split);
    }
  });
}
const previousRows=renderTrackerRows;
renderTrackerRows=function(s){
  const value=previousRows.apply(this,arguments);
  applyMerges(s);
  decorateDates(document.getElementById('trackerTableHost'));
  return value;
};
const previousSelection=trackerUpdateSelectionUI;
trackerUpdateSelectionUI=function(){
  const value=previousSelection.apply(this,arguments);
  const merge=document.getElementById('dbtMergeCells');
  if(merge){const choice=parseSelection();merge.disabled=!!choice.error;merge.title=choice.error||'Merge selected side-by-side cells';}
  return value;
};
const style=document.createElement('style');
style.textContent=`
/* Dates belong to attempts, not to table backgrounds. */
#tracker .field-until-badge{color:#929daa!important}
#tracker .week-task-highlight-date.dbt-multi-date{color:#aeb8c5!important;background:transparent!important;border:1px solid rgba(150,165,185,.16)!important;white-space:nowrap!important;max-width:calc(100% - 8px)!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:9px!important}
#tracker .week-task-highlight-date.dbt-multi-date.dbt-highlight-icon{font-size:11px!important;padding:1px 3px!important;border-color:transparent!important;min-width:19px!important}
#tracker .week-task-highlight-date.dbt-multi-date:hover{background:rgba(255,255,255,.055)!important;border-color:rgba(150,165,185,.35)!important}
#tracker .tracker-table td.dbt-has-attempt-dates{height:auto!important;min-height:46px!important;max-height:none!important}
#tracker .cell-box.dbt-dated-attempts{height:auto!important;min-height:48px!important;max-height:none!important;overflow:visible!important}
#tracker .cell-box.dbt-dated-attempts .check-stack{height:auto!important;min-height:32px!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;flex-wrap:wrap!important;overflow:visible!important;gap:4px!important;padding:4px 20px 19px 4px!important}
#tracker .cell-box.dbt-dated-attempts .dbt-attempt-slot{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:2px!important;min-width:29px!important;padding:1px!important;flex:0 0 auto!important;background:transparent!important}
#tracker .cell-box.dbt-dated-attempts .dbt-attempt-date{display:block!important;position:static!important;width:auto!important;min-width:0!important;max-width:none!important;min-height:0!important;height:auto!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#aeb9c7!important;font-size:8px!important;font-weight:600!important;line-height:11px!important;white-space:nowrap!important;cursor:pointer}
#tracker .cell-box.dbt-dated-attempts .dbt-attempt-date:hover{color:#f3f6fa!important;text-decoration:underline}
#tracker .cell-box .tracker-check.dbt-dated-check{appearance:none!important;accent-color:var(--dbt-check-color)!important;border:1px solid var(--dbt-check-color)!important;background:var(--dbt-check-tint)!important;box-shadow:none!important}
#tracker .cell-box .tracker-check.dbt-dated-check:checked{background:var(--dbt-check-color)!important;border-color:var(--dbt-check-color)!important;box-shadow:none!important}
#tracker .cell-box .tracker-check.dbt-dated-check:checked:after{color:#0a1019!important}
#tracker .cell-box.dbt-dated-attempts .dbt-date-add-attempt{display:grid!important;place-items:center!important;width:18px!important;height:18px!important;padding:0!important;border:1px dashed rgba(150,165,185,.5)!important;border-radius:5px!important;background:transparent!important;color:#9eabbc!important;font-size:12px!important;line-height:1!important;cursor:pointer}
#tracker .cell-box.dbt-dated-attempts .dbt-date-add-attempt:hover{border-color:#e2e9f2!important;color:#e2e9f2!important}
#tracker .cell-box.dbt-dated-attempts>.dbt-multi-date{top:3px!important;right:3px!important;bottom:auto!important}
#tracker .week-task-control .cell-box.dbt-dated-attempts{max-width:none!important;min-width:0!important;flex:1 1 auto!important}
#tracker .week-task-control .cell-box.dbt-dated-attempts .check-stack{padding:3px 3px 16px!important}
#dbtDatesList{max-height:180px;overflow:auto}
.dbt-date-stack{position:absolute;right:8px;top:3px;z-index:3;display:flex;justify-content:flex-end;gap:3px;flex-wrap:wrap;max-width:calc(100% - 16px)}
#tracker .tracker-table .dbt-date-stack .week-task-highlight-date{position:static!important;inset:auto!important;max-width:100%!important;flex:0 1 auto!important;margin:0!important}
.dbt-date-entry{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px}
.dbt-date-entry button{padding:2px 7px!important}

.dbt-highlight-off{opacity:.8!important;border-color:rgba(160,170,185,.25)!important;background:rgba(122,134,154,.08)!important;color:#b7c0cd!important}
.dbt-highlight-off.dbt-highlight-icon{display:inline-flex!important;align-items:center;justify-content:center;min-width:24px!important;width:24px!important;min-height:19px!important;padding:1px 3px!important;font-size:12px!important;line-height:1.1!important;white-space:nowrap!important;background:transparent!important;border:1px solid rgba(151,185,232,.16)!important;border-radius:5px!important;color:#a4b4c9!important;opacity:.7!important}
.dbt-highlight-off.dbt-highlight-icon:hover,.dbt-highlight-off.dbt-highlight-icon:focus-visible{opacity:1!important;border-color:rgba(151,185,232,.5)!important;color:#eef4ff!important}
.dbt-highlight-info{padding:9px 12px;margin:8px 0;border:1px solid rgba(138,166,200,.25);border-radius:8px;color:#bed3ed;font-size:12px}
.dbt-merge-action{white-space:nowrap}.dbt-merge-action:disabled{opacity:.45;cursor:not-allowed}
td.dbt-merged-cell{position:relative;padding:5px!important;min-width:170px}
.dbt-inline-unmerge{position:absolute;right:5px;top:3px;z-index:5;font-size:9px;padding:3px 6px;background:#16283d;border:1px solid #45617e;border-radius:4px;color:#d0e5ff;cursor:pointer;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .14s ease,visibility .14s ease}
td.dbt-merged-cell:hover>.dbt-inline-unmerge,td.dbt-merged-cell:focus-within>.dbt-inline-unmerge,.dbt-inline-unmerge:focus-visible{opacity:1;visibility:visible;pointer-events:auto}
.dbt-date-pop-body{display:grid;gap:9px;width:min(290px,calc(100vw - 44px));padding:5px 1px 2px}
.dbt-date-pop-label{display:flex;align-items:center;justify-content:space-between;gap:7px;color:#c8d7e9;font-size:11px}
.dbt-date-pop-label input{max-width:156px;background:#101a28;border:1px solid #40526a;color:#eef4ff;border-radius:5px;padding:5px;font-size:12px}
.dbt-date-pop-check{display:flex;align-items:center;gap:7px;color:#d9e5f6;font-size:11px;cursor:pointer;padding:5px 0}
.dbt-date-pop-check input{accent-color:#86adf7;width:15px;height:15px}
.dbt-date-pop-default{color:#9cacc1;font-size:10px}
.dbt-date-pop-actions{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}
.dbt-date-pop-actions .cell-pop-btn{font-size:10px;padding:6px 8px}
td.dbt-merged-cell>.cell-box{padding-right:58px!important}

.dbt-highlight-add{opacity:.12!important;background:transparent!important;border:1px dashed rgba(151,185,232,.18)!important;min-width:22px;color:#adc6ef!important;padding:2px 4px!important}
.cell-box:hover .dbt-highlight-add,.cell-box:focus-within .dbt-highlight-add,.week-task-card:hover .dbt-highlight-add,.dbt-highlight-add:focus-visible{opacity:1!important}
.dbt-date-pop-actions-wrap{justify-content:flex-start;gap:5px}
.dbt-date-pop-actions-wrap .cell-pop-btn{font-size:10px;padding:6px 8px}
.dbt-date-whole{border-color:#536275!important}
`;
document.head.appendChild(style);
addButtons();

/* Bulk highlight now targets exact selected cells — never whole columns.
   Uses the existing compact cell popover and normal cloud save pipeline. */
function trackerBindSelectedCellHighlight(){
  const button=document.getElementById('trackerBulkUntil');
  if(!button)return;
  button.textContent='📅 Highlight selected';
  button.title='Set or clear highlighting on only the selected cells';
  button.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    const refs=trackerSelectedRefs();
    if(!refs.length){trackerToastMsg('Select cells first');return;}
    // Use explicit per-cell dates; never read/mutate checkboxes or progress.
    const previous=refs.find(r=>r.cell.chapterHighlightUntil&&!r.cell.highlightExcluded);
    const today=trackerLocalDateKey();
    const suggestion=previous?previous.cell.chapterHighlightUntil:today;
    trackerShowCellPopover(button,
      '<div class="cell-pop-title">📅 Highlight selected cells</div>'+
      '<div class="dbt-date-pop-body">'+
        '<div class="dbt-date-pop-default">'+refs.length+' cell'+(refs.length===1?'':'s')+' selected · only these cells will change</div>'+
        '<label class="dbt-date-pop-label">Highlight until <input type="date" id="dbtSelectedHighlightDate" value="'+esc(suggestion)+'"></label>'+
        '<div class="dbt-date-pop-actions dbt-date-pop-actions-wrap">'+
          '<button class="cell-pop-btn" type="button" id="dbtSelectedHighlightCancel">Cancel</button>'+
          '<button class="cell-pop-btn" type="button" id="dbtSelectedHighlightClear">Clear selected</button>'+
          '<button class="cell-pop-btn primary" type="button" id="dbtSelectedHighlightApply">Add to selected</button>'+
        '</div>'+
      '</div>'
    );
    const input=trackerCellPopover.querySelector('#dbtSelectedHighlightDate');
    const act=(clear)=>{
      const date=input.value;
      if(!clear&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00')))){
        trackerToastMsg('Choose a valid highlight date');input.focus();return;
      }
      const stamp=new Date().toISOString();
      let changes=0;
      for(const {f,cell} of refs){
        // A column can carry an old default date, but selected-cell mode
        // must not pass that date through to unselected chapter cells.
        // Explicit dates override inheritance for each selected cell only.
        if(clear){
          if(cell.highlightExcluded!==true||cell.chapterHighlightUntil){
            delete cell.chapterHighlightUntil;
            cell.highlightDates=[];
            cell.highlightExcluded=true;
            cell.updatedAt=stamp;changes++;
          }
        }else if(!datesFor(f,cell).includes(date)){
          putDates(cell,[...datesFor(f,cell),date]);
          cell.updatedAt=stamp;changes++;
        }
      }
      trackerCloseCellPopover();
      if(changes){
        trackerSave(clear?'Selected cell highlights cleared':'Selected cells highlighted');
        trackerToastMsg((clear?'Cleared':'Highlighted')+' '+refs.length+' selected cell'+(refs.length===1?'':'s'));
      }else trackerToastMsg('Selected cell highlights already up to date');
    };
    trackerCellPopover.querySelector('#dbtSelectedHighlightCancel').onclick=()=>trackerCloseCellPopover();
    trackerCellPopover.querySelector('#dbtSelectedHighlightClear').onclick=()=>act(true);
    trackerCellPopover.querySelector('#dbtSelectedHighlightApply').onclick=()=>act(false);
  };
}
trackerBindSelectedCellHighlight();

if(!isWeek())renderTrackerRows(trackerSubject());
else if(typeof renderThisWeekView==='function')renderThisWeekView();
})();
