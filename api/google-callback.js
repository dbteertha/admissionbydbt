import crypto from 'node:crypto';

const CLIENT_ID="339294750280-18e1h251at3am9qiuuf30uq1hb1dclqb.apps.googleusercontent.com";
const REDIRECT_URI='https://admissionbydbt.vercel.app/api/google-callback';

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
function encrypt(value){
  const iv=crypto.randomBytes(12);
  const c=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const data=Buffer.concat([c.update(value,'utf8'),c.final()]);
  const tag=c.getAuthTag();
  return [iv,data,tag].map(x=>x.toString('base64url')).join('.');
}
function cookie(name,value,maxAge){
  return name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;
}

export default async function handler(req,res){
  try{
    const url=new URL(req.url,'https://admissionbydbt.vercel.app');
    const code=url.searchParams.get('code');
    const state=url.searchParams.get('state');
    const error=url.searchParams.get('error');
    const cookies=parseCookies(req);
    if(error)throw new Error('Google authorization was cancelled: '+error);
    if(!code||!state||!cookies.dbt_google_state||state!==cookies.dbt_google_state)throw new Error('OAuth state check failed');

    const clientSecret=process.env.GOOGLE_CLIENT_SECRET;
    if(!clientSecret)throw new Error('GOOGLE_CLIENT_SECRET is not configured');

    const body=new URLSearchParams({
      code,
      client_id:CLIENT_ID,
      client_secret:clientSecret,
      redirect_uri:REDIRECT_URI,
      grant_type:'authorization_code'
    });
    const r=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const data=await r.json();
    if(!r.ok)throw new Error(data.error_description||data.error||'Token exchange failed');
    if(!data.refresh_token)throw new Error('Google did not return a refresh token. Revoke the old app grant once, then connect again.');

    res.setHeader('Set-Cookie',[
      cookie('dbt_google_rt',encrypt(data.refresh_token),31536000),
      cookie('dbt_google_state','',0)
    ]);
    res.statusCode=302;
    res.setHeader('Location','/tracker?google=connected');
    res.end();
  }catch(e){
    res.statusCode=302;
    res.setHeader('Location','/tracker?google_error='+encodeURIComponent(e.message||'OAuth failed'));
    res.end();
  }
}
