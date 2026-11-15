/* Seu Comando — pré-entrevista (triagem) que o candidato responde pelo link. Só perguntas; nenhum documento. */
(function () {
  'use strict';
  var KEYTIPO = 'centralizar-tipo-atual', TIPOS = window.CENTRALIZAR_TIPOS || {}, tp = '';
  try { tp = new URLSearchParams(location.search).get('t') || ''; } catch (e) { /* ignora */ }
  if (!TIPOS[tp]) { try { tp = localStorage.getItem(KEYTIPO) || 'padaria'; } catch (e) { tp = 'padaria'; } }
  var KEY = 'centralizar-prototipo-v8:' + tp;
  var doc = document;
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sem armazenamento */ } var s = window.CENTRALIZAR_SEED ? window.CENTRALIZAR_SEED(tp) : JSON.parse(JSON.stringify(window.BROTA_SEED)); s.role = 'empresa'; s.ui = {}; s.nsr = 4812; return s; }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  function el(tag, attrs, text) { var e = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text) e.textContent = text; return e; }
  var S = load();
  var prm = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { prm[k] = v; }); } catch (e) { /* ignora */ }
  var NUVEM = !!(window.Nuvem && Nuvem.ativa && prm.e);
  if (NUVEM) {
    doc.getElementById('triagem').hidden = true;
    doc.querySelectorAll('[data-so-exemplo]').forEach(function (el) { el.remove(); });
    Nuvem.vagaPublica(prm.e, prm.vaga || '').then(function (r) {
      if (!r || !r.vaga) { doc.getElementById('t-vaga').textContent = 'Esta vaga não está mais aberta'; return; }
      S = { empresa: { nome: r.empresa || 'Empresa' }, vagas: [{ id: r.vaga.id, titulo: r.vaga.titulo || 'Vaga', cargo: r.vaga.cargo, regimeOferta: r.vaga.regimeOferta || '', cliente: r.cliente ? 'k' : undefined, cands: [] }], clientes: r.cliente ? [{ id: 'k', nome: r.cliente }] : [] };
      doc.getElementById('triagem').hidden = false; iniciar();
    }, function () { doc.getElementById('t-vaga').textContent = 'Não foi possível abrir a pré-entrevista. Tente de novo.'; });
  } else iniciar();
  function iniciar() {
  var id = '';
  try { id = new URLSearchParams(location.search).get('vaga') || ''; } catch (e) { /* ignora */ }
  var vaga = S.vagas.filter(function (v) { return v.id === id; })[0] || S.vagas[0];
  var cargo = (window.CENTRALIZAR_CARGOS || []).filter(function (c) { return c.id === vaga.cargo; })[0];
  var cliente = vaga.cliente && (S.clientes || []).filter(function (k) { return k.id === vaga.cliente; })[0];
  doc.getElementById('t-empresa').textContent = (cliente ? S.empresa.nome + ' · seleção para ' + cliente.nome : S.empresa.nome) + ' · ' + vaga.regimeOferta;
  var boxComp = doc.getElementById('t-comp-box');
  if (cliente && boxComp) { boxComp.hidden = false; doc.getElementById('t-comp-l').textContent = 'Autorizo ' + S.empresa.nome + ' a compartilhar minhas respostas e o parecer da entrevista com a empresa contratante (' + cliente.nome + '), só para esta vaga'; }
  doc.getElementById('t-vaga').textContent = 'Pré-entrevista · ' + vaga.titulo;
  doc.title = 'Pré-entrevista · ' + vaga.titulo;
  if (cargo) doc.getElementById('t-cargo').textContent = 'O que a função faz: ' + cargo.atrib.join('; ').toLowerCase() + '.';

  // Requisitos que dependem do cargo
  var reqs = window.CENTRALIZAR_REQS_DO_CARGO ? window.CENTRALIZAR_REQS_DO_CARGO(cargo) : [];
  var box = doc.getElementById('t-reqs');
  reqs.forEach(function (r) {
    var fs = el('fieldset', { class: 'field cand-set' }); fs.appendChild(el('legend', {}, r.q));
    ['sim', 'nao'].forEach(function (v) {
      var lb = el('label', { class: 'check' }); var inp = el('input', { type: 'radio', name: 'req_' + r.k, value: v }); lb.appendChild(inp); lb.appendChild(doc.createTextNode(' ' + (v === 'sim' ? 'Sim' : 'Não'))); fs.appendChild(lb);
    });
    box.appendChild(fs);
  });
  doc.getElementById('t-reqs-box').hidden = !reqs.length;
  var sit = (cargo && window.CENTRALIZAR_SITUACOES && window.CENTRALIZAR_SITUACOES[cargo.setor]) || window.CENTRALIZAR_SITUACAO_PADRAO || 'Conte uma situação difícil no trabalho e como resolveu.';
  doc.getElementById('t-sit-l').textContent = sit;

  var form = doc.getElementById('triagem'), erro = doc.getElementById('t-erro');
  function txt(d, k, n) { return String(d.get(k) || '').trim().replace(/\s+/g, ' ').slice(0, n); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), turnos = d.getAll('turnos'), faltando = [];
    var nome = txt(d, 'nome', 80), fone = String(d.get('fone') || '').replace(/[^\d()+ -]/g, '').trim().slice(0, 20);
    if (nome.split(' ').length < 2) faltando.push('nome completo');
    if (fone.replace(/\D/g, '').length < 10) faltando.push('WhatsApp com DDD');
    if (!txt(d, 'bairro', 60)) faltando.push('bairro e cidade');
    if (!d.get('regime')) faltando.push('tipo de contratação');
    if (!turnos.length) faltando.push('pelo menos um turno');
    ['fds', 'inicio', 'km', 'transporte', 'pretensao', 'exp', 'jaTrabalhou', 'escolaridade'].forEach(function (k) { if (d.get(k) === null || d.get(k) === '') faltando.push({ fds: 'feriados e domingos', inicio: 'quando pode começar', km: 'distância', transporte: 'como chegaria', pretensao: 'pretensão salarial', exp: 'experiência', jaTrabalhou: 'se já trabalhou aqui', escolaridade: 'escolaridade' }[k]); });
    reqs.forEach(function (r) { if (!d.get('req_' + r.k)) faltando.push('requisito: ' + r.curto); });
    if (!txt(d, 'sit1', 400)) faltando.push('a situação do dia a dia');
    if (d.get('verdade') !== 'sim') faltando.push('a declaração de veracidade');
    if (cliente && d.get('compartilhar') !== 'sim') faltando.push('a autorização para enviar seus dados à empresa contratante');
    if (faltando.length) { erro.hidden = false; erro.textContent = 'Falta preencher: ' + faltando.join(', ') + '.'; erro.focus(); return; }
    erro.hidden = true;
    var rq = {}; reqs.forEach(function (r) { rq[r.k] = d.get('req_' + r.k) === 'sim' ? 'sim' : 'nao'; });
    var cand = ({
      n: nome, fone: fone, email: txt(d, 'email', 80), bairro: txt(d, 'bairro', 60),
      regime: String(d.get('regime')), turnos: turnos.filter(function (t) { return ['manha', 'tarde', 'noite', 'fds'].indexOf(t) > -1; }),
      fds: String(d.get('fds')), inicio: String(d.get('inicio')), km: +d.get('km'), transporte: String(d.get('transporte')), pretensao: String(d.get('pretensao')),
      exp: +d.get('exp'), ultima: txt(d, 'ultima', 120), jaTrabalhou: String(d.get('jaTrabalhou')), escolaridade: String(d.get('escolaridade')),
      reqs: rq, sit1: txt(d, 'sit1', 400), sit2: txt(d, 'sit2', 300), contato: d.get('contato') === 'sim', compartilhar: cliente ? d.get('compartilhar') === 'sim' : undefined, novo: true, em: new Date().toISOString()
    });
    var fim = function () {
      form.hidden = true;
    var ok = doc.getElementById('t-ok'); ok.hidden = false;
    doc.getElementById('t-ok-tit').textContent = 'Pronto, ' + nome.split(' ')[0] + '! Recebemos suas respostas.';
    ok.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (NUVEM) { var bt = form.querySelector('button[type=submit]'); bt.disabled = true; Nuvem.enviarCandidatura(prm.e, vaga.id, cand).then(fim, function (er) { bt.disabled = false; erro.hidden = false; erro.textContent = (er && er.message) || 'Não foi possível enviar. Tente de novo.'; erro.focus(); }); }
    else { vaga.cands.push(cand); save(S); fim(); }
  });
  }
})();
