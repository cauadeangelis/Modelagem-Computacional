"""Gera 100 equações aleatórias (semente fixa 2026) com respostas de referência independentes.
Uso: python3 gerar-equacoes.py equacoes-100.json   (precisa de: pip install sympy mpmath numpy)
Referências: sympy (raízes exatas de polinômios) e mpmath com 40 dígitos (transcendentes)."""
import json, random, sys, re
import numpy as np, sympy as sp, mpmath as mp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

mp.mp.dps = 40
random.seed(2026)
X = sp.Symbol('x')
LO, HI = -40, 40
items = []

def fmt_num(c):
    c = sp.nsimplify(c)
    if c.is_Integer: return str(int(c))
    v = float(c)
    s = ('%.6f' % v).rstrip('0').rstrip('.')
    return s

def poly_str(expr, var='x'):
    """Formata polinômio em sintaxe do terminal: 3x^3 - 2x^2 + x - 6."""
    p = sp.Poly(sp.expand(expr), X)
    terms = []
    for (k,), c in sorted(p.terms(), key=lambda t: -t[0][0]):
        c = sp.nsimplify(c)
        sign = '-' if c < 0 else '+'
        a = abs(c)
        if k == 0: body = fmt_num(a)
        else:
            mono = var if k == 1 else f'{var}^{k}'
            body = mono if a == 1 else fmt_num(a) + mono
        terms.append((sign, body))
    s = ''
    for i, (sg, b) in enumerate(terms):
        s += ('-' + b if sg == '-' else b) if i == 0 else f' {sg} {b}'
    return s

TR = standard_transformations + (implicit_multiplication_application, convert_xor)
def to_sympy(src):
    t = src.replace('−', '-').replace('·', '*').replace('×', '*').replace('²', '^2').replace('³', '^3')
    t = re.sub(r'(\d),(?=\d)', r'\1.', t)
    t = t.replace('sen(', 'sin(').replace('ln(', 'log(')
    t = t.replace('log10(', '§(')
    if '=' in t:
        l, r = t.split('=')
    else:
        l, r = t, '0'
    loc = {'x': X, 'e': sp.E, 'pi': sp.pi, 'exp': sp.exp, 'sqrt': sp.sqrt, 'abs': sp.Abs, 'log': sp.log, 'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan}
    return parse_expr(l, local_dict=loc, transformations=TR) - parse_expr(r, local_dict=loc, transformations=TR)

def real_roots_numeric(f_expr):
    """Raízes reais em [LO,HI]: varredura densa (2e6 pontos) + refinamento mpmath em 40 dígitos."""
    fl = sp.lambdify(X, f_expr, 'numpy')
    fm = sp.lambdify(X, f_expr, 'mpmath')
    xs = np.linspace(LO, HI, 2_000_001)
    with np.errstate(all='ignore'):
        ys = np.asarray(fl(xs), dtype=float) * np.ones_like(xs)
    ok = np.isfinite(ys)
    cands = []
    # sinais opostos com ambos finitos
    s = np.sign(ys)
    idx = np.where(ok[:-1] & ok[1:] & (s[:-1] * s[1:] < 0))[0]
    cands += [(xs[i], xs[i + 1]) for i in idx]
    idx0 = np.where(ok & (ys == 0))[0]
    cands += [(xs[i], xs[i]) for i in idx0]
    # mínimos locais de |f| quase zero (raízes tangentes)
    ay = np.where(ok, np.abs(ys), np.inf)
    m = np.where((ay[1:-1] < ay[:-2]) & (ay[1:-1] <= ay[2:]) & (ay[1:-1] < 1e-6))[0] + 1
    cands += [(xs[i], xs[i]) for i in m]
    roots = []
    for a, b in cands:
        try:
            if a != b:
                r = mp.findroot(fm, (mp.mpf(a), mp.mpf(b)), solver='anderson')
            else:
                lo_, hi_ = mp.mpf(a) - mp.mpf('1e-4'), mp.mpf(a) + mp.mpf('1e-4')
                for _ in range(300):  # busca ternária do mínimo de |f| (raiz tangente)
                    m1, m2 = lo_ + (hi_ - lo_) / 3, hi_ - (hi_ - lo_) / 3
                    if abs(fm(m1)) < abs(fm(m2)): hi_ = m2
                    else: lo_ = m1
                r = (lo_ + hi_) / 2
                if abs(fm(r)) > mp.mpf('1e-25'): continue
            r = float(mp.re(r))
        except Exception:
            continue
        if not (LO - 1e-9 <= r <= HI + 1e-9): continue
        # valida em alta precisão: f(r) pequeno e (sinal muda ou tangente)
        try:
            val = abs(fm(mp.mpf(r)))
        except Exception:
            continue
        scale = max(abs(fm(mp.mpf(r) + mp.mpf('1e-4'))), abs(fm(mp.mpf(r) - mp.mpf('1e-4'))), mp.mpf('1e-300'))
        if val / scale > 1e-6: continue
        if any(abs(r - q) < 1e-7 * (1 + abs(q)) for q in roots): continue
        roots.append(r)
    return sorted(roots)

def poly_roots(f_expr):
    rr = [float(sp.N(r, 30)) for r in sp.Poly(sp.expand(sp.nsimplify(f_expr, rational=True)), X).real_roots()]
    out = []
    for r in rr:
        if any(abs(r - q) < 1e-12 for q in out): continue
        out.append(r)
    return sorted(out)

def add_root(cat, src, note='', poly=None, expect_error=False):
    f = to_sympy(src)
    if poly is not None:
        assert sp.simplify(sp.expand(f) - sp.expand(poly)) == 0 or sp.simplify(sp.expand(f) + sp.expand(poly)) == 0, (src, f, poly)
    is_poly = f.is_polynomial(X)
    roots = poly_roots(f) if is_poly else real_roots_numeric(f)
    inrange = [r for r in roots if LO <= r <= HI]
    allreal = roots
    items.append({'id': len(items) + 1, 'cat': cat, 'kind': 'root', 'input': src, 'expected': inrange,
                  'outOfRange': [r for r in allreal if not (LO <= r <= HI)], 'expectError': expect_error or not inrange, 'note': note})

def ri(a, b, nz=False):
    while True:
        v = random.randint(a, b)
        if not nz or v != 0: return v

# A. Lineares (9)
for i in range(9):
    a, b, c = ri(-9, 9, True), ri(-30, 30), ri(-30, 30)
    if i == 7:
        src = f'{fmt_num(sp.Rational(2*ri(1,9)+1,2))}x - {abs(b)} = {c}'.replace('.', ',')
        add_root('Linear', src, 'decimal com vírgula')
    elif i == 8:
        k = ri(2, 6)
        src = f'{k}(x - {abs(b)}) = x + {abs(c)}'
        add_root('Linear', src, 'multiplicação implícita com parênteses')
    else:
        lhs = poly_str(a * X + b)
        add_root('Linear', f'{lhs} = {c}', poly=a * X + b - c)

# B. Quadráticas com raízes racionais (8)
for i in range(8):
    k = ri(1, 4)
    r1, r2 = sp.Rational(ri(-25, 25), random.choice([1, 1, 2])), sp.Rational(ri(-25, 25), random.choice([1, 1, 2]))
    p = sp.expand(2 * k * (X - r1) * (X - r2)) if (r1.q == 2 or r2.q == 2) else sp.expand(k * (X - r1) * (X - r2))
    add_root('Quadrática (raízes racionais)', poly_str(p) + ' = 0', poly=p)

# C. Quadráticas irracionais (4)
for i in range(4):
    while True:
        a, b, c = ri(1, 5), ri(-12, 12), ri(-15, 15)
        d = b * b - 4 * a * c
        if d > 0 and sp.sqrt(d).is_irrational: break
    p = a * X**2 + b * X + c
    add_root('Quadrática (raízes irracionais)', poly_str(p) + ' = 0', poly=p)

# D. Cúbicas com 3 raízes reais (6)
for i in range(6):
    rs = random.sample(range(-12, 13), 3)
    p = sp.expand((X - rs[0]) * (X - rs[1]) * (X - rs[2]))
    if i >= 4: p = sp.expand(p - sp.Rational(ri(1, 9), 10))  # raízes não inteiras
    add_root('Cúbica (3 raízes reais)', poly_str(p) + ' = 0', poly=p)

# E. Cúbicas com 1 raiz real (4)
for i in range(4):
    r = ri(-8, 8); q = ri(1, 9)
    p = sp.expand((X - r) * (X**2 + ri(-2, 2) * X + q + 2)) if i < 2 else sp.expand(X**3 + ri(1, 6) * X - ri(-20, 20))
    add_root('Cúbica (1 raiz real)', poly_str(p) + ' = 0', poly=p)

# F. Quárticas e quínticas (6)
quart = [
    (X - 1) * (X - sp.Rational(21, 20)) * (X + 2) * (X - 3),   # raízes próximas 1 e 1,05
    (X**2 - 2) * (X**2 - 7),
    (X - 4) * (X + 1) * (X - sp.Rational(1, 2)) * (X + 6) * (X - 9),
    X**4 - 10 * X**2 + 9 + 0 * X,
    (X - 2) * (X + 3) * (X**2 + 1) * (X - 5),
    X**5 - 5 * X**3 + 4 * X - sp.Rational(1, 2),
]
for p in quart:
    p = sp.expand(p)
    if any(c.q not in (1,) for c in sp.Poly(p, X).coeffs()):
        p = sp.expand(p * sp.lcm([c.q for c in sp.Poly(p, X).coeffs()]))
    add_root('Quártica / quíntica', poly_str(p) + ' = 0', poly=p)

# G. Potências altas (6)
for src in ['x^5 = 32', 'x^7 - 128 = 0', 'x^10 = 1024', 'x^8 - 3x^4 + 2 = 0', 'x^20 - 3x^10 + 2 = 0', 'x^100 - 10000000000 = 0']:
    add_root('Potência alta', src)

# H. Raízes múltiplas / tangentes (4)
a = sp.Rational(ri(-30, 30), 10)
for src in [f'(x - {fmt_num(a)})^2 = 0', f'(x + {ri(1,9)})^3 = 0', f'(x - {ri(1,9)})^4 = 0', f'abs(x - {ri(1,20)}) = 0']:
    add_root('Raiz múltipla / tangente', src)

# I. Trigonométricas (7)
trig = [f'sin(x) = {fmt_num(sp.Rational(ri(1,9),10))}', f'cos(x) = x / {ri(2,6)}', f'tan(x) = {ri(1,5)} - x',
        f'sin(x) + cos(x) = {fmt_num(sp.Rational(ri(1,13),10))}', f'x sin(x) = {ri(1,5)}', f'cos({ri(2,4)}x) = x^2', 'sen(x) = x/10']
for src in trig: add_root('Trigonométrica', src)

# J. Exponenciais e logarítmicas (7)
expo = [f'exp(x) = {ri(2,40)}', f'ln(x) = {fmt_num(sp.Rational(ri(1,30),10))}', f'2^x = {ri(3,500)}', f'x exp(x) = {ri(1,9)}',
        f'e^(-x) = x', f'ln(x) + x = {ri(2,9)}', f'log(x) = {fmt_num(sp.Rational(ri(1,15),10))}']
for src in expo: add_root('Exponencial / logarítmica', src.replace('log(', 'log(') if 'log(x) =' not in src else src, note='log = base 10' if src.startswith('log(') else '')
# conserta referência do log base 10 (sympy log = ln)
it = items[-1]; f = sp.log(X, 10) - sp.nsimplify(it['input'].split('=')[1].strip())
it['expected'] = real_roots_numeric(f); it['expectError'] = not it['expected']

# K. Raízes quadradas, módulo e racionais (6)
for src in [f'sqrt(x) = {ri(2,6)}', f'sqrt(x + {ri(1,9)}) = x - 1', f'abs(x - {ri(1,9)}) = {ri(1,9)}', f'1/x + x = {ri(3,9)}',
            f'(x^2 - 4)/(x - 1) = {ri(1,5)}', f'x^(1/3) = {ri(2,3)}']:
    add_root('Raiz / módulo / fração', src)

# L. Sintaxe estilo calculadora (Unicode) (4)
for src in ['x² − 5x + 6 = 0', '2·x³ = 54', '3(x − 1) = 2x + 4', 'x² = 2,25']:
    add_root('Sintaxe Unicode', src, note='símbolos ², ³, −, ·, vírgula')

# M. Sem solução real / fora da faixa (6)
for src, note in [('x^2 + 1 = 0', 'sem raiz real'), ('1/x = 0', 'assíntota, sem raiz'), ('exp(x) = 0', 'sem raiz, f→0 em −∞'),
                  ('cos(x) = 2', 'sem raiz real'), ('x^2 - 4x + 7 = 0', 'discriminante negativo'), ('log(x) = 3', 'raiz x = 1000 fora da faixa padrão [−40, 40]')]:
    add_root('Sem solução na faixa', src, note=note, expect_error=True)
items[-1]['outOfRange'] = [1000.0]; items[-1]['expected'] = []

# N. Sistemas lineares com solução única (20)
def sys_item(n, dd=False, matrix=False, decimal=False, vars_=None):
    vars_ = vars_ or (['x', 'y', 'z', 'u', 'v', 'w'][:n] if n <= 3 or random.random() < .5 else [f'x{i+1}' for i in range(n)])
    while True:
        A = [[ri(-9, 9) for _ in range(n)] for _ in range(n)]
        if dd:
            for i in range(n): A[i][i] = sum(abs(v) for j, v in enumerate(A[i]) if j != i) + ri(1, 5)
        if abs(np.linalg.det(np.array(A, float))) > 0.5: break
    sol = [sp.Rational(ri(-12, 12), 2 if decimal else 1) for _ in range(n)]
    b = [sum(A[i][j] * sol[j] for j in range(n)) for i in range(n)]
    lines = []
    for i in range(n):
        if matrix:
            lines.append(', '.join(str(v) for v in A[i]) + ' | ' + fmt_num(b[i]))
        else:
            expr = ''
            for j in range(n):
                c = A[i][j]
                if c == 0: continue
                mono = vars_[j] if abs(c) == 1 else f'{abs(c)}{vars_[j]}'
                expr += (('-' if c < 0 else '') + mono) if not expr else (f' - {mono}' if c < 0 else f' + {mono}')
            lines.append(f'{expr or "0"} = {fmt_num(b[i])}')
    names = [f'x{i+1}' for i in range(n)] if matrix else vars_
    if not matrix and any(all(A[i][j] == 0 for i in range(n)) for j in range(n)): return sys_item(n, dd, matrix, decimal)
    items.append({'id': len(items) + 1, 'cat': f'Sistema {n}×{n}' + (' (matriz)' if matrix else ''), 'kind': 'system', 'input': '\n'.join(lines),
                  'expected': [float(v) for v in sol], 'vars': names, 'expectError': False, 'note': 'diagonal dominante' if dd else ''})

for i in range(6): sys_item(2, dd=(i % 2 == 0), decimal=(i == 5))
for i in range(6): sys_item(3, dd=(i % 2 == 0), decimal=(i == 4))
for i in range(3): sys_item(4, dd=(i == 0))
for i in range(2): sys_item(5, dd=(i == 0))
sys_item(6, dd=True)
sys_item(2, matrix=True); sys_item(3, matrix=True)

# O. Sistemas sem solução única (3)
for src, note in [('x + y = 2\n2x + 2y = 4', 'infinitas soluções'), ('x + y = 1\nx + y = 3', 'sem solução (retas paralelas)'),
                  ('x + y + z = 1\n2x + 2y + 2z = 5\nx - y + z = 0', 'sem solução (3×3 singular)')]:
    items.append({'id': len(items) + 1, 'cat': 'Sistema sem solução única', 'kind': 'system', 'input': src, 'expected': None, 'expectError': True, 'note': note})

assert len(items) == 100, len(items)
json.dump(items, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(i['cat'] for i in items))
for it in items[:3]: print(it)
