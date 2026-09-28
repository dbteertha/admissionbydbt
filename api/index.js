import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const PORT = process.env.PORT || 10000;
const SOURCES = [
  {name:'Chorcha', url:'https://chorcha.net/admission-calendar'},
  {name:'MNR Study', url:'https://study.mnr.bd/calendar'},
  {name:'Admission Calendar', url:'https://admission-calendar.com/'}
];

const CURATED_EVENTS = [
  ['Medical & Dental','2026-12-04T10:00:00+06:00','Only Admission-Calendar visible'],
  ['DU IBA','2026-12-05T10:00:00+06:00','Agree'],
  ['Aviation and Aerospace University Bangladesh (AAUB)','2026-12-05T10:00:00+06:00','Agree'],
  ['Dhaka University A / Science','2026-12-12T11:00:00+06:00','Agree'],
  ['Khulna University D / Business','2026-12-17T10:00:00+06:00','Agree'],
  ['Khulna University C / Humanities','2026-12-17T13:30:00+06:00','Agree'],
  ['Khulna University A / Science','2026-12-18T10:00:00+06:00','Only Admission-Calendar visible'],
  ['Khulna University B / Life Science','2026-12-18T14:30:00+06:00','Agree'],
  ['MIST C Unit','2026-12-18T10:00:00+06:00','Agree'],
  ['MIST A & B','2026-12-19T10:00:00+06:00','Agree'],
  ['Dhaka University B / Arts, Law & Social Science','2026-12-19T11:00:00+06:00','Agree'],
  ['Dhaka University Fine Arts','2026-12-22T11:00:00+06:00','Only Chorcha visible'],
  ['Dhaka University C / Business','2026-12-26T11:00:00+06:00','Agree'],
  ['Jagannath University A / Science','2027-01-01T10:00:00+06:00','Agree'],
  ['BUP FBS','2027-01-01T10:30:00+06:00','Chorcha lists FBS on 9 Jan too'],
  ['Agriculture Cluster','2027-01-02T10:00:00+06:00','Agree'],
  ['BUP FASS','2027-01-02T15:30:00+06:00','Agree'],
  ['Jagannath University E / Fine Arts','2027-01-08T10:00:00+06:00','Agree'],
  ['KUET','2027-01-08T10:00:00+06:00','Only Admission-Calendar visible in table'],
  ['BUP FST','2027-01-08T10:30:00+06:00','Agree'],
  ['BUP FET','2027-01-08T10:30:00+06:00','Agree'],
  ['BUP FMS','2027-01-08T10:30:00+06:00','Agree'],
  ['Rajshahi University B / Business','2027-01-08T11:00:00+06:00','Agree'],
  ['BUP FSSS','2027-01-08T15:30:00+06:00','Agree'],
  ['Rajshahi University C / Science','2027-01-09T11:00:00+06:00','Agree'],
  ['BUP FBS','2027-01-09T10:30:00+06:00','Source inconsistency'],
  ['BUP BBA General','2027-01-09T15:30:00+06:00','Chorcha visible'],
  ['RUET','2027-01-14T09:30:00+06:00','Chorcha visible'],
  ['Jagannath University B / Humanities','2027-01-15T10:00:00+06:00','Agree'],
  ['BUET','2027-01-16T09:00:00+06:00','Agree'],
  ['Rajshahi University A / Humanities','2027-01-16T11:00:00+06:00','Agree'],
  ['Jagannath University C / Business','2027-01-22T10:00:00+06:00','Agree'],
  ['Jagannath University D / Social Science','2027-01-23T10:00:00+06:00','Agree'],
  ['CUET','2027-01-23T10:00:00+06:00','Admission-Calendar visible'],
  ['SUST A','2027-01-26T15:00:00+06:00','Agree'],
  ['SUST B','2027-01-27T15:00:00+06:00','Agree'],
  ['BUTEX','2027-01-29T10:00:00+06:00','Agree'],
  ['Chittagong University C / Business','2027-01-29T11:00:00+06:00','Agree'],
  ['Chittagong University A / Science','2027-01-30T11:00:00+06:00','Agree'],
  ['Chittagong University B1','2027-02-03T11:00:00+06:00','Agree'],
  ['Chittagong University B2','2027-02-04T11:00:00+06:00','Agree'],
  ['Chittagong University B','2027-02-05T11:00:00+06:00','Agree'],
  ['Comilla University A','2027-02-05T11:00:00+06:00','Agree'],
  ['Chittagong University D','2027-02-06T11:00:00+06:00','Agree'],
  ['Comilla University B','2027-02-06T11:00:00+06:00','Agree'],
  ['Comilla University C','2027-02-07T11:00:00+06:00','Agree'],
  ['Chittagong University D1','2027-02-08T11:00:00+06:00','Agree'],
  ['GST B / Humanities','2027-03-19T10:00:00+06:00','Agree'],
  ['GST C / Business','2027-03-20T10:00:00+06:00','Agree'],
  ['GST D / Architecture','2027-03-20T10:00:00+06:00','Agree'],
  ['GST A / Science','2027-03-27T10:00:00+06:00','Agree']
].map(([title,date,agreement])=>({
  title,
  date:new Date(date).toISOString(),
  agreement
}));

let cache = { at: 0, events: [], sources: [] };
const TTL = 30 * 60 * 1000;

function fetchText(url, redirects=0){
  return new Promise((resolve,reject)=>{
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.get(url,{headers:{'user-agent':'Mozilla/5.0 AdmissionDashboard/1.0','accept':'text/html,application/xhtml+xml'}},res=>{
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location && redirects<5){
        const next = new URL(res.headers.location,url).toString();
        res.resume(); return resolve(fetchText(next,redirects+1));
      }
      let data='';
      res.setEncoding('utf8');
      res.on('data',c=>{ if(data.length<5_000_000) data+=c; });
      res.on('end',()=>resolve({ok:res.statusCode>=200&&res.statusCode<300,status:res.statusCode,text:data}));
    });
    req.setTimeout(12000,()=>req.destroy(new Error('timeout')));
    req.on('error',reject);
  });
}
function decode(s){
  return s.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));
}
function htmlToLines(html){
  let s=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<\/(?:div|p|li|tr|td|th|h[1-6]|section|article|br)>/gi,'\n')
    .replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ');
  s=decode(s).replace(/[ \t]+/g,' ').replace(/\r/g,'');
  return s.split('\n').map(x=>x.trim()).filter(Boolean);
}
const bnDigits = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
function latinDigits(s){return s.replace(/[০-৯]/g,d=>bnDigits[d]);}
const months = {
  jan:0,january:0,'জানুয়ারি':0,'জানুয়ারি':0,
  feb:1,february:1,'ফেব্রুয়ারি':1,'ফেব্রুয়ারি':1,
  mar:2,march:2,'মার্চ':2,
  apr:3,april:3,'এপ্রিল':3,
  may:4,'মে':4,
  jun:5,june:5,'জুন':5,
  jul:6,july:6,'জুলাই':6,
  aug:7,august:7,'আগস্ট':7,
  sep:8,september:8,'সেপ্টেম্বর':8,
  oct:9,october:9,'অক্টোবর':9,
  nov:10,november:10,'নভেম্বর':10,
  dec:11,december:11,'ডিসেম্বর':11
};
function parseDate(text){
  const t=latinDigits(text).replace(/,/g,' ');
  let m=t.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if(!m) m=t.match(/(\d{1,2})\s+(জানুয়ারি|জানুয়ারি|ফেব্রুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)\s+(20\d{2})(?:.*?(\d{1,2})[:.]?(\d{2})?\s*(AM|PM|am|pm)?)?/i);
  if(!m) return null;
  let day=+m[1], mon=months[m[2].toLowerCase()] ?? months[m[2]], year=+m[3];
  let hh=m[4]?+m[4]:12, mm=m[5]?+m[5]:0, ap=(m[6]||'').toUpperCase();
  if(ap==='PM'&&hh<12) hh+=12; if(ap==='AM'&&hh===12) hh=0;
  if(mon===undefined) return null;
  const d=new Date(Date.UTC(year,mon,day,hh-6,mm)); // interpret source times as Bangladesh time
  return isNaN(d)?null:d;
}
function cleanTitle(s){
  return s.replace(/\s+/g,' ').replace(/^(university|বিশ্ববিদ্যালয়)\s*/i,'').slice(0,100).trim();
}
function textFromCell(s){
  return decode(s.replace(/<br\s*\/?>(?=.)/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}
function parseTableRows(html,source){
  const out=[];
  for(const m of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>textFromCell(x[1]));
    if(cells.length<2) continue;
    const dateIndex=cells.findIndex(x=>parseDate(x));
    if(dateIndex<0) continue;
    const dt=parseDate(cells[dateIndex]);
    const candidates=cells.slice(0,dateIndex).filter(x=>x.length>=2 && x.length<=140);
    const title=candidates[candidates.length-1];
    if(!title || /বিশ্ববিদ্যালয়|university|তারিখ|date/i.test(title) && title.length<18) continue;
    out.push({title:cleanTitle(title),date:dt.toISOString(),source:source.name,sourceUrl:source.url,raw:cells.join(' | ')});
  }
  return out;
}
function parseHydrationJson(html,source){
  const out=[];
  const scripts=[...html.matchAll(/<script\b[^>]*(?:type=["']application\/json["'])?[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1].trim());
  const walk=(v)=>{
    if(!v) return;
    if(Array.isArray(v)){v.forEach(walk);return;}
    if(typeof v!=='object') return;
    const title=v.title||v.name||v.university||v.universityName||v.examName||v.shortName;
    const rawDate=v.examDate||v.exam_date||v.date||v.dateTime||v.datetime||v.startDate||v.start_date;
    if(typeof title==='string' && rawDate){
      const dt=parseDate(String(rawDate)) || new Date(rawDate);
      if(dt && !isNaN(dt) && dt.getUTCFullYear()>=2026 && dt.getUTCFullYear()<=2028){
        out.push({title:cleanTitle(title),date:dt.toISOString(),source:source.name,sourceUrl:source.url,raw:String(rawDate)});
      }
    }
    Object.values(v).forEach(walk);
  };
  for(const s of scripts){
    if(!s || (s[0]!=='{' && s[0]!=='[')) continue;
    try{walk(JSON.parse(s));}catch{}
  }
  return out;
}
function parseLinePairs(html,source){
  const lines=htmlToLines(html); const out=[];
  for(let i=0;i<lines.length;i++){
    const dt=parseDate(lines[i]); if(!dt) continue;
    let title='';
    for(let j=i-1;j>=Math.max(0,i-8);j--){
      const x=cleanTitle(lines[j]);
      if(x.length<2||x.length>120) continue;
      if(/^(date|time|তারিখ|সময়|সময় বাকি|question|available after exam|sort by|তথ্য|সার্কুলার|নোটিশ)$/i.test(x)) continue;
      if(parseDate(x)) continue;
      title=x; break;
    }
    if(title && !/admission calendar|এডমিশন ক্যালেন্ডার/i.test(title)){
      out.push({title,date:dt.toISOString(),source:source.name,sourceUrl:source.url,raw:lines[i].slice(0,200)});
    }
  }
  return out;
}
function parseEvents(html,source){
  return dedupe([...parseTableRows(html,source),...parseHydrationJson(html,source),...parseLinePairs(html,source)]);
}
function dedupe(events){
  const seen=new Map();
  for(const e of events){
    const day=e.date.slice(0,10);
    const key=(e.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g,' ').trim().slice(0,45)+'|'+day);
    if(!seen.has(key)) seen.set(key,e);
    else {
      const cur=seen.get(key);
      cur.source += cur.source.includes(e.source)?'':' + '+e.source;
    }
  }
  return [...seen.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
async function sync(force=false){
  if(!force && Date.now()-cache.at<TTL && cache.events.length) return cache;
  const results=await Promise.all(SOURCES.map(async s=>{
    try{
      const r=await fetchText(s.url);
      const events=r.ok?parseEvents(r.text,s):[];
      return {name:s.name,url:s.url,ok:r.ok,status:r.status,count:events.length,events,mode:events.length?'live':'no-events'};
    }catch(err){
      return {name:s.name,url:s.url,ok:false,status:0,count:0,error:String(err.message||err),events:[],mode:'unreachable'};
    }
  }));
  let events=dedupe([...CURATED_EVENTS,...results.flatMap(r=>r.events)]);
  cache={at:Date.now(),events,sources:results.map(({events,...x})=>x)};
  return cache;
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admission by DBT | ভর্তি তথ্যকেন্দ্র ২০২৬–২৭</title>
<style>
:root{--bg:#030303;--panel:#0a0b0d;--line:#25282e;--text:#f4f4f2;--muted:#979b9f;--soft:#d9d7cd;--chip:#14161a}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}body{min-height:100vh;overflow-x:hidden}
#stars{position:fixed;inset:0;z-index:0;pointer-events:none}.app{position:relative;z-index:1;max-width:1180px;margin:auto;padding:28px 18px 64px}
nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.brand{font-weight:900;letter-spacing:.18em;font-size:13px}.live{font-size:12px;color:#b6babf;border:1px solid var(--line);padding:8px 11px;border-radius:999px;background:#090a0c}
.hero{min-height:560px;display:grid;place-items:center;text-align:center}.hero-inner{width:min(780px,100%)}
.kicker{font-size:12px;letter-spacing:.18em;color:#aeb2b7;text-transform:uppercase}.days{font-size:clamp(96px,19vw,188px);font-weight:900;line-height:.84;letter-spacing:-.08em;margin:18px 0 10px;text-shadow:0 0 30px #ffffff18}
.label{font-weight:800;font-size:14px;letter-spacing:.12em}.clock{display:flex;justify-content:center;gap:clamp(14px,4vw,38px);margin:18px 0 22px}.clock b{font-size:clamp(25px,5vw,46px);letter-spacing:.02em}.clock span{display:block;color:#8e9297;font-size:10px;margin-top:3px}
.progress{height:22px;border:1px solid #343941;border-radius:999px;overflow:hidden;background:#080a0d;box-shadow:inset 0 0 18px #000}.fill{height:100%;width:0;background:linear-gradient(90deg,#c9c7bd,#eeeDE7);border-radius:inherit;transition:width .8s}.pct{margin-top:9px;font-size:12px;color:#aeb2b7}.passed{font-size:22px;font-weight:800;margin-top:22px}.passed i{font-style:normal;color:#73777c;margin:0 14px}
.section{background:#08090bde;border:1px solid #1e2126;border-radius:24px;padding:22px;backdrop-filter:blur(14px);box-shadow:0 28px 90px #0009}.head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:18px}.head h2{font-size:30px;margin:0}.sub{color:#8e9297;font-size:13px;margin-top:5px}
.controls{display:flex;gap:8px;flex-wrap:wrap}.btn,input,select{background:#101216;color:#e7e8e9;border:1px solid #2b2f36;border-radius:12px;padding:10px 12px;font:inherit}.btn{cursor:pointer}.btn:hover{background:#171a20}
.calendar-head{display:flex;align-items:center;justify-content:space-between;margin:14px 0}.month{font-size:19px;font-weight:800}.week,.grid{display:grid;grid-template-columns:repeat(7,1fr)}.week div{color:#777c83;font-size:11px;padding:8px;text-align:center}
.day{min-height:112px;border-top:1px solid #1b1e23;border-left:1px solid #15181c;padding:8px;position:relative}.day:nth-child(7n+1){border-left:0}.day.muted{opacity:.25}.num{font-size:12px;color:#b8bbc0}.today .num{background:#eee;color:#090909;border-radius:999px;padding:3px 7px;display:inline-block;font-weight:900}.event{display:block;margin-top:6px;background:#15181d;border:1px solid #292d34;border-radius:9px;padding:6px 7px;font-size:10px;line-height:1.25;white-space:normal;overflow:hidden;cursor:default}.event:hover{background:#20242b}
.upcoming{margin-top:28px}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}.card{border:1px solid #23262c;background:#0d0f12;border-radius:15px;padding:14px}.card h3{font-size:14px;margin:0 0 8px}.meta{font-size:12px;color:#969aa0;line-height:1.6}.source{font-size:10px;color:#c5c8cc;margin-top:8px}.source a{color:#c5c8cc}
.empty{color:#8a8f95;padding:30px;text-align:center;border:1px dashed #2a2e34;border-radius:14px}.footer{color:#6d7279;font-size:11px;text-align:center;margin-top:22px}

.info-center{margin-top:26px;background:#08090bde;border:1px solid #1e2126;border-radius:24px;padding:22px;backdrop-filter:blur(14px)}
.info-search{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 18px}.info-search input{flex:1;min-width:240px}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.info-card{background:#0d0f12;border:1px solid #23262c;border-radius:16px;padding:15px}
.info-card h3{font-size:13px;margin:0 0 9px;color:#f4f4f2}.info-card p,.info-card li{font-size:12px;color:#aeb2b7;line-height:1.58}.info-card li+li{margin-top:5px}
.info-card ul{margin:0;padding-left:18px}.booklet-wrap{margin-top:18px}.booklet-title{font-size:21px;font-weight:900;margin:0 0 4px}.booklet-sub{font-size:12px;color:#9ca1a7;margin-bottom:12px}.booklet-row{border:1px solid #292d34;background:#0b0d10;border-radius:16px;padding:15px;margin-top:10px}.booklet-row h4{margin:0 0 10px;font-size:15px}.booklet-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px}.booklet-field{background:#101216;border-radius:11px;padding:10px}.booklet-field b{display:block;font-size:11px;margin-bottom:5px;color:#f2f2ef}.booklet-field span{font-size:11px;line-height:1.5;color:#aeb2b7}.info-card a{color:#f0f0ed;text-decoration:underline;text-underline-offset:3px}
.info-title{font-size:28px;margin:0}.info-name{font-size:20px;font-weight:800;margin:8px 0 2px}.info-status{font-size:11px;color:#9ca1a7}
.eligibility-box{display:grid;grid-template-columns:1.4fr 1fr 1fr auto;gap:8px;margin-top:10px}.eligibility-box input{width:100%;min-width:0}
.eligibility-result{margin-top:10px;font-size:12px;color:#cdd0d4}
.source-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.source-badge{font-size:10px;border:1px solid #2a2e34;border-radius:999px;padding:5px 8px;color:#aeb2b7}
@media(max-width:700px){.info-center{padding:14px}.eligibility-box{grid-template-columns:1fr}.info-title{font-size:23px}}
@media(max-width:700px){.hero{min-height:500px}.section{padding:14px}.day{min-height:78px;padding:5px}.event{font-size:8px;padding:4px}.head h2{font-size:24px}.clock{gap:14px}.passed{font-size:17px}}
</style></head><body><canvas id="stars"></canvas><div class="app"><nav><div class="brand">ADMISSION BY DBT • 26/27</div><div id="syncStatus" class="live">● syncing sources…</div></nav>
<section class="hero"><div class="hero-inner"><div class="kicker">Admission test begins • 30 November 2026</div><div class="days" id="days">00</div><div class="label">DAYS LEFT</div>
<div class="clock"><div><b id="weeks">00W</b><span>WEEKS</span></div><div><b id="hours">00H</b><span>HOURS</span></div><div><b id="mins">00M</b><span>MINUTES</span></div><div><b id="secs">00S</b><span>SECONDS</span></div></div>
<div class="progress"><div class="fill" id="fill"></div></div><div class="pct" id="pct">0%</div><div class="passed"><span id="passed">0 Passed</span><i>|</i><span id="total">0 Total</span></div></div></section>
<section class="section"><div class="head"><div><h2>Admission Calendar</h2><div class="sub">বিশ্ববিদ্যালয় ভর্তি রুটিন — পরিষ্কার নাম, তারিখ ও পরীক্ষার সময়।</div></div><div class="controls"><input id="search" placeholder="Search university…"><button class="btn" id="refresh">Refresh</button></div></div>
<div class="calendar-head"><button class="btn" id="prev">←</button><div class="month" id="month"></div><button class="btn" id="next">→</button></div><div class="week"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div><div class="grid" id="grid"></div>
<div class="upcoming"><div class="head"><div><h2 style="font-size:22px">Upcoming exams</h2><div class="sub">Tap any calendar item or source link to verify details.</div></div></div><div class="cards" id="cards"></div></div>
<div class="footer">Schedules are aggregated from third-party sources and may change. Always verify critical dates from the official university notice.</div></section>
<section class="info-center" id="infoCenter">
  <div class="head"><div><h2 class="info-title">বিশ্ববিদ্যালয় ভর্তি তথ্যকেন্দ্র</h2><div class="sub">বিশ্ববিদ্যালয়ের নাম লিখে বর্তমান ২০২৬–২৭ তথ্য + গত বছরের অফিসিয়াল সার্কুলার + আপনার দেওয়া ‘তথ্য কণিকা’র পূর্ণ আসন, যোগ্যতা, পরীক্ষার ধরন, নম্বরবণ্টন ও মেধা নির্ণয় তথ্য দেখুন।</div></div></div>
  <div class="info-search">
    <input id="uniSearch" list="uniList" placeholder="বিশ্ববিদ্যালয়ের নাম লিখুন — যেমন DU, BUET, RUET, BUP…">
    <datalist id="uniList"></datalist>
    <button class="btn" id="uniFind">তথ্য দেখুন</button>
  </div>
  <div id="uniResult"><div class="empty">বিশ্ববিদ্যালয়ের নাম লিখে বিস্তারিত ভর্তি তথ্য দেখুন।</div></div>
</section></div>
<script>
const TARGET=new Date('2026-11-30T00:00:00+06:00'), START=new Date('2026-09-05T00:00:00+06:00');
function countdown(){const now=new Date(), diff=Math.max(0,TARGET-now), span=(TARGET-START), total=Math.round(span/86400000)+1, passed=Math.max(0,Math.min(total,Math.floor((now-START)/86400000))); const days=Math.floor(diff/86400000), weeks=Math.floor(days/7), h=Math.floor(diff/3600000)%24,m=Math.floor(diff/60000)%60,s=Math.floor(diff/1000)%60; daysEl.textContent=days; weeksEl.textContent=String(weeks).padStart(2,'0')+'W'; hoursEl.textContent=String(h).padStart(2,'0')+'H'; minsEl.textContent=String(m).padStart(2,'0')+'M'; secsEl.textContent=String(s).padStart(2,'0')+'S'; const p=span>0?Math.max(0,Math.min(100,((now-START)/span)*100)):0; fill.style.width=p+'%'; pct.textContent=p.toFixed(2)+'%'; passedEl.textContent=passed+' Passed'; totalEl.textContent=total+' Total';}
const daysEl=document.getElementById('days'),weeksEl=document.getElementById('weeks'),hoursEl=document.getElementById('hours'),minsEl=document.getElementById('mins'),secsEl=document.getElementById('secs'),fill=document.getElementById('fill'),pct=document.getElementById('pct'),passedEl=document.getElementById('passed'),totalEl=document.getElementById('total'); countdown();setInterval(countdown,1000);
let all=[],view=new Date(2026,11,1),sourceHealth=[];
function bdDate(iso){return new Date(new Date(iso).toLocaleString('en-US',{timeZone:'Asia/Dhaka'}))}
function filtered(){const q=search.value.toLowerCase();return all.filter(e=>!q||e.title.toLowerCase().includes(q))}
function render(){month.textContent=view.toLocaleString('en-US',{month:'long',year:'numeric'});grid.innerHTML='';const y=view.getFullYear(),mo=view.getMonth(),first=new Date(y,mo,1),start=new Date(y,mo,1-first.getDay());const es=filtered();for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const cell=document.createElement('div');cell.className='day'+(d.getMonth()!=mo?' muted':'');const now=new Date();if(d.toDateString()==now.toDateString())cell.classList.add('today');cell.innerHTML='<span class="num">'+d.getDate()+'</span>';es.filter(e=>{const x=bdDate(e.date);return x.getFullYear()==d.getFullYear()&&x.getMonth()==d.getMonth()&&x.getDate()==d.getDate()}).slice(0,4).forEach(e=>{const el=document.createElement('div');el.className='event';el.textContent=e.title;el.title=e.title+(e.agreement?' — '+e.agreement:'');cell.appendChild(el)});grid.appendChild(cell)}renderCards();}
function renderCards(){const now=new Date();const arr=filtered().filter(e=>new Date(e.date)>now).slice(0,12);cards.innerHTML=arr.length?'':'<div class="empty">No upcoming events matched the current filter.</div>';arr.forEach(e=>{const d=new Date(e.date);const c=document.createElement('div');c.className='card';c.innerHTML='<h3>'+esc(e.title)+'</h3><div class="meta">'+d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium'})+' • '+esc(e.displayTime||d.toLocaleTimeString('en-BD',{timeZone:'Asia/Dhaka',hour:'numeric',minute:'2-digit'}))+'<br>'+Math.max(0,Math.ceil((d-now)/86400000))+' days left</div>'+(e.agreement?'<div class="source">'+(e.agreement==='Agree'?'✅ ':'⚪ ')+esc(e.agreement)+'</div>':'');cards.appendChild(c)})}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
async function load(force=false){syncStatus.textContent='● syncing sources…';try{const r=await fetch('/api/events'+(force?'?refresh=1':''));const j=await r.json();all=j.events||[];sourceHealth=j.sources||[];syncStatus.textContent='● '+all.length+' exams • updated '+new Date(j.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});render()}catch(e){syncStatus.textContent='● sync unavailable';render()}}
prev.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};next.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};refresh.onclick=()=>load(true);search.oninput=render;load();

const UNIVERSITY_INFO = {
  "ঢাকা বিশ্ববিদ্যালয়": {
    aliases:["DU","Dhaka University","University of Dhaka","ঢাবি"],
    current:[
      "২০২৬–২৭ আবেদন: ১১ নভেম্বর ২০২৬ দুপুর ১২টা থেকে ২৫ নভেম্বর ২০২৬ রাত ১১:৫৯ পর্যন্ত।",
      "পরীক্ষা: IBA — ৫ ডিসেম্বর; বিজ্ঞান — ১২ ডিসেম্বর; কলা, আইন ও সামাজিক বিজ্ঞান — ১৯ ডিসেম্বর; চারুকলা — ২২ ডিসেম্বর; ব্যবসায় শিক্ষা — ২৬ ডিসেম্বর ২০২৬।",
      "IBA ছাড়া অন্য ইউনিটগুলোর পরীক্ষা সকাল ১১টা–১২:৩০; IBA সকাল ১০টা–১২টা।",
      "IBA ছাড়া প্রধান ৩ ইউনিটের পরীক্ষা ঢাকাসহ ৮টি বিভাগীয় শহরে অনুষ্ঠিত হবে।"
    ],
    previous:[
      "২০২৫–২৬ আবেদন: ২৯ অক্টোবর ২০২৫ দুপুর ১২টা থেকে ১৬ নভেম্বর ২০২৫ রাত ১১:৫৯ পর্যন্ত।",
      "প্রবেশপত্র ডাউনলোড শুরু হয়েছিল ২৪ নভেম্বর ২০২৫।",
      "২০২৫–২৬ পরীক্ষার ঘোষিত সময়সূচি: IBA ২৮ নভেম্বর, চারুকলা ২৯ নভেম্বর, ব্যবসায় শিক্ষা ৬ ডিসেম্বর, কলা/আইন/সামাজিক বিজ্ঞান ১৩ ডিসেম্বর; বিজ্ঞান ইউনিটের পরীক্ষা পরে ২৭ ডিসেম্বর ২০২৫ বিকাল ৩:৩০–৫:০০-এ অনুষ্ঠিত হয়।",
      "কলা, আইন ও সামাজিক বিজ্ঞান ইউনিটে ২,৯৩৪টি আসনের বিপরীতে ১,০৭,৭০১ জন পরীক্ষার্থী ছিল।",
      "চারুকলায় ১৩০টি আসন এবং IBA-তে ১২০টি আসন ছিল।"
    ],
    eligibility:[
      "২০২৬–২৭ বিজ্ঞান ইউনিটে বিজ্ঞান বিভাগের জন্য SSC+HSC মোট GPA কমপক্ষে ৮.০০ এবং উভয় পরীক্ষায় কমপক্ষে ৩.৫০।",
      "বিজ্ঞান ইউনিটে মানবিক/ব্যবসায় শিক্ষা থেকে মোট কমপক্ষে ৭.৫০ এবং পৃথকভাবে ৩.০০।",
      "কলা, আইন ও সামাজিক বিজ্ঞান ইউনিটে মানবিক/ব্যবসায় শিক্ষার জন্য মোট ৭.৫০ ও পৃথকভাবে ৩.০০; বিজ্ঞান বিভাগের জন্য মোট ৮.০০ ও পৃথকভাবে ৩.৫০।",
      "চারুকলা ইউনিটে মোট GPA কমপক্ষে ৬.৫০ এবং পৃথকভাবে ৩.০০।"
    ],
    format:[
      "প্রধান ইউনিটে মোট ৯০ মিনিট: ৪৫ মিনিট MCQ + ৪৫ মিনিট লিখিত।",
      "ভর্তি পরীক্ষা ১০০ নম্বর + SSC/HSC ফল ২০ নম্বর = মোট ১২০ নম্বর মূল্যায়ন।",
      "চারুকলায় সাধারণ জ্ঞান ও অঙ্কন থাকে; IBA-এর প্রক্রিয়া আলাদা।"
    ],
    seats:"বর্তমান ২০২৬–২৭ পূর্ণ বিভাগভিত্তিক আসন তালিকা প্রকাশ হলে অফিসিয়াল পোর্টালকে অগ্রাধিকার দিতে হবে।",
    fee:"২০২৬–২৭ সাধারণ আবেদন ফি বর্তমান যাচাইকৃত উৎসে এখনও নিশ্চিত নয়।",
    documents:["SSC/HSC তথ্য","ছবি ও স্বাক্ষর","প্রযোজ্য কোটার কাগজপত্র","প্রবেশপত্র"],
    links:[["অফিসিয়াল ভর্তি পোর্টাল","https://admission.eis.du.ac.bd/"],["২০২৬–২৭ অফিসিয়াল ঘোষণা","https://du.edu.bd/public/du_post_details/post/28137"]]
  },

  "BUET": {
    aliases:["বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়","Bangladesh University of Engineering and Technology","বুয়েট"],
    current:["২০২৬–২৭ ভর্তি পরীক্ষা: ১৬ জানুয়ারি ২০২৭।","বর্তমান বিস্তারিত সার্কুলার প্রকাশ হলে BUET-এর অফিসিয়াল ভর্তি পোর্টালের তথ্যই চূড়ান্ত হবে।"],
    previous:[
      "২০২৫–২৬ অনলাইন আবেদন শুরু ১৬ নভেম্বর ২০২৫; শেষ ২ ডিসেম্বর ২০২৫; ফি জমার শেষ সময় ৪ ডিসেম্বর।",
      "ভর্তি পরীক্ষা অনুষ্ঠিত হয়েছিল ১০ জানুয়ারি ২০২৬, মডিউল A ও B-তে সকাল/বিকাল শিফটে।",
      "২০২৫–২৬-এ প্রাথমিক বাছাই পরীক্ষা ছিল না; মূলত লিখিত পরীক্ষার মাধ্যমে নির্বাচন, পরে মৌখিক পরীক্ষা ছিল।",
      "আবেদন ফি: প্রকৌশল/URP ক্যাটাগরিতে ১,৩০০ টাকা; স্থাপত্যসহ ক্যাটাগরিতে ১,৫০০ টাকা।",
      "নির্বাচিত ও অপেক্ষমাণ প্রার্থীর সম্ভাব্য মেধাতালিকা প্রকাশের তারিখ ছিল ৭ ফেব্রুয়ারি ২০২৬।"
    ],
    eligibility:["২০২৬–২৭ সুনির্দিষ্ট GPA/বিষয়ভিত্তিক যোগ্যতা বর্তমান অফিসিয়াল সার্কুলার প্রকাশ না হওয়া পর্যন্ত গত বছরের নিয়মকে চূড়ান্ত ধরা যাবে না।"],
    format:["২০২৫–২৬-এ লিখিত পরীক্ষা; Architecture-এর জন্য অতিরিক্ত অঙ্কন/দৃষ্টিগত-স্থানিক দক্ষতার অংশ ছিল।"],
    seats:"বর্তমান বিভাগভিত্তিক আসন অফিসিয়াল ২০২৬–২৭ প্রসপেক্টাস থেকে নিতে হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ; ২০২৫–২৬ রেফারেন্স ১,৩০০/১,৫০০ টাকা।",
    documents:["SSC/HSC তথ্য ও সনদ","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান/কোটা কাগজ"],
    links:[["BUET আন্ডারগ্র্যাজুয়েট ভর্তি পোর্টাল","https://ugadmission.buet.ac.bd/"]]
  },

  "RUET": {
    aliases:["Rajshahi University of Engineering and Technology","রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","রুয়েট"],
    current:["২০২৬–২৭ ভর্তি পরীক্ষা: ১৪ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ আবেদন: ২ ডিসেম্বর ২০২৫ সকাল ১০টা থেকে ১৩ ডিসেম্বর বিকাল ৫টা।",
      "আবেদন ফি জমার শেষ সময় ছিল ১৫ ডিসেম্বর ২০২৫ দুপুর ১২টা।",
      "যোগ্য প্রার্থীর তালিকা ৩ জানুয়ারি ২০২৬; আসনবিন্যাস ৬ জানুয়ারি; প্রবেশপত্র ১০ জানুয়ারি বিকাল ৫টা থেকে।",
      "ভর্তি পরীক্ষা ছিল ২২ জানুয়ারি ২০২৬; ফল প্রকাশের লক্ষ্য ৬ ফেব্রুয়ারি।",
      "KA গ্রুপ: ৪০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট — উচ্চতর গণিত ১২০, পদার্থ ১২০, রসায়ন ১২০, ইংরেজি ৪০।",
      "KHA/Architecture: অতিরিক্ত ২০০ নম্বর — Free-hand Drawing ১০০ + Visual-Spatial Intelligence ১০০; সময় ১ ঘণ্টা।"
    ],
    eligibility:["২০২৬–২৭ যোগ্যতা নতুন প্রসপেক্টাস অনুযায়ী নিতে হবে; আগের বছরের পূর্ণ যোগ্যতা অফিসিয়াল RUET প্রসপেক্টাসে আছে।"],
    format:["KA: ৪০০ নম্বর; Architecture-এ অতিরিক্ত ২০০ নম্বর।"],
    seats:"বর্তমান বিভাগভিত্তিক আসন ২০২৬–২৭ প্রসপেক্টাস থেকে নেওয়া হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC সনদ ও গ্রেডশিট","ছবি/স্বাক্ষর","কোটা সনদ","প্রবেশপত্র"],
    links:[["RUET ভর্তি পোর্টাল","https://admission.ruet.ac.bd/"],["২০২৫–২৬ ইংরেজি প্রসপেক্টাস","https://admission.ruet.ac.bd/notices/prospectus/en-prospectus-2025-26.pdf"]]
  },

  "KUET": {
    aliases:["Khulna University of Engineering and Technology","খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","কুয়েট"],
    current:["২০২৬–২৭ পরীক্ষা: ৮ জানুয়ারি ২০২৭।","বর্তমান অফিসিয়াল পোর্টালে কেন্দ্র হিসেবে KUET, ঢাকা বিশ্ববিদ্যালয় ও RUET দেখানো হয়েছে।"],
    previous:[
      "২০২৫–২৬ আবেদন শুরু ৩ ডিসেম্বর ২০২৫ সকাল ১০টা; শেষ ১৩ ডিসেম্বর রাত ১১:৫৯।",
      "প্রথম ধাপের ফি ১৪ ডিসেম্বর বিকাল ৫টার মধ্যে; যোগ্য তালিকা ২০ ডিসেম্বর; দ্বিতীয় ধাপের ফি ৩০ ডিসেম্বরের মধ্যে।",
      "প্রবেশপত্র ডাউনলোড শুরু ৫ জানুয়ারি ২০২৬।",
      "ভর্তি পরীক্ষা ১৫ জানুয়ারি ২০২৬ সকাল ৯:৩০–১২:৩০; Architecture অঙ্কন ১২:৪৫–১:৪৫।",
      "মোট ১,০৬৫ আসন; এর মধ্যে ৫টি সংরক্ষিত আসন।",
      "উদাহরণ: CE ১২০, URP ৬০, Architecture ৪০, EEE ১২০, CSE ১২০, ECE ৬০, BME ৩০, ME ১২০।",
      "লিখিত পরীক্ষা মোট ৫০০: গণিত ১৫০, পদার্থ ১৫০, রসায়ন ১৫০, ইংরেজি ৫০। Architecture-এ অতিরিক্ত ১০০ নম্বর মুক্তহস্ত অঙ্কন।",
      "SSC ন্যূনতম GPA ৪.০০; HSC-তে গণিত, পদার্থ, রসায়নে পৃথক GPA ৪.০০; চারটি নির্ধারিত বিষয়ের মোট গ্রেড পয়েন্ট কমপক্ষে ১৮.০০।",
      "সর্বোচ্চ প্রায় ১২,০০০ প্রার্থীকে HSC গণিত+পদার্থ+রসায়ন+ইংরেজির গ্রেড পয়েন্টের ভিত্তিতে পরীক্ষায় সুযোগ দেওয়া হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ চূড়ান্ত যোগ্যতা নতুন সার্কুলার অনুযায়ী; ২০২৫–২৬ রেফারেন্সে SSC GPA ৪.০০ এবং HSC Math/Physics/Chemistry-তে পৃথক GPA ৪.০০ ছিল।"],
    format:["গত বছর লিখিত ৫০০ নম্বর; Architecture-এ অতিরিক্ত ১০০ নম্বর অঙ্কন।"],
    seats:"গত বছর মোট ১,০৬৫; বর্তমান সংখ্যা নতুন সার্কুলারে যাচাই করতে হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC মূল রেজিস্ট্রেশন/সনদ","রঙিন প্রবেশপত্র","ছবি/স্বাক্ষর","প্রযোজ্য কোটা কাগজ"],
    links:[["KUET ভর্তি পোর্টাল","https://admission.kuet.ac.bd/"],["২০২৫–২৬ অফিসিয়াল প্রসপেক্টাস","https://admission.kuet.ac.bd/adm/fNotice/2025-2026%20Prospectus-Ban.pdf"]]
  },

  "CUET": {
    aliases:["Chittagong University of Engineering and Technology","চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়","চুয়েট"],
    current:["২০২৬–২৭ পরীক্ষা: ২৩ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ আবেদন: ১৫ ডিসেম্বর ২০২৫ সকাল ৯টা থেকে ৩১ ডিসেম্বর রাত ১১:৫৯।",
      "আবেদন ফি জমার শেষ সময় ১ জানুয়ারি ২০২৬ রাত ১১:৫৯।",
      "যোগ্য তালিকা প্রকাশ ৬ জানুয়ারি; প্রবেশপত্র ডাউনলোড শুরু ১২ জানুয়ারি সকাল ১০টা।",
      "ভর্তি পরীক্ষা ১৭ জানুয়ারি ২০২৬।",
      "বাংলাদেশি শিক্ষার্থীদের জন্য HSC Math+Physics+Chemistry মোট গ্রেড পয়েন্ট কমপক্ষে ১৪.০০ এবং English-এ ৩.০০; Biomedical Engineering-এর জন্য Biology-তে ৪.০০ লাগত।"
    ],
    eligibility:["২০২৬–২৭ নতুন সার্কুলার চূড়ান্ত; ২০২৫–২৬ রেফারেন্সে Math+Physics+Chemistry মোট ১৪.০০ এবং English ৩.০০ ছিল।"],
    format:["বর্তমান পরীক্ষার পূর্ণ নম্বরবণ্টন নতুন সার্কুলারে যাচাই করতে হবে।"],
    seats:"বর্তমান আসন তালিকা নতুন সার্কুলার থেকে নেওয়া হবে।",
    fee:"বর্তমান ফি অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা/সমমান কাগজ"],
    links:[["CUET অফিসিয়াল ভর্তি পোর্টাল","https://admissioncuet.ac.bd/"],["CUET ভর্তি তথ্য","https://cuet.ac.bd/admission"]]
  },

  "MIST": {
    aliases:["Military Institute of Science and Technology","মিস্ট"],
    current:["২০২৬–২৭ ক্যালেন্ডার অনুযায়ী C Unit — ১৮ ডিসেম্বর ২০২৬; A & B — ১৯ ডিসেম্বর ২০২৬।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল পোর্টালে আবেদন শেষ সময় ছিল ১৯ জানুয়ারি ২০২৬।",
      "Unit A: মোট ২০০ নম্বর, ৩ ঘণ্টা — গণিত ৮০, পদার্থ ৬০, রসায়ন ৪০, ইংরেজি ২০।",
      "Unit B: Freehand Drawing & Visual-Spatial Intelligence — ২০০ নম্বর, ২ ঘণ্টা।",
      "Unit A ও B-তে পৃথকভাবে ন্যূনতম ৪০% প্রয়োজন ছিল।",
      "Unit C: ৮০ নম্বর MCQ, ৬০ মিনিট — গণিত ২৫, রসায়ন ২৫, পদার্থ ২০, ইংরেজি ১০; পাস নম্বর ৩২।",
      "ফি: Engineering ১,২০০ টাকা; Engineering+Architecture ১,৪০০ টাকা; Unit C ১,০০০ টাকা।",
      "Unit C-এর মৌলিক GPA শর্ত ছিল SSC ও HSC-তে পৃথকভাবে কমপক্ষে ৩.৫০।"
    ],
    eligibility:["প্রোগ্রামভেদে আলাদা; Biomedical Engineering-এ Biology-এর অতিরিক্ত শর্ত থাকে।"],
    format:["A: ২০০ নম্বর/৩ ঘণ্টা; B: ২০০ নম্বর/২ ঘণ্টা; C: ৮০ নম্বর MCQ/৬০ মিনিট — গত বছরের অফিসিয়াল রেফারেন্স।"],
    seats:"বর্তমান প্রোগ্রামভিত্তিক আসন নতুন সার্কুলার অনুযায়ী।",
    fee:"বর্তমান ২০২৬–২৭ ফি নতুন নোটিশে যাচাই করতে হবে।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","GCE হলে transcript/certificate"],
    links:[["MIST ভর্তি পোর্টাল","https://admission.mist.ac.bd/"],["MIST Undergraduate Information","https://research.mist.ac.bd/study-with-us/undergraduate"]]
  },

  "BUP": {
    aliases:["Bangladesh University of Professionals","বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস"],
    current:["BUP ১ সেপ্টেম্বর ২০২৬ তারিখে ২০২৬–২৭ সেশনের অফিসিয়াল Admission Notice প্রকাশ করেছে।","ক্যালেন্ডারে FASS, FST, FET, FMS, FSSS, FBS ও BBA General-এর আলাদা পরীক্ষার তারিখ আছে।"],
    previous:[
      "পূর্ববর্তী আন্ডারগ্র্যাজুয়েট রেফারেন্সে আবেদন প্রসেসিং ফি ছিল প্রতি faculty-তে ১,১০০ টাকা।",
      "ভর্তি পরীক্ষা ছিল MCQ ভিত্তিক; প্রতিটি ভুল উত্তরে ০.৫০ নম্বর কাটা হতো।",
      "English-এ ন্যূনতম ৪০% পাওয়ার শর্ত ছিল।",
      "MBA ছাড়া আন্ডারগ্র্যাজুয়েট রেফারেন্সে মূল্যায়ন: ভর্তি পরীক্ষা ৫৫%, HSC ২৫%, SSC ২০%।",
      "FST ছাড়া সাধারণভাবে calculator অনুমোদিত ছিল না; FST-তে admit card-এ অনুমোদিত model উল্লেখ থাকত।"
    ],
    eligibility:["Faculty/Program ভেদে GPA ও subject requirement আলাদা; ২০২৬–২৭ অফিসিয়াল notice-ই চূড়ান্ত।"],
    format:["MCQ; negative marking ও faculty-specific details বর্তমান notice থেকে যাচাই করতে হবে।"],
    seats:"Faculty/Program ভেদে আসন ২০২৬–২৭ notice থেকে নিতে হবে।",
    fee:"গত বছরের রেফারেন্স ১,১০০ টাকা/Faculty; বর্তমান fee notice-এ যাচাই করতে হবে।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","কোটা কাগজ","সমমান সনদ","প্রবেশপত্র"],
    links:[["BUP ভর্তি পোর্টাল","https://admission.bup.edu.bd/Admission/Home"],["সব BUP Notice","https://admission.bup.edu.bd/Admission/NoticeAll"]]
  },

  "রাজশাহী বিশ্ববিদ্যালয়": {
    aliases:["University of Rajshahi","Rajshahi University","RU","রাবি"],
    current:["২০২৬–২৭: B/Business — ৮ জানুয়ারি; C/Science — ৯ জানুয়ারি; A/Humanities — ১৬ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ অনলাইন আবেদন: ২০ নভেম্বর ২০২৫ দুপুর ১২:০১ থেকে ৭ ডিসেম্বর রাত ১১:৫৯ পর্যন্ত (অফিসিয়াল guideline)।",
      "অফিসিয়াল পোর্টালে Application Guideline, Payment Instructions, Photo/Selfie Instructions, Helpline, FAQ ও Complaint সুবিধা ছিল।",
      "পূর্ববর্তী সেশনে Unit C পরীক্ষা ১৬ জানুয়ারি, Unit A ১৭ জানুয়ারি এবং Unit B ২৪ জানুয়ারি ২০২৬ অনুষ্ঠিত হয়েছিল।",
      "গত বছর Departments/Institutes Seats নামে আলাদা অফিসিয়াল seat notice প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["Unit/Department অনুযায়ী যোগ্যতা আলাদা; ২০২৬–২৭ অফিসিয়াল guideline প্রকাশ হলে সেটিই চূড়ান্ত।"],
    format:["বর্তমান ২০২৬–২৭ পরীক্ষার পূর্ণ marks distribution অফিসিয়াল notice-এ যাচাই করতে হবে।"],
    seats:"Department/Institute seat notice থেকে বর্তমান সংখ্যা নিতে হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","Photo/Selfie","কোটা কাগজ","প্রবেশপত্র"],
    links:[["RU ভর্তি পোর্টাল","https://admission.ru.ac.bd/"],["২০২৫–২৬ Application Guideline","https://admission.ru.ac.bd/student/application-guideline"]]
  },

  "জগন্নাথ বিশ্ববিদ্যালয়": {
    aliases:["Jagannath University","JnU","জবি"],
    current:["২০২৬–২৭: A — ১ জানুয়ারি; E — ৮ জানুয়ারি; B — ১৫ জানুয়ারি; C — ২২ জানুয়ারি; D — ২৩ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ আবেদন: ২০ নভেম্বর–৫ ডিসেম্বর ২০২৫।",
      "Admit Card: A Unit ১০–২১ ডিসেম্বর; C Unit ১০–২২ ডিসেম্বর; D Unit ২৫ ডিসেম্বর–৪ জানুয়ারি; E Unit ৭–১১ ডিসেম্বর; B Unit ১৫–২৫ জানুয়ারি।",
      "২০২৫–২৬ পরীক্ষার তারিখ: A ২৬ ডিসেম্বর, C ২৭ ডিসেম্বর, D ৯ জানুয়ারি, E ১৩ ডিসেম্বর, B ৩০ জানুয়ারি।",
      "অফিসিয়াল admission portal-এ user manual ও পূর্ণ ভর্তি নির্দেশিকা প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ Unit-wise যোগ্যতা নতুন guideline অনুযায়ী নিতে হবে।"],
    format:["Unit-wise marks ও question pattern current circular অনুযায়ী।"],
    seats:"বর্তমান seat matrix নতুন prospectus/guideline থেকে নেওয়া হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","কোটা/সমমান কাগজ","প্রবেশপত্র"],
    links:[["JnU ভর্তি পোর্টাল","https://admission.jnu.ac.bd/"],["২০২৫–২৬ Prospectus Page","https://admission.jnu.ac.bd/preliminary/prospectus/5789b26bc53ff5bcd6ef80e542440c797167aa97.jsp"]]
  },

  "খুলনা বিশ্ববিদ্যালয়": {
    aliases:["Khulna University","KU","খুবি"],
    current:["২০২৬–২৭: D/Business ও C/Humanities — ১৭ ডিসেম্বর; A/Science ও B/Life Science — ১৮ ডিসেম্বর ২০২৬।"],
    previous:[
      "২০২৫–২৬ A Unit ও D Unit-এর আবেদন ছিল ৭ নভেম্বর থেকে ২৭ নভেম্বর ২০২৫ রাত ১১:৫৯ পর্যন্ত।",
      "A Unit পরীক্ষা ১৯ ডিসেম্বর ২০২৫; D Unit পরীক্ষা ১৮ ডিসেম্বর ২০২৫।",
      "A Unit-এ মোট ৩২০ আসন; Architecture ৩৭, CSE ৪০, URP ৪০, ECE ৩৭, Mathematics ৪৫, Physics ৪০, Chemistry ৪০, Statistics ৪০।",
      "A Unit যোগ্যতা: SSC+HSC মোট GPA কমপক্ষে ৮.০০।",
      "A Unit পরীক্ষা ১০০ নম্বর: MCQ ৬০ + লিখিত ৪০; Architecture-এর জন্য অতিরিক্ত Freehand Drawing ৫০। MCQ ভুল উত্তরে ০.২৫ নম্বর কাটা হতো।",
      "D Unit-এ মোট ৮৮ আসন; Business Administration ৪৭ ও Human Resource Management ৪০সহ quota।",
      "D Unit যোগ্যতা: SSC ও HSC উভয়টিতে পৃথক GPA কমপক্ষে ৩.৫০ এবং HSC English-এ GPA কমপক্ষে ৩.০০।",
      "D Unit পরীক্ষা ১০০ নম্বর/১ ঘণ্টা ৩০ মিনিট: MCQ ৬০ + English Composition লিখিত ৪০; MCQ-তে ২৫% negative marking।"
    ],
    eligibility:["Unitভেদে আলাদা; A Unit Science/Engineering এবং D Unit Business-এর যোগ্যতা গত বছরের official prospectus-এ বিস্তারিত ছিল।"],
    format:["A Unit: MCQ+লিখিত; D Unit: MCQ+English Composition; Architecture-এ অতিরিক্ত অঙ্কন — ২০২৫–২৬ রেফারেন্স।"],
    seats:"গত বছর A Unit ৩২০, D Unit ৮৮; ২০২৬–২৭ নতুন circular-এ পরিবর্তন হতে পারে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC মূল grade sheet/certificate","ছবি/স্বাক্ষর","quota certificate","প্রবেশপত্র"],
    links:[["KU Application Portal","https://apply.ku.ac.bd/"],["২০২৫–২৬ A Unit Prospectus","https://apply.ku.ac.bd/images/prospectus/A-Unit.pdf"],["২০২৫–২৬ D Unit Prospectus","https://apply.ku.ac.bd/images/prospectus/D-Unit.pdf"]]
  },

  "SUST": {
    aliases:["Shahjalal University of Science and Technology","শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়","শাবিপ্রবি"],
    current:["২০২৬–২৭: A Unit — ২৬ জানুয়ারি; B Unit — ২৭ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল admission site department eligibility table প্রকাশ করেছে।",
      "বিভাগে ভর্তির জন্য সংশ্লিষ্ট HSC-Level prerequisite subject-এ সাধারণত কমপক্ষে GPA ৩.০০ লাগত।",
      "CSE/EEE/IPE/MEE/PHY/SWE-তে Physics ও Mathematics; ARC-এ Physics ও Mathematics; BMB/GEB-এ Biology, Chemistry, Mathematics; MAT/STA-তে Mathematics প্রয়োজন ছিল।",
      "গত বছরের অফিসিয়াল admission portal-এ SSC/HSC board, roll ও pass year দিয়ে registration শুরু করা হতো।"
    ],
    eligibility:["Unit eligibility-এর পাশাপাশি Department-specific prerequisite subject পূরণ করা বাধ্যতামূলক হতে পারে।"],
    format:["২০২৬–২৭ পূর্ণ marks distribution current circular অনুযায়ী।"],
    seats:"বিভাগভিত্তিক বর্তমান seat matrix current prospectus থেকে নিতে হবে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["SUST ভর্তি পোর্টাল","https://admission.sust.edu.bd/"]]
  },

  "চট্টগ্রাম বিশ্ববিদ্যালয়": {
    aliases:["University of Chittagong","Chittagong University","CU","চবি"],
    current:["২০২৬–২৭: C — ২৯ জানুয়ারি; A — ৩০ জানুয়ারি; B1 — ৩ ফেব্রুয়ারি; B2 — ৪ ফেব্রুয়ারি; B — ৫ ফেব্রুয়ারি; D — ৬ ফেব্রুয়ারি; D1 — ৮ ফেব্রুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল CU admission portal-এ Prospectus, Admission Notice, Application Process, General Eligibility, Schedule ও Fee Rules আলাদা মেনুতে প্রকাশ করা হয়েছিল।",
      "A Unit-এর helpline আলাদা ছিল Science/Biological Sciences/Engineering/Marine Sciences faculties-এর জন্য।",
      "B/B1/B2, C, D/D1-এর জন্য আলাদা faculty helpline ছিল।",
      "গত বছরের portal-এ unit-specific eligibility ও fee rules অফিসিয়ালি প্রকাশ করা হয়েছিল; ২০২৬–২৭-এ নতুন prospectus প্রকাশ হলে সেটিই ব্যবহার করতে হবে।"
    ],
    eligibility:["Unit এবং Department অনুযায়ী যোগ্যতা ভিন্ন; current prospectus-ই চূড়ান্ত।"],
    format:["Unit-wise question pattern, duration ও negative marking current prospectus অনুযায়ী।"],
    seats:"Unit/Department seat matrix current prospectus থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota documents","প্রবেশপত্র"],
    links:[["CU ভর্তি পোর্টাল","https://admission.cu.ac.bd/"],["২০২৫–২৬ Admission Notice Page","https://admission.cu.ac.bd/admission-notice"]]
  },

  "কুমিল্লা বিশ্ববিদ্যালয়": {
    aliases:["Comilla University","CoU","কুবি"],
    current:["২০২৬–২৭ আবেদন: Chorcha অনুযায়ী ১৫ নভেম্বর–১০ ডিসেম্বর ২০২৬।","পরীক্ষা: A — ৫ ফেব্রুয়ারি; B — ৬ ফেব্রুয়ারি; C — ৭ ফেব্রুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ অফিসিয়াল ভর্তি বিজ্ঞপ্তি ২৫ নভেম্বর ২০২৫ এবং ভর্তি নির্দেশিকা ২৭ নভেম্বর প্রকাশ হয়েছিল।",
      "আবেদন শুরু হয়েছিল ২৭ নভেম্বর ২০২৫; সময় পরে বাড়ানো হয়েছিল।",
      "ভর্তি পরীক্ষা ৩০ ও ৩১ জানুয়ারি ২০২৬ অনুষ্ঠিত হয়েছিল।",
      "অফিসিয়াল notice অনুযায়ী ২০২৫–২৬ প্রবেশপত্র ডাউনলোড ২৬ জানুয়ারি ২০২৬ থেকে শুরু হয়েছিল।"
    ],
    eligibility:["২০২৬–২৭ Unit-wise GPA ও subject eligibility নতুন official guideline অনুযায়ী।"],
    format:["বর্তমান unit-wise marks distribution নতুন guideline অনুযায়ী।"],
    seats:"বর্তমান seat matrix নতুন guideline থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["কুমিল্লা বিশ্ববিদ্যালয় Admission Archive","https://www.cou.ac.bd/admission"],["Undergraduate Program Notices","https://www.cou.ac.bd/program-category/undergraduate-program"]]
  },

  "BUTEX": {
    aliases:["Bangladesh University of Textiles","বুটেক্স","Textile University"],
    current:["২০২৬–২৭ পরীক্ষা: ২৯ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬-এ প্রায় ৯,০০০ পরীক্ষার্থীকে ৬৪০ আসনের বিপরীতে পরীক্ষায় অংশ নিতে দেওয়া হয়েছিল।",
      "SSC GPA কমপক্ষে ৪.০০ এবং HSC GPA কমপক্ষে ৪.০০।",
      "HSC Math+Physics+Chemistry+English মোট Grade Point কমপক্ষে ১৭.৫০; প্রতিটি বিষয়ে কমপক্ষে ৩.৫০।",
      "HSC-তে Mathematics অন্তত optional subject হিসেবে থাকতে হতো।",
      "Second timer গ্রহণ করা হয়নি; শুধুমাত্র ওই বছরের HSC উত্তীর্ণরা আবেদন করতে পারত।",
      "লিখিত পরীক্ষা ২০০ নম্বর: Mathematics ৬০, Physics ৬০, Chemistry ৬০, English ২০।",
      "Admit Card download সময় ১ জানুয়ারি থেকে বাড়িয়ে ৫ জানুয়ারি ২০২৬ রাত ১১:৫৯ পর্যন্ত করা হয়েছিল।"
    ],
    eligibility:["বর্তমান ২০২৬–২৭ circular না আসা পর্যন্ত গত বছরের GPA ও passing-year নিয়মকে কেবল reference হিসেবে দেখুন।"],
    format:["গত বছর Written ২০০ marks — Math ৬০, Physics ৬০, Chemistry ৬০, English ২০।"],
    seats:"গত বছর ৬৪০ আসন; current circular-এ পরিবর্তন হতে পারে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","equivalence document"],
    links:[["BUTEX Undergraduate Admission","https://www.butex.edu.bd/admissions/"]]
  },

  "AAUB": {
    aliases:["Aviation and Aerospace University Bangladesh","Aviation and Aerospace University, Bangladesh","এএউবি"],
    current:["২০২৬–২৭ স্নাতক ভর্তি পরীক্ষা: ৫ ডিসেম্বর ২০২৬; কেন্দ্র BAF Shaheen College, Dhaka এবং AAUB Lalmonirhat Campus।"],
    previous:[
      "২০২৫–২৬ আবেদন: ৯ নভেম্বর ২০২৫ দুপুর ১২টা থেকে ১১ ডিসেম্বর রাত ১১:৫৯।",
      "সার্ভিস চার্জ/আবেদন ফি ১,০০০ টাকা; প্রদানের শেষ সময় ১৪ ডিসেম্বর রাত ১১:৫৯।",
      "যোগ্য প্রার্থীর তালিকা ১৫ ডিসেম্বর; প্রবেশপত্র ১৬ ডিসেম্বর দুপুর ১২টা থেকে ২৬ ডিসেম্বর সকাল ৯টা পর্যন্ত।",
      "ভর্তি পরীক্ষা ২৬ ডিসেম্বর ২০২৫ সকাল ১০টা–১২টা।",
      "৪ বছর মেয়াদি undergraduate program: B.Sc. Aerospace Engineering, Avionics Engineering, Aircraft Maintenance Engineering (Aerospace), Aircraft Maintenance Engineering (Avionics)।"
    ],
    eligibility:["২০২৬–২৭ current notice-ই চূড়ান্ত; গত বছরের পূর্ণ eligibility guideline official PDF-এ আছে।"],
    format:["গত বছরের written test ছিল ২ ঘণ্টা।"],
    seats:"বর্তমান program-wise seats current notice থেকে।",
    fee:"গত বছর ১,০০০ টাকা; current fee নতুন notice অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান কাগজ"],
    links:[["AAUB Admission Info","https://www.aaub.edu.bd/public/content/admission-info"],["২০২৫–২৬ Admission Guideline PDF","https://aaub.edu.bd/public/ckfinder/userfiles/files/Admission-Instruction-2025-26%281%29.pdf"]]
  },

  "GST গুচ্ছ": {
    aliases:["GST","GST Cluster","General Science and Technology Cluster","গুচ্ছ"],
    current:["২০২৬–২৭: B/Humanities — ১৯ মার্চ; C/Business ও D/Architecture — ২০ মার্চ; A/Science — ২৭ মার্চ ২০২৭।"],
    previous:[
      "২০২৫–২৬ official GST portal-এর workflow অনুযায়ী ইউনিটভিত্তিক আবেদন, admit card, centre এবং subject choice এক প্ল্যাটফর্মে পরিচালিত হয়েছে।",
      "গত বছরের participating university/seat matrix ও eligibility session-specific ছিল; তাই ২০২৬–২৭-এ তালিকা পরিবর্তিত হতে পারে।"
    ],
    eligibility:["A/B/C unit অনুযায়ী group, GPA ও subject requirement current GST circular থেকে নিতে হবে।"],
    format:["বর্তমান marks distribution, duration ও negative marking current circular অনুযায়ী।"],
    seats:"Participating university-wise seat matrix current GST notice থেকে।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","quota/equivalence documents","প্রবেশপত্র"],
    links:[["GST Official Portal","https://gstadmission.ac.bd/"]]
  },

  "কৃষি গুচ্ছ": {
    aliases:["Agriculture Cluster","Agri","Agricultural Universities Cluster","ACAS"],
    current:["২০২৬–২৭ পরীক্ষা: ২ জানুয়ারি ২০২৭।"],
    previous:[
      "২০২৫–২৬ কৃষি গুচ্ছে কৃষিবিজ্ঞান বিষয়ে ডিগ্রি প্রদানকারী ৯টি পাবলিক বিশ্ববিদ্যালয় অংশ নিয়েছিল।",
      "অফিসিয়াল ভর্তি বিজ্ঞপ্তি ও ভর্তি নির্দেশিকা প্রকাশ হয়েছিল ২৩ নভেম্বর ২০২৫; সংশোধিত বিজ্ঞপ্তি ১২ ডিসেম্বর।",
      "অফিসিয়াল seat plan প্রকাশ হয়েছিল ২৮ ডিসেম্বর ২০২৫ এবং পরীক্ষার্থী/পরিদর্শক নির্দেশনা ২ জানুয়ারি ২০২৬।",
      "পরে merit, waiting, migration, university/degree choice ও admission confirmation—সবকিছুর জন্য ধারাবাহিক official notice প্রকাশ করা হয়েছিল।"
    ],
    eligibility:["Science background, GPA ও Biology/Chemistry/Physics/Math subject requirement current ACAS guideline অনুযায়ী।"],
    format:["বর্তমান exam marks distribution ও duration ২০২৬–২৭ guideline থেকে নিতে হবে।"],
    seats:"৯টি বিশ্ববিদ্যালয়ের university/degree-wise seat matrix current guideline অনুযায়ী।",
    fee:"বর্তমান fee অপেক্ষমাণ।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","quota/equivalence documents"],
    links:[["ACAS Official Portal","https://acas.edu.bd/"],["ACAS Notice Archive","https://acas.edu.bd/notice"]]
  },

  "মেডিকেল ও ডেন্টাল": {
    aliases:["Medical & Dental","Medical","Dental","MBBS","BDS","মেডিকেল","ডেন্টাল"],
    current:["২০২৬–২৭ ক্যালেন্ডারে MBBS/BDS ভর্তি পরীক্ষা ৪ ডিসেম্বর ২০২৬ সকাল ১০টা দেখানো হয়েছে; DGME/DGHS-এর নতুন domestic circular চূড়ান্ত উৎস।"],
    previous:[
      "২০২৫–২৬ MBBS/BDS admission circular DGME ১০ নভেম্বর ২০২৫ প্রকাশ করেছিল।",
      "ভর্তি পরীক্ষা হয়েছিল ১২ ডিসেম্বর ২০২৫ সকাল ১০টা।",
      "গত বছরের reference: ১০০টি MCQ, সময় ১ ঘণ্টা ১৫ মিনিট, pass mark ৪০।",
      "বিষয়ভিত্তিক: Biology ৩০, Chemistry ২৫, Physics ১৫, English ১৫, General Knowledge/Aptitude/Human Qualities ১৫।",
      "প্রতি ভুল উত্তরে ০.২৫ নম্বর কাটা হতো।",
      "Merit calculation reference: SSC GPA×৮ (max ৪০) + HSC GPA×১২ (max ৬০) + admission test score।",
      "২০২৫–২৬ combined government/private MBBS+BDS seat reference ছিল ১৩,০৫১; এর মধ্যে সরকারি ৫,৬৪৫ এবং বেসরকারি ৭,৪০৬।"
    ],
    eligibility:["Science background, Biology/Chemistry/Physics ও GPA/passing-year শর্ত current DGME/DGHS circular অনুযায়ী।"],
    format:["গত বছর ১০০ MCQ, ৭৫ মিনিট, −০.২৫ negative marking।"],
    seats:"২০২৫–২৬ reference ১৩,০৫১; ২০২৬–২৭ সংখ্যা current circular-এ যাচাই করতে হবে।",
    fee:"বর্তমান application fee নতুন circular অনুযায়ী।",
    documents:["রঙিন প্রবেশপত্র","HSC/equivalent admit/registration card","কালো ballpoint pen","বর্তমান circular-এ চাওয়া অন্য কাগজ"],
    links:[["DGME Notice","https://dgme.gov.bd/pages/notices"],["DGHS Notice","https://dghs.gov.bd/pages/notices"]]
  },
  "AFMC, AMC & Navy": {
    aliases:["AFMC","AMC","Army Medical College","Navy Medical College","আর্মড ফোর্সেস মেডিকেল কলেজ","আর্মি মেডিকেল কলেজ","নেভি মেডিকেল কলেজ"],
    current:["২০২৬–২৭ বর্তমান বিস্তারিত সার্কুলার প্রকাশিত/যাচাইকৃত হলে এখানে অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকার পূর্ণ পূর্ববর্তী ভর্তি তথ্য নিচের ‘তথ্য কণিকা’ অংশে দেওয়া হয়েছে।"],
    eligibility:["তথ্য কণিকার পূর্ববর্তী যোগ্যতা নিচে দেখুন।"],
    format:["তথ্য কণিকার পূর্ববর্তী পরীক্ষার ধরন ও নম্বরবণ্টন নিচে দেখুন।"],
    seats:"তথ্য কণিকা অনুযায়ী ৪৩৫টি আসন।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সামরিক/মেডিকেল ভর্তি নথি"],
    links:[]
  },
  "IUT": {
    aliases:["Islamic University of Technology","ইসলামিক ইউনিভার্সিটি অব টেকনোলজি","আইইউটি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকার পূর্ণ পূর্ববর্তী ভর্তি তথ্য নিচে দেওয়া হয়েছে।"],
    eligibility:["তথ্য কণিকার পূর্ববর্তী যোগ্যতা নিচে দেখুন।"],
    format:["তথ্য কণিকার পূর্ববর্তী পরীক্ষার ধরন ও নম্বরবণ্টন নিচে দেখুন।"],
    seats:"তথ্য কণিকা অনুযায়ী ৫৫০টি আসন।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য সমমান নথি"],
    links:[["IUT Official Website","https://www.iutoic-dhaka.edu/"]]
  },
  "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়": {
    aliases:["Jahangirnagar University","JU","জাবি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকায় A, D, B, C ও C1 ইউনিটের পূর্ণ পূর্ববর্তী তথ্য দেওয়া আছে; নিচে দেখুন।"],
    eligibility:["ইউনিটভেদে আলাদা; তথ্য কণিকার পূর্ববর্তী নিয়ম নিচে দেখুন।"],
    format:["ইউনিটভেদে ৮০ নম্বর MCQ ও ৫৫ মিনিটের পূর্ববর্তী ফরম্যাট তথ্য কণিকায় আছে।"],
    seats:"তথ্য কণিকায় A&D মিলিয়ে ৭৩৬ এবং B&C মিলিয়ে ৮৫৬ আসনের তথ্য দেওয়া আছে।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা নথি"],
    links:[["JU Official Website","https://juniv.edu/"]]
  },
  "হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়": {
    aliases:["HSTU","Hajee Mohammad Danesh Science and Technology University","হাবিপ্রবি"],
    current:["২০২৬–২৭ বর্তমান ভর্তি বিজ্ঞপ্তি/তারিখ পাওয়া গেলে সেটি অগ্রাধিকার পাবে।"],
    previous:["তথ্য কণিকায় A, B ও D ইউনিটের পূর্ণ পূর্ববর্তী তথ্য দেওয়া আছে; নিচে দেখুন।"],
    eligibility:["ইউনিটভেদে SSC/HSC GPA শর্ত তথ্য কণিকায় দেওয়া আছে।"],
    format:["পূর্ববর্তী তথ্য অনুযায়ী ১০০ নম্বর MCQ, সময় ১ ঘণ্টা।"],
    seats:"তথ্য কণিকায় A,B মিলিয়ে ১২৭৫ এবং D Unit ২৪০ আসনের তথ্য দেওয়া আছে।",
    fee:"বর্তমান ফি অফিসিয়াল সার্কুলার অনুযায়ী।",
    documents:["SSC/HSC তথ্য","ছবি/স্বাক্ষর","প্রবেশপত্র","প্রযোজ্য কোটা নথি"],
    links:[["HSTU Official Website","https://hstu.ac.bd/"]]
  }

};


const BOOKLET_ROWS = [
  {p:"মেডিকেল ও ডেন্টাল",cat:"মেডিকেল ও ডেন্টাল",unit:"মেডিকেল ও ডেন্টাল",seats:"৫৬৪৫ টি (মেডিকেল ৫১০০ টি, ডেন্টাল ৫৪৫ টি)",elig:"SSC + HSC ন্যূনতম জিপিএ ৮.৫; HSC পরীক্ষায় জীববিজ্ঞানে জিপিএ ৩.৫-এর কম নয়।",exam:"১০০ নম্বর MCQ; সময় ১ ঘণ্টা ১৫ মিনিট; পাশ নম্বর ৪০; ক্যালকুলেটর ব্যবহার করা যাবে না।",marks:"জীববিজ্ঞান ৩০, রসায়ন ২৫, পদার্থবিজ্ঞান ১৫, ইংরেজি ১৫, সাধারণ জ্ঞান/প্রবণতা/মানবিক গুণাবলি ১৫।",result:"(SSC GPA × 8) + (HSC GPA × 12) + ভর্তি পরীক্ষার ১০০ = মোট ২০০ নম্বরের ভিত্তিতে মেধাতালিকা।"},
  {p:"AFMC, AMC & Navy",cat:"মেডিকেল ও ডেন্টাল",unit:"AFMC, AMC & Navy",seats:"৪৩৫ টি (AFMC ১২৫, Army & Navy Medical College ৩১০)",elig:"SSC + HSC ন্যূনতম জিপিএ ৮.৫০; HSC পরীক্ষায় জীববিজ্ঞানে জিপিএ ৩.৫-এর কম নয়।",exam:"১০০ নম্বর MCQ; সময় ১ ঘণ্টা ১৫ মিনিট; পাশ নম্বর ৪০; ক্যালকুলেটর ব্যবহার করা যাবে না।",marks:"জীববিজ্ঞান ৩০, রসায়ন ২৫, পদার্থবিজ্ঞান ১৫, ইংরেজি ১৫, সাধারণ জ্ঞান/প্রবণতা/মানবিক গুণাবলি ১৫।",result:"(SSC GPA × 8) + (HSC GPA × 12) + ভর্তি পরীক্ষার ১০০ = মোট ২০০ নম্বরের ভিত্তিতে মেধাতালিকা।"},

  {p:"BUET",cat:"ইঞ্জিনিয়ারিং",unit:"BUET",seats:"১৩০৫ টি + সংরক্ষিত ৪ = মোট ১৩০৯",elig:"SSC: গণিত, পদার্থবিজ্ঞান ও রসায়নসহ ৫-এর স্কেলে ন্যূনতম GPA ৪। HSC: GPA ৫ এবং উচ্চতর গণিত, পদার্থবিজ্ঞান ও রসায়নের প্রতিটিতে GP ৫।",exam:"গ্রুপ ‘ক’: লিখিত ৬০০ নম্বর, ৩ ঘণ্টা। গ্রুপ ‘খ’: Architecture ৪০০ নম্বর, ১ ঘণ্টা ৩০ মিনিট। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: উচ্চতর গণিত ২০×১০, পদার্থবিজ্ঞান ২০×১০, রসায়ন ২০×১০। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৩×১১২, দৃষ্টিগত ও স্থানিক ধীশক্তি ৪×১৬।",result:"শুধু লিখিত পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"RUET",cat:"ইঞ্জিনিয়ারিং",unit:"RUET",seats:"১২৩০ টি + সংরক্ষিত ৫ = মোট ১২৩৫",elig:"SSC/সমমানে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান ও রসায়ন—এই ৩ বিষয়ের মোট GP কমপক্ষে ১৪।",exam:"গ্রুপ ‘ক’: MCQ ৪০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট। গ্রুপ ‘খ’: Architecture ২০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: উচ্চতর গণিত ২০×৬, পদার্থবিজ্ঞান ২০×৬, রসায়ন ২০×৬, ইংরেজি ২০×২। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ২×৫০, দৃষ্টিগত ও স্থানিক ধীশক্তি ২×৫০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"KUET",cat:"ইঞ্জিনিয়ারিং",unit:"KUET",seats:"১০৬০ টি + সংরক্ষিত ৫ = মোট ১০৬৫",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়নে পৃথকভাবে GP ৪ এবং ইংরেজিসহ মোট GP ১৮। Biomedical Engineering-এর জন্য জীববিজ্ঞানে GP ৪।",exam:"গ্রুপ ‘ক’: লিখিত ৫০০ নম্বর, ৩ ঘণ্টা। গ্রুপ ‘খ’: Architecture ১০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: গণিত ১৫×১০, পদার্থবিজ্ঞান ১৫×১০, রসায়ন ১৫×১০, ইংরেজি ৫×১০। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৪×২৫।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"CUET",cat:"ইঞ্জিনিয়ারিং",unit:"CUET",seats:"৯২০ টি + সংরক্ষিত ১১ = মোট ৯৩১",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়নে মোট GP কমপক্ষে ১৪ এবং ইংরেজিতে কমপক্ষে B; Biomedical Engineering-এর জন্য Biology GP ৪।",exam:"গ্রুপ ‘ক’: MCQ ৫০০ নম্বর, ২ ঘণ্টা ৩০ মিনিট। গ্রুপ ‘খ’: Architecture ২০০ নম্বর, ১ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গ্রুপ ‘ক’: গণিত ২৫×৬, পদার্থবিজ্ঞান ২৫×৬, রসায়ন ২৫×৬, ইংরেজি ২৫×২। গ্রুপ ‘খ’: মুক্তহস্ত অংকন ৪×৫০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"BUTEX",cat:"ইঞ্জিনিয়ারিং",unit:"BUTEX",seats:"৬৩০ টি",elig:"SSC-তে কমপক্ষে GPA ৪। HSC-তে GPA ৪ এবং উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়ন ও ইংরেজিতে আলাদাভাবে GP ৩.৫০; চার বিষয়ের মোট GP কমপক্ষে ১৭.৫০।",exam:"Written ২০০ নম্বর, ২ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গণিত ৬০, পদার্থবিজ্ঞান ৬০, রসায়ন ৬০, ইংরেজি ২০।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"IUT",cat:"ইঞ্জিনিয়ারিং",unit:"IUT",seats:"৫৫০ টি",elig:"SSC ও HSC প্রতিটিতে ন্যূনতম GPA ৪.৫। HSC-তে Physics, Chemistry, Mathematics প্রতিটিতে A+ এবং English-এ কমপক্ষে A।",exam:"১০০ নম্বর MCQ, সময় ২ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"BSc Engg and BBA: গণিত ৩৫, পদার্থবিজ্ঞান ৩৫, রসায়ন ১৫, ইংরেজি ১৫।",result:"শুধু ভর্তি পরীক্ষায় প্রাপ্ত নম্বরের উপর মেধাতালিকা।"},
  {p:"MIST",cat:"ইঞ্জিনিয়ারিং",unit:"MIST",seats:"৫৭০ টি",elig:"SSC-তে ন্যূনতম GPA ৪ (৪র্থ বিষয় ব্যতীত)। HSC-তে গণিত, পদার্থবিজ্ঞান, রসায়নে প্রতিটিতে GPA ৪ এবং ইংরেজিসহ এই ৪ বিষয়ে মোট GPA ১৮।",exam:"A Unit: Written ২০০ নম্বর, ৩ ঘণ্টা। B Unit: Architecture ২০০ নম্বর, ২ ঘণ্টা। ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A Unit: গণিত ৮০, পদার্থবিজ্ঞান ৬০, রসায়ন ৪০, ইংরেজি ২০। B Unit: মুক্তহস্ত অংকন ও দৃষ্টিগত/স্থানিক ধীশক্তি ২০০।",result:"SSC ও HSC (Math+Physics+Chemistry) প্রাপ্ত নম্বরের ৪০% + লিখিত পরীক্ষার ৬০%।"},

  {p:"SUST",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"SUST ‘A’ Unit",seats:"৯৮৫ টি",elig:"SSC ও HSC-তে পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫; HSC-তে গণিতে ন্যূনতম GPA ৩।",exam:"Group-1 (A1): MCQ ৮০ নম্বর, ১ ঘণ্টা ৩০ মিনিট। Group-2 (A2): Architecture ৩০ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A1: পদার্থ ২০, রসায়ন ২০, গণিত ২০, ঐচ্ছিক জীববিজ্ঞান/ইংরেজি ২০। A2: Drawing ও Architecture GK ৩০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"DU ‘KA’ Unit",seats:"১৮৯১ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর নয়।",marks:"MCQ: Physics + Chemistry + নৈর্বাচনিক (৪র্থ বিষয়/বাংলা/ইংরেজি) যেকোনো ১টি; প্রতিটি বিষয়ে ১৫ প্রশ্ন/১৫ নম্বর। Written: প্রতিটি বিষয়ে ১০ নম্বর; প্রশ্নের মান ২–৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"JU ‘A & D’ Unit",seats:"৭৩৬ টি (ছেলে ৩৬৮, মেয়ে ৩৬৮)",elig:"A Unit: SSC+HSC মোট GPA ৮.৫০, পৃথকভাবে কমপক্ষে ৪। D Unit: মোট GPA ৯, পৃথকভাবে কমপক্ষে ৪।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট; ক্যালকুলেটর নয়।",marks:"A: গণিত ২২, পদার্থ ২২, রসায়ন ২২, বাংলা ৩, ইংরেজি ৩, ICT ৮। D: বাংলা ৪, ইংরেজি ৪, রসায়ন ২৪, উদ্ভিদবিজ্ঞান ২২, প্রাণিবিজ্ঞান ২২, বুদ্ধিমত্তা ৪।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"JnU ‘A’ Unit",seats:"৮৪০ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩.২৫ এবং মোট GPA ৭.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"পদার্থবিজ্ঞান ২৪, রসায়ন ২৪, গণিত/জীববিজ্ঞান ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC থেকে ১০ + HSC থেকে ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"RU ‘C’ Unit",seats:"১৫৩৬ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"ক আবশ্যিক: পদার্থ ২৫×১.২৫, রসায়ন ২৫×১.২৫, ICT ৫×১.২৫। খ ঐচ্ছিক: গণিত/জীববিজ্ঞান ২৫×১.২৫ যেকোনো ১টি, অথবা জীববিজ্ঞান ১৩×১.২৫ + গণিত ১২×১.২৫।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"CU ‘A’ Unit",seats:"১০৯৩ টি",elig:"SSC+HSC ৪র্থ বিষয়সহ মোট GPA ৮; SSC-তে ন্যূনতম GPA ৪ এবং HSC-তে ন্যূনতম GPA ৩।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"ইংরেজি ২৫; পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান—যেকোনো ৩টি ×২৫ = ৭৫।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে অতিরিক্ত tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"BUP (FST)",seats:"৩০০ টি",elig:"SSC+HSC মোট GPA ৯; HSC-তে Physics, Chemistry, Biology-তে A এবং English-এ কমপক্ষে A−।",exam:"৬০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গণিত ২০, জীববিজ্ঞান ২০, পদার্থবিজ্ঞান ২০, রসায়ন ২০—৪টির মধ্যে ৩টি বিষয়ের উত্তর।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"GST ‘A’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"বিজ্ঞান বিভাগের প্রায় ৫৯৯৪ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.২৫ এবং মোট GPA কমপক্ষে ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫ + Chemistry ২৫ + Math/Biology ২৫-এর যেকোনো ১টি; অপরটির বদলে Bangla/English ২৫ দেওয়া যাবে।",result:"শুধু ভর্তি পরীক্ষার নম্বরের ভিত্তিতে মেধাক্রম; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"KU ‘A & B’ Unit",seats:"৬০১ টি",elig:"SSC ও HSC মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A MCQ: Math ১৫, Physics ১৫, Chemistry ১৫, English ১০, ICT ৫; Written: Math ১০, Physics ১০, Chemistry ১০, English ৫, ICT ৫। B MCQ: Biology ১৫, Chemistry ১২, Math ১২, Physics ১২, English ৯; Written: Biology ১০, Chemistry ৮, Math ৮, Physics ৮, English ৬।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"CoU ‘A’ Unit",seats:"৩০০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫, Chemistry ২৫ এবং (Bangla+English ২৫) / Math ২৫ / Biology ২৫—এই ৩ option থেকে যেকোনো ২টি।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কৃষি গুচ্ছ",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"কৃষি গুচ্ছ (৯ বিশ্ববিদ্যালয়)",seats:"৩৭০১ টি",elig:"SSC ও HSC-তে Biology, Chemistry, Physics, Mathematicsসহ উত্তীর্ণ; ৪র্থ বিষয় ব্যতীত প্রতিটিতে ন্যূনতম GPA ৪ এবং SSC+HSC মোট GPA ৮.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Math ২০, Physics ২০, Chemistry ২০, Botany ১৫, Zoology ১৫, English ১০।",result:"ভর্তি পরীক্ষার নম্বর + SSC ২৫ + HSC ২৫।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘ক’/বিজ্ঞান",unit:"HSTU ‘A, B’ Unit",seats:"১২৭৫ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫০ এবং মোট GPA ৭.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"A: Physics ২৫, Chemistry ২৫, Biology ২৫, English ২৫। B: Physics ২৫, Chemistry ২৫, Mathematics ২৫, English ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"},

  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"DU ‘KHA’ Unit",seats:"২৯৩৪ টি (মানবিক ১৬৯৪, বিজ্ঞান ৯৬২, ব্যবসায় শিক্ষা ২৭৮)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৭.৫।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা/Advanced English ১৫ + General English ১৫ + GK ৩০। Written: বাংলা/Advanced English ২০ + General English ২০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"JU ‘B & C’ Unit",seats:"৮৫৬ টি (ছেলে ৪২৮, মেয়ে ৪২৮)",elig:"মানবিক ও ব্যবসায় শিক্ষার জন্য SSC+HSC মোট GPA ৭.৫; পৃথকভাবে ন্যূনতম GPA ৩.৫।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট।",marks:"B: বাংলা ২০, English ২০, সাধারণ গণিত ২০, GK ১৫, Logical Analysis ৫। C: বাংলা ২০, English ২০, GK ও বিভাগ-সংশ্লিষ্ট ৪০। C1: বাংলা ১০, English ১০, GK ২০, বিভাগ-সংশ্লিষ্ট ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"JnU ‘B & D’ Unit",seats:"১৩৯৫ টি (কলা ও আইন ৭৮৫, সামাজিক বিজ্ঞান ৬১০)",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা।",marks:"B: বাংলা ২৪, English ২৪, GK ২৪। D: বাংলা ২৪, English ২৪, গাণিতিক বুদ্ধিমত্তা ও GK ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC ১০ + HSC ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"RU ‘A’ Unit",seats:"১৮৯৭ টি (কলা ৯৩১, আইন ১৬০, সামাজিক বিজ্ঞান ৬৩৬, চারুকলা ১২০, IER ৫০)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, ইংরেজি ৩৫, সাধারণ জ্ঞান ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"CU ‘B & D’ Unit",seats:"১৯৯৪ টি (কলা ৯৭০, সমাজবিজ্ঞান ৮৮৯, চারুকলা ১৩৫)",elig:"B/B1/B2: SSC GPA ৩, HSC GPA ২.৫, মোট ৬.৫। D: SSC GPA ৩.৫, HSC GPA ৩, মোট ৭.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"B: বাংলা/ঐচ্ছিক English ৩০, English ৩০, GK ৪০। B1: বাংলা/ঐচ্ছিক English ২৫, English ২৫, GK ৫০। B2: বাংলা/ঐচ্ছিক English ২০, English ২০, Arabic/Islamic Studies/Pali/GK থেকে যেকোনো ২টি ×৩০। D: বাংলা/ঐচ্ছিক English ৩০, English ৩০, Analytical Ability ২০, GK/Math/Economics ২০।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"BUP (FASS & FSSS)",seats:"৬০০ টি (FASS ৩৫০, FSSS ২৫০)",elig:"FASS: SSC+HSC মোট GPA ৭.৫–৮। FSSS: SSC+HSC মোট GPA ৮–৮.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ৪০, General Knowledge ৪০, বাংলা ২০।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"GST ‘B’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"মানবিক বিভাগের প্রায় ৩০০০ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, English ৩৫, General Knowledge ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বর; পাশ নম্বর ৩০; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"KU ‘C’ Unit",seats:"৪১৫ টি",elig:"SSC ও HSC মোট GPA ৭।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা ১০, English ২৫, GK ২৫। Written: বাংলা ১০, English ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"SUST",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"SUST ‘B’ Unit",seats:"৫৮১ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬।",exam:"৮০ নম্বর MCQ, সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"English ১৫, বাংলা ১৫, সাধারণ গণিত ১৫, বাংলাদেশ ও আন্তর্জাতিক ১০, ICT ১০, অর্থনীতি/পৌরনীতি/সমাজবিজ্ঞান/সমাজকল্যাণ/ইতিহাস সম্পর্কিত ১৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"CoU ‘B’ Unit",seats:"৩৯০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মানবিক থেকে মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ২৫, বাংলা ২৫, General Knowledge ১০, মানবিক শাখার বিষয়ভিত্তিক ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"ভার্সিটি ‘খ’/মানবিক",unit:"HSTU ‘D’ Unit",seats:"২৪০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ২৫, English ৫০, General Knowledge ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"}
];

const uniList=document.getElementById('uniList');
Object.keys(UNIVERSITY_INFO).sort().forEach(name=>{const o=document.createElement('option');o.value=name;uniList.appendChild(o)});

function matchUniversity(q){
  q=q.trim().toLowerCase();
  if(!q) return null;
  for(const [name,info] of Object.entries(UNIVERSITY_INFO)){
    if(name.toLowerCase()===q || info.aliases.some(a=>a.toLowerCase()===q)) return [name,info];
  }
  for(const [name,info] of Object.entries(UNIVERSITY_INFO)){
    if(name.toLowerCase().includes(q) || info.aliases.some(a=>a.toLowerCase().includes(q)||q.includes(a.toLowerCase()))) return [name,info];
  }
  return null;
}
function listHtml(items){
  if(!items||!items.length) return '<p>তথ্য এখনো প্রকাশিত/যাচাইকৃত নয়।</p>';
  return '<ul>'+items.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>';
}
function renderUniversity(){
  const found=matchUniversity(uniSearch.value);
  if(!found){
    uniResult.innerHTML='<div class="empty">এই নামে প্রোফাইল পাওয়া যায়নি। DU, BUET, RUET, KUET, CUET, MIST, BUP, রাজশাহী বিশ্ববিদ্যালয়, জগন্নাথ বিশ্ববিদ্যালয়, খুলনা বিশ্ববিদ্যালয়, SUST, চট্টগ্রাম বিশ্ববিদ্যালয়, কুমিল্লা বিশ্ববিদ্যালয়, BUTEX, AAUB, GST, কৃষি গুচ্ছ বা মেডিকেল লিখে দেখুন।</div>';
    return;
  }
  const [name,x]=found;
  const eventMatches=all.filter(e=>{
    const s=(e.title||'').toLowerCase();
    return [name,...x.aliases].filter(v=>v&&v.length>2).some(t=>s.includes(t.toLowerCase()));
  });
  const dateList=eventMatches.length
    ? eventMatches.map(e=>new Date(e.date).toLocaleString('bn-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'short'})+' — '+e.title)
    : x.current;
  const links=(x.links||[]).map(([label,url])=>'<a href="'+url+'" target="_blank" rel="noopener">'+esc(label)+' ↗</a>').join('<br>');
  uniResult.innerHTML=
    '<div class="info-name">'+esc(name)+'</div>'+
    '<div class="info-status">বর্তমান সেশন ২০২৬–২৭ • যেখানে বর্তমান সার্কুলার অসম্পূর্ণ, সেখানে ২০২৫–২৬ অফিসিয়াল সার্কুলারের তথ্য আলাদাভাবে দেখানো হয়েছে</div>'+
    '<div class="info-grid">'+
      '<div class="info-card"><h3>📅 ২০২৬–২৭ পরীক্ষার তারিখ</h3>'+listHtml(dateList)+'</div>'+
      '<div class="info-card"><h3>🆕 বর্তমান ২০২৬–২৭ তথ্য</h3>'+listHtml(x.current)+'</div>'+
      '<div class="info-card" style="grid-column:span 2"><h3>📜 গত বছরের অফিসিয়াল সার্কুলার — ২০২৫–২৬</h3>'+listHtml(x.previous)+'</div>'+
      '<div class="info-card"><h3>✅ যোগ্যতা</h3>'+listHtml(x.eligibility)+'</div>'+
      '<div class="info-card"><h3>📝 পরীক্ষার ধরন ও নম্বরবণ্টন</h3>'+listHtml(x.format)+'</div>'+
      '<div class="info-card"><h3>🪑 আসন</h3><p>'+esc(x.seats)+'</p></div>'+
      '<div class="info-card"><h3>💳 আবেদন ফি</h3><p>'+esc(x.fee)+'</p></div>'+
      '<div class="info-card"><h3>📎 প্রয়োজনীয় কাগজপত্র</h3>'+listHtml(x.documents)+'</div>'+
      '<div class="info-card"><h3>🔗 অফিসিয়াল সার্কুলার/পোর্টাল</h3><p>'+links+'</p><p>বর্তমান অফিসিয়াল নোটিশের সঙ্গে কোনো অমিল হলে অফিসিয়াল নোটিশই চূড়ান্ত।</p></div>'+
    '</div>'+
    renderBookletRows(name);
}
function renderBookletRows(name){
  const rows=BOOKLET_ROWS.filter(r=>r.p===name);
  if(!rows.length) return '';
  return '<div class="booklet-wrap"><div class="booklet-title">📘 তথ্য কণিকা — পূর্ণ পূর্ববর্তী ভর্তি তথ্য</div><div class="booklet-sub">আপনার দেওয়া “তথ্য কণিকা” থেকে হুবহু কাঠামো ধরে আসন, যোগ্যতা, পরীক্ষার ধরন, নম্বরবণ্টন ও ফল নির্ণয় পদ্ধতি। এগুলো বর্তমান ২০২৬–২৭ অফিসিয়াল সার্কুলারের বিকল্প নয়।</div>'+
    rows.map(r=>'<div class="booklet-row"><h4>'+esc(r.unit)+' <span class="source-badge">'+esc(r.cat)+'</span></h4><div class="booklet-grid">'+
      '<div class="booklet-field"><b>🪑 আসন সংখ্যা</b><span>'+esc(r.seats)+'</span></div>'+
      '<div class="booklet-field"><b>✅ আবেদন যোগ্যতা</b><span>'+esc(r.elig)+'</span></div>'+
      '<div class="booklet-field"><b>📝 পরীক্ষার ধরন</b><span>'+esc(r.exam)+'</span></div>'+
      '<div class="booklet-field"><b>📊 বিষয়ভিত্তিক নম্বর/প্রশ্ন</b><span>'+esc(r.marks)+'</span></div>'+
      '<div class="booklet-field"><b>🏆 ফলাফল নির্ণয়</b><span>'+esc(r.result)+'</span></div>'+
    '</div></div>').join('')+'</div>';
}
uniFind.onclick=renderUniversity;
uniSearch.addEventListener('keydown',e=>{if(e.key==='Enter')renderUniversity()});

const cv=document.getElementById('stars'),cx=cv.getContext('2d');let stars=[];function resize(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);stars=Array.from({length:Math.min(180,innerWidth/5)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.1+.2,a:Math.random()*.7+.15,p:Math.random()*6.28}))}addEventListener('resize',resize);resize();function draw(t){cx.clearRect(0,0,innerWidth,innerHeight);for(const s of stars){cx.globalAlpha=s.a*(.65+.35*Math.sin(t/900+s.p));cx.fillStyle='#fff';cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.28);cx.fill()}requestAnimationFrame(draw)}requestAnimationFrame(draw);
</script></body></html>`;

export default async function handler(req,res){
  const u=new URL(req.url,'https://admissionbydbt.vercel.app');
  if(u.pathname==='/api/events'){
    const data=await sync(u.searchParams.get('refresh')==='1');
    res.statusCode=200;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.setHeader('access-control-allow-origin','*');
    return res.end(JSON.stringify({updatedAt:new Date(data.at).toISOString(),events:data.events,sources:data.sources}));
  }
  if(u.pathname==='/health'){
    res.statusCode=200; res.setHeader('content-type','text/plain'); return res.end('ok');
  }
  res.statusCode=200;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.setHeader('cache-control','no-cache');
  return res.end(html);
}
