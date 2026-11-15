/* Seu Comando · instala o app (ícone na área de trabalho, no celular ou no computador) e avisa quando sai versão nova. */
(function () {
  'use strict';
  // Botões [data-instalar]: aparecem só quando dá para instalar e somem depois de instalado.
  var pedido = null;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function instalado() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function mostrar(sim) { document.querySelectorAll('[data-instalar]').forEach(function (b) { b.hidden = !sim; }); }
  function faixa(texto) {
    var velha = document.getElementById('dica-instalar'); if (velha) velha.remove();
    var d = document.createElement('div'); d.id = 'dica-instalar'; d.className = 'nova-versao'; d.setAttribute('role', 'status');
    var t = document.createElement('span'); t.textContent = texto;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = 'Entendi';
    b.addEventListener('click', function () { d.remove(); });
    d.appendChild(t); d.appendChild(b); document.body.appendChild(d);
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; mostrar(true); });
  window.addEventListener('appinstalled', function () { pedido = null; mostrar(false); faixa('Pronto: o Seu Comando foi instalado. Abra pelo ícone, como qualquer aplicativo.'); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-instalar]'); if (!b) return;
    e.preventDefault();
    if (pedido) { var p = pedido; pedido = null; p.prompt(); p.userChoice.then(function (r) { if (r && r.outcome === 'accepted') mostrar(false); }, function () { /* ignora */ }); return; }
    faixa(ios ? 'No iPhone: toque em Compartilhar (o quadrado com a seta) e depois em "Adicionar à Tela de Início".' : 'No menu do navegador, escolha "Instalar app" ou "Instalar este site como aplicativo".');
  });
  function inicio() { if (!instalado() && ios) mostrar(true); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio); else inicio();

  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  var recarregando = false;
  function aviso(reg) {
    if (document.getElementById('nova-versao')) return;
    var d = document.createElement('div'); d.id = 'nova-versao'; d.className = 'nova-versao'; d.setAttribute('role', 'status');
    var t = document.createElement('span'); t.textContent = 'Nova versão do Seu Comando disponível.';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm btn-primary'; b.textContent = 'Atualizar agora';
    b.addEventListener('click', function () { if (reg.waiting) reg.waiting.postMessage('atualizar'); });
    d.appendChild(t); d.appendChild(b); document.body.appendChild(d);
  }
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    if (reg.waiting && navigator.serviceWorker.controller) aviso(reg);
    reg.addEventListener('updatefound', function () { var n = reg.installing; if (n) n.addEventListener('statechange', function () { if (n.state === 'installed' && navigator.serviceWorker.controller) aviso(reg); }); });
    setInterval(function () { reg.update().catch(function () { /* sem internet */ }); }, 30 * 60 * 1000);
  }).catch(function () { /* navegador sem suporte */ });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (recarregando) return; recarregando = true; location.reload(); });
})();
