// Superfície caminhável: terreno + pontes + riachos + pedras + plataformas + poças de lama.
import { terrainHeight, inCreek, regionAt, WATER_Y } from './terrain.js';
import { bridgeAt } from './bridges.js';
import { CONFIG } from '../config.js';

export const mudPuddles = []; // {x, z, r}
// riachos extras desenhados por cima do terreno (cipó, pedras do rio): retângulos orientados
export const streams = []; // {x, z, ux, uz, hl, hw, y}
// pedras e plataformas: ilhas caminháveis com altura própria
export const stones = []; // {x, z, r, y}
export const platforms = []; // {x, z, r, y} — só vale como chão para quem está acima dela

function inStream(x, z) {
  for (const s of streams) {
    const dx = x - s.x, dz = z - s.z;
    const u = dx * s.ux + dz * s.uz, v = -dx * s.uz + dz * s.ux;
    if (Math.abs(u) < s.hl && Math.abs(v) < s.hw) return true;
  }
  return false;
}
export function nearStream(x, z, margin = 0) {
  for (const s of streams) {
    const dx = x - s.x, dz = z - s.z;
    const u = dx * s.ux + dz * s.uz, v = -dx * s.uz + dz * s.ux;
    if (Math.abs(u) < s.hl + margin && Math.abs(v) < s.hw + margin) return true;
  }
  return false;
}
function stoneAt(x, z) {
  for (const s of stones) if ((x - s.x) ** 2 + (z - s.z) ** 2 < s.r * s.r) return s;
  return null;
}

export function walkHeight(x, z, fromY = -Infinity) {
  const b = bridgeAt(x, z);
  if (b) return b.y;
  const st = stoneAt(x, z);
  if (st) return st.y;
  let h = Math.max(terrainHeight(x, z), WATER_Y - 0.05);
  for (const p of platforms) {
    if (fromY >= p.y - 0.5 && (x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r) h = Math.max(h, p.y);
  }
  return h;
}

export function isWalkable(x, z) {
  if (bridgeAt(x, z) || stoneAt(x, z)) return true;
  if (inCreek(x, z) || inStream(x, z)) return false;
  return terrainHeight(x, z) >= CONFIG.hero.unwalkable;
}

export function isWaterAt(x, z) {
  if (bridgeAt(x, z) || stoneAt(x, z)) return false;
  return inCreek(x, z) || inStream(x, z) || terrainHeight(x, z) < CONFIG.hero.unwalkable;
}

export function inMud(x, z) {
  for (const p of mudPuddles) if ((x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r) return true;
  return false;
}

// Tipo de piso para o som dos passos (seção 13.2)
export function surfaceAt(x, z, onPlaza) {
  if (bridgeAt(x, z)) return 'madeira';
  if (onPlaza || stoneAt(x, z)) return 'pedra';
  const r = regionAt(x, z);
  if (r === 6 || r === 3) return 'pedra';
  const h = terrainHeight(x, z);
  if (r === 0 || r === 5 || h < 0.4) return 'areia';
  return 'grama';
}
