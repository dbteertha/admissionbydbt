const CACHE='dbt-shell-v10';
const SHELL=['/','/manifest.webmanifest','/app-icon.svg','/css/app-v1.css','/css/experience-v10.css','/css/guide-v4.css','/js/app-v3.js','/js/guide-v4.js','/data/admission-criteria-v2.json','/admission-map-v2.css','/admission-map-v2.js','/data/admission-map-v2.json'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin')||url.pathname.startsWith('/tracker'))return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(cache=>cache.put('/',copy)).catch(()=>{});
        return resp;
      }).catch(()=>caches.match('/'))
    );
    return;
  }

  if(
    url.pathname==='/manifest.webmanifest'||
    url.pathname==='/app-icon.svg'||
    url.pathname.startsWith('/css/')||
    url.pathname.startsWith('/js/')||
    url.pathname.startsWith('/vendor/')||
    url.pathname.startsWith('/data/')||
    url.pathname.startsWith('/admission-map')
  ){
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
      return resp;
    })));
  }
});
