// Perguntas de múltipla escolha geradas para cada método (o quiz do protótipo).
// v14: servem de reserva para a tela de perguntas (pergunta.js) quando o banco de questões do site não tem
// pergunta do método (Spline cúbica, Cancelamento, Overflow) ou não carregou. O simulador antigo
// (catalogo-de-fases.js, sessao.js e tela-da-questao.js) continua no botão 🧪 Laboratório das casas.
import { fmt, iv, opcoes, R, ri, pickOne, nz } from './numeros.js';
import { shuffle } from '../utilitarios/matematica.js';

const f6 = (v) => fmt(v, 6);
const f9 = (v) => fmt(v, 9);

// ------------------------------------------------------------------ Módulo 0
function digitsNumber(k) {
  const int = ri(1, 9);
  const d = Array.from({ length: 7 }, () => ri(0, 9));
  d[k] = ri(5, 9); // o dígito seguinte força truncar ≠ arredondar
  return { int, d, x: Number(`${int}.${d.join('')}`), str: `${int},${d.join('')}` };
}
function truncStr(n, k) { return `${n.int},${n.d.slice(0, k).join('')}`; }
function roundStr(n, k) {
  let N = BigInt(n.int) * 10n ** BigInt(k) + BigInt(n.d.slice(0, k).join('') || '0');
  if (n.d[k] >= 5) N += 1n;
  const s = N.toString().padStart(k + 1, '0');
  return `${s.slice(0, s.length - k)},${s.slice(s.length - k)}`;
}
const toNum = (s) => Number(s.replace(',', '.'));

const M0 = {
  truncamento(nivel) {
    const passos = [];
    const T1 = (n, k) => ({
      enunciado: `x = ${n.str}`, texto: `Truncar x para ${k} casas decimais dá:`,
      ...opcoes(truncStr(n, k), [roundStr(n, k), truncStr(n, k - 1), truncStr(n, k + 1)]),
      explica: `Truncar só joga fora o que sobra: ${truncStr(n, k)}.`, vis: { type: 'digitos', n, k, modo: 'truncar' },
    });
    const T2 = (n, k) => ({
      enunciado: `x = ${n.str}`, texto: `Arredondar x para ${k} casas decimais dá:`,
      ...opcoes(roundStr(n, k), [truncStr(n, k), roundStr(n, k + 1), truncStr(n, k - 1)]),
      explica: `O dígito seguinte é ${n.d[k]} ≥ 5, então sobe: ${roundStr(n, k)}.`, vis: { type: 'digitos', n, k, modo: 'arredondar' },
    });
    const T3 = (n, k) => {
      const e = n.x - toNum(truncStr(n, k));
      return {
        enunciado: `x = ${n.str}`, texto: `Qual é o erro absoluto |x − x̃| ao truncar x com ${k} casas?`,
        ...opcoes(e, [Math.abs(n.x - toNum(roundStr(n, k))), 10 ** -k, 0.5 * 10 ** -k], f6),
        explica: `|${n.str} − ${truncStr(n, k)}| = ${f6(e)}.`, vis: { type: 'digitos', n, k, modo: 'truncar' },
      };
    };
    const T4 = () => ({
      enunciado: '100 leituras de balança, todas guardadas com 1 casa decimal.', texto: 'Qual método acumula viés ≈ 0,05 (sempre para o mesmo lado)?',
      ...opcoes('Truncar', ['Arredondar', 'Nenhum dos dois', 'Os dois igualmente']),
      explica: 'Truncar erra sempre para baixo (em positivos): viés ≈ 0,05. Arredondar fica ≈ 0,003.', vis: { type: 'texto', html: 'truncar: erro ∈ [0; 0,1) → média 0,05<br>arredondar: erro ∈ [−0,05; 0,05) → média ≈ 0' }, erro: 'erro_generico',
    });
    const T5 = (k) => ({
      enunciado: `Arredondamento para ${k} casas decimais.`, texto: 'Qual é o maior erro absoluto possível?',
      ...opcoes(`0,5·10⁻${'⁰¹²³⁴⁵'[k]}`, [`10⁻${'⁰¹²³⁴⁵'[k]}`, `5·10⁻${'⁰¹²³⁴⁵'[k]}`, `0,1·10⁻${'⁰¹²³⁴⁵'[k]}`]),
      explica: 'Arredondar erra no máximo meia unidade da última casa.', vis: { type: 'texto', html: `|x − x̃| ≤ 0,5·10⁻ᵏ` },
    });
    const k = ri(2, 3);
    const n1 = digitsNumber(k), n2 = digitsNumber(k);
    if (nivel === 'F') passos.push(T1(n1, k), T2(n1, k), T1(n2, k + 1 > 4 ? 2 : k));
    else if (nivel === 'M') passos.push(T1(n1, k), T2(n1, k), T3(n1, k), T5(k));
    else passos.push(T1(n1, k), T2(n2, k), T3(n2, k), T4(), T5(k));
    return { passos, erroFinal: 0.5 * 10 ** -k };
  },

  cancelamento(nivel) {
    const b = nivel === 'D' ? 10000 : 1000;
    const disc = Math.sqrt(b * b - 4);
    const x1 = (b + disc) / 2, x2 = 1 / x1;
    const en = `x² − ${b}x + 1 = 0 (a = 1, b = −${b}, c = 1)`;
    const s4 = String(b); // com 4 algarismos, √(b² − 4) arredonda para b
    const S1 = { enunciado: en, texto: 'A raiz grande x₁ = (b + √(b² − 4))/2 vale aproximadamente:', ...opcoes(x1, [b, b / 2, x2, b + 1 / b], f6), explica: `x₁ ≈ ${f6(x1)} (quase ${b}).`, vis: { type: 'texto', html: 'x = (−b ± √(b² − 4ac)) / 2a' } };
    const S2a = { enunciado: en, texto: 'Com 4 algarismos significativos, quanto vale √(b² − 4)?', ...opcoes(s4, [f6(disc), String(b - 1), String(b + 1)]), explica: `√${b * b - 4} = ${f6(disc)}, que com 4 algarismos vira ${s4}.`, vis: { type: 'texto', html: `√(${b}² − 4) = ${f6(disc)}` } };
    const S2 = { enunciado: en, texto: 'Com 4 algarismos, a raiz pequena pela fórmula direta x₂ = (b − √(b² − 4))/2 dá:', ...opcoes('0', [fmt(2 / b), fmt(1 / b), '1']), explica: `${b} − ${s4} = 0: subtrair quase iguais apagou os dígitos bons!`, vis: { type: 'texto', html: `(${b} − ${s4}) / 2 = 0 😱` }, erro: 'cancelamento' };
    const S3 = { enunciado: en, texto: 'Qual fórmula evita o cancelamento na raiz pequena?', ...opcoes('x₂ = c ÷ (a·x₁)', ['x₂ = (b − √Δ) ÷ 2a', 'x₂ = x₁ − b', 'x₂ = √c']), explica: 'Como x₁·x₂ = c/a, a raiz pequena sai de c ÷ (a·x₁), sem subtrair valores próximos.', vis: { type: 'texto', html: 'x₁ · x₂ = c / a' } };
    const S4 = { enunciado: en, texto: 'Então x₂ = 1 ÷ x₁ vale:', ...opcoes(x2, [0, 1 / (2 * b), 1 / b + 1 / (b * b * 10)], f9), explica: `x₂ = 1/${f6(x1)} = ${f9(x2)}.`, vis: { type: 'texto', html: 'x₂ = c / (a·x₁)' } };
    const S5 = { enunciado: '1,23456 − 1,23449 = 0,00007', texto: 'Quantos algarismos significativos confiáveis sobram?', ...opcoes('1', ['2', '5', '6']), explica: 'Dos 6 algarismos, só sobra 1: o 7.', vis: { type: 'texto', html: '1,23456<br>−1,23449<br>= 0,00007' }, erro: 'cancelamento' };
    const passos = nivel === 'F' ? [S1, S2, S3] : nivel === 'M' ? [S1, S2a, S2, S3, S4] : [S1, S2a, S2, S3, S4, S5];
    return { passos, erroFinal: Math.abs(x2 - (b - disc) / 2) };
  },

  overflow(nivel) {
    const a = ri(20000, 30000), b = ri(32768 - a + 200, 32768 - a + 6000);
    const wrap = a + b - 65536;
    const [p, q, r] = pickOne([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
    const O1 = { enunciado: 'Inteiros de 16 bits com sinal.', texto: 'Qual é o maior valor que cabe?', ...opcoes('32767', ['32768', '65535', '65536']), explica: '2¹⁵ − 1 = 32767.', vis: { type: 'texto', html: '16 bits: −32768 … 32767' } };
    const O2 = { enunciado: `Inteiros de 16 bits com sinal: a = ${a}, b = ${b}.`, texto: 'Quanto a máquina devolve para a + b?', ...opcoes(wrap, [a + b, 32767, -32768], (v) => fmt(v, 0)), explica: `${a + b} não cabe: dá a volta e vira ${wrap} (= ${a + b} − 65536).`, vis: { type: 'texto', html: `${a} + ${b} = ${a + b} > 32767` }, erro: 'overflow' };
    const O3 = { enunciado: `Ponto flutuante (double): x = ${p}·10²⁰⁰. O maior double é ≈ 1,8·10³⁰⁸.`, texto: 'Quanto vale x²?', ...opcoes('∞ (overflow)', [`${p * p}·10⁴⁰⁰`, '0 (underflow)', `${p}·10²⁰⁰`]), explica: '10⁴⁰⁰ passa do limite: estoura antes do resultado final.', vis: { type: 'texto', html: 'x² = 10⁴⁰⁰ > 1,8·10³⁰⁸' }, erro: 'overflow' };
    const O4 = { enunciado: `x = ${p}·10²⁰⁰ e y = ${q}·10²⁰⁰. Use m = max(|x|, |y|).`, texto: 'd = m·√((x/m)² + (y/m)²) dá:', ...opcoes(`${r}·10²⁰⁰`, [`${p + q}·10²⁰⁰`, '∞', `${r * r}·10⁴⁰⁰`]), explica: `m = ${q}·10²⁰⁰; (${p}/${q})² + 1 = ${fmt((p / q) ** 2 + 1)}; d = ${r}·10²⁰⁰. Sem estourar!`, vis: { type: 'texto', html: 'd = m · √((x/m)² + (y/m)²)' } };
    const O5 = { enunciado: `x = ${p}·10³⁰⁰ e y = ${q}·10³⁰⁰, m = ${q}·10³⁰⁰.`, texto: 'Quanto vale (x/m)² + (y/m)²?', ...opcoes((p / q) ** 2 + 1, [p * p + q * q, Infinity, 1]), explica: `(${p}/${q})² + 1 = ${fmt((p / q) ** 2 + 1)}: tudo fica perto de 1, nada estoura.`, vis: { type: 'texto', html: 'dividir pelo maior antes de elevar ao quadrado' } };
    const a2 = ri(25000, 32000), b2 = ri(32768 - a2 + 300, 32768 - a2 + 4000);
    const O2b = { ...O2, enunciado: `Inteiros de 16 bits com sinal: a = ${a2}, b = ${b2}.`, ...opcoes(a2 + b2 - 65536, [a2 + b2, 32767, -32768], (v) => fmt(v, 0)), explica: `${a2 + b2} − 65536 = ${a2 + b2 - 65536}.` };
    const passos = nivel === 'F' ? [O1, O2, O3] : nivel === 'M' ? [O1, O2, O3, O4] : [O2, O3, O4, O5, O2b];
    return { passos, erroFinal: 0 };
  },
};

// ------------------------------------------------------------------ Módulo 1
const FUNCS = {
  q2: { tex: 'x² − 2', f: (x) => x * x - 2, df: (x) => 2 * x, a: 1, b: 2 },
  q3: { tex: 'x² − 3', f: (x) => x * x - 3, df: (x) => 2 * x, a: 1, b: 2 },
  c1: { tex: 'x³ − x − 2', f: (x) => x ** 3 - x - 2, df: (x) => 3 * x * x - 1, a: 1, b: 2 },
  cos: { tex: 'cos(x) − x', f: (x) => Math.cos(x) - x, df: (x) => -Math.sin(x) - 1, a: 0, b: 1 },
  exp: { tex: 'eˣ − 3', f: (x) => Math.exp(x) - 3, df: (x) => Math.exp(x), a: 1, b: 2 },
  wal: { tex: 'x³ − 2x − 5', f: (x) => x ** 3 - 2 * x - 5, df: (x) => 3 * x * x - 2, a: 2, b: 3 },
};
const POOL = { F: ['q2', 'q3'], M: ['c1', 'cos', 'exp'], D: ['wal', 'c1', 'exp'] };
function rootOf(fn) { let a = fn.a, b = fn.b; for (let i = 0; i < 80; i++) { const c = (a + b) / 2; if (fn.f(a) * fn.f(c) <= 0) b = c; else a = c; } return (a + b) / 2; }
const plotFn = (fn, extra = {}) => ({ type: 'plot', f: fn.f, xmin: fn.a - 0.15 * (fn.b - fn.a), xmax: fn.b + 0.15 * (fn.b - fn.a), ...extra });

function bracketing(nivel, falsa) {
  const fn = FUNCS[pickOne(POOL[nivel])];
  const r = rootOf(fn);
  let a = fn.a, b = fn.b, c = a;
  const passos = [];
  const iters = nivel === 'F' ? 2 : 3;
  for (let k = 1; k <= iters; k++) {
    const fa = fn.f(a), fb = fn.f(b);
    c = falsa ? (a * fb - b * fa) / (fb - fa) : (a + b) / 2;
    const fc = fn.f(c);
    const en = `f(x) = ${fn.tex}. Intervalo [a; b] = ${iv(a, b)}, f(a) = ${fmt(fa)}, f(b) = ${fmt(fb)}.`;
    const marks = [{ x: a, label: 'a' }, { x: b, label: 'b' }];
    const chord = falsa ? [{ x1: a, y1: fa, x2: b, y2: fb, color: '#e8554a' }] : [];
    if (falsa) {
      passos.push({ enunciado: en, texto: `Iteração ${k}: onde a corda cruza o eixo? c = (a·f(b) − b·f(a)) / (f(b) − f(a))`, ...opcoes(c, [(a + b) / 2, (a * fa - b * fb) / (fa - fb), b - (fb * (b - a)) / (fb + fa), c + (b - a) * 0.15]), explica: `c = (${fmt(a)}·${fmt(fb)} − ${fmt(b)}·${fmt(fa)}) / (${fmt(fb)} − ${fmt(fa)}) = ${fmt(c)}.`, vis: plotFn(fn, { marks, segs: chord, ghost: { pts: [{ x: c, y: 0, label: 'c' }] } }), erro: 'erro_generico' });
    } else {
      passos.push({ enunciado: en, texto: `Iteração ${k}: qual é o ponto médio c = (a + b)/2?`, ...opcoes(c, [a + (b - a) / 4, b - (b - a) / 4, (b - a) / 2, (a * b) / 2]), explica: `c = (${fmt(a)} + ${fmt(b)})/2 = ${fmt(c)}.`, vis: plotFn(fn, { marks, ghost: { marks: [{ x: c, label: 'c' }] } }), erro: 'convergencia_lenta' });
    }
    const left = fa * fc < 0;
    const na = left ? a : c, nb = left ? c : b;
    if (k < iters) {
      passos.push({ enunciado: en, texto: `f(c) = f(${fmt(c)}) = ${fmt(fc)}. Qual é o novo intervalo?`, ...opcoes(iv(na, nb), [iv(left ? c : a, left ? b : c), `${iv(a, b)} (não muda)`]), explica: `f(a)·f(c) ${left ? '<' : '>'} 0: a troca de sinal está em ${iv(na, nb)}.`, vis: plotFn(fn, { marks: [...marks, { x: c, label: 'c', color: '#8e5bd1' }], segs: chord, ghost: { band: [na, nb] } }), erro: 'polo' });
    }
    a = na; b = nb;
  }
  if (nivel === 'D' && !falsa) {
    passos.push({ enunciado: 'Bisseção começando com b − a = 1.', texto: 'Quantos passos garantem erro menor que τ = 10⁻³?', ...opcoes('10', ['9', '3', '1000']), explica: 'n ≥ log₂((b − a)/τ) = log₂(1000) ≈ 9,97 → n = 10.', vis: { type: 'texto', html: 'n ≥ log₂((b − a)/τ)<br>2¹⁰ = 1024' }, erro: 'convergencia_lenta' });
    passos.push({ enunciado: 'g(x) = 1/(x − 1,5) troca de sinal em [1; 2].', texto: 'A bisseção nesse intervalo converge para...', ...opcoes('um polo em x = 1,5 (não é raiz!)', ['uma raiz em x = 1,5', 'uma raiz em x = 1', 'nada: não troca de sinal']), explica: 'Troca de sinal sem continuidade é polo. Confira |f(c)|: ele explode.', vis: { type: 'plot', f: (x) => 1 / (x - 1.5), xmin: 1, xmax: 2, ymin: -10, ymax: 10 }, erro: 'polo' });
  }
  if (nivel === 'D' && falsa) {
    passos.push({ enunciado: 'Na falsa posição, o extremo b ficou parado por 3 iterações.', texto: 'O que fazer para destravar a corda?', ...opcoes('Dividir f do extremo parado por 2 (Illinois)', ['Aumentar o intervalo', 'Trocar f por −f', 'Parar e aceitar']), explica: 'Illinois: dividir f(b) por 2 inclina a corda e o extremo volta a andar.', vis: { type: 'texto', html: 'f(b) ← f(b)/2' }, erro: 'convergencia_lenta' });
  }
  return { passos, erroFinal: Math.abs(c - r) };
}

const PF = [
  { eq: 'x² − x − 1 = 0', g: (x) => 1 + 1 / x, gtex: '1 + 1/x', dg: (x) => -1 / (x * x), x0: 1 },
  { eq: 'cos(x) − x = 0', g: Math.cos, gtex: 'cos(x)', dg: (x) => -Math.sin(x), x0: 0.5 },
  { eq: 'x³ + x − 1 = 0', g: (x) => 1 / (1 + x * x), gtex: '1/(1 + x²)', dg: (x) => (-2 * x) / (1 + x * x) ** 2, x0: 0.5 },
  { eq: 'e⁻ˣ − x = 0', g: (x) => Math.exp(-x), gtex: 'e⁻ˣ', dg: (x) => -Math.exp(-x), x0: 0.5 },
];

const M1 = {
  bissecao: (n) => bracketing(n, false),
  falsaPosicao: (n) => bracketing(n, true),

  pontoFixo(nivel) {
    const p = nivel === 'F' ? PF[0] : pickOne(PF.slice(1));
    let r = p.x0; for (let i = 0; i < 300; i++) r = p.g(r);
    const passos = [];
    let x = p.x0;
    const en = (k) => `${p.eq} reescrita como x = g(x) = ${p.gtex}. x${'₀₁₂₃'[k]} = ${fmt(x)}.`;
    const vis = (xk, nx) => ({ type: 'plot', f: p.g, curves: [{ f: (t) => t, color: '#9aa0a6', dash: true }], xmin: Math.min(0.3, r - 0.6), xmax: Math.max(r + 0.8, 2.1 - (p === PF[0] ? 0 : 0.8)), pts: [{ x: xk, y: xk, label: 'xₖ' }], ghost: { segs: [{ x1: xk, y1: xk, x2: xk, y2: nx }, { x1: xk, y1: nx, x2: nx, y2: nx }], pts: [{ x: nx, y: nx, label: 'xₖ₊₁' }] } });
    for (let k = 0; k < 3; k++) {
      const nx = p.g(x);
      passos.push({ enunciado: en(k), texto: `Calcule x${'₁₂₃₄'[k]} = g(x${'₀₁₂₃'[k]}):`, ...opcoes(nx, [x, x - nx, (x + nx) / 2, -nx]), explica: `g(${fmt(x)}) = ${fmt(nx)}.`, vis: vis(x, nx), erro: 'convergencia_lenta' });
      x = nx;
    }
    if (nivel !== 'F') {
      const d = Math.abs(p.dg(r));
      passos.push({ enunciado: `g(x) = ${p.gtex}; perto da raiz x* ≈ ${fmt(r)}.`, texto: 'Quanto vale |g′(x*)|?', ...opcoes(d, [d * 2 + 0.1, 1 / d, Math.abs(p.g(r)), 1 + d]), explica: `|g′(${fmt(r)})| ≈ ${fmt(d)} < 1: o ponto fixo atrai.`, vis: { type: 'texto', html: 'converge se |g′(x*)| < 1' }, erro: 'divergencia' });
    }
    if (nivel === 'M') passos.push({ enunciado: 'Com |g′(x*)| < 1 perto da raiz...', texto: 'O que a iteração faz?', ...opcoes('Converge para x*', ['Diverge', 'Oscila para sempre', 'Para no primeiro passo']), explica: 'Cada passo multiplica o erro por ≈ |g′(x*)|.', vis: { type: 'texto', html: 'eₖ₊₁ ≈ g′(x*) · eₖ' } });
    if (nivel === 'D') passos.push({ enunciado: 'g(x) = x² − 1 tem |g′| > 1 perto de φ ≈ 1,618. Amorteça: g_λ(x) = (1 − λ)·x + λ·g(x), λ = 0,5.', texto: 'Partindo de x₀ = 1,5, quanto dá x₁?', ...opcoes(1.375, [1.25, 0.625, 2.25, 1.5]), explica: 'g(1,5) = 1,25; x₁ = 0,5·1,5 + 0,5·1,25 = 1,375.', vis: { type: 'texto', html: 'g_λ(x) = (1 − λ)x + λ g(x)' }, erro: 'divergencia' });
    return { passos, erroFinal: Math.abs(x - r) };
  },

  newton(nivel) {
    const fn = FUNCS[pickOne(POOL[nivel])];
    const r = rootOf(fn);
    let x = nivel === 'F' ? fn.a : Math.round(((fn.a + fn.b) / 2) * 10) / 10;
    const passos = [];
    const vis = (xk, nx) => plotFn(fn, { pts: [{ x: xk, y: fn.f(xk), label: 'xₖ' }], ghost: { line: { x: xk, y: fn.f(xk), m: fn.df(xk) }, pts: [{ x: nx, y: 0, label: 'xₖ₊₁' }] } });
    const step = (k) => {
      const fx = fn.f(x), d = fn.df(x), nx = x - fx / d;
      passos.push({ enunciado: `f(x) = ${fn.tex}, x${'₀₁₂₃'[k]} = ${fmt(x)}: f = ${fmt(fx)}, f′ = ${fmt(d)}.`, texto: `Calcule x${'₁₂₃₄'[k]} = x − f(x)/f′(x):`, ...opcoes(nx, [x + fx / d, x - d / fx, x - fx, (x + nx) / 2 + 0.05]), explica: `${fmt(x)} − (${fmt(fx)})/(${fmt(d)}) = ${fmt(nx)}.`, vis: vis(x, nx), erro: 'divergencia' });
      x = nx;
    };
    if (nivel === 'F') {
      const fx = fn.f(x), d = fn.df(x);
      passos.push({ enunciado: `f(x) = ${fn.tex}, x₀ = ${fmt(x)}.`, texto: 'Quanto vale f(x₀)?', ...opcoes(fx, [-fx, fx + 1, d]), explica: `f(${fmt(x)}) = ${fmt(fx)}.`, vis: plotFn(fn, { pts: [{ x, y: fx, label: 'x₀' }] }) });
      passos.push({ enunciado: `f(x) = ${fn.tex}, f′(x) = ${fn.tex === 'x² − 2' || fn.tex === 'x² − 3' ? '2x' : 'derivada'}, x₀ = ${fmt(x)}.`, texto: 'Quanto vale f′(x₀) (inclinação da tangente)?', ...opcoes(d, [fx, d / 2, d + 1]), explica: `f′(${fmt(x)}) = ${fmt(d)}.`, vis: plotFn(fn, { pts: [{ x, y: fx, label: 'x₀' }], ghost: { line: { x, y: fx, m: d } } }) });
      step(0);
    } else {
      step(0); step(1);
      if (nivel === 'M') step(2);
      if (nivel === 'M') passos.push({ enunciado: 'Perto de um ponto onde f′(x) ≈ 0...', texto: 'O que acontece com o passo de Newton?', ...opcoes('A tangente fica horizontal e o passo explode', ['Converge mais rápido', 'Nada muda', 'Vira bisseção']), explica: 'Dividir por f′ ≈ 0 joga o próximo x para longe.', vis: { type: 'plot', f: (t) => t * t - 0.2, xmin: -1.2, xmax: 1.2, ghost: { line: { x: 0.02, y: 0.02 * 0.02 - 0.2, m: 0.04 } } }, erro: 'divergencia' });
      if (nivel === 'D') {
        passos.push({ enunciado: 'f(x) = x² − 2 e x₀ = 0.', texto: 'O que acontece no primeiro passo de Newton?', ...opcoes('f′(x₀) = 0: divisão por zero', ['x₁ = 2', 'x₁ = √2 direto', 'x₁ = −2']), explica: 'f′(0) = 0: a tangente é horizontal e nunca corta o eixo.', vis: { type: 'plot', f: (t) => t * t - 2, xmin: -2, xmax: 2, ghost: { line: { x: 0, y: -2, m: 0 } } }, erro: 'divisao_zero' });
        passos.push({ enunciado: 'f(x) = (x − 1)² tem raiz dupla em 1. x₀ = 2.', texto: 'Com Newton modificado x₁ = x₀ − m·f/f′ e m = 2, quanto dá x₁?', ...opcoes(1, [1.5, 2, 0.5]), explica: 'f(2) = 1, f′(2) = 2: x₁ = 2 − 2·(1/2) = 1. Exato!', vis: { type: 'plot', f: (t) => (t - 1) ** 2, xmin: 0, xmax: 2.5, ghost: { pts: [{ x: 1, y: 0, label: 'x₁' }] } } });
      }
    }
    return { passos, erroFinal: Math.abs(x - r) };
  },

  secante(nivel) {
    const fn = FUNCS[pickOne(POOL[nivel])];
    const r = rootOf(fn);
    let x0 = fn.a, x1 = fn.b;
    const passos = [];
    const n = nivel === 'F' ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const f0 = fn.f(x0), f1 = fn.f(x1);
      const x2 = x1 - (f1 * (x1 - x0)) / (f1 - f0);
      passos.push({ enunciado: `f(x) = ${fn.tex}. Sondas x${'₀₁₂₃'[k]} = ${fmt(x0)} (f = ${fmt(f0)}) e x${'₁₂₃₄'[k]} = ${fmt(x1)} (f = ${fmt(f1)}).`, texto: `Calcule x${'₂₃₄₅'[k]} = x₁ − f(x₁)·(x₁ − x₀)/(f(x₁) − f(x₀)):`, ...opcoes(x2, [(x0 + x1) / 2, x1 - f1 / (f1 - f0), x1 + (f1 * (x1 - x0)) / (f1 - f0)]), explica: `x = ${fmt(x2)}: onde a reta pelas duas sondas corta o eixo.`, vis: plotFn(fn, { pts: [{ x: x0, y: f0, label: 'x₀' }, { x: x1, y: f1, label: 'x₁' }], ghost: { line: { x: x1, y: f1, m: (f1 - f0) / (x1 - x0) }, pts: [{ x: x2, y: 0, label: 'novo' }] } }), erro: 'divergencia' });
      x0 = x1; x1 = x2;
    }
    const sem = { enunciado: 'Secante × Newton.', texto: 'A secante precisa da derivada f′(x)?', ...opcoes('Não: usa duas sondas', ['Sim, igual a Newton', 'Só na primeira iteração', 'Só se f for polinômio']), explica: 'A reta entre duas sondas faz o papel da tangente.', vis: { type: 'texto', html: 'f′(x₁) ≈ (f(x₁) − f(x₀))/(x₁ − x₀)' } };
    const igual = { enunciado: 'Duas sondas com f(x₀) = f(x₁).', texto: 'O que acontece no passo da secante?', ...opcoes('A reta fica horizontal: divisão por zero', ['Converge na hora', 'Vira bisseção sozinha', 'Nada de especial']), explica: 'f(x₁) − f(x₀) = 0 no denominador: a reta nunca corta o eixo.', vis: { type: 'plot', f: (t) => t * t - 1, xmin: -2, xmax: 2, ghost: { segs: [{ x1: -1.5, y1: 1.25, x2: 1.5, y2: 1.25, color: '#e8454a' }] } }, erro: 'divisao_zero' };
    const ordem = { enunciado: 'Ordem de convergência.', texto: 'A secante converge com ordem aproximada de...', ...opcoes('1,618 (razão áurea)', ['1 (linear)', '2 (quadrática)', '3 (cúbica)']), explica: 'p = (1 + √5)/2 ≈ 1,618: mais rápida que linear, mais lenta que Newton.', vis: { type: 'texto', html: 'eₖ₊₁ ≈ C · eₖ^1,618' } };
    if (nivel === 'F') passos.push(sem);
    if (nivel === 'M') passos.push(igual);
    if (nivel === 'D') passos.push(igual, ordem);
    return { passos, erroFinal: Math.abs(x1 - r) };
  },
};

// ------------------------------------------------------------------ Módulo 2
const SUB = ['₁', '₂', '₃'];
function mul(A, B) { return A.map((row, i) => B[0].map((_, j) => row.reduce((s, _, k) => s + A[i][k] * B[k][j], 0))); }
function mv(A, x) { return A.map((row) => row.reduce((s, a, j) => s + a * x[j], 0)); }
function sistemaLU(n) {
  const L = [[1, 0, 0], [pickOne([2, -2, 3, 1, -1]), 1, 0], [pickOne([1, -1, 2, 3, -2]), pickOne([1, -1, 2, -2]), 1]];
  const U = [[pickOne([1, 2, -1, 3]), ri(-3, 3), ri(-3, 3)], [0, pickOne([1, 2, 3, -1, -2]), ri(-3, 3)], [0, 0, pickOne([1, 2, -1, 3])]];
  const l = L.slice(0, n).map((r) => r.slice(0, n)), u = U.slice(0, n).map((r) => r.slice(0, n));
  const A = mul(l, u);
  const x = Array.from({ length: n }, () => nz(-3, 3));
  return { A, b: mv(A, x), L: l, U: u, x };
}
const mat = (M, b, hl = [], ghost = []) => ({ type: 'matriz', M, b, hl, ghost });
const sysText = (A, b) => A.map((row, i) => row.map((a, j) => `${j && a >= 0 ? '+ ' : j ? '− ' : a < 0 ? '−' : ''}${Math.abs(a) === 1 ? '' : fmt(Math.abs(a))}x${SUB[j]}`).join(' ') + ` = ${fmt(b[i])}`).join('<br>');

function sistemaDD(reordenar = false) {
  const n = 3;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ri(8, 12) : ri(-3, 3))));
  const x = Array.from({ length: n }, () => nz(-2, 3));
  let b = mv(A, x);
  if (reordenar) {
    // troca as linhas 1 e 2: deixa de ser dominante
    return { A: [A[1], A[0], A[2]], b: [b[1], b[0], b[2]], Aok: A, bok: b, x };
  }
  return { A, b, x };
}

const M2 = {
  gauss(nivel) {
    const n = nivel === 'F' ? 2 : 3;
    const { A, b, L, U, x } = sistemaLU(n);
    const en = `Sistema:<br>${sysText(A, b)}`;
    const passos = [];
    const m21 = L[1][0];
    const y = [b[0], b[1] - m21 * b[0]];
    const A1 = A.map((r) => r.slice()), b1 = b.slice();
    A1[1] = A[1].map((v, j) => v - m21 * A[0][j]); b1[1] = y[1];
    passos.push({ enunciado: en, texto: 'Multiplicador para zerar a₂₁: m₂₁ = a₂₁ ÷ a₁₁', ...opcoes(m21, [A[0][0] / A[1][0], -m21, A[1][0] - A[0][0], m21 + 1]), explica: `m₂₁ = ${fmt(A[1][0])} ÷ ${fmt(A[0][0])} = ${fmt(m21)}.`, vis: mat(A, b, [[0, 0]], [[1, 0]]), erro: 'pivo_zero' });
    if (nivel !== 'D') passos.push({ enunciado: en, texto: 'Depois de E₂⁽¹⁾ → E₂⁽⁰⁾ − m₂₁E₁⁽⁰⁾, quanto vale o novo a₂₂⁽¹⁾?', ...opcoes(U[1][1], [A[1][1] + m21 * A[0][1], A[1][1] - A[0][1], A[1][1] - m21 * A[1][0]]), explica: `${fmt(A[1][1])} − ${fmt(m21)}·${fmt(A[0][1])} = ${fmt(U[1][1])}.`, vis: mat(A, b, [[0, 1]], [[1, 1]]) });
    if (n === 2) {
      const x2 = y[1] / U[1][1], x1 = (y[0] - U[0][1] * x2) / U[0][0];
      passos.push({ enunciado: `Triangular:<br>${sysText(U, y)}`, texto: 'Substituição regressiva: x₂ =', ...opcoes(x2, [y[1], -x2, x2 + 1, U[1][1] / y[1]]), explica: `x₂ = ${fmt(y[1])} ÷ ${fmt(U[1][1])} = ${fmt(x2)}.`, vis: mat(U, y, [[1, 1]]) });
      passos.push({ enunciado: `Triangular:<br>${sysText(U, y)}<br>x₂ = ${fmt(x2)}`, texto: 'Agora x₁ =', ...opcoes(x1, [y[0] / U[0][0], -x1, x1 + 1, (y[0] + U[0][1] * x2) / U[0][0]]), explica: `x₁ = (${fmt(y[0])} − ${fmt(U[0][1])}·${fmt(x2)}) ÷ ${fmt(U[0][0])} = ${fmt(x1)}.`, vis: mat(U, y, [[0, 0]]) });
      return { passos, erroFinal: 0 };
    }
    const m31 = L[2][0], m32 = L[2][1];
    A1[2] = A[2].map((v, j) => v - m31 * A[0][j]); b1[2] = b[2] - m31 * b[0];
    y.push(b[2] - m31 * y[0] - m32 * y[1]);
    passos.push({ enunciado: en, texto: 'Multiplicador m₃₁ = a₃₁ ÷ a₁₁', ...opcoes(m31, [A[0][0] / (A[2][0] || 1), -m31, m31 + 1, A[2][0]]), explica: `m₃₁ = ${fmt(A[2][0])} ÷ ${fmt(A[0][0])} = ${fmt(m31)}.`, vis: mat(A, b, [[0, 0]], [[2, 0]]), erro: 'pivo_zero' });
    if (nivel === 'D') passos.push({ enunciado: `Depois da coluna 1:<br>${sysText(A1, b1)}`, texto: 'Novo pivô a₂₂ (depois de zerar a coluna 1) =', ...opcoes(U[1][1], [A[1][1], A[1][1] + m21 * A[0][1], -U[1][1]]), explica: `a₂₂ = ${fmt(U[1][1])}.`, vis: mat(A1, b1, [], [[1, 1]]) });
    passos.push({ enunciado: `Depois da coluna 1:<br>${sysText(A1, b1)}`, texto: 'Multiplicador m₃₂ = a₃₂ ÷ a₂₂', ...opcoes(m32, [A1[1][1] / (A1[2][1] || 1), -m32, m32 + 1, A1[2][1]]), explica: `m₃₂ = ${fmt(A1[2][1])} ÷ ${fmt(A1[1][1])} = ${fmt(m32)}.`, vis: mat(A1, b1, [[1, 1]], [[2, 1]]), erro: 'pivo_zero' });
    const x3 = y[2] / U[2][2], x2 = (y[1] - U[1][2] * x3) / U[1][1], x1 = (y[0] - U[0][1] * x2 - U[0][2] * x3) / U[0][0];
    passos.push({ enunciado: `Triangular superior:<br>${sysText(U, y)}`, texto: 'Substituição regressiva: x₃ =', ...opcoes(x3, [y[2], -x3, x3 + 1, U[2][2] / (y[2] || 1)]), explica: `x₃ = ${fmt(y[2])} ÷ ${fmt(U[2][2])} = ${fmt(x3)}.`, vis: mat(U, y, [[2, 2]]) });
    passos.push({ enunciado: `Triangular superior:<br>${sysText(U, y)}<br>x₃ = ${fmt(x3)}`, texto: 'Subindo: x₂ =', ...opcoes(x2, [y[1] / U[1][1], -x2, x2 + 1, (y[1] + U[1][2] * x3) / U[1][1]]), explica: `x₂ = (${fmt(y[1])} − ${fmt(U[1][2])}·${fmt(x3)}) ÷ ${fmt(U[1][1])} = ${fmt(x2)}.`, vis: mat(U, y, [[1, 1]]) });
    if (nivel === 'D') passos.push({ enunciado: `Triangular superior:<br>${sysText(U, y)}<br>x₃ = ${fmt(x3)}, x₂ = ${fmt(x2)}`, texto: 'Por fim, x₁ =', ...opcoes(x1, [y[0] / U[0][0], -x1, x1 + 1]), explica: `x₁ = ${fmt(x1)}.`, vis: mat(U, y, [[0, 0]]) });
    return { passos, erroFinal: Math.abs(x1 - x[0]) };
  },

  pivoteamento(nivel) {
    const rows = shuffle([[nz(2, 4) * pickOne([1, -1]), ri(-3, 3), ri(-3, 3)], [ri(5, 9) * pickOne([1, -1]), ri(-3, 3), ri(-3, 3)]]);
    const A = [[0, nz(1, 4), ri(-3, 3)], ...rows];
    const x = [nz(-2, 3), nz(-2, 3), nz(-2, 3)];
    const b = mv(A, x);
    const en = `Sistema:<br>${sysText(A, b)}`;
    const p = A.reduce((bi, r, i) => (Math.abs(r[0]) > Math.abs(A[bi][0]) ? i : bi), 0);
    const others = [0, 1, 2].filter((i) => i !== p);
    const piv = A[p][0];
    const ms = others.map((i) => A[i][0] / piv);
    const E = others.map((i, k) => A[i].map((v, j) => v - ms[k] * A[p][j]));
    const p2 = Math.abs(E[0][1]) >= Math.abs(E[1][1]) ? others[0] : others[1];
    const zeroPiv = { enunciado: en, texto: 'O pivô a₁₁ é zero. O que fazer?', ...opcoes('Trocar de linha', ['Dividir por zero mesmo', 'Pular a coluna 1', 'Somar 1 no pivô']), explica: 'Pivô zero não divide ninguém: troque por uma linha com a₁ ≠ 0.', vis: mat(A, b, [[0, 0]]), erro: 'pivo_zero' };
    const qual = { enunciado: en, texto: 'Pivoteamento parcial: qual linha vira pivô na coluna 1?', ...opcoes(`Linha ${p + 1}`, [0, 1, 2].filter((i) => i !== p).map((i) => `Linha ${i + 1}`)), explica: `O maior |aᵢ₁| é ${fmt(Math.abs(piv))}, na linha ${p + 1}.`, vis: mat(A, b, [], [[p, 0]]), erro: 'pivo_zero' };
    const mult = (k) => ({ enunciado: `${en}<br>Pivô: ${fmt(piv)} (linha ${p + 1}).`, texto: `Multiplicador da linha ${others[k] + 1}: m = a${SUB[others[k]]}₁ ÷ pivô`, ...opcoes(ms[k], [piv / (A[others[k]][0] || 1), -ms[k], ms[k] + 1, A[others[k]][0]]), explica: `m = ${fmt(A[others[k]][0])} ÷ ${fmt(piv)} = ${fmt(ms[k])}.`, vis: mat(A, b, [[p, 0]], [[others[k], 0]]) });
    const second = { enunciado: `Depois de eliminar a coluna 1, as linhas ${others[0] + 1} e ${others[1] + 1} ficam com a₂ = ${fmt(E[0][1])} e ${fmt(E[1][1])}.`, texto: 'Na coluna 2, qual linha vira pivô?', ...opcoes(`Linha ${p2 + 1}`, [`Linha ${(p2 === others[0] ? others[1] : others[0]) + 1}`, `Linha ${p + 1}`]), explica: 'De novo, o maior valor absoluto da coluna.', vis: { type: 'texto', html: `|${fmt(E[0][1])}| vs |${fmt(E[1][1])}|` } };
    const total = { enunciado: 'Colunas com escalas muito diferentes (10⁻⁶ e 10⁶).', texto: 'Qual estratégia é mais segura?', ...opcoes('Pivoteamento total (troca colunas também)', ['Sem pivoteamento', 'Pivô sempre na linha 1', 'Dividir tudo por 10⁶']), explica: 'O pivoteamento total procura o maior em toda a submatriz.', vis: { type: 'texto', html: 'P·A·Q = L·U' } };
    const passos = nivel === 'F' ? [zeroPiv, qual, mult(0)] : nivel === 'M' ? [zeroPiv, qual, mult(0), mult(1), second] : [qual, mult(0), mult(1), second, total];
    return { passos, erroFinal: 0 };
  },

  lu(nivel) {
    const n = nivel === 'F' ? 2 : 3;
    const { A, b, L, U, x } = sistemaLU(n);
    const en = `A·x = b, com A e b:<br>${sysText(A, b)}`;
    const y = [b[0], b[1] - L[1][0] * b[0]];
    if (n === 3) y.push(b[2] - L[2][0] * y[0] - L[2][1] * y[1]);
    const passos = [];
    const l21 = { enunciado: en, texto: 'Fatoração A = L·U: quanto vale l₂₁?', ...opcoes(L[1][0], [A[0][0] / A[1][0], -L[1][0], L[1][0] + 1]), explica: `l₂₁ = a₂₁ ÷ u₁₁ = ${fmt(L[1][0])}.`, vis: mat(A, b, [[0, 0]], [[1, 0]]) };
    const u22 = { enunciado: en, texto: 'E u₂₂ = a₂₂ − l₂₁·u₁₂ =', ...opcoes(U[1][1], [A[1][1], A[1][1] + L[1][0] * U[0][1], -U[1][1]]), explica: `u₂₂ = ${fmt(A[1][1])} − ${fmt(L[1][0])}·${fmt(U[0][1])} = ${fmt(U[1][1])}.`, vis: mat(A, b, [], [[1, 1]]) };
    const y2 = { enunciado: `L·y = b para frente. L = [1 0; ${fmt(L[1][0])} 1]${n === 3 ? '…' : ''}, b = (${b.map((v) => fmt(v)).join('; ')}), y₁ = ${fmt(y[0])}.`, texto: 'Quanto vale y₂ = b₂ − l₂₁·y₁?', ...opcoes(y[1], [b[1], b[1] + L[1][0] * y[0], -y[1]]), explica: `y₂ = ${fmt(b[1])} − ${fmt(L[1][0])}·${fmt(y[0])} = ${fmt(y[1])}.`, vis: mat(L, b, [[1, 0]]) };
    if (n === 2) {
      const xx2 = y[1] / U[1][1];
      passos.push(l21, u22, y2, { enunciado: `U·x = y para trás: u₂₂ = ${fmt(U[1][1])}, y₂ = ${fmt(y[1])}.`, texto: 'x₂ =', ...opcoes(xx2, [y[1], -xx2, xx2 + 1]), explica: `x₂ = ${fmt(y[1])} ÷ ${fmt(U[1][1])} = ${fmt(xx2)}.`, vis: mat(U, y, [[1, 1]]) });
      return { passos, erroFinal: 0 };
    }
    const l31 = { enunciado: en, texto: 'l₃₁ = a₃₁ ÷ u₁₁ =', ...opcoes(L[2][0], [-L[2][0], L[2][0] + 1, A[2][0]]), explica: `l₃₁ = ${fmt(L[2][0])}.`, vis: mat(A, b, [[0, 0]], [[2, 0]]) };
    const l32 = { enunciado: `${en}<br>u₂₂ = ${fmt(U[1][1])}`, texto: 'l₃₂ = (a₃₂ − l₃₁·u₁₂) ÷ u₂₂ =', ...opcoes(L[2][1], [-L[2][1], L[2][1] + 1, A[2][1] / U[1][1]]), explica: `l₃₂ = ${fmt(L[2][1])}.`, vis: mat(A, b, [], [[2, 1]]) };
    const u33 = { enunciado: `${en}<br>l₃₁ = ${fmt(L[2][0])}, l₃₂ = ${fmt(L[2][1])}`, texto: 'u₃₃ = a₃₃ − l₃₁·u₁₃ − l₃₂·u₂₃ =', ...opcoes(U[2][2], [A[2][2], -U[2][2], U[2][2] + 2]), explica: `u₃₃ = ${fmt(U[2][2])}.`, vis: mat(A, b, [], [[2, 2]]) };
    const y3 = { enunciado: `Para frente: y₁ = ${fmt(y[0])}, y₂ = ${fmt(y[1])}, l₃₁ = ${fmt(L[2][0])}, l₃₂ = ${fmt(L[2][1])}, b₃ = ${fmt(b[2])}.`, texto: 'y₃ = b₃ − l₃₁·y₁ − l₃₂·y₂ =', ...opcoes(y[2], [b[2], -y[2], b[2] - L[2][0] * y[0]]), explica: `y₃ = ${fmt(y[2])}.`, vis: mat(L, b, [[2, 0], [2, 1]]) };
    const x3 = y[2] / U[2][2];
    const xx3 = { enunciado: `Para trás: y₃ = ${fmt(y[2])}, u₃₃ = ${fmt(U[2][2])}.`, texto: 'x₃ = y₃ ÷ u₃₃ =', ...opcoes(x3, [y[2], -x3, x3 + 1]), explica: `x₃ = ${fmt(x3)}.`, vis: mat(U, y, [[2, 2]]) };
    const reuse = { enunciado: 'Você precisa resolver A·x = b para 10 vetores b diferentes.', texto: 'Quantas fatorações LU são necessárias?', ...opcoes('1', ['10', '5', '100']), explica: 'Fatora uma vez e resolve muitas vezes (só substituições).', vis: { type: 'texto', html: 'A = L·U uma vez → L·y = b, U·x = y para cada b' } };
    const perm = { enunciado: 'Com pivoteamento, a fatoração vira P·A = L·U.', texto: 'Na hora de resolver, o vetor b deve ser...', ...opcoes('permutado do mesmo jeito: L·y = P·b', ['usado sem mudar', 'dividido pelo pivô', 'trocado por −b']), explica: 'As linhas trocadas em A precisam ser trocadas em b.', vis: { type: 'texto', html: 'P·A·x = P·b' } };
    if (nivel === 'M') passos.push(l21, l31, u22, l32, y2, xx3);
    else passos.push(l21, l32, u33, y3, xx3, reuse, perm);
    return { passos, erroFinal: Math.abs(x3 - x[2]) };
  },

  jacobi(nivel) {
    const S = sistemaDD(nivel === 'D');
    const A = S.Aok || S.A, b = S.bok || S.b;
    const en = `Sistema:<br>${sysText(A, b)}<br>x⁽⁰⁾ = (0; 0; 0)`;
    const x1 = [b[0] / A[0][0], b[1] / A[1][1], b[2] / A[2][2]];
    const x2 = [0, 1, 2].map((i) => (b[i] - [0, 1, 2].filter((j) => j !== i).reduce((s, j) => s + A[i][j] * x1[j], 0)) / A[i][i]);
    const seidel2 = (b[1] - A[1][0] * x2[0] - A[1][2] * x1[2]) / A[1][1];
    const comp = (i, k, val, wrong) => ({ enunciado: k === 1 ? en : `${en}<br>x⁽¹⁾ = (${x1.map((v) => fmt(v)).join('; ')})`, texto: `Jacobi: x${SUB[i]}⁽${k === 1 ? '¹' : '²'}⁾ =`, ...opcoes(val, wrong), explica: `Usa só valores da iteração anterior: x${SUB[i]} = ${fmt(val)}.`, vis: mat(A, b, [[i, i]]), erro: 'convergencia_lenta' });
    const dom = { enunciado: `Sistema:<br>${sysText(A, b)}`, texto: 'A matriz é diagonalmente dominante por linhas?', ...opcoes('Sim', ['Não']), explica: 'Em cada linha, |aᵢᵢ| > soma dos outros |aᵢⱼ|.', vis: mat(A, b, [[0, 0], [1, 1], [2, 2]]) };
    const passos = [];
    if (nivel === 'F') passos.push(comp(0, 1, x1[0], [b[0], A[0][0] / b[0], -x1[0]]), comp(1, 1, x1[1], [b[1], (b[1] - A[1][0] * x1[0]) / A[1][1], -x1[1]]), dom);
    else if (nivel === 'M') passos.push(comp(0, 1, x1[0], [b[0], -x1[0], A[0][0] / b[0]]), comp(1, 1, x1[1], [(b[1] - A[1][0] * x1[0]) / A[1][1], b[1], -x1[1]]), comp(2, 1, x1[2], [b[2], -x1[2], (b[2] - A[2][0] * x1[0]) / A[2][2]]), comp(0, 2, x2[0], [x1[0], (b[0] + A[0][1] * x1[1] + A[0][2] * x1[2]) / A[0][0], -x2[0]]), comp(1, 2, x2[1], [seidel2, x1[1], -x2[1]]));
    else {
      const bad = { enunciado: `Sistema:<br>${sysText(S.A, S.b)}`, texto: 'Esta matriz é diagonalmente dominante por linhas?', ...opcoes('Não', ['Sim']), explica: 'Na linha 1, a diagonal perde para os outros termos.', vis: mat(S.A, S.b, [[0, 0], [1, 1]]), erro: 'divergencia' };
      const fix = { enunciado: 'Jacobi pode divergir sem dominância diagonal.', texto: 'O que fazer antes de iterar?', ...opcoes('Reordenar as linhas', ['Iterar mais vezes', 'Trocar x⁽⁰⁾', 'Dividir tudo por 10']), explica: 'Trocando as linhas 1 e 2, a diagonal passa a dominar.', vis: mat(A, b, [[0, 0], [1, 1], [2, 2]]) };
      passos.push(bad, fix, comp(0, 1, x1[0], [b[0], -x1[0]]), comp(1, 1, x1[1], [(b[1] - A[1][0] * x1[0]) / A[1][1], b[1]]), comp(2, 1, x1[2], [b[2], -x1[2]]), comp(0, 2, x2[0], [x1[0], -x2[0]]));
    }
    return { passos, erroFinal: Math.abs(x2[0] - S.x[0]) };
  },

  seidel(nivel) {
    const { A, b, x } = sistemaDD(false);
    const en = `Sistema:<br>${sysText(A, b)}<br>x⁽⁰⁾ = (0; 0; 0)`;
    const s1 = [];
    s1[0] = b[0] / A[0][0];
    s1[1] = (b[1] - A[1][0] * s1[0]) / A[1][1];
    s1[2] = (b[2] - A[2][0] * s1[0] - A[2][1] * s1[1]) / A[2][2];
    const s2x1 = (b[0] - A[0][1] * s1[1] - A[0][2] * s1[2]) / A[0][0];
    const beta1 = (Math.abs(A[0][1]) + Math.abs(A[0][2])) / Math.abs(A[0][0]);
    const beta2 = (Math.abs(A[1][0]) * beta1 + Math.abs(A[1][2])) / Math.abs(A[1][1]);
    const c = (i, val, wrong, extra = '') => ({ enunciado: `${en}${extra}`, texto: `Gauss-Seidel: x${SUB[i]}⁽¹⁾ =`, ...opcoes(val, wrong), explica: `Já usa os valores novos: x${SUB[i]} = ${fmt(val)}.`, vis: mat(A, b, [[i, i]]), erro: 'convergencia_lenta' });
    const P = [
      c(0, s1[0], [b[0], -s1[0], A[0][0] / b[0]]),
      c(1, s1[1], [b[1] / A[1][1], (b[1] + A[1][0] * s1[0]) / A[1][1], -s1[1]], `<br>x₁⁽¹⁾ = ${fmt(s1[0])}`),
      c(2, s1[2], [b[2] / A[2][2], (b[2] - A[2][0] * s1[0]) / A[2][2], -s1[2]], `<br>x₁⁽¹⁾ = ${fmt(s1[0])}, x₂⁽¹⁾ = ${fmt(s1[1])}`),
    ];
    const b1 = { enunciado: `Sistema:<br>${sysText(A, b)}`, texto: 'Sassenfeld: β₁ = (|a₁₂| + |a₁₃|) ÷ |a₁₁| =', ...opcoes(beta1, [1 / beta1, Math.abs(A[0][1]) / Math.abs(A[0][0]), beta1 + 0.5]), explica: `β₁ = ${fmt(beta1)} < 1.`, vis: mat(A, b, [[0, 0]], [[0, 1], [0, 2]]) };
    const b2 = { enunciado: `Sistema:<br>${sysText(A, b)}<br>β₁ = ${fmt(beta1)}`, texto: 'β₂ = (|a₂₁|·β₁ + |a₂₃|) ÷ |a₂₂| =', ...opcoes(beta2, [(Math.abs(A[1][0]) + Math.abs(A[1][2])) / Math.abs(A[1][1]), beta2 * 2, 1 - beta2]), explica: `β₂ = ${fmt(beta2)}. Todos os β < 1 garantem convergência.`, vis: mat(A, b, [[1, 1]], [[1, 0], [1, 2]]) };
    const x12 = { enunciado: `${en}<br>x⁽¹⁾ = (${s1.map((v) => fmt(v)).join('; ')})`, texto: 'Segunda varredura: x₁⁽²⁾ =', ...opcoes(s2x1, [s1[0], -s2x1, b[0] / A[0][0] + 1]), explica: `x₁⁽²⁾ = ${fmt(s2x1)}.`, vis: mat(A, b, [[0, 0]]) };
    const cmp = { enunciado: 'Seidel × Jacobi no mesmo sistema dominante.', texto: 'Normalmente o Gauss-Seidel...', ...opcoes('precisa de menos varreduras', ['precisa de mais varreduras', 'nunca converge', 'é idêntico ao Jacobi']), explica: 'Usar o valor novo na hora acelera (mas confira o raio espectral).', vis: { type: 'texto', html: 'fofoca rápida = convergência rápida' } };
    const passos = nivel === 'F' ? [P[0], P[1], b1] : nivel === 'M' ? [P[0], P[1], P[2], b1, b2] : [P[0], P[1], P[2], x12, b2, cmp];
    return { passos, erroFinal: Math.abs(s2x1 - x[0]) };
  },
};

// ------------------------------------------------------------------ Módulo 3
function lagrangeEval(xs, ys, x) { return xs.reduce((s, xi, i) => s + ys[i] * xs.reduce((p, xj, j) => (j === i ? p : (p * (x - xj)) / (xi - xj)), 1), 0); }
function basis(xs, i, x) { return xs.reduce((p, xj, j) => (j === i ? p : (p * (x - xs[j])) / (xs[i] - xs[j])), 1); }
const pontos = (xs, ys) => xs.map((x, i) => ({ x, y: ys[i] }));

const M3 = {
  lagrange(nivel) {
    const xs = nivel === 'D' ? [0, 1, 2, 3] : [0, 1, 2];
    let ys;
    do ys = xs.map(() => ri(0, 5)); while (new Set(ys).size < 2 || (ys.length === 3 && ys[1] * 2 === ys[0] + ys[2]));
    const xq = nivel === 'D' ? 2.5 : pickOne([0.5, 1.5]);
    const P = lagrangeEval(xs, ys, xq);
    const L0 = basis(xs, 0, xq), L1 = basis(xs, 1, xq);
    const en = `Pontos: ${xs.map((x, i) => `(${x}; ${ys[i]})`).join(', ')}. Queremos P(${fmt(xq)}).`;
    const vis = (ghost = true) => ({ type: 'plot', f: (x) => lagrangeEval(xs, ys, x), xmin: -0.3, xmax: xs.at(-1) + 0.3, hideCurve: true, pts: pontos(xs, ys), ghost: ghost ? { curve: true, pts: [{ x: xq, y: P, label: 'P' }] } : {} });
    const grau = { enunciado: en, texto: `Qual é o grau do polinômio que passa por esses ${xs.length} pontos?`, ...opcoes(String(xs.length - 1), [String(xs.length), String(xs.length + 1), '1']), explica: `n + 1 pontos → grau n = ${xs.length - 1}.`, vis: vis(false) };
    const l0 = { enunciado: en, texto: `Quanto vale a base L₀(${fmt(xq)})?`, ...opcoes(L0, [-L0, 1 - L0, L1, 0.5]), explica: `L₀(x) = Π (x − xⱼ)/(x₀ − xⱼ) → ${fmt(L0)}.`, vis: vis(false) };
    const l1 = { enunciado: en, texto: `E a base L₁(${fmt(xq)})?`, ...opcoes(L1, [-L1, L0, 1 - L1]), explica: `L₁(${fmt(xq)}) = ${fmt(L1)}.`, vis: vis(false) };
    const near = ys[Math.floor(xq)], near2 = ys[Math.ceil(xq)];
    const pv = { enunciado: `${en}<br>L₀ = ${fmt(L0)}, L₁ = ${fmt(L1)}${xs.length === 3 ? `, L₂ = ${fmt(basis(xs, 2, xq))}` : ''}`, texto: `P(${fmt(xq)}) = Σ yᵢ·Lᵢ(${fmt(xq)}) =`, ...opcoes(P, [(near + near2) / 2, near, -P, P + 1]), explica: `P(${fmt(xq)}) = ${fmt(P)}.`, vis: vis(true) };
    const newt = { enunciado: 'Chegou um ponto novo para interpolar.', texto: 'Qual forma deixa acrescentar o ponto sem refazer tudo?', ...opcoes('Forma de Newton (diferenças divididas)', ['Forma de Lagrange', 'Regressão linear', 'Spline natural']), explica: 'Newton só acrescenta um termo novo.', vis: { type: 'texto', html: 'P₊(x) = P(x) + c·Π(x − xᵢ)' } };
    const runge = { enunciado: 'Muitos nós igualmente espaçados em [−1; 1] para f(x) = 1/(1 + 25x²).', texto: 'As oscilações nas bordas (Runge) somem usando...', ...opcoes('nós de Chebyshev', ['mais nós igualmente espaçados', 'grau maior', 'nenhum nó nas pontas']), explica: 'Nós de Chebyshev se acumulam nas bordas e domam a oscilação.', vis: { type: 'plot', f: (x) => 1 / (1 + 25 * x * x), xmin: -1, xmax: 1, curves: [{ f: (x) => lagrangeEval([-1, -0.6, -0.2, 0.2, 0.6, 1], [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => 1 / (1 + 25 * t * t)), x), color: '#e8554a' }] }, erro: 'divergencia' };
    const passos = nivel === 'F' ? [grau, l0, pv] : nivel === 'M' ? [grau, l0, l1, pv, newt] : [grau, l0, pv, runge];
    return { passos, erroFinal: 0 };
  },

  spline(nivel) {
    let y;
    do y = [ri(0, 4), ri(0, 5), ri(0, 4)]; while (y[0] - 2 * y[1] + y[2] === 0);
    const M1v = 1.5 * (y[0] - 2 * y[1] + y[2]);
    const S = (x) => (x <= 1 ? (M1v * x ** 3) / 6 + y[0] * (1 - x) + (y[1] - M1v / 6) * x : (M1v * (2 - x) ** 3) / 6 + (y[1] - M1v / 6) * (2 - x) + y[2] * (x - 1));
    const en = `Pontos (0; ${y[0]}), (1; ${y[1]}), (2; ${y[2]}), h = 1, spline cúbica natural.`;
    const vis = (g) => ({ type: 'plot', f: S, xmin: -0.2, xmax: 2.2, hideCurve: true, pts: pontos([0, 1, 2], y), ghost: g ? { curve: true, ...g } : { curve: true } });
    const pecas = { enunciado: en, texto: 'Quantos pedaços cúbicos tem a spline por 3 pontos?', ...opcoes('2', ['3', '1', '4']), explica: 'Um pedaço por intervalo: 2.', vis: vis() };
    const nat = { enunciado: en, texto: 'Na spline natural, as segundas derivadas M₀ e M₂ nas pontas valem:', ...opcoes('0', ['1', 'y₀ e y₂', 'M₁']), explica: 'Natural: curvatura zero nas pontas.', vis: vis() };
    const m1 = { enunciado: `${en}<br>4·M₁ = 6·(y₀ − 2y₁ + y₂)`, texto: 'Quanto vale M₁?', ...opcoes(M1v, [6 * (y[0] - 2 * y[1] + y[2]), (y[0] - 2 * y[1] + y[2]) / 2, -M1v, 3 * (y[0] - 2 * y[1] + y[2])]), explica: `M₁ = 6·(${y[0] - 2 * y[1] + y[2]})/4 = ${fmt(M1v)}.`, vis: vis() };
    const s05 = { enunciado: `${en}<br>M₁ = ${fmt(M1v)}. Em [0; 1]: S(x) = M₁x³/6 + y₀(1 − x) + (y₁ − M₁/6)x`, texto: 'Quanto vale S(0,5)?', ...opcoes(S(0.5), [(y[0] + y[1]) / 2, S(0.5) + M1v / 48, -S(0.5)]), explica: `S(0,5) = ${fmt(S(0.5))}.`, vis: vis({ pts: [{ x: 0.5, y: S(0.5), label: 'S' }] }) };
    const s15 = { enunciado: `${en}<br>M₁ = ${fmt(M1v)}. Em [1; 2]: S(x) = M₁(2 − x)³/6 + (y₁ − M₁/6)(2 − x) + y₂(x − 1)`, texto: 'Quanto vale S(1,5)?', ...opcoes(S(1.5), [(y[1] + y[2]) / 2, S(1.5) - M1v / 48, -S(1.5)]), explica: `S(1,5) = ${fmt(S(1.5))}.`, vis: vis({ pts: [{ x: 1.5, y: S(1.5), label: 'S' }] }) };
    const emenda = { enunciado: 'Na emenda x = 1, os dois pedaços se encontram.', texto: 'Além do valor, os pedaços têm a mesma...', ...opcoes('derivada e curvatura', ['só a derivada', 'nada além do valor', 'terceira derivada']), explica: 'Spline cúbica: classe C² (f, f′ e f″ contínuas).', vis: vis() };
    const quatro = { enunciado: 'Spline por 4 pontos.', texto: 'Quantos pedaços cúbicos?', ...opcoes('3', ['4', '2', '1']), explica: 'n + 1 pontos → n pedaços.', vis: { type: 'texto', html: 'pontos − 1 = pedaços' } };
    const completa = { enunciado: 'Você conhece f′ nas pontas do intervalo.', texto: 'Qual condição de contorno usar?', ...opcoes('Spline completa (fixada)', ['Spline natural', 'Polinômio de grau 10', 'Interpolação linear']), explica: 'A natural pode errar muito nas pontas; a completa usa f′.', vis: { type: 'texto', html: "S′(x₀) = f′(x₀), S′(xₙ) = f′(xₙ)" } };
    const passos = nivel === 'F' ? [pecas, nat, m1] : nivel === 'M' ? [pecas, m1, s05, s15, emenda] : [m1, s05, s15, quatro, completa];
    return { passos, erroFinal: 0 };
  },

  minimosQuadrados(nivel) {
    const xs = [1, 2, 3, 4];
    const a0 = ri(0, 2), b0 = ri(1, 3);
    const ys = xs.map((x) => a0 + b0 * x + pickOne([-1, 0, 0, 1]));
    const n = 4, Sx = 10, Sxx = 30, Sy = ys.reduce((s, v) => s + v, 0), Sxy = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const bh = (n * Sxy - Sx * Sy) / (n * Sxx - Sx * Sx), ah = (Sy - bh * Sx) / n;
    const en = `Pontos: ${xs.map((x, i) => `(${x}; ${ys[i]})`).join(', ')}. Reta y = a + b·x.`;
    const vis = (g) => ({ type: 'plot', f: (x) => ah + bh * x, xmin: 0, xmax: 5, hideCurve: true, pts: pontos(xs, ys), ghost: g ? { curve: true, resid: true } : {} });
    const sx = { enunciado: en, texto: 'Quanto vale Σx?', ...opcoes(Sx, [Sxx, 4, 8]), explica: '1 + 2 + 3 + 4 = 10.', vis: vis() };
    const sxx = { enunciado: en, texto: 'Quanto vale Σx²?', ...opcoes(Sxx, [100, Sx, 16]), explica: '1 + 4 + 9 + 16 = 30.', vis: vis() };
    const sxy = { enunciado: `${en}<br>Σy = ${Sy}`, texto: 'Quanto vale Σx·y?', ...opcoes(Sxy, [Sx * Sy, Sxy + 2, Sy]), explica: `Σxy = ${xs.map((x, i) => `${x}·${ys[i]}`).join(' + ')} = ${Sxy}.`, vis: vis() };
    const bb = { enunciado: `${en}<br>n = 4, Σx = 10, Σx² = 30, Σy = ${Sy}, Σxy = ${Sxy}`, texto: 'b = (n·Σxy − Σx·Σy) ÷ (n·Σx² − (Σx)²) =', ...opcoes(bh, [Sxy / Sxx, (Sxy - Sx * Sy) / (Sxx - Sx), bh + 0.5, -bh]), explica: `b = (${4 * Sxy} − ${10 * Sy}) ÷ 20 = ${fmt(bh)}.`, vis: vis() };
    const aa = { enunciado: `${en}<br>Σy = ${Sy}, Σx = 10, b = ${fmt(bh)}`, texto: 'a = (Σy − b·Σx) ÷ n =', ...opcoes(ah, [Sy / n, (Sy + bh * Sx) / n, ah + 1]), explica: `a = (${Sy} − ${fmt(bh)}·10) ÷ 4 = ${fmt(ah)}.`, vis: vis(true) };
    const minimiza = { enunciado: 'Mínimos quadrados.', texto: 'O método escolhe a reta que minimiza a soma dos...', ...opcoes('quadrados dos resíduos', ['resíduos (com sinal)', 'valores de x', 'erros relativos']), explica: 'Σ (yᵢ − (a + b xᵢ))² mínima.', vis: vis(true) };
    const centr = { enunciado: 'Dados com x entre 1000 e 1010 deixam AᵀA mal condicionada.', texto: 'Centralize: t = x − ...', ...opcoes('média dos x', ['1000²', 'maior x', 'zero']), explica: 't = x − x̄ deixa os números pequenos e o sistema estável.', vis: { type: 'texto', html: 't = x − x̄' } };
    const passos = nivel === 'F' ? [sxy, bb, aa] : nivel === 'M' ? [sx, sxx, sxy, bb, aa] : [sxy, bb, aa, minimiza, centr];
    return { passos, erroFinal: 0 };
  },
};

// ------------------------------------------------------------------ Módulo 4
const INT = [
  { tex: 'x²', f: (x) => x * x, a: 0, b: 2, ex: 8 / 3 },
  { tex: 'eˣ', f: Math.exp, a: 0, b: 1, ex: Math.E - 1 },
  { tex: '1/(1 + x²)', f: (x) => 1 / (1 + x * x), a: 0, b: 1, ex: Math.PI / 4 },
  { tex: 'x³', f: (x) => x ** 3, a: 0, b: 2, ex: 4 },
  { tex: '√(1 + x)', f: (x) => Math.sqrt(1 + x), a: 0, b: 3, ex: 14 / 3 },
];
const nodes = (I, n) => Array.from({ length: n + 1 }, (_, i) => I.a + ((I.b - I.a) * i) / n);
function trap(I, n) { const h = (I.b - I.a) / n; const xs = nodes(I, n); return (h / 2) * xs.reduce((s, x, i) => s + I.f(x) * (i === 0 || i === n ? 1 : 2), 0); }
function simp13(I, n) { const h = (I.b - I.a) / n; const xs = nodes(I, n); return (h / 3) * xs.reduce((s, x, i) => s + I.f(x) * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2), 0); }
function simp38(I, n) { const h = (I.b - I.a) / n; const xs = nodes(I, n); return ((3 * h) / 8) * xs.reduce((s, x, i) => s + I.f(x) * (i === 0 || i === n ? 1 : i % 3 ? 3 : 2), 0); }
const areaVis = (I, n, kind) => ({ type: 'plot', f: I.f, xmin: I.a - 0.1 * (I.b - I.a), xmax: I.b + 0.1 * (I.b - I.a), ymin: 0, area: { n, kind, a: I.a, b: I.b }, ghost: { areaHi: true } });

const EDO = [
  { tex: 'y′ = y', f: (t, y) => y, y0: 1, ex: (t) => Math.exp(t) },
  { tex: 'y′ = −2y', f: (t, y) => -2 * y, y0: 1, ex: (t) => Math.exp(-2 * t) },
  { tex: 'y′ = t + y', f: (t, y) => t + y, y0: 1, ex: (t) => 2 * Math.exp(t) - t - 1 },
  { tex: 'y′ = t − y', f: (t, y) => t - y, y0: 1, ex: (t) => t - 1 + 2 * Math.exp(-t) },
];

const M4 = {
  trapezio(nivel) {
    const I = pickOne(nivel === 'F' ? [INT[0], INT[3]] : INT);
    const n = nivel === 'F' ? 2 : 4;
    const h = (I.b - I.a) / n, T = trap(I, n);
    const en = `∫ de ${fmt(I.a)} a ${fmt(I.b)} de ${I.tex} dx, com n = ${n} trapézios.`;
    const xs = nodes(I, n);
    const H = { enunciado: en, texto: 'Qual é o passo h = (b − a)/n?', ...opcoes(h, [(I.b - I.a) * n, h / 2, I.b - I.a]), explica: `h = (${fmt(I.b)} − ${fmt(I.a)})/${n} = ${fmt(h)}.`, vis: areaVis(I, n, 'trap') };
    const fx1 = { enunciado: `${en}<br>h = ${fmt(h)}`, texto: `Quanto vale f(x₁) = f(${fmt(xs[1])})?`, ...opcoes(I.f(xs[1]), [I.f(xs[0]), I.f(xs[1]) * 2, xs[1]]), explica: `f(${fmt(xs[1])}) = ${fmt(I.f(xs[1]))}.`, vis: areaVis(I, n, 'trap') };
    const TT = { enunciado: `${en}<br>h = ${fmt(h)}; f nos nós: ${xs.map((x) => fmt(I.f(x))).join('; ')}`, texto: 'T = (h/2)·[f₀ + 2f₁ + … + 2fₙ₋₁ + fₙ] =', ...opcoes(T, [h * xs.reduce((s, x) => s + I.f(x), 0), simp13(I, n), I.ex, trap(I, n / 2)]), explica: `T = ${fmt(T)} (exato: ${fmt(I.ex)}).`, vis: areaVis(I, n, 'trap') };
    const dobra = { enunciado: 'Regra do trapézio composta: erro ∝ h².', texto: 'Dobrando n, o erro fica dividido por...', ...opcoes('4', ['2', '8', '1 (não muda)']), explica: 'h cai pela metade → h² cai por 4.', vis: { type: 'texto', html: 'E ≈ −(b − a)·h²·f″/12' } };
    const erro = { enunciado: `${en}<br>T = ${fmt(T)}, valor exato ${fmt(I.ex)}`, texto: 'Qual é o erro |T − exato|?', ...opcoes(Math.abs(T - I.ex), [Math.abs(T - I.ex) * 4, Math.abs(T - I.ex) / 4, T], f6), explica: `|${fmt(T)} − ${fmt(I.ex)}| = ${f6(Math.abs(T - I.ex))}.`, vis: areaVis(I, n, 'trap') };
    const hot = { enunciado: 'Diminuindo h para 10⁻¹⁰ em ponto flutuante...', texto: 'O erro total volta a crescer por causa de...', ...opcoes('arredondamento (existe um h ótimo)', ['truncamento da fórmula', 'overflow', 'nada: sempre melhora']), explica: 'Erro de arredondamento cresce com n: existe um h ótimo.', vis: { type: 'texto', html: 'erro = truncamento (↓ com h) + arredondamento (↑ com n)' } };
    const passos = nivel === 'F' ? [H, fx1, TT] : nivel === 'M' ? [H, TT, erro, dobra] : [TT, erro, dobra, hot];
    return { passos, erroFinal: Math.abs(T - I.ex) };
  },

  simpson13(nivel) {
    const I = pickOne(nivel === 'F' ? [INT[0], INT[1]] : INT);
    const n = nivel === 'F' ? 2 : 4;
    const h = (I.b - I.a) / n, S = simp13(I, n);
    const xs = nodes(I, n);
    const en = `∫ de ${fmt(I.a)} a ${fmt(I.b)} de ${I.tex} dx, Simpson 1/3 com n = ${n}.`;
    const par = { enunciado: en, texto: 'Para Simpson 1/3, o número de intervalos n precisa ser...', ...opcoes('par', ['ímpar', 'múltiplo de 3', 'primo']), explica: 'Cada parábola usa 2 intervalos (3 pontos).', vis: areaVis(I, n, 'simp') };
    const H = { enunciado: en, texto: 'h = (b − a)/n =', ...opcoes(h, [h * 2, (I.b - I.a) * n, h / 2]), explica: `h = ${fmt(h)}.`, vis: areaVis(I, n, 'simp') };
    const pesos = { enunciado: en, texto: `Pesos para n = ${n}:`, ...opcoes(n === 2 ? '1, 4, 1' : '1, 4, 2, 4, 1', [n === 2 ? '1, 2, 1' : '1, 2, 2, 2, 1', n === 2 ? '1, 3, 1' : '1, 3, 3, 3, 1', n === 2 ? '4, 1, 4' : '1, 4, 4, 4, 1']), explica: 'Pesos 1, 4, 2, 4, …, 4, 1 vezes h/3.', vis: areaVis(I, n, 'simp') };
    const SS = { enunciado: `${en}<br>h = ${fmt(h)}; f nos nós: ${xs.map((x) => fmt(I.f(x))).join('; ')}`, texto: 'S = (h/3)·[f₀ + 4f₁ + 2f₂ + … + fₙ] =', ...opcoes(S, [trap(I, n), (h / 3) * xs.reduce((s, x) => s + I.f(x), 0), simp38(I, 3), S * 1.5]), explica: `S = ${fmt(S)} (exato: ${fmt(I.ex)}).`, vis: areaVis(I, n, 'simp') };
    const err = { enunciado: `${en}<br>S = ${fmt(S)}, exato ${fmt(I.ex)}`, texto: 'Qual é o erro |S − exato|?', ...opcoes(Math.abs(S - I.ex), [Math.abs(trap(I, n) - I.ex), Math.abs(S - I.ex) * 16, S], f6), explica: `Erro = ${f6(Math.abs(S - I.ex))}: bem menor que o do trapézio.`, vis: areaVis(I, n, 'simp') };
    const sing = { enunciado: '∫ de 0 a 1 de √x · g(x) dx: a derivada explode em x = 0.', texto: 'Antes de aplicar Simpson, é melhor...', ...opcoes('mudar de variável (x = t²)', ['usar n = 3', 'ignorar o primeiro nó', 'trocar por trapézio com n = 2']), explica: 'Com x = t², dx = 2t dt e a singularidade some.', vis: { type: 'plot', f: Math.sqrt, xmin: 0, xmax: 1, ymin: 0 } };
    const passos = nivel === 'F' ? [par, H, SS] : nivel === 'M' ? [par, H, pesos, SS] : [pesos, SS, err, sing];
    return { passos, erroFinal: Math.abs(S - I.ex) };
  },

  simpson38(nivel) {
    const I = pickOne(nivel === 'F' ? [INT[0], INT[3]] : INT);
    const n = nivel === 'D' ? 6 : 3;
    const h = (I.b - I.a) / n, S = simp38(I, n);
    const xs = nodes(I, n);
    const en = `∫ de ${fmt(I.a)} a ${fmt(I.b)} de ${I.tex} dx, Simpson 3/8 com n = ${n}.`;
    const mult = { enunciado: en, texto: 'Para Simpson 3/8, n precisa ser múltiplo de...', ...opcoes('3', ['2', '4', '8']), explica: 'Cada cúbica usa 3 intervalos (4 pontos).', vis: areaVis(I, n, 'simp38') };
    const H = { enunciado: en, texto: 'h = (b − a)/n =', ...opcoes(h, [h * 2, h / 2, (I.b - I.a) / 2]), explica: `h = ${fmt(h)}.`, vis: areaVis(I, n, 'simp38') };
    const pesos = { enunciado: en, texto: `Pesos para n = ${n}:`, ...opcoes(n === 3 ? '1, 3, 3, 1' : '1, 3, 3, 2, 3, 3, 1', [n === 3 ? '1, 4, 4, 1' : '1, 4, 2, 4, 2, 4, 1', n === 3 ? '1, 2, 2, 1' : '1, 3, 3, 3, 3, 3, 1', n === 3 ? '3, 1, 1, 3' : '1, 2, 2, 2, 2, 2, 1']), explica: 'Pesos 1, 3, 3, 2, 3, 3, …, 1 vezes 3h/8.', vis: areaVis(I, n, 'simp38') };
    const SS = { enunciado: `${en}<br>h = ${fmt(h)}; f nos nós: ${xs.map((x) => fmt(I.f(x))).join('; ')}`, texto: 'S = (3h/8)·[f₀ + 3f₁ + 3f₂ + …] =', ...opcoes(S, [trap(I, n), (h / 3) * xs.reduce((s, x) => s + I.f(x), 0), S * 0.75, I.ex + 0.5]), explica: `S = ${fmt(S)} (exato: ${fmt(I.ex)}).`, vis: areaVis(I, n, 'simp38') };
    const impar = { enunciado: 'Você tem n = 5 intervalos (ímpar).', texto: 'Como integrar com Simpson?', ...opcoes('1/3 em 2 intervalos + 3/8 nos 3 últimos', ['Só 1/3 em todos', 'Só 3/8 em todos', 'Impossível']), explica: 'Combine: 1/3 em n − 3 = 2 intervalos e 3/8 nos 3 últimos.', vis: { type: 'texto', html: '5 = 2 + 3' } };
    const passos = nivel === 'F' ? [mult, H, SS] : nivel === 'M' ? [mult, H, pesos, SS] : [pesos, SS, impar];
    return { passos, erroFinal: Math.abs(S - I.ex) };
  },

  euler(nivel) {
    const E = pickOne(nivel === 'F' ? [EDO[0], EDO[2]] : EDO);
    const h = nivel === 'D' ? 0.2 : 0.1;
    const ys = [E.y0];
    for (let k = 0; k < 3; k++) ys.push(ys[k] + h * E.f(k * h, ys[k]));
    const en = (k) => `${E.tex}, y(0) = ${E.y0}, h = ${fmt(h)}. t${'₀₁₂'[k]} = ${fmt(k * h)}, y${'₀₁₂'[k]} = ${fmt(ys[k])}.`;
    const vis = (k) => ({ type: 'plot', f: E.ex, xmin: 0, xmax: 3.4 * h, pts: ys.slice(0, k + 1).map((y, i) => ({ x: i * h, y })), polyline: true, ghost: { pts: [{ x: (k + 1) * h, y: ys[k + 1], label: `y${'₁₂₃'[k]}` }], line: { x: k * h, y: ys[k], m: E.f(k * h, ys[k]), x2: (k + 1) * h } } });
    const step = (k) => ({ enunciado: en(k), texto: `y${'₁₂₃'[k]} = y + h·f(t, y) =`, ...opcoes(ys[k + 1], [ys[k] + E.f(k * h, ys[k]), ys[k] + h * E.f((k + 1) * h, ys[k]), ys[k] * h, E.ex((k + 1) * h) + 0.01]), explica: `${fmt(ys[k])} + ${fmt(h)}·${fmt(E.f(k * h, ys[k]))} = ${fmt(ys[k + 1])}.`, vis: vis(k), erro: 'divergencia' });
    const f0 = { enunciado: en(0), texto: 'Inclinação no início: f(t₀, y₀) =', ...opcoes(E.f(0, E.y0), [E.y0 * h, 0, E.f(0, E.y0) + 1]), explica: `f(0; ${E.y0}) = ${fmt(E.f(0, E.y0))}.`, vis: vis(0) };
    const ordem = { enunciado: 'Método de Euler.', texto: 'O erro global é proporcional a...', ...opcoes('h', ['h²', 'h⁴', '1/h']), explica: 'Euler é de 1ª ordem: passo pela metade, erro pela metade.', vis: { type: 'texto', html: 'erro global = O(h)' } };
    const estab = { enunciado: 'y′ = −λy com λ = 10 (decai rápido).', texto: 'O Euler explícito é estável se h <', ...opcoes('0,2', ['0,1', '2', '10']), explica: 'Precisa |1 − λh| < 1 → h < 2/λ = 0,2.', vis: { type: 'texto', html: 'h < 2/λ' }, erro: 'divergencia' };
    const rig = { enunciado: 'EDO rígida: λ = 10⁶.', texto: 'Qual é a saída mais esperta?', ...opcoes('Euler implícito', ['h = 1', 'mais passos de Euler explícito com h = 0,1', 'arredondar y']), explica: 'O implícito é estável para qualquer h nessa equação.', vis: { type: 'texto', html: 'yₖ₊₁ = yₖ + h·f(tₖ₊₁, yₖ₊₁)' } };
    const passos = nivel === 'F' ? [f0, step(0), step(1)] : nivel === 'M' ? [step(0), step(1), step(2), ordem] : [step(0), step(1), estab, rig];
    return { passos, erroFinal: Math.abs(ys[2] - E.ex(2 * h)) };
  },

  rk4(nivel) {
    const E = pickOne(nivel === 'F' ? [EDO[0], EDO[2]] : EDO);
    const h = nivel === 'D' ? 0.2 : 0.1;
    const t = 0, y = E.y0;
    const k1 = E.f(t, y), k2 = E.f(t + h / 2, y + (h * k1) / 2), k3 = E.f(t + h / 2, y + (h * k2) / 2), k4 = E.f(t + h, y + h * k3);
    const y1 = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const en = `${E.tex}, y(0) = ${y}, h = ${fmt(h)}.`;
    const vis = { type: 'plot', f: E.ex, xmin: 0, xmax: 1.6 * h, pts: [{ x: 0, y, label: 'y₀' }], ghost: { pts: [{ x: h, y: y1, label: 'y₁' }] } };
    const K1 = { enunciado: en, texto: 'k₁ = f(t₀, y₀) =', ...opcoes(k1, [k1 * h, k1 + 1, 0]), explica: `k₁ = ${fmt(k1)}.`, vis };
    const K2 = { enunciado: `${en}<br>k₁ = ${fmt(k1)}`, texto: 'k₂ = f(t₀ + h/2, y₀ + h·k₁/2) =', ...opcoes(k2, [E.f(t + h, y + h * k1), E.f(t, y + (h * k1) / 2), k1]), explica: `k₂ = ${fmt(k2)}.`, vis };
    const K3 = { enunciado: `${en}<br>k₂ = ${fmt(k2)}`, texto: 'k₃ = f(t₀ + h/2, y₀ + h·k₂/2) =', ...opcoes(k3, [k2, E.f(t + h / 2, y + h * k2), k1]), explica: `k₃ = ${fmt(k3)}.`, vis };
    const K4 = { enunciado: `${en}<br>k₃ = ${fmt(k3)}`, texto: 'k₄ = f(t₀ + h, y₀ + h·k₃) =', ...opcoes(k4, [E.f(t + h / 2, y + h * k3), k3, E.f(t + h, y + (h * k3) / 2)]), explica: `k₄ = ${fmt(k4)}.`, vis };
    const Y1 = { enunciado: `${en}<br>k₁ = ${fmt(k1)}, k₂ = ${fmt(k2)}, k₃ = ${fmt(k3)}, k₄ = ${fmt(k4)}`, texto: 'y₁ = y₀ + (h/6)·(k₁ + 2k₂ + 2k₃ + k₄) =', ...opcoes(y1, [y + (h / 4) * (k1 + k2 + k3 + k4) + 0.0005, y + h * k1, y + (h / 6) * (k1 + k2 + k3 + k4)], f6), explica: `y₁ = ${f6(y1)} (exato: ${f6(E.ex(h))}).`, vis };
    const est = { enunciado: 'RK4 em y′ = λy com λ < 0.', texto: 'É estável só se λh ≥', ...opcoes('−2,785', ['−2', '−1', '0']), explica: 'A região de estabilidade do RK4 vai até ≈ −2,785 no eixo real.', vis: { type: 'texto', html: 'λh ∈ [−2,785; 0]' }, erro: 'divergencia' };
    const passos = nivel === 'F' ? [K1, K2, K3] : nivel === 'M' ? [K1, K2, K3, K4, Y1] : [K2, K3, K4, Y1, est];
    return { passos, erroFinal: Math.abs(y1 - E.ex(h)) };
  },
};

// ------------------------------------------------------------------ registro e chefões
export const METODOS = { ...M0, ...M1, ...M2, ...M3, ...M4 };
const MODULOS = [['truncamento', 'cancelamento', 'overflow'], ['bissecao', 'falsaPosicao', 'pontoFixo', 'newton', 'secante'], ['gauss', 'pivoteamento', 'lu', 'jacobi', 'seidel'], ['lagrange', 'spline', 'minimosQuadrados'], ['trapezio', 'simpson13', 'simpson38', 'euler', 'rk4']];
const BOSS_MIX = {
  chefe0: [['truncamento', 'D', 2], ['cancelamento', 'M', 2], ['overflow', 'M', 2]],
  chefe1: [['bissecao', 'M', 2], ['falsaPosicao', 'M', 1], ['pontoFixo', 'M', 1], ['newton', 'M', 2], ['secante', 'M', 1]],
  chefe2: [['gauss', 'M', 2], ['pivoteamento', 'M', 1], ['lu', 'M', 2], ['jacobi', 'M', 1], ['seidel', 'M', 1]],
  chefe3: [['lagrange', 'M', 2], ['spline', 'M', 2], ['minimosQuadrados', 'M', 2]],
  chefe4: [['trapezio', 'M', 2], ['simpson13', 'M', 1], ['simpson38', 'M', 1], ['euler', 'M', 2], ['rk4', 'M', 1]],
};

export function gerarFase(metodo, nivel) {
  if (METODOS[metodo]) return METODOS[metodo](nivel);
  const mix = metodo === 'final' ? MODULOS.map((m) => [pickOne(m), 'M', 2]) : BOSS_MIX[metodo];
  const passos = [];
  for (const [m, nv, k] of mix) passos.push(...METODOS[m](nv).passos.slice(0, k));
  return { passos, erroFinal: 1e-6 };
}

export function passosEsperados(metodo, nivel) {
  try { return gerarFase(metodo, nivel).passos.length; } catch (e) { return 5; }
}
