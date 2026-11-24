const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(p.url().split('#')[1] + ': ' + e.message));
  const W = (ms = 200) => p.waitForTimeout(ms); const L = [];
  const rotas = ['inicio', 'c/contratar', 'c/equipe', 'c/dia', 'c/folha', 'c/compras', 'c/alimentos', 'vagas', 'admissoes', 'contratos', 'equipe', 'acessos', 'registro', 'empresa', 'ponto', 'atestados', 'advertencias', 'checklists', 'holerites', 'vales', 'banco', 'estoque', 'compras', 'boas', 'cursos', 'busca'];
  await p.goto('http://localhost:8765/app.html?empresa=Hamburgueria%20Teste&tipo=hamburgueria#/inicio'); await W(600);
  // gerente no exemplo
  await p.selectOption('#role', 'gerente'); await W(300);
  L.push('menu gerente: ' + JSON.stringify(await p.$$eval('#nav a', a => a.filter(x => !x.hidden).map(x => x.textContent.trim().replace(/\d+$/, '')))));
  await p.goto('http://localhost:8765/app.html#/banco'); await W(300);
  await p.fill('#bh-h', '2'); await p.fill('#bh-x', 'Fechamento do mês'); await p.click('form[data-form="banco"] button[type=submit]'); await W(250);
  L.push('banco: ' + await p.textContent('.toast'));
  await p.click('[data-act="banco-estornar"]'); await W(250); L.push('estorno: ' + await p.textContent('.toast'));
  await p.selectOption('#role', 'funcionario'); await W(300); await p.goto('http://localhost:8765/app.html#/banco'); await W(300);
  L.push('funcionário vê banco: ' + (await p.textContent('#banco')).replace(/\s+/g, ' ').slice(0, 120));
  await p.selectOption('#role', 'empresa'); await W(300);
  await p.goto('http://localhost:8765/app.html#/registro'); await W(300);
  L.push('auditoria: ' + (await p.textContent('#view')).match(/Banco de horas[^·]*/g).slice(0, 2).join(' | '));
  // começar em branco e percorrer as telas
  await p.goto('http://localhost:8765/app.html#/inicio'); await W(300);
  await p.click('.hub-pe [data-act="em-branco"]'); await W(200); await p.fill('#eb-n', 'D Burger Teste'); await p.click('form[data-form="em-branco"] button[type=submit]'); await W(400);
  for (const role of ['empresa', 'contador', 'gerente', 'funcionario']) {
    await p.selectOption('#role', role); await W(200);
    for (const r of rotas) { await p.goto('http://localhost:8765/app.html#/' + r); await W(120); }
  }
  await p.selectOption('#role', 'empresa'); await W(200);
  await p.goto('http://localhost:8765/app.html#/equipe'); await W(300);
  await p.click('.title-row [data-act="pessoa-editar"]'); await W(200);
  await p.fill('#pe-n', 'Carlos Silva Souza'); await p.fill('#pe-c', '529.982.247-25'); await p.fill('#pe-f', 'Chapeiro'); await p.fill('#pe-s', 'Cozinha'); await p.fill('#pe-sa', '2200');
  await p.click('form[data-form="pessoa"] button[type=submit]'); await W(250); L.push('pessoa: ' + await p.textContent('.toast'));
  await p.goto('http://localhost:8765/app.html#/acessos'); await W(300);
  const pid = await p.$eval('[data-act="acesso-editar"]', x => x.dataset.id);
  await p.click(`[data-act="acesso-editar"][data-id="${pid}"]`); await W(200); await p.check('input[name=papel][value=gerente]'); await p.check('input[name=perm][value=banco]'); await p.click('form[data-form="acesso"] button[type=submit]'); await W(250);
  await p.click(`[data-act="acesso-editar"][data-id="${pid}"]`); await W(200); await p.click('[data-act="gerar-acesso"]'); await W(250); L.push('código: ' + await p.textContent('.codigo'));
  await p.keyboard.press('Escape'); await W(150);
  await p.goto('http://localhost:8765/app.html#/vagas'); await W(300); await p.click('[data-act="vaga-nova"]').catch(() => L.push('sem botão nova vaga')); await W(200);
  if (await p.$('#vn-t')) { await p.fill('#vn-t', 'Atendente'); await p.fill('#vn-s', '1900'); await p.click('form[data-form="vaga-nova"] button[type=submit]'); await W(250); L.push('vaga: ' + await p.textContent('.toast')); }
  await p.goto('http://localhost:8765/app.html#/estoque'); await W(300); await p.click('[data-act="prod-novo"]').catch(() => L.push('sem botão novo produto')); await W(200);
  if (await p.$('#pn-n')) { await p.fill('#pn-n', 'Pão de brioche'); await p.click('form[data-form="prod-novo"] button[type=submit]'); await W(250); L.push('produto: ' + await p.textContent('.toast')); }
  for (const role of ['empresa', 'contador', 'gerente', 'funcionario']) { await p.selectOption('#role', role); await W(200); for (const r of rotas) { await p.goto('http://localhost:8765/app.html#/' + r); await W(120); } }
  await p.goto('http://localhost:8765/app.html#/equipe'); await W(300); await p.screenshot({ path: out + '/equipe.png' });
  console.log(L.join('\n')); console.log('ERROS (' + errs.length + '):\n' + [...new Set(errs)].slice(0, 25).join('\n')); await b.close();
})();
