// Lina e Nina: duas gatas que seguem o herói, uma de cada lado (pet alternativo à Raizinha).
// Mesma interface da Raizinha (companion.js); "lina:"/"nina:" no começo da fala escolhe quem fala.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { sph, cyl, cone, box, mesh } from '../utilitarios/geometria.js';
import { makeContactShadow } from './corpo-articulado.js';
import { findInterest } from './companheiro.js';
import { damp, wrapAngle, clamp, lerp, easeOutQuad } from '../utilitarios/matematica.js';
import { walkHeight } from '../mundo/chao.js';
import { falaPet, tx, separarFalante } from '../dados/falas.js';

// meia-argola para as listras do lombo
const G_LISTRA = new THREE.TorusGeometry(1, 0.13, 4, 12, Math.PI);

// cores: { pelo, listra, barriga, olhos }
export function makeGatoModel(c) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const torso = new THREE.Group(); torso.position.y = 0.3; body.add(torso);
  const tronco = sph(0.2, c.pelo, 0, 0, 0, 12, 10); tronco.scale.set(0.95, 0.85, 1.55); torso.add(tronco);
  const peito = sph(0.13, c.barriga, 0, -0.03, 0.2, 10, 8); peito.scale.set(1, 1, 0.7); torso.add(peito);
  // listras acompanhando a elipse do tronco (semieixos 0,19 × 0,17 × 0,31)
  for (const z of [-0.16, -0.04, 0.08]) {
    const f = Math.sqrt(1 - (z / 0.31) ** 2) * 1.04;
    const l = mesh(G_LISTRA, c.listra, 0, 0, z); l.scale.set(0.19 * f, 0.17 * f, 0.22); torso.add(l);
  }

  const head = new THREE.Group(); head.position.set(0, 0.48, 0.3); body.add(head);
  const cabeca = sph(0.17, c.pelo, 0, 0, 0, 12, 10); cabeca.scale.set(1.12, 0.95, 1); head.add(cabeca);
  const focinho = sph(0.075, c.barriga, 0, -0.06, 0.12, 8, 6); focinho.scale.set(1.35, 0.8, 0.8); head.add(focinho);
  head.add(sph(0.025, '#e88a9a', 0, -0.025, 0.175, 6, 4));
  for (const x of [-0.045, 0, 0.045]) { const l = box(0.018, 0.07, 0.02, c.listra, x, 0.1, 0.135); l.rotation.x = -0.7; head.add(l); }
  const ears = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.1, 0.12, 0); e.rotation.z = -sx * 0.3; head.add(e);
    e.add(cone(0.07, 0.15, c.pelo, 0, 0.06, 0, 6));
    const dentro = cone(0.04, 0.09, '#f2a5b5', 0, 0.045, 0.035, 6); dentro.scale.z = 0.4; e.add(dentro);
    ears.push(e);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.075, 0.025, 0.145); head.add(e);
    e.add(sph(0.045, c.olhos, 0, 0, 0, 8, 6));
    const pupila = sph(0.03, '#1a1a1a', 0, 0, 0.025, 6, 5); pupila.scale.set(0.35, 1, 0.6); e.add(pupila);
    e.add(sph(0.012, '#ffffff', 0.015, 0.018, 0.04, 4, 3));
    eyes.push(e);
  }
  for (const sx of [-1, 1]) for (const k of [-1, 1]) {
    const w = box(0.16, 0.006, 0.006, '#fdfdfd', sx * 0.13, -0.055 + k * 0.016, 0.13);
    w.rotation.set(0, -sx * 0.25, sx * k * 0.12); head.add(w);
  }

  // pernas: 0 e 1 na frente, 2 e 3 atrás; as diagonais (0–3, 1–2) andam juntas
  const legs = [];
  for (const [x, z] of [[-0.09, 0.19], [0.09, 0.19], [-0.09, -0.19], [0.09, -0.19]]) {
    const g = new THREE.Group(); g.position.set(x, 0.22, z); body.add(g);
    g.add(cyl(0.045, 0.04, 0.2, c.pelo, 0, -0.1, 0, 6));
    const pata = sph(0.048, c.barriga, 0, -0.2, 0.015, 6, 5); pata.scale.set(1, 0.6, 1.3); g.add(pata);
    legs.push(g);
  }

  // rabo em 5 gomos encadeados (cada gomo cresce em +y do anterior)
  const tail = [];
  let parent = torso;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    if (i === 0) g.position.set(0, 0.06, -0.29); else g.position.y = 0.1;
    const r = 0.034 - i * 0.003;
    g.add(cyl(r - 0.003, r, 0.11, i === 4 ? c.listra : c.pelo, 0, 0.055, 0, 6));
    parent.add(g); tail.push(g); parent = g;
  }

  const shadow = makeContactShadow(0.3); root.add(shadow);
  root.traverse((m) => {
    // só peças grandes projetam sombra: menos draw calls no passe de sombra
    if (!m.isMesh || m === shadow) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    m.castShadow = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z) > 0.15;
  });
  return { root, body, torso, head, ears, eyes, legs, tail, shadow };
}

// s: { phase, move (0–1), sit (0–1), seed } — usado no jogo e na prévia da tela de criação
export function animateGato(m, s, t) {
  const sw = Math.sin(s.phase) * 0.7 * s.move, sit = s.sit;
  m.legs[0].rotation.x = sw;
  m.legs[1].rotation.x = -sw;
  // sentada: as patas de trás dobram para a frente, embaixo do corpo
  m.legs[2].rotation.x = -sw * (1 - sit) - 1.25 * sit;
  m.legs[3].rotation.x = sw * (1 - sit) - 1.25 * sit;
  m.legs[2].position.y = m.legs[3].position.y = 0.22 - 0.1 * sit;
  m.torso.rotation.x = -0.45 * sit;
  m.torso.position.y = 0.3 - 0.02 * sit;
  m.head.position.set(0, 0.48 + 0.1 * sit, 0.3 - 0.04 * sit);
  m.body.position.y = Math.abs(Math.sin(s.phase)) * 0.03 * s.move;
  m.tail.forEach((g, i) => {
    const wave = Math.sin(t * (2.2 + s.move * 2) - i * 0.7) * (0.12 + 0.12 * (1 - s.move));
    if (i === 0) { g.rotation.x = lerp(-1.2 + 0.4 * s.move, -2.0, sit); g.rotation.z = wave * 0.5; }
    else { g.rotation.x = lerp(0.3, 0.12, sit); g.rotation.z = wave + 0.35 * sit; }
  });
  // orelhas: uma tremidinha de vez em quando
  m.ears.forEach((e, i) => (e.rotation.x = Math.max(0, Math.sin(t * 0.9 + s.seed + i * 0.4) * 8 - 7) * -0.35));
}

export class Gatas {
  constructor(scene) {
    this.kind = 'gatas';
    this.nome = 'Lina e Nina';
    this.portrait = { kind: 'gatas' };
    this.voice = { pitch: CONFIG.gatas[0].voz, wave: 'sine' };
    this.cats = CONFIG.gatas.map((def, i) => {
      const m = makeGatoModel(def.cores);
      scene.add(m.root);
      return { def, nome: def.nome.toLowerCase(), m, pos: new THREE.Vector3(), yaw: 0, phase: 0, move: 0, sit: 0, idle: 0, headYaw: 0, react: null, blink: 2 + i, seed: i * 2.3 };
    });
    this.fear = 0;
    this.talkTimer = 40;
    this.next = 0;
  }
  // a Lina é a âncora "oficial" (cinemática, borboletas); a Nina vai do outro lado
  get pos() { return this.cats[0].pos; }
  get anchor() { return this.cats[0].m.root; }
  get roots() { return this.cats.map((c) => c.m.root); }
  dispose() { for (const c of this.cats) c.m.root.removeFromParent(); }

  place(p) {
    for (const c of this.cats) { const x = p.x + c.def.lado, z = p.z + 1.2; c.pos.set(x, walkHeight(x, z), z); }
  }

  // sem prefixo, as duas se revezam
  say(text, time) {
    const [quem, s] = separarFalante(tx(text));
    const c = this.cats.find((k) => k.nome === quem) || this.cats[this.next];
    this.next = (this.cats.indexOf(c) + 1) % this.cats.length;
    G.ui?.bubbles.say(c.m.root, s, { y: 1.05, time });
    G.audio?.voice(s, c.def.voz, 'sine');
  }
  fala(gatilho, vars) { return falaPet(this.kind, gatilho, vars); }

  react_(kind) {
    this.cats.forEach((c, i) => (c.react = { kind, t: -i * 0.15 }));
    if (kind === 'heart') {
      for (const c of this.cats) G.particles.emit('coracoes', c.pos.x, c.pos.y + 0.9, c.pos.z);
      G.audio?.sfx('miau');
    }
  }

  update(dt, t) {
    const C = CONFIG.companion;
    const hero = G.hero;
    const fw = new THREE.Vector3(Math.sin(hero.yaw), 0, Math.cos(hero.yaw));
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    if (this.fear > 0) this.fear -= dt;
    this.cats.forEach((c, i) => {
      const m = c.m;
      const target = hero.pos.clone().addScaledVector(fw, -c.def.atras).addScaledVector(right, c.def.lado);
      const toT = target.clone().sub(c.pos); toT.y = 0;
      const dist = toT.length();
      if (hero.pos.distanceTo(c.pos) > C.teleportDist) c.pos.set(target.x, walkHeight(target.x, target.z), target.z);
      const moving = dist > 0.35 && !hero.riding;
      let step = 0;
      if (hero.riding) {
        // nos passeios elas vão junto; no barquinho, na proa
        const peer = hero.ridePeer ? hero.ridePeer.clone().addScaledVector(right, i * 0.45) : hero.pos.clone().add(new THREE.Vector3(c.def.lado * 0.5, 0.2, 0));
        c.pos.lerp(peer, damp(10, dt));
      } else if (moving) {
        step = Math.min(dist, C.speed * dt * clamp(dist / 1.2, 0.4, 1.4));
        c.pos.addScaledVector(toT.normalize(), step);
        c.yaw += wrapAngle(Math.atan2(toT.x, toT.z) - c.yaw) * damp(10, dt);
      } else {
        const tt = hero.pos.clone().sub(c.pos);
        c.yaw += wrapAngle(Math.atan2(tt.x, tt.z) - c.yaw) * damp(4, dt);
      }
      // uma não entra na outra
      const o = this.cats[1 - i];
      const dx = c.pos.x - o.pos.x, dz = c.pos.z - o.pos.z, dd = Math.hypot(dx, dz);
      if (!hero.riding && dd > 1e-4 && dd < 0.55) { const push = (0.55 - dd) * 0.5; c.pos.x += (dx / dd) * push; c.pos.z += (dz / dd) * push; }

      c.phase += step * 9;
      c.move = lerp(c.move, moving ? clamp(step / Math.max(dt, 1e-4) / 3, 0.4, 1) : 0, damp(10, dt));
      // senta (uma depois da outra) quando o herói para
      c.idle = hero.speed < 0.2 ? c.idle + dt : 0;
      c.sit = lerp(c.sit, c.idle > C.sitAfter + i * 0.6 && !moving ? 1 : 0, damp(5, dt));
      if (!hero.riding) c.pos.y = lerp(c.pos.y, walkHeight(c.pos.x, c.pos.z), damp(16, dt));
      m.root.position.copy(c.pos);
      m.root.rotation.y = c.yaw;
      animateGato(m, c, t);

      // reações: pulo com giro, tremidinha, coração, bochecha cheia; na névoa, pelo arrepiado
      let shake = 0, spin = 0, lift = 0, puff = 1, cheeks = 1;
      if (this.fear > 0) { shake = Math.sin(t * 60 + i) * 0.05; puff = 1.12; }
      const r = c.react;
      if (r) {
        r.t += dt;
        const k = Math.max(0, r.t);
        if (r.kind === 'laugh') { shake = Math.sin(k * 50) * 0.1; if (k > 0.3) c.react = null; }
        else if (r.kind === 'flip') { const q = Math.min(1, k / 0.6); spin = easeOutQuad(q) * Math.PI * 2; lift = Math.sin(q * Math.PI) * 0.6; if (k > 0.6) c.react = null; }
        else if (r.kind === 'heart') { if (k > 1.2) c.react = null; }
        else if (r.kind === 'cheeks') {
          cheeks = 1 + 0.25 * Math.sin(Math.min(1, k / 1.2) * Math.PI);
          if (k > 1.2) { c.react = null; if (i === 0) { G.particles.emit('farinha', c.pos.x, c.pos.y + 0.6, c.pos.z); G.audio?.sfx('arroto'); } }
        }
      }
      m.root.position.y += lift;
      m.root.rotation.y += spin;
      m.body.rotation.z = shake;
      m.body.scale.setScalar(puff);
      m.head.scale.setScalar(cheeks);

      // cabeça vira para bichos e raízes por perto; senão, para o herói
      const look = findInterest(c.pos) || hero.pos;
      const want = clamp(wrapAngle(Math.atan2(look.x - c.pos.x, look.z - c.pos.z) - c.yaw), -0.9, 0.9);
      c.headYaw = lerp(c.headYaw, moving ? 0 : want, damp(6, dt));
      m.head.rotation.y = c.headYaw;

      c.blink -= dt;
      const bl = c.blink < 0.12 && c.blink > 0;
      if (c.blink <= 0) c.blink = 2 + Math.random() * 3;
      for (const e of m.eyes) e.scale.y = bl ? 0.15 : 1;
    });

    // falas ociosas
    this.talkTimer -= dt;
    if (this.talkTimer <= 0 && G.mode === 'play' && !G.locks) {
      this.talkTimer = C.idleTalkMin + Math.random() * (C.idleTalkMax - C.idleTalkMin);
      this.say(this.fala('idle'));
    }
  }
}
