// Tutorial guiado (seção 15.2): fogueira → pulo → árvore → Raizinha → Casa de Calibração → mapa.
import * as THREE from 'three';
import { G } from '../game.js';
import { CREEK } from '../data/settlements.js';
import { walkHeight } from '../world/ground.js';
import { mat } from '../utils/geo.js';

export const STEPS = [
  { text: 'Siga as setas até a fogueira e aperte <b>E</b> para sentar (salva o jogo).', fala: 'Bora pra fogueira, patrão! Lá a gente salva o jogo.' },
  { text: 'Pule o riacho com <b>Espaço</b>.', fala: 'Riacho à vista! Aperta Espaço pra pular.' },
  { text: 'Chacoalhe a árvore com <b>E</b> para ganhar uma semente.', fala: 'Chacoalha aquela árvore! Às vezes cai semente.' },
  { text: 'Converse com a Raizinha (aperte <b>E</b> perto dela).', fala: 'Psiu! Fala comigo, tenho uma coisa pra contar.' },
  { text: 'Siga a estrada e entre na <b>Casa de Calibração</b> da Padaria.', fala: 'Agora a primeira raiz! Ela está na Padaria do Truncamento.' },
  { text: 'Aperte <b>M</b> para abrir o mapa.', fala: 'Olha o minimapa! Aperta M pra ver o mapa inteiro.' },
];

function creekX(z) {
  const p = CREEK.pts;
  for (let i = 0; i < p.length - 1; i++) {
    const [x1, z1] = p[i], [x2, z2] = p[i + 1];
    if ((z - z1) * (z - z2) <= 0) return x1 + ((x2 - x1) * (z - z1)) / (z2 - z1 || 1);
  }
  return -13;
}

export class Tutorial {
  constructor(scene) {
    this.arrows = new THREE.Group();
    const m = mat('#f2c14e', { emissive: '#8a6a00' });
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.5); shape.lineTo(0.45, -0.1); shape.lineTo(0.22, -0.1); shape.lineTo(0, 0.2); shape.lineTo(-0.22, -0.1); shape.lineTo(-0.45, -0.1); shape.closePath();
    const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(geo, m); a.renderOrder = 3; this.arrows.add(a); }
    scene.add(this.arrows);
    this.announced = -1;
  }
  get step() { return G.progress.d.tutorial; }
  get active() { return this.step < STEPS.length; }
  advance(to) {
    if (this.step >= to || this.step !== to - 1) return;
    G.progress.d.tutorial = to;
    G.progress.save();
    G.events.emit('tutorialStep', to);
  }
  target() {
    switch (this.step) {
      case 0: return G.settlements.find((s) => s.def.id === 'A0')?.campfire;
      case 1: return { x: creekX(87) - 3, z: 87 };
      case 2: return G.props.tutorialTree;
      case 4: { const S = G.settlements.find((s) => s.def.id === 'C0.1'); return S?.buildings.F?.door; }
      default: return null;
    }
  }
  objective() {
    if (!this.active) return null;
    const t = this.target();
    return { text: STEPS[this.step].text, x: t?.x, z: t?.z };
  }
  update(dt, t) {
    if (!this.active || G.mode !== 'play') { this.arrows.visible = false; return; }
    if (this.announced !== this.step && !G.locks) { this.announced = this.step; G.raizinha.say(STEPS[this.step].fala, 4); }
    const h = G.hero.pos;
    if (this.step === 1 && h.x < creekX(h.z) - 1.2) this.advance(2);
    const tg = this.target();
    if (!tg) { this.arrows.visible = false; return; }
    const d = new THREE.Vector3(tg.x - h.x, 0, tg.z - h.z);
    const dist = d.length();
    this.arrows.visible = dist > 2.5;
    d.normalize();
    const yaw = Math.atan2(d.x, d.z);
    this.arrows.children.forEach((a, i) => {
      const s = Math.min(dist - 1, 1.8 + i * 1.6 + ((t * 2) % 1.6));
      const x = h.x + d.x * s, z = h.z + d.z * s;
      a.position.set(x, walkHeight(x, z) + 0.12, z);
      a.rotation.y = yaw + Math.PI;
      a.visible = s < dist - 0.8;
      a.scale.setScalar(0.9 + Math.sin(t * 6 - i) * 0.15);
    });
  }
}
