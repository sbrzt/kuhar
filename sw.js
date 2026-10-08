const CACHE = 'kuhar-v1';
const FILES = ['./', 'style.css', 'script.js', 'qr.js', 'vendor/qrcode.js', 'logo.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(e.request, copy));
      return response;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
