const CACHE='memory-duel-v1';
const ASSETS=[
  '/', '/index.html','/styles.css','/main.js','/lang.js','/manifest.webmanifest',
  '/assets/cards/back.png',
  '/assets/avatars/pirate_avatar_1.jpg','/assets/avatars/pirate_avatar_2.jpg','/assets/avatars/pirate_avatar_3.jpg'
];
for(let i=1;i<=12;i++){ ASSETS.push('/assets/cards/pirate_'+String(i).padStart(2,'0')+'.png'); }

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(ASSETS.includes(url.pathname)){
    e.respondWith(caches.match(e.request));
  }else if(url.pathname.startsWith('/assets/')){
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return resp;
      }))
    );
  }
});