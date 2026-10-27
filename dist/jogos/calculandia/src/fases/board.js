import { sassenfeld, interpolate } from '../engine/numeric.js';
export const number = v => Array.isArray(v) ? '(' + v.map(number).join('; ') + ')' : v == null ? '—' : !Number.isFinite(v) ? (Number.isNaN(v) ? 'indefinido' : '∞') : Math.abs(v) > 0 && (Math.abs(v) < .0001 || Math.abs(v) > 1e6) ? v.toExponential(3) : Number(v.toPrecision(7)).toLocaleString('pt-BR', { maximumFractionDigits: 7 });
export function drawBoard(canvas, session, preview = false) {
  const l = session.level, s = session.s, dpr = Math.min(devicePixelRatio || 1, 3), W = Math.max(280, canvas.clientWidth), H = Math.max(250, Math.min(470, W * .65));
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = H + 'px';
  const c = canvas.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = '#fffdf6'; c.fillRect(0, 0, W, H); c.font = '14px system-ui';
  const handles = [];
  if (l.kind === 'float') {
    c.fillStyle = '#28344b'; c.font = 'bold 24px system-ui'; c.fillText(l.scenario === 'readings' ? `Leitura ${Math.min(100, s.readIndex + 1)}/100` : 'Computador de bordo', 20, 38);
    c.font = `${Math.min(40, W / 12)}px monospace`; c.fillText(number(l.readings?.[s.readIndex] ?? s.value ?? 0), 20, 105);
    c.font = '16px system-ui'; const lines = l.scenario === 'readings' ? [`Soma armazenada: ${number(s.sum)}`, `Soma exata: ${number(s.exactSum)}`, `Viés: ${number(s.sum - s.exactSum)}`, 'Truncar corta os dígitos; arredondar equilibra o erro.'] : [`Resultado: ${number(s.value)}`, `Erro: ${number(s.error)}`, l.scenario === 'overflow' ? 'Half: 1 sinal · 5 expoente · 10 fração' : 'Preserve os dígitos significativos.'];
    lines.forEach((t, i) => c.fillText(t, 20, 155 + i * 32)); return { handles };
  }
  if (l.kind === 'linear') {
    const n = s.A.length, cell = Math.min(65, (W - 60) / (n + 1)), start = (W - (n + 1) * cell) / 2;
    s.A.forEach((r, i) => [...r, s.bvec[i]].forEach((v, j) => { const x = start + j * cell, y = 35 + i * 45; c.fillStyle = i === j ? '#fff1ad' : j === n ? '#cceee9' : '#f2e6d2'; c.fillRect(x, y, cell - 3, 42); c.fillStyle = '#26364c'; c.textAlign = 'center'; c.fillText(number(v), x + cell / 2, y + 27); }));
    c.textAlign = 'left'; c.fillStyle = '#26364c'; c.fillText('Vetor atual: ' + number(s.x), 15, 60 + n * 45);
    c.fillText('Sassenfeld β: ' + sassenfeld(s.A).map(number).join(' · '), 15, 88 + n * 45);
    if (s.growth) c.fillText('Crescimento: ' + number(s.growth), 15, 116 + n * 45);
    return { handles };
  }
  let a = l.domain?.[0] ?? l.a ?? 0, b = l.domain?.[1] ?? l.b ?? l.end ?? 1, curves = [], points = [];
  if (l.kind === 'root') {
    if (!l.fog) curves.push({ f: s.tool === 'pontoFixo' ? l.gs[s.gIndex] : l.f, color: '#197e86' });
    if (s.tool === 'pontoFixo') curves.push({ f: x => x, color: '#738299' });
    points = s.probes.filter(p => !p.derivative).map(p => ({ x: p.x, y: p.y, label: 'sonda' }));
    if (['bissecao', 'falsaPosicao'].includes(s.tool)) { handles.push({ key: 'a', x: s.a, y: 0, label: 'a' }, { key: 'b', x: s.b, y: 0, label: 'b' }); }
    else { handles.push({ key: 'x', x: s.x, y: 0, label: s.tool === 'newton' ? 'mira' : 'x₁' }); if (s.tool === 'secante') handles.push({ key: 'prev', x: s.prev, y: 0, label: 'x₀' }); }
    if (s.k && Number.isFinite(s.x)) points.push({ x: s.x, y: s.fx || 0, label: 'xₖ' });
  } else if (l.kind === 'ode') { a = 0; b = l.end * 1.05; curves.push({ f: l.exact, color: '#197e86' }); points = s.points.map(([x, y]) => ({ x, y })); }
  else if (l.kind === 'integral') { curves.push({ f: s.substitution ? x => 2 * x * x : l.f, color: '#197e86' }); }
  else { if (l.f) curves.push({ f: l.f, color: '#9bafa9' }); curves.push({ f: x => session.curveAt(x), color: '#197e86' }); points = s.xs.map((x, i) => ({ x, y: s.ys[i], label: `${i + 1}` })); if (l.kind === 'interpolation') points.forEach((p, i) => handles.push({ ...p, key: 'node', index: i })); if (l.kind === 'fit' && !l.exponential && l.degree === 1) handles.push({ key: 'fit', x: a, y: session.curveAt(a), label: 'a' }, { key: 'fit', x: b, y: session.curveAt(b), label: 'b' }); }
  if (!(a < b)) { a = -1; b = 3; }
  const values = [0, ...points.map(p => p.y)]; curves.forEach(curve => { for (let i = 0; i <= 150; i++) { const y = curve.f(a + (b - a) * i / 150); if (Number.isFinite(y) && Math.abs(y) < 100) values.push(y); } });
  let low = Math.min(...values.filter(Number.isFinite)), high = Math.max(...values.filter(Number.isFinite)); if (low === high) high = low + 1;
  const pad = (high - low) * .15; low -= pad; high += pad;
  const X = x => 45 + (x - a) * (W - 65) / (b - a), Y = y => H - 35 - (y - low) * (H - 65) / (high - low);
  const point = (x, y) => { c.beginPath(); c.arc(X(x), Y(y), 6, 0, Math.PI * 2); c.fill(); };
  if (l.kind === 'root' && ['bissecao', 'falsaPosicao'].includes(s.tool)) { c.fillStyle = '#d4f0e5'; c.fillRect(X(s.a), 20, Math.max(0, X(s.b) - X(s.a)), H - 55); }
  c.strokeStyle = '#dce4e6'; c.fillStyle = '#526276'; c.font = '12px system-ui';
  for (let i = 0; i <= 5; i++) { const x = a + (b - a) * i / 5; c.beginPath(); c.moveTo(X(x), 20); c.lineTo(X(x), H - 35); c.stroke(); c.fillText(number(x), X(x) - 12, H - 13); }
  c.strokeStyle = '#536777'; c.beginPath(); c.moveTo(40, Y(0)); c.lineTo(W - 15, Y(0)); c.stroke();
  function path(f, color, dashed = false) { c.save(); c.beginPath(); c.rect(40, 15, W - 55, H - 45); c.clip(); c.strokeStyle = color; c.lineWidth = 2; c.setLineDash(dashed ? [6, 5] : []); c.beginPath(); let open = false; for (let i = 0; i <= 300; i++) { const x = a + (b - a) * i / 300, y = f(x); if (!Number.isFinite(y) || y < low - 2 * (high - low) || y > high + 2 * (high - low)) { open = false; continue; } if (!open) c.moveTo(X(x), Y(y)); else c.lineTo(X(x), Y(y)); open = true; } c.stroke(); c.restore(); }
  curves.forEach(curve => path(curve.f, curve.color));
  if (l.kind === 'root' && s.tool === 'newton' && l.df && !l.fog) path(x => l.f(s.x) + l.df(s.x) * (x - s.x), '#d27633', true);
  if (l.kind === 'root' && ['secante', 'falsaPosicao'].includes(s.tool) && !l.fog) { const x0 = s.tool === 'secante' ? s.prev : s.a, x1 = s.tool === 'secante' ? s.x : s.b; if (x1 !== x0) path(x => l.f(x0) + (l.f(x1) - l.f(x0)) * (x - x0) / (x1 - x0), '#d27633', true); }
  if (l.kind === 'root' && preview && !l.fog) { const next = session.preview().x; if (Number.isFinite(next)) { c.strokeStyle = '#9058c0'; c.setLineDash([5, 5]); c.strokeRect(X(next) - 9, Y(0) - 9, 18, 18); c.setLineDash([]); } }
  if (l.kind === 'root' && s.tool === 'pontoFixo') {
    const xs = [l.x, ...session.traces.map(t => t.x)].filter(Number.isFinite); c.strokeStyle = '#d27633'; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < xs.length - 1; i++) { c.moveTo(X(xs[i]), Y(xs[i])); c.lineTo(X(xs[i]), Y(xs[i + 1])); c.lineTo(X(xs[i + 1]), Y(xs[i + 1])); } c.stroke();
  }
  if (l.kind === 'integral') {
    const f = curves[0].f, n = Math.min(s.n || 4, 160), step = (b - a) / n; c.save(); c.globalAlpha = .25; c.fillStyle = '#41b9c0';
    for (let i = 0; i < n;) { const count = Math.min(n - i, s.tool === 'trapezio' ? 1 : s.tool === 'simpson38' || (s.tool === 'combo' && n - i === 3) ? 3 : 2), xs = Array.from({ length: count + 1 }, (_, k) => a + (i + k) * step), ys = xs.map(f); c.beginPath(); c.moveTo(X(xs[0]), Y(0)); for (let j = 0; j <= 30; j++) { const x = xs[0] + (xs.at(-1) - xs[0]) * j / 30; c.lineTo(X(x), Y(interpolate(xs, ys, x))); } c.lineTo(X(xs.at(-1)), Y(0)); c.closePath(); c.fill(); i += count; } c.restore();
    c.fillStyle = '#a65b38'; s.samples.forEach(x => point(x, f(x)));
  }
  if (l.kind === 'ode') {
    c.save(); c.globalAlpha = .3; c.strokeStyle = '#526777';
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 7; j++) { const t = a + (b - a) * i / 12, y = low + (high - low) * j / 7, angle = Math.atan2(-l.f(t, y) * (H - 65) / (high - low), (W - 65) / (b - a)); c.beginPath(); c.moveTo(X(t) - Math.cos(angle) * 6, Y(y) - Math.sin(angle) * 6); c.lineTo(X(t) + Math.cos(angle) * 6, Y(y) + Math.sin(angle) * 6); c.stroke(); } c.restore();
    c.strokeStyle = '#d67d2a'; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y))); c.stroke();
    if (s.slopes.length === 4 && points.length > 1) { const p = points.at(-2), h = points.at(-1).x - p.x, ks = s.slopes, probes = [[p.x, p.y], [p.x + h / 2, p.y + h * ks[0] / 2], [p.x + h / 2, p.y + h * ks[1] / 2], [p.x + h, p.y + h * ks[2]]]; probes.forEach(([x, y], i) => { c.fillStyle = ['#8554b7', '#df8a26', '#168b87', '#be5174'][i]; point(x, y); c.fillText(`k${i + 1} ×${i === 1 || i === 2 ? 2 : 1}`, X(x) + 8, Y(y) - 8 - 12 * (i % 2)); }); }
  }
  if (l.kind === 'fit') { c.strokeStyle = '#d4a454'; points.forEach(p => { c.beginPath(); c.moveTo(X(p.x), Y(p.y)); c.lineTo(X(p.x), Y(session.curveAt(p.x))); c.stroke(); }); }
  c.fillStyle = '#d67d2a'; points.filter(p => Number.isFinite(p.y)).forEach(p => point(p.x, p.y));
  handles.forEach(p => { p.px = X(p.x); p.py = Y(p.y); c.fillStyle = '#9a65c8'; c.beginPath(); c.arc(p.px, p.py, 10, 0, 2 * Math.PI); c.fill(); c.fillStyle = '#583b75'; c.fillText(p.label, p.px + 12, p.py - 12); });
  return { handles, fromPixel: (px, py) => ({ x: a + (px - 45) * (b - a) / (W - 65), y: low + (H - 35 - py) * (high - low) / (H - 65) }) };
}
