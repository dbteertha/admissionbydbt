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
:root{
  --bg:#03050a;--panel:rgba(9,12,19,.78);--panel-2:rgba(14,18,28,.78);
  --line:rgba(255,255,255,.10);--line-strong:rgba(255,255,255,.16);
  --text:#f7f8fb;--muted:#8f98aa;--soft:#c7cfdd;
  --blue:#78a7ff;--cyan:#62e6ff;--violet:#a78bfa;--gold:#f2c766;--green:#74e6a7;
  --danger:#ff7a8a;--shadow:0 28px 90px rgba(0,0,0,.42);
  --radius:24px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
html,body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,"Noto Sans Bengali",ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
body{min-height:100vh;overflow-x:hidden;background:#02040a}
button,input,select{font:inherit}
button{color:inherit}
a{color:inherit}
#stars{position:fixed;inset:0;z-index:0;pointer-events:none;display:block}
.app{position:relative;z-index:1;max-width:1240px;margin:auto;padding:20px 18px 92px}
.app:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:
  radial-gradient(circle at 18% 13%,rgba(64,112,255,.14),transparent 26%),
  radial-gradient(circle at 84% 21%,rgba(127,76,255,.12),transparent 28%),
  radial-gradient(circle at 50% 72%,rgba(44,154,255,.08),transparent 36%),
  linear-gradient(to bottom,rgba(0,0,0,.02),rgba(0,0,0,.18) 52%,rgba(0,0,0,.62))}
.app:after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.16) 70%,rgba(0,0,0,.58) 100%)}

/* top navigation */
.topnav{position:sticky;top:12px;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 16px;margin-bottom:10px;border:1px solid var(--line);border-radius:18px;background:rgba(7,10,17,.70);backdrop-filter:blur(22px) saturate(140%);box-shadow:0 16px 55px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.04)}
.brand-wrap{display:flex;align-items:center;gap:11px;min-width:0}
.brand-orb{width:26px;height:26px;border-radius:50%;position:relative;background:radial-gradient(circle at 38% 35%,#fff 0 4%,#91c8ff 5% 16%,#475cff 35%,#11182f 68%,#05070d 100%);box-shadow:0 0 24px rgba(105,139,255,.35)}
.brand-orb:after{content:"";position:absolute;inset:-5px;border:1px solid rgba(126,174,255,.28);border-radius:50%;transform:rotate(-18deg) scaleY(.48)}
.brand{font-weight:900;letter-spacing:.16em;font-size:12px;white-space:nowrap}
.brand-sub{font-size:9px;color:var(--muted);letter-spacing:.08em;margin-top:2px}
.navlinks{display:flex;gap:4px;align-items:center}
.navlink{border:0;background:transparent;color:#aab2c0;text-decoration:none;font-size:11px;padding:8px 10px;border-radius:10px;cursor:pointer}
.navlink:hover{background:rgba(255,255,255,.06);color:#fff}
.nav-actions{display:flex;align-items:center;gap:7px}
.live{font-size:10px;color:#aab4c5;border:1px solid var(--line);padding:8px 10px;border-radius:999px;background:rgba(12,16,24,.66);white-space:nowrap}
.focus-btn{border:1px solid rgba(120,167,255,.25);background:rgba(81,108,198,.10);color:#cddcff;border-radius:11px;padding:8px 10px;font-size:10px;cursor:pointer}
.focus-btn:hover,.focus-btn.active{border-color:rgba(120,167,255,.56);background:rgba(96,124,226,.19);box-shadow:0 0 24px rgba(85,126,255,.12)}

/* hero */
.hero{min-height:610px;display:grid;place-items:center;text-align:center;position:relative;overflow:hidden}
.hero-inner{width:min(850px,100%);position:relative;padding:64px 18px 42px}
.orbit-shell{position:absolute;left:50%;top:45%;width:min(590px,82vw);aspect-ratio:1;transform:translate(-50%,-50%);border:1px solid rgba(128,163,255,.10);border-radius:50%;pointer-events:none}
.orbit-shell:before,.orbit-shell:after{content:"";position:absolute;border-radius:50%;inset:10%;border:1px dashed rgba(148,179,255,.10)}
.orbit-shell:after{inset:24%;border-style:solid;border-color:rgba(255,255,255,.055)}
.orbit-dot{position:absolute;width:7px;height:7px;border-radius:50%;background:#8fb9ff;box-shadow:0 0 14px #7eafff;left:50%;top:-4px;transform-origin:0 calc(min(590px,82vw)/2);animation:orbit 16s linear infinite}
@keyframes orbit{to{transform:rotate(360deg)}}
.hero-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.17em;text-transform:uppercase;color:#b8c1d2;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:rgba(8,11,18,.6)}
.hero-eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green)}
.hero-phase{margin:16px auto 0;width:max-content;max-width:100%;font-size:11px;color:#d6e2ff;background:rgba(81,116,219,.11);border:1px solid rgba(120,167,255,.20);border-radius:999px;padding:7px 11px}
.days{font-size:clamp(108px,20vw,198px);font-weight:950;line-height:.82;letter-spacing:-.085em;margin:20px 0 10px;text-shadow:0 0 44px rgba(132,168,255,.14),0 6px 40px rgba(0,0,0,.4)}
.label{font-weight:850;font-size:13px;letter-spacing:.19em;color:#e7ebf2}
.hero-message{max-width:560px;margin:13px auto 0;color:#9ea8b9;font-size:13px;line-height:1.55}
.clock{display:flex;justify-content:center;gap:clamp(16px,4vw,42px);margin:25px 0 24px}
.clock div{min-width:64px}.clock b{font-size:clamp(23px,4vw,40px);letter-spacing:-.035em;font-variant-numeric:tabular-nums}.clock span{display:block;color:#727d91;font-size:8px;letter-spacing:.13em;margin-top:5px}
.progress-wrap{width:min(690px,100%);margin:auto}.progress-meta{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#818b9d;margin-bottom:8px}
.progress{height:10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;overflow:hidden;background:rgba(2,5,10,.75);box-shadow:inset 0 0 18px rgba(0,0,0,.65)}
.fill{height:100%;width:0;background:linear-gradient(90deg,#617cff,#77d9ff 55%,#b6f0ff);border-radius:inherit;transition:width .8s;box-shadow:0 0 18px rgba(102,202,255,.32)}
.pct{font-size:10px;color:#aab3c4}.passed{font-size:14px;font-weight:750;color:#cbd3df}.passed i{font-style:normal;color:#4d5564;margin:0 10px}

/* dashboard stat strip */
.dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:-20px 0 22px;position:relative;z-index:2}
.stat-card{min-height:88px;padding:14px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,rgba(13,17,27,.88),rgba(8,11,18,.78));backdrop-filter:blur(16px);box-shadow:0 18px 45px rgba(0,0,0,.20)}
.stat-label{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#717c90}.stat-value{font-size:18px;font-weight:850;margin-top:7px;line-height:1.2}.stat-note{font-size:10px;color:#7e899d;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* general panels */
.panel,.section,.target-section,.info-center,.mission-section{background:linear-gradient(145deg,rgba(9,12,19,.86),rgba(7,9,15,.80));border:1px solid var(--line);border-radius:var(--radius);backdrop-filter:blur(18px) saturate(125%);box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.035)}
.section,.info-center,.mission-section{padding:22px}
.head,.target-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.head h2,.target-head h2{font-size:28px;margin:0;letter-spacing:-.035em}
.sub{color:#8791a3;font-size:12px;margin-top:5px;line-height:1.45}
.section-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.16em;color:#6d7b96;margin-bottom:7px}

/* mission */
.mission-section{margin-bottom:22px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:18px}
.mission-main{min-width:0}.mission-side{border-left:1px solid var(--line);padding-left:18px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.mission-list{display:grid;gap:8px}.mission-item{display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(255,255,255,.025);transition:.18s ease}
.mission-item:hover{border-color:rgba(120,167,255,.20);background:rgba(116,155,255,.045)}
.mission-item.done{opacity:.58;background:rgba(116,230,167,.035);border-color:rgba(116,230,167,.16)}
.mission-check{width:20px;height:20px;appearance:none;border:1px solid #465165;border-radius:7px;background:#0b0e15;display:grid;place-content:center;cursor:pointer;flex:0 0 auto}
.mission-check:checked{background:linear-gradient(145deg,#6a91ff,#55d9ff);border-color:transparent}.mission-check:checked:after{content:"✓";font-size:12px;color:#06101d;font-weight:900}
.mission-text{font-size:12px;color:#cbd3df;flex:1}.mission-item.done .mission-text{text-decoration:line-through}
.mission-actions{display:flex;gap:7px;margin-top:10px}.mission-input{flex:1;min-width:0;background:#0d1119;border:1px solid var(--line);color:#e9edf5;border-radius:11px;padding:10px 11px;font-size:11px;outline:none}.mission-input:focus{border-color:rgba(120,167,255,.45);box-shadow:0 0 0 3px rgba(120,167,255,.07)}
.btn{border:1px solid var(--line);background:#0e121a;color:#e9edf4;border-radius:11px;padding:9px 12px;cursor:pointer;font-size:11px;transition:.16s ease}.btn:hover{background:#151b26;border-color:var(--line-strong);transform:translateY(-1px)}
.mission-ring{--mission:0deg;width:126px;height:126px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--cyan) var(--mission),rgba(255,255,255,.07) 0);position:relative;box-shadow:0 0 35px rgba(89,213,255,.10)}
.mission-ring:after{content:"";position:absolute;inset:9px;border-radius:50%;background:#090c13;border:1px solid rgba(255,255,255,.06)}
.mission-score{position:relative;z-index:2}.mission-score b{display:block;font-size:28px;letter-spacing:-.05em}.mission-score span{display:block;font-size:8px;letter-spacing:.13em;color:#79859a;margin-top:3px}.mission-note{font-size:10px;color:#7f899b;margin-top:10px;max-width:190px}

/* targets */
.target-section{margin:0 0 22px;padding:22px}
.target-count{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#efd17c;border:1px solid rgba(242,199,102,.32);background:rgba(74,55,14,.27);border-radius:999px;padding:7px 10px}
.starred-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:12px}
.starred-card{position:relative;overflow:hidden;border:1px solid rgba(242,199,102,.26);background:linear-gradient(150deg,rgba(48,38,15,.47),rgba(10,13,20,.91) 52%,rgba(21,17,9,.78));border-radius:18px;padding:16px;box-shadow:0 14px 42px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,230,163,.07);transition:.18s ease}
.starred-card:hover{transform:translateY(-2px);border-color:rgba(242,199,102,.45)}
.starred-card.primary-target{border-color:rgba(242,199,102,.62);box-shadow:0 16px 46px rgba(0,0,0,.32),0 0 32px rgba(242,199,102,.07)}
.starred-card:before{content:"";position:absolute;width:190px;height:190px;right:-86px;top:-105px;background:radial-gradient(circle,rgba(242,199,102,.14),transparent 68%);pointer-events:none}
.target-badge{display:inline-flex;margin-bottom:10px;font-size:8px;letter-spacing:.14em;color:#ffe6a3;border:1px solid rgba(242,199,102,.30);border-radius:999px;padding:5px 7px;background:rgba(95,70,13,.20)}
.target-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.target-name{font-size:15px;font-weight:850;line-height:1.3}.target-date{font-size:10px;color:#aaa38e;margin-top:5px}
.target-timer{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.target-time{background:rgba(5,7,11,.72);border:1px solid rgba(242,199,102,.14);border-radius:12px;padding:9px 5px;text-align:center}.target-time b{display:block;font-size:23px;line-height:1;color:#f8e8b6;letter-spacing:-.04em;font-variant-numeric:tabular-nums}.target-time span{display:block;margin-top:5px;font-size:7px;letter-spacing:.13em;color:#867d64}
.target-message{font-size:10px;color:#9c957f;margin-top:11px}.target-empty{grid-column:1/-1;border:1px dashed rgba(242,199,102,.22);border-radius:15px;padding:19px;color:#9e9888;font-size:11px;text-align:center;background:rgba(13,13,10,.48)}
.star-btn{appearance:none;border:1px solid #343c4a;background:#0d1119;color:#778195;width:30px;height:30px;border-radius:10px;display:inline-grid;place-items:center;cursor:pointer;font-size:16px;line-height:1;flex:0 0 auto;transition:.18s ease}.star-btn:hover{transform:translateY(-1px) scale(1.03);border-color:rgba(242,199,102,.42);color:#f5d67d}.star-btn.active{color:#ffd76b;border-color:rgba(242,199,102,.46);background:rgba(86,64,15,.30);box-shadow:0 0 18px rgba(231,185,59,.15)}

/* calendar */
.controls{display:flex;gap:8px;flex-wrap:wrap}.controls input{background:#0d1119;color:#e7eaf1;border:1px solid var(--line);border-radius:11px;padding:10px 12px;outline:none;min-width:210px}.controls input:focus{border-color:rgba(120,167,255,.42);box-shadow:0 0 0 3px rgba(120,167,255,.06)}
.calendar-head{display:flex;align-items:center;justify-content:space-between;margin:14px 0}.month{font-size:18px;font-weight:850;letter-spacing:-.02em}
.calendar-scroll{overflow-x:auto;border:1px solid rgba(255,255,255,.06);border-radius:17px;background:rgba(5,8,13,.45)}
.week,.grid{display:grid;grid-template-columns:repeat(7,1fr);min-width:720px}.week{background:rgba(255,255,255,.018)}.week div{color:#687489;font-size:9px;letter-spacing:.09em;padding:9px;text-align:center;text-transform:uppercase}
.day{min-height:112px;border-top:1px solid rgba(255,255,255,.055);border-left:1px solid rgba(255,255,255,.04);padding:8px;position:relative}.day:nth-child(7n+1){border-left:0}.day.muted{opacity:.23}.num{font-size:11px;color:#aab3c2}.today{background:linear-gradient(145deg,rgba(95,126,255,.08),transparent)}.today .num{background:#e8eefc;color:#07101d;border-radius:999px;padding:3px 7px;display:inline-block;font-weight:900}
.event{display:flex;align-items:flex-start;gap:5px;margin-top:6px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:5px 6px;font-size:9px;line-height:1.25;white-space:normal;overflow:hidden;cursor:default;transition:.15s ease}.event:hover{background:rgba(255,255,255,.065);border-color:rgba(120,167,255,.18)}.event .star-btn{width:19px;height:19px;border-radius:6px;font-size:10px;padding:0;margin-top:-1px}.event-title{min-width:0;flex:1}.event.starred{border-color:rgba(242,199,102,.32);background:linear-gradient(100deg,rgba(78,59,14,.32),rgba(25,27,34,.62));box-shadow:inset 2px 0 0 #d7ad43}.event.starred .event-title{color:#f2dfad;font-weight:750}
.upcoming{margin-top:28px}.cards{display:grid;gap:8px}.card{position:relative;border:1px solid rgba(255,255,255,.075);background:rgba(12,16,24,.66);border-radius:14px;padding:13px 14px 13px 18px;transition:.16s ease}.card:before{content:"";position:absolute;left:0;top:15px;bottom:15px;width:2px;border-radius:3px;background:linear-gradient(var(--blue),var(--cyan));opacity:.45}.card:hover{transform:translateX(2px);border-color:rgba(120,167,255,.19)}.card h3{font-size:13px;margin:0 0 6px}.card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.card.starred{border-color:rgba(242,199,102,.28);background:linear-gradient(145deg,rgba(44,35,13,.30),rgba(12,15,22,.78))}.card.starred:before{background:var(--gold);opacity:.9}.card.starred h3{color:#f0ddb0}.meta{font-size:10px;color:#8893a7;line-height:1.55}.source{font-size:9px;color:#aab2c0;margin-top:6px}
.empty{color:#7c8799;padding:26px;text-align:center;border:1px dashed rgba(255,255,255,.10);border-radius:14px}

/* info charts */
.info-center{margin-top:22px}
.info-title{font-size:28px;margin:0;letter-spacing:-.035em}
.category-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 18px;position:sticky;top:82px;z-index:16;padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:15px;background:rgba(7,10,16,.82);backdrop-filter:blur(18px)}
.category-tab{border:1px solid rgba(255,255,255,.08);background:#0c111a;color:#aeb7c6;border-radius:10px;padding:9px 12px;cursor:pointer;font-size:10px;transition:.15s ease}.category-tab:hover{border-color:rgba(120,167,255,.25);color:#fff}.category-tab.active{background:linear-gradient(135deg,#dfe9ff,#9edfff);color:#07101d;border-color:transparent;font-weight:850;box-shadow:0 6px 20px rgba(93,170,255,.14)}
.category-section{margin-top:24px;scroll-margin-top:140px}.category-section h3{font-size:21px;margin:0 0 12px}.cat-count{font-size:9px;color:#738097;font-weight:500;margin-left:7px}
.table-wrap{overflow:auto;border:1px solid rgba(255,255,255,.07);border-radius:17px;background:rgba(6,9,14,.62)}
.admission-table{width:100%;border-collapse:separate;border-spacing:0;min-width:1080px}.admission-table th,.admission-table td{padding:13px 11px;border-bottom:1px solid rgba(255,255,255,.055);border-right:1px solid rgba(255,255,255,.04);vertical-align:top;text-align:left}.admission-table th:last-child,.admission-table td:last-child{border-right:0}.admission-table tr:last-child td{border-bottom:0}.admission-table th{position:sticky;top:0;background:#101520;color:#e5eaf3;font-size:9px;letter-spacing:.04em;z-index:2}.admission-table td{font-size:10px;color:#a8b1c0;line-height:1.6}.admission-table td:first-child{font-weight:850;color:#edf1f7;min-width:190px;position:sticky;left:0;background:#0c1119;z-index:1}.admission-table tbody tr:hover td{background-color:rgba(93,140,255,.035)}.admission-table tbody tr:hover td:first-child{background:#111827}
.footer{color:#667186;font-size:9px;text-align:center;margin-top:22px;line-height:1.6}

/* mobile navigation */
.mobile-dock{display:none}
.focus-mode .calendar-section,.focus-mode .info-center,.focus-mode .dashboard-stats{display:none}
.focus-mode .hero{min-height:500px}
.focus-mode .target-section{box-shadow:0 22px 80px rgba(40,80,190,.12)}
.focus-mode .focus-btn{color:#07101d;background:#bcd4ff;border-color:transparent}
body.focus-mode:after{content:"FOCUS MODE";position:fixed;right:16px;bottom:16px;z-index:60;font-size:8px;letter-spacing:.18em;color:#9ab9ff;border:1px solid rgba(120,167,255,.25);border-radius:999px;padding:7px 9px;background:rgba(8,12,20,.78);backdrop-filter:blur(12px)}

@media(max-width:900px){
  .navlinks{display:none}
  .dashboard-stats{grid-template-columns:repeat(2,1fr);margin-top:-8px}
  .mission-section{grid-template-columns:1fr}
  .mission-side{border-left:0;border-top:1px solid var(--line);padding:18px 0 0}
}
@media(max-width:700px){
  .app{padding:10px 10px 88px}.topnav{top:8px;border-radius:15px;padding:9px 10px}.brand-sub,.live{display:none}.brand{font-size:10px;letter-spacing:.13em}.focus-btn{padding:8px 9px}
  .hero{min-height:520px}.hero-inner{padding:48px 8px 28px}.orbit-shell{width:86vw}.orbit-dot{display:none}.days{font-size:clamp(102px,31vw,150px);margin-top:18px}.hero-message{font-size:11px;padding:0 12px}.clock{gap:10px}.clock div{min-width:50px}.clock b{font-size:24px}.clock span{font-size:7px}
  .dashboard-stats{grid-template-columns:repeat(2,1fr);gap:7px}.stat-card{min-height:78px;padding:12px;border-radius:14px}.stat-value{font-size:15px}.stat-note{font-size:9px}
  .section,.target-section,.info-center,.mission-section{padding:14px;border-radius:18px}.head h2,.target-head h2,.info-title{font-size:22px}.sub{font-size:10px}.mission-actions{flex-wrap:wrap}.mission-input{flex-basis:100%}
  .starred-grid{grid-template-columns:1fr}.target-timer{gap:5px}.target-time b{font-size:21px}.star-btn{width:34px;height:34px}.event .star-btn{width:20px;height:20px}
  .calendar-scroll{margin:0 -4px}.controls{width:100%}.controls input{flex:1;min-width:0}.week,.grid{min-width:660px}.day{min-height:86px;padding:6px}.event{font-size:8px;padding:4px 5px}
  .category-tabs{top:67px;display:grid;grid-template-columns:1fr 1fr;padding:7px}.category-tab{border-radius:9px;font-size:9px;padding:8px}
  .table-wrap{overflow:visible;border:0;background:transparent}.admission-table{min-width:0;display:block}.admission-table thead{display:none}.admission-table tbody{display:grid;gap:10px}.admission-table tr{display:block;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(13,17,26,.86),rgba(8,11,17,.82));border-radius:15px;padding:5px 11px;box-shadow:0 12px 35px rgba(0,0,0,.16)}.admission-table td,.admission-table td:first-child{display:grid;grid-template-columns:112px 1fr;gap:10px;position:static!important;min-width:0;background:transparent!important;border:0;border-bottom:1px solid rgba(255,255,255,.055);padding:10px 0;font-size:10px}.admission-table td:last-child{border-bottom:0}.admission-table td:before{content:attr(data-label);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#69768d;font-weight:700}.admission-table td:first-child{display:block;font-size:13px;color:#f2f5fa;padding:10px 0}.admission-table td:first-child:before{display:none}
  .mobile-dock{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:70;display:grid;grid-template-columns:repeat(5,1fr);width:calc(100% - 20px);max-width:520px;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:rgba(7,10,16,.84);backdrop-filter:blur(22px);box-shadow:0 18px 55px rgba(0,0,0,.38)}.mobile-dock a,.mobile-dock button{border:0;background:transparent;color:#7f899b;text-decoration:none;text-align:center;border-radius:12px;padding:7px 3px;font-size:8px;cursor:pointer}.mobile-dock b{display:block;font-size:15px;color:#b8c4d8;margin-bottom:3px}.mobile-dock a:active,.mobile-dock button:active{background:rgba(255,255,255,.06)}
  body.focus-mode:after{display:none}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.orbit-dot{animation:none}}
</style></head><body><canvas id="stars"></canvas>
<div class="app">
  <nav class="topnav">
    <div class="brand-wrap">
      <div class="brand-orb"></div>
      <div><div class="brand">ADMISSION BY DBT</div><div class="brand-sub">MISSION CONTROL • 2026–27</div></div>
    </div>
    <div class="navlinks">
      <a class="navlink" href="#dashboard">Dashboard</a>
      <a class="navlink" href="#targets">My Targets</a>
      <a class="navlink" href="#calendar">Calendar</a>
      <a class="navlink" href="#infoCenter">Admission Info</a>
    </div>
    <div class="nav-actions">
      <div id="syncStatus" class="live">● syncing sources…</div>
      <button class="focus-btn" id="focusBtn" type="button">FOCUS MODE</button>
    </div>
  </nav>

  <main id="dashboard">
    <section class="hero">
      <div class="hero-inner">
        <div class="orbit-shell"><div class="orbit-dot"></div></div>
        <div class="hero-eyebrow"><i></i> Admission season 2026–27</div>
        <div class="hero-phase" id="heroPhase">BUILD PHASE</div>
        <div class="days" id="days">00</div>
        <div class="label">DAYS LEFT</div>
        <div class="hero-message" id="heroMessage">One focused day at a time.</div>
        <div class="clock">
          <div><b id="weeks">00W</b><span>WEEKS</span></div>
          <div><b id="hours">00H</b><span>HOURS</span></div>
          <div><b id="mins">00M</b><span>MINUTES</span></div>
          <div><b id="secs">00S</b><span>SECONDS</span></div>
        </div>
        <div class="progress-wrap">
          <div class="progress-meta"><div class="passed"><span id="passed">0 Passed</span><i>|</i><span id="total">0 Total</span></div><div class="pct" id="pct">0%</div></div>
          <div class="progress"><div class="fill" id="fill"></div></div>
        </div>
      </div>
    </section>

    <section class="dashboard-stats">
      <div class="stat-card"><div class="stat-label">Next exam</div><div class="stat-value" id="statNext">—</div><div class="stat-note" id="statNextNote">Waiting for schedule</div></div>
      <div class="stat-card"><div class="stat-label">Starred targets</div><div class="stat-value" id="statStarred">0</div><div class="stat-note">Your personal exam list</div></div>
      <div class="stat-card"><div class="stat-label">Current phase</div><div class="stat-value" id="statPhase">Build</div><div class="stat-note" id="statPhaseNote">Consistency first</div></div>
    </section>

    <section class="target-section" id="targets">
      <div class="target-head">
        <div><div class="section-kicker">YOUR PRIORITIES</div><h2>★ My Target Exams</h2><div class="sub">Star any exam. Your nearest target becomes the mission priority and gets its own live timer.</div></div>
        <div class="target-count" id="targetCount">0 STARRED</div>
      </div>
      <div class="starred-grid" id="starredCards"></div>
    </section>

    <section class="section calendar-section" id="calendar">
      <div class="head">
        <div><div class="section-kicker">SCHEDULE</div><h2>Admission Calendar</h2><div class="sub">Search, star and track the exams that matter to you.</div></div>
        <div class="controls"><input id="search" placeholder="Search university or unit…"><button class="btn" id="refresh">Refresh</button></div>
      </div>
      <div class="calendar-head"><button class="btn" id="prev">← Previous</button><div class="month" id="month"></div><button class="btn" id="next">Next →</button></div>
      <div class="calendar-scroll">
        <div class="week"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
        <div class="grid" id="grid"></div>
      </div>
      <div class="footer">Schedules may change. Use the latest official university notice for critical decisions.</div>
    </section>

    <section class="info-center" id="infoCenter">
      <div class="head"><div><div class="section-kicker">REFERENCE</div><h2 class="info-title">বিশ্ববিদ্যালয় ভর্তি তথ্য কণিকা</h2><div class="sub">আসন, যোগ্যতা, পরীক্ষার ধরন, নম্বরবণ্টন ও ফলাফল নির্ণয় — ক্যাটাগরি অনুযায়ী।</div></div></div>
      <div class="category-tabs" id="categoryTabs"></div>
      <div id="categoryCharts"></div>
    </section>
  </main>
</div>

<nav class="mobile-dock" aria-label="Quick navigation">
  <a href="#dashboard"><b>⌂</b>Home</a>
  <a href="#targets"><b>★</b>Targets</a>
  <a href="#calendar"><b>▦</b>Calendar</a>
  <a href="#infoCenter"><b>≡</b>Info</a>
  <button id="mobileFocusBtn" type="button"><b>◎</b>Focus</button>
</nav>
<script>
const TARGET=new Date('2026-11-30T00:00:00+06:00'), START=new Date('2026-09-05T00:00:00+06:00');
function phaseFor(days){
  if(days<=1)return {name:'EXAM MODE',stat:'Exam',note:'Stay calm. Execute.',msg:'You prepared for this. Keep your head clear and execute one question at a time.'};
  if(days<=7)return {name:'FINAL SPRINT',stat:'Final sprint',note:'Revise. Rest. Execute.',msg:'Protect your confidence. Revise what matters, sleep properly, and keep moving.'};
  if(days<=14)return {name:'MOCK SPRINT',stat:'Mocks',note:'Practice > new topics',msg:'The fastest gains now come from timed practice, mistakes, and focused revision.'};
  if(days<=30)return {name:'REVISION PHASE',stat:'Revision',note:'Turn knowledge into recall',msg:'Reduce passive study. Recall, solve, review mistakes, repeat.'};
  if(days<=60)return {name:'BUILD + REVISE',stat:'Build + revise',note:'Consistency compounds',msg:'A strong day does not need to be perfect. Finish the important work and come back tomorrow.'};
  return {name:'FOUNDATION PHASE',stat:'Build',note:'Consistency first',msg:'Build the base now so revision feels lighter later. One focused day at a time.'};
}
function countdown(){
  const now=new Date(), diff=Math.max(0,TARGET-now), span=(TARGET-START),
    total=Math.round(span/86400000)+1,
    passed=Math.max(0,Math.min(total,Math.floor((now-START)/86400000)));
  const days=Math.floor(diff/86400000),weeks=Math.floor(days/7),
    h=Math.floor(diff/3600000)%24,m=Math.floor(diff/60000)%60,s=Math.floor(diff/1000)%60;
  daysEl.textContent=days;weeksEl.textContent=String(weeks).padStart(2,'0')+'W';
  hoursEl.textContent=String(h).padStart(2,'0')+'H';minsEl.textContent=String(m).padStart(2,'0')+'M';secsEl.textContent=String(s).padStart(2,'0')+'S';
  const p=span>0?Math.max(0,Math.min(100,((now-START)/span)*100)):0;
  fill.style.width=p+'%';pct.textContent=p.toFixed(1)+'%';passedEl.textContent=passed+' Passed';totalEl.textContent=total+' Total';
  const ph=phaseFor(days);
  heroPhase.textContent=ph.name;heroMessage.textContent=ph.msg;
  statPhase.textContent=ph.stat;statPhaseNote.textContent=ph.note;
}const daysEl=document.getElementById('days'),weeksEl=document.getElementById('weeks'),hoursEl=document.getElementById('hours'),minsEl=document.getElementById('mins'),secsEl=document.getElementById('secs'),fill=document.getElementById('fill'),pct=document.getElementById('pct'),passedEl=document.getElementById('passed'),totalEl=document.getElementById('total'); countdown();setInterval(countdown,1000);
let all=[],view=new Date(2026,11,1),sourceHealth=[];
const STAR_KEY='admissionbydbt-starred-v1';
let starred=new Set();
try{starred=new Set(JSON.parse(localStorage.getItem(STAR_KEY)||'[]'))}catch(e){starred=new Set()}

function eventKey(e){return e.title+'|'+e.date}
function isStarred(e){return starred.has(eventKey(e))}
function saveStars(){localStorage.setItem(STAR_KEY,JSON.stringify([...starred]))}
function toggleStar(e){
  const key=eventKey(e);
  const adding=!starred.has(key);
  if(adding) starred.add(key); else starred.delete(key);
  saveStars();
  if(adding&&typeof makeShooter==='function'&&!reduceMotion){
    makeShooter(true,Math.max(80,innerWidth*.72),Math.max(80,innerHeight*.18));
  }
  render();
}
function starButton(e,extraClass=''){
  const b=document.createElement('button');
  b.type='button';
  b.className='star-btn '+extraClass+(isStarred(e)?' active':'');
  b.textContent=isStarred(e)?'★':'☆';
  b.title=isStarred(e)?'Remove from My Target Exams':'Star this exam';
  b.setAttribute('aria-label',b.title);
  b.onclick=ev=>{ev.stopPropagation();toggleStar(e)};
  return b;
}
function bdDate(iso){return new Date(new Date(iso).toLocaleString('en-US',{timeZone:'Asia/Dhaka'}))}
function filtered(){const q=search.value.toLowerCase();return all.filter(e=>!q||e.title.toLowerCase().includes(q))}
function render(){
  month.textContent=view.toLocaleString('en-US',{month:'long',year:'numeric'});
  grid.innerHTML='';
  const y=view.getFullYear(),mo=view.getMonth(),first=new Date(y,mo,1),start=new Date(y,mo,1-first.getDay());
  const es=filtered();
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const cell=document.createElement('div');
    cell.className='day'+(d.getMonth()!=mo?' muted':'');
    const now=new Date();
    if(d.toDateString()==now.toDateString())cell.classList.add('today');
    cell.innerHTML='<span class="num">'+d.getDate()+'</span>';
    es.filter(e=>{
      const x=bdDate(e.date);
      return x.getFullYear()==d.getFullYear()&&x.getMonth()==d.getMonth()&&x.getDate()==d.getDate()
    }).slice(0,4).forEach(e=>{
      const el=document.createElement('div');
      el.className='event'+(isStarred(e)?' starred':'');
      el.title=e.title+(e.agreement?' — '+e.agreement:'');
      el.appendChild(starButton(e));
      const t=document.createElement('span');
      t.className='event-title';
      t.textContent=e.title;
      el.appendChild(t);
      cell.appendChild(el);
    });
    grid.appendChild(cell);
  }
  renderStarredTargets();
}
function splitCountdown(target){
  let diff=new Date(target)-new Date();
  if(diff<=0)return {d:0,h:0,m:0,s:0,done:true};
  return {
    d:Math.floor(diff/86400000),
    h:Math.floor(diff/3600000)%24,
    m:Math.floor(diff/60000)%60,
    s:Math.floor(diff/1000)%60,
    done:false
  };
}
function updateDashboardStats(){
  const now=new Date();
  const future=all.filter(e=>new Date(e.date)>now).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const next=future[0];
  statStarred.textContent=all.filter(isStarred).length;
  if(next){
    const d=new Date(next.date),left=Math.max(0,Math.ceil((d-now)/86400000));
    statNext.textContent=left+' days';
    statNextNote.textContent=next.title;
  }else{
    statNext.textContent='—';statNextNote.textContent='No upcoming exam';
  }
}
function renderStarredTargets(){
  const matches=all.filter(isStarred).sort((a,b)=>new Date(a.date)-new Date(b.date));
  targetCount.textContent=matches.length+' STARRED';
  updateDashboardStats();
  if(!matches.length){
    starredCards.innerHTML='<div class="target-empty">☆ Star an exam from the calendar or Upcoming Exams. It will appear here with its own live countdown.</div>';
    return;
  }
  starredCards.innerHTML=matches.map((e,i)=>{
    const d=new Date(e.date),v=splitCountdown(e.date),key=encodeURIComponent(eventKey(e));
    const date=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'full'});
    const time=e.displayTime||d.toLocaleTimeString('en-BD',{timeZone:'Asia/Dhaka',hour:'numeric',minute:'2-digit'});
    const message=v.done?'Exam time / completed':(v.d<=7?'Final stretch — keep revision tight.':v.d<=30?'Revision matters more than collecting new topics.':'Keep going — '+v.d+' days to this target.');
    return '<article class="starred-card'+(i===0&&!v.done?' primary-target':'')+'" data-star-key="'+key+'">'+
      (i===0&&!v.done?'<div class="target-badge">NEXT TARGET</div>':'')+
      '<div class="target-top"><div><div class="target-name">'+esc(e.title)+'</div><div class="target-date">'+esc(date)+' • '+esc(time)+'</div></div>'+
      '<button type="button" class="star-btn active target-unstar" data-star-key="'+key+'" aria-label="Remove from My Target Exams" title="Remove from My Target Exams">★</button></div>'+
      '<div class="target-timer">'+
        '<div class="target-time"><b data-part="d">'+String(v.d).padStart(2,'0')+'</b><span>DAYS</span></div>'+
        '<div class="target-time"><b data-part="h">'+String(v.h).padStart(2,'0')+'</b><span>HOURS</span></div>'+
        '<div class="target-time"><b data-part="m">'+String(v.m).padStart(2,'0')+'</b><span>MIN</span></div>'+
        '<div class="target-time"><b data-part="s">'+String(v.s).padStart(2,'0')+'</b><span>SEC</span></div>'+
      '</div><div class="target-message">'+esc(message)+'</div></article>';
  }).join('');
  starredCards.querySelectorAll('.target-unstar').forEach(btn=>{
    btn.onclick=()=>{
      const raw=decodeURIComponent(btn.dataset.starKey||'');
      starred.delete(raw);saveStars();render();
    };
  });
}
function updateStarredTimers(){
  document.querySelectorAll('.starred-card').forEach(card=>{
    const raw=decodeURIComponent(card.dataset.starKey||'');
    const e=all.find(x=>eventKey(x)===raw);
    if(!e)return;
    const v=splitCountdown(e.date);
    for(const part of ['d','h','m','s']){
      const node=card.querySelector('[data-part="'+part+'"]');
      if(node)node.textContent=String(v[part]).padStart(2,'0');
    }
    const msg=card.querySelector('.target-message');
    if(msg)msg.textContent=v.done?'Exam time / completed':'Keep going — '+v.d+' days to this target.';
  });
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
async function load(force=false){
  syncStatus.textContent='● syncing sources…';
  try{
    const r=await fetch('/api/events'+(force?'?refresh=1':''));
    const j=await r.json();
    all=j.events||[];
    sourceHealth=j.sources||[];
    syncStatus.textContent='● '+all.length+' exams • updated '+new Date(j.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    render();
  }catch(e){
    syncStatus.textContent='● sync unavailable';
    render();
  }
}
prev.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
next.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
refresh.onclick=()=>load(true);
search.oninput=render;
load();
setInterval(updateStarredTimers,1000);

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


const CATEGORY_ORDER = [
  "মেডিকেল ও ডেন্টাল",
  "ইঞ্জিনিয়ারিং",
  "ভার্সিটি ‘ক’/বিজ্ঞান",
  "ভার্সিটি ‘খ’/মানবিক"
];

const CATEGORY_LABELS = {
  "মেডিকেল ও ডেন্টাল":"মেডিকেল ও ডেন্টাল",
  "ইঞ্জিনিয়ারিং":"ইঞ্জিনিয়ারিং বিশ্ববিদ্যালয়সমূহ",
  "ভার্সিটি ‘ক’/বিজ্ঞান":"ভার্সিটি ‘ক’ ইউনিট — বিজ্ঞান শাখা",
  "ভার্সিটি ‘খ’/মানবিক":"ভার্সিটি ‘খ’ ইউনিট — মানবিক/অন্যান্য শাখা"
};

function renderCategoryTable(cat){
  const rows=BOOKLET_ROWS.filter(r=>r.cat===cat);
  return '<section class="category-section" data-cat="'+esc(cat)+'">'+
    '<h3>'+esc(CATEGORY_LABELS[cat]||cat)+' <span class="cat-count">'+rows.length+'টি তথ্য</span></h3>'+
    '<div class="table-wrap"><table class="admission-table">'+
      '<thead><tr>'+
        '<th>বিশ্ববিদ্যালয় / ইউনিট</th>'+
        '<th>আসন সংখ্যা</th>'+
        '<th>আবেদন যোগ্যতা</th>'+
        '<th>পরীক্ষার ধরন</th>'+
        '<th>বিষয়ভিত্তিক নম্বর / প্রশ্ন</th>'+
        '<th>ফলাফল নির্ণয় পদ্ধতি</th>'+
      '</tr></thead><tbody>'+
      rows.map(r=>'<tr>'+
        '<td data-label="বিশ্ববিদ্যালয় / ইউনিট">'+esc(r.unit)+'</td>'+
        '<td data-label="আসন সংখ্যা">'+esc(r.seats)+'</td>'+
        '<td data-label="আবেদন যোগ্যতা">'+esc(r.elig)+'</td>'+
        '<td data-label="পরীক্ষার ধরন">'+esc(r.exam)+'</td>'+
        '<td data-label="নম্বর / প্রশ্ন">'+esc(r.marks)+'</td>'+
        '<td data-label="ফলাফল নির্ণয়">'+esc(r.result)+'</td>'+
      '</tr>').join('')+
      '</tbody></table></div></section>';
}

function renderAllCategories(){
  const tabs=document.getElementById('categoryTabs');
  const host=document.getElementById('categoryCharts');
  tabs.innerHTML=CATEGORY_ORDER.map((cat,i)=>'<button class="category-tab'+(i===0?' active':'')+'" data-cat="'+esc(cat)+'">'+esc(CATEGORY_LABELS[cat]||cat)+'</button>').join('');
  host.innerHTML=CATEGORY_ORDER.map(cat=>renderCategoryTable(cat)).join('');

  tabs.querySelectorAll('.category-tab').forEach(btn=>{
    btn.onclick=()=>{
      tabs.querySelectorAll('.category-tab').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      const sec=[...host.querySelectorAll('.category-section')].find(x=>x.dataset.cat===btn.dataset.cat);
      if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
    };
  });
}
renderAllCategories();


/* ---------- Focus mode ---------- */
const FOCUS_KEY='admissionbydbt-focus-v1';
function setFocus(on){
  document.body.classList.toggle('focus-mode',on);
  focusBtn.classList.toggle('active',on);
  focusBtn.textContent=on?'EXIT FOCUS':'FOCUS MODE';
  localStorage.setItem(FOCUS_KEY,on?'1':'0');
}
focusBtn.onclick=()=>setFocus(!document.body.classList.contains('focus-mode'));
mobileFocusBtn.onclick=()=>setFocus(!document.body.classList.contains('focus-mode'));
setFocus(localStorage.getItem(FOCUS_KEY)==='1');

const cv=document.getElementById('stars'),ctx=cv.getContext('2d',{alpha:true});
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let coarse=matchMedia('(pointer: coarse)').matches;
let W=innerWidth,H=innerHeight,dpr=1,stars=[],shooters=[],dust=[];
let targetX=W*.5,targetY=H*.45,camX=targetX,camY=targetY;
let lastShot=0,lastFrame=performance.now(),running=true,tapPulse=0;

function rand(min,max){return min+Math.random()*(max-min)}

function resizeSpace(){
  W=innerWidth;H=innerHeight;
  coarse=matchMedia('(pointer: coarse)').matches;
  dpr=Math.min(devicePixelRatio||1,coarse?1.35:1.8);
  cv.width=Math.floor(W*dpr);
  cv.height=Math.floor(H*dpr);
  cv.style.width=W+'px';
  cv.style.height=H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  buildSpace();
}

function buildSpace(){
  stars=[];
  dust=[];
  const count=coarse?115:230;
  const dustCount=coarse?28:55;

  for(let i=0;i<count;i++){
    const depth=Math.random();
    stars.push({
      x:Math.random()*W,
      y:Math.random()*H,
      depth:depth,
      size:depth<.55?rand(.35,.85):rand(.7,1.65),
      speed:rand(.035,.13)+depth*.22,
      alpha:rand(.28,.92),
      tw:rand(0,Math.PI*2),
      tint:Math.random()
    });
  }

  for(let i=0;i<dustCount;i++){
    dust.push({
      x:Math.random()*W,
      y:Math.random()*H,
      depth:rand(.25,1),
      size:rand(.25,.7),
      alpha:rand(.04,.15),
      speed:rand(.02,.07)
    });
  }
}

function setPointer(x,y){
  targetX=Math.max(0,Math.min(W,x));
  targetY=Math.max(0,Math.min(H,y));
}

addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'||e.pointerType==='pen') setPointer(e.clientX,e.clientY);
},{passive:true});

addEventListener('touchmove',e=>{
  const t=e.touches&&e.touches[0];
  if(t) setPointer(t.clientX,t.clientY);
},{passive:true});

addEventListener('pointerdown',e=>{
  setPointer(e.clientX,e.clientY);
  tapPulse=1;
  if(!reduceMotion) makeShooter(true,e.clientX,e.clientY);
},{passive:true});

addEventListener('resize',resizeSpace,{passive:true});

document.addEventListener('visibilitychange',()=>{
  running=!document.hidden;
  if(running&&!reduceMotion){
    lastFrame=performance.now();
    requestAnimationFrame(drawSpace);
  }
});

function makeShooter(fromTap,x,y){
  if(shooters.length>(coarse?2:4)) return;
  const left=fromTap?x:rand(-W*.08,W*.5);
  const top=fromTap?Math.max(0,y-rand(40,150)):rand(0,H*.35);
  const speed=coarse?rand(7,10):rand(9,14);
  shooters.push({
    x:left,
    y:top,
    vx:speed,
    vy:speed*rand(.26,.42),
    life:0,
    max:rand(42,72),
    len:rand(65,135),
    alpha:fromTap?.9:rand(.55,.9)
  });
}

function drawNebula(t){
  const shiftX=(camX-W*.5)*.025;
  const shiftY=(camY-H*.5)*.018;

  let g=ctx.createRadialGradient(W*.18+shiftX,H*.16+shiftY,0,W*.18+shiftX,H*.16+shiftY,Math.max(W,H)*.42);
  g.addColorStop(0,'rgba(66,105,255,.095)');
  g.addColorStop(.38,'rgba(49,71,155,.038)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  g=ctx.createRadialGradient(W*.78-shiftX,H*.24-shiftY,0,W*.78-shiftX,H*.24-shiftY,Math.max(W,H)*.36);
  g.addColorStop(0,'rgba(121,72,255,.065)');
  g.addColorStop(.45,'rgba(74,43,133,.026)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  const pulse=.5+.5*Math.sin(t*.00022);
  g=ctx.createRadialGradient(W*.52,H*.74,0,W*.52,H*.74,Math.max(W,H)*.5);
  g.addColorStop(0,'rgba(31,93,165,'+(0.028+pulse*.012)+')');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

function drawSpace(t){
  if(!running) return;
  const now=t||performance.now();
  const dt=Math.min(2.2,(now-lastFrame)/16.667||1);
  lastFrame=now;

  camX+=(targetX-camX)*(coarse?.035:.055);
  camY+=(targetY-camY)*(coarse?.035:.055);
  tapPulse*=.93;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#02040a';
  ctx.fillRect(0,0,W,H);
  drawNebula(now);

  const parX=(camX-W*.5)/W;
  const parY=(camY-H*.5)/H;

  for(const d of dust){
    d.y+=d.speed*dt;
    if(d.y>H+4){d.y=-4;d.x=Math.random()*W}
    const x=d.x-parX*d.depth*9;
    const y=d.y-parY*d.depth*6;
    ctx.globalAlpha=d.alpha;
    ctx.fillStyle='#a8b8d8';
    ctx.beginPath();ctx.arc(x,y,d.size,0,Math.PI*2);ctx.fill();
  }

  for(const s of stars){
    s.y+=s.speed*dt;
    if(s.y>H+5){
      s.y=-5;
      s.x=Math.random()*W;
      s.alpha=rand(.28,.92);
    }

    const x=s.x-parX*(5+s.depth*24);
    const y=s.y-parY*(3+s.depth*15);
    const tw=reduceMotion?1:(.72+.28*Math.sin(now*.0015+s.tw));
    const pulseBoost=1+tapPulse*Math.max(0,1-Math.hypot(x-camX,y-camY)/240)*.8;
    const r=s.size*pulseBoost;

    let color='#ffffff';
    if(s.tint<.10) color='#c9dcff';
    else if(s.tint>.94) color='#e7ddff';

    ctx.globalAlpha=s.alpha*tw;
    ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();

    if(r>1.15&&!coarse){
      ctx.globalAlpha=s.alpha*.13*tw;
      ctx.beginPath();ctx.arc(x,y,r*3.8,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.globalAlpha=1;

  if(!reduceMotion&&now-lastShot>(coarse?5200:3200)&&Math.random()<.035){
    makeShooter(false,0,0);
    lastShot=now;
  }

  const alive=[];
  for(const sh of shooters){
    sh.x+=sh.vx*dt;
    sh.y+=sh.vy*dt;
    sh.life+=dt;
    const p=sh.life/sh.max;
    const a=Math.max(0,1-p)*sh.alpha;
    const tailX=sh.x-sh.len;
    const tailY=sh.y-sh.len*(sh.vy/sh.vx);

    const g=ctx.createLinearGradient(sh.x,sh.y,tailX,tailY);
    g.addColorStop(0,'rgba(255,255,255,'+a+')');
    g.addColorStop(.22,'rgba(190,218,255,'+(a*.78)+')');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.strokeStyle=g;
    ctx.lineWidth=coarse?1.05:1.35;
    ctx.beginPath();ctx.moveTo(sh.x,sh.y);ctx.lineTo(tailX,tailY);ctx.stroke();

    ctx.globalAlpha=a;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(sh.x,sh.y,coarse?1.2:1.55,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    if(sh.life<sh.max&&sh.x<W+180&&sh.y<H+180) alive.push(sh);
  }
  shooters=alive;

  if(!reduceMotion) requestAnimationFrame(drawSpace);
}

resizeSpace();
drawSpace(performance.now());
if(reduceMotion) setTimeout(()=>drawSpace(performance.now()),50);

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
