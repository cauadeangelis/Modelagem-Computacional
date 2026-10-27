// Mar com ondas por seno e anel de espuma na costa (seção 2).
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { shoreRadius, terrainHeight, creekData } from './terrain.js';

export function buildWater(scene) {
  const W = CONFIG.water;
  const uniforms = { uTime: { value: 0 } };
  const geo = new THREE.PlaneGeometry(420, 420, 64, 64);
  geo.rotateX(-Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({ color: W.color, transparent: true, opacity: W.opacity, flatShading: true, depthWrite: false });
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float w = 6.2831853 / ${W.wavePeriod.toFixed(2)};
       transformed.y += ${W.waveAmp.toFixed(3)} * (sin(uTime * w + position.x * 0.35 + position.z * 0.22) * 0.6
                       + sin(uTime * w * 1.3 - position.z * 0.4 + position.x * 0.1) * 0.4);`,
    );
  };
  const sea = new THREE.Mesh(geo, material);
  sea.position.y = W.y;
  sea.renderOrder = 1;
  scene.add(sea);

  // horizonte plano para longe
  const far = new THREE.Mesh(new THREE.RingGeometry(200, 1400, 48, 1), new THREE.MeshBasicMaterial({ color: '#58b7da', fog: true }));
  far.rotation.x = -Math.PI / 2;
  far.position.y = W.y - 0.05;
  scene.add(far);

  // espuma: faixa branca ao longo da linha d'água
  const N = 256;
  const pos = [];
  const shore = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r = shoreRadius(th);
    shore.push(r);
    const c = Math.cos(th), s = Math.sin(th);
    pos.push(c * (r - 0.4), W.y + 0.06, s * (r - 0.4), c * (r + 1.1), W.y + 0.06, s * (r + 1.1));
  }
  const idx = [];
  for (let i = 0; i < N; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  fg.setIndex(idx);
  const foamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
  const foam = new THREE.Mesh(fg, foamMat);
  foam.renderOrder = 2;
  scene.add(foam);

  // riacho do tutorial (estreito demais para o terreno): fita azul
  const cl = creekData.line;
  const cp = [], ci = [];
  for (let i = 0; i < cl.length; i++) {
    const [x, z] = cl[i];
    const [nx, nz] = cl[Math.min(cl.length - 1, i + 1)];
    const [px, pz] = cl[Math.max(0, i - 1)];
    let dx = nx - px, dz = nz - pz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const hw = creekData.hw;
    const y1 = Math.max(terrainHeight(x - dz * hw, z + dx * hw), W.y) + 0.04;
    const y2 = Math.max(terrainHeight(x + dz * hw, z - dx * hw), W.y) + 0.04;
    const y = Math.max(y1, y2);
    cp.push(x - dz * hw, y, z + dx * hw, x + dz * hw, y, z - dx * hw);
    if (i < cl.length - 1) { const a = i * 2; ci.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
  cg.setIndex(ci);
  cg.computeVertexNormals();
  const creek = new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ color: '#5ec3e6', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  creek.receiveShadow = true;
  scene.add(creek);

  return {
    shore,
    update(t) {
      uniforms.uTime.value = t;
      // a cada 6 s a espuma avança praia acima (a onda que apaga pegadas)
      foam.scale.setScalar(1 - 0.007 * Math.max(0, Math.sin((t * Math.PI * 2) / 6)));
      foamMat.opacity = W.foamMin + (W.foamMax - W.foamMin) * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / W.foamPeriod));
    },
  };
}
