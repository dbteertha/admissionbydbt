import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { HOW_TO_HTML } from '../lib/how-to.js';
import { get as blobGet, put as blobPut } from '@vercel/blob';

const PORT = process.env.PORT || 10000;
const SOURCES = [
  {name:'Chorcha', url:'https://chorcha.net/admission-calendar'},
  {name:'MNR Study', url:'https://study.mnr.bd/calendar'},
  {name:'Admission Calendar', url:'https://admission-calendar.com/'}
];

const CURATED_EVENTS = [
  ['Medical & Dental','2026-12-04T10:00:00+06:00','Not confirmed — 4 Dec depends on when the HSC result is published','Not confirmed'],
  ['DU IBA','2026-12-05T10:00:00+06:00','Official — 5 Dec 2026, 10:00 AM–12:00 PM','Official'],
  ['Aviation and Aerospace University Bangladesh (AAUB)','2026-12-05T10:00:00+06:00','Official — undergraduate test 5 Dec 2026','Official'],
  ['Dhaka University A / Science','2026-12-12T11:00:00+06:00','Official — 12 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Khulna University D / Business','2026-12-17T12:00:00+06:00','Confirmed date — time and instructions are not out yet','Time TBA'],
  ['Khulna University C / Humanities','2026-12-17T12:00:00+06:00','Confirmed date — time and instructions are not out yet','Time TBA'],
  ['Khulna University A / Science','2026-12-18T12:00:00+06:00','Confirmed date — time and instructions are not out yet','Time TBA'],
  ['Khulna University B / Life Science','2026-12-18T12:00:00+06:00','Confirmed date — time and instructions are not out yet','Time TBA'],
  ['MIST C Unit','2026-12-18','Date announced — 18 Dec 2026; detailed 2026–27 circular/application information and exact time are still pending — Full notice not out','Time TBA'],
  ['MIST A & B','2026-12-19','Date announced — 19 Dec 2026; detailed 2026–27 circular/application information and exact unit times are still pending — Full notice not out','Time TBA'],
  ['Dhaka University B / Arts, Law & Social Science','2026-12-19T11:00:00+06:00','Official — 19 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Dhaka University Fine Arts','2026-12-22T11:00:00+06:00','Official — 22 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Dhaka University C / Business','2026-12-26T11:00:00+06:00','Official — 26 Dec 2026, 11:00 AM–12:30 PM','Official'],
  ['Jagannath University A / Science','2027-01-01T10:00:00+06:00','Official 2026–27 schedule / admission information available','Confirmed date'],
  ['BUP FBS','2027-01-01','Official/current notice — first FBS date; keep 9 Jan too; exact time should be checked in the current detailed notice','Time TBA'],
  ['Agriculture Cluster','2027-01-02','Date listed — 2 Jan 2027; full 2026–27 ACAS notice and exact time are not out yet','Time TBA'],
  ['BUP FASS','2027-01-02','Official/current BUP notice — date tracked; exact time should be checked in the current detailed notice','Time TBA'],
  ['Jagannath University E / Fine Arts','2027-01-08T10:00:00+06:00','Official 2026–27 schedule / admission information available','Confirmed date'],
  ['KUET','2027-01-08T10:00:00+06:00','Official portal/circular — 8 Jan 2027; centres KUET, DU and RUET; MCQ','Official'],
  ['BUP FST','2027-01-08','Official/current BUP notice — date tracked; exact time should be checked in the current detailed notice','Time TBA'],
  ['BUP FET','2027-01-08','Official/current BUP notice — date tracked; exact time should be checked in the current detailed notice','Time TBA'],
  ['BUP FMS','2027-01-08','Official/current BUP notice — date tracked; exact time should be checked in the current detailed notice','Time TBA'],
  ['Rajshahi University B / Business','2027-01-08T11:00:00+06:00','Date listed — full official 2026–27 admission notice is not out yet','Time TBA'],
  ['BUP FSSS','2027-01-08','Current BUP notice — date tracked; exact time should be checked in the current detailed notice','Time TBA'],
  ['Rajshahi University C / Science','2027-01-09T11:00:00+06:00','Date listed — full official 2026–27 admission notice is not out yet','Time TBA'],
  ['BUP FBS','2027-01-09','Official/current notice — second FBS date; intentional, not duplicate; exact time should be checked in the current detailed notice','Time TBA'],
  ['BUP BBA General','2027-01-09','Date tracked for 9 Jan 2027; exact time should be checked in the current BUP detailed notice','Time TBA'],
  ['RUET','2027-01-14','Date tracked — 14 Jan 2027; exact time is not established by the current 2026–27 material','Time TBA'],
  ['Jagannath University B / Humanities','2027-01-15T10:00:00+06:00','Official 2026–27 schedule / admission information available','Confirmed date'],
  ['BUET','2027-01-16T09:00:00+06:00','Date announced — full 2026–27 notice is not out yet','Full notice not out'],
  ['Rajshahi University A / Humanities','2027-01-16T11:00:00+06:00','Date listed — full official 2026–27 admission notice is not out yet','Time TBA'],
  ['Jagannath University C / Business','2027-01-22T10:00:00+06:00','Official 2026–27 schedule / admission information available','Confirmed date'],
  ['Jagannath University D / Social Science','2027-01-23T10:00:00+06:00','Official 2026–27 schedule / admission information available','Confirmed date'],
  ['CUET','2027-01-23','Not confirmed — CUET describes 23 Jan 2027 as a probable/tentative admission-test date; exact time is not established','Time TBA'],
  ['SUST Admission Test (unit allocation pending)','2027-01-26','Only 26–27 Jan 2027 test days are established; A/B unit-wise day allocation is not yet established — Full notice not out','Time TBA'],
  ['SUST Admission Test (unit allocation pending)','2027-01-27','Only 26–27 Jan 2027 test days are established; A/B unit-wise day allocation is not yet established — Full notice not out','Time TBA'],
  ['BUTEX','2027-01-29T10:00:00+06:00','Official university announcement — 29 Jan 2027','Official'],
  ['Chittagong University C / Business','2027-01-29T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Chittagong University A / Science','2027-01-30T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Chittagong University B1','2027-02-03T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Chittagong University B2','2027-02-04T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Chittagong University B','2027-02-05T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Comilla University A','2027-02-05T11:00:00+06:00','Official university press release — 5 Feb 2027','Official'],
  ['Chittagong University D','2027-02-06T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['Comilla University B','2027-02-06T11:00:00+06:00','Official university press release — 6 Feb 2027','Official'],
  ['Comilla University C','2027-02-07T11:00:00+06:00','Official university press release — 7 Feb 2027','Official'],
  ['Chittagong University D1','2027-02-08T11:00:00+06:00','Official 2026–27 schedule / application announcement available','Confirmed date'],
  ['GST B / Humanities','2027-03-19T11:00:00+06:00','Committee schedule announced — 19 Mar 2027, 11:00 AM–12:00 PM; full application circular is still pending — Full notice not out','11:00 AM–12:00 PM'],
  ['GST C / Business','2027-03-20T11:00:00+06:00','Committee schedule announced — 20 Mar 2027, 11:00 AM–12:00 PM; full application circular is still pending — Full notice not out','11:00 AM–12:00 PM'],
  ['GST D / Architecture','2027-03-20T15:00:00+06:00','Committee schedule announced — 20 Mar 2027, 3:00–4:00 PM; full application circular is still pending — Full notice not out','3:00–4:00 PM'],
  ['GST A / Science','2027-03-27T11:00:00+06:00','Committee schedule announced — 27 Mar 2027, 11:00 AM–12:00 PM; full application circular is still pending — Full notice not out','11:00 AM–12:00 PM']
].map(([title,date,agreement,displayTime])=>({
  title,
  date:new Date(date).toISOString(),
  agreement,
  ...(displayTime?{displayTime}:{}),
  ...( /^\d{4}-\d{2}-\d{2}$/.test(date)?{dateOnly:true}:{} ),
  ...(agreement&&agreement.startsWith('Not confirmed')?{status:'tentative'}:{}),
  ...(agreement&&agreement.includes('Full notice not out')?{status:'pending'}:{})
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

const EVENTS_BLOB_STORE_ID='store_vUvKgnlBSMEysQyD';
const EVENTS_SNAPSHOT_PATH='cache/events-live.json';

async function eventsStreamToText(stream){
  const reader=stream.getReader();
  const dec=new TextDecoder();
  let out='';
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    out+=dec.decode(value,{stream:true});
    if(out.length>2_000_000)throw new Error('snapshot_too_large');
  }
  out+=dec.decode();
  return out;
}
function eventsFallback(){
  return {
    updatedAt:new Date().toISOString(),
    events:CURATED_EVENTS,
    sources:[{name:'Embedded curated schedule',ok:true,count:CURATED_EVENTS.length,mode:'fallback'}],
    fallback:true
  };
}
async function readEventsSnapshot(){
  try{
    const result=await blobGet(EVENTS_SNAPSHOT_PATH,{access:'private',useCache:false,storeId:EVENTS_BLOB_STORE_ID});
    if(result&&result.statusCode===200){
      const parsed=JSON.parse(await eventsStreamToText(result.stream));
      if(Array.isArray(parsed?.events)&&parsed.events.length>=CURATED_EVENTS.length){
        return {
          updatedAt:parsed.updatedAt||new Date().toISOString(),
          events:parsed.events,
          sources:Array.isArray(parsed.sources)?parsed.sources:[]
        };
      }
    }
  }catch(e){}
  return eventsFallback();
}
async function eventSyncAuthorized(req){
  const configured=process.env.SYNC_SECRET;
  const supplied=String(req.headers['x-sync-secret']||'');
  if(configured&&supplied&&supplied===configured)return true;

  const auth=String(req.headers.authorization||'');
  const match=auth.match(/^Bearer\s+(.+)$/i);
  if(!match)return false;
  try{
    const r=await fetch('https://api.github.com/repos/dbteertha/admissionbydbt',{
      headers:{
        Authorization:'Bearer '+match[1],
        Accept:'application/vnd.github+json',
        'User-Agent':'admissionbydbt-event-sync'
      }
    });
    if(!r.ok)return false;
    const data=await r.json();
    return data?.full_name==='dbteertha/admissionbydbt'&&data?.permissions?.push===true;
  }catch(e){return false}
}
async function refreshEventsSnapshot(){
  const data=await sync(true);
  const sources=Array.isArray(data.sources)?data.sources:[];
  const externalCount=sources.reduce((n,x)=>n+Number(x.count||0),0);
  const healthySources=sources.filter(x=>x.ok&&Number(x.count||0)>0).length;

  if(externalCount<3||healthySources<1||!Array.isArray(data.events)||data.events.length<CURATED_EVENTS.length){
    // Preserve the last verified snapshot rather than publishing incomplete source data.
    return {skipped:true,reason:'insufficient_verified_external_events',externalCount,healthySources,
      sourceDiagnostics:sources.map(x=>({name:x.name,status:x.status,ok:x.ok,count:x.count,mode:x.mode,error:x.error||''}))};
  }

  const payload={
    version:1,
    updatedAt:new Date(data.at||Date.now()).toISOString(),
    events:data.events,
    sources
  };
  await blobPut(EVENTS_SNAPSHOT_PATH,JSON.stringify(payload),{
    access:'private',
    addRandomSuffix:false,
    allowOverwrite:true,
    contentType:'application/json; charset=utf-8',
    storeId:EVENTS_BLOB_STORE_ID
  });
  return {payload,externalCount,healthySources};
}

const OFFICIAL_CIRCULARS = [
  {name:'Dhaka University',short:'DU',status:'Official 2026–27',cat:'University',url:'https://www.du.ac.bd/du_post_details/post/28137'},
  {name:'BUP Admission Notice',short:'BUP',status:'Official 2026–27',cat:'University',url:'https://www.bup.edu.bd/notice/details/1061'},
  {name:'BUP Admission Portal',short:'BUP Portal',status:'Official portal',cat:'University',url:'https://admission.bup.edu.bd/Admission/Home'},
  {name:'KUET Undergraduate Admission',short:'KUET',status:'Official circular',cat:'Engineering',url:'https://admission.kuet.ac.bd/'},
  {name:'AAUB Admission Information',short:'AAUB',status:'Official 2026–27',cat:'Engineering',url:'https://www.aaub.edu.bd/public/content/admission-info'},
  {name:'AAUB Notice Archive',short:'AAUB Notices',status:'Official notices',cat:'Engineering',url:'https://www.aaub.edu.bd/notice'},
  {name:'Khulna University',short:'KU',status:'Official date notice',cat:'University',url:'https://ku.ac.bd/news-details/2783'},
  {name:'BUTEX Academic Notices',short:'BUTEX',status:'Official notices',cat:'Engineering',url:'https://www.butex.edu.bd/academic-notices/'},
  {name:'Comilla University Press Releases',short:'CoU',status:'Official exam dates',cat:'University',url:'https://www.cou.ac.bd/press-releases'},
  {name:'Jagannath University 2026–27 Admission Announcement',short:'JnU',status:'Official 2026–27',cat:'University',url:'https://jnu.ac.bd/newsite/newsdetails/138749'},
  {name:'Chittagong University Admission',short:'CU',status:'Official 2026–27',cat:'University',url:'https://admission.cu.ac.bd/'}
];
const CIRCULAR_PENDING = [
  'Medical / Dental','BUET detailed circular','RUET','CUET','Rajshahi University',
  'SUST full circular','Agriculture Cluster','GST full application circular',
  'MIST 2026–27','Comilla University detailed circular'
];

const CIRCULAR_GROUPS = [
  {key:'Medical',label:'মেডিকেল',icon:'✚'},
  {key:'Engineering',label:'ইঞ্জিনিয়ারিং',icon:'⌘'},
  {key:'University',label:'বিশ্ববিদ্যালয়',icon:'◈'}
];
const CIRCULAR_PENDING_GROUPED = {
  Medical:['Medical / Dental'],
  Engineering:['BUET detailed circular','RUET','CUET','MIST 2026–27'],
  University:['Rajshahi University','SUST full circular','Agriculture Cluster','GST full application circular','Comilla University detailed circular']
};
function renderCircularGroups(){
  return CIRCULAR_GROUPS.map(g=>{
    const links=OFFICIAL_CIRCULARS.filter(x=>x.cat===g.key);
    const pending=CIRCULAR_PENDING_GROUPED[g.key]||[];
    return '<div class="circular-group circular-cat-'+g.key.toLowerCase()+'" data-circular-cat="'+g.key+'">'+
      '<div class="circular-group-head"><div class="circular-group-icon">'+g.icon+'</div><div class="circular-group-title"><b>'+g.label+'</b></div>'+
      '<div class="circular-group-counts"><i class="official">'+links.length+' official</i><i class="waiting">'+pending.length+' waiting</i></div></div>'+
      (links.length?'<div class="circular-grid">'+links.map((x,i)=>'<a class="circular-card'+(i===0?' circular-featured':'')+'" href="'+x.url+'" target="_blank" rel="noopener">'+
        (i===0?'<span class="circular-featured-label">Latest tracked</span>':'')+
        '<div><b>'+x.status+'</b><strong>'+x.name+'</strong></div><span>'+x.short+' <i>↗</i></span></a>').join('')+'</div>':'<div class="circular-empty">Official link will appear here when published.</div>')+
      (pending.length?'<div class="circular-waiting"><span>Waiting for full notice</span><div>'+pending.map(x=>'<em>'+x+'</em>').join('')+'</div></div>':'')+
    '</div>';
  }).join('');
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admission by DBT | ভর্তি তথ্যকেন্দ্র ২০২৬–২৭</title>
<meta name="theme-color" content="#07090d" id="themeColorMeta">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Admission DBT">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/app-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/app-icon.svg">

<script>
try{
  document.documentElement.dataset.theme=localStorage.getItem('admissionbydbt-theme-v1')||'dark';
  const savedLang=localStorage.getItem('admissionbydbt-language-v1')||'en';
  document.documentElement.dataset.lang=savedLang==='bn'?'bn':'en';
  document.documentElement.lang=savedLang==='bn'?'bn':'en';
}catch(e){
  document.documentElement.dataset.theme='dark';
  document.documentElement.dataset.lang='en';
  document.documentElement.lang='en';
}
</script>
<link rel="stylesheet" href="/css/app-v1.css">
<link rel="stylesheet" href="/css/experience-v10.css">
<link rel="stylesheet" href="/css/guide-v4.css">
<link rel="stylesheet" href="/admission-map-v2.css">
<style>
/* Home feature index — scoped to this component only. */
.dbt-feature-index{margin:14px 0 22px;padding:14px 16px;border:1px solid var(--line);border-radius:18px;background:rgba(11,16,27,.8);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
.dbt-feature-index>summary{display:flex;align-items:center;justify-content:space-between;gap:15px;cursor:pointer;list-style:none}
.dbt-feature-index>summary::-webkit-details-marker{display:none}
.dbt-feature-index-heading{display:flex;flex-direction:column;gap:4px;min-width:0}
.dbt-feature-index-kicker{font-size:9px;color:var(--blue);font-weight:850;letter-spacing:.13em}
.dbt-feature-index-heading strong{font-size:17px;letter-spacing:-.025em;color:var(--text)}
.dbt-feature-index-heading small{font-size:11px;line-height:1.45;color:var(--muted)}
.dbt-feature-index-chevron{flex:none;width:29px;height:29px;display:grid;place-items:center;border:1px solid var(--line);border-radius:9px;color:var(--soft);font-size:15px}
.dbt-feature-index[open] .dbt-feature-index-chevron{transform:rotate(180deg)}
.dbt-feature-index-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:13px}
.dbt-feature-index-item{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-width:0;min-height:86px;padding:12px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.025);text-decoration:none;text-align:left;color:var(--text);cursor:pointer;transition:background .16s ease,border-color .16s ease;font:inherit}
.dbt-feature-index-item:hover{background:rgba(120,167,255,.09);border-color:rgba(120,167,255,.35)}
.dbt-feature-index-item:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.dbt-feature-index-item strong{font-size:12px;line-height:1.3;font-weight:800}
.dbt-feature-index-item small{font-size:10px;color:var(--muted);line-height:1.48;max-width:100%;font-weight:400}
.dbt-feature-index-row{display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px}
.dbt-feature-index-num{font-size:9px;font-weight:850;letter-spacing:.08em;color:var(--blue)}
.dbt-feature-index-arrow{font-size:13px;color:var(--muted);line-height:1}
.dbt-feature-index-bn{display:none}
html[data-lang="bn"] .dbt-feature-index-en{display:none}
html[data-lang="bn"] .dbt-feature-index-bn{display:inline}
html[data-theme="light"] .dbt-feature-index{background:rgba(255,255,255,.90);border-color:rgba(54,74,113,.15)}
html[data-theme="light"] .dbt-feature-index-item{background:rgba(240,245,252,.7);border-color:rgba(50,74,121,.15)}
html[data-theme="light"] .dbt-feature-index-item:hover{background:#e8f0fd;border-color:rgba(66,103,175,.35)}
#dashboard,#scheduleVisuals,#targets,#circulars,#calendar,#infoCenter{scroll-margin-top:104px}
@media(max-width:1060px){.dbt-feature-index-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:760px){.dbt-feature-index{padding:12px;margin-top:10px}.dbt-feature-index-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dbt-feature-index-item{min-height:90px}.dbt-feature-index-heading strong{font-size:15px}}
@media(max-width:380px){.dbt-feature-index-grid{grid-template-columns:1fr}.dbt-feature-index-item{min-height:72px}}
@media(prefers-reduced-motion:reduce){.dbt-feature-index-item{transition:none}}
</style>
</head><body>
<div class="app">
  <nav class="topnav">
    <div class="brand-wrap">
      <div class="brand-orb"></div>
      <div><div class="brand">ADMISSION BY DBT</div><div class="brand-sub">MISSION CONTROL • 2026–27</div></div>
    </div>
    <div class="navlinks">
      <a class="navlink active" href="#dashboard">Home</a>
      <a class="navlink" href="#targets">My Exams</a>
      <a class="navlink" href="#circulars">Circulars</a>
      <a class="navlink" href="#calendar">Calendar</a>
      <a class="navlink" href="#infoCenter">Admission Guide</a>
    </div>
    <div class="nav-actions">
      
      <a class="howto-link" href="/how-to" aria-label="How to use Admission by DBT" title="How to use">?</a>\n      <button class="install-app-btn" id="installAppButton" type="button" hidden aria-label="Install Admission by DBT" title="Install app">↓</button>
      <button class="theme-toggle" id="themeToggle" type="button" aria-label="Switch color theme" title="Switch color theme"><span class="theme-sun">☀</span><span class="theme-moon">☾</span></button>
      <button class="language-toggle" id="languageToggle" type="button" aria-label="বাংলা ভাষায় দেখুন" title="বাংলা ভাষায় দেখুন"><span>অ</span></button>
      <button class="sync-link" id="homeSyncButton" type="button" title="Save your Home and Calendar choices"><i></i><span id="homeSyncText">Save</span></button>
      <a class="msg-link" href="https://wa.me/+8801516560230" target="_blank" rel="noopener" aria-label="Message on WhatsApp" title="Message on WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.4 3.8 20l1-3.5A8.4 8.4 0 1 1 7 18.4Z"/><path d="M8.2 8.1c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.5.9 1.3 1.7 2.2 2.2.3.2.5.2.7 0l.8-.7c.2-.2.5-.2.7-.1l1.9.9c.3.1.4.3.4.6 0 .8-.4 1.6-1 2-1 .6-2.4.5-4-.2-1.4-.6-2.8-1.7-3.9-3.1-1-1.3-1.7-2.8-1.8-4.1-.1-.8.1-1.4.5-1.7Z"/></svg>
      </a>
      <div id="syncStatus" class="live">● checking dates…</div>
    </div>
  </nav>

<details class="dbt-feature-index" open aria-label="Website feature index">
  <summary><span class="dbt-feature-index-heading"><span class="dbt-feature-index-kicker">SITE INDEX</span><strong><span class="dbt-feature-index-en">Explore Admission by DBT</span><span class="dbt-feature-index-bn">অ্যাডমিশন বাই ডিবিটি: সব সুবিধা</span></strong><small><span class="dbt-feature-index-en">Tap a feature to jump straight to it.</span><span class="dbt-feature-index-bn">যে সুবিধায় যেতে চান, সেটিতে চাপ দিন।</span></small></span><span class="dbt-feature-index-chevron" aria-hidden="true">⌄</span></summary>
  <div class="dbt-feature-index-grid">
<a class="dbt-feature-index-item" href="#dashboard"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">01</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Countdown</span><span class="dbt-feature-index-bn">কাউন্টডাউন</span></strong><small><span class="dbt-feature-index-en">Exam countdown, main target and progress.</span><span class="dbt-feature-index-bn">পরীক্ষার সময়, মূল টার্গেট ও অগ্রগতি।</span></small></a>
<a class="dbt-feature-index-item" href="#scheduleVisuals"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">02</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Schedule Snapshot</span><span class="dbt-feature-index-bn">সময়সূচির সারাংশ</span></strong><small><span class="dbt-feature-index-en">Confirmed dates, monthly charts and weekly breakdown.</span><span class="dbt-feature-index-bn">নিশ্চিত তারিখ, মাসভিত্তিক চার্ট ও সাপ্তাহিক বিশ্লেষণ।</span></small></a>
<a class="dbt-feature-index-item" href="#targets"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">03</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">My Exams</span><span class="dbt-feature-index-bn">আমার পরীক্ষা</span></strong><small><span class="dbt-feature-index-en">Save selected exams, set a target and make a wallpaper.</span><span class="dbt-feature-index-bn">পরীক্ষা সেভ, টার্গেট নির্বাচন ও ওয়ালপেপার তৈরি।</span></small></a>
<a class="dbt-feature-index-item" href="#circulars"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">04</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Circulars</span><span class="dbt-feature-index-bn">ভর্তি বিজ্ঞপ্তি</span></strong><small><span class="dbt-feature-index-en">Official links and pending notices by category.</span><span class="dbt-feature-index-bn">বিভাগভিত্তিক অফিসিয়াল লিংক ও অপেক্ষমাণ নোটিশ।</span></small></a>
<a class="dbt-feature-index-item" href="#calendar"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">05</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Exam Calendar</span><span class="dbt-feature-index-bn">পরীক্ষার ক্যালেন্ডার</span></strong><small><span class="dbt-feature-index-en">Month, list and next-exam views; search, filters and PDF.</span><span class="dbt-feature-index-bn">মাস, তালিকা, পরবর্তী পরীক্ষা, সার্চ, ফিল্টার ও PDF।</span></small></a>
<button class="dbt-feature-index-item" type="button" data-dbt-index-open="admissionMapButton"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">06</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Admission Map</span><span class="dbt-feature-index-bn">ভর্তি ম্যাপ</span></strong><small><span class="dbt-feature-index-en">Choose universities and preview them on a Bangladesh map.</span><span class="dbt-feature-index-bn">বিশ্ববিদ্যালয় বেছে বাংলাদেশের ম্যাপে দেখুন।</span></small></button>
<a class="dbt-feature-index-item" href="#infoCenter"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">07</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Admission Guide</span><span class="dbt-feature-index-bn">ভর্তি তথ্য গাইড</span></strong><small><span class="dbt-feature-index-en">Eligibility, information, combined filters and comparisons.</span><span class="dbt-feature-index-bn">যোগ্যতা, তথ্য, ফিল্টার ও তুলনা।</span></small></a>
<a class="dbt-feature-index-item" href="/tracker"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">08</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Study Tracker</span><span class="dbt-feature-index-bn">স্টাডি ট্র্যাকার</span></strong><small><span class="dbt-feature-index-en">Subjects, chapters, progress and weekly/daily routine.</span><span class="dbt-feature-index-bn">বিষয়, অধ্যায়, অগ্রগতি ও সাপ্তাহিক/দৈনিক রুটিন।</span></small></a>
<a class="dbt-feature-index-item" href="/onushiloni"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">09</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">Question Bank</span><span class="dbt-feature-index-bn">প্রশ্নব্যাংক</span></strong><small><span class="dbt-feature-index-en">Select Chemistry questions by chapter, subtopic and type.</span><span class="dbt-feature-index-bn">অধ্যায়, টপিক ও ধরন দিয়ে রসায়নের প্রশ্ন নির্বাচন।</span></small></a>
<a class="dbt-feature-index-item" href="/how-to"><span class="dbt-feature-index-row"><span class="dbt-feature-index-num">10</span><span class="dbt-feature-index-arrow" aria-hidden="true">↗</span></span><strong><span class="dbt-feature-index-en">How to Use</span><span class="dbt-feature-index-bn">ব্যবহারবিধি</span></strong><small><span class="dbt-feature-index-en">Step-by-step help for the website's features.</span><span class="dbt-feature-index-bn">ওয়েবসাইটের সুবিধাগুলো ব্যবহারের নির্দেশনা।</span></small></a>
  </div>
</details>
  <main id="dashboard">
    <section class="hero">
      <div class="hero-inner">
        <div class="orbit-shell"><div class="orbit-dot"></div></div>
        <div class="hero-eyebrow"><i></i> Admission season 2026–27</div>
        <div class="hero-phase" id="heroPhase">BUILD BASICS</div>
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

    <section class="schedule-visuals" id="scheduleVisuals" aria-label="Schedule overview">
      <div class="schedule-visual-head">
        <div><div class="section-kicker">AT A GLANCE</div><h2>Schedule Snapshot</h2></div>
        <div class="schedule-live-dot"><i></i><span>Live calendar data</span></div>
      </div>
      <div class="schedule-chart-grid">
        <article class="schedule-chart-card status-chart-card">
          <div class="chart-card-head"><div><b>Date confidence</b><span>Current schedule status</span></div></div>
          <div class="status-chart-layout">
            <div class="status-donut" id="statusDonut"><div><b id="statusConfirmedPct">0%</b><span>confirmed</span></div></div>
            <div class="status-legend">
              <div><i class="confirmed"></i><span>Confirmed</span><b id="statusConfirmedCount">0</b></div>
              <div><i class="pending"></i><span>Notice pending</span><b id="statusPendingCount">0</b></div>
              <div><i class="tentative"></i><span>Not confirmed</span><b id="statusTentativeCount">0</b></div>
            </div>
          </div>
        </article>
        <article class="schedule-chart-card monthly-chart-card">
          <div class="chart-card-head monthly-chart-head">
            <div><b>Monthly exam distribution</b><span>How busy each month is</span><em class="monthly-tap-help">Tap a month to see its weekly distribution.</em></div>
            <div class="monthly-legend">
              <span><i class="medical"></i>মেডিকেল</span>
              <span><i class="engineering"></i>ইঞ্জিনিয়ারিং</span>
              <span><i class="university"></i>বিশ্ববিদ্যালয়</span>
            </div>
          </div>
          <div class="monthly-bars" id="monthlyExamBars"></div>
          <div class="weekly-drilldown" id="weeklyDrilldown" hidden>
            <div class="weekly-drilldown-head">
              <div><b id="weeklyDrilldownTitle">Weekly distribution</b><span id="weeklyDrilldownMeta"></span></div>
              <button type="button" id="weeklyDrilldownClose" aria-label="Close weekly distribution">×</button>
            </div>
            <div class="weekly-bars" id="weeklyExamBars"></div>
          </div>
        </article>
      </div>
    </section>

    <section class="target-section" id="targets">
      <div class="target-head">
        <div><div class="section-kicker">YOUR LIST</div><h2>My Exams</h2><div class="sub">পরীক্ষা যোগ করুন → মূল টার্গেট ঠিক করুন → নিজের 9:16 লকস্ক্রিন ওয়ালপেপার বানান।</div></div>
        <div class="target-head-actions"><button class="target-add-btn" id="targetAddButton" type="button">＋ Add exams</button><button class="target-add-btn target-wallpaper-launch" id="myExamsWallpaperButton" type="button">▣ ওয়ালপেপার বানান</button><div class="target-count" id="targetCount">0 SELECTED</div></div>
      </div>
      <div class="starred-grid" id="starredCards"></div>
    </section>

    <section class="section circular-section" id="circulars">
      <div class="head">
        <div><div class="section-kicker">OFFICIAL LINKS</div><h2>Circulars</h2><div class="sub">Official links, grouped for quick access.</div></div>
      </div>
      <div class="circular-summary">
        <div class="circular-summary-card"><span>Official</span><b>${OFFICIAL_CIRCULARS.length}</b><small>Checked links</small></div>
        <div class="circular-summary-card"><span>Waiting</span><b>${CIRCULAR_PENDING.length}</b><small>Full notices</small></div>
        <div class="circular-summary-card"><span>Checked</span><b style="font-size:14px">7 Oct</b><small>2026</small></div>
      </div>
      <div class="circular-tabs" id="circularTabs">
        <button class="circular-tab active" type="button" data-circular-tab="Medical">মেডিকেল</button>
        <button class="circular-tab" type="button" data-circular-tab="Engineering">ইঞ্জিনিয়ারিং</button>
        <button class="circular-tab" type="button" data-circular-tab="University">বিশ্ববিদ্যালয়</button>
      </div>
      <div class="circular-groups">${renderCircularGroups()}</div>
      <div class="audit-note circular-footnote">Old-year details may change. Use the new official notice when it is published.</div>
    </section>

    <section class="section calendar-section" id="calendar" data-view="month">
      <div class="command-section-head">
        <div><div class="section-kicker">SCHEDULE</div><h2>Calendar</h2><div class="sub">Exam dates in one place.</div></div>
        <div class="controls"><input id="search" type="search" aria-label="Search calendar exams" placeholder="Search university or unit…"><button class="btn admission-map-launch" id="admissionMapButton" type="button">🗺 ভর্তি ম্যাপ</button><button class="btn" id="calendarPdfButton" type="button">Print PDF</button><button class="btn" id="refresh" type="button" aria-label="Refresh exam dates">Refresh</button></div>
      </div>
      <div class="calendar-commandbar">
        <div class="calendar-view-switch" id="calendarViewSwitch">
          <button class="calendar-view-btn active" data-calendar-view="month" type="button">Month</button>
          <button class="calendar-view-btn" data-calendar-view="timeline" type="button">List</button>
          <button class="calendar-view-btn" data-calendar-view="upcoming" type="button">Next exams</button>
        </div>
        <div class="calendar-filter-row" id="calendarFilters">
          <button class="calendar-filter active" data-calendar-filter="all" type="button">All</button>
          <button class="calendar-filter" data-calendar-filter="confirmed" type="button">Confirmed</button>
          <button class="calendar-filter" data-calendar-filter="medical" type="button">মেডিকেল</button>
          <button class="calendar-filter" data-calendar-filter="engineering" type="button">ইঞ্জিনিয়ারিং</button>
          <button class="calendar-filter" data-calendar-filter="university" type="button">বিশ্ববিদ্যালয়</button>
          <button class="calendar-filter" data-calendar-filter="starred" type="button">★ My Exams</button>
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
      <div class="head guide-v4-head">
        <div>
          <div class="section-kicker">ADMISSION GUIDE</div>
          <h2 class="info-title">ভর্তি তথ্য, যোগ্যতা ও তুলনা</h2>
          <div class="sub">আলাদা কোনো ভর্তি তথ্য পেজ নেই — এখানেই খুঁজুন, একসাথে একাধিক ফিল্টার দিন, বিস্তারিত দেখুন এবং তুলনা করুন।</div>
          <div class="guide-v4-help"><span>১ • খুঁজুন</span><span>২ • ফিল্টার মিলিয়ে নিন</span><span>৩ • বিস্তারিত দেখুন</span><span>৪ • তুলনা করুন</span></div>
        </div>
      </div>

      <div class="guide-v4-toolbar">
        <label class="guide-search-wrap"><span>⌕</span><input id="guideSearch" type="search" placeholder="বিশ্ববিদ্যালয়, ইউনিট, আসন বা যোগ্যতা খুঁজুন…" aria-label="ভর্তি গাইড খুঁজুন"></label>
        <button class="guide-v4-filter-toggle" id="guideFilterToggle" type="button" aria-expanded="false">ফিল্টার ও সাজানো <b id="guideActiveFilterCount">০</b></button>
        <button class="guide-v4-reset" id="guideResetFilters" type="button">সব রিসেট</button>
        <button class="guide-clear" id="guideClearSearch" type="button" hidden>খোঁজ মুছুন</button>
      </div>

      <div class="guide-v4-filter-panel" id="guideFilterPanel">
        <div class="guide-v4-filter-group">
          <strong>GPA অনুযায়ী সাজানো</strong>
          <div class="guide-v4-chips" id="guideSortFilters">
            <button class="guide-v4-chip active" type="button" data-guide-sort="gpa-desc">সর্বোচ্চ GPA আগে</button>
            <button class="guide-v4-chip" type="button" data-guide-sort="gpa-asc">সর্বনিম্ন GPA আগে</button>
            <button class="guide-v4-chip" type="button" data-guide-sort="name">নাম অনুযায়ী</button>
          </div>
        </div>
        <div class="guide-v4-filter-group">
          <strong>ধরন • একাধিক বাছাই করা যাবে</strong>
          <div class="guide-v4-chips" id="guideTypeFilters">
            <button class="guide-v4-chip" type="button" data-guide-type="engineering">ইঞ্জিনিয়ারিং</button>
            <button class="guide-v4-chip" type="button" data-guide-type="medical">মেডিকেল</button>
            <button class="guide-v4-chip" type="button" data-guide-type="university">বিশ্ববিদ্যালয়</button>
          </div>
        </div>
        <div class="guide-v4-filter-group">
          <strong>ক্যালকুলেটর • চাইলে দুটোই বাছুন</strong>
          <div class="guide-v4-chips" id="guideCalcFilters">
            <button class="guide-v4-chip" type="button" data-guide-calc="yes">ক্যালকুলেটর চলে</button>
            <button class="guide-v4-chip" type="button" data-guide-calc="no">ক্যালকুলেটর চলে না</button>
          </div>
        </div>
        <div class="guide-v4-filter-group">
          <strong>বিভাগ • একাধিক বাছাই করা যাবে</strong>
          <div class="guide-v4-chips" id="guideDivisionFilters"></div>
        </div>
      </div>

      <div class="guide-v4-results" id="guideResultsMeta"><b>লোড হচ্ছে…</b><span>সর্বোচ্চ GPA আগে</span></div>
      <div class="guide-compare-tray" id="guideCompareTray" aria-live="polite"></div>
      <button class="guide-compare-open" id="guideCompareButton" type="button" disabled>তুলনা করুন <b id="guideCompareCount">০</b></button>
      <div class="category-tabs" id="categoryTabs" hidden></div>
      <div class="guide-v4-grid" id="categoryCharts"></div>
      <div class="audit-note circular-footnote">এই যোগ্যতা ও আসনের তথ্য আপনার দেওয়া ভর্তি ডেটাসেট থেকে দেখানো হচ্ছে। আবেদন করার আগে সর্বশেষ অফিসিয়াল সার্কুলার মিলিয়ে নিন।</div>
    </section>
  </main>
</div>

<div class="guide-compare-backdrop" id="guideCompareBackdrop" aria-hidden="true">
  <div class="guide-compare-modal" role="dialog" aria-modal="true" aria-labelledby="guideCompareTitle">
    <div class="guide-compare-head"><div><div class="section-kicker">QUICK COMPARE</div><h3 id="guideCompareTitle">Compare admission options</h3></div><button class="modal-x" id="guideCompareClose" type="button" aria-label="Close comparison">×</button></div>
    <div class="guide-compare-body" id="guideCompareBody"></div>
  </div>
</div>

<div class="sync-modal-backdrop" id="syncModalBackdrop" aria-hidden="true">
  <div class="sync-modal" role="dialog" aria-modal="true" aria-labelledby="syncModalTitle">
    <div class="sync-modal-head">
      <div><div class="section-kicker">CLOUD SAVE</div><h3 id="syncModalTitle">Your Secret Code</h3></div>
      <button class="sync-close" id="syncModalClose" type="button" aria-label="Close">×</button>
    </div>
    <div class="sync-note">Save this secret code somewhere safe. You can use it later to get back your saved exams, countdown target and calendar settings on this or another device.</div>
    <div class="sync-code-box">
      <div class="sync-code" id="syncCodeText">—</div>
      <button class="sync-copy" id="syncCopyButton" type="button">Copy</button>
      <button class="sync-copy" id="syncBackupButton" type="button">Save backup</button>
    </div>
    <div class="sync-status-line" id="syncStatusLine">Saved on this device.</div>
    <div class="sync-divider"></div>
    <div class="sync-existing-label">Use a saved code</div>
    <div class="sync-existing-row">
      <input class="sync-existing-input" id="syncExistingInput" maxlength="24" placeholder="DBT-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false">
      <button class="sync-use" id="syncUseButton" type="button">Use code</button>
    </div>
    <div class="sync-warning">Anyone with this code can open and change your saved Home/Calendar choices. Keep it private.</div>
  </div>
</div>

<div class="target-picker-backdrop" id="examPickerBackdrop" aria-hidden="true">
  <div class="target-picker" role="dialog" aria-modal="true" aria-labelledby="examPickerTitle">
    <div class="target-picker-head">
      <div><div class="section-kicker">MY EXAMS</div><h3 id="examPickerTitle">Choose exams</h3></div>
      <button class="target-picker-close" id="examPickerClose" type="button" aria-label="Close">×</button>
    </div>
    <input class="target-picker-search" id="examPickerSearch" type="search" placeholder="Search exam or university…">
    <div class="target-picker-list" id="examPickerList"></div>
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


<div class="admission-map-backdrop" id="admissionMapBackdrop" aria-hidden="true">
  <div class="admission-map-modal" role="dialog" aria-modal="true" aria-labelledby="admissionMapTitle">
    <div class="admission-map-head">
      <div><div class="section-kicker">বাংলা ভর্তি মানচিত্র</div><h3 id="admissionMapTitle">আমার ভর্তি মানচিত্র</h3><p>বাংলাদেশের division shape ও প্রতিনিধিত্বমূলক campus coordinate ব্যবহার করে নামসহ রঙিন ভর্তি মানচিত্র বানান।</p></div>
      <button class="modal-x" id="admissionMapClose" type="button" aria-label="ভর্তি মানচিত্র বন্ধ করুন">×</button>
    </div>
    <div class="admission-map-step" id="admissionMapSelectStep">
      <div class="admission-map-tools">
        <label class="admission-map-search"><span>⌕</span><input id="admissionMapSearch" type="search" placeholder="বিশ্ববিদ্যালয় খুঁজুন…" aria-label="বিশ্ববিদ্যালয় খুঁজুন"></label>
        <div class="admission-map-filters" id="admissionMapFilters">
          <button type="button" class="active" data-map-filter="all">সব</button>
          <button type="button" data-map-filter="university">বিশ্ববিদ্যালয়</button>
          <button type="button" data-map-filter="engineering">ইঞ্জিনিয়ারিং</button>
        </div>
        <div class="admission-map-quick">
          <button type="button" id="admissionMapAll">সব নির্বাচন</button>
          <button type="button" id="admissionMapClear">সব মুছুন</button>
          <button type="button" id="admissionMapFromMyExams">★ আমার পরীক্ষা থেকে</button>
        </div>
      </div>
      <div class="admission-map-list" id="admissionMapList"></div>
      <div class="audit-note" style="margin-top:9px">মেডিকেল, GST ও কৃষি গুচ্ছের একক campus pin নেই—তাই এই map-এ campus থাকা প্রতিষ্ঠানগুলো দেখানো হয়। পিন পরীক্ষার কেন্দ্র নয়।</div>
      <div class="admission-map-foot">
        <div><b id="admissionMapSelectedCount">০টি নির্বাচিত</b><span>মানচিত্রে শুধু নির্বাচিত বিশ্ববিদ্যালয়গুলোর নাম থাকবে।</span></div>
        <button class="btn admission-map-preview-btn" id="admissionMapPreviewButton" type="button" disabled>মানচিত্র দেখুন →</button>
      </div>
    </div>
    <div class="admission-map-preview-step" id="admissionMapPreviewStep" hidden>
      <div class="admission-map-preview-note"><b>প্রিভিউ</b><span>নাম, রং ও অবস্থান দেখে তারপর ডাউনলোড করুন।</span></div>
      <div class="admission-map-canvas-shell"><canvas id="admissionMapCanvas" width="1080" height="1440" aria-label="নির্বাচিত বিশ্ববিদ্যালয়সহ বাংলাদেশ ভর্তি মানচিত্র"></canvas></div>
      <div class="admission-map-preview-actions">
        <button class="btn" id="admissionMapBack" type="button">← নির্বাচন বদলান</button>
        <button class="btn admission-map-download" id="admissionMapDownload" type="button">PNG ডাউনলোড</button>
      </div>
    </div>
  </div>
</div>

<div class="pdf-picker-backdrop" id="pdfPickerBackdrop" aria-hidden="true">
    <div class="pdf-picker-modal" role="dialog" aria-modal="true" aria-labelledby="pdfPickerTitle">
      <div class="pdf-picker-head">
        <div><div class="section-kicker">PRINT CALENDAR</div><h3 id="pdfPickerTitle">Make your calendar PDF</h3><p>Choose months, categories, universities and individual exams.</p></div>
        <button class="modal-x" id="pdfPickerClose" type="button" aria-label="Close">×</button>
      </div>
      <div class="pdf-picker-body">
        <section class="pdf-pick-section">
          <div class="pdf-pick-title"><b>Months</b><button type="button" data-pdf-action="months-all">All</button></div>
          <div class="pdf-chip-grid" id="pdfMonthChips"></div>
        </section>
        <section class="pdf-pick-section">
          <div class="pdf-pick-title"><b>Category</b><button type="button" data-pdf-action="cats-all">All</button></div>
          <div class="pdf-chip-grid pdf-category-chips" id="pdfCategoryChips">
            <button type="button" class="pdf-chip active" data-pdf-cat="medical">মেডিকেল</button>
            <button type="button" class="pdf-chip active" data-pdf-cat="engineering">ইঞ্জিনিয়ারিং</button>
            <button type="button" class="pdf-chip active" data-pdf-cat="university">বিশ্ববিদ্যালয়</button>
          </div>
        </section>
        <section class="pdf-pick-section">
          <div class="pdf-pick-title"><b>University</b><button type="button" data-pdf-action="varsities-all">All</button></div>
          <div class="pdf-chip-grid pdf-varsity-chips" id="pdfVarsityChips"></div>
        </section>
        <section class="pdf-pick-section pdf-exam-section">
          <div class="pdf-pick-title"><b>Exams</b><button type="button" data-pdf-action="exams-all">All</button></div>
          <input class="pdf-exam-search" id="pdfExamSearch" placeholder="Search exam or university…" aria-label="Search exams for PDF">
          <div class="pdf-exam-list" id="pdfExamList"></div>
        </section>
        <section class="pdf-preview" id="pdfPreview" aria-live="polite"></section>
      </div>
      <div class="pdf-picker-foot">
        <div><b id="pdfSelectedCount">0 exams</b><span id="pdfSelectedMonths">0 months</span></div>
        <button class="btn" id="pdfDownloadSelected" type="button">Download PDF</button>
      </div>
    </div>
  </div>

  <div class="day-events-backdrop" id="dayEventsBackdrop" aria-hidden="true">
  <div class="day-events-sheet" role="dialog" aria-modal="true" aria-labelledby="dayEventsTitle">
    <div class="day-events-head"><div><div class="section-kicker">DAY SCHEDULE</div><h3 id="dayEventsTitle">Exams</h3><p id="dayEventsDate"></p></div><button class="modal-x" id="dayEventsClose" type="button" aria-label="Close day schedule">×</button></div>
    <div class="day-events-list" id="dayEventsList"></div>
  </div>
</div>

<div class="event-drawer-backdrop" id="eventDrawerBackdrop" aria-hidden="true">
  <aside class="event-drawer" id="eventDrawer">
    <button class="event-drawer-close" id="eventDrawerClose" type="button" aria-label="Close event details">×</button>
    <div class="event-drawer-kicker">ADMISSION EVENT</div>
    <h3 id="eventDrawerTitle">—</h3>
    <div class="event-drawer-date" id="eventDrawerDate">—</div>
    <div class="event-drawer-status" id="eventDrawerStatus">Confirmed</div>
    <div class="event-drawer-note" id="eventDrawerNote">—</div>
    <div class="event-drawer-actions"><button class="btn" id="eventDrawerStar" type="button">☆ Add to My Exams</button><button class="btn primary" id="eventDrawerClose2" type="button">Done</button></div>
  </aside>
</div>

<nav class="mobile-dock" aria-label="Quick navigation">
  <a href="#dashboard"><b>⌂</b>Home</a>
  <a href="#targets"><b>★</b>My Exams</a>
  <a href="#circulars"><b>◎</b>Circulars</a>
  <a href="#calendar"><b>▦</b>Calendar</a>
  <a href="#infoCenter"><b>≡</b>Guide</a>
</nav>

<div class="admin-editor" id="adminEditor" aria-label="Site admin editor">
  <strong>ADMIN EDITOR</strong>
  <input id="adminKeyInput" type="password" placeholder="Admin password" autocomplete="current-password">
  <button id="adminLoginBtn" type="button">Unlock</button>
  <button id="adminEditBtn" type="button">Edit text</button>
  <button id="adminParentBtn" type="button">Select parent</button>
  <button id="adminUpBtn" type="button">↑ Move</button>
  <button id="adminDownBtn" type="button">↓ Move</button>
  <button class="admin-delete" id="adminDeleteBtn" type="button">Delete</button>
  <button id="adminResetBtn" type="button">Reset item</button>
  <button id="adminUndoBtn" type="button">Undo</button>
  <button class="admin-save" id="adminSaveBtn" type="button">Save site</button>
  <span class="admin-status" id="adminEditorStatus">Click anything to select it.</span>
  <div class="admin-help">Click any text or block. Double-click text to edit. Select an item and drag it to move it inside the same section. Changes auto-save for the whole site after you unlock.</div>
</div>
<script>
document.addEventListener('click',function(event){
  const link=event.target.closest('[data-dbt-index-open]');
  if(!link)return;
  const control=document.getElementById(link.getAttribute('data-dbt-index-open'));
  if(control&&control!==link)control.click();
});
</script>
<script id="dbtBootEvents" type="application/json">${JSON.stringify(CURATED_EVENTS).replace(/</g,'\\u003c')}</script>
<script defer src="/js/app-v3.js"></script><script defer src="/js/guide-v4.js"></script><script defer src="/admission-map-v2.js"></script><script defer src="/_vercel/insights/script.js"></script>
</body></html>`;

export default async function handler(req,res){
  const u=new URL(req.url,'https://admissionbydbt.vercel.app');

  if(u.pathname==='/api/events'){
    if(req.method!=='GET'&&req.method!=='HEAD'){
      res.statusCode=405;
      res.setHeader('content-type','application/json; charset=utf-8');
      res.setHeader('Cache-Control','no-store');
      return res.end(JSON.stringify({ok:false,error:'method_not_allowed'}));
    }
    const data=await readEventsSnapshot();
    res.statusCode=200;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('access-control-allow-origin','*');
    res.setHeader('Cache-Control','public, max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=1800, stale-while-revalidate=43200, stale-if-error=86400');
    if(req.method==='HEAD')return res.end();
    return res.end(JSON.stringify(data));
  }

  if(u.pathname==='/api/sync-events'){
    res.setHeader('Cache-Control','no-store');
    res.setHeader('content-type','application/json; charset=utf-8');
    if(req.method!=='POST'){
      res.statusCode=405;
      return res.end(JSON.stringify({ok:false,error:'method_not_allowed'}));
    }
    if(!(await eventSyncAuthorized(req))){
      res.statusCode=401;
      return res.end(JSON.stringify({ok:false,error:'unauthorized'}));
    }
    try{
      const result=await refreshEventsSnapshot();
      res.statusCode=200;
      if(result.skipped)return res.end(JSON.stringify({ok:true,status:'skipped',reason:result.reason,
        snapshotPreserved:true,externalCount:result.externalCount,healthySources:result.healthySources,
        sources:result.sourceDiagnostics}));
      return res.end(JSON.stringify({
        ok:true,
        status:'updated',
        count:result.payload.events.length,
        externalCount:result.externalCount,
        healthySources:result.healthySources
      }));
    }catch(e){
      res.statusCode=e?.message==='snapshot_validation_failed'?503:500;
      return res.end(JSON.stringify({
        ok:false,
        error:e?.message||'sync_events_failed',
        ...(e?.meta||{})
      }));
    }
  }

  if(u.pathname==='/how-to'||u.pathname==='/how-to/'){
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400');
    return res.end(HOW_TO_HTML);
  }
  if(u.pathname==='/health'){
    res.statusCode=200; res.setHeader('content-type','text/plain'); return res.end('ok');
  }
  res.statusCode=200;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400');
  return res.end(html);
}
