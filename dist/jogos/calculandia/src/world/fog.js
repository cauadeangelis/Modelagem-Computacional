// Névoa do Erro (seção 4): parede de cubos translúcidos sobre os portões das regiões trancadas.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { bridgeData, BRIDGE_W } from './bridges.js';
import { mulberry32 } from '../utils/math.js';

export class FogGates {
  constructor(scene, collision) {
    const F = CONFIG.fog;
    this.gates = [];
    const geo = new THREE.BoxGeometry(F.cube, F.cube, F.cube);
    const material = new THREE.MeshLambertMaterial({ color: F.color, transparent: true, opacity: F.opacity, depthWrite: false, flatShading: true });
    const rnd = mulberry32(77);
    for (const b of bridgeData) {
      if (!b.trava) continue;
      const mesh = new THREE.InstancedMesh(geo, material, F.count);
      mesh.frustumCulled = false;
      mesh.renderOrder = 4;
      const cubes = [];
      for (let i = 0; i < F.count; i++) {
        const u = (rnd() - 0.5) * 4.5, v = (rnd() - 0.5) * (BRIDGE_W + 7), h = rnd() * 5.5;
        cubes.push({ u, v, h, ph: rnd() * 6.28, s: 0.6 + rnd() * 0.7, d: Math.hypot(u, v) });
      }
      scene.add(mesh);
      const cols = [];
      for (let v = -BRIDGE_W / 2; v <= BRIDGE_W / 2; v += 0.55) {
        const x = b.x - b.uz * v, z = b.z + b.ux * v;
        cols.push(collision.addDynamic({ type: 'c', x, z, r: 0.6 }));
      }
      const gate = { b, mesh, cubes, cols, locked: true, dissolve: -1, region: b.trava };
      this.gates.push(gate);
      G.interaction.add({
        x: b.x, z: b.z, r: 6, label: 'Névoa do Erro', prio: 0,
        enabled: () => gate.locked,
        action: () => G.events.emit('fogTouch', gate),
      });
      G.triggers.add({ x: b.x, z: b.z, r: 7, enter: () => { if (gate.locked) G.events.emit('fogTouch', gate); } });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }

  setLocked(region, locked, animate = false) {
    for (const g of this.gates) {
      if (g.region !== region) continue;
      if (!locked && g.locked) {
        g.locked = false;
        if (animate) { g.dissolve = 0; G.audio?.sfx('nevoa'); G.ui?.caption('🌫️ A Névoa do Erro se dissolve'); }
        else { g.dissolve = 99; g.mesh.visible = false; }
        for (const c of g.cols) c.enabled = false;
      } else if (locked) {
        g.locked = true; g.dissolve = -1; g.mesh.visible = true;
        for (const c of g.cols) c.enabled = true;
      }
    }
  }

  update(t, dt) {
    const F = CONFIG.fog;
    const hero = G.hero.pos;
    for (const g of this.gates) {
      if (!g.mesh.visible) continue;
      if (Math.hypot(hero.x - g.b.x, hero.z - g.b.z) > 70) continue;
      if (g.dissolve >= 0) {
        g.dissolve += dt;
        if (g.dissolve > F.dissolveTime + 0.5) { g.mesh.visible = false; continue; }
      }
      const b = g.b;
      g.cubes.forEach((c, i) => {
        let s = c.s * (1 + Math.sin(t * 1.3 + c.ph) * 0.12);
        if (g.dissolve >= 0) {
          // onda radial a partir do portão
          const front = (g.dissolve / F.dissolveTime) * 9;
          s *= Math.max(0, Math.min(1, (c.d - front) / 1.5 + 1)) * (c.d < front ? 0 : 1);
        }
        const u = c.u + Math.sin(t * 0.4 + c.ph) * 0.4, v = c.v + Math.cos(t * 0.3 + c.ph) * 0.4;
        this._p.set(b.x + b.ux * u - b.uz * v, b.ha + 0.3 + c.h + Math.sin(t * 0.7 + c.ph) * 0.3, b.z + b.uz * u + b.ux * v);
        this._q.setFromEuler(this._e.set(t * 0.2 + c.ph, t * 0.15 + c.ph, 0));
        this._m.compose(this._p, this._q, this._s.set(s, s, s));
        g.mesh.setMatrixAt(i, this._m);
      });
      g.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
