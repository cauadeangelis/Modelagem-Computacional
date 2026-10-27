// Interações (tecla E / botão contextual) e zonas de gatilho circulares (seção 6.4).
import { G } from '../game.js';

export class Interaction {
  constructor() {
    this.items = [];
    this.current = null;
  }
  add(item) {
    const it = { prio: 1, enabled: null, ...item };
    this.items.push(it);
    return it;
  }
  remove(it) { const i = this.items.indexOf(it); if (i >= 0) this.items.splice(i, 1); }

  update(p) {
    let best = null, bs = -Infinity;
    for (const it of this.items) {
      const dx = p.x - it.x, dz = p.z - it.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > it.r * it.r) continue;
      if (it.enabled && !it.enabled()) continue;
      const score = it.prio * 100 - Math.sqrt(d2);
      if (score > bs) { bs = score; best = it; }
    }
    // pet: conversa quando não há nada por perto
    if (!best && G.petTalk) best = G.petTalk;
    this.current = best;
    return best;
  }
  trigger() {
    const it = this.current;
    if (!it) return false;
    G.audio?.sfx('ping');
    it.action();
    G.events.emit('interacted', it);
    return true;
  }
}

export class Triggers {
  constructor() { this.zones = []; }
  add(z) { const zone = { inside: false, ...z }; this.zones.push(zone); return zone; }
  update(p) {
    for (const z of this.zones) {
      const dx = p.x - z.x, dz = p.z - z.z;
      const inside = dx * dx + dz * dz < z.r * z.r;
      if (inside && !z.inside) { z.inside = true; z.enter?.(); }
      else if (!inside && z.inside) { z.inside = false; z.exit?.(); }
      if (inside) z.stay?.();
    }
  }
}
