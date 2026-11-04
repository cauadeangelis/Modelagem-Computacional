// Herói: controle, física simples, colisão e escolha de animação (seções 6.3 e 6.4).
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG, HERO_NAME } from '../configuracao.js';
import { makeHumanoid, applyCosmetics, resetPose, swingPigtails } from './corpo-articulado.js';
import { animIdle, animLocomotion, animJump, animAction, jumpOffset, jumpAirborne, JUMP_TOTAL, ACTIONS } from './animacoes.js';
import { walkHeight, isWalkable, isWaterAt, inMud, surfaceAt } from '../mundo/chao.js';
import { regionAt, terrainHeight } from '../mundo/terreno.js';
import { mat, G_SPH } from '../utilitarios/geometria.js';
import { damp, wrapAngle, clamp, easeOutBack } from '../utilitarios/matematica.js';

const BLOCKING = new Set(['celebrate', 'dizzy', 'sit', 'enter', 'talk', 'surprise', 'bonk']);

export class Hero {
  constructor(scene, genero = 'm') {
    this.name = HERO_NAME;
    this.scene = scene;
    this.genero = genero;
    this.cosmetics = [];
    this.rig = makeHumanoid({ ...CONFIG.hero.colors, genero });
    scene.add(this.rig.root);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.targetYaw = 0;
    this.phase = 0; this.speed = 0;
    this.jumpT = -1; this.jumpBase = 0; this.jumpScale = 1;
    this.action = null;
    this.lastSafe = new THREE.Vector3();
    this.riding = null;
    this.inMud = false;
    this.lastSin = 0;
    this.stepSide = 1;
    this.region = -1;
    this.idleT = 0;
    // estrelinhas do "dizzy" e lâmpada do "think"
    this.stars = new THREE.Group();
    const sm = mat('#f2c14e', { emissive: '#7a5a00' });
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), sm); this.stars.add(s); }
    this.stars.visible = false;
    this.rig.head.add(this.stars);
    this.bulb = new THREE.Group();
    this.bulb.add(new THREE.Mesh(G_SPH(0.16, 10, 8), mat('#fff3b0', { emissive: '#c8a000' })));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 8), mat('#8a96a3')); base.position.y = -0.17; this.bulb.add(base);
    this.bulb.position.set(0.35, 0.75, 0);
    this.bulb.visible = false;
    this.rig.head.add(this.bulb);
  }

  get busy() { return !!this.riding || (this.action && BLOCKING.has(this.action.name)); }
  get airborne() { return this.jumpT >= 0 && jumpAirborne(this.jumpT / this.jumpScaleT); }
  get jumpScaleT() { return this.jumpScale > 1 ? 1.6 : 1; }
  headPos() { return this.pos.clone().add(new THREE.Vector3(0, 2.0, 0)); }

  place(x, z, yaw = this.yaw) {
    this.pos.set(x, walkHeight(x, z), z);
    this.vel.set(0, 0, 0);
    this.yaw = this.targetYaw = yaw;
    this.lastSafe.copy(this.pos);
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = yaw;
    this.rig.root.visible = true;
    this.rig.root.scale.set(1, 1, 1);
  }

  setCosmetics(list) { this.cosmetics = list; applyCosmetics(this.rig, list); }

  // troca o boneco (masculino/feminino) mantendo posição, cosméticos, estrelinhas e lâmpada
  setLook(genero) {
    if (genero === this.genero) return;
    this.genero = genero;
    const old = this.rig;
    this.rig = makeHumanoid({ ...CONFIG.hero.colors, genero });
    this.rig.root.position.copy(old.root.position);
    this.rig.root.rotation.y = old.root.rotation.y;
    this.rig.root.visible = old.root.visible;
    this.rig.head.add(this.stars, this.bulb);
    this.scene.remove(old.root);
    this.scene.add(this.rig.root);
    applyCosmetics(this.rig, this.cosmetics);
  }

  play(name, opts = {}) {
    this.action = { name, t: 0, dur: opts.dur ?? ACTIONS[name]?.dur ?? 1, onEnd: opts.onEnd };
    if (name === 'think') { this.bulb.visible = true; this.bulb.scale.setScalar(0); }
    if (name === 'surprise') G.ui?.bubbles.say(this.rig.root, '!', { y: 2.9, icon: true, time: 1.2 });
    if (name === 'celebrate') G.particles.emit('confete', this.pos.x, this.pos.y + 2, this.pos.z);
    return this.action;
  }
  stop(name) { if (!name || this.action?.name === name) this.endAction(); }
  endAction() {
    const a = this.action;
    this.action = null;
    this.bulb.visible = false;
    this.stars.visible = false;
    resetPose(this.rig);
    a?.onEnd?.();
  }

  jump(scale = 1) {
    if (this.jumpT >= 0 || this.busy) return false;
    this.jumpT = 0; this.jumpScale = scale; this.jumpBase = this.pos.y;
    G.audio?.sfx(scale > 1 ? 'mola' : 'pulo');
    return true;
  }

  // passeio: função que devolve {pos, yaw, pose} a cada quadro; termina quando devolve null
  ride(fn, pose = 'ride') {
    this.riding = { fn, pose, t: 0 };
    this.vel.set(0, 0, 0);
    this.jumpT = -1;
  }

  update(dt, t) {
    const H = CONFIG.hero;
    const rig = this.rig;
    if (this.riding) {
      const r = this.riding;
      r.t += dt;
      const o = r.fn(dt, r.t);
      if (!o) {
        this.riding = null;
        this.place(this.pos.x, this.pos.z, this.yaw);
      } else {
        this.pos.copy(o.pos);
        if (o.yaw !== undefined) this.yaw = o.yaw;
        rig.root.position.copy(this.pos);
        rig.root.rotation.y = this.yaw;
        animAction(rig, o.pose || r.pose, r.t, dt);
        this.speed = 0;
        return;
      }
    }

    // ---- entrada ----
    const inp = G.input;
    const canMove = !G.locks && G.mode === 'play' && !this.busy;
    let dir = new THREE.Vector3();
    let mag = 0;
    if (canMove) {
      const fw = G.camRig.forward();
      const right = new THREE.Vector3(-fw.z, 0, fw.x);
      if (inp.move.lengthSq() > 0.0001) {
        dir.addScaledVector(fw, inp.move.y).addScaledVector(right, inp.move.x);
        mag = Math.min(1, inp.move.length());
      } else if (inp.clickTarget) {
        const d = new THREE.Vector3(inp.clickTarget.x - this.pos.x, 0, inp.clickTarget.z - this.pos.z);
        if (d.length() < H.clickStop) inp.clickTarget = null;
        else { dir.copy(d); mag = 1; }
      }
      if (dir.lengthSq() > 0) dir.normalize();
      if (inp.hit('Space')) this.jump();
      // movimento cancela ações não bloqueantes
      if (mag > 0 && this.action && !BLOCKING.has(this.action.name)) this.endAction();
    } else if (this.action?.name === 'sit' && inp.move.lengthSq() > 0.01 && !G.locks) {
      this.endAction();
    }

    // ---- velocidade (aceleração 25, atrito 18) ----
    this.inMudNow = inMud(this.pos.x, this.pos.z);
    if (this.inMudNow && !this.inMud && !this.airborne) { G.audio?.sfx('plof'); G.particles.emit('lama', this.pos.x, this.pos.y + 0.1, this.pos.z); }
    this.inMud = this.inMudNow;
    let top = inp.run ? H.runSpeed : H.walkSpeed;
    if (this.inMud) top *= H.mudFactor;
    const target = dir.multiplyScalar(top * mag);
    const dv = target.clone().sub(this.vel); dv.y = 0;
    const rate = (mag > 0 ? H.accel : H.friction) * dt;
    if (dv.length() <= rate) this.vel.copy(target); else this.vel.addScaledVector(dv.normalize(), rate);
    this.vel.y = 0;
    this.speed = this.vel.length();

    // ---- deslocamento + colisão ----
    const air = this.airborne;
    const prev = this.pos.clone();
    let nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    if (!air && !isWalkable(nx, nz)) {
      if (isWalkable(nx, this.pos.z)) nz = this.pos.z;
      else if (isWalkable(this.pos.x, nz)) nx = this.pos.x;
      else { nx = this.pos.x; nz = this.pos.z; this.vel.set(0, 0, 0); }
    }
    const p = { x: nx, z: nz };
    G.collision.resolve(p, H.radius);
    if (!air && !isWalkable(p.x, p.z)) { p.x = prev.x; p.z = prev.z; }
    this.pos.x = p.x; this.pos.z = p.z;

    // ---- pulo ----
    const ground = walkHeight(this.pos.x, this.pos.z, this.pos.y);
    // saiu da beirada de uma plataforma: cai em arco em vez de teleportar para o chão
    if (this.jumpT < 0 && !this.riding && this.pos.y - ground > 0.6) {
      this.jumpScale = Math.max(1.01, (this.pos.y - ground) / H.jumpHeight);
      this.jumpBase = ground;
      this.jumpT = (H.jumpAnticip + H.jumpRise) * this.jumpScaleT;
    }
    if (this.jumpT >= 0) {
      const ts = this.jumpScaleT;
      const wasAir = this.airborne;
      this.jumpT += dt;
      const jt = this.jumpT / ts;
      this.jumpBase += (Math.max(ground, this.jumpBase - 0.5) - this.jumpBase) * damp(4, dt);
      this.pos.y = this.jumpBase + jumpOffset(jt) * this.jumpScale;
      if (wasAir && !this.airborne) {
        G.audio?.sfx('aterrissa');
        G.particles.emit('poeira', this.pos.x, ground + 0.05, this.pos.z, { count: 5 });
        if (isWaterAt(this.pos.x, this.pos.z)) this.splashBack();
      }
      if (jt >= JUMP_TOTAL) this.jumpT = -1;
    } else {
      this.pos.y += (ground - this.pos.y) * Math.min(1, damp(H.groundK, dt) * 1.4);
      if (Math.abs(ground - this.pos.y) > 1.5) this.pos.y = ground;
    }
    if (!this.airborne && isWalkable(this.pos.x, this.pos.z) && this.jumpT < 0) this.lastSafe.copy(this.pos);

    // ---- giro: yaw += (alvo − yaw)·(1 − e^(−14·dt)) ----
    if (this.speed > 0.15) this.targetYaw = Math.atan2(this.vel.x, this.vel.z);
    this.yaw += wrapAngle(this.targetYaw - this.yaw) * damp(H.turnK, dt);
    this.yaw = wrapAngle(this.yaw);

    rig.root.position.copy(this.pos);
    rig.root.rotation.y = this.yaw;

    // ---- animação ----
    if (this.action) {
      const a = this.action;
      a.t += dt;
      animAction(rig, a.name, a.t, dt);
      if (a.name === 'dizzy') {
        this.stars.visible = a.t < 2;
        this.stars.children.forEach((s, i) => { const ang = a.t * 4 + (i / 3) * Math.PI * 2; s.position.set(Math.cos(ang) * 0.5, 0.5, Math.sin(ang) * 0.5); s.rotation.y = a.t * 5; });
      }
      if (a.name === 'bonk') {
        this.stars.visible = a.t < 1;
        this.stars.children.forEach((s, i) => { const ang = a.t * 5 + (i / 3) * Math.PI * 2; s.position.set(Math.cos(ang) * 0.45, 0.55, Math.sin(ang) * 0.45); });
      }
      if (a.name === 'think') { const k = Math.min(1, a.t / 0.25); this.bulb.scale.setScalar(k < 1 ? easeOutBack(k) * 1.0 + (k < 0.6 ? 0.2 * k : 0) : 1); }
      if (a.t >= a.dur) this.endAction();
    } else if (this.jumpT >= 0) {
      resetPose(rig);
      animJump(rig, this.jumpT / this.jumpScaleT);
    } else if (this.speed > 0.2) {
      resetPose(rig);
      const run = this.speed > H.walkSpeed + 0.4;
      this.phase += dt * this.speed * H.phaseK;
      animLocomotion(rig, this.phase, run, clamp(this.speed / H.walkSpeed, 0.35, 1));
      this.footsteps(run);
    } else {
      resetPose(rig);
      animIdle(rig, t, dt);
    }
    this.idleT = this.speed < 0.1 && !this.action ? this.idleT + dt : 0;
    swingPigtails(rig, Math.min(1, this.speed / H.runSpeed), this.phase, t, this.jumpT >= 0);

    // região atual (banner + música)
    const r = regionAt(this.pos.x, this.pos.z);
    if (r !== this.region) { const old = this.region; this.region = r; G.events.emit('regionChange', r, old); }
  }

  footsteps(run) {
    const s = Math.sin(this.phase);
    if ((s >= 0) !== (this.lastSin >= 0)) {
      this.stepSide *= -1;
      const surf = surfaceAt(this.pos.x, this.pos.z, this.onPlaza());
      G.audio?.sfx('passo_' + surf);
      const r = regionAt(this.pos.x, this.pos.z);
      if (surf === 'areia' || r === 2 || r === 1) {
        G.ambient?.footprint(this.pos.x, this.pos.z, this.yaw, this.stepSide);
        G.particles.emit('poeira', this.pos.x, this.pos.y + 0.05, this.pos.z, { count: run ? 3 : 1, color: surf === 'areia' ? '#efdcaa' : '#b59a6a' });
      } else if (run) G.particles.emit('poeira', this.pos.x, this.pos.y + 0.05, this.pos.z, { count: 2 });
      if (this.inMud) G.particles.emit('lama', this.pos.x, this.pos.y + 0.05, this.pos.z, { count: 3 });
    }
    this.lastSin = s;
  }

  onPlaza() {
    for (const S of G.settlements) {
      const d = Math.hypot(this.pos.x - S.def.x, this.pos.z - S.def.z);
      if (d < S.plazaR) return true;
    }
    return false;
  }

  splashBack() {
    G.particles.emit('respingo', this.pos.x, CONFIG.water.y + 0.1, this.pos.z, { count: 16 });
    G.audio?.sfx('splash');
    G.events.emit('heroSplash');
    this.jumpT = -1;
    this.place(this.lastSafe.x, this.lastSafe.z, this.yaw);
  }
}
