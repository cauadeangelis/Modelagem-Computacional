// Colisão no plano xz: herói = círculo; sólidos = círculos ou caixas alinhadas (seção 6.4).
const CELL = 8;

export class Collision {
  constructor() {
    this.grid = new Map();
    this.dynamic = [];
  }
  _key(i, j) { return i * 10007 + j; }
  _insert(c, minX, maxX, minZ, maxZ) {
    for (let i = Math.floor(minX / CELL); i <= Math.floor(maxX / CELL); i++) {
      for (let j = Math.floor(minZ / CELL); j <= Math.floor(maxZ / CELL); j++) {
        const k = this._key(i, j);
        let l = this.grid.get(k);
        if (!l) { l = []; this.grid.set(k, l); }
        l.push(c);
      }
    }
  }
  addCircle(x, z, r, opts = {}) {
    const c = { type: 'c', x, z, r, enabled: true, ...opts };
    this._insert(c, x - r, x + r, z - r, z + r);
    return c;
  }
  addBox(minX, maxX, minZ, maxZ, opts = {}) {
    const c = { type: 'b', minX, maxX, minZ, maxZ, enabled: true, ...opts };
    this._insert(c, minX, maxX, minZ, maxZ);
    return c;
  }
  // colisores que se movem (metades da prefeitura, portões)
  addDynamic(c) { c.enabled ??= true; this.dynamic.push(c); return c; }

  // Empurra o círculo (p.x, p.z, r) para fora da maior penetração; desliza pela tangente.
  resolve(p, r) {
    let hit = false;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      const ci = Math.floor(p.x / CELL), cj = Math.floor(p.z / CELL);
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const l = this.grid.get(this._key(ci + di, cj + dj));
        if (!l) continue;
        for (const c of l) if (c.enabled && this._push(p, r, c)) moved = hit = true;
      }
      for (const c of this.dynamic) if (c.enabled && this._push(p, r, c)) moved = hit = true;
      if (!moved) break;
    }
    return hit;
  }
  _push(p, r, c) {
    if (c.type === 'c') {
      const dx = p.x - c.x, dz = p.z - c.z;
      const min = c.r + r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) return false;
      const d = Math.sqrt(d2) || 0.0001;
      const k = (min - d) / d;
      p.x += dx * k; p.z += dz * k;
      return true;
    }
    const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
    const dx = p.x - cx, dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return false;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2), k = (r - d) / d;
      p.x += dx * k; p.z += dz * k;
    } else {
      // centro dentro da caixa: sai pelo lado mais próximo
      const l = p.x - c.minX, rr = c.maxX - p.x, t = p.z - c.minZ, b = c.maxZ - p.z;
      const m = Math.min(l, rr, t, b);
      if (m === l) p.x = c.minX - r; else if (m === rr) p.x = c.maxX + r; else if (m === t) p.z = c.minZ - r; else p.z = c.maxZ + r;
    }
    return true;
  }
  blocked(x, z, r) {
    const p = { x, z };
    return this.resolve(p, r);
  }
  // há algum colisor ativo sobrepondo o círculo? (skip ignora alguns, ex.: árvores)
  overlaps(x, z, r, skip = null) {
    const ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
    const hit = (c) => {
      if (!c.enabled || (skip && skip(c))) return false;
      if (c.type === 'c') return (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + r) ** 2;
      const cx = Math.max(c.minX, Math.min(x, c.maxX)), cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
    };
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const l = this.grid.get(this._key(ci + di, cj + dj));
      if (l) for (const c of l) if (hit(c)) return true;
    }
    return this.dynamic.some(hit);
  }
}
