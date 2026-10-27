// Interações espalhadas pela ilha (seções 7.1 e 7.2): baús, cogumelos-trampolim, espantalhos,
// canos de vapor, engrenagens, balão de gás e robôs quebrados da Usina.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { terrainHeight, regionAt } from './terrain.js';
import { clearAt } from './props.js';
import { distToRoad } from './roads.js';
import { platforms, streams, stones, isWalkable, nearStream } from './ground.js';
import { bridgeAt } from './bridges.js';
import { shoreRadius, islandRadius, WATER_Y } from './terrain.js';
import { box, sph, cyl, cone, mesh, mat, G_SPH } from '../utils/geo.js';
import { mulberry32, easeOutBack, ease, wrapAngle, clamp } from '../utils/math.js';
import { fala } from '../data/dialogs.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// chão livre de verdade: caminhável, fora da estrada e sem colisor (prédio, casa, árvore, pedra)
function freeAt(x, z, r = 1.2, allowTrees = false) {
  if (terrainHeight(x, z) < 0.15 || !isWalkable(x, z) || nearStream(x, z, 1) || bridgeAt(x, z, 2)) return false;
  if (distToRoad(x, z, 6) < 1.6 || Math.hypot(x, z) < 31) return false;
  for (const S of G.settlements) if (Math.hypot(x - S.def.x, z - S.def.z) < S.plazaR + 2.5) return false;
  return !G.collision.overlaps(x, z, r, allowTrees ? (c) => c.tree : null);
}
function findSpot(rnd, cx, cz, R, region, test = () => true, tries = 400) {
  for (let i = 0; i < tries; i++) {
    const a = rnd() * Math.PI * 2, r = R * Math.sqrt(rnd());
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (region !== undefined && regionAt(x, z) !== region) continue;
    if (!freeAt(x, z, 2.2)) continue;
    if (!test(x, z)) continue;
    return [x, z];
  }
  return null;
}

// ---------- riachos do cipó e das pedras (R1): planejados ANTES da vegetação ----------
export const waterPlan = { vine: null, stones: null };
function streamFits(cx, cz, ang, hl, hw) {
  const ux = Math.cos(ang), uz = Math.sin(ang);
  let lo = Infinity, hi = -Infinity;
  for (let u = -hl - 0.5; u <= hl + 0.5; u += 1) {
    for (let v = -hw - 1.5; v <= hw + 1.5; v += 1) {
      const x = cx + ux * u - uz * v, z = cz + uz * u + ux * v;
      if (!freeAt(x, z, 0.9, true)) return false; // árvores no caminho do riacho são removidas
      const h = terrainHeight(x, z);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
  }
  return hi - lo < 0.8 ? hi : false;
}
export function planWaterFeatures() {
  const rnd = mulberry32(777);
  const plan = (hl, hw, cx, cz) => {
    for (let i = 0; i < 2500; i++) {
      const a = rnd() * Math.PI * 2, r = 46 * Math.sqrt(rnd());
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (regionAt(x, z) !== 2) continue;
      const d = distToRoad(x, z, 18);
      if (d < 4 || d > 18) continue; // visível da estrada, sem cortá-la
      const ang = rnd() * Math.PI;
      const top = streamFits(x, z, ang, hl, hw);
      if (top === false) continue;
      const s = { x, z, ux: Math.cos(ang), uz: Math.sin(ang), hl, hw, y: top + 0.08 };
      streams.push(s);
      G.props?.hideIn((x2, z2) => nearStream(x2, z2, 1.2)); // nada de grama ou árvore dentro da água
      return s;
    }
    return null;
  };
  // cipó: riacho de 8 unidades de largura; pedras: distância 1,4 entre pedras (§7.2)
  waterPlan.vine = plan(3.5, 4, -78, -28);
  waterPlan.stones = plan(3, 2.2, -70, -32);
  if (waterPlan.stones) {
    const s = waterPlan.stones;
    for (const v of [-2.1, -0.7, 0.7, 2.1]) stones.push({ x: s.x - s.uz * v, z: s.z + s.ux * v, r: 0.55, y: s.y + 0.18 });
  }
}
const streamPoint = (s, u, v) => [s.x + s.ux * u - s.uz * v, s.z + s.uz * u + s.ux * v];

export class Extras {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    const rnd = mulberry32(4242);
    this.rnd = rnd;
    planWaterFeatures(); // depois das cidades: usa as colisões reais
    this.buildChests(rnd);
    this.buildMushrooms(rnd);
    this.buildScarecrows(rnd);
    this.buildSteam(rnd);
    this.buildGears(rnd);
    this.buildBalloon(rnd);
    this.buildRobots(rnd);
    this.buildStreams();
    this.buildCart();
    this.buildCarousel(rnd);
    this.buildBoat();
    this.buildDolphin();
  }

  // center: ponto usado para descartar por distância (grupos com filhos em coordenadas do mundo)
  add(obj, update, center = obj.position) { this.scene.add(obj); this.items.push({ obj, update, center }); }

  buildChests(rnd) {
    const spots = [];
    // atrás de casas/prédios (esconderijos) e alguns soltos
    for (const S of G.settlements) {
      if (!S.hiddenSpots.length || S.def.tipo === 'arena') continue;
      const h = S.hiddenSpots[Math.floor(rnd() * S.hiddenSpots.length)];
      if (rnd() < 0.55 && clearAt(h.x, h.z, 0.5)) spots.push([h.x, h.z]);
    }
    for (const [cx, cz, r] of [[-30, 95, 12], [-70, 40, 25], [-80, -30, 25], [10, -90, 25], [80, -30, 25], [70, 50, 25]]) {
      const p = findSpot(rnd, cx, cz, r, undefined, (x, z) => distToRoad(x, z, 10) > 4);
      if (p) spots.push(p);
    }
    spots.forEach(([x, z], idx) => this.makeChest(x, z, terrainHeight(x, z), `bau-${idx}`, rnd() * 6));
  }

  makeChest(x, z, y, id, rotY = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY;
    g.add(box(0.9, 0.5, 0.6, '#8b5a2b', 0, 0.25, 0));
    g.add(box(0.95, 0.08, 0.65, '#f2c14e', 0, 0.38, 0));
    const lid = new THREE.Group(); lid.position.set(0, 0.5, -0.3);
    lid.add(box(0.92, 0.22, 0.62, '#a8764a', 0, 0.11, 0.3));
    lid.add(box(0.14, 0.18, 0.06, '#f2c14e', 0, 0.02, 0.62));
    g.add(lid);
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    if (y < terrainHeight(x, z) + 0.5) G.collision.addCircle(x, z, 0.5); // baú no chão; nas plataformas não bloqueia o chão
    const ch = { id, lid, open: G.progress.d.chests.includes(id), t: 0, x, z, y };
    if (ch.open) { lid.rotation.x = -1.9; ch.t = 1; }
    G.interaction.add({ x, z, r: CONFIG.triggers.chest, label: 'Abrir baú', enabled: () => !ch.open && Math.abs(G.hero.pos.y - y) < 1.2, action: () => {
      ch.open = true; ch.t = 0;
      G.progress.d.chests.push(id);
      const n = CONFIG.seeds.chestMin + Math.floor(Math.random() * (CONFIG.seeds.chestMax - CONFIG.seeds.chestMin + 1));
      G.progress.addSeeds(n);
      G.ui.seedFly(V(x, y + 1, z), n);
      G.particles.emit('dourado', x, y + 0.7, z);
      G.audio.sfx('porta');
      G.ui.caption(`📦 Baú aberto: +${n} sementes`);
      G.progress.save();
    } });
    this.add(g, (t, dt) => { if (ch.open && ch.t < 1) { ch.t = Math.min(1, ch.t + dt / 0.6); lid.rotation.x = -1.9 * easeOutBack(ch.t); } });
    return ch;
  }

  buildMushrooms(rnd) {
    for (let i = 0; i < 5; i++) {
      const p = findSpot(rnd, -72, -30, 32, 2, (x, z) => distToRoad(x, z, 8) < 6);
      if (!p) continue;
      const [x, z] = p, y = terrainHeight(x, z);
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(cyl(0.22, 0.3, 0.6, '#fff7e6', 0, 0.3, 0, 8));
      const cap = mesh(new THREE.SphereGeometry(0.9, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e8454a', 0, 0.55, 0); cap.scale.y = 0.6; g.add(cap);
      for (let k = 0; k < 5; k++) { const a = k * 1.25; g.add(sph(0.12, '#ffffff', Math.cos(a) * 0.5, 0.82, Math.sin(a) * 0.5, 5, 4)); }
      let cool = 0, sq = 0;
      this.add(g, (t, dt) => {
        cool -= dt; sq = Math.max(0, sq - dt * 3);
        cap.scale.set(1 + sq * 0.2, 0.6 - sq * 0.25, 1 + sq * 0.2);
        const h = G.hero;
        if (cool <= 0 && Math.hypot(h.pos.x - x, h.pos.z - z) < 1.0 && !h.busy && G.mode === 'play' && h.pos.y < y + 0.8) {
          cool = 1.2; sq = 1;
          h.jumpT = -1;
          h.jump(3 / CONFIG.hero.jumpHeight);
        }
      });
      // §7.2: o salto de altura 3 alcança uma plataforma de folhas, às vezes com baú
      for (let k = 0; k < 8; k++) {
        const ang = rnd() * Math.PI * 2, px = x + Math.cos(ang) * 3.2, pz = z + Math.sin(ang) * 3.2;
        if (!freeAt(px, pz, 1.5)) continue;
        const py = terrainHeight(px, pz) + 3.0;
        const pl = new THREE.Group(); pl.position.set(px, py, pz);
        pl.add(cyl(1.45, 1.3, 0.3, '#8b5a2b', 0, -0.15, 0, 10));
        for (let j = 0; j < 6; j++) { const a2 = j * 1.05; pl.add(sph(0.45, '#4f8f3a', Math.cos(a2) * 1.3, -0.35, Math.sin(a2) * 1.3, 6, 4)); }
        pl.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        platforms.push({ x: px, z: pz, r: 1.45, y: py });
        this.add(pl, () => {});
        if (i % 2 === 0) this.makeChest(px, pz, py, `bau-cogumelo-${i}`, ang);
        break;
      }
    }
  }

  buildScarecrows(rnd) {
    for (let i = 0; i < 3; i++) {
      const p = findSpot(rnd, -65, 48, 26, 1);
      if (!p) continue;
      const [x, z] = p, y = terrainHeight(x, z);
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(cyl(0.07, 0.07, 2.2, '#8b5a2b', 0, 1.1, 0, 5));
      const arms = box(1.8, 0.1, 0.1, '#8b5a2b', 0, 1.6, 0); g.add(arms);
      g.add(box(0.7, 0.8, 0.4, '#5f8fd9', 0, 1.5, 0));
      const head = new THREE.Group(); head.position.y = 2.2; g.add(head);
      head.add(sph(0.3, '#e8c872', 0, 0, 0, 8, 6));
      head.add(cone(0.42, 0.45, '#a8764a', 0, 0.3, 0, 8));
      head.add(sph(0.05, '#3a2a1a', -0.1, 0.05, 0.27, 4, 3)); head.add(sph(0.05, '#3a2a1a', 0.1, 0.05, 0.27, 4, 3));
      G.collision.addCircle(x, z, 0.35);
      let yaw = 0, spooked = 0;
      this.add(g, (t, dt) => {
        const h = G.hero.pos;
        const d = Math.hypot(h.x - x, h.z - z);
        if (d > 14) return;
        const want = Math.atan2(h.x - x, h.z - z);
        const diff = wrapAngle(want - yaw);
        spooked -= dt;
        if (d < 2 && Math.abs(diff) > 2 && spooked <= 0) {
          // o herói passou atrás: vira de repente com susto
          yaw = want; spooked = 4;
          G.ui.bubbles.say(head, '!!', { icon: true, y: 0.8, time: 1.2 });
          G.hero.play('surprise');
          G.audio.sfx('pop');
        } else if (Math.abs(diff) < 2) yaw += diff * Math.min(1, dt * 3);
        head.rotation.y = yaw;
      });
    }
  }

  buildSteam(rnd) {
    for (let i = 0; i < 3; i++) {
      const p = findSpot(rnd, 5, -88, 24, 3, (x, z) => distToRoad(x, z, 8) < 5);
      if (!p) continue;
      const [x, z] = p, y = terrainHeight(x, z);
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(cyl(0.3, 0.3, 1.4, '#e07a3f', 0, 0.7, 0, 8));
      g.add(cyl(0.38, 0.38, 0.15, '#8a96a3', 0, 1.4, 0, 8));
      const pipe = cyl(0.18, 0.18, 1.6, '#e07a3f', 0.8, 0.2, 0, 6); pipe.rotation.z = Math.PI / 2; g.add(pipe);
      G.collision.addCircle(x, z, 0.45);
      let tJet = i * 2.5;
      this.add(g, (t, dt) => {
        tJet += dt;
        if (tJet >= 8) {
          tJet = 0;
          const near = Math.hypot(G.hero.pos.x - x, G.hero.pos.z - z);
          if (near < 30) { for (let k = 0; k < 3; k++) G.particles.emit('fumaca', x, y + 1.6 + k * 0.5, z, { vel: V(0, 3, 0) }); G.audio.sfx('vapor'); }
          if (near < 1.8 && !G.hero.busy) G.hero.play('surprise');
        }
      });
    }
  }

  buildGears(rnd) {
    const p = findSpot(rnd, 20, -70, 14, 3);
    if (!p) return;
    const [x, z] = p, y = terrainHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z);
    const gears = [];
    [[0, 2.2, 1], [2.1, 1.1, 2], [3.3, 0.75, 3]].forEach(([gx, r, sp], i) => {
      const gg = new THREE.Group(); gg.position.set(gx, r + 0.3, 0);
      const disc = cyl(r, r, 0.3, i % 2 ? '#8a96a3' : '#e07a3f', 0, 0, 0, 14); disc.rotation.x = Math.PI / 2; gg.add(disc);
      const teeth = Math.round(r * 8);
      for (let k = 0; k < teeth; k++) { const a = (k / teeth) * Math.PI * 2; const tt = box(0.25, 0.3, 0.32, '#6b6f78', Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), 0); tt.rotation.z = a; gg.add(tt); }
      gg.add(sph(0.2, '#f2c14e', 0, 0, 0.2, 6, 5));
      g.add(gg); gears.push({ gg, sp: (i % 2 ? -1 : 1) * sp });
    });
    g.add(box(4.5, 0.3, 0.6, '#4a4f57', 1.6, 0.15, -0.2));
    G.collision.addCircle(x + 1.5, z, 2.3);
    // velocidades proporcionais 1, 2, 3: lição visual de razão
    this.add(g, (t, dt) => { for (const q of gears) q.gg.rotation.z += q.sp * dt * 0.6; });
  }

  buildBalloon(rnd) {
    const p = findSpot(rnd, 82, -22, 14, 4);
    if (!p) return;
    const [x, z] = p, y = terrainHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z);
    const lift = new THREE.Group(); g.add(lift);
    lift.add(box(1.4, 0.8, 1.4, '#a8764a', 0, 0.4, 0));
    const bal = sph(2.0, '#e8554a', 0, 4.2, 0, 14, 10); bal.scale.y = 1.15; lift.add(bal);
    for (let k = 0; k < 6; k++) lift.add(box(0.2, 2.3, 0.05, '#f2c14e', Math.cos((k / 6) * Math.PI * 2) * 2.0, 4.2, Math.sin((k / 6) * Math.PI * 2) * 2.0));
    for (const [cx, cz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) lift.add(cyl(0.03, 0.03, 1.6, '#6b4423', cx, 1.6, cz, 3));
    G.collision.addCircle(x, z, 0.9);
    let riding = false;
    G.interaction.add({ x, z, r: 2.4, label: 'Subir no balão de gás', enabled: () => !riding, action: () => {
      riding = true;
      G.audio.sfx('vento');
      G.camRig.setContextZoom(1.7, 1.5);
      G.hero.ride((dt, t) => {
        const T = 4;
        let k = t < T ? ease(t / T) : t < T + 1.5 ? 1 : 1 - ease((t - T - 1.5) / T);
        if (t > T * 2 + 1.5) { riding = false; lift.position.y = 0; G.camRig.setContextZoom(1, 1); return null; }
        lift.position.y = k * 6;
        return { pos: V(x, y + 0.75 + k * 6, z), yaw: G.hero.yaw + dt * 0.3, pose: 'seat' };
      }, 'seat');
    } });
    this.add(g, (t) => { if (!riding) lift.position.y = Math.sin(t) * 0.1; bal.rotation.y = t * 0.2; });
  }

  buildRobots(rnd) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const home = V(Math.cos(a) * 14, 0, Math.sin(a) * 14);
      const g = new THREE.Group();
      g.add(box(0.8, 0.9, 0.6, '#8a96a3', 0, 0.85, 0));
      const hd = new THREE.Group(); hd.position.y = 1.55; g.add(hd);
      hd.add(box(0.6, 0.45, 0.5, '#c9cdd3', 0, 0, 0));
      hd.add(box(0.4, 0.1, 0.05, '#b7ff3c', 0, 0.02, 0.26));
      hd.add(cyl(0.02, 0.02, 0.4, '#4a4f57', 0.15, 0.4, 0, 3));
      for (const sx of [-1, 1]) g.add(cyl(0.12, 0.12, 0.4, '#4a4f57', sx * 0.25, 0.2, 0, 6));
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      let cool = 2 + i;
      const pos = home.clone();
      this.add(g, (t, dt) => {
        const ang = a + Math.sin(t * 0.2 + i) * 0.6;
        pos.set(Math.cos(ang) * 14, 0, Math.sin(ang) * 14);
        g.position.set(pos.x, terrainHeight(pos.x, pos.z), pos.z);
        g.rotation.y = -ang;
        hd.rotation.z = Math.sin(t * 7 + i) * 0.15;
        const d = Math.hypot(G.hero.pos.x - pos.x, G.hero.pos.z - pos.z);
        if (d < 30 && Math.random() < dt * 1.2) G.particles.emit('faiscas', pos.x, g.position.y + 1.7, pos.z);
        cool -= dt;
        if (d < 5 && cool <= 0) { cool = 7; G.ui.bubbles.say(g, fala('robo'), { y: 2.3 }); G.audio.voice('bip bop', 200, 'square'); }
      });
    }
  }

  // ---------- R1: cipó (pêndulo de 2 s sobre riacho de 8) e pedras do rio ----------
  buildStreams() {
    const waterMat = new THREE.MeshLambertMaterial({ color: '#5ec3e6', transparent: true, opacity: 0.92, polygonOffset: true, polygonOffsetFactor: -2 });
    const makeWater = (s) => {
      const g = new THREE.Group();
      g.position.set(s.x, s.y, s.z);
      g.rotation.y = -Math.atan2(s.uz, s.ux);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(s.hl * 2, s.hw * 2), waterMat);
      pl.rotation.x = -Math.PI / 2; pl.receiveShadow = true;
      g.add(pl);
      for (let k = 0; k < 10; k++) { // pedras e juncos nas margens
        const u = -s.hl + (k / 9) * s.hl * 2, side = k % 2 ? 1 : -1;
        g.add(sph(0.3 + (k % 3) * 0.1, '#8a8478', u, 0, side * (s.hw + 0.2), 5, 4));
        g.add(cone(0.06, 0.9, '#4f8a3a', u + 0.4, 0.4, side * (s.hw + 0.4), 3));
      }
      this.add(g, () => {});
      return g;
    };
    const vs = waterPlan.vine;
    if (vs) {
      makeWater(vs);
      const top = vs.y + 7.2, L = 6.6, reach = vs.hw + 1.7;
      const frame = new THREE.Group(); frame.position.set(vs.x, 0, vs.z); frame.rotation.y = -Math.atan2(vs.uz, vs.ux);
      for (const side of [-1, 1]) {
        frame.add(cyl(0.22, 0.3, top - vs.y + 0.5, '#6b4423', 0, (vs.y + top) / 2, side * (vs.hw + 1.2), 6));
        G.collision.addCircle(...streamPoint(vs, 0, side * (vs.hw + 1.2)), 0.35);
      }
      frame.add(box(0.35, 0.35, vs.hw * 2 + 3, '#6b4423', 0, top, 0));
      frame.add(mesh(new THREE.IcosahedronGeometry(1.2, 0), '#2f6b3a', 0, top + 0.6, 0));
      this.add(frame, () => {});
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 4), mat('#4f8a3a'));
      this.scene.add(rope);
      const pivot = V(vs.x, top, vs.z);
      const swingPos = (phi) => { const [x, z] = streamPoint(vs, 0, Math.sin(phi) * L); return V(x, top - Math.cos(phi) * L, z); };
      const setRope = (hand) => {
        const d = hand.clone().sub(pivot);
        rope.scale.y = d.length();
        rope.position.copy(pivot).addScaledVector(d, 0.5);
        rope.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
      };
      const rest = Math.asin(Math.min(0.99, reach / L));
      setRope(swingPos(0).add(V(0, 1.5, 0)));
      for (const side of [-1, 1]) {
        const [bx, bz] = streamPoint(vs, 0, side * reach);
        G.interaction.add({
          x: bx, z: bz, r: 2.2, label: 'Balançar no cipó', prio: 2,
          action: () => {
            if (G.hero.busy) return;
            G.audio.sfx('vento');
            const start = G.hero.pos.clone();
            G.hero.ride((dt2, tt) => {
              const T = 2;
              if (tt > T) { setRope(swingPos(0).add(V(0, 1.5, 0))); const [ex, ez] = streamPoint(vs, 0, -side * reach); G.hero.pos.set(ex, 0, ez); return null; }
              const phi = side * rest * Math.cos((Math.PI * tt) / T); // pêndulo de um lado ao outro em 2 s
              const p = swingPos(phi);
              setRope(p.clone().add(V(0, 2.2, 0)));
              if (tt < 0.2) p.lerp(start, 1 - tt / 0.2);
              return { pos: p, pose: 'ride' };
            }, 'ride');
          },
        });
      }
    }
    const ss = waterPlan.stones;
    if (ss) {
      makeWater(ss);
      for (const st of stones) {
        const m = cyl(0.55, 0.62, 0.5, '#9a9488', st.x, st.y - 0.25, st.z, 8);
        m.castShadow = m.receiveShadow = true;
        this.add(m, () => {});
      }
      const [px, pz] = streamPoint(ss, ss.hl + 1.6, -ss.hw - 1.5);
      const sign = new THREE.Group(); sign.position.set(px, terrainHeight(px, pz), pz);
      sign.add(cyl(0.07, 0.07, 1.2, '#6b4423', 0, 0.6, 0, 5)); sign.add(box(0.9, 0.5, 0.07, '#c49a6c', 0, 1.2, 0));
      this.add(sign, () => {});
      G.triggers.add({ x: ss.x, z: ss.z, r: ss.hl + 4, enter: () => G.raizinha.say('Pedras do rio! Pula de pedra em pedra com Espaço.') });
    }
  }

  // ---------- R2: vagonete de 4 s entre Gaussburgo e Jacobópolis ----------
  buildCart() {
    const A0 = G.settlements.find((s) => s.def.id === 'C2.1'), B0 = G.settlements.find((s) => s.def.id === 'C2.4');
    if (!A0 || !B0) return;
    const a = V(A0.def.x, 0, A0.def.z), b = V(B0.def.x, 0, B0.def.z);
    const dir = b.clone().sub(a).normalize(), perp = V(-dir.z, 0, dir.x);
    const pA = a.clone().addScaledVector(dir, 19), pB = b.clone().addScaledVector(dir, -20);
    const mid = pA.clone().lerp(pB, 0.5).addScaledVector(perp, 3);
    const curve = new THREE.CatmullRomCurve3([pA, mid, pB]);
    const pts = curve.getSpacedPoints(40);
    if (pts.some((p) => terrainHeight(p.x, p.z) < 0.1)) return;
    const track = new THREE.Group();
    const tmp = V(0, 0, 0);
    pts.forEach((p, i) => {
      p.y = terrainHeight(p.x, p.z) + 0.08;
      curve.getTangentAt(i / 40, tmp);
      const sl = box(1.5, 0.08, 0.25, '#6b4423', p.x, p.y, p.z); sl.rotation.y = Math.atan2(tmp.x, tmp.z) + Math.PI / 2; track.add(sl);
    });
    for (const side of [-0.5, 0.5]) {
      for (let i = 0; i < pts.length - 1; i++) {
        curve.getTangentAt(i / 40, tmp);
        const nx = -tmp.z * side, nz = tmp.x * side;
        const p1 = V(pts[i].x + nx, pts[i].y + 0.1, pts[i].z + nz), p2 = V(pts[i + 1].x + nx, pts[i + 1].y + 0.1, pts[i + 1].z + nz);
        const d = p2.clone().sub(p1);
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, d.length()), mat('#8a96a3'));
        r.position.copy(p1).addScaledVector(d, 0.5);
        r.lookAt(p2);
        track.add(r);
      }
    }
    this.add(track, () => {}, pA.clone().lerp(pB, 0.5));
    const cart = new THREE.Group();
    cart.add(box(1.2, 0.6, 1.6, '#e07a3f', 0, 0.55, 0));
    cart.add(box(1.3, 0.12, 1.7, '#4a4f57', 0, 0.85, 0));
    for (const [wx, wz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) { const w = cyl(0.2, 0.2, 0.12, '#2b2f3a', wx, 0.22, wz, 8); w.rotation.z = Math.PI / 2; cart.add(w); }
    cart.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    let at = 0; // 0 = em Gaussburgo, 1 = em Jacobópolis
    const placeCart = (k) => { curve.getPointAt(k, cart.position); cart.position.y = terrainHeight(cart.position.x, cart.position.z) + 0.1; curve.getTangentAt(k, tmp); cart.rotation.y = Math.atan2(tmp.x, tmp.z); };
    placeCart(0);
    this.add(cart, () => {});
    for (const [k, p] of [[0, pA], [1, pB]]) {
      const stn = box(2.2, 0.3, 1.4, '#a8764a', p.x - perp.x * 1.8, terrainHeight(p.x, p.z) + 0.15, p.z - perp.z * 1.8);
      this.add(stn, () => {});
      G.interaction.add({
        x: p.x, z: p.z, r: 2.8, label: k === 0 ? 'Vagonete para Jacobópolis' : 'Vagonete para Gaussburgo', prio: 2,
        action: () => {
          if (G.hero.busy) return;
          const from = at, to = 1 - at;
          let spark = 0;
          G.audio.sfx('tick');
          G.hero.ride((dt2, tt) => {
            const T = 4;
            if (tt > T) { at = to; placeCart(to); const end = to ? pB : pA; G.hero.pos.set(end.x - perp.x * 1.8, 0, end.z - perp.z * 1.8); return null; }
            const k2 = from + (to - from) * ease(tt / T);
            placeCart(k2);
            if ((spark -= dt2) <= 0) { spark = 0.12; G.particles.emit('faiscas', cart.position.x, cart.position.y + 0.2, cart.position.z, { count: 4 }); }
            return { pos: cart.position.clone().add(V(0, 0.5, 0)), yaw: cart.rotation.y + (to < from ? Math.PI : 0), pose: 'seat' };
          }, 'seat');
        },
      });
    }
  }

  // ---------- R3: carrossel giratório (3 s, câmera em órbita) ----------
  buildCarousel(rnd) {
    const p = findSpot(rnd, 76, -34, 26, 4, (x, z) => distToRoad(x, z, 10) > 3.5 && freeAt(x, z, 3.2, true), 1500);
    if (!p) return;
    const [x, z] = p, y = terrainHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z);
    g.add(cyl(2.7, 2.9, 0.35, '#f2c14e', 0, 0.17, 0, 14));
    const spin = new THREE.Group(); g.add(spin);
    spin.add(cyl(0.18, 0.18, 3.2, '#e8554a', 0, 1.8, 0, 6));
    spin.add(cone(3.1, 1.2, '#e8554a', 0, 3.9, 0, 12));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; spin.add(box(0.7, 0.5, 0.7, ['#7ab8f5', '#ffffff', '#f28ab2', '#9ad37a'][k], Math.cos(a) * 2, 0.7, Math.sin(a) * 2)); spin.add(cyl(0.04, 0.04, 2.8, '#c9a24e', Math.cos(a) * 2, 2, Math.sin(a) * 2, 3)); }
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    G.props?.hideIn((x2, z2) => Math.hypot(x2 - x, z2 - z) < 3.6);
    G.collision.addCircle(x, z, 2.9);
    let riding = false, ang0 = 0;
    this.add(g, (t, dt) => { if (!riding) spin.rotation.y += dt * 0.4; });
    G.interaction.add({
      x, z, r: 4.2, label: 'Subir no carrossel', prio: 2, enabled: () => !riding,
      action: () => {
        if (G.hero.busy) return;
        riding = true; ang0 = Math.atan2(G.hero.pos.z - z, G.hero.pos.x - x);
        const back = G.hero.pos.clone();
        G.audio.sfx('gritinhos');
        const center = V(x, y + 1.5, z);
        G.camRig.override = () => { const a = ang0 + (spin.rotation.y || 0) * 0.6; return { pos: V(x + Math.cos(a) * 13, y + 9, z + Math.sin(a) * 13), look: center, target: G.hero.pos }; };
        let tt0 = 0;
        G.hero.ride((dt2, tt) => {
          tt0 = tt;
          if (tt > 3) { riding = false; G.camRig.override = null; G.camRig.snap(back); G.hero.pos.copy(back); return null; }
          spin.rotation.y += dt2 * 2.4;
          const a = ang0 - spin.rotation.y;
          return { pos: V(x + Math.cos(a) * 2, y + 1.1 + Math.sin(tt * 6) * 0.15, z + Math.sin(a) * 2), yaw: -a, pose: 'seat' };
        }, 'seat');
      },
    });
  }

  // ---------- R4: barquinho do Porto Euler até a Península RK4 (5 s, Raizinha na proa) ----------
  buildBoat() {
    const S1 = G.settlements.find((s) => s.def.id === 'C4.4'), S2 = G.settlements.find((s) => s.def.id === 'C4.5');
    if (!S1 || !S2) return;
    const dock = (S) => {
      const th = Math.atan2(S.def.z, S.def.x), c = Math.cos(th), sn = Math.sin(th);
      let last = null;
      for (let r = Math.hypot(S.def.x, S.def.z) + 6; r < 150; r += 0.5) { if (!isWalkable(c * r, sn * r)) break; last = [c * r, sn * r, r, th]; }
      return last;
    };
    const dA = dock(S1), dB = dock(S2);
    if (!dA || !dB) return;
    const pier = (d) => {
      const [x, z, r, th] = d;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -th + Math.PI / 2;
      g.add(box(1.6, 0.2, 4.0, '#a8764a', 0, WATER_Y + 0.55, 1.6));
      for (const [px, pz] of [[-0.7, 0.4], [0.7, 0.4], [-0.7, 3.4], [0.7, 3.4]]) g.add(cyl(0.1, 0.1, 1.6, '#6b4423', px, WATER_Y, pz, 4));
      this.add(g, () => {});
      return V(Math.cos(th) * (r + 3.4), WATER_Y + 0.2, Math.sin(th) * (r + 3.4));
    };
    const tipA = pier(dA), tipB = pier(dB);
    const route = [tipA];
    const thA = dA[3], thB = dB[3];
    for (let k = 0; k <= 4; k++) { const th = thA + ((thB - thA) * k) / 4; const r = shoreRadius(th) + 7; route.push(V(Math.cos(th) * r, WATER_Y + 0.2, Math.sin(th) * r)); }
    route.push(tipB);
    const curve = new THREE.CatmullRomCurve3(route);
    const boat = new THREE.Group();
    boat.add(box(1.2, 0.45, 2.4, '#e8554a', 0, 0.2, 0));
    const bow = cone(0.6, 0.9, '#e8554a', 0, 0.2, 1.6, 4); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 0.5); boat.add(bow);
    boat.add(box(1.25, 0.08, 2.45, '#fff7e6', 0, 0.45, 0));
    for (const sx of [-1, 1]) { const o = box(0.08, 0.08, 1.4, '#6b4423', sx * 0.8, 0.5, -0.3); o.rotation.x = 0.4; boat.add(o); }
    boat.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    let side = 0; // 0 = no Porto Euler
    const tmp = V(0, 0, 0);
    const placeBoat = (k, t = 0) => { curve.getPointAt(k, boat.position); boat.position.y += Math.sin(t * 3) * 0.06; curve.getTangentAt(k, tmp); boat.rotation.y = Math.atan2(tmp.x, tmp.z); };
    placeBoat(0);
    this.add(boat, () => {});
    for (const [k, d] of [[0, dA], [1, dB]]) {
      G.interaction.add({
        x: d[0], z: d[1], r: 3.0, label: k === 0 ? 'Barquinho para a Península RK4' : 'Barquinho para o Porto Euler', prio: 2,
        action: () => {
          if (G.hero.busy) return;
          const from = side, to = 1 - side;
          G.audio.sfx('splash');
          G.ui.caption('🚣 Travessia de barquinho');
          G.hero.ride((dt2, tt) => {
            const T = 5;
            if (tt > T) { side = to; placeBoat(to); G.hero.ridePeer = null; const e = to ? dB : dA; G.hero.pos.set(e[0], 0, e[1]); return null; }
            const kk = from + (to - from) * ease(tt / T);
            placeBoat(kk, tt);
            const fw = V(Math.sin(boat.rotation.y), 0, Math.cos(boat.rotation.y)).multiplyScalar(to < from ? -1 : 1);
            G.hero.ridePeer = boat.position.clone().addScaledVector(fw, 1.2).add(V(0, 0.45, 0)); // Raizinha na proa
            if (Math.random() < dt2 * 6) G.particles.emit('respingo', boat.position.x, WATER_Y, boat.position.z, { count: 3 });
            return { pos: boat.position.clone().addScaledVector(fw, -0.4).add(V(0, 0.15, 0)), yaw: Math.atan2(fw.x, fw.z), pose: 'seat' };
          }, 'seat');
        },
      });
    }
  }

  // ---------- R4: onda que apaga as pegadas (6 s) e golfinho (90 s) ----------
  buildDolphin() {
    const d = new THREE.Group();
    const b = sph(0.5, '#6f8fa8', 0, 0, 0, 8, 6); b.scale.set(0.6, 0.6, 2.0); d.add(b);
    d.add(sph(0.32, '#dfe7ee', 0, -0.15, 0.2, 6, 4));
    const fin = cone(0.25, 0.6, '#6f8fa8', 0, 0.45, -0.1, 4); fin.scale.z = 0.4; d.add(fin);
    const tail = box(0.9, 0.08, 0.35, '#6f8fa8', 0, 0, -1.1); d.add(tail);
    d.visible = false;
    this.scene.add(d);
    this.dolphin = { m: d, t: -1, timer: 60 };
    this.waveT = 0;
  }
  updateCoast(t, dt) {
    this.waveT += dt;
    if (this.waveT >= 6) { this.waveT = 0; G.ambient?.washBeach(); }
    const D = this.dolphin;
    if (!D) return;
    D.timer += dt;
    const h = G.hero.pos;
    if (D.t < 0 && D.timer >= 90 && regionAt(h.x, h.z) === 5 && G.mode === 'play') {
      const out = V(h.x, 0, h.z).normalize();
      const p = V(h.x, 0, h.z).addScaledVector(out, 10);
      if (terrainHeight(p.x, p.z) < -1.2) {
        D.timer = 0; D.t = 0;
        const side = V(-out.z, 0, out.x);
        D.a = p.clone().addScaledVector(side, -3.5); D.b = p.clone().addScaledVector(side, 3.5);
        D.m.visible = true;
        G.particles.emit('respingo', D.a.x, WATER_Y, D.a.z, { count: 14 });
        G.audio.sfx('splash');
        G.ui.caption('🐬 Um golfinho saltou!');
      }
    }
    if (D.t >= 0) {
      D.t += dt;
      const k = D.t / 1.6;
      D.m.position.lerpVectors(D.a, D.b, Math.min(1, k));
      D.m.position.y = WATER_Y + 4 * k * (1 - k) * 2.2;
      D.m.lookAt(D.b.x, D.m.position.y + (0.5 - k) * 4, D.b.z);
      if (k >= 1) { D.t = -1; D.m.visible = false; G.particles.emit('respingo', D.b.x, WATER_Y, D.b.z, { count: 14 }); G.audio.sfx('splash'); }
    }
  }

  update(t, dt) {
    this.updateCoast(t, dt);
    const h = G.hero.pos;
    for (const it of this.items) {
      const d = Math.hypot(it.center.x - h.x, it.center.z - h.z);
      it.obj.visible = d < 90;
      if (d < 70) it.update(t, dt);
    }
  }
}
