// Tutorial guiado (seção 15.2): fogueira → pulo → árvore → pet → Casa de Calibração → mapa.
// Antes dele, o tutorial de comandos (TutorialComandos) ensina teclas e botões, um passo por vez.
import * as THREE from 'three';
import { G, uiEl } from '../game.js';
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
    if (!this.active || G.mode !== 'play' || G.comandos.ativo) { this.arrows.visible = false; return; }
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
// Tutorial de comandos: na primeira vez no mundo, um passo a passo ensina cada comando.
// Um passo por vez; ele só avança quando o jogador faz o que o passo pede.
// Dá para pular o passo ou o tutorial inteiro. Enquanto ele roda, o tutorial guiado espera.
const tecla = (code, label = code.replace(/^(Key|Digit)/, '')) => `<kbd data-code="${code}">${label}</kbd>`;
const cruz = (cima, esq, baixo, dir) => `<span class="tk-cross"><span>${cima}</span><span>${esq}${baixo}${dir}</span></span>`;
const icone = (t) => `<span class="tk-icon">${t}</span>`;
export const COMANDOS = [
  { id: 'andar', titulo: '🚶 Andar', meta: 5,
    teclas: `${cruz(tecla('KeyW'), tecla('KeyA'), tecla('KeyS'), tecla('KeyD'))}<span class="tk-ou">ou</span>${cruz(tecla('ArrowUp', '↑'), tecla('ArrowLeft', '←'), tecla('ArrowDown', '↓'), tecla('ArrowRight', '→'))}`,
    teclado: 'Use <b>W A S D</b> ou as <b>setas</b> para andar. Clicar no chão também leva você até lá. <b>Ande um pouco pela praia.</b>',
    toque: icone('🕹️ joystick'), toqueTexto: 'Arraste o <b>joystick</b> (canto de baixo, à esquerda) para andar. Tocar no chão também leva você até lá. <b>Ande um pouco pela praia.</b>',
    fala: 'Primeiro, vamos andar! Bora dar uma voltinha.' },
  { id: 'correr', titulo: '🏃 Correr', meta: 1,
    teclas: `${tecla('ShiftLeft', 'Shift')}<span class="tk-ou">+</span>${tecla('KeyW')}`,
    teclado: 'Segure <b>Shift</b> enquanto anda para correr. <b>Corra um pouquinho.</b>',
    toque: icone('🕹️ 👆👆'), toqueTexto: 'Toque <b>duas vezes</b> no joystick e segure para correr. <b>Corra um pouquinho.</b>',
    fala: 'Agora corre! Quero ver essa velocidade.' },
  { id: 'pular', titulo: '🦘 Pular',
    teclas: tecla('Space', 'Espaço'),
    teclado: 'Aperte <b>Espaço</b> para pular riachos, pedras e buracos. <b>Dê um pulo.</b>',
    toque: icone('Pular'), toqueTexto: 'Toque no botão <b>Pular</b> para pular riachos, pedras e buracos. <b>Dê um pulo.</b>',
    fala: 'Pula! Lá na frente tem riacho.' },
  { id: 'girar', titulo: '🔄 Girar a câmera', soTeclado: true,
    teclas: `${tecla('KeyQ')}<span class="tk-ou">ou</span>${tecla('KeyR')}`,
    teclado: '<b>Q</b> e <b>R</b> giram a câmera para ver o que está atrás das casas e árvores. <b>Gire a câmera.</b>',
    fala: 'Gira a câmera! Às vezes uma casa esconde o caminho.' },
  { id: 'zoom', titulo: '🔍 Aproximar e afastar',
    teclas: icone('🖱️ roda do mouse'),
    teclado: 'Role a <b>roda do mouse</b> para aproximar ou afastar a câmera. <b>Experimente.</b>',
    toque: icone('🤏 pinça'), toqueTexto: 'Faça <b>pinça</b> com dois dedos na tela para aproximar ou afastar. <b>Experimente.</b>',
    fala: 'Chega mais perto... ou vê a ilha de longe!' },
  { id: 'interagir', titulo: '✋ Interagir',
    teclas: `${tecla('KeyE')}<span class="tk-ou">ou</span>${tecla('Enter')}`,
    teclado: '<b>E</b> (ou <b>Enter</b>) usa o que estiver perto: fogueiras, árvores, placas, bichos e portas. O botão de baixo mostra o que vai acontecer. <b>Aperte E para falar com {pet}.</b>',
    toque: icone('Interagir'), toqueTexto: 'O botão <b>Interagir</b> (ou o botão que aparece embaixo) usa o que estiver perto. <b>Toque nele para falar com {pet}.</b>',
    fala: 'Agora vem falar {comigo}! Aperta E.' },
  { id: 'responder', titulo: '💬 Conversas',
    teclas: `${tecla('KeyE')}${tecla('Enter')}${tecla('Space', 'Espaço')}<span class="tk-ou">e</span>${tecla('Digit1')}${tecla('Digit2')}${tecla('Digit3')}`,
    teclado: '<b>E</b>, <b>Enter</b> ou <b>Espaço</b> passam a fala. Nas perguntas, <b>1</b>, <b>2</b> ou <b>3</b> escolhem a resposta (ou clique nela). <b>Responda {pet}.</b>',
    toque: icone('👆 toque'), toqueTexto: 'Toque na caixa de conversa para passar a fala e no botão da resposta para responder. <b>Responda {pet}.</b>',
    fala: 'Fala comigo, vai! Aperta E perto de mim.' },
  { id: 'dica', titulo: '💡 Pedir dica',
    teclas: tecla('KeyH'),
    teclado: 'Perdeu o rumo? <b>H</b> faz {pet} lembrar o objetivo. Dentro das fases, H chama o bicho guia. <b>Aperte H.</b>',
    toque: icone('Dica'), toqueTexto: 'Perdeu o rumo? O botão <b>Dica</b> faz {pet} lembrar o objetivo. <b>Toque em Dica.</b>',
    fala: 'Se ficar perdid{o}, pede dica pra mim!' },
  { id: 'mapa', titulo: '🗺️ Mapa',
    teclas: tecla('KeyM'),
    teclado: '<b>M</b> abre o mapa da ilha (e fecha também). <b>Abra o mapa.</b>',
    toque: icone('🗺️'), toqueTexto: 'O botão <b>🗺️</b>, no canto de cima, abre o mapa da ilha. <b>Abra o mapa.</b>',
    fala: 'Olha o mapa da ilha inteira!' },
  { id: 'menu', titulo: '☰ Menu',
    teclas: tecla('Escape', 'Esc'),
    teclado: '<b>Esc</b> abre o menu: opções, Raizdex e a lista de <b>Controles</b>, para rever tudo isso. <b>Abra o menu.</b>',
    toque: icone('☰'), toqueTexto: 'O botão <b>☰</b>, no canto de cima, abre o menu: opções, Raizdex e a lista de <b>Controles</b>. <b>Abra o menu.</b>',
    fala: 'Último: o menu! Lá tem a lista de comandos.' },
];

export class TutorialComandos {
  constructor() {
    this.el = uiEl('tuto', 'panel hidden', 'hud');
    this.passo = null;
    this.prog = 0;
    this.pausa = 1.5; // respiro antes do primeiro passo (depois da abertura)
    this.okT = 0; // "Boa!" do passo concluído
    this.fimT = 0; // cartão final
    this.opcoes = false; // viu uma conversa com respostas
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      b.blur(); // Espaço/Enter seguintes vão para o jogo, não para o botão
      if (b.dataset.tuto === 'passo') this.concluir('Passo pulado.');
      if (b.dataset.tuto === 'pular') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Pular mesmo? Clique de novo'; return; }
        this.final('Tutorial pulado.', 'Os comandos ficam em <b>Menu → Controles</b> quando precisar.');
      }
    });
    G.events.on('interacted', () => this.fez('interagir'));
    G.events.on('mapOpened', () => this.fez('mapa'));
    G.events.on('menuOpened', () => this.fez('menu'));
  }
  get feitos() { return G.progress.d.comandos; }
  get passos() { return COMANDOS.filter((c) => !(c.soTeclado && G.input.touch)); }
  get ativo() { return !this.feitos.includes('todas'); }
  // enquanto roda, o objetivo do HUD fica escondido; este texto é o que o pet lembra (H)
  objective() { return this.ativo ? { text: 'Terminar o tutorial de comandos (o cartão no alto da tela).' } : null; }

  reset() {
    this.feitos.length = 0;
    this.passo = null; this.pausa = 0.6; this.okT = this.fimT = 0;
    G.progress.save();
  }

  fez(id) { if (this.passo?.id === id) this.concluir(); }

  concluir(msg = '✔ Boa! Passo concluído.') {
    const p = this.passo;
    if (!p || this.okT > 0 || this.fimT > 0) return;
    this.feitos.push(p.id);
    G.progress.save();
    G.audio?.sfx('acerto');
    this.el.classList.add('done');
    this.el.querySelector('.tuto-status').textContent = msg;
    const bar = this.el.querySelector('.tuto-bar i');
    if (bar) bar.style.width = '100%';
    this.okT = 1;
  }

  proximo() {
    const lista = this.passos;
    const p = lista.find((x) => !this.feitos.includes(x.id));
    if (!p) { this.final('🎉 Tutorial concluído!', 'Agora siga as <b>setas amarelas</b> até a fogueira. Os comandos ficam em <b>Menu → Controles</b>.'); return; }
    this.passo = p;
    this.prog = 0;
    this.opcoes = false;
    const n = lista.indexOf(p), toque = G.input.touch;
    this.el.classList.remove('done', 'fim', 'hidden');
    // teclas à esquerda, explicação à direita (em tela pequena, uma embaixo da outra)
    this.el.innerHTML = `<div class="tuto-head"><span>🎓 Tutorial<span class="tuto-long"> de comandos</span></span>
        <span class="tuto-dots" aria-hidden="true">${lista.map((_, i) => `<i class="${i < n ? 'ok' : i === n ? 'now' : ''}"></i>`).join('')}</span>
        <span>Passo ${n + 1} de ${lista.length}</span></div>
      <div class="tuto-body">
        <div class="tuto-keys" aria-hidden="true">${toque ? p.toque : p.teclas}</div>
        <div class="tuto-info"><h3>${p.titulo}</h3><p class="tuto-text">${tx(toque ? p.toqueTexto : p.teclado)}</p>${p.meta ? '<div class="tuto-bar"><i></i></div>' : ''}</div>
      </div>
      <div class="tuto-foot"><span class="tuto-status">Faça isso para continuar.</span>
        <button class="btn secondary" data-tuto="passo">Pular este passo</button><button class="btn secondary" data-tuto="pular">Pular tutorial</button></div>`;
    this.keys = [...this.el.querySelectorAll('kbd[data-code]')];
    this.bar = this.el.querySelector('.tuto-bar i');
    G.pet.say(p.fala, 4);
  }

  final(titulo, texto) {
    this.passo = null;
    this.fimT = 4;
    this.el.classList.remove('hidden');
    this.el.classList.add('done', 'fim');
    this.el.innerHTML = `<div class="tuto-head"><span>🎓 Tutorial de comandos</span></div><h3>${titulo}</h3><p class="tuto-text">${texto}</p>
      <div class="tuto-foot"><button class="btn" data-tuto="fechar">Bora!</button></div>`;
    this.el.querySelector('[data-tuto="fechar"]').onclick = () => { this.fimT = 0.01; };
  }

  update(dt) {
    const ui = G.ui, inp = G.input, h = G.hero;
    if (!this.ativo || G.mode !== 'play' || ui.menu.open || ui.map.open) { this.el.classList.add('hidden'); return; }
    this.el.classList.remove('hidden');
    if (this.fimT > 0) {
      this.fimT -= dt;
      if (this.fimT <= 0) { this.feitos.push('todas'); G.progress.save(); this.el.classList.add('hidden'); }
      return;
    }
    if (this.okT > 0) { this.okT -= dt; if (this.okT <= 0) this.proximo(); return; }
    if (!this.passo) { this.pausa -= dt; if (this.pausa <= 0) this.proximo(); return; }

    // as teclas do cartão acendem quando são apertadas
    for (const k of this.keys) k.classList.toggle('on', inp.down(k.dataset.code) || (k.dataset.code === 'ShiftLeft' && inp.down('ShiftRight')));

    // a conversa com respostas conta para "Conversas" quando termina
    if (ui.dialog.open) this.opcoes ||= !!ui.dialog.cfg?.options;
    else if (this.opcoes) { this.opcoes = false; this.fez('responder'); }

    if (G.locks) return;
    const id = this.passo.id;
    if (id === 'andar' && h.speed > 0.5) this.prog += h.speed * dt;
    if (id === 'correr' && inp.run && h.speed > CONFIG.hero.walkSpeed + 0.3) this.prog += dt;
    if (id === 'pular' && h.jumpT >= 0) this.concluir();
    if (id === 'girar' && (inp.hit('KeyQ') || inp.hit('KeyR'))) this.concluir();
    if (id === 'zoom' && inp.wheel) this.concluir();
    if (id === 'dica' && inp.hit('KeyH')) this.concluir();
    if (this.passo.meta) {
      this.bar.style.width = `${Math.min(100, (this.prog / this.passo.meta) * 100)}%`;
      if (this.prog >= this.passo.meta) this.concluir();
    }
  }
}
