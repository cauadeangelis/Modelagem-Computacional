// Esqueleto do herói (seção 6.1): hierarquia de Groups com pivô em cada junta.
import * as THREE from 'three';
import { box, sph, cyl, cone, mesh, mat, bake, G_SPH, G_HALFSPH } from '../utilitarios/geometria.js';
import { CONFIG } from '../configuracao.js';

const shadowGeo = new THREE.CircleGeometry(0.55, 16);
const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false });

export function makeContactShadow(r = 0.55) {
  const m = new THREE.Mesh(shadowGeo, shadowMat);
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(r / 0.55);
  m.position.y = 0.03;
  m.renderOrder = 3;
  return m;
}

// makeHero({ pele, macacao, colete, capacete, genero }) — aparência parametrizável; genero 'f' ganha cabelo e cílios
export function makeHumanoid(opts = {}) {
  const c = { ...CONFIG.hero.colors, luva: '#e8654a', bota: '#5a3a2a', mochila: '#8a5a3a', planta: '#d9d9d9', cabelo: '#6b3a1e', laco: '#e8454a', ...opts };
  const root = new THREE.Group();
  const body = new THREE.Group(); // recebe escalas (amassar/esticar) sem mexer na raiz
  root.add(body);
  const pelvis = new THREE.Group(); pelvis.position.y = 0.9; body.add(pelvis);
  const torso = new THREE.Group(); pelvis.add(torso);
  const torsoMesh = box(0.72, 0.76, 0.46, c.macacao, 0, 0.38, 0); torso.add(torsoMesh);
  const vest = box(0.76, 0.4, 0.5, c.colete, 0, 0.42, 0); torso.add(vest);
  torso.add(box(0.78, 0.1, 0.52, '#ffffff', 0, 0.42, 0));
  const pack = new THREE.Group(); torso.add(pack);
  pack.add(box(0.5, 0.55, 0.22, c.mochila, 0, 0.4, -0.34));
  const plan = cyl(0.07, 0.07, 0.7, c.planta, 0.16, 0.72, -0.38, 7); plan.rotation.z = -0.35; pack.add(plan);

  const head = new THREE.Group(); head.position.y = 0.95; torso.add(head);
  head.add(sph(0.38, c.pele, 0, 0, 0, 14, 10));
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.14, 0.05, 0.34);
    e.add(new THREE.Mesh(G_SPH(0.06, 8, 6), mat('#1a1a1a')));
    const shine = new THREE.Mesh(G_SPH(0.02, 5, 4), mat('#ffffff')); shine.position.set(0.02, 0.02, 0.05); e.add(shine);
    head.add(e); eyes.push(e);
  }
  for (const sx of [-1, 1]) head.add(sph(0.05, '#f4a3a3', sx * 0.24, -0.08, 0.3, 6, 4));
  const mouth = box(0.12, 0.03, 0.03, c.genero === 'f' ? '#b8404f' : '#8a3a2a', 0, -0.13, 0.36); head.add(mouth);
  // cabelo até os ombros, mechas do lado do rosto, marias-chiquinhas que balançam (hero.js) e cílios
  const pigtails = [];
  if (c.genero === 'f') {
    const back = sph(0.39, c.cabelo, 0, -0.04, -0.1, 12, 10); back.scale.set(1.04, 1.02, 0.92); head.add(back);
    const nape = sph(0.3, c.cabelo, 0, -0.32, -0.2, 10, 8); nape.scale.set(1.15, 1.1, 0.7); head.add(nape);
    for (const sx of [-1, 1]) {
      const lock = sph(0.12, c.cabelo, sx * 0.34, -0.16, 0.06, 8, 6); lock.scale.set(0.65, 1.8, 0.8); head.add(lock);
      // presa no lado da cabeça, logo abaixo da aba; rotation.z = sx·0,35 aponta para fora
      const g = new THREE.Group(); g.position.set(sx * 0.4, 0.02, -0.12); g.rotation.z = sx * 0.35; head.add(g);
      g.add(sph(0.065, c.laco, 0, 0, 0, 8, 6));
      const p1 = sph(0.11, c.cabelo, 0, -0.14, 0, 8, 6); p1.scale.set(1, 1.4, 1); g.add(p1);
      const p2 = sph(0.08, c.cabelo, 0, -0.32, 0, 8, 6); p2.scale.set(1, 1.4, 1); g.add(p2);
      pigtails.push(g);
    }
    for (const [i, sx] of [[0, -1], [1, 1]]) {
      const lash = box(0.06, 0.018, 0.02, '#1a1a1a', sx * 0.045, 0.06, 0.02); lash.rotation.z = sx * -0.5; eyes[i].add(lash);
    }
  }
  const helmet = new THREE.Group(); head.add(helmet);
  const helmetMesh = new THREE.Mesh(G_HALFSPH(0.42, 14, 6), mat(c.capacete)); helmetMesh.position.y = 0.12; helmet.add(helmetMesh);
  const brim = cyl(0.5, 0.5, 0.05, c.capacete, 0, 0.12, 0.04, 16); helmet.add(brim);
  helmet.add(box(0.12, 0.08, 0.1, '#ffffff', 0, 0.42, 0.33));

  const arm = (sx) => {
    const g = new THREE.Group(); g.position.set(sx * 0.46, 0.65, 0); torso.add(g);
    g.add(cyl(0.1, 0.1, 0.55, c.macacao, 0, -0.28, 0, 8));
    g.add(sph(0.12, c.luva, 0, -0.58, 0, 8, 6));
    return g;
  };
  const leg = (sx) => {
    const g = new THREE.Group(); g.position.set(sx * 0.2, 0, 0); pelvis.add(g);
    g.add(cyl(0.13, 0.13, 0.74, c.macacao, 0, -0.37, 0, 8));
    const boot = box(0.26, 0.16, 0.38, c.bota, 0, -0.82, 0.06); g.add(boot);
    g.userData.boot = boot;
    return g;
  };
  const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);

  // ---- cosméticos do Raizdex (escondidos até serem equipados) ----
  const cos = {};
  cos.listrado = new THREE.Group(); helmet.add(cos.listrado);
  for (const y of [0.2, 0.34]) { const t = mesh(new THREE.TorusGeometry(0.4 - (y - 0.2) * 0.9, 0.025, 4, 18), '#ffffff', 0, y, 0); t.rotation.x = Math.PI / 2; cos.listrado.add(t); }
  cos.palha = new THREE.Group(); head.add(cos.palha);
  cos.palha.add(cyl(0.62, 0.62, 0.05, '#e8c872', 0, 0.2, 0, 16));
  cos.palha.add(cyl(0.3, 0.34, 0.32, '#e8c872', 0, 0.36, 0, 12));
  cos.palha.add(cyl(0.345, 0.345, 0.07, '#e8454a', 0, 0.26, 0, 12));
  cos.bolinhas = new THREE.Group(); torso.add(cos.bolinhas);
  for (const [x, y] of [[-0.22, 0.52], [0.2, 0.34], [0.02, 0.56], [-0.1, 0.3], [0.28, 0.55]]) cos.bolinhas.add(sph(0.05, '#e8454a', x, y, 0.26, 5, 4));
  const flames = [legL, legR].map((lg) => { const f = cone(0.08, 0.3, '#ff8a2a', 0, -0.98, -0.14); f.rotation.x = Math.PI; lg.add(f); return f; });
  cos.foguete = { set visible(v) { flames.forEach((f) => (f.visible = v)); } };
  cos.oculos = new THREE.Group(); head.add(cos.oculos);
  for (const sx of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.09, 0.022, 4, 12), '#3a2a1a', sx * 0.14, 0.05, 0.38); cos.oculos.add(r); }
  cos.oculos.add(box(0.1, 0.02, 0.02, '#3a2a1a', 0, 0.06, 0.39));
  cos.jato = new THREE.Group(); torso.add(cos.jato);
  for (const sx of [-1, 1]) {
    cos.jato.add(cyl(0.11, 0.11, 0.55, '#8a96a3', sx * 0.15, 0.4, -0.5, 8));
    const fl = cone(0.09, 0.3, '#ff8a2a', sx * 0.15, 0.0, -0.5); fl.rotation.x = Math.PI; cos.jato.add(fl);
  }
  for (const k in cos) cos[k].visible = false;

  const shadow = makeContactShadow();
  root.add(shadow);

  const rig = { root, body, pelvis, torso, torsoMesh, head, eyes, mouth, helmet, pigtails, armL, armR, legL, legR, pack, cos, shadow, colors: c };
  root.traverse((m) => {
    // só peças grandes projetam sombra (olhos, bochechas e detalhes não): menos draw calls no passe de sombra
    if (!m.isMesh || m === shadow) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    m.castShadow = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z) > 0.14;
  });
  return rig;
}

// Para os moradores: junta as malhas de cada junta numa só (6 malhas por NPC em vez de ~25)
export function compactRig(rig) {
  const pivots = new Set([rig.pelvis, rig.torso, rig.head, rig.armL, rig.armR, rig.legL, rig.legR]);
  for (const g of [rig.torso, rig.head, rig.armL, rig.armR, rig.legL, rig.legR]) {
    const tmp = new THREE.Group();
    for (const k of g.children.slice()) {
      if (pivots.has(k)) continue;
      g.remove(k);
      if (k.visible) tmp.add(k);
    }
    const m = bake(tmp);
    if (m) g.add(m);
  }
  rig.eyes = [];
  return rig;
}

export function applyCosmetics(rig, list = []) {
  const on = new Set(list);
  for (const k in rig.cos) rig.cos[k].visible = on.has(k);
  rig.helmet.visible = !on.has('palha');
  rig.pack.visible = !on.has('jato');
  rig.legL.userData.boot.material = mat(on.has('foguete') ? '#e8454a' : rig.colors.bota);
  rig.legR.userData.boot.material = rig.legL.userData.boot.material;
}

// marias-chiquinhas: abrem e vão para trás com a velocidade k (0–1), balançam com o passo e sobem no pulo
export function swingPigtails(rig, k, phase, t, airborne) {
  rig.pigtails.forEach((g, i) => {
    const sx = i ? 1 : -1;
    g.rotation.z = sx * (0.35 + k * 0.25 + (airborne ? 0.3 : 0)) + Math.sin(phase + i * Math.PI) * 0.15 * k + Math.sin(t * 1.6 + i) * 0.05;
    g.rotation.x = k * 0.6 + Math.sin(phase * 2) * 0.1 * k;
  });
}

export function resetPose(rig) {
  rig.body.position.set(0, 0, 0);
  rig.body.rotation.set(0, 0, 0);
  rig.body.scale.set(1, 1, 1);
  rig.pelvis.position.set(0, 0.9, 0);
  rig.pelvis.rotation.set(0, 0, 0);
  rig.torso.rotation.set(0, 0, 0);
  rig.torso.scale.set(1, 1, 1);
  rig.head.rotation.set(0, 0, 0);
  for (const l of [rig.armL, rig.armR, rig.legL, rig.legR]) l.rotation.set(0, 0, 0);
}
