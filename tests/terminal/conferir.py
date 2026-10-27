"""Compara o que o terminal mostrou com as respostas de referência.
Uso: python3 conferir.py equacoes-100.json resultados/v7-digitado.json resultados/conferencia-v7.json [-v]"""
import json, re, sys
from collections import Counter, defaultdict
eqs = {e['id']: e for e in json.load(open(sys.argv[1]))}
res = json.load(open(sys.argv[2]))

def pnum(t):
    t = t.strip().replace('x ≈', '').replace('≈', '').strip()
    if re.search(r'e[+-]?\d', t): return float(t)
    return float(t.replace('.', '').replace(',', '.').replace('−', '-'))

def close(a, b, rel=2e-6):
    return abs(a - b) <= rel * (1 + abs(b))

rows = []
for r in res:
    e = eqs[r['id']]
    verdict, detail = None, ''
    shown = []
    if r['alert'] and not r['method']:
        if e['expectError']:
            verdict = 'OK'; detail = 'rejeitou corretamente: ' + r['alert'][:90]
        else:
            verdict = 'FALHA'; detail = 'deu erro, mas existe solução: ' + r['alert'][:110]
    elif r['method']:
        if e['kind'] == 'system':
            vals = {}
            for line in r['answer'].split('\n'):
                k, v = line.split('=')
                vals[k.strip()] = pnum(v)
            if e['expectError']:
                verdict = 'FALHA'; detail = 'mostrou solução para sistema sem solução única'
            else:
                got = [vals.get(n) for n in e['vars']]
                ok = all(g is not None and close(g, x, 1e-7) for g, x in zip(got, e['expected']))
                verdict = 'OK' if ok else 'FALHA'
                detail = f"{r['method']} → " + ', '.join(f'{n}={g}' for n, g in zip(e['vars'], got))
        else:
            main = pnum(r['answer'])
            shown = sorted({pnum(t) for t in r['others']} | {main})
            exp = e['expected']
            false_roots = [x for x in shown if not any(close(x, y) for y in exp)]
            missed = [y for y in exp if not any(close(x, y) for x in shown)]
            if e['expectError'] and not exp:
                verdict = 'FALHA'; detail = f'inventou raiz {shown} (não existe raiz na faixa)'
            elif false_roots:
                verdict = 'FALHA'; detail = f'raiz falsa {false_roots}'
            elif missed:
                verdict = 'INCOMPLETO'; detail = f'achou {len(shown)}/{len(exp)}; faltou {[round(m, 6) for m in missed][:6]}'
            else:
                verdict = 'OK'; detail = f"{r['method']}: {len(shown)}/{len(exp)} raízes"
            if r['status'] and 'não atingido' in r['status'] and verdict == 'OK':
                verdict = 'FALHA'; detail += ' (critério não atingido)'
    else:
        verdict = 'FALHA'; detail = 'sem resposta na tela'
    if r['pageErrors']:
        verdict = 'FALHA'; detail += ' | erro JS: ' + '; '.join(r['pageErrors'])[:120]
    rows.append({'id': r['id'], 'cat': e['cat'], 'input': e['input'], 'verdict': verdict, 'detail': detail, 'ms': r['ms'],
                 'method': r['method'], 'answer': r['answer'], 'others': r['others'], 'alert': r['alert']})

c = Counter(x['verdict'] for x in rows)
print('RESUMO', dict(c), ' tempo médio %.0f ms, máx %d ms' % (sum(x['ms'] for x in rows) / len(rows), max(x['ms'] for x in rows)))
bycat = defaultdict(Counter)
for x in rows: bycat[x['cat']][x['verdict']] += 1
for k, v in bycat.items(): print(f'  {k:34s} {dict(v)}')
print()
for x in rows:
    if x['verdict'] != 'OK' or '-v' in sys.argv:
        print(f"#{x['id']:3d} {x['verdict']:10s} {x['input'].replace(chr(10), ' ; ')[:60]:60s} {x['detail']}")
json.dump(rows, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
# Integração contínua: com --ci, qualquer resultado diferente de OK faz o processo falhar.
if '--ci' in sys.argv and any(x['verdict'] != 'OK' for x in rows): sys.exit(1)
