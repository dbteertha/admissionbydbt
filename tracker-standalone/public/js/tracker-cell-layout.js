/* DBT Tracker cell-level highlight exclusions and lossless horizontal merges.
   Layout metadata is kept on the anchor cell and synced with its updatedAt.
   Underlying cells, checks, comments, targets, and history are never combined or deleted. */
(()=>{
'use strict';
if(typeof trackerGetCell!=='function'||typeof renderTrackerRows!=='function')return;
const currentDate=trackerTaskHighlightDate;
trackerTaskHighlightDate=function(field,cell){
  if(cell&&cell.highlightExcluded===true)return '';
  return currentDate(field,cell);
};
const originalBadge=trackerTaskHighlightBadge;
trackerTaskHighlightBadge=function(s,ch,f,cell){
  if(cell&&cell.highlightExcluded===true){
    const key=trackerCellKey(s.id,ch.id,f.id);
    return '<button class="week-task-highlight-date dbt-highlight-off" type="button" data-chapter-highlight="'+esc(key)+'" title="Highlight is turned off for this cell. Click to change.">◌ No highlight</button>';
  }
  return originalBadge(s,ch,f,cell);
};
trackerOpenChapterHighlightDate=function(key){
  const ref=trackerResolveCellKey(key);
  if(!ref)return;
  const {s,ch,f,cell}=ref;
  const anchor=[...document.querySelectorAll('[data-chapter-highlight]')].find(el=>el.dataset.chapterHighlight===key &&
    (el===document.activeElement||el.matches(':hover')))
    ||[...document.querySelectorAll('[data-chapter-highlight]')].find(el=>el.dataset.chapterHighlight===key);
  if(!anchor)return;
  const blocked=cell.highlightExcluded===true;
  const current=cell.chapterHighlightUntil||f.highlightUntil||'';
  const defaultDate=f.highlightUntil||'';
  trackerShowCellPopover(anchor,
    '<div class="cell-pop-title">📅 '+esc(ch.name)+' · '+esc(f.name)+'</div>'+
    '<div class="dbt-date-pop-body">'+
      '<label class="dbt-date-pop-label">Date <input id="dbtCellHighlightDate" type="date" value="'+esc(current)+'"></label>'+
      '<label class="dbt-date-pop-check"><input id="dbtCellHighlightOff" type="checkbox" '+(blocked?'checked':'')+'> <span>Do not highlight this cell</span></label>'+
      '<div class="dbt-date-pop-default">Column default: '+esc(defaultDate?trackerWeekDateText(defaultDate):'None')+'</div>'+
      '<div class="dbt-date-pop-actions">'+
        '<button class="cell-pop-btn" type="button" id="dbtDateCancel">Cancel</button>'+
        '<button class="cell-pop-btn" type="button" id="dbtDateDefault">Use column date</button>'+
        '<button class="cell-pop-btn primary" type="button" id="dbtDateSave">Save</button>'+
      '</div>'+
    '</div>'
  );
  const input=trackerCellPopover.querySelector('#dbtCellHighlightDate');
  const off=trackerCellPopover.querySelector('#dbtCellHighlightOff');
  trackerCellPopover.querySelector('#dbtDateCancel').onclick=()=>trackerCloseCellPopover();
  const commit=(mode)=>{
    const skip=off.checked;
    const raw=input.value;
    if(mode==='save'&&!skip &&
       (!/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)||!Number.isFinite(Date.parse(raw+'T00:00:00')))){
      trackerToastMsg('Choose a valid date or select Do not highlight');
      input.focus();
      return;
    }
    const before=JSON.stringify([cell.highlightExcluded===true,cell.chapterHighlightUntil||'']);
    if(mode==='default')delete cell.chapterHighlightUntil;
    else if(mode==='save'&&!skip)cell.chapterHighlightUntil=raw;
    cell.highlightExcluded=mode==='default'?false:skip;
    if(before===JSON.stringify([cell.highlightExcluded===true,cell.chapterHighlightUntil||''])){
      trackerCloseCellPopover();
      return;
    }
    cell.updatedAt=new Date().toISOString();
    trackerCloseCellPopover();
    trackerSave('Cell highlight preference updated');
  };
  trackerCellPopover.querySelector('#dbtDateDefault').onclick=()=>commit('default');
  trackerCellPopover.querySelector('#dbtDateSave').onclick=()=>commit('save');
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
.dbt-inline-unmerge{position:absolute;right:5px;top:3px;z-index:5;font-size:9px;padding:3px 6px;background:#16283d;border:1px solid #45617e;border-radius:4px;color:#d0e5ff;cursor:pointer}
.dbt-date-pop-body{display:grid;gap:9px;width:min(290px,calc(100vw - 44px));padding:5px 1px 2px}
.dbt-date-pop-label{display:flex;align-items:center;justify-content:space-between;gap:7px;color:#c8d7e9;font-size:11px}
.dbt-date-pop-label input{max-width:156px;background:#101a28;border:1px solid #40526a;color:#eef4ff;border-radius:5px;padding:5px;font-size:12px}
.dbt-date-pop-check{display:flex;align-items:center;gap:7px;color:#d9e5f6;font-size:11px;cursor:pointer;padding:5px 0}
.dbt-date-pop-check input{accent-color:#86adf7;width:15px;height:15px}
.dbt-date-pop-default{color:#9cacc1;font-size:10px}
.dbt-date-pop-actions{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}
.dbt-date-pop-actions .cell-pop-btn{font-size:10px;padding:6px 8px}
td.dbt-merged-cell>.cell-box{padding-right:58px!important}
`;
document.head.appendChild(style);
addButtons();
if(!isWeek())renderTrackerRows(trackerSubject());
else if(typeof renderThisWeekView==='function')renderThisWeekView();
})();
