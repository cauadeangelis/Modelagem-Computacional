import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, METHODS } from '../../dist/jogos/calculandia/codigo/fases/catalogo-de-fases.js';
import { Session, Battle, score } from '../../dist/jogos/calculandia/codigo/fases/sessao.js';
import { half, floatBits, fromBits, quadrature, factor, solveFactors, norm, mv, spline, fit } from '../../dist/jogos/calculandia/codigo/motor/numerico.js';

function prepare(g) {
  const { method: m, difficulty: n } = g.level;
  if (m === 'cancelamento') g.configure({ formulaChoice: 'stable' });
  if (m === 'overflow') g.configure({ formulaChoice: 'scaled' });
  if (m === 'bissecao' && n === 'D') g.configure({ a: 1.5, b: 3 });
  if (m === 'falsaPosicao' && n === 'D') g.useRelic('illinois');
  if (m === 'pontoFixo' && n === 'M') g.configure({ gIndex: 2 });
  if (m === 'pontoFixo' && n === 'D') g.useRelic('damping');
  if (m === 'newton' && n === 'M') g.configure({ x: -2 });
  if (m === 'newton' && n === 'D') g.useRelic('multiplicity');
  if (m === 'secante' && n === 'D') g.configure({ prev: 2, x: 2.25 });
  if (m === 'gauss' && n === 'M') g.act('swapRow', { i: 0, j: 2 });
  if (m === 'pivoteamento' && n === 'M') g.act('swapCol', { i: 0, j: 1 });
  if (['jacobi', 'seidel'].includes(m) && n === 'M') g.act('swapRow', { i: 0, j: 1 });
  if (m === 'lagrange' && n === 'M') { g.switchTool('newtonInterp'); g.act('node', { x: Math.PI / 2 }); }
  if (m === 'lagrange' && n === 'D') g.useRelic('chebyshev');
  if (m === 'spline' && n === 'D') g.useRelic('clamped');
  if (m === 'minimosQuadrados' && n === 'M') g.useRelic('linearize');
  if (m === 'minimosQuadrados' && n === 'D') g.useRelic('center');
  if (m === 'trapezio') g.configure({ n: { F: 12, M: 41, D: 360 }[n] });
  if (m === 'simpson13' && n === 'M') g.configure({ n: 12 });
  if (m === 'simpson13' && n === 'D') g.useRelic('substitution');
  if (m === 'simpson38' && n === 'F') g.configure({ n: 6 });
  if (m === 'simpson38' && n === 'M') g.switchTool('combo');
  if (m === 'simpson38' && n === 'D') g.useRelic('adaptive');
  if (m === 'euler') { if (n === 'D') g.useRelic('implicit'); else g.configure({ h: n === 'F' ? .02 : .025 }); }
  if (m === 'rk4' && n === 'D') g.configure({ h: .025 });
}
function finish(g, submit = true, afterStep = () => {}) {
  for (let i = 0; i < 120 && !g.ready && g.status === 'play'; i++) {
    if (g.level.kind === 'linear' && g.s.solutionError != null && g.s.error > g.level.tau && g.level.relics.includes('refinement')) { g.useRelic('refinement'); g.act('refine'); }
    else g.act();
    afterStep();
  }
  assert.equal(g.status, 'play', `${g.level.id}: ${g.reason}; e=${g.s.error}, battery=${g.s.battery}`);
  assert.ok(submit ? g.submit() : g.ready, `${g.level.id}: erro=${g.s.error}, k=${g.s.k}, bateria=${g.s.battery}; ${g.reason}`);
}
for (const m of METHODS) for (const n of ['F', 'M', 'D']) test(`Missão ${m}/${n} converge dentro da bateria`, () => { const g = new Session(getLevel(m, n)); prepare(g); finish(g); assert.ok(g.result().xp > 0); assert.ok(g.s.battery > 0); });
test('XP reproduz o exemplo da especificação e trata erro zero', () => {
  const v = score({ error: 5e-5, tau: 1e-4, iterations: 16, ideal: 14, battery: 4, batteryMax: 20, difficulty: 'M', time: 120, timeMax: 300, manual: true });
  assert.equal(v.xp, 1932); assert.ok(Number.isFinite(score({ error: 0, tau: .01, iterations: 1, ideal: 1, battery: 3, batteryMax: 4, difficulty: 'F' }).xp));
});
test('Precisão half, Simpson e LU conferidos independentemente', () => {
  assert.equal(half(90000), Infinity); assert.equal(half(65504), 65504); assert.equal(half(1 + 2 ** -11), 1);
  assert.ok(Math.abs(quadrature(x => x * x, 0, 2, 4, 'simpson13') - 8 / 3) < 1e-14);
  const A = [[0, 2, 1], [1, 1, 1], [2, 1, 3]], b = [4, 5, 11], x = solveFactors(factor(A), b);
  assert.ok(norm(mv(A, x).map((v, i) => v - b[i])) < 1e-12);
});
test('Laboratório de bits reproduz sinal, expoente e mantissa em 16/32/64 bits', () => {
  for (const width of [16,32,64]) for (const value of [0,-0,1.25,-2,65504]) { const representation=floatBits(value,width); assert.ok(Object.is(fromBits(representation.bits,width),value)); }
  assert.equal(fromBits(0x7c00n,16),Infinity);assert.equal(fromBits(0x8000n,16),-0);assert.ok(Number.isNaN(fromBits(0x7e00n,16)));
});
test('Erros acima da tolerância e bateria zero nunca vencem', () => {
  const t = new Session(getLevel('trapezio')); t.configure({ n: 2 }); t.act(); assert.equal(t.submit(), false); assert.ok(Math.abs(t.s.error - 1 / 3) < 1e-12);
  const g = new Session(getLevel('newton'), { battery: 3 }); g.act(); assert.equal(g.status, 'lost'); assert.equal(g.submit(), false); g.act(); assert.equal(g.s.battery, 0);
});
test('Patologias: derivada nula, ciclo, sondas gêmeas e overflow', () => {
  const g = new Session(getLevel('newton', 'D')); g.configure({ x: -1 }); g.act(); assert.ok(g.s.flags.includes('derivadaNula'));
  const c = new Session(getLevel('newton', 'M')); c.act(); c.act(); c.act(); assert.ok(c.everRed);
  const s = new Session(getLevel('secante', 'D')); s.act(); s.act(); assert.equal(s.status, 'lost');
  const o = new Session(getLevel('overflow', 'D')); o.act(); assert.equal(o.status, 'lost');
});
test('Undo restaura estado numérico sem devolver energia nem apagar alertas', () => {
  const g = new Session(getLevel('newton', 'M')); g.act(); const left = g.s.battery; g.undo(); assert.equal(g.s.x, 0); assert.equal(g.s.battery, left - 2); assert.equal(g.traces.length, 0);
});
export { prepare, finish };

test('Referências independentes: bisseção, Newton, secante e RK4', () => {
  const b = new Session(getLevel('bissecao')); for(let i=0;i<7;i++)b.act(); assert.equal(b.s.x,1.5234375); assert.equal(b.s.widthError,1/128);
  const n = new Session(getLevel('newton'));n.act();n.act();assert.ok(Math.abs(n.s.x-1.41421568627451)<1e-13);
  const s = new Session(getLevel('secante'));s.act();s.act();s.act();assert.ok(Math.abs(s.s.x-1.4146341463414633)<1e-13);
  const r = new Session(getLevel('rk4'));r.act();assert.deepEqual(r.s.slopes,[1,1.25,1.3125,1.65625]);assert.equal(r.s.y,1.6484375);assert.ok(Math.abs(r.s.error-(Math.exp(.5)-1.6484375))<1e-14);
});
test('Referências independentes: Jacobi nilpotente, LU, spline e MMQ', () => {
  const j = new Session(getLevel('jacobi','D'));j.act();j.act();j.act();assert.deepEqual(j.s.x,[1,2,3]);
  const lu = factor([[2,1,1],[4,3,3],[8,7,9]],16,false);assert.deepEqual(lu.L,[[1,0,0],[2,1,0],[4,3,1]]);assert.deepEqual(lu.U,[[2,1,1],[0,1,1],[0,0,2]]);
  const M = spline([0,1,2,3,4],[0,2,1,3,2]).M;assert.ok(norm(M.map((v,i)=>v-[0,-45/7,54/7,-45/7,0][i]))<1e-12);
  const c = fit([1,2,3,4],[2.1,3.9,6.2,7.8]).coef;assert.ok(norm(c.map((v,i)=>v-[.15,1.94][i]))<1e-12);
});
test('Configuração, prévia e desfazer não falsificam precisão, energia ou dica L3', () => {
  const g = new Session(getLevel('newton'));const preview=g.preview();assert.equal(g.s.battery,9);assert.equal(g.totalIterations,0);assert.equal(preview.battery,6);
  g.act();g.s.hintLevel=3;g.s.usedL3=true;g.s.hints=3;g.undo();assert.equal(g.s.usedL3,true);assert.equal(g.s.hints,3);assert.equal(g.totalIterations,1);
  const t=new Session(getLevel('trapezio'));t.configure({n:12});t.act();assert.ok(t.ready);t.configure({n:2});assert.equal(t.ready,false);
});
test('Fúria modifica a função e a Hidra regenera ao repetir ferramenta', () => {
  const b=new Battle('chefe1'), old=b.session.level.f; b.session.s.fury=100;b.afterStep();assert.ok(b.forcedSwitch);assert.notEqual(b.session.level.f,old);assert.ok(!Number.isFinite(b.session.level.f(1.1)));
  const h=new Battle('chefe1');prepare(h.session);finish(h.session,false);h.next();h.session.switchTool('bissecao');h.afterStep();assert.ok(h.forcedSwitch);assert.match(h.session.reason,/regenerou/);
});

for (const id of ['chefe0', 'chefe1', 'chefe2', 'chefe3', 'chefe4', 'final']) test(`Batalha completa ${id}: bateria compartilhada e resultado calculado`, () => {
  const b = new Battle(id);
  while (!b.done) {
    const g = b.session;
    if (id === 'final' && b.index === 1) g.configure({ x: g.level.target + 1 });
    else if (g.level.scenario === 'sum') g.useRelic('kahan');
    else prepare(g);
    finish(g, false, () => b.afterStep());
    assert.equal(b.forcedSwitch, false, g.reason);
    const energy = g.s.battery; assert.equal(b.next(), true);
    if (!b.done) assert.equal(b.session.s.battery, energy);
  }
  const r = b.result(); assert.ok(r.vitoria); assert.equal(r.stages.length, 3); assert.ok(Number.isFinite(r.erroFinal)); assert.ok(r.bateriaRestante > 0);
  if (id === 'final') { assert.equal(b.parameters.length, 4); assert.ok(Math.abs(b.session.level.y0 - 2) < 1e-4); assert.ok(Math.abs(b.session.level.lambda - 40) < .001); }
});
