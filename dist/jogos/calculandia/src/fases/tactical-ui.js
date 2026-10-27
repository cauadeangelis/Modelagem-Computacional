import { G } from '../game.js';
import { HINTS } from '../data/hints.js';
import { ANIMALS } from '../data/animals.js';
import { drawPortrait } from '../ui/portraits.js';
import { getLevel, bossLevels, LABELS, RELICS } from './levels.js';
import { Session, Battle, perksFor } from './session.js';
import { drawBoard, number } from './board.js';
import { floatBits, fromBits } from '../engine/numeric.js';

export const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const costs = { bissecao: '1 ⚡ · linear · continuidade', falsaPosicao: '2 ⚡ · pode estagnar', pontoFixo: '1 ⚡ · confira |g′|', newton: '3 ⚡ · ordem 2 · derivada nula', secante: '2 ⚡ · ordem 1,618', gauss: '1 ⚡ / operação', pivoteamento: '1 ⚡ / operação', lu: 'n ⚡ fatorar · 1 ⚡ resolver', jacobi: '1 ⚡ / varredura', seidel: '1 ⚡ / varredura', euler: '1 ⚡ / passo · ordem 1', rk4: '4 ⚡ / passo · ordem 4', implicito: '1 ⚡ / passo · estável', trapezio: '1 ⚡ / avaliação · ordem 2', simpson13: '1 ⚡ / avaliação · n par', simpson38: '1 ⚡ / avaliação · n múltiplo de 3', combo: '1 ⚡ / avaliação · n ímpar', lagrange: 'n ⚡ / alteração', newtonInterp: '1 ⚡ / novo nó', spline: 'n−2 ⚡ / sistema', minimosQuadrados: '1 ⚡ / ajuste' };
export function batteryFor(method, difficulty) { return difficulty === 'B' ? bossLevels(method).battery : getLevel(method, difficulty).battery; }
const button = (action, label, extra = '') => `<button class="btn" data-action="${action}" ${extra}>${label}</button>`;
const field = (key, label, value, step = 'any') => `<label>${label}<input data-field="${key}" type="number" step="${step}" value="${value ?? 0}"></label>`;
const select = (key, label, values, current) => `<label>${label}<select data-field="${key}">${values.map(([v, t]) => `<option value="${v}" ${String(v) === String(current) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
function table(A, b, drag = false) { return `<div class="t-table"><table>${A.map((r, i) => `<tr ${drag ? `data-row="${i}" tabindex="0"` : ''}><th>L${i + 1}</th>${r.map(v => `<td>${number(v)}</td>`).join('')}${b ? `<td class="rhs">${number(b[i])}</td>` : ''}</tr>`).join('')}</table></div>`; }

export function runFase({ s: settlement, nivel, animalId, freeHint = false }) {
  const root = document.getElementById('fase'), opts = { xp: G.progress.d.rpg?.xp || 0, combo: G.progress.d.rpg?.combo || 1, relics: G.progress.d.rpg?.relics || [] }, battle = nivel === 'B' ? new Battle(settlement.metodo, opts) : null;
  let game = battle?.session || new Session(getLevel(settlement.metodo, nivel), opts), professor = false, telemetry = false, finished = false, closed = false, resolve, diagram, drag, rowDrag, idle = 0;
  const promise = new Promise(r => { resolve = r; }), abort = new AbortController(), signal = abort.signal, $ = id => root.querySelector('#' + id);
  root.addEventListener('pointerdown', () => G.audio?.unlock(), { signal });
  if (G.debug) G.tactical = { get session() { return game; }, battle };
  G.audio?.beginTactical?.(); root.classList.remove('hidden');
  function controls() {
    const l = game.level, s = game.s; let html = '';
    if (l.kind === 'root') html = `<p>Arraste os círculos roxos ou ajuste os valores. Reposicionar após começar custa 1 ⚡.</p>${field('a', 'Âncora a', s.a)}${field('b', 'Âncora b', s.b)}${field('x', 'Mira / x₁', s.x)}${s.tool === 'secante' ? field('prev', 'Sonda x₀', s.prev) : ''}${l.gs ? select('gIndex', 'Fiação g(x)', l.gNames.map((t, i) => [i, t]), s.gIndex) + field('lambda', 'Amortecimento λ', s.lambda, '.05') : ''}${s.tool === 'newton' ? field('multiplicity', 'Multiplicidade m', s.multiplicity, '1') : ''}${field('probeX', 'Posição da sonda', s.x)}${button('probe', 'Sondar f · 1 ⚡')}${l.gs ? button('derivative', 'Medir g′ · 1 ⚡') : ''}<output id="probe-result"></output>`;
    if (l.kind === 'linear') html = `<p>Arraste uma linha sobre outra para preparar a eliminação, confira o multiplicador e aplique. Auto faz uma operação.</p><div id="matrix-editor"></div>${field('rowI', 'Linha pivô (1…n)', 1, '1')}${field('rowJ', 'Linha destino', 2, '1')}${field('multiplier', 'Multiplicador', 1)}${button('eliminate', 'Eliminar · 1 ⚡')}${button('swapRow', 'Trocar linhas · 1 ⚡')}${button('swapCol', 'Trocar colunas · 1 ⚡')}${l.relics.includes('refinement') ? button('refine', 'Refinar solução') : ''}<div id="factors"></div>`;
    if (l.kind === 'interpolation') html = `<p>Arraste os nós. Inserir por Newton preserva os coeficientes anteriores.</p>${field('nodeX', 'Novo nó x', l.b)}${!l.f ? field('nodeY', 'Valor y', 0) : ''}${button('node', 'Plantar nó')}${field('nodeIndex', 'Nó a remover', s.xs.length, '1')}${button('removeNode', 'Remover · 1 ⚡')}`;
    if (l.kind === 'spline') html = `<p>Ajuste as curvaturas ou use Auto para resolver o sistema por Thomas.</p>${field('curvatureIndex', 'Nó interno', 1, '1')}${field('curvature', 'Curvatura M', 0, '.01')}${button('curvature', 'Ajustar M · 1 ⚡')}<div id="factors"></div>`;
    if (l.kind === 'fit') html = `<p>As linhas douradas são resíduos. Arraste a reta, ajuste seus coeficientes ou resolva as equações normais.</p>${field('coefA', 'a', s.coef[0], '.01')}${field('coefB', 'b', s.coef[1], '.01') + (l.degree === 2 ? field('coefC', 'c', s.coef[2], '.01') : '')}${button('fitManual', 'Aplicar · 1 ⚡')}<div id="factors"></div>`;
    if (l.kind === 'integral') html = `<p>Escolha n antes de integrar. Cada avaliação consome energia${l.uCurve ? '; nesta missão cada experimento custa 1 ⚡' : ''}.</p>${field('n', 'Intervalos n', s.n, '1')}<label>Subdivisão<input data-slider="n" type="range" min="1" max="${l.uCurve ? 1500 : 120}" value="${s.n}"></label><output id="extra-info"></output>`;
    if (l.kind === 'ode') html = `<p>Siga o campo até t=${l.end}. RK4 usa quatro sondas, pesos 1,2,2,1.</p>${field('h', 'Passo h', s.h, '.005')}<label>Passo<input data-slider="h" type="range" min="0.005" max="0.5" step="0.005" value="${s.h}" ${l.forceH ? 'disabled' : ''}></label><output id="extra-info"></output>`;
    if (l.kind === 'float') html = (l.scenario === 'readings' ? select('rounding', 'Guardar a próxima leitura', [['round', 'Arredondar'], ['truncate', 'Truncar']], s.rounding) + button('batch', 'Processar 10 leituras') : l.scenario === 'cancellation' ? select('formulaChoice', 'Bloco algébrico', [['direct', '(1000−√Δ)/2'], ['stable', 'c/(a·x₁)']], s.formulaChoice) : l.scenario === 'overflow' ? select('formulaChoice', 'Ordem das operações', [['direct', '√(x²+y²)'], ['scaled', 'm·√((x/m)²+(y/m)²)']], s.formulaChoice) + select('bits', 'Precisão', [[16, '16 bits (missão)'], [32, '32 bits (laboratório)'], [64, '64 bits (laboratório)']], s.bits) : select('sumOrder', 'Ordem da soma', [['forward', 'Maior primeiro'], ['reverse', 'Menor primeiro'], ['kahan', 'Kahan']], s.sumOrder)) + `<details><summary>Laboratório de bits</summary><p>Altere os bits e observe o valor; este laboratório é independente da missão.</p><label>Máquina<select id="bit-width"><option value="16">16 bits</option><option value="32" selected>32 bits</option><option value="64">64 bits</option></select></label><input id="bit-value" type="number" value="3.14159" step="any" aria-label="Valor do laboratório"><label>Corte da mantissa<input id="bit-cut" type="range" min="1" max="23" value="23"></label><div id="bit-panel"></div></details>`;
    return `<div class="t-controls">${html}</div>`;
  }
  function mount() {
    const l = game.level;
    root.innerHTML = `<section class="fase-box tactical"><header class="fase-head"><div><small>${esc(settlement.nome)} · ${nivel === 'B' ? `${esc(battle.spec.name)} · ${battle.index + 1}/${battle.spec.levels.length}` : ({ F: 'Fácil', M: 'Médio', D: 'Difícil' })[nivel]}</small><h2>${esc(l.name)}</h2></div>${button('quit', 'Sair', 'id="fz-quit"')}</header><div id="t-hud" class="t-hud" aria-live="polite"></div><div class="t-layout"><aside class="t-brief"><h3>Missão</h3><p>${esc(l.mission)}</p><p><b>${esc(l.formula)}</b></p><p>${esc(l.metric)} ≤ ${number(l.tau)}.<br>Bateria ou integridade zero: derrota.</p><div id="t-clock"></div><p>Engenheiro nível ${perksFor(opts.xp).level}<br>${opts.xp} XP</p><h3>Relíquias</h3>${l.relics.map(id => button('relic', RELICS[id], `data-relic="${id}"`)).join('') || '<small>Novos conceitos entram no diário ao vencer chefões ou estudar derrotas.</small>'}</aside><main class="t-field"><canvas id="t-board" tabindex="0" aria-label="Campo numérico; controles equivalentes abaixo"></canvas>${controls()}<div id="t-feedback" class="t-feedback" role="status"></div></main><aside class="t-arsenal"><h3>Arsenal</h3><small>Escolha inicial grátis. Trocar após agir: 2 ⚡.</small>${l.tools.map(t => `<button class="t-tool" data-tool="${t}"><b>${LABELS[t] || t}</b><small>${costs[t] || 'Operação numérica'}</small></button>`).join('')}</aside></div><footer class="t-actions">${button('step', '▶ Auto: um passo', 'id="t-step"')}${button('manual', 'Sobrecarga Manual')}${button('undo', '↶ Desfazer · 2 ⚡')}${button('submit', '✓ Estabilizar', 'id="t-submit"')}${button('hint', 'H · Dica')}${button('moreHint', 'Mais dica', 'id="t-more-hint"')}${button('telemetry', 'Telemetria')}${button('professor', 'D · Professor')}</footer><p id="t-hint" class="t-hint"></p><div id="t-telemetry" class="t-telemetry"></div><div id="t-result"></div></section>`;
    const canvas = $('t-board'); canvas.addEventListener('pointerdown', pointerDown, { signal }); canvas.addEventListener('pointermove', pointerMove, { signal }); canvas.addEventListener('pointerup', pointerUp, { signal }); canvas.addEventListener('pointercancel', () => { drag = null; }, { signal });
    if ($('bit-value')) { $('bit-value').oninput = renderBits; $('bit-cut').oninput = renderBits; $('bit-width').onchange = () => { $('bit-cut').value = $('bit-cut').max = floatBits(0, Number($('bit-width').value)).mantissa; renderBits(); }; renderBits(); }
    if (l.forceH) root.querySelector('[data-field="h"]').readOnly = true;
    telemetry = false; render();
  }
  function render() {
    if (closed) return; const s = game.s, l = game.level, light = s.flags.length ? 'red' : s.rho < .5 ? 'green' : 'yellow', radarError = s.relativeError ?? s.error, radar = Number.isFinite(radarError) ? Math.max(0, Math.min(8, -Math.log10(Math.max(radarError, 1e-16)))) : 0;
    $('t-hud').innerHTML = `<span>⚡ <b>${number(s.battery)}/${s.batteryMax}</b><meter max="${s.batteryMax}" value="${s.battery}"></meter></span><span>♥ <b>${Math.ceil(s.integrity)}%</b><meter max="100" value="${s.integrity}"></meter></span><span>Erro <b>${number(s.error)}</b><span class="t-radar" title="10⁰ a 10⁻⁸"><i style="width:${radar / 8 * 100}%"></i></span></span><span class="t-signal ${light}">ρ ${number(s.rho)} · p ${number(s.order)}<br>${s.flags.length ? s.flags.map(esc).join(' · ') : light === 'green' ? 'Convergência rápida / início' : 'Observe a convergência'}</span>${battle ? `<span>Fúria ${Math.min(100, s.fury)}%<meter max="100" value="${s.fury}"></meter></span>` : ''}`;
    root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('selected', b.dataset.tool === s.tool)); root.querySelectorAll('[data-relic]').forEach(b => { b.classList.toggle('selected', s.relics.includes(b.dataset.relic)); b.disabled = finished || s.relics.includes(b.dataset.relic); });
    $('t-submit').disabled = finished || !game.ready; $('t-step').disabled = finished; $('t-feedback').textContent = game.reason || 'Prepare os controles e avance uma operação.';
    for (const key of ['a', 'b', 'x', 'prev', 'gIndex', 'lambda', 'multiplicity', 'h', 'n']) { const el = root.querySelector(`[data-field="${key}"]`); if (el && document.activeElement !== el && Number.isFinite(s[key])) el.value = Number(s[key].toPrecision(10)); }
    $('t-more-hint').hidden = s.hintLevel === 0 || s.hintLevel >= 3; $('t-more-hint').textContent = `Mais dica · ${s.hintLevel === 1 ? 1 : 3} 🌰`;
    diagram = drawBoard($('t-board'), game, l.difficulty === 'F' || s.usedL3 || perksFor(opts.xp).preview);
    if ($('matrix-editor')) $('matrix-editor').innerHTML = table(s.A, s.bvec, true);
    if ($('factors')) $('factors').innerHTML = s.factors ? `<details open><summary>Fatores preservados · P=(${s.factors.P.map(i => i + 1)})</summary><b>L</b>${table(s.factors.L)}<b>U</b>${table(s.factors.U)}</details>` : s.system ? `<details open><summary>Sistema aplicado</summary>${table(s.system.A, s.system.b)}</details>` : '';
    if ($('extra-info')) $('extra-info').textContent = l.kind === 'ode' ? `t=${number(s.t)} · y=${number(s.y)} · sondas k=${s.slopes.map(number).join('; ')} · estabilidade=${number(s.stability)}` : `h=${number((l.b - l.a) / s.n)} · avaliações=${s.evaluations} · cota=${number(s.bound)}${l.uCurve ? ` · erro medido=${number(s.measuredError)} · modelo=${number(s.modelError)} · mínimo=${number(s.modelMinimum)}` : ''}`;
    const rows = professor || l.difficulty === 'F' || telemetry ? game.traces : l.difficulty === 'M' ? game.traces.slice(-2) : [];
    $('t-telemetry').innerHTML = rows.length ? `<table><caption>${professor ? 'Professor: histórico completo' : 'Telemetria'}</caption><tr><th>k</th><th>x / vetor</th><th>f / resíduo</th><th>erro</th><th>⚡</th><th>Fórmula</th></tr>${rows.map(t => `<tr><td>${t.k}</td><td>${number(t.x)}</td><td>${number(t.fx)}</td><td>${number(t.err)}</td><td>${number(t.cost)}</td><td>${esc(t.formula)}</td></tr>`).join('')}</table>` : '<p>Telemetria D: 1 ⚡ sob demanda. D abre o modo professor.</p>';
    if (game.status === 'lost' && !finished) showResult();
  }
  const value = key => { const el = root.querySelector(`[data-field="${key}"]`); return !el ? undefined : el.type === 'number' || ['bits', 'gIndex'].includes(key) ? Number(el.value) : el.value; };
  const setField = (key, v) => { const el = root.querySelector(`[data-field="${key}"]`); if (el) el.value = v; };
  const feedback = e => { $('t-feedback').textContent = e.message || String(e); };
  function act(action = 'step', args = {}) {
    if (battle?.forcedSwitch) { game.reason = 'A Fúria exige outra ferramenta ou relíquia.'; render(); return; }
    const trace = game.act(action, args); idle = 0; if (trace) { G.audio?.tacticalStep?.(trace, game.level, game.s); if (trace.flags.length && !G.options.reduzirMovimento) $('t-board').animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 240, iterations: 2 }); }
    battle?.afterStep(); render();
  }
  function hint(more = false) {
    const s = game.s, h = HINTS[animalId || 'raizinha'] || HINTS.raizinha;
    if (more) { if (s.hintLevel >= 3) return; if (!G.progress.spendSeeds(s.hintLevel === 1 ? 1 : 3)) throw new Error('Sementes insuficientes.'); G.progress.save(); s.hintLevel++; } else s.hintLevel = Math.max(1, s.hintLevel);
    s.hints++; s.usedL3 ||= s.hintLevel === 3;
    const text = h['dica' + s.hintLevel] + (game.level.relics.length ? ' Experimente: ' + game.level.relics.map(id => RELICS[id]).join(', ') + '.' : '');
    $('t-hint').innerHTML = `<canvas width="96" height="96" id="t-portrait" aria-hidden="true"></canvas><span><b>${esc(ANIMALS[animalId]?.nome || 'Raizinha')}:</b> ${esc(text)}</span>`;
    drawPortrait($('t-portrait'), animalId ? 'animal' : 'raizinha', animalId, performance.now() / 1000, 1);
    G.audio?.voice(text, ANIMALS[animalId]?.voz.pitch || 660, ANIMALS[animalId]?.voz.onda || 'triangle'); G.audio?.sfx('dica'); render();
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || closed) return; if (b.id === 'fz-back') { close(battle?.done ? battle.result() : game.result()); return; } if (finished) return;
    try {
      if (b.dataset.tool) { const old = game.s.tool; game.switchTool(b.dataset.tool); if (battle && old !== game.s.tool) battle.forcedSwitch = false; mount(); return; }
      const a = b.dataset.action;
      if (a === 'step') act();
      else if (a === 'submit') { if (battle) { if (battle.next()) { if (battle.done) showResult(); else { game = battle.session; mount(); } } } else if (game.submit()) showResult(); }
      else if (a === 'quit') { if (!b.dataset.confirm) { b.dataset.confirm = '1'; b.textContent = 'Sair mesmo?'; } else close({ ...game.result(), vitoria: false, abandonou: true, xp: 0, estrelas: 0, diary: null }); }
      else if (a === 'manual') { game.s.manual = !game.s.manual; b.classList.toggle('selected', game.s.manual); b.textContent = game.s.manual ? 'Sobrecarga ativa · tempo desacelerado' : 'Sobrecarga Manual'; }
      else if (a === 'undo') { game.undo(); render(); }
      else if (a === 'relic') { game.useRelic(b.dataset.relic); if (battle) battle.forcedSwitch = false; mount(); }
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
  root.addEventListener('pointerup', e => { if (rowDrag == null) return; const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-row]'); if (row && Number(row.dataset.row) !== rowDrag) { const j = Number(row.dataset.row); setField('rowI', rowDrag + 1); setField('rowJ', j + 1); const m = game.s.A[j][rowDrag] / game.s.A[rowDrag][rowDrag]; setField('multiplier', Number.isFinite(m) ? Number(m.toPrecision(7)) : 0); feedback('Confira o multiplicador e pressione Eliminar.'); } rowDrag = null; }, { signal });
  function pointerDown(e) { if (finished || !diagram?.fromPixel) return; const rect = e.currentTarget.getBoundingClientRect(), h = diagram.handles.find(h => Math.hypot(h.px - e.clientX + rect.left, h.py - e.clientY + rect.top) <= 24); if (h) { drag = { ...h }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); } }
  function pointerMove(e) {
    if (!drag) return; const rect = e.currentTarget.getBoundingClientRect(); drag.position = diagram.fromPixel(e.clientX - rect.left, e.clientY - rect.top);
    feedback(`x=${number(drag.position.x)}, y=${number(drag.position.y)}. Solte para aplicar.`);
    if (game.level.kind === 'root') { const old = game.s[drag.key]; game.s[drag.key] = drag.position.x; drawBoard(e.currentTarget, game, false); game.s[drag.key] = old; }
  }
  function pointerUp(e) { if (!drag) return; const h = drag; drag = null; e.currentTarget.releasePointerCapture(e.pointerId); if (!h.position) return; try { const x = Number(h.position.x.toPrecision(6)); if (h.key === 'node') act('node', { index: h.index, x, y: h.position.y }); else if (h.key === 'fit') { const ox = h.x === game.level.a ? game.level.b : game.level.a, oy = game.curveAt(ox), slope = (h.position.y - oy) / (x - ox); act('fitManual', { a: oy - slope * ox, b: slope }); } else { game.configure({ [h.key]: x }); setField(h.key, x); render(); } } catch (err) { feedback(err); } }
  function renderBits() {
    const layout = floatBits(Number($('bit-value').value), Number($('bit-width').value)), cut = Math.min(layout.mantissa, Number($('bit-cut').value)), mask = ((1n << BigInt(layout.width)) - 1n) << BigInt(layout.mantissa - cut), bits = layout.bits & mask;
    $('bit-panel').innerHTML = Array.from({ length: layout.width }, (_, i) => `<button type="button" data-bit="${layout.width - 1 - i}" class="bit ${i === 0 ? 'sign' : i <= layout.exponent ? 'exponent' : 'mantissa'}" aria-label="Alternar bit ${layout.width - 1 - i}">${Number((bits >> BigInt(layout.width - 1 - i)) & 1n)}</button>`).join('') + `<p>Sinal · expoente · mantissa → ${number(fromBits(bits, layout.width))}<br>ε da máquina = ${number(2 ** -layout.mantissa)}</p>`;
    $('bit-panel').querySelectorAll('[data-bit]').forEach(b => { b.onclick = () => { const v = fromBits(bits ^ (1n << BigInt(b.dataset.bit)), layout.width); if (Number.isFinite(v)) { $('bit-value').value = v; renderBits(); } else feedback('O padrão representa Infinity ou NaN.'); }; });
  }
  function showResult() { if (finished) return; finished = true; game.frozenGraph = $('t-board').toDataURL('image/png'); const r = battle?.done ? battle.result() : game.result(); G.audio?.sfx(r.vitoria ? 'vitoria' : 'derrota'); root.querySelectorAll('button,input,select').forEach(el => { el.disabled = true; }); $('t-result').innerHTML = `<section class="result"><h2>${r.vitoria ? 'Sistema estabilizado!' : 'A estrutura cedeu'}</h2><div class="stars">${'⭐'.repeat(r.estrelas)}${'☆'.repeat(3 - r.estrelas)}</div><p>${esc(game.reason)}</p><p>Erro ${number(r.erroFinal)} · ${r.iteracoes} operações numéricas · ${number(r.bateriaRestante)} ⚡</p><b>${r.xp} XP</b>${r.vitoria ? '' : '<p>O gráfico está congelado. O diagnóstico será guardado no Diário de Campo ao voltar.</p>'}<button id="fz-back" class="btn big">Voltar ao mundo</button></section>`; $('t-result').scrollIntoView({ block: 'nearest' }); }
  function close(r) { if (closed) return; closed = true; clearInterval(timer); resize.disconnect(); abort.abort(); root.classList.add('hidden'); root.innerHTML = ''; G.audio?.endTactical?.(); if (G.debug) G.tactical = null; resolve(r); }
  window.addEventListener('keydown', e => { if (closed || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (finished) { if (['Enter', 'Escape'].includes(e.code)) close(battle?.done ? battle.result() : game.result()); return; } if (e.repeat || (e.target.tagName === 'BUTTON' && ['Space', 'Enter'].includes(e.code))) return; try { if (e.code === 'KeyD') { professor = !professor; render(); } else if (e.code === 'KeyH') hint(); else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); act(); } else if (e.code === 'Escape') $('fz-quit').click(); } catch (err) { feedback(err); } }, { signal });
  const resize = new ResizeObserver(() => { if (!closed && $('t-board')) diagram = drawBoard($('t-board'), game, game.level.difficulty === 'F' || game.s.usedL3 || perksFor(opts.xp).preview); });
  let last = performance.now(); const timer = setInterval(() => { if (closed || finished) return; const now = performance.now(), dt = (now - last) / 1000; last = now; idle += dt; game.tick(dt); $('t-clock').textContent = game.s.manual ? `Sobrecarga · ${Math.ceil((Date.now() - game.started) / 1000)} s · integridade ${Math.ceil(game.s.integrity)}%` : 'Auto: cada ação avança uma operação.'; if (idle > 90 && !game.s.hintLevel) hint(); if (game.status === 'lost') render(); }, 250);
  mount(); resize.observe(root); if (freeHint) hint(); return promise;
}





