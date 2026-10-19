/* DBT Tracker — show all members of selected merged cells in Weekly Routine
   and PDF Studio without changing any saved cell values, tags, or checkboxes. */
(()=>{
'use strict';
if(typeof trackerRedTaggedRefs!=='function'||typeof trackerWeeklyGroups!=='function')return;
const originalRedRefs=trackerRedTaggedRefs;
const originalDailyRefs=trackerDailyGoalRefs;
const originalGroups=trackerWeeklyGroups;
const originalPrintTask=trackerWeeklyPrintTaskText;
function mergedGroups(){
  const byCell=new Map();
  for(const s of trackerState.subjects||[]){
    const fields=trackerVisibleFields(s),ids=fields.map(f=>f.id);
    for(const ch of s.chapters||[]){
      const claimed=new Set();
      for(const field of fields){
        const anchor=trackerGetCell(s.id,ch.id,field.id);
        if(!Array.isArray(anchor.mergedWith)||!anchor.mergedWith.length)continue;
        const members=[field.id,...anchor.mergedWith];
        const positions=members.map(id=>ids.indexOf(id));
        // Corrupt/stale or nonadjacent metadata must not affect task selection.
        if(members.length<2||new Set(members).size!==members.length||
          positions.some((p,i)=>p<0||p!==positions[0]+i)||members.some(id=>claimed.has(id)))continue;
        const groupId=trackerCellKey(s.id,ch.id,field.id);
        members.forEach((id,index)=>{
          claimed.add(id);
          byCell.set(trackerCellKey(s.id,ch.id,id),{id:groupId,members,index});
        });
      }
    }
  }
  return byCell;
}
function completeMergedRefs(source){
  const byCell=mergedGroups();
  const desired=new Set(source.map(r=>r.key));
  for(const ref of source){
    const group=byCell.get(ref.key);
    if(!group)continue;
    const [sid,cid]=ref.key.split('|');
    group.members.forEach(fid=>desired.add(trackerCellKey(sid,cid,fid)));
  }
  const ordered=[];
  // Use the exact same field order as the Tracker, including moved columns.
  for(const s of trackerState.subjects||[]){
    for(const ch of s.chapters||[]){
      for(const f of trackerVisibleFields(s)){
        const key=trackerCellKey(s.id,ch.id,f.id);
        if(!desired.has(key))continue;
        const group=byCell.get(key);
        ordered.push({s,ch,f,cell:trackerGetCell(s.id,ch.id,f.id),key,
          mergedGroupId:group?.id||'',mergedMemberIndex:group?.index??-1});
      }
    }
  }
  return ordered;
}
trackerRedTaggedRefs=function(){
  return completeMergedRefs(originalRedRefs());
};
trackerDailyGoalRefs=function(date){
  const allowed=new Set(trackerRedTaggedRefs().map(r=>r.key));
  const original=originalDailyRefs(date).filter(r=>allowed.has(r.key));
  return completeMergedRefs(original).filter(r=>allowed.has(r.key));
};
// PDF Studio: print one task entry per merged group, but include each member's
// own completion status, weekly portion, name, and checkbox attempts.
trackerWeeklyGroups=function(){
  const groups=originalGroups();
  groups.forEach(subject=>subject.rows.forEach(row=>{
    const items=[];
    for(const item of row.items){
      if(item.mergedGroupId&&items.length&&items[items.length-1].mergedGroupId===item.mergedGroupId){
        const parent=items[items.length-1];
        if(!parent.mergedMembers)parent.mergedMembers=[parent];
        parent.mergedMembers.push(item);
      }else items.push({...item});
    }
    row.items=items;
  }));
  return groups;
};
trackerWeeklyPrintTaskText=function(ref){
  if(Array.isArray(ref.mergedMembers)&&ref.mergedMembers.length>1)
    return ref.mergedMembers.map(item=>originalPrintTask(item)).join(' + ');
  return originalPrintTask(ref);
};
})();
