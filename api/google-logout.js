export default async function handler(req,res){
  res.setHeader('Set-Cookie','dbt_google_rt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.statusCode=302;
  res.setHeader('Location','/tracker');
  res.end();
}
