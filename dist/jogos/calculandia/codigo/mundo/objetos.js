// Fábricas de árvores, pedras e casas + vegetação instanciada por blocos (seções 3 e 7.1).
import * as THREE from 'three';
import { SETTLEMENTS, CLEAR_RADIUS } from '../dados/regioes-e-cidades.js';
import { terrainHeight, regionAt, nearestRiver, inCreek, creekData } from './terreno.js';
import { bridgeAt } from './pontes.js';
import { distToRoad } from './estradas.js';
import { mudPuddles, nearStream } from './chao.js';
import { mergeColored, M4, VC_MAT, box, cone, cyl, grp } from '../utilitarios/geometria.js';
import { mulberry32, fbm, distToSeg } from '../utilitarios/matematica.js';
import { CONFIG } from '../configuracao.js';

// uniforms compartilhados pela grama/trigo/flores (balanço no shader)
export const vegUniforms = { uTime: { value: 0 }, uHero: { value: new THREE.Vector3(9999, 0, 9999) } };

function swayMaterial(base, wheat = false) {
  const m = new THREE.MeshLambertMaterial(base);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = vegUniforms.uTime;
    sh.uniforms.uHero = vegUniforms.uHero;
    sh.vertexShader = 'uniform float uTime;\nuniform vec3 uHero;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4(transformed, 1.0);
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #endif
      float hgt = max(transformed.y, 0.0);
      vec2 bend = vec2(sin(1.5 * uTime + 0.3 * ip.x) * 0.12, 0.0);
      vec2 dh = ip.xz - uHero.xz; float dl = length(dh);
      bend += (dl > 0.001 ? dh / dl : vec2(0.0)) * (1.0 - smoothstep(0.15, 1.2, dl)) * 0.5;
      ${wheat ? `float front = -170.0 + mod(uTime, 10.0) * 34.0;
      float dd = dot(ip.xz, vec2(0.8, 0.6)) - front;
      bend += vec2(0.8, 0.6) * exp(-dd * dd / 40.0) * 0.5;` : ''}
      mvPosition.xz += bend * hgt;
      mvPosition.y -= dot(bend, bend) * hgt * 0.35;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;
    `);
  };
  return m;
}

// ---------- geometrias de árvores (uma por variante, cores por vértice) ----------
// Troncos sem tampa e copas poliédricas: poucas faces por árvore (orçamento de 80 mil triângulos, §3)
const trunk = (rt, rb, h, seg = 5) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, true);
const TREE_DEFS = {
  palm: () => {
    const p = [];
    for (let i = 0; i < 4; i++) p.push({ geo: trunk(0.16 - i * 0.02, 0.2 - i * 0.02, 0.95), color: i % 2 ? '#a07a4a' : '#8b6a3e', matrix: M4(i * i * 0.06, 0.47 + i * 0.9, 0, 0, 0, -0.1 * i) });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      p.push({ geo: new THREE.ConeGeometry(0.32, 2.0, 3, 1, true), color: k % 2 ? '#5fae4a' : '#4f9a3e', matrix: M4(0.64 + Math.cos(a) * 0.8, 3.55, Math.sin(a) * 0.8, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25, 1, 1, 0.35) });
    }
    p.push({ geo: new THREE.OctahedronGeometry(0.17, 0), color: '#6b4423', matrix: M4(0.75, 3.35, 0.15) });
    p.push({ geo: new THREE.OctahedronGeometry(0.17, 0), color: '#6b4423', matrix: M4(0.55, 3.3, -0.15) });
    return { parts: p, r: 0.32 };
  },
  round: (c1 = '#7fbf4a', c2 = '#8fcf5a') => ({
    parts: [
      { geo: trunk(0.18, 0.26, 1.5), color: '#7a5230', matrix: M4(0, 0.75, 0) },
      { geo: new THREE.IcosahedronGeometry(1.15, 0), color: c1, matrix: M4(0, 2.1, 0) },
      { geo: new THREE.IcosahedronGeometry(0.75, 0), color: c2, matrix: M4(0.55, 2.65, 0.25) },
    ], r: 0.36,
  }),
  pine: (c = '#1f4f2c') => ({
    parts: [
      { geo: trunk(0.16, 0.24, 1.2), color: '#5a3a20', matrix: M4(0, 0.6, 0) },
      { geo: new THREE.ConeGeometry(1.2, 1.7, 6), color: c, matrix: M4(0, 1.7, 0) },
      { geo: new THREE.ConeGeometry(0.95, 1.5, 6, 1, true), color: c, matrix: M4(0, 2.5, 0) },
      { geo: new THREE.ConeGeometry(0.65, 1.2, 6, 1, true), color: c, matrix: M4(0, 3.25, 0) },
    ], r: 0.34,
  }),
  jungle: () => ({
    parts: [
      { geo: trunk(0.28, 0.42, 3.4, 6), color: '#5a3d22', matrix: M4(0, 1.7, 0) },
      { geo: new THREE.IcosahedronGeometry(1.5, 0), color: '#2f6b3a', matrix: M4(0, 3.9, 0) },
      { geo: new THREE.IcosahedronGeometry(1.1, 0), color: '#1f4f2c', matrix: M4(1.0, 3.5, 0.4) },
      { geo: new THREE.IcosahedronGeometry(1.0, 0), color: '#3a7d45', matrix: M4(-0.8, 3.6, -0.5) },
      { geo: trunk(0.04, 0.04, 2.2, 3), color: '#4f8a3a', matrix: M4(0.9, 2.3, 0.3) },
    ], r: 0.5,
  }),
  cactus: () => ({
    parts: [
      { geo: trunk(0.32, 0.36, 2.2, 6), color: '#6f9a4a', matrix: M4(0, 1.1, 0) },
      { geo: new THREE.SphereGeometry(0.32, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), color: '#6f9a4a', matrix: M4(0, 2.2, 0) },
      { geo: trunk(0.18, 0.2, 0.7), color: '#7aa652', matrix: M4(0.48, 1.0, 0, 0, 0, Math.PI / 2) },
      { geo: new THREE.CylinderGeometry(0.17, 0.18, 0.8, 5), color: '#7aa652', matrix: M4(0.8, 1.35, 0) },
      { geo: new THREE.CylinderGeometry(0.16, 0.17, 0.6, 5), color: '#7aa652', matrix: M4(-0.62, 1.55, 0) },
      { geo: trunk(0.16, 0.18, 0.5), color: '#7aa652', matrix: M4(-0.38, 1.3, 0, 0, 0, Math.PI / 2) },
      { geo: new THREE.OctahedronGeometry(0.13, 0), color: '#f28ab2', matrix: M4(0, 2.55, 0) },
    ], r: 0.42,
  }),
  dead: () => ({
    parts: [
      { geo: trunk(0.14, 0.26, 2.4), color: '#8b6b4a', matrix: M4(0, 1.2, 0, 0, 0, 0.06) },
      { geo: trunk(0.06, 0.1, 1.2, 3), color: '#8b6b4a', matrix: M4(0.4, 2.0, 0, 0, 0, -0.8) },
      { geo: trunk(0.05, 0.09, 1.0, 3), color: '#8b6b4a', matrix: M4(-0.35, 2.2, 0.1, 0.2, 0, 0.9) },
    ], r: 0.3,
  }),
  lolly: (c) => ({
    parts: [
      { geo: trunk(0.1, 0.13, 2.0), color: '#f4ead8', matrix: M4(0, 1.0, 0) },
      { geo: new THREE.IcosahedronGeometry(1.0, 1), color: c, matrix: M4(0, 2.6, 0) },
      { geo: new THREE.TorusGeometry(0.75, 0.08, 3, 10), color: '#ffffff', matrix: M4(0, 2.6, 0.62, 0, 0, 0, 1, 1, 0.6) },
    ], r: 0.24,
  }),
};

const TREE_VARIANTS = {
  palm: TREE_DEFS.palm(),
  round_base: TREE_DEFS.round('#9ccc5a', '#aedb6a'),
  round_r0: TREE_DEFS.round('#b7d15a', '#c6dc6a'),
  round_r4: TREE_DEFS.round('#7fbf4a', '#8fcf5a'),
  pine: TREE_DEFS.pine('#1f4f2c'),
  pine_r0: TREE_DEFS.pine('#5f9a3a'),
  jungle: TREE_DEFS.jungle(),
  cactus: TREE_DEFS.cactus(),
  dead: TREE_DEFS.dead(),
  lolly_teal: TREE_DEFS.lolly('#3cc0a0'),
  lolly_pink: TREE_DEFS.lolly('#f28ab2'),
  lolly_yellow: TREE_DEFS.lolly('#f2c14e'),
};
const TREE_GEO = {};
function treeGeo(v) { return (TREE_GEO[v] ||= mergeColored(TREE_VARIANTS[v].parts)); }

// Árvore avulsa (para marcos e cenas)
export function makeTree(variant = 'round_base') {
  return new THREE.Mesh(treeGeo(variant), VC_MAT);
}

const REGION_TREES = [
  [['palm', 0.6], ['round_base', 0.4]],
  [['round_r0', 0.75], ['pine_r0', 0.25]],
  [['jungle', 0.6], ['pine', 0.4]],
  [['cactus', 0.55], ['dead', 0.45]],
  [['lolly_teal', 0.4], ['lolly_pink', 0.3], ['lolly_yellow', 0.3]],
  [['palm', 0.75], ['round_r4', 0.25]],
  [],
];
const TREE_P = [0.2, 0.15, 0.62, 0.13, 0.28, 0.2, 0];
const GRASS_P = [0.55, 0.7, 0.85, 0.2, 0.85, 0.45, 0];
const GRASS_COL = ['#8fc24f', '#a9c84e', '#3f7f3a', '#a39a5a', '#7cc35f', '#a9cf6a', '#777'];
const ROCK_COL = ['#b9b2a6', '#b8a98a', '#7a7f6a', '#c99a6a', '#a7b0a0', '#c9bfae', '#6b6f78'];
const BUSH_COL = ['#7fb24a', '#a3b84a', '#2c5f34', '#8f8a52', '#2fa58a', '#6fa04a', '#555'];

// ---------- instâncias por blocos de 40×40 (para o frustum culling funcionar) ----------
const CHUNK = 40;
class Chunked {
  constructor(scene, geo, material, items, { shadow = false } = {}) {
    const byKey = new Map();
    for (const it of items) {
      const k = `${Math.floor(it.x / CHUNK)},${Math.floor(it.z / CHUNK)}`;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(it);
    }
    this.meshes = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const c = new THREE.Color();
    for (const list of byKey.values()) {
      const mesh = new THREE.InstancedMesh(geo, material, list.length);
      list.forEach((it, i) => {
        m.compose(p.set(it.x, it.y, it.z), q.setFromEuler(e.set(it.rx || 0, it.ry || 0, it.rz || 0)), s.set(it.s, it.sy ?? it.s, it.s));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.set(it.color || '#ffffff'));
        it.ref = { mesh, i };
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = shadow;
      mesh.receiveShadow = !shadow;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function setInstance(it, { rx = it.rx || 0, rz = it.rz || 0, sy = it.sy ?? it.s, dy = 0 } = {}) {
  _m.compose(_p.set(it.x, it.y + dy, it.z), _q.setFromEuler(_e.set(rx, it.ry || 0, rz)), _s.set(it.s, sy, it.s));
  it.ref.mesh.setMatrixAt(it.ref.i, _m);
  it.ref.mesh.instanceMatrix.needsUpdate = true;
}

function grassGeometry() {
  const pos = [], col = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + 0.3;
    const ca = Math.cos(a) * 0.07, sa = Math.sin(a) * 0.07;
    const lean = (k - 1) * 0.08;
    pos.push(-ca, 0, -sa, ca, 0, sa, lean, 0.5 + k * 0.06, lean * 0.5);
    col.push(0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 1.15, 1.15, 1.15);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function wheatGeometry() {
  const parts = [
    { geo: trunk(0.025, 0.03, 0.9, 3), color: '#d8b75a', matrix: M4(0, 0.45, 0) },
    { geo: new THREE.OctahedronGeometry(0.08, 0), color: '#f0d27a', matrix: M4(0, 1.0, 0, 0, 0, 0, 0.8, 2, 0.8) },
    { geo: trunk(0.025, 0.03, 0.75, 3), color: '#d8b75a', matrix: M4(0.12, 0.37, 0.05, 0, 0, -0.15) },
    { geo: new THREE.OctahedronGeometry(0.07, 0), color: '#f0d27a', matrix: M4(0.2, 0.82, 0.07, 0, 0, -0.15, 0.8, 2, 0.8) },
  ];
  return mergeColored(parts);
}

// Bloqueios para espalhar props (estradas, cidades, rios, pontes)
export function clearAt(x, z, roadMargin = 2) {
  const h = terrainHeight(x, z);
  if (h < 0.12) return false;
  if (Math.hypot(x, z) < 31) return false;
  if (bridgeAt(x, z, 2.5)) return false;
  for (const s of SETTLEMENTS) {
    const r = s.id === 'A0' ? 14 : CLEAR_RADIUS[s.tipo];
    if ((x - s.x) ** 2 + (z - s.z) ** 2 < r * r) return false;
  }
  const rv = nearestRiver(x, z);
  if (rv.river && rv.d < rv.river.hw + 2.2) return false;
  if (x > creekData.minX - 2 && x < creekData.maxX + 2 && z > creekData.minZ - 2 && z < creekData.maxZ + 2) {
    for (let i = 0; i < creekData.line.length - 1; i++) {
      const a = creekData.line[i], b = creekData.line[i + 1];
      if (distToSeg(x, z, a[0], a[1], b[0], b[1]) < 1.6) return false;
    }
  }
  if (distToRoad(x, z, roadMargin + 3) < roadMargin) return false;
  if (nearStream(x, z, 1.2)) return false;
  return true;
}

export function buildProps(scene, collision) {
  const rnd = mulberry32(20240611);
  const trees = {};
  const all = [];
  const rocks = [], bushes = [], grass = [], wheat = [], stems = [], heads = [];

  const addTree = (variant, x, z, s, extra = {}) => {
    const y = terrainHeight(x, z) - 0.05;
    const it = { variant, x, y, z, ry: rnd() * Math.PI * 2, s, color: '#ffffff', ...extra };
    const v = 0.9 + rnd() * 0.2;
    it.color = new THREE.Color(v, v, v).getStyle();
    (trees[variant] ||= []).push(it);
    all.push(it);
    it.col = collision.addCircle(x, z, TREE_VARIANTS[variant].r * s + 0.05, { tree: true });
    return it;
  };

  // árvore do tutorial (logo depois do riacho)
  const tutorialTree = addTree('round_base', -27, 90, 1.05, { tutorial: true, shakeable: true });

  for (let gx = -134; gx <= 134; gx += 3) {
    for (let gz = -134; gz <= 134; gz += 3) {
      const x = gx + (rnd() - 0.5) * 2.8, z = gz + (rnd() - 0.5) * 2.8;
      const r = rnd(), r2 = rnd();
      if (!clearAt(x, z, 2)) continue;
      const ri = regionAt(x, z);
      const n = fbm(x * 0.045 + 3, z * 0.045 - 8);
      const p = TREE_P[ri] * (0.35 + 1.4 * n);
      if (r < p && Math.hypot(x + 27, z - 90) > 4) {
        const mix = REGION_TREES[ri];
        let acc = 0, v = mix[0][0];
        for (const [name, w] of mix) { acc += w; if (r2 <= acc) { v = name; break; } }
        addTree(v, x, z, 0.8 + rnd() * 0.5);
      } else if (r < p + 0.05) {
        const s = 0.4 + rnd() * 0.9;
        const y = terrainHeight(x, z) - 0.1;
        rocks.push({ x, y, z, ry: rnd() * 6, rx: rnd() * 0.5, s, sy: s * (0.6 + rnd() * 0.5), color: ROCK_COL[ri] });
        if (s > 0.75) collision.addCircle(x, z, 0.55 * s);
      } else if (r < p + 0.11) {
        const s = 0.6 + rnd() * 0.6;
        bushes.push({ x, y: terrainHeight(x, z) - 0.05, z, ry: rnd() * 6, s, color: BUSH_COL[ri] });
      }
    }
  }

  // grama, flores e trigo numa grade mais fina
  for (let gx = -132; gx <= 132; gx += 1.3) {
    for (let gz = -132; gz <= 132; gz += 1.3) {
      const x = gx + (rnd() - 0.5) * 1.2, z = gz + (rnd() - 0.5) * 1.2;
      const r = rnd();
      const ri = regionAt(x, z);
      if (r > Math.max(GRASS_P[ri], 0.07)) continue;
      if (!clearAt(x, z, 0.8)) continue;
      const y = terrainHeight(x, z) - 0.03;
      const n = fbm(x * 0.06 - 20, z * 0.06 + 13);
      if (ri === 1 && n > 0.52) {
        // campo de trigo
        for (let k = 0; k < 3; k++) {
          const wx = x + (rnd() - 0.5) * 1.4, wz = z + (rnd() - 0.5) * 1.4;
          wheat.push({ x: wx, y: terrainHeight(wx, wz) - 0.03, z: wz, ry: rnd() * 6, s: 0.9 + rnd() * 0.35, color: '#ffffff' });
        }
        continue;
      }
      if ((ri === 0 || ri === 1 || ri === 4) && r < 0.06) {
        const cols = ['#f4a3a3', '#f2c14e', '#ffffff', '#8e5bd1', '#e8554a', '#7ab8f5'];
        const it = { x, y, z, ry: rnd() * 6, s: 0.8 + rnd() * 0.4, color: cols[Math.floor(rnd() * cols.length)] };
        stems.push({ ...it, color: '#5f9a3a' });
        heads.push(it);
        continue;
      }
      if (r < GRASS_P[ri]) grass.push({ x, y, z, ry: rnd() * 6, s: 0.7 + rnd() * 0.7, color: GRASS_COL[ri] });
    }
  }

  // ---- malhas instanciadas ----
  for (const v of Object.keys(trees)) new Chunked(scene, treeGeo(v), VC_MAT, trees[v]);
  new Chunked(scene, new THREE.DodecahedronGeometry(0.7, 0), new THREE.MeshLambertMaterial({ flatShading: true }), rocks);
  new Chunked(scene, mergeColored([
    { geo: new THREE.IcosahedronGeometry(0.55, 0), color: '#ffffff', matrix: M4(0, 0.4, 0) },
    { geo: new THREE.IcosahedronGeometry(0.42, 0), color: '#e8e8e8', matrix: M4(0.45, 0.3, 0.1) },
    { geo: new THREE.IcosahedronGeometry(0.38, 0), color: '#f2f2f2', matrix: M4(-0.35, 0.28, -0.2) },
  ]), VC_MAT, bushes);
  const grassMat = swayMaterial({ vertexColors: true, side: THREE.DoubleSide });
  new Chunked(scene, grassGeometry(), grassMat, grass);
  new Chunked(scene, wheatGeometry(), swayMaterial({ vertexColors: true, flatShading: true }, true), wheat);
  new Chunked(scene, new THREE.CylinderGeometry(0.02, 0.025, 0.45, 3).translate(0, 0.22, 0), swayMaterial({ color: '#ffffff' }), stems);
  new Chunked(scene, new THREE.OctahedronGeometry(0.11, 0).translate(0, 0.48, 0), swayMaterial({ color: '#ffffff', flatShading: true }), heads);

  // ---- poças de lama (R0 e R1) ----
  const mudMat = new THREE.MeshLambertMaterial({ color: '#6b4a2b', polygonOffset: true, polygonOffsetFactor: -1 });
  let tries = 0;
  while (mudPuddles.length < 12 && tries++ < 4000) {
    const x = -125 + rnd() * 110, z = -60 + rnd() * 130;
    const ri = regionAt(x, z);
    if ((ri !== 1 && ri !== 2) || !clearAt(x, z, 0.6)) continue;
    if (mudPuddles.filter((p) => regionAt(p.x, p.z) === ri).length >= 6) continue;
    if (distToRoad(x, z, 8) > 4) continue; // perto dos caminhos, para o jogador pisar
    const r = 1.2 + rnd() * 0.8;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 10), mudMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, terrainHeight(x, z) + 0.05, z);
    m.receiveShadow = true;
    scene.add(m);
    mudPuddles.push({ x, z, r });
  }

  // 1 em cada 6 árvores é chacoalhável
  const shakeables = all.filter((t, i) => t.shakeable || (i % 6 === 3 && t.variant !== 'cactus'));
  shakeables.forEach((t) => (t.shakeable = true));

  // poleiros de pássaros: árvores espalhadas
  const perches = [];
  for (const t of all) {
    if (t.variant === 'cactus' || t.variant === 'dead') continue;
    if (perches.every((p) => (p.x - t.x) ** 2 + (p.z - t.z) ** 2 > 22 * 22)) perches.push(t);
  }

  // grade das flores para o "amassar"
  const flowerGrid = new Map();
  heads.forEach((h, i) => {
    const k = `${Math.floor(h.x / 4)},${Math.floor(h.z / 4)}`;
    if (!flowerGrid.has(k)) flowerGrid.set(k, []);
    flowerGrid.get(k).push({ head: h, stem: stems[i], squash: 0 });
  });

  // esconde grama, trigo, flores e arbustos numa área (riachos planejados depois das cidades)
  const hideIn = (test) => {
    for (const list of [grass, wheat, stems, heads, bushes]) for (const it of list) if (test(it.x, it.z)) setInstance(it, { sy: 0, dy: -5 });
    for (const t of all) if (!t.hidden && test(t.x, t.z)) { t.hidden = true; setInstance(t, { sy: 0, dy: -9 }); if (t.col) t.col.enabled = false; }
  };
  return { hideIn, trees: all, shakeables, tutorialTree, perches, flowerGrid, counts: { trees: all.length, grass: grass.length, wheat: wheat.length, flowers: heads.length } };
}

// ---------- casas decorativas (3 modelos) ----------
export function makeHouse(estilo, roof, wall = '#f3e3c3') {
  const g = new THREE.Group();
  const door = '#6b4423', win = '#7fb8d9';
  if (estilo === 0) { // casa baixa
    g.add(box(3.0, 1.8, 2.6, wall, 0, 0.9, 0));
    const r = cone(2.35, 1.3, roof, 0, 2.45, 0, 4); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.85); g.add(r);
    g.add(box(0.7, 1.1, 0.08, door, 0, 0.55, 1.31));
    g.add(box(0.55, 0.5, 0.08, win, 0.95, 1.1, 1.31));
    g.add(box(0.55, 0.5, 0.08, win, -0.95, 1.1, 1.31));
  } else if (estilo === 1) { // casa com sótão
    g.add(box(2.6, 2.2, 2.6, wall, 0, 1.1, 0));
    const r = cone(2.1, 2.2, roof, 0, 3.3, 0, 4); r.rotation.y = Math.PI / 4; g.add(r);
    g.add(box(0.8, 0.7, 0.8, wall, 0, 3.0, 0.9));
    g.add(box(0.4, 0.35, 0.06, win, 0, 3.05, 1.31));
    g.add(box(0.7, 1.2, 0.08, door, 0, 0.6, 1.31));
    g.add(box(0.5, 0.5, 0.08, win, 0.8, 1.5, 1.31));
    g.add(box(0.5, 0.18, 0.5, '#8a8a8a', 0.8, 3.6, -0.4));
  } else { // casa torta
    const body = new THREE.Group();
    body.add(box(2.4, 2.4, 2.4, wall, 0, 1.2, 0));
    body.add(box(0.7, 1.1, 0.08, door, -0.4, 0.55, 1.21));
    body.add(box(0.5, 0.5, 0.08, win, 0.6, 1.6, 1.21));
    const r = cone(2.0, 1.8, roof, 0.15, 3.25, 0, 4); r.rotation.set(0, Math.PI / 4, 0.12); body.add(r);
    body.rotation.z = 0.09;
    g.add(body);
    g.add(box(0.25, 2.2, 0.25, '#8b5a2b', -1.45, 1.1, 0.8));
  }
  return g;
}
