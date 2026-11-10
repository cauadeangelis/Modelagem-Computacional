const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../dist/js/motor/experimentos.js');
const perto = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
test('Newton, Lagrange, ajuste e quadraturas contra polinômios conhecidos', () => {
  const p = [[0, 0], [1, 1], [2, 4], [3, 9], [4, 16]], i = E.interpolar(p);
  for (const x of [0, 0.3, 1.5, 2.9, 4]) { perto(i.newton(x), x * x); perto(i.lagrange(x), x * x); }
  perto(E.integrar(p, 'simpson').valor, 64 / 3);
  perto(E.integrar([[0, 1], [0.4, 1.8], [2, 5]]).valor, 6);
  const a = E.ajuste([[2, 7], [0, 3], [1, 5]]); perto(a.a, 2); perto(a.b, 3); perto(a.sse, 0);
  assert.throws(() => E.interpolar([[0, 1], [0, 2]]));
  assert.throws(() => E.interpolar([[0, NaN], [1, 2]]));
  assert.throws(() => E.integrar([[0, 0], [1, 1]], 'simpson'));
  assert.throws(() => E.integrar([[0, 0], [1, 1], [3, 9]], 'simpson'));
});
test('Spline interpola nós e mantém continuidade da primeira derivada', () => {
  const p = [[0, 1], [1, 3], [2, -1], [4, 2]], s = E.spline(p), h = 1e-5;
  p.forEach(([x, y]) => perto(s.f(x), y));
  for (const x of [1, 2]) perto((s.f(x) - s.f(x - h)) / h, (s.f(x + h) - s.f(x)) / h, 0.0002);
  perto(s.m[0], 0); perto(s.m[3], 0);
});
test('Gauss-Seidel difunde com valores novos e converge ao equilíbrio de Laplace', () => {
  let gs = Array(9).fill(20), ja = gs.slice();
  const first = E.termica(gs); perto(first.valores[0], 40); perto(first.valores[1], 45);
  perto(E.termica(ja, 'jacobi').valores[1], 40);
  assert.equal(first.etapas.length, 9); perto(first.etapas[0][1], 20);
  let g, j;
  for (let i = 0; i < 50; i++) { g = E.termica(gs); j = E.termica(ja, 'jacobi'); gs = g.valores; ja = j.valores; }
  assert.ok(g.residuo < j.residuo && g.residuo < 1e-9);
  perto(gs[4], 40, 1e-8); assert.ok(gs.every(t => t >= 20 && t <= 100));
  assert.equal(E.resfriar(100, 0.5).estavel, true); perto(E.resfriar(100, 0.5).temperatura, 60);
  assert.equal(E.resfriar(100, 2.5).estavel, false); assert.ok(E.resfriar(E.resfriar(100, 2.5).temperatura, 2.5).temperatura > 100);
});
test('Runge causa colisão e maior energia que a spline na mesma missão', () => {
  const p = E.drone('polinomio'), s = E.drone('spline');
  assert.ok(p.colisao > 0); assert.equal(s.colisao, -1); assert.ok(p.energia > 10 * s.energia);
  perto(p.acumulada[200], p.energia); assert.ok(s.acumulada.every((v, i) => !i || v >= s.acumulada[i - 1]));
});
test('Cancelamento e pivoteamento são consequências do arredondamento', () => {
  const m = E.mantissa(4); assert.equal(m.direta, 0); assert.ok(m.erroEstavel < 1e-6);
  assert.ok(E.mantissa(10).erroDireta < 1e-6);
  const A = [[0.00001, 1], [1, 1]], b = [1, 2];
  assert.ok(E.gaussCurto(A, b, false).residuo > 0.9); assert.ok(E.gaussCurto(A, b, true).residuo < 0.0001);
  assert.throws(() => E.gaussCurto([[0, 1], [1, 1]], [1, 2], false));
});
test('Desafios históricos e cena da Usina têm respostas calculadas e nenhuma resposta futura', async () => {
  const { desafioMestre, jogarDesafio } = await import('../dist/jogos/calculandia/codigo/sistemas/desafios-dos-mestres.js');
  for (const id of ['newton', 'gauss', 'lagrange', 'euler']) { const d = desafioMestre(id); assert.ok(Number.isFinite(d.valor)); assert.ok(d.erradas.every(v => Math.abs(v - d.valor) > 1e-6)); }
  perto(desafioMestre('newton').valor, 2.094568121104185);
  const registro = {}; let saves = 0;
  await jogarDesafio({ show: async cfg => { if (cfg.options) { assert.equal(cfg.options.length, 4); assert.equal(cfg.options[3].value, 'voltar'); return '1'; } } }, {}, 'newton', registro, () => saves++);
  assert.equal(registro.desafio, true); assert.equal(saves, 1);
  const { cenaUsina } = await import('../dist/jogos/calculandia/codigo/fases/fenomeno-usina.js');
  assert.match(cenaUsina(0, [0], 3, 0), /Passos concluídos: 0/);
  assert.doesNotMatch(cenaUsina(1, [0, 0, 0, 0], 20, 0), /NaN|Infinity/);
});
