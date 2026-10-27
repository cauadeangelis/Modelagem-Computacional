// Estado compartilhado do jogo e barramento de eventos simples.

const handlers = {};
export const events = {
  on(name, fn) { (handlers[name] ||= []).push(fn); return () => this.off(name, fn); },
  off(name, fn) { const l = handlers[name]; if (l) l.splice(l.indexOf(fn) >>> 0, 1); },
  emit(name, ...args) { const l = handlers[name]; if (l) for (const fn of l.slice()) fn(...args); },
};

export const G = {
  scene: null, camera: null, renderer: null, camRig: null,
  time: 0, dt: 0,
  // 'loading' | 'title' | 'cine' | 'play' | 'fase'
  mode: 'loading',
  locks: 0,            // > 0 bloqueia o controle do herói (diálogo, menus, passeios)
  hero: null, pet: null, // pet: Raizinha ou Lina e Nina (mesma interface)
  settlements: [], animals: [], npcs: [], roots: [],
  input: null, audio: null, particles: null, collision: null, interaction: null,
  progress: null, ui: null, world: null, ambient: null,
  options: { volume: 0.7, music: 0.55, sombras: true, qualidade: 'alta', reduzirMovimento: false },
  debug: new URLSearchParams(location.search).has('debug'),
  events,
};

export function lock() { G.locks++; }
export function unlock() { G.locks = Math.max(0, G.locks - 1); }
export const isLocked = () => G.locks > 0 || G.mode !== 'play';

// Elemento da interface pelo id; se o index.html em cache for de uma versão anterior, cria o que faltar
export function uiEl(id, className = '', parentId = 'ui') {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    if (className) el.className = className;
    (document.getElementById(parentId) || document.body).appendChild(el);
  }
  return el;
}
