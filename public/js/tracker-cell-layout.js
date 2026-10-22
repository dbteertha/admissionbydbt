/* DBT Tracker cell-level highlight exclusions and lossless horizontal merges.
   Layout metadata is kept on the anchor cell and synced with its updatedAt.
   Underlying cells, checks, comments, targets, and history are never combined or deleted. */
(()=>{
'use strict';
if(typeof trackerGetCell!=='function'||typeof renderTrackerRows!=='function')return;
const currentDate=trackerTaskHighlightDate;
const currentColumnActive=trackerFieldHighlightActive;
// A cell-specific highlight date never changes other cells. Legacy column
// highlights remain supported unless the user explicitly selects cell-only mode.
trackerTaskHighlightDate=function(field,cell){
  if(cell&&cell.highlightExcluded===true)return '';
  if(cell&&typeof cell.chapterHighlightUntil==='string'&&cell.chapterHighlightUntil)
    return cell.chapterHighlightUntil;
  if(field&&field.highlightScope==='individual')return '';
  return currentDate(field,cell);
};
trackerFieldHighlightActive=function(field){
  return !!(field&&field.highlightScope!=='individual'&&currentColumnActive(field));
};
const originalBadge=trackerTaskHighlightBadge;
trackerTaskHighlightBadge=function(s,ch,f,cell){
  const key=trackerCellKey(s.id,ch.id,f.id);
  if(cell&&cell.highlightExcluded===true)
    return '<button class="week-task-highlight-date dbt-highlight-off" type="button" data-chapter-highlight="'+esc(key)+'" title="Highlight is disabled for this cell — click to change">◌ No highlight</button>';
  const date=trackerTaskHighlightDate(f,cell);
  if(!date)
    return '<button class="week-task-highlight-date dbt-highlight-add" type="button" data-chapter-highlight="'+esc(key)+'" title="Highlight this cell only">📅</button>';
  return originalBadge(s,ch,f,cell);
};
trackerOpenChapterHighlightDate=function(key){
  const ref=trackerResolveCellKey(key);
  if(!ref)return;
  const {s,ch,f,cell}=ref;
  const matches=[...document.querySelectorAll('[data-chapter-highlight]')].filter(el=>el.dataset.chapterHighlight===key);
  const anchor=matches.find(el=>el===document.activeElement||el.matches(':hover'))||matches[0];
  if(!anchor)return;
  const chosen=cell.chapterHighlightUntil||f.highlightUntil||'';
  const excluded=cell.highlightExcluded===true;
  trackerShowCellPopover(anchor,
    '<div class="cell-pop-title">📅 '+esc(ch.name)+' · '+esc(f.name)+'</div>'+
    '<div class="dbt-date-pop-body">'+
      '<label class="dbt-date-pop-label">Highlight until <input id="dbtCellHighlightDate" type="date" value="'+esc(chosen)+'"></label>'+
      '<div class="dbt-date-pop-default">'+(f.highlightScope==='individual'?
         'Cell-only mode. Other cells keep their individual dates.':
         'Column-wide date: '+esc(f.highlightUntil?trackerWeekDateText(f.highlightUntil):'None'))+'</div>'+
      '<label class="dbt-date-pop-check"><input id="dbtCellHighlightOff" type="checkbox" '+(excluded?'checked':'')+'> <span>Do not highlight this cell</span></label>'+
      '<div class="dbt-date-pop-actions dbt-date-pop-actions-wrap">'+
        '<button class="cell-pop-btn" type="button" id="dbtDateCancel">Cancel</button>'+
        '<button class="cell-pop-btn" type="button" id="dbtDateClear">Clear this cell</button>'+
        '<button class="cell-pop-btn primary" type="button" id="dbtDateSave">Only this cell</button>'+
        '<button class="cell-pop-btn dbt-date-whole" type="button" id="dbtDateColumn">Whole column</button>'+
      '</div>'+
    '</div>'
  );
  const input=trackerCellPopover.querySelector('#dbtCellHighlightDate');
  const off=trackerCellPopover.querySelector('#dbtCellHighlightOff');
  const close=()=>trackerCloseCellPopover();
  trackerCellPopover.querySelector('#dbtDateCancel').onclick=close;
  const commit=mode=>{
    const date=input.value,skip=off.checked;
    if((mode==='cell'||mode==='column')&&!skip&&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00')))){
      trackerToastMsg('Choose a valid date or select Do not highlight');
      input.focus();return;
    }
    const before=JSON.stringify([cell.highlightExcluded===true,cell.chapterHighlightUntil||'',f.highlightScope||'',f.highlightUntil||'']);
    if(mode==='cell'){
      if(!skip)cell.chapterHighlightUntil=date;
      cell.highlightExcluded=skip;
      // Do not erase the old column deadline. It can be reinstated later
      // through Whole column; simply suppress its inheritance.
      f.highlightScope='individual';
    }else if(mode==='column'){
      if(!skip)f.highlightUntil=date;
      f.highlightScope='column';
      delete cell.chapterHighlightUntil;
      cell.highlightExcluded=skip;
    }else if(mode==='clear'){
      delete cell.chapterHighlightUntil;
      cell.highlightExcluded=true;
    }
    const after=JSON.stringify([cell.highlightExcluded===true,cell.chapterHighlightUntil||'',f.highlightScope||'',f.highlightUntil||'']);
    close();
    if(before===after)return;
    const stamp=new Date().toISOString();
    cell.updatedAt=stamp;
    if(mode==='cell'||mode==='column')f.updatedAt=stamp;
    trackerSave(mode==='column'?'Column highlight changed':mode==='cell'?'Single cell highlight changed':'Cell highlight cleared');
    trackerToastMsg(mode==='cell'?'Only this cell uses this date':mode==='column'?'Column-wide highlighting enabled':'Highlight disabled for this cell');
  };
  trackerCellPopover.querySelector('#dbtDateSave').onclick=()=>commit('cell');
  trackerCellPopover.querySelector('#dbtDateColumn').onclick=()=>commit('column');
  trackerCellPopover.querySelector('#dbtDateClear').onclick=()=>commit('clear');
};
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
.dbt-highlight-off{opacity:.8!important;border-color:rgba(160,170,185,.25)!important;background:rgba(122,134,154,.08)!important;color:#b7c0cd!important}
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
          '<button class="cell-pop-btn primary" type="button" id="dbtSelectedHighlightApply">Apply to selected</button>'+
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
      const fieldChanges=new Map();
      for(const {s,f,cell} of refs){
        // A column can carry an old default date, but selected-cell mode
        // must not pass that date through to unselected chapter cells.
        if(f.highlightScope!=='individual')fieldChanges.set(s.id+'|'+f.id,f);
        if(clear){
          if(cell.highlightExcluded!==true||cell.chapterHighlightUntil){
            delete cell.chapterHighlightUntil;
            cell.highlightExcluded=true;
            cell.updatedAt=stamp;changes++;
          }
        }else if(cell.highlightExcluded===true||cell.chapterHighlightUntil!==date){
          cell.chapterHighlightUntil=date;
          cell.highlightExcluded=false;
          cell.updatedAt=stamp;changes++;
        }
      }
      fieldChanges.forEach(f=>{f.highlightScope='individual';f.updatedAt=stamp;changes++});
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
