// HUD do overworld (seção 12): estrelas, sementes, faixa de região, botão contextual, prévia de fase, legendas.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { NIVEIS } from '../dados/regioes-e-cidades.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.root = $('hud');
    this.stars = $('stat-stars'); this.seeds = $('stat-seeds'); this.roots = $('stat-roots');
    this.ctxBtn = $('context-btn');
    this.objective = $('objective');
    this.preview = $('preview');
    this.captions = $('captions');
    this.region = $('region-banner'); this.city = $('city-banner');
    this.ctxBtn.addEventListener('click', () => { G.input.pressed.add('KeyE'); });
    $('btn-map').addEventListener('click', () => G.events.emit('openMap'));
    $('btn-menu').addEventListener('click', () => G.events.emit('openMenu'));
    this._ctx = null;
    this.v = new THREE.Vector3();
  }
  show(v) { this.root.classList.toggle('hidden', !v); }
  setMinimap(v) { $('minimap-wrap').classList.toggle('hidden', !v); this.root.classList.toggle('nominimap', !v); }
  setSeedsVisible(v) { $('stat-seeds-wrap').classList.toggle('hidden', !v); }

  updateStats(p) {
    this.stars.textContent = p.totalStars();
    this.seeds.textContent = p.seeds;
    this.roots.textContent = p.rootsCaught();
  }
  pulse(which) {
    const el = { stars: this.stars, seeds: this.seeds, roots: this.roots }[which]?.parentElement;
    if (!el) return;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }

  setContext(item) {
    const label = item ? item.label : null;
    if (label === this._ctx) return;
    this._ctx = label;
    if (!label) { this.ctxBtn.classList.add('hidden'); return; }
    this.ctxBtn.classList.remove('hidden');
    this.ctxBtn.innerHTML = `${G.input?.touch ? '' : '<kbd>E</kbd>'}${label}`;
  }

  setObjective(html) { if (this._obj !== html) { this._obj = html; this.objective.innerHTML = html ? `🎯 ${html}` : ''; } }

  banner(text, kind = 'region') {
    const el = kind === 'region' ? this.region : this.city;
    const other = kind === 'region' ? this.city : this.region;
    const otherOn = other.classList.contains('show');
    const otherText = other.querySelector('span').textContent;
    // a faixa da cidade não repete o nome da região (Acampamento Base, Usina Central)
    if (otherOn && otherText === text) {
      if (kind === 'city') return;
      other.classList.remove('show');
    }
    el.querySelector('span').textContent = text;
    el.classList.add('show');
    // as duas faixas juntas: a da cidade desce para baixo da faixa da região
    this.city.classList.toggle('stack', this.region.classList.contains('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.classList.remove('show'); this.city.classList.remove('stack'); }, CONFIG.ui.regionBannerTime * 1000);
  }

  showPreview(info) {
    if (!info) { this.preview.classList.add('hidden'); return; }
    const st = '★'.repeat(info.stars) + '☆'.repeat(3 - info.stars);
    this.preview.innerHTML = `<div class="pv-title">${info.title}</div>
      <div class="pv-diff diff-${info.nivel}">${info.diff}</div>
      <div class="pv-row"><span title="Estrelas atuais">${st}</span><span title="Bateria disponível">🔋 ${info.battery}</span></div>
      ${info.won ? '<div class="pv-diff pv-won">✔ Fase concluída (pode repetir)</div>' : ''}${info.locked ? `<div class="pv-diff">🔒 ${info.locked}</div>` : ''}`;
    this.preview.classList.remove('hidden');
  }

  caption(text) {
    const d = document.createElement('div');
    d.className = 'caption';
    d.textContent = text;
    this.captions.appendChild(d);
    while (this.captions.children.length > 4) this.captions.firstChild.remove();
    setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 500); }, 3000);
  }

  // sementes voam do prédio até o contador (arco, 0,8 s)
  seedFly(worldPos, n) {
    const layer = $('seedfly');
    this.v.copy(worldPos).project(G.camera);
    const sx = ((this.v.x + 1) / 2) * innerWidth, sy = ((1 - this.v.y) / 2) * innerHeight;
    const r = this.seeds.getBoundingClientRect();
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    for (let i = 0; i < Math.min(n, 8); i++) {
      const s = document.createElement('div');
      s.className = 'flyseed'; s.textContent = '🌰';
      layer.appendChild(s);
      const delay = i * 90, T = CONFIG.ui.seedFlyTime * 1000;
      const start = performance.now() + delay;
      const step = (now) => {
        const k = Math.min(1, Math.max(0, (now - start) / T));
        const x = sx + (tx - sx) * k, y = sy + (ty - sy) * k - Math.sin(k * Math.PI) * 120;
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.transform = `translate(-50%,-50%) scale(${1 + Math.sin(k * Math.PI) * 0.4})`;
        if (k < 1) requestAnimationFrame(step);
        else { s.remove(); if (i === 0) { G.audio?.sfx('semente'); this.pulse('seeds'); } }
      };
      s.style.left = sx + 'px'; s.style.top = sy + 'px';
      requestAnimationFrame(step);
    }
  }
}

export function phasePreviewInfo(S, nivel) {
  const p = G.progress;
  const key = p.key(S.def.id, nivel);
  const boss = nivel === 'B';
  const B = CONFIG.battery;
  const info = {
    nivel: boss ? 'D' : nivel,
    title: boss ? S.def.metodoNome : `${NIVEIS[nivel].predio} — ${S.def.metodoNome}`,
    diff: boss ? '☠ Chefão' : `${NIVEIS[nivel].simbolo} ${NIVEIS[nivel].dificuldade} · ${NIVEIS[nivel].nome}`,
    stars: p.starsOf(key),
    won: p.won(key),
    battery: G.fases?.batteryFor(S.def.metodo, boss ? 'B' : nivel) ?? (boss ? B.boss : B[nivel]),
  };
  if (boss && !p.canFightBoss(S.def)) info.locked = S.def.tipo === 'final' ? 'Vença os 5 chefões' : `Faltam ${p.starsMissing(S.def)} estrelas`;
  return info;
}
