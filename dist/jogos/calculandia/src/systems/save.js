// Salvamento em localStorage: posição, estrelas, sementes, Raizdex e fogueiras.
import { CONFIG } from '../config.js';

export function freshSave() {
  return {
    v: 1,
    hero: { x: 2, z: 95, yaw: Math.PI },
    seeds: CONFIG.seeds.start,
    phases: {},
    bosses: {},
    roots: {},
    fires: ['A0'],
    bells: [],
    trees: [],
    chests: [],
    apples: [],
    intro: {},
    tutorial: 0,
    cine: false,
    stickers: {},
    cosmetics: { on: [] },
    options: null,
    playTime: 0,
    rpg: { xp: 0, combo: 1, relics: [], diary: [], bestXp: {} },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.saveKey);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { ...freshSave(), ...d, rpg: { ...freshSave().rpg, ...d.rpg } };
  } catch (e) {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(CONFIG.saveKey); } catch (e) { /* sem armazenamento */ }
}
