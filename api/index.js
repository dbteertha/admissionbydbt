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
<title>Admission by DBT | 2026–27</title>
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
.info-card h3{font-size:13px;margin:0 0 9px;color:#f4f4f2}.info-card p,.info-card li{font-size:12px;color:#aeb2b7;line-height:1.55}
.info-card ul{margin:0;padding-left:18px}.info-card a{color:#f0f0ed;text-decoration:underline;text-underline-offset:3px}
.info-title{font-size:28px;margin:0}.info-name{font-size:20px;font-weight:800;margin:8px 0 2px}.info-status{font-size:11px;color:#9ca1a7}
.eligibility-box{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.eligibility-box input{width:100%;min-width:0}
.eligibility-result{margin-top:10px;font-size:12px;color:#cdd0d4}
.source-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.source-badge{font-size:10px;border:1px solid #2a2e34;border-radius:999px;padding:5px 8px;color:#aeb2b7}
@media(max-width:700px){.info-center{padding:14px}.eligibility-box{grid-template-columns:1fr}.info-title{font-size:23px}}
@media(max-width:700px){.hero{min-height:500px}.section{padding:14px}.day{min-height:78px;padding:5px}.event{font-size:8px;padding:4px}.head h2{font-size:24px}.clock{gap:14px}.passed{font-size:17px}}
</style></head><body><canvas id="stars"></canvas><div class="app"><nav><div class="brand">ADMISSION BY DBT • 26/27</div><div id="syncStatus" class="live">● syncing sources…</div></nav>
<section class="hero"><div class="hero-inner"><div class="kicker">Admission test begins • 30 November 2026</div><div class="days" id="days">00</div><div class="label">DAYS LEFT</div>
<div class="clock"><div><b id="weeks">00W</b><span>WEEKS</span></div><div><b id="hours">00H</b><span>HOURS</span></div><div><b id="mins">00M</b><span>MINUTES</span></div><div><b id="secs">00S</b><span>SECONDS</span></div></div>
<div class="progress"><div class="fill" id="fill"></div></div><div class="pct" id="pct">0%</div><div class="passed"><span id="passed">0 Passed</span><i>|</i><span id="total">0 Total</span></div></div></section>
<section class="section"><div class="head"><div><h2>Admission Calendar</h2><div class="sub">University admission routine — clean names, dates and exam times.</div></div><div class="controls"><input id="search" placeholder="Search university…"><button class="btn" id="refresh">Refresh</button></div></div>
<div class="calendar-head"><button class="btn" id="prev">←</button><div class="month" id="month"></div><button class="btn" id="next">→</button></div><div class="week"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div><div class="grid" id="grid"></div>
<div class="upcoming"><div class="head"><div><h2 style="font-size:22px">Upcoming exams</h2><div class="sub">Tap any calendar item or source link to verify details.</div></div></div><div class="cards" id="cards"></div></div>
<div class="footer">Schedules are aggregated from third-party sources and may change. Always verify critical dates from the official university notice.</div></section>
<section class="info-center" id="infoCenter">
  <div class="head"><div><h2 class="info-title">University Information Center</h2><div class="sub">Search a university to see admission dates, admit-card status, circulars, seats, subjects, eligibility, exam format and verified official resources.</div></div></div>
  <div class="info-search">
    <input id="uniSearch" list="uniList" placeholder="Type university name, e.g. DU, BUET, RUET, BUP…">
    <datalist id="uniList"></datalist>
    <button class="btn" id="uniFind">Find information</button>
  </div>
  <div id="uniResult"><div class="empty">Search for a university to open its admission information dashboard.</div></div>
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
  "Dhaka University": {
    aliases:["DU","University of Dhaka","ঢাকা বিশ্ববিদ্যালয়","ঢাবি"],
    official:"https://admission.eis.du.ac.bd/",
    session:"2026–27",
    dates:["IBA — 5 Dec 2026","Science (A) — 12 Dec 2026","Arts, Law & Social Science (B) — 19 Dec 2026","Fine Arts — 22 Dec 2026","Business (C) — 26 Dec 2026"],
    admit:"Use the official DU admission portal. Admit-card dates should be treated as pending until the 2026–27 notice explicitly publishes them.",
    circular:"Official 2026–27 undergraduate circular/notice should be checked on the DU admission portal.",
    subjects:["Science","Arts, Law & Social Science","Business Studies","Fine Arts","IBA (separate process)"],
    format:"DU commonly uses MCQ + written for major units; exact 2026–27 marks, duration and negative marking must follow the current official circular.",
    seats:"Seat distribution is unit/department specific; show only when the current official circular publishes the final seat table.",
    eligibility:"Current 2026–27 exact GPA/subject thresholds are not hard-coded until verified from the official circular.",
    rule:null,
    sources:["Official DU admission portal","Chorcha","Admission Calendar"]
  },
  "BUET": {
    aliases:["Bangladesh University of Engineering and Technology","বুয়েট"],
    official:"https://ugadmission.buet.ac.bd/",
    session:"2026–27",
    dates:["Admission test — 16 Jan 2027"],
    admit:"Admit-card information will be shown when the official undergraduate admission portal publishes it.",
    circular:"Use BUET's official undergraduate admission portal for the authoritative circular and prospectus.",
    subjects:["Engineering","Architecture","Urban & Regional Planning"],
    format:"Engineering admission format may change by session. The current official circular is authoritative.",
    seats:"Program-wise seats should be taken from the 2026–27 prospectus once officially published.",
    eligibility:"Eligibility checker remains conservative until BUET's 2026–27 official GPA/subject requirements are published.",
    rule:null,
    sources:["Official BUET undergraduate admission portal","Chorcha","Admission Calendar"]
  },
  "RUET": {
    aliases:["Rajshahi University of Engineering and Technology","রুয়েট"],
    official:"https://admission.ruet.ac.bd/",
    session:"2026–27",
    dates:["Admission test — 14 Jan 2027"],
    admit:"Check the official RUET admission portal for admit-card download dates and instructions.",
    circular:"Official RUET admission portal is the authoritative source for the circular.",
    subjects:["Engineering","Architecture","Urban & Regional Planning"],
    format:"Exam format and group structure will be displayed only from the current official notice.",
    seats:"Department-wise seats should be read from RUET's current prospectus/circular.",
    eligibility:"Exact 2026–27 GPA and subject thresholds pending verified official publication.",
    rule:null,
    sources:["Official RUET admission portal","Chorcha"]
  },
  "KUET": {
    aliases:["Khulna University of Engineering and Technology","কুয়েট"],
    official:"https://admission.kuet.ac.bd/",
    session:"2026–27",
    dates:["Admission test — 8 Jan 2027"],
    admit:"Check KUET's official admission portal for admit-card release and download window.",
    circular:"Official KUET admission portal is the authoritative source for circular/prospectus.",
    subjects:["Engineering","Architecture","Urban & Regional Planning"],
    format:"Use the current KUET circular for marks, duration and subject distribution.",
    seats:"Program-wise seats will be shown after the 2026–27 official prospectus is verified.",
    eligibility:"Exact current-session eligibility is not guessed; official circular required.",
    rule:null,
    sources:["Official KUET admission portal","Admission Calendar"]
  },
  "BUP": {
    aliases:["Bangladesh University of Professionals","বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস"],
    official:"https://admission.bup.edu.bd/Admission/Home",
    session:"2026–27",
    dates:["FBS — 1 Jan 2027 (also appears as 9 Jan on Chorcha)","FASS — 2 Jan 2027","FST — 8 Jan 2027","FET — 8 Jan 2027","FMS — 8 Jan 2027","FSSS — 8 Jan 2027","BBA General — 9 Jan 2027"],
    admit:"BUP's official portal hosts admission notices and applicant services. Use it for admit-card instructions.",
    circular:"The official BUP portal currently lists an Admission Notice for session 2026–27.",
    subjects:["FASS","FSSS","FST","FBS","FET","FMS","BBA General"],
    format:"Faculty-specific format applies; verify marks, duration and negative marking from the 2026–27 BUP notice.",
    seats:"Faculty/program seat counts should be taken from the official 2026–27 admission notice.",
    eligibility:"Faculty-specific GPA/subject rules apply. Checker will activate after those rules are extracted from the official notice.",
    rule:null,
    sources:["Official BUP admission portal","Chorcha","Admission Calendar"]
  },
  "University of Rajshahi": {
    aliases:["Rajshahi University","RU","রাবি"],
    official:"https://admission.ru.ac.bd/",
    session:"2026–27",
    dates:["Unit B / Business — 8 Jan 2027","Unit C / Science — 9 Jan 2027","Unit A / Humanities — 16 Jan 2027"],
    admit:"Use the official RU admission portal for the 2026–27 admit-card window when published.",
    circular:"The official RU admission portal is the primary source for notices, guidelines and applicant login.",
    subjects:["Unit A / Humanities","Unit B / Business","Unit C / Science"],
    format:"Unit-specific current-session exam pattern should be taken from the official guideline.",
    seats:"Department/unit seat distribution should be displayed from the current official notice.",
    eligibility:"Current 2026–27 eligibility thresholds pending verified official notice.",
    rule:null,
    sources:["Official RU admission portal","Chorcha","Admission Calendar"]
  },
  "University of Chittagong": {
    aliases:["Chittagong University","CU","চবি"],
    official:"https://admission.cu.ac.bd/",
    session:"2026–27",
    dates:["C / Business — 29 Jan 2027","A / Science — 30 Jan 2027","B1 — 3 Feb 2027","B2 — 4 Feb 2027","B — 5 Feb 2027","D — 6 Feb 2027","D1 — 8 Feb 2027"],
    admit:"The official CU portal provides unit-wise admit-card pages and exam instructions.",
    circular:"Official CU portal includes prospectus, admission notice, application process, eligibility, schedule and fee rules.",
    subjects:["A / Science","B / Arts & Humanities","B1","B2","C / Business","D / Social Science","D1"],
    format:"Unit-specific format should be read from the current CU prospectus when 2026–27 is published.",
    seats:"Seat counts are unit/department specific and should be pulled from the current prospectus.",
    eligibility:"CU publishes a dedicated general eligibility section; exact 2026–27 values should be used once posted.",
    rule:null,
    sources:["Official CU admission portal","Chorcha","Admission Calendar"]
  },
  "Jagannath University": {
    aliases:["JnU","জবি"],
    official:"https://admission.jnu.ac.bd/",
    session:"2026–27",
    dates:["A / Science — 1 Jan 2027","E / Fine Arts — 8 Jan 2027","B / Humanities — 15 Jan 2027","C / Business — 22 Jan 2027","D / Social Science — 23 Jan 2027"],
    admit:"Use the official Jagannath University admission portal for admit-card instructions.",
    circular:"Official JnU admission portal is the authoritative circular source.",
    subjects:["A / Science","B / Humanities","C / Business","D / Social Science","E / Fine Arts"],
    format:"Use the current official circular for unit-wise pattern and marks.",
    seats:"Seat distribution should be taken from the current official prospectus/circular.",
    eligibility:"Exact eligibility pending verified 2026–27 official rules.",
    rule:null,
    sources:["Official JnU portal","Chorcha","Admission Calendar"]
  },
  "SUST": {
    aliases:["Shahjalal University of Science and Technology","শাবিপ্রবি"],
    official:"https://admission.sust.edu.bd/",
    session:"2026–27",
    dates:["Unit A — 26 Jan 2027","Unit B — 27 Jan 2027"],
    admit:"Use SUST's official admission portal for admit-card release.",
    circular:"Official SUST admission portal is the authoritative source.",
    subjects:["A","B"],
    format:"Unit-wise current format should be taken from the official circular.",
    seats:"Seat distribution should be taken from SUST's 2026–27 prospectus.",
    eligibility:"Exact 2026–27 rules pending verified official publication.",
    rule:null,
    sources:["Official SUST portal","Chorcha","Admission Calendar"]
  },
  "Comilla University": {
    aliases:["CoU","কুমিল্লা বিশ্ববিদ্যালয়","কুবি"],
    official:"https://admission.cou.ac.bd/",
    session:"2026–27",
    dates:["A — 5 Feb 2027","B — 6 Feb 2027","C — 7 Feb 2027"],
    admit:"Check the official CoU admission portal/notices for admit-card dates.",
    circular:"Official university notice is authoritative; Chorcha reports application period 15 Nov–10 Dec and exam centers in Cumilla, Chattogram and Rajshahi.",
    subjects:["A / Science","B / Humanities","C / Business"],
    format:"Use current official circular for marks, duration and negative marking.",
    seats:"Seat counts should be taken from the current official prospectus.",
    eligibility:"Exact current-session eligibility should be verified from the official circular.",
    rule:null,
    sources:["Official CoU portal","Chorcha","Admission Calendar"]
  },
  "GST Cluster": {
    aliases:["GST","General Science and Technology Cluster","গুচ্ছ"],
    official:"https://gstadmission.ac.bd/",
    session:"2026–27",
    dates:["B / Humanities — 19 Mar 2027","C / Business — 20 Mar 2027","D / Architecture — 20 Mar 2027","A / Science — 27 Mar 2027"],
    admit:"Use the official GST admission portal for admit-card and center information.",
    circular:"Official GST portal is the authoritative source for participating universities and rules.",
    subjects:["A / Science","B / Humanities","C / Business","D / Architecture"],
    format:"Unit-specific current-session format must follow the official GST circular.",
    seats:"University/subject seats are distributed across participating institutions; current official seat matrix required.",
    eligibility:"Group-specific GPA and subject requirements should be loaded from the current GST circular before making an eligibility decision.",
    rule:null,
    sources:["Official GST portal","Chorcha","Admission Calendar"]
  },
  "Agriculture Cluster": {
    aliases:["Agri","Agricultural Universities Cluster","কৃষি গুচ্ছ"],
    official:"https://acas.edu.bd/",
    session:"2026–27",
    dates:["Admission test — 2 Jan 2027"],
    admit:"Use the official Agriculture Cluster admission system for admit-card availability.",
    circular:"Official cluster portal is the authoritative circular source.",
    subjects:["Agriculture-related undergraduate programs across participating universities"],
    format:"Current official cluster circular controls subject distribution, duration and marking.",
    seats:"Participating-university seat matrix should be read from the current official circular.",
    eligibility:"Exact HSC subject/GPA eligibility must be checked against the current official circular.",
    rule:null,
    sources:["Official Agriculture Cluster portal","Chorcha","Admission Calendar"]
  },
  "MIST": {
    aliases:["Military Institute of Science and Technology"],
    official:"https://admission.mist.ac.bd/",
    session:"2026–27",
    dates:["C Unit — 18 Dec 2026","A & B — 19 Dec 2026"],
    admit:"Use MIST's official admission portal for admit-card and applicant instructions.",
    circular:"Official MIST admission portal/notice is authoritative.",
    subjects:["Engineering and Architecture programs"],
    format:"Unit-wise current format should follow the 2026–27 official notice.",
    seats:"Program-wise seats should be taken from the official prospectus.",
    eligibility:"Exact current-session GPA/subject conditions pending verified official circular.",
    rule:null,
    sources:["Official MIST portal","Chorcha","Admission Calendar"]
  },
  "BUTEX": {
    aliases:["Bangladesh University of Textiles","টেক্সটাইল বিশ্ববিদ্যালয়"],
    official:"https://butex.edu.bd/",
    session:"2026–27",
    dates:["Admission test — 29 Jan 2027"],
    admit:"Check BUTEX official notices for admit-card instructions.",
    circular:"Official BUTEX notice/circular is authoritative.",
    subjects:["Textile Engineering and related undergraduate programs"],
    format:"Current official admission notice should be used for exam pattern.",
    seats:"Department-wise seats should be loaded from the official circular.",
    eligibility:"Exact 2026–27 requirements pending official verification.",
    rule:null,
    sources:["Official BUTEX website","Chorcha","Admission Calendar"]
  },
  "AAUB": {
    aliases:["Aviation and Aerospace University Bangladesh","Aviation and Aerospace University, Bangladesh"],
    official:"https://aaub.edu.bd/",
    session:"2026–27",
    dates:["Admission test — 5 Dec 2026"],
    admit:"Check AAUB's official admission notice for admit-card instructions.",
    circular:"Official AAUB notice is authoritative.",
    subjects:["Aviation and aerospace-related undergraduate programs"],
    format:"Use the 2026–27 official admission notice for the final exam pattern.",
    seats:"Program-wise seat counts should be taken from the official notice.",
    eligibility:"Exact current-session eligibility pending official verification.",
    rule:null,
    sources:["Official AAUB website","Chorcha","Admission Calendar"]
  },
  "Medical & Dental": {
    aliases:["Medical","Dental","MBBS","BDS"],
    official:"https://dgme.gov.bd/",
    session:"2026–27",
    dates:["Admission test — 4 Dec 2026"],
    admit:"Admit-card dates and download instructions should be verified from DGME/DGHS official admission notices.",
    circular:"Use official DGME/DGHS notices for MBBS/BDS admission.",
    subjects:["MBBS","BDS"],
    format:"Medical admission test format and marks are governed by the current official circular.",
    seats:"Government/private seat figures should be taken from the current official circular and college list.",
    eligibility:"Exact 2026–27 GPA, biology and passing-year rules must be taken from the official circular.",
    rule:null,
    sources:["DGME official resources","Admission Calendar"]
  }
};

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
function renderUniversity(){
  const found=matchUniversity(uniSearch.value);
  if(!found){uniResult.innerHTML='<div class="empty">No exact information profile found yet. Try DU, BUET, RUET, KUET, BUP, Rajshahi University, Chittagong University, Jagannath University, SUST, GST, Agriculture Cluster, MIST, BUTEX, AAUB or Medical.</div>';return;}
  const [name,x]=found;
  const eventMatches=all.filter(e=>{
    const s=(e.title||'').toLowerCase();
    return s.includes(name.toLowerCase())||x.aliases.some(a=>a.length>2&&s.includes(a.toLowerCase()));
  });
  const liveDates=eventMatches.length?eventMatches.map(e=>new Date(e.date).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium'})+' — '+e.title):x.dates;
  const official=x.official?'<a href="'+x.official+'" target="_blank" rel="noopener">Open official admission source ↗</a>':'Not available';
  uniResult.innerHTML=
    '<div class="info-name">'+esc(name)+'</div><div class="info-status">Session '+esc(x.session)+' • Official-first information profile</div>'+
    '<div class="info-grid">'+
      '<div class="info-card"><h3>📅 Important dates</h3><ul>'+liveDates.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></div>'+
      '<div class="info-card"><h3>🎫 Admit card</h3><p>'+esc(x.admit)+'</p></div>'+
      '<div class="info-card"><h3>📄 Circular & official portal</h3><p>'+esc(x.circular)+'</p><p>'+official+'</p></div>'+
      '<div class="info-card"><h3>🪑 Seats</h3><p>'+esc(x.seats)+'</p></div>'+
      '<div class="info-card"><h3>📚 Units / subjects</h3><ul>'+x.subjects.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></div>'+
      '<div class="info-card"><h3>📝 Exam format</h3><p>'+esc(x.format)+'</p></div>'+
      '<div class="info-card"><h3>✅ Eligibility</h3><p>'+esc(x.eligibility)+'</p><div class="eligibility-box"><input id="sscGpa" type="number" min="0" max="5" step=".01" placeholder="SSC GPA"><input id="hscGpa" type="number" min="0" max="5" step=".01" placeholder="HSC GPA"><button class="btn" id="checkEligibility">Check</button></div><div class="eligibility-result" id="eligibilityResult">Checker only gives a result when current official rules are verified; otherwise it will not guess.</div></div>'+
      '<div class="info-card"><h3>🔎 Source coverage</h3><div class="source-badges">'+x.sources.map(v=>'<span class="source-badge">'+esc(v)+'</span>').join('')+'</div><p>Official notices override third-party calendars if they differ.</p></div>'+
    '</div>';
  document.getElementById('checkEligibility').onclick=()=>{
    const a=parseFloat(document.getElementById('sscGpa').value),b=parseFloat(document.getElementById('hscGpa').value),out=document.getElementById('eligibilityResult');
    if(!Number.isFinite(a)||!Number.isFinite(b)){out.textContent='Enter both SSC and HSC GPA.';return;}
    if(!x.rule){out.textContent='No verified 2026–27 numeric rule is loaded for this institution yet, so the checker will not guess. Use the official circular above.';return;}
    out.textContent=x.rule(a,b)?'Eligible under the currently loaded verified GPA rule.':'Not eligible under the currently loaded verified GPA rule.';
  };
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
