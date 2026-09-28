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
.info-card h3{font-size:13px;margin:0 0 9px;color:#f4f4f2}.info-card p,.info-card li{font-size:12px;color:#aeb2b7;line-height:1.58}.info-card li+li{margin-top:5px}
.info-card ul{margin:0;padding-left:18px}.info-card a{color:#f0f0ed;text-decoration:underline;text-underline-offset:3px}
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
    status:"2026–27 official exam schedule and minimum eligibility are already announced by the University of Dhaka.",
    basis:"Current 2026–27 official DU announcement + admission calendars",
    application:"Chorcha reports undergraduate application opening from 11 Nov 2026. Closing date, fee and admit-card window should be taken from the official DU admission portal once the application circular is published.",
    admit:"2026–27 admit-card download dates are not yet visible in the verified official sources used here.",
    fees:"2026–27 application fee is not yet verified in the current official notice set.",
    centers:"Exam centre details will follow the unit-wise official admit card/circular.",
    seats:"2026–27 unit/department seat matrix is not yet included in the current verified source set. Use the official DU portal when the final seat table is released.",
    programs:["Science Unit","Arts, Law & Social Science Unit","Business Studies Unit","Fine Arts Unit","IBA Unit"],
    eligibility:[
      "Passing years: SSC/equivalent from 2021–2024 and HSC/equivalent in 2026.",
      "Science Unit — Science-group applicants: SSC+HSC GPA total at least 8.0 and at least 3.5 in each.",
      "Science Unit — Humanities/Business applicants: total at least 7.5 and at least 3.0 in each.",
      "Arts, Law & Social Science Unit — Humanities/Business: total at least 7.5 and at least 3.0 in each; Science: total at least 8.0 and at least 3.5 in each.",
      "Business Studies Unit — Business/Humanities: total at least 7.5 and at least 3.0 in each; Science: total at least 8.0 and at least 3.5 in each.",
      "Fine Arts Unit — total at least 6.5 and at least 3.0 in each."
    ],
    format:[
      "For the major non-IBA units, DU announced a 90-minute test: 45 minutes MCQ + 45 minutes written.",
      "Admission test contributes 100 marks; SSC/HSC results contribute another 20 marks, for 120 total assessment marks.",
      "Fine Arts includes General Knowledge and Drawing. IBA follows its own admission process."
    ],
    documents:["SSC/HSC academic information","Recent photograph/signature as required by portal","Quota documents if applicable","Printed admit card when released"],
    previous:"The 2025–26 DU minimum GPA thresholds were the same as the 2026–27 thresholds now announced.",
    notes:["Classes for the 2026–27 undergraduate intake are planned to start 28 Mar 2027.","English-medium Science Unit candidates will receive a curriculum-appropriate question paper."],
    checks:[
      {label:"Science Unit — Science group",ssc:3.5,hsc:3.5,total:8.0},
      {label:"Science Unit — Humanities/Business",ssc:3.0,hsc:3.0,total:7.5},
      {label:"Arts Unit — Humanities/Business",ssc:3.0,hsc:3.0,total:7.5},
      {label:"Arts Unit — Science",ssc:3.5,hsc:3.5,total:8.0},
      {label:"Business Unit — Business/Humanities",ssc:3.0,hsc:3.0,total:7.5},
      {label:"Business Unit — Science",ssc:3.5,hsc:3.5,total:8.0},
      {label:"Fine Arts Unit",ssc:3.0,hsc:3.0,total:6.5}
    ],
    links:[
      ["Official admission portal","https://admission.eis.du.ac.bd/"],
      ["2026–27 official DU announcement","https://du.edu.bd/public/du_post_details/post/28137"]
    ]
  },

  "BUET": {
    aliases:["Bangladesh University of Engineering and Technology","বুয়েট"],
    official:"https://ugadmission.buet.ac.bd/",
    status:"2026–27 admission test date is announced for 16 Jan 2027; detailed current circular/prospectus should be treated as pending until visible on BUET's admission portal.",
    basis:"2026–27 calendar date + official BUET admission portal; prior-cycle reference when current details are absent",
    application:"2026–27 application window has not yet been verified in the official source set.",
    admit:"Admit-card dates will be taken from the official BUET undergraduate portal after the circular opens.",
    fees:"Not yet verified for 2026–27.",
    centers:"Official seat plan/admit card will determine the venue.",
    seats:"Department-wise seat counts are not hard-coded until the current BUET prospectus is verified.",
    programs:["Engineering faculties","Architecture","Urban & Regional Planning"],
    eligibility:[
      "Current 2026–27 detailed subject/GPA thresholds are not yet verified here.",
      "BUET admission is highly competitive and current-session requirements should be read from the official prospectus rather than inferred from older cycles."
    ],
    format:["2026–27 exact written-test format and marks distribution are pending current prospectus verification."],
    documents:["Academic information","Photograph/signature","Required equivalence/quota documents if applicable","Admit card after publication"],
    previous:"BUET's 2025–26 Level-1 students appear in the university's 2026 undergraduate academic calendar, but the current admission prospectus details should still be verified separately.",
    notes:["Do not use unofficial GPA/marks tables as final rules if the 2026–27 prospectus differs."],
    links:[["Official undergraduate admission portal","https://ugadmission.buet.ac.bd/"]]
  },

  "RUET": {
    aliases:["Rajshahi University of Engineering and Technology","রুয়েট"],
    official:"https://admission.ruet.ac.bd/",
    status:"2026–27 exam date is listed as 14 Jan 2027 in the admission calendars; the current official prospectus is not yet fully visible in the verified source set.",
    basis:"2026–27 calendar + official RUET 2025–26 prospectus/schedule fallback",
    application:"Previous cycle (2025–26): application 2 Dec 2025 10:00 AM to 13 Dec 2025 5:00 PM; fee payment deadline 15 Dec 2025 noon.",
    admit:"Previous cycle: admit card available from 10 Jan 2026 5:00 PM. For 2026–27, wait for the new RUET notice.",
    fees:"Current 2026–27 fee pending official circular.",
    centers:"Current centre/seat plan pending official 2026–27 notice.",
    seats:"Engineering/URP and Architecture seat allocation is handled separately; use the new prospectus for final department counts.",
    programs:["Engineering & URP — Group KA","Architecture — Group KHA"],
    eligibility:["Use the 2026–27 prospectus once published; previous-cycle rules are available in the official RUET prospectus."],
    format:[
      "2025–26 reference: Group KA — 400 marks, 2 hours 30 minutes.",
      "Higher Mathematics 20 questions/120 marks; Physics 20/120; Chemistry 20/120; English 20/40.",
      "Architecture Group KHA adds 200 marks: Free-hand Drawing 100 + Visual-Spatial Intelligence 100, 1 hour."
    ],
    documents:["SSC/HSC information","Photo/signature","Quota certificates where applicable","Admit card"],
    previous:"2025–26 test was scheduled for 22 Jan 2026; eligible list 3 Jan; seat plan 6 Jan; admit card 10 Jan; result planned 6 Feb.",
    notes:["RUET officially maintains Bangla and English prospectuses and publishes eligible lists, seat plans, admit cards and results through the admission portal."],
    links:[
      ["RUET admission portal","https://admission.ruet.ac.bd/"],
      ["2025–26 official circular","https://ruet.ac.bd/notice/undergraduate-admission-circular-for-ruet-2025-2026"],
      ["2025–26 English prospectus","https://admission.ruet.ac.bd/notices/prospectus/en-prospectus-2025-26.pdf"]
    ]
  },

  "KUET": {
    aliases:["Khulna University of Engineering and Technology","কুয়েট"],
    official:"https://admission.kuet.ac.bd/",
    status:"2026–27 official KUET admission portal is live. Test: 8 Jan 2027; centres: KUET, DU and RUET; medium shown as MCQ.",
    basis:"Current 2026–27 KUET official portal + 2025–26 official prospectus fallback",
    application:"Current detailed opening/closing dates are not yet shown in the verified portal snapshot.",
    admit:"Current admit-card window not yet visible in the verified source set.",
    fees:"Current 2026–27 fee pending official circular details.",
    centers:"KUET, University of Dhaka and RUET — officially shown for 2026–27.",
    seats:"Use the current prospectus for final program seat counts.",
    programs:["Engineering programs","Architecture","Urban & Regional Planning"],
    eligibility:[
      "2025–26 reference: SSC/equivalent GPA at least 4.00.",
      "HSC/equivalent Mathematics, Physics and Chemistry each required at least GPA 4.00.",
      "The four highest HSC subject GPAs were required to total at least 18.00.",
      "Biomedical Engineering had additional Biology-related requirements in the previous prospectus."
    ],
    format:["2026–27 official portal currently identifies the admission test medium as MCQ; full marks distribution is pending the current circular."],
    documents:["Academic information","Photo/signature","Equivalent certificates where needed","Admit card"],
    previous:"The 2025–26 KUET prospectus is the fallback source for eligibility until the full 2026–27 circular is published.",
    notes:["Current portal has an 'Admission Test Circular' notice entry; that notice should override the previous-cycle eligibility when details differ."],
    links:[
      ["2026–27 official KUET admission portal","https://admission.kuet.ac.bd/"],
      ["2025–26 official prospectus","https://admission.kuet.ac.bd/adm/fNotice/2025-2026%20Prospectus-Ban.pdf"]
    ]
  },

  "CUET": {
    aliases:["Chittagong University of Engineering and Technology","চুয়েট"],
    official:"https://admission.cuet.ac.bd/",
    status:"2026–27 calendar date: 23 Jan 2027. Detailed current official admission circular is pending verification in the source set.",
    basis:"2026–27 admission calendar + official CUET portal reference",
    application:"Not yet verified for 2026–27.",
    admit:"Not yet verified for 2026–27.",
    fees:"Not yet verified for 2026–27.",
    centers:"Current official seat plan pending.",
    seats:"Final department-wise seat counts must follow the current CUET prospectus.",
    programs:["Engineering","Architecture","Urban & Regional Planning"],
    eligibility:["Current 2026–27 GPA/subject thresholds are pending the official circular."],
    format:["Current exam type/marks distribution pending current circular verification."],
    documents:["Academic information","Photo/signature","Quota/equivalence documents where applicable","Admit card"],
    previous:"Previous-cycle details are intentionally not converted into numeric rules until the official CUET prospectus is directly verified.",
    notes:["CUET is shown separately from RUET/KUET in the 2026–27 admission calendar."],
    links:[["Official CUET admission portal","https://admission.cuet.ac.bd/"]]
  },

  "MIST": {
    aliases:["Military Institute of Science and Technology"],
    official:"https://admission.mist.ac.bd/",
    status:"MIST official undergraduate information provides detailed Unit A/B/C eligibility, marks and fees; 2026–27 calendar dates are 18–19 Dec 2026.",
    basis:"Official MIST undergraduate information + 2026–27 admission calendar",
    application:"Application is through the MIST admission portal; applicants create an account after eligibility check and pay online.",
    admit:"Eligible applicants can download/print application copy and admit card after successful submission/payment according to portal timing.",
    fees:"Official undergraduate info: Tk 1,200 Engineering; Tk 1,400 Engineering + Architecture; Tk 1,000 Unit C (Science).",
    centers:"Current 2026–27 centre list should follow the admit card/official circular.",
    seats:"Program-wise seats should be taken from the current MIST circular.",
    programs:["Unit A — Engineering & Architecture","Unit B — Architecture drawing","Unit C — B.Sc. Mathematics & Data Science / B.Sc. Chemistry"],
    eligibility:[
      "Unit C official requirement: SSC and HSC/equivalent GPA at least 3.50 in each.",
      "GCE Unit C: minimum B in five O-Level subjects including Math, Physics, Chemistry; minimum B in Math, Physics, Chemistry at A-Level.",
      "Biomedical Engineering applicants need Biology with minimum A- at HSC or equivalent C at A-Level."
    ],
    format:[
      "Unit A: 200 marks, 3 hours — Mathematics 80, Physics 60, Chemistry 40, English 20.",
      "Unit B: Freehand Drawing & Visual-Spatial Intelligence 200 marks, 2 hours.",
      "Minimum qualifying mark: 40% in Unit A and Unit B separately.",
      "Unit C: MCQ 80 marks, 60 minutes — Mathematics 25, Chemistry 25, Physics 20, English 10; minimum 32.",
      "Engineering/Architecture merit reference: written test 60%, HSC Math/Physics/Chemistry 20%, SSC Math/Physics/Chemistry 20%; last-year candidates receive 5% test-mark deduction."
    ],
    documents:["SSC/HSC or equivalent details","Photo/signature","GCE transcript/certificate verification where applicable","Admit card"],
    previous:"MIST's official portal currently shows the prior undergraduate cycle application deadline as 19 Jan 2026; 2026–27 exact application window should follow the new circular.",
    notes:["Questions are available in both Bangla and English; applicants may answer in either language."],
    checks:[{label:"Unit C basic GPA gate",ssc:3.5,hsc:3.5,total:7.0}],
    links:[
      ["Official MIST admission portal","https://admission.mist.ac.bd/"],
      ["Official undergraduate information","https://research.mist.ac.bd/study-with-us/undergraduate"]
    ]
  },

  "BUP": {
    aliases:["Bangladesh University of Professionals","বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস"],
    official:"https://admission.bup.edu.bd/Admission/Home",
    status:"BUP has already posted an official 'Admission Notice (Session: 2026–2027)' dated 1 Sep 2026.",
    basis:"Current BUP 2026–27 official notice availability + calendar dates; previous undergraduate notice for format fallback",
    application:"Use the current BUP notice for the exact application window. The official portal is already publishing the 2026–27 notice.",
    admit:"Current notice/portal will control admit-card download. The site should not infer the window from older cycles.",
    fees:"Previous undergraduate reference: Tk 1,100 application processing fee per faculty. Confirm against the 2026–27 notice.",
    centers:"Current notice/admit card will specify centre details.",
    seats:"Faculty/program seat numbers are current-notice dependent; do not assume prior-cycle counts.",
    programs:["FASS","FSSS","FST","FBS","FET","FMS","BBA General"],
    eligibility:["Faculty-specific GPA and subject requirements apply; use the 2026–27 notice for each faculty/program."],
    format:[
      "Previous undergraduate reference: MCQ admission test; 0.50 mark deducted for each wrong answer.",
      "Previous reference required at least 40% in English to qualify.",
      "Previous assessment reference (except MBA): admission test 55%, HSC/equivalent 25%, SSC/equivalent 20%.",
      "Calculators were not allowed except in FST, where approved models were printed on the admit card."
    ],
    documents:["SSC/HSC information","Photo/signature","Quota/supporting documents where applicable","Equivalence certificate for foreign qualifications","Admit card"],
    previous:"2024–25 undergraduate admission notice is used only for format/fee reference where the 2026–27 PDF details have not been parsed.",
    notes:["BUP source calendars show multiple faculty exams on 1, 2, 8 and 9 Jan 2027; FBS appears on both 1 and 9 Jan across sources, so the official notice must resolve that inconsistency."],
    links:[
      ["Official BUP admission portal","https://admission.bup.edu.bd/Admission/Home"],
      ["All official BUP notices","https://admission.bup.edu.bd/Admission/NoticeAll"]
    ]
  },

  "University of Rajshahi": {
    aliases:["Rajshahi University","RU","রাবি"],
    official:"https://admission.ru.ac.bd/",
    status:"2026–27 calendar dates are announced/tentative in the source set; official 2025–26 portal remains a strong reference for workflow and timing.",
    basis:"2026–27 calendar + official RU 2025–26 portal fallback",
    application:"Chorcha reports a tentative 2026–27 application period of 12–27 Nov 2026. Previous official cycle: 20 Nov–8 Dec 2025.",
    admit:"Previous official cycle: 17–22 Dec 2025. Current 2026–27 window pending official RU notice.",
    fees:"Current fee not yet verified.",
    centers:"Current seat plan/admit card pending.",
    seats:"RU published an official 'Departments/Institutes Seats' notice on 17 Dec 2025 for the previous cycle; use the equivalent 2026–27 notice when released.",
    programs:["Unit A — Humanities","Unit B — Business","Unit C — Science"],
    eligibility:["Unit/department-specific conditions are published by RU in the official admission portal; current 2026–27 conditions are pending."],
    format:["Current 2026–27 exact marks distribution is pending official notice."],
    documents:["Academic information","Photo/selfie per RU instructions","Quota documents where applicable","Admit card"],
    previous:"2025–26 official dates: online application 20 Nov–8 Dec 2025; admit card 17–22 Dec; Unit C test 16 Jan, Unit A 17 Jan, Unit B 24 Jan 2026.",
    notes:["RU portal provides separate Application Guideline, Payment Instructions, Photo/Selfie Instructions, helpline, FAQ and complaint channels."],
    links:[
      ["Official RU admission portal","https://admission.ru.ac.bd/"],
      ["Official RU notices","https://admission.ru.ac.bd/student/notices"]
    ]
  },

  "Jagannath University": {
    aliases:["JnU","জবি"],
    official:"https://admission.jnu.ac.bd/",
    status:"2026–27 unit exam dates are in the calendars; detailed current application/admit-card windows are pending official publication.",
    basis:"2026–27 calendar + official JnU 2025–26 prospectus fallback",
    application:"Previous official cycle: 20 Nov–5 Dec 2025.",
    admit:"Previous cycle unit-wise windows: A 10–21 Dec; C 10–22 Dec; D 25 Dec–4 Jan; E 7–11 Dec; B 15–25 Jan. Use only as planning reference.",
    fees:"Current 2026–27 fee pending.",
    centers:"Current seat plan/admit card pending.",
    seats:"Unit/department seat counts should follow the 2026–27 admission guideline when published.",
    programs:["A — Science","B — Humanities","C — Business","D — Social Science","E — Fine Arts"],
    eligibility:["Current unit-wise 2026–27 eligibility is pending the official guideline."],
    format:["Current unit-wise format/marks pending the official circular."],
    documents:["Academic information","Photo/signature","Quota/equivalence documents if applicable","Admit card"],
    previous:"Official 2025–26 prospectus page contains application dates, unit-specific admit-card windows and exam dates; it is used only when the current circular is absent.",
    notes:["The current calendar places JnU A on 1 Jan, E on 8 Jan, B on 15 Jan, C on 22 Jan and D on 23 Jan 2027."],
    links:[
      ["Official JnU admission portal","https://admission.jnu.ac.bd/"],
      ["2025–26 official prospectus page","https://admission.jnu.ac.bd/preliminary/prospectus/e714b56bd5992f4435b9adc23ac3832ef17073af.jsp"]
    ]
  },

  "Khulna University": {
    aliases:["KU","খুলনা বিশ্ববিদ্যালয়","খুবি"],
    official:"https://apply.ku.ac.bd/",
    status:"2026–27 A/B/C/D unit exam dates are in the admission calendars; detailed current circulars are still being assembled.",
    basis:"2026–27 calendar + official Khulna University 2025–26 unit prospectuses",
    application:"Current 2026–27 application window pending official unit notices.",
    admit:"Current admit-card window pending official notices.",
    fees:"Current fee pending.",
    centers:"2025–26 D Unit was held in Dhaka and Khulna; 2026–27 centres should follow the new unit circulars.",
    seats:"2025–26 D Unit: 88 total seats including reserved/BKSP quota; A Unit covered 8 disciplines. Current 2026–27 seat table may change.",
    programs:["A — Science/Engineering/Technology","B — Life Science","C — Humanities","D — Business"],
    eligibility:[
      "2025–26 D Unit: applicants from Science, Business or Humanities could apply.",
      "D Unit required at least GPA 3.50 separately in SSC and HSC/equivalent and HSC English grade point at least 3.00.",
      "GCE D Unit reference: at least B in three O-Level subjects and two A-Level subjects."
    ],
    format:[
      "2025–26 D Unit reference: 100 marks total.",
      "MCQ: English Language & Grammar 20; Mathematics & Analytical Ability 30; General/Business Knowledge 10.",
      "Written: English Composition 40."
    ],
    documents:["Academic information","Photo/signature","Quota supporting documents if applicable","Admit card"],
    previous:"Current details fall back to the official 2025–26 unit PDFs where the 2026–27 circular is not yet available.",
    notes:["Current calendar: D and C on 17 Dec 2026; A and B on 18 Dec 2026."],
    checks:[{label:"D Unit 2025–26 basic GPA reference",ssc:3.5,hsc:3.5,total:7.0}],
    links:[
      ["Khulna University application portal","https://apply.ku.ac.bd/"],
      ["2025–26 A Unit prospectus","https://apply.ku.ac.bd/images/prospectus/A-Unit.pdf"],
      ["2025–26 D Unit prospectus","https://apply.ku.ac.bd/images/prospectus/D-Unit.pdf"]
    ]
  },

  "SUST": {
    aliases:["Shahjalal University of Science and Technology","শাবিপ্রবি"],
    official:"https://admission.sust.edu.bd/",
    status:"2026–27 calendar dates: Unit A 26 Jan 2027; Unit B 27 Jan 2027. Current detailed circular pending.",
    basis:"2026–27 calendar + official SUST 2025–26 admission/department eligibility information",
    application:"Current 2026–27 application window pending.",
    admit:"Current admit-card window pending.",
    fees:"Current application fee pending.",
    centers:"Current 2026–27 centre list pending official notice.",
    seats:"Department-level examples from official SUST pages: Mechanical Engineering 35 seats; Forestry & Environmental Science 55 seats. Use current prospectus for full seat matrix.",
    programs:["Unit A","Unit B","Architecture","CSE","EEE","IPE","MEE","SWE","Life Sciences","Social Sciences","Business and other departments"],
    eligibility:[
      "Official department eligibility reference: relevant HSC-level prerequisite subjects generally require minimum GPA 3.0.",
      "Examples: CSE/EEE/IPE/MEE/PHY/SWE require Physics and Mathematics; Architecture requires Physics and Mathematics.",
      "BMB/GEB require Biology, Chemistry and Mathematics; MAT/STA require Mathematics."
    ],
    format:["Current 2026–27 unit marks distribution pending official circular."],
    documents:["SSC/HSC information","Photo/signature","Quota/equivalence documents if applicable","Admit card"],
    previous:"Official SUST portal is still labeled 2025–26 in the verified source set; it supplies department-level eligibility references until 2026–27 details are published.",
    notes:["Department eligibility can be stricter than general unit eligibility, so final subject choice must check department prerequisites."],
    links:[
      ["Official SUST admission portal","https://admission.sust.edu.bd/"],
      ["SUST official admission reference","https://www.sust.edu/university-forms-and-downloads"]
    ]
  },

  "University of Chittagong": {
    aliases:["Chittagong University","CU","চবি"],
    official:"https://admission.cu.ac.bd/",
    status:"2026–27 unit dates are announced in the calendars; detailed prospectus/eligibility should be taken from the current CU admission portal.",
    basis:"2026–27 calendar + official CU admission portal",
    application:"Current window pending verified official circular.",
    admit:"Current unit-wise admit-card windows pending.",
    fees:"Current fee pending.",
    centers:"Current seat plan/admit card pending.",
    seats:"Unit/department seat matrix pending current prospectus.",
    programs:["A — Science","B — Arts & Humanities","B1","B2","C — Business","D — Social Science","D1"],
    eligibility:["Current 2026–27 general and department-specific eligibility should follow the CU prospectus."],
    format:["Unit-specific marks distribution and negative-marking policy pending current prospectus verification."],
    documents:["Academic information","Photo/signature","Quota documents if applicable","Admit card"],
    previous:"The official CU portal typically provides prospectus, eligibility, application process, schedule and fee rules; use last-cycle documents only until the new prospectus appears.",
    notes:["Current calendar dates: C 29 Jan; A 30 Jan; B1 3 Feb; B2 4 Feb; B 5 Feb; D 6 Feb; D1 8 Feb 2027."],
    links:[["Official CU admission portal","https://admission.cu.ac.bd/"]]
  },

  "Comilla University": {
    aliases:["CoU","কুমিল্লা বিশ্ববিদ্যালয়","কুবি"],
    official:"https://www.cou.ac.bd/admission",
    status:"2026–27 application and exam schedule are already published in the admission calendars.",
    basis:"Current 2026–27 Chorcha/calendar information + official CoU 2025–26 admission archive",
    application:"Current 2026–27: 15 Nov–10 Dec 2026 (Chorcha).",
    admit:"Current admit-card window not yet verified in the official source set.",
    fees:"Current application fee pending official circular.",
    centers:"Current calendar reports exam centres in Cumilla, Chattogram and Rajshahi.",
    seats:"Unit/department seat matrix should follow the 2026–27 official circular.",
    programs:["A — Science","B — Humanities","C — Business"],
    eligibility:["Current 2026–27 GPA/unit conditions pending official circular."],
    format:["Current unit-wise marks distribution pending official circular."],
    documents:["Academic information","Photo/signature","Quota/equivalence documents if applicable","Admit card"],
    previous:"The official CoU site maintains a 2025–26 undergraduate admission archive with unit results and merit notices; use it only as previous-cycle reference.",
    notes:["Current exam dates: A 5 Feb 11:00 AM; B 6 Feb (sources differ on time); C 7 Feb (sources differ on time)."],
    links:[
      ["Official CoU admission archive","https://www.cou.ac.bd/admission"],
      ["Official undergraduate program page","https://www.cou.ac.bd/program-category/undergraduate-program"]
    ]
  },

  "BUP": null,

  "BUTEX": {
    aliases:["Bangladesh University of Textiles","বুটেক্স","Textile University"],
    official:"https://newsite.butex.edu.bd/admission_new/undergraduate-admission",
    status:"2026–27 calendar date: 29 Jan 2027. Official undergraduate page currently provides detailed 2025–26 admission reference.",
    basis:"2026–27 calendar + official BUTEX 2025–26 undergraduate admission page",
    application:"Current 2026–27 application window pending official circular.",
    admit:"Current admit-card date pending.",
    fees:"Current application fee pending.",
    centers:"Current seat plan pending.",
    seats:"Official previous-cycle reference: about 9,000 candidates were allowed to sit against 640 seats.",
    programs:["B.Sc. in Textile Engineering programs across BUTEX departments"],
    eligibility:[
      "2025–26 reference: SSC/equivalent GPA at least 4.00.",
      "HSC/equivalent GPA at least 4.00.",
      "HSC Mathematics + Physics + Chemistry + English grade points total at least 17.50, with each subject at least 3.50.",
      "Mathematics must be present in HSC at least as optional subject.",
      "Previous official FAQ says only current-year HSC candidates could apply; second-timers were not eligible."
    ],
    format:[
      "2025–26 reference: written admission test, 200 marks.",
      "Mathematics 60, Physics 60, Chemistry 60, English 20.",
      "Selection based on admission-test score."
    ],
    documents:["Academic information","Photo/signature","Admit card","Equivalence documents where applicable"],
    previous:"The official BUTEX page explicitly labels its detailed circular/FAQ as 2025–26; these figures are used only until the 2026–27 circular appears.",
    notes:["Current calendar sources differ on whether the 29 Jan 2027 exam starts at 10:00 or 11:00; official notice should decide."],
    checks:[{label:"2025–26 basic SSC/HSC GPA reference",ssc:4.0,hsc:4.0,total:8.0}],
    links:[["Official BUTEX undergraduate admission page","https://newsite.butex.edu.bd/admission_new/undergraduate-admission"]]
  },

  "AAUB": {
    aliases:["Aviation and Aerospace University Bangladesh","Aviation and Aerospace University, Bangladesh","এএউবি"],
    official:"https://aaub.edu.bd/",
    status:"2026–27 admission test date is 5 Dec 2026 in the calendars; detailed current notice should be checked on the university site.",
    basis:"2026–27 calendar + official AAUB 2025–26 admission guideline fallback",
    application:"Current 2026–27 window pending detailed official notice.",
    admit:"Current admit-card window pending.",
    fees:"Current application fee pending.",
    centers:"Current exam centre details should follow the 2026–27 AAUB notice.",
    seats:"Current program-wise seat counts pending official notice.",
    programs:["B.Sc. Aerospace Engineering","B.Sc. Avionics Engineering","B.Sc. Aircraft Maintenance Engineering (Aerospace)","B.Sc. Aircraft Maintenance Engineering (Avionics)"],
    eligibility:["Use current 2026–27 official admission instruction when published; previous-cycle official guideline is linked for reference."],
    format:["Current exam marks distribution pending the 2026–27 notice."],
    documents:["Academic information","Photo/signature","Admit card","Equivalent certificates if applicable"],
    previous:"AAUB's official 2025–26 guideline confirms four 4-year undergraduate programs in Aerospace/Avionics/Aircraft Maintenance Engineering.",
    notes:["Do not confuse AAUB undergraduate programs with its postgraduate aviation/space programs."],
    links:[
      ["Official AAUB website","https://aaub.edu.bd/"],
      ["2025–26 official admission guideline PDF","https://aaub.edu.bd/public/ckfinder/userfiles/files/Admission-Instruction-2025-26%281%29.pdf"]
    ]
  },

  "GST Cluster": {
    aliases:["GST","General Science and Technology Cluster","গুচ্ছ","GST Admission"],
    official:"https://gstadmission.ac.bd/",
    status:"2026–27 GST dates are announced: B 19 Mar; C & D 20 Mar; A 27 Mar 2027.",
    basis:"Current 2026–27 calendars + official GST portal",
    application:"Current 2026–27 application window pending official circular.",
    admit:"Current admit-card/centre window pending official portal update.",
    fees:"Current application fee pending official circular.",
    centers:"Participating university/centre list pending current official notice.",
    seats:"Seats are distributed across participating GST universities and subjects; use the current official seat matrix when published.",
    programs:["A — Science","B — Humanities","C — Business","D — Architecture (where separately applied)"],
    eligibility:["Group-specific GPA and HSC subject requirements are current-circular dependent; do not infer from prior GST cycles."],
    format:["Current unit marks distribution, duration and negative-marking policy pending current circular."],
    documents:["Academic information","Photo/signature","Quota/equivalence documents if applicable","Admit card"],
    previous:"Previous-cycle GST materials may help understand the workflow, but the participating-university list and eligibility can change by session.",
    notes:["The calendars agree on GST dates but may differ by one hour on unit start times; official notice should control final time."],
    links:[["Official GST admission portal","https://gstadmission.ac.bd/"]]
  },

  "Agriculture Cluster": {
    aliases:["Agri","Agricultural Universities Cluster","কৃষি গুচ্ছ","ACAS"],
    official:"https://acas.edu.bd/",
    status:"2026–27 Agriculture Cluster test is scheduled for 2 Jan 2027 in the admission calendars. Sher-e-Bangla Agricultural University is reported as lead coordinator.",
    basis:"2026–27 calendar + official ACAS 2025–26 notices/seat plan fallback",
    application:"Current 2026–27 application window pending official ACAS circular.",
    admit:"Current admit-card window pending.",
    fees:"Current application fee pending.",
    centers:"Current centre list pending. Previous official 2025–26 seat plan used many centres/sub-centres nationwide.",
    seats:"Previous cycle officially covered 9 public universities offering agriculture-related degrees; current participating institutions/seat matrix must be confirmed from the 2026–27 guideline.",
    programs:["Agriculture","Veterinary/Animal Science","Fisheries","Agricultural Engineering","Forestry/Environment and other agriculture-related programs across participating universities"],
    eligibility:["Current HSC science-subject/GPA thresholds pending the 2026–27 ACAS guideline."],
    format:["Current 2026–27 exam marks distribution pending the new ACAS circular."],
    documents:["Academic information","Photo/signature","Admit card","Quota/equivalence documents if applicable"],
    previous:"Official ACAS notice archive contains the 2025–26 admission guideline, revised circular, seat plan, results, migration and university/degree allocation notices.",
    notes:["The prior cycle used a cluster-wide merit/choice process across nine public universities."],
    links:[
      ["Official Agriculture Cluster portal","https://acas.edu.bd/"],
      ["Official ACAS notices","https://acas.edu.bd/notice"]
    ]
  },

  "Medical & Dental": {
    aliases:["Medical","Dental","MBBS","BDS","মেডিকেল","ডেন্টাল"],
    official:"https://dgme.gov.bd/",
    status:"2026–27 admission calendar lists the combined Medical & Dental test on 4 Dec 2026 at 10:00 AM. Detailed domestic circular should come from DGME/DGHS.",
    basis:"2026–27 admission calendar + official/reliable 2025–26 medical admission reference",
    application:"Current 2026–27 application opening/closing dates pending DGME/DGHS domestic circular.",
    admit:"Current admit-card window pending. Previous cycle required a colour-printed admit card and HSC/equivalent admit/registration card at the exam centre.",
    fees:"Current application fee pending the 2026–27 circular.",
    centers:"Previous cycle: 17 centres and 49 venues nationwide. Current 2026–27 centre list may differ.",
    seats:"2025–26 reference: 13,051 combined government/private MBBS+BDS seats — government 5,645 (MBBS 5,100; BDS 545), private 7,406 (MBBS 6,001; BDS 1,405).",
    programs:["MBBS","BDS"],
    eligibility:[
      "Current 2026–27 domestic GPA/passing-year rules pending the official circular.",
      "Applicants should have Science background with Biology, Chemistry and Physics; exact GPA and Biology threshold must follow the current DGME/DGHS notice."
    ],
    format:[
      "2025–26 reference: 100 MCQs, 1 hour 15 minutes, pass mark 40.",
      "Biology 30, Chemistry 25, Physics 15, English 15, General Knowledge/Aptitude/Human Qualities 15.",
      "0.25 mark deducted for each wrong answer.",
      "Previous merit calculation added SSC GPA×8 (max 40) + HSC GPA×12 (max 60) to the written-test score."
    ],
    documents:["Colour-printed admit card","Transparent black-ink ballpoint pen","HSC/equivalent admit card or registration card","Other documents required by current circular"],
    previous:"2025–26 domestic MBBS/BDS test was held 12 Dec 2025 at 10:00 AM; DGME/DGHS published results and subsequent admission instructions.",
    notes:["Previous cycle prohibited mobile phones, calculators, electronic devices and watches in the examination hall.","Current 2026–27 rules may change and must override the previous-cycle reference."],
    links:[
      ["DGME official notices","https://dgme.gov.bd/pages/notices"],
      ["DGHS official notices","https://dghs.gov.bd/pages/notices"]
    ]
  }
};

// Re-insert BUP because the object literal above keeps profiles grouped by type.
UNIVERSITY_INFO["BUP"] = {
  aliases:["Bangladesh University of Professionals","বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস"],
  official:"https://admission.bup.edu.bd/Admission/Home",
  status:"BUP has already posted an official Admission Notice for session 2026–27 (dated 1 Sep 2026).",
  basis:"Current 2026–27 BUP official notice availability + calendars; previous undergraduate notice for format fallback",
  application:"Use the current BUP notice for exact application dates.",
  admit:"Use the 2026–27 BUP portal/notice for admit-card release.",
  fees:"Previous undergraduate reference: Tk 1,100 application processing fee per faculty; confirm in 2026–27 notice.",
  centers:"Current notice/admit card will specify centres.",
  seats:"Faculty/program seat counts must follow the 2026–27 notice.",
  programs:["FASS","FSSS","FST","FBS","FET","FMS","BBA General"],
  eligibility:["Faculty-specific GPA and subject rules apply; use the 2026–27 faculty/program notice."],
  format:["Previous undergraduate reference: MCQ admission test; 0.50 mark deducted per incorrect answer.","Previous reference required at least 40% in English.","Previous assessment weighting (except MBA): test 55%, HSC 25%, SSC 20%.","Calculator was prohibited except FST-approved models listed on the admit card."],
  documents:["SSC/HSC details","Photo/signature","Quota/supporting documents","Equivalence certificate if needed","Admit card"],
  previous:"2024–25 undergraduate notice is used only for format/fee reference until the full 2026–27 PDF is parsed.",
  notes:["Calendar sources disagree on BUP FBS appearing on 1 Jan vs 9 Jan 2027; official BUP notice is authoritative."],
  links:[["Official BUP admission portal","https://admission.bup.edu.bd/Admission/Home"],["All BUP notices","https://admission.bup.edu.bd/Admission/NoticeAll"]]
};

const uniList=document.getElementById('uniList');
Object.keys(UNIVERSITY_INFO).sort().forEach(name=>{const o=document.createElement('option');o.value=name;uniList.appendChild(o)});

function matchUniversity(q){
  q=q.trim().toLowerCase();
  if(!q) return null;
  for(const [name,info] of Object.entries(UNIVERSITY_INFO)){
    if(!info) continue;
    if(name.toLowerCase()===q || info.aliases.some(a=>a.toLowerCase()===q)) return [name,info];
  }
  for(const [name,info] of Object.entries(UNIVERSITY_INFO)){
    if(!info) continue;
    if(name.toLowerCase().includes(q) || info.aliases.some(a=>a.toLowerCase().includes(q)||q.includes(a.toLowerCase()))) return [name,info];
  }
  return null;
}

function listHtml(items){
  if(!items||!items.length) return '<p>Not published / not verified yet.</p>';
  return '<ul>'+items.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>';
}

function renderUniversity(){
  const found=matchUniversity(uniSearch.value);
  if(!found){
    uniResult.innerHTML='<div class="empty">No profile found. Search DU, BUET, RUET, KUET, CUET, MIST, BUP, Rajshahi University, Jagannath University, Khulna University, SUST, Chittagong University, Comilla University, BUTEX, AAUB, GST, Agriculture Cluster or Medical.</div>';
    return;
  }
  const [name,x]=found;
  const eventMatches=all.filter(e=>{
    const s=(e.title||'').toLowerCase();
    const tokens=[name,...x.aliases].filter(v=>v&&v.length>2).map(v=>v.toLowerCase());
    return tokens.some(t=>s.includes(t));
  });
  const liveDates=eventMatches.length
    ? eventMatches.map(e=>new Date(e.date).toLocaleString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'short'})+' — '+e.title)
    : ['No current calendar event matched this profile yet.'];

  const links=(x.links||[]).map(([label,url])=>'<a href="'+url+'" target="_blank" rel="noopener">'+esc(label)+' ↗</a>').join('<br>');
  const checkOptions=(x.checks||[]).map((r,i)=>'<option value="'+i+'">'+esc(r.label)+'</option>').join('');
  const checker=x.checks&&x.checks.length
    ? '<div class="eligibility-box"><select id="ruleSelect">'+checkOptions+'</select><input id="sscGpa" type="number" min="0" max="5" step=".01" placeholder="SSC GPA"><input id="hscGpa" type="number" min="0" max="5" step=".01" placeholder="HSC GPA"><button class="btn" id="checkEligibility">Check basic GPA</button></div><div class="eligibility-result" id="eligibilityResult">This checker evaluates only the verified GPA gate shown above; subject/year/quota conditions still apply.</div>'
    : '<div class="eligibility-result">No safe numeric checker is enabled for this profile yet because current-session eligibility includes subject/year rules that should not be guessed.</div>';

  uniResult.innerHTML=
    '<div class="info-name">'+esc(name)+'</div>'+
    '<div class="info-status">'+esc(x.status)+'</div>'+
    '<div class="source-badges"><span class="source-badge">'+esc(x.basis)+'</span></div>'+
    '<div class="info-grid">'+
      '<div class="info-card"><h3>📅 2026–27 exam dates</h3>'+listHtml(liveDates)+'</div>'+
      '<div class="info-card"><h3>🧾 Application window</h3><p>'+esc(x.application)+'</p></div>'+
      '<div class="info-card"><h3>🎫 Admit card</h3><p>'+esc(x.admit)+'</p></div>'+
      '<div class="info-card"><h3>💳 Application fee</h3><p>'+esc(x.fees)+'</p></div>'+
      '<div class="info-card"><h3>📍 Exam centres / seat plan</h3><p>'+esc(x.centers)+'</p></div>'+
      '<div class="info-card"><h3>🪑 Seats</h3><p>'+esc(x.seats)+'</p></div>'+
      '<div class="info-card"><h3>📚 Units / programs / subjects</h3>'+listHtml(x.programs)+'</div>'+
      '<div class="info-card"><h3>✅ Eligibility</h3>'+listHtml(x.eligibility)+checker+'</div>'+
      '<div class="info-card"><h3>📝 Exam format & marks</h3>'+listHtml(x.format)+'</div>'+
      '<div class="info-card"><h3>📎 Typical required documents</h3>'+listHtml(x.documents)+'</div>'+
      '<div class="info-card"><h3>🕘 Previous-cycle reference</h3><p>'+esc(x.previous)+'</p></div>'+
      '<div class="info-card"><h3>ℹ️ Important notes</h3>'+listHtml(x.notes)+'</div>'+
      '<div class="info-card"><h3>🔗 Official circulars / portals</h3><p>'+links+'</p><p>Official sources override calendar aggregators whenever details conflict.</p></div>'+
    '</div>';

  const btn=document.getElementById('checkEligibility');
  if(btn){
    btn.onclick=()=>{
      const idx=parseInt(document.getElementById('ruleSelect').value,10);
      const rule=x.checks[idx];
      const s=parseFloat(document.getElementById('sscGpa').value);
      const h=parseFloat(document.getElementById('hscGpa').value);
      const out=document.getElementById('eligibilityResult');
      if(!Number.isFinite(s)||!Number.isFinite(h)){out.textContent='Enter both SSC and HSC GPA.';return;}
      const ok=s>=rule.ssc && h>=rule.hsc && (s+h)>=rule.total;
      out.textContent=ok
        ? '✅ Passes this verified basic GPA gate. You still need to satisfy passing-year, subject, quota and program-specific conditions.'
        : '❌ Does not pass this selected GPA gate.';
    };
  }
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
