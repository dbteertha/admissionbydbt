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
function tint(d){return 'hsl('+hue(d)+' 65% 25% / .65)'}
function short(d){return new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function dateLabels(ds){return ds.slice(0,2).map(d=>'<span style="color:hsl('+hue(d)+' 85% 75%)">'+esc(short(d))+'</span>').join(' · ')+(ds.length>2?' +'+(ds.length-2):'')}
trackerTaskHighlightDate=function(f,c){return datesFor(f,c).at(-1)||''};
trackerFieldHighlightActive=function(f){return !!(f&&f.highlightScope!=='individual'&&currentColumnActive(f))};
trackerTaskHighlightBadge=function(s,ch,f,c){
 const key=trackerCellKey(s.id,ch.id,f.id),ds=datesFor(f,c);
 return '<button type="button" class="week-task-highlight-date dbt-multi-date'+(ds.length?'':' dbt-highlight-icon')+'" data-chapter-highlight="'+esc(key)+'" title="'+esc(ds.join(', ')||'Set highlight dates')+'" aria-label="Edit highlight dates">📅 '+dateLabels(ds)+'</button>';
};
trackerOpenChapterHighlightDate=function(key){
 const ref=trackerResolveCellKey(key);if(!ref)return;
 const {ch,f,cell}=ref;
 const anchors=[...document.querySelectorAll('[data-chapter-highlight]')].filter(el=>el.dataset.chapterHighlight===key);
 const anchor=anchors.find(el=>el===document.activeElement||el.matches(':hover'))||anchors[0];if(!anchor)return;
 let draft=datesFor(f,cell).slice(),pending=!draft.length;
 trackerShowCellPopover(anchor,'<div class="cell-pop-title">'+esc(ch.name)+' · '+esc(f.name)+'</div>'+
 '<div class="dbt-date-pop-body"><div id="dbtDatesList"></div><label class="dbt-date-pop-label">Date <input id="dbtCellHighlightDate" type="date" value="'+esc(draft.at(-1)||trackerLocalDateKey())+'"></label>'+
 '<div class="dbt-date-pop-actions dbt-date-pop-actions-wrap"><button type="button" class="cell-pop-btn" id="dbtDateAdd">+ Add date</button><button type="button" class="cell-pop-btn" id="dbtDateClear">Clear</button><button type="button" class="cell-pop-btn" id="dbtDateCancel">Cancel</button><button type="button" class="cell-pop-btn primary" id="dbtDateSave">Save</button><button type="button" class="cell-pop-btn" id="dbtDateColumn">Whole column</button></div></div>');
 const q=x=>trackerCellPopover.querySelector(x),input=q('#dbtCellHighlightDate'),list=q('#dbtDatesList');
 function redraw(){
  list.innerHTML=draft.map(d=>'<div class="dbt-date-entry"><span style="color:hsl('+hue(d)+' 85% 75%)">'+esc(short(d))+'</span><button type="button" class="cell-pop-btn" data-remove-date="'+esc(d)+'" aria-label="Remove '+esc(d)+'">×</button></div>').join('');
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
function decorateDates(root){
 if(!root)return;
 root.querySelectorAll('.cell-box[data-sid][data-cid][data-fid]').forEach(box=>{
  const r=trackerResolveCellKey(trackerCellKey(box.dataset.sid,box.dataset.cid,box.dataset.fid));if(!r)return;
  const td=box.closest('td')||box.closest('.mobile-field');
  let ds=datesFor(r.f,r.cell).filter(d=>d>=trackerLocalDateKey());
  if(td?.colSpan>1&&Array.isArray(r.cell.mergedWith))for(const id of r.cell.mergedWith){
   const f=r.s.fields.find(x=>x.id===id);if(f)ds.push(...datesFor(f,trackerGetCell(r.s.id,r.ch.id,id)).filter(d=>d>=trackerLocalDateKey()));
  }
  ds=[...new Set(ds)].sort();
  if(td&&ds.length){
   const fill=ds.length===1?tint(ds[0]):'linear-gradient(110deg,'+ds.map((d,i)=>tint(d)+' '+(100*i/ds.length)+'%, '+tint(d)+' '+(100*(i+1)/ds.length)+'%').join(',')+')';
   td.style.setProperty('--dbt-date-fill',fill);td.classList.add('dbt-date-colored');
  }else if(td){td.style.removeProperty('--dbt-date-fill');td.classList.remove('dbt-date-colored')}
  if(td?.colSpan>1&&Array.isArray(r.cell.mergedWith)){
   for(const id of r.cell.mergedWith){
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
    const stack=document.createElement('div');stack.className='dbt-date-stack';
    box.appendChild(stack);badges.forEach(b=>stack.appendChild(b));
   }
  }
  box.querySelectorAll('[data-chapter-highlight]').forEach(b=>{
   const ref=trackerResolveCellKey(b.dataset.chapterHighlight);if(!ref)return;
   const dates=datesFor(ref.f,ref.cell);
   b.innerHTML='📅 '+dateLabels(dates);
   b.title=ref.f.name+' · '+(dates.join(', ')||'Set highlight dates');b.setAttribute('aria-label','Edit '+ref.f.name+' highlight dates');b.classList.add('dbt-multi-date');b.classList.toggle('dbt-highlight-icon',!dates.length);
   b.onclick=e=>{e.preventDefault();e.stopPropagation();trackerOpenChapterHighlightDate(b.dataset.chapterHighlight)};
  });
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
.tracker-table tr td.track-cell.dbt-date-colored,.tracker-table tr:nth-child(even) td.track-cell.dbt-date-colored:not(:first-child),.tracker-table tr:hover td.track-cell.dbt-date-colored{background:var(--dbt-date-fill)!important;box-shadow:none!important}.tracker-table td.track-cell.dbt-date-colored .cell-box:not(.selected){background:transparent!important;border-color:rgba(255,255,255,.1)!important}.mobile-field.dbt-date-colored .cell-box:not(.selected){background:var(--dbt-date-fill)!important}.dbt-multi-date{white-space:nowrap!important;max-width:calc(100% - 8px)!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:9px!important}.dbt-multi-date.dbt-highlight-icon{font-size:11px!important;background:transparent!important;border-color:transparent!important}.dbt-date-colored .dbt-multi-date{background:rgba(8,12,18,.58)!important;border-color:rgba(255,255,255,.14)!important}#dbtDatesList{max-height:180px;overflow:auto}.dbt-date-stack{position:absolute;right:8px;bottom:20px;z-index:3;display:flex;justify-content:flex-end;gap:3px;flex-wrap:wrap;max-width:calc(100% - 16px)}.dbt-hi-main-table .dbt-date-stack{top:3px;bottom:auto;right:4px}#tracker .tracker-table .dbt-date-stack .week-task-highlight-date{position:static!important;inset:auto!important;max-width:100%!important;flex:0 1 auto!important;margin:0!important}.dbt-date-entry{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px}.dbt-date-entry button{padding:2px 7px!important}

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
