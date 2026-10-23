/* Highlighted cells -> existing PDF Studio. Read-only: no tracker data updates. */
(()=>{
'use strict';
if(typeof trackerPdfRefs!=='function'||typeof trackerOpenWeeklyPdfSettings!=='function')return;
const originalPdfRefs=trackerPdfRefs;
function highlightedRefs(){
  const results=[];
  const search=document.getElementById('trackerSearch');
  // Printing is independent of search/filter: include all currently active highlights.
  for(const s of trackerState.subjects||[]){
    for(const ch of s.chapters||[]){
      for(const f of trackerVisibleFields(s)){
        const cell=trackerGetCell(s.id,ch.id,f.id);
        if(!trackerTaskHighlightActive(f,cell))continue;
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
  const path='/tracker/pdf/highlighted';
  if(trackerPath()!==path)history.pushState({trackerRoute:'pdf',mode:'highlighted'},'',path);
  trackerOpenWeeklyPdfSettings();
}
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
})();