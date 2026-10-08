/* Admission by DBT — Bangladesh Admission Map V2 */
(function(){
'use strict';
const btn=document.getElementById('admissionMapButton'),backdrop=document.getElementById('admissionMapBackdrop');
if(!btn||!backdrop)return;
const $=id=>document.getElementById(id);
const list=$('admissionMapList'),search=$('admissionMapSearch'),filters=$('admissionMapFilters'),count=$('admissionMapSelectedCount');
const previewBtn=$('admissionMapPreviewButton'),selectStep=$('admissionMapSelectStep'),previewStep=$('admissionMapPreviewStep'),canvas=$('admissionMapCanvas');
const STORE='admissionbydbt-admission-map-v2';
let data=null,filter='all',selected=new Set();
try{selected=new Set(JSON.parse(localStorage.getItem(STORE)||'[]'))}catch(e){}
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[Number(d)]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const colors={engineering:'#23b8d4',university:'#7b58d2'};
const alias={
 du:['dhaka university','du iba'],aaub:['aviation and aerospace','aaub'],ku:['khulna university'],mist:['mist'],jnu:['jagannath university'],bup:['bup'],kuet:['kuet'],ru:['rajshahi university'],ruet:['ruet'],buet:['buet'],cuet:['cuet'],sust:['sust'],butex:['butex'],cu:['chittagong university'],cou:['comilla university']
};
const slots={AAUB:[58,235],RU:[58,485],RUET:[58,545],KU:[58,875],KUET:[58,938],SUST:[798,330],DU:[798,445],BUET:[798,505],JnU:[798,565],BUP:[798,625],MIST:[798,685],BUTEX:[798,745],CoU:[798,840],CU:[798,955],CUET:[798,1015]};

function save(){try{localStorage.setItem(STORE,JSON.stringify([...selected]))}catch(e){}}
async function loadData(){if(data)return data;const r=await fetch('/data/admission-map-v2.json',{cache:'force-cache'});if(!r.ok)throw new Error('map_load_failed');data=await r.json();selected=new Set([...selected].filter(id=>data.institutions.some(x=>x.id===id)));return data}
function myMatch(inst){
  let events=[];try{events=all.filter(e=>starred.has(eventKey(e)))}catch(e){}
  return events.some(e=>{const t=String(e.title||'').toLowerCase();return (alias[inst.id]||[]).some(a=>t.includes(a))});
}
function renderList(){
  const q=(search.value||'').trim().toLowerCase();
  const rows=data.institutions.filter(x=>(filter==='all'||x.type===filter)&&(!q||(x.name+' '+x.nameEn+' '+x.code).toLowerCase().includes(q)));
  list.innerHTML=rows.length?rows.map(x=>'<button type="button" class="admission-map-row'+(selected.has(x.id)?' active':'')+'" data-map-v2="'+x.id+'" aria-pressed="'+String(selected.has(x.id))+'"><span class="admission-map-check">'+(selected.has(x.id)?'✓':'')+'</span><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.code)+' • '+(x.type==='engineering'?'ইঞ্জিনিয়ারিং':'বিশ্ববিদ্যালয়')+'</small></span><i class="admission-map-cat '+x.type+'"></i></button>').join(''):'<div class="admission-map-empty">কোনো প্রতিষ্ঠান পাওয়া যায়নি।</div>';
  list.querySelectorAll('[data-map-v2]').forEach(b=>b.onclick=()=>{const id=b.dataset.mapV2;selected.has(id)?selected.delete(id):selected.add(id);save();renderList()});
  count.textContent=bn(selected.size)+'টি নির্বাচিত';previewBtn.disabled=!selected.size;
}
function divisionFill(name,active){
  if(!active)return '#e6e8ec';
  return {Dhaka:'#d9cdf7',Chattogram:'#bfeaf0',Rajshahi:'#f4d7e3',Khulna:'#d2ecde',Sylhet:'#f2dfb8',Rangpur:'#cddff4',Mymensingh:'#dbe8f5',Barishal:'#d8eee7'}[name]||'#dde2ea';
}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function textLines(ctx,text,maxWidth){
  const words=String(text).split(/\s+/),lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test}
  if(line)lines.push(line);return lines.slice(0,2);
}
function drawLabel(ctx,inst,loc){
  const slot=slots[inst.code]||[800,800],bx=slot[0],by=slot[1],w=225,c=colors[inst.type]||'#7b58d2';
  ctx.font='800 20px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
  const lines=textLines(ctx,inst.name,190),h=lines.length>1?68:54,edgeX=bx<540?bx+w:bx;
  ctx.strokeStyle=c;ctx.globalAlpha=.58;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(loc.x,loc.y);ctx.lineTo(edgeX,by+h/2);ctx.stroke();ctx.globalAlpha=1;
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(loc.x,loc.y,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(loc.x,loc.y,3.5,0,Math.PI*2);ctx.fill();
  round(ctx,bx,by,w,h,14);ctx.fillStyle='rgba(255,255,255,.97)';ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=c;ctx.fillRect(bx,by,6,h);
  ctx.fillStyle='#172033';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 20px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
  if(lines.length===1)ctx.fillText(lines[0],bx+16,by+h/2,w-24);else{ctx.fillText(lines[0],bx+16,by+23,w-24);ctx.fillText(lines[1],bx+16,by+47,w-24)}
}
function drawMap(){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1080,1440);
  const bg=ctx.createLinearGradient(0,0,1080,1440);bg.addColorStop(0,'#f9fbff');bg.addColorStop(.5,'#f6f0ff');bg.addColorStop(1,'#eefaf6');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1440);
  ctx.textAlign='center';ctx.fillStyle='#101826';ctx.font='900 48px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('বাংলাদেশ ভর্তি মানচিত্র ২০২৬–২৭',540,74);
  ctx.fillStyle='#68778c';ctx.font='700 21px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('নির্বাচিত বিশ্ববিদ্যালয়ের প্রতিনিধিত্বমূলক ক্যাম্পাস অবস্থান',540,112);
  const locs=data.locations.filter(l=>selected.has(l.institutionId)),activeDivs=new Set(locs.map(l=>l.division));
  data.divisionPaths.forEach(d=>{const p=new Path2D(d.path);ctx.fillStyle=divisionFill(d.name,activeDivs.has(d.name));ctx.fill(p);ctx.strokeStyle='#7c8797';ctx.lineWidth=2;ctx.stroke(p)});
  const labels={Rangpur:[365,355],Rajshahi:[345,535],Dhaka:[505,620],Mymensingh:[545,475],Sylhet:[700,520],Khulna:[408,760],Barishal:[535,900],Chattogram:[690,760]};
  ctx.font='700 13px system-ui,sans-serif';ctx.fillStyle='rgba(43,57,77,.42)';Object.entries(labels).forEach(([n,p])=>ctx.fillText(n,p[0],p[1]));
  data.institutions.filter(x=>selected.has(x.id)).forEach(inst=>{const loc=data.locations.find(l=>l.institutionId===inst.id&&l.id!=='aaub-dhaka')||data.locations.find(l=>l.institutionId===inst.id);if(loc)drawLabel(ctx,inst,loc)});
  data.locations.filter(l=>selected.has(l.institutionId)&&l.id==='aaub-dhaka').forEach(l=>{ctx.fillStyle='#23b8d4';ctx.beginPath();ctx.arc(l.x,l.y,7.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(l.x,l.y,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#526177';ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText('AAUB-D',l.x+10,l.y+4)});
  round(ctx,125,1282,830,82,22);ctx.fillStyle='rgba(255,255,255,.86)';ctx.fill();ctx.strokeStyle='rgba(40,58,82,.10)';ctx.stroke();
  ctx.textAlign='center';ctx.font='800 18px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillStyle='#36465c';ctx.fillText('ইঞ্জিনিয়ারিং ●   বিশ্ববিদ্যালয় ●   • পিন = ক্যাম্পাসের প্রতিনিধিত্বমূলক অবস্থান',540,1325);
  ctx.font='650 15px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillStyle='#768397';ctx.fillText('পিন পরীক্ষার কেন্দ্র নির্দেশ করে না • admissionbydbt.vercel.app',540,1403);
}
async function openMap(){
  try{await loadData()}catch(e){alert('মানচিত্রের তথ্য এখন লোড করা যাচ্ছে না।');return}
  selectStep.hidden=false;previewStep.hidden=true;search.value='';filter='all';
  filters.querySelectorAll('[data-map-filter]').forEach(x=>x.classList.toggle('active',x.dataset.mapFilter==='all'));renderList();
  backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.classList.add('dbt-modal-lock');
}
function closeMap(){backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.classList.remove('dbt-modal-lock')}
btn.onclick=openMap;$('admissionMapClose').onclick=closeMap;backdrop.onclick=e=>{if(e.target===backdrop)closeMap()};
search.oninput=renderList;filters.querySelectorAll('[data-map-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.mapFilter;filters.querySelectorAll('[data-map-filter]').forEach(x=>x.classList.toggle('active',x===b));renderList()});
$('admissionMapAll').onclick=()=>{data.institutions.forEach(x=>selected.add(x.id));save();renderList()};$('admissionMapClear').onclick=()=>{selected.clear();save();renderList()};
$('admissionMapFromMyExams').onclick=()=>{const mine=data.institutions.filter(myMatch);if(!mine.length){const b=$('admissionMapFromMyExams');b.textContent='My Exams-এ মানচিত্রযোগ্য প্রতিষ্ঠান নেই';setTimeout(()=>b.textContent='★ আমার পরীক্ষা থেকে',1500);return}selected=new Set(mine.map(x=>x.id));save();renderList()};
previewBtn.onclick=()=>{drawMap();selectStep.hidden=true;previewStep.hidden=false};$('admissionMapBack').onclick=()=>{previewStep.hidden=true;selectStep.hidden=false;renderList()};
$('admissionMapDownload').onclick=()=>{drawMap();canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='DBT-Bangladesh-Admission-Map-2026-27.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/png',1)};
addEventListener('keydown',e=>{if(e.key==='Escape'&&backdrop.classList.contains('open'))closeMap()});
})();