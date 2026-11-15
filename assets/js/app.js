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
  var S = load();

  /* ---------- utilidades ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sem armazenamento: usa o exemplo */ } return novoExemplo(KEY.split(':')[1] || 'padaria'); }
  function trocarTipo(tp) { try { localStorage.setItem(KEYTIPO, tp); } catch (e) { /* ignora */ } KEY = KEYBASE + ':' + tp; S = load(); }
  function novoExemplo(tipo) { var s = window.CENTRALIZAR_SEED ? window.CENTRALIZAR_SEED(tipo) : clone(SEED); s.role = 'empresa'; s.ui = {}; s.nsr = 4812; return s; }
  function demoAgora() { return S.agoraDemo || '10:40'; } // horário fixo da situação do ponto no exemplo
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function brl(v) { return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dmy(iso) { if (!iso) return ''; var p = iso.split(' '), d = p[0].split('-'); return d[2] + '/' + d[1] + (p[1] ? ' ' + p[1] : ''); }
  function dmyy(iso) { var d = iso.split('-'); return d[2] + '/' + d[1] + '/' + d[0]; }
  function agora() { var n = new Date(); return n.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + n.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function min(h) { if (!h) return null; var p = h.split(':'); return +p[0] * 60 + +p[1]; }
  function P(id) { return S.pessoas.filter(function (p) { return p.id === id; })[0]; }
  function first(n) { return n.split(' ')[0]; }
  function pill(cls, t) { return '<span class="pill ' + cls + '">' + esc(t) + '</span>'; }
  function can(r) { return r.split(' ').indexOf(S.role) > -1; }
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
      if (n || tp) { if (n) S.empresa.razao = n + (/ltda|me$|eireli|s\.?a\.?$/i.test(n) ? '' : ' Ltda'); save(); history.replaceState(null, '', location.pathname + location.hash); }
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
    var m = S.ponto[p.id] || ['', '', '', ''];
    var at = S.atestados.filter(function (a) { return a.pessoa === p.id && diffDays(a.inicio, S.hoje) >= 0 && diffDays(a.inicio, S.hoje) < a.dias; })[0];
    if (at) return ['mute', 'Atestado até ' + dmy(addDays(at.inicio, at.dias - 1))];
    if (!m[0]) return min(p.escala) > min(demoAgora()) ? ['mute', 'Entra às ' + p.escala] : ['bad', 'Ausente'];
    var atraso = min(m[0]) - min(p.escala);
    if (m[3]) return ['mute', 'Jornada encerrada'];
    if (atraso > 10) return ['warn', 'Atraso de ' + atraso + ' min'];
    return ['ok', 'Presente'];
  }

  /* ---------- moldura ---------- */
  var ROUTES = {
    inicio: { t: 'Início', r: 'empresa contador funcionario', f: vInicio },
    vagas: { t: 'Vagas e seleção', r: 'empresa', f: vVagas },
    admissoes: { t: 'Admissões', r: 'empresa contador', f: vAdmissoes },
    contratos: { t: 'Contratos', r: 'empresa contador', f: vContratos },
    ponto: { t: 'Ponto e jornada', r: 'empresa contador funcionario', f: vPonto },
    ocorrencias: { t: 'Atestados e advertências', r: 'empresa contador funcionario', f: vOcorrencias },
    checklists: { t: 'Checklists', r: 'empresa funcionario', f: vChecklists },
    holerites: { t: 'Holerites', r: 'empresa contador funcionario', f: vHolerites },
    vales: { t: 'Vales', r: 'empresa contador funcionario', f: vVales },
    estoque: { t: 'Estoque e etiquetas', r: 'empresa', f: vEstoque },
    compras: { t: 'Lista de compras', r: 'empresa funcionario', f: vCompras },
    selecao: { t: 'Processos seletivos', r: 'empresa', f: vSelecao },
    clientes: { t: 'Empresas clientes', r: 'empresa', f: vClientes },
    boas: { t: 'Boas práticas de alimentos', r: 'empresa funcionario', f: vBoas },
    cursos: { t: 'Mini cursos', r: 'empresa funcionario', f: vCursos },
    busca: { t: 'Busca', r: 'empresa contador funcionario', f: vBusca }
  };
  function route() { var h = location.hash.replace(/^#\/?/, '').split('?')[0]; return ROUTES[h] ? h : 'inicio'; }
  function render() {
    var r = route(), R = ROUTES[r];
    if (!can(R.r)) { location.hash = '#/inicio'; return; }
    view.innerHTML = '<div class="view">' + R.f() + '</div>';
    doc.title = R.t + ' · Seu Comando';
    $$('#nav a').forEach(function (a) {
      var ok = a.dataset.roles.split(' ').indexOf(S.role) > -1 && !(a.hasAttribute('data-food') && !S.bp) && !(a.hasAttribute('data-rs') && !S.agencia) && !(a.hasAttribute('data-nors') && S.agencia);
      a.hidden = !ok;
      if (a.getAttribute('href') === '#/' + r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('#nav [data-group]').forEach(function (g) { g.hidden = !$$('a', g).some(function (a) { return !a.hidden; }); });
    var counts = { adm: S.admissoes.filter(function (a) { return S.role === 'contador' ? passoAdm(a) === 3 : !a.aprovada; }).length, orig: originaisPendentes().length, hol: S.role === 'funcionario' ? 0 : S.pessoas.length - S.holerites.aprovados.length, cmp: S.role === 'empresa' ? S.compras.itens.length : 0 };
    $$('[data-count]').forEach(function (c) { var n = counts[c.dataset.count]; c.textContent = n || ''; c.hidden = !n; });
    $('#co-name').textContent = S.empresa.nome; $('#co-mark').textContent = S.empresa.nome.charAt(0).toUpperCase();
    $('#role').value = S.role;
    $('#side').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
    if (R.after) R.after();
    if (r === 'ponto') tickClock();
  }
  function titleRow(t, sub, actions) { return '<div class="title-row"><div><h1>' + esc(t) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions">' + (actions || '') + '</div></div>'; }

  /* ---------- Início ---------- */
  function vInicio() {
    if (S.role === 'funcionario') {
      var me = P(ME), h = holerite(ME), st = statusHolerite(ME), pend = valesDe(ME).filter(function (v) { return !v.assinado; });
      return titleRow(me.nome, esc(me.funcao) + ' · ' + esc(S.empresa.nome), '<a class="btn btn-primary" href="#/ponto">Bater ponto</a>') +
        '<div class="stack">' +
        '<div class="notice info"><div><strong>Atestado médico: entregue o original em papel</strong>A foto enviada pelo app só avisa a empresa da sua ausência. Para ter validade, o atestado original precisa ser entregue fisicamente ao RH em até 48 horas.</div></div>' +
        '<div class="card kpis"><div class="kpi"><div class="lbl">Entrada de hoje</div><div class="val num">' + esc((S.ponto[ME] || [])[0] || 'pendente') + '</div><div class="cap">escala às ' + esc(me.escala) + '</div></div>' +
        '<div class="kpi"><div class="lbl">Holerite de outubro</div><div class="val num">' + (st === 'liberado' ? 'R$ ' + brl(h.liq) : 'em aprovação') + '</div><div class="cap">' + (st === 'liberado' ? 'liberado pela empresa' : 'aparece aqui quando a empresa aprovar') + '</div></div>' +
        '<div class="kpi"><div class="lbl">Vales para assinar</div><div class="val num">' + pend.length + '</div><div class="cap">' + (pend.length ? '<a href="#/vales">assinar agora</a>' : 'nada pendente') + '</div></div>' +
        '<div class="kpi"><div class="lbl">Checklist de hoje</div><div class="val num">Abertura</div><div class="cap"><a href="#/checklists">ver itens</a></div></div></div></div>';
    }
    var pend = [];
    originaisPendentes().forEach(function (a) { var venc = diffDays(S.hoje, a.prazo) < 0; pend.push([venc ? pill('bad', 'Vencido') : pill('warn', 'Até ' + dmy(a.prazo)), 'Atestado original de ' + P(a.pessoa).nome, 'Foto recebida em ' + dmy(a.foto) + '; falta o papel', '#/ocorrencias', 'Registrar entrega']); });
    S.vales.filter(function (v) { return !v.assinado; }).forEach(function (v) { pend.push([pill('warn', 'Sem assinatura'), 'Vale de R$ ' + brl(v.valor) + ' · ' + P(v.pessoa).nome, 'Não pode ser descontado sem autorização escrita', '#/vales', 'Ver vale']); });
    S.admissoes.forEach(function (a) { var f = a.docs.filter(function (d) { return d.st !== 'ok'; }).length, n = passoAdm(a); if (n === 5) return; pend.push(n === 2 ? [pill('warn', f + ' documento(s)'), 'Admissão de ' + a.nome, 'Aguardando documentos · início em ' + dmy(a.inicio), '#/admissoes', 'Abrir'] : n === 3 ? [pill('mute', 'Com o contador'), 'Admissão de ' + a.nome, 'Documentos completos, em conferência', '#/admissoes', 'Abrir'] : [pill('warn', 'Falta seu ok'), 'Admissão de ' + a.nome, 'Conferida pelo contador', '#/admissoes', 'Dar o ok']); });
    S.checklists.forEach(function (c) { var f = c.itens.filter(function (i) { return i.foto && !i.fotoEm; }).length; if (f) pend.push([pill('mute', f + ' foto(s)'), c.nome + ' · ' + c.setor, 'Responsável: ' + P(c.resp).nome, '#/checklists', 'Ver checklist']); });
    var falta = sugestaoCompra().length;
    if (falta) pend.push([pill('bad', falta + ' item(ns)'), 'Abaixo do estoque mínimo', 'Ainda fora da lista de compras', '#/estoque', 'Ver estoque']);
    if (S.compras.itens.length) pend.push([pill('mute', S.compras.itens.length + ' na lista'), 'Lista de compras', 'Estimativa de R$ ' + brl(totalCompras()), '#/compras', 'Abrir lista']);
    var aguard = S.pessoas.length - S.holerites.aprovados.length, fa = faltasAbertas();
    var presentes = S.pessoas.filter(function (p) { var s = situacaoPonto(p)[1]; return s === 'Presente' || s.indexOf('Atraso') === 0; }).length;
    var rows = pend.slice(0, 12).map(function (x) { return '<tr><td>' + esc(x[1]) + '<span class="sub">' + esc(x[2]) + '</span></td><td>' + x[0] + '</td><td class="num"><a class="btn btn-sm" href="' + x[3] + '">' + esc(x[4]) + '</a></td></tr>'; }).join('');
    var pontoRail = S.pessoas.map(function (p) { var s = situacaoPonto(p); return s[0] === 'ok' ? '' : '<li><span>' + esc(p.nome) + '<span class="sub">' + esc(p.funcao) + '</span></span>' + pill(s[0], s[1]) + '</li>'; }).join('');
    var validade = S.produtos.filter(function (p) { return diffDays(S.hoje, p.validade) <= 3; }).map(function (p) { return '<li><span>' + esc(p.nome) + '<span class="sub">lote ' + esc(p.lote) + '</span></span>' + pill('warn', 'vence ' + dmy(p.validade)) + '</li>'; }).join('');
    var act = S.role === 'empresa' ? '<a class="btn btn-primary" href="#/holerites">Aprovar holerites de outubro</a>' : '<a class="btn btn-primary" href="#/holerites">Lançar holerites</a>';
    return titleRow(S.empresa.nome, 'Quinta-feira, 5 de novembro de 2026' + (S.role === 'contador' ? ' · você está vendo como contador' : ''), act) +
      '<div class="grid-main"><div class="stack">' +
      '<div class="card kpis">' +
      '<div class="kpi"><div class="lbl">Pessoas ativas</div><div class="val num">' + S.pessoas.length + '</div><div class="cap">' + S.admissoes.length + ' admissões em andamento</div></div>' +
      '<div class="kpi"><div class="lbl">No trabalho agora</div><div class="val num">' + presentes + '</div><div class="cap">pelo ponto das ' + demoAgora() + '</div></div>' +
      '<div class="kpi"><div class="lbl">Holerites de outubro</div><div class="val num">' + aguard + '</div><div class="cap">aguardando aprovação</div></div>' +
      '<div class="kpi"><div class="lbl">Faltas não abonadas</div><div class="val num">' + fa.length + '</div><div class="cap">outubro, antes de fechar a folha</div></div></div>' +
      '<div class="card"><div class="card-head"><h2>Pendências da semana</h2><span class="pill mute">' + pend.length + ' no total</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>O que falta</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '</div><div class="stack"><div><h2 class="sec">Ponto agora</h2><div class="card"><ul class="list">' + pontoRail + '</ul></div></div>' +
      '<div><h2 class="sec">Validade nos próximos 3 dias</h2><div class="card"><ul class="list">' + (validade || '<li>Nada vencendo.</li>') + '</ul></div><a class="btn btn-sm" href="#/estoque">Ver estoque</a></div></div></div>';
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
    if (c.etapa === 'entrevista') return pill('warn', 'Entrevista ' + c.entrevistaEm) + ' <button type="button" class="btn btn-sm btn-primary" data-act="ent-ok" data-i="' + i + '">Aprovar</button> <button type="button" class="btn btn-sm" data-act="ent-nao" data-i="' + i + '">Não aprovar</button>';
    if (c.etapa === 'aprovado') return pill('ok', 'Aprovado na entrevista') + (c.contato ? ' <button type="button" class="btn btn-sm btn-primary" data-act="docs-modal" data-i="' + i + '">Enviar link de documentos</button>' : '<span class="sub">Sem WhatsApp: envie o link por outro meio</span>');
    if (c.etapa === 'docs') return pill('ok', 'Em admissão') + ' <a class="btn btn-sm" href="#/admissoes">Ver</a>';
    if (c.etapa === 'reprovado') return pill('mute', 'Não aprovado na entrevista');
    if (m) return '<span class="ui-sub">Descartado na triagem</span>';
    return '<button type="button" class="btn btn-sm btn-primary" data-act="ent-modal" data-i="' + i + '">Chamar para entrevista</button>';
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
    return titleRow('Vagas e seleção', esc(g.titulo) + ' · ' + esc(g.regimeOferta), '<a class="btn" href="triagem.html?vaga=' + esc(g.id) + '&amp;t=' + esc(S.tipo || '') + '" target="_blank" rel="noopener">Ver como o candidato responde</a><button type="button" class="btn btn-primary" data-act="copiar-link">Copiar link da pré-entrevista</button>') +
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
  function admAtual() { var id = S.ui.adm || S.admissoes[0].id; return S.admissoes.filter(function (a) { return a.id === id; })[0]; }
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
  function marcaDagua() { return S.plano === 'assinante' ? '' : '<div class="wm" aria-hidden="true"><span>SEU COMANDO · VERSÃO DE AVALIAÇÃO</span><span>SEU COMANDO · VERSÃO DE AVALIAÇÃO</span><span>SEU COMANDO · VERSÃO DE AVALIAÇÃO</span></div>'; }
  function contratoAtualHTML() {
    var ct = ctEstado(), ps = pessoasContrato(), pessoa = ps.filter(function (x) { return x.id === ct.alvo; })[0] || ps[0], cargo = cargoPor(ct.cargo);
    var t = TPL.filter(function (x) { return x.id === ct.modelo; })[0];
    var corpo = (ct.modelo === 'experiencia' || ct.modelo === 'indeterminado') ? contratoExperiencia(ct, pessoa, cargo) : contratoModelo(t, pessoa, cargo, ct);
    return { pessoa: pessoa, cargo: cargo, ct: ct, corpo: corpo };
  }
  function vContratos() {
    var x = contratoAtualHTML(), ct = x.ct, pessoa = x.pessoa, cargo = x.cargo, ver = verificacao(ct, pessoa, cargo);
    var bloqueio = ver.some(function (i) { return i[0] === 'bad'; }), conferido = CHECKS.every(function (c) { return ct.checks[c[0]]; });
    var setores = []; CARGOS.forEach(function (c) { if (setores.indexOf(c.setor) < 0) setores.push(c.setor); });
    var optCargo = setores.map(function (s) { return '<optgroup label="' + esc(s) + '">' + CARGOS.filter(function (c) { return c.setor === s; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === cargo.id ? ' selected' : '') + '>' + esc(c.cargo) + ' · CBO ' + esc(c.cbo) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    var optPessoa = pessoasContrato().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === pessoa.id ? ' selected' : '') + '>' + esc(p.tipo === 'novo' ? 'Novo empregado (preencher depois)' : p.nome + (p.tipo === 'admissao' ? ' · em admissão' : ' · já empregado')) + '</option>'; }).join('');
    var opt = function (obj, cur) { return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (String(cur) === k ? ' selected' : '') + '>' + esc(Array.isArray(obj[k]) ? obj[k][0] : obj[k]) + '</option>'; }).join(''); };
    var modelos = TPL.map(function (m) { return '<option value="' + m.id + '"' + (m.id === ct.modelo ? ' selected' : '') + '>' + esc(m.nome) + '</option>'; }).join('');
    var exp = ct.modelo === 'experiencia';
    var form = '<div class="card card-pad stack"><h2 class="sec">Enquadramento</h2>' +
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
    var extras = '<div class="card card-pad stack" id="ct-extras"><h2 class="sec">Cláusulas adicionais</h2><p class="ui-sub">Inclua cláusulas prontas ou escreva as suas. Elas entram numeradas antes das disposições finais e passam pela verificação.</p>' +
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
    var verif = '<div class="card card-pad stack"><h2 class="sec">Verificação do contrato</h2>' + ver.map(function (i) { return '<div class="notice ' + (i[0] === 'bad' ? 'bad' : i[0] === 'ok' || i[0] === 'info' ? 'info' : '') + '"><div>' + i[1] + '</div></div>'; }).join('') +
      CHECKS.map(function (c) { return '<label class="check"><input type="checkbox" data-in="ct-check" data-k="' + c[0] + '"' + (ct.checks[c[0]] ? ' checked' : '') + '> ' + esc(c[1]) + '</label>'; }).join('') + '</div>';
    var plano = '<div class="seg" role="group" aria-label="Plano"><button type="button" data-act="plano" data-v="avaliacao" aria-pressed="' + (S.plano !== 'assinante') + '">Avaliação gratuita</button><button type="button" data-act="plano" data-v="assinante" aria-pressed="' + (S.plano === 'assinante') + '">Assinante</button></div>';
    var btn = '<button type="button" class="btn btn-primary" data-act="ct-pdf"' + (conferido && !bloqueio ? '' : ' disabled') + '>' + (bloqueio ? 'Corrija os pontos em vermelho' : conferido ? 'Exportar PDF' : 'Marque a verificação para exportar') + '</button>';
    return titleRow('Contratos', 'Escolha o enquadramento, verifique e exporte · ' + (S.plano === 'assinante' ? 'PDF sem marca d\'água' : 'no plano de avaliação o PDF sai com marca d\'água'), plano + btn) +
      '<div class="doc-wrap ct-wrap"><div class="stack">' + form + extras + verif + pontos + '</div>' +
      '<article class="paper" id="paper">' + marcaDagua() + '<div class="notice sugestao"><div><strong>Sugestão de cláusulas, não é parecer jurídico</strong>Clique em qualquer cláusula para editar antes de exportar. Revise com seu advogado ou contador.</div></div>' + x.corpo + '</article></div>';
  }

  /* ---------- Recrutamento e seleção (agência) e integração com as empresas clientes ---------- */
  function integ() { try { var r = JSON.parse(localStorage.getItem(KEYINT) || 'null'); if (r && Array.isArray(r.envios)) return r; } catch (e) { /* sem armazenamento */ } return { envios: [] }; }
  function salvaInteg(x) { try { localStorage.setItem(KEYINT, JSON.stringify(x)); } catch (e) { /* ignora */ } }
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
    return '<button type="button" class="btn btn-sm btn-primary" data-act="ent-modal" data-i="' + i + '">Chamar para entrevista</button>';
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
    var link = 'triagem.html?vaga=' + esc(g.id) + '&amp;t=' + esc(S.tipo || '');
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
        (k.integ === 'centralizar' ? '<a class="btn btn-sm" href="app.html?empresa=' + encodeURIComponent(k.nome) + '&amp;tipo=' + esc(tipoDoCodigo(k.codigo)) + '#/vagas">Abrir o painel do cliente (exemplo)</a>' : '') + '</li>';
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
    var topo = titleRow('Boas práticas de alimentos', (emp ? 'Adicional · R$ 49 por mês · ' : '') + 'RDC Anvisa 216/2004', acoes);
    if (!bp.ativo) return topo + '<div class="card card-pad stack"><h2 class="sec">Adicional para serviços de alimentação</h2><p>Planilha de temperaturas, prazos da vigilância sanitária e mini cursos com certificado para a equipe.</p><div><button type="button" class="btn btn-primary" data-act="bp-ativo">Ativar teste de 14 dias</button></div></div>';
    var opts = bp.equip.map(function (e) { return '<option value="' + e.id + '">' + esc(e.nome) + ' · ' + esc((LIMT[e.tipo] || LIMT.frio).r) + '</option>'; }).join('');
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
    var cursos = '<div class="card card-pad stack"><h2 class="sec">Capacitação da equipe</h2><p class="ui-sub">A RDC 216 exige que os manipuladores sejam capacitados periodicamente em higiene pessoal, manipulação higiênica e doenças transmitidas por alimentos, com comprovação documental (item 4.6.7).</p>' +
      (emp ? '<p><strong>' + trein + ' de ' + mani.length + '</strong> manipuladores com os três cursos básicos em dia.</p>' : '') + '<a class="btn" href="#/cursos">' + (emp ? 'Abrir mini cursos' : 'Fazer meus cursos') + '</a></div>';
    var kpis = emp ? '<div class="card kpis">' + kpi('Temperaturas hoje', hoje.length, fora ? fora + ' fora da faixa' : 'todas na faixa') + kpi('Prazos sanitários', docsAlerta, docsAlerta ? 'vencendo ou vencidos' : 'tudo em dia') + kpi('Equipe treinada', trein + '/' + mani.length, 'cursos básicos em dia') + kpi('Validade', vencendo.length, 'produtos em até 2 dias') + '</div>' : '';
    return topo + kpis + '<div class="grid-main"><div class="stack">' + form + docs + '</div><div class="stack">' + cursos + regras + val + '</div></div>';
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
    var lista = CURSOS().map(function (k) {
      var t = !emp && treino(ME, k.id), base = (window.CENTRALIZAR_CURSOS_BASE || []).indexOf(k.id) > -1;
      return '<li><span><strong>' + esc(k.titulo) + '</strong>' + (base ? ' ' + pill('mute', 'Básico') : '') + '<span class="sub">' + k.min + ' min · ' + k.aulas.length + ' aulas e teste · ' + esc(k.base) + '</span></span><span class="actions">' +
        (t ? (t.vencido ? pill('warn', 'Refazer') : pill('ok', 'Feito em ' + dmy(t.em))) + ' <button type="button" class="btn btn-sm" data-act="cert" data-p="' + ME + '" data-c="' + k.id + '">Certificado</button>' : '') +
        '<button type="button" class="btn btn-sm' + (t ? '' : ' btn-primary') + '" data-act="curso-abrir" data-c="' + k.id + '">' + (emp ? 'Ver como o funcionário' : t ? 'Refazer' : 'Começar') + '</button></span></li>';
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

  /* ---------- Ponto ---------- */
  var METODO = { celular: 'Celular autorizado', 'fixo-rosto': 'Aparelho fixo · rosto', 'fixo-digital': 'Aparelho fixo · digital' };
  function vPonto() {
    var func = S.role === 'funcionario';
    var quem = func ? P(ME) : P(S.ui.pontoPessoa || 'e3');
    var metodo = S.ui.metodo || (quem.celular ? 'celular' : 'fixo');
    var bloqueado = metodo === 'celular' && !quem.celular;
    var opts = S.pessoas.map(function (p) { return '<option value="' + p.id + '"' + (p.id === quem.id ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('');
    var m = S.ponto[quem.id] || ['', '', '', ''], prox = m.indexOf(''), nomes = ['entrada', 'saída para o intervalo', 'volta do intervalo', 'saída'];
    var painel = '<div class="card card-pad stack"><h2 class="sec">' + (func ? 'Bater ponto' : 'Bater ponto (aparelho da loja)') + '</h2>' +
      (func ? '' : '<div class="field"><label for="pp">Quem vai marcar</label><select id="pp" data-in="ponto-pessoa">' + opts + '</select></div>') +
      '<div class="clock num" id="clock" aria-live="off">--:--</div>' +
      '<div class="seg"><button type="button" data-act="metodo" data-v="celular" aria-pressed="' + (metodo === 'celular') + '">Celular</button><button type="button" data-act="metodo" data-v="fixo" aria-pressed="' + (metodo === 'fixo') + '">Aparelho fixo</button></div>' +
      (bloqueado ? '<div class="notice"><div><strong>Celular não autorizado para ' + esc(first(quem.nome)) + '</strong>A empresa só liberou o aparelho fixo, com rosto ou digital.</div></div>' :
        '<div class="face' + (S.ui.faceOk ? ' ok' : '') + '" id="face">' + (S.ui.faceOk ? 'Rosto confere' : 'Validação ' + (metodo === 'celular' ? 'facial pela câmera' : 'por rosto ou digital no leitor externo')) + '</div>' +
        '<div class="actions"><button type="button" class="btn" data-act="face">' + (metodo === 'celular' ? 'Validar rosto' : 'Ler rosto ou digital') + '</button><button type="button" class="btn btn-primary" data-act="marcar"' + (S.ui.faceOk && prox > -1 ? '' : ' disabled') + '>' + (prox > -1 ? 'Registrar ' + nomes[prox] : 'Jornada completa') + '</button></div>') +
      (S.ui.recibo ? '<div class="receipt num"><strong>Comprovante de registro de ponto</strong><br>NSR ' + esc(S.ui.recibo.nsr) + ' · ' + esc(S.ui.recibo.quando) + '<br>' + esc(S.empresa.razao) + ' · CNPJ ' + esc(S.empresa.cnpj) + '<br>' + esc(S.ui.recibo.nome) + ' · CPF ' + esc(S.ui.recibo.cpf) + '<br>' + esc(S.ui.recibo.tipo) + ' · ' + esc(S.ui.recibo.metodo) + '<br>Programa registrado no INPI nº [a registrar]</div>' : '') +
      '<p class="ui-sub">Ponto por programa (REP-P) segundo a Portaria MTP 671/2021. A imagem do rosto não é guardada; só o resultado da conferência.</p></div>';
    if (func) {
      var hist = ['Entrada', 'Saída intervalo', 'Volta', 'Saída'].map(function (n, i) { return '<li><span>' + n + '</span><span class="num">' + esc(m[i] || '·') + '</span></li>'; }).join('');
      return titleRow('Ponto', 'Escala de hoje: entrada às ' + esc(quem.escala)) + '<div class="grid-2">' + painel + '<div><h2 class="sec">Suas marcações de hoje</h2><div class="card"><ul class="list">' + hist + '</ul></div></div></div>';
    }
    var rows = S.pessoas.map(function (p) {
      var mk = S.ponto[p.id] || ['', '', '', ''], s = situacaoPonto(p);
      return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.setor) + '</span></td><td class="num">' + esc(p.escala) + '</td>' + mk.map(function (x) { return '<td class="num hide-sm">' + esc(x || '·') + '</td>'; }).join('') + '<td class="hide-sm">' + esc(METODO[S.marcacoesMetodo[p.id]] || '·') + '</td><td>' + pill(s[0], s[1]) + '</td></tr>';
    }).join('');
    var aut = S.pessoas.map(function (p) { return '<li><label class="check"><input type="checkbox" data-in="aut" data-id="' + p.id + '"' + (p.celular ? ' checked' : '') + (S.role === 'empresa' ? '' : ' disabled') + '> ' + esc(p.nome) + '</label><span class="sub">' + (p.celular ? 'celular ou fixo' : 'só fixo') + '</span></li>'; }).join('');
    return titleRow('Ponto e jornada', 'Quinta-feira, 05/11 · situação às ' + demoAgora() + ' · tolerância de 10 minutos por dia (CLT, art. 58, § 1º)', '<button type="button" class="btn" data-act="export-afd">Exportar arquivo para a fiscalização (AFD)</button>') +
      '<div class="grid-main"><div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th class="num">Escala</th><th class="num hide-sm">Entrada</th><th class="num hide-sm">Intervalo</th><th class="num hide-sm">Volta</th><th class="num hide-sm">Saída</th><th class="hide-sm">Como marcou</th><th>Situação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="stack">' + painel + '<div><h2 class="sec">Quem pode marcar pelo celular</h2><div class="card"><ul class="list">' + aut + '</ul></div></div></div></div>';
  }
  var clockTimer;
  function tickClock() { clearInterval(clockTimer); var f = function () { var c = $('#clock'); if (!c) { clearInterval(clockTimer); return; } c.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }; f(); clockTimer = setInterval(f, 1000); }

  /* ---------- Atestados e advertências ---------- */
  function vOcorrencias() {
    var tab = S.ui.oc || 'atestados', func = S.role === 'funcionario';
    var tabs = '<div class="tabs" role="tablist"><button type="button" role="tab" data-act="oc" data-v="atestados" aria-selected="' + (tab === 'atestados') + '">Atestados</button><button type="button" role="tab" data-act="oc" data-v="advertencias" aria-selected="' + (tab === 'advertencias') + '">Advertências</button></div>';
    var aviso = '<div class="notice"><div><strong>O atestado só vale com o original em papel</strong>A foto enviada pelo app serve para a empresa saber da ausência na hora. O funcionário precisa entregar o atestado original fisicamente ao RH em até 48 horas; até lá, a falta fica como não abonada.</div></div>';
    if (tab === 'atestados') {
      var lista = S.atestados.filter(function (a) { return !func || a.pessoa === ME; });
      var rows = lista.map(function (a) {
        var p = P(a.pessoa), venc = a.original !== 'entregue' && diffDays(S.hoje, a.prazo) < 0;
        var orig = a.original === 'entregue' ? pill('ok', 'Entregue em ' + dmy(a.entregueEm)) : venc ? pill('bad', 'Vencido em ' + dmy(a.prazo)) : pill('warn', 'Entregar até ' + dmy(a.prazo));
        var acao = S.role === 'empresa' && a.original !== 'entregue' ? '<button type="button" class="btn btn-sm" data-act="orig" data-id="' + a.id + '">Registrar entrega</button>' : '';
        return '<tr><td><strong>' + esc(p.nome) + '</strong><span class="sub">' + esc(p.funcao) + '</span></td><td class="num">' + dmy(a.inicio) + ' · ' + a.dias + (a.dias > 1 ? ' dias' : ' dia') + '</td><td class="hide-sm">Foto em ' + esc(dmy(a.foto)) + '</td><td>' + orig + '</td><td class="num">' + acao + '</td></tr>';
      }).join('');
      return titleRow('Atestados e advertências', func ? 'Seus atestados' : 'Ciência imediata pela foto, validade com o original', func ? '<span class="btn btn-primary file-btn">Enviar foto do atestado<input type="file" accept="image/*" capture="environment" data-in="novo-atestado" aria-label="Enviar foto do atestado"></span>' : '') + tabs + '<div class="stack">' + aviso +
        '<div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th>Pessoa</th><th class="num">Período</th><th class="hide-sm">Ciência</th><th>Original físico</th><th class="num">Ação</th></tr></thead><tbody>' + (rows || '<tr><td>Nenhum atestado.</td></tr>') + '</tbody></table></div></div>' +
        '<p class="ui-sub">O diagnóstico (CID) só consta do atestado a pedido do paciente (Resolução CFM 1.658/2002, art. 5º). O Seu Comando não pede esse campo.</p></div>';
    }
    var adv = S.advertencias.filter(function (w) { return !func || w.pessoa === ME; });
    var rowsW = adv.map(function (w) {
      var c = w.ciencia === 'app' ? pill('ok', 'Ciência no app ' + dmy(w.cienciaEm)) : w.ciencia === 'recusa' ? pill('warn', 'Recusou · testemunhas') : pill('warn', 'Aguardando ciência');
      var acao = func && w.ciencia === 'pendente' ? '<button type="button" class="btn btn-sm btn-primary" data-act="ciencia" data-id="' + w.id + '">Dar ciência</button>' : (S.role === 'empresa' && w.ciencia === 'pendente' ? '<button type="button" class="btn btn-sm" data-act="recusa" data-id="' + w.id + '">Registrar recusa</button>' : '');
      return '<tr><td><strong>' + esc(P(w.pessoa).nome) + '</strong><span class="sub">' + esc(dmy(w.data)) + '</span></td><td>' + esc(w.motivo) + (w.testemunhas ? '<span class="sub">Testemunhas: ' + esc(w.testemunhas) + '</span>' : '') + '</td><td>' + c + '</td><td class="num">' + acao + '</td></tr>';
    }).join('');
    return titleRow('Atestados e advertências', 'Advertência com ciência pelo app ou recusa com duas testemunhas', S.role === 'empresa' ? '<button type="button" class="btn btn-primary" data-act="nova-adv">Nova advertência</button>' : '') + tabs +
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
    var comp = 'outubro de 2026';
    if (S.role === 'funcionario') {
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
      '<div class="stack">' + (fa.length ? '<div class="notice bad"><div><strong>' + fa.length + ' falta(s) sem abono em outubro</strong>' + esc(faltasTxt) + '. Confira antes de aprovar: falta sem atestado desconta o dia e o DSR da semana (Lei 605/49, art. 6º). <a href="#/ocorrencias">Ver atestados</a></div></div>' : '') +
      '<div class="card"><div class="card-head"><h2>Contador lança, empresa aprova, funcionário recebe</h2><span class="pill ' + (lib === S.pessoas.length ? 'ok' : 'warn') + '">' + lib + ' de ' + S.pessoas.length + ' liberados</span></div><div class="table-box"><table class="t stack-sm"><thead><tr>' + (empresa ? '<th><span class="sr-only">Selecionar</span></th>' : '') + '<th>Pessoa</th><th class="num hide-sm">Proventos</th><th class="num hide-sm">Descontos</th><th class="num">Líquido (R$)</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
  }

  /* ---------- Checklists ---------- */
  var FOTO = { todos: 'Foto em todos os itens', parcial: 'Só nos itens marcados', nenhum: 'Sem foto' };
  function vChecklists() {
    var func = S.role === 'funcionario', c = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0];
    var tabs = S.checklists.map(function (x) { return '<button type="button" role="tab" data-act="ck" data-id="' + x.id + '" aria-selected="' + (x.id === c.id) + '">' + esc(x.setor) + '</button>'; }).join('');
    var feitos = c.itens.filter(function (i) { return i.feito; }).length, fotosReq = c.itens.filter(function (i) { return i.foto; }).length, fotos = c.itens.filter(function (i) { return i.foto && i.fotoEm; }).length;
    var itens = c.itens.map(function (it, i) {
      var foto = it.foto ? (it.fotoEm ? (it.thumb ? '<img src="' + esc(it.thumb) + '" alt="Foto do item">' : '') + pill('ok', 'foto ' + it.fotoEm) : '<span class="btn btn-sm file-btn">Enviar foto<input type="file" accept="image/*" capture="environment" data-in="ck-foto" data-i="' + i + '" aria-label="Enviar foto: ' + esc(it.t) + '"></span>') : pill('mute', 'sem foto');
      var cfg = !func && c.foto === 'parcial' ? '<label class="check ui-sub"><input type="checkbox" data-in="ck-req" data-i="' + i + '"' + (it.foto ? ' checked' : '') + '> exige foto</label>' : '';
      return '<div class="ck-item"><input type="checkbox" aria-label="Feito: ' + esc(it.t) + '" data-in="ck-feito" data-i="' + i + '"' + (it.feito ? ' checked' : '') + '><div>' + esc(it.t) + (cfg ? '<div>' + cfg + '</div>' : '') + '</div><div class="photo">' + foto + '</div></div>';
    }).join('');
    var regra = func ? '' : '<div class="field"><span class="lbl-s">Fotos de cumprimento</span><div class="seg">' + Object.keys(FOTO).map(function (k) { return '<button type="button" data-act="ck-regra" data-v="' + k + '" aria-pressed="' + (c.foto === k) + '">' + FOTO[k] + '</button>'; }).join('') + '</div></div>';
    return titleRow('Checklists', 'Rotinas por setor e por pessoa, com foto do que foi feito') + '<div class="tabs" role="tablist">' + tabs + '</div>' +
      '<div class="grid-main"><div class="card"><div class="card-head"><h2>' + esc(c.nome) + ' · ' + esc(c.hora) + '</h2><span class="ui-sub">' + esc(P(c.resp).nome) + '</span></div>' + itens +
      (func ? '' : '<form class="ck-item" data-form="ck-novo"><span></span><div class="field"><label class="sr-only" for="novo-item">Novo item</label><input id="novo-item" name="t" maxlength="90" placeholder="Novo item do checklist" required></div><button class="btn btn-sm" type="submit">Adicionar</button></form>') + '</div>' +
      '<div class="stack"><div class="card card-pad stack"><h2 class="sec">Andamento</h2><div><div class="num"><strong>' + feitos + ' de ' + c.itens.length + '</strong> itens feitos</div><progress max="' + c.itens.length + '" value="' + feitos + '">' + feitos + '</progress></div><div><div class="num"><strong>' + fotos + ' de ' + fotosReq + '</strong> fotos enviadas</div><progress max="' + (fotosReq || 1) + '" value="' + fotos + '">' + fotos + '</progress></div>' + regra + '</div></div></div>';
  }

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
    return titleRow('Estoque e etiquetas', S.produtos.filter(function (p) { return p.qtd < p.min; }).length + ' produtos abaixo do mínimo', '<button type="button" class="btn btn-primary" data-act="cmp-ir">' + (nSug ? 'Pôr ' + nSug + ' na lista de compras' : 'Ver lista de compras') + '</button>') +
      '<div class="stack"><div class="card"><div class="table-box"><table class="t stack-sm"><thead><tr><th><span class="sr-only">Etiqueta</span></th><th>Produto</th><th class="hide-sm">Validade</th><th class="num">Quantidade</th><th class="num hide-sm">Mínimo</th><th>Estoque</th><th class="num hide-sm">Preço (R$)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + prev + '</div>';
  }

  /* ---------- Vales ---------- */
  function vVales() {
    var func = S.role === 'funcionario';
    var lista = S.vales.filter(function (v) { return !func || v.pessoa === ME; }).slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; });
    var rows = lista.map(function (v) {
      var aut = v.assinado ? pill('ok', 'Assinado ' + dmy(v.assinado)) : pill('warn', 'Aguardando assinatura');
      var folha = v.assinado ? (v.comp === '2026-10' ? 'Folha de outubro' : 'Folha de novembro') : 'Bloqueado até assinar';
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
    var emp = S.role === 'empresa', itens = S.compras.itens, nSug = sugestaoCompra().length, marcados = itens.filter(function (i) { return i.comprado; }).length;
    var producao = S.produtos.filter(function (p) { return p.qtd < p.min && p.fornecedor === 'Produção própria'; }), semCusto = itens.filter(function (i) { return !i.custo; }).length;
    var grupos = fornecedores().map(function (f) {
      var it = itens.filter(function (i) { return i.fornecedor === f; });
      var rows = it.map(function (i) {
        return '<tr>' + (emp ? '<td><input type="checkbox" aria-label="Comprado: ' + esc(i.nome) + '" data-in="cmp-ok" data-id="' + esc(i.id) + '"' + (i.comprado ? ' checked' : '') + '></td>' : '') +
          '<td><strong>' + esc(i.nome) + '</strong><span class="sub">' + esc(origemTxt(i)) + '</span></td>' +
          '<td class="num">' + (emp ? '<input class="num qtd-in" type="number" min="0.5" max="9999" step="0.5" value="' + esc(i.qtd) + '" aria-label="Quantidade de ' + esc(i.nome) + '" data-in="cmp-qtd" data-id="' + esc(i.id) + '"> ' : esc(String(i.qtd).replace('.', ',')) + ' ') + esc(i.un) + '</td>' +
          '<td class="num hide-sm">' + (i.custo ? brl(i.custo) : '·') + '</td><td class="num">' + (i.custo ? brl(i.qtd * i.custo) : 'a cotar') + '</td>' +
          (emp ? '<td class="num"><button type="button" class="btn btn-sm" data-act="cmp-del" data-id="' + esc(i.id) + '" aria-label="Tirar ' + esc(i.nome) + ' da lista">Tirar</button></td>' : '') + '</tr>';
      }).join('');
      var wa = 'https://wa.me/?text=' + encodeURIComponent(waTexto(f));
      return '<div class="card"><div class="card-head"><h2>' + esc(f) + '</h2><span class="actions"><span class="ui-sub num">R$ ' + brl(totalCompras(it)) + '</span>' + (emp ? '<a class="btn btn-sm" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">Enviar pedido no WhatsApp</a>' : '') + '</span></div>' +
        '<div class="table-box"><table class="t stack-sm"><thead><tr>' + (emp ? '<th><span class="sr-only">Comprado</span></th>' : '') + '<th>Item</th><th class="num">Quantidade</th><th class="num hide-sm">Custo un. (R$)</th><th class="num">Subtotal (R$)</th>' + (emp ? '<th><span class="sr-only">Ação</span></th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('');
    var opts = ['Distribuidora Criciúma', 'Embalagens Sul', 'Granja Rio Maina', 'Laticínios Serra Verde', 'Moinho Sul', 'Mercado (compra avulsa)'].map(function (f) { return '<option>' + esc(f) + '</option>'; }).join('');
    var form = '<div class="card card-pad"><h2 class="sec">' + (emp ? 'Adicionar item' : 'Pedir um item para a compra') + '</h2><form class="form-grid" data-form="cmp-novo"><div class="field"><label for="cn">Item</label><input id="cn" name="n" maxlength="60" required placeholder="Ex.: guardanapo"></div><div class="field"><label for="cf">Fornecedor</label><select id="cf" name="f">' + opts + '</select></div><div class="field"><label for="cq">Quantidade</label><input id="cq" name="q" type="number" min="0.5" max="9999" step="0.5" value="1" required></div><div class="field"><label for="cu">Unidade</label><input id="cu" name="u" maxlength="10" value="un" required></div>' +
      (emp ? '<div class="field"><label for="cc">Custo unitário (R$, opcional)</label><input id="cc" name="c" type="number" min="0" max="99999" step="0.01"></div>' : '') + '<div class="field"><span class="lbl-s">&nbsp;</span><button class="btn btn-primary" type="submit">' + (emp ? 'Adicionar' : 'Enviar pedido') + '</button></div></form></div>';
    var resumo = '<div class="card card-pad stack"><h2 class="sec">Como a lista funciona</h2><ul class="list"><li>1. O sistema sugere o que está abaixo do mínimo, já com a quantidade para voltar ao estoque ideal.</li><li>2. A equipe pede pelo app o que falta e não tem cadastro.</li><li>3. Você envia o pedido de cada fornecedor pelo WhatsApp ou imprime.</li><li>4. Quando a mercadoria chega, marque e clique em “Receber no estoque”: as quantidades sobem sozinhas.</li></ul>' +
      '<div><div class="lbl-s">Total estimado</div><div class="clock num">R$ ' + brl(totalCompras()) + '</div>' + (semCusto ? '<p class="ui-sub">' + semCusto + ' item(ns) sem custo cadastrado, a cotar com o fornecedor.</p>' : '') + '</div></div>';
    return titleRow('Lista de compras', itens.length + ' itens de ' + fornecedores().length + ' fornecedores', emp ? '<button type="button" class="btn" data-act="cmp-gerar"' + (nSug ? '' : ' disabled') + '>' + (nSug ? 'Sugerir ' + nSug + ' do estoque' : 'Estoque em dia') + '</button><button type="button" class="btn" data-act="cmp-print"' + (itens.length ? '' : ' disabled') + '>Imprimir ou PDF</button><button type="button" class="btn btn-primary" data-act="cmp-receber"' + (marcados ? '' : ' disabled') + '>Receber ' + (marcados || '') + ' no estoque</button>' : '') +
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
  function modal(title, body, foot) {
    closeModal(); lastFocus = doc.activeElement;
    var o = doc.createElement('div'); o.className = 'overlay';
    o.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="card-head"><h2 id="m-t">' + esc(title) + '</h2><button type="button" class="btn btn-sm" data-act="fechar">Fechar</button></div><div class="modal-body">' + body + '</div>' + (foot ? '<div class="modal-foot">' + foot + '</div>' : '') + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(); else onClick(e); });
    o.addEventListener('submit', onSubmit);
    doc.body.appendChild(o);
    var f = $('input, select, textarea, .modal-foot .btn-primary', o) || $('.btn', o); if (f) f.focus();
  }
  function closeModal() { var o = $('.overlay'); if (o) { o.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); } }
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
    o.innerHTML = '<div class="docbar"><div><strong>Prévia do documento</strong><span class="ui-sub">' + esc(nome) + '.pdf' + (S.plano === 'assinante' ? '' : ' · plano de avaliação: sai com marca d\'água') + '</span></div><div class="actions"><button type="button" class="btn btn-primary" data-docact="pdf">Baixar PDF</button><button type="button" class="btn" data-docact="imprimir">Imprimir</button><button type="button" class="btn" data-docact="fechar">Fechar</button></div></div><div class="docscroll"><div class="sheet-a4" id="doc-sheet">' + html + '</div></div>';
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
    if (!window.html2pdf) return Promise.reject(new Error('sem gerador'));
    var marca = S.plano !== 'assinante';
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
          [90, 160, 230].forEach(function (y) { pdf.text('SEU COMANDO · VERSÃO DE AVALIAÇÃO', 105, y, { align: 'center', angle: 32 }); });
          pdf.restoreGraphicsState();
        }
      }
      return pdf.output('blob');
    });
  }
  function baixarPDF(el, nome, btn) {
    if (!window.html2pdf) { toast('O gerador de PDF não carregou. Use "Imprimir".'); return; }
    btn.disabled = true; btn.textContent = 'Gerando PDF…';
    var fim = function () { btn.disabled = false; btn.textContent = 'Baixar PDF'; };
    gerarPDF(el).then(function (blob) { return salvarArquivo(nome + '.pdf', blob); }).then(fim, function () { toast('Não foi possível gerar o PDF.'); fim(); });
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
    'copiar-link': function () { var url = location.origin + location.pathname.replace(/app\.html$/, '') + 'triagem.html?vaga=' + vagaAtual().id + '&t=' + encodeURIComponent(S.tipo || ''); if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link da pré-entrevista copiado. É ele que vai no anúncio da vaga ou no WhatsApp.'); }, function () { toast(url); }); else toast(url); },
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
    plano: function (b) { S.plano = b.dataset.v; save(); render(); toast(S.plano === 'assinante' ? 'Simulando assinante: o PDF sai sem marca d\'água.' : 'Simulando avaliação gratuita: o PDF sai com marca d\'água.'); },
    'ct-pdf': function () { var pp = $('#paper'), x = contratoAtualHTML(); if (!pp) return; printHTML(pp.outerHTML, 'Contrato ' + (x.ct.modelo === 'experiencia' ? 'de experiencia ' : '') + x.cargo.cargo + ' ' + (x.pessoa.tipo === 'novo' ? 'modelo' : x.pessoa.nome)); },
    metodo: function (b) { S.ui.metodo = b.dataset.v; S.ui.faceOk = false; save(); render(); },
    face: function () { var f = $('#face'); if (f) f.textContent = 'Conferindo…'; setTimeout(function () { S.ui.faceOk = true; render(); }, 700); },
    marcar: function () {
      var p = S.role === 'funcionario' ? P(ME) : P(S.ui.pontoPessoa || 'e3'), m = S.ponto[p.id] || (S.ponto[p.id] = ['', '', '', '']), i = m.indexOf('');
      if (i < 0) return;
      var hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); m[i] = hora; S.nsr++;
      var met = S.ui.metodo === 'celular' || (!S.ui.metodo && p.celular) ? 'celular' : 'fixo-rosto';
      S.marcacoesMetodo[p.id] = met;
      S.ui.recibo = { nsr: String(S.nsr).padStart(9, '0'), quando: '05/11/2026 ' + hora, nome: p.nome, cpf: p.cpf, tipo: ['Entrada', 'Saída para intervalo', 'Volta do intervalo', 'Saída'][i], metodo: METODO[met] };
      S.ui.faceOk = false; save(); render(); toast('Marcação registrada. Comprovante gerado.');
    },
    'export-afd': function () {
      var linhas = ['Seu Comando · AFD de exemplo (formato simplificado, não oficial)', 'Empresa: ' + S.empresa.razao + ' ' + S.empresa.cnpj];
      S.pessoas.forEach(function (p) { (S.ponto[p.id] || []).forEach(function (h) { if (h) linhas.push(['000000000', '05112026', h.replace(':', ''), p.cpf].join(';')); }); });
      var blob = new Blob([linhas.join('\r\n')], { type: 'text/plain;charset=utf-8' }), a = doc.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'AFD-exemplo.txt'; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    oc: function (b) { S.ui.oc = b.dataset.v; save(); render(); },
    orig: function (b) { var a = S.atestados.filter(function (x) { return x.id === b.dataset.id; })[0]; a.original = 'entregue'; a.entregueEm = S.hoje; save(); render(); toast('Original registrado. A falta passa a ser abonada.'); },
    ciencia: function (b) { var w = S.advertencias.filter(function (x) { return x.id === b.dataset.id; })[0]; w.ciencia = 'app'; w.cienciaEm = '2026-11-05 ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); save(); render(); toast('Ciência registrada.'); },
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
    'ck-regra': function (b) { var c = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0]; c.foto = b.dataset.v; if (c.foto !== 'parcial') c.itens.forEach(function (i) { i.foto = c.foto === 'todos'; }); save(); render(); },
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
        var id = 'env-' + g.id + '-' + Date.now() + '-' + i;
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
    'ct-extra-del': function (b) { var c = ctEstado(), i = +b.dataset.i; if (c.extras[i]) { c.extras.splice(i, 1); c.checks = {}; save(); render(); toast('Cláusula removida do contrato.'); } },
    'cmp-print': function () { printHTML(listaHTML(), 'Lista de compras ' + S.empresa.nome); },
    'cmp-receber': function () {
      var ok = S.compras.itens.filter(function (i) { return i.comprado; }), n = 0;
      ok.forEach(function (i) { var p = S.produtos.filter(function (x) { return x.id === i.prod; })[0]; if (p) { p.qtd = Math.round((p.qtd + i.qtd) * 100) / 100; n++; } });
      S.compras.itens = S.compras.itens.filter(function (i) { return !i.comprado; }); save(); render();
      toast(ok.length + ' item(ns) recebido(s). ' + (n ? n + ' atualizaram o estoque.' : 'Itens sem cadastro saíram da lista.'));
    },
    assinar: function (b) { var v = S.vales.filter(function (x) { return x.id === b.dataset.id; })[0]; v.assinado = '2026-11-05 ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); save(); render(); toast('Autorização assinada. O vale entra na folha de novembro.'); },
    'novo-vale': function () {
      modal('Novo vale', '<form class="stack" data-form="vale"><div class="form-grid"><div class="field"><label for="vp">Funcionário</label><select id="vp" name="p">' + S.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select></div><div class="field"><label for="vt">Tipo</label><select id="vt" name="t"><option value="produto">Produto da loja</option><option value="adiantamento">Adiantamento</option></select></div></div><div class="field"><label for="vd">Itens ou motivo</label><input id="vd" name="d" maxlength="80" required placeholder="Ex.: 2 bolos de fubá"></div><div class="field"><label for="vv">Valor (R$)</label><input id="vv" name="v" type="number" min="0.01" max="5000" step="0.01" required></div><p class="ui-sub">O funcionário recebe no app para assinar. Sem assinatura, o vale não entra na folha.</p><button class="btn btn-primary" type="submit">Enviar para assinatura</button></form>');
    }
  };
  function onClick(e) { var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; var f = A[b.dataset.act]; if (f) f(b, e); }
  function onSubmit(e) {
    var f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    var d = new FormData(f), k = f.dataset.form;
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
    if (k === 'temp') {
      var eqp = String(d.get('eq')), tv = parseFloat(String(d.get('t') || '').replace(',', '.')), ac = String(d.get('a') || '').trim().slice(0, 140);
      if (!S.bp || !S.bp.equip.some(function (e) { return e.id === eqp; }) || !isFinite(tv) || tv < -40 || tv > 300) { toast('Informe uma temperatura válida.'); return; }
      var reg = { eq: eqp, data: S.hoje, hora: new Date().toTimeString().slice(0, 5), t: Math.round(tv * 10) / 10, por: S.role === 'funcionario' ? ME : null, acao: ac };
      if (!tempOk(reg) && !ac) { toast('Fora da faixa: descreva a ação corretiva antes de registrar.'); var fa = $('#bt-a'); if (fa) fa.focus(); return; }
      S.bp.temps.push(reg); save(); render(); toast(tempOk(reg) ? 'Temperatura registrada.' : 'Registrado fora da faixa, com a ação corretiva. A gerência foi avisada.'); return;
    }
    if (k === 'quiz') {
      var cq = cursoPor(S.ui.curso); if (!cq) return;
      var ac2 = 0, erros = [];
      cq.quiz.forEach(function (qq, i) { if (+d.get('q' + i) === qq[2]) ac2++; else erros.push([qq[0], qq[1][qq[2]]]); });
      var aprovado = ac2 >= 3;
      if (aprovado && S.role === 'funcionario') { S.treinos = S.treinos || {}; S.treinos[ME] = S.treinos[ME] || {}; S.treinos[ME][cq.id] = { nota: Math.round(ac2 / cq.quiz.length * 100), em: S.hoje }; }
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
    if (k === 'ponto-pessoa') { S.ui.pontoPessoa = t.value; S.ui.faceOk = false; S.ui.metodo = null; save(); render(); }
    if (k === 'aut') { P(t.dataset.id).celular = t.checked; save(); render(); }
    if (k === 'etq') { S.ui.etq = S.ui.etq || {}; S.ui.etq[t.dataset.id] = t.checked; save(); render(); }
    if (k === 'cmp-qtd' || k === 'cmp-ok') {
      var it = S.compras.itens.filter(function (i) { return i.id === t.dataset.id; })[0]; if (!it) return;
      if (k === 'cmp-qtd') it.qtd = Math.max(0.5, Math.min(9999, Math.round((+t.value || 1) * 2) / 2)); else it.comprado = t.checked;
      save(); render(); return;
    }
    if (k === 'copias') { S.ui.copias = Math.max(1, Math.min(40, +t.value || 1)); save(); }
    if (k === 'ck-feito' || k === 'ck-req') {
      var c = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0], it = c.itens[+t.dataset.i];
      if (k === 'ck-req') it.foto = t.checked;
      else if (t.checked && it.foto && !it.fotoEm) { t.checked = false; toast('Este item precisa de foto antes de ser marcado.'); return; }
      else it.feito = t.checked;
      save(); render();
    }
    if (k === 'ck-foto' && t.files && t.files[0]) {
      var c2 = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0], it2 = c2.itens[+t.dataset.i];
      it2.thumb = URL.createObjectURL(t.files[0]); it2.fotoEm = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); it2.feito = true;
      save(); render(); toast('Foto anexada ao item.');
    }
    if (k === 'novo-atestado' && t.files && t.files[0]) {
      S.atestados.unshift({ id: 'a' + Date.now(), pessoa: ME, inicio: S.hoje, dias: 1, foto: '2026-11-05 ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), original: 'pendente', prazo: addDays(S.hoje, 2), ciencia: true });
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
  view.addEventListener('change', onInput);
  view.addEventListener('submit', onSubmit);
  view.addEventListener('input', function (e) { if (e.target.dataset.in === 'crit-km') { var o = e.target.previousElementSibling; if (o) o.innerHTML = 'Distância máxima: <strong>' + (+e.target.value) + ' km</strong>'; } });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('.docview')) fecharDoc(); else closeModal(); } });

  $('#role').addEventListener('change', function (e) { S.role = e.target.value; S.ui.recibo = null; S.ui.faceOk = false; save(); render(); toast('Agora você vê o sistema como ' + e.target.options[e.target.selectedIndex].text.toLowerCase() + '.'); });
  $('#menu-btn').addEventListener('click', function () { var s = $('#side'), o = s.classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); });
  $('#reset').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ } var nome = S.empresa.nome, razao = S.empresa.razao, tp = S.tipo; S = novoExemplo(tp || 'padaria'); S.empresa.nome = nome; S.empresa.razao = razao; semearInteg(); save(); render(); toast('Dados de exemplo restaurados.'); });
  var dl = $('#q-list'); dl.innerHTML = S.pessoas.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('') + S.produtos.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('');
  $('#q').addEventListener('change', function (e) { var v = e.target.value.trim(); if (!v) return; S.ui.q = v.slice(0, 60); save(); if (location.hash === '#/busca') render(); else location.hash = '#/busca'; });
  window.addEventListener('hashchange', function () { var o = $('.overlay'); if (o) o.remove(); fecharDoc(); render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  render();
})();
