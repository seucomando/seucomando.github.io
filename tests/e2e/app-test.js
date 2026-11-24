const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const p = await b.newPage({ permissions: ['camera', 'geolocation'], geolocation: { latitude: -28.6775, longitude: -49.3697, accuracy: 15 }, viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://localhost:8765/app.html?empresa=Mercado%20%3Cb%3EBom%3C/b%3E#/inicio');
  await p.waitForTimeout(800);
  const coName = await p.textContent('#co-name');
  const routes = ['inicio','vagas','admissoes','contratos','ponto','ocorrencias','checklists','holerites','vales','estoque'];
  const shots = { empresa: ['inicio','vagas','holerites','contratos'], funcionario: ['inicio','ocorrencias'] };
  for (const role of ['empresa','contador','funcionario']) {
    await p.selectOption('#role', role); await p.waitForTimeout(150);
    for (const r of routes) {
      await p.evaluate(h => location.hash = h, '#/' + r); await p.waitForTimeout(200);
      const h1 = await p.textContent('#view h1').catch(() => 'SEM H1');
      process.stdout.write(`${role}/${r}: ${h1.trim()}\n`);
      if ((shots[role]||[]).includes(r)) await p.screenshot({ path: `${out}/${role}-${r}.png` });
    }
  }
  // ações
  await p.selectOption('#role', 'empresa');
  await p.evaluate(() => location.hash = '#/vagas'); await p.waitForTimeout(200);
  await p.click('[data-act="ent-ok"]'); await p.waitForTimeout(200); await p.waitForTimeout(150);
  await p.evaluate(() => location.hash = '#/holerites'); await p.waitForTimeout(200);
  await p.click('[data-act="aprovar-todos"]'); await p.waitForTimeout(150);
  await p.evaluate(() => location.hash = '#/ponto'); await p.waitForTimeout(200);
  await p.click('[data-act="aba"][data-v="marcar"]'); await p.waitForTimeout(200);
  await p.click('[data-act="marcar"]'); await p.waitForSelector('#cam-ok:not([disabled])', { timeout: 15000 }); await p.click('#cam-ok'); await p.waitForTimeout(1500);
  const recibo = await p.textContent('.receipt').catch(() => 'sem recibo');
  await p.evaluate(() => location.hash = '#/vales'); await p.waitForTimeout(200);
  await p.click('[data-act="novo-vale"]'); await p.fill('#vd', '<img src=x onerror=alert(1)>'); await p.fill('#vv', '30'); await p.click('.modal button[type="submit"]'); await p.waitForTimeout(200);
  const xss = await p.evaluate(() => document.querySelectorAll('#view img[src="x"]').length);
  await p.evaluate(() => location.hash = '#/estoque'); await p.waitForTimeout(200);
  await p.check('[data-in="etq"][data-id="p1"]'); await p.waitForTimeout(200);
  const bars = await p.evaluate(() => document.querySelectorAll('#labels svg rect').length);
  await p.screenshot({ path: `${out}/empresa-estoque.png` });
  await p.evaluate(() => location.hash = '#/checklists'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/empresa-checklists.png` });
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => location.hash = '#/inicio'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/mobile-inicio.png` });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('empresa exibida:', coName, '| recibo:', recibo.slice(0, 60), '| XSS injetado:', xss, '| barras code39:', bars, '| estouro lateral 390px:', overflow);
  console.log('ERROS:', errs.length ? errs.join('\n') : 'nenhum');
  await b.close();
})();
