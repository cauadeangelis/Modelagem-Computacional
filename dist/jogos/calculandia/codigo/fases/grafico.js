// Desenho dos gráficos das fases em Canvas 2D (curva, sondas, cordas, tangentes, áreas e "jogada fantasma").
import { fmt } from './numeros.js';

const GHOST = '#8e5bd1';

function lagr(xs, ys, x) { return xs.reduce((s, xi, i) => s + ys[i] * xs.reduce((p, xj, j) => (j === i ? p : (p * (x - xj)) / (xi - xj)), 1), 0); }

function niceStep(range) {
  const raw = range / 6;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

export function drawPlot(cv, vis, showGhost) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height, P = 46;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H);
  const { f, xmin, xmax } = vis;
  const gh = showGhost ? vis.ghost || {} : {};
  // faixa de y
  const ys = [];
  for (let i = 0; i <= 200; i++) { const x = xmin + ((xmax - xmin) * i) / 200; const y = f(x); if (Number.isFinite(y) && Math.abs(y) < 1e4) ys.push(y); }
  for (const p of [...(vis.pts || []), ...(gh.pts || [])]) ys.push(p.y);
  for (const s of [...(vis.segs || []), ...(gh.segs || [])]) ys.push(s.y1, s.y2);
  ys.push(0);
  let y0 = vis.ymin ?? Math.min(...ys), y1 = vis.ymax ?? Math.max(...ys);
  if (vis.ymin === undefined || vis.ymax === undefined) { const m = (y1 - y0) * 0.12 || 1; if (vis.ymin === undefined) y0 -= m; if (vis.ymax === undefined) y1 += m; }
  const X = (x) => P + ((x - xmin) / (xmax - xmin)) * (W - P * 1.4);
  const Y = (y) => H - P + -((y - y0) / (y1 - y0)) * (H - P * 1.5);
  const clipY = (y) => Math.max(-50, Math.min(H + 50, Y(y)));
  // grade
  g.lineWidth = 1; g.strokeStyle = '#efe3c8'; g.fillStyle = '#7a6a50'; g.font = '15px Fredoka, system-ui'; g.textAlign = 'center';
  const sx = niceStep(xmax - xmin);
  for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) { g.beginPath(); g.moveTo(X(x), P * 0.5); g.lineTo(X(x), H - P); g.stroke(); g.fillText(fmt(x, 3), X(x), H - P + 20); }
  const sy = niceStep(y1 - y0);
  g.textAlign = 'right';
  for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) { g.beginPath(); g.moveTo(P, Y(y)); g.lineTo(W - P * 0.4, Y(y)); g.stroke(); g.fillText(fmt(y, 3), P - 6, Y(y) + 5); }
  // eixos
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
  if (y0 <= 0 && y1 >= 0) { g.beginPath(); g.moveTo(P, Y(0)); g.lineTo(W - P * 0.4, Y(0)); g.stroke(); }
  if (xmin <= 0 && xmax >= 0) { g.beginPath(); g.moveTo(X(0), P * 0.5); g.lineTo(X(0), H - P); g.stroke(); }

  // faixa do novo intervalo (fantasma)
  if (gh.band) { g.fillStyle = 'rgba(142,91,209,.15)'; g.fillRect(X(gh.band[0]), P * 0.5, X(gh.band[1]) - X(gh.band[0]), H - P * 1.5); }

  // áreas (trapézios / parábolas)
  if (vis.area) {
    const { n, kind, a, b } = vis.area;
    const h = (b - a) / n;
    g.fillStyle = gh.areaHi ? 'rgba(142,91,209,.35)' : 'rgba(60,192,160,.28)';
    g.strokeStyle = gh.areaHi ? GHOST : '#2fa58a'; g.lineWidth = 1.5;
    const step = kind === 'trap' ? 1 : kind === 'simp' ? 2 : 3;
    for (let i = 0; i < n; i += step) {
      const xs = Array.from({ length: step + 1 }, (_, k) => a + (i + k) * h), fs = xs.map(f);
      g.beginPath(); g.moveTo(X(xs[0]), Y(0));
      for (let k = 0; k <= 24; k++) { const x = xs[0] + ((xs[step] - xs[0]) * k) / 24; g.lineTo(X(x), Y(step === 1 ? fs[0] + ((fs[1] - fs[0]) * (x - xs[0])) / h : lagr(xs, fs, x))); }
      g.lineTo(X(xs[step]), Y(0)); g.closePath(); g.fill(); g.stroke();
      for (const x of xs) { g.beginPath(); g.arc(X(x), Y(f(x)), 3.5, 0, Math.PI * 2); g.fillStyle = '#2fa58a'; g.fill(); }
      g.fillStyle = gh.areaHi ? 'rgba(142,91,209,.35)' : 'rgba(60,192,160,.28)';
    }
  }

  // curva principal
  const curve = (fn, color, width, dash) => {
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash ? [7, 6] : []);
    g.beginPath();
    let pen = false, prev = null;
    for (let i = 0; i <= 300; i++) {
      const x = xmin + ((xmax - xmin) * i) / 300, y = fn(x);
      if (!Number.isFinite(y) || (prev !== null && Math.abs(y - prev) > (y1 - y0) * 2)) { pen = false; prev = null; continue; }
      if (pen) g.lineTo(X(x), clipY(y)); else { g.moveTo(X(x), clipY(y)); pen = true; }
      prev = y;
    }
    g.stroke(); g.setLineDash([]);
  };
  for (const c of vis.curves || []) curve(c.f, c.color || '#9aa0a6', 2, c.dash);
  if (!vis.hideCurve) curve(f, '#2f6fdd', 3);
  if (vis.hideCurve && gh.curve) curve(f, GHOST, 3, true);

  const drawSegs = (list, color, dash) => {
    for (const s of list || []) {
      g.strokeStyle = s.color || color; g.lineWidth = 2.5; g.setLineDash(dash ? [7, 5] : []);
      g.beginPath(); g.moveTo(X(s.x1), clipY(s.y1)); g.lineTo(X(s.x2), clipY(s.y2)); g.stroke();
    }
    g.setLineDash([]);
  };
  drawSegs(vis.segs, '#e8554a', false);
  drawSegs(gh.segs, GHOST, true);
  if (gh.line) {
    const L = gh.line;
    const xa = L.x2 !== undefined ? L.x : xmin, xb = L.x2 !== undefined ? L.x2 : xmax;
    drawSegs([{ x1: xa, y1: L.y + L.m * (xa - L.x), x2: xb, y2: L.y + L.m * (xb - L.x) }], GHOST, true);
  }
  if (gh.resid && vis.pts) drawSegs(vis.pts.map((p) => ({ x1: p.x, y1: p.y, x2: p.x, y2: f(p.x) })), '#e8554a', true);
  if (vis.polyline && vis.pts?.length > 1) drawSegs(vis.pts.slice(1).map((p, i) => ({ x1: vis.pts[i].x, y1: vis.pts[i].y, x2: p.x, y2: p.y, color: '#e07a3f' })), '#e07a3f');

  const drawMarks = (list, color, dash) => {
    g.textAlign = 'center'; g.font = '700 16px Fredoka, system-ui';
    for (const m of list || []) {
      g.strokeStyle = m.color || color; g.fillStyle = m.color || color; g.lineWidth = 2; g.setLineDash(dash ? [6, 5] : [3, 4]);
      g.beginPath(); g.moveTo(X(m.x), P * 0.5); g.lineTo(X(m.x), H - P); g.stroke();
      g.setLineDash([]);
      g.fillText(m.label, X(m.x), P * 0.5 - 4 + 14);
    }
  };
  drawMarks(vis.marks, '#3a2a1a');
  drawMarks(gh.marks, GHOST, true);

  const drawPts = (list, color, ghost) => {
    g.font = '700 15px Fredoka, system-ui'; g.textAlign = 'left';
    for (const p of list || []) {
      g.beginPath(); g.arc(X(p.x), clipY(p.y), ghost ? 7 : 6, 0, Math.PI * 2);
      g.fillStyle = ghost ? 'rgba(142,91,209,.25)' : color; g.fill();
      g.strokeStyle = ghost ? GHOST : '#3a2a1a'; g.lineWidth = 2; if (ghost) g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]);
      if (p.label) { g.fillStyle = ghost ? GHOST : '#3a2a1a'; g.fillText(p.label, X(p.x) + 9, clipY(p.y) - 9); }
    }
  };
  drawPts(vis.pts, '#f2c14e');
  drawPts(gh.pts, GHOST, true);
}

export function drawDigits(cv, vis, showGhost) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H);
  const { n, k, modo } = vis;
  const chars = [String(n.int), ',', ...n.d.map(String)];
  const size = 64;
  g.font = `700 ${size}px Fredoka, system-ui`;
  const cw = size * 0.62;
  const x0 = W / 2 - (chars.length * cw) / 2;
  chars.forEach((c, i) => {
    const di = i - 2; // índice da casa decimal
    let col = '#3a2a1a';
    if (di >= k) col = '#c9bfae';
    if (di === k) col = showGhost ? '#8e5bd1' : '#e07a3f';
    g.fillStyle = col;
    g.fillText(c, x0 + i * cw, H / 2 + 20);
  });
  g.font = '18px Fredoka, system-ui';
  g.fillStyle = '#7a6a50';
  g.textAlign = 'center';
  g.fillText(`${k} casas decimais · próximo dígito em laranja`, W / 2, H - 40);
  if (showGhost) { g.fillStyle = '#8e5bd1'; g.fillText(modo === 'truncar' ? 'truncar: ignore os cinzas' : `arredondar: ${n.d[k]} ≥ 5 → sobe 1`, W / 2, 50); }
  g.textAlign = 'left';
}
