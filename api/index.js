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
  ['Medical & Dental','2026-12-04T10:00:00+06:00','Tentative — 4 Dec depends on HSC-result timing','Tentative'],
  ['DU IBA','2026-12-05T10:00:00+06:00','Official — 5 Dec 2026, 10:00 AM–12:00 PM','Official'],
  ['Aviation and Aerospace University Bangladesh (AAUB)','2026-12-05T10:00:00+06:00','Official — undergraduate test 5 Dec 2026','Official'],
  ['Dhaka University A / Science','2026-12-12T11:00:00+06:00','Official — 12 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Khulna University D / Business','2026-12-17T12:00:00+06:00','Official date — detailed time/instructions pending','Time TBA'],
  ['Khulna University C / Humanities','2026-12-17T12:00:00+06:00','Official date — detailed time/instructions pending','Time TBA'],
  ['Khulna University A / Science','2026-12-18T12:00:00+06:00','Official date — detailed time/instructions pending','Time TBA'],
  ['Khulna University B / Life Science','2026-12-18T12:00:00+06:00','Official date — detailed time/instructions pending','Time TBA'],
  ['MIST C Unit','2026-12-18T10:00:00+06:00','Circular pending — calendar date only; official MIST 2026–27 circular not yet verified','Time TBA'],
  ['MIST A & B','2026-12-19T10:00:00+06:00','Circular pending — calendar date only; official MIST 2026–27 circular not yet verified','Time TBA'],
  ['Dhaka University B / Arts, Law & Social Science','2026-12-19T11:00:00+06:00','Official — 19 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Dhaka University Fine Arts','2026-12-22T11:00:00+06:00','Official — 22 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Dhaka University C / Business','2026-12-26T11:00:00+06:00','Official — 26 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Jagannath University A / Science','2027-01-01T10:00:00+06:00','Official 2026–27 schedule / admission information available','Official date'],
  ['BUP FBS','2027-01-01T10:30:00+06:00','Official/current notice — first FBS date; keep 9 Jan too','Official'],
  ['Agriculture Cluster','2027-01-02T10:00:00+06:00','Circular pending — 2026–27 full ACAS circular not yet verified','Time TBA'],
  ['BUP FASS','2027-01-02T15:30:00+06:00','Official/current BUP notice','Official'],
  ['Jagannath University E / Fine Arts','2027-01-08T10:00:00+06:00','Official 2026–27 schedule / admission information available','Official date'],
  ['KUET','2027-01-08T10:00:00+06:00','Official portal/circular — 8 Jan 2027; centres KUET, DU and RUET; MCQ','Official'],
  ['BUP FST','2027-01-08T10:30:00+06:00','Official/current BUP notice','Official'],
  ['BUP FET','2027-01-08T10:30:00+06:00','Official/current BUP notice','Official'],
  ['BUP FMS','2027-01-08T10:30:00+06:00','Official/current BUP notice','Official'],
  ['Rajshahi University B / Business','2027-01-08T11:00:00+06:00','Circular pending — full official 2026–27 undergraduate circular not yet verified','Time TBA'],
  ['BUP FSSS','2027-01-08T15:30:00+06:00','Current BUP notice','Official'],
  ['Rajshahi University C / Science','2027-01-09T11:00:00+06:00','Circular pending — full official 2026–27 undergraduate circular not yet verified','Time TBA'],
  ['BUP FBS','2027-01-09T10:30:00+06:00','Official/current notice — second FBS date; intentional, not duplicate','Official'],
  ['BUP BBA General','2027-01-09T15:30:00+06:00','Chorcha visible'],
  ['RUET','2027-01-14T09:30:00+06:00','Circular pending — calendar date only; RUET official site still shows 2025–26 undergraduate circular','Time TBA'],
  ['Jagannath University B / Humanities','2027-01-15T10:00:00+06:00','Official 2026–27 schedule / admission information available','Official date'],
  ['BUET','2027-01-16T09:00:00+06:00','Date announced — detailed 2026–27 circular pending','Circular pending'],
  ['Rajshahi University A / Humanities','2027-01-16T11:00:00+06:00','Circular pending — full official 2026–27 undergraduate circular not yet verified','Time TBA'],
  ['Jagannath University C / Business','2027-01-22T10:00:00+06:00','Official 2026–27 schedule / admission information available','Official date'],
  ['Jagannath University D / Social Science','2027-01-23T10:00:00+06:00','Official 2026–27 schedule / admission information available','Official date'],
  ['CUET','2027-01-23T10:00:00+06:00','Admission-Calendar visible'],
  ['SUST A','2027-01-26T15:00:00+06:00','Date confirmed — full application/test-plan notice pending','Circular pending'],
  ['SUST B','2027-01-27T15:00:00+06:00','Date confirmed — full application/test-plan notice pending','Circular pending'],
  ['BUTEX','2027-01-29T10:00:00+06:00','Official university announcement — 29 Jan 2027','Official'],
  ['Chittagong University C / Business','2027-01-29T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Chittagong University A / Science','2027-01-30T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Chittagong University B1','2027-02-03T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Chittagong University B2','2027-02-04T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Chittagong University B','2027-02-05T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Comilla University A','2027-02-05T11:00:00+06:00','Official university press release — 5 Feb 2027','Official'],
  ['Chittagong University D','2027-02-06T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['Comilla University B','2027-02-06T11:00:00+06:00','Official university press release — 6 Feb 2027','Official'],
  ['Comilla University C','2027-02-07T11:00:00+06:00','Official university press release — 7 Feb 2027','Official'],
  ['Chittagong University D1','2027-02-08T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Official date'],
  ['GST B / Humanities','2027-03-19T10:00:00+06:00','Date announced — full application circular pending','Circular pending'],
  ['GST C / Business','2027-03-20T10:00:00+06:00','Date announced — full application circular pending','Circular pending'],
  ['GST D / Architecture','2027-03-20T10:00:00+06:00','New separate D / Architecture unit — date announced; full circular pending','Circular pending'],
  ['GST A / Science','2027-03-27T10:00:00+06:00','Date announced — full application circular pending','Circular pending']
].map(([title,date,agreement,displayTime])=>({
  title,
  date:new Date(date).toISOString(),
  agreement,
  ...(displayTime?{displayTime}:{}),
  ...(agreement&&agreement.startsWith('Tentative')?{status:'tentative'}:{}),
  ...(agreement&&agreement.includes('Circular pending')?{status:'pending'}:{})
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

const OFFICIAL_CIRCULARS = [
  {name:'Dhaka University',short:'DU',status:'Official 2026–27',url:'https://www.du.ac.bd/du_post_details/post/28137'},
  {name:'BUP Admission Notice',short:'BUP',status:'Official 2026–27',url:'https://www.bup.edu.bd/notice/details/1061'},
  {name:'BUP Admission Portal',short:'BUP Portal',status:'Official portal',url:'https://admission.bup.edu.bd/Admission/Home'},
  {name:'KUET Undergraduate Admission',short:'KUET',status:'Official circular',url:'https://admission.kuet.ac.bd/'},
  {name:'AAUB Admission Information',short:'AAUB',status:'Official 2026–27',url:'https://www.aaub.edu.bd/public/content/admission-info'},
  {name:'AAUB Notice Archive',short:'AAUB Notices',status:'Official notices',url:'https://www.aaub.edu.bd/notice'},
  {name:'Khulna University',short:'KU',status:'Official date notice',url:'https://ku.ac.bd/news-details/2783'},
  {name:'BUTEX Academic Notices',short:'BUTEX',status:'Official notices',url:'https://www.butex.edu.bd/academic-notices/'},
  {name:'Comilla University Press Releases',short:'CoU',status:'Official exam dates',url:'https://www.cou.ac.bd/press-releases'},
  {name:'Jagannath University Admission',short:'JnU',status:'Official 2026–27',url:'https://admission.jnu.ac.bd/'},
  {name:'Chittagong University Admission',short:'CU',status:'Official 2026–27',url:'https://admission.cu.ac.bd/'}
];
const CIRCULAR_PENDING = [
  'Medical / Dental','BUET detailed circular','RUET','CUET','Rajshahi University',
  'SUST full circular','Agriculture Cluster','GST full application circular',
  'MIST 2026–27','Comilla University detailed circular'
];

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
.sync-link{height:36px;display:inline-flex;align-items:center;gap:7px;padding:0 10px;border:1px solid rgba(120,167,255,.22);border-radius:11px;background:rgba(10,16,27,.74);color:#cfe0ff;font-size:9px;font-weight:850;letter-spacing:.02em;cursor:pointer;transition:.16s ease;white-space:nowrap}
.sync-link:hover{transform:translateY(-1px);border-color:rgba(120,167,255,.44);background:#111827;color:#fff}
.sync-link i{width:7px;height:7px;border-radius:50%;background:#7ea8ff;box-shadow:0 0 12px rgba(126,168,255,.42)}
.sync-link.saved{border-color:rgba(116,230,167,.24);color:#bcecca;background:rgba(28,76,52,.12)}
.sync-link.saved i{background:#74e6a7;box-shadow:0 0 12px rgba(116,230,167,.42)}
.sync-link.saving{border-color:rgba(242,199,102,.24);color:#e9cf8f}
.sync-link.offline{border-color:rgba(255,122,138,.20);color:#e9a3ad}
.msg-link{width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(116,230,167,.18);border-radius:11px;background:rgba(10,18,16,.72);color:#9be7ba;text-decoration:none;transition:.16s ease;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}
.msg-link:hover{transform:translateY(-1px);border-color:rgba(116,230,167,.42);background:rgba(30,83,53,.18);color:#d5f7e1;box-shadow:0 0 22px rgba(116,230,167,.12)}
.msg-link svg{width:18px;height:18px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.live{font-size:10px;color:#aab4c5;border:1px solid var(--line);padding:8px 10px;border-radius:999px;background:rgba(12,16,24,.66);white-space:nowrap}

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

@media(max-width:900px){
  .navlinks{display:none}
  .dashboard-stats{grid-template-columns:repeat(2,1fr);margin-top:-8px}
  .mission-section{grid-template-columns:1fr}
  .mission-side{border-left:0;border-top:1px solid var(--line);padding:18px 0 0}
}
@media(max-width:700px){
  .app{padding:10px 10px 88px}.topnav{top:8px;border-radius:15px;padding:9px 10px}.brand-sub,.live{display:none}.brand{font-size:10px;letter-spacing:.13em}
  .hero{min-height:520px}.hero-inner{padding:48px 8px 28px}.orbit-shell{width:86vw}.orbit-dot{display:block}.days{font-size:clamp(108px,32vw,154px);margin-top:18px}.hero-message{font-size:13px;padding:0 12px}.clock{gap:12px}.clock div{min-width:54px}.clock b{font-size:27px}.clock span{font-size:8px}
  .dashboard-stats{grid-template-columns:repeat(2,1fr);gap:7px}.stat-card{min-height:78px;padding:12px;border-radius:14px}.stat-value{font-size:15px}.stat-note{font-size:9px}
  .section,.target-section,.info-center,.mission-section{padding:14px;border-radius:18px}.head h2,.target-head h2,.info-title{font-size:22px}.sub{font-size:10px}.mission-actions{flex-wrap:wrap}.mission-input{flex-basis:100%}
  .starred-grid{grid-template-columns:1fr}.target-timer{gap:5px}.target-time b{font-size:21px}.star-btn{width:34px;height:34px}.event .star-btn{width:20px;height:20px}
  .calendar-scroll{margin:0}.controls{width:100%}.controls input{flex:1;min-width:0}.week,.grid{min-width:0}.day{min-height:72px;padding:4px}.event{font-size:7px;padding:3px 4px}
  .category-tabs{top:67px;display:grid;grid-template-columns:repeat(3,1fr);padding:7px}.category-tab{border-radius:9px;font-size:9px;padding:8px}
  .table-wrap{overflow:visible;border:0;background:transparent}.admission-table{min-width:0;display:block}.admission-table thead{display:none}.admission-table tbody{display:grid;gap:10px}.admission-table tr{display:block;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(13,17,26,.86),rgba(8,11,17,.82));border-radius:15px;padding:5px 11px;box-shadow:0 12px 35px rgba(0,0,0,.16)}.admission-table td,.admission-table td:first-child{display:grid;grid-template-columns:112px 1fr;gap:10px;position:static!important;min-width:0;background:transparent!important;border:0;border-bottom:1px solid rgba(255,255,255,.055);padding:10px 0;font-size:10px}.admission-table td:last-child{border-bottom:0}.admission-table td:before{content:attr(data-label);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#69768d;font-weight:700}.admission-table td:first-child{display:block;font-size:13px;color:#f2f5fa;padding:10px 0}.admission-table td:first-child:before{display:none}
  .mobile-dock{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:70;display:grid;grid-template-columns:repeat(5,1fr);width:calc(100% - 20px);max-width:520px;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:rgba(7,10,16,.84);backdrop-filter:blur(22px);box-shadow:0 18px 55px rgba(0,0,0,.38)}.mobile-dock a,.mobile-dock button{border:0;background:transparent;color:#7f899b;text-decoration:none;text-align:center;border-radius:12px;padding:7px 3px;font-size:8px;cursor:pointer}.mobile-dock b{display:block;font-size:15px;color:#b8c4d8;margin-bottom:3px}.mobile-dock a:active,.mobile-dock button:active{background:rgba(255,255,255,.06)}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.orbit-dot{animation:none}}

/* official circular directory */
.circular-section{margin:0 0 22px;padding:22px}
.circular-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.circular-card{
  min-height:104px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;
  padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:16px;
  background:linear-gradient(145deg,rgba(14,18,27,.91),rgba(7,10,16,.88));
  color:inherit;text-decoration:none;transition:.17s ease;position:relative;overflow:hidden;
}
.circular-card:after{content:"↗";position:absolute;right:12px;top:10px;color:#63718a;font-size:13px}
.circular-card:hover{transform:translateY(-2px);border-color:rgba(120,167,255,.30);background:linear-gradient(145deg,rgba(19,25,38,.96),rgba(9,13,21,.94))}
.circular-card strong{font-size:13px;line-height:1.25;padding-right:20px}
.circular-card span{font-size:9px;color:#8490a2}
.circular-card b{font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:#9fdab7}
.circular-pending{margin-top:12px;padding:12px;border:1px solid rgba(242,199,102,.14);border-radius:14px;background:rgba(242,199,102,.035)}
.circular-pending-title{font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:#c5a95d;margin-bottom:8px}
.circular-pending-list{display:flex;flex-wrap:wrap;gap:6px}
.circular-pending-chip{padding:6px 8px;border:1px solid rgba(255,255,255,.07);border-radius:999px;background:#0b0e14;color:#8b94a3;font-size:8px}
.audit-note{margin-top:11px;color:#7f899a;font-size:9px;line-height:1.5}
.event-status{display:inline-flex;margin-left:5px;padding:2px 5px;border-radius:999px;font-size:6px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;vertical-align:middle}
.event-status.tentative{color:#ffd68b;border:1px solid rgba(255,190,80,.32);background:rgba(255,176,55,.10)}
.event-status.pending{color:#b7c5db;border:1px solid rgba(150,175,210,.22);background:rgba(120,150,190,.08)}
.hero-target-note{margin:7px auto 0;width:max-content;max-width:100%;font-size:8px;color:#7f8a9b;letter-spacing:.03em}
.main-target-control{display:grid;place-items:center;margin-top:12px}
.main-target-icon{width:38px;height:38px;border-radius:50%;border:1px solid rgba(120,167,255,.22);background:rgba(10,16,27,.78);color:#cfe0ff;display:grid;place-items:center;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.24),inset 0 0 0 1px rgba(255,255,255,.025);transition:.16s ease}
.main-target-icon:hover{transform:translateY(-1px) scale(1.04);border-color:rgba(120,167,255,.46);background:#111a29;color:#fff;box-shadow:0 0 24px rgba(99,151,255,.14)}
.main-target-icon.active{border-color:rgba(116,230,167,.32);color:#b9ecc9;background:rgba(35,92,61,.14)}
.sync-modal-backdrop{position:fixed;inset:0;z-index:135;background:rgba(0,0,0,.70);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px;opacity:0;pointer-events:none;transition:.16s ease}
.sync-modal-backdrop.open{opacity:1;pointer-events:auto}
.sync-modal{width:min(520px,96vw);padding:18px;border:1px solid rgba(255,255,255,.10);border-radius:20px;background:linear-gradient(145deg,#0b1018,#070a10);box-shadow:0 28px 90px rgba(0,0,0,.55);transform:translateY(10px) scale(.985);transition:.18s ease}
.sync-modal-backdrop.open .sync-modal{transform:translateY(0) scale(1)}
.sync-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.sync-modal-head h3{margin:0;font-size:22px;letter-spacing:-.035em}
.sync-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#10151e;color:#9ca7b7;font-size:19px;cursor:pointer}
.sync-note{margin:8px 0 14px;color:#8d98aa;font-size:10px;line-height:1.55}
.sync-code-box{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid rgba(120,167,255,.18);border-radius:14px;background:rgba(8,13,22,.82)}
.sync-code{flex:1;min-width:0;font:800 15px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:#eef4ff;overflow-wrap:anywhere}
.sync-copy{border:1px solid rgba(255,255,255,.09);background:#101722;color:#cdd8ea;border-radius:10px;padding:8px 10px;font-size:9px;font-weight:800;cursor:pointer}
.sync-status-line{margin-top:9px;font-size:9px;color:#738097;min-height:14px}
.sync-divider{height:1px;background:rgba(255,255,255,.07);margin:15px 0}
.sync-existing-label{font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:#718096;margin-bottom:7px}
.sync-existing-row{display:flex;gap:8px}
.sync-existing-input{flex:1;min-width:0;padding:10px 11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:#090d14;color:#edf2fa;font:750 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;text-transform:uppercase}
.sync-use{border:1px solid rgba(120,167,255,.24);border-radius:11px;background:rgba(43,72,126,.16);color:#dbe7ff;padding:0 12px;font-size:9px;font-weight:850;cursor:pointer}
.sync-warning{margin-top:10px;color:#8a7280;font-size:8px;line-height:1.45}
.target-picker-backdrop{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px;opacity:0;pointer-events:none;transition:.16s ease}
.target-picker-backdrop.open{opacity:1;pointer-events:auto}
.target-picker{width:min(620px,96vw);max-height:min(720px,88vh);display:flex;flex-direction:column;padding:17px;border:1px solid rgba(255,255,255,.10);border-radius:20px;background:linear-gradient(145deg,#0b1018,#070a10);box-shadow:0 28px 90px rgba(0,0,0,.55);transform:translateY(10px) scale(.985);transition:.18s ease}
.target-picker-backdrop.open .target-picker{transform:translateY(0) scale(1)}
.target-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.target-picker-head h3{margin:0;font-size:22px;letter-spacing:-.035em}.target-picker-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#10151e;color:#9ca7b7;font-size:19px;cursor:pointer}
.target-picker-search{width:100%;margin:14px 0 10px;padding:10px 12px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:#0d121b;color:#edf2f8;outline:none;font-size:10px}.target-picker-search:focus{border-color:rgba(120,167,255,.38);box-shadow:0 0 0 3px rgba(120,167,255,.06)}
.target-picker-list{overflow:auto;display:grid;gap:6px;padding-right:2px}.target-picker-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(255,255,255,.065);border-radius:12px;background:#0a0e15;cursor:pointer;text-align:left}.target-picker-row:hover{border-color:rgba(120,167,255,.23);background:#101722}.target-picker-row.active{border-color:rgba(116,230,167,.28);background:rgba(41,95,66,.10)}
.target-picker-row strong{display:block;color:#e9eef5;font-size:10px}.target-picker-row small{display:block;margin-top:4px;color:#778397;font-size:8px}.target-picker-check{font-size:16px;color:#88a5d7}.target-picker-row.active .target-picker-check{color:#86dfaa}.target-picker-empty{padding:28px;text-align:center;color:#6f7b8e;font-size:9px}
@media(max-width:700px){.circular-section{padding:14px}.circular-grid{grid-template-columns:1fr 1fr}.circular-card{min-height:92px;padding:11px}.circular-card strong{font-size:11px}}
/* ===== 2026-27 HOME + CALENDAR COMMAND CENTER ===== */
.home-audit-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(116,230,167,.18);border-radius:999px;background:rgba(116,230,167,.055);color:#a9d9ba;font-size:8px;font-weight:850;letter-spacing:.06em;white-space:nowrap}
.home-audit-pill i{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 12px rgba(116,230,167,.55)}
.hero{min-height:560px!important}.hero-inner{width:min(940px,100%)!important;padding:58px 18px 34px!important}
.hero-next-card{position:relative;z-index:2;width:min(720px,100%);margin:18px auto 0;padding:13px 15px;border:1px solid rgba(120,167,255,.18);border-radius:16px;background:linear-gradient(135deg,rgba(26,37,61,.58),rgba(9,14,23,.80));box-shadow:0 14px 42px rgba(0,0,0,.18);text-align:left}
.hero-next-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.hero-next-kicker{font-size:7px;font-weight:950;letter-spacing:.15em;color:#7f91ad}
.hero-next-status{display:inline-flex;align-items:center;gap:5px;font-size:7px;font-weight:900;color:#b8f0ca;padding:4px 7px;border:1px solid rgba(116,230,167,.17);border-radius:999px;background:rgba(116,230,167,.055)}
.hero-next-status:before{content:"";width:5px;height:5px;border-radius:50%;background:var(--green)}
.hero-next-name{margin-top:6px;color:#f6f8fb;font-size:17px;font-weight:850;letter-spacing:-.02em}.hero-next-meta{margin-top:4px;color:#95a1b4;font-size:9px}
.hero-upcoming-strip{position:relative;z-index:2;width:min(900px,100%);margin:10px auto 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.hero-mini-event{min-width:0;padding:9px 10px;border:1px solid rgba(255,255,255,.065);border-radius:11px;background:rgba(7,10,16,.66);text-align:left}
.hero-mini-event b{display:block;color:#dfe5ed;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hero-mini-event span{display:block;margin-top:3px;color:#6f7b8e;font-size:7px}
.dashboard-stats{grid-template-columns:repeat(4,minmax(0,1fr))!important}.stat-card{position:relative;overflow:hidden}.stat-card:after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,rgba(120,167,255,.35),transparent);opacity:.65}
.command-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;flex-wrap:wrap}
.circular-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0 12px}.circular-summary-card{padding:11px 12px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:#080c12}
.circular-summary-card span{display:block;color:#687486;font-size:7px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.circular-summary-card b{display:block;margin-top:4px;color:#edf2f7;font-size:18px;letter-spacing:-.03em}.circular-summary-card small{display:block;margin-top:3px;color:#7f8998;font-size:7px}
.circular-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))!important}.circular-card{min-height:116px!important;padding:15px!important;background:linear-gradient(145deg,#0d121b,#080b11)!important}
.circular-card b{display:inline-flex!important;width:max-content;padding:4px 6px;border:1px solid rgba(116,230,167,.16);border-radius:999px;background:rgba(116,230,167,.045)}.circular-card strong{margin-top:8px;display:block!important}
.calendar-section{padding:20px!important;overflow:hidden}.calendar-commandbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:14px 0 10px}
.calendar-view-switch{display:inline-flex;gap:3px;padding:3px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:#070a0f}.calendar-view-btn{height:31px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:#798493;font-size:8px;font-weight:900;cursor:pointer}.calendar-view-btn.active{background:#161d29;color:#edf3ff;box-shadow:inset 0 0 0 1px rgba(120,167,255,.17)}
.calendar-filter-row{display:flex;gap:5px;flex-wrap:wrap}.calendar-filter{height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.075);border-radius:999px;background:#0a0e14;color:#778291;font-size:7.5px;font-weight:850;cursor:pointer}.calendar-filter.active{border-color:rgba(120,167,255,.28);background:rgba(80,120,215,.11);color:#dbe7ff}
.calendar-audit{display:flex;align-items:center;gap:7px;color:#7d899b;font-size:7.5px}.calendar-audit i{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 10px rgba(116,230,167,.5)}
.calendar-head{margin:9px 0!important;padding:8px 9px;border:1px solid rgba(255,255,255,.055);border-radius:12px;background:#080b10}.calendar-head .month{font-size:16px!important;font-weight:850!important;letter-spacing:-.025em}
.calendar-scroll{border:1px solid rgba(255,255,255,.06);border-radius:14px;overflow:auto;background:#06090e}.week{background:#090d14!important;position:sticky;top:0;z-index:2}.grid{background:#06090e}
.day{min-height:116px!important;background:#070b11!important;border-color:rgba(255,255,255,.045)!important;padding:8px!important}.day.muted{opacity:.35}.day.today{background:linear-gradient(145deg,rgba(74,115,207,.11),#080c12)!important;box-shadow:inset 0 0 0 1px rgba(120,167,255,.22)}
.day .num{display:grid!important;place-items:center;width:24px;height:24px;border-radius:8px;color:#98a3b2!important;font-size:9px!important}.day.today .num{background:#dfe8ff;color:#0a1220!important;font-weight:950}
.event{position:relative!important;display:grid!important;grid-template-columns:16px minmax(0,1fr)!important;align-items:center!important;gap:4px!important;margin-top:5px!important;padding:5px 6px!important;border:1px solid rgba(255,255,255,.065)!important;border-radius:8px!important;background:#0c1119!important;cursor:pointer!important}
.event:hover{border-color:rgba(120,167,255,.23)!important;background:#111826!important}.event.starred{background:rgba(242,199,102,.065)!important;border-color:rgba(242,199,102,.16)!important}.event .star-btn{position:static!important;width:15px!important;height:15px!important;font-size:10px!important}
.event-title{font-size:7.2px!important;line-height:1.25!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.event-status{grid-column:2;justify-self:start;margin:0!important;font-size:5.5px!important}
.calendar-list{display:none}.calendar-section[data-view="timeline"] .calendar-scroll,.calendar-section[data-view="upcoming"] .calendar-scroll,.calendar-section[data-view="timeline"] .calendar-head,.calendar-section[data-view="upcoming"] .calendar-head{display:none}.calendar-section[data-view="timeline"] .calendar-list,.calendar-section[data-view="upcoming"] .calendar-list{display:block}
.timeline-month{margin:13px 0 6px;color:#78869a;font-size:8px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}.timeline-card{display:grid;grid-template-columns:74px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border-top:1px solid rgba(255,255,255,.055);background:transparent;cursor:pointer}.timeline-card:first-of-type{border-top:0}.timeline-card:hover{background:rgba(255,255,255,.022)}
.timeline-date{text-align:center}.timeline-date b{display:block;color:#f0f3f7;font-size:18px;line-height:1}.timeline-date span{display:block;margin-top:4px;color:#6f7b8c;font-size:7px;font-weight:850}.timeline-main{min-width:0}.timeline-main strong{display:block;color:#e8edf4;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.timeline-main small{display:block;margin-top:4px;color:#758193;font-size:7.5px}
.timeline-status{display:flex;align-items:center;gap:5px;padding:5px 7px;border:1px solid rgba(116,230,167,.13);border-radius:999px;color:#a6d9b7;font-size:6px;font-weight:900;white-space:nowrap}.timeline-status.pending{border-color:rgba(242,199,102,.16);color:#d7b96d}.timeline-status.tentative{border-color:rgba(255,122,138,.16);color:#e79aa5}
.timeline-empty{padding:34px 14px;text-align:center;color:#667286;font-size:9px}.calendar-list-shell{border:1px solid rgba(255,255,255,.06);border-radius:14px;background:#070a0f;overflow:hidden}.calendar-mobile-note{display:none}
.event-drawer-backdrop{position:fixed;inset:0;z-index:105;background:rgba(0,0,0,.58);backdrop-filter:blur(5px);opacity:0;pointer-events:none;transition:.16s}.event-drawer-backdrop.open{opacity:1;pointer-events:auto}
.event-drawer{position:absolute;right:0;top:0;height:100%;width:min(410px,92vw);padding:22px;background:#080c12;border-left:1px solid rgba(255,255,255,.09);box-shadow:-24px 0 70px rgba(0,0,0,.42);transform:translateX(100%);transition:.2s ease;overflow:auto}.event-drawer-backdrop.open .event-drawer{transform:translateX(0)}
.event-drawer-close{float:right;width:32px;height:32px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:#0f141c;color:#8b96a7;cursor:pointer}.event-drawer-kicker{margin-top:42px;color:#728198;font-size:7px;font-weight:950;letter-spacing:.15em}.event-drawer h3{margin:7px 0 5px;color:#f2f5f8;font-size:22px;letter-spacing:-.035em}.event-drawer-date{color:#aab5c5;font-size:10px;line-height:1.5}
.event-drawer-status{display:inline-flex;margin-top:12px;padding:5px 8px;border:1px solid rgba(116,230,167,.16);border-radius:999px;color:#a5d8b7;background:rgba(116,230,167,.045);font-size:7px;font-weight:900}.event-drawer-status.pending{border-color:rgba(242,199,102,.18);color:#d9bb72;background:rgba(242,199,102,.045)}.event-drawer-status.tentative{border-color:rgba(255,122,138,.18);color:#e8a0aa;background:rgba(255,122,138,.045)}
.event-drawer-note{margin-top:14px;padding:12px;border:1px solid rgba(255,255,255,.065);border-radius:12px;background:#0b1017;color:#8794a6;font-size:9px;line-height:1.55}.event-drawer-actions{display:flex;gap:7px;margin-top:15px}.event-drawer-actions .btn{flex:1}
@media(max-width:850px){.dashboard-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hero-upcoming-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){
  body{font-size:15px}
  .topnav,.panel,.section,.target-section,.info-center,.mission-section,.mobile-dock{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  .target-picker-backdrop,.event-drawer-backdrop{backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}
  .app{padding-left:12px!important;padding-right:12px!important}
  .topnav{min-height:50px!important;padding:10px 12px!important}
  .brand{font-size:12px!important;letter-spacing:.11em!important}

  /* calmer, readable hero */
  .hero{min-height:520px!important;overflow:visible!important}
  .hero-inner{padding:42px 6px 28px!important}
  .hero-eyebrow{font-size:9px!important;padding:7px 10px!important}
  .hero-phase{font-size:10px!important;padding:7px 10px!important}
  .days{font-size:clamp(112px,32vw,156px)!important;line-height:.86!important;margin:22px 0 10px!important}
  .label{font-size:12px!important;letter-spacing:.16em!important}
  .hero-message{font-size:13px!important;line-height:1.5!important;max-width:330px!important}
  .clock{gap:12px!important;margin:22px 0 18px!important}
  .clock div{min-width:55px!important}
  .clock b{font-size:28px!important}
  .clock span{font-size:8px!important;letter-spacing:.10em!important}
  .main-target-control{margin-top:12px!important}
  .main-target-icon{width:44px!important;height:44px!important;font-size:22px!important}
  .hero-target-note{font-size:10px!important;line-height:1.35!important;max-width:300px!important}

  /* keep the timer orbit visible on phones */
  .orbit-shell{display:block!important;top:43%!important;width:min(360px,92vw)!important;border-color:rgba(128,163,255,.16)!important;opacity:.95}
  .orbit-shell:before{border-color:rgba(148,179,255,.14)!important}
  .orbit-shell:after{border-color:rgba(255,255,255,.08)!important}
  .orbit-dot{display:block!important;width:8px!important;height:8px!important;top:-5px!important;box-shadow:0 0 18px #7eafff!important;animation:orbit 13s linear infinite!important;transform-origin:0 46vw!important}

  /* readable dashboard */
  .dashboard-stats{gap:8px!important;margin-top:0!important}
  .stat-card{padding:12px!important;min-height:82px!important;border-radius:15px!important;background:linear-gradient(145deg,rgba(16,21,32,.94),rgba(9,13,20,.90))!important}
  .stat-label{font-size:9px!important;letter-spacing:.08em!important}
  .stat-value{font-size:18px!important;margin-top:7px!important}
  .stat-note{display:none!important}

  .section,.target-section,.info-center{padding:15px!important;border-radius:18px!important}
  .head h2,.target-head h2,.info-title,.command-section-head h2{font-size:23px!important;line-height:1.15!important}
  .section-kicker{font-size:8px!important;margin-bottom:5px!important}
  .command-section-head .sub,.target-head .sub,.circular-section>.head .sub,.info-center>.head .sub,.footer,.audit-note{display:none!important}

  /* circulars: fewer tiny words, bigger tap areas */
  .circular-summary{grid-template-columns:1fr 1fr;margin:11px 0!important;gap:8px!important}
  .circular-summary-card{padding:12px!important;border-radius:13px!important}
  .circular-summary-card:last-child{display:none}
  .circular-summary-card span{font-size:8px!important}
  .circular-summary-card b{font-size:19px!important}
  .circular-summary-card small{display:none}
  .circular-grid{grid-template-columns:1fr!important;gap:8px!important}
  .circular-card{min-height:76px!important;padding:13px 14px!important;border-radius:14px!important}
  .circular-card strong{font-size:13px!important;line-height:1.3!important}
  .circular-card b{font-size:8px!important}
  .circular-card span{display:none!important}
  .circular-pending{padding:11px!important;border-radius:13px!important}
  .circular-pending-title{font-size:8px!important;line-height:1.35!important}
  .circular-pending-list{gap:5px!important}
  .circular-pending-chip{padding:6px 8px!important;font-size:8px!important}

  /* calendar controls */
  .calendar-section{padding:12px!important}
  .command-section-head{align-items:center!important;gap:9px!important}
  .controls{width:100%;gap:7px!important}
  .controls input{flex:1;min-width:0;padding:10px 11px!important;font-size:11px!important;border-radius:11px!important}
  .controls .btn{min-height:40px!important;padding:9px 12px!important;font-size:10px!important}
  .calendar-commandbar{align-items:stretch;margin:10px 0 8px!important;gap:8px!important}
  .calendar-view-switch{width:100%;order:1;padding:4px!important}
  .calendar-view-btn{flex:1;min-height:38px!important;padding:0 8px!important;font-size:9px!important;border-radius:9px!important}
  .calendar-filter-row{order:2;width:100%;overflow-x:auto;flex-wrap:nowrap;padding:1px 0 4px;scrollbar-width:none}
  .calendar-filter-row::-webkit-scrollbar{display:none}
  .calendar-filter{flex:0 0 auto;min-height:36px!important;padding:0 12px!important;font-size:9px!important}
  .calendar-audit{display:none!important}
  .calendar-head{display:flex!important;margin:8px 0!important;padding:7px 8px!important;border-radius:11px!important}
  .calendar-head .btn{width:40px!important;height:38px!important;padding:0!important;font-size:0!important}
  .calendar-head .btn:first-child:after{content:"‹";font-size:22px}
  .calendar-head .btn:last-child:after{content:"›";font-size:22px}
  .calendar-head .month{font-size:15px!important}

  /* actual month grid, still fits without turning into a list */
  .calendar-scroll{display:block!important;margin:0!important;overflow:hidden!important;border-radius:12px!important;background:#080c12!important}
  .week,.grid{min-width:0!important;width:100%!important;grid-template-columns:repeat(7,minmax(0,1fr))!important}
  .week div{padding:7px 1px!important;font-size:7px!important;letter-spacing:.02em!important;color:#8995a6!important}
  .day{min-height:82px!important;padding:4px!important;background:#080c12!important}
  .day .num{width:21px!important;height:21px!important;font-size:9px!important;border-radius:7px!important}
  .day.today .num{font-size:9px!important}
  .event{grid-template-columns:10px minmax(0,1fr)!important;gap:3px!important;margin-top:4px!important;padding:4px 3px!important;border-radius:6px!important;min-height:19px!important;background:#0f151f!important}
  .event .star-btn{width:10px!important;height:10px!important;font-size:7px!important;border:0!important;background:transparent!important}
  .event-title{font-size:6.7px!important;line-height:1.15!important;font-weight:700!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  .event-status{display:none!important}

  .calendar-section[data-view="timeline"] .calendar-scroll,.calendar-section[data-view="upcoming"] .calendar-scroll,.calendar-section[data-view="timeline"] .calendar-head,.calendar-section[data-view="upcoming"] .calendar-head{display:none!important}
  .calendar-section[data-view="timeline"] .calendar-list,.calendar-section[data-view="upcoming"] .calendar-list{display:block!important}
  .calendar-section[data-view="month"] .calendar-list{display:none!important}
  .timeline-card{grid-template-columns:54px minmax(0,1fr) auto;gap:9px;padding:12px 10px!important}
  .timeline-date b{font-size:17px!important}
  .timeline-date span{font-size:8px!important}
  .timeline-main strong{font-size:11px!important}
  .timeline-main small{font-size:9px!important}
  .timeline-status{font-size:7px!important;padding:5px 7px!important}

  /* target cards + info tables */
  .target-count{font-size:9px!important;padding:7px 9px!important}
  .target-name{font-size:16px!important}.target-date{font-size:11px!important}
  .target-message{font-size:11px!important}
  .target-time b{font-size:23px!important}.target-time span{font-size:8px!important}
  .category-tabs{top:67px;grid-template-columns:repeat(3,1fr)!important;padding:7px!important;gap:6px!important}
  .category-tab{min-height:39px!important;border-radius:10px!important;font-size:10px!important;padding:8px!important}
  .admission-table td,.admission-table td:first-child{grid-template-columns:102px 1fr!important;gap:11px!important;padding:11px 0!important;font-size:12px!important;line-height:1.5!important}
  .admission-table td:before{font-size:9px!important}
  .admission-table td:first-child{font-size:15px!important}

  .mobile-dock{padding:7px!important;border-radius:18px!important}
  .mobile-dock a,.mobile-dock button{font-size:9px!important;padding:8px 3px!important}
  .mobile-dock b{font-size:17px!important}
  .msg-link{width:42px!important;height:42px!important;border-radius:13px!important}.msg-link svg{width:20px!important;height:20px!important}
  .sync-link{height:42px!important;padding:0 9px!important;border-radius:13px!important}.sync-link span{font-size:9px!important}.sync-modal{padding:15px!important}.sync-code{font-size:13px!important;letter-spacing:.055em!important}
}
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
      <a class="navlink" href="#circulars">Circulars</a>
      <a class="navlink" href="#infoCenter">Admission Info</a>
    </div>
    <div class="nav-actions">
      <button class="sync-link" id="homeSyncButton" type="button" title="Sync personal Home and Calendar choices"><i></i><span id="homeSyncText">Sync</span></button>
      <a class="msg-link" href="https://wa.me/+8801516560230" target="_blank" rel="noopener" aria-label="Message on WhatsApp" title="Message on WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.4 3.8 20l1-3.5A8.4 8.4 0 1 1 7 18.4Z"/><path d="M8.2 8.1c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.5.9 1.3 1.7 2.2 2.2.3.2.5.2.7 0l.8-.7c.2-.2.5-.2.7-.1l1.9.9c.3.1.4.3.4.6 0 .8-.4 1.6-1 2-1 .6-2.4.5-4-.2-1.4-.6-2.8-1.7-3.9-3.1-1-1.3-1.7-2.8-1.8-4.1-.1-.8.1-1.4.5-1.7Z"/></svg>
      </a>
      <div id="syncStatus" class="live">● syncing sources…</div>
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
        <div class="main-target-control">
          <button class="main-target-icon" id="mainTargetButton" type="button" title="Set main countdown target" aria-label="Set main countdown target">⌖</button>
          <div class="hero-target-note" id="heroCountdownTarget">Main countdown target: default</div>
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
      <div class="stat-card"><div class="stat-label">Verified schedule</div><div class="stat-value" id="statConfirmed">0</div><div class="stat-note">Confirmed / official-date exams</div></div>
    </section>

    <section class="target-section" id="targets">
      <div class="target-head">
        <div><div class="section-kicker">TARGETS</div><h2>★ My Target Exams</h2><div class="sub">Star exams you want to follow.</div></div>
        <div class="target-count" id="targetCount">0 STARRED</div>
      </div>
      <div class="starred-grid" id="starredCards"></div>
    </section>

    <section class="section circular-section" id="circulars">
      <div class="head">
        <div><div class="section-kicker">OFFICIAL SOURCES</div><h2>2026–27 Circulars & Notices</h2><div class="sub">Tap a university name to open its current official admission notice or portal. Last audited: 7 Oct 2026.</div></div>
      </div>
      <div class="circular-summary">
        <div class="circular-summary-card"><span>Published / official sources</span><b>11</b><small>Current verified links</small></div>
        <div class="circular-summary-card"><span>Still pending</span><b>10</b><small>Full 2026–27 circular not verified</small></div>
        <div class="circular-summary-card"><span>Last source audit</span><b style="font-size:14px">7 Oct 2026</b><small>Previous-cycle data stays clearly separated</small></div>
      </div>
      <div class="circular-grid">
        ${OFFICIAL_CIRCULARS.map(x=>'<a class="circular-card" href="'+x.url+'" target="_blank" rel="noopener"><div><b>'+x.status+'</b><strong>'+x.name+'</strong></div><span>'+x.short+' • Official source</span></a>').join('')}
      </div>
      <div class="circular-pending">
        <div class="circular-pending-title">2026–27 full circular still pending / not verified as published</div>
        <div class="circular-pending-list">${CIRCULAR_PENDING.map(x=>'<span class="circular-pending-chip">'+x+'</span>').join('')}</div>
        <div class="audit-note">Do not treat previous-cycle eligibility, fees, seats or detailed exam plans as confirmed for 2026–27 until a current official circular is published.</div>
      </div>
    </section>

    <section class="section calendar-section" id="calendar" data-view="month">
      <div class="command-section-head">
        <div><div class="section-kicker">SCHEDULE</div><h2>Admission Calendar</h2><div class="sub">Verified exam dates and status.</div></div>
        <div class="controls"><input id="search" placeholder="Search university or unit…"><button class="btn" id="refresh">Refresh</button></div>
      </div>
      <div class="calendar-commandbar">
        <div class="calendar-view-switch" id="calendarViewSwitch">
          <button class="calendar-view-btn active" data-calendar-view="month" type="button">Month</button>
          <button class="calendar-view-btn" data-calendar-view="timeline" type="button">Timeline</button>
          <button class="calendar-view-btn" data-calendar-view="upcoming" type="button">Upcoming</button>
        </div>
        <div class="calendar-filter-row" id="calendarFilters">
          <button class="calendar-filter active" data-calendar-filter="all" type="button">All</button>
          <button class="calendar-filter" data-calendar-filter="confirmed" type="button">Confirmed</button>
          <button class="calendar-filter" data-calendar-filter="engineering" type="button">Engineering</button>
          <button class="calendar-filter" data-calendar-filter="medical" type="button">Medical</button>
          <button class="calendar-filter" data-calendar-filter="university" type="button">University</button>
          <button class="calendar-filter" data-calendar-filter="starred" type="button">★ Starred</button>
        </div>
        <div class="calendar-audit"><i></i><span>Audited 7 Oct 2026</span></div>
      </div>
      <div class="calendar-head"><button class="btn" id="prev">← Previous</button><div class="month" id="month"></div><button class="btn" id="next">Next →</button></div>
      <div class="calendar-scroll">
        <div class="week"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
        <div class="grid" id="grid"></div>
      </div>
      <div class="calendar-list" id="calendarList"></div>
      <div class="footer">Schedules may change. Confirm critical details from the linked official university notice.</div>
    </section>

    <section class="info-center" id="infoCenter">
      <div class="head"><div><div class="section-kicker">REFERENCE</div><h2 class="info-title">বিশ্ববিদ্যালয় ভর্তি তথ্য কণিকা</h2><div class="sub">বিশ্ববিদ্যালয়, ইঞ্জিনিয়ারিং ও মেডিকেল — এই ৩ ক্যাটাগরিতে আসন, যোগ্যতা, পরীক্ষার ধরন, নম্বরবণ্টন ও ফলাফল নির্ণয়।</div></div></div>
      <div class="category-tabs" id="categoryTabs"></div>
      <div id="categoryCharts"></div>
    </section>
  </main>
</div>

<div class="sync-modal-backdrop" id="syncModalBackdrop" aria-hidden="true">
  <div class="sync-modal" role="dialog" aria-modal="true" aria-labelledby="syncModalTitle">
    <div class="sync-modal-head">
      <div><div class="section-kicker">PERSONAL SYNC</div><h3 id="syncModalTitle">Your Secret Code</h3></div>
      <button class="sync-close" id="syncModalClose" type="button" aria-label="Close">×</button>
    </div>
    <div class="sync-note">Save this secret code somewhere safe. You can use it anytime to recover or sync your starred exams, main countdown target and calendar preferences on another device.</div>
    <div class="sync-code-box">
      <div class="sync-code" id="syncCodeText">—</div>
      <button class="sync-copy" id="syncCopyButton" type="button">Copy</button>
    </div>
    <div class="sync-status-line" id="syncStatusLine">Saved locally on this device.</div>
    <div class="sync-divider"></div>
    <div class="sync-existing-label">Use an existing code</div>
    <div class="sync-existing-row">
      <input class="sync-existing-input" id="syncExistingInput" maxlength="24" placeholder="DBT-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false">
      <button class="sync-use" id="syncUseButton" type="button">Use code</button>
    </div>
    <div class="sync-warning">Anyone who has this code can load and change these Home/Calendar choices. Keep it private.</div>
  </div>
</div>

<div class="target-picker-backdrop" id="targetPickerBackdrop" aria-hidden="true">
  <div class="target-picker" role="dialog" aria-modal="true" aria-labelledby="targetPickerTitle">
    <div class="target-picker-head">
      <div><div class="section-kicker">MAIN COUNTDOWN</div><h3 id="targetPickerTitle">Choose target exam</h3></div>
      <button class="target-picker-close" id="targetPickerClose" type="button" aria-label="Close">×</button>
    </div>
    <input class="target-picker-search" id="targetPickerSearch" type="search" placeholder="Search exam or university…">
    <div class="target-picker-list" id="targetPickerList"></div>
  </div>
</div>

<div class="event-drawer-backdrop" id="eventDrawerBackdrop" aria-hidden="true">
  <aside class="event-drawer" id="eventDrawer">
    <button class="event-drawer-close" id="eventDrawerClose" type="button">×</button>
    <div class="event-drawer-kicker">ADMISSION EVENT</div>
    <h3 id="eventDrawerTitle">—</h3>
    <div class="event-drawer-date" id="eventDrawerDate">—</div>
    <div class="event-drawer-status" id="eventDrawerStatus">Confirmed</div>
    <div class="event-drawer-note" id="eventDrawerNote">—</div>
    <div class="event-drawer-actions"><button class="btn" id="eventDrawerStar" type="button">☆ Add to targets</button><button class="btn primary" id="eventDrawerClose2" type="button">Done</button></div>
  </aside>
</div>

<nav class="mobile-dock" aria-label="Quick navigation">
  <a href="#dashboard"><b>⌂</b>Home</a>
  <a href="#targets"><b>★</b>Targets</a>
  <a href="#circulars"><b>◎</b>Circulars</a>
  <a href="#calendar"><b>▦</b>Calendar</a>
  <a href="#infoCenter"><b>≡</b>Info</a>
</nav>
<script>
let TARGET=new Date('2026-12-05T10:00:00+06:00'); const START=new Date('2026-09-05T00:00:00+06:00');
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
  daysEl.textContent=days;weeksEl.textContent=String(weeks).padStart(2,'0');
  hoursEl.textContent=String(h).padStart(2,'0');minsEl.textContent=String(m).padStart(2,'0');secsEl.textContent=String(s).padStart(2,'0');
  const p=span>0?Math.max(0,Math.min(100,((now-START)/span)*100)):0;
  fill.style.width=p+'%';pct.textContent=p.toFixed(1)+'%';passedEl.textContent=passed+' Passed';totalEl.textContent=total+' Total';
  const ph=phaseFor(days);
  heroPhase.textContent=ph.name;heroMessage.textContent=ph.msg;
  statPhase.textContent=ph.stat;statPhaseNote.textContent=ph.note;
}const daysEl=document.getElementById('days'),weeksEl=document.getElementById('weeks'),hoursEl=document.getElementById('hours'),minsEl=document.getElementById('mins'),secsEl=document.getElementById('secs'),fill=document.getElementById('fill'),pct=document.getElementById('pct'),passedEl=document.getElementById('passed'),totalEl=document.getElementById('total'); countdown();setInterval(countdown,1000);
let all=[],view=new Date(2026,11,1),sourceHealth=[];
const STAR_KEY='admissionbydbt-starred-v1';
const COUNTDOWN_TARGET_KEY='admissionbydbt-countdown-target-v1';
const HOME_SYNC_CODE_KEY='admissionbydbt-home-sync-code-v1';
const HOME_SYNC_STATE_KEY='admissionbydbt-home-sync-state-v1';
let homeSyncCode='';
try{homeSyncCode=localStorage.getItem(HOME_SYNC_CODE_KEY)||''}catch(e){}
let homeSyncState=null;
try{homeSyncState=JSON.parse(localStorage.getItem(HOME_SYNC_STATE_KEY)||'null')}catch(e){homeSyncState=null}
let homeSyncTimer=null,homeSyncApplying=false,homeSyncConfigured=true;
let countdownTargetKey='';
try{countdownTargetKey=localStorage.getItem(COUNTDOWN_TARGET_KEY)||''}catch(e){}
let starred=new Set();
try{starred=new Set(JSON.parse(localStorage.getItem(STAR_KEY)||'[]'))}catch(e){starred=new Set()}

function eventKey(e){return e.title+'|'+e.date}
function isStarred(e){return starred.has(eventKey(e))}
function saveStars(){localStorage.setItem(STAR_KEY,JSON.stringify([...starred]))}
function normalizeSyncCode(v){
  const raw=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!raw)return '';
  const body=raw.startsWith('DBT')?raw.slice(3):raw;
  return 'DBT-'+body.slice(0,4)+'-'+body.slice(4,8)+'-'+body.slice(8,12)+'-'+body.slice(12,16);
}
function compactSyncCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function validSyncCode(v){return /^DBT[A-HJ-NP-Z2-9]{16}$/.test(compactSyncCode(v))}
function generateSyncCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let body='';for(let i=0;i<16;i++)body+=alphabet[bytes[i]%alphabet.length];
  return normalizeSyncCode('DBT'+body);
}
function ensureSyncCode(){
  if(validSyncCode(homeSyncCode))return normalizeSyncCode(homeSyncCode);
  homeSyncCode=generateSyncCode();
  try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
  return homeSyncCode;
}
function currentSyncState(updatedAt=Date.now()){
  return {version:1,updatedAt,starred:[...starred],countdownTargetKey,calendarView,calendarFilter};
}
function saveLocalSyncState(updatedAt=Date.now()){
  if(homeSyncApplying)return;
  const state=currentSyncState(updatedAt);
  homeSyncState=state;
  try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
  queueCloudSync();
}
function setSyncUi(mode,text){
  const b=document.getElementById('homeSyncButton'),t=document.getElementById('homeSyncText');
  if(!b||!t)return;
  b.classList.remove('saved','saving','offline');
  if(mode)b.classList.add(mode);
  t.textContent=text||'Sync';
}
function applySyncState(state){
  if(!state||typeof state!=='object')return;
  homeSyncApplying=true;
  if(Array.isArray(state.starred)){
    starred=new Set(state.starred);
    try{localStorage.setItem(STAR_KEY,JSON.stringify([...starred]))}catch(e){}
  }
  countdownTargetKey=String(state.countdownTargetKey||'');
  try{
    if(countdownTargetKey)localStorage.setItem(COUNTDOWN_TARGET_KEY,countdownTargetKey);
    else localStorage.removeItem(COUNTDOWN_TARGET_KEY);
  }catch(e){}
  if(['month','timeline','upcoming'].includes(state.calendarView))calendarView=state.calendarView;
  if(['all','confirmed','engineering','medical','university','starred'].includes(state.calendarFilter))calendarFilter=state.calendarFilter;
  homeSyncState=state;
  try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
  homeSyncApplying=false;
}
async function fetchCloudSync(){
  if(!validSyncCode(homeSyncCode))return null;
  const r=await fetch('/api/home-sync',{headers:{'x-dbt-sync-code':homeSyncCode},cache:'no-store'});
  if(r.status===404)return null;
  if(r.status===503){homeSyncConfigured=false;throw new Error('storage_not_configured')}
  if(!r.ok)throw new Error('sync_load_failed');
  const j=await r.json();
  return j&&j.state?j.state:null;
}
async function pushCloudSync(){
  if(!validSyncCode(homeSyncCode)||homeSyncApplying)return;
  try{
    setSyncUi('saving','Saving…');
    const state=currentSyncState(Date.now());
    homeSyncState=state;
    try{localStorage.setItem(HOME_SYNC_STATE_KEY,JSON.stringify(state))}catch(e){}
    const r=await fetch('/api/home-sync',{method:'PUT',headers:{'Content-Type':'application/json','x-dbt-sync-code':homeSyncCode},body:JSON.stringify(state),cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(r.status===409&&j.state){
      applySyncState(j.state);render();setSyncUi('saved','Saved');return;
    }
    if(r.status===503){homeSyncConfigured=false;setSyncUi('offline','Local');return}
    if(!r.ok)throw new Error('sync_save_failed');
    setSyncUi('saved','Saved');
  }catch(e){
    setSyncUi('offline',navigator.onLine?'Local':'Offline');
  }
}
function queueCloudSync(){
  if(!validSyncCode(homeSyncCode))return;
  clearTimeout(homeSyncTimer);
  homeSyncTimer=setTimeout(pushCloudSync,550);
}
async function initializeSecretSync(){
  // Always provision a stable device sync code on first load so cloud backup
  // starts automatically without requiring the user to open/click Sync first.
  if(!validSyncCode(homeSyncCode))homeSyncCode=ensureSyncCode();
  homeSyncCode=normalizeSyncCode(homeSyncCode);
  try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
  try{
    const cloud=await fetchCloudSync();
    const local=homeSyncState;
    if(cloud&&(!local||Number(cloud.updatedAt||0)>=Number(local.updatedAt||0))){
      applySyncState(cloud);render();
    }else if(local&&(!cloud||Number(local.updatedAt||0)>Number(cloud.updatedAt||0))){
      await pushCloudSync();
    }else if(!cloud){
      await pushCloudSync();
    }
    if(homeSyncConfigured)setSyncUi('saved','Saved');
  }catch(e){
    setSyncUi('offline',navigator.onLine?'Local':'Offline');
  }
}
function openSyncModal(){
  homeSyncCode=ensureSyncCode();
  syncCodeText.textContent=homeSyncCode;
  syncExistingInput.value='';
  syncStatusLine.textContent=homeSyncConfigured?(navigator.onLine?'Your choices sync automatically when they change.':'Offline — changes stay saved locally until internet returns.'):'Cloud sync storage is not connected yet; choices remain saved locally.';
  syncModalBackdrop.classList.add('open');syncModalBackdrop.setAttribute('aria-hidden','false');
  if(!homeSyncState)saveLocalSyncState();
  else if(navigator.onLine)pushCloudSync();
}
function closeSyncModal(){syncModalBackdrop.classList.remove('open');syncModalBackdrop.setAttribute('aria-hidden','true')}
async function useExistingSyncCode(){
  const code=normalizeSyncCode(syncExistingInput.value);
  if(!validSyncCode(code)){syncStatusLine.textContent='That code is not valid.';return}
  syncUseButton.disabled=true;syncStatusLine.textContent='Loading this code…';
  try{
    const oldCode=homeSyncCode;
    homeSyncCode=code;
    const cloud=await fetchCloudSync();
    if(!cloud){
      homeSyncCode=oldCode;
      syncStatusLine.textContent='No saved data was found for that code.';
      return;
    }
    try{localStorage.setItem(HOME_SYNC_CODE_KEY,homeSyncCode)}catch(e){}
    applySyncState(cloud);render();
    syncCodeText.textContent=homeSyncCode;
    syncExistingInput.value='';
    setSyncUi('saved','Saved');
    syncStatusLine.textContent='Synced. This device will keep using this code.';
  }catch(e){
    syncStatusLine.textContent=e&&e.message==='storage_not_configured'
      ?'Cloud sync is not connected yet. This device is saving locally only.'
      :'Could not load that code right now.';
  }finally{syncUseButton.disabled=false}
}
function setCountdownTarget(e){
  countdownTargetKey=e?eventKey(e):'';
  try{
    if(countdownTargetKey)localStorage.setItem(COUNTDOWN_TARGET_KEY,countdownTargetKey);
    else localStorage.removeItem(COUNTDOWN_TARGET_KEY);
  }catch(err){}
  if(e){
    TARGET=new Date(e.date);
    if(heroCountdownTarget)heroCountdownTarget.textContent='Main target • '+e.title+' • '+new Date(e.date).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'});
    if(mainTargetButton)mainTargetButton.classList.add('active');
  }else{
    if(heroCountdownTarget)heroCountdownTarget.textContent='Tap ⌖ to set the main countdown target';
    if(mainTargetButton)mainTargetButton.classList.remove('active');
  }
  countdown();
  renderStarredTargets();
  saveLocalSyncState();
  if(typeof closeTargetPicker==='function')closeTargetPicker();
}
function restoreCountdownTarget(){
  const selected=all.find(e=>eventKey(e)===countdownTargetKey);
  if(selected){
    TARGET=new Date(selected.date);
    if(heroCountdownTarget)heroCountdownTarget.textContent='Main target • '+selected.title+' • '+new Date(selected.date).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',year:'numeric'});
    if(mainTargetButton)mainTargetButton.classList.add('active');
    countdown();
    return;
  }
  if(countdownTargetKey){countdownTargetKey='';try{localStorage.removeItem(COUNTDOWN_TARGET_KEY)}catch(e){}}
  if(mainTargetButton)mainTargetButton.classList.remove('active');
  if(heroCountdownTarget)heroCountdownTarget.textContent='Tap ⌖ to set the main countdown target';
}
function toggleStar(e){
  const key=eventKey(e);
  const adding=!starred.has(key);
  if(adding) starred.add(key); else starred.delete(key);
  saveStars();
  saveLocalSyncState();
  if(adding&&typeof makeShooter==='function'&&!reduceMotion&&!mobileLite){
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
let calendarView=(homeSyncState&&['month','timeline','upcoming'].includes(homeSyncState.calendarView)?homeSyncState.calendarView:'month'),calendarFilter=(homeSyncState&&['all','confirmed','engineering','medical','university','starred'].includes(homeSyncState.calendarFilter)?homeSyncState.calendarFilter:'all'),drawerEvent=null;
function eventState(e){return e.status==='tentative'?'tentative':e.status==='pending'?'pending':'confirmed'}
function eventCategory(e){
  const t=(e.title||'').toLowerCase();
  if(/medical|dental|mbbs|bds|afmc|amc/.test(t))return 'medical';
  if(/buet|ruet|kuet|cuet|butex|mist|engineering|technology/.test(t))return 'engineering';
  return 'university';
}
function filtered(){
  const q=(search.value||'').toLowerCase().trim();
  return all.filter(e=>{
    if(q&&!e.title.toLowerCase().includes(q))return false;
    if(calendarFilter==='confirmed'&&eventState(e)!=='confirmed')return false;
    if(calendarFilter==='starred'&&!isStarred(e))return false;
    if(['engineering','medical','university'].includes(calendarFilter)&&eventCategory(e)!==calendarFilter)return false;
    return true;
  }).sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function eventTimeLabel(e){
  if(e.displayTime)return e.displayTime;
  if(eventState(e)!=='confirmed')return 'Time TBA';
  return new Date(e.date).toLocaleTimeString('en-BD',{timeZone:'Asia/Dhaka',hour:'numeric',minute:'2-digit'});
}
function calendarShortTitle(e){
  const t=String(e.title||'');
  const exact={
    'Medical & Dental':'MAT',
    'DU IBA':'DU-IBA',
    'Aviation and Aerospace University Bangladesh (AAUB)':'AAUB',
    'Dhaka University A / Science':'DU-A',
    'Dhaka University B / Arts, Law & Social Science':'DU-B',
    'Dhaka University Fine Arts':'DU-Fine Arts',
    'Dhaka University C / Business':'DU-C',
    'Khulna University A / Science':'KU-A',
    'Khulna University B / Life Science':'KU-B',
    'Khulna University C / Humanities':'KU-C',
    'Khulna University D / Business':'KU-D',
    'MIST C Unit':'MIST-C',
    'MIST A & B':'MIST-A/B',
    'Jagannath University A / Science':'JnU-A',
    'Jagannath University B / Humanities':'JnU-B',
    'Jagannath University C / Business':'JnU-C',
    'Jagannath University D / Social Science':'JnU-D',
    'Jagannath University E / Fine Arts':'JnU-E',
    'Agriculture Cluster':'ACAS',
    'Rajshahi University A / Humanities':'RU-A',
    'Rajshahi University B / Business':'RU-B',
    'Rajshahi University C / Science':'RU-C',
    'Chittagong University A / Science':'CU-A',
    'Chittagong University B':'CU-B',
    'Chittagong University B1':'CU-B1',
    'Chittagong University B2':'CU-B2',
    'Chittagong University C / Business':'CU-C',
    'Chittagong University D':'CU-D',
    'Chittagong University D1':'CU-D1',
    'Comilla University A':'CoU-A',
    'Comilla University B':'CoU-B',
    'Comilla University C':'CoU-C',
    'SUST A':'SUST-A',
    'SUST B':'SUST-B',
    'BUP BBA General':'BUP-BBA',
    'GST A / Science':'GST-A',
    'GST B / Humanities':'GST-B',
    'GST C / Business':'GST-C',
    'GST D / Architecture':'GST-D'
  };
  if(exact[t])return exact[t];
  if(/^BUP\s+/.test(t))return t.replace(/^BUP\s+/,'BUP-');
  return t;
}
function openEventDrawer(e){
  drawerEvent=e;
  const d=new Date(e.date),state=eventState(e);
  eventDrawerTitle.textContent=e.title;
  eventDrawerDate.textContent=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'full'})+' • '+eventTimeLabel(e);
  eventDrawerStatus.textContent=state==='confirmed'?'Confirmed / official date':state==='pending'?'Date announced / circular pending':'Tentative';
  eventDrawerStatus.className='event-drawer-status '+(state==='confirmed'?'':state);
  eventDrawerNote.textContent=e.agreement||'Use the latest official university notice for final details.';
  eventDrawerStar.textContent=isStarred(e)?(eventKey(e)===countdownTargetKey?'★ Countdown target':'★ In My Targets'):'☆ Add to targets';
  eventDrawerBackdrop.classList.add('open');eventDrawerBackdrop.setAttribute('aria-hidden','false');
}
function closeEventDrawer(){eventDrawerBackdrop.classList.remove('open');eventDrawerBackdrop.setAttribute('aria-hidden','true');drawerEvent=null}
function renderHeroNext(){restoreCountdownTarget()}
function renderTimeline(es){
  const now=new Date();
  let rows=calendarView==='upcoming'?es.filter(e=>new Date(e.date)>=now).slice(0,14):es;
  if(!rows.length){calendarList.innerHTML='<div class="calendar-list-shell"><div class="timeline-empty">No admission events match these filters.</div></div>';return}
  let lastMonth='',html='<div class="calendar-list-shell">';
  rows.forEach(e=>{
    const d=new Date(e.date),monthKey=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',month:'long',year:'numeric'});
    if(calendarView==='timeline'&&monthKey!==lastMonth){html+='<div class="timeline-month">'+esc(monthKey)+'</div>';lastMonth=monthKey}
    const state=eventState(e);
    html+='<div class="timeline-card" data-event-key="'+encodeURIComponent(eventKey(e))+'">'+
      '<div class="timeline-date"><b>'+d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',day:'2-digit'})+'</b><span>'+d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',month:'short',weekday:'short'})+'</span></div>'+
      '<div class="timeline-main"><strong>'+esc(calendarShortTitle(e))+'</strong><small>'+esc(eventTimeLabel(e))+(isStarred(e)?' • ★ Target':'')+'</small></div>'+
      '<div class="timeline-status '+(state==='confirmed'?'':state)+'">'+(state==='confirmed'?'Confirmed':state==='pending'?'Pending':'Tentative')+'</div>'+
    '</div>';
  });
  html+='</div>';calendarList.innerHTML=html;
  calendarList.querySelectorAll('[data-event-key]').forEach(row=>{
    row.onclick=()=>{const k=decodeURIComponent(row.dataset.eventKey||'');const e=all.find(x=>eventKey(x)===k);if(e)openEventDrawer(e)};
  });
}
function render(){
  calendar.dataset.view=calendarView;
  document.querySelectorAll('[data-calendar-view]').forEach(b=>b.classList.toggle('active',b.dataset.calendarView===calendarView));
  document.querySelectorAll('[data-calendar-filter]').forEach(b=>b.classList.toggle('active',b.dataset.calendarFilter===calendarFilter));
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
    const todays=es.filter(e=>{const x=bdDate(e.date);return x.getFullYear()==d.getFullYear()&&x.getMonth()==d.getMonth()&&x.getDate()==d.getDate()});
    todays.slice(0,4).forEach(e=>{
      const el=document.createElement('div');
      el.className='event'+(isStarred(e)?' starred':'');
      el.title=e.title+(e.agreement?' — '+e.agreement:'');
      el.onclick=()=>openEventDrawer(e);
      el.appendChild(starButton(e));
      const t=document.createElement('span');t.className='event-title';t.textContent=calendarShortTitle(e);el.appendChild(t);
      const state=eventState(e);
      if(state!=='confirmed'){const badge=document.createElement('span');badge.className='event-status '+state;badge.textContent=state==='tentative'?'Tentative':'Pending';el.appendChild(badge)}
      cell.appendChild(el);
    });
    if(todays.length>4){const more=document.createElement('div');more.className='event-status pending';more.textContent='+'+(todays.length-4)+' more';cell.appendChild(more)}
    grid.appendChild(cell);
  }
  renderTimeline(es);
  renderStarredTargets();
  renderHeroNext();
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
  if(typeof statConfirmed!=='undefined'&&statConfirmed)statConfirmed.textContent=all.filter(e=>eventState(e)==='confirmed').length;
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
    starredCards.innerHTML='<div class="target-empty">☆ Star an exam from the calendar to keep it in My Target Exams.</div>';
    return;
  }
  starredCards.innerHTML=matches.map((e,i)=>{
    const d=new Date(e.date),v=splitCountdown(e.date),key=encodeURIComponent(eventKey(e));
    const date=d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'full'});
    const time=eventTimeLabel(e);
    const message=v.done?'Exam time / completed':(v.d<=7?'Final stretch — keep revision tight.':v.d<=30?'Revision matters more than collecting new topics.':'Keep going — '+v.d+' days to this target.');
    return '<article class="starred-card" data-star-key="'+key+'">'+
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
function renderTargetPicker(){
  const q=(targetPickerSearch.value||'').toLowerCase().trim();
  const rows=all.filter(e=>new Date(e.date)>new Date()&&(!q||e.title.toLowerCase().includes(q))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!rows.length){targetPickerList.innerHTML='<div class="target-picker-empty">No upcoming exam matches your search.</div>';return}
  targetPickerList.innerHTML=rows.map(e=>{
    const active=eventKey(e)===countdownTargetKey,d=new Date(e.date),key=encodeURIComponent(eventKey(e));
    return '<button type="button" class="target-picker-row'+(active?' active':'')+'" data-main-target="'+key+'"><span><strong>'+esc(e.title)+'</strong><small>'+esc(d.toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',dateStyle:'medium'}))+' • '+esc(eventTimeLabel(e))+'</small></span><span class="target-picker-check">'+(active?'✓':'›')+'</span></button>';
  }).join('');
  targetPickerList.querySelectorAll('[data-main-target]').forEach(btn=>btn.onclick=()=>{
    const raw=decodeURIComponent(btn.dataset.mainTarget||'');
    const e=all.find(x=>eventKey(x)===raw);
    if(e)setCountdownTarget(e);
  });
}
function openTargetPicker(){
  targetPickerSearch.value='';
  renderTargetPicker();
  targetPickerBackdrop.classList.add('open');
  targetPickerBackdrop.setAttribute('aria-hidden','false');
  setTimeout(()=>targetPickerSearch.focus(),30);
}
function closeTargetPicker(){targetPickerBackdrop.classList.remove('open');targetPickerBackdrop.setAttribute('aria-hidden','true')}
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
mainTargetButton.onclick=openTargetPicker;
homeSyncButton.onclick=openSyncModal;
syncModalClose.onclick=closeSyncModal;
syncModalBackdrop.onclick=e=>{if(e.target===syncModalBackdrop)closeSyncModal()};
syncCopyButton.onclick=async()=>{try{await navigator.clipboard.writeText(homeSyncCode);syncStatusLine.textContent='Code copied.'}catch(e){syncStatusLine.textContent='Copy failed — press and hold the code to copy it.'}};
syncUseButton.onclick=useExistingSyncCode;
syncExistingInput.oninput=()=>{syncExistingInput.value=syncExistingInput.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')};
targetPickerClose.onclick=closeTargetPicker;
targetPickerBackdrop.onclick=e=>{if(e.target===targetPickerBackdrop)closeTargetPicker()};
targetPickerSearch.oninput=renderTargetPicker;
calendarViewSwitch.querySelectorAll('[data-calendar-view]').forEach(btn=>btn.onclick=()=>{calendarView=btn.dataset.calendarView;saveLocalSyncState();render()});
calendarFilters.querySelectorAll('[data-calendar-filter]').forEach(btn=>btn.onclick=()=>{calendarFilter=btn.dataset.calendarFilter;saveLocalSyncState();render()});
eventDrawerClose.onclick=closeEventDrawer;eventDrawerClose2.onclick=closeEventDrawer;
eventDrawerBackdrop.onclick=e=>{if(e.target===eventDrawerBackdrop)closeEventDrawer()};
eventDrawerStar.onclick=()=>{if(!drawerEvent)return;const current=drawerEvent;toggleStar(current);drawerEvent=current;openEventDrawer(current)};
addEventListener('keydown',e=>{if(e.key==='Escape'){if(syncModalBackdrop.classList.contains('open'))closeSyncModal();else if(targetPickerBackdrop.classList.contains('open'))closeTargetPicker();else if(eventDrawerBackdrop.classList.contains('open'))closeEventDrawer()}});
addEventListener('online',()=>{if(validSyncCode(homeSyncCode))pushCloudSync()});
addEventListener('storage',e=>{if(e.key===HOME_SYNC_STATE_KEY&&e.newValue){try{const s=JSON.parse(e.newValue);if(Number(s.updatedAt||0)>Number(homeSyncState?.updatedAt||0)){applySyncState(s);render()}}catch(err){}}});
addEventListener('resize',()=>{calendar.dataset.view=calendarView});
load().then(()=>initializeSecretSync());
setInterval(updateStarredTimers,1000);
setInterval(()=>{if(validSyncCode(homeSyncCode)&&navigator.onLine)initializeSecretSync()},30000);

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
    current:["ক্যালেন্ডারে ১৪ জানুয়ারি ২০২৭ পরীক্ষা ট্র্যাক করা হচ্ছে; তবে ৭ অক্টোবর ২০২৬ পর্যন্ত RUET-এর অফিসিয়াল admission material-এ পূর্ণ ২০২৬–২৭ undergraduate circular পাওয়া যায়নি।","অফিসিয়াল সাইটে এখনও ২০২৫–২৬ circular দৃশ্যমান; তাই eligibility, fee, seats, application dates ও detailed exam rules previous-year reference মাত্র।"],
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
    current:["২০২৬–২৭ ক্যালেন্ডারে C Unit — ১৮ ডিসেম্বর এবং A & B — ১৯ ডিসেম্বর ২০২৬ দেখানো হচ্ছে; তবে ৭ অক্টোবর ২০২৬ পর্যন্ত MIST-এর অফিসিয়াল admission portal এখনও ২০২৫–২৬ cycle দেখাচ্ছে।","তাই ২০২৬–২৭ eligibility, fee, seat, marks distribution ও application dates নতুন অফিসিয়াল circular না আসা পর্যন্ত final নয়।"],
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
    current:["বর্তমান ক্যালেন্ডারে B/Business — ৮ জানুয়ারি, C/Science — ৯ জানুয়ারি এবং A/Humanities — ১৬ জানুয়ারি ২০২৭ ট্র্যাক করা হচ্ছে।","৭ অক্টোবর ২০২৬ পর্যন্ত নতুন পূর্ণ অফিসিয়াল ২০২৬–২৭ undergraduate circular পাওয়া যায়নি; eligibility, fee, seats, application dates ও detailed exam rules তাই pending।"],
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
    current:["২০২৬–২৭ অফিসিয়াল admission schedule available: A — ১ জানুয়ারি; E — ৮ জানুয়ারি; B — ১৫ জানুয়ারি; C — ২২ জানুয়ারি; D — ২৩ জানুয়ারি ২০২৭।","২০২৬–২৭ application information ও eligibility-ও অফিসিয়াল admission source-এ available; current official source-কে previous-year reference-এর ওপর অগ্রাধিকার দিন।"],
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
    current:["২০২৬–২৭ A Unit — ২৬ জানুয়ারি এবং B Unit — ২৭ জানুয়ারি ২০২৭ তারিখ নিশ্চিত।","পূর্ণ application/test-plan circular ৭ অক্টোবর ২০২৬ পর্যন্ত pending; পুরোনো eligibility, fee বা seat data-কে current হিসেবে ব্যবহার করা যাবে না।"],
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
    current:["২০২৬–২৭ অফিসিয়াল schedule/application announcement available: C — ২৯ জানুয়ারি; A — ৩০ জানুয়ারি; B1 — ৩ ফেব্রুয়ারি; B2 — ৪ ফেব্রুয়ারি; B — ৫ ফেব্রুয়ারি; D — ৬ ফেব্রুয়ারি; D1 — ৮ ফেব্রুয়ারি ২০২৭।","Current 2026–27 official admission source-কে previous-year prospectus-এর ওপর অগ্রাধিকার দিন।"],
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
    current:["অফিসিয়ালি ঘোষিত ২০২৬–২৭ পরীক্ষার তারিখ: A — ৫ ফেব্রুয়ারি; B — ৬ ফেব্রুয়ারি; C — ৭ ফেব্রুয়ারি ২০২৭।","পূর্ণ detailed circular/application schedule ৭ অক্টোবর ২০২৬ পর্যন্ত pending; aggregator application dates-কে final হিসেবে দেখানো হবে না।"],
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
    current:["ঘোষিত ২০২৬–২৭ exam dates: B/Humanities — ১৯ মার্চ; C/Business ও D/Architecture — ২০ মার্চ; A/Science — ২৭ মার্চ ২০২৭।","পূর্ণ official application circular ৭ অক্টোবর ২০২৬ পর্যন্ত pending; eligibility, fee, seats ও detailed rules current circular ছাড়া final নয়।"],
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
    current:["ক্যালেন্ডারে ২০২৬–২৭ পরীক্ষা ২ জানুয়ারি ২০২৭ ট্র্যাক করা হচ্ছে।","৭ অক্টোবর ২০২৬ পর্যন্ত নতুন পূর্ণ ২০২৬–২৭ ACAS circular পাওয়া যায়নি; eligibility, fee, seats, application schedule ও exam details pending।"],
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
    current:["২০২৬–২৭ MBBS/BDS-এর ৪ ডিসেম্বর ২০২৬ তারিখটি tentative calendar date; ৭ অক্টোবর ২০২৬ পর্যন্ত final DGME/DGHS domestic admission circular পাওয়া যায়নি।","Final exam date/time, eligibility, fee, seats, application schedule ও marks rules শুধুমাত্র নতুন DGME/DGHS circular প্রকাশের পর current ধরা হবে।"],
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

  {p:"SUST",cat:"বিশ্ববিদ্যালয়",unit:"SUST ‘A’ Unit",seats:"৯৮৫ টি",elig:"SSC ও HSC-তে পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫; HSC-তে গণিতে ন্যূনতম GPA ৩।",exam:"Group-1 (A1): MCQ ৮০ নম্বর, ১ ঘণ্টা ৩০ মিনিট। Group-2 (A2): Architecture ৩০ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A1: পদার্থ ২০, রসায়ন ২০, গণিত ২০, ঐচ্ছিক জীববিজ্ঞান/ইংরেজি ২০। A2: Drawing ও Architecture GK ৩০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"DU ‘KA’ Unit",seats:"১৮৯১ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর নয়।",marks:"MCQ: Physics + Chemistry + নৈর্বাচনিক (৪র্থ বিষয়/বাংলা/ইংরেজি) যেকোনো ১টি; প্রতিটি বিষয়ে ১৫ প্রশ্ন/১৫ নম্বর। Written: প্রতিটি বিষয়ে ১০ নম্বর; প্রশ্নের মান ২–৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JU ‘A & D’ Unit",seats:"৭৩৬ টি (ছেলে ৩৬৮, মেয়ে ৩৬৮)",elig:"A Unit: SSC+HSC মোট GPA ৮.৫০, পৃথকভাবে কমপক্ষে ৪। D Unit: মোট GPA ৯, পৃথকভাবে কমপক্ষে ৪।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট; ক্যালকুলেটর নয়।",marks:"A: গণিত ২২, পদার্থ ২২, রসায়ন ২২, বাংলা ৩, ইংরেজি ৩, ICT ৮। D: বাংলা ৪, ইংরেজি ৪, রসায়ন ২৪, উদ্ভিদবিজ্ঞান ২২, প্রাণিবিজ্ঞান ২২, বুদ্ধিমত্তা ৪।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JnU ‘A’ Unit",seats:"৮৪০ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩.২৫ এবং মোট GPA ৭.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"পদার্থবিজ্ঞান ২৪, রসায়ন ২৪, গণিত/জীববিজ্ঞান ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC থেকে ১০ + HSC থেকে ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"RU ‘C’ Unit",seats:"১৫৩৬ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫ এবং মোট GPA ৮।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"ক আবশ্যিক: পদার্থ ২৫×১.২৫, রসায়ন ২৫×১.২৫, ICT ৫×১.২৫। খ ঐচ্ছিক: গণিত/জীববিজ্ঞান ২৫×১.২৫ যেকোনো ১টি, অথবা জীববিজ্ঞান ১৩×১.২৫ + গণিত ১২×১.২৫।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CU ‘A’ Unit",seats:"১০৯৩ টি",elig:"SSC+HSC ৪র্থ বিষয়সহ মোট GPA ৮; SSC-তে ন্যূনতম GPA ৪ এবং HSC-তে ন্যূনতম GPA ৩।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"ইংরেজি ২৫; পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান—যেকোনো ৩টি ×২৫ = ৭৫।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে অতিরিক্ত tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"বিশ্ববিদ্যালয়",unit:"BUP (FST)",seats:"৩০০ টি",elig:"SSC+HSC মোট GPA ৯; HSC-তে Physics, Chemistry, Biology-তে A এবং English-এ কমপক্ষে A−।",exam:"৬০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"গণিত ২০, জীববিজ্ঞান ২০, পদার্থবিজ্ঞান ২০, রসায়ন ২০—৪টির মধ্যে ৩টি বিষয়ের উত্তর।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"GST ‘A’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"বিজ্ঞান বিভাগের প্রায় ৫৯৯৪ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.২৫ এবং মোট GPA কমপক্ষে ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫ + Chemistry ২৫ + Math/Biology ২৫-এর যেকোনো ১টি; অপরটির বদলে Bangla/English ২৫ দেওয়া যাবে।",result:"শুধু ভর্তি পরীক্ষার নম্বরের ভিত্তিতে মেধাক্রম; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"KU ‘A & B’ Unit",seats:"৬০১ টি",elig:"SSC ও HSC মোট GPA ৮।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট; ক্যালকুলেটর ব্যবহার করা যাবে।",marks:"A MCQ: Math ১৫, Physics ১৫, Chemistry ১৫, English ১০, ICT ৫; Written: Math ১০, Physics ১০, Chemistry ১০, English ৫, ICT ৫। B MCQ: Biology ১৫, Chemistry ১২, Math ১২, Physics ১২, English ৯; Written: Biology ১০, Chemistry ৮, Math ৮, Physics ৮, English ৬।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CoU ‘A’ Unit",seats:"৩০০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Physics ২৫, Chemistry ২৫ এবং (Bangla+English ২৫) / Math ২৫ / Biology ২৫—এই ৩ option থেকে যেকোনো ২টি।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কৃষি গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"কৃষি গুচ্ছ (৯ বিশ্ববিদ্যালয়)",seats:"৩৭০১ টি",elig:"SSC ও HSC-তে Biology, Chemistry, Physics, Mathematicsসহ উত্তীর্ণ; ৪র্থ বিষয় ব্যতীত প্রতিটিতে ন্যূনতম GPA ৪ এবং SSC+HSC মোট GPA ৮.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"Math ২০, Physics ২০, Chemistry ২০, Botany ১৫, Zoology ১৫, English ১০।",result:"ভর্তি পরীক্ষার নম্বর + SSC ২৫ + HSC ২৫।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"HSTU ‘A, B’ Unit",seats:"১২৭৫ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩.৫০ এবং মোট GPA ৭.৫০।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা; ক্যালকুলেটর নয়।",marks:"A: Physics ২৫, Chemistry ২৫, Biology ২৫, English ২৫। B: Physics ২৫, Chemistry ২৫, Mathematics ২৫, English ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"},

  {p:"ঢাকা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"DU ‘KHA’ Unit",seats:"২৯৩৪ টি (মানবিক ১৬৯৪, বিজ্ঞান ৯৬২, ব্যবসায় শিক্ষা ২৭৮)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৭.৫।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা/Advanced English ১৫ + General English ১৫ + GK ৩০। Written: বাংলা/Advanced English ২০ + General English ২০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JU ‘B & C’ Unit",seats:"৮৫৬ টি (ছেলে ৪২৮, মেয়ে ৪২৮)",elig:"মানবিক ও ব্যবসায় শিক্ষার জন্য SSC+HSC মোট GPA ৭.৫; পৃথকভাবে ন্যূনতম GPA ৩.৫।",exam:"৮০ নম্বর MCQ, সময় ৫৫ মিনিট।",marks:"B: বাংলা ২০, English ২০, সাধারণ গণিত ২০, GK ১৫, Logical Analysis ৫। C: বাংলা ২০, English ২০, GK ও বিভাগ-সংশ্লিষ্ট ৪০। C1: বাংলা ১০, English ১০, GK ২০, বিভাগ-সংশ্লিষ্ট ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×1.5) + (HSC GPA×2.5)।"},
  {p:"জগন্নাথ বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"JnU ‘B & D’ Unit",seats:"১৩৯৫ টি (কলা ও আইন ৭৮৫, সামাজিক বিজ্ঞান ৬১০)",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬.৫।",exam:"MCQ ৭২ নম্বর, ১ ঘণ্টা।",marks:"B: বাংলা ২৪, English ২৪, GK ২৪। D: বাংলা ২৪, English ২৪, গাণিতিক বুদ্ধিমত্তা ও GK ২৪।",result:"ভর্তি পরীক্ষার নম্বর + SSC ১০ + HSC ১৮।"},
  {p:"রাজশাহী বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"RU ‘A’ Unit",seats:"১৮৯৭ টি (কলা ৯৩১, আইন ১৬০, সামাজিক বিজ্ঞান ৬৩৬, চারুকলা ১২০, IER ৫০)",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৭।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, ইংরেজি ৩৫, সাধারণ জ্ঞান ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"চট্টগ্রাম বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CU ‘B & D’ Unit",seats:"১৯৯৪ টি (কলা ৯৭০, সমাজবিজ্ঞান ৮৮৯, চারুকলা ১৩৫)",elig:"B/B1/B2: SSC GPA ৩, HSC GPA ২.৫, মোট ৬.৫। D: SSC GPA ৩.৫, HSC GPA ৩, মোট ৭.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"B: বাংলা/ঐচ্ছিক English ৩০, English ৩০, GK ৪০। B1: বাংলা/ঐচ্ছিক English ২৫, English ২৫, GK ৫০। B2: বাংলা/ঐচ্ছিক English ২০, English ২০, Arabic/Islamic Studies/Pali/GK থেকে যেকোনো ২টি ×৩০। D: বাংলা/ঐচ্ছিক English ৩০, English ৩০, Analytical Ability ২০, GK/Math/Economics ২০।",result:"ভর্তি পরীক্ষার নম্বর; সমান স্কোরে tie-break শর্ত প্রযোজ্য।"},
  {p:"BUP",cat:"বিশ্ববিদ্যালয়",unit:"BUP (FASS & FSSS)",seats:"৬০০ টি (FASS ৩৫০, FSSS ২৫০)",elig:"FASS: SSC+HSC মোট GPA ৭.৫–৮। FSSS: SSC+HSC মোট GPA ৮–৮.৫।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ৪০, General Knowledge ৪০, বাংলা ২০।",result:"ভর্তি পরীক্ষা ৫৫% + SSC ২০% + HSC ২৫%।"},
  {p:"GST গুচ্ছ",cat:"বিশ্ববিদ্যালয়",unit:"GST ‘B’ Unit (২০ বিশ্ববিদ্যালয়)",seats:"মানবিক বিভাগের প্রায় ৩০০০ টি",elig:"SSC ও HSC উভয় পরীক্ষায় ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ৩৫, English ৩৫, General Knowledge ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বর; পাশ নম্বর ৩০; পরে বিশ্ববিদ্যালয়ভেদে নিজস্ব ভর্তি নীতি।"},
  {p:"খুলনা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"KU ‘C’ Unit",seats:"৪১৫ টি",elig:"SSC ও HSC মোট GPA ৭।",exam:"১০০ নম্বর: MCQ ৬০ + Written ৪০; সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"MCQ: বাংলা ১০, English ২৫, GK ২৫। Written: বাংলা ১০, English ৩০।",result:"শুধু ভর্তি পরীক্ষার নম্বরের উপর মেধাতালিকা।"},
  {p:"SUST",cat:"বিশ্ববিদ্যালয়",unit:"SUST ‘B’ Unit",seats:"৫৮১ টি",elig:"SSC ও HSC পৃথকভাবে ন্যূনতম GPA ৩ এবং মোট GPA ৬।",exam:"৮০ নম্বর MCQ, সময় ১ ঘণ্টা ৩০ মিনিট।",marks:"English ১৫, বাংলা ১৫, সাধারণ গণিত ১৫, বাংলাদেশ ও আন্তর্জাতিক ১০, ICT ১০, অর্থনীতি/পৌরনীতি/সমাজবিজ্ঞান/সমাজকল্যাণ/ইতিহাস সম্পর্কিত ১৫।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"কুমিল্লা বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"CoU ‘B’ Unit",seats:"৩৯০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মানবিক থেকে মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"English ২৫, বাংলা ২৫, General Knowledge ১০, মানবিক শাখার বিষয়ভিত্তিক ৪০।",result:"ভর্তি পরীক্ষার নম্বর + (SSC GPA×2) + (HSC GPA×2)।"},
  {p:"হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",cat:"বিশ্ববিদ্যালয়",unit:"HSTU ‘D’ Unit",seats:"২৪০ টি",elig:"SSC ও HSC ৪র্থ বিষয়সহ পৃথকভাবে GPA ৩ এবং মোট GPA ৬।",exam:"১০০ নম্বর MCQ, ১ ঘণ্টা।",marks:"বাংলা ২৫, English ৫০, General Knowledge ২৫।",result:"ভর্তি পরীক্ষার নম্বর + SSC ৪০% + HSC ৬০%।"}
];


const CATEGORY_ORDER = [
  "বিশ্ববিদ্যালয়",
  "ইঞ্জিনিয়ারিং",
  "মেডিকেল ও ডেন্টাল"
];

const CATEGORY_LABELS = {
  "বিশ্ববিদ্যালয়":"বিশ্ববিদ্যালয়",
  "ইঞ্জিনিয়ারিং":"ইঞ্জিনিয়ারিং",
  "মেডিকেল ও ডেন্টাল":"মেডিকেল"
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

function smoothPageJump(target){
  if(!target)return;
  const startY=window.scrollY||window.pageYOffset||0;
  const nav=document.querySelector('.topnav');
  const offset=(nav?nav.getBoundingClientRect().height:0)+16;
  const targetY=Math.max(0,target.getBoundingClientRect().top+startY-offset);
  const distance=targetY-startY;
  if(Math.abs(distance)<2)return;
  const duration=Math.min(720,Math.max(360,Math.abs(distance)*0.34));
  const start=performance.now();
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function step(now){
    const p=Math.min(1,(now-start)/duration);
    window.scrollTo(0,startY+distance*ease(p));
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
document.querySelectorAll('.navlinks a[href^="#"],.mobile-dock a[href^="#"]').forEach(link=>{
  link.addEventListener('click',ev=>{
    const sel=link.getAttribute('href');
    const target=sel&&document.querySelector(sel);
    if(!target)return;
    ev.preventDefault();
    smoothPageJump(target);
    try{history.replaceState(null,'',sel)}catch(e){}
  });
});



const cv=document.getElementById('stars'),ctx=cv.getContext('2d',{alpha:true});
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let coarse=matchMedia('(pointer: coarse)').matches;
let mobileLite=innerWidth<=700||coarse;
let W=innerWidth,H=innerHeight,dpr=1,stars=[],shooters=[],dust=[];
let targetX=W*.5,targetY=H*.45,camX=targetX,camY=targetY;
let lastShot=0,lastFrame=performance.now(),running=true,tapPulse=0;

function rand(min,max){return min+Math.random()*(max-min)}

function resizeSpace(){
  W=innerWidth;H=innerHeight;
  coarse=matchMedia('(pointer: coarse)').matches;
  mobileLite=innerWidth<=700||coarse;
  dpr=Math.min(devicePixelRatio||1,mobileLite?1:1.6);
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
  const count=mobileLite?42:180;
  const dustCount=mobileLite?8:42;

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
  if(!mobileLite&&(e.pointerType==='mouse'||e.pointerType==='pen')) setPointer(e.clientX,e.clientY);
},{passive:true});

addEventListener('pointerdown',e=>{
  if(mobileLite)return;
  setPointer(e.clientX,e.clientY);
  tapPulse=1;
  if(!reduceMotion) makeShooter(true,e.clientX,e.clientY);
},{passive:true});

addEventListener('resize',()=>{resizeSpace();if(mobileLite)drawSpace(performance.now())},{passive:true});

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

    if(r>1.15&&!mobileLite){
      ctx.globalAlpha=s.alpha*.13*tw;
      ctx.beginPath();ctx.arc(x,y,r*3.8,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.globalAlpha=1;

  if(!mobileLite&&!reduceMotion&&now-lastShot>3200&&Math.random()<.035){
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
    ctx.lineWidth=1.35;
    ctx.beginPath();ctx.moveTo(sh.x,sh.y);ctx.lineTo(tailX,tailY);ctx.stroke();

    ctx.globalAlpha=a;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(sh.x,sh.y,coarse?1.2:1.55,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    if(sh.life<sh.max&&sh.x<W+180&&sh.y<H+180) alive.push(sh);
  }
  shooters=alive;

  if(!reduceMotion&&!mobileLite) requestAnimationFrame(drawSpace);
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
