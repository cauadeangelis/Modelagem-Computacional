// Executa as 100 equações no terminal real (Chromium), uma a uma, como um usuário:
// digita no campo, clica em "Resolver" e lê o que aparece na tela.
// Uso: node testar-terminal.mjs [url] [equacoes.json] [saida.json] [type|fill]
//   type = digita tecla por tecla (o ^ vira expoente); fill = cola o texto inteiro.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base = 'http://127.0.0.1:8000/index.html', eqFile = 'equacoes-100.json', outFile = 'resultados/v7-digitado.json', mode = 'type'] = process.argv;
const eqs = JSON.parse(fs.readFileSync(eqFile, 'utf8'));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {});
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pageErrors.push(m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(base + '#lab');
await page.waitForSelector('#source');
const out = [];
for (const eq of eqs) {
  const errsBefore = pageErrors.length;
  await page.fill('#source', '');
  if (mode === 'type') await page.type('#source', eq.input, { delay: 0 });
  else await page.fill('#source', eq.input);
  const t0 = Date.now();
  await page.click('#terminal-form button[type=submit]');
  await page.waitForFunction(() => document.querySelector('.result-shell, .alert'), null, { timeout: 15000 }).catch(() => {});
  const ms = Date.now() - t0;
  const r = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const txt = s => q(s)?.innerText.trim() ?? null;
    return {
      typed: q('#source')?.value ?? null,
      alert: txt('.alert'),
      method: txt('.result-shell h2'),
      status: txt('.result-shell .eyebrow'),
      answer: txt('.answer-result strong'),
      residual: document.querySelectorAll('.result-stats > div')[1]?.querySelector('strong')?.innerText ?? null,
      others: [...document.querySelectorAll('.root-list button')].map(b => b.innerText.trim()),
      echo: txt('.source-echo code'),
      search: txt('.search-meta'),
    };
  });
  out.push({ id: eq.id, ms, ...r, pageErrors: pageErrors.slice(errsBefore) });
  process.stdout.write(`${eq.id} `);
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('\nok', out.length, 'erros de página:', pageErrors.length);
await browser.close();
