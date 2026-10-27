// Tela das questões (simulador numérico). Organização: cabeçalho compacto; instrumentos explicados;
// à esquerda a missão (situação, objetivo, dados, modelo, tolerância e o apoio do nível); no centro a
// barra de ferramentas (inventário), a ferramenta selecionada com seus parâmetros, o campo gráfico
// (Canvas só para gráficos) e a explicação de cada passo; embaixo, as ações principais sempre visíveis.
// Histórico, telemetria, modo professor e sobrecarga ficam em áreas expansíveis.
import { G } from '../game.js';
import { HINTS } from '../data/hints.js';
import { ANIMALS } from '../data/animals.js';
import { NIVEIS, REGIONS } from '../data/settlements.js';
import { FERRAMENTAS, ALERTAS, CONCEITOS } from '../data/conhecimento.js';
import { contextoDe, APOIO } from '../data/contextos.js';
import { drawPortrait } from '../ui/portraits.js';
import { icone, ICONES } from '../ui/icones.js';
import { abrirInventario, custoTroca, reliquiaCompativel } from '../ui/inventario.js';
import { abrirDuvidas } from '../ui/duvidas.js';
import { dicaPaga, registrarDica } from '../systems/mestres.js';
import { getLevel, bossLevels, LABELS, RELICS } from './levels.js';
import { Session, Battle, perksFor } from './session.js';
import { drawBoard, number } from './board.js';
import { floatBits, fromBits, sig, half } from '../engine/numeric.js';

export const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const costs = { bissecao: '1 ⚡ · linear · continuidade', falsaPosicao: '2 ⚡ · pode estagnar', pontoFixo: '1 ⚡ · confira |g′|', newton: '3 ⚡ · ordem 2 · derivada nula', secante: '2 ⚡ · ordem 1,618', gauss: '1 ⚡ / operação', pivoteamento: '1 ⚡ / operação', lu: 'n ⚡ fatorar · 1 ⚡ resolver', jacobi: '1 ⚡ / varredura', seidel: '1 ⚡ / varredura', euler: '1 ⚡ / passo · ordem 1', rk4: '4 ⚡ / passo · ordem 4', implicito: '1 ⚡ / passo · estável', trapezio: '1 ⚡ / avaliação · ordem 2', simpson13: '1 ⚡ / avaliação · n par', simpson38: '1 ⚡ / avaliação · n múltiplo de 3', combo: '1 ⚡ / avaliação · n ímpar', lagrange: 'n ⚡ / alteração', newtonInterp: '1 ⚡ / novo nó', spline: 'n−2 ⚡ / sistema', minimosQuadrados: '1 ⚡ / ajuste' };
export function batteryFor(method, difficulty) { return difficulty === 'B' ? bossLevels(method).battery : getLevel(method, difficulty).battery; }
const button = (action, label, extra = '') => `<button class="btn" data-action="${action}" ${extra}>${label}</button>`;
const field = (key, label, value, step = 'any') => `<label>${label}<input data-field="${key}" type="number" step="${step}" value="${value ?? 0}"></label>`;
const select = (key, label, values, current) => `<label>${label}<select data-field="${key}">${values.map(([v, t]) => `<option value="${v}" ${String(v) === String(current) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
function table(A, b, drag = false) { return `<div class="t-table"><table>${A.map((r, i) => `<tr ${drag ? `data-row="${i}" tabindex="0"` : ''}><th>L${i + 1}</th>${r.map(v => `<td>${number(v)}</td>`).join('')}${b ? `<td class="rhs">${number(b[i])}</td>` : ''}</tr>`).join('')}</table></div>`; }
const BOSS = { dificuldade: 'Chefão', simbolo: '☠', cor: '#3a2a1a' };
const ITERATIVO = new Set(['bissecao', 'falsaPosicao', 'pontoFixo', 'newton', 'secante', 'jacobi', 'seidel']);

export function runFase({ s: settlement, nivel, animalId, freeHint = false }) {
  const root = document.getElementById('fase'), opts = { xp: G.progress.d.rpg?.xp || 0, combo: G.progress.d.rpg?.combo || 1, relics: G.progress.d.rpg?.relics || [] }, battle = nivel === 'B' ? new Battle(settlement.metodo, opts) : null;
  let game = battle?.session || new Session(getLevel(settlement.metodo, nivel), opts), professor = false, telemetry = false, finished = false, closed = false, resolve, diagram, drag, rowDrag, idle = 0, msg = '', modal = null;
  const promise = new Promise(r => { resolve = r; }), abort = new AbortController(), signal = abort.signal, $ = id => root.querySelector('#' + id);
  const dif = nivel === 'B' ? BOSS : NIVEIS[nivel], regiao = settlement.regiao;
  const chave = () => `${settlement.id}-${nivel}${battle ? '-' + battle.index : ''}`;
  root.addEventListener('pointerdown', () => G.audio?.unlock(), { signal });
  if (G.debug) G.tactical = { get session() { return game; }, battle };
  G.audio?.beginTactical?.(); root.classList.remove('hidden');

  // Simula o próximo passo numa cópia: custo real, fórmula e consequência, sem mexer na missão
  function simular() {
    if (game.status !== 'play') return null;
    try {
      const sim = Object.assign(Object.create(Object.getPrototypeOf(game)), game, { s: structuredClone(game.s), traces: structuredClone(game.traces), history: [], options: { ...game.options } });
      const before = sim.s.battery, trace = sim.act();
      return { trace, cost: Math.max(0, before - sim.s.battery), lost: sim.status === 'lost', reason: sim.reason, error: sim.s.error };
    } catch (e) { return null; }
  }

  function controls() {
    const l = game.level, s = game.s; let html = '';
    if (l.kind === 'root') html = `<p>Arraste os círculos roxos no gráfico ou ajuste os valores. Reposicionar depois de começar custa 1 ⚡.</p>${field('a', 'Âncora a', s.a)}${field('b', 'Âncora b', s.b)}${field('x', 'Mira / x₁', s.x)}${s.tool === 'secante' ? field('prev', 'Sonda x₀', s.prev) : ''}${l.gs ? select('gIndex', 'Fiação g(x)', l.gNames.map((t, i) => [i, t]), s.gIndex) + field('lambda', 'Amortecimento λ', s.lambda, '.05') : ''}${s.tool === 'newton' ? field('multiplicity', 'Multiplicidade m', s.multiplicity, '1') : ''}${field('probeX', 'Posição da sonda', s.x)}${button('probe', 'Sondar f · 1 ⚡')}${l.gs ? button('derivative', 'Medir g′ · 1 ⚡') : ''}<output id="probe-result"></output>`;
    if (l.kind === 'linear') html = `<p>Arraste uma linha sobre outra para preparar a eliminação, confira o multiplicador e aplique. ▶ Executar faz uma operação automática.</p><div id="matrix-editor"></div>${field('rowI', 'Linha pivô (1…n)', 1, '1')}${field('rowJ', 'Linha destino', 2, '1')}${field('multiplier', 'Multiplicador', 1)}${button('eliminate', 'Eliminar · 1 ⚡')}${button('swapRow', 'Trocar linhas · 1 ⚡')}${button('swapCol', 'Trocar colunas · 1 ⚡')}${l.relics.includes('refinement') ? button('refine', 'Refinar solução') : ''}<div id="factors"></div>`;
    if (l.kind === 'interpolation') html = `<p>Arraste os nós no gráfico. Inserir por Newton preserva os coeficientes anteriores.</p>${field('nodeX', 'Novo nó x', l.b)}${!l.f ? field('nodeY', 'Valor y', 0) : ''}${button('node', 'Plantar nó')}${field('nodeIndex', 'Nó a remover', s.xs.length, '1')}${button('removeNode', 'Remover · 1 ⚡')}`;
    if (l.kind === 'spline') html = `<p>Ajuste as curvaturas ou use ▶ Executar para resolver o sistema por Thomas.</p>${field('curvatureIndex', 'Nó interno', 1, '1')}${field('curvature', 'Curvatura M', 0, '.01')}${button('curvature', 'Ajustar M · 1 ⚡')}<div id="factors"></div>`;
    if (l.kind === 'fit') html = `<p>As linhas douradas são os resíduos. Arraste a reta, ajuste os coeficientes ou resolva as equações normais com ▶ Executar.</p>${field('coefA', 'a', s.coef[0], '.01')}${field('coefB', 'b', s.coef[1], '.01') + (l.degree === 2 ? field('coefC', 'c', s.coef[2], '.01') : '')}${button('fitManual', 'Aplicar · 1 ⚡')}<div id="factors"></div>`;
    if (l.kind === 'integral') html = `<p>Escolha n antes de integrar. Cada avaliação de f consome energia${l.uCurve ? '; nesta missão cada experimento custa 1 ⚡' : ''}.</p>${field('n', 'Intervalos n', s.n, '1')}<label>Subdivisão<input data-slider="n" type="range" min="1" max="${l.uCurve ? 1500 : 120}" value="${s.n}"></label><output id="extra-info"></output>`;
    if (l.kind === 'ode') html = `<p>Siga o campo até t = ${l.end}. RK4 usa quatro sondas, com pesos 1, 2, 2, 1.</p>${field('h', 'Passo h', s.h, '.005')}<label>Passo<input data-slider="h" type="range" min="0.005" max="0.5" step="0.005" value="${s.h}" ${l.forceH ? 'disabled' : ''}></label><output id="extra-info"></output>`;
    if (l.kind === 'float') {
      const claro = l.difficulty === 'F';
      html = (l.scenario === 'readings' ? select('rounding', 'Guardar a próxima leitura', [['round', 'Arredondar'], ['truncate', 'Truncar']], s.rounding) + button('batch', 'Processar 10 leituras · 0,5 ⚡')
        : l.scenario === 'cancellation' ? select('formulaChoice', 'Bloco algébrico (fórmula da raiz pequena)', [['direct', claro ? 'Fórmula A: (1000 − √Δ)/2 · subtrai números quase iguais' : 'Fórmula A: (1000 − √Δ)/2'], ['stable', claro ? 'Fórmula B: c/(a·x₁) · usa x₁·x₂ = c/a' : 'Fórmula B: c/(a·x₁)']], s.formulaChoice)
        : l.scenario === 'overflow' ? select('formulaChoice', 'Ordem das operações', [['direct', '√(x² + y²)'], ['scaled', 'm·√((x/m)² + (y/m)²)']], s.formulaChoice) + select('bits', 'Precisão', [[16, '16 bits (missão)'], [32, '32 bits (laboratório)'], [64, '64 bits (laboratório)']], s.bits)
        : select('sumOrder', 'Ordem da soma', [['forward', 'Maior primeiro'], ['reverse', 'Menor primeiro'], ['kahan', 'Kahan']], s.sumOrder))
        + `<details class="tq-more"><summary>Laboratório de bits</summary><p>Altere os bits e observe o valor; este laboratório é independente da missão e não gasta energia.</p><label>Máquina<select id="bit-width"><option value="16">16 bits</option><option value="32" selected>32 bits</option><option value="64">64 bits</option></select></label><input id="bit-value" type="number" value="3.14159" step="any" aria-label="Valor do laboratório"><label>Corte da mantissa<input id="bit-cut" type="range" min="1" max="23" value="23"></label><div id="bit-panel"></div></details>`;
    }
    return `<div class="t-controls">${html}</div>`;
  }

  function brief() {
    const l = game.level, c = contextoDe(l), ap = APOIO[l.difficulty] || APOIO.D;
    const regras = l.mission && !/^Estabilize /.test(l.mission) ? `<p class="tq-rule"><b>Regra da missão:</b> ${esc(l.mission)}</p>` : '';
    return `${c ? `<section class="tq-ctx"><h3>📍 Situação</h3><p>${esc(c.ctx)}</p></section><h3>🎯 Objetivo</h3><p>${esc(c.obj)}</p><h3>📋 Dados</h3><ul>${c.dados.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : `<h3>🎯 Objetivo</h3><p>${esc(l.mission)}</p>`}
      <h3>🧮 Modelo</h3><p class="tq-formula">${esc(l.formula || c?.modelo || '')}</p>
      <p class="tq-tol"><b>Tolerância:</b> ${esc(l.metric)} ≤ ${number(l.tau)}${c?.un ? ` <small>(${esc(c.un)})</small>` : ''}</p>${regras}
      <div class="tq-apoio apoio-${l.difficulty}"><h3>${l.difficulty === 'F' ? '🧭' : l.difficulty === 'M' ? '🔀' : '🔎'} ${ap.titulo}</h3><p>${esc(ap.texto)}</p><div id="tq-guia"></div></div>
      <details class="tq-more"><summary>Regras, energia e engenheiro</summary><p>Energia ou integridade zero: derrota. Escolher a ferramenta antes de agir é grátis; trocar depois custa 2 ⚡. Desfazer custa 2 ⚡.</p><p>Engenheiro nível ${perksFor(opts.xp).level} · ${opts.xp} XP.</p></details>`;
  }

  function hotbar() {
    const l = game.level, s = game.s;
    const tools = l.tools.map((t, i) => `<button class="tq-slot ${s.tool === t ? 'on' : ''}" data-tool="${t}" title="${esc(FERRAMENTAS[t]?.nome || LABELS[t] || t)} · ${s.tool === t ? 'selecionada' : `equipar: ${custoTroca(game) ? '2 ⚡' : 'grátis'}`}"><span class="kn">${i + 1}</span>${icone(t)}<b>${esc(LABELS[t] || FERRAMENTAS[t]?.nome || t)}</b></button>`).join('');
    const relics = [...new Set([...l.relics, ...opts.relics.filter(id => reliquiaCompativel(id, l))])].map(id => `<button class="tq-slot relic ${s.relics.includes(id) ? 'on' : ''}" data-action="relic" data-relic="${id}" title="Relíquia ${esc(RELICS[id])}">${ICONES.reliquia(RELICS[id][0])}<b>${esc(RELICS[id])}</b></button>`).join('');
    return `<div class="tq-hotbar" role="toolbar" aria-label="Ferramentas da missão">${tools}${relics}</div>`;
  }

  function mount() {
    const l = game.level, stage = battle ? ` · ${esc(battle.spec.name)} ${battle.index + 1}/${battle.spec.levels.length}` : '';
    const board = `<canvas id="t-board" tabindex="0" aria-label="Campo gráfico; os controles equivalentes estão abaixo" data-maxh="${Math.round(Math.max(220, Math.min(470, innerHeight * 0.4)))}"></canvas>`;
    root.innerHTML = `<section class="fase-box tactical tq">
      <header class="tq-head"><div class="tq-id"><small>${esc(REGIONS[regiao]?.nome || '')} · ${esc(settlement.nome)}</small><h2>${esc(l.name)}</h2></div>
        <span class="tq-diff" style="--c:${dif.cor}" title="Dificuldade">${dif.simbolo} ${dif.dificuldade}${stage}</span>${button('quit', 'Sair', 'id="fz-quit"')}</header>
      <div id="t-hud" class="t-hud" aria-live="polite"></div>
      <div class="tq-body">
        <aside class="tq-brief" aria-label="Missão">${brief()}</aside>
        <main class="tq-work">
          <div class="tq-toolbar">${hotbar()}<button class="btn secondary tq-inv" data-action="inventory" title="Inventário: ferramentas, cartas e relíquias"><kbd>I</kbd>🎒 Inventário</button></div>
          <div id="tq-tool" class="tq-tool"></div>
          ${l.kind === 'float' ? `<div id="tq-computer" class="tq-computer" aria-live="polite"></div><details class="tq-more"><summary>Visor gráfico</summary>${board}</details>` : board}
          ${controls()}
          <div id="t-feedback" class="t-feedback" role="status"></div>
          <div id="t-hint" class="t-hint"></div>
          <details class="tq-more" id="tq-hist"><summary>Histórico e telemetria</summary><div class="tq-row">${l.difficulty === 'D' ? button('telemetry', 'Ativar telemetria completa · 1 ⚡') : ''}${button('professor', '<kbd>D</kbd> Modo professor')}</div><div id="t-telemetry" class="t-telemetry"></div></details>
          <details class="tq-more"><summary>Modo avançado: sobrecarga manual</summary><p>Com a sobrecarga, o tempo conta pontos de XP, mas a integridade cai devagar enquanto ela estiver ligada.</p>${button('manual', 'Sobrecarga Manual')}<div id="t-clock"></div></details>
        </main>
      </div>
      <footer class="t-actions tq-actions">
        <button class="btn tq-main" data-action="step" id="t-step">▶ Executar passo <small id="tq-cost"></small></button>
        ${button('concept', '📘 Conceito <small>grátis</small>', 'title="Explicações, erros comuns e exemplos da região (não gasta nada)"')}
        ${button('hint', '<kbd>H</kbd> 💡 Dica')}${button('moreHint', 'Mais dica', 'id="t-more-hint"')}
        ${button('undo', '↶ Desfazer · 2 ⚡', 'id="tq-undo"')}
        <span class="tq-submit">${button('submit', '✓ Concluir', 'id="t-submit"')}<span id="tq-why" class="tq-why" role="note"></span></span>
      </footer>
      <div id="t-result"></div>
      <div id="tq-overlay" class="tq-overlay hidden"></div>
    </section>`;
    const canvas = $('t-board'); canvas.addEventListener('pointerdown', pointerDown, { signal }); canvas.addEventListener('pointermove', pointerMove, { signal }); canvas.addEventListener('pointerup', pointerUp, { signal }); canvas.addEventListener('pointercancel', () => { drag = null; }, { signal });
    if ($('bit-value')) { $('bit-value').oninput = renderBits; $('bit-cut').oninput = renderBits; $('bit-width').onchange = () => { $('bit-cut').value = $('bit-cut').max = floatBits(0, Number($('bit-width').value)).mantissa; renderBits(); }; renderBits(); }
    if (l.forceH) root.querySelector('[data-field="h"]').readOnly = true;
    telemetry = false; render();
  }

  function hud() {
    const s = game.s, l = game.level, feitos = game.traces.length, iters = game.traces.filter(t => t.iteration).length;
    const last = game.traces.at(-1), invalido = last && (last.flags.includes('naoFinito') || last.flags.includes('operacaoInvalida') || (l.scenario === 'cancellation' && s.value === 0));
    const errTxt = !feitos ? 'ainda não calculado' : invalido ? 'resultado inválido' : Number.isFinite(s.error) ? number(s.error) : 'a recalcular';
    const radarError = s.relativeError ?? s.error, radar = feitos && Number.isFinite(radarError) ? Math.max(0, Math.min(8, -Math.log10(Math.max(radarError, 1e-16)))) : 0;
    let conv;
    if (s.flags.length) conv = ['red', '⚠ Alerta', s.flags.map(f => ALERTAS[f] || f).join(' ')];
    else if (!ITERATIVO.has(s.tool)) conv = ['idle', 'Passos', `${feitos} operação(ões) feitas. Este cálculo não é iterativo: o erro vem ${l.kind === 'float' ? 'da fórmula escolhida e da precisão da máquina' : l.kind === 'integral' ? 'do número de intervalos n' : l.kind === 'ode' ? 'do passo h e da estabilidade' : 'do método e dos dados'}.`];
    else if (iters < 2 || !s.rho) conv = ['idle', 'Convergência', feitos ? 'Aguardando mais um passo para medir ρ e p.' : 'Aguardando cálculo: ρ e p precisam de dois passos.'];
    else if (s.rho < 1) conv = ['green', 'Convergindo', `ρ = ${number(s.rho)}: cada passo anda ${Math.round(s.rho * 100)}% do anterior.${s.order ? ` p ≈ ${number(s.order)}${s.order > 1.5 ? ': os dígitos corretos crescem rápido.' : ': ganho linear.'}` : ''}`];
    else conv = ['yellow', 'Sem convergência', `ρ = ${number(s.rho)} ≥ 1: os passos não estão diminuindo.`];
    $('t-hud').innerHTML = `<div class="hud-i"><span class="hud-l">⚡ Energia</span><b>${number(s.battery)}/${s.batteryMax}</b><meter max="${s.batteryMax}" value="${s.battery}"></meter><small>cada operação gasta; zero = derrota</small></div>
      <div class="hud-i"><span class="hud-l">♥ Integridade</span><b>${Math.ceil(s.integrity)}%</b><meter max="100" value="${s.integrity}"></meter><small>alertas vermelhos tiram integridade</small></div>
      <div class="hud-i"><span class="hud-l">Erro</span><b>${errTxt}</b><span class="t-radar" title="Escala logarítmica de 10⁰ a 10⁻⁸"><i style="width:${radar / 8 * 100}%"></i></span><small>meta: ≤ ${number(l.tau)}</small></div>
      <div class="hud-i t-signal ${conv[0]}"><span class="hud-l">${conv[1]}</span><small>${esc(conv[2])}</small></div>
      ${battle ? `<div class="hud-i"><span class="hud-l">Fúria</span><b>${Math.min(100, s.fury)}%</b><meter max="100" value="${s.fury}"></meter><small>cheia: o chefão muda o problema</small></div>` : ''}
      <details class="hud-help"><summary aria-label="O que significam os instrumentos">?</summary><p><b>${CONCEITOS.convergencia.nome}:</b> ${esc(CONCEITOS.convergencia.funcao)}</p><p><b>${CONCEITOS.erro.nome}:</b> ${esc(CONCEITOS.erro.funcao)}</p><p>Radar: barra cheia = erro perto de 10⁻⁸.</p></details>`;
  }

  // Computador de bordo das missões de máquina (texto acessível, não Canvas)
  function computador() {
    const l = game.level, s = game.s, feitos = game.traces.length;
    const bancada = l.difficulty === 'F' || s.hintLevel >= (l.difficulty === 'M' ? 1 : 2);
    const aviso = bancada ? '' : `<p class="tq-lock">🔒 Bancada de testes: liberada com a Dica ${l.difficulty === 'M' ? '1 (grátis)' : '2'}. Ou consulte o 📘 Conceito.</p>`;
    if (l.scenario === 'cancellation') {
      const q = x => sig(x, 5), m5 = v => { if (v === 0) return '0'; const [a, e] = v.toExponential(4).split('e'), k = Number(e); return k >= 0 && k <= 4 ? v.toPrecision(5).replace('.', ',') : `${a.replace('.', ',')}·10${String(k).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; }, ex = { delta: 999996, raiz: Math.sqrt(999996) }, d = q(Math.sqrt(q(q(1000 * 1000) - 4))), x1 = q(q(1000 + d) / 2), A = q(q(1000 - d) / 2), B = q(1 / x1);
      const linhas = (f) => `<tr><td>Δ = b² − 4ac</td><td>999 996</td><td>${m5(q(q(1e6) - 4))}</td></tr><tr><td>√Δ</td><td>${number(ex.raiz)}</td><td>${m5(d)}</td></tr><tr><td>x₁ = (1000 + √Δ)/2</td><td>${number((1000 + ex.raiz) / 2)}</td><td>${m5(x1)}</td></tr>`
        + (f !== 'stable' ? `<tr class="bad"><td>x₂ (A) = (1000 − √Δ)/2</td><td>${number(l.target)}</td><td>${m5(A)} ← 1000,0 − 1000,0: os 5 dígitos iguais se cancelaram</td></tr>` : '')
        + (f !== 'direct' ? `<tr class="good"><td>x₂ (B) = c/(a·x₁)</td><td>${number(l.target)}</td><td>${m5(B)} ✓ dígitos preservados</td></tr>` : '');
      const op = s.formulaChoice === 'stable' ? 'Fórmula B: x₂ = c/(a·x₁)' : 'Fórmula A: x₂ = (1000 − √Δ)/2';
      const res = !feitos ? '<p class="tq-wait">Resultado: aguardando cálculo · Erro: ainda não calculado</p>' : s.value === 0 ? '<p class="tq-bad">Resultado inválido: a subtração apagou todos os dígitos; 0 não é raiz da equação.</p>' : `<p>Resultado: x₂ = <b>${number(s.value)}</b> ms · erro relativo ${number(s.error)} ${s.error <= l.tau ? '≤' : '>'} ${number(l.tau)}</p>`;
      return `<h3>Computador de bordo</h3><p class="tq-eq">x² − 1000x + 1 = 0 <small>a = 1, b = −1000, c = 1</small></p><p>Precisão da máquina: <b>5 algarismos significativos</b> (cada operação arredonda). Operação selecionada: <b>${op}</b>.</p>${res}
        ${feitos ? `<div class="tq-scroll"><table class="tq-steps"><tr><th>Passo</th><th>Valor exato</th><th>Máquina (5 dígitos)</th></tr>${linhas(s.formulaChoice)}</table></div>` : ''}
        ${bancada ? `<details class="tq-more" ${l.difficulty === 'F' ? 'open' : ''}><summary>Bancada de testes (não gasta energia): compare as duas fórmulas</summary><div class="tq-scroll"><table class="tq-steps"><tr><th>Passo</th><th>Valor exato</th><th>Máquina (5 dígitos)</th></tr>${linhas('ambas')}</table></div></details>` : aviso}`;
    }
    if (l.scenario === 'overflow') {
      const q = s.bits === 16 ? half : s.bits === 32 ? Math.fround : x => x;
      const direto = [['x² = 300²', q(300 * 300)], ['y² = 400²', q(400 * 400)], ['x² + y²', q(q(300 * 300) + q(400 * 400))], ['√(x² + y²)', q(Math.sqrt(q(q(300 * 300) + q(400 * 400))))]];
      const esc2 = [['x/m = 300/400', q(300 / 400)], ['(x/m)² + 1', q(q(300 / 400) ** 2 + 1)], ['√(…)', q(Math.sqrt(q(q(300 / 400) ** 2 + 1)))], ['m·√(…)', q(400 * q(Math.sqrt(q(q(300 / 400) ** 2 + 1))))]];
      const tab = rows => `<div class="tq-scroll"><table class="tq-steps"><tr><th>Operação</th><th>${s.bits} bits</th></tr>${rows.map(([t, v]) => `<tr class="${Number.isFinite(v) ? '' : 'bad'}"><td>${t}</td><td>${Number.isFinite(v) ? number(v) : 'Infinity ← passou de 65 504'}</td></tr>`).join('')}</table></div>`;
      const res = !feitos ? '<p class="tq-wait">Resultado: aguardando cálculo · Erro: ainda não calculado</p>' : !Number.isFinite(s.value) ? '<p class="tq-bad">Resultado inválido: overflow (Infinity).</p>' : `<p>Distância: <b>${number(s.value)}</b> km · erro relativo ${s.bits === 16 ? number(s.error) : '— (só vale na máquina de 16 bits)'}</p>`;
      return `<h3>Computador de bordo</h3><p class="tq-eq">d = √(300² + 400²) km</p><p>Máquina: <b>${s.bits} bits</b>${s.bits === 16 ? ' (maior número: 65 504)' : ' (laboratório)'} · Ordem: <b>${s.formulaChoice === 'scaled' ? 'reescalar por m = 400' : 'quadrados direto'}</b>.</p>${res}
        ${feitos ? tab(s.formulaChoice === 'scaled' ? esc2 : direto) : ''}${bancada ? `<details class="tq-more"><summary>Bancada de testes (não gasta energia)</summary><p>Direto:</p>${tab(direto)}<p>Reescalado:</p>${tab(esc2)}</details>` : aviso}`;
    }
    if (l.scenario === 'readings') {
      const prox = l.readings[s.readIndex];
      return `<h3>Computador de bordo</h3><p>Leitura <b>${Math.min(100, s.readIndex + (s.readIndex < 100 ? 1 : 0))}/100</b>${prox != null ? `: valor bruto ${prox.toPrecision(7)} L/min → guardado ${number(sig(prox, l.digits, s.rounding === 'truncate'))} (${s.rounding === 'truncate' ? 'truncar' : 'arredondar'}, ${l.digits} algarismos)` : ' · todas processadas'}</p>
        ${!feitos ? '<p class="tq-wait">Soma: aguardando cálculo · Erro: ainda não calculado</p>' : `<div class="tq-scroll"><table class="tq-steps"><tr><td>Soma guardada</td><td>${number(s.sum)} L/min</td></tr><tr><td>Soma exata</td><td>${number(s.exactSum)} L/min</td></tr><tr class="${s.error > l.tau ? 'bad' : 'good'}"><td>Erro acumulado</td><td>${number(s.error)} (tolerância ${number(l.tau)}; transborda em 0,05)</td></tr></table></div>`}`;
    }
    return `<h3>Computador de bordo</h3><p>1 + 10 000 parcelas de 10⁻⁷ em float32 · ordem: <b>${({ forward: 'maior primeiro', reverse: 'menor primeiro', kahan: 'Kahan' })[s.sumOrder]}</b></p>${!feitos ? '<p class="tq-wait">Resultado: aguardando cálculo</p>' : `<p>Soma = <b>${number(s.value)}</b> · erro ${number(s.error)} (referência 1,001)</p>`}`;
  }

  function guia() {
    const l = game.level, s = game.s, f = FERRAMENTAS[s.tool], sim = simular();
    if (l.difficulty === 'F') return sim?.trace ? `<p><b>Próximo passo sugerido:</b> ▶ Executar com ${esc(f?.nome || s.tool)}.</p><p class="tq-calc">${esc(sim.trace.formula)}</p>${sim.lost ? `<p class="tq-bad">⚠ Este passo encerraria a missão: ${esc(sim.reason)}</p>` : `<p>Custa ${number(sim.cost)} ⚡. ${Number.isFinite(sim.error) ? `O erro passaria a ${number(sim.error)}.` : ''}</p>`}` : '<p>Nada a calcular agora: confira se já pode concluir.</p>';
    if (l.difficulty === 'M') return `<ul class="tq-check"><li>${esc(f?.nome || s.tool)} se aplica? ${esc(f?.requisitos || '')}</li><li>O erro caiu no último passo? ${game.traces.length > 1 ? (game.traces.at(-1).err < game.traces.at(-2).err ? 'Sim ✓' : 'Não: reveja a estratégia') : 'Ainda não há dois passos.'}</li><li>Energia para continuar: ${number(s.battery)} ⚡; este passo custa ${sim ? number(sim.cost) : '—'} ⚡.</li></ul>`;
    return `<ul class="tq-check"><li><b>Condição do método:</b> ${esc(f?.requisitos || '')}</li>${f?.erros?.[0] ? `<li><b>Armadilha comum:</b> ${esc(f.erros[0])}</li>` : ''}${l.relics.length ? `<li><b>Recursos especiais:</b> ${l.relics.map(id => esc(RELICS[id])).join(', ')} (veja no inventário).</li>` : ''}<li><b>Limitação da máquina/energia:</b> ${number(s.battery)} ⚡ restantes.</li></ul>`;
  }

  function explicar(trace) {
    const l = game.level, s = game.s, f = FERRAMENTAS[s.tool];
    const e = trace.err, ok = Number.isFinite(e) && e <= l.tau;
    const erro = !Number.isFinite(e) ? 'O erro não pôde ser calculado neste passo (resultado inválido ou etapa intermediária).' : ok ? `Erro ${number(e)} ≤ tolerância ${number(l.tau)}: precisão suficiente${game.pendencias().length ? ', mas ainda falta: ' + game.pendencias().join(' ') : '. Já pode concluir.'}` : `Erro ${number(e)} ainda é ${number(e / l.tau)} vezes a tolerância ${number(l.tau)}.`;
    return `<p><b>Calculado:</b> ${esc(trace.formula)}</p>${f ? `<p><b>Por quê:</b> ${esc(f.porque)}</p>` : ''}<p><b>Erro × tolerância:</b> ${esc(erro)} <small>(custou ${number(trace.cost)} ⚡)</small></p>${trace.flags.length ? `<p class="tq-bad">⚠ ${trace.flags.map(x => esc(ALERTAS[x] || x)).join(' ')}</p>` : ''}`;
  }

  function render() {
    if (closed) return; const s = game.s, l = game.level;
    hud();
    root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === s.tool)); root.querySelectorAll('[data-relic]').forEach(b => { b.classList.toggle('on', s.relics.includes(b.dataset.relic)); b.disabled = finished || s.relics.includes(b.dataset.relic); });
    const f = FERRAMENTAS[s.tool], sim = simular();
    $('tq-tool').innerHTML = `${icone(s.tool)}<div><b>Ferramenta: ${esc(f?.nome || LABELS[s.tool] || s.tool)}</b><small>${esc(f?.funcao || '')}</small><small>Custo: ${esc(costs[s.tool] || f?.custo || 'operação numérica')} · trocar: ${custoTroca(game) ? '2 ⚡' : 'grátis antes de agir'}</small></div>`;
    $('tq-cost').textContent = sim ? `· ${number(sim.cost)} ⚡` : '';
    $('t-step').disabled = finished || !sim;
    const pend = game.pendencias();
    $('t-submit').disabled = finished || !game.ready;
    $('tq-why').textContent = finished ? '' : game.ready ? 'Pronto para concluir ✓' : `Concluir indisponível: ${pend.join(' ')}`;
    $('t-feedback').innerHTML = msg || (game.traces.length ? esc(game.reason) : `<p class="tq-wait">Aguardando cálculo. Ajuste os parâmetros e pressione ▶ Executar passo${sim ? ` (custa ${number(sim.cost)} ⚡)` : ''}.</p>`);
    $('tq-guia').innerHTML = guia();
    for (const key of ['a', 'b', 'x', 'prev', 'gIndex', 'lambda', 'multiplicity', 'h', 'n']) { const el = root.querySelector(`[data-field="${key}"]`); if (el && document.activeElement !== el && Number.isFinite(s[key])) el.value = Number(s[key].toPrecision(10)); }
    const next = s.hintLevel + 1, paga = dicaPaga(chave()) >= next;
    $('t-more-hint').hidden = s.hintLevel === 0 || s.hintLevel >= 3; $('t-more-hint').innerHTML = `Dica ${next} · ${paga ? 'já paga' : `${next === 2 ? 1 : 3} 🌰`}${next === 3 ? ' · máx. 2 ⭐' : ''}`;
    if ($('tq-computer')) $('tq-computer').innerHTML = computador();
    diagram = drawBoard($('t-board'), game, l.difficulty === 'F' || s.usedL3 || perksFor(opts.xp).preview);
    if ($('matrix-editor')) $('matrix-editor').innerHTML = table(s.A, s.bvec, true);
    if ($('factors')) $('factors').innerHTML = s.factors ? `<details open><summary>Fatores preservados · P=(${s.factors.P.map(i => i + 1)})</summary><b>L</b>${table(s.factors.L)}<b>U</b>${table(s.factors.U)}</details>` : s.system ? `<details open><summary>Sistema aplicado</summary>${table(s.system.A, s.system.b)}</details>` : '';
    if ($('extra-info')) $('extra-info').textContent = l.kind === 'ode' ? `t=${number(s.t)} · y=${number(s.y)} · sondas k=${s.slopes.map(number).join('; ') || '—'} · fator de estabilidade=${number(s.stability)}` : `h=${number((l.b - l.a) / s.n)} · avaliações=${s.evaluations} · cota=${number(s.bound)}${l.uCurve ? ` · erro medido=${number(s.measuredError)} · modelo=${number(s.modelError)} · mínimo=${number(s.modelMinimum)}` : ''}`;
    const rows = professor || l.difficulty === 'F' || telemetry ? game.traces : l.difficulty === 'M' ? game.traces.slice(-2) : [];
    $('t-telemetry').innerHTML = rows.length ? `<table><caption>${professor ? 'Professor: histórico completo' : 'Telemetria'}</caption><tr><th>k</th><th>x / vetor</th><th>f / resíduo</th><th>erro</th><th>⚡</th><th>Fórmula</th></tr>${rows.map(t => `<tr><td>${t.k}</td><td>${number(t.x)}</td><td>${number(t.fx)}</td><td>${number(t.err)}</td><td>${number(t.cost)}</td><td>${esc(t.formula)}</td></tr>`).join('')}</table>` : `<p>${game.traces.length ? 'No Difícil, a telemetria completa custa 1 ⚡. D abre o modo professor.' : 'Nenhuma operação ainda.'}</p>`;
    if (professor) $('tq-hist').open = true;
    if (game.status === 'lost' && !finished) showResult();
  }
  const value = key => { const el = root.querySelector(`[data-field="${key}"]`); return !el ? undefined : el.type === 'number' || ['bits', 'gIndex'].includes(key) ? Number(el.value) : el.value; };
  const setField = (key, v) => { const el = root.querySelector(`[data-field="${key}"]`); if (el) el.value = v; };
  const feedback = e => { msg = `<p class="tq-bad">${esc(e.message || String(e))}</p>`; if ($('t-feedback')) $('t-feedback').innerHTML = msg; };
  function act(action = 'step', args = {}) {
    if (battle?.forcedSwitch) { game.reason = 'A Fúria exige outra ferramenta ou relíquia.'; msg = `<p class="tq-bad">${esc(game.reason)}</p>`; render(); return; }
    const trace = game.act(action, args); idle = 0; if (trace) { msg = explicar(trace); G.audio?.tacticalStep?.(trace, game.level, game.s); if (trace.flags.length && !G.options.reduzirMovimento) $('t-board').animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 240, iterations: 2 }); }
    battle?.afterStep(); if (battle?.forcedSwitch) msg += `<p class="tq-bad">${esc(game.reason)}</p>`; render();
  }
  function hint(more = false) {
    const s = game.s, h = HINTS[animalId || 'raizinha'] || HINTS.raizinha;
    if (more) {
      if (s.hintLevel >= 3) return;
      const next = s.hintLevel + 1, custo = next === 2 ? 1 : 3;
      // o que já foi pago nesta fase fica guardado: sair, voltar ou falar com outro personagem não cobra de novo
      if (dicaPaga(chave()) < next) { if (!G.progress.spendSeeds(custo)) throw new Error(`Sementes insuficientes: a dica ${next} custa ${custo} 🌰.`); registrarDica(chave(), next); }
      s.hintLevel = next;
    } else s.hintLevel = Math.max(1, s.hintLevel);
    s.hints++; s.usedL3 ||= s.hintLevel === 3;
    const text = h['dica' + s.hintLevel] + (game.level.relics.length ? ' Experimente: ' + game.level.relics.map(id => RELICS[id]).join(', ') + '.' : '');
    // sem bicho guia (chefões e Usina), quem ajuda é o pet escolhido
    const pet = G.pet || { nome: 'Raizinha', portrait: { kind: 'raizinha' }, voice: { pitch: 660, wave: 'triangle' } };
    $('t-hint').innerHTML = `<canvas width="96" height="96" id="t-portrait" aria-hidden="true"></canvas><span><b>${esc(ANIMALS[animalId]?.nome || pet.nome)} · dica ${s.hintLevel}/3:</b> ${esc(text)}${s.hintLevel === 3 ? ' <small>(com a dica 3, esta tentativa vale no máximo 2 ⭐)</small>' : ''}</span>`;
    drawPortrait($('t-portrait'), animalId ? 'animal' : pet.portrait.kind, animalId, performance.now() / 1000, 1);
    G.audio?.voice(text, ANIMALS[animalId]?.voz.pitch || pet.voice.pitch, ANIMALS[animalId]?.voz.onda || pet.voice.wave); G.audio?.sfx('dica'); render();
  }
  function equipar(tool) { const old = game.s.tool; game.switchTool(tool); if (battle && old !== game.s.tool) battle.forcedSwitch = false; msg = old !== game.s.tool ? `<p><b>Ferramenta equipada:</b> ${esc(FERRAMENTAS[tool]?.nome || tool)}.</p>` : msg; mount(); }
  function ativar(id) { game.useRelic(id); if (battle) battle.forcedSwitch = false; msg = `<p><b>Relíquia ativada:</b> ${esc(RELICS[id])}.</p>`; mount(); }
  function inventario(foco = null) {
    if (modal || finished) return;
    const host = $('tq-overlay');
    modal = abrirInventario(host, { session: game, foco, onEquip: id => { modal.close(); try { equipar(id); } catch (err) { feedback(err); } }, onRelic: id => { modal.close(); try { ativar(id); } catch (err) { feedback(err); } }, onClose: () => { modal = null; } });
  }
  function conceito() {
    if (modal) return;
    const reg = FERRAMENTAS[game.s.tool]?.regiao || regiao;
    const close = abrirDuvidas($('tq-overlay'), reg, { foco: game.s.tool, onClose: () => { modal = null; } });
    modal = { close };
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || closed || e.target.closest('#tq-overlay')) return; if (b.id === 'fz-back') { close(battle?.done ? battle.result() : game.result()); return; } if (finished) return;
    try {
      if (b.dataset.tool) { if (b.dataset.tool !== game.s.tool) equipar(b.dataset.tool); return; }
      const a = b.dataset.action;
      if (a === 'step') act();
      else if (a === 'submit') { if (battle) { if (battle.next()) { if (battle.done) showResult(); else { game = battle.session; msg = ''; mount(); } } else { msg = `<p class="tq-bad">${esc(game.reason)}</p>`; render(); } } else if (game.submit()) showResult(); else { msg = `<p class="tq-bad">${esc(game.reason)}</p>`; render(); } }
      else if (a === 'quit') { if (!b.dataset.confirm) { b.dataset.confirm = '1'; b.textContent = 'Sair mesmo?'; } else close({ ...game.result(), vitoria: false, abandonou: true, xp: 0, estrelas: 0, diary: null }); }
      else if (a === 'manual') { game.s.manual = !game.s.manual; b.classList.toggle('selected', game.s.manual); b.textContent = game.s.manual ? 'Sobrecarga ativa · tempo desacelerado' : 'Sobrecarga Manual'; }
      else if (a === 'undo') { game.undo(); msg = '<p>Última operação desfeita (2 ⚡).</p>'; render(); }
      else if (a === 'relic') ativar(b.dataset.relic);
      else if (a === 'inventory') inventario();
      else if (a === 'concept') conceito();
      else if (a === 'probe' || a === 'derivative') { $('probe-result').textContent = `${a === 'probe' ? 'f' : 'g′'}=${number(game.probe(value('probeX'), a === 'derivative'))}`; render(); }
      else if (['eliminate', 'swapRow', 'swapCol'].includes(a)) act(a, { i: value('rowI') - 1, j: value('rowJ') - 1, multiplier: value('multiplier') });
      else if (a === 'refine') { if (!game.s.relics.includes('refinement')) game.useRelic('refinement'); act('refine'); }
      else if (a === 'node') act('node', { x: value('nodeX'), y: value('nodeY') });
      else if (a === 'removeNode') act('removeNode', { index: value('nodeIndex') - 1 });
      else if (a === 'curvature') act('curvature', { index: value('curvatureIndex'), value: value('curvature') });
      else if (a === 'fitManual') act('fitManual', { a: value('coefA'), b: value('coefB'), c: value('coefC') });
      else if (a === 'batch') { for (let i = 0; i < 10 && game.status === 'play'; i++) act(); }
      else if (a === 'hint' || a === 'moreHint') hint(a === 'moreHint');
      else if (a === 'telemetry') { if (game.level.difficulty === 'D' && !telemetry) game.charge(1); telemetry = true; render(); }
      else if (a === 'professor') { professor = !professor; render(); }
    } catch (err) { feedback(err); }
  }, { signal });
  root.addEventListener('change', e => { const key = e.target.dataset.field || e.target.dataset.slider; if (finished || !['a', 'b', 'x', 'prev', 'gIndex', 'lambda', 'multiplicity', 'n', 'h', 'rounding', 'formulaChoice', 'bits', 'sumOrder'].includes(key)) return; try { const v = ['rounding', 'formulaChoice', 'sumOrder'].includes(key) ? e.target.value : Number(e.target.value); const previous = game.s[key]; game.configure({ [key]: v }); if (battle?.forcedSwitch && ['lambda', 'gIndex', 'multiplicity', 'h'].includes(key) && previous !== v) { battle.forcedSwitch = false; game.s.fury = 0; game.charge(2); } setField(key, v); render(); } catch (err) { feedback(err); } }, { signal });
  root.addEventListener('pointerdown', e => { const row = e.target.closest('[data-row]'); if (row) { rowDrag = Number(row.dataset.row); e.preventDefault(); } }, { signal });
  root.addEventListener('pointerup', e => { if (rowDrag == null) return; const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-row]'); if (row && Number(row.dataset.row) !== rowDrag) { const j = Number(row.dataset.row); setField('rowI', rowDrag + 1); setField('rowJ', j + 1); const m = game.s.A[j][rowDrag] / game.s.A[rowDrag][rowDrag]; setField('multiplier', Number.isFinite(m) ? Number(m.toPrecision(7)) : 0); msg = '<p>Confira o multiplicador e pressione Eliminar.</p>'; $('t-feedback').innerHTML = msg; } rowDrag = null; }, { signal });
  function pointerDown(e) { if (finished || !diagram?.fromPixel) return; const rect = e.currentTarget.getBoundingClientRect(), h = diagram.handles.find(h => Math.hypot(h.px - e.clientX + rect.left, h.py - e.clientY + rect.top) <= 24); if (h) { drag = { ...h }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); } }
  function pointerMove(e) {
    if (!drag) return; const rect = e.currentTarget.getBoundingClientRect(); drag.position = diagram.fromPixel(e.clientX - rect.left, e.clientY - rect.top);
    $('t-feedback').textContent = `x=${number(drag.position.x)}, y=${number(drag.position.y)}. Solte para aplicar.`;
    if (game.level.kind === 'root') { const old = game.s[drag.key]; game.s[drag.key] = drag.position.x; drawBoard(e.currentTarget, game, false); game.s[drag.key] = old; }
  }
  function pointerUp(e) { if (!drag) return; const h = drag; drag = null; e.currentTarget.releasePointerCapture(e.pointerId); if (!h.position) return; try { const x = Number(h.position.x.toPrecision(6)); if (h.key === 'node') act('node', { index: h.index, x, y: h.position.y }); else if (h.key === 'fit') { const ox = h.x === game.level.a ? game.level.b : game.level.a, oy = game.curveAt(ox), slope = (h.position.y - oy) / (x - ox); act('fitManual', { a: oy - slope * ox, b: slope }); } else { game.configure({ [h.key]: x }); setField(h.key, x); render(); } } catch (err) { feedback(err); } }
  function renderBits() {
    const layout = floatBits(Number($('bit-value').value), Number($('bit-width').value)), cut = Math.min(layout.mantissa, Number($('bit-cut').value)), mask = ((1n << BigInt(layout.width)) - 1n) << BigInt(layout.mantissa - cut), bits = layout.bits & mask;
    $('bit-panel').innerHTML = Array.from({ length: layout.width }, (_, i) => `<button type="button" data-bit="${layout.width - 1 - i}" class="bit ${i === 0 ? 'sign' : i <= layout.exponent ? 'exponent' : 'mantissa'}" aria-label="Alternar bit ${layout.width - 1 - i}">${Number((bits >> BigInt(layout.width - 1 - i)) & 1n)}</button>`).join('') + `<p>Sinal · expoente · mantissa → ${number(fromBits(bits, layout.width))}<br>ε da máquina = ${number(2 ** -layout.mantissa)}</p>`;
    $('bit-panel').querySelectorAll('[data-bit]').forEach(b => { b.onclick = () => { const v = fromBits(bits ^ (1n << BigInt(b.dataset.bit)), layout.width); if (Number.isFinite(v)) { $('bit-value').value = v; renderBits(); } else feedback(new Error('O padrão representa Infinity ou NaN.')); }; });
  }
  // O que o resultado significa na situação da missão
  function interpretacao() {
    const l = game.level, s = game.s, c = contextoDe(l); if (!c) return '';
    const v = l.kind === 'root' ? s.x : l.kind === 'float' ? (l.scenario === 'readings' ? s.sum : s.value) : l.kind === 'integral' ? s.value : l.kind === 'ode' ? s.y : l.kind === 'fit' ? s.coef : l.kind === 'linear' ? s.x : l.kind === 'interpolation' ? (s.value ?? s.error) : s.error;
    if (v == null) return '';
    return `<p class="tq-interp"><b>Interpretação:</b> ${esc(number(v))} ${esc(c.un)} — ${esc(c.sig)}. O erro final ${number(s.error)} ${s.error <= l.tau ? 'cabe' : 'não cabe'} na tolerância ${number(l.tau)}.</p>`;
  }
  function showResult() { if (finished) return; finished = true; modal?.close?.(); game.frozenGraph = $('t-board').toDataURL('image/png'); const r = battle?.done ? battle.result() : game.result(); G.audio?.sfx(r.vitoria ? 'vitoria' : 'derrota'); root.querySelectorAll('button,input,select').forEach(el => { el.disabled = true; }); $('t-result').innerHTML = `<section class="result"><h2>${r.vitoria ? 'Sistema estabilizado!' : 'A estrutura cedeu'}</h2><div class="stars">${'⭐'.repeat(r.estrelas)}${'☆'.repeat(3 - r.estrelas)}</div><p>${esc(game.reason)}</p>${r.vitoria ? interpretacao() : ''}<p>Erro ${number(r.erroFinal)} · ${r.iteracoes} operações numéricas · ${number(r.bateriaRestante)} ⚡</p><b>${r.xp} XP</b>${r.vitoria ? '' : '<p>O gráfico está congelado. O diagnóstico será guardado no Diário de Campo ao voltar.</p>'}<button id="fz-back" class="btn big">Voltar ao mundo</button></section>`; $('fz-back').focus(); }
  function close(r) { if (closed) return; closed = true; clearInterval(timer); resize.disconnect(); abort.abort(); root.classList.add('hidden'); root.innerHTML = ''; G.audio?.endTactical?.(); if (G.debug) G.tactical = null; resolve(r); }
  window.addEventListener('keydown', e => {
    if (closed || modal || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (finished) { if (['Enter', 'Escape'].includes(e.code)) close(battle?.done ? battle.result() : game.result()); return; }
    if (e.repeat || (e.target.tagName === 'BUTTON' && ['Space', 'Enter'].includes(e.code))) return;
    try {
      if (e.code === 'KeyD') { professor = !professor; render(); }
      else if (e.code === 'KeyH') hint();
      else if (e.code === 'KeyI') { e.preventDefault(); inventario(); }
      // números abrem o inventário na ferramenta da barra rápida: equipar exige confirmação (custo visível)
      else if (/^Digit[1-9]$/.test(e.code) && game.level.tools[Number(e.code.slice(5)) - 1]) { e.preventDefault(); inventario(game.level.tools[Number(e.code.slice(5)) - 1]); }
      else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); act(); }
      else if (e.code === 'Escape') $('fz-quit').click();
    } catch (err) { feedback(err); }
  }, { signal });
  const resize = new ResizeObserver(() => { if (!closed && $('t-board')) diagram = drawBoard($('t-board'), game, game.level.difficulty === 'F' || game.s.usedL3 || perksFor(opts.xp).preview); });
  let last = performance.now(); const timer = setInterval(() => { if (closed || finished) return; const now = performance.now(), dt = (now - last) / 1000; last = now; idle += dt; game.tick(dt); $('t-clock').textContent = game.s.manual ? `Sobrecarga · ${Math.ceil((Date.now() - game.started) / 1000)} s · integridade ${Math.ceil(game.s.integrity)}%` : 'Sobrecarga desligada: o tempo não conta.'; if (idle > 90 && !game.s.hintLevel && !modal) hint(); if (game.status === 'lost') render(); }, 250);
  mount(); resize.observe(root); if (freeHint) hint(); return promise;
}
