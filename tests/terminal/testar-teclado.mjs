// Testa o teclado científico clicando nas teclas, como um usuário, e tira capturas.
// Uso: node testar-teclado.mjs [url] [pasta-das-capturas] [saida.json]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base = 'http://127.0.0.1:8000/index.html', shots = 'resultados/capturas', outJson = 'resultados/teclado-v7.json'] = process.argv;
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {});
const errors = [];
async function open(viewport, scheme = 'light', touch = false) {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(base + '#lab'); await page.waitForSelector('.calc-pad');
  return { ctx, page };
}
const D = { width: 1366, height: 900 }, Mo = { width: 390, height: 844 };
const { ctx, page } = await open(D);
const val = () => page.$eval('#source', el => el.value);
const status = () => page.$eval('.calc-check', el => el.textContent);
const keys = async seq => { for (const k of seq) { if (k.startsWith('"')) await page.keyboard.type(k.slice(1, -1)); else await page.click(`[data-calc="${k}"]`); } };
const solve = async () => { await page.click('#terminal-form button[type=submit]'); await page.waitForTimeout(80); return page.evaluate(() => ({ answer: document.querySelector('.answer-result strong')?.innerText, others: [...document.querySelectorAll('.root-list button')].map(b => b.innerText), alert: document.querySelector('.alert')?.innerText, echo: document.querySelector('.source-echo code')?.innerText })); };
const results = [];
async function scenario(name, seq, expectText, expectRoots) {
  await page.click('[data-calc="clear"]');
  await page.click('#source');
  await keys(seq);
  const text = await val(), st = await status();
  const r = await solve();
  const roots = r.answer ? [r.answer.replace('x ≈ ', ''), ...r.others] : [];
  const okText = expectText === null || text === expectText;
  const okRoots = expectRoots === null || expectRoots.every(e => roots.some(g => Math.abs(Number(g.replace(/\./g, '').replace(',', '.')) - e) < 1e-6 * (1 + Math.abs(e))));
  results.push({ name, text, status: st, answer: r.answer, others: r.others.length, alert: r.alert?.slice(0, 80), ok: okText && okRoots && !r.alert });
}
// [nome, teclas, texto esperado, raízes esperadas]
await scenario('x²⁰ só com teclas', ['vx', 'pow', 'd2', 'd0', 'minus', 'd3', 'vx', 'pow', 'd1', 'd0', 'plus', 'd2', 'eq', 'd0'], 'x²⁰ - 3x¹⁰ + 2 = 0', [1, -1, 1.0717734625, -1.0717734625]);
await scenario('x² e x³ prontos', ['sq', 'minus', 'd5', 'vx', 'plus', 'd6', 'eq', 'd0'], 'x² - 5x + 6 = 0', [2, 3]);
await scenario('xⁿ sem base insere x', ['pow', 'd3', 'minus', 'vx', 'minus', 'd2', 'eq', 'd0'], 'x³ - x - 2 = 0', [1.5213797068]);
await scenario('eˣ com expoente negativo', ['exp', 'minus', 'vx', 'eq', 'vx'], 'e⁻ˣ = x', [0.5671432904]);
await scenario('10ˣ', ['ten', 'vx', 'eq', 'd5', 'd0'], '10ˣ = 50', [Math.log10(50)]);
await scenario('raiz quadrada', ['sqrt', 'vx', 'plus', 'd8', 'out', 'eq', 'vx', 'minus', 'd1'], '√(x + 8) = x - 1', [4.5413812651]);
await scenario('seno após x (insere ·)', ['vx', 'sin', 'vx', 'out', 'eq', 'd4'], 'x·sin(x) = 4', null);
await scenario('π e decimal', ['vx', 'times', 'pi', 'eq', 'd1', 'dot', 'd5'], 'x·π = 1,5', [1.5 / Math.PI]);
await scenario('expoente fracionário', ['vx', 'pow', 'open', 'd1', 'div', 'd3', 'close', 'eq', 'd3'], 'x¹ᐟ³ = 3', [27]);
await scenario('expoente com soma', ['d2', 'pow', 'open', 'vx', 'plus', 'd1', 'close', 'eq', 'd3', 'd2'], '2ˣ⁺¹ = 32', [4]);
await scenario('inverso', ['vx', 'inv', 'plus', 'vx', 'eq', 'd3'], 'x⁻¹ + x = 3', [0.3819660113, 2.6180339887]);
await scenario('ln e log', ['ln', 'vx', 'out', 'plus', 'log', 'vx', 'out', 'eq', 'd2'], 'ln(x) + log(x) = 2', [Math.exp(2 / (1 + 1 / Math.LN10))]);
await scenario('módulo', ['abs', 'vx', 'minus', 'd9', 'out', 'eq', 'd5'], 'abs(x - 9) = 5', [4, 14]);
await scenario('apagar dentro do expoente', ['vx', 'pow', 'd2', 'd5', 'del', 'd0', 'minus', 'd1', 'eq', 'd0'], 'x²⁰ - 1 = 0', [1, -1]);
await scenario('sistema com ↵', ['d2', 'vx', 'plus', 'vy', 'eq', 'd5', 'line', 'vx', 'plus', 'd3', 'vy', 'eq', 'd6'], '2x + y = 5\nx + 3y = 6', null);
await scenario('teclado físico com ^', ['"x^3 - x - 2 = 0"'], 'x³ - x - 2 = 0', [1.5213797068]);
await scenario('teclado físico e^(sin(x)) (fallback)', ['"e^sin(x) = 2"'], 'e^sin(x) = 2', [Math.asin(Math.log(2))]);
await scenario('arco seno e e', ['asin', 'vx', 'out', 'eq', 'e', 'div', 'd4'], 'asin(x) = e÷4', [Math.sin(Math.E/4)]);
await scenario('torre de potência', ['"2^x^2 = 16"'], null, [2, -2]);
const sys = await page.evaluate(() => document.querySelector('.answer-result strong')?.innerText);
// Interação com o resto do app: exemplos, histórico, ajuda.
await page.click('[data-act="example"][data-index="0"]');
const ex = await val();
await page.click('[data-act="history"]');
const hist = await page.$$eval('.history code', els => els.slice(0, 3).map(e => e.textContent));
await page.locator('#terminal-form').screenshot({ path: `${shots}/lab-desktop.png` });
await page.click('[data-calc="clear"]'); await keys(['vx', 'pow', 'd2', 'd0']);
await page.locator('#terminal-form').screenshot({ path: `${shots}/lab-desktop-expoente.png` });
await keys(['minus', 'd3', 'vx', 'pow', 'd1', 'd0', 'plus', 'd2', 'eq', 'd0']); await solve();
await page.screenshot({ path: `${shots}/lab-desktop-resultado.png`, fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await ctx.close();
for (const [name, vp, scheme, touch] of [['lab-mobile', Mo, 'light', true], ['lab-dark', D, 'dark', false], ['lab-mobile-dark', Mo, 'dark', true]]) {
  const o = await open(vp, scheme, touch);
  await o.page.click('[data-calc="clear"]');
  for (const k of ['vx', 'pow', 'd2', 'd0', 'minus', 'd3', 'vx', 'pow', 'd1', 'd0', 'plus', 'd2', 'eq', 'd0']) await o.page.click(`[data-calc="${k}"]`);
  const im = await o.page.$eval('#source', el => el.getAttribute('inputmode'));
  const ov = await o.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await o.page.evaluate(() => { const f = document.getElementById('terminal-form'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 70); }); await o.page.waitForTimeout(100); await o.page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
  console.log(name, 'inputmode=', im, 'overflowX=', ov);
  await o.ctx.close();
}
fs.writeFileSync(outJson, JSON.stringify(results, null, 1));
console.log(results.filter(r => r.ok).length + ' de ' + results.length + ' cenários do teclado OK');
for (const r of results) console.log((r.ok ? 'OK  ' : 'ERRO') + ' ' + r.name + ' → ' + JSON.stringify(r.text));
console.log('exemplo:', JSON.stringify(ex), '| histórico:', JSON.stringify(hist), '| overflowX desktop:', overflow, '| erros JS:', errors.length, errors.slice(0, 3));
await browser.close();
