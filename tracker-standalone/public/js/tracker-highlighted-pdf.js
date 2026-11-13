/* Highlighted cells -> existing PDF Studio. Read-only: no tracker data updates. */
(()=>{
'use strict';
if(typeof trackerPdfRefs!=='function'||typeof trackerOpenWeeklyPdfSettings!=='function')return;
const originalPdfRefs=trackerPdfRefs;
const highlights=window.dbtHighlightDates;
if(!highlights)return;
function highlightedRefs(date=highlights.filterDate()){
  const results=[];
  // Use the same exact date filter as the Highlighted page.
  for(const s of trackerState.subjects||[]){
    for(const ch of s.chapters||[]){
      for(const f of trackerVisibleFields(s)){
        const cell=trackerGetCell(s.id,ch.id,f.id);
        if(!highlights.matches(f,cell,date))continue;
        results.push({s,ch,f,cell,key:trackerCellKey(s.id,ch.id,f.id)});
      }
    }
  }
  return results;
}
trackerPdfRefs=function(){
  if(trackerPdfSourceMode==='highlighted')return highlightedRefs();
  return originalPdfRefs();
};
function openHighlightedStudio(){
  const refs=highlightedRefs();
  if(!refs.length){
    trackerToastMsg('No currently highlighted cells to print');
    return;
  }
  trackerPdfSourceMode='highlighted';
  const path=highlights.url(highlights.filterDate(),true);
  if(location.pathname+location.search!==path)history.pushState({trackerRoute:'pdf',mode:'highlighted'},'',path);
  trackerOpenWeeklyPdfSettings();
}
// Identify the selected date on a newly generated PDF, without changing saved drafts.
const originalPrintSheet=trackerBuildWeeklyPrintSheet;
trackerBuildWeeklyPrintSheet=function(){
  const fresh=!trackerPdfWorkingHtml&&!(weeklyPdfEditingDraft&&weeklyPdfEditingDraft.html);
  const sheet=originalPrintSheet.apply(this,arguments);
  const date=highlights.filterDate();
  if(fresh&&trackerPdfSourceMode==='highlighted'&&date&&sheet){
    const title=sheet.querySelector('.wps-head b');
    if(title)title.textContent='HIGHLIGHTED CELLS · '+new Date(date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}).toUpperCase();
  }
  return sheet;
};
function addButton(){
  const tools=document.querySelector('#tracker .tracker-tools');
  if(!tools||document.getElementById('trackerHighlightedPdfBtn'))return;
  const button=document.createElement('button');
  button.id='trackerHighlightedPdfBtn';
  button.className='btn dbt-highlight-pdf-btn';
  button.type='button';
  button.textContent='Print highlighted';
  button.title='Open currently highlighted cells in PDF Studio';
  button.setAttribute('aria-label','Print highlighted cells in PDF Studio');
  button.onclick=openHighlightedStudio;
  const select=tools.querySelector('#trackerSelectAllBtn');
  if(select)tools.insertBefore(button,select);
  else tools.appendChild(button);
}
const style=document.createElement('style');
style.textContent=`
#trackerHighlightedPdfBtn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-weight:650}
@media(max-width:700px){#trackerHighlightedPdfBtn{font-size:10px;padding-inline:7px}}
`;
document.head.appendChild(style);
addButton();
// On a direct URL load, the inline route handler ran before the extensions.
// Refresh once with the highlighted source, rather than leaving a weekly preview.
if(trackerPath()==='/tracker/pdf/highlighted'&&trackerPdfSourceMode==='highlighted'&&document.getElementById('tmPdfPreviewHost'))trackerRefreshWeeklyPdfPreview(true);
})();