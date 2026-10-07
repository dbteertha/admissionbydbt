import crypto from 'node:crypto';
import { get, put } from '@vercel/blob';

const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BLOB_STORE_ID='store_vUvKgnlBSMEysQyD';

function json(res,status,data){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store');
  res.end(JSON.stringify(data));
}
function normalizeCode(v){
  return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
}
function validCode(code){
  return /^DBT[A-HJ-NP-Z2-9]{16}$/.test(code);
}
function pathFor(code){
  const digest=crypto.createHash('sha256').update(code).digest('hex');
  return 'home-sync/'+digest+'.json';
}
function cleanState(x){
  const allowedViews=['month','timeline','upcoming'];
  const allowedFilters=['all','confirmed','engineering','medical','university','starred'];
  return {
    version:1,
    updatedAt:Number(x?.updatedAt)||Date.now(),
    starred:Array.isArray(x?.starred)?x.starred.map(v=>String(v).slice(0,500)).slice(0,200):[],
    countdownTargetKey:String(x?.countdownTargetKey||'').slice(0,500),
    calendarView:allowedViews.includes(x?.calendarView)?x.calendarView:'month',
    calendarFilter:allowedFilters.includes(x?.calendarFilter)?x.calendarFilter:'all'
  };
}
async function readBody(req){
  let s='';
  for await(const chunk of req){
    s+=chunk;
    if(s.length>120000)throw new Error('payload_too_large');
  }
  return s?JSON.parse(s):{};
}
async function streamToText(stream){
  const reader=stream.getReader();
  const dec=new TextDecoder();
  let out='';
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    out+=dec.decode(value,{stream:true});
    if(out.length>120000)throw new Error('stored_payload_too_large');
  }
  out+=dec.decode();
  return out;
}

export default async function handler(req,res){
  const code=normalizeCode(req.headers['x-dbt-sync-code']);
  if(!validCode(code))return json(res,400,{ok:false,error:'invalid_code'});

  try{
    const pathname=pathFor(code);

    if(req.method==='GET'){
      const result=await get(pathname,{access:'private',useCache:false,storeId:BLOB_STORE_ID});
      if(!result||result.statusCode!==200)return json(res,404,{ok:false,error:'not_found'});
      const text=await streamToText(result.stream);
      const state=cleanState(JSON.parse(text));
      return json(res,200,{ok:true,state});
    }

    if(req.method==='PUT'||req.method==='POST'){
      const body=await readBody(req);
      const incoming=cleanState(body);
      let existing=null;
      try{
        const result=await get(pathname,{access:'private',useCache:false,storeId:BLOB_STORE_ID});
        if(result&&result.statusCode===200){
          existing=cleanState(JSON.parse(await streamToText(result.stream)));
        }
      }catch(e){}

      if(existing&&existing.updatedAt>incoming.updatedAt){
        return json(res,409,{ok:false,error:'newer_cloud_state',state:existing});
      }

      await put(pathname,JSON.stringify(incoming),{
        access:'private',
        addRandomSuffix:false,
        allowOverwrite:true,
        contentType:'application/json; charset=utf-8',
        storeId:BLOB_STORE_ID
      });
      return json(res,200,{ok:true,state:incoming});
    }

    return json(res,405,{ok:false,error:'method_not_allowed'});
  }catch(e){
    return json(res,500,{ok:false,error:e?.message||'sync_error'});
  }
}
