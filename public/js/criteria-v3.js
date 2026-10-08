/* Admission by DBT — Criteria V3 + My Exams Wallpaper */
(function(){
  'use strict';

  const DATA_URL='/data/admission-criteria-v1.json';

  const TYPE_META={
    medical:{label:'মেডিকেল',accent:'#34d399'},
    engineering:{label:'ইঞ্জিনিয়ারিং',accent:'#22d3ee'},
    varsity:{label:'বিশ্ববিদ্যালয়',accent:'#818cf8'}
  };
  const DIVISION_LABELS={
    dhaka:'ঢাকা',
    chattogram:'চট্টগ্রাম',
    rajshahi:'রাজশাহী',
    khulna:'খুলনা',
    sylhet:'সিলেট',
    rangpur:'রংপুর',
    multi:'একাধিক / সারাদেশ'
  };
  const DIVISION_BY_ID={
    'med-dental':'multi','afmc-amc':'multi',
    buet:'dhaka',butex:'dhaka',iut:'dhaka',mist:'dhaka',
    'du-ka':'dhaka','du-kha':'dhaka','ju-a-d':'dhaka','ju-b-c':'dhaka',
    'jnu-a':'dhaka','jnu-b-d':'dhaka','bup-fst':'dhaka','bup-fass-fsss':'dhaka',
    ruet:'rajshahi','ru-c':'rajshahi','ru-a':'rajshahi',
    kuet:'khulna','ku-a-b':'khulna','ku-c':'khulna',
    cuet:'chattogram','cu-a':'chattogram','cu-b-d':'chattogram','cou-a':'chattogram','cou-b':'chattogram',
    'sust-a':'sylhet','sust-b':'sylhet',
    'hstu-a-b':'rangpur','hstu-d':'rangpur',
    'gst-a':'multi','gst-b':'multi','agri-cluster':'multi'
  };

  const GPA_BY_ID={
    'med-dental':8.5,'afmc-amc':8.5,buet:9,iut:9,
    'sust-a':6.5,'du-ka':8,'ju-a-d':9,'jnu-a':7.5,'ru-c':8,'cu-a':8,'bup-fst':9,'gst-a':7,
    'ku-a-b':8,'cou-a':7,'agri-cluster':8.5,'hstu-a-b':7.5,
    'du-kha':7.5,'ju-b-c':7.5,'jnu-b-d':6.5,'ru-a':7,'cu-b-d':7.5,'bup-fass-fsss':8.5,
    'gst-b':6,'ku-c':7,'sust-b':6,'cou-b':6,'hstu-d':6
  };

  const THEMES={
    blue:{label:'নীল',accent:'#45d7ff',accent2:'#5168ff',text:'#f7fbff',muted:'#94a9c5'},
    violet:{label:'বেগুনি',accent:'#a78bfa',accent2:'#6d5dfc',text:'#fbf9ff',muted:'#a79bbd'},
    green:{label:'সবুজ',accent:'#45e0a8',accent2:'#119b78',text:'#f5fffb',muted:'#92b9aa'},
    rose:{label:'রোজ',accent:'#ff7aaa',accent2:'#c94d8f',text:'#fff8fb',muted:'#c2a0ad'}
  };
  const BACKGROUNDS={aurora:'অরোরা',minimal:'মিনিমাল',grid:'গ্রিড',stars:'স্টারস'};

  let dataPromise=null;
  let rows=[];
  let searchText='';
  let gpaHigh=false;
  const selectedTypes=new Set();
  const selectedCalc=new Set();
  const selectedDivisions=new Set();
  const wallpaperState={exams:[],mainKey:'',theme:'blue',background:'aurora'};

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function normalize(s){
    return String(s||'').toLowerCase().replace(/[‘’'"“”()[\],./&+-]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function bnDigits(value){
    const d='০১২৩৪৫৬৭৮৯';
    return String(value).replace(/\d/g,x=>d[Number(x)]);
  }
  function typeFor(item){
    if(item.category==='medical')return 'medical';
    if(item.category==='engineering')return 'engineering';
    return 'varsity';
  }
  function divisionFor(item){return DIVISION_BY_ID[item.id]||'multi'}
  function gpaFor(item){return Object.prototype.hasOwnProperty.call(GPA_BY_ID,item.id)?GPA_BY_ID[item.id]:null}
  function gpaLabel(item){
    const score=gpaFor(item);
    return score==null?'বিশেষ GPA শর্ত':('GPA '+bnDigits(score));
  }
  function loadCriteria(){
    if(dataPromise)return dataPromise;
    dataPromise=fetch(DATA_URL,{cache:'force-cache'}).then(r=>{
      if(!r.ok)throw new Error('criteria_load_failed');
      return r.json();
    }).then(data=>{
      if(!Array.isArray(data)||!data.length)throw new Error('criteria_empty');
      rows=data;return rows;
    }).catch(err=>{dataPromise=null;throw err});
    return dataPromise;
  }

  function safeEvents(){
    try{return Array.isArray(all)?all:[]}catch(e){return []}
  }
  function safeEventKey(e){
    try{return typeof eventKey==='function'?eventKey(e):String(e.title||'')+'|'+String(e.date||'')}catch(err){return String(e.title||'')+'|'+String(e.date||'')}
  }
  function safeShortTitle(e){
    try{return typeof calendarShortTitle==='function'?calendarShortTitle(e):String(e.title||'')}catch(err){return String(e.title||'')}
  }
  function isMyExam(e){
    try{return starred&&starred.has(safeEventKey(e))}catch(err){return false}
  }
  function myExamEvents(){
    return safeEvents().filter(isMyExam).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  }
  function savedMainKey(){
    try{return typeof countdownTargetKey!=='undefined'?String(countdownTargetKey||''):''}catch(e){return ''}
  }
  function dhakaDateString(iso){
    try{return new Date(iso).toLocaleDateString('bn-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}
  }
  function daysRemaining(iso){
    const target=new Date(iso);
    if(Number.isNaN(target.getTime()))return 0;
    const now=new Date();
    const a=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Dhaka'}));
    const b=new Date(target.toLocaleString('en-US',{timeZone:'Asia/Dhaka'}));
    const start=new Date(a.getFullYear(),a.getMonth(),a.getDate());
    const end=new Date(b.getFullYear(),b.getMonth(),b.getDate());
    return Math.max(0,Math.ceil((end-start)/86400000));
  }

  function toggleSet(set,value,button){
    if(set.has(value))set.delete(value);else set.add(value);
    if(button)button.classList.toggle('active',set.has(value));
    renderDirectory();
  }

  function ensureUi(){
    if(document.getElementById('criteriaBackdrop'))return;

    const host=document.createElement('div');
    host.innerHTML=
      '<div class="criteria-backdrop" id="criteriaBackdrop" aria-hidden="true">'+
        '<section class="criteria-modal" role="dialog" aria-modal="true" aria-labelledby="criteriaTitle">'+
          '<header class="criteria-head"><div><span>ADMISSION DIRECTORY</span><h2 id="criteriaTitle">ভর্তি তথ্য ও যোগ্যতা</h2><p>একসাথে একাধিক মানদণ্ড বেছে নিয়ে ভর্তি অপশন খুঁজুন।</p></div><button type="button" class="criteria-close" id="criteriaClose" aria-label="বন্ধ করুন">×</button></header>'+
          '<div class="criteria-tools">'+
            '<label class="criteria-search"><span>⌕</span><input id="criteriaSearch" type="search" placeholder="বিশ্ববিদ্যালয়, ইউনিট বা তথ্য খুঁজুন…" aria-label="ভর্তি তথ্য খুঁজুন"></label>'+
            '<div class="criteria-multi-group"><b>GPA</b><div><button type="button" class="criteria-choice criteria-gpa-sort" id="criteriaGpaHigh">সর্বোচ্চ GPA আগে</button></div></div>'+
            '<div class="criteria-multi-group"><b>ধরন</b><div id="criteriaTypeFilters">'+
              '<button type="button" class="criteria-choice" data-type="engineering">ইঞ্জিনিয়ারিং</button>'+
              '<button type="button" class="criteria-choice" data-type="medical">মেডিকেল</button>'+
              '<button type="button" class="criteria-choice" data-type="varsity">বিশ্ববিদ্যালয়</button>'+
            '</div></div>'+
            '<div class="criteria-multi-group"><b>ক্যালকুলেটর</b><div id="criteriaCalcFilters">'+
              '<button type="button" class="criteria-choice" data-calc="yes">ব্যবহার করা যাবে</button>'+
              '<button type="button" class="criteria-choice" data-calc="no">ব্যবহার করা যাবে না</button>'+
            '</div></div>'+
            '<div class="criteria-multi-group criteria-division-group"><b>বিভাগ</b><div id="criteriaDivisionFilters">'+
              Object.entries(DIVISION_LABELS).map(([key,label])=>'<button type="button" class="criteria-choice" data-division="'+key+'">'+label+'</button>').join('')+
            '</div></div>'+
            '<div class="criteria-filter-summary"><span id="criteriaFilterSummary">কোনো ফিল্টার সক্রিয় নেই</span><button type="button" id="criteriaClearFilters">সব মুছুন</button></div>'+
          '</div>'+
          '<div class="criteria-result-meta"><b id="criteriaCount">০টি ফলাফল</b><span>একই সঙ্গে ধরন + ক্যালকুলেটর + বিভাগ নির্বাচন করা যাবে।</span></div>'+
          '<div class="criteria-list" id="criteriaList"></div>'+
        '</section>'+
      '</div>'+
      '<div class="wallpaper-backdrop" id="wallpaperBackdrop" aria-hidden="true">'+
        '<section class="wallpaper-modal" role="dialog" aria-modal="true" aria-labelledby="wallpaperTitle">'+
          '<header class="wallpaper-head"><div><span>MY EXAMS • 9:16</span><h2 id="wallpaperTitle">আমার পরীক্ষার ওয়ালপেপার</h2><p>মূল টার্গেট উপরে, বাকি My Exams নিচে।</p></div><button type="button" class="criteria-close" id="wallpaperClose" aria-label="বন্ধ করুন">×</button></header>'+
          '<div class="wallpaper-body">'+
            '<div class="wallpaper-form">'+
              '<label class="wallpaper-field"><span>মূল টার্গেট</span><select id="wallpaperMainTarget"></select></label>'+
              '<div class="wallpaper-option-block"><b>থিম</b><div class="wallpaper-choice-row" id="wallpaperThemes">'+
                Object.entries(THEMES).map(([key,val])=>'<button type="button" data-wallpaper-theme="'+key+'"'+(key==='blue'?' class="active"':'')+'>'+val.label+'</button>').join('')+
              '</div></div>'+
              '<div class="wallpaper-option-block"><b>ব্যাকগ্রাউন্ড</b><div class="wallpaper-choice-row" id="wallpaperBackgrounds">'+
                Object.entries(BACKGROUNDS).map(([key,label])=>'<button type="button" data-wallpaper-bg="'+key+'"'+(key==='aurora'?' class="active"':'')+'>'+label+'</button>').join('')+
              '</div></div>'+
              '<label class="wallpaper-field"><span>কাস্টম লাইন ১</span><input id="wallpaperLine1" maxlength="80" value="আজকের কাজ, আগামীকালের ফল।"></label>'+
              '<label class="wallpaper-field"><span>কাস্টম লাইন ২</span><input id="wallpaperLine2" maxlength="80" value="ফোকাস • ধারাবাহিকতা • জয়"></label>'+
              '<div class="wallpaper-hint">এই টুলটি শুধু My Exams-এর জন্য। Directory বা Calendar-এ কোনো Wallpaper button নেই।</div>'+
              '<button class="wallpaper-download" id="wallpaperDownload" type="button">PNG ডাউনলোড</button>'+
            '</div>'+
            '<div class="wallpaper-preview-shell"><canvas id="wallpaperCanvas" width="1080" height="1920" aria-label="আমার পরীক্ষার লকস্ক্রিন ওয়ালপেপার প্রিভিউ"></canvas></div>'+
          '</div>'+
        '</section>'+
      '</div>'+
      '<div class="criteria-toast" id="criteriaToast" role="status" aria-live="polite"></div>';

    document.body.append(...host.children);

    document.getElementById('criteriaClose').onclick=closeDirectory;
    document.getElementById('criteriaBackdrop').onclick=e=>{if(e.target.id==='criteriaBackdrop')closeDirectory()};
    document.getElementById('criteriaSearch').oninput=e=>{searchText=e.target.value||'';renderDirectory()};
    document.getElementById('criteriaGpaHigh').onclick=e=>{
      gpaHigh=!gpaHigh;e.currentTarget.classList.toggle('active',gpaHigh);renderDirectory();
    };
    document.querySelectorAll('[data-type]').forEach(btn=>btn.onclick=()=>toggleSet(selectedTypes,btn.dataset.type,btn));
    document.querySelectorAll('[data-calc]').forEach(btn=>btn.onclick=()=>toggleSet(selectedCalc,btn.dataset.calc,btn));
    document.querySelectorAll('[data-division]').forEach(btn=>btn.onclick=()=>toggleSet(selectedDivisions,btn.dataset.division,btn));
    document.getElementById('criteriaClearFilters').onclick=clearFilters;

    document.getElementById('wallpaperClose').onclick=closeWallpaper;
    document.getElementById('wallpaperBackdrop').onclick=e=>{if(e.target.id==='wallpaperBackdrop')closeWallpaper()};
    document.getElementById('wallpaperMainTarget').onchange=e=>{wallpaperState.mainKey=e.target.value;renderWallpaperPreview()};
    document.getElementById('wallpaperLine1').oninput=renderWallpaperPreview;
    document.getElementById('wallpaperLine2').oninput=renderWallpaperPreview;
    document.querySelectorAll('[data-wallpaper-theme]').forEach(btn=>btn.onclick=()=>{
      wallpaperState.theme=btn.dataset.wallpaperTheme;
      document.querySelectorAll('[data-wallpaper-theme]').forEach(x=>x.classList.toggle('active',x===btn));
      renderWallpaperPreview();
    });
    document.querySelectorAll('[data-wallpaper-bg]').forEach(btn=>btn.onclick=()=>{
      wallpaperState.background=btn.dataset.wallpaperBg;
      document.querySelectorAll('[data-wallpaper-bg]').forEach(x=>x.classList.toggle('active',x===btn));
      renderWallpaperPreview();
    });
    document.getElementById('wallpaperDownload').onclick=downloadWallpaper;

    addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      if(document.getElementById('wallpaperBackdrop').classList.contains('open'))closeWallpaper();
      else if(document.getElementById('criteriaBackdrop').classList.contains('open'))closeDirectory();
    });
  }

  function clearFilters(){
    searchText='';gpaHigh=false;selectedTypes.clear();selectedCalc.clear();selectedDivisions.clear();
    const search=document.getElementById('criteriaSearch');if(search)search.value='';
    document.querySelectorAll('.criteria-choice.active').forEach(x=>x.classList.remove('active'));
    renderDirectory();
  }

  async function openDirectory(){
    ensureUi();
    const backdrop=document.getElementById('criteriaBackdrop');
    backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('criteria-lock');
    document.getElementById('criteriaList').innerHTML='<div class="criteria-loading">ভর্তি তথ্য লোড হচ্ছে…</div>';
    try{
      await loadCriteria();renderDirectory();
      setTimeout(()=>document.getElementById('criteriaSearch').focus(),40);
    }catch(e){
      document.getElementById('criteriaList').innerHTML='<div class="criteria-loading">তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।</div>';
    }
  }
  function closeDirectory(){
    const el=document.getElementById('criteriaBackdrop');if(!el)return;
    el.classList.remove('open');el.setAttribute('aria-hidden','true');
    if(!document.getElementById('wallpaperBackdrop')?.classList.contains('open'))document.body.classList.remove('criteria-lock');
  }

  function filterCount(){return (gpaHigh?1:0)+selectedTypes.size+selectedCalc.size+selectedDivisions.size}
  function renderDirectory(){
    const list=document.getElementById('criteriaList');if(!list)return;
    const q=normalize(searchText);

    let result=rows.filter(item=>{
      const type=typeFor(item),division=divisionFor(item),calc=item.calculator===true?'yes':'no';
      if(selectedTypes.size&&!selectedTypes.has(type))return false;
      if(selectedCalc.size&&!selectedCalc.has(calc))return false;
      if(selectedDivisions.size&&!selectedDivisions.has(division))return false;
      if(q&&!normalize([item.name,item.id,item.seats,item.eligibility,item.examType,item.marks,item.meritMethod,DIVISION_LABELS[division],TYPE_META[type].label].join(' ')).includes(q))return false;
      return true;
    });

    if(gpaHigh){
      result=result.slice().sort((a,b)=>{
        const ga=gpaFor(a),gb=gpaFor(b);
        if(ga==null&&gb!=null)return 1;
        if(gb==null&&ga!=null)return -1;
        if(ga!=null&&gb!=null&&gb!==ga)return gb-ga;
        return String(a.name||'').localeCompare(String(b.name||''),'bn');
      });
    }

    const active=filterCount();
    document.getElementById('criteriaFilterSummary').textContent=active?bnDigits(active)+'টি মানদণ্ড সক্রিয়':'কোনো ফিল্টার সক্রিয় নেই';
    document.getElementById('criteriaCount').textContent=bnDigits(result.length)+'টি ফলাফল';

    if(!result.length){
      list.innerHTML='<div class="criteria-empty">এই মানদণ্ডে কোনো ভর্তি অপশন পাওয়া যায়নি। কিছু ফিল্টার মুছে আবার দেখুন।</div>';return;
    }

    list.innerHTML=result.map(item=>{
      const type=typeFor(item),meta=TYPE_META[type];
      const division=DIVISION_LABELS[divisionFor(item)]||'—';
      const calc=item.calculator===true?'ক্যালকুলেটর: অনুমোদিত':'ক্যালকুলেটর: নিষিদ্ধ';
      return '<article class="criteria-card category-'+esc(type)+'">'+
        '<div class="criteria-card-head"><div><span class="criteria-category">'+esc(meta.label)+'</span><h3>'+esc(item.name)+'</h3></div></div>'+
        '<div class="criteria-card-badges"><span>'+esc(gpaLabel(item))+'</span><span>'+esc(division)+'</span><span class="'+(item.calculator?'yes':'no')+'">'+esc(calc)+'</span></div>'+
        '<dl>'+
          '<div><dt>আসন</dt><dd>'+esc(item.seats)+'</dd></div>'+
          '<div><dt>যোগ্যতা</dt><dd>'+esc(item.eligibility)+'</dd></div>'+
          '<div><dt>পরীক্ষার ধরন</dt><dd>'+esc(item.examType)+'</dd></div>'+
          '<div><dt>নম্বরবণ্টন</dt><dd>'+esc(item.marks)+'</dd></div>'+
          '<div><dt>মেধা পদ্ধতি</dt><dd>'+esc(item.meritMethod)+'</dd></div>'+
        '</dl>'+
      '</article>';
    }).join('');
  }

  function showToast(message){
    ensureUi();
    const toast=document.getElementById('criteriaToast');
    toast.textContent=message;toast.classList.add('show');
    clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2500);
  }

  function openWallpaper(){
    ensureUi();
    const exams=myExamEvents();
    if(!exams.length){showToast('আগে My Exams-এ অন্তত একটি পরীক্ষা যোগ করুন।');return}
    wallpaperState.exams=exams;
    const current=savedMainKey();
    wallpaperState.mainKey=exams.some(e=>safeEventKey(e)===current)?current:safeEventKey(exams.find(e=>new Date(e.date)>=new Date())||exams[0]);

    const select=document.getElementById('wallpaperMainTarget');
    select.innerHTML=exams.map(e=>'<option value="'+esc(safeEventKey(e))+'">'+esc(safeShortTitle(e))+' • '+esc(dhakaDateString(e.date))+'</option>').join('');
    select.value=wallpaperState.mainKey;

    const backdrop=document.getElementById('wallpaperBackdrop');
    backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('criteria-lock');
    renderWallpaperPreview();
  }
  function closeWallpaper(){
    const el=document.getElementById('wallpaperBackdrop');if(!el)return;
    el.classList.remove('open');el.setAttribute('aria-hidden','true');
    if(!document.getElementById('criteriaBackdrop')?.classList.contains('open'))document.body.classList.remove('criteria-lock');
  }

  function roundedRect(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function wrapText(ctx,text,maxWidth,maxLines){
    const words=String(text||'').split(/\s+/).filter(Boolean);
    if(!words.length)return [];
    const lines=[];let line='';
    for(const word of words){
      const test=line?line+' '+word:word;
      if(line&&ctx.measureText(test).width>maxWidth){
        lines.push(line);line=word;
        if(lines.length>=maxLines-1)break;
      }else line=test;
    }
    if(lines.length<maxLines&&line)lines.push(line);
    if(lines.length===maxLines){
      let last=lines[maxLines-1];
      while(last.length>2&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);
      lines[maxLines-1]=last+(last!==lines[maxLines-1]?'…':'');
    }
    return lines;
  }
  function drawLines(ctx,text,x,y,maxWidth,lineHeight,maxLines,align){
    const lines=wrapText(ctx,text,maxWidth,maxLines);
    ctx.textAlign=align||'left';lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
    return y+lines.length*lineHeight;
  }
  function drawBackground(ctx,W,H,theme,bg){
    ctx.fillStyle='#05070d';ctx.fillRect(0,0,W,H);
    if(bg==='minimal'){
      const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b1020');g.addColorStop(1,'#03050a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);return;
    }
    const base=ctx.createLinearGradient(0,0,W,H);base.addColorStop(0,'#07101c');base.addColorStop(.55,'#050914');base.addColorStop(1,'#02040a');ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
    if(bg==='aurora'){
      const a=ctx.createRadialGradient(850,420,20,850,420,720);a.addColorStop(0,theme.accent+'55');a.addColorStop(.55,theme.accent+'12');a.addColorStop(1,theme.accent+'00');ctx.fillStyle=a;ctx.fillRect(0,0,W,H);
      const b=ctx.createRadialGradient(130,1450,20,130,1450,650);b.addColorStop(0,theme.accent2+'44');b.addColorStop(1,theme.accent2+'00');ctx.fillStyle=b;ctx.fillRect(0,700,W,H-700);
    }
    if(bg==='grid'){
      ctx.strokeStyle=theme.accent+'16';ctx.lineWidth=1;
      for(let x=0;x<=W;x+=72){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=0;y<=H;y+=72){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      const glow=ctx.createRadialGradient(540,650,20,540,650,700);glow.addColorStop(0,theme.accent+'28');glow.addColorStop(1,theme.accent+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    }
    if(bg==='stars'){
      ctx.fillStyle='#ffffff';
      for(let i=0;i<110;i++){
        const x=(i*97+41)%W,y=(i*i*37+113)%H,r=i%13===0?2.2:(i%5===0?1.5:.8);
        ctx.globalAlpha=i%7===0?.75:.34;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      const glow=ctx.createRadialGradient(800,560,20,800,560,620);glow.addColorStop(0,theme.accent+'35');glow.addColorStop(1,theme.accent+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    }
  }

  function renderWallpaperPreview(){
    const canvas=document.getElementById('wallpaperCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    const exams=wallpaperState.exams;
    const main=exams.find(e=>safeEventKey(e)===wallpaperState.mainKey)||exams[0];
    if(!main)return;

    const theme=THEMES[wallpaperState.theme]||THEMES.blue;
    drawBackground(ctx,W,H,theme,wallpaperState.background);

    ctx.textAlign='center';ctx.fillStyle=theme.accent;ctx.font='800 24px "Noto Sans Bengali",system-ui,sans-serif';ctx.fillText('মূল টার্গেট',540,285);
    ctx.fillStyle=theme.text;ctx.font='800 55px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    drawLines(ctx,safeShortTitle(main),540,355,860,66,2,'center');

    const days=daysRemaining(main.date);
    ctx.fillStyle=theme.accent;ctx.font='900 190px Inter,system-ui,sans-serif';ctx.fillText(String(days),540,650);
    ctx.fillStyle=theme.muted;ctx.font='800 27px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('দিন বাকি',540,702);

    const line1=document.getElementById('wallpaperLine1')?.value.trim()||'';
    if(line1){
      ctx.fillStyle=theme.text;ctx.font='700 31px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
      drawLines(ctx,line1,540,810,820,45,2,'center');
    }

    const others=exams.filter(e=>safeEventKey(e)!==safeEventKey(main)).slice(0,8);
    const startY=935;ctx.textAlign='left';ctx.fillStyle=theme.accent;ctx.font='800 22px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('আমার অন্য পরীক্ষাগুলো',90,startY);

    if(!others.length){
      ctx.fillStyle=theme.muted;ctx.font='650 26px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText('আর কোনো My Exam নির্বাচিত নেই',90,startY+65);
    }else{
      let y=startY+55;
      others.forEach(e=>{
        roundedRect(ctx,78,y-28,924,88,20);ctx.fillStyle='rgba(255,255,255,.055)';ctx.fill();ctx.strokeStyle=theme.accent+'28';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle=theme.text;ctx.font='750 27px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
        const title=wrapText(ctx,safeShortTitle(e),590,1)[0]||safeShortTitle(e);ctx.fillText(title,108,y+4);
        ctx.fillStyle=theme.muted;ctx.font='650 20px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(dhakaDateString(e.date),108,y+35);
        ctx.textAlign='right';ctx.fillStyle=theme.accent;ctx.font='800 24px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(bnDigits(daysRemaining(e.date))+' দিন',965,y+13);ctx.textAlign='left';
        y+=105;
      });
    }

    const line2=document.getElementById('wallpaperLine2')?.value.trim()||'';
    if(line2){
      ctx.textAlign='center';ctx.fillStyle=theme.text;ctx.font='700 28px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
      drawLines(ctx,line2,540,1745,830,40,2,'center');
    }

    ctx.textAlign='center';ctx.fillStyle=theme.muted;ctx.font='650 20px Inter,system-ui,sans-serif';ctx.fillText('admissionbydbt.vercel.app',540,1860);
    ctx.fillStyle=theme.accent;ctx.beginPath();ctx.arc(540,1818,4.5,0,Math.PI*2);ctx.fill();
  }

  function downloadWallpaper(){
    const canvas=document.getElementById('wallpaperCanvas');if(!canvas)return;
    renderWallpaperPreview();
    const btn=document.getElementById('wallpaperDownload');
    btn.disabled=true;const old=btn.textContent;btn.textContent='PNG তৈরি হচ্ছে…';
    canvas.toBlob(blob=>{
      btn.disabled=false;btn.textContent=old;
      if(!blob){showToast('PNG তৈরি করা যায়নি।');return}
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='DBT-My-Exams-Lockscreen.png';document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1800);showToast('ওয়ালপেপার ডাউনলোড হয়েছে।');
    },'image/png',1);
  }

  function boot(){
    ensureUi();
    const directory=document.getElementById('criteriaLaunchButton');if(directory)directory.onclick=openDirectory;
    const wallpaper=document.getElementById('myExamsWallpaperButton');if(wallpaper)wallpaper.onclick=openWallpaper;
  }

  window.DBTAdmissionCriteria={open:openDirectory,openMyExamsWallpaper:openWallpaper};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
