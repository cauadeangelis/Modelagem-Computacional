// Mestres (personagens históricos): criação no mundo, conversa por etapas e consulta no menu.
// Primeiro encontro em falas curtas, com opção de pular; depois, história, missão e orientação
// a qualquer momento. A fala de abertura muda com o progresso da missão.
import { G } from '../game.js';
import { HISTORICOS } from '../data/historicos.js';
import { SETTLEMENT_BY_ID, NIVEIS } from '../data/settlements.js';
import { Historico, TALK_R } from '../entities/historico.js';

const portrait = (h) => ({ kind: 'historico', id: h.id });

export function criarMestres(scene) {
  const lista = [];
  for (const def of HISTORICOS) {
    const S = G.settlements.find((s) => s.def.id === def.cidade);
    if (!S) continue;
    const m = new Historico(scene, def, S);
    G.collision.addCircle(m.pos.x, m.pos.z, 0.45);
    G.interaction.add({ x: m.pos.x, z: m.pos.z, r: TALK_R, prio: 2, label: `Conversar com ${def.nome}`, action: () => conversar(m) });
    lista.push(m);
  }
  return lista;
}

function faseLabel(def) {
  const [cid, nv] = def.missaoFase.split('-');
  return `${NIVEIS[nv].predio} de ${SETTLEMENT_BY_ID[cid].nome}`;
}

export async function conversar(m) {
  const def = m.def, p = G.progress, d = (p.d.historicos[def.id] ||= {});
  const quem = { name: `${def.nome} · ${def.titulo}`, portrait: portrait(def), voice: def.voz };
  const dlg = G.ui.dialog;
  m.wave = 1.2;
  if (!d.met) {
    // recepção curta: a primeira fala já oferece pular
    const v = await dlg.show({ ...quem, lines: [def.intro[0]], options: [{ label: 'Quero conhecer', value: 'ver' }, { label: 'Pular apresentação', value: 'pular' }] });
    d.met = true; p.save();
    if (v === 'ver') await dlg.show({ ...quem, lines: [...def.intro.slice(1), `Tenho uma missão para você: ${def.missao}`] });
    else if (v === 'pular') await dlg.show({ ...quem, lines: [`Sem problemas. Missão: ${def.missao}`, 'Volte quando quiser ouvir minha história. Ela também fica no Menu → Mestres.'] });
    else return;
  }
  // volta: a abertura depende do progresso
  for (;;) {
    const st = m.estado();
    let abertura = st === 'concluida' ? def.concluida : def.andamento;
    if (st === 'concluida' && !d.recompensa) {
      d.recompensa = true; p.addSeeds(2); p.save();
      G.ui.seedFly(m.pos.clone().setY(m.pos.y + 2.4), 2);
      abertura += ' Leve 2 sementes de presente.';
    }
    const v = await dlg.show({ ...quem, lines: [abertura], options: [
      { label: 'Sua história', value: 'historia' }, { label: 'A missão', value: 'missao' },
      { label: 'Uma orientação', value: 'orientacao' }, { label: 'Até logo', value: 'tchau' },
    ] });
    if (v === 'historia') await dlg.show({ ...quem, lines: def.historia });
    else if (v === 'missao') await dlg.show({ ...quem, lines: [def.missao, st === 'concluida' ? 'Missão concluída. ✔' : `Onde: ${faseLabel(def)}. Situação: em andamento.`] });
    else if (v === 'orientacao') await dlg.show({ ...quem, lines: [def.orientacao, 'As dicas que revelam passos da missão ficam com o bicho guia e dentro da fase; conversar comigo não muda custos nem penalidades.'] });
    else return;
  }
}

// Menu → Mestres: rever apresentações e missões dos mestres já encontrados
export function paginaMestres(esc) {
  const p = G.progress;
  return HISTORICOS.map((h) => {
    const met = p.d.historicos[h.id]?.met, ok = p.won(h.missaoFase);
    if (!met) return `<article class="mestre off"><h3>❔ Mestre ainda não encontrado</h3><p>Procure em ${esc(SETTLEMENT_BY_ID[h.cidade].nome)}.</p></article>`;
    return `<article class="mestre"><canvas width="96" height="96" data-mestre="${h.id}" aria-hidden="true"></canvas><div>
      <h3>${esc(h.nome)} <small>${esc(h.titulo)}</small></h3>
      <p>${h.historia.map(esc).join(' ')}</p>
      <p><b>Missão ${ok ? '✔ concluída' : '⏳ em andamento'}:</b> ${esc(h.missao)}</p>
      <details><summary>Orientação</summary><p>${esc(h.orientacao)}</p></details></div></article>`;
  }).join('');
}

// sem cobrança duplicada: o nível de dica pago fica guardado por fase (sobrevive a sair e voltar)
export function dicaPaga(chave) { return G.progress.d.ajuda[chave] || 1; }
export function registrarDica(chave, nivel) {
  const a = G.progress.d.ajuda;
  if ((a[chave] || 1) < nivel) { a[chave] = nivel; G.progress.save(); }
}
