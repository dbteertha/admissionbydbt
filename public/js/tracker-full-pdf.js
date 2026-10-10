/* DBT Full Tracker PDF Studio — all data remains read-only.
   Loaded after the existing tracker, reusing its established PDF controls and draft store. */
(function(){
'use strict';
if(typeof trackerOpenWeeklyPdfSettings!=='function'||typeof trackerSaveWeeklyPdfDraft!=='function')return;
const originalPreview=trackerRefreshWeeklyPdfPreview;
const originalSave=trackerSaveWeeklyPdfDraft;
const originalPrintSaved=trackerPrintSavedWeeklyPdfDraft;
const originalOpenSaved=trackerOpenSavedWeeklyPdfDraftInStudio;
const originalStudio=trackerOpenWeeklyPdfSettings;
const btn=document.getElementById('trackerFullPdfBtn');
if(!btn)return;

function snapshot(){
  if(weeklyPdfEditingDraft&&weeklyPdfEditingDraft.sourceMode==='full'&&weeklyPdfEditingDraft.fullSnapshot)
    return weeklyPdfEditingDraft.fullSnapshot;
  return {subjects:trackerState.subjects,cells:trackerState.cells};
}
function showCell(f,cell){
  const parts=[];
  if(f.type==='checkbox'){
    const tries=Array.isArray(cell.checks)?cell.checks:[{checked:cell.value===true,label:'1'}];
    const done=tries.filter(x=>x.checked===true).length;
    parts.push(tries.map(x=>x.checked===true?'✓':'□').join(' ')+' ('+done+'/'+tries.length+')');
  }else{
    const v=cell.value;
    parts.push(v===null||v===undefined||v===''?'—':Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):String(v));
  }
  if(cell.targetNumber!==undefined&&cell.targetNumber!==null&&String(cell.targetNumber).trim())
    parts.push('Target: '+cell.targetNumber);
  if(cell.weeklyPart)parts.push('Weekly: '+cell.weeklyPart);
  const note=String(cell.cellComment||cell.comment||'').trim();
  return '<span>'+esc(parts[0])+'</span>'+
    parts.slice(1).map(t=>'<small class="ft-note">'+esc(t)+'</small>').join('')+
    (note?'<small class="ft-note">Note: '+esc(note)+'</small>':'');
}
function markup(data=snapshot()){
  const subjects=Array.isArray(data&&data.subjects)?data.subjects:[];
  const cells=data&&data.cells&&typeof data.cells==='object'?data.cells:{};
  const perPage=weeklyPdfSettings.orientation==='landscape'?5:3;
  const chunks=[];
  subjects.forEach(s=>{
    const chapters=Array.isArray(s.chapters)?s.chapters:[];
    const fields=Array.isArray(s.fields)?s.fields:[];
    const groups=[];
    if(!fields.length)groups.push([]);
    else for(let i=0;i<fields.length;i+=perPage)groups.push(fields.slice(i,i+perPage));
    groups.forEach((group,i)=>{
      const firstWidth=Math.max(25,Math.min(55,Number(weeklyPdfSettings.chapterWidth)||38));
      const head='<tr class="ft-subject-head"><th colspan="'+(group.length+1)+'">'+esc(s.name)+' <small>'+chapters.length+' chapters • '+fields.length+' columns'+(groups.length>1?' • columns '+(i*perPage+1)+'–'+Math.min(fields.length,(i+1)*perPage):'')+'</small></th></tr>';
      const labels='<tr><th>Chapter</th>'+group.map(f=>'<th>'+esc(f.name)+(f.highlightUntil?'<small class="ft-note">Until '+esc(f.highlightUntil)+'</small>':'')+'</th>').join('')+'</tr>';
      const rows=chapters.map((ch,index)=>'<tr><td class="ft-chapter"><strong>'+String(index+1)+'. '+esc(ch.name)+'</strong>'+
        (ch.note?'<small class="ft-note">'+esc(ch.note)+'</small>':'')+'</td>'+
        group.map(f=>'<td>'+showCell(f,cells[String(s.id)+'|'+String(ch.id)+'|'+String(f.id)]||{})+'</td>').join('')+'</tr>').join('');
      chunks.push('<section class="ft-print-chunk" data-full-subject="'+esc(s.id)+'">'+
        '<table><colgroup><col style="width:'+firstWidth+'%">'+group.map(()=>'<col style="width:'+((100-firstWidth)/Math.max(1,group.length))+'%">').join('')+'</colgroup>'+
        '<thead>'+head+labels+'</thead><tbody>'+rows+'</tbody></table></section>');
    });
  });
  return '<div class="ft-report '+(weeklyPdfSettings.ink==='eco'?'ft-eco':'ft-standard')+' ft-subject-'+esc(weeklyPdfSettings.subjectStyle)+'">'+
    '<header class="ft-report-title"><strong>FULL STUDY TRACKER</strong><small>'+subjects.length+' subjects • '+subjects.reduce((n,s)=>n+(s.chapters||[]).length,0)+' chapters • '+new Date().toLocaleDateString()+'</small></header>'+
    (chunks.length?chunks.join(''):'<p>No subjects available.</p>')+'</div>';
}
function styles(preview){
  const p=weeklyPdfSettings;
  const landscape=p.orientation==='landscape';
  const margin=Math.max(0,Math.min(14,Number(p.margin)||7));
  const pageWidth=(landscape?297:210)-2*margin;
  const font=Math.max(5,Math.min(12,Number(p.fontSize)||7));
  const pad=Math.max(0,Math.min(8,Number(p.cellPadding)||3));
  const line=Math.max(1,Math.min(1.6,Number(p.lineHeight)||1.15));
  const gap=Math.max(0,Math.min(5,Number(p.rowGap)||0));
  const border=Math.max(0,Math.min(2,Number(p.borderWidth)||1));
  const eco=p.ink==='eco';
  const borderColor=p.borderTone==='dark'?'#555':p.borderTone==='medium'?'#999':'#d0d0d0';
  const bg=eco?'#fff':'#eaf0f7';
  return '@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:'+margin+'mm}'+
    '.ft-report{box-sizing:border-box;font-family:Arial,"Noto Sans Bengali",sans-serif;color:#111;background:#fff;width:100%;font-size:'+font+'pt;line-height:'+line+';text-align:'+(p.textAlign==='center'?'center':'left')+'}'+
    '.ft-report *, .ft-report *:before,.ft-report *:after{box-sizing:border-box}'+
    '.ft-report-title{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:2px solid #333;margin-bottom:12px;padding-bottom:5px;break-after:avoid}'+
    '.ft-report-title strong{font-size:calc('+font+'pt * 1.65)}.ft-report-title small{font-size:9px;color:#555}'+
    '.ft-print-chunk{break-before:page;page-break-before:always;width:100%;break-inside:auto}'+
    '.ft-print-chunk:first-of-type{break-before:auto;page-break-before:auto}'+
    '.ft-print-chunk table{border-collapse:'+(gap?'separate':'collapse')+';border-spacing:0 '+gap+'px;width:100%;table-layout:fixed}'+
    '.ft-print-chunk thead{display:table-header-group}'+
    '.ft-print-chunk tbody tr{break-inside:avoid;page-break-inside:avoid}'+
    '.ft-print-chunk th,.ft-print-chunk td{padding:'+pad+'px;border:'+border+'px solid '+borderColor+';overflow-wrap:anywhere;white-space:pre-wrap;vertical-align:'+(p.verticalAlign==='middle'?'middle':'top')+'}'+
    '.ft-print-chunk th{font-weight:'+(p.headerBold===false?'400':'750')+';background:'+bg+';font-size:inherit}'+
    '.ft-subject-head th{padding:9px 6px;background:'+(eco?'#fff':'#dfe9f7')+';text-align:'+(p.subjectAlign==='left'?'left':'center')+';font-size:calc('+font+'pt * 1.35)}'+
    '.ft-subject-line .ft-subject-head th{background:#fff;border-top:2px solid #333}'+
    '.ft-subject-plain .ft-subject-head th{background:#fff;border:0;border-bottom:1px solid #888}'+
    '.ft-subject-head small{display:block;font-size:9px;font-weight:400;margin-top:3px;color:#555}'+
    '.ft-chapter strong{font-weight:'+(p.chapterBold===false?'400':'750')+'}'+
    (p.taskBold===true?'.ft-print-chunk td:not(.ft-chapter)>span{font-weight:750}':'')+
    '.ft-note{display:block;font-size:calc('+font+'pt * .86);font-weight:400;color:#555;margin-top:3px;line-height:1.3;overflow-wrap:anywhere}'+
    (preview?'.ft-report{width:'+pageWidth+'mm;margin:0 auto;padding:12px}.ft-print-chunk{break-before:auto;page-break-before:auto}.ft-report-title{margin-bottom:12px}':
      '@media print{html,body{margin:0!important;padding:0!important;background:#fff!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}');
}
function refresh(){
  const host=document.getElementById('tmPdfPreviewHost');
  if(!host)return;
  const previous=document.getElementById('weeklyPrintSheet');if(previous)previous.remove();
  host.innerHTML='<div class="pdf-preview-shell"><div class="ft-preview-caption">FULL TRACKER · ALL SUBJECTS · Scrollable preview; print creates one multipage PDF. Paper and text options update this preview.</div>'+
    '<div class="ft-preview-scroll"><style>'+styles(true)+'</style>'+markup()+'</div></div>';
}
function printDocument(data=snapshot()){
  const previous=document.getElementById('trackerFullPrintFrame');if(previous)previous.remove();
  const iframe=document.createElement('iframe');
  iframe.id='trackerFullPrintFrame';
  iframe.setAttribute('aria-hidden','true');
  iframe.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  const doc=iframe.contentDocument||iframe.contentWindow.document;
  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Full Tracker PDF</title><style>'+styles(false)+'</style></head><body>'+markup(data)+'</body></html>');
  doc.close();
  const run=()=>{try{iframe.contentWindow.focus();iframe.contentWindow.print()}catch(e){console.error(e);trackerToastMsg('Could not open PDF print dialog')}};
  setTimeout(run,220);
}
function configure(){
  trackerModal.classList.add('ft-studio-modal');
  const heading=trackerModal.querySelector('h3');
  if(heading)heading.textContent=weeklyPdfEditingDraft?'Full Tracker PDF Studio — Editing saved draft':'Full Tracker PDF Studio';
  const sub=trackerModal.querySelector('.modal-sub');
  if(sub)sub.textContent='Every subject, chapter and column, printed together in one multipage PDF. Text, table, margin, paper and ink controls remain available.';
  ['tmPdfLayout','tmPdfPlacement','tmPdfAutoFit','tmPdfDeadlineDate','tmPdfDeadlineTime'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    const row=el.closest('.form-row,.pdf-check');
    if(row)row.style.setProperty('display','none','important');
  });
  ['tmPdfResetLayout','tmPdfResetSizes'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.setProperty('display','none','important');
  });
  trackerModal.querySelectorAll('.pdf-eco-note').forEach(el=>{
    if(el.textContent.includes('Drag tables'))el.textContent='Full Tracker automatically continues onto additional A4 pages. Single-page table dragging does not apply.';
    if(el.textContent.includes('Weekly and Daily keep'))el.textContent='Full Tracker includes all subjects. Weekly/Daily deadlines are not used in this export.';
  });
  const print=document.getElementById('tmPdfPrint');
  if(print)print.onclick=()=>{trackerSaveWeeklyPdfSettings();printDocument();modalClose()};
  const reset=document.getElementById('tmPdfReset');
  if(reset)reset.onclick=()=>{trackerClosePdfDraftEditing();trackerApplyWeeklyPdfPreset('previous');trackerPdfSourceMode='full';trackerOpenWeeklyPdfSettings()};
}
trackerRefreshWeeklyPdfPreview=function(reset){
  if(trackerPdfSourceMode==='full'){refresh();return}
  return originalPreview(reset);
};
trackerOpenWeeklyPdfSettings=function(){
  trackerModal.classList.remove('ft-studio-modal');
  originalStudio();
  if(trackerPdfSourceMode==='full')configure();
};
trackerSaveWeeklyPdfDraft=async function(){
  if(trackerPdfSourceMode!=='full')return originalSave();
  const now=new Date(),old=weeklyPdfEditingDraft;
  const data=old&&old.sourceMode==='full'&&old.fullSnapshot?old.fullSnapshot:JSON.parse(JSON.stringify(snapshot()));
  const draft={
    id:old&&old.id?old.id:'pdf_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),
    name:old&&old.name?old.name:'Full Tracker '+now.toLocaleDateString(),
    savedAt:old&&old.savedAt?old.savedAt:now.toISOString(),
    updatedAt:now.toISOString(),
    sourceMode:'full',
    taskCount:(data.subjects||[]).reduce((n,s)=>n+(s.chapters||[]).length*(s.fields||[]).length,0),
    settings:JSON.parse(JSON.stringify(weeklyPdfSettings)),
    fullSnapshot:data,html:''
  };
  if(!await trackerWriteWeeklyPdfDraft(draft))return null;
  weeklyPdfEditingDraftId=draft.id;weeklyPdfEditingDraft=draft;
  trackerToastMsg(old?'Full Tracker draft updated':'Full Tracker draft saved');
  return draft;
};
trackerPrintSavedWeeklyPdfDraft=async function(id){
  const draft=await trackerGetWeeklyPdfDraft(id);
  if(!draft){trackerToastMsg('Choose a saved PDF draft first');return}
  if(draft.sourceMode!=='full')return originalPrintSaved(id);
  const previous=weeklyPdfSettings;
  weeklyPdfSettings={...weeklyPdfSettings,...JSON.parse(JSON.stringify(draft.settings||{}))};
  printDocument(draft.fullSnapshot||{subjects:[],cells:{}});
  weeklyPdfSettings=previous;
};
trackerOpenSavedWeeklyPdfDraftInStudio=async function(id){
  const draft=await trackerGetWeeklyPdfDraft(id);
  if(!draft){trackerToastMsg('Choose a saved PDF draft first');return}
  const mode=draft.sourceMode==='full'?'full':draft.sourceMode==='day'?'day':'week';
  if(mode!==trackerPdfSourceMode){
    trackerPdfSourceMode=mode;
    trackerOpenWeeklyPdfSettings();
  }
  if(mode==='full'){
    // The existing draft loader knows Weekly/Daily only; restore full mode after
    // it loads the saved settings and metadata without rewriting the draft.
    await originalOpenSaved(id);
    trackerPdfSourceMode='full';
    configure();
    refresh();
  }else{
    await originalOpenSaved(id);
    trackerModal.classList.remove('ft-studio-modal');
  }
};
btn.addEventListener('click',function(){
  if(!trackerState.subjects.length){trackerToastMsg('No subjects to print');return}
  trackerPdfSourceMode='full';
  trackerOpenWeeklyPdfSettings();
});
})();