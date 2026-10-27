/* Numera Academy — gráfico de convergência (v9).
   Erro |xₖ − x*| por iteração, em escala logarítmica, com os métodos lado a lado.
   Usado no Terminal (aba "Convergência") e no gabarito do Treino. Os dados vêm de
   NumeraMath.convergenceRoot / convergenceSystem; este arquivo só desenha e cuida do hover.
   Cores: uma por método, sempre a mesma (a cor segue o método, não a posição na legenda). */
(function (global) {
  'use strict';
  const SLOT = { bisection: 1, falseposition: 2, fixedpoint: 3, newton: 4, secant: 5, seidel: 6, jacobi: 7 };
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pow10 = n => '10' + String(n).replace(/[-0-9]/g, c => SUP[c]);
  // 3,2·10⁻⁷ (vírgula decimal, expoente elevado)
  function sci(v) {
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    if (e >= -2 && e <= 3) return Number(v.toPrecision(3)).toLocaleString('pt-BR', { maximumFractionDigits: 6 });
    return m.toFixed(1).replace('.', ',') + '·' + pow10(e);
  }
  const dec = (v, d = 2) => Number(v).toFixed(d).replace('.', ',');
  // Desfecho de cada série (vem do motor). Séries antigas sem "status" contam como convergidas.
  const STATUS = { convergiu: 'convergência validada', parcial: 'trajetória parcial', divergiu: 'divergência detectada', falhou: 'incompatível com os dados', outra: 'outra raiz' };
  const statusOf = s => s.status || (s.diverged ? 'divergiu' : s.other ? 'outra' : 'convergiu');

  /* conv: resultado de convergenceRoot/convergenceSystem.
     o.titles: {método: nome}; o.highlight: método em destaque; o.caption: texto abaixo. */
  function chart(conv, o = {}) {
    const titles = o.titles || {}, name = m => titles[m] || m;
    const ok = conv.series.filter(s => s.errors && s.errors.length && !['outra', 'falhou'].includes(statusOf(s)));
    const skipped = conv.series.filter(s => !ok.includes(s));
    if (!ok.length) return `<div class="conv-empty"><p>Nenhum método produziu uma sequência para comparar com estes dados.</p>${skipped.map(s => `<p class="fine"><b>${esc(name(s.method))}:</b> ${esc(s.note || s.error || 'sem dados')}</p>`).join('')}</div>`;
    const K = Math.max(4, ...ok.map(s => s.errors.length - 1));
    const all = ok.flatMap(s => s.errors).filter(v => v > 0 && Number.isFinite(v));
    const top = Math.min(Math.ceil(Math.log10(Math.max(...all))), 8), bottom = Math.max(Math.floor(Math.log10(Math.min(...all))), -16);
    const yTop = Math.max(top, bottom + 3);
    const W = 640, H = 300, L = 58, R = 18, T = 16, B = 36;
    const X = k => L + k / K * (W - L - R), Y = v => T + (yTop - Math.log10(Math.max(v, Math.pow(10, bottom)))) / (yTop - bottom) * (H - T - B);
    const span = yTop - bottom, stepY = span > 12 ? 3 : span > 6 ? 2 : 1;
    const yTicks = []; for (let e = yTop; e >= bottom; e -= stepY) yTicks.push(e);
    const stepX = K <= 10 ? 1 : K <= 20 ? 2 : K <= 50 ? 5 : 10;
    const xTicks = []; for (let k = 0; k <= K; k += stepX) xTicks.push(k);
    const grid = yTicks.map(e => `<path class="conv-grid" d="M${L} ${Y(Math.pow(10, e)).toFixed(1)}H${W - R}"/><text class="conv-tick" x="${L - 8}" y="${(Y(Math.pow(10, e)) + 4).toFixed(1)}" text-anchor="end">${pow10(e)}</text>`).join('')
      + xTicks.map(k => `<text class="conv-tick" x="${X(k).toFixed(1)}" y="${H - 14}" text-anchor="middle">${k}</text>`).join('');
    const lines = ok.map(s => {
      const pts = s.errors.map((e, k) => [X(k), Y(e)]);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      const hl = o.highlight === s.method;
      const dots = pts.length <= 20 ? pts.map(p => `<circle class="conv-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${hl ? 4.5 : 4}"/>`).join('') : '';
      return `<g class="conv-series s${SLOT[s.method] || 8} ${hl ? 'hl' : ''} st-${statusOf(s)}" data-method="${esc(s.method)}"><path class="conv-line" d="${d}"/>${dots}</g>`;
    }).join('');
    const floorY = Y(conv.floor || 1e-15);
    const data = { K, L, R, W, series: ok.map(s => ({ n: name(s.method) + (statusOf(s) === 'convergiu' ? '' : ' (' + STATUS[statusOf(s)] + ')'), c: SLOT[s.method] || 8, e: s.errors })) };
    const legend = ok.map(s => {
      const meta = [], st = statusOf(s);
      if (st === 'divergiu') meta.push('o erro cresce');
      else if (s.order !== null && s.order !== undefined) meta.push(s.order < 1.25 ? `linear (p ≈ ${dec(s.order, 1)}), fator ≈ ${dec(s.rate, 2)} por passo` : `ordem observada p ≈ ${dec(s.order, 1)}`);
      if (s.reach !== null && s.reach !== undefined) meta.push(`${s.reach} ${s.reach === 1 ? 'passo' : 'passos'} até 10⁻⁸`);
      if (st === 'parcial' && s.iterations) meta.push(`parou em ${s.iterations} iterações`);
      return `<li class="${o.highlight === s.method ? 'hl' : ''} st-${st}"><svg class="conv-key s${SLOT[s.method] || 8} st-${st}" viewBox="0 0 22 8" aria-hidden="true"><path d="M1 4H21"/><circle cx="11" cy="4" r="3"/></svg><b>${esc(name(s.method))}${o.highlight === s.method ? `<span class="conv-this">${esc(o.highlightLabel || 'este exercício')}</span>` : ''}</b><span class="conv-status st-${st}">${st === 'convergiu' ? '✓ ' : st === 'divergiu' ? '↗ ' : '… '}${esc(STATUS[st])}</span><small>${esc(meta.join(' · ') || '—')}</small></li>`;
    }).join('');
    const notes = ok.filter(s => statusOf(s) !== 'convergiu' && s.note).concat(skipped);
    const skippedHtml = notes.length ? `<ul class="conv-skipped">${notes.map(s => `<li><b>${esc(name(s.method))}</b> (${esc(STATUS[statusOf(s)])}): ${esc(s.note || s.error || 'não se aplica a estes dados')}</li>`).join('')}</ul>` : '';
    const rows = Array.from({ length: K + 1 }, (_, k) => `<tr><td>${k}</td>${ok.map(s => `<td class="numeric">${s.errors[k] !== undefined ? sci(s.errors[k]) : ''}</td>`).join('')}</tr>`).join('');
    const summary = ok.map(s => `${name(s.method)}: ${STATUS[statusOf(s)]}${s.reach !== null && s.reach !== undefined ? ', ' + s.reach + ' passos até 10⁻⁸' : ', ' + (s.errors.length - 1) + ' passos'}`).join('; ');
    return `<figure class="conv">${o.title ? `<figcaption class="conv-title"><b>${esc(o.title)}</b>${o.subtitle ? `<span>${esc(o.subtitle)}</span>` : ''}</figcaption>` : ''}
      <ul class="conv-legend">${legend}</ul>
      <div class="conv-plot" tabindex="0" role="group" aria-roledescription="gráfico interativo" data-conv="${esc(JSON.stringify(data))}" aria-label="Gráfico do erro por iteração em escala logarítmica. ${esc(summary)}. Use as setas para percorrer as iterações.">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" focusable="false">${grid}
          <path class="conv-axis" d="M${L} ${T}V${H - B}H${W - R}"/>
          ${bottom <= -15 ? `<path class="conv-floor" d="M${L} ${floorY.toFixed(1)}H${W - R}"/><text class="conv-tick" x="${W - R}" y="${(floorY - 6).toFixed(1)}" text-anchor="end">limite da precisão do computador</text>` : ''}
          ${lines}
          <path class="conv-cross" d="M0 ${T}V${H - B}" visibility="hidden"/>
          <text class="conv-axis-label" x="${(L + W - R) / 2}" y="${H - 1}" text-anchor="middle">iteração k</text>
        </svg>
        <div class="conv-tip" role="status" aria-live="polite" hidden></div>
      </div>
      ${o.caption ? `<p class="fine conv-caption">${o.caption}</p>` : ''}${skippedHtml}
      <details class="conv-table"><summary>Ver os números</summary><div class="table-scroll"><table><thead><tr><th>k</th>${ok.map(s => `<th>${esc(name(s.method))}${statusOf(s) === 'convergiu' ? '' : `<br><small>${esc(STATUS[statusOf(s)])}</small>`}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="fine">Erro |xₖ − x*|${conv.reference !== undefined && !Array.isArray(conv.reference) ? ` com x* ≈ ${esc(Number(conv.reference.toPrecision(12)).toLocaleString('pt-BR', { maximumFractionDigits: 12 }))}` : ' (maior diferença entre as componentes e a solução)'}.</p></details></figure>`;
  }

  /* ---------- hover e teclado: uma única delegação para todos os gráficos ---------- */
  function show(plot, k) {
    let data; try { data = JSON.parse(plot.dataset.conv); } catch (_) { return; }
    k = Math.max(0, Math.min(data.K, Math.round(k)));
    plot.dataset.k = k;
    const svg = plot.querySelector('svg'), cross = plot.querySelector('.conv-cross'), tip = plot.querySelector('.conv-tip');
    if (!svg || !cross || !tip) return;
    const x = data.L + k / data.K * (data.W - data.L - data.R);
    cross.setAttribute('d', `M${x.toFixed(1)} 16V264`); cross.setAttribute('visibility', 'visible');
    while (tip.firstChild) tip.removeChild(tip.firstChild);
    const head = document.createElement('b'); head.textContent = 'Iteração ' + k; tip.appendChild(head);
    for (const s of data.series) {
      const row = document.createElement('div'); row.className = 'conv-tip-row';
      const key = document.createElement('i'); key.className = 'conv-tip-key s' + s.c; row.appendChild(key);
      const v = document.createElement('strong'); v.textContent = s.e[k] !== undefined ? sci(s.e[k]) : 'já parou'; row.appendChild(v);
      const n = document.createElement('span'); n.textContent = s.n; row.appendChild(n);
      tip.appendChild(row);
    }
    tip.hidden = false;
    const box = svg.getBoundingClientRect(), px = x / data.W * box.width;
    tip.style.left = (px > box.width * 0.6 ? Math.max(0, px - tip.offsetWidth - 12) : px + 12) + 'px';
  }
  function hide(plot) { const c = plot.querySelector('.conv-cross'), t = plot.querySelector('.conv-tip'); if (c) c.setAttribute('visibility', 'hidden'); if (t) t.hidden = true; }
  if (global.document && global.document.addEventListener) {
    const doc = global.document;
    doc.addEventListener('pointermove', e => {
      const plot = e.target.closest && e.target.closest('.conv-plot'); if (!plot) return;
      let data; try { data = JSON.parse(plot.dataset.conv); } catch (_) { return; }
      const box = plot.querySelector('svg').getBoundingClientRect(); if (!box.width) return;
      const vx = (e.clientX - box.left) / box.width * data.W;
      show(plot, (vx - data.L) / (data.W - data.L - data.R) * data.K);
    });
    doc.addEventListener('pointerout', e => { const plot = e.target.closest && e.target.closest('.conv-plot'); if (plot && !plot.contains(e.relatedTarget)) hide(plot); });
    doc.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('conv-plot')) show(e.target, Number(e.target.dataset.k || 0)); });
    doc.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('conv-plot')) hide(e.target); });
    doc.addEventListener('keydown', e => {
      const plot = e.target; if (!plot.classList || !plot.classList.contains('conv-plot')) return;
      const k = Number(plot.dataset.k || 0);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); show(plot, k + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); show(plot, k - 1); }
      else if (e.key === 'Home') { e.preventDefault(); show(plot, 0); }
      else if (e.key === 'End') { e.preventDefault(); show(plot, 1e9); }
    });
  }
  global.NumeraConv = { chart, sci, SLOT };
})(window);
