// Cinemática de abertura (seção 15.1): 45 s, pulável segurando Espaço por 1 s.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { CINE, PET_TUTORIAL } from '../dados/falas.js';
import { shoreRadius, terrainHeight, WATER_Y } from '../mundo/terreno.js';
import { walkHeight } from '../mundo/chao.js';
import { box, cyl, cone } from '../utilitarios/geometria.js';
import { ease, easeOutBack, lerp, clamp } from '../utilitarios/matematica.js';
import { flash, fade } from '../interface/transicoes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function landingPoint() {
  const sr = shoreRadius(Math.PI / 2);
  return V(1, 0, sr - 3.2);
}

function makeBoat() {
  const g = new THREE.Group();
  g.add(box(1.6, 0.5, 3.0, '#a8764a', 0, 0.1, 0));
  const bow = cone(0.8, 1.0, '#a8764a', 0, 0.1, 1.9, 4); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 0.6); g.add(bow);
  g.add(box(1.7, 0.12, 3.1, '#8b5a2b', 0, 0.38, 0));
  g.add(cyl(0.05, 0.05, 2.2, '#6b4423', 0, 1.4, -0.3, 4));
  g.add(box(0.05, 1.2, 1.0, '#f4ead8', 0.05, 1.7, 0.1));
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return g;
}

export function playCinematic() {
  return new Promise((resolve) => {
    const el = document.getElementById('cine');
    const title = document.getElementById('cine-title');
    const sub = document.getElementById('cine-sub');
    const bar = document.getElementById('cine-skip-bar');
    el.classList.remove('hidden');
    title.innerHTML = 'Calculândia'.split('').map((c) => `<span>${c}</span>`).join('');
    sub.textContent = '';
    const letters = [...title.children];
    // vista aérea: névoa e plano distante maiores durante a cinemática
    const fog = G.scene.fog, saved = { near: fog.near, far: fog.far, cam: G.camera.far };
    fog.near = 260; fog.far = 650; G.camera.far = 900; G.camera.updateProjectionMatrix();
    const land = landingPoint();
    const boat = makeBoat();
    G.scene.add(boat);
    const boatFrom = V(land.x + 1.5, WATER_Y, land.z + 34), boatTo = V(land.x + 1.5, WATER_Y, land.z + 3.6);
    let t = 0, hold = 0, done = false, exploded = false, said = [false, false, false], jumped = false;
    const layered = [];
    const hero = G.hero, rz = G.pet;
    hero.place(boatFrom.x, boatFrom.z, Math.PI);
    hero.rig.root.visible = false;
    const regions = [[-62, 50], [-75, -28], [8, -88], [76, -32], [68, 48]];
    let pointerHold = false;
    el.onpointerdown = () => (pointerHold = true);
    el.onpointerup = el.onpointercancel = () => (pointerHold = false);

    const finish = async () => {
      if (done) return;
      done = true;
      await fade(true, 0.5);
      G.scene.remove(boat);
      if (G.audio) G.audio.region = null; // a troca de região seguinte limpa as camadas da panorâmica
      fog.near = saved.near; fog.far = saved.far; G.camera.far = saved.cam; G.camera.updateProjectionMatrix();
      G.camRig.override = null;
      hero.riding = null;
      hero.place(land.x, land.z, Math.PI);
      rz.place(hero.pos);
      G.camRig.snap(hero.pos);
      el.classList.add('hidden');
      el.onpointerdown = el.onpointerup = null;
      await fade(false, 0.6);
      resolve();
    };

    G.camRig.override = (dt) => {
      t += dt;
      if (G.input.down('Space') || pointerHold) { hold += dt; bar.style.width = `${Math.min(1, hold) * 80}px`; if (hold >= 1) finish(); }
      else { hold = 0; bar.style.width = '0'; }
      const pos = V(), look = V();
      // letras do título quicando (easeOutBack, 80 ms entre letras)
      letters.forEach((s, i) => { const k = clamp((t - 1 - i * 0.08) / 0.4, 0, 1); s.style.transform = `scale(${t > 13 ? Math.max(0, 1 - (t - 13) * 2) : easeOutBack(k)})`; });
      if (t < 6) {
        const k = t / 6, a = 0.6 + k * 1.6;
        const r = lerp(190, 120, ease(k));
        pos.set(Math.cos(a) * r, lerp(170, 95, ease(k)), Math.sin(a) * r);
        look.set(0, 0, 0);
      } else if (t < 14) {
        const k = (t - 6) / 8;
        pos.set(lerp(42, 26, k), lerp(30, 20, k), lerp(50, 34, k));
        look.set(0, 3, 0);
        if (Math.random() < dt * 8) G.particles.emit('faiscas', (Math.random() - 0.5) * 4, 5, (Math.random() - 0.5) * 4);
        if (!exploded && t > 8) {
          exploded = true;
          G.audio.sfx('explosao');
          flash('#b7ff3c', 0.8);
          G.camRig.shake(1.2, 0.5);
          for (let i = 0; i < 4; i++) G.particles.emit('raizes', 0, 5, 0);
          G.ui.bubbles.sayAt(V(0, 9, 0), CINE.vilao, { villain: true, time: 4.5 });
          G.audio.voice(CINE.vilao, 110, 'sawtooth', 16);
        }
      } else if (t < 22) {
        const k = clamp((t - 14) / 5.5, 0, 1);
        boat.position.lerpVectors(boatFrom, boatTo, ease(k));
        boat.position.y = WATER_Y + 0.3 + Math.sin(t * 2) * 0.08;
        boat.rotation.z = Math.sin(t * 1.6) * 0.04;
        if (t < 19.6) {
          hero.rig.root.visible = true;
          hero.ride(() => ({ pos: boat.position.clone().add(V(0, 0.45, 0.2)), yaw: Math.PI, pose: 'seat' }), 'seat');
          rz.pos.copy(boat.position).add(V(0.4, 0.45, -0.9));
        } else if (!jumped) {
          jumped = true;
          // o herói salta do barco e o pet pula atrás
          const from = hero.pos.clone();
          hero.ride((d, tt) => {
            const kk = Math.min(1, tt / 0.6);
            if (tt > 0.75) return null;
            const p = from.clone().lerp(V(land.x, walkHeight(land.x, land.z), land.z), kk);
            p.y += Math.sin(kk * Math.PI) * 1.4;
            return { pos: p, yaw: Math.PI, pose: 'ride' };
          });
          G.audio.sfx('pulo');
          setTimeout(() => { G.audio.sfx('splash'); G.particles.emit('respingo', land.x, WATER_Y, land.z + 1); }, 600);
        }
        if (t > 20.5) rz.place(V(land.x - 1, 0, land.z - 1));
        pos.set(land.x + 16, 13, land.z + 22);
        look.set(land.x, 1, land.z + 6);
      } else if (t < 32) {
        const k = (t - 22) / 10;
        pos.set(land.x + lerp(9, 6, k), 7, land.z - lerp(9, 7, k));
        look.set(land.x, 1.2, land.z);
        PET_TUTORIAL[rz.kind].intro.forEach((line, i) => { if (!said[i] && t > 23 + i * 3) { said[i] = true; rz.say(line, 2.9); } });
      } else if (t < 40) {
        const k = (t - 32) / 8;
        const f = k * (regions.length - 1);
        const i = Math.min(regions.length - 2, Math.floor(f)), kk = ease(f - i);
        const cx = lerp(regions[i][0], regions[i + 1][0], kk), cz = lerp(regions[i][1], regions[i + 1][1], kk);
        pos.set(cx + 26, 40, cz + 26);
        look.set(cx, 2, cz);
        // a música ganha uma camada por região sobrevoada
        const ri = Math.min(4, Math.round(f));
        if (!layered[ri]) { layered[ri] = true; G.audio.addLayer(['r0', 'r1', 'r2', 'r3', 'r4'][ri], 0.4); }
        if (t > 32 && !sub.textContent) sub.textContent = 'Cinco regiões cobertas pela Névoa do Erro...';
      } else if (t < CONFIG.cinematicLength) {
        const k = ease((t - 40) / 5);
        const off = new THREE.Vector3(...CONFIG.camera.offset);
        pos.copy(hero.pos).add(off).lerp(V(land.x + 26, 40, land.z + 26), 1 - k);
        look.copy(hero.pos).add(V(0, 1.2, 0));
        sub.textContent = CINE.fim;
        if (!layered.done) { layered.done = true; G.audio.region = null; G.audio.setRegion('base'); }
      } else finish();
      if (G.camRig.shakeT > 0) { G.camRig.shakeT -= dt; pos.x += (Math.random() - 0.5) * 1.2; pos.y += (Math.random() - 0.5) * 1.2; }
      return { pos, look, target: hero.pos };
    };
  });
}
