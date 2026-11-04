// Luz, céu e névoa (seção 2). O sol acompanha o herói para manter a caixa de sombras.
import * as THREE from 'three';
import { CONFIG } from '../configuracao.js';

export function buildSky(scene) {
  const L = CONFIG.light;
  scene.background = new THREE.Color(L.background);
  scene.fog = new THREE.Fog(L.fogColor, L.fogNear, L.fogFar);

  const hemi = new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemiIntensity);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(L.sunColor, L.sunIntensity);
  sun.castShadow = true;
  sun.shadow.mapSize.set(L.shadowMapSize, L.shadowMapSize);
  const c = sun.shadow.camera;
  c.left = -L.shadowBox; c.right = L.shadowBox; c.top = L.shadowBox; c.bottom = -L.shadowBox;
  c.near = 1; c.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  const off = new THREE.Vector3(...L.sunOffset);
  return {
    hemi, sun,
    follow(p) {
      // arredonda a posição para reduzir "tremedeira" das sombras
      const s = 0.5;
      const x = Math.round(p.x / s) * s, z = Math.round(p.z / s) * s;
      sun.position.set(x + off.x, p.y + off.y, z + off.z);
      sun.target.position.set(x, p.y, z);
    },
  };
}
