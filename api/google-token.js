import crypto from 'node:crypto';

const CLIENT_ID="339294750280-18e1h251at3am9qiuuf30uq1hb1dclqb.apps.googleusercontent.com";

function parseCookies(req){
  return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf('=');
    return i<0?[x,'']:[x.slice(0,i),decodeURIComponent(x.slice(i+1))];
  }));
}
function key(){
  const secret=process.env.SESSION_SECRET;
  if(!secret)throw new Error('SESSION_SECRET is not configured');
  return crypto.createHash('sha256').update(secret).digest();
}
function decrypt(value){
  const [iv64,data64,tag64]=String(value||'').split('.');
  if(!iv64||!data64||!tag64)throw new Error('Invalid session cookie');
  const d=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(iv64,'base64url'));
  d.setAuthTag(Buffer.from(tag64,'base64url'));
  return Buffer.concat([d.update(Buffer.from(data64,'base64url')),d.final()]).toString('utf8');
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const cookies=parseCookies(req);
    if(!cookies.dbt_google_rt){res.statusCode=401;res.end(JSON.stringify({connected:false}));return}
    const refreshToken=decrypt(cookies.dbt_google_rt);
    const clientSecret=process.env.GOOGLE_CLIENT_SECRET;
    if(!clientSecret)throw new Error('GOOGLE_CLIENT_SECRET is not configured');

    const body=new URLSearchParams({
      client_id:CLIENT_ID,
      client_secret:clientSecret,
      refresh_token:refreshToken,
      grant_type:'refresh_token'
    });
    const r=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const data=await r.json();
    if(!r.ok){
      res.statusCode=401;
      res.end(JSON.stringify({connected:false,error:data.error||'refresh_failed'}));
      return;
    }
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.statusCode=200;
    res.end(JSON.stringify({
      connected:true,
      access_token:data.access_token,
      expires_in:data.expires_in||3600,
      token_type:data.token_type||'Bearer'
    }));
  }catch(e){
    res.statusCode=500;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({connected:false,error:e.message||'session_error'}));
  }
}
