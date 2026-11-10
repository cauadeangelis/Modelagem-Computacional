import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { abrir, BASE } from './comum.mjs';
const require = createRequire(import.meta.url), axe = require.resolve('axe-core/axe.min.js');
const { browser, ctx, page, erros } = await abrir({ reducedMotion: 'reduce', bypassCSP: true });
page.on('pageerror', e => console.error(e.stack));
try {
  await page.goto(BASE + '#lab');
  await page.selectOption('#algorithm', 'newton'); await page.fill('#source', 'x^2-2'); await page.fill('#a', '1'); await page.fill('#b', '2'); await page.fill('#x0', '1.6');
  await page.click('[data-act=ex-abrir][data-id=tatil]');
  assert.match(await page.locator('.ex-panel').innerText(), /Sua equação: x(?:\^2|²)-2/);
  const h = page.locator('[data-lt-handle=x0] circle'), box = await h.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 55, box.y + box.height / 2, { steps: 5 }); await page.mouse.up();
  assert.notEqual(await page.inputValue('#x0'), '1.6');
  await page.locator('#lt-x0').focus(); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.inputValue('#x0'), await page.inputValue('#lt-x0'));
  await page.click('[data-act=ex-abrir][data-id=pontos]'); await page.selectOption('#ex-metodo', 'simpson'); await page.click('[data-act=ex-pontos-calcular]');
  assert.match(await page.locator('.ex-panel').innerText(), /21[,.]33333333/);
  await page.fill('#ex-pontos', '0; 1\n0; 2'); await page.click('[data-act=ex-pontos-calcular]'); assert.match(await page.locator('.ex-panel [role=alert]').innerText(), /distinta/);
  await page.click('[data-act=ex-abrir][data-id=extras]'); assert.equal(await page.locator('[data-act=ex-extras]').getAttribute('aria-checked'), 'false');
  await page.click('[data-act=ex-extras]'); assert.equal(await page.locator('.ex-panel svg').count(), 1);
  await page.goto(BASE + '#academy'); assert.equal(await page.locator('[data-act=course][data-id=fixedpoint]').count(), 0);
  await page.goto(BASE + '#laboratorio'); await page.click('[data-act=lt-aba][data-id=fenomenos]');
  await page.click('[data-act=lt-fen][data-id=termica]'); await page.click('[data-act=ex-calor-celula]');
  assert.match(await page.locator('.lt-card').innerText(), /40 °C/);
  await page.click('[data-act=ex-calor-varredura]'); assert.match(await page.locator('.lt-card').innerText(), /Varreduras completas: 1/);
  await page.selectOption('#ex-dt', '2.5'); await page.click('[data-act=ex-euler]'); await page.click('[data-act=ex-euler]'); assert.match(await page.locator('.lt-card').innerText(), /200 °C/);
  await page.click('[data-act=lt-fen][data-id=drone]'); for (let i = 0; i < 6; i++) await page.click('[data-act=ex-drone-passo]'); assert.match(await page.locator('.lt-card').innerText(), /Colisão/);
  await page.click('[data-act=ex-drone-met][data-id=spline]'); for (let i = 0; i < 40; i++) await page.click('[data-act=ex-drone-passo]'); assert.match(await page.locator('.lt-card').innerText(), /Voo concluído/);
  await page.click('[data-act=lt-fen][data-id=comporta]'); await page.click('[data-act=lt-comp-met][data-id=newton]'); await page.fill('#ex-comp-x0', '-0.5'); await page.locator('#ex-comp-x0').dispatchEvent('change'); await page.click('[data-act=lt-comp-passo]'); assert.equal(await page.locator('.lt-fen.travou').count(), 1);
  await page.click('[data-act=lt-fen][data-id=trelica]'); await page.click('[data-act=lt-trel-passo]'); assert.match(await page.locator('.lt-fen').first().getAttribute('aria-label'), /varredura 1/);
  await page.goto(BASE + '#cases'); await page.click('[data-act=case][data-id=tank]');
  const pergunta = await page.locator('.quiz-q').innerText(); await page.click('[data-act=ex-missao]');
  assert.equal(await page.locator('.quiz-q').innerText(), pergunta); assert.equal(await page.locator('.lt-card').count(), 1);
  await page.goto(BASE + '#academy'); await page.click('[data-act=course][data-id=bisection]'); await page.click('[data-act=node][data-id=sim]'); await page.click('[data-act=start-node][data-id=sim]');
  await page.click('[data-act=ex-trilha][data-id=tatil]'); assert.match(await page.locator('.lt-card').innerText(), /Sua equação/);
  await page.goto(BASE + '#lab'); await page.click('[data-act=mode][data-id=system]'); await page.fill('#source', 'x+y=2\nx+y=2'); await page.click('[data-act=ex-abrir][data-id=linhas]'); await page.click('[data-act=lt-sens]'); assert.match(await page.locator('.ex-panel').innerText(), /Sistema singular/);
  await page.goto(BASE + '#laboratorio');
  // Cada nova aba em celular, claro/escuro e movimento reduzido, com axe WCAG AA.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tema of ['light', 'dark']) {
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), tema);
    for (const aba of ['pontos', 'precisao', 'extras', 'fenomenos']) {
      await page.click(`[data-act=lt-aba][data-id=${aba}]`);
      const fen = aba === 'fenomenos' ? ['comporta', 'trelica', 'termica', 'drone'] : [null];
      for (const f of fen) {
        if (f) await page.click(`[data-act=lt-fen][data-id=${f}]`);
        await page.addScriptTag({ path: axe });
        const violations = await page.evaluate(async () => (await window.axe.run('.lt-card', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
        assert.deepEqual(violations, [], `${tema}/${aba}/${f}: ${JSON.stringify(violations)}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${aba}/${f} sem rolagem lateral`);
      }
    }
  }
  await page.click('[data-act=lt-fen][data-id=termica]'); await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); }); await page.screenshot({ path: 'tests/rendered/experimentos-termica-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 }); await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); }); await page.screenshot({ path: 'tests/rendered/experimentos-termica-desktop.png', fullPage: true });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; }); await page.reload(); await ctx.setOffline(true); await page.reload();
  await page.click('[data-act=lt-aba][data-id=pontos]'); await page.fill('#ex-pontos', '0;0\n1;1\n2;4'); await page.selectOption('#ex-metodo', 'simpson'); await page.click('[data-act=ex-pontos-calcular]'); assert.match(await page.locator('.lt-card').innerText(), /2[,.]66666667/);
  assert.deepEqual(erros, []); console.log('Experimentos: fluxos, arraste, teclado, limites físicos, responsividade, axe claro/escuro e offline PASS');
} finally { await browser.close(); }
