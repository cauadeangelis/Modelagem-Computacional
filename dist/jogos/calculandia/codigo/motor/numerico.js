// Matemática pura. As rotinas não conhecem DOM, áudio ou progresso.
export const norm = v => Math.max(0, ...v.map(Math.abs));
export const mv = (A, x) => A.map(r => r.reduce((s, a, j) => s + a * x[j], 0));
export const residual = (A, b, x) => b.map((v, i) => v - mv(A, x)[i]);
export const identity = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
export const sig = (x, digits = 16, truncate = false) => {
  if (!Number.isFinite(x) || x === 0) return x;
  const p = 10 ** (digits - 1 - Math.floor(Math.log10(Math.abs(x))));
  return truncate ? Math.trunc(x * p) / p : Number(x.toPrecision(digits));
};
export function half(x) {
  if (!Number.isFinite(x) || !x) return x;
  if (Math.abs(x) > 65504) return Math.sign(x) * Infinity;
  const step = 2 ** Math.max(-24, Math.floor(Math.log2(Math.abs(x))) - 10);
  const q = x / step, lo = Math.floor(q), d = q - lo;
  return (d === .5 ? (lo % 2 === 0 ? lo : lo + 1) : Math.round(q)) * step;
}
export function floatBits(value, width = 32) {
  if (width === 16) {
    const v = half(value), x = Math.abs(v), sign = v < 0 || Object.is(v, -0) ? 32768 : 0;
    const e = x ? Math.floor(Math.log2(x)) : -15;
    const payload = Number.isNaN(v) ? 32256 : !Number.isFinite(v) ? 31744 : x < 2 ** -14 ? Math.round(x / 2 ** -24) : ((e + 15) << 10) | Math.round((x / 2 ** e - 1) * 1024);
    return { bits: BigInt(sign | payload), width: 16, exponent: 5, mantissa: 10 };
  }
  const view = new DataView(new ArrayBuffer(8));
  if (width === 64) { view.setFloat64(0, value); return { bits: view.getBigUint64(0), width: 64, exponent: 11, mantissa: 52 }; }
  view.setFloat32(0, value); return { bits: BigInt(view.getUint32(0)), width: 32, exponent: 8, mantissa: 23 };
}
export function fromBits(bits, width = 32) {
  if (width === 16) { const n = Number(bits & 65535n), sign = n & 32768 ? -1 : 1, e = (n >> 10) & 31, m = n & 1023; return e === 31 ? m ? NaN : sign * Infinity : sign * (e === 0 ? m * 2 ** -24 : (1 + m / 1024) * 2 ** (e - 15)); }
  const view = new DataView(new ArrayBuffer(8));
  if (width === 64) { view.setBigUint64(0, BigInt.asUintN(64, bits)); return view.getFloat64(0); }
  view.setUint32(0, Number(BigInt.asUintN(32, bits))); return view.getFloat32(0);
}
export function kahan(values, round = x => x) {
  let s = 0, c = 0;
  for (const v of values) { const y = round(v - c), t = round(s + y); c = round(round(t - s) - y); s = t; }
  return s;
}
export function factor(A, digits = 16, pivot = true) {
  const n = A.length, U = A.map(r => r.slice()), L = identity(n), P = Array.from({ length: n }, (_, i) => i);
  const q = x => sig(x, digits);
  for (let k = 0; k < n; k++) {
    let p = k;
    if (pivot) for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i;
    if (Math.abs(U[p][k]) < 1e-15) throw new Error('Pivô zero: troque uma linha antes de dividir.');
    if (p !== k) { [U[p], U[k]] = [U[k], U[p]]; [P[p], P[k]] = [P[k], P[p]]; for (let j = 0; j < k; j++) [L[p][j], L[k][j]] = [L[k][j], L[p][j]]; }
    for (let i = k + 1; i < n; i++) { L[i][k] = q(U[i][k] / U[k][k]); for (let j = k; j < n; j++) U[i][j] = q(U[i][j] - q(L[i][k] * U[k][j])); U[i][k] = 0; }
  }
  return { L, U, P };
}
export function solveFactors({ L, U, P }, b, digits = 16) {
  const n = b.length, y = [], x = Array(n).fill(0), q = v => sig(v, digits);
  for (let i = 0; i < n; i++) y[i] = q(b[P[i]] - L[i].slice(0, i).reduce((s, a, j) => q(s + q(a * y[j])), 0));
  for (let i = n - 1; i >= 0; i--) x[i] = q((y[i] - U[i].slice(i + 1).reduce((s, a, j) => q(s + q(a * x[i + 1 + j])), 0)) / U[i][i]);
  return x;
}
export const solve = (A, b) => solveFactors(factor(A), b);
export function sweep(A, b, old, seidel = false) {
  const x = old.slice();
  for (let i = 0; i < A.length; i++) {
    if (Math.abs(A[i][i]) < 1e-15) throw new Error('Pivô zero na diagonal. Reordene as linhas.');
    x[i] = (b[i] - A[i].reduce((s, a, j) => s + (i === j ? 0 : a * (seidel ? x[j] : old[j])), 0)) / A[i][i];
  }
  return x;
}
export function sassenfeld(A) {
  const beta = [];
  A.forEach((r, i) => beta.push(r.reduce((s, a, j) => s + (i === j ? 0 : Math.abs(a) * (j < i ? beta[j] : 1)), 0) / Math.abs(r[i])));
  return beta;
}
export function interpolate(xs, ys, x) {
  // Forma de Newton: inserir um nó preserva os coeficientes anteriores.
  const d = ys.slice();
  for (let k = 1; k < xs.length; k++) for (let j = xs.length - 1; j >= k; j--) d[j] = (d[j] - d[j - 1]) / (xs[j] - xs[j - k]);
  let p = d.at(-1); for (let i = xs.length - 2; i >= 0; i--) p = p * (x - xs[i]) + d[i];
  return p;
}
export function spline(xs, ys, boundary = 'natural', slopes = [0, 0]) {
  const n = xs.length, A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) { const l = xs[i] - xs[i - 1], r = xs[i + 1] - xs[i]; A[i][i - 1] = l; A[i][i] = 2 * (l + r); A[i][i + 1] = r; b[i] = 6 * ((ys[i + 1] - ys[i]) / r - (ys[i] - ys[i - 1]) / l); }
  if (boundary === 'natural') { A[0][0] = A[n - 1][n - 1] = 1; }
  else { const h = xs[1] - xs[0], k = xs[n - 1] - xs[n - 2]; A[0][0] = 2 * h; A[0][1] = h; b[0] = 6 * ((ys[1] - ys[0]) / h - slopes[0]); A[n - 1][n - 2] = k; A[n - 1][n - 1] = 2 * k; b[n - 1] = 6 * (slopes[1] - (ys[n - 1] - ys[n - 2]) / k); }
  // Thomas, com cópias para manter o sistema visível no HUD.
  const d = A.map((r, i) => r[i]), rhs = b.slice();
  for (let i = 1; i < n; i++) { const w = A[i][i - 1] / d[i - 1]; d[i] -= w * A[i - 1][i]; rhs[i] -= w * rhs[i - 1]; }
  const M = Array(n); M[n - 1] = rhs[n - 1] / d[n - 1];
  for (let i = n - 2; i >= 0; i--) M[i] = (rhs[i] - A[i][i + 1] * M[i + 1]) / d[i];
  return { A, b, M, at: x => splineAt(xs, ys, M, x) };
}
export function splineAt(xs, ys, M, x) {
  let i = xs.findIndex((v, j) => j && x <= v) - 1; if (i < 0) i = xs.length - 2;
  const h = xs[i + 1] - xs[i], u = xs[i + 1] - x, v = x - xs[i];
  return (M[i] * u ** 3 + M[i + 1] * v ** 3) / (6 * h) + (ys[i] - M[i] * h * h / 6) * u / h + (ys[i + 1] - M[i + 1] * h * h / 6) * v / h;
}
export function fit(xs, ys, degree = 1, center = 0, digits = 16) {
  const V = xs.map(x => Array.from({ length: degree + 1 }, (_, j) => (x - center) ** j));
  const A = Array.from({ length: degree + 1 }, (_, i) => Array.from({ length: degree + 1 }, (_, j) => sig(V.reduce((s, r) => s + r[i] * r[j], 0), digits)));
  const b = Array.from({ length: degree + 1 }, (_, i) => sig(V.reduce((s, r, k) => s + r[i] * ys[k], 0), digits));
  return { A, b, coef: solveFactors(factor(A, digits), b, digits) };
}
export function quadrature(f, a, b, n, method, round = x => x) {
  if (!Number.isInteger(n) || n < 1 || n > 1000000) throw new Error('Escolha de 1 a 1.000.000 intervalos.');
  if (method === 'simpson13' && n % 2) throw new Error('Simpson 1/3 precisa de n par.');
  if (method === 'simpson38' && n % 3) throw new Error('Simpson 3/8 precisa de n múltiplo de 3.');
  if (method === 'combo') { if (n < 5 || n % 2 === 0) throw new Error('O combo usa n ímpar, pelo menos 5.'); const h = (b - a) / n; return quadrature(f, a, b - 3 * h, n - 3, 'simpson13', round) + quadrature(f, b - 3 * h, b, 3, 'simpson38', round); }
  const h = (b - a) / n; let sum = 0;
  for (let i = 0; i <= n; i++) { const w = i === 0 || i === n ? 1 : method === 'trapezio' ? 2 : method === 'simpson13' ? (i % 2 ? 4 : 2) : (i % 3 ? 3 : 2); sum = round(sum + round(w * round(f(a + i * h)))); }
  return round(sum * (method === 'trapezio' ? h / 2 : method === 'simpson13' ? h / 3 : 3 * h / 8));
}
export function adaptive(f, a, b, tau) {
  const cache = new Map(); const F = x => { if (!cache.has(x)) cache.set(x, f(x)); return cache.get(x); };
  const S = (a, b) => (b - a) * (F(a) + 4 * F((a + b) / 2) + F(b)) / 6;
  function split(a, b, whole, tol, depth) { const m = (a + b) / 2, left = S(a, m), right = S(m, b), d = left + right - whole; if (Math.abs(d) < 15 * tol || depth === 12) return left + right + d / 15; return split(a, m, left, tol / 2, depth + 1) + split(m, b, right, tol / 2, depth + 1); }
  const value = split(a, b, S(a, b), tau, 0); return { value, evaluations: cache.size, nodes: [...cache.keys()].sort((a, b) => a - b) };
}
export function odeStep(f, t, y, h, method, lambda) {
  if (method === 'implicito') return { y: y / (1 + lambda * h), slopes: [f(t, y)], cost: 1 };
  const k1 = f(t, y);
  if (method === 'euler') return { y: y + h * k1, slopes: [k1], cost: 1 };
  const k2 = f(t + h / 2, y + h * k1 / 2), k3 = f(t + h / 2, y + h * k2 / 2), k4 = f(t + h, y + h * k3);
  return { y: y + h * (k1 + 2 * k2 + 2 * k3 + k4) / 6, slopes: [k1, k2, k3, k4], cost: 4 };
}
export const maxError = (f, g, a, b, n = 1000) => Math.max(...Array.from({ length: n + 1 }, (_, i) => Math.abs(f(a + (b - a) * i / n) - g(a + (b - a) * i / n))));
