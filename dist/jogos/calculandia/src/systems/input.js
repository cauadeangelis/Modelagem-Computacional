// Teclado, mouse (clique no chão, roda = zoom) e toque (joystick virtual + botões) — seção 6.4.
import * as THREE from 'three';
import { G } from '../game.js';
import { raycastTerrain } from '../world/terrain.js';

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // borda de subida neste quadro
    this.move = new THREE.Vector2(); // x = direita, y = frente
    this.joy = new THREE.Vector2();
    this.run = false;
    this.clickTarget = null;
    this.wheel = 0;
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.lastTap = 0;
    this.holdSpace = 0;
    this.canvas = canvas;

    addEventListener('keydown', (e) => {
      // A fase tática tem controles de formulário e teclado próprios (incluindo Tab).
      if (G.mode === 'fase') { G.audio?.unlock(); return; }
      if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
      const k = e.code;
      this.keys.add(k);
      this.pressed.add(k);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
      G.audio?.unlock();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    // clique/toque no chão: anda até lá
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; G.audio?.unlock(); });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 10 && performance.now() - down.t < 400) this.groundClick(e.clientX, e.clientY);
      down = null;
    });

    // pinça para zoom
    const pts = new Map();
    let pinch = 0;
    canvas.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) pts.set(t.identifier, t); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) pts.set(t.identifier, t);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch) this.wheel += (pinch - d) * 0.02;
        pinch = d;
      }
    }, { passive: true });
    canvas.addEventListener('touchend', (e) => { for (const t of e.changedTouches) pts.delete(t.identifier); if (pts.size < 2) pinch = 0; }, { passive: true });

    this.setupTouch();
  }

  setupTouch() {
    const joy = document.getElementById('joy'), knob = document.getElementById('joy-knob');
    if (this.touch) { document.getElementById('touch').classList.remove('hidden'); document.body.classList.add('touch'); }
    let id = null, cx = 0, cy = 0;
    const R = 60;
    const upd = (x, y) => {
      let dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.min(1, d / R);
      // zona morta de 10%
      if (m < 0.1) this.joy.set(0, 0);
      else this.joy.set(dx / R, -dy / R);
    };
    joy.addEventListener('pointerdown', (e) => {
      id = e.pointerId; joy.setPointerCapture(id);
      const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      upd(e.clientX, e.clientY);
      // toque duplo no joystick = correr
      const now = performance.now();
      this.joyRun = now - this.lastTap < 300;
      this.lastTap = now;
      G.audio?.unlock();
    });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === id) upd(e.clientX, e.clientY); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; this.joy.set(0, 0); knob.style.transform = ''; this.joyRun = false; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    const btn = (elId, code) => {
      const el = document.getElementById(elId);
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.pressed.add(code); this.keys.add(code); G.audio?.unlock(); });
      el.addEventListener('pointerup', () => this.keys.delete(code));
      el.addEventListener('pointercancel', () => this.keys.delete(code));
    };
    btn('tb-act', 'KeyE'); btn('tb-jump', 'Space'); btn('tb-hint', 'KeyH');
  }

  groundClick(x, y) {
    if (G.mode !== 'play' || G.locks) return;
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, G.camera);
    const hit = raycastTerrain(ray.ray.origin, ray.ray.direction);
    if (hit) { this.clickTarget = hit; G.events.emit('clickGround', hit); }
  }

  down(code) { return this.keys.has(code); }
  hit(code) { return this.pressed.has(code); }

  // chamado no início do quadro
  poll() {
    const k = (c) => this.keys.has(c);
    let x = 0, y = 0;
    if (k('KeyW') || k('ArrowUp')) y += 1;
    if (k('KeyS') || k('ArrowDown')) y -= 1;
    if (k('KeyD') || k('ArrowRight')) x += 1;
    if (k('KeyA') || k('ArrowLeft')) x -= 1;
    this.move.set(x, y);
    if (this.move.lengthSq() > 1) this.move.normalize();
    if (this.joy.lengthSq() > 0) this.move.copy(this.joy);
    if (this.move.lengthSq() > 0.01) this.clickTarget = null;
    this.run = k('ShiftLeft') || k('ShiftRight') || !!this.joyRun;
  }
  // chamado no fim do quadro
  endFrame() { this.pressed.clear(); this.wheel = 0; }
}
