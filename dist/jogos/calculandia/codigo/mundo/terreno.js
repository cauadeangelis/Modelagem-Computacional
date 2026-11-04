// Ilha: relevo, rios, regiões e cor por vértice (seção 4).
import * as THREE from 'three';
import { SETTLEMENTS, RIVERS, CREEK, REGIONS, HILLS, FLAT_RADIUS } from '../dados/regioes-e-cidades.js';
import { CONFIG } from '../configuracao.js';
import { clamp, lerp, smoothstep, fbm, distToSeg } from '../utilitarios/matematica.js';

const { half: HALF, chunks: CHUNKS, chunkSeg: SEG } = CONFIG.world;
const CHUNK = (HALF * 2) / CHUNKS;
export const WATER_Y = CONFIG.water.y;

// ---------------- rios ----------------
function densify(pts, per = 8) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  return curve.getPoints((pts.length - 1) * per).map((v) => [v.x, v.z]);
}
function withBox(r, line) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of line) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  const m = r.hw + 6;
  return { ...r, line, minX: minX - m, maxX: maxX + m, minZ: minZ - m, maxZ: maxZ + m };
}
export const riverData = RIVERS.map((r) => withBox(r, densify(r.pts)));
export const riverById = Object.fromEntries(riverData.map((r) => [r.id, r]));
export const creekData = withBox(CREEK, densify(CREEK.pts, 10));

function lineDist(L, x, z) {
  let best = Infinity, bi = 0;
  for (let i = 0; i < L.length - 1; i++) {
    const d = distToSeg(x, z, L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]);
    if (d < best) { best = d; bi = i; }
  }
  return [best, bi];
}

export function nearestRiver(x, z) {
  let d = Infinity, river = null, seg = 0;
  for (const r of riverData) {
    if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
    const [dd, i] = lineDist(r.line, x, z);
    if (dd < d) { d = dd; river = r; seg = i; }
  }
  return { d, river, seg };
}

// direção do rio no segmento mais próximo
export function riverTangent(river, x, z) {
  const [, i] = lineDist(river.line, x, z);
  const a = river.line[i], b = river.line[i + 1];
  const v = new THREE.Vector2(b[0] - a[0], b[1] - a[1]).normalize();
  return v;
}

export function inCreek(x, z) {
  const c = creekData;
  if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) return false;
  return lineDist(c.line, x, z)[0] < c.hw;
}

// ---------------- contorno da ilha ----------------
const BASE_R = CONFIG.world.islandRadius;
function islandBase(th) {
  return BASE_R + 5 * Math.sin(3 * th + 1.3) + 3 * Math.sin(7 * th + 0.4) + 2 * Math.sin(13 * th + 2.1);
}
const settleAng = SETTLEMENTS.map((s) => ({ th: Math.atan2(s.z, s.x), need: Math.hypot(s.x, s.z) + 21 }));
export function islandRadius(th) {
  const b = islandBase(th);
  let R = b;
  for (const s of settleAng) {
    if (s.need <= b - 2) continue;
    let d = Math.abs(th - s.th);
    if (d > Math.PI) d = Math.PI * 2 - d;
    R = Math.max(R, b + (s.need - b) * Math.exp(-((d / 0.24) ** 2)));
  }
  return R;
}

// ---------------- relevo ----------------
export function rawHeight(x, z) {
  let h = 0.38 + (fbm(x * 0.04 + 7.3, z * 0.04 - 2.1) - 0.45) * 0.9;
  // Planalto dos Cofres (até 4)
  const dP = Math.hypot(x - 5, z + 88);
  h += 4 * (1 - smoothstep(26, 56, dP));
  // Parque das Curvas: colinas (até 6)
  for (const [hx, hz, hr, hh] of HILLS) {
    const q = ((x - hx) ** 2 + (z - hz) ** 2) / (hr * hr);
    if (q < 9) h += hh * Math.exp(-q);
  }
  return h;
}

const FLAT = SETTLEMENTS.filter((s) => FLAT_RADIUS[s.tipo] > 0).map((s) => {
  const r = s.id === 'A0' ? 13 : FLAT_RADIUS[s.tipo];
  return { x: s.x, z: s.z, r, out2: (r + 6) ** 2, h: Math.max(0.35, rawHeight(s.x, s.z)) };
});
export const settlementBaseH = Object.fromEntries(SETTLEMENTS.map((s) => {
  const f = FLAT.find((q) => q.x === s.x && q.z === s.z);
  return [s.id, f ? f.h : USINA_FLOOR()];
}));
function USINA_FLOOR() { return 0.3; }

export function terrainHeight(x, z) {
  let h = rawHeight(x, z);
  for (const s of FLAT) {
    const dx = x - s.x, dz = z - s.z, d2 = dx * dx + dz * dz;
    if (d2 > s.out2) continue;
    h = lerp(h, s.h, 1 - smoothstep(s.r - 2, s.r + 6, Math.sqrt(d2)));
  }
  const r = Math.hypot(x, z);
  if (r < 36) h = lerp(h, USINA_FLOOR(), 1 - smoothstep(27, 36, r));
  const rv = nearestRiver(x, z);
  if (rv.river && rv.d < rv.river.hw + 3) {
    const deep = rv.river.canyon ? -2.4 : -1.5;
    h = lerp(h, deep, 1 - smoothstep(rv.river.hw - 1.2, rv.river.hw + 2.5, rv.d));
  }
  const R = islandRadius(Math.atan2(z, x));
  if (r > R - 12) {
    h = lerp(h, -0.5, smoothstep(R - 12, R, r));
    if (r > R) h = Math.max(-4, -0.5 - (r - R) * 0.35);
  }
  return h;
}

// ---------------- regiões ----------------
function angleTable(line) {
  const t = new Float32Array(171);
  const rr = line.map(([x, z]) => Math.hypot(x, z));
  const ang = (x, z) => { let a = (Math.atan2(z, x) * 180) / Math.PI; if (a < 0) a += 360; return a; };
  for (let r = 0; r <= 170; r++) {
    let a = null;
    if (r <= rr[0]) a = ang(...line[0]);
    else if (r >= rr[rr.length - 1]) a = ang(...line[line.length - 1]);
    else {
      for (let i = 0; i < line.length - 1; i++) {
        if ((rr[i] - r) * (rr[i + 1] - r) <= 0) {
          const k = (r - rr[i]) / (rr[i + 1] - rr[i] || 1);
          a = ang(lerp(line[i][0], line[i + 1][0], k), lerp(line[i][1], line[i + 1][1], k));
          break;
        }
      }
      if (a === null) a = ang(...line[line.length - 1]);
    }
    t[r] = a;
  }
  return t;
}
const T = {
  r4A: angleTable(riverById.r4A.line),
  r01: angleTable(riverById.r01.line),
  r12: angleTable(riverById.r12.line),
  r23: angleTable(riverById.r23.line),
  r34: angleTable(riverById.r34.line),
};
const angAt = (tab, r) => { const i = clamp(Math.floor(r), 0, 169); return lerp(tab[i], tab[i + 1], clamp(r - i, 0, 1)); };
export const USINA_RIM = 27;

export function regionAt(x, z) {
  const r = Math.hypot(x, z);
  if (r < USINA_RIM) return 6;
  let th = (Math.atan2(z, x) * 180) / Math.PI;
  if (th < 0) th += 360;
  const b1 = angAt(T.r4A, r), b2 = 118, b3 = angAt(T.r01, r), b4 = angAt(T.r12, r), b5 = angAt(T.r23, r), b6 = angAt(T.r34, r) + 360;
  let t = th;
  if (t < b1) t += 360;
  if (t < b2) return 0;
  if (t < b3) return 1;
  if (t < b4) return 2;
  if (t < b5) return 3;
  if (t < b6) return 4;
  return 5;
}

// ---------------- cores ----------------
const C = (h) => new THREE.Color(h);
const RC = REGIONS.map((r) => ({ chao: C(r.pal.chao), veg: C(r.pal.veg), veg2: C(r.pal.veg2 || r.pal.veg), areia: C(r.areia) }));
const GRASS_R4 = C('#a9cf6a');
const SEABED = C('#c9b98a'), DEEP = C('#5f8f9a');
export const regionBoost = new Array(7).fill(false);
const _c = new THREE.Color(), _acc = new THREE.Color(), _hsl = {};

function regionBase(ri, x, z, h, out) {
  const n = fbm(x * 0.07 + 11, z * 0.07 - 4);
  const c = RC[ri];
  switch (ri) {
    case 0: out.copy(c.chao).lerp(c.veg, smoothstep(0.4, 0.56, n)); break;
    case 1: out.copy(c.chao).lerp(c.veg, smoothstep(0.5, 0.62, n)); break;
    case 2: out.copy(c.chao).lerp(c.veg, smoothstep(0.42, 0.66, n) * 0.7); break;
    case 3: {
      const s = 0.5 + 0.5 * Math.sin(h * 3.2 + n * 2);
      out.copy(c.chao).lerp(c.veg, clamp(smoothstep(0.8, 3.0, h) * 0.55 + s * 0.15, 0, 1));
      break;
    }
    case 4: out.copy(c.chao).lerp(c.veg, smoothstep(1.2, 3.8, h) * 0.85); break;
    case 5: out.copy(c.chao).lerp(GRASS_R4, smoothstep(0.5, 0.7, n) * 0.75); break;
    default: out.copy(c.chao).lerp(c.veg, smoothstep(0.55, 0.72, n) * 0.5);
  }
  if (h < 0.45 && ri !== 6) out.lerp(c.areia, smoothstep(0.45, -0.05, h));
  if (regionBoost[ri]) {
    out.getHSL(_hsl);
    out.setHSL(_hsl.h, Math.min(1, _hsl.s * 1.15), _hsl.l);
  }
  return out;
}

const SAMPLES = [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]];
export function groundColor(x, z, h, out = new THREE.Color()) {
  const r0 = regionAt(x, z);
  let same = true;
  const rs = SAMPLES.map(([dx, dz]) => { const r = regionAt(x + dx, z + dz); if (r !== r0) same = false; return r; });
  if (same) regionBase(r0, x, z, h, out);
  else {
    _acc.setRGB(0, 0, 0);
    for (const r of rs) { regionBase(r, x, z, h, _c); _acc.r += _c.r; _acc.g += _c.g; _acc.b += _c.b; }
    out.setRGB(_acc.r / 5, _acc.g / 5, _acc.b / 5);
  }
  if (h < -0.3) {
    out.lerp(SEABED, smoothstep(-0.3, -0.6, h));
    out.lerp(DEEP, smoothstep(-0.8, -3.5, h));
  }
  return out;
}

// ---------------- malha ----------------
export function buildTerrain(scene) {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) {
    for (let j = 0; j < CHUNKS; j++) {
      const cx = -HALF + CHUNK * (i + 0.5), cz = -HALF + CHUNK * (j + 0.5);
      const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, SEG, SEG);
      geo.rotateX(-Math.PI / 2);
      geo.translate(cx, 0, cz);
      const pos = geo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), z = pos.getZ(k);
        const h = terrainHeight(x, z);
        pos.setY(k, h);
        groundColor(x, z, h, _c);
        col[k * 3] = _c.r; col[k * 3 + 1] = _c.g; col[k * 3 + 2] = _c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, material);
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      scene.add(m);
      chunks.push(m);
    }
  }
  function recolor() {
    for (const m of chunks) {
      const pos = m.geometry.attributes.position, col = m.geometry.attributes.color;
      for (let k = 0; k < pos.count; k++) {
        groundColor(pos.getX(k), pos.getZ(k), pos.getY(k), _c);
        col.setXYZ(k, _c.r, _c.g, _c.b);
      }
      col.needsUpdate = true;
    }
  }
  return { chunks, recolor, material };
}

// Raio da linha d'água em cada ângulo (para espuma e mapa)
export function shoreRadius(th) {
  const R = islandRadius(th);
  const cx = Math.cos(th), sz = Math.sin(th);
  for (let r = R + 6; r > R - 30; r -= 0.5) {
    if (terrainHeight(cx * r, sz * r) > WATER_Y) return r + 0.25;
  }
  return R - 30;
}

// Raymarch no campo de alturas (clique no chão)
export function raycastTerrain(origin, dir, maxT = 500) {
  let t = 0, prev = origin.y - terrainHeight(origin.x, origin.z);
  const step = 0.6;
  while (t < maxT) {
    t += step;
    const x = origin.x + dir.x * t, y = origin.y + dir.y * t, z = origin.z + dir.z * t;
    const d = y - Math.max(terrainHeight(x, z), WATER_Y);
    if (d < 0) {
      const tt = t - step * (d / (d - prev));
      return new THREE.Vector3(origin.x + dir.x * tt, 0, origin.z + dir.z * tt);
    }
    prev = d;
  }
  return null;
}
