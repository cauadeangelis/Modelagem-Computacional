/* Quem Divergiu? — banco de perguntas (v12).
   Toda resposta é CALCULADA aqui (nada digitado à mão) e conferida em tests/verify.cjs contra o motor do site
   (NumeraMath). Cada pergunta traz o passo a passo, para a professora explicar depois da revelação.
   Além das perguntas próprias, entram os desafios numéricos da antiga Arena (NumeraContent.ARENA) como
   "relâmpago", respeitando os métodos escondidos (NumeraContent.HIDDEN). */
(function (global) {
  'use strict';
  const C = global.NumeraContent || null;
  const HIDDEN = (C && C.HIDDEN) || [];

  // ---------- Números em português: 1,5 · 2,2·10⁻¹⁶ ----------
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function fmt(v, casas) {
    if (!Number.isFinite(v)) return '—';
    const a = Math.abs(v);
    if (a !== 0 && (a < 1e-4 || a >= 1e9)) {
      const [m, e] = v.toExponential(Math.min(casas ?? 3, 3)).split('e');
      return `${m.replace('.', ',').replace(/,?0+$/, '')}·10${String(Number(e)).replace(/[-0-9]/g, c => SUP[c])}`;
    }
    let s = casas === undefined ? String(Number(v.toPrecision(12))) : v.toFixed(casas);
    if (casas !== undefined && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    const [i, d] = s.split('.');
    return (i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '')).replace('-', '−');
  }
  // Palpite digitado: vírgula ou ponto decimal (1,414 = 1.414), milhar só com dois ou mais pontos ou junto com vírgula
  // (18.000.000 · 1.234,5), frações (5/3), notação científica (1e-6, 2,2·10⁻¹⁶, 2,2*10^-16) e π. A tela mostra como leu.
  function lerNumero(txt) {
    let s = String(txt ?? '').trim().replace(/\s+/g, '').replace(/−/g, '-').replace(/[×·]/g, '*').replace(/π|pi/gi, 'P')
      .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]).join(''));
    if (!s) return null;
    s = s.replace(/\*10\^?\(?([+-]?\d+)\)?$/, 'e$1');
    if (/^-?\d{1,3}(\.\d{3}){2,}(,\d+)?$/.test(s) || /^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const num = t => { if (t === 'P') return Math.PI; if (t === '-P') return -Math.PI; return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? Number(t) : NaN; };
    let v;
    if (/^[^/]+\/[^/]+$/.test(s)) { const [a, b] = s.split('/').map(num); v = a / b; }
    else if (/^[+-]?(\d+\.?\d*|\.\d+)P$/.test(s)) v = Number(s.slice(0, -1)) * Math.PI;
    else v = num(s);
    return Number.isFinite(v) ? v : null;
  }

  // ---------- Métodos (implementação própria, curta e legível) ----------
  const passosBissecao = (f, a, b, n) => { const r = []; for (let k = 1; k <= n; k++) { const m = (a + b) / 2, fm = f(m); r.push({ k, a, b, m, fm }); if (fm === 0) break; if (f(a) * fm < 0) b = m; else a = m; } return r; };
  const raizBissecao = (f, a, b) => { for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
  const passosFalsa = (f, a, b, n) => { const r = []; for (let k = 1; k <= n; k++) { const x = (a * f(b) - b * f(a)) / (f(b) - f(a)), fx = f(x); r.push({ k, a, b, x, fx }); if (f(a) * fx < 0) b = x; else a = x; } return r; };
  const passosNewton = (f, df, x, n) => { const r = []; for (let k = 1; k <= n; k++) { const nx = x - f(x) / df(x); r.push({ k, x, fx: f(x), dfx: df(x), nx }); x = nx; } return r; };
  const passosSecante = (f, x0, x1, n) => { const r = []; for (let k = 1; k <= n; k++) { const x2 = x1 - f(x1) * (x1 - x0) / (f(x1) - f(x0)); r.push({ k, x0, x1, x2 }); x0 = x1; x1 = x2; } return r; };
  function gauss(A, b) { // pivoteamento parcial
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const m = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= m * M[c][k]; }
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i]; }
    return x;
  }
  const residuo = (A, b, x) => Math.max(...A.map((r, i) => Math.abs(r.reduce((s, a, j) => s + a * x[j], 0) - b[i])));
  function seidel(A, b, x, n) { x = [...x]; for (let k = 0; k < n; k++) for (let i = 0; i < b.length; i++) { let s = b[i]; for (let j = 0; j < b.length; j++) if (j !== i) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x; }
  function jacobi(A, b, x, n) { for (let k = 0; k < n; k++) x = b.map((bi, i) => (bi - A[i].reduce((s, a, j) => j === i ? s : s + a * x[j], 0)) / A[i][i]); return x; }

  const F = fmt;
  // ---------- As perguntas ----------
  // nivel: 1 Fácil · 2 Médio · 3 Difícil (a mesma escala da jornada). casas: como a resposta aparece na reta.
  const P = [
    // Bisseção
    { id: 'bis-3passos', metodo: 'bisection', nivel: 1, casas: 4,
      texto: 'f(x) = x³ − x − 2, no intervalo [1, 2]. Faça 3 passos da Bisseção. Quanto vale o 3º ponto médio?',
      dica: 'Ponto médio, sinal de f, fica a metade onde f troca de sinal. Três vezes.',
      calc() { const f = x => x ** 3 - x - 2, r = passosBissecao(f, 1, 2, 3); return { resposta: r[2].m, passos: r.map(p => `m${sub(p.k)} = (${F(p.a)} + ${F(p.b)})/2 = ${F(p.m)} · f(m) = ${F(p.fm, 4)}`) }; } },
    { id: 'bis-iteracoes', metodo: 'bisection', nivel: 1, casas: 0,
      texto: 'Quantas iterações da Bisseção garantem erro menor que 10⁻⁶, começando no intervalo [0, 1]?',
      dica: 'Cada passo divide a largura por 2: (b − a)/2ⁿ < ε.',
      calc() { const n = Math.ceil(Math.log2(1 / 1e-6)); return { resposta: n, passos: [`(b − a)/2ⁿ < ε  ⇒  n > log₂(1/10⁻⁶) = ${F(Math.log2(1e6), 2)}`, `O menor inteiro é n = ${n}.`] }; } },
    { id: 'bis-raiz5', metodo: 'bisection', nivel: 1, casas: 4,
      texto: '√5 pela Bisseção: f(x) = x² − 5 no intervalo [2, 3]. Quanto vale o 4º ponto médio?',
      dica: 'f(2) < 0 e f(3) > 0. Corte ao meio quatro vezes.',
      calc() { const f = x => x * x - 5, r = passosBissecao(f, 2, 3, 4); return { resposta: r[3].m, passos: r.map(p => `m${sub(p.k)} = ${F(p.m)} · f(m) = ${F(p.fm, 4)}`) }; } },
    { id: 'bis-largura', metodo: 'bisection', nivel: 1, casas: 7,
      texto: 'O intervalo começa em [0, 8]. Depois de 10 passos da Bisseção, qual é a largura do intervalo?',
      dica: 'A largura cai pela metade a cada passo.',
      calc() { return { resposta: 8 / 2 ** 10, passos: ['Largura = 8/2¹⁰ = 8/1024', `= ${F(8 / 1024, 7)}`] }; } },
    { id: 'bis-raiz-aula', metodo: 'bisection', nivel: 2, casas: 4,
      texto: 'Qual é a raiz de x³ − 9x + 3 no intervalo [0, 1]? Responda com 4 casas.',
      dica: 'f(0) = 3 e f(1) = −5: a raiz está mais perto do 0.',
      calc() { const f = x => x ** 3 - 9 * x + 3, x = raizBissecao(f, 0, 1); return { resposta: x, passos: ['f(0) = 3 > 0 e f(1) = −5 < 0: há raiz em [0, 1].', `A Bisseção converge para x ≈ ${F(x, 6)}.`, `Confere: f(${F(x, 4)}) ≈ ${F(f(x), 2)}.`] }; } },
    // Falsa Posição
    { id: 'fp-corte1', metodo: 'falseposition', nivel: 1, casas: 4,
      texto: 'f(x) = x² − 3 no intervalo [1, 2]. Onde cai o primeiro corte da Falsa Posição?',
      dica: 'A corda liga (a, f(a)) a (b, f(b)); o corte é onde ela cruza o eixo x.',
      calc() { const f = x => x * x - 3, r = passosFalsa(f, 1, 2, 1)[0]; return { resposta: r.x, passos: ['f(1) = −2 e f(2) = 1.', 'x = (a·f(b) − b·f(a)) / (f(b) − f(a)) = (1·1 − 2·(−2)) / (1 − (−2))', `x = 5/3 = ${F(r.x, 4)}`] }; } },
    { id: 'fp-corte2', metodo: 'falseposition', nivel: 2, casas: 4,
      texto: 'f(x) = x³ − 2x − 5 no intervalo [2, 3]. Faça 2 cortes da Falsa Posição. Onde cai o segundo?',
      dica: 'f(2) = −1 e f(3) = 16. Depois do 1º corte, fique com a ponta onde f troca de sinal.',
      calc() { const f = x => x ** 3 - 2 * x - 5, r = passosFalsa(f, 2, 3, 2); return { resposta: r[1].x, passos: r.map(p => `corte ${p.k}: [${F(p.a, 4)}, ${F(p.b, 4)}] → x = ${F(p.x, 5)}, f(x) = ${F(p.fx, 4)}`) }; } },
    { id: 'fp-carne', metodo: 'falseposition', nivel: 2, casas: 4,
      texto: 'Missão do carnê: um notebook de R$ 10.000 sai em 12 parcelas de R$ 950, sem entrada. A taxa i resolve 950·(1 − (1 + i)⁻¹²)/i = 10.000. Qual é a taxa ao mês, em %?',
      dica: 'Sem juros, 12 × 950 = 11.400. f(1%) > 0 e f(3%) < 0.',
      calc() { const f = i => 950 * (1 - (1 + i) ** -12) / i - 10000, i = raizBissecao(f, 0.01, 0.03); return { resposta: i * 100, passos: ['f(i) = 950·(1 − (1 + i)⁻¹²)/i − 10.000, com f(1%) ≈ 692 e f(3%) ≈ −544.', `A raiz é i ≈ ${F(i, 6)}, ou seja, ${F(i * 100, 4)}% ao mês.`] }; } },
    // Newton-Raphson
    { id: 'nw-raiz2', metodo: 'newton', nivel: 2, casas: 5,
      texto: '√2 pelo Newton: f(x) = x² − 2, partindo de x₀ = 1. Quanto vale x₂?',
      dica: 'xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ), com f′(x) = 2x.',
      calc() { const r = passosNewton(x => x * x - 2, x => 2 * x, 1, 2); return { resposta: r[1].nx, passos: r.map(p => `x${sub(p.k)} = ${F(p.x, 6)} − (${F(p.fx, 6)})/(${F(p.dfx, 6)}) = ${F(p.nx, 6)}`) }; } },
    { id: 'nw-passos', metodo: 'newton', nivel: 2, casas: 0,
      texto: 'Quantos passos o Newton precisa, partindo de x₀ = 1, até |f(x)| < 10⁻¹⁰ em f(x) = x² − 2?',
      dica: 'Perto da raiz, as casas certas quase dobram a cada passo.',
      calc() { let x = 1, n = 0; const lin = []; while (Math.abs(x * x - 2) >= 1e-10 && n < 50) { x = x - (x * x - 2) / (2 * x); n++; lin.push(`x${sub(n)} = ${F(x, 12)} · |f| = ${F(Math.abs(x * x - 2), 2)}`); } return { resposta: n, passos: lin }; } },
    { id: 'nw-cubica', metodo: 'newton', nivel: 2, casas: 5,
      texto: 'Newton em f(x) = x³ − x − 2, com x₀ = 1,5. Quanto vale x₁?',
      dica: 'f(1,5) = −0,125 e f′(x) = 3x² − 1.',
      calc() { const r = passosNewton(x => x ** 3 - x - 2, x => 3 * x * x - 1, 1.5, 1)[0]; return { resposta: r.nx, passos: [`f(1,5) = ${F(r.fx, 4)} · f′(1,5) = ${F(r.dfx, 4)}`, `x₁ = 1,5 − (${F(r.fx, 4)})/${F(r.dfx, 4)} = ${F(r.nx, 6)}`] }; } },
    { id: 'nw-cos', metodo: 'newton', nivel: 2, casas: 4,
      texto: 'Qual é a raiz de cos(x) = x, com 4 casas? (ângulo em radianos)',
      dica: 'f(x) = cos(x) − x. O gráfico de cos(x) cruza a reta y = x antes de 1.',
      calc() { const r = passosNewton(x => Math.cos(x) - x, x => -Math.sin(x) - 1, 1, 6); return { resposta: r[5].nx, passos: r.slice(0, 4).map(p => `x${sub(p.k)} = ${F(p.nx, 8)}`).concat([`Raiz ≈ ${F(r[5].nx, 6)} (o número de Dottie).`]) }; } },
    { id: 'nw-inverso', metodo: 'newton', nivel: 3, casas: 4,
      texto: 'Newton calcula 1/3 sem dividir: em f(x) = 1/x − 3, o passo vira xᵢ₊₁ = xᵢ·(2 − 3xᵢ). Partindo de x₀ = 0,3, quanto vale x₂?',
      dica: 'Só multiplicações: x₁ = 0,3·(2 − 0,9).',
      calc() { let x = 0.3; const lin = []; for (let k = 1; k <= 2; k++) { x = x * (2 - 3 * x); lin.push(`x${sub(k)} = ${F(x, 6)}`); } return { resposta: x, passos: lin.concat(['É assim que muitos processadores calculam divisões.']) }; } },
    { id: 'nw-erro', metodo: 'newton', nivel: 3, casas: 6,
      texto: 'Perto da raiz, o erro do Newton é aproximadamente o quadrado do erro anterior (C ≈ 1). Se o erro agora é 10⁻³, qual será o erro no próximo passo?',
      dica: 'Convergência quadrática: eₖ₊₁ ≈ C·eₖ².',
      calc() { return { resposta: 1e-6, passos: ['eₖ₊₁ ≈ eₖ² = (10⁻³)² = 10⁻⁶', 'As casas certas dobram: de 3 para 6.'] }; } },
    // Secante
    { id: 'sec-x2', metodo: 'secant', nivel: 2, casas: 4,
      texto: 'Secante em f(x) = x² − 2, com x₀ = 1 e x₁ = 2. Quanto vale x₂?',
      dica: 'A reta passa por (x₀, f(x₀)) e (x₁, f(x₁)) e cruza o eixo x.',
      calc() { const r = passosSecante(x => x * x - 2, 1, 2, 1)[0]; return { resposta: r.x2, passos: ['f(1) = −1 e f(2) = 2.', 'x₂ = x₁ − f(x₁)·(x₁ − x₀)/(f(x₁) − f(x₀)) = 2 − 2·1/3', `x₂ = 4/3 = ${F(r.x2, 4)}`] }; } },
    { id: 'sec-x3', metodo: 'secant', nivel: 2, casas: 4,
      texto: 'Secante em f(x) = x² − 2, com x₀ = 1 e x₁ = 2. Dê mais um passo: quanto vale x₃?',
      dica: 'x₂ = 4/3. Agora use x₁ = 2 e x₂ = 4/3.',
      calc() { const r = passosSecante(x => x * x - 2, 1, 2, 2); return { resposta: r[1].x2, passos: r.map(p => `x${sub(p.k + 1)} = ${F(p.x2, 6)} (a partir de ${F(p.x0, 4)} e ${F(p.x1, 4)})`) }; } },
    { id: 'sec-ordem', metodo: 'secant', nivel: 3, casas: 3,
      texto: 'A ordem de convergência da Secante é a razão áurea, (1 + √5)/2. Quanto ela vale, com 3 casas?',
      dica: 'Está entre a Bisseção (1) e o Newton (2).',
      calc() { const p = (1 + Math.sqrt(5)) / 2; return { resposta: p, passos: [`(1 + √5)/2 = ${F(p, 6)}`, 'Mais rápida que a ordem 1, sem precisar da derivada.'] }; } },
    // Eliminação de Gauss
    { id: 'ga-x', metodo: 'gauss', nivel: 3, casas: 2,
      texto: 'Resolva o sistema 2x + y = 5 e x + 3y = 6. Quanto vale x?',
      dica: 'Elimine x da segunda equação: m₂₁ = ½ e E₂⁽¹⁾ → E₂⁽⁰⁾ − ½E₁⁽⁰⁾.',
      calc() { const [x, y] = gauss([[2, 1], [1, 3]], [5, 6]); return { resposta: x, passos: ['E₂⁽¹⁾ → E₂⁽⁰⁾ − ½E₁⁽⁰⁾: 2,5y = 3,5 ⇒ y = 1,4', `Substituição regressiva: 2x = 5 − 1,4 ⇒ x = ${F(x, 2)}`, `Solução: (${F(x, 2)}; ${F(y, 2)})`] }; } },
    { id: 'ga-z', metodo: 'gauss', nivel: 3, casas: 4,
      texto: 'Sistema: x + y + z = 6, 2x − y + z = 3 e x + 2y − z = 2. Quanto vale z?',
      dica: 'Elimine x das duas últimas linhas; depois, y da última.',
      calc() { const A = [[1, 1, 1], [2, -1, 1], [1, 2, -1]], b = [6, 3, 2], x = gauss(A, b); return { resposta: x[2], passos: [`Com pivoteamento parcial: x = ${F(x[0], 4)}, y = ${F(x[1], 4)}, z = ${F(x[2], 4)}`, `Resíduo máximo ≈ ${F(residuo(A, b, x), 2)}`] }; } },
    { id: 'ga-custo', metodo: 'gauss', nivel: 3, casas: 0,
      texto: 'A Eliminação de Gauss faz cerca de 2n³/3 operações. Quantas, num sistema 30 × 30?',
      dica: '30³ = 27.000.',
      calc() { return { resposta: 2 * 30 ** 3 / 3, passos: ['2·30³/3 = 2·27.000/3', `= ${F(2 * 30 ** 3 / 3, 0)} operações`] }; } },
    { id: 'ga-pivo', metodo: 'gauss', nivel: 3, casas: 2,
      texto: 'Pivoteamento parcial na matriz [[1, 2], [4, 1]]: depois de trocar as linhas, qual multiplicador zera o elemento abaixo do pivô?',
      dica: 'O pivô passa a ser o maior da coluna em módulo: 4.',
      calc() { return { resposta: 1 / 4, passos: ['Troca: o pivô vira 4 (linha [4, 1]).', 'm₂₁ = 1/4 = 0,25; E₂⁽¹⁾ → E₂⁽⁰⁾ − 0,25E₁⁽⁰⁾.', 'Multiplicadores ≤ 1 evitam ampliar erros de arredondamento.'] }; } },
    // Gauss-Seidel
    { id: 'gs-y1', metodo: 'seidel', nivel: 3, casas: 2,
      texto: 'Gauss-Seidel em 10x − y = 9 e −x + 10y = 19, partindo de (0, 0). Depois de 1 iteração, quanto vale y?',
      dica: 'Calcule x primeiro e use esse x novo na conta do y.',
      calc() { const x = seidel([[10, -1], [-1, 10]], [9, 19], [0, 0], 1); return { resposta: x[1], passos: ['x⁽¹⁾ = (9 + 0)/10 = 0,9', `y⁽¹⁾ = (19 + 0,9)/10 = ${F(x[1], 2)} (já usa o x novo)`] }; } },
    { id: 'gs-jacobi', metodo: 'seidel', nivel: 3, casas: 2,
      texto: 'Mesmo sistema (10x − y = 9 e −x + 10y = 19, partindo de (0, 0)), mas pelo Jacobi: quanto vale y depois de 1 iteração?',
      dica: 'O Jacobi só usa valores da rodada anterior.',
      calc() { const x = jacobi([[10, -1], [-1, 10]], [9, 19], [0, 0], 1); return { resposta: x[1], passos: [`y⁽¹⁾ = (19 + 0)/10 = ${F(x[1], 2)}`, 'No Gauss-Seidel daria 1,99: ele aproveita o x que acabou de calcular.'] }; } },
    { id: 'gs-iter', metodo: 'seidel', nivel: 3, casas: 0,
      texto: 'Gauss-Seidel em 4x − y = 3 e −x + 4y = 3, partindo de (0, 0). Quantas iterações até o resíduo máximo ficar abaixo de 10⁻⁸?',
      dica: 'A solução é (1, 1), e a matriz tem diagonal dominante.',
      calc() { const A = [[4, -1], [-1, 4]], b = [3, 3]; let x = [0, 0], n = 0; const lin = []; while (residuo(A, b, x) >= 1e-8 && n < 100) { x = seidel(A, b, x, 1); n++; if (n <= 3 || residuo(A, b, x) < 1e-8) lin.push(`k = ${n}: (${F(x[0], 9)}; ${F(x[1], 9)}) · resíduo ${F(residuo(A, b, x), 2)}`); } return { resposta: n, passos: lin }; } },
    { id: 'gs-custo', metodo: 'seidel', nivel: 3, casas: 0,
      texto: 'Num sistema 1000 × 1000, cada iteração do Gauss-Seidel custa cerca de 2n² operações. Quantas operações em 10 iterações?',
      dica: 'n² = 1.000.000.',
      calc() { return { resposta: 10 * 2 * 1000 ** 2, passos: ['10 · 2 · 1000² = 20.000.000', 'A Eliminação de Gauss gastaria ≈ 2·1000³/3 ≈ 667 milhões: por isso o iterativo vale a pena em sistemas grandes.'] }; } },
    // Erro e convergência (vale para qualquer método)
    { id: 'er-metade', metodo: 'erro', nivel: 1, casas: 0,
      texto: 'Se o erro cai pela metade a cada passo, partindo de 1, quantos passos até ficar abaixo de 0,001?',
      dica: '2¹⁰ = 1024.',
      calc() { const n = Math.ceil(Math.log2(1000)); return { resposta: n, passos: ['1/2ⁿ < 0,001 ⇒ 2ⁿ > 1000', `n = ${n}, porque 2¹⁰ = 1024`] }; } },
    { id: 'er-pi', metodo: 'erro', nivel: 1, casas: 4,
      texto: 'Usando 22/7 no lugar de π, qual é o erro relativo, em %?',
      dica: '22/7 = 3,142857…',
      calc() { const e = (22 / 7 - Math.PI) / Math.PI * 100; return { resposta: e, passos: [`|22/7 − π|/π = ${F(Math.abs(22 / 7 - Math.PI), 6)}/${F(Math.PI, 6)}`, `= ${F(e, 4)}%`] }; } },
    { id: 'er-digitos', metodo: 'erro', nivel: 2, casas: 2,
      texto: 'O double tem 53 bits de precisão. Quantos dígitos decimais isso dá, mais ou menos? (log₁₀ 2⁵³)',
      dica: 'log₁₀ 2 ≈ 0,301.',
      calc() { const d = 53 * Math.log10(2); return { resposta: d, passos: [`53 · log₁₀ 2 = 53 · 0,30103 = ${F(d, 2)}`, 'Por isso pedir tolerância 10⁻²⁰ não faz sentido no computador.'] }; } },
    { id: 'er-eps', metodo: 'erro', nivel: 3, casas: 3,
      texto: 'O épsilon de máquina do double é 2⁻⁵². Quanto ele vale? (Pode responder como 1e-10, por exemplo.)',
      dica: '2⁻¹⁰ ≈ 10⁻³.',
      calc() { const e = 2 ** -52; return { resposta: e, passos: [`2⁻⁵² = ${F(e, 4)}`, 'É a menor diferença relativa entre dois números que o double consegue separar.'] }; } },
    { id: 'er-cubo', metodo: 'erro', nivel: 1, casas: 4,
      texto: 'Missão do reservatório: um tanque cúbico guarda 4 m³. Qual é a aresta, em metros, com 4 casas?',
      dica: 'x³ = 4. Está entre 1,5 e 1,6.',
      calc() { const x = Math.cbrt(4); return { resposta: x, passos: ['x³ − 4 = 0', `x = ∛4 ≈ ${F(x, 6)} m`] }; } },
  ];
  function sub(n) { return String(n).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]); }

  // Desafios numéricos da antiga Arena viram perguntas "relâmpago" (com a explicação que já tinham).
  const NIVEL_DO = { bisection: 1, falseposition: 1, fixedpoint: 2, newton: 2, secant: 2, gauss: 3, seidel: 3 };
  const arena = (C && Array.isArray(C.ARENA) ? C.ARENA : []).map((t, i) => ({ t, i }))
    .filter(({ t }) => t.type !== 'choice' && Number.isFinite(t.value) && t.value !== 0)
    .map(({ t, i }) => ({ id: 'arena-' + i, metodo: t.method, nivel: NIVEL_DO[t.method] || 2, casas: 4, relampago: true,
      texto: t.q, dica: 'Desafio relâmpago: resolva de cabeça ou no caderno.', calc: () => ({ resposta: t.value, passos: [t.explain] }) }));

  // v13: as questões numéricas das listas (banco de questões do site), quando o banco está carregado.
  // A resposta é a do banco, que os testes refazem com o resolvedor; o passo a passo vem do mesmo resolvedor.
  const B = global.NumeraBanco || null, RS = global.NumeraResolver || null;
  const TEMA_QD = { bissecao: 'bisection', 'falsa-posicao': 'falseposition', newton: 'newton', secante: 'secant', gauss: 'gauss', pivoteamento: 'gauss', lu: 'gauss', cholesky: 'gauss', markov: 'gauss', jacobi: 'seidel', seidel: 'seidel', criterios: 'seidel', 'erro-vetor': 'seidel', 'ponto-flutuante': 'erro', series: 'erro', interpolacao: 'ajuste', 'minimos-quadrados': 'ajuste', trapezios: 'integral', retangulos: 'integral', simpson13: 'integral', simpson38: 'integral', euler: 'integral', taylor: 'integral' };
  const doBanco = !B ? [] : B.questoes.filter(q => q.tipo === 'numero' && Number.isFinite(q.valor) && q.valor !== 0 && !q.origem && TEMA_QD[q.tema]).map(q => {
    const L = B.listas.find(l => l.id === q.lista);
    return { id: 'lista-' + q.id, metodo: TEMA_QD[q.tema], nivel: q.dificuldade, casas: q.casas ?? 4, lista: true, texto: q.enunciado,
      dica: `${L ? L.titulo : 'Lista'}${q.numero ? ', ' + q.numero : ''}.`,
      calc() {
        let passos = [`Resposta: ${q.resposta}`];
        try { if (RS) { const r = RS.resolver(q.parametros); passos = String(r.resumo || '').replace(/\.\s+(?=[A-ZÁÉÍÓÚ])/g, '.\n').split('\n').filter(Boolean); } } catch (e) { /* fica a resposta */ }
        if (q.observacao) passos.push('Sobre o gabarito da lista: ' + q.observacao);
        // o quadro do jogo não eleva expoentes: e^(…) vira exp(…) e 10^(…) vira 10 elevado a (…)
        passos = passos.map(t => t.replace(/e\^\(([^)]*)\)/g, 'exp($1)').replace(/(\d)\^\(([^)]*)\)/g, '$1 elevado a ($2)'));
        return { resposta: q.valor, passos };
      } };
  });

  const TODAS = P.concat(arena, doBanco).filter(q => !HIDDEN.includes(q.metodo));
  const cache = new Map();
  function resolver(q) { if (!cache.has(q.id)) cache.set(q.id, q.calc()); return cache.get(q.id); }

  const TEMAS = [['bisection', 'Bisseção'], ['falseposition', 'Falsa Posição'], ['fixedpoint', 'Ponto Fixo'], ['newton', 'Newton-Raphson'], ['secant', 'Secante'], ['gauss', 'Eliminação de Gauss'], ['seidel', 'Gauss-Seidel'], ['erro', 'Erro e convergência'], ['ajuste', 'Interpolação e ajuste'], ['integral', 'Integração e EDO']]
    .filter(([id]) => !HIDDEN.includes(id) && TODAS.some(q => q.metodo === id));

  // Sorteio com semente (a partida pode ser repetida igual) e sem pergunta repetida.
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function sortear({ temas, niveis = [1, 2, 3], rodadas = 8, relampago = true, listas = true, semente = Date.now() }) {
    const r = rng(semente);
    const pool = TODAS.filter(q => (!temas || temas.includes(q.metodo)) && niveis.includes(q.nivel) && (relampago || !q.relampago) && (listas || !q.lista));
    const proprias = pool.filter(q => !q.relampago), extras = pool.filter(q => q.relampago);
    const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // As perguntas próprias vêm primeiro (têm passo a passo completo); a Arena completa o que faltar.
    const escolha = mix(proprias).concat(mix(extras)).slice(0, rodadas);
    // Do mais fácil ao mais difícil, como na jornada.
    return escolha.sort((a, b) => a.nivel - b.nivel);
  }

  // Pontuação: faixas de tolerância relativas à resposta, como o critério de parada dos métodos.
  const FAIXAS = [
    { ate: 0.01, pontos: 100, nome: 'Convergiu!', curto: '≤ 1%' },
    { ate: 0.05, pontos: 60, nome: 'Quase lá', curto: '≤ 5%' },
    { ate: 0.2, pontos: 30, nome: 'No intervalo', curto: '≤ 20%' },
    { ate: 0.5, pontos: 10, nome: 'Longe', curto: '≤ 50%' },
    { ate: Infinity, pontos: 0, nome: 'Divergiu', curto: '> 50%' },
  ];
  const erroRelativo = (palpite, resposta) => Math.abs(palpite - resposta) / Math.abs(resposta);
  const faixa = e => FAIXAS.find(f => e <= f.ate + 1e-12);
  const BONUS = { detetive: 30, injusticado: 20, raiz: 20 };

  // Uma rodada: palpites {id: número|null}, votos {votante: votado}. Devolve tudo o que a revelação mostra.
  function apurar({ jogadores, palpites, votos, resposta }) {
    const linhas = jogadores.map(j => {
      const g = palpites[j.id];
      const ok = Number.isFinite(g);
      const e = ok ? erroRelativo(g, resposta) : Infinity;
      return { id: j.id, nome: j.nome, palpite: ok ? g : null, erro: e, faixa: ok ? faixa(e) : null, pontos: ok ? faixa(e).pontos : 0, bonus: [], votos: 0 };
    });
    const by = Object.fromEntries(linhas.map(l => [l.id, l]));
    for (const [, alvo] of Object.entries(votos || {})) if (by[alvo]) by[alvo].votos++;
    const resp = linhas.filter(l => l.palpite !== null);
    const maxE = resp.length ? Math.max(...resp.map(l => l.erro)) : null, minE = resp.length ? Math.min(...resp.map(l => l.erro)) : null;
    const divergiram = resp.length > 1 ? resp.filter(l => l.erro === maxE && l.erro > minE).map(l => l.id) : [];
    const raizes = resp.filter(l => l.erro === minE && l.erro <= 0.5).map(l => l.id);
    const maxV = Math.max(0, ...linhas.map(l => l.votos));
    const maisVotados = maxV > 0 ? linhas.filter(l => l.votos === maxV).map(l => l.id) : [];
    for (const [votante, alvo] of Object.entries(votos || {})) if (by[votante] && divergiram.includes(alvo)) { by[votante].pontos += BONUS.detetive; by[votante].bonus.push(['detetive', BONUS.detetive]); }
    for (const id of maisVotados) if (!divergiram.includes(id) && by[id].palpite !== null) { by[id].pontos += BONUS.injusticado; by[id].bonus.push(['injusticado', BONUS.injusticado]); }
    for (const id of raizes) { by[id].pontos += BONUS.raiz; by[id].bonus.push(['raiz', BONUS.raiz]); }
    const acertouTurma = maisVotados.some(id => divergiram.includes(id));
    return { linhas, divergiram, raizes, maisVotados, acertouTurma, resposta };
  }

  global.QDPerguntas = { TODAS, TEMAS, FAIXAS, BONUS, resolver, sortear, apurar, erroRelativo, faixa, fmt, lerNumero, rng,
    // expostos para os testes conferirem contra o motor do site
    _metodos: { passosBissecao, raizBissecao, passosFalsa, passosNewton, passosSecante, gauss, seidel, jacobi, residuo } };
})(typeof window !== 'undefined' ? window : globalThis);
