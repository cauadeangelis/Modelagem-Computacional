import fs from 'node:fs';
// Fluxos completos no navegador, como uma pessoa usaria. v11: jornada com travas, combo dos mascotes, moedas e camarim;
// trilhas, missões,
// Terminal (Falsa Posição, aba Convergência com hover e teclado), Treino (diagnóstico, erro típico,
// gabarito com gráfico), modo prova até o relatório impresso, revisão, celular e modo escuro.
// Uso: node testar-fluxos.mjs http://127.0.0.1:8000/ [pasta-para-previews]
import { abrir, ok, fim, BASE } from './comum.mjs';
const PREV = process.argv[3] || '';
const shot = async (page, name, full = false) => { if (PREV) await page.screenshot({ path: `${PREV}/${name}.png`, fullPage: full }); };
const { browser, ctx, page, erros } = await abrir();
const go = async hash => { await page.goto(BASE + 'index.html#' + hash); await page.waitForTimeout(150); };
await page.goto(BASE + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();

// ---------- Início (v11: Ponto Fixo escondido por enquanto)
await go('home');
const stats = await page.$$eval('.stats b', bs => bs.map(b => b.textContent));
ok(stats[0] === '6' && stats[1] === '90' && stats[2] === '120' && Number(stats[3].replace('.', '')) > 1900, 'Início mostra 6 métodos, 90 atividades, 120 exercícios e as verificações: ' + stats.join(' / '));
ok(!(await page.textContent('#app')).includes('Ponto Fixo'), 'Início sem o Ponto Fixo');
await shot(page, 'v11-inicio');

// ---------- v11: jornada do fácil ao difícil
await go('academy');
ok(await page.$$eval('.journey .world', w => w.length) === 6 && await page.$$eval('.journey .world.locked', w => w.length) === 5, 'Jornada: 6 mundos, só a Bisseção aberta no começo');
ok((await page.$$eval('.journey .world b', b => b.map(x => x.textContent))).join() === 'Bisseção,Falsa Posição,Newton-Raphson,Secante,Eliminação de Gauss,Gauss-Seidel', 'Ordem: Bisseção → Falsa Posição → Newton → Secante → Gauss → Gauss-Seidel');
ok((await page.$$('[data-act=course][data-id=fixedpoint]')).length === 0, 'Ponto Fixo fora da jornada');
ok(await page.isVisible('.journey-why') && await page.isVisible('[data-act=free-toggle][role=switch]'), 'Explicação da ordem e chave do modo livre');
await shot(page, 'v11-jornada');
await page.click('[data-act=course][data-id=falseposition]');
ok(await page.isVisible('.lock-note'), 'Mundo 2 fechado: aviso na trilha');
await page.click('[data-act=start-node][data-id=intro]'); for (let i = 0; i < 8; i++) await page.click('[data-act=intro-next]');
ok((await page.textContent('[data-act=sim-done]')).includes('Voltar à trilha'), 'Mundo fechado: leitura e simulação liberadas, desafios não');
await page.click('[data-act=sim-done]'); ok(await page.isVisible('.lock-note') && !(await page.isVisible('#quiz-form')), 'Fim da simulação no mundo fechado volta à trilha');

// Bisseção, Nível 1: quatro acertos seguidos → combo (o Pivô soca a caixa e caem moedas) e o mundo 2 abre.
const responder = async (m, i, certo = true) => {
  const t = await page.evaluate(([m, i]) => window.NumeraContent.TASKS[m][i], [m, i]);
  if (t.type === 'choice') {
    const op = await page.$$eval('.choice', bs => bs.map(b => b.textContent));
    const want = certo ? t.answer : (t.answer + 1) % t.options.length;
    await page.click(`.choice >> nth=${op.findIndex(x => x.includes(t.options[want]))}`);
  } else await page.fill('#answer', String(certo ? t.value : t.value + 7).replace('.', ','));
  await page.click('#quiz-form button[type=submit]');
};
await go('academy'); await page.click('[data-act=course][data-id=bisection]');
await page.click('[data-act=start-node][data-id=intro]'); for (let i = 0; i < 8; i++) await page.click('[data-act=intro-next]');
await page.click('[data-act=sim-done]');
ok(await page.isVisible('#mascotes') && await page.evaluate(() => document.body.classList.contains('has-mascots')), 'Raiz e Pivô aparecem no desafio');
ok(await page.$eval('#mascotes', e => e.getAttribute('aria-hidden') === 'true'), 'Mascotes são decorativos para o leitor de tela');
const dancando = await page.$eval('.mz-raiz-body', e => getComputedStyle(e).animationName);
ok(dancando === 'mz-hop', 'Raiz dança enquanto a pessoa pensa: ' + dancando);
await responder('bisection', 0, false);
ok(await page.$eval('#mascotes', e => e.classList.contains('is-bad')), 'Erro: o casal reage (sem acerto)');
await page.waitForTimeout(1300);
await responder('bisection', 0); await page.click('[data-act=next-course]');
await responder('bisection', 1); await page.click('[data-act=next-course]');
await responder('bisection', 2);
ok(await page.$eval('#mascotes', e => e.classList.contains('is-combo')), '3 acertos seguidos: combo');
await page.waitForTimeout(650);
ok((await page.$$('.mz-coin')).length >= 3, 'Caem moedas da caixa');
await shot(page, 'v11-combo');
ok((await page.textContent('.sheet-msg')).includes('3 acertos seguidos'), 'Mensagem do combo no retorno');
await page.waitForTimeout(1200);
ok((await page.textContent('.player-top .coin-meta')).includes('11'), 'Contador de moedas: 2 + 2 + 2 + 5 = 11');
await page.click('[data-act=next-course]'); await responder('bisection', 3);
ok((await page.textContent('.sheet-msg')).includes('Falsa Posição, liberado'), 'Nível 1 concluído abre o Mundo 2');
ok(await page.$eval('#mascotes', e => e.classList.contains('is-level')) && (await page.$$('.mz-confetti')).length > 10, 'Nível concluído: festa com confete');
await page.waitForTimeout(500); await shot(page, 'v11-nivel-concluido');
await page.setViewportSize({ width: 390, height: 844 }); await page.click('[data-act=next-course]'); await page.waitForTimeout(200);
ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'Celular: desafio com mascotes sem rolagem lateral');
const sobrepoe = await page.evaluate(() => { const a = document.querySelector('.mz-art').getBoundingClientRect(), b = document.querySelector('#quiz-form button[type=submit]').getBoundingClientRect(); return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top); });
ok(!sobrepoe, 'Celular: o casal não cobre o botão de responder');
await shot(page, 'v11-celular-desafio');
await page.setViewportSize({ width: 1280, height: 900 });
await go('academy'); ok(!(await page.isVisible('#mascotes')), 'Fora dos desafios o casal sai de cena');
ok(await page.$$eval('.journey .world.locked', w => w.length) === 4, 'Mapa: Falsa Posição aberta');
await page.click('[data-act=free-toggle]'); ok(await page.$$eval('.journey .world.locked', w => w.length) === 0, 'Modo livre abre todos os mundos');
await page.click('[data-act=free-toggle]'); ok(await page.$$eval('.journey .world.locked', w => w.length) === 4, 'Desligar o modo livre volta as travas');
// ---------- v12: Jogos (no lugar da Arena)
await go('arena'); ok((await page.evaluate(() => location.hash)) === '#jogos' && await page.isVisible('.games'), 'Link antigo #arena abre a página Jogos');
ok(!(await page.textContent('.topbar')).includes('Arena') && (await page.textContent('.topbar')).includes('Jogos'), 'Menu: Jogos no lugar da Arena');
ok(await page.$$eval('.game-card', c => c.length) === 3 && await page.isVisible('.game-rl') && await page.isVisible('a.btn[href="jogos/calculandia/index.html"]') && await page.isVisible('a.btn[href="jogos/bobo-da-corte/index.html"]'), 'Jogos: Calculândia, Bobo da Corte e Relâmpago');
await page.$$eval('.game-cover img', imgs => Promise.all(imgs.map(i => i.decode().catch(() => {}))));
ok(await page.$$eval('.game-cover img', imgs => imgs.every(i => i.complete && i.naturalWidth === 1200)), 'Capas dos jogos carregadas');
await shot(page, 'v12-jogos');
// Bobo da Corte (v14, antes Quem Divergiu?): uma rodada completa no modo telão, do jeito que a professora usaria.
await page.click('a.btn[href="jogos/bobo-da-corte/index.html"]'); await page.waitForSelector('[data-a=exemplo]');
await page.click('[data-a=exemplo]'); await page.click('[data-a=rodadas][data-v="5"]'); await page.click('[data-a=comecar]');
await page.evaluate(() => { const S = window.__bc.S; S.perguntas[0] = window.BCPerguntas.TODAS.find(q => q.id === 'nw-raiz2'); S.eventos[0] = {}; window.__bc.render(); });
ok(await page.isVisible('#pergunta-t') && await page.isVisible('#relogio'), 'Bobo da Corte: pergunta no quadro e relógio');
await shot(page, 'v14-bobo-da-corte-pergunta');
await page.click('[data-a=ir-voto]'); const qids = await page.evaluate(() => window.__bc.S.jogadores.map(j => j.id));
ok(await page.$$eval('[data-a=votar]', b => b.length) === qids.length - 1, 'Votação: ninguém vota em si mesmo');
for (let i = 0; i < qids.length; i++) await page.click(`[data-a=votar][data-id=${qids[i === qids.length - 1 ? 0 : qids.length - 1]}]`);
await page.click('[data-a=revelar-votos]'); ok((await page.textContent('#fala')).includes('Felipe'), 'Votos revelados: a turma aposta no Felipe');
await page.click('[data-a=ir-anotar]'); const qr = await page.evaluate(() => window.BCPerguntas.resolver(window.__bc.S.perguntas[0]).resposta);
const pals = [qr, qr * 1.03, qr * 1.15, qr * 1.4, '', qr * 5];
for (let i = 0; i < qids.length; i++) await page.fill(`#pal-${qids[i]}`, pals[i] === '' ? '' : String(pals[i]).replace('.', ','));
ok((await page.textContent(`#lido-${qids[0]}`)).startsWith('='), 'Palpite lido na hora, em português');
await page.click('[data-a=revelar]'); await page.waitForSelector('[data-a=pos-revelar]:not([disabled])', { timeout: 20000 });
ok(await page.$$eval('.reta .pin', p => p.length) === 5 && await page.isVisible('.reta .resp'), 'Reta: 5 palpites e a resposta');
ok(await page.isVisible('.carteira.divergiu .carimbo') && await page.isVisible('.carteira.raiz'), 'Carimbos: DIVERGIU e CONVERGIU');
ok((await page.textContent('#fala')).includes('A turma acertou'), 'A anfitriã comenta o resultado');
await page.click('[data-a=passos]'); ok(await page.isVisible('.giz-passos-res li'), 'Passo a passo do cálculo no quadro');
await shot(page, 'v14-bobo-da-corte-revelacao');
await page.click('[data-a=pos-revelar]'); ok(await page.isVisible('.bobo-palco .bobo-fila') && (await page.textContent('.bobo-chamada')).includes('Bobo da Corte'), 'Show do Bobo: cortina e holofote sobre a turma');
await page.waitForSelector('.bobo-palco.etapa-danca', { timeout: 8000 }); ok((await page.textContent('#bobo-t')).includes('Felipe') && await page.isVisible('.bobo-danca'), 'O mais votado (Felipe) vira o Bobo da Corte e dança');
await shot(page, 'v14-bobo-da-corte-show');
await page.click('[data-a=bobo-roleta]'); await page.waitForSelector('.prenda-txt', { timeout: 8000 }); ok((await page.textContent('.prenda-txt')).length > 20, 'Roleta sorteia uma prenda');
await page.click('[data-a=bobo-fechar]'); ok(await page.$$eval('.giz-placar li', l => l.length) === 6 && (await page.textContent('.giz-placar')).includes('🃏'), 'Placar com a turma inteira e o chapéu do bobo');
await page.click('[data-a=sair]'); await page.click('[data-a=sair]'); ok(await page.isVisible('.podio'), 'Encerrar leva ao pódio');
ok(JSON.parse(await page.evaluate(() => localStorage.getItem('numera-bobo-da-corte-v1'))).stats.games === 1, 'Partida guardada no navegador');
await shot(page, 'v14-bobo-da-corte-podio');
await page.click('a.b[href="../../index.html#jogos"]'); await page.waitForSelector('.games');
ok((await page.textContent('.game-qd .game-progress')).includes('1 partida jogada'), 'Site mostra a partida nos Jogos');
await go('progress'); ok(await page.$$eval('.badge.earned', b => b.some(x => x.textContent.includes('Turma reunida'))), 'Conquista Turma reunida');
// Modo passa o aparelho: palpite escondido, um por vez.
await page.goto(BASE + 'jogos/bobo-da-corte/index.html'); await page.click('[data-a=modo][data-v=passa]'); await page.click('[data-a=comecar]');
await page.click('[data-a=abrir-segredo]'); ok(await page.isVisible('.segredo') && !(await page.isVisible('#seg-in')), 'Passa o aparelho: o campo só aparece depois de "sou eu"');
await page.click('[data-a=seg-abrir]'); await page.fill('#seg-in', 'xyz'); await page.click('form[data-form=segredo] button[type=submit]');
ok((await page.textContent('#seg-lido')).includes('Não entendi'), 'Palpite inválido não passa');
await page.fill('#seg-in', '1,5'); await page.click('form[data-form=segredo] button[type=submit]');
ok(await page.isVisible('[data-a=seg-abrir]') && (await page.textContent('#seg-t')).includes('Vez de'), 'Depois do palpite, passa para o próximo');
// Calculândia abre a partir do site, tudo servido pelo próprio site (Three.js e fonte).
const fora = []; page.on('request', r => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) fora.push(r.url()); });
await page.goto(BASE + 'jogos/calculandia/index.html'); await page.waitForFunction(() => window.G?.mode === 'title', null, { timeout: 120000 });
ok(await page.isVisible('#title a.btn[href="../../index.html#jogos"]'), 'Calculândia: tela inicial com volta ao Numera');
ok(fora.length === 0, 'Calculândia não busca nada fora do site: ' + fora.slice(0, 3).join(' '));
await shot(page, 'v12-calculandia');
// Camarim: troca moedas por roupas
await go('progress'); ok(await page.isVisible('.camarim'), 'Camarim no Progresso');
await page.click('[data-act=buy][data-id=laco]');
ok(await page.$eval('[data-act=equip][data-id=laco]', b => b.getAttribute('aria-pressed') === 'true'), 'Comprou o laço e a Raiz já veste');
ok(await page.$eval('.camarim .mz-svg', s => s.innerHTML.includes('#FF6FA5')), 'O laço aparece no desenho');
await page.evaluate(() => document.querySelector('.camarim').scrollIntoView({ block: 'center' })); await shot(page, 'v11-camarim');

// ---------- Trilha da Falsa Posição (aberta pela Bisseção)
await go('academy');
await page.click('[data-act=course][data-id=falseposition]');
ok(!(await page.isVisible('.lock-note')), 'Mundo 2 sem trava depois do Nível 1 da Bisseção');
await page.click('[data-act=node][data-id=sim]'); await page.click('[data-act=start-node][data-id=sim]');
ok(await page.isVisible('.g-chord'), 'Simulação da Falsa Posição desenha a corda');
await page.click('[data-act=sim-next]'); await page.click('[data-act=sim-next]');
await shot(page, 'v9-falsa-posicao-simulacao');
await page.click('[data-act=sim-done]');
const q0 = await page.evaluate(() => { const C = window.NumeraContent; return C.TASKS.falseposition[0]; });
const letters = await page.$$eval('.choice', bs => bs.map(b => b.textContent));
const idx = letters.findIndex(t => t.includes(q0.options[q0.answer]));
await page.click(`.choice >> nth=${idx}`); await page.click('#quiz-form button[type=submit]');
ok((await page.textContent('.sheet-msg')).includes('Correto'), 'Primeira etapa da Falsa Posição (alternativa)');
await page.click('[data-act=next-course]');
await page.fill('#answer', '1,666667'); await page.click('#quiz-form button[type=submit]');
ok((await page.textContent('.sheet-msg')).includes('Correto'), 'Segunda etapa: primeiro corte da corda = 5/3');

// ---------- Missão da taxa (Falsa Posição) → Terminal; Ponto Fixo fora das missões e do Terminal
await go('cases'); ok((await page.$$('[data-act=case][data-id=kepler]')).length === 0, 'Missão de Kepler escondida junto com o Ponto Fixo');
await page.click('[data-act=case][data-id=loan]');
await page.click('details summary'); await page.click('[data-act=case-terminal]');
ok(!(await page.$$eval('#algorithm option', o => o.map(x => x.value))).includes('fixedpoint'), 'Terminal sem a opção Ponto Fixo');
await page.click('#terminal-form button[type=submit]'); await page.waitForSelector('.result-shell');
ok((await page.textContent('.result-shell h2')).includes('Falsa Posição') && (await page.textContent('.answer-result strong')).includes('0,02075'), 'Missão do carnê resolvida pela Falsa Posição no Terminal');

// ---------- Terminal: aba Convergência com hover e teclado
await go('lab'); await page.click('[data-act=example][data-index="0"]'); await page.click('#terminal-form button[type=submit]');
await page.waitForSelector('.result-shell'); await page.click('[data-act=result-tab][data-id=converge]');
ok(await page.$$eval('.conv-series', s => s.length) >= 4, 'Convergência: quatro métodos lado a lado');
await page.$eval('.conv-plot', el => el.scrollIntoView({ block: 'center' }));
const box = await page.$('.conv-plot svg').then(h => h.boundingBox());
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5, { steps: 3 });
await page.waitForTimeout(100);
ok(await page.isVisible('.conv-tip') && (await page.textContent('.conv-tip')).includes('Iteração'), 'Dica com os valores aparece ao passar o mouse');
await page.focus('.conv-plot'); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
ok((await page.textContent('.conv-tip')).includes('Iteração 1'), 'Teclado percorre as iterações do gráfico');
await page.evaluate(() => document.querySelector('.conv').scrollIntoView());
await shot(page, 'v9-terminal-convergencia');

// ---------- Treino: diagnóstico errado → revisão; erro típico; gabarito com gráfico
await go('treino');
const data = await page.evaluate(() => window.NumeraTreino.exercises.map(e => ({ id: e.id, method: e.method, answer: e.answer, traps: e.traps || [], askBlind: e.askBlind, ask: e.ask })));
const e0 = data[0];
ok((await page.textContent('#tr-form')).includes(e0.askBlind.slice(0, 25)), 'Pergunta sem o nome do método antes do diagnóstico');
const wrongM = e0.method === 'newton' ? 'secant' : 'newton';
await page.click(`.tr-tool[data-id=${wrongM}]`);
ok(await page.isVisible('.tr-verdict.bad') && await page.isVisible('mark.cue'), 'Diagnóstico errado mostra o veredito e as pistas');
ok((await page.textContent('.topbar .chip .count')).trim() === '1', 'O erro de diagnóstico entra na contagem da Revisão');
const fmt = v => String(+v.toPrecision(9)).replace('.', ',');
if (e0.traps.length && e0.answer.type !== 'vec') {
  await page.fill('#tr-ans-0', fmt(Array.isArray(e0.traps[0].v) ? e0.traps[0].v[0] : e0.traps[0].v)); await page.click('#tr-form button[type=submit]');
  ok((await page.textContent('#tr-form .tr-verdict')).includes('Erro típico'), 'Erro típico reconhecido no Treino');
}
const vals = e0.answer.type === 'vec' ? e0.answer.values : [e0.answer.value];
for (let i = 0; i < vals.length; i++) await page.fill('#tr-ans-' + i, fmt(vals[i]));
await page.click('#tr-form button[type=submit]');
ok((await page.textContent('#tr-form .tr-verdict')).includes('Correto'), 'Resposta certa com vírgula');
await page.click('[data-act=tr-key]');
ok(await page.isVisible('.tr-conv .conv-plot'), 'Gabarito com gráfico de convergência');
await page.evaluate(() => document.querySelector('.tr-key-open').scrollIntoView());
await shot(page, 'v9-treino-gabarito-convergencia');

// ---------- Teclado: diagnosticar e responder sem mouse
await page.click('[data-act=tr-open][data-index="2"]');
const e2 = data[2];
await page.focus(`.tr-tool[data-id=${e2.method}]`); await page.keyboard.press('Enter');
ok(await page.isVisible('.tr-verdict.ok'), 'Diagnóstico pelo teclado (Tab + Enter)');
const v2 = e2.answer.type === 'vec' ? e2.answer.values : [e2.answer.value];
for (let i = 0; i < v2.length; i++) { await page.focus('#tr-ans-' + i); await page.keyboard.type(fmt(v2[i])); }
await page.keyboard.press('Enter');
ok((await page.textContent('#tr-form .tr-verdict')).includes('Correto'), 'Resposta enviada com Enter');

// ---------- Revisão do diagnóstico
await go('review');
ok((await page.textContent('#main')).includes('Diagnósticos do Treino'), 'Caderno de Revisão mostra o Treino');
await page.click('.tr-review-section [data-act=tr-rev]');
await page.click(`.tr-tool[data-id=${e0.method}]`);
ok((await page.textContent('.tr-rev-card')).includes('3 dias'), 'Acerto na revisão adia para 3 dias');

// ---------- Modo prova: 5 questões certas = nota 10
await go('treino'); await page.click('[data-act=tr-view][data-id=prova]');
await page.click('[data-act=tr-pv-n][data-id="5"]'); await page.fill('#pv-name', 'Teste automático');
await page.click('[data-act=tr-pv-start]');
ok(await page.isVisible('#tr-timer'), 'Prova com cronômetro');
await shot(page, 'v9-prova-questao');
const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('numera-treino-v9'))._prova.ids);
for (let k = 0; k < ids.length; k++) {
  const e = data.find(x => x.id === ids[k]);
  ok(!(await page.textContent('#tr-pv-form')).includes(e.ask) || e.ask === e.askBlind, 'Prova não revela o método na pergunta ' + (k + 1));
  await page.click(`.tr-tool[data-id=${e.method}]`);
  const v = e.answer.type === 'vec' ? e.answer.values : [e.answer.value];
  for (let i = 0; i < v.length; i++) await page.fill('#pv-ans-' + i, fmt(v[i]));
  if (k < ids.length - 1) await page.click('[data-act=tr-pv-next]'); else await page.click('.tr-nav [data-act=tr-pv-end]');
}
await page.click('[data-act=tr-pv-end-yes]');
ok((await page.textContent('.tr-grade b')).trim() === '10,0', 'Prova toda certa vale 10,0');
await shot(page, 'v9-prova-relatorio');
await page.emulateMedia({ media: 'print' });
ok(!(await page.isVisible('.topbar')) && await page.isVisible('.tr-report') && !(await page.isVisible('.tr-report .no-print')), 'Impressão mostra só o relatório');
await page.pdf({ path: (PREV || '/tmp') + '/v9-relatorio-prova.pdf', format: 'A4', printBackground: true }).catch(() => {});
await page.emulateMedia({ media: 'screen' });

// ---------- Celular: sem rolagem horizontal
await page.setViewportSize({ width: 390, height: 844 });
for (const hash of ['home', 'academy', 'treino', 'lab', 'review', 'progress', 'cases', 'jogos']) {
  await go(hash);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 0, `Celular sem rolagem lateral em #${hash} (${over}px)`);
}
await go('lab'); await page.click('[data-act=example][data-index="0"]'); await page.click('#terminal-form button[type=submit]'); await page.waitForSelector('.result-shell'); await page.click('[data-act=result-tab][data-id=converge]');
ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'Celular: gráfico de convergência cabe na tela');
await shot(page, 'v9-celular-convergencia');
await go('treino'); await page.click('[data-act=tr-view][data-id=prova]'); await page.click('[data-act=tr-pv-start]');
ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'Celular: prova cabe na tela');
await shot(page, 'v9-celular-prova');
await page.click('[data-act=tr-pv-quit]');

// ---------- Modo escuro
await page.setViewportSize({ width: 1280, height: 900 }); await page.emulateMedia({ colorScheme: 'dark' });
await go('treino'); await page.click('[data-act=tr-view][data-id=ex]');
await page.click('[data-act=tr-open][data-index="1"]'); await page.click('.tr-tool >> nth=0'); await page.click('[data-act=tr-key]');
await page.evaluate(() => document.querySelector('.tr-conv').scrollIntoView());
ok(await page.isVisible('.tr-conv .conv-plot'), 'Modo escuro: gabarito com gráfico');
await shot(page, 'v9-escuro-gabarito');

// ---------- v10: correções da auditoria e aulas em vídeo
await page.emulateMedia({ colorScheme: 'light' });
await ctx.route(/youtube(-nocookie)?\.com|ytimg/, r => r.abort());
// Quase-raiz: |f| abaixo da tolerância sem raiz não vira solução.
await go('lab'); await page.evaluate(() => { document.querySelector('details.advanced').open = true; });
await page.fill('#source', '1e-20*(x^2+1) = 0'); await page.selectOption('#algorithm', 'newton'); await page.fill('#x0', '0');
await page.click('#terminal-form button[type=submit]'); await page.waitForSelector('.result-shell');
ok((await page.textContent('.result-shell .eyebrow')).includes('Quase-raiz') && (await page.textContent('.answer-result span')).includes('não é raiz'), 'Terminal: quase-raiz não é apresentada como solução');
ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'solve-btn'), 'Foco volta ao botão Resolver depois do resultado');
await shot(page, 'v10-quase-raiz');
await page.selectOption('#algorithm', 'auto'); await page.fill('#source', '(x - 1.337)^2 = 0'); await page.click('#terminal-form button[type=submit]'); await page.waitForSelector('.result-shell');
ok((await page.textContent('.result-shell .eyebrow')).includes('multiplicidade par'), 'Terminal: raiz dupla marcada como provável');
// Sistema em escala extrema.
await page.click('[data-act=mode][data-id=system]'); await page.fill('#source', '1e-20x = 1e-20\ny = 1'); await page.click('#terminal-form button[type=submit]'); await page.waitForSelector('.result-shell');
ok((await page.textContent('.answer-result strong')).replace(/\s/g, '') === 'x=1y=1', 'Terminal resolve 1e-20·x = 1e-20, y = 1');
// Aulas em vídeo na trilha: links e player só depois do clique.
await go('academy'); await page.click('[data-act=course][data-id=secant]');
ok(await page.$$eval('.course-videos .video-card', c => c.length) === 3, 'Trilha da Secante: 3 aulas em vídeo');
ok(await page.$$eval('.course-videos a[href^="https://www.youtube.com/watch?v="]', a => a.every(x => x.target === '_blank' && /noopener/.test(x.rel))), 'Links do YouTube abrem em nova aba');
ok((await page.$$('.course-videos iframe')).length === 0, 'Nenhum player carregado antes do clique');
await page.click('.course-videos [data-act=video-toggle] >> nth=0');
ok(await page.$eval('.course-videos iframe', f => f.src.startsWith('https://www.youtube-nocookie.com/embed/') && !!f.title), 'Assistir aqui abre o player do youtube-nocookie, com título');
await page.click('.course-videos [data-act=video-toggle] >> nth=0'); ok((await page.$$('.course-videos iframe')).length === 0, 'Fechar o vídeo remove o player');
await page.evaluate(() => document.querySelector('.course-videos').scrollIntoView()); await shot(page, 'v10-aulas-em-video');
await page.click('[data-act=start-node][data-id=intro]'); for (let i = 0; i < 7; i++) await page.click('[data-act=intro-next]');
ok(await page.isVisible('.player .videos.in-player'), 'Leitura guiada: última tela com as aulas');
// Treino: "visto com ajuda" e prova encerrada pelo tempo.
await go('treino'); await page.click('[data-act=tr-view][data-id=ex]'); await page.click('[data-act=tr-open][data-index="5"]'); await page.click('[data-act=tr-key]');
ok(await page.isVisible('.tr-tile.st-helped'), 'Abrir o gabarito antes: casa "visto com ajuda" no tabuleiro');
await page.click('[data-act=tr-view][data-id=prova]'); await page.click('[data-act=tr-pv-limit][data-id="20"]'); await page.click('[data-act=tr-pv-start]');
ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'pv-title'), 'Prova: foco na questão');
await page.waitForTimeout(120); ok((await page.textContent('#announcer')).includes('Prova iniciada'), 'Prova: início anunciado ao leitor de tela');
await page.click('[data-act=tr-pv-next]'); await page.waitForTimeout(120); ok((await page.textContent('#announcer')).includes('Questão 2'), 'Prova: troca de questão anunciada');
await page.evaluate(() => { const k = 'numera-treino-v9', p = JSON.parse(localStorage.getItem(k)); p._prova.start = Date.now() - 25 * 60 * 1000; localStorage.setItem(k, JSON.stringify(p)); });
await page.reload(); await page.waitForTimeout(200);
if (!(await page.isVisible('.tr-report'))) await page.click('[data-act=tr-view][data-id=prova]');
ok(await page.isVisible('.tr-report') && (await page.textContent('.tr-report')).includes('A prova foi encerrada pelo tempo'), 'Prova expirada: relatório direto, com aviso');
await shot(page, 'v10-prova-encerrada-pelo-tempo');
// Backup único: um arquivo com trilhas, Treino e provas.
await go('progress');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=backup]')]);
const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
ok(bk.app === 'numera-academy' && bk.backupVersion === 2 && bk.trilhas && bk.treino && (bk.treino._provas || []).length >= 1, 'Backup exportado traz trilhas, Treino e provas');
// Fontes empacotadas.
ok(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 16px Figtree') && document.fonts.check('500 20px Newsreader'); }), 'Fontes carregadas do próprio site');

ok(erros.length === 0, 'Sem erros de JavaScript: ' + erros.slice(0, 3).join(' | '));
// ---------- v10.1: intervalo [a, b] no Terminal
await page.setViewportSize({ width: 1280, height: 900 }); await go('lab');
await page.fill('#source', 'x^3 - 9x + 3 = 0 em [0; 1]'); await page.waitForTimeout(150);
ok((await page.textContent('.calc-check')).includes('no intervalo [0; 1]'), 'Teclado reconhece o intervalo escrito junto da equação');
await page.selectOption('#algorithm', 'bisection'); await page.click('#solve-btn'); await page.waitForSelector('.interval-echo');
ok(await page.inputValue('#a') === '0' && await page.inputValue('#b') === '1' && !(await page.inputValue('#source')).includes('['), 'O intervalo sai da equação e vai para os campos a e b');
ok((await page.textContent('.answer-result strong')).includes('0,33760') && (await page.$$('.g-iv')).length === 2, 'Bisseção em [0; 1]: raiz 0,3376 e pontas marcadas no gráfico');
await page.evaluate(() => document.querySelector('.result-shell').scrollIntoView()); await shot(page, 'v10.1-intervalo-bissecao');
await page.fill('#a', '0'); await page.fill('#b', '3'); await page.click('#solve-btn'); await page.waitForSelector('.alert .iv-fix');
ok((await page.textContent('.alert')).includes('mesmo sinal') && (await page.$$('.alert [data-act=use-interval]')).length === 2, 'Mesmo sinal nas pontas: explica e sugere [0,3; 0,4] e [2,8; 2,9]');
await page.evaluate(() => document.querySelector('.alert').scrollIntoView({ block: 'center' })); await shot(page, 'v10.1-intervalo-mesmo-sinal');
await page.click('.alert [data-act=use-interval] >> nth=1'); await page.waitForSelector('.result-shell');
ok((await page.textContent('.answer-result strong')).includes('2,81691') && await page.inputValue('#a') === '2,8', 'Um clique na sugestão preenche o intervalo e resolve');
await page.selectOption('#algorithm', 'newton'); await page.fill('#source', 'x^3 - x - 2 = 0'); await page.fill('#a', '1'); await page.fill('#b', '2');
ok(await page.isVisible('#x0') && await page.inputValue('#x0') === '', 'Newton: campo x₀ à vista e vazio');
await page.focus('#b'); await page.keyboard.press('Enter'); await page.waitForSelector('.iv-notes');
ok((await page.textContent('.answer-result strong')).includes('1,52137') && (await page.textContent('.iv-notes')).includes('Fourier'), 'Enter no campo b resolve; x₀ escolhido pela condição de Fourier');
await page.setViewportSize({ width: 390, height: 844 }); await page.selectOption('#algorithm', 'secant'); await page.waitForTimeout(150);
ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'Celular: campos do intervalo sem rolagem lateral');
await page.evaluate(() => document.querySelector('.terminal-params').scrollIntoView({ block: 'center' })); await shot(page, 'v10.1-intervalo-celular');
await page.setViewportSize({ width: 1280, height: 900 });
// Nenhum x^3 à vista: só a caixa de digitação pode ter ^ (o teclado converte), o resto da página mostra o expoente elevado.
const semCircunflexo = () => page.evaluate(() => { const w = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT); let n, k = 0; while ((n = w.nextNode())) if (!n.parentElement.closest('textarea') && /[\w)\]}²³π]\^/.test(n.textContent)) k++; return k; });
await go('lab'); await page.click('[data-act=help]'); ok(await semCircunflexo() === 0 && (await page.$$('.help-panel sup')).length > 0, 'Terminal e ajuda: expoentes elevados, sem ^');
await go('cases'); await page.click('[data-act=case][data-id=loan]'); await page.click('details summary'); ok(await semCircunflexo() === 0 && await page.isVisible('sup'), 'Missão do carnê: (1+i) com −12 elevado');
await go('treino'); await page.click('[data-act=tr-view][data-id=key]'); await page.waitForTimeout(300); ok(await semCircunflexo() === 0, 'Gabarito completo do Treino: nenhum ^ à vista');
// ---------- v13: Listas (banco de questões), Revisão e Relâmpago
await go('listas'); ok(await page.locator('.bq-card').count() === 12 && await page.isVisible('#bq-lista'), 'Listas: 12 questões por vez e filtros');
await page.selectOption('#bq-lista', 'lista-01'); await page.selectOption('#bq-tema', 'newton'); await page.click('[data-act=bq-abrir][data-id=l01-zeros-03]');
await page.fill('#bq-in-l01-zeros-03', '2,1'); await page.press('#bq-in-l01-zeros-03', 'Enter'); ok((await page.textContent('#bq-l01-zeros-03 .bq-feedback')).includes('Revisão'), 'Listas: erro manda a questão para a Revisão');
await page.fill('#bq-in-l01-zeros-03', '2,00076'); await page.press('#bq-in-l01-zeros-03', 'Enter'); ok((await page.textContent('#bq-l01-zeros-03 .bq-feedback')).includes('Certo') && await page.isVisible('#bq-l01-zeros-03 .pp-table'), 'Listas: acerto com a tabela no formato dos slides');
await page.selectOption('#bq-tema', 'bissecao'); await page.click('[data-act=bq-abrir][data-id=l01-zeros-12]'); await page.click('[data-act=bq-mc][data-id=l01-zeros-12]'); await page.locator('#bq-l01-zeros-12 [data-act=bq-alt]').first().click();
ok(await page.isVisible('#bq-l01-zeros-12 .bq-obs.diverge'), 'Listas: gabarito da lista divergente explicado');
ok(await semCircunflexo() === 0, 'Listas: nenhum ^ à vista');
await go('review'); ok(await page.locator('.review-row h3', { hasText: 'Lista 1' }).count() >= 1, 'Revisão: questão das listas no caderno');
await go('relampago'); await page.click('[data-act=rl-grupo][data-id=raizes]'); await page.click('[data-act=rl-comecar]'); ok(await page.locator('[data-act=rl-alt]').count() === 4 && await page.isVisible('#rl-barra'), 'Relâmpago: pergunta com 4 alternativas e cronômetro');
for (let i = 0; i < 10; i++) { await page.keyboard.press('1'); await page.click('[data-act=rl-proxima]'); }
ok(await page.isVisible('[data-act=rl-comecar]') && (await page.textContent('.stat-row')).includes('Pontos'), 'Relâmpago: rodada de 10 perguntas pelo teclado até o resultado');
await go('jogos'); ok(await page.isVisible('.game-rl'), 'Jogos: cartão do Relâmpago');
await page.goto(BASE + 'jogos/bobo-da-corte/index.html'); await page.click('[data-a=comecar]').catch(() => {});
ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'Celular: Bobo da Corte sem rolagem lateral');
await browser.close(); fim('Fluxos (v12)');
