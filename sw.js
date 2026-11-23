/* Seu Comando · service worker: deixa o app instalável, abre sem internet e avisa quando há versão nova.
   A cada publicação, aumente VERSAO: o app mostra "Nova versão disponível" e atualiza com um toque. */
var VERSAO = '2026.11.23-1';
var CACHE = 'seucomando-' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'app.html', 'entrar.html', 'triagem.html', 'recrutamento.html', 'manifest.webmanifest',
  'assets/css/site.css', 'assets/css/app.css', 'assets/img/logo.svg', 'assets/img/favicon.svg', 'assets/img/logo-transparente.svg', 'assets/img/icone-192.png', 'assets/img/icone-512.png',
  'assets/js/config.js', 'assets/js/vendor/supabase.js', 'assets/js/nuvem.js', 'assets/js/pwa.js', 'assets/js/rosto.js', 'assets/js/entrar.js', 'assets/js/site.js', 'assets/js/app.js', 'assets/js/data.js', 'assets/js/cargos.js',
  'assets/js/clausulas.js', 'assets/js/perguntas.js', 'assets/js/perfis.js', 'assets/js/perfis2.js', 'assets/js/cursos.js', 'assets/js/code39.js', 'assets/js/triagem.js', 'assets/js/vendor/html2pdf.bundle.min.js'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('seucomando-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('message', function (e) { if (e.data === 'atualizar') self.skipWaiting(); if (e.data === 'versao' && e.source) e.source.postMessage({ versao: VERSAO }); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;            // banco de dados e fontes: sempre pela rede
  if (req.mode === 'navigate') {                                                         // páginas: rede primeiro, cópia se estiver sem internet
    e.respondWith(fetch(req).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (x) { x.put(req, c); }); return r; }).catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('app.html'); }); }));
    return;
  }
  if (/\/modelos-rosto\/|\/vendor\/face-api\.js$/.test(url.pathname)) {                 // reconhecimento facial: baixa uma vez e guarda entre versões
    e.respondWith(caches.open('sc-rosto-1').then(function (c) { return c.match(req).then(function (r) { return r || fetch(req).then(function (x) { if (x.ok) c.put(req, x.clone()); return x; }); }); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (r) { return r || fetch(req); }));
});
