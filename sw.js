// Budgy service worker (v6 Final).
//
// HOW UPDATES WORK
//  1. Deploy new files and change VERSION below (any change to this file makes the browser treat it as a new worker).
//  2. app.js / p3.js ask the browser to re-check this file every minute, whenever the app returns to the foreground,
//     and whenever the device comes back online, so an installed home-screen app finds the new version while it is open.
//  3. The new worker installs and then WAITS (it does not take over mid-session). The app shows an "Update Now" prompt.
//  4. Update Now posts { type: 'SKIP_WAITING' } to the waiting worker. It activates, the page sees `controllerchange`, and reloads.
// Nobody ever has to remove the app from the home screen to get an update.
const VERSION = 'budgy-v6-final-1';
// Icon cache-busting: the icons are requested with ?v=ICON_REV (index.html and manifest.json use the same value). Bump ICON_REV together with VERSION
// whenever the artwork changes. A new VERSION creates a fresh cache, and activate() below deletes every older cache, including the old icons.
// Note: iOS copies the home-screen icon once, when the app is added. An already-installed icon only changes after it is removed and re-added.
const ICON_REV = '6';
const CORE = ['./', 'index.html', 'core.js', 'ui.js', 'pages.js', 'p2.js', 'p3.js', 'io.js', 'receipt.js', 'shortcuts.js', 'app.js', 'firebase.js', 'manifest.json',
  'icons/icon-192.png?v=' + ICON_REV, 'icons/icon-512.png?v=' + ICON_REV, 'icons/maskable-512.png?v=' + ICON_REV, 'icons/apple-touch-icon.png?v=' + ICON_REV];
// Pinned CDN files and fonts are cached after first load so the app opens offline. Live Firebase traffic is never cached.
const CDN = /^(cdn\.jsdelivr\.net|cdn\.tailwindcss\.com|www\.gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', (e) => {
  // No skipWaiting() here on purpose: the page decides when to switch (see the message handler below).
  // On a device's very first install there is no older worker, so this one activates straight away.
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => fetch(u, { cache: 'reload' }).then((r) => r.ok && c.put(u, r)).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Messages from the page.
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  else if (d.type === 'GET_VERSION' && e.ports && e.ports[0]) e.ports[0].postMessage({ version: VERSION });
  else if (d.type === 'CLEAR_CACHES') e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))).then(() => e.ports && e.ports[0] && e.ports[0].postMessage({ cleared: true })));
});

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    // Your own files: network first (revalidating the browser's HTTP cache too) so a new deploy shows immediately; cache when offline.
    e.respondWith(fetch(r, { cache: 'no-cache' }).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((h) => h || (r.mode === 'navigate' ? caches.match('index.html') : undefined))));
  } else if (CDN.test(u.hostname)) {
    // Pinned CDN files: cache first.
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(VERSION).then((x) => x.put(r, c)); } return res; })));
  }
});
