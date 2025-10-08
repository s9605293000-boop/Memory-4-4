const CACHE = 'memory-duel-v4-4';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/main.js', '/lang.js',
  '/manifest.webmanifest',
  '/assets/icons/icon-192.png', '/assets/icons/icon-512.png',
  '/assets/avatars/default.png',
  '/assets/cards/question.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});