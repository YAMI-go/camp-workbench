const CACHE = 'camp-wb-v2';
const APP_SHELL = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(APP_SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 页面导航：强制回源(绕过 GitHub Pages/CDN 缓存)拿最新 index.html，离线则回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, {cache:'reload'})
        .then((r) => {
          if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./', cp)); }
          return r;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：缓存优先，回源并更新
  e.respondWith(
    caches.match(req).then((r) =>
      r ||
      fetch(req)
        .then((rr) => {
          if (rr.ok && rr.type === 'basic') {
            const cp = rr.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
          }
          return rr;
        })
        .catch(() => r)
    )
  );
});
