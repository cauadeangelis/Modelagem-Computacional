/* Numera Academy v14 — Caça ao Bug Numérico (auditoria reversa).
   O "estagiário distraído" preencheu uma tabela de iterações e errou UMA célula; o jogador clica nela.
   Cada gerador monta a tabela certa e a sabotada (exatamente uma célula diferente) com um erro típico das provas:
   metade errada na Bisseção (olhou o sinal de xₖ), ponto médio sem o a, Jacobi no lugar de Seidel, termo
   independente esquecido no Gauss, erro absoluto no lugar do relativo, sinal trocado no Newton, ponto médio na
   Falsa Posição e peso errado nos Trapézios. Usado pelo Relâmpago (site) e pelas casas vermelhas da Calculândia.
   Script clássico, sem dependências: window.NumeraCacaBug = { TIPOS, gerar, sortear }. */
(function (global) {
  'use strict';
  const F = (v, c = 4) => { if (typeof v === 'string') return v; let r = Number(v.toFixed(c)); if (Object.is(r, -0)) r = 0; return String(r).replace('.', ',').replace('-', '−'); };
  const sub = n => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c] || c).join('');
  function rng(semente) { let h = (semente >>> 0) || 1; return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const FUNS = [
    { t: 'f(x) = x³ − x − 2', f: x => x ** 3 - x - 2, df: x => 3 * x * x - 1, a: 1, b: 2, x0: 2 },
    { t: 'f(x) = x² − 3', f: x => x * x - 3, df: x => 2 * x, a: 1, b: 2, x0: 2 },
    { t: 'f(x) = x³ − 9x + 3', f: x => x ** 3 - 9 * x + 3, df: x => 3 * x * x - 9, a: 0, b: 1, x0: 0 },
    { t: 'f(x) = eˣ − 3x', f: x => Math.exp(x) - 3 * x, df: x => Math.exp(x) - 3, a: 1, b: 2, x0: 2 },
    { t: 'f(x) = cos x − x', f: x => Math.cos(x) - x, df: x => -Math.sin(x) - 1, a: 0, b: 1, x0: 1 },
  ];
  // monta o resultado com a tabela certa e a sabotada (uma célula)
  function pronto(o, certa, linha, coluna, valorErrado) {
    const sabotada = certa.map(r => r.slice()); sabotada[linha][coluna] = valorErrado;
    return { ...o, linhas: sabotada, certa, bug: { linha, coluna } };
  }
  const GERADORES = {
    // Bisseção: na coluna "fica", a metade escolhida pelo sinal de xₖ (e não de f(xₖ))
    'bis-metade'(r) {
      const q = pick(r, FUNS), f = q.f; let a = q.a, b = q.b; const lin = [];
      for (let k = 1; k <= 3; k++) { const x = (a + b) / 2, fx = f(x), esq = f(a) * fx < 0; lin.push([String(k), F(a), F(b), F(x), F(fx), esq ? 'esquerda: [aₖ; xₖ]' : 'direita: [xₖ; bₖ]']); if (esq) b = x; else a = x; }
      const l = 1, certo = lin[l][5], errado = certo.startsWith('esquerda') ? 'direita: [xₖ; bₖ]' : 'esquerda: [aₖ; xₖ]';
      return pronto({ tipo: 'bis-metade', metodo: 'bissecao', titulo: `Bisseção em ${q.t}, [${F(q.a, 2)}; ${F(q.b, 2)}]`, colunas: ['k', 'aₖ', 'bₖ', 'xₖ', 'f(xₖ)', 'metade que fica'],
        dica: 'Fica a metade em que f troca de sinal: confira o sinal de f(aₖ)·f(xₖ).', explicacao: `Na linha 2, f(aₖ)·f(xₖ) ${certo.startsWith('esquerda') ? '< 0' : '> 0'}: a metade certa é a ${certo.split(':')[0]}. O estagiário olhou o sinal de xₖ, não o de f(xₖ).` }, lin, l, 5, errado);
    },
    // Bisseção: ponto médio calculado como (b − a)/2
    'bis-medio'(r) {
      const q = pick(r, FUNS), f = q.f; let a = q.a, b = q.b; const lin = [];
      for (let k = 1; k <= 3; k++) { const x = (a + b) / 2, fx = f(x); lin.push([String(k), F(a), F(b), F(x), F(fx)]); if (f(a) * fx < 0) b = x; else a = x; }
      const l = 2, A = Number(lin[l][1].replace(',', '.').replace('−', '-')), B = Number(lin[l][2].replace(',', '.').replace('−', '-'));
      return pronto({ tipo: 'bis-medio', metodo: 'bissecao', titulo: `Bisseção em ${q.t}, [${F(q.a, 2)}; ${F(q.b, 2)}]`, colunas: ['k', 'aₖ', 'bₖ', 'xₖ', 'f(xₖ)'],
        dica: 'xₖ = (aₖ + bₖ)/2: o ponto médio soma as pontas.', explicacao: `Na linha 3, xₖ = (aₖ + bₖ)/2 = ${lin[l][3]}. O estagiário fez (bₖ − aₖ)/2, que é a meia largura, não o ponto médio.` }, lin, l, 3, F((B - A) / 2));
    },
    // Gauss-Seidel: x₂ da 1ª iteração com o x₁ antigo (isso é Jacobi)
    'seidel-velho'(r) {
      const S = pick(r, [{ A: [[10, 2, 1], [1, 5, 1], [2, 3, 10]], b: [7, -8, 6] }, { A: [[4, 1, 1], [1, 5, 2], [1, 1, 6]], b: [6, 8, 8] }, { A: [[5, 1, 1], [1, 4, 1], [2, 1, 6]], b: [7, 6, 9] }]);
      const n = 3, x = [0, 0, 0], lin = [];
      let xj2 = null;
      for (let k = 1; k <= 2; k++) { const velho = x.slice(); for (let i = 0; i < n; i++) { let t = S.b[i]; for (let j = 0; j < n; j++) if (j !== i) t -= S.A[i][j] * x[j]; if (k === 1 && i === 1) { let u = S.b[i]; for (let j = 0; j < n; j++) if (j !== i) u -= S.A[i][j] * velho[j]; xj2 = u / S.A[i][i]; } x[i] = t / S.A[i][i]; } lin.push([String(k), F(x[0]), F(x[1]), F(x[2])]); }
      const sis = S.A.map((row, i) => row.map((c, j) => `${c < 0 ? '− ' : j ? '+ ' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}x${sub(j + 1)}`).join(' ') + ` = ${F(S.b[i], 0)}`).join('; ');
      return pronto({ tipo: 'seidel-velho', metodo: 'seidel', titulo: `Gauss-Seidel em ${sis}, X⁽⁰⁾ = (0; 0; 0)`, colunas: ['k', 'x₁', 'x₂', 'x₃'],
        dica: 'No Gauss-Seidel, o x₂ da iteração k já usa o x₁ da mesma iteração.', explicacao: `Na 1ª iteração, x₂⁽¹⁾ precisa do x₁⁽¹⁾ = ${lin[0][1]}, recém-calculado. O estagiário usou x₁⁽⁰⁾ = 0: isso é Jacobi.` }, lin, 0, 2, F(xj2));
    },
    // Gauss: na etapa 1, o termo independente da linha 2 não foi atualizado
    'gauss-b'(r) {
      const S = pick(r, [{ A: [[2, 1, -1], [4, 3, 1], [-2, 1, 3]], b: [3, 11, 5] }, { A: [[1, 2, 1], [3, 8, 1], [2, 5, 4]], b: [4, 12, 11] }, { A: [[2, 4, -2], [1, 5, 3], [3, 4, 2]], b: [2, 9, 11] }]);
      const M = S.A.map((row, i) => [...row, S.b[i]]), lin = [];
      const m2 = M[1][0] / M[0][0], m3 = M[2][0] / M[0][0], E2 = M[1].map((v, j) => v - m2 * M[0][j]), E3 = M[2].map((v, j) => v - m3 * M[0][j]);
      [M[0], E2, E3].forEach((row, i) => lin.push([`E${sub(i + 1)}⁽¹⁾`, ...row.map(v => F(v, 3))]));
      return pronto({ tipo: 'gauss-b', metodo: 'gauss', titulo: `Etapa 1 da Eliminação de Gauss em [A|B] = [${M.map(rr => rr.slice(0, 3).map(v => F(v, 3)).join(' ') + ' | ' + F(rr[3], 3)).join('; ')}]`, colunas: ['linha', 'aᵢ₁', 'aᵢ₂', 'aᵢ₃', 'bᵢ'],
        dica: 'Eᵢ ← Eᵢ − mᵢ₁·E₁ vale para a linha inteira, inclusive o termo independente.', explicacao: `Com m₂₁ = ${F(m2, 3)}, b₂ vira ${F(S.b[1], 3)} − ${F(m2, 3)}·${F(S.b[0], 3)} = ${F(E2[3], 3)}. O estagiário esqueceu de atualizar o b₂.` }, lin, 1, 4, F(S.b[1], 3));
    },
    // Newton: erro absoluto |Δx| no lugar do relativo |Δx/x| (raiz perto de 10, então a diferença aparece)
    'erro-absoluto'(r) {
      const c = pick(r, [110, 120, 95, 130]), f = x => x * x - c, df = x => 2 * x; let x = pick(r, [10, 11, 12]); const lin = [];
      for (let k = 1; k <= 3; k++) { const nx = x - f(x) / df(x); lin.push([String(k), F(x, 6), F(nx, 6), F(Math.abs((nx - x) / nx), 6)]); x = nx; }
      const l = 1, ab = Math.abs(Number(lin[l][2].replace(',', '.')) - Number(lin[l][1].replace(',', '.')));
      return pronto({ tipo: 'erro-absoluto', metodo: 'newton', titulo: `Newton-Raphson em f(x) = x² − ${c}, com εₐ = |(xₖ₊₁ − xₖ)/xₖ₊₁|`, colunas: ['k', 'xₖ', 'xₖ₊₁', 'εₐ'],
        dica: 'O enunciado pede o erro RELATIVO: divida a diferença por |xₖ₊₁|.', explicacao: `Na linha 2, εₐ = |${lin[l][2]} − ${lin[l][1]}| / ${lin[l][2]} = ${lin[l][3]}. O estagiário parou na diferença absoluta ${F(ab, 6)}, sem dividir por xₖ₊₁.` }, lin, l, 3, F(ab, 6));
    },
    // Newton: sinal trocado (x + f/f′)
    'newton-sinal'(r) {
      const q = pick(r, FUNS.filter(u => Math.abs(u.df(u.x0)) > 0.5)); let x = q.x0; const lin = [];
      for (let k = 0; k < 3; k++) { const fx = q.f(x), d = q.df(x), nx = x - fx / d; lin.push([String(k), F(x), F(fx), F(d), F(nx)]); x = nx; }
      const l = 1, xe = Number(lin[l][1].replace(',', '.').replace('−', '-')), fe = q.f(xe), de = q.df(xe);
      return pronto({ tipo: 'newton-sinal', metodo: 'newton', titulo: `Newton-Raphson em ${q.t}, x₀ = ${F(q.x0, 2)}`, colunas: ['k', 'xₖ', 'f(xₖ)', 'f′(xₖ)', 'xₖ₊₁'],
        dica: 'xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ): o passo é subtraído.', explicacao: `Na linha 2, xₖ₊₁ = ${lin[l][1]} − (${lin[l][2]})/(${lin[l][3]}) = ${lin[l][4]}. O estagiário somou f/f′ em vez de subtrair.` }, lin, l, 4, F(xe + fe / de));
    },
    // Falsa Posição: ponto médio no lugar da média ponderada
    'fp-medio'(r) {
      const q = pick(r, FUNS), f = q.f; let a = q.a, b = q.b; const lin = [];
      for (let k = 1; k <= 3; k++) { const x = (a * f(b) - b * f(a)) / (f(b) - f(a)), fx = f(x); lin.push([String(k), F(a), F(b), F(x), F(fx)]); if (f(a) * fx < 0) b = x; else a = x; }
      const l = 1, A = Number(lin[l][1].replace(',', '.').replace('−', '-')), B = Number(lin[l][2].replace(',', '.').replace('−', '-'));
      return pronto({ tipo: 'fp-medio', metodo: 'falsaPosicao', titulo: `Falsa Posição em ${q.t}, [${F(q.a, 2)}; ${F(q.b, 2)}]`, colunas: ['k', 'aₖ', 'bₖ', 'xₖ', 'f(xₖ)'],
        dica: 'Falsa Posição: x = (a·f(b) − b·f(a))/(f(b) − f(a)), não o ponto médio.', explicacao: `Na linha 2, x = (a·f(b) − b·f(a))/(f(b) − f(a)) = ${lin[l][3]}. O estagiário usou (a + b)/2, que é a Bisseção.` }, lin, l, 3, F((A + B) / 2));
    },
    // Trapézios: peso 1 num ponto interno (o certo é 2)
    'trap-peso'(r) {
      const q = pick(r, [{ t: 'f(x) = x²', f: x => x * x, a: 0, b: 2 }, { t: 'f(x) = eˣ', f: Math.exp, a: 0, b: 1 }, { t: 'f(x) = 1/(1 + x)', f: x => 1 / (1 + x), a: 0, b: 1 }]), n = 4, h = (q.b - q.a) / n, lin = [];
      for (let i = 0; i <= n; i++) { const x = q.a + i * h, w = i === 0 || i === n ? 1 : 2; lin.push([String(i), F(x), F(q.f(x)), String(w), F(w * q.f(x))]); }
      const l = 2;
      return pronto({ tipo: 'trap-peso', metodo: 'trapezio', titulo: `Regra dos trapézios para ∫ ${q.t} dx de ${F(q.a, 0)} a ${F(q.b, 0)}, n = 4`, colunas: ['i', 'xᵢ', 'f(xᵢ)', 'peso', 'peso·f(xᵢ)'],
        dica: 'I ≈ (h/2)·[f₀ + 2(f₁ + … + fₙ₋₁) + fₙ]: os pontos internos levam peso 2.', explicacao: 'O ponto x₂ é interno: entra em dois trapézios e leva peso 2. O estagiário pôs peso 1.' }, lin, l, 3, '1');
    },
  };
  const TIPOS = Object.keys(GERADORES);
  function gerar(tipo, semente = 1) { const r = rng(semente), g = GERADORES[tipo] || GERADORES[TIPOS[0]]; const o = g(r); o.semente = semente; return o; }
  function sortear(semente = Date.now(), metodos = null) { const r = rng(semente), pool = metodos ? TIPOS.filter(t => metodos.includes(gerar(t, 1).metodo)) : TIPOS; return gerar(pool[Math.floor(r() * pool.length)] || TIPOS[0], Math.floor(r() * 1e9)); }
  global.NumeraCacaBug = { TIPOS, gerar, sortear };
})(typeof window !== 'undefined' ? window : globalThis);
