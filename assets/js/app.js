/* Centralizar — painel (protótipo navegável). Sem servidor: os dados de exemplo ficam só neste navegador. */
(function () {
  'use strict';
  var KEY = 'centralizar-prototipo-v5';
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
  var ETAPAS_SEL = ['entrevista', 'aprovado', 'docs', 'reprovado'];
  function etapaHTML(c, i, m) {
    if (c.etapa === 'entrevista') return pill('warn', 'Entrevista ' + c.entrevistaEm) + ' <button type="button" class="btn btn-sm btn-primary" data-act="ent-ok" data-i="' + i + '">Aprovar</button> <button type="button" class="btn btn-sm" data-act="ent-nao" data-i="' + i + '">Não aprovar</button>';
    if (c.etapa === 'aprovado') return pill('ok', 'Aprovado na entrevista') + (c.contato ? ' <button type="button" class="btn btn-sm btn-primary" data-act="docs-modal" data-i="' + i + '">Enviar link de documentos</button>' : '<span class="sub">Sem WhatsApp: envie o link por outro meio</span>');
    if (c.etapa === 'docs') return pill('ok', 'Em admissão') + ' <a class="btn btn-sm" href="#/admissoes">Ver</a>';
    if (c.etapa === 'reprovado') return pill('mute', 'Não aprovado na entrevista');
    if (m) return '<span class="ui-sub">Descartado na triagem</span>';
    return '<button type="button" class="btn btn-sm btn-primary" data-act="ent-modal" data-i="' + i + '">Chamar para entrevista</button>';
  }
  function vVagas() {
    var g = vagaAtual(), k = g.crit;
    var tabs = S.vagas.map(function (v) { return '<button type="button" role="tab" aria-selected="' + (v.id === g.id) + '" data-act="vaga" data-id="' + v.id + '">' + esc(v.titulo) + '</button>'; }).join('');
    var aptos = 0;
    var rows = g.cands.map(function (c, i) {
      var m = avalia(c, k); if (!m) aptos++;
      return '<tr><td><strong>' + esc(c.n) + '</strong>' + (c.novo ? ' ' + pill('warn', 'Novo') : '') + '<span class="sub">' + esc(c.fone) + (c.contato ? '' : ' · não autorizou WhatsApp') + '</span></td><td>' + esc(REG[c.regime]) + '</td><td class="hide-sm">' + c.turnos.map(function (t) { return esc(TUR[t]); }).join(', ') + '</td><td class="num hide-sm">' + c.km + ' km</td><td class="num hide-sm">' + c.exp + (c.exp === 1 ? ' ano' : ' anos') + '</td><td>' + (m ? pill('mute', m) : pill('ok', 'Passou')) + '</td><td>' + etapaHTML(c, i, m) + '</td></tr>';
    }).join('');
    var conta = function (et) { return g.cands.filter(function (c) { return et.indexOf(c.etapa) > -1; }).length; };
    var kpi = function (l, v, cap) { return '<div class="kpi"><div class="lbl">' + l + '</div><div class="val num">' + v + '</div><div class="cap">' + cap + '</div></div>'; };
    var funil = '<div class="card kpis kpis-5">' + kpi('Responderam', g.cands.length, 'triagem pelo link') + kpi('Passaram na triagem', aptos, 'pelos seus critérios') + kpi('Entrevistados', conta(ETAPAS_SEL), 'chamados para entrevista') + kpi('Aprovados', conta(['aprovado', 'docs']), 'na entrevista') + kpi('Em admissão', conta(['docs']), 'enviando documentos') + '</div>';
    var seg = ['clt', 'free', 'temp', 'qualquer'].map(function (r) { return '<button type="button" data-act="crit-reg" data-v="' + r + '" aria-pressed="' + (k.regime === r) + '">' + REG[r] + '</button>'; }).join('');
    var chips = Object.keys(TUR).map(function (t) { return '<button type="button" class="chip" data-act="crit-tur" data-v="' + t + '" aria-pressed="' + (k.turnos.indexOf(t) > -1) + '">' + TUR[t] + '</button>'; }).join('');
    var exps = [0, 1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (k.exp === n ? ' selected' : '') + '>' + (n ? 'Pelo menos ' + n + (n === 1 ? ' ano' : ' anos') : 'Sem exigência') + '</option>'; }).join('');
    return titleRow('Vagas e seleção', esc(g.titulo) + ' · ' + esc(g.regimeOferta), '<a class="btn" href="triagem.html?vaga=' + esc(g.id) + '" target="_blank" rel="noopener">Ver como o candidato responde</a><button type="button" class="btn btn-primary" data-act="copiar-link">Copiar link da pré-entrevista</button>') +
      '<div class="tabs" role="tablist">' + tabs + '</div>' +
      '<div class="grid-main"><div class="stack">' + funil + '<div class="card"><div class="card-head"><h2>Candidatos</h2><span class="ui-sub">Triagem, entrevista e documentos, nessa ordem</span></div><div class="table-box"><table class="t stack-sm"><thead><tr><th>Candidato</th><th>Quer trabalhar como</th><th class="hide-sm">Turnos</th><th class="num hide-sm">Distância</th><th class="num hide-sm">Experiência</th><th>Triagem</th><th>Etapa</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="notice info"><div><strong>Como a seleção anda</strong>A triagem só descarta quem não se encaixa nos seus critérios. Quem passa é chamado para entrevista; só quem você aprova na entrevista recebe o link de documentos. Depois, o contador confere e você dá o ok final em Admissões.</div></div></div>' +
      '<div class="stack"><div class="card card-pad stack"><h2 class="sec">Critérios da triagem</h2>' +
      '<div class="field"><span class="lbl-s">Regime da vaga</span><div class="seg">' + seg + '</div></div>' +
      '<div class="field"><span class="lbl-s">Turnos obrigatórios</span><div class="chips">' + chips + '</div></div>' +
      '<div class="field"><label for="km">Distância máxima: <strong>' + k.km + ' km</strong></label><input id="km" type="range" min="1" max="25" value="' + k.km + '" data-in="crit-km"></div>' +
      '<div class="field"><label for="exp">Experiência no ramo</label><select id="exp" data-in="crit-exp">' + exps + '</select></div></div>' +
      '<div class="card card-pad stack"><h2 class="sec">Perguntas da triagem</h2><p class="ui-sub">Na triagem são só perguntas: nenhum documento é pedido nessa etapa (LGPD, art. 6º, III, princípio da necessidade).</p><ul class="list"><li>Como você quer trabalhar? CLT, freelancer, temporário ou tanto faz</li><li>Quais turnos você pode fazer?</li><li>Qual a distância da sua casa até a loja?</li><li>Quanto tempo de experiência no ramo?</li><li>Podemos falar com você pelo WhatsApp?</li></ul>' +
      '<div class="notice info"><div><strong>Perguntas bloqueadas</strong>Sexo, idade, estado civil, filhos, gravidez, raça, cor, origem e deficiência não podem ser critério de seleção (Lei 9.029/95). O Centralizar não oferece essas perguntas.</div></div></div></div></div>';
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
    c.checks = c.checks || {}; return c;
  }
  function pessoasContrato() {
    return [{ id: 'novo', nome: '[NOME DO EMPREGADO]', cpf: '[CPF]', salario: null, cargo: null, tipo: 'novo' }]
      .concat(S.admissoes.map(function (a) { return { id: a.id, nome: a.nome, cpf: a.cpf, salario: a.salario, cargo: a.cargo, inicio: a.inicio, tipo: 'admissao' }; }))
      .concat(S.pessoas.map(function (p) { return { id: p.id, nome: p.nome, cpf: p.cpf, salario: p.salario, cargo: p.cargo, admissao: p.admissao, funcao: p.funcao, tipo: 'empregado' }; }));
  }
  function temFlag(cargo, prefixos) { return cargo.flags.some(function (f) { return prefixos.some(function (p) { return f.indexOf(p) === 0; }); }); }
  // Periculosidade marcada automaticamente só quando a lei já garante; motociclista (PEM) fica como alerta.
  var PERIC = ['PE', 'PEI', 'PEE', 'PEV', 'PEB'];
  function temPeric(cargo) { return cargo.flags.some(function (f) { return PERIC.indexOf(f) > -1; }); }
  function contratoExperiencia(ct, pessoa, cargo) {
    var fim = addDays(ct.inicio, ct.dias - 1), resto = 90 - ct.dias, j = JORNADAS[ct.jornada];
    var noturno = ct.turno !== 'diurno';
    var adic = [];
    if (ct.insal) adic.push('adicional de insalubridade de ' + ct.insal + '%, calculado sobre o salário-mínimo, salvo base mais favorável em norma coletiva (CLT, art. 192)');
    if (ct.peric) adic.push('adicional de periculosidade de 30% sobre o salário-base (CLT, art. 193, § 1º)');
    if (ct.noturno) adic.push('adicional noturno de 20% sobre a hora diurna nas horas trabalhadas entre 22h e 5h (CLT, art. 73)');
    var nrs = cargo.flags.filter(function (f) { return /^NR\d+$/.test(f); }).map(function (f) { return 'NR-' + f.slice(2); });
    var cl = [
      'A EMPREGADA(O) é admitida(o) para exercer a função de <strong>' + esc(cargo.cargo) + '</strong> (CBO ' + esc(cargo.cbo) + '), com as seguintes atribuições: ' + cargo.atrib.map(function (a) { return esc(a.charAt(0).toLowerCase() + a.slice(1)); }).join('; ') + '; além de outras tarefas compatíveis com a sua condição pessoal (CLT, art. 456, parágrafo único).',
      'Este é um contrato de experiência de <strong>' + ct.dias + ' dias</strong>, de ' + dmyy(ct.inicio) + ' a ' + dmyy(fim) + (resto > 0 ? ', que poderá ser prorrogado uma única vez por até ' + resto + ' dias, sem ultrapassar 90 dias no total' : ', sem possibilidade de prorrogação por já atingir o limite de 90 dias') + ' (CLT, arts. 443, § 2º, "c", 445, parágrafo único, e 451). Vencido o prazo sem rescisão, o contrato passa a vigorar por prazo indeterminado.',
      'A jornada é de <strong>' + esc(j[0]) + '</strong>, ' + esc(j[1]) + ', em turno ' + esc(TURNOS[ct.turno]) + (noturno ? ', com hora noturna reduzida de 52 minutos e 30 segundos' : '') + ', com registro de ponto por programa eletrônico (Portaria MTP 671/2021).',
      'O salário mensal é de <strong>R$ ' + brl(+ct.salario || 0) + '</strong>' + (adic.length ? ', acrescido de ' + adic.join('; ') : '') + ', pago até o 5º dia útil do mês seguinte ao trabalhado (CLT, art. 459, § 1º).',
      'O trabalho será prestado no estabelecimento da EMPREGADORA em ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + '.',
      'A EMPREGADA(O) receberá os equipamentos de proteção e os treinamentos exigidos para a função' + (nrs.length ? ' (' + esc(nrs.join(', ')) + ')' : '') + ', obrigando-se a usá-los; a recusa injustificada constitui falta (CLT, art. 158, parágrafo único).',
      'Só serão descontados do salário os valores previstos em lei ou norma coletiva, os adiantamentos e os vales autorizados por escrito, e os danos causados com dolo ou, se por culpa, nos termos deste ajuste (CLT, art. 462, § 1º; Súmula 342 do TST).',
      ct.art481 ? 'As partes ajustam o direito recíproco de rescisão antes do termo final; exercido esse direito, aplicam-se os princípios da rescisão do contrato por prazo indeterminado, inclusive o aviso-prévio (CLT, art. 481; Súmula 163 do TST).' : 'A rescisão antecipada sem justa causa obedecerá aos arts. 479 e 480 da CLT.',
      'Aplicam-se a este contrato as normas coletivas da categoria' + (ct.cct ? ' (' + esc(ct.cct) + ')' : '') + ', no que forem mais favoráveis à EMPREGADA(O).',
      'Os dados pessoais da EMPREGADA(O) serão tratados para cumprir este contrato e as obrigações legais e regulatórias (LGPD, art. 7º, II e V).'
    ];
    return '<h3>Contrato de trabalho por prazo determinado, na modalidade de experiência</h3><p class="center">' + esc(S.empresa.cidade) + '</p>' +
      '<p><strong>EMPREGADORA:</strong> ' + esc(S.empresa.razao) + ', CNPJ ' + esc(S.empresa.cnpj) + ', ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + '.<br><strong>EMPREGADA(O):</strong> ' + esc(pessoa.nome) + ', CPF ' + esc(pessoa.cpf) + '.</p>' +
      '<p>As partes celebram este contrato de experiência, assinado antes do início da prestação de serviços, nas condições abaixo.</p>' +
      '<ol>' + cl.map(function (c) { return '<li contenteditable="true">' + c + '</li>'; }).join('') + '</ol>' +
      '<p class="center">' + esc(S.empresa.cidade.split('/')[0]) + ', ____ de ______________ de 2026.</p>' +
      '<div class="sig"><span>' + esc(S.empresa.razao) + '</span><span>' + esc(pessoa.nome) + '</span><span>Testemunha</span><span>Testemunha</span></div>';
  }
  function contratoModelo(t, pessoa, cargo, ct) {
    var sal = t.id === 'intermitente' ? (+ct.salario || 0) / 220 : +ct.salario || 0;
    var campos = { funcao: cargo.cargo.toLowerCase() + ' (CBO ' + cargo.cbo + ')', cidade: S.empresa.cidade, inicio: dmyy(ct.inicio), salario: brl(sal) };
    var fill = function (s) { return esc(s).replace(/\{\{(\w+)\}\}/g, function (_, k) { return '<strong>' + esc(campos[k] || '') + '</strong>'; }); };
    var partes = t.id === 'autonomo' ? ['CONTRATANTE', 'CONTRATADO'] : t.id === 'estagio' ? ['CONCEDENTE', 'ESTAGIÁRIO(A)'] : ['EMPREGADORA', 'EMPREGADO(A)'];
    return '<h3>' + esc(t.titulo) + '</h3><p class="center">' + esc(S.empresa.cidade) + '</p>' +
      '<p><strong>' + partes[0] + ':</strong> ' + esc(S.empresa.razao) + ', CNPJ ' + esc(S.empresa.cnpj) + ', ' + esc(S.empresa.endereco) + ', ' + esc(S.empresa.cidade) + '.<br><strong>' + partes[1] + ':</strong> ' + esc(pessoa.nome) + ', CPF ' + esc(pessoa.cpf) + '.</p>' +
      '<ol>' + t.clausulas.map(function (c) { return '<li contenteditable="true">' + fill(c) + '</li>'; }).join('') + '</ol>' +
      '<p class="center">' + esc(S.empresa.cidade.split('/')[0]) + ', ____ de ______________ de 2026.</p><div class="sig"><span>' + esc(S.empresa.razao) + '</span><span>' + esc(pessoa.nome) + '</span></div>';
  }
  function verificacao(ct, pessoa, cargo) {
    var v = [];
    if (ct.modelo === 'experiencia') {
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
    return v;
  }
  var CHECKS = [['cct', 'Conferi o piso e as regras da convenção coletiva (CCT)'], ['aso', 'O exame admissional (ASO) será feito antes do início (NR-7)'], ['laudo', 'Conferi os adicionais no laudo (PGR/LTCAT) da empresa']];
  function marcaDagua() { return S.plano === 'assinante' ? '' : '<div class="wm" aria-hidden="true"><span>CENTRALIZAR · VERSÃO DE AVALIAÇÃO</span><span>CENTRALIZAR · VERSÃO DE AVALIAÇÃO</span><span>CENTRALIZAR · VERSÃO DE AVALIAÇÃO</span></div>'; }
  function contratoAtualHTML() {
    var ct = ctEstado(), ps = pessoasContrato(), pessoa = ps.filter(function (x) { return x.id === ct.alvo; })[0] || ps[0], cargo = cargoPor(ct.cargo);
    var t = TPL.filter(function (x) { return x.id === ct.modelo; })[0];
    var corpo = ct.modelo === 'experiencia' ? contratoExperiencia(ct, pessoa, cargo) : contratoModelo(t, pessoa, cargo, ct);
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
      '<div class="field"><label for="c-cct">Convenção coletiva (sindicato)</label><input id="c-cct" maxlength="80" value="' + esc(ct.cct) + '" placeholder="Ex.: CCT 2026 do sindicato da categoria" data-in="ct" data-k="cct"></div></div>';
    var pontos = '<div class="card card-pad stack"><h2 class="sec">Pontos trabalhistas de ' + esc(cargo.cargo) + '</h2><p class="ui-sub">CBO ' + esc(cargo.cbo) + ' · ' + esc(cargo.cboNome) + ' · ' + esc(cargo.setor) + '</p><ul class="list">' +
      cargo.flags.map(function (f) { return '<li>' + esc(ALERTAS[f] || f) + '</li>'; }).join('') + '<li>Confira piso, benefícios e regras da convenção coletiva (CCT) do sindicato da categoria.</li>' + (cargo.nota ? '<li>' + esc(cargo.nota) + '</li>' : '') + '</ul></div>';
    var verif = '<div class="card card-pad stack"><h2 class="sec">Verificação do contrato</h2>' + ver.map(function (i) { return '<div class="notice ' + (i[0] === 'bad' ? 'bad' : i[0] === 'ok' || i[0] === 'info' ? 'info' : '') + '"><div>' + i[1] + '</div></div>'; }).join('') +
      CHECKS.map(function (c) { return '<label class="check"><input type="checkbox" data-in="ct-check" data-k="' + c[0] + '"' + (ct.checks[c[0]] ? ' checked' : '') + '> ' + esc(c[1]) + '</label>'; }).join('') + '</div>';
    var plano = '<div class="seg" role="group" aria-label="Plano"><button type="button" data-act="plano" data-v="avaliacao" aria-pressed="' + (S.plano !== 'assinante') + '">Avaliação gratuita</button><button type="button" data-act="plano" data-v="assinante" aria-pressed="' + (S.plano === 'assinante') + '">Assinante</button></div>';
    var btn = '<button type="button" class="btn btn-primary" data-act="ct-pdf"' + (conferido && !bloqueio ? '' : ' disabled') + '>' + (bloqueio ? 'Corrija os pontos em vermelho' : conferido ? 'Exportar PDF' : 'Marque a verificação para exportar') + '</button>';
    return titleRow('Contratos', 'Escolha o enquadramento, verifique e exporte · ' + (S.plano === 'assinante' ? 'PDF sem marca d\'água' : 'no plano de avaliação o PDF sai com marca d\'água'), plano + btn) +
      '<div class="doc-wrap ct-wrap"><div class="stack">' + form + verif + pontos + '</div>' +
      '<article class="paper" id="paper">' + marcaDagua() + '<div class="notice sugestao"><div><strong>Sugestão de cláusulas, não é parecer jurídico</strong>Clique em qualquer cláusula para editar antes de exportar. Revise com seu advogado ou contador.</div></div>' + x.corpo + '</article></div>';
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
    'copiar-link': function () { var url = location.origin + location.pathname.replace(/app\.html$/, '') + 'triagem.html?vaga=' + vagaAtual().id; if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link da pré-entrevista copiado. É ele que vai no anúncio da vaga ou no WhatsApp.'); }, function () { toast(url); }); else toast(url); },
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
    'ct-pdf': function () { var pp = $('#paper'); if (!pp) return; printHTML(pp.outerHTML); toast('Na janela de impressão, escolha "Salvar como PDF".'); },
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
      if (key === 'dias') val = +val; if (key === 'salario') val = Math.max(0, Math.round((+val || 0) * 100) / 100); if (key === 'cct') val = String(val).slice(0, 80);
      ct[key] = val;
      if (key === 'alvo') { var pa = pessoasContrato().filter(function (x) { return x.id === val; })[0]; if (pa && pa.cargo) ct.cargo = pa.cargo; if (pa && pa.salario) ct.salario = pa.salario; if (pa && pa.inicio) ct.inicio = pa.inicio; }
      if (key === 'cargo' || key === 'alvo') ct.peric = temPeric(cargoPor(ct.cargo));
      if (key === 'turno') ct.noturno = val !== 'diurno';
      ct.checks = {}; save(); render(); return;
    }
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
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  $('#role').addEventListener('change', function (e) { S.role = e.target.value; S.ui.recibo = null; S.ui.faceOk = false; save(); render(); toast('Agora você vê o sistema como ' + e.target.options[e.target.selectedIndex].text.toLowerCase() + '.'); });
  $('#menu-btn').addEventListener('click', function () { var s = $('#side'), o = s.classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); });
  $('#reset').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ } var nome = S.empresa.nome; S = load(); S.empresa.nome = nome; save(); render(); toast('Dados de exemplo restaurados.'); });
  var dl = $('#q-list'); dl.innerHTML = S.pessoas.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('') + S.produtos.map(function (p) { return '<option value="' + esc(p.nome) + '">'; }).join('');
  $('#q').addEventListener('change', function (e) { var v = e.target.value.trim(); if (!v) return; S.ui.q = v.slice(0, 60); save(); if (location.hash === '#/busca') render(); else location.hash = '#/busca'; });
  window.addEventListener('hashchange', function () { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  render();
})();
