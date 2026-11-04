// Verifica, sem pulos, se todas as portas de fase são alcançáveis a pé a partir do oeste do riacho inicial,
// com portões e névoas abertos (estado de fim de jogo). Usa Playwright como tests/browser-smoke.cjs.
const assert = require('node:assert/strict'), path = require('node:path');
const ROOT = path.join(__dirname, '../../dist/jogos/calculandia');
let playwright; try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch { playwright = require(path.join(__dirname, '../e2e/node_modules/playwright')); }
const CHROME = process.env.CHROMIUM_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
(async () => {
  const browser = await playwright.chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('http://localhost:8080/**', async (route) => { let p = new URL(route.request().url()).pathname; if (p === '/') p = '/index.html'; await route.fulfill({ path: path.join(ROOT, decodeURIComponent(p)), contentType: ({ html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' })[p.split('.').pop()] || 'text/plain' }); });
  await page.goto('http://localhost:8080/?debug=1');
  await page.waitForFunction(() => window.G?.mode === 'title', null, { timeout: 120000 });
  const res = await page.evaluate(async () => {
    const { isWalkable } = await import('/codigo/mundo/chao.js');
    for (const c of G.collision.dynamic) c.enabled = false; // portões, névoa e prefeitura abertos
    const S = 0.5, N = Math.round(280 / S), H = 140;
    const idx = (i, j) => j * N + i;
    const seen = new Uint8Array(N * N);
    const ok = (i, j) => { const x = -H + i * S, z = -H + j * S; return isWalkable(x, z) && !G.collision.blocked(x, z, 0.45); };
    const start = [Math.round((-20 + H) / S), Math.round((86 + H) / S)];
    const q = new Int32Array(N * N); let qh = 0, qt = 0;
    q[qt++] = idx(...start); seen[idx(...start)] = 1;
    while (qh < qt) {
      const k = q[qh++], i = k % N, j = (k / N) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= N || b >= N) continue;
        const kk = idx(a, b);
        if (seen[kk]) continue;
        seen[kk] = 2;
        if (ok(a, b)) { seen[kk] = 1; q[qt++] = kk; }
      }
    }
    const reach = (x, z, r = 2.2) => { for (let dx = -r; dx <= r; dx += S) for (let dz = -r; dz <= r; dz += S) { const i = Math.round((x + dx + H) / S), j = Math.round((z + dz + H) / S); if (seen[idx(i, j)] === 1) return true; } return false; };
    const missing = [];
    for (const s of G.settlements) for (const [n, B] of Object.entries(s.buildings)) if (!reach(B.door.x, B.door.z)) missing.push(`${s.def.id}-${n}`);
    return { cells: qt, missing };
  });
  console.log(JSON.stringify(res));
  assert.deepEqual(res.missing, [], 'portas inalcançáveis a pé');
  assert.deepEqual(errors, []);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
