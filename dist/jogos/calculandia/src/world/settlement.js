// Monta cada cidade/acampamento/arena a partir dos dados (planta padrão, seção 5.2).
import * as THREE from 'three';
import { G } from '../game.js';
import { CONFIG } from '../config.js';
import { REGIONS, PATHS, NIVEIS, DUVIDAS, SETTLEMENTS } from '../data/settlements.js';
import { distToRoad } from './roads.js';
import { PLACAS, PLACAS_EXTRA, fala } from '../data/dialogs.js';
import { terrainHeight, settlementBaseH } from './terrain.js';
import { box, sph, cyl, cone, mesh, mat, bake, labelTexture, G_SPH, G_BOX } from '../utils/geo.js';
import { makeHouse } from './props.js';
import { LANDMARKS } from './landmarks.js';
import { makeRaizinhaModel } from '../entities/companion.js';
import { hashString, mulberry32, wrapAngle, lerp, ease, clamp } from '../utils/math.js';

const WALL = ['#f3e3c3', '#f3e3c3', '#d9c49a', '#e3cfb0', '#f6efe2', '#f4ead8', '#c9cdd3'];
const angDist = (a, b) => Math.abs(wrapAngle(a - b));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function roadAngles(def) {
  const out = [];
  for (const path of PATHS) {
    path.forEach(([x, z], i) => {
      if (Math.hypot(x - def.x, z - def.z) > 0.5) return;
      if (i > 0) out.push({ a: Math.atan2(path[i - 1][1] - z, path[i - 1][0] - x), incoming: true });
      if (i < path.length - 1) out.push({ a: Math.atan2(path[i + 1][1] - z, path[i + 1][0] - x), incoming: false });
    });
  }
  return out;
}

// melhor ângulo entre candidatos: o mais longe dos ocupados
function bestAngle(cands, occ) {
  let best = cands[0], bd = -1;
  for (const a of cands) {
    const d = Math.min(...occ.map((o) => angDist(a, o)), 9);
    if (d > bd) { bd = d; best = a; }
  }
  return best;
}

// Placa sobre a porta: dificuldade em texto e símbolo (e ✔ quando a fase foi vencida)
const placaMats = new Map();
export function placaMat(level, won = false) {
  const k = level + won;
  if (placaMats.has(k)) return placaMats.get(k);
  const info = level === 'Q' ? { cor: DUVIDAS.cor, txt: '? DÚVIDAS' } : { cor: NIVEIS[level].cor, txt: `${NIVEIS[level].simbolo} ${NIVEIS[level].dificuldade.toUpperCase()}${won ? ' ✔' : ''}` };
  const c = document.createElement('canvas'); c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 256, 72);
  g.fillStyle = info.cor; g.fillRect(5, 5, 246, 62);
  g.fillStyle = '#ffffff'; g.font = '700 34px Fredoka, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(info.txt, 128, 38);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: tex });
  placaMats.set(k, m);
  return m;
}
const G_PLACA = new THREE.PlaneGeometry(1.5, 0.42);

function phaseBuilding(level, wallColor, roofColor) {
  const floors = { F: 1, M: 2, D: 3 }[level];
  const w = level === 'D' ? 2.8 : 3.4, d = level === 'D' ? 2.8 : 3.2, fh = 1.6;
  const st = new THREE.Group(), dyn = new THREE.Group(), wins = new THREE.Group();
  const H = fh * floors;
  st.add(box(w, H, d, wallColor, 0, H / 2, 0));
  for (let f = 1; f < floors; f++) st.add(box(w + 0.12, 0.14, d + 0.12, '#8b5a2b', 0, f * fh, 0));
  st.add(box(w + 0.2, 0.2, d + 0.2, '#8b5a2b', 0, H, 0));
  const r = cone(w * 0.8, 1.5, roofColor, 0, H + 0.75, 0, 4); r.rotation.y = Math.PI / 4; st.add(r);
  st.add(box(1.0, 1.4, 0.1, '#6b4423', 0, 0.7, d / 2 + 0.04));
  st.add(box(1.2, 0.15, 0.14, '#3a2a1a', 0, 1.45, d / 2 + 0.05));
  for (let f = 0; f < floors; f++) {
    const y = f * fh + 1.0;
    const xs = f === 0 ? [-w / 2 + 0.6, w / 2 - 0.6] : [-0.75, 0.75];
    for (const x of xs) wins.add(box(0.5, 0.55, 0.06, '#ffffff', x, y, d / 2 + 0.03));
    for (const sx of [-1, 1]) wins.add(box(0.06, 0.55, 0.5, '#ffffff', sx * (w / 2 + 0.03), y, 0));
  }
  if (level === 'M') st.add(box(0.5, 1.3, 0.5, '#8a8a8a', w * 0.25, H + 1.0, -d * 0.2));
  // janelas: material próprio (acende quando a fase é vencida)
  const winMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, color: '#7fa6c4', emissive: '#000000' });
  const winMesh = bake(wins, winMat);
  dyn.add(winMesh);
  // bandeira (cinza até vencer, depois dourada)
  const poleTop = H + 1.5;
  st.add(cyl(0.05, 0.05, 1.7, '#6b4423', 0, H + 1.4 + 0.15, 0, 5));
  const flagMat = mat('#9a9a9a', { emissive: '#000000' });
  const flag = new THREE.Mesh(G_BOX(0.05, 0.42, 0.72), flagMat);
  flag.position.set(0, H + 1.0, 0.38);
  dyn.add(flag);
  // marcador "!" quicando sobre a porta
  const marker = new THREE.Group();
  const mm = mat('#f2c14e', { emissive: '#7a5a00' });
  const bar = new THREE.Mesh(G_BOX(0.14, 0.42, 0.14), mm); bar.position.y = 0.28; marker.add(bar);
  const dot = new THREE.Mesh(G_SPH(0.09, 6, 5), mm); marker.add(dot);
  marker.position.set(0, 2.15, d / 2 + 0.55);
  dyn.add(marker);
  let light = null;
  if (level === 'D') {
    light = new THREE.Mesh(G_SPH(0.2, 8, 6), mat('#ff3b30', { emissive: '#ff0000' }));
    light.position.set(0, H + 1.65, 0);
    dyn.add(light);
  }
  flag.position.y = H + 1.55;
  const plaque = new THREE.Mesh(G_PLACA, placaMat(level));
  plaque.position.set(0, 1.74, d / 2 + 0.08);
  dyn.add(plaque);
  return { st, dyn, d, w, H, flag, flagMat, flagLow: H + 1.55, flagHigh: poleTop + 0.65, marker, winMat, light, plaque, chimney: level === 'M' ? V(w * 0.25, H + 1.7, -d * 0.2) : null };
}

// Casa de Dúvidas: térrea, amarela, com um grande "?" girando no alto
function duvidasBuilding() {
  const w = 3.6, d = 3.0, H = 2.0;
  const st = new THREE.Group(), dyn = new THREE.Group();
  st.add(box(w, H, d, DUVIDAS.parede, 0, H / 2, 0));
  st.add(box(w + 0.2, 0.2, d + 0.2, '#8b5a2b', 0, H, 0));
  const r = cone(w * 0.78, 1.3, DUVIDAS.telhado, 0, H + 0.65, 0, 4); r.rotation.y = Math.PI / 4; st.add(r);
  st.add(box(1.0, 1.4, 0.1, '#6b4423', 0, 0.7, d / 2 + 0.04));
  for (const x of [-1.15, 1.15]) st.add(box(0.6, 0.55, 0.06, '#fff3c4', x, 1.05, d / 2 + 0.03));
  const plaque = new THREE.Mesh(G_PLACA, placaMat('Q'));
  plaque.position.set(0, 1.74, d / 2 + 0.08);
  dyn.add(plaque);
  const marker = new THREE.Group();
  const mm = mat('#f2c94c', { emissive: '#7a5a00' });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 12, Math.PI * 1.5), mm); arc.position.y = 0.42; arc.rotation.z = -Math.PI / 2; marker.add(arc);
  const stem = new THREE.Mesh(G_BOX(0.12, 0.2, 0.12), mm); stem.position.y = 0.14; marker.add(stem);
  const dot = new THREE.Mesh(G_SPH(0.08, 6, 5), mm); dot.position.y = -0.08; marker.add(dot);
  marker.position.set(0, H + 1.9, 0);
  dyn.add(marker);
  return { st, dyn, d, w, H, marker, flag: null, winMat: null, plaque };
}

function campfire(st, dyn, x, y, z) {
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; st.add(sph(0.18, '#8a8478', x + Math.cos(a) * 0.55, y + 0.1, z + Math.sin(a) * 0.55, 5, 4)); }
  const l1 = cyl(0.09, 0.09, 1.0, '#6b4423', x, y + 0.14, z, 5); l1.rotation.set(0, 0.6, Math.PI / 2); st.add(l1);
  const l2 = cyl(0.09, 0.09, 1.0, '#7a5230', x, y + 0.18, z, 5); l2.rotation.set(0, -0.6, Math.PI / 2); st.add(l2);
  const flame = new THREE.Group(); flame.position.set(x, y + 0.2, z);
  const f1 = cone(0.32, 0.8, '#ff8a2a', 0, 0.4, 0, 6); f1.material = mat('#ff8a2a', { emissive: '#c84a00' });
  const f2 = cone(0.18, 0.55, '#ffd23a', 0, 0.3, 0, 6); f2.material = mat('#ffd23a', { emissive: '#c89a00' });
  flame.add(f1, f2);
  dyn.add(flame);
  return flame;
}

export function buildSettlement(def, ctx) {
  const { scene, collision, interaction, triggers } = ctx;
  const rnd = mulberry32(hashString(def.id));
  const region = REGIONS[def.regiao];
  const roof = region.pal.destaque, accent = region.pal.destaque2 || region.pal.destaque, wall = WALL[def.regiao];
  const baseH = settlementBaseH[def.id] ?? 0.3;
  const root = new THREE.Group(); root.position.set(def.x, 0, def.z); scene.add(root);
  const st = new THREE.Group(); root.add(st);
  const dyn = new THREE.Group(); root.add(dyn);
  const isCity = def.tipo === 'cidade', isCamp = def.tipo === 'acampamento', isArena = def.tipo === 'arena', isFinal = def.tipo === 'final';
  const S = {
    def, root, region, baseH, center: V(def.x, baseH, def.z), buildings: {}, lamps: [], updaters: [], npcs: [], animal: null,
    evolved: false, complete: false, finalMode: false, visible: true, hiddenSpots: [], fireworks: 0,
    plazaR: isCity ? 6 : 4, radius: isCity ? 20 : isArena ? 15 : isFinal ? 30 : 13,
  };
  const H = (lx, lz) => terrainHeight(def.x + lx, def.z + lz);
  const roads = roadAngles(def);
  const inA = isFinal ? Math.PI / 2 : (roads.find((r) => r.incoming) || roads[0] || { a: Math.PI / 2 }).a;
  S.entryAngle = inA;
  const occ = roads.map((r) => r.a);
  const at = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

  // ------------- frame de marco (L) -------------
  function makeL(lx, lz, rotY) {
    const gy = H(lx, lz);
    const gS = new THREE.Group(), gD = new THREE.Group();
    for (const g of [gS, gD]) { g.position.set(lx, gy, lz); g.rotation.y = rotY; }
    st.add(gS); dyn.add(gD);
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const toWorld = (x, y, z) => V(def.x + lx + x * c + z * s, gy + y, def.z + lz - x * s + z * c);
    const L = {
      st: gS, dyn: gD, s: S, groundY: gy,
      toWorld,
      toLocal(wx, wy, wz) { const dx = wx - def.x - lx, dz = wz - def.z - lz; return V(dx * c - dz * s, wy - gy, dx * s + dz * c); },
      collide(x, z, r) { const w = toWorld(x, 0, z); collision.addCircle(w.x, w.z, r); },
      collideDyn(x, z, r) {
        const w = toWorld(x, 0, z);
        const col = collision.addDynamic({ type: 'c', x: w.x, z: w.z, r });
        return { set(x2, z2) { const p = toWorld(x2, 0, z2); col.x = p.x; col.z = p.z; }, col };
      },
      interact(o) { const w = toWorld(o.lx, 0, o.lz); return interaction.add({ ...o, x: w.x, z: w.z }); },
      distToHero(x, z) { const w = toWorld(x, 0, z); return Math.hypot(G.hero.pos.x - w.x, G.hero.pos.z - w.z); },
    };
    return L;
  }

  function addLandmark(lx, lz, faceX, faceZ) {
    const rotY = Math.atan2(faceX - lx, faceZ - lz);
    const L = makeL(lx, lz, rotY);
    const api = (LANDMARKS[def.marco] || (() => ({})))(L) || {};
    root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(L.st);
    S.landmark = { ...api, L, x: def.x + lx, z: def.z + lz, top: Number.isFinite(bb.max.y) ? bb.max.y : L.groundY + 3 };
    // §10.3: cidade completa = marco melhorado e animado. Marcos sem evolução própria ganham coroa dourada
    S.evolveGeneric = () => {
      if (S._crown) return;
      const crown = new THREE.Group();
      crown.position.set(lx, S.landmark.top + 1.4, lz);
      const gold = mat('#f2c14e', { emissive: '#8a6a00' });
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), gold);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 4, 20), gold);
      halo.rotation.x = Math.PI / 2;
      crown.add(star, halo);
      dyn.add(crown);
      S._crown = crown;
      let spark = 0;
      S.updaters.push((t, dt) => {
        star.rotation.y = t * 1.5; star.position.y = Math.sin(t * 2) * 0.25;
        halo.rotation.z = t; halo.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
        if (S._d < 40 && (spark -= dt) <= 0) { spark = 1.6; G.particles.emit('dourado', def.x + lx, S.landmark.top + 1.4, def.z + lz, { count: 6 }); }
      });
    };
    return S.landmark;
  }

  // ------------- praça, fogueira, placa -------------
  function plaza(R) {
    st.add(cyl(R, R + 0.25, 0.14, '#d8cdb8', 0, baseH - 0.03, 0, 24));
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; st.add(box(0.6, 0.06, 0.35, '#bfb29a', Math.cos(a) * (R - 0.4), baseH + 0.05, Math.sin(a) * (R - 0.4))).children.at(-1).rotation.y = -a; }
  }
  function addCampfire(lx, lz) {
    const y = H(lx, lz);
    const flame = campfire(st, dyn, lx, y, lz);
    collision.addCircle(def.x + lx, def.z + lz, 0.7);
    S.campfire = { x: def.x + lx, z: def.z + lz, y, flame };
    interaction.add({ x: def.x + lx, z: def.z + lz, r: CONFIG.triggers.campfire, label: 'Sentar na fogueira', prio: 2, action: () => G.events.emit('campfire', S) });
    S.updaters.push((t) => { flame.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9.3) * 0.15, 1 + Math.cos(t * 11) * 0.08); flame.rotation.y = t * 2; });
  }
  function addSign(lx, lz, text) {
    const y = H(lx, lz);
    st.add(cyl(0.09, 0.09, 1.6, '#6b4423', lx, y + 0.8, lz, 5));
    const g = new THREE.Group(); g.position.set(lx, y + 1.55, lz); g.rotation.y = Math.atan2(-lx, -lz) + Math.PI;
    const tex = labelTexture(text);
    // um material só (textura nas duas faces; a borda fina estica a madeira): 1 draw call por placa
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.62, 0.08), new THREE.MeshLambertMaterial({ map: tex }));
    board.castShadow = true;
    g.add(board);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat('#f2c14e', { emissive: '#8a6a00' }));
    star.position.y = 0.6; star.visible = false; g.add(star);
    dyn.add(g);
    collision.addCircle(def.x + lx, def.z + lz, 0.25);
    S.sign = { g, star };
    S.updaters.push((t) => { g.rotation.z = Math.sin((t * Math.PI * 2) / 4) * 3 * (Math.PI / 180); if (star.visible) star.rotation.y = t * 2; });
  }
  function addBell(lx, lz) {
    const y = H(lx, lz);
    st.add(box(0.15, 2.4, 0.15, '#6b4423', lx - 0.6, y + 1.2, lz));
    st.add(box(0.15, 2.4, 0.15, '#6b4423', lx + 0.6, y + 1.2, lz));
    st.add(box(1.5, 0.15, 0.2, '#6b4423', lx, y + 2.4, lz));
    const g = new THREE.Group(); g.position.set(lx, y + 2.3, lz);
    const b = cone(0.32, 0.55, '#c9a24e', 0, -0.28, 0, 10); b.material = mat('#c9a24e'); g.add(b);
    g.add(sph(0.08, '#6b4423', 0, -0.58, 0, 5, 4));
    dyn.add(g);
    collision.addCircle(def.x + lx - 0.6, def.z + lz, 0.2); collision.addCircle(def.x + lx + 0.6, def.z + lz, 0.2);
    S.bell = { g, swing: 0, x: def.x + lx, z: def.z + lz };
    interaction.add({ x: def.x + lx, z: def.z + lz, r: CONFIG.triggers.bell, label: 'Tocar o sino', action: () => { S.bell.swing = 2; G.events.emit('bell', S); } });
    S.updaters.push((t, dt) => { if (S.bell.swing > 0) { S.bell.swing -= dt; g.rotation.z = Math.sin(S.bell.swing * 12) * 0.5 * (S.bell.swing / 2); } });
  }
  function addLamps(radius) {
    const lampMat = mat('#fff7e6', { emissive: '#000000' });
    S.lampMat = lampMat;
    const heads = new THREE.Group();
    const angles = [];
    for (const r of roads) angles.push(r.a + 0.28, r.a - 0.28);
    for (const a of angles.slice(0, 4)) {
      const [lx, lz] = at(a, radius);
      const y = H(lx, lz);
      if (y < 0.1) continue;
      st.add(cyl(0.07, 0.09, 2.6, '#3a2a1a', lx, y + 1.3, lz, 5));
      st.add(box(0.36, 0.1, 0.36, '#3a2a1a', lx, y + 2.65, lz));
      const head = new THREE.Mesh(G_SPH(0.2, 8, 6), lampMat); head.position.set(lx, y + 2.45, lz); heads.add(head);
      collision.addCircle(def.x + lx, def.z + lz, 0.18);
    }
    // as cabeças dos postes viram uma malha só com o material que acende (seção 10.3)
    const merged = bake(heads, lampMat);
    if (merged) dyn.add(merged);
  }
  function addJokeSign(lx, lz, text) {
    const y = H(lx, lz);
    if (y < 0.15) return;
    st.add(cyl(0.07, 0.07, 1.2, '#6b4423', lx, y + 0.6, lz, 5));
    const b = box(1.0, 0.6, 0.07, '#c49a6c', lx, y + 1.25, lz); b.rotation.y = Math.atan2(-lx, -lz); st.add(b);
    const q = box(0.12, 0.34, 0.09, '#3a2a1a', lx, y + 1.28, lz); q.rotation.y = b.rotation.y; st.add(q);
    collision.addCircle(def.x + lx, def.z + lz, 0.2);
    let shown = false;
    triggers.add({ x: def.x + lx, z: def.z + lz, r: CONFIG.triggers.sign, enter: () => { if (!shown || Math.random() < 0.5) G.ui.bubbles.sayAt(V(def.x + lx, y + 2.0, def.z + lz), text, { time: 4.5 }); shown = true; } });
  }
  function addPen(px, pz) {
    const y = H(px, pz);
    const half = 2.5;
    // lado com a abertura: o mais virado para o centro da praça
    const gapSide = Math.abs(px) > Math.abs(pz) ? (px > 0 ? 'W' : 'E') : (pz > 0 ? 'N' : 'S');
    const sides = { N: [[-half, -half], [half, -half]], S: [[-half, half], [half, half]], W: [[-half, -half], [-half, half]], E: [[half, -half], [half, half]] };
    for (const [k, [[x1, z1], [x2, z2]]] of Object.entries(sides)) {
      const n = 5;
      for (let i = 0; i <= n; i++) {
        const fx = lerp(x1, x2, i / n), fz = lerp(z1, z2, i / n);
        const mid = Math.abs(i - n / 2) < 1;
        if (k === gapSide && mid) continue;
        st.add(cyl(0.08, 0.08, 0.9, '#8b5a2b', px + fx, y + 0.45, pz + fz, 5));
        if (i < n && !(k === gapSide && Math.abs(i + 0.5 - n / 2) < 1.2)) {
          const len = Math.hypot(x2 - x1, z2 - z1) / n;
          const rail = box(k === 'N' || k === 'S' ? len : 0.08, 0.1, k === 'N' || k === 'S' ? 0.08 : len, '#a8764a', px + lerp(x1, x2, (i + 0.5) / n), y + 0.7, pz + lerp(z1, z2, (i + 0.5) / n));
          st.add(rail);
          const r2 = rail.clone(); r2.position.y = y + 0.35; st.add(r2);
          collision.addCircle(def.x + px + lerp(x1, x2, (i + 0.5) / n), def.z + pz + lerp(z1, z2, (i + 0.5) / n), 0.32);
        }
      }
    }
    st.add(box(1.2, 0.35, 0.5, '#8b5a2b', px - 1.4, y + 0.18, pz - 1.6));
    st.add(box(1.0, 0.06, 0.35, '#4fb3d9', px - 1.4, y + 0.36, pz - 1.6));
    st.add(sph(0.3, accent, px + 1.4, y + 0.3, pz - 1.4, 8, 6));
    S.pen = { x: def.x + px, z: def.z + pz, rot: 0 };
  }
  function addPhaseBuildings(theta0, radius, scale) {
    ['F', 'M', 'D'].forEach((lvl, k) => {
      const a = theta0 + (k * Math.PI * 2) / 3;
      const [lx, lz] = at(a, radius);
      const y = H(lx, lz);
      const b = phaseBuilding(lvl, NIVEIS[lvl].parede, NIVEIS[lvl].telhado);
      const rotY = Math.atan2(-lx, -lz);
      for (const g of [b.st, b.dyn]) { g.position.set(lx, y, lz); g.rotation.y = rotY; g.scale.setScalar(scale); }
      st.add(b.st); dyn.add(b.dyn);
      const dir = V(-lx, 0, -lz).normalize();
      const door = { x: def.x + lx + dir.x * (b.d / 2 * scale + 0.7), z: def.z + lz + dir.z * (b.d / 2 * scale + 0.7) };
      collision.addCircle(def.x + lx, def.z + lz, Math.max(b.w, b.d) * 0.6 * scale);
      const B = { ...b, level: lvl, x: def.x + lx, z: def.z + lz, y, door, rise: 0, riseTarget: 0, scale, rotY };
      S.buildings[lvl] = B;
      interaction.add({ x: door.x, z: door.z, r: CONFIG.triggers.door, prio: 3, label: `Entrar: ${NIVEIS[lvl].predio}`, action: () => G.events.emit('phaseDoor', { s: S, nivel: lvl }) });
      triggers.add({ x: door.x, z: door.z, r: CONFIG.triggers.door, enter: () => G.events.emit('doorNear', { s: S, nivel: lvl, on: true }), exit: () => G.events.emit('doorNear', { s: S, nivel: lvl, on: false }) });
      // atrás do prédio: esconderijo para baú/raiz
      S.hiddenSpots.push({ x: def.x + lx * 1.38, z: def.z + lz * 1.38 });
    });
  }
  // Casa de Dúvidas: lugar livre (longe de estradas, prédios, marco e cercado), com a porta virada para a praça
  function addDuvidas(used, scale) {
    const busy = [[def.x, def.z, S.plazaR + 1.2]];
    for (const B of Object.values(S.buildings)) busy.push([B.x, B.z, 3.2]);
    if (S.landmark) busy.push([S.landmark.x, S.landmark.z, 6.0]);
    if (S.pen) busy.push([S.pen.x, S.pen.z, 4.2]);
    for (const o of SETTLEMENTS) if (o !== def) busy.push([o.x, o.z, o.tipo === 'cidade' ? 13 : 10]);
    const radii = isCity ? [13.2, 14.6, 12.4, 16] : [10.6, 12, 9.6, 13.4];
    for (const rad of radii) for (let k = 0; k < 48; k++) {
      const a = inA + Math.PI + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 24);
      if (Math.min(...used.map((o) => angDist(a, o))) < 0.42) continue;
      const [hx, hz] = at(a, rad), wx = def.x + hx, wz = def.z + hz;
      if (busy.some(([bx, bz, br]) => (bx - wx) ** 2 + (bz - wz) ** 2 < (br + 2.4) ** 2)) continue;
      if (distToRoad(wx, wz, 8) < 3.0) continue;
      const dir = V(-hx, 0, -hz).normalize();
      const doorL = [hx + dir.x * (1.5 * scale + 0.7), hz + dir.z * (1.5 * scale + 0.7)];
      const pts = [[hx, hz], [hx + 1.8, hz], [hx - 1.8, hz], [hx, hz + 1.8], [hx, hz - 1.8], doorL];
      if (pts.some(([px, pz]) => H(px, pz) < 0.25)) continue;
      const b = duvidasBuilding(), y = H(hx, hz), rotY = Math.atan2(-hx, -hz);
      for (const g of [b.st, b.dyn]) { g.position.set(hx, y, hz); g.rotation.y = rotY; g.scale.setScalar(scale); }
      st.add(b.st); dyn.add(b.dyn);
      collision.addCircle(wx, wz, 2.1 * scale);
      const door = { x: def.x + doorL[0], z: def.z + doorL[1] };
      S.buildings.Q = { ...b, level: 'Q', x: wx, z: wz, y, door, rise: 0, riseTarget: 0, scale, rotY };
      interaction.add({ x: door.x, z: door.z, r: CONFIG.triggers.door, prio: 3, label: 'Entrar: Casa de Dúvidas (ajuda, sem custo)', action: () => G.events.emit('duvidasDoor', S) });
      used.push(a);
      return;
    }
  }
  function addRaizCidade(lx, lz) {
    const m = makeRaizinhaModel({ corpo: accent, anel: roof, folha: '#9ad37a' });
    m.root.position.set(lx, H(lx, lz), lz);
    m.root.scale.setScalar(1.15);
    m.root.visible = false;
    dyn.add(m.root);
    S.raizCidade = m;
    S.updaters.push((t) => { if (m.root.visible) { m.body.position.y = Math.abs(Math.sin(t * 3)) * 0.25; m.root.rotation.y = Math.sin(t) * 0.6; m.leaves.rotation.y = t * 3; } });
  }

  // ======================= tipos =======================
  if (isCity || isCamp) {
    const R = S.plazaR;
    plaza(R);
    addCampfire(0, 0);
    const [sx, sz] = at(inA + 0.55, R + 0.9);
    addSign(sx, sz, def.nome.length > 22 ? def.nome.split(' ')[0] : def.nome);
    // marco a 11 unidades, ao lado de quem chega
    const lmA = bestAngle([inA + 0.85, inA - 0.85, inA + 1.25, inA - 1.25, inA + 1.6, inA - 1.6], occ);
    const [lx, lz] = at(lmA, isCity ? 11.5 : 10.5);
    const [ex, ez] = at(inA, 22);
    addLandmark(lx, lz, ex, ez);
    const used = [...occ, lmA];
    if (def.metodo) {
      const cands = [];
      for (let k = 0; k < 24; k++) cands.push((k / 24) * ((Math.PI * 2) / 3) + rnd() * 0.05);
      // escolhe θ0 que deixa os 3 prédios longe das estradas e do marco
      let best = 0, bd = -1;
      for (const a of cands) {
        const d = Math.min(...[0, 1, 2].map((k) => Math.min(...used.map((o) => angDist(a + (k * Math.PI * 2) / 3, o)))));
        if (d > bd) { bd = d; best = a; }
      }
      addPhaseBuildings(best, isCity ? 8.3 : 6.6, isCity ? 1 : 0.82);
      for (let k = 0; k < 3; k++) used.push(best + (k * Math.PI * 2) / 3);
      // cercadinho junto ao marco
      if (def.bicho) {
        const side = bestAngle([lmA + 0.5, lmA - 0.5], occ);
        const [px, pz] = at(side, isCity ? 15.5 : 14);
        addPen(px, pz);
        used.push(side);
      }
      if (def.duvidas) addDuvidas(used, isCity ? 1 : 0.9);
    }
    addBell(...at(inA - 0.75, R + 1.3));
    addLamps(isCity ? 10 : 8.2);
    const joke = PLACAS[def.id] || PLACAS_EXTRA[Math.floor(rnd() * PLACAS_EXTRA.length)];
    const [jx, jz] = at(inA, isCity ? 16 : 12);
    const perp = inA + Math.PI / 2;
    addJokeSign(jx + Math.cos(perp) * 2.8, jz + Math.sin(perp) * 2.8, joke);
    // casas decorativas (só nas cidades) em anel de raio 14
    if (isCity) {
      // ocupação real (em coordenadas do mundo) para garantir as 6 casas da planta padrão
      const busy = [[def.x, def.z, R + 1.5]];
      for (const B of Object.values(S.buildings)) busy.push([B.x, B.z, 3.0]);
      if (S.landmark) busy.push([S.landmark.x, S.landmark.z, 6.0]);
      if (S.pen) busy.push([S.pen.x, S.pen.z, 4.2]);
      for (const o of SETTLEMENTS) if (o !== def) busy.push([o.x, o.z, o.tipo === 'cidade' ? 13 : o.tipo === 'arena' ? 12 : 9]);
      const free = (hx, hz) => {
        const wx = def.x + hx, wz = def.z + hz;
        if (busy.some(([bx, bz, br]) => (bx - wx) ** 2 + (bz - wz) ** 2 < (br + 2.0) ** 2)) return false;
        if (distToRoad(wx, wz, 8) < 2.6) return false;
        for (const [dx, dz] of [[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) if (H(hx + dx, hz + dz) < 0.2) return false;
        return true;
      };
      const spots = [];
      for (const rad of [14, 15.5, 12.8, 17, 18.5]) for (let k = 0; k < 48; k++) spots.push([lmA + 0.5 + (k / 48) * Math.PI * 2, rad]);
      let placed = 0;
      for (const [a, rad] of spots) {
        if (placed >= 6) break;
        const [hx, hz] = at(a, rad);
        if (!free(hx, hz)) continue;
        busy.push([def.x + hx, def.z + hz, 1.9]);
        const house = makeHouse(placed % 3, roof, wall);
        house.position.set(hx, H(hx, hz), hz);
        house.rotation.y = Math.atan2(-hx, -hz);
        st.add(house);
        collision.addCircle(def.x + hx, def.z + hz, 1.85);
        S.hiddenSpots.push({ x: def.x + hx * 1.22, z: def.z + hz * 1.22 });
        used.push(a);
        placed++;
      }
      S.houseCount = placed;
    } else {
      // acampamento: 3 tendas
      let placed = 0;
      for (let k = 0; k < 16 && placed < 3; k++) {
        const a = inA + Math.PI + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.4;
        if (Math.min(...used.map((o) => angDist(a, o))) < 0.4) continue;
        const [tx, tz] = at(a, def.metodo ? 10.4 : 8.5);
        const ty = H(tx, tz);
        if (ty < 0.2) continue;
        const c = def.id === 'A0' ? (placed % 2 ? '#f2c14e' : '#e8654a') : placed % 2 ? accent : roof;
        const tent = cone(1.45, 2.0, c, tx, ty + 1.0, tz, 4); tent.rotation.y = Math.atan2(-tx, -tz) + Math.PI / 4; st.add(tent);
        const flap = box(0.08, 1.0, 0.8, '#3a2a1a', tx * 0.88, ty + 0.5, tz * 0.88); flap.rotation.y = Math.atan2(-tx, -tz) + Math.PI / 2; st.add(flap);
        collision.addCircle(def.x + tx, def.z + tz, 1.3);
        used.push(a); placed++;
      }
    }
    if (def.metodo) addRaizCidade(...at(inA + Math.PI, 2.6));
  }

  if (isArena) {
    const R = 10;
    st.add(cyl(R, R + 0.3, 0.16, '#b9b2a6', 0, baseH - 0.02, 0, 28));
    st.add(mesh(new THREE.RingGeometry(3.2, 3.6, 28), '#8a8478', 0, baseH + 0.07, 0)).children.at(-1).rotation.x = -Math.PI / 2;
    const n = 30, gateHalf = 0.24;
    // a arena fica sobre a estrada: além da entrada, tem uma saída para o trecho seguinte
    const outRoad = roads.find((r) => !r.incoming && angDist(r.a, inA) > 0.8);
    const outA = outRoad ? outRoad.a : null;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (angDist(a, inA) < gateHalf + 0.06) continue;
      if (outA !== null && angDist(a, outA) < gateHalf + 0.06) continue;
      const [wx, wz] = at(a, R + 0.5);
      const seg = box(2.2, 1.7, 0.7, k % 2 ? '#8a8478' : '#9a9488', wx, H(wx, wz) + 0.85, wz); seg.rotation.y = -a + Math.PI / 2; st.add(seg);
      collision.addCircle(def.x + wx, def.z + wz, 0.85);
      if (k % 5 === 0) {
        st.add(cyl(0.06, 0.06, 2.4, '#6b4423', wx, H(wx, wz) + 2.9, wz, 4));
        const fl = box(0.05, 0.5, 0.8, roof, wx, H(wx, wz) + 3.7, wz); fl.position.x += 0.4 * Math.cos(a + 1.57); st.add(fl);
      }
    }
    // portões: a entrada abre com as estrelas mínimas; a saída, quando o chefão cai
    const makeGate = (ang, color) => {
      const gate = { doors: [], cols: [], open: 0, want: 0 };
      for (const sgn of [-1, 1]) {
        const ea = ang + sgn * gateHalf;
        const [gx, gz] = at(ea, R + 0.5);
        st.add(box(0.7, 3.0, 0.7, '#6b6f78', gx, H(gx, gz) + 1.5, gz));
        const piv = new THREE.Group(); piv.position.set(gx, H(gx, gz), gz);
        piv.rotation.y = -ea; // o eixo −z·sgn do pivô aponta para o meio do portão
        const door = box(0.22, 2.4, 2.5, color, 0, 1.2, sgn * -1.25);
        door.castShadow = true;
        piv.add(door);
        dyn.add(piv);
        gate.doors.push({ piv, base: piv.rotation.y, sgn });
      }
      for (let i = -2; i <= 2; i++) {
        const [cx, cz] = at(ang + i * 0.1, R + 0.5);
        gate.cols.push(collision.addDynamic({ type: 'c', x: def.x + cx, z: def.z + cz, r: 0.75 }));
      }
      S.updaters.push((t, dt) => {
        gate.open += clamp(gate.want - gate.open, -dt, dt);
        for (const d of gate.doors) d.piv.rotation.y = d.base + d.sgn * ease(gate.open) * 1.6;
        for (const c of gate.cols) c.enabled = gate.open < 0.5;
      });
      return gate;
    };
    S.gate = makeGate(inA, '#8b5a2b');
    if (outA !== null) S.gateExit = makeGate(outA, '#6b4423');
    const [gx, gz] = at(inA, R + 2.5);
    S.gatePos = { x: def.x + gx, z: def.z + gz };
    triggers.add({ x: S.gatePos.x, z: S.gatePos.z, r: 4.5, enter: () => G.events.emit('gateNear', S) });
    // marco num canto livre (longe da entrada e da saída), olhando para a entrada
    const lmAng = bestAngle(Array.from({ length: 24 }, (_, k) => (k / 24) * Math.PI * 2), outA === null ? [inA] : [inA, outA]);
    const [lx, lz] = at(lmAng, 4.8);
    const [ex, ez] = at(inA, 20);
    addLandmark(lx, lz, ex, ez);
    // pedestal do chefão
    const [px, pz] = at(inA, 1.4);
    const py = H(px, pz);
    st.add(cyl(1.3, 1.5, 0.3, '#6b6f78', px, py + 0.15, pz, 16));
    const ringMat = mat('#e8454a', { emissive: '#7a0000' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 6, 24), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(px, py + 0.34, pz); dyn.add(ring);
    const marker = new THREE.Group();
    const mm = mat('#f2c14e', { emissive: '#7a5a00' });
    const bar = new THREE.Mesh(G_BOX(0.2, 0.6, 0.2), mm); bar.position.y = 0.4; marker.add(bar);
    marker.add(new THREE.Mesh(G_SPH(0.13, 6, 5), mm));
    marker.position.set(px, py + 1.8, pz); dyn.add(marker);
    st.add(cyl(0.06, 0.06, 3.4, '#6b4423', px + 1.8, py + 1.7, pz, 5));
    const flagMat = mat('#9a9a9a', { emissive: '#000000' });
    const flag = new THREE.Mesh(G_BOX(0.05, 0.5, 0.9), flagMat); flag.position.set(px + 1.8, py + 1.2, pz + 0.45); dyn.add(flag);
    S.buildings.B = { level: 'B', door: { x: def.x + px, z: def.z + pz }, marker, flag, flagMat, flagLow: py + 1.2, flagHigh: py + 3.1, rise: 0, riseTarget: 0, winMat: null, x: def.x + px, z: def.z + pz, y: py, ringMat };
    interaction.add({ x: def.x + px, z: def.z + pz, r: 2.6, prio: 3, label: 'Enfrentar o chefão', action: () => G.events.emit('phaseDoor', { s: S, nivel: 'B' }) });
    triggers.add({ x: def.x + px, z: def.z + pz, r: 2.6, enter: () => G.events.emit('doorNear', { s: S, nivel: 'B', on: true }), exit: () => G.events.emit('doorNear', { s: S, nivel: 'B', on: false }) });
    // fogueira do lado de fora
    const [fx, fz] = at(inA + 0.42, R + 4.2);
    addCampfire(fx, fz);
    const [sx2, sz2] = at(inA - 0.42, R + 3.2);
    addSign(sx2, sz2, def.nome.split(' ').slice(0, 2).join(' '));
  }

  if (isFinal) {
    const R = 27;
    const n = 56, gateHalf = 0.1;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (angDist(a, inA) < gateHalf + 0.04) continue;
      const [wx, wz] = at(a, R);
      const y = terrainHeight(wx, wz);
      const seg = box(3.2, 3.4, 1.3, k % 2 ? '#8d9199' : '#7d8189', wx, y + 1.5, wz); seg.rotation.y = -a + Math.PI / 2; st.add(seg);
      if (k % 2 === 0) { const s2 = box(3.25, 0.35, 1.35, '#f2c14e', wx, y + 2.6, wz); s2.rotation.y = seg.rotation.y; st.add(s2); }
      collision.addCircle(def.x + wx, def.z + wz, 1.25);
      const [wx2, wz2] = at(a + Math.PI / n, R);
      collision.addCircle(def.x + wx2, def.z + wz2, 1.25);
    }
    const gate = { doors: [], cols: [], open: 0, want: 0 };
    for (const sgn of [-1, 1]) {
      const ea = inA + sgn * (gateHalf + 0.03);
      const [gx, gz] = at(ea, R);
      st.add(box(1.2, 5.0, 1.2, '#4a4f57', gx, terrainHeight(gx, gz) + 2.5, gz));
      const door = box(2.75, 3.6, 0.4, '#5a5f67', 0, 1.8, 0);
      const piv = new THREE.Group(); piv.position.set(at(inA + sgn * 0.051, R)[0], terrainHeight(...at(inA, R)), at(inA + sgn * 0.051, R)[1]);
      piv.add(door); piv.add(box(1.2, 0.3, 0.45, '#b7ff3c', 0, 2.6, 0));
      dyn.add(piv);
      gate.doors.push({ piv, sgn, base: piv.position.clone() });
    }
    for (let i = -1; i <= 1; i++) { const [cx, cz] = at(inA + i * 0.05, R); gate.cols.push(collision.addDynamic({ type: 'c', x: cx, z: cz, r: 1.1 })); }
    S.gate = gate;
    S.gatePos = { x: 0, z: R + 2.5 };
    triggers.add({ x: 0, z: R + 3, r: 5, enter: () => G.events.emit('usinaGateNear', S) });
    S.updaters.push((t, dt) => {
      gate.open += clamp(gate.want - gate.open, -dt * 0.6, dt * 0.6);
      for (const d of gate.doors) d.piv.position.x = d.base.x + d.sgn * ease(gate.open) * 2.2;
      for (const c of gate.cols) c.enabled = gate.open < 0.6;
    });
    addLandmark(0, 0, 0, 20);
    const py = terrainHeight(0, 9.5);
    st.add(cyl(1.5, 1.7, 0.3, '#4a4f57', 0, py + 0.15, 9.5, 16));
    const ringMat = mat('#b7ff3c', { emissive: '#4a7a00' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.09, 6, 24), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(0, py + 0.34, 9.5); dyn.add(ring);
    const marker = new THREE.Group();
    const mm = mat('#b7ff3c', { emissive: '#4a7a00' });
    const bar = new THREE.Mesh(G_BOX(0.2, 0.6, 0.2), mm); bar.position.y = 0.4; marker.add(bar);
    marker.add(new THREE.Mesh(G_SPH(0.13, 6, 5), mm));
    marker.position.set(0, py + 1.9, 9.5); dyn.add(marker);
    S.buildings.B = { level: 'B', door: { x: 0, z: 9.5 }, marker, flag: null, rise: 0, riseTarget: 0, x: 0, z: 9.5, y: py, ringMat };
    interaction.add({ x: 0, z: 9.5, r: 2.8, prio: 3, label: 'Enfrentar o Grande Erro', action: () => G.events.emit('phaseDoor', { s: S, nivel: 'B' }) });
    triggers.add({ x: 0, z: 9.5, r: 2.8, enter: () => G.events.emit('doorNear', { s: S, nivel: 'B', on: true }), exit: () => G.events.emit('doorNear', { s: S, nivel: 'B', on: false }) });
    addCampfire(6, 20);
    addSign(-5, 31, 'Usina Central');
  }

  // ------------- atualização -------------
  const tmp = V(0, 0, 0);
  S.update = (t, dt, near) => {
    for (const u of S.updaters) u(t, dt);
    S.landmark?.update?.(t, dt, near);
    for (const B of Object.values(S.buildings)) {
      if (B.marker) { B.marker.position.y = (B.markerBase ??= B.marker.position.y) + Math.abs(Math.sin(t * 4)) * 0.3; B.marker.rotation.y = t * 1.5; B.marker.visible = !B.won || B.level === 'B'; }
      if (B.light) B.light.material.emissive.set(Math.floor(t * 2) % 2 === 0 ? '#ff0000' : '#330000');
      if (B.flag) {
        if (B.rise !== B.riseTarget) B.rise = clamp(B.rise + Math.sign(B.riseTarget - B.rise) * (dt / CONFIG.ui.flagRise), 0, 1);
        if (B.scale) B.flag.position.y = lerp(B.flagLow, B.flagHigh, ease(B.rise));
        else B.flag.position.y = lerp(B.flagLow, B.flagHigh, ease(B.rise));
        if (B.won) B.flag.rotation.y = Math.sin(t * 3 + B.x) * 0.15;
      }
      if (near && B.chimney && Math.random() < dt * 2) {
        tmp.copy(B.chimney).multiplyScalar(B.scale);
        tmp.applyAxisAngle(V(0, 1, 0), B.rotY);
        G.particles.emit('fumaca', B.x + tmp.x, B.y + tmp.y, B.z + tmp.z, { small: true });
      }
      if (near && B.smokeLoss > 0 && Math.random() < dt * 3) { G.particles.emit('fumaca', B.x, B.y + B.H * B.scale + 1.5, B.z); }
      if (B.smokeLoss > 0) B.smokeLoss -= dt;
      if (B.ringMat) B.ringMat.emissive.setScalar(0.3 + 0.3 * Math.sin(t * 4));
    }
    if (S.fireworks > 0) {
      S.fireworks -= dt;
      if (Math.random() < dt * 4) G.particles.emit('fogos', S.center.x + (Math.random() - 0.5) * 16, S.center.y + 9 + Math.random() * 5, S.center.z + (Math.random() - 0.5) * 16);
    }
  };

  S.setVisible = (v) => {
    if (S.visible === v) return;
    S.visible = v;
    root.visible = v;
    for (const n of S.npcs) n.rig.root.visible = v;
    if (S.animal) for (const P of S.animal.models) { P.root.visible = v; }
    if (S.animal) S.animal.P.extraRoot.visible = v;
  };

  // bake das partes estáticas: uma malha só
  const baked = bake(st);
  root.remove(st);
  if (baked) { baked.castShadow = true; baked.receiveShadow = true; root.add(baked); }
  S.baked = baked;
  return S;
}
