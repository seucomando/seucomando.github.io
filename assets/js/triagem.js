/* Centralizar — pré-entrevista (triagem) que o candidato responde pelo link. Só perguntas; nenhum documento. */
(function () {
  'use strict';
  var KEY = 'centralizar-prototipo-v5';
  var doc = document;
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sem armazenamento */ } var s = JSON.parse(JSON.stringify(window.BROTA_SEED)); s.role = 'empresa'; s.ui = {}; s.nsr = 4812; return s; }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  var S = load();
  var id = '';
  try { id = new URLSearchParams(location.search).get('vaga') || ''; } catch (e) { /* ignora */ }
  var vaga = S.vagas.filter(function (v) { return v.id === id; })[0] || S.vagas[0];
  doc.getElementById('t-empresa').textContent = S.empresa.nome + ' · ' + vaga.regimeOferta;
  doc.getElementById('t-vaga').textContent = 'Pré-entrevista · ' + vaga.titulo;
  doc.title = 'Pré-entrevista · ' + vaga.titulo;

  var form = doc.getElementById('triagem'), erro = doc.getElementById('t-erro');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), turnos = d.getAll('turnos');
    var nome = String(d.get('nome') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    var fone = String(d.get('fone') || '').replace(/[^\d()+ -]/g, '').trim().slice(0, 20);
    var faltando = [];
    if (nome.split(' ').length < 2) faltando.push('nome completo');
    if (fone.replace(/\D/g, '').length < 10) faltando.push('WhatsApp com DDD');
    if (!d.get('regime')) faltando.push('como quer trabalhar');
    if (!turnos.length) faltando.push('pelo menos um turno');
    if (!d.get('km')) faltando.push('distância');
    if (d.get('exp') === null || d.get('exp') === '') faltando.push('experiência');
    if (faltando.length) { erro.hidden = false; erro.textContent = 'Falta preencher: ' + faltando.join(', ') + '.'; erro.focus && erro.focus(); return; }
    erro.hidden = true;
    vaga.cands.push({ n: nome, regime: String(d.get('regime')), turnos: turnos.filter(function (t) { return ['manha', 'tarde', 'noite', 'fds'].indexOf(t) > -1; }), km: +d.get('km'), exp: +d.get('exp'), fone: fone, contato: d.get('contato') === 'sim', novo: true });
    save(S);
    form.hidden = true;
    var ok = doc.getElementById('t-ok'); ok.hidden = false;
    doc.getElementById('t-ok-tit').textContent = 'Pronto, ' + nome.split(' ')[0] + '! Recebemos suas respostas.';
    ok.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
