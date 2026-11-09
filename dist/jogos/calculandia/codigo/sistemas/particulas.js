// Partículas: pool de 600 cubinhos instanciados (seção 13.3).
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';

const PRESETS = {
  poeira: { n: 3, life: 0.5, size: 0.16, colors: ['#d9c49a'], vy: [0.4, 1.0], vh: 0.6, g: 0, grow: 0.5 },
  confete: { n: 60, life: 1.6, size: 0.12, colors: ['#e8554a', '#f2c14e', '#3cc0a0', '#7ab8f5', '#f28ab2', '#8e5bd1', '#ffffff'], vy: [4, 8], vh: 3.2, g: -9, spin: 10 },
  faiscas: { n: 12, life: 0.4, size: 0.08, colors: ['#ffd23a', '#ff8a2a'], vy: [-1, 3], vh: 4.5, g: -2, radial: true },
  folhas: { n: 8, life: 1.2, size: 0.14, colors: ['#5fae4a', '#7fbf4a', '#3f8f3a'], vy: [-0.6, 0.3], vh: 1.4, g: -1.2, sway: true, spin: 4 },
  fumaca: { n: 6, life: 1.5, size: 0.35, colors: ['#9a9da5', '#b9bcc4'], vy: [0.8, 1.4], vh: 0.4, g: 0, grow: 1.8 },
  fumacaVerde: { n: 4, life: 1.8, size: 0.4, colors: ['#b7ff3c', '#8fd62a', '#6b6f78'], vy: [1, 1.8], vh: 0.5, g: 0, grow: 2 },
  respingo: { n: 10, life: 0.6, size: 0.12, colors: ['#9fdcf2', '#ffffff'], vy: [2.5, 4], vh: 1.6, g: -9 },
  lama: { n: 8, life: 0.6, size: 0.12, colors: ['#6b4a2b', '#8b6a3e'], vy: [1.5, 3], vh: 1.4, g: -9 },
  estrelinhas: { n: 5, life: 1.0, size: 0.12, colors: ['#f2c14e', '#fff3b0'], vy: [0.5, 1.5], vh: 1.5, g: 0, spin: 6 },
  coracoes: { n: 3, life: 1.2, size: 0.16, colors: ['#e8454a', '#f28ab2'], vy: [1, 1.6], vh: 0.3, g: 0, sway: true },
  petalas: { n: 6, life: 1.0, size: 0.09, colors: ['#f4a3a3'], vy: [0.8, 1.6], vh: 1.0, g: -2.5, spin: 6 },
  migalhas: { n: 7, life: 0.7, size: 0.1, colors: ['#e0a85c', '#f7e3b0'], vy: [1, 2.5], vh: 1.6, g: -9 },
  farinha: { n: 10, life: 1.0, size: 0.18, colors: ['#ffffff', '#f4ead8'], vy: [0.3, 1], vh: 1.4, g: 0, grow: 1.4 },
  graos: { n: 4, life: 0.8, size: 0.07, colors: ['#e8c872', '#d9b34a'], vy: [-0.5, 0.5], vh: 0.8, g: -9 },
  dourado: { n: 18, life: 1.2, size: 0.1, colors: ['#f2c14e', '#fff3b0', '#ffffff'], vy: [2, 4], vh: 1.2, g: -3, spin: 6 },
  fogos: { n: 40, life: 1.3, size: 0.14, colors: ['#e8554a', '#f2c14e', '#3cc0a0', '#7ab8f5', '#f28ab2', '#b7ff3c'], vy: [-3, 3], vh: 5, g: -3, radial: true, sphere: true },
  vapor: { n: 5, life: 2.2, size: 0.45, colors: ['#ffffff', '#eef6fb', '#dfeef7'], vy: [1.2, 2.0], vh: 0.4, g: 0, grow: 2.4 },
  explosao: { n: 70, life: 1.6, size: 0.4, colors: ['#fff3b0', '#ffd23a', '#ff8a2a', '#e8554a', '#b7ff3c'], vy: [-6, 6], vh: 14, g: -4, radial: true, sphere: true, grow: 1.2 },
  raizes: { n: 50, life: 3.0, size: 0.35, colors: ['#7cc35f', '#b7ff3c', '#5fae4a'], vy: [6, 14], vh: 30, g: -9, spin: 4 },
};

export class Particles {
  constructor(scene) {
    const N = CONFIG.particles.pool;
    this.N = N;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ flatShading: true }), N);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.p = [];
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const c = new THREE.Color('#ffffff');
    for (let i = 0; i < N; i++) {
      this.p.push({ life: 0, max: 1, pos: new THREE.Vector3(), vel: new THREE.Vector3(), size: 0.1, g: 0, grow: 0, spin: 0, rot: new THREE.Euler(), sway: false, ph: 0 });
      this.mesh.setMatrixAt(i, zero);
      this.mesh.setColorAt(i, c);
    }
    this.next = 0;
    scene.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }

  emit(name, x, y, z, opts = {}) {
    const P = PRESETS[name];
    if (!P) return;
    let n = opts.count ?? P.n;
    if (G.options.reduzirMovimento) n = Math.ceil(n / 2);
    for (let k = 0; k < n; k++) {
      const p = this.p[this.next];
      const i = this.next;
      this.next = (this.next + 1) % this.N;
      p.life = p.max = P.life * (0.8 + Math.random() * 0.4);
      p.pos.set(x, y, z);
      if (P.sphere) {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(P.vh * (0.7 + Math.random() * 0.3));
        p.vel.copy(v);
      } else if (P.radial) {
        const a = Math.random() * Math.PI * 2;
        const sp = P.vh * (0.5 + Math.random() * 0.5);
        p.vel.set(Math.cos(a) * sp, P.vy[0] + Math.random() * (P.vy[1] - P.vy[0]), Math.sin(a) * sp);
      } else {
        p.vel.set((Math.random() - 0.5) * P.vh, P.vy[0] + Math.random() * (P.vy[1] - P.vy[0]), (Math.random() - 0.5) * P.vh);
      }
      if (opts.vel) p.vel.add(opts.vel);
      p.size = P.size * (opts.small ? 0.6 : 1) * (G.options.reduzirMovimento ? 0.7 : 1) * (0.75 + Math.random() * 0.5);
      p.g = P.g; p.grow = P.grow || 0; p.spin = P.spin || 0; p.sway = !!P.sway; p.ph = Math.random() * 6;
      p.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      const col = opts.color || P.colors[Math.floor(Math.random() * P.colors.length)];
      this.mesh.setColorAt(i, this._c.set(col));
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt) {
    const m = this._m, q = this._q, s = this._s;
    let any = false;
    for (let i = 0; i < this.N; i++) {
      const p = this.p[i];
      if (p.life <= 0) continue;
      any = true;
      p.life -= dt;
      if (p.life <= 0) { m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, m); continue; }
      p.vel.y += p.g * dt;
      if (p.sway) { p.vel.x += Math.sin(p.life * 8 + p.ph) * dt * 3; p.vel.multiplyScalar(1 - dt * 1.5); }
      p.pos.addScaledVector(p.vel, dt);
      p.rot.x += p.spin * dt; p.rot.y += p.spin * dt * 0.7;
      const k = p.life / p.max;
      let sc = p.size;
      if (p.grow) sc *= 1 + (1 - k) * p.grow;
      sc *= k < 0.3 ? k / 0.3 : 1;
      q.setFromEuler(p.rot);
      m.compose(p.pos, q, s.set(sc, sc, sc));
      this.mesh.setMatrixAt(i, m);
    }
    if (any || this._wasAny) this.mesh.instanceMatrix.needsUpdate = true;
    this._wasAny = any;
    // desenha só até a última partícula viva (o pool parado não custa triângulos)
    let last = -1;
    for (let i = this.N - 1; i >= 0; i--) if (this.p[i].life > 0) { last = i; break; }
    this.mesh.count = last + 1;
  }
}
