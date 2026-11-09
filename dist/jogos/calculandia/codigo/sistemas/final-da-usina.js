// Cinemática do final (v14): depois dos três reatores, o núcleo do Grande Erro explode, a cúpula da Usina voa
// em pedaços, a fumaça verde vira vapor branco e a ilha inteira comemora. ~24 s, pulável segurando Espaço.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { ease, lerp, clamp } from '../utilitarios/matematica.js';
import { flash, fade } from '../interface/transicoes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const DURACAO_FINAL = 24;

export function playFinale() {
  return new Promise((resolve) => {
    const el = document.getElementById('cine'), title = document.getElementById('cine-title'), sub = document.getElementById('cine-sub'), bar = document.getElementById('cine-skip-bar');
    const U = G.settlements.find((s) => s.def.id === 'F'), reator = U?.landmark, cx = U ? U.landmark.x : 0, cz = U ? U.landmark.z : 0;
    const fog = G.scene.fog, saved = { near: fog.near, far: fog.far, cam: G.camera.far, mode: G.mode };
    fog.near = 220; fog.far = 620; G.camera.far = 900; G.camera.updateProjectionMatrix();
    el.classList.remove('hidden'); title.innerHTML = ''; sub.textContent = 'O núcleo do Grande Erro ficou exposto…';
    G.mode = 'cine';
    let t = 0, hold = 0, done = false, explodiu = false, falou = false, festa = false, pointerHold = false;
    el.onpointerdown = () => (pointerHold = true);
    el.onpointerup = el.onpointercancel = () => (pointerHold = false);
    const ilhas = [[-62, 50], [-75, -28], [8, -88], [76, -32], [68, 48]];

    const explodir = () => {
      if (explodiu) return; explodiu = true;
      G.audio?.sfx?.('explosao'); setTimeout(() => G.audio?.sfx?.('explosao'), 350);
      flash('#ffffff', 0.9); setTimeout(() => flash('#b7ff3c', 0.6), 300);
      G.camRig.shake(1.6, 0.7);
      for (let i = 0; i < 6; i++) setTimeout(() => G.particles.emit('explosao', cx, 4 + i * 0.6, cz), i * 120);
      for (let i = 0; i < 3; i++) G.particles.emit('raizes', cx, 5, cz);
      for (let i = 0; i < 4; i++) G.particles.emit('fumaca', cx + (Math.random() - 0.5) * 4, 5, cz + (Math.random() - 0.5) * 4, { count: 20 });
      reator?.explodir?.();
      sub.textContent = '';
    };
    const finish = async () => {
      if (done) return; done = true;
      explodir(); reator?.salvar?.();
      await fade(true, 0.5);
      fog.near = saved.near; fog.far = saved.far; G.camera.far = saved.cam; G.camera.updateProjectionMatrix();
      G.camRig.override = null; G.camRig.snap(G.hero.pos);
      el.classList.add('hidden'); el.onpointerdown = el.onpointerup = el.onpointercancel = null;
      title.innerHTML = ''; sub.textContent = '';
      G.mode = 'play';
      await fade(false, 0.6);
      resolve();
    };

    G.camRig.override = (dt) => {
      t += dt;
      if (G.input.down('Space') || pointerHold) { hold += dt; bar.style.width = `${Math.min(1, hold) * 80}px`; if (hold >= 1) finish(); }
      else { hold = 0; bar.style.width = '0'; }
      const pos = V(), look = V(cx, 3, cz);
      if (t < 7) {
        // aproximação: a câmera desce em espiral sobre a Usina enquanto o núcleo treme
        const k = ease(t / 7), a = 0.9 + k * 1.4, r = lerp(70, 22, k);
        pos.set(cx + Math.cos(a) * r, lerp(55, 12, k), cz + Math.sin(a) * r);
        if (Math.random() < dt * (4 + t * 3)) G.particles.emit('faiscas', cx + (Math.random() - 0.5) * 4, 4.5, cz + (Math.random() - 0.5) * 4);
        if (t > 3) G.camRig.shakeT = Math.max(G.camRig.shakeT || 0, 0.05 * (t - 3));
        if (!falou && t > 2.5) { falou = true; G.ui.bubbles.sayAt(V(cx, 10, cz), 'Nããão! Meu erro relativo… zerou!', { villain: true, time: 4 }); G.audio?.voice?.('Nããão! Meu erro relativo zerou!', 110, 'sawtooth', 14); }
      } else if (t < 13) {
        explodir();
        const k = ease((t - 7) / 6), a = 2.3 + k * 0.8, r = lerp(22, 48, k);
        pos.set(cx + Math.cos(a) * r, lerp(12, 34, k), cz + Math.sin(a) * r);
        if (t > 9.5 && Math.random() < dt * 6) G.particles.emit('vapor', cx + (Math.random() - 0.5) * 3, 5, cz + (Math.random() - 0.5) * 3);
        if (t > 10 && !sub.textContent) sub.textContent = 'A Névoa do Erro se desfez.';
      } else if (t < 20) {
        // sobrevoo da ilha em festa
        if (!festa) { festa = true; for (const S of G.settlements) { S.fireworks = 8; for (const n of S.npcs) n.party = 10; } sub.textContent = 'Calculândia está livre!'; title.innerHTML = 'Calculândia salva!'.split('').map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join(''); }
        const k = (t - 13) / 7, f = k * (ilhas.length - 1), i = Math.min(ilhas.length - 2, Math.floor(f)), kk = ease(f - i);
        const x = lerp(ilhas[i][0], ilhas[i + 1][0], kk), z = lerp(ilhas[i][1], ilhas[i + 1][1], kk);
        pos.set(x + 30, 44, z + 30); look.set(x, 2, z);
        [...title.children].forEach((s, j) => { const kk2 = clamp((t - 13.3 - j * 0.06) / 0.4, 0, 1); s.style.transform = `scale(${kk2})`; });
        if (Math.random() < dt * 3) { const [ix, iz] = ilhas[Math.floor(Math.random() * ilhas.length)]; G.particles.emit('fogos', ix + (Math.random() - 0.5) * 20, 18 + Math.random() * 8, iz + (Math.random() - 0.5) * 20); }
      } else if (t < DURACAO_FINAL) {
        const k = ease((t - 20) / 4), hero = G.hero.pos;
        pos.copy(hero).add(V(10, 9, 12)).lerp(V(hero.x + 30, 44, hero.z + 30), 1 - k);
        look.copy(hero).add(V(0, 1.2, 0));
        sub.textContent = 'Erro: zero. Orgulho: infinito.';
      } else finish();
      if (G.camRig.shakeT > 0) { G.camRig.shakeT -= dt; pos.x += (Math.random() - 0.5) * 1.4; pos.y += (Math.random() - 0.5) * 1.4; }
      return { pos, look, target: G.hero.pos };
    };
  });
}
