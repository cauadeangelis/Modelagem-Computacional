// Pontes de tábuas com corrimão sobre os rios (seção 4).
import * as THREE from 'three';
import { BRIDGES } from '../data/settlements.js';
import { terrainHeight, riverById, riverTangent, WATER_Y } from './terrain.js';
import { box, cyl, grp, bake, mat } from '../utils/geo.js';
import { lerp } from '../utils/math.js';

export const BRIDGE_W = 3.4;

// Calcula geometria de cada ponte: centro, eixo (u) atravessando o rio, comprimento e alturas das pontas
export const bridgeData = BRIDGES.map((b) => {
  const t = riverTangent(riverById[b.river], b.x, b.z);
  const u = new THREE.Vector2(-t.y, t.x); // perpendicular ao rio
  const reach = (sgn) => {
    for (let s = 0; s < 26; s += 0.25) {
      const x = b.x + u.x * s * sgn, z = b.z + u.y * s * sgn;
      if (terrainHeight(x, z) > WATER_Y + 0.35) return s + 1.6;
    }
    return 14;
  };
  const la = reach(-1), lb = reach(1);
  const ax = b.x - u.x * la, az = b.z - u.y * la, bx = b.x + u.x * lb, bz = b.z + u.y * lb;
  const ha = Math.max(0.2, terrainHeight(ax, az)) + 0.12;
  const hb = Math.max(0.2, terrainHeight(bx, bz)) + 0.12;
  return { ...b, ux: u.x, uz: u.y, la, lb, ha, hb, len: la + lb, angle: Math.atan2(u.x, u.y) };
});

function local(b, x, z) {
  const dx = x - b.x, dz = z - b.z;
  return [dx * b.ux + dz * b.uz, -dx * b.uz + dz * b.ux]; // [u, v]
}

function deckY(b, u) {
  const t = (u + b.la) / b.len;
  return lerp(b.ha, b.hb, t) + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
}

// Altura do deck se (x, z) está sobre alguma ponte
export function bridgeAt(x, z, margin = 0) {
  for (const b of bridgeData) {
    const [u, v] = local(b, x, z);
    if (u > -b.la - margin && u < b.lb + margin && Math.abs(v) < BRIDGE_W / 2 + margin) return { b, y: deckY(b, u), u, v };
  }
  return null;
}

export function buildBridges(scene, collision) {
  const out = [];
  for (const b of bridgeData) {
    const root = new THREE.Group();
    root.position.set(b.x, 0, b.z);
    root.rotation.y = b.angle;
    const tmp = new THREE.Group();
    const planks = Math.ceil(b.len / 0.55);
    for (let i = 0; i < planks; i++) {
      const u = -b.la + (i + 0.5) * (b.len / planks);
      const y = deckY(b, u);
      const p = box(BRIDGE_W, 0.18, b.len / planks - 0.06, i % 2 ? '#a8764a' : '#9a6a40', 0, y - 0.09, u);
      tmp.add(p);
    }
    // postes e corrimão
    const rails = [];
    for (const side of [-1, 1]) {
      const n = Math.ceil(b.len / 2);
      for (let i = 0; i <= n; i++) {
        const u = -b.la + (i / n) * b.len;
        const y = deckY(b, u);
        tmp.add(cyl(0.09, 0.09, 1.1, '#6b4423', side * (BRIDGE_W / 2 - 0.1), y + 0.45, u, 5));
        if (i < n) {
          const u2 = -b.la + ((i + 1) / n) * b.len;
          const y2 = deckY(b, u2);
          const r = box(0.12, 0.12, Math.hypot(u2 - u, y2 - y) + 0.05, '#8b5a2b', side * (BRIDGE_W / 2 - 0.1), (y + y2) / 2 + 0.95, (u + u2) / 2);
          r.rotation.x = -Math.atan2(y2 - y, u2 - u);
          rails.push(r);
        }
      }
      // colisão: corrente de círculos ao longo do corrimão
      for (let u = -b.la + 0.3; u < b.lb - 0.3; u += 0.5) {
        const wx = b.x + b.ux * u - b.uz * side * (BRIDGE_W / 2 + 0.1);
        const wz = b.z + b.uz * u + b.ux * side * (BRIDGE_W / 2 + 0.1);
        collision.addCircle(wx, wz, 0.32);
      }
    }
    root.add(tmp);
    const baked = bake(tmp);
    root.remove(tmp);
    baked.castShadow = true; baked.receiveShadow = true;
    root.add(baked);
    // corrimão com material próprio (brilha quando a região é vencida)
    const railMat = mat('#8b5a2b', { emissive: '#000000' });
    for (const r of rails) { r.material = railMat; root.add(r); }
    scene.add(root);
    out.push({ data: b, root, railMat });
  }
  return out;
}
