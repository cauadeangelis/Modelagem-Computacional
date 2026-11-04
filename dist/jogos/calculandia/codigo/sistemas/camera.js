// Câmera 3/4 quase isométrica seguindo o herói (seção 2).
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { clamp, damp, ease, lerp } from '../utilitarios/matematica.js';

export class CameraRig {
  constructor(camera) {
    const C = CONFIG.camera;
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3(...C.offset);
    this.userZoom = 1;
    this.ctxZoom = 1;
    this.ctxFrom = 1; this.ctxTo = 1; this.ctxT = 1; this.ctxDur = 1;
    this.yaw = 0; this.yawFrom = 0; this.yawTo = 0; this.yawT = 1;
    this.shakeT = 0; this.shakeAmp = 0;
    this.override = null; // função(dt) → { pos, look } para cinemáticas/passeios
    this.lookY = C.lookOffsetY;
  }

  snap(p) { this.target.copy(p); }

  setContextZoom(z, time) {
    if (Math.abs(z - this.ctxTo) < 1e-3) return;
    this.ctxFrom = this.ctxZoom; this.ctxTo = z; this.ctxT = 0; this.ctxDur = time;
  }

  rotate(dir) {
    if (this.yawT < 1) return;
    this.yawFrom = this.yaw; this.yawTo = this.yaw + (dir * Math.PI) / 2; this.yawT = 0;
  }

  shake(amp = 0.35, time = CONFIG.camera.shakeTime) {
    if (G.options.reduzirMovimento) return;
    this.shakeAmp = amp; this.shakeT = time;
  }

  // direções no chão relativas à câmera (para o controle)
  forward() {
    const o = this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return new THREE.Vector3(-o.x, 0, -o.z).normalize();
  }

  update(dt, heroPos) {
    const C = CONFIG.camera;
    if (G.input && G.input.wheel) this.userZoom = clamp(this.userZoom + G.input.wheel * C.zoomStep, C.zoomMin, C.zoomMax);
    if (this.ctxT < 1) {
      this.ctxT = Math.min(1, this.ctxT + dt / this.ctxDur);
      this.ctxZoom = lerp(this.ctxFrom, this.ctxTo, ease(this.ctxT));
    }
    if (this.yawT < 1) {
      this.yawT = Math.min(1, this.yawT + dt / C.rotateTime);
      this.yaw = lerp(this.yawFrom, this.yawTo, ease(this.yawT));
    }
    if (this.override) {
      const o = this.override(dt);
      if (o) {
        this.camera.position.copy(o.pos);
        this.camera.lookAt(o.look);
        if (o.target) this.target.copy(o.target);
        return;
      }
    }
    // alvo += (herói − alvo) × (1 − exp(−6·dt))
    this.target.lerp(heroPos, damp(C.followK, dt));
    const z = this.userZoom * this.ctxZoom;
    const off = this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).multiplyScalar(z);
    this.camera.position.copy(this.target).add(off);
    const look = this.target.clone(); look.y += this.lookY;
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const a = this.shakeAmp * (this.shakeT / C.shakeTime);
      this.camera.position.x += (Math.random() - 0.5) * a;
      this.camera.position.y += (Math.random() - 0.5) * a;
      look.x += (Math.random() - 0.5) * a * 0.5;
    }
    this.camera.lookAt(look);
  }
}
