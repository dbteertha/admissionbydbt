/* Admission by DBT — Criteria Directory + Lockscreen Wallpaper */
(function(){
  'use strict';

  const DATA_URL='/data/admission-criteria-v1.json';
  const DEFAULT_QUOTE='ক্লান্তি যখন তুচ্ছ, লক্ষ্য তখন নিশ্চিত।';
  const CATEGORY={
    medical:{label:'মেডিকেল',accent:'#34d399'},
    engineering:{label:'ইঞ্জিনিয়ারিং',accent:'#22d3ee'},
    general:{label:'General & Science',accent:'#818cf8'},
    arts:{label:'Arts / Humanities',accent:'#fb7185'}
  };
  const FILTERS=[
    ['all','সব'],
    ['engineering','Engineering'],
    ['medical','Medical'],
    ['general','General & Science'],
    ['arts','Arts / Humanities']
  ];
  const EVENT_RULES=[
    [/medical|dental/i,'med-dental'],[/afmc|army medical|navy medical|\bamc\b/i,'afmc-amc'],
    [/\bbuet\b/i,'buet'],[/\bruet\b/i,'ruet'],[/\bkuet\b/i,'kuet'],[/\bcuet\b/i,'cuet'],[/\bbutex\b/i,'butex'],[/\biut\b/i,'iut'],[/\bmist\b/i,'mist'],
    [/dhaka university a|du[- ]?a\b|du.*science/i,'du-ka'],[/dhaka university b|du[- ]?b\b|arts, law.*social/i,'du-kha'],
    [/jagannath university a|jnu[- ]?a\b/i,'jnu-a'],[/jagannath university (b|d)|jnu[- ]?(b|d)\b/i,'jnu-b-d'],
    [/rajshahi university c|ru[- ]?c\b/i,'ru-c'],[/rajshahi university a|ru[- ]?a\b/i,'ru-a'],
    [/chittagong university a|cu[- ]?a\b/i,'cu-a'],[/chittagong university (b|b1|b2|d|d1)|cu[- ]?(b|d)/i,'cu-b-d'],
    [/comilla university a|cou[- ]?a\b/i,'cou-a'],[/comilla university b|cou[- ]?b\b/i,'cou-b'],
    [/gst a|gst[- ]?a\b/i,'gst-a'],[/gst b|gst[- ]?b\b/i,'gst-b'],
    [/agriculture cluster|agri/i,'agri-cluster'],
    [/khulna university (a|b)|ku[- ]?(a|b)\b/i,'ku-a-b'],[/khulna university c|ku[- ]?c\b/i,'ku-c'],
    [/sust b/i,'sust-b'],[/sust/i,'sust-a'],
    [/bup.*(fst|science|technology)/i,'bup-fst'],[/bup.*(fass|fsss|arts|social)/i,'bup-fass-fsss'],
    [/hstu.*d/i,'hstu-d'],[/hstu/i,'hstu-a-b'],
    [/jahangirnagar.*(b|c)/i,'ju-b-c'],[/jahangirnagar/i,'ju-a-d']
  ];

  let dataPromise=null;
  let criteriaData=[];
  let activeFilter='all';
  let activeSearch='';
  let wallpaperState={item:null,event:null};

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function safeEvents(){
    try{return Array.isArray(all)?all:[]}catch(e){return []}
  }
  function safeEventKey(e){
    try{return typeof eventKey==='function'?eventKey(e):String(e.title||'')+'|'+String(e.date||'')}catch(err){return String(e.title||'')+'|'+String(e.date||'')}
  }
  function safeEventCategory(e){
    try{return typeof eventCategory==='function'?eventCategory(e):'university'}catch(err){return 'university'}
  }
  function normalize(s){
    return String(s||'').toLowerCase().replace(/[‘’'"“”()[\],./&+-]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function loadCriteria(){
    if(dataPromise)return dataPromise;
    dataPromise=fetch(DATA_URL,{cache:'force-cache'}).then(r=>{
      if(!r.ok)throw new Error('criteria_load_failed');
      return r.json();
    }).then(rows=>{
      if(!Array.isArray(rows)||!rows.length)throw new Error('criteria_empty');
      criteriaData=rows;
      return rows;
    }).catch(err=>{
      dataPromise=null;
      throw err;
    });
    return dataPromise;
  }
  function categoryMeta(item){
    return CATEGORY[item&&item.category]||CATEGORY.general;
  }
  function criteriaForEvent(e){
    const title=String(e&&e.title||'');
    for(const [re,id] of EVENT_RULES){
      if(re.test(title)){
        const found=criteriaData.find(x=>x.id===id);
        if(found)return found;
      }
    }
    const norm=normalize(title);
    return criteriaData.find(item=>{
      const n=normalize(item.name);
      const key=normalize(item.id.replace(/-/g,' '));
      return (n&&norm.includes(n))||(key&&norm.includes(key));
    })||null;
  }
  function syntheticItem(e){
    const cat=safeEventCategory(e);
    const category=cat==='medical'?'medical':cat==='engineering'?'engineering':'general';
    return {
      id:'exam-'+normalize(e&&e.title||'target').replace(/\s+/g,'-').slice(0,50),
      name:String(e&&e.title||'Admission Target'),
      category,
      seats:'তথ্য কণিকায় আলাদা আসন তথ্য নেই',
      eligibility:'চূড়ান্ত যোগ্যতা অফিসিয়াল সার্কুলার থেকে যাচাই করুন।',
      examType:'এই পরীক্ষার বিস্তারিত তথ্য ডিরেক্টরিতে আলাদাভাবে নেই।',
      marks:'অফিসিয়াল সার্কুলার দেখুন।',
      meritMethod:'অফিসিয়াল সার্কুলার দেখুন।',
      calculator:null
    };
  }
  function eventForItem(item){
    const events=safeEvents().filter(e=>new Date(e.date).getTime()>=Date.now()-86400000);
    const direct=events.find(e=>{
      const match=criteriaForEvent(e);
      return match&&match.id===item.id;
    });
    if(direct)return direct;

    const id=item.id;
    const institutionPatterns={
      buet:/\bbuet\b/i,ruet:/\bruet\b/i,kuet:/\bkuet\b/i,cuet:/\bcuet\b/i,butex:/\bbutex\b/i,iut:/\biut\b/i,mist:/\bmist\b/i,
      'med-dental':/medical|dental/i,'afmc-amc':/afmc|army medical|navy medical/i,
      'sust-a':/sust/i,'sust-b':/sust/i,'du-ka':/dhaka university/i,'du-kha':/dhaka university/i,
      'jnu-a':/jagannath university/i,'jnu-b-d':/jagannath university/i,
      'ru-c':/rajshahi university/i,'ru-a':/rajshahi university/i,
      'cu-a':/chittagong university/i,'cu-b-d':/chittagong university/i,
      'bup-fst':/bup/i,'bup-fass-fsss':/bup/i,
      'gst-a':/^gst/i,'gst-b':/^gst/i,'ku-a-b':/khulna university/i,'ku-c':/khulna university/i,
      'cou-a':/comilla university/i,'cou-b':/comilla university/i,'agri-cluster':/agriculture cluster/i,
      'hstu-a-b':/hstu/i,'hstu-d':/hstu/i,'ju-a-d':/jahangirnagar/i,'ju-b-c':/jahangirnagar/i
    };
    const re=institutionPatterns[id];
    return re?events.find(e=>re.test(String(e.title||'')))||null:null;
  }
  function savedTargetEvent(){
    try{
      if(typeof countdownTargetKey!=='undefined'&&countdownTargetKey){
        return safeEvents().find(e=>safeEventKey(e)===countdownTargetKey)||null;
      }
    }catch(e){}
    return null;
  }
  function dateInputValue(iso){
    if(!iso)return '';
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '';
    try{
      const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
      const map={};parts.forEach(p=>{if(p.type!=='literal')map[p.type]=p.value});
      return map.year+'-'+map.month+'-'+map.day;
    }catch(e){
      return d.toISOString().slice(0,10);
    }
  }
  function parseInputDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const [y,m,d]=value.split('-').map(Number);
    const date=new Date(y,m-1,d);
    return Number.isNaN(date.getTime())?null:date;
  }
  function bnDate(date){
    try{return date.toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'})}catch(e){return date.toLocaleDateString()}
  }
  function daysRemaining(target){
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const targetDay=new Date(target.getFullYear(),target.getMonth(),target.getDate());
    return Math.max(0,Math.ceil((targetDay-today)/86400000));
  }

  function ensureUi(){
    if(document.getElementById('criteriaBackdrop'))return;

    const wrap=document.createElement('div');
    wrap.innerHTML=
      '<div class="criteria-backdrop" id="criteriaBackdrop" aria-hidden="true">'+
        '<section class="criteria-modal" role="dialog" aria-modal="true" aria-labelledby="criteriaTitle">'+
          '<header class="criteria-head"><div><span>ADMISSION DIRECTORY</span><h2 id="criteriaTitle">ভর্তি তথ্য ও যোগ্যতা</h2><p>৩২টি ভর্তি অপশনের আসন, যোগ্যতা, পরীক্ষা, নম্বর ও মেধা পদ্ধতি।</p></div><button type="button" class="criteria-close" id="criteriaClose" aria-label="বন্ধ করুন">×</button></header>'+
          '<div class="criteria-tools"><label class="criteria-search"><span>⌕</span><input id="criteriaSearch" type="search" placeholder="বিশ্ববিদ্যালয়, ইউনিট, আসন বা acronym খুঁজুন…" aria-label="ভর্তি তথ্য খুঁজুন"></label><div class="criteria-filters" id="criteriaFilters"></div></div>'+
          '<div class="criteria-result-meta"><b id="criteriaCount">০টি ফলাফল</b><span>চূড়ান্ত আবেদন তথ্য অফিসিয়াল সার্কুলার থেকে মিলিয়ে নিন।</span></div>'+
          '<div class="criteria-list" id="criteriaList"></div>'+
        '</section>'+
      '</div>'+
      '<div class="wallpaper-backdrop" id="wallpaperBackdrop" aria-hidden="true">'+
        '<section class="wallpaper-modal" role="dialog" aria-modal="true" aria-labelledby="wallpaperTitle">'+
          '<header class="wallpaper-head"><div><span>9:16 LOCKSCREEN</span><h2 id="wallpaperTitle">টার্গেট ওয়ালপেপার</h2><p>১০৮০×১৯২০ PNG — আপনার ফোনের জন্য।</p></div><button type="button" class="criteria-close" id="wallpaperClose" aria-label="বন্ধ করুন">×</button></header>'+
          '<div class="wallpaper-body">'+
            '<div class="wallpaper-form">'+
              '<div class="wallpaper-target-card"><span>MY DREAM TARGET</span><b id="wallpaperVarsityName">—</b></div>'+
              '<label>পরীক্ষার তারিখ<input id="wallpaperDate" type="date"></label>'+
              '<label>মোটিভেশন<textarea id="wallpaperQuote" rows="3" maxlength="120"></textarea></label>'+
              '<div class="wallpaper-hint" id="wallpaperHint">ক্যালেন্ডারের তারিখ পাওয়া গেলে সেটি স্বয়ংক্রিয়ভাবে বসবে।</div>'+
              '<button class="wallpaper-download" id="wallpaperDownload" type="button">PNG ডাউনলোড</button>'+
            '</div>'+
            '<div class="wallpaper-preview-shell"><canvas id="wallpaperCanvas" width="1080" height="1920" aria-label="লকস্ক্রিন ওয়ালপেপার প্রিভিউ"></canvas></div>'+
          '</div>'+
        '</section>'+
      '</div>'+
      '<div class="criteria-toast" id="criteriaToast" role="status" aria-live="polite"></div>';
    document.body.append(...wrap.children);

    const filters=document.getElementById('criteriaFilters');
    filters.innerHTML=FILTERS.map(([id,label])=>'<button type="button" data-criteria-filter="'+id+'"'+(id==='all'?' class="active"':'')+'>'+label+'</button>').join('');

    document.getElementById('criteriaClose').onclick=closeDirectory;
    document.getElementById('criteriaBackdrop').onclick=e=>{if(e.target.id==='criteriaBackdrop')closeDirectory()};
    document.getElementById('criteriaSearch').oninput=e=>{activeSearch=e.target.value||'';renderDirectory()};
    filters.querySelectorAll('[data-criteria-filter]').forEach(btn=>btn.onclick=()=>{
      activeFilter=btn.dataset.criteriaFilter;
      filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
      renderDirectory();
    });

    document.getElementById('wallpaperClose').onclick=closeWallpaper;
    document.getElementById('wallpaperBackdrop').onclick=e=>{if(e.target.id==='wallpaperBackdrop')closeWallpaper()};
    document.getElementById('wallpaperDate').oninput=renderWallpaperPreview;
    document.getElementById('wallpaperQuote').oninput=renderWallpaperPreview;
    document.getElementById('wallpaperDownload').onclick=downloadWallpaper;
    addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      if(document.getElementById('wallpaperBackdrop').classList.contains('open'))closeWallpaper();
      else if(document.getElementById('criteriaBackdrop').classList.contains('open'))closeDirectory();
    });
  }

  async function openDirectory(seed){
    ensureUi();
    const backdrop=document.getElementById('criteriaBackdrop');
    backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('criteria-lock');
    const list=document.getElementById('criteriaList');
    list.innerHTML='<div class="criteria-loading">ভর্তি তথ্য লোড হচ্ছে…</div>';
    try{
      await loadCriteria();
      if(seed){
        activeSearch=String(seed);
        document.getElementById('criteriaSearch').value=activeSearch;
      }
      renderDirectory();
      setTimeout(()=>document.getElementById('criteriaSearch').focus(),50);
    }catch(e){
      list.innerHTML='<div class="criteria-loading">তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।</div>';
    }
  }
  function closeDirectory(){
    const el=document.getElementById('criteriaBackdrop');if(!el)return;
    el.classList.remove('open');el.setAttribute('aria-hidden','true');
    document.body.classList.remove('criteria-lock');
  }
  function renderDirectory(){
    const list=document.getElementById('criteriaList');if(!list)return;
    const q=normalize(activeSearch);
    const rows=criteriaData.filter(item=>{
      if(activeFilter!=='all'&&item.category!==activeFilter)return false;
      if(!q)return true;
      return normalize([item.name,item.id,item.seats,item.eligibility,item.examType,item.marks].join(' ')).includes(q);
    });
    document.getElementById('criteriaCount').textContent=rows.length+'টি ফলাফল';
    if(!rows.length){
      list.innerHTML='<div class="criteria-empty">কোনো মিল পাওয়া যায়নি। অন্য নাম বা acronym দিয়ে চেষ্টা করুন।</div>';
      return;
    }
    list.innerHTML=rows.map(item=>{
      const meta=categoryMeta(item);
      const calc=item.calculator===true?'🟢 Calculator Allowed':item.calculator===false?'🔴 No Calculator':'⚪ Calculator: তথ্য নেই';
      return '<article class="criteria-card category-'+esc(item.category)+'">'+
        '<div class="criteria-card-head"><div><span class="criteria-category">'+esc(meta.label)+'</span><h3>'+esc(item.name)+'</h3></div><span class="criteria-calc">'+calc+'</span></div>'+
        '<dl>'+
          '<div><dt>আসন</dt><dd>'+esc(item.seats)+'</dd></div>'+
          '<div><dt>যোগ্যতা</dt><dd>'+esc(item.eligibility)+'</dd></div>'+
          '<div><dt>পরীক্ষার ধরন</dt><dd>'+esc(item.examType)+'</dd></div>'+
          '<div><dt>নম্বরবণ্টন</dt><dd>'+esc(item.marks)+'</dd></div>'+
          '<div><dt>মেধা পদ্ধতি</dt><dd>'+esc(item.meritMethod)+'</dd></div>'+
        '</dl>'+
        '<button type="button" class="criteria-wallpaper-btn" data-wallpaper-id="'+esc(item.id)+'">▣ ওয়ালপেপার বানাও</button>'+
      '</article>';
    }).join('');
    list.querySelectorAll('[data-wallpaper-id]').forEach(btn=>btn.onclick=()=>{
      const item=criteriaData.find(x=>x.id===btn.dataset.wallpaperId);
      if(item)openWallpaper(item,eventForItem(item));
    });
  }

  function showToast(message){
    ensureUi();
    const toast=document.getElementById('criteriaToast');
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),2600);
  }

  function openWallpaper(item,event){
    ensureUi();
    wallpaperState={item,event:event||null};
    const fallback=savedTargetEvent();
    const useEvent=event||fallback;
    document.getElementById('wallpaperVarsityName').textContent=item.name;
    document.getElementById('wallpaperDate').value=dateInputValue(useEvent&&useEvent.date);
    document.getElementById('wallpaperQuote').value=DEFAULT_QUOTE;
    document.getElementById('wallpaperHint').textContent=event
      ?'ক্যালেন্ডারের এই পরীক্ষার তারিখ ব্যবহার করা হয়েছে।'
      :fallback
        ?'আপনার সেভ করা main countdown target-এর তারিখ ব্যবহার করা হয়েছে।'
        :'তারিখ নির্বাচন করুন, তারপর PNG ডাউনলোড করুন।';
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
  function wrapCanvas(ctx,text,maxWidth,maxLines){
    const chars=Array.from(String(text||''));
    const lines=[];let line='';
    for(const ch of chars){
      const test=line+ch;
      if(line&&ctx.measureText(test).width>maxWidth){
        lines.push(line.trim());
        line=ch;
        if(lines.length>=maxLines-1)break;
      }else line=test;
    }
    const consumed=lines.join('').length;
    let remainder=chars.slice(consumed).join('').trim();
    if(lines.length<maxLines&&remainder)lines.push(remainder);
    if(lines.length>maxLines)lines.length=maxLines;
    if(lines.length===maxLines&&ctx.measureText(lines[maxLines-1]).width>maxWidth){
      let last=lines[maxLines-1];
      while(last.length>1&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);
      lines[maxLines-1]=last+'…';
    }
    return lines;
  }
  function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines,align){
    const lines=wrapCanvas(ctx,text,maxWidth,maxLines);
    ctx.textAlign=align||'left';
    lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
    return y+lines.length*lineHeight;
  }
  function drawWallpaper(item,targetDate,quote,canvas){
    const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    const meta=categoryMeta(item),accent=meta.accent;
    ctx.clearRect(0,0,W,H);

    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#0f172a');bg.addColorStop(.48,'#07101f');bg.addColorStop(1,'#020617');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    const glow=ctx.createRadialGradient(820,520,20,820,520,650);
    glow.addColorStop(0,accent+'55');glow.addColorStop(.48,accent+'16');glow.addColorStop(1,accent+'00');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    const glow2=ctx.createRadialGradient(80,1500,20,80,1500,520);
    glow2.addColorStop(0,'#6366f133');glow2.addColorStop(1,'#6366f100');
    ctx.fillStyle=glow2;ctx.fillRect(0,950,W,970);

    // Top 250px intentionally left clean for lockscreen clock/notifications.
    ctx.textAlign='left';ctx.fillStyle=accent;ctx.font='800 25px Inter, system-ui, sans-serif';
    ctx.letterSpacing='3px';ctx.fillText('MY DREAM TARGET',78,322);ctx.letterSpacing='0px';

    ctx.fillStyle='#f8fafc';ctx.font='800 72px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    drawWrapped(ctx,item.name,78,402,924,82,3,'left');

    const days=daysRemaining(targetDate);
    roundedRect(ctx,78,650,924,280,44);
    ctx.fillStyle='rgba(255,255,255,.075)';ctx.fill();
    ctx.strokeStyle=accent+'88';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=accent;ctx.font='900 150px Inter, system-ui, sans-serif';ctx.textAlign='center';
    ctx.fillText(String(days),540,815);
    ctx.fillStyle='#cbd5e1';ctx.font='800 25px Inter, system-ui, sans-serif';ctx.fillText('DAYS REMAINING',540,870);
    ctx.fillStyle='#94a3b8';ctx.font='650 28px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(bnDate(targetDate),540,912);

    roundedRect(ctx,78,990,924,425,40);
    ctx.fillStyle='rgba(15,23,42,.72)';ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;ctx.stroke();

    ctx.textAlign='left';ctx.fillStyle='#94a3b8';ctx.font='700 24px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    ctx.fillText('টার্গেট স্ন্যাপশট',118,1050);

    ctx.fillStyle='#f8fafc';ctx.font='700 31px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    let y=1112;
    y=drawWrapped(ctx,'আসন: '+item.seats,118,y,844,43,2,'left')+20;
    const firstExam=String(item.examType||'').split(';')[0].split('।')[0];
    y=drawWrapped(ctx,'ধরন: '+firstExam,118,y,844,43,2,'left')+22;

    const calc=item.calculator===true?'ক্যালকুলেটর: অনুমোদিত':item.calculator===false?'ক্যালকুলেটর: ব্যবহার করা যাবে না':'ক্যালকুলেটর: তথ্য নেই';
    roundedRect(ctx,118,y-28,Math.min(670,Math.max(340,ctx.measureText(calc).width+70)),62,31);
    ctx.fillStyle=item.calculator===true?'rgba(52,211,153,.15)':item.calculator===false?'rgba(251,113,133,.14)':'rgba(148,163,184,.13)';ctx.fill();
    ctx.fillStyle=item.calculator===true?'#6ee7b7':item.calculator===false?'#fda4af':'#cbd5e1';
    ctx.font='700 25px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';ctx.fillText(calc,145,y+10);

    ctx.textAlign='center';ctx.fillStyle='#f1f5f9';ctx.font='700 36px "Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif';
    const q='“'+(quote||DEFAULT_QUOTE)+'”';
    drawWrapped(ctx,q,540,1580,830,52,3,'center');

    ctx.fillStyle='#64748b';ctx.font='650 22px Inter,system-ui,sans-serif';ctx.fillText('admissionbydbt.vercel.app',540,1840);
    ctx.fillStyle=accent;ctx.beginPath();ctx.arc(540,1788,5,0,Math.PI*2);ctx.fill();
  }
  function renderWallpaperPreview(){
    const item=wallpaperState.item;if(!item)return;
    const canvas=document.getElementById('wallpaperCanvas');
    const date=parseInputDate(document.getElementById('wallpaperDate').value);
    const btn=document.getElementById('wallpaperDownload');
    if(!date){
      btn.disabled=true;
      const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#020617';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.font='700 36px "Noto Sans Bengali",system-ui,sans-serif';ctx.fillText('প্রিভিউ দেখতে পরীক্ষার তারিখ নির্বাচন করুন',540,960);
      return;
    }
    btn.disabled=false;
    drawWallpaper(item,date,document.getElementById('wallpaperQuote').value,canvas);
  }
  function downloadWallpaper(){
    const item=wallpaperState.item;if(!item)return;
    const date=parseInputDate(document.getElementById('wallpaperDate').value);
    if(!date){showToast('প্রথমে পরীক্ষার তারিখ নির্বাচন করুন।');return}
    const canvas=document.getElementById('wallpaperCanvas');
    drawWallpaper(item,date,document.getElementById('wallpaperQuote').value,canvas);
    const btn=document.getElementById('wallpaperDownload');
    btn.disabled=true;const old=btn.textContent;btn.textContent='PNG তৈরি হচ্ছে…';
    canvas.toBlob(blob=>{
      btn.disabled=false;btn.textContent=old;
      if(!blob){showToast('PNG তৈরি করা যায়নি।');return}
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=(item.id||'admission-target')+'-lockscreen-target.png';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1800);
      showToast('ওয়ালপেপার তৈরি হয়েছে — এখন লকস্ক্রিন হিসেবে সেট করতে পারেন।');
    },'image/png',1);
  }

  async function openWallpaperForEvent(e){
    ensureUi();
    try{if(!criteriaData.length)await loadCriteria()}catch(err){}
    const item=criteriaForEvent(e)||syntheticItem(e);
    openWallpaper(item,e);
  }
  function eventByKey(raw){
    return safeEvents().find(e=>safeEventKey(e)===raw)||null;
  }
  function decorateExamCards(){
    document.querySelectorAll('.starred-card[data-star-key]').forEach(card=>{
      if(card.querySelector('.criteria-quick-wallpaper'))return;
      const key=decodeURIComponent(card.dataset.starKey||'');
      const anchor=card.querySelector('.target-unstar');
      if(!anchor)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='criteria-quick-wallpaper';btn.title='ওয়ালপেপার বানাও';btn.setAttribute('aria-label','ওয়ালপেপার বানাও');
      btn.innerHTML='<span>▣</span><i>Wallpaper</i>';
      btn.onclick=ev=>{ev.stopPropagation();const e=eventByKey(key);if(e)openWallpaperForEvent(e)};
      anchor.parentElement.insertBefore(btn,anchor);
    });

    document.querySelectorAll('.timeline-card[data-event-key]').forEach(card=>{
      if(card.querySelector('.criteria-quick-wallpaper'))return;
      const key=decodeURIComponent(card.dataset.eventKey||'');
      const anchor=card.querySelector('.timeline-star');
      if(!anchor)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='criteria-quick-wallpaper timeline-wallpaper';btn.title='ওয়ালপেপার বানাও';btn.setAttribute('aria-label','ওয়ালপেপার বানাও');
      btn.innerHTML='<span>▣</span><i>Wallpaper</i>';
      btn.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const e=eventByKey(key);if(e)openWallpaperForEvent(e)};
      anchor.parentElement.insertBefore(btn,anchor);
    });
  }
  function installDrawerWallpaperButton(){
    const actions=document.querySelector('.event-drawer-actions');
    if(!actions||document.getElementById('eventDrawerWallpaper'))return;
    const btn=document.createElement('button');
    btn.className='btn criteria-drawer-wallpaper';btn.id='eventDrawerWallpaper';btn.type='button';btn.textContent='▣ Wallpaper';
    btn.onclick=()=>{
      const title=document.getElementById('eventDrawerTitle')?.textContent||'';
      const e=safeEvents().find(x=>String(x.title||'')===title);
      if(e)openWallpaperForEvent(e);else showToast('এই পরীক্ষার তারিখ পাওয়া যায়নি।');
    };
    actions.insertBefore(btn,actions.lastElementChild);
  }

  function boot(){
    ensureUi();
    const launch=document.getElementById('criteriaLaunchButton');
    if(launch)launch.onclick=()=>openDirectory();
    installDrawerWallpaperButton();
    decorateExamCards();

    for(const id of ['starredCards','calendarList']){
      const node=document.getElementById(id);
      if(node)new MutationObserver(()=>decorateExamCards()).observe(node,{childList:true,subtree:true});
    }
  }

  window.DBTAdmissionCriteria={
    open:openDirectory,
    openWallpaperForEvent,
    generateLockscreenWallpaper:function(varsityData,targetExamDate,customQuote){
      ensureUi();
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const date=targetExamDate instanceof Date?targetExamDate:new Date(targetExamDate);
      if(Number.isNaN(date.getTime()))throw new Error('invalid_target_date');
      drawWallpaper(varsityData,date,customQuote||DEFAULT_QUOTE,canvas);
      return canvas;
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
