// Auditoria de acessibilidade com axe-core (regras WCAG 2.1 A e AA) em todas as telas, no modo claro e no escuro.
// Uso: node auditar-a11y.mjs http://127.0.0.1:8000/ [saida.json]
import { abrir, ok, fim, BASE } from './comum.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const OUT = process.argv[3] || '';
const TELAS = [
  ['início', async p => go(p, 'home')],
  ['trilhas', async p => go(p, 'academy')],
  ['trilha bloqueada (Falsa Posição), com aulas em vídeo', async p => { await go(p, 'academy'); await p.click('[data-act=course][data-id=falseposition]'); }],
  ['lição: leitura', async p => { await go(p, 'academy'); await p.click('[data-act=course][data-id=bisection]'); await p.click('[data-act=start-node][data-id=intro]'); }],
  ['lição: aulas em vídeo', async p => { for (let i = 0; i < 7; i++) await p.click('[data-act=intro-next]'); }],
  ['lição: simulação', async p => { await p.click('[data-act=intro-next]'); }],
  ['lição: prática', async p => { await p.click('[data-act=sim-done]'); }],
  ['lição: acerto com os mascotes', async p => { const t = await p.evaluate(() => window.NumeraContent.TASKS.bisection[0]); if (t.type === 'choice') { const op = await p.$$eval('.choice', bs => bs.map(b => b.textContent)); await p.click(`.choice >> nth=${op.findIndex(x => x.includes(t.options[t.answer]))}`); } else await p.fill('#answer', String(t.value)); await p.click('#quiz-form button[type=submit]'); await p.waitForTimeout(400); }],
  ['listas', async p => go(p, 'listas')],
  ['listas: questão aberta', async p => { await p.click('[data-act=bq-abrir] >> nth=0'); }],
  ['relâmpago', async p => go(p, 'relampago')],
  ['relâmpago: pergunta', async p => { await p.click('[data-act=rl-comecar]'); await p.waitForTimeout(150); }],
  ['missões', async p => go(p, 'cases')],
  ['missão', async p => { await p.click('[data-act=case][data-id=loan]'); }],
  ['jogos', async p => go(p, 'jogos')],
  ['terminal', async p => go(p, 'lab')],
  ['terminal: solução', async p => { await p.click('[data-act=example][data-index="0"]'); await p.click('#terminal-form button[type=submit]'); await p.waitForSelector('.result-shell'); }],
  ['terminal: passos', async p => p.click('[data-act=result-tab][data-id=steps]')],
  ['terminal: comparar', async p => p.click('[data-act=result-tab][data-id=compare]')],
  ['terminal: convergência', async p => p.click('[data-act=result-tab][data-id=converge]')],
  ['terminal: verificação', async p => p.click('[data-act=result-tab][data-id=verify]')],
  ['terminal: resolver comigo', async p => p.click('[data-act=result-tab][data-id=guide]')],
  ['terminal: Bisseção sem intervalo (erro com sugestões)', async p => { await go(p, 'lab'); await p.fill('#source', 'x^3 - 9x + 3 = 0'); await p.selectOption('#algorithm', 'bisection'); await p.click('#solve-btn'); await p.waitForSelector('.alert .iv-fix'); }],
  ['terminal: Bisseção no intervalo [0; 1]', async p => { await p.fill('#a', '0'); await p.fill('#b', '1'); await p.click('#solve-btn'); await p.waitForSelector('.interval-echo'); }],
  ['terminal: Newton no intervalo, com aviso de várias raízes', async p => { await p.selectOption('#algorithm', 'newton'); await p.fill('#a', '-4'); await p.fill('#b', '4'); await p.click('#solve-btn'); await p.waitForSelector('.iv-notes'); }],
  ['treino', async p => go(p, 'treino')],
  ['treino: gabarito', async p => { await p.click('.tr-tool >> nth=0'); await p.click('[data-act=tr-key]'); }],
  ['treino: revisão', async p => p.click('[data-act=tr-view][data-id=rev]')],
  ['treino: prova (início)', async p => p.click('[data-act=tr-view][data-id=prova]')],
  ['treino: prova (questão)', async p => { await p.click('[data-act=tr-pv-start]'); await p.click('.tr-tool >> nth=2'); }],
  ['treino: relatório', async p => { await p.click('.tr-exam-end [data-act=tr-pv-end]'); await p.click('[data-act=tr-pv-end-yes]'); }],
  ['treino: gabarito completo', async p => p.click('[data-act=tr-view][data-id=key]')],
  ['revisão', async p => go(p, 'review')],
  ['progresso e camarim', async p => go(p, 'progress')],
  ['trilhas: modo livre', async p => { await go(p, 'academy'); await p.click('[data-act=free-toggle]'); }],
  // v12: o jogo de sala, tela por tela
  ['bobo da corte: montar a turma', async p => { await p.goto(BASE + 'jogos/bobo-da-corte/index.html'); await p.click('[data-a=exemplo]'); }],
  ['bobo da corte: pergunta (com dica)', async p => { await p.click('[data-a=comecar]'); await p.click('[data-a=dica]'); }],
  ['bobo da corte: votação', async p => { await p.click('[data-a=ir-voto]'); }],
  ['bobo da corte: votos revelados', async p => { const ids = await p.evaluate(() => window.__bc.S.jogadores.map(j => j.id)); for (let i = 0; i < ids.length; i++) await p.click(`[data-a=votar][data-id=${ids[(i + 1) % ids.length]}]`); await p.click('[data-a=revelar-votos]'); }],
  ['bobo da corte: anotar palpites', async p => { await p.click('[data-a=ir-anotar]'); const ids = await p.evaluate(() => window.__bc.S.jogadores.map(j => j.id)); for (let i = 0; i < ids.length; i++) await p.fill(`#pal-${ids[i]}`, String(i + 1)); }],
  ['bobo da corte: revelação na reta', async p => { await p.click('[data-a=revelar]'); await p.waitForSelector('[data-a=pos-revelar]:not([disabled]), [data-a=ir-perturbacao]:not([disabled])', { timeout: 20000 }); await p.click('[data-a=passos]'); }],
  ['bobo da corte: show do bobo', async p => { if (await p.$('[data-a=ir-perturbacao]')) { await p.click('[data-a=ir-perturbacao]'); await p.click('[data-a=perturb][data-v=muda]'); } await p.click('[data-a=pos-revelar]'); await p.click('[data-a=bobo-pular]').catch(() => {}); await p.waitForSelector('.bobo-palco.etapa-danca'); }],
  ['bobo da corte: roleta de prendas', async p => { await p.click('[data-a=bobo-roleta]'); await p.waitForSelector('.prenda-txt', { timeout: 8000 }); }],
  ['bobo da corte: placar', async p => { await p.click('[data-a=bobo-fechar]'); }],
  ['bobo da corte: pódio', async p => { await p.click('[data-a=sair]'); await p.click('[data-a=sair]'); }],
  ['calculândia: tela inicial', async p => { await p.goto(BASE + 'jogos/calculandia/index.html'); await p.waitForFunction(() => window.G?.mode === 'title', null, { timeout: 120000 }); }],
  ['bobo da corte: passa o aparelho', async p => { await p.goto(BASE + 'jogos/bobo-da-corte/index.html'); }],
  ['bobo da corte: segredo', async p => { await p.click('[data-a=limpar]'); await p.click('[data-a=exemplo]'); await p.click('[data-a=modo][data-v=passa]'); await p.click('[data-a=comecar]'); await p.click('[data-a=abrir-segredo]'); await p.click('[data-a=seg-abrir]'); }]
];
async function go(p, hash) { await p.goto(BASE + 'index.html#' + hash); await p.waitForTimeout(120); }
const relatorio = {};
for (const esquema of ['light', 'dark']) {
  // bypassCSP: a política de segurança do site (v10) proíbe scripts injetados; o axe-core é injetado só para a auditoria.
  const { browser, page, erros } = await abrir({ colorScheme: esquema, bypassCSP: true });
  await page.goto(BASE + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
  for (const [nome, passo] of TELAS) {
    await passo(page); await page.waitForTimeout(80);
    await page.addScriptTag({ path: AXE });
    const r = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, alvos: v.nodes.slice(0, 4).map(n => n.target.join(' ')) }));
    });
    relatorio[`${esquema} · ${nome}`] = r;
    ok(r.length === 0, `${esquema} · ${nome}: ${r.map(v => `${v.id} (${v.n}) ${v.alvos.join(', ')}`).join(' | ')}`);
  }
  ok(erros.length === 0, `${esquema}: sem erros de JavaScript ` + erros.slice(0, 2).join(' | '));
  await browser.close();
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify(relatorio, null, 1));
fim('Acessibilidade (axe-core, WCAG 2.1 AA)');
