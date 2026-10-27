// Confere o gabarito dos 140 exercícios do Treino com o motor do site (math-engine.js).
// O gabarito foi calculado de forma independente (sympy/mpmath, 50 dígitos); aqui o motor refaz cada conta,
// confere que cada "erro típico" (trap) é mesmo diferente da resposta e que o gráfico de convergência
// do gabarito mostra o método do exercício chegando à raiz certa.
// Uso: node tests/treino/conferir-com-motor.cjs
const fs = require('fs'), vm = require('vm'), path = require('path');
const dist = path.join(__dirname, '../../dist');
const ctx = { window: {}, Math, Number, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dist, 'math-engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(dist, 'treino-data.js'), 'utf8'), ctx);
const M = ctx.window.NumeraMath, E = ctx.window.NumeraTreino.exercises;
const rel = (a, b, t = 1e-7) => Math.abs(a - b) <= t * (1 + Math.abs(b));
const fails = []; let checks = 0, trapChecks = 0, convChecks = 0;
const METHODS = ['bisection', 'falseposition', 'fixedpoint', 'newton', 'secant', 'gauss', 'seidel'];
const VARS = ['x', 'y', 'z', 'u'];
function engineAnswer(e) {
  const c = e.check || {}, o = { tolerance: 1e-12, maxIterations: 500 };
  if (e.method === 'bisection') {
    const fn = M.parseFunction(e.source);
    if (c.k) return M.bisection(fn, c.a, c.b, { tolerance: 1e-12, maxIterations: c.k }).iterations[c.k - 1].x;
    if (c.n) { const r = M.bisection(fn, c.a, c.b, { tolerance: 1e-12, maxIterations: c.n }); return ((c.b - c.a) / 2 ** c.n <= c.eps && (c.b - c.a) / 2 ** (c.n - 1) > c.eps && r.iterations.length === c.n) ? c.n : NaN; }
    return M.smartRoot(e.source, { min: Math.min(e.terminal.a, e.terminal.b), max: Math.max(e.terminal.a, e.terminal.b) }).roots.find(r => r.root >= e.terminal.a && r.root <= e.terminal.b).root;
  }
  if (e.method === 'falseposition') {
    const fn = M.parseFunction(e.source);
    if (c.k) { const r = M.falsePosition(fn, c.a, c.b, { tolerance: 1e-12, maxIterations: c.k }); if (r.iterations.length !== c.k) throw Error('parou antes de k'); return r.iterations[c.k - 1].x; }
    if (c.count) { const r = M.falsePosition(fn, c.a, c.b, { tolerance: c.eps, maxIterations: 500 }); return r.converged ? r.steps : NaN; }
    return M.falsePosition(fn, e.terminal.a, e.terminal.b, o).root;
  }
  if (e.method === 'fixedpoint') {
    const g = M.parseFunction(e.g);
    if (c.k) { const r = M.fixedPoint(g, c.x0, { tolerance: 1e-12, maxIterations: c.k }); if (r.iterations.length !== c.k + 1) throw Error('parou antes de k'); return r.iterations[c.k].x; }
    return M.fixedPoint(g, e.terminal.x0, o).root;
  }
  if (e.method === 'newton') {
    const fn = M.parseFunction(e.source);
    return c.k ? M.newton(fn, c.x0, { tolerance: 1e-12, maxIterations: c.k }).iterations[c.k].x : M.newton(fn, e.terminal.x0, o).root;
  }
  if (e.method === 'secant') {
    const fn = M.parseFunction(e.source);
    return c.k ? M.secant(fn, c.x0, c.x1, { tolerance: 1e-12, maxIterations: c.k }).iterations[c.k + 1].x : M.secant(fn, e.terminal.x0, e.terminal.x1, o).root;
  }
  const { A, b } = M.parseSystem(e.source);
  if (e.method === 'gauss' || c.until) { const x = M.gauss(A, b, o).root; return e.answer.type === 'num' ? x[VARS.indexOf(e.ask.match(/valor de (\w)/)[1])] : x; }
  return M.seidel(A, b, c.x0, { tolerance: 1e-12, maxIterations: c.k }).iterations.find(r => r.i === c.k).x;
}
for (const e of E) {
  const a = e.answer, want = a.type === 'vec' ? a.values : [a.value];
  let got;
  try { got = engineAnswer(e); } catch (err) { fails.push(`#${e.n} ${e.title}: erro ${err.message}`); continue; }
  const have = Array.isArray(got) ? got : [got];
  const tol = a.abs ? (x, y) => Math.abs(x - y) <= a.abs : (x, y) => rel(x, y, ['newton', 'fixedpoint', 'falseposition'].includes(e.method) ? 1e-8 : 1e-9);
  checks++;
  if (want.length !== have.length || !want.every((v, i) => tol(have[i], v))) fails.push(`#${e.n} ${e.title}: gabarito ${want} × motor ${have}`);
  // Armadilhas: nenhuma pode ser aceita como resposta certa (tolerância do site: 6e-4 relativo, abs, ou inteiro exato).
  const accept = (u, v) => a.abs ? Math.abs(u - v) <= a.abs + 1e-12 : a.type === 'int' ? Math.round(u) === v : Math.abs(u - v) <= Math.max(6e-4 * Math.abs(v), 1e-9);
  for (const t of e.traps || []) { trapChecks++; const tv = Array.isArray(t.v) ? t.v : [t.v]; if (tv.length === want.length && tv.every((u, i) => accept(u, want[i]))) fails.push(`#${e.n} ${e.title}: armadilha aceita como certa (${t.v})`); if (!t.m) fails.push(`#${e.n}: armadilha sem mensagem`); }
  // Gráfico de convergência do gabarito: o método do exercício precisa convergir para a raiz certa.
  try {
    if (e.method === 'gauss' || e.method === 'seidel') {
      const { A, b } = M.parseSystem(e.source), cv = M.convergenceSystem(A, b, e.conv.initial);
      convChecks++;
      if (e.method === 'seidel') { const s = cv.series.find(q => q.method === 'seidel'); if (!s || s.diverged || s.reach === null) fails.push(`#${e.n} ${e.title}: Seidel não converge no gráfico`); }
    } else {
      const cv = M.convergenceRoot(M.parseFunction(e.source), { ...e.conv, g: e.conv.g ? M.parseFunction(e.conv.g) : null, reference: e.root });
      convChecks++;
      if (!rel(cv.reference, e.root, 1e-8)) fails.push(`#${e.n} ${e.title}: referência do gráfico ${cv.reference} × raiz ${e.root}`);
      const s = cv.series.find(q => q.method === e.method);
      if (!s || s.other || !s.errors.length || s.error) fails.push(`#${e.n} ${e.title}: o método do exercício não converge no gráfico (${s && s.error})`);
    }
  } catch (err) { fails.push(`#${e.n} ${e.title}: gráfico falhou: ${err.message}`); }
  if (!e.askBlind || METHODS.some(m => e.askBlind.includes({ bisection: 'Bisseção', falseposition: 'Falsa Posição', fixedpoint: 'Ponto Fixo', newton: 'Newton', secant: 'Secante', gauss: 'Eliminação', seidel: 'Seidel' }[m]))) fails.push(`#${e.n} ${e.title}: pergunta cega cita o método`);
}
const methods = E.map(e => e.method), runs = methods.some((m, i) => i && m === methods[i - 1]);
const per = Object.fromEntries(METHODS.map(m => [m, methods.filter(x => x === m).length]));
console.log(`${checks} exercícios conferidos com o motor; ${trapChecks} erros típicos; ${convChecks} gráficos; divergências: ${fails.length}; métodos seguidos repetidos: ${runs ? 'sim' : 'não'}; por método: ${JSON.stringify(per)}`);
fails.forEach(f => console.log('  ' + f));
process.exit(fails.length || runs ? 1 : 0);
