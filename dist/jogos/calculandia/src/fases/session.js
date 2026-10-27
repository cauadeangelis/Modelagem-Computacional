import { norm, mv, residual, sig, half, kahan, factor, solveFactors, sweep, interpolate, spline, splineAt, fit, quadrature, adaptive, odeStep, maxError } from '../engine/numeric.js';
import { bossLevels, RELICS } from './levels.js';

const copy = x => structuredClone(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const dist = (a, b) => Array.isArray(a) ? norm(a.map((v, i) => v - b[i])) : Math.abs(a - b);
export const perksFor = xp => ({ level: 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 3000)), battery: xp >= 3000 ? 1.1 : 1, extraProbe: xp >= 12000 ? 1 : 0, freeUndo: xp >= 27000, preview: xp >= 48000 });
export function score({ error, tau, iterations, ideal, battery, batteryMax, difficulty, time = 0, timeMax = 300, manual = false, red = false, combo = 1, usedL3 = false }) {
  const Se = Math.min(1.5, error <= 0 ? 1.5 : Math.max(0, Math.log10(error) / Math.log10(tau))), Si = Math.min(1, ideal / Math.max(1, iterations)), St = manual ? Math.max(0, 1 - time / timeMax) : .5;
  // Três estrelas exigem convergência e eficiência; duas premiam precisão extra.
  let stars = error <= tau ? (iterations <= ideal + 1 && !red ? 3 : error <= tau / 10 && battery > 0 ? 2 : 1) : 0;
  if (usedL3) stars = Math.min(stars, 2);
  return { stars, xp: stars ? Math.round(1000 * ({ F: 1, M: 2, D: 4, B: 4 })[difficulty] * (.5 * Se + .3 * Si + .2 * St) * (1 + .25 * battery / batteryMax) * Math.min(1.5, combo) * (usedL3 ? .8 : 1)) : 0, factors: { Se, Si, St, Sb: battery / batteryMax, C: Math.min(1.5, combo) } };
}
export class Session {
  constructor(level, options = {}) {
    this.level = level; this.options = options; this.traces = []; this.history = []; this.started = Date.now(); this.status = 'play'; this.reason = ''; this.everRed = false; this.totalIterations = 0;
    const p = perksFor(options.xp || 0), n = level.A?.length || 0;
    const max = options.batteryMax ?? Math.ceil(level.battery * p.battery);
    this.s = { battery: options.battery ?? max, batteryMax: max, integrity: options.integrity ?? 100, k: 0, error: Infinity, residual: Infinity, rho: 0, order: null, delta: null, redRun: 0, redCount: 0, fury: 0,
      tool: level.method, a: level.a, b: level.b, x: level.x ?? (level.kind === 'linear' ? Array(n).fill(0) : null), prev: level.xPrev,
      gIndex: 0, lambda: 1, multiplicity: 1, illinois: false, lastSide: '', wa: 1, wb: 1, probes: [], flags: [], relics: [],
      A: level.A?.map(r => r.slice()), bvec: Array.isArray(level.b) ? level.b.slice() : null, colPerm: Array.from({ length: n }, (_, i) => i), rows: Array.from({ length: n }, (_, i) => i), factors: null, refinements: 0, rhsIndex: 0, solved: [],
      xs: level.xs?.slice(), ys: level.ys?.slice() || level.xs?.map(level.f), M: level.xs?.map(() => 0), boundary: 'natural', coef: [0, 0, 0], linearized: false, centered: false,
      n: level.n, h: level.h, t: 0, y: level.y0, points: level.kind === 'ode' ? [[0, level.y0]] : [], slopes: [], samples: [], substitution: false, adaptive: false, evaluations: 0,
      readIndex: 0, sum: 0, exactSum: 0, rounding: 'round', formulaChoice: 'direct', bits: 16, sumOrder: 'forward', value: null, hints: 0, hintLevel: 0, usedL3: false, manual: false, undos: 0 };
  }
  get ready() { return this.status === 'play' && this.s.battery > 0 && this.s.integrity > 0 && this.s.error <= this.level.tau && this.complete(); }
  complete() {
    const l = this.level, s = this.s;
    if (l.kind === 'float' && l.scenario === 'readings') return s.readIndex === l.readings.length;
    if (l.kind === 'ode') return s.t >= l.end - 1e-10;
    if (l.kind === 'linear' && l.solutions) return s.solved.length === l.solutions.length;
    return s.k > 0 && (l.maxNodes == null || s.xs.length <= l.maxNodes) && (l.maxEvaluations == null || s.evaluations <= l.maxEvaluations);
  }
  snapshot() { this.history.push({ state: copy(this.s), traces: this.traces.length }); if (this.history.length > 250) this.history.shift(); }
  preview() {
    const simulation = Object.assign(Object.create(Session.prototype), this, { s: copy(this.s), traces: copy(this.traces), history: [], options: { ...this.options } });
    simulation.act(); return simulation.s;
  }
  charge(cost) { this.s.battery = Math.max(0, Math.round((this.s.battery - cost) * 1e6) / 1e6); if (this.s.battery <= 0) this.fail('Bateria esgotada. Cada operação tem um custo; experimente outro método ou passo.'); }
  fail(reason) { if (this.status !== 'play') return; this.status = 'lost'; this.reason = reason; }
  configure(values) {
    if (this.status !== 'play') return;
    const allowed = ['a', 'b', 'x', 'prev', 'gIndex', 'lambda', 'multiplicity', 'n', 'h', 'rounding', 'formulaChoice', 'bits', 'sumOrder', 'manual'];
    if (Object.keys(values).some(k => !allowed.includes(k))) throw new Error('Controle desconhecido.');
    const s = this.s, l = this.level;
    for (const [k, v] of Object.entries(values)) {
      if (['a', 'b', 'x', 'prev', 'gIndex', 'lambda', 'multiplicity', 'n', 'h', 'bits'].includes(k) && !finite(v)) throw new Error('Informe um número finito.');
      if (k === 'n' && (!Number.isInteger(v) || v < 1 || v > 1e6)) throw new Error('n deve ser inteiro entre 1 e 1.000.000.');
      if (k === 'h' && (v <= 0 || v > 2 || (l.forceH && v !== l.forceH))) throw new Error(l.forceH ? `Esta etapa exige h=${l.forceH}.` : 'Use 0 < h ≤ 2.');
      if (k === 'gIndex' && (!Number.isInteger(v) || !l.gs?.[v])) throw new Error('Escolha uma função g disponível.');
      if (k === 'lambda' && (v <= 0 || v > 1)) throw new Error('Use 0 < λ ≤ 1.');
      if (k === 'multiplicity' && ![1, 2].includes(v)) throw new Error('Multiplicidade disponível: 1 ou 2.');
    }
    const reposition = ['a', 'b', 'x', 'prev', 'gIndex'].some(k => k in values && s[k] !== values[k]);
    if (reposition && s.k > 0) { this.snapshot(); this.charge(1); s.delta = null; s.redRun = 0; }
    const changesMath = Object.entries(values).some(([key, v]) => key !== 'manual' && s[key] !== v);
    Object.assign(s, values); if (reposition) { s.wa = s.wb = 1; }
    if (changesMath) s.error = Infinity;
  }
  switchTool(tool) {
    if (this.status !== 'play' || tool === this.s.tool) return;
    if (!this.level.tools.includes(tool)) throw new Error('Ferramenta indisponível nesta missão.');
    this.snapshot(); this.charge(this.s.k === 0 && this.traces.length === 0 ? 0 : 2); const s = this.s; s.tool = tool;
    if (this.level.kind === 'linear') { s.A = copy(this.level.A); s.bvec = mv(this.level.A, this.level.solutions?.[Math.min(s.rhsIndex, this.level.solutions.length - 1)] || this.level.solution); s.colPerm = s.rows.map((_, i) => i); s.rows = s.colPerm.slice(); s.factors = null; s.pivoted = []; s.error = Infinity; }
    if (tool === 'secante') { s.prev = s.a; s.x = s.b; }
    s.fury = 0; s.redRun = 0; s.delta = null;
  }
  useRelic(id) {
    const s = this.s; if (this.status !== 'play' || s.relics.includes(id)) return;
    if (!this.level.relics.includes(id) && !(this.options.relics || []).includes(id)) throw new Error('Relíquia indisponível.');
    this.snapshot(); s.relics.push(id);
    if (id === 'illinois') s.illinois = true;
    if (id === 'damping') s.lambda = .5;
    if (id === 'multiplicity') s.multiplicity = 2;
    if (id === 'linearize') { this.charge(2); s.linearized = true; }
    if (id === 'center') s.centered = true;
    if (id === 'clamped') s.boundary = 'clamped';
    if (id === 'implicit') this.switchTool('implicito');
    if (id === 'substitution') { s.substitution = true; s.n = 2; }
    if (id === 'adaptive') s.adaptive = true;
    if (id === 'kahan') s.sumOrder = 'kahan';
    if (id === 'chebyshev') { const n = this.level.maxNodes || s.xs.length; s.xs = Array.from({ length: n }, (_, i) => (this.level.a + this.level.b) / 2 + (this.level.b - this.level.a) / 2 * Math.cos((2 * i + 1) * Math.PI / (2 * n))).sort((a, b) => a - b); s.ys = s.xs.map(this.level.f); }
    s.error = Infinity;
  }
  probe(x, derivative = false) {
    if (this.status !== 'play') return;
    if (!finite(x)) throw new Error('Informe uma posição finita.');
    const l = this.level, s = this.s, limit = (l.probeLimit || 100) + perksFor(this.options.xp || 0).extraProbe;
    if (s.probes.length >= limit) throw new Error('Limite de sondas atingido.');
    this.snapshot(); const value = derivative ? l.dg?.[s.gIndex]?.(x) : l.f?.(x);
    s.probes.push({ x, y: value, derivative }); this.charge(1); return value;
  }
  undo() {
    if (this.status !== 'play' || !this.history.length) return;
    const cost = perksFor(this.options.xp || 0).freeUndo && this.s.undos === 0 ? 0 : 2, battery = this.s.battery - cost, undos = this.s.undos + 1;
    const hints = { hints: this.s.hints, hintLevel: this.s.hintLevel, usedL3: this.s.usedL3 }, previous = this.history.pop(); this.s = previous.state; Object.assign(this.s, hints); this.s.battery = Math.max(0, battery); this.s.undos = undos; this.traces.length = previous.traces;
    if (battery <= 0) this.fail('Bateria esgotada ao desfazer.');
  }
  submit() {
    if (this.status !== 'play') return false;
    if (!this.ready) { this.reason = `Ainda não estabilizou: erro ${this.s.error}, tolerância ${this.level.tau}. Complete a missão e confira os instrumentos.`; return false; }
    this.status = 'won'; this.reason = 'Sistema estabilizado.'; return true;
  }
  tick(seconds) { if (this.status === 'play' && this.s.manual) { this.s.integrity = Math.max(0, this.s.integrity - seconds * .12); if (!this.s.integrity) this.fail('A estrutura cedeu durante a sobrecarga manual.'); } }
  act(action = 'step', args = {}) {
    if (this.status !== 'play') return null;
    this.snapshot(); const before = copy(this.s), l = this.level; let r;
    try {
      r = l.kind === 'root' ? this.rootStep() : l.kind === 'linear' ? this.linearStep(action, args) : l.kind === 'float' ? this.floatStep() : l.kind === 'integral' ? this.integralStep() : l.kind === 'ode' ? this.odeStep() : this.curveStep(action, args);
    } catch (e) {
      // Uma tentativa inválida tem custo e diagnóstico; não publica NaN como sucesso.
      this.s = before; r = { cost: 1, formula: e.message, flags: ['operacaoInvalida'], damage: 20, iteration: false };
    }
    const s = this.s; if (r.noop) { this.history.pop(); return null; }
    if (r.iteration !== false) { s.k++; this.totalIterations++; }
    this.charge(r.cost);
    const delta = r.iteration === false || s.x == null || before.x == null ? null : dist(s.x, before.x);
    s.rho = delta != null && before.delta > 1e-15 ? delta / before.delta : 0;
    s.delta = delta;
    s.flags = r.flags || [];
    const last = this.traces.filter(t => t.iteration && t.err > 0).slice(-2);
    s.order = last.length === 2 && s.error > 0 && last[0].err !== last[1].err ? Math.log(s.error / last[1].err) / Math.log(last[1].err / last[0].err) : null;
    if (!Number.isFinite(s.order)) s.order = null;
    s.redRun = s.rho >= 1 && s.error > l.tau ? s.redRun + 1 : 0;
    if (s.redRun >= 2) s.flags.push('divergencia');
    if (s.flags.length) { s.integrity = Math.max(0, s.integrity - (r.damage || 12)); this.everRed = true; s.redCount++; }
    if (s.integrity <= 0) this.fail('Integridade esgotada. ' + r.formula);
    if (l.redLimit && s.redCount >= l.redLimit) this.fail('Alertas vermelhos repetidos: troque a estratégia antes de insistir.');
    s.slowRun = s.rho > .8 && s.error > l.tau ? (s.slowRun || 0) + 1 : 0;
    if (s.slowRun >= 3) s.fury += 25; else if (!s.slowRun) s.fury = Math.max(0, s.fury - 10);
    const scale = Array.isArray(s.x) ? norm(s.x) : Math.abs(s.x ?? s.value ?? 0);
    s.relativeError = delta == null ? null : delta / Math.max(scale, 1e-15);
    const trace = { k: s.k, x: copy(s.x ?? s.value), fx: s.fx ?? s.residual, err: s.error, relativeError: s.relativeError, cost: r.cost, battery: s.battery, integrity: s.integrity, rho: s.rho, p: s.order, flags: s.flags.slice(), formula: r.formula, iteration: r.iteration !== false };
    this.traces.push(trace); this.reason = r.formula; return trace;
  }
  rootStep() {
    const s = this.s, l = this.level, old = s.x; let x, cost, flags = [], formula;
    if (['bissecao', 'falsaPosicao'].includes(s.tool)) {
      if (s.a === s.b && l.f(s.a) === 0) return { noop: true };
      if (!(s.a < s.b) || l.f(s.a) * l.f(s.b) > 0) throw new Error('Sem troca de sinal: reposicione ou sonde as âncoras.');
      const fa = l.f(s.a), fb = l.f(s.b);
      const width = (s.b - s.a) / 2;
      x = s.tool === 'bissecao' ? (s.a + s.b) / 2 : (s.a * fb * s.wb - s.b * fa * s.wa) / (fb * s.wb - fa * s.wa);
      cost = s.tool === 'bissecao' ? 1 : 2; const fx = l.f(x);
      s.widthError = width;
      if (!finite(fx) || Math.abs(fx) > 1e3 || (s.k > 2 && Math.abs(fx) > Math.abs(s.fx) * 1.5)) flags.push('polo');
      if (fx === 0) { s.a = s.b = x; s.widthError = 0; }
      else if (fa * fx < 0) { s.b = x; s.wb = 1; s.wa = s.illinois && s.lastSide === 'b' ? s.wa / 2 : 1; s.lastSide = 'b'; }
      else { s.a = x; s.wa = 1; s.wb = s.illinois && s.lastSide === 'a' ? s.wb / 2 : 1; s.lastSide = 'a'; }
      s.stationary = this.history.at(-1)?.state.lastSide === s.lastSide ? (s.stationary || 0) + 1 : 0;
      if (s.stationary >= 3 && !s.illinois && s.tool === 'falsaPosicao') flags.push('estagnacao');
      formula = s.tool === 'bissecao' ? 'c=(a+b)/2; descarte a metade sem troca de sinal.' : 'c=(a·f(b)−b·f(a))/(f(b)−f(a)); mantenha a troca de sinal.';
    } else if (s.tool === 'newton') {
      cost = 3; const d = l.df?.(old);
      if (!finite(d) || Math.abs(d) < 1e-12) return { cost, flags: ['derivadaNula'], formula: 'Derivada nula: a tangente está horizontal. Mova a mira.', damage: 25 };
      x = old - s.multiplicity * l.f(old) / d; formula = `xₖ₊₁=xₖ−${s.multiplicity}·f(xₖ)/f′(xₖ)`;
    } else if (s.tool === 'secante') {
      cost = 2; const d = l.f(old) - l.f(s.prev);
      if (Math.abs(d) < 1e-12) return { cost, flags: ['sondasGemeas'], formula: 'Sondas gêmeas: f(x₁)−f(x₀)=0. Reposicione ou use bisseção.', damage: 50 };
      x = old - l.f(old) * (old - s.prev) / d; s.prev = old; formula = 'x₂=x₁−f(x₁)(x₁−x₀)/(f(x₁)−f(x₀))';
    } else {
      cost = 1; x = (1 - s.lambda) * old + s.lambda * l.gs[s.gIndex](old); formula = `xₖ₊₁=(1−λ)xₖ+λg(xₖ), λ=${s.lambda}`;
    }
    const twoBack = this.traces.at(-2)?.x;
    if (finite(twoBack) && Math.abs(x - twoBack) < 1e-9 && Math.abs(x - old) > 1e-6) flags.push('ciclo');
    s.x = x; s.fx = l.f(x); s.residual = Math.abs(s.fx);
    s.error = l.criterion === 'width' && ['bissecao', 'falsaPosicao'].includes(s.tool) ? s.widthError : l.criterion === 'widthResidual' && ['bissecao', 'falsaPosicao'].includes(s.tool) ? Math.max(s.widthError, s.residual) : l.criterion === 'residual' ? s.residual : l.criterion === 'delta' ? Math.abs(x - old) : Math.abs(x - l.target);
    if (!finite(x) || !finite(s.fx)) { s.error = Infinity; flags.push('naoFinito'); }
    // A missão com várias raízes não aceita uma raiz diferente da solicitada.
    if (l.fog && s.error <= l.tau && Math.abs(x - l.target) > .01) this.fail('Você encontrou outra ressonância. A missão pede a menor raiz positiva.');
    return { cost, formula, flags };
  }
  linearStep(action, args) {
    const s = this.s, l = this.level, n = s.A.length, q = x => l.decimals ? Math.round(x * 10 ** l.decimals) / 10 ** l.decimals : sig(x, l.digits);
    if (l.solutions && s.solved.length >= l.solutions.length && action === 'step') return { noop: true };
    const index = v => Number.isInteger(v) && v >= 0 && v < n;
    if (action === 'swapRow' || action === 'swapCol') {
      const { i, j } = args; if (!index(i) || !index(j) || i === j) throw new Error('Selecione duas linhas ou colunas diferentes.');
      if (action === 'swapRow') { [s.A[i], s.A[j]] = [s.A[j], s.A[i]]; [s.bvec[i], s.bvec[j]] = [s.bvec[j], s.bvec[i]]; [s.rows[i], s.rows[j]] = [s.rows[j], s.rows[i]]; }
      else { s.A.forEach(r => { [r[i], r[j]] = [r[j], r[i]]; }); [s.colPerm[i], s.colPerm[j]] = [s.colPerm[j], s.colPerm[i]]; }
      s.factors = null; s.error = Infinity; return { cost: 1, formula: `${action === 'swapRow' ? 'Linhas e b' : 'Colunas e incógnitas'} ${i + 1} ↔ ${j + 1}`, iteration: false };
    }
    if (action === 'refine') {
      if (!s.relics.includes('refinement')) throw new Error('Ative a relíquia Refinamento.');
      if (s.refinements >= (l.maxRefine || 3)) throw new Error('Limite de refinamentos desta missão atingido.');
      const fresh = !s.refineFactors, r = residual(l.A, l.b, s.x), F = s.refineFactors || factor(l.A, l.decimals ? 8 : l.digits), d = solveFactors(F, r, 16); s.refineFactors = F;
      s.x = s.x.map((v, i) => v + d[i]); s.refinements++; this.linearError(); return { cost: fresh ? n + 1 : 1, formula: fresh ? 'r=b−Ax; preparar LU da correção em precisão ampliada; x←x+d.' : 'r=b−Ax (alta precisão); LU·d=r; x←x+d. Fatores reutilizados.' };
    }
    if (s.tool === 'jacobi' || s.tool === 'seidel') {
      const orderX = s.colPerm.map(j => s.x[j]), result = sweep(s.A, s.bvec, orderX, s.tool === 'seidel');
      result.forEach((v, i) => { s.x[s.colPerm[i]] = v; }); this.linearError(); return { cost: 1, formula: s.tool === 'jacobi' ? 'Jacobi: todas as componentes usam o vetor anterior.' : 'Seidel: cada componente usa imediatamente as componentes novas.' };
    }
    if (s.tool === 'lu') {
      if (!s.factors) { s.factors = factor(s.A, l.digits); s.refineFactors = factor(l.A, l.digits); s.factorError = Math.max(...s.A.map((r, i) => norm(r.map((_, j) => s.factors.L[i].reduce((sum, v, k) => sum + v * s.factors.U[k][j], 0) - s.A[s.factors.P[i]][j])))); return { cost: n, formula: 'PA=LU: fatoração com permutação. Guarde L, U e P para os próximos b.' }; }
      const x = solveFactors(s.factors, s.bvec, l.digits); x.forEach((v, i) => { s.x[s.colPerm[i]] = v; }); this.linearError();
      if (l.solutions && s.error <= l.tau) { s.solved.push(s.x.slice()); s.rhsIndex++; if (s.rhsIndex < l.solutions.length) { s.bvec = mv(l.A, l.solutions[s.rhsIndex]); s.error = Infinity; } }
      return { cost: 1, formula: 'Ly=Pb; Ux=y. Uma resolução, sem refatorar.' };
    }
    // Gauss: uma operação de linha por ação. O jogador também pode executá-la manualmente.
    let pivot = -1, row = -1;
    for (let j = 0; j < n - 1 && row < 0; j++) for (let i = j + 1; i < n; i++) if (Math.abs(s.A[i][j]) > 1e-14) { pivot = j; row = i; break; }
    if (action === 'eliminate') { pivot = args.i; row = args.j; if (!index(pivot) || !index(row) || row <= pivot || !finite(args.multiplier)) throw new Error('Arraste uma linha pivô sobre uma linha inferior e informe o multiplicador.'); }
    if (row >= 0) {
      if (s.tool === 'pivoteamento' && action !== 'eliminate' && !s.pivoted?.includes(pivot)) {
        let p = pivot; for (let i = pivot + 1; i < n; i++) if (Math.abs(s.A[i][pivot]) > Math.abs(s.A[p][pivot])) p = i;
        (s.pivoted ||= []).push(pivot);
        if (p !== pivot) { [s.A[p], s.A[pivot]] = [s.A[pivot], s.A[p]]; [s.bvec[p], s.bvec[pivot]] = [s.bvec[pivot], s.bvec[p]]; return { cost: 1, formula: `Pivoteamento parcial: L${pivot + 1} ↔ L${p + 1}.`, iteration: false }; }
      }
      if (Math.abs(s.A[pivot][pivot]) < 1e-15) return { cost: 1, flags: ['pivoZero'], damage: 50, formula: 'Pivô zero: troque linhas antes de dividir.' };
      const m = action === 'eliminate' ? args.multiplier : q(s.A[row][pivot] / s.A[pivot][pivot]);
      const small = Math.abs(s.A[pivot][pivot]) < 1e-3 * Math.max(...s.A.map(r => Math.abs(r[pivot])));
      s.A[row] = s.A[row].map((v, j) => q(v - q(m * s.A[pivot][j]))); s.bvec[row] = q(s.bvec[row] - q(m * s.bvec[pivot]));
      const growth = norm(s.A.flat()) / norm(l.A.flat()); s.growth = growth;
      return { cost: 1, flags: small ? ['pivoMinusculo'] : growth > 8 ? ['crescimento'] : [], formula: `L${row + 1} ← L${row + 1} − (${m})·L${pivot + 1}; crescimento=${growth.toPrecision(4)}.` };
    }
    const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { if (Math.abs(s.A[i][i]) < 1e-15) throw new Error('Sistema singular: pivô zero na retrossubstituição.'); x[i] = q((s.bvec[i] - s.A[i].slice(i + 1).reduce((sum, v, j) => q(sum + q(v * x[i + j + 1])), 0)) / s.A[i][i]); }
    x.forEach((v, i) => { s.x[s.colPerm[i]] = v; }); this.linearError();
    if (l.solutions && s.error <= l.tau) { s.solved.push(s.x.slice()); s.rhsIndex++; if (s.rhsIndex < l.solutions.length) { s.A = copy(l.A); s.bvec = mv(l.A, l.solutions[s.rhsIndex]); s.colPerm = s.rows.map((_, i) => i); s.rows = s.colPerm.slice(); s.pivoted = []; s.error = Infinity; } }
    return { cost: 1, formula: 'Retrossubstituição de baixo para cima; desfaça a permutação das incógnitas.' };
  }
  linearError() {
    const s = this.s, l = this.level, target = l.solutions?.[Math.min(s.rhsIndex, l.solutions.length - 1)] || l.solution;
    s.residual = norm(residual(l.A, mv(l.A, target), s.x)); s.solutionError = norm(s.x.map((v, i) => v - target[i]));
    s.error = l.criterion === 'residual' ? s.residual : s.solutionError;
    if (l.requirePermutation && s.factors) s.error = Math.max(s.error, s.factorError || 0);
  }
  floatStep() {
    const s = this.s, l = this.level;
    if (l.scenario === 'readings') {
      if (s.readIndex >= l.readings.length) return { noop: true };
      const v = l.readings[s.readIndex++], stored = sig(v, l.digits, s.rounding === 'truncate'); s.sum += stored; s.exactSum += v; s.value = stored; s.x = s.sum; s.error = Math.abs(s.sum - s.exactSum);
      if (s.error >= .05) this.fail('Viés acumulado ≥0,05: o reservatório rompeu. Arredondar equilibra os erros.');
      return { cost: .05, formula: `${v.toPrecision(7)} → ${stored}; soma armazenada − exata=${s.sum - s.exactSum}.`, flags: [] };
    }
    if (l.scenario === 'cancellation') {
      const q = x => sig(x, 5), d = q(Math.sqrt(q(q(1000 * 1000) - 4))), big = q(q(1000 + d) / 2);
      s.value = s.formulaChoice === 'stable' ? q(1 / big) : q(q(1000 - d) / 2); s.error = Math.abs(s.value - l.target) / l.target;
      if (!s.value) this.fail('A subtração apagou os dígitos da raiz pequena. Use c/(a·x₁).');
      return { cost: 2, flags: s.value === 0 ? ['cancelamento'] : [], formula: `√Δ=${d}; x₁=${big}; x₂=${s.value}; máquina de cinco dígitos.` };
    }
    if (l.scenario === 'overflow') {
      const q = s.bits === 16 ? half : s.bits === 32 ? Math.fround : x => x;
      s.value = s.formulaChoice === 'scaled' ? q(400 * q(Math.sqrt(q(q(300 / 400) ** 2 + 1)))) : q(Math.sqrt(q(q(300 * 300) + q(400 * 400))));
      s.error = Math.abs(s.value - 500) / 500;
      if (!finite(s.value)) this.fail('Overflow: uma operação intermediária gerou Infinity. Reescale antes de elevar ao quadrado.');
      // O objetivo é resolver na máquina da missão, não escapar usando 64 bits.
      if (s.bits !== 16) s.error = Infinity;
      return { cost: 2, flags: !finite(s.value) ? ['overflow'] : [], formula: `Máquina ${s.bits} bits: norma=${s.value}. Limite half=65504.` };
    }
    const values = [1, ...Array(10000).fill(1e-7)]; if (s.sumOrder === 'reverse') values.reverse();
    s.value = s.sumOrder === 'kahan' ? kahan(values, Math.fround) : values.reduce((sum, v) => Math.fround(sum + v), 0); s.error = Math.abs(s.value - l.target);
    return { cost: 2, formula: `Soma float32=${s.value}; referência=${l.target}.`, flags: s.error > l.tau ? ['cancelamento'] : [] };
  }
  curveStep(action, args) {
    const s = this.s, l = this.level;
    if (action === 'node') {
      if (!finite(args.x) || (args.index != null && (!Number.isInteger(args.index) || !s.xs.hasOwnProperty(args.index)))) throw new Error('Nó inválido.');
      if (args.index == null && s.xs.length >= (l.maxNodes || 20)) throw new Error('Limite de nós atingido.');
      const xs = s.xs.slice(), ys = s.ys.slice(), i = args.index ?? xs.length; xs[i] = args.x; ys[i] = l.f ? l.f(args.x) : args.y;
      if (!finite(ys[i]) || xs.some((x, j) => j !== i && Math.abs(x - xs[i]) < 1e-8)) throw new Error('Nós precisam ter abscissas distintas.');
      const pairs = xs.map((x, i) => [x, ys[i]]).sort((a, b) => a[0] - b[0]); s.xs = pairs.map(p => p[0]); s.ys = pairs.map(p => p[1]); s.error = Infinity;
      return { cost: s.tool === 'newtonInterp' ? 1 : xs.length, formula: s.tool === 'newtonInterp' ? 'Novo coeficiente de diferença dividida; os anteriores são preservados.' : 'Recalcular bases de Lagrange para os nós alterados.', iteration: false };
    }
    if (action === 'removeNode') { if (s.xs.length <= 2) throw new Error('Mantenha pelo menos dois nós.'); if (!Number.isInteger(args.index) || args.index < 0 || args.index >= s.xs.length) throw new Error('Selecione um nó existente.'); s.xs.splice(args.index, 1); s.ys.splice(args.index, 1); s.error = Infinity; return { cost: 1, formula: 'Nó removido; reavalie a curva.', iteration: false }; }
    if (l.kind === 'interpolation') {
      const at = x => interpolate(s.xs, s.ys, x); s.value = l.query == null ? null : at(l.query);
      s.error = l.query == null ? maxError(l.f, at, l.a, l.b) : Math.max(Math.abs(s.value - l.target), ...(l.ys ? l.xs.map((x, i) => Math.abs(at(x) - l.ys[i])) : []));
      return { cost: 1, formula: l.query == null ? `Erro máximo em 1001 amostras: ${s.error}.` : `p(${l.query})=${s.value}; diferenças divididas/base de Lagrange.`, flags: l.maxNodes === 11 && s.error > .15 ? ['runge'] : [] };
    }
    if (l.kind === 'spline') {
      const ref = spline(s.xs, s.ys, s.boundary, l.slopes);
      if (action === 'curvature') { if (!finite(args.value) || !Number.isInteger(args.index) || args.index <= 0 || args.index >= s.xs.length - 1) throw new Error('Curvatura interna inválida.'); s.M[args.index] = args.value; }
      else s.M = ref.M;
      s.system = { A: ref.A, b: ref.b };
      s.error = l.f ? maxError(l.f, x => splineAt(s.xs, s.ys, s.M, x), l.a, l.b) : norm(s.M.map((v, i) => v - ref.M[i]));
      return { cost: action === 'curvature' ? 1 : s.xs.length - 2, formula: 'Thomas resolve o sistema tridiagonal de curvaturas; S, S′ e S″ devem ser contínuos.' };
    }
    if (action === 'fitManual') { if (!finite(args.a) || !finite(args.b) || (l.degree === 2 && !finite(args.c))) throw new Error('Informe coeficientes finitos.'); s.coef = l.degree === 2 ? [args.a, args.b, args.c] : [args.a, args.b]; }
    else {
      if (l.degree === 2 && !s.centered) { this.fail('As equações normais sem centralização perderam precisão. Centralize t=x−1005.'); return { cost: 3, flags: ['condicionamento'], formula: 'Colunas quase colineares amplificam o arredondamento.' }; }
      const ys = s.linearized ? s.ys.map(Math.log) : s.ys, F = fit(s.xs, ys, l.degree, s.centered ? l.center : 0);
      s.system = { A: F.A, b: F.b }; s.coef = F.coef;
      if (s.linearized) s.coef[0] = Math.exp(s.coef[0]);
    }
    s.error = norm(l.targetCoef.map((v, i) => v - s.coef[i])); if (l.exponential && !s.linearized) s.error = Infinity;
    s.residuals = s.xs.map((x, i) => s.ys[i] - this.curveAt(x)); s.residual = s.residuals.reduce((v, r) => v + r * r, 0);
    return { cost: 1, formula: `Equações normais: soma dos resíduos²=${s.residual}. Coeficientes=${s.coef.join(', ')}.` };
  }
  curveAt(x) {
    const s = this.s, l = this.level;
    if (l.kind === 'interpolation') return interpolate(s.xs, s.ys, x);
    if (l.kind === 'spline') return splineAt(s.xs, s.ys, s.M, x);
    return s.linearized ? s.coef[0] * Math.exp(s.coef[1] * x) : s.coef.reduce((sum, v, j) => sum + v * (x - (s.centered ? l.center : 0)) ** j, 0);
  }
  integralStep() {
    const s = this.s, l = this.level, f = s.substitution ? t => 2 * t * t : l.f;
    if (s.adaptive) { const result = adaptive(f, l.a, l.b, l.tau / 3); s.value = result.value; s.evaluations += result.evaluations; s.samples = result.nodes; s.error = Math.abs(s.value - l.exact); return { cost: result.evaluations, formula: `Subdivisão local por |S₁−S₂|/15; ${result.evaluations} avaliações.` }; }
    s.value = quadrature(f, l.a, l.b, s.n, s.tool, l.uCurve ? Math.fround : x => x);
    const count = s.n + 1; s.evaluations += count; s.samples = Array.from({ length: Math.min(count, 2001) }, (_, i) => l.a + (l.b - l.a) * i / (Math.min(count, 2001) - 1));
    s.error = Math.abs(s.value - l.exact);
    const h = (l.b - l.a) / s.n;
    if (l.uCurve) { const eps = 2 ** -23, optimalH = Math.cbrt(1.5 * eps), minimum = optimalH ** 2 / 3 + eps / optimalH; s.modelError = h * h / 3 + eps / h; s.modelMinimum = minimum; s.measuredError = s.error; s.error = Math.max(0, s.modelError / minimum - 1); }
    s.bound = l.bound?.(h);
    return { cost: l.uCurve ? 1 : count, formula: `h=${h}; ${count} avaliações; integral=${s.value}${l.uCurve ? '. Modelo E(h)=h²/3+ε/h; compare também o erro medido em float32.' : ''}.` };
  }
  odeStep() {
    const s = this.s, l = this.level;
    if (s.t >= l.end - 1e-10) return { noop: true };
    const h = Math.min(s.h, l.end - s.t), r = odeStep(l.f, s.t, s.y, h, s.tool, l.lambda), before = s.y;
    s.t += h; s.y = r.y; s.x = s.y; s.slopes = r.slopes; s.points.push([s.t, s.y]); s.error = Math.abs(s.y - l.exact(s.t));
    const z = -l.lambda * h, stability = s.tool === 'euler' ? Math.abs(1 + z) : s.tool === 'implicito' ? 1 / (1 - z) : Math.abs(1 + z + z * z / 2 + z ** 3 / 6 + z ** 4 / 24);
    s.stability = stability;
    const flags = l.lambda > 0 && stability >= 1 ? ['rigidez'] : [];
    if (!finite(s.y) || (l.lambda > 0 && Math.abs(s.y) > 10)) this.fail('A trajetória explodiu. Reduza h ou use Euler implícito.');
    return { cost: r.cost, flags, formula: `${s.tool}: t=${s.t.toPrecision(5)}, y=${s.y.toPrecision(8)}; ${r.slopes.length === 4 ? 'pesos 1,2,2,1; ' : ''}fator=${stability.toPrecision(4)}; y anterior=${before}.` };
  }
  result() {
    const s = this.s, l = this.level, win = this.status === 'won', scored = score({ error: s.error, tau: l.tau, iterations: this.totalIterations, ideal: l.ideal, battery: s.battery, batteryMax: s.batteryMax, difficulty: l.difficulty, time: (Date.now() - this.started) / 1000, timeMax: l.timeMax, manual: s.manual, red: this.everRed, combo: this.options.combo || 1, usedL3: s.usedL3 });
    return { vitoria: win, estrelas: win ? scored.stars : 0, xp: win ? scored.xp : 0, erroFinal: s.error, iteracoes: this.totalIterations, bateriaRestante: s.battery, dicasUsadas: s.hints, alertaVermelho: this.everRed, relics: [], studiedRelics: !win ? l.relics : [], diary: !win ? { name: l.name, reason: this.reason, traces: copy(this.traces.slice(-80)), levelId: l.id, state: copy(s), graph: this.frozenGraph || null } : null, factors: scored.factors };
  }
}

export class Battle {
  constructor(id, options = {}) { this.spec = bossLevels(id); this.options = options; this.index = 0; this.results = []; this.forcedSwitch = false; this.session = new Session(this.spec.levels[0], { ...options, batteryMax: Math.ceil(this.spec.battery * perksFor(options.xp || 0).battery) }); }
  afterStep() {
    const s = this.session.s;
    if (this.spec.id === 'chefe1' && this.previousTool === s.tool && this.session.status === 'play') { s.error = Infinity; s.integrity = Math.max(0, s.integrity - 15); this.forcedSwitch = true; this.session.reason = 'A cabeça regenerou: repetir a ferramenta da cabeça anterior não funciona.'; }
    if (s.fury >= 100 && !this.forcedSwitch && this.session.status === 'play') {
      this.forcedSwitch = true; s.integrity = Math.max(0, s.integrity - 15);
      const l = this.session.level;
      if (l.kind === 'root' && !l.gs) { const f = l.f, df = l.df, pole = s.x + .1; this.session.level = { ...l, f: x => f(x) / (x - pole), df: df ? x => (df(x) * (x - pole) - f(x)) / (x - pole) ** 2 : null, formula: `(${l.formula})/(x−${pole.toPrecision(5)})` }; }
      else if (l.kind === 'root') { s.lambda = 1; s.x = .9; }
      else if (l.kind === 'linear') { const A = l.A.map((r, i) => r.map(v => i === 0 ? v * 1000 : v)), b = mv(A, l.solution); this.session.level = { ...l, A, b }; s.A = copy(A); s.bvec = b.slice(); s.factors = null; s.refineFactors = null; }
      else if (l.kind === 'ode') { const lambda = l.lambda * 1.5; this.session.level = { ...l, lambda, f: (t, y) => -lambda * y, exact: t => l.y0 * Math.exp(-lambda * t) }; s.t = 0; s.y = l.y0; s.points = [[0, l.y0]]; }
      s.error = Infinity; this.session.reason = 'Fúria cheia: uma nova patologia alterou o sistema. Troque a ferramenta ou ative uma relíquia.'; s.fury = 100;
    }
    if (!s.integrity && this.session.status === 'play') this.session.fail('A Fúria destruiu a estrutura.');
  }
  next() {
    if (!this.session.submit()) return false;
    const previous = this.session, s = previous.s; this.previousTool = s.tool; this.results.push(previous.result()); this.index++;
    if (this.index >= this.spec.levels.length) return true;
    let level = this.spec.levels[this.index];
    if (this.spec.id === 'final') {
      if (this.index === 1) { this.parameters = s.x.slice(); const temperature = 1 + this.parameters.reduce((a, b) => a + b, 0) / 4; level = { ...level, name: 'Temperatura Crítica', f: x => x * x - temperature ** 2, df: x => 2 * x, target: temperature, x: temperature + 1, a: 0, b: temperature + 2, formula: `T²−${temperature ** 2}`, tau: 1e-6, ideal: 5 }; }
      if (this.index === 2) { const temperature = s.x, lambda = 20 + 10 * temperature; level = { ...level, name: 'Resfriamento da Usina', y0: temperature, lambda, f: (t, y) => -lambda * y, exact: t => temperature * Math.exp(-lambda * t), mission: `Temperatura recebida da etapa anterior: ${temperature}. Resfrie com λ=${lambda} até t=0,5.` }; }
    }
    this.session = new Session(level, { ...this.options, battery: s.battery, batteryMax: s.batteryMax, integrity: s.integrity }); this.forcedSwitch = false; return true;
  }
  get done() { return this.index >= this.spec.levels.length; }
  result() { if (!this.done) return this.session.result(); const last = this.results.at(-1); return { ...last, estrelas: Math.min(...this.results.map(r => r.estrelas)), xp: this.results.reduce((sum, r) => sum + r.xp, 0), iteracoes: this.results.reduce((sum, r) => sum + r.iteracoes, 0), dicasUsadas: this.results.reduce((sum, r) => sum + r.dicasUsadas, 0), alertaVermelho: this.results.some(r => r.alertaVermelho), relics: [...new Set(this.spec.levels.flatMap(l => l.relics))], stages: this.results }; }
}
