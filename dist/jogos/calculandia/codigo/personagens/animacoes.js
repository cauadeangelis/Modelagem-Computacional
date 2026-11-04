// Animações procedurais do herói (seção 6.3): seno, easing e interpolação.
import { resetPose } from './corpo-articulado.js';
import { ease, easeOutQuad, easeInQuad, easeOutBack, clamp, lerp } from '../utilitarios/matematica.js';
import { CONFIG } from '../configuracao.js';

const H = CONFIG.hero;
export const JUMP_TOTAL = H.jumpAnticip + H.jumpRise + H.jumpFall + H.jumpLand;

// Estado interno de idle por rig (olhar, piscar)
function idleState(rig) {
  return (rig._idle ||= { look: 0, lookT: 0, nextLook: 3 + Math.random() * 3, hold: 0, blink: 2 + Math.random() * 3, blinkT: 0, from: 0, to: 0 });
}

export function animIdle(rig, t, dt) {
  const s = idleState(rig);
  rig.torso.scale.y = 1 + 0.02 * Math.sin(2.2 * t);
  // vira a cabeça a cada 3–6 s (±0,6 rad em 0,5 s) e segura 1,2 s
  s.nextLook -= dt;
  if (s.nextLook <= 0 && s.lookT <= 0) {
    s.from = s.look; s.to = (Math.random() * 2 - 1) * 0.6; s.lookT = 0.5; s.hold = 1.2; s.nextLook = 3 + Math.random() * 3;
  }
  if (s.lookT > 0) {
    s.lookT -= dt;
    s.look = lerp(s.from, s.to, ease(1 - Math.max(0, s.lookT) / 0.5));
  } else if (s.hold > 0) {
    s.hold -= dt;
    if (s.hold <= 0) { s.from = s.look; s.to = 0; s.lookT = 0.5; }
  }
  rig.head.rotation.y = s.look;
  rig.armL.rotation.x = Math.sin(t * 1.3) * 0.04;
  rig.armR.rotation.x = -Math.sin(t * 1.3) * 0.04;
  rig.armL.rotation.z = 0.04; rig.armR.rotation.z = -0.04;
  blink(rig, dt);
}

export function blink(rig, dt) {
  const s = idleState(rig);
  s.blink -= dt;
  if (s.blink <= 0) { s.blinkT = 0.12; s.blink = 2 + Math.random() * 3; }
  let sy = 1;
  if (s.blinkT > 0) { s.blinkT -= dt; sy = 0.1; }
  for (const e of rig.eyes) e.scale.y = sy;
}

// walk/run: pernas ±sin(fase)·amp, braços em oposição, pelve sobe e desce
export function animLocomotion(rig, phase, run, k = 1) {
  const legA = (run ? 1.05 : 0.75) * k, armA = (run ? 0.9 : 0.6) * k;
  const s = Math.sin(phase);
  rig.legL.rotation.x = s * legA;
  rig.legR.rotation.x = -s * legA;
  rig.armL.rotation.x = -s * armA;
  rig.armR.rotation.x = s * armA;
  rig.armL.rotation.z = 0.08; rig.armR.rotation.z = -0.08;
  const bob = (run ? 0.12 : 0.06) * k;
  rig.pelvis.position.y = 0.9 + Math.abs(Math.cos(phase)) * bob - bob * 0.5;
  rig.torso.rotation.x = (run ? 0.22 : 0.05) * k;
  rig.torso.rotation.y = s * 0.08 * k;
  rig.head.rotation.x = -(run ? 0.15 : 0.03) * k;
}

// Pulo: antecipação 0,10 s, subida 0,28 s até 1,1, descida 0,28 s, aterrissagem 0,12 s
export function jumpOffset(t) {
  const a = H.jumpAnticip, r = H.jumpRise, f = H.jumpFall;
  if (t < a) return 0;
  if (t < a + r) return H.jumpHeight * easeOutQuad((t - a) / r);
  if (t < a + r + f) return H.jumpHeight * (1 - easeInQuad((t - a - r) / f));
  return 0;
}
export function jumpAirborne(t) { return t >= H.jumpAnticip && t < H.jumpAnticip + H.jumpRise + H.jumpFall; }

export function animJump(rig, t) {
  const a = H.jumpAnticip, r = H.jumpRise, f = H.jumpFall, l = H.jumpLand;
  if (t < a) {
    const k = t / a;
    rig.pelvis.position.y = 0.9 - 0.15 * k;
    rig.body.scale.set(1 + 0.05 * k, 1 - 0.1 * k, 1 + 0.05 * k);
    rig.armL.rotation.x = rig.armR.rotation.x = 0.5 * k;
  } else if (t < a + r + f) {
    rig.body.scale.set(1, 1, 1);
    rig.armL.rotation.x = rig.armR.rotation.x = -2.4;
    rig.legL.rotation.x = 0.35; rig.legR.rotation.x = -0.2;
  } else if (t < a + r + f + l) {
    const k = (t - a - r - f) / l;
    const sq = Math.sin(k * Math.PI);
    rig.body.scale.set(1 + 0.12 * sq, 1 - 0.12 * sq, 1 + 0.12 * sq);
    rig.armL.rotation.x = rig.armR.rotation.x = lerp(-2.4, 0, k);
  }
}

// Ações com duração fixa
export const ACTIONS = {
  wave: { dur: 1.2 },
  talk: { dur: Infinity },
  celebrate: { dur: 2.2 },
  dizzy: { dur: 2.5 },
  think: { dur: Infinity },
  sit: { dur: Infinity },
  surprise: { dur: 0.6 },
  enter: { dur: 1.2 },
  bonk: { dur: 1.2 },
};

export function animAction(rig, name, t, dt, extra = {}) {
  resetPose(rig);
  switch (name) {
    case 'wave': {
      rig.armR.rotation.x = -2.6;
      rig.armR.rotation.z = -0.35 * Math.sin(t * Math.PI * 2 * 6);
      rig.head.rotation.z = 0.08;
      blink(rig, dt);
      break;
    }
    case 'talk': {
      animIdle(rig, t, dt);
      rig.head.rotation.x = Math.sin(8 * t) * 0.06;
      rig.armL.rotation.x = Math.sin(t * 3) * 0.2 - 0.2;
      break;
    }
    case 'celebrate': {
      // 2 pulos seguidos, braços para cima, giro de 360° em 0,8 s
      const j = t < 1.2 ? Math.abs(Math.sin((t / 0.6) * Math.PI)) * 0.8 : 0;
      rig.body.position.y = j;
      rig.armL.rotation.x = rig.armR.rotation.x = -2.7;
      rig.armL.rotation.z = 0.3; rig.armR.rotation.z = -0.3;
      if (t > 1.2 && t < 2.0) rig.body.rotation.y = ease((t - 1.2) / 0.8) * Math.PI * 2;
      rig.mouth.scale.set(1.6, 3, 1);
      break;
    }
    case 'dizzy': {
      // senta, estrelas orbitam a cabeça por 2 s, depois levanta em 0,5 s
      const down = t < 2 ? 1 : 1 - clamp((t - 2) / 0.5, 0, 1);
      rig.pelvis.position.y = 0.9 - 0.35 * down;
      rig.legL.rotation.x = rig.legR.rotation.x = -1.3 * down;
      rig.head.rotation.z = Math.sin(t * 5) * 0.15 * down;
      rig.torso.rotation.x = -0.15 * down;
      rig.armL.rotation.z = 0.5 * down; rig.armR.rotation.z = -0.5 * down;
      for (const e of rig.eyes) e.scale.y = 0.35;
      break;
    }
    case 'think': {
      rig.armR.rotation.x = -1.9;
      rig.armR.rotation.z = 0.35;
      rig.head.rotation.z = 0.15;
      rig.torso.scale.y = 1 + 0.02 * Math.sin(2.2 * t);
      blink(rig, dt);
      break;
    }
    case 'sit': {
      // pelve −0,45, pernas à frente 1,4 rad, mãos esticadas para o fogo
      const k = easeOutQuad(clamp(t / 0.4, 0, 1));
      rig.pelvis.position.y = 0.9 - 0.45 * k;
      rig.legL.rotation.x = rig.legR.rotation.x = -1.4 * k;
      rig.armL.rotation.x = rig.armR.rotation.x = -1.2 * k;
      rig.torso.rotation.x = 0.1 * k;
      rig.torso.scale.y = 1 + 0.015 * Math.sin(2 * t);
      blink(rig, dt);
      break;
    }
    case 'surprise': {
      const k = clamp(t / 0.3, 0, 1);
      rig.body.position.y = Math.sin(k * Math.PI) * 0.35;
      rig.body.position.z = -0.3 * easeOutQuad(k);
      rig.armL.rotation.x = rig.armR.rotation.x = -2.5;
      rig.armL.rotation.z = 0.5; rig.armR.rotation.z = -0.5;
      for (const e of rig.eyes) e.scale.setScalar(1.4);
      break;
    }
    case 'enter': {
      animLocomotion(rig, t * 8, false);
      break;
    }
    case 'bonk': {
      rig.head.rotation.z = Math.sin(t * 14) * 0.2 * (1 - t / 1.2);
      rig.body.scale.y = 1 - 0.08 * Math.max(0, 1 - t * 3);
      for (const e of rig.eyes) e.scale.y = 0.4;
      break;
    }
    case 'ride': {
      rig.armL.rotation.x = rig.armR.rotation.x = -2.9;
      rig.legL.rotation.x = 0.3 + Math.sin(t * 6) * 0.1; rig.legR.rotation.x = -0.1 - Math.sin(t * 6) * 0.1;
      break;
    }
    case 'seat': {
      rig.pelvis.position.y = 0.9 - 0.4;
      rig.legL.rotation.x = rig.legR.rotation.x = -1.4;
      rig.armL.rotation.x = rig.armR.rotation.x = -0.6 + Math.sin(t * 2) * 0.05;
      blink(rig, dt);
      break;
    }
  }
}

export { easeOutBack };
