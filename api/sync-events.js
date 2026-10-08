import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { CURATED_EVENTS } from '../lib/events-data.js';
import { buildEventsSnapshot } from '../lib/events-scraper.js';

const BLOB_STORE_ID='store_vUvKgnlBSMEysQyD';
const SNAPSHOT_PATH='cache/events-live.json';
const REPO='dbteertha/admissionbydbt';

function json(res,status,data){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(data));
}
function safeEqual(a,b){
  const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));
  return aa.length===bb.length&&aa.length>0&&crypto.timingSafeEqual(aa,bb);
}
async function authorized(req){
  const configured=process.env.SYNC_SECRET;
  const supplied=req.headers['x-sync-secret'];
  if(configured&&safeEqual(supplied,configured))return true;

  const auth=String(req.headers.authorization||'');
  const match=auth.match(/^Bearer\s+(.+)$/i);
  if(!match)return false;
  try{
    const r=await fetch('https://api.github.com/repos/'+REPO,{
      headers:{
        Authorization:'Bearer '+match[1],
        Accept:'application/vnd.github+json',
        'User-Agent':'admissionbydbt-event-sync'
      }
    });
    if(!r.ok)return false;
    const data=await r.json();
    return data?.full_name===REPO&&data?.permissions?.push===true;
  }catch(e){return false}
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,error:'method_not_allowed'});
  if(!(await authorized(req)))return json(res,401,{ok:false,error:'unauthorized'});
  try{
    const snapshot=await buildEventsSnapshot();
    const healthySources=(snapshot.sources||[]).filter(x=>x.ok&&x.count>0).length;
    if(snapshot.externalCount<3||healthySources<1||snapshot.events.length<CURATED_EVENTS.length){
      return json(res,503,{
        ok:false,
        error:'snapshot_validation_failed',
        externalCount:snapshot.externalCount,
        healthySources,
        mergedCount:snapshot.events.length
      });
    }
    const payload={version:1,updatedAt:snapshot.updatedAt,events:snapshot.events,sources:snapshot.sources};
    await put(SNAPSHOT_PATH,JSON.stringify(payload),{
      access:'private',
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:'application/json; charset=utf-8',
      storeId:BLOB_STORE_ID
    });
    return json(res,200,{ok:true,status:'updated',count:payload.events.length,externalCount:snapshot.externalCount,healthySources});
  }catch(e){
    return json(res,500,{ok:false,error:e?.message||'sync_events_failed'});
  }
}
