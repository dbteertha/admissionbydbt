import crypto from 'node:crypto';
import {get,put} from '@vercel/blob';

const STORE_ID='store_vUvKgnlBSMEysQyD';
const MAX_BODY=250000;
const empty=()=>({version:1,days:{}});
function reply(res,status,data){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,X-DBT-Daily-Key');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
}
function cleanText(x,n=500){return String(x??'').slice(0,n)}
function cleanState(data){
  const days={};
  if(!data||typeof data!=='object'||!data.days||typeof data.days!=='object')return empty();
  for(const [date,day] of Object.entries(data.days).slice(-400)){
    if(!/^20\d{2}-[01]\d-[0-3]\d$/.test(date)||!day||typeof day!=='object')continue;
    const subjects=Array.isArray(day.subjects)?day.subjects.slice(0,50):[];
    days[date]={
      deadline:cleanText(day.deadline,40),
      updatedAt:cleanText(day.updatedAt,40),
      subjects:subjects.map(s=>({
        id:cleanText(s.id,120),name:cleanText(s.name,160),
        rows:(Array.isArray(s.rows)?s.rows:[]).slice(0,500).map(r=>({
          id:cleanText(r.id,300),chapter:cleanText(r.chapter,300),
          task:cleanText(r.task,400),note:cleanText(r.note,1500),
          done:r.done===true
        })).filter(r=>r.id)
      })).filter(s=>s.id)
    };
  }
  return {version:1,activeDate: /^20\d{2}-[01]\d-[0-3]\d$/.test(String(data.activeDate||''))?String(data.activeDate):'',days};
}
async function parseBody(req){
  let raw='';
  for await(const chunk of req){
    raw+=chunk;
    if(raw.length>MAX_BODY)throw new Error('too_large');
  }
  return JSON.parse(raw||'{}');
}
async function readStored(path){
  const item=await get(path,{access:'private',useCache:false,storeId:STORE_ID});
  if(!item||item.statusCode!==200)return null;
  const reader=item.stream.getReader(), decoder=new TextDecoder();
  let raw='';
  for(;;){
    const {done,value}=await reader.read();
    if(done)break;
    raw+=decoder.decode(value,{stream:true});
    if(raw.length>MAX_BODY)throw new Error('stored_too_large');
  }
  raw+=decoder.decode();
  return raw;
}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export default async function handler(req,res){
  if(req.method==='OPTIONS')return reply(res,204,{});
  const secret=String(req.headers['x-dbt-daily-key']||'').trim();
  // Secret is generated in the browser using 32 cryptographically random bytes.
  if(!/^[a-f0-9]{64}$/i.test(secret))return reply(res,401,{ok:false,error:'pairing_key_required'});
  const path='daily-goals/v1/'+hash(secret.toLowerCase())+'.json';
  if(req.method!=='GET'&&req.method!=='PUT')return reply(res,405,{ok:false,error:'method_not_allowed'});
  try{
    const original=await readStored(path);
    const revision=original?hash(original):null;
    if(req.method==='GET'){
      if(!original)return reply(res,404,{ok:false,error:'not_found'});
      return reply(res,200,{ok:true,revision,state:cleanState(JSON.parse(original))});
    }
    const body=await parseBody(req);
    if((body.baseRevision??null)!==revision){
      return reply(res,409,{ok:false,error:'revision_conflict',revision,state:original?cleanState(JSON.parse(original)):empty()});
    }
    const state=cleanState(body.state);
    const serialized=JSON.stringify(state);
    if(serialized.length>MAX_BODY)return reply(res,413,{ok:false,error:'too_large'});
    await put(path,serialized,{
      access:'private',addRandomSuffix:false,allowOverwrite:true,
      contentType:'application/json; charset=utf-8',storeId:STORE_ID
    });
    return reply(res,200,{ok:true,revision:hash(serialized),state});
  }catch(e){
    return reply(res,e.message==='too_large'?413:503,{ok:false,error:'daily_sync_unavailable'});
  }
}
