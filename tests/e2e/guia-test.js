const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const L = x => console.log('> ' + x), W = (ms = 400) => p.waitForTimeout(ms), txt = async (s) => ((await p.textContent(s).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  await p.goto('http://localhost:8765/app.html?exemplo=1'); await W(700); L('exemplo (fictício) abre o guia sozinho? ' + !!(await p.$('.overlay')));
  await p.click('.hub-pe [data-act="em-branco"]'); await W(300); await p.click('form[data-form="em-branco"] button[type=submit]'); await W(500);
  const S = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /prototipo-v8:/.test(k) && JSON.parse(localStorage.getItem(k)).real))); return { checklists: s.checklists.length, equip: s.bp ? s.bp.equip.length : '-', pessoas: s.pessoas.length, turnos: s.turnos.length, modelos: s.modelosCt.length, produtos: s.produtos.length, vagas: s.vagas.length }; });
  L('empresa nova: ' + JSON.stringify(S));
  await p.reload(); await W(1200);
  L('ao entrar: ' + (await txt('#m-t')) + ' | ' + (await txt('.modal-body')).slice(0, 220) + ' | rodapé: ' + await txt('.modal-foot'));
  await p.screenshot({ path: path.join(__dirname, 'p5', 'guia.png') });
  await p.click('.modal-foot [data-act="guia-ir"]'); await W(500); L('começar → ' + p.url().split('#')[1] + ' | ' + await txt('#view h1'));
  await p.keyboard.press('Escape'); await W(200);
  await p.click('#guia-btn'); await W(300); await p.uncheck('[data-in="guia-entrar"]'); await W(300); L('desmarcou: ' + await txt('.toast')); await p.click('[data-act="fechar"]');
  await p.reload(); await W(1200); L('entrar de novo, guia aberto? ' + !!(await p.$('.overlay')) + ' | botão no alto: ' + await p.isVisible('#guia-btn'));
  await p.click('#guia-btn'); await W(300); await p.click('.guia-lista li:nth-child(3) [data-act="guia-ir"]'); await W(800); L('passo 3 (Turnos) → ' + p.url().split('#')[1] + ' | janela: ' + await txt('#m-t'));
  await p.click('[data-act="fechar"]'); await W(200);
  await p.goto('http://localhost:8765/app.html?exemplo=1#/checklists'); await W(500); L('checklists: ' + (await txt('#view')).slice(0, 160));
  await p.goto('http://localhost:8765/app.html?exemplo=1#/boas'); await W(500); L('boas práticas: ' + (await txt('#view')).slice(0, 200));
  if (await p.$('[data-act="bp-ativo"]')) { await p.click('[data-act="bp-ativo"]'); await W(400); L('ativou: ' + (await txt('#view')).slice(0, 200)); }
  if (await p.$('[data-act="bp-eq-mod"]')) { await p.click('[data-act="bp-eq-mod"][data-n="Geladeira"]'); await W(400); L('modelo Geladeira: ' + await txt('.toast') + ' | form temp: ' + !!(await p.$('form[data-form="temp"]'))); await p.fill('#beq-n', 'Freezer da cozinha'); await p.selectOption('#beq-t', 'congelado'); await p.click('form[data-form="bp-eq"] button'); await W(300); L('próprio: ' + await txt('.toast')); }
  await p.screenshot({ path: path.join(__dirname, 'p5', 'boas.png'), fullPage: true });
  L('ERROS: ' + (errs.length ? errs.join(' | ') : 'nenhum')); await b.close();
})();
