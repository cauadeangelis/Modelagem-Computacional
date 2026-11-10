/* Numera Academy v14 — Laboratório (página "laboratorio", aberta pelo Terminal).
   Três abas, todas com o motor do próprio site e sem dependências:
   1) Tátil: arraste x₀ (Newton), x₀ e x₁ (Secante) ou [a, b] (Bisseção e Falsa Posição) direto no gráfico; as 3
      primeiras iterações (tangentes, cordas, pontos médios) se redesenham na hora. Mostra a condição de Fourier,
      avisa quando a tangente fica quase horizontal, pinta as bacias de convergência do Newton e faz a Corrida de
      Convergência (|xₖ − x*| de cada método, iteração por iteração).
   2) Linhas: quebra-cabeça de troca de equações (Eᵢ ↔ Eⱼ) com o medidor ao vivo do critério das linhas (α) e de
      Sassenfeld (β); quando máx β < 1 acende o selo "Convergência garantida!". Inclui o botão "Testar sensibilidade"
      (ruído de 1% em b) com o número de condição κ(A).
   3) Fenômenos: a comporta da barragem (raiz de f(h) = 0, Bisseção ou Newton) e a treliça da ponte (Gauss-Seidel
      relaxando os nós; com as equações fora de ordem, a ponte balança e cai).
   Script clássico que compartilha as variáveis do site (s, safe, btn, heading, render…), como os outros de js/paginas. */
'use strict';
s.lt = { aba: 'tatil', fn: 0, met: 'newton', x0: null, x1: null, a: null, b: null, bacias: false, corrida: 0, sis: 0, ordem: null, gs: null, sens: null, fen: 'comporta', comp: null, trel: null };
const LT_FUN = [
  { id: 'cubica', t: 'x³ − x − 2', f: x => x ** 3 - x - 2, df: x => 3 * x * x - 1, d2: x => 6 * x, lo: -1.5, hi: 2.6, x0: 2, x1: 1.4, a: 1, b: 2 },
  { id: 'tres', t: 'x³ − 3x', f: x => x ** 3 - 3 * x, df: x => 3 * x * x - 3, d2: x => 6 * x, lo: -2.4, hi: 2.4, x0: 1.3, x1: 1.9, a: 1, b: 2.2 },
  { id: 'ciclo', t: 'x³ − 2x + 2', f: x => x ** 3 - 2 * x + 2, df: x => 3 * x * x - 2, d2: x => 6 * x, lo: -2.4, hi: 1.8, x0: 0, x1: -1, a: -2, b: -1 },
  { id: 'atan', t: 'arctg x', f: Math.atan, df: x => 1 / (1 + x * x), d2: x => -2 * x / (1 + x * x) ** 2, lo: -4, hi: 4, x0: 1.2, x1: 2, a: -1, b: 2 },
  { id: 'cos', t: 'cos x − x', f: x => Math.cos(x) - x, df: x => -Math.sin(x) - 1, d2: x => -Math.cos(x), lo: -1, hi: 2.2, x0: 1, x1: 0.5, a: 0, b: 1 },
];
const LT_MET = [['newton', 'Newton-Raphson'], ['secant', 'Secante'], ['bisection', 'Bisseção'], ['falseposition', 'Falsa Posição']];
const LT_COR = ['#3B5BDB', '#D2462E', '#11805A', '#8A3FD1', '#C2591B'];
const ltF = () => s.lt.customF || LT_FUN[s.lt.fn] || LT_FUN[0];
function ltIni() { const F = ltF(); for (const k of ['x0', 'x1', 'a', 'b']) if (s.lt[k] === null) s.lt[k] = F[k]; }
const lnum = (v, c = 4) => (Number.isFinite(v) ? num(Number(v.toFixed(c))) : '—');

/* ---------- contas ---------- */
function ltPassos(met, F, d, n = 3) {
  const f = F.f, out = [];
  if (met === 'newton') { let x = d.x0; for (let k = 0; k < n; k++) { const fx = f(x), dfx = F.df(x), nx = x - fx / dfx; out.push({ x, fx, dfx, nx }); if (!Number.isFinite(nx)) break; x = nx; } }
  if (met === 'secant') { let a = d.x0, b = d.x1; for (let k = 0; k < n; k++) { const fa = f(a), fb = f(b), nx = b - fb * (b - a) / (fb - fa); out.push({ a, b, fa, fb, nx }); if (!Number.isFinite(nx)) break; a = b; b = nx; } }
  if (met === 'bisection' || met === 'falseposition') { let a = Math.min(d.a, d.b), b = Math.max(d.a, d.b); for (let k = 0; k < n; k++) { const fa = f(a), fb = f(b); if (fa === 0 || fb === 0) { const nx = fa === 0 ? a : b; out.push({a,b,fa,fb,nx,fx:0}); break; } if (fa * fb > 0) break; const nx = met === 'bisection' ? (a + b) / 2 : (a * fb - b * fa) / (fb - fa), fx = f(nx); out.push({ a, b, fa, fb, nx, fx }); if (fx === 0) break; if (fa * fx < 0) b = nx; else a = nx; } }
  return out;
}
// iterações até 10⁻¹² (para a corrida e as bacias)
function ltSerie(met, F, d, max = 40) {
  const xs = [], f = F.f;
  if (met === 'newton') { let x = d.x0; for (let k = 0; k < max; k++) { const nx = x - f(x) / F.df(x); if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) break; xs.push(nx); if (Math.abs(nx - x) < 1e-13) break; x = nx; } }
  else if (met === 'secant') { let a = d.x0, b = d.x1; for (let k = 0; k < max; k++) { const fa = f(a), fb = f(b); if (fb === fa) break; const nx = b - fb * (b - a) / (fb - fa); if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) break; xs.push(nx); if (Math.abs(nx - b) < 1e-13) break; a = b; b = nx; } }
  else { let a = Math.min(d.a, d.b), b = Math.max(d.a, d.b); if (f(a) * f(b) > 0) return xs; for (let k = 0; k < max; k++) { const fa = f(a), fb = f(b), nx = met === 'bisection' ? (a + b) / 2 : (a * fb - b * fa) / (fb - fa), fx = f(nx); xs.push(nx); if (fx === 0 || b - a < 1e-14) break; if (fa * fx < 0) b = nx; else a = nx; } }
  return xs;
}
function ltRaizes(F) { const rs = []; const N = 400; let px = F.lo, pf = F.f(px); for (let i = 1; i <= N; i++) { const x = F.lo + (F.hi - F.lo) * i / N, fx = F.f(x); if (pf * fx <= 0) { let a = px, b = x; for (let k = 0; k < 80; k++) { const m = (a + b) / 2; if (F.f(a) * F.f(m) <= 0) b = m; else a = m; } const r = (a + b) / 2; if (!rs.some(q => Math.abs(q - r) < 1e-6)) rs.push(r); } px = x; pf = fx; } return rs; }
function ltBacias(F, raizes, N = 220) {
  const out = [];
  for (let i = 0; i < N; i++) {
    let x = F.lo + (F.hi - F.lo) * (i + 0.5) / N, ok = -1;
    for (let k = 0; k < 60; k++) { const d = F.df(x); if (!d) break; const nx = x - F.f(x) / d; if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) break; if (Math.abs(nx - x) < 1e-12) { x = nx; break; } x = nx; }
    if (Math.abs(F.f(x)) < 1e-9) ok = raizes.findIndex(r => Math.abs(r - x) < 1e-6);
    out.push(ok);
  }
  return out;
}

/* ---------- gráfico ---------- */
const LT_W = 640, LT_H = 340, LT_M = { l: 40, r: 16, t: 16, b: 30 };
function ltEscala(F) {
  const ys = []; for (let i = 0; i <= 200; i++) { const y = F.f(F.lo + (F.hi - F.lo) * i / 200); if (Number.isFinite(y)) ys.push(y); }
  if (!ys.length) ys.push(-1, 1); let lo = Math.min(...ys), hi = Math.max(...ys); const lim = Math.max(2, Math.abs(F.f(F.lo)), Math.abs(F.f(F.hi))); lo = Math.max(lo, -lim); hi = Math.min(hi, lim);
  if (lo > -0.5) lo = -0.5; if (hi < 0.5) hi = 0.5; const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  const X = x => LT_M.l + (x - F.lo) / (F.hi - F.lo) * (LT_W - LT_M.l - LT_M.r), Y = y => LT_M.t + (hi - Math.max(lo, Math.min(hi, y))) / (hi - lo) * (LT_H - LT_M.t - LT_M.b);
  const inv = px => F.lo + (px - LT_M.l) / (LT_W - LT_M.l - LT_M.r) * (F.hi - F.lo);
  return { X, Y, inv, lo, hi };
}
function ltPlot() {
  ltIni(); const F = ltF(), E = ltEscala(F), { X, Y } = E, L = s.lt, met = L.met, P = ltPassos(met, F, L);
  let curva = ''; for (let i = 0; i <= 260; i++) { const x = F.lo + (F.hi - F.lo) * i / 260, y = F.f(x); if (!Number.isFinite(y)) { curva += ' '; continue; } curva += (i && Number.isFinite(F.f(F.lo + (F.hi - F.lo) * (i - 1) / 260)) ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); }
  const y0 = Y(0), ticks = []; for (let t = Math.ceil(F.lo); t <= F.hi; t++) ticks.push(t);
  let iter = '';
  P.forEach((p, k) => {
    if (![p.nx, p.x ?? p.a, p.fx ?? p.fa].every(Number.isFinite) || Math.abs(p.nx) > 1e6 || !Number.isFinite(F.f(p.nx))) return;
    const c = LT_COR[k % LT_COR.length];
    if (met === 'newton') iter += `<line x1="${X(p.x)}" y1="${Y(p.fx)}" x2="${X(p.nx)}" y2="${y0}" stroke="${c}" stroke-width="2.4"/><line x1="${X(p.nx)}" y1="${y0}" x2="${X(p.nx)}" y2="${Y(F.f(p.nx))}" stroke="${c}" stroke-dasharray="4 3"/><circle cx="${X(p.x)}" cy="${Y(p.fx)}" r="4" fill="${c}"/><text x="${X(p.nx)}" y="${y0 + 16}" font-size="11" text-anchor="middle" fill="${c}">x${'₁₂₃'[k]}</text>`;
    else if (met === 'secant') iter += `<line x1="${X(p.a)}" y1="${Y(p.fa)}" x2="${X(p.nx)}" y2="${y0}" stroke="${c}" stroke-width="2.2"/><circle cx="${X(p.b)}" cy="${Y(p.fb)}" r="4" fill="${c}"/><line x1="${X(p.nx)}" y1="${y0}" x2="${X(p.nx)}" y2="${Y(F.f(p.nx))}" stroke="${c}" stroke-dasharray="4 3"/><text x="${X(p.nx)}" y="${y0 + 16}" font-size="11" text-anchor="middle" fill="${c}">x${'₂₃₄'[k]}</text>`;
    else { const yb = LT_H - LT_M.b + 2 - (k + 1) * 0; iter += `${met === 'falseposition' ? `<line x1="${X(p.a)}" y1="${Y(p.fa)}" x2="${X(p.b)}" y2="${Y(p.fb)}" stroke="${c}" stroke-width="2"/>` : ''}<line x1="${X(p.a)}" y1="${y0 - 10 - k * 7}" x2="${X(p.b)}" y2="${y0 - 10 - k * 7}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".75"/><circle cx="${X(p.nx)}" cy="${y0}" r="4.5" fill="${c}"/><text x="${X(p.nx)}" y="${y0 + 16}" font-size="11" text-anchor="middle" fill="${c}">x${'₁₂₃'[k]}</text>`; void yb; }
  });
  const alcas = met === 'newton' ? [['x0', L.x0]] : met === 'secant' ? [['x0', L.x0], ['x1', L.x1]] : [['a', L.a], ['b', L.b]];
  const handles = alcas.map(([k, v]) => `<g class="lt-alca" data-lt-handle="${k}"><line x1="${X(v)}" y1="${LT_M.t}" x2="${X(v)}" y2="${LT_H - LT_M.b}" stroke="#8A3FD1" stroke-dasharray="2 4" opacity=".5"/><circle cx="${X(v)}" cy="${y0}" r="11" fill="#8A3FD1" fill-opacity=".25" stroke="#8A3FD1" stroke-width="2.5"/><text x="${X(v)}" y="${LT_M.t + 12}" font-size="12" font-weight="700" text-anchor="middle" fill="#8A3FD1">${{ x0: 'x₀', x1: 'x₁', a: 'a', b: 'b' }[k]}</text></g>`).join('');
  let faixa = '', legenda = '';
  if (L.bacias) {
    const rs = ltRaizes(F), B = ltBacias(F, rs), w = (LT_W - LT_M.l - LT_M.r) / B.length, CB = ['#3B5BDB', '#11805A', '#D2462E', '#8A3FD1', '#C2591B'];
    faixa = B.map((ix, i) => `<rect x="${(LT_M.l + i * w).toFixed(1)}" y="${LT_H - LT_M.b + 8}" width="${(w + 0.4).toFixed(1)}" height="10" fill="${ix < 0 ? '#9AA3AB' : CB[ix % CB.length]}"/>`).join('');
    legenda = `<p class="lt-legenda">Bacias do Newton: cada cor é a raiz que o método encontra partindo daquele x₀ (${rs.map((r, i) => `<span style="color:${CB[i % CB.length]}">■ x* ≈ ${lnum(r, 4)}</span>`).join(' · ')}; <span style="color:#6B747C">■ não converge</span>). Perto de onde f′ = 0, as cores se misturam: a tangente quase horizontal manda o x para longe.</p>`;
  }
  const svg = `<svg class="lt-svg" id="lt-svg" viewBox="0 0 ${LT_W} ${LT_H + (L.bacias ? 14 : 0)}" role="img" aria-label="Gráfico de f(x) = ${safe(F.t)} com as três primeiras iterações de ${safe(LT_MET.find(m => m[0] === met)[1])}">
    <rect x="0" y="0" width="${LT_W}" height="${LT_H + 14}" fill="transparent"/>
    <line x1="${LT_M.l}" y1="${y0}" x2="${LT_W - LT_M.r}" y2="${y0}" stroke="currentColor" opacity=".45"/>${ticks.map(t => `<line x1="${X(t)}" y1="${y0 - 4}" x2="${X(t)}" y2="${y0 + 4}" stroke="currentColor" opacity=".45"/><text x="${X(t)}" y="${LT_H - 8}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${t}</text>`).join('')}
    <path d="${curva}" fill="none" stroke="currentColor" stroke-width="2.4"/>${iter}${handles}${faixa}</svg>`;
  return { svg, P, legenda };
}
function ltDiagnostico(F, L) {
  if (L.met === 'newton') {
    const fx = F.f(L.x0), d = F.df(L.x0), fo = fx * F.d2(L.x0) > 0, plano = Math.abs(d) < 0.25;
    return `<p class="lt-diag ${plano ? 'bad' : fo ? 'ok' : ''}">${plano ? `⚠️ f′(x₀) ≈ ${lnum(d, 3)}: tangente quase horizontal. O próximo x é arremessado para longe.` : fo ? `✓ Condição de Fourier: f(x₀)·f″(x₀) > 0. O Newton tende a convergir sem pular a raiz.` : `Condição de Fourier falhou: f(x₀)·f″(x₀) ≤ 0. Pode convergir, mas o 1º passo pode pular para o outro lado da raiz.`}</p>`;
  }
  if (L.met === 'bisection' || L.met === 'falseposition') { const fa = F.f(Math.min(L.a, L.b)), fb = F.f(Math.max(L.a, L.b)); return `<p class="lt-diag ${fa * fb < 0 ? 'ok' : 'bad'}">${fa * fb < 0 ? '✓ f(a)·f(b) < 0: há troca de sinal (Teorema 1).' : '⚠️ f(a) e f(b) com o mesmo sinal: o método não pode começar. Arraste a ou b.'}</p>`; }
  return '<p class="lt-diag">A Secante não precisa de troca de sinal nem de derivada: usa a reta pelos dois últimos pontos.</p>';
}
function ltTabela(P, met) {
  if (!P.length) return '';
  const cab = met === 'newton' ? ['k', 'xₖ', 'f(xₖ)', 'f′(xₖ)', 'xₖ₊₁'] : met === 'secant' ? ['k', 'xₖ₋₁', 'xₖ', 'xₖ₊₁'] : ['k', 'a', 'b', 'xₖ', 'f(xₖ)'];
  const lin = P.map((p, k) => met === 'newton' ? [k, p.x, p.fx, p.dfx, p.nx] : met === 'secant' ? [k + 1, p.a, p.b, p.nx] : [k + 1, p.a, p.b, p.nx, p.fx]);
  return `<div class="table-scroll"><table class="lt-tab"><thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${lin.map(r => `<tr>${r.map((v, i) => `<td>${i ? lnum(v, 6) : v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
// Corrida de Convergência: log₁₀|xₖ − x*| de cada método, iteração por iteração
function ltCorridaDados() {
  const F = ltF(), L = s.lt, rs = ltRaizes(F), series = LT_MET.map(([m, n]) => ({ m, n, xs: ltSerie(m, F, L, 30) }));
  const alvoDe = xs => (xs.length ? rs.reduce((a, r) => (Math.abs(r - xs[xs.length - 1]) < Math.abs(a - xs[xs.length - 1]) ? r : a), rs[0] ?? xs[xs.length - 1]) : null);
  return series.map(sr => { const al = alvoDe(sr.xs); return { ...sr, erros: al === null ? [] : sr.xs.map(x => Math.max(1e-16, Math.abs(x - al))) }; });
}
function ltCorridaSvg(passo) {
  const D = ltCorridaDados(), W = 640, H = 240, l = 46, r = 12, t = 12, b = 28, K = 25, X = k => l + k / K * (W - l - r), Y = e => t + (Math.min(1, Math.max(-16, Math.log10(e))) - 1) / -17 * (H - t - b);
  const cores = { newton: '#3B5BDB', secant: '#8A3FD1', bisection: '#11805A', falseposition: '#D2462E' };
  const linhas = D.map(sr => { const pts = sr.erros.slice(0, passo).map((e, k) => `${X(k + 1).toFixed(1)},${Y(e).toFixed(1)}`); return pts.length ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${cores[sr.m]}" stroke-width="2.6"/>${pts.length ? `<circle cx="${pts[pts.length - 1].split(',')[0]}" cy="${pts[pts.length - 1].split(',')[1]}" r="4" fill="${cores[sr.m]}"/>` : ''}` : ''; }).join('');
  const gy = [0, -4, -8, -12, -16].map(p => `<line x1="${l}" y1="${Y(10 ** p)}" x2="${W - r}" y2="${Y(10 ** p)}" stroke="currentColor" opacity=".12"/><text x="${l - 6}" y="${Y(10 ** p) + 4}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">10${p ? String(p).replace('-', '⁻').replace(/\d+/, d => d.split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')) : '⁰'}</text>`).join('');
  return `<svg class="lt-corrida-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Corrida de convergência: erro de cada método por iteração">${gy}<line x1="${l}" y1="${H - b}" x2="${W - r}" y2="${H - b}" stroke="currentColor" opacity=".4"/><text x="${(l + W) / 2}" y="${H - 6}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">iteração k</text>${linhas}</svg>
    <p class="lt-legenda">${D.map(sr => `<span style="color:${cores[sr.m]}">■ ${sr.n}: ${sr.erros.length ? (sr.erros.some(e => e <= 1e-12) ? `${sr.erros.findIndex(e => e <= 1e-12) + 1} iterações até 10⁻¹²` : 'não atingiu 10⁻¹² nos passos calculados') : 'não começa com estes dados'}</span>`).join(' · ')}. A Bisseção desce em linha reta (ordem 1); a Secante faz uma curva (ordem ≈ 1,618) e o Newton mergulha (ordem 2) quando chega perto da raiz.</p>`;
}
function ltAbaTatil() {
  const F = ltF(), L = s.lt, { svg, P, legenda } = ltPlot(), alcas = L.met === 'newton' ? ['x0'] : L.met === 'secant' ? ['x0', 'x1'] : ['a', 'b'];
  const nome = { x0: 'x₀', x1: 'x₁', a: 'a', b: 'b' };
  return `<div class="lt-ctrl">${tabs(LT_FUN.map((q, i) => [String(i), 'f(x) = ' + q.t]), String(L.fn), 'lt-fn')}${tabs(LT_MET, L.met, 'lt-met')}</div>
    ${L.customF ? `<p><b>Sua equação:</b> ${safe(F.t)}</p>` : ''}<div class="lt-grafico" id="lt-grafico">${svg}</div>
    <div class="lt-sliders">${alcas.map(k => `<label class="lt-slider" for="lt-${k}"><span>${nome[k]} = <b id="lt-v-${k}">${lnum(L[k], 3)}</b></span><input type="range" id="lt-${k}" data-lt-range="${k}" min="${F.lo}" max="${F.hi}" step="${((F.hi - F.lo) / 400).toFixed(4)}" value="${L[k]}"></label>`).join('')}</div>
    <div id="lt-info">${ltDiagnostico(F, L)}${ltTabela(P, L.met)}${legenda}</div>
    <div class="row-actions">${btn(L.bacias ? 'Esconder as bacias' : '🎨 Mostrar bacias de convergência (Newton)', 'lt-bacias', 'ghost')}${btn('▶ Corrida de Convergência', 'lt-corrida', 'primary')}</div>
    ${L.corrida ? `<section class="card lt-corrida" aria-labelledby="lt-c-t"><h3 id="lt-c-t">Corrida de Convergência</h3><div id="lt-corrida-g">${ltCorridaSvg(L.corrida)}</div></section>` : ''}`;
}

/* ---------- Linhas: quebra-cabeça de dominância diagonal ---------- */
const LT_SIS = [
  { t: 'Sistema 3×3', A: [[2, 10, 1], [10, 2, 1], [1, 1, 5]], b: [13, 13, 7] },
  { t: 'Sistema 4×4', A: [[1, 1, 8, 1], [9, 1, 1, 2], [1, 7, 1, 1], [2, 1, 1, 10]], b: [11, 13, 10, 14] },
  { t: 'Sistema dos slides (Sassenfeld)', A: [[1, 0.5, -0.1, 0.1], [0.2, 1, -0.2, -0.1], [-0.1, -0.2, 1, 0.2], [0.1, 0.3, 0.2, 1]], b: [0.2, -2.6, 1, -2.5] },
];
const ltSis = () => s.lt.customSis || LT_SIS[s.lt.sis] || LT_SIS[0];
function ltOrdem() { const S = ltSis(); if (!s.lt.ordem || s.lt.ordem.length !== S.A.length) s.lt.ordem = S.A.map((_, i) => i); return s.lt.ordem; }
function ltCriterios(A) {
  const n = A.length, alfa = A.map((r, i) => r.reduce((t, v, j) => t + (j === i ? 0 : Math.abs(v)), 0) / Math.abs(r[i]));
  const beta = []; for (let i = 0; i < n; i++) { let t = 0; for (let j = 0; j < n; j++) if (j !== i) t += Math.abs(A[i][j]) * (j < i ? beta[j] : 1); beta.push(t / Math.abs(A[i][i])); }
  return { alfa, beta, maxA: Math.max(...alfa), maxB: Math.max(...beta) };
}
function ltSeidel(A, b, n = 6) { const m = A.length; let x = Array(m).fill(0); const linhas = []; for (let k = 1; k <= n; k++) { const ant = x.slice(); for (let i = 0; i < m; i++) { let t = b[i]; for (let j = 0; j < m; j++) if (j !== i) t -= A[i][j] * x[j]; x[i] = t / A[i][i]; } const d = Math.max(...x.map((v, i) => Math.abs(v - ant[i]))) / Math.max(...x.map(Math.abs)); linhas.push({ k, x: x.slice(), d }); if (!x.every(Number.isFinite) || Math.max(...x.map(Math.abs)) > 1e6) break; } return linhas; }
function ltGauss(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (!Number.isFinite(M[c][c]) || M[c][c] === 0) throw Error('Sistema singular: não há solução única para testar a sensibilidade.'); for (let r = c + 1; r < n; r++) { const m = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= m * M[c][k]; } } const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let t = M[i][n]; for (let k = i + 1; k < n; k++) t -= M[i][k] * x[k]; x[i] = t / M[i][i]; } return x; }
function ltKappa(A) { const n = A.length, inv = A.map((_, j) => ltGauss(A, A.map((__, i) => (i === j ? 1 : 0)))), nI = Math.max(...A.map((_, i) => inv.reduce((t, col) => t + Math.abs(col[i]), 0))), nA = Math.max(...A.map(r => r.reduce((t, v) => t + Math.abs(v), 0))); return nA * nI; }
function ltSensibilidade(A, b) {
  const x = ltGauss(A, b), sinais = b.map((_, i) => (i % 2 ? -1 : 1)), b2 = b.map((v, i) => v * (1 + 0.01 * sinais[i])), x2 = ltGauss(A, b2), k = ltKappa(A);
  const dx = Math.max(...x.map((v, i) => Math.abs(x2[i] - v))) / (Math.max(...x.map(Math.abs)) || 1), db = Math.max(...b.map((v, i) => Math.abs(b2[i] - v))) / (Math.max(...b.map(Math.abs)) || 1);
  return { x, x2, k, dx, db, digitos: Math.max(0, Math.log10(k)) };
}
function ltAbaLinhas() {
  const S = ltSis(), ord = ltOrdem(), A = ord.map(i => S.A[i]), b = ord.map(i => S.b[i]), c = ltCriterios(A), n = A.length, vars = A.map((_, i) => 'x' + '₁₂₃₄₅₆'[i]);
  const termo = (v, j) => `${v < 0 ? '− ' : j ? '+ ' : ''}${num(Math.abs(v))}${vars[j]}`;
  const barra = (v, rot) => `<span class="lt-medidor ${v < 1 ? 'ok' : 'bad'}" title="${rot} = ${lnum(v, 3)}"><i style="width:${Math.min(100, v / 2 * 100).toFixed(0)}%"></i><b>${rot} = ${lnum(v, 3)}</b></span>`;
  const gs = s.lt.gs, sens = s.lt.sens;
  return `<div class="lt-ctrl">${tabs(LT_SIS.map((q, i) => [String(i), q.t]), String(s.lt.sis), 'lt-sis')}</div>
    <p>Arraste as equações (ou use ↑ ↓) para deixar o maior coeficiente de cada linha na diagonal. O medidor recalcula na hora o critério das linhas (αᵢ) e o de Sassenfeld (βᵢ).</p>
    <ol class="lt-linhas" id="lt-linhas" aria-label="Equações do sistema, na ordem atual">${ord.map((orig, pos) => `<li class="lt-linha" data-lt-pos="${pos}"><span class="lt-pega" data-lt-pega="${pos}" aria-hidden="true">⋮⋮</span><span class="lt-eq">E${'₁₂₃₄₅₆'[orig]}: ${S.A[orig].map(termo).join(' ')} = ${num(S.b[orig])}</span><span class="lt-diag-el ${Math.abs(S.A[orig][pos]) >= S.A[orig].reduce((t, v, j) => t + (j === pos ? 0 : Math.abs(v)), 0) ? 'ok' : ''}">diagonal: ${num(S.A[orig][pos])}</span><span class="lt-mover"><button type="button" class="btn text" data-act="lt-sobe" data-index="${pos}" aria-label="Subir a equação E${'₁₂₃₄₅₆'[orig]}" ${pos ? '' : 'disabled'}>↑</button><button type="button" class="btn text" data-act="lt-desce" data-index="${pos}" aria-label="Descer a equação E${'₁₂₃₄₅₆'[orig]}" ${pos < n - 1 ? '' : 'disabled'}>↓</button></span></li>`).join('')}</ol>
    <div class="lt-medidores"><div><h3>Critério das linhas</h3>${c.alfa.map((v, i) => barra(v, 'α' + '₁₂₃₄₅₆'[i])).join('')}</div><div><h3>Sassenfeld</h3>${c.beta.map((v, i) => barra(v, 'β' + '₁₂₃₄₅₆'[i])).join('')}</div>
      <div class="lt-selo ${c.maxB < 1 ? 'ok' : ''}" role="status">${c.maxB < 1 ? `<b>✓ Convergência garantida!</b><span>máx β = ${lnum(c.maxB, 3)} < 1${c.maxA < 1 ? ' (e máx α < 1)' : ''}</span>` : `<b>Sem garantia</b><span>máx β = ${lnum(c.maxB, 3)} ≥ 1: troque as linhas</span>`}</div></div>
    <div class="row-actions">${btn('▶ Rodar Gauss-Seidel (6 iterações)', 'lt-gs', 'primary')}${btn('🎲 Testar sensibilidade (ruído de 1% em b)', 'lt-sens', 'ghost')}${btn('Embaralhar', 'lt-embaralha', 'text')}</div>
    ${gs ? `<div class="table-scroll"><table class="lt-tab"><caption>Gauss-Seidel nesta ordem, a partir de X⁽⁰⁾ = 0</caption><thead><tr><th scope="col">k</th>${A.map((_, i) => `<th scope="col">${vars[i]}</th>`).join('')}<th scope="col">d⁽ᵏ⁾</th></tr></thead><tbody>${gs.map(l => `<tr><td>${l.k}</td>${l.x.map(v => `<td>${lnum(v, 5)}</td>`).join('')}<td>${lnum(l.d, 5)}</td></tr>`).join('')}</tbody></table></div><p class="lt-diag ${gs[gs.length - 1].d < 1e-3 ? 'ok' : 'bad'}">${gs[gs.length - 1].d < 1e-3 ? '✓ Convergindo: o erro relativo cai a cada iteração.' : '⚠️ Nesta ordem o método não está convergindo (ou converge devagar).'}</p>` : ''}
    ${s.lt.sensError ? `<p class="alert" role="alert">${safe(s.lt.sensError)}</p>` : ''}${sens ? `<div class="callout"><strong>Sensibilidade (b com ruído de ±1%)</strong><p>x = (${sens.x.map(v => lnum(v, 4)).join('; ')}) → x̃ = (${sens.x2.map(v => lnum(v, 4)).join('; ')}).</p><p>O b mudou ${lnum(sens.db * 100, 2)}%; o x mudou ${lnum(sens.dx * 100, 2)}%. Número de condição κ∞(A) ≈ ${lnum(sens.k, 1)}: dá para perder até ${lnum(sens.digitos, 1)} algarismos significativos.</p></div>` : ''}`;
}

/* ---------- Fenômenos: comporta (raízes) e treliça (sistemas) ---------- */
const LT_COMP = { f: h => 0.8 * h ** 1.5 + 0.2 * h - 1.2, df: h => 1.2 * Math.sqrt(h) + 0.2, a: 0, b: 3, x0: 2.8, tol: 1e-4, limite: 12 };
function ltCompPassos(met, x0 = LT_COMP.x0) {
  const C = LT_COMP, out = []; let a = C.a, b = C.b, h = x0, prev = 0.5;
  for (let k = 1; k <= 30; k++) {
    let nh;
    if (h < 0 || !Number.isFinite(h)) { out.push({ k, h, fx: NaN, conv: false }); break; }
    if (met === 'newton') nh = h - C.f(h) / C.df(h);
    else if (met === 'secant') { const den = C.f(h) - C.f(prev); nh = den ? h - C.f(h) * (h - prev) / den : NaN; prev = h; }
    else { nh = met === 'falseposition' ? (a * C.f(b) - b * C.f(a)) / (C.f(b) - C.f(a)) : (a + b) / 2; if (C.f(a) * C.f(nh) < 0) b = nh; else a = nh; }
    const fx = nh < 0 || !Number.isFinite(nh) ? NaN : C.f(nh);
    const conv = Math.abs(fx) <= 1e-6 && (met === 'bisection' ? (b - a) / 2 < C.tol : Math.abs(nh - h) < C.tol);
    out.push({ k, h: nh, fx, conv }); h = nh; if (conv || nh < 0 || !Number.isFinite(nh)) break;
  }
  return out;
}
function ltComporta() {
  const st = s.lt.comp || (s.lt.comp = { met: 'bisection', k: 0 }), P = ltCompPassos(st.met, st.x0 ?? LT_COMP.x0), k = Math.min(st.k, P.length), atual = k ? P[k - 1] : null;
  const h = atual ? atual.h : null, res = atual ? Math.abs(atual.fx) : 1.2, trans = k > LT_COMP.limite && !P.slice(0, LT_COMP.limite).some(p => p.conv), travou = atual && (!Number.isFinite(atual.h) || atual.h < 0), conv = atual && atual.conv;
  const nivel = Math.min(1, 0.45 + k * 0.045), abertura = h === null || !Number.isFinite(h) ? 0.15 : Math.max(0.05, Math.min(1, h / 3)), vel = Math.max(0.35, 2.4 - Math.min(2, res * 2.5)).toFixed(2);
  const yAgua = 220 - nivel * 150, gateY = 220 - abertura * 120;
  const gotas = Array.from({ length: 10 }, (_, i) => `<circle class="lt-gota" cx="${300 + i * 22}" cy="${214 - (i % 3) * 6}" r="3.2" style="animation-duration:${vel}s;animation-delay:${(-i * 0.13).toFixed(2)}s"/>`).join('');
  return `<p>Vazão que sai pela comporta menos a que chega: f(h) = 0,8h<sup>1,5</sup> + 0,2h − 1,2 = 0. Cada iteração move o pistão para a altura hₖ; a água corre mais rápido quanto maior o desequilíbrio |f(hₖ)|. Se a conta demorar mais de ${LT_COMP.limite} iterações, o reservatório transborda.</p>
    <div class="lt-ctrl">${tabs([['bisection', 'Bisseção em [0; 3]'], ['newton', 'Newton'], ['falseposition', 'Falsa Posição'], ['secant', 'Secante']], st.met, 'lt-comp-met')}</div>${['newton','secant'].includes(st.met) ? `<label class="field" for="ex-comp-x0">Altura inicial h₀ (m)<input id="ex-comp-x0" type="number" min="-1" max="10" step="0.1" value="${st.x0 ?? LT_COMP.x0}"></label><p class="fine">Secante usa também h anterior = 0,5. Experimente h₀ negativo para observar o limite físico.</p>` : ''}
    <svg class="lt-fen ${trans ? 'transbordou' : ''} ${travou ? 'travou' : ''} ${conv ? 'estavel' : ''}" viewBox="0 0 560 240" role="img" aria-label="Comporta da barragem: ${k ? `iteração ${k}, h = ${lnum(h, 4)}` : 'antes da primeira iteração'}">
      <rect x="0" y="0" width="560" height="240" fill="transparent"/>
      <path d="M20 ${yAgua.toFixed(1)} H236 V220 H20 Z" class="lt-agua"/>${trans ? `<path d="M20 ${yAgua - 14} H250 V${yAgua} H20Z" class="lt-agua" opacity=".7"/>` : ''}
      <rect x="236" y="40" width="24" height="180" class="lt-muro"/><rect x="232" y="${gateY.toFixed(1)}" width="32" height="${(220 - gateY).toFixed(1)}" class="lt-pistao"/>
      <rect x="244" y="20" width="8" height="${(gateY - 20).toFixed(1)}" class="lt-haste"/>
      <path d="M264 ${(220 - abertura * 60).toFixed(1)} Q 330 ${(222 - abertura * 30).toFixed(1)} 540 222 V 226 H264Z" class="lt-agua" opacity=".55"/>${k && !travou ? gotas : ''}
      <line x1="10" y1="226" x2="550" y2="226" class="lt-chao"/>
      <text x="300" y="34" class="lt-fen-txt">${!k ? 'Aperte ▶ para a 1ª iteração' : travou ? '🚨 h < 0: a comporta travou no concreto!' : trans ? '🌊 Demorou demais: o reservatório transbordou!' : conv ? `✓ Equilíbrio: h* ≈ ${lnum(h, 4)} m` : `h${String(k).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('')} = ${lnum(h, 4)} m · |f| = ${lnum(res, 4)}`}</text>
    </svg>
    <div class="row-actions">${btn('▶ Próxima iteração', 'lt-comp-passo', 'primary', conv || travou || k >= P.length ? 'disabled' : '')}${btn('Recomeçar', 'lt-comp-zera', 'ghost')}</div>
    ${k ? `<div class="table-scroll"><table class="lt-tab"><thead><tr><th scope="col">k</th><th scope="col">hₖ</th><th scope="col">f(hₖ)</th></tr></thead><tbody>${P.slice(0, k).map(p => `<tr><td>${p.k}</td><td>${lnum(p.h, 6)}</td><td>${lnum(p.fx, 6)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
}
const LT_TREL = { K: [[4, -1, 0], [-1, 4, -1], [0, -1, 4]], F: [1, 2, 1] };
function ltTrelica() {
  const st = s.lt.trel || (s.lt.trel = { ordem: 'boa', u: [0, 0, 0], k: 0, no: -1 });
  const ord = st.ordem === 'boa' ? [0, 1, 2] : [1, 0, 2], A = ord.map(i => LT_TREL.K[i]), b = ord.map(i => LT_TREL.F[i]);
  const r = LT_TREL.K.map((row, i) => row.reduce((t, v, j) => t + v * st.u[j], 0) - LT_TREL.F[i]), caiu = Math.max(...st.u.map(Math.abs)) > 8;
  const cor = v => { const e = Math.min(1, Math.abs(v) / 2); return `hsl(${(120 * (1 - e)).toFixed(0)},70%,42%)`; };
  const xs = [90, 200, 310, 420], escala = 18, ys = [0, ...st.u.map(v => Math.max(-90, Math.min(90, v * escala))), 0];
  const nos = [[40, 120], ...[0, 1, 2].map(i => [xs[i] + 50, 120 + ys[i + 1]]), [520, 120]];
  const barras = nos.slice(0, -1).map((p, i) => `<line x1="${p[0]}" y1="${p[1]}" x2="${nos[i + 1][0]}" y2="${nos[i + 1][1]}" stroke="${caiu ? '#9AA3AB' : cor(r[Math.min(2, Math.max(0, i - (i === 3 ? 1 : 0)))] || 0)}" stroke-width="7" stroke-linecap="round" ${caiu && i === 2 ? 'transform="rotate(18 300 140)"' : ''}/>`).join('');
  const diag = [0, 1, 2].map(i => `<line x1="${nos[i + 1][0]}" y1="${nos[i + 1][1]}" x2="${(nos[i][0] + nos[i + 1][0]) / 2 + 30}" y2="60" stroke="${caiu ? '#9AA3AB' : cor(r[i])}" stroke-width="4"/>`).join('');
  return `<p>A ponte tem três nós; o equilíbrio K·u = F dá os deslocamentos uᵢ. Cada varredura do Gauss-Seidel relaxa os nós um por um, e a cor das barras vai do vermelho (força desequilibrada, resíduo grande) ao verde (equilíbrio). Neste exemplo, trocar as equações faz o método divergir e a ponte cair. Falhar nos critérios suficientes, por si só, não prova divergência em qualquer sistema.</p>
    <div class="lt-ctrl">${tabs([['boa', 'Equações em ordem (diagonal dominante)'], ['ruim', 'Equações trocadas']], st.ordem, 'lt-trel-ord')}</div>
    <svg class="lt-fen ${caiu ? 'caiu' : ''}" viewBox="0 0 560 220" role="img" aria-label="Treliça da ponte: ${caiu ? 'a ponte caiu' : `varredura ${st.k}, deslocamentos ${st.u.map(v => lnum(v, 3)).join(', ')}`}">
      <rect x="0" y="0" width="560" height="220" fill="transparent"/>
      <path d="M10 130 h40 v70 h-40z M510 130 h40 v70 h-40z" class="lt-muro"/>${diag}${barras}
      ${nos.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i && i < 4 && st.no === i - 1 ? 11 : 8}" class="lt-no ${i && i < 4 && st.no === i - 1 ? 'agora' : ''}"/>`).join('')}
      <text x="280" y="24" class="lt-fen-txt">${caiu ? '💥 A ponte caiu: o Gauss-Seidel divergiu nesta ordem' : st.k ? `Varredura ${st.k} · máx |resíduo| = ${lnum(Math.max(...r.map(Math.abs)), 4)}` : 'Aperte ▶ para a 1ª varredura'}</text>
    </svg>
    <div class="row-actions">${btn('▶ Varredura de Gauss-Seidel', 'lt-trel-passo', 'primary', caiu || st.busy ? 'disabled' : '')}${btn('Recomeçar', 'lt-trel-zera', 'ghost')}</div>
    <p class="fine">Ordem atual das equações: ${ord.map(i => 'E' + '₁₂₃'[i]).join(', ')} · u = (${st.u.map(v => lnum(v, 4)).join('; ')}).</p>`;
  void A; void b;
}
function ltAbaFenomenos() { return `<div class="lt-ctrl">${tabs([['comporta', '🌊 Comporta da barragem (raízes)'], ['trelica', '🌉 Treliça da ponte (sistemas)'], ['termica', 'Malha térmica'], ['drone', 'Drone']], s.lt.fen, 'lt-fen')}</div>${s.lt.fen === 'termica' ? exTermica() : s.lt.fen === 'drone' ? exDrone() : s.lt.fen === 'trelica' ? ltTrelica() + exPivoPonte() : ltComporta()}`; }

/* ---------- página ---------- */
function laboratorio() {
  const L = s.lt;
  const corpo = exPainel(L.aba);
  return `<div class="wrap page-body lt-page">${heading('Laboratório', 'Matemática tátil', 'Arraste os chutes iniciais e veja as iterações se redesenharem, monte o sistema que converge e acompanhe cada iteração movendo comportas, pontes, uma malha térmica e um drone.', btn('← Voltar ao Terminal', 'nav', 'ghost', 'data-page="lab"'))}
    <div class="terminal-tools">${tabs([['tatil', '✋ Tátil (raízes)'], ['linhas', '🧩 Troca de linhas (sistemas)'], ['fenomenos', '🌊 Fenômenos'], ['pontos', 'Pontos e integração'], ['precisao', 'Precisão'], ['extras', 'Pesquisa avançada']], L.aba, 'lt-aba')}</div>
    <section class="card lt-card">${corpo}</section></div>`;
}
function ltRedesenharPlot() {
  const g = document.getElementById('lt-grafico'), info = document.getElementById('lt-info'); if (!g) return;
  const { svg, P, legenda } = ltPlot(); g.innerHTML = svg; if (info) info.innerHTML = ltDiagnostico(ltF(), s.lt) + ltTabela(P, s.lt.met) + legenda;
  for (const k of ['x0', 'x1', 'a', 'b']) { const v = document.getElementById('lt-v-' + k), r = document.getElementById('lt-' + k); if (v) v.textContent = lnum(s.lt[k], 3); if (r && document.activeElement !== r) r.value = s.lt[k]; }
  if (s.page === 'lab' && s.lt.customF) for (const k of ['x0','x1','a','b']) { s[k] = String(s.lt[k]); const input = document.getElementById(k); if (input) input.value = s[k]; }
  if (s.lt.corrida) { const c = document.getElementById('lt-corrida-g'); if (c) c.innerHTML = ltCorridaSvg(99); }
}
let ltCorridaTimer = null;
function ltHandle(act, el) {
  const L = s.lt, id = el.dataset.id, ix = Number(el.dataset.index);
  if (act === 'lt-aba') { L.aba = id; render(); return true; }
  if (act === 'lt-fn') { L.customF = null; L.fn = Number(id); L.x0 = L.x1 = L.a = L.b = null; L.corrida = 0; render(); return true; }
  if (act === 'lt-met') { L.met = id; render(); return true; }
  if (act === 'lt-bacias') { L.bacias = !L.bacias; render(); return true; }
  if (act === 'lt-corrida') {
    clearInterval(ltCorridaTimer); L.corrida = 1; render();
    const reduz = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } })();
    if (reduz) { L.corrida = 30; const c = document.getElementById('lt-corrida-g'); if (c) c.innerHTML = ltCorridaSvg(30); return true; }
    ltCorridaTimer = setInterval(() => { if (!['laboratorio','lab'].includes(s.page) || !L.corrida) { clearInterval(ltCorridaTimer); return; } L.corrida++; const c = document.getElementById('lt-corrida-g'); if (c) c.innerHTML = ltCorridaSvg(L.corrida); if (L.corrida >= 26) clearInterval(ltCorridaTimer); }, 380);
    return true;
  }
  if (act === 'lt-sis') { L.customSis = null; L.sis = Number(id); L.ordem = null; L.gs = null; L.sens = null; L.sensError = ''; render(); return true; }
  if (act === 'lt-sobe' || act === 'lt-desce') { const o = ltOrdem(), j = act === 'lt-sobe' ? ix - 1 : ix + 1; if (j >= 0 && j < o.length) { [o[ix], o[j]] = [o[j], o[ix]]; L.gs = null; L.sens = null; L.sensError = ''; render(); const b = document.querySelector(`[data-act="${act}"][data-index="${j}"]`) || document.querySelector(`[data-lt-pos="${j}"] button`); if (b) b.focus(); } return true; }
  if (act === 'lt-embaralha') { const o = ltOrdem(); for (let i = o.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [o[i], o[k]] = [o[k], o[i]]; } L.gs = null; L.sens = null; L.sensError = ''; render(); return true; }
  if (act === 'lt-gs') { const S = ltSis(), o = ltOrdem(); L.gs = ltSeidel(o.map(i => S.A[i]), o.map(i => S.b[i])); render(); return true; }
  if (act === 'lt-sens') { const S = ltSis(), o = ltOrdem(); try { L.sens = ltSensibilidade(o.map(i => S.A[i]), o.map(i => S.b[i])); L.sensError = ''; } catch (err) { L.sens = null; L.sensError = err.message; } render(); return true; }
  if (act === 'lt-fen') { L.fen = id; render(); return true; }
  if (act === 'lt-comp-met') { L.comp = { met: id, k: 0 }; render(); return true; }
  if (act === 'lt-comp-passo') { L.comp.k++; render(); document.querySelector('[data-act="lt-comp-passo"]:not([disabled])')?.focus(); return true; }
  if (act === 'lt-comp-zera') { L.comp.k = 0; render(); return true; }
  if (act === 'lt-trel-ord') { L.trel = { ordem: id, u: [0, 0, 0], k: 0, no: -1 }; render(); return true; }
  if (act === 'lt-trel-zera') { L.trel.token = (L.trel.token || 0) + 1; L.trel.busy = false; L.trel.u = [0, 0, 0]; L.trel.k = 0; L.trel.no = -1; render(); return true; }
  if (act === 'lt-trel-passo') {
    const st = L.trel; if (st.busy) return true; const token = st.token = (st.token || 0) + 1; st.busy = true; const ord = st.ordem === 'boa' ? [0, 1, 2] : [1, 0, 2], A = ord.map(i => LT_TREL.K[i]), b = ord.map(i => LT_TREL.F[i]);
    // a i-ésima equação (na ordem atual) atualiza a i-ésima incógnita, como no Gauss-Seidel
    const nos = [0, 1, 2], passo = i => { let t = b[i]; for (let j = 0; j < 3; j++) if (j !== i) t -= A[i][j] * st.u[j]; st.u[i] = t / A[i][i]; st.no = i; };
    const reduz = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } })();
    if (reduz) { nos.forEach(passo); st.k++; st.no = -1; st.busy = false; render(); return true; }
    nos.forEach((i, n) => setTimeout(() => { if (L.trel !== st || st.token !== token) return; passo(i); if (n === 2) { st.k++; setTimeout(() => { if (L.trel !== st || st.token !== token) return; st.no = -1; st.busy = false; if (['laboratorio','lab','case'].includes(s.page)) render(); }, 250); } render(); }, n * 280));
    return true;
  }
  return false;
}
// arrastar as alças do gráfico e as equações
let ltArrasto = null;
document.addEventListener('pointerdown', e => {
  if (!['laboratorio','lab','case'].includes(s.page)) return;
  const h = e.target.closest && e.target.closest('[data-lt-handle]');
  if (h) { ltArrasto = { tipo: 'alca', k: h.dataset.ltHandle }; e.preventDefault(); return; }
  const p = e.target.closest && e.target.closest('[data-lt-pega]');
  if (p) { ltArrasto = { tipo: 'linha', de: Number(p.dataset.ltPega) }; p.closest('.lt-linha').classList.add('arrastando'); e.preventDefault(); }
});
document.addEventListener('pointermove', e => {
  if (!ltArrasto || !['laboratorio','lab'].includes(s.page)) return;
  if (ltArrasto.tipo === 'alca') {
    const svg = document.getElementById('lt-svg'); if (!svg) return; const box = svg.getBoundingClientRect(), F = ltF(), E = ltEscala(F);
    const px = (e.clientX - box.left) / box.width * LT_W; s.lt[ltArrasto.k] = Math.max(F.lo, Math.min(F.hi, Number(E.inv(px).toFixed(4))));
    if (!ltArrasto.fila) { ltArrasto.fila = true; (window.requestAnimationFrame || (f => setTimeout(f, 16)))(() => { if (ltArrasto) ltArrasto.fila = false; ltRedesenharPlot(); }); }
  } else {
    const itens = Array.from(document.querySelectorAll('.lt-linha')); itens.forEach(li => li.classList.remove('alvo'));
    const alvo = itens.findIndex(li => { const r = li.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; }); if (alvo >= 0) { itens[alvo].classList.add('alvo'); ltArrasto.para = alvo; }
  }
});
document.addEventListener('pointerup', () => {
  if (!ltArrasto) return; const a = ltArrasto; ltArrasto = null;
  if (a.tipo === 'linha' && a.para !== undefined && a.para !== a.de) { const o = ltOrdem(), [v] = o.splice(a.de, 1); o.splice(a.para, 0, v); s.lt.gs = null; s.lt.sens = null; }
  if (a.tipo === 'linha') render();
});
document.addEventListener('input', e => { const k = e.target && e.target.dataset && e.target.dataset.ltRange; if (k && ['laboratorio','lab','case'].includes(s.page)) { s.lt[k] = Number(e.target.value); ltRedesenharPlot(); } });

document.addEventListener('change', e => { if (e.target.id === 'ex-comp-x0') { const x = Number(e.target.value); if (Number.isFinite(x) && x >= -1 && x <= 10 && x !== s.lt.comp.x0) { s.lt.comp.x0 = x; s.lt.comp.k = 0; render(); } } });
document.addEventListener('pointercancel', () => { ltArrasto = null; document.querySelectorAll('.lt-linha').forEach(e => e.classList.remove('arrastando','alvo')); });
