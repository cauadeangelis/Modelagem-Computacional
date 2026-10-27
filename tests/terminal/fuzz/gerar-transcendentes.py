"""Gera 400 equações transcendentes e casos-armadilha aleatórios (semente 5): seno, tangente com polos,
1/(x-a), salto abs(x)/x, borda do domínio (ln, sqrt), raízes tangentes e funções quase nulas.
Referência: varredura com 400.001 pontos + bisseção vetorizada + teste de polo (|f| precisa encolher).
Uso: python3 gerar-transcendentes.py transcendentes-400.json   (precisa de: pip install sympy numpy)"""
import json, random, sys, re
import numpy as np, sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
X = sp.Symbol('x')
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
def to_sympy(src):
    t = re.sub(r'(\d),(?=\d)', r'\1.', src)
    l, r = t.split('=') if '=' in t else (t, '0')
    loc = {'x': X, 'e': sp.E, 'pi': sp.pi, 'exp': sp.exp, 'sqrt': sp.sqrt, 'abs': sp.Abs, 'log': sp.log, 'ln': sp.log, 'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan}
    return parse_expr(l, local_dict=loc, transformations=TR) - parse_expr(r, local_dict=loc, transformations=TR)
def rrn(fexpr):
    fl=sp.lambdify(X,fexpr,'numpy')
    xs=np.linspace(-40,40,400001)
    with np.errstate(all='ignore'): ys=np.asarray(fl(xs),dtype=float)*np.ones_like(xs)
    ok=np.isfinite(ys); sg=np.sign(ys)
    idx=np.where(ok[:-1]&ok[1:]&(sg[:-1]*sg[1:]<0))[0]
    a=xs[idx].copy(); b=xs[idx+1].copy(); fa=ys[idx].copy(); f0=np.maximum(abs(ys[idx]),abs(ys[idx+1]))
    with np.errstate(all='ignore'):
        for _ in range(80):
            m=(a+b)/2; fm=np.asarray(fl(m),dtype=float)*np.ones_like(m)
            left=np.sign(fm)==np.sign(fa); a=np.where(left,m,a); fa=np.where(left,fm,fa); b=np.where(left,b,m)
        m=(a+b)/2; fm=abs(np.asarray(fl(m),dtype=float)*np.ones_like(m))
    roots=[float(x) for x,v,s0 in zip(m,fm,f0) if np.isfinite(v) and v<=1e-6*s0]
    roots+= [float(x) for x in xs[np.where(ok&(ys==0))[0]]]
    ay=np.where(ok,abs(ys),np.inf)
    mn=np.where((ay[1:-1]<ay[:-2])&(ay[1:-1]<=ay[2:])&(ay[1:-1]<1e-9*np.maximum(1,np.nanmax(np.where(ok,abs(ys),0)))))[0]+1
    for i in mn:
        lo,hi=xs[i-1],xs[i+1]
        for _ in range(200):
            m1,m2=lo+(hi-lo)/3,hi-(hi-lo)/3
            if abs(fl(m1))<abs(fl(m2)): hi=m2
            else: lo=m1
        r=(lo+hi)/2
        loc=max(1e-300,*(abs(ys[j]) for j in (max(0,i-50),min(len(xs)-1,i+50)) if ok[j]))
        if abs(fl(r))<=1e-10*loc: roots.append(float(r))
    out=[]
    for r in sorted(roots):
        if not out or abs(r-out[-1])>1e-7*(1+abs(r)): out.append(r)
    return out
random.seed(5); cases=[]
def r1(a,b): return round(random.uniform(a,b),2)
T=[lambda: f'{r1(0.5,5)}sin({r1(0.2,3)}x) + {r1(-2,2)}x = {r1(-5,5)}'.replace('+ -','- '),
   lambda: f'exp({r1(-1,1)}x) = {r1(0.1,30)}',
   lambda: f'tan(x) = {r1(-3,3)}x + {r1(-5,5)}'.replace('+ -','- '),
   lambda: f'1/(x - {r1(-9,9)}) = {r1(-3,3)}'.replace('- -','+ '),
   lambda: f'abs(x)/x = {r1(-0.9,0.9)}',
   lambda: f'sqrt(x + {r1(0,9)}) = {r1(-1,5)}',
   lambda: f'ln(x) = {r1(-3,3)}',
   lambda: f'x cos(x) = {r1(-5,5)}',
   lambda: f'cos(x) - {r1(0.9,1.1)} = 0',
   lambda: f'x^2 exp(-x) = {r1(0.01,0.6)}',
   lambda: f'{random.choice([1e-9,3e-8,1e-6,1e-15])}(x^2 + {r1(0.1,4)}) = 0',
   lambda: f'(x - {r1(-5,5)})^2 + {random.choice([0,1e-9,1e-3])} = 0'.replace('- -','+ '),
   lambda: f'sin(x)/x = {r1(-0.2,0.9)}',
   lambda: f'exp(x) - {r1(1,3)}x^2 = 0',
]
for i in range(400):
    s=random.choice(T)()
    f=to_sympy(s)
    try: roots=rrn(f)
    except Exception as e: print('skip',s,e); continue
    cases.append({'id':i,'src':s,'roots':roots})
json.dump(cases,open(sys.argv[1],'w'),ensure_ascii=False); print(len(cases), 'equações')
