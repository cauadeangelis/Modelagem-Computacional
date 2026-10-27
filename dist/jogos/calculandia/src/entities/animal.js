// Bichos guias (seção 8): corpo por esferas/elipsoides, olhos grandes, peça de assinatura.
// Estados: wander → notice → approach → talk → hint → celebrate | sad (+ sleep, door).
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { ANIMALS } from '../data/animals.js';
import { sph, box, cyl, cone, mesh, mat, rod, G_SPH } from '../utils/geo.js';
import { makeContactShadow } from './rig.js';
import { walkHeight } from '../world/ground.js';
import { damp, wrapAngle, clamp, lerp, ease } from '../utils/math.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function eyesOn(parent, x, y, z, r = 0.11) {
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * x, y, z);
    e.add(new THREE.Mesh(G_SPH(r, 8, 6), mat('#ffffff')));
    const p = new THREE.Mesh(G_SPH(r * 0.55, 6, 5), mat('#1a1a1a')); p.position.z = r * 0.62; e.add(p);
    const sh = new THREE.Mesh(G_SPH(r * 0.18, 4, 3), mat('#ffffff')); sh.position.set(r * 0.2, r * 0.25, r * 0.95); e.add(sh);
    parent.add(e); eyes.push(e);
  }
  return eyes;
}

// ---------- fábricas de corpo ----------
const BODIES = {
  quadrupede(d, P) {
    const c = d.cores;
    const body = sph(0.5, c.corpo, 0, 0.72, 0, 12, 8); body.scale.set(1, 0.85, 1.2); P.body.add(body);
    const belly = sph(0.4, c.barriga, 0, 0.62, 0.18, 10, 6); belly.scale.set(0.9, 0.75, 1); P.body.add(belly);
    P.head.position.set(0, 1.12, 0.52);
    P.head.add(sph(0.38, c.corpo, 0, 0, 0, 12, 8));
    const snout = sph(0.16, c.focinho || c.barriga, 0, -0.08, 0.32, 8, 6); snout.scale.set(1.2, 0.85, 1); P.head.add(snout);
    P.head.add(sph(0.05, '#2a1a12', 0, -0.03, 0.47, 5, 4));
    P.eyes = eyesOn(P.head, 0.15, 0.1, 0.3, 0.1);
    for (const sx of [-1, 1]) { const e = sph(0.12, c.corpo, sx * 0.26, 0.3, -0.02, 6, 5); P.head.add(e); P.ears.push(e); }
    for (const [x, z] of [[-0.28, 0.35], [0.28, 0.35], [-0.28, -0.35], [0.28, -0.35]]) {
      const l = new THREE.Group(); l.position.set(x, 0.45, z); l.add(cyl(0.11, 0.1, 0.45, c.corpo, 0, -0.22, 0, 6)); P.root.add(l); P.legs.push(l);
    }
    P.tail = sph(0.12, c.corpo, 0, 0.8, -0.6, 6, 5); P.body.add(P.tail);
  },
  tatu(d, P) {
    const c = d.cores;
    P.shells = [];
    for (const sx of [-1, 1]) {
      const s = new THREE.Group(); s.position.set(0, 0.55, 0);
      const half = mesh(new THREE.SphereGeometry(0.55, 10, 8, sx < 0 ? 0 : Math.PI, Math.PI, 0, Math.PI / 2), c.carapaca); half.scale.set(1, 1, 1.25); half.rotation.y = Math.PI / 2; s.add(half);
      for (const z of [-0.25, 0, 0.25]) { const b = mesh(new THREE.TorusGeometry(0.5, 0.03, 4, 12, Math.PI / 2), c.faixa, 0, 0, z); b.rotation.set(0, Math.PI / 2, sx < 0 ? 0 : Math.PI / 2); s.add(b); }
      P.body.add(s); P.shells.push({ g: s, sx });
    }
    P.body.add(sph(0.42, c.corpo, 0, 0.5, 0, 8, 6));
    P.head.position.set(0, 0.6, 0.72);
    P.head.add(sph(0.24, c.corpo, 0, 0, 0, 8, 6));
    const sn = cone(0.12, 0.35, c.corpo, 0, -0.04, 0.27); sn.rotation.x = Math.PI / 2; P.head.add(sn);
    P.eyes = eyesOn(P.head, 0.1, 0.08, 0.17, 0.08);
    for (const sx of [-1, 1]) { const e = cone(0.07, 0.22, c.corpo, sx * 0.13, 0.24, -0.04, 5); P.head.add(e); P.ears.push(e); }
    for (const [x, z] of [[-0.28, 0.3], [0.28, 0.3], [-0.28, -0.3], [0.28, -0.3]]) { const l = new THREE.Group(); l.position.set(x, 0.3, z); l.add(cyl(0.08, 0.08, 0.3, c.corpo, 0, -0.15, 0, 5)); P.root.add(l); P.legs.push(l); }
    P.tail = cone(0.08, 0.5, c.carapaca, 0, 0.4, -0.75); P.tail.rotation.x = -Math.PI / 2 - 0.4; P.body.add(P.tail);
  },
  ave(d, P) {
    const c = d.cores;
    const body = sph(0.48, c.corpo, 0, 0.75, 0, 12, 8); body.scale.set(0.95, 0.95, 1.1); P.body.add(body);
    P.body.add(sph(0.36, c.barriga, 0, 0.68, 0.22, 10, 6));
    P.head.position.set(0, 1.28, 0.25);
    P.head.add(sph(0.3, c.corpo, 0, 0, 0, 10, 8));
    const beak = cone(0.1, 0.26, c.bico, 0, -0.04, 0.32); beak.rotation.x = Math.PI / 2; P.head.add(beak);
    P.eyes = eyesOn(P.head, 0.13, 0.08, 0.22, 0.09);
    if (d.extras.includes('crista')) for (let i = 0; i < 3; i++) P.head.add(sph(0.08, c.crista, 0, 0.3 + (i === 1 ? 0.04 : 0), -0.1 + i * 0.1, 5, 4));
    else P.head.add(sph(0.12, c.crista, 0, 0.18, -0.12, 5, 4));
    for (const sx of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sx * 0.42, 0.85, 0);
      const wing = sph(0.3, c.corpo, sx * 0.08, -0.05, 0, 8, 5); wing.scale.set(0.35, 0.8, 1.1); w.add(wing);
      if (d.extras.includes('asasAbertas')) { const big = box(1.2, 0.08, 0.6, c.corpo, sx * 0.6, 0.05, 0); w.add(big); for (let k = 0; k < 3; k++) w.add(box(0.25, 0.05, 0.5, c.crista, sx * (0.9 + k * 0.12), 0.04, -0.15 + k * 0.05)); }
      P.body.add(w); P.wings.push(w);
    }
    for (const sx of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * 0.18, 0.35, 0.05); l.add(cyl(0.035, 0.035, 0.35, c.bico, 0, -0.17, 0, 4)); l.add(box(0.16, 0.03, 0.2, c.bico, 0, -0.35, 0.05)); P.root.add(l); P.legs.push(l); }
    P.tail = cone(0.2, 0.4, c.corpo, 0, 0.9, -0.55); P.tail.rotation.x = -2.3; P.body.add(P.tail);
  },
  axolote(d, P) {
    const c = d.cores;
    const b1 = sph(0.38, c.corpo, 0, 0.42, 0, 10, 8); b1.scale.set(1, 0.8, 1.4); P.body.add(b1);
    P.head.position.set(0, 0.55, 0.62);
    const h = sph(0.34, c.corpo, 0, 0, 0, 10, 8); h.scale.set(1.35, 0.85, 1); P.head.add(h);
    P.eyes = eyesOn(P.head, 0.22, 0.12, 0.2, 0.08);
    P.head.add(box(0.3, 0.03, 0.03, '#a0405a', 0, -0.08, 0.32));
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const g = cone(0.05, 0.3, c.guelras, sx * 0.42, 0.12 + (k - 1) * 0.1, -0.05); g.rotation.z = -sx * (1.0 + (k - 1) * 0.35); P.head.add(g); P.ears.push(g); }
    for (const [x, z] of [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]]) { const l = new THREE.Group(); l.position.set(x, 0.3, z); l.add(cyl(0.06, 0.05, 0.28, c.corpo, 0, -0.14, 0, 5)); P.root.add(l); P.legs.push(l); }
    P.tailSegs = [];
    for (let i = 0; i < 4; i++) { const s = sph(0.22 - i * 0.04, c.corpo, 0, 0.42, -0.5 - i * 0.28, 7, 5); s.scale.x = 0.6; P.body.add(s); P.tailSegs.push(s); }
  },
  lagarto(d, P) {
    const c = d.cores;
    P.colorMats = [];
    const m1 = mat(c.corpo, {}); P.colorMats.push(m1);
    const body = new THREE.Mesh(G_SPH(0.38, 10, 8), m1); body.position.set(0, 0.5, 0); body.scale.set(0.9, 0.8, 1.4); P.body.add(body);
    P.head.position.set(0, 0.68, 0.6);
    const hd = new THREE.Mesh(G_SPH(0.28, 10, 8), m1); hd.scale.set(1, 0.85, 1.2); P.head.add(hd);
    P.eyes = eyesOn(P.head, 0.2, 0.08, 0.08, 0.11);
    const crest = cone(0.12, 0.3, c.barriga, 0, 0.25, -0.1, 4); P.head.add(crest);
    for (const [x, z] of [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]]) { const l = new THREE.Group(); l.position.set(x, 0.35, z); l.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35, 5).translate(0, -0.17, 0), m1)); P.root.add(l); P.legs.push(l); }
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 5, 10, Math.PI * 1.5), m1); tail.position.set(0, 0.45, -0.75); tail.rotation.y = Math.PI / 2; P.body.add(tail);
    P.tongue = cyl(0.03, 0.03, 1, '#f28ab2', 0, -0.06, 0.3, 4); P.tongue.rotation.x = Math.PI / 2; P.tongue.scale.y = 0.01; P.head.add(P.tongue);
  },
  cobra(d, P) {
    const c = d.cores;
    P.segs = [];
    for (let i = 0; i < 9; i++) { const s = sph(0.24 - i * 0.012, i % 2 ? c.corpo : c.barriga, 0, 0.24, -i * 0.3, 8, 6); P.body.add(s); P.segs.push(s); }
    P.head.position.set(0, 0.5, 0.3);
    const h = sph(0.28, c.corpo, 0, 0, 0, 10, 8); h.scale.set(1.1, 0.8, 1.3); P.head.add(h);
    P.eyes = eyesOn(P.head, 0.14, 0.12, 0.2, 0.1);
    P.tongue = cyl(0.02, 0.02, 0.3, '#e8454a', 0, -0.08, 0.45, 3); P.tongue.rotation.x = Math.PI / 2; P.head.add(P.tongue);
  },
  minhoca(d, P) {
    BODIES.cobra({ ...d, cores: { corpo: d.cores.corpo, barriga: d.cores.barriga } }, P);
    P.tongue.visible = false;
    P.head.add(box(0.16, 0.03, 0.03, '#a0405a', 0, -0.08, 0.34));
  },
  polvo(d, P) {
    const c = d.cores;
    P.head.position.set(0, 1.1, 0);
    const dome = sph(0.6, c.corpo, 0, 0.1, 0, 12, 10); dome.scale.set(1, 1.15, 1); P.head.add(dome);
    P.eyes = eyesOn(P.head, 0.2, 0.05, 0.5, 0.13);
    P.arms = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const g = new THREE.Group(); g.position.set(Math.cos(a) * 0.35, 0.65, Math.sin(a) * 0.35); g.rotation.y = -a;
      const segs = [];
      let parent = g;
      for (let k = 0; k < 3; k++) {
        const s = new THREE.Group(); s.position.x = k === 0 ? 0 : 0.28; parent.add(s);
        s.add(sph(0.13 - k * 0.03, k === 2 ? c.barriga : c.corpo, 0.14, 0, 0, 6, 5));
        segs.push(s); parent = s;
      }
      P.body.add(g); P.arms.push({ g, segs, a, s: 1 });
    }
  },
  caranguejo(d, P) {
    const c = d.cores;
    const b = sph(0.5, c.corpo, 0, 0.5, 0, 12, 8); b.scale.set(1.25, 0.55, 0.95); P.body.add(b);
    P.head.position.set(0, 0.62, 0.35);
    for (const sx of [-1, 1]) { P.head.add(cyl(0.035, 0.035, 0.3, c.corpo, sx * 0.15, 0.15, 0, 4)); }
    P.eyes = eyesOn(P.head, 0.15, 0.32, 0, 0.09);
    P.claws = [];
    for (const sx of [-1, 1]) {
      const cl = new THREE.Group(); cl.position.set(sx * 0.6, 0.55, 0.35);
      cl.add(sph(0.18, c.corpo, sx * 0.1, 0, 0.1, 7, 5));
      const pin = cone(0.1, 0.3, c.corpo, sx * 0.12, 0.08, 0.32); pin.rotation.x = Math.PI / 2; cl.add(pin);
      const pin2 = cone(0.07, 0.25, c.barriga, sx * 0.12, -0.06, 0.3); pin2.rotation.x = Math.PI / 2; cl.add(pin2);
      P.body.add(cl); P.claws.push(cl);
    }
    for (let i = 0; i < 6; i++) {
      const sx = i < 3 ? -1 : 1, k = i % 3;
      const l = new THREE.Group(); l.position.set(sx * 0.5, 0.42, -0.25 + k * 0.22);
      const seg = cyl(0.04, 0.03, 0.5, c.corpo, sx * 0.18, -0.15, 0, 4); seg.rotation.z = sx * 0.9; l.add(seg);
      P.root.add(l); P.legs.push(l);
    }
  },
  pinguim(d, P, k = 0) {
    const c = d.cores;
    const b = sph(0.42, c.corpo, 0, 0.62, 0, 12, 8); b.scale.set(0.85, 1.25, 0.8); P.body.add(b);
    const belly = sph(0.34, c.barriga, 0, 0.58, 0.12, 10, 8); belly.scale.set(0.8, 1.15, 0.75); P.body.add(belly);
    P.head.position.set(0, 1.18, 0.03);
    P.head.add(sph(0.28, c.corpo, 0, 0, 0, 10, 8));
    P.head.add(sph(0.2, c.barriga, 0, -0.04, 0.14, 8, 6));
    const beak = cone(0.07, 0.2, c.bico, 0, -0.04, 0.3); beak.rotation.x = Math.PI / 2; P.head.add(beak);
    P.eyes = eyesOn(P.head, 0.1, 0.06, 0.22, 0.07);
    const bowC = k === 0 ? c.laco1 : c.laco2;
    for (const sx of [-1, 1]) { const bw = cone(0.09, 0.18, bowC, sx * 0.09, 0.95, 0.3); bw.rotation.z = sx * Math.PI / 2; P.body.add(bw); }
    P.body.add(sph(0.05, bowC, 0, 0.95, 0.32, 5, 4));
    for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.36, 0.78, 0); const f = sph(0.22, c.corpo, 0, -0.15, 0, 6, 5); f.scale.set(0.25, 1, 0.6); w.add(f); P.body.add(w); P.wings.push(w); }
    for (const sx of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * 0.15, 0.12, 0.08); l.add(box(0.18, 0.06, 0.26, c.bico, 0, -0.08, 0.06)); P.root.add(l); P.legs.push(l); }
  },
  esquilo(d, P) {
    const c = d.cores;
    const b = sph(0.36, c.corpo, 0, 0.62, 0, 10, 8); b.scale.set(0.9, 1.2, 0.9); P.body.add(b);
    P.body.add(sph(0.26, c.barriga, 0, 0.58, 0.18, 8, 6));
    P.head.position.set(0, 1.12, 0.12);
    P.head.add(sph(0.3, c.corpo, 0, 0, 0, 10, 8));
    P.head.add(sph(0.12, c.barriga, 0, -0.08, 0.24, 6, 5));
    P.eyes = eyesOn(P.head, 0.12, 0.07, 0.22, 0.09);
    for (const sx of [-1, 1]) { const e = cone(0.08, 0.22, c.corpo, sx * 0.16, 0.3, -0.02, 5); P.head.add(e); P.ears.push(e); }
    P.tailSegs = [];
    for (let i = 0; i < 5; i++) { const s = sph(0.22 + i * 0.03, c.cauda, 0, 0.4 + i * 0.25, -0.45 - Math.sin(i * 0.6) * 0.25, 8, 6); P.body.add(s); P.tailSegs.push(s); }
    for (const sx of [-1, 1]) { const a = new THREE.Group(); a.position.set(sx * 0.28, 0.82, 0.18); a.add(cyl(0.06, 0.05, 0.3, c.corpo, 0, -0.12, 0.05, 5)); P.body.add(a); P.wings.push(a); }
    for (const sx of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * 0.18, 0.3, 0.05); l.add(cyl(0.09, 0.07, 0.3, c.corpo, 0, -0.15, 0, 5)); P.root.add(l); P.legs.push(l); }
  },
  aranha(d, P) {
    const c = d.cores;
    const ab = sph(0.45, c.corpo, 0, 0.75, -0.35, 10, 8); ab.scale.set(1, 0.85, 1.1); P.body.add(ab);
    for (let i = 0; i < 3; i++) P.body.add(sph(0.08, c.detalhe, 0, 1.12 - i * 0.04, -0.2 - i * 0.22, 5, 4));
    P.head.position.set(0, 0.7, 0.2);
    P.head.add(sph(0.28, c.corpo, 0, 0, 0, 10, 8));
    P.eyes = eyesOn(P.head, 0.1, 0.1, 0.2, 0.08);
    for (const sx of [-1, 1]) P.head.add(sph(0.04, '#e8454a', sx * 0.06, 0.2, 0.2, 4, 3));
    for (let i = 0; i < 8; i++) {
      const sx = i < 4 ? -1 : 1, k = i % 4;
      const l = new THREE.Group(); l.position.set(sx * 0.25, 0.72, 0.15 - k * 0.18);
      l.add(rod(V(0, 0, 0), V(sx * 0.45, 0.35, 0), 0.035, c.corpo, 4));
      l.add(rod(V(sx * 0.45, 0.35, 0), V(sx * 0.75, -0.7, 0), 0.03, k % 2 ? c.detalhe : c.corpo, 4));
      P.root.add(l); P.legs.push(l);
    }
  },
  preguica(d, P) {
    const c = d.cores;
    P.branch = new THREE.Group();
    P.branch.add(cyl(0.12, 0.12, 2.4, c.galho, 0, 2.2, 0, 6)).children[0].rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) P.branch.add(cyl(0.12, 0.14, 2.2, c.galho, sx * 1.15, 1.1, 0, 6));
    P.root.add(P.branch);
    P.hang = new THREE.Group(); P.hang.position.y = 2.15; P.root.add(P.hang);
    const b = sph(0.42, c.corpo, 0, -0.75, 0, 10, 8); b.scale.set(0.9, 1.2, 0.8); P.hang.add(b);
    for (const sx of [-1, 1]) { P.hang.add(rod(V(sx * 0.3, -0.4, 0), V(sx * 0.15, 0, 0), 0.08, c.corpo, 5)); }
    P.hang.add(P.head); P.head.position.set(0, -0.35, 0.18);
    P.head.add(sph(0.3, c.corpo, 0, 0, 0, 10, 8));
    const face = sph(0.24, c.rosto, 0, -0.02, 0.12, 8, 6); face.scale.z = 0.6; P.head.add(face);
    P.eyes = eyesOn(P.head, 0.1, 0.03, 0.25, 0.07);
    for (const sx of [-1, 1]) { const m = sph(0.08, '#5a3a20', sx * 0.1, 0.03, 0.24, 5, 4); m.scale.set(1.4, 0.7, 0.4); P.head.add(m); }
    P.body.visible = false;
  },
  sapo(d, P) {
    const c = d.cores;
    const b = sph(0.48, c.corpo, 0, 0.42, 0, 12, 8); b.scale.set(1.15, 0.75, 1.05); P.body.add(b);
    P.body.add(sph(0.38, c.barriga, 0, 0.36, 0.22, 10, 6));
    P.head.position.set(0, 0.68, 0.25);
    P.eyes = eyesOn(P.head, 0.22, 0.18, 0.05, 0.13);
    P.head.add(box(0.5, 0.04, 0.04, '#2a4a2a', 0, -0.08, 0.38));
    P.papo = sph(0.22, c.papo, 0, -0.18, 0.32, 8, 6); P.head.add(P.papo);
    if (d.extras.includes('pintas')) for (let i = 0; i < 3; i++) P.body.add(sph(0.08, c.pintas, -0.2 + i * 0.2, 0.7, -0.05 - (i % 2) * 0.15, 5, 4));
    for (const sx of [-1, 1]) {
      const l = new THREE.Group(); l.position.set(sx * 0.42, 0.25, -0.15); const th = sph(0.2, c.corpo, 0, 0, 0, 7, 5); th.scale.set(0.8, 0.7, 1.2); l.add(th); l.add(box(0.25, 0.05, 0.3, c.corpo, sx * 0.05, -0.2, 0.15)); P.root.add(l); P.legs.push(l);
      const f = new THREE.Group(); f.position.set(sx * 0.3, 0.2, 0.35); f.add(cyl(0.05, 0.05, 0.25, c.corpo, 0, -0.1, 0, 4)); P.root.add(f); P.legs.push(f);
    }
  },
  tartaruga(d, P) {
    const c = d.cores;
    const shell = mesh(new THREE.SphereGeometry(0.62, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), c.casco, 0, 0.35, 0); shell.scale.set(1, 0.85, 1.15); P.body.add(shell);
    P.body.add(cyl(0.66, 0.66, 0.12, c.borda, 0, 0.36, 0, 6)).children.at(-1).scale.set(1, 1, 1.15);
    P.head.position.set(0, 0.5, 0.8);
    P.head.add(sph(0.24, c.corpo, 0, 0, 0, 8, 6));
    P.eyes = eyesOn(P.head, 0.11, 0.08, 0.16, 0.08);
    for (const [x, z] of [[-0.42, 0.4], [0.42, 0.4], [-0.42, -0.4], [0.42, -0.4]]) { const l = new THREE.Group(); l.position.set(x, 0.3, z); l.add(cyl(0.12, 0.12, 0.28, c.corpo, 0, -0.14, 0, 6)); P.root.add(l); P.legs.push(l); }
    P.tail = cone(0.07, 0.25, c.corpo, 0, 0.3, -0.75); P.tail.rotation.x = -Math.PI / 2; P.body.add(P.tail);
  },
  lebre(d, P) {
    const c = d.cores;
    const b = sph(0.4, c.corpo, 0, 0.62, -0.05, 10, 8); b.scale.set(0.9, 1, 1.15); P.body.add(b);
    P.head.position.set(0, 1.05, 0.38);
    P.head.add(sph(0.3, c.corpo, 0, 0, 0, 10, 8));
    P.eyes = eyesOn(P.head, 0.13, 0.06, 0.22, 0.09);
    P.head.add(sph(0.05, '#f4a3a3', 0, -0.04, 0.3, 5, 4));
    for (const sx of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(sx * 0.12, 0.25, -0.05);
      const outer = sph(0.12, c.corpo, 0, 0.4, 0, 6, 5); outer.scale.set(0.6, 3.6, 0.35); e.add(outer);
      const inner = sph(0.08, c.interior, 0, 0.4, 0.04, 5, 4); inner.scale.set(0.5, 3.6, 0.3); e.add(inner);
      e.rotation.z = -sx * 0.15;
      P.head.add(e); P.ears.push(e);
    }
    P.tail = sph(0.13, '#ffffff', 0, 0.6, -0.5, 6, 5); P.body.add(P.tail);
    for (const [x, z] of [[-0.2, 0.25], [0.2, 0.25], [-0.25, -0.25], [0.25, -0.25]]) { const l = new THREE.Group(); l.position.set(x, 0.35, z); l.add(cyl(0.08, 0.07, 0.35, c.corpo, 0, -0.17, 0, 5)); P.root.add(l); P.legs.push(l); }
  },
};

// ---------- peças de assinatura ----------
function addExtras(d, P) {
  const c = d.cores;
  for (const e of d.extras) {
    if (e === 'avental') { const a = box(0.6, 0.55, 0.06, '#ffffff', 0, 0.62, 0.62); P.body.add(a); }
    if (e === 'chapeuPadeiro') { P.head.add(cyl(0.22, 0.2, 0.25, '#ffffff', 0, 0.4, -0.02, 10)); const puff = sph(0.28, '#ffffff', 0, 0.62, -0.02, 10, 6); puff.scale.y = 0.7; P.head.add(puff); }
    if (e === 'roda') {
      P.wheel = new THREE.Group(); P.wheel.position.set(1.4, 0.75, 0);
      const ring = mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 20), '#c9cdd3'); ring.rotation.y = Math.PI / 2; P.wheel.add(ring);
      for (let k = 0; k < 6; k++) { const sp = box(0.04, 1.4, 0.04, '#8a96a3'); sp.rotation.x = (k / 6) * Math.PI; P.wheel.add(sp); }
      P.extraRoot.add(P.wheel);
      P.extraRoot.add(box(0.15, 0.8, 0.15, '#6b6f78', 1.4, 0.4, -0.4));
    }
    if (e === 'bochechas') for (const sx of [-1, 1]) P.head.add(sph(0.12, '#fbd3a0', sx * 0.25, -0.1, 0.18, 6, 5));
    if (e === 'ninho') {
      const n = mesh(new THREE.TorusGeometry(0.55, 0.16, 6, 14), '#a8764a', 0, 0.12, 0); n.rotation.x = Math.PI / 2; P.extraRoot.add(n);
      for (let k = 0; k < 5; k++) { const eg = sph(0.13, '#fbf6ea', Math.cos(k * 1.3) * 0.75, 0.12, Math.sin(k * 1.3) * 0.75, 6, 5); eg.scale.y = 1.3; P.extraRoot.add(eg); }
    }
    if (e === 'relogio') { const w = cyl(0.08, 0.08, 0.06, '#f2c14e', 0, -0.25, 0.08, 8); w.rotation.x = Math.PI / 2; (P.wings[1] || P.body).add(w); }
    if (e === 'megafone') { const m = cone(0.16, 0.4, '#e8554a', 0, -0.25, 0.3, 8); m.rotation.x = -Math.PI / 2; (P.wings[1] || P.body).add(m); }
    if (e === 'dentes') { P.head.add(box(0.14, 0.12, 0.04, '#ffffff', 0, -0.2, 0.45)); }
    if (e === 'caudaChata') { P.tail.visible = false; const t = box(0.4, 0.08, 0.6, '#4a2c18', 0, 0.45, -0.8); t.rotation.x = 0.3; P.body.add(t); P.flatTail = t; }
    if (e === 'papo') { /* já feito no corpo */ }
  }
  // chapéu de festa (aparece quando a cidade fica completa)
  P.partyHat = cone(0.16, 0.42, '#e8554a', 0, 0.42, 0, 8);
  P.partyHat.add(sph(0.06, '#f2c14e', 0, 0.22, 0, 5, 4));
  P.partyHat.visible = false;
  P.head.add(P.partyHat);
}

export function makeAnimalModel(id, k = 0) {
  const d = ANIMALS[id];
  const P = { root: new THREE.Group(), body: new THREE.Group(), head: new THREE.Group(), legs: [], ears: [], wings: [], eyes: [], extraRoot: new THREE.Group() };
  P.root.add(P.body); P.body.add(P.head);
  BODIES[d.corpo](d, P, k);
  addExtras(d, P);
  const s = d.escala || 1;
  P.root.scale.setScalar(s);
  P.root.add(makeContactShadow(0.6));
  // só as peças grandes projetam sombra (olhos, bicos e detalhes ficam de fora: menos draw calls)
  P.shadowParts = [];
  P.root.traverse((m) => {
    if (!m.isMesh || m.material?.transparent) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const s = m.getWorldScale(new THREE.Vector3());
    if (m.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z) > 0.22) P.shadowParts.push(m);
  });
  return { P, d };
}

// ---------- comportamento ----------
export class Animal {
  constructor(scene, id, settlement) {
    this.id = id;
    this.def = ANIMALS[id];
    this.s = settlement;
    this.models = [];
    const n = this.def.par ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const m = makeAnimalModel(id, k);
      scene.add(m.P.root);
      if (k === 0) { scene.add(m.P.extraRoot); }
      this.models.push(m.P);
    }
    this.P = this.models[0];
    this.pen = settlement.pen;
    this.pos = new THREE.Vector3(this.pen.x, 0, this.pen.z);
    this.target = this.pos.clone();
    this.yaw = Math.random() * 6;
    this.state = 'wander';
    this.timer = 2;
    this.anim = 0;
    this.headYaw = 0;
    this.mood = null; // {kind:'celebrate'|'sad', t}
    this.idleNear = 0;
    this.sleeping = false;
    this.door = null; // espera na porta (gatilho reativo)
    this.introduced = false;
    this.P.extraRoot.position.set(this.pen.x, walkHeight(this.pen.x, this.pen.z), this.pen.z);
    this.P.extraRoot.rotation.y = this.pen.rot || 0;
  }

  get anchor() { return this.P.root; }

  say(text, opts = {}) {
    G.ui?.bubbles.say(this.P.root, text, { y: 2.2 * (this.def.escala || 1), ...opts });
    G.audio?.voice(text, this.def.voz.pitch, this.def.voz.onda);
  }

  celebrate() { this.mood = { kind: 'celebrate', t: 0 }; this.sleeping = false; }
  sad() { this.mood = { kind: 'sad', t: 0 }; this.sleeping = false; }
  setParty(on) { for (const p of this.models) p.partyHat.visible = on; }

  goToDoor(door) { this.door = door; this.state = 'door'; this.sleeping = false; }

  update(dt, t) {
    const A = CONFIG.animals;
    const hero = G.hero;
    const dHero = Math.hypot(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z);
    const shadowNear = dHero < 22;
    if (shadowNear !== this._shadowNear) {
      this._shadowNear = shadowNear;
      for (const P of this.models) for (const m of P.shadowParts) m.castShadow = shadowNear;
    }
    const P = this.P;
    let speed = 0;

    // dormir se o herói ficar 30 s parado perto
    if (dHero < 6 && hero.speed < 0.1) this.idleNear += dt; else { this.idleNear = 0; if (this.sleeping) { this.sleeping = false; } }
    if (this.idleNear > A.sleepAfter && !this.sleeping && this.state !== 'door') { this.sleeping = true; this.say('Zzz...', { time: 4 }); }

    if (this.state === 'door' && this.door) {
      this.target.set(this.door.x, 0, this.door.z);
    } else if (this.sleeping) {
      this.target.copy(this.pos);
    } else if (dHero < A.approachDist && G.mode === 'play') {
      this.state = 'approach';
      // trota até 2,2 do herói, sem se afastar muito do cercadinho
      const dir = new THREE.Vector3(hero.pos.x - this.pos.x, 0, hero.pos.z - this.pos.z).normalize();
      const goal = new THREE.Vector3(hero.pos.x, 0, hero.pos.z).addScaledVector(dir, -A.approachStop);
      const fromPen = new THREE.Vector3(goal.x - this.pen.x, 0, goal.z - this.pen.z);
      if (fromPen.length() > 5.5) fromPen.setLength(5.5);
      this.target.set(this.pen.x + fromPen.x, 0, this.pen.z + fromPen.z);
    } else {
      if (this.state === 'approach') this.state = 'wander';
      this.state = dHero < A.noticeDist ? 'notice' : 'wander';
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = A.wanderMin + Math.random() * (A.wanderMax - A.wanderMin);
        this.target.set(this.pen.x + (Math.random() - 0.5) * 3.6, 0, this.pen.z + (Math.random() - 0.5) * 3.6);
      }
    }
    if (this.def.corpo === 'preguica' && this.state !== 'door') this.target.copy(this.pos); // só larga o galho para esperar na porta
    const to = new THREE.Vector3(this.target.x - this.pos.x, 0, this.target.z - this.pos.z);
    const dist = to.length();
    if (dist > 0.15 && !(this.mood && this.mood.kind === 'celebrate')) {
      const sp = this.state === 'approach' || this.state === 'door' ? A.trotSpeed : A.walkSpeed;
      speed = Math.min(sp, dist * 3);
      this.pos.addScaledVector(to.normalize(), speed * dt);
      this.yaw += wrapAngle(Math.atan2(to.x, to.z) - this.yaw) * damp(8, dt);
    } else if (dHero < A.noticeDist || this.state === 'door') {
      const look = Math.atan2(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z);
      if (this.state === 'approach' || this.state === 'door') this.yaw += wrapAngle(look - this.yaw) * damp(5, dt);
    }
    // cabeça vira para o herói (limite 60°)
    let wantHead = 0;
    if (dHero < A.noticeDist && !this.sleeping) wantHead = clamp(wrapAngle(Math.atan2(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z) - this.yaw), -A.headLimit, A.headLimit);
    this.headYaw += (wantHead - this.headYaw) * damp(6, dt);

    this.pos.y = walkHeight(this.pos.x, this.pos.z);
    this.anim += dt * (speed > 0.05 ? speed * 5 : 0);
    this.pose(dt, t, speed, dHero);
  }

  pose(dt, t, speed, dHero) {
    const models = this.models;
    models.forEach((P, k) => {
      const off = k === 0 ? 0 : 1.1;
      const ox = Math.cos(this.yaw) * off, oz = -Math.sin(this.yaw) * off;
      P.root.position.set(this.pos.x + ox, this.pos.y, this.pos.z + oz);
      P.root.rotation.set(0, this.yaw, 0);
      P.body.position.set(0, 0, 0);
      P.body.rotation.set(0, 0, 0);
      P.head.rotation.set(0, this.headYaw, 0);
      const walking = speed > 0.05;
      const sw = Math.sin(this.anim);
      P.legs.forEach((l, i) => (l.rotation.x = walking ? (i % 2 ? sw : -sw) * 0.6 : 0));
      P.body.position.y = walking ? Math.abs(Math.cos(this.anim)) * 0.06 : Math.sin(t * 2 + k) * 0.015;
      P.ears.forEach((e, i) => (e.rotation.x = 0));
      this.signature(P, t, dt, walking, k);
      // humores
      if (this.mood) {
        const m = this.mood;
        if (k === 0) m.t += dt;
        if (m.kind === 'celebrate') { P.body.position.y += Math.abs(Math.sin(m.t * 7)) * 0.6; P.root.rotation.y += m.t * 4; }
        if (m.kind === 'sad') { P.head.rotation.x = 0.45; P.ears.forEach((e) => (e.rotation.x = 0.9)); }
        if (m.t > (m.kind === 'sad' ? 4 : 2.2)) this.mood = null;
      }
      if (this.sleeping) {
        P.body.position.y = -0.15; P.body.rotation.z = 0.25; P.head.rotation.x = 0.4;
        for (const e of P.eyes) e.scale.y = 0.12;
      } else {
        const bl = (t * 0.7 + k * 0.3) % 3.3 < 0.12;
        for (const e of P.eyes) e.scale.y = bl ? 0.12 : 1;
      }
    });
    if (this.state === 'door' && !this._qT) { this._qT = 0; }
    if (this.state === 'door') { this._qT -= dt; if (this._qT <= 0 && dHero > 3) { this._qT = 4; this.say('?', { icon: true, time: 3.5 }); } }
  }

  // animação de assinatura de cada espécie
  signature(P, t, dt, walking, k) {
    const sig = this.def.assinatura;
    const cyc = (t + k * 1.7) % 8;
    switch (sig) {
      case 'cortaPao': if (!walking && cyc < 1) P.head.rotation.x = Math.sin(cyc * Math.PI * 4) * 0.2; break;
      case 'caudaDigitos': P.tailSegs.forEach((s, i) => { s.position.x = Math.sin(t * 4 - i) * 0.08 * i; s.visible = !(cyc < 1.5 && i === 3); }); break;
      case 'ovos': if (!walking) { P.body.position.y += Math.max(0, Math.sin(t * 6)) * 0.05; } P.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.max(0, Math.sin(t * 10)) * (cyc < 1 ? 0.8 : 0.1))); break;
      case 'rolaAbre': {
        // rola como bola e abre exatamente no meio
        const roll = cyc > 5 && cyc < 7 && !walking;
        const k2 = roll ? Math.sin(((cyc - 5) / 2) * Math.PI) : 0;
        P.head.scale.setScalar(1 - k2 * 0.8);
        P.shells.forEach((s) => (s.g.rotation.z = s.sx * k2 * 0.35 * (cyc > 6.4 ? 1 : 0)));
        P.body.rotation.x = roll && cyc < 6.4 ? (cyc - 5) * Math.PI * 2 : 0;
        break;
      }
      case 'linguaCorda': {
        const m = P.colorMats[0];
        const kk = 0.5 + 0.5 * Math.sin(t * 0.8);
        m.color.set(this.def.cores.corpo).lerp(new THREE.Color(this.def.cores.corpo2), kk);
        P.tongue.scale.y = cyc < 0.8 ? Math.sin((cyc / 0.8) * Math.PI) * 1.4 : 0.01;
        P.tongue.position.z = 0.3 + P.tongue.scale.y / 2;
        break;
      }
      case 'correRoda': if (P.wheel) P.wheel.rotation.x += dt * (cyc < 4 ? 6 : 0.5); break;
      case 'mergulho': P.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.sin(t * (walking ? 10 : 2)) * 0.3)); if (cyc < 1.2 && !walking) { P.body.position.y += Math.sin((cyc / 1.2) * Math.PI) * 1.4; P.body.rotation.x = cyc < 0.6 ? -0.4 : 0.5; } break;
      case 'esticaReta':
      case 'ondula': {
        const straight = sig === 'esticaReta' && cyc < 1.5;
        P.segs.forEach((s, i) => { s.position.x = straight ? 0 : Math.sin(t * 3 - i * 0.7) * 0.18 * (i / 3); s.position.y = sig === 'ondula' ? 0.24 + Math.max(0, Math.sin(t * 3 - i * 0.7)) * 0.08 : 0.24; });
        P.head.position.x = straight ? 0 : Math.sin(t * 3 + 0.7) * 0.1;
        if (P.tongue && P.tongue.visible) P.tongue.scale.y = Math.sin(t * 12) > 0.6 ? 1 : 0.2;
        break;
      }
      case 'encolheBracos': P.arms.forEach((a, i) => { const shrink = cyc < 4 && i < Math.floor(cyc * 2) ? 0.5 : 1; a.s += (shrink - a.s) * Math.min(1, dt * 4); a.g.scale.setScalar(a.s); a.segs.forEach((s, j) => (s.rotation.z = Math.sin(t * 2 + i + j) * 0.35 - 0.3)); }); break;
      case 'trocaLugar': P.claws.forEach((c, i) => (c.rotation.x = Math.sin(t * 4 + i) * 0.25)); if (walking) P.body.rotation.y = Math.PI / 2; break;
      case 'escadas': P.body.position.y += k === 0 ? Math.abs(Math.sin(t * 1.5)) * 0.5 : Math.abs(Math.cos(t * 1.5)) * 0.5; P.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.2 + Math.sin(t * 6) * 0.15))); break;
      case 'esperaTodos': P.tailSegs.forEach((s, i) => (s.position.x = Math.sin(Math.floor(t) * 1.3 + i * 0.2) * 0.05)); break;
      case 'cascata': P.tailSegs.forEach((s, i) => (s.position.x = Math.sin(t * 5 - i * 0.8) * 0.08)); P.wings[1] && (P.wings[1].rotation.x = -1.2); break;
      case 'teceFio': P.legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 6 + i) * (walking ? 0.4 : 0.08))); break;
      case 'balanca': P.hang.rotation.z = Math.sin(t * 0.6) * 0.18; P.root.rotation.y = this.s.pen.rot || 0; break;
      case 'empilha': if (P.flatTail) P.flatTail.rotation.x = 0.3 + Math.max(0, Math.sin(t * 5)) * (cyc < 1.5 ? 0.6 : 0); break;
      case 'puloParabola':
      case 'tresPulos': {
        P.papo.scale.setScalar(1 + Math.max(0, Math.sin(t * 3)) * 0.4);
        const n = sig === 'tresPulos' ? 3 : 1;
        if (!walking && cyc < n * 0.5) { const ph = (cyc % 0.5) / 0.5; P.body.position.y += 4 * ph * (1 - ph) * 0.7; P.body.position.z = ph * 0.3; }
        break;
      }
      case 'passosRetos': P.head.position.z = 0.8 + Math.sin(t * 1.2) * 0.06; break;
      case 'quatroSaltos': {
        if (!walking && cyc < 1.6) { const ph = (cyc % 0.4) / 0.4; P.body.position.y += 4 * ph * (1 - ph) * 0.45; }
        P.ears.forEach((e, i) => (e.rotation.z = (i ? 0.15 : -0.15) + Math.sin(t * 3 + i) * 0.1));
        break;
      }
    }
  }
}
