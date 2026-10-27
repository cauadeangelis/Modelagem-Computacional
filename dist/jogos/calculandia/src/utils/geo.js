// Fábricas de primitivas, cache de materiais/geometrias e "assar" (merge) de partes estáticas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mats = new Map();
export function mat(color, extra) {
  if (extra) return new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
  let m = mats.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    mats.set(color, m);
  }
  return m;
}

// material único de cores por vértice para tudo que é "assado"
export const VC_MAT = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

const geos = new Map();
function cached(key, make) {
  let g = geos.get(key);
  if (!g) { g = make(); geos.set(key, g); }
  return g;
}
export const G_BOX = (w, h, d) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const G_SPH = (r, ws = 10, hs = 8) => cached(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const G_CYL = (rt, rb, h, seg = 8) => cached(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
export const G_CONE = (r, h, seg = 8) => cached(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const G_HALFSPH = (r, ws = 12, hs = 6) =>
  cached(`h${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2));

function place(m, x, y, z) {
  m.position.set(x || 0, y || 0, z || 0);
  return m;
}
export const box = (w, h, d, c, x, y, z) => place(new THREE.Mesh(G_BOX(w, h, d), mat(c)), x, y, z);
export const sph = (r, c, x, y, z, ws, hs) => place(new THREE.Mesh(G_SPH(r, ws, hs), mat(c)), x, y, z);
export const cyl = (rt, rb, h, c, x, y, z, seg) => place(new THREE.Mesh(G_CYL(rt, rb, h, seg), mat(c)), x, y, z);
export const cone = (r, h, c, x, y, z, seg) => place(new THREE.Mesh(G_CONE(r, h, seg), mat(c)), x, y, z);
export const mesh = (geo, c, x, y, z) => place(new THREE.Mesh(geo, typeof c === 'string' ? mat(c) : c), x, y, z);

export function grp(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}
export function rot(o, x = 0, y = 0, z = 0) { o.rotation.set(x, y, z); return o; }
export function scl(o, x, y = x, z = x) { o.scale.set(x, y, z); return o; }
export function at(o, x, y, z) { o.position.set(x, y, z); return o; }
export function shadows(o, cast = true, receive = false) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } });
  return o;
}

// Cilindro ligando dois pontos (cabos, cordas, hastes)
export function rod(a, b, r, color, seg = 5) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const m = new THREE.Mesh(G_CYL(r, r, 1, seg), mat(color));
  m.scale.y = len;
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

function colorize(geo, color) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  g.clearGroups();
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = color.r; arr[i * 3 + 1] = color.g; arr[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

// Junta todas as malhas de um grupo em UMA malha com cores por vértice (economia de draw calls)
export function bake(root, material = VC_MAT) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4();
  const list = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const g = colorize(o.geometry, o.material.color);
    m.multiplyMatrices(inv, o.matrixWorld);
    g.applyMatrix4(m);
    list.push(g);
  });
  if (!list.length) return null;
  const merged = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  return new THREE.Mesh(merged, material);
}

// [{geo, color, matrix}] -> geometria única com cores por vértice (para InstancedMesh)
export function mergeColored(parts) {
  const list = parts.map((p) => {
    const g = colorize(p.geo, new THREE.Color(p.color));
    if (p.matrix) g.applyMatrix4(p.matrix);
    return g;
  });
  const merged = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  return merged;
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export function M4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

// Textura de placa de madeira com texto, gerada em canvas
export function labelTexture(text, { w = 512, h = 128, bg = '#b5835a', fg = '#3a2a1a', border = '#6b4423', size = 54 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3;
  for (let y = 18; y < h; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 4); g.stroke(); }
  g.strokeStyle = border; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let s = size;
  do { g.font = `700 ${s}px Fredoka, system-ui, sans-serif`; s -= 2; } while (g.measureText(text).width > w - 40 && s > 16);
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function textSprite(text, { color = '#3a2a1a', size = 64, stroke = '#fff7e6' } = {}) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.font = `700 ${size}px Fredoka, system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = stroke; g.strokeText(text, 64, 68);
  g.fillStyle = color; g.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  return s;
}
