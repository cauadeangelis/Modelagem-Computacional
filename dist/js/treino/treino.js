/* Numera Academy — aba Treino (v9).
   140 problemas misturados (20 por método): a pessoa diagnostica o melhor método, resolve e confere no gabarito.
   v9: Falsa Posição e Ponto Fixo, pergunta sem o nome do método até o diagnóstico, dicas por erro típico,
   gráfico de convergência no gabarito, modo prova com nota e relatório, e revisão espaçada dos diagnósticos.
   Os dados ficam em treino-data.js (gerado e conferido por tests/treino). app.js chama NumeraTreinoUI(helpers).
   O progresso fica numa chave própria do navegador e não altera o XP das trilhas.
   v10: estado salvo validado ao carregar, entra no backup único, estado "visto com ajuda", prova encerrada
   pelo tempo abre o relatório, foco e anúncios para leitor de tela. */
(function (global) {
  'use strict';
  global.NumeraTreinoUI = function (h) {
    const { safe, icon, btn, tag, bar, method, parseAnswer, openInLab, storage, render } = h;
    const nav = h.nav || (() => {}), announce = h.announce || (() => {}), focusNext = h.focus || (() => {});
    // v11: métodos escondidos (NumeraContent.HIDDEN) saem do Treino, da prova e do gabarito. Os exercícios continuam no arquivo,
    // com o mesmo id (o progresso guardado não se perde); a numeração na tela é refeita e dois métodos iguais não ficam seguidos.
    const HIDDEN = (global.NumeraContent && global.NumeraContent.HIDDEN) || [];
    if (global.NumeraTreino && !global.NumeraTreino.all) global.NumeraTreino.all = global.NumeraTreino.exercises || [];
    const DATA = (() => {
      const list = ((global.NumeraTreino && global.NumeraTreino.all) || []).filter(e => !HIDDEN.includes(e.method));
      for (let i = 1; i < list.length; i++) if (list[i].method === list[i - 1].method) {
        const j = list.findIndex((e, k) => k > i && e.method !== list[i - 1].method && (!list[i + 1] || e.method !== list[i + 1].method));
        if (j > 0) [list[i], list[j]] = [list[j], list[i]];
      }
      return list.map((e, i) => (e.n === i + 1 ? e : Object.assign({}, e, { n: i + 1 })));
    })();
    if (global.NumeraTreino) global.NumeraTreino.exercises = DATA;
    const BY_ID = new Map(DATA.map(e => [e.id, e]));
    const KEY = 'numera-treino-v9', OLD_KEY = 'numera-treino-v8';
    const ORDER = ['bisection', 'falseposition', 'fixedpoint', 'newton', 'secant', 'gauss', 'seidel'].filter(id => !HIDDEN.includes(id));
    const TOOL = {
      bisection: 'Sinais opostos e erro garantido de antemão',
      falseposition: 'Sinais opostos e curva quase reta: corte pela corda',
      fixedpoint: 'Equação na forma x = g(x), com |g′| < 1',
      newton: 'Derivada fácil e bom chute inicial',
      secant: 'Sem derivada, com dois palpites (sem troca de sinal)',
      gauss: 'Sistema pequeno, solução exata direta',
      seidel: 'Sistema dominante, grande ou com chute: iterativo'
    };
    const ROOT_VS_SYS = 'Gauss e Gauss-Seidel resolvem sistemas lineares; aqui há uma única equação não linear em x.';
    const SYS_VS_ROOT = 'Bisseção, Falsa Posição, Ponto Fixo, Newton e Secante procuram raízes de uma equação em x. Aqui são várias equações lineares ao mesmo tempo.';
    const WHY_NOT = {
      bisection: {
        falseposition: 'A Falsa Posição também mantém a raiz cercada, mas não dá a cota (b − a)/2ⁿ antes de começar, e em curvas tortas uma das pontas fica parada e ela anda devagar. As pistas aqui pediam garantia de erro (ou mostravam uma curva torta demais para a corda).',
        fixedpoint: 'O Ponto Fixo precisa reescrever a equação como x = g(x) com |g′| < 1, e não garante ficar no intervalo nem dá cota de erro antes de começar.',
        newton: 'Newton é mais rápido quando há derivada boa e chute perto da raiz, mas não garante ficar no intervalo nem dá cota de erro antes de começar, e a pista aqui era essa garantia.',
        secant: 'A Secante também dispensa derivada, mas pode sair do intervalo e não oferece cota de erro garantida.'
      },
      falseposition: {
        bisection: 'A Bisseção funcionaria, mas corta sempre no meio, sem olhar os valores de f. Numa curva quase reta, a corda da Falsa Posição cai muito mais perto da raiz: menos avaliações, com a mesma garantia de intervalo.',
        fixedpoint: 'O Ponto Fixo exigiria reescrever a equação como x = g(x) com |g′| < 1, e não mantém a raiz cercada.',
        newton: 'Newton exigiria a derivada e poderia sair do intervalo. Aqui não há derivada à mão e a raiz precisa continuar cercada.',
        secant: 'A Secante usa a mesma ideia de corda, mas descarta o ponto mais antigo mesmo que a raiz escape. Com sinais opostos e a exigência de manter a raiz cercada, a Falsa Posição é a escolha segura.'
      },
      fixedpoint: {
        bisection: 'A Bisseção precisaria de um intervalo com troca de sinal e ganharia só um “bit” de precisão por passo. A equação já vem pronta como x = g(x), com contração: basta reaplicar g.',
        falseposition: 'A Falsa Posição precisaria de um intervalo com troca de sinal. Aqui a equação já vem como x = g(x), com |g′| < 1, e um único chute basta.',
        newton: 'Newton costuma ser mais rápido, mas exige a derivada. Aqui g já é uma contração (|g′| < 1): reaplicar a mesma fórmula é simples e barato, sem derivar nada.',
        secant: 'A Secante precisaria de dois palpites e de reescrever tudo como f(x) = 0. A forma x = g(x) com contração já entrega um processo iterativo pronto, com um único chute.'
      },
      newton: {
        bisection: 'A Bisseção funcionaria, mas ganha só um “bit” de precisão por passo. Com derivada fácil e chute bom, Newton chega em poucas iterações.',
        falseposition: 'A Falsa Posição precisaria de um intervalo com troca de sinal e converge só linearmente. Com derivada fácil e chute bom, Newton dobra as casas corretas a cada passo.',
        fixedpoint: 'O Ponto Fixo também chegaria lá se |g′| < 1, mas converge de forma linear: o erro cai por um fator fixo a cada passo. Com derivada fácil e chute bom, Newton é quadrático.',
        secant: 'A Secante evita a derivada, mas aqui f′ é fácil e há um só chute: Newton converge mais rápido (ordem 2 contra ≈ 1,6).'
      },
      secant: {
        bisection: 'A Bisseção precisa de sinais opostos nas pontas e é lenta. A Secante usa os dois palpites que você já tem e converge bem mais rápido.',
        falseposition: 'A Falsa Posição também traça uma corda, mas exige f(a) e f(b) com sinais opostos. Aqui os palpites não cercam a raiz, então ela nem começa.',
        fixedpoint: 'O Ponto Fixo exigiria uma reescrita x = g(x) com |g′| < 1, que não aparece aqui. A Secante trabalha direto com f e com os dois palpites que você já tem.',
        newton: 'Newton exigiria f′, que aqui é trabalhosa, cara ou indisponível. A Secante aproxima a derivada com os dois últimos pontos.'
      },
      gauss: { seidel: 'Gauss-Seidel é iterativo e só tem convergência garantida com condições como dominância diagonal. Aqui o sistema é pequeno, sem essa garantia, e se quer o valor exato.' },
      seidel: { gauss: 'Gauss resolveria, mas em sistemas grandes e esparsos o escalonamento custa da ordem de n³ e enche a matriz de números. Com dominância diagonal e um bom chute, Gauss-Seidel converge barato.' }
    };
    const isSys = m => m === 'gauss' || m === 'seidel';
    const whyNot = (right, chosen) => (WHY_NOT[right] && WHY_NOT[right][chosen]) || (isSys(right) ? SYS_VS_ROOT : ROOT_VS_SYS);

    // ---------- progresso salvo (com migração da v8: só exercícios que não mudaram)
    // normalize: aceita só ids conhecidos, tipos certos e tamanhos limitados. Um JSON editado à mão, uma migração
    // incompleta ou uma extensão do navegador não conseguem quebrar a tela; o que não fizer sentido é descartado.
    const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));
    const isIso = v => typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v));
    const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    const strs = (a, n, len) => Array.isArray(a) ? a.slice(0, n).map(v => String(v ?? '').slice(0, len)) : [];
    function normalize(raw) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      for (const [id, v] of Object.entries(raw)) {
        if (!BY_ID.has(id) || !v || typeof v !== 'object' || Array.isArray(v)) continue;
        const r = {};
        if (ORDER.includes(v.d)) { r.d = v.d; r.dOk = v.d === BY_ID.get(id).method; }
        if (int(v.tries, 0, 10000)) r.tries = v.tries;
        if (v.ok === true) r.ok = true;
        if (v.key === true) r.key = true;
        if (v.keyFirst === true) r.keyFirst = true;
        if (isDate(v.at)) r.at = v.at;
        if (v.rv && isDate(v.rv.due) && [1, 3, 7, 14].includes(v.rv.int)) r.rv = { due: v.rv.due, int: v.rv.int };
        if (Object.keys(r).length) out[id] = r;
      }
      if (int(raw._migrated, 0, DATA.length)) out._migrated = raw._migrated;
      const pr = raw._prova;
      if (pr && Array.isArray(pr.ids) && pr.ids.length && pr.ids.length <= 15 && pr.ids.every(id => BY_ID.has(id)) && new Set(pr.ids).size === pr.ids.length
        && int(pr.i, 0, pr.ids.length - 1) && Number.isFinite(pr.start) && pr.start > 0 && [0, 20, 30, 45].includes(pr.limit)) {
        const ans = {};
        for (const [id, a] of Object.entries(pr.ans || {})) if (pr.ids.includes(id) && a && typeof a === 'object') { const x = {}; if (ORDER.includes(a.d)) x.d = a.d; const raw2 = strs(a.raw, 6, 40); if (raw2.length) x.raw = raw2; ans[id] = x; }
        out._prova = { ids: pr.ids.slice(), i: pr.i, ans, start: pr.start, limit: pr.limit, name: String(pr.name || '').slice(0, 60) };
      }
      const L = raw._provaLast;
      if (L && Array.isArray(L.items) && L.items.length && L.items.length <= 15 && L.items.every(x => x && BY_ID.has(x.id)) && Number.isFinite(L.nota) && L.nota >= 0 && L.nota <= 10) {
        out._provaLast = { date: isIso(L.date) ? L.date : new Date().toISOString(), name: String(L.name || '').slice(0, 60), n: L.items.length, limit: [0, 20, 30, 45].includes(L.limit) ? L.limit : 0,
          secs: int(L.secs, 0, 1e7) ? L.secs : 0, timeout: L.timeout === true, nota: L.nota, dOk: int(L.dOk, 0, 15) ? L.dOk : 0, aOk: int(L.aOk, 0, 15) ? L.aOk : 0,
          items: L.items.map((x, k) => ({ id: x.id, k: k + 1, d: ORDER.includes(x.d) ? x.d : null, dOk: x.dOk === true, raw: strs(x.raw, 6, 40), ansOk: x.ansOk === true, trap: String(x.trap || '').slice(0, 400), pts: [0, 0.4, 0.6, 1].includes(x.pts) ? x.pts : 0 })) };
      }
      if (Array.isArray(raw._provas)) out._provas = raw._provas.filter(x => x && isIso(x.date) && Number.isFinite(x.nota) && x.nota >= 0 && x.nota <= 10 && int(x.n, 1, 15) && int(x.secs, 0, 1e7)).slice(0, 10).map(x => ({ date: x.date, nota: x.nota, n: x.n, secs: x.secs }));
      return out;
    }
    function load() {
      try { const raw = storage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (_) { return {}; }
      try {
        const old = JSON.parse(storage.getItem(OLD_KEY) || 'null');
        if (old && typeof old === 'object') {
          const map = {}; DATA.forEach(e => { if (e.legacy) map[e.legacy] = e.id; });
          const p = {}; let n = 0;
          for (const [k, v] of Object.entries(old)) if (map[k] && v && typeof v === 'object') { p[map[k]] = { d: v.d, dOk: v.dOk, tries: v.tries, ok: v.ok, keyFirst: v.keyFirst, key: v.key, at: v.at }; n++; }
          p._migrated = n; const q = normalize(p); try { storage.setItem(KEY, JSON.stringify(q)); } catch (_) {}
          return q;
        }
      } catch (_) {}
      return {};
    }
    let prog = load(), saveFailed = false;
    // save devolve se gravou de verdade; quando o navegador recusa (cheio, bloqueado, modo privado), a tela avisa.
    const save = () => { try { storage.setItem(KEY, JSON.stringify(prog)); saveFailed = false; return true; } catch (_) { saveFailed = true; return false; } };
    const T = { view: 'ex', cur: 0, filter: 'all', answers: {}, fb: null, key: false, showAll: false, confirmReset: false, rev: null, pvConfirm: false, pvSetup: { n: 10, limit: 30, name: '' } };
    const P = e => prog[e.id] || {};
    // Estados explícitos (v10). "Visto com ajuda": o gabarito foi aberto antes do acerto; não conta como resolvido sozinho.
    const helped = r => !!r.key && (!r.ok || !!r.keyFirst);
    const status = e => {
      const r = P(e);
      if (r.ok && !r.keyFirst) return r.dOk ? 'perfect' : 'solved';
      if (r.d && !r.dOk) return 'missed';
      if (helped(r)) return 'helped';
      if (r.tries || r.d) return 'trying';
      return 'new';
    };
    const STATUS_LABEL = { new: 'Novo', diagnosed: 'Em andamento', trying: 'Em andamento', missed: 'Diagnóstico a revisar', helped: 'Visto com ajuda', solved: 'Resolvido', perfect: 'Perfeito' };

    // ---------- revisão espaçada dos diagnósticos (1, 3, 7 e 14 dias)
    const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = () => ymd(new Date());
    const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
    function scheduleMiss(e) { const r = prog[e.id] = { ...P(e) }; r.rv = { due: today(), int: 1 }; }
    function reviewAnswer(e, ok) {
      const r = prog[e.id] = { ...P(e) }, cur = r.rv || { int: 0 };
      if (!ok) r.rv = { due: inDays(1), int: 1 };
      else { const next = cur.int < 1 ? 1 : cur.int < 3 ? 3 : cur.int < 7 ? 7 : cur.int < 14 ? 14 : 0; if (next) r.rv = { due: inDays(next), int: next }; else delete r.rv; }
      save();
    }
    const reviewList = () => DATA.filter(e => P(e).rv);
    const reviewDue = () => reviewList().filter(e => P(e).rv.due <= today());

    // ---------- formatação
    // Fórmula da sintaxe do motor para HTML com expoentes de verdade (<sup>), vírgula decimal e sinais tipográficos.
    function mathHtml(src) {
      let s = String(src).replace(/exp\(([^()]*)\)/g, 'e^($1)').replace(/abs\(([^()]*)\)/g, '|$1|')
        .replace(/sqrt\(/g, '√(').replace(/asin\(/g, 'arcsen(').replace(/(^|[^a-z])pi(?![a-z])/g, '$1π');
      const esc = (c, i) => c === '*' ? '·' : c === '-' ? '−' : c === '.' && /\d/.test(s[i - 1] || '') && /\d/.test(s[i + 1] || '') ? ',' : ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c);
      let out = '', i = 0;
      while (i < s.length) {
        if (s[i] === '^') {
          let j = i + 1; while (s[j] === ' ') j++;
          if (s[j] === '(') {
            let d = 0, k = j; for (; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')' && --d === 0) break; }
            out += '<sup>' + mathHtml(s.slice(j + 1, k)) + '</sup>'; i = k + 1; continue;
          }
          const m = /^[+\-−]?(?:\d+(?:[.,]\d+)?|[a-zA-Z]+)/.exec(s.slice(j));
          if (m) { out += '<sup>' + mathHtml(m[0]) + '</sup>'; i = j + m[0].length; continue; }
        }
        out += esc(s[i], i); i++;
      }
      return out;
    }
    // Texto corrido: escapa e transforma ^{...} e ^−24 em expoentes.
    const typo = t => safe(t).replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>').replace(/\^([−-]?\d+(?:,\d+)?)/g, '<sup>$1</sup>');
    const tolTxt = v => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 12 });
    const br = v => {
      if (typeof v !== 'number' || !Number.isFinite(v)) return String(v);
      const a = Math.abs(v);
      if (a !== 0 && (a < 1e-4 || a >= 1e9)) return v.toExponential(4).replace(/\.?0+e/, 'e').replace('.', ',').replace('e', '·10^').replace('-', '−');
      return Number(v.toPrecision(10)).toLocaleString('pt-BR', { maximumFractionDigits: 8 }).replace('-', '−');
    };
    function cues(story, reveal) {
      return typo(story).replace(/\[\[(.+?)\|([^|\]]+)\]\]/g, (_, text, label) => reveal
        ? `<mark class="cue"><span>${text}</span><small>${label}</small></mark>` : text);
    }
    const cueList = story => [...story.matchAll(/\[\[(.+?)\|([^|\]]+)\]\]/g)].map(m => m[2]);
    const plainStory = story => story.replace(/\[\[(.+?)\|([^|\]]+)\]\]/g, '$1');
    function formula(e) {
      if (isSys(e.method)) return `<div class="tr-formula sys">${e.system.map(l => `<div>${mathHtml(l)}</div>`).join('')}</div>`;
      if (e.g) return `<div class="tr-formula">x = ${mathHtml(e.g)}<span>Encontre o x que satisfaz x = g(x)</span></div>`;
      return `<div class="tr-formula">f(x) = ${mathHtml(e.source)}<span>Resolva f(x) = 0</span></div>`;
    }
    const given = e => `<div class="tr-given">${e.given.map(([k, v]) => `<span><small>${safe(k)}</small><b>${mathHtml(String(v))}</b></span>`).join('')}</div>`;
    const answerText = e => e.answer.type === 'vec' ? e.answer.names.map((n, i) => `${n} ≈ ${br(e.answer.values[i])}`).join(' · ') : (e.answer.type === 'int' ? String(e.answer.value) : br(e.answer.value));

    // ---------- conferência (com erros típicos)
    function close(u, v, a) {
      if (a.abs) return Math.abs(u - v) <= a.abs + 1e-12;
      if (a.type === 'int') return Math.round(u) === v && Math.abs(u - v) < 1e-9;
      return Math.abs(u - v) <= Math.max(6e-4 * Math.abs(v), 1e-9);
    }
    const want = e => e.answer.type === 'vec' ? e.answer.values : [e.answer.value];
    const trapHit = (e, vals) => (e.traps || []).find(t => { const tv = Array.isArray(t.v) ? t.v : [t.v]; return tv.length === vals.length && tv.every((u, i) => close(vals[i], u, e.answer)); });
    function grade(e, raw) {
      let vals; try { vals = raw.map(parseAnswer); } catch (err) { return { error: err.message }; }
      const w = want(e), good = vals.map((v, i) => close(v, w[i], e.answer));
      return { vals, good, ok: good.every(Boolean), trap: good.every(Boolean) ? null : trapHit(e, vals) };
    }
    const fieldIds = (e, pre) => e.answer.type === 'vec' ? e.answer.names.map((_, i) => `${pre}-${i}`) : [`${pre}-0`];
    const readFields = (ids, store) => ids.map(id => { const el = document.getElementById ? document.getElementById(id) : null; return el ? el.value : (store[id] || ''); });
    function check(e) {
      const a = e.answer, ids = fieldIds(e, 'tr-ans'), raw = readFields(ids, T.answers);
      ids.forEach((id, i) => { T.answers[id] = raw[i]; });
      const g = grade(e, raw);
      if (g.error) { T.fb = { ok: false, msg: g.error }; return; }
      const r = prog[e.id] = { ...P(e) };
      r.tries = (r.tries || 0) + 1;
      if (g.ok) {
        if (!r.ok) { r.ok = true; r.keyFirst = !!r.key; r.at = today(); }
        T.fb = { ok: true, msg: r.dOk && !r.keyFirst ? 'Diagnóstico e resposta certos, sem gabarito. Perfeito! ★' : 'Resposta certa. Veja o gabarito para comparar o caminho.' };
      } else if (g.trap) {
        T.fb = { ok: false, trap: true, msg: g.trap.m };
      } else {
        const w = want(e), near = g.vals.every((v, i) => g.good[i] || Math.abs(v - w[i]) <= 0.01 * (Math.abs(w[i]) + 1e-9));
        const wrongNames = a.type === 'vec' ? a.names.filter((_, i) => !g.good[i]).join(', ') : '';
        T.fb = { ok: false, msg: (near ? (a.abs ? `Quase! Está perto, mas a tolerância deste exercício é ${tolTxt(a.abs)}: use mais casas decimais.` : 'Quase! Está perto, mas fora da precisão pedida. Use pelo menos 4 algarismos significativos.') : 'Ainda não. Refaça a conta passo a passo; se travar, abra o gabarito.') + (wrongNames ? ` Confira: ${wrongNames}.` : '') };
      }
      save();
    }

    // ---------- gráfico de convergência do gabarito (calculado pelo motor, guardado por exercício)
    const convCache = new Map();
    function convChart(e) {
      const M = global.NumeraMath, V = global.NumeraConv;
      if (!M || !V || !e.conv) return '';
      if (convCache.has(e.id)) return convCache.get(e.id);
      let html = '';
      try {
        const titles = Object.assign(Object.fromEntries(ORDER.map(id => [id, method(id).title])), { jacobi: 'Jacobi (comparação)' });
        if (isSys(e.method)) {
          const { A, b } = M.parseSystem(e.source), cv = M.convergenceSystem(A, b, e.conv.initial);
          const cap = e.method === 'gauss'
            ? `Aqui ${cv.strictDD ? 'a matriz é diagonal dominante' : 'a matriz não é diagonal dominante'}: veja o que os métodos iterativos fazem a partir de (${e.conv.initial.join('; ')}). A Eliminação de Gauss resolve direto, com cerca de ${cv.gaussOps} operações e sem depender de convergência.`
            : `Gauss-Seidel contra Jacobi a partir do mesmo vetor inicial. Cada linha de grade horizontal é um fator de 10 no erro. Com dominância diagonal, os dois convergem e o Seidel costuma precisar de menos iterações.`;
          html = V.chart(cv, { titles, highlight: e.method === 'seidel' ? 'seidel' : null, title: 'Convergência: este sistema, método a método', subtitle: 'Erro ||xₖ − x*||∞ por iteração, em escala logarítmica.', caption: safe(cap) });
        } else {
          const c = e.conv, cv = M.convergenceRoot(M.parseFunction(e.source), { ...c, g: c.g && !HIDDEN.includes('fixedpoint') ? M.parseFunction(c.g) : null, reference: e.root });
          const sub = `Mesmos dados para todos: [a; b] = [${br(c.a)}; ${br(c.b)}], x₀ = ${br(c.x0)}, x₁ = ${br(c.x1)}${c.g ? `, g(x) do enunciado` : ''}.`;
          html = V.chart(cv, { titles, highlight: e.method, title: 'Convergência: este problema, método a método', subtitle: sub,
            caption: safe('Erro |xₖ − x*| em escala logarítmica: cada linha de grade é um fator de 10. Reta descendente = convergência linear (Bisseção, Falsa Posição, Ponto Fixo); curva que mergulha cada vez mais rápido = ordem maior (Secante ≈ 1,6; Newton = 2). Os dados de partida são equivalentes, não idênticos ao enunciado, para que todos os métodos possam rodar.' + (c.g ? '' : ' O Ponto Fixo não aparece porque este problema não traz uma g(x).')) });
        }
      } catch (err) { html = `<p class="fine">Gráfico indisponível: ${safe(err.message)}</p>`; }
      convCache.set(e.id, html);
      return html;
    }

    // ---------- partes da tela
    function toolButtons(e, chosen, act = 'tr-diag', reveal = true) {
      return `<div class="tr-tools" role="group" aria-label="Escolha o método">${ORDER.map(id => {
        const m = method(id), cls = !chosen ? '' : !reveal ? (id === chosen ? 'picked' : '') : id === e.method ? 'right' : id === chosen ? 'wrong' : 'off';
        const lock = chosen && reveal;
        return `<button type="button" class="tr-tool ${cls}" data-act="${act}" data-id="${id}" ${lock ? 'disabled' : ''} aria-pressed="${chosen === id}"><span class="symbol small tone-${id}" aria-hidden="true">${safe(m.symbol)}</span><span class="tr-tool-text"><b>${m.title}</b><small>${TOOL[id]}</small></span>${lock && id === e.method ? `<span class="tr-tool-mark" role="img" aria-label="melhor método">${icon('check')}</span>` : ''}</button>`;
      }).join('')}</div>`;
    }
    function verdict(e, chosen) {
      const ok = chosen === e.method, right = method(e.method);
      return `<div class="tr-verdict ${ok ? 'ok' : 'bad'}" role="status"><b>${ok ? 'Diagnóstico certeiro.' : `Não é a melhor escolha. O mais indicado é ${right.title}.`}</b><p>${typo(e.why)}</p>${ok ? '' : `<p class="fine"><b>Por que não ${method(chosen).title}?</b> ${safe(whyNot(e.method, chosen))}</p>`}<p class="tr-cues-label">Pistas no enunciado: ${cueList(e.story).map(l => `<span class="tr-cue-chip">${safe(l)}</span>`).join('')}</p></div>`;
    }
    function solveBlock(e) {
      const r = P(e), a = e.answer, locked = !r.d, m = method(e.method);
      const fields = a.type === 'vec'
        ? `<div class="tr-vec">${a.names.map((n, i) => `<label class="tr-field" for="tr-ans-${i}"><span>${n} =</span><input id="tr-ans-${i}" inputmode="decimal" autocomplete="off" value="${safe(T.answers['tr-ans-' + i] || '')}" ${locked ? 'disabled' : ''}></label>`).join('')}</div>`
        : `<label class="tr-field single" for="tr-ans-0"><span>${a.type === 'int' ? 'n =' : 'Resposta'}</span><input id="tr-ans-0" inputmode="decimal" autocomplete="off" placeholder="${a.type === 'int' ? 'número inteiro' : 'ex.: 1,4142'}" value="${safe(T.answers['tr-ans-0'] || '')}" ${locked ? 'disabled' : ''}></label>`;
      return `<form id="tr-form" class="tr-step ${locked ? 'locked' : ''}" data-id="${e.id}"><div class="tr-step-head"><span class="tr-step-n">2</span><div><h3>Resolva</h3><p>${typo(locked ? e.askBlind || e.ask : e.ask)}</p></div></div>
        ${locked ? '<p class="fine">Faça o diagnóstico primeiro: escolher o método é metade do exercício. A pergunta completa aparece depois.</p>' : `<p class="tr-reminder"><span class="symbol small tone-${e.method}" aria-hidden="true">${safe(m.symbol)}</span><span><b>${m.title}:</b> ${safe(m.formula || '')}</span></p>`}
        ${fields}
        <p class="fine">Use vírgula ou ponto. Responda com pelo menos 4 algarismos significativos${a.abs ? ` (tolerância ${tolTxt(a.abs)})` : ''}. Frações como 17/12 também valem.</p>
        ${T.fb ? `<div class="tr-verdict ${T.fb.ok ? 'ok' : 'bad'}" role="status"><b>${T.fb.ok ? 'Correto!' : T.fb.trap ? 'Erro típico identificado.' : 'Ainda não.'}</b> ${safe(T.fb.msg)}${T.fb.trap ? ' Corrija esse ponto e confira de novo.' : ''}</div>` : ''}
        <div class="row-actions"><button class="btn primary" type="submit" ${locked ? 'disabled' : ''}>${r.ok ? 'Conferir de novo' : 'Conferir'}</button>${locked ? '' : btn(icon('lab') + ' Conferir no terminal', 'tr-lab', 'ghost')}</div></form>`;
    }
    function steps(e) {
      const s = e.steps;
      if (s.kind === 'text') return `<div class="tr-lines">${s.lines.map(l => `<p>${typo(l)}</p>`).join('')}</div>`;
      if (s.kind === 'gauss') return `<ol class="tr-gauss">${s.steps.map(st => `<li><p>${safe(st.t)}</p>${st.m ? `<div class="matrix-wrap"><table class="matrix"><tbody>${st.m.map(row => `<tr>${row.map((v, j) => `<td class="${j === row.length - 1 ? 'rhs' : ''}">${safe(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</li>`).join('')}</ol>`;
      return `${s.formulas ? `<div class="tr-lines"><p><b>Fórmulas de atualização</b></p>${s.formulas.map(f => `<p><code>${safe(f)}</code></p>`).join('')}</div>` : ''}<div class="table-scroll"><table class="tr-table"><thead><tr>${s.cols.map(c => `<th>${safe(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(v => `<td class="numeric">${typo(String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${s.note ? `<p class="fine">${typo(s.note)}</p>` : ''}`;
    }
    function keyBlock(e) {
      const r = P(e), m = method(e.method);
      if (!T.key) return `<div class="tr-step"><div class="tr-step-head"><span class="tr-step-n">3</span><div><h3>Gabarito</h3><p>${r.ok ? 'Compare o seu caminho com o passo a passo e com o gráfico de convergência.' : 'Tente antes de abrir. Se abrir antes de acertar, o exercício fica marcado como “visto com ajuda” e não conta como resolvido sozinho.'}</p></div></div><div class="row-actions">${btn(icon('book') + ' Ver gabarito', 'tr-key', r.ok ? 'ghost' : 'text')}</div></div>`;
      return `<div class="tr-step tr-key-open"><div class="tr-step-head"><span class="tr-step-n">3</span><div><h3>Gabarito</h3><p>${typo(e.ask)}</p></div></div>
        <div class="tr-answer"><span>Resposta</span><b>${safe(answerText(e))}</b></div>
        <div class="tr-method-box"><span class="symbol small tone-${e.method}" aria-hidden="true">${safe(m.symbol)}</span><div><b>Método: ${m.title}</b><p>${typo(e.why)}</p></div></div>
        <h4>Passo a passo</h4>${steps(e)}
        <div class="tr-conv">${convChart(e)}</div>
        ${e.traps && e.traps.length ? `<details class="tr-whynot"><summary>Erros típicos neste exercício</summary><ul>${e.traps.map(t => `<li><b>${safe(Array.isArray(t.v) ? t.v.map(br).join('; ') : br(t.v))}:</b> ${safe(t.m)}</li>`).join('')}</ul></details>` : ''}
        <details class="tr-whynot"><summary>Por que não os outros métodos?</summary><ul>${ORDER.filter(id => id !== e.method).map(id => `<li><b>${method(id).title}:</b> ${safe(whyNot(e.method, id))}</li>`).join('')}</ul></details>
        <div class="row-actions">${btn('Esconder gabarito', 'tr-key', 'text')}</div></div>`;
    }
    function exercise() {
      const e = DATA[T.cur], r = P(e), st = status(e);
      return `<article class="tr-card" aria-labelledby="tr-title">
        <div class="tr-head"><span class="tr-num"><span class="sr-only">Exercício </span>${String(e.n).padStart(3, '0')}</span><div class="tr-tags">${tag('Nível ' + e.level, e.level === 3 ? 'amber' : '')}${tag(safe(e.area))}${st !== 'new' ? tag(STATUS_LABEL[st] + (st === 'perfect' ? ' ★' : ''), st === 'solved' || st === 'perfect' ? 'green' : st === 'missed' ? 'amber' : '') : ''}</div></div>
        <h2 id="tr-title" class="tr-title">${safe(e.title)}</h2>
        <p class="tr-story">${cues(e.story, !!r.d)}</p>
        ${formula(e)}${given(e)}
        <div class="tr-step"><div class="tr-step-head"><span class="tr-step-n">1</span><div><h3>Diagnóstico</h3><p>${r.d ? 'As pistas que decidem o método agora estão marcadas no enunciado.' : 'Qual método resolve melhor? Procure as pistas no enunciado.'}</p></div></div>${toolButtons(e, r.d)}${r.d ? verdict(e, r.d) : ''}</div>
        ${solveBlock(e)}
        ${keyBlock(e)}
        <nav class="tr-nav" aria-label="Navegar entre exercícios">${btn('← Anterior', 'tr-prev', 'text', T.cur === 0 ? 'disabled' : '')}${btn('Sortear', 'tr-random', 'ghost')}${btn('Próximo pendente →', 'tr-next', 'primary')}</nav>
      </article>`;
    }
    function matches(e) {
      const st = status(e);
      if (T.filter === 'todo') return st !== 'solved' && st !== 'perfect';
      if (T.filter === 'review') return st === 'missed' || st === 'trying' || !!P(e).rv;
      if (T.filter.startsWith('l')) return e.level === Number(T.filter.slice(1));
      if (T.filter.startsWith('m:')) return P(e).d && e.method === T.filter.slice(2);
      return true;
    }
    function board() {
      const done = DATA.filter(e => P(e).ok).length;
      return `<section class="card tr-board-card" aria-labelledby="tr-board-title"><div class="section-head row tight"><h2 id="tr-board-title">Tabuleiro</h2>${tag(`${done}/${DATA.length}`, done ? 'green' : '')}</div>
        <div class="tr-filters" role="group" aria-label="Destacar exercícios">${[['all', 'Todos'], ['todo', 'Pendentes'], ['review', 'Revisar'], ['l1', 'Nível 1'], ['l2', 'Nível 2'], ['l3', 'Nível 3']].map(([id, t]) => `<button type="button" data-act="tr-filter" data-id="${id}" class="${T.filter === id ? 'active' : ''}" aria-pressed="${T.filter === id}">${t}</button>`).join('')}</div>
        <div class="tr-board" role="group" aria-label="${DATA.length} exercícios">${DATA.map((e, i) => {
          const st = status(e), dim = !matches(e), r = P(e);
          const sym = r.d ? `<i class="tone-${e.method}">${safe(method(e.method).symbol)}</i>` : '';
          return `<button type="button" class="tr-tile st-${st} ${i === T.cur ? 'current' : ''} ${dim ? 'dim' : ''}" data-act="tr-open" data-index="${i}" aria-label="Exercício ${e.n}: ${STATUS_LABEL[st]}" ${i === T.cur ? 'aria-current="true"' : ''}><span>${e.n}</span>${sym}</button>`;
        }).join('')}</div>
        <ul class="tr-legend"><li><i class="st-new"></i>Novo</li><li><i class="st-trying"></i>Em andamento</li><li><i class="st-missed"></i>Diagnóstico a revisar</li><li><i class="st-helped"></i>Visto com ajuda</li><li><i class="st-solved"></i>Resolvido</li><li><i class="st-perfect"></i>Perfeito ★</li></ul></section>`;
    }
    function summary() {
      const diag = DATA.filter(e => P(e).d), dOk = diag.filter(e => P(e).dOk).length;
      const solved = DATA.filter(e => P(e).ok && !P(e).keyFirst).length, perfect = DATA.filter(e => status(e) === 'perfect').length;
      const helpedN = DATA.filter(e => helped(P(e))).length, tried = DATA.filter(e => { const r = P(e); return r.d || r.tries || r.key || r.ok; }).length;
      const provas = prog._provas || [];
      return { diagnosed: diag.length, dOk, solved, helped: helpedN, tried, perfect, rate: diag.length ? Math.round(100 * dOk / diag.length) : null, reviewDue: reviewDue().length, lastExam: provas[0] || null };
    }
    function stats() {
      const S = summary();
      const per = ORDER.map(id => { const d = DATA.filter(e => e.method === id && P(e).d); return [id, d.filter(e => P(e).dOk).length, d.length]; });
      const conf = {}; DATA.forEach(e => { const r = P(e); if (r.d && !r.dOk) { const k = e.method + '>' + r.d; conf[k] = (conf[k] || 0) + 1; } });
      const top = Object.entries(conf).sort((a, b) => b[1] - a[1])[0];
      return `<section class="card tr-stats" aria-labelledby="tr-stats-title"><h2 id="tr-stats-title">Seu diagnóstico</h2>
        <div class="tr-kpis tr-kpis-4"><div><b>${S.tried}</b><span>tentados</span></div><div><b>${S.helped}</b><span>vistos com ajuda</span></div><div><b>${S.solved}</b><span>resolvidos sozinho</span></div><div><b>${S.perfect}</b><span>perfeitos ★</span></div></div>
        <p class="fine">${S.rate === null ? 'Nenhum diagnóstico ainda.' : `${S.rate}% de diagnósticos certeiros (${S.dOk} de ${S.diagnosed}).`}</p>
        ${per.map(([id, ok, n]) => `<div class="method-progress"><span class="symbol small tone-${id}" aria-hidden="true">${safe(method(id).symbol)}</span><div><div class="mp-row"><span>${method(id).title}</span><b>${n ? `${ok}/${n}` : '—'}</b></div>${bar(ok, Math.max(n, 1), 'Diagnósticos certos de ' + method(id).title)}</div></div>`).join('')}
        <p class="fine">${top ? `Confusão mais comum: era <b>${method(top[0].split('>')[0]).title}</b> e você escolheu <b>${method(top[0].split('>')[1]).title}</b> (${top[1]}×). Os diagnósticos errados vão para o caderno de Revisão.` : 'Cada barra conta os exercícios daquele método em que você acertou o diagnóstico.'}</p>
        ${S.reviewDue ? `<p class="tr-review-note">${icon('review')} ${S.reviewDue} ${S.reviewDue === 1 ? 'diagnóstico para revisar hoje' : 'diagnósticos para revisar hoje'}. ${btn('Revisar agora', 'tr-rev', 'text', `data-id="${reviewDue()[0].id}"`)}</p>` : ''}
        ${T.confirmReset ? `<div class="confirm card" role="alertdialog" aria-labelledby="tr-reset-t"><h3 id="tr-reset-t">Apagar o progresso do Treino?</h3><p>As trilhas e o XP não são afetados. Se quiser guardar este progresso, exporte um backup antes (na página Progresso).</p><div class="row-actions">${btn('Apagar', 'tr-reset-yes', 'danger-ghost')}${btn('Cancelar', 'tr-reset-no', 'ghost')}</div></div>` : btn('Recomeçar o Treino', 'tr-reset', 'text')}</section>`;
    }
    function keyView() {
      return `<section class="card tr-keyview"><div class="section-head row tight"><div><h2>Gabarito completo</h2><p>Para conferir uma lista feita no papel ou preparar uma aula. O botão de imprimir gera a lista de exercícios (com a pergunta sem o nome do método) seguida do gabarito.</p></div><div class="row-actions">${btn(T.showAll ? 'Esconder respostas' : 'Mostrar respostas', 'tr-showall', T.showAll ? 'ghost' : 'primary')}${btn('Imprimir lista e gabarito', 'tr-print', 'ghost')}</div></div>
        <div class="table-scroll"><table class="tr-table key"><thead><tr><th>Nº</th><th>Exercício</th><th>Nível</th><th>Método</th><th>Resposta</th></tr></thead><tbody>${DATA.map((e, i) => `<tr><td class="numeric">${e.n}</td><td><button type="button" class="link-btn" data-act="tr-open" data-index="${i}">${safe(e.title)}</button><small>${safe(e.area)}</small></td><td>${e.level}</td><td>${T.showAll ? `<span class="tr-mtag tone-${e.method}">${method(e.method).title}</span>` : '<span class="tr-hidden">•••</span>'}</td><td class="numeric">${T.showAll ? safe(answerText(e)) : '<span class="tr-hidden">•••</span>'}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="tr-print" aria-hidden="true"><h1>Numera Academy — Treino: ${DATA.length} exercícios</h1><p>Para cada problema: (1) diga qual método é o mais indicado e por quê; (2) resolva o que se pede.</p>
        ${DATA.map(e => `<div class="tr-print-item"><h3>${e.n}. ${safe(e.title)} <small>(nível ${e.level} · ${safe(e.area)})</small></h3><p>${typo(plainStory(e.story))}</p><p class="tr-print-f">${isSys(e.method) ? e.system.map(mathHtml).join('<br>') : e.g ? 'x = ' + mathHtml(e.g) : 'f(x) = ' + mathHtml(e.source)}</p><p><b>${typo(e.askBlind || e.ask)}</b></p></div>`).join('')}
        <h2 class="tr-print-break">Gabarito</h2><table><thead><tr><th>Nº</th><th>Método</th><th>Resposta</th></tr></thead><tbody>${DATA.map(e => `<tr><td>${e.n}</td><td>${method(e.method).title}</td><td>${safe(answerText(e))}</td></tr>`).join('')}</tbody></table></section>`;
    }

    // ---------- revisão de um diagnóstico (vem do caderno de Revisão)
    function reviewView() {
      const e = T.rev && BY_ID.get(T.rev.id);
      if (!e) return `<section class="card empty-state">${icon('review')}<h2 class="display">Nenhum diagnóstico para revisar</h2><p>Quando você errar um diagnóstico no Treino ou numa prova, ele volta aqui depois de 1, 3, 7 e 14 dias.</p>${btn('Voltar aos exercícios', 'tr-view', 'primary', 'data-id="ex"')}</section>`;
      const chosen = T.rev.chosen, rv = P(e).rv, next = reviewDue().find(x => x.id !== e.id);
      return `<article class="tr-card tr-rev-card" aria-labelledby="tr-rev-title"><span class="eyebrow">Revisão de diagnóstico${rv ? ` · intervalo atual: ${rv.int} ${rv.int === 1 ? 'dia' : 'dias'}` : ''}</span>
        <h2 id="tr-rev-title" class="tr-title">${safe(e.title)}</h2><div class="tr-tags">${tag(safe(e.area))}</div>
        <p class="tr-story">${cues(e.story, !!chosen)}</p>${formula(e)}${given(e)}
        <div class="tr-step"><div class="tr-step-head"><span class="tr-step-n">?</span><div><h3>Qual método é o mais indicado?</h3><p>Antes, você errou este diagnóstico. Releia o enunciado com calma.</p></div></div>${toolButtons(e, chosen, 'tr-rev-pick')}${chosen ? verdict(e, chosen) + `<p class="fine">${chosen === e.method ? (P(e).rv ? `Acertou: a próxima revisão fica para daqui a ${P(e).rv.int} dias.` : 'Acertou de novo: este diagnóstico saiu do caderno.') : 'Volta amanhã para uma nova tentativa.'}</p>` : ''}</div>
        <div class="row-actions">${chosen && next ? btn('Próxima revisão ' + icon('arrow'), 'tr-rev', 'primary', `data-id="${next.id}"`) : ''}${btn('Abrir o exercício completo', 'tr-open-id', 'ghost', `data-id="${e.id}"`)}${btn('Voltar ao caderno', 'tr-to-review', 'text')}</div></article>`;
    }
    function reviewSection() {
      const all = reviewList();
      if (!all.length) return '';
      const due = new Set(reviewDue().map(e => e.id));
      return `<section class="tr-review-section" aria-labelledby="tr-rs-t"><div class="section-head row tight"><h2 id="tr-rs-t">Diagnósticos do Treino</h2>${tag(`${due.size} para hoje`, due.size ? 'amber' : '')}</div><div class="review-list">${all.map(e => { const r = P(e).rv, d = due.has(e.id); return `<article class="card review-row"><span class="review-marker ${d ? 'due' : ''}" aria-hidden="true">${d ? '↻' : '✓'}</span><div><span class="eyebrow">${d ? 'Revisão disponível' : 'Próxima revisão: ' + r.due.split('-').reverse().join('/')} · Treino ${e.n}</span><h3>${safe(e.title)}</h3></div>${btn('Revisar diagnóstico', 'tr-rev', 'ghost', `data-id="${e.id}"`)}</article>`; }).join('')}</div></section>`;
    }

    // ---------- modo prova
    const pv = () => prog._prova || null;
    function draw(n) {
      // Mistura os métodos: percorre os 7 em ordem aleatória, sorteando um exercício de cada vez.
      const pools = {}; ORDER.forEach(m => { pools[m] = DATA.filter(e => e.method === m).map(e => e.id); });
      const pick = arr => arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
      const out = [];
      while (out.length < n) { const ms = ORDER.slice().sort(() => Math.random() - 0.5); for (const m of ms) { if (out.length < n && pools[m].length) out.push(pick(pools[m])); } }
      for (let i = 1; i < out.length; i++) if (BY_ID.get(out[i]).method === BY_ID.get(out[i - 1]).method) { const j = out.findIndex((id, k) => k > i && BY_ID.get(id).method !== BY_ID.get(out[i]).method); if (j > 0) [out[i], out[j]] = [out[j], out[i]]; }
      return out;
    }
    const mmss = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
    const remaining = p => p.limit ? p.limit * 60 - (Date.now() - p.start) / 1000 : null;
    let timer = null;
    function ensureTimer() {
      if (timer || typeof global.setInterval !== 'function') return;
      timer = global.setInterval(() => {
        const p = pv();
        if (!p) { global.clearInterval(timer); timer = null; return; }
        const left = remaining(p), el = document.getElementById && document.getElementById('tr-timer');
        if (el) { el.textContent = left === null ? mmss((Date.now() - p.start) / 1000) : mmss(left); if (left !== null && left < 60) el.classList.add('low'); }
        // Anúncios só nos marcos (o relógio em si fica com aria-live desligado para não falar a cada segundo).
        if (left !== null && left > 0) for (const [mark, msg] of [[300, 'Faltam 5 minutos de prova.'], [60, 'Falta 1 minuto de prova.']]) if (left <= mark && !(p.warned || []).includes(mark)) { p.warned = [...(p.warned || []), mark]; announce(msg); }
        if (left !== null && left <= 0) expire();
      }, 1000);
    }
    function expire() {
      saveExamInputs(); finishExam(true); T.view = 'prova'; T.pvShow = true;
      announce('Tempo esgotado: a prova foi encerrada e o relatório foi aberto.'); focusNext('#tr-rep-t'); render();
    }
    function saveExamInputs() {
      const p = pv(); if (!p || !document.getElementById) return;
      const e = BY_ID.get(p.ids[p.i]); if (!e) return;
      const a = p.ans[e.id] = p.ans[e.id] || {};
      a.raw = fieldIds(e, 'pv-ans').map((id, i) => { const el = document.getElementById(id); return el ? el.value : (a.raw || [])[i] || ''; });
      save();
    }
    function finishExam(timeout = false) {
      const p = pv(); if (!p) return;
      const items = p.ids.map((id, k) => {
        const e = BY_ID.get(id), a = p.ans[id] || {}, raw = a.raw || [];
        const g = raw.some(v => String(v).trim()) ? grade(e, raw) : { ok: false, vals: null };
        const dOk = a.d === e.method, ansOk = !!g.ok && !g.error;
        if (a.d && !dOk) scheduleMiss(e);
        return { id, k: k + 1, d: a.d || null, dOk, raw, ansOk, trap: g.trap ? g.trap.m : (g.error ? 'Resposta em formato inválido: ' + g.error : ''), pts: (dOk ? 0.4 : 0) + (ansOk ? 0.6 : 0) };
      });
      const total = items.reduce((s, x) => s + x.pts, 0), secs = Math.round((Date.now() - p.start) / 1000);
      const res = { date: new Date().toISOString(), name: p.name || '', n: items.length, limit: p.limit, secs, timeout, nota: Math.round(total / items.length * 100) / 10, dOk: items.filter(x => x.dOk).length, aOk: items.filter(x => x.ansOk).length, items };
      prog._provaLast = res;
      prog._provas = [{ date: res.date, nota: res.nota, n: res.n, secs }, ...(prog._provas || [])].slice(0, 10);
      delete prog._prova; T.pvConfirm = false;
      save();
    }
    function examSetup() {
      const S = T.pvSetup, last = prog._provaLast, hist = prog._provas || [];
      return `<section class="card tr-exam-setup" aria-labelledby="tr-pv-t"><span class="eyebrow">Modo prova</span><h2 id="tr-pv-t" class="display small">Diagnóstico e cálculo, valendo nota</h2>
        <p>As questões são sorteadas entre os ${DATA.length} exercícios, misturando os ${ORDER.length === 7 ? 'sete' : ORDER.length === 6 ? 'seis' : ORDER.length} métodos. Em cada uma você escolhe o método (vale 4 décimos) e responde (vale 6 décimos). Não há gabarito durante a prova: no fim sai a nota e um relatório para imprimir ou salvar em PDF. Os diagnósticos errados vão para o caderno de Revisão.</p>
        <div class="tr-exam-form"><label class="field" for="pv-name">Nome no relatório (opcional)<input id="pv-name" autocomplete="name" maxlength="60" value="${safe(S.name)}"></label>
        <fieldset class="tr-choice-row"><legend>Questões</legend>${[5, 10, 15].map(n => `<button type="button" class="${S.n === n ? 'active' : ''}" data-act="tr-pv-n" data-id="${n}" aria-pressed="${S.n === n}">${n}</button>`).join('')}</fieldset>
        <fieldset class="tr-choice-row"><legend>Tempo</legend>${[[0, 'Sem limite'], [20, '20 min'], [30, '30 min'], [45, '45 min']].map(([v, t]) => `<button type="button" class="${S.limit === v ? 'active' : ''}" data-act="tr-pv-limit" data-id="${v}" aria-pressed="${S.limit === v}">${t}</button>`).join('')}</fieldset></div>
        <div class="row-actions">${btn('Começar a prova ' + icon('arrow'), 'tr-pv-start', 'primary')}${last ? btn('Ver o último relatório', 'tr-pv-last', 'ghost') : ''}</div>
        ${hist.length ? `<div class="tr-exam-hist"><h3>Provas anteriores</h3><ul>${hist.map(x => `<li><b>${String(x.nota.toFixed(1)).replace('.', ',')}</b><span>${x.n} questões · ${mmss(x.secs)} · ${new Date(x.date).toLocaleDateString('pt-BR')}</span></li>`).join('')}</ul></div>` : ''}</section>`;
    }
    function examQuestion() {
      const p = pv(), e = BY_ID.get(p.ids[p.i]), a = p.ans[e.id] || {}, left = remaining(p), ans = e.answer;
      const answered = p.ids.filter(id => { const x = p.ans[id]; return x && x.d && (x.raw || []).some(v => String(v).trim()); }).length;
      const fields = ans.type === 'vec'
        ? `<div class="tr-vec">${ans.names.map((n, i) => `<label class="tr-field" for="pv-ans-${i}"><span>${n} =</span><input id="pv-ans-${i}" inputmode="decimal" autocomplete="off" value="${safe((a.raw || [])[i] || '')}"></label>`).join('')}</div>`
        : `<label class="tr-field single" for="pv-ans-0"><span>${ans.type === 'int' ? 'n =' : 'Resposta'}</span><input id="pv-ans-0" inputmode="decimal" autocomplete="off" placeholder="${ans.type === 'int' ? 'número inteiro' : 'ex.: 1,4142'}" value="${safe((a.raw || [])[0] || '')}"></label>`;
      return `<div class="tr-exam-bar"><span class="eyebrow">Prova${p.name ? ' · ' + safe(p.name) : ''}</span><div class="tr-exam-dots" role="group" aria-label="Questão ${p.i + 1} de ${p.ids.length}">${p.ids.map((id, k) => { const x = p.ans[id]; return `<button type="button" class="${k === p.i ? 'current' : ''} ${x && x.d ? 'done' : ''}" data-act="tr-pv-go" data-index="${k}" aria-label="Questão ${k + 1}${x && x.d ? ', método escolhido' : ''}">${k + 1}</button>`; }).join('')}</div><span class="tr-timer-pill" aria-live="off" title="${left === null ? 'Tempo decorrido' : 'Tempo restante'}">${icon('clock')}<b id="tr-timer">${left === null ? mmss((Date.now() - p.start) / 1000) : mmss(left)}</b></span></div>
        <article class="tr-card tr-exam-card" aria-labelledby="pv-title"><div class="tr-head"><span class="tr-num">${String(p.i + 1).padStart(2, '0')}</span><div class="tr-tags">${tag('Questão ' + (p.i + 1) + ' de ' + p.ids.length)}${tag(safe(e.area))}${tag('Nível ' + e.level, e.level === 3 ? 'amber' : '')}</div></div>
        <h2 id="pv-title" class="sr-only" tabindex="-1">Questão ${p.i + 1} de ${p.ids.length}</h2>
        <p class="tr-story">${cues(e.story, false)}</p>${formula(e)}${given(e)}
        <div class="tr-step"><div class="tr-step-head"><span class="tr-step-n">1</span><div><h3>Método (4 décimos)</h3><p>Você pode mudar a escolha até entregar.</p></div></div>${toolButtons(e, a.d, 'tr-pv-diag', false)}</div>
        <form id="tr-pv-form" class="tr-step"><div class="tr-step-head"><span class="tr-step-n">2</span><div><h3>Resposta (6 décimos)</h3><p>${typo(e.askBlind || e.ask)}</p></div></div>${fields}<p class="fine">Use vírgula ou ponto e pelo menos 4 algarismos significativos${ans.abs ? ` (tolerância ${tolTxt(ans.abs)})` : ''}.</p></form>
        <nav class="tr-nav" aria-label="Navegar na prova">${btn('← Anterior', 'tr-pv-prev', 'text', p.i === 0 ? 'disabled' : '')}<span class="fine">${answered} de ${p.ids.length} completas</span>${p.i < p.ids.length - 1 ? btn('Próxima →', 'tr-pv-next', 'primary') : btn('Entregar a prova', 'tr-pv-end', 'primary')}</nav>
        ${T.pvConfirm ? `<div class="confirm card" role="alertdialog" aria-labelledby="pv-end-t"><h3 id="pv-end-t">Entregar a prova agora?</h3><p>${answered < p.ids.length ? `Ainda há ${p.ids.length - answered} ${p.ids.length - answered === 1 ? 'questão incompleta' : 'questões incompletas'}. ` : ''}Depois de entregar, não dá para mudar as respostas.</p><div class="row-actions">${btn('Entregar', 'tr-pv-end-yes', 'primary')}${btn('Continuar a prova', 'tr-pv-end-no', 'ghost')}</div></div>` : `<div class="row-actions tr-exam-end">${btn('Entregar a prova', 'tr-pv-end', 'text')}${btn('Desistir', 'tr-pv-quit', 'text')}</div>`}</article>`;
    }
    function examReport() {
      const r = prog._provaLast; if (!r) return examSetup();
      const nota = r.nota.toFixed(1).replace('.', ',');
      return `<article class="card tr-report" aria-labelledby="tr-rep-t"><div class="tr-report-head"><div>${r.timeout ? `<div class="notice tr-timeout" role="status"><span><b>A prova foi encerrada pelo tempo.</b> As respostas preenchidas até o fim foram corrigidas.</span></div>` : ''}<span class="eyebrow">Relatório da prova · Numera Academy</span><h2 id="tr-rep-t" class="display small" tabindex="-1">${r.name ? safe(r.name) : 'Prova de métodos numéricos'}</h2><p class="fine">${new Date(r.date).toLocaleString('pt-BR')} · ${r.n} questões · tempo ${mmss(r.secs)}${r.limit ? ` de ${r.limit} min` : ''}${r.timeout ? ' (encerrada pelo tempo)' : ''}</p></div><div class="tr-grade" aria-label="Nota ${nota} de 10"><b>${nota}</b><span>de 10</span></div></div>
        <div class="tr-kpis"><div><b>${r.dOk}/${r.n}</b><span>diagnósticos certos</span></div><div><b>${r.aOk}/${r.n}</b><span>respostas certas</span></div><div><b>${Math.round(100 * (r.dOk + r.aOk) / (2 * r.n))}%</b><span>aproveitamento</span></div></div>
        <div class="table-scroll"><table class="tr-table tr-report-table"><thead><tr><th>#</th><th>Exercício</th><th>Seu método</th><th>Método indicado</th><th>Sua resposta</th><th>Gabarito</th><th>Pontos</th></tr></thead><tbody>${r.items.map(x => { const e = BY_ID.get(x.id); return `<tr class="${x.pts === 1 ? 'ok' : ''}"><td class="numeric">${x.k}</td><td><b>${safe(e.title)}</b><small>${safe(e.area)} · Treino ${e.n}</small>${x.trap ? `<small class="tr-trap">${safe(x.trap)}</small>` : ''}</td><td>${x.d ? `<span class="${x.dOk ? 'tr-yes' : 'tr-no'}">${x.dOk ? '✓' : '✗'}</span> ${method(x.d).title}` : '<span class="tr-no">—</span>'}</td><td>${method(e.method).title}</td><td class="numeric"><span class="${x.ansOk ? 'tr-yes' : 'tr-no'}">${x.ansOk ? '✓' : '✗'}</span> ${safe((x.raw || []).filter(v => String(v).trim()).join('; ') || '—')}</td><td class="numeric">${safe(answerText(e))}</td><td class="numeric">${String(x.pts.toFixed(1)).replace('.', ',')}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="fine">Critério: 0,4 pelo método mais indicado e 0,6 pela resposta dentro da tolerância de cada exercício. Diagnósticos errados foram enviados ao caderno de Revisão.</p>
        <div class="row-actions no-print">${btn('Imprimir ou salvar em PDF', 'tr-pv-print', 'primary')}${btn('Nova prova', 'tr-pv-new', 'ghost')}${btn('Estudar o gabarito da 1ª questão errada', 'tr-open-id', 'text', `data-id="${(r.items.find(x => x.pts < 1) || r.items[0]).id}"`)}</div></article>`;
    }
    function examView() {
      // Prova que expirou com a página fechada: encerra e mostra o relatório direto.
      if (pv() && remaining(pv()) !== null && remaining(pv()) <= 0) { finishExam(true); T.pvShow = true; }
      if (pv()) { ensureTimer(); return examQuestion(); }
      if (T.pvShow && prog._provaLast) return examReport();
      return examSetup();
    }

    function page() {
      if (!DATA.length) return `<div class="wrap page-body"><div class="alert">Os exercícios do Treino não foram carregados (treino-data.js).</div></div>`;
      const due = reviewDue().length, migrated = prog._migrated;
      const report = T.view === 'prova' && !pv() && T.pvShow && prog._provaLast;
      return `<div class="wrap page-body page-treino ${report ? 'is-report' : ''}">${h.heading('Treino', 'Diagnostique o método. Depois, resolva.', `${DATA.length} problemas misturados, de engenharia a finanças, 20 para cada um dos sete métodos. Em cada um: leia as pistas, escolha o melhor método, resolva e confira no gabarito, com o passo a passo, o gráfico de convergência e os erros típicos.`)}
        <div class="tr-topbar">${h.tabs([['ex', 'Exercícios'], ['prova', pv() ? 'Prova em andamento' : 'Modo prova'], ['rev', `Revisão${due ? ' (' + due + ')' : ''}`], ['key', 'Gabarito completo']], T.view, 'tr-view')}<span class="fine">${migrated ? `${migrated} exercícios trazidos da versão 8. ` : ''}O progresso do Treino fica neste navegador, entra no backup da página Progresso e não altera o XP das trilhas.</span></div>
        ${saveFailed ? `<div class="notice" role="alert"><span>O navegador não está gravando o progresso do Treino (armazenamento cheio, bloqueado ou navegação privada). O que você fizer agora vale só nesta aba: exporte um backup na página Progresso.</span></div>` : ''}
        ${T.view === 'key' ? keyView() : T.view === 'prova' ? examView() : T.view === 'rev' ? reviewView() : `<div class="tr-layout"><div class="tr-main">${exercise()}</div><aside class="tr-side">${board()}${stats()}</aside></div>`}</div>`;
    }

    // ---------- ações
    function go(i, scroll = true) {
      T.cur = (i + DATA.length) % DATA.length; T.fb = null; T.key = false; T.answers = {}; T.view = 'ex';
      if (scroll && typeof global.scrollTo === 'function') { const top = document.querySelector && document.querySelector('.page-treino'); global.scrollTo({ top: top ? top.offsetTop : 0, behavior: 'auto' }); }
    }
    const nextOpen = () => { for (let k = 1; k <= DATA.length; k++) { const i = (T.cur + k) % DATA.length; if (!P(DATA[i]).ok) return i; } return (T.cur + 1) % DATA.length; };
    function handle(act, el) {
      const e = DATA[T.cur], id = el && el.dataset ? el.dataset.id : undefined;
      if (act === 'tr-view') { if (id === 'rev' && !T.rev) { const d = reviewDue()[0] || reviewList()[0]; T.rev = d ? { id: d.id, chosen: null } : null; } if (id === 'prova') T.pvShow = false; T.view = id; return true; }
      if (act === 'tr-open') { go(Number(el.dataset.index)); return true; }
      if (act === 'tr-open-id') { const i = DATA.findIndex(x => x.id === id); if (i >= 0) { go(i); T.key = !!P(DATA[i]).d; } if (T.view !== 'ex') T.view = 'ex'; nav('treino'); return false; }
      if (act === 'tr-filter') { T.filter = id; return true; }
      if (act === 'tr-prev') { go(T.cur - 1); return true; }
      if (act === 'tr-next') { go(nextOpen()); return true; }
      if (act === 'tr-random') { const open = DATA.map((x, i) => i).filter(i => !P(DATA[i]).ok && i !== T.cur); go(open.length ? open[Math.floor(Math.random() * open.length)] : Math.floor(Math.random() * DATA.length)); return true; }
      if (act === 'tr-diag') {
        const r = prog[e.id] = { ...P(e) };
        if (!r.d) { r.d = id; r.dOk = r.d === e.method; if (!r.dOk) scheduleMiss(e); save(); }
        return true;
      }
      if (act === 'tr-key') { T.key = !T.key; if (T.key) { const r = prog[e.id] = { ...P(e) }; r.key = true; save(); } return true; }
      if (act === 'tr-lab') {
        const t = e.terminal, sys = isSys(e.method);
        openInLab({ source: sys ? e.source : e.g ? 'x = ' + e.g : e.source + ' = 0', mode: sys ? 'system' : 'root', algorithm: t.algorithm, a: t.a, b: t.b, x0: t.x0, x1: t.x1, g: t.g || '', initial: t.initial });
        return false;
      }
      if (act === 'tr-showall') { T.showAll = !T.showAll; return true; }
      if (act === 'tr-print') { T.showAll = true; render(); setTimeout(() => global.print && global.print(), 50); return false; }
      if (act === 'tr-reset') { T.confirmReset = true; return true; }
      if (act === 'tr-reset-no') { T.confirmReset = false; return true; }
      if (act === 'tr-reset-yes') { prog = {}; save(); T.confirmReset = false; T.fb = null; T.key = false; convCache.clear(); announce(saveFailed ? 'O Treino foi recomeçado só nesta sessão: o navegador não deixou gravar.' : 'Progresso do Treino apagado.'); return true; }
      // revisão
      if (act === 'tr-rev') { T.rev = { id, chosen: null }; T.view = 'rev'; nav('treino'); return false; }
      if (act === 'tr-rev-pick') { const x = BY_ID.get(T.rev && T.rev.id); if (x && !T.rev.chosen) { T.rev.chosen = id; reviewAnswer(x, id === x.method); } return true; }
      if (act === 'tr-to-review') { T.rev = null; T.view = 'ex'; nav('review'); return false; }
      // prova
      if (act === 'tr-pv-n') { T.pvSetup.n = Number(id); keepName(); return true; }
      if (act === 'tr-pv-limit') { T.pvSetup.limit = Number(id); keepName(); return true; }
      if (act === 'tr-pv-start') { keepName(); prog._prova = { ids: draw(T.pvSetup.n), i: 0, ans: {}, start: Date.now(), limit: T.pvSetup.limit, name: T.pvSetup.name.trim().slice(0, 60) }; T.pvShow = false; save(); announce(`Prova iniciada: ${prog._prova.ids.length} questões${prog._prova.limit ? `, ${prog._prova.limit} minutos` : ', sem limite de tempo'}. Questão 1.`); focusNext('#pv-title'); return true; }
      if (act === 'tr-pv-diag') { saveExamInputs(); const p = pv(); if (p) { const qid = p.ids[p.i]; p.ans[qid] = { ...(p.ans[qid] || {}), d: id }; save(); } return true; }
      if (act === 'tr-pv-go' || act === 'tr-pv-prev' || act === 'tr-pv-next') { saveExamInputs(); const p = pv(); if (p) { p.i = act === 'tr-pv-go' ? Number(el.dataset.index) : Math.max(0, Math.min(p.ids.length - 1, p.i + (act === 'tr-pv-next' ? 1 : -1))); T.pvConfirm = false; save(); announce(`Questão ${p.i + 1} de ${p.ids.length}.`); focusNext('#pv-title'); } return true; }
      if (act === 'tr-pv-end') { saveExamInputs(); T.pvConfirm = true; return true; }
      if (act === 'tr-pv-end-no') { T.pvConfirm = false; return true; }
      if (act === 'tr-pv-end-yes') { saveExamInputs(); finishExam(); T.pvShow = true; announce('Prova entregue. Relatório aberto.'); focusNext('#tr-rep-t'); return true; }
      if (act === 'tr-pv-quit') { delete prog._prova; T.pvConfirm = false; save(); return true; }
      if (act === 'tr-pv-last') { T.pvShow = true; return true; }
      if (act === 'tr-pv-new') { T.pvShow = false; return true; }
      if (act === 'tr-pv-print') { setTimeout(() => global.print && global.print(), 50); return false; }
      return false;
    }
    function keepName() { const el = document.getElementById && document.getElementById('pv-name'); if (el) T.pvSetup.name = el.value; }
    function submit() { check(DATA[T.cur]); render(); }
    function openById(n) { const i = DATA.findIndex(e => e.n === n); if (i >= 0) go(i, false); }
    // Backup único (v10): o app junta este estado ao das trilhas num só arquivo.
    const exportState = () => JSON.parse(JSON.stringify(prog));
    function importState(raw) { const q = normalize(raw); prog = q; convCache.clear(); T.fb = null; T.key = false; T.pvShow = false; return save(); }
    const describe = raw => { const q = normalize(raw); return { exercises: Object.keys(q).filter(k => !k.startsWith('_')).length, provas: (q._provas || []).length }; };
    return { page, handle, submit, summary, openById, count: DATA.length, reviewDue: () => reviewDue().length, reviewSection, examActive: () => !!pv(), exportState, importState, normalize, describe, saveFailed: () => saveFailed, _state: T, _prog: () => prog, _finish: finishExam, _expire: expire };
  };
})(window);
