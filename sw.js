// 离线缓存：
// - 页面本身（index.html）联网时先取最新版，3 秒取不到或没网再用缓存 → 更新打开一次就生效
// - 其他文件先用缓存秒开，同时在后台更新缓存
const CACHE = 'price-app';
const FILES = ['./', 'index.html', 'xlsx.full.min.js', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

function fetchAndCache(cache, request) {
  return fetch(request, { cache: 'no-cache' })
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res; });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const update = fetchAndCache(cache, e.request);
    if (isPage) {
      const timeout = new Promise(resolve => setTimeout(resolve, 3000));
      const fresh = await Promise.race([update.catch(() => null), timeout]);
      if (fresh && fresh.ok) return fresh;
      if (hit) { e.waitUntil(update.catch(() => {})); return hit; }
      return update;
    }
    if (hit) { e.waitUntil(update.catch(() => {})); return hit; }
    return update;
  }));
});
