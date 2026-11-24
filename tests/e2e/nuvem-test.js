const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const fake = fs.readFileSync(__dirname + '/fake-supabase.js', 'utf8');
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] }); const ctx = await b.newContext({ permissions: ['camera', 'geolocation'], geolocation: { latitude: -28.6775, longitude: -49.3697, accuracy: 15 }, viewport: { width: 1280, height: 900 } }); await ctx.addInitScript(fake);
  await ctx.addInitScript(() => { try { localStorage.setItem('seucomando-guia:todas', 'nao'); } catch (e) {} }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Content Security|service worker|sw\.js/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  const W = (ms = 300) => p.waitForTimeout(ms); const L = []; const _push = L.push.bind(L); L.push = (x) => { console.log('> ' + x); return _push(x); }; const toast = async () => ((await p.textContent('.toast').catch(() => '')) || '').trim();
  const base = 'http://localhost:8765/';
  // 1) cria a conta da empresa
  await p.goto(base + 'entrar.html#criar'); await W(500);
  await p.fill('#cr-nome', 'Daniel de Oliveira'); await p.fill('#cr-email', 'daniel@teste.com'); await p.fill('#cr-s1', 'senha1234'); await p.fill('#cr-s2', 'senha1234'); await p.fill('#cr-emp', 'D Burger'); await p.selectOption('#cr-tipo', 'hamburgueria'); await p.check('input[name=termos]');
  await p.click('#f-criar button[type=submit]'); await p.waitForURL(/app\.html/, { waitUntil: 'domcontentloaded' }); await W(1200);
  L.push('após criar: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 110));
  // 2) equipe: cadastra pessoa, torna gerente, gera código
  await p.goto(base + 'app.html#/equipe'); await W(500);
  await p.click('[data-act="pessoa-editar"]'); await W(); await p.fill('#pe-n', 'Paula Henrique Rocha'); await p.fill('#pe-c', '529.982.247-25'); await p.fill('#pe-f', 'Gerente'); await p.fill('#pe-s', 'Gestão'); await p.fill('#pe-sa', '3800');
  await p.click('form[data-form="pessoa"] button[type=submit]'); await W(400);
  await p.click('[data-act="pessoa-editar"]'); await W(); await p.fill('#pe-n', 'Joana Ribeiro Lima'); await p.fill('#pe-c', '111.444.777-35'); await p.fill('#pe-f', 'Atendente'); await p.fill('#pe-s', 'Salão');
  await p.click('form[data-form="pessoa"] button[type=submit]'); await W(400);
  await p.evaluate(() => { location.hash = '#/acessos'; }); await W();
  const pid = await p.$$eval('[data-act="acesso-editar"]', a => a[0].dataset.id);
  await p.click(`[data-act="acesso-editar"][data-id="${pid}"]`); await W(); await p.check('input[name=papel][value=gerente]'); await p.check('input[name=perm][value=banco]'); await p.check('input[name=perm][value=ponto]'); await p.click('form[data-form="acesso"] button[type=submit]'); await W(400);
  await p.click(`[data-act="acesso-editar"][data-id="${pid}"]`); await W(); await p.click('[data-act="gerar-acesso"]'); await W(600);
  const codigo = (await p.textContent('.codigo')).trim(); L.push('código: ' + codigo); await p.keyboard.press('Escape'); await W();
  // 3) vaga e candidatura pública
  await p.goto(base + 'app.html#/vagas'); await W(400); await p.click('[data-act="vaga-nova"]'); await W(); await p.fill('#vn-t', 'Chapeiro'); await p.fill('#vn-s', '2200'); await p.click('form[data-form="vaga-nova"] button[type=submit]'); await W(1200);
  const link = await p.$eval('a[href*="triagem.html"]', a => a.getAttribute('href')); L.push('link pré-entrevista: ' + link);
  const c = await ctx.newPage(); c.on('pageerror', e => errs.push('triagem: ' + e.message)); await c.goto(base + link); await c.waitForTimeout(800);
  L.push('triagem título: ' + await c.textContent('#t-vaga'));
  await c.fill('#t-nome', 'Caio Martins Silva'); await c.fill('#t-fone', '(48) 9 9999-1111'); await c.fill('#t-bairro', 'Centro, Criciúma'); await c.check('input[name=regime][value=clt]'); await c.check('input[name=turnos][value=noite]');
  for (const [s, v] of [['#t-fer', 'sim'], ['#t-inicio', 'imediato'], ['#t-km', '5'], ['#t-transp', 'moto'], ['#t-pret', 'a2200'], ['#t-exp', '2'], ['#t-ja', 'nao'], ['#t-esc', 'mc']]) await c.selectOption(s, v);
  for (const r of await c.$$eval('#t-reqs input[value=sim]', x => x.map(i => i.name))) await c.check(`input[name=${r}][value=sim]`);
  await c.fill('#t-sit', 'Peço desculpas e refaço o lanche na hora.'); await c.check('input[name=verdade]'); await c.click('button[type=submit]'); await c.waitForTimeout(800);
  L.push('candidato: ' + await c.textContent('#t-ok-tit')); await c.close();
  // 4) sai e faz o primeiro acesso do gerente
  await p.goto(base + 'app.html#/inicio'); await W(800); await p.click('#co-btn'); await W(200); await p.click('.co-op[data-act="sair"]'); await p.waitForURL(/entrar\.html/, { waitUntil: 'domcontentloaded' }); await W(400);
  await p.goto(base + 'entrar.html#primeiro'); await W(400);
  await p.fill('#pr-cpf', '529.982.247-25'); await p.fill('#pr-cod', codigo); await p.fill('#pr-s1', 'gerente123'); await p.fill('#pr-s2', 'gerente123'); await p.click('#f-primeiro button[type=submit]'); await p.waitForURL(/app\.html/, { waitUntil: 'domcontentloaded' }); await W(1500);
  L.push('gerente vê: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').slice(0, 120));
  L.push('menu gerente: ' + JSON.stringify(await p.$$eval('#nav a', a => a.filter(x => !x.hidden).map(x => x.textContent.trim().replace(/\d+$/, '')))));
  await p.goto(base + 'app.html#/ponto'); await W(600);
  if (await p.$('#bh-h')) { await p.fill('#bh-h', '1'); await p.fill('#bh-x', 'Ficou no fechamento do caixa'); await p.click('form[data-form="banco"] button[type=submit]'); await W(1200); L.push('gerente lança banco: ' + await toast()); } else L.push('gerente SEM formulário de banco');
  (await p.$('[data-act="aba"][data-v="marcar"]:not([aria-selected="true"])') ? await p.click('[data-act="aba"][data-v="marcar"]') : 0); await p.waitForTimeout(200); await p.click('[data-act="marcar"]'); await p.waitForSelector('#cam-ok:not([disabled])', { timeout: 15000 }); await p.click('#cam-ok'); await p.waitForSelector('.overlay', { state: 'detached', timeout: 15000 }); await W(300); L.push('gerente bate ponto: ' + await toast() + ' / cam: ' + (await p.$('#cam-st') ? await p.textContent('#cam-st') : 'fechou'));
  const evs = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-db')).eventos.map(e => e.ops.map(o => o.k + (o.l ? ':' + o.l : '')).join(',')));
  L.push('eventos enviados: ' + JSON.stringify(evs));
  await p.click('#co-btn'); await W(200); await p.click('.co-op[data-act="sair"]'); await p.waitForURL(/entrar\.html/, { waitUntil: 'domcontentloaded' }); await W(300);
  // 5) dono entra de novo: aplica eventos e importa candidatura
  await p.click('[data-quem="adm"]'); await p.fill('#en-login', 'daniel@teste.com'); await p.fill('#en-senha', 'senha1234'); await p.click('#f-entrar button[type=submit]'); await p.waitForURL(/app\.html/, { waitUntil: 'domcontentloaded' }); await W(2000);
  await p.goto(base + 'app.html#/banco'); await W(600);
  L.push('dono vê banco: ' + ((await p.textContent('#banco')).replace(/\s+/g, ' ').match(/lançado por [^·]*/) || ['nada'])[0]);
  await p.goto(base + 'app.html#/ponto'); await W(500);
  L.push('ponto do gerente: ' + (await p.textContent('#view tbody tr')).replace(/\s+/g, ' ').slice(0, 80));
  await p.goto(base + 'app.html#/vagas'); await W(500); L.push('candidato importado: ' + ((await p.textContent('#view')).match(/Caio Martins Silva/) ? 'sim' : 'não'));
  await p.goto(base + 'app.html#/registro'); await W(500); L.push('registro: ' + (await p.textContent('#view')).replace(/\s+/g, ' ').match(/Registro de alterações.{0,200}/)[0]);
  const db = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('fake-sb-db')); return { versao: d.empresas[0].versao, membros: d.membros.map(m => m.papel + ':' + (m.permissoes || []).join('+')), docs: d.docs_funcionario.map(x => x.pessoa_id + ' pessoas=' + x.dados.pessoas.length), eventos: d.eventos.map(e => e.resultado), auditoria: d.auditoria.length }; });
  L.push('banco falso: ' + JSON.stringify(db)); L.push('candidaturas: ' + JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-db')).candidaturas.map(c => c.vaga_id + ' imp=' + !!c.importado_em)))); L.push('vagas no doc: ' + JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-db')).empresas[0].dados.vagas.map(v => v.id + ':' + v.cands.length))));
  await p.screenshot({ path: out + '/nuvem-equipe.png' });
  console.log(L.join('\n')); console.log('ERROS:', errs.length ? [...new Set(errs)].join(' | ') : 'nenhum'); await b.close();
})();
