self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("memory-duel-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/main.js",
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/maskable-icon.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});