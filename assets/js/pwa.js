/* Seu Comando · instala o app e avisa quando sai versão nova. */
(function () {
  'use strict';
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
