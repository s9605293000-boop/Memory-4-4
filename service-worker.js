
self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open('md4-4').then(c=>c.addAll(['./','./index.html','./styles.css','./main.js','./lang.js','./config.js'])));
});
self.addEventListener('fetch',(e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
