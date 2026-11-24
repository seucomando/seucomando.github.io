/* Seu Comando — painel (protótipo navegável). Sem servidor: os dados de exemplo ficam só neste navegador. */
(function () {
  'use strict';
  var KEYBASE = 'centralizar-prototipo-v8', KEYTIPO = 'centralizar-tipo-atual';
  var KEYINT = 'centralizar-integracao-v1'; // envios entre recrutadora e empresas (compartilhado entre os exemplos)
  function tipoGuardado() { try { return localStorage.getItem(KEYTIPO) || 'padaria'; } catch (e) { return 'padaria'; } }
  var KEY = KEYBASE + ':' + tipoGuardado();
  var SEED = window.BROTA_SEED, TPL = window.BROTA_CONTRATOS;
  var doc = document, view = doc.getElementById('view');
  var ME = 'e1'; // a funcionária usada na visão "Funcionário"
  var EXEMPLO = /[?&]exemplo=1(&|$)/.test(location.search); // ?exemplo=1: protótipo com dados fictícios, mesmo com o banco ligado
  var S = load();

  /* ---------- utilidades ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sem armazenamento: usa o exemplo */ } return novoExemplo(KEY.split(':')[1] || 'padaria'); }
  function trocarTipo(tp) { try { localStorage.setItem(KEYTIPO, tp); } catch (e) { /* ignora */ } KEY = KEYBASE + ':' + tp; S = load(); }
  function novoExemplo(tipo) {
    var s = window.CENTRALIZAR_SEED ? window.CENTRALIZAR_SEED(tipo) : clone(SEED); s.role = 'empresa'; s.ui = {}; s.nsr = 4812;
    var g = s.pessoas[8] ? s.pessoas[8].id : null;
    s.acessos = {}; if (g) s.acessos[g] = { papel: 'gerente', perms: ['banco', 'ponto', 'checklists', 'estoque', 'boas'] };
    s.banco = s.pessoas.length > 4 ? [
      { id: 'b1', pessoa: s.pessoas[0].id, min: 90, motivo: 'Ficou 1h30 a mais no inventário', por: 'empresa', porNome: 'Empresário', em: '2026-10-28 18:40' },
      { id: 'b2', pessoa: s.pessoas[3].id, min: 120, motivo: 'Cobriu a folga de um colega', por: g || 'empresa', porNome: g ? s.pessoas[8].nome : 'Empresário', em: '2026-11-01 15:10' },
      { id: 'b3', pessoa: s.pessoas[0].id, min: -60, motivo: 'Saída antecipada para consulta, combinada com a gerência', por: g || 'empresa', porNome: g ? s.pessoas[8].nome : 'Empresário', em: '2026-11-03 16:02' }] : [];
    s.auditoria = [{ em: '2026-11-01 15:10', por: g ? s.pessoas[8].nome : 'Empresário', acao: 'Banco de horas', detalhe: (s.pessoas[3] || {}).nome + ' +2h00: Cobriu a folga de um colega' }];
    return s;
  }
  function demoAgora() { return S.real ? agoraEm(fusoEmp()) : (S.agoraDemo || '10:40'); } // horário fixo da situação do ponto no exemplo
  function save() { if (typeof NUVEM !== 'undefined' && NUVEM) { agendarSync(); return; } try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function brl(v) { return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dmy(iso) { if (!iso) return ''; var p = iso.split(' '), d = p[0].split('-'); return d[2] + '/' + d[1] + (p[1] ? ' ' + p[1] : ''); }
  function dmyy(iso) { var d = iso.split('-'); return d[2] + '/' + d[1] + '/' + d[0]; }
  function agora() { var n = new Date(); return n.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + n.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function min(h) { if (!h) return null; var p = h.split(':'); return +p[0] * 60 + +p[1]; }
  function P(id) { return S.pessoas.filter(function (p) { return p.id === id; })[0]; }
  function nomeDe(id) { var p = P(id); return p ? p.nome : 'Sem responsável'; }
  function first(n) { return n.split(' ')[0]; }
  function pill(cls, t) { return '<span class="pill ' + cls + '">' + esc(t) + '</span>'; }
  function can(r, p) { var ok = r.split(' ').indexOf(S.role) > -1; if (ok && S.role === 'gerente' && p) ok = pode(p); return ok; }
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function toast(t) { var old = $('.toast'); if (old) old.remove(); var d = doc.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; doc.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
  var INSS = [[1518, 0.075], [2793.88, 0.09], [4190.83, 0.12], [8157.41, 0.14]]; // faixas de exemplo; no produto, o contador lança
  function inss(b) { var prev = 0, t = 0; INSS.forEach(function (x) { if (b > prev) t += (Math.min(b, x[0]) - prev) * x[1]; prev = x[0]; }); return Math.round(t * 100) / 100; }

  /* empresa vinda da landing (?empresa=...) */
  (function () {
    try {
      var q = new URLSearchParams(location.search), n = (q.get('empresa') || '').trim().slice(0, 60);
      var tp = q.get('tipo') || '', TP = window.CENTRALIZAR_TIPOS || {};
      if (!TP[tp]) tp = (window.CENTRALIZAR_TIPO_DO_NOME && window.CENTRALIZAR_TIPO_DO_NOME(n)) || '';
      if (tp && TP[tp] && tp !== S.tipo) trocarTipo(tp);
      if (n) S.empresa.nome = n;
      semearInteg();
      if (n || tp) { if (n) S.empresa.razao = n + (/ltda|me$|eireli|s\.?a\.?$/i.test(n) ? '' : ' Ltda'); save(); history.replaceState(null, '', location.pathname + (EXEMPLO ? '?exemplo=1' : '') + location.hash); }
    } catch (e) { /* ignora */ }
  })();

  /* ---------- regras de negócio ---------- */
  function faltasAbertas() { return S.faltas.filter(function (f) { if (f.abonada) return false; if (!f.atestado) return true; var a = S.atestados.filter(function (x) { return x.id === f.atestado; })[0]; return !a || a.original !== 'entregue'; }); }
  function originaisPendentes() { return S.atestados.filter(function (a) { return a.original !== 'entregue'; }); }
  function valesDe(pid, comp) { return S.vales.filter(function (v) { return v.pessoa === pid && (!comp || v.comp === comp); }); }
  function holerite(pid) {
    var p = P(pid), sal = p.salario, he = S.horasExtras[pid] || 0;
    var heVal = Math.round(he * (sal / 220) * 1.5 * 100) / 100;
    var faltas = faltasAbertas().filter(function (f) { return f.pessoa === pid; }).length;
    var faltaVal = Math.round(faltas * (sal / 30) * 2 * 100) / 100; // dia + DSR da semana
    var vales = valesDe(pid, S.holerites.competencia).filter(function (v) { return v.assinado; });
    var valeVal = vales.reduce(function (s, v) { return s + v.valor; }, 0);
    var base = sal + heVal - faltaVal, ins = inss(base);
    var linhas = [['Salário base', '30 dias', sal, 0]];
    if (he) linhas.push(['Horas extras 50%', he + ' h', heVal, 0]);
    if (faltas) linhas.push(['Faltas não abonadas + DSR', faltas + ' dia(s)', faltaVal, 1]);
    linhas.push(['INSS', '', ins, 1]);
    vales.forEach(function (v) { linhas.push([v.tipo === 'adiantamento' ? 'Adiantamento ' + dmy(v.data) : 'Vale ' + dmy(v.data) + ' (assinado)', '', v.valor, 1]); });
    var prov = sal + heVal, desc = faltaVal + ins + valeVal;
    return { p: p, linhas: linhas, prov: prov, desc: desc, liq: prov - desc, fgts: Math.round(base * 0.08 * 100) / 100 };
  }
  function statusHolerite(pid) { return S.holerites.aprovados.indexOf(pid) > -1 ? 'liberado' : 'aguardando'; }
  function pctDescontos(pid, comp, extra) {
    var p = P(pid), v = valesDe(pid, comp).filter(function (x) { return x.assinado || x.id === '__novo'; }).reduce(function (s, x) { return s + x.valor; }, 0) + (extra || 0);
    var f = comp === S.holerites.competencia ? faltasAbertas().filter(function (x) { return x.pessoa === pid; }).length * (p.salario / 30) * 2 : 0;
    return Math.round(((v + f) / p.salario) * 100);
  }
  function situacaoPonto(p) {
    var m = mk(p.id), j = jornadaDe(p), tz = fusoDe(p), agoraP = S.real ? agoraEm(tz) : demoAgora();
    var at = S.atestados.filter(function (a) { return a.pessoa === p.id && diffDays(a.inicio, S.hoje) >= 0 && diffDays(a.inicio, S.hoje) < a.dias; })[0];
    if (at) return ['mute', 'Atestado até ' + dmy(addDays(at.inicio, at.dias - 1))];
    var esc0 = S.real ? j.e : p.escala;
    if (S.real && !m[0] && !j.x1236 && (j.dias || []).indexOf(diaSemana(hojeEm(tz))) < 0) return ['mute', 'Folga hoje'];
    if (!m[0]) return (S.real ? min(esc0) + 10 >= min(agoraP) : min(esc0) > min(agoraP)) ? ['mute', 'Entra às ' + esc0] : ['bad', S.real ? 'Sem marcação' : 'Ausente'];
    if (m[SAIDA]) return ['mute', 'Jornada encerrada'];
    var ult = -1; m.forEach(function (h, i) { if (h && i < SAIDA) ult = i; });
    if (ult % 2 === 1) return ['mute', 'No intervalo desde ' + m[ult]];
    var atraso = min(m[0]) - min(esc0);
    if (atraso > 10 && atraso < 720) return ['warn', 'Atraso de ' + atraso + ' min'];
    return ['ok', 'Presente'];
  }

  /* ---------- moldura ---------- */
  var ROUTES = {
    inicio: { t: 'Início', r: 'empresa contador funcionario gerente', f: vInicio },
    vagas: { t: 'Vagas e seleção', r: 'empresa', f: vVagas },
    admissoes: { t: 'Admissões', r: 'empresa contador', f: vAdmissoes },
    contratos: { t: 'Contratos', r: 'empresa contador', f: vContratos },
    ponto: { t: 'Ponto', r: 'empresa contador funcionario gerente', f: vPonto, aba: 'pontoAba' },
    atestados: { t: 'Atestados', r: 'empresa contador funcionario gerente', f: function () { return vOcorrencias('atestados'); } },
    advertencias: { t: 'Advertências', r: 'empresa contador funcionario gerente', f: function () { return vOcorrencias('advertencias'); } },
    checklists: { t: 'Checklists', r: 'empresa funcionario gerente', f: vChecklists },
    holerites: { t: 'Holerites', r: 'empresa contador funcionario gerente', f: vHolerites },
    vales: { t: 'Vales', r: 'empresa contador funcionario gerente', f: vVales },
    banco: { t: 'Banco de horas', r: 'empresa funcionario gerente', f: vBanco },
    estoque: { t: 'Estoque e etiquetas', r: 'empresa gerente', p: 'estoque', f: vEstoque },
    equipe: { t: 'Cadastro da equipe', r: 'empresa', f: vEquipe },
    empresa: { t: 'Turnos e regras do ponto', r: 'empresa', f: vEmpresa, aba: 'empAba' },
    acessos: { t: 'Acessos e permissões', r: 'empresa', f: vAcessos },
    registro: { t: 'Registro de alterações', r: 'empresa', f: vRegistro },
    documentos: { t: 'Documentos', r: 'empresa contador funcionario gerente', f: vDocumentos },
    compras: { t: 'Lista de compras', r: 'empresa funcionario gerente', f: vCompras },
    selecao: { t: 'Processos seletivos', r: 'empresa', f: vSelecao },
    clientes: { t: 'Empresas clientes', r: 'empresa', f: vClientes },
    boas: { t: 'Boas práticas de alimentos', r: 'empresa funcionario gerente', f: vBoas },
    cursos: { t: 'Mini cursos', r: 'empresa funcionario gerente', f: vCursos },
    busca: { t: 'Busca', r: 'empresa contador funcionario gerente', f: vBusca }
  };
  // Áreas do app (como telas de jogo): Início → área → tela → submenu da tela.
  var CATMETA = {
    contratar: ['verde', 'Contratar', 'Vagas, seleção, admissão e contrato'],
    equipe: ['grafite', 'Equipe', 'Cadastro, documentos e advertências'],
    dia: ['azul', 'Dia a dia', 'Ponto, checklists e atestados'],
    folha: ['ambar', 'Folha', 'Holerites, vales e banco de horas'],
    compras: ['roxo', 'Compras e estoque', 'Estoque, etiquetas e lista de compras'],
    alimentos: ['teal', 'Alimentos', 'Boas práticas e mini cursos'],
    config: ['grafite', 'Empresa', 'Configurações da empresa']
  };
  var MODULOS = ['contratar', 'equipe', 'dia', 'folha', 'compras', 'alimentos'];
  MODULOS.forEach(function (c) { ROUTES['c/' + c] = { t: CATMETA[c][1], r: 'empresa contador funcionario gerente', cat: c, f: function () { return vCategoria(c); } }; });
  function route() { var h = location.hash.replace(/^#\/?/, '').split('?')[0]; if (h === 'ocorrencias') h = 'atestados'; return ROUTES[h] ? h : 'inicio'; }
  function render() {
    ajustaME(); if (normalizaChecklists() && S.role === 'empresa') save();
    var r = route(), R = ROUTES[r], qa = /[?&]aba=([a-z]+)/.exec(location.hash);
    if (qa && R.aba) { S.ui[R.aba] = qa[1]; try { history.replaceState(null, '', '#/' + r); } catch (e) { /* sem histórico */ } }
    if (!can(R.r, R.p) || modOff(R.cat || catDe(r))) { location.hash = '#/inicio'; return; }
    $$('#nav a').forEach(function (a) {
      a.hidden = !linkOk(a);
      if (a.getAttribute('href') === '#/' + r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('#nav [data-group]').forEach(function (g) { g.hidden = !$$('a', g).some(function (a) { return !a.hidden; }); var l = $('.nav-label', g); if (l) l.textContent = catNome(g.dataset.cat); });
    if (R.cat) { var vis = itensCat(R.cat); if (!vis.length) { location.hash = '#/inicio'; return; } if (vis.length === 1) { location.replace(vis[0].getAttribute('href')); return; } }
    var vazio = telaVazia(r), corpo;
    try { corpo = vazio || R.f(); } catch (err) { if (window.console) console.error(err); corpo = titleRow(R.t, '') + vazioHTML('Nada para mostrar ainda', 'Cadastre a equipe e os dados da empresa para esta tela ganhar conteúdo.', S.role === 'empresa' ? '<a class="btn btn-primary" href="#/equipe">Cadastrar a equipe</a>' : ''); }
    view.innerHTML = '<div class="view' + (r === 'inicio' ? ' view-hub' : '') + '">' + trilhaHTML(r) + corpo + '</div>';
    doc.title = (R.cat ? catNome(R.cat) : R.t) + ' · Seu Comando';
    var counts = contagens();
    $$('[data-count]').forEach(function (c) { var n = counts[c.dataset.count]; c.textContent = n || ''; c.hidden = !n; });
    $('#co-name').textContent = S.empresa.nome; var cs = $('#co-sub'); if (cs) cs.textContent = [S.empresa.cidade, S.pessoas.length + (S.pessoas.length === 1 ? ' pessoa' : ' pessoas')].filter(Boolean).join(' · '); $('#co-mark').textContent = S.empresa.nome.charAt(0).toUpperCase();
    $('#role').value = NUVEM ? (Nuvem.empresa || '') : S.role;
    mapaAbre(false); coMenuAbre(false);
    var sn = $('#side-nota'); if (sn) sn.textContent = S.real ? 'Os dados desta empresa ficam só neste navegador.' : 'Exemplo com dados fictícios. Nada sai do seu navegador.';
    if (R.after) R.after();
    if (r === 'ponto') tickClock();
    if (!GUIA_JA && S.real && (!NUVEM || SNAP)) { GUIA_JA = true; setTimeout(guiaAoEntrar, 500); }
    var gb = $('#guia-btn'); if (gb) gb.hidden = !S.real && !EXEMPLO;
    var cb = $('#co-btn'); if (cb) { cb.disabled = !coMenuItens().length; cb.title = cb.disabled ? '' : 'Dados, regras e configurações da empresa'; }
  }
  function modOff(c) { var m = (S.empresa || {}).modulos || {}; return !!c && c !== 'config' && c !== 'equipe' && m[c] === false; }
  function catDe(r) { var a = $('#nav a[href="#/' + r + '"]'), g = a && a.closest('[data-cat]'); return g ? g.dataset.cat : ''; }
  function itensCat(c) { return $$('#nav [data-cat="' + c + '"] a').filter(function (a) { return !a.hidden; }); }
  function catNome(c) { return c === 'equipe' && S.role === 'funcionario' ? 'Meu cadastro' : (CATMETA[c] || [])[1] || ''; }
  function catDesc(c) { return c === 'equipe' && S.role === 'funcionario' ? 'Seus documentos e advertências' : (CATMETA[c] || [])[2] || ''; }
  function linkNome(a) { var t = a.querySelector('span:not(.count)'); return (t ? t.textContent : a.textContent).trim(); }
  var SETA_V = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  function trilhaHTML(r) {
    if (r === 'inicio') return '';
    var R = ROUTES[r], c = R.cat ? '' : catDe(r), cs = [['#/inicio', 'Início']];
    if (c === 'config') cs.push(['', 'Empresa']);
    else if (c && itensCat(c).length > 1) cs.push(['#/c/' + c, catNome(c)]);
    var volta = cs.filter(function (x) { return x[0]; }).pop(), a = $('#nav a[href="#/' + r + '"]'), atual = R.cat ? catNome(R.cat) : a ? linkNome(a) : R.t;
    return '<nav class="trilha" aria-label="Onde você está"><a class="trilha-volta" href="' + volta[0] + '">' + SETA_V + '<span>' + esc(volta[1]) + '</span></a><ol>' + cs.map(function (x) { return '<li>' + (x[0] ? '<a href="' + x[0] + '">' + esc(x[1]) + '</a>' : esc(x[1])) + '</li>'; }).join('') + '<li aria-current="page">' + esc(atual) + '</li></ol></nav>';
  }
  function mapaAbre(v) { var s = $('#side'), b = $('#menu-btn'); if (!s || !b) return; s.classList.toggle('open', !!v); b.setAttribute('aria-expanded', String(!!v)); if (v) { var a = $('#nav a[aria-current="page"]', s) || $('#nav a:not([hidden])', s); if (a) a.focus(); } }
  function coMenuItens() {
    var it = [];
    if (S.role === 'empresa') it.push(['empresa-editar', 'Dados da empresa', 'Nome, CNPJ e endereço'], ['#/empresa', 'Turnos e regras do ponto', 'Horários, fuso, local e rosto'], ['#/acessos', 'Acessos e permissões', 'Quem entra e o que pode fazer'], ['#/registro', 'Registro de alterações', 'Quem mudou o quê e quando'], ['modulos', 'Módulos do app', 'Ligar e desligar áreas']);
    if (NUVEM) it.push(['sair', 'Sair', 'Encerrar a sessão neste aparelho']);
    return it;
  }
  function coMenuAbre(v) {
    var m = $('#co-menu'), b = $('#co-btn'); if (!m || !b) return;
    if (v) m.innerHTML = '<p class="co-menu-t">' + esc(S.empresa.nome) + '</p>' + coMenuItens().map(function (x) { var lk = x[0].charAt(0) === '#'; return (lk ? '<a class="co-op" href="' + x[0] + '">' : '<button type="button" class="co-op" data-act="' + x[0] + '">') + '<strong>' + esc(x[1]) + '</strong><span>' + esc(x[2]) + '</span>' + (lk ? '</a>' : '</button>'); }).join('');
    m.hidden = !v; b.setAttribute('aria-expanded', String(!!v)); if (v) { var f = $('.co-op', m); if (f) f.focus(); }
  }
  function contagens() { return { adm: S.admissoes.filter(function (a) { return S.role === 'contador' ? passoAdm(a) === 3 : !a.aprovada; }).length, orig: originaisPendentes().length, hol: ehFunc() ? 0 : S.real ? (S.role === 'empresa' ? holAguardando().length : 0) : S.pessoas.length - S.holerites.aprovados.length, doc: S.real && !ehFunc() ? (S.docsArq || []).filter(function (d) { return d.status === 'enviado'; }).length : 0, cmp: S.role === 'empresa' ? S.compras.itens.length : 0 }; }
  function vazioHTML(t, s, acao) { return '<div class="card card-pad stack vazio"><h2 class="sec">' + esc(t) + '</h2><p>' + esc(s) + '</p>' + (acao ? '<div>' + acao + '</div>' : '') + '</div>'; }
  function telaVazia(r) {
    var R = ROUTES[r], emp = S.role === 'empresa';
    if (ehFunc() && !P(ME)) return titleRow(R.t, '') + vazioHTML('Seu cadastro ainda não está ligado ao app', 'Peça para a empresa conferir o seu acesso em Acessos e permissões.', '');
    if (!S.pessoas.length && ['inicio', 'ponto', 'holerites', 'vales', 'atestados', 'banco'].indexOf(r) > -1 && !(r === 'inicio' && emp && S.real)) return titleRow(R.t, S.empresa.nome) + vazioHTML('Comece cadastrando a equipe', 'Com as pessoas cadastradas, o ponto, os holerites, os vales e os atestados passam a funcionar. Depois, gere o código de acesso de cada uma para o app.', emp ? '<a class="btn btn-primary" href="#/equipe">Cadastrar a equipe</a>' : '');
    if (r === 'vagas' && !S.vagas.length) return titleRow(R.t, '') + vazioHTML('Nenhuma vaga aberta', 'Abra uma vaga para gerar o link da pré-entrevista e receber candidatos.', '<button type="button" class="btn btn-primary" data-act="vaga-nova">Abrir vaga</button>');
    if (r === 'selecao' && !S.vagas.length) return titleRow(R.t, '') + vazioHTML('Nenhum processo seletivo', 'Cadastre um cliente e abra o primeiro processo.', '<button type="button" class="btn btn-primary" data-act="rs-novo">Novo processo</button>');
    if (r === 'admissoes' && !S.admissoes.length) return titleRow(R.t, '') + vazioHTML('Nenhuma admissão em andamento', 'Quando um candidato for aprovado na entrevista, a admissão aparece aqui.', '');
    return '';
  }
  function titleRow(t, sub, actions) { return '<div class="title-row"><div><h1>' + esc(t) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions">' + (actions || '') + '</div></div>'; }

  /* ---------- Início ---------- */
  function presentesAgora() { return S.pessoas.filter(function (p) { var s = situacaoPonto(p)[1]; return s === 'Presente' || s.indexOf('Atraso') === 0; }).length; }
  // Pendências: [situação, o que, detalhe, link, botão]
  function pendencias() {
    var pend = [];
    originaisPendentes().forEach(function (a) { var venc = diffDays(S.hoje, a.prazo) < 0; pend.push([venc ? pill('bad', 'Vencido') : pill('warn', 'Até ' + dmy(a.prazo)), 'Atestado original de ' + P(a.pessoa).nome, 'Foto recebida em ' + dmy(a.foto) + '; falta o papel', '#/atestados', 'Registrar entrega']); });
    S.vales.filter(function (v) { return !v.assinado; }).forEach(function (v) { pend.push([pill('warn', 'Sem assinatura'), 'Vale de R$ ' + brl(v.valor) + ' · ' + P(v.pessoa).nome, 'Não pode ser descontado sem autorização escrita', '#/vales', 'Ver vale']); });
    S.admissoes.forEach(function (a) { var f = a.docs.filter(function (d) { return d.st !== 'ok'; }).length, n = passoAdm(a); if (n === 5) return; pend.push(n === 2 ? [pill('warn', f + ' documento(s)'), 'Admissão de ' + a.nome, 'Aguardando documentos · início em ' + dmy(a.inicio), '#/admissoes', 'Abrir'] : n === 3 ? [pill('mute', 'Com o contador'), 'Admissão de ' + a.nome, 'Documentos completos, em conferência', '#/admissoes', 'Abrir'] : [pill('warn', 'Falta seu ok'), 'Admissão de ' + a.nome, 'Conferida pelo contador', '#/admissoes', 'Dar o ok']); });
    if (S.role !== 'contador') ckVisiveis().forEach(function (c) { var s = ckSituacao(c); if (s[0] === 'bad') pend.push([pill('bad', 'Atrasado'), c.nome + ' · ' + c.setor, s[1] + ' · limite ' + c.limite, '#/checklists', 'Ver checklist']); });
    var falta = sugestaoCompra().length;
    if (falta) pend.push([pill('bad', falta + ' item(ns)'), 'Abaixo do estoque mínimo', 'Ainda fora da lista de compras', '#/estoque', 'Ver estoque']);
    var validade = S.produtos.filter(function (p) { return diffDays(S.hoje, p.validade) <= 3; }).length;
    if (validade) pend.push([pill('warn', validade + ' produto(s)'), 'Validade nos próximos 3 dias', 'Confira e tire da venda o que vencer', '#/estoque', 'Ver estoque']);
    if (S.real) {
      S.pessoas.forEach(function (p) { var rr = resumoDocs(p.id); if (rr.conferir) pend.push([pill('warn', rr.conferir + ' documento(s)'), 'Documentos de ' + p.nome, 'Enviados pelo app, aguardando conferência', '#/documentos', 'Conferir']); });
      var ajP = (S.ajustes || []).filter(function (a) { return a.status === 'pendente'; }).length; if (ajP && S.role === 'empresa') pend.push([pill('warn', ajP + ' pedido(s)'), 'Pedidos de ajuste de ponto', 'Esquecimento ou erro de marcação', '#/ponto', 'Analisar']);
      var hAg = holAguardando().length; if (hAg && S.role === 'empresa') pend.push([pill('warn', hAg + ' holerite(s)'), 'Holerites para aprovar', 'Enviados pelo contador', '#/holerites', 'Aprovar']);
    }
    return pend.filter(function (x) { return !modOff(catDe(x[3].replace('#/', ''))); });
  }
  function pendCard(t, pend, max) {
    var mostra = pend.slice(0, max || pend.length), resto = pend.length - mostra.length;
    return '<section class="card pend-card" aria-labelledby="pend-t"><div class="card-head"><h2 id="pend-t">' + esc(t) + '</h2>' + pill('mute', pend.length + (pend.length === 1 ? ' item' : ' itens')) + '</div><ul class="list pend-lista">' + mostra.map(function (x) { return '<li><span class="pend-txt">' + esc(x[1]) + '<span class="sub">' + esc(x[2]) + '</span></span>' + x[0] + '<a class="btn btn-sm" href="' + x[3] + '">' + esc(x[4]) + '</a></li>'; }).join('') + '</ul>' + (resto > 0 ? '<p class="pend-mais ui-sub">E mais ' + resto + ' dentro das áreas, marcadas com o número vermelho.</p>' : '') + '</section>';
  }
  function catStatus(c) {
    var func = ehFunc(), n;
    if (c === 'dia') { if (func && P(ME)) { var pi = proxInfo(ME); return pi.prox > -1 ? 'Agora: ' + tipoNome(ME, pi.prox).toLowerCase() : 'Ponto de hoje completo'; } if (S.pessoas.length) return presentesAgora() + ' de ' + S.pessoas.length + ' trabalhando agora'; }
    if (c === 'folha') { n = func ? valesDe(ME).filter(function (v) { return !v.assinado; }).length : S.real ? holAguardando().length : S.pessoas.length - S.holerites.aprovados.length; if (n > 0) return func ? n + (n === 1 ? ' vale para assinar' : ' vales para assinar') : n + (n === 1 ? ' holerite para aprovar' : ' holerites para aprovar'); }
    if (c === 'compras' && S.compras.itens.length) return S.compras.itens.length + (S.compras.itens.length === 1 ? ' item na lista de compras' : ' itens na lista de compras');
    if (c === 'equipe' && !func && S.pessoas.length) return S.pessoas.length + (S.pessoas.length === 1 ? ' pessoa cadastrada' : ' pessoas cadastradas');
    if (c === 'contratar' && !func) { var v = (S.vagas || []).length, ad = S.admissoes.length; if (v || ad) return [v ? v + (v === 1 ? ' vaga' : ' vagas') : '', ad ? ad + (ad === 1 ? ' admissão em andamento' : ' admissões em andamento') : ''].filter(Boolean).join(' · '); }
    return catDesc(c);
  }
  function hubCats() {
    var cs = contagens(), pend = ehFunc() ? [] : pendencias(), tiles = '';
    MODULOS.forEach(function (c) {
      var vis = itensCat(c); if (!vis.length) return;
      var n = vis.reduce(function (t, a) { var k = a.querySelector('[data-count]'); return t + (k ? +cs[k.dataset.count] || 0 : 0); }, 0);
      n = Math.max(n, pend.filter(function (x) { return catDe(x[3].replace('#/', '')) === c; }).length);
      var ic = vis[0].querySelector('svg'), href = vis.length === 1 ? vis[0].getAttribute('href') : '#/c/' + c;
      tiles += '<a class="setor cat-tile setor-' + CATMETA[c][0] + '" href="' + href + '"><span class="setor-ic">' + (ic ? ic.outerHTML : '') + '</span><span class="setor-nome">' + esc(catNome(c)) + '</span><span class="setor-desc">' + esc(catStatus(c)) + '</span><span class="cat-itens">' + esc(vis.map(linkNome).join(' · ')) + '</span>' + (n ? '<span class="setor-badge">' + n + '<span class="sr-only"> pendente(s)</span></span>' : '') + '</a>';
    });
    return tiles ? '<section class="setores-box" aria-labelledby="set-t"><h2 class="sec" id="set-t">Escolha a área</h2><div class="setores cats">' + tiles + '</div></section>' : '';
  }
  function hubPe() {
    if (NUVEM) return '';
    return '<p class="hub-pe ui-sub">' + (S.real ? 'Os dados desta empresa ficam só neste navegador.' : 'Exemplo com dados fictícios: nada sai do seu navegador.') + ' <button type="button" class="link-btn" data-act="reset-exemplo">' + (S.real ? 'Voltar ao exemplo' : 'Restaurar exemplo') + '</button>' + (S.real ? '' : ' · <button type="button" class="link-btn" data-act="em-branco">Começar em branco</button>') + ' · <a href="privacidade.html">Privacidade</a></p>';
  }
  function vInicio() {
    if (ehFunc()) {
      var me = P(ME);
      return titleRow('Olá, ' + first(me.nome), esc(me.funcao) + ' · ' + esc(S.empresa.nome)) + '<div class="stack">' + proximoFunc() + hubCats() + '</div>' + hubPe();
    }
    var pend = pendencias();
    return titleRow(S.empresa.nome, (S.real ? hoje1() : 'Quinta-feira, 5 de novembro de 2026') + (S.role === 'contador' ? ' · você está vendo como contador' : '')) +
      (S.real ? passosHTML(S.role === 'contador' ? 'O que fazer agora' : 'Primeiros passos', passosDe(), S.role === 'empresa') : '') +
      hubCats() + (pend.length ? pendCard('Pede atenção agora', pend, 5) : '') + hubPe();
  }
  function vCategoria(c) {
    var vis = itensCat(c), cor = CATMETA[c][0], pend = ehFunc() ? [] : pendencias().filter(function (x) { return catDe(x[3].replace('#/', '')) === c; });
    return titleRow(catNome(c), catDesc(c)) + '<div class="setores">' + vis.map(function (a) { return tileItem(a, cor); }).join('') + '</div>' + (pend.length ? pendCard('Pede atenção nesta área', pend) : '');
  }

  /* ---------- Cartões das telas e passo a passo ---------- */
  function linkOk(a) { var g = a.closest('[data-cat]'); return a.dataset.roles.split(' ').indexOf(S.role) > -1 && !(S.role === 'gerente' && a.dataset.perm && !pode(a.dataset.perm)) && !(a.hasAttribute('data-food') && !S.bp) && !(a.hasAttribute('data-rs') && !S.agencia) && !(a.hasAttribute('data-nors') && S.agencia) && !(g && modOff(g.dataset.cat)); }
  var SETOR_INFO = { ponto: 'Marcar e conferir horários', atestados: 'Foto na hora, original em 48 horas', advertencias: 'Ciência pelo app ou testemunhas', checklists: 'Rotinas do dia por setor', holerites: 'Contracheques do mês', vales: 'Vales e adiantamentos', banco: 'Horas a compensar', documentos: 'RG, carteira e comprovantes', contratos: 'Gerar, assinar e guardar', admissoes: 'Novas contratações', vagas: 'Pré-entrevista e candidatos', selecao: 'Processos dos clientes', clientes: 'Empresas atendidas', equipe: 'Pessoas, funções e horários', estoque: 'Produtos e etiquetas', compras: 'O que falta comprar', boas: 'Temperaturas e registros', cursos: 'Treinamentos rápidos' };
  function tileItem(a, cor) {
    var r = a.getAttribute('href').replace('#/', ''), c = a.querySelector('[data-count]'), n = c ? contagens()[c.dataset.count] : 0, ic = a.querySelector('svg'), desc = SETOR_INFO[r] || '';
    if (r === 'ponto' && ehFunc() && P(ME)) { var pi = proxInfo(ME); desc = pi.prox > -1 ? 'Agora: ' + tipoNome(ME, pi.prox).toLowerCase() : 'Jornada de hoje completa'; }
    else if (r === 'ponto' && S.pessoas.length) desc = presentesAgora() + ' de ' + S.pessoas.length + ' trabalhando agora';
    if (r === 'checklists') { var fe = 0, to = 0; ckVisiveis().forEach(function (k) { if (!ckRoda(k, ckDia())) return; var rs = ckResumo(k, ckDia()); fe += rs.feitas; to += rs.total; }); if (to) desc = fe + ' de ' + to + ' etapas hoje'; }
    if (r === 'banco' && ehFunc() && P(ME)) desc = 'Seu saldo: ' + fmtMin(saldoBanco(ME));
    return '<a class="setor setor-' + cor + '" href="#/' + r + '"><span class="setor-ic">' + (ic ? ic.outerHTML : '') + '</span><span class="setor-nome">' + esc(linkNome(a)) + '</span><span class="setor-desc">' + esc(desc) + '</span>' + (n ? '<span class="setor-badge">' + n + '<span class="sr-only"> pendente(s)</span></span>' : '') + '</a>';
  }
  // Submenu de uma tela: [valor, rótulo, número opcional]
  function abas(k, itens, atual) { return '<div class="tabs submenu" role="tablist">' + itens.filter(Boolean).map(function (x) { return '<button type="button" role="tab" data-act="aba" data-k="' + k + '" data-v="' + x[0] + '" aria-selected="' + (x[0] === atual) + '">' + esc(x[1]) + (x[2] !== '' && x[2] != null ? '<span class="aba-n">' + esc(String(x[2])) + '</span>' : '') + '</button>'; }).join('') + '</div>'; }
  var AJUDA = {
    ponto: ['Como o ponto funciona', '<p>A hora de cada marcação vem do servidor, não do relógio do celular. Cada marcação guarda a foto do momento e, quando a empresa exige, a localização. Com o reconhecimento facial ligado, o app confere o rosto antes de registrar.</p><p><strong>Tolerância:</strong> variações de até 5 minutos por marcação, somando no máximo 10 minutos no dia, não contam como atraso nem como hora extra (CLT, art. 58, § 1º).</p><p><strong>Ponto oficial:</strong> o registro eletrônico por programa (REP-P) segue a Portaria MTP 671/2021. Arquivos oficiais para a fiscalização, como o AFD e o AEJ, exigem assinatura digital com certificado ICP-Brasil e o registro do programa no INPI.</p>'],
    jornada: ['Regras que o app confere na jornada', '<ul class="ajuda-lista"><li><strong>Intervalo:</strong> quem trabalha mais de 6 horas precisa de 1 a 2 horas de intervalo; de 4 a 6 horas, 15 minutos (CLT, art. 71).</li><li><strong>Descanso entre jornadas:</strong> pelo menos 11 horas seguidas (CLT, art. 66).</li><li><strong>Horas extras:</strong> no máximo 2 por dia (CLT, art. 59).</li><li><strong>12x36:</strong> 12 horas de trabalho e 36 de descanso, por acordo (CLT, art. 59-A).</li><li><strong>Trabalho noturno:</strong> das 22h às 5h, com adicional de pelo menos 20% e hora de 52 minutos e 30 segundos (CLT, art. 73).</li><li><strong>Semana:</strong> até 44 horas (Constituição, art. 7º, XIII).</li></ul>'],
    boas: ['O que a norma pede', '<p>As boas práticas para serviços de alimentação seguem a RDC Anvisa 216/2004. O app ajuda em três pontos:</p><ul class="ajuda-lista"><li><strong>Temperatura:</strong> geladeiras, freezers e estufas precisam de controle regular da temperatura, com registro (itens 4.8.15 a 4.8.17 e 4.10.3).</li><li><strong>Capacitação:</strong> quem manipula alimentos precisa de capacitação periódica em higiene pessoal, manipulação higiênica e doenças transmitidas por alimentos, com comprovante (item 4.6.7).</li><li><strong>Responsável:</strong> o responsável pelas atividades de manipulação precisa de curso próprio (item 4.12.2), que os mini cursos não substituem.</li></ul><p>A vigilância sanitária do município pode exigir mais coisas; confira com ela.</p>'],
    banco: ['Como funciona o banco de horas', '<p>Hora extra vira crédito para folgar depois, em vez de ser paga. Por acordo individual escrito, a compensação precisa acontecer em até 6 meses (CLT, art. 59, § 5º); por acordo ou convenção coletiva, em até 1 ano (art. 59, § 2º).</p><p>Nenhum lançamento é apagado. Para corrigir, use "Estornar", que cria um lançamento contrário e deixa os dois no histórico.</p>']
  };
  function ajudaBtn(k, rot) { return '<button type="button" class="ajuda-btn" data-act="ajuda" data-k="' + k + '" aria-label="' + esc(rot || 'Entenda esta tela') + '" title="' + esc(rot || 'Entenda esta tela') + '">?</button>'; }
  // Passos: [título, explicação, feito, link, botão, ação (opcional, abre a janela direto)]
  function passosDe() {
    var e = S.empresa, aud = function (a) { return (S.auditoria || []).some(function (x) { return x.acao === a; }); }, mem = function (ps) { return (MEMBROS || []).some(function (m) { return ps.indexOf(m.papel) > -1; }); };
    if (S.role === 'empresa') return [
      ['Dados da empresa', 'Toque no nome da empresa, no alto da tela: razão social, CNPJ e endereço entram nos contratos e comprovantes.', !!(e.cnpj && e.endereco), '#/inicio', 'Preencher', 'empresa-editar'],
      ['Local e regras do ponto', 'Onde a equipe marca, foto, fuso horário e reconhecimento facial.', cfgPonto().lat != null, '#/empresa?aba=regras', 'Configurar'],
      ['Turnos de trabalho', 'Entrada, saída e intervalos, conferidos com a CLT.', !!(S.turnos || []).length, '#/empresa', 'Criar turno', 'turno-editar'],
      ['Cadastrar a equipe', 'Nome, CPF, função, salário e turno de cada pessoa.', !!S.pessoas.length, '#/equipe', 'Cadastrar pessoa', 'pessoa-editar'],
      ['Liberar o app para a equipe', 'Gere o código de primeiro acesso de cada pessoa e mande pelo WhatsApp.', aud('Código de acesso gerado') || mem(['funcionario', 'gerente']), '#/acessos', 'Gerar códigos'],
      ['Checklists do dia', 'Abertura, preparo e fechamento, com horário e foto.', (S.checklists || []).some(function (c) { return c.criado || c.alterado; }), '#/checklists', 'Montar checklist'],
      ['Modelo de contrato', 'Cadastre uma vez e gere o contrato de cada pessoa já preenchido.', !!(S.modelosCt || []).length, '#/contratos', 'Criar modelo'],
      ['Convidar o contador', 'Ele envia os holerites e confere admissões e documentos.', aud('Contador convidado') || mem(['contador']), '#/acessos', 'Convidar', 'convite-contador']
    ];
    var comp = mesAnterior(), env = S.pessoas.filter(function (p) { return holDe(p.id, comp); }).length, docs = (S.docsArq || []).filter(function (d) { return d.status === 'enviado'; }).length, adm = contagens().adm;
    return [
      ['Enviar os holerites de ' + compTxt(comp), env + ' de ' + S.pessoas.length + ' enviados. A empresa aprova e a equipe recebe no app.', !!S.pessoas.length && env >= S.pessoas.length, '#/holerites', 'Enviar holerites'],
      ['Conferir documentos da equipe', docs ? docs + ' documento(s) aguardando conferência.' : 'Nada aguardando.', !docs, '#/documentos', 'Conferir'],
      ['Conferir admissões', adm ? adm + ' admissão(ões) com documentos completos.' : 'Nada aguardando.', !adm, '#/admissoes', 'Abrir']
    ];
  }
  function passosHTML(titulo, ps, escondivel) {
    var feitos = ps.filter(function (p) { return p[2]; }).length, prox = ps.filter(function (p) { return !p[2]; })[0];
    if (!prox) return '';
    if (escondivel && S.ui.semPassos) return '<p class="ui-sub"><button type="button" class="link-btn" data-act="passos-mostrar">Mostrar os primeiros passos (' + feitos + ' de ' + ps.length + ' prontos)</button></p>';
    return '<section class="card passos" aria-labelledby="pas-t"><div class="card-head"><h2 id="pas-t">' + esc(titulo) + '</h2><span class="passos-prog"><span class="num">' + feitos + ' de ' + ps.length + '</span><progress max="' + ps.length + '" value="' + feitos + '">' + feitos + '</progress></span></div><ol class="passos-lista">' + ps.map(function (p, i) {
      var atual = p === prox, cls = 'btn' + (atual ? ' btn-primary btn-lg' : ' btn-sm');
      var bt = p[5] ? '<button type="button" class="' + cls + '" data-act="' + p[5] + '">' + esc(p[4]) + '</button>' : '<a class="' + cls + '" href="' + p[3] + '">' + esc(p[4]) + '</a>';
      return '<li class="' + (p[2] ? 'feito' : atual ? 'atual' : '') + '"><span class="passo-n" aria-hidden="true">' + (p[2] ? '✓' : i + 1) + '</span><span class="passo-txt"><strong>' + esc(p[0]) + '</strong>' + (atual ? '<span class="sub">' + esc(p[1]) + '</span>' : p[2] ? '<span class="sub">Pronto</span>' : '') + '</span>' + (p[2] ? '' : bt) + '</li>';
    }).join('') + '</ol>' + (escondivel ? '<div class="passos-foot"><button type="button" class="link-btn" data-act="passos-esconder">Esconder por enquanto</button></div>' : '') + '</section>';
  }
  function passosFunc() {
    var cfg = cfgPonto(), temReg = (S.registros || []).some(function (r) { return r.pessoa_id === ME; }) || !!mk(ME)[0], rd = S.real ? resumoDocs(ME) : { falta: 0 }, cks = ckVisiveis(), dia = ckDia();
    return [
      ['Bater o ponto', 'Em Dia a dia, abra o Ponto e toque em "Registrar entrada". A câmera abre e a hora vem do servidor.' + (cfg.rosto ? ' Na primeira vez, o app cadastra o seu rosto.' : ''), temReg, '#/ponto', 'Ir para o ponto'],
      ['Enviar seus documentos', 'RG, carteira de trabalho, comprovante de residência e conta bancária, por foto ou PDF.', !rd.falta, '#/documentos', 'Enviar documentos'],
      ['Fazer os checklists do seu setor', cks.length ? 'Marque cada etapa no horário. Quando pedir foto, ela é tirada na hora, pela câmera.' : 'Quando a empresa criar um checklist do seu setor, ele aparece aqui.', !cks.some(function (c) { var r = ckResumo(c, dia); return ckRoda(c, dia) && ckAberto(c, ckAgora()) && r.feitas < r.total; }), '#/checklists', 'Abrir checklists'],
      ['Holerites e vales', 'O holerite aparece depois que a empresa aprova. Vale só é descontado com a sua assinatura.', !valesDe(ME).some(function (v) { return !v.assinado; }), '#/holerites', 'Ver holerites']
    ];
  }
  var GUIA_JA = false;
  function guiaChave() { return 'seucomando-guia:' + (NUVEM ? (Nuvem.empresa || '') : 'local') + ':' + S.role; }
  function guiaMostrar() { try { return localStorage.getItem(guiaChave()) !== 'nao' && localStorage.getItem('seucomando-guia:todas') !== 'nao'; } catch (e) { return true; } }
  function abrirGuia() {
    var ps = ehFunc() ? passosFunc() : passosDe(), prox = ps.filter(function (p) { return !p[2]; })[0], feitos = ps.filter(function (p) { return p[2]; }).length;
    modal('Passo a passo', '<p class="ui-sub">' + (prox ? 'Siga na ordem. Toque no botão de cada passo para ir direto à tela certa.' : 'Tudo pronto por aqui. Você pode voltar a qualquer passo.') + ' Este guia abre de novo pelo botão "Passo a passo", no alto da tela.</p>' +
      '<div class="passos-prog"><span class="num">' + feitos + ' de ' + ps.length + ' prontos</span><progress max="' + ps.length + '" value="' + feitos + '">' + feitos + '</progress></div><ol class="passos-lista guia-lista">' + ps.map(function (p, i) {
        var atual = p === prox;
        return '<li class="' + (p[2] ? 'feito' : atual ? 'atual' : '') + '"><span class="passo-n" aria-hidden="true">' + (p[2] ? '✓' : i + 1) + '</span><span class="passo-txt"><strong>' + esc(p[0]) + '</strong>' + (atual ? '<span class="sub">' + esc(p[1]) + '</span>' : p[2] ? '<span class="sub">Pronto</span>' : '') + '</span><button type="button" class="btn' + (atual ? ' btn-primary' : ' btn-sm') + '" data-act="guia-ir" data-href="' + esc(p[3]) + '"' + (p[5] ? ' data-a="' + esc(p[5]) + '"' : '') + '>' + esc(p[2] ? 'Abrir' : p[4]) + '</button></li>';
      }).join('') + '</ol><label class="check"><input type="checkbox" data-in="guia-entrar"' + (guiaMostrar() ? ' checked' : '') + '> Mostrar o passo a passo quando eu entrar</label>',
      prox ? '<button type="button" class="btn" data-act="fechar">Agora não</button><button type="button" class="btn btn-primary" data-act="guia-ir" data-href="' + esc(prox[3]) + '"' + (prox[5] ? ' data-a="' + esc(prox[5]) + '"' : '') + '>Começar pelo passo ' + (ps.indexOf(prox) + 1) + '</button>' : '<button type="button" class="btn btn-primary" data-act="fechar">Fechar</button>', 'modal-largo');
  }
  function guiaAoEntrar() {
    if ($('.overlay') || !S.real || !guiaMostrar()) return;
    if (ehFunc() && !P(ME)) return;
    var ps = ehFunc() ? passosFunc() : passosDe(); if (!ps.some(function (p) { return !p[2]; })) return;
    abrirGuia();
  }
  function proximoFunc() {
    var itens = [], cfg = cfgPonto(), pi = proxInfo(ME);
    if (pi.prox > -1) itens.push(['Registrar ' + tipoNome(ME, pi.prox).toLowerCase(), cfg.rosto && !(S.rostos || {})[ME] ? 'Na primeira marcação, o app cadastra o seu rosto.' : 'Toque para abrir a câmera e marcar o ponto.', '#/ponto', 'Bater ponto']);
    ckVisiveis().forEach(function (c) { var dia = ckDia(); if (!ckRoda(c, dia) || !ckAberto(c, ckAgora())) return; var r = ckResumo(c, dia); if (r.feitas < r.total) itens.push([c.nome + ': falta' + (r.total - r.feitas > 1 ? 'm ' : ' ') + (r.total - r.feitas) + ' etapa' + (r.total - r.feitas > 1 ? 's' : ''), 'Limite às ' + c.limite + (ckAtrasado(c, {}, ckAgora()) ? ': já passou, vai pedir justificativa.' : '.'), '#/checklists', 'Abrir checklist']); });
    if (S.real) { var rd = resumoDocs(ME); if (rd.falta) itens.push([rd.falta + (rd.falta === 1 ? ' documento obrigatório falta' : ' documentos obrigatórios faltam'), 'Envie pelo app: foto nítida ou PDF.', '#/documentos', 'Enviar documentos']); }
    var vp = valesDe(ME).filter(function (v) { return !v.assinado; }).length; if (vp) itens.push([vp + (vp === 1 ? ' vale para assinar' : ' vales para assinar'), 'Sem a sua assinatura, o vale não pode ser descontado.', '#/vales', 'Assinar']);
    if (!itens.length) return '<div class="notice info"><div><strong>Tudo em dia</strong>Nada pendente agora.</div></div>';
    var a = itens[0];
    return '<div class="card proximo"><div class="proximo-main"><span class="lbl-s">O que fazer agora</span><strong class="proximo-tit">' + esc(a[0]) + '</strong><span class="ui-sub">' + esc(a[1]) + '</span></div><a class="btn btn-primary btn-xl" href="' + a[2] + '">' + esc(a[3]) + '</a></div>' +
      (itens.length > 1 ? '<div class="card"><ul class="list">' + itens.slice(1).map(function (x) { return '<li><span>' + esc(x[0]) + '<span class="sub">' + esc(x[1]) + '</span></span><a class="btn" href="' + x[2] + '">' + esc(x[3]) + '</a></li>'; }).join('') + '</ul></div>' : '');
  }

  /* ---------- Vagas e pré-entrevista ---------- */
  var REG = { clt: 'CLT', free: 'Freelancer', temp: 'Temporário', tanto: 'Tanto faz', qualquer: 'Qualquer' };
  var TUR = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', fds: 'Fim de semana' };
  function vagaAtual() { var id = S.ui.vaga; return S.vagas.filter(function (v) { return v.id === id; })[0] || S.vagas[0]; }
  function avalia(c, k) {
    var rq = c.reqs || {}, reqFalta = (window.CENTRALIZAR_REQS || []).filter(function (r) { return r.elim && rq[r.k] === 'nao'; })[0];
    if (reqFalta) return 'Sem ' + reqFalta.curto;
    if (!(k.regime === 'qualquer' || c.regime === 'tanto' || c.regime === k.regime)) return 'Regime diferente';
    var falta = k.turnos.filter(function (t) { return c.turnos.indexOf(t) < 0; });
    if (falta.length) return 'Não faz ' + TUR[falta[0]].toLowerCase();
    if (c.km > k.km) return 'Mora a ' + c.km + ' km';
    if (c.exp < k.exp) return 'Experiência menor';
    return '';
  }
  var ETAPAS_SEL = ['entrevista', 'aprovado', 'docs', 'reprovado'];
  function etapaHTML(c, i, m) {
    if (c.etapa === 'entrevista') return pill('warn', 'Entrevista ' + c.entrevistaEm) + ' <button type="button" class="btn btn-sm" data-act="ent-ok" data-i="' + i + '">Aprovar</button> <button type="button" class="btn btn-sm" data-act="ent-nao" data-i="' + i + '">Não aprovar</button>';
    if (c.etapa === 'aprovado') return pill('ok', 'Aprovado na entrevista') + (c.contato ? ' <button type="button" class="btn btn-sm" data-act="docs-modal" data-i="' + i + '">Enviar link de documentos</button>' : '<span class="sub">Sem WhatsApp: envie o link por outro meio</span>');
    if (c.etapa === 'docs') return pill('ok', 'Em admissão') + ' <a class="btn btn-sm" href="#/admissoes">Ver</a>';
    if (c.etapa === 'reprovado') return pill('mute', 'Não aprovado na entrevista');
    if (m) return '<span class="ui-sub">Descartado na triagem</span>';
    return '<button type="button" class="btn btn-sm" data-act="ent-modal" data-i="' + i + '">Chamar para entrevista</button>';
  }
  function reqsDaVaga(g) { var cg = cargoPor(g.cargo); return cg && window.CENTRALIZAR_REQS_DO_CARGO ? window.CENTRALIZAR_REQS_DO_CARGO(cg) : []; }
  function situacaoDoCargo(g) { var cg = cargoPor(g.cargo); return (cg && (window.CENTRALIZAR_SITUACOES || {})[cg.setor]) || window.CENTRALIZAR_SITUACAO_PADRAO || ''; }
  function vVagas() {
    var g = vagaAtual(), k = g.crit;
    var tabs = S.vagas.map(function (v) { return '<button type="button" role="tab" aria-selected="' + (v.id === g.id) + '" data-act="vaga" data-id="' + v.id + '">' + esc(v.titulo) + '</button>'; }).join('');
    var aptos = 0;
    var rows = g.cands.map(function (c, i) {
      var m = avalia(c, k); if (!m) aptos++;
      return '<tr><td><strong>' + esc(c.n) + '</strong>' + (c.novo ? ' ' + pill('warn', 'Novo') : '') + (c.jaTrabalhou === 'mesma' ? ' ' + pill('bad', 'Ex-empregado na função') : '') + '<span class="sub">' + esc(c.fone) + (c.contato ? '' : ' · não autorizou WhatsApp') + ' · <button type="button" class="link-btn" data-act="cand-ver" data-i="' + i + '">Ver respostas</button></span></td><td>' + esc(REG[c.regime]) + '</td><td class="hide-sm">' + c.turnos.map(function (t) { return esc(TUR[t]); }).join(', ') + '</td><td class="num hide-sm">' + c.km + ' km</td><td class="num hide-sm">' + c.exp + (c.exp === 1 ? ' ano' : ' anos') + '</td><td>' + (m ? pill('mute', m) : pill('ok', 'Passou')) + '</td><td>' + etapaHTML(c, i, m) + '</td></tr>';
    }).join('');
    var conta = function (et) { return g.cands.filter(function (c) { return et.indexOf(c.etapa) > -1; }).length; };
    var kpi = function (l, v, cap) { return '<div class="kpi"><div class="lbl">' + l + '</div><div class="val num">' + v + '</div><div class="cap">' + cap + '</div></div>'; };
    var funil = '<div class="card kpis kpis-5">' + kpi('Responderam', g.cands.length, 'triagem pelo link') + kpi('Passaram na triagem', aptos, 'pelos seus critérios') + kpi('Entrevistados', conta(ETAPAS_SEL), 'chamados para entrevista') + kpi('Aprovados', conta(['aprovado', 'docs']), 'na entrevista') + kpi('Em admissão', conta(['docs']), 'enviando documentos') + '</div>';
    var seg = ['clt', 'free', 'temp', 'qualquer'].map(function (r) { return '<button type="button" data-act="crit-reg" data-v="' + r + '" aria-pressed="' + (k.regime === r) + '">' + REG[r] + '</button>'; }).join('');
    var chips = Object.keys(TUR).map(function (t) { return '<button type="button" class="chip" data-act="crit-tur" data-v="' + t + '" aria-pressed="' + (k.turnos.indexOf(t) > -1) + '">' + TUR[t] + '</button>'; }).join('');
    var exps = [0, 1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (k.exp === n ? ' selected' : '') + '>' + (n ? 'Pelo menos ' + n + (n === 1 ? ' ano' : ' anos') : 'Sem exigência') + '</option>'; }).join('');
    return titleRow('Vagas e seleção', esc(g.titulo) + ' · ' + esc(g.regimeOferta), '<button type="button" class="btn" data-act="vaga-nova">Nova vaga</button><a class="btn" href="triagem.html?vaga=' + esc(g.id) + (NUVEM ? '&amp;e=' + esc(S.empresa.codigo || '') : '&amp;t=' + esc(S.tipo || '')) + '" target="_blank" rel="noopener">Ver como o candidato responde</a><button type="button" class="btn btn-primary" data-act="copiar-link">Copiar link da pré-entrevista</button>') +
      '<div class="tabs" role="tablist">' + tabs + '</div>' +
      '<div class="grid-main"><div class="stack">' + recebidosHTML() + funil + '<div class="card"><div class="card-head"><h2>Candidatos</h2><span class="ui-sub">Triagem, entrevista e documentos, nessa ordem</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>Candidato</th><th>Quer trabalhar como</th><th class="hide-sm">Turnos</th><th class="num hide-sm">Distância</th><th class="num hide-sm">Experiência</th><th>Triagem</th><th>Etapa</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="notice info"><div><strong>Como a seleção anda</strong>A triagem só descarta quem não se encaixa nos seus critérios. Quem passa é chamado para entrevista; só quem você aprova na entrevista recebe o link de documentos. Depois, o contador confere e você dá o ok final em Admissões.</div></div></div>' +
      '<div class="stack"><div class="card card-pad stack"><h2 class="sec">Critérios da triagem</h2>' +
      '<div class="field"><span class="lbl-s">Regime da vaga</span><div class="seg">' + seg + '</div></div>' +
      '<div class="field"><span class="lbl-s">Turnos obrigatórios</span><div class="chips">' + chips + '</div></div>' +
      '<div class="field"><label for="km">Distância máxima: <strong>' + k.km + ' km</strong></label><input id="km" type="range" min="1" max="25" value="' + k.km + '" data-in="crit-km"></div>' +
      '<div class="field"><label for="exp">Experiência no ramo</label><select id="exp" data-in="crit-exp">' + exps + '</select></div></div>' +
      '<div class="card card-pad stack"><h2 class="sec">Perguntas da triagem</h2><p class="ui-sub">Só perguntas, nenhum documento nessa etapa (LGPD, art. 6º, III). São cerca de 5 minutos para o candidato.</p><ul class="list">' +
      ['Dados de contato e bairro', 'Contratação, turnos, feriados e domingos, início', 'Distância, transporte e pretensão salarial', 'Experiência, última empresa, se já trabalhou aqui, escolaridade', 'Uma situação do dia a dia do setor: ' + esc(situacaoDoCargo(g)), 'Declaração de veracidade e aceite de WhatsApp'].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      (reqsDaVaga(g).length ? '<h3 class="lbl-s">Requisitos desta função</h3><ul class="list">' + reqsDaVaga(g).map(function (r) { return '<li>' + esc(r.curto.charAt(0).toUpperCase() + r.curto.slice(1)) + (r.elim ? ' ' + pill('bad', 'Elimina') : '') + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="notice info"><div><strong>Perguntas bloqueadas</strong>Sexo, estado civil, filhos, gravidez, raça, cor, religião, origem, saúde, deficiência e antecedentes criminais não são perguntados (Lei 9.029/95; Tema 1 do TST). A idade só aparece quando a lei proíbe a função para menores de 18 anos.</div></div></div></div></div>';
  }

  /* ---------- Admissões ---------- */
  function admAtual() { var id = S.ui.adm || (S.admissoes[0] || {}).id; return S.admissoes.filter(function (a) { return a.id === id; })[0]; }
  var PASSOS = ['Triagem', 'Entrevista', 'Documentos', 'Conferência do contador', 'Ok do empregador'];
  function passoAdm(a) { var tudo = a.docs.every(function (d) { return d.st === 'ok'; }); return a.aprovada ? 5 : a.conferida ? 4 : tudo ? 3 : 2; }
  function situacaoAdm(a) { var n = passoAdm(a); return n === 5 ? ['ok', 'Admissão aprovada'] : n === 4 ? ['warn', 'Aguardando o ok do empregador'] : n === 3 ? ['mute', 'Com o contador'] : ['warn', 'Aguardando documentos']; }
  function vAdmissoes() {
    var a = admAtual(), editar = can('empresa contador'), passo = passoAdm(a);
    var rows = S.admissoes.map(function (x) { var ok = x.docs.filter(function (d) { return d.st === 'ok'; }).length, st = situacaoAdm(x); return '<tr class="click' + (x.id === a.id ? ' sel' : '') + '" data-act="adm" data-id="' + x.id + '"><td><strong>' + esc(x.nome) + '</strong><span class="sub">' + esc(x.funcao) + '</span></td><td class="num">' + ok + ' de ' + x.docs.length + '</td><td class="num hide-sm">' + dmy(x.inicio) + '</td><td>' + pill(st[0], st[1]) + '</td></tr>'; }).join('');
    var docs = a.docs.map(function (d, i) {
      var por = d.por === 'contador' ? 'editado pelo contador' : d.por === 'empresa' ? 'editado pela empresa' : d.por === 'candidato' ? 'enviado pelo candidato' : 'ainda não enviado';
      return '<div class="field"><label for="doc' + i + '">' + esc(d.n) + ' <span class="pill ' + (d.st === 'ok' ? 'ok' : 'warn') + '">' + esc(por) + '</span></label>' +
        (editar && !a.aprovada ? '<input id="doc' + i + '" value="' + esc(d.v) + '" data-in="doc" data-i="' + i + '" placeholder="Aguardando o candidato">' : '<input id="doc' + i + '" value="' + esc(d.v) + '" readonly>') + '</div>';
    }).join('');
    var tudo = passo >= 3;
    var trilha = '<ol class="steps" aria-label="Etapas da admissão">' + PASSOS.map(function (t, i) { return '<li class="' + (i < passo ? 'done' : i === passo ? 'now' : '') + '"' + (i === passo ? ' aria-current="step"' : '') + '>' + esc(t) + '</li>'; }).join('') + '</ol>';
    var hist = a.hist.slice().reverse().map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
    var quem = S.role === 'contador' ? 'Você está como contador: confira os documentos, corrija o que for preciso e clique em “Conferir documentos” para liberar o ok do empregador.' : 'O aprovado na entrevista envia os documentos pelo link, o contador confere e só então você dá o ok final.';
    var acoes = '<a class="btn" href="#/contratos" data-act="gerar-contrato" data-id="' + a.id + '">Gerar contrato sugerido</a>';
    if (S.role === 'contador') acoes += '<button type="button" class="btn btn-primary" data-act="conferir"' + (tudo && !a.conferida ? '' : ' disabled') + '>' + (a.conferida ? 'Documentos conferidos' : 'Conferir documentos') + '</button>';
    if (S.role === 'empresa') acoes += '<button type="button" class="btn btn-primary" data-act="aprovar-adm"' + (a.conferida && !a.aprovada ? '' : ' disabled') + '>' + (a.aprovada ? 'Ok dado' : a.conferida ? 'Dar o ok na admissão' : 'Ok após o contador conferir') + '</button>';
    return titleRow('Admissões', 'Só quem foi aprovado na entrevista · o contador confere e o empregador dá o ok', acoes) +
      '<div class="grid-main"><div class="stack"><div class="card"><div class="table-box"><table class="t"><thead><tr><th>Pessoa</th><th class="num">Documentos</th><th class="num hide-sm">Início</th><th>Situação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h2>' + esc(a.nome) + '</h2><span class="ui-sub">' + esc(a.funcao) + '</span></div><div class="card-pad stack">' + trilha + '<div class="notice info"><div>' + quem + '</div></div><div class="form-grid">' + docs + '</div>' +
      (tudo ? '' : '<div><button type="button" class="btn" data-act="pedir-docs">Pedir o que falta pelo WhatsApp</button></div>') + '</div></div></div>' +
      '<div><h2 class="sec">Histórico</h2><div class="card"><ul class="list">' + hist + '</ul></div></div></div>';
  }

  /* ---------- Contratos ---------- */
  // Fluxo: o empregador escolhe o enquadramento, o sistema monta o contrato e verifica os pontos de risco,
  // o empregador confere o checklist e só então exporta o PDF (com marca d'água no plano de avaliação).
  var CARGOS = window.CENTRALIZAR_CARGOS || [], ALERTAS = window.CENTRALIZAR_ALERTAS || {};
  function cargoPor(id) { return CARGOS.filter(function (c) { return c.id === id; })[0] || CARGOS[0]; }
  var JORNADAS = {
    '44-sab': ['44 horas semanais, de segunda a sábado', 'de segunda a sexta-feira, das 8h às 17h, com 1 hora de intervalo, e aos sábados das 8h às 12h'],
    '44-sex': ['44 horas semanais, de segunda a sexta', 'de segunda a sexta-feira, 8 horas e 48 minutos por dia, com 1 hora de intervalo, compensando o sábado por acordo individual escrito (CLT, art. 59, § 6º)'],
    '1236': ['escala 12x36', 'em escala de 12 horas de trabalho por 36 de descanso, com intervalo para repouso e alimentação, ajustada por acordo individual escrito (CLT, art. 59-A)'],
    'p30': ['tempo parcial de 30 horas', 'em regime de tempo parcial de até 30 horas semanais, sem horas extras (CLT, art. 58-A)'],
    'p26': ['tempo parcial de 26 horas', 'em regime de tempo parcial de até 26 horas semanais, com até 6 horas extras por semana (CLT, art. 58-A)'],
    '6h': ['6 horas diárias (36 semanais)', 'de 6 horas diárias e 36 semanais, com intervalo de 15 minutos (CLT, arts. 71, § 1º, e 227)']
  };
  var TURNOS = { diurno: 'diurno', noturno: 'noturno (22h às 5h)', misto: 'misto' };
  var INSAL = { '': 'Não', '10': 'Grau mínimo (10%)', '20': 'Grau médio (20%)', '40': 'Grau máximo (40%)' };
  function ctEstado() {
    var c = S.ui.ct || (S.ui.ct = { modelo: 'experiencia', alvo: 'novo', cargo: 'atendente-de-lanchonete', dias: 45, jornada: '44-sab', turno: 'diurno', insal: '', peric: false, noturno: false, salario: 1980, art481: false, cct: '', inicio: addDays(S.hoje, 3), checks: {} });
    c.checks = c.checks || {};
    var pad = { autoProrrog: true, vt: true, banco: false, comissao: 0, grat: 40, modalidade: 'presencial', opc: {}, extras: [], ncMeses: 6, cursoMeses: 12 };
    Object.keys(pad).forEach(function (k) { if (c[k] === undefined) c[k] = pad[k]; });
    if (c.imagem) { c.opc.imagem = true; delete c.imagem; }
    return c;
  }
  function pessoasContrato() {
    return [{ id: 'novo', nome: '[NOME DO EMPREGADO]', cpf: '[CPF]', salario: null, cargo: null, tipo: 'novo' }]
      .concat(S.admissoes.map(function (a) { return { id: a.id, nome: a.nome, cpf: a.cpf, salario: a.salario, cargo: a.cargo, inicio: a.inicio, funcao: a.funcao, tipo: 'admissao' }; }))
      .concat(S.pessoas.map(function (p) { return { id: p.id, nome: p.nome, cpf: p.cpf, salario: p.salario, cargo: p.cargo, admissao: p.admissao, funcao: p.funcao, tipo: 'empregado' }; }));
  }
  function temFlag(cargo, prefixos) { return cargo.flags.some(function (f) { return prefixos.some(function (p) { return f.indexOf(p) === 0; }); }); }
  // Periculosidade marcada automaticamente só quando a lei já garante; motociclista (PEM) fica como alerta.
  var PERIC = ['PE', 'PEI', 'PEE', 'PEV', 'PEB', 'PEM'];
  function temPeric(cargo) { return cargo.flags.some(function (f) { return PERIC.indexOf(f) > -1; }); }
  function contratoExperiencia(ct, pessoa, cargo) {
    var exp = ct.modelo === 'experiencia';
    var corpo = window.CENTRALIZAR_CLAUSULAS ? window.CENTRALIZAR_CLAUSULAS({ esc: esc, brl: brl, dmyy: dmyy, addDays: addDays, JORNADAS: JORNADAS, TURNOS: TURNOS, empresa: S.empresa, ct: ct, pessoa: pessoa, cargo: cargo }) : '';
    return '<h3>Contrato individual de trabalho ' + (exp ? 'por prazo determinado, na modalidade de experiência' : 'por prazo indeterminado') + '</h3><p class="center">' + esc(S.empresa.cidade) + '</p>' +
      '<p><strong>EMPREGADORA:</strong> ' + esc(S.empresa.razao) + ', inscrita no CNPJ sob o nº ' + esc(S.empresa.cnpj) + ', com sede em ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + ', neste ato representada na forma do seu contrato social.<br><strong>EMPREGADA(O):</strong> ' + esc(pessoa.nome) + ', inscrita(o) no CPF sob o nº ' + esc(pessoa.cpf) + ', com os demais dados de qualificação constantes do registro de empregado.</p>' +
      '<p>As partes celebram este contrato' + (exp ? ', assinado antes do início da prestação de serviços,' : '') + ' que se regerá pela CLT, pela legislação aplicável, pelas normas coletivas da categoria e pelas cláusulas a seguir.</p>' +
      corpo +
      '<p class="center sig-data">' + esc(S.empresa.cidade.split('/')[0]) + ', ____ de ______________ de 2026.</p>' +
      '<div class="sig"><span>' + esc(S.empresa.razao) + '<br>EMPREGADORA</span><span>' + esc(pessoa.nome) + '<br>EMPREGADA(O)</span><span>Testemunha<br>Nome e CPF</span><span>Testemunha<br>Nome e CPF</span></div>';
  }
  function contratoModelo(t, pessoa, cargo, ct) {
    var sal = t.id === 'intermitente' ? (+ct.salario || 0) / 220 : +ct.salario || 0;
    var campos = { funcao: cargo.cargo.toLowerCase() + ' (CBO ' + cargo.cbo + ')', cidade: S.empresa.cidade, inicio: dmyy(ct.inicio), salario: brl(sal) };
    var fill = function (s) { return esc(s).replace(/\{\{(\w+)\}\}/g, function (_, k) { return '<strong>' + esc(campos[k] || '') + '</strong>'; }); };
    var partes = t.id === 'autonomo' ? ['CONTRATANTE', 'CONTRATADO'] : t.id === 'estagio' ? ['CONCEDENTE', 'ESTAGIÁRIO(A)'] : ['EMPREGADORA', 'EMPREGADO(A)'];
    return '<h3>' + esc(t.titulo) + '</h3><p class="center">' + esc(S.empresa.cidade) + '</p>' +
      '<p><strong>' + partes[0] + ':</strong> ' + esc(S.empresa.razao) + ', CNPJ ' + esc(S.empresa.cnpj) + ', ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + '.<br><strong>' + partes[1] + ':</strong> ' + esc(pessoa.nome) + ', CPF ' + esc(pessoa.cpf) + '.</p>' +
      '<ol>' + t.clausulas.map(function (c) { return '<li contenteditable="true">' + fill(c) + '</li>'; }).join('') + (ct.extras || []).map(function (e) { return '<li contenteditable="true"><strong>' + esc(e.titulo) + '.</strong> ' + esc(e.texto).replace(/\n/g, '<br>') + '</li>'; }).join('') + '</ol>' +
      '<p class="center">' + esc(S.empresa.cidade.split('/')[0]) + ', ____ de ______________ de 2026.</p><div class="sig"><span>' + esc(S.empresa.razao) + '</span><span>' + esc(pessoa.nome) + '</span></div>';
  }
  function verificacao(ct, pessoa, cargo) {
    var v = [];
    if (ct.modelo === 'experiencia') {
      var cand = null; S.vagas.forEach(function (vg) { vg.cands.forEach(function (c) { if (c.n === pessoa.nome) cand = c; }); });
      if (cand && cand.jaTrabalhou === 'mesma') v.push(['bad', esc(pessoa.nome) + ' informou na pré-entrevista que já trabalhou aqui na mesma função. Nova experiência é considerada inválida pelo TST: use contrato por prazo indeterminado.']);
      if (pessoa.tipo === 'empregado') v.push(['bad', esc(pessoa.nome) + ' já é empregada(o) desde ' + dmyy(pessoa.admissao) + '. Nova experiência para quem já trabalhou na empresa, principalmente na mesma função, é considerada inválida pelo TST.']);
      if (diffDays(S.hoje, ct.inicio) < 0) v.push(['bad', 'O início (' + dmyy(ct.inicio) + ') já passou. O contrato precisa ser assinado antes do primeiro dia de trabalho; assinado depois, corre o risco de virar contrato por prazo indeterminado.']);
      else v.push(['ok', 'Prazo de ' + ct.dias + ' dias, dentro do limite de 90, com prorrogação única prevista.']);
      v.push(['info', 'Gestante e acidentado têm estabilidade mesmo no contrato de experiência (Súmulas 244, III, e 378, III, do TST). Antes de encerrar no prazo, confira essas situações.']);
    }
    if (ct.turno !== 'diurno' && !ct.noturno) v.push(['bad', 'Turno ' + TURNOS[ct.turno] + ' sem adicional noturno: inclua os 20% (CLT, art. 73).']);
    if (ct.jornada === '1236') v.push(['warn', 'A escala 12x36 precisa de acordo individual escrito ou de norma coletiva (CLT, art. 59-A).']);
    if (temPeric(cargo) && !ct.peric) v.push(['warn', 'Este cargo costuma ter periculosidade. Havendo exposição permanente ao risco, os 30% são devidos.']);
    if (cargo.flags.indexOf('PEM') > -1) v.push(['warn', esc(ALERTAS.PEM || '')]);
    if (temFlag(cargo, ['IN']) && !ct.insal) v.push(['warn', 'Este cargo pode ter insalubridade: confirme no laudo (PGR/LTCAT) se é devida e em qual grau.']);
    if (ct.peric && ct.insal) v.push(['warn', 'Insalubridade e periculosidade não se acumulam: o empregado escolhe o adicional mais vantajoso (CLT, art. 193, § 2º).']);
    if (cargo.flags.indexOf('TIP') > -1) v.push(['warn', 'Cargo proibido para menores de 18 anos (Decreto 6.481/2008, Lista TIP). Confirme a idade.']);
    if (cargo.flags.indexOf('REG') > -1) v.push(['warn', 'Profissão regulamentada: confira o registro no conselho antes da admissão.' + (cargo.nota ? ' ' + esc(cargo.nota) : '')]);
    if (ct.opc && ct.opc.naoconcorrencia) v.push(['warn', 'Não concorrência: a indenização mensal (' + ct.ncMeses + ' meses × último salário) precisa ser paga de fato; sem pagamento, a cláusula cai e a empresa não pode cobrar nada.']);
    if (ct.opc && ct.opc.curso) v.push(['info', 'Cursos: o reembolso só vale para curso não obrigatório e com termo assinado informando o valor. Na rescisão, o desconto fica limitado a um salário (art. 477, § 5º).']);
    (ct.extras || []).forEach(function (e) {
      var rs = window.CENTRALIZAR_RISCOS_CLAUSULA ? window.CENTRALIZAR_RISCOS_CLAUSULA(e.titulo + ' ' + e.texto) : [];
      if (!rs.length) v.push(['ok', 'Cláusula própria "' + esc(e.titulo) + '": nenhum ponto de nulidade encontrado na leitura automática. Revise com seu advogado.']);
      rs.forEach(function (r) { v.push([r[0], 'Cláusula própria "' + esc(e.titulo) + '": ' + esc(r[1])]); });
    });
    return v;
  }
  var CHECKS = [['cct', 'Conferi o piso e as regras da convenção coletiva (CCT)'], ['aso', 'O exame admissional (ASO) será feito antes do início (NR-7)'], ['laudo', 'Conferi os adicionais no laudo (PGR/LTCAT) da empresa']];
  function marcaDagua() { return S.real ? '' : '<div class="wm" aria-hidden="true"><span>SEU COMANDO · EXEMPLO</span><span>SEU COMANDO · EXEMPLO</span><span>SEU COMANDO · EXEMPLO</span></div>'; }
  function contratoAtualHTML() {
    var ct = ctEstado(), ps = pessoasContrato(), pessoa = ps.filter(function (x) { return x.id === ct.alvo; })[0] || ps[0], cargo = cargoPor(ct.cargo);
    var t = TPL.filter(function (x) { return x.id === ct.modelo; })[0];
    var corpo = (ct.modelo === 'experiencia' || ct.modelo === 'indeterminado') ? contratoExperiencia(ct, pessoa, cargo) : contratoModelo(t, pessoa, cargo, ct);
    return { pessoa: pessoa, cargo: cargo, ct: ct, corpo: corpo };
  }
  function vContratos() {
    var tab = S.ui.ctTab || 'equipe';
    if (tab === 'gerar') return vGerador();
    return titleRow('Contratos', 'Passo a passo: escolha a pessoa e o modelo, baixe, colha a assinatura e guarde o contrato assinado') + ctAcoes() + abasContrato(tab) + (tab === 'modelos' ? vCtModelos() : vCtEquipe());
  }
  function ctAcoes() {
    var nm = (S.modelosCt || []).length, falta = (S.contratos || []).filter(function (c) { return !c.arquivo; }).length;
    var card = function (n, t, d, attrs, prim) { return '<button type="button" class="acao-card' + (prim ? ' acao-prim' : '') + '" ' + attrs + '><span class="acao-n">' + n + '</span><span class="acao-t">' + esc(t) + '</span><span class="acao-d">' + esc(d) + '</span></button>'; };
    return '<div class="acao-cards">' +
      card(1, nm ? 'Fazer contrato para a equipe' : 'Criar o primeiro modelo', nm ? 'Escolha a pessoa e o modelo: o contrato sai preenchido com os dados do cadastro.' : 'Monte pelo gerador por função ou cole o contrato que você já usa.', nm ? 'data-act="ct-wiz"' : 'data-act="ct-tab" data-v="modelos"', true) +
      card(2, 'Modelos da empresa', nm ? nm + (nm === 1 ? ' modelo pronto' : ' modelos prontos') + '. Crie outro pelo gerador ou cole o texto que você usa.' : 'Cadastre uma vez e use para quantas pessoas quiser.', 'data-act="ct-tab" data-v="modelos"') +
      card(3, 'Guardar o contrato assinado', falta ? falta + (falta === 1 ? ' contrato esperando' : ' contratos esperando') + ' a versão assinada. Envie o PDF ou a foto.' : 'Envie o PDF ou a foto do contrato já assinado.', 'data-act="ct-tab" data-v="equipe"') + '</div>';
  }
  function atualizaCtWiz(f) {
    var box = $('[data-ctresumo]', f); if (!box) return;
    var d = new FormData(f), m = modeloCt(String(d.get('m') || '')), ps = d.getAll('p').map(P).filter(Boolean);
    if (!m || !ps.length) { box.innerHTML = '<p class="ui-sub">Volte e escolha as pessoas e o modelo.</p>'; return; }
    var ja = ps.filter(function (p) { return (S.contratos || []).some(function (c) { return c.modelo === m.id && c.pessoa === p.id; }); }), novos = ps.filter(function (p) { return ja.indexOf(p) < 0; }), nomes = function (l) { return l.map(function (p) { return p.nome; }).join(', '); };
    box.innerHTML = '<div class="conf-j"><p><strong>' + esc(m.nome) + '</strong> para ' + (novos.length ? esc(nomes(novos)) : 'ninguém novo') + '.</p>' +
      (ja.length ? '<div class="notice"><div><strong>Já tem este contrato</strong>' + esc(nomes(ja)) + (ja.length === 1 ? ' já tem este contrato e fica de fora.' : ' já têm este contrato e ficam de fora.') + '</div></div>' : '') +
      '<p class="ui-sub">Nome, CPF, função, salário e data de admissão saem do cadastro de cada pessoa.</p><ol class="mini-passos n3"><li class="atual">Gerar o contrato (agora)</li><li>Baixar, imprimir e colher a assinatura</li><li>Enviar o assinado em "Contratos da equipe"</li></ol></div>';
  }
  function vGerador() {
    var x = contratoAtualHTML(), ct = x.ct, pessoa = x.pessoa, cargo = x.cargo, ver = verificacao(ct, pessoa, cargo);
    var bloqueio = ver.some(function (i) { return i[0] === 'bad'; }), conferido = CHECKS.every(function (c) { return ct.checks[c[0]]; });
    var setores = []; CARGOS.forEach(function (c) { if (setores.indexOf(c.setor) < 0) setores.push(c.setor); });
    var optCargo = setores.map(function (s) { return '<optgroup label="' + esc(s) + '">' + CARGOS.filter(function (c) { return c.setor === s; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === cargo.id ? ' selected' : '') + '>' + esc(c.cargo) + ' · CBO ' + esc(c.cbo) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    var optPessoa = pessoasContrato().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === pessoa.id ? ' selected' : '') + '>' + esc(p.tipo === 'novo' ? 'Novo empregado (preencher depois)' : p.nome + (p.tipo === 'admissao' ? ' · em admissão' : ' · já empregado')) + '</option>'; }).join('');
    var opt = function (obj, cur) { return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (String(cur) === k ? ' selected' : '') + '>' + esc(Array.isArray(obj[k]) ? obj[k][0] : obj[k]) + '</option>'; }).join(''); };
    var modelos = TPL.map(function (m) { return '<option value="' + m.id + '"' + (m.id === ct.modelo ? ' selected' : '') + '>' + esc(m.nome) + '</option>'; }).join('');
    var exp = ct.modelo === 'experiencia';
    var form = '<div class="card card-pad stack"><h2 class="sec">1. Enquadramento</h2>' +
      '<div class="field"><label for="c-modelo">Modelo</label><select id="c-modelo" data-in="ct" data-k="modelo">' + modelos + '</select></div>' +
      '<div class="field"><label for="c-alvo">Para quem</label><select id="c-alvo" data-in="ct" data-k="alvo">' + optPessoa + '</select></div>' +
      '<div class="field"><label for="c-cargo">Cargo (' + CARGOS.length + ' cargos com CBO)</label><select id="c-cargo" data-in="ct" data-k="cargo">' + optCargo + '</select></div>' +
      '<div class="form-grid">' + (exp ? '<div class="field"><label for="c-dias">Prazo da experiência</label><select id="c-dias" data-in="ct" data-k="dias">' + opt({ 30: '30 dias', 45: '45 dias', 60: '60 dias', 90: '90 dias' }, ct.dias) + '</select></div>' : '') +
      '<div class="field"><label for="c-ini">Início</label><input id="c-ini" type="date" value="' + esc(ct.inicio) + '" data-in="ct" data-k="inicio"></div></div>' +
      '<div class="field"><label for="c-jor">Jornada</label><select id="c-jor" data-in="ct" data-k="jornada">' + opt(JORNADAS, ct.jornada) + '</select></div>' +
      '<div class="form-grid"><div class="field"><label for="c-tur">Turno</label><select id="c-tur" data-in="ct" data-k="turno">' + opt(TURNOS, ct.turno) + '</select></div>' +
      '<div class="field"><label for="c-sal">Salário (R$)</label><input id="c-sal" type="number" min="0" step="0.01" value="' + esc(ct.salario) + '" data-in="ct" data-k="salario"></div></div>' +
      '<div class="field"><label for="c-ins">Insalubridade</label><select id="c-ins" data-in="ct" data-k="insal">' + opt(INSAL, ct.insal) + '</select></div>' +
      '<label class="check"><input type="checkbox" data-in="ct" data-k="peric"' + (ct.peric ? ' checked' : '') + '> Periculosidade (30%)</label>' +
      '<label class="check"><input type="checkbox" data-in="ct" data-k="noturno"' + (ct.noturno ? ' checked' : '') + '> Adicional noturno (20%)</label>' +
      (exp ? '<label class="check"><input type="checkbox" data-in="ct" data-k="art481"' + (ct.art481 ? ' checked' : '') + '> Rescisão antecipada recíproca (art. 481)</label>' : '') +
      (exp ? '<label class="check"><input type="checkbox" data-in="ct" data-k="autoProrrog"' + (ct.autoProrrog !== false ? ' checked' : '') + '> Prorrogação automática prevista no contrato</label>' : '') +
      '<label class="check"><input type="checkbox" data-in="ct" data-k="banco"' + (ct.banco ? ' checked' : '') + '> Banco de horas por acordo individual (6 meses)</label>' +
      '<label class="check"><input type="checkbox" data-in="ct" data-k="vt"' + (ct.vt !== false ? ' checked' : '') + '> Vale-transporte</label>' +
      (cargo.flags.indexOf('COM') > -1 ? '<div class="field"><label for="c-com">Comissão sobre vendas (%)</label><input id="c-com" type="number" min="0" max="30" step="0.5" value="' + esc(ct.comissao || 0) + '" data-in="ct" data-k="comissao"></div>' : '') +
      (cargo.flags.indexOf('CONF') > -1 ? '<div class="field"><label for="c-grat">Gratificação de função (%, mínimo 40 para cargo de confiança)</label><input id="c-grat" type="number" min="0" max="200" step="1" value="' + esc(ct.grat || 40) + '" data-in="ct" data-k="grat"></div>' : '') +
      (cargo.flags.indexOf('TELE') > -1 ? '<div class="field"><label for="c-mod">Modalidade</label><select id="c-mod" data-in="ct" data-k="modalidade">' + opt({ presencial: 'Presencial', hibrido: 'Híbrido', tele: 'Teletrabalho' }, ct.modalidade || 'presencial') + '</select></div>' : '') +
      '<div class="field"><label for="c-cct">Convenção coletiva (sindicato)</label><input id="c-cct" maxlength="80" value="' + esc(ct.cct) + '" placeholder="Ex.: CCT 2026 do sindicato da categoria" data-in="ct" data-k="cct"></div></div>';
    var OPC = window.CENTRALIZAR_OPCIONAIS || [], simples = ct.modelo !== 'experiencia' && ct.modelo !== 'indeterminado';
    var extras = '<div class="card card-pad stack" id="ct-extras"><h2 class="sec">2. Cláusulas adicionais</h2><p class="ui-sub">Inclua cláusulas prontas ou escreva as suas. Elas entram numeradas antes das disposições finais e passam pela verificação.</p>' +
      (simples ? '<p class="ui-sub">As cláusulas prontas são do contrato CLT (experiência ou prazo indeterminado). Neste modelo, só as cláusulas próprias entram.</p>' : '<div class="opc-list">' + OPC.map(function (o) { var on = !!(ct.opc || {})[o.k];
        return '<label class="check opc"><input type="checkbox" data-in="ct-opc" data-k="' + o.k + '"' + (on ? ' checked' : '') + '> <span><strong>' + esc(o.nome) + '</strong><span class="sub">' + esc(o.base) + '</span></span></label>' +
          (on && o.k === 'naoconcorrencia' ? '<div class="field opc-par"><label for="c-nc">Prazo da restrição</label><select id="c-nc" data-in="ct" data-k="ncMeses">' + opt({ 6: '6 meses', 12: '12 meses', 24: '24 meses (máximo aceito)' }, ct.ncMeses) + '</select></div>' : '') +
          (on && o.k === 'curso' ? '<div class="field opc-par"><label for="c-cur">Permanência após o curso</label><select id="c-cur" data-in="ct" data-k="cursoMeses">' + opt({ 6: '6 meses', 12: '12 meses', 18: '18 meses', 24: '24 meses' }, ct.cursoMeses) + '</select></div>' : '');
      }).join('') + '</div>') +
      ((ct.extras || []).length ? '<ul class="list extra-list">' + ct.extras.map(function (e, i) { var rs = window.CENTRALIZAR_RISCOS_CLAUSULA ? window.CENTRALIZAR_RISCOS_CLAUSULA(e.titulo + ' ' + e.texto) : [];
        return '<li><span><strong>' + esc(e.titulo) + '</strong> ' + (rs.some(function (r) { return r[0] === 'bad'; }) ? pill('bad', 'Nula como está') : rs.length ? pill('warn', 'Revisar') : pill('ok', 'Sem alerta')) + '<span class="sub">' + esc(String(e.texto).slice(0, 110)) + (String(e.texto).length > 110 ? '…' : '') + '</span></span><button type="button" class="btn btn-sm" data-act="ct-extra-del" data-i="' + i + '">Remover</button></li>'; }).join('') + '</ul>' : '') +
      '<form class="stack extra-form" data-form="ct-extra"><h3 class="lbl-s">Escrever cláusula própria</h3><div class="field"><label for="cx-t">Título</label><input id="cx-t" name="t" maxlength="80" placeholder="Ex.: Do uso do estacionamento" required></div>' +
      '<div class="field"><label for="cx-x">Texto (deixe uma linha em branco para criar parágrafos)</label><textarea id="cx-x" name="x" maxlength="1500" rows="5" placeholder="Ex.: A(O) EMPREGADA(O) poderá utilizar o estacionamento da empresa durante o expediente, sem custo e sem natureza salarial." required></textarea></div>' +
      '<button type="submit" class="btn">Incluir no contrato</button></form></div>';
    var pontos = '<div class="card card-pad stack"><h2 class="sec">Pontos trabalhistas de ' + esc(cargo.cargo) + '</h2><p class="ui-sub">CBO ' + esc(cargo.cbo) + ' · ' + esc(cargo.cboNome) + ' · ' + esc(cargo.setor) + '</p><ul class="list">' +
      cargo.flags.map(function (f) { return '<li>' + esc(ALERTAS[f] || f) + '</li>'; }).join('') + '<li>Confira piso, benefícios e regras da convenção coletiva (CCT) do sindicato da categoria.</li>' + (cargo.nota ? '<li>' + esc(cargo.nota) + '</li>' : '') + '</ul></div>';
    var verif = '<div class="card card-pad stack"><h2 class="sec">3. Verificação do contrato</h2>' + ver.map(function (i) { return '<div class="notice ' + (i[0] === 'bad' ? 'bad' : i[0] === 'ok' || i[0] === 'info' ? 'info' : '') + '"><div>' + i[1] + '</div></div>'; }).join('') +
      CHECKS.map(function (c) { return '<label class="check"><input type="checkbox" data-in="ct-check" data-k="' + c[0] + '"' + (ct.checks[c[0]] ? ' checked' : '') + '> ' + esc(c[1]) + '</label>'; }).join('') + '</div>';
    var btn = '<button type="button" class="btn btn-primary" data-act="ct-pdf"' + (conferido && !bloqueio ? '' : ' disabled') + '>' + (bloqueio ? 'Corrija os pontos em vermelho' : conferido ? 'Exportar PDF' : 'Marque a verificação para exportar') + '</button>';
    return titleRow('Gerador de contrato por função', 'Monte, verifique e salve como modelo da empresa ou exporte o PDF' + (S.real ? '' : ' · no exemplo, o PDF sai com marca d\'água'), '<button type="button" class="btn" data-act="ct-salvar-modelo">Salvar como modelo</button>' + btn) + abasContrato('gerar') +
      '<ol class="mini-passos"><li>Enquadramento: modelo, pessoa e cargo</li><li>Cláusulas adicionais (se quiser)</li><li>Verificação: corrija o que estiver em vermelho</li><li>Salvar como modelo ou exportar o PDF</li></ol>' +
      '<div class="doc-wrap ct-wrap"><div class="stack">' + form + extras + verif + pontos + '</div>' +
      '<article class="paper" id="paper">' + marcaDagua() + '<div class="notice sugestao"><div><strong>Sugestão de cláusulas, não é parecer jurídico</strong>Clique em qualquer cláusula para editar antes de exportar. Revise com seu advogado ou contador.</div></div>' + x.corpo + '</article></div>';
  }

  /* ---------- Recrutamento e seleção (agência) e integração com as empresas clientes ---------- */
  var ENVIOS = null; // modo conectado: envios entre recrutadora e empresas vêm do banco
  function carregarEnvios() { if (!NUVEM || ehFunc()) return Promise.resolve(); return Nuvem.envios(S.empresa.codigo || '').then(function (rows) { ENVIOS = (rows || []).map(function (r) { var d = r.dados || {}; return { id: r.id, para: r.para_codigo, de: r.de_nome, processo: d.processo, titulo: d.titulo, cargo: d.cargo, salario: d.salario, cand: d.cand, em: String(r.criado_em || '').slice(0, 16).replace('T', ' '), status: r.status, motivo: r.motivo, decididoEm: r.decidido_em }; }); }).catch(function () { /* mantém o que tinha */ }); }
  function integ() { if (NUVEM) return { envios: (ENVIOS || []).concat(S.importados || []).map(function (e) { return JSON.parse(JSON.stringify(e)); }) };
    try { var r = JSON.parse(localStorage.getItem(KEYINT) || 'null'); if (r && Array.isArray(r.envios)) return r; } catch (e) { /* sem armazenamento */ } return { envios: [] }; }
  function salvaInteg(x) {
    if (NUVEM) {
      var cache = {}; (ENVIOS || []).forEach(function (e) { cache[e.id] = e; });
      S.importados = x.envios.filter(function (e) { return e.origem === 'arquivo'; });
      x.envios.forEach(function (e) {
        if (e.origem === 'arquivo') return;
        var antigo = cache[e.id];
        if (!antigo && e.para !== S.empresa.codigo) { ENVIOS = (ENVIOS || []).concat([e]); Nuvem.enviar(S.empresa.nome, e.para, { processo: e.processo, titulo: e.titulo, cargo: e.cargo, salario: e.salario, cand: e.cand }, e.id).catch(function () { toast('Não foi possível enviar ao cliente agora. Tente de novo.'); }); }
        else if (antigo && e.para === S.empresa.codigo && antigo.status === 'enviado' && e.status !== 'enviado') { antigo.status = e.status; antigo.motivo = e.motivo; Nuvem.decidir(e.id, e.status, e.motivo).catch(function () { toast('Não foi possível registrar a decisão agora.'); }); }
      });
      save(); return;
    }
    try { localStorage.setItem(KEYINT, JSON.stringify(x)); } catch (e) { /* ignora */ } }
  function envioPor(id) { return integ().envios.filter(function (e) { return e.id === id; })[0]; }
  function semearInteg() { if (!S.envSeed) return; var x = integ(); S.envSeed.forEach(function (e) { if (!x.envios.some(function (y) { return y.id === e.id; })) x.envios.push(e); }); salvaInteg(x); delete S.envSeed; save(); }
  function clientePor(id) { return (S.clientes || []).filter(function (k) { return k.id === id; })[0] || { nome: 'Cliente', integ: 'externo' }; }
  var CAMPOS_CAND = ['n', 'fone', 'bairro', 'regime', 'turnos', 'km', 'exp', 'ultima', 'escolaridade', 'pretensao', 'inicio', 'fds', 'transporte', 'reqs', 'sit1', 'nota', 'parecer'];
  function resumoCand(c) { var o = {}; CAMPOS_CAND.forEach(function (k) { if (c[k] !== undefined && c[k] !== '') o[k] = c[k]; }); return o; } // só o necessário para a validação (LGPD, art. 6º, III)
  function estrelas(n) { n = Math.max(0, Math.min(5, +n || 0)); return '<span class="stars" aria-label="Nota ' + n + ' de 5">' + '★★★★★'.slice(0, n) + '<span class="faint">' + '★★★★★'.slice(0, 5 - n) + '</span></span>'; }
  function etapaRS(c, i, m) {
    var e = c.envio ? envioPor(c.envio) : null;
    if (c.etapa === 'enviado') { var st = e ? e.status : 'enviado'; return st === 'aprovado' ? pill('ok', 'Aprovado pelo cliente') + '<span class="sub">vai para a admissão do cliente</span>' : st === 'recusado' ? pill('bad', 'Recusado pelo cliente') + (e.motivo ? '<span class="sub">' + esc(e.motivo) + '</span>' : '') : pill('warn', 'Aguardando o cliente') + '<span class="sub">enviado em ' + esc(e ? e.em : '') + '</span>'; }
    if (c.etapa === 'externo') return c.decisao ? pill(c.decisao === 'aprovado' ? 'ok' : 'bad', c.decisao === 'aprovado' ? 'Aprovado pelo cliente' : 'Recusado pelo cliente') : pill('warn', 'Pasta enviada ao cliente') + ' <button type="button" class="btn btn-sm" data-act="rs-dec" data-i="' + i + '" data-v="aprovado">Cliente aprovou</button> <button type="button" class="btn btn-sm" data-act="rs-dec" data-i="' + i + '" data-v="recusado">Recusou</button>';
    if (c.etapa === 'curta') return pill('ok', 'Lista curta') + (c.compartilhar === false ? ' ' + pill('bad', 'Sem autorização para compartilhar') : '') + ' <button type="button" class="link-btn" data-act="rs-tirar" data-i="' + i + '">Tirar</button>';
    if (c.etapa === 'entrevistado') return estrelas(c.nota) + ' <button type="button" class="btn btn-sm btn-primary" data-act="rs-curta" data-i="' + i + '">Lista curta</button> <button type="button" class="btn btn-sm" data-act="rs-nao" data-i="' + i + '">Não seguir</button>';
    if (c.etapa === 'entrevista') return pill('warn', 'Entrevista ' + c.entrevistaEm) + ' <button type="button" class="btn btn-sm btn-primary" data-act="rs-parecer" data-i="' + i + '">Registrar parecer</button>';
    if (c.etapa === 'naoseguir') return pill('mute', 'Não seguiu') + (c.parecer ? '<span class="sub">' + esc(c.parecer) + '</span>' : '');
    if (m) return '<span class="ui-sub">Descartado na triagem</span>';
    return '<button type="button" class="btn btn-sm" data-act="ent-modal" data-i="' + i + '">Chamar para entrevista</button>';
  }
  function vSelecao() {
    if (!S.agencia) { location.hash = '#/vagas'; return ''; }
    var g = vagaAtual() || S.vagas[0], k = g.crit, cl = clientePor(g.cliente), ok = cl.integ === 'centralizar';
    var tabs = S.vagas.map(function (v) { return '<button type="button" role="tab" aria-selected="' + (v.id === g.id) + '" data-act="vaga" data-id="' + v.id + '">' + esc(v.titulo) + ' · ' + esc(clientePor(v.cliente).nome) + '</button>'; }).join('');
    var aptos = 0, rows = g.cands.map(function (c, i) {
      var m = avalia(c, k); if (!m) aptos++;
      return '<tr><td><strong>' + esc(c.n) + '</strong>' + (c.novo ? ' ' + pill('warn', 'Novo') : '') + '<span class="sub">' + esc(c.fone) + ' · <button type="button" class="link-btn" data-act="cand-ver" data-i="' + i + '">Ver respostas</button></span>' + '<span class="sub">' + esc(REG[c.regime]) + ' · ' + c.turnos.map(function (t) { return esc(TUR[t]); }).join(', ') + ' · ' + c.km + ' km</span>' + (c.parecer && c.etapa !== 'naoseguir' ? '<span class="sub">' + esc(c.parecer) + '</span>' : '') + '</td><td class="num hide-sm">' + c.exp + (c.exp === 1 ? ' ano' : ' anos') + '</td><td>' + (m ? pill('mute', m) : pill('ok', 'Passou')) + '</td><td>' + etapaRS(c, i, m) + '</td></tr>';
    }).join('');
    var conta = function (et) { return g.cands.filter(function (c) { return et.indexOf(c.etapa) > -1; }).length; };
    var curta = g.cands.filter(function (c) { return c.etapa === 'curta'; }), podem = curta.filter(function (c) { return c.compartilhar !== false; });
    var aprov = g.cands.filter(function (c) { var e = c.envio && envioPor(c.envio); return (e && e.status === 'aprovado') || c.decisao === 'aprovado'; }).length;
    var kpi = function (l, v, cap) { return '<div class="kpi"><div class="lbl">' + l + '</div><div class="val num">' + v + '</div><div class="cap">' + cap + '</div></div>'; };
    var funil = '<div class="card kpis kpis-5">' + kpi('Inscritos', g.cands.length, 'pela pré-entrevista') + kpi('Passaram na triagem', aptos, 'pelos critérios do cliente') + kpi('Entrevistados', conta(['entrevistado', 'curta', 'enviado', 'externo', 'naoseguir']), 'com parecer da agência') + kpi('Encaminhados', conta(['enviado', 'externo']), 'para validação do cliente') + kpi('Aprovados', aprov + ' de ' + g.qtd, 'vagas preenchidas') + '</div>';
    var seg = ['clt', 'free', 'temp', 'qualquer'].map(function (r) { return '<button type="button" data-act="crit-reg" data-v="' + r + '" aria-pressed="' + (k.regime === r) + '">' + REG[r] + '</button>'; }).join('');
    var chips = Object.keys(TUR).map(function (t) { return '<button type="button" class="chip" data-act="crit-tur" data-v="' + t + '" aria-pressed="' + (k.turnos.indexOf(t) > -1) + '">' + TUR[t] + '</button>'; }).join('');
    var exps = [0, 1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (k.exp === n ? ' selected' : '') + '>' + (n ? 'Pelo menos ' + n + (n === 1 ? ' ano' : ' anos') : 'Sem exigência') + '</option>'; }).join('');
    var cliCard = '<div class="card card-pad stack"><h2 class="sec">Cliente</h2><p><strong>' + esc(cl.nome) + '</strong><span class="sub">' + esc(cl.cidade || '') + ' · ' + esc(cl.contato || '') + '</span></p>' +
      (ok ? '<div class="notice info"><div><strong>Integrado ao Seu Comando · ' + esc(cl.codigo) + '</strong>Os candidatos encaminhados caem em Vagas, no painel do cliente, para aprovar ou recusar. A decisão volta para cá.</div></div>' : '<div class="notice"><div><strong>Cliente externo</strong>Sem o sistema: a lista curta sai numa pasta (.zip) com dossiê em PDF, planilha e arquivo de dados que outra empresa com o Seu Comando importa.</div></div>') +
      '<a class="link-btn" href="#/clientes">Ver todos os clientes</a></div>';
    var crit = '<div class="card card-pad stack"><h2 class="sec">Critérios do cliente para a triagem</h2><div class="field"><span class="lbl-s">Regime da vaga</span><div class="seg">' + seg + '</div></div><div class="field"><span class="lbl-s">Turnos obrigatórios</span><div class="chips">' + chips + '</div></div>' +
      '<div class="field"><label for="km">Distância máxima: <strong>' + k.km + ' km</strong></label><input id="km" type="range" min="1" max="30" value="' + k.km + '" data-in="crit-km"></div><div class="field"><label for="exp">Experiência na função</label><select id="exp" data-in="crit-exp">' + exps + '</select></div></div>';
    var acao = '<div class="card card-pad stack"><h2 class="sec">Lista curta · ' + curta.length + '</h2>' + (curta.length ? '<ul class="list">' + curta.map(function (c) { return '<li><span>' + esc(c.n) + '<span class="sub">' + (c.compartilhar === false ? 'não autorizou compartilhar: não segue para o cliente' : 'nota ' + (c.nota || '–') + ' de 5') + '</span></span>' + estrelas(c.nota) + '</li>'; }).join('') + '</ul>' : '<p class="ui-sub">Entreviste e marque quem vai para a lista curta.</p>') +
      '<button type="button" class="btn btn-primary" data-act="rs-enviar"' + (podem.length ? '' : ' disabled') + '>' + (ok ? 'Encaminhar ' + podem.length + ' para o painel do cliente' : 'Gerar pasta para o cliente (' + podem.length + ')') + '</button>' +
      (ok ? '' : '<button type="button" class="btn" data-act="rs-dossie"' + (podem.length ? '' : ' disabled') + '>Só o dossiê em PDF</button>') + '</div>';
    var link = 'triagem.html?vaga=' + esc(g.id) + (NUVEM ? '&amp;e=' + esc(S.empresa.codigo || '') : '&amp;t=' + esc(S.tipo || ''));
    return titleRow('Processos seletivos', esc(g.titulo) + ' para ' + esc(cl.nome) + ' · ' + g.qtd + (g.qtd === 1 ? ' vaga' : ' vagas') + ' · ' + esc(g.regimeOferta), '<a class="btn" href="' + link + '" target="_blank" rel="noopener">Ver como o candidato responde</a><button type="button" class="btn" data-act="rs-novo">Novo processo</button><button type="button" class="btn btn-primary" data-act="copiar-link">Copiar link da pré-entrevista</button>') +
      '<div class="tabs" role="tablist">' + tabs + '</div><div class="grid-main"><div class="stack">' + funil +
      '<div class="card"><div class="card-head"><h2>Candidatos</h2><span class="ui-sub">Triagem, entrevista, lista curta e validação do cliente</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>Candidato</th><th class="num hide-sm">Experiência</th><th>Triagem</th><th class="rs-etapa">Etapa</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="notice info"><div><strong>Como o processo anda</strong>A triagem descarta quem não atende aos critérios do cliente. A agência entrevista, registra nota e parecer e monta a lista curta. Só segue para o cliente quem autorizou o compartilhamento na pré-entrevista (LGPD, art. 7º, § 5º).</div></div></div>' +
      '<div class="stack">' + acao + cliCard + crit + '</div></div>';
  }
  function vClientes() {
    if (!S.agencia) { location.hash = '#/inicio'; return ''; }
    var lin = (S.clientes || []).map(function (k) {
      var procs = S.vagas.filter(function (v) { return v.cliente === k.id; });
      return '<li><span><strong>' + esc(k.nome) + '</strong> ' + (k.integ === 'centralizar' ? pill('ok', 'Integrado · ' + k.codigo) : pill('mute', 'Externo')) + '<span class="sub">' + esc(k.cidade || '') + ' · ' + esc(k.contato || '') + ' · ' + procs.length + (procs.length === 1 ? ' processo' : ' processos') + '</span></span>' +
        (k.integ === 'centralizar' ? '<a class="btn btn-sm" href="app.html?exemplo=1&amp;empresa=' + encodeURIComponent(k.nome) + '&amp;tipo=' + esc(tipoDoCodigo(k.codigo)) + '#/vagas">Abrir o painel do cliente (exemplo)</a>' : '') + '</li>';
    }).join('');
    var opts = Object.keys(window.CENTRALIZAR_TIPOS || {}).filter(function (t) { return t !== 'recrutamento'; }).map(function (t) { return '<option value="' + esc(window.CENTRALIZAR_CODIGO(t)) + '">' + esc(window.CENTRALIZAR_TIPOS[t]) + ' · ' + esc(window.CENTRALIZAR_CODIGO(t)) + '</option>'; }).join('');
    return titleRow('Empresas clientes', 'Para quem a agência recruta', '') +
      '<div class="grid-main"><div class="stack"><div class="card"><ul class="list">' + lin + '</ul></div>' +
      '<div class="notice info"><div><strong>Dois jeitos de entregar os candidatos</strong>Cliente com o Seu Comando: informe o código de conexão que aparece em Vagas, no painel dele; os candidatos chegam lá para validação e a resposta volta sozinha. Cliente externo: a agência gera uma pasta (.zip) com dossiê em PDF, planilha CSV e o arquivo de dados, e envia por e-mail ou WhatsApp.</div></div></div>' +
      '<div class="stack"><form class="card card-pad stack" data-form="cliente"><h2 class="sec">Novo cliente</h2><div class="field"><label for="kn">Empresa</label><input id="kn" name="n" maxlength="80" required></div><div class="field"><label for="kc">Contato</label><input id="kc" name="c" maxlength="80" placeholder="Nome e WhatsApp ou e-mail do RH"></div>' +
      '<div class="field"><label for="ki">Integração</label><select id="ki" name="i"><option value="externo">Externo (sem o sistema): pasta .zip</option><option value="centralizar">Usa o Seu Comando: enviar pelo código</option></select></div><div class="field"><label for="kk">Código de conexão (se usa o Seu Comando)</label><select id="kk" name="k"><option value="">Sem código</option>' + opts + '</select></div><button class="btn btn-primary" type="submit">Cadastrar cliente</button></form></div></div>';
  }
  function tipoDoCodigo(cod) { var t = ''; Object.keys(window.CENTRALIZAR_TIPOS || {}).forEach(function (x) { if (window.CENTRALIZAR_CODIGO(x) === cod) t = x; }); return t; }
  function recebidosHTML() {
    if (S.agencia) return '';
    var ev = integ().envios.filter(function (e) { return e.para === S.empresa.codigo; });
    var li = ev.map(function (e) {
      var c = e.cand || {}, st = e.status === 'aprovado' ? pill('ok', 'Aprovado') : e.status === 'recusado' ? pill('bad', 'Recusado') : pill('warn', 'Aguardando você');
      return '<li><span><strong>' + esc(c.n) + '</strong> ' + st + '<span class="sub">' + esc(e.titulo) + ' · indicado por ' + esc(e.de) + (e.origem === 'arquivo' ? ' (pasta importada)' : '') + ' · nota ' + esc(c.nota || '–') + ' de 5</span>' + (c.parecer ? '<span class="sub">' + esc(c.parecer) + '</span>' : '') + '</span><span class="actions"><button type="button" class="btn btn-sm" data-act="rec-ver" data-id="' + esc(e.id) + '">Ver perfil</button>' +
        (e.status === 'enviado' ? '<button type="button" class="btn btn-sm btn-primary" data-act="rec-ok" data-id="' + esc(e.id) + '">Aprovar para admissão</button><button type="button" class="btn btn-sm" data-act="rec-nao" data-id="' + esc(e.id) + '">Recusar</button>' : '') + '</span></li>';
    }).join('');
    return '<div class="card"><div class="card-head"><h2>Recebidos de recrutadoras</h2><span class="ui-sub">Código de conexão desta empresa: <strong>' + esc(S.empresa.codigo || '') + '</strong></span></div>' +
      (ev.length ? '<ul class="list">' + li + '</ul>' : '<p class="card-pad ui-sub">Nenhum candidato recebido. Passe o código acima para a recrutadora ou importe a pasta que ela enviou.</p>') +
      '<div class="card-pad"><label class="btn btn-sm file-btn">Importar pasta da recrutadora (arquivo .json)<input type="file" accept=".json,application/json" data-in="rec-import" class="sr-only"></label></div></div>';
  }
  // Pasta para cliente externo: ZIP sem compressão (dossiê PDF, planilha CSV, dados JSON e LEIA-ME)
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipar(arqs) {
    var enc = new TextEncoder(), partes = [], central = [], pos = 0;
    var d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5);
    function cab(sig, len) { var b = new DataView(new ArrayBuffer(len)); b.setUint32(0, sig, true); return b; }
    arqs.forEach(function (a) {
      var nome = enc.encode(a.nome), dados = a.dados, crc = crc32(dados);
      var l = cab(0x04034b50, 30); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(8, 0, true); l.setUint16(10, tm, true); l.setUint16(12, dt, true); l.setUint32(14, crc, true); l.setUint32(18, dados.length, true); l.setUint32(22, dados.length, true); l.setUint16(26, nome.length, true); l.setUint16(28, 0, true);
      partes.push(l.buffer, nome, dados);
      var c = cab(0x02014b50, 46); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true); c.setUint16(28, nome.length, true); c.setUint32(42, pos, true);
      central.push(c.buffer, nome); pos += 30 + nome.length + dados.length;
    });
    var tamC = central.reduce(function (s, x) { return s + (x.byteLength || x.length); }, 0);
    var f = cab(0x06054b50, 22); f.setUint16(8, arqs.length, true); f.setUint16(10, arqs.length, true); f.setUint32(12, tamC, true); f.setUint32(16, pos, true);
    return new Blob(partes.concat(central, [f.buffer]), { type: 'application/zip' });
  }
  function celulaCSV(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; } // evita fórmula na planilha
  function dossieHTML(g, lista) {
    var cl = clientePor(g.cliente), cg = cargoPor(g.cargo), R = window.CENTRALIZAR_ROTULOS || {};
    var disp = function (c) { return [REG[c.regime], (c.turnos || []).map(function (t) { return TUR[t]; }).join(', '), (R.inicio || {})[c.inicio]].filter(Boolean).join(' · '); };
    return '<div class="paper"><h3>Dossiê de candidatos</h3><p class="center">' + esc(S.empresa.nome) + ' para ' + esc(cl.nome) + ' · ' + dmyy(S.hoje) + '</p>' +
      '<p><strong>Vaga:</strong> ' + esc(g.titulo) + ' (CBO ' + esc(cg.cbo) + ', ' + esc(cg.cboNome) + ') · ' + esc(g.regimeOferta) + ' · ' + g.qtd + (g.qtd === 1 ? ' vaga' : ' vagas') + '. <strong>Inscritos:</strong> ' + g.cands.length + '. <strong>Apresentados:</strong> ' + lista.length + '.</p>' +
      '<table class="t"><thead><tr><th>Candidato</th><th>Experiência</th><th>Disponibilidade</th><th class="num">Nota</th></tr></thead><tbody>' + lista.map(function (c) { return '<tr><td>' + esc(c.n) + '</td><td>' + c.exp + (c.exp === 1 ? ' ano' : ' anos') + '</td><td>' + esc(disp(c)) + '</td><td class="num">' + esc(c.nota || '–') + '/5</td></tr>'; }).join('') + '</tbody></table>' +
      lista.map(function (c) {
        return '<section class="cl"><h4>' + esc(c.n) + ' · nota ' + esc(c.nota || '–') + ' de 5</h4><p><strong>Parecer da entrevista:</strong> ' + esc(c.parecer || 'sem parecer') + '</p><p><strong>Contato:</strong> ' + esc(c.fone) + ' · <strong>Bairro:</strong> ' + esc(c.bairro || '') + ' · <strong>Disponibilidade:</strong> ' + esc(disp(c)) + ' · <strong>Distância:</strong> ' + c.km + ' km · <strong>Escolaridade:</strong> ' + esc((R.escolaridade || {})[c.escolaridade] || '') + ' · <strong>Pretensão:</strong> ' + esc((R.pretensao || {})[c.pretensao] || '') + (c.ultima ? ' · <strong>Última experiência:</strong> ' + esc(c.ultima) : '') + '</p></section>';
      }).join('') +
      '<p class="ui-sub">Dados compartilhados com autorização específica de cada candidato, só para esta vaga (LGPD, art. 7º, § 5º). Não repasse a terceiros e elimine os dados de quem não for contratado ao fim do processo. A seleção não usou critérios de sexo, idade, estado civil, gravidez, cor, origem ou deficiência (Lei 9.029/95).</p></div>';
  }
  function folhaDe(html) { var el = doc.createElement('div'); el.className = 'sheet-a4'; el.innerHTML = html; return el; }
  function gerarPasta(g, lista, soPDF) {
    var cl = clientePor(g.cliente), base = String('Candidatos ' + g.titulo.replace(/\((a|as|o|os)\)/g, '') + ' ' + cl.nome).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w ]/g, ' ').replace(/\s+/g, ' ').trim();
    var marcar = function () { lista.forEach(function (c) { c.etapa = 'externo'; c.pastaEm = agora(); }); save(); render(); };
    toast('Gerando o dossiê em PDF…');
    return gerarPDF(folhaDe(dossieHTML(g, lista))).then(function (pdf) {
      if (soPDF) return salvarArquivo('Dossie ' + base + '.pdf', pdf).then(marcar);
      return pdf.arrayBuffer().then(function (buf) {
        var enc = new TextEncoder(), R = window.CENTRALIZAR_ROTULOS || {};
        var csv = '﻿' + ['Nome;WhatsApp;Bairro;Contratação;Turnos;Experiência (anos);Escolaridade;Pretensão;Pode começar;Nota;Parecer'].concat(lista.map(function (c) { return [c.n, c.fone, c.bairro, REG[c.regime], (c.turnos || []).map(function (t) { return TUR[t]; }).join(', '), c.exp, (R.escolaridade || {})[c.escolaridade], (R.pretensao || {})[c.pretensao], (R.inicio || {})[c.inicio], c.nota, c.parecer].map(celulaCSV).join(';'); })).join('\r\n');
        var json = JSON.stringify({ formato: 'seucomando-candidatos', versao: 1, de: S.empresa.nome, gerado: S.hoje, vaga: { titulo: g.titulo, cargo: g.cargo, salario: g.salario, regimeOferta: g.regimeOferta }, candidatos: lista.map(resumoCand) }, null, 2);
        var leia = 'Pasta de candidatos enviada por ' + S.empresa.nome + ' para ' + cl.nome + ' em ' + dmyy(S.hoje) + '.\r\n\r\n- Dossie (PDF): resumo e parecer de cada candidato.\r\n- candidatos.csv: abre no Excel ou no Google Planilhas.\r\n- candidatos.seucomando.json: quem usa o Seu Comando importa em Vagas > Recebidos de recrutadoras.\r\n\r\nLGPD: os candidatos autorizaram o compartilhamento só para esta vaga (art. 7º, § 5º). Não repasse a terceiros e apague os dados de quem não for contratado.\r\n';
        var zip = zipar([{ nome: 'Dossie ' + base + '.pdf', dados: new Uint8Array(buf) }, { nome: 'candidatos.csv', dados: enc.encode(csv) }, { nome: 'candidatos.seucomando.json', dados: enc.encode(json) }, { nome: 'LEIA-ME.txt', dados: enc.encode(leia) }]);
        return salvarArquivo(base + '.zip', zip).then(marcar);
      });
    }, function () { toast('Não foi possível gerar o dossiê.'); });
  }

  /* ---------- Boas práticas de alimentos (adicional) ---------- */
  var LIMT = {
    frio: { r: 'abaixo de 5 °C', ok: function (v) { return v < 5; }, base: 'RDC 216, item 4.8.16' },
    congelado: { r: '-18 °C ou menos', ok: function (v) { return v <= -18; }, base: 'RDC 216, item 4.8.16' },
    quente: { r: 'acima de 60 °C (até 6 horas)', ok: function (v) { return v > 60; }, base: 'RDC 216, item 4.8.15' },
    oleo: { r: 'até 180 °C', ok: function (v) { return v <= 180; }, base: 'RDC 216, item 4.8.11' }
  };
  function addMonths(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); }
  function equipPor(id) { return (S.bp.equip.filter(function (e) { return e.id === id; })[0]) || { nome: id, tipo: 'frio' }; }
  function tempOk(r) { var e = equipPor(r.eq); return (LIMT[e.tipo] || LIMT.frio).ok(r.t); }
  function fmtT(v) { return String(v).replace('.', ',') + ' °C'; }
  function statusDoc(d) {
    if (!d.venc && d.meses && !d.ult) return ['warn', 'Não informado', ''];
    var prox = d.venc || (d.meses ? addMonths(d.ult, d.meses) : ''); if (!prox) return ['ok', 'Em dia', ''];
    var n = diffDays(S.hoje, prox);
    return n < 0 ? ['bad', 'Vencido', prox] : n <= 15 ? ['warn', 'Vence em ' + n + (n === 1 ? ' dia' : ' dias'), prox] : ['ok', 'Em dia', prox];
  }
  var CURTO = { higiene: 'Higiene', contaminacao: 'Contaminação', temperaturas: 'Temperaturas', recebimento: 'Recebimento', higienizacao: 'Limpeza', alergenicos: 'Alergênicos', seguranca: 'Segurança' };
  function CURSOS() { return window.CENTRALIZAR_CURSOS || []; }
  function cursoPor(id) { return CURSOS().filter(function (c) { return c.id === id; })[0]; }
  function treino(pid, cid) { var t = (S.treinos || {})[pid]; t = t && t[cid]; if (!t) return null; var vence = addMonths(t.em, window.CENTRALIZAR_CURSO_VALIDADE_MESES || 12); return { nota: t.nota, em: t.em, vence: vence, vencido: diffDays(S.hoje, vence) < 0 }; }
  function manipuladores() { return S.pessoas.filter(function (p) { return ['Entregas', 'Caixa', 'Gestão'].indexOf(p.setor) < 0 || p.id === 'e9'; }); }
  function treinadoBase(p) { return (window.CENTRALIZAR_CURSOS_BASE || []).every(function (c) { var t = treino(p.id, c); return t && !t.vencido; }); }
  function quemRegistrou(id) { if (!id) return 'Gestão'; var p = S.pessoas.filter(function (x) { return x.id === id; })[0]; return p ? p.nome.split(' ')[0] : 'Gestão'; }
  function vBoas() {
    if (!S.bp) return titleRow('Boas práticas de alimentos', 'Adicional para serviços de alimentação', '') + '<div class="notice info"><div><strong>Disponível para restaurante, lanchonete, padaria e hamburgueria</strong>Escolha um desses tipos de negócio na abertura do painel.</div></div>';
    var emp = S.role === 'empresa', bp = S.bp;
    var hoje = bp.temps.filter(function (r) { return r.data === S.hoje; }).sort(function (a, b) { return a.hora < b.hora ? 1 : -1; });
    var fora = hoje.filter(function (r) { return !tempOk(r); }).length;
    var docsAlerta = bp.docs.filter(function (d) { return statusDoc(d)[0] !== 'ok'; }).length;
    var mani = manipuladores(), trein = mani.filter(treinadoBase).length;
    var vencendo = S.produtos.filter(function (p) { return p.validade && diffDays(S.hoje, p.validade) <= 2; });
    var kpi = function (l, v, cap) { return '<div class="kpi"><div class="lbl">' + l + '</div><div class="val num">' + v + '</div><div class="cap">' + cap + '</div></div>'; };
    var acoes = emp ? '<button type="button" class="btn" data-act="bp-planilha">Planilha de temperaturas (PDF)</button>' : '';
    var topo = titleRow('Boas práticas de alimentos', (emp ? 'Adicional · R$ 49 por mês · ' : '') + 'Temperaturas, vigilância sanitária e capacitação ' + ajudaBtn('boas', 'O que a norma pede'), acoes);
    if (!bp.ativo) return topo + '<div class="card card-pad stack"><h2 class="sec">Adicional para serviços de alimentação</h2><p>Planilha de temperaturas, prazos da vigilância sanitária e mini cursos com certificado para a equipe.</p><div><button type="button" class="btn btn-primary" data-act="bp-ativo">Ativar teste de 14 dias</button></div></div>';
    var opts = bp.equip.map(function (e) { return '<option value="' + e.id + '">' + esc(e.nome) + ' · ' + esc((LIMT[e.tipo] || LIMT.frio).r) + '</option>'; }).join('');
    var TIPO_EQ = { frio: 'Refrigerado (geladeira, câmara fria)', congelado: 'Congelado (freezer)', quente: 'Quente (estufa, banho-maria)', oleo: 'Óleo de fritura' };
    var MOD_EQ = [['Geladeira', 'frio'], ['Câmara fria', 'frio'], ['Freezer', 'congelado'], ['Estufa', 'quente'], ['Fritadeira', 'oleo']];
    var equipCard = emp ? '<div class="card card-pad stack"><h2 class="sec">Equipamentos</h2>' + (bp.equip.length ? '<ul class="list">' + bp.equip.map(function (e) { return '<li><span>' + esc(e.nome) + '<span class="sub">' + esc((LIMT[e.tipo] || LIMT.frio).r) + '</span></span><button type="button" class="btn btn-sm" data-act="bp-eq-del" data-id="' + esc(e.id) + '">Remover</button></li>'; }).join('') + '</ul>' : '<p class="ui-sub">Cadastre os equipamentos que precisam de controle de temperatura.</p>') +
      '<div class="chips">' + MOD_EQ.map(function (m) { return '<button type="button" class="chip" data-act="bp-eq-mod" data-n="' + esc(m[0]) + '" data-t="' + m[1] + '">+ ' + esc(m[0]) + '</button>'; }).join('') + '</div>' +
      '<form class="stack" data-form="bp-eq"><div class="form-grid"><div class="field"><label for="beq-n">Nome do equipamento</label><input id="beq-n" name="n" maxlength="60" required placeholder="Ex.: Geladeira da cozinha"></div><div class="field"><label for="beq-t">Tipo</label><select id="beq-t" name="t">' + Object.keys(TIPO_EQ).map(function (k) { return '<option value="' + k + '">' + esc(TIPO_EQ[k]) + '</option>'; }).join('') + '</select></div></div><div><button type="submit" class="btn">Adicionar equipamento</button></div></form></div>' : '';
    if (!bp.equip.length) return topo + '<div class="grid-main"><div class="stack">' + (emp ? equipCard : '<div class="notice"><div><strong>Nenhum equipamento cadastrado</strong>A empresa cadastra a geladeira, o freezer e a estufa; depois você registra as temperaturas aqui.</div></div>') + '</div><div class="stack"></div></div>';
    var form = '<div class="card card-pad stack"><h2 class="sec">Registrar temperatura</h2><form class="stack" data-form="temp"><div class="form-grid"><div class="field"><label for="bt-eq">Equipamento</label><select id="bt-eq" name="eq">' + opts + '</select></div>' +
      '<div class="field"><label for="bt-t">Temperatura (°C)</label><input id="bt-t" name="t" inputmode="decimal" maxlength="6" placeholder="Ex.: 3,5" required></div></div>' +
      '<div class="field"><label for="bt-a">Ação corretiva (obrigatória se estiver fora da faixa)</label><input id="bt-a" name="a" maxlength="140" placeholder="Ex.: porta ajustada; produtos transferidos para a câmara"></div>' +
      '<div><button type="submit" class="btn btn-primary">Registrar</button></div></form>' +
      '<div class="table-box"><table class="t"><thead><tr><th>Hora</th><th>Equipamento</th><th class="num">Temperatura</th><th>Situação</th><th class="hide-sm">Por</th></tr></thead><tbody>' +
      (hoje.length ? hoje.map(function (r) { var ok = tempOk(r); return '<tr><td class="num">' + esc(r.hora) + '</td><td>' + esc(equipPor(r.eq).nome) + (r.acao ? '<span class="sub">Ação: ' + esc(r.acao) + '</span>' : '') + '</td><td class="num">' + esc(fmtT(r.t)) + '</td><td>' + (ok ? pill('ok', 'Na faixa') : pill('bad', 'Fora da faixa')) + '</td><td class="hide-sm">' + esc(quemRegistrou(r.por)) + '</td></tr>'; }).join('') : '<tr><td colspan="5">Nenhum registro hoje.</td></tr>') +
      '</tbody></table></div></div>';
    var docs = emp ? '<div class="card"><div class="card-head"><h2>Documentos e prazos da vigilância sanitária</h2><span class="ui-sub">O que a fiscalização pede para ver</span></div><ul class="list">' + bp.docs.map(function (d) {
      var st = statusDoc(d), resp = d.resp ? ' · ' + esc(quemRegistrou(d.resp)) : '';
      return '<li><span><strong>' + esc(d.nome) + '</strong>' + ' ' + pill(st[0], st[1]) + '<span class="sub">' + esc(d.base) + resp + (d.ult ? ' · último em ' + dmyy(d.ult) : '') + (st[2] ? ' · próximo até ' + dmyy(st[2]) : '') + (d.nota ? ' · ' + esc(d.nota) : '') + '</span></span>' + (d.meses ? '<button type="button" class="btn btn-sm" data-act="bp-feito" data-id="' + d.id + '">Feito hoje</button>' : '') + '</li>';
    }).join('') + '</ul></div>' : '';
    var regras = '<div class="card card-pad stack"><h2 class="sec">Faixas seguras</h2><ul class="list">' +
      [['Cocção', 'pelo menos 70 °C em todas as partes', '4.8.8'], ['Quente para servir', 'acima de 60 °C por até 6 horas', '4.8.15'], ['Resfriamento', 'de 60 °C a 10 °C em até 2 horas', '4.8.16'], ['Refrigerado', 'abaixo de 5 °C', '4.8.16'], ['Congelado', '-18 °C ou menos', '4.8.16'], ['Pronto refrigerado a 4 °C', 'até 5 dias', '4.8.17'], ['Óleo de fritura', 'até 180 °C', '4.8.11']]
        .map(function (r) { return '<li><span>' + r[0] + '<span class="sub">RDC 216/2004, item ' + r[2] + '</span></span><strong>' + r[1] + '</strong></li>'; }).join('') + '</ul></div>';
    var val = '<div class="card card-pad stack"><h2 class="sec">Validade nos próximos 2 dias</h2>' + (vencendo.length ? '<ul class="list">' + vencendo.map(function (p) { var n = diffDays(S.hoje, p.validade); return '<li><span>' + esc(p.nome) + '<span class="sub">lote ' + esc(p.lote || '') + '</span></span>' + pill(n < 0 ? 'bad' : 'warn', n < 0 ? 'Vencido' : n === 0 ? 'Vence hoje' : 'Vence em ' + n + (n === 1 ? ' dia' : ' dias')) + '</li>'; }).join('') + '</ul>' : '<p class="ui-sub">Nada vencendo.</p>') + (emp ? '<a class="link-btn" href="#/estoque">Ver estoque e etiquetas</a>' : '') + '</div>';
    var cursos = '<div class="card card-pad stack"><h2 class="sec">Capacitação da equipe</h2><p class="ui-sub">Quem manipula alimentos precisa de capacitação periódica, com comprovante. Os mini cursos geram o certificado.</p>' +
      (emp ? '<p><strong>' + trein + ' de ' + mani.length + '</strong> manipuladores com os três cursos básicos em dia.</p>' : '') + '<a class="btn" href="#/cursos">' + (emp ? 'Abrir mini cursos' : 'Fazer meus cursos') + '</a></div>';
    var kpis = emp ? '<div class="card kpis">' + kpi('Temperaturas hoje', hoje.length, fora ? fora + ' fora da faixa' : 'todas na faixa') + kpi('Prazos sanitários', docsAlerta, docsAlerta ? 'vencendo ou vencidos' : 'tudo em dia') + kpi('Equipe treinada', trein + '/' + mani.length, 'cursos básicos em dia') + kpi('Validade', vencendo.length, 'produtos em até 2 dias') + '</div>' : '';
    var abasBp = [['temp', 'Temperaturas', fora ? fora + ' fora da faixa' : hoje.length || '', '<div class="grid-main"><div class="stack">' + form + '</div><div class="stack">' + regras + val + '</div></div>'], ['equip', 'Equipamentos', bp.equip.length || '', equipCard], ['docs', 'Vigilância sanitária', docsAlerta || '', docs], ['equipe', 'Capacitação', emp ? trein + ' de ' + mani.length : '', cursos]].filter(function (x) { return x[3]; });
    if (!S.ui.bpAba && emp && !bp.equip.length) S.ui.bpAba = 'equip';
    var aba = S.ui.bpAba || 'temp', sel = abasBp.filter(function (x) { return x[0] === aba; })[0] || abasBp[0]; void kpis;
    return topo + abas('bpAba', abasBp, sel[0]) + '<div class="aba-corpo">' + sel[3] + '</div>';
  }
  function planilhaHTML() {
    var dias = []; for (var i = 6; i >= 0; i--) dias.push(addDays(S.hoje, -i));
    var regs = S.bp.temps.filter(function (r) { return dias.indexOf(r.data) > -1; }).sort(function (a, b) { return (a.data + a.hora) < (b.data + b.hora) ? -1 : 1; });
    return '<div class="paper"><h3>Planilha de controle de temperaturas</h3><p class="center">' + esc(S.empresa.razao) + ' · ' + dmyy(dias[0]) + ' a ' + dmyy(S.hoje) + '</p>' +
      '<table class="t"><thead><tr><th>Equipamento</th><th>Faixa</th></tr></thead><tbody>' + S.bp.equip.map(function (e) { var l = LIMT[e.tipo] || LIMT.frio; return '<tr><td>' + esc(e.nome) + '</td><td>' + esc(l.r) + ' (' + esc(l.base) + ')</td></tr>'; }).join('') + '</tbody></table>' +
      '<table class="t"><thead><tr><th>Data</th><th>Hora</th><th>Equipamento</th><th class="num">Temp.</th><th>Situação e ação corretiva</th><th>Por</th></tr></thead><tbody>' +
      regs.map(function (r) { var ok = tempOk(r); return '<tr><td>' + dmy(r.data) + '</td><td>' + esc(r.hora) + '</td><td>' + esc(equipPor(r.eq).nome) + '</td><td class="num">' + esc(fmtT(r.t)) + '</td><td>' + (ok ? 'Na faixa' : '<strong>Fora da faixa.</strong> ' + esc(r.acao || '')) + '</td><td>' + esc(quemRegistrou(r.por)) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<p class="ui-sub">Registros feitos no aplicativo, com data e hora. A temperatura dos equipamentos de conservação e exposição deve ser monitorada regularmente (RDC Anvisa 216/2004, itens 4.8.15 a 4.8.17 e 4.10.3).</p>' +
      '<div class="sig"><span>' + esc(quemRegistrou('e9') === 'Gestão' ? '' : S.pessoas.filter(function (p) { return p.id === 'e9'; })[0].nome) + '<br>Responsável pelas atividades de manipulação</span><span>Data da conferência</span></div></div>';
  }

  /* ---------- Mini cursos ---------- */
  function certHTML(pid, cid) {
    var p = S.pessoas.filter(function (x) { return x.id === pid; })[0], c = cursoPor(cid), t = treino(pid, cid), r = S.pessoas.filter(function (x) { return x.id === 'e9'; })[0];
    if (!p || !c || !t) return '';
    return '<div class="paper cert"><p class="cert-k">Certificado de capacitação</p><h3>' + esc(p.nome) + '</h3>' +
      '<p class="center">concluiu o mini curso <strong>' + esc(c.titulo) + '</strong>, com duração de ' + c.min + ' minutos e aproveitamento de ' + t.nota + '% no teste, em ' + dmyy(t.em) + '.</p>' +
      '<p><strong>Conteúdo:</strong> ' + c.aulas.map(function (a) { return esc(a[0]); }).join('; ') + '.</p><p><strong>Base:</strong> ' + esc(c.base) + '.</p>' +
      '<p class="ui-sub">Registro de capacitação de manipuladores de alimentos (RDC Anvisa 216/2004, item 4.6.7), emitido por ' + esc(S.empresa.razao) + ', CNPJ ' + esc(S.empresa.cnpj) + '. Reciclagem sugerida até ' + dmyy(t.vence) + '. Não substitui o curso do responsável pelas atividades de manipulação (item 4.12.2) nem exigências da vigilância sanitária do município.</p>' +
      '<div class="sig"><span>' + esc(p.nome) + '<br>Participante</span><span>' + esc(r ? r.nome : '') + '<br>Responsável pelas atividades de manipulação</span></div></div>';
  }
  function vCursos() {
    var emp = S.role === 'empresa', u = S.ui, c = u.curso && cursoPor(u.curso);
    if (c) {
      var n = c.aulas.length, i = Math.min(u.aula || 0, n), corpo;
      if (u.cursoRes) {
        var rs = u.cursoRes;
        corpo = '<div class="card card-pad stack"><h2 class="sec">' + (rs.ok ? 'Aprovado(a)! ' : 'Quase lá. ') + rs.acertos + ' de ' + rs.total + ' acertos</h2>' +
          (rs.ok ? (emp ? '<p>Na visão da empresa o resultado não é registrado. Peça para o funcionário fazer pelo app.</p>' : '<p>Seu certificado já está no seu cadastro.</p><div><button type="button" class="btn btn-primary" data-act="cert" data-p="' + ME + '" data-c="' + c.id + '">Ver certificado</button></div>') : '<p>Para aprovar são 3 acertos de 4. Reveja as aulas e tente de novo.</p><div><button type="button" class="btn btn-primary" data-act="curso-aula" data-v="0">Rever as aulas</button></div>') +
          rs.erros.map(function (e) { return '<div class="notice"><div><strong>' + esc(e[0]) + '</strong>Resposta certa: ' + esc(e[1]) + '</div></div>'; }).join('') + '<div><button type="button" class="btn" data-act="curso-sair">Voltar aos cursos</button></div></div>';
      } else if (i < n) {
        corpo = '<div class="card card-pad stack curso-aula"><p class="ui-sub">Aula ' + (i + 1) + ' de ' + n + '</p><h2 class="sec">' + esc(c.aulas[i][0]) + '</h2><p class="curso-txt">' + esc(c.aulas[i][1]) + '</p>' +
          '<div class="actions">' + (i ? '<button type="button" class="btn" data-act="curso-aula" data-v="' + (i - 1) + '">Voltar</button>' : '') + '<button type="button" class="btn btn-primary" data-act="curso-aula" data-v="' + (i + 1) + '">' + (i + 1 < n ? 'Próxima aula' : 'Fazer o teste') + '</button></div></div>';
      } else {
        corpo = '<form class="card card-pad stack" data-form="quiz"><h2 class="sec">Teste · 4 perguntas</h2>' + c.quiz.map(function (q, k) {
          return '<fieldset class="field cand-set"><legend>' + (k + 1) + '. ' + esc(q[0]) + '</legend>' + q[1].map(function (o, j) { return '<label class="check"><input type="radio" name="q' + k + '" value="' + j + '" required> ' + esc(o) + '</label>'; }).join('') + '</fieldset>';
        }).join('') + '<div class="actions"><button type="button" class="btn" data-act="curso-aula" data-v="' + (n - 1) + '">Voltar às aulas</button><button type="submit" class="btn btn-primary">Enviar respostas</button></div></form>';
      }
      return titleRow(c.titulo, c.min + ' minutos · ' + c.base, '<button type="button" class="btn" data-act="curso-sair">Sair do curso</button>') + '<div class="curso-wrap">' + corpo + '</div>';
    }
    var primeiro = !emp && CURSOS().filter(function (k) { return !treino(ME, k.id); })[0];
    var lista = CURSOS().map(function (k) {
      var t = !emp && treino(ME, k.id), base = (window.CENTRALIZAR_CURSOS_BASE || []).indexOf(k.id) > -1;
      return '<li><span><strong>' + esc(k.titulo) + '</strong>' + (base ? ' ' + pill('mute', 'Básico') : '') + '<span class="sub">' + k.min + ' min · ' + k.aulas.length + ' aulas e teste · ' + esc(k.base) + '</span></span><span class="actions">' +
        (t ? (t.vencido ? pill('warn', 'Refazer') : pill('ok', 'Feito em ' + dmy(t.em))) + ' <button type="button" class="btn btn-sm" data-act="cert" data-p="' + ME + '" data-c="' + k.id + '">Certificado</button>' : '') +
        '<button type="button" class="btn btn-sm' + (primeiro === k ? ' btn-primary' : '') + '" data-act="curso-abrir" data-c="' + k.id + '">' + (emp ? 'Ver como o funcionário' : t ? 'Refazer' : 'Começar') + '</button></span></li>';
    }).join('');
    if (!emp) return titleRow('Mini cursos', 'Aulas curtas com teste e certificado', '') + '<div class="card"><ul class="list">' + lista + '</ul></div>';
    var mani = manipuladores(), ok = mani.filter(treinadoBase).length, certs = 0;
    var head = '<tr><th>Pessoa</th>' + CURSOS().map(function (k) { return '<th class="center">' + esc(CURTO[k.id] || k.id) + '</th>'; }).join('') + '</tr>';
    var rows = S.pessoas.map(function (p) {
      return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao) + '</span></td>' + CURSOS().map(function (k) {
        var t = treino(p.id, k.id); if (t) certs++;
        return '<td class="center">' + (t ? '<button type="button" class="link-btn" data-act="cert" data-p="' + p.id + '" data-c="' + k.id + '" aria-label="Certificado de ' + esc(p.nome) + ' em ' + esc(k.titulo) + '">' + (t.vencido ? 'Refazer' : dmy(t.em)) + '</button>' : '<span class="faint">—</span>') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return titleRow('Mini cursos', 'Capacitação da equipe com teste e certificado (RDC 216/2004, item 4.6.7)', '<button type="button" class="btn btn-primary" data-act="cursos-lembrar">Lembrar quem falta pelo WhatsApp</button>') +
      '<div class="card kpis">' + '<div class="kpi"><div class="lbl">Cursos básicos em dia</div><div class="val num">' + ok + '/' + mani.length + '</div><div class="cap">manipuladores de alimentos</div></div>' + '<div class="kpi"><div class="lbl">Certificados</div><div class="val num">' + certs + '</div><div class="cap">emitidos na equipe</div></div>' + '<div class="kpi"><div class="lbl">Cursos</div><div class="val num">' + CURSOS().length + '</div><div class="cap">de 6 a 10 minutos cada</div></div></div>' +
      '<div class="card"><div class="card-head"><h2>Quem já fez</h2><span class="ui-sub">Clique na data para ver o certificado</span></div><div class="table-box"><table class="t cursos-t"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h2>Cursos disponíveis</h2><span class="ui-sub">O funcionário faz pelo celular, no app</span></div><ul class="list">' + lista + '</ul></div>' +
      '<div class="notice info"><div><strong>O que os cursos comprovam</strong>Os certificados registram a capacitação periódica dos manipuladores (RDC 216/2004, item 4.6.7). O curso do responsável pelas atividades de manipulação (item 4.12.2) e regras próprias do município continuam valendo.</div></div>';
  }

  /* ---------- Versão em funcionamento: arquivos, ponto com foto e local, turnos, empresa, documentos, holerites e modelos de contrato ---------- */
  // Arquivos: no modo conectado vão para o depósito privado do Supabase; no exemplo ficam só neste aparelho (IndexedDB).
  var ARQ_LOCAL = (function () {
    var dbp = null;
    function db() { if (!dbp) dbp = new Promise(function (ok, no) { try { var q = indexedDB.open('seucomando-arquivos', 1); q.onupgradeneeded = function () { q.result.createObjectStore('a'); }; q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); }; } catch (e) { no(e); } }); return dbp; }
    function tx(modo, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('a', modo), r = fn(t.objectStore('a')); t.oncomplete = function () { ok(r && r.result); }; t.onerror = function () { no(t.error); }; }); }); }
    return {
      enviar: function (path, blob) { return tx('readwrite', function (s) { return s.put(blob, path); }).then(function () { return path; }); },
      url: function (path) { return tx('readonly', function (s) { return s.get(path); }).then(function (b) { if (!b) throw new Error('Arquivo não encontrado neste aparelho.'); return URL.createObjectURL(b); }); },
      apagar: function (path) { return tx('readwrite', function (s) { return s.delete(path); }); }
    };
  })();
  function Arq() { return NUVEM ? Nuvem.arquivo : ARQ_LOCAL; }
  function rnd() { var a = new Uint8Array(6); window.crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function caminho(pessoa, area, ext) { return (NUVEM ? Nuvem.empresa : 'local') + '/' + String(pessoa).replace(/[^\w-]/g, '').slice(0, 40) + '/' + area + '/' + hojeISO() + '_' + rnd() + '.' + ext; }
  var TIPOS_ARQ = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' };
  function erroTxt(e) { return (e && e.message) || 'Não foi possível concluir. Verifique a internet e tente de novo.'; }
  // Fotos do celular têm vários MB: reduz para até 1600 px em JPEG antes de enviar.
  function prepararArquivo(file) {
    if (!file) return Promise.reject(new Error('Nenhum arquivo escolhido.'));
    if (!/^image\//.test(file.type)) {
      if (!TIPOS_ARQ[file.type]) return Promise.reject(new Error('Envie foto (JPG ou PNG), PDF ou Word.'));
      if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error('Arquivo maior que 10 MB.'));
      return Promise.resolve(file);
    }
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = doc.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { if (b) ok(b); else no(new Error('Não foi possível ler a foto.')); }, 'image/jpeg', 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); no(new Error('Formato de foto não aceito. Envie JPG ou PNG.')); };
      img.src = url;
    });
  }
  function enviarArquivo(file, pessoa, area) {
    return prepararArquivo(file).then(function (b) { return Arq().enviar(caminho(pessoa, area, TIPOS_ARQ[b.type] || 'bin'), b).then(function (path) { return { path: path, nome: String(file.name || 'arquivo').slice(0, 120) }; }); });
  }
  function abrirArquivo(path, titulo) {
    if (!path) return;
    modal(titulo || 'Arquivo', '<p class="ui-sub" id="arq-st">Carregando…</p><div class="arq-box" id="arq-box"></div>');
    Arq().url(path).then(function (url) {
      var box = $('#arq-box'), st = $('#arq-st'); if (!box) return; if (st) st.remove();
      box.innerHTML = /\.(jpe?g|png|webp)$/i.test(path) ? '<img src="' + esc(url) + '" alt="' + esc(titulo || 'Arquivo') + '"><a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Abrir em tamanho real</a>' : '<a class="btn btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener">Abrir o arquivo</a>';
    }, function (e) { var st = $('#arq-st'); if (st) st.textContent = 'Não foi possível abrir: ' + erroTxt(e); });
  }
  function quandoTxt(iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? String(iso) : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function hoje1() { var t = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: fusoEmp() }); return t.charAt(0).toUpperCase() + t.slice(1); }

  // Dados que, no modo conectado, ficam em tabelas próprias (não no documento da empresa).
  function carregarReais() {
    if (!NUVEM) return Promise.resolve();
    var nada = function () { return null; };
    return Promise.all([Nuvem.registros(addDays(hojeISO(), -45)).catch(nada), Nuvem.documentos().catch(nada), Nuvem.holeritesPdf().catch(nada), Nuvem.ajustes(addDays(hojeISO(), -45)).catch(nada), Nuvem.ckRegistros(addDays(hojeISO(), -95)).catch(nada), Nuvem.rostos().catch(nada)]).then(function (r) {
      var antes = JSON.stringify([S.registros, S.docsArq, S.holArq, S.ajustes, S.ckRegs, S.rostos]);
      if (r[0]) S.registros = r[0]; if (r[1]) S.docsArq = r[1]; if (r[2]) S.holArq = r[2]; if (r[3]) S.ajustes = r[3]; if (r[4]) S.ckRegs = r[4];
      if (r[5]) { var mr = {}; r[5].forEach(function (x) { mr[x.pessoa_id] = rostoDe(x); }); S.rostos = mr; }
      pontoHoje();
      return antes !== JSON.stringify([S.registros, S.docsArq, S.holArq, S.ajustes, S.ckRegs, S.rostos]);
    });
  }

  /* Ponto real */
  // Marcações: 0 entrada; 1 a 8 intervalos (ímpar = saída para o intervalo, par = volta); 9 saída.
  var SAIDA = 9;
  function nomeTipo(t, n) { t = +t; if (t === 0) return 'Entrada'; if (t === SAIDA) return 'Saída'; var k = Math.ceil(t / 2), q = n > 1 || k > 1 ? ' ' + k : ''; return (t % 2 ? 'Saída para o intervalo' : 'Volta do intervalo') + q; }
  function curtoTipo(t, n) { t = +t; if (t === 0) return 'Entrada'; if (t === SAIDA) return 'Saída'; var k = Math.ceil(t / 2), q = n > 1 || k > 1 ? ' ' + k : ''; return (t % 2 ? 'Saída int.' : 'Volta') + q; }
  function nIvs(pid) { return Math.min(4, ivsDe(jornadaDe(P(pid))).length); }
  function tipoNome(pid, t) { return nomeTipo(t, nIvs(pid)); }
  function sequenciaDe(pid) { var s = [0], n = nIvs(pid); for (var i = 1; i <= n * 2; i++) s.push(i); s.push(SAIDA); return s; }
  // Fuso horário: o da pessoa, se tiver; senão, o da empresa. O banco usa o mesmo para definir o dia da marcação.
  var FUSOS = [['America/Sao_Paulo', 'Horário de Brasília (UTC−3)', 'DF, SP, RJ, MG, ES, Sul, Nordeste, GO, TO, PA e AP'], ['America/Manaus', 'Horário do Amazonas (UTC−4)', 'AM, RR, RO, MT e MS'], ['America/Rio_Branco', 'Horário do Acre (UTC−5)', 'AC e sudoeste do AM'], ['America/Noronha', 'Fernando de Noronha (UTC−2)', 'ilhas do Atlântico']];
  function fusoOk(tz) { return FUSOS.some(function (f) { return f[0] === tz; }) ? tz : ''; }
  function fusoEmp() { return fusoOk(S.empresa && S.empresa.fuso) || 'America/Sao_Paulo'; }
  function fusoDe(p) { return fusoOk(p && p.fuso) || fusoEmp(); }
  function fusoNome(tz) { var f = FUSOS.filter(function (x) { return x[0] === tz; })[0]; return f ? f[1] : tz; }
  function fusoOpts(sel, comEmpresa) { return (comEmpresa ? '<option value="">Mesmo da empresa (' + esc(fusoNome(fusoEmp())) + ')</option>' : '') + FUSOS.map(function (f) { return '<option value="' + f[0] + '"' + (f[0] === sel ? ' selected' : '') + '>' + esc(f[1] + ' · ' + f[2]) + '</option>'; }).join(''); }
  function partesEm(tz, d) {
    var o = {}, n = d || new Date();
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(n).forEach(function (x) { o[x.type] = x.value; }); }
    catch (e) { o = { year: String(n.getFullYear()), month: ('0' + (n.getMonth() + 1)).slice(-2), day: ('0' + n.getDate()).slice(-2), hour: ('0' + n.getHours()).slice(-2), minute: ('0' + n.getMinutes()).slice(-2) }; }
    if (o.hour === '24') o.hour = '00'; return o;
  }
  function hojeEm(tz) { var o = partesEm(tz); return o.year + '-' + o.month + '-' + o.day; }
  function agoraEm(tz) { var o = partesEm(tz); return o.hour + ':' + o.minute; }
  function diaSemana(iso) { return new Date(iso + 'T12:00:00').getDay(); }
  // S.ponto guarda as horas do dia por tipo (0 a 9). O exemplo antigo tinha 4 posições (entrada, intervalo, volta, saída).
  function mk(pid) { var m = (S.ponto || {})[pid] || [], o = []; if (m.length === 4) m = [m[0], m[1], m[2], '', '', '', '', '', '', m[3]]; for (var i = 0; i <= SAIDA; i++) o.push(m[i] || ''); return o; }
  function cfgPonto() { var c = (S.empresa && S.empresa.ponto) || {}; return { foto: c.foto !== false || !!c.rosto, local: c.local !== false, bloquear: !!c.bloquear, raio: +c.raio || 200, lat: typeof c.lat === 'number' ? c.lat : null, lng: typeof c.lng === 'number' ? c.lng : null, rosto: !!c.rosto, rigor: ({ tolerante: 1, normal: 1, rigoroso: 1 })[c.rosto_rigor] ? c.rosto_rigor : 'normal', rostoBloq: c.rosto_bloquear !== false }; }
  function distM(a, b, c, d) { var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2); return Math.round(2 * 6371000 * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y))); }
  function fmtDist(m) { return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(m) + ' m'; }
  function hhmm(iso, tz) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: tz || fusoEmp() }); }
  function regsDe(pid, dia) { return (S.registros || []).filter(function (r) { return r.pessoa_id === pid && (!dia || r.dia === dia); }).sort(function (a, b) { return a.em < b.em ? -1 : 1; }); }
  // Turno que passa da meia-noite: as marcações seguintes ficam no dia em que a jornada começou, até 4 horas depois do fim previsto (no máximo 24 horas).
  function ocupados(pid, dia) { var o = {}; regsDe(pid, dia).forEach(function (r) { o[r.tipo] = 1; }); ajustesDe(pid, dia, 'aprovado').forEach(function (a) { o[a.tipo] = 1; }); return o; }
  function limiteJornada(p) { var j = jornadaDe(p), sp = j.s ? minJ(j.e, j.s) : 0; return (sp ? Math.min(1440, sp + 240) : 960) * 60e3; }
  function diaAberto(pid) {
    var p = P(pid), h = hojeEm(fusoDe(p)), o = addDays(h, -1); if (regsDe(pid, h).length) return h;
    var ent = regsDe(pid, o).filter(function (r) { return r.tipo === 0; })[0];
    return ent && !ocupados(pid, o)[SAIDA] && Date.now() - new Date(ent.em) < limiteJornada(p) ? o : h;
  }
  function pontoHoje() {
    if (!S.real) return; S.ponto = {}; S.marcacoesMetodo = {};
    (S.pessoas || []).forEach(function (p) { var d = diaAberto(p.id); regsDe(p.id, d).forEach(function (r) { S.marcacoesMetodo[p.id] = r.metodo === 'fixo' ? 'fixo' : 'celular'; }); S.ponto[p.id] = marcasDia(p.id, d).map(function (x) { return x ? x.hora : ''; }); });
  }
  function localTxt(r) {
    if (!r) return '';
    if (r.lat == null) return r.metodo === 'fixo' ? 'aparelho da empresa' : 'sem localização';
    if (r.distancia == null) return 'localização registrada';
    return fmtDist(r.distancia) + ' da empresa';
  }
  function localPill(r) { if (!r) return ''; return r.fora_do_local ? pill('bad', 'Fora do local · ' + fmtDist(r.distancia)) : r.distancia != null ? pill('ok', 'No local') : pill('mute', localTxt(r)); }
  function mapaLink(r) { return r && r.lat != null ? '<a href="https://www.openstreetmap.org/?mlat=' + r.lat + '&amp;mlon=' + r.lng + '#map=18/' + r.lat + '/' + r.lng + '" target="_blank" rel="noopener noreferrer">mapa</a>' : ''; }
  var CAM = null;
  function pararCamera() { if (CAM) { CAM.getTracks().forEach(function (t) { t.stop(); }); CAM = null; } }
  function abrirCamera(v, modo, ok, falha) {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { falha('Este navegador não abre a câmera.'); return; }
    var alta = modo === 'environment';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: modo, width: { ideal: alta ? 1280 : 640 }, height: { ideal: alta ? 960 : 480 } }, audio: false }).then(function (s) {
      if (!doc.body.contains(v)) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      pararCamera(); CAM = s; v.srcObject = s;
      var feito = false, f = function () { if (feito || !v.videoWidth) return; feito = true; ok(); };
      v.addEventListener('loadeddata', f); v.addEventListener('playing', f); setTimeout(f, 1500);
    }, function () { falha('Sem acesso à câmera. Permita a câmera para este site (no cadeado da barra de endereço ou nos ajustes do celular) e abra de novo.'); });
  }
  function capturaFrame(v, max) {
    return new Promise(function (ok) {
      if (!v || !v.videoWidth) return ok(null);
      var c = doc.createElement('canvas'), k = Math.min(1, max / v.videoWidth); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.toBlob(ok, 'image/jpeg', 0.78);
    });
  }
  // Reconhecimento facial: lê o rosto algumas vezes seguidas e fica com a leitura mais próxima do cadastro.
  function lerRostos(v, n) {
    var out = [], i = 0;
    return new Promise(function (ok) { (function prox() { if (i++ >= n || !doc.body.contains(v)) return ok(out); window.Rosto.descritor(v).then(function (d) { if (d) out.push(d); setTimeout(prox, 200); }, function () { setTimeout(prox, 200); }); })(); });
  }
  function conferirRosto(p, v, cad, st) {
    var cfg = cfgPonto();
    return lerRostos(v, cad ? 4 : 3).then(function (ds) {
      if (cad) { if (ds.length < 3) throw new Error('Não deu para ver o rosto com nitidez. Fique de frente para a câmera, com boa luz, e toque de novo.'); return { rosto: 'cadastro', descritor: window.Rosto.media(ds), dist: null }; }
      if (!ds.length) throw new Error('Rosto não encontrado. Fique de frente para a câmera, com o rosto dentro do círculo, e toque de novo.');
      var ref = S.rostos[p.id].descritor, dist = Math.min.apply(null, ds.map(function (d) { return window.Rosto.distancia(d, ref); }));
      if (dist <= window.Rosto.LIMIAR[cfg.rigor]) return { rosto: 'confere', dist: dist };
      st.tent++;
      if (st.tent < 3) throw new Error('O rosto não confere com o cadastro (tentativa ' + st.tent + ' de 3). Tire boné ou óculos escuros, melhore a luz e toque de novo.');
      if (cfg.rostoBloq) throw new Error('O rosto não conferiu em ' + st.tent + ' tentativas e a marcação não foi registrada. Procure a empresa: ela pode recadastrar o seu rosto ou ajustar a marcação.');
      return { rosto: 'nao_confere', dist: dist };
    });
  }
  function rostoDe(x) { return { descritor: (x.descritor || []).map(Number), foto: x.foto || null, em: x.cadastrado_em || x.em || '' }; }
  function salvarRosto(pid, descritor, foto) {
    return (NUVEM ? Nuvem.cadastrarRosto({ pessoa_id: pid, descritor: descritor, foto: foto }) : Promise.resolve(null)).then(function (x) {
      S.rostos = S.rostos || {}; S.rostos[pid] = x ? rostoDe(x) : { descritor: descritor, foto: foto, em: new Date().toISOString() };
      if (S.role === 'empresa') auditar('Rosto cadastrado', (P(pid) || {}).nome || pid);
    });
  }
  // Abre a câmera frontal, confere o rosto (se a empresa ligou) e pega a localização; só registra quando cumpre o que a empresa exige.
  function capturarPonto(p, tipo, metodo) {
    var cfg = cfgPonto(), st = { cam: false, loc: null, locFim: false, rosto: false, modelo: false, tent: 0 }, precisaLoc = metodo === 'celular' && cfg.local;
    var usaRosto = cfg.rosto, cad = usaRosto && !(S.rostos || {})[p.id], nome = tipoNome(p.id, tipo), rotulo = 'Registrar ' + nome.toLowerCase();
    var chip = function (k, t) { return '<li data-cp="' + k + '">' + t + '</li>'; };
    modal(cad ? 'Primeira marcação · cadastro do rosto' : nome + ' · ' + first(p.nome),
      '<ol class="cam-passos">' + chip('cam', 'Câmera') + (usaRosto ? chip('rosto', cad ? 'Cadastro do rosto' : 'Rosto') : '') + chip('loc', precisaLoc ? 'Localização' : 'Localização (opcional)') + '</ol>' +
      '<div class="cam"><video id="cam-v" autoplay playsinline muted></video>' + (usaRosto ? '<div class="cam-guia" id="cam-guia" aria-hidden="true"></div>' : '') + '</div>' +
      '<p class="cam-st" id="cam-st" role="status">Abrindo a câmera…</p>' + (usaRosto ? '<p class="ui-sub" id="rosto-st">Carregando o reconhecimento facial…</p>' : '') + '<p class="ui-sub" id="loc-st">Buscando a localização…</p>' +
      (cad ? '<div class="notice info"><div><strong>' + esc(first(p.nome)) + ', o seu rosto ainda não está cadastrado</strong>Nesta marcação o app cadastra o rosto: fique de frente, com o rosto inteiro dentro do círculo e boa luz. O rosto vira um código numérico, usado só para confirmar que é você quem marca o ponto (LGPD, art. 11, II, "g"). A foto fica guardada com a empresa.</div></div>'
        : usaRosto ? '<p class="ui-sub">O app confere o rosto com o cadastro antes de registrar. A foto e o local ficam como comprovante.</p>' : '<p class="ui-sub">A foto e o local ficam guardados como comprovante desta marcação.</p>'),
      '<button type="button" class="btn btn-primary btn-lg" id="cam-ok" disabled>' + esc(cad ? 'Cadastrar o rosto e registrar' : rotulo) + '</button>');
    var v = $('#cam-v'), bt = $('#cam-ok');
    var txt = function (id, t) { var el = $('#' + id); if (el) el.textContent = t; };
    var marca = function (k, cls) { var li = $('[data-cp="' + k + '"]'); if (li) { li.classList.remove('feito', 'erro'); if (cls) li.classList.add(cls); } };
    var pronto = function () { return (st.cam || !cfg.foto) && (!usaRosto || (st.cam && st.rosto)) && (st.locFim || !precisaLoc) && (st.loc || !precisaLoc); };
    var atualiza = function () { var b = $('#cam-ok'); if (!b || b.dataset.ocupado) return; b.disabled = !pronto(); if (!usaRosto) b.textContent = st.cam || cfg.foto ? rotulo : 'Registrar sem foto'; };
    var procura = function () { // mostra "rosto encontrado" enquanto a pessoa se posiciona
      if (!doc.body.contains(v) || !st.cam || !st.modelo) return;
      window.Rosto.achar(v).then(function (sc) {
        if (!doc.body.contains(v)) return; var ok = sc >= 0.6, g = $('#cam-guia');
        if (g) g.classList.toggle('ok', ok); st.rosto = ok; marca('rosto', ok ? 'feito' : '');
        txt('rosto-st', ok ? 'Rosto encontrado. Pode tocar no botão.' : 'Posicione o rosto dentro do círculo, de frente e com boa luz.'); atualiza();
        setTimeout(procura, ok ? 900 : 450);
      }, function () { setTimeout(procura, 1000); });
    };
    if (usaRosto) {
      if (!window.Rosto) { marca('rosto', 'erro'); txt('rosto-st', 'O reconhecimento facial não carregou. Feche e abra o app de novo.'); }
      else window.Rosto.carregar().then(function () { st.modelo = true; txt('rosto-st', 'Reconhecimento facial pronto.'); procura(); }, function (e) { marca('rosto', 'erro'); txt('rosto-st', 'Não foi possível carregar o reconhecimento facial neste aparelho (' + e.message + '). Tente outro navegador ou peça à empresa para ajustar a marcação.'); });
    }
    abrirCamera(v, 'user', function () { st.cam = true; marca('cam', 'feito'); txt('cam-st', usaRosto ? 'Olhe para a câmera.' : 'Enquadre o rosto e toque no botão.'); procura(); atualiza(); },
      function (m) { marca('cam', 'erro'); txt('cam-st', cfg.foto ? m : 'Câmera indisponível: a marcação sai sem foto.'); atualiza(); });
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function (pos) {
      st.loc = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), prec: Math.round(pos.coords.accuracy || 0) }; st.locFim = true; marca('loc', 'feito');
      var t = 'Localização obtida (precisão de ' + st.loc.prec + ' m)';
      if (cfg.lat != null) { var dd = distM(cfg.lat, cfg.lng, st.loc.lat, st.loc.lng); t += ' · ' + fmtDist(dd) + ' da empresa' + (dd > cfg.raio + st.loc.prec ? ', fora do local' + (cfg.bloquear ? ': a empresa não aceita marcação fora do local' : '') : ''); }
      txt('loc-st', t); atualiza();
    }, function (er) { st.locFim = true; marca('loc', precisaLoc ? 'erro' : ''); txt('loc-st', precisaLoc ? 'Sem localização (' + (er && er.code === 1 ? 'permissão negada' : 'sinal indisponível') + '). Ative a localização do aparelho, permita para este site e abra de novo.' : 'Sem localização: a marcação sai sem o local.'); atualiza(); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    else { st.locFim = true; txt('loc-st', 'Este navegador não informa a localização.'); atualiza(); }
    bt.addEventListener('click', function () {
      bt.disabled = true; bt.dataset.ocupado = '1'; bt.textContent = cad ? 'Cadastrando o rosto…' : usaRosto ? 'Conferindo o rosto…' : 'Registrando…';
      (usaRosto ? conferirRosto(p, v, cad, st) : Promise.resolve(null)).then(function (rr) {
        return capturaFrame(st.cam ? v : null, 480).then(function (blob) { return registrarPonto(p, tipo, metodo, blob, st.loc, rr); });
      }).then(function () { pararCamera(); closeModal(); }, function (e) { delete bt.dataset.ocupado; atualiza(); bt.textContent = 'Tentar de novo'; txt('cam-st', erroTxt(e)); });
    });
  }
  var ROSTO_TXT = { confere: 'Rosto conferido', nao_confere: 'Rosto não conferiu (sinalizado para a empresa)', cadastro: 'Rosto cadastrado nesta marcação' };
  function registrarPonto(p, tipo, metodo, blob, loc, rr) {
    var cfg = cfgPonto();
    if (cfg.foto && !blob) return Promise.reject(new Error('Tire a foto para registrar o ponto.'));
    if (cfg.rosto && !rr) return Promise.reject(new Error('A empresa exige o reconhecimento facial nesta marcação.'));
    if (metodo === 'celular' && cfg.local && !loc) return Promise.reject(new Error('Permita a localização para registrar o ponto.'));
    var dist = loc && cfg.lat != null ? distM(cfg.lat, cfg.lng, loc.lat, loc.lng) : null, fora = dist != null && dist > cfg.raio + (loc.prec || 0);
    if (fora && cfg.bloquear) return Promise.reject(new Error('Você está a ' + fmtDist(dist) + ' do local de trabalho. A empresa só aceita marcação no local.'));
    var up = blob ? Arq().enviar(caminho(p.id, 'ponto', 'jpg'), blob) : Promise.resolve(null);
    return up.then(function (path) {
      return (rr && rr.rosto === 'cadastro' ? salvarRosto(p.id, rr.descritor, path) : Promise.resolve()).then(function () {
        var row = { pessoa_id: p.id, tipo: tipo, metodo: metodo, foto: path, lat: loc ? loc.lat : null, lng: loc ? loc.lng : null, precisao: loc ? loc.prec : null, dia: S.real ? diaAberto(p.id) : hojeISO() };
        if (rr) { row.rosto = rr.rosto; if (rr.dist != null) row.rosto_dist = Math.round(rr.dist * 1000) / 1000; }
        if (NUVEM) return Nuvem.baterPonto(row);
        S.nsr = (S.nsr || 0) + 1;
        row.id = 'r' + Date.now(); row.em = new Date().toISOString(); row.nsr = S.nsr; row.distancia = dist; row.fora_do_local = dist == null ? null : fora;
        return row;
      });
    }).then(function (row) {
      S.registros = S.registros || []; S.registros.push(row);
      var tz = fusoDe(p);
      if (S.real) pontoHoje(); else { var m = mk(p.id); m[tipo] = hhmm(row.em, tz); S.ponto[p.id] = m; S.marcacoesMetodo[p.id] = metodo === 'celular' ? 'celular' : 'fixo'; }
      S.ui.recibo = { nsr: String(row.nsr).padStart(9, '0'), quando: new Date(row.em).toLocaleDateString('pt-BR', { timeZone: tz }) + ' ' + hhmm(row.em, tz) + ' · ' + fusoNome(tz), nome: p.nome, cpf: p.cpf, tipo: tipoNome(p.id, tipo), metodo: METODO[metodo], local: localTxt(row) + (row.fora_do_local ? ' (fora do local)' : '') + (row.lat != null ? ' · ' + row.lat + ', ' + row.lng : ''), foto: !!row.foto, rosto: row.rosto ? ROSTO_TXT[row.rosto] : '' };
      save(); render(); toast(tipoNome(p.id, tipo) + ' registrada às ' + hhmm(row.em, tz) + '. Comprovante gerado.');
    });
  }
  function trabalhoDia(h) {
    var t = 0, cur = h[0] || null, pausas = [];
    for (var k = 1; k <= 4; k++) { var s = h[2 * k - 1], v = h[2 * k]; if (s && cur) { t += minJ(cur, s); cur = null; } if (s && v) pausas.push(minJ(s, v)); if (v) cur = v; }
    if (h[SAIDA] && cur) t += minJ(cur, h[SAIDA]);
    return { trab: t, pausas: pausas, completo: !!(h[0] && h[SAIDA]) };
  }
  function difMin(a, b) { var d = min(a) - min(b); if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; }
  // O que não bate com a CLT ou com o horário previsto. Só a empresa vê; intervalo flexível cumprido não gera aviso.
  function inconsDia(pid, dia, o) {
    var h = o.map(function (x) { return x ? x.hora : ''; }), j = jornadaDe(P(pid)), ivs = ivsDe(j), w = trabalhoDia(h), a = [], aberto = dia === diaAberto(pid);
    var q = function (k) { return ivs.length > 1 || k > 1 ? ' ' + k : ''; };
    if (!h[0] && h.some(Boolean)) a.push('Sem marcação de entrada');
    if (h[0] && !h[SAIDA] && !aberto) a.push('Sem marcação de saída');
    for (var k = 1; k <= 4; k++) if (h[2 * k - 1] && !h[2 * k] && (h[SAIDA] || !aberto)) a.push('Sem a volta do intervalo' + q(k));
    if (w.completo) {
      var req = reqIntervalo(w.trab), maior = Math.max.apply(null, [0].concat(w.pausas));
      if (!j.aceite && req && maior < req) a.push('Intervalo de ' + fmtDur(maior) + ' para ' + fmtHoras(w.trab) + ' de trabalho: a lei pede ' + fmtDur(req) + ' (intrajornada, CLT, art. 71)');
      if (!j.aceite && w.trab > 600) a.push(fmtHoras(w.trab) + ' de trabalho: passa de 10 horas no dia (CLT, art. 59)');
      ivs.forEach(function (iv, i) {
        var kk = i + 1, s = h[2 * kk - 1], v = h[2 * kk]; if (!s || !v) return; var d = minJ(s, v);
        if (iv.flex) {
          if (d < iv.dur - 5) a.push('Intervalo' + q(kk) + ' de ' + fmtDur(d) + ': o previsto é ' + fmtDur(iv.dur));
          if (iv.de && iv.ate && (minJ(iv.de, s) > minJ(iv.de, iv.ate) || minJ(iv.de, v) > minJ(iv.de, iv.ate))) a.push('Intervalo' + q(kk) + ' fora da janela ' + iv.de + '–' + iv.ate);
        } else if (Math.abs(difMin(s, iv.ini)) > 10 || Math.abs(difMin(v, iv.fim)) > 10) a.push('Intervalo' + q(kk) + ' das ' + s + ' às ' + v + ': o previsto é ' + iv.ini + '–' + iv.fim);
      });
    }
    var po = marcasDia(pid, addDays(dia, -1));
    if (h[0] && po[0] && po[SAIDA]) { var fim = min(po[SAIDA].hora) + (min(po[SAIDA].hora) <= min(po[0].hora) ? 1440 : 0), desc = 1440 + min(h[0]) - fim; if (desc < 660) a.push('Descanso de ' + fmtHoras(Math.max(0, desc)) + ' desde a saída anterior: a lei pede 11 horas (interjornada, CLT, art. 66)'); }
    return a;
  }
  function espelhoHTML(pid) {
    var ks = {}, emp = S.role === 'empresa', n = nIvs(pid), cols = {}, tz = fusoDe(P(pid));
    regsDe(pid).forEach(function (r) { ks[r.dia] = 1; }); ajustesDe(pid, null, 'aprovado').forEach(function (a) { ks[a.dia] = 1; });
    ks = Object.keys(ks).sort().reverse();
    if (!ks.length) return '<p class="ui-sub">Nenhuma marcação ainda. As marcações aparecem aqui a partir do primeiro registro.</p>';
    sequenciaDe(pid).forEach(function (t) { cols[t] = 1; });
    var dias = ks.map(function (k) { var o = marcasDia(pid, k); o.forEach(function (x, t) { if (x) cols[t] = 1; }); return [k, o]; });
    var tipos = Object.keys(cols).map(Number).sort(function (a, b) { return a - b; });
    var cel = function (x) {
      if (!x) return '<td class="num">·</td>';
      var r = x.r || (x.antes && x.antes.r), orig = r ? '<span class="sub">' + (x.a ? 'original ' + hhmm(r.em, tz) + ' · ' : '') + 'NSR ' + esc(r.nsr) + ' · ' + esc(localTxt(r)) + '</span>' + (r.fora_do_local ? pill('bad', 'fora do local') : '') + (r.rosto === 'nao_confere' ? pill('bad', 'rosto não conferiu') : r.rosto === 'cadastro' ? pill('mute', 'rosto cadastrado') : '') + '<span class="sub">' + (r.foto ? '<button type="button" class="link-btn" data-act="arq-ver" data-path="' + esc(r.foto) + '" data-t="Foto da marcação">foto</button> ' : '') + mapaLink(r) + '</span>' : '';
      if (x.a) return '<td class="num">' + (x.hora ? '<strong>' + esc(x.hora) + '</strong>' : '<s>' + (r ? hhmm(r.em, tz) : '') + '</s>') + ' ' + pill('warn', x.a.acao === 'desconsiderar' ? 'desconsiderada' : 'ajustada') + '<span class="sub">' + esc(x.a.motivo) + (r ? '' : ' · sem marcação original') + '</span>' + orig + '</td>';
      return '<td class="num"><strong>' + esc(x.hora) + '</strong>' + orig + '</td>';
    };
    var tot = function (o) { var w = trabalhoDia(o.map(function (x) { return x ? x.hora : ''; })); return w.trab > 0 && w.trab <= 960 ? fmtHoras(w.trab) : w.trab > 960 ? 'confira' : '·'; };
    var conf = function (k, o) {
      var a = inconsDia(pid, k, o), ci = (S.pontoCiente || {})[pid + '|' + k]; if (!a.length) return '<td>' + pill('ok', 'Ok') + '</td>';
      return '<td><ul class="incons">' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' + (ci ? '<span class="sub">Mantido por ' + esc(ci.por) + ' em ' + esc(ci.em) + '</span>' : '<button type="button" class="btn btn-sm" data-act="ponto-ciente" data-id="' + esc(pid) + '" data-dia="' + k + '">Estou ciente, manter</button>') + '</td>';
    };
    return '<div class="table-box"><table class="t stack-sm"><thead><tr><th>Dia</th>' + tipos.map(function (t) { return '<th class="num">' + esc(curtoTipo(t, n)) + '</th>'; }).join('') + '<th class="num">Trabalhado</th>' + (emp ? '<th>Conferência</th>' : '') + '</tr></thead><tbody>' +
      dias.map(function (x) { var k = x[0], o = x[1]; return '<tr><td><strong>' + dmyy(k) + '</strong><span class="sub">' + DIAS[diaSemana(k)] + '</span></td>' + tipos.map(function (t) { return cel(o[t]); }).join('') + '<td class="num">' + tot(o) + '</td>' + (emp ? conf(k, o) : '') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function csvCel(v) { var s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function baixarTexto(nome, texto, tipo) { salvarArquivo(nome, new Blob(['\ufeff' + texto], { type: tipo || 'text/csv;charset=utf-8' })); }

  /* Turnos */
  var DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  function hhOk(v) { v = String(v || ''); return /^\d\d:\d\d$/.test(v) ? v : ''; }
  function turnoDe(id) { return (S.turnos || []).filter(function (t) { return t.id === id; })[0]; }
  // Intervalos: fixo { ini, fim } ou flexível { dur (minutos), de, ate (janela opcional) }. Os antigos (si/vi) viram um intervalo fixo.
  function ivsDe(j) { if (!j) return []; if (Array.isArray(j.intervalos)) return j.intervalos.slice(0, 4); return j.si && j.vi ? [{ flex: false, ini: j.si, fim: j.vi }] : []; }
  function durIv(iv) { return iv.flex ? Math.max(0, +iv.dur || 0) : minJ(iv.ini, iv.fim); }
  function jornadaDe(p) { var t = p && p.turno && turnoDe(p.turno); if (t) return t; if (p && p.jornada && p.jornada.e) return p.jornada; return { e: (p && p.escala) || '08:00', s: '', intervalos: [{ flex: true, dur: 60 }], dias: [1, 2, 3, 4, 5, 6] }; }
  function minJ(a, b) { var x = min(a), y = min(b); if (x == null || y == null) return 0; return y >= x ? y - x : y + 1440 - x; }
  function cargaDia(j) { return Math.max(0, minJ(j.e, j.s) - ivsDe(j).reduce(function (s, iv) { return s + durIv(iv); }, 0)); }
  function passaMeiaNoite(j) { return !!(j && j.e && j.s && min(j.s) <= min(j.e)); }
  function fmtHoras(m) { return Math.floor(m / 60) + 'h' + ('0' + Math.round(m % 60)).slice(-2); }
  function fmtDur(m) { m = Math.max(0, Math.round(+m || 0)); return m < 60 ? m + ' min' : m % 60 ? fmtHoras(m) : (m / 60) + (m === 60 ? ' hora' : ' horas'); }
  function ivTxt(iv) { return iv.flex ? fmtDur(iv.dur) + ' flexível' + (iv.de && iv.ate ? ' (entre ' + iv.de + ' e ' + iv.ate + ')' : '') : iv.ini + '–' + iv.fim; }
  function horarioTxt(j) { if (!j.s) return 'entrada às ' + j.e; var iv = ivsDe(j); return j.e + '–' + j.s + (passaMeiaNoite(j) ? ' do dia seguinte' : '') + (iv.length ? ', intervalo' + (iv.length > 1 ? 's ' : ' ') + iv.map(ivTxt).join(' e ') : ', sem intervalo'); }
  function diasTxt(ds) { ds = (ds || []).slice().sort(); if (ds.length === 7) return 'todos os dias'; if (ds.join() === '1,2,3,4,5') return 'segunda a sexta'; if (ds.join() === '1,2,3,4,5,6') return 'segunda a sábado'; return ds.map(function (d) { return DIAS[d]; }).join(', '); }
  function escalaTxt(j) { return j && j.x1236 ? 'escala 12x36 (dia sim, dia não)' : diasTxt(j && j.dias); }
  function turnoCurto(p) { var t = p.turno && turnoDe(p.turno); return t ? t.nome : horarioTxt(jornadaDe(p)); }
  function reqIntervalo(trab) { return trab > 360 ? 60 : trab > 240 ? 15 : 0; }
  function noturnoMin(e, s) { var a = min(e), b = min(s), t = 0; if (a == null || b == null) return 0; if (b <= a) b += 1440; for (var x = a; x < b; x += 5) { var h = x % 1440; if (h >= 1320 || h < 300) t += 5; } return t; }
  // Conferência da jornada prevista. "graves": não bate com a CLT (a empresa só mantém se declarar que está ciente). "avisos": precisa de acordo ou gera adicional.
  function conferirJornada(j) {
    var g = [], av = [], ivs = ivsDe(j), r = { graves: g, avisos: av, dia: 0, semana: 0 };
    if (!j || !j.e || !j.s) return r;
    var span = minJ(j.e, j.s); if (!span) { g.push('Entrada e saída no mesmo horário'); return r; }
    var dia = cargaDia(j), sem = Math.round(dia * (j.x1236 ? 3.5 : (j.dias || []).length)); r.dia = dia; r.semana = sem;
    var dentro = function (h) { var x = minJ(j.e, h); return x > 0 && x < span; }, q = function (i) { return ivs.length > 1 ? ' ' + (i + 1) : ''; };
    ivs.forEach(function (iv, i) {
      if (iv.flex) { if (iv.de && iv.ate) { if (!dentro(iv.de) || !dentro(iv.ate)) g.push('A janela do intervalo' + q(i) + ' fica fora do horário de trabalho'); else if (minJ(iv.de, iv.ate) < iv.dur) g.push('A janela do intervalo' + q(i) + ' é menor que a duração dele'); } }
      else if (!dentro(iv.ini) || !dentro(iv.fim) || minJ(j.e, iv.fim) <= minJ(j.e, iv.ini)) g.push('O intervalo' + q(i) + ' (' + iv.ini + '–' + iv.fim + ') fica fora do horário de trabalho');
    });
    var maior = ivs.reduce(function (m, iv) { return Math.max(m, durIv(iv)); }, 0), soma = ivs.reduce(function (s, iv) { return s + durIv(iv); }, 0), req = reqIntervalo(dia);
    if (req && maior < req) (j.x1236 ? av : g).push((req === 60 ? 'Mais de 6 horas de trabalho pede um intervalo de pelo menos 1 hora' : 'De 4 a 6 horas de trabalho pede um intervalo de 15 minutos') + (maior ? ' (o maior é de ' + fmtDur(maior) + (soma >= req ? '; intervalos divididos não substituem o intervalo inteiro' : '') + ')' : ' (não há intervalo)') + ' · intrajornada, CLT, art. 71' + (j.x1236 ? '. Na 12x36 o intervalo pode ser indenizado, se o acordo prever (art. 59-A)' : ''));
    if (ivs.some(function (iv) { return durIv(iv) > 120; })) av.push('Intervalo acima de 2 horas precisa de acordo escrito ou convenção (CLT, art. 71)');
    var seguidos = !j.x1236 && (j.dias || []).some(function (d) { return (j.dias || []).indexOf((d + 1) % 7) > -1; });
    if (seguidos && 1440 - span < 660) g.push('Descanso de ' + fmtHoras(1440 - span) + ' entre um dia e outro: a lei pede pelo menos 11 horas (interjornada, CLT, art. 66)');
    if (j.x1236) { if (span > 720) g.push('Na escala 12x36 a jornada é de no máximo 12 horas (CLT, art. 59-A)'); av.push('Escala 12x36 precisa de acordo escrito ou convenção coletiva (CLT, art. 59-A)'); }
    else if (dia > 600) g.push(fmtHoras(dia) + ' de trabalho por dia: passa do limite de 2 horas extras (CLT, art. 59)');
    else if (dia > 480) av.push(fmtHoras(dia) + ' por dia: acima de 8 horas precisa de acordo de compensação (CLT, art. 59, §§ 2º e 6º)');
    if (sem > 2640) av.push(fmtHoras(sem) + ' por semana: o que passar de 44 horas é hora extra (CF, art. 7º, XIII e XVI)');
    var nt = noturnoMin(j.e, j.s); if (nt) av.push(fmtDur(nt) + ' entre 22h e 5h: adicional noturno de 20% e hora noturna de 52min30s (CLT, art. 73)');
    return r;
  }
  function alertasJornada(j) { var c = conferirJornada(j); return c.graves.concat(c.avisos); }
  function diasChips(nome, sel) { return '<div class="chips">' + DIAS.map(function (n, i) { return '<label class="chip chip-check"><input type="checkbox" name="' + nome + '" value="' + i + '"' + ((sel || []).indexOf(i) > -1 ? ' checked' : '') + '> ' + n + '</label>'; }).join('') + '</div>'; }
  var IV_N = 0, DUR_IV = [10, 15, 20, 30, 45, 60, 90, 120];
  function ivLinha(iv) {
    iv = iv || {}; var flex = !!iv.flex, id = 'iv' + (++IV_N), durs = DUR_IV.slice(); if (iv.dur && durs.indexOf(+iv.dur) < 0) durs.push(+iv.dur);
    var t = function (n, l, v) { return '<div class="field"><label for="' + id + n + '">' + l + '</label><input id="' + id + n + '" type="time" name="' + n + '" value="' + esc(v || '') + '"></div>'; };
    return '<div class="iv-row' + (flex ? ' iv-flex' : '') + '" data-iv><input type="hidden" name="iv_t" value="' + (flex ? 'flex' : 'fixo') + '">' +
      '<div class="iv-head"><strong>' + (flex ? 'Intervalo flexível' : 'Intervalo com horário fixo') + '</strong><button type="button" class="btn btn-sm" data-act="iv-del">Remover</button></div>' +
      (flex ? '<div class="form-grid form-grid-3"><div class="field"><label for="' + id + 'd">Duração</label><select id="' + id + 'd" name="iv_d">' + durs.sort(function (a, b) { return a - b; }).map(function (m) { return '<option value="' + m + '"' + ((+iv.dur || 60) === m ? ' selected' : '') + '>' + fmtDur(m) + '</option>'; }).join('') + '</select></div>' + t('iv_a', 'Pode sair a partir de', iv.de) + t('iv_b', 'Precisa voltar até', iv.ate) + '</div><p class="sub">A pessoa escolhe a hora; a janela é opcional. Cumprida a duração, não há aviso.</p>'
        : '<input type="hidden" name="iv_d" value=""><div class="form-grid">' + t('iv_a', 'Sai às', iv.ini) + t('iv_b', 'Volta às', iv.fim) + '</div>') + '</div>';
  }
  function horarioPartes(pre, j) {
    j = j || {};
    var f = function (n, l, v) { return '<div class="field"><label for="' + pre + n + '">' + l + '</label><input id="' + pre + n + '" name="' + n + '" type="time" value="' + esc(v || '') + '" required></div>'; };
    return {
      dias: '<div class="field"><span class="lbl-s">Dias de trabalho</span>' + diasChips('jd', j.dias || [1, 2, 3, 4, 5]) + '</div><label class="check"><input type="checkbox" name="j1236"' + (j.x1236 ? ' checked' : '') + '> Escala 12x36 (trabalha um dia e folga o outro)</label>',
      horas: '<div class="form-grid">' + f('je', 'Entrada', j.e) + f('js', 'Saída', j.s) + '</div><p class="sub" data-noite' + (passaMeiaNoite(j) ? '' : ' hidden') + '>Termina no dia seguinte. As marcações depois da meia-noite ficam no dia em que a jornada começou.</p>',
      ivs: '<div class="stack" data-ivs>' + ivsDe(j).map(ivLinha).join('') + '</div><p class="sub" data-iv-dica></p><div class="actions iv-add"><button type="button" class="btn" data-act="iv-add" data-v="fixo">+ Intervalo com horário fixo</button><button type="button" class="btn" data-act="iv-add" data-v="flex">+ Intervalo flexível</button></div>',
      conf: '<div data-conf aria-live="polite"></div>'
    };
  }
  function camposHorario(pre, j) { var x = horarioPartes(pre, j); return x.horas + '<div class="field"><span class="lbl-s">Intervalos</span>' + x.ivs + '</div>' + x.dias + x.conf; }
  function jornadaDoForm(d) {
    var j = { e: hhOk(d.get('je')) || '08:00', s: hhOk(d.get('js')), dias: d.getAll('jd').map(Number).filter(function (x) { return x >= 0 && x <= 6; }), intervalos: [] };
    if (d.get('j1236') === 'on') j.x1236 = true;
    if (!j.dias.length) j.dias = [1, 2, 3, 4, 5];
    var ts = d.getAll('iv_t'), as = d.getAll('iv_a'), bs = d.getAll('iv_b'), ds = d.getAll('iv_d');
    ts.forEach(function (t, i) {
      if (j.intervalos.length >= 4) return; var a = hhOk(as[i]), b = hhOk(bs[i]);
      if (t === 'flex') { var iv = { flex: true, dur: Math.max(5, Math.min(240, Math.round(+ds[i] || 60))) }; if (a && b) { iv.de = a; iv.ate = b; } j.intervalos.push(iv); }
      else if (a && b) j.intervalos.push({ flex: false, ini: a, fim: b });
    });
    return j;
  }
  function confHTML(j, marcado) {
    if (!j.s) return '<p class="ui-sub">Preencha a entrada e a saída para conferir a jornada.</p>';
    var c = conferirJornada(j), li = function (x) { return '<li>' + esc(x) + '</li>'; };
    return '<div class="conf-j"><div class="conf-num"><div><span class="lbl-s">Trabalho por dia</span><strong class="num">' + fmtHoras(c.dia) + '</strong></div><div><span class="lbl-s">Por semana' + (j.x1236 ? ' (média)' : '') + '</span><strong class="num">' + fmtHoras(c.semana) + '</strong></div></div>' +
      '<p class="ui-sub">' + esc(horarioTxt(j)) + ' · ' + esc(escalaTxt(j)) + '</p>' +
      (c.graves.length ? '<div class="notice bad"><div><strong>Não bate com a CLT</strong><ul>' + c.graves.map(li).join('') + '</ul></div></div><label class="check aceite"><input type="checkbox" name="jac"' + (marcado ? ' checked' : '') + '> <span>A empresa está ciente e quer manter este horário mesmo assim. A decisão fica registrada com nome, data e hora.</span></label>' : '') +
      (c.avisos.length ? '<div class="notice"><div><strong>Atenção</strong><ul>' + c.avisos.map(li).join('') + '</ul></div></div>' : '') +
      (c.graves.length || c.avisos.length ? '' : '<div class="notice info"><div><strong>Dentro da CLT</strong>Carga, intervalos e descanso entre jornadas conferem.</div></div>') + '</div>';
  }
  function atualizaConf(form) {
    var box = $('[data-conf]', form); if (!box) return;
    var man = $('[data-manual]', form); if (man && man.hidden) { box.innerHTML = ''; return; }
    var j = jornadaDoForm(new FormData(form)), key = JSON.stringify(conferirJornada(j).graves), ck = $('[name="jac"]', box);
    var noite = $('[data-noite]', form); if (noite) noite.hidden = !passaMeiaNoite(j);
    var dica = $('[data-iv-dica]', form);
    if (dica) { var tr = j.s ? minJ(j.e, j.s) - ivsDe(j).reduce(function (s, iv) { return s + durIv(iv); }, 0) : 0, rq = reqIntervalo(tr); dica.textContent = !j.s ? '' : rq ? 'Para ' + fmtHoras(tr) + ' de trabalho, a lei pede um intervalo de pelo menos ' + fmtDur(rq) + ' (CLT, art. 71).' : 'Até 4 horas de trabalho, a lei não exige intervalo.'; }
    var marcado = ck ? ck.checked && box.dataset.k === key : form.dataset.aceite === key;
    box.innerHTML = confHTML(j, marcado); box.dataset.k = key;
  }
  // A empresa só mantém um horário fora da CLT declarando que está ciente; fica registrado.
  function aceiteJornada(j, d, nome) {
    var c = conferirJornada(j); if (!c.graves.length) { delete j.aceite; return true; }
    if (d.get('jac') !== 'on') { toast('Este horário não bate com a CLT. Ajuste o horário ou marque que a empresa está ciente e quer manter.'); return false; }
    j.aceite = { em: agora(), por: quemSou(), alertas: c.graves }; auditar('Horário mantido fora da CLT', nome + ': ' + c.graves.join('; ')); return true;
  }
  var PRESETS_T = [
    ['Comercial', 'seg a sex · 08:00 às 17:48 · 1 h de almoço', { e: '08:00', s: '17:48', intervalos: [{ flex: false, ini: '12:00', fim: '13:00' }], dias: [1, 2, 3, 4, 5] }],
    ['Comercial com sábado', 'seg a sáb · 08:00 às 16:20 · 1 h de almoço', { e: '08:00', s: '16:20', intervalos: [{ flex: false, ini: '12:00', fim: '13:00' }], dias: [1, 2, 3, 4, 5, 6] }],
    ['6 horas', 'seg a sáb · 08:00 às 14:15 · 15 min flexível', { e: '08:00', s: '14:15', intervalos: [{ flex: true, dur: 15 }], dias: [1, 2, 3, 4, 5, 6] }],
    ['Meio período', 'seg a sáb · 08:00 às 12:00 · sem intervalo', { e: '08:00', s: '12:00', intervalos: [], dias: [1, 2, 3, 4, 5, 6] }],
    ['Noturno', 'seg a sex · 22:00 às 05:00 · 1 h flexível', { e: '22:00', s: '05:00', intervalos: [{ flex: true, dur: 60 }], dias: [1, 2, 3, 4, 5] }],
    ['12x36 diurno', '07:00 às 19:00 · 1 h flexível', { e: '07:00', s: '19:00', intervalos: [{ flex: true, dur: 60 }], dias: [0, 1, 2, 3, 4, 5, 6], x1236: true }],
    ['12x36 noturno', '19:00 às 07:00 · 1 h flexível', { e: '19:00', s: '07:00', intervalos: [{ flex: true, dur: 60 }], dias: [0, 1, 2, 3, 4, 5, 6], x1236: true }]
  ];
  /* Passo a passo (assistente em etapas dentro da janela) */
  function wizBarra(nomes) { return '<ol class="wiz-barra">' + nomes.map(function (n, i) { return '<li data-wb="' + (i + 1) + '"' + (i ? '' : ' aria-current="step"') + '><span>' + (i + 1) + '</span><em>' + esc(n) + '</em></li>'; }).join('') + '</ol>'; }
  function wizPasso(n, titulo, corpo) { return '<fieldset class="wiz-passo" data-passo="' + n + '"' + (n === 1 ? '' : ' hidden') + '><legend class="wiz-tit"><span class="wiz-n">' + n + '</span>' + esc(titulo) + '</legend>' + corpo + '</fieldset>'; }
  function wizNav(fim) { return '<div class="wiz-nav"><button type="button" class="btn btn-lg" data-act="wiz-volta" hidden>Voltar</button><button type="button" class="btn btn-primary btn-lg" data-act="wiz-prox">Continuar</button><button type="submit" class="btn btn-primary btn-lg" hidden>' + esc(fim) + '</button></div>'; }
  function wizValida(form, n, quieto) {
    var sel = '[data-passo="' + n + '"]', bad = $$(sel + ' input, ' + sel + ' select, ' + sel + ' textarea', form).filter(function (c) { return !c.disabled && c.willValidate && !c.checkValidity(); })[0];
    if (bad) { if (!quieto) bad.reportValidity(); return false; }
    var g = $(sel + ' [data-precisa]', form); if (g && !$('input:checked', g)) { if (!quieto) toast(g.dataset.precisa); return false; }
    return true;
  }
  function wizIr(form, n) {
    var ps = $$('[data-passo]', form), tot = ps.length; n = Math.max(1, Math.min(tot, n)); form.dataset.p = n;
    ps.forEach(function (p) { p.hidden = +p.dataset.passo !== n; });
    $$('[data-wb]', form).forEach(function (li) { var k = +li.dataset.wb; if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); li.classList.toggle('feito', k < n); });
    var v = $('[data-act="wiz-volta"]', form), pr = $('[data-act="wiz-prox"]', form), sb = $('.wiz-nav button[type=submit]', form);
    if (v) v.hidden = n === 1; if (pr) pr.hidden = n === tot; if (sb) sb.hidden = n !== tot;
    if (form.hasAttribute('data-jornada')) atualizaConf(form);
    if (n === tot && form.hasAttribute('data-ctwiz')) atualizaCtWiz(form);
    if (n === tot && form.dataset.form === 'ck') atualizaCkResumo(form);
    var m = form.closest('.modal'); if (m) m.scrollTop = 0;
    var foco = $('[data-passo="' + n + '"] input:not([type=hidden]), [data-passo="' + n + '"] select', form); if (foco && n > 1) foco.focus();
  }
  function turnoForm(t) {
    var novo = !t, x = horarioPartes('tu-', t || { dias: [1, 2, 3, 4, 5] });
    var presets = novo ? '<div class="field"><span class="lbl-s">Comece por um modelo pronto (dá para ajustar tudo depois) ou preencha do zero</span><div class="preset-grid">' + PRESETS_T.map(function (p, i) { return '<button type="button" class="preset" data-act="turno-preset" data-i="' + i + '"><strong>' + esc(p[0]) + '</strong><span>' + esc(p[1]) + '</span></button>'; }).join('') + '</div></div>' : '';
    return '<form class="stack wiz" novalidate data-form="turno" data-jornada data-id="' + esc(t ? t.id : '') + '" data-aceite="' + esc(t && t.aceite ? JSON.stringify(t.aceite.alertas) : '') + '">' + wizBarra(['Nome', 'Horário', 'Intervalos', 'Conferir']) +
      wizPasso(1, 'Nome e dias de trabalho', presets + '<div class="field"><label for="tu-n">Nome do turno</label><input id="tu-n" name="n" maxlength="40" required value="' + esc(t ? t.nome : '') + '" placeholder="Ex.: Manhã, Comercial, Noturno"></div>' + x.dias) +
      wizPasso(2, 'Entrada e saída', x.horas + '<p class="ui-sub">Passa da meia-noite? Coloque a saída normalmente (ex.: 22:00 e 05:00): o app entende que termina no dia seguinte.</p>') +
      wizPasso(3, 'Intervalos', '<p class="ui-sub">Pode ter mais de um. <strong>Fixo:</strong> hora certa para sair e voltar. <strong>Flexível:</strong> a pessoa escolhe a hora e o app só confere a duração.</p>' + x.ivs) +
      wizPasso(4, 'Conferir e salvar', x.conf) + wizNav('Salvar turno') + '</form>';
  }

  /* Dados da empresa */
  function cnpjValido(c) {
    c = String(c || '').replace(/\D/g, ''); if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    var calc = function (n) { var s = 0, p = n - 7; for (var i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } var r = s % 11; return r < 2 ? 0 : 11 - r; };
    return calc(12) === +c[12] && calc(13) === +c[13];
  }
  function formEmpresaHTML() {
    var e = S.empresa, f = function (id, l, n, v, extra) { return '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" name="' + n + '" value="' + esc(v == null ? '' : v) + '"' + (extra || '') + '></div>'; };
    return '<form class="stack" data-form="empresa-dados">' + f('ed-n', 'Nome fantasia (aparece no app)', 'n', e.nome, ' maxlength="80" required') + f('ed-r', 'Razão social', 'r', e.razao, ' maxlength="120"') +
      '<div class="form-grid">' + f('ed-c', 'CNPJ', 'c', e.cnpj, ' maxlength="18" inputmode="numeric"') + f('ed-ie', 'Inscrição estadual', 'ie', e.ie, ' maxlength="20"') + '</div>' +
      f('ed-e', 'Endereço (rua e número)', 'e', e.endereco, ' maxlength="140"') + '<div class="form-grid">' + f('ed-b', 'Bairro', 'b', e.bairro, ' maxlength="60"') + f('ed-cep', 'CEP', 'cep', e.cep, ' maxlength="9" inputmode="numeric"') + '</div>' +
      '<div class="form-grid">' + f('ed-ci', 'Cidade/UF', 'ci', e.cidade, ' maxlength="60"') + f('ed-t', 'Telefone ou WhatsApp', 't', e.fone, ' maxlength="20" inputmode="tel"') + '</div>' + f('ed-m', 'E-mail', 'm', e.email, ' type="email" maxlength="120"') +
      '<div class="form-grid">' + f('ed-rn', 'Responsável legal', 'rn', e.resp, ' maxlength="80"') + f('ed-rc', 'Cargo do responsável', 'rc', e.respCargo, ' maxlength="40" placeholder="Ex.: sócio administrador"') + '</div>' +
      '<p class="ui-sub">Esses dados entram nos contratos, nos comprovantes de ponto e nos documentos da equipe.</p><button class="btn btn-primary" type="submit">Salvar dados da empresa</button></form>';
  }
  function abrirEmpresa() {
    if (S.role !== 'empresa') return;
    modal('Dados da empresa', formEmpresaHTML() + '<p class="ui-sub">Ponto, fuso, reconhecimento facial e turnos ficam em <a href="#/empresa" data-act="fechar">Turnos e regras do ponto</a>.</p>', '', 'modal-largo');
  }
  function vEmpresa() {
    var e = S.empresa, c = cfgPonto();
    var f = function (id, l, n, v, extra) { return '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" name="' + n + '" value="' + esc(v == null ? '' : v) + '"' + (extra || '') + '></div>'; };
    var num = function (n, t) { return '<h2 class="sec sec-n"><span class="wiz-n">' + n + '</span>' + esc(t) + '</h2>'; };
    var rig = [['tolerante', 'Tolerante: aceita mais variação de luz e de ângulo'], ['normal', 'Normal (recomendado)'], ['rigoroso', 'Rigoroso: pede o rosto bem de frente e boa luz']];
    var ponto = '<form class="card card-pad stack" data-form="ponto-cfg">' + '<h2 class="sec">Local, fuso e regras da marcação</h2>' +
      '<div class="field"><span class="lbl-s">Local de trabalho</span><p>' + (c.lat != null ? 'Definido: ' + c.lat + ', ' + c.lng + ' · ' + mapaLink({ lat: c.lat, lng: c.lng }) : 'Ainda não definido. Sem ele, o ponto registra o local, mas não confere a distância.') + '</p><button type="button" class="btn" data-act="usar-local">Usar a localização deste aparelho</button><span class="sub">Faça isso dentro da empresa.</span></div>' +
      '<div class="field"><label for="pc-r">Raio aceito (metros)</label><input id="pc-r" name="raio" type="number" min="30" max="5000" step="10" value="' + esc(c.raio) + '"></div>' +
      '<div class="field"><label for="pc-fu">Fuso horário da empresa</label><select id="pc-fu" name="fu">' + fusoOpts(fusoEmp(), false) + '</select><span class="sub">Define o dia e a hora do ponto e dos checklists. Quem trabalha em outro estado pode ter fuso próprio no cadastro da pessoa.</span></div>' +
      '<label class="check"><input type="checkbox" name="foto"' + (c.foto ? ' checked' : '') + '> Exigir foto em cada marcação</label>' +
      '<label class="check"><input type="checkbox" name="local"' + (c.local ? ' checked' : '') + '> Exigir localização na marcação pelo celular</label>' +
      '<label class="check"><input type="checkbox" name="bloquear"' + (c.bloquear ? ' checked' : '') + '> Não aceitar marcação fora do raio (sem isso, ela entra marcada como "fora do local")</label>' +
      '<fieldset class="sec-num"><legend>Reconhecimento facial</legend><label class="check"><input type="checkbox" name="rosto"' + (c.rosto ? ' checked' : '') + '> Conferir o rosto em cada marcação</label><p class="sub">O cadastro do rosto é feito na primeira marcação de cada pessoa. A comparação roda no próprio aparelho; fica guardado só um código numérico do rosto e a foto do cadastro (LGPD, art. 11, II, "g").</p>' +
      '<div class="field"><label for="pc-rg">Rigor da comparação</label><select id="pc-rg" name="rg">' + rig.map(function (x) { return '<option value="' + x[0] + '"' + (c.rigor === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><span class="lbl-s">Se o rosto não conferir em 3 tentativas</span><label class="check"><input type="radio" name="rb" value="1"' + (c.rostoBloq ? ' checked' : '') + '> Não registrar a marcação</label><label class="check"><input type="radio" name="rb" value="0"' + (c.rostoBloq ? '' : ' checked') + '> Registrar e sinalizar para a empresa</label></div></fieldset>' +
      '<button class="btn btn-primary" type="submit">Salvar regras do ponto</button><p class="ui-sub">A hora vem do servidor, não do celular. As regras valem também no banco de dados, não só na tela.</p></form>';
    var turnos = (S.turnos || []).map(function (t) {
      var cj = conferirJornada(t), n = S.pessoas.filter(function (p) { return p.turno === t.id; }).length, pw = function (cls) { return function (x) { return '<span class="pill ' + cls + ' pill-wrap">' + esc(x) + '</span>'; }; };
      return '<tr><td><strong>' + esc(t.nome) + '</strong><span class="sub">' + esc(escalaTxt(t)) + '</span></td><td>' + esc(horarioTxt(t)) + '<span class="sub">' + fmtHoras(cj.dia) + ' por dia · ' + fmtHoras(cj.semana) + ' por semana' + (t.x1236 ? ' (média)' : '') + '</span></td><td>' +
        cj.graves.map(pw('bad')).join(' ') + (cj.graves.length && t.aceite ? '<span class="sub">Mantido pela empresa: ' + esc(t.aceite.por) + ', ' + esc(t.aceite.em) + '</span>' : '') + ' ' + cj.avisos.map(pw('warn')).join(' ') + (cj.graves.length || cj.avisos.length ? '' : pill('ok', 'Dentro da CLT')) + '<span class="sub">' + n + (n === 1 ? ' pessoa' : ' pessoas') + '</span></td>' +
        '<td class="num"><span class="actions"><button type="button" class="btn btn-sm" data-act="turno-editar" data-id="' + esc(t.id) + '">Editar</button><button type="button" class="btn btn-sm" data-act="turno-del" data-id="' + esc(t.id) + '">Remover</button></span></td></tr>';
    }).join('');
    var cardT = '<div class="card"><div class="card-head"><h2>Turnos de trabalho</h2>' + ((S.turnos || []).length ? '<button type="button" class="btn btn-primary" data-act="turno-editar">Novo turno</button>' : '') + '</div>' +
      (turnos ? '<div class="table-box"><table class="t stack-sm"><thead><tr><th>Turno</th><th>Horário e carga</th><th>Conferência com a CLT</th><th class="num">Ação</th></tr></thead><tbody>' + turnos + '</tbody></table></div>' : '<div class="card-pad stack"><p class="ui-sub">Nenhum turno ainda. Cadastre os horários da empresa uma vez, com quantos intervalos precisar, e escolha o turno ao cadastrar cada pessoa.</p><div><button type="button" class="btn btn-primary btn-lg" data-act="turno-editar">Criar o primeiro turno</button></div></div>') + '</div>';
    var rs = S.rostos || {}, nr = S.pessoas.filter(function (p) { return rs[p.id]; }).length;
    var rostos = c.rosto ? '<div class="card"><div class="card-head"><h2>Rostos cadastrados</h2>' + pill(nr && nr === S.pessoas.length ? 'ok' : 'mute', nr + ' de ' + S.pessoas.length) + '</div><ul class="list">' + (S.pessoas.map(function (p) {
      var r = rs[p.id];
      return '<li><span>' + esc(p.nome) + '<span class="sub">' + (r ? 'cadastrado em ' + esc(quandoTxt(r.em)) : 'ainda não: cadastra na primeira marcação') + '</span></span>' + (r ? '<span class="actions">' + (r.foto ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(r.foto) + '" data-t="Rosto de ' + esc(p.nome) + '">Foto</button>' : '') + '<button type="button" class="btn btn-sm" data-act="rosto-del" data-id="' + esc(p.id) + '">Apagar e recadastrar</button></span>' : '') + '</li>';
    }).join('') || '<li>Cadastre a equipe primeiro.</li>') + '</ul></div>' : '';
    var aba = S.ui.empAba || 'turnos'; if (aba === 'rostos' && !c.rosto) aba = 'turnos';
    return titleRow('Turnos e regras do ponto', 'Horários de trabalho, regras da marcação e rostos ' + ajudaBtn('jornada', 'Regras que o app confere na jornada'), '<button type="button" class="btn" data-act="empresa-editar">Dados da empresa</button>') +
      abas('empAba', [['turnos', 'Turnos de trabalho', (S.turnos || []).length || ''], ['regras', 'Regras do ponto', c.lat == null ? 'falta o local' : ''], c.rosto ? ['rostos', 'Rostos cadastrados', nr + ' de ' + S.pessoas.length] : null], aba) +
      '<div class="aba-corpo">' + (aba === 'regras' ? ponto : aba === 'rostos' ? rostos : cardT) + '</div>';
  }

  /* Documentos da pessoa */
  var DOCS_PESSOA = [
    ['rg', 'RG ou CNH', true, 'Foto da frente e do verso'], ['cpf', 'CPF', false, 'Só se o número não estiver no RG ou na CNH'],
    ['ctps', 'Carteira de Trabalho Digital', true, 'Print da tela com seus dados, no app Carteira de Trabalho Digital'], ['pis', 'PIS/NIS', false, 'Print do número no app Carteira de Trabalho Digital'],
    ['residencia', 'Comprovante de residência', true, 'Conta de água, luz ou telefone dos últimos 3 meses'], ['titulo', 'Título de eleitor', false, 'Ou print do e-Título'],
    ['escolaridade', 'Comprovante de escolaridade', false, 'Diploma, certificado ou declaração da escola'], ['civil', 'Certidão de nascimento ou casamento', false, ''],
    ['reservista', 'Certificado de reservista', false, 'Para homens de 18 a 45 anos'], ['filhos', 'Certidão dos filhos menores de 14 anos', false, 'Para o salário-família'],
    ['vacina', 'Carteira de vacinação dos filhos menores de 7 anos', false, 'Para o salário-família'], ['foto', 'Foto 3x4', false, 'Pode ser uma foto de frente, com fundo claro'],
    ['banco', 'Conta bancária ou chave Pix', true, 'Print com banco, agência e conta, ou a chave Pix'], ['aso', 'Exame admissional (ASO)', false, 'A empresa indica a clínica'], ['outro', 'Outro documento', false, 'O que a empresa pedir']
  ];
  function docsDe(pid) { return (S.docsArq || []).filter(function (d) { return d.pessoa_id === pid; }); }
  function resumoDocs(pid) {
    var ds = docsDe(pid), ob = DOCS_PESSOA.filter(function (x) { return x[2]; });
    var tem = function (k, st) { return ds.some(function (d) { return d.tipo === k && (st ? d.status === st : d.status !== 'recusado'); }); };
    return { ok: ob.filter(function (x) { return tem(x[0], 'aprovado'); }).length, total: ob.length, falta: ob.filter(function (x) { return !tem(x[0]); }).length, conferir: ds.filter(function (d) { return d.status === 'enviado'; }).length };
  }
  function contratosDe(pid) { return (S.contratos || []).filter(function (c) { return c.pessoa === pid; }); }
  function vDocumentos() {
    var func = ehFunc(), decide = S.role === 'empresa' || S.role === 'contador';
    var pid = func ? ME : (S.ui.docPessoa && P(S.ui.docPessoa) ? S.ui.docPessoa : (S.pessoas[0] || {}).id);
    if (!pid) return titleRow('Documentos da equipe', '') + vazioHTML('Cadastre a equipe primeiro', 'Depois do cadastro, cada pessoa envia os documentos pelo app, e você e o contador conferem aqui.', '<a class="btn btn-primary" href="#/equipe">Cadastrar a equipe</a>');
    var p = P(pid), ds = docsDe(pid), r = resumoDocs(pid);
    var tipos = DOCS_PESSOA.map(function (x) {
      var meus = ds.filter(function (d) { return d.tipo === x[0]; });
      var arqs = meus.map(function (d) {
        var pl = d.status === 'aprovado' ? pill('ok', 'Aprovado') : d.status === 'recusado' ? pill('bad', 'Recusado' + (d.motivo ? ': ' + d.motivo : '')) : pill('warn', 'Aguardando conferência');
        return '<li><span><button type="button" class="link-btn" data-act="arq-ver" data-path="' + esc(d.arquivo) + '" data-t="' + esc(x[1]) + '">' + esc(d.nome || 'arquivo') + '</button><span class="sub">enviado em ' + esc(quandoTxt(d.enviado_em)) + (d.decidido_por ? ' · conferido por ' + esc(d.decidido_por) : '') + '</span></span><span class="actions">' + pl +
          (decide && d.status !== 'aprovado' ? '<button type="button" class="btn btn-sm" data-act="doc-ok" data-id="' + esc(d.id) + '">Aprovar</button>' : '') +
          (decide && d.status !== 'recusado' ? '<button type="button" class="btn btn-sm" data-act="doc-nao" data-id="' + esc(d.id) + '">Recusar</button>' : '') +
          (decide || d.status !== 'aprovado' ? '<button type="button" class="btn btn-sm" data-act="doc-del" data-id="' + esc(d.id) + '">Apagar</button>' : '') + '</span></li>';
      }).join('');
      return '<div class="doc-tipo"><div class="doc-tipo-h"><div><strong>' + esc(x[1]) + '</strong>' + (x[2] ? ' ' + pill('mute', 'obrigatório') : '') + (x[3] ? '<span class="sub">' + esc(x[3]) + '</span>' : '') + '</div>' +
        '<span class="btn btn-sm file-btn">' + (meus.length ? 'Enviar outro' : 'Enviar') + '<input type="file" accept="image/*,application/pdf" data-in="doc-enviar" data-tipo="' + x[0] + '" data-pessoa="' + esc(pid) + '" aria-label="Enviar ' + esc(x[1]) + '"></span></div>' + (arqs ? '<ul class="list">' + arqs + '</ul>' : '') + '</div>';
    }).join('');
    var cts = contratosDe(pid).map(function (c) { var m = modeloCt(c.modelo); return '<li><span>' + esc(m ? m.nome : (c.nomeArq || 'Contrato')) + '<span class="sub">' + esc(c.em || '') + (c.arquivo ? ' · assinado enviado' : '') + '</span></span><span class="actions">' + (m && m.tipo !== 'arquivo' ? '<button type="button" class="btn btn-sm" data-act="ct-ver" data-id="' + esc(c.id) + '">Ver</button>' : '') + (m && m.tipo === 'arquivo' ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(m.arquivo) + '" data-t="' + esc(m.nome) + '">Ver</button>' : '') + (c.arquivo ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(c.arquivo) + '" data-t="Contrato assinado">Assinado</button>' : '') + '</span></li>'; }).join('');
    var cabeca = '<div class="card kpis"><div class="kpi"><div class="lbl">Obrigatórios aprovados</div><div class="val num">' + r.ok + ' de ' + r.total + '</div><div class="cap">' + (r.falta ? r.falta + ' ainda não enviado(s)' : 'todos enviados') + '</div></div><div class="kpi"><div class="lbl">Aguardando conferência</div><div class="val num">' + r.conferir + '</div><div class="cap">' + (decide ? 'confira e aprove' : 'a empresa confere') + '</div></div></div>';
    var aviso = '<div class="notice info"><div><strong>Seus documentos ficam protegidos</strong>Só você, a empresa e o contador da empresa veem estes arquivos. Use foto nítida ou PDF; frente e verso podem ir em dois envios.</div></div>';
    if (func) return titleRow('Meus documentos', 'Envie os documentos da sua contratação pelo app') + '<div class="grid-main"><div class="stack">' + proxDocHTML(pid) + cabeca + '<div class="card">' + tipos + '</div></div><div class="stack">' + aviso + (cts ? '<div><h2 class="sec">Meus contratos</h2><div class="card"><ul class="list">' + cts + '</ul></div></div>' : '') + '</div></div>';
    var lista = S.pessoas.map(function (x) { var rr = resumoDocs(x.id); return '<li><span><button type="button" class="link-btn" data-act="doc-pessoa" data-id="' + esc(x.id) + '"' + (x.id === pid ? ' aria-current="true"' : '') + '>' + esc(x.nome) + '</button><span class="sub">' + rr.ok + ' de ' + rr.total + ' obrigatórios aprovados</span></span>' + (rr.conferir ? pill('warn', rr.conferir + ' para conferir') : rr.ok === rr.total ? pill('ok', 'Completo') : pill('mute', rr.falta + ' faltando')) + '</li>'; }).join('');
    return titleRow('Documentos da equipe', 'Cada pessoa envia pelo app; você e o contador conferem') + '<div class="grid-main"><div class="stack"><h2 class="sec">' + esc(p.nome) + '</h2>' + cabeca + '<div class="card">' + tipos + '</div>' + (cts ? '<div><h2 class="sec">Contratos</h2><div class="card"><ul class="list">' + cts + '</ul></div></div>' : '') + '</div>' +
      '<div class="stack"><div><h2 class="sec">Equipe</h2><div class="card"><ul class="list">' + lista + '</ul></div></div>' + aviso.replace('Seus documentos ficam protegidos', 'Arquivos protegidos').replace('Só você, a empresa e o contador da empresa veem estes arquivos.', 'Cada pessoa só vê os próprios documentos; a empresa e o contador veem os da equipe.') + '</div></div>';
  }
  function proxDocHTML(pid) {
    var ds = docsDe(pid), falta = DOCS_PESSOA.filter(function (x) { return x[2] && !ds.some(function (d) { return d.tipo === x[0] && d.status !== 'recusado'; }); }), x = falta[0];
    if (!x) return '<div class="notice info"><div><strong>Documentos obrigatórios enviados</strong>A empresa confere. Se algum for recusado, ele volta para cá com o motivo.</div></div>';
    var rec = ds.some(function (d) { return d.tipo === x[0] && d.status === 'recusado'; });
    return '<div class="card proximo"><div class="proximo-main"><span class="lbl-s">Próximo passo · ' + (falta.length === 1 ? 'falta 1 obrigatório' : 'faltam ' + falta.length + ' obrigatórios') + '</span><strong class="proximo-tit">' + (rec ? 'Enviar de novo: ' : 'Enviar ') + esc(x[1]) + '</strong><span class="ui-sub">' + esc(x[3] || 'Foto nítida ou PDF') + '</span></div><span class="btn btn-primary btn-xl file-btn">Escolher foto ou PDF<input type="file" accept="image/*,application/pdf" data-in="doc-enviar" data-tipo="' + x[0] + '" data-pessoa="' + esc(pid) + '" aria-label="Enviar ' + esc(x[1]) + '"></span></div>';
  }
  function decidirDoc(id, status, motivo) {
    var d = (S.docsArq || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!d) return;
    var por = quemSou(), pr = NUVEM ? Nuvem.decidirDoc(d.id, status, motivo || null, por) : Promise.resolve(null);
    pr.then(function () { d.status = status; d.motivo = motivo || null; d.decidido_em = new Date().toISOString(); d.decidido_por = por; auditar('Documento ' + (status === 'aprovado' ? 'aprovado' : 'recusado'), (P(d.pessoa_id) || {}).nome + ': ' + d.tipo); save(); closeModal(); render(); toast(status === 'aprovado' ? 'Documento aprovado.' : 'Documento recusado. A pessoa vê o motivo no app.'); }, function (e) { toast(erroTxt(e)); });
  }

  /* Holerites em PDF */
  function mesAnterior() { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function compTxt(c) { var p = String(c || '').split('-'); return p.length === 2 ? MESES[+p[1] - 1] + ' de ' + p[0] : c; }
  function holDe(pid, comp) { return (S.holArq || []).filter(function (h) { return h.pessoa_id === pid && h.competencia === comp; })[0]; }
  function holAguardando() { return (S.holArq || []).filter(function (h) { return h.status === 'aguardando'; }); }
  function vHoleritesReal() {
    if (ehFunc()) {
      var meus = (S.holArq || []).filter(function (h) { return h.pessoa_id === ME && h.status === 'liberado'; }).sort(function (a, b) { return a.competencia < b.competencia ? 1 : -1; });
      return titleRow('Seus holerites', 'Aparecem aqui depois que a empresa aprova') + (meus.length ? '<div class="card"><ul class="list">' + meus.map(function (h) { var t = compTxt(h.competencia); return '<li><span>' + esc(t.charAt(0).toUpperCase() + t.slice(1)) + '<span class="sub">Liberado em ' + esc(quandoTxt(h.liberado_em)) + '</span></span><button type="button" class="btn btn-sm btn-primary" data-act="arq-ver" data-path="' + esc(h.arquivo) + '" data-t="Holerite de ' + esc(t) + '">Abrir</button></li>'; }).join('') + '</ul></div>' :
        vazioHTML('Nenhum holerite liberado ainda', 'Quando o contador enviar e a empresa aprovar, o holerite aparece aqui para abrir e baixar.', ''));
    }
    var comp = S.ui.comp || mesAnterior(), emp = S.role === 'empresa';
    var rows = S.pessoas.map(function (p) {
      var h = holDe(p.id, comp), st = !h ? pill('mute', 'Não enviado') : h.status === 'liberado' ? pill('ok', 'Liberado') : pill('warn', 'Aguardando aprovação');
      return '<tr>' + (emp ? '<td><input type="checkbox" data-in="sel-hol" data-id="' + esc(h ? h.id : '') + '"' + (!h || h.status === 'liberado' ? ' disabled' : '') + ' aria-label="Selecionar ' + esc(p.nome) + '"></td>' : '') +
        '<td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao || '') + '</span></td><td>' + st + (h ? '<span class="sub">enviado em ' + esc(quandoTxt(h.enviado_em)) + '</span>' : '') + '</td><td class="num"><span class="actions">' +
        (h ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(h.arquivo) + '" data-t="Holerite de ' + esc(p.nome) + '">Ver</button>' : '') +
        (!h || h.status !== 'liberado' ? '<span class="btn btn-sm file-btn">' + (h ? 'Trocar PDF' : 'Enviar PDF') + '<input type="file" accept="application/pdf,image/*" data-in="hol-enviar" data-id="' + esc(p.id) + '" aria-label="Enviar holerite de ' + esc(p.nome) + '"></span>' : '') +
        (emp && h && h.status !== 'liberado' ? '<button type="button" class="btn btn-sm btn-primary" data-act="hol-liberar" data-id="' + esc(h.id) + '">Aprovar</button>' : '') + '</span></td></tr>';
    }).join('');
    var env = S.pessoas.filter(function (p) { return holDe(p.id, comp); }).length, lib = S.pessoas.filter(function (p) { var h = holDe(p.id, comp); return h && h.status === 'liberado'; }).length;
    return titleRow('Holerites', 'Competência de ' + esc(compTxt(comp)) + ' · o contador envia o PDF de cada pessoa, a empresa aprova e o funcionário recebe no app', emp ? '<button type="button" class="btn" data-act="hol-liberar-sel">Aprovar selecionados</button><button type="button" class="btn btn-primary" data-act="hol-liberar-todos"' + (env - lib ? '' : ' disabled') + '>Aprovar todos os enviados (' + (env - lib) + ')</button>' : '') +
      (function () { var n = S.pessoas.length, ps = [['Escolher o mês (competência)', true], ['Contador envia o PDF de cada pessoa · ' + env + ' de ' + n, n > 0 && env >= n], ['Empresa confere e aprova · ' + lib + ' de ' + env, env > 0 && lib >= env], ['Cada pessoa recebe no app', n > 0 && lib >= n]], at = ps.filter(function (x) { return !x[1]; })[0]; return '<ol class="mini-passos">' + ps.map(function (x) { return '<li class="' + (x[1] ? 'feito' : x === at ? 'atual' : '') + '">' + esc(x[0]) + '</li>'; }).join('') + '</ol>'; })() +
      '<div class="stack"><div class="card card-pad form-grid"><div class="field"><label for="h-comp">Competência</label><input id="h-comp" type="month" value="' + esc(comp) + '" data-in="hol-comp"></div><div class="field"><span class="lbl-s">Situação</span><p class="num"><strong>' + env + ' de ' + S.pessoas.length + '</strong> enviados · <strong>' + lib + '</strong> liberados</p></div></div>' +
      '<div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr>' + (emp ? '<th><span class="sr-only">Selecionar</span></th>' : '') + '<th>Pessoa</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Cadastre a equipe primeiro.</td></tr>') + '</tbody></table></div></div>' +
      '<p class="ui-sub">O PDF sai do sistema de folha do contador. O funcionário só vê o holerite depois da aprovação da empresa.</p></div>';
  }
  function liberarHol(ids) {
    ids = ids.filter(Boolean); if (!ids.length) { toast('Selecione ao menos um holerite enviado.'); return; }
    (NUVEM ? Nuvem.liberarHolerites(ids) : Promise.resolve(null)).then(function () {
      var quando = new Date().toISOString(); (S.holArq || []).forEach(function (h) { if (ids.indexOf(String(h.id)) > -1) { h.status = 'liberado'; h.liberado_em = quando; } });
      auditar('Holerites aprovados', ids.length + ' holerite(s)'); save(); render(); toast(ids.length + ' holerite(s) liberado(s) para a equipe.');
    }, function (e) { toast(erroTxt(e)); });
  }

  /* Modelos de contrato */
  var CAMPOS_CT = [['nome', 'nome do empregado'], ['cpf', 'CPF'], ['funcao', 'função'], ['salario', 'salário'], ['admissao', 'data de admissão'], ['empresa', 'razão social'], ['cnpj', 'CNPJ'], ['endereco', 'endereço da empresa'], ['cidade', 'cidade/UF'], ['hoje', 'data de hoje']];
  function modeloCt(id) { return (S.modelosCt || []).filter(function (m) { return m.id === id; })[0]; }
  function valoresCt(p) { var e = S.empresa; return { nome: p.nome, cpf: p.cpf || '[CPF]', funcao: p.funcao || '', salario: 'R$ ' + brl(p.salario || 0), admissao: p.admissao ? dmyy(p.admissao) : '', empresa: e.razao || e.nome, cnpj: e.cnpj || '', endereco: e.endereco || '', cidade: e.cidade || '', hoje: new Date().toLocaleDateString('pt-BR') }; }
  var TAGS_OK = /^(P|H1|H2|H3|H4|STRONG|B|EM|I|U|BR|OL|UL|LI|SPAN|DIV|TABLE|THEAD|TBODY|TR|TD|TH|SECTION|ARTICLE|SMALL|SUP|SUB)$/;
  // O texto do contrato é guardado sem scripts, links e atributos (só a classe), para ninguém injetar nada na tela de outra pessoa.
  function limparHTML(html) {
    var d = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'), raiz = d.body.firstChild;
    $$('.wm, .notice, script, style, iframe, img, a, button, input, form, svg', raiz).forEach(function (n) { n.remove(); });
    (function anda(n) { Array.prototype.slice.call(n.children).forEach(function (c) { if (!TAGS_OK.test(c.tagName)) { var t = d.createElement('span'); t.textContent = c.textContent; c.replaceWith(t); return; } Array.prototype.slice.call(c.attributes).forEach(function (a) { if (a.name !== 'class') c.removeAttribute(a.name); }); anda(c); }); })(raiz);
    return raiz.innerHTML.slice(0, 120000);
  }
  function htmlDoModelo(m, p) {
    var v = valoresCt(p);
    if (m.tipo === 'gerado') return limparHTML(m.html).split('[NOME DO EMPREGADO]').join(esc(v.nome)).split('[CPF]').join(esc(v.cpf));
    return '<h2 class="center">' + esc(m.nome) + '</h2>' + String(m.texto || '').split(/\n\s*\n/).map(function (par) {
      return '<p>' + esc(par).replace(/\n/g, '<br>').replace(/\{\{\s*([a-z]+)\s*\}\}/g, function (todo, k) { return v[k] != null ? '<strong>' + esc(v[k]) + '</strong>' : todo; }) + '</p>';
    }).join('');
  }
  function vCtModelos() {
    var ms = (S.modelosCt || []).map(function (m) {
      var n = (S.contratos || []).filter(function (c) { return c.modelo === m.id; }).length;
      return '<tr><td><strong>' + esc(m.nome) + '</strong><span class="sub">' + ({ gerado: 'Feito no gerador do Seu Comando', texto: 'Texto próprio, com campos preenchidos automaticamente', arquivo: 'Arquivo pronto (' + esc(m.nomeArq || '') + ')' }[m.tipo]) + ' · ' + esc(m.em || '') + '</span></td><td class="num hide-sm">' + n + '</td>' +
        '<td class="num"><span class="actions"><button type="button" class="btn btn-sm btn-primary" data-act="ct-aplicar" data-id="' + esc(m.id) + '">Usar para a equipe</button>' + (m.tipo === 'arquivo' ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(m.arquivo) + '" data-t="' + esc(m.nome) + '">Ver</button>' : '<button type="button" class="btn btn-sm" data-act="ct-modelo-ver" data-id="' + esc(m.id) + '">Ver</button>') + '<button type="button" class="btn btn-sm" data-act="ct-modelo-del" data-id="' + esc(m.id) + '">Remover</button></span></td></tr>';
    }).join('');
    var tabela = '<div class="card"><div class="card-head"><h2>Modelos da empresa</h2><span class="ui-sub">Cadastre uma vez e use para quantas pessoas quiser</span></div>' + (ms ? '<div class="table-box"><table class="t stack-sm"><thead><tr><th>Modelo</th><th class="num hide-sm">Contratos gerados</th><th class="num">Ação</th></tr></thead><tbody>' + ms + '</tbody></table></div>' : '<p class="card-pad ui-sub">Nenhum modelo ainda. Salve um contrato do gerador como modelo, cole o texto do contrato que você já usa ou envie o arquivo pronto.</p>') + '</div>';
    var texto = '<form class="card card-pad stack" data-form="ct-modelo-texto"><h2 class="sec">Cadastrar o contrato que você já usa</h2><div class="field"><label for="mt-n">Nome do modelo</label><input id="mt-n" name="n" maxlength="80" required placeholder="Ex.: Contrato de experiência · atendente"></div>' +
      '<div class="field"><label for="mt-x">Texto do contrato</label><textarea id="mt-x" name="x" rows="10" maxlength="60000" required placeholder="Cole aqui o texto. Onde entra o dado de cada pessoa, escreva o campo entre chaves duplas, como {{nome}}."></textarea><span class="sub">Campos: ' + CAMPOS_CT.map(function (c) { return '{{' + c[0] + '}} ' + c[1]; }).join(' · ') + '</span></div><button class="btn btn-primary" type="submit">Salvar modelo</button></form>';
    var arq = '<div class="card card-pad stack"><h2 class="sec">Enviar um contrato pronto em arquivo</h2><p class="ui-sub">PDF ou Word. O arquivo fica como modelo da empresa e pode ser ligado às pessoas, mas não é preenchido automaticamente: para isso, use o texto acima.</p><div class="field"><label for="ma-n">Nome do modelo</label><input id="ma-n" maxlength="80" placeholder="Ex.: Contrato padrão da loja"></div><span class="btn file-btn">Escolher arquivo<input type="file" accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-in="ct-modelo-arq" aria-label="Enviar contrato pronto"></span></div>';
    return '<div class="grid-main"><div class="stack">' + tabela + texto + '</div><div class="stack">' + arq + '<div class="notice info"><div><strong>Do gerador para o modelo</strong>Na aba "Gerar contrato", escolha o enquadramento e clique em "Salvar como modelo". O nome e o CPF ficam em branco e são preenchidos com os dados de cada pessoa.</div></div></div></div>';
  }
  function vCtEquipe() {
    var rows = (S.contratos || []).slice().reverse().map(function (c) {
      var p = P(c.pessoa), m = modeloCt(c.modelo); if (!p) return '';
      return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao || '') + '</span></td><td>' + esc(m ? m.nome : (c.nomeArq || 'Contrato enviado')) + '<span class="sub">' + esc(c.em || '') + '</span></td><td>' + (c.arquivo ? pill('ok', 'Assinado enviado') : pill('warn', 'Falta o assinado')) + '</td>' +
        '<td class="num"><span class="actions">' + (m && m.tipo !== 'arquivo' ? '<button type="button" class="btn btn-sm' + (c.arquivo ? '' : ' btn-primary') + '" data-act="ct-ver" data-id="' + esc(c.id) + '">Ver e baixar</button>' : '') + (m && m.tipo === 'arquivo' ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(m.arquivo) + '" data-t="' + esc(m.nome) + '">Modelo</button>' : '') +
        (c.arquivo ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(c.arquivo) + '" data-t="Contrato assinado de ' + esc(p.nome) + '">Assinado</button>' : '<span class="btn btn-sm file-btn">Enviar assinado<input type="file" accept="application/pdf,image/*" data-in="ct-assinado" data-id="' + esc(c.id) + '" aria-label="Enviar contrato assinado de ' + esc(p.nome) + '"></span>') +
        '<button type="button" class="btn btn-sm" data-act="ct-del" data-id="' + esc(c.id) + '">Remover</button></span></td></tr>';
    }).join('');
    var opts = S.pessoas.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + '</option>'; }).join('');
    var falta = (S.contratos || []).filter(function (c) { return !c.arquivo && P(c.pessoa); }).length;
    return (falta ? '<ol class="mini-passos n3"><li class="feito">Contrato gerado</li><li class="atual">Baixar ("Ver e baixar"), imprimir e colher a assinatura</li><li>Enviar o assinado ("Enviar assinado")</li></ol>' : '') + '<div class="grid-main"><div class="card"><div class="card-head"><h2>Contratos da equipe</h2><span class="ui-sub">Gerados pelos modelos ou enviados já assinados</span></div>' + (rows ? '<div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th>Contrato</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="card-pad ui-sub">Nenhum contrato ainda. Em "Modelos da empresa", use um modelo para várias pessoas de uma vez, ou cadastre ao lado um contrato que já está assinado.</p>') + '</div>' +
      '<div class="stack"><div class="card card-pad stack"><h2 class="sec">Cadastrar contrato já assinado</h2>' + (opts ? '<div class="field"><label for="cp-p">Pessoa</label><select id="cp-p">' + opts + '</select></div><span class="btn btn-primary file-btn">Escolher o arquivo assinado<input type="file" accept="application/pdf,image/*" data-in="ct-pronto" aria-label="Enviar contrato assinado"></span><p class="ui-sub">PDF ou foto das páginas. A pessoa também vê o contrato em "Meus documentos".</p>' : '<p class="ui-sub">Cadastre a equipe primeiro.</p>') + '</div></div></div>';
  }
  function abasContrato(atual) { return '<div class="tabs" role="tablist">' + [['equipe', 'Contratos da equipe (' + (S.contratos || []).length + ')'], ['modelos', 'Modelos da empresa (' + (S.modelosCt || []).length + ')'], ['gerar', 'Gerador por função']].map(function (t) { return '<button type="button" role="tab" data-act="ct-tab" data-v="' + t[0] + '" aria-selected="' + (atual === t[0]) + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>'; }

  function kpiHolFunc() { var u = (S.holArq || []).filter(function (h) { return h.pessoa_id === ME && h.status === 'liberado'; }).sort(function (a, b) { return a.competencia < b.competencia ? 1 : -1; })[0]; return '<div class="kpi"><div class="lbl">Último holerite</div><div class="val num">' + (u ? esc(compTxt(u.competencia)) : 'nenhum ainda') + '</div><div class="cap">' + (u ? '<a href="#/holerites">abrir</a>' : 'aparece quando a empresa aprovar') + '</div></div>'; }
  function kpiDocsFunc() { var r = resumoDocs(ME); return '<div class="kpi"><div class="lbl">Meus documentos</div><div class="val num">' + r.ok + ' de ' + r.total + '</div><div class="cap"><a href="#/documentos">' + (r.falta ? 'enviar os que faltam' : 'ver documentos') + '</a></div></div>'; }

  /* Ajuste de marcação: o registro original fica; o ajuste vale por cima, com motivo e aprovação */
  function ajustesDe(pid, dia, st) { return (S.ajustes || []).filter(function (a) { return a.pessoa_id === pid && (!dia || a.dia === dia) && (!st || a.status === st); }); }
  function marcasDia(pid, dia) {
    var o = [], tz = fusoDe(P(pid)); for (var i = 0; i <= SAIDA; i++) o.push(null);
    regsDe(pid, dia).forEach(function (r) { if (r.tipo >= 0 && r.tipo <= SAIDA) o[r.tipo] = { hora: hhmm(r.em, tz), r: r }; });
    ajustesDe(pid, dia, 'aprovado').sort(function (a, b) { return String(a.decidido_em) < String(b.decidido_em) ? -1 : 1; }).forEach(function (a) { if (!(a.tipo >= 0 && a.tipo <= SAIDA)) return; var antes = o[a.tipo]; o[a.tipo] = { hora: a.acao === 'desconsiderar' ? '' : a.hora, a: a, antes: antes && (antes.r ? antes : antes.antes) }; });
    return o;
  }
  // Próxima marcação pela sequência da pessoa. "alt": a outra opção do momento (encerrar o dia sem o intervalo, ou sair para mais um intervalo).
  // Uma marcação já registrada ou incluída por ajuste não se repete no dia (o banco não aceita a mesma marcação duas vezes).
  function proxInfo(pid) {
    var oc = {}, n = nIvs(pid), k = -1, i;
    if (S.real) oc = ocupados(pid, diaAberto(pid)); else mk(pid).forEach(function (h, t) { if (h) oc[t] = 1; });
    if (oc[SAIDA]) return { prox: -1, alt: null, n: n };
    for (i = 0; i < SAIDA; i++) if (oc[i]) k = i;
    if (k < 0) return { prox: 0, alt: null, n: n };
    var prox = k % 2 ? k + 1 : (k + 1 <= 2 * n ? k + 1 : SAIDA), alt = null;
    if (prox !== SAIDA && prox % 2) alt = SAIDA; else if (prox === SAIDA && k < 8) alt = k + 1;
    return { prox: prox, alt: alt, n: n };
  }
  function proxTipo(pid) { return proxInfo(pid).prox; }
  var ACAO_AJ = { incluir: 'inclusão', corrigir: 'correção de horário', desconsiderar: 'desconsiderar' };
  function ajusteForm(pid, direto) {
    var h = hojeEm(fusoDe(P(pid))), n = nIvs(pid), ts = sequenciaDe(pid); if (n < 4) ts.splice(ts.length - 1, 0, 2 * n + 1, 2 * n + 2);
    return '<form class="stack" data-form="ajuste" data-pessoa="' + esc(pid) + '" data-direto="' + (direto ? 1 : 0) + '"><div class="form-grid"><div class="field"><label for="aj-d">Dia</label><input id="aj-d" name="d" type="date" max="' + h + '" min="' + addDays(h, -45) + '" value="' + h + '" required></div>' +
      '<div class="field"><label for="aj-t">Marcação</label><select id="aj-t" name="t">' + ts.map(function (t) { return '<option value="' + t + '">' + esc(nomeTipo(t, n)) + '</option>'; }).join('') + '</select></div></div>' +
      (direto ? '<div class="field"><label for="aj-a">O que fazer</label><select id="aj-a" name="a"><option value="auto">Incluir a marcação que faltou ou corrigir o horário</option><option value="desconsiderar">Desconsiderar a marcação (registro errado)</option></select></div>' : '') +
      '<div class="field"><label for="aj-h">Horário correto</label><input id="aj-h" name="h" type="time"></div>' +
      '<div class="field"><label for="aj-m">Motivo</label><textarea id="aj-m" name="m" rows="3" maxlength="300" required placeholder="Ex.: esqueci de marcar a saída; saí às 17:50"></textarea></div>' +
      '<p class="ui-sub">A marcação original não é apagada nem alterada. O ajuste fica registrado à parte, com o motivo, quem pediu e quem aprovou (Portaria MTP 671/2021).</p><button class="btn btn-primary" type="submit">' + (direto ? 'Registrar ajuste' : 'Enviar pedido para a empresa') + '</button></form>';
  }
  function ajustesHTML(lista, decide) {
    if (!lista.length) return '';
    return '<ul class="list">' + lista.map(function (a) {
      var st = a.status === 'aprovado' ? pill('ok', 'Aprovado') : a.status === 'recusado' ? pill('bad', 'Recusado') : pill('warn', 'Aguardando a empresa');
      return '<li><span><strong>' + esc((P(a.pessoa_id) || {}).nome || '') + '</strong> · ' + dmyy(a.dia) + ' · ' + esc(tipoNome(a.pessoa_id, a.tipo)) + (a.hora ? ' às ' + esc(a.hora) : '') + ' <span class="sub">' + esc(ACAO_AJ[a.acao]) + ': ' + esc(a.motivo) + ' · pedido por ' + esc(a.pedido_nome || '') + ' em ' + esc(quandoTxt(a.pedido_em)) + (a.decidido_nome ? ' · decidido por ' + esc(a.decidido_nome) : '') + (a.resposta ? ' · resposta: ' + esc(a.resposta) : '') + '</span></span><span class="actions">' + st +
        (decide && a.status === 'pendente' ? '<button type="button" class="btn btn-sm btn-primary" data-act="aj-ok" data-id="' + esc(a.id) + '">Aprovar</button><button type="button" class="btn btn-sm" data-act="aj-nao" data-id="' + esc(a.id) + '">Recusar</button>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function decidirAjuste(id, status, resposta) {
    var a = (S.ajustes || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!a) return;
    (NUVEM ? Nuvem.decidirAjuste(a.id, status, quemSou(), resposta) : Promise.resolve(null)).then(function (x) {
      if (x) Object.assign(a, x); else { a.status = status; a.decidido_nome = quemSou(); a.decidido_em = new Date().toISOString(); a.resposta = resposta || null; }
      pontoHoje(); auditar('Ajuste de ponto ' + (status === 'aprovado' ? 'aprovado' : 'recusado'), ((P(a.pessoa_id) || {}).nome || '') + ' · ' + dmyy(a.dia) + ' · ' + tipoNome(a.pessoa_id, a.tipo) + (a.hora ? ' ' + a.hora : '') + ': ' + a.motivo);
      save(); closeModal(); render(); toast(status === 'aprovado' ? 'Ajuste aprovado. A marcação original continua guardada.' : 'Pedido recusado. A pessoa vê a resposta no app.');
    }, function (e) { toast(erroTxt(e)); });
  }
  var MODELO_PEND = '';
  /* ---------- Modo conectado (login e banco de dados) ---------- */
  var NUVEM = !!(window.Nuvem && Nuvem.ativa) && !EXEMPLO;
  var SNAP = null, MEMBROS = [], VINCULOS = [], PUBLICADO = {}, tSync = null, tPend = null;
  var LISTAS = ['atestados', 'advertencias', 'vales', 'banco'];
  function semUI(s) { var c = clone(s); delete c.ui; delete c.role; delete c.nuvemPessoa; delete c.registros; delete c.docsArq; delete c.holArq; delete c.ajustes; delete c.ckRegs; delete c.rostos; return c; }
  function pessoaEm(D, id) { return (D.pessoas || []).filter(function (p) { return p.id === id; })[0]; }
  function porId(l) { var m = {}; (l || []).forEach(function (x) { if (x && x.id) m[x.id] = x; }); return m; }
  function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function limpa(v) { var s = JSON.stringify(v || {}); if (s.length > 20000) throw new Error('grande'); return JSON.parse(s); }
  // Funcionário e gerente não gravam o documento da empresa: enviam só o que fizeram (ponto, atestado, curso...).
  function diffOps(a, b) {
    var ops = [];
    // ponto não vai mais por aqui: cada marcação é gravada direto na tabela do ponto, com a hora do servidor
    LISTAS.forEach(function (n) { var A = porId(a[n]); (b[n] || []).forEach(function (x) { if (!x || !x.id) return; var o = A[x.id]; if (!o) ops.push({ k: 'add', l: n, v: x }); else Object.keys(x).forEach(function (c) { if (!igual(x[c], o[c])) ops.push({ k: 'set', l: n, id: x.id, c: c, v: x[c] }); }); }); });
    ((b.bp || {}).temps || []).slice(((a.bp || {}).temps || []).length).forEach(function (x) { ops.push({ k: 'add', l: 'temps', v: x }); });
    var CA = porId((a.compras || {}).itens); ((b.compras || {}).itens || []).forEach(function (x) { var o = CA[x.id]; if (!o) ops.push({ k: 'add', l: 'compras', v: x }); else Object.keys(x).forEach(function (c) { if (!igual(x[c], o[c])) ops.push({ k: 'set', l: 'compras', id: x.id, c: c, v: x[c] }); }); });
    // checklists também não: cada etapa marcada é gravada direto na tabela, com a hora do servidor
    var tb = (b.treinos || {})[ME] || {}, ta = (a.treinos || {})[ME] || {}; Object.keys(tb).forEach(function (cid) { if (!igual(tb[cid], ta[cid])) ops.push({ k: 'treino', id: cid, v: tb[cid] }); });
    return ops;
  }
  // A empresa aplica o que chegou, conferindo se cada coisa é permitida a quem fez. Ponto: vale a hora do servidor.
  function aplicarOps(D, ops, pid, papel, perms, quando, local) {
    var tem = function (p) { return papel === 'gerente' && (perms || []).indexOf(p) > -1; }, n = 0, rej = 0, eu = pessoaEm(D, pid) || {};
    var hora = quando ? new Date(quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '';
    var dataHora = quando ? new Date(quando).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 17).replace(',', '') : agora();
    (Array.isArray(ops) ? ops : []).slice(0, 200).forEach(function (o) {
      var ok = false;
      try {
        if (o.k === 'ponto' && (o.p === pid || tem('ponto')) && o.i >= 0 && o.i < 4 && typeof o.v === 'string' && o.v) {
          D.ponto = D.ponto || {}; var m = D.ponto[o.p] || (D.ponto[o.p] = ['', '', '', '']); if (!m[o.i]) { m[o.i] = local ? o.v : (hora || o.v); ok = true; }
        } else if (o.k === 'add' && o.v && typeof o.v === 'object') {
          var v = limpa(o.v);
          if (o.l === 'atestados' && v.pessoa === pid) { D.atestados.push(v); ok = true; }
          else if (o.l === 'banco' && tem('banco') && typeof v.min === 'number' && Math.abs(v.min) <= 2640 && pessoaEm(D, v.pessoa)) {
            v.por = pid; v.porNome = eu.nome || 'Gerente'; if (!local) v.em = dataHora; D.banco = D.banco || []; D.banco.push(v);
            if (!local) { D.auditoria = D.auditoria || []; D.auditoria.unshift({ em: dataHora, por: v.porNome, acao: 'Banco de horas', detalhe: (pessoaEm(D, v.pessoa) || {}).nome + ' ' + fmtMin(v.min) + ': ' + String(v.motivo || '').slice(0, 120) }); }
            ok = true;
          } else if (o.l === 'temps' && D.bp && (v.por === pid || tem('boas')) && typeof v.t === 'number') { D.bp.temps.push(v); ok = true; }
          else if (o.l === 'compras' && (v.por === pid || tem('estoque'))) { D.compras = D.compras || { itens: [] }; D.compras.itens.push(v); ok = true; }
        } else if (o.k === 'set') {
          var lista = o.l === 'compras' ? (D.compras || {}).itens : D[o.l], item = (lista || []).filter(function (x) { return x.id === o.id; })[0];
          var regra = { atestados: ['foto', 'ciencia', 'arquivo'], advertencias: ['ciencia', 'cienciaEm', 'recusa'], vales: ['assinado'], compras: ['qtd', 'comprado', 'obs'] }[o.l] || [];
          if (item && regra.indexOf(o.c) > -1 && (o.l === 'compras' ? (item.por === pid || tem('estoque')) : item.pessoa === pid)) { item[o.c] = limpa({ v: o.v }).v; ok = true; }
        } else if (o.k === 'ck') {
          var ck = (D.checklists || []).filter(function (x) { return x.id === o.id; })[0];
          if (ck && ck.itens[o.j] && ['feito', 'fotoEm', 'por', 'arquivo'].indexOf(o.c) > -1 && (ck.resp === pid || ck.setor === eu.setor || tem('checklists'))) { ck.itens[o.j][o.c] = limpa({ v: o.v }).v; ok = true; }
        } else if (o.k === 'treino' && o.v && +o.v.nota >= 0 && +o.v.nota <= 100) {
          D.treinos = D.treinos || {}; (D.treinos[pid] = D.treinos[pid] || {})[String(o.id).slice(0, 30)] = { nota: +o.v.nota, em: String(o.v.em || '').slice(0, 10) }; ok = true;
        }
      } catch (e) { ok = false; }
      if (ok) n++; else rej++;
    });
    return rej ? (n ? 'parcial' : 'rejeitado') : 'ok';
  }
  // O que cada funcionário (ou gerente) recebe: só os próprios dados, mais o que a permissão libera.
  function subsetPara(D, pid, papel, perms) {
    var tem = function (p) { return papel === 'gerente' && (perms || []).indexOf(p) > -1; }, eu = pessoaEm(D, pid); if (!eu) return null;
    var dono = function (x) { return x && x.pessoa === pid; }, equipe = tem('ponto') || tem('banco') || tem('checklists');
    var pub = function (p) { return p.id === pid ? p : { id: p.id, nome: p.nome, funcao: p.funcao, setor: p.setor, escala: p.escala, celular: p.celular, turno: p.turno, jornada: p.jornada, fuso: p.fuso }; };
    var so = function (obj) { var o = {}; o[pid] = (obj || {})[pid]; return o; };
    var e = D.empresa || {};
    return {
      empresa: { nome: e.nome, razao: e.razao, cnpj: e.cnpj, cidade: e.cidade, endereco: e.endereco, codigo: e.codigo, ponto: e.ponto, fuso: e.fuso, modulos: e.modulos }, tipo: D.tipo, plano: D.plano, hoje: D.hoje, real: true, agencia: D.agencia,
      pessoas: equipe ? (D.pessoas || []).map(pub) : [eu], ponto: tem('ponto') ? D.ponto : so(D.ponto), marcacoesMetodo: tem('ponto') ? D.marcacoesMetodo : so(D.marcacoesMetodo),
      atestados: (D.atestados || []).filter(dono), advertencias: (D.advertencias || []).filter(dono), faltas: (D.faltas || []).filter(dono), horasExtras: so(D.horasExtras),
      holerites: D.holerites, vales: (D.vales || []).filter(dono),
      produtos: tem('estoque') ? D.produtos : (D.produtos || []).map(function (p) { return { id: p.id, nome: p.nome, un: p.un, qtd: p.qtd, min: p.min, ideal: p.ideal, validade: p.validade, lote: p.lote, cod: p.cod, fornecedor: p.fornecedor }; }),
      compras: { itens: ((D.compras || {}).itens || []).filter(function (i) { return tem('estoque') || i.por === pid; }).map(function (i) { if (tem('estoque')) return i; var c = {}; Object.keys(i).forEach(function (k) { if (k !== 'custo') c[k] = i[k]; }); return c; }) },
      checklists: (D.checklists || []).filter(function (c) { return tem('checklists') || c.resp === pid || c.setor === eu.setor; }),
      vagas: [], admissoes: [], clientes: [], treinos: so(D.treinos), banco: (D.banco || []).filter(function (b) { return tem('banco') || dono(b); }),
      bp: D.bp ? { ativo: D.bp.ativo, equip: D.bp.equip, temps: (D.bp.temps || []).slice(-60), docs: [] } : undefined,
      acessos: (function () { var a = {}; a[pid] = { papel: papel, perms: perms || [] }; return a; })(), auditoria: [], turnos: D.turnos || [],
      contratos: (D.contratos || []).filter(function (c) { return c.pessoa === pid; }), modelosCt: (D.modelosCt || []).filter(function (m) { return (D.contratos || []).some(function (c) { return c.pessoa === pid && c.modelo === m.id; }); })
    };
  }
  // Publica a parte de cada pessoa com acesso ao app (mesmo antes do primeiro acesso: o banco só entrega a ela).
  function publicarDocs(forcar, soPessoa) {
    var docs = []; (S.pessoas || []).forEach(function (p) {
      var a = acessoDe(p.id); if (a.papel === 'nenhum' || (soPessoa && p.id !== soPessoa)) return;
      var sub = subsetPara(S, p.id, a.papel, a.perms); if (!sub) return;
      var j = JSON.stringify(sub); if (!forcar && PUBLICADO[p.id] === j) return; PUBLICADO[p.id] = j; docs.push({ pessoa_id: p.id, dados: sub });
    });
    return Nuvem.publicar(docs).catch(function () { docs.forEach(function (d) { delete PUBLICADO[d.pessoa_id]; }); });
  }
  function agendarSync() { clearTimeout(tSync); tSync = setTimeout(sincronizar, 600); }
  function sincronizar() {
    if (!Nuvem.empresa || !SNAP) return;
    if (ehFunc()) {
      var ops = diffOps(SNAP, S); if (!ops.length) return;
      var antes = clone(S);
      Nuvem.enviarOps(ops).then(function () { SNAP = antes; }, function () { toast('Sem conexão: o registro fica guardado e é enviado assim que a internet voltar.'); setTimeout(agendarSync, 8000); });
      return;
    }
    var dados = semUI(S);
    Nuvem.salvar(dados).then(function () { SNAP = clone(S); publicarDocs(); }, function (e) {
      if (e.codigo === 'conflito_versao') { toast('Outra pessoa salvou alterações ao mesmo tempo. Atualizei a tela com a versão mais nova.'); carregarNuvem(); }
      else { toast('Sem conexão: tentando salvar de novo…'); setTimeout(agendarSync, 8000); }
    });
  }
  var CAMPOS_TRIAGEM = { n: 80, fone: 20, email: 80, bairro: 60, regime: 10, fds: 10, inicio: 10, transporte: 10, pretensao: 12, ultima: 120, jaTrabalhou: 10, escolaridade: 4, sit1: 400, sit2: 300 };
  function candidatoDe(d) {
    var c = { novo: true, em: new Date().toISOString() };
    Object.keys(CAMPOS_TRIAGEM).forEach(function (k) { if (d[k] != null) c[k] = String(d[k]).slice(0, CAMPOS_TRIAGEM[k]); });
    c.km = Math.max(0, Math.min(99, +d.km || 0)); c.exp = Math.max(0, Math.min(40, +d.exp || 0));
    c.turnos = (Array.isArray(d.turnos) ? d.turnos : []).filter(function (t) { return ['manha', 'tarde', 'noite', 'fds'].indexOf(t) > -1; });
    c.reqs = {}; Object.keys(d.reqs || {}).slice(0, 20).forEach(function (k) { c.reqs[String(k).slice(0, 20)] = d.reqs[k] === 'sim' ? 'sim' : 'nao'; });
    c.contato = !!d.contato; if (d.compartilhar !== undefined) c.compartilhar = !!d.compartilhar;
    return c;
  }
  function processarPendencias() {
    if (ehFunc()) return Promise.resolve();
    var mudou = false;
    return Nuvem.eventosPendentes().then(function (evs) {
      return evs.reduce(function (p, ev) {
        return p.then(function () {
          // quem fez (conta ligada à pessoa) e o que o dono permitiu a essa pessoa em Equipe e acessos
          var m = MEMBROS.filter(function (x) { return x.user_id === ev.user_id && x.pessoa_id === ev.pessoa_id; })[0], ac = acessoDe(ev.pessoa_id);
          var res = m && ac.papel !== 'nenhum' ? aplicarOps(S, ev.ops, ev.pessoa_id, ac.papel, ac.perms, ev.criado_em, false) : 'rejeitado';
          if (res !== 'rejeitado') mudou = true; return Nuvem.marcarEvento(ev.id, res);
        });
      }, Promise.resolve());
    }).then(function () { return Nuvem.candidaturas(); }).then(function (cs) {
      return cs.reduce(function (p, c) {
        return p.then(function () { var v = S.vagas.filter(function (x) { return x.id === c.vaga_id; })[0]; if (v) { v.cands.push(candidatoDe(c.dados || {})); mudou = true; } return Nuvem.marcarCandidatura(c.id); });
      }, Promise.resolve());
    }).then(function () { return carregarEnvios(); }).then(carregarReais).then(function (novos) { if (mudou) sincronizar(); if ((mudou || novos || /selecao|vagas/.test(location.hash)) && !$('.overlay')) render(); }).catch(function () { /* tenta no próximo ciclo */ });
  }
  // O que o dono definiu em Equipe e acessos vale também no banco (ex.: quem virou gerente antes do primeiro acesso).
  function sincronizarAcessos() {
    if (S.role !== 'empresa') return;
    MEMBROS.forEach(function (m) {
      if (['funcionario', 'gerente'].indexOf(m.papel) < 0 || !m.pessoa_id) return;
      var a = acessoDe(m.pessoa_id), alvo = a.papel === 'nenhum' ? 'nenhum' : a.papel, perms = alvo === 'gerente' ? a.perms : [];
      if (alvo === m.papel && igual((m.permissoes || []).slice().sort(), perms.slice().sort())) return;
      Nuvem.alterarAcesso(m.pessoa_id, alvo, perms, (P(m.pessoa_id) || {}).nome).then(function () { m.papel = alvo; m.permissoes = perms; publicarDocs(true); }).catch(function () { /* tenta na próxima abertura */ });
    });
  }
  function telaNuvem(html) { view.innerHTML = '<div class="view">' + html + '</div>'; $$('#nav a').forEach(function (a) { a.hidden = true; }); $$('#nav [data-group]').forEach(function (g) { g.hidden = true; }); }
  function carregarNuvem() {
    return Nuvem.carregar().then(function (d) {
      if (!d) { telaNuvem(titleRow('Bem-vindo(a)', '') + vazioHTML('Seu acesso está quase pronto', 'A empresa precisa abrir o app uma vez para liberar os seus dados. Tente de novo em alguns minutos.', '<button type="button" class="btn" data-act="recarregar">Tentar de novo</button>')); return; }
      S = d; S.ui = S.ui || {}; S.real = true; S.hoje = hojeISO(); S.nsr = S.nsr || 1; S.role = Nuvem.papel;
      S.nuvemPessoa = ['funcionario', 'gerente'].indexOf(Nuvem.papel) > -1 ? Nuvem.pessoa : null;
      if (S.nuvemPessoa) {
        // o que o dono definiu (publicado junto) vale para a tela; o servidor confere de novo ao aplicar
        S.acessos = S.acessos || {}; var ac = S.acessos[S.nuvemPessoa] || { papel: Nuvem.papel, perms: Nuvem.perms || [] };
        S.acessos[S.nuvemPessoa] = ac; S.role = ac.papel === 'gerente' ? 'gerente' : 'funcionario'; Nuvem.papel = S.role; Nuvem.perms = ac.perms || [];
      }
      ['pessoas', 'atestados', 'advertencias', 'faltas', 'vales', 'produtos', 'checklists', 'vagas', 'admissoes', 'banco', 'auditoria'].forEach(function (k) { if (!Array.isArray(S[k])) S[k] = []; });
      ['ponto', 'marcacoesMetodo', 'horasExtras', 'treinos', 'acessos'].forEach(function (k) { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
      ['turnos', 'modelosCt', 'contratos'].forEach(function (k) { if (!Array.isArray(S[k])) S[k] = []; });
      var migrou = false; if (Nuvem.papel === 'empresa' && !S.v2) { S.pessoas.forEach(function (p) { p.celular = true; }); S.v2 = true; migrou = true; }
      S.compras = S.compras || { itens: [] }; S.holerites = S.holerites || { competencia: hojeISO().slice(0, 7), status: 'aguardando', lancadoEm: '', aprovados: [] }; S.empresa = S.empresa || { nome: 'Empresa' };
      if (ehFunc()) return Nuvem.meusEventosPendentes().then(function (evs) { evs.forEach(function (ev) { aplicarOps(S, ev.ops, S.nuvemPessoa, Nuvem.papel, Nuvem.perms, ev.criado_em, true); }); }).then(carregarReais).then(function () { SNAP = clone(S); render(); clearInterval(tPend); tPend = setInterval(function () { carregarReais().then(function (mudou) { if (mudou && !$('.overlay')) render(); }); }, 60000); });
      return Nuvem.membros().then(function (ms) { MEMBROS = ms || []; return carregarEnvios(); }).then(carregarReais).then(function () { SNAP = clone(S); render(); if (migrou) save(); sincronizarAcessos(); return processarPendencias(); }).then(function () { publicarDocs(true); clearInterval(tPend); tPend = setInterval(processarPendencias, 45000); });
    });
  }
  function criarEmpresaNuvem(nome, tipo) {
    var dados = semUI(novoEmBranco(tipo, nome));
    telaNuvem('<p class="ui-sub">Criando a empresa…</p>');
    return Nuvem.criarEmpresa(nome, tipo, dados).then(function (id) { try { localStorage.removeItem('seucomando-nova-empresa'); } catch (e) { /* ignora */ } return Nuvem.vinculos().then(function (vs) { VINCULOS = vs; Nuvem.escolher(vs.filter(function (v) { return v.empresa_id === id; })[0] || vs[0]); return carregarNuvem(); }); });
  }
  function semEmpresa() {
    var p = null; try { p = JSON.parse(localStorage.getItem('seucomando-nova-empresa') || 'null'); } catch (e) { /* ignora */ }
    if (p && p.nome) return criarEmpresaNuvem(String(p.nome).slice(0, 80), String(p.tipo || 'padaria'));
    var ops = Object.keys(window.CENTRALIZAR_TIPOS || {}).map(function (t) { return '<option value="' + t + '">' + esc(window.CENTRALIZAR_TIPOS[t]) + '</option>'; }).join('');
    telaNuvem(titleRow('Bem-vindo(a) ao Seu Comando', '') + '<div class="grid-2"><form class="card card-pad stack" data-form="nuvem-empresa"><h2 class="sec">Criar a minha empresa</h2><div class="field"><label for="ne-n">Nome da empresa</label><input id="ne-n" name="n" maxlength="80" required></div><div class="field"><label for="ne-t">Ramo</label><select id="ne-t" name="t">' + ops + '</select></div><button class="btn btn-primary" type="submit">Criar</button></form>' +
      '<div class="card card-pad stack"><h2 class="sec">Fui convidado</h2><p>Contador ou funcionário que recebeu um código: use em "Tenho um código".</p><a class="btn" href="entrar.html#codigo">Tenho um código</a></div></div>');
  }
  function bootNuvem() {
    var rl = $('.role'); if (rl) { rl.querySelector('span').textContent = 'Empresa'; rl.hidden = true; }
    var foot = $('.side-foot'); if (foot) foot.innerHTML = 'Conectado ao banco de dados. <button type="button" class="link-btn" data-act="sair">Sair</button>';
    telaNuvem('<p class="ui-sub">Carregando…</p>');
    Nuvem.sessao().then(function (s) {
      if (!s) { location.href = 'entrar.html'; return; }
      return Nuvem.vinculos().then(function (vs) {
        VINCULOS = vs || []; if (!VINCULOS.length) return semEmpresa();
        var salvo = null; try { salvo = localStorage.getItem('seucomando-empresa'); } catch (e) { /* ignora */ }
        Nuvem.escolher(VINCULOS.filter(function (v) { return v.empresa_id === salvo; })[0] || VINCULOS[0]);
        if (VINCULOS.length > 1 && rl) { var sel = $('#role'); sel.innerHTML = VINCULOS.map(function (v) { return '<option value="' + esc(v.empresa_id) + '">' + esc(v.nome || ({ empresa: 'Minha empresa', contador: 'Cliente', gerente: 'Empresa', funcionario: 'Empresa' }[v.papel])) + ' · ' + esc(v.papel) + '</option>'; }).join(''); rl.hidden = false; }
        return carregarNuvem();
      });
    }).catch(function (e) { telaNuvem(vazioHTML('Não foi possível conectar', (e && e.message) || 'Verifique a internet e tente de novo.', '<button type="button" class="btn" data-act="recarregar">Tentar de novo</button>')); });
  }

  /* ---------- Equipe, acessos, banco de horas ---------- */
  var PERMS = { banco: 'Lançar no banco de horas da equipe', ponto: 'Ver e marcar o ponto da equipe', checklists: 'Checklists de todos os setores', estoque: 'Estoque e lista de compras', boas: 'Boas práticas de alimentos' };
  function acessoDe(pid) { var a = (S.acessos || {})[pid]; return a ? { papel: a.papel || 'funcionario', perms: a.perms || [] } : { papel: 'funcionario', perms: [] }; }
  function pode(perm) { if (S.role === 'empresa') return true; if (S.role !== 'gerente') return false; return acessoDe(ME).perms.indexOf(perm) > -1; }
  function ehFunc() { return S.role === 'funcionario' || S.role === 'gerente'; }
  function ajustaME() {
    if (S.nuvemPessoa) { ME = S.nuvemPessoa; return; }
    if (S.role === 'gerente') { var g = Object.keys(S.acessos || {}).filter(function (k) { return S.acessos[k].papel === 'gerente'; })[0]; ME = g || (S.pessoas[8] && S.pessoas[8].id) || ME; }
    else if (S.role === 'funcionario') ME = (S.pessoas[0] && S.pessoas[0].id) || 'e1';
  }
  function quemSou() { return S.role === 'empresa' ? 'Empresário' : S.role === 'contador' ? 'Contador' : (P(ME) ? P(ME).nome : 'Funcionário'); }
  function auditar(acao, detalhe) { S.auditoria = S.auditoria || []; S.auditoria.unshift({ em: agora(), por: quemSou(), acao: acao, detalhe: detalhe }); if (NUVEM && !ehFunc()) Nuvem.registrar(acao, detalhe, quemSou()); if (S.auditoria.length > 500) S.auditoria.length = 500; }
  function fmtMin(m) { var s = m < 0 ? '-' : '+', a = Math.abs(m); return s + Math.floor(a / 60) + 'h' + ('0' + a % 60).slice(-2); }
  function saldoBanco(pid) { return (S.banco || []).filter(function (b) { return b.pessoa === pid; }).reduce(function (t, b) { return t + b.min; }, 0); }
  function bancoHTML() {
    var gere = pode('banco'), lista = (S.banco || []).filter(function (b) { return gere || b.pessoa === ME; });
    var estornados = {}; (S.banco || []).forEach(function (b) { if (b.estorno) estornados[b.estorno] = b; });
    var saldo = gere ? '<div class="table-box"><table class="t"><thead><tr><th>Pessoa</th><th class="num">Saldo</th></tr></thead><tbody>' + S.pessoas.map(function (p) { var s = saldoBanco(p.id); return '<tr><td>' + esc(p.nome) + '</td><td class="num">' + (s ? pill(s > 0 ? 'ok' : 'warn', fmtMin(s)) : '<span class="faint">0h00</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' :
      '<p>Seu saldo: <strong class="num">' + fmtMin(saldoBanco(ME)) + '</strong></p>';
    var form = gere ? '<form class="stack" data-form="banco"><h3 class="lbl-s">Lançar crédito ou débito</h3><div class="form-grid"><div class="field"><label for="bh-p">Pessoa</label><select id="bh-p" name="p">' + S.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="bh-t">Tipo</label><select id="bh-t" name="t"><option value="1">Crédito (hora extra a compensar)</option><option value="-1">Débito (folga ou saída antecipada)</option></select></div>' +
      '<div class="field"><label for="bh-h">Horas</label><input id="bh-h" name="h" type="number" min="0" max="44" value="1"></div><div class="field"><label for="bh-m">Minutos</label><input id="bh-m" name="m" type="number" min="0" max="59" value="0"></div></div>' +
      '<div class="field"><label for="bh-x">Motivo (obrigatório)</label><input id="bh-x" name="x" maxlength="120" placeholder="Ex.: ficou 1h a mais no inventário de 04/11" required></div><button class="btn btn-primary" type="submit">Lançar</button></form>' : '';
    var hist = lista.slice().reverse().slice(0, 30).map(function (b) {
      var e = estornados[b.id];
      return '<li><span><strong class="num">' + fmtMin(b.min) + '</strong> · ' + esc(P(b.pessoa) ? P(b.pessoa).nome : '') + (b.estorno ? ' ' + pill('mute', 'Estorno') : '') + (e ? ' ' + pill('warn', 'Estornado') : '') + '<span class="sub">' + esc(b.motivo) + ' · lançado por ' + esc(b.porNome) + ' em ' + esc(b.em) + '</span></span>' +
        (gere && !b.estorno && !e ? '<button type="button" class="btn btn-sm" data-act="banco-estornar" data-id="' + esc(b.id) + '">Estornar</button>' : '') + '</li>';
    }).join('');
    return '<div class="card card-pad stack" id="banco"><h2 class="sec">Banco de horas</h2>' + saldo + form +
      '<h3 class="lbl-s">Lançamentos</h3>' + (hist ? '<ul class="list">' + hist + '</ul>' : '<p class="ui-sub">Nenhum lançamento.</p>') +
      '<p class="ui-sub">Todo lançamento fica registrado com quem fez, data e hora, e não pode ser apagado: para corrigir, use "Estornar", que cria um lançamento contrário. Banco de horas por acordo individual escrito: compensação em até 6 meses (CLT, art. 59, § 5º); por convenção ou acordo coletivo, em até 1 ano (art. 59, § 2º).</p></div>';
  }
  function papelPill(a) { return a.papel === 'nenhum' ? pill('mute', 'Sem acesso') : a.papel === 'gerente' ? pill('ok', 'Gerente') : pill('mute', 'Funcionário'); }
  function vEquipe() {
    var rows = S.pessoas.map(function (p) {
      return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao || '') + (p.setor ? ' · ' + esc(p.setor) : '') + '</span></td><td class="num hide-sm">' + brl(p.salario || 0) + '</td><td class="hide-sm">' + esc(turnoCurto(p)) + '</td><td class="hide-sm">' + papelPill(acessoDe(p.id)) + '</td><td class="num"><button type="button" class="btn btn-sm" data-act="pessoa-editar" data-id="' + p.id + '">Editar</button></td></tr>';
    }).join('');
    return titleRow('Cadastro da equipe', 'Nome, função, salário e horário de cada pessoa', '<button type="button" class="btn btn-primary" data-act="pessoa-editar">Cadastrar pessoa</button>') +
      '<div class="card"><div class="table-box"><table class="t"><thead><tr><th>Pessoa</th><th class="num hide-sm">Salário</th><th class="hide-sm">Turno</th><th class="hide-sm">Acesso ao app</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">Nenhuma pessoa cadastrada ainda.</td></tr>') + '</tbody></table></div></div>' +
      (S.pessoas.length ? '<p class="ui-sub">Para liberar o app, gerar o código de acesso ou dar permissões de gerente, use <a href="#/acessos">Acessos e permissões</a>, no menu da empresa.</p>' : '');
  }
  function vAcessos() {
    var emp = S.role === 'empresa';
    var rows = S.pessoas.map(function (p) {
      var a = acessoDe(p.id);
      return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao || '') + '</span></td><td>' + papelPill(a) + (a.papel === 'gerente' && a.perms.length ? '<span class="sub">' + a.perms.map(function (k) { return esc(PERMS[k] || k); }).join('; ') + '</span>' : '') + '</td>' +
        '<td><label class="check"><input type="checkbox" data-in="aut" data-id="' + p.id + '"' + (p.celular ? ' checked' : '') + (emp ? '' : ' disabled') + '><span>' + (p.celular ? 'Sim' : 'Não') + '</span><span class="sr-only"> · ' + esc(p.nome) + ' marca ponto pelo celular</span></label></td>' +
        '<td class="num"><button type="button" class="btn btn-sm" data-act="acesso-editar" data-id="' + p.id + '">Acesso</button></td></tr>';
    }).join('');
    return titleRow('Acessos e permissões', 'Quem entra no app, o que pode fazer e quem marca o ponto pelo celular', '<button type="button" class="btn" data-act="convite-contador">Convidar contador</button>') +
      '<div class="card"><div class="table-box"><table class="t"><thead><tr><th>Pessoa</th><th>Acesso ao app</th><th>Ponto pelo celular</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Cadastre a equipe primeiro, em Equipe.</td></tr>') + '</tbody></table></div></div>' +
      '<p class="ui-sub">Quem não marca pelo celular bate o ponto no aparelho da empresa. Um funcionário pode virar gerente e receber permissões, como lançar no banco de horas da equipe; tudo o que ele faz vai para o registro de alterações.</p>';
  }
  function vRegistro() {
    var l = (S.auditoria || []).slice(0, 300).map(function (x) { return '<li><span>' + esc(x.acao) + '<span class="sub">' + esc(x.detalhe) + ' · ' + esc(x.por) + ' · ' + esc(x.em) + '</span></span></li>'; }).join('');
    return titleRow('Registro de alterações', 'Quem mudou o quê e quando: acessos, ponto, checklists, contratos, banco de horas e rostos') +
      '<div class="card">' + (l ? '<ul class="list">' + l + '</ul>' : '<p class="card-pad ui-sub">Nenhuma alteração registrada ainda.</p>') + '</div>';
  }
  function vBanco() { return titleRow('Banco de horas', (pode('banco') ? 'Saldo de cada pessoa, lançamentos e estornos' : 'Seu saldo e os lançamentos') + ' ' + ajudaBtn('banco', 'Como funciona o banco de horas')) + bancoHTML().replace('<h2 class="sec">Banco de horas</h2>', ''); }
  function pessoaForm(p) {
    p = p || {}; var cgs = CARGOS.map(function (c) { return '<option value="' + c.id + '"' + (c.id === p.cargo ? ' selected' : '') + '>' + esc(c.cargo) + ' · CBO ' + esc(c.cbo) + '</option>'; }).join('');
    var f = function (id, l, n, v, extra) { return '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" name="' + n + '" value="' + esc(v == null ? '' : v) + '"' + (extra || '') + '></div>'; };
    var sec = function (n, t, corpo) { return '<fieldset class="sec-num"><legend><span class="wiz-n">' + n + '</span>' + esc(t) + '</legend>' + corpo + '</fieldset>'; };
    return '<form class="stack" data-form="pessoa" data-jornada data-id="' + esc(p.id || '') + '" data-aceite="' + esc(p.jornada && p.jornada.aceite ? JSON.stringify(p.jornada.aceite.alertas) : '') + '">' +
      sec(1, 'Quem é', f('pe-n', 'Nome completo', 'n', p.nome, ' maxlength="80" required') +
        '<div class="form-grid">' + f('pe-c', 'CPF (para o login no app)', 'c', p.cpf && p.cpf.indexOf('[') < 0 ? p.cpf : '', ' maxlength="14" inputmode="numeric"') + f('pe-t', 'WhatsApp', 't', p.fone, ' maxlength="20" inputmode="tel"') + '</div>') +
      sec(2, 'Trabalho', '<div class="form-grid">' + f('pe-f', 'Função na empresa', 'f', p.funcao, ' maxlength="60" required') + f('pe-s', 'Setor', 's', p.setor, ' maxlength="40"') + '</div>' +
        '<div class="field"><label for="pe-g">Cargo (base com CBO, usado no contrato)</label><select id="pe-g" name="g">' + cgs + '</select></div>' +
        '<div class="form-grid">' + f('pe-sa', 'Salário (R$)', 'sa', p.salario, ' type="number" min="0" step="0.01"') + f('pe-a', 'Admissão', 'a', p.admissao || S.hoje, ' type="date"') + '</div>') +
      sec(3, 'Horário de trabalho', turnoCampos(p)) +
      '<button class="btn btn-primary btn-lg" type="submit">' + (p.id ? 'Salvar' : 'Cadastrar') + '</button></form>';
  }
  function turnoCampos(p) {
    var ts = S.turnos || [], tSel = p.turno && turnoDe(p.turno) ? p.turno : (!p.id && ts.length ? ts[0].id : ''), manual = !tSel;
    var j = p.jornada || { e: p.escala || '08:00', s: '17:48', intervalos: [{ flex: false, ini: '12:00', fim: '13:00' }], dias: [1, 2, 3, 4, 5] };
    return '<div class="field"><label for="pe-tu">Turno</label><select id="pe-tu" name="tu" data-in="pe-turno">' + ts.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === tSel ? ' selected' : '') + '>' + esc(t.nome) + ' · ' + esc(horarioTxt(t)) + '</option>'; }).join('') + '<option value=""' + (manual ? ' selected' : '') + '>Horário próprio (montar abaixo)</option></select>' +
      (ts.length ? '' : '<span class="sub">Dica: cadastre os turnos da empresa uma vez em <a href="#/empresa">Turnos e regras do ponto</a> e depois só escolha aqui.</span>') + '</div>' +
      '<fieldset class="stack manual-j" data-manual' + (manual ? '' : ' hidden disabled') + '><legend class="lbl-s">Horário desta pessoa</legend>' + camposHorario('pe-', j) + '</fieldset>' +
      '<div class="field"><label for="pe-fu">Fuso horário</label><select id="pe-fu" name="fu">' + fusoOpts(fusoOk(p.fuso), true) + '</select><span class="sub">Só mude se a pessoa trabalha em outro estado, com outro horário.</span></div>';
  }
  function cpfValido(c) {
    c = String(c || '').replace(/\D/g, ''); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    var s = 0, i; for (i = 0; i < 9; i++) s += +c[i] * (10 - i); var d1 = (s * 10) % 11 % 10; if (d1 !== +c[9]) return false;
    s = 0; for (i = 0; i < 10; i++) s += +c[i] * (11 - i); return (s * 10) % 11 % 10 === +c[10];
  }
  function fmtCPF(c) { c = String(c).replace(/\D/g, ''); return c.slice(0, 3) + '.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-' + c.slice(9); }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function novoEmBranco(tipo, nome) {
    var s = novoExemplo(tipo);
    s.empresa = { nome: nome || 'Minha empresa', razao: nome || '', cnpj: '', cidade: '', endereco: '', codigo: s.empresa.codigo };
    s.pessoas = []; s.ponto = {}; s.marcacoesMetodo = {}; s.atestados = []; s.advertencias = []; s.faltas = []; s.horasExtras = {};
    s.holerites = { competencia: hojeISO().slice(0, 7), status: 'aguardando', lancadoEm: '', aprovados: [] };
    s.vales = []; s.produtos = []; s.compras = { itens: [] }; s.vagas = []; s.admissoes = []; s.treinos = {}; s.banco = []; s.acessos = {}; s.auditoria = [];
    s.checklists = [];
    if (s.bp) { s.bp.temps = []; s.bp.equip = []; s.bp.docs.forEach(function (d) { d.ult = ''; if (d.venc) d.venc = ''; }); }
    if (s.agencia) { s.clientes = []; } delete s.envSeed;
    s.nsr = 0; s.turnos = []; s.modelosCt = []; s.contratos = []; s.registros = []; s.docsArq = []; s.holArq = []; s.ajustes = []; s.ckRegs = []; s.rostos = {}; s.pontoCiente = {}; s.v2 = true; s.empresa.ponto = {};
    s.hoje = hojeISO(); s.agoraDemo = null; s.real = true; s.plano = 'avaliacao';
    return s;
  }

  /* ---------- Ponto ---------- */
  var METODO = { celular: 'Celular autorizado', fixo: 'Aparelho da empresa', 'fixo-rosto': 'Aparelho fixo · rosto', 'fixo-digital': 'Aparelho da empresa' };
  function linhaDiaHTML(pid, regs) {
    var j = jornadaDe(P(pid)), ivs = ivsDe(j), m = mk(pid), pi = proxInfo(pid), ts = sequenciaDe(pid), n = nIvs(pid);
    m.forEach(function (h, t) { if (h && ts.indexOf(t) < 0) ts.push(t); }); ts.sort(function (a, b) { return a - b; });
    var prev = function (t) {
      if (t === 0) return j.e ? 'previsto ' + j.e : ''; if (t === SAIDA) return j.s ? 'previsto ' + j.s + (passaMeiaNoite(j) ? ' (dia seguinte)' : '') : '';
      var iv = ivs[Math.ceil(t / 2) - 1]; if (!iv) return '';
      return iv.flex ? (t % 2 ? fmtDur(iv.dur) + ', na hora que você escolher' + (iv.de ? ' (a partir de ' + iv.de + ')' : '') : 'depois de ' + fmtDur(iv.dur)) : 'previsto ' + (t % 2 ? iv.ini : iv.fim);
    };
    return '<ol class="linha-dia">' + ts.map(function (t, i) {
      var h = m[t], agora = t === pi.prox, r = (regs || [])[t];
      var sub = h ? 'registrada' + (r ? ' · ' + localTxt(r) : '') : agora ? 'próximo passo' + (prev(t) ? ' · ' + prev(t) : '') : prev(t);
      return '<li class="' + (h ? 'feito' : agora ? 'agora' : '') + '"><span class="ld-ic" aria-hidden="true">' + (h ? '✓' : i + 1) + '</span><span class="ld-t">' + esc(nomeTipo(t, n)) + '<span class="sub">' + esc(sub) + '</span></span>' + (r && r.fora_do_local ? pill('bad', 'fora do local') : '') + '<strong class="num">' + esc(h || '') + '</strong></li>';
    }).join('') + '</ol>';
  }
  function vPonto() {
    var real = !!S.real, eu = ehFunc() && (real || !pode('ponto')), equipe = !ehFunc() || pode('ponto');
    var quem = eu ? P(ME) : (P(S.ui.pontoPessoa) || P('e3') || S.pessoas[0]);
    var metodo = eu ? 'celular' : real ? 'fixo' : (S.ui.metodo || (quem.celular ? 'celular' : 'fixo'));
    var bloqueado = metodo === 'celular' && !quem.celular, j = jornadaDe(quem), tz = fusoDe(quem), cfg = cfgPonto();
    var opts = S.pessoas.map(function (p) { return '<option value="' + p.id + '"' + (p.id === quem.id ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('');
    var pi = proxInfo(quem.id), prox = pi.prox, rc = S.ui.recibo;
    var acao = bloqueado ? '<div class="notice"><div><strong>Celular não liberado para ' + esc(first(quem.nome)) + '</strong>' + (eu ? 'Marque no aparelho da empresa ou peça a liberação.' : 'A empresa só liberou o aparelho fixo.') + '</div></div>' :
      '<div class="ponto-acao">' + (prox > -1 ? '<span class="lbl-s">Próximo passo</span>' : '') + '<button type="button" class="btn btn-primary btn-xl" data-act="marcar"' + (prox > -1 ? '' : ' disabled') + '>' + esc(prox > -1 ? 'Registrar ' + tipoNome(quem.id, prox).toLowerCase() : 'Jornada de hoje completa') + '</button>' +
      (pi.alt != null ? '<button type="button" class="btn" data-act="marcar-alt" data-t="' + pi.alt + '">' + esc(pi.alt === SAIDA ? 'Encerrar o dia agora (registrar a saída)' : 'Sair para ' + (pi.alt === 1 ? 'um' : 'mais um') + ' intervalo') + '</button>' : '') +
      (cfg.rosto ? '<span class="sub">' + ((S.rostos || {})[quem.id] ? 'Reconhecimento facial ligado: o app confere o rosto antes de registrar.' : 'Na primeira marcação, o app cadastra o rosto de ' + esc(first(quem.nome)) + '.') + '</span>' : '') + '</div>';
    var painel = '<div class="card card-pad stack"><h2 class="sec">' + (eu ? 'Bater ponto' : 'Bater ponto no aparelho da empresa') + '</h2>' +
      (eu ? '' : '<div class="field"><label for="pp">Quem vai marcar</label><select id="pp" data-in="ponto-pessoa">' + opts + '</select></div>') +
      '<div><div class="clock num" id="clock" data-tz="' + esc(tz) + '" aria-live="off">--:--</div><p class="ui-sub clock-tz">' + esc(fusoNome(tz)) + (passaMeiaNoite(j) ? ' · seu turno termina no dia seguinte' : '') + '</p></div>' +
      (real || eu ? '' : '<div class="seg"><button type="button" data-act="metodo" data-v="celular" aria-pressed="' + (metodo === 'celular') + '">Celular</button><button type="button" data-act="metodo" data-v="fixo" aria-pressed="' + (metodo === 'fixo') + '">Aparelho fixo</button></div>') +
      acao +
      (rc ? '<div class="receipt num"><strong>Comprovante de registro de ponto</strong><br>NSR ' + esc(rc.nsr) + ' · ' + esc(rc.quando) + '<br>' + esc(S.empresa.razao || S.empresa.nome) + (S.empresa.cnpj ? ' · CNPJ ' + esc(S.empresa.cnpj) : '') + '<br>' + esc(rc.nome) + (rc.cpf ? ' · CPF ' + esc(rc.cpf) : '') + '<br>' + esc(rc.tipo) + ' · ' + esc(rc.metodo) + (rc.local ? '<br>Local: ' + esc(rc.local) : '') + (rc.foto ? '<br>Foto registrada' : '') + (rc.rosto ? '<br>' + esc(rc.rosto) : '') + '</div>' : '') +
      (eu && real ? '<button type="button" class="btn btn-sm" data-act="aj-novo">Esqueceu de marcar ou errou? Pedir ajuste</button>' : '') +
      '<p class="ui-sub">' + (real ? 'A hora registrada é a do servidor. ' : 'No exemplo, a foto e o local ficam só neste aparelho. ') + (cfg.rosto ? 'Foto, local e rosto ficam como comprovante.' : 'Foto e local ficam como comprovante.') + ' ' + ajudaBtn('ponto', 'Como o ponto funciona') + '</p></div>';
    var hojeRegs = function (pid) { return regsDe(pid, real ? diaAberto(pid) : hojeISO()); };
    var porTipo = function (pid) { var o = []; hojeRegs(pid).forEach(function (r) { o[r.tipo] = r; }); return o; };
    if (!equipe) {
      return titleRow('Ponto', real ? 'Seu horário: ' + esc(horarioTxt(j)) + ' · ' + esc(escalaTxt(j)) : 'Escala de hoje: entrada às ' + esc(quem.escala)) + '<div class="grid-2">' + painel + '<div class="stack"><h2 class="sec">Sua jornada de hoje</h2><div class="card">' + linhaDiaHTML(ME, porTipo(ME)) + '</div>' +
        (real && ajustesDe(ME).length ? '<h2 class="sec">Seus pedidos de ajuste</h2><div class="card">' + ajustesHTML(ajustesDe(ME).slice().reverse().slice(0, 10), false) + '</div>' : '') +
        (real ? '<h2 class="sec">Seus últimos dias</h2><div class="card">' + espelhoHTML(ME) + '</div>' : '') + '</div></div>';
    }
    var emp = S.role === 'empresa';
    var rows = S.pessoas.map(function (p) {
      var m2 = mk(p.id), st = situacaoPonto(p), rr = porTipo(p.id), ult = rr.filter(Boolean).pop(), ivt = [];
      for (var k = 1; k <= 4; k++) if (m2[2 * k - 1]) ivt.push(m2[2 * k - 1] + '–' + (m2[2 * k] || '…'));
      var semRosto = emp && rr.some(function (r) { return r && r.rosto === 'nao_confere'; });
      return '<tr><td><button type="button" class="link-btn" data-act="ponto-espelho" data-id="' + p.id + '"><strong>' + esc(p.nome) + '</strong></button><span class="sub">' + esc(real ? turnoCurto(p) : p.setor) + '</span></td><td class="num">' + esc(real ? jornadaDe(p).e : p.escala) + '</td>' +
        '<td class="num hide-sm">' + esc(m2[0] || '·') + '</td><td class="num hide-sm">' + esc(ivt.join(', ') || '·') + '</td><td class="num hide-sm">' + esc(m2[SAIDA] || '·') + '</td>' +
        '<td class="hide-sm">' + esc(METODO[S.marcacoesMetodo[p.id]] || '·') + (ult ? '<span class="sub">' + localPill(ult) + '</span>' : '') + '</td><td>' + pill(st[0], st[1]) + (semRosto ? ' ' + pill('bad', 'rosto não conferiu') : '') + '</td></tr>';
    }).join('');
    var pend = real ? (S.ajustes || []).filter(function (a) { return a.status === 'pendente'; }) : [], ajCard = '<div class="card"><div class="card-head"><h2>Pedidos de ajuste</h2>' + pill('warn', pend.length + ' aguardando') + '</div>' + ajustesHTML(pend, emp) + '</div>';
    var acoes = real ? '<button type="button" class="btn" data-act="ponto-csv">Exportar marcações (planilha)</button>' : '<button type="button" class="btn" data-act="export-afd">Exportar marcações (exemplo)</button>';
    var aba = S.ui.pontoAba || 'hoje'; if (aba === 'ajustes' && !pend.length) aba = 'hoje';
    var regras = real && emp ? '<p class="regra-linha ui-sub">' + esc([cfg.rosto ? 'Rosto conferido' : 'Sem reconhecimento facial', cfg.foto ? 'foto obrigatória' : 'foto opcional', cfg.lat != null ? 'local definido (' + cfg.raio + ' m)' : 'local ainda não definido', fusoNome(fusoEmp())].join(' · ')) + ' · <a href="#/empresa?aba=regras">Mudar as regras</a></p>' : '';
    var tabela = '<div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th class="num">Entra</th><th class="num hide-sm">Entrada</th><th class="num hide-sm">Intervalos</th><th class="num hide-sm">Saída</th><th class="hide-sm">Como e onde</th><th>Situação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><p class="ui-sub">Toque no nome para ver o espelho de ponto com as fotos e os locais' + (emp && real ? ', conferir com a CLT e ajustar uma marcação' : '') + '.</p>';
    return titleRow('Ponto', (real ? hoje1() : 'Quinta-feira, 05/11') + ' · situação às ' + demoAgora() + (real ? ' (' + esc(fusoNome(fusoEmp())) + ')' : '') + ' ' + ajudaBtn('ponto', 'Como o ponto funciona'), acoes) + regras +
      abas('pontoAba', [['hoje', 'Quem está trabalhando', S.pessoas.length ? presentesAgora() + ' de ' + S.pessoas.length : ''], ['marcar', 'Bater ponto aqui', ''], pend.length ? ['ajustes', 'Pedidos de ajuste', pend.length] : null], aba) +
      (aba === 'marcar' ? '<div class="ponto-unico">' + painel + '</div>' : aba === 'ajustes' ? ajCard : tabela);
  }
  var clockTimer;
  function tickClock() {
    clearInterval(clockTimer);
    var f = function () { var c = $('#clock'); if (!c) { clearInterval(clockTimer); return; } var o = { hour: '2-digit', minute: '2-digit', second: '2-digit' }; if (c.dataset.tz) o.timeZone = c.dataset.tz; try { c.textContent = new Date().toLocaleTimeString('pt-BR', o); } catch (e) { delete o.timeZone; c.textContent = new Date().toLocaleTimeString('pt-BR', o); } };
    f(); clockTimer = setInterval(f, 1000);
  }

  /* ---------- Atestados e advertências ---------- */
  function vOcorrencias(forca) {
    var tab = forca || S.ui.oc || 'atestados', func = ehFunc();
    var tabs = '<div class="tabs" role="tablist"><button type="button" role="tab" data-act="oc" data-v="atestados" aria-selected="' + (tab === 'atestados') + '">Atestados</button><button type="button" role="tab" data-act="oc" data-v="advertencias" aria-selected="' + (tab === 'advertencias') + '">Advertências</button></div>';
    var aviso = '<div class="notice"><div><strong>O atestado só vale com o original em papel</strong>A foto enviada pelo app serve para a empresa saber da ausência na hora. O funcionário precisa entregar o atestado original fisicamente ao RH em até 48 horas; até lá, a falta fica como não abonada.</div></div>';
    if (tab === 'atestados') {
      var lista = S.atestados.filter(function (a) { return !func || a.pessoa === ME; });
      var rows = lista.map(function (a) {
        var p = P(a.pessoa), venc = a.original !== 'entregue' && diffDays(S.hoje, a.prazo) < 0;
        var orig = a.original === 'entregue' ? pill('ok', 'Entregue em ' + dmy(a.entregueEm)) : venc ? pill('bad', 'Vencido em ' + dmy(a.prazo)) : pill('warn', 'Entregar até ' + dmy(a.prazo));
        var acao = S.role === 'empresa' && a.original !== 'entregue' ? '<button type="button" class="btn btn-sm" data-act="orig" data-id="' + a.id + '">Registrar entrega</button>' : '';
        return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao) + '</span></td><td class="num">' + dmy(a.inicio) + ' · ' + a.dias + (a.dias > 1 ? ' dias' : ' dia') + '</td><td class="hide-sm">Foto em ' + esc(dmy(a.foto)) + (a.arquivo ? ' <button type="button" class="link-btn" data-act="arq-ver" data-path="' + esc(a.arquivo) + '" data-t="Foto do atestado">ver</button>' : '') + '</td><td>' + orig + '</td><td class="num">' + acao + '</td></tr>';
      }).join('');
      return titleRow('Atestados', func ? 'Seus atestados' : 'Ciência imediata pela foto, validade com o original', func ? '<span class="btn btn-primary file-btn">Enviar foto do atestado<input type="file" accept="image/*" capture="environment" data-in="novo-atestado" aria-label="Enviar foto do atestado"></span>' : '') + '<div class="stack">' + aviso +
        '<div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th class="num">Período</th><th class="hide-sm">Ciência</th><th>Original físico</th><th class="num">Ação</th></tr></thead><tbody>' + (rows || '<tr><td>Nenhum atestado.</td></tr>') + '</tbody></table></div></div>' +
        '<p class="ui-sub">O diagnóstico (CID) só consta do atestado a pedido do paciente (Resolução CFM 1.658/2002, art. 5º). O Seu Comando não pede esse campo.</p></div>';
    }
    var adv = S.advertencias.filter(function (w) { return !func || w.pessoa === ME; });
    var rowsW = adv.map(function (w) {
      var c = w.ciencia === 'app' ? pill('ok', 'Ciência no app ' + dmy(w.cienciaEm)) : w.ciencia === 'recusa' ? pill('warn', 'Recusou · testemunhas') : pill('warn', 'Aguardando ciência');
      var acao = func && w.ciencia === 'pendente' ? '<button type="button" class="btn btn-sm btn-primary" data-act="ciencia" data-id="' + w.id + '">Dar ciência</button>' : (S.role === 'empresa' && w.ciencia === 'pendente' ? '<button type="button" class="btn btn-sm" data-act="recusa" data-id="' + w.id + '">Registrar recusa</button>' : '');
      return '<tr><td><strong>' + esc(P(w.pessoa).nome) + '</strong><span class="sub">' + esc(dmy(w.data)) + '</span></td><td>' + esc(w.motivo) + (w.testemunhas ? '<span class="sub">Testemunhas: ' + esc(w.testemunhas) + '</span>' : '') + '</td><td>' + c + '</td><td class="num">' + acao + '</td></tr>';
    }).join('');
    return titleRow('Advertências', 'Ciência pelo app ou recusa com duas testemunhas', S.role === 'empresa' ? '<button type="button" class="btn btn-primary" data-act="nova-adv">Nova advertência</button>' : '') +
      '<div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th>Motivo</th><th>Ciência</th><th class="num">Ação</th></tr></thead><tbody>' + (rowsW || '<tr><td>Nenhuma advertência.</td></tr>') + '</tbody></table></div></div>';
  }

  /* ---------- Holerites ---------- */
  function slipHTML(h, comp) {
    return '<article class="paper"><h3>Recibo de pagamento</h3><p class="center">' + esc(S.empresa.razao) + ' · competência ' + esc(comp) + '</p><p><strong>' + esc(h.p.nome) + '</strong> · ' + esc(h.p.funcao) + ' · admissão ' + dmyy(h.p.admissao) + '</p>' +
      '<table class="t"><thead><tr><th>Descrição</th><th class="num">Ref.</th><th class="num">Proventos</th><th class="num">Descontos</th></tr></thead><tbody>' +
      h.linhas.map(function (l) { return '<tr><td>' + esc(l[0]) + '</td><td class="num">' + esc(l[1]) + '</td><td class="num">' + (l[3] ? '' : brl(l[2])) + '</td><td class="num">' + (l[3] ? brl(l[2]) : '') + '</td></tr>'; }).join('') +
      '<tr><td><strong>Totais</strong></td><td></td><td class="num"><strong>' + brl(h.prov) + '</strong></td><td class="num"><strong>' + brl(h.desc) + '</strong></td></tr><tr><td><strong>Líquido a receber</strong></td><td></td><td></td><td class="num"><strong>R$ ' + brl(h.liq) + '</strong></td></tr></tbody></table>' +
      '<p class="ui-sub">FGTS do mês depositado pela empresa: R$ ' + brl(h.fgts) + '. Valores de exemplo; no sistema, quem lança é o contador.</p></article>';
  }
  function vHolerites() {
    if (S.real) return vHoleritesReal();
    var comp = 'outubro de 2026';
    if (ehFunc()) {
      var st = statusHolerite(ME);
      return titleRow('Seus holerites', 'A empresa aprova antes de liberar para você') + '<div class="card"><ul class="list">' +
        '<li><span>Outubro de 2026<span class="sub">' + (st === 'liberado' ? 'Liberado pela empresa' : 'Lançado pelo contador; aguardando aprovação da empresa') + '</span></span>' + (st === 'liberado' ? '<button type="button" class="btn btn-sm btn-primary" data-act="slip" data-id="' + ME + '">Ver e baixar</button>' : pill('warn', 'Em aprovação')) + '</li>' +
        '<li><span>Setembro de 2026<span class="sub">Liberado em 03/10</span></span><button type="button" class="btn btn-sm" data-act="slip" data-id="' + ME + '">Segunda via</button></li>' +
        '<li><span>Agosto de 2026<span class="sub">Liberado em 03/09</span></span><button type="button" class="btn btn-sm" data-act="slip" data-id="' + ME + '">Segunda via</button></li></ul></div>';
    }
    var fa = faltasAbertas();
    var faltasTxt = fa.map(function (f) { return first(P(f.pessoa).nome) + ' (' + dmy(f.data) + (f.atestado ? ', atestado sem o original' : '') + ')'; }).join(', ');
    var empresa = S.role === 'empresa';
    var rows = S.pessoas.map(function (p) {
      var h = holerite(p.id), st = statusHolerite(p.id), temFalta = fa.some(function (f) { return f.pessoa === p.id; });
      return '<tr>' + (empresa ? '<td><input type="checkbox" aria-label="Selecionar ' + esc(p.nome) + '" data-in="sel-hol" data-id="' + p.id + '"' + (st === 'liberado' ? ' disabled checked' : '') + '></td>' : '') +
        '<td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao) + '</span></td><td class="num hide-sm">' + brl(h.prov) + '</td><td class="num hide-sm">' + brl(h.desc) + '</td><td class="num"><strong>' + brl(h.liq) + '</strong></td><td>' + (st === 'liberado' ? pill('ok', 'Liberado') : temFalta ? pill('bad', 'Tem falta não abonada') : pill('warn', 'Aguardando aprovação')) + '</td>' +
        '<td class="num"><button type="button" class="btn btn-sm" data-act="slip" data-id="' + p.id + '">Ver</button>' + (S.role === 'contador' ? ' <button type="button" class="btn btn-sm" data-act="lancar" data-id="' + p.id + '">Lançar</button>' : '') + '</td></tr>';
    }).join('');
    var lib = S.holerites.aprovados.length;
    return titleRow('Holerites', 'Competência ' + comp + ' · lançados pelo contador em ' + dmy(S.holerites.lancadoEm), empresa ? '<button type="button" class="btn" data-act="aprovar-sel">Aprovar selecionados</button><button type="button" class="btn btn-primary" data-act="aprovar-todos"' + (lib === S.pessoas.length ? ' disabled' : '') + '>Aprovar todos</button>' : '') +
      '<div class="stack">' + (fa.length ? '<div class="notice bad"><div><strong>' + fa.length + ' falta(s) sem abono em outubro</strong>' + esc(faltasTxt) + '. Confira antes de aprovar: falta sem atestado desconta o dia e o DSR da semana (Lei 605/49, art. 6º). <a href="#/atestados">Ver atestados</a></div></div>' : '') +
      '<div class="card"><div class="card-head"><h2>Contador lança, empresa aprova, funcionário recebe</h2><span class="pill ' + (lib === S.pessoas.length ? 'ok' : 'warn') + '">' + lib + ' de ' + S.pessoas.length + ' liberados</span></div><div class="table-box"><table class="t stack-sm"><thead><tr>' + (empresa ? '<th><span class="sr-only">Selecionar</span></th>' : '') + '<th>Pessoa</th><th class="num hide-sm">Proventos</th><th class="num hide-sm">Descontos</th><th class="num">Líquido (R$)</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
  }

  /* ---------- Checklists ---------- */
  var FOTO = { todos: 'Foto em todos os itens', parcial: 'Só nos itens marcados', nenhum: 'Sem foto' };
  /* ---------- Checklists com horário ---------- */
  // Modelo: { id, nome, setor, resp, dias, inicio, limite, criado, etapas: [{ id, t, foto, limite }] }.
  // Cada etapa marcada vira um registro do dia (hora do servidor no modo conectado), com foto tirada na hora e justificativa depois do limite.
  function hm(m) { m = ((m % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function normalizaChecklists() {
    var mudou = false;
    (S.checklists || []).forEach(function (c) {
      if (Array.isArray(c.etapas)) return; mudou = true;
      c.etapas = (c.itens || []).map(function (it, k) { return { id: 'e' + (k + 1), t: String(it.t || '').slice(0, 120), foto: !!it.foto }; });
      c.inicio = hhOk(c.hora) || '07:00'; c.limite = hm(min(c.inicio) + 60); c.dias = [0, 1, 2, 3, 4, 5, 6];
      if (!S.real) { S.ckRegs = S.ckRegs || []; (c.itens || []).forEach(function (it, k) { if (it.feito) S.ckRegs.push({ id: 'k' + c.id + k, checklist_id: c.id, etapa_id: 'e' + (k + 1), dia: S.hoje, pessoa_id: c.resp || null, por_nome: nomeDe(c.resp), em: S.hoje + 'T' + (hhOk(it.fotoEm) || c.inicio) + ':00-03:00', atrasado: false, justificativa: null, foto: null }); }); }
      delete c.itens; delete c.hora; delete c.foto;
    });
    return mudou;
  }
  function ckDia() { return S.real ? hojeEm(fusoEmp()) : S.hoje; }
  function ckAgora() { return S.real ? agoraEm(fusoEmp()) : demoAgora(); }
  function ckPorId(id) { return (S.checklists || []).filter(function (c) { return c.id === id; })[0]; }
  function ckVisiveis() { var todos = !ehFunc() || pode('checklists'), eu = P(ME) || {}; return (S.checklists || []).filter(function (c) { return todos || c.resp === ME || c.setor === eu.setor; }); }
  function ckRoda(c, dia) { return (c.dias || [0, 1, 2, 3, 4, 5, 6]).indexOf(diaSemana(dia)) > -1; }
  function ckRegsDe(cid, dia) { return (S.ckRegs || []).filter(function (r) { return r.checklist_id === cid && r.dia === dia; }); }
  function ckReg(cid, eid, dia) { return (S.ckRegs || []).filter(function (r) { return r.checklist_id === cid && r.etapa_id === eid && r.dia === dia; })[0]; }
  function ckLimite(c, et) { return hhOk(et && et.limite) || hhOk(c.limite) || ''; }
  // Ajuste só para um dia: { inicio, limite, etapas } em c.ajustes[dia]. No dia seguinte vale o checklist normal.
  function ckEfetivo(c, dia) {
    var a = c && c.ajustes && c.ajustes[dia]; if (!a) return c;
    return { id: c.id, nome: c.nome, setor: c.setor, resp: c.resp, dias: c.dias, criado: c.criado, inicio: hhOk(a.inicio) || c.inicio, limite: hhOk(a.limite) || c.limite, etapas: Array.isArray(a.etapas) ? a.etapas : c.etapas, ajustado: true };
  }
  function ckAtrasado(c, et, h) { c = ckEfetivo(c, ckDia()); var ini = hhOk(c.inicio), lim = ckLimite(c, et); if (!lim) return false; var a = min(h), l = min(lim); if (ini && l < min(ini)) return a > l && a < min(ini); return a > l; }
  function ckAberto(c, h) { c = ckEfetivo(c, ckDia()); var ini = hhOk(c.inicio), lim = hhOk(c.limite); if (!ini) return true; if (lim && min(lim) < min(ini)) return true; return min(h) >= min(ini); }
  function ckResumo(c, dia) {
    var ids = (ckEfetivo(c, dia).etapas || []).map(function (e) { return e.id; }), fs = ckRegsDe(c.id, dia).filter(function (r) { return ids.indexOf(r.etapa_id) > -1; });
    return { feitas: fs.length, total: ids.length, atrasos: fs.filter(function (r) { return r.atrasado; }).length, fim: fs.length === ids.length && ids.length ? fs.map(function (r) { return r.em; }).sort().pop() : null };
  }
  function ckSituacao(c) {
    var dia = ckDia(), h = ckAgora(), r = ckResumo(c, dia), e = ckEfetivo(c, dia);
    if (!ckRoda(c, dia)) return ['mute', 'Não tem hoje'];
    if (r.total && r.feitas === r.total) return [r.atrasos ? 'warn' : 'ok', 'Concluído' + (r.atrasos ? ', ' + r.atrasos + ' com justificativa' : '')];
    if (!ckAberto(c, h)) return ['mute', 'Abre às ' + e.inicio];
    if (ckAtrasado(c, {}, h)) return ['bad', 'Atrasado'];
    return ['warn', 'Até ' + e.limite];
  }
  function ckDiaHTML(lista, dia) {
    return lista.map(function (c0) {
      var c = ckEfetivo(c0, dia); if (!ckRoda(c0, dia) && !ckRegsDe(c0.id, dia).length) return '';
      var r = ckResumo(c0, dia), est = ckEstadoDia(c0, dia);
      return '<div class="stack"><h3 class="lbl-s">' + esc(c.nome) + ' · ' + r.feitas + ' de ' + r.total + ' ' + pill(est === 'ok' ? 'ok' : est === 'warn' ? 'warn' : est === 'bad' ? 'bad' : 'mute', CAL_TXT[est] || '') + (c.ajustado ? ' ' + pill('mute', 'ajustado só neste dia') : '') + '</h3><div class="card"><ul class="list">' + (c.etapas || []).map(function (e) {
        var rg = ckReg(c.id, e.id, dia);
        return '<li><span>' + esc(e.t) + '<span class="sub">' + (rg ? 'Feita às ' + esc(ckHora(rg)) + ' por ' + esc(rg.por_nome || '') + (rg.atrasado ? ' · depois do limite (' + esc(ckLimite(c, e)) + ')' : '') + (rg.justificativa ? ' · Justificativa: ' + esc(rg.justificativa) : '') : 'Não feita' + (ckLimite(c, e) ? ' · limite ' + esc(ckLimite(c, e)) : '')) + '</span></span><span class="actions">' +
          (rg && rg.foto ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(rg.foto) + '" data-t="' + esc(e.t) + '">Foto</button>' : '') + (rg ? pill(rg.atrasado ? 'warn' : 'ok', rg.atrasado ? 'Com justificativa' : 'No horário') : pill('bad', 'Não feita')) + '</span></li>';
      }).join('') + '</ul></div></div>';
    }).join('') || '<p class="ui-sub">Nada registrado neste dia.</p>';
  }
  function vChecklists() {
    var lista = ckVisiveis(), edita = S.role === 'empresa';
    var acoes = edita ? '<button type="button" class="btn' + ((S.checklists || []).length ? '' : ' btn-primary') + '" data-act="ck-editar">Novo checklist</button>' : '';
    if (!lista.length) return titleRow('Checklists', 'Rotinas do dia, etapa por etapa', acoes) + vazioHTML(edita ? 'Nenhum checklist ainda' : 'Nenhum checklist para você', edita ? 'Crie o checklist de abertura, de preparo de materiais ou de fechamento. Há modelos prontos para começar.' : 'Quando a empresa criar um checklist do seu setor, ele aparece aqui.', edita ? '<button type="button" class="btn btn-primary btn-lg" data-act="ck-editar">Criar o primeiro checklist</button>' : '');
    var base = lista.filter(function (x) { return x.id === S.ui.ck; })[0] || lista[0], dia = ckDia(), c = ckEfetivo(base, dia), agoraH = ckAgora(), roda = ckRoda(base, dia), aberto = ckAberto(base, agoraH), r = ckResumo(base, dia), st = ckSituacao(base);
    var tabs = lista.length > 1 ? '<div class="tabs" role="tablist">' + lista.map(function (x) { var rx = ckResumo(x, dia); return '<button type="button" role="tab" data-act="ck" data-id="' + esc(x.id) + '" aria-selected="' + (x.id === base.id) + '">' + esc(x.nome) + ' <span class="pill ' + ckSituacao(x)[0] + '">' + rx.feitas + '/' + rx.total + '</span></button>'; }).join('') + '</div>' : '';
    var proxima = (c.etapas || []).filter(function (e) { return !ckReg(c.id, e.id, dia); })[0];
    var etapas = (c.etapas || []).map(function (e, i) {
      var rg = ckReg(c.id, e.id, dia), lim = ckLimite(c, e), late = !rg && roda && aberto && ckAtrasado(base, e, agoraH), agora = e === proxima && roda && aberto;
      var info = rg ? '<span class="sub">Feita às ' + esc(ckHora(rg)) + ' · ' + esc(rg.por_nome || '') + '</span>' + (rg.justificativa ? '<span class="sub">Justificativa: ' + esc(rg.justificativa) + '</span>' : '')
        : (late ? '<span class="sub ck-late">Passou das ' + esc(lim) + ': vai pedir justificativa</span>' : agora && lim !== c.limite && lim ? '<span class="sub">até ' + esc(lim) + '</span>' : '');
      var bt = rg ? (rg.foto ? '<button type="button" class="btn btn-sm" data-act="arq-ver" data-path="' + esc(rg.foto) + '" data-t="' + esc(e.t) + '">Foto</button>' : '') + (rg.atrasado ? pill('warn', 'Com justificativa') : '') + (edita ? '<button type="button" class="link-btn" data-act="ck-desfazer" data-id="' + esc(rg.id) + '">desfazer</button>' : '')
        : !roda || !aberto ? '' : '<button type="button" class="btn' + (agora ? ' btn-primary btn-lg' : '') + '" data-act="ck-marcar" data-id="' + esc(c.id) + '" data-e="' + esc(e.id) + '">' + (e.foto ? 'Tirar foto e marcar' : 'Marcar') + '</button>';
      return '<li class="ck-etapa' + (rg ? ' feita' : agora ? ' agora' : '') + (late ? ' atrasada' : '') + '"><span class="ld-ic" aria-hidden="true">' + (rg ? '✓' : i + 1) + '</span><span class="ck-t"><strong>' + esc(e.t) + '</strong>' + info + '</span><span class="actions">' + bt + '</span></li>';
    }).join('');
    var meta = [c.inicio && c.limite ? c.inicio + ' às ' + c.limite : '', c.resp ? nomeDe(c.resp) : c.setor].filter(Boolean).join(' · ');
    var aviso = !roda ? '<p class="ck-aviso">Este checklist não acontece hoje.</p>' : !aberto ? '<p class="ck-aviso">Abre às ' + esc(c.inicio) + '. Até lá, as etapas ficam fechadas.</p>' : '';
    var head = '<div class="ck-topo"><div><h2>' + esc(c.nome) + (c.ajustado ? ' ' + pill('warn', 'ajustado só hoje') : '') + '</h2><span class="ui-sub">' + esc(meta) + '</span></div>' + pill(st[0], st[1]) + '</div>' +
      '<div class="ck-prog"><progress max="' + (r.total || 1) + '" value="' + r.feitas + '">' + r.feitas + '</progress><span class="num">' + r.feitas + ' de ' + r.total + '</span></div>' + aviso;
    var rod = '<div class="ck-acoes">' + (edita ? '<button type="button" class="btn" data-act="ck-editar-escolha" data-id="' + esc(base.id) + '">Editar</button>' : '') + '<button type="button" class="btn" data-act="ck-hist" data-id="' + esc(base.id) + '">Histórico</button>' + (edita && c.ajustado ? '<button type="button" class="link-btn" data-act="ck-hoje-desfazer" data-id="' + esc(base.id) + '">Voltar ao normal hoje</button>' : '') + '</div>';
    return titleRow('Checklists', 'Rotinas do dia, etapa por etapa', acoes) + tabs + '<div class="ck-wrap"><div class="card">' + head + '<ol class="ck-lista">' + etapas + '</ol>' + rod + '</div></div>';
  }
  var ET_N = 0;
  function etTags(e) { return (e.foto ? '<span class="pill mute">foto</span>' : '') + (hhOk(e.limite) ? '<span class="pill mute">até ' + esc(e.limite) + '</span>' : ''); }
  function etLinha(e) {
    e = e || {}; var id = 'et' + (++ET_N);
    return '<div class="et-row" data-et><input type="hidden" name="et_id" value="' + esc(e.id || '') + '"><span class="et-n" aria-hidden="true"></span>' +
      '<input class="et-txt" id="' + id + 't" name="et_t" maxlength="120" value="' + esc(e.t || '') + '" placeholder="O que fazer nesta etapa" aria-label="O que fazer nesta etapa" required>' +
      '<span class="et-tags">' + etTags(e) + '</span><button type="button" class="btn btn-sm" data-act="et-cfg" aria-expanded="false" aria-controls="' + id + 'm">Configurar</button>' +
      '<div class="et-mais" id="' + id + 'm" hidden><div class="form-grid"><div class="field"><label for="' + id + 'f">Foto</label><select id="' + id + 'f" name="et_f"><option value="0">Sem foto</option><option value="1"' + (e.foto ? ' selected' : '') + '>Exige foto tirada na hora</option></select></div>' +
      '<div class="field"><label for="' + id + 'l">Horário limite desta etapa (se for diferente)</label><input id="' + id + 'l" name="et_l" type="time" value="' + esc(e.limite || '') + '"></div></div>' +
      '<div class="et-acoes"><button type="button" class="btn btn-sm" data-act="et-mover" data-d="-1">Subir</button><button type="button" class="btn btn-sm" data-act="et-mover" data-d="1">Descer</button><button type="button" class="btn btn-sm" data-act="et-del">Remover etapa</button></div></div></div>';
  }
  function ckForm(c, escopo) {
    var novo = !c, hoje = escopo === 'hoje', dia = ckDia(); c = c ? (hoje ? ckEfetivo(c, dia) : c) : { nome: '', setor: '', resp: '', dias: [1, 2, 3, 4, 5, 6], inicio: '', limite: '', etapas: [] };
    var horas = '<div class="form-grid"><div class="field"><label for="ck-i">Abre às</label><input id="ck-i" name="ini" type="time" required value="' + esc(c.inicio) + '"></div><div class="field"><label for="ck-l">Horário limite</label><input id="ck-l" name="lim" type="time" required value="' + esc(c.limite) + '"></div></div>';
    var etapas = '<div class="stack et-lista" data-ets>' + ((c.etapas || []).length ? c.etapas.map(etLinha).join('') : etLinha()) + '</div><div><button type="button" class="btn" data-act="et-add">+ Adicionar etapa</button></div>';
    if (hoje) return '<form class="stack wiz" novalidate data-form="ck" data-escopo="hoje" data-id="' + esc(c.id) + '">' + wizBarra(['Horário de hoje', 'Etapas de hoje', 'Conferir']) +
      wizPasso(1, 'Horário só de hoje (' + dmy(dia) + ')', '<p class="ui-sub">Amanhã o checklist volta ao normal.</p>' + horas) +
      wizPasso(2, 'Etapas só de hoje', '<p class="ui-sub">Escreva, tire ou acrescente etapas. Toque em "Configurar" para foto e horário de uma etapa.</p>' + etapas) +
      wizPasso(3, 'Conferir e salvar', '<div data-ckresumo></div>') + wizNav('Salvar só para hoje') + '</form>';
    var setores = {}; S.pessoas.forEach(function (p) { if (p.setor) setores[p.setor] = 1; }); (S.checklists || []).forEach(function (x) { if (x.setor) setores[x.setor] = 1; });
    var modelos = novo ? '<div class="field"><span class="lbl-s">Comece por um modelo (dá para mudar tudo depois) ou do zero</span><div class="preset-grid">' + CK_MODELOS.map(function (m, i) { return '<button type="button" class="preset" data-act="ck-modelo" data-i="' + i + '"><strong>' + esc(m[0]) + '</strong><span>' + esc(m[1] + ' às ' + m[2] + ' · ' + m[3].length + ' etapas') + '</span></button>'; }).join('') + '</div></div>' : '';
    return '<form class="stack wiz" novalidate data-form="ck" data-escopo="sempre" data-id="' + esc(c.id || '') + '">' + wizBarra(['Nome e horário', 'Etapas', 'Conferir']) +
      wizPasso(1, 'Nome, setor e horário', modelos + '<div class="field"><label for="ck-n">Nome do checklist</label><input id="ck-n" name="n" maxlength="60" required value="' + esc(c.nome) + '" placeholder="Ex.: Abertura da loja"></div>' +
        '<div class="form-grid"><div class="field"><label for="ck-s">Setor</label><input id="ck-s" name="s" maxlength="40" list="ck-setores" value="' + esc(c.setor) + '" placeholder="Ex.: Atendimento"><datalist id="ck-setores">' + Object.keys(setores).map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="ck-r">Quem faz</label><select id="ck-r" name="r"><option value="">Qualquer pessoa do setor</option>' + S.pessoas.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === c.resp ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field"><span class="lbl-s">Dias em que acontece</span>' + diasChips('ckd', c.dias) + '</div>' + horas) +
      wizPasso(2, 'Etapas, na ordem', '<p class="ui-sub">Escreva cada etapa. Toque em "Configurar" quando a etapa precisar de foto ou de um horário próprio.</p>' + etapas) +
      wizPasso(3, 'Conferir e salvar', '<div data-ckresumo></div>' + (novo ? '' : '<p><button type="button" class="link-btn" data-act="ck-del" data-id="' + esc(c.id) + '">Remover este checklist</button></p>')) + wizNav('Salvar checklist') + '</form>';
  }
  function atualizaCkResumo(f) {
    var box = $('[data-ckresumo]', f); if (!box) return;
    var d = new FormData(f), hoje = f.dataset.escopo === 'hoje', tx = d.getAll('et_t'), fs = d.getAll('et_f'), ls = d.getAll('et_l'), ds = d.getAll('ckd').map(Number), resp = P(String(d.get('r') || '')), base = ckPorId(f.dataset.id) || {};
    var ets = tx.map(function (t, i) { return { t: String(t).trim(), foto: fs[i] === '1', limite: hhOk(ls[i]) }; }).filter(function (e) { return e.t; });
    box.innerHTML = '<div class="conf-j"><p><strong>' + esc(hoje ? base.nome : String(d.get('n') || '')) + '</strong> · ' + esc(hoje ? 'só hoje, ' + dmy(ckDia()) + '; amanhã volta ao normal' : String(d.get('s') || 'Geral') + ' · ' + (resp ? resp.nome : 'qualquer pessoa do setor')) + '</p><p class="ui-sub">' + esc((hoje ? '' : diasTxt(ds.length ? ds : [0, 1, 2, 3, 4, 5, 6]) + ' · ') + 'abre às ' + hhOk(d.get('ini')) + ' · limite ' + hhOk(d.get('lim'))) + '</p>' +
      '<ol class="linha-dia">' + ets.map(function (e, i) { return '<li><span class="ld-ic" aria-hidden="true">' + (i + 1) + '</span><span class="ld-t">' + esc(e.t) + (e.foto || e.limite ? '<span class="sub">' + esc((e.foto ? 'foto tirada na hora' : '') + (e.foto && e.limite ? ' · ' : '') + (e.limite ? 'limite ' + e.limite : '')) + '</span>' : '') + '</span></li>'; }).join('') + '</ol></div>';
  }
  // Situação de um dia: ok (no horário), warn (com justificativa), bad (incompleto ou não feito), hoje, futuro, folga, vazio.
  function ckEstadoDia(c, dia) {
    var hoje = ckDia(), r = ckResumo(c, dia);
    if (!ckRoda(c, dia)) return r.feitas ? (r.atrasos ? 'warn' : 'ok') : 'folga';
    if (dia > hoje) return 'futuro';
    if (r.total && r.feitas === r.total) return r.atrasos ? 'warn' : 'ok';
    if (dia === hoje) return ckAtrasado(c, {}, ckAgora()) ? 'bad' : 'hoje';
    if (r.feitas) return 'bad';
    return c.criado && dia >= c.criado ? 'bad' : 'vazio';
  }
  function ckHora(r) { return hhmm(r.em, fusoEmp()); }
  var MES_N = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CAL_TXT = { ok: 'feito no horário', warn: 'feito, com justificativa', bad: 'incompleto ou não feito', hoje: 'hoje, em andamento', futuro: '', folga: 'não acontece neste dia', vazio: 'sem registro' };
  function ckCalendario(lista, cid) {
    var hoje = ckDia(), base = S.ui.ckMes && /^\d{4}-\d{2}$/.test(S.ui.ckMes) ? S.ui.ckMes : hoje.slice(0, 7), ano = +base.slice(0, 4), mes = +base.slice(5, 7);
    var ini = base + '-01', nd = new Date(ano, mes, 0).getDate(), pri = diaSemana(ini), cel = '', pior = { bad: 5, warn: 4, hoje: 3, ok: 2, vazio: 1, folga: 0, futuro: -1 };
    for (var b = 0; b < pri; b++) cel += '<span class="cal-d cal-pad" aria-hidden="true"></span>';
    for (var d = 1; d <= nd; d++) {
      var dia = base + '-' + ('0' + d).slice(-2), est = 'futuro', feitas = 0, total = 0;
      lista.forEach(function (c) { var e = ckEstadoDia(c, dia), r = ckResumo(c, dia); if (ckRoda(c, dia) || r.feitas) { feitas += r.feitas; total += r.total; } if (pior[e] > pior[est]) est = e; });
      var rot = d + ' de ' + MES_N[mes - 1] + (CAL_TXT[est] ? ': ' + CAL_TXT[est] : '') + (total ? ', ' + feitas + ' de ' + total + ' etapas' : '');
      var clic = (feitas || est === 'bad' || est === 'hoje') && dia <= hoje;
      cel += (clic ? '<button type="button" data-act="ck-dia" data-id="' + esc(cid || '') + '" data-dia="' + dia + '"' : '<span') + ' class="cal-d cal-' + est + (dia === hoje ? ' cal-agora' : '') + '" aria-label="' + esc(rot) + '" title="' + esc(rot) + '"><span class="cal-n">' + d + '</span>' + (total && ['ok', 'warn', 'bad', 'hoje'].indexOf(est) > -1 ? '<span class="cal-x"><span class="cal-s" aria-hidden="true">' + ({ ok: '✓', warn: '!', bad: '×', hoje: '•' })[est] + '</span>' + feitas + '/' + total + '</span>' : '') + (clic ? '</button>' : '</span>');
    }
    var mesAnt = new Date(ano, mes - 2, 1), mesProx = new Date(ano, mes, 1), lim = addDays(hoje, -92).slice(0, 7), fmt = function (x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2); };
    var pa = fmt(mesAnt), pp = fmt(mesProx);
    return '<div class="card cal-card"><div class="card-head"><h2>Calendário</h2><div class="cal-nav"><button type="button" class="btn btn-sm" data-act="ck-mes" data-v="' + pa + '"' + (pa < lim ? ' disabled' : '') + ' aria-label="Mês anterior">‹</button><strong>' + esc(MES_N[mes - 1] + ' de ' + ano) + '</strong><button type="button" class="btn btn-sm" data-act="ck-mes" data-v="' + pp + '"' + (pp > hoje.slice(0, 7) ? ' disabled' : '') + ' aria-label="Próximo mês">›</button></div></div>' +
      '<div class="card-pad"><div class="cal-sem" aria-hidden="true">' + ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="cal-grid">' + cel + '</div>' +
      '<ul class="cal-leg"><li><span class="cal-dot cal-ok"></span>No horário</li><li><span class="cal-dot cal-warn"></span>Com justificativa</li><li><span class="cal-dot cal-bad"></span>Incompleto ou não feito</li><li><span class="cal-dot cal-hoje"></span>Hoje</li></ul><p class="ui-sub">Toque no dia para ver etapas, horários, justificativas e fotos.</p></div></div>';
  }
  function marcarEtapa(c, e) {
    var h = ckAgora(), late = ckAtrasado(c, e, h), lim = ckLimite(c, e);
    if (!ckAberto(c, h)) { toast('Este checklist abre às ' + c.inicio + '.'); return; }
    if (!e.foto && !late) { gravarEtapa(c, e, null, '').then(null, function (er) { toast(erroTxt(er)); }); return; }
    modal(e.t, (e.foto ? '<div class="cam traseira"><video id="cam-v" autoplay playsinline muted></video></div><p class="cam-st" id="cam-st" role="status">Abrindo a câmera…</p><p class="ui-sub">A foto é tirada agora, pela câmera. Não dá para escolher da galeria.</p>' : '') +
      (late ? '<div class="field"><label for="ck-j">Justificativa (obrigatória: passou do limite das ' + esc(lim) + ')</label><textarea id="ck-j" rows="3" maxlength="300" placeholder="Ex.: o fornecedor atrasou a entrega"></textarea></div>' : ''),
      '<button type="button" class="btn btn-primary btn-lg" id="ck-ok"' + (e.foto ? ' disabled' : '') + '>' + (e.foto ? 'Tirar foto e marcar' : 'Marcar como feita') + '</button>');
    var bt = $('#ck-ok'), v = $('#cam-v'), txt = function (t) { var el = $('#cam-st'); if (el) el.textContent = t; };
    if (e.foto) abrirCamera(v, 'environment', function () { txt('Enquadre o que foi feito e toque no botão.'); bt.disabled = false; }, function (m) { txt(m); });
    bt.addEventListener('click', function () {
      var j = $('#ck-j'), jt = j ? j.value.trim() : '';
      if (late && jt.length < 5) { toast('Escreva a justificativa (pelo menos 5 letras).'); if (j) j.focus(); return; }
      bt.disabled = true; bt.textContent = 'Registrando…';
      (e.foto ? capturaFrame(v, 1280) : Promise.resolve(null)).then(function (blob) { if (e.foto && !blob) throw new Error('Não foi possível tirar a foto. Feche e abra de novo.'); return gravarEtapa(c, e, blob, jt); })
        .then(function () { pararCamera(); closeModal(); }, function (er) { bt.disabled = false; bt.textContent = 'Tentar de novo'; toast(erroTxt(er)); });
    });
  }
  function gravarEtapa(c, e, blob, jt) {
    var dia = ckDia(), quem = ehFunc() ? ME : null;
    if (ckReg(c.id, e.id, dia)) return Promise.reject(new Error('Esta etapa já foi marcada hoje.'));
    var up = blob ? Arq().enviar(caminho(quem || 'empresa', 'checklists', 'jpg'), blob) : Promise.resolve(null);
    return up.then(function (path) {
      var row = { checklist_id: c.id, etapa_id: e.id, pessoa_id: quem, por_nome: quemSou(), foto: path, justificativa: jt || null };
      if (NUVEM) return Nuvem.marcarEtapa(row);
      row.id = 'k' + Date.now() + rnd(); row.dia = dia; row.em = S.real ? new Date().toISOString() : dia + 'T' + ckAgora() + ':00-03:00'; row.atrasado = ckAtrasado(c, e, ckAgora()); if (!row.atrasado) row.justificativa = null;
      return row;
    }).then(function (row) {
      S.ckRegs = S.ckRegs || []; S.ckRegs.push(row);
      var r = ckResumo(c, dia); save(); render();
      toast(r.total && r.feitas === r.total ? c.nome + ' concluído. Bom trabalho!' : 'Etapa marcada às ' + ckHora(row) + (row.atrasado ? ', com justificativa' : '') + '. Faltam ' + (r.total - r.feitas) + '.');
    });
  }
  var CK_MODELOS = [
    ['Abertura da loja', '06:30', '07:00', ['Desligar o alarme e abrir as portas', 'Acender as luzes e ligar os equipamentos', 'Conferir a temperatura das geladeiras e do freezer|1', 'Conferir o troco do caixa', 'Limpar balcão e vitrine|1', 'Abrir para o público']],
    ['Preparo de materiais', '07:00', '09:00', ['Separar os insumos do dia', 'Conferir a validade e as etiquetas|1', 'Higienizar bancadas e utensílios|1', 'Preparar as bases e porcionar', 'Organizar a área de trabalho|1']],
    ['Fechamento da loja', '21:30', '22:30', ['Fechar o caixa e guardar o dinheiro', 'Limpar salão e balcão|1', 'Desligar os equipamentos', 'Conferir geladeiras e freezer fechados|1', 'Recolher o lixo', 'Ligar o alarme e trancar as portas|1']]
  ];

  /* ---------- Estoque e etiquetas ---------- */
  function labelHTML(p, n) { var out = ''; for (var i = 0; i < n; i++) out += '<div class="label"><strong>' + esc(p.nome) + '</strong><span class="sub num">' + esc(p.cod) + ' · lote ' + esc(p.lote) + ' · val. ' + dmyy(p.validade) + '</span><div class="bc">' + window.Code39.svg(p.cod, 48) + '</div><span class="price num">' + (p.preco == null ? 'Uso interno' : 'R$ ' + brl(p.preco)) + '</span></div>'; return out; }
  function vEstoque() {
    var sel = S.ui.etq || {};
    var rows = S.produtos.map(function (p) {
      var dv = diffDays(S.hoje, p.validade), baixo = p.qtd < p.min;
      return '<tr><td><input type="checkbox" aria-label="Etiqueta de ' + esc(p.nome) + '" data-in="etq" data-id="' + p.id + '"' + (sel[p.id] ? ' checked' : '') + '></td><td><strong>' + esc(p.nome) + '</strong><span class="sub num">' + esc(p.cod) + ' · lote ' + esc(p.lote) + '</span></td><td class="hide-sm">' + (dv <= 3 ? pill('warn', 'vence ' + dmy(p.validade)) : dmyy(p.validade)) + '</td>' +
        '<td class="num"><button type="button" class="btn btn-sm" data-act="qtd" data-id="' + p.id + '" data-d="-1" aria-label="Tirar um">−</button> <strong class="num">' + p.qtd + '</strong> <button type="button" class="btn btn-sm" data-act="qtd" data-id="' + p.id + '" data-d="1" aria-label="Pôr um">+</button></td><td class="num hide-sm">' + p.min + '</td><td>' + (baixo ? pill('bad', 'Repor') : pill('ok', 'Ok')) + '</td><td class="num hide-sm">' + (p.preco == null ? 'insumo' : brl(p.preco)) + '</td></tr>';
    }).join('');
    var escolhidos = S.produtos.filter(function (p) { return sel[p.id]; });
    var prev = escolhidos.length ? '<div class="card card-pad stack"><div class="title-row"><div><h2 class="sec">Prévia das etiquetas</h2><p class="ui-sub">Código de barras padrão Code 39, lido por leitores comuns.</p></div><div class="actions"><label class="check ui-sub">Cópias de cada <input type="number" min="1" max="40" value="' + (S.ui.copias || 2) + '" data-in="copias" class="num" aria-label="Cópias de cada etiqueta"></label><button type="button" class="btn btn-primary" data-act="print-etq">Imprimir etiquetas</button></div></div><div class="labels" id="labels">' + escolhidos.map(function (p) { return labelHTML(p, 1); }).join('') + '</div></div>' : '<div class="notice info"><div>Marque os produtos na tabela para gerar as etiquetas.</div></div>';
    var nSug = sugestaoCompra().length;
    return titleRow('Estoque e etiquetas', S.produtos.filter(function (p) { return p.qtd < p.min; }).length + ' produtos abaixo do mínimo', '<button type="button" class="btn" data-act="prod-novo">Cadastrar produto</button><button type="button" class="btn btn-primary" data-act="cmp-ir">' + (nSug ? 'Pôr ' + nSug + ' na lista de compras' : 'Ver lista de compras') + '</button>') +
      '<div class="stack"><div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th><span class="sr-only">Etiqueta</span></th><th>Produto</th><th class="hide-sm">Validade</th><th class="num">Quantidade</th><th class="num hide-sm">Mínimo</th><th>Estoque</th><th class="num hide-sm">Preço (R$)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + prev + '</div>';
  }

  /* ---------- Vales ---------- */
  function vVales() {
    var func = ehFunc();
    var lista = S.vales.filter(function (v) { return !func || v.pessoa === ME; }).slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; });
    var rows = lista.map(function (v) {
      var aut = v.assinado ? pill('ok', 'Assinado ' + dmy(v.assinado)) : pill('warn', 'Aguardando assinatura');
      var folha = v.assinado ? (S.real ? 'Folha de ' + compTxt(v.comp) : v.comp === '2026-10' ? 'Folha de outubro' : 'Folha de novembro') : 'Bloqueado até assinar';
      var acao = func && !v.assinado ? '<button type="button" class="btn btn-sm btn-primary" data-act="assinar" data-id="' + v.id + '">Assinar autorização</button>' : '';
      return '<tr><td class="num">' + dmy(v.data) + '</td><td><strong>' + esc(P(v.pessoa).nome) + '</strong><span class="sub">' + esc(v.desc) + '</span></td><td class="hide-sm">' + (v.tipo === 'adiantamento' ? 'Adiantamento' : 'Produto da loja') + '</td><td class="num">' + brl(v.valor) + '</td><td>' + aut + '</td><td class="hide-sm">' + esc(folha) + '</td><td class="num">' + acao + '</td></tr>';
    }).join('');
    var resumo = '';
    if (!func) {
      var comp = '2026-11';
      resumo = '<div><h2 class="sec">Descontos de novembro sobre o salário</h2><div class="card"><ul class="list">' + S.pessoas.filter(function (p) { return valesDe(p.id).length; }).map(function (p) {
        var pc = pctDescontos(p.id, comp);
        return '<li><span>' + esc(p.nome) + '<span class="sub">' + pc + '% do salário</span></span><meter min="0" max="100" low="60" high="70" optimum="10" value="' + pc + '">' + pc + '%</meter></li>';
      }).join('') + '</ul></div></div>';
    }
    return titleRow(func ? 'Seus vales' : 'Vales', 'Produtos da loja e adiantamentos descontados em folha, sempre com autorização escrita', func ? '' : '<button type="button" class="btn btn-primary" data-act="novo-vale">Novo vale</button>') +
      '<div class="grid-main"><div class="stack"><div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th class="num">Data</th><th>Pessoa e itens</th><th class="hide-sm">Tipo</th><th class="num">Valor (R$)</th><th>Autorização</th><th class="hide-sm">Desconto</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>' +
      '<div class="stack"><div class="notice info"><div><strong>Regra do desconto</strong>Só com autorização prévia e por escrito (CLT, art. 462; Súmula 342 do TST). O Seu Comando avisa em 60% e trava novos vales quando os descontos do mês chegam a 70% do salário (OJ 18 da SDC/TST).</div></div>' + resumo + '</div></div>';
  }

  /* ---------- Lista de compras ---------- */
  // Regra: o que está abaixo do mínimo e vem de fornecedor entra na lista com a quantidade para voltar ao estoque ideal.
  // O que é produção própria não se compra: é repor na produção.
  function sugestaoCompra() { return S.produtos.filter(function (p) { return p.qtd < p.min && p.fornecedor !== 'Produção própria' && !S.compras.itens.some(function (i) { return i.prod === p.id; }); }); }
  function gerarCompras() {
    var novos = sugestaoCompra();
    novos.forEach(function (p) { S.compras.itens.push({ id: 'k' + Date.now() + p.id, prod: p.id, nome: p.nome.replace(' (insumo)', ''), qtd: Math.max(1, Math.ceil((p.ideal || p.min * 2) - p.qtd)), un: p.un, fornecedor: p.fornecedor, custo: p.custo || 0, origem: 'estoque', comprado: false }); });
    return novos.length;
  }
  function totalCompras(lista) { return (lista || S.compras.itens).reduce(function (s, i) { return s + i.qtd * (i.custo || 0); }, 0); }
  function fornecedores() { var f = []; S.compras.itens.forEach(function (i) { if (f.indexOf(i.fornecedor) < 0) f.push(i.fornecedor); }); return f.sort(); }
  function origemTxt(i) {
    if (i.origem === 'estoque') { var p = S.produtos.filter(function (x) { return x.id === i.prod; })[0]; return p ? 'Abaixo do mínimo: ' + p.qtd + ' de ' + p.min + ' ' + p.un : 'Do estoque'; }
    if (i.origem === 'pedido') return 'Pedido por ' + (P(i.por) ? P(i.por).nome : 'equipe');
    return 'Adicionado à mão';
  }
  function waTexto(forn) {
    var itens = S.compras.itens.filter(function (i) { return i.fornecedor === forn; });
    return 'Olá! Pedido da ' + S.empresa.nome + ':\n' + itens.map(function (i) { return '- ' + String(i.qtd).replace('.', ',') + ' ' + i.un + ' de ' + i.nome; }).join('\n') + '\nPode confirmar o valor e o prazo de entrega? Obrigado!';
  }
  function listaHTML() {
    return '<article class="paper"><h3>Lista de compras</h3><p class="center">' + esc(S.empresa.nome) + ' · ' + dmyy(S.hoje) + '</p>' + fornecedores().map(function (f) {
      var it = S.compras.itens.filter(function (i) { return i.fornecedor === f; });
      return '<h4>' + esc(f) + '</h4><table class="t"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Estimativa (R$)</th><th>Ok</th></tr></thead><tbody>' + it.map(function (i) { return '<tr><td>' + esc(i.nome) + '</td><td class="num">' + esc(String(i.qtd).replace('.', ',')) + ' ' + esc(i.un) + '</td><td class="num">' + (i.custo ? brl(i.qtd * i.custo) : '·') + '</td><td>☐</td></tr>'; }).join('') + '</tbody></table>';
    }).join('') + '<p><strong>Total estimado: R$ ' + brl(totalCompras()) + '</strong></p></article>';
  }
  function vCompras() {
    var emp = S.role === 'empresa', verCusto = emp || (S.role === 'gerente' && pode('estoque')), itens = S.compras.itens, nSug = sugestaoCompra().length, marcados = itens.filter(function (i) { return i.comprado; }).length;
    var producao = S.produtos.filter(function (p) { return p.qtd < p.min && p.fornecedor === 'Produção própria'; }), semCusto = itens.filter(function (i) { return !i.custo; }).length;
    var grupos = fornecedores().map(function (f) {
      var it = itens.filter(function (i) { return i.fornecedor === f; });
      var rows = it.map(function (i) {
        return '<tr>' + (emp ? '<td><input type="checkbox" aria-label="Comprado: ' + esc(i.nome) + '" data-in="cmp-ok" data-id="' + esc(i.id) + '"' + (i.comprado ? ' checked' : '') + '></td>' : '') +
          '<td><strong>' + esc(i.nome) + '</strong><span class="sub">' + esc(origemTxt(i)) + '</span></td>' +
          '<td class="num">' + (emp ? '<input class="num qtd-in" type="number" min="0.5" max="9999" step="0.5" value="' + esc(i.qtd) + '" aria-label="Quantidade de ' + esc(i.nome) + '" data-in="cmp-qtd" data-id="' + esc(i.id) + '"> ' : esc(String(i.qtd).replace('.', ',')) + ' ') + esc(i.un) + '</td>' +
          (verCusto ? '<td class="num hide-sm">' + (i.custo ? brl(i.custo) : '·') + '</td><td class="num">' + (i.custo ? brl(i.qtd * i.custo) : 'a cotar') + '</td>' : '') +
          (emp ? '<td class="num"><button type="button" class="btn btn-sm" data-act="cmp-del" data-id="' + esc(i.id) + '" aria-label="Tirar ' + esc(i.nome) + ' da lista">Tirar</button></td>' : '') + '</tr>';
      }).join('');
      var wa = 'https://wa.me/?text=' + encodeURIComponent(waTexto(f));
      return '<div class="card"><div class="card-head"><h2>' + esc(f) + '</h2><span class="actions">' + (verCusto ? '<span class="ui-sub num">R$ ' + brl(totalCompras(it)) + '</span>' : '') + (emp ? '<a class="btn btn-sm" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">Enviar pedido no WhatsApp</a>' : '') + '</span></div>' +
        '<div class="table-box"><table class="t stack-sm"><thead><tr>' + (emp ? '<th><span class="sr-only">Comprado</span></th>' : '') + '<th>Item</th><th class="num">Quantidade</th>' + (verCusto ? '<th class="num hide-sm">Custo un. (R$)</th><th class="num">Subtotal (R$)</th>' : '') + (emp ? '<th><span class="sr-only">Ação</span></th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('');
    var opts = ['Distribuidora Criciúma', 'Embalagens Sul', 'Granja Rio Maina', 'Laticínios Serra Verde', 'Moinho Sul', 'Mercado (compra avulsa)'].map(function (f) { return '<option>' + esc(f) + '</option>'; }).join('');
    var form = '<div class="card card-pad"><h2 class="sec">' + (emp ? 'Adicionar item' : 'Pedir um item para a compra') + '</h2><form class="form-grid" data-form="cmp-novo"><div class="field"><label for="cn">Item</label><input id="cn" name="n" maxlength="60" required placeholder="Ex.: guardanapo"></div><div class="field"><label for="cf">Fornecedor</label><select id="cf" name="f">' + opts + '</select></div><div class="field"><label for="cq">Quantidade</label><input id="cq" name="q" type="number" min="0.5" max="9999" step="0.5" value="1" required></div><div class="field"><label for="cu">Unidade</label><input id="cu" name="u" maxlength="10" value="un" required></div>' +
      (emp ? '<div class="field"><label for="cc">Custo unitário (R$, opcional)</label><input id="cc" name="c" type="number" min="0" max="99999" step="0.01"></div>' : '') + '<div class="field"><span class="lbl-s">&nbsp;</span><button class="btn btn-primary" type="submit">' + (emp ? 'Adicionar' : 'Enviar pedido') + '</button></div></form></div>';
    var resumo = '<div class="card card-pad stack"><h2 class="sec">Como a lista funciona</h2><ul class="list"><li>1. O sistema sugere o que está abaixo do mínimo, já com a quantidade para voltar ao estoque ideal.</li><li>2. A equipe pede pelo app o que falta e não tem cadastro.</li><li>3. Você envia o pedido de cada fornecedor pelo WhatsApp ou imprime.</li><li>4. Quando a mercadoria chega, marque e clique em “Receber no estoque”: as quantidades sobem sozinhas.</li></ul>' +
      (verCusto ? '<div><div class="lbl-s">Total estimado</div><div class="clock num">R$ ' + brl(totalCompras()) + '</div>' + (semCusto ? '<p class="ui-sub">' + semCusto + ' item(ns) sem custo cadastrado, a cotar com o fornecedor.</p>' : '') + '</div>' : '') + '</div>';
    return titleRow('Lista de compras', itens.length + ' itens de ' + fornecedores().length + ' fornecedores', emp ? '<button type="button" class="btn" data-act="cmp-gerar"' + (nSug ? '' : ' disabled') + '>' + (nSug ? 'Sugerir ' + nSug + ' do estoque' : 'Estoque em dia') + '</button><button type="button" class="btn" data-act="cmp-print"' + (itens.length ? '' : ' disabled') + '>Imprimir ou PDF</button><button type="button" class="btn" data-act="cmp-receber"' + (marcados ? '' : ' disabled') + '>Receber ' + (marcados || '') + ' no estoque</button>' : '') +
      '<div class="grid-main"><div class="stack">' + (producao.length ? '<div class="notice info"><div><strong>Repor na produção, não comprar</strong>' + producao.map(function (p) { return esc(p.nome) + ' (' + p.qtd + ' de ' + p.min + ')'; }).join(', ') + (producao.length > 1 ? ' são produção própria e ficam' : ' é produção própria e fica') + ' fora da lista.</div></div>' : '') +
      (grupos || '<div class="notice info"><div>A lista está vazia. Use “Sugerir do estoque” ou adicione um item.</div></div>') + form + '</div>' + resumo + '</div>';
  }

  /* ---------- Busca ---------- */
  function vBusca() {
    var q = (S.ui.q || '').toLowerCase();
    var ps = S.pessoas.filter(function (p) { return p.nome.toLowerCase().indexOf(q) > -1 || p.funcao.toLowerCase().indexOf(q) > -1; });
    var pr = S.produtos.filter(function (p) { return p.nome.toLowerCase().indexOf(q) > -1 || p.cod.toLowerCase().indexOf(q) > -1; });
    return titleRow('Busca', 'Resultados para “' + esc(S.ui.q || '') + '”') + '<div class="grid-2"><div class="card"><div class="card-head"><h2>Pessoas</h2></div><ul class="list">' + (ps.map(function (p) { return '<li><span>' + esc(p.nome) + '<span class="sub">' + esc(p.funcao) + ' · ' + esc(p.setor) + '</span></span><span class="actions"><a class="btn btn-sm" href="#/ponto">Ponto</a><a class="btn btn-sm" href="#/holerites">Holerite</a></span></li>'; }).join('') || '<li>Ninguém encontrado.</li>') + '</ul></div>' +
      '<div class="card"><div class="card-head"><h2>Produtos</h2></div><ul class="list">' + (pr.map(function (p) { return '<li><span>' + esc(p.nome) + '<span class="sub num">' + esc(p.cod) + '</span></span><a class="btn btn-sm" href="#/estoque">Estoque</a></li>'; }).join('') || '<li>Nenhum produto.</li>') + '</ul></div></div>';
  }

  /* ---------- diálogo, impressão ---------- */
  var lastFocus;
  function modal(title, body, foot, cls) {
    closeModal(); lastFocus = doc.activeElement;
    var o = doc.createElement('div'); o.className = 'overlay';
    o.innerHTML = '<div class="modal' + (cls ? ' ' + cls : '') + '" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="card-head"><h2 id="m-t">' + esc(title) + '</h2><button type="button" class="btn btn-sm" data-act="fechar">Fechar</button></div><div class="modal-body">' + body + '</div>' + (foot ? '<div class="modal-foot">' + foot + '</div>' : '') + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(); else onClick(e); });
    o.addEventListener('submit', onSubmit); o.addEventListener('change', onInput); o.addEventListener('input', onVivo); o.addEventListener('change', onVivo);
    doc.body.appendChild(o);
    $$('form[data-jornada]', o).forEach(atualizaConf); $$('form.wiz', o).forEach(function (w) { wizIr(w, 1); });
    var f = $('input, select, textarea, .modal-foot .btn-primary', o) || $('.btn', o); if (f) f.focus();
  }
  function onVivo(e) {
    var t = e.target, f = t && t.closest && t.closest('form'); if (f && f.hasAttribute('data-jornada') && !t.closest('[data-conf]')) atualizaConf(f);
    var row = t && t.closest && t.closest('[data-et]'); if (row && (t.name === 'et_f' || t.name === 'et_l')) { var tg = $('.et-tags', row); if (tg) tg.innerHTML = etTags({ foto: ($('[name=et_f]', row) || {}).value === '1', limite: ($('[name=et_l]', row) || {}).value }); }
  }
  function closeModal() { pararCamera(); var o = $('.overlay'); if (o) { o.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); } }
  function imprimirNavegador(html) {
    var a = $('#print-area'); a.innerHTML = html; doc.body.classList.add('printing');
    var done = function () { doc.body.classList.remove('printing'); a.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); try { window.print(); } catch (e) { /* bloqueado na prévia */ } setTimeout(done, 1500);
  }
  // Prévia do documento: abre o arquivo em folha A4 na tela; "Baixar PDF" gera o PDF no navegador.
  function printHTML(html, nome) {
    nome = String(nome || 'Documento Seu Comando').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
    fecharDoc();
    var o = doc.createElement('div'); o.className = 'docview'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Prévia do documento');
    o.innerHTML = '<div class="docbar"><div><strong>Prévia do documento</strong><span class="ui-sub">' + esc(nome) + '.pdf' + (S.real ? '' : ' · exemplo: sai com marca d\'água') + '</span></div><div class="actions"><button type="button" class="btn btn-primary" data-docact="pdf">Baixar PDF</button><button type="button" class="btn" data-docact="imprimir">Imprimir</button><button type="button" class="btn" data-docact="fechar">Fechar</button></div></div><div class="docscroll"><div class="sheet-a4" id="doc-sheet">' + html + '</div></div>';
    $$('[contenteditable]', o).forEach(function (n) { n.removeAttribute('contenteditable'); });
    doc.body.appendChild(o); doc.body.classList.add('doc-aberto');
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-docact]'); if (!b) return;
      if (b.dataset.docact === 'fechar') fecharDoc();
      if (b.dataset.docact === 'imprimir') { imprimirNavegador(html); toast('Se a janela de impressão não abrir aqui, use "Baixar PDF".'); }
      if (b.dataset.docact === 'pdf') baixarPDF($('#doc-sheet'), nome, b);
    });
    var f = $('[data-docact="pdf"]', o); if (f) f.focus();
  }
  function fecharDoc() { var o = $('.docview'); if (o) o.remove(); doc.body.classList.remove('doc-aberto'); }
  function gerarPDF(el) {
    if (!window.html2pdf) return carregarPdf().then(function () { return gerarPDF(el); });
    var marca = !S.real;
    // Gera a partir de uma cópia sem a moldura da tela (sombra, altura mínima e recuo), para não sobrar página em branco.
    var src = el.cloneNode(true); src.removeAttribute('id'); src.classList.add('pdf-gen');
    return window.html2pdf().set({
      margin: [16, 17, 18, 17], image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: 2, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff', ignoreElements: function (n) { return n.classList && (n.classList.contains('wm') || n.classList.contains('sugestao')); } },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['p', 'li', 'tr', 'h4', '.label', '.sig'] }
    }).from(src).toPdf().get('pdf').then(function (pdf) {
      var n = pdf.internal.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(110, 120, 115);
        pdf.text('Seu Comando · ' + S.empresa.nome + ' · página ' + i + ' de ' + n, 105, 290, { align: 'center' });
        if (marca) {
          pdf.saveGraphicsState(); if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 0.13 }));
          pdf.setFontSize(30); pdf.setTextColor(15, 61, 46);
          [90, 160, 230].forEach(function (y) { pdf.text('SEU COMANDO · EXEMPLO', 105, y, { align: 'center', angle: 32 }); });
          pdf.restoreGraphicsState();
        }
      }
      return pdf.output('blob');
    });
  }
  // O gerador de PDF (cerca de 900 KB) só é baixado quando alguém pede um PDF.
  var PDF_CARGA = null;
  function carregarPdf() {
    if (window.html2pdf) return Promise.resolve();
    if (!PDF_CARGA) PDF_CARGA = new Promise(function (ok, falha) { var sc = doc.createElement('script'); sc.src = 'assets/js/vendor/html2pdf.bundle.min.js'; sc.onload = function () { if (window.html2pdf) ok(); else falha(new Error('sem gerador')); }; sc.onerror = function () { PDF_CARGA = null; falha(new Error('sem gerador')); }; doc.head.appendChild(sc); });
    return PDF_CARGA;
  }
  function baixarPDF(el, nome, btn) {
    btn.disabled = true; btn.textContent = 'Gerando PDF…';
    var fim = function () { btn.disabled = false; btn.textContent = 'Baixar PDF'; };
    gerarPDF(el).then(function (blob) { return salvarArquivo(nome + '.pdf', blob); }).then(fim, function () { toast('Não foi possível gerar o PDF. Use "Imprimir" e escolha "Salvar como PDF".'); fim(); });
  }
  function salvarArquivo(nomeArq, blob) {
    var usar = window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null);
    return Promise.resolve(usar).then(function (dl) {
      if (dl) return dl.save({ filename: nomeArq, data: blob }).then(function () { toast('Arquivo salvo: ' + nomeArq); }, function (e) { toast(e && e.code === 'declined' ? 'Download cancelado.' : 'O download não está disponível aqui.'); });
      if (window.claude && window.top !== window.self) { toast('O download não está disponível nesta visualização. Use "Imprimir" e escolha "Salvar como PDF".'); return; }
      var a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeArq; doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Arquivo baixado: ' + nomeArq);
    }, function () { toast('O download não está disponível aqui.'); });
  }


  /* ---------- ações ---------- */
  var A = {
    fechar: closeModal,
    vaga: function (b) { S.ui.vaga = b.dataset.id; save(); render(); },
    'crit-reg': function (b) { vagaAtual().crit.regime = b.dataset.v; save(); render(); },
    'crit-tur': function (b) { var k = vagaAtual().crit, i = k.turnos.indexOf(b.dataset.v); if (i > -1) k.turnos.splice(i, 1); else k.turnos.push(b.dataset.v); save(); render(); },
    'copiar-link': function () { var url = location.origin + location.pathname.replace(/app\.html$/, '') + 'triagem.html?vaga=' + vagaAtual().id + (NUVEM ? '&e=' + encodeURIComponent(S.empresa.codigo || '') : '&t=' + encodeURIComponent(S.tipo || '')); if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link da pré-entrevista copiado. É ele que vai no anúncio da vaga ou no WhatsApp.'); }, function () { toast(url); }); else toast(url); },
    'cand-ver': function (b) {
      var g = vagaAtual(), c = g.cands[+b.dataset.i], R = window.CENTRALIZAR_ROTULOS || {}, cg = cargoPor(g.cargo), m = avalia(c, g.crit);
      var lin = function (l, v) { return v ? '<li><span class="sub">' + esc(l) + '</span><span>' + esc(v) + '</span></li>' : ''; };
      var reqs = (window.CENTRALIZAR_REQS_DO_CARGO ? window.CENTRALIZAR_REQS_DO_CARGO(cg) : []).map(function (r) { var v = (c.reqs || {})[r.k]; return '<li><span>' + esc(r.q) + '</span>' + (v ? pill(v === 'sim' ? 'ok' : (r.elim ? 'bad' : 'warn'), v === 'sim' ? 'Sim' : 'Não') : pill('mute', 'Sem resposta')) + '</li>'; }).join('');
      modal('Respostas da pré-entrevista · ' + c.n,
        (m ? '<div class="notice bad"><div><strong>Descartado na triagem</strong>' + esc(m) + '</div></div>' : '<div class="notice info"><div><strong>Passou na triagem</strong>Atende aos critérios da vaga.</div></div>') +
        (c.jaTrabalhou === 'mesma' ? '<div class="notice bad"><div><strong>Já trabalhou aqui nesta função</strong>Se for contratado, não cabe contrato de experiência (TST): use prazo indeterminado.</div></div>' : '') +
        '<ul class="list cand-resp">' + lin('WhatsApp', c.fone) + lin('E-mail', c.email) + lin('Bairro', c.bairro) + lin('Contratação', REG[c.regime]) + lin('Turnos', (c.turnos || []).map(function (t) { return TUR[t]; }).join(', ')) + lin('Feriados e domingos', (R.fds || {})[c.fds]) + lin('Pode começar', (R.inicio || {})[c.inicio]) + lin('Distância', c.km ? c.km + ' km' : '') + lin('Transporte', (R.transporte || {})[c.transporte]) + lin('Pretensão salarial', (R.pretensao || {})[c.pretensao]) + lin('Experiência na função', c.exp + (c.exp === 1 ? ' ano' : ' anos')) + lin('Última experiência', c.ultima) + lin('Já trabalhou aqui', (R.jaTrabalhou || {})[c.jaTrabalhou]) + lin('Escolaridade', (R.escolaridade || {})[c.escolaridade]) + lin('Autorizou WhatsApp', c.contato ? 'Sim' : 'Não') + '</ul>' +
        (reqs ? '<h3 class="sec">Requisitos desta função</h3><ul class="list">' + reqs + '</ul>' : '') +
        (c.sit1 ? '<h3 class="sec">Situação do dia a dia</h3><p class="ui-sub">' + esc((window.CENTRALIZAR_SITUACOES || {})[cg.setor] || '') + '</p><p>' + esc(c.sit1) + '</p>' : '') +
        (c.sit2 ? '<h3 class="sec">Por que quer trabalhar aqui</h3><p>' + esc(c.sit2) + '</p>' : '') +
        (!c.sit1 && !c.fds ? '<p class="ui-sub">Candidato do exemplo, cadastrado antes das perguntas completas.</p>' : ''));
    },
    'ent-modal': function (b) {
      var g = vagaAtual(), i = +b.dataset.i, c = g.cands[i];
      modal('Chamar para entrevista · ' + c.n, '<form class="stack" data-form="ent" data-i="' + i + '"><div class="form-grid"><div class="field"><label for="ed">Dia</label><input id="ed" name="d" type="date" value="' + addDays(S.hoje, 1) + '" required></div><div class="field"><label for="eh">Horário</label><input id="eh" name="h" type="time" value="10:00" required></div></div><div class="field"><label for="el">Local</label><input id="el" name="l" maxlength="120" value="' + esc(S.empresa.endereco + ', ' + S.empresa.cidade) + '" required></div>' +
        '<div class="wa-msg">Olá, ' + esc(first(c.n)) + '! Você passou na triagem para a vaga de ' + esc(g.titulo) + ' na ' + esc(S.empresa.nome) + '. Queremos te conhecer: sua entrevista fica marcada no dia e horário acima. Pode confirmar?</div>' +
        (c.contato ? '<p class="ui-sub">O convite vai pelo WhatsApp, com modelo de mensagem aprovado pela Meta.</p>' : '<div class="notice"><div>' + esc(c.n) + ' não autorizou contato por WhatsApp. Marque a entrevista e avise por telefone.</div></div>') +
        '<button class="btn btn-primary" type="submit">Marcar entrevista</button></form>');
    },
    'ent-ok': function (b) { var g = vagaAtual(), c = g.cands[+b.dataset.i]; c.etapa = 'aprovado'; save(); render(); toast(first(c.n) + ' aprovado(a) na entrevista. Agora envie o link de documentos.'); },
    'ent-nao': function (b) { var g = vagaAtual(), c = g.cands[+b.dataset.i]; c.etapa = 'reprovado'; save(); render(); toast('Registrado: ' + first(c.n) + ' não foi aprovado(a). Nenhum documento será pedido.'); },
    'docs-modal': function (b) {
      var g = vagaAtual(), i = +b.dataset.i, c = g.cands[i];
      modal('Enviar link de documentos · ' + c.n, '<div class="wa-msg">Parabéns, ' + esc(first(c.n)) + '! Você foi aprovado(a) na entrevista para a vaga de ' + esc(g.titulo) + ' na ' + esc(S.empresa.nome) + '. Envie seus documentos por este link para começarmos a admissão. Qualquer dúvida, é só responder aqui.</div><p class="ui-sub">Ao enviar, a admissão é aberta em Admissões. Depois que os documentos chegarem, o contador confere e você dá o ok final.</p>',
        '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="docs-enviar" data-i="' + i + '">Enviar pelo WhatsApp</button>');
    },
    'docs-enviar': function (b) {
      var g = vagaAtual(), c = g.cands[+b.dataset.i];
      c.etapa = 'docs';
      if (!S.admissoes.some(function (a) { return a.nome === c.n; })) {
        var aut = g.modelo === 'autonomo', docs = aut ? ['RG ou CNH', 'CPF', 'Cartão CNPJ do MEI', 'Chave PIX'] : ['RG ou CNH', 'CPF', 'Endereço', 'Carteira de Trabalho Digital', 'Conta para pagamento', 'Exame admissional (ASO)'];
        var cgv = cargoPor(g.cargo); if (cgv && (cgv.flags.indexOf('PEV') > -1 || cgv.flags.indexOf('MOT') > -1 || ['cuidador-de-idosos', 'baba'].indexOf(cgv.id) > -1)) docs.push('Certidão de antecedentes criminais (permitida para esta função: Tema 1 do TST)');
        S.admissoes.push({ id: 'd' + Date.now(), nome: c.n, funcao: g.titulo + (aut ? ' (freelancer)' : ''), modelo: g.modelo, cargo: g.cargo, inicio: addDays(S.hoje, 7), salario: g.salario, cpf: '[a preencher]', docs: docs.map(function (d) { return { n: d, v: '', por: '', st: 'pendente' }; }), hist: [agora() + ' · ' + first(c.n) + ' aprovado(a) na entrevista; empresa enviou o link de documentos pelo WhatsApp'] });
      }
      save(); closeModal(); render(); toast('Link de documentos na fila do WhatsApp e admissão aberta. Neste protótipo nada é enviado de verdade.');
    },
    adm: function (b) { S.ui.adm = b.dataset.id; save(); render(); },
    'pedir-docs': function () { var a = admAtual(); a.hist.push(agora() + ' · ' + (S.role === 'contador' ? 'Contador' : 'Empresa') + ' pediu pelo WhatsApp: ' + a.docs.filter(function (d) { return d.st !== 'ok'; }).map(function (d) { return d.n; }).join(', ')); save(); render(); toast('Pedido enviado a ' + first(a.nome) + ' (simulação).'); },
    conferir: function () { var a = admAtual(); a.conferida = true; a.hist.push(agora() + ' · Contador conferiu os documentos e liberou para o ok do empregador'); save(); render(); toast('Documentos conferidos. O empregador foi avisado para dar o ok.'); },
    'aprovar-adm': function () { var a = admAtual(); if (!a.conferida) return; a.aprovada = true; a.hist.push(agora() + ' · Empregador deu o ok; contador avisado para enviar a admissão ao eSocial'); save(); render(); toast('Ok dado. A admissão está aprovada e o contador foi avisado.'); },
    'gerar-contrato': function (b, e) { e.preventDefault(); var a = admAtual(), ct = ctEstado(); ct.alvo = a.id; ct.modelo = a.modelo === 'autonomo' ? 'autonomo' : 'experiencia'; if (a.cargo) ct.cargo = a.cargo; ct.salario = a.salario; ct.inicio = a.inicio; ct.peric = temPeric(cargoPor(ct.cargo)); ct.checks = {}; save(); location.hash = '#/contratos'; },
    'ct-pdf': function () { var pp = $('#paper'), x = contratoAtualHTML(); if (!pp) return; printHTML(pp.outerHTML, 'Contrato ' + (x.ct.modelo === 'experiencia' ? 'de experiencia ' : '') + x.cargo.cargo + ' ' + (x.pessoa.tipo === 'novo' ? 'modelo' : x.pessoa.nome)); },
    metodo: function (b) { S.ui.metodo = b.dataset.v; save(); render(); },
    marcar: function () { var q = quemMarca(); if (!q) return; var i = proxTipo(q.p.id); if (i < 0) return; capturarPonto(q.p, i, q.met); },
    'marcar-alt': function (b) { var q = quemMarca(); if (!q) return; var t = +b.dataset.t; if (t !== proxInfo(q.p.id).alt) return; capturarPonto(q.p, t, q.met); },
    'iv-add': function (b) { var f = b.closest('form'), box = f && $('[data-ivs]', f); if (!box) return; if ($$('[data-iv]', box).length >= 4) { toast('No máximo 4 intervalos por jornada.'); return; } box.insertAdjacentHTML('beforeend', ivLinha({ flex: b.dataset.v === 'flex', dur: 60 })); atualizaConf(f); var nv = box.lastElementChild.querySelector('input:not([type=hidden]), select'); if (nv) nv.focus(); },
    'iv-del': function (b) { var f = b.closest('form'), row = b.closest('[data-iv]'); if (row) row.remove(); if (f) atualizaConf(f); },
    'wiz-prox': function (b) { var f = b.closest('form'), n = +f.dataset.p || 1; if (wizValida(f, n)) wizIr(f, n + 1); },
    'wiz-volta': function (b) { var f = b.closest('form'); wizIr(f, (+f.dataset.p || 1) - 1); },
    'turno-preset': function (b) {
      var pr = PRESETS_T[+b.dataset.i], f = b.closest('form'); if (!pr || !f) return; var j = pr[2], nm = $('[name=n]', f);
      if (nm && !nm.value) nm.value = pr[0]; $('[name=je]', f).value = j.e; $('[name=js]', f).value = j.s;
      $$('[name=jd]', f).forEach(function (c) { c.checked = j.dias.indexOf(+c.value) > -1; }); $('[name=j1236]', f).checked = !!j.x1236;
      $('[data-ivs]', f).innerHTML = j.intervalos.map(ivLinha).join(''); wizIr(f, 4); toast('Modelo "' + pr[0] + '" aplicado. Confira e ajuste se precisar.');
    },
    'ponto-ciente': function (b) {
      var pid = b.dataset.id, dia = b.dataset.dia, p = P(pid); if (!p || S.role !== 'empresa') return;
      var al = inconsDia(pid, dia, marcasDia(pid, dia)); S.pontoCiente = S.pontoCiente || {}; S.pontoCiente[pid + '|' + dia] = { em: agora(), por: quemSou(), alertas: al };
      auditar('Inconsistência de ponto mantida', p.nome + ' · ' + dmyy(dia) + ': ' + al.join('; ')); save(); A['ponto-espelho']({ dataset: { id: pid } }); toast('Registrado: a empresa está ciente e mantém o dia como está.');
    },
    'rosto-del': function (b) { var p = P(b.dataset.id); if (!p) return; modal('Apagar o rosto de ' + first(p.nome) + '?', '<p>O cadastro do rosto de ' + esc(p.nome) + ' será apagado. Na próxima marcação, o app cadastra o rosto de novo.</p><p class="ui-sub">As marcações já feitas continuam guardadas, com a foto.</p>', '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="rosto-del-ok" data-id="' + esc(p.id) + '">Apagar e recadastrar</button>'); },
    'rosto-del-ok': function (b) { var pid = b.dataset.id, p = P(pid); (NUVEM ? Nuvem.apagarRosto(pid) : Promise.resolve()).then(function () { if (S.rostos) delete S.rostos[pid]; auditar('Cadastro de rosto apagado', (p || {}).nome || pid); save(); closeModal(); render(); toast('Rosto apagado. O cadastro é refeito na próxima marcação.'); }, function (e) { toast(erroTxt(e)); }); },
    'guia-ir': function (b) { var a = b.dataset.a, h = b.dataset.href; closeModal(); if (a && A[a]) { if (h && location.hash !== h) location.hash = h; setTimeout(function () { A[a]({ dataset: {} }); }, 60); } else if (h) { if (location.hash !== h) location.hash = h; else render(); } },
    'bp-eq-del': function (b) { var e = S.bp && S.bp.equip.filter(function (x) { return x.id === b.dataset.id; })[0]; if (!e) return; S.bp.equip = S.bp.equip.filter(function (x) { return x !== e; }); auditar('Equipamento removido', e.nome); save(); render(); toast('Equipamento removido. Os registros antigos continuam na planilha.'); },
    'bp-eq-mod': function (b) { if (!S.bp) return; var n = b.dataset.n, k = 2, nome = n; while (S.bp.equip.some(function (x) { return x.nome === nome; })) nome = n + ' ' + k++; S.bp.equip.push({ id: 'q' + Date.now().toString(36), nome: nome, tipo: b.dataset.t }); S.ui.bpAba = 'equip'; auditar('Equipamento cadastrado', nome); save(); render(); toast(nome + ' cadastrado. Dá para mudar o nome removendo e cadastrando de novo.'); },
    'empresa-editar': function () { abrirEmpresa(); },
    'passos-esconder': function () { S.ui.semPassos = true; save(); render(); },
    'passos-mostrar': function () { S.ui.semPassos = false; save(); render(); },
    aba: function (b) { if (['pontoAba', 'empAba', 'bpAba'].indexOf(b.dataset.k) < 0) return; S.ui[b.dataset.k] = b.dataset.v; save(); render(); var t = $('.submenu [aria-selected="true"]'); if (t) t.focus(); },
    ajuda: function (b) { var a = AJUDA[b.dataset.k]; if (a) modal(a[0], a[1], '<button type="button" class="btn btn-primary" data-act="fechar">Entendi</button>'); },
    'reset-exemplo': function () { var r0 = $('#reset'); if (r0) r0.click(); },
    modulos: function () {
      var m = S.empresa.modulos || {};
      modal('Módulos do app', '<form class="stack" data-form="modulos"><p class="ui-sub">Desligue as áreas que a empresa não usa. Elas somem para todo mundo; os dados ficam guardados e voltam quando a área for ligada de novo.</p>' +
        MODULOS.filter(function (c) { return c !== 'alimentos' || S.bp; }).map(function (c) { var fixo = c === 'equipe'; return '<label class="check mod-op"><input type="checkbox" name="m" value="' + c + '"' + (fixo || m[c] !== false ? ' checked' : '') + (fixo ? ' disabled' : '') + '><span><strong>' + esc(CATMETA[c][1]) + '</strong><span class="sub">' + esc(fixo ? 'Sempre ligada: o cadastro da equipe é a base do app' : CATMETA[c][2]) + '</span></span></label>'; }).join('') +
        '<button class="btn btn-primary btn-lg" type="submit">Salvar módulos</button></form>');
    },
    'ct-wiz': function () {
      if (!S.pessoas.length) { toast('Cadastre a equipe primeiro, em Equipe, Cadastro da equipe.'); return; }
      var ms = S.modelosCt || []; if (!ms.length) { S.ui.ctTab = 'modelos'; save(); render(); toast('Primeiro, crie um modelo de contrato.'); return; }
      var tipoM = { gerado: 'Feito no gerador', texto: 'Texto próprio, preenchido com os dados da pessoa', arquivo: 'Arquivo pronto' };
      modal('Fazer contrato', '<form class="stack wiz" novalidate data-form="ct-aplicar" data-ctwiz>' + wizBarra(['Para quem', 'Qual modelo', 'Conferir']) +
        wizPasso(1, 'Para quem é o contrato?', '<div class="sel-grid" data-precisa="Marque pelo menos uma pessoa.">' + S.pessoas.map(function (p) { var n = contratosDe(p.id).length; return '<label class="sel-card"><input type="checkbox" name="p" value="' + esc(p.id) + '"><span><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc((p.funcao || 'sem função') + (n ? ' · ' + n + (n === 1 ? ' contrato' : ' contratos') : ' · sem contrato')) + '</span></span></label>'; }).join('') + '</div>') +
        wizPasso(2, 'Qual modelo usar?', '<div class="sel-grid" data-precisa="Escolha o modelo do contrato.">' + ms.map(function (m) { return '<label class="sel-card"><input type="radio" name="m" value="' + esc(m.id) + '"' + (ms.length === 1 ? ' checked' : '') + '><span><strong>' + esc(m.nome) + '</strong><span class="sub">' + esc(tipoM[m.tipo] || '') + '</span></span></label>'; }).join('') + '</div><p class="ui-sub">Precisa de outro? <button type="button" class="link-btn" data-act="ct-ir" data-v="gerar">Montar pelo gerador por função</button> ou <button type="button" class="link-btn" data-act="ct-ir" data-v="modelos">cadastrar o contrato que você já usa</button>.</p>') +
        wizPasso(3, 'Conferir e gerar', '<div data-ctresumo></div>') + wizNav('Gerar contratos') + '</form>', '', 'modal-largo');
    },
    'ct-ir': function (b) { closeModal(); S.ui.ctTab = b.dataset.v; save(); if (location.hash !== '#/contratos') location.hash = '#/contratos'; else render(); },
    'ck-editar': function (b) { var c = b.dataset.id ? ckPorId(b.dataset.id) : null, h = c && b.dataset.escopo === 'hoje'; modal(c ? (h ? 'Ajustar só hoje · ' : 'Editar checklist · ') + c.nome : 'Novo checklist', ckForm(c, h ? 'hoje' : 'sempre'), '', 'modal-largo'); },
    'ck-editar-escolha': function (b) {
      var c = ckPorId(b.dataset.id); if (!c) return;
      modal('Editar "' + c.nome + '"', '<p class="ui-sub">A mudança vale para quando?</p><div class="acao-cards acao-2"><button type="button" class="acao-card" data-act="ck-editar" data-escopo="hoje" data-id="' + esc(c.id) + '"><span class="acao-t">Só hoje</span><span class="acao-d">Muda horário e etapas apenas em ' + esc(dmy(ckDia())) + '. Amanhã volta ao normal.</span></button>' +
        '<button type="button" class="acao-card" data-act="ck-editar" data-escopo="sempre" data-id="' + esc(c.id) + '"><span class="acao-t">Sempre</span><span class="acao-d">Muda o checklist daqui para frente: nome, setor, dias, horário e etapas.</span></button></div><p><button type="button" class="link-btn" data-act="ck-duplicar" data-id="' + esc(c.id) + '">Fazer uma cópia deste checklist</button></p>');
    },
    'ck-hist': function (b) {
      var id = b.dataset.id || S.ui.ckHist, c = ckPorId(id); if (!c) return; S.ui.ckHist = id; var todos = S.ui.ckCal === 'todos';
      modal('Histórico · ' + (todos ? 'todos os checklists' : c.nome), '<div class="seg" role="group" aria-label="Mostrar"><button type="button" data-act="ck-cal" data-v="um" aria-pressed="' + !todos + '">Este checklist</button><button type="button" data-act="ck-cal" data-v="todos" aria-pressed="' + todos + '">Todos</button></div>' + ckCalendario(todos ? ckVisiveis() : [c], todos ? '' : c.id), '', 'modal-largo');
    },
    'ck-hoje-desfazer': function (b) { var c = ckPorId(b.dataset.id), dia = ckDia(); if (!c || !c.ajustes || !c.ajustes[dia]) return; delete c.ajustes[dia]; auditar('Ajuste de hoje desfeito', c.nome); save(); render(); toast('Hoje volta ao checklist normal.'); },
    'et-cfg': function (b) { var row = b.closest('[data-et]'), m = row && $('.et-mais', row); if (!m) return; m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); b.textContent = m.hidden ? 'Configurar' : 'Fechar'; row.classList.toggle('aberta', !m.hidden); if (!m.hidden) { var x = $('select', m); if (x) x.focus(); } },
    'ck-modelo': function (b) {
      var m = CK_MODELOS[+b.dataset.i], f = b.closest('form'); if (!m || !f) return;
      $('[name=n]', f).value = m[0]; $('[name=ini]', f).value = m[1]; $('[name=lim]', f).value = m[2];
      $('[data-ets]', f).innerHTML = m[3].map(function (x) { var p = x.split('|'); return etLinha({ t: p[0], foto: p[1] === '1' }); }).join(''); wizIr(f, 2); toast('Modelo "' + m[0] + '" aplicado. Edite as etapas como quiser.');
    },
    'et-add': function (b) { var f = b.closest('form'), box = f && $('[data-ets]', f); if (!box) return; if ($$('[data-et]', box).length >= 40) { toast('No máximo 40 etapas.'); return; } box.insertAdjacentHTML('beforeend', etLinha()); var nv = box.lastElementChild.querySelector('[name=et_t]'); if (nv) nv.focus(); },
    'et-del': function (b) { var row = b.closest('[data-et]'), box = row && row.parentNode; if (!row) return; row.remove(); if (box && !$('[data-et]', box)) box.insertAdjacentHTML('beforeend', etLinha()); },
    'et-mover': function (b) { var row = b.closest('[data-et]'); if (!row) return; var alvo = +b.dataset.d < 0 ? row.previousElementSibling : row.nextElementSibling; if (!alvo) return; if (+b.dataset.d < 0) row.parentNode.insertBefore(row, alvo); else row.parentNode.insertBefore(alvo, row); b.focus(); },
    'ck-marcar': function (b) { var c0 = ckPorId(b.dataset.id), c = c0 && ckEfetivo(c0, ckDia()), e = c && (c.etapas || []).filter(function (x) { return x.id === b.dataset.e; })[0]; if (e) marcarEtapa(c, e); },
    'ck-mes': function (b) { S.ui.ckMes = b.dataset.v; save(); A['ck-hist']({ dataset: {} }); },
    'ck-cal': function (b) { S.ui.ckCal = b.dataset.v; save(); A['ck-hist']({ dataset: {} }); },
    'ck-dia': function (b) { var dia = b.dataset.dia, c = b.dataset.id ? ckPorId(b.dataset.id) : null, lista = c ? [c] : ckVisiveis(); modal('Checklist · ' + dmyy(dia) + ' (' + DIAS[diaSemana(dia)] + ')', ckDiaHTML(lista, dia), S.ui.ckHist ? '<button type="button" class="btn" data-act="ck-hist">Voltar ao calendário</button>' : '', 'modal-largo'); },
    'ck-desfazer': function (b) { var r = (S.ckRegs || []).filter(function (x) { return String(x.id) === String(b.dataset.id); })[0]; if (!r) return; modal('Desfazer esta marcação?', '<p>A etapa volta a ficar pendente hoje. A ação fica no registro de alterações.</p>', '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="ck-desfazer-ok" data-id="' + esc(r.id) + '">Desfazer</button>'); },
    'ck-desfazer-ok': function (b) {
      var r = (S.ckRegs || []).filter(function (x) { return String(x.id) === String(b.dataset.id); })[0]; if (!r || S.role !== 'empresa') return; var c = ckPorId(r.checklist_id) || {}, e = (c.etapas || []).filter(function (x) { return x.id === r.etapa_id; })[0] || {};
      (NUVEM ? Nuvem.desfazerEtapa(r.id) : Promise.resolve()).then(function () { S.ckRegs = S.ckRegs.filter(function (x) { return x !== r; }); auditar('Etapa de checklist desfeita', (c.nome || '') + ': ' + (e.t || '') + ' (' + ckHora(r) + ', ' + (r.por_nome || '') + ')'); save(); closeModal(); render(); toast('Marcação desfeita.'); }, function (er) { toast(erroTxt(er)); });
    },
    'ck-duplicar': function (b) { var c = ckPorId(b.dataset.id); if (!c) return; var n = clone(c), t = Date.now().toString(36); n.id = 'ck' + t; n.nome = (c.nome + ' (cópia)').slice(0, 60); n.criado = ckDia(); delete n.ajustes; delete n.alterado; n.etapas = n.etapas.map(function (e, i) { e.id = 'e' + t + i; return e; }); S.checklists.push(n); S.ui.ck = n.id; auditar('Checklist criado', n.nome + ' (cópia de ' + c.nome + ')'); save(); render(); A['ck-editar']({ dataset: { id: n.id } }); },
    'ck-del': function (b) { var c = ckPorId(b.dataset.id); if (!c) return; modal('Remover "' + c.nome + '"?', '<p>O checklist sai da tela da equipe. O que já foi marcado continua guardado.</p>', '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="ck-del-ok" data-id="' + esc(c.id) + '">Remover</button>'); },
    'ck-del-ok': function (b) { var c = ckPorId(b.dataset.id); if (!c) return; S.checklists = S.checklists.filter(function (x) { return x !== c; }); S.ui.ck = null; auditar('Checklist removido', c.nome); save(); closeModal(); render(); toast('Checklist removido.'); },
    'export-afd': function () {
      var linhas = ['Seu Comando · marcações de exemplo', 'Empresa: ' + S.empresa.razao + ' ' + S.empresa.cnpj];
      S.pessoas.forEach(function (p) { (S.ponto[p.id] || []).forEach(function (h) { if (h) linhas.push(['000000000', '05112026', h.replace(':', ''), p.cpf].join(';')); }); });
      var blob = new Blob([linhas.join('\r\n')], { type: 'text/plain;charset=utf-8' }), a = doc.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'marcacoes-exemplo.txt'; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    oc: function (b) { S.ui.oc = b.dataset.v; save(); render(); },
    orig: function (b) { var a = S.atestados.filter(function (x) { return x.id === b.dataset.id; })[0]; a.original = 'entregue'; a.entregueEm = S.hoje; save(); render(); toast('Original registrado. A falta passa a ser abonada.'); },
    ciencia: function (b) { var w = S.advertencias.filter(function (x) { return x.id === b.dataset.id; })[0]; w.ciencia = 'app'; w.cienciaEm = (S.real ? hojeISO() : '2026-11-05') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); save(); render(); toast('Ciência registrada.'); },
    recusa: function (b) { modal('Registrar recusa de ciência', '<p>Quando o funcionário se recusa a assinar, duas testemunhas confirmam que a advertência foi lida para ele.</p><form class="stack" data-form="recusa" data-id="' + esc(b.dataset.id) + '"><div class="field"><label for="t1">Testemunhas</label><input id="t1" name="t" maxlength="120" required placeholder="Nome das duas testemunhas"></div><button class="btn btn-primary" type="submit">Registrar</button></form>'); },
    'nova-adv': function () {
      modal('Nova advertência', '<form class="stack" data-form="adv"><div class="field"><label for="ap">Funcionário</label><select id="ap" name="p">' + S.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select></div><div class="field"><label for="am">Motivo, com data e fato</label><textarea id="am" name="m" maxlength="400" required placeholder="Ex.: atraso de 30 minutos em 05/11, sem justificativa."></textarea></div><p class="ui-sub">Descreva só o fato. O funcionário recebe no app para dar ciência.</p><button class="btn btn-primary" type="submit">Enviar para ciência</button></form>');
    },
    slip: function (b) { var h = holerite(b.dataset.id); modal('Holerite · ' + h.p.nome, slipHTML(h, 'outubro de 2026'), '<button type="button" class="btn btn-primary" data-act="print-slip" data-id="' + esc(b.dataset.id) + '">Imprimir ou salvar PDF</button>'); },
    'print-slip': function (b) { var h = holerite(b.dataset.id); printHTML(slipHTML(h, 'outubro de 2026'), 'Holerite outubro 2026 ' + h.p.nome); },
    lancar: function (b) { var p = P(b.dataset.id); modal('Lançamento · ' + p.nome, '<form class="stack" data-form="lancar" data-id="' + p.id + '"><div class="field"><label for="hx">Horas extras a 50% em outubro</label><input id="hx" name="h" type="number" min="0" max="60" step="0.5" value="' + (S.horasExtras[p.id] || 0) + '"></div><p class="ui-sub">Se o holerite já estiver liberado, ele volta para aprovação da empresa.</p><button class="btn btn-primary" type="submit">Salvar lançamento</button></form>'); },
    'aprovar-sel': function () { var n = 0; $$('[data-in="sel-hol"]:checked:not(:disabled)').forEach(function (c) { S.holerites.aprovados.push(c.dataset.id); n++; }); if (!n) { toast('Marque pelo menos um holerite.'); return; } save(); render(); toast(n + ' holerite(s) liberado(s) para os funcionários.'); },
    'aprovar-todos': function () { S.holerites.aprovados = S.pessoas.map(function (p) { return p.id; }); save(); render(); toast('Holerites de outubro liberados para todos.'); },
    ck: function (b) { S.ui.ck = b.dataset.id; save(); render(); },
    qtd: function (b) { var p = S.produtos.filter(function (x) { return x.id === b.dataset.id; })[0]; p.qtd = Math.max(0, p.qtd + +b.dataset.d); save(); render(); },
    'print-etq': function () { var n = Math.max(1, Math.min(40, +(S.ui.copias || 2))); printHTML('<div class="labels">' + S.produtos.filter(function (p) { return (S.ui.etq || {})[p.id]; }).map(function (p) { return labelHTML(p, n); }).join('') + '</div>', 'Etiquetas ' + S.empresa.nome); },
    'cmp-ir': function () { var n = gerarCompras(); save(); location.hash = '#/compras'; if (n) toast(n + ' item(ns) abaixo do mínimo foram para a lista de compras.'); },
    'cmp-gerar': function () { var n = gerarCompras(); save(); render(); toast(n + ' item(ns) sugerido(s) a partir do estoque mínimo.'); },
    'cmp-del': function (b) { S.compras.itens = S.compras.itens.filter(function (i) { return i.id !== b.dataset.id; }); save(); render(); },
    'bp-ativo': function () { S.bp.ativo = true; save(); render(); toast('Teste do adicional ativado por 14 dias.'); },
    'bp-feito': function (b) { var d = S.bp.docs.filter(function (x) { return x.id === b.dataset.id; })[0]; if (!d) return; d.ult = S.hoje; save(); render(); toast(d.nome + ': registrado hoje. Próximo prazo atualizado.'); },
    'bp-planilha': function () { printHTML(planilhaHTML(), 'Planilha de temperaturas ' + S.empresa.nome); },
    'curso-abrir': function (b) { S.ui.curso = b.dataset.c; S.ui.aula = 0; S.ui.cursoRes = null; save(); render(); window.scrollTo(0, 0); },
    'curso-aula': function (b) { S.ui.aula = Math.max(0, +b.dataset.v || 0); S.ui.cursoRes = null; save(); render(); window.scrollTo(0, 0); },
    'curso-sair': function () { S.ui.curso = null; S.ui.cursoRes = null; save(); render(); },
    cert: function (b) { var h = certHTML(b.dataset.p, b.dataset.c); if (!h) { toast('Certificado ainda não emitido.'); return; } var p = S.pessoas.filter(function (x) { return x.id === b.dataset.p; })[0], c = cursoPor(b.dataset.c); printHTML(h, 'Certificado ' + c.titulo + ' ' + p.nome); },
    'cursos-lembrar': function () { var f = manipuladores().filter(function (p) { return !treinadoBase(p); }); toast(f.length ? 'Lembrete enviado pelo WhatsApp para ' + f.length + ' pessoa(s): ' + f.map(function (p) { return p.nome.split(' ')[0]; }).join(', ') + '.' : 'Todos os manipuladores estão com os cursos básicos em dia.'); },
    'rs-parecer': function (b) {
      var g = vagaAtual(), i = +b.dataset.i, c = g.cands[i];
      modal('Parecer da entrevista · ' + c.n, '<form class="stack" data-form="parecer" data-i="' + i + '"><div class="field"><label for="pn">Nota da entrevista</label><select id="pn" name="n">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '">' + n + ' de 5</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="pp">Parecer para o cliente</label><textarea id="pp" name="p" maxlength="400" rows="4" placeholder="Experiência, postura, pontos fortes e o que precisa desenvolver. Sem critérios pessoais (Lei 9.029/95)." required></textarea></div><button class="btn btn-primary" type="submit">Salvar parecer</button></form>');
    },
    'rs-curta': function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.etapa = 'curta'; save(); render(); toast(first(c.n) + ' entrou na lista curta.' + (c.compartilhar === false ? ' Atenção: sem autorização para compartilhar com o cliente.' : '')); },
    'rs-nao': function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.etapa = 'naoseguir'; save(); render(); },
    'rs-tirar': function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.etapa = 'entrevistado'; save(); render(); },
    'rs-dec': function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.decisao = b.dataset.v === 'aprovado' ? 'aprovado' : 'recusado'; save(); render(); toast('Decisão do cliente registrada para ' + first(c.n) + '.'); },
    'rs-dossie': function () { var g = vagaAtual(); gerarPasta(g, g.cands.filter(function (c) { return c.etapa === 'curta' && c.compartilhar !== false; }), true); },
    'rs-enviar': function () {
      var g = vagaAtual(), cl = clientePor(g.cliente), lista = g.cands.filter(function (c) { return c.etapa === 'curta'; }), ok = lista.filter(function (c) { return c.compartilhar !== false; }), fora = lista.length - ok.length;
      if (!ok.length) { toast('Ninguém na lista curta autorizou o compartilhamento.'); return; }
      if (cl.integ !== 'centralizar') { gerarPasta(g, ok, false); return; }
      modal('Encaminhar para ' + cl.nome, '<p>Os candidatos abaixo vão para o painel de <strong>' + esc(cl.nome) + '</strong> (código ' + esc(cl.codigo) + '), em Vagas, para o cliente aprovar ou recusar. Seguem só as respostas da pré-entrevista, a nota e o parecer.</p><ul class="list">' + ok.map(function (c) { return '<li><span>' + esc(c.n) + '<span class="sub">' + esc(c.parecer || '') + '</span></span>' + estrelas(c.nota) + '</li>'; }).join('') + '</ul>' +
        (fora ? '<div class="notice"><div>' + fora + ' candidato(s) da lista curta não autorizaram o compartilhamento e não serão enviados (LGPD, art. 7º, § 5º).</div></div>' : ''),
        '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="rs-enviar-ok">Encaminhar ' + ok.length + '</button>');
    },
    'rs-enviar-ok': function () {
      var g = vagaAtual(), cl = clientePor(g.cliente), x = integ(), n = 0;
      g.cands.forEach(function (c, i) {
        if (c.etapa !== 'curta' || c.compartilhar === false) return;
        var id = NUVEM && window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'env-' + g.id + '-' + Date.now() + '-' + i;
        x.envios.push({ id: id, para: cl.codigo, de: S.empresa.nome, processo: g.id, titulo: g.titulo, cargo: g.cargo, salario: g.salario, em: agora(), status: 'enviado', cand: resumoCand(c) });
        c.etapa = 'enviado'; c.envio = id; n++;
      });
      salvaInteg(x); save(); closeModal(); render(); toast(n + ' candidato(s) enviados para o painel de ' + cl.nome + '. A decisão aparece aqui.');
    },
    'rs-novo': function () {
      var cli = (S.clientes || []).map(function (k) { return '<option value="' + k.id + '">' + esc(k.nome) + '</option>'; }).join('');
      var cgs = CARGOS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.cargo) + ' · CBO ' + esc(c.cbo) + '</option>'; }).join('');
      modal('Novo processo seletivo', '<form class="stack" data-form="processo"><div class="field"><label for="pc">Cliente</label><select id="pc" name="c">' + cli + '</select></div><div class="field"><label for="pt">Título da vaga</label><input id="pt" name="t" maxlength="60" required></div><div class="field"><label for="pg">Cargo (base com CBO)</label><select id="pg" name="g">' + cgs + '</select></div>' +
        '<div class="form-grid"><div class="field"><label for="pq">Vagas</label><input id="pq" name="q" type="number" min="1" max="50" value="1"></div><div class="field"><label for="ps">Salário (R$)</label><input id="ps" name="s" type="number" min="0" step="0.01" value="2000"></div></div><button class="btn btn-primary" type="submit">Abrir processo</button></form>');
    },
    'rec-ver': function (b) {
      var e = envioPor(b.dataset.id); if (!e) return; var c = e.cand || {}, R = window.CENTRALIZAR_ROTULOS || {};
      var lin = function (l, v) { return v ? '<li><span class="sub">' + esc(l) + '</span><span>' + esc(v) + '</span></li>' : ''; };
      modal('Indicado por ' + e.de + ' · ' + c.n, '<div class="notice info"><div><strong>' + esc(e.titulo) + ' · nota ' + esc(c.nota || '–') + ' de 5</strong>' + esc(c.parecer || 'Sem parecer.') + '</div></div><ul class="list cand-resp">' + lin('WhatsApp', c.fone) + lin('Bairro', c.bairro) + lin('Contratação', REG[c.regime]) + lin('Turnos', (c.turnos || []).map(function (t) { return TUR[t]; }).join(', ')) + lin('Pode começar', (R.inicio || {})[c.inicio]) + lin('Distância', c.km ? c.km + ' km' : '') + lin('Experiência na função', c.exp != null ? c.exp + (c.exp === 1 ? ' ano' : ' anos') : '') + lin('Última experiência', c.ultima) + lin('Escolaridade', (R.escolaridade || {})[c.escolaridade]) + lin('Pretensão salarial', (R.pretensao || {})[c.pretensao]) + '</ul><p class="ui-sub">Compartilhado com autorização do candidato, só para esta vaga (LGPD, art. 7º, § 5º).</p>');
    },
    'rec-ok': function (b) {
      var x = integ(), e = x.envios.filter(function (y) { return y.id === b.dataset.id; })[0]; if (!e || e.status !== 'enviado') return;
      var c = e.cand || {}, cg = cargoPor(e.cargo);
      e.status = 'aprovado'; e.decididoEm = agora(); salvaInteg(x);
      var docs = ['RG ou CNH', 'CPF', 'Endereço', 'Carteira de Trabalho Digital', 'Conta para pagamento', 'Exame admissional (ASO)'];
      if (!S.admissoes.some(function (a) { return a.nome === c.n; })) S.admissoes.push({ id: 'd' + Date.now(), nome: c.n, funcao: e.titulo.replace(/\(a\)/g, ''), modelo: 'experiencia', cargo: cg.id, inicio: addDays(S.hoje, 7), salario: +e.salario || 0, cpf: '[a preencher]', docs: docs.map(function (d) { return { n: d, v: '', por: '', st: 'pendente' }; }), hist: [agora() + ' · Aprovado(a) pela empresa a partir da indicação de ' + e.de + '; link de documentos enviado pelo WhatsApp'] });
      save(); render(); toast(first(c.n) + ' aprovado(a). A admissão foi aberta e a recrutadora foi avisada.');
    },
    'rec-nao': function (b) {
      var e = envioPor(b.dataset.id); if (!e) return;
      modal('Recusar · ' + (e.cand || {}).n, '<form class="stack" data-form="rec-nao" data-id="' + esc(e.id) + '"><div class="field"><label for="rm">Motivo (vai para a recrutadora)</label><select id="rm" name="m"><option>Perfil diferente do pedido</option><option>Experiência insuficiente para a função</option><option>Disponibilidade de horário incompatível</option><option>Vaga já preenchida</option><option>Pretensão acima do orçamento</option></select></div><button class="btn btn-primary" type="submit">Recusar</button></form>');
    },
    sair: function () { Nuvem.sair().then(function () { location.href = 'entrar.html'; }); },
    recarregar: function () { location.reload(); },
    'arq-ver': function (b) { abrirArquivo(b.dataset.path, b.dataset.t); },
    'ponto-espelho': function (b) { var p = P(b.dataset.id); if (!p) return; modal('Espelho de ponto · ' + p.nome, '<p class="ui-sub">' + esc(S.real ? turnoCurto(p) + ' · últimos 45 dias · hora do servidor' : 'Marcações feitas neste aparelho') + '</p>' + espelhoHTML(p.id) + (S.real && ajustesDe(p.id).length ? '<h3 class="lbl-s">Ajustes</h3>' + ajustesHTML(ajustesDe(p.id).slice().reverse(), S.role === 'empresa') : ''), S.real && S.role === 'empresa' ? '<button type="button" class="btn btn-primary" data-act="aj-novo" data-id="' + esc(p.id) + '">Ajustar uma marcação</button>' : '', 'modal-largo'); },
    'aj-novo': function (b) { var pid = b.dataset.id || ME, pe = P(pid), direto = S.role === 'empresa'; if (!pe) return; modal(direto ? 'Ajustar marcação · ' + pe.nome : 'Pedir ajuste de ponto', ajusteForm(pid, direto)); },
    'aj-ok': function (b) { decidirAjuste(b.dataset.id, 'aprovado'); },
    'aj-nao': function (b) { modal('Recusar pedido de ajuste', '<form class="stack" data-form="aj-nao" data-id="' + esc(b.dataset.id) + '"><div class="field"><label for="an-m">Resposta (a pessoa vê no app)</label><input id="an-m" name="m" maxlength="300" required placeholder="Ex.: a câmera mostra a saída às 17:10"></div><button class="btn btn-primary" type="submit">Recusar</button></form>'); },
    'ponto-csv': function () {
      var linhas = [['Data', 'Pessoa', 'CPF', 'Marcação', 'Hora', 'NSR', 'Como', 'Latitude', 'Longitude', 'Distância da empresa (m)', 'Fora do local', 'Ajuste aprovado (motivo)'].join(';')];
      (S.registros || []).slice().sort(function (a, b) { return a.em < b.em ? -1 : 1; }).forEach(function (r) { var p = P(r.pessoa_id) || {}; linhas.push([dmyy(r.dia), p.nome || r.pessoa_id, p.cpf || '', tipoNome(r.pessoa_id, r.tipo) + (r.rosto ? ' (' + ROSTO_TXT[r.rosto] + ')' : ''), hhmm(r.em, fusoDe(P(r.pessoa_id))), r.nsr, r.metodo === 'fixo' ? 'Aparelho da empresa' : 'Celular', r.lat == null ? '' : r.lat, r.lng == null ? '' : r.lng, r.distancia == null ? '' : r.distancia, r.fora_do_local ? 'sim' : '', ''].map(csvCel).join(';')); });
      (S.ajustes || []).filter(function (a) { return a.status === 'aprovado'; }).forEach(function (a) { var p = P(a.pessoa_id) || {}; linhas.push([dmyy(a.dia), p.nome || a.pessoa_id, p.cpf || '', tipoNome(a.pessoa_id, a.tipo) + ' · ' + ACAO_AJ[a.acao], a.hora || '', '', 'Ajuste aprovado por ' + (a.decidido_nome || ''), '', '', '', '', a.motivo].map(csvCel).join(';')); });
      baixarTexto('Marcacoes de ponto ' + hojeISO() + '.csv', linhas.join('\r\n'));
    },
    'usar-local': function (b) {
      if (!navigator.geolocation) { toast('Este navegador não informa a localização.'); return; }
      b.disabled = true; b.textContent = 'Buscando…';
      navigator.geolocation.getCurrentPosition(function (pos) { S.empresa.ponto = S.empresa.ponto || {}; S.empresa.ponto.lat = +pos.coords.latitude.toFixed(6); S.empresa.ponto.lng = +pos.coords.longitude.toFixed(6); auditar('Local do ponto definido', S.empresa.ponto.lat + ', ' + S.empresa.ponto.lng + ' (precisão de ' + Math.round(pos.coords.accuracy) + ' m)'); save(); render(); toast('Local da empresa salvo (precisão de ' + Math.round(pos.coords.accuracy) + ' m).'); },
        function () { b.disabled = false; b.textContent = 'Usar a localização deste aparelho'; toast('Não foi possível pegar a localização. Permita o acesso para este site.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    },
    'turno-editar': function (b) { var t = b.dataset.id ? turnoDe(b.dataset.id) : null; modal(t ? 'Editar turno · ' + t.nome : 'Novo turno', turnoForm(t)); },
    'turno-del': function (b) { var t = turnoDe(b.dataset.id); if (!t) return; var n = S.pessoas.filter(function (p) { return p.turno === t.id; }); if (n.length) { toast('Troque o turno de ' + n.map(function (p) { return first(p.nome); }).join(', ') + ' antes de remover.'); return; } S.turnos = S.turnos.filter(function (x) { return x.id !== t.id; }); auditar('Turno removido', t.nome); save(); render(); toast('Turno removido.'); },
    'doc-pessoa': function (b) { S.ui.docPessoa = b.dataset.id; save(); render(); },
    'doc-ok': function (b) { decidirDoc(b.dataset.id, 'aprovado'); },
    'doc-nao': function (b) { modal('Recusar documento', '<form class="stack" data-form="doc-nao" data-id="' + esc(b.dataset.id) + '"><div class="field"><label for="dn-m">Motivo (a pessoa vê no app)</label><input id="dn-m" name="m" maxlength="200" required placeholder="Ex.: foto cortada, envie de novo com o documento inteiro"></div><button class="btn btn-primary" type="submit">Recusar</button></form>'); },
    'doc-del': function (b) { var d = (S.docsArq || []).filter(function (x) { return String(x.id) === String(b.dataset.id); })[0]; if (!d) return; (NUVEM ? Nuvem.apagarDoc(d.id) : Promise.resolve()).then(function () { Arq().apagar(d.arquivo).catch(function () { /* o registro já saiu */ }); S.docsArq = S.docsArq.filter(function (x) { return x !== d; }); save(); render(); toast('Documento apagado.'); }, function (e) { toast(erroTxt(e)); }); },
    'hol-liberar': function (b) { liberarHol([b.dataset.id]); },
    'hol-liberar-sel': function () { liberarHol($$('[data-in="sel-hol"]:checked:not(:disabled)').map(function (c) { return c.dataset.id; })); },
    'hol-liberar-todos': function () { var comp = S.ui.comp || mesAnterior(); liberarHol((S.holArq || []).filter(function (h) { return h.competencia === comp && h.status === 'aguardando'; }).map(function (h) { return String(h.id); })); },
    'ct-tab': function (b) { S.ui.ctTab = b.dataset.v; save(); render(); },
    'ct-salvar-modelo': function () {
      var ct = ctEstado(), html;
      if (ct.alvo === 'novo') { var pp = $('#paper'); html = pp ? pp.innerHTML : contratoAtualHTML().corpo; }
      else { var alvo0 = ct.alvo; ct.alvo = 'novo'; html = contratoAtualHTML().corpo; ct.alvo = alvo0; }
      var x = contratoAtualHTML(); MODELO_PEND = limparHTML(html);
      modal('Salvar como modelo', '<form class="stack" data-form="ct-modelo-salvar"><div class="field"><label for="cm-n">Nome do modelo</label><input id="cm-n" name="n" maxlength="80" required value="' + esc((x.ct.modelo === 'experiencia' ? 'Experiência · ' : '') + x.cargo.cargo) + '"></div><p class="ui-sub">O nome e o CPF ficam em branco no modelo e são preenchidos com os dados de cada pessoa quando você usar o modelo para a equipe. Salário, jornada e cláusulas ficam como estão agora.</p><button class="btn btn-primary" type="submit">Salvar modelo</button></form>');
    },
    'ct-modelo-ver': function (b) { var m = modeloCt(b.dataset.id); if (!m) return; printHTML('<article class="paper">' + marcaDagua() + htmlDoModelo(m, { nome: '[NOME DO EMPREGADO]', cpf: '[CPF]', funcao: '[FUNÇÃO]', salario: 0, admissao: '' }) + '</article>', 'Modelo ' + m.nome); },
    'ct-modelo-del': function (b) { var m = modeloCt(b.dataset.id); if (!m) return; var n = (S.contratos || []).filter(function (c) { return c.modelo === m.id; }).length; if (n) { toast('Este modelo tem ' + n + ' contrato(s) gerado(s). Remova esses contratos antes.'); return; } S.modelosCt = S.modelosCt.filter(function (x) { return x !== m; }); auditar('Modelo de contrato removido', m.nome); save(); render(); toast('Modelo removido.'); },
    'ct-aplicar': function (b) {
      var m = modeloCt(b.dataset.id); if (!m) return; if (!S.pessoas.length) { toast('Cadastre a equipe primeiro.'); return; }
      var ja = function (pid) { return (S.contratos || []).some(function (c) { return c.modelo === m.id && c.pessoa === pid; }); };
      modal('Usar "' + m.nome + '"', '<form class="stack" data-form="ct-aplicar" data-id="' + esc(m.id) + '"><p class="ui-sub">Marque as pessoas. Cada uma recebe o próprio contrato, já com nome, CPF, função, salário e admissão do cadastro.</p><div class="stack">' + S.pessoas.map(function (p) { return '<label class="check"><input type="checkbox" name="p" value="' + esc(p.id) + '"' + (ja(p.id) ? ' disabled' : '') + '> ' + esc(p.nome) + '<span class="sub">' + (ja(p.id) ? 'já tem este contrato' : esc(p.funcao || '')) + '</span></label>'; }).join('') + '</div><button class="btn btn-primary" type="submit">Gerar contratos</button></form>');
    },
    'ct-ver': function (b) { var c = (S.contratos || []).filter(function (x) { return x.id === b.dataset.id; })[0], m = c && modeloCt(c.modelo), p = c && P(c.pessoa); if (!m || !p) { toast('Modelo não encontrado.'); return; } printHTML('<article class="paper">' + marcaDagua() + htmlDoModelo(m, p) + '</article>', 'Contrato ' + p.nome); },
    'ct-del': function (b) { var c = (S.contratos || []).filter(function (x) { return x.id === b.dataset.id; })[0]; if (!c) return; S.contratos = S.contratos.filter(function (x) { return x !== c; }); auditar('Contrato removido', (P(c.pessoa) || {}).nome || ''); save(); render(); toast('Contrato removido da lista.'); },
    'pessoa-editar': function (b) { var p = b.dataset.id ? P(b.dataset.id) : null; modal(p ? 'Editar · ' + p.nome : 'Cadastrar pessoa', pessoaForm(p)); },
    'acesso-editar': function (b) {
      var p = P(b.dataset.id), a = acessoDe(p.id);
      var op = function (v, l, s) { return '<label class="check"><input type="radio" name="papel" value="' + v + '"' + (a.papel === v ? ' checked' : '') + '> <span><strong>' + l + '</strong><span class="sub">' + s + '</span></span></label>'; };
      modal('Acesso ao app · ' + p.nome, '<form class="stack" data-form="acesso" data-id="' + p.id + '"><fieldset class="field cand-set"><legend>O que essa pessoa é no app</legend>' +
        op('nenhum', 'Sem acesso', 'Não entra no app') + op('funcionario', 'Funcionário', 'Bate ponto, envia atestado, vê holerite, vales, checklists e cursos') + op('gerente', 'Gerente', 'Tudo do funcionário e mais as permissões marcadas abaixo') + '</fieldset>' +
        '<fieldset class="field cand-set"><legend>Permissões do gerente</legend>' + Object.keys(PERMS).map(function (k) { return '<label class="check"><input type="checkbox" name="perm" value="' + k + '"' + (a.perms.indexOf(k) > -1 ? ' checked' : '') + '> ' + esc(PERMS[k]) + '</label>'; }).join('') + '</fieldset>' +
        '<div class="actions"><button class="btn btn-primary" type="submit">Salvar acesso</button>' + (a.papel !== 'nenhum' ? '<button type="button" class="btn" data-act="gerar-acesso" data-id="' + p.id + '">Gerar código de primeiro acesso</button>' : '') + '</div>' +
        '<p class="ui-sub">A mudança fica no registro de alterações, com quem fez, data e hora.</p></form>');
    },
    'gerar-acesso': function (b) {
      var p = P(b.dataset.id); if (!p) return;
      if (!cpfValido(p.cpf)) { toast('Cadastre um CPF válido para ' + first(p.nome) + ' antes de gerar o acesso (Equipe > Editar).'); return; }
      var mostra = function (cod) {
        var link = location.href.split('#')[0].replace(/app\.html.*$/, 'entrar.html') + '#primeiro';
        var msg = 'Olá, ' + first(p.nome) + '! Seu acesso ao app da ' + S.empresa.nome + ': entre em ' + link + ', escolha "Primeiro acesso" e use seu CPF e o código ' + cod + '. O código vale por 72 horas.';
        if (NUVEM) publicarDocs(true, p.id);
        modal('Código de primeiro acesso', '<p>Envie para ' + esc(first(p.nome)) + ' (vale por 72 horas e só uma vez):</p><p class="codigo num">' + esc(cod) + '</p><div class="notice info"><div><strong>Mensagem pronta para o WhatsApp</strong>' + esc(msg) + '</div></div>' + (NUVEM ? '' : '<p class="ui-sub">Exemplo: o código só funciona com o app conectado ao banco de dados.</p>'));
        auditar('Código de acesso gerado', p.nome); save();
      };
      if (NUVEM) Nuvem.criarConvite(acessoDe(p.id).papel === 'gerente' ? 'gerente' : 'funcionario', p.id, p.cpf, p.nome).then(mostra, function (e) { toast('Não foi possível gerar o código: ' + (e && e.message || 'erro')); });
      else mostra('DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase());
    },
    'convite-contador': function () { modal('Convidar contador', '<form class="stack" data-form="convite-contador"><div class="field"><label for="cc-n">Nome do contador ou escritório</label><input id="cc-n" name="n" maxlength="80" required></div><button class="btn btn-primary" type="submit">Gerar código</button><p class="ui-sub">O contador cria a conta com e-mail e senha e depois digita o código.</p></form>'); },
    'banco-estornar': function (b) {
      var o = (S.banco || []).filter(function (x) { return x.id === b.dataset.id; })[0]; if (!o || !pode('banco')) return;
      S.banco.push({ id: 'b' + Date.now(), pessoa: o.pessoa, min: -o.min, motivo: 'Estorno do lançamento de ' + o.em + ' (' + o.motivo + ')', por: S.role === 'empresa' ? 'empresa' : ME, porNome: quemSou(), em: agora(), estorno: o.id });
      auditar('Banco de horas: estorno', (P(o.pessoa) || {}).nome + ' ' + fmtMin(-o.min)); save(); render(); toast('Estorno lançado. O lançamento original continua no histórico.');
    },
    'vaga-nova': function () {
      var cgs = CARGOS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.cargo) + ' · CBO ' + esc(c.cbo) + '</option>'; }).join('');
      modal('Nova vaga', '<form class="stack" data-form="vaga-nova"><div class="field"><label for="vn-t">Título</label><input id="vn-t" name="t" maxlength="60" required></div><div class="field"><label for="vn-g">Cargo (base com CBO)</label><select id="vn-g" name="g">' + cgs + '</select></div>' +
        '<div class="form-grid"><div class="field"><label for="vn-m">Contratação</label><select id="vn-m" name="m"><option value="experiencia">CLT · experiência de 45 dias</option><option value="indeterminado">CLT · prazo indeterminado</option><option value="intermitente">Intermitente</option><option value="autonomo">Freelancer (autônomo)</option></select></div><div class="field"><label for="vn-s">Salário ou diária (R$)</label><input id="vn-s" name="s" type="number" min="0" step="0.01" required></div></div><button class="btn btn-primary" type="submit">Abrir vaga</button></form>');
    },
    'prod-novo': function () {
      var f = function (id, l, n, extra) { return '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" name="' + n + '"' + (extra || '') + '></div>'; };
      modal('Cadastrar produto', '<form class="stack" data-form="prod-novo">' + f('pn-n', 'Nome', 'n', ' maxlength="80" required') + '<div class="form-grid">' + f('pn-c', 'Código', 'c', ' maxlength="20"') + f('pn-u', 'Unidade', 'u', ' maxlength="10" value="un"') + '</div>' +
        '<div class="form-grid">' + f('pn-q', 'Quantidade', 'q', ' type="number" min="0" value="0"') + f('pn-mi', 'Mínimo', 'mi', ' type="number" min="0" value="0"') + f('pn-i', 'Ideal', 'i', ' type="number" min="0" value="0"') + '</div>' +
        '<div class="form-grid">' + f('pn-v', 'Validade', 'v', ' type="date"') + f('pn-p', 'Preço de venda (R$)', 'p', ' type="number" min="0" step="0.01"') + f('pn-cu', 'Custo (R$)', 'cu', ' type="number" min="0" step="0.01"') + '</div>' +
        '<div class="form-grid">' + f('pn-fo', 'Fornecedor', 'fo', ' maxlength="60"') + f('pn-l', 'Lote', 'l', ' maxlength="20"') + '</div><button class="btn btn-primary" type="submit">Cadastrar</button></form>');
    },
    'em-branco': function () { modal('Começar em branco', '<form class="stack" data-form="em-branco"><p>Apaga os dados de exemplo deste navegador e abre a empresa vazia, para cadastrar a sua equipe.</p><div class="field"><label for="eb-n">Nome da empresa</label><input id="eb-n" name="n" maxlength="80" value="' + esc(S.empresa.nome) + '" required></div><button class="btn btn-primary" type="submit">Começar em branco</button></form>'); },
    'ct-extra-del': function (b) { var c = ctEstado(), i = +b.dataset.i; if (c.extras[i]) { c.extras.splice(i, 1); c.checks = {}; save(); render(); toast('Cláusula removida do contrato.'); } },
    'cmp-print': function () { printHTML(listaHTML(), 'Lista de compras ' + S.empresa.nome); },
    'cmp-receber': function () {
      var ok = S.compras.itens.filter(function (i) { return i.comprado; }), n = 0;
      ok.forEach(function (i) { var p = S.produtos.filter(function (x) { return x.id === i.prod; })[0]; if (p) { p.qtd = Math.round((p.qtd + i.qtd) * 100) / 100; n++; } });
      S.compras.itens = S.compras.itens.filter(function (i) { return !i.comprado; }); save(); render();
      toast(ok.length + ' item(ns) recebido(s). ' + (n ? n + ' atualizaram o estoque.' : 'Itens sem cadastro saíram da lista.'));
    },
    assinar: function (b) { var v = S.vales.filter(function (x) { return x.id === b.dataset.id; })[0]; v.assinado = (S.real ? hojeISO() : '2026-11-05') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); save(); render(); toast('Autorização assinada. O vale entra na folha de novembro.'); },
    'novo-vale': function () {
      modal('Novo vale', '<form class="stack" data-form="vale"><div class="form-grid"><div class="field"><label for="vp">Funcionário</label><select id="vp" name="p">' + S.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select></div><div class="field"><label for="vt">Tipo</label><select id="vt" name="t"><option value="produto">Produto da loja</option><option value="adiantamento">Adiantamento</option></select></div></div><div class="field"><label for="vd">Itens ou motivo</label><input id="vd" name="d" maxlength="80" required placeholder="Ex.: 2 bolos de fubá"></div><div class="field"><label for="vv">Valor (R$)</label><input id="vv" name="v" type="number" min="0.01" max="5000" step="0.01" required></div><p class="ui-sub">O funcionário recebe no app para assinar. Sem assinatura, o vale não entra na folha.</p><button class="btn btn-primary" type="submit">Enviar para assinatura</button></form>');
    }
  };
  function quemMarca() {
    var eu = ehFunc() && (S.real || !pode('ponto')), p = eu ? P(ME) : (P(S.ui.pontoPessoa) || P('e3') || S.pessoas[0]); if (!p) return null;
    var met = eu ? 'celular' : S.real ? 'fixo' : (S.ui.metodo || (p.celular ? 'celular' : 'fixo'));
    if (met === 'celular' && !p.celular) { toast('A empresa não liberou a marcação pelo celular para ' + first(p.nome) + '.'); return null; }
    return { p: p, met: met };
  }
  function onClick(e) { var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; var f = A[b.dataset.act]; if (f) f(b, e); }
  function onSubmit(e) {
    var f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    var d = new FormData(f), k = f.dataset.form;
    if (f.classList.contains('wiz')) {
      var wtot = $$('[data-passo]', f).length, wat = +f.dataset.p || 1;
      if (wat < wtot) { if (wizValida(f, wat)) wizIr(f, wat + 1); return; }
      for (var wi = 1; wi <= wtot; wi++) if (!wizValida(f, wi, true)) { wizIr(f, wi); wizValida(f, wi); return; }
    }
    if (k === 'parecer') {
      var cp = vagaAtual().cands[+f.dataset.i]; if (!cp) return;
      cp.nota = Math.max(1, Math.min(5, +d.get('n') || 3)); cp.parecer = String(d.get('p') || '').trim().replace(/\s+/g, ' ').slice(0, 400); cp.etapa = 'entrevistado';
      save(); closeModal(); render(); toast('Parecer salvo. Agora decida se ' + first(cp.n) + ' vai para a lista curta.'); return;
    }
    if (k === 'processo') {
      var tt2 = String(d.get('t') || '').trim().slice(0, 60), cgp = cargoPor(String(d.get('g'))), cli = clientePor(String(d.get('c')));
      if (!tt2) { toast('Dê um título para a vaga.'); return; }
      var id2 = 'r' + Date.now();
      S.vagas.push({ id: id2, cliente: cli.id, qtd: Math.max(1, Math.min(50, +d.get('q') || 1)), titulo: tt2, cargo: cgp.id, regimeOferta: 'CLT · experiência de 45 dias', modelo: 'experiencia', salario: Math.max(0, +d.get('s') || 0), aberta: true, crit: { regime: 'clt', turnos: [], km: 15, exp: 0 }, cands: [] });
      S.ui.vaga = id2; save(); closeModal(); render(); toast('Processo aberto. Copie o link da pré-entrevista e divulgue a vaga.'); return;
    }
    if (k === 'cliente') {
      var nn = String(d.get('n') || '').trim().slice(0, 80); if (!nn) return;
      var cod = String(d.get('k') || ''), integra = d.get('i') === 'centralizar' && !!cod;
      S.clientes.push({ id: 'k' + Date.now(), nome: nn, cidade: S.empresa.cidade, contato: String(d.get('c') || '').trim().slice(0, 80), integ: integra ? 'centralizar' : 'externo', codigo: integra ? cod : undefined });
      save(); render(); toast(integra ? 'Cliente conectado pelo código ' + cod + '.' : 'Cliente externo cadastrado: a lista curta sai em pasta .zip.'); return;
    }
    if (k === 'rec-nao') {
      var x2 = integ(), e2 = x2.envios.filter(function (y) { return y.id === f.dataset.id; })[0]; if (!e2) return;
      e2.status = 'recusado'; e2.motivo = String(d.get('m') || '').slice(0, 80); e2.decididoEm = agora(); salvaInteg(x2); closeModal(); render(); toast('Recusa registrada e enviada para a recrutadora.'); return;
    }
    if (k === 'nuvem-empresa') { var nn = String(d.get('n') || '').trim().slice(0, 80); if (nn.length < 2) return; criarEmpresaNuvem(nn, String(d.get('t') || 'padaria')).catch(function (e) { toast(e.message); }); return; }
    if (k === 'ajuste') {
      var ajp = f.dataset.pessoa, ajd = String(d.get('d') || ''), ajt = +d.get('t'), aja = String(d.get('a') || 'auto'), ajh = hhOk(d.get('h')), ajm = String(d.get('m') || '').trim().slice(0, 300), direto = f.dataset.direto === '1' && S.role === 'empresa';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ajd) || ajd > hojeEm(fusoDe(P(ajp)))) { toast('Escolha um dia até hoje.'); return; }
      if (!(ajt >= 0 && ajt <= SAIDA)) return; if (ajm.length < 5) { toast('Explique o motivo do ajuste.'); return; }
      var reg = regsDe(ajp, ajd).filter(function (r) { return r.tipo === ajt; })[0], acao = aja === 'desconsiderar' ? 'desconsiderar' : reg ? 'corrigir' : 'incluir';
      if (acao !== 'desconsiderar' && !ajh) { toast('Informe o horário correto.'); return; }
      if (acao === 'desconsiderar' && !marcasDia(ajp, ajd)[ajt]) { toast('Não há marcação para desconsiderar nesse dia.'); return; }
      if (!direto && ajustesDe(ajp, ajd, 'pendente').some(function (a) { return a.tipo === ajt; })) { toast('Já existe um pedido aguardando para essa marcação.'); return; }
      var ajr = { pessoa_id: ajp, dia: ajd, tipo: ajt, acao: acao, hora: acao === 'desconsiderar' ? null : ajh, registro_id: reg ? reg.id : null, motivo: ajm, status: direto ? 'aprovado' : 'pendente', pedido_nome: quemSou() };
      if (direto) ajr.decidido_nome = quemSou();
      var agoraIso = new Date().toISOString();
      (NUVEM ? Nuvem.pedirAjuste(ajr) : Promise.resolve(Object.assign({}, ajr, { id: 'aj' + Date.now(), pedido_em: agoraIso, decidido_em: direto ? agoraIso : null }))).then(function (x) {
        S.ajustes = S.ajustes || []; S.ajustes.push(x); pontoHoje();
        if (direto) auditar('Ajuste de ponto', ((P(ajp) || {}).nome || '') + ' · ' + dmyy(ajd) + ' · ' + tipoNome(ajp, ajt) + (ajh && acao !== 'desconsiderar' ? ' ' + ajh : '') + ' (' + ACAO_AJ[acao] + '): ' + ajm);
        save(); closeModal(); render(); toast(direto ? 'Ajuste registrado. A marcação original continua guardada.' : 'Pedido enviado. A empresa vai analisar.');
      }, function (e) { toast(erroTxt(e)); });
      return;
    }
    if (k === 'aj-nao') { var ajr2 = String(d.get('m') || '').trim().slice(0, 300); if (ajr2.length < 3) return; decidirAjuste(f.dataset.id, 'recusado', ajr2); return; }
    if (k === 'turno') {
      var tn = String(d.get('n') || '').trim().slice(0, 40); if (!tn) return;
      var jt = jornadaDoForm(d); if (!jt.s) { toast('Informe o horário de saída.'); return; } if (!aceiteJornada(jt, d, 'Turno ' + tn)) return;
      var tt = f.dataset.id ? turnoDe(f.dataset.id) : null, novoT = !tt; S.turnos = S.turnos || [];
      if (novoT) { tt = { id: 't' + Date.now().toString(36) }; S.turnos.push(tt); }
      delete tt.si; delete tt.vi; delete tt.x1236; delete tt.aceite; tt.nome = tn; Object.keys(jt).forEach(function (x) { tt[x] = jt[x]; });
      S.pessoas.forEach(function (p) { if (p.turno === tt.id) p.escala = tt.e; });
      var cj = conferirJornada(tt); auditar(novoT ? 'Turno criado' : 'Turno alterado', tn + ': ' + horarioTxt(tt) + ', ' + escalaTxt(tt)); save(); closeModal(); render(); toast(cj.graves.length ? 'Turno salvo, mantido pela empresa fora da CLT.' : cj.avisos.length ? 'Turno salvo. Atenção: ' + cj.avisos[0] + '.' : 'Turno salvo: dentro da CLT.'); return;
    }
    if (k === 'ponto-cfg') {
      S.empresa.ponto = S.empresa.ponto || {}; var pc = S.empresa.ponto;
      pc.raio = Math.max(30, Math.min(5000, +d.get('raio') || 200)); pc.foto = d.get('foto') === 'on'; pc.local = d.get('local') === 'on'; pc.bloquear = d.get('bloquear') === 'on';
      pc.rosto = d.get('rosto') === 'on'; if (pc.rosto) pc.foto = true; pc.rosto_rigor = ({ tolerante: 1, normal: 1, rigoroso: 1 })[d.get('rg')] ? String(d.get('rg')) : 'normal'; pc.rosto_bloquear = d.get('rb') !== '0';
      S.empresa.fuso = fusoOk(String(d.get('fu') || '')) || 'America/Sao_Paulo';
      auditar('Regras do ponto alteradas', 'raio de ' + pc.raio + ' m' + (pc.foto ? ', foto obrigatória' : ', foto opcional') + (pc.local ? ', localização obrigatória' : ', localização opcional') + (pc.bloquear ? ', recusa fora do local' : '') + (pc.rosto ? ', reconhecimento facial (' + pc.rosto_rigor + (pc.rosto_bloquear ? ', bloqueia' : ', sinaliza') + ')' : ', sem reconhecimento facial') + ', ' + fusoNome(S.empresa.fuso)); save(); render(); toast('Regras do ponto salvas.'); return;
    }
    if (k === 'doc-nao') { var mt = String(d.get('m') || '').trim().slice(0, 200); if (mt.length < 3) return; decidirDoc(f.dataset.id, 'recusado', mt); return; }
    if (k === 'ct-modelo-salvar') {
      var mn = String(d.get('n') || '').trim().slice(0, 80); if (!mn || !MODELO_PEND) return; S.modelosCt = S.modelosCt || [];
      S.modelosCt.push({ id: 'm' + Date.now().toString(36), nome: mn, tipo: 'gerado', html: MODELO_PEND, cargo: ctEstado().cargo, em: agora() }); MODELO_PEND = '';
      S.ui.ctTab = 'modelos'; auditar('Modelo de contrato salvo', mn); save(); closeModal(); render(); toast('Modelo salvo. Em "Usar para a equipe", gere os contratos de várias pessoas de uma vez.'); return;
    }
    if (k === 'ct-modelo-texto') {
      var mn2 = String(d.get('n') || '').trim().slice(0, 80), tx = String(d.get('x') || '').trim().slice(0, 60000); if (!mn2 || tx.length < 20) { toast('Cole o texto do contrato.'); return; }
      S.modelosCt = S.modelosCt || []; S.modelosCt.push({ id: 'm' + Date.now().toString(36), nome: mn2, tipo: 'texto', texto: tx, em: agora() });
      auditar('Modelo de contrato cadastrado', mn2); save(); render(); toast('Modelo salvo.' + (/\{\{\s*nome\s*\}\}/.test(tx) ? '' : ' Dica: escreva {{nome}} onde entra o nome de cada pessoa.')); return;
    }
    if (k === 'ct-aplicar') {
      var mm = modeloCt(f.dataset.id || String(d.get('m') || '')); if (!mm) { toast('Escolha o modelo do contrato.'); return; }
      var marc = d.getAll('p').filter(function (x) { return P(x); }), sel = marc.filter(function (x) { return !(S.contratos || []).some(function (c) { return c.modelo === mm.id && c.pessoa === x; }); });
      if (!sel.length) { toast(marc.length ? 'Essas pessoas já têm este contrato.' : 'Marque ao menos uma pessoa.'); return; }
      S.contratos = S.contratos || []; sel.forEach(function (pid, i) { S.contratos.push({ id: 'c' + Date.now().toString(36) + i, pessoa: pid, modelo: mm.id, em: agora() }); });
      S.ui.ctTab = 'equipe'; auditar('Contratos gerados', mm.nome + ' para ' + sel.length + ' pessoa(s)'); save(); closeModal(); render(); toast(sel.length + ' contrato(s) gerado(s). Baixe, colha a assinatura e envie o assinado.'); return;
    }
    if (k === 'pessoa') {
      var nm = String(d.get('n') || '').trim().replace(/\s+/g, ' ').slice(0, 80), cpf = String(d.get('c') || '').replace(/\D/g, '');
      if (nm.split(' ').length < 2) { toast('Informe o nome completo.'); return; }
      if (cpf && !cpfValido(cpf)) { toast('CPF inválido.'); return; }
      var tuSel = String(d.get('tu') || ''), jNova = tuSel && turnoDe(tuSel) ? null : jornadaDoForm(d);
      if (jNova && !jNova.s) { toast('Informe o horário de saída ou escolha um turno.'); return; }
      if (jNova && !aceiteJornada(jNova, d, nm)) return;
      var pid = f.dataset.id, pe = pid ? P(pid) : null, novo = !pe;
      if (novo) { pe = { id: 'p' + Date.now().toString(36), celular: !!S.real }; S.pessoas.push(pe); S.ponto[pe.id] = []; }
      pe.nome = nm; pe.cpf = cpf ? fmtCPF(cpf) : ''; pe.fone = String(d.get('t') || '').trim().slice(0, 20); pe.funcao = String(d.get('f') || '').trim().slice(0, 60); pe.setor = String(d.get('s') || '').trim().slice(0, 40) || 'Geral';
      pe.cargo = cargoPor(String(d.get('g'))).id; pe.salario = Math.max(0, +d.get('sa') || 0); if (!jNova) { pe.turno = tuSel; delete pe.jornada; pe.escala = turnoDe(tuSel).e; } else { pe.turno = ''; pe.jornada = jNova; pe.escala = jNova.e; } var fu = fusoOk(String(d.get('fu') || '')); if (fu) pe.fuso = fu; else delete pe.fuso; pe.admissao = String(d.get('a') || S.hoje).slice(0, 10);
      auditar(novo ? 'Pessoa cadastrada' : 'Cadastro alterado', nm); save(); closeModal(); render(); toast(novo ? nm.split(' ')[0] + ' cadastrado(a). Em "Acesso", gere o código do app.' : 'Cadastro salvo.'); return;
    }
    if (k === 'acesso') {
      var pa = P(f.dataset.id); if (!pa) return;
      var papel = String(d.get('papel') || 'funcionario'), perms = papel === 'gerente' ? d.getAll('perm').filter(function (x) { return PERMS[x]; }) : [];
      if (['nenhum', 'funcionario', 'gerente'].indexOf(papel) < 0) return;
      var antes = acessoDe(pa.id); S.acessos = S.acessos || {}; S.acessos[pa.id] = { papel: papel, perms: perms };
      auditar('Acesso alterado', pa.nome + ': ' + (antes.papel === 'gerente' ? 'Gerente' : antes.papel === 'nenhum' ? 'Sem acesso' : 'Funcionário') + ' → ' + (papel === 'gerente' ? 'Gerente' : papel === 'nenhum' ? 'Sem acesso' : 'Funcionário') + (perms.length ? ' (' + perms.map(function (x) { return PERMS[x]; }).join('; ') + ')' : ''));
      if (NUVEM) Nuvem.alterarAcesso(pa.id, papel, perms, pa.nome).then(function () { return Nuvem.membros(); }).then(function (ms) { MEMBROS = ms || []; publicarDocs(true); }).catch(function () { toast('O acesso foi salvo, mas a conta dessa pessoa ainda não está ligada ao app.'); });
      save(); closeModal(); render(); toast('Acesso salvo e registrado.'); return;
    }
    if (k === 'banco') {
      if (!pode('banco')) return;
      var bp = P(String(d.get('p'))), mins = (Math.max(0, +d.get('h') || 0) * 60 + Math.max(0, Math.min(59, +d.get('m') || 0))) * (d.get('t') === '-1' ? -1 : 1), mot = String(d.get('x') || '').trim().slice(0, 120);
      if (!bp || !mins) { toast('Informe a pessoa e as horas.'); return; }
      if (mot.length < 5) { toast('Descreva o motivo do lançamento.'); return; }
      S.banco = S.banco || []; S.banco.push({ id: 'b' + Date.now(), pessoa: bp.id, min: mins, motivo: mot, por: S.role === 'empresa' ? 'empresa' : ME, porNome: quemSou(), em: agora() });
      auditar('Banco de horas', bp.nome + ' ' + fmtMin(mins) + ': ' + mot); save(); render(); toast('Lançado no banco de horas de ' + first(bp.nome) + ' (' + fmtMin(mins) + ').'); return;
    }
    if (k === 'modulos') {
      var lig = $$('[name=m]', f).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }), mm = {};
      MODULOS.forEach(function (c) { if (c !== 'equipe' && lig.indexOf(c) < 0) mm[c] = false; });
      S.empresa.modulos = mm; auditar('Módulos do app alterados', Object.keys(mm).length ? 'Desligados: ' + Object.keys(mm).map(function (c) { return CATMETA[c][1]; }).join(', ') : 'Todos ligados');
      save(); closeModal(); render(); toast('Módulos salvos.'); return;
    }
    if (k === 'empresa-dados') {
      var en = String(d.get('n') || '').trim().slice(0, 80); if (en.length < 2) return;
      var cn0 = String(d.get('c') || '').replace(/\D/g, ''); if (cn0 && !cnpjValido(cn0)) { toast('CNPJ inválido. Confira os números.'); return; }
      var g = function (k, n) { return String(d.get(k) || '').trim().slice(0, n); }, E = S.empresa;
      E.nome = en; E.razao = g('r', 120); E.cnpj = cn0 ? cn0.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : ''; E.ie = g('ie', 20); E.endereco = g('e', 140); E.bairro = g('b', 60); E.cep = g('cep', 9); E.cidade = g('ci', 60); E.fone = g('t', 20); E.email = g('m', 120); E.resp = g('rn', 80); E.respCargo = g('rc', 40);
      auditar('Dados da empresa alterados', en); save(); closeModal(); render(); toast('Dados da empresa salvos.'); return;
    }
    if (k === 'convite-contador') {
      var cn = String(d.get('n') || '').trim().slice(0, 80); if (!cn) return;
      var mostraC = function (cod) { modal('Código do contador', '<p>Envie para ' + esc(cn) + ':</p><p class="codigo num">' + esc(cod) + '</p><p class="ui-sub">O contador cria a conta em "Entrar" com e-mail e senha e, já logado, digita o código em "Tenho um código". Vale por 72 horas.</p>'); auditar('Contador convidado', cn); save(); };
      if (NUVEM) Nuvem.criarConvite('contador', null, null, cn).then(mostraC, function (e) { toast('Não foi possível gerar o código: ' + (e && e.message || 'erro')); });
      else mostraC('DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase());
      return;
    }
    if (k === 'vaga-nova') {
      var vt = String(d.get('t') || '').trim().slice(0, 60), vm = String(d.get('m')), vc = cargoPor(String(d.get('g'))); if (!vt) return;
      var rot = { experiencia: 'CLT · experiência de 45 dias', indeterminado: 'CLT · prazo indeterminado', intermitente: 'CLT · intermitente', autonomo: 'Freelancer · por diária' };
      var vid = 'g' + Date.now().toString(36);
      S.vagas.push({ id: vid, titulo: vt, cargo: vc.id, modelo: rot[vm] ? vm : 'experiencia', regimeOferta: rot[vm] || rot.experiencia, salario: Math.max(0, +d.get('s') || 0), aberta: true, crit: { regime: vm === 'autonomo' ? 'free' : 'clt', turnos: [], km: 15, exp: 0 }, cands: [] });
      S.ui.vaga = vid; save(); closeModal(); render(); toast('Vaga aberta. Copie o link da pré-entrevista e divulgue.'); return;
    }
    if (k === 'prod-novo') {
      var pn = String(d.get('n') || '').trim().slice(0, 80); if (!pn) return;
      var num = function (x) { var v = d.get(x); return v === '' || v === null ? null : Math.max(0, +v || 0); };
      S.produtos.push({ id: 'pr' + Date.now().toString(36), nome: pn, cod: String(d.get('c') || '').trim().slice(0, 20) || 'P-' + (S.produtos.length + 1), un: String(d.get('u') || 'un').trim().slice(0, 10), qtd: num('q') || 0, min: num('mi') || 0, ideal: num('i') || 0, validade: String(d.get('v') || '') || '2099-12-31', preco: num('p'), custo: num('cu'), fornecedor: String(d.get('fo') || '').trim().slice(0, 60) || 'Sem fornecedor', lote: String(d.get('l') || '').trim().slice(0, 20) });
      save(); closeModal(); render(); toast('Produto cadastrado.'); return;
    }
    if (k === 'em-branco') {
      var bn = String(d.get('n') || '').trim().slice(0, 80) || 'Minha empresa', tp0 = S.tipo || 'padaria';
      S = novoEmBranco(tp0, bn); S.role = 'empresa'; S.ui = {}; save(); closeModal(); location.hash = '#/equipe'; render(); toast('Empresa em branco criada. Comece cadastrando a equipe.'); return;
    }
    if (k === 'temp') {
      var eqp = String(d.get('eq')), tv = parseFloat(String(d.get('t') || '').replace(',', '.')), ac = String(d.get('a') || '').trim().slice(0, 140);
      if (!S.bp || !S.bp.equip.some(function (e) { return e.id === eqp; }) || !isFinite(tv) || tv < -40 || tv > 300) { toast('Informe uma temperatura válida.'); return; }
      var reg = { eq: eqp, data: S.hoje, hora: new Date().toTimeString().slice(0, 5), t: Math.round(tv * 10) / 10, por: ehFunc() ? ME : null, acao: ac };
      if (!tempOk(reg) && !ac) { toast('Fora da faixa: descreva a ação corretiva antes de registrar.'); var fa = $('#bt-a'); if (fa) fa.focus(); return; }
      S.bp.temps.push(reg); save(); render(); toast(tempOk(reg) ? 'Temperatura registrada.' : 'Registrado fora da faixa, com a ação corretiva. A gerência foi avisada.'); return;
    }
    if (k === 'quiz') {
      var cq = cursoPor(S.ui.curso); if (!cq) return;
      var ac2 = 0, erros = [];
      cq.quiz.forEach(function (qq, i) { if (+d.get('q' + i) === qq[2]) ac2++; else erros.push([qq[0], qq[1][qq[2]]]); });
      var aprovado = ac2 >= 3;
      if (aprovado && ehFunc()) { S.treinos = S.treinos || {}; S.treinos[ME] = S.treinos[ME] || {}; S.treinos[ME][cq.id] = { nota: Math.round(ac2 / cq.quiz.length * 100), em: S.hoje }; }
      S.ui.cursoRes = { acertos: ac2, total: cq.quiz.length, ok: aprovado, erros: erros }; save(); render(); window.scrollTo(0, 0); return;
    }
    if (k === 'ct-extra') {
      var cx = ctEstado(), tt = String(d.get('t') || '').trim().replace(/\s+/g, ' ').slice(0, 80), tx = String(d.get('x') || '').replace(/\r/g, '').trim().slice(0, 1500);
      if (!tt || tx.length < 10) { toast('Escreva o título e o texto da cláusula.'); return; }
      if (cx.extras.length >= 10) { toast('Limite de 10 cláusulas próprias por contrato.'); return; }
      cx.extras.push({ titulo: tt, texto: tx }); cx.checks = {}; save(); render();
      var rs = window.CENTRALIZAR_RISCOS_CLAUSULA ? window.CENTRALIZAR_RISCOS_CLAUSULA(tt + ' ' + tx) : [];
      toast(rs.some(function (r) { return r[0] === 'bad'; }) ? 'Cláusula incluída, mas a verificação encontrou ponto de nulidade.' : rs.length ? 'Cláusula incluída. Veja o alerta na verificação.' : 'Cláusula incluída no contrato.'); return;
    }
    if (k === 'ent') {
      var gv = vagaAtual(), cv = gv.cands[+f.dataset.i], dd = String(d.get('d') || S.hoje);
      cv.etapa = 'entrevista'; cv.entrevistaEm = dmy(dd) + ' ' + String(d.get('h') || '10:00').slice(0, 5); cv.local = String(d.get('l')).slice(0, 120);
      toast(cv.contato ? 'Convite de entrevista enviado a ' + first(cv.n) + ' pelo WhatsApp (simulação).' : 'Entrevista marcada. Avise ' + first(cv.n) + ' por telefone.');
    }
    if (k === 'cmp-novo') {
      var emp = S.role === 'empresa', q = Math.max(0.5, Math.min(9999, +d.get('q') || 1));
      S.compras.itens.push({ id: 'k' + Date.now(), prod: null, nome: String(d.get('n')).trim().slice(0, 60), qtd: q, un: String(d.get('u')).trim().slice(0, 10) || 'un', fornecedor: String(d.get('f')).slice(0, 60), custo: emp ? Math.max(0, +d.get('c') || 0) : 0, origem: emp ? 'manual' : 'pedido', por: emp ? null : ME, comprado: false });
      toast(emp ? 'Item adicionado à lista.' : 'Pedido enviado. A empresa vê na lista de compras.');
    }
    if (k === 'bp-eq') {
      var eqn = String(d.get('n') || '').trim().slice(0, 60), eqt = String(d.get('t') || 'frio'); if (!eqn || !S.bp) return; if (!LIMT[eqt]) eqt = 'frio';
      S.bp.equip.push({ id: 'q' + Date.now().toString(36), nome: eqn, tipo: eqt }); S.ui.bpAba = 'equip'; auditar('Equipamento cadastrado', eqn); save(); render(); toast(eqn + ' cadastrado.'); return;
    }
    if (k === 'ck') {
      var cn = String(d.get('n') || '').trim().slice(0, 60), cini = hhOk(d.get('ini')), clim = hhOk(d.get('lim')); if ((!cn && f.dataset.escopo !== 'hoje') || !cini || !clim) { toast('Preencha o nome, o horário de abertura e o limite.'); return; }
      var eids = d.getAll('et_id'), etx = d.getAll('et_t'), efo = d.getAll('et_f'), eli = d.getAll('et_l'), ets = [], tb = Date.now().toString(36);
      etx.forEach(function (t, i) { t = String(t).trim().slice(0, 120); if (!t) return; var et = { id: String(eids[i] || '').slice(0, 40) || 'e' + tb + i, t: t, foto: efo[i] === '1' }, l = hhOk(eli[i]); if (l) et.limite = l; ets.push(et); });
      if (!ets.length) { toast('Inclua pelo menos uma etapa.'); return; }
      if (f.dataset.escopo === 'hoje') {
        var bh = ckPorId(f.dataset.id), hj = ckDia(); if (!bh) return; bh.ajustes = bh.ajustes || {};
        Object.keys(bh.ajustes).forEach(function (x) { if (x < addDays(hj, -14)) delete bh.ajustes[x]; });
        bh.ajustes[hj] = { inicio: cini, limite: clim, etapas: ets }; S.ui.ck = bh.id;
        auditar('Checklist ajustado só para hoje', bh.nome + ' (' + dmy(hj) + '): ' + ets.length + ' etapa(s), ' + cini + ' às ' + clim); save(); closeModal(); render(); toast('Ajuste salvo só para hoje. Amanhã volta ao normal.'); return;
      }
      var ckx = f.dataset.id ? ckPorId(f.dataset.id) : null, novoC = !ckx; S.checklists = S.checklists || [];
      if (novoC) { ckx = { id: 'ck' + tb, criado: ckDia() }; S.checklists.push(ckx); } else ckx.alterado = ckDia();
      ckx.nome = cn; ckx.setor = String(d.get('s') || '').trim().slice(0, 40) || 'Geral'; ckx.resp = P(String(d.get('r') || '')) ? String(d.get('r')) : '';
      ckx.dias = d.getAll('ckd').map(Number).filter(function (x) { return x >= 0 && x <= 6; }); if (!ckx.dias.length) ckx.dias = [0, 1, 2, 3, 4, 5, 6];
      ckx.inicio = cini; ckx.limite = clim; ckx.etapas = ets; S.ui.ck = ckx.id;
      auditar(novoC ? 'Checklist criado' : 'Checklist alterado', cn + ': ' + ets.length + ' etapa(s), ' + cini + ' às ' + clim); save(); closeModal(); render(); toast(novoC ? 'Checklist criado. A equipe já vê no app.' : 'Checklist salvo.'); return;
    }
    if (k === 'ck-novo') { var c = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0]; c.itens.push({ t: String(d.get('t')).trim().slice(0, 90), foto: c.foto === 'todos', feito: false }); }
    if (k === 'adv') { S.advertencias.unshift({ id: 'w' + Date.now(), pessoa: d.get('p'), data: S.hoje, motivo: String(d.get('m')).trim().slice(0, 400), ciencia: 'pendente' }); toast('Advertência enviada para ciência no app.'); }
    if (k === 'recusa') { var w = S.advertencias.filter(function (x) { return x.id === f.dataset.id; })[0]; w.ciencia = 'recusa'; w.testemunhas = String(d.get('t')).trim().slice(0, 120); }
    if (k === 'lancar') { var id = f.dataset.id; S.horasExtras[id] = Math.max(0, Math.min(60, +d.get('h') || 0)); S.holerites.aprovados = S.holerites.aprovados.filter(function (x) { return x !== id; }); toast('Lançamento salvo. Volta para aprovação da empresa.'); }
    if (k === 'vale') {
      var pid = d.get('p'), val = Math.round((+d.get('v') || 0) * 100) / 100, pc = pctDescontos(pid, '2026-11', val);
      if (pc >= 70) { toast('Bloqueado: os descontos de novembro chegariam a ' + pc + '% do salário (limite de 70%).'); return; }
      S.vales.push({ id: 'v' + Date.now(), pessoa: pid, data: S.hoje, tipo: d.get('t') === 'adiantamento' ? 'adiantamento' : 'produto', desc: String(d.get('d')).trim().slice(0, 80), valor: val, assinado: '', comp: '2026-11' });
      toast(pc >= 60 ? 'Vale enviado para assinatura. Atenção: descontos em ' + pc + '% do salário.' : 'Vale enviado para o funcionário assinar no app.');
    }
    save(); closeModal(); render();
  }
  function onInput(e) {
    var t = e.target, k = t.dataset.in; if (!k) return;
    if (k === 'crit-km') { vagaAtual().crit.km = +t.value; save(); render(); var r = $('#km'); if (r) r.focus(); }
    if (k === 'crit-exp') { vagaAtual().crit.exp = +t.value; save(); render(); }
    if (k === 'ct') {
      var ct = ctEstado(), key = t.dataset.k, val = t.type === 'checkbox' ? t.checked : t.value;
      if (['dias', 'comissao', 'grat', 'ncMeses', 'cursoMeses'].indexOf(key) > -1) val = Math.max(0, +val || 0); if (key === 'salario') val = Math.max(0, Math.round((+val || 0) * 100) / 100); if (key === 'cct') val = String(val).slice(0, 80);
      ct[key] = val;
      if (key === 'alvo') { var pa = pessoasContrato().filter(function (x) { return x.id === val; })[0]; if (pa && pa.cargo) ct.cargo = pa.cargo; if (pa && pa.salario) ct.salario = pa.salario; if (pa && pa.inicio) ct.inicio = pa.inicio; }
      if (key === 'cargo' || key === 'alvo') ct.peric = temPeric(cargoPor(ct.cargo));
      if (key === 'turno') ct.noturno = val !== 'diurno';
      ct.checks = {}; save(); render(); return;
    }
    if (k === 'rec-import') {
      var arq = t.files && t.files[0]; if (!arq) return;
      if (arq.size > 2 * 1024 * 1024) { toast('Arquivo grande demais (limite de 2 MB).'); return; }
      arq.text().then(function (txt) {
        var j; try { j = JSON.parse(txt); } catch (er) { toast('Arquivo inválido: não é a pasta de candidatos do Seu Comando.'); return; }
        if (!j || ['seucomando-candidatos', 'centralizar-candidatos'].indexOf(j.formato) < 0 || !Array.isArray(j.candidatos)) { toast('Arquivo inválido: não é a pasta de candidatos do Seu Comando.'); return; }
        var x3 = integ(), vg = j.vaga || {}, s = function (v, n) { return String(v == null ? '' : v).slice(0, n); }, cg = cargoPor(s(vg.cargo, 80));
        j.candidatos.slice(0, 50).forEach(function (c, i) {
          var cand = { n: s(c.n, 80), fone: s(c.fone, 20), bairro: s(c.bairro, 60), regime: REG[c.regime] ? c.regime : 'tanto', turnos: (Array.isArray(c.turnos) ? c.turnos : []).filter(function (x) { return TUR[x]; }), km: Math.max(0, +c.km || 0), exp: Math.max(0, Math.min(40, +c.exp || 0)), ultima: s(c.ultima, 120), escolaridade: s(c.escolaridade, 4), pretensao: s(c.pretensao, 12), inicio: s(c.inicio, 12), nota: Math.max(0, Math.min(5, +c.nota || 0)), parecer: s(c.parecer, 400) };
          if (cand.n) x3.envios.push({ id: 'imp-' + Date.now() + '-' + i, para: S.empresa.codigo, de: s(j.de, 80) || 'Recrutadora', titulo: s(vg.titulo, 60) || cg.cargo, cargo: cg.id, salario: Math.max(0, +vg.salario || 0), em: agora(), status: 'enviado', origem: 'arquivo', cand: cand });
        });
        salvaInteg(x3); render(); toast('Pasta importada: os candidatos estão em Recebidos de recrutadoras.');
      }, function () { toast('Não foi possível ler o arquivo.'); });
      return;
    }
    if (k === 'ct-opc') { var co = ctEstado(); co.opc[t.dataset.k] = t.checked; co.checks = {}; save(); render(); var back = $('[data-in="ct-opc"][data-k="' + t.dataset.k + '"]'); if (back) back.focus(); return; }
    if (k === 'ct-check') { ctEstado().checks[t.dataset.k] = t.checked; save(); render(); return; }
    if (k === 'ponto-pessoa') { S.ui.pontoPessoa = t.value; S.ui.metodo = null; save(); render(); }
    if (k === 'aut') { P(t.dataset.id).celular = t.checked; save(); render(); }
    if (k === 'etq') { S.ui.etq = S.ui.etq || {}; S.ui.etq[t.dataset.id] = t.checked; save(); render(); }
    if (k === 'cmp-qtd' || k === 'cmp-ok') {
      var it = S.compras.itens.filter(function (i) { return i.id === t.dataset.id; })[0]; if (!it) return;
      if (k === 'cmp-qtd') it.qtd = Math.max(0.5, Math.min(9999, Math.round((+t.value || 1) * 2) / 2)); else it.comprado = t.checked;
      save(); render(); return;
    }
    if (k === 'copias') { S.ui.copias = Math.max(1, Math.min(40, +t.value || 1)); save(); }
    if (k === 'guia-entrar') { try { if (t.checked) localStorage.removeItem(guiaChave()); else localStorage.setItem(guiaChave(), 'nao'); } catch (er) { /* sem armazenamento */ } toast(t.checked ? 'O passo a passo vai aparecer quando você entrar.' : 'Certo. Ele continua no botão "Passo a passo", no alto da tela.'); return; }
    if (k === 'pe-turno') { var fs = t.form && t.form.querySelector('[data-manual]'); if (fs) { fs.hidden = !!t.value; fs.disabled = !!t.value; } return; }
    if (k === 'hol-comp') { if (/^\d{4}-\d{2}$/.test(t.value)) { S.ui.comp = t.value; save(); render(); } return; }
    if (k === 'doc-enviar' && t.files && t.files.length) {
      var tp = t.dataset.tipo, pp = t.dataset.pessoa, fl = Array.prototype.slice.call(t.files, 0, 6); toast('Enviando…');
      fl.reduce(function (pr, file) { return pr.then(function () { return enviarArquivo(file, pp, 'docs').then(function (a) { var row = { pessoa_id: pp, tipo: tp, arquivo: a.path, nome: a.nome }; if (NUVEM) return Nuvem.enviarDoc(row); row.id = 'd' + Date.now() + rnd(); row.status = 'enviado'; row.enviado_em = new Date().toISOString(); return row; }).then(function (row) { S.docsArq = S.docsArq || []; S.docsArq.push(row); }); }); }, Promise.resolve())
        .then(function () { save(); render(); toast(fl.length > 1 ? fl.length + ' arquivos enviados.' : 'Documento enviado. A empresa vai conferir.'); }, function (e) { save(); render(); toast(erroTxt(e)); });
      return;
    }
    if (k === 'hol-enviar' && t.files && t.files[0]) {
      var hp = t.dataset.id, hc = S.ui.comp || mesAnterior(); toast('Enviando…');
      enviarArquivo(t.files[0], hp, 'holerites').then(function (a) { var row = { pessoa_id: hp, competencia: hc, arquivo: a.path, status: 'aguardando', liberado_em: null }; if (NUVEM) return Nuvem.enviarHolerite(row); row.id = 'h' + Date.now(); row.enviado_em = new Date().toISOString(); return row; })
        .then(function (row) { S.holArq = (S.holArq || []).filter(function (h) { return !(h.pessoa_id === row.pessoa_id && h.competencia === row.competencia); }); S.holArq.push(row); save(); render(); toast('Holerite enviado. Falta a aprovação da empresa.'); }, function (e) { toast(erroTxt(e)); });
      return;
    }
    if (k === 'ct-modelo-arq' && t.files && t.files[0]) {
      var nmA = (($('#ma-n') || {}).value || '').trim() || t.files[0].name.replace(/\.[^.]+$/, ''); toast('Enviando…');
      enviarArquivo(t.files[0], 'empresa', 'modelos').then(function (a) { S.modelosCt = S.modelosCt || []; S.modelosCt.push({ id: 'm' + Date.now().toString(36), nome: nmA.slice(0, 80), tipo: 'arquivo', arquivo: a.path, nomeArq: a.nome, em: agora() }); auditar('Modelo de contrato enviado', nmA); save(); render(); toast('Modelo em arquivo salvo.'); }, function (e) { toast(erroTxt(e)); });
      return;
    }
    if ((k === 'ct-assinado' || k === 'ct-pronto') && t.files && t.files[0]) {
      var cc = k === 'ct-assinado' ? (S.contratos || []).filter(function (x) { return x.id === t.dataset.id; })[0] : null, cpid = cc ? cc.pessoa : ($('#cp-p') || {}).value;
      if (!P(cpid)) return; toast('Enviando…');
      enviarArquivo(t.files[0], cpid, 'contratos').then(function (a) { S.contratos = S.contratos || []; if (!cc) { cc = { id: 'c' + Date.now().toString(36), pessoa: cpid, modelo: null, nomeArq: a.nome, em: agora() }; S.contratos.push(cc); } cc.arquivo = a.path; cc.assinadoEm = agora(); auditar('Contrato assinado anexado', P(cpid).nome); save(); render(); toast('Contrato assinado guardado.'); }, function (e) { toast(erroTxt(e)); });
      return;
    }
    if (k === 'novo-atestado' && t.files && t.files[0]) {
      S.atestados.unshift({ id: 'a' + Date.now(), pessoa: ME, inicio: S.hoje, dias: 1, foto: (S.real ? hojeISO() : '2026-11-05') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), original: 'pendente', prazo: addDays(S.hoje, 2), ciencia: true });
      if (S.real) { var at0 = S.atestados[0]; enviarArquivo(t.files[0], ME, 'atestados').then(function (a) { at0.arquivo = a.path; save(); render(); }, function (e) { toast('Não foi possível enviar a foto: ' + erroTxt(e)); }); }
      save(); render(); toast('Foto recebida. Entregue o original em papel ao RH até ' + dmy(addDays(S.hoje, 2)) + '.');
    }
    if (k === 'doc') {
      var a = admAtual(), d = a.docs[+t.dataset.i], antes = d.v; d.v = t.value.slice(0, 160);
      if (d.v.trim()) { d.st = 'ok'; d.por = S.role === 'contador' ? 'contador' : 'empresa'; } else { d.st = 'pendente'; d.por = ''; }
      a.hist.push(agora() + ' · ' + (S.role === 'contador' ? 'Contador' : 'Empresa') + ' alterou ' + d.n + (antes ? ' (antes: ' + antes + ')' : ''));
      if (a.conferida) { a.conferida = false; a.hist.push(agora() + ' · Conferência desfeita pela alteração; o contador precisa conferir de novo'); }
      save(); render();
    }
  }
  view.addEventListener('click', onClick);
  $('.side-foot').addEventListener('click', function (e) { if (e.target.closest('[data-act]')) onClick(e); });
  view.addEventListener('change', onInput);
  view.addEventListener('submit', onSubmit);
  view.addEventListener('input', function (e) { if (e.target.dataset.in === 'crit-km') { var o = e.target.previousElementSibling; if (o) o.innerHTML = 'Distância máxima: <strong>' + (+e.target.value) + ' km</strong>'; } });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('.docview')) fecharDoc(); else closeModal(); } });

  var btBranco = $('#em-branco'); if (btBranco) btBranco.addEventListener('click', function () { A['em-branco'](); });
  $('#role').addEventListener('change', function (e) { if (NUVEM) return; S.role = e.target.value; S.ui.recibo = null; save(); render(); toast('Agora você vê o sistema como ' + e.target.options[e.target.selectedIndex].text.toLowerCase() + '.'); });
  var gbt = $('#guia-btn'); if (gbt) gbt.addEventListener('click', function () { abrirGuia(); });
  var cob = $('#co-btn'), com = $('#co-menu');
  if (cob && com) {
    cob.addEventListener('click', function (e) { e.stopPropagation(); coMenuAbre(com.hidden); });
    com.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (b) { coMenuAbre(false); onClick(e); } });
  }
  $('#menu-btn').addEventListener('click', function (e) { e.stopPropagation(); mapaAbre(!$('#side').classList.contains('open')); });
  var sfe = $('#side-fechar'); if (sfe) sfe.addEventListener('click', function () { mapaAbre(false); $('#menu-btn').focus(); });
  doc.addEventListener('click', function (e) {
    if (com && !com.hidden && !e.target.closest('.co-wrap')) coMenuAbre(false);
    if ($('#side').classList.contains('open') && !e.target.closest('#side') && !e.target.closest('#menu-btn')) mapaAbre(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (com && !com.hidden) { coMenuAbre(false); cob.focus(); }
    if ($('#side').classList.contains('open')) { mapaAbre(false); $('#menu-btn').focus(); }
  });
  $('#reset').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ } var nome = S.empresa.nome, razao = S.empresa.razao, tp = S.tipo; S = novoExemplo(tp || 'padaria'); S.empresa.nome = nome; S.empresa.razao = razao; semearInteg(); save(); render(); toast('Dados de exemplo restaurados.'); });
  var dl = $('#q-list'); dl.innerHTML = S.pessoas.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('') + S.produtos.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('');
  $('#q').addEventListener('change', function (e) { var v = e.target.value.trim(); if (!v) return; S.ui.q = v.slice(0, 60); save(); if (location.hash === '#/busca') render(); else location.hash = '#/busca'; });
  window.addEventListener('hashchange', function () { pararCamera(); var o = $('.overlay'); if (o) o.remove(); fecharDoc(); render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  if (NUVEM) {
    $('#role').addEventListener('change', function (e) { if (!VINCULOS.length) return; var v = VINCULOS.filter(function (x) { return x.empresa_id === e.target.value; })[0]; if (v) { Nuvem.escolher(v); carregarNuvem(); } }, true);
    bootNuvem();
  } else render();
})();
