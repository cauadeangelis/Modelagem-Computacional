/* Extensões do Laboratório e painéis embutidos no Terminal, nas Trilhas e Missões. */
'use strict';
const EX = window.NumeraExperimentos;
s.ex = { aba: null, precisao: 4, extras: false, fp: 'cos(x)', fpX: '0.5', fpN: 8, pontos: '0; 0\n1; 1\n2; 4\n3; 9\n4; 16', metodo: 'newton', erro: '', dados: null, calor: null, voo: { met: 'polinomio', k: 0 }, contexto: null };
const exTabela = (titulo, cab, rows) => `<div class="pp-lousa"><button type="button" class="btn text lousa-btn" data-act="lousa">▶ Ver construção da tabela</button><span class="lousa-aviso sr-only" aria-live="polite"></span><div class="table-scroll" tabindex="0" role="region" aria-label="Tabela com rolagem horizontal"><table class="lt-tab"><caption>${safe(titulo)}</caption><thead><tr>${cab.map(c => `<th scope="col">${safe(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${typeof v === 'number' ? lnum(v, 8) : safe(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
function exGrafico(series, pontos = [], areas = [], label = 'Gráfico do experimento') {
  const all = series.flatMap(s => s.p).concat(pontos).filter(p => p.every(Number.isFinite));
  if (!all.length) return '<p>Nenhum ponto finito para desenhar.</p>';
  const xmin = Math.min(...all.map(p => p[0])), xmax = Math.max(...all.map(p => p[0]));
  const ymin = Math.min(0, ...all.map(p => p[1])), ymax = Math.max(1, ...all.map(p => p[1]));
  const X = x => 45 + (x - xmin) / (xmax - xmin || 1) * 490, Y = y => 230 - (y - ymin) / (ymax - ymin || 1) * 205;
  const path = ps => ps.filter(p => p.every(Number.isFinite)).map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join(' ');
  return `<svg class="lt-fen ex-plot" viewBox="0 0 560 265" role="img" aria-label="${safe(label)}"><path d="M45 ${Y(0)}H540" stroke="currentColor" opacity=".4"/>${areas.map(p => `<path d="${path([[p[0][0], 0], ...p, [p[p.length - 1][0], 0]])}Z" fill="currentColor" opacity=".12"/>`).join('')}${series.map((v, i) => `<path d="${path(v.p)}" fill="none" stroke="${LT_COR[i % LT_COR.length]}" stroke-width="2.5"/>`).join('')}${pontos.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4" fill="currentColor"/>`).join('')}<text x="45" y="255" fill="currentColor">${lnum(xmin, 2)}</text><text x="510" y="255" fill="currentColor">${lnum(xmax, 2)} x</text><text x="4" y="25" fill="currentColor">${lnum(ymax, 2)}</text><text x="4" y="230" fill="currentColor">${lnum(ymin, 2)}</text></svg>`;
}
function exTermica() {
  const c = s.ex.calor || (s.ex.calor = { gs: Array(9).fill(20), ja: Array(9).fill(20), k: 0, celula: 0, tol: 0.1, dt: 0.5, T: 100, tempo: 0, historico: [] });
  const grade = (v, titulo) => `<div><h3>${titulo}</h3><p class="fine">Borda superior: 100 °C · demais bordas: 20 °C</p><div class="ex-heat" role="group" aria-label="${titulo}">${v.map((t, i) => `<div class="${i === c.celula - 1 ? 'on' : ''}" style="background:hsl(${220 - Math.min(100, Math.max(20, t)) * 2},70%,82%)"><small>T${i + 1}</small><b>${lnum(t, 2)} °C</b></div>`).join('')}</div></div>`;
  const residual = v => { let r = 0; for (let i = 0; i < 9; i++) { const row = Math.floor(i / 3), col = i % 3; const sum = (row ? v[i - 3] : 100) + (row < 2 ? v[i + 3] : 20) + (col ? v[i - 1] : 20) + (col < 2 ? v[i + 1] : 20); r = Math.max(r, Math.abs(4 * v[i] - sum)); } return r; };
  const rg = residual(c.gs), rj = residual(c.ja);
  return `<h2>Malha térmica do reator</h2><p>Modelo didático de equilíbrio: 4Tᵢ − ΣTᵥᵢ𝓏 = 0. Avance célula por célula e compare: Seidel usa imediatamente a temperatura nova; Jacobi guarda a varredura anterior.</p><div class="ex-grid">${grade(c.gs, 'Gauss-Seidel')}${grade(c.ja, 'Jacobi')}</div><p role="status">Varreduras completas: ${c.k} · célula: ${c.celula}/9 · resíduo Seidel: ${lnum(rg, 4)} · Jacobi: ${lnum(rj, 4)}</p><div class="row-actions">${btn('Próxima célula', 'ex-calor-celula', 'primary')}${btn('Completar varredura', 'ex-calor-varredura', 'ghost')}${btn('Reiniciar malha', 'ex-calor-reset', 'text')}</div><label class="field" for="ex-tol">Tolerância do resíduo<select id="ex-tol"><option value="0.1" ${c.tol === 0.1 ? 'selected' : ''}>0,1 (criteriosa)</option><option value="30" ${c.tol === 30 ? 'selected' : ''}>30 (frouxa)</option></select></label><p class="lt-diag ${rg <= c.tol && rg > 0.1 ? 'bad' : ''}">${rg <= c.tol ? rg > 0.1 ? 'O controlador aceitou a tolerância, mas há desequilíbrio térmico relevante. Reduza ε antes de desligar o cooler.' : 'Equilíbrio aproximado dentro de 0,1 no resíduo.' : 'Cooler ligado: ainda não atingiu a tolerância.'}</p><h3>Resfriamento no tempo (Euler)</h3><p>T′ = −(T − 20), T(0) = 100 °C. Estabilidade exige 0 &lt; Δt &lt; 2. Temperaturas negativas ou acima do início sinalizam falha numérica neste modelo.</p><label class="field" for="ex-dt">Passo de tempo<select id="ex-dt">${[0.5, 1.5, 2.5].map(x => `<option value="${x}" ${c.dt === x ? 'selected' : ''}>${num(x)} s</option>`).join('')}</select></label><p role="status">t = ${lnum(c.tempo, 2)} s · T = ${lnum(c.T, 3)} °C · ${c.dt < 2 ? 'passo estável' : 'passo instável: oscilações crescentes'}</p>${btn('Avançar Euler', 'ex-euler', 'primary', Math.abs(c.T) > 1e6 ? 'disabled' : '')}${btn('Reiniciar resfriamento', 'ex-euler-reset', 'ghost')}${c.historico.length ? exTabela('Evolução térmica', ['t (s)', 'Euler (°C)', 'Solução exata (°C)'], c.historico) : ''}`;
}
function exDrone() {
  const v = s.ex.voo, d = EX.drone(v.met), k = Math.min(v.k, 200), atual = d.rota[k], fim = d.colisao >= 0 && k >= d.colisao;
  const X = x => 40 + (x + 1) * 240, Y = y => 220 - y * 85;
  const rota = d.rota.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' ');
  const cena = `<svg class="lt-fen ex-plot" viewBox="0 0 560 270" role="img" aria-label="Drone ${fim ? 'colidiu com o solo' : 'voando'} em x=${lnum(atual[0], 2)}, altura=${lnum(atual[1], 3)}"><path d="M15 220H545V255H15Z" fill="var(--sage)"/><path d="M15 220H545" stroke="currentColor"/><text x="20" y="245" fill="currentColor" font-size="12">Solo · y = 0</text><path d="${rota}" stroke="var(--plot)" stroke-width="2.5" fill="none"/>${d.pontos.map(([x,y]) => `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="6" ry="11" stroke="var(--go-text)" stroke-width="2" fill="none"/>`).join('')}<g transform="translate(${X(atual[0])} ${Y(atual[1])})" fill="var(--ink)" stroke="var(--ink)"><path d="M-16 -5L16 5M-16 5L16 -5" stroke-width="3"/><rect x="-6" y="-4" width="12" height="8" rx="3"/><ellipse cx="-17" cy="-7" rx="9" ry="2"/><ellipse cx="17" cy="-7" rx="9" ry="2"/><circle cy="5" r="2" fill="var(--go)"/></g><text x="20" y="18" fill="currentColor" font-size="12">${fim ? 'Colisão: troque o interpolador' : `${k}/200 · ${v.met === 'spline' ? 'Spline cúbica' : 'Polinômio de grau 10'}`}</text></svg>`;
  return `<h2>Drone em vento cruzado</h2><p>Onze argolas equidistantes seguem y = 0,25 + 1/(1 + 25x²). Compare o polinômio de grau 10 com a spline cúbica natural. Solo: y = 0. A bateria usa ∫[1 + (dy/dx)²] dx (unidades didáticas), calculada por trapézios.</p>${tabs([['polinomio', 'Polinômio (Runge)'], ['spline', 'Spline cúbica']], v.met, 'ex-drone-met')}${cena}<p role="status">Posição: (${lnum(atual[0], 2)}; ${lnum(atual[1], 3)}) · consumo até aqui: ${lnum(d.acumulada[k], 3)} · rota completa: ${lnum(d.energia, 3)} unidades. ${fim ? 'Colisão com o terreno: o polinômio oscilou abaixo do solo.' : k === 200 ? 'Voo concluído.' : 'Voo em andamento.'}</p><div class="row-actions">${btn('Avançar voo', 'ex-drone-passo', 'primary', fim || k === 200 ? 'disabled' : '')}${btn('Recomeçar voo', 'ex-drone-reset', 'ghost')}</div>`;
}
function exPrecisao() {
  const d = EX.mantissa(s.ex.precisao);
  return `<h2>Régua de ponto flutuante</h2><p>x² − 10000x + 1 = 0. Na raiz pequena, subtrair 10000 − √(10⁸ − 4) cancela algarismos. Cada operação é arredondada para a mantissa escolhida.</p><label class="field" for="ex-precisao">Mantissa: <output id="ex-precisao-v">${d.t}</output> algarismos<input type="range" id="ex-precisao" min="2" max="10" value="${d.t}"></label><div id="ex-precisao-resultado">${exPrecisaoResultado(d)}</div>`;
}
function exPivoPonte() {
  const A = [[0.00001, 1], [1, 1]], b = [1, 2], sem = EX.gaussCurto(A, b, false), com = EX.gaussCurto(A, b, true);
  return `<details><summary>Gauss: ponte com pivô quase zero</summary><p>Modelo reduzido de dois nós: 0,00001u₁ + u₂ = 1; u₁ + u₂ = 2. Máquina de quatro algarismos. A linha desenhada mostra os deslocamentos calculados em cada nó.</p>${exGrafico([{ p: [[0, 0], [1, sem.x[0]], [2, sem.x[1]], [3, 0]] }, { p: [[0, 0], [1, com.x[0]], [2, com.x[1]], [3, 0]] }], [], [], 'Deformação dos dois nós: azul sem pivoteamento; laranja com pivoteamento')}${exTabela('Efeito do pivoteamento parcial', ['Execução', 'u₁', 'u₂', 'Resíduo máximo'], [['Sem pivoteamento (azul)', ...sem.x, sem.residuo], ['Com pivoteamento (laranja)', ...com.x, com.residuo]])}<p>O pivô 0,00001 gera um multiplicador grande e perde informação ao arredondar. Trocar as linhas antes de eliminar evita esse erro neste sistema.</p></details>`;
}
function exPrecisaoResultado(d) {
  return exTabela('Cancelamento na raiz pequena', ['Forma', 'Resultado', 'Erro relativo'], [['Direta: (10000 − √Δ)/2', d.direta, d.erroDireta], ['Racionalizada: 2/(10000 + √Δ)', d.racionalizada, d.erroEstavel]]) + `<p>√Δ arredondada: <code>${d.raiz.toPrecision(d.t)}</code>. Referência em dupla precisão: <code>${d.referencia.toPrecision(12)}</code>.</p><p class="lt-diag ${d.direta === 0 ? 'bad' : ''}">${d.direta === 0 ? 'Todos os algarismos da diferença se perderam: a conta direta produziu zero.' : 'Aumentar a precisão recupera parte dos algarismos; a forma racionalizada evita a subtração problemática.'}</p>`;
}
function exPontos() {
  const e = s.ex, r = e.dados;
  return `<h2>Interpolação, Ajuste e Integração</h2><p>Digite de 2 a 12 pontos, um por linha: <code>x; y</code>. Use ponto ou vírgula decimal e ponto e vírgula como separador. Simpson exige espaçamento uniforme e quantidade ímpar de pontos.</p><label class="field" for="ex-pontos">Tabela de pontos<textarea id="ex-pontos" rows="6" spellcheck="false">${safe(e.pontos)}</textarea></label><label class="field" for="ex-metodo">Método<select id="ex-metodo">${[['newton', 'Newton (diferenças divididas)'], ['lagrange', 'Lagrange'], ['ajuste', 'Mínimos Quadrados'], ['trapezios', 'Trapézios'], ['simpson', 'Simpson 1/3']].map(([v, t]) => `<option value="${v}" ${e.metodo === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>${btn('Calcular e desenhar', 'ex-pontos-calcular', 'primary')}${e.erro ? `<p class="alert" role="alert">${safe(e.erro)}</p>` : ''}${r ? r : ''}`;
}
function exCalcularPontos() {
  const e = s.ex;
  try {
    const p = EX.pontos(e.pontos.trim().split(/\n/).map(l => l.split(';').map(v => v.trim() ? Number(v.trim().replace(',', '.')) : NaN)));
    const ip = EX.interpolar(p), aj = EX.ajuste(p), met = e.metodo;
    const f = met === 'ajuste' ? aj.f : met === 'lagrange' ? ip.lagrange : ip.newton;
    const amostra = fn => Array.from({ length: 161 }, (_, i) => { const x = p[0][0] + (p[p.length - 1][0] - p[0][0]) * i / 160; return [x, fn(x)]; });
    let info = '', areas = [], series = [{ p: amostra(f) }];
    if (met === 'simpson' || met === 'trapezios') {
      const integral = EX.integrar(p, met);
      areas = integral.parcelas.map(r => met === 'trapezios' ? r.pontos : Array.from({ length: 25 }, (_, i) => { const x = r.a + (r.b - r.a) * i / 24; return [x, EX.interpolar(r.pontos).newton(x)]; }));
      series = areas.map(p => ({ p }));
      info = `<p class="formula">Integral aproximada = ${lnum(integral.valor, 8)}</p>` + exTabela('Áreas orientadas por painel', ['a', 'b', 'Área'], integral.parcelas.map(r => [r.a, r.b, r.area]));
    } else if (met === 'ajuste') info = `<p class="formula">y ≈ ${lnum(aj.a, 8)}x + (${lnum(aj.b, 8)}) · soma dos resíduos² = ${lnum(aj.sse, 8)}</p>` + exTabela('Cálculo centrado da reta', ['x médio', 'y médio', 'Σ(x−x̄)²', 'Σ(x−x̄)(y−ȳ)'], [[aj.mx, aj.my, aj.sxx, aj.sxy]]) + exTabela('Resíduos do ajuste', ['x', 'y observado', 'y ajustado', 'Resíduo'], p.map(([x, y]) => [x, y, aj.f(x), y - aj.f(x)]));
    else info = exTabela('Diferenças divididas de Newton (mesmo polinômio de Lagrange)', ['x', ...p.map((_, i) => `ordem ${i}`)], p.map((r, i) => [r[0], ...p.map((_, j) => ip.tabela[i][j] ?? '—')])) + `<p>Newton: p(x) = Σcⱼ∏ₘ&lt;ⱼ(x−xₘ). Lagrange: p(x) = Σyᵢ∏ⱼ≠ᵢ(x−xⱼ)/(xᵢ−xⱼ). Os dois passam pelos mesmos pontos.</p>`;
    if (series.some(sr => sr.p.some(r => !r.every(Number.isFinite)))) throw Error('Escala numérica excessiva; reduza a magnitude dos pontos.');
    e.dados = exGrafico(series, p, areas, 'Pontos fornecidos e curva do método escolhido') + info; e.erro = '';
  } catch (err) { e.erro = err.message; e.dados = null; }
}
function exExtras() {
  const e = s.ex;
  let corpo = '';
  if (e.extras) {
    try {
      const g = M.parseFunction(e.fp), x0 = Number(e.fpX.replace(',', '.')); if (!Number.isFinite(x0)) throw Error('Digite um x₀ finito.');
      const rows = [], teia = []; let x = x0;
      for (let k = 0; k < e.fpN; k++) { const y = g(x); if (!Number.isFinite(y) || Math.abs(y) > 1e4) break; teia.push([x, k ? x : 0], [x, y], [y, y]); rows.push([k + 1, x, y, Math.abs(y - x)]); x = y; }
      const lo = Math.min(-1, x0, x) - 0.2, hi = Math.max(1, x0, x) + 0.2, curva = Array.from({ length: 161 }, (_, i) => { const t = lo + (hi - lo) * i / 160; return [t, g(t)]; });
      corpo = exGrafico([{ p: curva }, { p: [[lo, lo], [hi, hi]] }, { p: teia }], [], [], 'Diagrama em teia: y=g(x), y=x e iterações') + exTabela('Ponto Fixo: xₖ₊₁ = g(xₖ)', ['k', 'xₖ', 'g(xₖ)', '|Δx|'], rows) + '<p>Convergência local exige |g′| &lt; 1 perto do ponto fixo; os passos desenhados não certificam convergência.</p>';
    } catch (err) { corpo = `<p role="alert">${safe(err.message)}</p>`; }
  }
  return `<h2>Pesquisa avançada</h2><button class="btn ghost" type="button" role="switch" aria-checked="${e.extras}" data-act="ex-extras">Mostrar métodos extras de pesquisa (Ponto Fixo)</button><p>A chave começa desligada e vale apenas nesta sessão de pesquisa. A grade da disciplina continua com os seis métodos.</p>${e.extras ? `<label class="field" for="ex-fp">g(x)<input id="ex-fp" value="${safe(e.fp)}"></label><label class="field" for="ex-fpx">x₀<input id="ex-fpx" value="${safe(e.fpX)}"></label>${btn('Desenhar a teia', 'ex-fp-calcular', 'primary')}${corpo}` : ''}`;
}
function exPainel(aba) {
  return aba === 'pontos' ? exPontos() : aba === 'precisao' ? exPrecisao() : aba === 'extras' ? exExtras() : aba === 'fenomenos' ? ltAbaFenomenos() : aba === 'linhas' ? ltAbaLinhas() : ltAbaTatil();
}
function exTerminal() {
  return `<section class="card lt-card ex-terminal"><h2>Experimentos do Terminal</h2>${tabs([['tatil', 'Manipular a equação'], ['linhas', 'Linhas e sensibilidade'], ['fenomenos', 'Fenômenos'], ['pontos', 'Interpolação, Ajuste e Integração'], ['precisao', 'Precisão'], ['extras', 'Pesquisa avançada']], s.ex.aba, 'ex-abrir')}${s.ex.aba ? `<div class="ex-panel">${s.ex.erro && ['tatil', 'linhas'].includes(s.ex.aba) ? `<p class="alert" role="alert">${safe(s.ex.erro)}</p>` : exPainel(s.ex.aba)}</div>` : ''}</section>`;
}
function exImportar(origem, tipo) {
  try {
    const d = origem === 'trilha' ? C.DEEP[s.method] : null;
    if (!d) collect();
    if (tipo === 'linhas') {
      const sys = M.parseSystem(d ? d.system : s.source); s.lt.customSis = { t: 'Seu sistema', A: sys.A, b: sys.b }; s.lt.ordem = null; s.lt.gs = s.lt.sens = null; s.lt.sensError = '';
    } else {
      const split = M.splitInterval(d ? d.example : s.source), src = split.equation, f = M.parseFunction(src), h = 1e-4;
      const val = v => String(v ?? '').trim() ? M.parseFunction(String(v))(0) : NaN;
      const a = val(d ? d.a : split.interval ? split.interval.ta : s.a), b = val(d ? d.b : split.interval ? split.interval.tb : s.b), valid = Number.isFinite(a) && Number.isFinite(b) && b > a;
      const lo = valid ? a : -3, hi = valid ? b : 3;
      s.lt.customF = { t: src, f, df: x => (f(x + h) - f(x - h)) / (2 * h), d2: x => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h), lo: lo - (hi - lo) * 0.2, hi: hi + (hi - lo) * 0.2, a: lo, b: hi, x0: d ? d.x0 ?? (lo + hi) / 2 : String(s.x0).trim() ? val(s.x0) : (lo + hi) / 2, x1: d ? d.x1 ?? hi : String(s.x1).trim() ? val(s.x1) : hi };
      if (![s.lt.customF.x0, s.lt.customF.x1].every(Number.isFinite)) throw Error('Os chutes devem ser numéricos.');
      s.lt.x0 = s.lt.x1 = s.lt.a = s.lt.b = null; s.lt.met = LT_MET.some(([id]) => id === (d ? s.method : s.algorithm)) ? (d ? s.method : s.algorithm) : 'newton'; s.lt.corrida = 0;
    }
    s.ex.erro = '';
  } catch (err) { s.ex.erro = err.message; }
}
function exHandle(act, el) {
  const e = s.ex, id = el.dataset.id;
  if (act === 'ex-abrir') { e.aba = id; if (['tatil', 'linhas'].includes(id)) exImportar('terminal', id); render(); return true; }
  if (act === 'ex-trilha') { e.aba = id; if (['tatil', 'linhas'].includes(id)) exImportar('trilha', id); s.lt.aba = id; navigate('laboratorio'); return true; }
  if (act === 'ex-missao') { e.contexto = s.caseId; s.lt.fen = ['gauss', 'seidel'].includes(C.CASES.find(c => c.id === s.caseId).method) ? 'trelica' : 'comporta'; s.lt.aba = 'fenomenos'; e.aba = 'fenomenos'; render(); return true; }
  if (act === 'ex-pontos-calcular') { e.pontos = document.getElementById('ex-pontos').value; e.metodo = document.getElementById('ex-metodo').value; exCalcularPontos(); }
  else if (act === 'ex-extras') e.extras = !e.extras;
  else if (act === 'ex-fp-calcular') { e.fp = document.getElementById('ex-fp').value; e.fpX = document.getElementById('ex-fpx').value; }
  else if (act === 'ex-calor-reset') e.calor = null;
  else if (act === 'ex-euler-reset') { e.calor.T = 100; e.calor.tempo = 0; e.calor.historico = []; }
  else if (act === 'ex-euler') { const c = e.calor; c.T = EX.resfriar(c.T, c.dt).temperatura; c.tempo += c.dt; c.historico.push([c.tempo, c.T, 20 + 80 * Math.exp(-c.tempo)]); }
  else if (act === 'ex-calor-celula' || act === 'ex-calor-varredura') {
    const c = e.calor, qtd = act === 'ex-calor-celula' ? 1 : 9 - c.celula;
    for (let j = 0; j < qtd; j++) {
      if (!c.celula) { c.passG = EX.termica(c.gs).etapas; c.passJ = EX.termica(c.ja, 'jacobi').etapas; }
      c.gs = c.passG[c.celula]; c.ja = c.passJ[c.celula]; c.celula++;
      if (c.celula === 9) { c.k++; c.celula = 0; }
    }
  } else if (act === 'ex-drone-met') { e.voo.met = id; e.voo.k = 0; }
  else if (act === 'ex-drone-reset') e.voo.k = 0;
  else if (act === 'ex-drone-passo') { const d = EX.drone(e.voo.met); e.voo.k = Math.min(200, e.voo.k + 5, d.colisao < 0 ? 200 : d.colisao); }
  else return false;
  render(); return true;
}
document.addEventListener('input', ev => {
  if (ev.target.id === 'ex-pontos') s.ex.pontos = ev.target.value;
  if (ev.target.id === 'ex-fp') s.ex.fp = ev.target.value;
  if (ev.target.id === 'ex-fpx') s.ex.fpX = ev.target.value;
  if (ev.target.id !== 'ex-precisao') return;
  s.ex.precisao = Number(ev.target.value); document.getElementById('ex-precisao-v').textContent = s.ex.precisao; document.getElementById('ex-precisao-resultado').innerHTML = exPrecisaoResultado(EX.mantissa(s.ex.precisao));
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'ex-tol') { s.ex.calor.tol = Number(ev.target.value); render(); }
  if (ev.target.id === 'ex-dt') { s.ex.calor.dt = Number(ev.target.value); render(); }
  if (ev.target.id === 'ex-metodo') { s.ex.metodo = ev.target.value; s.ex.pontos = document.getElementById('ex-pontos').value; s.ex.dados = null; s.ex.erro = ''; render(); }
});
