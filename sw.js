// Budgy service worker. Bump VERSION when you want to force-refresh the cache.
const VERSION = 'budgy-v1';
const CORE = ['./', 'index.html', 'app.js', 'firebase.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const CDN = /(^|\.)(jsdelivr\.net|tailwindcss\.com|gstatic\.com|googleapis\.com)$/;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => fetch(u, { cache: 'reload' }).then((r) => r.ok && c.put(u, r)).catch(() => {})))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) { // your own files: network first so a new deploy shows immediately, cache when offline
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((h) => h || (r.mode === 'navigate' ? caches.match('index.html') : undefined))));
  } else if (CDN.test(u.hostname) && !/firestore|identitytoolkit|securetoken/.test(u.hostname)) { // pinned CDN files and fonts: cache first
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(VERSION).then((x) => x.put(r, c)); } return res; })));
  }
});
