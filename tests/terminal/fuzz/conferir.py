"""Confere as raízes do motor com a referência. Raiz certa: erro relativo <= 1e-6.
Uso: python3 conferir.py polinomios-1000.json resultados-polinomios-v7.json resultados-polinomios-v9.json [--ci]"""
import json, sys
cases = {c['id']: c for c in json.load(open(sys.argv[1]))}
close = lambda a, b: abs(a - b) <= 1e-6 * (1 + abs(b))
bad_ci = []
for f in [a for a in sys.argv[2:] if not a.startswith('--')]:
    ok = miss = false_ = err = 0; ex = []
    for r in json.load(open(f)):
        c = cases[r['id']]; exp = c['roots']
        if r['error']:
            if not exp: ok += 1
            else: err += 1; ex.append((c['src'], 'deu erro, mas há raiz', exp[:4]))
            continue
        got = r['roots']
        fr = [g for g in got if not any(close(g, e) for e in exp)]
        ms = [e for e in exp if not any(close(g, e) for g in got)]
        if fr: false_ += 1; ex.append((c['src'], 'raiz que a referência não tem', fr[:4]))
        elif ms: miss += 1; ex.append((c['src'], 'faltou', ms[:4]))
        else: ok += 1
    print(f'{f}: certo {ok} | incompleto {miss} | raiz a mais {false_} | erro {err}')
    # --ci: falha se faltar raiz ou der erro; "raiz a mais" só é aceita nos casos em que a referência é que erra
    # (cos(x) = 1 tem raízes duplas em 2πk; a amostragem da referência perde algumas, ver TESTES-TERMINAL.md).
    known = {'cos(x) - 1.0 = 0'}
    if '--ci' in sys.argv and (miss or err or any(e[1] == 'raiz que a referência não tem' and e[0] not in known for e in ex)): bad_ci.append(f)
    for e in ex[:8]: print('   ', str(e)[:200])
if '--ci' in sys.argv and bad_ci: sys.exit(1)
