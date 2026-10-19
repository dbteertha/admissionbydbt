/* PDF Studio only: delete layout rows or columns without touching Tracker data.
   Edits are snapshots of the existing PDF preview and support Undo. */
(()=>{
'use strict';
if(typeof trackerBindPdfTextEditing!=='function'||typeof trackerPdfEditSheet!=='function')return;
const originalBind=trackerBindPdfTextEditing;
const undoStack=[];
function cleanCurrent(){
  const current=document.getElementById('pdfPreviewSheet');
  return current?trackerPdfCleanSheet(current).outerHTML:'';
}
function pushUndo(){
  const html=cleanCurrent();
  if(!html)return false;
  undoStack.push(html);
  if(undoStack.length>20)undoStack.shift();
  return true;
}
function undo(){
  const previous=undoStack.pop();
  if(!previous)return;
  trackerPdfWorkingHtml=previous;
  if(weeklyPdfEditingDraft)weeklyPdfEditingDraft.html=previous;
  trackerRefreshWeeklyPdfPreview(false);
  trackerToastMsg('PDF layout change undone');
}
function removePart(tableId,kind,index){
  const preview=document.getElementById('pdfPreviewSheet');
  if(!preview)return;
  const card=[...preview.querySelectorAll('.wps-subject')].find(x=>x.dataset.wpsSub===tableId);
  const table=card?.querySelector('table');
  if(!table)return;
  const count=kind==='row'?table.querySelectorAll('tbody tr').length:table.querySelectorAll('thead th').length;
  if(index<0||index>=count)return;
  if(kind==='column'&&count<=1){trackerToastMsg('Keep at least one PDF column');return}
  if(!pushUndo())return;
  trackerPdfEditSheet(sheet=>{
    const target=[...sheet.querySelectorAll('.wps-subject')].find(x=>x.dataset.wpsSub===tableId);
    const grid=target?.querySelector('table');
    if(!grid)return;
    if(kind==='row'){
      grid.querySelectorAll('tbody tr')[index]?.remove();
    }else{
      grid.querySelectorAll('tr').forEach(row=>row.children[index]?.remove());
      const remaining=grid.querySelectorAll('thead th').length;
      if(remaining>0){
        grid.querySelectorAll('tr').forEach(row=>
          [...row.children].forEach(cell=>cell.style.setProperty('width',(100/remaining)+'%','important'))
        );
        target.dataset.pdfCustomColumns='1';
      }
    }
  },false);
  trackerToastMsg((kind==='row'?'Row':'Column')+' removed from PDF only — Undo available');
}
function makeDelete(container,label,fn){
  const shell=document.createElement('span');
  shell.className='pdf-edit-controls dbt-pdf-delete-wrap';
  const button=document.createElement('button');
  button.type='button';button.className='dbt-pdf-delete-button';
  button.textContent='×';button.title=label;button.setAttribute('aria-label',label);
  button.onpointerdown=e=>e.stopPropagation();
  button.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};
  shell.appendChild(button);
  container.appendChild(shell);
}
function addDeleteControls(){
  const preview=document.getElementById('pdfPreviewSheet');
  if(!preview)return;
  preview.querySelectorAll('.wps-subject').forEach(card=>{
    const id=card.dataset.wpsSub,table=card.querySelector('table');
    if(!id||!table)return;
    const headings=[...table.querySelectorAll('thead th')];
    headings.forEach((th,i)=>{
      makeDelete(th,'Delete PDF column: '+th.textContent.trim(),()=>removePart(id,'column',i));
    });
    const rows=[...table.querySelectorAll('tbody tr')];
    rows.forEach((tr,i)=>{
      const first=tr.querySelector('td');
      if(first)makeDelete(first,'Delete this PDF row',()=>removePart(id,'row',i));
    });
  });
  const toolbar=document.querySelector('#tmPdfPreviewHost .pdf-preview-toolbar');
  if(toolbar){
    const button=document.createElement('button');
    button.type='button';button.className='dbt-pdf-undo';
    button.textContent='↶ Undo delete';
    button.disabled=undoStack.length===0;
    button.onclick=e=>{e.preventDefault();undo()};
    toolbar.appendChild(button);
    const help=toolbar.querySelector('small');
    if(help)help.textContent='Hover a row or column heading for × Delete • Undo restores PDF-only edits';
  }
}
trackerBindPdfTextEditing=function(){
  const result=originalBind.apply(this,arguments);
  addDeleteControls();
  return result;
};
const style=document.createElement('style');
style.textContent=`
#pdfPreviewSheet .wps-subject th,#pdfPreviewSheet .wps-subject td:first-child{position:relative}
#pdfPreviewSheet .dbt-pdf-delete-wrap{position:absolute!important;top:0!important;right:0!important;z-index:15!important;display:block!important;width:auto!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s}
#pdfPreviewSheet th:hover>.dbt-pdf-delete-wrap,#pdfPreviewSheet td:hover>.dbt-pdf-delete-wrap,#pdfPreviewSheet th:focus-within>.dbt-pdf-delete-wrap,#pdfPreviewSheet td:focus-within>.dbt-pdf-delete-wrap{opacity:1;visibility:visible;pointer-events:auto}
#pdfPreviewSheet .dbt-pdf-delete-button{width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;padding:0!important;display:grid!important;place-items:center!important;background:#74232c!important;border:1px solid #aa515b!important;border-radius:4px!important;color:#fff!important;font-size:13px!important;line-height:1!important;cursor:pointer!important}
#pdfPreviewSheet .dbt-pdf-delete-button:hover{background:#9d2c36!important}
.dbt-pdf-undo{border:1px solid #4b596c;border-radius:6px;background:#152235;color:#ebf1fa;padding:5px 10px;font-size:11px;cursor:pointer}
.dbt-pdf-undo:disabled{opacity:.35;cursor:default}
@media print{.dbt-pdf-delete-wrap,.dbt-pdf-undo{display:none!important}}
`;
document.head.appendChild(style);
})();
