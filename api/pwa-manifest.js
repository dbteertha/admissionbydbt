export default function handler(req,res){
  const body={
    name:'Admission by DBT',
    short_name:'Admission DBT',
    description:'Bangladesh admission calendar, circulars, My Exams and Admission Guide.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#ffffff',
    theme_color:'#ffffff',
    orientation:'portrait-primary',
    icons:[
      {src:'/app-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
      {src:'/app-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'maskable'}
    ]
  };
  res.statusCode=200;
  res.setHeader('content-type','application/manifest+json; charset=utf-8');
  res.setHeader('cache-control','public, max-age=3600');
  res.end(JSON.stringify(body));
}
