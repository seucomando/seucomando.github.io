const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Content Security Policy/.test(m.text())) errs.push(m.text()); });
  const W = (ms = 200) => p.waitForTimeout(ms);
  const toast = async () => (await p.textContent('.toast').catch(() => '') || '').trim();
  const baixar = async (arq) => {
    await p.waitForSelector('.docview [data-docact="pdf"]');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('.docview [data-docact="pdf"]')]);
    await dl.saveAs(`${out}/${arq}`); await W(200); await p.click('.docview [data-docact="fechar"]'); await W(200); return dl.suggestedFilename();
  };
  const L = [];
  // 1) landing: hamburgueria pelo nome
  await p.goto('http://localhost:8765/index.html#comecar'); await W(600);
  await p.fill('#empresa', 'Hamburgueria do Daniel'); await W(100);
  L.push('tipo sugerido: ' + await p.$eval('#tipo', e => e.value));
  await p.click('#start button[type=submit]'); await p.waitForURL(/app\.html/); await W(700);
  const eq = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('centralizar-prototipo-v8:hamburgueria')); return { tipo: s.tipo, nome: s.empresa.nome, razao: s.empresa.razao, time: s.pessoas.map(x => x.funcao).join(', '), prods: s.produtos.slice(0, 3).map(x => x.nome).join(', ') }; });
  L.push('hamburgueria: ' + JSON.stringify(eq));
  await p.screenshot({ path: out + '/h-inicio.png' });
  L.push('ponto agora: ' + (await p.textContent('#view')).match(/pelo ponto das \d\d:\d\d/));
  // 2) boas práticas
  await p.goto('http://localhost:8765/app.html#/boas'); await W(500);
  await p.screenshot({ path: out + '/h-boas.png', fullPage: true });
  await p.selectOption('#bt-eq', 'q1'); await p.fill('#bt-t', '7,2'); await p.click('form[data-form="temp"] button[type=submit]'); await W(250);
  L.push('fora sem ação: ' + await toast());
  await p.fill('#bt-a', 'Porta da geladeira ajustada; conferido de novo em 15 min'); await p.click('form[data-form="temp"] button[type=submit]'); await W(250);
  L.push('fora com ação: ' + await toast());
  await p.click('[data-act="aba"][data-v="docs"]'); await W(200);
  await p.click('[data-act="bp-feito"][data-id="m6"]'); await W(250); L.push('caixa-dágua: ' + await toast());
  await p.click('[data-act="bp-planilha"]'); await W(300); L.push('planilha: ' + await baixar('planilha-temperaturas.pdf'));
  // 3) cursos (empresa)
  await p.goto('http://localhost:8765/app.html#/cursos'); await W(500);
  await p.screenshot({ path: out + '/h-cursos.png', fullPage: true });
  await p.click('[data-act="cert"][data-p="e4"][data-c="higiene"]'); await W(300); await p.screenshot({ path: out + '/h-cert.png' });
  L.push('certificado: ' + await baixar('certificado-e4-higiene.pdf'));
  // 4) funcionário faz um curso
  await p.selectOption('#role', 'funcionario'); await W(300);
  await p.goto('http://localhost:8765/app.html#/cursos'); await W(400);
  await p.click('[data-act="curso-abrir"][data-c="recebimento"]'); await W(250);
  for (let i = 0; i < 3; i++) { await p.click('.curso-aula .btn-primary'); await W(200); }
  for (const [i, v] of [1, 0, 1, 1].entries()) await p.check(`input[name=q${i}][value="${v}"]`);
  await p.screenshot({ path: out + '/f-quiz.png', fullPage: true });
  await p.click('form[data-form="quiz"] button[type=submit]'); await W(300);
  L.push('resultado: ' + (await p.textContent('#view h2.sec')).trim());
  await p.click('[data-act="cert"]'); await W(300); L.push('cert funcionário: ' + await baixar('certificado-funcionario.pdf'));
  await p.goto('http://localhost:8765/app.html#/boas'); await W(400); await p.screenshot({ path: out + '/f-boas.png' });
  await p.selectOption('#role', 'empresa'); await W(300);
  // 5) contrato com função interna
  await p.goto('http://localhost:8765/app.html#/contratos'); await W(500); await p.click('[data-act="ct-tab"][data-v="gerar"]'); await W(400);
  await p.selectOption('#c-alvo', 'e3'); await W(300);
  L.push('cláusula 1: ' + (await p.textContent('#paper section.cl p')).slice(0, 170));
  // 6) restaurante pelo seletor
  await p.goto('http://localhost:8765/index.html#comecar'); await W(400);
  await p.fill('#empresa', 'Sabor da Serra'); await p.selectOption('#tipo', 'restaurante'); await p.click('#start button[type=submit]'); await p.waitForURL(/app\.html/); await W(600);
  const r = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('centralizar-prototipo-v8:restaurante')); return { tipo: s.tipo, nome: s.empresa.nome, time: s.pessoas.map(x => x.funcao).join(', '), vaga: s.vagas[0].titulo, ck: s.checklists[1].etapas[1].t }; });
  L.push('restaurante: ' + JSON.stringify(r));
  await p.goto('http://localhost:8765/app.html#/vagas'); await W(400); await p.screenshot({ path: out + '/r-vagas.png' });
  await p.goto('http://localhost:8765/app.html#/ponto'); await W(400);
  L.push('ponto restaurante: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 220));
  console.log(L.join('\n')); console.log('ERROS:', errs.length ? errs.join(' | ') : 'nenhum'); await b.close();
})();
