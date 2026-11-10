/* Experimentos determinísticos: sem DOM, rede ou dependências. */
(function (root) {
  'use strict';
  const finite = x => Number.isFinite(x);
  function pontos(p) {
    if (!Array.isArray(p) || p.length < 2 || p.length > 12 || p.some(r => !Array.isArray(r) || r.length !== 2 || !r.every(finite))) throw Error('Use de 2 a 12 pares numéricos finitos.');
    const q = p.map(r => r.slice()).sort((a, b) => a[0] - b[0]);
    if (q.some((r, i) => i && r[0] === q[i - 1][0])) throw Error('Cada abscissa x deve ser distinta.');
    return q;
  }
  function interpolar(p) {
    const q = pontos(p), n = q.length, tabela = q.map(r => [r[1]]);
    for (let j = 1; j < n; j++) for (let i = 0; i < n - j; i++) tabela[i][j] = (tabela[i + 1][j - 1] - tabela[i][j - 1]) / (q[i + j][0] - q[i][0]);
    const coef = tabela[0].slice();
    const newton = x => { let y = coef[n - 1]; for (let i = n - 2; i >= 0; i--) y = coef[i] + (x - q[i][0]) * y; return y; };
    const lagrange = x => q.reduce((s, r, i) => s + r[1] * q.reduce((v, t, j) => i === j ? v : v * (x - t[0]) / (r[0] - t[0]), 1), 0);
    return { pontos: q, tabela, coef, newton, lagrange };
  }
  function ajuste(p) {
    const q = pontos(p), n = q.length, mx = q.reduce((s, r) => s + r[0], 0) / n, my = q.reduce((s, r) => s + r[1], 0) / n;
    const sxx = q.reduce((s, r) => s + (r[0] - mx) ** 2, 0), sxy = q.reduce((s, r) => s + (r[0] - mx) * (r[1] - my), 0);
    const a = sxy / sxx, b = my - a * mx, f = x => a * x + b, sse = q.reduce((s, r) => s + (r[1] - f(r[0])) ** 2, 0);
    return { a, b, f, sse, mx, my, sxx, sxy };
  }
  function integrar(p, metodo = 'trapezios') {
    const q = pontos(p), n = q.length - 1, h = q[1][0] - q[0][0];
    if (!['trapezios', 'simpson'].includes(metodo)) throw Error('Método de integração inválido.');
    if (metodo === 'simpson' && (n % 2 || q.some((r, i) => i && Math.abs(r[0] - q[i - 1][0] - h) > 1e-9 * Math.abs(h)))) throw Error('Simpson 1/3 exige número par de subintervalos igualmente espaçados.');
    const parcelas = [];
    for (let i = 0; i < n; i += metodo === 'simpson' ? 2 : 1) {
      const j = i + (metodo === 'simpson' ? 2 : 1);
      const area = metodo === 'simpson' ? h / 3 * (q[i][1] + 4 * q[i + 1][1] + q[j][1]) : (q[j][0] - q[i][0]) * (q[i][1] + q[j][1]) / 2;
      parcelas.push({ a: q[i][0], b: q[j][0], area, pontos: q.slice(i, j + 1) });
    }
    return { valor: parcelas.reduce((s, r) => s + r.area, 0), parcelas };
  }
  // Spline cúbica natural: segundas derivadas nulas nas extremidades.
  function spline(p) {
    const q = pontos(p), n = q.length, h = q.slice(1).map((r, i) => r[0] - q[i][0]), d = Array(n).fill(0), u = Array(n).fill(0), rhs = Array(n).fill(0), m = Array(n).fill(0);
    d[0] = d[n - 1] = 1;
    for (let i = 1; i < n - 1; i++) { const w = h[i - 1] / d[i - 1]; d[i] = 2 * (h[i - 1] + h[i]) - w * u[i - 1]; u[i] = h[i]; rhs[i] = 6 * ((q[i + 1][1] - q[i][1]) / h[i] - (q[i][1] - q[i - 1][1]) / h[i - 1]) - w * rhs[i - 1]; }
    for (let i = n - 2; i > 0; i--) m[i] = (rhs[i] - u[i] * m[i + 1]) / d[i];
    const f = x => { let i = q.findIndex((r, j) => j < n - 1 && x <= q[j + 1][0]); if (i < 0) i = n - 2; const a = (q[i + 1][0] - x) / h[i], b = 1 - a; return a * q[i][1] + b * q[i + 1][1] + ((a ** 3 - a) * m[i] + (b ** 3 - b) * m[i + 1]) * h[i] ** 2 / 6; };
    return { f, m, pontos: q };
  }
  function mantissa(t = 4) {
    if (!Number.isInteger(t) || t < 2 || t > 10) throw Error('A mantissa deve ter de 2 a 10 algarismos.');
    const R = v => Number(v.toPrecision(t)), a = 1, b = -10000, c = 1;
    const discriminante = R(R(b * b) - R(4 * a * c)), raiz = R(Math.sqrt(discriminante));
    const direta = R(R(-b - raiz) / R(2 * a)), racionalizada = R(R(2 * c) / R(-b + raiz)), referencia = 2 / (10000 + Math.sqrt(1e8 - 4));
    return { t, discriminante, raiz, direta, racionalizada, referencia, erroDireta: Math.abs((direta - referencia) / referencia), erroEstavel: Math.abs((racionalizada - referencia) / referencia) };
  }
  // Laplace em 3×3: borda superior 100 °C, demais bordas 20 °C.
  function termica(v = Array(9).fill(20), metodo = 'seidel') {
    if (v.length !== 9 || !v.every(finite) || !['seidel', 'jacobi'].includes(metodo)) throw Error('Malha ou método inválido.');
    const novo = v.slice(), etapas = [];
    const vizinhos = (i, arr) => { const r = Math.floor(i / 3), c = i % 3; return (r ? arr[i - 3] : 100) + (r < 2 ? arr[i + 3] : 20) + (c ? arr[i - 1] : 20) + (c < 2 ? arr[i + 1] : 20); };
    for (let i = 0; i < 9; i++) { novo[i] = vizinhos(i, metodo === 'seidel' ? novo : v) / 4; etapas.push(novo.slice()); }
    return { valores: novo, etapas, residuo: Math.max(...novo.map((x, i) => Math.abs(4 * x - vizinhos(i, novo)))), delta: Math.max(...novo.map((x, i) => Math.abs(x - v[i]))) };
  }
  // T' = -lambda(T - ambiente), Euler explícito: estabilidade |1-lambda*dt| < 1.
  function resfriar(T, dt, lambda = 1, ambiente = 20) {
    if (![T, dt, lambda, ambiente].every(finite) || dt <= 0 || lambda <= 0) throw Error('Parâmetros térmicos inválidos.');
    return { temperatura: T - dt * lambda * (T - ambiente), estavel: dt * lambda < 2, fator: 1 - dt * lambda };
  }
  function drone(metodo = 'polinomio', n = 11) {
    const p = Array.from({ length: n }, (_, i) => { const x = -1 + 2 * i / (n - 1); return [x, 0.25 + 1 / (1 + 25 * x * x)]; });
    const f = metodo === 'spline' ? spline(p).f : interpolar(p).newton;
    const rota = Array.from({ length: 201 }, (_, i) => { const x = -1 + i / 100; return [x, f(x)]; });
    // Velocidade horizontal constante: P = 1 + (dy/dx)², energia adimensional ∫P dx.
    const potencia = rota.map(([x], i) => { const a = Math.max(0, i - 1), b = Math.min(200, i + 1), dy = (rota[b][1] - rota[a][1]) / (rota[b][0] - rota[a][0]); return [x, 1 + dy * dy]; });
    let energia = 0; const acumulada = [0];
    for (let i = 1; i < potencia.length; i++) { energia += (potencia[i][0] - potencia[i - 1][0]) * (potencia[i][1] + potencia[i - 1][1]) / 2; acumulada.push(energia); }
    return { pontos: p, rota, energia, acumulada, colisao: rota.findIndex(r => r[1] < 0) };
  }
  function gaussCurto(A, b, pivotar = true, t = 4) {
    const R = v => Number(v.toPrecision(t)), n = b.length, m = A.map((r, i) => [...r, b[i]].map(R)), etapas = [];
    for (let k = 0; k < n; k++) {
      let p = k; if (pivotar) for (let i = k + 1; i < n; i++) if (Math.abs(m[i][k]) > Math.abs(m[p][k])) p = i;
      [m[k], m[p]] = [m[p], m[k]];
      if (!m[k][k]) throw Error('Pivô nulo: esta ordem não permite continuar.');
      for (let i = k + 1; i < n; i++) { const fator = R(m[i][k] / m[k][k]); for (let j = k; j <= n; j++) m[i][j] = R(m[i][j] - R(fator * m[k][j])); }
      etapas.push(m.map(r => r.slice()));
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let v = m[i][n]; for (let j = i + 1; j < n; j++) v = R(v - R(m[i][j] * x[j])); x[i] = R(v / m[i][i]); }
    return { x, etapas, residuo: Math.max(...A.map((r, i) => Math.abs(r.reduce((s, v, j) => s + v * x[j], 0) - b[i]))) };
  }
  const api = { pontos, interpolar, ajuste, integrar, spline, mantissa, termica, resfriar, drone, gaussCurto };
  root.NumeraExperimentos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
