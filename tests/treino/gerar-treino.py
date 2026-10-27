"""Gera os 140 exercícios da aba Treino (dist/treino-data.js), 20 por método (v9: + Falsa Posição e Ponto Fixo).

Cada exercício traz o enunciado (com as pistas marcadas como [[trecho|rótulo]]), o método
mais adequado, a pergunta, o gabarito e o passo a passo. Todas as contas do gabarito são
feitas aqui, de forma independente do site: sympy (derivadas exatas e frações) e mpmath com
50 dígitos. A ordem final é embaralhada com semente fixa, sem dois métodos iguais seguidos.
Cada exercício traz também a pergunta sem o nome do método (askBlind), os erros típicos
reconhecíveis (traps) e os dados do gráfico de convergência (conv).

Uso: python3 tests/treino/gerar-treino.py dist/treino-data.js   (precisa de: pip install sympy mpmath)
"""
import json, math, random, sys, re
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp

mp.mp.dps = 50
X = sp.Symbol('x')
EX = []

# ---------------------------------------------------------------- utilidades numéricas
def F(src):
    """Converte a sintaxe do motor (x^2, ln, log=base 10, 2x) em expressão sympy."""
    t = src.replace('^', '**')
    t = re.sub(r'(\d)\s*([a-z(])', r'\1*\2', t)
    t = re.sub(r'\)\s*([a-z(\d])', r')*\1', t)
    t = re.sub(r'\bx\s*\(', 'x*(', t)
    t = re.sub(r'\bx\s+([a-z])', r'x*\1', t)
    loc = {'x': X, 'pi': sp.pi, 'e': sp.E, 'exp': sp.exp, 'ln': sp.log, 'log': lambda a: sp.log(a, 10),
           'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan, 'sqrt': sp.sqrt, 'abs': sp.Abs, 'cosh': sp.cosh, 'sinh': sp.sinh}
    return sp.sympify(t, locals=loc)

def side(src):
    l, r = src.split('=') if '=' in src else (src, '0')
    return F(l) - F(r)

def mpf(expr):
    return sp.lambdify(X, expr, 'mpmath')

def r10(v):
    v = float(v)
    return float(f'{v:.10g}')

def br(v, d=6):
    """Número no formato brasileiro, com até d casas decimais."""
    if isinstance(v, Fr):
        if v.denominator == 1: return str(v.numerator).replace('-', '−')
        den = v.denominator
        k = 0
        while den % 2 == 0 or den % 5 == 0:
            den //= 2 if den % 2 == 0 else 5; k += 1
        if den == 1 and k <= 4: return br(float(v), 4)
        return f'{v.numerator}/{v.denominator}'.replace('-', '−')
    v = float(v)
    if v != 0 and (abs(v) < 1e-4 or abs(v) >= 1e9):
        m, e = f'{v:.4e}'.split('e')
        m = m.rstrip('0').rstrip('.')
        return f'{m.replace(".", ",")}·10^{int(e)}'.replace('-', '−')
    s = f'{v:.{d}f}'.rstrip('0').rstrip('.')
    if s in ('-0', ''): s = '0'
    ip, _, fp = s.partition('.')
    neg = ip.startswith('-'); ip = ip.lstrip('-')
    ip = f'{int(ip):,}'.replace(',', '.') if len(ip) > 4 else ip
    return ('−' if neg else '') + ip + (',' + fp if fp else '')

# ---------------------------------------------------------------- métodos (gabarito)
def bisect_rows(src, a, b, k):
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa, fb = f(a), f(b)
    assert fa * fb < 0, ('sem troca de sinal', src, a, b)
    rows = []
    for i in range(1, k + 1):
        m = (a + b) / 2; fm = f(m)
        keep = 'esquerda' if fa * fm < 0 else 'direita'
        rows.append([i, br(a), br(b), br(m, 8), br(fm, 6), f'[{br(a)}; {br(m, 8)}]' if keep == 'esquerda' else f'[{br(m, 8)}; {br(b)}]'])
        if fa * fm < 0: b, fb = m, fm
        else: a, fa = m, fm
    return rows, m

def bisect_root(src, a, b, tol):
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa = f(a)
    rows, i = [], 0
    while True:
        i += 1; m = (a + b) / 2; fm = f(m)
        rows.append([i, br(a), br(b), br(m, 8), br(fm, 6), br((b - a) / 2, 6)])
        if (b - a) / 2 <= tol: return rows, m
        if fa * fm < 0: b = m
        else: a, fa = m, fm

def true_root(src, guess):
    return mp.findroot(mpf(side(src)), mp.mpf(guess), tol=mp.mpf(10) ** -40)

def newton_rows(src, x0, k):
    e = side(src); f, d = mpf(e), mpf(sp.diff(e, X)); x = mp.mpf(x0); rows = []
    for i in range(k):
        fx, dx = f(x), d(x); nx = x - fx / dx
        rows.append([i, br(x, 8), br(fx, 6), br(dx, 6), br(nx, 8)]); x = nx
    return rows, x

def newton_until(src, x0, tol):
    e = side(src); f, d = mpf(e), mpf(sp.diff(e, X)); x = mp.mpf(x0); rows = []
    for i in range(30):
        fx, dx = f(x), d(x); nx = x - fx / dx
        rows.append([i, br(x, 8), br(fx, 6), br(dx, 6), br(nx, 8)])
        if abs(nx - x) < tol: return rows, nx
        x = nx
    raise Exception('Newton não convergiu ' + src)

def secant_rows(src, x0, x1, k):
    f = mpf(side(src)); a, b = mp.mpf(x0), mp.mpf(x1); rows = []
    for i in range(1, k + 1):
        fa, fb = f(a), f(b); c = b - fb * (b - a) / (fb - fa)
        rows.append([i, br(a, 8), br(b, 8), br(fa, 6), br(fb, 6), br(c, 8)]); a, b = b, c
    return rows, b

def secant_until(src, x0, x1, tol):
    f = mpf(side(src)); a, b = mp.mpf(x0), mp.mpf(x1); rows = []
    for i in range(1, 40):
        fa, fb = f(a), f(b); c = b - fb * (b - a) / (fb - fa)
        rows.append([i, br(a, 8), br(b, 8), br(fa, 6), br(fb, 6), br(c, 8)])
        if abs(c - b) < tol: return rows, c
        a, b = b, c
    raise Exception('Secante não convergiu ' + src)

def parse_lin(lines, names):
    A, bb = [], []
    for ln in lines:
        e = side(ln); syms = [sp.Symbol(n) for n in names]
        e = e.subs({sp.Symbol('x'): syms[0]}) if names[0] == 'x' else e
        row = [Fr(str(sp.nsimplify(sp.diff(e, s)))) for s in syms]
        const = -Fr(str(sp.nsimplify(e.subs({s: 0 for s in syms}))))
        A.append(row); bb.append(const)
    return A, bb

def F2(src):
    t = src.replace('^', '**')
    t = re.sub(r'(\d)\s*([a-z])', r'\1*\2', t)
    return sp.sympify(t)

def linsys(lines, names):
    syms = [sp.Symbol(n) for n in names]; A, bb = [], []
    for ln in lines:
        l, r = ln.split('='); e = sp.nsimplify(F2(l) - F2(r), rational=True)
        A.append([Fr(str(sp.diff(e, s))) for s in syms])
        bb.append(-Fr(str(e.subs({s: 0 for s in syms}))))
    return A, bb

def fmt_mat(M):
    return [[br(v) for v in row] for row in M]

def gauss_steps(A, b, names):
    n = len(A); M = [A[i][:] + [b[i]] for i in range(n)]; steps = [{'t': 'Matriz aumentada inicial', 'm': fmt_mat(M)}]
    for k in range(n):
        col = [abs(M[i][k]) for i in range(k, n)]; big = max(col)
        if M[k][k] == 0 or abs(M[k][k]) < Fr(1, 100) * big:
            p = k + col.index(big); M[k], M[p] = M[p], M[k]
            steps.append({'t': f'Trocar L{k+1} ↔ L{p+1}: o pivô {"é zero" if col[0] == 0 else "é muito pequeno"}', 'm': fmt_mat(M)})
        for i in range(k + 1, n):
            if M[i][k] == 0: continue
            m = M[i][k] / M[k][k]
            M[i] = [M[i][j] - m * M[k][j] for j in range(n + 1)]
            steps.append({'t': f'L{i+1} ← L{i+1} − ({br(m)})·L{k+1}', 'm': fmt_mat(M)})
    x = [Fr(0)] * n; back = []
    for i in range(n - 1, -1, -1):
        s = M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n)); x[i] = s / M[i][i]
        back.append(f'{names[i]} = {br(x[i])}')
    steps.append({'t': 'Retrossubstituição: ' + '; '.join(back), 'm': None})
    return steps, x

def seidel_rows(A, b, x0, k):
    n = len(A); x = [mp.mpf(v) for v in x0]; rows = [[0] + [br(v) for v in x]]
    for it in range(1, k + 1):
        for i in range(n):
            s = mp.mpf(b[i].numerator) / b[i].denominator - sum((mp.mpf(A[i][j].numerator) / A[i][j].denominator) * x[j] for j in range(n) if j != i)
            x[i] = s / (mp.mpf(A[i][i].numerator) / A[i][i].denominator)
        rows.append([it] + [br(v, 6) for v in x])
    return rows, x

def seidel_until(A, b, x0, tol):
    n = len(A); x = [mp.mpf(v) for v in x0]; rows = [[0] + [br(v) for v in x]]
    for it in range(1, 200):
        old = x[:]
        for i in range(n):
            s = mp.mpf(b[i].numerator) / b[i].denominator - sum((mp.mpf(A[i][j].numerator) / A[i][j].denominator) * x[j] for j in range(n) if j != i)
            x[i] = s / (mp.mpf(A[i][i].numerator) / A[i][i].denominator)
        rows.append([it] + [br(v, 6) for v in x])
        if max(abs(x[i] - old[i]) for i in range(n)) < tol: return rows, x
    raise Exception('Seidel não convergiu')

def dominant(A):
    return all(abs(A[i][i]) > sum(abs(A[i][j]) for j in range(len(A)) if j != i) for i in range(len(A)))

def update_formulas(A, b, names):
    """Fórmulas de atualização do Gauss-Seidel já simplificadas: x = (175 + y + z) / 4."""
    out = []
    for i, nm in enumerate(names):
        expr = br(b[i])
        for j in range(len(A)):
            c = A[i][j]
            if j == i or c == 0: continue
            mag = '' if abs(c) == 1 else br(abs(c)) + '·'
            expr += (' + ' if c < 0 else ' − ') + mag + names[j]
        out.append(f'{nm} = ({expr}) / {br(A[i][i])}' if A[i][i] != 1 else f'{nm} = {expr}')
    return out

SUBS = str.maketrans('0123456789', '₀₁₂₃₄₅₆₇₈₉')
def sub(k): return str(k).translate(SUBS)

def pretty_sym(e):
    s = sp.sstr(sp.simplify(e)).replace('**', '^').replace('*', '·').replace('log(', 'ln(').replace('exp(', 'e^(')
    s = re.sub(r'(\d)\.(\d)', r'\1,\2', s)
    return s.replace('-', '−')


# ================================================================= v9: Falsa Posição, Ponto Fixo, armadilhas e convergência
def fp_rows(src, a, b, k=None, eps=None, swap=False, invert=False):
    """Falsa Posição com mpmath. k iterações fixas ou até |f(x)| <= eps. swap/invert simulam erros típicos."""
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa, fb = f(a), f(b)
    assert fa * fb < 0, ('Falsa Posição sem troca de sinal', src, a, b)
    rows, i = [], 0
    while True:
        i += 1
        x = (a * fa - b * fb) / (fa - fb) if swap else (a * fb - b * fa) / (fb - fa)
        fx = f(x)
        keep_b = fa * fx > 0  # mesmo sinal de f(a): a ← x
        if invert: keep_b = not keep_b
        rows.append([i, br(a, 8), br(b, 8), br(fa, 6), br(fb, 6), br(x, 8), br(fx, 6),
                     f'[{br(x, 8)}; {br(b, 8)}]' if keep_b else f'[{br(a, 8)}; {br(x, 8)}]'])
        if (k and i >= k) or (eps is not None and abs(fx) <= eps) or i > 400: return rows, x, i, fx
        if keep_b: a, fa = x, fx
        else: b, fb = x, fx

def bisect_k(src, a, b, k, invert=False):
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa = f(a)
    for i in range(k):
        m = (a + b) / 2; fm = f(m)
        left = fa * fm < 0
        if invert: left = not left
        if i == k - 1: return m
        if left: b = m
        else: a, fa = m, fm

def bisect_count_f(src, a, b, eps):
    """Iterações da Bisseção até |f(m)| <= eps (para comparar com a Falsa Posição)."""
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa = f(a); n = 0
    while n < 400:
        n += 1; m = (a + b) / 2; fm = f(m)
        if abs(fm) <= eps: return n
        if fa * fm < 0: b = m
        else: a, fa = m, fm

def pf_rows(g, x0, k=None, tol=None, gexpr=None):
    G = mpf(gexpr if gexpr is not None else F(g)); x = mp.mpf(x0); rows, i = [], 0
    while True:
        gx = G(x)
        rows.append([i, br(x, 8), br(gx, 8), br(abs(gx - x), 6)])
        i += 1
        if (k and i >= k) or (tol is not None and abs(gx - x) < tol) or i > 300: return rows, gx, i
        x = gx

def newton_x(src, x0, k, plus=False, expr=None):
    e = expr if expr is not None else side(src); f, d = mpf(e), mpf(sp.diff(e, X)); x = mp.mpf(x0)
    for _ in range(k): x = x + f(x) / d(x) if plus else x - f(x) / d(x)
    return x

def secant_x(src, x0, x1, k, plus=False, fixed=False, expr=None):
    f = mpf(expr if expr is not None else side(src)); a, b = mp.mpf(x0), mp.mpf(x1)
    for _ in range(k):
        fa, fb = f(a), f(b); step = fb * (b - a) / (fb - fa); c = b + step if plus else b - step
        if fixed: b = c
        else: a, b = b, c
    return b

def has_trig(e): return e.has(sp.sin, sp.cos, sp.tan)
def deg_expr(e):
    """A mesma expressão com seno, cosseno e tangente avaliados em graus (erro de calculadora)."""
    rep = {}
    for fn in (sp.sin, sp.cos, sp.tan):
        for t in e.atoms(fn): rep[t] = fn(t.args[0] * sp.pi / 180)
    return e.xreplace(rep)

def real_at(f, x):
    try:
        v = f(x)
        if isinstance(v, mp.mpc):
            if abs(v.imag) > mp.mpf(10) ** -30: return None
            v = v.real
        return v if mp.isfinite(v) else None
    except Exception:
        return None

def other_roots(src, r, lo, hi, n=4000):
    """Outras raízes reais de f em [lo, hi] (trocas de sinal numa amostragem)."""
    f = mpf(side(src)); out = []; xs = [lo + (hi - lo) * i / n for i in range(n + 1)]; prev = None
    for x in xs:
        v = real_at(f, mp.mpf(x))
        if v is not None and prev is not None and prev[1] * v < 0:
            try:
                z = mp.findroot(f, (prev[0], mp.mpf(x)), solver='anderson')
                if abs(z - r) > 1e-4 * (1 + abs(r)) and all(abs(z - o) > 1e-6 for o in out): out.append(z)
            except Exception: pass
        prev = (mp.mpf(x), v) if v is not None else None
    return out

def nice(v, s):
    return float(mp.nstr(mp.mpf(v), 8)) if s == 0 else round(round(v / s) * s, 10)

def find_bracket(src, r):
    """Intervalo 'redondo' com troca de sinal e uma única raiz, para o gráfico de convergência."""
    f = mpf(side(src)); r = float(r)
    for frac in [0.5, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005]:
        d = frac * (1 + abs(r)); s = 10 ** math.floor(math.log10(d))
        a, b = math.floor((r - d) / s) * s, math.ceil((r + d) / s) * s
        a, b = round(a, 10), round(b, 10)
        vals = [real_at(f, mp.mpf(a + (b - a) * i / 60)) for i in range(61)]
        if any(v is None for v in vals): continue
        changes = sum(1 for i in range(60) if vals[i] * vals[i + 1] < 0 or vals[i + 1] == 0)
        if vals[0] * vals[-1] < 0 and changes == 1: return a, b
    raise Exception('sem intervalo para o gráfico ' + src)

def conv_root(src, r, a=None, b=None, x0=None, x1=None):
    if a is None or b is None:
        try: a, b = find_bracket(src, r)
        except Exception: a, b = None, None
    if a is None: return {'a': None, 'b': None, 'x0': x0, 'x1': x1 if x1 is not None else (round(x0 + 0.1 * max(1, abs(x0)), 10) if x0 is not None else None)}
    if x0 is None: x0 = round(a + (b - a) / 2, 10)
    if x1 is None:
        step = 10 ** math.floor(math.log10(max(abs(b - a) / 4, 1e-9)))
        x1 = round(x0 + (step if x0 <= float(r) else -step), 10)
    return {'a': a, 'b': b, 'x0': x0, 'x1': x1}

def tol_of(answer, i, v):
    if answer.get('abs'): return answer['abs']
    if answer['type'] == 'int': return 0.5
    return max(6e-4 * abs(v), 1e-9)

def traps_for(answer, cands):
    """Erros típicos: valores errados reconhecíveis, cada um com a explicação do engano."""
    want = answer['values'] if answer['type'] == 'vec' else [answer['value']]
    out = []
    for v, msg in cands:
        if v is None: continue
        vs = [float(t) for t in (v if isinstance(v, (list, tuple)) else [v])]
        if len(vs) != len(want) or any(not math.isfinite(t) for t in vs): continue
        far = lambda u, w: any(abs(u[i] - w[i]) > 3 * tol_of(answer, i, w[i]) for i in range(len(w)))
        if not far(vs, want) or any(not far(vs, o['v'] if isinstance(o['v'], list) else [o['v']]) for o in out): continue
        out.append({'v': [r10(t) for t in vs] if answer['type'] == 'vec' else (int(round(vs[0])) if answer['type'] == 'int' else r10(vs[0])), 'm': msg})
    return out

T_ANTES = 'Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁.'
T_DEPOIS = 'Esse é o resultado de uma iteração a mais do que o pedido.'
T_GRAUS = 'Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.'
T_FX = 'Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.'
T_OUTRA = 'Essa é outra raiz da mesma equação. O problema pede a raiz no intervalo dado (ou a que tem sentido físico, perto do chute).'

def it(k): return 'iteração' if k == 1 else 'iterações'

# ---------------------------------------------------------------- registro dos exercícios
def add(method, level, area, title, story, ask, answer, steps, why, given, source, terminal, extra=None, blind=None, traps=None, conv=None, root=None):
    assert '[[' in story, title
    item = {'method': method, 'level': level, 'area': area, 'title': title, 'story': story, 'ask': ask, 'askBlind': blind or ask, 'answer': answer,
            'steps': steps, 'why': why, 'given': given, 'source': source, 'terminal': terminal}
    if extra: item.update(extra)
    if traps: item['traps'] = traps
    if conv: item['conv'] = conv
    if root is not None: item['root'] = r10(root)
    EX.append(item)

def root_of(src, guess):
    return true_root(src, guess)

def root_in(src, a, b):
    """Raiz no intervalo por bissecção em 50 dígitos (robusta para curvas íngremes)."""
    f = mpf(side(src)); a, b = mp.mpf(a), mp.mpf(b); fa = f(a)
    assert fa * f(b) < 0, ('sem troca de sinal', src)
    for _ in range(170):
        m = (a + b) / 2; fm = f(m)
        if fm == 0: return m
        if fa * fm < 0: b = m
        else: a, fa = m, fm
    return (a + b) / 2

def B_mid(level, area, title, story, src, a, b, k, why):
    rows, m = bisect_rows(src, a, b, k)
    r = root_in(src, a, b)
    ans = {'type': 'num', 'value': r10(m)}
    cands = [(bisect_k(src, a, b, k - 1) if k > 1 else None, 'Esse é o ponto médio da iteração anterior (m' + sub(k - 1) + '). A 1ª iteração já produz m₁.'),
             (bisect_k(src, a, b, k + 1), T_DEPOIS),
             (bisect_k(src, a, b, k, invert=True), 'Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m).'),
             (fp_rows(src, a, b, k=k)[1], 'Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio.'),
             (mpf(side(src))(m), T_FX)]
    if has_trig(side(src)):
        try: cands.append((bisect_rows_expr(deg_expr(side(src)), a, b, k), T_GRAUS))
        except Exception: pass
    add('bisection', level, area, title, story, f'Faça {k} {it(k)} da Bisseção em [{br(a)}; {br(b)}]. Qual é o ponto médio m{sub(k)}?', ans,
        {'kind': 'table', 'cols': ['k', 'a', 'b', 'm = (a+b)/2', 'f(m)', 'Novo intervalo'], 'rows': rows,
         'note': f'Depois de {k} iterações, a raiz está a no máximo (b − a)/2^{k} = {br((b - a) / 2 ** k, 6)} de m{sub(k)}.'},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]']], src, {'algorithm': 'bisection', 'a': a, 'b': b}, {'check': {'k': k, 'a': a, 'b': b}},
        blind=f'Faça {k} {it(k)} do método mais indicado no intervalo [{br(a)}; {br(b)}]. Qual é a aproximação obtida na iteração {k}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

def bisect_rows_expr(e, a, b, k):
    f = mpf(e); a, b = mp.mpf(a), mp.mpf(b); fa = f(a)
    if fa * f(b) >= 0: return None
    for i in range(k):
        m = (a + b) / 2; fm = f(m)
        if i == k - 1: return m
        if fa * fm < 0: b = m
        else: a, fa = m, fm

def B_count(level, area, title, story, src, a, b, eps, why):
    n = math.ceil(math.log2((b - a) / eps) - 1e-12)
    assert (b - a) / 2 ** n <= eps < (b - a) / 2 ** (n - 1)
    f = mpf(side(src)); assert f(mp.mpf(a)) * f(mp.mpf(b)) < 0, title
    r = root_in(src, a, b)
    ans = {'type': 'int', 'value': n}
    cands = [(n - 1, f'Com {n - 1} iterações a cota ainda seria {br((b - a) / 2 ** (n - 1), 8)}, acima de {br(eps, 8)}. Arredonde n sempre para cima.'),
             (n + 1, f'Funciona, mas não é o menor: com {n} iterações a cota já fica ≤ {br(eps, 8)}.'),
             (math.ceil(math.log10((b - a) / eps)), 'Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).')]
    add('bisection', level, area, title, story, f'Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [{br(a)}; {br(b)}] garantem erro ≤ {br(eps, 8)}?',
        ans,
        {'kind': 'text', 'lines': [f'Depois de n iterações, o ponto médio está a no máximo (b − a)/2ⁿ da raiz.',
                                    f'Exigir ({br(b)} − {br(a)})/2ⁿ ≤ {br(eps, 8)}  ⇒  2ⁿ ≥ {br((b - a) / eps, 4)}  ⇒  n ≥ log₂({br((b - a) / eps, 4)}) ≈ {br(math.log2((b - a) / eps), 3)}.',
                                    f'Como n é inteiro, n = {n}. Com {n - 1} iterações a cota seria {br((b - a) / 2 ** (n - 1), 8)}, ainda maior que {br(eps, 8)}.']},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]'], ['Erro máximo', br(eps, 8)]], src, {'algorithm': 'bisection', 'a': a, 'b': b}, {'check': {'n': n, 'a': a, 'b': b, 'eps': eps}},
        blind=f'Antes de calcular qualquer ponto: com o método mais indicado no intervalo [{br(a)}; {br(b)}], quantas iterações garantem erro ≤ {br(eps, 8)}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

def B_tol(level, area, title, story, src, a, b, tol, why):
    rows, m = bisect_root(src, a, b, tol)
    r = true_root(src, m)
    ans = {'type': 'num', 'value': r10(r), 'abs': tol}
    cands = [(o, T_OUTRA) for o in other_roots(src, r, a - 10, b + 10)]
    add('bisection', level, area, title, story, f'Use a Bisseção em [{br(a)}; {br(b)}] até a cota de erro ficar ≤ {br(tol, 6)}. Qual é a estimativa da raiz?',
        ans,
        {'kind': 'table', 'cols': ['k', 'a', 'b', 'm', 'f(m)', 'Cota (b−a)/2'], 'rows': rows,
         'note': f'Qualquer valor a menos de {br(tol, 6)} da raiz verdadeira ({br(r, 8)}) é aceito.'},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]'], ['Tolerância', br(tol, 6)]], src, {'algorithm': 'bisection', 'a': a, 'b': b}, {'check': {'root': True}},
        blind=f'Encontre a raiz em [{br(a)}; {br(b)}] com erro garantidamente ≤ {br(tol, 6)}. Qual é a estimativa?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

def N_k(level, area, title, story, src, x0, k, why, deriv_hint=None):
    rows, x = newton_rows(src, x0, k)
    d = sp.diff(side(src), X); r = true_root(src, x)
    ans = {'type': 'num', 'value': r10(x)}
    cands = [(newton_x(src, x0, k - 1) if k > 1 else None, T_ANTES), (newton_x(src, x0, k + 1), T_DEPOIS),
             (newton_x(src, x0, k, plus=True), 'Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos.'),
             (mpf(side(src))(x), T_FX)]
    if has_trig(side(src)): cands.append((newton_x(src, x0, k, expr=deg_expr(side(src))), T_GRAUS))
    add('newton', level, area, title, story, f'Partindo de x₀ = {br(x0)}, faça {k} {it(k)} de Newton-Raphson. Qual é x{sub(k)}?',
        ans,
        {'kind': 'table', 'cols': ['k', 'xₖ', 'f(xₖ)', 'f′(xₖ)', 'xₖ₊₁ = xₖ − f/f′'], 'rows': rows,
         'note': f'f′(x) = {deriv_hint or pretty_sym(d)}.'},
        why, [['x₀', br(x0)], ['f′(x)', deriv_hint or pretty_sym(d)]], src, {'algorithm': 'newton', 'x0': x0}, {'check': {'k': k, 'x0': x0}},
        blind=f'Partindo de x₀ = {br(x0)}, faça {k} {it(k)} do método mais indicado. Qual é x{sub(k)}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, x0=x0), root=r)

def N_tol(level, area, title, story, src, x0, digits, why, deriv_hint=None):
    tol = 10 ** -(digits + 1)
    rows, x = newton_until(src, x0, tol)
    d = sp.diff(side(src), X)
    ans = {'type': 'num', 'value': r10(x), 'abs': 0.6 * 10 ** -digits}
    cands = [(o, T_OUTRA) for o in other_roots(src, x, x0 - 10, x0 + 10)]
    if has_trig(side(src)):
        try: cands.append((mp.findroot(mpf(deg_expr(side(src))), x0), T_GRAUS))
        except Exception: pass
    add('newton', level, area, title, story, f'Partindo de x₀ = {br(x0)}, itere Newton-Raphson até a variação ficar menor que 10^−{digits + 1}. Qual é a raiz, com {digits} casas decimais?',
        ans,
        {'kind': 'table', 'cols': ['k', 'xₖ', 'f(xₖ)', 'f′(xₖ)', 'xₖ₊₁'], 'rows': rows,
         'note': f'f′(x) = {deriv_hint or pretty_sym(d)}. Repare como as casas corretas quase dobram a cada passo (convergência quadrática).'},
        why, [['x₀', br(x0)], ['f′(x)', deriv_hint or pretty_sym(d)]], src, {'algorithm': 'newton', 'x0': x0}, {'check': {'root': True}},
        blind=f'Partindo de x₀ = {br(x0)}, encontre a raiz com {digits} casas decimais. Qual é ela?',
        traps=traps_for(ans, cands), conv=conv_root(src, x, x0=x0), root=x)

def S_k(level, area, title, story, src, x0, x1, k, why):
    f = mpf(side(src)); assert f(mp.mpf(x0)) * f(mp.mpf(x1)) > 0, ('Secante: palpites devem ficar do mesmo lado', title)
    rows, x = secant_rows(src, x0, x1, k); r = true_root(src, x)
    ans = {'type': 'num', 'value': r10(x)}
    cands = [(secant_x(src, x0, x1, k - 1) if k > 1 else None, T_ANTES), (secant_x(src, x0, x1, k + 1), T_DEPOIS),
             (secant_x(src, x0, x1, k, plus=True), 'Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)).'),
             (secant_x(src, x0, x1, k, fixed=True) if k > 1 else None, 'Você manteve x₀ fixo em todas as iterações. Na Secante, os dois pontos mais recentes substituem os anteriores.'),
             (f(x), T_FX)]
    if has_trig(side(src)): cands.append((secant_x(src, x0, x1, k, expr=deg_expr(side(src))), T_GRAUS))
    add('secant', level, area, title, story, f'Com x₀ = {br(x0)} e x₁ = {br(x1)}, faça {k} {it(k)} da Secante. Qual é x{sub(k + 1)}?',
        ans,
        {'kind': 'table', 'cols': ['passo', 'xₖ₋₁', 'xₖ', 'f(xₖ₋₁)', 'f(xₖ)', 'xₖ₊₁'], 'rows': rows,
         'note': 'xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). Nenhuma derivada foi calculada.'},
        why, [['x₀', br(x0)], ['x₁', br(x1)]], src, {'algorithm': 'secant', 'x0': x0, 'x1': x1}, {'check': {'k': k, 'x0': x0, 'x1': x1}},
        blind=f'Com x₀ = {br(x0)} e x₁ = {br(x1)}, faça {k} {it(k)} do método mais indicado. Qual é x{sub(k + 1)}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, x0=x0, x1=x1), root=r)

def S_tol(level, area, title, story, src, x0, x1, digits, why):
    f = mpf(side(src)); assert f(mp.mpf(x0)) * f(mp.mpf(x1)) > 0, ('Secante: palpites devem ficar do mesmo lado', title)
    rows, x = secant_until(src, x0, x1, 10 ** -(digits + 1))
    ans = {'type': 'num', 'value': r10(x), 'abs': 0.6 * 10 ** -digits}
    cands = [(o, T_OUTRA) for o in other_roots(src, x, max(1e-6, x0 / 10) if x0 > 0 else x0 - 10, x0 + 10)]
    add('secant', level, area, title, story, f'Com x₀ = {br(x0)} e x₁ = {br(x1)}, itere a Secante até a variação ficar menor que 10^−{digits + 1}. Qual é a raiz, com {digits} casas decimais?',
        ans,
        {'kind': 'table', 'cols': ['passo', 'xₖ₋₁', 'xₖ', 'f(xₖ₋₁)', 'f(xₖ)', 'xₖ₊₁'], 'rows': rows,
         'note': 'Cada passo usa só uma avaliação nova de f.'},
        why, [['x₀', br(x0)], ['x₁', br(x1)]], src, {'algorithm': 'secant', 'x0': x0, 'x1': x1}, {'check': {'root': True}},
        blind=f'Com x₀ = {br(x0)} e x₁ = {br(x1)}, encontre a raiz com {digits} casas decimais.',
        traps=traps_for(ans, cands), conv=conv_root(src, x, x0=x0, x1=x1), root=x)

def gauss_variant(A, b, mode):
    """Eliminação com erro típico: 'rhs' (esquece o lado direito) ou 'sign' (soma em vez de subtrair)."""
    n = len(A); M = [A[i][:] + [b[i]] for i in range(n)]
    for k in range(n):
        col = [abs(M[i][k]) for i in range(k, n)]; big = max(col)
        if big == 0: return None
        if M[k][k] == 0 or abs(M[k][k]) < Fr(1, 100) * big:
            p = k + col.index(big); M[k], M[p] = M[p], M[k]
        for i in range(k + 1, n):
            if M[i][k] == 0: continue
            m = M[i][k] / M[k][k]
            if mode == 'sign': M[i] = [M[i][j] + m * M[k][j] for j in range(n + 1)]
            else: M[i] = [M[i][j] - m * M[k][j] if j < n else M[i][j] for j in range(n + 1)]
    x = [Fr(0)] * n
    for i in range(n - 1, -1, -1):
        if M[i][i] == 0: return None
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return [float(v) for v in x]

def G(level, area, title, story, lines, names, why, ask_var=None, nondom=True):
    A, b = linsys(lines, names)
    if nondom: assert not dominant(A), title
    steps, x = gauss_steps(A, b, names)
    cands = [(gauss_variant(A, b, 'rhs'), 'Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente.'),
             (gauss_variant(A, b, 'sign'), 'Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.')]
    if ask_var:
        i = names.index(ask_var)
        ask = f'Resolva o sistema por Eliminação de Gauss. Qual é o valor de {ask_var}?'
        blind = f'Resolva o sistema. Qual é o valor de {ask_var}?'
        answer = {'type': 'num', 'value': r10(x[i])}
        cands = [(c[i] if c else None, m) for c, m in cands] + [(float(x[j]), f'Esse é o valor de {names[j]}, não de {ask_var}.') for j in range(len(names)) if j != i]
    else:
        ask = 'Resolva o sistema por Eliminação de Gauss. Quais são os valores de ' + ', '.join(names[:-1]) + ' e ' + names[-1] + '?'
        blind = 'Resolva o sistema. Quais são os valores de ' + ', '.join(names[:-1]) + ' e ' + names[-1] + '?'
        answer = {'type': 'vec', 'names': names, 'values': [r10(v) for v in x]}
        cands.append(([float(v) for v in reversed(x)], 'Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.'))
    add('gauss', level, area, title, story, ask, answer, {'kind': 'gauss', 'steps': steps}, why,
        [['Incógnitas', ', '.join(names)], ['Tamanho', f'{len(A)}×{len(A)}']], '\n'.join(lines), {'algorithm': 'gauss'},
        {'system': lines, 'check': {'solution': [r10(v) for v in x]}}, blind=blind, traps=traps_for(answer, cands), conv={'initial': [0] * len(names)})

def jacobi_rows(A, b, x0, k):
    n = len(A); x = [mp.mpf(v) for v in x0]
    for _ in range(k):
        old = x[:]
        x = [(mp.mpf(b[i].numerator) / b[i].denominator - sum((mp.mpf(A[i][j].numerator) / A[i][j].denominator) * old[j] for j in range(n) if j != i)) / (mp.mpf(A[i][i].numerator) / A[i][i].denominator) for i in range(n)]
    return x

def GS(level, area, title, story, lines, names, x0, k, why, until=None):
    A, b = linsys(lines, names)
    assert dominant(A), title
    if until:
        rows, x = seidel_until(A, b, x0, until)
        ask = f'Partindo de ({"; ".join(br(v) for v in x0)}), itere Gauss-Seidel até a maior variação ficar menor que {br(until, 6)}. Qual é a solução aproximada?'
        blind = f'Partindo de ({"; ".join(br(v) for v in x0)}), encontre a solução com três casas decimais. Qual é ela?'
        ans = {'type': 'vec', 'names': names, 'values': [r10(v) for v in x], 'abs': 10 * until}
        cands = [([float(v) for v in seidel_rows(A, b, x0, 2)[1]], 'Você parou cedo demais: a maior variação ainda estava acima da tolerância pedida.')]
    else:
        rows, x = seidel_rows(A, b, x0, k)
        ask = f'Partindo de ({"; ".join(br(v) for v in x0)}), faça {k} {it(k)} de Gauss-Seidel. Qual é o vetor depois da iteração {k}?'
        blind = f'Partindo de ({"; ".join(br(v) for v in x0)}), faça {k} {it(k)} do método mais indicado. Qual é o vetor depois da iteração {k}?'
        ans = {'type': 'vec', 'names': names, 'values': [r10(v) for v in x]}
        cands = [([float(v) for v in jacobi_rows(A, b, x0, k)], 'Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados.'),
                 ([float(v) for v in seidel_rows(A, b, x0, k - 1)[1]] if k > 1 else None, T_ANTES.replace('x₀ é o ponto de partida, e a 1ª iteração já produz x₁', 'o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas')),
                 ([float(v) for v in seidel_rows(A, b, x0, k + 1)[1]], T_DEPOIS)]
    add('seidel', level, area, title, story, ask, ans,
        {'kind': 'table', 'cols': ['iteração'] + names, 'rows': rows, 'formulas': update_formulas(A, b, names),
         'note': 'Cada incógnita usa imediatamente os valores que acabaram de ser calculados na mesma iteração.'},
        why, [['Incógnitas', ', '.join(names)], ['Vetor inicial', '(' + '; '.join(br(v) for v in x0) + ')']], '\n'.join(lines),
        {'algorithm': 'seidel', 'initial': ' '.join(str(v) for v in x0)}, {'system': lines, 'check': {'k': k, 'x0': x0, 'until': until}},
        blind=blind, traps=traps_for(ans, cands), conv={'initial': list(x0)})

# ---------------------------------------------------------------- Falsa Posição
FP_COLS = ['k', 'a', 'b', 'f(a)', 'f(b)', 'x (corda)', 'f(x)', 'Novo intervalo']
FP_NOTE = 'x = (a·f(b) − b·f(a))/(f(b) − f(a)): o ponto em que a corda entre (a, f(a)) e (b, f(b)) cruza o eixo. A ponta trocada é a que tem o mesmo sinal de f(x).'

def FP_k(level, area, title, story, src, a, b, k, why):
    rows, x, _, _ = fp_rows(src, a, b, k=k)
    r = root_in(src, a, b)
    ans = {'type': 'num', 'value': r10(x)}
    cands = [(fp_rows(src, a, b, k=k - 1)[1] if k > 1 else None, T_ANTES.replace('x₀ é o ponto de partida, e a 1ª iteração já produz x₁', 'a 1ª iteração já produz o primeiro corte x₁')),
             (fp_rows(src, a, b, k=k + 1)[1], T_DEPOIS),
             (bisect_k(src, a, b, k), 'Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)).'),
             (fp_rows(src, a, b, k=k, swap=True)[1], 'f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)).'),
             (fp_rows(src, a, b, k=k, invert=True)[1] if k > 1 else None, 'Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada.'),
             (mpf(side(src))(x), T_FX)]
    add('falseposition', level, area, title, story, f'Faça {k} {it(k)} da Falsa Posição em [{br(a)}; {br(b)}]. Qual é x{sub(k)}?', ans,
        {'kind': 'table', 'cols': FP_COLS, 'rows': rows, 'note': FP_NOTE},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]']], src, {'algorithm': 'falseposition', 'a': a, 'b': b}, {'check': {'k': k, 'a': a, 'b': b}},
        blind=f'Faça {k} {it(k)} do método mais indicado no intervalo [{br(a)}; {br(b)}]. Qual é a aproximação obtida na iteração {k}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

def FP_tol(level, area, title, story, src, a, b, eps, digits, why):
    rows, x, n, fx = fp_rows(src, a, b, eps=eps)
    r = root_in(src, a, b)
    assert abs(x - r) < 0.3 * 10 ** -digits, (title, float(abs(x - r)))
    nb = bisect_count_f(src, a, b, eps)
    ans = {'type': 'num', 'value': r10(r), 'abs': 0.6 * 10 ** -digits}
    cands = [(o, T_OUTRA) for o in other_roots(src, r, a - 10 * (b - a), b + 10 * (b - a))] + [(rows and fp_rows(src, a, b, k=1)[1], 'Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.')]
    add('falseposition', level, area, title, story, f'Use a Falsa Posição em [{br(a)}; {br(b)}] até |f(xₖ)| ≤ {br(eps, 10)}. Qual é a raiz, com {digits} casas decimais?', ans,
        {'kind': 'table', 'cols': FP_COLS, 'rows': rows, 'note': FP_NOTE + f' Foram {n} iterações; a Bisseção precisaria de {nb} para o mesmo |f(x)| ≤ {br(eps, 10)}.'},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]'], ['Critério', f'|f(x)| ≤ {br(eps, 10)}']], src, {'algorithm': 'falseposition', 'a': a, 'b': b}, {'check': {'root': True}},
        blind=f'Encontre a raiz em [{br(a)}; {br(b)}] com {digits} casas decimais, mantendo-a sempre cercada. Qual é ela?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

def FP_count(level, area, title, story, src, a, b, eps, why):
    rows, x, n, fx = fp_rows(src, a, b, eps=eps)
    f = mpf(side(src))
    assert abs(fx) < 0.9 * eps, ('margem', title)
    prevx = fp_rows(src, a, b, k=n - 1)[3] if n > 1 else None
    assert prevx is None or abs(prevx) > 1.1 * eps, ('margem anterior', title)
    nb = bisect_count_f(src, a, b, eps); r = root_in(src, a, b)
    ans = {'type': 'int', 'value': n}
    cands = [(nb, f'{nb} é a contagem da Bisseção para o mesmo critério. A corda chega lá em menos passos: refaça com x = (a·f(b) − b·f(a))/(f(b) − f(a)).'),
             (n - 1, f'Na iteração {n - 1}, |f(x)| ainda era {br(abs(prevx), 4) if prevx is not None else "—"}, acima de {br(eps, 10)}.'),
             (n + 1, f'Uma iteração a mais: na iteração {n} já vale |f(x)| ≤ {br(eps, 10)}.')]
    add('falseposition', level, area, title, story, f'Com a Falsa Posição em [{br(a)}; {br(b)}], quantas iterações são necessárias até |f(xₖ)| ≤ {br(eps, 10)}?', ans,
        {'kind': 'table', 'cols': FP_COLS, 'rows': rows, 'note': FP_NOTE + f' A Bisseção, no mesmo intervalo, precisaria de {nb} iterações para chegar a |f(m)| ≤ {br(eps, 10)}.'},
        why, [['Intervalo', f'[{br(a)}; {br(b)}]'], ['Critério', f'|f(x)| ≤ {br(eps, 10)}']], src, {'algorithm': 'falseposition', 'a': a, 'b': b}, {'check': {'count': n, 'a': a, 'b': b, 'eps': eps}},
        blind=f'Com o método mais indicado em [{br(a)}; {br(b)}], quantas iterações são necessárias até |f(xₖ)| ≤ {br(eps, 10)}?',
        traps=traps_for(ans, cands), conv=conv_root(src, r, a, b), root=r)

# ---------------------------------------------------------------- Ponto Fixo
PF_COLS = ['k', 'xₖ', 'g(xₖ) = xₖ₊₁', '|xₖ₊₁ − xₖ|']

def PF_k(level, area, title, story, g, x0, k, why, gpretty=None):
    ge = F(g); G_ = mpf(ge)
    rows, x, _ = pf_rows(g, x0, k=k)
    r = mp.findroot(lambda t: t - G_(t), x); L = abs(mp.diff(G_, r)); assert L < 1, (title, L)
    src = f'x - ({g})'
    ans = {'type': 'num', 'value': r10(x)}
    cands = [(pf_rows(g, x0, k=k - 1)[1] if k > 1 else None, T_ANTES), (pf_rows(g, x0, k=k + 1)[1], T_DEPOIS),
             (x - G_(x), 'Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.')]
    if has_trig(ge): cands.append((pf_rows(g, x0, k=k, gexpr=deg_expr(ge))[1], T_GRAUS))
    gp = gpretty or pretty_sym(ge)
    add('fixedpoint', level, area, title, story, f'Partindo de x₀ = {br(x0)}, faça {k} {it(k)} de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x{sub(k)}?', ans,
        {'kind': 'table', 'cols': PF_COLS, 'rows': rows,
         'note': f'g(x) = {gp}. Perto do ponto fixo, |g′(x*)| ≈ {br(L, 3)} < 1: o erro cai por um fator de cerca de {br(L, 3)} a cada passo{" e os valores oscilam em volta da raiz, porque g′ é negativa" if mp.diff(G_, r) < 0 else ""}.'},
        why, [['g(x)', gp], ['x₀', br(x0)]], src, {'algorithm': 'fixedpoint', 'x0': x0, 'g': g}, {'g': g, 'check': {'k': k, 'x0': x0}},
        blind=f'Partindo de x₀ = {br(x0)}, faça {k} {it(k)} do método mais indicado. Qual é x{sub(k)}?',
        traps=traps_for(ans, cands), conv={**conv_root(src, r, x0=x0), 'g': g}, root=r)

def PF_tol(level, area, title, story, g, x0, digits, why, gpretty=None):
    ge = F(g); G_ = mpf(ge)
    rows, x, n = pf_rows(g, x0, tol=10 ** -(digits + 1))
    r = mp.findroot(lambda t: t - G_(t), x); L = abs(mp.diff(G_, r)); assert L < 1, (title, L)
    assert abs(x - r) < 0.3 * 10 ** -digits, (title, float(abs(x - r)))
    src = f'x - ({g})'
    ans = {'type': 'num', 'value': r10(r), 'abs': 0.6 * 10 ** -digits}
    cands = [(pf_rows(g, x0, k=2)[1], 'Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.')]
    if has_trig(ge):
        try: cands.append((pf_rows(g, x0, tol=10 ** -(digits + 1), gexpr=deg_expr(ge))[1], T_GRAUS))
        except Exception: pass
    gp = gpretty or pretty_sym(ge)
    add('fixedpoint', level, area, title, story, f'Partindo de x₀ = {br(x0)}, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10^−{digits + 1}. Qual é o ponto fixo, com {digits} casas decimais?', ans,
        {'kind': 'table', 'cols': PF_COLS, 'rows': rows,
         'note': f'g(x) = {gp}. |g′(x*)| ≈ {br(L, 3)}: com fator L < 1, o erro fica abaixo de L/(1 − L) vezes a última variação.'},
        why, [['g(x)', gp], ['x₀', br(x0)]], src, {'algorithm': 'fixedpoint', 'x0': x0, 'g': g}, {'g': g, 'check': {'root': True}},
        blind=f'Partindo de x₀ = {br(x0)}, encontre a solução com {digits} casas decimais. Qual é ela?',
        traps=traps_for(ans, cands), conv={**conv_root(src, r, x0=x0), 'g': g}, root=r)

# ================================================================= BISSEÇÃO (20)
W_BIS = 'Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.'
B_mid(1, 'Matemática', 'Raiz de 5 sem calculadora',
      'A calculadora quebrou e você precisa de √5 para um projeto. Sabe-se que [[f(2) = −1 e f(3) = 4 têm sinais opostos|sinais opostos nas pontas]]. Como tudo será feito à mão, você quer [[contas mínimas: cada passo é só a média de dois números|conta mais simples]] e [[saber de antemão o erro depois de cada passo|cota de erro a priori]].',
      'x^2 - 5', 2, 3, 3, W_BIS)
B_count(1, 'Matemática', 'Cosseno encontra a reta',
        'Para f(x) = cos(x) − x, [[f(0) = 1 > 0 e f(1) ≈ −0,46 < 0|sinais opostos nas pontas]]. O professor pede que você [[diga quanto trabalho será necessário antes de calcular qualquer ponto|cota de erro a priori]].',
        'cos(x) - x', 0, 1, 0.001, W_BIS)
B_count(2, 'Engenharia civil', 'Nível do tanque esférico',
        'Um tanque esférico de raio 2 m guarda 20 m³ de água. O volume com altura h é V = πh²(3·2 − h)/3. [[A altura está fisicamente entre 0 e 4 m, e f muda de sinal nesse intervalo|intervalo físico garantido]]. A norma exige [[erro garantido de no máximo 1 cm|cota de erro]].',
        'pi*x^2*(6 - x)/3 - 20', 0, 4, 0.01, W_BIS)
B_count(2, 'Finanças', 'Auditoria da taxa de juros',
        'Um empréstimo de R$ 10.000 em 24 parcelas de R$ 500 tem taxa mensal i que satisfaz 10000·i/(1 − (1+i)^−24) = 500. [[O contrato garante que a taxa está entre 1% e 3% ao mês|intervalo garantido]] e o auditor exige [[um limite de erro garantido de 0,01 ponto percentual|cota de erro]].',
        '10000*x/(1 - (1 + x)^(-24)) - 500', 0.01, 0.03, 0.0001, W_BIS)
B_mid(3, 'Eletrônica', 'Diodo com exponencial íngreme',
      'No circuito do diodo, a tensão V satisfaz 10⁻⁹(e^{40V} − 1) + V/100 = 0,05. [[A exponencial é tão íngreme que, com V₀ = 0, o Newton salta para V = 5|Newton instável aqui]], onde e²⁰⁰ explode. Por outro lado, [[f(0) < 0 e f(1) > 0|sinais opostos nas pontas]], e [[a curva fica quase plana e depois dispara: uma corda entre as pontas cortaria sempre do mesmo lado|curva torta demais para a corda]].',
      '0.000000001*(exp(40*x) - 1) + x/100 - 0.05', 0, 1, 4,
      'Newton é instável por causa da exponencial, e a Falsa Posição ficaria presa numa ponta nessa curva tão torta. Com um intervalo de sinais opostos, a Bisseção avança com segurança e ritmo garantido.')
B_mid(3, 'Matemática', 'O Newton que ficou girando',
      'Um colega tentou resolver x³ − 2x + 2 = 0 com Newton a partir de x₀ = 0 e [[ficou preso no ciclo 0 → 1 → 0 → 1…|Newton em ciclo]]. Você observa que [[f(−2) = −2 < 0 e f(−1) = 3 > 0|sinais opostos nas pontas]], e o relatório precisa [[informar o erro máximo depois de 3 passos|cota de erro a priori]].',
      'x^3 - 2*x + 2', -2, -1, 3,
      'Quando o Newton cicla ou diverge, a saída robusta é a Bisseção num intervalo com troca de sinal: ela converge sempre, ainda que devagar.')
B_count(2, 'Química', 'pH de um ácido fraco',
        'Para um ácido fraco 0,1 mol/L com Ka = 1,8·10⁻⁵, a concentração x = [H⁺] satisfaz x²/(0,1 − x) = 1,8·10⁻⁵. [[Sabe-se que x está entre 0 e 0,01 mol/L e f muda de sinal ali|intervalo com sinais opostos]], e o laudo precisa [[declarar o erro máximo: 10⁻⁶ mol/L|cota de erro]].',
        'x^2/(0.1 - x) - 0.000018', 0, 0.01, 0.000001, W_BIS)
B_count(2, 'Computação', 'Quantos dados cabem em 1 segundo?',
        'Um algoritmo faz n·log₂(n) operações e o processador executa 10⁷ por segundo. [[f(n) = n·log₂(n) − 10⁷ é crescente, com f(100.000) < 0 < f(1.000.000)|monotonia e sinais opostos]]. Você quer n [[com erro garantido de no máximo 1 unidade|cota de erro]].',
        'x*ln(x)/ln(2) - 10000000', 100000, 1000000, 1, W_BIS)
B_mid(1, 'Física', 'Máximos da difração',
      'Os máximos secundários de uma fenda satisfazem tan(x) = x. [[A tangente tem um polo em 3π/2 ≈ 4,71, e o intervalo [4,4; 4,6] fica antes dele|intervalo seguro, longe do polo]]. Como [[f(4,4) < 0 < f(4,6)|sinais opostos nas pontas]], você quer um método que [[não pule para o outro lado do polo|não pode sair do intervalo]]. [[Perto do polo a curva sobe muito rápido: uma corda cortaria sempre do mesmo lado e andaria devagar|curva torta demais para a corda]].',
      'tan(x) - x', 4.4, 4.6, 3, 'Perto de um polo, Newton e Secante podem saltar para outro ramo da tangente, e a Falsa Posição andaria devagar com uma ponta parada. A Bisseção fica no intervalo seguro e corta sempre pela metade.')
B_mid(1, 'Matemática', 'Onde e⁻ˣ cruza a reta',
      'Você quer o ponto em que e⁻ˣ = x. [[f(0) = 1 > 0 e f(1) ≈ −0,63 < 0|sinais opostos nas pontas]] e, por enquanto, [[basta um intervalo que certamente contenha a raiz, com largura conhecida de antemão: 1/2⁴ depois de 4 passos|cota de erro a priori]].',
      'exp(-x) - x', 0, 1, 4, W_BIS)
B_mid(2, 'Biologia', 'Quando a população chega a 600?',
      'Uma população segue P(t) = 1000/(1 + 9e^{−0,5t}). [[P cresce o tempo todo e f(t) = P(t) − 600 vale f(0) < 0 < f(10)|monotonia e sinais opostos]]. O biólogo quer [[um intervalo de tempo que certamente contenha o instante, com largura conhecida antes de calcular|cota de erro a priori]].',
      '1000/(1 + 9*exp(-0.5*x)) - 600', 0, 10, 3, W_BIS)
B_mid(2, 'Logística', 'Custo com um “bico”',
      'O custo de entrega envolve a distância ao depósito em x = 1,2 km: f(x) = |x − 1,2| + x/3 − 1. [[O módulo cria um bico em x = 1,2, onde a derivada não existe|sem derivada no bico]], e [[f(1) < 0 < f(3)|sinais opostos nas pontas]]. A planilha de custos exige [[o erro máximo declarado antes do cálculo|cota de erro a priori]].',
      'abs(x - 1.2) + x/3 - 1', 1, 3, 4, 'Newton depende de f′, que não existe no bico do módulo. A Bisseção só precisa de continuidade e troca de sinal, e é a única que garante o erro antes de começar.')
B_tol(3, 'História da matemática', 'O exemplo clássico do livro',
      'Este é o exemplo que abre muitos livros de Análise Numérica: x³ + 4x² − 10 = 0 em [1; 2]. [[f(1) = −5 e f(2) = 14|sinais opostos nas pontas]], e pede-se [[erro garantidamente menor que 0,001|cota de erro]].',
      'x^3 + 4*x^2 - 10', 1, 2, 0.001, W_BIS)
B_mid(2, 'Meteorologia', 'A tarde passa dos 20 °C',
      'A temperatura do dia segue T(t) = 15 + 8·sen(π(t − 9)/12), com t em horas. [[Entre 9 h e 15 h ela só sobe, com T(9) − 20 < 0 < T(15) − 20|monotonia e sinais opostos]]. O meteorologista quer [[garantir em que intervalo de horário isso acontece, com precisão conhecida de antemão: 6 h/2³ depois de 3 passos|cota de erro a priori]].',
      '15 + 8*sin(pi*(x - 9)/12) - 20', 9, 15, 3, W_BIS)
B_count(1, 'Matemática', 'Raiz cúbica de 7',
        'Para obter ∛7 resolvendo x³ − 7 = 0, note que [[1³ < 7 < 2³: há troca de sinal em [1; 2]|sinais opostos nas pontas]]. O enunciado pede [[quatro casas garantidas (erro ≤ 0,0001)|cota de erro]].',
        'x^3 - 7', 1, 2, 0.0001, W_BIS)
B_mid(3, 'Engenharia mecânica', 'A tangente horizontal no chute',
      'Para x³ − 3x + 1 = 0, o chute natural seria x₀ = 1, mas [[f′(1) = 0: a tangente é horizontal e o Newton não sai do lugar|Newton falha no chute]]. Felizmente, [[f(1) = −1 < 0 < f(2) = 3|sinais opostos nas pontas]], e o professor quer [[o erro máximo de cada passo, sem depender da forma da curva|cota de erro a priori]].',
      'x^3 - 3*x + 1', 1, 2, 4, 'Com derivada nula no chute, Newton falha. A Bisseção usa só os sinais e funciona.')
B_count(2, 'Agricultura', 'Profundidade do canal de irrigação',
        'Num canal retangular de 2 m de largura, a vazão de 5 m³/s ocorre na profundidade y que satisfaz a fórmula de Manning. [[A água fica entre 0,1 m e 3 m (bordas do canal), com f mudando de sinal|intervalo físico garantido]] e a obra exige [[erro máximo de 1 mm|cota de erro]].',
        '(1/0.015)*(2*x)*(2*x/(2 + 2*x))^(2/3)*sqrt(0.001) - 5', 0.1, 3, 0.001, W_BIS)
B_mid(2, 'Farmacologia', 'Quando o remédio deixa de agir?',
      'A concentração no sangue é C(t) = 20(e^{−0,2t} − e^{−1,2t}). [[Depois do pico, C só diminui, e f(t) = C(t) − 5 vale f(2) > 0 > f(10)|monotonia e sinais opostos]]. A bula precisa de [[um intervalo de tempo com garantia e largura conhecida antes do cálculo|cota de erro a priori]].',
      '20*(exp(-0.2*x) - exp(-1.2*x)) - 5', 2, 10, 3, W_BIS)
B_mid(3, 'Instrumentação', 'Sensor com resposta em raiz',
      'Um sensor responde como √x, e o ponto de operação satisfaz √x = 0,4 + x/10. [[Perto de x = 0 a derivada de √x vai ao infinito|derivada problemática]], mas [[f(0) = −0,4 < 0 < f(1) = 0,5|sinais opostos nas pontas]]. [[A curva é muito torta perto de 0: uma corda andaria devagar|curva torta demais para a corda]].',
      'sqrt(x) - 0.4 - x/10', 0, 1, 4, 'Derivada infinita perto da borda torna o Newton arriscado, e a curva torta deixaria a Falsa Posição lenta; a Bisseção só precisa dos sinais.')
B_count(1, 'Matemática', 'Raiz de 3 com duas casas',
        'Para √3, use x² − 3 = 0. [[f(1) = −2 e f(2) = 1|sinais opostos nas pontas]], e você quer [[saber de antemão quantos passos garantem erro ≤ 0,01|cota de erro a priori]].',
        'x^2 - 3', 1, 2, 0.01, W_BIS)

# ================================================================= NEWTON (20)
W_NEW = 'Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).'
N_k(1, 'Matemática', 'O método de Herão para √10',
    'Para √10, resolva x² − 10 = 0. [[A derivada é só 2x|derivada fácil]] e [[x₀ = 3 já está bem perto, pois 3² = 9|chute inicial bom]].', 'x^2 - 10', 3, 2, W_NEW, '2x')
N_k(1, 'Matemática', 'Raiz cúbica de 20',
    'Para ∛20, resolva x³ − 20 = 0. [[f′(x) = 3x² sai na hora|derivada fácil]] e [[x₀ = 3 é próximo, pois 3³ = 27|chute inicial bom]].', 'x^3 - 20', 3, 1, W_NEW, '3x²')
N_k(2, 'Astronomia', 'Kepler com órbita alongada',
    'Um cometa tem órbita muito alongada (excentricidade e = 0,9) e anomalia média M = 0,1 rad: E − 0,9·sen(E) = 0,1. [[A iteração direta E ← 0,1 + 0,9·sen(E) andaria devagar, porque |g′| ≈ 0,7 perto da raiz|iteração direta lenta]]; já [[f′(E) = 1 − 0,9·cos(E) é simples|derivada fácil]] e [[E₀ = M + e = 1 é o chute clássico dos astrônomos|chute inicial bom]].',
    'x - 0.9*sin(x) - 0.1', 1, 2, 'Com excentricidade alta, a iteração de Ponto Fixo E ← M + e·sen(E) fica lenta (|g′| perto de 1). Newton, com derivada fácil e o chute clássico E₀ = M + e, dobra as casas corretas a cada passo.', '1 − 0,9·cos(x)')
N_k(2, 'Economia', 'Produção de lucro máximo',
    'O lucro é L(x) = 60x − 2x² − 10e^{0,1x}. O ponto ótimo zera L′(x) = 60 − 4x − e^{0,1x}. [[A derivada de L′ também é simples: L″(x) = −4 − 0,1·e^{0,1x}|derivada fácil]] e [[a gerente estima x₀ = 10 mil unidades|chute inicial bom]].',
    '60 - 4*x - exp(0.1*x)', 10, 2, W_NEW, '−4 − 0,1·e^(0,1x)')
N_k(2, 'Biologia', 'Colônia com perdas',
    'Uma colônia de bactérias segue N(t) = 100e^{0,3t} − 50t e o laboratório quer o instante em que N = 500. [[f′(t) = 30e^{0,3t} − 50 é direta|derivada fácil]] e [[o gráfico do experimento indica t₀ = 7 h|chute inicial bom]].',
    '100*exp(0.3*x) - 50*x - 500', 7, 2, W_NEW, '30·e^(0,3x) − 50')
N_k(1, 'Computação', 'Dividir sem dividir',
    'Processadores calculam 1/7 sem dividir: resolvem 1/x − 7 = 0 por Newton. [[A derivada −1/x² transforma a iteração em xₙ₊₁ = xₙ(2 − 7xₙ), só com multiplicações|derivada simples gera fórmula barata]] e [[0,1 é um bom chute para 1/7|chute inicial bom]].',
    '1/x - 7', 0.1, 2, W_NEW, '−1/x²')
N_k(2, 'História da matemática', 'O exemplo do próprio Newton',
    'Em 1669, Newton ilustrou seu método com x³ − 2x − 5 = 0. [[f′(x) = 3x² − 2 é imediata|derivada fácil]] e [[x₀ = 2 está a um passo da raiz, pois f(2) = −1|chute inicial bom]].', 'x^3 - 2*x - 5', 2, 2, W_NEW, '3x² − 2')
N_k(2, 'Física', 'Seno encontra a reta',
    'Você procura a raiz positiva de sen(x) = x/2. [[f′(x) = cos(x) − 1/2 é simples|derivada fácil]] e [[o gráfico mostra a raiz perto de 2|chute inicial bom]].', 'sin(x) - x/2', 2, 2, W_NEW, 'cos(x) − 1/2')
N_k(1, 'Matemática', 'Exponencial contra reta',
    'Resolva eˣ = 3x perto de 1,5. [[f′(x) = eˣ − 3 é direta|derivada fácil]] e [[o chute 1,5 veio de uma tabela de valores|chute inicial bom]].', 'exp(x) - 3*x', 1.5, 1, W_NEW, 'eˣ − 3')
N_k(3, 'Matemática', 'Três passos, nove casas',
    'Calcule √2 resolvendo x² − 2 = 0. [[A derivada é 2x|derivada fácil]] e você quer ver [[como cada passo quase dobra as casas corretas|convergência quadrática]], partindo de [[x₀ = 1|chute inicial razoável]].', 'x^2 - 2', 1, 3, W_NEW, '2x')
N_k(2, 'Engenharia', 'x·ln(x) = 10',
    'Um modelo de desgaste leva a x·ln(x) = 10. [[f′(x) = ln(x) + 1 é simples|derivada fácil]] e [[x₀ = 5 vem de um teste rápido: 5·ln 5 ≈ 8|chute inicial bom]].', 'x*ln(x) - 10', 5, 2, W_NEW, 'ln(x) + 1')
N_k(2, 'Instrumentação', 'Termistor de Steinhart-Hart',
    'Para um termistor, 1/T = A + B·L + C·L³, com L = ln(R). A 310 K: 0,001129 + 0,0002341·L + 8,775·10⁻⁸·L³ = 1/310. [[A derivada em L é um polinômio simples|derivada fácil]] e [[a folha de dados sugere L₀ = 9|chute inicial bom]].',
    '0.001129 + 0.0002341*x + 0.00000008775*x^3 - 1/310', 9, 2, W_NEW, '0,0002341 + 2,6325·10⁻⁷·x²')
N_tol(3, 'Matemática', 'cos(x) = x com seis casas',
      'Você precisa de cos(x) = x [[com seis casas decimais e o mínimo de iterações|alta precisão rápido]]. [[f′(x) = −sen(x) − 1 é fácil e não se anula perto da raiz|derivada fácil e segura]]; [[x₀ = 0,75 é bom|chute inicial bom]]. [[A iteração direta x ← cos(x) levaria dezenas de passos (|g′| ≈ 0,67)|iteração direta lenta]].', 'cos(x) - x', 0.75, 6, W_NEW, '−sen(x) − 1')
N_k(1, 'Geometria', 'Caixa sem tampa de 500 cm³',
    'Cortando quadrados de lado x de uma folha 20 × 20 cm, a caixa tem V = x(20 − 2x)² = 500. [[f é um polinômio: a derivada sai na hora|derivada fácil]] e [[o desenho sugere um corte de cerca de 1,5 cm|chute inicial bom]].', 'x*(20 - 2*x)^2 - 500', 1.5, 2, W_NEW)
N_k(2, 'Esportes', 'Corrida com oscilação',
    'A posição de um atleta é s(t) = 3t + 2·sen(t) metros. Quando ele passa por s = 20? [[f′(t) = 3 + 2·cos(t) é simples e nunca é menor que 1|derivada fácil e sem zeros]], e [[t₀ = 6,5 s é uma boa estimativa|chute inicial bom]].', '3*x + 2*sin(x) - 20', 6.5, 2, W_NEW, '3 + 2·cos(x)')
N_tol(3, 'Engenharia civil', 'Modo de vibração de um prédio',
      'O primeiro modo de vibração de um prédio de três andares sai da menor raiz de λ³ − 7λ² + 14λ − 7 = 0. [[A derivada 3λ² − 14λ + 14 é um polinômio simples|derivada fácil]], [[a estimativa de Rayleigh dá λ₀ = 0,65|chute inicial bom]] e o projeto pede [[seis casas no menor número de passos|alta precisão rápido]].', 'x^3 - 7*x^2 + 14*x - 7', 0.65, 6, W_NEW, '3x² − 14x + 14')
N_k(2, 'Ecologia', 'Equilíbrio presa-predador',
    'Um modelo de equilíbrio leva a x·e⁻ˣ = 0,2, com uma raiz pequena de interesse. [[f′(x) = e⁻ˣ(1 − x) é direta|derivada fácil]] e [[a tabela de campo sugere x₀ = 0,3|chute inicial bom]].', 'x*exp(-x) - 0.2', 0.3, 2, W_NEW, 'e^(−x)·(1 − x)')
N_k(1, 'Matemática', 'Raiz quarta de 3',
    'Calcule ⁴√3 por x⁴ − 3 = 0. [[f′(x) = 4x³|derivada fácil]] e [[1,3⁴ ≈ 2,86 deixa x₀ = 1,3 bem perto|chute inicial bom]].', 'x^4 - 3', 1.3, 1, W_NEW, '4x³')
N_k(2, 'Engenharia mecânica', 'Ângulo de pressão da engrenagem',
    'No projeto de engrenagens, inv(α) = tan(α) − α precisa valer 0,05. [[A derivada é tan²(α), já que sec² − 1 = tan²|derivada fácil]] e [[α₀ = 0,5 rad vem da tabela do fabricante|chute inicial bom]].', 'tan(x) - x - 0.05', 0.5, 2, W_NEW, 'tan²(x)')
N_tol(3, 'Matemática', 'Quíntica de Abel',
      'x⁵ − x − 1 = 0 não tem fórmula com radicais (Abel). [[A derivada 5x⁴ − 1 é barata|derivada fácil]], [[x₀ = 1,2 está perto|chute inicial bom]] e você quer [[seis casas no menor número de passos|alta precisão rápido]].', 'x^5 - x - 1', 1.2, 6, W_NEW, '5x⁴ − 1')

# ================================================================= SECANTE (20)
W_SEC = 'Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.'
S_k(2, 'Finanças', 'Taxa interna de retorno',
    'Um investimento de R$ 1.000 rende R$ 300, R$ 400 e R$ 500 nos próximos três anos. A TIR zera o VPL. [[A planilha do banco só devolve o VPL de cada taxa testada; não há fórmula da derivada|sem derivada]] e [[as taxas 10% e 12% já foram testadas, e as duas deram VPL negativo|dois palpites, sem troca de sinal]].',
    '-1000 + 300/(1 + x) + 400/(1 + x)^2 + 500/(1 + x)^3', 0.10, 0.12, 1, W_SEC)
S_k(1, 'Matemática', 'cos(x) = x³',
    'Para cos(x) = x³, [[você não quer derivar|evitar derivadas]] e já leu do gráfico [[dois palpites à esquerda da raiz, 0,5 e 0,6, com f positiva nos dois|dois palpites, sem troca de sinal]].', 'cos(x) - x^3', 0.5, 0.6, 2, W_SEC)
S_tol(3, 'Hidráulica', 'Fator de atrito de Colebrook',
      'O fator de atrito f de um tubo (ε/D = 0,0002, Re = 10⁵) satisfaz 1/√f = −2·log₁₀(ε/(3,7D) + 2,51/(Re·√f)). [[Derivar essa expressão, com log e raiz, é trabalhoso e fácil de errar|derivada trabalhosa]], e [[o diagrama de Moody dá os palpites 0,02 e 0,03, do mesmo lado da raiz|dois palpites, sem troca de sinal]].',
      '1/sqrt(x) + 2*log(0.0002/3.7 + 2.51/(100000*sqrt(x)))', 0.02, 0.03, 5, W_SEC)
S_k(3, 'Química', 'Gás de Van der Waals',
    'Para 1 mol de CO₂ a 300 K e 1 atm: (1 + 3,59/V²)(V − 0,0427) = 24,6. [[O volume do gás ideal (24,6 L) e um valor um pouco menor (24,55 L) são dois bons palpites, ambos acima do volume real|dois palpites, sem troca de sinal]] e [[derivar a equação à mão dá trabalho|derivada trabalhosa]].',
    '(1 + 3.59/x^2)*(x - 0.0427) - 24.6', 24.6, 24.55, 2, W_SEC)
S_k(2, 'Engenharia civil', 'Flecha do cabo suspenso',
    'Um cabo vence um vão de 100 m com flecha de 10 m e satisfaz a·cosh(50/a) − a = 10. [[A derivada envolve cosh, senh e regra da cadeia: trabalhosa|derivada trabalhosa]] e o projetista [[já testou a = 130 e a = 140, e os dois deram flecha menor que 10 m|dois palpites, sem troca de sinal]].',
    'x*cosh(50/x) - x - 10', 130, 140, 1, W_SEC)
S_k(1, 'Matemática', 'x·eˣ = 2',
    'Para x·eˣ = 2, [[a regra do produto não é bem-vinda agora|evitar derivadas]] e você tem [[os palpites 1 e 1,2, ambos acima da raiz|dois palpites, sem troca de sinal]].', 'x*exp(x) - 2', 1, 1.2, 2, W_SEC)
S_k(2, 'Finanças', 'Rendimento de um título',
    'Um título paga R$ 50, R$ 50 e R$ 1.050 nos próximos três anos e custa R$ 980. [[O sistema da corretora só calcula o preço de cada taxa|sem derivada]], e [[as taxas 6% e 7% já foram testadas, e as duas deram preço abaixo de R$ 980|dois palpites, sem troca de sinal]].',
    '50/(1 + x) + 50/(1 + x)^2 + 1050/(1 + x)^3 - 980', 0.06, 0.07, 1, W_SEC)
S_k(3, 'Engenharia de tráfego', 'Simulador de semáforo',
    'Um simulador calcula a espera para c ciclos por hora. Para treinar, a regra interna é f(c) = 30/(c − 2) + 0,5c − 12. [[Cada rodada leva 10 minutos: não há como gastar avaliações extras com derivada|avaliações caras]], e [[os testes c = 4 e c = 5 deram o mesmo sinal, então não há intervalo para a Bisseção|sem intervalo com sinais opostos]].',
    '30/(x - 2) + 0.5*x - 12', 4, 5, 2, 'A Bisseção precisaria de sinais opostos e o Newton gastaria avaliações com f′. A Secante usa os dois resultados já pagos e só precisa de uma avaliação nova por passo.')
S_k(2, 'Termodinâmica', 'Equilíbrio térmico com radiação',
    'Uma placa perde calor por radiação e convecção: 5,67·10⁻⁸(T⁴ − 300⁴) + 10(T − 300) = 1000. [[O balanço é calculado por uma rotina fechada do laboratório, que só devolve f(T)|sem derivada]], e [[as medições de T = 360 K e T = 380 K servem de palpites; as duas ficaram acima do equilíbrio|dois palpites, sem troca de sinal]].',
    '0.0000000567*(x^4 - 8100000000) + 10*(x - 300) - 1000', 360, 380, 2, W_SEC)
S_k(1, 'Matemática', 'ln(x) + x² = 4',
    'Para ln(x) + x² = 4, [[você prefere não derivar|evitar derivadas]] e já tem [[os palpites 2 e 2,5, ambos com f positiva|dois palpites, sem troca de sinal]].', 'ln(x) + x^2 - 4', 2, 2.5, 1, W_SEC)
S_k(2, 'Farmacologia', 'Dose para 70% de efeito',
    'A curva de Hill do remédio é E(c) = 100c^{2,5}/(32 + c^{2,5}). Qual dose dá 70%? [[O expoente fracionário torna f′ incômoda|derivada trabalhosa]] e [[dois ensaios anteriores usaram c = 6 e c = 7, e os dois passaram de 70%|dois palpites, sem troca de sinal]].',
    '100*x^2.5/(32 + x^2.5) - 70', 6, 7, 1, W_SEC)
S_k(3, 'Matemática', 'xˣ = 5',
    'Para xˣ = 5, [[a derivada xˣ(ln x + 1) exige derivação logarítmica|derivada trabalhosa]] e [[2,2 e 2,3 são bons palpites, ambos com xˣ > 5|dois palpites, sem troca de sinal]].', 'x^x - 5', 2.2, 2.3, 2, W_SEC)
S_k(2, 'Economia', 'Preço de equilíbrio do mercado',
    'Demanda e oferta foram ajustadas a dados: D(p) = 200p^{−0,8} e O(p) = 15p^{0,6}. O equilíbrio zera D − O. [[As curvas vieram de um ajuste de dados; não há derivada pronta|sem derivada]], e [[os preços do mês passado, 3 e 4, servem de palpites, do mesmo lado da raiz|dois palpites, sem troca de sinal]].',
    '200*x^(-0.8) - 15*x^0.6', 3, 4, 1, W_SEC)
S_k(1, 'História da matemática', 'O exemplo de Newton, sem derivar',
    'Volte a x³ − 2x − 5 = 0, mas [[sem calcular nenhuma derivada|evitar derivadas]], com [[os palpites 2,5 e 3, ambos com f positiva|dois palpites, sem troca de sinal]].', 'x^3 - 2*x - 5', 2.5, 3, 1, W_SEC)
S_k(2, 'Óptica', 'sen(x)/x = 1/2',
    'Na difração, aparece sen(x)/x = 0,5. [[A regra do quociente deixaria f′ chata|derivada trabalhosa]], e [[o gráfico sugere os palpites 2 e 2,2, ambos à direita da raiz|dois palpites, sem troca de sinal]].', 'sin(x)/x - 0.5', 2, 2.2, 1, W_SEC)
S_k(3, 'Computação', 'Tempo de execução medido',
    'O tempo de um algoritmo é medido rodando o programa; para treinar, o modelo é 0,002·n^{1,5}·ln(n) segundos. Qual n leva 60 s? [[Cada medição exige rodar o programa de novo|avaliações caras]], e [[as duas medições já feitas (n = 250 e n = 280) ficaram abaixo da meta, com o mesmo sinal|sem intervalo com sinais opostos]].',
    '0.002*x^1.5*ln(x) - 60', 250, 280, 2, 'Sem sinais opostos não há Bisseção, e cada avaliação custa uma execução. A Secante extrapola a partir das duas medições já feitas.')
S_k(2, 'Medicina', 'Dois compartimentos',
    'A concentração de um fármaco é C(t) = 30e^{−0,8t} + 10e^{−0,1t}. Quando C cai para 8? [[A curva vem de um software de ajuste que não mostra a derivada|sem derivada]], e [[as coletas de t = 2 h e t = 3 h servem de palpites, do mesmo lado da raiz|dois palpites, sem troca de sinal]].',
    '30*exp(-0.8*x) + 10*exp(-0.1*x) - 8', 2, 3, 1, W_SEC)
S_k(1, 'Matemática', 'e⁻ˣ = x²',
    'Para e⁻ˣ = x², [[você não quer derivar|evitar derivadas]] e tem [[os palpites 0,8 e 1, ambos à direita da raiz|dois palpites, sem troca de sinal]].', 'exp(-x) - x^2', 0.8, 1, 2, W_SEC)
S_k(2, 'Engenharia automotiva', 'Velocidade máxima do carro',
    'Um carro com 60 kW de potência enfrenta arrasto e rolamento: 0,396v³ + 176,58v = 60000 (v em m/s). [[O simulador de dinâmica só devolve a potência exigida em cada velocidade|sem derivada]], e [[as velocidades 60 e 55 m/s, testadas antes, pediram mais potência do que o motor tem|dois palpites, sem troca de sinal]].',
    '0.396*x^3 + 176.58*x - 60000', 60, 55, 2, W_SEC)
S_k(2, 'Economia', 'Função de produção',
    'Uma função de produção ajustada dá x^{0,7} + 2x^{0,3} = 10. [[Os expoentes fracionários deixam a derivada desagradável|derivada trabalhosa]], e [[o planejamento anterior usou 5 e 6, do mesmo lado da raiz|dois palpites, sem troca de sinal]].', 'x^0.7 + 2*x^0.3 - 10', 5, 6, 1, W_SEC)

# ================================================================= GAUSS (20)
W_GAU = 'Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.'
G(1, 'Matemática', 'Duas retas', 'Encontre o cruzamento das retas x + 2y = 8 e 3x − y = 3. [[São só duas incógnitas e se quer o valor exato|sistema pequeno e solução exata]]; repare que [[na primeira equação 1 < 2: não há dominância diagonal|sem dominância diagonal]].',
  ['x + 2y = 8', '3x - y = 3'], ['x', 'y'], W_GAU)
G(1, 'Comércio', 'Ingressos do show', 'Foram vendidos 120 ingressos, meia (x) a R$ 15 e inteira (y) a R$ 25, totalizando R$ 2.400. [[Duas equações, duas incógnitas, resposta exata|sistema pequeno e solução exata]]; os coeficientes [[não têm dominância diagonal|sem dominância diagonal]].',
  ['x + y = 120', '15x + 25y = 2400'], ['x', 'y'], W_GAU, ask_var='y')
G(2, 'Engenharia elétrica', 'Correntes num circuito', 'Num circuito, x, y e z são correntes (A). A lei dos nós dá x − y − z = 0 e as malhas dão 2x + 4y = 20 e 4y − 12z = 0. [[A primeira equação não é diagonal dominante: 1 < 1 + 1|sem dominância diagonal]] e [[são só 3 incógnitas: o engenheiro quer o valor exato|sistema pequeno e solução exata]].',
  ['x - y - z = 0', '2x + 4y = 20', '4y - 12z = 0'], ['x', 'y', 'z'], W_GAU)
G(2, 'Metalurgia', 'Mistura de ligas', 'Três ligas (x, y e z, em kg) misturam cobre, zinco e estanho para obter 43 kg de cobre, 34 kg de zinco e 23 kg de estanho. [[É um sistema 3×3 e cada quilo conta: resposta exata|sistema pequeno e solução exata]]; [[a matriz não tem dominância diagonal|sem dominância diagonal]].',
  ['0.5x + 0.6y + 0.3z = 43', '0.3x + 0.1y + 0.5z = 34', '0.2x + 0.3y + 0.2z = 23'], ['x', 'y', 'z'], W_GAU)
G(1, 'Matemática', 'Parábola por três pontos', 'Ache a parábola p(t) = x·t² + y·t + z que passa por (1, 4), (2, 9) e (3, 16). [[A matriz de Vandermonde não tem nada de dominância diagonal|sem dominância diagonal]] e [[são 3 coeficientes exatos|sistema pequeno e solução exata]].',
  ['x + y + z = 4', '4x + 2y + z = 9', '9x + 3y + z = 16'], ['x', 'y', 'z'], W_GAU)
G(2, 'Nutrição', 'Cardápio balanceado', 'Três alimentos (x, y e z porções) fornecem proteína, carboidrato e gordura nas quantidades-alvo. [[Sistema 3×3: a nutricionista quer porções exatas|sistema pequeno e solução exata]] e [[a primeira linha (2 < 1 + 3) não é dominante|sem dominância diagonal]].',
  ['2x + y + 3z = 19', 'x + 3y + 2z = 19', '4x + 2y + z = 18'], ['x', 'y', 'z'], W_GAU)
G(2, 'Trânsito', 'Fluxo nos cruzamentos', 'Em três ruas de mão única, os fluxos x, y e z (carros/h) obedecem à conservação nos cruzamentos: x + y = 900, y − z = 200 e x − z = 300. [[A matriz tem zeros na diagonal relativa e não é dominante|sem dominância diagonal]], e [[é um sistema pequeno com resposta exata|sistema pequeno e solução exata]].',
  ['x + y = 900', 'y - z = 200', 'x - z = 300'], ['x', 'y', 'z'], W_GAU)
G(1, 'Matemática', 'Pivô zero', 'Resolva 2y = 6 e x + y = 5, nessa ordem. [[O primeiro pivô (coeficiente de x na 1ª linha) é zero: é preciso trocar as linhas|pivô nulo]], e [[Gauss-Seidel dividiria por zero na diagonal|iterativo inviável]].',
  ['2y = 6', 'x + y = 5'], ['x', 'y'], 'Com pivô nulo, Gauss com troca de linhas (pivotamento) resolve direto. Um método iterativo dividiria por zero.')
G(3, 'Produção', 'Quatro produtos, quatro máquinas', 'Uma fábrica usa quatro máquinas para quatro produtos (x, y, z e u unidades). As horas disponíveis definem um sistema 4×4. [[Nenhuma linha tem dominância diagonal|sem dominância diagonal]] e o plano exige [[quantidades exatas|solução exata]].',
  ['x + 2y + z + u = 70', '2x + y + 3z + u = 70', 'x + y + z + 3u = 80', '3x + y + z + 2u = 85'], ['x', 'y', 'z', 'u'], W_GAU)
G(2, 'Química', 'Diluição de soluções', 'Três soluções (x, y e z litros, a 10%, 20% e 40%) formam 10 L com 2,4 L de soluto, usando o dobro de y em x. [[Sistema pequeno com coeficientes decimais|sistema pequeno e solução exata]], e [[a segunda linha (0,2 < 0,1 + 0,4) não é dominante|sem dominância diagonal]].',
  ['x + y + z = 10', '0.1x + 0.2y + 0.4z = 2.4', 'x - 2y = 0'], ['x', 'y', 'z'], W_GAU)
G(2, 'Finanças', 'Três aplicações', 'R$ 20.000 foram divididos em três aplicações (x, y e z) que rendem 5%, 8% e 10% ao ano, com rendimento total de R$ 1.640 e z = 2x. [[Três incógnitas e o contador quer centavos exatos|sistema pequeno e solução exata]]; [[a segunda linha é longe de dominante|sem dominância diagonal]].',
  ['x + y + z = 20000', '0.05x + 0.08y + 0.1z = 1640', '-2x + z = 0'], ['x', 'y', 'z'], W_GAU, ask_var='y')
G(1, 'Matemática', 'Soma e diferença', 'Dois números somam 50 e diferem em 10. [[Sistema 2×2 com resposta exata|sistema pequeno e solução exata]]; [[a linha x + y = 50 tem 1 = 1, sem dominância estrita|sem dominância diagonal]].',
  ['x + y = 50', 'x - y = 10'], ['x', 'y'], W_GAU)
G(3, 'Estruturas', 'Forças numa treliça', 'Numa treliça com triângulos 3-4-5, as forças x, y e z (kN) satisfazem 0,8x − 0,6y = 0, 0,6x + 0,8y − z = 40 e 0,6y + z = 108. [[A segunda linha não é dominante (0,8 < 0,6 + 1)|sem dominância diagonal]] e o cálculo estrutural [[exige os valores exatos|solução exata]].',
  ['0.8x - 0.6y = 0', '0.6x + 0.8y - z = 40', '0.6y + z = 108'], ['x', 'y', 'z'], W_GAU)
G(3, 'Matemática', 'Cúbica por quatro pontos', 'Ache p(t) = x·t³ + y·t² + z·t + u passando por (0, 1), (1, 2), (2, 9) e (3, 28). [[Vandermonde 4×4: sem dominância diagonal|sem dominância diagonal]], e [[os coeficientes são exatos|solução exata]].',
  ['u = 1', 'x + y + z + u = 2', '8x + 4y + 2z + u = 9', '27x + 9y + 3z + u = 28'], ['x', 'y', 'z', 'u'], W_GAU)
G(1, 'Comércio', 'Preço de dois produtos', 'Dois cadernos e três canetas custam R$ 18; cinco cadernos e duas canetas custam R$ 23. [[Sistema 2×2 com preço exato|sistema pequeno e solução exata]]; [[na primeira linha 2 < 3: sem dominância|sem dominância diagonal]].',
  ['2x + 3y = 18', '5x + 2y = 23'], ['x', 'y'], W_GAU)
G(2, 'Física', 'Posição, velocidade e aceleração', 'Um carrinho tem s(t) = x + y·t + z·t², com s(1) = 7 m, s(2) = 16 m e s(3) = 29 m. [[Vandermonde sem dominância diagonal|sem dominância diagonal]] e [[três valores exatos|sistema pequeno e solução exata]]. (A aceleração é 2z.)',
  ['x + y + z = 7', 'x + 2y + 4z = 16', 'x + 3y + 9z = 29'], ['x', 'y', 'z'], W_GAU)
G(3, 'Matemática', 'Pivô minúsculo', 'Resolva 0,0001x + y = 1 e x + y = 2. [[O primeiro pivô é 0,0001: sem trocar as linhas (pivotamento parcial), o arredondamento estraga a resposta|pivô pequeno]], e [[Gauss-Seidel nessa ordem diverge (0,0001 < 1)|iterativo inviável]].',
  ['0.0001x + y = 1', 'x + y = 2'], ['x', 'y'], 'Pivô minúsculo pede Gauss com pivotamento parcial. Gauss-Seidel, com 0,0001 na diagonal, divergiria.')
G(2, 'Agricultura', 'Adubação N-P-K', 'Três fertilizantes (x, y e z kg) têm teores diferentes de N, P e K, e a lavoura precisa de 65 kg de N, 80 de P e 70 de K. [[Sistema 3×3: a dose precisa ser exata|sistema pequeno e solução exata]], e [[a primeira linha (0,1 < 0,2 + 0,05) não é dominante|sem dominância diagonal]].',
  ['0.1x + 0.2y + 0.05z = 65', '0.1x + 0.05y + 0.2z = 80', '0.2x + 0.1y + 0.1z = 70'], ['x', 'y', 'z'], W_GAU)
G(1, 'Matemática', 'Sistema 3×3 clássico', 'Resolva x + y + z = 6, 2x − y + z = 3 e x + 2y − z = 2. [[Três incógnitas, solução exata|sistema pequeno e solução exata]]; [[nenhuma linha tem dominância diagonal|sem dominância diagonal]].',
  ['x + y + z = 6', '2x - y + z = 3', 'x + 2y - z = 2'], ['x', 'y', 'z'], W_GAU)
G(3, 'Engenharia elétrica', 'Rede com quatro nós', 'Uma pequena rede tem quatro tensões desconhecidas (x, y, z e u) com um gerador controlado que quebra a simetria. [[A matriz não é diagonal dominante (e nem simétrica)|sem dominância diagonal]] e [[é pequena: 4×4|sistema pequeno e solução exata]].',
  ['x + 2y - z + u = -2', '2x - y + z + 3u = 11', 'x + y + z - 2u = 2', '-x + 3y + 2z + u = 2'], ['x', 'y', 'z', 'u'], W_GAU)

# ================================================================= GAUSS-SEIDEL (20)
W_GSE = 'Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.'
GS(1, 'Matemática', 'Primeira iteração', 'O sistema abaixo é [[estritamente diagonal dominante (4 > 2, 8 > 5, 5 > 3)|dominância diagonal: convergência garantida]] e você quer [[ver a solução sendo refinada iteração a iteração|método iterativo]].',
   ['4x - y + z = 7', '4x - 8y + z = -21', '-2x + y + 5z = 15'], ['x', 'y', 'z'], [0, 0, 0], 1, W_GSE)
GS(2, 'Transferência de calor', 'Temperaturas numa placa', 'Numa placa com bordas a 100 °C (topo), 75 °C (esquerda), 50 °C (direita) e 0 °C (base), os quatro pontos internos satisfazem a média dos vizinhos. [[Cada linha tem 4 na diagonal e soma 2 fora dela: dominância diagonal|dominância diagonal]], e [[a média das bordas (≈ 56 °C) é um bom chute inicial|boa aproximação inicial]]. Na malha real são [[milhares de pontos|sistema grande]].',
   ['4x - y - z = 175', '-x + 4y - u = 150', '-x + 4z - u = 75', '-y - z + 4u = 50'], ['x', 'y', 'z', 'u'], [56, 56, 56, 56], 1, W_GSE)
GS(3, 'Engenharia', 'Rede tridiagonal enorme', 'Uma rede com 1000 nós ligados em fila gera uma matriz tridiagonal; aqui está um trecho 4×4. [[Cada linha só tem três números não nulos (matriz esparsa)|esparsa]], [[no sistema real o escalonamento encheria a matriz e custaria ~n³|sistema grande]] e [[a diagonal é estritamente dominante|dominância diagonal]].',
   ['4x - y = 3', '-x + 4y - z = 2', '-y + 4z - u = 2', '-z + 4u = 3'], ['x', 'y', 'z', 'u'], [0, 0, 0, 0], 2, W_GSE)
GS(2, 'Economia', 'Modelo de Leontief', 'Três setores de uma economia satisfazem (I − A)·p = d. [[A matriz é diagonal dominante|dominância diagonal]], e [[a produção do mês passado (100, 120, 90) é uma ótima aproximação inicial|boa aproximação inicial]] para o planejamento deste mês.',
   ['0.8x - 0.2y - 0.1z = 40', '-0.1x + 0.7y - 0.2z = 50', '-0.2x - 0.1y + 0.9z = 45'], ['x', 'y', 'z'], [100, 120, 90], 1, W_GSE)
GS(1, 'Controle', 'Controlador que recalcula', 'Um controlador resolve este 2×2 a cada segundo [[partindo da solução anterior|iterativo com chute anterior]]. [[A diagonal domina (5 > 1 e 4 > 1)|dominância diagonal]].',
   ['5x + y = 11', 'x + 4y = 6'], ['x', 'y'], [0, 0], 2, W_GSE)
GS(2, 'Engenharia elétrica', 'Análise nodal de rede grande', 'A análise nodal de uma rede elétrica com centenas de nós gera [[uma matriz esparsa e diagonal dominante|esparsa e dominante]]. Para treinar, use este trecho 4×4 e [[as tensões medidas ontem como chute|boa aproximação inicial]].',
   ['5x - y - 2z = 9', '-x + 5y - u = 13', '-2x + 6z - u = 7', '-y - z + 4u = 12'], ['x', 'y', 'z', 'u'], [3, 4, 3, 5], 1, W_GSE)
GS(2, 'Estruturas', 'Molas em série', 'Três massas ligadas por molas iguais geram [[uma matriz tridiagonal com 3 na diagonal e −1 ao lado: dominante|dominância diagonal]]. O simulador de estruturas [[resolve sistemas assim, com milhares de massas, de forma iterativa|sistema grande]].',
   ['3x - y = 3', '-x + 3y - z = 5', '-y + 3z = 3'], ['x', 'y', 'z'], [0, 0, 0], 2, W_GSE)
GS(3, 'Matemática', 'Reordenar para convergir', 'O sistema chegou como x + 5y = 6 e 4x + y = 5. [[Trocando as equações de lugar, a matriz fica diagonal dominante (4 > 1, 5 > 1)|reordenar dá dominância]], e o problema real [[tem milhares de equações desse tipo|sistema grande]]. Use a ordem 4x + y = 5; x + 5y = 6.',
   ['4x + y = 5', 'x + 5y = 6'], ['x', 'y'], [0, 0], 2, 'Depois de reordenar, a dominância diagonal garante a convergência do Gauss-Seidel, a opção natural para sistemas grandes desse tipo.')
GS(1, 'Matemática', 'Dominância em 3×3', 'O sistema é [[estritamente diagonal dominante (5 > 2, 6 > 3, 7 > 3)|dominância diagonal]] e [[basta uma aproximação, iteração por iteração|método iterativo]].',
   ['5x + y + z = 10', 'x + 6y + 2z = 19', '2x + y + 7z = 25'], ['x', 'y', 'z'], [0, 0, 0], 1, W_GSE)
GS(2, 'Processamento de imagem', 'Suavizar pixels', 'Para suavizar uma linha de 3 pixels, cada valor vira uma média com os vizinhos. [[A matriz é diagonal dominante|dominância diagonal]] e [[os próprios pixels originais (10, 20, 30) são o chute inicial|boa aproximação inicial]]; numa foto real são [[milhões de pixels|sistema grande]].',
   ['4x - y = 30', '-x + 4y - z = 60', '-y + 4z = 100'], ['x', 'y', 'z'], [10, 20, 30], 1, W_GSE)
GS(2, 'Hidrologia', 'Reservatórios interligados', 'Três reservatórios trocam água e o equilíbrio dos níveis forma [[um sistema diagonal dominante|dominância diagonal]]. [[A medição da semana passada (2, 2, 2) serve de partida|boa aproximação inicial]].',
   ['6x - 2y - z = 6', '-2x + 7y - 2z = 9', '-x - 2y + 5z = 4'], ['x', 'y', 'z'], [2, 2, 2], 2, W_GSE)
GS(3, 'Matemática', 'Valor novo na hora', 'Neste sistema [[diagonal dominante|dominância diagonal]], observe a marca do Gauss-Seidel: [[ao calcular y, já se usa o x desta mesma iteração|atualização sequencial]].',
   ['10x + 2y - z = 7', 'x + 8y + 3z = -4', '-2x - y + 10z = 9'], ['x', 'y', 'z'], [0, 0, 0], 1, W_GSE)
GS(2, 'Engenharia química', 'Coluna de destilação', 'Os estágios de uma coluna de destilação geram [[uma matriz tridiagonal dominante|esparsa e dominante]]. [[O perfil da operação anterior (0,5; 0,5; 0,5; 0,5) é o chute|boa aproximação inicial]].',
   ['3x - y = 1', '-x + 3y - z = 1', '-y + 3z - u = 1', '-z + 3u = 1'], ['x', 'y', 'z', 'u'], [0.5, 0.5, 0.5, 0.5], 1, W_GSE)
GS(1, 'Matemática', 'Dominância com sinais', 'O sistema é [[diagonal dominante (8 > 2, 7 > 3, 9 > 3)|dominância diagonal]]; [[aproxime a solução iterativamente|método iterativo]].',
   ['8x + y - z = 8', 'x - 7y + 2z = -4', '2x + y + 9z = 12'], ['x', 'y', 'z'], [0, 0, 0], 1, W_GSE)
GS(2, 'Transferência de calor', 'Barra aquecida', 'Os pontos internos de uma barra aquecida formam [[uma matriz tridiagonal com 3 na diagonal: dominante|dominância diagonal]]. Em simulações reais, a barra tem [[milhares de pontos|sistema grande]].',
   ['3x - y = 20', '-x + 3y - z = 10', '-y + 3z - u = 10', '-z + 3u = 40'], ['x', 'y', 'z', 'u'], [0, 0, 0, 0], 1, W_GSE)
GS(3, 'Engenharia', 'Iterar até a precisão pedida', 'Um trecho de um sistema esparso grande é [[estritamente diagonal dominante|dominância diagonal]]. [[Três casas decimais bastam|precisão moderada basta]]: itere até estabilizar.',
   ['5x - y - z = 3', '-x + 6y - 2z = 3', '-x - 2y + 7z = 4'], ['x', 'y', 'z'], [0, 0, 0], None, W_GSE, until=0.0001)
GS(2, 'Robótica', 'Calibração de juntas', 'A calibração de três juntas de um robô gera [[um sistema diagonal dominante|dominância diagonal]], e [[a calibração anterior (0,8; −0,8; 1,8) é o chute|boa aproximação inicial]].',
   ['6x + y - 2z = 1', 'x + 5y + z = -2', '-x + 2y + 8z = 13'], ['x', 'y', 'z'], [0.8, -0.8, 1.8], 1, W_GSE)
GS(1, 'Matemática', '2×2 iterado duas vezes', 'O sistema é [[diagonal dominante (6 > 2 e 5 > 1)|dominância diagonal]]; use [[duas iterações a partir da origem|método iterativo]].',
   ['6x + 2y = 10', 'x + 5y = 11'], ['x', 'y'], [0, 0], 2, W_GSE)
GS(3, 'Meteorologia', 'Grade de pressão', 'Modelos do tempo resolvem [[grades com milhões de pontos|sistema grande]], com [[matrizes esparsas e diagonal dominantes|esparsa e dominante]]. A previsão de ontem dá [[o chute (8, 8, 8, 8)|boa aproximação inicial]].',
   ['5x - y - z = 30', '-x + 5y - u = 40', '-x + 5z - u = 20', '-y - z + 5u = 30'], ['x', 'y', 'z', 'u'], [8, 8, 8, 8], 2, W_GSE)
GS(2, 'Redes de computadores', 'Ranking de três páginas', 'Um ranking no estilo PageRank para três páginas (1 → 2 e 3; 2 → 3; 3 → 1), com amortecimento 0,5 e escore base 1, leva a r = 1 + 0,5·M·r. [[Em cada linha, a diagonal 1 supera a soma do resto (no máximo 0,75): dominante|dominância diagonal]], e [[o chute uniforme (1, 1, 1) é natural|boa aproximação inicial]]. Na web real são [[bilhões de páginas|sistema grande]].',
   ['x - 0.5z = 1', '-0.25x + y = 1', '-0.25x - 0.5y + z = 1'], ['x', 'y', 'z'], [1, 1, 1], 2, W_GSE)

# ================================================================= FALSA POSIÇÃO (20)
W_FP = 'Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.'
FP_k(1, 'Matemática', 'ln(x) + x/2 = 2',
     'Para ln(x) + x/2 = 2, [[f(2) ≈ −0,31 < 0 < f(3) ≈ 0,60|sinais opostos nas pontas]], e [[entre 2 e 3 o gráfico de f é quase uma reta|curva quase reta]]. Você quer [[manter a raiz cercada, mas chegar perto mais rápido do que pelo ponto médio|raiz sempre cercada]].',
     'ln(x) + x/2 - 2', 2, 3, 2, W_FP)
FP_k(1, 'Finanças', 'TIR de um projeto',
     'Um projeto custa R$ 5.000 e devolve R$ 2.000 por ano durante 3 anos. A TIR é a taxa que zera o VPL. [[Com 5% o VPL é positivo e com 15% é negativo|sinais opostos nas pontas]], [[nessa faixa o VPL é quase linear na taxa|curva quase reta]] e [[a planilha só devolve o VPL de cada taxa, sem derivada|sem derivada]].',
     '-5000 + 2000/(1 + x) + 2000/(1 + x)^2 + 2000/(1 + x)^3', 0.05, 0.15, 1, W_FP)
FP_k(1, 'Economia', 'Mercado de energia',
     'A oferta de energia de uma região segue O(p) = 50·ln(1 + p/10) e a demanda, D(p) = 120 − 0,8p. [[O excesso de oferta é negativo em p = 20 e positivo em p = 60|sinais opostos nas pontas]], [[as duas curvas são suaves nessa faixa e a diferença é quase uma reta|curva quase reta]], e o operador quer [[o preço sempre dentro da faixa regulada [20; 60]|raiz sempre cercada]].',
     '50*ln(1 + x/10) - 120 + 0.8*x', 20, 60, 2, W_FP)
FP_k(1, 'Navegação', 'A maré que libera o barco',
     'A altura da maré num porto é h(t) = 2 + 1,5·cos(0,5t) + 0,3·cos(t) metros, com t em horas. Um barco só sai com h ≤ 2,5 m. [[f(t) = h(t) − 2,5 é positiva em t = 0 e negativa em t = 3|sinais opostos nas pontas]], [[nesse trecho a maré desce de forma suave|curva quase reta]] e [[a tábua de marés só informa valores, sem derivada|sem derivada]].',
     '2 + 1.5*cos(0.5*x) + 0.3*cos(x) - 2.5', 0, 3, 1, W_FP)
FP_k(1, 'Matemática', 'Raiz de 11 com garantia',
     'Para √11, [[f(3) = −2 e f(4) = 5|sinais opostos nas pontas]]. [[Entre 3 e 4 a parábola quase não curva|curva quase reta]], e você quer [[chegar perto em poucos cortes sem perder o intervalo|raiz sempre cercada]].',
     'x^2 - 11', 3, 4, 2, W_FP)
FP_k(1, 'Matemática', 'x³ + x = 5',
     'Para x³ + x = 5, [[f(1) = −3 e f(2) = 5|sinais opostos nas pontas]]; [[em [1; 2] a curva é suave, sem mudança de concavidade|curva quase reta]], e o exercício pede [[a raiz sempre cercada, sem derivadas|raiz sempre cercada]].',
     'x^3 + x - 5', 1, 2, 2, W_FP)
FP_k(2, 'Física', 'Arrasto do paraquedista',
     'Um paraquedista de 68,1 kg atinge 40 m/s depois de 10 s de queda. O coeficiente de arrasto c satisfaz (9,81·68,1/c)(1 − e^{−10c/68,1}) = 40. [[Com c = 12 a velocidade passa de 40 m/s e com c = 16 fica abaixo|sinais opostos nas pontas]], [[v(c) é suave e quase linear nessa faixa|curva quase reta]] e [[cada valor vem de uma simulação de túnel de vento, sem derivada|sem derivada]].',
     '9.81*68.1/x*(1 - exp(-10*x/68.1)) - 40', 12, 16, 2, W_FP)
FP_tol(2, 'Finanças pessoais', 'Taxa da poupança programada',
       'Depositando R$ 200 por mês durante 24 meses, você quer juntar R$ 5.300. Qual taxa mensal faz isso? [[Com 0,2% ao mês falta dinheiro e com 1% sobra|sinais opostos nas pontas]], [[o montante cresce de forma quase linear com a taxa nessa faixa|curva quase reta]] e o banco exige [[a taxa sempre dentro da faixa do contrato|raiz sempre cercada]].',
       '200*((1 + x)^24 - 1)/x - 5300', 0.002, 0.01, 0.001, 6, W_FP)
FP_k(2, 'Termodinâmica', 'Gás aquecido até onde?',
     'Um mol de gás recebe 50 kJ a partir de 298 K, com cp(T) = 30 + 0,01T + 2·10⁻⁶T² J/(mol·K). A temperatura final zera ∫cp dT − 50000. [[Em 1000 K falta energia e em 2000 K sobra|sinais opostos nas pontas]], [[a curva da energia é quase reta nessa faixa|curva quase reta]], e [[o resultado precisa ficar dentro da faixa de validade da tabela de cp|raiz sempre cercada]].',
     '30*(x - 298) + 0.005*(x^2 - 88804) + 0.000002/3*(x^3 - 26463592) - 50000', 1000, 2000, 2, W_FP)
FP_tol(2, 'Geometria', 'Segmento circular de meia unidade',
       'Num tanque cilíndrico deitado de raio 1 m, a seção molhada é um segmento circular de área 0,5 m², o que leva a θ − sen(θ) = 1 (θ em radianos). [[f(1,5) < 0 < f(2,5)|sinais opostos nas pontas]], [[θ − sen(θ) é suave e quase reta nesse trecho|curva quase reta]] e [[o ângulo precisa continuar entre 1,5 e 2,5 rad para fazer sentido|raiz sempre cercada]].',
       'x - sin(x) - 1', 1.5, 2.5, 0.00001, 4, W_FP)
FP_k(2, 'Esportes', 'Cobrança de falta',
     'Uma bola chutada a 20 m/s precisa passar a 2 m de altura sobre uma barreira a 20 m. O ângulo θ satisfaz 20·tg(θ) − 4,905/cos²(θ) = 2. [[Com θ = 0,3 rad a bola passa baixa e com 0,4 rad passa alta|sinais opostos nas pontas]], e [[nessa faixa a altura varia quase linearmente com θ|curva quase reta]]. [[O ângulo baixo, da cobrança rasante, é o que interessa|raiz sempre cercada]].',
     '20*tan(x) - 4.905/cos(x)^2 - 2', 0.3, 0.4, 1, W_FP)
FP_k(2, 'Engenharia química', 'Reator contínuo',
     'Num reator contínuo, a concentração de saída C (mol/L) satisfaz 2 − C − 1,5·C^{1,5} = 0 (alimentação de 2 mol/L, reação de ordem 1,5). [[f(0,5) > 0 > f(1,5)|sinais opostos nas pontas]], [[a curva é suave nesse intervalo|curva quase reta]] e [[uma concentração fora de [0,5; 1,5] não tem sentido no processo|raiz sempre cercada]].',
     '2 - x - 1.5*x^1.5', 0.5, 1.5, 2, W_FP)
FP_count(2, 'Administração', 'Ponto de equilíbrio da fábrica',
         'Uma fábrica tem lucro L(q) = 20q − 3000 − 0,5q^{1,2}, com q em unidades. [[L(150) < 0 < L(400)|sinais opostos nas pontas]], [[nessa faixa o lucro é praticamente uma reta|curva quase reta]] e [[cada avaliação vem de um relatório gerencial demorado|avaliações caras]].',
         '20*x - 3000 - 0.5*x^1.2', 150, 400, 0.001, W_FP)
FP_k(2, 'Aeronáutica', 'Velocidade de cruzeiro do drone',
     'A potência que um drone gasta voando a v m/s é P(v) = 0,012v³ + 400/v watts. Com 120 W disponíveis, qual é a maior velocidade? [[P(19) < 120 < P(21)|sinais opostos nas pontas]], [[entre 19 e 21 m/s a curva de potência é quase reta|curva quase reta]] e [[a velocidade tem de ficar na faixa medida no túnel de vento|raiz sempre cercada]].',
     '0.012*x^3 + 400/x - 120', 19, 21, 2, W_FP)
FP_k(2, 'Hidráulica', 'Ponto de operação da bomba',
     'A bomba entrega H = 40 − 0,002Q² metros, e a tubulação pede H = 10 + 0,0008Q^{1,85} (Q em m³/h). O ponto de operação iguala as duas. [[Em Q = 80 a bomba sobra e em Q = 120 falta|sinais opostos nas pontas]], [[as duas curvas são suaves e a diferença é quase reta|curva quase reta]] e [[Q precisa ficar na faixa de catálogo da bomba|raiz sempre cercada]].',
     '30 - 0.002*x^2 - 0.0008*x^1.85', 80, 120, 2, W_FP)
FP_tol(3, 'Engenharia mecânica', 'Distância entre polias',
       'Uma correia de 3 m abraça duas polias de raios 0,25 m e 0,15 m. A distância D entre os centros satisfaz 2√(D² − 0,1²) + π(0,25 + 0,15) + 2·0,1·arcsen(0,1/D) = 3. [[D = 0,8 m deixa a correia sobrando e D = 1,2 m faltando|sinais opostos nas pontas]], e [[essa função de D é quase reta|curva quase reta]]. O desenho técnico pede [[seis casas, com a raiz sempre dentro da faixa de montagem|raiz sempre cercada]].',
       '2*sqrt(x^2 - 0.01) + 0.4*pi + 0.2*asin(0.1/x) - 3', 0.8, 1.2, 0.000000001, 6, W_FP)
FP_tol(3, 'Engenharia química', 'Ponto de bolha benzeno-tolueno',
       'Uma mistura com 50% de benzeno e 50% de tolueno começa a ferver quando 0,5·P_benz(T) + 0,5·P_tol(T) = 760 mmHg, com as pressões de vapor da equação de Antoine. [[A 80 °C a mistura ainda não ferve e a 100 °C já ferve|sinais opostos nas pontas]], [[a soma das pressões é suave, quase reta nessa faixa|curva quase reta]], e [[derivar as exponenciais de Antoine à mão é trabalhoso|sem derivada]].',
       '0.5*10^(6.90565 - 1211.033/(220.79 + x)) + 0.5*10^(6.95464 - 1344.8/(219.482 + x)) - 760', 80, 100, 0.001, 3, W_FP)
FP_count(3, 'Estruturas', 'Onde a viga mais desce',
         'Numa viga de 6 m com carga distribuída crescente, a flecha máxima fica onde y′(x) = 0, ou seja, −5x⁴ + 216x² − 1296 = 0. [[y′(2) < 0 < y′(4)|sinais opostos nas pontas]], [[a curva é suave nesse trecho|curva quase reta]] e [[cada avaliação vem de um programa de elementos finitos|avaliações caras]].',
         '-5*x^4 + 216*x^2 - 1296', 2, 4, 0.000001, W_FP)
FP_count(3, 'Hidráulica', 'Uma hora por simulação',
         'Um software de redes hidráulicas leva uma hora por simulação. A perda de carga para a vazão Q (L/s) é 0,0004Q^{1,85} + 10⁻⁶Q³ metros e precisa valer 15 m. [[Q = 150 dá perda menor e Q = 250 dá maior|sinais opostos nas pontas]], [[a curva é suave|curva quase reta]] e [[cada avaliação custa uma hora de simulação|avaliações caras]].',
         '0.0004*x^1.85 + 0.000001*x^3 - 15', 150, 250, 0.0001, W_FP)
FP_tol(3, 'Engenharia civil', 'Reservatório em tronco de cone',
       'Um reservatório tem forma de tronco de cone: o fundo tem raio 1 m e o raio cresce 0,2 m por metro de altura. O volume até a altura h é V = (πh/3)(1 + r + r²), com r = 1 + h/5. Que altura guarda 30 m³? [[V − 30 é negativo em h = 2 e positivo em h = 5|sinais opostos nas pontas]], [[a curva do volume é suave|curva quase reta]] e [[a altura tem de ficar entre 2 e 5 m, as medidas da obra|raiz sempre cercada]].',
       'pi*x/3*(1 + (1 + x/5) + (1 + x/5)^2) - 30', 2, 5, 0.000001, 4, W_FP)

# ================================================================= PONTO FIXO (20)
W_PF = 'A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.'
PF_k(1, 'Matemática', 'Número de ouro em fração contínua',
     'O número de ouro satisfaz x = 1 + 1/x. [[A equação já está na forma x = g(x)|forma x = g(x)]], [[com |g′| ≈ 0,38 < 1 perto da raiz|contração]], e você parte de [[um único chute, x₀ = 1|um único chute]].',
     '1 + 1/x', 1, 4, W_PF, '1 + 1/x')
PF_k(1, 'Matemática', 'Reescrevendo a cúbica',
     'Para x³ − x − 2 = 0, a forma [[x = ∛(x + 2)|forma x = g(x)]] tem [[|g′(x)| ≈ 0,14 perto da raiz: contração forte|contração]]. Comece em [[x₀ = 1,5|um único chute]].',
     '(x + 2)^(1/3)', 1.5, 3, W_PF, '∛(x + 2)')
PF_k(1, 'Ecologia', 'Insetos ano a ano',
     'A fração p da capacidade ocupada por uma população de insetos evolui ano a ano por pₙ₊₁ = 2,6·pₙ(1 − pₙ). O equilíbrio é o p que se repete: [[p = g(p) já é a própria regra do modelo|forma x = g(x)]], e [[|g′(p*)| = 0,6 < 1: o equilíbrio atrai|contração]]. Este ano, [[p₀ = 0,3|um único chute]].',
     '2.6*x*(1 - x)', 0.3, 3, W_PF, '2,6·x(1 − x)')
PF_k(1, 'Matemática', 'x = 2 + ln(x)',
     'A equação x − ln(x) = 2 pode ser lida como [[x = 2 + ln(x)|forma x = g(x)]]; como [[g′(x) = 1/x ≈ 0,32 perto da raiz|contração]], basta repetir a partir de [[x₀ = 3|um único chute]].',
     '2 + ln(x)', 3, 3, W_PF, '2 + ln(x)')
PF_k(1, 'Física', 'Equilíbrio de um braço articulado',
     'O equilíbrio de forças de um braço articulado leva a θ = 1 + 0,4·cos(θ), com θ em radianos. [[A equação já é θ = g(θ)|forma x = g(x)]], [[com |g′| = 0,4·|sen θ| ≤ 0,4|contração]], e [[θ₀ = 1 rad|um único chute]].',
     '1 + 0.4*cos(x)', 1, 4, W_PF, '1 + 0,4·cos(x)')
PF_k(1, 'Redes de computadores', 'PageRank de uma página',
     'Num ranking simplificado, o escore r de uma página que recebe 60% do próprio voto segue r = 0,15 + 0,85·0,6·r. [[É a forma r = g(r) do método da potência|forma x = g(x)]], [[o fator 0,51 < 1 garante a convergência|contração]] e o algoritmo começa com [[r₀ = 1|um único chute]].',
     '0.15 + 0.51*x', 1, 3, W_PF, '0,15 + 0,51·x')
PF_tol(2, 'Física moderna', 'Lei de deslocamento de Wien',
       'O pico da radiação de corpo negro sai de [[x = 5(1 − e⁻ˣ), já na forma x = g(x)|forma x = g(x)]]. [[g′(x) = 5e⁻ˣ ≈ 0,035 perto da raiz: cada iteração ganha mais de uma casa|contração forte]], e [[x₀ = 5 é o chute natural|um único chute]]. Você quer seis casas decimais.',
       '5*(1 - exp(-x))', 5, 6, W_PF, '5(1 − e^(−x))')
PF_tol(2, 'Epidemiologia', 'Tamanho final de uma epidemia',
       'No modelo SIR, a fração z da população que pega a doença satisfaz [[z = 1 − e^{−R₀z}, já na forma z = g(z)|forma x = g(x)]], aqui com R₀ = 2,5. [[|g′(z*)| ≈ 0,27 perto da solução positiva|contração]], e o epidemiologista parte de [[z₀ = 0,5|um único chute]]. (z = 0 também é solução, mas não descreve uma epidemia.)',
       '1 - exp(-2.5*x)', 0.5, 4, W_PF, '1 − e^(−2,5x)')
PF_k(2, 'Economia', 'Modelo da teia de preços',
     'Agricultores decidem o plantio pelo preço do ano anterior, e o preço segue pₜ₊₁ = 40 − 0,75pₜ. [[A regra do mercado já é p = g(p)|forma x = g(x)]], e [[|g′| = 0,75 < 1: os preços oscilam, mas se acalmam|contração]]. Começando em [[p₀ = 30|um único chute]]. (O diagrama em teia do Ponto Fixo ganhou esse nome justamente aqui.)',
     '40 - 0.75*x', 30, 3, W_PF, '40 − 0,75x')
PF_k(2, 'Eletrônica', 'Ponto de operação do diodo',
     'Num circuito com fonte de 5 V, resistor de 1 kΩ e um diodo, a corrente I (em mA) satisfaz [[I = 5 − 0,02585·ln(10⁹·I + 1): a corrente que sobra depois da queda no diodo|forma x = g(x)]]. [[A queda no diodo quase não muda com I (|g′| ≈ 0,006)|contração forte]], então a iteração parte de [[I₀ = 5 mA, como se o diodo não existisse|um único chute]].',
     '5 - 0.02585*ln(1000000000*x + 1)', 5, 2, W_PF, '5 − 0,02585·ln(10⁹·x + 1)')
PF_k(2, 'Astronomia', 'A órbita de Marte',
     'Para Marte (excentricidade e = 0,093), com anomalia média M = 2 rad, a equação de Kepler é [[E = 2 + 0,093·sen(E)|forma x = g(x)]]. [[Com órbita quase circular, |g′| ≤ 0,093: contração fortíssima|contração forte]], e o chute clássico é [[E₀ = M = 2|um único chute]].',
     '2 + 0.093*sin(x)', 2, 3, W_PF, '2 + 0,093·sen(x)')
PF_tol(2, 'Física', 'Boia flutuando',
       'Uma boia esférica de raio 1 m e densidade 0,6 afunda até a altura h que satisfaz h²(3 − h) = 2,4. Isolando h: [[h = √(2,4/(3 − h))|forma x = g(x)]], com [[|g′| ≈ 0,3 perto da solução|contração]], a partir de [[h₀ = 1 m|um único chute]].',
       'sqrt(2.4/(3 - x))', 1, 4, W_PF, '√(2,4/(3 − x))')
PF_k(2, 'Economia', 'Duopólio de Cournot',
     'Duas empresas iguais ajustam a produção ao que a outra fez no mês anterior: q ← 45 − q/2 (melhor resposta). [[O equilíbrio é o q que se repete: q = g(q)|forma x = g(x)]], e [[|g′| = 0,5 < 1: o ajuste converge|contração]]. No primeiro mês, [[q₀ = 0|um único chute]].',
     '45 - x/2', 0, 3, W_PF, '45 − x/2')
PF_tol(2, 'Hidráulica', 'Velocidade num tubo longo',
       'Água sai de um tanque 5 m acima por um tubo de 50 m e 5 cm de diâmetro. A velocidade satisfaz [[v = √(2gh/(1 + f·L/D)), com o atrito f dependendo de v pela fórmula de Blasius|forma x = g(x)]]. [[O atrito muda pouco com v (|g′| ≈ 0,12)|contração]], e o engenheiro começa com [[v₀ = 2 m/s|um único chute]].',
       'sqrt(98.1/(1 + 316*(50000*x)^(-0.25)))', 2, 4, W_PF, '√(98,1/(1 + 316·(50000x)^(−0,25)))')
PF_k(2, 'Recursos humanos', 'Salário bruto para um líquido desejado',
     'Uma empresa quer pagar R$ 4.000 líquidos. Numa tabela simplificada, o imposto é 27,5% do bruto menos R$ 869,36. Então [[bruto = 4000 + imposto(bruto): B = g(B)|forma x = g(x)]]. [[Cada real a mais de bruto gera só R$ 0,275 de imposto (|g′| = 0,275)|contração]], e o RH parte de [[B₀ = 4000|um único chute]].',
     '4000 + 0.275*x - 869.36', 4000, 3, W_PF, '4000 + 0,275x − 869,36')
PF_k(3, 'Geotecnia', 'Fator de segurança de Bishop',
     'No método de Bishop, o fator de segurança F aparece dos dois lados: [[F = (1,8 + 0,3/F)/(1 + 0,2/F) já está na forma F = g(F)|forma x = g(x)]]. [[g quase não muda com F (|g′| ≈ 0,02): cada rodada corrige quase tudo|contração forte]], e [[a planilha não tem derivada pronta: só recalcula o lado direito|sem derivada]]. O engenheiro começa com [[F₀ = 1,5|um único chute]].',
     '(1.8 + 0.3/x)/(1 + 0.2/x)', 1.5, 2, 'Bishop já vem como F = g(F) e g é uma contração fortíssima: o Ponto Fixo é exatamente o procedimento das planilhas de estabilidade de taludes. Sem derivada, sem intervalo, com um só chute.', '(1,8 + 0,3/x)/(1 + 0,2/x)')
PF_k(3, 'Pesca', 'Pesca sustentável',
     'Um estoque de peixes, em toneladas, segue Nₜ₊₁ = 2Nₜ/(1 + Nₜ/100) − 10, com 10 t pescadas por ano. [[O equilíbrio é N = g(N)|forma x = g(x)]]. [[Perto de N ≈ 77 t, |g′| ≈ 0,64 < 1: o estoque é atraído para lá|contração]], e hoje há [[N₀ = 90 t|um único chute]]. (Existe outro equilíbrio, perto de 13 t, com |g′| > 1: ele repele.)',
     '2*x/(1 + x/100) - 10', 90, 3, W_PF, '2x/(1 + x/100) − 10')
PF_tol(3, 'Telecomunicações', 'Ganho do amplificador saturado',
       'O ganho G de um amplificador óptico saturado satisfaz [[G = 10/(1 + 0,5G)|forma x = g(x)]]. [[|g′(G*)| ≈ 0,64 < 1: a iteração oscila, mas converge|contração]], e o técnico parte de [[G₀ = 2|um único chute]].',
       '10/(1 + 0.5*x)', 2, 3, W_PF, '10/(1 + 0,5x)')
PF_tol(3, 'Engenharia ambiental', 'Partícula no decantador',
       'Num decantador, a velocidade v de queda de uma partícula satisfaz [[v = √(0,6/C_D), com C_D = 24/Re + 0,4 e Re = 50v|forma x = g(x)]]. [[|g′| ≈ 0,31 perto da solução|contração]], e o projeto parte da [[estimativa v₀ = 0,5 m/s|um único chute]].',
       'sqrt(0.6/(24/(50*x) + 0.4))', 0.5, 4, W_PF, '√(0,6/(24/(50x) + 0,4))')
PF_tol(3, 'Clima', 'Temperatura de equilíbrio da Terra',
       'Um modelo de balanço de energia diz que a temperatura T da Terra satisfaz [[T = (S(1 − α(T))/(4σε))^{1/4}|forma x = g(x)]], com S = 1361 W/m², ε = 0,61 e um albedo α(T) que cresce quando há gelo (T baixo). [[Perto do clima atual, |g′| ≈ 0,06|contração forte]], e partindo de [[T₀ = 288 K|um único chute]] a iteração chega ao equilíbrio quente.',
       '(1361*(1 - (0.3 + 0.3/(1 + exp((x - 265)/5))))/(4*0.0000000567*0.61))^(0.25)', 288, 3, W_PF, '(S(1 − α(x))/(4σε))^(1/4)')

# ---------------------------------------------------------------- ordem misturada e identificadores estáveis
METHODS = ['bisection', 'falseposition', 'fixedpoint', 'newton', 'secant', 'gauss', 'seidel']
PREFIX = {'bisection': 'bi', 'falseposition': 'fp', 'fixedpoint': 'pf', 'newton': 'nw', 'secant': 'sc', 'gauss': 'ga', 'seidel': 'gs'}
counts = {m: sum(1 for e in EX if e['method'] == m) for m in METHODS}
assert all(v == 20 for v in counts.values()), counts
seen = {}
for e in EX:
    seen[e['method']] = seen.get(e['method'], 0) + 1
    e['id'] = f"{PREFIX[e['method']]}{seen[e['method']]:02d}"
# Progresso da v8 (ids t1..t100): só migra o exercício que não mudou (mesmo método, função e pergunta).
import os
old = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ids-v8.json'), encoding='utf-8'))
norm = lambda t: re.sub(r',?0+(·10\^)', r'\1', t)  # a v9 escreve 1·10^−6 onde a v8 escrevia 1,0000·10^−6
for tid, o in old.items():
    for e in EX:
        if e['title'] == o['title'] and e['method'] == o['method'] and e['source'] == o['source'] and norm(e['ask']) == norm(o['ask']):
            e['legacy'] = tid
rng = random.Random(9)
pools = {m: [e for e in EX if e['method'] == m] for m in METHODS}
for m in pools: rng.shuffle(pools[m])
order, prev = [], None
while any(pools.values()):
    left = sum(len(v) for v in pools.values())
    opts = [m for m in pools if pools[m] and m != prev]
    must = [m for m in opts if len(pools[m]) * 2 > left]  # evita beco sem saída
    m = must[0] if must else rng.choices(opts, weights=[len(pools[k]) for k in opts])[0]
    order.append(pools[m].pop()); prev = m
# Começa por um exercício de nível 1 (troca segura, sem criar métodos repetidos em sequência).
if order[0]['level'] != 1:
    for j in range(2, len(order)):
        a, b = order[0], order[j]
        if b['level'] == 1 and b['method'] != order[1]['method'] and a['method'] != order[j - 1]['method'] and (j + 1 >= len(order) or a['method'] != order[j + 1]['method']):
            order[0], order[j] = b, a; break
assert order[0]['level'] == 1
assert all(order[i]['method'] != order[i + 1]['method'] for i in range(len(order) - 1))
assert len({e['method'] for e in order[:14]}) == 7, [e['method'] for e in order[:14]]
for i, e in enumerate(order): e['n'] = i + 1

out = 'window.NumeraTreino=' + json.dumps({'version': 2, 'exercises': order}, ensure_ascii=False, separators=(',', ':')) + ';\n'
hdr = '/* Numera Academy — 140 exercícios da aba Treino (v9). Arquivo GERADO por tests/treino/gerar-treino.py (não edite à mão). */\n'
open(sys.argv[1], 'w', encoding='utf-8').write(hdr + out)
print('ok', len(order), 'exercícios;', counts, '; migrados da v8:', sum(1 for e in order if 'legacy' in e), '; sequência:', ''.join(PREFIX[e['method']][0].upper() for e in order))
