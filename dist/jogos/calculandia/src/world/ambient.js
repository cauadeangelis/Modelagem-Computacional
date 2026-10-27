// Vida da ilha (seção 7.1): pássaros, borboletas, peixes, nuvens, pegadas, flores e árvores chacoalháveis.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { terrainHeight, regionAt, shoreRadius, islandRadius, WATER_Y } from './terrain.js';
import { setInstance } from './props.js';
import { sph, box, cone, mat, mergeColored, M4, VC_MAT, G_SPH } from '../utils/geo.js';
import { mulberry32, clamp, lerp, damp } from '../utils/math.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export class Ambient {
  constructor(scene, props) {
    this.scene = scene;
    this.props = props;
    const rnd = mulberry32(99);
    this.rnd = rnd;

    // ---------- pássaros (instanciados: corpo + 2 asas) ----------
    this.flocks = [];
    const birdBody = mergeColored([
      { geo: new THREE.SphereGeometry(0.14, 6, 4), color: '#ffffff', matrix: M4(0, 0, 0, 0, 0, 0, 1, 0.9, 1.4) },
      { geo: new THREE.ConeGeometry(0.04, 0.1, 4), color: '#f2c14e', matrix: M4(0, 0.02, 0.22, Math.PI / 2) },
      { geo: new THREE.SphereGeometry(0.03, 4, 3), color: '#1a1a1a', matrix: M4(0.07, 0.06, 0.13) },
      { geo: new THREE.SphereGeometry(0.03, 4, 3), color: '#1a1a1a', matrix: M4(-0.07, 0.06, 0.13) },
    ]);
    const wingGeo = new THREE.BoxGeometry(0.32, 0.02, 0.16).translate(0.16, 0, 0);
    const perches = props.perches.slice(0, 40);
    const birdCount = perches.length * 6;
    this.birdBodies = new THREE.InstancedMesh(birdBody, VC_MAT, birdCount);
    this.birdWings = new THREE.InstancedMesh(wingGeo, new THREE.MeshLambertMaterial({ flatShading: true }), birdCount * 2);
    this.birdBodies.frustumCulled = this.birdWings.frustumCulled = false;
    const birdCols = ['#e8554a', '#5f8fd9', '#f2c14e', '#ffffff', '#8b5a2b', '#3cc0a0'];
    let bi = 0;
    for (const p of perches) {
      const n = 5 + Math.floor(rnd() * 4);
      const birds = [];
      const top = p.y + 3.2 * p.s;
      for (let k = 0; k < Math.min(n, 6); k++) {
        const col = new THREE.Color(birdCols[Math.floor(rnd() * birdCols.length)]);
        this.birdBodies.setColorAt(bi, col);
        this.birdWings.setColorAt(bi * 2, col); this.birdWings.setColorAt(bi * 2 + 1, col);
        const a = rnd() * Math.PI * 2;
        birds.push({ i: bi++, col, home: V(p.x + Math.cos(a) * 0.9, top + rnd() * 0.4, p.z + Math.sin(a) * 0.9), pos: V(), yaw: rnd() * 6, ph: rnd() * 6 });
      }
      this.flocks.push({ x: p.x, z: p.z, birds, state: 'perch', t: 0, away: 0, dir: rnd() * 6.28 });
    }
    this.birdBodies.count = bi; this.birdWings.count = bi * 2;
    scene.add(this.birdBodies, this.birdWings);

    // ---------- borboletas (6 por região) ----------
    this.butterflies = [];
    const wing = new THREE.PlaneGeometry(0.22, 0.18).translate(0.11, 0, 0);
    this.bfMesh = new THREE.InstancedMesh(wing, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), 6 * 6 * 2);
    this.bfMesh.frustumCulled = false;
    const bfCols = ['#f28ab2', '#f2c14e', '#7ab8f5', '#ffffff', '#e8554a', '#b38ef0'];
    let idx = 0;
    const centers = [[0, 82], [-62, 48], [-75, -30], [10, -88], [75, -35], [70, 50]];
    centers.forEach(([cx, cz], r) => {
      for (let k = 0; k < CONFIG.ambient.butterfliesPerRegion; k++) {
        const c = new THREE.Color(bfCols[(k + r) % bfCols.length]);
        this.bfMesh.setColorAt(idx * 2, c); this.bfMesh.setColorAt(idx * 2 + 1, c);
        this.butterflies.push({ i: idx++, cx: cx + (rnd() - 0.5) * 30, cz: cz + (rnd() - 0.5) * 30, ax: 3 + rnd() * 4, az: 3 + rnd() * 4, fx: 0.2 + rnd() * 0.3, fz: 0.3 + rnd() * 0.3, ph: rnd() * 6, follow: 0, pos: V() });
      }
    });
    scene.add(this.bfMesh);

    // ---------- peixe saltador ----------
    const fish = new THREE.Group();
    const fb = sph(0.22, '#f2a14e', 0, 0, 0, 8, 5); fb.scale.set(0.6, 0.8, 1.5); fish.add(fb);
    const ft = cone(0.18, 0.3, '#e07a3f', 0, 0, -0.4, 4); ft.rotation.x = -Math.PI / 2; ft.scale.x = 0.3; fish.add(ft);
    fish.visible = false;
    scene.add(fish);
    this.fish = { m: fish, t: -1, next: 4, stillT: 0 };

    // ---------- nuvens com sombra ----------
    this.clouds = [];
    // sombra elíptica de opacidade 0,15 no centro, com borda suave (degradê radial gerado em canvas)
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const sg = sc.getContext('2d'), grad = sg.createRadialGradient(32, 32, 4, 32, 32, 32);
    grad.addColorStop(0, 'rgba(20,30,50,0.15)'); grad.addColorStop(0.6, 'rgba(20,30,50,0.1)'); grad.addColorStop(1, 'rgba(20,30,50,0)');
    sg.fillStyle = grad; sg.fillRect(0, 0, 64, 64);
    const shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false });
    for (let i = 0; i < CONFIG.ambient.clouds; i++) {
      const g = new THREE.Group();
      const n = 4 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) { const s = sph(2 + rnd() * 2, '#ffffff', (k - n / 2) * 2.6, rnd() * 1.2, (rnd() - 0.5) * 2.5, 7, 5); s.scale.y = 0.6; g.add(s); }
      g.position.set(-150 + rnd() * 300, 38 + rnd() * 10, -120 + rnd() * 240);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shadowMat);
      sh.rotation.x = -Math.PI / 2; sh.scale.set(n * 1.6, n * 1.0, 1); sh.renderOrder = 2;
      scene.add(g, sh);
      this.clouds.push({ g, sh, speed: 1.2 + rnd() * 1.5 });
    }

    // ---------- pegadas ----------
    this.prints = [];
    const pg = new THREE.PlaneGeometry(0.2, 0.32);
    const pm = new THREE.MeshBasicMaterial({ color: '#5a4630', transparent: true, opacity: 0.35, depthWrite: false });
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(pg, pm.clone()); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2; scene.add(m);
      this.prints.push({ m, life: 0 });
    }
    this.printIdx = 0;

    // ---------- caranguejos fujões (R4) ----------
    this.crabs = [];
    for (let i = 0; i < 10; i++) {
      const th = 0.15 + rnd() * 1.1; // costa leste/sul
      const r = shoreRadius(th) - 2.5;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      if (regionAt(x, z) !== 5 || terrainHeight(x, z) < -0.1) continue;
      const c = new THREE.Group();
      const b = sph(0.22, '#e0453a', 0, 0.18, 0, 7, 5); b.scale.set(1.3, 0.55, 1); c.add(b);
      for (const sx of [-1, 1]) { c.add(sph(0.09, '#e0453a', sx * 0.3, 0.2, 0.15, 5, 4)); c.add(sph(0.035, '#1a1a1a', sx * 0.08, 0.32, 0.12, 4, 3)); }
      c.position.set(x, terrainHeight(x, z), z);
      scene.add(c);
      this.crabs.push({ m: c, home: V(x, 0, z), pos: V(x, 0, z) });
    }

    // ---------- árvores chacoalhando / flores amassadas ----------
    this.shaking = [];
    this.squashed = [];
  }

  scareBirds(x, z, radius = 25) {
    for (const f of this.flocks) if (f.state === 'perch' && Math.hypot(f.x - x, f.z - z) < radius) this.takeOff(f);
  }
  takeOff(f) {
    f.state = 'fly'; f.t = 0; f.dir = Math.atan2(f.z - G.hero.pos.z, f.x - G.hero.pos.x) + (Math.random() - 0.5);
    G.audio?.sfx('piu');
  }

  shakeTree(tree) {
    this.shaking.push({ tree, t: 0 });
    G.particles.emit('folhas', tree.x, tree.y + 2.5 * tree.s, tree.z);
    // um pássaro sai voando
    let best = null, bd = 30;
    for (const f of this.flocks) { const d = Math.hypot(f.x - tree.x, f.z - tree.z); if (d < bd && f.state === 'perch') { bd = d; best = f; } }
    if (best) this.takeOff(best);
  }

  // a onda sobe na praia e apaga as pegadas na areia (§7.2)
  washBeach() {
    for (const pr of this.prints) if (pr.m.visible && terrainHeight(pr.m.position.x, pr.m.position.z) < 0.7) pr.life = Math.min(pr.life, 0.3);
  }

  footprint(x, z, yaw, side) {
    const p = this.prints[this.printIdx++ % this.prints.length];
    const ox = Math.cos(yaw) * 0.14 * side, oz = -Math.sin(yaw) * 0.14 * side;
    p.m.position.set(x + ox, terrainHeight(x + ox, z + oz) + 0.04, z + oz);
    p.m.rotation.z = yaw;
    p.m.visible = true; p.life = CONFIG.ambient.footprintLife;
  }

  update(t, dt) {
    const hero = G.hero.pos;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s1 = V(1, 1, 1), p = V();

    // pássaros
    // só os bandos próximos ocupam instâncias (os demais não são desenhados)
    let slot = 0;
    for (const f of this.flocks) {
      const d = Math.hypot(f.x - hero.x, f.z - hero.z);
      if (d > 70 && f.state === 'perch') continue;
      if (f.state === 'perch' && d < CONFIG.ambient.birdTriggerDist) this.takeOff(f);
      if (f.state !== 'perch') {
        f.t += dt;
        if (f.state === 'fly' && f.t > CONFIG.ambient.birdsReturn) { f.state = 'back'; f.t = 0; }
        if (f.state === 'back' && f.t > 3) { f.state = 'perch'; }
      }
      for (const b of f.birds) {
        let flap = 0;
        if (f.state === 'perch') {
          b.pos.copy(b.home);
          b.pos.y += Math.abs(Math.sin(t * 3 + b.ph)) * 0.04;
          b.yaw += Math.sin(t * 0.7 + b.ph) * dt;
        } else if (f.state === 'fly') {
          // decola em arco (1 s) e circula ao longe
          const k = Math.min(1, f.t);
          const R = 6 + b.ph;
          const ang = f.dir + Math.sin(t * 0.6 + b.ph) * 0.4;
          const far = V(b.home.x + Math.cos(ang) * R * (1 + f.t * 0.3), b.home.y + 6 + Math.sin(t * 2 + b.ph) * 1.5, b.home.z + Math.sin(ang) * R * (1 + f.t * 0.3));
          b.pos.lerpVectors(b.home, far, k < 1 ? Math.sin((k * Math.PI) / 2) : 1);
          b.yaw = ang + Math.PI / 2;
          flap = 1;
        } else {
          const k = Math.min(1, f.t / 3);
          b.pos.lerp(b.home, k);
          flap = 1 - k;
        }
        m4.compose(b.pos, q.setFromEuler(e.set(0, b.yaw, 0)), s1);
        if (b.slot !== slot) { b.slot = slot; this.birdBodies.setColorAt(slot, b.col); this.birdWings.setColorAt(slot * 2, b.col); this.birdWings.setColorAt(slot * 2 + 1, b.col); this._colorsDirty = true; }
        this.birdBodies.setMatrixAt(slot, m4);
        const w = flap ? Math.sin(t * 22 + b.ph) * 0.9 : 0.1;
        for (const side of [0, 1]) {
          q.setFromEuler(e.set(0, b.yaw + (side ? Math.PI : 0), side ? -w : w));
          m4.compose(b.pos, q, s1);
          this.birdWings.setMatrixAt(slot * 2 + side, m4);
        }
        slot++;
      }
    }
    this.birdBodies.count = slot; this.birdWings.count = slot * 2;
    if (this._colorsDirty) { this.birdBodies.instanceColor.needsUpdate = true; this.birdWings.instanceColor.needsUpdate = true; this._colorsDirty = false; }
    this.birdBodies.instanceMatrix.needsUpdate = true;
    this.birdWings.instanceMatrix.needsUpdate = true;

    // borboletas (trajetória de Lissajous; seguem a Raizinha por 5 s)
    const rz = G.pet?.pos;
    for (const b of this.butterflies) {
      let x = b.cx + Math.sin(t * b.fx + b.ph) * b.ax, z = b.cz + Math.sin(t * b.fz * 1.5 + b.ph) * b.az;
      if (rz && Math.hypot(rz.x - x, rz.z - z) < 2.2 && b.follow <= 0) b.follow = 5;
      if (b.follow > 0 && rz) {
        b.follow -= dt;
        b.pos.lerp(V(rz.x + Math.sin(t * 3 + b.ph) * 0.6, rz.y + 1.3 + Math.sin(t * 5) * 0.2, rz.z + Math.cos(t * 3 + b.ph) * 0.6), damp(3, dt));
        if (b.follow <= 0) { b.cx = b.pos.x; b.cz = b.pos.z; }
      } else {
        b.pos.set(x, Math.max(terrainHeight(x, z), WATER_Y) + 1.2 + Math.sin(t * 2 + b.ph) * 0.4, z);
      }
      const flap = Math.sin(t * 18 + b.ph) * 1.1;
      for (const side of [0, 1]) {
        q.setFromEuler(e.set(0, t * 0.5 + b.ph + (side ? Math.PI : 0), side ? -flap : flap));
        m4.compose(b.pos, q, s1);
        this.bfMesh.setMatrixAt(b.i * 2 + side, m4);
      }
    }
    this.bfMesh.instanceMatrix.needsUpdate = true;

    // peixe saltador: a cada 8–15 s, ou herói parado na margem por 2 s
    const F = this.fish;
    const nearWater = this.nearWater(hero);
    if (nearWater && G.hero.speed < 0.1) F.stillT += dt; else F.stillT = 0;
    F.next -= dt;
    if (F.t < 0 && nearWater && (F.next <= 0 || F.stillT > 2)) {
      F.t = 0; F.stillT = -99; F.next = CONFIG.ambient.fishMin + Math.random() * (CONFIG.ambient.fishMax - CONFIG.ambient.fishMin);
      F.a = nearWater.clone(); F.b = nearWater.clone().add(V((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
      F.m.visible = true;
      G.particles.emit('respingo', F.a.x, WATER_Y, F.a.z);
      G.audio?.sfx('splash');
    }
    if (F.t >= 0) {
      F.t += dt;
      const k = F.t / 0.9;
      F.m.position.lerpVectors(F.a, F.b, k);
      F.m.position.y = WATER_Y + 4 * k * (1 - k) * 1.6;
      F.m.lookAt(F.b.x, F.m.position.y + (0.5 - k) * 3, F.b.z);
      if (k >= 1) { F.t = -1; F.m.visible = false; F.stillT = 0; G.particles.emit('respingo', F.b.x, WATER_Y, F.b.z); G.audio?.sfx('splash'); }
    }

    // nuvens
    for (const c of this.clouds) {
      c.g.position.x += c.speed * dt;
      if (c.g.position.x > 170) c.g.position.x = -170;
      const sx = c.g.position.x + 6, sz = c.g.position.z + 4;
      c.sh.position.set(sx, Math.max(terrainHeight(sx, sz), WATER_Y) + 0.25, sz);
    }

    // pegadas somem em 6 s
    for (const pr of this.prints) {
      if (!pr.m.visible) continue;
      pr.life -= dt;
      pr.m.material.opacity = 0.35 * Math.max(0, pr.life / CONFIG.ambient.footprintLife);
      if (pr.life <= 0) pr.m.visible = false;
    }

    // árvores chacoalhando 0,6 s
    for (let i = this.shaking.length - 1; i >= 0; i--) {
      const s = this.shaking[i];
      s.t += dt;
      const k = s.t / 0.6;
      setInstance(s.tree, { rz: k < 1 ? Math.sin(s.t * 40) * 0.09 * (1 - k) : 0, rx: k < 1 ? Math.cos(s.t * 33) * 0.05 * (1 - k) : 0 });
      if (k >= 1) this.shaking.splice(i, 1);
    }

    // flores amassadas: escala y → 0,4 e soltam 6 pétalas
    const grid = this.props.flowerGrid;
    const cx = Math.floor(hero.x / 4), cz = Math.floor(hero.z / 4);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const l = grid.get(`${cx + i},${cz + j}`);
      if (!l) continue;
      for (const f of l) {
        if (f.squash > 0) continue;
        if ((f.head.x - hero.x) ** 2 + (f.head.z - hero.z) ** 2 < 0.36) {
          f.squash = 5;
          this.squashed.push(f);
          G.particles.emit('petalas', f.head.x, f.head.y + 0.4, f.head.z, { color: f.head.color });
        }
      }
    }
    for (let i = this.squashed.length - 1; i >= 0; i--) {
      const f = this.squashed[i];
      f.squash -= dt;
      const sy = f.squash > 0.6 ? 0.4 : lerp(1, 0.4, Math.max(0, f.squash) / 0.6);
      setInstance(f.head, { sy: f.head.s * sy }); setInstance(f.stem, { sy: f.stem.s * sy });
      if (f.squash <= 0) this.squashed.splice(i, 1);
    }

    // caranguejos andam de lado para longe do herói
    for (const c of this.crabs) {
      const d = Math.hypot(c.pos.x - hero.x, c.pos.z - hero.z);
      const to = V(c.pos.x - hero.x, 0, c.pos.z - hero.z);
      if (d < 3) {
        to.normalize();
        const nx = c.pos.x + to.x * 3 * dt, nz = c.pos.z + to.z * 3 * dt;
        if (terrainHeight(nx, nz) > -0.15) { c.pos.x = nx; c.pos.z = nz; }
        c.m.rotation.y = Math.atan2(to.x, to.z) + Math.PI / 2;
        c.m.children[0].rotation.z = Math.sin(t * 30) * 0.15;
      } else if (c.pos.distanceTo(c.home) > 0.5 && d > 8) {
        c.pos.lerp(c.home, dt * 0.2);
      }
      c.m.position.set(c.pos.x, terrainHeight(c.pos.x, c.pos.z), c.pos.z);
    }
  }

  // ponto de água a menos de ~6 do herói (para o peixe)
  nearWater(h) {
    if (this._nwT && G.time - this._nwT < 0.5) return this._nw;
    this._nwT = G.time;
    this._nw = null;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      for (const r of [3, 5]) {
        const x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r;
        if (terrainHeight(x, z) < -0.9) { this._nw = V(x, WATER_Y, z); return this._nw; }
      }
    }
    return null;
  }
}
