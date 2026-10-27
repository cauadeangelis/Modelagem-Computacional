/* Numera Academy — teclado científico do Terminal.
   Expoentes aparecem elevados (x², x¹⁰, e⁻ˣ) sem precisar digitar "^".
   Arquivo independente: carregue DEPOIS de app.js. Não muda a matemática: só traduz a escrita bonita antes de chamar o motor. */
(function () {
  'use strict';
  const M = window.NumeraMath;
  if (!M) return;

  /* ---------- 1. Tradução entre escrita bonita e sintaxe do motor ---------- */
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '−': '⁻', '(': '⁽', ')': '⁾', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ', 'e': 'ᵉ', '.': '˙', ',': '˙', '/': 'ᐟ' };
  const UNSUP = {};
  for (const [k, v] of Object.entries(SUP)) if (!(v in UNSUP)) UNSUP[v] = k === '−' ? '-' : k === ',' ? '.' : k;
  const SUP_RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ˣʸᶻᵉ˙ᐟ]+/g;
  const isSup = ch => ch in UNSUP;
  const sup = text => [...text.replace(/\s+/g, '')].map(ch => SUP[ch] ?? ch).join('');
  const canSup = text => /^[0-9xyze+\-−\/.,()\s]+$/.test(text) && balanced(text);
  function balanced(text) { let d = 0; for (const ch of text) { if (ch === '(') d++; else if (ch === ')' && --d < 0) return false; } return d === 0; }

  // Escrita bonita -> sintaxe aceita pelo motor (x² -> x^(2), √( -> sqrt(, π -> pi).
  function toEngine(src) {
    return String(src)
      .replace(SUP_RUN, run => '^(' + [...run].map(ch => UNSUP[ch]).join('') + ')')
      .replace(/√\s*\(/g, 'sqrt(')
      .replace(/√\s*(\d+(?:[.,]\d+)?|[a-zA-Zπ])/g, 'sqrt($1)')
      .replace(/π/g, ' pi ')
      .replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  }

  // Sintaxe do motor -> escrita bonita. Só converte o que ida e volta preserva exatamente.
  function toPretty(src) {
    let s = String(src);
    let out = '', i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '^' && i > 0 && !isSup(out[out.length - 1] || '')) {
        let j = i + 1; while (s[j] === ' ') j++;
        if (s[j] === '(') {
          let d = 0, k = j;
          for (; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')' && --d === 0) break; }
          const inner = s.slice(j + 1, k);
          if (k < s.length && inner.trim() && canSup(inner)) { out += sup(inner); i = k + 1; continue; }
        } else {
          const m = /^[+\-−]?(?:\d+(?:[.,]\d+)?(?![\d.,])|[xyze](?![a-zA-Z0-9(]))/.exec(s.slice(j));
          if (m) { out += sup(m[0]); i = j + m[0].length; continue; }
        }
      }
      out += ch; i++;
    }
    return out
      .replace(/exp\(([^()]*)\)/g, (all, arg) => (arg.trim() && canSup(arg) ? 'e' + sup(arg) : all))
      .replace(/sqrt\(/g, '√(')
      .replace(/(^|[^a-zA-Z])pi(?![a-zA-Z])/g, '$1π') // sem lookbehind: funciona no Safari antigo (< 16.4)
      .replace(/\*/g, '·');
  }

  // O motor passa a aceitar a escrita bonita em qualquer ponto do app (terminal, gráfico, verificação).
  const orig = { parseFunction: M.parseFunction, parseSystem: M.parseSystem, smartRoot: M.smartRoot };
  M.parseFunction = src => orig.parseFunction(toEngine(src));
  M.parseSystem = src => orig.parseSystem(toEngine(src));
  M.smartRoot = (src, options) => orig.smartRoot(toEngine(src), options);
  window.NumeraCalc = { toEngine, toPretty };

  /* ---------- 2. Modo expoente (o que você digita sobe) ---------- */
  const mode = { on: false, depth: 0, run: '' };
  let silent = false, lastCaret = null, padOpen = true;
  try { padOpen = localStorage.getItem('numera-calc-pad') !== '0'; } catch (_) {}

  const field = () => document.getElementById('source');
  function caretOf(el) {
    if (document.activeElement === el || !lastCaret) return [el.selectionStart, el.selectionEnd];
    return [Math.min(lastCaret[0], el.value.length), Math.min(lastCaret[1], el.value.length)];
  }
  function commit(el) {
    silent = true;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    silent = false;
    lastCaret = [el.selectionStart, el.selectionEnd];
    refreshStatus();
  }
  function put(el, text, back = 0) {
    const [a, b] = caretOf(el);
    el.setRangeText(text, a, b, 'end');
    if (back) el.setSelectionRange(el.selectionStart - back, el.selectionStart - back);
  }
  function setMode(on) {
    mode.on = on; mode.depth = 0; mode.run = '';
    document.querySelector('.calc-shell')?.classList.toggle('sup-on', on);
    document.querySelector('[data-calc="pow"]')?.setAttribute('aria-pressed', String(on));
  }
  // Recalcula o expoente que está logo antes do cursor (após apagar, clicar etc.).
  function resync(el) {
    const before = el.value.slice(0, el.selectionStart);
    const m = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ˣʸᶻᵉ˙ᐟ]+$/.exec(before);
    mode.run = m ? m[0] : '';
    mode.depth = [...mode.run].reduce((d, ch) => d + (ch === '⁽') - (ch === '⁾'), 0);
  }

  // Um caractere digitado com o modo expoente ligado. Devolve false quando o caractere deve sair do expoente.
  function typeSup(el, ch) {
    const run = mode.run, last = run[run.length - 1] || '';
    const signOnly = run === '' || run === '⁻' || run === '⁺';
    const hasLetter = /[ˣʸᶻᵉ]/.test(run);
    const hasDigit = /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(run);
    let ok = false;
    if (mode.depth > 0) {
      if (ch === ' ') return true;                    // espaços dentro do expoente são ignorados
      ok = ch in SUP;
    } else if (/[0-9]/.test(ch)) ok = !hasLetter;
    else if (/[xyze]/.test(ch)) ok = signOnly;
    else if ('+-−'.includes(ch)) ok = run === '';
    else if (ch === '(') ok = signOnly;
    else if ('.,'.includes(ch)) ok = hasDigit && /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(last) && !run.includes('˙');
    if (ok) {
      const s = SUP[ch];
      put(el, s);
      mode.run += s;
      if (ch === '(') mode.depth++;
      if (ch === ')') {
        mode.depth--;
        if (mode.depth === 0) {
          // ⁽x⁺¹⁾ -> ˣ⁺¹: o expoente inteiro já vira ^(...), então os parênteses externos são dispensáveis.
          const r = mode.run;
          if (r[0] === '⁽' && r.length > 2) { const [a] = caretOf(el); el.setRangeText(r.slice(1, -1), a - r.length, a, 'end'); }
          setMode(false);
        }
      }
      return true;
    }
    leave(el); // expoente que a escrita elevada não representa (ex.: e^(sin x)) volta para a forma digitada
    return false;
  }

  // Sai do expoente antes de uma tecla que escreve texto normal (função, ×, =...).
  // Expoente vazio ou com parêntese aberto vira forma digitada (e^sin(x)), para não mudar o sentido.
  function leave(el, cancelEmpty = false) {
    if (!mode.on) return;
    if (mode.depth > 0 || (mode.run === '' && !cancelEmpty)) {
      const [a] = caretOf(el), run = mode.run;
      el.setRangeText('^' + [...run].map(c => UNSUP[c]).join(''), a - run.length, a, 'end');
    }
    setMode(false);
  }

  function typeText(el, text) {
    for (const ch of text) {
      if (mode.on && typeSup(el, ch)) continue;
      if (ch === '^') {
        // Torre de potências (x²^3): o novo expoente não pode grudar no anterior, então fica na forma digitada.
        const [a] = caretOf(el);
        if (isSup(el.value[a - 1] || '')) put(el, '^'); else setMode(true);
        continue;
      }
      put(el, ch);
    }
  }

  /* ---------- 3. Teclas do teclado científico ---------- */
  // Entre uma letra e uma função o motor leria um nome só ("xsin"): insere o ponto de multiplicação.
  const sep = el => { const [a] = caretOf(el); if (/[a-zA-Z]$/.test(el.value.slice(0, a))) put(el, '·'); };
  // + e − entre termos ganham espaços (x² - 5x + 6); no início ou após "(" ficam colados (sinal: -x).
  function opKey(el, op) {
    if (mode.on && typeSup(el, op)) return;
    const [a] = caretOf(el), before = el.value.slice(0, a);
    if (/[0-9a-zA-Zπ)⁰¹²³⁴⁵⁶⁷⁸⁹ˣʸᶻᵉ⁾]\s*$/.test(before)) put(el, (before.endsWith(' ') ? '' : ' ') + op + ' ');
    else put(el, op);
  }
  const needsBase = el => { const [a] = caretOf(el); const prev = el.value.slice(0, a).replace(/\s+$/, '').slice(-1); return !prev || !/[0-9a-zA-Zπ)⁰¹²³⁴⁵⁶⁷⁸⁹ˣʸᶻᵉ⁾]/.test(prev); };
  const KEYS = {
    sq: { label: 'x²', aria: 'Ao quadrado', run: el => { leave(el, true); if (needsBase(el)) put(el, 'x'); put(el, '²'); } },
    cube: { label: 'x³', aria: 'Ao cubo', run: el => { leave(el, true); if (needsBase(el)) put(el, 'x'); put(el, '³'); } },
    pow: { label: 'xⁿ', aria: 'Elevar a um expoente', run: el => { if (mode.on) { setMode(false); return; } if (needsBase(el)) put(el, 'x'); typeText(el, '^'); } },
    inv: { label: 'x⁻¹', aria: 'Inverso', run: el => { leave(el, true); if (needsBase(el)) put(el, 'x'); put(el, '⁻¹'); } },
    sqrt: { label: '√', aria: 'Raiz quadrada', run: el => { leave(el); sep(el); put(el, '√()', 1); } },
    pi: { label: 'π', aria: 'Pi', run: el => { leave(el); put(el, 'π'); } },
    exp: { label: 'eˣ', aria: 'Exponencial: e elevado a', run: el => { leave(el); sep(el); put(el, 'e'); setMode(true); } },
    ten: { label: '10ˣ', aria: 'Dez elevado a', run: el => { leave(el); sep(el); put(el, '10'); setMode(true); } },
    abs: { label: '|x|', aria: 'Módulo', run: el => { leave(el); sep(el); put(el, 'abs()', 1); } },
    sin: { label: 'sin', aria: 'Seno', run: el => { leave(el); sep(el); put(el, 'sin()', 1); } },
    cos: { label: 'cos', aria: 'Cosseno', run: el => { leave(el); sep(el); put(el, 'cos()', 1); } },
    tan: { label: 'tan', aria: 'Tangente', run: el => { leave(el); sep(el); put(el, 'tan()', 1); } },
    ln: { label: 'ln', aria: 'Logaritmo natural', run: el => { leave(el); sep(el); put(el, 'ln()', 1); } },
    log: { label: 'log', aria: 'Logaritmo na base 10', run: el => { leave(el); sep(el); put(el, 'log()', 1); } },
    e: { label: 'e', aria: 'Número de Euler', run: el => { leave(el); sep(el); put(el, 'e'); } },
    asin: { label: 'sin⁻¹', aria: 'Arco seno', run: el => { leave(el); sep(el); put(el, 'asin()', 1); } },
    acos: { label: 'cos⁻¹', aria: 'Arco cosseno', run: el => { leave(el); sep(el); put(el, 'acos()', 1); } },
    atan: { label: 'tan⁻¹', aria: 'Arco tangente', run: el => { leave(el); sep(el); put(el, 'atan()', 1); } },
    back: { label: '←', aria: 'Mover o cursor para a esquerda', run: el => { setMode(false); const [a] = caretOf(el); el.setSelectionRange(Math.max(0, a - 1), Math.max(0, a - 1)); } },
    out: { label: '→', aria: 'Sair do expoente / avançar', run: el => { if (mode.on) setMode(false); else { const [a] = caretOf(el); el.setSelectionRange(a + 1, a + 1); } } },
    del: { label: '⌫', aria: 'Apagar', run: el => { const [a, b] = caretOf(el); if (a !== b) el.setRangeText('', a, b, 'end'); else if (a > 0) { const cut = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(el.value.slice(0, a)) ? 2 : 1; el.setRangeText('', a - cut, a, 'end'); } if (mode.on) resync(el); } },
    clear: { label: 'C', aria: 'Limpar tudo', run: el => { el.value = ''; el.setSelectionRange(0, 0); setMode(false); } },
    line: { label: '↵', aria: 'Nova equação (sistema)', run: el => { leave(el); put(el, '\n'); el.rows = Math.max(el.rows, 4); } },
  };
  const t = ch => ({ label: ch, aria: ch, run: el => typeText(el, ch) });
  Object.assign(KEYS, {
    d0: t('0'), d1: t('1'), d2: t('2'), d3: t('3'), d4: t('4'), d5: t('5'), d6: t('6'), d7: t('7'), d8: t('8'), d9: t('9'),
    dot: { label: ',', aria: 'Vírgula decimal', run: el => typeText(el, ',') },
    open: t('('), close: t(')'), vx: t('x'), vy: t('y'), vz: t('z'), eq: { label: '=', aria: 'Igual', run: el => { leave(el); put(el, ' = '); } },
    plus: { label: '+', aria: 'Mais', run: el => opKey(el, '+') }, minus: { label: '−', aria: 'Menos', run: el => opKey(el, '-') },
    times: { label: '×', aria: 'Vezes', run: el => { leave(el); put(el, '·'); } }, div: { label: '÷', aria: 'Dividido por', run: el => { if (mode.on && mode.depth > 0) typeText(el, '/'); else { leave(el); put(el, '÷'); } } },
  });
  const FUNCS = ['sq', 'cube', 'pow', 'inv', 'sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'asin', 'acos', 'atan', 'exp', 'ten', 'pi', 'e', 'abs', 'back', 'out'];
  const NUMS = ['d7', 'd8', 'd9', 'div', 'open', 'close', 'd4', 'd5', 'd6', 'times', 'vx', 'vy', 'd1', 'd2', 'd3', 'minus', 'vz', 'eq', 'd0', 'dot', 'del', 'plus', 'clear', 'line'];
  const keyHtml = id => `<button type="button" class="calc-key k-${id}" data-calc="${id}" aria-label="${KEYS[id].aria}" title="${KEYS[id].aria}"${id === 'pow' ? ' aria-pressed="false"' : ''}>${KEYS[id].label}</button>`;

  /* ---------- 4. Status: a expressão já é válida? ---------- */
  function refreshStatus() {
    const el = field(), out = document.querySelector('.calc-check');
    if (!el || !out) return;
    const src = el.value.trim();
    let msg = 'Digite ou use o teclado. Expoentes sobem sozinhos.', cls = '';
    if (src.startsWith('/')) msg = 'Comando do terminal.';
    else if (src) {
      try {
        if (src.includes('\n') || src.includes('|')) { const r = M.parseSystem(src); msg = `Sistema ${r.A.length}×${r.A.length} pronto (${r.variables.join(', ')})`; }
        else { const sp = M.splitInterval ? M.splitInterval(src) : { equation: src, interval: null }; const f = M.parseFunction(sp.equation); f(0.5); msg = sp.interval ? `Equação pronta, no intervalo [${sp.interval.ta}; ${sp.interval.tb}]` : 'Equação pronta para resolver'; }
        cls = 'ok';
      } catch (e) { msg = e.message; cls = 'warn'; }
    }
    out.className = 'calc-check ' + cls;
    out.textContent = (cls === 'ok' ? '✓ ' : cls === 'warn' ? '… ' : '') + msg;
  }

  /* ---------- 5. Montagem no terminal (o app redesenha a página a cada ação) ---------- */
  function enhance() {
    const form = document.getElementById('terminal-form'), el = field();
    if (!form || !el || form.querySelector('.calc-shell')) {
      prettifyEcho();
      return;
    }
    const pretty = toPretty(el.value);
    if (pretty !== el.value) { el.value = pretty; commit(el); }
    el.setAttribute('placeholder', 'x³ − x − 2 = 0');
    lastCaret = [el.value.length, el.value.length];
    const shell = document.createElement('div');
    shell.className = 'calc-shell' + (padOpen ? '' : ' closed');
    shell.innerHTML = `<div class="calc-bar"><span class="calc-check"></span><span class="calc-mode" aria-hidden="true">expoente · → sai</span><button type="button" class="calc-toggle" aria-expanded="${padOpen}">${padOpen ? 'Ocultar teclado' : 'Teclado científico'}</button></div>
      <div class="calc-pad" role="group" aria-label="Teclado científico"><div class="calc-funcs">${FUNCS.map(keyHtml).join('')}</div><div class="calc-nums">${NUMS.map(keyHtml).join('')}</div></div>`;
    form.querySelector('.terminal-entry').after(shell);
    if (padOpen && matchMedia('(pointer: coarse)').matches) el.setAttribute('inputmode', 'none');
    setMode(false);
    refreshStatus();
    prettifyEcho();
  }
  function prettifyEcho() {
    document.querySelectorAll('.source-echo code, .history code').forEach(code => {
      const p = toPretty(code.textContent);
      if (p !== code.textContent) code.textContent = p;
    });
  }

  // Tecla do teclado científico: não tira o foco do campo nem abre o teclado do celular.
  document.addEventListener('pointerdown', e => { if (e.target.closest('.calc-key')) e.preventDefault(); });
  document.addEventListener('click', e => {
    const key = e.target.closest('.calc-key');
    if (key) {
      const el = field(); if (!el) return;
      KEYS[key.dataset.calc].run(el);
      if (matchMedia('(pointer: fine)').matches) el.focus();
      commit(el);
      return;
    }
    const toggle = e.target.closest('.calc-toggle');
    if (toggle) {
      padOpen = !padOpen;
      try { localStorage.setItem('numera-calc-pad', padOpen ? '1' : '0'); } catch (_) {}
      const shell = toggle.closest('.calc-shell');
      shell.classList.toggle('closed', !padOpen);
      toggle.setAttribute('aria-expanded', String(padOpen));
      toggle.textContent = padOpen ? 'Ocultar teclado' : 'Teclado científico';
      const el = field();
      if (el) { if (padOpen && matchMedia('(pointer: coarse)').matches) el.setAttribute('inputmode', 'none'); else el.removeAttribute('inputmode'); }
    }
  });

  // Teclado físico: "^" liga o expoente em vez de aparecer na tela.
  document.addEventListener('beforeinput', e => {
    const el = e.target;
    if (el.id !== 'source' || e.inputType !== 'insertText' || !e.data) return;
    if (!mode.on && !e.data.includes('^')) return;
    e.preventDefault();
    typeText(el, e.data);
    commit(el);
  });
  // Colar, teclas mortas (^ no Mac/ABNT) e corretores: converte o que chegou em forma digitada.
  document.addEventListener('input', e => {
    const el = e.target;
    if (silent || el.id !== 'source') return;
    const a = el.selectionStart;
    let before = el.value.slice(0, a);
    const after = el.value.slice(a);
    let enter = false;
    if (before.endsWith('^')) { before = before.slice(0, -1); enter = true; }
    const pb = toPretty(before), pa = toPretty(after);
    if (pb + pa !== el.value) { el.value = pb + pa; el.setSelectionRange(pb.length, pb.length); }
    if (enter) setMode(true);
    else if (mode.on) resync(el);
    if (/[⁰¹²³⁴⁵⁶⁷⁸⁹ˣʸᶻᵉ]$/.test(pb) && !enter && e.inputType === 'insertCompositionText') { setMode(true); resync(el); }
    commit(el);
  });
  document.addEventListener('keydown', e => {
    const el = e.target;
    if (el.id !== 'source') return;
    if (!mode.on || !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Escape'].includes(e.key)) return;
    setMode(false); // → ou Esc saem do expoente
    if (e.key === 'Escape') e.stopPropagation();
  }, true);
  document.addEventListener('keyup', e => { if (e.target.id === 'source') { lastCaret = [e.target.selectionStart, e.target.selectionEnd]; if (e.key === 'Backspace' && mode.on) resync(e.target); } });
  document.addEventListener('mouseup', e => { if (e.target.id === 'source') { lastCaret = [e.target.selectionStart, e.target.selectionEnd]; setMode(false); } });
  document.addEventListener('focusout', e => { if (e.target.id === 'source') lastCaret = [e.target.selectionStart, e.target.selectionEnd]; });

  const app = document.getElementById('app');
  if (app) new MutationObserver(enhance).observe(app, { childList: true });
  enhance();
})();
