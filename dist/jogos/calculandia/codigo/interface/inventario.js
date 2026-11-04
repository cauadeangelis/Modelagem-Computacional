// Inventário: grade por categoria (ferramentas, cartas, relíquias), item selecionado em destaque e
// painel de detalhes com função, quando usar, requisitos, custo e estado. Dentro de uma fase, equipar
// e ativar chamam a simulação de verdade (com o custo informado no botão); fora dela, só consulta.
// Ler uma carta nunca executa operação nem gasta recurso.
import { G } from '../jogo.js';
import { FERRAMENTAS, RELIQUIAS, CONCEITOS } from '../dados/conhecimento.js';
import { REGIONS } from '../dados/regioes-e-cidades.js';
import { icone, ICONES } from './icones.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ESTADO = {
  selecionada: ['Selecionada', 'st-sel'], ativa: ['Ativa', 'st-sel'], disponivel: ['Disponível', 'st-ok'], leitura: ['Para ler', 'st-ok'],
  guardada: ['No caderno', 'st-ok'], incompativel: ['Incompatível com esta missão', 'st-inc'], bloqueada: ['Bloqueada', 'st-blq'],
};
const ABAS = [['ferramentas', '🛠️ Ferramentas'], ['cartas', '📜 Cartas'], ['reliquias', '💎 Relíquias']];

// relíquias só funcionam em missões do tipo certo (evita ativar Chebyshev num sistema linear)
export function reliquiaCompativel(id, level) { return !!level && (level.relics.includes(id) || RELIQUIAS[id].tipos.includes(level.kind)); }

function liberada(regiao) { return !regiao || regiao <= 1 || G.progress.regionUnlocked(regiao); }

export function itens(aba, session) {
  const l = session?.level, s = session?.s, owned = G.progress.d.rpg?.relics || [];
  if (aba === 'ferramentas') return Object.entries(FERRAMENTAS).map(([id, f]) => {
    let st = liberada(f.regiao) ? 'disponivel' : 'bloqueada';
    if (l && st !== 'bloqueada') st = s.tool === id ? 'selecionada' : l.tools.includes(id) ? 'disponivel' : 'incompativel';
    if (l && l.tools.includes(id)) st = s.tool === id ? 'selecionada' : 'disponivel';
    return { id, tipo: 'ferramenta', nome: f.nome, ico: icone(id), st, d: f };
  });
  if (aba === 'cartas') return [
    ...Object.entries(CONCEITOS).map(([id, c]) => ({ id: 'c-' + id, tipo: 'carta', nome: c.nome, ico: ICONES.carta('∑'), st: 'leitura', d: c })),
    ...Object.entries(FERRAMENTAS).map(([id, f]) => ({ id: 'f-' + id, tipo: 'carta', nome: f.nome, ico: ICONES.carta(f.nome[0]), st: liberada(f.regiao) ? 'leitura' : 'bloqueada', d: f, regiao: f.regiao })),
  ];
  return Object.entries(RELIQUIAS).map(([id, r]) => {
    const tem = owned.includes(id);
    let st = tem ? 'guardada' : 'bloqueada';
    if (l) st = s.relics.includes(id) ? 'ativa' : l.relics.includes(id) || (tem && reliquiaCompativel(id, l)) ? 'disponivel' : tem ? 'incompativel' : 'bloqueada';
    return { id, tipo: 'reliquia', nome: r.nome, ico: ICONES.reliquia(r.nome[0]), st, d: r };
  });
}

export function custoTroca(session) { return session.s.k === 0 && session.traces.length === 0 ? 0 : 2; }

function detalhe(it, session) {
  const d = it.d, [rot, cls] = ESTADO[it.st];
  const linha = (t, v) => (v ? `<dt>${t}</dt><dd>${esc(v)}</dd>` : '');
  let acao = '';
  if (it.st === 'bloqueada') acao = `<p class="inv-why">🔒 ${it.tipo === 'reliquia' ? 'Ganhe esta relíquia vencendo chefões ou estudando derrotas no Diário de Campo.' : `Libere a região ${esc(REGIONS[d.regiao]?.nome || '')} para usar.`}</p>`;
  else if (it.st === 'incompativel') acao = `<p class="inv-why">Esta missão não usa ${esc(it.nome)}. ${it.tipo === 'ferramenta' ? 'As ferramentas da missão estão na barra rápida.' : 'Ela serve para outro tipo de problema.'}</p>`;
  else if (session && it.tipo === 'ferramenta' && it.st === 'disponivel') { const c = custoTroca(session); acao = `<button class="btn" data-inv-equip="${it.id}">Equipar · ${c ? `${c} ⚡ (troca depois de agir)` : 'grátis (escolha inicial)'}</button>`; }
  else if (session && it.tipo === 'reliquia' && it.st === 'disponivel') acao = `<button class="btn" data-inv-relic="${it.id}">Ativar · ${esc(d.custo)}</button>`;
  else if (it.st === 'selecionada' || it.st === 'ativa') acao = `<p class="inv-why">✔ Em uso nesta missão.</p>`;
  return `<div class="inv-dhead">${it.ico}<div><h3>${esc(it.nome)}</h3><span class="inv-st ${cls}">${rot}</span></div></div>
    <dl>${linha('Função', d.funcao)}${linha('Quando usar', d.quando)}${linha('Requisitos', d.requisitos)}${linha('Custo', d.custo)}${linha('Fórmula', d.formula)}${linha('Exemplo comentado', d.exemplo)}</dl>
    ${d.erros?.length ? `<details><summary>Erros comuns</summary><ul>${d.erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></details>` : ''}
    <div class="inv-acao">${acao}</div>`;
}

// host: elemento overlay. Devolve { close }.
export function abrirInventario(host, { session = null, aba = 'ferramentas', foco = null, onEquip, onRelic, onClose } = {}) {
  let atual = aba, sel = foco;
  const prevFocus = document.activeElement;
  host.classList.remove('hidden');
  const render = (focar = true) => {
    const lista = itens(atual, session);
    if (!lista.some((i) => i.id === sel)) sel = (lista.find((i) => i.st === 'selecionada' || i.st === 'ativa') || lista[0]).id;
    const it = lista.find((i) => i.id === sel);
    const barra = session ? session.level.tools.map((t, i) => `<button class="inv-quick ${session.s.tool === t ? 'on' : ''}" data-inv-focus="${t}" title="${esc(FERRAMENTAS[t]?.nome || t)}"><span class="kn">${i + 1}</span>${icone(t)}</button>`).join('') : '';
    host.innerHTML = `<div class="inv" role="dialog" aria-modal="true" aria-label="Inventário">
      <div class="inv-head"><h2>🎒 Inventário</h2><button class="btn secondary" data-inv-close><kbd>I</kbd>Fechar</button></div>
      <div class="inv-tabs" role="tablist">${ABAS.map(([k, t]) => `<button role="tab" class="inv-tab ${k === atual ? 'on' : ''}" aria-selected="${k === atual}" data-inv-tab="${k}">${t}</button>`).join('')}</div>
      <div class="inv-main">
        <div class="inv-grid" role="listbox" aria-label="Itens">${lista.map((i) => `<button class="inv-slot ${i.st} ${i.id === sel ? 'sel' : ''}" role="option" aria-selected="${i.id === sel}" data-inv-item="${i.id}" title="${esc(i.nome)} · ${ESTADO[i.st][0]}">${i.ico}${i.st === 'bloqueada' ? '<span class="lock">🔒</span>' : ''}${i.st === 'selecionada' || i.st === 'ativa' ? '<span class="on">✔</span>' : ''}</button>`).join('')}</div>
        <aside class="inv-detail" aria-live="polite">${detalhe(it, session)}</aside>
      </div>
      ${session ? `<div class="inv-bar"><span>Barra rápida da missão</span>${barra}</div>` : ''}
      <p class="inv-help">Setas movem a seleção · Enter escolhe · ${session ? 'a barra rápida mostra as ferramentas da missão; o botão Equipar informa o custo antes' : 'consulta não gasta nada'} · Esc ou I fecha</p>
    </div>`;
    if (focar) host.querySelector(`[data-inv-item="${CSS.escape(sel)}"]`)?.focus();
  };
  const close = () => { host.classList.add('hidden'); host.innerHTML = ''; host.removeEventListener('click', click); host.removeEventListener('keydown', key); prevFocus?.focus?.(); onClose?.(); };
  const click = (e) => {
    const b = e.target.closest('button'); if (!b) { if (e.target === host) close(); return; }
    if (b.dataset.invClose != null) return close();
    if (b.dataset.invTab) { atual = b.dataset.invTab; sel = null; return render(); }
    if (b.dataset.invItem) { sel = b.dataset.invItem; return render(); }
    if (b.dataset.invFocus) { atual = 'ferramentas'; sel = b.dataset.invFocus; return render(); }
    if (b.dataset.invEquip) { onEquip?.(b.dataset.invEquip); return render(); }
    if (b.dataset.invRelic) { onRelic?.(b.dataset.invRelic); return render(); }
  };
  const key = (e) => {
    e.stopPropagation(); // o inventário não deixa a tecla chegar ao jogo nem à fase
    if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') { e.preventDefault(); close(); return; }
    const slots = [...host.querySelectorAll('[data-inv-item]')], i = slots.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const cols = Math.max(1, Math.round(host.querySelector('.inv-grid').clientWidth / slots[0].offsetWidth));
    const j = Math.max(0, Math.min(slots.length - 1, i + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols })[e.key]));
    sel = slots[j].dataset.invItem; render();
  };
  host.addEventListener('click', click);
  host.addEventListener('keydown', key);
  render();
  return { close, refresh: () => render(false) };
}
