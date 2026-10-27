# Análise educativa e melhorias — Numera Academy (v4 a v12)

## Avaliação do projeto recebido

A proposta tinha uma base funcional: cinco métodos reais, questões com correção, persistência, recompensas e um laboratório. O problema principal era a distância entre “responder um cálculo” e “entender e aplicar a modelagem”. Muitas atividades focavam uma atualização isolada, enquanto o terminal era mais completo que a experiência de aprendizagem.

A análise usou o código e o conteúdo do ZIP fornecido. Não houve observação de alunos, aplicação em turma nem acesso à ementa completa. Assim, as melhorias pedagógicas são decisões de projeto; não são evidência de aumento medido de aprendizagem.

## Problemas observados e decisões

| Achado | Consequência | Melhoria implementada |
| --- | --- | --- |
| Conteúdo curto por método, concentrado em substituições | Possibilidade de memorizar a fórmula sem entender quando usá-la | Explicação com requisitos, sequência, armadilhas, critério de parada e pseudocódigo; 4 atividades adicionais em cada trilha |
| Pouca conexão entre problema e equação | O jogo podia ensinar cálculo sem ensinar modelagem | 5 missões com hipóteses, variáveis, formulação, cálculo e interpretação |
| Gráficos e tabelas principalmente como saída do terminal | O aluno podia olhar a resposta sem acompanhar a mudança | Simulações com controle de cada passo e gráficos com intervalo, tangente ou secante |
| Progresso centrado em XP/conclusão | Concluir não indica autonomia | Estrelas por melhor tentativa e distinção explícita entre conclusão e desempenho |
| Erros sem roteiro posterior | O aluno podia abandonar uma dificuldade | Caderno de revisão e programação simples de retomadas |
| Busca automática centrada em uma candidata e mudança de sinal | Outras raízes e raízes repetidas podiam passar despercebidas | Várias candidatas, mínimos locais de |f|, faixa configurável e limite declarado |
| Newton e Secante podiam aceitar pequena variação com resíduo acima da tolerância | Critério inconsistente em execuções manuais | Estagnação não é anunciada como convergência quando o resíduo falha |
| Secante ignorava uma raiz já presente no primeiro ponto inicial | Atualizações desnecessárias ou falha indevida | Verificação das duas condições iniciais |
| Gauss usava um limiar absoluto fixo para pivôs | Sistemas equivalentes em escala pequena podiam ser rejeitados | Limiar relativo e validação em escalas de 1e−20 a 1e15 |
| Um sistema singular podia convergir em Seidel para apenas uma de suas soluções | Resposta isolada poderia sugerir unicidade inexistente | Teste de posto numérico antes das soluções de sistemas; identificação de incompatibilidade/dependência |
| Terminal exigia matriz para sistemas | Barreira entre a equação da aula e a entrada no app | Parser estrutural de equações lineares com nomes de incógnitas |
| Não havia transporte do progresso | Mudança de navegador podia interromper a jornada | Backup JSON, validação e restauração com confirmação |

## Estrutura pedagógica

1. **Entenda:** modelo mental, fórmula, pré-condições e riscos.
2. **Experimente:** observe uma execução calculada e mova-se pelos passos.
3. **Pratique:** avance do conceito ao cálculo e à crítica do resultado.
4. **Aplique:** transforme um cenário em equações e interprete a solução.
5. **Revise:** recupere o raciocínio em outra tentativa.

O terminal permanece livre. Não se bloqueia uma ferramenta de consulta para forçar o aluno a jogar. As atividades dão orientação antes do gabarito; a explicação completa aparece no acerto. O modo guiado do terminal permite reconstruir seus próprios exemplos.

## Critérios de recompensa

- Trilhas: 20 XP por atividade inédita; Arena: 30 XP; missões aplicadas: 40 XP.
- Meta diária: +30 XP ao concluir 3 atividades distintas no dia, uma vez ao dia.
- Repetir uma atividade melhora a melhor classificação por estrelas e pode contar como estudo em outro dia, mas não repete seu XP base.
- Sem limite de tentativas nas trilhas. Na Arena, vidas se recuperam sem apagar o progresso.
- Revisão por agenda simples: 1, 3, 7 e 14 dias. Não é um modelo de aprendizagem adaptativa validado.

## Arquitetura e extensibilidade

Separação em conteúdo, matemática, progresso e interface. O site funciona localmente sem instalação. Uma nova trilha exige método implementado, condições/limites documentados, questões verificadas, registro na interface e testes próprios. Acrescentar só um card não representa um novo método funcionando.

Não foi acrescentada infraestrutura de contas, ranking entre alunos, professor/turma ou banco remoto. Esses recursos exigiriam decisões adicionais sobre dados, autenticação e validação. A versão atual é um projeto de aprendizagem individual, com estado local.

## O que ainda deve ser validado com alunos/professor

- Se os cinco métodos correspondem ao recorte solicitado da disciplina.
- Se as perguntas exigem explicação suficiente, além da resposta numérica.
- Tempo de conclusão, pontos de abandono e dificuldade real de cada etapa.
- Capacidade de resolver uma questão nova depois da prática, sem dicas.
- Layout, navegação por teclado, leitura em celular e exportações no navegador usado na apresentação.

Não foi atribuída nota “100%” ou eficácia pedagógica garantida. A versão amplia e organiza a experiência; avaliação em uso continua necessária.

## v9: o que saiu do debate depois da v8

| Proposta | Por que importa | O que foi feito |
| --- | --- | --- |
| Gráfico de convergência | Ordem de convergência é abstrata no papel; no gráfico log ela vira inclinação | Aba Convergência no Terminal e gráfico em cada gabarito do Treino, com ordem observada e tabela |
| Modo prova | Treino sem pressão não mede autonomia; o professor precisa de um registro | Prova sorteada, cronômetro, nota 0,4/0,6, relatório em PDF, histórico; erros vão para a revisão |
| Dicas por erro típico | “Ainda não” não ensina; o erro mais comum de cada conta é previsível | 369 erros típicos calculados pelo gerador e reconhecidos na correção |
| Falsa Posição e Ponto Fixo | São os métodos de raízes que costumam completar o conteúdo do curso | Motor, Terminal, trilhas, simulações, missões, Arena e 40 exercícios |
| Profissionalização | Projeto apresentável e mantido como software de verdade | PWA, testes no GitHub, publicação no Pages, acessibilidade WCAG 2.1 AA, compatibilidade e relatório técnico |

Uma consequência importante: com sete métodos, vários exercícios da v8 ficaram ambíguos (por exemplo, palpites da Secante que já cercavam a raiz, o que tornava a Falsa Posição igualmente válida). Eles foram revisados para que cada gabarito continue tendo uma justificativa clara. A eficácia educativa continua sem medição em turma: os testes garantem a correção do software e da matemática, não o aprendizado.

## v10: o que saiu da auditoria externa

Uma auditoria independente da v9 (Manus, 17/10/2026) encontrou falhas reais de rigor numérico, persistência e acessibilidade e propôs um roteiro de produto. A resposta item a item está em [RESPOSTA-A-AUDITORIA.md](RESPOSTA-A-AUDITORIA.md).

| Achado | Por que importa para o aprendizado | O que foi feito |
| --- | --- | --- |
| Resíduo pequeno apresentado como raiz | O site contradizia o que ensina: que resíduo e erro são coisas diferentes | Certificação local: raiz certificada, raiz dupla provável ou quase-raiz rejeitada, explicada na aba Verificação |
| Sistemas reescalados rejeitados | Um aluno que escrevesse a equação em outra unidade recebia "sem solução única" | Equilíbrio de escala antes do teste de posto; mensagens distintas e número de condição |
| Trajetória parcial parecendo convergência | O gráfico podia ensinar que um método "chegou" quando só parou | Desfecho em texto em cada série, tracejado para parcial e divergência |
| Gabarito aberto antes contava como "resolvido" | O tabuleiro superestimava a autonomia | Estado "visto com ajuda"; o resumo separa os resolvidos sozinho |
| Prova expirada sem relatório; foco perdido | Quem usa leitor de tela não sabia que a prova tinha acabado | Relatório automático, foco preservado e anúncios |
| Backup sem Treino e provas | Trocar de computador apagava justamente o histórico de diagnóstico | Um arquivo único com tudo |

**Aulas em vídeo (pedido do autor):** cada método ganhou 3 aulas do YouTube (duas em português, uma em inglês) na página da trilha e no fim da leitura guiada. A ideia é oferecer outra explicação da mesma matéria, com outra voz, para quem não entendeu só lendo. Os vídeos foram escolhidos por cobrirem o método do curso (inclusive o critério de parada e, na Gauss, o pivoteamento parcial) e conferidos pelo título e pelo canal; não foram avaliados com alunos.

Ficaram para depois, por pedirem decisões de produto ou uma turma: onboarding por objetivo, modo Essencial/Aprofundado, navegação mais curta no celular, mapa de competências, modo professor e o piloto com alunos. O piloto continua sendo o passo mais importante: é ele que diria se o jogo ensina.

## v10.1: o intervalo do exercício no Terminal

Nas listas da disciplina, o intervalo costuma vir no enunciado ("raiz de f no intervalo [0, 1], pela Bisseção"). Até a v10, os campos a e b ficavam escondidos nos controles avançados e começavam com valores padrão (1 e 2) que não eram do exercício: o aluno podia resolver no intervalo errado sem perceber. Agora o método e o intervalo ficam logo abaixo da equação, começam vazios e valem para todos os métodos.

O ganho pedagógico está nas mensagens. Com f(a) e f(b) do mesmo sinal, o Terminal não só recusa: explica o Teorema do Valor Intermediário e mostra os pedaços do intervalo onde f troca de sinal. No Newton, x₀ sai da condição de Fourier, como nos livros. Na Bisseção, aparece o número de iterações pelo critério da largura do intervalo, o que ajuda a comparar com a resolução à mão. Qual critério de parada a disciplina usa é algo a confirmar no material da professora.

## v11: gamificação a pedido da professora

A professora achou a parte de jogo seca e pediu três coisas: níveis de dificuldade (começar pelo básico e ir dificultando), um personagem que se mexa durante os desafios e faça algo diferente a cada 3 acertos seguidos, e tirar o Ponto Fixo por enquanto. As decisões, do ponto de vista de gamificação:

**1. Progressão com sentido, não só pontos.** O problema da versão anterior não era falta de XP: era a ausência de um caminho. A jornada dá uma meta visível (o próximo mundo), um mapa com o quanto falta e travas leves. A trava abre o próximo mundo no fim do Nível 1 do anterior, não do mundo inteiro: guia sem prender quem já sabe. A leitura e a simulação nunca travam, porque bloquear explicação seria punir quem quer estudar. O modo livre existe para quem precisa revisar para a prova fora da ordem.

**2. A ordem de dificuldade tem justificativa.** O critério é o que cada método exige de quem resolve (sinal → corda → derivada → dois pontos sem garantia de cerco → matriz → iteração com critério de convergência). A pesquisa reforçou dois pontos: muitos alunos dominam a fórmula do Newton, mas não o princípio da Secante, que confundem com a Falsa Posição (77,9% contra 34,8%, num estudo com 68 estudantes; RACHMATIN; SUJANA, 2022); e derivadas são um ponto fraco frequente em engenharia (DÍAZ QUEZADA, 2020). O site mostra esse raciocínio em "Por que essa ordem?" e diz que é uma hipótese.

**3. Recompensas que não viciam em repetição.** Moedas só por atividade nova; o bônus de 3 acertos seguidos exige ao menos uma atividade nova desde o anterior; bônus de nível e de mundo são pagos uma vez. Assim, o caminho mais rápido para ganhar moedas é aprender coisa nova, não clicar de novo no que já sabe. As moedas compram roupas para os mascotes (recompensa estética): não compram nota, XP nem atalho.

**4. Personagens com piada da matéria.** Raiz é um rabanete (a raiz que a gente procura); Pivô é um bloquinho de matriz [1 0] de luvas de boxe (o pivô da Eliminação de Gauss), que dá um giro quando dança. Um casal funciona melhor que um personagem só: um comemora, o outro faz a ação (o soco na caixa Σ), e as falas viram diálogo ("Tá vendo, Pivô? Eu sabia!"). As frases são trocadilhos com o conteúdo ("Convergiu!", "Resíduo alto, autoestima intacta."). Na literatura, a ficção de jogo (narrativa e personagens) aparece como moderador do efeito da gamificação sobre o comportamento (SAILER; HOMNER, 2020).

**5. O retorno é do tamanho do evento.** Acerto: pulinho. Erro: reação engraçada, nunca humilhante, e a sequência zera. Três seguidas: o Pivô soca a caixa e as moedas voam até o contador, o momento "uau". Nível e mundo: confete e a mensagem do mundo liberado. Se tudo fosse festa, nada seria.

**6. Sem atrapalhar quem estuda.** Os mascotes não aparecem no Treino nem na prova, ficam parados com "reduzir movimento" ligado, são invisíveis para o leitor de tela (o que eles comunicam também vai em texto) e, no celular, ficam pequenos sem cobrir o botão de responder.

**Ponto Fixo:** escondido com uma lista em `content.js`, sem apagar nada. Volta como Mundo 3 (★★★) esvaziando a lista.

**Próximas ideias de gamificação** (em ordem de impacto esperado):
- **Chefe de cada mundo:** um desafio final que mistura os três níveis, com o Pivô "lutando" contra a função; vencer dá a medalha do mundo.
- **Turma e equipes:** ranking semanal da turma por equipes, com metas coletivas (competição com colaboração, a combinação que a meta-análise associou a efeitos maiores). Exige um servidor ou uma planilha da professora.
- **Modo professora:** abrir mundos para a turma inteira na semana da matéria, em vez de travas individuais.
- **Missão do dia:** três etapas sorteadas entre as que estão para revisar, com bônus de moedas.
- **Proteção de sequência:** gastar moedas para não perder a sequência de dias.
- **Falas por mundo:** Raiz e Pivô comentando o método da vez ("Sem derivada? Chama a Secante!").
- **Sons:** efeitos curtos para acerto, combo e nível, desligados por padrão, com botão de silêncio.
- **Figurinhas colecionáveis:** uma por método, com o "cartão" do método (fórmula, condição e ordem de convergência).

O que continua faltando é o mesmo de antes: ver uma turma usar. Só o uso real vai dizer se a ordem de dificuldade está certa e se o casal ajuda ou distrai.

## v12: a Arena sai, entram os jogos

O grupo achou a Arena fraca como jogo, e com razão: era uma fila de exercícios com vidas, sem lugar, sem história e sem outras pessoas. A v12 trocou a Arena por dois jogos com papéis diferentes.

**Calculândia: o jogo para estudar sozinho.** O mundo dá o que faltava à Arena: um lugar para explorar, um caminho (regiões, chefões, a Usina) e fases que são simulações do método, não perguntas de múltipla escolha. A integração não mexeu nas regras do jogo:
- o jogo passou a ser servido pelo site, offline e sem CDN;
- ganhou a volta para o Numera;
- o progresso dele aparece na página Jogos e vale uma conquista.

**Quem Divergiu?: o jogo para a sala.** O pedido foi um jogo "como se a professora quisesse jogar com a gente". A base é a dinâmica de jogos de festa: pergunta com resposta numérica, palpite em segredo, voto em quem errou feio e revelação. As escolhas de gamificação:

1. **A graça vem do social, e a aula vem da reta.** Votar em quem divergiu cria suspense e piada entre colegas; a revelação na reta numérica, com as faixas de 1%, 5% e 20%, transforma a piada em erro relativo. O carimbo DIVERGIU! é o momento engraçado; o carimbo CONVERGIU! é o conceito.
2. **A pontuação é o critério de parada.** Os pontos caem por faixas de erro relativo, como a tolerância dos métodos. O aluno sente na pontuação a diferença entre 0,4% e 8%.
3. **Recompensar mais do que acertar a conta.** O voto certeiro (+30) premia quem julga bem a ordem de grandeza; o bônus de "injustiça" (+20) consola quem levou os votos sem ter errado mais, e evita que a votação vire perseguição; a raiz da rodada (+20) premia a precisão.
4. **Do fácil ao difícil, também aqui.** As rodadas seguem a mesma escala de dificuldade da jornada, e a professora escolhe os temas que a turma já viu.
5. **A professora no controle.** Ela escolhe temas, dificuldade, rodadas e relógio, digita os palpites e abre "Como se calcula" quando quiser explicar. O jogo não decide o ritmo da aula.
6. **Funciona na sala de verdade.**
   - É um computador só, sem conta nem servidor.
   - Os palpites vão no caderno, que todo mundo tem, ou passando o aparelho.
   - O layout cabe num projetor de 720 linhas.
   - As respostas são calculadas e conferidas contra o motor, e os desafios da antiga Arena viraram perguntas relâmpago.

**Próximas ideias** (em ordem de impacto esperado):
- **Cada aluno no próprio celular,** entrando por um código da sala, com os palpites chegando sozinhos ao telão. Exige um servidor de tempo real, ou seja, conta e hospedagem.
- **Rodada de estimativa pura** ("quantas iterações?", "qual a ordem de grandeza do erro?"), sem conta no caderno, para aquecer a turma.
- **Modo times** com placar por fileira acumulado ao longo do semestre.
- **Banco da professora:** ela escreve as próprias perguntas (com a função e o método) e o jogo calcula a resposta pelo motor.

