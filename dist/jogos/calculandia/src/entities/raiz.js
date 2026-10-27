// Raízes Fugitivas (seção 11): escondidas em moitas suspeitas, fogem em zigue-zague.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { sph, box, cone, cyl, mat, mesh, bake, G_SPH } from '../utils/geo.js';
import { makeContactShadow } from './rig.js';
import { walkHeight, isWalkable } from '../world/ground.js';
import { wrapAngle } from '../utils/math.js';

export const RAIZ_TIPOS = {
  simples: { nome: 'Raiz Simples', cor: '#7cc35f', piada: 'Eu sou a solução, mas não vou facilitar.', ico: '🟢', jeito: 'foge em linha reta' },
  dupla: { nome: 'Raiz Dupla', cor: '#5fae4a', piada: 'A gente é uma só, mas pesa em dobro.', ico: '🟩', jeito: 'anda devagar e tropeça' },
  negativa: { nome: 'Raiz Negativa', cor: '#5f8fd9', piada: 'Estou no lado errado da vida.', ico: '🔵', jeito: 'anda de costas' },
  falsa: { nome: 'Raiz Falsa', cor: '#f4f4ff', piada: 'Eu parecia uma raiz, né? Polo, prazer.', ico: '👻', jeito: 'some ao ser tocada' },
  complexa: { nome: 'Raiz Complexa', cor: '#8e5bd1', piada: 'Metade de mim é imaginária.', ico: '🟣', jeito: 'fica invisível metade do tempo' },
  quadrada: { nome: 'Raiz Quadrada', cor: '#f2c14e', piada: 'Eu sou bem quadradona mesmo.', ico: '🟨', jeito: 'foge girando em quadrados' },
};
export const TIPOS_ORDEM = Object.keys(RAIZ_TIPOS);

function eyes(g, y, z, r = 0.075, inf = false) {
  for (const sx of [-1, 1]) {
    g.add(sph(r, '#ffffff', sx * 0.11, y, z, 6, 5));
    if (inf) { for (const dx of [-0.025, 0.025]) g.add(sph(r * 0.4, '#1a1a1a', sx * 0.11 + dx, y, z + r * 0.7, 4, 3)); }
    else g.add(sph(r * 0.5, '#1a1a1a', sx * 0.11, y, z + r * 0.6, 5, 4));
  }
}

export function makeRootModel(tipo) {
  const g = new THREE.Group();
  const T = RAIZ_TIPOS[tipo];
  const body = new THREE.Group(); g.add(body);
  let hat = null;
  if (tipo === 'quadrada') { body.add(box(0.55, 0.55, 0.55, T.cor, 0, 0.35, 0)); eyes(body, 0.42, 0.28); }
  else if (tipo === 'dupla') { body.add(sph(0.26, T.cor, -0.18, 0.3, 0, 8, 6)); body.add(sph(0.26, T.cor, 0.18, 0.3, 0, 8, 6)); eyes(body, 0.38, 0.22); }
  else if (tipo === 'falsa') {
    const m = new THREE.MeshLambertMaterial({ color: T.cor, transparent: true, opacity: 0.6 });
    const b = new THREE.Mesh(G_SPH(0.32, 10, 8), m); b.position.y = 0.38; b.scale.y = 1.2; body.add(b);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 8), m); tail.position.y = 0.1; tail.rotation.x = Math.PI; body.add(tail);
    eyes(body, 0.45, 0.27, 0.075, true);
  } else {
    body.add(sph(0.3, T.cor, 0, 0.32, 0, 10, 8));
    eyes(body, 0.38, 0.25);
    if (tipo === 'complexa') { hat = cone(0.18, 0.35, '#f2c14e', 0, 0.75, 0, 6); body.add(hat); }
  }
  if (tipo !== 'quadrada') { const leaf = cone(0.08, 0.3, '#3f9a3a', 0.05, 0.72, 0, 4); leaf.rotation.z = -0.4; leaf.scale.z = 0.4; body.add(leaf); }
  for (const sx of [-1, 1]) body.add(sph(0.07, '#3a2a1a', sx * 0.12, 0.05, 0.04, 5, 4));
  const shadow = makeContactShadow(0.32); g.add(shadow);
  g.traverse((m) => { if (m.isMesh && m !== shadow) m.castShadow = true; });
  return { g, body, hat };
}

function makeBush() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.IcosahedronGeometry(0.75, 0), '#4f8f3a', 0, 0.55, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.55, 0), '#5f9f44', 0.5, 0.45, 0.2));
  g.add(mesh(new THREE.IcosahedronGeometry(0.5, 0), '#3f7f32', -0.45, 0.4, -0.15));
  g.add(sph(0.08, '#f2c14e', 0.2, 1.1, 0.3, 4, 3));
  const baked = bake(g);
  return new THREE.Group().add(baked);
}

export class FugitiveRoot {
  constructor(scene, id, tipo, x, z, region) {
    this.id = id; this.tipo = tipo; this.region = region;
    this.home = new THREE.Vector3(x, walkHeight(x, z), z);
    this.bush = makeBush();
    this.bush.position.copy(this.home);
    scene.add(this.bush);
    this.m = makeRootModel(tipo);
    this.m.g.visible = false;
    scene.add(this.m.g);
    this.pos = this.home.clone();
    this.state = 'hidden';
    this.t = 0; this.dir = 0; this.zig = 1; this.zigT = 0; this.respawn = 0;
    this.visibleNow = false;
    this.caught = false;
    this.interactable = G.interaction.add({
      x, z, r: CONFIG.triggers.bush + 0.3, label: 'Mexer na moita suspeita', prio: 2,
      enabled: () => this.state === 'hidden' && !this.caught,
      action: () => this.popOut(),
    });
  }

  setCaught() {
    this.caught = true; this.state = 'done';
    this.m.g.visible = false; this.visibleNow = false;
    this.bush.scale.setScalar(0.8);
  }

  popOut() {
    this.state = 'flee';
    this.t = 0;
    this.pos.copy(this.home); this.pos.y += 0.6;
    this.vy = 5;
    this.m.g.visible = true; this.visibleNow = true;
    const away = Math.atan2(this.pos.x - G.hero.pos.x, this.pos.z - G.hero.pos.z);
    this.dir = away;
    G.particles.emit('folhas', this.home.x, this.home.y + 0.8, this.home.z);
    G.audio?.sfx('pop');
    G.raizinha?.say(RAIZ_TIPOS[this.tipo].piada);
    G.events.emit('rootOut', this);
  }

  update(dt, t) {
    const R = CONFIG.roots;
    const hero = G.hero;
    const dHero = Math.hypot(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z);
    // a moita treme quando o herói chega perto
    if (this.state === 'hidden') {
      const dh = Math.hypot(hero.pos.x - this.home.x, hero.pos.z - this.home.z);
      this.bush.rotation.z = dh < R.triggerDist ? Math.sin(t * 30) * 0.08 : Math.sin(t * 3 + this.home.x) * 0.01;
      if (dh < R.triggerDist && !this._hinted) { this._hinted = true; G.events.emit('bushNear', this); }
      if (dh > 8) this._hinted = false;
      return;
    }
    if (this.state === 'gone') {
      this.respawn -= dt;
      if (this.respawn <= 0) { this.state = 'hidden'; }
      return;
    }
    if (this.state !== 'flee') return;
    this.t += dt;
    let speed = R.speed;
    let face = this.dir;
    const away = Math.atan2(this.pos.x - hero.pos.x, this.pos.z - hero.pos.z);
    this.zigT -= dt;
    const tipo = this.tipo;
    if (this.zigT <= 0) {
      this.zigT = R.zigzag;
      this.zig *= -1;
      if (tipo === 'quadrada') this.dir = Math.round(this.dir / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 2;
      else if (tipo === 'simples') this.dir = away;
      else this.dir = away + this.zig * 0.7;
    }
    if (tipo === 'simples') this.dir += wrapAngle(away - this.dir) * Math.min(1, dt * 2);
    face = this.dir;
    if (tipo === 'dupla') { speed = 3.4; if (this.t % 1.6 > 1.2) speed = 0; }
    if (tipo === 'negativa') face = this.dir + Math.PI;
    let invisible = false;
    if (tipo === 'complexa') { invisible = Math.floor(this.t / 0.8) % 2 === 1; this.m.body.visible = !invisible; if (this.m.hat) this.m.hat.rotation.y += dt * 8; }
    this.visibleNow = !invisible;
    // move, evitando água e obstáculos
    let moved = false;
    for (const off of [0, 0.8, -0.8, 1.6, -1.6, Math.PI]) {
      const a = this.dir + off;
      const nx = this.pos.x + Math.sin(a) * speed * dt, nz = this.pos.z + Math.cos(a) * speed * dt;
      if (!isWalkable(nx, nz)) continue;
      const p = { x: nx, z: nz };
      if (G.collision.resolve(p, 0.3) && Math.hypot(p.x - nx, p.z - nz) > 0.2) continue;
      this.pos.x = p.x; this.pos.z = p.z;
      if (off !== 0) this.dir = a;
      moved = true;
      break;
    }
    const ground = walkHeight(this.pos.x, this.pos.z);
    this.vy = (this.vy ?? 0) - 18 * dt;
    this.pos.y = Math.max(ground, this.pos.y + this.vy * dt);
    if (this.pos.y <= ground) this.vy = 0;
    const g = this.m.g;
    g.position.copy(this.pos);
    g.rotation.y = face;
    const hop = moved && speed > 0 ? Math.abs(Math.sin(this.t * 14)) * 0.18 : 0;
    this.m.body.position.y = hop;
    if (tipo === 'dupla' && speed === 0) this.m.body.rotation.z = Math.sin(this.t * 20) * 0.3; else this.m.body.rotation.z = 0;

    // pegar!
    if (dHero < R.catchDist && !invisible && this.pos.y - ground < 0.5) {
      this.state = 'done';
      this.caught = true;
      g.visible = false; this.visibleNow = false;
      G.particles.emit(tipo === 'falsa' ? 'fumaca' : 'confete', this.pos.x, this.pos.y + 0.5, this.pos.z, { count: 25 });
      G.events.emit('rootCaught', this);
      return;
    }
    if (this.t > R.escapeTime) {
      // escapou: some e volta para a moita depois
      this.state = 'gone';
      this.respawn = R.respawn;
      g.visible = false; this.visibleNow = false;
      G.particles.emit('fumaca', this.pos.x, this.pos.y + 0.4, this.pos.z);
      G.events.emit('rootEscaped', this);
    }
  }
}
