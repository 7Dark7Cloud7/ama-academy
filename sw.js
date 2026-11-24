/* AMA · service worker
   Uma sala de aula em Luanda perde a rede a meio do vídeo, não a meio da
   explicação. Este worker não pré-carrega nada: guarda o que o navegador já
   pediu e serve esse cache quando a rede falha. Por isso o código da app é
   "rede primeiro" — um ficheiro velho em cache seria uma versão fantasma. */
const CODIGO = 'ama-codigo-v6';
const TIPOS = 'ama-tipos-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const velhas = (await caches.keys()).filter((k) => k !== CODIGO && k !== TIPOS);
    await Promise.all(velhas.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Só entram no cache os URL com versão estável (?v=3) ou sem parâmetros: os
   testes de auditoria pedem index.html?q=<timestamp> e encheriam o cache à toa. */
const estavel = (search) => search === '' || /^\?v=\d+$/.test(search);
const guardar = (req, res, nome) => caches.open(nome).then((c) => c.put(req, res));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
  if (u.pathname.endsWith('/sw.js') || u.pathname.startsWith('/api/')) return;

  /* Tipos de letra do Google: mudam raramente e sem eles a app perde a marca,
     por isso aqui o cache ganha à rede. */
  if (u.hostname.endsWith('gstatic.com') || u.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.open(TIPOS).then(async (c) => {
      const emCache = await c.match(req);
      if (emCache) return emCache;
      const res = await fetch(req);
      if (res && res.ok) guardar(req, res.clone(), TIPOS);
      return res;
    }));
    return;
  }

  const mesmaOrigem = u.origin === self.location.origin;
  e.respondWith((async () => {
    let res = null;
    try {
      res = await fetch(req, (req.mode === 'navigate' || req.destination === 'document') ? { cache: 'no-store' } : undefined);
      if (res && res.ok && mesmaOrigem && estavel(u.search)) guardar(req, res.clone(), CODIGO);
    } catch {
      const emCache = await caches.match(req);
      if (emCache) return emCache;
      /* Sem rede e sem cópia deste ficheiro: uma navegação volta para a app
         em vez de mostrar a página de erro do browser. */
      if (req.mode === 'navigate' || req.destination === 'document') {
        const casa = await caches.match('index.html', { ignoreSearch: true });
        if (casa) return casa;
      }
      return new Response('Fora de linha', { status: 503, statusText: 'offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return res;
  })());
});
