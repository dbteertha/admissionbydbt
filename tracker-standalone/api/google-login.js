import crypto from 'node:crypto';

const CLIENT_ID="339294750280-18e1h251at3am9qiuuf30uq1hb1dclqb.apps.googleusercontent.com";
const REDIRECT_URI='https://dbt-tracker-theta.vercel.app/api/google-callback';
const SCOPE='https://www.googleapis.com/auth/spreadsheets';

function cookie(name,value,maxAge){
  return name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;
}

export default async function handler(req,res){
  const state=crypto.randomBytes(24).toString('base64url');
  res.setHeader('Set-Cookie',cookie('dbt_google_state',state,600));
  const q=new URLSearchParams({
    client_id:CLIENT_ID,
    redirect_uri:REDIRECT_URI,
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
