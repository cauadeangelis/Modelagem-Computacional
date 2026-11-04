/* Numera Academy — métodos no formato dos slides da professora (Cálculo Numérico, Profa. Danielle Teixeira).
   Este arquivo NÃO substitui o motor-numerico.js (que resolve qualquer equação com segurança); ele refaz cada
   método exatamente como nos slides, para mostrar as mesmas tabelas e conferir o banco de questões:
   - Bisseção e Falsa Posição: tabela i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | erro estimado.
   - Ponto Fixo: xᵢ₊₁ = g(xᵢ); Newton-Raphson: xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ); Secante: xᵢ₊₁ = xᵢ − f(xᵢ)(xᵢ − xᵢ₋₁)/(f(xᵢ) − f(xᵢ₋₁)).
   - Estimativa de erro: εₐ = |(xᵢ₊₁ − xᵢ)/xᵢ₊₁| (× 100% quando o critério é percentual). Para quando εₐ ≤ ε ou i = K.
   - Eliminação de Gauss: etapas Eᵢ⁽ᵏ⁾ → Eᵢ⁽ᵏ⁻¹⁾ − mᵢₖ·Eₖ⁽ᵏ⁻¹⁾, mᵢₖ = aᵢₖ⁽ᵏ⁻¹⁾/aₖₖ⁽ᵏ⁻¹⁾, pivô aₖₖ⁽ᵏ⁻¹⁾,
     matrizes [A⁽ᵏ⁾ | B⁽ᵏ⁾] e substituição regressiva; com ou sem a estratégia de pivoteamento parcial.
   Também traz os métodos das listas de exercícios (Jacobi, Gauss-Seidel, LU, Cholesky, interpolação, mínimos
   quadrados, integração, EDO e ponto flutuante), usados para conferir o gabarito de cada questão.
   Script clássico (ES2021), sem dependências além do parser de expressões do motor-numerico.js. */
(function (global) {
  'use strict';
  const M = global.NumeraMath;
  const err = (m) => { throw new Error(m); };

  /* ---------- Utilitários ---------- */
  const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋' };
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾', 'k': 'ᵏ', 'n': 'ⁿ' };
  const sub = (t) => String(t).split('').map((c) => SUB[c] || c).join('');
  const sup = (t) => String(t).split('').map((c) => SUP[c] || c).join('');
  const fn = (expr) => { if (typeof expr === 'function') return expr; if (!M) err('motor-numerico.js precisa ser carregado antes.'); const f = M.parseFunction(expr); return (x) => f(x); };
  const arred = (v, casas) => { if (!Number.isFinite(v) || casas == null) return v; const k = Math.pow(10, casas); return Math.round((v + Math.sign(v) * 1e-15) * k) / k; };
  // Algarismos significativos: arredondamento ou truncamento (sistema de ponto flutuante de base 10).
  function sig(v, t, modo) {
    if (!Number.isFinite(v) || v === 0 || !t) return v;
    const e = Math.floor(Math.log10(Math.abs(v))) + 1, k = Math.pow(10, t - e);
    let r = modo === 'truncamento' ? Math.trunc(v * k * (1 + 1e-15)) / k : Math.round(v * k) / k;
    if (Math.abs(r) >= Math.pow(10, e)) r = v; // proteção numérica
    return Number(r.toPrecision(Math.min(15, t + 2)));
  }
  // Fração simples (denominador até 60) quando o número é um racional pequeno: 1/3, −22/3, 5/3…
  function frac(v) {
    if (!Number.isFinite(v)) return null;
    for (let d = 1; d <= 60; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-10 * Math.max(1, Math.abs(v))) return `${n < 0 ? '−' : ''}${Math.abs(n)}${d === 1 ? '' : '/' + d}`; }
    return null;
  }
  // Número em pt-BR (vírgula decimal). casas = número fixo de casas; sem casas, até 6 algarismos significativos.
  function fmt(v, casas) {
    if (v === null || v === undefined) return '—';
    if (typeof v !== 'number') return String(v);
    if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'indefinido';
    if (v === 0) return casas != null ? (0).toFixed(casas).replace('.', ',') : '0';
    const a = Math.abs(v);
    if (casas == null && (a < 1e-4 || a >= 1e7)) { const [m, e] = v.toExponential(3).split('e'); return `${m.replace('.', ',').replace('-', '−')}×10${sup(String(Number(e)))}`; }
    const s = casas != null ? v.toFixed(casas) : String(Number(v.toPrecision(6)));
    return s.replace('-', '−').replace('.', ',');
  }
  const fracOuNum = (v) => frac(v) || fmt(v);
  // Coeficiente antes de uma variável: (1/3)x₂, −8x₃, 2x₁.
  const coef = (v) => { const t = fracOuNum(v); return t.includes('/') ? `(${t})` : t === '1' ? '' : t === '−1' ? '−' : t; };
  const sinal = (v) => (v > 0 ? 'positivo' : v < 0 ? 'negativo' : 'zero');

  /* ---------- Critério de parada (slides: εₐ = |(xᵢ₊₁ − xᵢ)/xᵢ₊₁|, em fração ou × 100%) ---------- */
  const CRITERIOS = {
    relativo: 'εₐ = |(xᵢ − xᵢ₋₁)/xᵢ| ≤ ε',
    percentual: 'εₐ = |(xᵢ − xᵢ₋₁)/xᵢ| × 100% ≤ ε',
    largura: 'bᵢ − aᵢ < ε',
    absoluto: '|xᵢ − xᵢ₋₁| < ε',
    residuo: '|f(xᵢ)| < ε',
    iteracoes: 'número fixo de iterações',
  };
  function erroEstimado(novo, velho, criterio) {
    if (velho === null || velho === undefined) return null;
    if (criterio === 'absoluto') return Math.abs(novo - velho);
    if (novo === 0) return Infinity;
    const r = Math.abs((novo - velho) / novo);
    return criterio === 'percentual' ? r * 100 : r;
  }
  // Número mínimo de iterações da Bisseção: k > (log(b₀ − a₀) − log ε)/log 2.
  function iteracoesBissecao(a, b, eps) { const k = (Math.log10(b - a) - Math.log10(eps)) / Math.log10(2); return { limite: k, k: Math.floor(k) + 1 }; }

  /* ---------- Métodos intervalares ---------- */
  function intervalar(nome, regra, { f, a, b, eps = 1e-2, K = 50, criterio = 'relativo', iteracoes = null, casas = null }) {
    const F = fn(f); let A = Number(a), B = Number(b);
    if (!(A < B)) err(`${nome}: o intervalo precisa ter a < b.`);
    let fa = F(A), fb = F(B);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) err(`${nome}: f não está definida em uma das extremidades.`);
    if (fa * fb > 0) err(`${nome}: f(a) e f(b) têm o mesmo sinal (f(a)·f(b) > 0). Pelo Teorema 1, não há garantia de raiz em [a, b].`);
    const n = iteracoes || K, linhas = []; let x = null, parada = '';
    for (let i = 1; i <= n; i++) {
      let xi = regra(A, B, fa, fb); if (casas != null) xi = arred(xi, casas);
      const fx = F(xi), erro = erroEstimado(xi, x, criterio === 'largura' || criterio === 'iteracoes' || criterio === 'residuo' ? 'relativo' : criterio);
      const linha = { i, a: A, b: B, x: xi, fa, fb, fx, erro };
      // Verificação do sinal: f(a)·f(xᵢ) < 0 → raiz em [a, xᵢ]; > 0 → raiz em [xᵢ, b]; = 0 → xᵢ é a raiz.
      const teste = fa * fx;
      linha.lado = teste < 0 ? 'inferior' : teste > 0 ? 'superior' : 'raiz';
      linhas.push(linha); x = xi;
      if (teste === 0) { parada = `f(x${sub(i)}) = 0: x${sub(i)} é a raiz.`; break; }
      if (teste < 0) { B = xi; fb = fx; } else { A = xi; fa = fx; }
      if (!iteracoes) {
        if (criterio === 'largura' && B - A < eps) { parada = `b − a = ${fmt(B - A)} < ε = ${fmt(eps)} na ${i}ª iteração.`; break; }
        if (criterio === 'residuo' && Math.abs(fx) < eps) { parada = `|f(x${sub(i)})| = ${fmt(Math.abs(fx))} < ε na ${i}ª iteração.`; break; }
        if ((criterio === 'relativo' || criterio === 'percentual' || criterio === 'absoluto') && erro !== null && erro <= eps) { parada = `Na ${i}ª iteração o erro estimado é menor que o critério de parada: ${fmt(erro)} ≤ ${fmt(eps)}.`; break; }
      }
      if (i === n) parada = iteracoes ? `${n} iterações, como pedido.` : `Atingiu o número máximo de iterações (K = ${K}).`;
    }
    return { metodo: nome, criterio: CRITERIOS[criterio], colunas: ['i', 'a', 'b', 'xᵢ', 'f(a)', 'f(b)', 'f(xᵢ)', criterio === 'percentual' ? 'εₐ (%)' : 'εₐ'], linhas, raiz: x, iteracoes: linhas.length, parada };
  }
  const bissecao = (o) => intervalar('Bisseção', (a, b) => (a + b) / 2, o);
  const falsaPosicao = (o) => intervalar('Falsa Posição', (a, b, fa, fb) => (a * fb - b * fa) / (fb - fa), o);

  /* ---------- Métodos abertos ---------- */
  function derivada(F, x) { const h = 1e-6 * (1 + Math.abs(x)); return (F(x + h) - F(x - h)) / (2 * h); }
  function aberto(nome, passo, { x0, eps = 1e-2, K = 50, criterio = 'percentual', iteracoes = null, casas = null }) {
    const n = iteracoes || K, linhas = []; let x = Number(x0), parada = '';
    if (!Number.isFinite(x)) err(`${nome}: informe a aproximação inicial x₀.`);
    for (let i = 0; i < n; i++) {
      const r = passo(x, i); let novo = r.novo; if (casas != null) novo = arred(novo, casas);
      if (!Number.isFinite(novo)) err(`${nome}: o cálculo deixou de ser finito na iteração ${i + 1} (${r.motivo || 'divisão por zero'}).`);
      const erro = erroEstimado(novo, x, criterio === 'iteracoes' ? 'percentual' : criterio);
      linhas.push(Object.assign({ i, x, novo, erro }, r.extra || {}));
      x = novo;
      if (!iteracoes && erro !== null && erro <= eps) { parada = `O método convergiu na ${i + 1}ª iteração: εₐ = ${fmt(erro)}${criterio === 'percentual' ? '%' : ''} ≤ ε = ${fmt(eps)}.`; break; }
      if (i === n - 1) parada = iteracoes ? `${n} iterações, como pedido.` : `Atingiu o número máximo de iterações (K = ${K}).`;
    }
    return { metodo: nome, criterio: CRITERIOS[criterio], linhas, raiz: x, iteracoes: linhas.length, parada };
  }
  function pontoFixo(o) { const G = fn(o.g); const r = aberto('Ponto Fixo', (x) => ({ novo: G(x) }), o); r.colunas = ['i', 'xᵢ', 'xᵢ₊₁ = g(xᵢ)', 'Eᵣ%']; return r; }
  function newton(o) {
    const F = fn(o.f), D = o.df ? fn(o.df) : null;
    const r = aberto('Newton-Raphson', (x) => { const fx = F(x), d = D ? D(x) : derivada(F, x); if (d === 0) err(`Newton-Raphson: f′(x) = 0 em x = ${fmt(x)} (desastre!). Escolha outro x₀.`); return { novo: x - fx / d, extra: { fx, dfx: d } }; }, o);
    r.colunas = ['i', 'xᵢ', 'f(xᵢ)', 'f′(xᵢ)', 'xᵢ₊₁', 'Eᵣ%']; return r;
  }
  function secante(o) {
    const F = fn(o.f); let ant = Number(o.x0);
    const r = aberto('Secante', (x) => { const fA = F(ant), fX = F(x), den = fX - fA; if (den === 0) err('Secante: f(xᵢ) = f(xᵢ₋₁), o denominador zerou.'); const novo = x - fX * (x - ant) / den, extra = { ant, fAnt: fA, fx: fX }; ant = x; return { novo, extra }; }, Object.assign({}, o, { x0: o.x1 }));
    r.colunas = ['i', 'xᵢ₋₁', 'xᵢ', 'f(xᵢ₋₁)', 'f(xᵢ)', 'xᵢ₊₁', 'Eᵣ%'];
    r.linhas.forEach((l) => { l.i += 1; }); // nos slides a primeira linha da Secante é i = 1 (usa x₀ e x₁)
    return r;
  }

  /* ---------- Sistemas lineares: Eliminação de Gauss (com ou sem pivoteamento parcial) ---------- */
  function gauss({ A, b, pivoteamento = 'nenhum', t = null, modo = 'arredondamento' }) {
    const n = A.length; if (!n || A.some((r) => r.length !== n) || b.length !== n) err('Gauss: a matriz precisa ser quadrada e B ter uma linha por equação.');
    const escala = Math.max(1, ...A.flat().map(Math.abs), ...b.map(Math.abs));
    // Sem aritmética de t dígitos, zera o ruído de arredondamento (ex.: −4,4×10⁻¹⁶ vira 0, como na conta à mão).
    const R = (v) => (t ? sig(v, t, modo) : Math.abs(v) < 1e-12 * escala ? 0 : v);
    const Ab = A.map((r, i) => [...r.map(R), R(b[i])]), etapas = [];
    const copia = () => Ab.map((r) => r.slice());
    etapas.push({ k: 0, titulo: 'Etapa inicial (etapa zero): matriz ampliada [A⁽⁰⁾ | B⁽⁰⁾]', matriz: copia(), multiplicadores: [], operacoes: [], troca: null, pivo: Ab[0][0] });
    for (let k = 0; k < n - 1; k++) {
      let troca = null, motivo = '';
      if (pivoteamento === 'parcial') {
        let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(Ab[i][k]) > Math.abs(Ab[p][k])) p = i;
        if (p !== k) { troca = [k, p]; motivo = `|a${sub(p + 1)}${sub(k + 1)}| é o maior elemento da coluna ${k + 1} em módulo`; }
      } else if (Ab[k][k] === 0) {
        let p = -1; for (let i = k + 1; i < n; i++) if (Ab[i][k] !== 0) { p = i; break; }
        if (p < 0) err('Gauss: não há pivô não nulo na coluna ' + (k + 1) + '; o sistema não tem solução única.');
        troca = [k, p]; motivo = `o pivô a${sub(k + 1)}${sub(k + 1)}${sup('(' + k + ')')} é nulo`;
      }
      if (troca) { const [i, j] = troca; const tmp = Ab[i]; Ab[i] = Ab[j]; Ab[j] = tmp; }
      const pivo = Ab[k][k];
      if (pivo === 0) err('Gauss: pivô nulo; o sistema não tem solução única.');
      const mults = [], ops = [];
      for (let i = k + 1; i < n; i++) {
        const m = R(Ab[i][k] / pivo); mults.push({ i, k, m });
        const mt = frac(m) || fmt(m);
        ops.push(`E${sub(i + 1)}${sup('(' + (k + 1) + ')')} → E${sub(i + 1)}${sup('(' + k + ')')} − ${/[/−]/.test(mt) ? '(' + mt + ')' : mt}E${sub(k + 1)}${sup('(' + k + ')')}`);
        for (let j = k; j <= n; j++) Ab[i][j] = j === k ? 0 : R(Ab[i][j] - R(m * Ab[k][j]));
      }
      etapas.push({ k: k + 1, titulo: `Etapa ${k + 1}: eliminação de x${sub(k + 1)} ${n - k - 1 === 1 ? 'da equação' : 'das equações'} ${Array.from({ length: n - k - 1 }, (_, j) => k + j + 2).join(', ')}`, pivo, linhaPivo: k, troca, motivoTroca: motivo, multiplicadores: mults, operacoes: ops, matriz: copia() });
    }
    // Substituição regressiva: xₙ = bₙ⁽ⁿ⁻¹⁾/aₙₙ⁽ⁿ⁻¹⁾ e xᵢ = (bᵢ − Σ aᵢⱼxⱼ)/aᵢᵢ.
    const x = Array(n).fill(0), subs = [];
    for (let i = n - 1; i >= 0; i--) {
      if (Ab[i][i] === 0) err('Gauss: pivô nulo na substituição regressiva; o sistema não tem solução única.');
      let soma = 0; for (let j = i + 1; j < n; j++) soma = R(soma + R(Ab[i][j] * x[j]));
      x[i] = R(R(Ab[i][n] - soma) / Ab[i][i]);
      const termos = Ab[i].slice(i, n).map((c, j) => (j === 0 ? `${coef(c)}x${sub(i + 1)}` : c === 0 ? null : `${c < 0 ? '−' : '+'} ${coef(Math.abs(c)) || '1'}·${x[i + j] < 0 ? '(' + fracOuNum(x[i + j]) + ')' : fracOuNum(x[i + j])}`)).filter(Boolean).join(' ');
      subs.push({ i, valor: x[i], texto: `${termos} = ${fracOuNum(Ab[i][n])} ⇒ x${sub(i + 1)} = ${fracOuNum(x[i])}` });
    }
    const provaReal = A.map((r, i) => ({ i, esquerda: r.reduce((s, a, j) => s + a * x[j], 0), direita: b[i] }));
    return { metodo: 'Eliminação de Gauss' + (pivoteamento === 'parcial' ? ' com pivoteamento parcial' : ''), etapas, triangular: copia(), substituicao: subs, solucao: x, provaReal };
  }
  function determinante(A) { const n = A.length, U = A.map((r) => r.slice()); let d = 1; for (let k = 0; k < n; k++) { let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > Math.abs(U[p][k])) p = i; if (U[p][k] === 0) return 0; if (p !== k) { const t = U[p]; U[p] = U[k]; U[k] = t; d = -d; } d *= U[k][k]; for (let i = k + 1; i < n; i++) { const m = U[i][k] / U[k][k]; for (let j = k; j < n; j++) U[i][j] -= m * U[k][j]; } } return d; }
  // Fatoração LU (Doolittle, sem pivoteamento): L com diagonal 1 e os multiplicadores; U triangular superior.
  function lu(A) {
    const n = A.length, L = A.map((_, i) => A.map((_, j) => (i === j ? 1 : 0))), U = A.map((r) => r.slice());
    for (let k = 0; k < n - 1; k++) { if (U[k][k] === 0) err('LU: pivô nulo; é preciso permutar as linhas.'); for (let i = k + 1; i < n; i++) { const m = U[i][k] / U[k][k]; L[i][k] = m; for (let j = k; j < n; j++) U[i][j] = j === k ? 0 : U[i][j] - m * U[k][j]; } }
    return { L, U, det: U.reduce((d, r, i) => d * r[i], 1) };
  }
  // A = L·U: reconstrói a matriz (e B = L·y para sistemas dados pela fatoração).
  const multiplica = (X, Y) => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
  function resolverLU(L, U, b) { const n = L.length, y = Array(n).fill(0), x = Array(n).fill(0); for (let i = 0; i < n; i++) y[i] = (b[i] - L[i].slice(0, i).reduce((s, v, j) => s + v * y[j], 0)) / L[i][i]; for (let i = n - 1; i >= 0; i--) x[i] = (y[i] - U[i].slice(i + 1).reduce((s, v, j) => s + v * x[i + 1 + j], 0)) / U[i][i]; return { y, x }; }
  // Cholesky: A = G·Gᵀ (G triangular inferior), para A simétrica definida positiva.
  function cholesky(A) {
    const n = A.length, G = A.map(() => Array(n).fill(0));
    for (let j = 0; j < n; j++) { let s = A[j][j]; for (let k = 0; k < j; k++) s -= G[j][k] * G[j][k]; if (!(s > 0)) err('Cholesky: a matriz não é definida positiva.'); G[j][j] = Math.sqrt(s); for (let i = j + 1; i < n; i++) { let t = A[i][j]; for (let k = 0; k < j; k++) t -= G[i][k] * G[j][k]; G[i][j] = t / G[j][j]; } }
    return { G, det: Math.pow(G.reduce((d, r, i) => d * r[i], 1), 2) };
  }

  /* ---------- Sistemas lineares: métodos iterativos ---------- */
  // Erro relativo entre dois vetores (listas): d = máx|xᵢ⁽ᵏ⁾ − xᵢ⁽ᵏ⁻¹⁾| / máx|xᵢ⁽ᵏ⁾|.
  function erroRelativoVetor(novo, velho) { const d = Math.max(...novo.map((v, i) => Math.abs(v - velho[i]))), m = Math.max(...novo.map(Math.abs)); return m === 0 ? Infinity : d / m; }
  function iterativo(nome, seidelMode, { A, b, x0, K = 50, eps = 1e-3, iteracoes = null, casas = null }) {
    const n = A.length; let x = (x0 || Array(n).fill(0)).map(Number); const linhas = [{ k: 0, x: x.slice(), erro: null }]; let parada = '';
    const N = iteracoes || K;
    for (let k = 1; k <= N; k++) {
      const novo = x.slice();
      for (let i = 0; i < n; i++) { if (A[i][i] === 0) err(`${nome}: a${sub(i + 1)}${sub(i + 1)} = 0; reordene as equações.`); let s = b[i]; for (let j = 0; j < n; j++) if (j !== i) s -= A[i][j] * (seidelMode ? novo[j] : x[j]); novo[i] = s / A[i][i]; if (casas != null) novo[i] = arred(novo[i], casas); }
      const erro = erroRelativoVetor(novo, x); linhas.push({ k, x: novo.slice(), erro }); x = novo;
      if (!iteracoes && erro <= eps) { parada = `d⁽${k}⁾ = ${fmt(erro)} ≤ ε na ${k}ª iteração.`; break; }
      if (k === N) parada = iteracoes ? `${N} iterações, como pedido.` : `Atingiu K = ${K} iterações.`;
    }
    return { metodo: nome, linhas, solucao: x, iteracoes: linhas.length - 1, parada };
  }
  const jacobi = (o) => iterativo('Gauss-Jacobi', false, o);
  const seidel = (o) => iterativo('Gauss-Seidel', true, o);
  // Critério das linhas: αₖ = Σⱼ≠ₖ |aₖⱼ| / |aₖₖ|; converge se máx αₖ < 1.
  function criterioLinhas(A) { const alfas = A.map((r, k) => r.reduce((s, v, j) => s + (j === k ? 0 : Math.abs(v)), 0) / Math.abs(r[k])); const max = Math.max(...alfas); return { alfas, max, converge: max < 1 }; }
  // Critério de Sassenfeld: β₁ = Σⱼ>₁|a₁ⱼ|/|a₁₁|; βᵢ = (Σⱼ<ᵢ|aᵢⱼ|βⱼ + Σⱼ>ᵢ|aᵢⱼ|)/|aᵢᵢ|; converge se máx βᵢ < 1.
  function sassenfeld(A) { const n = A.length, betas = []; for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) if (j !== i) s += Math.abs(A[i][j]) * (j < i ? betas[j] : 1); betas.push(s / Math.abs(A[i][i])); } const max = Math.max(...betas); return { betas, max, converge: max < 1 }; }

  /* ---------- Interpolação ---------- */
  function lagrange(xs, ys, x) { let s = 0; for (let i = 0; i < xs.length; i++) { let L = 1; for (let j = 0; j < xs.length; j++) if (j !== i) L *= (x - xs[j]) / (xs[i] - xs[j]); s += ys[i] * L; } return s; }
  // Coeficientes do polinômio interpolador p(x) = c₀ + c₁x + … (sistema de Vandermonde).
  function polinomio(xs, ys) { const A = xs.map((x) => xs.map((_, j) => Math.pow(x, j))); return gauss({ A, b: ys, pivoteamento: 'parcial' }).solucao; }
  const avaliar = (c, x) => c.reduce((s, v, j) => s + v * Math.pow(x, j), 0);
  // Interpolação linear com os dois pontos da tabela vizinhos de x.
  function linear(xs, ys, x) { let i = 0; while (i < xs.length - 2 && x > xs[i + 1]) i++; return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]); }
  function linearInversa(xs, ys, y) { let i = 0; const cresce = ys[ys.length - 1] > ys[0]; while (i < ys.length - 2 && (cresce ? y > ys[i + 1] : y < ys[i + 1])) i++; return xs[i] + (xs[i + 1] - xs[i]) * (y - ys[i]) / (ys[i + 1] - ys[i]); }
  // x* tal que p(x*) = y, por Bisseção no intervalo da tabela.
  function raizDoPolinomio(c, y, lo, hi) { const g = (x) => avaliar(c, x) - y; let a = lo, b = hi; if (g(a) * g(b) > 0) err('Não há troca de sinal no intervalo da tabela.'); for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (g(a) * g(m) <= 0) b = m; else a = m; } return (a + b) / 2; }

  /* ---------- Mínimos quadrados (equações normais) ---------- */
  function minimosQuadrados(xs, ys, bases) {
    const m = bases.length, A = bases.map((fi) => bases.map((fj) => xs.reduce((s, x) => s + fi(x) * fj(x), 0))), b = bases.map((fi) => xs.reduce((s, x, k) => s + fi(x) * ys[k], 0));
    return gauss({ A, b, pivoteamento: 'parcial' }).solucao.slice(0, m);
  }
  const BASES = {
    reta: [() => 1, (x) => x], parabola: [() => 1, (x) => x, (x) => x * x], 'a+bx2': [() => 1, (x) => x * x],
    'a+bx3': [() => 1, (x) => x * x * x], 'ax+bcos': [(x) => x, (x) => Math.cos(x)], 'a+bv2': [() => 1, (x) => x * x],
  };

  /* ---------- Integração numérica ---------- */
  function pontos(o) { if (o.ys) return { xs: o.xs, ys: o.ys }; const F = fn(o.f), n = o.n, h = (o.b - o.a) / n, xs = Array.from({ length: n + 1 }, (_, i) => o.a + i * h); return { xs, ys: xs.map(F) }; }
  function trapezios(o) { const { xs, ys } = pontos(o), h = xs[1] - xs[0]; return h / 2 * (ys[0] + 2 * ys.slice(1, -1).reduce((s, v) => s + v, 0) + ys[ys.length - 1]); }
  function simpson13(o) { const { xs, ys } = pontos(o), h = xs[1] - xs[0], n = ys.length - 1; if (n % 2) err('Simpson 1/3 precisa de um número par de subintervalos.'); let s = ys[0] + ys[n]; for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * ys[i]; return h / 3 * s; }
  function simpson38(o) { const { xs, ys } = pontos(o), h = xs[1] - xs[0], n = ys.length - 1; if (n % 3) err('Simpson 3/8 precisa de um número de subintervalos múltiplo de 3.'); let s = ys[0] + ys[n]; for (let i = 1; i < n; i++) s += (i % 3 ? 3 : 2) * ys[i]; return 3 * h / 8 * s; }
  // Regra dos retângulos pelo ponto médio de cada subintervalo.
  function retangulos(o) { const F = fn(o.f), h = (o.b - o.a) / o.n; let s = 0; for (let i = 0; i < o.n; i++) s += F(o.a + (i + 0.5) * h); return h * s; }

  /* ---------- Equações diferenciais (PVI) ---------- */
  function euler({ f, x0, y0, h, xf }) { let x = x0, y = y0; const n = Math.round((xf - x0) / h), linhas = [{ k: 0, x, y }]; for (let k = 1; k <= n; k++) { y = y + h * f(x, y); x = x0 + k * h; linhas.push({ k, x, y }); } return { y, linhas }; }
  // Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), com as derivadas parciais aproximadas.
  function taylor2({ f, x0, y0, h, xf }) { let x = x0, y = y0; const n = Math.round((xf - x0) / h), linhas = [{ k: 0, x, y }]; for (let k = 1; k <= n; k++) { const v = f(x, y), dx = 1e-6 * (1 + Math.abs(x)), dy = 1e-6 * (1 + Math.abs(y)), fx = (f(x + dx, y) - f(x - dx, y)) / (2 * dx), fy = (f(x, y + dy) - f(x, y - dy)) / (2 * dy); y = y + h * v + h * h / 2 * (fx + fy * v); x = x0 + k * h; linhas.push({ k, x, y }); } return { y, linhas }; }

  /* ---------- Ponto flutuante F(β, t, m, M) ---------- */
  // fl(x): mantissa normalizada 0,d₁d₂…dₜ × βᵉ, com arredondamento ou truncamento da parcela que não cabe.
  function fl(x, { t, m = -99, M: Mx = 99, modo = 'arredondamento' }) {
    if (x === 0) return { valor: 0, mantissa: 0, expoente: 0, regiao: 'normal' };
    let e = Math.floor(Math.log10(Math.abs(x))) + 1; let man = x / Math.pow(10, e);
    // toPrecision(12) limpa o ruído binário (0,27395 vira 0,2739499… em binário).
    const k = Math.pow(10, t), mk = Number((man * k).toPrecision(12));
    man = modo === 'truncamento' ? Math.trunc(mk) / k : Math.sign(mk) * Math.round(Math.abs(mk)) / k;
    if (Math.abs(man) >= 1) { man /= 10; e += 1; }
    const regiao = e > Mx ? 'overflow' : e < m ? 'underflow' : 'normal';
    return { valor: Number((man * Math.pow(10, e)).toPrecision(t + 1)), mantissa: Number(man.toFixed(t)), expoente: e, regiao };
  }
  const notacaoFl = (r, t) => `${fmt(r.mantissa, t)} × 10${sup(String(r.expoente))}`;

  /* ---------- Tabela pronta para a interface (rótulos + linhas formatadas) ---------- */
  function tabela(r, casas = 6) {
    const f = (v) => fmt(v, casas), e = (v) => (v === null || v === undefined ? '—' : fmt(v, v >= 0.01 || v === 0 ? casas : null));
    if (r.metodo === 'Bisseção' || r.metodo === 'Falsa Posição') return { colunas: r.colunas, linhas: r.linhas.map((l) => [String(l.i), f(l.a), f(l.b), f(l.x), f(l.fa), f(l.fb), f(l.fx), e(l.erro)]) };
    if (r.metodo === 'Ponto Fixo') return { colunas: r.colunas, linhas: r.linhas.map((l) => [String(l.i), f(l.x), f(l.novo), e(l.erro)]) };
    if (r.metodo === 'Newton-Raphson') return { colunas: r.colunas, linhas: r.linhas.map((l) => [String(l.i), f(l.x), f(l.fx), f(l.dfx), f(l.novo), e(l.erro)]) };
    if (r.metodo === 'Secante') return { colunas: r.colunas, linhas: r.linhas.map((l) => [String(l.i), f(l.ant), f(l.x), f(l.fAnt), f(l.fx), f(l.novo), e(l.erro)]) };
    if (/Jacobi|Seidel/.test(r.metodo)) return { colunas: ['k', ...r.solucao.map((_, i) => `x${sub(i + 1)}${sup('(k)')}`), 'dᵣ'], linhas: r.linhas.map((l) => [String(l.k), ...l.x.map(f), e(l.erro)]) };
    return { colunas: [], linhas: [] };
  }

  global.NumeraPassos = {
    sub, sup, fmt, frac, arred, sig, fn, CRITERIOS, erroEstimado, iteracoesBissecao,
    bissecao, falsaPosicao, pontoFixo, newton, secante, derivada,
    gauss, determinante, lu, multiplica, resolverLU, cholesky,
    jacobi, seidel, erroRelativoVetor, criterioLinhas, sassenfeld,
    lagrange, polinomio, avaliar, linear, linearInversa, raizDoPolinomio,
    minimosQuadrados, BASES, trapezios, simpson13, simpson38, retangulos,
    euler, taylor2, fl, notacaoFl, tabela, sinal,
  };
})(typeof window !== 'undefined' ? window : globalThis);
