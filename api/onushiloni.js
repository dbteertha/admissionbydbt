import fs from 'node:fs/promises';

export default async function handler(req,res){
  const chemFiles=[
    '../data/qb/chemistry/paper-1/chapter-01.json',
    '../data/qb/chemistry/paper-1/chapter-02.json',
    '../data/qb/chemistry/paper-1/chapter-03.json',
    '../data/qb/chemistry/paper-1/chapter-04.json',
    '../data/qb/chemistry/paper-1/chapter-05.json'
  ];
  const chemParts=await Promise.all(chemFiles.map(async function(p){
    return JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
  }));
  const chemP1DataRaw=chemParts.flat();
  const SUBTOPIC_BY_PAGE={
    4:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',
    5:'ল্যাবরেটরির যন্ত্রপাতি ও নিরাপত্তা সামগ্রী পরিষ্কার করার কৌশল',
    17:'ল্যাবরেটরি নিরাপত্তা সামগ্রী ও ব্যবহার বিধি',
    18:'প্রাথমিক চিকিৎসা ও ফাস্ট এইড বক্সের ব্যবহার বিধি',
    19:'পরমাণুর মডেল ও প্রাথমিক ধারণা',
    22:'কোয়ান্টাম সংখ্যা, বিভিন্ন অরবিটাল ও ইলেকট্রন ধারণ ক্ষমতা',
    29:'পরমাণুর মূল কণিকা',
    44:'দৃশ্যমান আলো ও বর্ণালি',
    46:'যৌগের দ্রাব্যতা ও দ্রাব্যতা গুণফল',
    62:'ইলেকট্রন বিন্যাসের ভিত্তিতে মৌলের শ্রেণিবিভাগ',
    96:'রাসায়নিক বিক্রিয়ার হার, দিক ও গতিসূত্র',
    130:'বাফার দ্রবণ ও pH এর প্রয়োগ',
    134:'ভর-শক্তির নিত্যতা সূত্র ও এনথালপির পরিবর্তন',
    138:'খাদ্য নিরাপত্তা ও রসায়ন',
    139:'প্রিজারভেটিভস ও খাদ্য সংরক্ষণ কৌশল',
    141:'প্রাকৃতিক ফুড প্রিজারভেটিভস',
    144:'কলয়েড, সাসপেনশন ও কোয়াগুলেশন'
  };
  const CHAPTER_PAGE_RANGES={0:[4,18],1:[19,61],2:[62,94],3:[95,137],4:[138,154]};
  const ANSWER_TABLE_OCR={"0":{"1":1,"2":3,"3":2,"7":0,"9":0,"13":2,"16":0,"17":0,"19":0,"21":0,"67":1,"70":0,"72":0,"73":0,"82":0,"85":1,"102":0,"103":1,"113":3,"114":2,"115":1,"117":3,"119":2,"120":1,"125":2,"128":3,"129":0,"157":2,"158":0,"184":3,"185":0,"186":3},"1":{"129":3,"130":2,"132":0,"135":1,"136":0,"145":3,"147":0,"148":2,"289":0,"291":0,"213":0,"25":0,"296":0,"277":0,"319":2,"320":0,"321":0,"322":3,"355":0,"356":0,"357":0,"358":1,"359":0,"360":1,"388":2,"389":0,"528":2,"530":0,"531":3,"532":2,"535":3,"4":1,"22":2,"691":0,"692":0,"694":0},"2":{"38":1,"41":0,"46":2,"48":1,"49":0,"51":2,"58":1,"60":1,"5":2,"97":0,"98":1,"50":3,"115":1,"117":0,"118":2,"178":0,"179":1,"180":1,"181":0,"182":0,"183":0,"184":0,"190":1,"191":3,"216":2,"217":2,"225":3,"226":1,"22":1,"302":2,"303":0,"379":0,"381":1,"406":1,"408":0,"478":0,"480":0,"481":0,"382":3,"483":3,"487":2,"489":2,"496":0,"498":3,"499":0,"500":3,"501":2,"502":0,"503":0,"554":3,"565":2,"566":0,"568":0,"657":0,"658":1,"693":0,"694":2,"695":1,"706":0,"708":1,"715":1,"719":0,"720":2,"723":3,"726":1},"3":{"60":0,"61":0,"66":2,"67":3,"69":1,"70":1,"191":3,"92":3,"94":0,"196":2,"97":0,"98":3,"99":0,"100":2,"120":1,"122":1,"123":3,"124":0,"125":3,"147":2,"150":2,"151":0,"160":3,"162":0,"163":0,"200":0,"201":0,"202":0,"203":0,"308":0,"309":0,"312":0,"316":2,"332":0,"334":3,"335":0,"336":3,"346":1,"348":0,"2":1,"358":0,"360":3,"361":0,"362":0,"364":0,"365":0,"366":0,"367":2,"375":1,"376":0,"377":3,"387":1,"388":0,"389":0,"48":3,"494":2,"495":0,"513":0,"514":1,"515":0,"516":2,"529":0,"531":1,"532":1,"5":3,"587":0,"588":1,"632":2,"633":0,"635":0,"661":0,"662":0,"679":0,"680":0,"687":1,"690":3,"692":0,"694":0,"695":0,"696":1,"709":0,"712":1,"731":0,"732":0,"733":3},"4":{"8":1,"10":0,"19":0,"20":2,"2":3,"22":1,"23":0,"33":3,"134":3,"135":0,"38":0,"39":0,"41":1,"183":0,"84":0,"356":3,"9":2,"62":3,"163":0,"64":3,"65":1,"68":0,"69":3,"71":1,"73":0,"76":3,"77":0,"79":3,"109":0,"110":3,"111":1,"112":1,"121":0,"129":0,"131":0,"154":0,"155":0,"164":2,"165":3,"166":1,"169":1,"171":1,"172":0,"174":1,"189":0,"190":0,"207":1,"208":3,"210":1,"265":2,"268":1,"301":3,"302":0,"304":3,"306":2,"307":3,"309":0,"310":2,"312":0,"313":2,"315":1,"316":3,"317":0,"319":3,"330":2,"332":0,"333":1,"338":0,"340":0,"358":1,"360":0,"369":2,"364":3,"365":0,"366":3,"367":2,"368":1,"370":1,"371":0}};
  const pageSubtopic={};
  Object.keys(CHAPTER_PAGE_RANGES).forEach(function(k){
    const range=CHAPTER_PAGE_RANGES[k]; let current='';
    for(let p=range[0];p<=range[1];p++){if(SUBTOPIC_BY_PAGE[p])current=SUBTOPIC_BY_PAGE[p];pageSubtopic[p]=current}
  });
  function enrichOcrQuestion(input){
    const q={...input},raw=String(input.raw||'');
    if((!Array.isArray(q.options)||q.options.length<4)&&raw){
      const body=raw.split(/\b(?:Solve|Note)\s*[:：]/i)[0];
      const ms=Array.from(body.matchAll(/(?:^|\s)(ক|খ|গ|ঘ|4|৪)\s*[\.,,)]\s*/g));
      const expected=['ক','খ','গ','ঘ'];let pos=0,chosen=[];
      expected.forEach(function(exp){
        let pick=-1;
        for(let j=pos;j<ms.length;j++){const lab=ms[j][1];if(lab===exp||((lab==='4'||lab==='৪')&&(exp==='খ'||exp==='ঘ'))){pick=j;break}}
        if(pick>=0){chosen.push(ms[pick]);pos=pick+1}
      });
      if(chosen.length===4){
        const opts=[];
        for(let i=0;i<4;i++){const st=chosen[i].index+chosen[i][0].length,en=i<3?chosen[i+1].index:body.length;opts.push(body.slice(st,en).trim())}
        if(opts.every(Boolean)){q.options=opts;q.optionsEstimated=true}
      }
    }
    const tableAnswer=ANSWER_TABLE_OCR[String(q.chapter)]&&ANSWER_TABLE_OCR[String(q.chapter)][String(q.serial)];
    if(!Number.isInteger(q.answer)&&Number.isInteger(tableAnswer)){q.answer=tableAnswer;q.answerEstimated=true;q.answerEvidence='printed answer table OCR'}
    if(!Number.isInteger(q.answer)&&raw){
      const pats=[/সঠিক\s*উত্তর\s*(?:হবে)?\s*\(?([কখগঘ])\)?/g,/উত্তর\s*হবে\s*\(?([কখগঘ])\)?/g,/উত্তর\s*\(?([কখগঘ])\)?/g];
      let best=null;
      pats.forEach(function(re,pri){for(const m of raw.matchAll(re)){const x={pri:3-pri,pos:m.index,letter:m[1]};if(!best||x.pri>best.pri||(x.pri===best.pri&&x.pos>best.pos))best=x}});
      if(best){q.answer={ক:0,খ:1,গ:2,ঘ:3}[best.letter];q.answerEstimated=true;q.answerEvidence='printed solution/note OCR'}
    }
    if(!q.source&&raw){
      const refs=[];const re=/[\[\(]([^\]\)]{2,90})[\]\)]/g;
      for(const m of raw.matchAll(re)){const t=m[0];if(/বো|BUET|MCAT|MAT|Dental|DU|RU|CU|JU|KU|SUST|BUTEX|IUT|MIST|AFMC|BUP|CKRUET|20\d{2}|19\d{2}|[০-৯]{4}/i.test(t))refs.push(t)}
      if(refs.length){q.source=refs.slice(0,3).join(' ');q.sourcePrinted=true;q.sourceEstimated=true}
    }
    if(!q.author&&raw){
      const names=[];if(/হাজারী|হাজা/.test(raw))names.push('হাজারী');if(/কবীর|কবির/.test(raw))names.push('কবীর');if(/গুহ/.test(raw))names.push('গুহ');if(/লিংকন|লিং\b/.test(raw))names.push('লিংকন');
      if(names.length){q.author=[...new Set(names)].join(', ');q.authorEstimated=true}
    }
    if(!q.subtopic&&pageSubtopic[q.pdfPage]){q.subtopic=pageSubtopic[q.pdfPage];q.subtopicOrder=999;q.subtopicEstimated=true}
    q.included=true;
    q.needsVisualAudit=(!q.q||!Array.isArray(q.options)||q.options.length<4||!Number.isInteger(q.answer));
    return q;
  }
  const chemP1Data=chemP1DataRaw.map(enrichOcrQuestion);
  const chemAudit={
    included:chemP1Data.length,
    fullOptions:chemP1Data.filter(q=>Array.isArray(q.options)&&q.options.length===4).length,
    answers:chemP1Data.filter(q=>Number.isInteger(q.answer)).length,
    sources:chemP1Data.filter(q=>!!q.source).length,
    authors:chemP1Data.filter(q=>!!q.author).length,
    subtopics:chemP1Data.filter(q=>!!q.subtopic).length,
    needsAudit:chemP1Data.filter(q=>q.needsVisualAudit).length
  };
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.statusCode=200;
  res.end(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Onushiloni Exam Center | Question Bank</title>
<meta name="theme-color" content="#05070d">
<style>
:root{
  --bg:#04060b;--bg2:#080c13;--panel:#0c111b;--panel2:#111826;--panel3:#151e2d;
  --line:#202b3c;--text:#f7f9fc;--muted:#8d99aa;--soft:#bdc7d5;
  --blue:#6da8ff;--cyan:#65e8ff;--green:#52dc91;--red:#ff6f7d;--gold:#f1c96c;
  --shadow:0 26px 70px rgba(0,0,0,.34);--r:20px
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;min-height:100vh;color:var(--text);
  font-family:Inter,"Noto Sans Bengali","Hind Siliguri","Segoe UI",Roboto,Arial,sans-serif;
  background:
    radial-gradient(circle at 11% 5%,rgba(61,100,255,.12),transparent 26%),
    radial-gradient(circle at 88% 16%,rgba(57,209,255,.09),transparent 25%),
    linear-gradient(180deg,#05070d,#03050a 72%);
}
button,input{font:inherit}
button{color:inherit}
a{color:inherit;text-decoration:none}
.shell{max-width:1460px;margin:auto;padding:16px 16px 80px}
.top{
  position:sticky;top:10px;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:11px 14px;border:1px solid rgba(255,255,255,.09);border-radius:18px;
  background:rgba(6,9,15,.82);backdrop-filter:blur(20px) saturate(140%);box-shadow:0 12px 40px rgba(0,0,0,.25)
}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.orb{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;font-weight:900;color:#06101b;
  background:linear-gradient(135deg,var(--cyan),var(--blue));box-shadow:0 0 28px rgba(101,232,255,.22)}
.brand b{display:block;font-size:13px;letter-spacing:.04em}
.brand span{display:block;color:#78869a;font-size:9px;margin-top:2px}
.top-actions{display:flex;gap:8px;align-items:center}
.btn{
  border:1px solid var(--line);background:#0d131e;padding:9px 12px;border-radius:11px;cursor:pointer;font-size:11px;
  transition:.16s ease
}
.btn:hover{transform:translateY(-1px);border-color:#344761;background:#121b29}
.btn.primary{background:linear-gradient(135deg,rgba(79,130,255,.28),rgba(74,220,255,.12));border-color:rgba(104,174,255,.36)}
.hero{padding:52px 5px 24px}
.eyebrow{color:#72839b;font-size:9px;letter-spacing:.18em;text-transform:uppercase}
.hero h1{font-size:clamp(34px,6vw,70px);line-height:.95;letter-spacing:-.055em;margin:10px 0 12px}
.hero p{max-width:760px;color:#8e9bad;font-size:12px;line-height:1.7;margin:0}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:22px 0}
.stat{padding:14px 15px;border:1px solid rgba(255,255,255,.075);background:rgba(255,255,255,.025);border-radius:14px}
.stat span{display:block;color:#6f7b8d;font-size:8px;text-transform:uppercase;letter-spacing:.12em}
.stat b{font-size:24px;display:block;margin-top:5px;letter-spacing:-.04em}
.layout{display:grid;grid-template-columns:360px minmax(0,1fr);gap:16px;align-items:start}
.side{position:sticky;top:78px}
.panel{
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(12,17,27,.96),rgba(8,12,19,.92));
  border-radius:var(--r);box-shadow:var(--shadow)
}
.side-card{padding:15px}
.selector-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:13px}
.selector-title h3{font-size:16px;margin:0;letter-spacing:-.02em}
.selector-title p{font-size:9px;color:#748298;line-height:1.5;margin:4px 0 0}
.facet{border-top:1px solid rgba(255,255,255,.07);padding:12px 0}
.facet:first-of-type{border-top:0}
.facet-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.facet-head b{font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:#8290a5}
.facet-actions{display:flex;gap:5px}
.mini{border:0;background:transparent;color:#6684a4;font-size:8px;cursor:pointer;padding:2px 3px}
.mini:hover{color:#b9ddff}
.check-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.check-grid.one{grid-template-columns:1fr}
.check{
  display:flex;align-items:flex-start;gap:8px;border:1px solid #1c2838;background:#0a1019;border-radius:10px;
  padding:8px 9px;color:#9eacbd;font-size:9px;line-height:1.35;cursor:pointer
}
.check:hover{border-color:#30445e;background:#0e1622}
.check input{width:14px;height:14px;margin:0;accent-color:#6da8ff;flex:0 0 auto}
.check span{min-width:0}
.check small{display:block;color:#5e6c80;margin-top:2px;font-size:7px}
.facet-empty{padding:9px 10px;border:1px dashed #263345;border-radius:10px;color:#657287;font-size:8px;line-height:1.45}
.selector-foot{position:sticky;bottom:8px;margin-top:10px;padding:10px;border:1px solid #223249;background:rgba(8,13,21,.96);border-radius:13px;box-shadow:0 15px 35px rgba(0,0,0,.3)}
.match-count{font-size:9px;color:#8090a5;margin-bottom:8px}
.match-count b{color:#dff2ff;font-size:13px}
.subtopic-head{margin:16px 0 3px;padding:9px 12px;border-left:3px solid #5ecff0;background:linear-gradient(90deg,rgba(65,177,220,.11),transparent);border-radius:7px;color:#d7f4ff;font-size:11px;font-weight:750}
.subtopic-head small{display:block;margin-top:3px;color:#6f829a;font-size:8px;font-weight:500}
.selector-buttons{display:grid;grid-template-columns:1fr auto;gap:7px}
.selector-buttons .btn{width:100%}
.section-label{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:#68768b;margin:2px 0 10px}
.subjects{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}
.papers{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px}
.paper-tab{border:1px solid var(--line);background:#0b111b;color:#8291a6;border-radius:11px;padding:9px 8px;cursor:pointer;font-size:10px;font-weight:700}
.paper-tab:hover{border-color:#354860;color:#cbd8e7}
.paper-tab.active{border-color:rgba(101,205,255,.45);background:linear-gradient(145deg,rgba(54,95,180,.24),rgba(30,110,143,.12));color:#edf7ff}
.subject{
  border:1px solid var(--line);background:#0b111b;border-radius:12px;padding:10px 6px;cursor:pointer;text-align:center;
  transition:.16s
}
.subject:hover{border-color:#354860}
.subject.active{border-color:rgba(101,205,255,.45);background:linear-gradient(145deg,rgba(54,95,180,.24),rgba(30,110,143,.12))}
.subject i{display:block;font-style:normal;font-size:20px}
.subject b{display:block;font-size:9px;margin-top:5px}
.chapter-list{display:grid;gap:6px;max-height:calc(100vh - 260px);overflow:auto;padding-right:3px}
.chapter{
  width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#9ba8b9;padding:10px 11px;border-radius:11px;
  cursor:pointer;line-height:1.35;font-size:11px;display:flex;gap:9px;align-items:flex-start
}
.chapter:hover{background:#101724;color:#dbe7f3}
.chapter.active{background:#121c2a;color:white;border-color:#27384d}
.chapter .no{flex:0 0 24px;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:#0a1019;color:#74849b;font-size:9px}
.chapter.active .no{background:#1e3554;color:#bfe5ff}
.chapter small{display:block;color:#637188;font-size:8px;margin-top:4px}
.main-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-end;margin-bottom:12px}
.main-head h2{font-size:26px;letter-spacing:-.035em;margin:0}
.main-head p{margin:5px 0 0;color:#78869a;font-size:10px}
.tools{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.search{position:relative;min-width:240px}
.search input{
  width:100%;border:1px solid var(--line);background:#0c121c;color:white;padding:10px 12px 10px 34px;border-radius:11px;outline:none;font-size:11px
}
.search:before{content:"⌕";position:absolute;left:12px;top:8px;color:#66758a}
.filter{border:1px solid var(--line);background:#0d131e;color:#aab6c6;padding:9px 10px;border-radius:10px;font-size:10px;cursor:pointer}
.filter.active{color:#eaf5ff;border-color:#3d5f82;background:#122035}
.notice{padding:11px 13px;border:1px solid rgba(241,201,108,.18);background:rgba(241,201,108,.055);border-radius:12px;color:#9d947a;font-size:9px;line-height:1.55;margin-bottom:12px}
.questions{display:grid;gap:13px}
.q{
  position:relative;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:17px;
  background:linear-gradient(145deg,rgba(14,20,31,.98),rgba(8,13,21,.96));box-shadow:0 18px 45px rgba(0,0,0,.20)
}
.q-top{display:flex;gap:10px;justify-content:space-between;align-items:flex-start}
.q-id{display:flex;align-items:center;gap:8px;min-width:0}
.serial{width:32px;height:32px;border-radius:10px;background:#101a28;border:1px solid #263449;display:grid;place-items:center;font-size:11px;font-weight:800;color:#d9ebff}
.ref{font-size:8px;color:#8291a7;line-height:1.55}
.source-ref{display:inline-block;margin-top:3px;color:#aebdd0}
.source-ref b{color:#d9e6f4;font-weight:650}
.ref b{color:#b9c7d9;font-weight:600}
.q-actions{display:flex;gap:6px}
.icon-btn{width:31px;height:31px;border:1px solid var(--line);background:#0b121c;border-radius:10px;cursor:pointer}
.icon-btn.saved{color:var(--gold);border-color:rgba(241,201,108,.36)}
.q-text{font-size:16px;font-weight:650;line-height:1.7;margin:15px 0 12px}
.options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.option{
  border:1px solid #202d3f;background:#0a111b;color:#c9d3df;border-radius:12px;padding:11px 12px;text-align:left;cursor:pointer;
  display:flex;gap:9px;align-items:flex-start;line-height:1.45;transition:.14s
}
.option:hover:not(:disabled){border-color:#38536f;background:#0f1825}
.option:disabled{cursor:default}
.option .letter{flex:0 0 24px;width:24px;height:24px;border-radius:8px;background:#141e2c;display:grid;place-items:center;font-size:10px;color:#91a1b6}
.option.correct{border-color:rgba(82,220,145,.45);background:rgba(82,220,145,.09);color:#dfffee}
.option.correct .letter{background:rgba(82,220,145,.18);color:#8bf0b5}
.option.wrong{border-color:rgba(255,111,125,.46);background:rgba(255,111,125,.08);color:#ffe0e4}
.option.wrong .letter{background:rgba(255,111,125,.16);color:#ff9ca6}
.option.first{box-shadow:inset 0 0 0 1px rgba(255,255,255,.10)}
.answer-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}
.pill{border:1px solid var(--line);background:#0a111b;border-radius:999px;padding:6px 9px;font-size:8px;color:#8f9caf}
.pill.first{color:#d3deeb}.pill.good{color:#82ecae;border-color:rgba(82,220,145,.25)}.pill.bad{color:#ff9aa4;border-color:rgba(255,111,125,.25)}
.solution{margin-top:12px;border:1px solid rgba(101,232,255,.15);background:rgba(101,232,255,.04);border-radius:13px;padding:13px}
.solution .s-title{font-size:8px;color:#6dcce0;text-transform:uppercase;letter-spacing:.13em;margin-bottom:7px}
.solution p{margin:0;color:#aebbc9;font-size:10px;line-height:1.7}
.empty{padding:50px 20px;text-align:center;border:1px dashed #273447;border-radius:16px;color:#728098}
.footer{padding:34px 3px 0;color:#5d6a7d;font-size:9px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:980px){
  .layout{grid-template-columns:1fr}.side{position:static}.chapter-list{max-height:none;grid-template-columns:repeat(2,1fr)}
}
@media(max-width:680px){
  .shell{padding:8px 8px 50px}.top{top:6px;border-radius:14px}.brand span{display:none}.top-actions .btn:first-child{display:none}
  .hero{padding:36px 4px 18px}.stats{grid-template-columns:1fr 1fr}.layout{gap:10px}.panel{border-radius:15px}
  .chapter-list{grid-template-columns:1fr}.main-head{align-items:flex-start;flex-direction:column}.tools{width:100%;justify-content:flex-start}
  .search{min-width:0;flex:1}.options{grid-template-columns:1fr}.q{padding:14px}.q-text{font-size:15px}
}
</style>
</head>
<body>
<div class="shell">
  <header class="top">
    <a class="brand" href="/onushiloni">
      <div class="orb">O</div>
      <div><b>ONUSHILONI EXAM CENTER</b><span>Question Bank • Practice first, exam later</span></div>
    </a>
    <div class="top-actions">
      <a class="btn" href="/">← Admission by DBT</a>
      <button class="btn primary" id="resetProgress">Reset progress</button>
    </div>
  </header>

  <section class="hero">
    <div class="eyebrow">Admission by DBT • Practice System</div>
    <h1>Question Bank.</h1>
    <p>Chapter-wise practice with hidden answers. Your first selection is permanently shown for that question, the correct answer is revealed after you answer, and the solution appears immediately.</p>
  </section>

  <section class="stats">
    <div class="stat"><span>Loaded questions</span><b id="stLoaded">0</b></div>
    <div class="stat"><span>Attempted</span><b id="stAttempted">0</b></div>
    <div class="stat"><span>Correct first try</span><b id="stCorrect">0</b></div>
    <div class="stat"><span>Bookmarks</span><b id="stSaved">0</b></div>
  </section>

  <div class="layout">
    <aside class="side">
      <div class="panel side-card">
        <div class="selector-title">
          <div><h3>Build your question set</h3><p>Select one or many checkboxes. Multiple values inside one category are combined; categories work together.</p></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>Subject</b><div class="facet-actions"><button class="mini" data-all="subject">All</button><button class="mini" data-clear="subject">Clear</button></div></div>
          <div class="check-grid" id="subjectChecks"></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>Paper</b><div class="facet-actions"><button class="mini" data-all="paper">All</button><button class="mini" data-clear="paper">Clear</button></div></div>
          <div class="check-grid" id="paperChecks"></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>Chapter</b><div class="facet-actions"><button class="mini" data-all="chapter">All</button><button class="mini" data-clear="chapter">Clear</button></div></div>
          <div class="check-grid one" id="chapterChecks"></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>Chapter Subtopic</b><div class="facet-actions"><button class="mini" data-all="subtopic">All</button><button class="mini" data-clear="subtopic">Clear</button></div></div>
          <div class="check-grid one" id="subtopicChecks"></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>MCQ Type</b><div class="facet-actions"><button class="mini" data-all="type">All</button><button class="mini" data-clear="type">Clear</button></div></div>
          <div class="check-grid" id="typeChecks"></div>
        </div>

        <div class="facet">
          <div class="facet-head"><b>Author</b><div class="facet-actions"><button class="mini" data-all="author">All</button><button class="mini" data-clear="author">Clear</button></div></div>
          <div class="check-grid one" id="authorChecks"></div>
        </div>

        <div class="selector-foot">
          <div class="match-count"><b id="matchCount">0</b> questions match the current selection</div>
          <div class="selector-buttons">
            <button class="btn primary" id="buildSet">Show Questions</button>
            <button class="btn" id="clearSelector">Reset</button>
          </div>
        </div>
      </div>
    </aside>

    <main>
      <div class="main-head">
        <div><h2 id="chapterTitle">Selected Questions</h2><p id="chapterMeta">Choose filters, then press Show Questions.</p></div>
        <div class="tools">
          <label class="search"><input id="search" placeholder="Search loaded questions..."></label>
          <button class="filter active" data-filter="all">All</button>
          <button class="filter" data-filter="unanswered">Unanswered</button>
          <button class="filter" data-filter="wrong">Wrong first try</button>
          <button class="filter" data-filter="saved">Saved</button>
        </div>
      </div>
      <div class="notice">Chemistry 1st Paper is being rebuilt directly from the original QB pages. Only page-checked MCQs are published. Raw OCR records are kept internal and are not shown as final questions. Full question text, all options, original serial, chapter/subtopic, answer, author, source reference, printed solution, and diagrams are checked against the QB before publication.</div>
      <div id="paperProgress" style="margin:0 0 12px"></div>
      <section class="questions" id="questions"></section>
    </main>
  </div>

  <footer class="footer"><span>Onushiloni Exam Center • admissionbydbt.vercel.app/onushiloni</span><span>Progress is saved locally in this browser.</span></footer>
</div>

<script>
var SUBJECTS={
  chemistry:{name:'Chemistry',icon:'⚗️',papers:[
    {name:'রসায়ন প্রথম পত্র',short:'1st Paper',chapters:[
      'ল্যাবরেটরির নিরাপদ ব্যবহার','গুণগত রসায়ন','মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন','রাসায়নিক পরিবর্তন','কর্মমুখী রসায়ন'
    ]},
    {name:'রসায়ন দ্বিতীয় পত্র',short:'2nd Paper',chapters:[
      'পরিবেশ রসায়ন','জৈব রসায়ন','পরিমাণগত রসায়ন','তড়িৎ রসায়ন','অর্থনৈতিক রসায়ন'
    ]}
  ]},
  physics:{name:'Physics',icon:'⚛️',papers:[
    {name:'পদার্থবিজ্ঞান প্রথম পত্র',short:'1st Paper',chapters:[
      'ভৌত জগৎ ও পরিমাপ','ভেক্টর','গতিবিদ্যা','নিউটনিয়ান বলবিদ্যা','কাজ, শক্তি ও ক্ষমতা','মহাকর্ষ ও অভিকর্ষ','পদার্থের গাঠনিক ধর্ম','পর্যাবৃত্ত গতি','তরঙ্গ','আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব'
    ]},
    {name:'পদার্থবিজ্ঞান দ্বিতীয় পত্র',short:'2nd Paper',chapters:[
      'তাপগতিবিদ্যা','স্থির তড়িৎ','চল তড়িৎ','তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব','তড়িৎ চৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ','জ্যামিতিক আলোকবিজ্ঞান','ভৌত আলোকবিজ্ঞান','আধুনিক পদার্থবিজ্ঞানের সূচনা','পরমাণুর মডেল ও নিউক্লীয় পদার্থবিজ্ঞান','সেমিকন্ডাক্টর ও ইলেকট্রনিক্স','জ্যোতির্বিজ্ঞান'
    ]}
  ]},
  biology:{name:'Biology',icon:'🧬',papers:[
    {name:'জীববিজ্ঞান প্রথম পত্র',short:'1st Paper',chapters:[
      'কোষ ও এর গঠন','কোষ বিভাজন','কোষ রসায়ন','অণুজীব','শৈবাল ও ছত্রাক','ব্রায়োফাইটা ও টেরিডোফাইটা','নগ্নবীজী ও আবৃতবীজী উদ্ভিদ','টিস্যু ও টিস্যুতন্ত্র','উদ্ভিদ শারীরতত্ত্ব','উদ্ভিদ প্রজনন','জীবপ্রযুক্তি','জীবের পরিবেশ, বিস্তার ও সংরক্ষণ'
    ]},
    {name:'জীববিজ্ঞান দ্বিতীয় পত্র',short:'2nd Paper',chapters:[
      'প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস','প্রাণীর পরিচিতি (হাইড্রা, ঘাসফড়িং ও রুই মাছ)','মানব শারীরতত্ত্ব: পরিপাক ও শোষণ','মানব শারীরতত্ত্ব: রক্ত ও সঞ্চালন','মানব শারীরতত্ত্ব: শ্বাসক্রিয়া ও শ্বসন','মানব শারীরতত্ত্ব: বর্জ্য ও নিষ্কাশন','মানব শারীরতত্ত্ব: চলন ও অঙ্গচালনা','মানব শারীরতত্ত্ব: সমন্বয় ও নিয়ন্ত্রণ','মানব জীবনের ধারাবাহিকতা','মানবদেহের প্রতিরক্ষা','জিনতত্ত্ব ও বিবর্তন','প্রাণীর আচরণ'
    ]}
  ]}
};

var EXPECTED_COUNTS={
  chemistry:{
    0:{0:293,1:733,2:736,3:733,4:371}
  }
};
function expectedCount(subject,paper,chapter){
  return EXPECTED_COUNTS[subject]&&EXPECTED_COUNTS[subject][paper]&&EXPECTED_COUNTS[subject][paper][chapter]||0;
}
function expectedPaperCount(subject,paper){
  var x=EXPECTED_COUNTS[subject]&&EXPECTED_COUNTS[subject][paper];
  return x?Object.values(x).reduce(function(a,b){return a+b},0):0;
}

var OCR_CHEM_DATA=${JSON.stringify(chemP1Data)};
var CHEM_AUDIT=${JSON.stringify(chemAudit)};
var QUESTIONS=[
{id:'chem-p1-c1-q1',subject:'chemistry',paper:0,type:'MCQ',author:'হাজারী',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:1,pdfPage:4,q:'ল্যাবরেটরিতে নিজের নিরাপত্তা নিশ্চিত করতে নিচের কোন প্রাথমিক ব্যবস্থা নিলে ভুল হবে?',options:['এপ্রোন পরা','নিরাপদ চশমা পকেটে থাকা','হাতে গ্লাভস পরা','পায়ে জুতা পরা'],answer:1,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q2',subject:'chemistry',paper:0,type:'MCQ',author:'হাজারী',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:2,pdfPage:4,q:'কেমিস্ট্রি ল্যাবে শ্বাস-প্রশ্বাসের ক্ষেত্রে নিরাপদ থাকার জন্য নিচের কোনটি ব্যবহার করা হয়?',options:['নিরাপদ চশমা','এপ্রোন','গ্লাভস','মাস্ক'],answer:3,source:'[ব. বো. ২০২১]',sourcePrinted:true,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q3',subject:'chemistry',paper:0,type:'MCQ',author:'হাজারী, কবীর',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:3,pdfPage:4,q:'কেমিস্ট্রি ল্যাবে কখন নিরাপত্তা চশমা ব্যবহার করা আবশ্যক?',options:['দ্রবণ প্রস্তুতিতে','রাসায়নিক বস্তুর ওজন নিতে','রাসায়নিক পদার্থ উদ্বায়ী হলে','যন্ত্রপাতি পরিষ্কার করার সময়'],answer:2,source:'[MAT: ১৭-১৮]',sourcePrinted:true,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q4',subject:'chemistry',paper:0,type:'MCQ',author:'কবীর',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:4,pdfPage:4,q:'ল্যাবরেটরির নিরাপত্তা সামগ্রী কোনটি?',options:['ফিউম হুড','লাইফ জ্যাকেট','রেইন কোট','O₂ গ্যাস সিলিন্ডার'],answer:0,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q5',subject:'chemistry',paper:0,type:'MCQ',author:'গুহ',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:5,pdfPage:4,q:'ল্যাবরেটরিতে যখন এসিড, ক্ষার ও বিভিন্ন বিষাক্ত পদার্থ নিয়ে কাজ করা হয়, তখন কোন ধরনের সাবধানতা অবলম্বন করা উচিত?',options:['এপ্রোন পরা','গগলস ব্যবহার করা','মাস্ক ব্যবহার করা','গ্লাভস ব্যবহার করা'],answer:3,source:'[Dental 2016-17]',sourcePrinted:true,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q6',subject:'chemistry',paper:0,type:'MCQ',author:'গুহ',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:6,pdfPage:4,q:'ল্যাবরেটরিতে নিচের কোন কাজটি বেশি বিপজ্জনক?',options:['নির্গত গ্যাসের গন্ধ ও স্বাদ নেওয়া','খাবার গ্রহণ','দ্রুত চলাচল','লেবেল ছাড়া বোতলের বিকারক ব্যবহার'],answer:0,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q7',subject:'chemistry',paper:0,type:'MCQ',author:'গুহ',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:7,pdfPage:4,q:'বৈদ্যুতিক শক বা ক্ষত থেকে সুরক্ষার জন্য কোন গ্লাভস উপযোগী?',options:['ল্যাটেক্স','নিওপ্রিন','জিটেক্স','PVC'],answer:0,source:'[ব. বো. ১৯]',sourcePrinted:true,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q8',subject:'chemistry',paper:0,type:'MCQ',author:'গুহ',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:8,pdfPage:4,q:'নিচের অক্সাইডগুলোর মধ্যে কোনটি পাইরেক্স গ্লাস তৈরি করতে পারে?',options:['SiO₂','LiO₂','Al₂O₃','B₂O₃'],answer:3,source:'[BUET: 12-13]',sourcePrinted:true,solution:'পাইরেক্স গ্লাসের রাসায়নিক সংকেত → Na₂O.K₂O.ZnO.BaO.x(SiO₂,B₂O₃)। সঠিক উত্তর (খ) ও (ঘ) উভয়ই হয়, তবে সব গ্লাসেই SiO₂ থাকে কিন্তু B₂O₃ পাইরেক্স গ্লাসের অনন্য বৈশিষ্ট্য যা গ্লাসকে তাপ, রাসায়নিক এবং যান্ত্রিক দিক থেকে অধিক টেকসই করে তোলে। তাই একক উত্তর হিসেবে (ঘ) উত্তর করাটাই শ্রেয়। বিঃ দ্রঃ কবীর স্যার ও হাজারী স্যারের বইতে (ঘ) উত্তর দেওয়া।',solutionPrinted:true},
{id:'chem-p1-c1-q9',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:9,pdfPage:4,q:'কোন ল্যাবে সবচেয়ে বেশি সতর্ক থাকতে হয়?',options:['রসায়ন','গণিত','পদার্থবিজ্ঞান','আইসিটি'],answer:0,source:'',sourcePrinted:false,solution:'লিংকন স্যারের বইয়ে উত্তর (ঘ) দেওয়া থাকলেও QB-এর উত্তরমালায় সঠিক উত্তর (ক)।',solutionPrinted:true},
{id:'chem-p1-c1-q10',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:10,pdfPage:4,q:'নিরাপদ চশমা ছাড়া ল্যাবরেটরিতে আর কোন চশমা ব্যবহার করা যায়?',options:['সান গ্লাস','সাধারণ চশমা','পাওয়ারযুক্ত লেন্স','রাসায়নিক স্প্ল্যাশ'],answer:1,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q11',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:11,pdfPage:4,q:'জীবাণু প্রতিরোধ করে কোনটি?',options:['NCP গ্লাভস','Zetex গ্লাভস','PVC গ্লাভস','Nitrile গ্লাভস'],answer:3,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q12',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:12,pdfPage:4,q:'ল্যাবে শরীরে আগুন লাগলে কী করতে হবে?',options:['শরীরে CO₂ প্রয়োগ করতে হবে','কম্বল জড়াতে হবে','ফায়ার সার্ভিসে কল দিতে হবে','হাই-স্পিডে পানি মারতে হবে'],answer:1,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q13',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:13,pdfPage:4,q:'বৈদ্যুতিক শক বা ক্ষত সৃষ্টি থেকে সুরক্ষার জন্য কোন গ্লাভস ব্যবহার হয়?',options:['ল্যাটেক্স','নিওপ্রিন','জিটেক্স','PVC'],answer:2,source:'[ব. বো. ২০১৯]',sourcePrinted:true,solution:'জিটেক্স গ্লাভস বৈদ্যুতিক শক বা ক্ষত হতে সুরক্ষার জন্য ব্যবহৃত হয়।',solutionPrinted:true},
{id:'chem-p1-c1-q14',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:14,pdfPage:4,q:'ল্যাবরেটরিতে কোন ধরনের রাসায়নিক পদার্থ চোখের জন্য সবচেয়ে বেশি ঝুঁকিপূর্ণ?',options:['জারক','বিজারক','দাহ্য','উদ্বায়ী'],answer:3,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q15',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:15,pdfPage:4,q:'ল্যাবরেটরির নিরাপদ হিসেবে ব্যবহার হয় না কোনটি?',options:['ফিউম হুড','অগ্নি নির্বাপক','সেন্ট্রিফিউজ','এইড বক্স'],answer:2,source:'[রা. বো. ২১]',sourcePrinted:true,solution:'ফিউম হুড—বায়ু চলাচল যন্ত্র, যা বিপজ্জনক বা বিষাক্ত ধোঁয়া, বাষ্প বা ধুলো বের করে দেয়। অগ্নিনির্বাপক—আগুন নেভানোর জন্য ব্যবহৃত। এইড বক্স—প্রাথমিক চিকিৎসার জন্য ব্যবহৃত।',solutionPrinted:true},
{id:'chem-p1-c1-q16',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:16,pdfPage:4,q:'কোন গ্যাসটিতে ঝাঁঝালো গন্ধ আছে?',options:['NH₃','SO₂','H₂S','HCl'],answer:0,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},
{id:'chem-p1-c1-q17',subject:'chemistry',paper:0,type:'MCQ',author:'লিংকন',subtopic:'ল্যাবরেটরির ব্যবহার বিধি: পোশাক, নিরাপদ গ্লাস, মাস্ক, হ্যান্ড গ্লাভস',subtopicOrder:1,chapter:0,serial:17,pdfPage:4,q:'ল্যাবরেটরিতে গায়ে পরিধান করতে হয় কোনটি?',options:['এপ্রোন','মাস্ক','গ্লাভস','লেন্স'],answer:0,source:'',sourcePrinted:false,solution:'',solutionPrinted:false},

{id:'phys-1-4',subject:'physics',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:4,pdfPage:4,q:'তড়িৎ চুম্বকীয় তরঙ্গ তত্ত্ব আবিষ্কার করেন—',options:['রাদারফোর্ড','নিউটন','ম্যাক্সওয়েল','আইনস্টাইন'],answer:2,solution:'জেমস ক্লার্ক ম্যাক্সওয়েল তড়িৎ ও চৌম্বক ক্ষেত্রকে একত্রিত করে তড়িৎচুম্বকীয় তরঙ্গের তত্ত্ব প্রতিষ্ঠা করেন।'},
{id:'phys-1-6',subject:'physics',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:6,pdfPage:4,q:'কোনো বস্তু হতে শক্তির বিকিরণ নিরবচ্ছিন্নভাবে ঘটে না—এই তত্ত্বের প্রবক্তা কে?',options:['লর্ড রাদারফোর্ড','আলবার্ট আইনস্টাইন','ম্যাক্স প্ল্যাঙ্ক','মাইকেল ফ্যারাডে'],answer:2,solution:'ম্যাক্স প্ল্যাঙ্ক শক্তি কোয়ান্টা আকারে নির্গত বা শোষিত হয়—এই ধারণা দেন।'},
{id:'phys-1-10',subject:'physics',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:10,pdfPage:4,q:'“ভর ও শক্তি সমতুল্য”—কোন বিজ্ঞানীর অভিমত?',options:['নিউটন','গ্যালিলিও','আইনস্টাইন','ফ্যারাডে'],answer:2,solution:'আইনস্টাইনের ভর-শক্তি সমতুল্যতার সম্পর্ক E = mc² দ্বারা প্রকাশ করা হয়।'},
{id:'phys-1-12',subject:'physics',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:12,pdfPage:4,q:'কোন বৈজ্ঞানিক সর্বপ্রথম সূর্যকেন্দ্রিক বিশ্বের ধারণা প্রদান করেন?',options:['কেপলার','টলেমি','ডেমোক্রিটাস','কোপার্নিকাস'],answer:3,solution:'নিকোলাস কোপার্নিকাস সূর্যকেন্দ্রিক মডেলকে সুসংগঠিতভাবে উপস্থাপন করেন।'},
{id:'phys-1-14',subject:'physics',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:14,pdfPage:4,q:'পরমাণুর ধারণা সর্বপ্রথম প্রদান করেন—',options:['নিউটন','ডাল্টন','ডেমোক্রিটাস','আর্কিমিডিস'],answer:2,solution:'প্রাচীন গ্রিক দার্শনিক ডেমোক্রিটাস পদার্থের অবিভাজ্য ক্ষুদ্র কণার ধারণা দেন।'},

{id:'bio-1-1',subject:'biology',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:1,pdfPage:4,q:'কোষ আবিষ্কার করেন কে?',options:['লিউয়েন হুক','রবার্ট হুক','রবার্ট ব্রাউন','রবার্ট ডারউইন'],answer:1,solution:'রবার্ট হুক কর্কের পাতলা অংশ পর্যবেক্ষণ করে “cell” শব্দটি ব্যবহার করেন।'},
{id:'bio-1-2',subject:'biology',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:2,pdfPage:4,q:'জীবদেহের জৈবিক কার্যকলাপের একক কী?',options:['অঙ্গ','টিস্যু','জীবকোষ','কোষপর্দা'],answer:2,solution:'কোষ জীবদেহের গঠনগত ও কার্যগত মৌলিক একক।'},
{id:'bio-1-3',subject:'biology',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:3,pdfPage:4,q:'Cell শব্দটি কোন ভাষা থেকে এসেছে?',options:['গ্রিক','ল্যাটিন','সুইডিশ','ইংরেজি'],answer:1,solution:'Cell শব্দটি ল্যাটিন “cella” থেকে এসেছে, যার অর্থ ছোট কক্ষ বা প্রকোষ্ঠ।'},
{id:'bio-1-4',subject:'biology',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:4,pdfPage:4,q:'কোন বিজ্ঞানীগণ কোষতত্ত্ব দেন?',options:['লাইনার ও ক্লিকার','সিয়ার ও নিকলসন','স্লাইডেন ও সোয়ান','ভ্যান লিউয়েন হুক ও লিন'],answer:2,solution:'ম্যাথিয়াস স্লাইডেন ও থিওডর সোয়ান কোষতত্ত্ব প্রণয়নে গুরুত্বপূর্ণ ভূমিকা রাখেন।'},
{id:'bio-1-5',subject:'biology',paper:0,type:'MCQ',author:'',subtopic:'',subtopicOrder:999,chapter:0,serial:5,pdfPage:4,q:'প্রাণীকোষ বিষয়ে কোনটি সঠিক?',options:['কোষে সেন্ট্রোসোম থাকে','সাইটোপ্লাজমে প্লাস্টিড থাকে','সঞ্চিত খাদ্য সাধারণত শ্বেতসার','কোষ কেন্দ্রে বড় কোষ গহ্বর থাকে'],answer:0,solution:'উৎসের ব্যাখ্যা অনুযায়ী প্রাণীকোষে সাধারণত সেন্ট্রোসোম থাকে। প্লাস্টিড থাকে না; সঞ্চিত খাদ্য প্রধানত গ্লাইকোজেন।'}
];
var VERIFIED_CHEM=QUESTIONS.filter(function(q){return q.subject==='chemistry'&&(q.paper||0)===0});
var OTHER_QUESTIONS=QUESTIONS.filter(function(q){return !(q.subject==='chemistry'&&(q.paper||0)===0)});
var VERIFIED_MAP={};
VERIFIED_CHEM.forEach(function(q){VERIFIED_MAP[q.chapter+'|'+q.serial]=q});
// IMPORTANT: OCR_CHEM_DATA is retained only as an internal transcription aid.
// It is not published to students until the record has been checked against the QB page.
QUESTIONS=VERIFIED_CHEM.concat(OTHER_QUESTIONS);


var KEY='onushiloni_qb_state_v1';
var state={answers:{},saved:{}};
try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}

var selected={subject:new Set(),paper:new Set(),chapter:new Set(),subtopic:new Set(),type:new Set(),author:new Set()};
var builtIds=[];
var filter='all',query='';

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function letter(i){return ['ক','খ','গ','ঘ'][i]||String(i+1)}
function paperKey(p){return String(Number(p||0))}
function chapterKey(q){return q.subject+'|'+paperKey(q.paper)+'|'+q.chapter}
function subjectOrder(k){return {chemistry:0,physics:1,biology:2}[k]??99}
function paperData(q){return SUBJECTS[q.subject].papers[q.paper||0]}
function chapterName(q){var p=paperData(q);return p&&p.chapters[q.chapter]?p.chapters[q.chapter]:'Chapter '+(q.chapter+1)}
function qType(q){return q.type||'MCQ'}
function qSubtopic(q){return (q.subtopic||'').trim()}
function qAuthor(q){return (q.author||'').trim()}

function checkedValues(group){
  return Array.from(document.querySelectorAll('input[data-group="'+group+'"]:checked')).map(function(x){return x.value});
}
function syncSelected(group){
  selected[group]=new Set(checkedValues(group));
}
function allQuestionTypes(){
  return Array.from(new Set(QUESTIONS.map(qType))).sort();
}
function allAuthors(){
  return Array.from(new Set(QUESTIONS.map(qAuthor).filter(Boolean))).sort(function(a,b){return a.localeCompare(b)});
}
function availableSubtopics(){
  var qs=QUESTIONS.filter(function(q){
    if(selected.subject.size&&!selected.subject.has(q.subject))return false;
    if(selected.paper.size&&!selected.paper.has(paperKey(q.paper)))return false;
    if(selected.chapter.size&&!selected.chapter.has(chapterKey(q)))return false;
    return !!qSubtopic(q);
  });
  var seen=new Map();
  qs.forEach(function(q){
    var key=chapterKey(q)+'|'+qSubtopic(q);
    if(!seen.has(key))seen.set(key,{key:key,label:qSubtopic(q),subject:q.subject,paper:q.paper||0,chapter:q.chapter,order:Number(q.subtopicOrder??999)});
  });
  return Array.from(seen.values()).sort(function(a,b){
    return subjectOrder(a.subject)-subjectOrder(b.subject)||a.paper-b.paper||a.chapter-b.chapter||a.order-b.order||a.label.localeCompare(b.label);
  });
}

function renderSubjectChecks(){
  var el=document.getElementById('subjectChecks');
  el.innerHTML=Object.keys(SUBJECTS).map(function(k){
    var s=SUBJECTS[k],checked=selected.subject.has(k);
    return '<label class="check"><input type="checkbox" data-group="subject" value="'+k+'" '+(checked?'checked':'')+'><span>'+s.icon+' '+esc(s.name)+'</span></label>';
  }).join('');
}
function renderPaperChecks(){
  var el=document.getElementById('paperChecks');
  el.innerHTML=[
    '<label class="check"><input type="checkbox" data-group="paper" value="0" '+(selected.paper.has('0')?'checked':'')+'><span>1st Paper</span></label>',
    '<label class="check"><input type="checkbox" data-group="paper" value="1" '+(selected.paper.has('1')?'checked':'')+'><span>2nd Paper</span></label>'
  ].join('');
}
function effectiveSubjects(){
  return selected.subject.size?Array.from(selected.subject):Object.keys(SUBJECTS);
}
function effectivePapers(){
  return selected.paper.size?Array.from(selected.paper):['0','1'];
}
function renderChapterChecks(){
  var el=document.getElementById('chapterChecks'),rows=[];
  effectiveSubjects().forEach(function(sk){
    effectivePapers().forEach(function(pk){
      var p=SUBJECTS[sk].papers[Number(pk)];
      if(!p)return;
      p.chapters.forEach(function(name,ci){
        var key=sk+'|'+pk+'|'+ci;
        var loaded=QUESTIONS.filter(function(q){return q.subject===sk&&paperKey(q.paper)===pk&&q.chapter===ci}).length;
        var expected=expectedCount(sk,Number(pk),ci);
        var status=expected?(loaded+' / '+expected+' verified'):loaded+' loaded question'+(loaded===1?'':'s');
        rows.push('<label class="check"><input type="checkbox" data-group="chapter" value="'+key+'" '+(selected.chapter.has(key)?'checked':'')+'><span>'+esc(SUBJECTS[sk].name)+' • '+p.short+' • '+(ci+1)+'. '+esc(name)+'<small>'+status+'</small></span></label>');
      });
    });
  });
  el.innerHTML=rows.length?rows.join(''):'<div class="facet-empty">Choose a subject or paper to see chapters.</div>';
}
function renderSubtopicChecks(){
  var el=document.getElementById('subtopicChecks'),vals=availableSubtopics();
  el.innerHTML=vals.length?vals.map(function(x){
    var p=SUBJECTS[x.subject].papers[x.paper];
    return '<label class="check"><input type="checkbox" data-group="subtopic" value="'+esc(x.key)+'" '+(selected.subtopic.has(x.key)?'checked':'')+'><span>'+esc(x.label)+'<small>'+esc(SUBJECTS[x.subject].name)+' • '+esc(p.short)+' • Ch '+(x.chapter+1)+'</small></span></label>';
  }).join(''):'<div class="facet-empty">Exact QB subtopics will appear here as the full question database is transcribed. No subtopic names are invented.</div>';
}
function renderTypeChecks(){
  var el=document.getElementById('typeChecks'),vals=allQuestionTypes();
  el.innerHTML=vals.length?vals.map(function(v){
    return '<label class="check"><input type="checkbox" data-group="type" value="'+esc(v)+'" '+(selected.type.has(v)?'checked':'')+'><span>'+esc(v)+'</span></label>';
  }).join(''):'<div class="facet-empty">Question-type metadata will appear here when loaded.</div>';
}
function renderAuthorChecks(){
  var el=document.getElementById('authorChecks'),vals=allAuthors();
  el.innerHTML=vals.length?vals.map(function(v){
    return '<label class="check"><input type="checkbox" data-group="author" value="'+esc(v)+'" '+(selected.author.has(v)?'checked':'')+'><span>'+esc(v)+'</span></label>';
  }).join(''):'<div class="facet-empty">No author metadata is loaded in the starter data yet. When the full QB dataset includes authors, they will appear here automatically.</div>';
}

function questionMatchesSelection(q){
  if(selected.subject.size&&!selected.subject.has(q.subject))return false;
  if(selected.paper.size&&!selected.paper.has(paperKey(q.paper)))return false;
  if(selected.chapter.size&&!selected.chapter.has(chapterKey(q)))return false;
  if(selected.subtopic.size&&!selected.subtopic.has(chapterKey(q)+'|'+qSubtopic(q)))return false;
  if(selected.type.size&&!selected.type.has(qType(q)))return false;
  if(selected.author.size&&!selected.author.has(qAuthor(q)))return false;
  return true;
}
function sortedMatches(){
  return QUESTIONS.filter(questionMatchesSelection).sort(function(a,b){
    return subjectOrder(a.subject)-subjectOrder(b.subject) ||
      (a.paper||0)-(b.paper||0) ||
      a.chapter-b.chapter ||
      Number(a.subtopicOrder??999)-Number(b.subtopicOrder??999) ||
      Number(a.serial)-Number(b.serial) ||
      Number(a.pdfPage||0)-Number(b.pdfPage||0);
  });
}
function updateMatchCount(){
  document.getElementById('matchCount').textContent=sortedMatches().length;
}

function bindSelectorInputs(){
  document.querySelectorAll('input[data-group]').forEach(function(inp){
    inp.onchange=function(){
      var g=inp.dataset.group;syncSelected(g);
      if(g==='subject'||g==='paper'){
        renderChapterChecks();
        renderSubtopicChecks();
        bindSelectorInputs();
      }else if(g==='chapter'){
        renderSubtopicChecks();
        bindSelectorInputs();
      }
      updateMatchCount();
    };
  });
}
function renderSelector(){
  renderSubjectChecks();renderPaperChecks();renderChapterChecks();renderSubtopicChecks();renderTypeChecks();renderAuthorChecks();bindSelectorInputs();updateMatchCount();
}

function setGroupAll(group,on){
  document.querySelectorAll('input[data-group="'+group+'"]').forEach(function(x){x.checked=on});
  syncSelected(group);
  if(group==='subject'||group==='paper'){renderChapterChecks();renderSubtopicChecks();bindSelectorInputs()}
  else if(group==='chapter'){renderSubtopicChecks();bindSelectorInputs()}
  updateMatchCount();
}
document.querySelectorAll('[data-all]').forEach(function(b){b.onclick=function(){setGroupAll(b.dataset.all,true)}});
document.querySelectorAll('[data-clear]').forEach(function(b){b.onclick=function(){setGroupAll(b.dataset.clear,false)}});

function renderQuestion(q){
  var answerKnown=Number.isInteger(q.answer)&&q.answer>=0&&q.answer<(q.options||[]).length;
  var chosen=state.answers[q.id],answered=answerKnown&&chosen!==undefined,saved=!!state.saved[q.id];
  var options=Array.isArray(q.options)?q.options:[];
  var opts=options.map(function(o,i){
    var cls='option';
    if(answered){
      if(i===q.answer)cls+=' correct';
      if(i===chosen&&i!==q.answer)cls+=' wrong';
      if(i===chosen)cls+=' first';
    }
    return '<button class="'+cls+'" data-opt="'+i+'" '+(!answerKnown||answered?'disabled':'')+'><span class="letter">'+letter(i)+'</span><span>'+esc(o)+'</span></button>';
  }).join('');
  if(!opts&&q.raw)opts='<div class="facet-empty" style="grid-column:1/-1;white-space:pre-wrap">OCR text: '+esc(q.raw)+'</div>';
  var meta='';
  if(answered){
    meta='<div class="answer-meta"><span class="pill first">First selected: '+letter(chosen)+'. '+esc(options[chosen])+'</span>'+
      '<span class="pill '+(chosen===q.answer?'good':'bad')+'">'+(chosen===q.answer?'✓ Correct on first try':'✕ Wrong on first try')+'</span>'+
      '<span class="pill good">Correct: '+letter(q.answer)+'. '+esc(options[q.answer])+'</span></div>'+
      '<div class="solution"><div class="s-title">Answer & solution</div><p>'+esc(q.solution||(q.solutionPrinted===false?'No separate solution is printed for this question in the QB.':'Solution transcription pending.'))+'</p></div>';
  }else if(!answerKnown){
    meta='<div class="answer-meta"><span class="pill">Included from QB • answer audit pending</span>'+
      (q.ocrConfidence?'<span class="pill">OCR confidence: '+esc(q.ocrConfidence)+'</span>':'')+'</div>'+
      (q.solution?'<div class="solution"><div class="s-title">Printed note / solution (OCR)</div><p>'+esc(q.solution)+'</p></div>':'');
  }
  var p=paperData(q),printedSource=q.source?esc(q.source):'';
  var sourceLine=printedSource?'<br><span class="source-ref"><b>'+printedSource+'</b></span>':'';
  var extra=(qType(q)?' • '+esc(qType(q)):'')+(qAuthor(q)?' • Author: '+esc(qAuthor(q)):'')+(q.needsVisualAudit?' • ⚠ audit pending':'');
  return '<article class="q" data-qid="'+q.id+'">'+
    '<div class="q-top"><div class="q-id"><div class="serial">'+q.serial+'</div><div class="ref"><b>'+esc(SUBJECTS[q.subject].name)+' • '+esc(p.name)+'</b><br>'+
    esc(chapterName(q))+(qSubtopic(q)?' • '+esc(qSubtopic(q)):'')+' • PDF p.'+q.pdfPage+extra+sourceLine+'</div></div>'+
    '<div class="q-actions"><button class="icon-btn '+(saved?'saved':'')+'" data-save title="Bookmark">'+(saved?'★':'☆')+'</button></div></div>'+
    '<div class="q-text">'+esc(q.q||'OCR text requires verification')+'</div><div class="options">'+opts+'</div>'+meta+'</article>';
}

function postFilter(q){
  var a=state.answers[q.id];
  if(query && String(q.q||'').toLowerCase().indexOf(query.toLowerCase())===-1 && (q.options||[]).join(' ').toLowerCase().indexOf(query.toLowerCase())===-1)return false;
  if(filter==='unanswered'&&a!==undefined)return false;
  if(filter==='wrong'&&(a===undefined||!Number.isInteger(q.answer)||a===q.answer))return false;
  if(filter==='saved'&&!state.saved[q.id])return false;
  return true;
}
function renderBuiltQuestions(){
  var base=QUESTIONS.filter(function(q){return builtIds.indexOf(q.id)!==-1}).sort(function(a,b){
    return subjectOrder(a.subject)-subjectOrder(b.subject)||(a.paper||0)-(b.paper||0)||a.chapter-b.chapter||Number(a.subtopicOrder??999)-Number(b.subtopicOrder??999)||Number(a.serial)-Number(b.serial);
  });
  var list=base.filter(postFilter),el=document.getElementById('questions');
  document.getElementById('chapterTitle').textContent='Selected Questions';
  document.getElementById('chapterMeta').textContent=builtIds.length?builtIds.length+' questions selected • '+list.length+' currently visible':'Choose one or more checkboxes, then press Show Questions.';
  if(!builtIds.length){el.innerHTML='<div class="empty">Select Subject, Paper, Chapter, Subtopic, MCQ Type and/or Author using the checkboxes. Then press <b>Show Questions</b>. Leaving a category unchecked means “all” for that category.</div>';return}
  if(!list.length){el.innerHTML='<div class="empty">No questions match the current search/progress filter.</div>';return}
  var out=[],lastChapter='',lastSubtopic='';
  list.forEach(function(q){
    var chapterGroup=q.subject+'|'+(q.paper||0)+'|'+q.chapter;
    if(chapterGroup!==lastChapter){
      var p=paperData(q);
      out.push('<div style="padding:10px 3px 2px;color:#8ea1b8;font-size:10px;letter-spacing:.04em"><b style="color:#d9e8f7">'+esc(SUBJECTS[q.subject].name)+' • '+esc(p.short)+'</b> — '+esc(chapterName(q))+'</div>');
      lastChapter=chapterGroup;lastSubtopic='';
    }
    var sub=qSubtopic(q);
    var subKey=chapterGroup+'|'+sub;
    if(sub&&subKey!==lastSubtopic){
      out.push('<div class="subtopic-head">'+esc(sub)+'<small>MCQs under this QB subtopic</small></div>');
      lastSubtopic=subKey;
    }
    out.push(renderQuestion(q));
  });
  el.innerHTML=out.join('');
  el.querySelectorAll('.q').forEach(function(card){
    var id=card.dataset.qid,q=QUESTIONS.find(function(x){return x.id===id});
    card.querySelectorAll('[data-opt]').forEach(function(b){
      b.onclick=function(){
        if(!Number.isInteger(q.answer)||state.answers[id]!==undefined)return;
        state.answers[id]=Number(b.dataset.opt);save();renderBuiltQuestions();renderStats();
        setTimeout(function(){var n=document.querySelector('[data-qid="'+id+'"]');if(n)n.scrollIntoView({block:'center',behavior:'smooth'})},20);
      }
    });
    var sb=card.querySelector('[data-save]');
    sb.onclick=function(){state.saved[id]=!state.saved[id];save();renderBuiltQuestions();renderStats()}
  });
}
document.getElementById('buildSet').onclick=function(){
  builtIds=sortedMatches().map(function(q){return q.id});
  renderBuiltQuestions();
  document.getElementById('questions').scrollIntoView({behavior:'smooth',block:'start'});
};
document.getElementById('clearSelector').onclick=function(){
  Object.keys(selected).forEach(function(k){selected[k]=new Set()});
  builtIds=[];query='';document.getElementById('search').value='';
  filter='all';document.querySelectorAll('[data-filter]').forEach(function(x){x.classList.toggle('active',x.dataset.filter==='all')});
  renderSelector();renderBuiltQuestions();
};

function renderPaperProgress(){
  var box=document.getElementById('paperProgress');
  if(!box)return;
  var exp=expectedPaperCount('chemistry',0);
  var loaded=QUESTIONS.filter(function(q){return q.subject==='chemistry'&&(q.paper||0)===0}).length;
  box.innerHTML='<div class="notice"><b style="color:#dbeeff">Chemistry 1st Paper:</b> '+loaded+' / '+exp+' question serials imported from PDF pages 1–154. Chapter totals: 293 + 733 + 736 + 733 + 371 = 2866. OCR-derived records are shown immediately; answers, sources, authors, subtopics and formulas remain explicitly unverified where they could not be read safely.</div>';
}
function renderStats(){
  var attempted=Object.keys(state.answers).filter(function(id){return QUESTIONS.some(function(q){return q.id===id})}).length;
  var correct=QUESTIONS.filter(function(q){return Number.isInteger(q.answer)&&state.answers[q.id]===q.answer}).length;
  var saved=QUESTIONS.filter(function(q){return state.saved[q.id]}).length;
  document.getElementById('stLoaded').textContent=QUESTIONS.length;
  document.getElementById('stAttempted').textContent=attempted;
  document.getElementById('stCorrect').textContent=correct;
  document.getElementById('stSaved').textContent=saved;
}
document.getElementById('search').oninput=function(){query=this.value.trim();renderBuiltQuestions()}
document.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){
  filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(function(x){x.classList.toggle('active',x===b)});renderBuiltQuestions()
}});
document.getElementById('resetProgress').onclick=function(){
  if(confirm('Reset all Onushiloni answers and bookmarks saved in this browser?')){state={answers:{},saved:{}};save();renderBuiltQuestions();renderStats()}
};

renderSelector();renderBuiltQuestions();renderPaperProgress();renderStats();
</script>
</body>
</html>`);
}