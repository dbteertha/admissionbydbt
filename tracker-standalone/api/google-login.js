import crypto from 'node:crypto';

const CLIENT_ID="339294750280-18e1h251at3am9qiuuf30uq1hb1dclqb.apps.googleusercontent.com";
const SCOPE='https://www.googleapis.com/auth/spreadsheets';

function cookie(name,value,maxAge){
  return name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;
}
function requestOrigin(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  if(!host)throw new Error('Missing request host');
  return proto+'://'+host;
}

export default async function handler(req,res){
  const state=crypto.randomBytes(24).toString('base64url');
  const redirectUri=requestOrigin(req)+'/api/google-callback';
  res.setHeader('Set-Cookie',cookie('dbt_google_state',state,600));
  const q=new URLSearchParams({
    client_id:CLIENT_ID,
    redirect_uri:redirectUri,
    response_type:'code',
    scope:SCOPE,
    access_type:'offline',
    prompt:'consent',
    include_granted_scopes:'true',
    state
  });
  res.statusCode=302;
  res.setHeader('Location','https://accounts.google.com/o/oauth2/v2/auth?'+q.toString());
  res.end();
}
