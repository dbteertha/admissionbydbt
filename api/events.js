import { get } from '@vercel/blob';
import { CURATED_EVENTS } from '../lib/events-data.js';

const BLOB_STORE_ID='store_vUvKgnlBSMEysQyD';
const SNAPSHOT_PATH='cache/events-live.json';

function send(res,status,data,cache='public, max-age=60'){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',cache);
  if(status===200)res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=1800, stale-while-revalidate=43200, stale-if-error=86400');
  res.end(JSON.stringify(data));
}
async function streamToText(stream){
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
function fallback(){
  return {
    updatedAt:new Date().toISOString(),
    events:CURATED_EVENTS,
    sources:[{name:'Embedded curated schedule',ok:true,count:CURATED_EVENTS.length,mode:'fallback'}],
    fallback:true
  };
}

export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{ok:false,error:'method_not_allowed'},'no-store');
  try{
    const result=await get(SNAPSHOT_PATH,{access:'private',useCache:false,storeId:BLOB_STORE_ID});
    if(result&&result.statusCode===200){
      const parsed=JSON.parse(await streamToText(result.stream));
      if(Array.isArray(parsed?.events)&&parsed.events.length>=CURATED_EVENTS.length){
        const payload={
          updatedAt:parsed.updatedAt||new Date().toISOString(),
          events:parsed.events,
          sources:Array.isArray(parsed.sources)?parsed.sources:[]
        };
        if(req.method==='HEAD'){
          res.statusCode=200;
          res.setHeader('Cache-Control','public, max-age=60');
          res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=1800, stale-while-revalidate=43200, stale-if-error=86400');
          return res.end();
        }
        return send(res,200,payload);
      }
    }
  }catch(e){}
  const data=fallback();
  if(req.method==='HEAD'){
    res.statusCode=200;
    res.setHeader('Cache-Control','public, max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=1800, stale-while-revalidate=43200, stale-if-error=86400');
    return res.end();
  }
  return send(res,200,data);
}
