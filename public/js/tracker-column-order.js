/* DBT Tracker — lossless, cloud-synced column ordering.
   Only adds a displayOrder property to existing field metadata.
   Cells remain keyed by stable subject/chapter/field IDs. */
(()=>{
'use strict';
if(typeof trackerVisibleFields!=='function'||typeof renderTrackerRows!=='function')return;
const baseVisibleFields=trackerVisibleFields;
function ordered(s){
  const original=baseVisibleFields(s);
  const nativeIndex=new Map((s.fields||[]).map((f,i)=>[f.id,i]));
  const ranked=original.filter(f=>Number.isFinite(f.displayOrder));
  if(!ranked.length)return original;
  return original.slice().sort((a,b)=>{
    const av=Number.isFinite(a.displayOrder)?a.displayOrder:nativeIndex.get(a.id);
    const bv=Number.isFinite(b.displayOrder)?b.displayOrder:nativeIndex.get(b.id);
    return av-bv||(nativeIndex.get(a.id)-nativeIndex.get(b.id));
  });
}
trackerVisibleFields=function(s){return ordered(s)};
function mergeWouldBreak(s,order){
  const original=ordered(s).map(f=>f.id);
  for(const ch of s.chapters||[]){
    for(const f of s.fields||[]){
      const cell=trackerState.cells?.[trackerCellKey(s.id,ch.id,f.id)];
      const members=Array.isArray(cell?.mergedWith)?[f.id,...cell.mergedWith]:[];
      if(members.length<2||members.some(id=>!original.includes(id)))continue;
      const oldPositions=members.map(id=>original.indexOf(id));
      if(!oldPositions.every((p,i)=>p===oldPositions[0]+i))continue;
      const positions=members.map(id=>order.indexOf(id));
      if(!positions.every((p,i)=>p===positions[0]+i))return true;
    }
  }
  return false;
}
function move(s,fieldId,targetIndex){
  if(!s||trackerWeekView)return;
  const visible=ordered(s),from=visible.findIndex(f=>f.id===fieldId);
  if(from<0||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=visible.length||from===targetIndex)return;
  const moved=visible.slice();
  const [item]=moved.splice(from,1);
  moved.splice(targetIndex,0,item);
  if(mergeWouldBreak(s,moved.map(f=>f.id))){
    trackerToastMsg('This move would split merged cells. Unmerge those cells first.');
    return;
  }
  const stamp=new Date().toISOString();
  moved.forEach((field,i)=>{
    field.displayOrder=i;
    field.updatedAt=stamp;
  });
  trackerSave('Column order changed');
  trackerToastMsg('Moved '+item.name+' to position '+(targetIndex+1));
}
function enhanceHeaders(s){
  if(trackerWeekView||!s)return;
  const header=document.querySelector('#trackerTableHost table.tracker-table thead tr');
  if(!header)return;
  const fields=ordered(s),ths=[...header.children];
  fields.forEach((f,i)=>{
    const th=ths[i+1];
    if(!th||th.querySelector('.dbt-reorder-controls'))return;
    const controls=document.createElement('span');controls.className='dbt-reorder-controls';
    const mk=(symbol,target,label)=>{
      const btn=document.createElement('button');
      btn.type='button';btn.className='dbt-reorder-btn';
      btn.textContent=symbol;btn.title=label;btn.setAttribute('aria-label',label);
      btn.disabled=target<0||target>=fields.length;
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();move(s,f.id,target)};
      return btn;
    };
    controls.appendChild(mk('←',i-1,'Move '+f.name+' one column left'));
    controls.appendChild(mk('→',i+1,'Move '+f.name+' one column right'));
    const select=document.createElement('select');
    select.className='dbt-column-position';
    select.title='Move '+f.name+' to position';
    select.setAttribute('aria-label','Position of '+f.name);
    fields.forEach((_,index)=>{
      const opt=document.createElement('option');
      opt.value=String(index);opt.textContent=String(index+1);
      if(index===i)opt.selected=true;
      select.appendChild(opt);
    });
    select.onchange=e=>{e.stopPropagation();move(s,f.id,Number(select.value))};
    controls.appendChild(select);
    const head=th.querySelector('.field-head')||th;
    head.appendChild(controls);
  });
}
const previousRows=renderTrackerRows;
renderTrackerRows=function(s){
  const result=previousRows.apply(this,arguments);
  enhanceHeaders(s);
  return result;
};
const style=document.createElement('style');
style.textContent=`
.dbt-reorder-controls{display:inline-flex;align-items:center;gap:3px;margin-inline-start:5px;vertical-align:middle}
.dbt-reorder-btn{font-family:inherit;font-size:13px;line-height:1;border:1px solid rgba(145,172,218,.25);border-radius:4px;padding:3px 5px;background:rgba(24,36,55,.65);color:#c8dcff;cursor:pointer}
.dbt-reorder-btn:hover:not(:disabled){background:rgba(66,101,153,.5);color:#fff;border-color:rgba(168,198,245,.7)}
.dbt-reorder-btn:disabled{opacity:.3;cursor:default}
.dbt-column-position{font-size:10px;padding:3px 2px;width:35px;max-width:35px;background:#101a29;color:#cedeff;border:1px solid rgba(145,172,218,.24);border-radius:4px;cursor:pointer}
.dbt-column-position option{background:#101a29;color:#fff}
@media(max-width:800px){.dbt-reorder-controls{gap:2px;margin-inline-start:3px}.dbt-reorder-btn{padding:3px}.dbt-column-position{width:31px}}
`;
document.head.appendChild(style);
if(!trackerWeekView)renderTrackerRows(trackerSubject());
})();