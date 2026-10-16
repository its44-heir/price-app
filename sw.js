// 离线缓存：先用缓存秒开，同时在后台联网更新缓存，app 有新版本时下次打开生效
const CACHE = 'price-app';
const FILES = ['./', 'index.html', 'xlsx.full.min.js', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const update = fetch(e.request, { cache: 'no-cache' })
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    if (hit) { e.waitUntil(update.catch(() => {})); return hit; }
    return update;
  }));
});
