// Tela de criação (antes da aventura): boneco masculino ou feminino, nome e pet, com prévias 3D.
// As prévias usam um renderizador próprio e pequeno, copiado para o canvas 2D de cada cartão;
// sem WebGL extra, os cartões mostram os retratos 2D.
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { makeHumanoid, resetPose, swingPigtails } from '../entities/rig.js';
import { animIdle, animAction, ACTIONS } from '../entities/animations.js';
import { makeRaizinhaModel } from '../entities/companion.js';
import { makeGatoModel, animateGato } from '../entities/gatas.js';
import { drawPortrait } from './portraits.js';
import { limparNome } from '../data/dialogs.js';
import { esc } from '../fases/tactical-ui.js';

const PERSONAGENS = [
  { id: 'm', nome: 'Masculino', desc: 'O engenheiro' },
  { id: 'f', nome: 'Feminino', desc: 'A engenheira' },
];
const PETS = [
  { id: 'raizinha', nome: 'Raizinha', desc: 'Mandioquinha falante de olhos enormes. Vai pulando atrás de você.' },
  { id: 'gatas', nome: 'Lina e Nina', desc: 'Duas gatinhas curiosas, uma de cada lado. As duas dão palpite em tudo.' },
];
const SUGESTOES = { m: ['Nurupi', 'Teo', 'Davi', 'Caio', 'Raoni', 'Bento'], f: ['Nurupi', 'Bia', 'Luna', 'Iara', 'Maya', 'Clara'] };
const PX = 320; // resolução das prévias

// palco: modelo sobre um disco de grama, câmera fixa
function palco(obj, alvoY, dist, chaoR) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(CONFIG.light.hemiSky, CONFIG.light.hemiGround, 1.1));
  const sun = new THREE.DirectionalLight(CONFIG.light.sunColor, 1.5); sun.position.set(3, 6, 5); scene.add(sun);
  const chao = new THREE.Mesh(new THREE.CircleGeometry(chaoR, 32), new THREE.MeshLambertMaterial({ color: '#9ccc5a' }));
  chao.rotation.x = -Math.PI / 2; scene.add(chao);
  scene.add(obj);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, alvoY + dist * 0.3, dist); camera.lookAt(0, alvoY, 0);
  return { scene, camera, chao };
}

function previaHeroi(genero) {
  const rig = makeHumanoid({ ...CONFIG.hero.colors, genero });
  const p = palco(rig.root, 1.2, 5.0, 1.0);
  let aceno = Infinity;
  p.retrato = { kind: 'heroi', id: { genero } };
  p.escolher = () => { aceno = 0; };
  p.tick = (t, dt) => {
    aceno += dt;
    if (aceno < ACTIONS.wave.dur) animAction(rig, 'wave', aceno, dt); else { resetPose(rig); animIdle(rig, t, dt); }
    rig.root.rotation.y = Math.sin(t * 0.6) * 0.9;
    swingPigtails(rig, 0, 0, t, false);
  };
  return p;
}

function previaRaizinha() {
  const m = makeRaizinhaModel();
  const p = palco(m.root, 0.5, 2.7, 0.7);
  let pulo = Infinity;
  p.retrato = { kind: 'raizinha' };
  p.escolher = () => { pulo = 0; };
  p.tick = (t, dt) => {
    pulo += dt;
    m.body.position.y = pulo < 0.9 ? Math.abs(Math.sin(pulo * Math.PI * 3.3)) * 0.25 : 0;
    m.leaves.rotation.y += dt * (pulo < 0.9 ? 8 : 1.5);
    m.root.rotation.y = Math.sin(t * 0.6) * 0.5;
    const bl = t % 3.1 < 0.12;
    for (const e of m.eyes) e.scale.y = bl ? 0.15 : 1;
  };
  return p;
}

function previaGatas() {
  const grupo = new THREE.Group();
  const gatas = CONFIG.gatas.map((def, i) => {
    const m = makeGatoModel(def.cores);
    m.root.position.x = (i ? 1 : -1) * 0.38; m.root.rotation.y = (i ? -1 : 1) * 0.35;
    grupo.add(m.root);
    return { m, phase: 0, move: 0, sit: 1, seed: i * 2.3 };
  });
  const p = palco(grupo, 0.36, 3.2, 1.0);
  let pulo = Infinity;
  p.retrato = { kind: 'gatas' };
  p.escolher = () => { pulo = 0; };
  p.tick = (t, dt, on) => {
    pulo += dt;
    gatas.forEach((g, i) => {
      // escolhidas, levantam; senão ficam sentadinhas
      g.sit += ((on ? 0 : 1) - g.sit) * Math.min(1, dt * 5);
      animateGato(g.m, g, t + i);
      const k = pulo - i * 0.15;
      g.m.root.position.y = k > 0 && k < 0.5 ? Math.sin((k / 0.5) * Math.PI) * 0.3 : 0;
      const bl = (t + i * 1.3) % 3.4 < 0.12;
      for (const e of g.m.eyes) e.scale.y = bl ? 0.15 : 1;
    });
  };
  return p;
}

const cartao = (campo, o) => `<button type="button" class="cr-card" role="radio" aria-checked="false" data-${campo}="${o.id}">
  <canvas width="${PX}" height="${PX}" aria-hidden="true"></canvas><b>${o.nome}</b><span>${o.desc}</span></button>`;

// Abre a tela e devolve { nome, genero, pet } quando o jogador confirmar.
export function showCreator({ nome = '', genero = 'm', pet = 'raizinha' } = {}) {
  const el = document.getElementById('creator');
  const st = { nome: limparNome(nome), genero, pet };
  el.innerHTML = `<div class="sheet creator" role="dialog" aria-modal="true" aria-labelledby="cr-title">
    <ol class="cr-steps"><li id="cr-s1" class="on">1. Personagem</li><li id="cr-s2">2. Pet</li></ol>
    <section id="cr-p1">
      <h2 id="cr-title">Quem vai caçar as raízes?</h2>
      <div class="cr-grid" role="radiogroup" aria-label="Personagem">${PERSONAGENS.map((o) => cartao('genero', o)).join('')}</div>
      <label class="cr-name" for="cr-nome">Nome do personagem</label>
      <div class="row cr-name-row">
        <input id="cr-nome" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Digite um nome" value="${esc(st.nome)}">
        <button type="button" class="btn secondary" id="cr-dado" title="Sortear um nome" aria-label="Sortear um nome">🎲</button>
      </div>
      <p class="cr-err" id="cr-err" aria-live="polite"></p>
      <div class="row end"><button type="button" class="btn big" id="cr-next">Próximo →</button></div>
    </section>
    <section id="cr-p2" hidden>
      <h2>Quem vai com você?</h2>
      <div class="cr-grid" role="radiogroup" aria-label="Pet">${PETS.map((o) => cartao('pet', o)).join('')}</div>
      <div class="row cr-foot">
        <button type="button" class="btn secondary" id="cr-back">← Voltar</button>
        <button type="button" class="btn big" id="cr-go">Começar a aventura!</button>
      </div>
    </section>
  </div>`;
  el.classList.remove('hidden');
  const $ = (s) => el.querySelector(s);
  const input = $('#cr-nome'), err = $('#cr-err');

  // prévias
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(PX, PX, false);
  } catch (e) { renderer = null; }
  const previas = [
    { campo: 'genero', id: 'm', ...previaHeroi('m') },
    { campo: 'genero', id: 'f', ...previaHeroi('f') },
    { campo: 'pet', id: 'raizinha', ...previaRaizinha() },
    { campo: 'pet', id: 'gatas', ...previaGatas() },
  ];
  for (const p of previas) {
    p.card = $(`[data-${p.campo}="${p.id}"]`);
    p.ctx = p.card.querySelector('canvas').getContext('2d');
  }

  const marcar = (campo, anima) => {
    for (const p of previas) {
      if (p.campo !== campo) continue;
      const on = st[campo] === p.id;
      p.card.setAttribute('aria-checked', String(on));
      p.card.tabIndex = on ? 0 : -1;
      if (on && anima) p.escolher();
    }
  };
  const escolher = (campo, id) => {
    st[campo] = id;
    marcar(campo, true);
    G.audio?.sfx(id === 'gatas' ? 'miau' : id === 'raizinha' ? 'pop' : 'ping');
  };
  marcar('genero', false); marcar('pet', false);

  for (const p of previas) {
    p.card.onclick = () => escolher(p.campo, p.id);
    // setas trocam a escolha dentro do grupo, como num grupo de rádio
    p.card.onkeydown = (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const outra = previas.find((q) => q.campo === p.campo && q.id !== p.id);
      escolher(outra.campo, outra.id);
      outra.card.focus();
    };
  }

  const passo = (n) => {
    $('#cr-p1').hidden = n !== 1; $('#cr-p2').hidden = n !== 2;
    $('#cr-s1').classList.toggle('on', n === 1); $('#cr-s2').classList.toggle('on', n === 2);
    $(n === 1 ? `[data-genero="${st.genero}"]` : `[data-pet="${st.pet}"]`).focus();
  };
  const validar = () => {
    const limpo = limparNome(input.value);
    if (!limpo) { err.textContent = 'Digite o nome do seu personagem (letras ou números).'; input.focus(); return false; }
    input.value = st.nome = limpo;
    err.textContent = '';
    return true;
  };
  $('#cr-dado').onclick = () => {
    const lista = SUGESTOES[st.genero].filter((n) => n !== input.value);
    input.value = lista[Math.floor(Math.random() * lista.length)];
    err.textContent = '';
  };
  input.oninput = () => { if (err.textContent && limparNome(input.value)) err.textContent = ''; };
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#cr-next').click(); } };
  $('#cr-next').onclick = () => { if (validar()) passo(2); };
  $('#cr-back').onclick = () => passo(1);

  let raf = 0, last = performance.now(), t = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const etapa = $('#cr-p1').hidden ? 'pet' : 'genero';
    for (const p of previas) {
      if (p.campo !== etapa) continue;
      const on = st[p.campo] === p.id;
      p.tick(t, dt, on);
      if (renderer) {
        renderer.render(p.scene, p.camera);
        p.ctx.clearRect(0, 0, PX, PX);
        p.ctx.drawImage(renderer.domElement, 0, 0);
      } else drawPortrait(p.ctx.canvas, p.retrato.kind, p.retrato.id, t, 0);
    }
  };
  raf = requestAnimationFrame(loop);
  passo(1);

  return new Promise((resolve) => {
    $('#cr-go').onclick = () => {
      cancelAnimationFrame(raf);
      for (const p of previas) { p.chao.geometry.dispose(); p.chao.material.dispose(); }
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
      el.classList.add('hidden');
      el.innerHTML = '';
      resolve({ nome: st.nome, genero: st.genero, pet: st.pet });
    };
  });
}
