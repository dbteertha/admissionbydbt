/* Admission by DBT — Bangla Admission Map */
(function(){
  const STORAGE='admissionbydbt-admission-map-v1';
  const ITEMS=[
    {key:'AAUB',name:'এভিয়েশন ও অ্যারোস্পেস বিশ্ববিদ্যালয়',cat:'engineering',place:'লালমনিরহাট',x:355,y:265,lx:58,ly:205,side:'left',aliases:['Aviation and Aerospace University Bangladesh','AAUB']},
    {key:'HSTU',name:'হাবিপ্রবি',cat:'university',place:'দিনাজপুর',x:340,y:345,lx:68,ly:300,side:'left',aliases:['HSTU','হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়']},
    {key:'RU',name:'রাজশাহী বিশ্ববিদ্যালয়',cat:'university',place:'রাজশাহী',x:305,y:565,lx:58,ly:470,side:'left',aliases:['Rajshahi University','রাজশাহী বিশ্ববিদ্যালয়']},
    {key:'RUET',name:'রুয়েট',cat:'engineering',place:'রাজশাহী',x:315,y:580,lx:78,ly:520,side:'left',aliases:['RUET']},
    {key:'KU',name:'খুলনা বিশ্ববিদ্যালয়',cat:'university',place:'খুলনা',x:355,y:950,lx:58,ly:895,side:'left',aliases:['Khulna University','খুলনা বিশ্ববিদ্যালয়']},
    {key:'KUET',name:'কুয়েট',cat:'engineering',place:'খুলনা',x:370,y:925,lx:78,ly:945,side:'left',aliases:['KUET']},
    {key:'JU',name:'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',cat:'university',place:'সাভার',x:478,y:665,lx:70,ly:640,side:'left',aliases:['Jahangirnagar University','জাহাঙ্গীরনগর বিশ্ববিদ্যালয়']},
    {key:'IUT',name:'আইইউটি',cat:'engineering',place:'গাজীপুর',x:520,y:615,lx:780,ly:470,side:'right',aliases:['IUT']},
    {key:'DU',name:'ঢাকা বিশ্ববিদ্যালয়',cat:'university',place:'ঢাকা',x:520,y:705,lx:790,ly:520,side:'right',aliases:['Dhaka University','ঢাকা বিশ্ববিদ্যালয়','DU IBA']},
    {key:'BUET',name:'বুয়েট',cat:'engineering',place:'ঢাকা',x:525,y:715,lx:790,ly:570,side:'right',aliases:['BUET']},
    {key:'JnU',name:'জগন্নাথ বিশ্ববিদ্যালয়',cat:'university',place:'ঢাকা',x:535,y:725,lx:790,ly:620,side:'right',aliases:['Jagannath University','জগন্নাথ বিশ্ববিদ্যালয়']},
    {key:'BUTEX',name:'বুটেক্স',cat:'engineering',place:'ঢাকা',x:515,y:690,lx:790,ly:670,side:'right',aliases:['BUTEX']},
    {key:'MIST',name:'এমআইএসটি',cat:'engineering',place:'ঢাকা',x:510,y:675,lx:790,ly:720,side:'right',aliases:['MIST']},
    {key:'BUP',name:'বিইউপি',cat:'university',place:'ঢাকা',x:505,y:665,lx:790,ly:770,side:'right',aliases:['BUP']},
    {key:'AFMC',name:'এএফএমসি / সামরিক মেডিকেল',cat:'medical',place:'ঢাকা',x:545,y:690,lx:790,ly:820,side:'right',aliases:['AFMC','AMC','Navy Medical']},
    {key:'SUST',name:'শাবিপ্রবি',cat:'university',place:'সিলেট',x:690,y:455,lx:805,ly:345,side:'right',aliases:['SUST']},
    {key:'CoU',name:'কুমিল্লা বিশ্ববিদ্যালয়',cat:'university',place:'কুমিল্লা',x:640,y:760,lx:800,ly:870,side:'right',aliases:['Comilla University','কুমিল্লা বিশ্ববিদ্যালয়']},
    {key:'CU',name:'চট্টগ্রাম বিশ্ববিদ্যালয়',cat:'university',place:'চট্টগ্রাম',x:705,y:925,lx:800,ly:970,side:'right',aliases:['Chittagong University','চট্টগ্রাম বিশ্ববিদ্যালয়']},
    {key:'CUET',name:'চুয়েট',cat:'engineering',place:'চট্টগ্রাম',x:695,y:900,lx:800,ly:1020,side:'right',aliases:['CUET']}
  ];
  const CAT_LABEL={medical:'মেডিকেল',engineering:'ইঞ্জিনিয়ারিং',university:'বিশ্ববিদ্যালয়'};
  const CAT_COLOR={medical:'#ee4f8a',engineering:'#23b8d4',university:'#7a4fd8'};
  let selected=new Set(),filter='all';
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE)||'[]');
    if(Array.isArray(saved))selected=new Set(saved.filter(k=>ITEMS.some(x=>x.key===k)));
  }catch(e){}

  const el={
    button:document.getElementById('admissionMapButton'),
    backdrop:document.getElementById('admissionMapBackdrop'),
    close:document.getElementById('admissionMapClose'),
    selectStep:document.getElementById('admissionMapSelectStep'),
    previewStep:document.getElementById('admissionMapPreviewStep'),
    search:document.getElementById('admissionMapSearch'),
    filters:document.getElementById('admissionMapFilters'),
    list:document.getElementById('admissionMapList'),
    all:document.getElementById('admissionMapAll'),
    clear:document.getElementById('admissionMapClear'),
    fromMine:document.getElementById('admissionMapFromMyExams'),
    count:document.getElementById('admissionMapSelectedCount'),
    preview:document.getElementById('admissionMapPreviewButton'),
    canvas:document.getElementById('admissionMapCanvas'),
    back:document.getElementById('admissionMapBack'),
    download:document.getElementById('admissionMapDownload')
  };
  if(!el.button||!el.backdrop||!el.canvas)return;

  function bnDigits(value){
    const digits='০১২৩৪৫৬৭৮৯';
    return String(value).split('').map(ch=>ch>='0'&&ch<='9'?digits[Number(ch)]:ch).join('');
  }
  function save(){
    try{localStorage.setItem(STORAGE,JSON.stringify([...selected]))}catch(e){}
  }
  function matchesMine(item){
    try{
      const selectedEvents=all.filter(e=>starred.has(eventKey(e)));
      return selectedEvents.some(e=>{
        const title=String(e.title||'').toLowerCase();
        return item.aliases.some(a=>title.includes(String(a).toLowerCase()));
      });
    }catch(e){return false}
  }
  function escText(s){
    return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function render(){
    const q=(el.search.value||'').trim().toLowerCase();
    const rows=ITEMS.filter(x=>{
      if(filter!=='all'&&x.cat!==filter)return false;
      if(!q)return true;
      return (x.name+' '+x.place+' '+x.key+' '+x.aliases.join(' ')).toLowerCase().includes(q);
    });
    el.list.innerHTML=rows.length?rows.map(x=>{
      const on=selected.has(x.key);
      return '<button type="button" class="admission-map-row'+(on?' active':'')+'" data-map-key="'+x.key+'" aria-pressed="'+String(on)+'">'+
        '<span class="admission-map-check">'+(on?'✓':'')+'</span>'+
        '<span><strong>'+escText(x.name)+'</strong><small>'+escText(x.place)+' • '+escText(CAT_LABEL[x.cat])+'</small></span>'+
        '<i class="admission-map-cat '+x.cat+'"></i></button>';
    }).join(''):'<div class="admission-map-empty">কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।</div>';
    el.list.querySelectorAll('[data-map-key]').forEach(btn=>btn.onclick=()=>{
      const key=btn.dataset.mapKey;
      if(selected.has(key))selected.delete(key);else selected.add(key);
      save();render();
    });
    el.count.textContent=bnDigits(selected.size)+'টি নির্বাচিত';
    el.preview.disabled=selected.size<1;
  }
  function open(){
    el.selectStep.hidden=false;el.previewStep.hidden=true;el.search.value='';filter='all';
    el.filters.querySelectorAll('[data-map-filter]').forEach(b=>b.classList.toggle('active',b.dataset.mapFilter==='all'));
    render();el.backdrop.classList.add('open');el.backdrop.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function close(){
    el.backdrop.classList.remove('open');el.backdrop.setAttribute('aria-hidden','true');document.body.style.overflow='';
  }
  function rounded(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function countryPath(ctx){
    const pts=[[390,190],[480,170],[555,205],[625,188],[690,225],[735,285],[705,350],[755,410],[718,475],[755,545],[718,615],[742,690],[705,770],[722,855],[690,945],[650,1040],[610,1138],[565,1220],[520,1160],[468,1190],[420,1135],[360,1090],[310,1010],[268,915],[245,820],[218,725],[235,635],[202,548],[232,465],[212,382],[252,305],[305,245]];
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();
  }
  function textLines(ctx,text,maxWidth){
    const words=String(text).split(' '),lines=[];let line='';
    words.forEach(word=>{
      const test=line?line+' '+word:word;
      if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
    });
    if(line)lines.push(line);return lines.slice(0,2);
  }
  function label(ctx,item){
    const color=CAT_COLOR[item.cat],boxW=245;
    ctx.font='700 25px "Noto Sans Bengali","Hind Siliguri",sans-serif';
    const lines=textLines(ctx,item.name,boxW-32),boxH=lines.length>1?70:54;
    const bx=item.side==='left'?item.lx:Math.min(1080-boxW-28,item.lx),by=item.ly;
    const lineEndX=item.side==='left'?bx+boxW:bx,lineEndY=by+boxH/2;
    ctx.save();
    ctx.strokeStyle=color;ctx.globalAlpha=.58;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(item.x,item.y);ctx.lineTo(lineEndX,lineEndY);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(item.x,item.y,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(item.x,item.y,4,0,Math.PI*2);ctx.fill();
    rounded(ctx,bx,by,boxW,boxH,16);ctx.fillStyle='rgba(255,255,255,.96)';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=color;ctx.fillRect(bx,by,7,boxH);
    ctx.fillStyle='#152033';ctx.font='700 25px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.textBaseline='middle';
    if(lines.length===1)ctx.fillText(lines[0],bx+20,by+boxH/2);
    else{ctx.fillText(lines[0],bx+20,by+23);ctx.fillText(lines[1],bx+20,by+49)}
    ctx.restore();
  }
  function draw(){
    const ctx=el.canvas.getContext('2d'),W=el.canvas.width,H=el.canvas.height;
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#f9fbff');bg.addColorStop(.5,'#f5f0ff');bg.addColorStop(1,'#eefaf7');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const g1=ctx.createRadialGradient(170,170,0,170,170,360);g1.addColorStop(0,'rgba(57,203,229,.22)');g1.addColorStop(1,'rgba(57,203,229,0)');ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);
    const g2=ctx.createRadialGradient(920,310,0,920,310,430);g2.addColorStop(0,'rgba(238,79,138,.17)');g2.addColorStop(1,'rgba(238,79,138,0)');ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#101826';ctx.font='800 48px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.textAlign='center';ctx.fillText('বাংলাদেশ ভর্তি মানচিত্র ২০২৬–২৭',W/2,82);
    ctx.fillStyle='#66758b';ctx.font='600 23px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.fillText('নির্বাচিত বিশ্ববিদ্যালয় ও ভর্তি প্রতিষ্ঠান',W/2,120);
    ctx.fillStyle='#7a4fd8';ctx.font='700 20px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.fillText('মোট '+bnDigits(selected.size)+'টি প্রতিষ্ঠান',W/2,154);
    ctx.save();countryPath(ctx);ctx.clip();
    const land=ctx.createLinearGradient(220,200,750,1180);land.addColorStop(0,'#dff7fb');land.addColorStop(.33,'#e9e1ff');land.addColorStop(.68,'#fff0f4');land.addColorStop(1,'#e7f8ef');ctx.fillStyle=land;ctx.fillRect(180,150,610,1100);
    ctx.globalAlpha=.20;ctx.fillStyle='#39cbe5';ctx.beginPath();ctx.arc(365,360,180,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7a4fd8';ctx.beginPath();ctx.arc(520,650,230,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ee4f8a';ctx.beginPath();ctx.arc(650,860,210,0,Math.PI*2);ctx.fill();ctx.fillStyle='#39a98f';ctx.beginPath();ctx.arc(390,1020,190,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.23;ctx.strokeStyle='#249fb8';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(470,240);ctx.bezierCurveTo(430,410,520,520,480,680);ctx.bezierCurveTo(455,810,520,920,470,1100);ctx.stroke();ctx.beginPath();ctx.moveTo(650,330);ctx.bezierCurveTo(610,500,650,620,590,760);ctx.bezierCurveTo(550,850,610,980,565,1150);ctx.stroke();ctx.restore();
    countryPath(ctx);ctx.strokeStyle='#56657a';ctx.lineWidth=4;ctx.stroke();
    ctx.textAlign='left';ITEMS.filter(x=>selected.has(x.key)).forEach(x=>label(ctx,x));
    rounded(ctx,135,1290,810,72,22);ctx.fillStyle='rgba(255,255,255,.82)';ctx.fill();ctx.strokeStyle='rgba(42,59,82,.10)';ctx.lineWidth=2;ctx.stroke();
    const legend=[['#ee4f8a','মেডিকেল'],['#23b8d4','ইঞ্জিনিয়ারিং'],['#7a4fd8','বিশ্ববিদ্যালয়']];let lx=205;
    legend.forEach(v=>{ctx.fillStyle=v[0];ctx.beginPath();ctx.arc(lx,1326,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#28374d';ctx.font='700 21px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.fillText(v[1],lx+17,1334);lx+=245});
    ctx.textAlign='center';ctx.fillStyle='#7b889a';ctx.font='600 18px "Noto Sans Bengali","Hind Siliguri",sans-serif';ctx.fillText('অ্যাডমিশন বাই ডিবিটি • নিজের ভর্তি যাত্রা এক মানচিত্রে',W/2,1404);
  }
  function preview(){if(!selected.size)return;el.selectStep.hidden=true;el.previewStep.hidden=false;draw();el.previewStep.scrollTop=0}
  function download(){
    draw();el.canvas.toBlob(blob=>{
      if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);
      a.href=url;a.download='DBT-Bangla-Admission-Map-2026-27.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    },'image/png',1);
  }

  el.button.onclick=open;el.close.onclick=close;el.backdrop.onclick=e=>{if(e.target===el.backdrop)close()};
  el.search.oninput=render;
  el.filters.querySelectorAll('[data-map-filter]').forEach(btn=>btn.onclick=()=>{filter=btn.dataset.mapFilter;el.filters.querySelectorAll('[data-map-filter]').forEach(x=>x.classList.toggle('active',x===btn));render()});
  el.all.onclick=()=>{ITEMS.forEach(x=>selected.add(x.key));save();render()};
  el.clear.onclick=()=>{selected.clear();save();render()};
  el.fromMine.onclick=()=>{
    const mine=ITEMS.filter(matchesMine);
    if(mine.length){selected=new Set(mine.map(x=>x.key));save();render()}
    else{el.fromMine.textContent='আমার পরীক্ষায় মানচিত্রযোগ্য প্রতিষ্ঠান নেই';setTimeout(()=>el.fromMine.textContent='★ আমার পরীক্ষা থেকে',1600)}
  };
  el.preview.onclick=preview;el.back.onclick=()=>{el.previewStep.hidden=true;el.selectStep.hidden=false;render()};el.download.onclick=download;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&el.backdrop.classList.contains('open'))close()});
})();
