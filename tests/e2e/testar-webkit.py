"""Teste no motor do Safari (WebKit), via WebKitGTK + Selenium.
O Safari de verdade só roda no macOS; o WebKitGTK usa o mesmo motor (WebKit/JavaScriptCore) e pega
os problemas típicos de compatibilidade (expressões regulares, CSS, APIs que só o Chrome tem).

Requisitos (Linux): apt install webkit2gtk-driver xvfb; pip install selenium
Uso: xvfb-run -a python3 testar-webkit.py http://127.0.0.1:8000/
"""
import sys, time, json
from selenium import webdriver
from selenium.webdriver.common.by import By

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000/'
opts = webdriver.WebKitGTKOptions()
opts.binary_location = '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser'
opts.add_argument('--automation')
d = webdriver.WebKitGTK(options=opts)
d.set_window_size(1280, 900)
n, falhas = 0, []
def ok(cond, msg):
    global n
    n += 1
    if not cond: falhas.append(msg); print('  FALHOU:', msg)
def js(code, *args): return d.execute_script(code, *args)
def go(h):
    d.get(BASE + 'index.html#' + h); time.sleep(0.4)
    js("window.__erros = window.__erros || []; window.addEventListener('error', e => window.__erros.push(e.message));")
def click(sel):
    el = d.find_element(By.CSS_SELECTOR, sel)
    js("arguments[0].scrollIntoView({block: 'center'})", el); time.sleep(0.05)
    try: el.click()
    except Exception: js('arguments[0].click()', el)  # barra fixa por cima: clica pelo DOM
    time.sleep(0.15)

d.get(BASE + 'index.html'); js('localStorage.clear()'); d.refresh(); time.sleep(0.6)
ua = js('return navigator.userAgent')
ok('AppleWebKit' in ua and 'Chrome' not in ua, 'motor WebKit: ' + ua)
# Todos os scripts carregaram (um erro de sintaxe em qualquer arquivo derrubaria o objeto correspondente).
ok(js('return !!(window.NumeraMath && window.NumeraContent && window.NumeraProgress && window.NumeraConv && window.NumeraTreino && window.NumeraTreinoUI && window.NumeraCalc)'), 'todos os scripts carregaram no WebKit')
ok(js('return !!(window.NumeraBanco && window.NumeraResolver && NumeraBanco.questoes.length > 300)'), 'banco de questões e resolvedor carregados no WebKit')
for h in ['home', 'academy', 'cases', 'listas', 'relampago', 'jogos', 'treino', 'lab', 'review', 'progress']:
    go(h); ok(len(js("return document.querySelector('#app').innerHTML")) > 1000, 'página #' + h)
go('listas'); click('[data-act=bq-abrir]'); ok(len(d.find_elements(By.CSS_SELECTOR, '.bq-card.aberta .bq-form, .bq-card.aberta .bq-alts')) >= 1, 'Listas: questão abre no WebKit')
go('relampago'); click('[data-act=rl-comecar]'); time.sleep(0.4); ok(len(d.find_elements(By.CSS_SELECTOR, '[data-act=rl-alt]')) == 4, 'Relâmpago: pergunta no WebKit')

# Terminal com o teclado científico (calculator.js) e a aba Convergência
go('lab')
src = d.find_element(By.ID, 'source'); src.clear(); src.send_keys('x^3 - x - 2 = 0'); time.sleep(0.2)
ok(js("return document.getElementById('source').value").startswith('x³'), 'expoente vira x³ ao digitar ^ no WebKit')
click('#terminal-form button[type=submit]'); time.sleep(0.8)
ok('1,52137' in js("return document.querySelector('.answer-result strong').textContent"), 'Terminal resolve x³ − x − 2 = 0')
click('[data-act=result-tab][data-id=converge]')
ok(js("return document.querySelectorAll('.conv-series').length") >= 4, 'gráfico de convergência com 4 métodos')
ok(js("return document.querySelector('.terminal-examples') !== null"), 'exemplos do terminal')
# Newton manual com x₀ (o Ponto Fixo está escondido na v11: a opção não aparece no Terminal)
ok(js("return [...document.querySelectorAll('#algorithm option')].every(o => o.value !== 'fixedpoint')"), 'Terminal sem a opção Ponto Fixo')
src = d.find_element(By.ID, 'source'); src.clear(); js("const s=document.getElementById('source'); s.value='x = cos(x)'; s.dispatchEvent(new Event('input',{bubbles:true}))")
js("const a=document.getElementById('algorithm'); a.value='newton'; a.dispatchEvent(new Event('change',{bubbles:true}))"); time.sleep(0.2)
js("const x=document.getElementById('x0'); x.value='1'; x.dispatchEvent(new Event('input',{bubbles:true}))")
click('#terminal-form button[type=submit]'); time.sleep(0.5)
ok('0,7390' in js("return document.querySelector('.answer-result strong').textContent"), 'Newton x = cos(x) com x₀ = 1 no WebKit')

# v11: jornada, mascotes dançando e combo com moedas (animações CSS e Web Animations no Safari)
go('academy')
ok(js("return document.querySelectorAll('.journey .world.locked').length") == 5, 'jornada com 5 mundos travados no começo')
click('[data-act=course][data-id=bisection]'); click('[data-act=node][data-id=sim]'); click('[data-act=start-node][data-id=sim]'); click('[data-act=sim-done]')
ok(js("return !document.getElementById('mascotes').hidden && document.body.classList.contains('has-mascots')"), 'Raiz e Pivô em cena no desafio')
ok(js("return getComputedStyle(document.querySelector('.mz-raiz-body')).animationName") == 'mz-hop', 'Raiz dança (animação CSS) no WebKit')
def responder(i):
    t = js("return window.NumeraContent.TASKS.bisection[arguments[0]]", i)
    if t.get('type') == 'choice':
        ops = js("return [...document.querySelectorAll('.choice')].map(b => b.textContent)")
        k = next(j for j, x in enumerate(ops) if t['options'][t['answer']] in x)
        js("document.querySelectorAll('.choice')[arguments[0]].click()", k)
    else:
        el = d.find_element(By.ID, 'answer'); el.clear(); el.send_keys(str(t['value']).replace('.', ','))
    click('#quiz-form button[type=submit]')
for i in range(3):
    responder(i)
    if i < 2: click('[data-act=next-course]')
ok(js("return document.getElementById('mascotes').classList.contains('is-combo')"), '3 acertos seguidos: combo no WebKit')
time.sleep(0.75)
ok(js("return document.querySelectorAll('.mz-coin').length") >= 3, 'moedas caem da caixa (Web Animations) no WebKit')
time.sleep(1.2)
ok('11' in js("return document.querySelector('.player-top .coin-meta').textContent"), 'contador de moedas: 11')

# v12: Bobo da Corte no motor do Safari (uma rodada no modo telão). Aqui o clique é disparado pelo DOM:
# o que se testa é o jogo no WebKit; o clique simulado do WebDriver do WebKitGTK erra o alvo depois de rolar a página.
def jsclick(sel):
    js('document.querySelector(arguments[0]).click()', sel); time.sleep(0.15)
d.get(BASE + 'jogos/bobo-da-corte/index.html'); time.sleep(0.6)
js("window.__erros = window.__erros || []; window.addEventListener('error', e => window.__erros.push(e.message));")
jsclick('[data-a=exemplo]'); jsclick('[data-a=comecar]')
ok(js("return !!document.getElementById('pergunta-t')"), 'Bobo da Corte: pergunta no quadro (WebKit)')
jsclick('[data-a=ir-voto]')
ids = js("return window.__bc.S.jogadores.map(j => j.id)")
for i in range(len(ids)):
    js("document.querySelector(`[data-a=votar][data-id=${arguments[0]}]`).click()", ids[(i + 1) % len(ids)])
jsclick('[data-a=revelar-votos]'); jsclick('[data-a=ir-anotar]')
r = js("return window.BCPerguntas.resolver(window.__bc.S.perguntas[0]).resposta")
for i, j in enumerate(ids):
    el = d.find_element(By.ID, 'pal-' + j); el.clear(); el.send_keys(str(r * (1 + 0.1 * i)).replace('.', ','))
jsclick('[data-a=revelar]'); time.sleep(6)
ok(js("return document.querySelectorAll('.reta .pin').length") == len(ids), 'reta numérica com os palpites (WebKit)')
ok(js("return !(document.querySelector('[data-a=pos-revelar]') || document.querySelector('[data-a=ir-perturbacao]')).disabled"), 'revelação termina e libera o Bobo da Corte (WebKit)')
js("(document.querySelector('[data-a=ir-perturbacao]') || {click(){}}).click()"); time.sleep(0.2); js("(document.querySelector('[data-a=perturb]') || {click(){}}).click()"); time.sleep(0.2)
jsclick('[data-a=pos-revelar]'); time.sleep(0.3); jsclick('[data-a=bobo-pular]'); time.sleep(0.4)
ok(js("return !!document.querySelector('.bobo-palco .bobo-danca')"), 'Bobo da Corte dançando (WebKit)')
ok(js("return !!document.querySelector('.carteira.divergiu .carimbo')"), 'carimbo DIVERGIU (WebKit)')
erros_qd = js('return window.__erros || []'); ok(not erros_qd, 'Bobo da Corte sem erros de JavaScript: ' + json.dumps(erros_qd))

# Treino: diagnóstico, resposta e gabarito com gráfico
go('treino')
e0 = js("return window.NumeraTreino.exercises[0]")
click(f".tr-tool[data-id={e0['method']}]")
ok(js("return !!document.querySelector('.tr-verdict.ok')"), 'diagnóstico no Treino')
vals = e0['answer']['values'] if e0['answer']['type'] == 'vec' else [e0['answer']['value']]
for i, v in enumerate(vals):
    el = d.find_element(By.ID, f'tr-ans-{i}'); el.clear(); el.send_keys(str(v).replace('.', ','))
click('#tr-form button[type=submit]')
ok('Correto' in js("return document.querySelector('#tr-form .tr-verdict').textContent"), 'resposta com vírgula no Treino')
click('[data-act=tr-key]')
ok(js("return !!document.querySelector('.tr-conv .conv-plot')"), 'gabarito com gráfico no WebKit')
# Prova curta até o relatório
click('[data-act=tr-view][data-id=prova]'); click('[data-act=tr-pv-n][data-id="5"]'); click('[data-act=tr-pv-start]')
ok(js("return !!document.getElementById('tr-timer')"), 'prova com cronômetro')
click('.tr-exam-end [data-act=tr-pv-end]'); click('[data-act=tr-pv-end-yes]')
ok(js("return document.querySelector('.tr-grade b').textContent.trim()") == '0,0', 'relatório da prova (prova em branco = 0,0)')
erros = js('return window.__erros || []')
ok(not erros, 'sem erros de JavaScript: ' + json.dumps(erros))
d.quit()
print(f'WebKit (motor do Safari): {n - len(falhas)}/{n} verificações')
sys.exit(1 if falhas else 0)
