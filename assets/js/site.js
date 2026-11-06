/* Centralizar — landing page. Sem dependências; nada é enviado para fora do navegador. */
(function () {
  'use strict';
  var doc = document;
  doc.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var brl = function (v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Título com máscara: entra quando as fontes estiverem prontas. */
  var hero = $('.hero');
  var ready = function () { hero.classList.add('ready'); };
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(ready); setTimeout(ready, 900); } else { ready(); }

  /* ---------- Pré-entrevista ao vivo ---------- */
  var cands = [
    { n: 'Ana Beatriz', i: 'AB', regime: 'clt', turnos: ['manha', 'tarde'], km: 3, fone: '(48) 9 9812-4410' },
    { n: 'Diego Martins', i: 'DM', regime: 'free', turnos: ['noite', 'fds'], km: 6, fone: '(48) 9 9177-0382' },
    { n: 'Larissa Costa', i: 'LC', regime: 'ambos', turnos: ['tarde', 'fds', 'manha'], km: 12, fone: '(48) 9 8840-2291' },
    { n: 'Marcos Lima', i: 'ML', regime: 'clt', turnos: ['manha'], km: 18, fone: '(48) 9 9604-7713' },
    { n: 'Joana Ribeiro', i: 'JR', regime: 'free', turnos: ['manha', 'tarde', 'fds'], km: 2, fone: '(48) 9 9931-5058' }
  ];
  var nomesTurno = { manha: 'manhã', tarde: 'tarde', noite: 'noite', fds: 'fim de semana' };
  var nomesRegime = { clt: 'quer CLT', free: 'quer freelancer', ambos: 'aceita os dois' };
  var crit = { regime: 'clt', turnos: ['manha'], km: 12 };
  var escolhidos = ['Ana Beatriz'];
  var list = $('#cands');

  function apto(c) {
    var regimeOk = crit.regime === 'ambos' || c.regime === 'ambos' || c.regime === crit.regime;
    var turnoOk = crit.turnos.every(function (t) { return c.turnos.indexOf(t) > -1; });
    var kmOk = c.km <= crit.km;
    var motivo = !regimeOk ? 'regime diferente' : !turnoOk ? 'não cobre o turno' : !kmOk ? 'mora a ' + c.km + ' km' : '';
    return { ok: regimeOk && turnoOk && kmOk, motivo: motivo };
  }
  function renderCands() {
    list.textContent = '';
    var n = 0;
    escolhidos = escolhidos.filter(function (nm) { return cands.some(function (c) { return c.n === nm && apto(c).ok; }); });
    cands.forEach(function (c) {
      var r = apto(c); if (r.ok) n++;
      var li = doc.createElement('li'); li.className = 'cand' + (r.ok ? '' : ' out');
      var av = doc.createElement('span'); av.className = 'avatar'; av.textContent = c.i; av.setAttribute('aria-hidden', 'true');
      var mid = doc.createElement('div');
      var nm = doc.createElement('div'); nm.className = 'cand-name'; nm.textContent = c.n;
      var mt = doc.createElement('div'); mt.className = 'cand-meta';
      mt.textContent = nomesRegime[c.regime] + ' · ' + c.turnos.map(function (t) { return nomesTurno[t]; }).join(', ') + ' · ' + c.km + ' km';
      mid.appendChild(nm); mid.appendChild(mt);
      var st;
      if (r.ok) {
        var on = escolhidos.indexOf(c.n) > -1;
        st = doc.createElement('button'); st.type = 'button'; st.className = 'chip pick'; st.dataset.n = c.n;
        st.setAttribute('aria-pressed', String(on)); st.textContent = on ? 'Convidado' : 'Convidar';
      } else { st = doc.createElement('span'); st.className = 'pill pill-mute'; st.textContent = r.motivo; }
      li.appendChild(av); li.appendChild(mid); li.appendChild(st); list.appendChild(li);
    });
    var e = escolhidos.length;
    $('#apt-count').textContent = n + ' de ' + cands.length + ' passaram na triagem · ' + e + ' para entrevista';
    var b = $('#wa-send'); b.disabled = e === 0;
    b.textContent = e ? 'Convidar ' + (e === 1 ? '1 pessoa' : e + ' pessoas') + ' para entrevista' : (n ? 'Escolha quem entrevistar' : 'Ninguém passou ainda');
    $('#wa').hidden = true;
  }
  $$('[data-crit]').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      if (g.dataset.crit === 'regime') {
        $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === btn)); });
        crit.regime = btn.dataset.v;
      } else {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        crit.turnos = $$('button[aria-pressed="true"]', g).map(function (x) { return x.dataset.v; });
      }
      renderCands();
    });
  });
  $('#dist').addEventListener('input', function (e) { crit.km = +e.target.value; $('#dist-out').textContent = crit.km + ' km'; renderCands(); });
  list.addEventListener('click', function (ev) {
    var p = ev.target.closest('.pick'); if (!p) return;
    var i = escolhidos.indexOf(p.dataset.n); if (i > -1) escolhidos.splice(i, 1); else escolhidos.push(p.dataset.n);
    renderCands();
  });
  $('#wa-send').addEventListener('click', function () {
    var ap = cands.filter(function (c) { return escolhidos.indexOf(c.n) > -1; });
    if (!ap.length) return;
    var first = ap[0];
    $('#wa-msg').textContent = 'Olá, ' + first.n.split(' ')[0] + '! Você passou na triagem para a vaga de Atendente de balcão na Padaria Sol. Sua entrevista é amanhã às 10h, aqui na loja. Pode confirmar?';
    if (first.n === 'Diego Martins' || first.n === 'Marcos Lima') $('#wa-msg').textContent = $('#wa-msg').textContent.replace('escolhida', 'escolhido');
    var hh = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    $('#wa-meta').textContent = 'Para ' + first.fone + ' · ' + hh + (ap.length > 1 ? ' · mais ' + (ap.length - 1) + (ap.length === 2 ? ' mensagem' : ' mensagens') + ' na fila' : '');
    $('#wa').hidden = false;
  });
  renderCands();

  /* ---------- Holerite: saída fixa, controles vivos ---------- */
  var SAL = 1980, ADIANT = 792;
  var slip = { he: 6, abonada: false, vale: 45, aprovado: false };
  // Faixas progressivas do INSS usadas só como exemplo de cálculo; no produto, o contador lança o valor.
  function inss(b) {
    var f = [[1518, 0.075], [2793.88, 0.09], [4190.83, 0.12], [8157.41, 0.14]], prev = 0, t = 0;
    f.forEach(function (x) { if (b > prev) t += (Math.min(b, x[0]) - prev) * x[1]; prev = x[0]; });
    return Math.round(t * 100) / 100;
  }
  function row(desc, ref, val, neg, cls) {
    var tr = doc.createElement('tr'); if (cls) tr.className = cls;
    [desc, ref, (neg ? '− ' : '') + brl(val)].forEach(function (t, i) {
      var td = doc.createElement('td'); td.textContent = t; if (i) td.className = 'num'; tr.appendChild(td);
    });
    return tr;
  }
  function renderSlip(changed) {
    var heVal = Math.round(slip.he * (SAL / 220) * 1.5 * 100) / 100;
    var falta = slip.abonada ? 0 : SAL / 30, dsr = slip.abonada ? 0 : SAL / 30;
    var base = SAL + heVal - falta - dsr;
    var ins = inss(base);
    var desc = ins + falta + dsr + slip.vale + ADIANT;
    var net = SAL + heVal - desc;
    var tb = $('#slip-rows'); tb.textContent = '';
    tb.appendChild(row('Salário base', '30 dias', SAL));
    tb.appendChild(row('Horas extras 50%', slip.he + ' h', heVal, false, changed === 'he' ? 'flash' : ''));
    if (!slip.abonada) {
      tb.appendChild(row('Falta não abonada 14/10', '1 dia', falta, true, changed === 'abono' ? 'flash' : ''));
      tb.appendChild(row('DSR da semana da falta', '1 dia', dsr, true, changed === 'abono' ? 'flash' : ''));
    }
    tb.appendChild(row('INSS', '', ins, true, changed === 'he' || changed === 'abono' ? 'flash' : ''));
    tb.appendChild(row('Vales de mercadorias', 'assinados', slip.vale, true, changed === 'vale' ? 'flash' : ''));
    tb.appendChild(row('Adiantamento 15/10', '40%', ADIANT, true));
    $('#slip-net').textContent = brl(net);
    var notes = [];
    if (!slip.abonada) notes.push('Falta de 14/10 sem atestado: desconta o dia e o DSR (Lei 605/49, art. 6º).');
    var pct = Math.round(((desc - ins) / SAL) * 100);
    if (pct >= 60) notes.push('Descontos somam ' + pct + '% do salário. Perto de 70%, o sistema trava novos vales.');
    var nt = $('#slip-notice'); nt.hidden = !notes.length; nt.textContent = notes.join(' ');
    var st = $('#slip-status'), bt = $('#aprovar');
    if (slip.aprovado) {
      st.className = 'pill pill-ok';
      st.textContent = 'Liberado para Ana · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      bt.textContent = 'Desfazer aprovação';
    } else {
      st.className = 'pill pill-warn';
      st.textContent = changed && changed !== 'aprovar' && slip.foiAprovado ? 'Alterado: aprovar de novo' : 'Aguardando aprovação da empresa';
      bt.textContent = 'Aprovar holerite';
    }
  }
  function touch(k) { if (slip.aprovado) { slip.aprovado = false; slip.foiAprovado = true; } renderSlip(k); }
  $('#he').addEventListener('input', function (e) { slip.he = +e.target.value; $('#he-out').textContent = slip.he + ' h'; touch('he'); });
  $('#abono').addEventListener('change', function (e) { slip.abonada = e.target.checked; touch('abono'); });
  $('#vale').addEventListener('input', function (e) { slip.vale = +e.target.value; $('#vale-out').textContent = 'R$ ' + brl(slip.vale); touch('vale'); });
  $('#aprovar').addEventListener('click', function () { slip.aprovado = !slip.aprovado; if (slip.aprovado) slip.foiAprovado = true; renderSlip('aprovar'); });
  renderSlip();
  if (!reduce) $('.payslip').classList.add('drift');

  /* ---------- Documentos gerados ---------- */
  var docs = {
    contrato: { cls: '', html: '<h4>Contrato de experiência</h4><p class="muted">Contrato de trabalho por prazo determinado, na modalidade de experiência</p>' +
      '<span class="tag">Cláusulas sugeridas pelo Centralizar. Revise antes de assinar.</span>' +
      '<p><strong>Empregadora:</strong> Padaria Sol Ltda, CNPJ [00.000.000/0001-00], Criciúma/SC.<br><strong>Empregada:</strong> Ana Beatriz Souza, CPF [000.000.000-00].</p>' +
      '<ol><li>A empregada exercerá a função de atendente de balcão, com as atividades descritas na vaga.</li>' +
      '<li>O prazo é de 45 dias, de 03/11/2026 a 17/12/2026, prorrogável uma única vez até o limite de 90 dias (CLT, arts. 445, parágrafo único, e 451).</li>' +
      '<li>A jornada é de 44 horas semanais, de segunda a sábado, com registro de ponto pelo aplicativo (Portaria MTP 671/2021).</li>' +
      '<li>O salário mensal é de R$ 1.980,00, pago até o 5º dia útil do mês seguinte (CLT, art. 459, § 1º).</li>' +
      '<li>Vales de mercadorias só serão descontados com autorização prévia e por escrito da empregada (CLT, art. 462; Súmula 342 do TST).</li></ol>' +
      '<div class="sig"><span>Padaria Sol Ltda</span><span>Ana Beatriz Souza</span></div>' },
    advertencia: { cls: 'narrow', html: '<h4>Advertência disciplinar</h4><p class="muted">Padaria Sol Ltda · 04/11/2026</p>' +
      '<p><strong>Empregado:</strong> Marcos Lima, repositor.</p><p>Fica o empregado advertido pelo atraso de 47 minutos em 03/11/2026, sem justificativa, conforme registro de ponto às 07:47. A repetição poderá levar a medidas disciplinares mais graves.</p>' +
      '<span class="tag">Ciência no app em 04/11/2026 às 16:20</span><p class="muted">Se o empregado se recusar a assinar, duas testemunhas assinam abaixo.</p>' +
      '<div class="sig"><span>Testemunha 1</span><span>Testemunha 2</span></div>' },
    ponto: { cls: 'receipt', html: '<h4>Comprovante de registro de ponto</h4><p class="mono-num">NSR 000004812</p><p class="muted">Padaria Sol Ltda<br>CNPJ [00.000.000/0001-00]<br>Rua [endereço], Criciúma/SC</p>' +
      '<p><strong>Ana Beatriz Souza</strong><br>CPF ***.456.789-**</p><p class="label-price mono-num">07:58</p><p>05/11/2026 · entrada</p>' +
      '<p class="muted">Marcado no celular autorizado, com reconhecimento facial.<br>Programa registrado no INPI nº [a registrar].</p>' },
    etiqueta: { cls: 'receipt', html: '<div class="label-card"><strong>Pão de queijo congelado 1 kg</strong><span class="muted mono-num">Cód. PQ-1KG-042 · lote L2611-05</span>' +
      '<span class="muted">Validade 05/02/2027</span><div class="barcode" id="bc"></div><span class="label-price mono-num">R$ 32,90</span></div>' +
      '<p class="muted">Em estoque: 38 unidades · mínimo 20. O código é lido por qualquer leitor comum de código de barras.</p>' },
    checklist: { cls: 'narrow', html: '<h4>Checklist de abertura · salão</h4><p class="muted">05/11 · 06:30 · Joana Ribeiro</p>' +
      '<div class="check-row"><span class="box on" aria-label="feito"></span><span>Ligar fornos e conferir temperatura</span><span class="pill pill-ok">foto 06:41</span></div>' +
      '<div class="check-row"><span class="box on" aria-label="feito"></span><span>Higienizar balcão e vitrine</span><span class="pill pill-ok">foto 06:52</span></div>' +
      '<div class="check-row"><span class="box on" aria-label="feito"></span><span>Conferir validade dos frios</span><span class="pill pill-mute">sem foto</span></div>' +
      '<div class="check-row"><span class="box" aria-label="pendente"></span><span>Abrir o caixa com troco de R$ 200</span><span class="pill pill-warn">foto pendente</span></div>' +
      '<div class="check-row"><span class="box on" aria-label="feito"></span><span>Ligar a música ambiente</span><span class="pill pill-mute">sem foto</span></div>' +
      '<p class="muted">4 de 5 itens feitos · 2 de 3 fotos enviadas</p>' }
  };
  var sheet = $('#sheet');
  function showDoc(k, instant) {
    var d = docs[k];
    var paint = function () {
      sheet.className = 'sheet ' + d.cls; sheet.innerHTML = d.html;
      var bc = $('#bc', sheet); if (bc && window.Code39) bc.innerHTML = window.Code39.svg('PQ-1KG-042', 64);
    };
    if (instant || reduce) { paint(); return; }
    sheet.classList.add('fade');
    setTimeout(paint, 200);
  }
  $$('[data-doc]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-doc]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      showDoc(b.dataset.doc);
    });
  });
  showDoc('contrato', true);

  /* ---------- Admissão a três mãos ---------- */
  var admDocs = ['RG ou CNH|foto frente e verso', 'CPF|número validado na Receita', 'Comprovante de endereço|conta de luz de setembro', 'Carteira de Trabalho Digital|número e série', 'Conta para pagamento|chave PIX', 'Exame admissional (ASO)|clínica, 31/10'];
  var admStates = [
    { pill: ['pill-warn', 'Em preenchimento'], count: '5 de 6 enviados', val: 5, rows: function (i) { return i < 5 ? ['pill-mute', 'Enviado pelo candidato'] : ['pill-warn', 'Aguardando']; } },
    { pill: ['pill-warn', 'Conferida pelo contador'], count: '6 de 6 conferidos', val: 6, rows: function (i) { return i === 2 ? ['pill-warn', 'CEP corrigido pelo contador'] : i === 5 ? ['pill-ok', 'Anexado pelo contador'] : ['pill-ok', 'Conferido']; } },
    { pill: ['pill-ok', 'Pronta para o eSocial'], count: 'Contrato assinado pelas duas partes', val: 6, rows: function () { return ['pill-ok', 'Aprovado']; } }
  ];
  function renderAdm(s) {
    var st = admStates[s], box = $('#adm-rows'); box.textContent = '';
    admDocs.forEach(function (d, i) {
      var p = d.split('|'), r = st.rows(i);
      var div = doc.createElement('div'); div.className = 'doc-row';
      var a = doc.createElement('div'); a.textContent = p[0];
      var sm = doc.createElement('small'); sm.textContent = p[1]; a.appendChild(sm);
      var b = doc.createElement('span'); b.className = 'pill ' + r[0]; b.textContent = r[1];
      div.appendChild(a); div.appendChild(b); box.appendChild(div);
    });
    var pill = $('#adm-pill'); pill.className = 'pill ' + st.pill[0]; pill.textContent = st.pill[1];
    var pr = $('#adm-prog'); pr.value = st.val; pr.textContent = st.val + ' de 6';
    $('#adm-count').textContent = st.count;
  }
  renderAdm(0);
  var steps = $$('.step');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        steps.forEach(function (s) { s.classList.toggle('active', s === e.target); });
        renderAdm(+e.target.dataset.step);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Preços ---------- */
  var plans = {
    semente: { price: 'R$ 79', size: 'Até 10 funcionários', items: ['Admissão digital com o contador', 'Ponto no celular autorizado', 'Atestados e advertências com ciência', 'Holerite com aprovação da empresa'] },
    broto: { price: 'R$ 189', size: 'Até 30 funcionários', items: ['Tudo do Essencial', 'Pré-entrevista com aviso no WhatsApp', 'Contratos sugeridos editáveis em PDF', 'Checklists com foto por setor', 'Vales descontados em folha'] },
    arvore: { price: 'R$ 399', size: 'Até 80 funcionários', items: ['Tudo do Completo', 'Estoque, etiquetas e lista de compras', 'Ponto em aparelho fixo com rosto ou digital', 'Várias unidades e mais de um contador'] }
  };
  var nomesPlano = { semente: 'Essencial', broto: 'Completo', arvore: 'Total' };
  var stage = $('#plan-stage');
  function showPlan(k, instant) {
    var p = plans[k];
    var paint = function () {
      $('#plan-price').textContent = p.price; $('#plan-size').textContent = p.size;
      var ul = $('#plan-list'); ul.textContent = '';
      p.items.forEach(function (t) { var li = doc.createElement('li'); li.textContent = t; ul.appendChild(li); });
      $('#plan-cta').textContent = 'Começar com o ' + nomesPlano[k];
      stage.classList.remove('fade');
    };
    if (instant || reduce) { paint(); return; }
    stage.classList.add('fade'); setTimeout(paint, 200);
  }
  $$('[data-plan]').forEach(function (b) {
    var pick = function () {
      if (b.getAttribute('aria-selected') === 'true') return;
      $$('[data-plan]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      showPlan(b.dataset.plan);
    };
    b.addEventListener('click', pick); b.addEventListener('focus', pick);
  });
  showPlan('broto', true);

  /* ---------- Dúvidas: uma aberta por vez (fallback ao atributo name) ---------- */
  var dets = $$('.faq details');
  dets.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) dets.forEach(function (o) { if (o !== d) o.open = false; }); }); });

  /* ---------- Começar ---------- */
  var porte = $('#porte');
  porte.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    $$('button', porte).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    $('#porte-in').value = b.dataset.v;
  });

  /* ---------- Entradas ao rolar ---------- */
  $$('main h2:not(.sr-only), .faq details, .cta-copy, .dialog, .stage').forEach(function (el) { el.classList.add('rise'); });
  var rises = $$('.rise');
  if (!('IntersectionObserver' in window) || reduce) { rises.forEach(function (el) { el.classList.add('in'); }); return; }
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var sib = $$('.rise', e.target.parentElement).indexOf(e.target);
      e.target.style.transitionDelay = Math.min(Math.max(sib, 0), 6) * 70 + 'ms';
      e.target.classList.add('in'); seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  rises.forEach(function (el) { seen.observe(el); });

  // Tipo de negócio sugerido pelo nome digitado (o usuário pode trocar)
  (function () {
    var nome = document.getElementById('empresa'), tipo = document.getElementById('tipo'), mexeu = false;
    if (!nome || !tipo) return;
    tipo.addEventListener('change', function () { mexeu = true; });
    nome.addEventListener('input', function () {
      if (mexeu) return;
      var t = nome.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var R = [['recrutamento', /recrut|selecao|talent|headhunt|agencia de emprego/], ['hamburgueria', /burg|lanch|smash|sanduich|dog/], ['restaurante', /restaur|bistro|cantina|churrasc|grill|marmit|buffet|pizz/], ['padaria', /padar|panific|confeit|doce|bolo/], ['mercado', /mercad|supermerc|atacad|hortifrut|acougue/], ['metalurgica', /metal|usinag|caldeir|serralh|solda|industria/], ['confeccao', /confec|costur|malharia|textil|uniforme/], ['construtora', /constru|engenharia|obra|incorpor|empreit/], ['salao', /salao|beleza|barbear|estetica|studio|cabelo|unha/], ['oficina', /oficina|auto ?center|mecanic|funilar|autopec|borrach/], ['clinica', /clinic|odonto|dent|consultorio|sorriso/], ['escritorio', /contab|escritorio|assessoria|consultoria/], ['loja', /loja|moda|roupa|calcad|boutique/]];
      for (var i = 0; i < R.length; i++) if (R[i][1].test(t)) { tipo.value = R[i][0]; break; }
    });
  })();
})();
