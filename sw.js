const CACHE = 'agenda-juridica-v1';
const ARQUIVOS = ['./', 'index.html', 'brasao_itaparica.png', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Chamadas à nuvem (Supabase) nunca passam pelo cache
  if (url.origin !== location.origin) return;
  // Página: tenta a rede primeiro (pega atualizações), cai para o cache se offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
    );
    return;
  }
  // Demais arquivos: cache primeiro
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
