// Balões (DOM projetado da posição 3D) e caixa de diálogo com máquina de escrever (seção 12).
import * as THREE from 'three';
import { G, lock, unlock } from '../game.js';
import { CONFIG } from '../config.js';
import { drawPortrait } from './portraits.js';
import { tx, separarFalante } from '../data/dialogs.js';

// marcadores do jogador trocados; "nina:Oi" vira "Nina: Oi"
function linha(s) {
  const [quem, texto] = separarFalante(tx(s));
  return quem ? `${quem[0].toUpperCase()}${quem.slice(1)}: ${texto}` : texto;
}

export class Bubbles {
  constructor(el) {
    this.el = el;
    this.list = [];
    this.v = new THREE.Vector3();
  }
  _make(text, o) {
    const d = document.createElement('div');
    d.className = 'bubble' + (o.icon ? ' icon' : '') + (o.villain ? ' villain' : '');
    d.textContent = text;
    this.el.appendChild(d);
    return d;
  }
  // §14: no máximo 70 caracteres por balão; frases maiores viram balões em sequência
  static chunks(text, max = CONFIG.companion.bubbleMax) {
    const words = String(text).split(' '), out = [];
    let cur = '';
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > max - 1) { out.push(cur + ' …'); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    }
    out.push(cur);
    return out;
  }
  _add(b, text, o) {
    const parts = Bubbles.chunks(text);
    b.time = o.time ?? CONFIG.companion.bubbleTime;
    b.life = b.time;
    b.queue = parts.slice(1);
    b.el = this._make(parts[0], o);
    this.list.push(b);
    return b;
  }
  // um balão por âncora (substitui o anterior)
  say(anchor, text, o = {}) {
    for (const b of this.list) if (b.anchor === anchor) { b.life = 0; b.queue = []; }
    return this._add({ anchor, y: o.y ?? 2 }, text, o);
  }
  sayAt(pos, text, o = {}) {
    return this._add({ pos: pos.clone(), y: 0 }, text, o);
  }
  clear() { for (const b of this.list) b.el.remove(); this.list = []; }
  update(dt, camera) {
    const W = innerWidth, H = innerHeight;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      b.life -= dt;
      if (b.life <= 0 && b.queue?.length) { b.el.textContent = b.queue.shift(); b.el.classList.remove('fade'); b.life = b.time; }
      if (b.life <= -0.5) { b.el.remove(); this.list.splice(i, 1); continue; }
      if (b.life <= 0) b.el.classList.add('fade');
      if (b.anchor) b.anchor.getWorldPosition(this.v); else this.v.copy(b.pos);
      this.v.y += b.y;
      this.v.project(camera);
      const vis = this.v.z < 1 && Math.abs(this.v.x) < 1.15 && Math.abs(this.v.y) < 1.15 && (!b.anchor || b.anchor.visible !== false);
      b.el.style.display = vis ? '' : 'none';
      if (vis) b.el.style.transform = `translate(${((this.v.x + 1) / 2) * W}px, ${((1 - this.v.y) / 2) * H}px) translate(-50%, -100%)`;
    }
  }
}

export class Dialog {
  constructor() {
    this.el = document.getElementById('dialog');
    this.nameEl = document.getElementById('dialog-name');
    this.textEl = document.getElementById('dialog-text');
    this.optEl = document.getElementById('dialog-options');
    this.nextEl = document.getElementById('dialog-next');
    this.portrait = document.getElementById('dialog-portrait');
    this.open = false;
    this.el.addEventListener('click', (e) => { if (e.target.closest('button')) return; this.advance(); });
  }

  // lines: string[]; options: [{label, value}] mostradas na última fala
  show({ name, portrait = { kind: 'raizinha' }, lines, options = null, voice = { pitch: 660, wave: 'triangle' } }) {
    if (this.open) this.close(undefined);
    this.open = true;
    lock();
    this.cfg = { name, portrait, lines: lines.map(linha), options, voice };
    this.idx = 0;
    this.freshFrame = true;
    this.el.classList.remove('hidden');
    this.nameEl.textContent = name;
    this.startLine();
    G.hero?.play('talk');
    return new Promise((res) => (this.resolve = res));
  }

  startLine() {
    this.full = this.cfg.lines[this.idx];
    this.chars = 0;
    this.textEl.textContent = '';
    this.optEl.innerHTML = '';
    this.nextEl.style.visibility = 'hidden';
    this.mouth = 0;
  }

  showOptions() {
    const last = this.idx === this.cfg.lines.length - 1;
    this.nextEl.style.visibility = last && this.cfg.options ? 'hidden' : 'visible';
    if (!last || !this.cfg.options) return;
    this.optEl.innerHTML = '';
    this.cfg.options.slice(0, 3).forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'btn' + (o.disabled ? '' : '');
      b.disabled = !!o.disabled;
      b.innerHTML = `<kbd>${i + 1}</kbd>${o.label}`;
      b.onclick = () => this.close(o.value);
      this.optEl.appendChild(b);
    });
  }

  advance() {
    if (!this.open) return;
    if (this.chars < this.full.length) { this.chars = this.full.length; this.textEl.textContent = this.full; this.showOptions(); return; }
    if (this.idx < this.cfg.lines.length - 1) { this.idx++; this.startLine(); return; }
    if (this.cfg.options) return;
    this.close(undefined);
  }

  choose(i) {
    if (!this.open || !this.cfg.options || this.chars < this.full.length || this.idx !== this.cfg.lines.length - 1) return;
    const o = this.cfg.options[i];
    if (o && !o.disabled) this.close(o.value);
  }

  close(value) {
    if (!this.open) return;
    this.open = false;
    this.el.classList.add('hidden');
    unlock();
    G.hero?.stop('talk');
    const r = this.resolve; this.resolve = null;
    r?.(value);
  }

  update(dt, t) {
    if (!this.open) return;
    if (this.chars < this.full.length) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(this.full.length, this.chars + dt * CONFIG.ui.typewriterCps);
      const now = Math.floor(this.chars);
      this.textEl.textContent = this.full.slice(0, now);
      if (now > before && now % 2 === 0 && this.full[now - 1] !== ' ') G.audio?.blip(this.cfg.voice.pitch, this.cfg.voice.wave);
      if (now >= this.full.length) this.showOptions();
      this.mouth = Math.abs(Math.sin(t * 18));
    } else this.mouth *= 0.8;
    drawPortrait(this.portrait, this.cfg.portrait.kind, this.cfg.portrait.id, t, this.mouth);
    const inp = G.input;
    if (this.freshFrame) { this.freshFrame = false; return; } // a tecla que abriu o diálogo não avança a fala
    if (inp.hit('KeyE') || inp.hit('Enter') || inp.hit('Space')) this.advance();
    for (let i = 0; i < 3; i++) if (inp.hit('Digit' + (i + 1))) this.choose(i);
    if (inp.hit('Escape') && !this.cfg.options) this.close(undefined);
  }
}
