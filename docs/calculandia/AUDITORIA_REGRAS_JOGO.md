# Auditoria das regras — Caçadores de Raízes

Data: 25/10/2026. Projeto: `E:\JogoCalculo`.

**Conclusão: as regras do Documento de Design não estão implementadas corretamente.** Há cobertura dos 21 métodos como exercícios de múltipla escolha, mas faltam os sistemas que definem o jogo do documento: simulação manipulável, consumo de energia por operação, integridade, convergência como condição de vitória, pontuação matemática, progressão por XP, relíquias e batalhas com mudança de método.

Fonte: [Caçadores de Raízes — Documento de Design do Jogo (1).pdf](<C:/Users/igor-/Downloads/Caçadores de Raízes — Documento de Design do Jogo (1).pdf>), 22 páginas. Esta auditoria complementa [a auditoria do mundo animado](E:/JogoCalculo/AUDITORIA_DOCUMENTO.md).

O próprio [registro de decisões](E:/JogoCalculo/DECISOES.md:17) explica a origem da diferença: o documento das fases não estava disponível quando foram criadas fases próprias. Isso explica a implementação existente, mas não comprova conformidade com as regras agora fornecidas. Os dois documentos são complementares: o mundo 3D não é, por si só, uma divergência das regras táticas em Canvas.

## Escopo e evidências

- Leitura das 22 páginas, com inspeção visual da página 18 para confirmar estrelas, RPG e chefões.
- Revisão de todos os geradores de métodos, interface das fases, configuração de bateria/XP, aplicação de resultados, salvamento, controles e áudio.
- Execução em Chrome isolado de **69 combinações**: 21 métodos × 3 dificuldades, 5 chefões regionais e final. Aleatoriedade fixada em `mulberry32(72)` para reprodução.
- Cada fluxo foi respondido usando o gabarito do próprio gerador para testar encerramento, consumo, recompensa e persistência. **Isso não certifica independentemente cada alternativa matemática nem todas as sementes aleatórias.** Os cálculos dos exemplos destacados abaixo foram conferidos separadamente.
- Nenhuma alteração no código do jogo. Foram criados apenas o relatório e arquivos externos de evidência da auditoria.

[Script de reprodução](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/audit-rules.cjs) · [Resultados completos em JSON](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/rules-results.json).

## Divergências prioritárias

### 1. P1 — Vitória e estrelas independem da convergência

**Documento:** cada missão exige uma tolerância e condições próprias; uma estrela exige convergir, duas dependem de precisão maior e bateria positiva, três dependem de eficiência e ausência de alerta vermelho (pp. 4–18).

**Implementação:** a última resposta correta seguida de “Próximo” chama `finish(true)`. As estrelas dependem exclusivamente da quantidade de respostas erradas, com limite por dica L3. Nenhuma tolerância é consultada. Evidências: [next](E:/JogoCalculo/src/fases/fase-ui.js:125) e [finish](E:/JogoCalculo/src/fases/fase-ui.js:189).

Resultados reais, sem dicas nem respostas erradas:

| Fase | Resultado produzido | Divergência |
|---|---|---|
| Trapézios F | Integral de x² de 0 a 2, n=2, T=3, erro 0,333333; vitória, 3 estrelas, bateria 4/4 | Documento exige erro <0,01, n=12 e bateria 14. É a mesma integral; o erro ficou mais de 33 vezes acima do limite. |
| Newton F | x²−2, x₀=1, um passo até 1,5; erro 0,085786; vitória, 3 estrelas | Documento exige x₀=1,5 e erro <0,01. O exercício substituto também termina acima dessa precisão. |
| Bisseção F | x²−2, duas iterações até 1,25; erro 0,164214; vitória, 3 estrelas | Documento exige x³−x−2, até atingir largura/2 <0,01; a implementação nem usa a mesma missão nem verifica a largura. |

### 2. P1 — Bateria funciona como número de erros, não energia

**Documento:** bisseção/ponto fixo custam 1 por iteração; falsa posição/secante 2; Newton 3; RK4 4 por passo; outros custos variam com operação, sondas e avaliações. Cada missão tem orçamento próprio (pp. 1, 4–16).

**Implementação:** F=4, M=3, D=2 e chefão=3, independentemente do método. Somente escolher uma alternativa errada subtrai 1. Em todos os 69 fluxos perfeitos, a bateria terminou igual à inicial. Isso remove o motivo estratégico para escolher um método mais eficiente. Evidências: [configuração](E:/JogoCalculo/src/config.js:64), [batteryFor](E:/JogoCalculo/src/fases/fase-ui.js:13), [answer](E:/JogoCalculo/src/fases/fase-ui.js:98).

Além disso, o defeito reproduzido na auditoria anterior permite vencer com bateria zero: na última questão D, errar duas opções, acertar e avançar antes dos 900 ms do encerramento por derrota. O resultado já confirmado foi vitória, 1 estrela e bateria 0. A regra de derrota imediata não é garantida.

### 3. P1 — As ações táticas foram substituídas por perguntas

O documento exige arrastar âncoras, mirar Newton, mover sondas, operar linhas de matrizes, colocar nós, ajustar curvas e escolher h. Também exige Auto, Sobrecarga Manual, Trocar Ferramenta e Desfazer (pp. 2–4).

A interface oferece alternativas, avanço, dicas e saída. Gráficos e matrizes ilustram o enunciado e a resposta, mas não são instrumentos manipuláveis. Não há seleção de método durante a tentativa nem histórico para desfazer. [Interface](E:/JogoCalculo/src/fases/fase-ui.js:34), [renderização](E:/JogoCalculo/src/fases/fase-ui.js:68), [controles](E:/JogoCalculo/src/fases/fase-ui.js:226).

### 4. P1 — Não há integridade, instrumentos de convergência ou patologias dinâmicas

Faltam barra de integridade, radar logarítmico do erro, razão ρ, estimativa de ordem p, semáforo, relógio de catástrofe e telemetria condicionada à dificuldade (pp. 2–3).

Os valores são calculados antecipadamente para construir perguntas. Campos como `erro: 'polo'`, `'divergencia'` ou `'pivo_zero'` selecionam uma fala quando o jogador erra a alternativa; não detectam uma patologia surgida de sua escolha numérica. Não há dano por insistir em divergência, ciclo 0↔1, extremos estagnados ou rigidez. [Geração](E:/JogoCalculo/src/fases/metodos.js:109), [tratamento de erro](E:/JogoCalculo/src/fases/fase-ui.js:113).

### 5. P1 — Fórmula de XP diferente e XP descartado ao salvar

**Documento, pp. 17–18:** `1000 × M × (0,5Se + 0,3Si + 0,2St) × (1 + 0,25Sb) × C`, com M=1/2/4 e fatores de precisão, eficiência, tempo, bateria e combo.

**Código:** `(base + 150 × estrelas + 80 × bateria) × fatorDaDica`, bases 800/1200/1600/2000. Não usa tolerância, tempo, iterações ótimas, alerta vermelho ou combo. Um exercício perfeito F recebe 1570 XP, independentemente de sua precisão. [Cálculo](E:/JogoCalculo/src/fases/fase-ui.js:197).

`applyResult` guarda estrelas, vitórias, derrotas e recompensas do mundo, mas não usa `res.xp`. Após aplicar e salvar os resultados testados, não havia XP acumulado. Faltam nível do engenheiro, perks, inventário de relíquias e Diário de Campo com o estado da derrota. [Aplicação](E:/JogoCalculo/src/systems/progress.js:80), [save](E:/JogoCalculo/src/systems/save.js:4).

### 6. P1 — Chefões e final não implementam as batalhas descritas

Os chefões concatenam as primeiras perguntas de alguns métodos. O final sorteia um método de cada módulo e pega duas perguntas de cada um. Não há Fúria, troca obrigatória de ferramenta, regeneração de cabeças nem parâmetros passando de uma etapa para outra. A bateria é compartilhada dentro do quiz, mas sem o consumo matemático requerido.

| Batalha exigida (pp. 18–19) | Situação atual |
|---|---|
| Overflow: cancelamento → meia precisão → soma com Kahan | Perguntas de truncamento, cancelamento e overflow; sem Kahan executável. |
| Hidra: polo → raiz dupla → ponto fixo amortecido; bateria 60 | Mix de cinco métodos em M; bateria 3; sem as três cabeças. |
| Guardião Hilbert: H₄/refinamento → Wilkinson → Seidel | Perguntas sobre matrizes pequenas; sem sequência com essas patologias. |
| Colosso de Runge: Chebyshev → spline completa → MMQ centralizado | Perguntas independentes; não executa as transformações. |
| Tsunami Rígido: pico/adaptativo → reduzir h → Euler implícito | Perguntas independentes de integração/EDOs. |
| Colapso da Usina: sistema 4×4 fornece parâmetros de f, raiz fornece temperatura para EDO | Dez perguntas sem dependência numérica entre os módulos. |

**Todos os seis chefões retornaram `erroFinal = 0,000001` por constante**, não por cálculo da solução final. [Composição e resultado](E:/JogoCalculo/src/fases/metodos.js:550).

### 7. P2 — Métricas finais não representam as operações realizadas

- `iteracoes` é `passos.length`: conta perguntas conceituais, derivadas e escolhas de intervalo como se fossem iterações. Newton F reporta 3, embora só execute uma atualização de x. Bisseção F reporta 3, embora faça dois pontos médios.
- Euler M pergunta y₁, y₂ e y₃, mas calcula o erro de y₂. Na execução: y′=y, h=0,1, y₃=1,331; erro correto no instante final 0,3 é **0,018858807576**. Foi reportado **0,011402758160**, referente a t=0,2. [Erro de Euler](E:/JogoCalculo/src/fases/metodos.js:525).
- Jacobi e Seidel usam o erro de uma componente de uma iteração pré-calculada, não necessariamente do último vetor efetivamente trabalhado. Diversos métodos retornam zero constante. Esses valores não podem sustentar os critérios de erro máximo, residual ou precisão do PDF.

### 8. P2 — Áudio/VFX não respondem ao estado numérico

Há Web Audio sintetizado, música regional, sons de acerto/erro/vitória/derrota e gráficos Canvas. Entretanto, os gatilhos táticos das pp. 16–17 não estão ligados a ρ, p, sinal, pivô, erro, tolerância ou integridade. Faltam as mudanças de camadas por bateria <50%, erro <10⁻², erro <10τ e BPM por integridade <30%. Evidências: [chamadas da fase](E:/JogoCalculo/src/fases/fase-ui.js:110), [música](E:/JogoCalculo/src/systems/audio.js:86), [efeitos](E:/JogoCalculo/src/systems/audio.js:228).

### 9. P2 — Motor e ferramentas de validação incompletos

Não há o contrato de traço por iteração com `{k,x,fx,err,cost,flags}` e histórico descrito nas pp. 20–21. As funções retornam listas de perguntas prontas. O problema não é o nome das pastas nem a ausência literal de `function*`: falta o comportamento equivalente necessário para simular, desfazer e reproduzir as decisões do jogador.

Não foi encontrada suíte automatizada dos exemplos do documento. O painel `?debug=1` é de depuração do mundo, não o modo professor acionado por D com tabela completa de iterações e fórmulas. D está vinculado ao deslocamento do herói. O Canvas da fase usa resolução fixa 720×450, sem ajuste próprio por `devicePixelRatio` e sem âncoras de toque de 44 px, pois as âncoras nem são interativas. [Canvas](E:/JogoCalculo/src/fases/fase-ui.js:73), [tecla D](E:/JogoCalculo/src/systems/input.js:116).

## Comparação do catálogo, método a método

**Todos os métodos abaixo têm implementação parcial como conteúdo didático; nenhum pode ser considerado integralmente conforme**, por causa das regras comuns ausentes e das diferenças específicas. No Módulo 0 o PDF detalha F para truncamento, M para cancelamento e D para overflow; não especifica individualmente as outras seis combinações, embora a visão geral fale em três dificuldades por método.

| Método / páginas | Requisito específico ausente ou substituído | Código |
|---|---|---|
| Truncamento, p. 4 | 100 leituras, escolha por leitura, quatro dígitos e erro acumulado. Hoje são números avulsos e perguntas; erro final é meia unidade da casa decimal. | [26](E:/JogoCalculo/src/fases/metodos.js:26) |
| Cancelamento, p. 5 | Máquina de cinco dígitos e vitória por erro relativo na raiz pequena. Hoje usa perguntas sobre quatro dígitos; não simula a máquina a cada operação. | [64](E:/JogoCalculo/src/fases/metodos.js:64) |
| Overflow, p. 5 | Meia precisão, limite 65504, x=300/y=400, reescala e Kahan. Hoje usa inteiros de 16 bits e exemplos de double, sem modo half. | [80](E:/JogoCalculo/src/fases/metodos.js:80) |
| Bisseção, pp. 5–6 | F cúbica; M três raízes e sondas; D polo com teste de resíduo. Hoje sorteia outras funções, faz 2–3 iterações e acrescenta teoria sobre polo. | [109](E:/JogoCalculo/src/fases/metodos.js:109) |
| Falsa posição, pp. 6–7 | F três passos; M cos(x)−x·exp(x); D x¹⁰−1 e Illinois executável. Hoje 2–3 passos e pergunta sobre Illinois. | [109](E:/JogoCalculo/src/fases/metodos.js:109) |
| Ponto fixo, p. 7 | F cosseno; M escolha entre três g; D logística 3,3x(1−x) e amortecimento. Hoje g fixo/sorteado e três iterações. | [155](E:/JogoCalculo/src/fases/metodos.js:155) |
| Newton, pp. 7–8 | F x₀=1,5; M ciclo 0↔1; D polinômio com raiz dupla e multiplicidade. Hoje casos convergentes curtos e questões conceituais separadas. | [176](E:/JogoCalculo/src/fases/metodos.js:176) |
| Secante, p. 8 | F três atualizações; M x·exp(x)−1; D sondas gêmeas e resgate com bisseção. Hoje casos fixos e pergunta sobre denominador zero. | [204](E:/JogoCalculo/src/fases/metodos.js:204) |
| Gauss, pp. 8–9 | F sistema 3×3 prescrito; M pivô zero; D H₄ com máquina e refinamento. Hoje F 2×2, demais 3×3 aleatórios construídos de LU. | [254](E:/JogoCalculo/src/fases/metodos.js:254) |
| Pivoteamento, p. 9 | Pivô minúsculo, escala enganosa, Wilkinson, troca de colunas e crescimento. Hoje matriz 3×3 com primeiro pivô zero e escolhas de linha. | [284](E:/JogoCalculo/src/fases/metodos.js:284) |
| LU, pp. 9–10 | Vários b com mesma fatoração, PA=LU efetivo, H₄/refinamento. Hoje fatores aleatórios e perguntas sobre reutilização/permutação. | [305](E:/JogoCalculo/src/fases/metodos.js:305) |
| Jacobi, pp. 10–11 | Rede prescrita, reordenação em M, contraexemplo nilpotente em D. Hoje sistemas dominantes aleatórios; D reordena, sem contraexemplo. | [333](E:/JogoCalculo/src/fases/metodos.js:333) |
| Gauss-Seidel, p. 11 | Sassenfeld comparando permutações e sistema D em que Jacobi diverge. Hoje sempre sistema dominante aleatório, poucas componentes e teoria. | [353](E:/JogoCalculo/src/fases/metodos.js:353) |
| Interpolação, pp. 11–12 | Nós prescritos, inserção incremental Newton, Runge com 11 nós e Chebyshev. Hoje Lagrange com 3 ou 4 nós; teoria não executa esses recursos. | [384](E:/JogoCalculo/src/fases/metodos.js:384) |
| Spline, p. 12 | M sistema tridiagonal de 5 nós/Thomas; D exp(x) e troca para contorno completo. Hoje apenas 3 nós naturais e pergunta sobre completa. | [404](E:/JogoCalculo/src/fases/metodos.js:404) |
| MMQ, pp. 12–13 | F dados prescritos; M ajuste exponencial por linearização; D parábola com centralização. Hoje reta sobre 4 pontos inteiros e pergunta sobre centralização. | [423](E:/JogoCalculo/src/fases/metodos.js:423) |
| Trapézios, p. 13 | F n=12; M seno e cota de erro; D curva em U em float32 com h variável. Hoje n=2/4 e pergunta conceitual sobre arredondamento. | [465](E:/JogoCalculo/src/fases/metodos.js:465) |
| Simpson 1/3, p. 14 | M seno com n=12; D substituição x=t² aplicada à integral de √x. Hoje integrais sorteadas n=2/4 e questão sobre substituição. | [481](E:/JogoCalculo/src/fases/metodos.js:481) |
| Simpson 3/8, pp. 14–15 | F seno n=6; M combinação real com 1/3; D pico e subdivisão adaptativa. Hoje n=3/6 e pergunta sobre combinação, sem adaptatividade. | [497](E:/JogoCalculo/src/fases/metodos.js:497) |
| Euler, p. 15 | F 25 passos; M 40 passos; D λ=50 com opção implícita em até 10. Hoje 2–3 passos pré-calculados e teoria sobre estabilidade. | [512](E:/JogoCalculo/src/fases/metodos.js:512) |
| RK4, pp. 15–16 | F h=0,5 e cálculo completo; M dois passos; D λ=100 com controle de estabilidade. Hoje um passo h=0,1/0,2; F termina em k₃, antes de pedir y₁. | [528](E:/JogoCalculo/src/fases/metodos.js:528) |

## O que existe e pode ser reaproveitado

- Registro dos 21 métodos, três dificuldades e ligação entre portas do mundo, fase e resultado.
- Cálculos de pontos médios, cordas, Newton, secante, operações de matrizes, interpolação, quadraturas e EDOs; não são apenas respostas textuais fixas. Isso não implica que todas as métricas ou alternativas estejam corretas.
- Desenho de curvas, tangentes, áreas, matrizes e dicas visuais em Canvas/HTML.
- Sons sintetizados, feedback de resposta e telas de vitória/derrota.
- Persistência de estrelas, vitórias e progressão do mundo; falta a parte RPG definida por este PDF.

## Cuidados ao transformar o PDF em critérios automatizados

Há pelo menos uma inconsistência no próprio documento: a p. 22 diz que sete iterações de bisseção em x³−x−2, [1,2], devem retornar x≈1,5214. Pelo algoritmo apresentado, o sétimo ponto médio é **1,5234375**; **1,5213797068** é a raiz de referência. O critério de tolerância da missão pode ser atendido, mas o teste não deve exigir que o sétimo ponto médio seja a raiz com quatro casas.

Também convém definir explicitamente se as condições de estrelas são cumulativas e como tratar erro exatamente zero na fórmula logarítmica de XP. São ajustes de especificação para implementação futura, não justificativas para os desvios atuais.

## Ordem sugerida de correção

1. Criar estados numéricos por missão e passos com custo, erro e alertas; estabelecer condições reais de vitória/derrota e eliminar a corrida da bateria zero.
2. Implementar manipulação das ferramentas e HUD, começando pelo MVP de bisseção/Newton F/M previsto no PDF.
3. Migrar os exemplos do catálogo, com baterias e tolerâncias testadas; adicionar máquinas de precisão limitada e patologias efetivas.
4. Implementar XP, estrelas, combo, persistência, perks, relíquias e Diário de Campo.
5. Construir chefões e final com etapas dependentes, Fúria e troca de método; conectar áudio/VFX e modo professor ao traço numérico.

Não basta ajustar números de bateria ou textos: a principal lacuna é o funcionamento das fases.
