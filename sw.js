/* Service worker: deixa o jogo jogável offline depois da primeira visita. */
const CACHE = 'milvidas-v4';
const FILES = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icon.svg',
  './img/manifest.js', './js/engine.js', './js/gen.js', './js/art.js', './js/audio.js', './js/ui.js',
  './fonts/pixelify-sans-latin-400-normal.woff2', './fonts/alegreya-latin-400-normal.woff2', './fonts/alegreya-latin-400-italic.woff2', './fonts/alegreya-latin-700-normal.woff2', './fonts/pixelify-sans-latin-700-normal.woff2', './js/content/origens.js', './js/content/infancia.js',
  './js/content/juventude.js', './js/content/adulto.js', './js/content/velhice.js', './js/content/procedural.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  // rede primeiro (para receber atualizações), cache como reserva offline
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
