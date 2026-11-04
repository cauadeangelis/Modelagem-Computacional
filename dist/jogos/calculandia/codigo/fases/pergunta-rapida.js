// Casa verde (nível Fácil): uma pergunta de múltipla escolha, direto ao ponto.
// As perguntas vêm do banco de questões do site (dados/banco-de-questoes.js, gerado de
// banco-de-questoes/questoes.sql): as do método da cidade, de preferência as rápidas. Se o banco não
// tiver pergunta para o método (Spline, Ponto Fixo) ou não carregar, usa as perguntas de múltipla
// escolha de metodos-numericos.js.
// No topo ficam os dispositivos: as sementes dos baús pagam a Dica e a Lupa; o Conceito e o
// Inventário são consulta grátis; com uma relíquia guardada, o Escudo perdoa o primeiro erro.
// Estrelas: 3 de primeira e sem ajuda paga; −1 por ajuda paga; −1 por erro (o Escudo absorve um).
// Duas respostas erradas encerram a tentativa.
import { G } from '../jogo.js';
import { REGIONS } from '../dados/regioes-e-cidades.js';
import { FERRAMENTAS } from '../dados/conhecimento.js';
import { abrirDuvidas } from '../interface/casas-de-duvidas.js';
import { abrirInventario } from '../interface/inventario.js';
import { METODOS } from './metodos-numericos.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// texto com expoentes: e^(0,226t) → e<sup>0,226t</sup> (depois de escapar o HTML)
const tx = (t) => esc(t).replace(/\^\(([^)]*)\)/g, '<sup>$1</sup>').replace(/\^([−-]?[\w,]+)/g, '<sup>$1</sup>');
const VISTAS = 'calculandia-perguntas-vistas-v1';
// Temas do banco que valem para cada método além dos marcados com a região do próprio método.
const EXTRA = { cancelamento: ['ponto-flutuante'], overflow: ['ponto-flutuante'] };
const CUSTO = { dica: 1, lupa: 2 };

function lerVistas() { try { const d = JSON.parse(localStorage.getItem(VISTAS) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
function salvarVista(metodo, id) { try { const d = lerVistas(); d[metodo] = [id, ...(Array.isArray(d[metodo]) ? d[metodo] : [])].slice(0, 12); localStorage.setItem(VISTAS, JSON.stringify(d)); } catch (e) { /* sem armazenamento: só não evita repetir */ } }

// Perguntas do banco para um método da Calculândia (exportada para os testes).
export function perguntasDoBanco(metodo, banco = globalThis.NumeraBanco) {
  if (!banco || !Array.isArray(banco.questoes)) return [];
  const temas = new Set(banco.temas.filter((t) => t.regiao === metodo || (EXTRA[metodo] || []).includes(t.id)).map((t) => t.id));
  const boas = banco.questoes.filter((q) => temas.has(q.tema) && q.tipo !== 'programa' && q.alternativas && q.alternativas.length === 4);
  const faceis = boas.filter((q) => q.rapida || q.dificuldade === 1);
  return faceis.length ? faceis : boas;
}

function escolher(metodo) {
  const banco = globalThis.NumeraBanco, lista = perguntasDoBanco(metodo, banco);
  if (lista.length) {
    const vistas = lerVistas()[metodo] || [], novas = lista.filter((q) => !vistas.includes(q.id)), pool = novas.length ? novas : lista;
    const q = pool[Math.floor(Math.random() * pool.length)], L = banco.listas.find((l) => l.id === q.lista);
    salvarVista(metodo, q.id);
    return { id: q.id, fonte: `${L ? L.titulo : 'Banco de questões'}${q.numero ? ' · ' + q.numero : ''}`, enunciado: q.enunciado, resposta: q.resposta, observacao: q.observacao || '', alternativas: q.alternativas.map((a) => ({ texto: a.texto, correta: !!a.correta, explicacao: a.explicacao || '' })) };
  }
  // reserva: as perguntas de múltipla escolha geradas para o método
  const gerador = METODOS[metodo];
  if (!gerador) return null;
  const passos = gerador('F').passos, p = passos[Math.floor(Math.random() * passos.length)];
  return { id: null, fonte: 'Pergunta da cidade', enunciado: `${p.enunciado ? p.enunciado + ' — ' : ''}${p.texto}`, resposta: p.opcoes[p.correta], observacao: '', alternativas: p.opcoes.map((t, i) => ({ texto: String(t), correta: i === p.correta, explicacao: i === p.correta ? '' : p.explica || '' })) };
}

export function temPerguntaRapida(metodo) { return !!METODOS[metodo] || perguntasDoBanco(metodo).length > 0; }

export function runPergunta({ s: settlement, freeHint = false }) {
  const root = document.getElementById('fase'), metodo = settlement.metodo, regiao = settlement.regiao;
  const q = escolher(metodo), ferramenta = FERRAMENTAS[metodo] || null, temReliquia = (G.progress.d.rpg?.relics || []).length > 0;
  let resolve, fechado = false, erros = 0, pagas = 0, dicaGratis = !!freeHint, escudo = false, escudoUsado = false, fim = null, modal = null, msg = '';
  const riscadas = new Set(), erradas = new Set(), usados = new Set();
  const promise = new Promise((r) => { resolve = r; });
  if (!q) { resolve({ vitoria: false, abandonou: true, estrelas: 0 }); return promise; }
  const $ = (id) => root.querySelector('#' + id);
  G.audio?.beginTactical?.(); root.classList.remove('hidden');

  const estrelas = () => Math.max(1, 3 - Math.min(1, pagas) - Math.max(0, erros - (escudoUsado ? 1 : 0)));
  function disp(id, rotulo, custo, titulo, extra = '') {
    const preco = custo === 0 ? '<small>grátis</small>' : custo ? `<small>${custo} 🌰</small>` : '';
    return `<button class="btn ${usados.has(id) ? 'usado' : ''}" data-pq="${id}" title="${esc(titulo)}" ${fim ? 'disabled' : ''} ${extra}>${rotulo}${preco}</button>`;
  }
  function desenhar() {
    const sementes = G.progress.seeds;
    root.innerHTML = `<section class="fase-box pq" role="dialog" aria-modal="true" aria-labelledby="pq-t">
      <header class="pq-topo"><div class="pq-id"><small>${esc(REGIONS[regiao]?.nome || '')} · ${esc(settlement.nome)}</small><h2 id="pq-t">${esc(settlement.metodoNome || ferramenta?.nome || 'Pergunta')}</h2></div>
        <span class="pq-verde" title="Casa verde: nível Fácil">● Fácil</span><button class="btn" data-pq="sair" id="fz-quit">Sair</button></header>
      <div class="pq-disp" role="toolbar" aria-label="Dispositivos">
        <span class="tq-sementes" title="Sementes: você ganha nos baús e ao vencer fases">🌰 <b>${sementes}</b></span>
        ${disp('conceito', '📘 Conceito', 0, 'Casa de Dúvidas da região: ideia, fórmula e erros comuns')}
        ${disp('dica', '💡 Dica', dicaGratis ? 0 : CUSTO.dica, 'Mostra a fórmula e a ideia do método (tira 1 estrela)', usados.has('dica') ? 'disabled' : '')}
        ${disp('lupa', '🔍 Lupa', CUSTO.lupa, 'Risca uma alternativa errada (tira 1 estrela)', riscadas.size || usados.has('lupa') ? 'disabled' : '')}
        ${temReliquia ? disp('escudo', `🛡️ Escudo${escudo ? ' ativo' : ''}`, null, 'Relíquia: o primeiro erro não tira estrela', escudo ? 'disabled' : '') : ''}
        ${disp('inventario', '🎒 Inventário', null, 'Ferramentas, cartas e relíquias')}
      </div>
      <div class="pq-pergunta"><span class="pq-fonte">${esc(q.fonte)}</span><p class="pq-enunciado">${tx(q.enunciado)}</p></div>
      <div class="pq-alts" role="group" aria-label="Alternativas">${q.alternativas.map((a, i) => {
        const est = fim ? (a.correta ? 'certa' : erradas.has(i) ? 'errada' : riscadas.has(i) ? 'riscada' : '') : erradas.has(i) ? 'errada' : riscadas.has(i) ? 'riscada' : '';
        return `<button class="pq-alt ${est}" data-alt="${i}" ${fim || erradas.has(i) || riscadas.has(i) ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${tx(a.texto)}</span></button>`;
      }).join('')}</div>
      <div id="pq-msg" class="pq-msg ${msg ? msg.tipo : ''}" role="status" aria-live="polite">${msg ? msg.html : ''}</div>
      ${fim ? `<div class="pq-acoes">${fim.vitoria ? `<span class="pq-estrelas" aria-label="${fim.estrelas} de 3 estrelas">${'⭐'.repeat(fim.estrelas)}${'☆'.repeat(3 - fim.estrelas)}</span>` : ''}<button class="btn" data-pq="voltar" id="fz-back">Voltar ao mapa</button></div>` : ''}
      <div id="pq-overlay" class="tq-overlay hidden"></div>
    </section>`;
  }
  function focar(sel) { requestAnimationFrame(() => root.querySelector(sel)?.focus?.()); }
  function pagar(qtd) { if (qtd === 0) return true; if (G.progress.spendSeeds(qtd)) { G.audio?.sfx?.('semente'); return true; } msg = { tipo: 'no', html: `Faltam sementes (${qtd} 🌰). Abra os baús espalhados pelo mapa para ganhar mais.` }; return false; }
  function responder(i) {
    if (fim || erradas.has(i) || riscadas.has(i)) return;
    const a = q.alternativas[i];
    if (a.correta) {
      fim = { vitoria: true, estrelas: estrelas() }; G.audio?.sfx?.('vitoria');
      msg = { tipo: 'ok', html: `<b>Certo!</b> A resposta é ${tx(q.resposta)}.${q.observacao ? ` <br><small>${esc(q.observacao)}</small>` : ''}` };
    } else {
      erradas.add(i); erros++; if (escudo && !escudoUsado) escudoUsado = true;
      if (erros >= 2) { fim = { vitoria: false, estrelas: 0 }; G.audio?.sfx?.('derrota'); msg = { tipo: 'no', html: `<b>Não foi dessa vez.</b> ${esc(a.explicacao)} A resposta certa é <b>${tx(q.resposta)}</b>.` }; }
      else { G.audio?.sfx?.('toc'); msg = { tipo: 'no', html: `<b>Ainda não.</b> ${esc(a.explicacao)} ${escudoUsado ? 'O Escudo segurou esta: a estrela continua. ' : ''}Você tem mais uma tentativa.` }; }
    }
    desenhar(); focar(fim ? '#fz-back' : '.pq-alt:not([disabled])');
  }
  function acao(id) {
    if (id === 'sair') { fechar({ vitoria: false, abandonou: true, estrelas: 0 }); return; }
    if (id === 'voltar') { fechar(resultado()); return; }
    if (id === 'conceito') { const close = abrirDuvidas($('pq-overlay'), regiao, { foco: metodo, onClose: () => { modal = null; } }); modal = { close }; return; }
    if (id === 'inventario') { const r = abrirInventario($('pq-overlay'), { aba: 'cartas', onClose: () => { modal = null; } }); modal = r; return; }
    if (id === 'dica' && !usados.has('dica')) {
      const custo = dicaGratis ? 0 : CUSTO.dica;
      if (pagar(custo)) { usados.add('dica'); if (custo) pagas++; dicaGratis = false; G.audio?.sfx?.('dica'); msg = { tipo: 'dica', html: ferramenta ? `<b>💡 ${esc(ferramenta.nome)}:</b> ${esc(ferramenta.funcao)} <br><b>Fórmula:</b> ${esc(ferramenta.formula)}` : 'Releia o enunciado com calma e elimine as alternativas absurdas.' }; }
    }
    if (id === 'lupa' && !riscadas.size) {
      if (pagar(CUSTO.lupa)) { const erradasLivres = q.alternativas.map((a, i) => i).filter((i) => !q.alternativas[i].correta && !erradas.has(i)); const r = erradasLivres[Math.floor(Math.random() * erradasLivres.length)]; if (r != null) riscadas.add(r); usados.add('lupa'); pagas++; msg = { tipo: 'dica', html: `🔍 A Lupa riscou a alternativa ${'ABCD'[r]}.` }; }
    }
    if (id === 'escudo' && temReliquia && !escudo) { escudo = true; usados.add('escudo'); msg = { tipo: 'dica', html: '🛡️ Escudo ativo: se errar uma vez, a estrela fica.' }; }
    desenhar(); focar(`[data-pq="${id}"]:not([disabled])`);
  }
  const resultado = () => ({ vitoria: !!fim?.vitoria, estrelas: fim?.vitoria ? fim.estrelas : 0, erroFinal: 0, iteracoes: erros + (fim?.vitoria ? 1 : 0), bateriaRestante: 0, dicasUsadas: pagas, xp: fim?.vitoria ? 10 * fim.estrelas : 0, abandonou: !fim, pergunta: q.id });
  function fechar(r) { if (fechado) return; fechado = true; modal?.close?.(); root.removeEventListener('click', clique); window.removeEventListener('keydown', tecla, true); root.classList.add('hidden'); root.innerHTML = ''; G.audio?.endTactical?.(); resolve(r); }
  function clique(e) { const alt = e.target.closest('[data-alt]'); if (alt && !alt.disabled) { responder(Number(alt.dataset.alt)); return; } const b = e.target.closest('[data-pq]'); if (b && !b.disabled) acao(b.dataset.pq); }
  function tecla(e) {
    if (fechado || modal || !$('pq-t')) return;
    const t = e.target?.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    const k = e.key.toLowerCase(), i = '1234'.includes(k) ? '1234'.indexOf(k) : 'abcd'.includes(k) && k.length === 1 ? 'abcd'.indexOf(k) : -1;
    if (i >= 0 && !fim) { e.preventDefault(); e.stopPropagation(); responder(i); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fim ? fechar(resultado()) : fechar({ vitoria: false, abandonou: true, estrelas: 0 }); return; }
    if (fim && e.key === 'Enter' && document.activeElement?.id !== 'fz-back') { e.preventDefault(); fechar(resultado()); }
  }
  root.addEventListener('click', clique);
  window.addEventListener('keydown', tecla, true);
  desenhar(); focar('.pq-alt');
  return promise;
}
