# Testes do Terminal — Numera Academy v7

Relatório dos testes feitos no terminal antes e depois das mudanças da versão 7: a lista das 100 equações, como cada uma foi conferida, o que falhou na v6, o que foi corrigido e como repetir tudo.

## Resumo

| Teste | v6 | v7 |
|---|---|---|
| 100 equações digitadas no terminal, no navegador | 93 certas · 6 incompletas · 1 erro | **100 certas** |
| As mesmas 100 coladas de uma vez | — | **100 certas** |
| 19 cenários do teclado científico (clicando nas teclas) | não existia | **19 de 19** |
| 1.000 polinômios aleatórios (graus 2 a 6, muitos com raízes quase coladas) | 333 completos | **1.000 completos** |
| 400 equações transcendentes e armadilhas (polos, saltos, bordas do domínio) | 310 certas | **400 certas**¹ |
| Suíte do projeto (`node tests/verify.cjs`) | 510 verificações | **556 verificações** |
| Erros de JavaScript durante os testes | 0 | 0 |

¹ O conferidor marcou 398; nos 2 casos restantes (`cos(x) − 1 = 0`) quem errou foi a referência: ela não achou as raízes duplas ±10π e ±12π, que o terminal achou corretamente.

No motor, o caso mais demorado entre as 1.500 equações levou 63 ms (uma tangente com dezenas de raízes); as equações comuns levam de 2 a 10 ms.

## Como o teste foi feito

1. **Lista.** As 100 equações foram sorteadas por `tests/terminal/gerar-equacoes.py` com semente fixa (2026); rodar de novo gera exatamente a mesma lista. São 21 tipos: lineares, de 2º grau (raízes racionais e irracionais), cúbicas, de 4º e 5º grau, potências altas, raízes múltiplas, trigonométricas, exponenciais e logaritmos, raiz quadrada, módulo, frações, escrita com símbolos (², ³, −, ·, vírgula decimal), equações sem solução e sistemas de 2×2 a 6×6 (inclusive na forma de matriz e sem solução única).
2. **Resposta certa, calculada à parte.** Para polinômios, o `sympy` acha as raízes reais de forma exata. Para as demais, uma varredura com 2 milhões de pontos é refinada pelo `mpmath` com 40 dígitos. Os sistemas foram montados a partir de uma solução conhecida (números inteiros ou com meio, como 0,5).
3. **No navegador, como um usuário.** Cada equação foi digitada tecla por tecla no campo do terminal (Chromium com Playwright), seguida de um clique em **Resolver**. Depois o script leu o que apareceu na tela: método, raiz, "Outras candidatas detectadas" e mensagens de erro. Na v7 o `^` digitado vira expoente na hora, então o teste também passou pelo teclado novo.
4. **Critério de "certo".**
   - Equações com raiz: todas as raízes mostradas são raízes de verdade (diferença relativa ≤ 2·10⁻⁶ no valor exibido com 10 algarismos), nenhuma raiz real entre −40 e 40 ficou de fora e o critério de parada foi atingido.
   - Equações sem raiz na faixa: o terminal precisa recusar com mensagem, sem inventar raiz.
   - Sistemas: cada incógnita com diferença ≤ 10⁻⁷; os sem solução única precisam ser recusados.
   - Nenhum erro de JavaScript na página.

A faixa de busca padrão é [−40, 40]. Por isso `log(x) = 3`, cuja raiz é 1000, deve ser recusada com a sugestão de ajustar a faixa; é o comportamento esperado.

## O que falhou na v6 e por quê

| # | Equação | O que a v6 fez | Causa |
|---|---|---|---|
| 32 | `20x⁴ − 61x³ − 58x² + 225x − 126 = 0` | achou 3 de 4 raízes (perdeu 1,05) | As raízes 1 e 1,05 caem entre duas amostras (passo 0,1); não há troca de sinal visível. |
| 42 | `x²⁰ − 3x¹⁰ + 2 = 0` | achou só ±1 (perdeu ±1,0718) | Mesma causa; além disso a amostra x = 1 é raiz exata e a Bisseção parava nela. |
| 43 | `x¹⁰⁰ − 10000000000 = 0` | "Nenhuma raiz isolada foi validada" | Exigia \|f(x)\| ≤ 10⁻¹². Perto de 1,2589 os termos valem 10¹⁰ e o arredondamento já é de 10⁻⁶, então nenhum método passava. |
| 48 | `sin(x) = 0.8` | 18 de 26 raízes | Testava no máximo 36 candidatas, as mais perto de zero. |
| 50 | `tan(x) = 4 − x` | 13 de 27 raízes | Idem, e os polos da tangente gastavam candidatas. |
| 51 | `sin(x) + cos(x) = 1.3` | 18 de 26 raízes | Idem. |
| 52 | `x sin(x) = 4` | 18 de 22 raízes | Idem. |

Os testes extras com 1.400 equações mostraram mais dois problemas da mesma família:

- **Coeficientes grandes**: dois terços dos polinômios aleatórios ficavam incompletos ou sem resposta, porque o resíduo 10⁻¹² era inalcançável.
- **Raízes coladas na borda do domínio**: em `ln(x) = −2,81`, a raiz é 0,06 e a amostra em x = 0 não existe, então não havia troca de sinal para detectar.

## O que mudou no código (v6 → v7)

| Arquivo | Mudança |
|---|---|
| `dist/calculator.js` | **Novo.** Teclado científico, modo expoente e tradução entre a escrita bonita (x², e⁻ˣ, √) e a sintaxe do motor. |
| `dist/calculator.css` | **Novo.** Visual do teclado, claro e escuro, computador e celular. |
| `dist/index.html` | +2 linhas: carrega `calculator.css` e `calculator.js` (depois de `app.js`). |
| `dist/math-engine.js` | Só a função `smartRoot` foi reescrita; o resto do motor está idêntico. |
| `dist/app.js` | Texto da ajuda, texto da aba **Verificação** para raiz certificada, comentário do topo e "Versão 7" no rodapé. |
| `tests/verify.cjs` | +46 verificações no grupo "Terminal v7". |

### A busca automática (`smartRoot`) na v7

1. **Amostragem igual à v6:** 801 pontos na faixa escolhida.
2. **Refino local:** perto de cada mínimo de \|f\| (inclusive amostras que são raiz exata e pares de amostras empatadas), o intervalo é dividido em 64 partes para achar trocas de sinal escondidas. Isso resolve as raízes coladas.
3. **Borda do domínio:** quando f deixa de existir (ln, √, 1/x), o terminal se aproxima da fronteira em 4 níveis.
4. **Mais candidatas:** até 400, com as trocas de sinal primeiro (raiz garantida) e um teto de 400.000 avaliações de f.
5. **Raiz certificada por troca de sinal:** se nenhum método atinge \|f\| ≤ 10⁻¹² por causa do arredondamento, a Bisseção continua até a precisão da máquina. Se f troca de sinal num intervalo do tamanho de 2·10⁻¹⁶, existe raiz ali pelo Teorema do Valor Intermediário, e a aba **Verificação** explica isso.
6. **Proteção contra polos e saltos:** essa certificação só vale se \|f\| encolher pelo menos 1000 vezes. Assim `1/(x − a)`, `tan(x)` perto do polo e `abs(x)/x` continuam recusados.
7. **Raízes fantasmas:** a checagem da v6 contra raízes falsas foi mantida. Uma função minúscula em todo lugar, como `1e-15(x² + 1)`, continua sem raiz.

## Teclado científico

- **xⁿ** (ou o `^` do teclado do computador) liga o modo expoente: o que você digita sobe. `→`, espaço ou um operador (`+`, `−`, `=`, `×`) depois do expoente voltam ao normal. Um selo **EXPOENTE** aparece enquanto ele está ligado.
- **Teclas prontas:** x², x³, x⁻¹, √, eˣ, 10ˣ, sin, cos, tan, sin⁻¹, cos⁻¹, tan⁻¹, ln, log, \|x\|, π e e. Também há variáveis x, y, z, a tecla ↵ (nova equação, para sistemas), ⌫, C e as setas ← →.
- **O expoente elevado aceita** números, x, y, z, e, sinal, vírgula decimal, parênteses e barra (por exemplo, x¹ᐟ³). Um expoente que não dá para elevar, como `e^(sin x)`, fica escrito com `^`, para não mudar o sentido da conta.
- **Ajudas automáticas:** entre uma letra e uma função entra o ponto de multiplicação (`x·sin(x)`), porque o motor leria `xsin` como um nome só. `+` e `−` entre termos ganham espaços.
- **Status:** a linha embaixo do campo diz se a equação já está pronta ou qual é o erro.
- **Colar texto:** `x^2`, `sqrt(`, `pi`, `*` e `exp(x)` colados viram x², √(, π, · e eˣ.
- **No celular:** com o teclado científico aberto, o teclado do sistema não sobe. "Ocultar teclado" desliga isso, e a escolha fica salva no navegador.
- **Por dentro:** o motor recebe sempre a sintaxe antiga (`x^(20)`), então gráfico, verificação, passo a passo e exportação funcionam como antes.

### Os 19 cenários do teclado (clicando nas teclas)

| # | Cenário | Texto no campo | Resultado |
|---|---|---|---|
| 1 | x²⁰ só com teclas | `x²⁰ - 3x¹⁰ + 2 = 0` | ✓ |
| 2 | x² e x³ prontos | `x² - 5x + 6 = 0` | ✓ |
| 3 | xⁿ sem base insere x | `x³ - x - 2 = 0` | ✓ |
| 4 | eˣ com expoente negativo | `e⁻ˣ = x` | ✓ |
| 5 | 10ˣ | `10ˣ = 50` | ✓ |
| 6 | raiz quadrada | `√(x + 8) = x - 1` | ✓ |
| 7 | seno após x (insere ·) | `x·sin(x) = 4` | ✓ |
| 8 | π e decimal | `x·π = 1,5` | ✓ |
| 9 | expoente fracionário | `x¹ᐟ³ = 3` | ✓ |
| 10 | expoente com soma | `2ˣ⁺¹ = 32` | ✓ |
| 11 | inverso | `x⁻¹ + x = 3` | ✓ |
| 12 | ln e log | `ln(x) + log(x) = 2` | ✓ |
| 13 | módulo | `abs(x - 9) = 5` | ✓ |
| 14 | apagar dentro do expoente | `x²⁰ - 1 = 0` | ✓ |
| 15 | sistema com ↵ | `2x + y = 5 ; x + 3y = 6` | ✓ |
| 16 | teclado físico com ^ | `x³ - x - 2 = 0` | ✓ |
| 17 | teclado físico e^(sin(x)) (fallback) | `e^sin(x) = 2` | ✓ |
| 18 | arco seno e e | `asin(x) = e÷4` | ✓ |
| 19 | torre de potência | `2ˣ^2 = 16` | ✓ |

Todos foram resolvidos e conferidos com a raiz esperada. As capturas ficam em `previews/v7-terminal-*.png`.

## As 100 equações

"Como aparece na v7" é o texto que ficou no campo depois de digitar a equação tecla por tecla.

| Nº | Tipo | Digitado | Como aparece na v7 | Resposta certa | v6 | v7 |
|---|---|---|---|---|---|---|
| 1 | Linear | `-6x - 10 = 2` | `-6x - 10 = 2` | -2 | ✓ | ✓ |
| 2 | Linear | `7x + 11 = 25` | `7x + 11 = 25` | 2 | ✓ | ✓ |
| 3 | Linear | `-6x + 26 = -16` | `-6x + 26 = -16` | 7 | ✓ | ✓ |
| 4 | Linear | `8x - 4 = 20` | `8x - 4 = 20` | 3 | ✓ | ✓ |
| 5 | Linear | `9x + 5 = 23` | `9x + 5 = 23` | 2 | ✓ | ✓ |
| 6 | Linear | `6x + 18 = 19` | `6x + 18 = 19` | 0,1666666667 | ✓ | ✓ |
| 7 | Linear | `9x - 2 = -15` | `9x - 2 = -15` | -1,444444444 | ✓ | ✓ |
| 8 | Linear | `2,5x - 9 = -25` | `2,5x - 9 = -25` | -6,4 | ✓ | ✓ |
| 9 | Linear | `5(x - 2) = x + 30` | `5(x - 2) = x + 30` | 10 | ✓ | ✓ |
| 10 | Quadrática (raízes racionais) | `3x^2 + 63x + 324 = 0` | `3x² + 63x + 324 = 0` | -12; -9 | ✓ | ✓ |
| 11 | Quadrática (raízes racionais) | `6x^2 - 18x - 10.5 = 0` | `6x² - 18x - 10.5 = 0` | -0,5; 3,5 | ✓ | ✓ |
| 12 | Quadrática (raízes racionais) | `x^2 - 11x - 210 = 0` | `x² - 11x - 210 = 0` | -10; 21 | ✓ | ✓ |
| 13 | Quadrática (raízes racionais) | `3x^2 + 45x + 168 = 0` | `3x² + 45x + 168 = 0` | -8; -7 | ✓ | ✓ |
| 14 | Quadrática (raízes racionais) | `3x^2 + 42x + 72 = 0` | `3x² + 42x + 72 = 0` | -12; -2 | ✓ | ✓ |
| 15 | Quadrática (raízes racionais) | `4x^2 - 8x = 0` | `4x² - 8x = 0` | 0; 2 | ✓ | ✓ |
| 16 | Quadrática (raízes racionais) | `8x^2 + 116x - 504 = 0` | `8x² + 116x - 504 = 0` | -18; 3,5 | ✓ | ✓ |
| 17 | Quadrática (raízes racionais) | `4x^2 + 36x = 0` | `4x² + 36x = 0` | -9; 0 | ✓ | ✓ |
| 18 | Quadrática (raízes irracionais) | `5x^2 - 12x + 3 = 0` | `5x² - 12x + 3 = 0` | 0,283484861; 2,116515139 | ✓ | ✓ |
| 19 | Quadrática (raízes irracionais) | `2x^2 + 12x - 11 = 0` | `2x² + 12x - 11 = 0` | -6,807886553; 0,8078865529 | ✓ | ✓ |
| 20 | Quadrática (raízes irracionais) | `x^2 + 10x + 1 = 0` | `x² + 10x + 1 = 0` | -9,898979486; -0,1010205144 | ✓ | ✓ |
| 21 | Quadrática (raízes irracionais) | `x^2 + 10x + 4 = 0` | `x² + 10x + 4 = 0` | -9,582575695; -0,417424305 | ✓ | ✓ |
| 22 | Cúbica (3 raízes reais) | `x^3 + 4x^2 - 29x + 24 = 0` | `x³ + 4x² - 29x + 24 = 0` | -8; 1; 3 | ✓ | ✓ |
| 23 | Cúbica (3 raízes reais) | `x^3 + 11x^2 + 3x - 135 = 0` | `x³ + 11x² + 3x - 135 = 0` | -9; -5; 3 | ✓ | ✓ |
| 24 | Cúbica (3 raízes reais) | `x^3 - 20x^2 + 116x - 160 = 0` | `x³ - 20x² + 116x - 160 = 0` | 2; 8; 10 | ✓ | ✓ |
| 25 | Cúbica (3 raízes reais) | `x^3 - 22x^2 + 147x - 270 = 0` | `x³ - 22x² + 147x - 270 = 0` | 3; 9; 10 | ✓ | ✓ |
| 26 | Cúbica (3 raízes reais) | `x^3 - x^2 - 20x - 0.5 = 0` | `x³ - x² - 20x - 0.5 = 0` | -3,986040821; -0,0250321146; 5,011072936 | ✓ | ✓ |
| 27 | Cúbica (3 raízes reais) | `x^3 - 17x^2 + 92x - 160.8 = 0` | `x³ - 17x² + 92x - 160.8 = 0` | 4,319308105; 4,616454415; 8,064237479 | ✓ | ✓ |
| 28 | Cúbica (1 raiz real) | `x^3 - 5x^2 + 13x - 36 = 0` | `x³ - 5x² + 13x - 36 = 0` | 4 | ✓ | ✓ |
| 29 | Cúbica (1 raiz real) | `x^3 - 3x^2 + 9x - 7 = 0` | `x³ - 3x² + 9x - 7 = 0` | 1 | ✓ | ✓ |
| 30 | Cúbica (1 raiz real) | `x^3 + 6x - 18 = 0` | `x³ + 6x - 18 = 0` | 1,88452998 | ✓ | ✓ |
| 31 | Cúbica (1 raiz real) | `x^3 + 4x - 3 = 0` | `x³ + 4x - 3 = 0` | 0,6735930582 | ✓ | ✓ |
| 32 | Quártica / quíntica | `20x^4 - 61x^3 - 58x^2 + 225x - 126 = 0` | `20x⁴ - 61x³ - 58x² + 225x - 126 = 0` | -2; 1; 1,05; 3 | ⚠ incompleto: achou 3/4 | ✓ |
| 33 | Quártica / quíntica | `x^4 - 9x^2 + 14 = 0` | `x⁴ - 9x² + 14 = 0` | -2,645751311; -1,414213562; 1,414213562; 2,645751311 | ✓ | ✓ |
| 34 | Quártica / quíntica | `2x^5 - 13x^4 - 92x^3 + 397x^2 + 258x - 216 = 0` | `2x⁵ - 13x⁴ - 92x³ + 397x² + 258x - 216 = 0` | -6; -1; 0,5 … (5 raízes) | ✓ | ✓ |
| 35 | Quártica / quíntica | `x^4 - 10x^2 + 9 = 0` | `x⁴ - 10x² + 9 = 0` | -3; -1; 1; 3 | ✓ | ✓ |
| 36 | Quártica / quíntica | `x^5 - 4x^4 - 10x^3 + 26x^2 - 11x + 30 = 0` | `x⁵ - 4x⁴ - 10x³ + 26x² - 11x + 30 = 0` | -3; 2; 5 | ✓ | ✓ |
| 37 | Quártica / quíntica | `2x^5 - 10x^3 + 8x - 1 = 0` | `2x⁵ - 10x³ + 8x - 1 = 0` | -1,978190779; -1,078619746; 0,1275877397 … (5 raízes) | ✓ | ✓ |
| 38 | Potência alta | `x^5 = 32` | `x⁵ = 32` | 2 | ✓ | ✓ |
| 39 | Potência alta | `x^7 - 128 = 0` | `x⁷ - 128 = 0` | 2 | ✓ | ✓ |
| 40 | Potência alta | `x^10 = 1024` | `x¹⁰ = 1024` | -2; 2 | ✓ | ✓ |
| 41 | Potência alta | `x^8 - 3x^4 + 2 = 0` | `x⁸ - 3x⁴ + 2 = 0` | -1,189207115; -1; 1; 1,189207115 | ✓ | ✓ |
| 42 | Potência alta | `x^20 - 3x^10 + 2 = 0` | `x²⁰ - 3x¹⁰ + 2 = 0` | -1,071773463; -1; 1; 1,071773463 | ⚠ incompleto: achou 2/4 | ✓ |
| 43 | Potência alta | `x^100 - 10000000000 = 0` | `x¹⁰⁰ - 10000000000 = 0` | -1,258925412; 1,258925412 | ✗ "Nenhuma raiz isolada foi validada" | ✓ |
| 44 | Raiz múltipla / tangente | `(x - 2.8)^2 = 0` | `(x - 2.8)² = 0` | 2,8 | ✓ | ✓ |
| 45 | Raiz múltipla / tangente | `(x + 4)^3 = 0` | `(x + 4)³ = 0` | -4 | ✓ | ✓ |
| 46 | Raiz múltipla / tangente | `(x - 5)^4 = 0` | `(x - 5)⁴ = 0` | 5 | ✓ | ✓ |
| 47 | Raiz múltipla / tangente | `abs(x - 16) = 0` | `abs(x - 16) = 0` | 16 | ✓ | ✓ |
| 48 | Trigonométrica | `sin(x) = 0.8` | `sin(x) = 0.8` | -36,77181663; -35,48481441; -30,48863132 … (26 raízes) | ⚠ incompleto: achou 18/26 | ✓ |
| 49 | Trigonométrica | `cos(x) = x / 6` | `cos(x) = x / 6` | -3,985826207; -1,891519896; 1,344751045 | ✓ | ✓ |
| 50 | Trigonométrica | `tan(x) = 4 - x` | `tan(x) = 4 - x` | -39,29300248; -36,15321498; -33,01373329 … (27 raízes) | ⚠ incompleto: achou 13/27 | ✓ |
| 51 | Trigonométrica | `sin(x) + cos(x) = 1.3` | `sin(x) + cos(x) = 1.3` | -37,31836732; -36,50906004; -31,03518201 … (26 raízes) | ⚠ incompleto: achou 18/26 | ✓ |
| 52 | Trigonométrica | `x sin(x) = 4` | `x sin(x) = 4` | -37,80511604; -34,44111624; -31,54307959 … (22 raízes) | ⚠ incompleto: achou 18/22 | ✓ |
| 53 | Trigonométrica | `cos(4x) = x^2` | `cos(4x) = x²` | -0,3601757736; 0,3601757736 | ✓ | ✓ |
| 54 | Trigonométrica | `sen(x) = x/10` | `sen(x) = x/10` | -8,423203932; -7,068174358; -2,852341894 … (7 raízes) | ✓ | ✓ |
| 55 | Exponencial / logarítmica | `exp(x) = 4` | `eˣ = 4` | 1,386294361 | ✓ | ✓ |
| 56 | Exponencial / logarítmica | `ln(x) = 2.7` | `ln(x) = 2.7` | 14,87973172 | ✓ | ✓ |
| 57 | Exponencial / logarítmica | `2^x = 151` | `2ˣ = 151` | 7,238404739 | ✓ | ✓ |
| 58 | Exponencial / logarítmica | `x exp(x) = 6` | `x eˣ = 6` | 1,432404776 | ✓ | ✓ |
| 59 | Exponencial / logarítmica | `e^(-x) = x` | `e⁻ˣ = x` | 0,5671432904 | ✓ | ✓ |
| 60 | Exponencial / logarítmica | `ln(x) + x = 9` | `ln(x) + x = 9` | 7,047348547 | ✓ | ✓ |
| 61 | Exponencial / logarítmica | `log(x) = 1.5` | `log(x) = 1.5` | 31,6227766 | ✓ | ✓ |
| 62 | Raiz / módulo / fração | `sqrt(x) = 2` | `√(x) = 2` | 4 | ✓ | ✓ |
| 63 | Raiz / módulo / fração | `sqrt(x + 8) = x - 1` | `√(x + 8) = x - 1` | 4,541381265 | ✓ | ✓ |
| 64 | Raiz / módulo / fração | `abs(x - 9) = 5` | `abs(x - 9) = 5` | 4; 14 | ✓ | ✓ |
| 65 | Raiz / módulo / fração | `1/x + x = 6` | `1/x + x = 6` | 0,1715728753; 5,828427125 | ✓ | ✓ |
| 66 | Raiz / módulo / fração | `(x^2 - 4)/(x - 1) = 2` | `(x² - 4)/(x - 1) = 2` | -0,7320508076; 2,732050808 | ✓ | ✓ |
| 67 | Raiz / módulo / fração | `x^(1/3) = 3` | `x¹ᐟ³ = 3` | 27 | ✓ | ✓ |
| 68 | Sintaxe Unicode | `x² − 5x + 6 = 0` | `x² − 5x + 6 = 0` | 2; 3 | ✓ | ✓ |
| 69 | Sintaxe Unicode | `2·x³ = 54` | `2·x³ = 54` | 3 | ✓ | ✓ |
| 70 | Sintaxe Unicode | `3(x − 1) = 2x + 4` | `3(x − 1) = 2x + 4` | 7 | ✓ | ✓ |
| 71 | Sintaxe Unicode | `x² = 2,25` | `x² = 2,25` | -1,5; 1,5 | ✓ | ✓ |
| 72 | Sem solução na faixa | `x^2 + 1 = 0` | `x² + 1 = 0` | nenhuma raiz real em [−40, 40] | ✓ rejeitou | ✓ rejeitou |
| 73 | Sem solução na faixa | `1/x = 0` | `1/x = 0` | nenhuma raiz real em [−40, 40] | ✓ rejeitou | ✓ rejeitou |
| 74 | Sem solução na faixa | `exp(x) = 0` | `eˣ = 0` | nenhuma raiz real em [−40, 40] | ✓ rejeitou | ✓ rejeitou |
| 75 | Sem solução na faixa | `cos(x) = 2` | `cos(x) = 2` | nenhuma raiz real em [−40, 40] | ✓ rejeitou | ✓ rejeitou |
| 76 | Sem solução na faixa | `x^2 - 4x + 7 = 0` | `x² - 4x + 7 = 0` | nenhuma raiz real em [−40, 40] | ✓ rejeitou | ✓ rejeitou |
| 77 | Sem solução na faixa | `log(x) = 3` | `log(x) = 3` | nenhuma raiz real em [−40, 40] (a raiz 1000 fica fora da faixa) | ✓ rejeitou | ✓ rejeitou |
| 78 | Sistema 2×2 | `10x - 7y = -137 ; -x + 2y = 28` | `10x - 7y = -137 ; -x + 2y = 28` | x = -6, y = 11 | ✓ | ✓ |
| 79 | Sistema 2×2 | `4x - 5y = 20 ; 5x - 9y = 58` | `4x - 5y = 20 ; 5x - 9y = 58` | x = -10, y = -12 | ✓ | ✓ |
| 80 | Sistema 2×2 | `14x + 9y = -151 ; 8x + 10y = -130` | `14x + 9y = -151 ; 8x + 10y = -130` | x = -5, y = -9 | ✓ | ✓ |
| 81 | Sistema 2×2 | `-8x + 8y = -32 ; -x + 2y = -16` | `-8x + 8y = -32 ; -x + 2y = -16` | x = -8, y = -12 | ✓ | ✓ |
| 82 | Sistema 2×2 | `11x + 9y = -28 ; 9x + 14y = -3` | `11x + 9y = -28 ; 9x + 14y = -3` | x = -5, y = 3 | ✓ | ✓ |
| 83 | Sistema 2×2 | `9x - 5y = -47.5 ; 7x = -35` | `9x - 5y = -47.5 ; 7x = -35` | x = -5, y = 0,5 | ✓ | ✓ |
| 84 | Sistema 3×3 | `16x - 5y + 9z = -234 ; 8y + 4z = -40 ; 3x - 5y + 9z = -117` | `16x - 5y + 9z = -234 ; 8y + 4z = -40 ; 3x - 5y + 9z = -117` | x = -9, y = 0, z = -10 | ✓ | ✓ |
| 85 | Sistema 3×3 | `-8x + 2y + 2z = -38 ; -9x - 9y + 7z = -63 ; 6x + y = 10` | `-8x + 2y + 2z = -38 ; -9x - 9y + 7z = -63 ; 6x + y = 10` | x = 2, y = -2, z = -9 | ✓ | ✓ |
| 86 | Sistema 3×3 | `19x + 5y + 9z = 189 ; -4x + 16y + 9z = -27 ; 7x - 3y + 14z = 190` | `19x + 5y + 9z = 189 ; -4x + 16y + 9z = -27 ; 7x - 3y + 14z = 190` | x = 7, y = -5, z = 9 | ✓ | ✓ |
| 87 | Sistema 3×3 | `-7x + 8y + 3z = 106 ; -8x - 3y - 4z = -84 ; -8x + 8y - 8z = 16` | `-7x + 8y + 3z = 106 ; -8x - 3y - 4z = -84 ; -8x + 8y - 8z = 16` | x = 2, y = 12, z = 8 | ✓ | ✓ |
| 88 | Sistema 3×3 | `17x + 6y - 9z = 19 ; -5x + 12y - 3z = 26 ; 7x - 5y + 15z = -1.5` | `17x + 6y - 9z = 19 ; -5x + 12y - 3z = 26 ; 7x - 5y + 15z = -1.5` | x = 0,5, y = 2,5, z = 0,5 | ✓ | ✓ |
| 89 | Sistema 3×3 | `-7x + 3y = -81 ; -4x + 2y - 4z = -34 ; -x + 5y + 6z = -25` | `-7x + 3y = -81 ; -4x + 2y - 4z = -34 ; -x + 5y + 6z = -25` | x = 12, y = 1, z = -3 | ✓ | ✓ |
| 90 | Sistema 4×4 | `23x + 7y + 6z + 5u = -93 ; -6x + 16y + 7z - u = 52 ; -6x - 3y + 19z - 9u = 59 ; -7x + 5y + z + 16u = 193` | `23x + 7y + 6z + 5u = -93 ; -6x + 16y + 7z - u = 52 ; -6x - 3y + 19z - 9u = 59 ; -7x + 5y + z + 16u = 193` | x = -7, y = -1, z = 5, u = 9 | ✓ | ✓ |
| 91 | Sistema 4×4 | `8x1 - 3x2 - 6x3 - x4 = 74 ; 8x1 + 9x2 - 3x3 + 9x4 = 53 ; 9x2 - x3 + 8x4 = 18 ; -5x1 - 6x2 - x3 - 6x4 = -8` | `8x1 - 3x2 - 6x3 - x4 = 74 ; 8x1 + 9x2 - 3x3 + 9x4 = 53 ; 9x2 - x3 + 8x4 = 18 ; -5x1 - 6x2 - x3 - 6x4 = -8` | x1 = 1, x2 = -7, x3 = -9, x4 = 9 | ✓ | ✓ |
| 92 | Sistema 4×4 | `2x - 4y - 6z + 7u = -50 ; x - y + 9z - 7u = 109 ; y - 4z - u = 4 ; -x - 7y - 9z + 4u = -41` | `2x - 4y - 6z + 7u = -50 ; x - y + 9z - 7u = 109 ; y - 4z - u = 4 ; -x - 7y - 9z + 4u = -41` | x = 12, y = -4, z = 1, u = -12 | ✓ | ✓ |
| 93 | Sistema 5×5 | `22x - 9y - 6u - 6v = -198 ; 8x + 19y + 2z + u + 5v = 234 ; -8x + 3y + 22z - 3u + 5v = 118 ; 4x - 6y + 2z + 16u - v = -120 ; 3x + 2z - 8u + 14v = 93` | `22x - 9y - 6u - 6v = -198 ; 8x + 19y + 2z + u + 5v = 234 ; -8x + 3y + 22z - 3u + 5v = 118 ; 4x - 6y + 2z + 16u - v = -120 ; 3x + 2z - 8u + 14v = 93` | x = -3, y = 12, z = 1, u = -2, v = 6 | ✓ | ✓ |
| 94 | Sistema 5×5 | `8x1 + x2 - 3x3 + 8x4 - 8x5 = 245 ; -6x1 - 4x2 - 6x3 - 6x4 - 8x5 = 68 ; -5x1 + 7x2 + 2x3 - 9x5 = -22 ; 4x1 + 9x2 - 5x3 + 2x4 + 4x5 = -27 ; 3x1 + 3x2 - 2x3 + 4x4 - 2x5 = 70` | `8x1 + x2 - 3x3 + 8x4 - 8x5 = 245 ; -6x1 - 4x2 - 6x3 - 6x4 - 8x5 = 68 ; -5x1 + 7x2 + 2x3 - 9x5 = -22 ; 4x1 + 9x2 - 5x3 + 2x4 + 4x5 = -27 ; 3x1 + 3x2 - 2x3 + 4x4 - 2x5 = 70` | x1 = 12, x2 = -8, x3 = -7, x4 = 5, x5 = -12 | ✓ | ✓ |
| 95 | Sistema 6×6 | `24x1 + 8x2 + 3x3 - x4 - 5x5 - 2x6 = 80 ; -9x1 + 31x2 - x3 + 8x4 + 6x5 + 4x6 = 322 ; -x1 + x2 + 25x3 + 9x4 - 7x5 - 4x6 = 44 ; 8x1 - 8x2 + 7x3 + 33x4 + x5 + 7x6 = 197 ; x1 - 8x2 - 9x3 - 2x4 + 31x5 - 8x6 = -69 ; -2x1 + 7x2 - 5x3 + 3x4 + 2x5 + 22x6 = 261` | `24x1 + 8x2 + 3x3 - x4 - 5x5 - 2x6 = 80 ; -9x1 + 31x2 - x3 + 8x4 + 6x5 + 4x6 = 322 ; -x1 + x2 + 25x3 + 9x4 - 7x5 - 4x6 = 44 ; 8x1 - 8x2 + 7x3 + 33x4 + x5 + 7x6 = 197 ; x1 - 8x2 - 9x3 - 2x4 + 31x5 - 8x6 = -69 ; -2x1 + 7x2 - 5x3 + 3x4 + 2x5 + 22x6 = 261` | x1 = 2, x2 = 8, x3 = 2, x4 = 5, x5 = 3, x6 = 9 | ✓ | ✓ |
| 96 | Sistema 2×2 (matriz) | `9, 0 \| 72 ; -3, -4 \| -28` | `9, 0 \| 72 ; -3, -4 \| -28` | x1 = 8, x2 = 1 | ✓ | ✓ |
| 97 | Sistema 3×3 (matriz) | `-5, 6, -9 \| -36 ; 2, 7, 4 \| 7 ; -8, -4, -7 \| -7` | `-5, 6, -9 \| -36 ; 2, 7, 4 \| 7 ; -8, -4, -7 \| -7` | x1 = -3, x2 = -1, x3 = 5 | ✓ | ✓ |
| 98 | Sistema sem solução única | `x + y = 2 ; 2x + 2y = 4` | `x + y = 2 ; 2x + 2y = 4` | sem solução única | ✓ rejeitou | ✓ rejeitou |
| 99 | Sistema sem solução única | `x + y = 1 ; x + y = 3` | `x + y = 1 ; x + y = 3` | sem solução única | ✓ rejeitou | ✓ rejeitou |
| 100 | Sistema sem solução única | `x + y + z = 1 ; 2x + 2y + 2z = 5 ; x - y + z = 0` | `x + y + z = 1 ; 2x + 2y + 2z = 5 ; x - y + z = 0` | sem solução única | ✓ rejeitou | ✓ rejeitou |

Legenda: ✓ certo · ✓ rejeitou = recusou corretamente uma equação sem solução · ⚠ faltaram raízes · ✗ erro.

## Testes extras (1.400 equações direto no motor)

- **1.000 polinômios** (`fuzz/gerar-polinomios.py`, semente 99): graus 2 a 6, coeficientes de até ~3·10⁸. Cada raiz tem 25% de chance de cair a menos de 0,09 da anterior, e cerca de 30% dos polinômios de grau 3 ou mais trocam duas raízes reais por um par complexo. A referência vem de raízes exatas (`sympy`) dos coeficientes impressos.
  - v6: 333 completos, 501 incompletos e 166 "Nenhuma raiz".
  - v7: 1.000 completos, sem nenhuma raiz falsa.
- **400 transcendentes e armadilhas** (`fuzz/gerar-transcendentes.py`, semente 5): seno com reta, exponenciais, tangente com polos, `1/(x − a)`, salto `abs(x)/x`, `sqrt` e `ln` com borda, `x cos(x)`, raízes tangentes, funções quase nulas e `sin(x)/x`.
  - v6: 310 certas.
  - v7: 400 (398 pelo conferidor + 2 em que a referência errou, explicados no Resumo).

## Limites que continuam

- **Faixa limitada:** a busca automática olha só a faixa escolhida (padrão [−40, 40]). Não encontrar raiz não prova que ela não existe fora dali.
- **Raízes múltiplas:** têm precisão menor em x. Em `cos(x) = 1` (raízes duplas em 2πk), o erro em x fica perto de 10⁻⁶, apesar do resíduo minúsculo. Isso é próprio do problema, não do terminal.
- **Raízes dentro do arredondamento:** uma equação sem raiz real, mas tão perto de ter que a diferença some no arredondamento (ex.: `x² − 2.6x + 1.6900000000001`), pode aparecer com raiz. Nenhum método em ponto flutuante distingue esse caso.
- **Fonte dos expoentes:** a fonte da web (JetBrains Mono) só traz ¹²³⁴ no pacote do Google Fonts. Por isso todos os expoentes usam uma fonte monoespaçada do sistema (Menlo no Mac, Cascadia/Consolas no Windows), para ficarem com a mesma cara.
- **Navegadores testados:** só Chromium (computador 1280–1366 px e celular 390 px com toque, modos claro e escuro). Teste também no navegador e no aparelho da apresentação.

## Como repetir os testes

```bash
# 1) Suíte do projeto (só precisa de Node.js)
node tests/verify.cjs

# 2) Servir o site
cd dist && python3 -m http.server 8000      # deixe rodando em outro terminal

# 3) As 100 equações no navegador
cd tests/terminal
npm install                                  # instala o Playwright
npx playwright install chromium
node testar-terminal.mjs http://127.0.0.1:8000/index.html equacoes-100.json resultados/v7-digitado.json type
python3 conferir.py equacoes-100.json resultados/v7-digitado.json resultados/conferencia-v7.json -v

# 4) Os cenários do teclado (salva capturas em resultados/capturas)
node testar-teclado.mjs http://127.0.0.1:8000/index.html

# 5) Testes extras direto no motor
cd fuzz
node rodar-motor.cjs ../../../dist/math-engine.js polinomios-1000.json resultados-polinomios-v7.json
python3 conferir.py polinomios-1000.json resultados-polinomios-v7.json
node rodar-motor.cjs ../../../dist/math-engine.js transcendentes-400.json resultados-transcendentes-v7.json
python3 conferir.py transcendentes-400.json resultados-transcendentes-v7.json

# (opcional) recriar as listas: precisa de pip install sympy mpmath numpy
python3 ../gerar-equacoes.py ../equacoes-100.json
```

Os resultados das execuções deste relatório já estão em `tests/terminal/resultados/` (v6 e v7) e em `tests/terminal/fuzz/`.

## Repetição na v9

A v9 acrescentou a Falsa Posição à comparação automática e mudou o desempate (menos atualizações, sem contar os pontos iniciais, e depois o menor resíduo). Para garantir que nada piorou, tudo foi repetido com o motor da v9:

| Teste | v7 | v9 |
|---|---|---|
| 100 equações digitadas no Terminal (Chromium) | 100 / 100 | **100 / 100** (tempo médio 262 ms, máximo 918 ms) |
| 19 cenários do teclado científico | 19 / 19 | **19 / 19** |
| 1.000 polinômios no motor | 1.000 certos | **1.000 certos** |
| 400 equações transcendentes no motor | 398 + 2 erros da referência | **398 + os mesmos 2** |

Resultados em `tests/terminal/resultados/v9-digitado.json`, `conferencia-v9.txt`, `teclado-v9.json` e `fuzz/resultados-*-v9.json`. Os dois testes do navegador e os dois do motor também rodam no GitHub a cada push (`.github/workflows/testes.yml`); os scripts de conferência aceitam `--ci` para falhar quando algo diverge.

## Repetição na v10

A v10 passou a certificar cada raiz antes de aceitá-la (troca de sinal, raiz dupla provável ou quase-raiz rejeitada; ver LIMITES-NUMERICOS.md). Como isso mexe no critério de parada de todos os métodos, tudo foi repetido com o motor da v10:

| Teste | v9 | v10 |
|---|---|---|
| 100 equações digitadas no Terminal (Chromium) | 100 / 100 | **100 / 100** (tempo médio 171 ms, máximo 911 ms) |
| 19 cenários do teclado científico | 19 / 19 | **19 / 19** |
| 1.000 polinômios no motor | 1.000 certos | **1.000 certos** |
| 400 equações transcendentes no motor | 398 + 2 erros da referência | **398 + os mesmos 2** |

As 4 raízes múltiplas ou tangentes, as 6 equações sem solução na faixa e os 3 sistemas sem solução única do conjunto continuam com a resposta ou a mensagem certa. A conferência da raiz não entra na contagem de avaliações da comparação de métodos, então os custos mostrados no Terminal são os mesmos da v9.

Resultados em `tests/terminal/resultados/v10-digitado.json`, `conferencia-v10.txt`, `teclado-v10.json` e `fuzz/resultados-*-v10.json`.

## Repetição na v10.1

A v10.1 reorganizou o Terminal em volta do intervalo [a, b] (campos à vista, intervalo escrito junto da equação) e mudou um detalhe da busca automática: a checagem de "raiz fantasma" passou a valer só para resultados não certificados, para não descartar raízes duplas em faixas estreitas. Tudo foi repetido:

| Teste | v10 | v10.1 |
|---|---|---|
| 100 equações digitadas no Terminal (Chromium) | 100 / 100 | **100 / 100** (tempo médio 128 ms, máximo 930 ms) |
| 19 cenários do teclado científico | 19 / 19 | **19 / 19** |
| 1.000 polinômios no motor | 1.000 certos | **1.000 certos** |
| 400 equações transcendentes no motor | 398 + 2 erros da referência | **398 + os mesmos 2** |

O intervalo em si é testado em `tests/verify.cjs` (grupo "Intervalo no Terminal", 51 verificações) e nos fluxos do navegador.

As tabelas deste documento mostram, de propósito, o que foi digitado tecla por tecla (com ^) ao lado de como a equação apareceu na tela (com o expoente elevado).

Resultados em `tests/terminal/resultados/v10.1-digitado.json`, `conferencia-v10.1.txt`, `teclado-v10.1.json` e `fuzz/resultados-*-v10.1.json`.
