// Caminhos: fitas planas sobre CatmullRomCurve3, largura 3, cor 12% mais clara que o chão (seção 4).
import * as THREE from 'three';
import { PATHS } from '../data/settlements.js';
import { terrainHeight, groundColor, WATER_Y } from './terrain.js';
import { bridgeAt } from './bridges.js';

const WIDTH = 3;
const CELL = 4;
const grid = new Map();
export const roadCurves = [];

function key(x, z) { return `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`; }

// Pontos amostrados de todas as estradas (para manter props longe delas)
for (const path of PATHS) {
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  roadCurves.push(curve);
  const n = Math.ceil(curve.getLength() / 0.8);
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n);
    const k = key(p.x, p.z);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push([p.x, p.z]);
  }
}

export function distToRoad(x, z, max = 8) {
  let best = Infinity;
  const r = Math.ceil(max / CELL);
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
    const l = grid.get(`${cx + i},${cz + j}`);
    if (!l) continue;
    for (const [px, pz] of l) { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < best) best = d; }
  }
  return Math.sqrt(best) - WIDTH / 2;
}

export function buildRoads(scene) {
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (const curve of roadCurves) {
    const n = Math.ceil(curve.getLength() / 0.8);
    let prevOk = false, base = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const nx = -tan.z, nz = tan.x;
      const lx = p.x + nx * WIDTH / 2, lz = p.z + nz * WIDTH / 2;
      const rx = p.x - nx * WIDTH / 2, rz = p.z - nz * WIDTH / 2;
      const hl = terrainHeight(lx, lz), hr = terrainHeight(rx, rz), hc = terrainHeight(p.x, p.z);
      const ok = Math.min(hl, hr, hc) > WATER_Y + 0.05 && !bridgeAt(p.x, p.z, 0.3);
      const vi = pos.length / 3;
      pos.push(lx, Math.max(hl, hc) + 0.07, lz, rx, Math.max(hr, hc) + 0.07, rz);
      groundColor(p.x, p.z, hc, c);
      c.offsetHSL(0, -0.04, 0.12);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (ok && prevOk) idx.push(base, base + 1, vi, base + 1, vi + 1, vi);
      prevOk = ok; base = vi;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
