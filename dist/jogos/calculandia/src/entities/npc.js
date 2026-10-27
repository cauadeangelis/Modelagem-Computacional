// Moradores: mesmo modelo do herói com outras cores, andando em círculo de raio 4 na praça (seção 5.2).
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { makeHumanoid, compactRig } from './rig.js';
import { animLocomotion, animIdle, animAction } from './animations.js';
import { walkHeight } from '../world/ground.js';
import { fala } from '../data/dialogs.js';
import { mulberry32, hashString } from '../utils/math.js';

const SKINS = ['#f2c9a0', '#d9a37a', '#a8724a', '#7a4e2d', '#f6d7b8', '#c48a5c'];
const SUITS = ['#e8554a', '#3cc0a0', '#8e5bd1', '#f28ab2', '#5cb85c', '#e07a3f', '#7ab8f5', '#b5754a'];
const VESTS = ['#fff7e6', '#f2c14e', '#9ad37a', '#ffffff', '#c9cdd3'];
const HATS = ['#5f8fd9', '#e8454a', '#f2c14e', '#9ad37a', '#ffffff', '#8b5a2b'];

export class NPC {
  constructor(scene, s, index, count = 2) {
    const rnd = mulberry32(hashString(s.def.id) + index * 977);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    this.rig = compactRig(makeHumanoid({ pele: pick(SKINS), macacao: pick(SUITS), colete: pick(VESTS), capacete: pick(HATS) }));
    this.rig.root.scale.setScalar(0.92);
    scene.add(this.rig.root);
    this.s = s;
    this.angle = (index / count) * Math.PI * 2 + rnd();
    this.dir = index % 2 ? 1 : -1;
    this.pos = new THREE.Vector3();
    this.phase = 0;
    this.wave = 0;
    this.pause = 0;
    this.talkCool = 2 + rnd() * 4;
    this.party = 0;
    this.index = index;
  }

  doWave(delay = 0) { this.waveDelay = delay; this.wave = 1.2; }

  update(dt, t) {
    const N = CONFIG.npc;
    const c = this.s.center;
    const hero = G.hero;
    const dHero = hero.pos.distanceTo(this.pos);
    if (this.waveDelay > 0) { this.waveDelay -= dt; }
    const stopped = dHero < 2.2 || this.wave > 0 || this.pause > 0 || this.party > 0;
    if (!stopped) {
      this.angle += (this.dir * N.speed * dt) / N.radius;
      this.phase += dt * N.speed * CONFIG.hero.phaseK * 1.6;
    }
    this.pause = Math.max(0, this.pause - dt);
    const r = N.radius + 0.6 * Math.sin(this.angle * 2 + this.index);
    this.pos.set(c.x + Math.cos(this.angle) * r, 0, c.z + Math.sin(this.angle) * r);
    this.pos.y = walkHeight(this.pos.x, this.pos.z);
    const root = this.rig.root;
    root.position.copy(this.pos);
    if (stopped && dHero < 4) root.rotation.y = Math.atan2(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z);
    else root.rotation.y = Math.atan2(-Math.sin(this.angle) * this.dir, Math.cos(this.angle) * this.dir);

    if (this.party > 0) {
      this.party -= dt;
      animAction(this.rig, 'celebrate', (t + this.index * 0.4) % 2.2, dt);
    } else if (this.wave > 0 && !(this.waveDelay > 0)) {
      this.wave -= dt;
      animAction(this.rig, 'wave', 1.2 - this.wave, dt);
    } else if (stopped) {
      animIdle(this.rig, t + this.index, dt);
      this.rig.legL.rotation.x = this.rig.legR.rotation.x = 0;
      this.rig.pelvis.position.y = 0.9;
    } else {
      animLocomotion(this.rig, this.phase, false, 0.9);
    }

    // fala em balão ao chegar perto
    this.talkCool -= dt;
    if (dHero < N.talkDist && this.talkCool <= 0 && G.mode === 'play') {
      this.talkCool = N.talkCooldown + Math.random() * 6;
      G.ui?.bubbles.say(root, fala(this.s.complete ? 'npc_festa' : 'npc'), { y: 2.7 });
      G.audio?.voice('oi', 300 + this.index * 80, 'triangle', 4);
    }
  }
}
