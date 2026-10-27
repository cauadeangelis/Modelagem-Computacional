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
    player: null, // { nome, genero: 'm' | 'f' }: null até a tela de criação
    pet: 'raizinha', // 'raizinha' | 'gatas'
    historicos: {}, // mestres: { met, recompensa } por id
    ajuda: {}, // nível de dica já pago por fase (não cobra de novo)
    comandos: [], // passos do tutorial de comandos já feitos ('todas' = terminado ou pulado)
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
    // saves de antes do tutorial de comandos: quem já terminou o tutorial guiado não o refaz
    const comandos = Array.isArray(d.comandos) ? d.comandos : d.tutorial >= 6 ? ['todas'] : [];
    return { ...freshSave(), ...d, comandos, historicos: d.historicos || {}, ajuda: d.ajuda || {}, rpg: { ...freshSave().rpg, ...d.rpg } };
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
