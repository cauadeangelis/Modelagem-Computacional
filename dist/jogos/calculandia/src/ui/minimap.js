// Minimapa circular 140×140 em Canvas 2D (seção 12) + imagem-base da ilha compartilhada com o mapa.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { REGIONS, NIVEIS, DUVIDAS } from '../data/settlements.js';
import { terrainHeight, groundColor, regionAt, WATER_Y } from '../world/terrain.js';
import { roadCurves } from '../world/roads.js';

const HALF = CONFIG.world.half;
export const MAP_RES = 256;
let base = null, regionIdx = null, fogCanvas = null;

// Pinta a ilha uma vez (cores do terreno com tom de pergaminho)
export function baseMap() {
  if (base) return base;
  const N = MAP_RES;
  base = document.createElement('canvas'); base.width = base.height = N;
  const g = base.getContext('2d');
  const img = g.createImageData(N, N);
  regionIdx = new Uint8Array(N * N);
  const c = new THREE.Color();
  const sea = new THREE.Color('#7fc4dd'), parch = new THREE.Color('#efe0b8');
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = -HALF + ((i + 0.5) / N) * HALF * 2, z = -HALF + ((j + 0.5) / N) * HALF * 2;
      const h = terrainHeight(x, z);
      if (h < WATER_Y) c.copy(sea).lerp(new THREE.Color('#4f9fc4'), Math.min(1, -h / 4));
      else { groundColor(x, z, h, c); c.lerp(parch, 0.25); }
      if (h >= WATER_Y) c.multiplyScalar(0.85 + Math.min(0.3, h * 0.05));
      c.convertLinearToSRGB();
      const k = (j * N + i) * 4;
      img.data[k] = c.r * 255; img.data[k + 1] = c.g * 255; img.data[k + 2] = c.b * 255; img.data[k + 3] = 255;
      regionIdx[j * N + i] = h >= WATER_Y - 0.5 ? regionAt(x, z) : 255;
    }
  }
  g.putImageData(img, 0, 0);
  // estradas
  g.strokeStyle = 'rgba(255,248,220,.9)'; g.lineWidth = 2; g.lineCap = 'round';
  for (const cv of roadCurves) {
    g.beginPath();
    cv.getSpacedPoints(80).forEach((p, i) => { const X = ((p.x + HALF) / (2 * HALF)) * N, Y = ((p.z + HALF) / (2 * HALF)) * N; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
    g.stroke();
  }
  return base;
}

// Névoa sobre as regiões trancadas
export function fogMap() {
  baseMap();
  const N = MAP_RES;
  if (!fogCanvas) { fogCanvas = document.createElement('canvas'); fogCanvas.width = fogCanvas.height = N; }
  const g = fogCanvas.getContext('2d');
  const img = g.createImageData(N, N);
  const locked = REGIONS.map((_, r) => !G.progress.regionUnlocked(r));
  for (let k = 0; k < N * N; k++) {
    const r = regionIdx[k];
    if (r !== 255 && locked[r]) {
      const n = ((k * 7919) % 97) / 97;
      img.data[k * 4] = 110 + n * 20; img.data[k * 4 + 1] = 95 + n * 15; img.data[k * 4 + 2] = 138 + n * 20; img.data[k * 4 + 3] = 200;
    }
  }
  g.putImageData(img, 0, 0);
  return fogCanvas;
}

export class Minimap {
  constructor() {
    this.cv = document.getElementById('minimap');
    this.g = this.cv.getContext('2d');
    this.t = 0;
    this.viewR = 60;
    baseMap();
    this.refresh();
  }
  refresh() { this.fog = fogMap(); }

  draw(t) {
    const g = this.g, W = this.cv.width, R = W / 2;
    const hero = G.hero.pos;
    const s = R / this.viewR; // px por unidade
    const k = MAP_RES / (2 * HALF);
    const fw = G.camRig.forward();
    const rot = -Math.PI / 2 - Math.atan2(fw.z, fw.x);
    g.save();
    g.clearRect(0, 0, W, W);
    g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#7fc4dd'; g.fillRect(0, 0, W, W);
    g.translate(R, R);
    g.rotate(rot);
    g.scale(s / k, s / k);
    g.translate(-(hero.x + HALF) * k, -(hero.z + HALF) * k);
    g.imageSmoothingEnabled = true;
    g.drawImage(base, 0, 0);
    g.drawImage(this.fog, 0, 0);
    g.restore();
    // ícones (em coordenadas de tela)
    const toScreen = (x, z) => {
      const dx = (x - hero.x) * s, dz = (z - hero.z) * s;
      const c = Math.cos(rot), sn = Math.sin(rot);
      return [R + dx * c - dz * sn, R + dx * sn + dz * c];
    };
    g.save();
    g.beginPath(); g.arc(R, R, R - 1, 0, Math.PI * 2); g.clip();
    for (const S of G.settlements) {
      const [X, Y] = toScreen(S.def.x, S.def.z);
      if (Math.hypot(X - R, Y - R) > R + 10) continue;
      const boss = S.def.tipo === 'arena' || S.def.tipo === 'final';
      if (boss) {
        g.font = '15px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#3a2a1a'; g.fillText(G.progress.won(S.def.id) ? '✓' : '☠', X, Y);
        continue;
      }
      g.fillStyle = REGIONS[S.def.regiao].pal.destaque;
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
      g.beginPath(); g.arc(X, Y, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      if (S.complete) { g.fillStyle = '#fff'; g.font = 'bold 10px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✓', X, Y + 0.5); }
      // prédios: mesma cor e forma das placas (cheio = vencido)
      for (const [lvl, B] of Object.entries(S.buildings)) {
        if (!B.door) continue;
        const [bx, by] = toScreen(B.x, B.z);
        formaNivel(g, lvl, bx, by, 4.5, lvl !== 'Q' && G.progress.won(`${S.def.id}-${lvl}`));
      }
    }
    // Raízes Fugitivas próximas (< 15): pontos verdes piscando
    if (Math.floor(t * 3) % 2 === 0) {
      for (const r of G.roots) {
        if (r.caught) continue;
        const p = r.state === 'flee' ? r.pos : r.home;
        if (Math.hypot(p.x - hero.x, p.z - hero.z) > 15) continue;
        const [X, Y] = toScreen(p.x, p.z);
        g.fillStyle = '#3fdc4a'; g.beginPath(); g.arc(X, Y, 3.5, 0, Math.PI * 2); g.fill();
      }
    }
    // objetivo: estrela se visível, senão seta na borda
    const obj = G.objective;
    if (obj && obj.x != null) {
      const [X, Y] = toScreen(obj.x, obj.z);
      const d = Math.hypot(X - R, Y - R);
      g.fillStyle = '#f2c14e'; g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
      if (d < R - 10) { g.font = '16px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('★', X, Y); g.fillText('★', X, Y); }
      else {
        const a = Math.atan2(Y - R, X - R);
        g.save(); g.translate(R + Math.cos(a) * (R - 12), R + Math.sin(a) * (R - 12)); g.rotate(a);
        g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    }
    g.restore();
    // herói: triângulo azul apontado para onde olha
    const ha = Math.atan2(Math.cos(G.hero.yaw), Math.sin(G.hero.yaw)) + rot;
    g.save(); g.translate(R, R); g.rotate(ha);
    g.fillStyle = '#2f6fdd'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -6); g.lineTo(-3, 0); g.lineTo(-6, 6); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}

// ● fácil (verde) · ■ médio (azul) · ▲ difícil (vermelho) · ? Casa de Dúvidas (amarelo)
export function formaNivel(g, lvl, x, y, r, won) {
  const cor = lvl === 'Q' ? DUVIDAS.parede : NIVEIS[lvl]?.cor;
  if (!cor) return;
  g.save();
  g.lineWidth = 2; g.strokeStyle = lvl === 'Q' ? '#7a5a00' : cor; g.fillStyle = won || lvl === 'Q' ? cor : '#ffffff';
  g.beginPath();
  if (lvl === 'F') g.arc(x, y, r, 0, Math.PI * 2);
  else if (lvl === 'M') g.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
  else if (lvl === 'D') { g.moveTo(x, y - r * 1.1); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); g.closePath(); }
  else g.arc(x, y, r, 0, Math.PI * 2);
  g.fill(); g.stroke();
  if (lvl === 'Q') { g.fillStyle = '#3a2a1a'; g.font = `bold ${Math.round(r * 1.8)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 0.5); }
  g.restore();
}
