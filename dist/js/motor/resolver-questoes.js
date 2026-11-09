/* Numera Academy — resolve as questões do banco (banco-de-questoes/questoes.sql) a partir dos parâmetros.
   Cada questão guarda, na coluna "parametros", o que é preciso para refazer a conta: o método (calc) e os dados.
   O site usa este arquivo para mostrar a resolução passo a passo; os testes (tests/banco) usam para conferir
   o gabarito de cada questão. Depende de motor-numerico.js e passo-a-passo.js. */
(function (global) {
  'use strict';
  const M = global.NumeraMath, P = global.NumeraPassos;
  const err = (m) => { throw new Error(m); };
  const F = (v, c) => P.fmt(v, c);
  const vet = (v, c) => '(' + v.map((x) => F(x, c)).join('; ') + ')';
  const exprXY = (src) => { const g = M.parseExpression(src, ['x', 'y']); return (x, y) => g({ x, y }); };

  /* ---------- Ponto flutuante: cada operando e cada resultado passam por fl() ---------- */
  function flAvaliar(e, cfg, passos) {
    const fl = (v) => P.fl(v, cfg).valor;
    if (typeof e === 'number') return fl(e);
    const [op, ...args] = e;
    if (op === 'soma') { let s = flAvaliar(args[0], cfg, passos); for (let i = 1; i < args.length; i++) { const v = flAvaliar(args[i], cfg, passos), r = fl(s + v); passos.push(`fl(${F(s)} + ${F(v)}) = ${F(r)}`); s = r; } return s; }
    const a = flAvaliar(args[0], cfg, passos), b = flAvaliar(args[1], cfg, passos);
    const exato = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b, r = fl(exato);
    passos.push(`fl(${F(a)} ${op === '*' ? '×' : op === '-' ? '−' : op} ${F(b)}) = fl(${F(exato)}) = ${F(r)}`);
    return r;
  }
  const notacao = (v, t, cfg) => (v === 0 ? '0' : P.notacaoFl(P.fl(v, Object.assign({}, cfg, { t })), t));

  /* ---------- Mínimos quadrados ---------- */
  function ajuste(p) {
    const xs = p.xs, ys = p.ys;
    if (p.base === 'exp' || p.base === 'pot10') {
      const L = p.base === 'exp' ? Math.log : Math.log10, c = P.minimosQuadrados(xs, ys.map(L), P.BASES.reta);
      const a = p.base === 'exp' ? Math.exp(c[0]) : Math.pow(10, c[0]), b = c[1];
      const g = p.base === 'exp' ? (x) => a * Math.exp(b * x) : (x) => a * Math.pow(10, b * x);
      const inv = p.base === 'exp' ? (y) => Math.log(y / a) / b : (y) => Math.log10(y / a) / b;
      return { coef: [a, b], g, inv, texto: p.base === 'exp' ? `g(t) = ${F(a, 3)}·e^(${F(b, 3)}t)` : `y = ${F(a, 3)}·10^(${F(b, 3)}x)` };
    }
    const bases = P.BASES[p.base] || err('Base de ajuste desconhecida: ' + p.base);
    const c = P.minimosQuadrados(xs, ys, bases), g = (x) => bases.reduce((s, f, i) => s + c[i] * f(x), 0);
    const nomes = { reta: ['', 'x'], parabola: ['', 'x', 'x²'], 'a+bx2': ['', 'x²'], 'a+bx3': ['', 'x³'], 'ax+bcos': ['x', 'cos x'], 'a+bv2': ['', 'V²'] }[p.base];
    const texto = 'g(x) = ' + c.map((v, i) => `${i && v >= 0 ? '+ ' : i ? '− ' : ''}${F(i ? Math.abs(v) : v, 4)}${nomes[i] ? '·' + nomes[i] : ''}`).join(' ');
    // x* com g(x*) = y: bissecção dentro de uma faixa que contenha a raiz (a faixa dos dados, ampliada)
    const inv = (y) => { const lo = p.faixa ? p.faixa[0] : Math.min(...xs), hi = p.faixa ? p.faixa[1] : Math.max(...xs) * 2 - Math.min(...xs); const h = (x) => g(x) - y; let a = lo, b = hi; const N = 400; let A = a; for (let i = 1; i <= N; i++) { const B = lo + (hi - lo) * i / N; if (h(A) === 0) return A; if (h(A) * h(B) < 0) { a = A; b = B; break; } A = B; } for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (h(a) * h(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
    return { coef: c, g, inv, texto };
  }

  /* ---------- Integração numérica ---------- */
  const REGRAS = { trapezios: P.trapezios, simpson13: P.simpson13, simpson38: P.simpson38, retangulos: P.retangulos };
  const NOMES_REGRA = { trapezios: 'regra dos trapézios', simpson13: 'regra de Simpson (1/3)', simpson38: 'regra de Simpson 3/8', retangulos: 'regra dos retângulos (ponto médio)' };
  function integrar(p) {
    const regra = REGRAS[p.regra] || err('Regra desconhecida: ' + p.regra);
    if (p.xs) return regra({ xs: p.xs, ys: p.ys });
    const f = p.f0 !== undefined ? ((g) => (x) => (x === 0 ? p.f0 : g(x)))(P.fn(p.f)) : P.fn(p.f);
    const n = p.n || (p.pontos ? p.pontos - 1 : err('Informe n ou o número de pontos.'));
    return regra({ f, a: p.a, b: p.b, n });
  }
  // Valor "correto" quando a questão não dá: Simpson com 20 000 subintervalos.
  const exatoNumerico = (p) => P.simpson13({ f: P.fn(p.f), a: p.a, b: p.b, n: 20000 });

  /* ---------- Dispatcher ---------- */
  function resolver(p) {
    if (!p || !p.calc) err('Questão sem parâmetros de cálculo.');
    const c = p.calc;
    // Raízes de funções (formato dos slides)
    if (['bissecao', 'falsaPosicao', 'newton', 'secante', 'pontoFixo'].includes(c)) {
      const r = P[c](Object.assign({ criterio: 'relativo' }, p));
      const t = P.tabela(r, p.casas != null ? Math.max(p.casas, 4) : 6);
      return { valor: r.raiz, tabela: t, resumo: `${r.metodo}: ${r.inicio > 1 ? `da ${r.inicio}ª à ${r.inicio + r.iteracoes - 1}ª iteração` : `${r.iteracoes} ${r.iteracoes === 1 ? 'iteração' : 'iterações'}`}; x = ${F(r.raiz, p.casas != null ? p.casas : 6)}. ${r.parada}`, run: r };
    }
    if (c === 'iteracoesBissecao') { const k = P.iteracoesBissecao(p.a, p.b, p.eps); return { valor: k.k, resumo: `k > (log(${F(p.b - p.a)}) − log(${F(p.eps)}))/log 2 = ${F(k.limite, 4)}, então k = ${k.k}.` }; }
    if (c === 'gauss') { const g = P.gauss(p); return { vetor: g.solucao, resumo: `Solução: X* = ${vet(g.solucao, p.casas)}. ` + g.substituicao.map((s) => s.texto).join('; '), gauss: g }; }
    if (c === 'gauss-eg-egpp') {
      const cfg = { A: p.A, b: p.b, t: p.t }, eg = P.gauss(Object.assign({ pivoteamento: 'nenhum' }, cfg)).solucao, pp = P.gauss(Object.assign({ pivoteamento: 'parcial' }, cfg)).solucao;
      return { vetor: eg.concat(pp), texto: `EG = ${vet(eg, 4)}, EGPP = ${vet(pp, 4)}`, resumo: `Com ${p.t} dígitos na mantissa: sem pivoteamento, EG = ${vet(eg, 4)}; com pivoteamento parcial (troca para o maior |aᵢ₁|), EGPP = ${vet(pp, 4)}.` };
    }
    if (c === 'gauss-trocas') { const g = P.gauss({ A: p.A, b: p.b || p.A.map(() => 0), pivoteamento: 'parcial' }), trocas = g.etapas.filter((e) => e.troca).map((e) => e.k); return { vetor: trocas, texto: trocas.length ? trocas.map((k) => `${k}º pivô`).join(', ') : 'nenhuma troca', resumo: g.etapas.filter((e) => e.k).map((e) => `Etapa ${e.k}: ${e.troca ? e.motivoTroca || 'troca de linhas' : 'o maior |aᵢₖ| já está na equação pivô, sem troca'}`).join('; ') + '.' }; }
    if (c === 'gauss-multiplicador') { const a = p.A, m = a[p.i - 1][p.k - 1] / a[p.k - 1][p.k - 1]; return { valor: m, resumo: `m${P.sub(String(p.i) + p.k)} = a${P.sub(String(p.i) + p.k)}/a${P.sub(String(p.k) + p.k)} = ${F(a[p.i - 1][p.k - 1])}/${F(a[p.k - 1][p.k - 1])} = ${F(m, 4)}.` }; }
    if (c === 'gauss-etapa') { const g = P.gauss(p), e = g.etapas[p.etapa || 1]; return { matriz: e.matriz, resumo: e.operacoes.join('; '), gauss: g }; }
    if (c === 'lu') { const r = P.lu(p.A); return { matriz: { L: r.L, U: r.U }, resumo: `L guarda os multiplicadores; U é a matriz triangular superior da eliminação. det(A) = ${F(r.det)}.` }; }
    if (c === 'lu-sistema') { const A = P.multiplica(p.L, p.U); return { matriz: { A, b: p.b }, resumo: 'A = L·U (multiplique as matrizes) e o lado direito é o próprio B.' }; }
    if (c === 'det-lu') { const d = p.U.reduce((s, r, i) => s * r[i], 1) * p.L.reduce((s, r, i) => s * r[i], 1); return { valor: d, resumo: `det(B) = det(L)·det(U) = 1 · (${p.U.map((r, i) => F(r[i])).join(' · ')}) = ${F(d)}.` }; }
    if (c === 'cholesky') { const r = P.cholesky(p.A); return { matriz: { G: r.G }, resumo: 'A = G·Gᵀ com G triangular inferior: gⱼⱼ = √(aⱼⱼ − Σgⱼₖ²) e gᵢⱼ = (aᵢⱼ − Σgᵢₖgⱼₖ)/gⱼⱼ.' }; }
    if (c === 'cholesky-sistema') { const r = P.cholesky(p.A), Gt = r.G[0].map((_, j) => r.G.map((row) => row[j])), s = P.resolverLU(r.G, Gt, p.b); return { vetor: s.x, resumo: `G·y = b dá y = ${vet(s.y, 6)}; Gᵀ·x = y dá x = ${vet(s.x, 6)}.` }; }
    if (c === 'cholesky-M') { const R = p.R, Rt = R[0].map((_, j) => R.map((row) => row[j])), Mx = P.multiplica(Rt, R); return { matriz: { M: Mx }, resumo: 'M = Rᵀ·R (a transposta da triangular superior vezes ela mesma).' }; }
    if (c === 'cholesky-det') { const T = p.G || p.R, d = Math.pow(T.reduce((s, r, i) => s * r[i], 1), 2); return { valor: d, resumo: `det M = (produto da diagonal)² = (${T.map((r, i) => F(r[i])).join('·')})² = ${F(d)}.` }; }
    if (c === 'cholesky-x') { const outros = p.diag.reduce((s, v) => s * v, 1), x = Math.sqrt(p.det) / Math.abs(outros); return { valor: x, resumo: `det M = (${p.diag.map((v) => F(v)).join('·')}·x)² = ${F(p.det)} ⇒ |x| = ${F(x)}.` }; }
    if (c === 'jacobi' || c === 'seidel') { const r = P[c](p); if (p.componente) { const v = r.solucao[p.componente - 1]; return { valor: v, tabela: P.tabela(r, p.casas || 5), resumo: `${r.metodo}: x${P.sub(String(p.componente))}${P.sup('(' + r.iteracoes + ')')} = ${F(v, p.casas || 5)}.`, run: r }; } return { vetor: r.solucao, tabela: P.tabela(r, p.casas || 5), resumo: `${r.metodo}: X⁽${r.iteracoes}⁾ = ${vet(r.solucao, p.casas || 5)}.`, run: r }; }
    if (c === 'erro-vetor') { const e = P.erroRelativoVetor(p.novo, p.velho), v = p.percentual ? e * 100 : e; return { valor: v, resumo: `d = máx|Δx| / máx|x| = ${F(Math.max(...p.novo.map((x, i) => Math.abs(x - p.velho[i]))), 5)} / ${F(Math.max(...p.novo.map(Math.abs)), 5)} = ${F(e, 4)}${p.percentual ? ` = ${F(v, 2)}%` : ''}.` }; }
    if (c === 'sassenfeld') { const r = P.sassenfeld(p.A); if (p.indice) return { valor: r.betas[p.indice - 1], resumo: `β${P.sub(String(p.indice))} = ${F(r.betas[p.indice - 1], 4)} (β = (${r.betas.map((b) => F(b, 4)).join('; ')})).` }; return { valor: r.max, resumo: `β = (${r.betas.map((b) => F(b, 4)).join('; ')}); β = máx βᵢ = ${F(r.max, 4)}${r.converge ? ' < 1: converge' : ''}.` }; }
    if (c === 'criterio-linhas') { const r = P.criterioLinhas(p.A); return { valor: r.max, resumo: `α = (${r.alfas.map((a) => F(a, 4)).join('; ')}); máx α = ${F(r.max, 4)}.` }; }
    if (c === 'markov') { const n = p.M.length, A = p.M[0].map((_, j) => p.M.map((row, i) => row[j] - (i === j ? 1 : 0))); A[n - 1] = Array(n).fill(1); const b = Array(n).fill(0); b[n - 1] = 1; const g = P.gauss({ A, b, pivoteamento: 'parcial' }); return { vetor: g.solucao, resumo: `[a b c]·M = [a b c] vira (Mᵀ − I)·v = 0; trocando a última equação por a + b + c = 1 e resolvendo por Gauss: ${vet(g.solucao, 4)}.` }; }
    if (c === 'serie') {
      const x = p.x, termos = p.serie === 'cotg' ? [1 / x, -x / 3, -Math.pow(x, 3) / 45, -2 * Math.pow(x, 5) / 945] : [1 / x, x / 6, 7 * Math.pow(x, 3) / 360, 31 * Math.pow(x, 5) / 15120];
      const aprox = termos.reduce((s, v) => s + v, 0), e = Math.abs(aprox - p.exato) / Math.abs(p.exato) * 100;
      return { valor: e, resumo: `Soma dos quatro termos: ${F(aprox, 8)}. Erro relativo = |${F(aprox, 8)} − ${F(p.exato, 8)}| / ${F(p.exato, 8)} × 100% = ${F(e, 6)}%.` };
    }
    // Ponto flutuante
    if (c === 'fl') { const cfg = { t: p.t, m: p.m, M: p.M, modo: p.modo }, passos = [], v = flAvaliar(p.expr, cfg, passos); return { valor: v, texto: notacao(v, p.t, cfg), resumo: passos.join('; ') + `. Resultado: ${notacao(v, p.t, cfg)}.` }; }
    if (c === 'fl-erro') { const cfg = { t: p.t, modo: p.modo }, s1 = flAvaliar(p.s1, cfg, []), s2 = flAvaliar(p.s2, cfg, []), e = Math.abs(s2 - s1) / Math.abs(s2) * 100; return { valor: e, resumo: `S₁ = ${notacao(s1, p.t, cfg)} e S₂ = ${notacao(s2, p.t, cfg)}: ε = (S₂ − S₁)/S₂ = ${F(e, 4)}%.` }; }
    if (c === 'fl-limites') { const menor = Math.pow(10, p.m - 1), maior = (1 - Math.pow(10, -p.t)) * Math.pow(10, p.M); return { vetor: [menor, maior], resumo: `Menor: 0,${'1'.padEnd(p.t, '0')} × 10${P.sup(String(p.m))}; maior: 0,${'9'.repeat(p.t)} × 10${P.sup(String(p.M))}.` }; }
    if (c === 'fl-overflow-M') { const M_ = Math.round(Math.log10(p.limite / (1 - Math.pow(10, -p.t)))); return { valor: M_, resumo: `O maior número é 0,${'9'.repeat(p.t)} × 10ᴹ = ${F(p.limite)} ⇒ M = ${M_}.` }; }
    if (c === 'fl-underflow-m') { const m_ = Math.round(Math.log10(p.limite)) + 1; return { valor: m_, resumo: `O menor positivo é 0,${'1'.padEnd(p.t, '0')} × 10ᵐ = 10ᵐ⁻¹ = ${F(p.limite)} ⇒ m = ${m_}.` }; }
    // Interpolação
    if (c === 'interp-linear') { const v = P.linear(p.xs, p.ys, p.x); return { valor: v, resumo: `Entre os dois pontos vizinhos de x = ${F(p.x)}: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = ${F(v, 4)}.` }; }
    if (c === 'interp-linear-erro') { const v = P.linear(p.xs, p.ys, p.x), e = Math.abs(v - p.exato) / Math.abs(p.exato) * 100; return { valor: e, resumo: `p₁(${F(p.x)}) = ${F(v, 4)}; erro relativo = |${F(v, 4)} − ${F(p.exato, 4)}| / ${F(p.exato, 4)} × 100% = ${F(e, 2)}%.` }; }
    if (c === 'interp-poli') { const xs = p.usar ? p.usar.map((i) => p.xs[i]) : p.xs, ys = p.usar ? p.usar.map((i) => p.ys[i]) : p.ys, v = P.lagrange(xs, ys, p.x); return { valor: v, resumo: `Polinômio de grau ${xs.length - 1} pelos pontos dados (Lagrange): p(${F(p.x, 5)}) = ${F(v, 5)}.` }; }
    if (c === 'interp-poli-coef') { const co = P.polinomio(p.xs, p.ys); return { vetor: co, resumo: 'p(x) = ' + co.map((v, i) => `${F(v, 4)}${i ? 'x' + (i > 1 ? P.sup(String(i)) : '') : ''}`).reverse().join(' + ').replace(/\+ −/g, '− ') + '.' }; }
    if (c === 'interp-inversa-linear') { const v = P.linearInversa(p.xs, p.ys, p.y); return { valor: v, resumo: `Interpolação linear invertida entre os pontos vizinhos de y = ${F(p.y)}: x* = ${F(v, 4)}.` }; }
    if (c === 'interp-inversa-lagrange') { const v = P.lagrange(p.ys, p.xs, p.y); return { valor: v, resumo: `Interpolação inversa: trocamos os papéis de x e y e passamos o polinômio de Lagrange pelos pontos (yᵢ; xᵢ). Em y = ${F(p.y)}: x* = ${F(v, 4)}.` }; }
    if (c === 'interp-inversa-poli') { const co = P.polinomio(p.xs, p.ys), v = P.raizDoPolinomio(co, p.y, Math.min(...p.xs), Math.max(...p.xs)); return { valor: v, resumo: `p(x) passa pelos ${p.xs.length} pontos; resolvendo p(x*) = ${F(p.y)} na faixa da tabela: x* = ${F(v, 4)}.` }; }
    if (c === 'interp-c') { const v = p.y0 - (-(p.x0 * p.x0) + 2 * p.x0); return { valor: v, resumo: `g(${F(p.x0)}) = ${F(p.y0)} ⇒ c = ${F(v)}.` }; }
    // Mínimos quadrados
    if (c === 'mq') {
      const a = ajuste(p), esc = p.escala || 1;
      if (p.x !== undefined) { const v = a.g(p.x) * esc; return { valor: v, vetor: a.coef, resumo: `${a.texto}; g(${F(p.x)}) = ${F(v, 4)}.` }; }
      if (p.y !== undefined) { const v = a.inv(p.y / esc); return { valor: v, vetor: a.coef, resumo: `${a.texto}; g(x*) = ${F(p.y)} ⇒ x* = ${F(v, 4)}.` }; }
      return { vetor: a.coef, resumo: a.texto + '.' };
    }
    // Integração
    if (c === 'integral') { const v = integrar(p) * (p.fator || 1); return { valor: v, resumo: `${NOMES_REGRA[p.regra]}${p.n ? ` com n = ${p.n}` : p.pontos ? ` com ${p.pontos} pontos` : ` com os ${p.xs.length} pontos da tabela`}: I ≈ ${F(v, p.casas || 5)}.` }; }
    if (c === 'integral-erro') { const v = integrar(p), ex = p.exato !== undefined ? p.exato : exatoNumerico(p), e = Math.abs(v - ex) / Math.abs(ex) * 100; return { valor: e, resumo: `${NOMES_REGRA[p.regra]}: I ≈ ${F(v, 5)}; valor correto ${F(ex, 5)}; E_R = ${F(e, 2)}%.` }; }
    if (c === 'centro-gravidade') { const num = REGRAS[p.regra]({ xs: p.xs, ys: p.xs.map((x, i) => x * p.ys[i]) }), den = REGRAS[p.regra]({ xs: p.xs, ys: p.ys }), v = num / den; return { valor: v, resumo: `x̄ = ∫x·y dx / ∫y dx = ${F(num, 4)} / ${F(den, 4)} = ${F(v, 4)} (${NOMES_REGRA[p.regra]}).` }; }
    // EDO (PVI)
    if (c === 'euler' || c === 'taylor2') { const f = exprXY(p.f), r = P[c]({ f, x0: p.x0, y0: p.y0, h: p.h, xf: p.xf }); return { valor: r.y, resumo: `${c === 'euler' ? 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ)' : 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f)'}, h = ${F(p.h)}, ${r.linhas.length - 1} passos: y(${F(p.xf)}) ≈ ${F(r.y, 5)}.`, linhas: r.linhas }; }
    if (c === 'texto') return { resumo: p.resumo || '' };
    if (c === 'valor') return { valor: p.valor, resumo: p.resumo || '' };
    err('Tipo de cálculo desconhecido: ' + c);
  }

  // Confere um palpite numérico: aceita a tolerância da questão (metade da última casa pedida, com folga).
  function confere(q, palpite) { if (!Number.isFinite(palpite) || q.valor == null) return false; const tol = q.tolerancia != null ? q.tolerancia : Math.max(5 * Math.pow(10, -((q.casas != null ? q.casas : 4) + 1)) * 1.2, Math.abs(q.valor) * 1e-9); return Math.abs(palpite - q.valor) <= tol; }

  global.NumeraResolver = { resolver, confere, ajuste, integrar, flAvaliar, notacao };
})(typeof window !== 'undefined' ? window : globalThis);
