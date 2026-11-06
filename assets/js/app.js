/* Centralizar — painel (protótipo navegável). Sem servidor: os dados de exemplo ficam só neste navegador. */
(function () {
  'use strict';
  var KEY = 'centralizar-prototipo-v3';
  var SEED = window.BROTA_SEED, TPL = window.BROTA_CONTRATOS;
  var doc = document, view = doc.getElementById('view');
  var ME = 'e1'; // a funcionária usada na visão "Funcionário"
  var DEMO_AGORA = '10:40'; // horário fixo para a situação do ponto no exemplo
  var S = load();

  /* ---------- utilidades ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sem armazenamento: usa o exemplo */ } var s = clone(SEED); s.role = 'empresa'; s.ui = {}; s.nsr = 4812; return s; }
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
      if (n) { S.empresa.nome = n; save(); history.replaceState(null, '', location.pathname + location.hash); }
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
    if (!m[0]) return min(p.escala) > min(DEMO_AGORA) ? ['mute', 'Entra às ' + p.escala] : ['bad', 'Ausente'];
    var atraso = min(m[0]) - min(p.escala);
    if (m[3]) return ['mute', 'Jornada encerrada'];
    if (atraso > 10) return ['warn', 'Atraso de ' + atraso + ' min'];
    return ['ok', 'Presente'];
  }

  /* ---------- moldura ---------- */
  var ROUTES = {
    inicio: { t: 'Início', r: 'empresa contador funcionario', f: vInicio },
    vagas: { t: 'Vagas e pré-entrevista', r: 'empresa', f: vVagas },
    admissoes: { t: 'Admissões', r: 'empresa contador', f: vAdmissoes },
    contratos: { t: 'Contratos', r: 'empresa contador', f: vContratos },
    ponto: { t: 'Ponto e jornada', r: 'empresa contador funcionario', f: vPonto },
    ocorrencias: { t: 'Atestados e advertências', r: 'empresa contador funcionario', f: vOcorrencias },
    checklists: { t: 'Checklists', r: 'empresa funcionario', f: vChecklists },
    holerites: { t: 'Holerites', r: 'empresa contador funcionario', f: vHolerites },
    vales: { t: 'Vales', r: 'empresa contador funcionario', f: vVales },
    estoque: { t: 'Estoque e etiquetas', r: 'empresa', f: vEstoque },
    compras: { t: 'Lista de compras', r: 'empresa funcionario', f: vCompras },
    busca: { t: 'Busca', r: 'empresa contador funcionario', f: vBusca }
  };
  function route() { var h = location.hash.replace(/^#\/?/, '').split('?')[0]; return ROUTES[h] ? h : 'inicio'; }
  function render() {
    var r = route(), R = ROUTES[r];
    if (!can(R.r)) { location.hash = '#/inicio'; return; }
    view.innerHTML = '<div class="view">' + R.f() + '</div>';
    doc.title = R.t + ' · Centralizar';
    $$('#nav a').forEach(function (a) {
      var ok = a.dataset.roles.split(' ').indexOf(S.role) > -1;
      a.hidden = !ok;
      if (a.getAttribute('href') === '#/' + r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('#nav [data-group]').forEach(function (g) { g.hidden = !$$('a', g).some(function (a) { return !a.hidden; }); });
    var counts = { adm: S.admissoes.filter(function (a) { return a.docs.some(function (d) { return d.st !== 'ok'; }); }).length, orig: originaisPendentes().length, hol: S.role === 'funcionario' ? 0 : S.pessoas.length - S.holerites.aprovados.length, cmp: S.role === 'empresa' ? S.compras.itens.length : 0 };
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
    S.admissoes.forEach(function (a) { var f = a.docs.filter(function (d) { return d.st !== 'ok'; }).length; if (f) pend.push([pill('warn', f + ' documento(s)'), 'Admissão de ' + a.nome, a.funcao + ' · início em ' + dmy(a.inicio), '#/admissoes', 'Abrir']); });
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
      '<div class="kpi"><div class="lbl">No trabalho agora</div><div class="val num">' + presentes + '</div><div class="cap">pelo ponto das ' + DEMO_AGORA + '</div></div>' +
      '<div class="kpi"><div class="lbl">Holerites de outubro</div><div class="val num">' + aguard + '</div><div class="cap">aguardando aprovação</div></div>' +
      '<div class="kpi"><div class="lbl">Faltas não abonadas</div><div class="val num">' + fa.length + '</div><div class="cap">outubro, antes de fechar a folha</div></div></div>' +
      '<div class="card"><div class="card-head"><h2>Pendências da semana</h2><span class="pill mute">' + pend.length + ' no total</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>O que falta</th><th>Situação</th><th class="num">Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '</div><div class="stack"><div><h2 class="sec">Ponto agora</h2><div class="card"><ul class="list">' + pontoRail + '</ul></div></div>' +
      '<div><h2 class="sec">Validade nos próximos 3 dias</h2><div class="card"><ul class="list">' + (validade || '<li>Nada vencendo.</li>') + '</ul></div><a class="btn btn-sm" href="#/estoque">Ver estoque</a></div></div></div>';
  }

  /* ---------- Vagas e pré-entrevista ---------- */
  var REG = { clt: 'CLT', free: 'Freelancer', temp: 'Temporário', tanto: 'Tanto faz', qualquer: 'Qualquer' };
  var TUR = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', fds: 'Fim de semana' };
  function vagaAtual() { var id = S.ui.vaga || 'g1'; return S.vagas.filter(function (v) { return v.id === id; })[0]; }
  function avalia(c, k) {
    if (!(k.regime === 'qualquer' || c.regime === 'tanto' || c.regime === k.regime)) return 'Regime diferente';
    var falta = k.turnos.filter(function (t) { return c.turnos.indexOf(t) < 0; });
    if (falta.length) return 'Não faz ' + TUR[falta[0]].toLowerCase();
    if (c.km > k.km) return 'Mora a ' + c.km + ' km';
    if (c.exp < k.exp) return 'Experiência menor';
    return '';
  }
  function vVagas() {
    var g = vagaAtual(), k = g.crit;
    var tabs = S.vagas.map(function (v) { return '<button type="button" role="tab" aria-selected="' + (v.id === g.id) + '" data-act="vaga" data-id="' + v.id + '">' + esc(v.titulo) + '</button>'; }).join('');
    var aptos = 0, esc1 = g.cands.filter(function (c) { return c.escolhido; }), pend = esc1.filter(function (c) { return !c.avisado && c.contato; });
    var rows = g.cands.map(function (c, i) {
      var m = avalia(c, k); if (!m) aptos++;
      var dec = c.escolhido ? pill('ok', c.avisado ? 'Escolhido · link enviado' : 'Escolhido') + (c.avisado ? '' : ' <button type="button" class="btn btn-sm" data-act="desescolher" data-i="' + i + '">Desfazer</button>') : (m ? '<span class="ui-sub">·</span>' : '<button type="button" class="btn btn-sm btn-primary" data-act="escolher" data-i="' + i + '">Escolher</button>');
      return '<tr><td><strong>' + esc(c.n) + '</strong><span class="sub">' + esc(c.fone) + (c.contato ? '' : ' · não autorizou WhatsApp') + '</span></td><td>' + esc(REG[c.regime]) + '</td><td class="hide-sm">' + c.turnos.map(function (t) { return esc(TUR[t]); }).join(', ') + '</td><td class="num hide-sm">' + c.km + ' km</td><td class="num hide-sm">' + c.exp + (c.exp === 1 ? ' ano' : ' anos') + '</td><td>' + (m ? pill('mute', m) : pill('ok', 'Apto')) + '</td><td>' + dec + '</td></tr>';
    }).join('');
    var seg = ['clt', 'free', 'temp', 'qualquer'].map(function (r) { return '<button type="button" data-act="crit-reg" data-v="' + r + '" aria-pressed="' + (k.regime === r) + '">' + REG[r] + '</button>'; }).join('');
    var chips = Object.keys(TUR).map(function (t) { return '<button type="button" class="chip" data-act="crit-tur" data-v="' + t + '" aria-pressed="' + (k.turnos.indexOf(t) > -1) + '">' + TUR[t] + '</button>'; }).join('');
    var exps = [0, 1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (k.exp === n ? ' selected' : '') + '>' + (n ? 'Pelo menos ' + n + (n === 1 ? ' ano' : ' anos') : 'Sem exigência') + '</option>'; }).join('');
    return titleRow('Vagas e pré-entrevista', esc(g.titulo) + ' · ' + esc(g.regimeOferta) + ' · ' + g.cands.length + ' respostas', '<button type="button" class="btn" data-act="copiar-link">Copiar link da pré-entrevista</button><button type="button" class="btn btn-primary" data-act="wa-modal"' + (pend.length ? '' : ' disabled') + '>' + (pend.length ? 'Enviar link de documentos a ' + pend.length : 'Escolha quem segue') + '</button>') +
      '<div class="tabs" role="tablist">' + tabs + '</div>' +
      '<div class="grid-main"><div class="stack"><div class="card"><div class="card-head"><h2>Respostas da pré-entrevista</h2><span class="pill ok">' + aptos + ' aptos · ' + esc1.length + ' escolhido(s)</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>Candidato</th><th>Quer trabalhar como</th><th class="hide-sm">Turnos</th><th class="num hide-sm">Distância</th><th class="num hide-sm">Experiência</th><th>Filtro</th><th>Sua decisão</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="notice info"><div><strong>Passar no filtro não é ser contratado</strong>O filtro só separa quem atende aos seus critérios. Você escolhe quem segue, e só os escolhidos recebem pelo WhatsApp o link para enviar documentos. Só eles aparecem em Admissões.</div></div></div>' +
      '<div class="stack"><div class="card card-pad stack"><h2 class="sec">Seus critérios</h2>' +
      '<div class="field"><span class="lbl-s">Regime da vaga</span><div class="seg">' + seg + '</div></div>' +
      '<div class="field"><span class="lbl-s">Turnos obrigatórios</span><div class="chips">' + chips + '</div></div>' +
      '<div class="field"><label for="km">Distância máxima: <strong>' + k.km + ' km</strong></label><input id="km" type="range" min="1" max="25" value="' + k.km + '" data-in="crit-km"></div>' +
      '<div class="field"><label for="exp">Experiência no ramo</label><select id="exp" data-in="crit-exp">' + exps + '</select></div></div>' +
      '<div class="card card-pad stack"><h2 class="sec">O que o candidato responde</h2><p class="ui-sub">Na pré-entrevista são só perguntas: nenhum documento é pedido nessa etapa (LGPD, art. 6º, III, princípio da necessidade).</p><ul class="list"><li>Como você quer trabalhar? CLT, freelancer, temporário ou tanto faz</li><li>Quais turnos você pode fazer?</li><li>Qual a distância da sua casa até a loja?</li><li>Quanto tempo de experiência no ramo?</li><li>Podemos falar com você pelo WhatsApp?</li></ul>' +
      '<div class="notice info"><div><strong>Perguntas bloqueadas</strong>Sexo, idade, estado civil, filhos, gravidez, raça, cor, origem e deficiência não podem ser critério de seleção (Lei 9.029/95). O Centralizar não oferece essas perguntas.</div></div></div></div></div>';
  }

  /* ---------- Admissões ---------- */
  function admAtual() { var id = S.ui.adm || S.admissoes[0].id; return S.admissoes.filter(function (a) { return a.id === id; })[0]; }
  function vAdmissoes() {
    var a = admAtual(), editar = can('empresa contador');
    var rows = S.admissoes.map(function (x) { var ok = x.docs.filter(function (d) { return d.st === 'ok'; }).length; return '<tr class="click' + (x.id === a.id ? ' sel' : '') + '" data-act="adm" data-id="' + x.id + '"><td><strong>' + esc(x.nome) + '</strong><span class="sub">' + esc(x.funcao) + '</span></td><td class="num">' + ok + ' de ' + x.docs.length + '</td><td class="num hide-sm">' + dmy(x.inicio) + '</td><td>' + (x.aprovada ? pill('ok', 'Aprovada') : ok === x.docs.length ? pill('ok', 'Pronta para aprovar') : pill('warn', 'Em preenchimento')) + '</td></tr>'; }).join('');
    var docs = a.docs.map(function (d, i) {
      var por = d.por === 'contador' ? 'editado pelo contador' : d.por === 'empresa' ? 'editado pela empresa' : d.por === 'candidato' ? 'preenchido pelo candidato' : 'ainda não enviado';
      return '<div class="field"><label for="doc' + i + '">' + esc(d.n) + ' <span class="pill ' + (d.st === 'ok' ? 'ok' : 'warn') + '">' + esc(por) + '</span></label>' +
        (editar ? '<input id="doc' + i + '" value="' + esc(d.v) + '" data-in="doc" data-i="' + i + '" placeholder="Aguardando o candidato">' : '<input id="doc' + i + '" value="' + esc(d.v) + '" readonly>') + '</div>';
    }).join('');
    var tudo = a.docs.every(function (d) { return d.st === 'ok'; });
    var hist = a.hist.slice().reverse().map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
    var quem = S.role === 'contador' ? 'Você está como contador: pode corrigir qualquer campo, e a mudança fica no histórico.' : 'O candidato preenche pelo link; você e o contador podem corrigir. Toda mudança fica no histórico.';
    return titleRow('Admissões', 'Só os candidatos que você escolheu nas vagas · candidato, contador e empresa no mesmo cadastro', '<a class="btn" href="#/contratos" data-act="gerar-contrato" data-id="' + a.id + '">Gerar contrato sugerido</a>' + (S.role === 'empresa' ? '<button type="button" class="btn btn-primary" data-act="aprovar-adm"' + (tudo && !a.aprovada ? '' : ' disabled') + '>' + (a.aprovada ? 'Admissão aprovada' : 'Aprovar admissão') + '</button>' : '')) +
      '<div class="grid-main"><div class="stack"><div class="card"><div class="table-box"><table class="t"><thead><tr><th>Pessoa</th><th class="num">Documentos</th><th class="num hide-sm">Início</th><th>Situação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h2>' + esc(a.nome) + '</h2><span class="ui-sub">' + esc(a.funcao) + '</span></div><div class="card-pad stack"><div class="notice info"><div>' + quem + '</div></div><div class="form-grid">' + docs + '</div>' +
      (tudo ? '' : '<div><button type="button" class="btn" data-act="pedir-docs">Pedir o que falta pelo WhatsApp</button></div>') + '</div></div></div>' +
      '<div><h2 class="sec">Histórico</h2><div class="card"><ul class="list">' + hist + '</ul></div></div></div>';
  }

  /* ---------- Contratos ---------- */
  function pessoasContrato() { return S.admissoes.map(function (a) { return { id: a.id, nome: a.nome, funcao: a.funcao, salario: a.salario, inicio: a.inicio, cpf: a.cpf }; }).concat(S.pessoas.map(function (p) { return { id: p.id, nome: p.nome, funcao: p.funcao, salario: p.salario, inicio: p.admissao, cpf: p.cpf }; })); }
  function vContratos() {
    var t = TPL.filter(function (x) { return x.id === (S.ui.tpl || 'experiencia'); })[0];
    var ps = pessoasContrato(), alvo = ps.filter(function (x) { return x.id === (S.ui.alvo || ps[0].id); })[0] || ps[0];
    var sal = t.id === 'intermitente' ? alvo.salario / 220 : alvo.salario;
    var campos = { funcao: alvo.funcao.toLowerCase(), cidade: S.empresa.cidade, inicio: dmyy(alvo.inicio), salario: brl(sal) };
    var fill = function (s) { return esc(s).replace(/\{\{(\w+)\}\}/g, function (_, k) { return '<strong>' + esc(campos[k] || '') + '</strong>'; }); };
    var list = TPL.map(function (x) { return '<li><button type="button" data-act="tpl" data-id="' + x.id + '" aria-current="' + (x.id === t.id) + '">' + esc(x.nome) + '<span class="sub">' + esc(x.base) + '</span></button></li>'; }).join('');
    var opts = ps.map(function (x) { return '<option value="' + x.id + '"' + (x.id === alvo.id ? ' selected' : '') + '>' + esc(x.nome) + ' · ' + esc(x.funcao) + '</option>'; }).join('');
    var partes = t.id === 'autonomo' ? ['CONTRATANTE', 'CONTRATADO'] : t.id === 'estagio' ? ['CONCEDENTE', 'ESTAGIÁRIO(A)'] : ['EMPREGADORA', 'EMPREGADO(A)'];
    var paper = '<article class="paper" id="paper"><div class="notice sugestao"><div><strong>Sugestão de cláusulas, não é parecer jurídico</strong>Revise com seu advogado ou contador antes de assinar. Clique em qualquer trecho para editar.</div></div>' +
      (t.aviso ? '<div class="notice bad sugestao"><div>' + esc(t.aviso) + '</div></div>' : '') +
      '<h3 contenteditable="true">' + esc(t.titulo) + '</h3><p class="center">' + esc(S.empresa.cidade) + '</p>' +
      '<p contenteditable="true"><strong>' + partes[0] + ':</strong> ' + esc(S.empresa.razao) + ', CNPJ ' + esc(S.empresa.cnpj) + ', ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + '.<br><strong>' + partes[1] + ':</strong> ' + esc(alvo.nome) + ', CPF ' + esc(alvo.cpf) + '.</p>' +
      '<ol>' + t.clausulas.map(function (c) { return '<li contenteditable="true">' + fill(c) + '</li>'; }).join('') + '</ol>' +
      '<p contenteditable="true">E, por estarem de acordo, as partes assinam este documento.</p><p class="center">' + esc(S.empresa.cidade.split('/')[0]) + ', ____ de ______________ de 2026.</p>' +
      '<div class="sig"><span>' + esc(S.empresa.razao) + '</span><span>' + esc(alvo.nome) + '</span></div></article>';
    return titleRow('Contratos', 'Base de modelos com cláusulas sugeridas para cada tipo de vaga', '<button type="button" class="btn" data-act="tpl-reset">Restaurar modelo</button><button type="button" class="btn btn-primary" data-act="print-paper">Imprimir ou salvar PDF</button>') +
      '<div class="doc-wrap"><div class="stack"><div class="card"><ul class="list tpl-list">' + list + '</ul></div><div class="field"><label for="alvo">Preencher com os dados de</label><select id="alvo" data-in="alvo">' + opts + '</select></div></div>' + paper + '</div>';
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
    return titleRow('Ponto e jornada', 'Quinta-feira, 05/11 · situação às ' + DEMO_AGORA + ' · tolerância de 10 minutos por dia (CLT, art. 58, § 1º)', '<button type="button" class="btn" data-act="export-afd">Exportar arquivo para a fiscalização (AFD)</button>') +
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
        '<p class="ui-sub">O diagnóstico (CID) só consta do atestado a pedido do paciente (Resolução CFM 1.658/2002, art. 5º). O Centralizar não pede esse campo.</p></div>';
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
      '<div class="stack"><div class="notice info"><div><strong>Regra do desconto</strong>Só com autorização prévia e por escrito (CLT, art. 462; Súmula 342 do TST). O Centralizar avisa em 60% e trava novos vales quando os descontos do mês chegam a 70% do salário (OJ 18 da SDC/TST).</div></div>' + resumo + '</div></div>';
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
  function printHTML(html) {
    var a = $('#print-area'); a.innerHTML = html; doc.body.classList.add('printing');
    var done = function () { doc.body.classList.remove('printing'); a.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); window.print(); setTimeout(done, 1500);
  }

  /* ---------- ações ---------- */
  var A = {
    fechar: closeModal,
    vaga: function (b) { S.ui.vaga = b.dataset.id; save(); render(); },
    'crit-reg': function (b) { vagaAtual().crit.regime = b.dataset.v; save(); render(); },
    'crit-tur': function (b) { var k = vagaAtual().crit, i = k.turnos.indexOf(b.dataset.v); if (i > -1) k.turnos.splice(i, 1); else k.turnos.push(b.dataset.v); save(); render(); },
    'copiar-link': function () { var url = location.origin + location.pathname.replace(/app\.html$/, '') + 'app.html#/vagas'; if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copiado. No produto, ele abre o formulário da pré-entrevista.'); }, function () { toast(url); }); else toast(url); },
    escolher: function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.escolhido = true; save(); render(); toast(first(c.n) + ' escolhido(a). Agora envie o link de documentos.'); },
    desescolher: function (b) { var c = vagaAtual().cands[+b.dataset.i]; c.escolhido = false; save(); render(); },
    'wa-modal': function () {
      var g = vagaAtual(), ap = g.cands.filter(function (c) { return c.escolhido && !c.avisado; }), ok = ap.filter(function (c) { return c.contato; }), sem = ap.filter(function (c) { return !c.contato; });
      var msg = 'Olá, {nome}! Você foi escolhido(a) para a vaga de ' + g.titulo + ' na ' + S.empresa.nome + '. Envie seus documentos por este link para começarmos a admissão. Qualquer dúvida, é só responder aqui.';
      modal('Enviar link de documentos aos escolhidos', '<p class="ui-sub">Modelo de mensagem aprovado pela Meta (API oficial do WhatsApp Business).</p><div class="wa-msg">' + esc(msg) + '</div><div><strong>Vai para:</strong><ul class="list">' + ok.map(function (c) { return '<li><span>' + esc(c.n) + '</span><span class="num">' + esc(c.fone) + '</span></li>'; }).join('') + '</ul></div>' +
        (sem.length ? '<div class="notice"><div>' + sem.map(function (c) { return esc(c.n); }).join(', ') + ' não autorizou contato por WhatsApp. Avise por telefone e envie o link por outro meio.</div></div>' : '') + '<p class="ui-sub">Ao enviar, a admissão de cada escolhido é aberta em Admissões.</p>',
        '<button type="button" class="btn" data-act="fechar">Cancelar</button><button type="button" class="btn btn-primary" data-act="wa-enviar"' + (ok.length ? '' : ' disabled') + '>Enviar ' + ok.length + ' mensagem(ns)</button>');
    },
    'wa-enviar': function () {
      var g = vagaAtual(), n = 0;
      g.cands.forEach(function (c) {
        if (!c.escolhido || c.avisado || !c.contato) return;
        c.avisado = true; n++;
        if (S.admissoes.some(function (a) { return a.nome === c.n; })) return;
        var aut = g.modelo === 'autonomo', docs = aut ? ['RG ou CNH', 'CPF', 'Cartão CNPJ do MEI', 'Chave PIX'] : ['RG ou CNH', 'CPF', 'Endereço', 'Carteira de Trabalho Digital', 'Conta para pagamento', 'Exame admissional (ASO)'];
        S.admissoes.push({ id: 'd' + Date.now() + n, nome: c.n, funcao: g.titulo + (aut ? ' (freelancer)' : ''), modelo: g.modelo, inicio: addDays(S.hoje, 7), salario: g.salario, cpf: '[a preencher]', docs: docs.map(function (d) { return { n: d, v: '', por: '', st: 'pendente' }; }), hist: [agora() + ' · Empresa escolheu ' + first(c.n) + ' na vaga ' + g.titulo + ' e enviou o link de documentos pelo WhatsApp'] });
      });
      save(); closeModal(); render(); toast(n + ' link(s) de documentos na fila do WhatsApp e admissão aberta. Neste protótipo nada é enviado de verdade.');
    },
    adm: function (b) { S.ui.adm = b.dataset.id; save(); render(); },
    'pedir-docs': function () { var a = admAtual(); a.hist.push(agora() + ' · ' + (S.role === 'contador' ? 'Contador' : 'Empresa') + ' pediu pelo WhatsApp: ' + a.docs.filter(function (d) { return d.st !== 'ok'; }).map(function (d) { return d.n; }).join(', ')); save(); render(); toast('Pedido enviado a ' + first(a.nome) + ' (simulação).'); },
    'aprovar-adm': function () { var a = admAtual(); a.aprovada = true; a.hist.push(agora() + ' · Empresa aprovou a admissão; contador avisado para enviar ao eSocial'); save(); render(); toast('Admissão aprovada. O contador foi avisado.'); },
    'gerar-contrato': function (b, e) { e.preventDefault(); var a = admAtual(); S.ui.alvo = a.id; S.ui.tpl = a.modelo; save(); location.hash = '#/contratos'; },
    tpl: function (b) { S.ui.tpl = b.dataset.id; save(); render(); },
    'tpl-reset': function () { render(); toast('Modelo restaurado.'); },
    'print-paper': function () { printHTML($('#paper').outerHTML); },
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
      var linhas = ['Centralizar · AFD de exemplo (formato simplificado, não oficial)', 'Empresa: ' + S.empresa.razao + ' ' + S.empresa.cnpj];
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
    'print-slip': function (b) { printHTML(slipHTML(holerite(b.dataset.id), 'outubro de 2026')); },
    lancar: function (b) { var p = P(b.dataset.id); modal('Lançamento · ' + p.nome, '<form class="stack" data-form="lancar" data-id="' + p.id + '"><div class="field"><label for="hx">Horas extras a 50% em outubro</label><input id="hx" name="h" type="number" min="0" max="60" step="0.5" value="' + (S.horasExtras[p.id] || 0) + '"></div><p class="ui-sub">Se o holerite já estiver liberado, ele volta para aprovação da empresa.</p><button class="btn btn-primary" type="submit">Salvar lançamento</button></form>'); },
    'aprovar-sel': function () { var n = 0; $$('[data-in="sel-hol"]:checked:not(:disabled)').forEach(function (c) { S.holerites.aprovados.push(c.dataset.id); n++; }); if (!n) { toast('Marque pelo menos um holerite.'); return; } save(); render(); toast(n + ' holerite(s) liberado(s) para os funcionários.'); },
    'aprovar-todos': function () { S.holerites.aprovados = S.pessoas.map(function (p) { return p.id; }); save(); render(); toast('Holerites de outubro liberados para todos.'); },
    ck: function (b) { S.ui.ck = b.dataset.id; save(); render(); },
    'ck-regra': function (b) { var c = S.checklists.filter(function (x) { return x.id === (S.ui.ck || 'c1'); })[0]; c.foto = b.dataset.v; if (c.foto !== 'parcial') c.itens.forEach(function (i) { i.foto = c.foto === 'todos'; }); save(); render(); },
    qtd: function (b) { var p = S.produtos.filter(function (x) { return x.id === b.dataset.id; })[0]; p.qtd = Math.max(0, p.qtd + +b.dataset.d); save(); render(); },
    'print-etq': function () { var n = Math.max(1, Math.min(40, +(S.ui.copias || 2))); printHTML('<div class="labels">' + S.produtos.filter(function (p) { return (S.ui.etq || {})[p.id]; }).map(function (p) { return labelHTML(p, n); }).join('') + '</div>'); },
    'cmp-ir': function () { var n = gerarCompras(); save(); location.hash = '#/compras'; if (n) toast(n + ' item(ns) abaixo do mínimo foram para a lista de compras.'); },
    'cmp-gerar': function () { var n = gerarCompras(); save(); render(); toast(n + ' item(ns) sugerido(s) a partir do estoque mínimo.'); },
    'cmp-del': function (b) { S.compras.itens = S.compras.itens.filter(function (i) { return i.id !== b.dataset.id; }); save(); render(); },
    'cmp-print': function () { printHTML(listaHTML()); },
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
    if (k === 'alvo') { S.ui.alvo = t.value; save(); render(); }
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
      save(); render();
    }
  }
  view.addEventListener('click', onClick);
  view.addEventListener('change', onInput);
  view.addEventListener('submit', onSubmit);
  view.addEventListener('input', function (e) { if (e.target.dataset.in === 'crit-km') { var o = e.target.previousElementSibling; if (o) o.innerHTML = 'Distância máxima: <strong>' + (+e.target.value) + ' km</strong>'; } });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  $('#role').addEventListener('change', function (e) { S.role = e.target.value; S.ui.recibo = null; S.ui.faceOk = false; save(); render(); toast('Agora você vê o sistema como ' + e.target.options[e.target.selectedIndex].text.toLowerCase() + '.'); });
  $('#menu-btn').addEventListener('click', function () { var s = $('#side'), o = s.classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); });
  $('#reset').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ } var nome = S.empresa.nome; S = load(); S.empresa.nome = nome; save(); render(); toast('Dados de exemplo restaurados.'); });
  var dl = $('#q-list'); dl.innerHTML = S.pessoas.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('') + S.produtos.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('');
  $('#q').addEventListener('change', function (e) { var v = e.target.value.trim(); if (!v) return; S.ui.q = v.slice(0, 60); save(); if (location.hash === '#/busca') render(); else location.hash = '#/busca'; });
  window.addEventListener('hashchange', function () { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  render();
})();
