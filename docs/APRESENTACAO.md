# Roteiro de apresentação — 14 a 16 minutos

> Versão 12. Os blocos (v11) e (v12) são os mais recentes; se o tempo for curto, priorize 1, 1d, 1c, 1e, 4c, 4d e 5b. **Abra a apresentação com o bloco 1d: jogar o Quem Divergiu? com a professora e a turma** é o melhor jeito de mostrar o projeto, porque todo mundo participa.

## 1. Proposta — 40 segundos

“A Numera Academy é um jogo para aprender métodos numéricos de Modelagem Computacional. A pessoa entende a ideia, observa o algoritmo, pratica e aplica a um problema. Tem dois jogos: a Calculândia, uma aventura 3D, e o Quem Divergiu?, que a gente vai jogar agora com a sala. O terminal funciona como ferramenta de investigação e conferência.”

Explique que esta versão cobre **seis métodos** (Bisseção, Falsa Posição, Newton-Raphson, Secante, Gauss e Gauss-Seidel), e não toda a disciplina de Cálculo 4. O Ponto Fixo está pronto no projeto, mas escondido por enquanto, a pedido da professora; volta com uma linha.

## 1d. Quem Divergiu? com a turma — 3 a 4 minutos (v12)

Prepare antes:
- abra `/jogos/quem-divergiu/` no computador do projetor e clique em ⛶ (tela cheia);
- em "A turma", use **4 times por fileira** (ou os nomes de 4 a 6 colegas que topem participar);
- escolha 3 rodadas no modo **Telão**, com os temas que a turma já viu e o relógio de 1 minuto.

Na hora:

1. "Profa., a primeira rodada é sua também." Leia a pergunta em voz alta: cada fileira escreve o palpite no caderno, sem mostrar.
2. **Votação:** cada fileira diz em quem vota ("quem divergiu?"). Toque no nome: os votos só aparecem juntos, com o rufar de tambor.
3. **Palpites:** cada fileira mostra o caderno e você digita. A tela mostra na hora como leu o número; vale vírgula, fração e 1e-6.
4. **Revelar a resposta:** os palpites caem na reta, a resposta cai por último e aparecem as faixas de 1%, 5% e 20%. Carimbos DIVERGIU! e CONVERGIU! nas carteiras.
5. Clique em **Como se calcula**: o passo a passo aparece no quadro, e a professora pode explicar. É aqui que o jogo vira aula: "erro relativo de 0,4% está dentro da tolerância de 1%".
6. Mostre o **placar** e, na última rodada, o **pódio** com os títulos (Olho de Newton, Detetive do erro…).

Frase de fechamento: "a pontuação é o critério de parada dos métodos: quanto menor o erro relativo, mais perto de convergir".

Se perguntarem como funciona sem internet: tudo roda no computador, e as respostas são calculadas pelo motor do site e conferidas nos testes.

## 1e. Calculândia — 60 segundos (v12)

Abra **Jogos → Jogar a Calculândia**. Mostre a ilha e ande até a Padaria do Truncamento, o primeiro acampamento (WASD ou toque no chão). Entre na fase e mostre o quadro tático: cada operação gasta bateria e mostra o erro. Na região seguinte, as fases de Bisseção, Newton e Secante pedem para arrastar o intervalo e a mira no gráfico. "São 63 fases, 21 métodos, cinco chefões e a Usina, que junta sistema linear, função e EDO."

Volte pelo botão **← Numera Academy**: a página Jogos já mostra as estrelas que você ganhou.

Num computador sem placa de vídeo, use Menu → Opções → Qualidade leve.

## 1b. Abertura interativa — 30 segundos (v6)

Na página inicial, a demonstração roda sozinha. Toque no gráfico para assumir o controle, arraste o ponto azul e clique em **Dar o próximo passo** algumas vezes: o Newton-Raphson chega à raiz de x³ − x − 2. Depois arraste x₀ para perto de 0,6 e mostre o aviso de tangente quase horizontal. Troque para **Bisseção** e **Secante** para comparar os três métodos no mesmo gráfico.

Em Trilhas → Bisseção, mostre o caminho em três níveis e abra "Entenda o método": é uma lição em tela cheia, uma ideia por tela.

## 1c. A jornada e o casal Raiz e Pivô — 90 segundos (v11)

Prepare antes: um navegador com o progresso zerado (janela anônima serve).

1. Abra **Trilhas**. "Agora o jogo é uma jornada do mais fácil ao mais difícil." Mostre o mapa: Bisseção (★, Fácil) aberta e os outros cinco mundos com cadeado. Role até **Por que essa ordem?**: a ordem segue o que cada método exige de quem resolve (sinal → corda → derivada → dois pontos sem garantia de cerco → matriz → iteração com critério de convergência) e o que a pesquisa encontrou. Frase de efeito: "num estudo com 68 alunos, 77,9% acertaram a fórmula do Newton, mas só 34,8% entenderam o princípio da Secante; por isso a Secante vem depois do Newton".
2. Clique na **Falsa Posição**: a leitura e a simulação estão liberadas, só os desafios esperam o Nível 1 da Bisseção.
3. Abra a **Bisseção** e comece os desafios. Mostre **Raiz** (o rabanete, a raiz que a gente procura) e **Pivô** (o bloquinho de matriz de luvas de boxe, o pivô da Eliminação de Gauss) dançando no canto. Erre uma de propósito: a Raiz murcha, o Pivô bate a luva na testa e solta uma frase como "Divergiu… bora de novo.".
4. Acerte três seguidas: as bolinhas do topo enchem, o **Pivô salta, soca a caixa Σ** e caem moedas que voam até o contador. Acerte a quarta: Nível 1 concluído, confete e "Mundo 2, Falsa Posição, liberado".
5. Volte ao mapa (a Falsa Posição abriu) e mostre o **modo livre**, para quem quer estudar fora da ordem. Em **Progresso → Camarim**, compre o **laço de fita** para a Raiz com as moedas ganhas.

Se perguntarem por que os mascotes não aparecem no Treino: "na avaliação, nada de distração".

## 2. Aprendizado — 90 segundos

Abra Trilhas → Bisseção.

- Em **Entenda**, mostre continuidade e mudança de sinal: as condições importam tanto quanto a fórmula.
- Em **Experimente**, avance alguns passos e mostre o intervalo diminuindo.
- Em **Pratique**, faça a primeira questão e mostre o feedback, as estrelas, o XP e as moedas.
- Erre uma questão para demonstrar a orientação e o registro no caderno de revisão.

## 2b. Aulas em vídeo — 30 segundos (v10)

Ainda na página da trilha da Bisseção, role até **Aulas em vídeo**. São 3 aulas por método (duas em português, uma em inglês), escolhidas e conferidas uma a uma. Clique em **Assistir aqui**: o player do YouTube abre na própria página. Só nesse momento o site fala com o YouTube; antes disso nada é carregado de fora. O link **Abrir no YouTube** leva ao vídeo original, com o crédito do professor.

A última tela de **Entenda o método** também traz as aulas: a pessoa lê, assiste e volta para praticar.

## 3. Modelagem — 60 segundos

Abra Missões → O reservatório cúbico.

Explique as três etapas: reconhecer V=x³, resolver x³−4=0 e interpretar x≈1,587401 m. A raiz precisa fazer sentido físico; a matemática não termina no cálculo.

## 4. Terminal — 90 segundos

Digite `x² − 2 = 0` (no teclado do computador, digite ^ e o 2 sobe sozinho).

- Mostre as candidatas positiva e negativa detectadas.
- Abra **Comparar métodos**: o menor custo observado não é uma promessa universal de rapidez.
- Abra **Passo a passo** e **Verificação**.
- Em **Resolver comigo**, calcule uma atualização.

Depois digite:

```text
2x+y=5
x+3y=6
```

Mostre x=1,8 e y=1,4; substitua nas equações para conferir.

## 4a. Intervalo do exercício — 45 segundos (v10.1)

Use um exercício no formato da aula: "calcule a raiz de x³ − 9x + 3 no intervalo [0, 1] pela Bisseção".

1. Digite `x³ − 9x + 3 = 0 em [0; 1]`, escolha **Bisseção** no campo Método e resolva. O intervalo sai da equação e vai para os campos a e b; o resultado mostra f(0) = 3 e f(1) = −5 (sinais opostos, então há raiz pelo Teorema do Valor Intermediário), o gráfico marca as pontas e a raiz 0,33761.
2. Troque o intervalo para [0; 3] e resolva de novo. Como f(0) e f(3) valem 3, a Bisseção não pode começar, e o Terminal mostra onde f troca de sinal: [0,3; 0,4] e [2,8; 2,9]. Clique em uma das sugestões.
3. Escolha **Newton** com o campo x₀ vazio: ele começa na ponta onde f(x)·f″(x) > 0 (condição de Fourier), como no livro.

## 4b. Teclado científico — 45 segundos (v7)

No Terminal, clique em **C** e monte a equação só com as teclas: `x`, `xⁿ`, `2`, `0`, `−`, `3`, `x`, `xⁿ`, `1`, `0`, `+`, `2`, `=`, `0`. O campo mostra **x²⁰ − 3x¹⁰ + 2 = 0** sem nenhum `^`. Resolva: aparecem as 4 raízes (±1 e ±1,0718), duas delas a 0,07 uma da outra.

Depois digite `x¹⁰⁰ − 10000000000 = 0` no teclado do computador (digite ^ e o 100 sobe sozinho) e abra **Verificação**: a raiz 1,2589 é **certificada por troca de sinal**, porque o resíduo 1e−12 é impossível com termos da ordem de 10¹⁰. Bom gancho para falar de arredondamento em ponto flutuante e do Teorema do Valor Intermediário.

Os testes estão em `TESTES-TERMINAL.md`: 100 equações conferidas uma a uma no navegador (v6: 93; v7: 100) e mais 1.400 casos aleatórios.

## 4c. Treino — 75 segundos (v8, ampliado na v9)

Abra **Treino**. Mostre o tabuleiro de 120 casas e explique: "os métodos estão misturados de propósito, porque a primeira pergunta de um problema real é qual método usar".

- Mostre que, antes do diagnóstico, a pergunta **não diz o método** ("faça 2 iterações do método mais indicado").
- Abra o exercício 2 (velocidade do drone) e escolha **Bisseção** de propósito. O site mostra que a melhor escolha era a **Falsa Posição** e explica por quê; as pistas aparecem grifadas: "sinais opostos nas pontas", "curva quase reta", "raiz sempre cercada".
- Digite **20,5** (o ponto médio). Aparece **"Erro típico identificado"**: "esse é o ponto médio da Bisseção; na Falsa Posição o corte é onde a corda cruza o eixo". Depois responda 20,2915.
- Abra o **gabarito** e role até o **gráfico de convergência** deste problema.
- Feche com os números: 140 gabaritos calculados com sympy/mpmath (120 à vista enquanto o Ponto Fixo está escondido) e conferidos pelo motor do site, 369 erros típicos previstos, 0 divergências.

## 4d. Convergência — 45 segundos (v9)

No Terminal, clique no exemplo **Cosseno** (cos(x) − x = 0), resolva e abra a aba **Convergência**.

- "Cada linha horizontal do gráfico é um fator de 10 no erro."
- A Bisseção é uma reta: perde o erro pela metade a cada passo (fator ≈ 0,5, ordem 1). A Falsa Posição também é linear, mas com fator menor.
- A Secante e o Newton mergulham cada vez mais rápido: ordem observada ≈ 1,6 e ≈ 2. "Ordem 2 quer dizer que as casas corretas quase dobram a cada passo."
- Passe o mouse no gráfico para mostrar o erro de cada método em uma iteração; com Tab e as setas, dá para fazer o mesmo pelo teclado.
- (Quando o Ponto Fixo voltar: digite `x = cos(x)`, escolha **Ponto Fixo** e resolva. Aparece o **diagrama em teia**: os valores oscilam em volta de 0,739 porque g′ é negativa, e convergem porque |g′| ≈ 0,67 < 1.)

## 4e. Modo prova — 45 segundos (v9)

Em **Treino → Modo prova**, escolha 5 questões e 20 minutos e comece. Mostre o cronômetro, a escolha do método (vale 0,4) e a resposta (vale 0,6), sem gabarito durante a prova. Entregue e mostre a **nota** e o **relatório** com o erro típico de cada questão errada. Clique em **Imprimir ou salvar em PDF**: sai só o relatório, pronto para entregar.

Mostre também a **Revisão**: os diagnósticos errados da prova entram no caderno e voltam em 1, 3, 7 e 14 dias.

(v10) Se o cronômetro chegar a zero, a prova é encerrada sozinha e o relatório abre com o aviso "A prova foi encerrada pelo tempo"; com leitor de tela, o aviso é falado. No tabuleiro do Treino, um exercício cujo gabarito foi aberto antes de responder aparece como **visto com ajuda**, diferente de **resolvido**.

## 4f. Projeto profissional — 30 segundos (v9)

- O site funciona **offline** e pode ser **instalado como app** (botão no rodapé).
- No GitHub, cada mudança roda **1.994 verificações**, os 140 gabaritos, as 100 equações do Terminal, os fluxos no navegador (jornada, combo, uma partida inteira do Quem Divergiu?), as 69 fases da Calculândia, a acessibilidade (WCAG 2.1 AA, 0 violações em 42 telas) e o motor do Safari; o site só é publicado se tudo passar.
- (v10) Uma auditoria externa encontrou falhas reais; todas as críticas foram corrigidas com testes que impedem a volta do erro ([RESPOSTA-A-AUDITORIA.md](RESPOSTA-A-AUDITORIA.md)). Bom argumento: "o projeto foi revisado por fora e aguentou a revisão".
- O **relatório técnico** descreve objetivos, metodologia e validação.

## 5. Limites e progresso — 60 segundos

Use `1/x=0`: a busca não deve anunciar zero como raiz. Explique que não encontrar uma raiz em uma busca limitada não prova que ela não exista.

Mostre o caderno, as conquistas (12, com Caçador de Raízes e Turma reunida, que vêm dos jogos), o camarim e o backup. O progresso fica no navegador; não existe ranking remoto fictício. Desde a v10 o backup é um arquivo só, com trilhas, Treino, provas e revisões.

## 5b. Resíduo pequeno não é raiz — 60 segundos (v10)

Este é o melhor exemplo de rigor numérico da apresentação.

1. Em **Ajustes avançados**, escolha **Newton**, x₀ = 0 e digite `1e-20·(x² + 1) = 0`. Essa equação **não tem raiz real** (x² + 1 nunca é zero), mas |f(0)| = 10⁻²⁰, muito abaixo da tolerância 10⁻¹². Uma calculadora ingênua diria "raiz em x = 0". O Numera mostra **Quase-raiz** e "Ponto testado: não é raiz", e a aba Verificação explica: a curva não cruza nem toca o eixo.
2. Volte ao **Automático** e digite `(x − 1.337)² = 0`. Aqui a raiz existe, mas é dupla: o gráfico toca o eixo sem cruzar, então não há troca de sinal para certificar. O resultado aparece como **raiz provável de multiplicidade par**, com o aviso do porquê.
3. Feche com a frase: "o critério de parada |f(x)| < tolerância não basta; o site só chama de raiz o ponto onde f troca de sinal, ou onde |f| desce ao nível do arredondamento do computador".

## Perguntas prováveis

**Por que não basta a resposta final?**
Porque aprender envolve reconhecer condições, escolher procedimentos, calcular e interpretar. Cada etapa é praticada separadamente e depois conectada.

**Qual método é mais rápido?**
Depende da função, condições iniciais, precisão e custo das operações. O terminal compara execuções aceitas com uma métrica declarada.

**Um resíduo de 1e−12 significa erro de 1e−12 em x?**
Não. Resíduo e erro são diferentes; a sensibilidade da função ou matriz afeta essa relação. Em (x − a)², um resíduo de 10⁻¹⁶ convive com erro de 10⁻⁸ em x. E um resíduo pequeno pode nem ter raiz por perto, como em 10⁻²⁰·(x² + 1) (bloco 5b).

**Os vídeos são seus?**
Não. São aulas públicas de professores no YouTube, com o nome do canal e o link para o original. O site não baixa nem copia os vídeos; só abre o player oficial quando a pessoa pede.

**E um sistema com coeficientes minúsculos, como 10⁻²⁰·x = 10⁻²⁰?**
Tem solução única; antes de decidir se o sistema é dependente, o motor equilibra a escala das linhas e colunas. Quando a matriz é mal condicionada de verdade, ele mostra o número de condição κ e quantos dígitos se perdem.

**Por que Gauss-Seidel usa os valores novos?**
É a característica da atualização sequencial do método. Usar somente a rodada anterior seria outro procedimento.

**Por que essa ordem de dificuldade?**
Pelo que cada método exige: a Bisseção só pede o sinal de f; a Falsa Posição acrescenta a corda; o Newton precisa da derivada e de um bom chute; a Secante troca a derivada por dois pontos e perde a garantia de cerco (e é confundida com a Falsa Posição); Gauss é álgebra de matriz com pivotamento; Gauss-Seidel é iterativo e depende de um critério de convergência (dominância diagonal). A pesquisa apoia a posição da Secante: num estudo com 68 alunos de engenharia, 77,9% acertaram a fórmula do Newton, mas só 34,8% o princípio da Secante (Rachmatin e Sujana, 2022). A ordem é uma escolha pedagógica, não uma verdade universal, por isso existe o modo livre.

**O jogo vicia ou distrai?**
As moedas só vêm de atividade nova (repetir etapas não paga, nem o combo), os mascotes ficam fora do Treino e da prova, e quem prefere sem movimento pode ligar "reduzir movimento" no sistema.

**Por que o Ponto Fixo sumiu?**
A professora pediu para tirá-lo por enquanto. Ele não foi apagado: uma linha no conteúdo o esconde, e o progresso de quem já tinha feito etapas dele continua guardado. Os testes conferem o site com ele escondido e com ele de volta.

**Por que trocar a Arena pelos jogos?**
A Arena era uma lista de exercícios com vidas: pouco jogo. A Calculândia dá um mundo para explorar, com as fases táticas, e o Quem Divergiu? põe a turma inteira para jogar junto. Os desafios numéricos da Arena não se perderam: viraram as perguntas relâmpago do Quem Divergiu?.

**Como o Quem Divergiu? sabe a resposta certa?**
Cada pergunta calcula a resposta em código (Bisseção, Newton, Gauss…), e os testes conferem cada uma contra o motor do site. Nada é digitado à mão.

**E se um aluno digitar 1.414 em vez de 1,414?**
O jogo aceita os dois e mostra como leu o número antes da revelação. Milhar só com dois pontos ou junto com vírgula (18.000.000, 1.234,5).

**O jogo já foi comprovado com alunos?**
Não. Há testes de software e validação matemática; eficácia educativa e usabilidade precisam ser avaliadas em uso.

**Como adicionar outro método?**
Foi exatamente o que a v9 fez com a Falsa Posição e o Ponto Fixo (que hoje está escondido): implementar o algoritmo no motor, definir entradas e critérios de parada, escrever a trilha, a missão e os desafios, integrar o Terminal e as simulações, gerar e conferir os exercícios do Treino e acrescentar testes de propriedades e de falhas. Não basta acrescentar um nome no menu.

**Por que a Falsa Posição, se ela também fica no intervalo como a Bisseção?**
Porque corta onde a corda cruza o eixo, aproveitando os valores de f. Numa curva quase reta isso economiza muitas avaliações (no ponto de equilíbrio da fábrica, exercício 98 do Treino, são 3 cortes contra 22 da Bisseção). Em curvas muito tortas, uma ponta fica parada e ela pode ficar lenta: o próprio Treino tem exercícios em que a Bisseção é a melhor escolha por isso.

**Quando o Ponto Fixo converge?**
Quando |g′(x)| < 1 perto da raiz. O fator de convergência é aproximadamente |g′(x*)|; com g′ negativa os valores oscilam em volta da raiz. Newton é um Ponto Fixo especial, com g′(x*) = 0.

**Como a nota da prova é calculada?**
0,4 por escolher o método mais indicado e 0,6 pela resposta dentro da tolerância do exercício, em cada questão; a soma é convertida para 0 a 10.

**Por que o Terminal não para quando o intervalo fica menor que ε, como no caderno?**
O critério do Numera é |f(x)| ≤ ε, em todos os métodos. Na Bisseção com intervalo, o resultado mostra também quantas iterações o critério da largura exigiria, n ≥ log₂((b − a)/ε), para comparar com o que o exercício pede.
