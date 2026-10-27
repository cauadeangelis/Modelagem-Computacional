// Capturas de tela da versão atual, para a pasta previews/ (não é um teste: só fotografa as telas principais).
// Uso: node capturar-telas.mjs http://127.0.0.1:8000/ ../../previews v12
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, base = 'http://127.0.0.1:8000/', out = '../../previews', pre = 'atual'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {});
const tiradas = [];
async function sessao(opts, roteiro) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  await ctx.route(/youtube(-nocookie)?\.com|ytimg/, r => r.abort());
  const go = async h => { await page.goto('about:blank'); await page.goto(base + 'index.html#' + h); await page.waitForTimeout(200); };
  const foto = async (nome, alvo) => {
    if (alvo) await page.evaluate(sel => { const el = document.querySelector(sel); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); }, alvo);
    await page.waitForTimeout(150); const f = `${out}/${pre}-${nome}.png`; await page.screenshot({ path: f }); tiradas.push(f);
  };
  const responder = async (m, i) => {
    const t = await page.evaluate(([m, i]) => window.NumeraContent.TASKS[m][i], [m, i]);
    if (t.type === 'choice') { const op = await page.$$eval('.choice', bs => bs.map(b => b.textContent)); await page.click(`.choice >> nth=${op.findIndex(x => x.includes(t.options[t.answer]))}`); }
    else await page.fill('#answer', String(t.value).replace('.', ','));
    await page.click('#quiz-form button[type=submit]');
  };
  const desafio = async m => { await go('academy'); await page.click(`[data-act=course][data-id=${m}]`); await page.click('[data-act=node][data-id=sim]'); await page.click('[data-act=start-node][data-id=sim]'); await page.click('[data-act=sim-done]'); await page.waitForTimeout(300); };
  page.responder = responder; page.desafio = desafio;
  await roteiro(page, go, foto);
  await ctx.close();
}
await sessao({}, async (page, go, foto) => {
  await go('home'); await foto('inicio');
  await go('academy'); await foto('jornada'); await foto('jornada-mundos', '.journey');
  await page.click('[data-act=course][data-id=falseposition]'); await foto('mundo-travado');
  await go('academy'); await page.click('[data-act=course][data-id=bisection]'); await foto('trilha-bissecao');
  await page.click('[data-act=start-node][data-id=intro]'); for (let i = 0; i < 2; i++) await page.click('[data-act=intro-next]'); await foto('licao-bissecao');
  await page.desafio('bisection'); await page.waitForTimeout(700); await foto('desafio-mascotes');
  await page.responder('bisection', 0); await page.waitForTimeout(500); await foto('acerto');
  await page.click('[data-act=next-course]'); await page.responder('bisection', 1); await page.click('[data-act=next-course]');
  await page.responder('bisection', 2); await page.waitForTimeout(720); await foto('combo-moedas');
  await page.waitForTimeout(1300); await foto('combo-fala');
  await page.click('[data-act=next-course]'); await page.responder('bisection', 3); await page.waitForTimeout(600); await foto('nivel-concluido');
  await go('academy'); await foto('jornada-mundo-2-aberto', '.journey');
  await go('progress'); await page.click('[data-act=buy][data-id=laco]'); await foto('camarim', '.camarim');
  await go('cases'); await page.click('[data-act=case][data-id=loan]'); await page.click('details summary').catch(() => {}); await foto('missao-carne');
  await go('jogos'); await page.$$eval('.game-cover img', i => Promise.all(i.map(x => x.decode().catch(() => {})))); await foto('jogos');
  // Quem Divergiu?: as telas de uma rodada no telão
  const qd = async () => { await page.goto(base + 'jogos/quem-divergiu/index.html'); await page.waitForTimeout(200); };
  await qd(); await page.click('[data-a=exemplo]'); await foto('quem-divergiu-montar');
  await page.click('[data-a=rodadas][data-v="5"]'); await page.click('[data-a=comecar]');
  await page.evaluate(() => { const S = window.__qd.S; S.perguntas[0] = window.QDPerguntas.TODAS.find(q => q.id === 'nw-raiz2'); window.__qd.render(); });
  await foto('quem-divergiu-pergunta');
  await page.click('[data-a=ir-voto]'); const ids = await page.evaluate(() => window.__qd.S.jogadores.map(j => j.id));
  for (let i = 0; i < 2; i++) await page.click(`[data-a=votar][data-id=${ids[5]}]`); await foto('quem-divergiu-votacao');
  for (let i = 2; i < ids.length; i++) await page.click(`[data-a=votar][data-id=${i === 5 ? ids[2] : ids[5]}]`);
  await page.click('[data-a=revelar-votos]'); await page.waitForTimeout(900); await foto('quem-divergiu-votos');
  await page.click('[data-a=ir-anotar]'); const pal = ['1,4142', '1,5', '1,3', '1,45', '1,41', '2']; for (let i = 0; i < ids.length; i++) await page.fill(`#pal-${ids[i]}`, pal[i]);
  await page.click('[data-a=revelar]'); await page.waitForSelector('[data-a=placar]:not([disabled])', { timeout: 20000 }); await foto('quem-divergiu-revelacao');
  await page.click('[data-a=passos]'); await foto('quem-divergiu-calculo');
  await page.click('[data-a=placar]'); await page.waitForTimeout(900); await foto('quem-divergiu-placar');
  await page.click('[data-a=sair]'); await page.click('[data-a=sair]'); await page.waitForTimeout(900); await foto('quem-divergiu-podio');
  // Calculândia: tela inicial e o mundo
  await page.goto(base + 'jogos/calculandia/index.html'); await page.waitForFunction(() => window.G?.mode === 'title', null, { timeout: 120000 }); await page.waitForTimeout(800); await foto('calculandia');
  await go('lab'); await foto('terminal', '#terminal-form');
  await page.click('[data-act=help]'); await foto('terminal-ajuda', '.help-panel');
  await go('lab'); await page.click('[data-act=example][data-index="0"]'); await page.click('#solve-btn'); await page.waitForSelector('.result-shell'); await foto('terminal-resultado', '.result-shell');
  await page.click('[data-act=result-tab][data-id=converge]'); await foto('terminal-convergencia', '.result-shell');
  await go('lab'); await page.fill('#source', 'x^3 - 9x + 3 = 0 em [0; 1]'); await page.selectOption('#algorithm', 'bisection'); await page.click('#solve-btn'); await page.waitForSelector('.interval-echo');
  await foto('terminal-intervalo-campos', '.terminal-params'); await foto('terminal-intervalo-bissecao', '.result-shell');
  await page.fill('#a', '0'); await page.fill('#b', '3'); await page.click('#solve-btn'); await page.waitForSelector('.alert .iv-fix'); await foto('terminal-intervalo-mesmo-sinal', '.alert');
  await go('treino'); await page.click('[data-act=tr-view][data-id=ex]').catch(() => {}); await page.click('[data-act=tr-open][data-index="1"]'); await foto('treino-exercicio');
  await page.click('[data-act=tr-key]'); await foto('treino-gabarito', '.tr-key-open');
});
await sessao({ colorScheme: 'dark' }, async (page, go, foto) => {
  await go('academy'); await foto('escuro-jornada', '.journey');
  await page.desafio('bisection'); await page.waitForTimeout(600); await foto('escuro-desafio-mascotes');
  await go('treino'); await page.click('[data-act=tr-view][data-id=ex]').catch(() => {}); await page.click('[data-act=tr-open][data-index="4"]'); await page.click('[data-act=tr-key]'); await foto('escuro-treino-gabarito', '.tr-key-open');
});
await sessao({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page, go, foto) => {
  await go('jogos'); await foto('celular-jogos');
  await page.goto(base + 'jogos/quem-divergiu/index.html'); await page.click('[data-a=exemplo]'); await page.click('[data-a=modo][data-v=passa]'); await page.click('[data-a=comecar]'); await page.click('[data-a=abrir-segredo]'); await page.click('[data-a=seg-abrir]'); await page.fill('#seg-in', '1,6'); await foto('celular-quem-divergiu-segredo');
  await go('academy'); await foto('celular-jornada', '.journey');
  await page.desafio('bisection'); await page.waitForTimeout(600); await foto('celular-desafio-mascotes');
  await page.responder('bisection', 0); await page.click('[data-act=next-course]'); await page.responder('bisection', 1); await page.click('[data-act=next-course]'); await page.responder('bisection', 2); await page.waitForTimeout(720); await foto('celular-combo');
  await go('lab'); await page.fill('#source', 'x^3 - x - 2 = 0'); await page.selectOption('#algorithm', 'newton'); await page.fill('#a', '1'); await page.fill('#b', '2'); await foto('celular-terminal', '.terminal-params');
  await page.click('#solve-btn'); await page.waitForSelector('.result-shell'); await foto('celular-resultado', '.result-shell');
});
await browser.close();
console.log(`${tiradas.length} capturas em ${out}`);
