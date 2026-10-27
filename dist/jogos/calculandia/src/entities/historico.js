// Personagens históricos no mundo: boneco com roupa de época, etiqueta com o nome quando o herói
// chega perto e o estado da missão (nova, em andamento, concluída). Conversa por E/Enter ou toque.
import * as THREE from 'three';
import { G, uiEl } from '../game.js';
import { makeHumanoid } from './rig.js';
import { animIdle, animAction } from './animations.js';
import { sph, cyl, box } from '../utils/geo.js';
import { walkHeight } from '../world/ground.js';

const TAG_DIST = 13; // a etiqueta aparece a esta distância
export const TALK_R = 3.2;

function vestir(rig, v) {
  rig.helmet.visible = false;
  rig.pack.visible = false;
  const h = rig.head, c = v.cabelo;
  if (v.estilo === 'peruca') {
    // peruca do século XVIII: topo e cachos dos lados
    const top = sph(0.4, c, 0, 0.12, -0.04, 12, 8); top.scale.set(1.05, 0.75, 1.05); h.add(top);
    for (const sx of [-1, 1]) for (const y of [-0.05, -0.22]) { const k = sph(0.13, c, sx * 0.38, y, -0.08, 8, 6); k.scale.set(0.8, 1, 1); h.add(k); }
    const tail = sph(0.16, c, 0, -0.2, -0.38, 8, 6); tail.scale.set(1, 1.4, 0.9); h.add(tail);
  } else if (v.estilo === 'coque') {
    const top = sph(0.4, c, 0, 0.1, -0.06, 12, 8); top.scale.set(1.03, 0.8, 1.03); h.add(top);
    h.add(sph(0.17, c, 0, 0.32, -0.3, 8, 6));
    for (const sx of [-1, 1]) { const l = sph(0.11, c, sx * 0.35, -0.1, 0.05, 8, 6); l.scale.set(0.6, 1.5, 0.8); h.add(l); }
  } else {
    const top = sph(0.4, c, 0, 0.1, -0.05, 12, 8); top.scale.set(1.03, 0.72, 1.03); h.add(top);
  }
  if (v.chapeu) { h.add(cyl(0.36, 0.38, 0.16, v.chapeu, 0, 0.36, -0.02, 14)); h.add(cyl(0.3, 0.34, 0.12, v.chapeu, 0, 0.47, -0.02, 14)); }
  // livro debaixo do braço: sinal de "mestre"
  rig.armL.add(box(0.08, 0.36, 0.28, '#8b2f2f', -0.04, -0.42, 0.12));
}

export class Historico {
  constructor(scene, def, S) {
    this.def = def;
    this.s = S;
    this.rig = makeHumanoid({ pele: def.visual.pele, macacao: def.visual.macacao, colete: def.visual.colete, capacete: '#000' });
    vestir(this.rig, def.visual);
    this.rig.root.scale.setScalar(0.96);
    scene.add(this.rig.root);
    this.pos = new THREE.Vector3();
    this.home = this.spot(S);
    this.pos.set(this.home.x, walkHeight(this.home.x, this.home.z), this.home.z);
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.home.yaw;
    this.wave = 0;
    // etiqueta DOM projetada (texto real, legível e com contraste)
    this.tag = document.createElement('div');
    this.tag.className = 'nametag hidden';
    this.tag.setAttribute('aria-hidden', 'true');
    uiEl('nametags').appendChild(this.tag);
    this._tagKey = '';
    this.v = new THREE.Vector3();
  }

  // lugar na praça: fora do anel dos moradores e longe dos prédios, das tendas e do marco
  spot(S) {
    const c = S.campfire ? { x: S.campfire.x, z: S.campfire.z } : { x: S.def.x, z: S.def.z };
    const prefer = this.def.cidade === 'A0' ? Math.PI / 2 : 0; // na Base, voltada para a praia de chegada
    let best = null;
    for (const r of [5.6, 6.2, 5.2, 7]) {
      for (let k = 0; k < 32 && !best; k++) {
        const a = prefer + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 16);
        const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        if (G.collision.blocked(x, z, 0.9) || walkHeight(x, z) < 0.15) continue;
        if (Object.values(S.buildings).some((B) => Math.hypot(B.x - x, B.z - z) < 3.6 || (B.door && Math.hypot(B.door.x - x, B.door.z - z) < 2.4))) continue;
        best = { x, z, yaw: Math.atan2(c.x - x, c.z - z) };
      }
      if (best) break;
    }
    return best || { x: c.x + 4, z: c.z, yaw: -Math.PI / 2 };
  }

  estado() {
    const p = G.progress, d = p.d.historicos[this.def.id];
    if (p.won(this.def.missaoFase)) return 'concluida';
    return d?.met ? 'andamento' : 'nova';
  }

  update(dt, t) {
    const hero = G.hero, rig = this.rig;
    const dist = hero.pos.distanceTo(this.pos);
    const near = dist < 5;
    const target = near ? Math.atan2(hero.pos.x - this.pos.x, hero.pos.z - this.pos.z) : this.home.yaw;
    let dy = target - rig.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    rig.root.rotation.y += dy * Math.min(1, dt * 5);
    if (this.wave > 0) { this.wave -= dt; animAction(rig, 'wave', 1.2 - this.wave, dt); }
    else animIdle(rig, t + this.def.id.length, dt);
    if (near && !this._greeted && this.estado() === 'nova') { this._greeted = true; this.wave = 1.2; }
    if (dist > 9) this._greeted = false;

    // etiqueta: nome + estado; quando dá para conversar, mostra a tecla
    const show = dist < TAG_DIST && G.mode === 'play' && this.s.visible !== false;
    if (!show) { this.tag.classList.add('hidden'); return; }
    this.v.copy(this.pos); this.v.y += 2.75; this.v.project(G.camera);
    if (this.v.z > 1 || Math.abs(this.v.x) > 1.1 || Math.abs(this.v.y) > 1.1) { this.tag.classList.add('hidden'); return; }
    const st = this.estado(), talk = dist < TALK_R;
    const key = `${st}|${talk}|${G.input.touch}`;
    if (key !== this._tagKey) {
      this._tagKey = key;
      const badge = st === 'nova' ? '<span class="nt-st nova">❗ Nova missão</span>' : st === 'andamento' ? '<span class="nt-st anda">⏳ Missão em andamento</span>' : '<span class="nt-st ok">✔ Missão concluída</span>';
      this.tag.innerHTML = `<b>${this.def.nome}</b>${badge}${talk ? `<span class="nt-key">${G.input.touch ? 'Toque em Interagir' : '<kbd>E</kbd> Conversar'}</span>` : ''}`;
    }
    this.tag.classList.remove('hidden');
    this.tag.style.transform = `translate(${((this.v.x + 1) / 2) * innerWidth}px, ${((1 - this.v.y) / 2) * innerHeight}px) translate(-50%, -100%)`;
  }
}
