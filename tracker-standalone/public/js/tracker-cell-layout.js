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
const originalDateModal=trackerOpenChapterHighlightDate;
trackerOpenChapterHighlightDate=function(key){
  originalDateModal(key);
  const ref=trackerResolveCellKey(key);
  if(!ref)return;
  const cell=ref.cell;
  const actions=document.querySelector('#trackerModal .modal-actions');
  if(!actions)return;
  const save=document.getElementById('chapterHighlightSave');
  const defaultBtn=document.getElementById('chapterHighlightDefault');
  if(cell.highlightExcluded){
    const active=document.createElement('div');
    active.className='dbt-highlight-info';
    active.textContent='Highlighting is disabled for this cell. The column date and any custom date are preserved.';
    document.getElementById('chapterHighlightDate')?.closest('label')?.before(active);
  }
  const button=document.createElement('button');
  button.type='button';button.className='btn dbt-highlight-toggle';
  button.textContent=cell.highlightExcluded?'Enable highlighting':'Do not highlight this cell';
  button.onclick=()=>{
    cell.highlightExcluded=!cell.highlightExcluded;
    cell.updatedAt=new Date().toISOString();
    trackerSave(cell.highlightExcluded?'Cell highlight excluded':'Cell highlight enabled');
    modalClose();
  };
  actions.insertBefore(button,save);
  for(const b of [save,defaultBtn]){
    if(!b)continue;
    const old=b.onclick;
    b.onclick=e=>{
      const excluded=cell.highlightExcluded===true;
      const dateInput=document.getElementById('chapterHighlightDate');
      const raw=dateInput?.value||'';
      if(excluded && b===save &&
         (!/^\d{4}-\d{2}-\d{2}$/.test(raw)||!Number.isFinite(Date.parse(raw+'T00:00:00')))){
        if(old)old(e);return;
      }
      const unchanged=excluded && (b===save?raw===cell.chapterHighlightUntil:!cell.chapterHighlightUntil);
      if(excluded){
        cell.highlightExcluded=false;
        cell.updatedAt=new Date().toISOString();
      }
      if(old)old(e);
      if(unchanged)trackerSave('Cell highlight resumed');
    };
  }
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
      master.colSpan=g.fields.length;
      master.classList.add('dbt-merged-cell');
      const wrap=document.createElement('div');wrap.className='dbt-merged-parts';
      g.fields.forEach((id,j)=>{
        const index=vis.findIndex(f=>f.id===id);
        const source=cells[index+1];if(!source)return;
        const part=document.createElement('div');part.className='dbt-merged-part';
        const tag=document.createElement('div');tag.className='dbt-merged-field-name';
        tag.textContent=vis[index].name;
        part.appendChild(tag);
        while(source.firstChild)part.appendChild(source.firstChild);
        wrap.appendChild(part);
        if(j>0)source.remove();
      });
      master.appendChild(wrap);
      const split=document.createElement('button');
      split.type='button';split.className='dbt-inline-unmerge';
      split.title='Unmerge cells in this row';
      split.textContent='Unmerge';
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
.dbt-merged-parts{display:flex;align-items:stretch;gap:0;width:100%;min-height:65px}
.dbt-merged-part{flex:1 1 0;min-width:110px;padding:5px 7px;border-right:1px dashed rgba(156,180,212,.22)}
.dbt-merged-part:last-child{border-right:0}
.dbt-merged-field-name{color:#8baddc;opacity:.86;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.dbt-inline-unmerge{position:absolute;right:5px;top:3px;z-index:5;font-size:9px;padding:3px 6px;background:#16283d;border:1px solid #45617e;border-radius:4px;color:#d0e5ff;cursor:pointer}
.dbt-merged-part .cell-box{min-width:0}
`;
document.head.appendChild(style);
addButtons();
if(!isWeek())renderTrackerRows(trackerSubject());
else if(typeof renderThisWeekView==='function')renderThisWeekView();
})();
