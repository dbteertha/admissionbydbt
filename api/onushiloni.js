export default async function handler(req,res){
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
.layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start}
.side{position:sticky;top:78px}
.panel{
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(12,17,27,.96),rgba(8,12,19,.92));
  border-radius:var(--r);box-shadow:var(--shadow)
}
.side-card{padding:15px}
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
        <div class="section-label">Subjects</div>
        <div class="subjects" id="subjects"></div>
        <div class="section-label">Papers</div>
        <div class="papers" id="papers"></div>
        <div class="section-label">Chapters</div>
        <div class="chapter-list" id="chapters"></div>
      </div>
    </aside>

    <main>
      <div class="main-head">
        <div><h2 id="chapterTitle">Question Bank</h2><p id="chapterMeta"></p></div>
        <div class="tools">
          <label class="search"><input id="search" placeholder="Search loaded questions..."></label>
          <button class="filter active" data-filter="all">All</button>
          <button class="filter" data-filter="unanswered">Unanswered</button>
          <button class="filter" data-filter="wrong">Wrong first try</button>
          <button class="filter" data-filter="saved">Saved</button>
        </div>
      </div>
      <div class="notice">The interface is live as a separate section of your existing site. Printed source references will be copied exactly from the QB and shown in bracket form beside each question, followed by its Q. NO.</div>
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

var QUESTIONS=[
{id:'chem-1-3',subject:'chemistry',paper:0,chapter:0,serial:3,pdfPage:4,q:'কেমিস্ট্রি ল্যাবে কখন নিরাপত্তা চশমা ব্যবহার করা আবশ্যক?',options:['দ্রবণ প্রস্তুতিতে','রাসায়নিক বস্তুর ওজন নিতে','রাসায়নিক পদার্থ উত্তপ্ত হলে','যন্ত্রপাতি পরিষ্কার করার সময়'],answer:2,solution:'রাসায়নিক পদার্থ উত্তপ্ত করার সময় ছিটকে পড়া বা বাষ্পের ঝুঁকি থাকে, তাই নিরাপত্তা চশমা ব্যবহার করা আবশ্যক।'},
{id:'chem-1-4',subject:'chemistry',paper:0,chapter:0,serial:4,pdfPage:4,q:'ল্যাবরেটরির নিরাপত্তা সামগ্রী কোনটি?',options:['ফিউম হুড','লাইফ জ্যাকেট','রেইন কোট','O₂ গ্যাস সিলিন্ডার'],answer:0,solution:'ফিউম হুড ল্যাবের ক্ষতিকর বাষ্প বা গ্যাস নিরাপদভাবে অপসারণে ব্যবহৃত নিরাপত্তা সামগ্রী।'},
{id:'chem-1-7',subject:'chemistry',paper:0,chapter:0,serial:7,pdfPage:4,q:'বৈদ্যুতিক শক বা ক্ষত থেকে সুরক্ষার জন্য কোন গ্লাভস উপযোগী?',options:['ল্যাটেক্স','নিওপ্রিন','জিটেক্স','PVC'],answer:0,solution:'উৎসের উত্তরমালা অনুযায়ী সঠিক উত্তর ল্যাটেক্স।'},
{id:'chem-1-8',subject:'chemistry',paper:0,chapter:0,serial:8,pdfPage:4,q:'নিচের অক্সাইডগুলোর মধ্যে কোনটি পাইরেক্স গ্লাস তৈরি করতে পারে?',options:['SiO₂','LiO₂','Al₂O₃','B₂O₃'],answer:3,solution:'পাইরেক্স গ্লাসে B₂O₃ ব্যবহৃত হয়। উৎসের ব্যাখ্যায় SiO₂-এর সঙ্গে B₂O₃ যোগে পাইরেক্সের তাপ ও রাসায়নিক প্রতিরোধী বৈশিষ্ট্য তৈরির কথা বলা হয়েছে।'},
{id:'chem-1-12',subject:'chemistry',paper:0,chapter:0,serial:12,pdfPage:4,q:'ল্যাবে শরীরে আগুন লাগলে কী করতে হবে?',options:['শরীরে CO₂ প্রয়োগ করতে হবে','কম্বল জড়াতে হবে','হাই প্রেসারে বায়ু দিতে হবে','হাই-স্পিডে পানি মারতে হবে'],answer:1,solution:'উৎসের উত্তরমালা অনুযায়ী শরীরে আগুন লাগলে কম্বল জড়ানো সঠিক পদক্ষেপ।'},

{id:'phys-1-4',subject:'physics',paper:0,chapter:0,serial:4,pdfPage:4,q:'তড়িৎ চুম্বকীয় তরঙ্গ তত্ত্ব আবিষ্কার করেন—',options:['রাদারফোর্ড','নিউটন','ম্যাক্সওয়েল','আইনস্টাইন'],answer:2,solution:'জেমস ক্লার্ক ম্যাক্সওয়েল তড়িৎ ও চৌম্বক ক্ষেত্রকে একত্রিত করে তড়িৎচুম্বকীয় তরঙ্গের তত্ত্ব প্রতিষ্ঠা করেন।'},
{id:'phys-1-6',subject:'physics',paper:0,chapter:0,serial:6,pdfPage:4,q:'কোনো বস্তু হতে শক্তির বিকিরণ নিরবচ্ছিন্নভাবে ঘটে না—এই তত্ত্বের প্রবক্তা কে?',options:['লর্ড রাদারফোর্ড','আলবার্ট আইনস্টাইন','ম্যাক্স প্ল্যাঙ্ক','মাইকেল ফ্যারাডে'],answer:2,solution:'ম্যাক্স প্ল্যাঙ্ক শক্তি কোয়ান্টা আকারে নির্গত বা শোষিত হয়—এই ধারণা দেন।'},
{id:'phys-1-10',subject:'physics',paper:0,chapter:0,serial:10,pdfPage:4,q:'“ভর ও শক্তি সমতুল্য”—কোন বিজ্ঞানীর অভিমত?',options:['নিউটন','গ্যালিলিও','আইনস্টাইন','ফ্যারাডে'],answer:2,solution:'আইনস্টাইনের ভর-শক্তি সমতুল্যতার সম্পর্ক E = mc² দ্বারা প্রকাশ করা হয়।'},
{id:'phys-1-12',subject:'physics',paper:0,chapter:0,serial:12,pdfPage:4,q:'কোন বৈজ্ঞানিক সর্বপ্রথম সূর্যকেন্দ্রিক বিশ্বের ধারণা প্রদান করেন?',options:['কেপলার','টলেমি','ডেমোক্রিটাস','কোপার্নিকাস'],answer:3,solution:'নিকোলাস কোপার্নিকাস সূর্যকেন্দ্রিক মডেলকে সুসংগঠিতভাবে উপস্থাপন করেন।'},
{id:'phys-1-14',subject:'physics',paper:0,chapter:0,serial:14,pdfPage:4,q:'পরমাণুর ধারণা সর্বপ্রথম প্রদান করেন—',options:['নিউটন','ডাল্টন','ডেমোক্রিটাস','আর্কিমিডিস'],answer:2,solution:'প্রাচীন গ্রিক দার্শনিক ডেমোক্রিটাস পদার্থের অবিভাজ্য ক্ষুদ্র কণার ধারণা দেন।'},

{id:'bio-1-1',subject:'biology',paper:0,chapter:0,serial:1,pdfPage:4,q:'কোষ আবিষ্কার করেন কে?',options:['লিউয়েন হুক','রবার্ট হুক','রবার্ট ব্রাউন','রবার্ট ডারউইন'],answer:1,solution:'রবার্ট হুক কর্কের পাতলা অংশ পর্যবেক্ষণ করে “cell” শব্দটি ব্যবহার করেন।'},
{id:'bio-1-2',subject:'biology',paper:0,chapter:0,serial:2,pdfPage:4,q:'জীবদেহের জৈবিক কার্যকলাপের একক কী?',options:['অঙ্গ','টিস্যু','জীবকোষ','কোষপর্দা'],answer:2,solution:'কোষ জীবদেহের গঠনগত ও কার্যগত মৌলিক একক।'},
{id:'bio-1-3',subject:'biology',paper:0,chapter:0,serial:3,pdfPage:4,q:'Cell শব্দটি কোন ভাষা থেকে এসেছে?',options:['গ্রিক','ল্যাটিন','সুইডিশ','ইংরেজি'],answer:1,solution:'Cell শব্দটি ল্যাটিন “cella” থেকে এসেছে, যার অর্থ ছোট কক্ষ বা প্রকোষ্ঠ।'},
{id:'bio-1-4',subject:'biology',paper:0,chapter:0,serial:4,pdfPage:4,q:'কোন বিজ্ঞানীগণ কোষতত্ত্ব দেন?',options:['লাইনার ও ক্লিকার','সিয়ার ও নিকলসন','স্লাইডেন ও সোয়ান','ভ্যান লিউয়েন হুক ও লিন'],answer:2,solution:'ম্যাথিয়াস স্লাইডেন ও থিওডর সোয়ান কোষতত্ত্ব প্রণয়নে গুরুত্বপূর্ণ ভূমিকা রাখেন।'},
{id:'bio-1-5',subject:'biology',paper:0,chapter:0,serial:5,pdfPage:4,q:'প্রাণীকোষ বিষয়ে কোনটি সঠিক?',options:['কোষে সেন্ট্রোসোম থাকে','সাইটোপ্লাজমে প্লাস্টিড থাকে','সঞ্চিত খাদ্য সাধারণত শ্বেতসার','কোষ কেন্দ্রে বড় কোষ গহ্বর থাকে'],answer:0,solution:'উৎসের ব্যাখ্যা অনুযায়ী প্রাণীকোষে সাধারণত সেন্ট্রোসোম থাকে। প্লাস্টিড থাকে না; সঞ্চিত খাদ্য প্রধানত গ্লাইকোজেন।'}
];

var KEY='onushiloni_qb_state_v1';
var state={answers:{},saved:{}};
try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
var activeSubject='biology',activePaper=0,activeChapter=0,filter='all',query='';

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function letter(i){return ['ক','খ','গ','ঘ'][i]||String(i+1)}
function activePaperData(){return SUBJECTS[activeSubject].papers[activePaper]}

function renderSubjects(){
  var el=document.getElementById('subjects');
  el.innerHTML=Object.keys(SUBJECTS).map(function(k){
    var s=SUBJECTS[k];
    return '<button class="subject '+(k===activeSubject?'active':'')+'" data-subject="'+k+'"><i>'+s.icon+'</i><b>'+s.name+'</b></button>';
  }).join('');
  el.querySelectorAll('[data-subject]').forEach(function(b){b.onclick=function(){activeSubject=b.dataset.subject;activePaper=0;activeChapter=0;renderAll()}})
}
function renderPapers(){
  var el=document.getElementById('papers'),s=SUBJECTS[activeSubject];
  el.innerHTML=s.papers.map(function(p,i){
    return '<button class="paper-tab '+(i===activePaper?'active':'')+'" data-paper="'+i+'">'+p.short+'</button>';
  }).join('');
  el.querySelectorAll('[data-paper]').forEach(function(b){b.onclick=function(){activePaper=Number(b.dataset.paper);activeChapter=0;renderAll()}})
}
function chapterLoadedCount(subject,paper,idx){return QUESTIONS.filter(function(q){return q.subject===subject&&(q.paper||0)===paper&&q.chapter===idx}).length}
function renderChapters(){
  var p=activePaperData(),el=document.getElementById('chapters');
  el.innerHTML=p.chapters.map(function(name,i){
    var count=chapterLoadedCount(activeSubject,activePaper,i);
    return '<button class="chapter '+(i===activeChapter?'active':'')+'" data-ch="'+i+'"><span class="no">'+(i+1)+'</span><span>'+esc(name)+'<small>'+(count?count+' question'+(count>1?'s':'')+' loaded':'QB data pending')+'</small></span></button>';
  }).join('');
  el.querySelectorAll('[data-ch]').forEach(function(b){b.onclick=function(){activeChapter=Number(b.dataset.ch);renderAll();window.scrollTo({top:330,behavior:'smooth'})}})
}
function currentQuestions(){
  return QUESTIONS.filter(function(q){
    if(q.subject!==activeSubject||(q.paper||0)!==activePaper||q.chapter!==activeChapter)return false;
    var a=state.answers[q.id];
    if(query && q.q.toLowerCase().indexOf(query.toLowerCase())===-1 && q.options.join(' ').toLowerCase().indexOf(query.toLowerCase())===-1)return false;
    if(filter==='unanswered'&&a!==undefined)return false;
    if(filter==='wrong'&&(a===undefined||a===q.answer))return false;
    if(filter==='saved'&&!state.saved[q.id])return false;
    return true;
  });
}
function renderQuestion(q){
  var chosen=state.answers[q.id],answered=chosen!==undefined,saved=!!state.saved[q.id];
  var opts=q.options.map(function(o,i){
    var cls='option';
    if(answered){
      if(i===q.answer)cls+=' correct';
      if(i===chosen&&i!==q.answer)cls+=' wrong';
      if(i===chosen)cls+=' first';
    }
    return '<button class="'+cls+'" data-opt="'+i+'" '+(answered?'disabled':'')+'><span class="letter">'+letter(i)+'</span><span>'+esc(o)+'</span></button>';
  }).join('');
  var meta='';
  if(answered){
    meta='<div class="answer-meta"><span class="pill first">First selected: '+letter(chosen)+'. '+esc(q.options[chosen])+'</span>'+
      '<span class="pill '+(chosen===q.answer?'good':'bad')+'">'+(chosen===q.answer?'✓ Correct on first try':'✕ Wrong on first try')+'</span>'+
      '<span class="pill good">Correct: '+letter(q.answer)+'. '+esc(q.options[q.answer])+'</span></div>'+
      '<div class="solution"><div class="s-title">Answer & solution</div><p>'+esc(q.solution)+'</p></div>';
  }
  var paper=SUBJECTS[q.subject].papers[q.paper||0];
  var printedSource=q.source?esc(q.source):'[Source reference pending exact QB transcription]';
  return '<article class="q" data-qid="'+q.id+'">'+
    '<div class="q-top"><div class="q-id"><div class="serial">'+q.serial+'</div><div class="ref"><b>'+esc(paper.name)+'</b> • Chapter '+(q.chapter+1)+' • PDF p.'+q.pdfPage+'<br>'+
    '<span class="source-ref"><b>'+printedSource+'</b> &nbsp; Q. NO. '+q.serial+'</span></div></div>'+
    '<div class="q-actions"><button class="icon-btn '+(saved?'saved':'')+'" data-save title="Bookmark">'+(saved?'★':'☆')+'</button></div></div>'+
    '<div class="q-text">'+esc(q.q)+'</div><div class="options">'+opts+'</div>'+meta+'</article>';
}
function renderQuestions(){
  var p=activePaperData();
  document.getElementById('chapterTitle').textContent=p.chapters[activeChapter];
  document.getElementById('chapterMeta').textContent=p.name+' • Chapter '+(activeChapter+1)+' • '+chapterLoadedCount(activeSubject,activePaper,activeChapter)+' questions currently loaded';
  var list=currentQuestions(),el=document.getElementById('questions');
  if(!list.length){el.innerHTML='<div class="empty">'+(chapterLoadedCount(activeSubject,activePaper,activeChapter)?'No questions match this filter.':'This chapter is ready in the navigation; its scanned QB questions have not yet been structured into interactive cards.')+'</div>';return}
  el.innerHTML=list.map(renderQuestion).join('');
  el.querySelectorAll('.q').forEach(function(card){
    var id=card.dataset.qid,q=QUESTIONS.find(function(x){return x.id===id});
    card.querySelectorAll('[data-opt]').forEach(function(b){
      b.onclick=function(){
        if(state.answers[id]!==undefined)return;
        state.answers[id]=Number(b.dataset.opt);save();renderQuestions();renderStats();
        setTimeout(function(){var n=document.querySelector('[data-qid="'+id+'"]');if(n)n.scrollIntoView({block:'center',behavior:'smooth'})},20);
      }
    });
    var sb=card.querySelector('[data-save]');
    sb.onclick=function(){state.saved[id]=!state.saved[id];save();renderQuestions();renderStats()}
  });
}
function renderStats(){
  var attempted=Object.keys(state.answers).filter(function(id){return QUESTIONS.some(function(q){return q.id===id})}).length;
  var correct=QUESTIONS.filter(function(q){return state.answers[q.id]===q.answer}).length;
  var saved=QUESTIONS.filter(function(q){return state.saved[q.id]}).length;
  document.getElementById('stLoaded').textContent=QUESTIONS.length;
  document.getElementById('stAttempted').textContent=attempted;
  document.getElementById('stCorrect').textContent=correct;
  document.getElementById('stSaved').textContent=saved;
}
function renderAll(){renderSubjects();renderPapers();renderChapters();renderQuestions();renderStats()}
document.getElementById('search').oninput=function(){query=this.value.trim();renderQuestions()}
document.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){
  filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(function(x){x.classList.toggle('active',x===b)});renderQuestions()
}});
document.getElementById('resetProgress').onclick=function(){
  if(confirm('Reset all Onushiloni answers and bookmarks saved in this browser?')){state={answers:{},saved:{}};save();renderAll()}
};
renderAll();
</script>
</body>
</html>`);
}