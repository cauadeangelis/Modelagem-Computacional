// Progresso: estrelas, sementes, chefões, regiões liberadas, Raizdex e próximo objetivo (seções 9–11).
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { SETTLEMENTS, SETTLEMENT_BY_ID, CITIES, BOSSES, STAR_REQ, UNLOCK_BY, BOSS_OF_REGION, NIVEIS, REGIONS } from '../dados/regioes-e-cidades.js';
import { writeSave } from './salvamento.js';

export const STICKERS = [...CITIES.map((c) => c.id), 'S1', 'S2', 'S3'];
export const STICKER_INFO = {
  S1: { nome: 'Raiz Complexa', desc: 'Pegue uma Raiz Complexa (metade imaginária).', ico: '🟣' },
  S2: { nome: 'Colecionador(a)', desc: 'Pegue as 40 Raízes Fugitivas.', ico: '🌱' },
  S3: { nome: 'Usina Salva', desc: 'Vença o Grande Erro na Usina Central.', ico: '⚡' },
};
export const COSMETICS = [
  { id: 'listrado', nome: 'Capacete listrado' },
  { id: 'palha', nome: 'Chapéu de palha' },
  { id: 'bolinhas', nome: 'Colete de bolinhas' },
  { id: 'foguete', nome: 'Botas de foguete' },
  { id: 'oculos', nome: 'Óculos de engenheiro' },
  { id: 'jato', nome: 'Mochila-jato' },
];

export class Progress {
  constructor(data) { this.d = data; this.d.rpg = { xp: 0, combo: 1, relics: [], diary: [], bestXp: {}, ...data.rpg }; }

  save() { this.d.options = G.options; writeSave(this.d); }

  get seeds() { return this.d.seeds; }
  addSeeds(n) {
    const before = this.d.seeds;
    this.d.seeds = Math.min(CONFIG.seeds.max, this.d.seeds + n);
    G.events.emit('seeds', this.d.seeds, this.d.seeds - before);
  }
  spendSeeds(n) {
    if (this.d.seeds < n) return false;
    this.d.seeds -= n;
    G.events.emit('seeds', this.d.seeds, -n);
    return true;
  }

  key(sid, nivel) { return nivel === 'B' ? sid : `${sid}-${nivel}`; }
  phase(key) { return (this.d.phases[key] ||= { stars: 0, wins: 0, defeats: 0, defeatsRow: 0 }); }
  starsOf(key) { return this.d.phases[key]?.stars || 0; }
  won(key) { return (this.d.phases[key]?.wins || 0) > 0; }

  cityStars(sid) { return ['F', 'M', 'D'].reduce((a, n) => a + this.starsOf(`${sid}-${n}`), 0); }
  cityWins(sid) { return ['F', 'M', 'D'].filter((n) => this.won(`${sid}-${n}`)).length; }
  cityComplete(sid) { return this.cityWins(sid) === 3; }
  regionStars(r) { return CITIES.filter((c) => c.regiao === r).reduce((a, c) => a + this.cityStars(c.id), 0); }
  totalStars() { return CITIES.reduce((a, c) => a + this.cityStars(c.id), 0); }
  bossBeaten(bid) { return this.won(bid); }
  regionUnlocked(r) {
    if (r <= 1) return true;
    if (r === 6) return this.usinaOpen();
    return this.bossBeaten(UNLOCK_BY[r]);
  }
  canFightBoss(s) {
    if (s.tipo === 'final') return this.usinaOpen();
    return this.regionStars(s.regiao) >= STAR_REQ[s.regiao];
  }
  starsMissing(s) { return Math.max(0, STAR_REQ[s.regiao] - this.regionStars(s.regiao)); }
  usinaOpen() { return ['B0', 'B1', 'B2', 'B3', 'B4'].every((b) => this.bossBeaten(b)); }

  rootsCaught() { return Object.keys(this.d.roots).length; }
  hasSticker(id) { return !!this.d.stickers[id]; }
  addSticker(id) {
    if (this.d.stickers[id]) return null;
    this.d.stickers[id] = true;
    // cada página (4 figurinhas) completada rende um cosmético
    const page = Math.floor(STICKERS.indexOf(id) / 4);
    const ids = STICKERS.slice(page * 4, page * 4 + 4);
    if (ids.every((s) => this.d.stickers[s])) return COSMETICS[page];
    return null;
  }
  cosmeticOwned(id) {
    const page = COSMETICS.findIndex((c) => c.id === id);
    return STICKERS.slice(page * 4, page * 4 + 4).every((s) => this.d.stickers[s]);
  }

  // Aplica o resultado da fase e devolve o que mudou
  applyResult(s, nivel, res) {
    const key = this.key(s.id, nivel);
    const P = this.phase(key);
    const rpg = this.d.rpg;
    const ev = { key, seeds: 0, firstWin: false, newStars: 0, cityCompleted: false, bossBeaten: false, unlockedRegion: null, usinaOpened: false, finalWon: false, cosmetic: null };
    if (!res.vitoria) {
      if (!res.abandonou) {
        P.defeats++; P.defeatsRow = (P.defeatsRow || 0) + 1; rpg.combo = 1;
        if (res.diary) { rpg.diary.unshift({ ...res.diary, date: new Date().toISOString(), studiedRelics: res.studiedRelics || [] }); rpg.diary = rpg.diary.slice(0, 20); }
      }
      this.save();
      return ev;
    }
    const wasWon = P.wins > 0;
    // XP é acumulado por missão concluída; recordes ficam separados das recompensas.
    const earned = Math.max(0, res.xp || 0);
    rpg.xp += earned; rpg.bestXp[key] = Math.max(res.xp || 0, rpg.bestXp[key] || 0);
    rpg.combo = res.alertaVermelho ? 1 : Math.min(1.5, Math.round((rpg.combo + .1) * 10) / 10);
    rpg.relics = [...new Set([...rpg.relics, ...(res.relics || [])])];
    const wasComplete = s.id.startsWith('C') && this.cityComplete(s.id);
    const usinaBefore = this.usinaOpen();
    P.wins++;
    P.defeatsRow = 0;
    if (res.estrelas > P.stars) { ev.newStars = res.estrelas - P.stars; P.stars = res.estrelas; }
    if (!wasWon) {
      ev.firstWin = true;
      ev.seeds += nivel === 'B' ? 3 : CONFIG.seeds.win[nivel];
    }
    if (res.estrelas === 3 && !P.three) { P.three = true; ev.seeds += CONFIG.seeds.threeStars; }
    if (ev.seeds) this.addSeeds(ev.seeds);
    if (s.id.startsWith('C') && !wasComplete && this.cityComplete(s.id)) {
      ev.cityCompleted = true;
      ev.cosmetic = this.addSticker(s.id);
    }
    if (s.id.startsWith('B') && !wasWon) {
      ev.bossBeaten = true;
      const r = Object.keys(UNLOCK_BY).find((k) => UNLOCK_BY[k] === s.id);
      if (r) ev.unlockedRegion = +r;
      if (!usinaBefore && this.usinaOpen()) ev.usinaOpened = true;
    }
    if (s.id === 'F' && !wasWon) { ev.finalWon = true; ev.cosmetic = this.addSticker('S3') || ev.cosmetic; }
    this.save();
    return ev;
  }

  // O jogador sempre sabe o próximo objetivo (checklist seção 17)
  nextObjective() {
    for (let r = 1; r <= 5; r++) {
      const bid = BOSS_OF_REGION[r];
      if (this.bossBeaten(bid)) continue;
      const boss = SETTLEMENT_BY_ID[bid];
      if (this.regionStars(r) < STAR_REQ[r]) {
        for (const nivel of ['F', 'M', 'D']) {
          for (const c of CITIES.filter((c) => c.regiao === r)) {
            if (!this.won(`${c.id}-${nivel}`)) {
              const S = G.settlements.find((x) => x.def.id === c.id);
              const door = S?.buildings[nivel]?.door || c;
              return { text: `Vença a <b>${NIVEIS[nivel].predio}</b> em ${c.nome} (${this.regionStars(r)}/${STAR_REQ[r]} ⭐ para o chefão)`, x: door.x, z: door.z, sid: c.id };
            }
          }
        }
        // todas vencidas mas sem estrelas suficientes: refazer para mais estrelas
        const c = CITIES.filter((c) => c.regiao === r).sort((a, b) => this.cityStars(a.id) - this.cityStars(b.id))[0];
        return { text: `Refaça fases em ${c.nome} para ganhar mais estrelas (${this.regionStars(r)}/${STAR_REQ[r]} ⭐)`, x: c.x, z: c.z, sid: c.id };
      }
      const S = G.settlements.find((x) => x.def.id === bid);
      const d = S?.buildings.B?.door || boss;
      return { text: `Enfrente o chefão: <b>${boss.nome}</b>`, x: d.x, z: d.z, sid: bid };
    }
    if (!this.won('F')) return { text: 'Entre na <b>Usina Central</b> e vença o Grande Erro!', x: 0, z: 9.5, sid: 'F' };
    const left = 40 - this.rootsCaught();
    if (left > 0) {
      const r = G.roots.filter((r) => !r.caught).sort((a, b) => a.home.distanceTo(G.hero.pos) - b.home.distanceTo(G.hero.pos))[0];
      return { text: `A ilha está salva! Faltam ${left} Raízes Fugitivas.`, x: r?.home.x, z: r?.home.z };
    }
    return { text: 'Calculândia salva! Erro: zero. Orgulho: infinito.', x: null, z: null };
  }
}

export { REGIONS, SETTLEMENTS, BOSSES };
