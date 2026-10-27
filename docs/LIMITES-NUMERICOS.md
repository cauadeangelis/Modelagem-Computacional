# Critérios e limites do motor numérico

## A promessa correta

O aplicativo fornece **aproximações numéricas verificadas por critérios específicos**, dentro de um conjunto de sintaxes e métodos. Ele não resolve qualquer problema de Cálculo 4 e não prova a existência, a unicidade ou a completude das raízes de uma função geral.

## Raízes

- Métodos no motor: Bisseção, Falsa Posição, Ponto Fixo, Newton-Raphson e Secante. Na v11, o Ponto Fixo está escondido do site (Terminal incluído) a pedido da professora; o que este documento diz sobre ele vale quando ele voltar (`C.HIDDEN=[]` em `content.js`).
- Tolerância manual permitida: de 1e−12 inclusive a 1 exclusivo; limite de 1 a 500 iterações.
- Critério de aceitação: resíduo absoluto |f(x)| menor ou igual à tolerância **e** uma certificação local (v10, abaixo). Estagnação com resíduo maior não é sucesso.

### Certificação de raízes (v10)

Resíduo pequeno sozinho não prova nada: 1e−20·(x² + 1) tem |f| < 1e−12 em toda parte e não tem raiz real. Por isso, sempre que |f(x)| ≤ tolerância, o motor examina a vizinhança de x antes de aceitar:

| Estado | Critério | O que o Terminal faz |
|---|---|---|
| **Raiz certificada** | f troca de sinal num intervalo em volta de x de largura 10⁻¹⁵·(1 + \|x\|)·4ᵏ, k = 0 a 20 (até ~1e−3 relativo), com os dois valores acima do ruído de arredondamento | aceita; a aba Verificação mostra o intervalo |
| **Raiz provável de multiplicidade par** | sem troca de sinal, mas uma busca pela seção áurea do mínimo de \|f\| em raios 10⁻³, 10⁻² e 10⁻¹ (relativos) chega ao nível do ruído, e ali também não há troca de sinal | aceita com aviso: "existência não certificada por troca de sinal", como em (x − a)² |
| **Quase-raiz** | o mínimo de \|f\| fica dentro do raio e acima do ruído: a curva se aproxima do eixo e se afasta sem tocar | **rejeitada**: o resultado aparece como "Ponto testado: não é raiz", com o menor \|f\| encontrado, e não entra no histórico |
| **Longe** | nada disso perto de x, ou uma raiz simples mais adiante | Bisseção e Falsa Posição continuam dividindo; Newton, Secante e Ponto Fixo continuam iterando |

O **ruído de arredondamento** é estimado pela árvore da expressão: cada soma ou subtração contribui com 32·ε·(|termo esquerdo| + |termo direito|), onde ε ≈ 2,2·10⁻¹⁶. Assim, x¹⁰⁰ − 10¹⁰ perto da raiz tem ruído da ordem de 10⁻⁵ (e a raiz é certificada por troca de sinal), enquanto 1e−20·(x − 0,3) tem ruído da ordem de 10⁻³⁵ (e a raiz em 0,3 é encontrada, não a primeira ponta do intervalo). No Ponto Fixo a certificação é feita em h(x) = x − g(x).

Limites desta certificação: ela é local (não diz se há outras raízes), depende de f ser contínua perto de x e pode chamar de "raiz dupla provável" uma equação sem raiz cuja distância ao eixo é menor que o arredondamento (ex.: (x − 1)² + 10⁻³⁰). Esse caso não tem como ser separado em ponto flutuante de 64 bits.
- Newton usa diferenças centrais para aproximar a derivada. As duas avaliações extras por derivada são incluídas na comparação de custo.
- Bisseção registra a meia largura do intervalo. Essa cota de erro depende da continuidade e da manutenção de uma raiz no intervalo. O programa não prova continuidade para expressões arbitrárias.
- A Secante verifica também o primeiro ponto inicial e rejeita denominador sem separação numericamente utilizável.
- **Falsa Posição (v9):** exige a < b e sinais opostos em f(a) e f(b), como a Bisseção. O critério de parada é |f(x)| ≤ tolerância; a tabela mostra a variação entre aproximações, porque a largura do intervalo pode não ir a zero (uma ponta fica parada em curvas convexas ou côncavas). Quando uma ponta fica parada por 3 ou mais iterações seguidas, a observação da execução avisa. É a versão clássica, sem a modificação de Illinois.
- **Ponto Fixo (v9):** itera xₖ₊₁ = g(xₖ) e para quando |xₖ − g(xₖ)| ≤ tolerância (o resíduo de x − g(x) = 0). No Terminal, g(x) vem do campo próprio ou, se ele ficar vazio, do lado direito de uma equação escrita como x = …; a aba Verificação substitui o resultado também na equação original. Divergência (valores acima de 10¹⁵) e saída do domínio de g param a execução com mensagem. A observação estima |g′| no ponto final por diferenças centrais: abaixo de 1 indica contração e convergência linear; acima de 1, que aquela reescrita é ruim. A escolha de g é do usuário: o motor não gera g automaticamente.
- Funções reais podem estar indefinidas em partes do domínio. Pontos não finitos são descartados da amostragem; uma execução manual pode parar com erro de domínio.

### Intervalo [a, b] do exercício (v10.1)

- **Onde informar:** nos campos a e b logo abaixo da equação, ou no fim dela: `x³ − 9x + 3 = 0 em [0; 1]`, `[0, 1]`, `no intervalo [1,5; 2]`, `x ∈ [0, 1]`, `I = [0; 2]`. Com vírgula decimal, as pontas se separam por ponto e vírgula; com ponto decimal, por vírgula. Pontas podem ser constantes (`pi/2`, `sqrt(2)`), nunca expressões com x. É preciso a < b, e f precisa ter valor real finito nas duas pontas.
- **Bisseção e Falsa Posição:** o intervalo é obrigatório e precisa de f(a)·f(b) < 0. Com o mesmo sinal, o Terminal não começa: varre [a, b] em 400 pedaços, descarta trocas de sinal causadas por polos (|f| não encolhe quando o pedaço é dividido) e sugere até 4 sub-intervalos "redondos" com troca de sinal. Sem nenhuma troca, informa se a busca achou uma raiz de multiplicidade par (a curva só toca o eixo), que a Bisseção não encontra.
- **Newton:** sem x₀, começa na ponta onde f(x)·f″(x) > 0 (condição de Fourier, f″ estimada por diferenças finitas para dentro do intervalo); se nenhuma ponta satisfaz, no ponto médio. A condição de Fourier garante convergência monotônica quando f′ e f″ não mudam de sinal em [a, b]; o Terminal não verifica essa hipótese.
- **Secante:** sem x₀ e x₁, usa x₀ = a e x₁ = b.
- **Ponto Fixo:** sem x₀, usa o ponto médio. O Terminal amostra 41 pontos de [a, b] e informa max |g′| e se g leva o intervalo nele mesmo (hipóteses do teorema do ponto fixo). É uma checagem amostrada, não uma prova.
- **Automático:** a busca de 801 amostras fica restrita a [a, b] (largura até 1.000.000). Se f troca de sinal nas pontas e há uma única raiz, a comparação de custo parte dos dados do exercício: [a, b] na Bisseção e na Falsa Posição, o x₀ de Fourier no Newton e as pontas na Secante. Com várias raízes, todas aparecem.
- **Raiz fora do intervalo:** Newton, Secante e Ponto Fixo podem sair de [a, b]. A raiz é válida, mas o resultado avisa que não é a raiz pedida ("Raiz fora do intervalo pedido").
- **Várias raízes:** se f troca de sinal mais de uma vez em [a, b], o resultado avisa e oferece os outros pedaços.
- **Critério de parada:** continua |f(x)| ≤ ε. Na Bisseção, o resultado mostra também n ≥ log₂((b − a)/ε), o número de iterações do critério da largura do intervalo, que muitos livros usam. Os dois critérios podem dar números de iterações diferentes.

### Automático

São amostrados 801 pontos em [mínimo,máximo], inicialmente [−40,40]. Candidatas vêm de valores nulos amostrados, mudanças de sinal ou mínimos locais de |f|. Desde a v7, perto de cada mínimo local de |f| (inclusive amostras nulas ou empatadas) o intervalo é dividido em 64 partes para revelar raízes coladas, e as bordas do domínio (pontos onde f deixa de ser finita) são aproximadas em 4 níveis. Até 400 candidatas são testadas — primeiro as trocas de sinal, depois os mínimos locais, cada grupo pela proximidade de zero — com teto de 400.000 avaliações de f. Resultados com diferença relativa menor que 1e−5 são agrupados.

Para cada candidata, Bisseção, Falsa Posição, Newton e Secante usam suas condições iniciais correspondentes (o Ponto Fixo não entra na comparação automática, porque depende de uma g escolhida pelo usuário). A comparação exige resíduo até 1e−12, permanência na região candidata e uma checagem local adicional da redução do resíduo. Quando nenhum método atinge 1e−12 porque o arredondamento dos termos de f é maior que isso (ex.: x¹⁰⁰ = 10¹⁰), uma candidata com troca de sinal é levada pela Bisseção até intervalos do tamanho da precisão da máquina; se f troca de sinal ali e |f| encolheu pelo menos 1000 vezes em relação às pontas iniciais (o que exclui polos e saltos), a raiz é aceita como **certificada por troca de sinal** e a aba Verificação explica o critério. Entre as execuções aceitas, escolhe-se menor quantidade de avaliações de f; em empates, vence quem fez menos atualizações (sem contar os pontos iniciais) e, depois, o menor resíduo. A busca e as demais tentativas têm custo adicional, exposto na saída.

Mínimos locais de |f| ajudam a encontrar raízes de multiplicidade par, mas não garantem detectá-las. Funções com oscilações mais rápidas que a amostragem, raízes mais próximas que o refino local (cerca de 0,003 na faixa padrão), escalas extremas e raízes fora da faixa ainda podem ser perdidas. Uma equação sem raiz real, mas tão próxima de ter uma que a diferença fica abaixo do arredondamento, pode ser apresentada como raiz dupla provável (nunca como raiz certificada). Se a diferença ficar acima do arredondamento, como em (x − 1,337)² + 9·10⁻¹³, a v10 a rejeita como quase-raiz. Resíduo pequeno em raiz múltipla pode coexistir com erro em x significativamente maior: em (x − a)², |f| ≈ 10⁻¹⁶ já ocorre com |x − a| ≈ 10⁻⁸.

Amostragem não determina se todas as raízes foram encontradas. “Nenhuma raiz detectada” também não prova ausência. Um valor numérico exatamente zero pode resultar de arredondamento/underflow. O motor rejeita expressões nulas em todas as amostras finitas como identidade ou perda de precisão, sem atribuir uma raiz isolada.

### Gráfico de convergência (v9)

- Todos os métodos partem dos mesmos dados: os do usuário no modo manual; no automático, um intervalo “redondo” em volta da raiz encontrada, com uma única troca de sinal, e x₀ e x₁ dentro dele (a busca automática costuma deixar intervalos pequenos demais para comparar).
- O erro é |xₖ − x*|, com x* = a aproximação mais precisa disponível perto da raiz, polida por Newton. Valores abaixo de 10⁻¹⁵·(1 + |x*|) são o limite do ponto flutuante e aparecem na linha “limite da precisão do computador”.
- A ordem observada é a inclinação da reta de mínimos quadrados de ln eₖ₊₁ contra ln eₖ, usando só os erros entre 10⁻¹³ e 0,5 (em escala relativa). Com poucos pontos (Newton costuma ter 2 ou 3), é uma estimativa: a Secante pode aparecer com 1,4 a 1,7 em vez de 1,618.
- **Desfecho de cada série (v10):** *convergiu* (atingiu o critério ou chegou a 10⁻¹⁰·(1 + |x*|)), *parcial* (parou pelo limite de iterações, por pequena variação ou por quase-raiz sem atingir o critério), *divergiu* (o erro final é mais de 10 vezes o menor erro visto), *falhou* (o método não pôde rodar com estes dados) ou *outra raiz*. Parcial e divergência continuam no gráfico, tracejadas e com selo em texto; as duas últimas saem do gráfico e aparecem listadas com o motivo. A tabela mostra o desfecho no cabeçalho de cada coluna.
- Um método que termina longe de x* (outra raiz) ou que não pôde rodar sai do gráfico e aparece listado com o motivo.
- Em sistemas, o gráfico compara Gauss-Seidel e Jacobi (só como referência didática) a partir do mesmo vetor inicial; a Eliminação de Gauss é direta e aparece só no texto, com a contagem de operações. A divergência lenta também é detectada: além do erro passar de 10 vezes o inicial, conta como divergência uma taxa média de crescimento acima de 1,001 nas últimas 10 iterações com o erro final 50% acima do menor.

## Sistemas lineares

- De 2 a 6 equações e igual número de incógnitas; coeficientes reais finitos.
- Parser de expressões lineares por árvore sintática. Produtos entre incógnitas, divisões por incógnitas e funções não lineares são rejeitados.
- Gauss com pivotamento parcial e retrossubstituição; Gauss-Seidel com atualização sequencial.
- Teste de posto numérico para impedir apresentação de uma solução como única em sistema dependente. **Desde a v10, o teste é feito depois de equilibrar a escala:** cada linha e cada coluna são divididas pelo seu maior |coeficiente| (duas passadas), o que não muda o posto. Assim 1e−20·x = 1e−20 e y = 1 tem a solução (1, 1) aceita, em vez de ser rejeitada como dependente. A eliminação em si continua com pivotamento parcial comum, como ensinado na trilha; só rejeita pivô exatamente zero.
- Mensagens distintas: **incompatível** (o posto de [A | b] é maior que o de A: nenhuma solução), **dependente ou mal condicionado demais** (os postos são iguais e menores que n) e, quando a solução sai, **mal condicionado** com o número de condição κ∞ = ||A||∞·||A⁻¹||∞ (calculado na matriz equilibrada) e quantos dígitos se perdem, sempre que κ > 10⁸.
- O teste continua sendo uma decisão em ponto flutuante: uma matriz com κ acima de ~10¹⁵ pode ser tratada como dependente.
- Critério normalizado: η = ||Ax−b||∞ / (||A||∞ ||x||∞ + ||b||∞). Gauss-Seidel exige também variação ≤ tolerância·(1+||x||∞).
- O normalizador reduz a dependência da escala. Um pequeno resíduo normalizado não garante pequeno erro no vetor solução quando a matriz é mal condicionada.
- Comparação simplificada: Gauss ≈ 2n³/3+2n²; Seidel ≈ 2kn². Não inclui todo o custo de validação, pivotamento, memória ou interface. Não mede tempo.
- Não se fornece solução paramétrica de sistemas dependentes. O terminal informa a limitação e solicita conferência das equações.

## Referências para conferência

Conteúdo explicativo autoral; fórmulas e condições podem ser conferidas nos textos dos próprios autores:

- Tobin A. Driscoll e Richard J. Braun, *Fundamentals of Numerical Computation*, Newton: https://fncbook.com/newton/
- Driscoll e Braun, métodos de interpolação e Bisseção: https://fncbook.com/secant/
- Richard Barrett et al., *Templates for the Solution of Linear Systems*, Gauss-Seidel, Netlib: https://www.netlib.org/linalg/html_templates/node14.html

As referências sustentam os conceitos matemáticos, não uma alegação de eficácia educativa do aplicativo.
