# Treino — 140 exercícios de diagnóstico e resolução

> Arquivo gerado por `tests/treino/gerar-treino-md.cjs` a partir de `dist/treino-data.js`. Não edite à mão.

> **v11:** a pedido da professora, o Ponto Fixo está escondido no site, então o Treino mostra 120 exercícios (renumerados de 1 a 120, sem dois métodos iguais seguidos). Os 20 do Ponto Fixo continuam no arquivo e neste documento, com a numeração original, e voltam ao site quando o método voltar.

A aba **Treino** (entre Jogos e Terminal) tem 140 problemas misturados, **20 para cada um dos sete métodos**. Em cada um, a pessoa:

1. **Diagnostica** qual dos sete métodos é o mais indicado, lendo as pistas do enunciado. Até o diagnóstico, a pergunta aparece **sem o nome do método**, para não entregar a resposta;
2. **Resolve** o que se pede (uma iteração, o número de iterações, a raiz ou a solução do sistema);
3. **Confere** no gabarito: resposta, por que aquele método, passo a passo, **gráfico de convergência** com os métodos lado a lado, **erros típicos** e por que os outros seis seriam piores.

## Novidades da v9

- **Falsa Posição e Ponto Fixo:** 20 exercícios novos de cada, em 40 contextos (finanças, termodinâmica, epidemiologia, órbitas, recursos humanos, clima…).
- **Pergunta sem o método** até o diagnóstico (antes, o texto da pergunta já dizia “faça 3 iterações da Bisseção”).
- **Dicas por erro típico:** 369 erros comuns previstos (uma iteração a menos, metade errada do intervalo, sinal trocado na fórmula, calculadora em graus, Jacobi no lugar de Gauss-Seidel, lado direito esquecido no escalonamento…). Se a resposta digitada bate com um deles, a tela explica exatamente o engano.
- **Gráfico de convergência no gabarito**, calculado pelo motor: erro por iteração em escala logarítmica, com a ordem observada de cada método.
- **Modo prova:** 5, 10 ou 15 questões sorteadas e misturadas, com cronômetro opcional, nota de 0 a 10 (0,4 pelo método e 0,6 pela resposta) e relatório para imprimir ou salvar em PDF.
- **Revisão espaçada dos diagnósticos:** cada diagnóstico errado (no Treino ou na prova) vai para o caderno de Revisão e volta depois de 1, 3, 7 e 14 dias.
- **Progresso da v8 preservado:** 84 exercícios não mudaram e trazem o progresso antigo; os que mudaram recomeçam.

## Como os exercícios foram feitos e conferidos

- **Gerador:** `tests/treino/gerar-treino.py` escreve `dist/treino-data.js` (reproduzível byte a byte).
- **Gabarito independente do site:** sympy (derivadas exatas e frações) e mpmath com 50 dígitos.
- **Conferência com o motor do site:** `node tests/treino/conferir-com-motor.cjs` refaz as 140 contas com o `math-engine.js`, confere que nenhum erro típico é aceito como certo e que o gráfico de convergência de cada gabarito mostra o método do exercício chegando à raiz certa.
- **Pela interface:** `node tests/verify.cjs` (grupo “Treino”) resolve os 140 exercícios digitando a resposta com vírgula, faz uma prova completa, testa a revisão, os erros típicos e a migração do progresso.
- **Ordem:** misturada com semente fixa, **nunca dois métodos iguais seguidos**; os 14 primeiros já trazem os 7 métodos e o primeiro é de nível 1. Sequência dos 30 primeiros: G FP S PF FP GS PF N GS PF S B GS FP B GS FP GS G N B FP PF N S GS PF B S B.

## Distribuição

| Método | Nível 1 | Nível 2 | Nível 3 | Total |
|---|---|---|---|---|
| Bisseção | 6 | 9 | 5 | 20 |
| Falsa Posição | 6 | 9 | 5 | 20 |
| Ponto Fixo | 6 | 9 | 5 | 20 |
| Newton-Raphson | 6 | 10 | 4 | 20 |
| Secante | 5 | 10 | 5 | 20 |
| Eliminação de Gauss | 7 | 8 | 5 | 20 |
| Gauss-Seidel | 5 | 10 | 5 | 20 |
| **Total** | 41 | 65 | 34 | **140** |

São 53 áreas: Administração, Aeronáutica, Agricultura, Astronomia, Biologia, Clima, Comércio, Computação, Controle, Ecologia, Economia, Eletrônica, Engenharia, Engenharia ambiental, Engenharia automotiva, Engenharia civil, Engenharia de tráfego, Engenharia elétrica, Engenharia mecânica, Engenharia química, Epidemiologia, Esportes, Estruturas, Farmacologia, Finanças, Finanças pessoais, Física, Física moderna, Geometria, Geotecnia, Hidráulica, Hidrologia, História da matemática, Instrumentação, Logística, Matemática, Medicina, Metalurgia, Meteorologia, Navegação, Nutrição, Óptica, Pesca, Processamento de imagem, Produção, Química, Recursos humanos, Redes de computadores, Robótica, Telecomunicações, Termodinâmica, Transferência de calor, Trânsito.

## As pistas que decidem o método

| Método | Pistas típicas no enunciado |
|---|---|
| Bisseção | **sinais opostos** nas pontas e exigência de **erro garantido de antemão** (cota (b − a)/2ⁿ); curva torta demais para a corda; Newton falha (ciclo, derivada nula, exponencial íngreme, bico, polo) |
| Falsa Posição | **sinais opostos** nas pontas e **curva quase reta** no intervalo; a raiz precisa **continuar cercada**, mas com menos avaliações que a Bisseção; sem derivada |
| Ponto Fixo | a equação **já vem na forma x = g(x)** (regra de atualização, modelo ano a ano, equilíbrio); **\|g′\| < 1** perto da raiz (contração); **um único chute**; sem derivada |
| Newton-Raphson | **derivada fácil**; **chute inicial bom**; muitas casas em poucas iterações (convergência quadrática); a iteração direta x = g(x) seria lenta |
| Secante | **derivada trabalhosa, cara ou indisponível** (planilha, simulador, ajuste de dados) e **dois palpites que não cercam a raiz** (mesmo sinal: Bisseção e Falsa Posição nem começam) |
| Eliminação de Gauss | **sistema pequeno** e **solução exata**; **sem dominância diagonal**; pivô nulo ou minúsculo |
| Gauss-Seidel | **dominância diagonal estrita**; **sistema grande ou esparso**; **boa aproximação inicial**; pede iterações |

## Lista completa com gabarito

Nos enunciados abaixo, as pistas aparecem em **negrito**. Na tela, elas só são marcadas depois do diagnóstico.

### 1. Soma e diferença
*Nível 1 · Matemática · id `ga12`*

Dois números somam 50 e diferem em 10. **Sistema 2×2 com resposta exata**; **a linha x + y = 50 tem 1 = 1, sem dominância estrita**.

x + y = 50 ; x − y = 10

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x e y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x e y?

**Gabarito:** Eliminação de Gauss — x ≈ 30, y ≈ 20. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (55; -5) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (20; 30) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 2. Velocidade de cruzeiro do drone
*Nível 2 · Aeronáutica · id `fp14`*

A potência que um drone gasta voando a v m/s é P(v) = 0,012v³ + 400/v watts. Com 120 W disponíveis, qual é a maior velocidade? **P(19) < 120 < P(21)**, **entre 19 e 21 m/s a curva de potência é quase reta** e **a velocidade tem de ficar na faixa medida no túnel de vento**.

f(x) = 0,012·x<sup>3</sup> + 400/x − 120

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [19; 21]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [19; 21]. Qual é x₂?

**Gabarito:** Falsa Posição — 20,29150569. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 20,24086477 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 20,5 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · -0,02815642 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 3. Fator de atrito de Colebrook
*Nível 3 · Hidráulica · id `sc03`*

O fator de atrito f de um tubo (ε/D = 0,0002, Re = 10⁵) satisfaz 1/√f = −2·log₁₀(ε/(3,7D) + 2,51/(Re·√f)). **Derivar essa expressão, com log e raiz, é trabalhoso e fácil de errar**, e **o diagrama de Moody dá os palpites 0,02 e 0,03, do mesmo lado da raiz**.

f(x) = 1/√(x) + 2·log(0,0002/3,7 + 2,51/(100000·√(x)))

**Pergunta (sem o método):** Com x₀ = 0,02 e x₁ = 0,03, encontre a raiz com 5 casas decimais.

**Depois do diagnóstico:** Com x₀ = 0,02 e x₁ = 0,03, itere a Secante até a variação ficar menor que 10<sup>−6</sup>. Qual é a raiz, com 5 casas decimais?

**Gabarito:** Secante — 0,0190054352 (tolerância 0,000006). Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

### 4. Lei de deslocamento de Wien
*Nível 2 · Física moderna · id `pf07`*

O pico da radiação de corpo negro sai de **x = 5(1 − e⁻ˣ), já na forma x = g(x)**. **g′(x) = 5e⁻ˣ ≈ 0,035 perto da raiz: cada iteração ganha mais de uma casa**, e **x₀ = 5 é o chute natural**. Você quer seis casas decimais.

x = 5·(1 − e<sup>−x</sup>)

**Pergunta (sem o método):** Partindo de x₀ = 5, encontre a solução com 6 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 5, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−7</sup>. Qual é o ponto fixo, com 6 casas decimais?

**Gabarito:** Ponto Fixo — 4,965114232 (tolerância 6e-7). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 4,965155931 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 5. x³ + x = 5
*Nível 1 · Matemática · id `fp06`*

Para x³ + x = 5, **f(1) = −3 e f(2) = 5**; **em [1; 2] a curva é suave, sem mudança de concavidade**, e o exercício pede **a raiz sempre cercada, sem derivadas**.

f(x) = x<sup>3</sup> + x − 5

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [1; 2]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [1; 2]. Qual é x₂?

**Gabarito:** Falsa Posição — 1,481361426. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 1,375 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 1,507736149 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,75 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 1,146197007 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 1,569732938 → Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada. · -0,2678921375 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 6. Molas em série
*Nível 2 · Estruturas · id `gs07`*

Três massas ligadas por molas iguais geram **uma matriz tridiagonal com 3 na diagonal e −1 ao lado: dominante**. O simulador de estruturas **resolve sistemas assim, com milhares de massas, de forma iterativa**.

3x − y = 3 ; −x + 3y − z = 5 ; −y + 3z = 3

**Pergunta (sem o método):** Partindo de (0; 0; 0), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (0; 0; 0), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 1,666666667, y ≈ 2,777777778, z ≈ 1,925925926. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (1,555555556; 2,333333333; 1,555555556) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1; 2; 1,666666667) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (1,925925926; 2,950617284; 1,983539095) → Esse é o resultado de uma iteração a mais do que o pedido.

### 7. Duopólio de Cournot
*Nível 2 · Economia · id `pf13`*

Duas empresas iguais ajustam a produção ao que a outra fez no mês anterior: q ← 45 − q/2 (melhor resposta). **O equilíbrio é o q que se repete: q = g(q)**, e **|g′| = 0,5 < 1: o ajuste converge**. No primeiro mês, **q₀ = 0**.

x = 45 − x/2

**Pergunta (sem o método):** Partindo de x₀ = 0, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 0, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 33,75. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 22,5 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 28,125 → Esse é o resultado de uma iteração a mais do que o pedido. · 5,625 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 8. Produção de lucro máximo
*Nível 2 · Economia · id `nw04`*

O lucro é L(x) = 60x − 2x² − 10e<sup>0,1x</sup>. O ponto ótimo zera L′(x) = 60 − 4x − e<sup>0,1x</sup>. **A derivada de L′ também é simples: L″(x) = −4 − 0,1·e<sup>0,1x</sup>** e **a gerente estima x₀ = 10 mil unidades**.

f(x) = 60 − 4·x − e<sup>0,1·x</sup>

**Pergunta (sem o método):** Partindo de x₀ = 10, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 10, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 13,98748509. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 14,04550872 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · -2,264841132 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · -6,8443·10<sup>−5</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 9. Reordenar para convergir
*Nível 3 · Matemática · id `gs08`*

O sistema chegou como x + 5y = 6 e 4x + y = 5. **Trocando as equações de lugar, a matriz fica diagonal dominante (4 > 1, 5 > 1)**, e o problema real **tem milhares de equações desse tipo**. Use a ordem 4x + y = 5; x + 5y = 6.

4x + y = 5 ; x + 5y = 6

**Pergunta (sem o método):** Partindo de (0; 0), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (0; 0), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 1,0125, y ≈ 0,9975. Depois de reordenar, a dominância diagonal garante a convergência do Gauss-Seidel, a opção natural para sistemas grandes desse tipo.

**Erros típicos reconhecidos:** (0,95; 0,95) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1,25; 0,95) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (1,000625; 0,999875) → Esse é o resultado de uma iteração a mais do que o pedido.

### 10. Modelo da teia de preços
*Nível 2 · Economia · id `pf09`*

Agricultores decidem o plantio pelo preço do ano anterior, e o preço segue pₜ₊₁ = 40 − 0,75pₜ. **A regra do mercado já é p = g(p)**, e **|g′| = 0,75 < 1: os preços oscilam, mas se acalmam**. Começando em **p₀ = 30**. (O diagrama em teia do Ponto Fixo ganhou esse nome justamente aqui.)

x = 40 − 0,75·x

**Pergunta (sem o método):** Partindo de x₀ = 30, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 30, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 19,84375. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 26,875 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 25,1171875 → Esse é o resultado de uma iteração a mais do que o pedido. · -5,2734375 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 11. Velocidade máxima do carro
*Nível 2 · Engenharia automotiva · id `sc19`*

Um carro com 60 kW de potência enfrenta arrasto e rolamento: 0,396v³ + 176,58v = 60000 (v em m/s). **O simulador de dinâmica só devolve a potência exigida em cada velocidade**, e **as velocidades 60 e 55 m/s, testadas antes, pediram mais potência do que o motor tem**.

f(x) = 0,396·x<sup>3</sup> + 176,58·x − 60000

**Pergunta (sem o método):** Com x₀ = 60 e x₁ = 55, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 60 e x₁ = 55, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 50,57906891. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 51,2023726 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 66,47097637 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 171,0815935 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 12. Raiz cúbica de 7
*Nível 1 · Matemática · id `bi15`*

Para obter ∛7 resolvendo x³ − 7 = 0, note que **1³ < 7 < 2³: há troca de sinal em [1; 2]**. O enunciado pede **quatro casas garantidas (erro ≤ 0,0001)**.

f(x) = x<sup>3</sup> − 7

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [1; 2], quantas iterações garantem erro ≤ 0,0001?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [1; 2] garantem erro ≤ 0,0001?

**Gabarito:** Bisseção — 14. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 4 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 13. Barra aquecida
*Nível 2 · Transferência de calor · id `gs15`*

Os pontos internos de uma barra aquecida formam **uma matriz tridiagonal com 3 na diagonal: dominante**. Em simulações reais, a barra tem **milhares de pontos**.

3x − y = 20 ; −x + 3y − z = 10 ; −y + 3z − u = 10 ; −z + 3u = 40

**Pergunta (sem o método):** Partindo de (0; 0; 0; 0), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0; 0; 0; 0), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 6,666666667, y ≈ 5,555555556, z ≈ 5,185185185, u ≈ 15,0617284. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (6,666666667; 3,333333333; 3,333333333; 13,33333333) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (8,518518519; 7,901234568; 10,98765432; 16,99588477) → Esse é o resultado de uma iteração a mais do que o pedido.

### 14. Uma hora por simulação
*Nível 3 · Hidráulica · id `fp19`*

Um software de redes hidráulicas leva uma hora por simulação. A perda de carga para a vazão Q (L/s) é 0,0004Q<sup>1,85</sup> + 10⁻⁶Q³ metros e precisa valer 15 m. **Q = 150 dá perda menor e Q = 250 dá maior**, **a curva é suave** e **cada avaliação custa uma hora de simulação**.

f(x) = 0,0004·x<sup>1,85</sup> + 0,000001·x<sup>3</sup> − 15

**Pergunta (sem o método):** Com o método mais indicado em [150; 250], quantas iterações são necessárias até |f(xₖ)| ≤ 0,0001?

**Depois do diagnóstico:** Com a Falsa Posição em [150; 250], quantas iterações são necessárias até |f(xₖ)| ≤ 0,0001?

**Gabarito:** Falsa Posição — 7. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 17 → 17 é a contagem da Bisseção para o mesmo critério. A corda chega lá em menos passos: refaça com x = (a·f(b) − b·f(a))/(f(b) − f(a)).

### 15. Custo com um “bico”
*Nível 2 · Logística · id `bi12`*

O custo de entrega envolve a distância ao depósito em x = 1,2 km: f(x) = |x − 1,2| + x/3 − 1. **O módulo cria um bico em x = 1,2, onde a derivada não existe**, e **f(1) < 0 < f(3)**. A planilha de custos exige **o erro máximo declarado antes do cálculo**.

f(x) = |x − 1,2| + x/3 − 1

**Pergunta (sem o método):** Faça 4 iterações do método mais indicado no intervalo [1; 3]. Qual é a aproximação obtida na iteração 4?

**Depois do diagnóstico:** Faça 4 iterações da Bisseção em [1; 3]. Qual é o ponto médio m₄?

**Gabarito:** Bisseção — 1,625. Newton depende de f′, que não existe no bico do módulo. A Bisseção só precisa de continuidade e troca de sinal, e é a única que garante o erro antes de começar.

**Erros típicos reconhecidos:** 1,75 → Esse é o ponto médio da iteração anterior (m₃). A 1ª iteração já produz m₁. · 1,6875 → Esse é o resultado de uma iteração a mais do que o pedido. · 2,125 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 1,65 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · -0,0333333333 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 16. Dominância em 3×3
*Nível 1 · Matemática · id `gs09`*

O sistema é **estritamente diagonal dominante (5 > 2, 6 > 3, 7 > 3)** e **basta uma aproximação, iteração por iteração**.

5x + y + z = 10 ; x + 6y + 2z = 19 ; 2x + y + 7z = 25

**Pergunta (sem o método):** Partindo de (0; 0; 0), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0; 0; 0), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 2, y ≈ 2,833333333, z ≈ 2,595238095. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (2; 3,166666667; 3,571428571) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (0,9142857143; 2,149206349; 3,003174603) → Esse é o resultado de uma iteração a mais do que o pedido.

### 17. Taxa da poupança programada
*Nível 2 · Finanças pessoais · id `fp08`*

Depositando R$ 200 por mês durante 24 meses, você quer juntar R$ 5.300. Qual taxa mensal faz isso? **Com 0,2% ao mês falta dinheiro e com 1% sobra**, **o montante cresce de forma quase linear com a taxa nessa faixa** e o banco exige **a taxa sempre dentro da faixa do contrato**.

f(x) = 200·((1 + x)<sup>24</sup> − 1)/x − 5300

**Pergunta (sem o método):** Encontre a raiz em [0,002; 0,01] com 6 casas decimais, mantendo-a sempre cercada. Qual é ela?

**Depois do diagnóstico:** Use a Falsa Posição em [0,002; 0,01] até |f(xₖ)| ≤ 0,001. Qual é a raiz, com 6 casas decimais?

**Gabarito:** Falsa Posição — 0,0085032361 (tolerância 6e-7). Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 0,0084304706 → Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.

### 18. Reservatórios interligados
*Nível 2 · Hidrologia · id `gs11`*

Três reservatórios trocam água e o equilíbrio dos níveis forma **um sistema diagonal dominante**. **A medição da semana passada (2, 2, 2) serve de partida**.

6x − 2y − z = 6 ; −2x + 7y − 2z = 9 ; −x − 2y + 5z = 4

**Pergunta (sem o método):** Partindo de (2; 2; 2), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (2; 2; 2), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 2,171428571, y ≈ 2,526530612, z ≈ 2,244897959. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (2,142857143; 2,428571429; 2,171428571) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (2; 2,428571429; 2,171428571) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (2,216326531; 2,560349854; 2,267405248) → Esse é o resultado de uma iteração a mais do que o pedido.

### 19. Pivô minúsculo
*Nível 3 · Matemática · id `ga17`*

Resolva 0,0001x + y = 1 e x + y = 2. **O primeiro pivô é 0,0001: sem trocar as linhas (pivotamento parcial), o arredondamento estraga a resposta**, e **Gauss-Seidel nessa ordem diverge (0,0001 < 1)**.

0,0001x + y = 1 ; x + y = 2

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x e y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x e y?

**Gabarito:** Eliminação de Gauss — x ≈ 1,00010001, y ≈ 0,99989999. Pivô minúsculo pede Gauss com pivotamento parcial. Gauss-Seidel, com 0,0001 na diagonal, divergiria.

### 20. Ângulo de pressão da engrenagem
*Nível 2 · Engenharia mecânica · id `nw19`*

No projeto de engrenagens, inv(α) = tan(α) − α precisa valer 0,05. **A derivada é tan²(α), já que sec² − 1 = tan²** e **α₀ = 0,5 rad vem da tabela do fabricante**.

f(x) = tan(x) − x − 0,05

**Pergunta (sem o método):** Partindo de x₀ = 0,5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 0,5, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 0,5120400999. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 0,4616983556 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 9,0203·10<sup>−8</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · -0,0508881663 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 21. Máximos da difração
*Nível 1 · Física · id `bi09`*

Os máximos secundários de uma fenda satisfazem tan(x) = x. **A tangente tem um polo em 3π/2 ≈ 4,71, e o intervalo [4,4; 4,6] fica antes dele**. Como **f(4,4) < 0 < f(4,6)**, você quer um método que **não pule para o outro lado do polo**. **Perto do polo a curva sobe muito rápido: uma corda cortaria sempre do mesmo lado e andaria devagar**.

f(x) = tan(x) − x

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [4,4; 4,6]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [4,4; 4,6]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — 4,475. Perto de um polo, Newton e Secante podem saltar para outro ramo da tangente, e a Falsa Posição andaria devagar com uma ponta parada. A Bisseção fica no intervalo seguro e corta sempre pela metade.

**Erros típicos reconhecidos:** 4,45 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · 4,4875 → Esse é o resultado de uma iteração a mais do que o pedido. · 4,525 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · -0,341933096 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 22. TIR de um projeto
*Nível 1 · Finanças · id `fp02`*

Um projeto custa R$ 5.000 e devolve R$ 2.000 por ano durante 3 anos. A TIR é a taxa que zera o VPL. **Com 5% o VPL é positivo e com 15% é negativo**, **nessa faixa o VPL é quase linear na taxa** e **a planilha só devolve o VPL de cada taxa, sem derivada**.

f(x) = −5000 + 2000/(1 + x) + 2000/(1 + x)<sup>2</sup> + 2000/(1 + x)<sup>3</sup>

**Pergunta (sem o método):** Faça 1 iteração do método mais indicado no intervalo [0,05; 0,15]. Qual é a aproximação obtida na iteração 1?

**Depois do diagnóstico:** Faça 1 iteração da Falsa Posição em [0,05; 0,15]. Qual é x₁?

**Gabarito:** Falsa Posição — 0,1007355465. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 0,0972704708 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,1 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,0992644535 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · -32,72958005 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 23. A órbita de Marte
*Nível 2 · Astronomia · id `pf11`*

Para Marte (excentricidade e = 0,093), com anomalia média M = 2 rad, a equação de Kepler é **E = 2 + 0,093·sen(E)**. **Com órbita quase circular, |g′| ≤ 0,093: contração fortíssima**, e o chute clássico é **E₀ = M = 2**.

x = 2 + 0,093·sin(x)

**Pergunta (sem o método):** Partindo de x₀ = 2, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 2, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 2,081156282. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 7,3905·10<sup>−6</sup> → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ. · 2,003250927 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 24. O exemplo do próprio Newton
*Nível 2 · História da matemática · id `nw07`*

Em 1669, Newton ilustrou seu método com x³ − 2x − 5 = 0. **f′(x) = 3x² − 2 é imediata** e **x₀ = 2 está a um passo da raiz, pois f(2) = −1**.

f(x) = x<sup>3</sup> − 2·x − 5

**Pergunta (sem o método):** Partindo de x₀ = 2, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 2, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 2,094568121. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 2,1 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 1,6801812 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,0001857232 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 25. Flecha do cabo suspenso
*Nível 2 · Engenharia civil · id `sc05`*

Um cabo vence um vão de 100 m com flecha de 10 m e satisfaz a·cosh(50/a) − a = 10. **A derivada envolve cosh, senh e regra da cadeia: trabalhosa** e o projetista **já testou a = 130 e a = 140, e os dois deram flecha menor que 10 m**.

f(x) = x·cosh(50/x) − x − 10

**Pergunta (sem o método):** Com x₀ = 130 e x₁ = 140, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 130 e x₁ = 140, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 126,263894. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 126,6727821 → Esse é o resultado de uma iteração a mais do que o pedido. · 153,736106 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,0299480226 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 26. Dominância com sinais
*Nível 1 · Matemática · id `gs14`*

O sistema é **diagonal dominante (8 > 2, 7 > 3, 9 > 3)**; **aproxime a solução iterativamente**.

8x + y − z = 8 ; x − 7y + 2z = −4 ; 2x + y + 9z = 12

**Pergunta (sem o método):** Partindo de (0; 0; 0), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0; 0; 0), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 1, y ≈ 0,7142857143, z ≈ 1,031746032. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (1; 0,5714285714; 1,333333333) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1,03968254; 1,014739229; 0,9895439657) → Esse é o resultado de uma iteração a mais do que o pedido.

### 27. Reescrevendo a cúbica
*Nível 1 · Matemática · id `pf02`*

Para x³ − x − 2 = 0, a forma **x = ∛(x + 2)** tem **|g′(x)| ≈ 0,14 perto da raiz: contração forte**. Comece em **x₀ = 1,5**.

x = (x + 2)<sup>1/3</sup>

**Pergunta (sem o método):** Partindo de x₀ = 1,5, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 1,5, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 1,521315698. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** -5,4790·10<sup>−5</sup> → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 28. Diodo com exponencial íngreme
*Nível 3 · Eletrônica · id `bi05`*

No circuito do diodo, a tensão V satisfaz 10⁻⁹(e<sup>40V</sup> − 1) + V/100 = 0,05. **A exponencial é tão íngreme que, com V₀ = 0, o Newton salta para V = 5**, onde e²⁰⁰ explode. Por outro lado, **f(0) < 0 e f(1) > 0**, e **a curva fica quase plana e depois dispara: uma corda entre as pontas cortaria sempre do mesmo lado**.

f(x) = 0,000000001·(e<sup>40·x</sup> − 1) + x/100 − 0,05

**Pergunta (sem o método):** Faça 4 iterações do método mais indicado no intervalo [0; 1]. Qual é a aproximação obtida na iteração 4?

**Depois do diagnóstico:** Faça 4 iterações da Bisseção em [0; 1]. Qual é o ponto médio m₄?

**Gabarito:** Bisseção — 0,4375. Newton é instável por causa da exponencial, e a Falsa Posição ficaria presa numa ponta nessa curva tão torta. Com um intervalo de sinais opostos, a Bisseção avança com segurança e ritmo garantido.

**Erros típicos reconhecidos:** 0,375 → Esse é o ponto médio da iteração anterior (m₃). A 1ª iteração já produz m₁. · 0,46875 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,5625 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 8,4967·10<sup>−10</sup> → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · -0,0058002166 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 29. x·eˣ = 2
*Nível 1 · Matemática · id `sc06`*

Para x·eˣ = 2, **a regra do produto não é bem-vinda agora** e você tem **os palpites 1 e 1,2, ambos acima da raiz**.

f(x) = x·e<sup>x</sup> − 2

**Pergunta (sem o método):** Com x₀ = 1 e x₁ = 1,2, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 1 e x₁ = 1,2, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 0,8606426945. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 0,8865146712 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,8528125366 → Esse é o resultado de uma iteração a mais do que o pedido. · 2,042126654 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,856239246 → Você manteve x₀ fixo em todas as iterações. Na Secante, os dois pontos mais recentes substituem os anteriores. · 0,0351445429 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 30. O Newton que ficou girando
*Nível 3 · Matemática · id `bi06`*

Um colega tentou resolver x³ − 2x + 2 = 0 com Newton a partir de x₀ = 0 e **ficou preso no ciclo 0 → 1 → 0 → 1…**. Você observa que **f(−2) = −2 < 0 e f(−1) = 3 > 0**, e o relatório precisa **informar o erro máximo depois de 3 passos**.

f(x) = x<sup>3</sup> − 2·x + 2

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [−2; −1]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [−2; −1]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — -1,875. Quando o Newton cicla ou diverge, a saída robusta é a Bisseção num intervalo com troca de sinal: ela converge sempre, ainda que devagar.

**Erros típicos reconhecidos:** -1,75 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · -1,8125 → Esse é o resultado de uma iteração a mais do que o pedido. · -1,375 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · -1,765259153 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · -0,841796875 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 31. Distância entre polias
*Nível 3 · Engenharia mecânica · id `fp16`*

Uma correia de 3 m abraça duas polias de raios 0,25 m e 0,15 m. A distância D entre os centros satisfaz 2√(D² − 0,1²) + π(0,25 + 0,15) + 2·0,1·arcsen(0,1/D) = 3. **D = 0,8 m deixa a correia sobrando e D = 1,2 m faltando**, e **essa função de D é quase reta**. O desenho técnico pede **seis casas, com a raiz sempre dentro da faixa de montagem**.

f(x) = 2·√(x<sup>2</sup> − 0,01) + 0,4·π + 0,2·arcsen(0,1/x) − 3

**Pergunta (sem o método):** Encontre a raiz em [0,8; 1,2] com 6 casas decimais, mantendo-a sempre cercada. Qual é ela?

**Depois do diagnóstico:** Use a Falsa Posição em [0,8; 1,2] até |f(xₖ)| ≤ 1·10<sup>−9</sup>. Qual é a raiz, com 6 casas decimais?

**Gabarito:** Falsa Posição — 0,8659006914 (tolerância 6e-7). Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** -0,8886037035 → Essa é outra raiz da mesma equação. O problema pede a raiz no intervalo dado (ou a que tem sentido físico, perto do chute). · 0,8657667752 → Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.

### 32. cos(x) = x³
*Nível 1 · Matemática · id `sc02`*

Para cos(x) = x³, **você não quer derivar** e já leu do gráfico **dois palpites à esquerda da raiz, 0,5 e 0,6, com f positiva nos dois**.

f(x) = cos(x) − x<sup>3</sup>

**Pergunta (sem o método):** Com x₀ = 0,5 e x₁ = 0,6, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 0,5 e x₁ = 0,6, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 0,8217949944. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 1,025374242 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,8592041497 → Esse é o resultado de uma iteração a mais do que o pedido. · -0,9510294961 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,8013913168 → Você manteve x₀ fixo em todas as iterações. Na Secante, os dois pontos mais recentes substituem os anteriores. · 0,1259109116 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · 0,8324480472 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 33. Correntes num circuito
*Nível 2 · Engenharia elétrica · id `ga03`*

Num circuito, x, y e z são correntes (A). A lei dos nós dá x − y − z = 0 e as malhas dão 2x + 4y = 20 e 4y − 12z = 0. **A primeira equação não é diagonal dominante: 1 < 1 + 1** e **são só 3 incógnitas: o engenheiro quer o valor exato**.

x − y − z = 0 ; 2x + 4y = 20 ; 4y − 12z = 0

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 4, y ≈ 3, z ≈ 1. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (3,333333333; 3,333333333; 0) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (5; 7,5; -2,5) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (1; 3; 4) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 34. A tarde passa dos 20 °C
*Nível 2 · Meteorologia · id `bi14`*

A temperatura do dia segue T(t) = 15 + 8·sen(π(t − 9)/12), com t em horas. **Entre 9 h e 15 h ela só sobe, com T(9) − 20 < 0 < T(15) − 20**. O meteorologista quer **garantir em que intervalo de horário isso acontece, com precisão conhecida de antemão: 6 h/2³ depois de 3 passos**.

f(x) = 15 + 8·sin(π·(x − 9)/12) − 20

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [9; 15]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [9; 15]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — 11,25. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 10,5 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · 11,625 → Esse é o resultado de uma iteração a mais do que o pedido. · 12,75 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · -0,5554381358 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 35. Raiz quarta de 3
*Nível 1 · Matemática · id `nw18`*

Calcule ⁴√3 por x⁴ − 3 = 0. **f′(x) = 4x³** e **1,3⁴ ≈ 2,86 deixa x₀ = 1,3 bem perto**.

f(x) = x<sup>4</sup> − 3

**Pergunta (sem o método):** Partindo de x₀ = 1,3, faça 1 iteração do método mais indicado. Qual é x₁?

**Depois do diagnóstico:** Partindo de x₀ = 1,3, faça 1 iteração de Newton-Raphson. Qual é x₁?

**Gabarito:** Newton-Raphson — 1,316374602. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 1,283625398 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,0027417161 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 36. Rede com quatro nós
*Nível 3 · Engenharia elétrica · id `ga20`*

Uma pequena rede tem quatro tensões desconhecidas (x, y, z e u) com um gerador controlado que quebra a simetria. **A matriz não é diagonal dominante (e nem simétrica)** e **é pequena: 4×4**.

x + 2y − z + u = −2 ; 2x − y + z + 3u = 11 ; x + y + z − 2u = 2 ; −x + 3y + 2z + u = 2

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y, z e u?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y, z e u?

**Gabarito:** Eliminação de Gauss — x ≈ 2, y ≈ -1, z ≈ 3, u ≈ 1. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (1,808403361; -1,084033613; 1,805042017; 0,1647058824) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-3,975308642; -0,4567901235; -1,518518519; 1,37037037) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (1; 3; -1; 2) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 37. Taxa interna de retorno
*Nível 2 · Finanças · id `sc01`*

Um investimento de R$ 1.000 rende R$ 300, R$ 400 e R$ 500 nos próximos três anos. A TIR zera o VPL. **A planilha do banco só devolve o VPL de cada taxa testada; não há fórmula da derivada** e **as taxas 10% e 12% já foram testadas, e as duas deram VPL negativo**.

f(x) = −1000 + 300/(1 + x) + 400/(1 + x)<sup>2</sup> + 500/(1 + x)<sup>3</sup>

**Pergunta (sem o método):** Com x₀ = 0,1 e x₁ = 0,12, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 0,1 e x₁ = 0,12, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 0,0884217065. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 0,0889899276 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,1515782935 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 1,051329021 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 38. x = 2 + ln(x)
*Nível 1 · Matemática · id `pf04`*

A equação x − ln(x) = 2 pode ser lida como **x = 2 + ln(x)**; como **g′(x) = 1/x ≈ 0,32 perto da raiz**, basta repetir a partir de **x₀ = 3**.

x = 2 + ln(x)

**Pergunta (sem o método):** Partindo de x₀ = 3, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 3, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 3,141337866. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 3,130954362 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · -0,003310915 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 39. Temperaturas numa placa
*Nível 2 · Transferência de calor · id `gs02`*

Numa placa com bordas a 100 °C (topo), 75 °C (esquerda), 50 °C (direita) e 0 °C (base), os quatro pontos internos satisfazem a média dos vizinhos. **Cada linha tem 4 na diagonal e soma 2 fora dela: dominância diagonal**, e **a média das bordas (≈ 56 °C) é um bom chute inicial**. Na malha real são **milhares de pontos**.

4x − y − z = 175 ; −x + 4y − u = 150 ; −x + 4z − u = 75 ; −y − z + 4u = 50

**Pergunta (sem o método):** Partindo de (56; 56; 56; 56), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (56; 56; 56; 56), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 71,75, y ≈ 69,4375, z ≈ 50,6875, u ≈ 42,53125. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (71,75; 65,5; 46,75; 40,5) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (73,78125; 66,578125; 47,828125; 41,1015625) → Esse é o resultado de uma iteração a mais do que o pedido.

### 40. Mercado de energia
*Nível 1 · Economia · id `fp03`*

A oferta de energia de uma região segue O(p) = 50·ln(1 + p/10) e a demanda, D(p) = 120 − 0,8p. **O excesso de oferta é negativo em p = 20 e positivo em p = 60**, **as duas curvas são suaves nessa faixa e a diferença é quase uma reta**, e o operador quer **o preço sempre dentro da faixa regulada [20; 60]**.

f(x) = 50·ln(1 + x/10) − 120 + 0,8·x

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [20; 60]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [20; 60]. Qual é x₂?

**Gabarito:** Falsa Posição — 44,58801737. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 46,3938445 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 44,32435772 → Esse é o resultado de uma iteração a mais do que o pedido. · 50 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 48,51564319 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 44,13333985 → Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada. · 0,5318790833 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 41. Mistura de ligas
*Nível 2 · Metalurgia · id `ga04`*

Três ligas (x, y e z, em kg) misturam cobre, zinco e estanho para obter 43 kg de cobre, 34 kg de zinco e 23 kg de estanho. **É um sistema 3×3 e cada quilo conta: resposta exata**; **a matriz não tem dominância diagonal**.

0,5x + 0,6y + 0,3z = 43 ; 0,3x + 0,1y + 0,5z = 34 ; 0,2x + 0,3y + 0,2z = 23

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 20, y ≈ 30, z ≈ 50. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (-67,57692308; 53,23076923; 149,5) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (45,89424572; -15,94090202; 98,72472784) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (50; 30; 20) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 42. e⁻ˣ = x²
*Nível 1 · Matemática · id `sc18`*

Para e⁻ˣ = x², **você não quer derivar** e tem **os palpites 0,8 e 1, ambos à direita da raiz**.

f(x) = e<sup>−x</sup> − x<sup>2</sup>

**Pergunta (sem o método):** Com x₀ = 0,8 e x₁ = 1, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 0,8 e x₁ = 1, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 0,7045590071. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 0,7136159284 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 1,815306134 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · -0,0020768739 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 43. Controlador que recalcula
*Nível 1 · Controle · id `gs05`*

Um controlador resolve este 2×2 a cada segundo **partindo da solução anterior**. **A diagonal domina (5 > 1 e 4 > 1)**.

5x + y = 11 ; x + 4y = 6

**Pergunta (sem o método):** Partindo de (0; 0), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (0; 0), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 2,01, y ≈ 0,9975. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (1,9; 0,95) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (2,2; 0,95) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (2,0005; 0,999875) → Esse é o resultado de uma iteração a mais do que o pedido.

### 44. x·ln(x) = 10
*Nível 2 · Engenharia · id `nw11`*

Um modelo de desgaste leva a x·ln(x) = 10. **f′(x) = ln(x) + 1 é simples** e **x₀ = 5 vem de um teste rápido: 5·ln 5 ≈ 8**.

f(x) = x·ln(x) − 10

**Pergunta (sem o método):** Partindo de x₀ = 5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 5, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 5,728937535. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 5,7483644 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 2,679868377 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 3,2864·10<sup>−5</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 45. Quando a população chega a 600?
*Nível 2 · Biologia · id `bi11`*

Uma população segue P(t) = 1000/(1 + 9e<sup>−0,5t</sup>). **P cresce o tempo todo e f(t) = P(t) − 600 vale f(0) < 0 < f(10)**. O biólogo quer **um intervalo de tempo que certamente contenha o instante, com largura conhecida antes de calcular**.

f(x) = 1000/(1 + 9·e<sup>−0,5·x</sup>) − 600

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [0; 10]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [0; 10]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — 6,25. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 7,5 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · 5,625 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,25 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 5,210840036 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · 116,6237491 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 46. Gás aquecido até onde?
*Nível 2 · Termodinâmica · id `fp09`*

Um mol de gás recebe 50 kJ a partir de 298 K, com cp(T) = 30 + 0,01T + 2·10⁻⁶T² J/(mol·K). A temperatura final zera ∫cp dT − 50000. **Em 1000 K falta energia e em 2000 K sobra**, **a curva da energia é quase reta nessa faixa**, e **o resultado precisa ficar dentro da faixa de validade da tabela de cp**.

f(x) = 30·(x − 298) + 0,005·(x<sup>2</sup> − 88804) + 0,000002/3·(x<sup>3</sup> − 26463592) − 50000

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [1000; 2000]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [1000; 2000]. Qual é x₂?

**Gabarito:** Falsa Posição — 1.515,139155. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 1.477,88582 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 1.517,935772 → Esse é o resultado de uma iteração a mais do que o pedido. · 1.750 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 1.004,295897 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 1.521,677487 → Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada. · -150,4383696 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 47. Equilíbrio térmico com radiação
*Nível 2 · Termodinâmica · id `sc09`*

Uma placa perde calor por radiação e convecção: 5,67·10⁻⁸(T⁴ − 300⁴) + 10(T − 300) = 1000. **O balanço é calculado por uma rotina fechada do laboratório, que só devolve f(T)**, e **as medições de T = 360 K e T = 380 K servem de palpites; as duas ficaram acima do equilíbrio**.

f(x) = 0,0000000567·(x<sup>4</sup> − 8100000000) + 10·(x − 300) − 1000

**Pergunta (sem o método):** Com x₀ = 360 e x₁ = 380, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 360 e x₁ = 380, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 355,4458837. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 450,734357 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,2480958807 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 48. Segmento circular de meia unidade
*Nível 2 · Geometria · id `fp10`*

Num tanque cilíndrico deitado de raio 1 m, a seção molhada é um segmento circular de área 0,5 m², o que leva a θ − sen(θ) = 1 (θ em radianos). **f(1,5) < 0 < f(2,5)**, **θ − sen(θ) é suave e quase reta nesse trecho** e **o ângulo precisa continuar entre 1,5 e 2,5 rad para fazer sentido**.

f(x) = x − sin(x) − 1

**Pergunta (sem o método):** Encontre a raiz em [1,5; 2,5] com 4 casas decimais, mantendo-a sempre cercada. Qual é ela?

**Depois do diagnóstico:** Use a Falsa Posição em [1,5; 2,5] até |f(xₖ)| ≤ 1·10<sup>−5</sup>. Qual é a raiz, com 4 casas decimais?

**Gabarito:** Falsa Posição — 1,934563211 (tolerância 0,00006). Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 1,855601761 → Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.

### 49. Dose para 70% de efeito
*Nível 2 · Farmacologia · id `sc11`*

A curva de Hill do remédio é E(c) = 100c<sup>2,5</sup>/(32 + c<sup>2,5</sup>). Qual dose dá 70%? **O expoente fracionário torna f′ incômoda** e **dois ensaios anteriores usaram c = 6 e c = 7, e os dois passaram de 70%**.

f(x) = 100·x<sup>2,5</sup>/(32 + x<sup>2,5</sup>) − 70

**Pergunta (sem o método):** Com x₀ = 6 e x₁ = 7, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 6 e x₁ = 7, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 5,506020793. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 5,642614035 → Esse é o resultado de uma iteração a mais do que o pedido. · 8,493979207 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · -1,026738389 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 50. Raiz de 5 sem calculadora
*Nível 1 · Matemática · id `bi01`*

A calculadora quebrou e você precisa de √5 para um projeto. Sabe-se que **f(2) = −1 e f(3) = 4 têm sinais opostos**. Como tudo será feito à mão, você quer **contas mínimas: cada passo é só a média de dois números** e **saber de antemão o erro depois de cada passo**.

f(x) = x<sup>2</sup> − 5

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [2; 3]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [2; 3]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — 2,125. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 2,25 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · 2,1875 → Esse é o resultado de uma iteração a mais do que o pedido. · 2,625 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 2,235294118 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · -0,484375 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 51. Cúbica por quatro pontos
*Nível 3 · Matemática · id `ga14`*

Ache p(t) = x·t³ + y·t² + z·t + u passando por (0, 1), (1, 2), (2, 9) e (3, 28). **Vandermonde 4×4: sem dominância diagonal**, e **os coeficientes são exatos**.

u = 1 ; x + y + z + u = 2 ; 8x + 4y + 2z + u = 9 ; 27x + 9y + 3z + u = 28

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y, z e u?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y, z e u?

**Gabarito:** Eliminação de Gauss — x ≈ 1, y ≈ 0, z ≈ 0, u ≈ 1. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (-4,62962963; 22; -15,33333333; 1) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (1,013157895; -1,065789474; 3,078947368; 1) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 52. Ponto de operação da bomba
*Nível 2 · Hidráulica · id `fp15`*

A bomba entrega H = 40 − 0,002Q² metros, e a tubulação pede H = 10 + 0,0008Q<sup>1,85</sup> (Q em m³/h). O ponto de operação iguala as duas. **Em Q = 80 a bomba sobra e em Q = 120 falta**, **as duas curvas são suaves e a diferença é quase reta** e **Q precisa ficar na faixa de catálogo da bomba**.

f(x) = 30 − 0,002·x<sup>2</sup> − 0,0008·x<sup>1,85</sup>

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [80; 120]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [80; 120]. Qual é x₂?

**Gabarito:** Falsa Posição — 111,8952671. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 110,6817093 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 110 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 98,23069098 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 112,1434521 → Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada. · 0,0227107238 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 53. A tangente horizontal no chute
*Nível 3 · Engenharia mecânica · id `bi16`*

Para x³ − 3x + 1 = 0, o chute natural seria x₀ = 1, mas **f′(1) = 0: a tangente é horizontal e o Newton não sai do lugar**. Felizmente, **f(1) = −1 < 0 < f(2) = 3**, e o professor quer **o erro máximo de cada passo, sem depender da forma da curva**.

f(x) = x<sup>3</sup> − 3·x + 1

**Pergunta (sem o método):** Faça 4 iterações do método mais indicado no intervalo [1; 2]. Qual é a aproximação obtida na iteração 4?

**Depois do diagnóstico:** Faça 4 iterações da Bisseção em [1; 2]. Qual é o ponto médio m₄?

**Gabarito:** Bisseção — 1,5625. Com derivada nula no chute, Newton falha. A Bisseção usa só os sinais e funciona.

**Erros típicos reconhecidos:** 1,625 → Esse é o ponto médio da iteração anterior (m₃). A 1ª iteração já produz m₁. · 1,53125 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,0625 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 1,513156558 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · 0,1271972656 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 54. Boia flutuando
*Nível 2 · Física · id `pf12`*

Uma boia esférica de raio 1 m e densidade 0,6 afunda até a altura h que satisfaz h²(3 − h) = 2,4. Isolando h: **h = √(2,4/(3 − h))**, com **|g′| ≈ 0,3 perto da solução**, a partir de **h₀ = 1 m**.

x = √(2,4/(3 − x))

**Pergunta (sem o método):** Partindo de x₀ = 1, encontre a solução com 4 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 1, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−5</sup>. Qual é o ponto fixo, com 4 casas decimais?

**Gabarito:** Ponto Fixo — 1,134137846 (tolerância 0,00006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 1,122558221 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 55. O método de Herão para √10
*Nível 1 · Matemática · id `nw01`*

Para √10, resolva x² − 10 = 0. **A derivada é só 2x** e **x₀ = 3 já está bem perto, pois 3² = 9**.

f(x) = x<sup>2</sup> − 10

**Pergunta (sem o método):** Partindo de x₀ = 3, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 3, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 3,162280702. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 2,485294118 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 1,9237·10<sup>−5</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 56. ln(x) + x² = 4
*Nível 1 · Matemática · id `sc10`*

Para ln(x) + x² = 4, **você prefere não derivar** e já tem **os palpites 2 e 2,5, ambos com f positiva**.

f(x) = ln(x) + x<sup>2</sup> − 4

**Pergunta (sem o método):** Com x₀ = 2 e x₁ = 2,5, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 2 e x₁ = 2,5, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 1,859865154. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 1,843356764 → Esse é o resultado de uma iteração a mais do que o pedido. · 3,140134846 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,079602379 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 57. Número de ouro em fração contínua
*Nível 1 · Matemática · id `pf01`*

O número de ouro satisfaz x = 1 + 1/x. **A equação já está na forma x = g(x)**, **com |g′| ≈ 0,38 < 1 perto da raiz**, e você parte de **um único chute, x₀ = 1**.

x = 1 + 1/x

**Pergunta (sem o método):** Partindo de x₀ = 1, faça 4 iterações do método mais indicado. Qual é x₄?

**Depois do diagnóstico:** Partindo de x₀ = 1, faça 4 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₄?

**Gabarito:** Ponto Fixo — 1,6. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 1,666666667 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 1,625 → Esse é o resultado de uma iteração a mais do que o pedido. · -0,025 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 58. Arrasto do paraquedista
*Nível 2 · Física · id `fp07`*

Um paraquedista de 68,1 kg atinge 40 m/s depois de 10 s de queda. O coeficiente de arrasto c satisfaz (9,81·68,1/c)(1 − e<sup>−10c/68,1</sup>) = 40. **Com c = 12 a velocidade passa de 40 m/s e com c = 16 fica abaixo**, **v(c) é suave e quase linear nessa faixa** e **cada valor vem de uma simulação de túnel de vento, sem derivada**.

f(x) = 9,81·68,1/x·(1 − e<sup>−10·x/68,1</sup>) − 40

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [12; 16]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [12; 16]. Qual é x₂?

**Gabarito:** Falsa Posição — 14,81507602. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 14,93086949 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 15 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 14,18709502 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · -0,0271451938 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 59. Raiz cúbica de 20
*Nível 1 · Matemática · id `nw02`*

Para ∛20, resolva x³ − 20 = 0. **f′(x) = 3x² sai na hora** e **x₀ = 3 é próximo, pois 3³ = 27**.

f(x) = x<sup>3</sup> − 20

**Pergunta (sem o método):** Partindo de x₀ = 3, faça 1 iteração do método mais indicado. Qual é x₁?

**Depois do diagnóstico:** Partindo de x₀ = 3, faça 1 iteração de Newton-Raphson. Qual é x₁?

**Gabarito:** Newton-Raphson — 2,740740741. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 2,714669625 → Esse é o resultado de uma iteração a mais do que o pedido. · 3,259259259 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,5875120663 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 60. Iterar até a precisão pedida
*Nível 3 · Engenharia · id `gs16`*

Um trecho de um sistema esparso grande é **estritamente diagonal dominante**. **Três casas decimais bastam**: itere até estabilizar.

5x − y − z = 3 ; −x + 6y − 2z = 3 ; −x − 2y + 7z = 4

**Pergunta (sem o método):** Partindo de (0; 0; 0), encontre a solução com três casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de (0; 0; 0), itere Gauss-Seidel até a maior variação ficar menor que 0,0001. Qual é a solução aproximada?

**Gabarito:** Gauss-Seidel — x ≈ 0,9999901903, y ≈ 0,9999930154, z ≈ 0,999996603 (tolerância 0,001). Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,8857142857; 0,9238095238; 0,9619047619) → Você parou cedo demais: a maior variação ainda estava acima da tolerância pedida.

### 61. Kepler com órbita alongada
*Nível 2 · Astronomia · id `nw03`*

Um cometa tem órbita muito alongada (excentricidade e = 0,9) e anomalia média M = 0,1 rad: E − 0,9·sen(E) = 0,1. **A iteração direta E ← 0,1 + 0,9·sen(E) andaria devagar, porque |g′| ≈ 0,7 perto da raiz**; já **f′(E) = 1 − 0,9·cos(E) é simples** e **E₀ = M + e = 1 é o chute clássico dos astrônomos**.

f(x) = x − 0,9·sin(x) − 0,1

**Pergunta (sem o método):** Partindo de x₀ = 1, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 1, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 0,638231676. Com excentricidade alta, a iteração de Ponto Fixo E ← M + e·sen(E) fica lenta (|g′| perto de 1). Newton, com derivada fácil e o chute clássico E₀ = M + e, dobra as casas corretas a cada passo.

**Erros típicos reconhecidos:** 0,7222730033 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,6308961515 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,704892801 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,0020331471 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · 0,1015958633 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 62. Coluna de destilação
*Nível 2 · Engenharia química · id `gs13`*

Os estágios de uma coluna de destilação geram **uma matriz tridiagonal dominante**. **O perfil da operação anterior (0,5; 0,5; 0,5; 0,5) é o chute**.

3x − y = 1 ; −x + 3y − z = 1 ; −y + 3z − u = 1 ; −z + 3u = 1

**Pergunta (sem o método):** Partindo de (0,5; 0,5; 0,5; 0,5), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0,5; 0,5; 0,5; 0,5), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 0,5, y ≈ 0,6666666667, z ≈ 0,7222222222, u ≈ 0,5740740741. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,5; 0,6666666667; 0,6666666667; 0,5) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (0,5555555556; 0,7592592593; 0,7777777778; 0,5925925926) → Esse é o resultado de uma iteração a mais do que o pedido.

### 63. Quando o remédio deixa de agir?
*Nível 2 · Farmacologia · id `bi18`*

A concentração no sangue é C(t) = 20(e<sup>−0,2t</sup> − e<sup>−1,2t</sup>). **Depois do pico, C só diminui, e f(t) = C(t) − 5 vale f(2) > 0 > f(10)**. A bula precisa de **um intervalo de tempo com garantia e largura conhecida antes do cálculo**.

f(x) = 20·(e<sup>−0,2·x</sup> − e<sup>−1,2·x</sup>) − 5

**Pergunta (sem o método):** Faça 3 iterações do método mais indicado no intervalo [2; 10]. Qual é a aproximação obtida na iteração 3?

**Depois do diagnóstico:** Faça 3 iterações da Bisseção em [2; 10]. Qual é o ponto médio m₃?

**Gabarito:** Bisseção — 7. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 8 → Esse é o ponto médio da iteração anterior (m₂). A 1ª iteração já produz m₁. · 6,5 → Esse é o resultado de uma iteração a mais do que o pedido. · 3 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · -0,0725580677 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 64. 2×2 iterado duas vezes
*Nível 1 · Matemática · id `gs18`*

O sistema é **diagonal dominante (6 > 2 e 5 > 1)**; use **duas iterações a partir da origem**.

6x + 2y = 10 ; x + 5y = 11

**Pergunta (sem o método):** Partindo de (0; 0), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (0; 0), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 1,044444444, y ≈ 1,991111111. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,9333333333; 1,866666667) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1,666666667; 1,866666667) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (1,002962963; 1,999407407) → Esse é o resultado de uma iteração a mais do que o pedido.

### 65. Diluição de soluções
*Nível 2 · Química · id `ga10`*

Três soluções (x, y e z litros, a 10%, 20% e 40%) formam 10 L com 2,4 L de soluto, usando o dobro de y em x. **Sistema pequeno com coeficientes decimais**, e **a segunda linha (0,2 < 0,1 + 0,4) não é dominante**.

x + y + z = 10 ; 0,1x + 0,2y + 0,4z = 2,4 ; x − 2y = 0

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 4, y ≈ 2, z ≈ 4. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (-14; 24; 0) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (0; 8; 2) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 66. Exponencial contra reta
*Nível 1 · Matemática · id `nw09`*

Resolva eˣ = 3x perto de 1,5. **f′(x) = eˣ − 3 é direta** e **o chute 1,5 veio de uma tabela de valores**.

f(x) = e<sup>x</sup> − 3·x

**Pergunta (sem o método):** Partindo de x₀ = 1,5, faça 1 iteração do método mais indicado. Qual é x₁?

**Depois do diagnóstico:** Partindo de x₀ = 1,5, faça 1 iteração de Newton-Raphson. Qual é x₁?

**Gabarito:** Newton-Raphson — 1,512358146. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 1,487641854 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,0003436444 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 67. Função de produção
*Nível 2 · Economia · id `sc20`*

Uma função de produção ajustada dá x<sup>0,7</sup> + 2x<sup>0,3</sup> = 10. **Os expoentes fracionários deixam a derivada desagradável**, e **o planejamento anterior usou 5 e 6, do mesmo lado da raiz**.

f(x) = x<sup>0,7</sup> + 2·x<sup>0,3</sup> − 10

**Pergunta (sem o método):** Com x₀ = 5 e x₁ = 6, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 5 e x₁ = 6, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 11,10014874. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 12,07015026 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,8998512561 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · -0,490792031 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 68. Corrida com oscilação
*Nível 2 · Esportes · id `nw15`*

A posição de um atleta é s(t) = 3t + 2·sen(t) metros. Quando ele passa por s = 20? **f′(t) = 3 + 2·cos(t) é simples e nunca é menor que 1**, e **t₀ = 6,5 s é uma boa estimativa**.

f(x) = 3·x + 2·sin(x) − 20

**Pergunta (sem o método):** Partindo de x₀ = 6,5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 6,5, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 6,514092709. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 6,457773196 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · -1,7760·10<sup>−11</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · 6,590155685 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 69. Calibração de juntas
*Nível 2 · Robótica · id `gs17`*

A calibração de três juntas de um robô gera **um sistema diagonal dominante**, e **a calibração anterior (0,8; −0,8; 1,8) é o chute**.

6x + y − 2z = 1 ; x + 5y + z = −2 ; −x + 2y + 8z = 13

**Pergunta (sem o método):** Partindo de (0,8; −0,8; 1,8), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0,8; −0,8; 1,8), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 0,9, y ≈ -0,94, z ≈ 1,9725. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,9; -0,92; 1,925) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (0,9808333333; -0,9906666667; 1,995270833) → Esse é o resultado de uma iteração a mais do que o pedido.

### 70. Quantos dados cabem em 1 segundo?
*Nível 2 · Computação · id `bi08`*

Um algoritmo faz n·log₂(n) operações e o processador executa 10⁷ por segundo. **f(n) = n·log₂(n) − 10⁷ é crescente, com f(100.000) < 0 < f(1.000.000)**. Você quer n **com erro garantido de no máximo 1 unidade**.

f(x) = x·ln(x)/ln(2) − 10000000

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [100.000; 1.000.000], quantas iterações garantem erro ≤ 1?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [100.000; 1.000.000] garantem erro ≤ 1?

**Gabarito:** Bisseção — 20. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 6 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 71. O exemplo de Newton, sem derivar
*Nível 1 · História da matemática · id `sc14`*

Volte a x³ − 2x − 5 = 0, mas **sem calcular nenhuma derivada**, com **os palpites 2,5 e 3, ambos com f positiva**.

f(x) = x<sup>3</sup> − 2·x − 5

**Pergunta (sem o método):** Com x₀ = 2,5 e x₁ = 3, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 2,5 e x₁ = 3, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 2,228915663. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 2,142312451 → Esse é o resultado de uma iteração a mais do que o pedido. · 3,771084337 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 1,615566636 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 72. Termistor de Steinhart-Hart
*Nível 2 · Instrumentação · id `nw12`*

Para um termistor, 1/T = A + B·L + C·L³, com L = ln(R). A 310 K: 0,001129 + 0,0002341·L + 8,775·10⁻⁸·L³ = 1/310. **A derivada em L é um polinômio simples** e **a folha de dados sugere L₀ = 9**.

f(x) = 0,001129 + 0,0002341·x + 0,00000008775·x<sup>3</sup> − 1/310

**Pergunta (sem o método):** Partindo de x₀ = 9, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 9, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 8,709261351. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 9,867520463 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 1,3794·10<sup>−12</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 73. Cobrança de falta
*Nível 2 · Esportes · id `fp11`*

Uma bola chutada a 20 m/s precisa passar a 2 m de altura sobre uma barreira a 20 m. O ângulo θ satisfaz 20·tg(θ) − 4,905/cos²(θ) = 2. **Com θ = 0,3 rad a bola passa baixa e com 0,4 rad passa alta**, e **nessa faixa a altura varia quase linearmente com θ**. **O ângulo baixo, da cobrança rasante, é o que interessa**.

f(x) = 20·tan(x) − 4,905/cos(x)<sup>2</sup> − 2

**Pergunta (sem o método):** Faça 1 iteração do método mais indicado no intervalo [0,3; 0,4]. Qual é a aproximação obtida na iteração 1?

**Depois do diagnóstico:** Faça 1 iteração da Falsa Posição em [0,3; 0,4]. Qual é x₁?

**Gabarito:** Falsa Posição — 0,3637925653. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 0,35 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,3362074347 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · -0,0012602561 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 74. Cardápio balanceado
*Nível 2 · Nutrição · id `ga06`*

Três alimentos (x, y e z porções) fornecem proteína, carboidrato e gordura nas quantidades-alvo. **Sistema 3×3: a nutricionista quer porções exatas** e **a primeira linha (2 < 1 + 3) não é dominante**.

2x + y + 3z = 19 ; x + 3y + 2z = 19 ; 4x + 2y + z = 18

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 2, y ≈ 3, z ≈ 4. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (10,74; 8,32; -3,6) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-2,623376623; 0,0909090909; 8,051948052) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (4; 3; 2) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 75. sen(x)/x = 1/2
*Nível 2 · Óptica · id `sc15`*

Na difração, aparece sen(x)/x = 0,5. **A regra do quociente deixaria f′ chata**, e **o gráfico sugere os palpites 2 e 2,2, ambos à direita da raiz**.

f(x) = sin(x)/x − 0,5

**Pergunta (sem o método):** Com x₀ = 2 e x₁ = 2,2, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 2 e x₁ = 2,2, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 1,895924026. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 2,504075974 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · -0,0001856985 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · -129.677,366 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 76. Cosseno encontra a reta
*Nível 1 · Matemática · id `bi02`*

Para f(x) = cos(x) − x, **f(0) = 1 > 0 e f(1) ≈ −0,46 < 0**. O professor pede que você **diga quanto trabalho será necessário antes de calcular qualquer ponto**.

f(x) = cos(x) − x

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [0; 1], quantas iterações garantem erro ≤ 0,001?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [0; 1] garantem erro ≤ 0,001?

**Gabarito:** Bisseção — 10. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 3 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 77. Pivô zero
*Nível 1 · Matemática · id `ga08`*

Resolva 2y = 6 e x + y = 5, nessa ordem. **O primeiro pivô (coeficiente de x na 1ª linha) é zero: é preciso trocar as linhas**, e **Gauss-Seidel dividiria por zero na diagonal**.

2y = 6 ; x + y = 5

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x e y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x e y?

**Gabarito:** Eliminação de Gauss — x ≈ 2, y ≈ 3. Com pivô nulo, Gauss com troca de linhas (pivotamento) resolve direto. Um método iterativo dividiria por zero.

**Erros típicos reconhecidos:** (3; 2) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 78. Temperatura de equilíbrio da Terra
*Nível 3 · Clima · id `pf20`*

Um modelo de balanço de energia diz que a temperatura T da Terra satisfaz **T = (S(1 − α(T))/(4σε))<sup>1/4</sup>**, com S = 1361 W/m², ε = 0,61 e um albedo α(T) que cresce quando há gelo (T baixo). **Perto do clima atual, |g′| ≈ 0,06**, e partindo de **T₀ = 288 K** a iteração chega ao equilíbrio quente.

x = (1361·(1 − (0,3 + 0,3/(1 + exp((x − 265)/5))))/(4·0,0000000567·0,61))<sup>0,25</sup>

**Pergunta (sem o método):** Partindo de x₀ = 288, encontre a solução com 3 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 288, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−4</sup>. Qual é o ponto fixo, com 3 casas decimais?

**Gabarito:** Ponto Fixo — 287,7449221 (tolerância 0,0006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

### 79. Simulador de semáforo
*Nível 3 · Engenharia de tráfego · id `sc08`*

Um simulador calcula a espera para c ciclos por hora. Para treinar, a regra interna é f(c) = 30/(c − 2) + 0,5c − 12. **Cada rodada leva 10 minutos: não há como gastar avaliações extras com derivada**, e **os testes c = 4 e c = 5 deram o mesmo sinal, então não há intervalo para a Bisseção**.

f(x) = 30/(x − 2) + 0,5·x − 12

**Pergunta (sem o método):** Com x₀ = 4 e x₁ = 5, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 4 e x₁ = 5, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 5,184210526. A Bisseção precisaria de sinais opostos e o Newton gastaria avaliações com f′. A Secante usa os dois resultados já pagos e só precisa de uma avaliação nova por passo.

**Erros típicos reconhecidos:** 5,111111111 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 4,608946609 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 5,157024793 → Você manteve x₀ fixo em todas as iterações. Na Secante, os dois pontos mais recentes substituem os anteriores. · 0,0135928665 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 80. Caixa sem tampa de 500 cm³
*Nível 1 · Geometria · id `nw14`*

Cortando quadrados de lado x de uma folha 20 × 20 cm, a caixa tem V = x(20 − 2x)² = 500. **f é um polinômio: a derivada sai na hora** e **o desenho sugere um corte de cerca de 1,5 cm**.

f(x) = x·(20 − 2·x)<sup>2</sup> − 500

**Pergunta (sem o método):** Partindo de x₀ = 1,5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 1,5, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 1,90865949. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 1,855614973 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,5381418407 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · -0,1618464638 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 81. Sensor com resposta em raiz
*Nível 3 · Instrumentação · id `bi19`*

Um sensor responde como √x, e o ponto de operação satisfaz √x = 0,4 + x/10. **Perto de x = 0 a derivada de √x vai ao infinito**, mas **f(0) = −0,4 < 0 < f(1) = 0,5**. **A curva é muito torta perto de 0: uma corda andaria devagar**.

f(x) = √(x) − 0,4 − x/10

**Pergunta (sem o método):** Faça 4 iterações do método mais indicado no intervalo [0; 1]. Qual é a aproximação obtida na iteração 4?

**Depois do diagnóstico:** Faça 4 iterações da Bisseção em [0; 1]. Qual é o ponto médio m₄?

**Gabarito:** Bisseção — 0,1875. Derivada infinita perto da borda torna o Newton arriscado, e a curva torta deixaria a Falsa Posição lenta; a Bisseção só precisa dos sinais.

**Erros típicos reconhecidos:** 0,125 → Esse é o ponto médio da iteração anterior (m₃). A 1ª iteração já produz m₁. · 0,15625 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,5625 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 0,1995947456 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · 0,0142627019 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 82. Dois compartimentos
*Nível 2 · Medicina · id `sc17`*

A concentração de um fármaco é C(t) = 30e<sup>−0,8t</sup> + 10e<sup>−0,1t</sup>. Quando C cai para 8? **A curva vem de um software de ajuste que não mostra a derivada**, e **as coletas de t = 2 h e t = 3 h servem de palpites, do mesmo lado da raiz**.

f(x) = 30·e<sup>−0,8·x</sup> + 10·e<sup>−0,1·x</sup> − 8

**Pergunta (sem o método):** Com x₀ = 2 e x₁ = 3, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 2 e x₁ = 3, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 3,517615746. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 3,850291486 → Esse é o resultado de uma iteração a mais do que o pedido. · 2,482384254 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,8332512532 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 83. Partícula no decantador
*Nível 3 · Engenharia ambiental · id `pf19`*

Num decantador, a velocidade v de queda de uma partícula satisfaz **v = √(0,6/C_D), com C_D = 24/Re + 0,4 e Re = 50v**. **|g′| ≈ 0,31 perto da solução**, e o projeto parte da **estimativa v₀ = 0,5 m/s**.

x = √(0,6/(24/(50·x) + 0,4))

**Pergunta (sem o método):** Partindo de x₀ = 0,5, encontre a solução com 4 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 0,5, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−5</sup>. Qual é o ponto fixo, com 4 casas decimais?

**Gabarito:** Ponto Fixo — 0,7638181697 (tolerância 0,00006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 0,7310568702 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 84. Primeira iteração
*Nível 1 · Matemática · id `gs01`*

O sistema abaixo é **estritamente diagonal dominante (4 > 2, 8 > 5, 5 > 3)** e você quer **ver a solução sendo refinada iteração a iteração**.

4x − y + z = 7 ; 4x − 8y + z = −21 ; −2x + y + 5z = 15

**Pergunta (sem o método):** Partindo de (0; 0; 0), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0; 0; 0), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 1,75, y ≈ 3,5, z ≈ 3. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (1,75; 2,625; 3) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1,875; 3,9375; 2,9625) → Esse é o resultado de uma iteração a mais do que o pedido.

### 85. Raiz de 11 com garantia
*Nível 1 · Matemática · id `fp05`*

Para √11, **f(3) = −2 e f(4) = 5**. **Entre 3 e 4 a parábola quase não curva**, e você quer **chegar perto em poucos cortes sem perder o intervalo**.

f(x) = x<sup>2</sup> − 11

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [3; 4]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [3; 4]. Qual é x₂?

**Gabarito:** Falsa Posição — 3,31372549. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 3,285714286 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 3,25 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 3,416413374 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · -0,0192233756 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 86. Posição, velocidade e aceleração
*Nível 2 · Física · id `ga16`*

Um carrinho tem s(t) = x + y·t + z·t², com s(1) = 7 m, s(2) = 16 m e s(3) = 29 m. **Vandermonde sem dominância diagonal** e **três valores exatos**. (A aceleração é 2z.)

x + y + z = 7 ; x + 2y + 4z = 16 ; x + 3y + 9z = 29

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 2, y ≈ 3, z ≈ 2. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (20; -27,5; 14,5) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (2; 1; 4) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 87. Gás de Van der Waals
*Nível 3 · Química · id `sc04`*

Para 1 mol de CO₂ a 300 K e 1 atm: (1 + 3,59/V²)(V − 0,0427) = 24,6. **O volume do gás ideal (24,6 L) e um valor um pouco menor (24,55 L) são dois bons palpites, ambos acima do volume real** e **derivar a equação à mão dá trabalho**.

f(x) = (1 + 3,59/x<sup>2</sup>)·(x − 0,0427) − 24,6

**Pergunta (sem o método):** Com x₀ = 24,6 e x₁ = 24,55, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 24,6 e x₁ = 24,55, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 24,49640333. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 24,71078592 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 1,7518·10<sup>−11</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 88. Seno encontra a reta
*Nível 2 · Física · id `nw08`*

Você procura a raiz positiva de sen(x) = x/2. **f′(x) = cos(x) − 1/2 é simples** e **o gráfico mostra a raiz perto de 2**.

f(x) = sin(x) − x/2

**Pergunta (sem o método):** Partindo de x₀ = 2, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 2, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 1,895511645. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 1,900995594 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 2,284057344 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · -1,4233·10<sup>−5</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x. · 9,3104·10<sup>−20</sup> → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 89. Grade de pressão
*Nível 3 · Meteorologia · id `gs19`*

Modelos do tempo resolvem **grades com milhões de pontos**, com **matrizes esparsas e diagonal dominantes**. A previsão de ontem dá **o chute (8, 8, 8, 8)**.

5x − y − z = 30 ; −x + 5y − u = 40 ; −x + 5z − u = 20 ; −y − z + 5u = 30

**Pergunta (sem o método):** Partindo de (8; 8; 8; 8), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (8; 8; 8; 8), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 9,776, y ≈ 11,9104, z ≈ 7,9104, u ≈ 9,96416. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (9,68; 11,68; 7,68; 9,68) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (9,2; 11,44; 7,44; 9,776) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (9,96416; 11,985664; 7,985664; 9,9942656) → Esse é o resultado de uma iteração a mais do que o pedido.

### 90. Profundidade do canal de irrigação
*Nível 2 · Agricultura · id `bi17`*

Num canal retangular de 2 m de largura, a vazão de 5 m³/s ocorre na profundidade y que satisfaz a fórmula de Manning. **A água fica entre 0,1 m e 3 m (bordas do canal), com f mudando de sinal** e a obra exige **erro máximo de 1 mm**.

f(x) = (1/0,015)·(2·x)·(2·x/(2 + 2·x))<sup>2/3</sup>·√(0,001) − 5

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [0,1; 3], quantas iterações garantem erro ≤ 0,001?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [0,1; 3] garantem erro ≤ 0,001?

**Gabarito:** Bisseção — 12. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 4 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 91. Tempo de execução medido
*Nível 3 · Computação · id `sc16`*

O tempo de um algoritmo é medido rodando o programa; para treinar, o modelo é 0,002·n<sup>1,5</sup>·ln(n) segundos. Qual n leva 60 s? **Cada medição exige rodar o programa de novo**, e **as duas medições já feitas (n = 250 e n = 280) ficaram abaixo da meta, com o mesmo sinal**.

f(x) = 0,002·x<sup>1,5</sup>·ln(x) − 60

**Pergunta (sem o método):** Com x₀ = 250 e x₁ = 280, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 250 e x₁ = 280, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 302,1483587. Sem sinais opostos não há Bisseção, e cada avaliação custa uma execução. A Secante extrapola a partir das duas medições já feitas.

**Erros típicos reconhecidos:** 303,6013789 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 209,3832777 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · -0,0117364529 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 92. Colônia com perdas
*Nível 2 · Biologia · id `nw05`*

Uma colônia de bactérias segue N(t) = 100e<sup>0,3t</sup> − 50t e o laboratório quer o instante em que N = 500. **f′(t) = 30e<sup>0,3t</sup> − 50 é direta** e **o gráfico do experimento indica t₀ = 7 h**.

f(x) = 100·e<sup>0,3·x</sup> − 50·x − 500

**Pergunta (sem o método):** Partindo de x₀ = 7, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 7, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 7,165936935. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 6,469186295 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,00107425 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 93. Fluxo nos cruzamentos
*Nível 2 · Trânsito · id `ga07`*

Em três ruas de mão única, os fluxos x, y e z (carros/h) obedecem à conservação nos cruzamentos: x + y = 900, y − z = 200 e x − z = 300. **A matriz tem zeros na diagonal relativa e não é dominante**, e **é um sistema pequeno com resposta exata**.

x + y = 900 ; y − z = 200 ; x − z = 300

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 500, y ≈ 400, z ≈ 200. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (850; 50; -150) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (1.400; -500; -700) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (200; 400; 500) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 94. Velocidade num tubo longo
*Nível 2 · Hidráulica · id `pf14`*

Água sai de um tanque 5 m acima por um tubo de 50 m e 5 cm de diâmetro. A velocidade satisfaz **v = √(2gh/(1 + f·L/D)), com o atrito f dependendo de v pela fórmula de Blasius**. **O atrito muda pouco com v (|g′| ≈ 0,12)**, e o engenheiro começa com **v₀ = 2 m/s**.

x = √(98,1/(1 + 316·(50000·x)<sup>−0,25</sup>))

**Pergunta (sem o método):** Partindo de x₀ = 2, encontre a solução com 4 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 2, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−5</sup>. Qual é o ponto fixo, com 4 casas decimais?

**Gabarito:** Ponto Fixo — 2,327492374 (tolerância 0,00006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 2,322569286 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 95. pH de um ácido fraco
*Nível 2 · Química · id `bi07`*

Para um ácido fraco 0,1 mol/L com Ka = 1,8·10⁻⁵, a concentração x = [H⁺] satisfaz x²/(0,1 − x) = 1,8·10⁻⁵. **Sabe-se que x está entre 0 e 0,01 mol/L e f muda de sinal ali**, e o laudo precisa **declarar o erro máximo: 10⁻⁶ mol/L**.

f(x) = x<sup>2</sup>/(0,1 − x) − 0,000018

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [0; 0,01], quantas iterações garantem erro ≤ 1·10<sup>−6</sup>?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [0; 0,01] garantem erro ≤ 1·10<sup>−6</sup>?

**Gabarito:** Bisseção — 14. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 4 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 96. Tamanho final de uma epidemia
*Nível 2 · Epidemiologia · id `pf08`*

No modelo SIR, a fração z da população que pega a doença satisfaz **z = 1 − e<sup>−R₀z</sup>, já na forma z = g(z)**, aqui com R₀ = 2,5. **|g′(z*)| ≈ 0,27 perto da solução positiva**, e o epidemiologista parte de **z₀ = 0,5**. (z = 0 também é solução, mas não descreve uma epidemia.)

x = 1 − e<sup>−2,5·x</sup>

**Pergunta (sem o método):** Partindo de x₀ = 0,5, encontre a solução com 4 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 0,5, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−5</sup>. Qual é o ponto fixo, com 4 casas decimais?

**Gabarito:** Ponto Fixo — 0,8926447536 (tolerância 0,00006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 0,8319910468 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 97. Três aplicações
*Nível 2 · Finanças · id `ga11`*

R$ 20.000 foram divididos em três aplicações (x, y e z) que rendem 5%, 8% e 10% ao ano, com rendimento total de R$ 1.640 e z = 2x. **Três incógnitas e o contador quer centavos exatos**; **a segunda linha é longe de dominante**.

x + y + z = 20000 ; 0,05x + 0,08y + 0,1z = 1640 ; −2x + z = 0

**Pergunta (sem o método):** Resolva o sistema. Qual é o valor de y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Qual é o valor de y?

**Gabarito:** Eliminação de Gauss — 8.000. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** 54.666,66667 → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · -7.813,953488 → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · 4.000 → Esse é o valor de x, não de y.

### 98. Ponto de equilíbrio da fábrica
*Nível 2 · Administração · id `fp13`*

Uma fábrica tem lucro L(q) = 20q − 3000 − 0,5q<sup>1,2</sup>, com q em unidades. **L(150) < 0 < L(400)**, **nessa faixa o lucro é praticamente uma reta** e **cada avaliação vem de um relatório gerencial demorado**.

f(x) = 20·x − 3000 − 0,5·x<sup>1,2</sup>

**Pergunta (sem o método):** Com o método mais indicado em [150; 400], quantas iterações são necessárias até |f(xₖ)| ≤ 0,001?

**Depois do diagnóstico:** Com a Falsa Posição em [150; 400], quantas iterações são necessárias até |f(xₖ)| ≤ 0,001?

**Gabarito:** Falsa Posição — 3. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 22 → 22 é a contagem da Bisseção para o mesmo critério. A corda chega lá em menos passos: refaça com x = (a·f(b) − b·f(a))/(f(b) − f(a)).

### 99. O exemplo clássico do livro
*Nível 3 · História da matemática · id `bi13`*

Este é o exemplo que abre muitos livros de Análise Numérica: x³ + 4x² − 10 = 0 em [1; 2]. **f(1) = −5 e f(2) = 14**, e pede-se **erro garantidamente menor que 0,001**.

f(x) = x<sup>3</sup> + 4·x<sup>2</sup> − 10

**Pergunta (sem o método):** Encontre a raiz em [1; 2] com erro garantidamente ≤ 0,001. Qual é a estimativa?

**Depois do diagnóstico:** Use a Bisseção em [1; 2] até a cota de erro ficar ≤ 0,001. Qual é a estimativa da raiz?

**Gabarito:** Bisseção — 1,365230013 (tolerância 0,001). Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

### 100. Insetos ano a ano
*Nível 1 · Ecologia · id `pf03`*

A fração p da capacidade ocupada por uma população de insetos evolui ano a ano por pₙ₊₁ = 2,6·pₙ(1 − pₙ). O equilíbrio é o p que se repete: **p = g(p) já é a própria regra do modelo**, e **|g′(p*)| = 0,6 < 1: o equilíbrio atrai**. Este ano, **p₀ = 0,3**.

x = 2,6·x·(1 − x)

**Pergunta (sem o método):** Partindo de x₀ = 0,3, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 0,3, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 0,5957125522. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 0,6444984 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,6261816791 → Esse é o resultado de uma iteração a mais do que o pedido. · -0,0304691269 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 101. Três passos, nove casas
*Nível 3 · Matemática · id `nw10`*

Calcule √2 resolvendo x² − 2 = 0. **A derivada é 2x** e você quer ver **como cada passo quase dobra as casas corretas**, partindo de **x₀ = 1**.

f(x) = x<sup>2</sup> − 2

**Pergunta (sem o método):** Partindo de x₀ = 1, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 1, faça 3 iterações de Newton-Raphson. Qual é x₃?

**Gabarito:** Newton-Raphson — 1,414215686. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** -1,075 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 6,0073·10<sup>−6</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 102. Rendimento de um título
*Nível 2 · Finanças · id `sc07`*

Um título paga R$ 50, R$ 50 e R$ 1.050 nos próximos três anos e custa R$ 980. **O sistema da corretora só calcula o preço de cada taxa**, e **as taxas 6% e 7% já foram testadas, e as duas deram preço abaixo de R$ 980**.

f(x) = 50/(1 + x) + 50/(1 + x)<sup>2</sup> + 1050/(1 + x)<sup>3</sup> − 980

**Pergunta (sem o método):** Com x₀ = 0,06 e x₁ = 0,07, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 0,06 e x₁ = 0,07, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 0,0573869907. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 0,0826130094 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,1586362275 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 103. Auditoria da taxa de juros
*Nível 2 · Finanças · id `bi04`*

Um empréstimo de R$ 10.000 em 24 parcelas de R$ 500 tem taxa mensal i que satisfaz 10000·i/(1 − (1+i)<sup>−24</sup>) = 500. **O contrato garante que a taxa está entre 1% e 3% ao mês** e o auditor exige **um limite de erro garantido de 0,01 ponto percentual**.

f(x) = 10000·x/(1 − (1 + x)<sup>−24</sup>) − 500

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [0,01; 0,03], quantas iterações garantem erro ≤ 0,0001?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [0,01; 0,03] garantem erro ≤ 0,0001?

**Gabarito:** Bisseção — 8. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 3 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 104. Duas retas
*Nível 1 · Matemática · id `ga01`*

Encontre o cruzamento das retas x + 2y = 8 e 3x − y = 3. **São só duas incógnitas e se quer o valor exato**; repare que **na primeira equação 1 < 2: não há dominância diagonal**.

x + 2y = 8 ; 3x − y = 3

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x e y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x e y?

**Gabarito:** Eliminação de Gauss — x ≈ 2, y ≈ 3. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (8,857142857; -0,4285714286) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-2,8; 5,4) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (3; 2) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 105. Pesca sustentável
*Nível 3 · Pesca · id `pf17`*

Um estoque de peixes, em toneladas, segue Nₜ₊₁ = 2Nₜ/(1 + Nₜ/100) − 10, com 10 t pescadas por ano. **O equilíbrio é N = g(N)**. **Perto de N ≈ 77 t, |g′| ≈ 0,64 < 1: o estoque é atraído para lá**, e hoje há **N₀ = 90 t**. (Existe outro equilíbrio, perto de 13 t, com |g′| > 1: ele repele.)

x = 2·x/(1 + x/100) − 10

**Pergunta (sem o método):** Partindo de x₀ = 90, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 90, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 79,95140304. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 81,73789174 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 78,85888267 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,092520376 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 106. Quatro produtos, quatro máquinas
*Nível 3 · Produção · id `ga09`*

Uma fábrica usa quatro máquinas para quatro produtos (x, y, z e u unidades). As horas disponíveis definem um sistema 4×4. **Nenhuma linha tem dominância diagonal** e o plano exige **quantidades exatas**.

x + 2y + z + u = 70 ; 2x + y + 3z + u = 70 ; x + y + z + 3u = 80 ; 3x + y + z + 2u = 85

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y, z e u?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y, z e u?

**Gabarito:** Eliminação de Gauss — x ≈ 10, y ≈ 20, z ≈ 5, u ≈ 15. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (557,4666667; -110,1333333; -263,8; -3,4) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-11,09289617; 17,30418944; -7,987249545; 54,47176685) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (15; 5; 20; 10) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 107. Onde e⁻ˣ cruza a reta
*Nível 1 · Matemática · id `bi10`*

Você quer o ponto em que e⁻ˣ = x. **f(0) = 1 > 0 e f(1) ≈ −0,63 < 0** e, por enquanto, **basta um intervalo que certamente contenha a raiz, com largura conhecida de antemão: 1/2⁴ depois de 4 passos**.

f(x) = e<sup>−x</sup> − x

**Pergunta (sem o método):** Faça 4 iterações do método mais indicado no intervalo [0; 1]. Qual é a aproximação obtida na iteração 4?

**Depois do diagnóstico:** Faça 4 iterações da Bisseção em [0; 1]. Qual é o ponto médio m₄?

**Gabarito:** Bisseção — 0,5625. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 0,625 → Esse é o ponto médio da iteração anterior (m₃). A 1ª iteração já produz m₁. · 0,59375 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,0625 → Você manteve a metade errada: o novo intervalo é o que conserva a troca de sinal (se f(a)·f(m) < 0, então b ← m). · 0,5672055526 → Esse é o resultado da Falsa Posição (corte pela corda). Aqui as pistas pediam a Bisseção: corte no ponto médio. · 0,0072828247 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 108. Modelo de Leontief
*Nível 2 · Economia · id `gs04`*

Três setores de uma economia satisfazem (I − A)·p = d. **A matriz é diagonal dominante**, e **a produção do mês passado (100, 120, 90) é uma ótima aproximação inicial** para o planejamento deste mês.

0,8x − 0,2y − 0,1z = 40 ; −0,1x + 0,7y − 0,2z = 50 ; −0,2x − 0,1y + 0,9z = 45

**Pergunta (sem o método):** Partindo de (100; 120; 90), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (100; 120; 90), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 91,25, y ≈ 110,1785714, z ≈ 82,51984127. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (91,25; 111,4285714; 85,55555556) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (87,85962302; 107,5570437; 81,4751433) → Esse é o resultado de uma iteração a mais do que o pedido.

### 109. Quíntica de Abel
*Nível 3 · Matemática · id `nw20`*

x⁵ − x − 1 = 0 não tem fórmula com radicais (Abel). **A derivada 5x⁴ − 1 é barata**, **x₀ = 1,2 está perto** e você quer **seis casas no menor número de passos**.

f(x) = x<sup>5</sup> − x − 1

**Pergunta (sem o método):** Partindo de x₀ = 1,2, encontre a raiz com 6 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 1,2, itere Newton-Raphson até a variação ficar menor que 10<sup>−7</sup>. Qual é a raiz, com 6 casas decimais?

**Gabarito:** Newton-Raphson — 1,167303978 (tolerância 6e-7). Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

### 110. Valor novo na hora
*Nível 3 · Matemática · id `gs12`*

Neste sistema **diagonal dominante**, observe a marca do Gauss-Seidel: **ao calcular y, já se usa o x desta mesma iteração**.

10x + 2y − z = 7 ; x + 8y + 3z = −4 ; −2x − y + 10z = 9

**Pergunta (sem o método):** Partindo de (0; 0; 0), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (0; 0; 0), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 0,7, y ≈ -0,5875, z ≈ 0,98125. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,7; -0,5; 0,9) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (0,915625; -0,982421875; 0,9848828125) → Esse é o resultado de uma iteração a mais do que o pedido.

### 111. Parábola por três pontos
*Nível 1 · Matemática · id `ga05`*

Ache a parábola p(t) = x·t² + y·t + z que passa por (1, 4), (2, 9) e (3, 16). **A matriz de Vandermonde não tem nada de dominância diagonal** e **são 3 coeficientes exatos**.

x + y + z = 4 ; 4x + 2y + z = 9 ; 9x + 3y + z = 16

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 1, y ≈ 2, z ≈ 1. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (16,5; -28,5; 16) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-1,016666667; -0,0833333333; 5,1) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 112. xˣ = 5
*Nível 3 · Matemática · id `sc12`*

Para xˣ = 5, **a derivada xˣ(ln x + 1) exige derivação logarítmica** e **2,2 e 2,3 são bons palpites, ambos com xˣ > 5**.

f(x) = x<sup>x</sup> − 5

**Pergunta (sem o método):** Com x₀ = 2,2 e x₁ = 2,3, faça 2 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Com x₀ = 2,2 e x₁ = 2,3, faça 2 iterações da Secante. Qual é x₃?

**Gabarito:** Secante — 2,13122936. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 2,140734692 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 2,739877204 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 0,0163324442 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 113. Onde a viga mais desce
*Nível 3 · Estruturas · id `fp18`*

Numa viga de 6 m com carga distribuída crescente, a flecha máxima fica onde y′(x) = 0, ou seja, −5x⁴ + 216x² − 1296 = 0. **y′(2) < 0 < y′(4)**, **a curva é suave nesse trecho** e **cada avaliação vem de um programa de elementos finitos**.

f(x) = −5·x<sup>4</sup> + 216·x<sup>2</sup> − 1296

**Pergunta (sem o método):** Com o método mais indicado em [2; 4], quantas iterações são necessárias até |f(xₖ)| ≤ 1·10<sup>−6</sup>?

**Depois do diagnóstico:** Com a Falsa Posição em [2; 4], quantas iterações são necessárias até |f(xₖ)| ≤ 1·10<sup>−6</sup>?

**Gabarito:** Falsa Posição — 4. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 30 → 30 é a contagem da Bisseção para o mesmo critério. A corda chega lá em menos passos: refaça com x = (a·f(b) − b·f(a))/(f(b) − f(a)).

### 114. Fator de segurança de Bishop
*Nível 3 · Geotecnia · id `pf16`*

No método de Bishop, o fator de segurança F aparece dos dois lados: **F = (1,8 + 0,3/F)/(1 + 0,2/F) já está na forma F = g(F)**. **g quase não muda com F (|g′| ≈ 0,02): cada rodada corrige quase tudo**, e **a planilha não tem derivada pronta: só recalcula o lado direito**. O engenheiro começa com **F₀ = 1,5**.

x = (1,8 + 0,3/x)/(1 + 0,2/x)

**Pergunta (sem o método):** Partindo de x₀ = 1,5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 1,5, faça 2 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₂?

**Gabarito:** Ponto Fixo — 1,769461078. Bishop já vem como F = g(F) e g é uma contração fortíssima: o Ponto Fixo é exatamente o procedimento das planilhas de estabilidade de taludes. Sem derivada, sem intervalo, com um só chute.

**Erros típicos reconhecidos:** 1,764705882 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · -7,3735·10<sup>−5</sup> → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 115. Reator contínuo
*Nível 2 · Engenharia química · id `fp12`*

Num reator contínuo, a concentração de saída C (mol/L) satisfaz 2 − C − 1,5·C<sup>1,5</sup> = 0 (alimentação de 2 mol/L, reação de ordem 1,5). **f(0,5) > 0 > f(1,5)**, **a curva é suave nesse intervalo** e **uma concentração fora de [0,5; 1,5] não tem sentido no processo**.

f(x) = 2 − x − 1,5·x<sup>1,5</sup>

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [0,5; 1,5]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [0,5; 1,5]. Qual é x₂?

**Gabarito:** Falsa Posição — 0,8372936797. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 0,8006405985 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 0,8412286547 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,75 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,8823570901 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,8450323151 → Você trocou a ponta errada: substitua a ponta que tem o mesmo sinal de f(x), para manter a raiz cercada. · 0,0134736105 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 116. Adubação N-P-K
*Nível 2 · Agricultura · id `ga18`*

Três fertilizantes (x, y e z kg) têm teores diferentes de N, P e K, e a lavoura precisa de 65 kg de N, 80 de P e 70 de K. **Sistema 3×3: a dose precisa ser exata**, e **a primeira linha (0,1 < 0,2 + 0,05) não é dominante**.

0,1x + 0,2y + 0,05z = 65 ; 0,1x + 0,05y + 0,2z = 80 ; 0,2x + 0,1y + 0,1z = 70

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 100, y ≈ 200, z ≈ 300. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (2.300; -766,6666667; -233,3333333) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (540; -120; 700) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (300; 200; 100) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 117. A maré que libera o barco
*Nível 1 · Navegação · id `fp04`*

A altura da maré num porto é h(t) = 2 + 1,5·cos(0,5t) + 0,3·cos(t) metros, com t em horas. Um barco só sai com h ≤ 2,5 m. **f(t) = h(t) − 2,5 é positiva em t = 0 e negativa em t = 3**, **nesse trecho a maré desce de forma suave** e **a tábua de marés só informa valores, sem derivada**.

f(x) = 2 + 1,5·cos(0,5·x) + 0,3·cos(x) − 2,5

**Pergunta (sem o método):** Faça 1 iteração do método mais indicado no intervalo [0; 3]. Qual é a aproximação obtida na iteração 1?

**Depois do diagnóstico:** Faça 1 iteração da Falsa Posição em [0; 3]. Qual é x₁?

**Gabarito:** Falsa Posição — 1,958920979. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 2,212671618 → Esse é o resultado de uma iteração a mais do que o pedido. · 1,5 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 1,041079021 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,2226698256 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 118. Salário bruto para um líquido desejado
*Nível 2 · Recursos humanos · id `pf15`*

Uma empresa quer pagar R$ 4.000 líquidos. Numa tabela simplificada, o imposto é 27,5% do bruto menos R$ 869,36. Então **bruto = 4000 + imposto(bruto): B = g(B)**. **Cada real a mais de bruto gera só R$ 0,275 de imposto (|g′| = 0,275)**, e o RH parte de **B₀ = 4000**.

x = 4000 + 0,275·x − 869,36

**Pergunta (sem o método):** Partindo de x₀ = 4000, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 4000, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 4.311,50815. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 4.294,066 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · -4,79659125 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 119. Raiz de 3 com duas casas
*Nível 1 · Matemática · id `bi20`*

Para √3, use x² − 3 = 0. **f(1) = −2 e f(2) = 1**, e você quer **saber de antemão quantos passos garantem erro ≤ 0,01**.

f(x) = x<sup>2</sup> − 3

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [1; 2], quantas iterações garantem erro ≤ 0,01?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [1; 2] garantem erro ≤ 0,01?

**Gabarito:** Bisseção — 7. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 2 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 120. ln(x) + x/2 = 2
*Nível 1 · Matemática · id `fp01`*

Para ln(x) + x/2 = 2, **f(2) ≈ −0,31 < 0 < f(3) ≈ 0,60**, e **entre 2 e 3 o gráfico de f é quase uma reta**. Você quer **manter a raiz cercada, mas chegar perto mais rápido do que pelo ponto médio**.

f(x) = ln(x) + x/2 − 2

**Pergunta (sem o método):** Faça 2 iterações do método mais indicado no intervalo [2; 3]. Qual é a aproximação obtida na iteração 2?

**Depois do diagnóstico:** Faça 2 iterações da Falsa Posição em [2; 3]. Qual é x₂?

**Gabarito:** Falsa Posição — 2,319010904. Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 2,338889723 → Esse é o resultado de uma iteração a menos. Conte de novo: a 1ª iteração já produz o primeiro corte x₁. · 2,25 → Esse é o ponto médio da Bisseção. Na Falsa Posição o corte é onde a corda cruza o eixo: x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 2,331867245 → f(a) e f(b) trocados na fórmula. O correto é x = (a·f(b) − b·f(a))/(f(b) − f(a)). · 0,0006462125 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 121. Análise nodal de rede grande
*Nível 2 · Engenharia elétrica · id `gs06`*

A análise nodal de uma rede elétrica com centenas de nós gera **uma matriz esparsa e diagonal dominante**. Para treinar, use este trecho 4×4 e **as tensões medidas ontem como chute**.

5x − y − 2z = 9 ; −x + 5y − u = 13 ; −2x + 6z − u = 7 ; −y − z + 4u = 12

**Pergunta (sem o método):** Partindo de (3; 4; 3; 5), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (3; 4; 3; 5), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 3,8, y ≈ 4,36, z ≈ 3,266666667, u ≈ 4,906666667. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (3,8; 4,2; 3; 4,75) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (3,978666667; 4,377066667; 3,310666667; 4,921933333) → Esse é o resultado de uma iteração a mais do que o pedido.

### 122. Sistema 3×3 clássico
*Nível 1 · Matemática · id `ga19`*

Resolva x + y + z = 6, 2x − y + z = 3 e x + 2y − z = 2. **Três incógnitas, solução exata**; **nenhuma linha tem dominância diagonal**.

x + y + z = 6 ; 2x − y + z = 3 ; x + 2y − z = 2

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 1, y ≈ 2, z ≈ 3. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (7,571428571; -0,7142857143; -0,8571428571) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (2,777777778; -2,666666667; 5,888888889) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (3; 2; 1) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 123. Ponto de operação do diodo
*Nível 2 · Eletrônica · id `pf10`*

Num circuito com fonte de 5 V, resistor de 1 kΩ e um diodo, a corrente I (em mA) satisfaz **I = 5 − 0,02585·ln(10⁹·I + 1): a corrente que sobra depois da queda no diodo**. **A queda no diodo quase não muda com I (|g′| ≈ 0,006)**, então a iteração parte de **I₀ = 5 mA, como se o diodo não existisse**.

x = 5 − 0,02585·ln(1000000000·x + 1)

**Pergunta (sem o método):** Partindo de x₀ = 5, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 5, faça 2 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₂?

**Gabarito:** Ponto Fixo — 4,425871083. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 1,8530·10<sup>−5</sup> → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 124. Ingressos do show
*Nível 1 · Comércio · id `ga02`*

Foram vendidos 120 ingressos, meia (x) a R$ 15 e inteira (y) a R$ 25, totalizando R$ 2.400. **Duas equações, duas incógnitas, resposta exata**; os coeficientes **não têm dominância diagonal**.

x + y = 120 ; 15x + 25y = 2400

**Pergunta (sem o método):** Resolva o sistema. Qual é o valor de y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Qual é o valor de y?

**Gabarito:** Eliminação de Gauss — 60. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** 240 → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · 105 → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 125. Modo de vibração de um prédio
*Nível 3 · Engenharia civil · id `nw16`*

O primeiro modo de vibração de um prédio de três andares sai da menor raiz de λ³ − 7λ² + 14λ − 7 = 0. **A derivada 3λ² − 14λ + 14 é um polinômio simples**, **a estimativa de Rayleigh dá λ₀ = 0,65** e o projeto pede **seis casas no menor número de passos**.

f(x) = x<sup>3</sup> − 7·x<sup>2</sup> + 14·x − 7

**Pergunta (sem o método):** Partindo de x₀ = 0,65, encontre a raiz com 6 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 0,65, itere Newton-Raphson até a variação ficar menor que 10<sup>−7</sup>. Qual é a raiz, com 6 casas decimais?

**Gabarito:** Newton-Raphson — 0,7530203963 (tolerância 6e-7). Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 2,445041868 → Essa é outra raiz da mesma equação. O problema pede a raiz no intervalo dado (ou a que tem sentido físico, perto do chute). · 3,801937736 → Essa é outra raiz da mesma equação. O problema pede a raiz no intervalo dado (ou a que tem sentido físico, perto do chute).

### 126. Preço de equilíbrio do mercado
*Nível 2 · Economia · id `sc13`*

Demanda e oferta foram ajustadas a dados: D(p) = 200p<sup>−0,8</sup> e O(p) = 15p<sup>0,6</sup>. O equilíbrio zera D − O. **As curvas vieram de um ajuste de dados; não há derivada pronta**, e **os preços do mês passado, 3 e 4, servem de palpites, do mesmo lado da raiz**.

f(x) = 200·x<sup>−0,8</sup> − 15·x<sup>0,6</sup>

**Pergunta (sem o método):** Com x₀ = 3 e x₁ = 4, faça 1 iteração do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Com x₀ = 3 e x₁ = 4, faça 1 iteração da Secante. Qual é x₂?

**Gabarito:** Secante — 5,398370188. Sem derivada disponível (ou cara de obter) e com dois palpites que não cercam a raiz: a Secante aproxima f′ pelos dois últimos pontos e converge rápido (ordem ≈ 1,6), com uma avaliação de f por passo. Sem troca de sinal, Bisseção e Falsa Posição nem começam.

**Erros típicos reconhecidos:** 6,112546973 → Esse é o resultado de uma iteração a mais do que o pedido. · 2,601629812 → Sinal trocado: xₖ₊₁ = xₖ − f(xₖ)·(xₖ − xₖ₋₁)/(f(xₖ) − f(xₖ₋₁)). · 10,65390982 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 127. Ganho do amplificador saturado
*Nível 3 · Telecomunicações · id `pf18`*

O ganho G de um amplificador óptico saturado satisfaz **G = 10/(1 + 0,5G)**. **|g′(G*)| ≈ 0,64 < 1: a iteração oscila, mas converge**, e o técnico parte de **G₀ = 2**.

x = 10/(1 + 0,5·x)

**Pergunta (sem o método):** Partindo de x₀ = 2, encontre a solução com 3 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 2, itere xₖ₊₁ = g(xₖ) até |xₖ₊₁ − xₖ| < 10<sup>−4</sup>. Qual é o ponto fixo, com 3 casas decimais?

**Gabarito:** Ponto Fixo — 3,582575695 (tolerância 0,0006). A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 2,857142857 → Você parou cedo demais: a variação entre dois valores seguidos ainda estava acima do limite pedido.

### 128. Preço de dois produtos
*Nível 1 · Comércio · id `ga15`*

Dois cadernos e três canetas custam R$ 18; cinco cadernos e duas canetas custam R$ 23. **Sistema 2×2 com preço exato**; **na primeira linha 2 < 3: sem dominância**.

2x + 3y = 18 ; 5x + 2y = 23

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x e y?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x e y?

**Gabarito:** Eliminação de Gauss — x ≈ 3, y ≈ 4. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (15,27272727; -4,181818182) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-1,736842105; 7,157894737) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ. · (4; 3) → Os valores estão certos, mas na ordem trocada. Confira qual incógnita é qual.

### 129. Ponto de bolha benzeno-tolueno
*Nível 3 · Engenharia química · id `fp17`*

Uma mistura com 50% de benzeno e 50% de tolueno começa a ferver quando 0,5·P_benz(T) + 0,5·P_tol(T) = 760 mmHg, com as pressões de vapor da equação de Antoine. **A 80 °C a mistura ainda não ferve e a 100 °C já ferve**, **a soma das pressões é suave, quase reta nessa faixa**, e **derivar as exponenciais de Antoine à mão é trabalhoso**.

f(x) = 0,5·10<sup>6,90565 − 1211,033/(220,79 + x)</sup> + 0,5·10<sup>6,95464 − 1344,8/(219,482 + x)</sup> − 760

**Pergunta (sem o método):** Encontre a raiz em [80; 100] com 3 casas decimais, mantendo-a sempre cercada. Qual é ela?

**Depois do diagnóstico:** Use a Falsa Posição em [80; 100] até |f(xₖ)| ≤ 0,001. Qual é a raiz, com 3 casas decimais?

**Gabarito:** Falsa Posição — 92,11171983 (tolerância 0,0006). Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 90,98265945 → Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.

### 130. Equilíbrio de um braço articulado
*Nível 1 · Física · id `pf05`*

O equilíbrio de forças de um braço articulado leva a θ = 1 + 0,4·cos(θ), com θ em radianos. **A equação já é θ = g(θ)**, **com |g′| = 0,4·|sen θ| ≤ 0,4**, e **θ₀ = 1 rad**.

x = 1 + 0,4·cos(x)

**Pergunta (sem o método):** Partindo de x₀ = 1, faça 4 iterações do método mais indicado. Qual é x₄?

**Depois do diagnóstico:** Partindo de x₀ = 1, faça 4 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₄?

**Gabarito:** Ponto Fixo — 1,157005854. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 1,167432269 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 1,160833111 → Esse é o resultado de uma iteração a mais do que o pedido. · -0,003827257 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ. · 1,399880616 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 131. Dividir sem dividir
*Nível 1 · Computação · id `nw06`*

Processadores calculam 1/7 sem dividir: resolvem 1/x − 7 = 0 por Newton. **A derivada −1/x² transforma a iteração em xₙ₊₁ = xₙ(2 − 7xₙ), só com multiplicações** e **0,1 é um bom chute para 1/7**.

f(x) = 1/x − 7

**Pergunta (sem o método):** Partindo de x₀ = 0,1, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 0,1, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 0,1417. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 0,13 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,14284777 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,0343 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · 0,0571630205 → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 132. Reservatório em tronco de cone
*Nível 3 · Engenharia civil · id `fp20`*

Um reservatório tem forma de tronco de cone: o fundo tem raio 1 m e o raio cresce 0,2 m por metro de altura. O volume até a altura h é V = (πh/3)(1 + r + r²), com r = 1 + h/5. Que altura guarda 30 m³? **V − 30 é negativo em h = 2 e positivo em h = 5**, **a curva do volume é suave** e **a altura tem de ficar entre 2 e 5 m, as medidas da obra**.

f(x) = π·x/3·(1 + (1 + x/5) + (1 + x/5)<sup>2</sup>) − 30

**Pergunta (sem o método):** Encontre a raiz em [2; 5] com 4 casas decimais, mantendo-a sempre cercada. Qual é ela?

**Depois do diagnóstico:** Use a Falsa Posição em [2; 5] até |f(xₖ)| ≤ 1·10<sup>−6</sup>. Qual é a raiz, com 4 casas decimais?

**Gabarito:** Falsa Posição — 4,439868555 (tolerância 0,00006). Sinais opostos nas pontas e uma curva suave, quase reta no intervalo: a Falsa Posição mantém a raiz cercada como a Bisseção, mas corta onde a corda cruza o eixo e chega perto em bem menos passos, sem derivada.

**Erros típicos reconhecidos:** 4,27487326 → Esse é só o primeiro corte da corda. Continue até |f(x)| ficar abaixo do limite pedido.

### 133. Equilíbrio presa-predador
*Nível 2 · Ecologia · id `nw17`*

Um modelo de equilíbrio leva a x·e⁻ˣ = 0,2, com uma raiz pequena de interesse. **f′(x) = e⁻ˣ(1 − x) é direta** e **a tabela de campo sugere x₀ = 0,3**.

f(x) = x·e<sup>−x</sup> − 0,2

**Pergunta (sem o método):** Partindo de x₀ = 0,3, faça 2 iterações do método mais indicado. Qual é x₂?

**Depois do diagnóstico:** Partindo de x₀ = 0,3, faça 2 iterações de Newton-Raphson. Qual é x₂?

**Gabarito:** Newton-Raphson — 0,2591660878. Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 0,2571025165 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,4358702249 → Sinal trocado na fórmula: o passo de Newton é xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ), com sinal de menos. · -2,8665·10<sup>−6</sup> → Esse é o valor de f na aproximação, não a aproximação. A resposta é o próprio x.

### 134. Suavizar pixels
*Nível 2 · Processamento de imagem · id `gs10`*

Para suavizar uma linha de 3 pixels, cada valor vira uma média com os vizinhos. **A matriz é diagonal dominante** e **os próprios pixels originais (10, 20, 30) são o chute inicial**; numa foto real são **milhões de pixels**.

4x − y = 30 ; −x + 4y − z = 60 ; −y + 4z = 100

**Pergunta (sem o método):** Partindo de (10; 20; 30), faça 1 iteração do método mais indicado. Qual é o vetor depois da iteração 1?

**Depois do diagnóstico:** Partindo de (10; 20; 30), faça 1 iteração de Gauss-Seidel. Qual é o vetor depois da iteração 1?

**Gabarito:** Gauss-Seidel — x ≈ 12,5, y ≈ 25,625, z ≈ 31,40625. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (12,5; 25; 30) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (13,90625; 26,328125; 31,58203125) → Esse é o resultado de uma iteração a mais do que o pedido.

### 135. Nível do tanque esférico
*Nível 2 · Engenharia civil · id `bi03`*

Um tanque esférico de raio 2 m guarda 20 m³ de água. O volume com altura h é V = πh²(3·2 − h)/3. **A altura está fisicamente entre 0 e 4 m, e f muda de sinal nesse intervalo**. A norma exige **erro garantido de no máximo 1 cm**.

f(x) = π·x<sup>2</sup>·(6 − x)/3 − 20

**Pergunta (sem o método):** Antes de calcular qualquer ponto: com o método mais indicado no intervalo [0; 4], quantas iterações garantem erro ≤ 0,01?

**Depois do diagnóstico:** Antes de calcular qualquer ponto médio: quantas iterações da Bisseção em [0; 4] garantem erro ≤ 0,01?

**Gabarito:** Bisseção — 9. Intervalo com sinais opostos e exigência de garantia: a Bisseção nunca sai do intervalo e sua cota de erro, (b − a)/2ⁿ, é conhecida antes de começar. A Falsa Posição também fica no intervalo, mas não oferece essa cota.

**Erros típicos reconhecidos:** 3 → Você usou log na base 10. Cada iteração divide o intervalo por 2, então o logaritmo é na base 2: n ≥ log₂((b − a)/ε).

### 136. PageRank de uma página
*Nível 1 · Redes de computadores · id `pf06`*

Num ranking simplificado, o escore r de uma página que recebe 60% do próprio voto segue r = 0,15 + 0,85·0,6·r. **É a forma r = g(r) do método da potência**, **o fator 0,51 < 1 garante a convergência** e o algoritmo começa com **r₀ = 1**.

x = 0,15 + 0,51·x

**Pergunta (sem o método):** Partindo de x₀ = 1, faça 3 iterações do método mais indicado. Qual é x₃?

**Depois do diagnóstico:** Partindo de x₀ = 1, faça 3 iterações de Ponto Fixo, xₖ₊₁ = g(xₖ). Qual é x₃?

**Gabarito:** Ponto Fixo — 0,398166. A equação já aparece na forma x = g(x), com |g′(x)| < 1 perto da raiz (contração) e um único chute: basta repetir xₖ₊₁ = g(xₖ), sem derivada e sem intervalo.

**Erros típicos reconhecidos:** 0,4866 → Esse é o resultado de uma iteração a menos. Conte de novo: x₀ é o ponto de partida, e a 1ª iteração já produz x₁. · 0,35306466 → Esse é o resultado de uma iteração a mais do que o pedido. · 0,04510134 → Esse é o resíduo x − g(x), não a aproximação. A resposta é o próprio xₖ.

### 137. Rede tridiagonal enorme
*Nível 3 · Engenharia · id `gs03`*

Uma rede com 1000 nós ligados em fila gera uma matriz tridiagonal; aqui está um trecho 4×4. **Cada linha só tem três números não nulos (matriz esparsa)**, **no sistema real o escalonamento encheria a matriz e custaria ~n³** e **a diagonal é estritamente dominante**.

4x − y = 3 ; −x + 4y − z = 2 ; −y + 4z − u = 2 ; −z + 4u = 3

**Pergunta (sem o método):** Partindo de (0; 0; 0; 0), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (0; 0; 0; 0), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 0,921875, y ≈ 0,8984375, z ≈ 0,9541015625, u ≈ 0,9885253906. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (0,875; 0,8125; 0,8125; 0,875) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (0,75; 0,6875; 0,671875; 0,91796875) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (0,974609375; 0,9821777344; 0,9926757812; 0,9981689453) → Esse é o resultado de uma iteração a mais do que o pedido.

### 138. cos(x) = x com seis casas
*Nível 3 · Matemática · id `nw13`*

Você precisa de cos(x) = x **com seis casas decimais e o mínimo de iterações**. **f′(x) = −sen(x) − 1 é fácil e não se anula perto da raiz**; **x₀ = 0,75 é bom**. **A iteração direta x ← cos(x) levaria dezenas de passos (|g′| ≈ 0,67)**.

f(x) = cos(x) − x

**Pergunta (sem o método):** Partindo de x₀ = 0,75, encontre a raiz com 6 casas decimais. Qual é ela?

**Depois do diagnóstico:** Partindo de x₀ = 0,75, itere Newton-Raphson até a variação ficar menor que 10<sup>−7</sup>. Qual é a raiz, com 6 casas decimais?

**Gabarito:** Newton-Raphson — 0,7390851332 (tolerância 6e-7). Derivada fácil de obter e chute inicial bom: Newton-Raphson converge quadraticamente (as casas corretas quase dobram a cada passo).

**Erros típicos reconhecidos:** 0,9998477415 → Sua calculadora estava em graus. Em métodos numéricos (e no Cálculo) os ângulos ficam em radianos.

### 139. Forças numa treliça
*Nível 3 · Estruturas · id `ga13`*

Numa treliça com triângulos 3-4-5, as forças x, y e z (kN) satisfazem 0,8x − 0,6y = 0, 0,6x + 0,8y − z = 40 e 0,6y + z = 108. **A segunda linha não é dominante (0,8 < 0,6 + 1)** e o cálculo estrutural **exige os valores exatos**.

0,8x − 0,6y = 0 ; 0,6x + 0,8y − z = 40 ; 0,6y + z = 108

**Pergunta (sem o método):** Resolva o sistema. Quais são os valores de x, y e z?

**Depois do diagnóstico:** Resolva o sistema por Eliminação de Gauss. Quais são os valores de x, y e z?

**Gabarito:** Eliminação de Gauss — x ≈ 60, y ≈ 80, z ≈ 60. Sistema pequeno, sem dominância diagonal e com pedido de solução exata: a Eliminação de Gauss resolve em um número finito de passos, sem depender de convergência.

**Erros típicos reconhecidos:** (67,78378378; 90,37837838; 72,97297297) → Você atualizou os coeficientes, mas esqueceu o lado direito: a operação Lᵢ ← Lᵢ − m·Lₖ vale também para o termo independente. · (-444; -592; -247,2) → Sinal do multiplicador trocado: para zerar o coeficiente, faça Lᵢ ← Lᵢ − m·Lₖ, com m = aᵢₖ/aₖₖ.

### 140. Ranking de três páginas
*Nível 2 · Redes de computadores · id `gs20`*

Um ranking no estilo PageRank para três páginas (1 → 2 e 3; 2 → 3; 3 → 1), com amortecimento 0,5 e escore base 1, leva a r = 1 + 0,5·M·r. **Em cada linha, a diagonal 1 supera a soma do resto (no máximo 0,75): dominante**, e **o chute uniforme (1, 1, 1) é natural**. Na web real são **bilhões de páginas**.

x − 0,5z = 1 ; −0,25x + y = 1 ; −0,25x − 0,5y + z = 1

**Pergunta (sem o método):** Partindo de (1; 1; 1), faça 2 iterações do método mais indicado. Qual é o vetor depois da iteração 2?

**Depois do diagnóstico:** Partindo de (1; 1; 1), faça 2 iterações de Gauss-Seidel. Qual é o vetor depois da iteração 2?

**Gabarito:** Gauss-Seidel — x ≈ 2,03125, y ≈ 1,5078125, z ≈ 2,26171875. Matriz estritamente diagonal dominante (convergência garantida), sistema grande ou esparso, ou boa aproximação inicial: Gauss-Seidel refina a solução com custo baixo por iteração.

**Erros típicos reconhecidos:** (1,875; 1,375; 2) → Esse é o resultado de Jacobi: você usou só os valores da iteração anterior. No Gauss-Seidel, cada incógnita já usa os valores que acabaram de ser calculados. · (1,5; 1,375; 2,0625) → Esse é o resultado de uma iteração a menos. Conte de novo: o vetor inicial não conta, e a 1ª iteração já atualiza todas as incógnitas. · (2,130859375; 1,532714844; 2,299072266) → Esse é o resultado de uma iteração a mais do que o pedido.

