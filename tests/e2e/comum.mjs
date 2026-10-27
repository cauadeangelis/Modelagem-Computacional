// Utilidades comuns: abre o navegador (Chromium do Playwright ou o caminho em CHROME_PATH),
// bloqueia as fontes externas (os testes não dependem de internet) e junta os erros de JavaScript.
import { chromium } from 'playwright';
export const BASE = process.argv[2] || process.env.NUMERA_URL || 'http://127.0.0.1:8000/';
export async function abrir(opts = {}) {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const erros = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) erros.push(m.text()); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  return { browser, ctx, page, erros };
}
let n = 0; const falhas = [];
export function ok(cond, msg) { n++; if (!cond) { falhas.push(msg); console.log('  FALHOU:', msg); } }
export function fim(nome) { console.log(`${nome}: ${n - falhas.length}/${n} verificações`); if (falhas.length) process.exit(1); }
