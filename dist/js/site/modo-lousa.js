/* Numera Academy v14 — Modo Lousa e destaque do pivô.
   1) Toda tabela no formato dos slides (pp-table) ganha o botão "▶ Ver construção da tabela": a tabela some e é
      preenchida célula por célula, na ordem em que se faz a lápis. Na Bisseção e na Falsa Posição, ao fim de cada
      linha, a ponta (a ou b) da linha seguinte que herdou o xᵢ fica marcada.
   2) Na Eliminação de Gauss, passar o mouse (ou o foco do teclado) num multiplicador mᵢₖ ou numa operação
      Eᵢ ← Eᵢ − mᵢₖ·Eₖ destaca, na matriz da mesma etapa, a linha pivô (azul), a linha alvo (âmbar) e o elemento
      que foi zerado.
   Script clássico, sem dependências; respeita "reduzir movimento" (aí a tabela aparece de uma vez). */
(function () {
  'use strict';
  const reduz = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  let timer = null, emCurso = null;

  function construir(btn) {
    const caixa = btn.closest('.pp-lousa'), tabela = caixa && caixa.querySelector('table.pp-table');
    if (!tabela || !tabela.tBodies[0]) return;
    clearTimeout(timer);
    if (emCurso && emCurso !== btn) { emCurso.disabled = false; emCurso.textContent = '▶ Ver construção da tabela'; }
    emCurso = btn;
    const cab = Array.from(tabela.querySelectorAll('thead th')).map((th) => th.textContent.trim());
    const ia = cab.indexOf('a'), ib = cab.indexOf('b'), ix = cab.findIndex((h) => /^x/.test(h));
    const linhas = Array.from(tabela.tBodies[0].rows), celulas = [];
    linhas.forEach((r, ri) => Array.from(r.cells).forEach((c, ci) => celulas.push({ c, ri, ci, ult: ci === r.cells.length - 1 })));
    tabela.querySelectorAll('.lousa-agora, .herdou').forEach((c) => c.classList.remove('lousa-agora', 'herdou'));
    celulas.forEach((o) => o.c.classList.add('lousa-oculta'));
    tabela.classList.add('lousa');
    btn.disabled = true; btn.textContent = 'Construindo a tabela…';
    const aviso = caixa.querySelector('.lousa-aviso'); if (aviso) aviso.textContent = 'Construindo a tabela, célula por célula.';
    let k = 0, ant = null;
    const passo = () => {
      if (ant) ant.classList.remove('lousa-agora');
      if (k >= celulas.length) {
        tabela.classList.remove('lousa'); btn.disabled = false; btn.textContent = '↻ Ver a construção de novo'; emCurso = null;
        if (aviso) aviso.textContent = 'Tabela completa.';
        return;
      }
      const o = celulas[k++];
      o.c.classList.remove('lousa-oculta'); o.c.classList.add('lousa-agora'); ant = o.c;
      // fim da linha: na Bisseção/Falsa Posição, marca a ponta da próxima linha que herdou o xᵢ
      if (o.ult && ia >= 0 && ib >= 0 && ix >= 0 && linhas[o.ri + 1]) {
        const x = linhas[o.ri].cells[ix].textContent.trim(), prox = linhas[o.ri + 1];
        for (const j of [ia, ib]) if (prox.cells[j] && prox.cells[j].textContent.trim() === x) { prox.cells[j].classList.add('herdou'); prox.cells[j].title = 'herdou o xᵢ da linha de cima'; }
      }
      timer = setTimeout(passo, reduz() ? 0 : o.ult ? 420 : 170);
    };
    passo();
  }

  // Gauss: mᵢₖ → linha pivô k, linha alvo i e o elemento (i, k) que vira zero
  function indices(li) { const m = /m([₀-₉])([₀-₉])/.exec(li.textContent); return m ? { i: SUBS.indexOf(m[1]), k: SUBS.indexOf(m[2]) } : null; }
  function marcar(li, ligar) {
    const etapa = li.closest('.pp-stage'), mat = etapa && etapa.querySelector('table.matrix');
    if (!mat || !mat.tBodies[0]) return;
    mat.querySelectorAll('.pivo, .alvo, .zera').forEach((x) => x.classList.remove('pivo', 'alvo', 'zera'));
    li.classList.toggle('ativo', !!ligar);
    if (!ligar) return;
    const q = indices(li); if (!q) return;
    const rows = mat.tBodies[0].rows;
    if (rows[q.k - 1]) rows[q.k - 1].classList.add('pivo');
    if (rows[q.i - 1]) { rows[q.i - 1].classList.add('alvo'); if (rows[q.i - 1].cells[q.k - 1]) rows[q.i - 1].cells[q.k - 1].classList.add('zera'); }
  }
  // Liga os itens .pp-op (mouse e foco) sempre que a página é redesenhada. Ouvintes no próprio elemento: não
  // disputam os eventos do documento com o resto do site. O botão da lousa passa pelo clique geral (data-act="lousa").
  function ligar(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    raiz.querySelectorAll('.pp-stage li.pp-op').forEach((li) => {
      if (li.dataset.ligado) return; li.dataset.ligado = '1';
      li.addEventListener('mouseenter', () => marcar(li, true)); li.addEventListener('mouseleave', () => marcar(li, false));
      li.addEventListener('focus', () => marcar(li, true)); li.addEventListener('blur', () => marcar(li, false));
    });
  }
  if (window.MutationObserver && document.getElementById) {
    const app = document.getElementById('app');
    if (app) { new MutationObserver(() => ligar(app)).observe(app, { childList: true, subtree: true }); ligar(app); }
  }
  window.NumeraLousa = { construir, marcar, ligar };
})();
