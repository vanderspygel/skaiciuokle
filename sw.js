// Service worker: visi failai kešuojami (cache-first), žaidimas veikia be interneto.
// SVARBU: po kiekvieno pakeitimo padidink VERSION, kitaip iPad'as neatsinaujins.

const VERSION = 'v2';
const CACHE = `skaiciuokle-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/config.js',
  './js/math.js',
  './js/storage.js',
  './js/rewards.js',
  './js/monster.js',
  './js/monsterView.js',
  './js/catalog.js',
  './js/ui.js',
  './js/screens/common.js',
  './js/screens/home.js',
  './js/screens/create.js',
  './js/screens/levels.js',
  './js/screens/setup.js',
  './js/screens/quiz.js',
  './js/screens/results.js',
  './js/screens/shop.js',
  './js/screens/room.js',
  './js/screens/badges.js',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('skaiciuokle-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => {
        // Be interneto: puslapio užklausoms grąžinam pagrindinį puslapį.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
