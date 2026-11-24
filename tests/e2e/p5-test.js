const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['camera', 'geolocation'], geolocation: { latitude: -28.6775, longitude: -49.3697, accuracy: 15 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('seucomando-guia:todas', 'nao'); } catch (e) {} }); const p = await ctx.newPage(); const errs = []; const L = x => console.log('> ' + x);
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  const base = 'http://localhost:8765/', W = (ms = 400) => p.waitForTimeout(ms), toast = async () => ((await p.$('.toast')) ? (await p.textContent('.toast')).trim() : '');
  const txt = async (s) => ((await p.textContent(s, { timeout: 4000 }).catch(e => '[sem ' + s + ']')) || '').replace(/\s+/g, ' ').trim();
  const shot = async (n, full) => p.screenshot({ path: path.join(__dirname, 'p5', n + '.png'), fullPage: !!full });
  const vai = async (h) => { await p.goto(base + 'app.html?exemplo=1#/' + h); await W(500); };
  const papel = async (r) => { await p.selectOption('#role', r); await W(300); };
  const hm = async (min) => p.evaluate((m) => { const o = {}; new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(Date.now() + m * 60000)).forEach(x => o[x.type] = x.value); return o.hour + ':' + o.minute; }, min);
  require('fs').mkdirSync(path.join(__dirname, 'p5'), { recursive: true });

  await p.goto(base + 'app.html?exemplo=1'); await W(700); await p.click('.hub-pe [data-act="em-branco"]'); await W(300); await p.click('form[data-form="em-branco"] button[type=submit]'); await W(800); await vai('inicio');
  L('1 início em branco: passos=' + !!(await p.$('.passos')) + ' setores=' + (await p.$$('.setor')).length + ' | ' + (await txt('.passos .passos-prog')));
  await shot('inicio-empresa', true);

  await vai('empresa'); await p.click('[data-act="turno-editar"]'); await W(400);
  L('2 assistente do turno: passo=' + await txt('.wiz-barra [aria-current="step"]') + ' | botões: ' + (await p.$$eval('.wiz-nav button', bs => bs.filter(x => !x.hidden).map(x => x.textContent))).join(','));
  await p.click('[data-act="turno-preset"][data-i="0"]'); await W(400);
  L('  modelo Comercial → passo ' + await p.getAttribute('form.wiz', 'data-p') + ' | ' + (await txt('[data-conf]')).slice(0, 220));
  await shot('turno-conferir');
  await p.click('.wiz-nav button[type=submit]'); await W(400); L('  salvar: ' + await toast());

  await p.click('[data-act="turno-editar"]:not([data-id])'); await W(400);
  await p.click('[data-act="wiz-prox"]'); await W(200); L('3 continuar sem nome: passo=' + await p.getAttribute('form.wiz', 'data-p'));
  await p.fill('#tu-n', 'Noite com dois intervalos'); await p.click('[data-act="wiz-prox"]'); await W(200);
  await p.fill('#tu-je', '22:00'); await p.fill('#tu-js', '06:00'); await W(100); L('  aviso da virada: ' + await p.isVisible('[data-noite]'));
  await p.click('[data-act="wiz-prox"]'); await W(200); L('  dica: ' + await txt('[data-iv-dica]'));
  await p.click('[data-act="iv-add"][data-v="fixo"]'); await W(100); const ivs = await p.$$('[data-iv] input[type=time]'); await ivs[0].fill('01:00'); await ivs[1].fill('01:30');
  await p.click('[data-act="iv-add"][data-v="flex"]'); await W(100); await p.selectOption('[data-iv]:last-child select', '15');
  await p.click('[data-act="wiz-prox"]'); await W(300); L('  conferência: ' + (await txt('[data-conf]')).slice(0, 400));
  await shot('turno-inconsistente');
  await p.click('.wiz-nav button[type=submit]'); await W(300); L('  salvar sem ciência: ' + await toast());
  await p.check('[name="jac"]'); await p.click('.wiz-nav button[type=submit]'); await W(400); L('  salvar com ciência: ' + await toast());
  L('  tabela de turnos: ' + (await txt('#view table tbody')).slice(0, 420));
  await shot('empresa', true);

  await vai('equipe');
  for (const [n, f] of [['Maria Souza Lima', 'Atendente'], ['João Pedro Alves', 'Padeiro']]) {
    await p.click('[data-act="pessoa-editar"]:not([data-id])'); await W(300); await p.fill('#pe-n', n); await p.fill('#pe-f', f); await p.fill('#pe-s', 'Atendimento');
    if (n.startsWith('João')) { await p.selectOption('#pe-tu', ''); await W(200); L('  horário próprio aberto: ' + await p.isVisible('[data-manual]') + ' | conf: ' + (await txt('[data-conf]')).slice(0, 120)); }
    await p.click('form[data-form="pessoa"] button[type=submit]'); await W(400); L('4 cadastro ' + n.split(' ')[0] + ': ' + await toast());
  }

  await papel('funcionario'); await vai('inicio');
  L('5 início funcionário: ' + (await txt('.proximo')).slice(0, 120) + ' | setores=' + (await p.$$('.setor')).length);
  await shot('inicio-funcionario', true);
  await vai('ponto'); L('  linha do dia: ' + (await txt('.linha-dia')).slice(0, 200));
  for (let i = 0; i < 4; i++) {
    const bt = await txt('[data-act="marcar"]'); const alt = (await p.$('[data-act="marcar-alt"]')) ? await txt('[data-act="marcar-alt"]') : '';
    await p.click('[data-act="marcar"]'); await p.waitForSelector('#cam-ok:not([disabled])', { timeout: 15000 }); const tit = await txt('#m-t'); await p.click('#cam-ok'); await p.waitForSelector('.overlay', { state: 'detached', timeout: 15000 }); await W(300);
    L('  ' + bt + ' [' + tit + '] (alt: ' + (alt || '-') + ') → ' + await toast());
  }
  L('  depois: ' + await txt('[data-act="marcar"]') + ' | ' + (await txt('.linha-dia')).slice(0, 240));
  await shot('ponto-funcionario', true);

  await papel('empresa'); await vai('ponto'); L('6 tabela do ponto: ' + (await txt('#view tbody tr')).slice(0, 160));
  await p.click('[data-act="ponto-espelho"]'); await W(400); L('  espelho: ' + (await txt('.modal thead')) + ' || ' + (await txt('.modal tbody tr')).slice(0, 360));
  await shot('espelho');
  if (await p.$('[data-act="ponto-ciente"]')) { await p.click('[data-act="ponto-ciente"]'); await W(400); L('  ciente: ' + await toast() + ' | ' + ((await txt('.modal tbody tr')).match(/Mantido por[^·]*/) || [''])[0]); }
  await p.click('[data-act="fechar"]'); await W(200);

  await vai('checklists'); L('7 checklists de empresa nova: ' + (await txt('#view')).slice(0, 140));
  await p.click('.title-row [data-act="ck-editar"], [data-act="ck-editar"]'); await W(400);
  await p.fill('#ck-n', 'Teste de abertura'); await p.fill('#ck-s', 'Atendimento'); await p.fill('#ck-i', await hm(-60)); await p.fill('#ck-l', await hm(60));
  await p.click('[data-act="wiz-prox"]'); await W(200);
  L('  etapa fechada mostra só o texto: ' + (await p.isHidden('[data-et] .et-mais')) + ' | botões visíveis: ' + (await p.$$eval('[data-et] button', bs => bs.filter(b => b.offsetParent).map(b => b.textContent))).join(','));
  await p.fill('[data-et] [name=et_t]', 'Abrir as portas');
  await p.click('[data-act="et-add"]'); await W(100); let rows = await p.$$('[data-et]'); await (await rows[1].$('[name=et_t]')).fill('Foto do balcão limpo'); await (await rows[1].$('[data-act="et-cfg"]')).click(); await W(100); await (await rows[1].$('select')).selectOption('1'); await W(100);
  L('  etiqueta da etapa configurada: ' + await rows[1].$eval('.et-tags', e => e.textContent));
  await p.click('[data-act="et-add"]'); await W(100); rows = await p.$$('[data-et]'); await (await rows[2].$('[name=et_t]')).fill('Ligar o forno'); await (await rows[2].$('[data-act="et-cfg"]')).click(); await (await rows[2].$('[name=et_l]')).fill(await hm(-10));
  await (await rows[2].$('[data-act="et-mover"][data-d="-1"]')).click(); await W(100);
  L('  ordem depois de subir: ' + (await p.$$eval('[data-et] [name=et_t]', xs => xs.map(x => x.value))).join(' > '));
  await (await (await p.$$('[data-et]'))[1].$('[data-act="et-mover"][data-d="1"]')).click(); await W(100);
  await shot('checklist-editor');
  await p.click('[data-act="wiz-prox"]'); await W(300); L('  resumo: ' + (await txt('[data-ckresumo]')).slice(0, 260));
  await p.click('.wiz-nav button[type=submit]'); await W(400); L('  salvar: ' + await toast());
  L('  tela do checklist: ' + (await txt('.ck-wrap')).slice(0, 320));
  await shot('checklist-limpo', true);
  await p.click('[data-act="ck-marcar"][data-e]'); await W(500); L('  etapa 1: ' + await toast());
  await p.click('.ck-etapa.agora [data-act="ck-marcar"]'); await p.waitForSelector('#ck-ok:not([disabled])', { timeout: 15000 }); L('  câmera traseira aberta, sem galeria: ' + !(await p.$('.modal input[type=file]')));
  await p.click('#ck-ok'); await p.waitForSelector('.overlay', { state: 'detached', timeout: 15000 }); await W(300); L('  etapa 2 (foto): ' + await toast());
  await p.click('[data-act="ck-editar-escolha"]'); await W(300); L('  editar pergunta: ' + await txt('.modal-body'));
  await p.click('[data-act="ck-editar"][data-escopo="hoje"]'); await W(300); L('  só hoje: ' + await txt('#m-t') + ' | ' + await txt('.wiz-barra'));
  await p.click('[data-act="wiz-prox"]'); await W(200); await p.click('[data-act="et-add"]'); await W(100); rows = await p.$$('[data-et]'); await (await rows[rows.length - 1].$('[name=et_t]')).fill('Receber o pão do fornecedor');
  await p.click('[data-act="wiz-prox"]'); await W(200); L('  resumo de hoje: ' + (await txt('[data-ckresumo]')).slice(0, 200)); await p.click('.wiz-nav button[type=submit]'); await W(400); L('  salvar hoje: ' + await toast() + ' | ' + (await txt('.ck-topo')).slice(0, 120));
  await p.click('.ck-etapa.agora [data-act="ck-marcar"]'); await W(300); L('  etapa atrasada pede justificativa: ' + !!(await p.$('#ck-j')));
  await p.click('#ck-ok'); await W(200); L('  sem justificativa: ' + await toast());
  await p.fill('#ck-j', 'O gás acabou e foi trocado'); await p.click('#ck-ok'); await p.waitForSelector('.overlay', { state: 'detached', timeout: 15000 }); await W(300); L('  etapa 3: ' + await toast());
  await p.click('.ck-etapa.agora [data-act="ck-marcar"]'); await W(500); L('  etapa só de hoje: ' + await toast());
  await shot('checklist', true);
  await p.click('[data-act="ck-hist"]'); await W(300); L('  histórico: ' + await p.$eval('.cal-agora', e => e.className + ' | ' + e.getAttribute('aria-label')));
  await shot('checklist-historico');
  await p.click('.cal-agora'); await W(300); L('  dia: ' + (await txt('.modal-body')).slice(0, 320) + ' | ' + await txt('.modal-foot'));
  await p.click('.modal-foot [data-act="ck-hist"]'); await W(300); await p.click('[data-act="ck-cal"][data-v="todos"]'); await W(300); L('  todos: ' + await txt('#m-t')); await p.click('[data-act="fechar"]');
  await p.click('[data-act="ck-hoje-desfazer"]'); await W(300); L('  voltar ao normal: ' + await toast() + ' | ' + (await txt('.ck-prog')));

  await vai('contratos'); await shot('contratos'); L('8 contratos: cartões=' + (await p.$$('.acao-card')).length + ' | ' + (await txt('.acao-card.acao-prim')));
  await p.click('.acao-card.acao-prim'); await W(300); await p.fill('#mt-n', 'Contrato de experiência'); await p.fill('#mt-x', 'Contrato de experiência entre {{empresa}} e {{nome}}, CPF {{cpf}}, na função de {{funcao}}.'); await p.click('form[data-form="ct-modelo-texto"] button[type=submit]'); await W(300);
  await p.click('.acao-card.acao-prim'); await W(400); L('  assistente: ' + await txt('.wiz-barra'));
  await p.click('[data-act="wiz-prox"]'); await W(200); L('  sem pessoa: ' + await toast() + ' | passo ' + await p.getAttribute('form.wiz', 'data-p'));
  await p.check('[name=p] >> nth=0'); await p.click('[data-act="wiz-prox"]'); await W(200); await p.click('[data-act="wiz-prox"]'); await W(300);
  L('  resumo: ' + (await txt('[data-ctresumo]')).slice(0, 200)); await shot('contrato-wiz');
  await p.click('.wiz-nav button[type=submit]'); await W(400); L('  gerar: ' + await toast() + ' | ' + (await txt('.mini-passos')).slice(0, 140));

  await vai('empresa?aba=regras'); await p.check('[name=rosto]'); await p.click('form[data-form="ponto-cfg"] button[type=submit]'); await W(300); L('9 rosto ligado: ' + await toast());
  await vai('ponto'); await p.click('[data-act="aba"][data-v="marcar"]'); await W(250); const jo = await p.$eval('#pp option:nth-child(2)', o => o.value); await p.selectOption('#pp', jo); await W(300);
  await p.click('[data-act="marcar"]'); await W(300); L('  janela: ' + await txt('#m-t') + ' | passos: ' + await txt('.cam-passos'));
  await p.waitForFunction(() => /Posicione|encontrado|Não foi possível/.test((document.querySelector('#rosto-st') || {}).textContent || ''), null, { timeout: 30000 }).catch(() => {});
  L('  reconhecimento: ' + await txt('#rosto-st') + ' | botão desabilitado: ' + await p.$eval('#cam-ok', b => b.disabled));
  await shot('rosto-cadastro'); await p.click('[data-act="fechar"]');

  await p.setViewportSize({ width: 390, height: 844 }); await vai('inicio'); await shot('mobile-inicio', true); await vai('checklists'); await shot('mobile-checklist', true);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth); L('10 celular: largura da página ' + larg);
  L('ERROS: ' + (errs.length ? errs.join(' | ') : 'nenhum')); await b.close();
})();
