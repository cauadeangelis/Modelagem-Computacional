// A Raizinha (seção 6.2): mandioquinha de olhos enormes que segue o herói pulando.
// É um dos pets (o outro é Lina e Nina, em gatas.js); os dois têm a mesma interface:
// kind, nome, portrait, voice, pos, anchor, roots, place, say, fala, react_, fear, update, dispose.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { sph, cone, cyl, mat, G_SPH } from '../utilitarios/geometria.js';
import { makeContactShadow } from './corpo-articulado.js';
import { damp, wrapAngle, clamp, lerp, easeOutQuad } from '../utilitarios/matematica.js';
import { walkHeight } from '../mundo/chao.js';
import { falaPet, tx } from '../dados/falas.js';

export function makeRaizinhaModel(colors = {}) {
  const c = { corpo: '#c58a54', anel: '#a06a38', folha: '#5fbf5a', ...colors };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const pivot = new THREE.Group(); pivot.position.y = 0.4; body.add(pivot);
  const corpo = cone(0.28, 0.8, c.corpo, 0, 0, 0, 10); corpo.rotation.x = Math.PI; pivot.add(corpo);
  // 3 anéis mais escuros acompanhando o raio do cone
  for (const [y, h] of [[0.15, 0.04], [-0.05, 0.04], [-0.22, 0.035]]) {
    const r = 0.28 * (0.5 + y / 0.8) + 0.012;
    pivot.add(cyl(r, r - 0.012, h, c.anel, 0, y, 0, 10));
  }
  const leaves = new THREE.Group(); leaves.position.y = 0.4; pivot.add(leaves);
  for (let k = 0; k < 3; k++) {
    const l = cone(0.1, 0.42, c.folha, 0, 0.18, 0, 5);
    l.scale.z = 0.35;
    const g = new THREE.Group(); g.rotation.y = (k / 3) * Math.PI * 2; g.rotation.z = 0.35; g.add(l);
    leaves.add(g);
  }
  const eyes = [], pupils = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.1, 0.12, 0.17);
    e.add(new THREE.Mesh(G_SPH(0.12, 10, 8), mat('#ffffff')));
    const p = new THREE.Mesh(G_SPH(0.06, 8, 6), mat('#1a1a1a')); p.position.z = 0.08; e.add(p);
    pivot.add(e); eyes.push(e); pupils.push(p);
  }
  const arms = [], feet = [];
  for (const sx of [-1, 1]) {
    const a = sph(0.07, c.corpo, sx * 0.27, -0.02, 0.02, 6, 5); pivot.add(a); arms.push(a);
    const f = sph(0.07, c.anel, sx * 0.1, -0.36, 0.04, 6, 5); body.add(f); f.position.y = 0.04; feet.push(f);
  }
  const shadow = makeContactShadow(0.32); root.add(shadow);
  root.traverse((m) => {
    // só peças grandes projetam sombra (olhos, bochechas e detalhes não): menos draw calls no passe de sombra
    if (!m.isMesh || m === shadow) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    m.castShadow = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z) > 0.2;
  });
  return { root, body, pivot, leaves, eyes, pupils, arms, feet, shadow };
}

export class Raizinha {
  constructor(scene) {
    this.kind = 'raizinha';
    this.nome = 'Raizinha';
    this.portrait = { kind: 'raizinha' };
    this.voice = { pitch: 660, wave: 'triangle' };
    this.m = makeRaizinhaModel();
    scene.add(this.m.root);
    this.pos = new THREE.Vector3();
    this.yaw = 0;
    this.hopT = 0;
    this.hopping = false;
    this.idle = 0;
    this.react = null; // { kind, t }
    this.lookTarget = null;
    this.talkTimer = 40;
    this.fear = 0;
    this.cheeks = 0;
  }
  place(p) { this.pos.set(p.x + 1.2, walkHeight(p.x + 1.2, p.z + 1.2), p.z + 1.2); }
  get anchor() { return this.m.root; }
  get roots() { return [this.m.root]; }
  dispose() { this.m.root.removeFromParent(); }

  say(text, time) { text = tx(text); G.ui?.bubbles.say(this.m.root, text, { y: 1.25, time }); G.audio?.voice(text, 660, 'triangle'); }
  fala(gatilho, vars) { return falaPet(this.kind, gatilho, vars); }

  react_(kind) { this.react = { kind, t: 0 }; if (kind === 'heart') G.particles.emit('coracoes', this.pos.x, this.pos.y + 1, this.pos.z); }

  update(dt, t) {
    const C = CONFIG.companion;
    const hero = G.hero;
    const m = this.m;
    // alvo: atrás e à direita do herói
    const fw = new THREE.Vector3(Math.sin(hero.yaw), 0, Math.cos(hero.yaw));
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    const target = hero.pos.clone().addScaledVector(fw, -1.35).addScaledVector(right, -1.0);
    const toT = target.clone().sub(this.pos); toT.y = 0;
    const dist = toT.length();
    if (hero.pos.distanceTo(this.pos) > C.teleportDist) { this.place(hero.pos); }
    const moving = dist > 0.35 && !hero.riding;
    if (hero.riding) {
      // nos passeios ela vai junto (fica no colo/lado)
      // nos passeios ela vai junto; no barquinho, na proa
      if (hero.ridePeer) this.pos.copy(hero.ridePeer);
      else this.pos.lerp(hero.pos.clone().add(new THREE.Vector3(0.5, 0.2, 0)), damp(10, dt));
    } else if (moving) {
      const step = Math.min(dist, C.speed * dt * clamp(dist / 1.2, 0.4, 1.4));
      this.pos.addScaledVector(toT.normalize(), step);
      this.yaw += wrapAngle(Math.atan2(toT.x, toT.z) - this.yaw) * damp(10, dt);
    } else {
      // olha para o herói quando parada
      const tt = hero.pos.clone().sub(this.pos);
      this.yaw += wrapAngle(Math.atan2(tt.x, tt.z) - this.yaw) * damp(4, dt);
    }
    const ground = walkHeight(this.pos.x, this.pos.z);
    // pulinhos: período 0,45 s, altura 0,18, estica 1,1 / amassa 0,9
    if (moving || this.hopping) {
      this.hopT += dt / C.hopPeriod;
      if (this.hopT >= 1) { this.hopT -= 1; this.hopping = moving; }
    } else this.hopT = 0;
    const ph = this.hopT;
    const hop = moving || this.hopping ? Math.sin(ph * Math.PI) * C.hopHeight : 0;
    let sy = 1;
    if (moving) sy = ph < 0.5 ? lerp(1.1, 1, ph * 2) : ph > 0.9 ? 0.9 : 1;
    if (!hero.riding) this.pos.y = lerp(this.pos.y, ground, damp(16, dt));
    m.root.position.set(this.pos.x, this.pos.y + hop, this.pos.z);
    m.root.rotation.y = this.yaw;

    // sentar se o herói parar mais de 1,5 s
    this.idle = hero.speed < 0.2 ? this.idle + dt : 0;
    const sitting = this.idle > C.sitAfter && !moving;
    m.pivot.position.y = lerp(m.pivot.position.y, sitting ? 0.32 : 0.4, damp(6, dt));
    m.leaves.rotation.y += dt * (sitting ? 6 : 1.5);
    m.leaves.children.forEach((l, i) => (l.rotation.z = 0.35 + Math.sin(t * 4 + i) * 0.12));

    // reações
    let tilt = 0, shake = 0, flip = 0, scale = 1;
    // inclina em direção a bichos e coletáveis a menos de 8
    const interest = findInterest(this.pos);
    if (interest) {
      const d = interest.clone().sub(this.pos);
      tilt = 0.18;
      this.lookTarget = interest;
      if (!this._lastInterest || this._lastInterest.distanceTo(interest) > 3) this._lastInterest = interest.clone();
    } else this.lookTarget = hero.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
    if (this.fear > 0) { this.fear -= dt; shake = Math.sin(t * 60) * 0.06; }
    if (this.react) {
      this.react.t += dt;
      const k = this.react.t;
      if (this.react.kind === 'laugh') { shake = Math.sin(k * 50) * 0.12; if (k > 0.3) this.react = null; }
      else if (this.react.kind === 'flip') { flip = easeOutQuad(Math.min(1, k / 0.6)) * Math.PI * 2; m.root.position.y += Math.sin(Math.min(1, k / 0.6) * Math.PI) * 0.7; if (k > 0.6) this.react = null; }
      else if (this.react.kind === 'heart') { if (k > 1.2) this.react = null; }
      else if (this.react.kind === 'cheeks') { scale = 1 + 0.3 * Math.sin(Math.min(1, k / 1.2) * Math.PI); if (k > 1.2) { this.react = null; G.particles.emit('farinha', this.pos.x, this.pos.y + 0.8, this.pos.z); G.audio?.sfx('arroto'); } }
    }
    m.pivot.rotation.x = tilt;
    m.pivot.rotation.z = shake;
    m.body.rotation.x = flip;
    m.body.scale.set(scale, sy * scale, scale);
    // pupilas olham para o alvo de interesse
    if (this.lookTarget) {
      const local = m.pivot.worldToLocal(this.lookTarget.clone());
      local.normalize();
      for (const p of m.pupils) p.position.set(local.x * 0.04, local.y * 0.04, 0.08);
    }
    // piscar
    this._blink = (this._blink ?? 3) - dt;
    const bl = this._blink < 0.12 && this._blink > 0;
    if (this._blink <= 0) this._blink = 2 + Math.random() * 3;
    for (const e of m.eyes) e.scale.y = bl ? 0.15 : 1;

    // falas ociosas
    this.talkTimer -= dt;
    if (this.talkTimer <= 0 && G.mode === 'play' && !G.locks) {
      this.talkTimer = C.idleTalkMin + Math.random() * (C.idleTalkMax - C.idleTalkMin);
      this.say(this.fala('idle'));
    }
  }
}

// bicho ou Raiz Fugitiva visível mais perto (até 8): o pet inclina e olha para lá
export function findInterest(pos) {
  let best = null, bd = CONFIG.companion.lookDist;
  for (const a of G.animals) { const d = a.pos.distanceTo(pos); if (d < bd) { bd = d; best = a.pos.clone().add(new THREE.Vector3(0, 0.8, 0)); } }
  for (const r of G.roots) { if (!r.visibleNow) continue; const d = r.pos.distanceTo(pos); if (d < bd) { bd = d; best = r.pos.clone(); } }
  return best;
}
