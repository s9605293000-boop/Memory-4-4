const CACHE = 'memory-duel-v4-4';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/main.js', '/lang.js',
  '/manifest.webmanifest',
  '/assets/icons/icon-192.png', '/assets/icons/icon-512.png',
  '/assets/avatars/1.png', '/assets/avatars/2.png', '/assets/avatars/3.png',
  '/assets/avatars/4.png', '/assets/avatars/5.png', '/assets/avatars/6.png',
  '/assets/cards/question.png',
  '/assets/cards/1.png','/assets/cards/2.png','/assets/cards/3.png','/assets/cards/4.png',
  '/assets/cards/5.png','/assets/cards/6.png','/assets/cards/7.png','/assets/cards/8.png',
  '/assets/cards/9.png','/assets/cards/10.png','/assets/cards/11.png','/assets/cards/12.png'
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
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});