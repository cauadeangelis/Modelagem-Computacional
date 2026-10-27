// Bootstrap, laço principal e reações do mundo ao progresso.
// Ordem por quadro: input → herói → colisão → NPCs e bichos → interação → câmera → partículas → UI → render.
import * as THREE from 'three';
import { G, lock, unlock } from './game.js';
import { CONFIG, HERO_NAME } from './config.js';
import { SETTLEMENTS, REGIONS, BOSS_OF_REGION, NIVEIS } from './data/settlements.js';
import { ANIMALS } from './data/animals.js';
import { HINTS } from './data/hints.js';
import { fala, LOADING, RAIZINHA_TUTORIAL } from './data/dialogs.js';
import { buildTerrain, regionBoost, terrainHeight, regionAt } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildSky } from './world/sky.js';
import { buildRoads, distToRoad } from './world/roads.js';
import { buildBridges } from './world/bridges.js';
import { buildProps, vegUniforms, clearAt } from './world/props.js';
import { buildSettlement } from './world/settlement.js';
import { Ambient } from './world/ambient.js';
import { Extras } from './world/extras.js';
import { FogGates } from './world/fog.js';
import { walkHeight } from './world/ground.js';
import { Hero } from './entities/hero.js';
import { Raizinha } from './entities/companion.js';
import { Animal } from './entities/animal.js';
import { NPC } from './entities/npc.js';
import { FugitiveRoot, TIPOS_ORDEM, RAIZ_TIPOS } from './entities/raiz.js';
import { Input } from './systems/input.js';
import { CameraRig } from './systems/camera.js';
import { Collision } from './systems/collision.js';
import { Interaction, Triggers } from './systems/interaction.js';
import { Particles } from './systems/particles.js';
import { Audio } from './systems/audio.js';
import { Progress } from './systems/progress.js';
import { loadSave, freshSave, clearSave } from './systems/save.js';
import { playCinematic, landingPoint } from './systems/cinematic.js';
import { Tutorial } from './systems/tutorial.js';
import { HUD, phasePreviewInfo } from './ui/hud.js';
import { Bubbles, Dialog } from './ui/dialog.js';
import { Minimap } from './ui/minimap.js';
import { MapScreen } from './ui/map-screen.js';
import { Menu, showTitle } from './ui/menu.js';
import { irisTo, fade } from './ui/transitions.js';
import { launchLevel, batteryFor } from './bridge/level-launcher.js';
import { mulberry32 } from './utils/math.js';

const $ = (id) => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const frameYield = () => new Promise((r) => setTimeout(r, 0));

async function setLoad(k, label) {
  $('load-fill').style.width = `${Math.round(k * 100)}%`;
  if (label) $('load-tip').textContent = label;
  await frameYield();
}

async function boot() {
  $('load-tip').textContent = LOADING[Math.floor(Math.random() * LOADING.length)];
  try { await Promise.race([document.fonts?.ready, wait(1.5)]); } catch (e) { /* sem fontes */ }

  const saved = loadSave();
  if (saved?.options) Object.assign(G.options, saved.options);

  // ---------- renderer, cena, câmera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, G.options.qualidade === 'alta' ? CONFIG.maxPixelRatio : 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = G.options.sombras;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('game').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  window.G = G; // facilita inspecionar pelo console
  const C = CONFIG.camera;
  const camera = new THREE.PerspectiveCamera(C.fov, innerWidth / innerHeight, C.near, C.far);
  Object.assign(G, { renderer, scene, camera });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  G.collision = new Collision();
  G.interaction = new Interaction();
  G.triggers = new Triggers();
  G.progress = new Progress(saved || freshSave());
  G.particles = new Particles(scene);
  G.audio = new Audio();
  G.input = new Input(renderer.domElement);
  G.camRig = new CameraRig(camera);

  // ---------- mundo ----------
  await setLoad(0.05, 'Levantando a ilha...');
  G.sky = buildSky(scene);
  G.terrain = buildTerrain(scene);
  await setLoad(0.25, 'Enchendo o mar...');
  G.water = buildWater(scene);
  G.bridges = buildBridges(scene, G.collision);
  buildRoads(scene);
  await setLoad(0.35, 'Plantando árvores...');
  G.props = buildProps(scene, G.collision);
  await setLoad(0.5, 'Construindo as cidades...');

  const ui = { bubbles: new Bubbles($('bubbles')), dialog: new Dialog(), hud: new HUD() };
  G.ui = { ...ui, caption: (t) => ui.hud.caption(t), seedFly: (p, n) => ui.hud.seedFly(p, n) };

  const ctx = { scene, collision: G.collision, interaction: G.interaction, triggers: G.triggers };
  for (let i = 0; i < SETTLEMENTS.length; i++) {
    G.settlements.push(buildSettlement(SETTLEMENTS[i], ctx));
    if (i % 5 === 4) await setLoad(0.5 + (i / SETTLEMENTS.length) * 0.3);
  }
  await setLoad(0.82, 'Acordando os bichos...');
  G.hero = new Hero(scene);
  G.raizinha = new Raizinha(scene);
  for (const S of G.settlements) {
    if (S.def.bicho && S.pen) { S.animal = new Animal(scene, S.def.bicho, S); G.animals.push(S.animal); }
    if ((S.def.tipo === 'cidade' || S.def.tipo === 'acampamento')) {
      // Jacobópolis e Seidelstadt têm mais moradores para o aceno (junto / em cascata) aparecer
      const count = S.def.id === 'C2.4' || S.def.id === 'C2.5' ? 4 : 2;
      for (let k = 0; k < count; k++) { const n = new NPC(scene, S, k, count); S.npcs.push(n); G.npcs.push(n); }
    }
  }
  setupAnimalTalk();
  setupShakeables();
  setupCityTriggers();
  buildRoots(scene);
  G.fog = new FogGates(scene, G.collision);
  G.ambient = new Ambient(scene, G.props);
  G.extras = new Extras(scene);
  G.tutorial = new Tutorial(scene);
  await setLoad(0.92, 'Desenhando o mapa...');
  G.ui.minimap = new Minimap();
  G.ui.map = new MapScreen();
  G.ui.menu = new Menu();
  G.fases = { batteryFor };
  G.raizinhaTalk = { label: 'Conversar com a Raizinha', action: talkRaizinha, prio: 0 };
  setupEvents();
  applyAll();
  if (G.debug) setupDebug();

  // posição inicial
  const d = G.progress.d;
  G.hero.place(d.hero.x, d.hero.z, d.hero.yaw);
  G.hero.setCosmetics(d.cosmetics.on);
  G.raizinha.place(G.hero.pos);
  G.camRig.snap(G.hero.pos);
  await setLoad(1, 'Pronto!');
  $('loading').classList.add('hidden');

  G.mode = 'title';
  requestAnimationFrame(frame);
  showTitle({
    hasSave: !!saved,
    onContinue: () => startPlay(false),
    onNew: () => { if (saved) { clearSave(); location.reload(); return; } startPlay(true); },
  });
}

async function startPlay(isNew) {
  G.audio.unlock();
  if (isNew && !G.progress.d.cine) {
    G.mode = 'cine';
    G.audio.setRegion('base');
    await playCinematic();
    G.progress.d.cine = true;
    const L = landingPoint();
    G.progress.d.hero = { x: L.x, z: L.z, yaw: Math.PI };
    G.progress.save();
  }
  G.mode = 'play';
  G.ui.hud.show(true);
  refreshHudVisibility();
  G.hero.region = -1; // força a faixa da região e a música
}

function refreshHudVisibility() {
  const s = G.progress.d.tutorial;
  G.ui.hud.setSeedsVisible(s >= 3);
  G.ui.hud.setMinimap(s >= 5);
  G.ui.hud.updateStats(G.progress);
}

// ======================================================================
// Raízes Fugitivas: 8 por região (R0–R4)
function buildRoots(scene) {
  const rnd = mulberry32(3141);
  const centers = { 1: [-68, 45], 2: [-72, -30], 3: [10, -88], 4: [78, -30], 5: [70, 50] };
  let n = 0;
  for (let r = 1; r <= 5; r++) {
    const placed = [];
    // primeiro, esconderijos atrás de casas/prédios da região
    const spots = G.settlements.filter((S) => S.def.regiao === r).flatMap((S) => S.hiddenSpots);
    for (let k = 0; k < 8; k++) {
      let p = null;
      for (let tries = 0; tries < 3000 && !p; tries++) {
        let x, z;
        if (tries > 900) { x = -130 + rnd() * 260; z = -130 + rnd() * 260; }
        else if (k < 3 && spots.length) { const s = spots[Math.floor(rnd() * spots.length)]; x = s.x + (rnd() - 0.5) * 3; z = s.z + (rnd() - 0.5) * 3; }
        else { const a = rnd() * Math.PI * 2, rr = 6 + rnd() * 42; x = centers[r][0] + Math.cos(a) * rr; z = centers[r][1] + Math.sin(a) * rr; }
        if (regionAt(x, z) !== r || !clearAt(x, z, 1.5)) continue;
        if (tries < 300 && distToRoad(x, z, 22) > 20) continue;
        if (placed.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < (tries > 900 ? 25 : 64))) continue;
        if (G.collision.blocked(x, z, 1.2)) continue;
        p = [x, z];
      }
      if (!p) continue;
      placed.push(p);
      const id = `raiz-${r}-${k}`;
      const root = new FugitiveRoot(scene, id, TIPOS_ORDEM[(r * 8 + k) % TIPOS_ORDEM.length], p[0], p[1], r);
      if (G.progress.d.roots[id]) root.setCaught();
      G.roots.push(root);
      n++;
    }
  }
}

// ======================================================================
function setupAnimalTalk() {
  for (const a of G.animals) {
    a.talkItem = G.interaction.add({ x: a.pos.x, z: a.pos.z, r: CONFIG.triggers.animal, prio: 2, label: `Conversar com ${a.def.nome}`, action: () => talkAnimal(a) });
    a.introduced = !!G.progress.d.intro[a.id];
  }
}

async function talkAnimal(a) {
  const d = a.def, S = a.s, p = G.progress;
  const H = HINTS[a.id];
  const portrait = { kind: 'animal', id: a.id };
  const voice = { pitch: d.voz.pitch, wave: d.voz.onda };
  if (!a.introduced) {
    a.introduced = true; p.d.intro[a.id] = true; p.save();
    await G.ui.dialog.show({ name: d.nome, portrait, voice, lines: d.intro });
    return;
  }
  if (a.state === 'door') {
    a.state = 'wander'; a.door = null;
    S.reactiveHint = S.reactiveHint || 'F';
    await G.ui.dialog.show({ name: d.nome, portrait, voice, lines: ['Vi que a raiz fugiu de você duas vezes. Toma uma dica de graça:', H.dica1, 'Na próxima tentativa eu já te espero com ela!'] });
    return;
  }
  const wins = p.cityWins(S.def.id);
  const opener = wins === 3 ? 'Cidade completa! Você é fera. Volte quando quiser.' : `Já são ${wins} de 3 fases por aqui. Quer uma dica?`;
  const v = await G.ui.dialog.show({
    name: d.nome, portrait, voice, lines: [opener],
    options: [{ label: 'Dica sobre o método', value: 'dica' }, { label: 'Como funcionam as dicas?', value: 'como' }, { label: 'Até mais!', value: 'tchau' }],
  });
  if (v === 'dica') await G.ui.dialog.show({ name: d.nome, portrait, voice, lines: [H.dica1, 'Dentro da fase, aperte H: eu apareço no cantinho com mais dicas.'] });
  if (v === 'como') await G.ui.dialog.show({ name: d.nome, portrait, voice, lines: ['Dica 1 é grátis. Dica 2 custa 1 semente, e a 3 custa 3 sementes.', 'A dica 3 mostra a jogada fantasma, mas a fase rende no máximo 2 estrelas.'] });
}

async function talkRaizinha() {
  const p = G.progress;
  const portrait = { kind: 'raizinha' };
  const voice = { pitch: 660, wave: 'triangle' };
  if (p.d.tutorial === 3) {
    await G.ui.dialog.show({ name: 'Raizinha', portrait, voice, lines: RAIZINHA_TUTORIAL.conversa });
    G.tutorial.advance(4);
    return;
  }
  const obj = G.objective;
  const v = await G.ui.dialog.show({
    name: 'Raizinha', portrait, voice,
    lines: [fala('raizinha_idle'), obj ? `Nosso próximo objetivo: ${obj.text.replace(/<[^>]+>/g, '')}` : 'A ilha está salva!'],
    options: [{ label: 'Dica geral', value: 'dica' }, { label: 'Onde estamos?', value: 'onde' }, { label: 'Valeu!', value: 'ok' }],
  });
  if (v === 'dica') await G.ui.dialog.show({ name: 'Raizinha', portrait, voice, lines: [HINTS.raizinha[`dica${1 + Math.floor(Math.random() * 3)}`]] });
  if (v === 'onde') {
    const r = regionAt(G.hero.pos.x, G.hero.pos.z);
    await G.ui.dialog.show({ name: 'Raizinha', portrait, voice, lines: [`Estamos em ${REGIONS[r].nome}. Você tem ${p.totalStars()} ⭐ e ${p.seeds} 🌰.`, `Raízes Fugitivas pegas: ${p.rootsCaught()}/40.`] });
  }
}

function setupShakeables() {
  const shaken = new Set(G.progress.d.trees);
  G.props.shakeables.forEach((t, i) => {
    t.sid = i;
    G.interaction.add({
      x: t.x, z: t.z, r: CONFIG.triggers.tree, prio: 1, label: 'Chacoalhar a árvore', enabled: () => !t.hidden,
      action: () => {
        G.ambient.shakeTree(t);
        G.audio.sfx('vento');
        // o passo do tutorial avança mesmo se a semente desta árvore já foi colhida antes
        const tutorialStep = G.progress.d.tutorial === 2;
        if (!shaken.has(i)) {
          shaken.add(i); G.progress.d.trees.push(i);
          G.progress.addSeeds(CONFIG.seeds.tree);
          G.ui.seedFly(V(t.x, t.y + 3, t.z), 1);
          G.raizinha.say(fala(G.progress.d.tutorial <= 2 ? 'raizinha_semente' : 'arvore'));
        } else G.raizinha.say(fala(tutorialStep ? 'raizinha_semente' : 'arvore_vazia'));
        if (tutorialStep) { G.tutorial.advance(3); refreshHudVisibility(); }
        G.progress.save();
      },
    });
  });
}

function setupCityTriggers() {
  for (const S of G.settlements) {
    G.triggers.add({
      x: S.def.x, z: S.def.z, r: S.def.tipo === 'final' ? 25 : CONFIG.triggers.city,
      enter: () => { if (G.mode !== 'play') return; G.ui.hud.banner(S.def.nome, 'city'); G.camRig.setContextZoom(CONFIG.camera.cityZoom, CONFIG.camera.cityZoomTime); G.currentCity = S; },
      exit: () => { if (G.currentCity === S) { G.currentCity = null; G.camRig.setContextZoom(1, CONFIG.camera.cityZoomTime); } },
    });
  }
}

// ======================================================================
// Estado do mundo a partir do progresso (seção 10.3)
function applySettlement(S, animate = false, justNivel = null) {
  const p = G.progress, id = S.def.id;
  if (S.def.tipo === 'cidade' || S.def.tipo === 'acampamento') {
    if (!S.def.metodo) return;
    let wins = 0;
    for (const nv of ['F', 'M', 'D']) {
      const B = S.buildings[nv];
      if (!B) continue;
      const won = p.won(`${id}-${nv}`);
      B.won = won;
      if (won) {
        wins++;
        B.flagMat.color.set('#f2c14e'); B.flagMat.emissive.set('#5a4000');
        B.winMat.emissive.set('#ffcf70');
        B.riseTarget = 1;
        if (!(animate && nv === justNivel)) B.rise = 1;
      }
    }
    if (wins >= 2 && S.lampMat) S.lampMat.emissive.set('#ffd27a');
    S.landmark?.onWin?.(wins);
    if (wins === 3 && !S.complete) {
      S.complete = true;
      S.evolved = true;
      if (S.landmark?.evolve) S.landmark.evolve(); else S.evolveGeneric?.();
      if (S.sign) S.sign.star.visible = true;
      if (S.raizCidade) S.raizCidade.root.visible = true;
      S.animal?.setParty(true);
      if (animate) S.fireworks = 5;
    }
  } else if (S.def.tipo === 'arena') {
    S.gate.want = p.canFightBoss(S.def) ? 1 : 0;
    const B = S.buildings.B;
    if (p.won(id)) { B.won = true; B.flagMat.color.set('#f2c14e'); B.flagMat.emissive.set('#5a4000'); B.riseTarget = 1; if (!animate) B.rise = 1; }
    if (S.gateExit) S.gateExit.want = p.won(id) ? 1 : 0;
    if (!animate) { S.gate.open = S.gate.want; if (S.gateExit) S.gateExit.open = S.gateExit.want; }
  } else if (S.def.tipo === 'final') {
    const open = p.usinaOpen();
    S.gate.want = open ? 1 : 0;
    S.finalMode = open;
    if (!animate) S.gate.open = S.gate.want;
  }
}

function applyAll() {
  const p = G.progress;
  for (const S of G.settlements) applySettlement(S, false);
  for (let r = 2; r <= 5; r++) G.fog.setLocked(r, !p.regionUnlocked(r), false);
  let boosted = false;
  for (let r = 1; r <= 5; r++) if (p.bossBeaten(BOSS_OF_REGION[r])) { regionBoost[r] = true; boosted = true; }
  if (boosted) G.terrain.recolor();
  glowBridges();
}

function glowBridges() {
  for (const b of G.bridges) if (b.data.trava && G.progress.regionUnlocked(b.data.trava)) b.railMat.emissive.set('#5a4a10');
}

// ======================================================================
// Entrar e sair das fases (seção 10)
let entering = false;
async function enterPhase(S, nivel) {
  if (entering || G.mode !== 'play' || G.locks) return;
  const B = S.buildings[nivel];
  if (!B) return;
  entering = true;
  lock();
  G.ui.hud.showPreview(null);
  G.ui.hud.setContext(null);
  const hero = G.hero;
  const start = hero.pos.clone();
  const inner = V(B.door.x + (B.x - B.door.x) * 0.55, 0, B.door.z + (B.z - B.door.z) * 0.55);
  inner.y = walkHeight(inner.x, inner.z);
  const yaw = Math.atan2(inner.x - start.x, inner.z - start.z);
  G.audio.sfx('porta');
  hero.ride((dt, t) => {
    const k = Math.min(1, t / CONFIG.ui.enterWalk);
    const p = start.clone().lerp(inner, k);
    if (t > CONFIG.ui.enterWalk) { const s = Math.max(0.01, 1 - (t - CONFIG.ui.enterWalk) / 0.4); hero.rig.root.scale.set(0.9 * s, s, 0.9 * s); }
    return { pos: p, yaw, pose: 'enter' };
  }, 'enter');
  G.camRig.setContextZoom(CONFIG.camera.enterZoom, CONFIG.camera.enterZoomTime);
  await wait(CONFIG.ui.enterWalk + 0.2);
  const sp = V(B.door.x, B.y + 1, B.door.z).project(G.camera);
  const sx = ((sp.x + 1) / 2) * innerWidth, sy = ((1 - sp.y) / 2) * innerHeight;
  await irisTo(sx, sy, true, CONFIG.ui.irisTime);
  G.mode = 'fase';
  const freeHint = S.reactiveHint === nivel;
  if (freeHint) { S.reactiveHint = null; if (S.animal?.state === 'door') { S.animal.state = 'wander'; S.animal.door = null; } }
  let res;
  const t0 = performance.now();
  try { res = await launchLevel({ id: S.def.id, metodo: S.def.metodo, nivel, freeHint }); }
  catch (e) { console.error(e); res = { vitoria: false, abandonou: true, estrelas: 0 }; }
  // volta: a íris abre na mesma porta e o herói sai 1 unidade para fora
  hero.riding = null;
  const out = V(B.door.x - B.x, 0, B.door.z - B.z).normalize();
  hero.place(B.door.x + out.x * 1.0, B.door.z + out.z * 1.0, Math.atan2(out.x, out.z));
  G.camRig.setContextZoom(G.currentCity ? CONFIG.camera.cityZoom : 1, 0.6);
  G.camRig.snap(hero.pos);
  G.mode = 'play';
  G.camRig.update(0.016, hero.pos);
  G.renderer.render(G.scene, G.camera);
  const sp2 = V(B.door.x, B.y + 1, B.door.z).project(G.camera);
  await irisTo(((sp2.x + 1) / 2) * innerWidth, ((1 - sp2.y) / 2) * innerHeight, false, CONFIG.ui.irisTime);
  unlock();
  entering = false;
  // §8.1 gatilho reativo: 90 s sem vencer (mesmo saindo) também traz o bicho para a porta
  if (!res.vitoria && S.animal && (performance.now() - t0) / 1000 >= CONFIG.hints.reactiveIdle) {
    S.animal.goToDoor(B.door);
    S.reactiveHint = nivel;
  }
  handleResult(S, nivel, res);
}

function handleResult(S, nivel, res) {
  const p = G.progress;
  const ev = p.applyResult(S.def, nivel, res);
  G.ui.hud.updateStats(p);
  if (res.abandonou) return;
  const B = S.buildings[nivel];
  const rz = G.raizinha;
  if (res.vitoria) {
    G.hero.play('celebrate');
    rz.react_('flip');
    setTimeout(() => rz.react_('heart'), 700);
    rz.say(fala('raizinha_vitoria'));
    S.animal?.celebrate();
    applySettlement(S, true, nivel);
    if (ev.firstWin) { G.audio.sfx('bandeira'); G.ui.caption(nivel === 'B' ? '🏆 Chefão vencido!' : `🚩 Bandeira içada: ${NIVEIS[nivel].predio}`); }
    if (ev.newStars) { G.ui.hud.pulse('stars'); }
    if (ev.seeds) setTimeout(() => G.ui.seedFly(V(B.x, B.y + 3, B.z), ev.seeds), 600);
    if (ev.cityCompleted) {
      setTimeout(() => {
        G.ui.hud.banner(`${S.def.nome} completa! ⭐`, 'region');
        G.ui.caption('🎆 Fogos de artifício! A Raiz da Cidade entrou no Raizdex');
        G.audio.sfx('vitoria');
        if (ev.cosmetic) G.ui.caption(`🎁 Novo cosmético: ${ev.cosmetic.nome} (Menu → Raizdex)`);
      }, 1500);
    }
    if (ev.bossBeaten && ev.unlockedRegion) {
      const r = ev.unlockedRegion;
      setTimeout(() => {
        G.fog.setLocked(r, false, true);
        regionBoost[S.def.regiao] = true;
        G.terrain.recolor();
        glowBridges();
        G.ui.minimap.refresh();
        for (const T of G.settlements) if (T.def.regiao === S.def.regiao) for (const n of T.npcs) n.party = 6;
        G.ui.hud.banner(`Região liberada: ${REGIONS[r].nome}`, 'region');
        rz.say('A névoa sumiu! Bora pra próxima região!', 4);
      }, 2200);
    } else if (ev.bossBeaten) {
      regionBoost[S.def.regiao] = true; G.terrain.recolor();
    }
    if (ev.usinaOpened) {
      setTimeout(() => {
        const U = G.settlements.find((x) => x.def.id === 'F');
        applySettlement(U, true);
        G.audio.sfx('explosao');
        G.camRig.shake(0.6, 0.5);
        G.ui.hud.banner('O Portão da Usina se abriu!', 'region');
        G.ui.caption('⚡ A Usina Central entrou em modo final');
        G.ui.minimap.refresh();
      }, 3500);
    }
    if (ev.finalWon) setTimeout(ending, 2500);
    if (S.def.id === 'C0.1' && nivel === 'F') { G.tutorial.advance(5); refreshHudVisibility(); }
    for (const A of G.settlements) if (A.def.tipo === 'arena') applySettlement(A, true);
  } else {
    G.hero.play('dizzy');
    G.audio.sfx('derrota');
    rz.react_('laugh');
    rz.say(fala('raizinha_derrota'));
    S.animal?.sad();
    if (B) B.smokeLoss = 5;
    const P = p.phase(p.key(S.def.id, nivel));
    if (S.animal && P.defeatsRow >= CONFIG.hints.reactiveDefeats && B) {
      // gatilho reativo: o bicho vai esperar na porta com um "?"
      S.animal.goToDoor(B.door);
      S.reactiveHint = nivel;
    }
  }
}

async function ending() {
  const portrait = { kind: 'vilao' };
  await G.ui.dialog.show({ name: 'Grande Erro', portrait, voice: { pitch: 110, wave: 'sawtooth' }, lines: ['Nããão! Meu erro relativo... zerou!', 'Eu volto... no próximo arredondamento...'] });
  await G.ui.dialog.show({ name: 'Raizinha', portrait: { kind: 'raizinha' }, voice: { pitch: 660, wave: 'triangle' }, lines: [`Conseguimos, ${HERO_NAME}! A Usina voltou a funcionar.`, 'Erro: zero. Orgulho: infinito. Calculândia está salva!'] });
  for (const S of G.settlements) { S.fireworks = 8; for (const n of S.npcs) n.party = 10; }
  G.ui.hud.banner('Calculândia salva! 🎉', 'region');
}

// ======================================================================
function setupEvents() {
  const E = G.events, ui = G.ui, rz = G.raizinha;
  let fogCool = 0, bushCool = 0, gateCool = 0;
  E.on('campfire', (S) => {
    if (G.hero.busy) return;
    const h = G.hero;
    h.targetYaw = h.yaw = Math.atan2(S.campfire.x - h.pos.x, S.campfire.z - h.pos.z);
    h.play('sit', { dur: 3, onEnd: () => {} });
    G.particles.emit('faiscas', S.campfire.x, S.campfire.y + 0.6, S.campfire.z);
    const d = G.progress.d;
    d.hero = { x: h.pos.x, z: h.pos.z, yaw: h.yaw };
    const nova = !d.fires.includes(S.def.id);
    if (nova) d.fires.push(S.def.id);
    G.progress.save();
    ui.caption(nova ? '🔥 Fogueira ativada: viagem rápida pelo mapa (M) · Jogo salvo' : '💾 Jogo salvo');
    if (S.def.id === 'A0' || G.progress.d.tutorial === 0) G.tutorial.advance(1);
  });
  E.on('bell', (S) => {
    G.audio.sfx('sino');
    ui.caption('🔔 O sino da cidade tocou');
    S.npcs.forEach((n, i) => n.doWave(i * 0.2));
    G.ambient.scareBirds(S.def.x, S.def.z, 30);
    const d = G.progress.d;
    if (!d.bells.includes(S.def.id)) { d.bells.push(S.def.id); G.progress.addSeeds(CONFIG.seeds.bell); ui.seedFly(V(S.bell.x, S.baseH + 2.5, S.bell.z), 1); G.progress.save(); }
  });
  E.on('phaseDoor', ({ s, nivel }) => {
    if (nivel === 'B' && !G.progress.canFightBoss(s.def)) {
      rz.say(s.def.tipo === 'final' ? fala('raizinha_usina') : fala('raizinha_sem_estrelas', { n: G.progress.starsMissing(s.def) }), 4);
      return;
    }
    enterPhase(s, nivel);
  });
  E.on('doorNear', ({ s, nivel, on }) => { if (G.mode === 'play') ui.hud.showPreview(on ? phasePreviewInfo(s, nivel) : null); });
  E.on('gateNear', (S) => {
    if (G.progress.canFightBoss(S.def) || gateCool > G.time) return;
    gateCool = G.time + 8;
    rz.say(fala('raizinha_sem_estrelas', { n: G.progress.starsMissing(S.def) }), 4);
  });
  E.on('usinaGateNear', () => { if (!G.progress.usinaOpen() && gateCool < G.time) { gateCool = G.time + 8; rz.say(fala('raizinha_usina'), 4); } });
  E.on('fogTouch', () => { if (fogCool > G.time) return; fogCool = G.time + 9; rz.fear = 2.5; rz.say(fala('raizinha_nevoa'), 3.5); });
  E.on('rootOut', () => {});
  E.on('bushNear', () => { if (bushCool > G.time) return; bushCool = G.time + 25; rz.say(fala('raizinha_moita')); });
  E.on('rootCaught', (r) => {
    const p = G.progress;
    p.d.roots[r.id] = r.tipo;
    p.addSeeds(CONFIG.seeds.root);
    ui.seedFly(r.pos.clone().add(V(0, 1, 0)), CONFIG.seeds.root);
    ui.caption(`🌱 ${RAIZ_TIPOS[r.tipo].nome} capturada! (${p.rootsCaught()}/40)`);
    G.audio.sfx('vitoria');
    rz.react_('heart');
    rz.say(r.tipo === 'falsa' ? 'Era uma Raiz Falsa! Sumiu, mas anotei no Raizdex.' : fala('fase_vencida'));
    let cos = null;
    if (r.tipo === 'complexa') cos = p.addSticker('S1') || cos;
    if (p.rootsCaught() >= 40) cos = p.addSticker('S2') || cos;
    if (cos) ui.caption(`🎁 Novo cosmético: ${cos.nome}`);
    ui.hud.updateStats(p); ui.hud.pulse('roots');
    p.save();
  });
  E.on('rootEscaped', () => { rz.react_('laugh'); rz.say('Fugiu! Ela volta pra moita daqui a pouco.'); });
  E.on('paoRaizinha', (pos) => { G.particles.emit('migalhas', pos.x, pos.y, pos.z); rz.react_('cheeks'); rz.say('Hmmm, pão truncado! Nhac!'); });
  E.on('macaNaCabeca', ({ s }) => {
    G.audio.sfx('toc');
    G.hero.play('bonk');
    G.particles.emit('estrelinhas', G.hero.pos.x, G.hero.pos.y + 2.2, G.hero.pos.z);
    setTimeout(() => ui.bubbles.say(G.hero.rig.root, 'Eureka!', { y: 2.9 }), 400);
    rz.react_('laugh');
    const d = G.progress.d;
    if (!d.apples.includes(s.def.id)) { d.apples.push(s.def.id); G.progress.addSeeds(CONFIG.seeds.apple); ui.seedFly(G.hero.headPos(), 1); G.progress.save(); }
  });
  E.on('tirolesa', ({ from, to, handle, a, b }) => {
    if (G.hero.busy) return;
    G.audio.sfx('vento');
    G.hero.ride((dt, t) => {
      const k = Math.min(1, t / 3);
      handle.position.lerpVectors(a, b, k);
      if (t > 3.3) { handle.position.copy(a); return null; }
      return { pos: from.clone().lerp(to, k), pose: 'ride' };
    }, 'ride');
  });
  E.on('montanhaRussa', ({ L, api }) => {
    if (G.hero.busy) return;
    api.startLap();
    G.audio.sfx('gritinhos');
    let cool = 0;
    G.hero.ride((dt, t) => {
      if (t > 8) return null;
      cool -= dt; if (cool <= 0) { cool = 2.5; G.audio.sfx('gritinhos'); }
      const c = api.carts[0];
      const w = L.toWorld(c.position.x, c.position.y + 0.2, c.position.z);
      return { pos: w, yaw: c.rotation.y + L.dyn.rotation.y, pose: 'seat' };
    }, 'seat');
  });
  E.on('regionChange', (r) => {
    if (G.mode !== 'play' && G.mode !== 'cine') return;
    if (G.mode === 'play') ui.hud.banner(REGIONS[r].nome, 'region');
    G.audio.setRegion(REGIONS[r].musica);
  });
  E.on('fastTravel', async (id) => {
    const S = G.settlements.find((s) => s.def.id === id);
    if (!S?.campfire) return;
    lock();
    await fade(true, 0.5);
    const a = S.entryAngle ?? 0;
    G.hero.place(S.campfire.x + Math.cos(a) * 2.2, S.campfire.z + Math.sin(a) * 2.2, a + Math.PI);
    G.raizinha.place(G.hero.pos);
    G.camRig.snap(G.hero.pos);
    await fade(false, 0.5);
    unlock();
  });
  E.on('openMap', () => { if (G.mode === 'play' && !ui.dialog.open && !ui.menu.open) ui.map.toggle(); });
  E.on('openMenu', () => { if (G.mode === 'play' && !ui.dialog.open) { ui.map.close(); ui.menu.toggle(); } });
  E.on('mapOpened', () => { if (G.progress.d.tutorial === 5) { G.tutorial.advance(6); refreshHudVisibility(); } });
  E.on('heroSplash', () => { rz.react_('laugh'); rz.say('Tibum! Água não é chão, patrão.'); });
  E.on('seeds', () => ui.hud.updateStats(G.progress));
  E.on('tutorialStep', () => refreshHudVisibility());
  E.on('options', () => {
    const r = G.renderer;
    r.setPixelRatio(Math.min(devicePixelRatio, G.options.qualidade === 'alta' ? CONFIG.maxPixelRatio : 1));
    r.shadowMap.enabled = G.options.sombras;
    G.scene.traverse((m) => { if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mm) => (mm.needsUpdate = true)); });
    G.progress.save();
  });
  E.on('resetGame', () => { clearSave(); location.reload(); });
  addEventListener('beforeunload', () => { if (G.mode === 'play') { G.progress.d.hero = { x: G.hero.pos.x, z: G.hero.pos.z, yaw: G.hero.yaw }; G.progress.save(); } });
}

// ======================================================================
function setupDebug() {
  const el = $('debug');
  el.classList.remove('hidden');
  const btn = (label, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.onclick = fn; el.appendChild(b); };
  for (const a of ['celebrate', 'dizzy', 'think', 'sit', 'wave', 'talk', 'surprise', 'enter', 'bonk']) btn(a, () => G.hero.play(a, { dur: ['think', 'sit', 'talk'].includes(a) ? 2 : undefined }));
  btn('correr', () => { G.input.keys.add('ShiftLeft'); G.input.keys.add('KeyW'); setTimeout(() => { G.input.keys.delete('ShiftLeft'); G.input.keys.delete('KeyW'); }, 1500); });
  btn('pular', () => G.hero.jump());
  btn('pular cine', () => G.input.keys.add('Space'));
  btn('+10 🌰', () => G.progress.addSeeds(10));
  btn('vencer próxima', () => { const o = G.progress.nextObjective(); const S = G.settlements.find((s) => s.def.id === o.sid); if (!S) return; const nv = S.def.id.startsWith('C') ? ['F', 'M', 'D'].find((n) => !G.progress.won(`${S.def.id}-${n}`)) || 'F' : 'B'; handleResult(S, nv, { vitoria: true, estrelas: 3 }); });
  for (const [n, x, z] of [['Base', 0, 92], ['R0', -78, 50], ['R1', -88, -12], ['R2', -27, -78], ['R3', 67, -52], ['R4', 52, 34], ['Usina', 0, 33]]) btn(n, () => { G.hero.place(x, z); G.raizinha.place(G.hero.pos); G.camRig.snap(G.hero.pos); });
  // avança n quadros "na mão" (útil com a aba em segundo plano)
  G.step = (n = 1, dtMs = 33) => { for (let i = 0; i < n; i++) { last = performance.now() - dtMs; frame(performance.now(), true); } };
}

// ======================================================================
let last = performance.now(), cullT = 0, objT = 0, saveT = 0, mmT = 0;
function frame(now, manual = false) {
  if (!manual) requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min((now - last) / 1000, CONFIG.maxDt));
  last = now;
  G.time += dt; G.dt = dt;
  const t = G.time;
  const inp = G.input;
  inp.poll();
  if (G.mode === 'fase') { inp.endFrame(); return; }
  const ui = G.ui;

  // teclas globais
  if (G.mode === 'play') {
    if (inp.hit('Escape')) { if (ui.map.open) ui.map.close(); else if (!ui.dialog.open) G.events.emit('openMenu'); }
    if (inp.hit('KeyM')) { if (ui.map.open) ui.map.close(); else G.events.emit('openMap'); }
    if (!G.locks) {
      if (inp.hit('KeyQ')) G.camRig.rotate(-1);
      if (inp.hit('KeyR')) G.camRig.rotate(1);
      if (inp.hit('KeyH')) { G.hero.play('think', { dur: 1.2 }); G.audio.sfx('dica'); const o = G.objective; G.raizinha.say(o ? o.text.replace(/<[^>]+>/g, '') : fala('raizinha_idle'), 4.5); }
    }
  }

  // herói (com colisão) → Raizinha
  G.hero.update(dt, t);
  G.raizinha.update(dt, t);

  // cidades: visibilidade por distância
  cullT -= dt;
  if (cullT <= 0) {
    cullT = 0.25;
    // na cinemática a câmera passeia longe do herói: o descarte usa o ponto para onde ela olha
    let ref = G.hero.pos, cull = CONFIG.world.settlementCull;
    if (G.mode === 'cine') {
      const cam = G.camera, dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      const k = dir.y < -0.05 ? -cam.position.y / dir.y : 60;
      ref = cam.position.clone().addScaledVector(dir, k);
      cull += cam.position.y * 0.8;
    }
    for (const S of G.settlements) { S._d = Math.hypot(S.def.x - ref.x, S.def.z - ref.z); S.setVisible(S._d < cull); }
  }
  // NPCs, bichos e raízes
  for (const S of G.settlements) {
    if (!S.visible) continue;
    const near = S._d < 60;
    S.update(t, dt, near);
    // §7.3: em Jacobópolis todos acenam juntos a cada 5 s; em Seidelstadt o aceno passa em cascata
    if (near && (S.def.id === 'C2.4' || S.def.id === 'C2.5')) {
      S._waveT = (S._waveT ?? 0) + dt;
      if (S._waveT >= 5) { S._waveT = 0; S.npcs.forEach((n, i) => n.doWave(S.def.id === 'C2.5' ? i * 0.6 : 0)); }
    }
    if (near) { for (const n of S.npcs) n.update(dt, t); if (S.animal) { S.animal.update(dt, t); S.animal.talkItem.x = S.animal.pos.x; S.animal.talkItem.z = S.animal.pos.z; } }
    // apresentação do bicho na primeira vez a 6 de distância
    const a = S.animal;
    if (a && !a.introduced && !a._autoIntro && G.mode === 'play' && a.pos.distanceTo(G.hero.pos) < CONFIG.animals.introDist) {
      a._autoIntro = true;
      a.say(a.def.intro.join(' '), { time: 3.4 }); // vira balões de até 70 caracteres em sequência
      a.introduced = true; G.progress.d.intro[a.id] = true;
    }
  }
  for (const r of G.roots) if (r.state !== 'done' && Math.abs(r.home.x - G.hero.pos.x) < 60 && Math.abs(r.home.z - G.hero.pos.z) < 60) r.update(dt, t);

  // interação
  if (G.mode === 'play' && !G.locks && !G.hero.busy) {
    const cur = G.interaction.update(G.hero.pos);
    ui.hud.setContext(cur);
    if (inp.hit('KeyE') || inp.hit('Enter')) G.interaction.trigger();
    G.triggers.update(G.hero.pos);
  } else ui.hud.setContext(null);

  // câmera, luz, ambiente
  G.camRig.update(dt, G.hero.pos);
  G.sky.follow(G.camRig.target);
  vegUniforms.uTime.value = t;
  vegUniforms.uHero.value.copy(G.hero.pos);
  G.water.update(t);
  G.fog.update(t, dt);
  G.ambient.update(t, dt);
  G.extras.update(t, dt);
  G.tutorial.update(dt, t);

  // partículas → UI
  G.particles.update(dt);
  ui.bubbles.update(dt, G.camera);
  ui.dialog.update(dt, t);
  objT -= dt;
  if (objT <= 0 && G.mode === 'play') {
    objT = 0.5;
    G.objective = G.tutorial.objective() || G.progress.nextObjective();
    ui.hud.setObjective(G.objective?.text);
  }
  mmT -= dt;
  if (mmT <= 0 && G.mode === 'play' && G.progress.d.tutorial >= 5) { mmT = 1 / 20; ui.minimap.draw(t); }
  saveT += dt;
  if (saveT > 20 && G.mode === 'play' && !G.locks) {
    saveT = 0;
    G.progress.d.hero = { x: G.hero.pos.x, z: G.hero.pos.z, yaw: G.hero.yaw };
    G.progress.save();
  }

  G.renderer.render(G.scene, G.camera);
  renderXray();
  inp.endFrame();
}

// Silhueta do herói e da Raizinha quando algo fica entre eles e a câmera
let xray = null;
function renderXray() {
  if (G.mode !== 'play') return;
  const r = G.renderer, s = G.scene;
  if (!xray) {
    const m = new THREE.MeshBasicMaterial({ color: '#2f6fdd', transparent: true, opacity: 0.45, depthFunc: THREE.GreaterDepth, depthWrite: false, fog: false });
    // empurra o fragmento ~1,2 un. para a câmera: as partes do próprio corpo não acendem a silhueta
    m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nmvPosition.z += 1.2; gl_Position = projectionMatrix * mvPosition;'); };
    xray = m;
    for (const root of [G.hero.rig.root, G.raizinha.m.root]) root.traverse((o) => { if (o.isMesh && o.material?.transparent !== true) o.layers.enable(1); });
  }
  const bg = s.background;
  s.background = null; s.overrideMaterial = xray;
  G.camera.layers.set(1);
  r.autoClear = false; r.shadowMap.autoUpdate = false;
  r.render(s, G.camera);
  r.autoClear = true; r.shadowMap.autoUpdate = true;
  G.camera.layers.set(0);
  s.overrideMaterial = null; s.background = bg;
}

boot().catch((e) => {
  console.error(e);
  $('load-tip').textContent = 'Erro ao carregar: ' + e.message;
});
