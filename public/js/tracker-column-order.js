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
    const trigger=document.createElement('button');
    trigger.type='button';trigger.className='dbt-move-trigger';
    trigger.textContent='⇄';trigger.title='Move '+f.name+' column';
    trigger.setAttribute('aria-label','Move '+f.name+' column');
    trigger.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      trackerShowCellPopover(trigger,
        '<div class="cell-pop-title dbt-move-title">Move '+esc(f.name)+'</div>'+
        '<div class="dbt-move-shortcuts">'+
          '<button type="button" data-dbt-delta="-1" '+(i===0?'disabled':'')+'>← Left</button>'+
          '<button type="button" data-dbt-delta="1" '+(i===fields.length-1?'disabled':'')+'>Right →</button>'+
        '</div>'+
        '<div class="dbt-move-caption">MOVE TO POSITION</div>'+
        '<div class="dbt-move-options">'+fields.map((other,index)=>
          '<button type="button" data-dbt-move-index="'+index+'" class="'+(index===i?'current':'')+'" '+(index===i?'disabled':'')+'>'+
            '<span class="dbt-move-position">'+String(index+1).padStart(2,'0')+'</span>'+
            '<span class="dbt-move-name">'+esc(other.name)+'</span>'+
            (index===i?'<span class="dbt-move-current">CURRENT</span>':'')+
          '</button>'
        ).join('')+'</div>'
      );
      trackerCellPopover.querySelectorAll('[data-dbt-move-index]').forEach(btn=>btn.onclick=ev=>{
        ev.preventDefault();ev.stopPropagation();
        const target=Number(btn.dataset.dbtMoveIndex);
        trackerCloseCellPopover();
        move(s,f.id,target);
      });
      trackerCellPopover.querySelectorAll('[data-dbt-delta]').forEach(btn=>btn.onclick=ev=>{
        ev.preventDefault();ev.stopPropagation();
        const target=i+Number(btn.dataset.dbtDelta);
        trackerCloseCellPopover();
        move(s,f.id,target);
      });
      trackerBindPopoverClose();
    };
    controls.appendChild(trigger);
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
.dbt-reorder-controls{display:inline-flex;align-items:center;margin-inline-start:6px;vertical-align:middle}
.dbt-move-trigger{display:inline-flex;align-items:center;justify-content:center;min-width:23px;height:22px;padding:0 4px;border:1px solid rgba(155,181,218,.17);border-radius:6px;background:transparent;color:#8fa7c8;font:600 15px/1 inherit;cursor:pointer;opacity:.65;transition:opacity .15s,background .15s,border-color .15s}
.dbt-move-trigger:hover,.dbt-move-trigger:focus-visible{opacity:1;background:#172337;border-color:rgba(145,185,244,.6);color:#e4efff;outline-offset:2px}
.dbt-move-title{font-weight:800}
.dbt-move-shortcuts{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 12px}
.dbt-move-shortcuts button{background:#18253a;border:1px solid #304663;color:#e2ecfb;padding:8px;border-radius:7px;font-size:11px;cursor:pointer}
.dbt-move-shortcuts button:hover:not(:disabled){background:#263b59}
.dbt-move-shortcuts button:disabled{opacity:.35;cursor:default}
.dbt-move-caption{font-size:9px;letter-spacing:.1em;color:#8294ae;font-weight:800;margin-bottom:5px}
.dbt-move-options{display:grid;gap:3px;max-height:245px;overflow-y:auto;min-width:200px}
.dbt-move-options button{display:flex;align-items:center;text-align:left;gap:9px;padding:8px 9px;border:1px solid transparent;border-radius:6px;background:transparent;color:#d5e0f1;font-size:12px;cursor:pointer}
.dbt-move-options button:hover:not(:disabled){background:#1b2d46;border-color:#39567b}
.dbt-move-options button.current{background:rgba(65,100,150,.16);color:#a6bddc}
.dbt-move-position{color:#738bad;font-size:10px;font-variant-numeric:tabular-nums}
.dbt-move-name{flex:1;overflow-wrap:anywhere}
.dbt-move-current{font-size:9px;letter-spacing:.04em;color:#8aa6c9}
@media(max-width:800px){.dbt-reorder-controls{margin-inline-start:3px}.dbt-move-trigger{min-width:21px;height:21px}}
`;
document.head.appendChild(style);
if(!trackerWeekView)renderTrackerRows(trackerSubject());
})();