/* Núcleo numérico independente da interface. Sem eval() e sem chamadas externas. */
(function (global) {
  'use strict';
  const FUNCS = {
    sin: Math.sin, sen: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan,
    sqrt: Math.sqrt, raiz: Math.sqrt, abs: Math.abs, exp: Math.exp,
    ln: Math.log, log: Math.log10, asin: Math.asin, acos: Math.acos,
    atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh
  };
  const CONSTANTS = { pi: Math.PI, e: Math.E };
  const err = (message) => { throw new Error(message); };
  function tokenize(source) {
    const text = String(source).replace(/(\d),(?=\d)/g, '$1.').replace(/²/g, '^2').replace(/³/g, '^3').replace(/π/g, 'pi').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^');
    if (text.length > 500) err('A expressão é muito longa (máximo de 500 caracteres).');
    const tokens = [];
    let at = 0;
    while (at < text.length) {
      const s = text.slice(at);
      const ws = /^\s+/.exec(s);
      if (ws) { at += ws[0].length; continue; }
      const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(s);
      if (num) { tokens.push({ type: 'num', value: Number(num[0]) }); at += num[0].length; continue; }
      const name = /^[a-zA-Z]+[0-9]*/.exec(s);
      if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); at += name[0].length; continue; }
      if ('+-*/^()'.includes(text[at])) { tokens.push({ type: text[at] }); at++; continue; }
      err('Caractere inválido na expressão: "' + text[at] + '".');
    }
    tokens.push({ type: 'eof' });
    return tokens;
  }
  function parseSide(source, variables = ['x']) {
    const tokens = tokenize(source);
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = (type) => {
      if (peek().type !== type) err('Esperado "' + type + '" na expressão.');
      return tokens[pos++];
    };
    function expression(minBP = 0) {
      let node;
      const t = tokens[pos++];
      if (t.type === 'num') node = { k: 'num', v: t.value };
      else if (t.type === 'name') {
        if (Object.prototype.hasOwnProperty.call(FUNCS,t.value)) {
          consume('(');
          node = { k: 'fn', name: t.value, arg: expression(0) };
          consume(')');
        } else if (variables.includes(t.value)) node = { k: 'var', name: t.value };
        else if (Object.prototype.hasOwnProperty.call(CONSTANTS,t.value)) node = { k: 'num', v: CONSTANTS[t.value] };
        else err('Nome desconhecido: "' + t.value + '". Use x, pi, e ou funções suportadas.');
      } else if (t.type === '(') {
        node = expression(0); consume(')');
      } else if (t.type === '+' || t.type === '-') {
        node = { k: 'unary', op: t.type, arg: expression(3) };
      } else err('Expressão incompleta ou operador inesperado.');
      while (true) {
        const next = peek();
        let op = next.type;
        const implicit = op === 'num' || op === 'name' || op === '(';
        if (implicit) op = '*';
        const bp = ({ '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 })[op];
        if (bp === undefined || bp < minBP) break;
        if (!implicit) pos++;
        node = { k: 'bin', op, left: node, right: expression(op === '^' ? bp : bp + 1) };
      }
      return node;
    }
    const ast = expression();
    if (peek().type !== 'eof') err('Há elementos inesperados após a expressão.');
    return ast;
  }
  function evalNode(n, x) {
    switch (n.k) {
      case 'num': return n.v;
      case 'var': return typeof x === 'number' ? x : x[n.name];
      case 'unary': return n.op === '-' ? -evalNode(n.arg, x) : evalNode(n.arg, x);
      case 'fn': return FUNCS[n.name](evalNode(n.arg, x));
      case 'bin': {
        const a = evalNode(n.left, x), b = evalNode(n.right, x);
        if (n.op === '+') return a + b;
        if (n.op === '-') return a - b;
        if (n.op === '*') return a * b;
        if (n.op === '/') return a / b;
        return Math.pow(a, b);
      }
      default: err('Nó matemático desconhecido.');
    }
  }
  // Valor e "tamanho" dos termos de uma expressão: o arredondamento de f(x) é da ordem de ε vezes esse tamanho.
  // Ex.: x² − 2x + 1 perto de x = 1 vale quase 0, mas soma termos de tamanho 4, então o ruído é ≈ 4ε.
  function magNode(n, x) {
    switch (n.k) {
      case 'num': return [n.v, Math.abs(n.v)];
      case 'var': { const v = typeof x === 'number' ? x : x[n.name]; return [v, Math.abs(v)]; }
      case 'unary': { const [v, a] = magNode(n.arg, x); return [n.op === '-' ? -v : v, a]; }
      case 'fn': {
        const [v, a] = magNode(n.arg, x), f = FUNCS[n.name], y = f(v), h = 1e-6 * (1 + Math.abs(v));
        let d = (f(v + h) - f(v - h)) / (2 * h); if (!Number.isFinite(d)) d = 0;
        return [y, Math.abs(y) + Math.abs(d) * a];
      }
      case 'bin': {
        const [l, la] = magNode(n.left, x), [r, ra] = magNode(n.right, x);
        if (n.op === '+') return [l + r, la + ra];
        if (n.op === '-') return [l - r, la + ra];
        if (n.op === '*') return [l * r, Math.abs(l * r) + Math.abs(r) * la + Math.abs(l) * ra];
        if (n.op === '/') { const y = l / r; return [y, Math.abs(y) + (la + Math.abs(y) * ra) / Math.abs(r)]; }
        const y = Math.pow(l, r); let a = Math.abs(y) + Math.abs(r * Math.pow(l, r - 1)) * la + Math.abs(y * Math.log(Math.abs(l))) * ra;
        if (!Number.isFinite(a)) a = Math.abs(y) + la + ra;
        return [y, a];
      }
      default: return [NaN, NaN];
    }
  }
  function parseFunction(raw) {
    const parts = String(raw).split('=');
    if (parts.length > 2) err('Digite uma expressão ou apenas uma igualdade, como x² − 2 = 0.');
    const left = parseSide(parts[0]);
    const right = parts.length === 2 ? parseSide(parts[1]) : { k: 'num', v: 0 };
    const fn = (x) => evalNode(left, x) - evalNode(right, x);
    fn.noise = (x) => 32 * Number.EPSILON * (magNode(left, x)[1] + magNode(right, x)[1]);
    return fn;
  }
  // Função "contada" ou embrulhada continua sabendo o próprio ruído de arredondamento.
  const wrap = (fn, g) => { if (fn && fn.noise) g.noise = fn.noise; return g; };
  function value(fn, x) {
    if (!Number.isFinite(x)) err('Foi encontrado um valor inválido para x.');
    const y = fn(x);
    if (!Number.isFinite(y)) err('A função não possui valor real finito em x = ' + fmt(x) + '.');
    return y;
  }
  const fmt = (n) => Number.isFinite(n) ? Number(n.toPrecision(10)).toString() : String(n);
  function opts(options) {
    const tolerance = Number(options.tolerance ?? 1e-6);
    const maxIterations = Number(options.maxIterations ?? 100);
    if (!Number.isFinite(tolerance) || tolerance < 1e-12 || tolerance >= 1) err('A tolerância precisa ser de pelo menos 1e-12 e menor que 1.');
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 500) err('O limite de iterações precisa estar entre 1 e 500.');
    return { tolerance, maxIterations };
  }
  function result(method, iterations, root, residual, converged, note = '', certification = null) {
    return { method, iterations, root, residual, converged, note, steps: iterations.length, certification };
  }
  function bisection(fn, a0, b0, options = {}) {
    const { tolerance, maxIterations } = opts(options);
    let a = Number(a0), b = Number(b0);
    if (!(a < b)) err('Na Bisseção, o intervalo deve ter a < b.');
    let fa = value(fn, a), fb = value(fn, b);
    for (const [p, fp, side] of [[a, fa, 'esquerda'], [b, fb, 'direita']]) if (Math.abs(fp) <= tolerance) {
      const c = certifyRoot(fn, p);
      if (certified(c)) return result('bisection', [{ i: 0, x: p, fx: fp, error: 0, detail: `A extremidade ${side} já é raiz.` }], p, Math.abs(fp), true, certNote(c), c);
    }
    if (Math.sign(fa) === Math.sign(fb) || fa === 0 || fb === 0) err('Bisseção exige sinais opostos em f(a) e f(b). Escolha outro intervalo.');
    const iterations = []; let mid = a, fm = fa;
    for (let i = 1; i <= maxIterations; i++) {
      mid = a + (b - a) / 2; fm = value(fn, mid);
      const error = Math.abs(b - a) / 2;
      iterations.push({ i, x: mid, fx: fm, error, a, b, fa, fb, detail: `[${fmt(a)}, ${fmt(b)}] → médio = ${fmt(mid)}` });
      // O intervalo sempre tem troca de sinal; |f| pequeno só encerra se houver raiz perto do ponto médio.
      if (Math.abs(fm) <= tolerance) { const c = certifyRoot(fn, mid); if (certified(c)) return result('bisection', iterations, mid, Math.abs(fm), true, certNote(c), c); }
      if(mid===a||mid===b)return result('bisection', iterations, mid, Math.abs(fm), false, 'Limite de precisão numérica atingido sem resíduo suficientemente pequeno.');
      if (Math.sign(fa) === Math.sign(fm)) { a = mid; fa = fm; } else { b = mid; fb = fm; }
    }
    return result('bisection', iterations, mid, Math.abs(fm), false, 'Limite de iterações atingido.');
  }
  function derivative(fn, x) {
    const h = Math.cbrt(Number.EPSILON) * (1 + Math.abs(x));
    return (value(fn, x + h) - value(fn, x - h)) / (2 * h);
  }
  // |f(x)| ≤ tolerância NÃO prova que existe raiz (ex.: 1e-20·(x² + 1) fica abaixo de 1e-12 e nunca zera).
  // certifyRoot procura evidência perto de x e devolve um de quatro estados:
  //   certificada: f muda de sinal num intervalo pequeno em volta de x, com valores acima do arredondamento (TVI);
  //   multipla:    sem troca de sinal, mas |f| desce até o nível do arredondamento (raiz de multiplicidade par, como (x − a)²);
  //   quase:       |f| tem um mínimo local perto de x que fica ACIMA do arredondamento: a curva não toca o eixo (não é raiz);
  //   longe:       nada perto de x; se houver raiz, ela está mais longe (o método deve continuar).
  const noiseAt = (fn, x, y) => { if (typeof fn.noise === 'function') { const m = fn.noise(x); if (Number.isFinite(m)) return m; } return 64 * Number.EPSILON * Math.abs(y); };
  function certifyRoot(fn, x) {
    // A conferência não faz parte do método: na comparação de custo ela usa a função sem contador (fn.raw),
    // para que "avaliações de f" continue sendo o custo do algoritmo como ele é ensinado.
    const f = fn.raw || fn;
    const at = p => { try { const y = f(p); return Number.isFinite(y) ? y : NaN; } catch (_) { return NaN; } };
    const fx = at(x), sc = 1 + Math.abs(x);
    if (!Number.isFinite(fx)) return { status: 'longe' };
    const big = (p, y) => Number.isFinite(y) && Math.abs(y) > noiseAt(fn, p, y);
    const signAround = (c, fc) => {
      const s2 = 1 + Math.abs(c);
      for (let k = 0; k <= 20; k++) {
        const d = 1e-15 * s2 * Math.pow(4, k), l = c - d, r = c + d, fl = at(l), fr = at(r);
        for (const [a, fa, b, fb] of [[c, fc, r, fr], [l, fl, c, fc], [l, fl, r, fr]])
          if (fa * fb < 0 && big(a, fa) && big(b, fb)) return [a, b];
      }
      return null;
    };
    const br = signAround(x, fx);
    if (br) return { status: 'certificada', bracket: br, width: br[1] - br[0] };
    let best = { x, y: Math.abs(fx) }, reached = Math.abs(fx) <= noiseAt(fn, x, fx), interior = false;
    if (!reached) for (const R of [1e-3 * sc, 1e-2 * sc, 1e-1 * sc]) {
      const g = 0.3819660112501051; let a = x - R, b = x + R, c = a + g * (b - a), d = b - g * (b - a), fc = Math.abs(at(c)), fd = Math.abs(at(d));
      const look = (p, y) => { if (!Number.isFinite(y)) return; if (y < best.y) best = { x: p, y }; if (y <= noiseAt(fn, p, y)) { reached = true; best = { x: p, y }; } };
      look(c, fc); look(d, fd);
      for (let i = 0; i < 200 && !reached && b - a > 4 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b)); i++) {
        if (fc <= fd || !Number.isFinite(fd)) { b = d; d = c; fd = fc; c = a + g * (b - a); fc = Math.abs(at(c)); look(c, fc); }
        else { a = c; c = d; fc = fd; d = b - g * (b - a); fd = Math.abs(at(d)); look(d, fd); }
      }
      if (reached) break;
      if (Math.abs((a + b) / 2 - x) < 0.98 * R) { interior = true; break; }
    }
    // Achou |f| no nível do arredondamento: se ali f troca de sinal, é uma raiz simples MAIS LONGE de x (o método deve seguir);
    // se não troca, é o fundo de uma raiz de multiplicidade par perto de x.
    if (reached) return signAround(best.x, at(best.x)) ? { status: 'longe', root: best.x, minAbs: best.y } : { status: 'multipla', root: best.x, minAbs: best.y };
    return { status: interior ? 'quase' : 'longe', root: best.x, minAbs: best.y };
  }
  const certified = c => c && (c.status === 'certificada' || c.status === 'multipla');
  const certNote = c => !c ? '' : c.status === 'multipla'
    ? `Sem troca de sinal perto da raiz: provável raiz de multiplicidade par, como em (x − a)². |f| desce até o nível do arredondamento em x ≈ ${fmt(c.root)}, mas a existência da raiz não é certificada por troca de sinal.`
    : c.status === 'quase'
      ? `Quase-raiz, não raiz: |f(x)| ficou abaixo da tolerância, mas perto daqui o menor valor de |f| é ≈ ${fmt(c.minAbs)} (em x ≈ ${fmt(c.root)}) e a curva não cruza nem toca o eixo. A tolerância absoluta é grande demais para a escala desta função.`
      : '';
  function newton(fn, initial, options = {}) {
    const { tolerance, maxIterations } = opts(options);
    let x = Number(initial), fx = value(fn, x);
    const iterations = [{ i: 0, x, fx, error: null, detail: 'Aproximação inicial' }];
    const check = () => { if (Math.abs(fx) > tolerance) return null; const c = certifyRoot(fn, x); return certified(c) ? result('newton', iterations, x, Math.abs(fx), true, certNote(c), c) : c.status === 'quase' ? result('newton', iterations, x, Math.abs(fx), false, certNote(c), c) : null; };
    let done = check(); if (done) return done;
    for (let i = 1; i <= maxIterations; i++) {
      const d = derivative(fn, x);
      if (!Number.isFinite(d) || d === 0) err('Newton-Raphson: derivada nula ou quase nula. Tente outra aproximação.');
      const next = x - fx / d;
      if (!Number.isFinite(next) || Math.abs(next) > 1e15) err('Newton-Raphson divergiu. Tente outro ponto inicial ou Bisseção.');
      const nf = value(fn, next), delta = Math.abs(next - x);
      iterations.push({ i, x: next, fx: nf, error: delta, previous: x, derivative: d, detail: `x = ${fmt(x)} − f(x)/f'(x), f'(x) ≈ ${fmt(d)}` });
      x = next; fx = nf;
      done = check(); if (done) return done;
      if (delta <= tolerance * (1 + Math.abs(x))) return result('newton', iterations, x, Math.abs(fx), false, 'Parou por pequena variação entre aproximações. Confira o resíduo.');
    }
    return result('newton', iterations, x, Math.abs(fx), false, 'Limite de iterações atingido.');
  }
  function secant(fn, x00, x10, options = {}) {
    const { tolerance, maxIterations } = opts(options);
    let x0 = Number(x00), x1 = Number(x10);
    if (x0 === x1) err('A Secante exige dois pontos iniciais diferentes.');
    let f0 = value(fn, x0), f1 = value(fn, x1);
    const iterations = [ { i: 0, x: x0, fx: f0, error: null, detail: 'Primeiro ponto' }, { i: 1, x: x1, fx: f1, error: Math.abs(x1-x0), detail: 'Segundo ponto' } ];
    const check = (x, fx, rows) => { if (Math.abs(fx) > tolerance) return null; const c = certifyRoot(fn, x); return certified(c) ? result('secant', rows, x, Math.abs(fx), true, certNote(c), c) : c.status === 'quase' ? result('secant', rows, x, Math.abs(fx), false, certNote(c), c) : null; };
    let done = check(x0, f0, [iterations[0]]) || check(x1, f1, iterations); if (done) return done;
    for (let i = 2; i <= maxIterations + 1; i++) {
      const denom = f1 - f0;
      if (!Number.isFinite(denom) || Math.abs(denom) <= Number.EPSILON * Math.max(Math.abs(f0), Math.abs(f1))) err('Secante: diferença entre f(x₁) e f(x₀) quase nula. Escolha outros pontos.');
      const next = x1 - f1 * (x1 - x0) / denom;
      if (!Number.isFinite(next) || Math.abs(next) > 1e15) err('Secante divergiu. Escolha outras aproximações.');
      const fnext = value(fn, next), delta = Math.abs(next-x1);
      iterations.push({ i, x: next, fx: fnext, error: delta, x0, x1, f0, f1, detail: `Pontos anteriores: ${fmt(x0)} e ${fmt(x1)}` });
      x0 = x1; f0 = f1; x1 = next; f1 = fnext;
      done = check(x1, f1, iterations); if (done) return done;
      if (delta <= tolerance * (1 + Math.abs(x1))) return result('secant', iterations, x1, Math.abs(f1), false, 'Parou por pequena variação entre aproximações. Confira o resíduo.');
    }
    return result('secant', iterations, x1, Math.abs(f1), false, 'Limite de iterações atingido.');
  }
  // Falsa Posição (regula falsi): como a Bisseção, mantém um intervalo com troca de sinal,
  // mas o novo ponto é onde a corda entre (a, f(a)) e (b, f(b)) cruza o eixo x.
  function falsePosition(fn, a0, b0, options = {}) {
    const { tolerance, maxIterations } = opts(options);
    let a = Number(a0), b = Number(b0);
    if (!(a < b)) err('Na Falsa Posição, o intervalo deve ter a < b.');
    let fa = value(fn, a), fb = value(fn, b);
    for (const [p, fp, side] of [[a, fa, 'esquerda'], [b, fb, 'direita']]) if (Math.abs(fp) <= tolerance) {
      const c = certifyRoot(fn, p);
      if (certified(c)) return result('falseposition', [{ i: 0, x: p, fx: fp, error: 0, detail: `A extremidade ${side} já é raiz.` }], p, Math.abs(fp), true, certNote(c), c);
    }
    if (Math.sign(fa) === Math.sign(fb) || fa === 0 || fb === 0) err('Falsa Posição exige sinais opostos em f(a) e f(b). Escolha outro intervalo.');
    const iterations = []; let x = a, fx = fa, prev = null, run = 0, lastKept = '';
    const stuckNote = () => run >= 3 ? ` A extremidade ${lastKept === 'a' ? 'esquerda (a)' : 'direita (b)'} ficou parada nas últimas ${run} iterações: é o comportamento típico da Falsa Posição quando a curva é convexa ou côncava no intervalo, e a convergência fica linear.` : '';
    for (let i = 1; i <= maxIterations; i++) {
      x = (a * fb - b * fa) / (fb - fa);
      if (!(x > a && x < b)) x = Math.min(b, Math.max(a, x));
      fx = value(fn, x);
      const error = prev === null ? null : Math.abs(x - prev);
      const keep = Math.sign(fa) === Math.sign(fx) ? 'b' : 'a';
      iterations.push({ i, x, fx, error, a, b, fa, fb, kept: keep, detail: `[${fmt(a)}, ${fmt(b)}] → a corda cruza o eixo em ${fmt(x)}` });
      run = keep === lastKept ? run + 1 : 1; lastKept = keep;
      if (Math.abs(fx) <= tolerance) { const c = certifyRoot(fn, x); if (certified(c)) return result('falseposition', iterations, x, Math.abs(fx), true, (stuckNote() + ' ' + certNote(c)).trim(), c); }
      if (x === prev || x === a || x === b) return result('falseposition', iterations, x, Math.abs(fx), false, 'Limite de precisão numérica atingido sem resíduo suficientemente pequeno.' + stuckNote());
      if (keep === 'b') { a = x; fa = fx; } else { b = x; fb = fx; }
      prev = x;
    }
    return result('falseposition', iterations, x, Math.abs(fx), false, 'Limite de iterações atingido.' + stuckNote());
  }
  // Ponto Fixo: reescreve f(x) = 0 como x = g(x) e repete x ← g(x).
  // O critério |x − g(x)| ≤ tolerância é o resíduo da equação x − g(x) = 0.
  function contraction(g, x) {
    let d; try { d = derivative(g, x); } catch (_) { return ''; }
    if (!Number.isFinite(d)) return '';
    const k = Math.abs(d), br = v => String(Number(v.toPrecision(3))).replace('.', ',');
    if (k < 1e-3) return `g′(x) ≈ 0 perto da raiz: a convergência fica mais rápida que linear.`;
    if (k < 1) return `|g′(x)| ≈ ${br(k)} < 1 perto da raiz: g é uma contração e o erro cai por um fator de aproximadamente ${br(k)} a cada passo (convergência linear).`;
    return `|g′(x)| ≈ ${br(k)} ≥ 1 no ponto final: g não é uma contração ali, e a iteração pode divergir ou oscilar. Reescreva x = g(x) de outra forma.`;
  }
  function fixedPoint(g, x00, options = {}) {
    const { tolerance, maxIterations } = opts(options);
    let x = Number(x00);
    const at = v => { try { return value(g, v); } catch (_) { err('Ponto Fixo: g(x) não tem valor real finito em x = ' + fmt(v) + '. A iteração saiu do domínio de g.'); } };
    let gx = at(x);
    const h = v => v - g(v);
    h.noise = v => 32 * Number.EPSILON * Math.abs(v) + (typeof g.noise === 'function' ? g.noise(v) : 64 * Number.EPSILON * Math.abs(g(v)));
    const iterations = [{ i: 0, x, gx, fx: x - gx, error: null, detail: `Aproximação inicial: g(x₀) = ${fmt(gx)}` }];
    const check = () => { if (Math.abs(x - gx) > tolerance) return null; const c = certifyRoot(h, x); return certified(c) ? result('fixedpoint', iterations, x, Math.abs(x - gx), true, (contraction(g, x) + ' ' + certNote(c)).trim(), c) : c.status === 'quase' ? result('fixedpoint', iterations, x, Math.abs(x - gx), false, certNote(c).replace('|f(x)|', '|x − g(x)|').replace('menor valor de |f|', 'menor valor de |x − g(x)|'), c) : null; };
    let done = check(); if (done) return done;
    for (let i = 1; i <= maxIterations; i++) {
      const next = gx;
      if (!Number.isFinite(next) || Math.abs(next) > 1e15) err('Ponto Fixo divergiu: os valores cresceram sem controle. Confira se |g′(x)| < 1 perto da raiz ou escolha outra g(x).');
      const gn = at(next), delta = Math.abs(next - x);
      iterations.push({ i, x: next, gx: gn, fx: next - gn, error: delta, previous: x, detail: `x${i} = g(x${i - 1}) = g(${fmt(x)})` });
      x = next; gx = gn;
      done = check(); if (done) return done;
    }
    return result('fixedpoint', iterations, x, Math.abs(x - gx), false, ('Limite de iterações atingido. ' + contraction(g, x)).trim());
  }

  // Convergência lado a lado: erro |xₖ − x*| de cada método a partir dos mesmos dados.
  // A "ordem observada" é a inclinação de ln eₖ₊₁ contra ln eₖ (1 = linear, ≈1,6 = Secante, 2 = Newton).
  function observedOrder(errors, scale) {
    const lo = 1e-13 * scale, hi = 0.5 * scale, pts = [];
    for (let k = 0; k + 1 < errors.length; k++) { const u = errors[k], v = errors[k + 1]; if (u > lo && v > lo && u < hi && v < hi) pts.push([Math.log(u), Math.log(v)]); }
    if (pts.length < 2) return { order: null, rate: null };
    const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0), sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
    const order = sxx > 1e-9 ? sxy / sxx : null, rate = Math.exp(pts.reduce((s, p) => s + p[1] - p[0], 0) / n);
    return { order: order === null ? null : Number(order.toFixed(2)), rate: Number(rate.toPrecision(2)) };
  }
  function convergenceRoot(fn, input = {}, options = {}) {
    const max = Math.min(80, Number(options.maxIterations) || 80), o = { tolerance: 1e-12, maxIterations: max };
    const n = v => v === null || v === undefined || v === '' ? NaN : Number(v);
    const a = n(input.a), b = n(input.b), x0 = n(input.x0), x1 = n(input.x1);
    const need = (ok, msg) => { if (!ok) err(msg); };
    const bracket = () => need(Number.isFinite(a) && Number.isFinite(b), 'Sem intervalo [a, b] nestes dados.');
    const runs = {
      bisection: () => { bracket(); return bisection(fn, a, b, o); },
      falseposition: () => { bracket(); return falsePosition(fn, a, b, o); },
      newton: () => { need(Number.isFinite(x0), 'Sem chute inicial x₀ nestes dados.'); return newton(fn, x0, o); },
      secant: () => { need(Number.isFinite(x0) && Number.isFinite(x1), 'Sem os dois pontos x₀ e x₁ nestes dados.'); return secant(fn, x0, x1, o); }
    };
    if (typeof input.g === 'function') runs.fixedpoint = () => { need(Number.isFinite(x0), 'Sem chute inicial x₀ nestes dados.'); return fixedPoint(input.g, x0, o); };
    // Guarda a sequência E o desfecho de cada método: uma trajetória que parou no limite de iterações
    // não pode aparecer no gráfico como se tivesse convergido.
    const raw = {}, info = {};
    for (const [m, run] of Object.entries(runs)) {
      try { const r = run(); raw[m] = r.iterations.map(t => t.x); info[m] = { converged: r.converged, note: r.note || '', iterations: r.iterations.length - 1 }; }
      catch (e) { raw[m] = { error: e.message }; info[m] = { error: e.message }; }
    }
    // Referência x*: a aproximação mais precisa disponível (menor |f|) perto da raiz pedida, polida por Newton.
    // Uma referência imprecisa faria todas as curvas "estacionarem" no erro dela.
    const hint = Number(input.reference), cands = [];
    if (Number.isFinite(hint)) cands.push(hint);
    for (const xs of Object.values(raw)) if (Array.isArray(xs) && xs.length) cands.push(xs[xs.length - 1]);
    let best = null;
    for (const x of cands) {
      if (Number.isFinite(hint) && Math.abs(x - hint) > 1e-4 * (1 + Math.abs(hint))) continue;
      try { const r = Math.abs(value(fn, x)); if (!best || r < best.r) best = { x, r }; } catch (_) {}
    }
    if (!best) err('Nenhum método produziu aproximações para comparar.');
    try { const nw = newton(fn, best.x, { tolerance: 1e-12, maxIterations: 30 }); const r = Math.abs(value(fn, nw.root)); if (r < best.r && Math.abs(nw.root - best.x) < 1e-6 * (1 + Math.abs(best.x))) best = { x: nw.root, r }; } catch (_) {}
    const ref = best.x;
    const scale = 1 + Math.abs(ref), floor = 1e-15 * scale, series = [];
    for (const [method, xs] of Object.entries(raw)) {
      if (!Array.isArray(xs)) {
        const msg = xs.error, missing = /^Sem /.test(msg), div = /diverg/i.test(msg);
        series.push({ method, errors: [], error: msg, status: div ? 'divergiu' : 'falhou', note: missing ? 'Método incompatível com estes dados: ' + msg : msg, iterations: 0 });
        continue;
      }
      const errors = [];
      for (const x of xs) { const e = Math.abs(x - ref); errors.push(Math.max(e, floor)); if (e <= floor) break; }
      const last = xs[xs.length - 1], lastErr = Math.abs(last - ref), other = lastErr > 1e-6 * scale && info[method].converged;
      const reach = errors.findIndex(e => e <= 1e-8 * scale), done = info[method].converged || lastErr <= 1e-10 * scale;
      const grew = !done && errors.length > 3 && errors[errors.length - 1] > 10 * Math.min(...errors);
      const status = other ? 'outra' : done ? 'convergiu' : grew ? 'divergiu' : 'parcial';
      const note = status === 'outra' ? `Terminou em x ≈ ${fmt(last)}, longe de ${fmt(ref)}: convergiu para outra raiz.`
        : status === 'parcial' ? `Trajetória parcial: parou depois de ${info[method].iterations} iterações sem atingir o critério (${(info[method].note || 'Limite de iterações atingido').split('. ')[0].replace(/\.$/, '').toLowerCase()}). O último erro é ≈ ${fmt(lastErr)}.`
        : status === 'divergiu' ? `Divergência detectada: o erro passou a crescer (último ≈ ${fmt(lastErr)}).` : '';
      series.push({ method, xs: xs.slice(0, errors.length), errors, other, final: last, reach: reach < 0 ? null : reach, ...observedOrder(errors, scale),
        status, note, iterations: info[method].iterations, diverged: status === 'divergiu', error: status === 'outra' ? note : '' });
    }
    return { reference: ref, floor, series };
  }
  // Dados de partida "didáticos" em volta de uma raiz já conhecida: intervalo redondo com uma única troca de sinal,
  // x₀ dentro dele e x₁ na ponta. Usado quando a busca automática deixou um intervalo minúsculo demais para comparar.
  function convergenceStart(fn, root) {
    const r = Number(root), sc = 1 + Math.abs(r), round = v => Number(v.toPrecision(12));
    if (!Number.isFinite(r)) return null;
    for (const frac of [0.5, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01]) {
      const d = frac * sc, step = Math.pow(10, Math.floor(Math.log10(d)));
      const a = round(Math.floor((r - 0.7 * d) / step) * step), b = round(Math.ceil((r + d) / step) * step);
      let fine = true, changes = 0, prev = null;
      for (let i = 0; i <= 60; i++) { let y; try { y = value(fn, a + (b - a) * i / 60); } catch (_) { fine = false; break; } if (prev !== null && (prev * y < 0 || y === 0)) changes++; prev = y; }
      if (!fine || changes !== 1) continue;
      let fa, fb; try { fa = value(fn, a); fb = value(fn, b); } catch (_) { continue; }
      if (fa * fb < 0) return { a, b, x0: round(a + (b - a) * 0.75), x1: b };
    }
    return null;
  }
  function convergenceSystem(A, b, initial, options = {}) {
    validateSystem(A, b); requireUnique(A, b);
    const n = A.length, ref = gauss(A, b, { tolerance: 1e-6 }).root, scale = 1 + Math.max(...ref.map(Math.abs)), floor = 1e-15 * scale;
    const max = Math.min(60, Number(options.maxIterations) || 60);
    const iterate = sequential => {
      let x = initial.slice(); const errors = [], dist = v => Math.max(...v.map((t, i) => Math.abs(t - ref[i])));
      errors.push(Math.max(dist(x), floor));
      for (let k = 1; k <= max; k++) {
        const old = x.slice();
        for (let r = 0; r < n; r++) { let s = b[r]; for (let c = 0; c < n; c++) if (c !== r) s -= A[r][c] * (sequential ? x[c] : old[c]); x[r] = s / A[r][r]; }
        const e = dist(x);
        if (!Number.isFinite(e)) break;
        errors.push(Math.max(e, floor));
        if (e <= floor || e > 1e8 * scale) break;
      }
      return errors;
    };
    const series = [];
    if (A.some((r, i) => r[i] === 0)) series.push({ method: 'seidel', errors: [], status: 'falhou', note: 'Método incompatível com estes dados: diagonal com zero, Gauss-Seidel não pode dividir pela diagonal.', error: 'Diagonal com zero: Gauss-Seidel não pode dividir pela diagonal.' }, { method: 'jacobi', errors: [], status: 'falhou', note: 'Diagonal com zero.', error: 'Diagonal com zero.' });
    else for (const [method, seq] of [['seidel', true], ['jacobi', false]]) {
      const errors = iterate(seq), last = errors[errors.length - 1], reach = errors.findIndex(e => e <= 1e-8 * scale);
      // Divergência também quando é lenta: o erro final passou do menor erro visto e a tendência das últimas 10 iterações é de alta.
      const tail = errors.length > 10 ? Math.pow(last / errors[errors.length - 11], 1 / 10) : 1;
      const done = last <= 1e-10 * scale, grew = !done && (last > errors[0] * 10 || (tail > 1.001 && last > Math.min(...errors) * 1.5));
      const status = done ? 'convergiu' : grew ? 'divergiu' : 'parcial';
      const note = status === 'divergiu' ? 'Divergência detectada: o erro cresce' + (A.every((row, i) => Math.abs(row[i]) > row.reduce((s, v, j) => s + (i === j ? 0 : Math.abs(v)), 0)) ? '.' : ' (sem dominância diagonal, a iteração não converge).')
        : status === 'parcial' ? `Trajetória parcial: ${errors.length - 1} iterações sem atingir o critério; último erro ≈ ${fmt(last)}.` : '';
      series.push({ method, errors, diverged: grew, status, note, iterations: errors.length - 1, reach: reach < 0 ? null : reach, ...observedOrder(errors, scale), error: grew ? note : '' });
    }
    const strictDD = A.every((row, i) => Math.abs(row[i]) > row.reduce((s, v, j) => s + (i === j ? 0 : Math.abs(v)), 0));
    return { reference: ref, floor, series, strictDD, gaussOps: Math.round(2 * n * n * n / 3 + 2 * n * n) };
  }

  function validateSystem(A,b) {
    if(!Array.isArray(A)||A.length<2||A.length>6||!Array.isArray(b)||b.length!==A.length||A.some(r=>!Array.isArray(r)||r.length!==A.length||r.some(v=>!Number.isFinite(v)))||b.some(v=>!Number.isFinite(v))) err('O sistema precisa ter de 2 a 6 equações, matriz quadrada e números finitos.');
  }
  // Equilíbrio de escala: divide cada linha e cada coluna pelo seu maior |coeficiente| (duas passadas).
  // Isso não muda o posto, e evita confundir "equação escrita em escala minúscula" com dependência.
  // Ex.: 1e-20·x = 1e-20 e y = 1 tem solução única (1, 1).
  function equilibrate(matrix){
    const a=matrix.map(r=>r.slice()),n=a.length,cols=a[0].length;
    for(let pass=0;pass<2;pass++){
      for(const r of a){const m=Math.max(...r.map(Math.abs));if(m>0)for(let j=0;j<cols;j++)r[j]/=m;}
      for(let j=0;j<cols;j++){const m=Math.max(...a.map(r=>Math.abs(r[j])));if(m>0)for(const r of a)r[j]/=m;}
    }
    return a;
  }
  function requireUnique(A,b) {
    function rank(matrix){
      const a=equilibrate(matrix),n=a.length,cols=a[0].length;
      const scale=Math.max(...a.flat().map(Math.abs));if(scale===0)return 0;
      const threshold=Number.EPSILON*16*Math.max(n,cols)*scale;let row=0;
      for(let c=0;c<cols&&row<n;c++){
        let pivot=row;for(let i=row+1;i<n;i++)if(Math.abs(a[i][c])>Math.abs(a[pivot][c]))pivot=i;
        if(Math.abs(a[pivot][c])<=threshold)continue;
        [a[row],a[pivot]]=[a[pivot],a[row]];
        for(let i=row+1;i<n;i++){const ratio=a[i][c]/a[row][c];for(let j=c;j<cols;j++)a[i][j]-=ratio*a[row][j];}row++;
      }return row;
    }
    const ra=rank(A);
    if(ra<A.length){const rab=rank(A.map((r,i)=>[...r,b[i]]));
      err(rab>ra?'Sistema incompatível pelo teste de posto numérico: nenhuma solução satisfaz todas as equações ao mesmo tempo.':'Sistema sem solução única pelo teste de posto numérico: as equações são dependentes (infinitas soluções) ou tão mal condicionadas que a precisão do computador não as distingue. O teste é feito depois de equilibrar a escala das linhas e colunas.');}
  }
  // Número de condição κ∞ = ||A||∞·||A⁻¹||∞ (n ≤ 6: a inversa sai barata). Indica quantos dígitos se perdem.
  function conditionNumber(A){
    const n=A.length,M=A.map((r,i)=>[...r,...A.map((_,j)=>i===j?1:0)]);
    for(let k=0;k<n;k++){
      let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;
      if(M[p][k]===0)return Infinity;[M[p],M[k]]=[M[k],M[p]];
      for(let i=0;i<n;i++)if(i!==k){const m=M[i][k]/M[k][k];for(let j=k;j<2*n;j++)M[i][j]-=m*M[k][j];}
    }
    const inv=M.map((r,i)=>r.slice(n).map(v=>v/r[i])),norm=X=>Math.max(...X.map(r=>r.reduce((s,v)=>s+Math.abs(v),0)));
    const k=norm(A)*norm(inv);return Number.isFinite(k)?k:Infinity;
  }
  // κ do sistema equilibrado: a escala das equações não conta, só a dependência real entre elas.
  const conditionNote=A=>{const k=conditionNumber(equilibrate(A));return {cond:k,note:k>1e8?` Matriz mal condicionada (κ ≈ ${fmt(Number(k.toPrecision(2)))} depois de equilibrar a escala): perde-se cerca de ${Math.round(Math.log10(k))} dígitos, e pequenas mudanças nos dados mudam muito a solução.`:''};};
  function backwardError(A,b,x) {
    const scale=Math.max(...A.map(r=>r.reduce((s,v)=>s+Math.abs(v),0)))*Math.max(...x.map(Math.abs))+Math.max(...b.map(Math.abs));
    const r=maxResidual(A,b,x); return scale===0?r:r/scale;
  }
  function affine(n, variables) {
    const make=(v=0)=>[v,...variables.map(()=>0)], add=(a,b,k=1)=>a.map((v,i)=>v+k*b[i]), scale=(a,k)=>a.map(v=>v*k), has=a=>a.slice(1).some(v=>v!==0);
    if(n.k==='num')return make(n.v);
    if(n.k==='var'){const a=make();a[variables.indexOf(n.name)+1]=1;return a;}
    if(n.k==='unary')return scale(affine(n.arg,variables),n.op==='-'?-1:1);
    if(n.k==='fn'){const a=affine(n.arg,variables);if(has(a))err('Sistemas aceitam apenas equações lineares.');return make(FUNCS[n.name](a[0]));}
    const a=affine(n.left,variables),b=affine(n.right,variables);
    if(n.op==='+')return add(a,b);if(n.op==='-')return add(a,b,-1);
    if(n.op==='*'){if(has(a)&&has(b))err('Produto de incógnitas não é linear.');return has(a)?scale(a,b[0]):scale(b,a[0]);}
    if(n.op==='/'){if(has(b)||b[0]===0)err('Divida somente por constantes diferentes de zero em sistemas lineares.');return scale(a,1/b[0]);}
    if(has(b)||has(a)&&b[0]!==0&&b[0]!==1)err('Potência de incógnita não linear.');
    return has(a)&&b[0]===1?a:make(Math.pow(a[0],b[0]));
  }
  function parseSystem(source) {
    const lines=String(source).trim().split(/\n+/).map(s=>s.trim()).filter(Boolean);
    if(lines.length<2||lines.length>6)err('Informe de 2 a 6 equações, uma por linha.');
    let A=[],b=[],variables=[];
    if(lines.some(l=>l.includes('|'))){
      variables=Array.from({length:lines.length},(_,i)=>'x'+(i+1));
      lines.forEach((line,i)=>{
        const parts=line.split('|');
        if(parts.length!==2||!parts[0].trim()||!parts[1].trim())err('Linha '+(i+1)+': informe coeficientes | resultado.');
        const coeff=parts[0].trim().split(/[;,\s]+/).map(Number);
        if(coeff.length!==lines.length)err('Linha '+(i+1)+': quantidade incorreta de coeficientes.');
        A.push(coeff);b.push(Number(parts[1]));
      });
    }else{
      const allowed=['x','y','z','u','v','w','x1','x2','x3','x4','x5','x6'];
      const names=String(source).toLowerCase().match(/[a-z]+[0-9]*/g)||[];
      variables=allowed.filter(v=>names.includes(v));
      if(variables.length!==lines.length)err('Use o mesmo número de equações e incógnitas (x, y, z ou x1 até x6).');
      for(const [i,line] of lines.entries()){
        const parts=line.split('=');if(parts.length!==2||!parts.every(p=>p.trim()))err('Linha '+(i+1)+': escreva uma igualdade completa.');
        const left=affine(parseSide(parts[0],variables),variables),right=affine(parseSide(parts[1],variables),variables);
        const row=left.map((v,j)=>v-right[j]);A.push(row.slice(1));b.push(-row[0]);
      }
    }
    validateSystem(A,b);return {A,b,variables};
  }
  const maxResidual = (A,b,x) => Math.max(...A.map((row,i)=>Math.abs(row.reduce((sum,v,j)=>sum+v*x[j],0)-b[i])));
  function gauss(A0, b0, options = {}) {
    const {tolerance}=opts(options); validateSystem(A0,b0); requireUnique(A0,b0); const n = A0.length;
    const A = A0.map(r=>r.slice()), b = b0.slice(), logs=[];
    const push = (label) => logs.push({ i: logs.length+1, detail: label, matrix: A.map((row,k)=>[...row,b[k]]) });
    push('Matriz aumentada inicial');
    for (let k = 0; k < n; k++) {
      let pivot = k;
      for (let i=k+1;i<n;i++) if(Math.abs(A[i][k]) > Math.abs(A[pivot][k])) pivot=i;
      // O teste de posto (com escala equilibrada) já garantiu solução única; aqui só um pivô exatamente nulo impede a divisão.
      if (!(Math.abs(A[pivot][k]) > 0)) err('Sistema sem solução única numericamente identificável: matriz singular ou muito mal condicionada.');
      if (pivot !== k) { [A[pivot],A[k]]=[A[k],A[pivot]]; [b[pivot],b[k]]=[b[k],b[pivot]]; push(`Trocar L${k+1} ↔ L${pivot+1} (pivotamento parcial)`); }
      for(let i=k+1;i<n;i++) {
        const m = A[i][k]/A[k][k];
        A[i][k]=0;
        for(let j=k+1;j<n;j++) A[i][j] -= m*A[k][j];
        b[i]-=m*b[k];
        push(`L${i+1} ← L${i+1} − (${fmt(m)})·L${k+1}`);
      }
    }
    const x=Array(n).fill(0);
    for(let i=n-1;i>=0;i--){
      const rest=A[i].slice(i+1).reduce((sum,c,j)=>sum+c*x[i+j+1],0);
      x[i]=(b[i]-rest)/A[i][i];
      push(`Retrossubstituição: x${i+1} = ${fmt(x[i])}`);
    }
    const residual=maxResidual(A0,b0,x),cn=conditionNote(A0);
    return { method: 'gauss', root: x, residual, steps: logs.length, iterations: logs, backwardError: backwardError(A0,b0,x), cond: cn.cond, converged: Number.isFinite(residual) && backwardError(A0,b0,x) <= tolerance, note: 'Eliminação direta com pivotamento parcial.'+cn.note };
  }
  function seidel(A, b, initial, options={}) {
    const {tolerance,maxIterations}=opts(options);
    validateSystem(A,b); requireUnique(A,b); const n = A.length;
    if(A.some((r,i)=>r[i]===0)) err('Gauss-Seidel exige elementos diagonais não nulos. Reorganize as equações.');
    if(initial.length !== n || initial.some(v=>!Number.isFinite(v))) err('Informe uma aproximação inicial para cada incógnita.');
    const strictDD = A.every((row,i)=>Math.abs(row[i]) > row.reduce((s,v,j)=>s+(i===j?0:Math.abs(v)),0));
    let x=initial.slice();
    const logs=[{i:0, x:x.slice(), error:null, residual:maxResidual(A,b,x), detail:'Vetor inicial'}];
    for(let i=1;i<=maxIterations;i++) {
      const prev=x.slice();
      for(let r=0;r<n;r++) {
        let other=0;
        for(let c=0;c<n;c++) if(c!==r)other+=A[r][c]*x[c];
        x[r]=(b[r]-other)/A[r][r];
      }
      const error=Math.max(...x.map((v,k)=>Math.abs(v-prev[k]))), residual=maxResidual(A,b,x);
      if(x.some(v=>!Number.isFinite(v)||Math.abs(v)>1e14)) err('Gauss-Seidel divergiu. Reordene o sistema ou use Eliminação de Gauss.');
      logs.push({i,x:x.slice(),error,residual,detail:`Iteração ${i}: valores atualizados em sequência`});
      if(backwardError(A,b,x)<=tolerance && error<=tolerance*(1+Math.max(...x.map(Math.abs)))) return {method:'seidel',root:x,residual,backwardError:backwardError(A,b,x),steps:i,iterations:logs,converged:true,note: strictDD?'Matriz estritamente diagonal dominante.':'Convergiu, embora dominância diagonal estrita não tenha sido verificada.'};
    }
    return {method:'seidel',root:x,residual:maxResidual(A,b,x),backwardError:backwardError(A,b,x),steps:maxIterations,iterations:logs,converged:false,note: strictDD?'Limite de iterações atingido.':'Sem dominância diagonal estrita: a convergência não é garantida.'};
  }
  function autoRoot(fn, input, options={}) {
    const a=Number(input.a),b=Number(input.b),x0=Number(input.x0),x1=Number(input.x1);
    let validBracket=false;
    try { validBracket = a < b && value(fn,a)*value(fn,b) <= 0; } catch (_) {}
    let newtonGood=false;
    try {
      const d=derivative(fn,x0);
      const n=x0-value(fn,x0)/d;
      newtonGood=Number.isFinite(n)&&Math.abs(d)>1e-10&&(!validBracket||(n>=a&&n<=b));
    } catch (_) {}
    if(newtonGood){
      try { const r=newton(fn,x0,options); if(r.converged) return { ...r, recommendation: 'Newton-Raphson: derivada numericamente adequada e convergência observada. A rapidez não é garantida em todos os problemas.' }; }catch (_) {}
    }
    if(validBracket) return { ...bisection(fn,a,b,options), recommendation: 'Bisseção: há mudança de sinal no intervalo, favorecendo uma busca robusta e previsível.' };
    try { const r=secant(fn,x0,x1,options); return { ...r, recommendation: 'Secante: não foi encontrado intervalo com sinais opostos; dois pontos iniciais permitem buscar a raiz sem derivada.' }; }
    catch (_) { return { ...newton(fn,x0,options), recommendation: 'Newton-Raphson foi utilizado com a aproximação disponível; verifique a convergência.' }; }
  }

  // Comparação real dos métodos: conta avaliações da função (custo aproximado),
  // em vez de supor que o método com menos iterações é necessariamente o mais rápido.
  function compareRoot(fn, input, options={}) {
    const limits=opts(options);
    const a=Number(input.a), b=Number(input.b), x0=Number(input.x0), x1=Number(input.x1);
    const runners={
      bisection:f=>bisection(f,a,b,limits),
      falseposition:f=>falsePosition(f,a,b,limits),
      newton:f=>newton(f,x0,limits),
      secant:f=>secant(f,x0,x1,limits)
    };
    const comparisons=[], valid=[];
    for(const [method,runner] of Object.entries(runners)){
      let evaluations=0;
      const counted=wrap(fn,x=>{evaluations++;return fn(x);});counted.raw=fn;
      try {
        const r=runner(counted);
        // Um passo pequeno NÃO basta: exigir que a equação esteja realmente satisfeita.
        const trustworthy=r.converged && Number.isFinite(r.root) && r.residual <= limits.tolerance*1.05;
        const sameBracket=!(a<b) || method==='bisection' || (r.root>=a-0.00001 && r.root<=b+0.00001);
        const accepted=trustworthy && sameBracket;
        const entry={method,converged:accepted,steps:r.steps,residual:r.residual,evaluations,
          error:accepted?'':(!sameBracket?'Convergiu para outra raiz.':!r.converged?'Não convergiu.':'Resíduo acima da tolerância.')};
        comparisons.push(entry);
        if(accepted)valid.push({r,evaluations});
      }catch(e){comparisons.push({method,converged:false,steps:null,residual:null,evaluations,error:e.message});}
    }
    // Empate em avaliações: menos atualizações (sem contar os pontos iniciais), depois menor resíduo.
    const upd=r=>Math.max(0,r.method==='secant'?r.steps-2:r.method==='newton'?r.steps-1:r.steps);
    valid.sort((a,b)=>a.evaluations-b.evaluations || upd(a.r)-upd(b.r) || a.r.residual-b.r.residual);
    return {winner:valid[0]||null,comparisons};
  }
  function smartRoot(source, options={}) {
    const fn=parseFunction(source),limits=opts(options),lo=Number(options.min??-40),hi=Number(options.max??40);
    if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi||hi-lo>1e6)err('A busca precisa de mínimo < máximo e largura de até 1.000.000.');
    let totalEvaluations=0;const counted=wrap(fn,x=>{totalEvaluations++;return fn(x);});
    const at=x=>{try{return value(counted,x);}catch(_){return NaN;}};
    const samples=[],candidates=[],count=800,h=(hi-lo)/count,SUB=64,limit=400;
    for(let i=0;i<=count;i++){const x=lo+i*h;samples.push({x,y:at(x)});}
    const finite=samples.filter(p=>Number.isFinite(p.y));
    if(!finite.length)err('A função não tem valores reais finitos nos pontos amostrados. Ajuste o domínio.');
    if(finite.every(p=>p.y===0))err('A expressão é nula em todos os pontos amostrados: identidade ou perda de precisão. Não há uma raiz isolada identificável.');
    const opposite=(u,v)=>Number.isFinite(u)&&Number.isFinite(v)&&u!==0&&v!==0&&Math.sign(u)!==Math.sign(v);
    // Refinamento local: perto de um mínimo de |f|, duas raízes próximas podem caber entre duas amostras.
    const refine=(a,b)=>{let found=0,px=a,py=at(a);for(let k=1;k<=SUB;k++){const x=a+(b-a)*k/SUB,y=at(x);if(opposite(py,y)){candidates.push({a:px,b:x,x0:(px+x)/2,x1:x,kind:'sinal (refino)'});found++;}else if(y===0&&k<SUB){candidates.push({a:px,b:a+(b-a)*(k+1)/SUB,x0:x,x1:x+(b-a)/SUB/3,kind:'amostra (refino)'});found++;}px=x;py=y;}return found;};
    // Borda do domínio (ln, sqrt, 1/x...): aproxima a fronteira em 4 níveis para não perder raízes coladas nela.
    const edge=(bad,good)=>{for(let lv=0;lv<4;lv++){let px=good,py=at(good),nb=null;for(let k=1;k<=SUB;k++){const x=good+(bad-good)*k/SUB,y=at(x);if(!Number.isFinite(y)){nb=x;break;}if(opposite(py,y))candidates.push({a:Math.min(px,x),b:Math.max(px,x),x0:(px+x)/2,x1:x,kind:'sinal (borda)'});px=x;py=y;}if(nb===null)return;bad=nb;good=px;}};
    for(let i=0;i<samples.length;i++){
      const t=samples[i],l=samples[i-1],r=samples[i+1];if(!Number.isFinite(t.y))continue;
      if(l&&!Number.isFinite(l.y))edge(l.x,t.x);
      if(r&&!Number.isFinite(r.y))edge(r.x,t.x);
      if(t.y===0)candidates.push({a:Math.max(lo,t.x-h),b:Math.min(hi,t.x+h),x0:t.x,x1:t.x+h/3,kind:'amostra'});
      if(l&&opposite(l.y,t.y))candidates.push({a:l.x,b:t.x,x0:(l.x+t.x)/2,x1:t.x,kind:'sinal'});
      if(l&&r&&Number.isFinite(l.y)&&Number.isFinite(r.y)&&Math.abs(t.y)<=Math.abs(l.y)&&Math.abs(t.y)<Math.abs(r.y)){
        refine(l.x,r.x);
        if(t.y!==0)candidates.push({a:l.x,b:r.x,x0:t.x+h/5,x1:t.x-h/5,kind:'mínimo local'});
      }
    }
    // Primeiro as trocas de sinal (raiz garantida), depois os mínimos locais; em cada grupo, mais perto de zero primeiro.
    const rank=c=>c.kind.startsWith('sinal')||c.kind.startsWith('amostra')?0:1;
    candidates.sort((a,b)=>rank(a)-rank(b)||Math.abs(a.x0)-Math.abs(b.x0)||b.x0-a.x0);
    const roots=[],same=(u,v)=>Math.abs(u-v)<1e-5*(1+Math.abs(v));
    // Troca de sinal até a precisão da máquina: certifica a raiz quando |f| é grande demais para resíduo 1e-12.
    const certify=guess=>{
      if(!guess.kind.startsWith('sinal'))return null;
      let a=guess.a,b=guess.b,fa=at(a),fb=at(b);if(!opposite(fa,fb))return null;
      const f0=Math.max(Math.abs(fa),Math.abs(fb));
      for(let k=0;k<1100;k++){const m=a+(b-a)/2;if(m<=a||m>=b)break;const fm=at(m);if(!Number.isFinite(fm))return null;if(fm===0){a=b=m;fa=fb=0;break;}if(Math.sign(fm)===Math.sign(fa)){a=m;fa=fm;}else{b=m;fb=fm;}}
      if(!(Math.max(Math.abs(fa),Math.abs(fb))<=1e-3*f0))return null; // polo ou salto: |f| não encolhe perto do ponto
      let log;try{log=bisection(counted,guess.a,guess.b,{tolerance:1e-12,maxIterations:500});}catch(_){return null;}
      return {...log,root:Math.abs(fa)<=Math.abs(fb)?a:b,residual:Math.min(Math.abs(fa),Math.abs(fb)),converged:true,validation:'sinal',bracket:[a,b],certification:{status:'certificada',bracket:[a,b],width:b-a},
        note:'Raiz certificada por troca de sinal: f muda de sinal em um intervalo do tamanho da precisão da máquina, então existe raiz ali (Teorema do Valor Intermediário). O resíduo 1e-12 não é alcançável aqui: o arredondamento do ponto flutuante nos termos de f já é maior que isso.'};
    };
    let tested=0;
    for(const guess of candidates){
      if(tested>=limit||totalEvaluations>400000)break;
      tested++;
      const test=compareRoot(counted,guess,{...limits,tolerance:Math.min(limits.tolerance,1e-12)});
      let rr=test.winner?.r,comparisons=test.comparisons,evaluations=test.winner?.evaluations;
      // Resíduo pequeno só vale se f não for minúscula em toda a vizinhança (evita "raízes fantasmas").
      // Desde a v10 os métodos certificam a raiz (troca de sinal ou fundo de raiz par); essa checagem fica só para o que não veio certificado.
      // Sem isso, numa faixa estreita (um intervalo dado pelo exercício) a vizinhança encolhe junto com h e raízes duplas seriam descartadas.
      if(rr&&!(rr.certification&&(rr.certification.status==='certificada'||rr.certification.status==='multipla'))){
        const delta=Math.max(h*.15,1e-5*(1+Math.abs(rr.root)));
        let localScale=0;for(const x of [rr.root-delta,rr.root+delta]){const y=at(x);if(Number.isFinite(y))localScale=Math.max(localScale,Math.abs(y));}
        if(localScale===0||rr.residual/localScale>1e-7)rr=null;
      }
      if(!rr){
        rr=certify(guess);if(!rr)continue;
        comparisons=comparisons.map(c=>c.method==='bisection'?{...c,converged:true,steps:rr.steps,residual:rr.residual,error:'Aceito por troca de sinal certificada (resíduo limitado pela precisão).'}:c);
        evaluations=rr.steps+2;
      }
      if(roots.some(r=>same(r.root,rr.root)))continue;
      roots.push({validation:'residuo',bracket:null,...rr,initials:guess,comparisons,evaluations});
    }
    roots.sort((a,b)=>Math.abs(a.root)-Math.abs(b.root)||b.root-a.root);
    if(!roots.length)err('Nenhuma raiz isolada foi validada na busca ['+fmt(lo)+', '+fmt(hi)+']. Isso não prova que não existam raízes. Ajuste a faixa ou use um método manual.');
    // Treat near-equal magnitudes consistently (prefer positive).
    if(roots.length>1&&Math.abs(Math.abs(roots[0].root)-Math.abs(roots[1].root))<1e-5&&roots[1].root>roots[0].root)[roots[0],roots[1]]=[roots[1],roots[0]];
    return {...roots[0],roots,search:{min:lo,max:hi,samples:count+1,candidates:candidates.length,tested,totalEvaluations},
      recommendation:'Menor número de avaliações de f entre as execuções convergentes para esta candidata. A comparação usa resíduo de até 1e-12; não mede tempo real. O custo total inclui a busca e os testes.',
      note:(roots[0].validation==='sinal'?roots[0].note+' ':'')+'Busca amostrada e limitada. Raízes aproximadas detectadas, sem garantia de encontrar todas. Resíduo pequeno não garante erro pequeno em x.'};
  }
  function autoSystem(A,b,initial,options={}){
    const limits=opts(options);validateSystem(A,b); requireUnique(A,b); const n=A.length;
    const results=[];
    for(const method of ['gauss','seidel']){
      try{
        const r=method==='gauss'?gauss(A,b,limits):seidel(A,b,initial,limits);
        // Comparação ilustrativa: Gauss ~ 2n³/3 operações, Seidel ~ 2kn².
        const cost=method==='gauss'?Math.round(2*n*n*n/3+2*n*n):Math.round(2*r.steps*n*n);
        results.push({method,result:r,cost,converged:r.converged && backwardError(A,b,r.root)<=limits.tolerance});
      }catch(e){results.push({method,error:e.message,cost:null,converged:false});}
    }
    const good=results.filter(t=>t.converged).sort((a,b)=>a.cost-b.cost);
    if(!good.length)err('Nenhum método encontrou uma solução confiável. Verifique o sistema, a condição da matriz e as aproximações iniciais.');
    const selected=good[0],labels={gauss:'Eliminação de Gauss',seidel:'Gauss-Seidel'};
    return {...selected.result,comparisons:results.map(t=>({method:t.method,converged:t.converged,
      steps:t.result?.steps??null,residual:t.result?.residual??null,cost:t.cost,error:t.error||(!t.converged?(t.result?.note||'Critério não atingido.'):'')})),
      recommendation:`${labels[selected.method]} apresentou menor custo estimado (${selected.cost} operações, modelo simplificado) para este sistema. A estimativa depende das dimensões, iterações e implementação; não mede tempo real de execução.`};
  }

  // ---------- Intervalo dado pelo exercício (v10.1) ----------
  // "Calcule a raiz de f no intervalo [0, 1]": o intervalo é um dado do problema, usado por todos os métodos.
  const hasVar = n => !!n && (n.k === 'var' || hasVar(n.arg) || hasVar(n.left) || hasVar(n.right));
  // Uma ponta do intervalo: número com ponto ou vírgula decimal, ou expressão constante (pi/2, sqrt(2), -1/3).
  function constValue(text, label = 'Ponta do intervalo') {
    const t = String(text ?? '').trim();
    if (!t) err(label + ': está vazia.');
    let ast;
    try { ast = parseSide(t); } catch (_) { err(`${label}: "${t}" não é um número. Use, por exemplo, 0, 1,5, -2 ou pi/2.`); }
    if (hasVar(ast)) err(`${label}: use só números ou constantes (como pi/2), sem x.`);
    const v = evalNode(ast, 0);
    if (!Number.isFinite(v)) err(`${label}: "${t}" não é um número finito.`);
    return v;
  }
  // "[1; 2]", "[1, 2]", "[1,5; 2,5]", "[1.5, 2.5]", "[0, pi/2]". Com vírgula decimal, separe as pontas com ponto e vírgula.
  function parseInterval(text) {
    const t = String(text ?? '').trim().replace(/^\[/, '').replace(/\]$/, '').trim();
    let parts;
    if (t.includes(';')) parts = t.split(';');
    else if (t.split(',').length === 2) parts = t.split(',');
    else if (t.split(/,\s+/).length === 2) parts = t.split(/,\s+/);
    else err('Intervalo: separe as duas pontas com ponto e vírgula, como [1,5; 2,5], ou com vírgula, como [1.5, 2.5].');
    if (parts.length !== 2 || parts.some(q => !q.trim())) err('Intervalo: informe as duas pontas, como [0; 1].');
    const [ta, tb] = parts.map(q => q.trim());
    const a = constValue(ta, 'Ponta a do intervalo'), b = constValue(tb, 'Ponta b do intervalo');
    if (!(a < b)) err(`Intervalo: a ponta da esquerda precisa ser menor que a da direita (recebi a = ${fmt(a)} e b = ${fmt(b)}).`);
    return { a, b, ta, tb };
  }
  // Separa "x^3 - 9x + 3 = 0 em [0; 1]" em equação e intervalo. Aceita também "no intervalo [0, 1]", "x ∈ [0; 1]", "I = [0; 1]"
  // ou só "[0; 1]" no fim. Sem colchetes no fim, devolve a equação inteira e interval = null.
  function splitInterval(source) {
    const src = String(source ?? '');
    const m = /^([\s\S]*?)[\s,;]*(?:(?:para\s+)?x\s*(?:∈|em|in|pertence\s+a)\s*|(?:n?o\s+)?intervalo(?:\s+de)?\s*:?\s*|I\s*=\s*|em\s+|in\s+)?\[([^\[\]]*)\]\s*\.?\s*$/i.exec(src);
    if (!m) return { equation: src.trim(), interval: null };
    if (!m[1].trim()) err('Escreva a equação antes do intervalo, como x² − 2 = 0 em [1; 2].');
    return { equation: m[1].trim(), interval: parseInterval(m[2]) };
  }
  const safeAt = fn => x => { try { const y = fn(x); return Number.isFinite(y) ? y : NaN; } catch (_) { return NaN; } };
  // Pontos iniciais dentro de [a, b] para os métodos abertos, quando o exercício só dá o intervalo.
  // Newton: a ponta onde f(x)·f″(x) > 0 (condição de Fourier: a primeira tangente não sai do intervalo); sem ela, o ponto médio.
  // A Secante usa as duas pontas.
  function intervalStart(fn, a, b) {
    const at = safeAt(fn), h = (b - a) * 1e-3, fa = at(a), fb = at(b), mid = a + (b - a) / 2;
    const d2a = (fa - 2 * at(a + h) + at(a + 2 * h)) / (h * h), d2b = (fb - 2 * at(b - h) + at(b - 2 * h)) / (h * h);
    let x0 = mid, why = 'ponto médio do intervalo';
    if (fa * d2a > 0) { x0 = a; why = 'ponta a, onde f(a)·f″(a) > 0 (condição de Fourier)'; }
    else if (fb * d2b > 0) { x0 = b; why = 'ponta b, onde f(b)·f″(b) > 0 (condição de Fourier)'; }
    return { a, b, x0, x1: x0 === b ? a : b, fa, fb, why };
  }
  // Sub-intervalo "redondo" em volta de uma raiz simples, dentro de [A, B]: [0,3; 0,4] em vez de [0,31; 0,32].
  function roundBracket(at, root, A, B) {
    const tidy = v => Number(v.toPrecision(12));
    for (let step = Math.pow(10, Math.floor(Math.log10((B - A) / 4))); step >= (B - A) * 1e-9; step /= 10) {
      let u = Math.floor(root / step) * step, v = u + step;
      if (Math.abs(root - u) < step * 1e-9) { u -= step / 2; v = u + step; } // raiz exatamente na grade: centraliza
      u = tidy(Math.max(A, u)); v = tidy(Math.min(B, v));
      if (u < root && root < v) { const fu = at(u), fv = at(v); if (fu * fv < 0) return { a: u, b: v, root }; }
    }
    return null;
  }
  // Onde f troca de sinal dentro de [a, b] (até 6 lugares). Serve para sugerir sub-intervalos quando f(a) e f(b) têm o mesmo sinal.
  // Polos, como em 1/x, também trocam de sinal; ficam de fora porque |f| não encolhe quando o pedaço é dividido.
  function signChanges(fn, a, b, n = 400) {
    const at = safeAt(fn), out = [], step = (b - a) / n;
    const keep = (u, v, fu, fv) => {
      let lo = u, hi = v, flo = fu;
      for (let k = 0; k < 80; k++) { const m = lo + (hi - lo) / 2, fm = at(m); if (!Number.isFinite(fm)) return; if (fm === 0) { lo = hi = m; break; } if (Math.sign(fm) === Math.sign(flo)) { lo = m; flo = fm; } else hi = m; }
      const root = lo + (hi - lo) / 2, fr = at(root);
      if (!(Math.abs(fr) <= 1e-3 * Math.max(Math.abs(fu), Math.abs(fv)))) return;
      if (out.some(o => Math.abs(o.root - root) < step)) return;
      out.push(roundBracket(at, root, a, b) || { a: Number(u.toPrecision(12)), b: Number(v.toPrecision(12)), root });
    };
    let px = a, py = at(a);
    for (let i = 1; i <= n && out.length < 6; i++) {
      const x = i === n ? b : a + step * i, y = at(x);
      if (Number.isFinite(py) && Number.isFinite(y) && py !== 0) {
        if (y !== 0 && Math.sign(py) !== Math.sign(y)) keep(px, x, py, y);
        else if (y === 0 && i < n) { const y2 = at(x + step); if (Number.isFinite(y2) && y2 !== 0 && Math.sign(y2) !== Math.sign(py)) keep(px, x + step, py, y2); }
      }
      px = x; py = y;
    }
    return out;
  }
  // Iterações para a largura do intervalo da Bisseção ficar ≤ ε: (b − a)/2ⁿ ≤ ε, ou seja, n ≥ log₂((b − a)/ε).
  const bisectionBound = (a, b, eps) => Math.max(0, Math.ceil(Math.log2((b - a) / eps) - 1e-12));
  // Teorema do ponto fixo no intervalo: se g leva [a, b] em [a, b] e max |g′| < 1 ali, há um único ponto fixo e a iteração converge.
  function fixedPointCheck(g, a, b, n = 40) {
    let maxD = 0, maps = true;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n; let gx, d;
      try { gx = value(g, x); d = Math.abs(derivative(g, x)); } catch (_) { return null; }
      if (!Number.isFinite(d)) return null;
      maxD = Math.max(maxD, d); if (gx < a - 1e-12 * (1 + Math.abs(a)) || gx > b + 1e-12 * (1 + Math.abs(b))) maps = false;
    }
    return { maxD, maps };
  }

  global.NumeraMath = { parseFunction, parseSystem, bisection, falsePosition, newton, secant, fixedPoint, gauss, seidel, autoRoot, smartRoot, compareRoot, autoSystem, convergenceRoot, convergenceSystem, convergenceStart, observedOrder, value, derivative, fmt, maxResidual, backwardError, validateSystem, certifyRoot, conditionNumber, equilibrate, constValue, parseInterval, splitInterval, intervalStart, signChanges, bisectionBound, fixedPointCheck };
})(window);
