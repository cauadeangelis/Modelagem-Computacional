// Tela de mapa (tecla M): pergaminho em SVG com a ilha, caminhos, cidades e viagem rápida (seção 12).
import { G, lock, unlock } from '../game.js';
import { CONFIG } from '../config.js';
import { REGIONS, SETTLEMENTS } from '../data/settlements.js';
import { baseMap, fogMap } from './minimap.js';

const HALF = CONFIG.world.half;

const SHORT = {
  'Acampamento Base': 'Base', 'Padaria do Truncamento': 'Padaria', 'Acampamento Cancelamento': 'Cancelamento',
  'Galinheiro do Overflow': 'Galinheiro', 'Silo do Estouro': 'Silo', 'Pântano da Hidra': 'Hidra',
  'Cofre-Forte Hilbert': 'Cofre', 'Teia de Lagrange': 'Teia', 'Vale do Spline': 'Spline',
  'Preguiçópolis dos Mínimos Quadrados': 'Preguiçópolis', 'Colina do Colosso de Runge': 'Colosso',
  'Lagoa do Simpson 1/3': 'Simpson 1/3', 'Lagoa do Simpson 3/8': 'Simpson 3/8', 'Península RK4': 'RK4',
  'Farol do Tsunami': 'Farol', 'Usina Central': 'Usina',
};
const shortName = (n) => SHORT[n] || n;
// rótulo vai para baixo do círculo quando um vizinho anterior na lista está quase na mesma altura
const labelBelow = (s) => {
  const i = SETTLEMENTS.indexOf(s);
  return SETTLEMENTS.slice(0, i).some((o) => Math.abs(o.z - s.z) < 9 && Math.abs(o.x - s.x) < 34);
};

export class MapScreen {
  constructor() {
    this.el = document.getElementById('mapscreen');
    this.open = false;
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
  }

  toggle() { this.open ? this.close() : this.show(); }

  show() {
    if (this.open) return;
    this.open = true;
    lock();
    G.events.emit('mapOpened');
    const p = G.progress;
    const S = (v) => v + HALF; // mundo -> coordenadas do SVG (0..280)
    const fires = new Set(p.d.fires);
    // texto com pelo menos 16 px reais (§17): unidade do SVG em pixels na tela
    const px = Math.min(innerHeight * 0.82, innerWidth * 0.9) / 280;
    const fu = 16 / px;
    const showLabels = px >= 2.2;
    let items = '';
    for (const s of SETTLEMENTS) {
      const unlocked = p.regionUnlocked(s.regiao);
      const x = S(s.x), y = S(s.z);
      const boss = s.tipo === 'arena' || s.tipo === 'final';
      const col = REGIONS[s.regiao].pal.destaque;
      let sub = '';
      if (s.id.startsWith('C')) sub = `★${p.cityStars(s.id)}/9`;
      if (boss) sub = p.won(s.id) ? '✓' : '☠';
      const info = `${s.nome}${s.id.startsWith('C') ? ` — ${p.cityStars(s.id)}/9 ⭐` : boss ? (p.won(s.id) ? ' — vencido' : ' — chefão') : ''}`;
      if (unlocked || s.regiao === 0) {
        items += `<g class="map-city" data-info="${info}">
          <circle cx="${x}" cy="${y}" r="${boss ? 4.2 : 3.4}" fill="${boss ? '#3a2a1a' : col}" stroke="#3a2a1a" stroke-width="1"/>
          <circle cx="${x}" cy="${y}" r="${Math.max(6, 22 / px)}" fill="transparent"/>
          ${p.cityComplete?.(s.id) && s.id.startsWith('C') ? `<text x="${x}" y="${y + 1.4}" font-size="4" text-anchor="middle" fill="#fff">✓</text>` : ''}
          ${showLabels ? `<text x="${x}" y="${labelBelow(s) ? y + 5 + fu * 0.8 : y - 5}" font-size="${fu.toFixed(2)}" text-anchor="middle" font-weight="700" fill="#3a2a1a" stroke="#f3e2b8" stroke-width="${(fu * 0.28).toFixed(2)}" paint-order="stroke">${shortName(s.nome)} ${sub}</text>` : ''}
        </g>`;
      }
      if (fires.has(s.id)) {
        const st = G.settlements.find((q) => q.def.id === s.id);
        if (st?.campfire) {
          const fx = S(st.campfire.x) + 5, fy = S(st.campfire.z) + 1;
          items += `<g class="map-fire" data-fire="${s.id}"><circle cx="${fx}" cy="${fy}" r="${Math.max(6, 22 / px)}" fill="transparent"/><circle cx="${fx}" cy="${fy}" r="3.6" fill="#ffe4b0" stroke="#e8654a" stroke-width="1.4"/><text x="${fx}" y="${fy + 1.5}" font-size="4.2" text-anchor="middle">🔥</text><title>Viajar para ${s.nome}</title></g>`;
        }
      }
    }
    const h = G.hero.pos;
    const ha = (Math.atan2(Math.cos(G.hero.yaw), Math.sin(G.hero.yaw)) * 180) / Math.PI;
    const obj = G.objective;
    const objMark = obj && obj.x != null ? `<text x="${S(obj.x)}" y="${S(obj.z) + 2}" font-size="7" text-anchor="middle" fill="#f2c14e" stroke="#3a2a1a" stroke-width=".8">★</text>` : '';
    this.el.innerHTML = `<div class="sheet">
      <div class="map-head"><h2>🗺️ Mapa de Calculândia</h2><span class="map-legend">🔥 = viagem rápida · ★ = objetivo</span><button class="btn secondary" id="map-close"><kbd>M</kbd>Fechar</button></div>
      <div class="map-wrap"><svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="280" fill="#7fc4dd"/>
        <image href="${baseMap().toDataURL()}" width="280" height="280" style="image-rendering:auto"/>
        <image href="${fogMap().toDataURL()}" width="280" height="280"/>
        ${items}
        ${objMark}
        <g transform="translate(${S(h.x)} ${S(h.z)}) rotate(${ha})"><path d="M5 0 L-3.5 -3.5 L-1.5 0 L-3.5 3.5 Z" fill="#2f6fdd" stroke="#fff" stroke-width=".8"/></g>
      </svg></div>
      <div class="map-info" id="map-info">${showLabels ? 'Passe o mouse ou toque numa cidade para ver o nome completo.' : 'Toque numa cidade para ver o nome e as estrelas.'}</div>
      <p class="map-note">Regiões cobertas pela Névoa do Erro abrem quando o chefão anterior cai. Toque numa fogueira 🔥 para viajar.</p>
    </div>`;
    this.el.classList.remove('hidden');
    this.el.querySelector('#map-close').onclick = () => this.close();
    const infoEl = this.el.querySelector('#map-info');
    this.el.querySelectorAll('.map-city').forEach((n) => {
      const show = () => { infoEl.textContent = n.getAttribute('data-info'); };
      n.addEventListener('pointerenter', show);
      n.addEventListener('click', show);
    });
    this.el.querySelectorAll('[data-fire]').forEach((n) => n.addEventListener('click', () => { const id = n.getAttribute('data-fire'); this.close(); G.events.emit('fastTravel', id); }));
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.el.classList.add('hidden');
    unlock();
  }
}
