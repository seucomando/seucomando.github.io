// Versão em funcionamento (modo em branco, sem dados de exemplo): os 8 itens do pedido de 18/11.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['camera', 'geolocation'], geolocation: { latitude: -28.6775, longitude: -49.3697, accuracy: 15 }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('seucomando-guia:todas', 'nao'); } catch (e) {} }); const p = await ctx.newPage(); const errs = []; const L = x => console.log('> ' + x);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/service worker|sw\.js|Content Security/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 150)); });
  const base = 'http://localhost:8765/', W = (ms = 400) => p.waitForTimeout(ms), toast = async () => ((await p.$('.toast')) ? (await p.textContent('.toast')).trim() : '');
  const papel = async (r) => { await p.selectOption('#role', r); await W(300); };
  const marcar = async () => { await p.click('[data-act="marcar"]'); await p.waitForSelector('#cam-ok:not([disabled])', { timeout: 15000 }); await p.click('#cam-ok'); await p.waitForSelector('.overlay', { state: 'detached', timeout: 8000 }).catch(async () => { L('  !! modal ficou: ' + await p.textContent('.modal')); await p.click('[data-act="fechar"]'); }); await W(300); };
  await p.goto(base + 'app.html?exemplo=1'); await W(800);
  await p.click('.hub-pe [data-act="em-branco"]'); await W(300); await p.fill('form[data-form="em-branco"] input[name="n"]', 'Padaria Real Teste').catch(() => {}); await p.click('form[data-form="em-branco"] button[type=submit]'); await W(800);
  // 1) Dados da empresa em aba própria
  await p.goto(base + 'app.html?exemplo=1#/empresa'); await W(500);
  L('1 aba Dados da empresa: ' + (await p.textContent('#view h1')) + ' | no menu: ' + await p.isVisible('#nav a[href="#/empresa"]'));
  await p.click('#co-btn'); await W(200); await p.click('.co-op[data-act="empresa-editar"]'); await W(300); L('  ícone da empresa abre: ' + (await p.textContent('#m-t')));
  await p.fill('#ed-c', '11.111.111/1111-11'); await p.click('form[data-form="empresa-dados"] button[type=submit]'); await W(200); L('  CNPJ errado: ' + await toast());
  await p.fill('#ed-r', 'Padaria Real Ltda'); await p.fill('#ed-c', '11222333000181'); await p.fill('#ed-e', 'Rua Henrique Lage, 100'); await p.fill('#ed-ci', 'Criciúma/SC'); await p.fill('#ed-rn', 'Rafael de Oliveira');
  await p.click('form[data-form="empresa-dados"] button[type=submit]'); await W(300); L('  salvo: ' + await toast()); await p.click('#co-btn'); await W(200); await p.click('.co-op[data-act="empresa-editar"]'); await W(300); L('  CNPJ: ' + await p.inputValue('#ed-c')); await p.click('[data-act="fechar"]');
  await p.click('[data-act="aba"][data-v="regras"]'); await W(250);
  await p.click('[data-act="usar-local"]'); await W(800); L('  local: ' + await toast());
  await p.fill('#pc-r', '150'); await p.click('form[data-form="ponto-cfg"] button[type=submit]'); await W(300); L('  regras: ' + await toast());
  // 3) Turnos
  (await p.$('[data-act="aba"][data-v="turnos"]:not([aria-selected="true"])') ? await p.click('[data-act="aba"][data-v="turnos"]') : 0); await p.waitForTimeout(200); await p.click('[data-act="turno-editar"]'); await W(300); await p.fill('#tu-n', 'Comercial'); await p.click('[data-act="wiz-prox"]'); await p.fill('#tu-je', '08:00'); await p.fill('#tu-js', '17:48'); await p.click('[data-act="wiz-prox"]');
  await p.click('[data-act="iv-add"][data-v="fixo"]'); const ti = await p.$$('[data-iv] input[type=time]'); await ti[0].fill('12:00'); await ti[1].fill('13:00'); await p.click('[data-act="wiz-prox"]'); await W(200);
  await p.click('form[data-form="turno"] .wiz-nav button[type=submit]'); await W(300); L('3 turno: ' + await toast());
  L('  tabela de turnos: ' + (await p.textContent('#view tbody')).replace(/\s+/g, ' ').slice(0, 160));
  // Equipe: pessoa com turno e pessoa com horário manual
  await p.goto(base + 'app.html?exemplo=1#/equipe'); await W(400);
  L('  Equipe sem formulário da empresa: ' + !(await p.$('#view form[data-form="empresa-dados"]')));
  const cadastra = async (nome, cpf, turno, manual) => {
    await p.click('[data-act="pessoa-editar"]:not([data-id])'); await W(300); await p.fill('#pe-n', nome); await p.fill('#pe-c', cpf); await p.fill('#pe-f', 'Atendente'); await p.fill('#pe-sa', '1900');
    await p.selectOption('#pe-tu', turno); await W(200);
    if (manual) { L('  campos manuais aparecem: ' + await p.isVisible('[data-manual]')); await p.fill('#pe-je', '14:00'); await p.fill('#pe-js', '20:00'); const mi = await p.$$('[data-manual] [data-iv] input[type=time]'); await mi[0].fill('18:00'); await mi[1].fill('18:15'); await W(100); L('  conferência manual: ' + (await p.textContent('[data-conf]')).replace(/\s+/g, ' ').slice(0, 140)); }
    await p.click('form[data-form="pessoa"] button[type=submit]'); await W(300);
  };
  const tid = await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /prototipo-v8:/.test(k)))).turnos[0].id);
  await cadastra('Maria Souza Lima', '529.982.247-25', tid, false); await cadastra('João Pedro Alves', '111.444.777-35', '', true);
  L('  equipe: ' + (await p.textContent('#view tbody')).replace(/\s+/g, ' ').slice(0, 200));
  // 4 e 6) Ponto real: sem histórico fictício, com câmera e localização
  await p.goto(base + 'app.html?exemplo=1#/ponto'); await W(500);
  L('4 ponto do dia (sem nada fictício): ' + (await p.textContent('#view tbody')).replace(/\s+/g, ' ').slice(0, 220));
  await p.click('[data-act="aba"][data-v="marcar"]'); await W(200);
  await p.selectOption('#pp', { label: 'Maria Souza Lima' }); await W(200); await marcar();
  L('6 aparelho da empresa marcou: ' + await toast());
  L('  comprovante: ' + (await p.textContent('.receipt')).replace(/\s+/g, ' ').slice(0, 240));
  (await p.$('[data-act="aba"][data-v="hoje"]:not([aria-selected="true"])') ? await p.click('[data-act="aba"][data-v="hoje"]') : 0); await p.waitForTimeout(200); await p.click('[data-act="ponto-espelho"]'); await W(400); L('  espelho: ' + (await p.textContent('.modal tbody')).replace(/\s+/g, ' ').slice(0, 160) + ' | foto: ' + !!(await p.$('.modal [data-act="arq-ver"]')));
  await p.click('.modal [data-act="arq-ver"]'); await W(600); L('  abre a foto: ' + !!(await p.$('.arq-box img'))); await p.click('[data-act="fechar"]'); await W(200);
  const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null); await p.click('[data-act="ponto-csv"]'); const d = await dl; L('  planilha: ' + (d ? d.suggestedFilename() : 'sem download (salvarArquivo)'));
  // funcionário pelo celular
  await papel('funcionario'); await p.goto(base + 'app.html?exemplo=1#/ponto'); await W(500);
  L('  funcionário vê: ' + (await p.textContent('#view .title-row')).replace(/\s+/g, ' ').slice(0, 140));
  await marcar(); L('6 celular: ' + await toast() + ' | ' + (await p.textContent('.receipt')).replace(/\s+/g, ' ').match(/Local:[^P]*/));
  await ctx.setGeolocation({ latitude: -28.70, longitude: -49.37, accuracy: 15 }); await marcar(); L('  longe da empresa: ' + (await p.textContent('#view .linha-dia')).replace(/\s+/g, ' ').slice(0, 200));
  // 5) Documentos do funcionário
  await p.goto(base + 'app.html?exemplo=1#/documentos'); await W(400);
  L('5 meus documentos: ' + (await p.textContent('#view h1')) + ' | tipos: ' + (await p.$$('.doc-tipo')).length);
  await p.setInputFiles('[data-in="doc-enviar"][data-tipo="rg"]', path.join(__dirname, 'rg.png')); await W(1500); L('  envio: ' + await toast());
  await p.setInputFiles('[data-in="doc-enviar"][data-tipo="residencia"]', path.join(__dirname, 'holerite.pdf')); await W(1200);
  L('  situação: ' + (await p.textContent('.kpis')).replace(/\s+/g, ' '));
  // 7) Compras sem total para o funcionário
  await p.goto(base + 'app.html?exemplo=1#/compras'); await W(400); await p.fill('#cn', 'Guardanapo'); await p.click('form[data-form="cmp-novo"] button[type=submit]'); await W(300);
  L('7 funcionário vê total? ' + /Total estimado|Subtotal|R\$/.test(await p.textContent('#view')));
  // 8) Holerite real: contador envia, empresa aprova, funcionário recebe
  await papel('contador'); await p.goto(base + 'app.html?exemplo=1#/holerites'); await W(400);
  L('8 contador vê: ' + (await p.textContent('#view .title-row')).replace(/\s+/g, ' ').slice(0, 120) + ' | linhas: ' + (await p.textContent('#view tbody')).replace(/\s+/g, ' ').slice(0, 120));
  await p.setInputFiles('[data-in="hol-enviar"]', path.join(__dirname, 'holerite.pdf')); await W(1200); L('  contador enviou: ' + await toast());
  await papel('empresa'); await p.goto(base + 'app.html?exemplo=1#/inicio'); await W(400);
  L('  início da empresa: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 420));
  await p.goto(base + 'app.html?exemplo=1#/documentos'); await W(400); await p.click('[data-act="doc-ok"]'); await W(400); L('5 empresa aprova documento: ' + await toast());
  await p.click('[data-act="doc-nao"]'); await W(300); await p.fill('#dn-m', 'Comprovante sem data'); await p.click('form[data-form="doc-nao"] button[type=submit]'); await W(400); L('  recusa com motivo: ' + await toast());
  await p.goto(base + 'app.html?exemplo=1#/holerites'); await W(400); await p.click('[data-act="hol-liberar-todos"]'); await W(400); L('8 empresa aprova: ' + await toast());
  await papel('funcionario'); await p.goto(base + 'app.html?exemplo=1#/holerites'); await W(400); L('  funcionário recebe: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 160));
  await p.goto(base + 'app.html?exemplo=1#/inicio'); await W(400); L('  início do funcionário: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 220));
  // 2) Modelos de contrato
  await papel('empresa'); await p.goto(base + 'app.html?exemplo=1#/contratos'); await W(500); await p.click('[data-act="ct-tab"][data-v="gerar"]'); await W(400);
  await p.click('[data-act="ct-salvar-modelo"]'); await W(300); await p.click('form[data-form="ct-modelo-salvar"] button[type=submit]'); await W(400); L('2 modelo do gerador: ' + await toast());
  await p.fill('#mt-n', 'Contrato próprio da padaria'); await p.fill('#mt-x', 'CONTRATO DE TRABALHO\n\nEmpregador: {{empresa}}, CNPJ {{cnpj}}.\n\nEmpregado(a): {{nome}}, CPF {{cpf}}, na função de {{funcao}}, com salário de {{salario}}.');
  await p.click('form[data-form="ct-modelo-texto"] button[type=submit]'); await W(300); L('  modelo próprio: ' + await toast());
  await p.click('[data-act="ct-aplicar"] >> nth=1'); await W(300); await p.check('form[data-form="ct-aplicar"] input[name="p"] >> nth=0'); await p.check('form[data-form="ct-aplicar"] input[name="p"] >> nth=1');
  await p.click('form[data-form="ct-aplicar"] button[type=submit]'); await W(400); L('  aplicado: ' + await toast());
  L('  contratos da equipe: ' + (await p.textContent('#view tbody')).replace(/\s+/g, ' ').slice(0, 200));
  await p.click('[data-act="ct-ver"] >> nth=0'); await W(500); L('  contrato preenchido: ' + (await p.textContent('.docview')).replace(/\s+/g, ' ').match(/Empregado\(a\):[^.]*\./));
  await p.click('[data-docact="fechar"]'); await W(200);
  await p.setInputFiles('[data-in="ct-assinado"] >> nth=0', path.join(__dirname, 'holerite.pdf')); await W(1200); L('  assinado: ' + await toast());
  await p.click('[data-act="ct-tab"][data-v="modelos"]'); await W(300); await p.click('[data-act="ct-aplicar"] >> nth=0'); await W(300); await p.check('form[data-form="ct-aplicar"] input[name="p"] >> nth=0'); await p.click('form[data-form="ct-aplicar"] button[type=submit]'); await W(400);
  await p.click('[data-act="ct-ver"] >> nth=0'); await W(500); L('  modelo do gerador com o nome: ' + /Maria Souza Lima/.test(await p.textContent('.docview')) + ' | sem [NOME]: ' + !/\[NOME DO EMPREGADO\]/.test(await p.textContent('.docview')));
  await p.click('[data-docact="fechar"]'); await W(200);
  await p.screenshot({ path: 'v2-contratos.png' });
  await p.goto(base + 'app.html?exemplo=1#/empresa'); await W(400); await p.screenshot({ path: 'v2-empresa.png', fullPage: true });
  await papel('funcionario'); await p.goto(base + 'app.html?exemplo=1#/documentos'); await W(400); L('  funcionário vê contrato: ' + /Meus contratos/.test(await p.textContent('#view')) + ' | ' + (await p.textContent('.kpis')).replace(/\s+/g, ' '));
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(base + 'app.html?exemplo=1#/ponto'); await W(400); await p.screenshot({ path: 'v2-ponto-celular.png', fullPage: true });
  L('ERROS: ' + (errs.length ? errs.join(' | ') : 'nenhum'));
  await b.close();
})();
