import crypto from 'node:crypto';
import { get, put } from '@vercel/blob';

const BLOB_STORE_ID='store_vUvKgnlBSMEysQyD';
const PATHNAME='admin/site-content-v1.json';

function json(res,status,data,cache='no-store',vercelCache=''){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control',cache);
  if(vercelCache)res.setHeader('Vercel-CDN-Cache-Control',vercelCache);
  res.end(JSON.stringify(data));
}
function safeEqual(a,b){
  const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));
  return aa.length===bb.length && aa.length>0 && crypto.timingSafeEqual(aa,bb);
}
async function readBody(req){
  let s='';
  for await(const chunk of req){
    s+=chunk;
    if(s.length>900000)throw new Error('payload_too_large');
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
    if(out.length>900000)throw new Error('stored_payload_too_large');
  }
  out+=dec.decode();
  return out;
}
function cleanConfig(x){
  const text={};
  const hidden={};
  const orders={};
  const srcText=x&&x.text&&typeof x.text==='object'?x.text:{};
  const srcHidden=x&&x.hidden&&typeof x.hidden==='object'?x.hidden:{};
  const srcOrders=x&&x.orders&&typeof x.orders==='object'?x.orders:{};

  for(const [k,v] of Object.entries(srcText).slice(0,5000)){
    const key=String(k).slice(0,700);
    text[key]=String(v??'').slice(0,12000);
  }
  for(const [k,v] of Object.entries(srcHidden).slice(0,5000)){
    if(v)hidden[String(k).slice(0,700)]=true;
  }
  for(const [k,v] of Object.entries(srcOrders).slice(0,1500)){
    if(!Array.isArray(v))continue;
    orders[String(k).slice(0,700)]=v.map(x=>String(x).slice(0,700)).slice(0,500);
  }
  return {version:1,updatedAt:Number(x?.updatedAt)||Date.now(),text,hidden,orders};
}
async function load(){
  const r=await get(PATHNAME,{access:'private',useCache:false,storeId:BLOB_STORE_ID});
  if(!r||r.statusCode!==200)return cleanConfig({});
  return cleanConfig(JSON.parse(await streamToText(r.stream)));
}

export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      return json(
        res,
        200,
        {ok:true,config:await load()},
        'public, max-age=60',
        'public, s-maxage=600, stale-while-revalidate=86400, stale-if-error=86400'
      );
    }
    if(req.method==='PUT'||req.method==='POST'){
      const expected=process.env.ADMIN_KEY;
      if(!expected)return json(res,503,{ok:false,error:'admin_key_not_configured'});
      if(!safeEqual(req.headers['x-admin-key'],expected))return json(res,401,{ok:false,error:'wrong_admin_key'});
      const config=cleanConfig(await readBody(req));
      config.updatedAt=Date.now();
      await put(PATHNAME,JSON.stringify(config),{
        access:'private',
        addRandomSuffix:false,
        allowOverwrite:true,
        contentType:'application/json; charset=utf-8',
        storeId:BLOB_STORE_ID
      });
      return json(res,200,{ok:true,config});
    }
    return json(res,405,{ok:false,error:'method_not_allowed'});
  }catch(e){
    return json(res,500,{ok:false,error:e?.message||'admin_content_error'});
  }
}
