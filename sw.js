/* Finanças Victor e Letícia: funciona sem internet. Versão 13ba4d133004 */
const CACHE = 'financas-13ba4d133004';
const PRECACHE = ["./","./apple-touch-icon.png","./assets/bricolage-grotesque-latin-ext-opsz-normal-IcJDqblK.woff2","./assets/bricolage-grotesque-latin-opsz-normal-Cre6nC2_.woff2","./assets/index-B2u12TUo.js","./assets/index-DmI7zCcd.css","./assets/instrument-sans-latin-ext-wdth-normal-C5E2Gvlv.woff2","./assets/instrument-sans-latin-wdth-normal-BVScPF0l.woff2","./assets/xlsx-DYas4hFQ.js","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./icon.svg","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('financas-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // a nuvem nunca passa pelo cache

  // Página: tenta a versão nova primeiro; sem internet, abre a guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      Promise.race([fetch(req), timeout(4000)])
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./', copy));
          }
          return res;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // nuvem.json: sempre a versão mais nova, com a guardada de reserva.
  if (url.pathname.endsWith('/nuvem.json')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response('{}', { headers: { 'Content-Type': 'application/json' } }))),
    );
    return;
  }

  // Arquivos do app: do cache, e guarda o que ainda não tinha.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
