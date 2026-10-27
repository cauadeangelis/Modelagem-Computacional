// Tutorial guiado (seção 15.2): fogueira → pulo → árvore → pet → Casa de Calibração → mapa.
// Junto dele, as dicas de controle (classe Dicas) explicam teclas e botões nas primeiras interações.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { CREEK } from '../data/settlements.js';
import { tx } from '../data/dialogs.js';
import { walkHeight } from '../world/ground.js';
import { mat } from '../utils/geo.js';

export const STEPS = [
  { text: 'Siga as setas até a fogueira e aperte <b>E</b> para sentar (salva o jogo).', fala: 'Bora pra fogueira, {patrão}! Lá a gente salva o jogo.' },
  { text: 'Pule o riacho com <b>Espaço</b>.', fala: 'Riacho à vista! Aperta Espaço pra pular.' },
  { text: 'Chacoalhe a árvore com <b>E</b> para ganhar uma semente.', fala: 'Chacoalha aquela árvore! Às vezes cai semente.' },
  { text: 'Converse com {pet} (aperte <b>E</b> perto {dela}).', fala: 'Psiu! Vem falar {comigo}, tenho uma coisa pra contar.' },
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
    return { text: tx(STEPS[this.step].text), x: t?.x, z: t?.z };
  }
  update(dt, t) {
    if (!this.active || G.mode !== 'play') { this.arrows.visible = false; return; }
    if (this.announced !== this.step && !G.locks) { this.announced = this.step; G.pet.say(STEPS[this.step].fala, 4); }
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

// ======================================================================
// Dicas de controle: um cartão por vez embaixo do objetivo. Cada dica some quando o jogador
// faz o que ela ensina (ou aperta "Entendi"); as urgentes aparecem na hora em que fazem sentido.
const k = (...ks) => ks.map((x) => `<kbd>${x}</kbd>`).join(' ');
export const DICAS = [
  { id: 'andar', titulo: '🚶 Andar',
    teclado: `${k('W', 'A', 'S', 'D')} ou as setas ${k('↑', '←', '↓', '→')} andam. Clicar no chão também leva você até lá.`,
    toque: 'Arraste o <b>joystick</b> no canto de baixo para andar. Tocar no chão também leva você até lá.' },
  { id: 'correr', titulo: '🏃 Correr',
    teclado: `Segure ${k('Shift')} enquanto anda para correr.`,
    toque: 'Toque duas vezes no joystick e segure para correr.' },
  { id: 'camera', titulo: '🎥 Câmera',
    teclado: `${k('Q')} e ${k('R')} giram a câmera. A <b>roda do mouse</b> aproxima e afasta.`,
    toque: 'Faça <b>pinça</b> com dois dedos na tela para aproximar ou afastar a câmera.' },
  { id: 'interagir', titulo: '✋ Interagir', urgente: true, quando: () => !!G.interaction.current && G.interaction.current !== G.petTalk,
    teclado: `Apareceu um botão embaixo, no meio da tela? Aperte ${k('E')} ou ${k('Enter')} para usar.`,
    toque: 'Apareceu um botão embaixo, no meio da tela? Toque nele (ou em <b>Interagir</b>).' },
  { id: 'dialogo', titulo: '💬 Conversas', urgente: true, quando: () => G.ui.dialog.open,
    teclado: `${k('E')}, ${k('Enter')} ou ${k('Espaço')} passam as falas. Nas perguntas, ${k('1')} ${k('2')} ${k('3')} escolhem a resposta.`,
    toque: 'Toque na caixa de conversa para passar as falas e nos botões para responder.' },
  { id: 'pular', titulo: '🦘 Pular', urgente: true, quando: () => G.progress.d.tutorial >= 1,
    teclado: `${k('Espaço')} pula riachos, pedras e buracos. Correndo, o pulo vai mais longe.`,
    toque: 'O botão <b>Pular</b> pula riachos, pedras e buracos.' },
  { id: 'dica', titulo: '💡 Pedir dica', quando: () => G.progress.d.tutorial >= 4,
    teclado: `Perdeu o rumo? ${k('H')} faz {pet} lembrar o objetivo. As setas amarelas no chão também apontam o caminho.`,
    toque: 'Perdeu o rumo? O botão <b>Dica</b> faz {pet} lembrar o objetivo.' },
  { id: 'menu', titulo: '☰ Mapa e menu', quando: () => G.progress.d.tutorial >= 6,
    teclado: `${k('M')} abre o mapa e ${k('Esc')} abre o menu, com opções, Raizdex e a lista de controles.`,
    toque: 'Os botões 🗺️ e ☰ no canto direito abrem o mapa e o menu (com a lista de controles).' },
];

export class Dicas {
  constructor() {
    this.el = document.getElementById('tip');
    this.atual = null;
    this.walk = 0; this.run = 0;
    this.pausa = 1.5; // respiro antes da primeira e entre uma dica e outra
    this.okT = 0;
    this.viuDialogo = false;
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tip === 'ok' && this.atual) this.feito(this.atual.id);
      if (b.dataset.tip === 'todas') { this.lista.push('todas'); G.progress.save(); this.mostrar(null); }
    });
    G.events.on('interacted', () => this.feito('interagir'));
    G.events.on('menuOpened', () => this.feito('menu'));
  }
  get lista() { return G.progress.d.dicas; }
  visto(id) { return this.lista.includes(id) || this.lista.includes('todas'); }
  reset() { this.lista.length = 0; this.walk = this.run = 0; this.pausa = 1; G.progress.save(); }

  // a dica que está na tela vira "Boa!" por um instante; as outras só ficam marcadas
  feito(id) {
    if (this.visto(id)) return;
    this.lista.push(id);
    G.progress.save();
    if (this.atual?.id === id) {
      this.el.classList.add('done');
      this.el.querySelector('.tip-body').textContent = '✔ Boa! Você pegou o jeito.';
      this.okT = 1;
    }
  }

  mostrar(x) {
    this.atual = x;
    this.el.classList.toggle('hidden', !x);
    this.el.classList.remove('done');
    if (!x) return;
    this.el.innerHTML = `<div class="tip-head"><span>${x.titulo}</span><span class="tip-n">${DICAS.indexOf(x) + 1}/${DICAS.length}</span></div>
      <div class="tip-body">${tx(G.input.touch ? x.toque : x.teclado)}</div>
      <div class="tip-foot"><button class="btn" data-tip="ok">Entendi</button><button class="btn secondary" data-tip="todas">Pular dicas</button></div>`;
  }

  update(dt) {
    const ui = G.ui, inp = G.input, h = G.hero;
    if (G.mode !== 'play' || ui.menu.open || ui.map.open) { this.el.classList.add('hidden'); return; }
    if (this.atual) this.el.classList.remove('hidden');
    // o que o jogador já fez, mesmo sem a dica na tela
    if (!G.locks) {
      if (h.speed > 0.5) this.walk += h.speed * dt;
      if (this.walk > 4) this.feito('andar');
      if (inp.run && h.speed > CONFIG.hero.walkSpeed + 0.3) this.run += dt;
      if (this.run > 0.6) this.feito('correr');
      if (inp.hit('KeyQ') || inp.hit('KeyR') || inp.wheel) this.feito('camera');
      if (h.jumpT >= 0) this.feito('pular');
      if (inp.hit('KeyH')) this.feito('dica');
    }
    // a dica de conversa conta como feita quando a conversa em que ela apareceu termina
    if (ui.dialog.open) this.viuDialogo ||= this.atual?.id === 'dialogo';
    else if (this.viuDialogo) { this.viuDialogo = false; this.feito('dialogo'); }

    if (this.okT > 0) { this.okT -= dt; if (this.okT <= 0) { this.mostrar(null); this.pausa = 1.2; } return; }
    if (this.pausa > 0) { this.pausa -= dt; return; }
    const livre = (x) => !this.visto(x.id) && (!x.quando || x.quando());
    const prox = DICAS.find((x) => x.urgente && livre(x)) || (ui.dialog.open ? null : DICAS.find((x) => !x.urgente && livre(x))) || null;
    if (prox !== this.atual) this.mostrar(prox);
  }
}
