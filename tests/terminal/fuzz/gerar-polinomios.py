"""Gera 1000 polinômios aleatórios (graus 2 a 6, semente 99), muitos com raízes quase coladas.
As raízes de referência são calculadas de forma exata (sympy) a partir dos coeficientes impressos.
Uso: python3 gerar-polinomios.py polinomios-1000.json"""
import json, random, sys, sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
random.seed(99); X = sp.Symbol('x'); cases = []
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
def pstr(p):
    out = ''
    for (k,), c in sorted(sp.Poly(p, X).terms(), key=lambda t: -t[0][0]):
        c = float(c); a = abs(c); s = ('%.12g' % a)
        mono = '' if k == 0 else ('x' if k == 1 else f'x^{k}')
        body = (s if k == 0 else (mono if a == 1 else s + mono))
        out += (('-' if c < 0 else '') + body) if not out else ((' - ' if c < 0 else ' + ') + body)
    return out
for i in range(1000):
    deg = random.randint(2, 6); roots = []
    while len(roots) < deg:
        r = round(random.uniform(-30, 30), 2)
        if random.random() < .25 and roots: r = round(roots[-1] + random.choice([-1, 1]) * random.uniform(0.012, 0.09), 3)
        if all(abs(r - q) > 0.01 for q in roots): roots.append(r)
    p = sp.Integer(1)
    for r in roots: p *= (X - sp.nsimplify(r))
    if random.random() < .3 and deg >= 3:  # troca duas raízes por um par complexo
        p = sp.expand(p / ((X - sp.nsimplify(roots[-1])) * (X - sp.nsimplify(roots[-2]))) * (X**2 + random.randint(1, 9)))
        roots = roots[:-2]
    k = random.choice([1, 1, 2, -3, 0.5])
    p = sp.expand(sp.nsimplify(k) * p)
    src = pstr(p) + ' = 0'
    e = sp.nsimplify(parse_expr(src.split('=')[0], local_dict={'x': X}, transformations=TR), rational=True)
    rr = sorted({float(sp.N(r, 30)) for r in sp.Poly(e, X).real_roots()})
    cases.append({'id': i, 'src': src, 'roots': [r for r in rr if -40 <= r <= 40]})
json.dump(cases, open(sys.argv[1], 'w'))
print(len(cases), 'polinômios')
