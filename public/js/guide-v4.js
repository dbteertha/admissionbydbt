/* Admission by DBT — Admission Guide + My Exams Wallpaper V4 */
(function(){
'use strict';

const DATA_URL='/data/admission-criteria-v2.json';
const root=document.getElementById('infoCenter');
if(!root)return;

const $=id=>document.getElementById(id);
const search=$('guideSearch'),clearSearch=$('guideClearSearch'),host=$('categoryCharts');
const typeHost=$('guideTypeFilters'),calcHost=$('guideCalcFilters'),divisionHost=$('guideDivisionFilters'),sortHost=$('guideSortFilters');
const resultMeta=$('guideResultsMeta'),filterToggle=$('guideFilterToggle'),filterPanel=$('guideFilterPanel'),activeCount=$('guideActiveFilterCount'),resetBtn=$('guideResetFilters');
const compareButton=$('guideCompareButton'),compareCount=$('guideCompareCount'),compareTray=$('guideCompareTray'),compareBackdrop=$('guideCompareBackdrop'),compareBody=$('guideCompareBody'),compareClose=$('guideCompareClose');

let items=[],sortMode='gpa-desc';
const selectedTypes=new Set(),selectedCalc=new Set(),selectedDivisions=new Set(),selectedCompare=new Set(),expanded=new Set();

const bnDigits=value=>String(value).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[Number(d)]);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const typeLabel=t=>t==='medical'?'মেডিকেল':t==='engineering'?'ইঞ্জিনিয়ারিং':'বিশ্ববিদ্যালয়';
const gpaLabel=x=>String(x.gpaLabel||'স্পষ্ট মোট GPA শর্ত নেই').replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[Number(d)]);

function filteredRows(){
  const q=(search?.value||'').trim().toLowerCase();
  const rows=items.filter(x=>{
    if(selectedTypes.size&&!selectedTypes.has(x.type))return false;
    if(selectedCalc.size&&!selectedCalc.has(x.calculator?'yes':'no'))return false;
    if(selectedDivisions.size&&!selectedDivisions.has(x.division))return false;
    if(q){
      const hay=[x.name,x.id,x.seats,x.eligibility,x.examType,x.marks,x.meritMethod,x.division,typeLabel(x.type),gpaLabel(x)].join(' ').toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  });
  rows.sort((a,b)=>{
    if(sortMode==='name')return String(a.name).localeCompare(String(b.name),'bn');
    const av=Number.isFinite(a.gpaSort)?a.gpaSort:null,bv=Number.isFinite(b.gpaSort)?b.gpaSort:null;
    if(av==null&&bv==null)return String(a.name).localeCompare(String(b.name),'bn');
    if(av==null)return 1;if(bv==null)return -1;
    if(av===bv)return String(a.name).localeCompare(String(b.name),'bn');
    return sortMode==='gpa-asc'?av-bv:bv-av;
  });
  return rows;
}

function filterCount(){
  return selectedTypes.size+selectedCalc.size+selectedDivisions.size+(sortMode==='gpa-desc'?0:1);
}
function syncFilterUi(){
  typeHost?.querySelectorAll('[data-guide-type]').forEach(b=>b.classList.toggle('active',selectedTypes.has(b.dataset.guideType)));
  calcHost?.querySelectorAll('[data-guide-calc]').forEach(b=>b.classList.toggle('active',selectedCalc.has(b.dataset.guideCalc)));
  divisionHost?.querySelectorAll('[data-guide-division]').forEach(b=>b.classList.toggle('active',selectedDivisions.has(b.dataset.guideDivision)));
  sortHost?.querySelectorAll('[data-guide-sort]').forEach(b=>b.classList.toggle('active',sortMode===b.dataset.guideSort));
  const n=filterCount();
  if(activeCount)activeCount.textContent=bnDigits(n);
  if(filterToggle){filterToggle.classList.toggle('active',n>0);filterToggle.setAttribute('aria-expanded',String(filterPanel?.classList.contains('open')))}
  if(clearSearch)clearSearch.hidden=!(search?.value||'').trim();
}

function cardHtml(x){
  const selected=selectedCompare.has(x.id),open=expanded.has(x.id);
  return '<article class="guide-v4-card type-'+esc(x.type)+(open?' expanded':'')+'" data-guide-card="'+esc(x.id)+'">'+
    '<div class="guide-v4-card-head">'+
      '<div><div class="guide-v4-kicker">'+typeLabel(x.type)+'</div><h3>'+esc(x.name)+'</h3></div>'+
      '<span class="guide-v4-division">'+esc(x.division)+'</span>'+
    '</div>'+
    '<div class="guide-v4-badges">'+
      '<span class="gpa">'+esc(gpaLabel(x))+'</span>'+
      '<span class="'+(x.calculator?'calc-yes':'calc-no')+'">'+(x.calculator?'✓ ক্যালকুলেটর চলে':'× ক্যালকুলেটর চলে না')+'</span>'+
    '</div>'+
    '<div class="guide-v4-quick">'+
      '<div><span>আসন</span><b>'+esc(x.seats)+'</b></div>'+
      '<div><span>পরীক্ষা</span><b>'+esc(String(x.examType||'').split(';')[0])+'</b></div>'+
    '</div>'+
    '<div class="guide-v4-details">'+
      '<div><b>আবেদন যোগ্যতা</b><p>'+esc(x.eligibility)+'</p></div>'+
      '<div><b>পরীক্ষার ধরন</b><p>'+esc(x.examType)+'</p></div>'+
      '<div><b>বিষয়ভিত্তিক নম্বর / প্রশ্ন</b><p>'+esc(x.marks)+'</p></div>'+
      '<div><b>ফলাফল / মেধা নির্ণয়</b><p>'+esc(x.meritMethod)+'</p></div>'+
    '</div>'+
    '<div class="guide-v4-actions">'+
      '<button type="button" data-v4-compare="'+esc(x.id)+'" class="'+(selected?'active':'')+'" aria-pressed="'+String(selected)+'">'+(selected?'নির্বাচিত ✓':'তুলনায় নিন')+'</button>'+
      '<button type="button" data-v4-details="'+esc(x.id)+'" aria-expanded="'+String(open)+'">'+(open?'কম দেখুন':'বিস্তারিত')+'</button>'+
    '</div>'+
  '</article>';
}

function renderCompareTray(){
  const rows=items.filter(x=>selectedCompare.has(x.id));
  if(compareCount)compareCount.textContent=bnDigits(rows.length);
  if(compareButton)compareButton.disabled=rows.length<2;
  if(!compareTray)return;
  compareTray.innerHTML=rows.length
    ?'<div class="guide-v4-selected"><span>তুলনার জন্য</span>'+rows.map(x=>'<button type="button" data-v4-remove="'+esc(x.id)+'">'+esc(x.name)+' <b>×</b></button>').join('')+'</div>'
    :'';
  compareTray.querySelectorAll('[data-v4-remove]').forEach(b=>b.onclick=()=>{selectedCompare.delete(b.dataset.v4Remove);renderGuide()});
}

function renderGuide(){
  syncFilterUi();
  const rows=filteredRows();
  if(resultMeta){
    const sortText=sortMode==='gpa-desc'?'সর্বোচ্চ GPA আগে':sortMode==='gpa-asc'?'সর্বনিম্ন GPA আগে':'নাম অনুযায়ী';
    resultMeta.innerHTML='<b>'+bnDigits(rows.length)+'টি অপশন</b><span>'+sortText+' • একাধিক ফিল্টার একসাথে কাজ করছে</span>';
  }
  host.innerHTML=rows.length?rows.map(cardHtml).join(''):'<div class="guide-v4-empty"><b>কোনো অপশন মিলছে না</b><span>এক বা একাধিক ফিল্টার সরিয়ে আবার দেখুন।</span></div>';
  host.querySelectorAll('[data-v4-compare]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.v4Compare;selectedCompare.has(id)?selectedCompare.delete(id):selectedCompare.add(id);renderGuide();
  });
  host.querySelectorAll('[data-v4-details]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.v4Details;expanded.has(id)?expanded.delete(id):expanded.add(id);renderGuide();
  });
  renderCompareTray();
}

function toggleSet(set,value){set.has(value)?set.delete(value):set.add(value);renderGuide()}
function resetFilters(){
  selectedTypes.clear();selectedCalc.clear();selectedDivisions.clear();sortMode='gpa-desc';
  if(search)search.value='';
  renderGuide();
}
function openCompare(){
  const rows=items.filter(x=>selectedCompare.has(x.id));
  if(rows.length<2)return;
  const fields=[
    ['ধরন',x=>typeLabel(x.type)],['বিভাগ',x=>x.division],['GPA',x=>gpaLabel(x)],['ক্যালকুলেটর',x=>x.calculator?'চলে':'চলে না'],
    ['আসন',x=>x.seats],['যোগ্যতা',x=>x.eligibility],['পরীক্ষা',x=>x.examType],['নম্বর / প্রশ্ন',x=>x.marks],['মেধা নির্ণয়',x=>x.meritMethod]
  ];
  compareBody.innerHTML='<div class="guide-compare-table-wrap"><table class="guide-compare-table"><thead><tr><th>তুলনা</th>'+rows.map(x=>'<th>'+esc(x.name)+'</th>').join('')+'</tr></thead><tbody>'+
    fields.map(([label,get])=>'<tr><th>'+label+'</th>'+rows.map(x=>'<td>'+esc(get(x))+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
  compareBackdrop.classList.add('open');compareBackdrop.setAttribute('aria-hidden','false');document.body.classList.add('dbt-modal-lock');
}
function closeCompare(){
  compareBackdrop.classList.remove('open');compareBackdrop.setAttribute('aria-hidden','true');document.body.classList.remove('dbt-modal-lock');
}

async function initGuide(){
  try{
    const r=await fetch(DATA_URL,{cache:'force-cache'});if(!r.ok)throw new Error('guide_load_failed');
    const j=await r.json();items=Array.isArray(j.items)?j.items:[];
    const order=['ঢাকা','চট্টগ্রাম','রাজশাহী','খুলনা','সিলেট','রংপুর','দেশব্যাপী'];
    const present=new Set(items.map(x=>x.division));
    divisionHost.innerHTML=order.filter(x=>present.has(x)).map(x=>'<button type="button" class="guide-v4-chip" data-guide-division="'+esc(x)+'">'+esc(x)+'</button>').join('');
    typeHost.querySelectorAll('[data-guide-type]').forEach(b=>b.onclick=()=>toggleSet(selectedTypes,b.dataset.guideType));
    calcHost.querySelectorAll('[data-guide-calc]').forEach(b=>b.onclick=()=>toggleSet(selectedCalc,b.dataset.guideCalc));
    divisionHost.querySelectorAll('[data-guide-division]').forEach(b=>b.onclick=()=>toggleSet(selectedDivisions,b.dataset.guideDivision));
    sortHost.querySelectorAll('[data-guide-sort]').forEach(b=>b.onclick=()=>{sortMode=b.dataset.guideSort;renderGuide()});
    search.oninput=renderGuide;
    clearSearch.onclick=()=>{search.value='';renderGuide();search.focus()};
    resetBtn.onclick=resetFilters;
    filterToggle.onclick=()=>{filterPanel.classList.toggle('open');syncFilterUi()};
    compareButton.onclick=openCompare;compareClose.onclick=closeCompare;compareBackdrop.onclick=e=>{if(e.target===compareBackdrop)closeCompare()};
    renderGuide();
  }catch(e){
    host.innerHTML='<div class="guide-v4-empty"><b>ভর্তি তথ্য লোড করা যাচ্ছে না</b><span>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</span></div>';
  }
}

/* ---------------- My Exams Wallpaper Studio ---------------- */
const wallpaperBtn=$('myExamsWallpaperButton');
let wallpaperBackdrop=null,wallpaperCanvas=null,wallpaperMain=null;
const wallpaperThemes={
  midnight:{label:'রাত',bg1:'#050816',bg2:'#151532',text:'#f8f9ff',muted:'#aab5d0',accent:'#946df2',accent2:'#44d8e8'},
  ocean:{label:'নীল',bg1:'#03151e',bg2:'#0a3442',text:'#f5fdff',muted:'#a6cbd2',accent:'#39cbe5',accent2:'#42b797'},
  violet:{label:'বেগুনি',bg1:'#100719',bg2:'#321746',text:'#fff8ff',muted:'#d0b6da',accent:'#ef70b0',accent2:'#9270ef'},
  forest:{label:'সবুজ',bg1:'#06150f',bg2:'#12372b',text:'#f5fff9',muted:'#acd1bf',accent:'#55d6a8',accent2:'#e0b95c'},
  light:{label:'সাদা',bg1:'#f8f9fc',bg2:'#e7edf7',text:'#172033',muted:'#627089',accent:'#5d63d9',accent2:'#219db6'}
};
const wallpaperBackgrounds={glow:'গ্লো',grid:'গ্রিড',stars:'স্টার',clean:'ক্লিন'};
let wallTheme='midnight',wallBg='glow';

function safeEvents(){try{return Array.isArray(all)?all:[]}catch(e){return []}}
function safeKey(e){try{return eventKey(e)}catch(err){return String(e.title||'')+'|'+String(e.date||'')}}
function myExams(){return safeEvents().filter(e=>{try{return starred.has(safeKey(e))}catch(err){return false}}).sort((a,b)=>new Date(a.date)-new Date(b.date))}
function wallTitle(e){try{return calendarShortTitle(e)}catch(err){return String(e.title||'')}}
function dayDiff(e){
  try{
    const now=bdDate(new Date().toISOString()),target=bdDate(e.date);
    const a=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()),b=Date.UTC(target.getFullYear(),target.getMonth(),target.getDate());
    return Math.max(0,Math.ceil((b-a)/86400000));
  }catch(err){return Math.max(0,Math.ceil((new Date(e.date)-new Date())/86400000))}
}
function wallRound(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function wallWrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=2,align='center'){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test}
  if(line)lines.push(line);ctx.textAlign=align;
  lines.slice(0,maxLines).forEach((s,i)=>ctx.fillText(s,x,y+i*lineHeight,maxWidth));
  return Math.min(lines.length,maxLines)*lineHeight;
}
function ensureWallpaperUi(){
  if(wallpaperBackdrop)return;
  const wrap=document.createElement('div');
  wrap.innerHTML='<div class="wallpaper-v4-backdrop" id="wallpaperV4Backdrop" aria-hidden="true">'+
    '<section class="wallpaper-v4-modal" role="dialog" aria-modal="true" aria-labelledby="wallpaperV4Title">'+
      '<header class="wallpaper-v4-head"><div><span>MY EXAMS • 9:16</span><h2 id="wallpaperV4Title">আমার ভর্তি লকস্ক্রিন</h2><p>শুধু My Exams থেকে — মূল টার্গেট, দিন বাকি, অন্য পরীক্ষা ও নিজের কথা।</p></div><button type="button" id="wallpaperV4Close" aria-label="বন্ধ করুন">×</button></header>'+
      '<div class="wallpaper-v4-body"><div class="wallpaper-v4-controls">'+
        '<label><b>মূল টার্গেট</b><select id="wallpaperV4Target"></select></label>'+
        '<div class="wallpaper-v4-option"><b>থিম</b><div id="wallpaperV4Themes"></div></div>'+
        '<div class="wallpaper-v4-option"><b>ব্যাকগ্রাউন্ড</b><div id="wallpaperV4Backgrounds"></div></div>'+
        '<div class="wallpaper-v4-lines"><b>নিজের লাইন • ইচ্ছেমতো বদলান</b><input id="wallpaperV4Line1" maxlength="70" value="আজকের কাজ আজই শেষ করব।"><input id="wallpaperV4Line2" maxlength="70" value="রিভিশন > নতুন টপিক"><input id="wallpaperV4Line3" maxlength="70" value="লক্ষ্য পরিষ্কার। কাজ নিয়মিত।"></div>'+
        '<div class="wallpaper-v4-tip">উপরে ঘণ্টা/মিনিট নয় — শুধু মূল টার্গেটের দিন বাকি। নিচে আপনার অন্য My Exams থাকবে।</div>'+
      '</div><div class="wallpaper-v4-preview"><canvas id="wallpaperV4Canvas" width="1080" height="1920"></canvas><button type="button" id="wallpaperV4Download">PNG ডাউনলোড</button></div></div>'+
    '</section></div>';
  document.body.appendChild(wrap.firstElementChild);
  wallpaperBackdrop=$('wallpaperV4Backdrop');wallpaperCanvas=$('wallpaperV4Canvas');wallpaperMain=$('wallpaperV4Target');
  $('wallpaperV4Close').onclick=closeWallpaper;wallpaperBackdrop.onclick=e=>{if(e.target===wallpaperBackdrop)closeWallpaper()};
  wallpaperMain.onchange=drawWallpaper;
  ['wallpaperV4Line1','wallpaperV4Line2','wallpaperV4Line3'].forEach(id=>$(id).oninput=drawWallpaper);
  $('wallpaperV4Download').onclick=downloadWallpaper;
}
function wallChoices(){
  const th=$('wallpaperV4Themes'),bg=$('wallpaperV4Backgrounds');
  th.innerHTML=Object.entries(wallpaperThemes).map(([k,v])=>'<button type="button" data-wall-theme="'+k+'" class="'+(k===wallTheme?'active':'')+'">'+v.label+'</button>').join('');
  bg.innerHTML=Object.entries(wallpaperBackgrounds).map(([k,v])=>'<button type="button" data-wall-bg="'+k+'" class="'+(k===wallBg?'active':'')+'">'+v+'</button>').join('');
  th.querySelectorAll('[data-wall-theme]').forEach(b=>b.onclick=()=>{wallTheme=b.dataset.wallTheme;wallChoices();drawWallpaper()});
  bg.querySelectorAll('[data-wall-bg]').forEach(b=>b.onclick=()=>{wallBg=b.dataset.wallBg;wallChoices();drawWallpaper()});
}
function wallBackground(ctx,t){
  const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,t.bg1);g.addColorStop(1,t.bg2);ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
  if(wallBg==='glow'){
    const a=ctx.createRadialGradient(860,330,0,860,330,700);a.addColorStop(0,t.accent+'66');a.addColorStop(1,t.accent+'00');ctx.fillStyle=a;ctx.fillRect(0,0,1080,1050);
    const b=ctx.createRadialGradient(110,1500,0,110,1500,650);b.addColorStop(0,t.accent2+'38');b.addColorStop(1,t.accent2+'00');ctx.fillStyle=b;ctx.fillRect(0,900,1080,1020);
  }else if(wallBg==='grid'){
    ctx.strokeStyle=t.accent+'24';ctx.lineWidth=1;
    for(let x=0;x<=1080;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1920);ctx.stroke()}
    for(let y=0;y<=1920;y+=54){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y);ctx.stroke()}
  }else if(wallBg==='stars'){
    ctx.fillStyle=t.accent2+'78';for(let i=0;i<80;i++){const x=(i*197)%1025+25,y=(i*331)%1840+35,r=i%5===0?2.5:1.2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  }
}
function selectedMain(){
  const exams=myExams();if(!exams.length)return null;
  const raw=wallpaperMain?.value||'';return exams.find(e=>safeKey(e)===raw)||exams[0];
}
function drawWallpaper(){
  if(!wallpaperCanvas)return;
  const ctx=wallpaperCanvas.getContext('2d'),t=wallpaperThemes[wallTheme],main=selectedMain(),exams=myExams();
  ctx.clearRect(0,0,1080,1920);wallBackground(ctx,t);
  if(!main){ctx.fillStyle=t.text;ctx.font='800 46px sans-serif';ctx.textAlign='center';ctx.fillText('My Exams-এ পরীক্ষা যোগ করুন',540,900);return}
  ctx.textAlign='center';ctx.fillStyle=t.muted;ctx.font='800 26px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('মূল টার্গেট',540,220);
  ctx.fillStyle=t.text;ctx.font='900 54px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';wallWrap(ctx,wallTitle(main),540,300,860,64,2,'center');
  ctx.fillStyle=t.text;ctx.font='950 255px system-ui,sans-serif';ctx.fillText(String(dayDiff(main)),540,645);
  ctx.fillStyle=t.accent2;ctx.font='900 36px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('দিন বাকি',540,705);

  const boxY=790;wallRound(ctx,88,boxY,904,610,42);ctx.fillStyle=wallTheme==='light'?'rgba(255,255,255,.73)':'rgba(255,255,255,.055)';ctx.fill();ctx.strokeStyle=t.accent+'48';ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle=t.muted;ctx.font='850 28px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('আমার অন্যান্য পরীক্ষা',140,boxY+62);
  const others=exams.filter(e=>safeKey(e)!==safeKey(main));
  if(!others.length){
    ctx.fillStyle=t.text;ctx.font='750 29px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('আর কোনো পরীক্ষা যোগ করা নেই',140,boxY+130);
  }else{
    others.slice(0,7).forEach((e,i)=>{
      const y=boxY+122+i*64;ctx.fillStyle=i%2?t.accent2:t.accent;ctx.beginPath();ctx.arc(151,y-8,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=t.text;ctx.textAlign='left';ctx.font='800 27px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(wallTitle(e).slice(0,38),178,y,600);
      ctx.fillStyle=t.muted;ctx.textAlign='right';ctx.font='750 22px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(bnDigits(dayDiff(e))+' দিন',928,y);
    });
    if(others.length>7){ctx.textAlign='right';ctx.fillStyle=t.muted;ctx.font='700 20px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('+ '+bnDigits(others.length-7)+'টি আরও পরীক্ষা',928,boxY+588)}
  }

  let y=1490;ctx.textAlign='center';
  ['wallpaperV4Line1','wallpaperV4Line2','wallpaperV4Line3'].map(id=>$(id)?.value.trim()).filter(Boolean).forEach((line,i)=>{
    ctx.fillStyle=i===0?t.text:t.muted;ctx.font=(i===0?'850 34px':'720 29px')+' "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    y+=wallWrap(ctx,line,540,y,850,i===0?46:40,2,'center')+18;
  });
  ctx.fillStyle=t.muted;ctx.font='750 20px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('admissionbydbt.vercel.app',540,1850);
}
async function openWallpaper(){
  const exams=myExams();if(!exams.length){alert('ওয়ালপেপার বানাতে আগে My Exams-এ অন্তত একটি পরীক্ষা যোগ করুন।');return}
  ensureWallpaperUi();
  wallpaperMain.innerHTML=exams.map(e=>'<option value="'+esc(safeKey(e))+'">'+esc(wallTitle(e))+'</option>').join('');
  let preferred='';try{preferred=countdownTargetKey||''}catch(e){}
  const main=exams.find(e=>safeKey(e)===preferred)||exams.find(e=>new Date(e.date)>=new Date())||exams[0];
  wallpaperMain.value=safeKey(main);wallChoices();drawWallpaper();
  wallpaperBackdrop.classList.add('open');wallpaperBackdrop.setAttribute('aria-hidden','false');document.body.classList.add('dbt-modal-lock');
}
function closeWallpaper(){if(!wallpaperBackdrop)return;wallpaperBackdrop.classList.remove('open');wallpaperBackdrop.setAttribute('aria-hidden','true');document.body.classList.remove('dbt-modal-lock')}
function downloadWallpaper(){
  drawWallpaper();const btn=$('wallpaperV4Download');const old=btn.textContent;btn.disabled=true;btn.textContent='PNG তৈরি হচ্ছে…';
  wallpaperCanvas.toBlob(blob=>{
    btn.disabled=false;btn.textContent=old;if(!blob)return alert('PNG তৈরি করা যায়নি।');
    const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='DBT-My-Exams-Lockscreen.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1600);
  },'image/png',1);
}
if(wallpaperBtn)wallpaperBtn.onclick=openWallpaper;
addEventListener('keydown',e=>{if(e.key==='Escape'){if(wallpaperBackdrop?.classList.contains('open'))closeWallpaper();else if(compareBackdrop?.classList.contains('open'))closeCompare()}});

initGuide();
})();