// Fase final da Usina Central (v14): três reatores, um de cada método da prova, montados na lousa.
//   Reator 1 — Bisseção com 10 iterações: digite cada xₖ e escolha a metade que fica.
//   Reator 2 — Eliminação de Gauss 4×4: digite os 6 multiplicadores (a matriz se atualiza etapa por etapa)
//              e depois x₄, x₃, x₂, x₁ por substituição regressiva.
//   Reator 3 — Newton-Raphson com 6 iterações na cúbica de Newton (x³ − 2x − 5 = 0).
// O terminal é o mesmo das casas (pergunta.js): aceita contas, f( ) e df( ) e as variáveis da etapa (a, b, x…).
// A integridade da Usina é de 5 ❤; cada resposta errada tira 1. Os reatores estabilizados ficam salvos: se
// a integridade acabar, a próxima tentativa recomeça no reator seguinte. Vencendo os três, o núcleo é liberado
// e o jogo segue para o final (a Usina explode e a Calculândia fica livre do Grande Erro).
import { cenaUsina } from './fenomeno-usina.js';
import { G } from '../jogo.js';
import { REGIONS } from '../dados/regioes-e-cidades.js';
import { abrirDuvidas } from '../interface/casas-de-duvidas.js';
import { esc, tx, avaliarConta, lerResposta, fmtTerm } from './pergunta.js';

const INTEGRIDADE = 5;
const f6 = (v) => fmtTerm(v, 6);
const SUB = '₀₁₂₃₄₅₆₇₈₉', sub = (n) => String(n).split('').map((c) => SUB[+c] ?? c).join('');

/* ---------- os três reatores (dados e contas) ---------- */
export const BISSECAO = { f: (x) => x ** 3 - 9 * x + 3, ft: 'f(x) = x³ − 9x + 3', src: 'x^3-9x+3', a: 0, b: 1, n: 10 };
// A = L·U com multiplicadores inteiros e solução inteira: as contas cabem na lousa.
export const GAUSS = { A: [[2, 1, -1, 3], [4, 3, 0, 5], [-2, 1, 8, -4], [6, 2, 1, 14]], b: [2, 6, 9, 20], solucao: [1, -1, 2, 1] };
export const NEWTON = { f: (x) => x ** 3 - 2 * x - 5, df: (x) => 3 * x * x - 2, ft: 'f(x) = x³ − 2x − 5', dft: 'f′(x) = 3x² − 2', src: 'x^3-2x-5', dsrc: '3x^2-2', x0: 4, n: 6 };

// Roteiro da Bisseção: para cada k, o ponto médio e a metade certa.
export function roteiroBissecao(B = BISSECAO) {
  let a = B.a, b = B.b; const out = [];
  for (let k = 1; k <= B.n; k++) { const x = (a + b) / 2, fa = B.f(a), fx = B.f(x), esquerda = fa * fx < 0; out.push({ k, a, b, x, fa, fx, esquerda }); if (esquerda) b = x; else a = x; }
  return out;
}
// Roteiro de Gauss sem pivoteamento (os pivôs não se anulam): etapas com multiplicadores e matrizes.
export function roteiroGauss(S = GAUSS) {
  const M = S.A.map((r, i) => [...r, S.b[i]]), n = M.length, etapas = [];
  for (let k = 0; k < n - 1; k++) {
    const mult = [];
    for (let i = k + 1; i < n; i++) { const m = M[i][k] / M[k][k]; mult.push({ i, k, m }); for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j]; }
    etapas.push({ k, mult, matriz: M.map((r) => r.map((v) => (Math.abs(v) < 1e-12 ? 0 : v))) });
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return { etapas, x, U: M };
}
export function roteiroNewton(N = NEWTON) {
  let x = N.x0; const out = [];
  for (let k = 0; k < N.n; k++) { const fx = N.f(x), dfx = N.df(x), novo = x - fx / dfx; out.push({ k, x, fx, dfx, novo }); x = novo; }
  return out;
}

/* ---------- a tela ---------- */
export function runUsinaFinal({ s: settlement }) {
  const root = document.getElementById('fase'), d = G.progress.d;
  d.usina = { reatores: 0, ...(d.usina || {}) };
  let resolve, fechado = false, vida = INTEGRIDADE, erros = 0, fim = null, modal = null, msg = '', log = [], ans = null;
  let reator = Math.min(2, d.usina.reatores || 0);
  const promise = new Promise((r) => { resolve = r; }), $ = (id) => root.querySelector('#' + id);
  const bis = roteiroBissecao(), gau = roteiroGauss(), nwt = roteiroNewton();
  // estado de cada reator
  let passo = 0, lado = false;            // bisseção: iteração atual (0..9) e se falta escolher a metade
  let gPasso = 0;                          // gauss: índice no roteiro de pedidos
  const pedidosGauss = [...gau.etapas.flatMap((e) => e.mult.map((m) => ({ tipo: 'm', ...m, etapa: e.k }))), ...[3, 2, 1, 0].map((i) => ({ tipo: 'x', i }))];
  let nPasso = 0;                          // newton: iteração atual (0..5)
  G.audio?.beginTactical?.(); root.classList.remove('hidden');
  if (G.debug) G.usinaFinal = { get reator() { return reator; }, get passo() { return [passo, gPasso, nPasso][reator]; }, get lado() { return lado; }, esperado };

  const NOMES = ['Bisseção · 10 iterações', 'Eliminação de Gauss · sistema 4×4', 'Newton-Raphson · 6 iterações'];
  function esperado() {
    if (fim) return null;
    if (reator === 0) return lado ? (bis[passo].esquerda ? 'esquerda' : 'direita') : bis[passo].x;
    if (reator === 1) { const p = pedidosGauss[gPasso]; return p.tipo === 'm' ? p.m : gau.x[p.i]; }
    return nwt[nPasso].novo;
  }
  function rotuloPedido() {
    if (reator === 0) return lado ? `Qual metade fica para a ${passo + 2 <= 10 ? `${passo + 2}ª iteração` : 'resposta'}?` : `x${sub(passo + 1)} =`;
    if (reator === 1) { const p = pedidosGauss[gPasso]; return p.tipo === 'm' ? `m${sub(`${p.i + 1}${p.k + 1}`)} =` : `x${sub(p.i + 1)} =`; }
    return `x${sub(nPasso + 1)} =`;
  }
  function varsDoPasso() {
    if (reator === 0) { const r = bis[passo]; return lado ? { a: r.a, b: r.b, x: r.x } : { a: r.a, b: r.b }; }
    if (reator === 2) { const r = nwt[nPasso]; return { x: r.x }; }
    return {};
  }
  const funcoes = () => (reator === 0 ? { f: BISSECAO.f } : reator === 2 ? { f: NEWTON.f, df: NEWTON.df } : {});
  function enunciado() {
    if (reator === 0) return `Reator 1 — estabilize a temperatura: ache o zero de ${BISSECAO.ft} em [0; 1] pela Bisseção, com 10 iterações. Em cada iteração, digite xₖ = (aₖ + bₖ)/2 e escolha a metade em que f troca de sinal (Teorema 1). Use 6 casas decimais.`;
    if (reator === 1) return `Reator 2 — equilibre as quatro turbinas: resolva o sistema [A|B] abaixo por Eliminação de Gauss (os pivôs não se anulam, então não é preciso trocar linhas). Digite os multiplicadores mᵢₖ = aᵢₖ/aₖₖ de cada etapa e depois x₄, x₃, x₂ e x₁ por substituição regressiva.`;
    return `Reator 3 — o núcleo: ${NEWTON.ft} (a equação que o próprio Newton resolveu em 1669). Com ${NEWTON.dft} e x₀ = 4, faça 6 iterações de Newton-Raphson, xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ). Use 6 casas decimais.`;
  }
  function lousa() {
    if (reator === 0) {
      const linhas = bis.slice(0, passo + 1).map((r, i) => {
        const feito = i < passo || (i === passo && lado), escolhido = i < passo;
        return `<tr class="${i === passo ? 'on' : ''}"><td>${r.k}</td><td>${f6(r.a)}</td><td>${f6(r.b)}</td><td>${feito ? f6(r.x) : '?'}</td><td>${f6(r.fa)}</td><td>${feito ? f6(r.fx) : ''}</td><td>${escolhido ? (r.esquerda ? `[${f6(r.a)}; ${f6(r.x)}]` : `[${f6(r.x)}; ${f6(r.b)}]`) : ''}</td></tr>`;
      }).join('');
      return `<div class="pq-tabela uf-lousa" tabindex="0" role="region" aria-label="Lousa da Bisseção"><table><thead><tr><th scope="col">k</th><th scope="col">aₖ</th><th scope="col">bₖ</th><th scope="col">xₖ</th><th scope="col">f(aₖ)</th><th scope="col">f(xₖ)</th><th scope="col">próximo intervalo</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
    if (reator === 1) {
      const p = pedidosGauss[gPasso], n = 4;
      // matriz mostrada: a da última etapa concluída
      const etapasFeitas = gau.etapas.filter((e) => pedidosGauss.findIndex((q) => q.tipo === 'm' && q.etapa === e.k && q.i === e.mult[e.mult.length - 1].i) < gPasso);
      const M = etapasFeitas.length ? etapasFeitas[etapasFeitas.length - 1].matriz : GAUSS.A.map((r, i) => [...r, GAUSS.b[i]]);
      const piv = p && p.tipo === 'm' ? p.k : -1, alvo = p && p.tipo === 'm' ? p.i : p ? p.i : -1;
      const sx = gau.x.map((v, i) => (pedidosGauss.findIndex((q) => q.tipo === 'x' && q.i === i) < gPasso ? f6(v) : '?'));
      const mults = pedidosGauss.filter((q, j) => q.tipo === 'm' && j < gPasso).map((q) => `m${sub(`${q.i + 1}${q.k + 1}`)} = ${f6(q.m)}`);
      return `<div class="uf-matriz" role="region" aria-label="Matriz aumentada"><table><tbody>${M.map((r, i) => `<tr class="${i === piv ? 'pivo' : ''} ${i === alvo ? 'alvo' : ''}"><th scope="row">E${sub(i + 1)}</th>${r.map((v, j) => `<td class="${j === n ? 'rhs' : ''} ${i === alvo && j === piv ? 'zera' : ''}">${f6(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <p class="uf-legenda">${p && p.tipo === 'm' ? `Etapa ${p.k + 1}: <span class="pivo">linha pivô E${sub(p.k + 1)}</span> · <span class="alvo">linha alvo E${sub(p.i + 1)}</span> · E${sub(p.i + 1)} ← E${sub(p.i + 1)} − m${sub(`${p.i + 1}${p.k + 1}`)}·E${sub(p.k + 1)}` : 'Matriz triangular superior: substituição regressiva, de baixo para cima.'}</p>
        <p class="uf-legenda">${mults.length ? mults.join(' · ') : 'Nenhum multiplicador ainda.'}</p><p class="uf-legenda">x = (${sx.join('; ')})</p></div>`;
    }
    const linhas = nwt.slice(0, nPasso + 1).map((r, i) => `<tr class="${i === nPasso ? 'on' : ''}"><td>${r.k}</td><td>${f6(r.x)}</td><td>${f6(r.fx)}</td><td>${f6(r.dfx)}</td><td>${i < nPasso ? f6(r.novo) : '?'}</td></tr>`).join('');
    return `<div class="pq-tabela uf-lousa" tabindex="0" role="region" aria-label="Lousa de Newton-Raphson"><table><thead><tr><th scope="col">k</th><th scope="col">xₖ</th><th scope="col">f(xₖ)</th><th scope="col">f′(xₖ)</th><th scope="col">xₖ₊₁</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }
  function areaResposta() {
    if (fim) return '';
    if (reator === 0 && lado) {
      const r = bis[passo];
      return `<div class="uf-lados" role="group" aria-label="Escolha a metade"><p>f(a${sub(r.k)}) = ${f6(r.fa)} e f(x${sub(r.k)}) = ${f6(r.fx)}. Onde f troca de sinal?</p>
        <button class="pq-alt" data-lado="esquerda"><b>A</b><span>[a${sub(r.k)}; x${sub(r.k)}] = [${f6(r.a)}; ${f6(r.x)}]</span></button>
        <button class="pq-alt" data-lado="direita"><b>B</b><span>[x${sub(r.k)}; b${sub(r.k)}] = [${f6(r.x)}; ${f6(r.b)}]</span></button></div>`;
    }
    const vars = Object.keys(varsDoPasso()), fns = Object.keys(funcoes());
    return `<div class="pq-term" role="group" aria-labelledby="pq-term-t">
      <div class="pq-term-topo"><span id="pq-term-t">Terminal da Usina</span><span class="uf-pedido">${rotuloPedido()}</span></div>
      <div class="pq-term-log" id="pq-log" aria-live="polite">${log.map((l) => `<div class="${l.c}">${l.h}</div>`).join('') || `<div class="dim">Digite o valor ou uma conta (Enter calcula, Enter de novo envia).${vars.length ? ` Variáveis: ${vars.join(', ')}.` : ''}${fns.length ? ` Funções: ${fns.map((n) => `${n}( )`).join(', ')}.` : ''} ans = último resultado.</div>`}</div>
      <form class="pq-term-linha" id="pq-form" autocomplete="off"><label for="pq-in">${esc(rotuloPedido())}</label><input id="pq-in" type="text" spellcheck="false" autocapitalize="off"><button class="btn" type="submit" id="pq-enviar">Enviar</button></form>
    </div>`;
  }
  function fenomeno() {
    if (reator === 0) { const k = Math.min(10, passo + (lado ? 1 : 0)), x = k ? bis[k - 1].x : BISSECAO.a; return cenaUsina(0, [x], Math.abs(BISSECAO.f(x)), k); }
    if (reator === 2) { const k = Math.min(6, nPasso), x = k ? nwt[k - 1].novo : NEWTON.x0; return cenaUsina(2, [x], Math.abs(NEWTON.f(x)), k); }
    const u = [0, 0, 0, 0]; for (const p of pedidosGauss.slice(0, gPasso)) if (p.tipo === 'x') u[p.i] = gau.x[p.i];
    const r = Math.max(...GAUSS.A.map((a, i) => Math.abs(a.reduce((v, x, j) => v + x * u[j], 0) - GAUSS.b[i])));
    return cenaUsina(1, u, r, gPasso);
  }
  function desenhar() {
    const estados = [0, 1, 2].map((i) => (i < (d.usina.reatores || 0) || (fim?.vitoria) ? 'ok' : i === reator ? 'agora' : 'fechado'));
    root.innerHTML = `<section class="fase-box pq pq-chefe-final uf" role="dialog" aria-modal="true" aria-labelledby="pq-t">
      <header class="pq-topo"><div class="pq-id"><small>${esc(REGIONS[settlement.regiao]?.nome || 'Usina Central')} · Final: o Grande Erro</small><h2 id="pq-t">Reator ${reator + 1} de 3 — ${NOMES[reator]}</h2></div>
        <span class="pq-selo pq-selo-final" title="Fase final">☢ Final</span><button class="btn" data-pq="sair" id="fz-quit">Sair</button></header>
      <div class="uf-status"><ol class="uf-reatores" aria-label="Reatores">${estados.map((e, i) => `<li class="${e}">${e === 'ok' ? '✅' : e === 'agora' ? '⚡' : '🔒'} Reator ${i + 1}<small>${['Bisseção', 'Gauss 4×4', 'Newton'][i]}</small></li>`).join('')}</ol>
        <span class="pq-vidas" aria-label="Integridade da Usina: ${vida} de ${INTEGRIDADE}">${'❤️'.repeat(Math.max(0, vida))}${'🖤'.repeat(INTEGRIDADE - Math.max(0, vida))}</span>
        <button class="btn" data-pq="conceito">📘 Conceito <small>grátis</small></button></div>
      <div class="pq-pergunta"><p class="pq-enunciado">${tx(enunciado())}</p></div>
      ${fenomeno()}
      ${lousa()}
      ${areaResposta()}
      <div id="pq-msg" class="pq-msg ${msg ? msg.tipo : ''}" role="status" aria-live="polite">${msg ? msg.html : ''}</div>
      ${fim ? `<div class="pq-acoes">${fim.vitoria ? `<span class="pq-estrelas" aria-label="${fim.estrelas} de 3 estrelas">${'⭐'.repeat(fim.estrelas)}${'☆'.repeat(3 - fim.estrelas)}</span>` : ''}<button class="btn" data-pq="voltar" id="fz-back">${fim.vitoria ? 'Liberar o núcleo ☢' : 'Voltar ao mapa'}</button></div>` : ''}
      <div id="pq-overlay" class="tq-overlay hidden"></div>
    </section>`;
    const lg = $('pq-log'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  function focoPadrao() { requestAnimationFrame(() => root.querySelector(fim ? '#fz-back' : reator === 0 && lado ? '[data-lado]' : '#pq-in')?.focus()); }
  function linha(c, h) { log.push({ c, h }); if (log.length > 8) log = log.slice(-8); }
  function atualizarLog(valor) {
    const el = $('pq-log'), inp = $('pq-in');
    if (el) { el.innerHTML = log.map((l) => `<div class="${l.c}">${l.h}</div>`).join(''); el.scrollTop = el.scrollHeight; }
    if (inp && valor != null) { inp.value = valor; inp.select(); }
  }
  function errou(texto) {
    erros++; vida--; G.audio?.sfx?.('toc');
    if (vida <= 0) { fim = { vitoria: false }; G.audio?.sfx?.('derrota'); msg = { tipo: 'no', html: `<b>A Usina superaqueceu.</b> ${texto} Os reatores já estabilizados continuam estáveis: na próxima tentativa você recomeça no Reator ${reator + 1}.` }; return; }
    msg = { tipo: 'no', html: `<b>Ainda não.</b> ${texto} Integridade: ${vida} de ${INTEGRIDADE}.` };
  }
  function concluirReator() {
    d.usina.reatores = Math.max(d.usina.reatores || 0, reator + 1); G.progress.save();
    G.audio?.sfx?.('vitoria');
    if (reator === 2) { const est = erros <= 1 ? 3 : erros <= 3 ? 2 : 1; fim = { vitoria: true, estrelas: est }; msg = { tipo: 'ok', html: `<b>Os três reatores estão estáveis!</b> x₆ = ${f6(nwt[5].novo)} é a raiz de Newton (2,094551…). O núcleo do Grande Erro ficou exposto: libere-o.` }; return; }
    msg = { tipo: 'ok', html: reator === 0 ? `<b>Reator 1 estável!</b> x₁₀ = ${f6(bis[9].x)}. A raiz de ${BISSECAO.ft} em [0; 1] é ≈ 0,337609: depois de 10 iterações o erro é menor que 1/2¹⁰ ≈ 0,001.` : `<b>Reator 2 estável!</b> X = (${gau.x.map((v) => f6(v)).join('; ')}). As turbinas giram em equilíbrio.` };
    reator++; log = []; ans = null;
  }
  function confere(v, alvo) { return Number.isFinite(v) && Math.abs(v - alvo) <= 5.1e-6 * Math.max(1, Math.abs(alvo)); }
  function enviar(texto) {
    const t = String(texto || '').trim();
    if (!t || fim) return;
    let v;
    try { v = lerResposta(t, { funcoes: funcoes(), ans, vars: varsDoPasso() }); } catch (e) { linha('erro', `${esc(rotuloPedido())} ${esc(t)}<br>⚠ ${esc(e.message)}`); atualizarLog(); return; }
    if (Array.isArray(v)) { linha('erro', `${esc(t)}<br>⚠ Aqui a resposta é um número só.`); atualizarLog(); return; }
    const literal = /^[−-]?\d+([.,]\d+)?$/.test(t);
    if (!literal) { ans = v; linha('conta', `${esc(t)}<br>= <b>${esc(fmtTerm(v, 8))}</b>`); atualizarLog(fmtTerm(v, 8)); return; }
    const alvo = esperado(), ok = confere(v, alvo);
    linha(ok ? 'certo' : 'errado', `${esc(rotuloPedido())} ${esc(t)} ${ok ? '✔' : '✘'}`);
    msg = '';
    if (!ok) {
      if (reator === 0) errou(`x${sub(passo + 1)} é o ponto médio de [a${sub(passo + 1)}; b${sub(passo + 1)}]: (${f6(bis[passo].a)} + ${f6(bis[passo].b)})/2.`);
      else if (reator === 1) { const p = pedidosGauss[gPasso]; errou(p.tipo === 'm' ? `m${sub(`${p.i + 1}${p.k + 1}`)} = a${sub(`${p.i + 1}${p.k + 1}`)}/a${sub(`${p.k + 1}${p.k + 1}`)}, com os valores da matriz da etapa ${p.k + 1} (a que está na lousa).` : `Isole x${sub(p.i + 1)} na equação E${sub(p.i + 1)} da matriz triangular e use os x já encontrados.`); }
      else errou(`x${sub(nPasso + 1)} = x${sub(nPasso)} − f(x${sub(nPasso)})/f′(x${sub(nPasso)}) = ${f6(nwt[nPasso].x)} − (${f6(nwt[nPasso].fx)})/(${f6(nwt[nPasso].dfx)}).`);
    } else {
      G.audio?.sfx?.('acerto');
      if (reator === 0) lado = true;
      else if (reator === 1) { gPasso++; if (gPasso >= pedidosGauss.length) concluirReator(); }
      else { nPasso++; if (nPasso >= NEWTON.n) concluirReator(); }
    }
    ans = ok ? v : ans;
    desenhar(); focoPadrao();
  }
  function escolherLado(qual) {
    if (fim || reator !== 0 || !lado) return;
    const r = bis[passo], certo = (r.esquerda ? 'esquerda' : 'direita') === qual;
    if (!certo) { errou(`f(a${sub(r.k)})·f(x${sub(r.k)}) ${r.esquerda ? '< 0: a troca de sinal está em [aₖ; xₖ]' : '> 0: a troca de sinal está em [xₖ; bₖ]'}.`); desenhar(); focoPadrao(); return; }
    G.audio?.sfx?.('acerto'); msg = ''; lado = false; passo++;
    if (passo >= BISSECAO.n) { passo = BISSECAO.n - 1; concluirReator(); }
    desenhar(); focoPadrao();
  }
  const resultado = () => ({ vitoria: !!fim?.vitoria, estrelas: fim?.vitoria ? fim.estrelas : 0, erroFinal: 0, iteracoes: erros, bateriaRestante: vida, dicasUsadas: 0, xp: fim?.vitoria ? 40 * fim.estrelas : 0, abandonou: !fim });
  function fechar(r) { if (fechado) return; fechado = true; modal?.close?.(); root.removeEventListener('click', clique); root.removeEventListener('submit', envio); window.removeEventListener('keydown', tecla, true); root.classList.add('hidden'); root.innerHTML = ''; G.audio?.endTactical?.(); if (G.debug) G.usinaFinal = null; resolve(r); }
  function clique(e) {
    const l = e.target.closest('[data-lado]'); if (l) { escolherLado(l.dataset.lado); return; }
    const b = e.target.closest('[data-pq]'); if (!b || b.disabled) return;
    if (b.dataset.pq === 'sair') fechar({ vitoria: false, abandonou: true, estrelas: 0 });
    else if (b.dataset.pq === 'voltar') fechar(resultado());
    else if (b.dataset.pq === 'conceito') { const close = abrirDuvidas($('pq-overlay'), reator === 1 ? 3 : 2, { foco: ['bissecao', 'gauss', 'newton'][reator], onClose: () => { modal = null; } }); modal = { close }; }
  }
  function envio(e) { if (e.target.id !== 'pq-form') return; e.preventDefault(); enviar($('pq-in')?.value); }
  function tecla(e) {
    if (fechado || modal || !$('pq-t')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fim ? fechar(resultado()) : fechar({ vitoria: false, abandonou: true, estrelas: 0 }); return; }
    if (e.target?.tagName === 'INPUT') { e.stopPropagation(); return; }
    const k = e.key.toLowerCase();
    if (reator === 0 && lado && !fim && (k === 'a' || k === 'b' || k === '1' || k === '2')) { e.preventDefault(); e.stopPropagation(); escolherLado(k === 'a' || k === '1' ? 'esquerda' : 'direita'); }
  }
  root.addEventListener('click', clique);
  root.addEventListener('submit', envio);
  window.addEventListener('keydown', tecla, true);
  if (reator > 0) msg = { tipo: 'dica', html: `Reatores já estáveis: ${reator}. Continuando no Reator ${reator + 1}.` };
  desenhar(); focoPadrao();
  return promise;
}
