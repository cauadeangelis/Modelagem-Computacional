// v16: a região 1 com perguntas fixas, rota em ordem (1ª … 9ª casa e o chefão, 10º) e os números no mapa.
// Joga a rota inteira no navegador: múltipla escolha nas verdes, Lagrange no terminal nas azuis (expressões),
// Gauss-Seidel um x de cada vez nas vermelhas e o chefão do Silo (digita o x final).
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const ROOT = path.join(__dirname, '../../dist/jogos/calculandia'), DIST = path.join(__dirname, '../../dist');
let playwright; try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch { playwright = require(path.join(__dirname, '../e2e/node_modules/playwright')); }
const CHROME = process.env.CHROMIUM_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const browser = await playwright.chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('http://localhost:8080/**', async (route) => { let p = new URL(route.request().url()).pathname; if (p === '/') p = '/index.html'; const local = path.join(ROOT, decodeURIComponent(p)); await route.fulfill({ path: fs.existsSync(local) ? local : path.join(DIST, decodeURIComponent(p)), contentType: ({ html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' })[p.split('.').pop()] || 'text/plain' }); });
  await page.goto('http://localhost:8080/?debug=1'); await page.waitForFunction(() => window.G?.mode === 'title');
  await page.evaluate(async () => { const { Progress } = await import('/codigo/sistemas/progresso.js'), { freshSave } = await import('/codigo/sistemas/salvamento.js'); G.progress = new Progress(freshSave()); document.getElementById('title').classList.add('hidden'); G.progress.d.tutorial = 6; G.progress.d.cine = true; G.locks = 0; G.mode = 'play'; });

  // a rota e a trava
  const rota = await page.evaluate(async () => (await import('/codigo/dados/regiao-1.js')).ROTA_R1.map((r) => r.rotulo + ' ' + r.chave));
  assert.deepEqual(rota, ['1ª C0.2-F', '2ª C0.2-M', '3ª C0.2-D', '4ª C0.1-F', '5ª C0.1-M', '6ª C0.1-D', '7ª C0.3-F', '8ª C0.3-M', '9ª C0.3-D', '10º B0']); n++;
  await page.evaluate(() => G.events.emit('phaseDoor', { s: G.settlements.find((s) => s.def.id === 'C0.1'), nivel: 'F' }));
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => G.mode === 'play' && document.getElementById('fase').classList.contains('hidden')), 'a 4ª casa não abre antes da 1ª');
  ok(await page.evaluate(() => !G.progress.canFightBoss(G.settlements.find((s) => s.def.id === 'B0').def)), 'o chefão do Silo fica fechado até as 9 casas');
  ok((await page.evaluate(() => G.progress.nextObjective().text)).includes('1ª da rota'), 'o objetivo aponta a 1ª casa da rota');

  const abrir = async (sid, nivel) => { await page.evaluate(async ({ sid, nivel }) => { const { launchLevel } = await import('/codigo/fases/abrir-fase.js'), S = G.settlements.find((s) => s.def.id === sid); G.mode = 'fase'; window.auditS = S; window.auditN = nivel; window.auditPromise = launchLevel({ id: sid, metodo: S.def.metodo, nivel }); }, { sid, nivel }); await page.waitForSelector('#pq-t'); };
  const fechar = async () => { await page.locator('#fz-back').click(); const r = await page.evaluate(async () => { const r = await auditPromise; G.progress.applyResult(auditS.def, auditN, r); G.mode = 'play'; return r; }); return r; };
  const digita = async (v) => { await page.fill('#pq-in', v); await page.keyboard.press('Enter'); };
  const log = () => page.locator('#pq-log').innerText();

  // 1ª verde do Cancelamento: x médio (múltipla escolha)
  await abrir('C0.2', 'F');
  ok((await page.locator('.pq-enunciado').innerText()).includes('0,180'), 'verde 1 usa a função com 0,180');
  ok(await page.locator('.r1-q').count() === 1, 'a célula pedida aparece com ?');
  await page.locator('.pq-alt', { hasText: '2,562500' }).click();
  ok((await page.locator('#pq-msg').innerText()).includes('metade errada'), 'alternativa errada explica o erro');
  await page.locator('.pq-alt', { hasText: '2,687500' }).click();
  let r = await fechar(); ok(r.vitoria && r.estrelas === 2, 'verde 1 vencida com 2 estrelas (1 erro)');

  // 2ª azul do Cancelamento: Lagrange letra a, L₀, L₁ e L₂ em múltipla escolha, uma de cada vez
  const opcao = (i) => page.locator(`[data-op="${i}"]`).click();
  await abrir('C0.2', 'M');
  ok((await page.locator('.r1-itens li').count()) === 1 && (await page.locator('.r1-itens li').innerText()).startsWith('a)'), 'azul 1 mostra só a letra a');
  ok(await page.locator('[data-op]').count() === 4, 'L₀ tem 4 alternativas');
  await opcao(0); ok((await page.locator('#pq-msg').innerText()).includes('Sinal trocado'), 'alternativa errada do L₀ explica o erro');
  await opcao(1); ok((await log()).includes('(x² − 3x + 2)/2 ✔'), 'L₀ certo sobe para o histórico');
  ok((await page.locator('.pq-term-ops span').innerText()).startsWith('L₁(x)'), 'depois do L₀ vem o L₁');
  await opcao(2); await opcao(0);
  r = await fechar(); ok(r.vitoria && r.estrelas === 2, 'azul 1 vencida');

  // 3ª vermelha do Cancelamento: Gauss-Seidel, um x de cada vez
  await abrir('C0.2', 'D');
  ok((await page.locator('.r1-sis').innerText()).includes('9x₁ + x₂ − x₃ + x₄ = 14'), 'vermelha 1 mostra o sistema 4×4');
  await digita('14/9'); await digita('1,9');
  ok((await page.locator('#pq-msg').innerText()).includes('Jacobi'), 'usar os zeros no x₂ avisa que é Jacobi');
  await digita('1,5889'); await digita('-0,6929'); await digita('1,8683');
  ok((await page.locator('.r1-tab').last().innerText()).includes('1,8683'), 'a tabela da 1ª iteração fica completa');
  r = await fechar(); ok(r.vitoria, 'vermelha 1 vencida');

  // a 4ª abre agora; 5ª e 6ª, 7ª, 8ª (com coerência) e 9ª
  await abrir('C0.1', 'F'); await page.locator('.pq-alt', { hasText: /^D−0,007014$/ }).click(); r = await fechar(); ok(r.vitoria && r.estrelas === 3, 'verde 2 (f do x médio) com 3 estrelas');
  await abrir('C0.1', 'M'); ok((await page.locator('.r1-itens li').innerText()).startsWith('b)'), 'azul 2 mostra só a letra b'); await opcao(3); r = await fechar(); ok(r.vitoria && r.estrelas === 3, 'azul 2 (P₂) vencida');
  await abrir('C0.1', 'D'); for (const v of ['2,3', '-0,4778', '0,6253', '2,963']) await digita(v); r = await fechar(); ok(r.vitoria, 'vermelha 2 vencida');
  await abrir('C0.3', 'F'); await page.locator('.pq-alt', { hasText: '2,92%' }).click(); r = await fechar(); ok(r.vitoria, 'verde 3 (Er%) vencida');
  await abrir('C0.3', 'M'); ok((await page.locator('.r1-itens li').innerText()).startsWith('c)'), 'azul 3 mostra só a letra c');
  await opcao(0); ok((await page.locator('#pq-msg').innerText()).includes('0,455625'), 'f(1,35) sem o x² explica o erro');
  await opcao(1); ok(await page.locator('[data-op]').count() === 2, 'depois do valor vem a pergunta da coerência');
  await opcao(0); r = await fechar(); ok(r.vitoria && r.estrelas === 2, 'azul 3 (f(1,35) e coerência) vencida');
  await abrir('C0.3', 'D'); for (const v of ['1,75', '1,2955', '2,6795', '-0,7672']) await digita(v); r = await fechar(); ok(r.vitoria, 'vermelha 3 aceita 2,6795 (o meio exato 2,67955)');

  // 10º: o chefão do Silo
  ok(await page.evaluate(() => G.progress.canFightBoss(G.settlements.find((s) => s.def.id === 'B0').def)), 'o chefão abre depois das 9 casas');
  await abrir('B0', 'B');
  ok(await page.locator('.pq-hp').isVisible(), 'o chefão tem barra de vida');
  await digita('2,53125'); ok((await page.locator('#pq-msg').innerText()).includes('Parou cedo'), 'parar na 4ª avisa que parou cedo');
  await digita('2,539062'); ok((await page.locator('#pq-msg').innerText()).includes('Passou do ponto'), 'continuar até a 6ª avisa que passou do ponto');
  await digita('2,546875'); ok((await page.locator('.r1-tab').last().innerText()).includes('0,61%'), 'a tabela revela até a 5ª iteração');
  r = await fechar(); ok(r.vitoria && r.estrelas === 1, 'chefão vencido com 1 estrela (2 erros)');
  ok(await page.evaluate(() => G.progress.regionUnlocked(2)), 'vencer o Silo abre a região 2');

  // números da rota no mapa (M) e em cima das casas
  await page.evaluate(async () => { const { atualizarRota } = await import('/codigo/mundo/ordem-da-rota.js'); atualizarRota(); G.ui.map.show(); });
  ok(await page.locator('#mapscreen .map-rota').count() === 10, 'o mapa mostra os 10 números da rota');
  ok(await page.evaluate(() => G.settlements.filter((s) => s.def.regiao === 1).flatMap((s) => Object.values(s.buildings)).filter((b) => b.ordem).length === 10), 'os 10 números flutuam em cima das casas e do Silo');
  assert.deepEqual(errors, []); n++;
  console.log(`Região 1 (v16): ${n}/${n} verificações`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
