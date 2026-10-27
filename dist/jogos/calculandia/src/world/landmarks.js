// Marcos: o objeto grande que explica o método à primeira vista (seção 5.1).
// Cada fábrica recebe L = { st, dyn, collide, interact, trigger, toWorld, s } e devolve { update, evolve, onWin }.
import * as THREE from 'three';
import { G } from '../game.js';
import { box, sph, cyl, cone, rod, mesh, mat, G_SPH, G_BOX, textSprite } from '../utils/geo.js';
import { makeTree } from './props.js';
import { ease, easeOutBack, clamp, lerp } from '../utils/math.js';
import { fala } from '../data/dialogs.js';
import { CONFIG } from '../config.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const roof4 = (r, h, c, x, y, z) => { const m = cone(r, h, c, x, y, z, 4); m.rotation.y = Math.PI / 4; return m; };
const emissive = (c, e = '#000000') => mat(c, { emissive: e });

export const LANDMARKS = {
  // A0 — barco encalhado e tenda do engenheiro
  barco(L) {
    const b = new THREE.Group();
    b.position.set(0, 0, 0); b.rotation.set(0, 0.3, 0.14);
    b.add(box(5.2, 1.0, 1.9, '#8b5a2b', 0, 0.55, 0));
    b.add(box(5.3, 0.22, 2.05, '#a8764a', 0, 1.1, 0));
    const bow = cone(1.0, 1.7, '#8b5a2b', 3.35, 0.6, 0, 4); bow.rotation.set(Math.PI / 4, 0, -Math.PI / 2); bow.scale.set(1, 1, 0.95); b.add(bow);
    b.add(box(0.6, 0.6, 1.4, '#6b4423', -1.8, 1.4, 0));
    b.add(cyl(0.08, 0.08, 3.6, '#6b4423', 0.4, 2.8, 0, 5));
    const sail = box(0.06, 2.0, 1.7, '#f4ead8', 0.45, 3.1, 0.2); sail.rotation.y = 0.3; b.add(sail);
    b.add(box(0.06, 0.4, 1.2, '#e8654a', 0.45, 2.05, 0.15));
    L.st.add(b);
    // tenda do engenheiro
    L.st.add(roof4(2.0, 2.6, '#e8654a', -5.2, 1.3, 1.8));
    L.st.add(box(0.1, 1.2, 1.0, '#3a2a1a', -5.2 + 1.18, 0.6, 1.8));
    L.st.add(cyl(0.05, 0.05, 1.2, '#f2c14e', -5.2, 3.0, 1.8, 4));
    L.collide(-1.6, -0.5, 1.2); L.collide(0.4, 0.1, 1.2); L.collide(2.3, 0.6, 1.0); L.collide(-5.2, 1.8, 1.6);
    const flag = box(0.04, 0.35, 0.6, '#f2c14e', 0.42, 4.5, 0.32);
    L.dyn.add(flag);
    return { update(t) { flag.rotation.y = Math.sin(t * 3) * 0.3; } };
  },

  // C0.1 — padaria com pão gigante cortado reto e guilhotina; esteira de pães
  padaria(L) {
    const st = L.st;
    st.add(box(4.6, 2.8, 3.6, '#f3d9b1', 0, 1.4, 0));
    const r = roof4(3.5, 1.6, '#d9803a', 0, 3.6, 0); r.scale.z = 0.82; st.add(r);
    st.add(box(0.5, 1.4, 0.5, '#8a8a8a', 1.3, 4.2, -0.6));
    st.add(box(1.0, 1.6, 0.1, '#6b4423', 0, 0.8, 1.81));
    st.add(box(2.2, 0.5, 0.12, '#fff7e6', 0, 2.35, 1.82));
    // pão gigante
    st.add(box(2.8, 0.8, 1.5, '#a8764a', 3.9, 0.4, 1.6));
    const bread = sph(1, '#d99a4e', 3.55, 1.25, 1.6, 12, 8); bread.scale.set(1.3, 0.62, 0.68); st.add(bread);
    const cut = cyl(1, 1, 0.05, '#f7e3b0', 4.85, 1.25, 1.6, 12); cut.rotation.z = Math.PI / 2; cut.scale.set(0.6, 1, 0.66); st.add(cut);
    // guilhotina
    st.add(box(0.2, 3.0, 0.2, '#6b4423', 5.2, 1.5, 0.7)); st.add(box(0.2, 3.0, 0.2, '#6b4423', 5.2, 1.5, 2.5));
    st.add(box(0.3, 0.3, 2.1, '#6b4423', 5.2, 3.0, 1.6));
    const blade = box(0.1, 0.7, 1.6, '#c9cdd3', 5.2, 2.4, 1.6); L.dyn.add(blade);
    // esteira
    st.add(box(3.6, 0.15, 1.0, '#4a4f57', -4.2, 0.95, 1.4));
    for (const x of [-5.8, -2.6]) st.add(box(0.15, 0.9, 0.9, '#6b6f78', x, 0.45, 1.4));
    const breads = [];
    for (let i = 0; i < 4; i++) { const p = sph(1, '#e0a85c', 0, 1.2, 1.4, 8, 6); p.scale.set(0.38, 0.22, 0.26); L.dyn.add(p); breads.push(p); }
    L.collide(0, 0, 2.6); L.collide(3.9, 1.6, 1.5); L.collide(-4.2, 1.4, 1.7); L.collide(5.2, 0.7, 0.3); L.collide(5.2, 2.5, 0.3);
    L.interact({ lx: -4.2, lz: 2.6, r: 2.4, label: 'Pegar um pão da esteira', action: () => G.events.emit('paoRaizinha', L.toWorld(-4.2, 1.2, 1.4)) });
    let lastSlam = 0;
    return {
      update(t, dt, near) {
        const ph = (t % 3) / 3;
        blade.position.y = ph < 0.15 ? lerp(2.4, 1.6, ph / 0.15) : ph < 0.3 ? 1.6 : lerp(1.6, 2.4, (ph - 0.3) / 0.7);
        if (near && ph >= 0.15 && lastSlam < 0.15) {
          const w = L.toWorld(5.2, 1.4, 1.6);
          G.particles.emit('migalhas', w.x, w.y, w.z);
        }
        lastSlam = ph;
        breads.forEach((p, i) => { p.position.x = -5.9 + ((t * 0.7 + i * 0.85) % 3.4); });
      },
    };
  },

  // C0.2 — turbina girando, dígitos que somem no ar
  turbina(L) {
    L.st.add(cyl(0.32, 0.6, 7, '#e9e4d8', 0, 3.5, 0, 8));
    L.st.add(box(0.8, 0.8, 1.6, '#cfc8b6', 0, 7.2, 0));
    L.st.add(box(2.4, 1.6, 2.0, '#d9c9a8', 2.6, 0.8, -1.2));
    L.st.add(roof4(1.9, 1.0, '#d9803a', 2.6, 2.1, -1.2));
    const rotor = new THREE.Group(); rotor.position.set(0, 7.2, 0.95);
    rotor.add(sph(0.35, '#f2c14e'));
    for (let k = 0; k < 3; k++) {
      const arm = new THREE.Group(); arm.rotation.z = (k / 3) * Math.PI * 2;
      arm.add(box(0.4, 3.2, 0.08, '#fff7e6', 0, 1.7, 0));
      rotor.add(arm);
    }
    L.dyn.add(rotor);
    const digits = [];
    for (let i = 0; i < 6; i++) {
      const s = textSprite(String(Math.floor(Math.random() * 10)), { color: '#5a6f8a' });
      s.scale.set(0.8, 0.8, 0.8); L.dyn.add(s); digits.push({ s, off: i / 6 });
    }
    L.collide(0, 0, 0.8); L.collide(2.6, -1.2, 1.5);
    return {
      update(t, dt) {
        rotor.rotation.z -= dt * (L.s.evolved ? 6 : 2.4);
        for (const d of digits) {
          const p = (t / 3 + d.off) % 1;
          d.s.position.set(Math.sin(p * 6 + d.off * 10) * 1.5, 7.5 + p * 4, 1.2);
          d.s.material.opacity = 1 - p;
        }
      },
      // evolução: pás douradas girando mais rápido
      evolve() { const gold = mat('#f2c14e', { emissive: '#6a4a00' }); rotor.traverse((m) => { if (m.isMesh) m.material = gold; }); },
    };
  },

  // C0.3 — galinheiro-satélite com ovos transbordando
  galinheiro(L) {
    const st = L.st;
    for (const [x, z] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) st.add(cyl(0.1, 0.1, 0.6, '#6b4423', x, 0.3, z, 5));
    st.add(box(3.2, 2.0, 2.4, '#e8d2a0', 0, 1.6, 0));
    st.add(roof4(2.4, 1.3, '#d9803a', 0, 3.25, 0));
    const ramp = box(0.8, 0.08, 1.4, '#a8764a', 0, 0.35, 1.7); ramp.rotation.x = 0.45; st.add(ramp);
    st.add(box(0.7, 0.8, 0.06, '#3a2a1a', 0, 1.2, 1.22));
    const dish = mesh(new THREE.SphereGeometry(1.0, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), '#c9cdd3', 0, 4.4, 0);
    dish.rotation.x = Math.PI + 0.6; st.add(dish);
    st.add(cyl(0.06, 0.06, 1.0, '#8a96a3', 0, 3.9, 0, 5));
    st.add(cone(0.08, 0.6, '#e8454a', 0, 4.5, 0.3));
    st.add(box(1.4, 0.5, 1.0, '#a8764a', 2.6, 0.25, 1.0));
    const eggPos = [[2.3, 0.6, 0.8], [2.7, 0.62, 1.1], [2.95, 0.6, 0.75], [2.5, 0.85, 1.0], [2.8, 0.85, 0.9], [2.65, 1.08, 0.95], [3.5, 0.15, 1.3], [3.4, 0.15, 0.4], [2.0, 0.15, 1.7]];
    for (const [x, y, z] of eggPos) { const e = sph(0.18, '#fbf6ea', x, y, z, 8, 6); e.scale.y = 1.3; st.add(e); }
    const egg = sph(0.18, '#fbf6ea', 2.6, 1.2, 1.0, 8, 6); egg.scale.y = 1.3; L.dyn.add(egg);
    L.collide(0, 0, 2.0); L.collide(2.6, 1.0, 0.9);
    return {
      update(t) {
        const p = (t % 4) / 4;
        if (p < 0.5) { const k = p / 0.5; egg.position.set(2.6 + k * 1.6, 1.2 - k * k * 1.05 + Math.abs(Math.sin(k * 9)) * 0.2 * (1 - k), 1.0 + k * 0.8); egg.rotation.z = -k * 6; }
        else egg.position.set(2.6, 1.2, 1.0);
      },
    };
  },

  // B0 — silo de grãos prestes a estourar
  silo(L) {
    const body = new THREE.Group();
    body.add(cyl(2.3, 2.3, 7, '#c9c2b0', 0, 3.5, 0, 14));
    for (const y of [1.5, 3.5, 5.5]) body.add(cyl(2.38, 2.38, 0.18, '#8a96a3', 0, y, 0, 14));
    body.add(mesh(new THREE.SphereGeometry(2.3, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#d9803a', 0, 7, 0));
    body.add(box(0.5, 0.5, 0.1, '#e8454a', 0, 4.5, 2.32));
    L.dyn.add(body);
    for (let i = 0; i < 8; i++) L.st.add(box(0.8, 0.08, 0.08, '#6b4423', 2.45, 0.6 + i * 0.8, 0.6));
    L.collide(0, 0, 2.6);
    return {
      update(t, dt, near) {
        const b = 1 + 0.04 * Math.sin(t * 3.1) + 0.02 * Math.sin(t * 11);
        body.scale.set(b, 1, b);
        body.rotation.z = Math.sin(t * 17) * 0.006;
        if (near && Math.random() < dt * 2) { const w = L.toWorld(Math.random() * 2 - 1, 3 + Math.random() * 3, 2.3); G.particles.emit('graos', w.x, w.y, w.z); }
      },
    };
  },

  // C1.1 — balança de pratos gigante; prefeitura que se parte ao meio
  balanca(L) {
    const st = L.st;
    st.add(box(2.0, 0.4, 2.0, '#8a96a3', -3.5, 0.2, 0));
    st.add(cyl(0.3, 0.45, 4.2, '#c9a24e', -3.5, 2.3, 0, 8));
    st.add(sph(0.4, '#f2c14e', -3.5, 4.5, 0));
    const beam = new THREE.Group(); beam.position.set(-3.5, 4.3, 0);
    beam.add(box(7.0, 0.25, 0.3, '#c9a24e'));
    const pans = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(sx * 3.3, 0, 0);
      for (const a of [0, 2.1, 4.2]) p.add(rod(V(0, 0, 0), V(Math.cos(a) * 0.8, -2.0, Math.sin(a) * 0.8), 0.025, '#6b6f78'));
      p.add(cyl(1.0, 0.8, 0.18, '#d9b34a', 0, -2.05, 0, 12));
      p.add(sx < 0 ? sph(0.45, '#e8554a', 0, -1.6, 0) : box(0.7, 0.7, 0.7, '#5f8fd9', 0, -1.6, 0));
      beam.add(p); pans.push(p);
    }
    L.dyn.add(beam);
    // prefeitura: duas metades que deslizam
    const halves = [];
    for (const sx of [-1, 1]) {
      const h = new THREE.Group(); h.position.set(4 + sx * 1.1, 0, -1);
      h.add(box(2.2, 3.2, 3.4, '#f3e3c3', 0, 1.6, 0));
      h.add(box(2.3, 0.4, 3.6, '#8b5a2b', 0, 3.4, 0));
      h.add(box(0.3, 2.6, 0.3, '#fff7e6', sx * 0.6, 1.3, 1.8));
      const half = mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.9, 10, 1, false, sx < 0 ? Math.PI : 0, Math.PI), '#e8654a', -sx * 1.1, 3.6, 0);
      half.rotation.y = Math.PI / 2;
      h.add(half);
      L.dyn.add(h); halves.push(h);
    }
    const colL = L.collideDyn(4 - 1.1, -1, 1.7), colR = L.collideDyn(4 + 1.1, -1, 1.7);
    L.collide(-3.5, 0, 1.1);
    let open = 0;
    return {
      update(t, dt) {
        const tilt = Math.sin(t * 0.8) * 0.18;
        beam.rotation.z = tilt;
        for (const p of pans) p.rotation.z = -tilt;
        const heroNear = L.distToHero(4, -1) < 7;
        const want = L.s.evolved ? (Math.sin(t * 0.8) > 0 ? 1 : 0) : heroNear ? 1 : 0;
        open += clamp(want - open, -dt, dt); // 2 unidades em 1 s
        const e = ease(open);
        halves[0].position.x = 4 - 1.1 - e * 2; halves[1].position.x = 4 + 1.1 + e * 2;
        colL.set(halves[0].position.x, -1); colR.set(halves[1].position.x, -1);
      },
    };
  },

  // C1.2 — pontes de corda esticada entre torres
  pontesCorda(L) {
    const towers = [[-5.5, 0, 6], [0, -3, 7.2], [5.5, 0, 5.4]];
    for (const [x, z, h] of towers) {
      L.st.add(box(1.4, h, 1.4, '#8b5a2b', x, h / 2, z));
      L.st.add(box(2.2, 0.25, 2.2, '#a8764a', x, h, z));
      L.st.add(roof4(1.6, 1.0, '#8b5a2b', x, h + 1.4, z));
      for (const [cx, cz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) L.st.add(cyl(0.06, 0.06, 1.2, '#6b4423', x + cx, h + 0.6, z + cz, 4));
      L.collide(x, z, 1.0);
    }
    const sway = new THREE.Group(); L.dyn.add(sway);
    for (let i = 0; i < 2; i++) {
      const [x1, z1, h1] = towers[i], [x2, z2, h2] = towers[i + 1];
      const n = 8;
      for (let k = 0; k < n; k++) {
        const t1 = k / n, t2 = (k + 1) / n;
        const p1 = V(lerp(x1, x2, t1), lerp(h1, h2, t1) - Math.sin(t1 * Math.PI) * 1.2, lerp(z1, z2, t1));
        const p2 = V(lerp(x1, x2, t2), lerp(h1, h2, t2) - Math.sin(t2 * Math.PI) * 1.2, lerp(z1, z2, t2));
        sway.add(rod(p1.clone().add(V(0, 0.9, 0.5)), p2.clone().add(V(0, 0.9, 0.5)), 0.035, '#c9a24e'));
        sway.add(rod(p1.clone().add(V(0, 0.9, -0.5)), p2.clone().add(V(0, 0.9, -0.5)), 0.035, '#c9a24e'));
        const pl = box(0.5, 0.08, 1.0, '#a8764a', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
        sway.add(pl);
      }
    }
    // a corda (corda da falsa posição): reta esticada da primeira à última torre
    L.st.add(rod(V(-5.5, 6.6, 0), V(5.5, 6.0, 0), 0.05, '#e8454a'));
    return { update(t) { sway.rotation.x = Math.sin(t * 1.2) * 0.015; } };
  },

  // C1.3 — carrossel que gira e sempre volta ao mesmo ponto
  carrossel(L) {
    L.st.add(cyl(3.3, 3.5, 0.4, '#e8d2a0', 0, 0.2, 0, 16));
    L.st.add(cyl(0.22, 0.22, 3.6, '#f2c14e', 0, 2.0, 0, 8));
    const spin = new THREE.Group(); L.dyn.add(spin);
    spin.add(cone(3.7, 1.4, '#e8554a', 0, 4.4, 0, 12));
    spin.add(cyl(3.7, 3.7, 0.3, '#fff7e6', 0, 3.6, 0, 12));
    const horses = [];
    const cols = ['#ffffff', '#f2c14e', '#8e5bd1', '#7ab8f5'];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const h = new THREE.Group(); h.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); h.rotation.y = -a;
      h.add(cyl(0.05, 0.05, 3.3, '#c9a24e', 0, 2.0, 0, 4));
      const horse = new THREE.Group();
      horse.add(box(0.35, 0.45, 1.0, cols[k], 0, 0, 0));
      horse.add(box(0.28, 0.5, 0.3, cols[k], 0, 0.35, 0.5));
      horse.add(box(0.06, 0.3, 0.4, '#3a2a1a', 0, 0.6, 0.35));
      for (const [lx, lz] of [[-0.12, -0.35], [0.12, -0.35], [-0.12, 0.35], [0.12, 0.35]]) horse.add(box(0.08, 0.45, 0.08, cols[k], lx, -0.4, lz));
      horse.position.y = 1.4; h.add(horse); horses.push(horse); spin.add(h);
    }
    L.collide(0, 0, 3.5);
    return {
      update(t) {
        spin.rotation.y = L.s.evolved ? t * 1.2 + 1.6 * Math.sin(t * 0.9) * 0.3 : 1.6 * Math.sin(t * 0.9);
        horses.forEach((h, i) => (h.position.y = 1.4 + Math.sin(t * 3 + i * 1.6) * (L.s.evolved ? 0.45 : 0.25)));
      },
      // evolução: o carrossel passa a dar voltas inteiras (e ainda balança no ponto fixo)
      evolve() {},
    };
  },

  // C1.4 — macieira (a maçã sempre cai na cabeça) e pista de skate com rampas tangentes
  macieira(L) {
    L.st.add(cyl(0.45, 0.65, 3.2, '#6b4423', 0, 1.6, 0, 7));
    const crown = mesh(new THREE.IcosahedronGeometry(2.6, 0), '#4f9a3e', 0, 4.4, 0); L.st.add(crown);
    L.st.add(mesh(new THREE.IcosahedronGeometry(1.8, 0), '#5fae4a', 1.4, 5.0, 0.6));
    const apples = new THREE.Group(); L.dyn.add(apples);
    const appleMat = mat('#e8454a', { emissive: '#000000' });
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, y = 3.4 + (i % 3) * 0.9;
      const m = new THREE.Mesh(G_SPH(0.2, 8, 6), appleMat);
      m.position.set(Math.cos(a) * 2.3, y, Math.sin(a) * 2.3);
      apples.add(m);
    }
    // rampas (perfil curvo extrudado)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(2.6, 0); shape.lineTo(2.6, 2.0); shape.quadraticCurveTo(2.6, 0.1, 0, 0);
    const rampGeo = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false, curveSegments: 6 });
    for (const sx of [-1, 1]) {
      const r = mesh(rampGeo, '#c9cdd3', sx * 6.5, 0, 2.5);
      r.rotation.y = sx < 0 ? Math.PI : 0;
      if (sx < 0) r.position.z = 5.5;
      L.st.add(r);
      L.collide(sx * 7.6, 4, 1.6);
    }
    L.collide(0, 0, 0.8);
    const falling = new THREE.Mesh(G_SPH(0.22, 8, 6), appleMat); falling.visible = false; L.dyn.add(falling);
    let cool = 0, fall = null, under = false;
    return {
      update(t, dt) {
        cool -= dt;
        const d = L.distToHero(0, 0);
        const inside = d < 2.3;
        if (inside && !under && cool <= 0 && !fall && G.hero && !G.hero.busy) {
          const hp = G.hero.pos;
          fall = { t: 0, x: hp.x, z: hp.z, y0: hp.y + 4.5 };
          falling.visible = true;
        }
        under = inside;
        if (fall) {
          fall.t += dt;
          const yHead = G.hero.pos.y + 2.25;
          const y = fall.y0 - 0.5 * 9.8 * fall.t * fall.t;
          const w = L.toLocal(G.hero.pos.x, 0, G.hero.pos.z);
          falling.position.set(w.x, Math.max(y, yHead) - L.groundY, w.z);
          if (y <= yHead) { G.events.emit('macaNaCabeca', { s: L.s }); fall = null; falling.visible = false; cool = 6; }
        }
      },
      evolve() { appleMat.color.set('#f2c14e'); appleMat.emissive.set('#5a4000'); },
    };
  },

  // C1.5 — tirolesa gigante ligando duas torres
  tirolesa(L) {
    const A = V(-7, 6, 0), B = V(8, 3.2, -2);
    for (const [p, h] of [[A, 6], [B, 3.2]]) {
      for (const [cx, cz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) L.st.add(cyl(0.12, 0.14, h, '#8b5a2b', p.x + cx, h / 2, p.z + cz, 5));
      L.st.add(box(2.2, 0.25, 2.2, '#a8764a', p.x, h, p.z));
      L.st.add(cyl(0.1, 0.1, 2.2, '#6b4423', p.x, h + 1.1, p.z, 5));
      L.collide(p.x, p.z, 1.3);
    }
    for (let i = 0; i < 9; i++) L.st.add(box(1.0, 0.08, 0.08, '#6b4423', A.x, 0.5 + i * 0.62, A.z + 1.15));
    const top1 = A.clone().add(V(0, 2.1, 0)), top2 = B.clone().add(V(0, 2.1, 0));
    L.st.add(rod(top1, top2, 0.05, '#3a2a1a'));
    const second = rod(top1.clone().add(V(0, 0, 1.2)), top2.clone().add(V(0, 0, 1.2)), 0.05, '#f2c14e'); second.visible = false; L.dyn.add(second);
    const handle = new THREE.Group(); handle.add(box(0.6, 0.08, 0.08, '#e8554a', 0, -0.4, 0)); handle.add(rod(V(0, 0, 0), V(0, -0.4, 0), 0.03, '#3a2a1a'));
    handle.position.copy(top1); L.dyn.add(handle);
    L.interact({
      lx: A.x + 1.6, lz: A.z + 1.4, r: 2.6, label: 'Descer de tirolesa',
      action: () => G.events.emit('tirolesa', { from: L.toWorld(top1.x, top1.y - 2.3, top1.z), to: L.toWorld(top2.x, top2.y - 2.3, top2.z), handle, a: top1, b: top2 }),
    });
    return { evolve() { second.visible = true; } };
  },

  // B1 — pântano com 3 cabeças de pedra
  hidra(L) {
    L.st.add(cyl(5.2, 5.2, 0.12, '#3f5f3a', 0, 0.06, 0, 18));
    for (let i = 0; i < 8; i++) { const a = i * 0.8; L.st.add(cyl(0.5, 0.6, 0.1, '#5f8f3a', Math.cos(a) * 3.6, 0.13, Math.sin(a) * 3.6, 7)); }
    const necks = [];
    const eyeMat = mat('#e8454a', { emissive: '#7a0000' });
    for (let k = 0; k < 3; k++) {
      const n = new THREE.Group(); n.position.set((k - 1) * 2.6, 0, -0.5 + (k === 1 ? -1 : 0));
      const segs = [];
      for (let i = 0; i < 5; i++) { const s = sph(0.62 - i * 0.05, '#7a7f6a', 0, 0, 0, 8, 6); n.add(s); segs.push(s); }
      const head = new THREE.Group();
      head.add(box(1.2, 0.8, 1.5, '#8a8f78', 0, 0, 0.2));
      head.add(box(1.0, 0.25, 1.1, '#6a6f5a', 0, -0.45, 0.35));
      for (const ex of [-0.35, 0.35]) { const e = new THREE.Mesh(G_SPH(0.13, 6, 4), eyeMat); e.position.set(ex, 0.25, 0.95); head.add(e); }
      n.add(head);
      L.dyn.add(n); necks.push({ segs, head, ph: k * 2.1 });
    }
    L.collide(0, 0, 4.6);
    return {
      update(t) {
        for (const nk of necks) {
          nk.segs.forEach((s, i) => s.position.set(Math.sin(t + nk.ph + i * 0.5) * 0.25 * i, 0.6 + i * 1.0, Math.sin(t * 0.7 + nk.ph) * 0.2 * i));
          const top = nk.segs[4].position;
          nk.head.position.set(top.x, top.y + 0.6, top.z + 0.3);
          nk.head.rotation.x = Math.sin(t * 1.3 + nk.ph) * 0.25;
        }
      },
    };
  },

  // C2.1 — estátua de polvo com 8 braços segurando painéis
  polvo(L) {
    L.st.add(box(3.2, 1.0, 3.2, '#a7a7a0', 0, 0.5, 0));
    const head = sph(1.4, '#9a8fb5', 0, 3.4, 0, 12, 10); head.scale.y = 1.2; L.st.add(head);
    const eyeMat = mat('#2b2440', { emissive: '#000000' });
    for (let i = 0; i < 8; i++) {
      const a = -0.9 + (i / 7) * 1.8;
      const e = new THREE.Mesh(G_SPH(0.13, 6, 4), eyeMat);
      e.position.set(Math.sin(a) * 1.3, 3.7 + Math.cos(i * 1.7) * 0.15, Math.cos(a) * 1.15);
      L.dyn.add(e);
    }
    const arms = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const g = new THREE.Group(); g.position.set(Math.cos(a) * 1.0, 2.4, Math.sin(a) * 1.0); g.rotation.y = -a;
      const inner = new THREE.Group(); inner.rotation.z = -0.9;
      inner.add(cyl(0.14, 0.32, 3.0, '#9a8fb5', 0, 1.5, 0, 7));
      inner.add(box(1.1, 0.75, 0.08, '#e9e2cf', 0, 3.1, 0.15));
      g.add(inner);
      L.dyn.add(g);
      arms.push({ g, a, diag: i === 1 || i === 5, s: 1, target: 1 });
    }
    L.collide(0, 0, 2.3);
    return {
      update(t, dt) {
        for (const arm of arms) {
          arm.s += (arm.target - arm.s) * Math.min(1, dt * 3);
          arm.g.scale.setScalar(Math.max(0.12, arm.s));
          arm.g.rotation.x = Math.sin(t * 0.8 + arm.a * 2) * 0.05;
        }
      },
      onWin(count) {
        const shrinkable = arms.filter((a) => !a.diag);
        const n = Math.min(shrinkable.length, count * 2);
        shrinkable.forEach((a, i) => (a.target = i < n ? 0 : 1));
      },
      evolve() { eyeMat.color.set('#b7ff3c'); eyeMat.emissive.set('#5a8a00'); },
    };
  },

  // C2.2 — plataforma giratória que troca casas de lugar
  plataforma(L) {
    L.st.add(cyl(4.2, 4.4, 0.35, '#6b6f78', 0, 0.17, 0, 18));
    const disc = new THREE.Group(); L.dyn.add(disc);
    disc.add(cyl(4.0, 4.0, 0.2, '#8a96a3', 0, 0.45, 0, 18));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; disc.add(box(0.3, 0.25, 0.3, '#f2c14e', Math.cos(a) * 3.85, 0.55, Math.sin(a) * 3.85)); }
    const cols = [['#e07a3f', '#f3e3c3'], ['#5f8fd9', '#e9e4d8']];
    for (let i = 0; i < 2; i++) {
      const hx = i ? 2.0 : -2.0;
      disc.add(box(1.8, 1.6, 1.8, cols[i][1], hx, 1.35, 0));
      disc.add(roof4(1.45, 0.9, cols[i][0], hx, 2.6, 0));
    }
    L.collide(0, 0, 4.4);
    return {
      update(t) {
        const cyc = t % 6;
        const k = cyc < 4 ? 0 : ease((cyc - 4) / 2);
        disc.rotation.y = (Math.floor(t / 6) + k) * Math.PI;
      },
    };
  },

  // C2.3 — duas torres-escada, uma triangular de cada lado
  torresLU(L) {
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r <= c; r++) L.st.add(box(1.0, 1.0, 2.0, r % 2 ? '#5f8fd9' : '#4a78c2', -6 + c, 0.5 + r, 0));
      for (let r = 0; r < 4 - c; r++) L.st.add(box(1.0, 1.0, 2.0, r % 2 ? '#d96a5f' : '#c2554a', 3 + c, 0.5 + r, 0));
    }
    L.st.add(box(0.9, 0.5, 0.06, '#fff7e6', -4.5, 3.6, 1.04));
    L.st.add(box(0.9, 0.5, 0.06, '#fff7e6', 4.5, 3.6, 1.04));
    L.collide(-4.5, 0, 2.1); L.collide(4.5, 0, 2.1);
    return {};
  },

  // C2.4 — relógio central: todo mundo atualiza junto
  relogio(L) {
    L.st.add(box(2.6, 7.2, 2.6, '#d9c9a8', 0, 3.6, 0));
    L.st.add(roof4(2.2, 2.0, '#8a96a3', 0, 8.2, 0));
    L.st.add(cone(0.5, 0.7, '#c9a24e', 0, 9.5, 0));
    const face = cyl(1.0, 1.0, 0.1, '#fff7e6', 0, 5.8, 1.32, 16); face.rotation.x = Math.PI / 2; L.st.add(face);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; L.st.add(box(0.07, 0.2, 0.05, '#3a2a1a', Math.sin(a) * 0.82, 5.8 + Math.cos(a) * 0.82, 1.39)); }
    L.st.add(box(0.8, 1.6, 0.1, '#6b4423', 0, 0.8, 1.32));
    const hMin = new THREE.Group(); hMin.position.set(0, 5.8, 1.42); hMin.add(box(0.08, 0.8, 0.04, '#3a2a1a', 0, 0.35, 0));
    const hHour = new THREE.Group(); hHour.position.set(0, 5.8, 1.45); hHour.add(box(0.12, 0.55, 0.04, '#e8454a', 0, 0.24, 0));
    L.dyn.add(hMin, hHour);
    L.collide(0, 0, 1.9);
    let lastChime = 0;
    return {
      update(t, dt, near) {
        // ponteiro anda em "tiques" a cada segundo (todos atualizam juntos)
        hMin.rotation.z = -Math.floor(t) * 0.25;
        hHour.rotation.z = -Math.floor(t / 5) * 0.12;
        if (L.s.evolved && near && t - lastChime > 10) { lastChime = t; G.audio?.sfx('badalada'); G.ui?.caption('🔔 Badaladas do relógio'); }
      },
    };
  },

  // C2.5 — telefone sem fio em cascata, cabos por toda parte
  telefone(L) {
    const poles = [];
    for (let i = 0; i < 5; i++) {
      const x = -8 + i * 4, z = Math.sin(i * 1.2) * 1.5;
      L.st.add(cyl(0.16, 0.2, 5, '#8b5a2b', x, 2.5, z, 6));
      L.st.add(box(1.6, 0.14, 0.14, '#6b4423', x, 4.6, z));
      L.st.add(cyl(0.18, 0.18, 0.35, '#c9cdd3', x + 0.5, 3.6, z + 0.25, 8));
      poles.push(V(x, 4.6, z));
      L.collide(x, z, 0.35);
    }
    const pts = [];
    for (let i = 0; i < 4; i++) {
      for (const dx of [-0.6, 0.6]) {
        const a = poles[i].clone().add(V(dx, 0, 0)), b = poles[i + 1].clone().add(V(dx, 0, 0));
        const n = 4;
        for (let k = 0; k < n; k++) {
          const p1 = a.clone().lerp(b, k / n); p1.y -= Math.sin((k / n) * Math.PI) * 0.6;
          const p2 = a.clone().lerp(b, (k + 1) / n); p2.y -= Math.sin(((k + 1) / n) * Math.PI) * 0.6;
          L.st.add(rod(p1, p2, 0.025, '#2b2f3a', 4));
          if (dx < 0) pts.push(p1);
        }
      }
    }
    pts.push(poles[4].clone().add(V(-0.6, 0, 0)));
    const pulse = new THREE.Mesh(G_SPH(0.22, 8, 6), mat('#f2c14e', { emissive: '#a07000' }));
    L.dyn.add(pulse);
    return {
      update(t) {
        const p = ((t * (L.s.evolved ? 1.4 : 0.6)) % 1.2) / 1.2;
        const f = p * (pts.length - 1);
        const i = Math.min(pts.length - 2, Math.floor(f));
        pulse.position.copy(pts[i]).lerp(pts[i + 1], f - i);
      },
      // evolução: a fofoca corre mais rápido e o pulso fica maior
      evolve() { pulse.scale.setScalar(1.7); },
    };
  },

  // B2 — cofre gigante com disco giratório
  cofre(L) {
    L.st.add(box(7.2, 5.6, 2.6, '#8a96a3', 0, 2.8, 0));
    L.st.add(box(7.6, 0.4, 3.0, '#6b6f78', 0, 0.2, 0));
    L.st.add(box(7.6, 0.4, 3.0, '#6b6f78', 0, 5.6, 0));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; L.st.add(sph(0.14, '#c9cdd3', Math.cos(a) * 2.1, 2.8 + Math.sin(a) * 2.1, 1.34, 6, 4)); }
    const dial = new THREE.Group(); dial.position.set(0, 2.8, 1.35);
    const disc = cyl(1.4, 1.4, 0.25, '#c9cdd3', 0, 0, 0, 20); disc.rotation.x = Math.PI / 2; dial.add(disc);
    for (let k = 0; k < 4; k++) { const sp = box(0.18, 2.6, 0.18, '#e07a3f', 0, 0, 0.2); sp.rotation.z = (k / 4) * Math.PI; dial.add(sp); }
    dial.add(sph(0.35, '#f2c14e', 0, 0, 0.3));
    L.dyn.add(dial);
    L.collide(-2.6, 0, 1.6); L.collide(0, 0, 1.6); L.collide(2.6, 0, 1.6);
    return { update(t) { dial.rotation.z = Math.sin(t * 0.7) * 2.5 + Math.sin(t * 2.3) * 0.3; } };
  },

  // C3.1 — teia gigante ligando pontos-nó
  teia(L) {
    const nodes = [];
    const nodeMat = mat('#f2c14e', { emissive: '#4a3600' });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const h = 4.2 + Math.sin(i * 2.3) * 0.8;
      const x = Math.cos(a) * 4.5, z = Math.sin(a) * 3.2;
      L.st.add(cyl(0.12, 0.16, h, '#6b6f78', x, h / 2, z, 5));
      const n = new THREE.Mesh(G_SPH(0.32, 8, 6), nodeMat); n.position.set(x, h, z); L.dyn.add(n);
      nodes.push(n);
      L.collide(x, z, 0.3);
    }
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) L.st.add(rod(nodes[i].position, nodes[j].position, 0.02, '#e9e4d8', 3));
    const hub = V(0, 4.6, 0);
    for (const n of nodes) L.st.add(rod(n.position, hub, 0.03, '#ffffff', 3));
    return {
      update(t) { nodes.forEach((n, i) => n.scale.setScalar(1 + Math.sin(t * 2 + i) * (L.s.evolved ? 0.3 : 0.15))); },
      // evolução: os nós da teia acendem
      evolve() { nodeMat.emissive.set('#c89a00'); },
    };
  },

  // C3.2 — montanha-russa de curva suave sem quinas
  montanhaRussa(L) {
    const raw = [];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      raw.push(V(Math.cos(a) * 7.5, 2.6 + Math.sin(a * 2) * 1.6 + (k === 2 ? 2 : 0), Math.sin(a) * 5));
    }
    const curve = new THREE.CatmullRomCurve3(raw, true, 'centripetal');
    L.st.add(mesh(new THREE.TubeGeometry(curve, 120, 0.2, 6, true), '#e8554a'));
    const pts = curve.getSpacedPoints(24);
    pts.forEach((p, i) => { if (i % 2 === 0) { L.st.add(cyl(0.1, 0.12, p.y, '#f2c14e', p.x, p.y / 2, p.z, 5)); L.collide(p.x, p.z, 0.25); } });
    L.st.add(box(2.4, 0.3, 1.6, '#a8764a', raw[0].x + 1.6, 0.15, raw[0].z));
    const carts = [];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Group();
      c.add(box(0.9, 0.5, 0.7, i === 0 ? '#f2c14e' : '#3cc0a0', 0, 0.3, 0));
      c.add(box(0.95, 0.12, 0.75, '#3a2a1a', 0, 0.05, 0));
      L.dyn.add(c); carts.push(c);
    }
    const lights = [];
    const lightMat = mat('#fff7e6', { emissive: '#ffd27a' });
    for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(G_SPH(0.12, 6, 4), lightMat); l.visible = false; L.dyn.add(l); lights.push(l); }
    // §7.2: a cada 25 s os vagões dão uma volta de 8 s (curva suave, sem trancos) com gritinhos
    let u = 0, lapT = -1, wait = 6;
    const LAP = 8, EVERY = 25;
    const tmp = V(0, 0, 0);
    const api = {
      curve, carts,
      startLap() {
        if (lapT >= 0) return;
        lapT = 0; wait = EVERY;
        if (L.distToHero(0, 0) < 45) { G.audio?.sfx('gritinhos'); G.ui?.caption('🎢 Gritinhos na montanha-russa'); }
      },
      update(t, dt) {
        if (lapT >= 0) {
          lapT += dt;
          u = ease(Math.min(1, lapT / LAP)) % 1;
          if (lapT >= LAP) { lapT = -1; u = 0; }
        } else if ((wait -= dt) <= 0) api.startLap();
        carts.forEach((c, i) => {
          const uu = (u - i * 0.035 + 1) % 1;
          curve.getPointAt(uu, c.position);
          curve.getTangentAt(uu, tmp);
          c.rotation.y = Math.atan2(tmp.x, tmp.z);
          c.rotation.x = -Math.asin(clamp(tmp.y, -1, 1));
          c.position.y += 0.2;
        });
        if (L.s.evolved) lights.forEach((l, i) => { l.visible = true; curve.getPointAt((t * 0.08 + i / lights.length) % 1, l.position); l.position.y += 0.25; });
        api.u = u;
      },
    };
    L.interact({
      lx: raw[0].x + 1.6, lz: raw[0].z + 1.4, r: 2.6, label: 'Dar uma volta na montanha-russa',
      action: () => G.events.emit('montanhaRussa', { L, api }),
    });
    return api;
  },

  // C3.3 — rede de dormir presa por molas a uma nuvem de pontos (mínimos quadrados)
  rede(L) {
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    const noise = [0.5, -0.4, 0.6, -0.3, 0.2, 0.55, -0.5];
    const a = 3.6, b = 0.18;
    const pts = xs.map((x, i) => V(x, a + b * x + noise[i] + 0.9, 0));
    const cloud = new THREE.Group(); L.dyn.add(cloud);
    for (const p of pts) { cloud.add(sph(0.18, '#7ab8f5', p.x, p.y, 0, 8, 6)); }
    for (let i = 0; i < 6; i++) cloud.add(sph(0.5 + (i % 2) * 0.2, '#ffffff', -3 + i * 1.2, 5.6 + (i % 2) * 0.3, -0.3, 8, 6));
    const ham = new THREE.Group(); L.dyn.add(ham);
    const left = V(-3.4, a + b * -3.4, 0), right = V(3.4, a + b * 3.4, 0);
    ham.add(rod(left, right, 0.32, '#e8554a', 8));
    ham.add(rod(left.clone().add(V(0, 0.05, 0.25)), right.clone().add(V(0, 0.05, 0.25)), 0.08, '#f2c14e'));
    pts.forEach((p) => {
      const base = V(p.x, a + b * p.x, 0);
      const n = 6;
      for (let k = 0; k < n; k++) {
        const y1 = lerp(base.y, p.y, k / n), y2 = lerp(base.y, p.y, (k + 1) / n);
        ham.add(rod(V(p.x + (k % 2 ? 0.12 : -0.12), y1, 0), V(p.x + (k % 2 ? -0.12 : 0.12), y2, 0), 0.025, '#8a96a3', 3));
      }
    });
    for (const p of [left, right]) { L.st.add(cyl(0.14, 0.18, p.y, '#6b4423', p.x, p.y / 2, -0.2, 5)); L.collide(p.x, -0.2, 0.3); }
    return { update(t) { const s = Math.sin(t * 0.6) * 0.06; ham.position.y = s; cloud.position.y = s * 0.5; } };
  },

  // B3 — colosso de pedra com bordas onduladas (fenômeno de Runge)
  colosso(L) {
    const body = new THREE.Group(); L.dyn.add(body);
    body.add(box(1.0, 2.6, 1.1, '#8a8478', -0.8, 1.3, 0));
    body.add(box(1.0, 2.6, 1.1, '#8a8478', 0.8, 1.3, 0));
    body.add(box(3.4, 3.0, 1.8, '#9a9488', 0, 4.1, 0));
    body.add(box(1.6, 1.4, 1.4, '#a8a296', 0, 6.4, 0));
    const eyeMat = mat('#b7ff3c', { emissive: '#4a7a00' });
    for (const ex of [-0.4, 0.4]) { const e = new THREE.Mesh(G_BOX(0.3, 0.18, 0.06), eyeMat); e.position.set(ex, 6.5, 0.72); body.add(e); }
    for (const sx of [-1, 1]) { const arm = box(0.9, 3.0, 0.9, '#8a8478', sx * 2.3, 3.8, 0); arm.rotation.z = sx * 0.15; body.add(arm); }
    const waves = [];
    for (let i = 0; i < 13; i++) {
      const x = -3.0 + i * 0.5;
      const s = sph(0.26, '#b5ad9f', x, 5.7, 0.6, 6, 4); body.add(s); waves.push(s);
    }
    L.collide(0, 0, 2.4);
    return {
      update(t) {
        body.position.y = Math.sin(t * 0.9) * 0.05;
        waves.forEach((s, i) => {
          const x = -1 + (i / 12) * 2;
          // oscila mais nas pontas, como um polinômio de grau alto
          s.position.y = 5.7 + Math.sin(t * 2 + i) * 0.1 * (1 + 6 * Math.pow(Math.abs(x), 6));
        });
      },
    };
  },

  // C4.1 — barragem feita de trapézios empilhados
  barragem(L) {
    L.st.add(cyl(4.0, 4.0, 0.08, '#4fb3d9', 0, 0.05, -3.4, 16));
    const shape = new THREE.Shape();
    shape.moveTo(-0.85, 0); shape.lineTo(0.85, 0); shape.lineTo(0.55, 0.85); shape.lineTo(-0.55, 0.85); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false });
    for (let row = 0; row < 3; row++) {
      const n = 6 - row;
      for (let i = 0; i < n; i++) {
        const m = mesh(geo, (i + row) % 2 ? '#8b5a2b' : '#a8764a', (i - (n - 1) / 2) * 1.55, row * 0.85, -0.6);
        L.st.add(m);
      }
    }
    for (let i = -2; i <= 2; i++) L.collide(i * 1.6, 0, 1.0);
    L.collide(0, -3.4, 3.8);
    const falls = new THREE.Group(); falls.visible = false; L.dyn.add(falls);
    const wm = new THREE.MeshLambertMaterial({ color: '#7fd3f0', transparent: true, opacity: 0.8 });
    for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(G_BOX(1.2, 2.4, 0.1), wm); w.position.set((i - 1) * 1.6, 1.2, 0.75); falls.add(w); }
    return {
      update(t) { if (falls.visible) falls.children.forEach((w, i) => { w.scale.y = 0.9 + Math.sin(t * 8 + i) * 0.1; }); },
      evolve() { falls.visible = true; },
    };
  },

  // C4.2 — ponte de arcos parabólicos sobre a lagoa
  arcos(L) {
    L.st.add(cyl(4.8, 4.8, 0.08, '#4fb3d9', 0, 0.05, 0, 18));
    for (let i = 0; i < 6; i++) { const a = i * 1.05; L.st.add(cyl(0.45, 0.45, 0.05, '#5cb85c', Math.cos(a) * 3.2, 0.11, Math.sin(a) * 2.6, 7)); }
    for (const z of [-0.7, 0, 0.7]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const x = -5 + (k / 16) * 10; pts.push(V(x, 2.4 * (1 - (x / 5) ** 2), z)); }
      L.st.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.14, 5), z === 0 ? '#f2c14e' : '#e9e4d8'));
    }
    for (let k = 0; k <= 10; k++) { const x = -4.5 + k * 0.9; L.st.add(box(0.8, 0.1, 1.8, '#a8764a', x, 2.4 * (1 - (x / 5) ** 2) + 0.15, 0)); }
    L.collide(0, 0, 4.5);
    return {};
  },

  // C4.3 — três cascatas em degraus
  cascatas(L) {
    L.st.add(box(4.0, 3.2, 2.4, '#8a8478', 0, 1.6, -2.4));
    L.st.add(box(4.0, 2.1, 2.4, '#9a9488', 0, 1.05, -0.2));
    L.st.add(box(4.0, 1.0, 2.4, '#a8a296', 0, 0.5, 2.0));
    L.st.add(cyl(2.6, 2.6, 0.08, '#4fb3d9', 0, 0.05, 4.4, 14));
    const wm = new THREE.MeshLambertMaterial({ color: '#7fd3f0', transparent: true, opacity: 0.85 });
    const sheets = [];
    for (const [y, z, h] of [[2.65, -1.15, 1.1], [1.55, 1.05, 1.1], [0.5, 3.25, 1.0]]) {
      const w = new THREE.Mesh(G_BOX(3.0, h, 0.12), wm); w.position.set(0, y, z); L.dyn.add(w); sheets.push(w);
    }
    L.collide(0, -1, 2.6); L.collide(0, 2, 2.2);
    return { update(t) { sheets.forEach((w, i) => { w.scale.x = 0.95 + Math.sin(t * 9 + i) * 0.05; }); } };
  },

  // C4.4 — porto com barquinhos que andam em passos retos
  porto(L) {
    L.st.add(cyl(5.2, 5.2, 0.08, '#4fb3d9', 0, 0.05, 0, 20));
    L.st.add(box(1.4, 0.3, 4.5, '#a8764a', 0, 0.35, 3.4));
    for (const z of [1.6, 3.4, 5.2]) for (const x of [-0.6, 0.6]) L.st.add(cyl(0.1, 0.1, 0.8, '#6b4423', x, 0.2, z, 4));
    const boats = [];
    const cols = ['#e8554a', '#f2c14e', '#5f8fd9'];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Group();
      b.add(box(1.1, 0.35, 0.55, cols[i], 0, 0.2, 0));
      b.add(cyl(0.03, 0.03, 0.9, '#6b4423', 0, 0.75, 0, 3));
      b.add(box(0.03, 0.5, 0.4, '#fff7e6', 0.05, 0.85, 0));
      L.dyn.add(b); boats.push({ b, ph: i / 3 });
    }
    L.collide(0, 0, 5.0);
    const square = [[-2.6, -2.6], [2.6, -2.6], [2.6, 1.2], [-2.6, 1.2]];
    return {
      update(t) {
        for (const bo of boats) {
          if (L.s.evolved) {
            const a = t * 0.5 + bo.ph * Math.PI * 2;
            bo.b.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 2.6 - 0.8);
            bo.b.rotation.y = -a;
            continue;
          }
          // passos retos de Euler: anda 1 passo, para, anda outro
          const T = (((t * 0.5 + bo.ph * 8) % 8) + 8) % 8;
          const seg = Math.floor(T / 2), local = T % 2;
          const k = Math.min(1, local / 1.4);
          const a = square[seg], b = square[(seg + 1) % 4];
          const kk = Math.floor(k * 4) / 4 + ease((k * 4) % 1) / 4;
          bo.b.position.set(lerp(a[0], b[0], Math.min(1, kk)), 0, lerp(a[1], b[1], Math.min(1, kk)));
          bo.b.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2;
        }
      },
    };
  },

  // C4.5 — lancha de 4 motores, 4 faróis em sequência
  lancha(L) {
    L.st.add(box(4.6, 0.3, 1.8, '#6b6f78', 0, 0.4, 0));
    L.st.add(box(4.2, 0.9, 1.6, '#f4ead8', 0, 1.0, 0));
    const bow = cone(0.8, 1.4, '#f4ead8', 2.8, 1.0, 0, 4); bow.rotation.set(Math.PI / 4, 0, -Math.PI / 2); L.st.add(bow);
    L.st.add(box(4.25, 0.18, 1.65, '#e8554a', 0, 1.15, 0));
    L.st.add(box(1.2, 0.7, 1.2, '#7ab8f5', 0.4, 1.8, 0));
    for (let i = 0; i < 4; i++) { const eng = cyl(0.18, 0.18, 0.7, '#4a4f57', -2.3, 0.9, -0.6 + i * 0.4, 8); eng.rotation.z = Math.PI / 2; L.st.add(eng); }
    L.collide(0, 0, 2.4);
    const lamps = [];
    for (let i = 0; i < 4; i++) {
      const x = -4.5 + i * 3, z = -3.6;
      for (let b = 0; b < 4; b++) L.st.add(cyl(0.42 - b * 0.04, 0.46 - b * 0.04, 0.6, b % 2 ? '#d94f4f' : '#fff7e6', x, 0.3 + b * 0.6, z, 10));
      L.st.add(cone(0.4, 0.5, '#d94f4f', x, 3.1, z, 10));
      const lm = mat('#fff7e6', { emissive: '#000000' });
      const l = new THREE.Mesh(G_SPH(0.3, 8, 6), lm); l.position.set(x, 2.7, z); L.dyn.add(l);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.35, depthWrite: false }));
      beam.rotation.z = Math.PI / 2; beam.position.set(1.5, 0, 0);
      const piv = new THREE.Group(); piv.position.set(x, 2.7, z); piv.add(beam); piv.visible = false; L.dyn.add(piv);
      lamps.push({ lm, piv });
      L.collide(x, z, 0.6);
    }
    return {
      update(t) {
        const k = Math.floor(t / 0.45) % 5;
        lamps.forEach((l, i) => {
          const on = i === k;
          l.lm.emissive.set(on ? '#ffd27a' : '#000000');
          if (L.s.evolved) { l.piv.visible = true; l.piv.rotation.y = t * 2 + i * (Math.PI / 2); }
        });
      },
    };
  },

  // B4 — farol enorme com onda congelada
  farol(L) {
    for (let b = 0; b < 6; b++) L.st.add(cyl(2.0 - b * 0.12, 2.1 - b * 0.12, 1.6, b % 2 ? '#fff7e6' : '#d94f4f', 0, 0.8 + b * 1.6, 0, 14));
    L.st.add(cyl(1.6, 1.6, 0.3, '#3a2a1a', 0, 9.75, 0, 14));
    L.st.add(cone(1.4, 1.4, '#d94f4f', 0, 11.6, 0, 14));
    const glass = mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.4, 12), mat('#fff3b0', { emissive: '#a08a20' }), 0, 10.6, 0);
    L.st.add(glass);
    const wave = mesh(new THREE.TorusGeometry(3.0, 0.9, 8, 18, Math.PI * 1.25), '#7fd3f0', 4.8, 0.6, 1.0);
    wave.rotation.set(0, Math.PI / 2, 0); L.st.add(wave);
    for (let i = 0; i < 7; i++) { const a = i * 0.55; L.st.add(sph(0.45, '#ffffff', 4.8, 0.6 + Math.sin(a) * 3.0, 1.0 + Math.cos(a) * 3.0, 6, 4)); }
    const beamPiv = new THREE.Group(); beamPiv.position.set(0, 10.6, 0);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 12, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.25, depthWrite: false }));
    beam.rotation.z = Math.PI / 2; beam.position.x = 6; beamPiv.add(beam); L.dyn.add(beamPiv);
    L.collide(0, 0, 2.3); L.collide(4.8, 1.0, 2.2);
    return { update(t) { beamPiv.rotation.y = t * 0.8; } };
  },

  // F — reator com cúpula rachada e fumaça verde-limão
  reator(L) {
    L.st.add(cyl(3.6, 4.0, 2.4, '#4a4f57', 0, 1.2, 0, 16));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      if (i === 2) continue; // rachadura: um gomo faltando
      const piece = mesh(new THREE.SphereGeometry(3.3, 6, 6, a, (Math.PI * 2) / 6 - 0.06, 0, Math.PI / 2), '#8d9199', 0, 2.4, 0);
      L.st.add(piece);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      L.st.add(rod(V(Math.cos(a) * 3.6, 1.2, Math.sin(a) * 3.6), V(Math.cos(a) * 7, 0.4, Math.sin(a) * 7), 0.3, '#6b6f78', 6));
    }
    const coreMat = mat('#b7ff3c', { emissive: '#6aa000' });
    const core = new THREE.Mesh(G_SPH(1.8, 12, 8), coreMat); core.position.y = 3.0; L.dyn.add(core);
    L.collide(0, 0, 4.2);
    return {
      update(t, dt, near) {
        core.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
        const final = L.s.finalMode;
        if (near && Math.random() < dt * (final ? 10 : 4)) {
          const w = L.toWorld((Math.random() - 0.5) * 2, 4.5, (Math.random() - 0.5) * 2);
          G.particles.emit(Math.random() < 0.5 ? 'fumacaVerde' : 'fumaca', w.x, w.y, w.z);
        }
        if (near && Math.random() < dt * (final ? 3 : 0.8)) { const w = L.toWorld(0, 3.5, 2); G.particles.emit('faiscas', w.x, w.y, w.z); }
      },
    };
  },
};
