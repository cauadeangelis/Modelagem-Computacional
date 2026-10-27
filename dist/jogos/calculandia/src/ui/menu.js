// Menu (Esc): Continuar, Raizdex, Controles, Opções e Créditos. Também a tela de título.
import { G, lock, unlock } from '../game.js';
import { CITIES, SETTLEMENT_BY_ID } from '../data/settlements.js';
import { ANIMALS } from '../data/animals.js';
import { CREDITOS, JOGADOR } from '../data/dialogs.js';
import { paginaMestres } from '../systems/mestres.js';
import { drawPortrait } from './portraits.js';
import { RAIZ_TIPOS, TIPOS_ORDEM } from '../entities/raiz.js';
import { STICKERS, STICKER_INFO, COSMETICS } from '../systems/progress.js';
import { RELICS } from '../fases/levels.js';
import { perksFor } from '../fases/session.js';
import { esc } from '../fases/tactical-ui.js';

export class Menu {
  constructor() {
    this.el = document.getElementById('menu');
    this.open = false;
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
  }
  toggle() { this.open ? this.close() : this.show(); }

  show(page = 'main') {
    if (!this.open) { this.open = true; lock(); G.events.emit('menuOpened'); }
    this.el.classList.remove('hidden');
    this.page = page;
    if (page === 'main') this.main();
    if (page === 'dex') this.dex();
    if (page === 'ctrl') this.controles();
    if (page === 'mestres') this.mestres();
    if (page === 'opts') this.opts();
    if (page === 'cred') this.cred();
    if (page === 'engineer') this.engineer();
  }
  close() {
    if (!this.open) return;
    this.open = false;
    this.el.classList.add('hidden');
    unlock();
    G.progress?.save();
  }
  sheet(html) {
    this.el.innerHTML = `<div class="sheet">${html}</div>`;
    this.el.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { const g = b.getAttribute('data-go'); g === 'close' ? this.close() : this.show(g); }));
  }

  main() {
    this.sheet(`<h2>Menu · ${esc(JOGADOR.nome)}</h2><div class="menu-list">
      <button class="btn big" data-go="close">▶ Continuar</button>
      <button class="btn big" data-go="dex">📒 Raizdex</button>
      <button class="btn big" data-go="mestres">📜 Mestres</button>
      <button class="btn big" id="m-inv">🎒 Inventário <kbd>I</kbd></button>
      <button class="btn big" data-go="ctrl">🎮 Controles</button>
      <button class="btn big" data-go="engineer">🔬 Engenheiro e Diário de Campo</button>
      <button class="btn big" data-go="opts">⚙️ Opções</button>
      <button class="btn big" data-go="cred">🎬 Créditos</button>
      <a class="btn big secondary" href="../../index.html#jogos">← Voltar ao Numera Academy</a>
    </div>`);
    this.el.querySelector('#m-inv').onclick = () => { this.close(); G.events.emit('openInventory'); };
  }

  mestres() {
    this.sheet(`<div class="row" style="justify-content:space-between"><h2>📜 Mestres</h2><button class="btn secondary" data-go="main">← Voltar</button></div>
      <p>Apresentações e missões dos personagens históricos que você já encontrou. Para conversar de novo, vá até eles e aperte E.</p>${paginaMestres(esc)}`);
    this.el.querySelectorAll('[data-mestre]').forEach((c) => drawPortrait(c, 'historico', c.dataset.mestre, 0, 0));
  }

  controles() {
    const k = (...ks) => ks.map((x) => `<kbd>${x}</kbd>`).join(' ');
    const linhas = [
      ['Andar', `${k('W', 'A', 'S', 'D')} ou ${k('↑', '←', '↓', '→')} · clique no chão`, 'joystick · toque no chão'],
      ['Correr', `segure ${k('Shift')}`, 'toque duplo no joystick'],
      ['Pular', k('Espaço'), 'botão Pular'],
      ['Interagir / passar fala', `${k('E')} ou ${k('Enter')}`, 'botão Interagir · toque na fala'],
      ['Escolher resposta', `${k('1')} ${k('2')} ${k('3')}`, 'toque na resposta'],
      ['Dica do objetivo', k('H'), 'botão Dica'],
      ['Mapa', k('M'), 'botão 🗺️'],
      ['Inventário', k('I'), 'Menu → Inventário'],
      ['Menu', k('Esc'), 'botão ☰'],
      ['Girar a câmera', `${k('Q')} e ${k('R')}`, '—'],
      ['Zoom', 'roda do mouse', 'pinça com dois dedos'],
      ['Pular a abertura', `segure ${k('Espaço')}`, 'toque e segure'],
    ];
    this.sheet(`<div class="row" style="justify-content:space-between"><h2>🎮 Controles</h2><button class="btn secondary" data-go="main">← Voltar</button></div>
      <table class="ctrl-table"><thead><tr><th>Ação</th><th>Teclado e mouse</th><th>Toque</th></tr></thead>
      <tbody>${linhas.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('')}</tbody></table>
      <p>Na fase tática: <b>Auto</b> (ou ${k('Enter')}/${k('Espaço')} fora dos campos) executa uma operação, ${k('H')} chama o guia e ${k('D')} abre o modo professor.</p>
      <div class="row"><button class="btn" id="m-tuto">🎓 Refazer o tutorial de comandos</button></div>`);
    const b = this.el.querySelector('#m-tuto');
    b.onclick = () => { G.comandos.reset(); b.textContent = '✔ Pronto! Ele começa quando você fechar o menu.'; b.disabled = true; };
  }

  dex() {
    const p = G.progress;
    const cards = STICKERS.map((id) => {
      const have = p.hasSticker(id);
      if (id.startsWith('S')) {
        const s = STICKER_INFO[id];
        return `<div class="dex-card ${have ? '' : 'off'}"><div class="dex-ico">${have ? s.ico : '❔'}</div><b>${have ? s.nome : 'Secreta'}</b><span>${have ? s.desc : '???'}</span></div>`;
      }
      const c = SETTLEMENT_BY_ID[id];
      const a = ANIMALS[c.bicho];
      return `<div class="dex-card ${have ? '' : 'off'}"><div class="dex-ico">${have ? '🥕' : '❔'}</div><b>Raiz de ${c.nome.split(' ')[0] === 'Lagoa' ? c.nome.replace('Lagoa do ', '') : c.nome.split(' dos')[0]}</b><span>${have ? a.nome : `${p.cityWins(id)}/3 fases`}</span></div>`;
    }).join('');
    const byType = {};
    for (const r of G.roots) { byType[r.tipo] ||= { got: 0, all: 0 }; byType[r.tipo].all++; if (r.caught) byType[r.tipo].got++; }
    const roots = TIPOS_ORDEM.map((t) => { const T = RAIZ_TIPOS[t], b = byType[t] || { got: 0, all: 0 }; return `<div class="dex-card ${b.got ? '' : 'off'}"><div class="dex-ico">${T.ico}</div><b>${T.nome}</b><span>${b.got}/${b.all} · ${T.jeito}</span></div>`; }).join('');
    const on = new Set(p.d.cosmetics.on);
    const cos = COSMETICS.map((c, i) => {
      const owned = p.cosmeticOwned(c.id);
      return `<button class="btn ${on.has(c.id) ? 'on' : ''}" data-cos="${c.id}" ${owned ? '' : 'disabled'} title="${owned ? 'Equipar/desequipar' : `Complete a página ${i + 1}`}">${owned ? '' : '🔒 '}${c.nome}</button>`;
    }).join('');
    this.sheet(`<div class="row" style="justify-content:space-between"><h2>📒 Raizdex</h2><button class="btn secondary" data-go="main">← Voltar</button></div>
      <p>Figurinhas: <b>${STICKERS.filter((s) => p.hasSticker(s)).length}/24</b> — cada cidade completa (3 fases) dá a sua Raiz da Cidade. Cada página de 4 figurinhas libera um cosmético.</p>
      <div class="dex-grid">${cards}</div>
      <h3>Cosméticos</h3><div class="cos-list">${cos}</div>
      <h3>Raízes Fugitivas: ${p.rootsCaught()}/40</h3>
      <div class="dex-grid">${roots}</div>`);
    this.el.querySelectorAll('[data-cos]').forEach((b) => (b.onclick = () => {
      const id = b.getAttribute('data-cos');
      const list = new Set(p.d.cosmetics.on);
      list.has(id) ? list.delete(id) : list.add(id);
      p.d.cosmetics.on = [...list];
      G.hero.setCosmetics(p.d.cosmetics.on);
      p.save();
      this.dex();
    }));
  }

  engineer() {
    const r = G.progress.d.rpg, p = perksFor(r.xp);
    this.sheet(`<div class="row"><h2>🔬 Engenheiro · nível ${p.level}</h2><button class="btn" data-go="main">← Voltar</button></div>
      <p><b>${r.xp} XP</b> · combo ×${r.combo.toFixed(1)}. Cada missão concluída acumula XP; precisão e eficiência aumentam a recompensa.</p>
      <p>${r.xp >= 3000 ? '✓' : '🔒'} 3.000 XP: +10% de bateria · ${r.xp >= 12000 ? '✓' : '🔒'} 12.000 XP: sonda extra · ${r.xp >= 27000 ? '✓' : '🔒'} 27.000 XP: primeiro desfazer grátis · ${r.xp >= 48000 ? '✓' : '🔒'} 48.000 XP: prévia em dificuldades maiores.</p>
      <h3>Caderno de relíquias</h3><p>${r.relics.map(id => esc(RELICS[id] || id)).join(' · ') || 'Vença chefões ou estude uma derrota para registrar conceitos.'}</p>
      <h3>Diário de Campo</h3>${r.diary.length ? r.diary.map((entry, i) => `<article class="journal-entry"><h4>${esc(entry.name)}</h4><p>${esc(entry.reason)}</p>${/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(entry.graph || '') ? `<img src="${entry.graph}" alt="Gráfico congelado no momento da falha" style="width:100%">` : ''}<details><summary>Operações no momento da falha</summary><div class="t-telemetry"><table>${entry.traces.map(t => `<tr><td>${t.k}</td><td>${esc(t.formula)}</td><td>${esc(t.err)}</td></tr>`).join('')}</table></div></details>${entry.studiedRelics?.length ? `<button class="btn" data-study="${i}">Estudar: ${entry.studiedRelics.map(id => esc(RELICS[id])).join(', ')}</button>` : ''}</article>`).join('') : '<p>Os diagnósticos das próximas derrotas aparecerão aqui.</p>'}`);
    this.el.querySelectorAll('[data-study]').forEach(b => { b.onclick = () => { const entry = r.diary[Number(b.dataset.study)]; r.relics = [...new Set([...r.relics, ...entry.studiedRelics])]; entry.studiedRelics = []; G.progress.save(); this.engineer(); }; });
  }

  opts() {
    const o = G.options;
    this.sheet(`<div class="row" style="justify-content:space-between"><h2>⚙️ Opções</h2><button class="btn secondary" data-go="main">← Voltar</button></div>
      <div class="opt-row"><span>Volume geral</span><input type="range" min="0" max="1" step="0.05" value="${o.volume}" id="o-vol"></div>
      <div class="opt-row"><span>Música</span><input type="range" min="0" max="1" step="0.05" value="${o.music}" id="o-mus"></div>
      <div class="opt-row"><span>Sombras</span><button class="btn toggle" id="o-sh">${o.sombras ? 'Ligadas' : 'Desligadas'}</button></div>
      <div class="opt-row"><span>Qualidade gráfica</span><button class="btn toggle" id="o-q">${o.qualidade === 'alta' ? 'Alta' : 'Leve'}</button></div>
      <div class="opt-row"><span>Reduzir movimento (sem tremor, menos partículas)</span><button class="btn toggle" id="o-rm">${o.reduzirMovimento ? 'Sim' : 'Não'}</button></div>
      <div class="opt-row"><span>Apagar o progresso e começar de novo</span><button class="btn danger" id="o-reset">Reiniciar</button></div>`);
    const $ = (id) => this.el.querySelector(id);
    $('#o-vol').oninput = (e) => G.audio.setVolume(+e.target.value);
    $('#o-mus').oninput = (e) => G.audio.setMusic(+e.target.value);
    $('#o-sh').onclick = () => { o.sombras = !o.sombras; G.events.emit('options'); this.opts(); };
    $('#o-q').onclick = () => { o.qualidade = o.qualidade === 'alta' ? 'leve' : 'alta'; G.events.emit('options'); this.opts(); };
    $('#o-rm').onclick = () => { o.reduzirMovimento = !o.reduzirMovimento; this.opts(); };
    $('#o-reset').onclick = () => {
      const b = $('#o-reset');
      if (b.dataset.sure) { G.events.emit('resetGame'); return; }
      b.dataset.sure = '1'; b.textContent = 'Tem certeza? Clique de novo';
    };
  }

  cred() {
    this.sheet(`<div class="row" style="justify-content:space-between"><h2>🎬 Créditos</h2><button class="btn secondary" data-go="main">← Voltar</button></div>
      ${CREDITOS.map((l) => `<p>${l}</p>`).join('')}
      <p>Bichos guias: ${CITIES.map((c) => ANIMALS[c.bicho].nome).join(' · ')}.</p>`);
  }
}

// Tela de título
export function showTitle({ hasSave, onNew, onContinue }) {
  const el = document.getElementById('title');
  el.classList.remove('hidden');
  el.innerHTML = `<div class="title-logo">Calculândia</div>
    <div class="title-sub">Caçadores de Raízes</div>
    <div class="title-buttons">
      ${hasSave ? '<button class="btn big" id="t-cont">▶ Continuar</button>' : ''}
      <button class="btn big ${hasSave ? 'secondary' : ''}" id="t-new">✨ Novo jogo</button>
      <a class="btn big secondary" href="../../index.html#jogos">← Numera Academy</a>
    </div>
    <div class="title-foot">WASD ou setas para andar · Shift corre · Espaço pula · E interage · H pede dica · M mapa · Esc menu</div>`;
  const close = () => el.classList.add('hidden');
  if (hasSave) el.querySelector('#t-cont').onclick = () => { close(); onContinue(); };
  const nb = el.querySelector('#t-new');
  nb.onclick = () => {
    if (hasSave && !nb.dataset.sure) { nb.dataset.sure = '1'; nb.textContent = 'Apagar o save e começar?'; return; }
    close(); onNew();
  };
}
