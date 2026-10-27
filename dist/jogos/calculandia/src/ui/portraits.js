// Retratos 2D desenhados em canvas (diálogos e cabeça do bicho nas fases).
import { ANIMALS } from '../data/animals.js';

function eye(g, x, y, r, look = 0, blink = false) {
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, r, blink ? r * 0.15 : r, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.stroke();
  if (blink) return;
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x + look * r * 0.3, y + r * 0.1, r * 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x + look * r * 0.3 + r * 0.18, y - r * 0.15, r * 0.16, 0, Math.PI * 2); g.fill();
}

import { CONFIG } from '../config.js';

// cabeça de gato (Lina e Nina) centrada em (x, 0)
function catHead(g, x, c, t, mouth, blink, look) {
  g.save(); g.translate(x, 0);
  g.lineWidth = 3; g.strokeStyle = '#3a2a1a';
  for (const sx of [-1, 1]) {
    g.fillStyle = c.pelo; g.beginPath(); g.moveTo(sx * 10, -20); g.lineTo(sx * 26, -40); g.lineTo(sx * 28, -10); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f2a5b5'; g.beginPath(); g.moveTo(sx * 15, -20); g.lineTo(sx * 24, -33); g.lineTo(sx * 24, -16); g.closePath(); g.fill();
  }
  g.fillStyle = c.pelo; g.beginPath(); g.ellipse(0, 0, 28, 25, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = c.listra; g.lineWidth = 3;
  for (const dx of [-7, 0, 7]) { g.beginPath(); g.moveTo(dx, -24); g.lineTo(dx * 0.8, -14); g.stroke(); }
  g.fillStyle = c.barriga; g.beginPath(); g.ellipse(0, 11, 13, 9, 0, 0, Math.PI * 2); g.fill();
  for (const sx of [-1, 1]) {
    g.fillStyle = c.olhos; g.beginPath(); g.ellipse(sx * 11, -3, 6.5, blink ? 1 : 7, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.stroke();
    if (!blink) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(sx * 11 + look * 2, -3, 2, 6, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = '#e88a9a'; g.beginPath(); g.moveTo(-4, 5); g.lineTo(4, 5); g.lineTo(0, 9); g.closePath(); g.fill();
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 9); g.quadraticCurveTo(-4, 14 + mouth * 3, -8, 11); g.moveTo(0, 9); g.quadraticCurveTo(4, 14 + mouth * 3, 8, 11); g.stroke();
  for (const sx of [-1, 1]) for (const k of [-1, 1]) { g.beginPath(); g.moveTo(sx * 12, 10 + k * 2); g.lineTo(sx * 34, 7 + k * 5 + Math.sin(t * 2) * 0.8); g.stroke(); }
  g.restore();
}

// kind: 'raizinha' | 'gatas' | 'animal' | 'npc' | 'vilao' | 'placa' | 'heroi'
export function drawPortrait(canvas, kind, id, t = 0, mouth = 0) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = kind === 'vilao' ? '#2d2440' : '#f7e7c6';
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2, H / 2 + 6 + Math.sin(t * 3) * 2);
  g.scale(W / 112, H / 112);
  const blink = t % 3.3 < 0.12;
  const look = Math.sin(t * 0.7) * 0.6;
  g.lineWidth = 3; g.strokeStyle = '#3a2a1a';
  if (kind === 'raizinha') {
    g.fillStyle = '#5fbf5a';
    for (const a of [-0.5, 0, 0.5]) { g.save(); g.rotate(a + Math.sin(t * 4 + a) * 0.1); g.beginPath(); g.ellipse(0, -48, 8, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
    g.fillStyle = '#c58a54';
    g.beginPath(); g.moveTo(-32, -28); g.quadraticCurveTo(0, -42, 32, -28); g.lineTo(4, 48); g.lineTo(-4, 48); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#a06a38'; g.lineWidth = 4;
    for (const y of [-6, 12, 28]) { const w = 30 - (y + 28) * 0.4; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
    eye(g, -12, -16, 11, look, blink); eye(g, 12, -16, 11, look, blink);
    g.fillStyle = '#7a3a2a'; g.beginPath(); g.ellipse(0, 2, 6, 2 + mouth * 4, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === 'gatas') {
    const [lina, nina] = CONFIG.gatas;
    catHead(g, -26, lina.cores, t, mouth, blink, look);
    catHead(g, 26, nina.cores, t + 1, mouth, t % 3.7 < 0.12, -look);
  } else if (kind === 'animal') {
    const d = ANIMALS[id] || ANIMALS.urso;
    const c = d.cores;
    const body = c.corpo;
    const lighter = c.barriga || c.focinho || '#ffffff';
    // orelhas / acessórios por tipo de corpo
    g.fillStyle = body;
    if (['quadrupede', 'esquilo', 'lebre', 'tatu'].includes(d.corpo)) {
      const long = d.corpo === 'lebre';
      for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 26, long ? -52 : -34, long ? 9 : 12, long ? 26 : 12, sx * 0.2, 0, Math.PI * 2); g.fill(); g.stroke(); }
    }
    if (d.corpo === 'polvo') for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(-35 + i * 14, 40, 6, 16 + Math.sin(t * 3 + i) * 3, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(0, 0, 40, d.corpo === 'polvo' ? 40 : 36, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (d.corpo === 'axolote') { g.fillStyle = c.guelras; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(sx * 44, -12 + k * 12, 10, 4, sx * (0.4 - k * 0.4), 0, Math.PI * 2); g.fill(); } }
    if (d.corpo === 'ave') { g.fillStyle = c.crista; g.beginPath(); g.arc(0, -38, 8, 0, Math.PI * 2); g.arc(-9, -34, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = lighter; g.beginPath(); g.ellipse(0, 14, 20, 14, 0, 0, Math.PI * 2); g.fill();
    eye(g, -15, -8, 11, look, blink); eye(g, 15, -8, 11, look, blink);
    if (d.corpo === 'ave') { g.fillStyle = c.bico; g.beginPath(); g.moveTo(-8, 8); g.lineTo(8, 8); g.lineTo(0, 20 + mouth * 4); g.closePath(); g.fill(); g.stroke(); }
    else { g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(0, 9, 5, 3.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(0, 19, 6, 1.5 + mouth * 4, 0, 0, Math.PI * 2); g.fill(); }
    if (d.extras?.includes('chapeuPadeiro')) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, -44, 26, 14, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (d.extras?.includes('pintas')) { g.fillStyle = c.pintas; for (const [x, y] of [[-24, -24], [22, -26], [0, -30]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); } }
  } else if (kind === 'vilao') {
    g.fillStyle = '#4a4f57'; g.beginPath(); g.roundRect(-40, -36, 80, 72, 14); g.fill(); g.strokeStyle = '#b7ff3c'; g.stroke();
    g.fillStyle = '#b7ff3c';
    g.fillRect(-26, -14, 18, 10 + Math.sin(t * 9) * 3); g.fillRect(8, -14, 18, 10 + Math.cos(t * 9) * 3);
    g.fillRect(-22, 14, 44, 5 + mouth * 6);
    g.strokeStyle = '#b7ff3c'; g.beginPath(); g.moveTo(0, -36); g.lineTo(0, -50); g.stroke(); g.beginPath(); g.arc(0, -52, 4, 0, Math.PI * 2); g.stroke();
  } else if (kind === 'placa') {
    g.fillStyle = '#6b4423'; g.fillRect(-5, 0, 10, 50);
    g.fillStyle = '#b5835a'; g.fillRect(-44, -30, 88, 44); g.strokeRect(-44, -30, 88, 44);
    g.fillStyle = '#3a2a1a'; g.font = '700 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('!?', 0, 2);
  } else {
    // herói / npc
    const skin = id?.pele || '#f2c9a0', hat = id?.capacete || '#f5a623';
    if (id?.genero === 'f') {
      g.fillStyle = '#6b3a1e';
      g.beginPath(); g.ellipse(0, 14, 44, 38, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(40, -4, 10, 20, 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    g.fillStyle = id?.macacao || '#2f6fdd'; g.beginPath(); g.ellipse(0, 52, 36, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(0, 2, 36, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = hat; g.beginPath(); g.arc(0, -8, 38, Math.PI, 0); g.fill(); g.stroke(); g.fillRect(-42, -10, 84, 6);
    eye(g, -13, 6, 7, look, blink); eye(g, 13, 6, 7, look, blink);
    g.fillStyle = '#f4a3a3'; g.beginPath(); g.arc(-24, 18, 5, 0, Math.PI * 2); g.arc(24, 18, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a3a2a'; g.beginPath(); g.ellipse(0, 22, 6, 1.5 + mouth * 3, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
