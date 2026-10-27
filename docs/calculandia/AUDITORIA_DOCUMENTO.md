# Auditoria de conformidade — Calculândia

Data: 25/10/2026. Resultado: **implementação parcial; não atende integralmente ao Documento do Mundo Animado**.

Referência: [PDF original](<C:/Users/igor-/Downloads/Calculândia — Documento do Mundo Animado.pdf>), 31 páginas. O prompt de implementação contido no PDF foi tratado como parte da especificação; esta tarefa foi uma auditoria. Nenhum arquivo de implementação foi alterado.

**Método e limites**

- Leitura das 31 páginas, inspeção visual da tabela musical e revisão do código das áreas correspondentes.
- Execução em Chrome automatizado, perfil temporário, sem usar o salvamento pessoal do usuário. Arquivos locais servidos por interceptação do navegador; dependências originais carregadas do CDN.
- Execução de 69 combinações de fase/dificuldade: 21 métodos × 3 dificuldades, 5 chefões e final. Uma geração determinística por combinação, respondida pelas alternativas que o próprio gerador identifica como corretas. Isso verifica o fluxo; não constitui validação matemática independente de todos os exercícios aleatórios.
- Teste da entrada real pelo evento da porta, conclusão com dica 3, retorno ao mundo, bandeira, tutorial e recarga do salvamento.
- Contagem de objetos e renderização em sete pontos do mapa; inspeção do mapa em viewport de 390 × 844.
- Busca de caminhos sobre terreno e colisões, descrita separadamente abaixo. Não houve campanha completa percorrida manualmente, teste de desempenho em celular físico ou certificação de 60/30 fps.
- O Documento de Design das fases, referido na página 1, não foi fornecido. Portanto, a fidelidade das fases táticas originais não pode ser aprovada com este PDF.

**Problemas funcionais confirmados — corrigir primeiro**

| Prioridade | Problema e reprodução | Evidência e requisito |
|---|---|---|
| Alta | **Tecla de alternativa inexistente gera exceção.** Na segunda pergunta de Bisseção/Fácil há três opções. Pressionar `4` produz `TypeError: Cannot read properties of null (reading 'disabled')`. O mesmo risco existe em outras perguntas com menos de quatro alternativas. Validar o índice e a existência do botão antes de processar a resposta. | [fase-ui.js:99](E:/JogoCalculo/src/fases/fase-ui.js:99), [numeros.js:30](E:/JogoCalculo/src/fases/numeros.js:30). Checklist §17, p. 30: nenhum erro no console. |
| Alta | **É possível vencer com bateria zerada.** Na última pergunta da Padaria/Difícil, errar duas vezes, selecionar a correta e concluir antes dos 900 ms resulta em vitória, 1 estrela e bateria 0. A derrota fica agendada, mas a fase continua aceitando respostas. Bloquear a tentativa assim que a bateria acaba. | [fase-ui.js:114](E:/JogoCalculo/src/fases/fase-ui.js:114). Falha da regra de bateria adotada pelo próprio projeto; o PDF não define os valores da bateria. |
| Alta | **Compra de dica não persiste imediatamente.** Com 10 sementes salvas, comprar dica 2 deixa 9 em memória e 10 no `localStorage`. Atualizar/fechar durante a fase recupera a semente: o salvamento periódico e o `beforeunload` só salvam em modo `play`. Persistir após debitar. | [progress.js:33](E:/JogoCalculo/src/systems/progress.js:33), [fase-ui.js:169](E:/JogoCalculo/src/fases/fase-ui.js:169), [main.js:604](E:/JogoCalculo/src/main.js:604). M5, p. 28: sementes gastas e salvas. |
| Média | **Árvore do tutorial pode deixar de avançar o tutorial.** Chacoalhar a árvore indicada antes da etapa 2 consome sua recompensa; quando a etapa chega, chacoalhar novamente mantém o tutorial em 2. A seta continua indicando essa árvore. Há recuperação usando outra árvore ainda não coletada, mas o percurso ensinado falha. Separar avanço do tutorial da entrega única da semente. | [main.js:264](E:/JogoCalculo/src/main.js:264), [tutorial.js:36](E:/JogoCalculo/src/systems/tutorial.js:36). §15.2, p. 28. |
| Alta | **Usina invisível na abertura.** No trecho em que a câmera aponta para a Usina, `F.visible` é `false`: o descarte por distância continua usando o herói, que está no barco perto de z=138. A explosão aparece sobre um espaço sem a construção. Usar a câmera/área da cena para decidir visibilidade durante a cinemática. | [main.js:654](E:/JogoCalculo/src/main.js:654), [cinematic.js:97](E:/JogoCalculo/src/systems/cinematic.js:97). §15.1, p. 27. |

**Orçamento gráfico reprovado**

O PDF exige até 250 draw calls e 80 mil triângulos visíveis (§3, p. 5). Medições a 1280 × 800, em uma renderização explícita da cena após posicionar a câmera, sem incluir o passe adicional da silhueta:

| Ponto | Draw calls com sombras | Triângulos com sombras | Draw calls sem sombras | Triângulos sem sombras |
|---|---:|---:|---:|---:|
| Base | 225 | 166.164 | 142 | 153.229 |
| R0 | 347 | 139.383 | 199 | 119.366 |
| R1 | 407 | 131.138 | 223 | 100.555 |
| R2 | 378 | 130.782 | 212 | 103.187 |
| R3 | 376 | 140.622 | 195 | 112.977 |
| R4 | 354 | 171.252 | 189 | 144.921 |
| Entrada da Usina | 312 | 194.598 | 167 | 165.531 |

As amostras com/sem sombras foram feitas em execuções separadas; pequenas diferenças de animação são esperadas. O contador do Three.js mede triângulos enviados para renderização, incluindo geometria encoberta; não conta somente pixels efetivamente visíveis. Mesmo sem sombras, todas as amostras excedem 80 mil. Isso confirma a necessidade de otimização, mas não permite inferir um FPS específico no computador ou celular do jogador. Há instanciamento e junção de malhas; sua presença, sozinha, não atende ao orçamento.

**Conteúdo e fidelidade ao documento**

| Item | Resultado |
|---|---|
| Interações regionais, §7.2, pp. 14–15 | Ausentes: cipó; pedras do rio; vagonete; carrossel interativo de R3; travessia Porto Euler → Península RK4; onda que apaga pegadas e golfinho periódico. O carrossel decorativo de Vila Fixa não substitui a atração interativa de R3. Essas interações não estão marcadas como opcionais no PDF. |
| Cogumelo trampolim, §7.2 | O salto a altura 3 existe, mas faltam plataformas com baú para aterrissar. Confirmado também em [DECISOES.md:34](E:/JogoCalculo/DECISOES.md:34). |
| NPCs de Jacobópolis/Seidelstadt, §7.3, p. 15 | Não há aceno simultâneo a cada 5 s em Jacobópolis nem propagação periódica em cascata em Seidelstadt. O único chamador de `doWave` está no sino e usa atraso de 0,2 s para todas as cidades. Ver [npc.js:35](E:/JogoCalculo/src/entities/npc.js:35) e [main.js:502](E:/JogoCalculo/src/main.js:502). |
| Montanha-russa ambiental, §7.2 | O passeio de 8 s existe. A passagem ambiental a cada 25 s com gritinhos não existe: os vagões circulam continuamente; os gritinhos são acionados no passeio do herói. Ver [landmarks.js:530](E:/JogoCalculo/src/world/landmarks.js:530) e [main.js:567](E:/JogoCalculo/src/main.js:567). |
| Casas decorativas, §5.2, p. 8 | O esperado é seis por cidade grande. A geração produziu **0 a 5; nenhuma das 13 recebeu seis**. Gaussburgo e Teia de Lagrange ficaram sem casas decorativas. O algoritmo abandona posições inadequadas sem garantir a quantidade. Ver [settlement.js:316](E:/JogoCalculo/src/world/settlement.js:316). |
| Evolução dos marcos, §10.3, p. 21 | Há evolução específica para as nove cidades exemplificadas no PDF. Os outros 12 marcos não recebem alteração própria ao completar a cidade: somente os efeitos comuns, como bandeiras, estrela, figurinha e chapéu. Por exemplo, Vila LU e Lagoa Simpson 1/3 têm marcos estáticos sem `evolve`, `onWin` ou `update`. O requisito geral de marco melhorado por cidade está parcial. |
| Dica reativa por inatividade, §8.1, p. 16 | Aos 90 s, a implementação abre a dica diretamente na fase. Não registra uma visita do bicho à porta para o retorno, como descrito. Duas derrotas, por outro lado, acionam `goToDoor`. Ver [fase-ui.js:258](E:/JogoCalculo/src/fases/fase-ui.js:258). |
| Preguiça guia, §8.1 | `goToDoor` define o destino, mas `update` sempre substitui esse destino pela posição atual quando o corpo é `preguica`. Ela não consegue esperar o jogador na porta após derrotas. Ver [animal.js:384](E:/JogoCalculo/src/entities/animal.js:384). |
| Animação `think` durante dica, §9.3, p. 19 | A fase chama `G.hero.play('think')`, porém o loop principal retorna antes de atualizar/renderizar o herói em modo `fase`. A ação é registrada, mas não fica visível no fluxo de dicas. Ver [main.js:632](E:/JogoCalculo/src/main.js:632). |
| Animações e painel M2, pp. 11 e 28 | Existem os estados principais, mas a corrida não aplica o multiplicador explícito de frequência ×1,6. O painel não expõe todos os estados da §6.3, como `talk` e `enter`. A entrada reduz a escala para desaparecer, em vez do fade de opacidade descrito. Ver [hero.js:217](E:/JogoCalculo/src/entities/hero.js:217), [main.js:612](E:/JogoCalculo/src/main.js:612) e [main.js:366](E:/JogoCalculo/src/main.js:366). |
| Música, §13.1, p. 23 | A tabela foi conferida visualmente: Base = Dó maior pentatônica; R0 = Fá maior. O código usa `melScale: MAJOR` na Base e `root:55, melScale:PENTA` em R0, isto é, Sol pentatônico. O campo `mel` da Base não é usado pelo gerador. A interpretação registrada em DECISOES.md está incorreta. Ver [audio.js:16](E:/JogoCalculo/src/systems/audio.js:16). |
| Música da abertura, §15.1 | Falta acrescentar uma camada por região na panorâmica. Pendência reconhecida em DECISOES.md. |
| Acessibilidade: texto mínimo de 16 px, §17, p. 30 | Há textos de 14/15 px em controles, dicas, Raizdex e mapa. No mapa a 390 px de largura, nomes e estrelas ficam aproximadamente entre 4 e 5 px porque o SVG usa fontes de 4,2 e 3,6 em `viewBox` 280. A captura confirma baixa legibilidade. Ver [style.css:234](E:/JogoCalculo/style.css:234), [map-screen.js:40](E:/JogoCalculo/src/ui/map-screen.js:40). |
| Balões de até 70 caracteres, §14 | O limite não é aplicado na criação dos balões. Há apresentações que ultrapassam 70 caracteres, como a segunda fala do Tatu. Ver [dialog.js:13](E:/JogoCalculo/src/ui/dialog.js:13) e [animals.js:31](E:/JogoCalculo/src/data/animals.js:31). |
| Partículas, §13.3 | O pool de 600 está presente. Alguns efeitos aproximam o especificado: fumaça e poeira encolhem no final, mas não perdem opacidade individualmente, pois o material é opaco e compartilhado. Reduzir movimento diminui a quantidade, sem reduzir o tamanho das partículas. Ver [particles.js:30](E:/JogoCalculo/src/systems/particles.js:30). |
| Medidas literais, §§4–5 | Terreno configurado com extensão de 280 × 280 em vez de 240 × 240; marcos a 11,5/10,5 em vez de 11; prédios a 8,3/6,6 em vez de 8/6. Gaussburgo e Teia de Lagrange foram reposicionadas. Parte dessas adaptações está registrada, mas continua divergindo de uma comparação literal. |
| Configuração, §16.3 | Muitos tempos, medidas e cores continuam espalhados por arquivos de animação, cenário e interface. A centralização em `config.js` é parcial. |

**Quantidade de casas decorativas observada**

| Cidade | Casas | Cidade | Casas |
|---|---:|---|---:|
| Bi-Polis | 5 | Teia de Lagrange | 0 |
| Falsópolis | 4 | Vale do Spline | 4 |
| Newtonópolis | 4 | Preguiçópolis | 4 |
| Secantelândia | 3 | Trapezópolis | 4 |
| Gaussburgo | 0 | Lagoa Simpson 1/3 | 1 |
| Jacobópolis | 4 | Porto Euler | 3 |
| Seidelstadt | 4 | | |

**Acesso às regiões: pendência de validação prioritária**

Uma busca de caminhos a pé, com grade de 0,5 unidade, raio do herói 0,45 e todos os portões/névoas desativados para o teste, alcançou 72.408 posições a partir do lado oeste do riacho inicial. Alcançou as zonas de interação das fases de R0, R1 e R2, mas não encontrou rota até R3, R4 ou Usina.

A investigação da Ponte do Trilho encontrou colisão na aproximação norte, perto de (62,53; −74,76), junto à muralha do Cofre-Forte Hilbert. Uma busca local mais fina também não encontrou a travessia a partir do ponto amostrado. O tabuleiro da ponte, isoladamente, tem passagem livre: a preocupação está na conexão à margem e aos obstáculos próximos.

**Esse resultado não prova que seja impossível chegar pulando ou por uma passagem não representada pela amostragem.** Não aprovo ainda o critério M8 “todas visitáveis” sem testar a travessia com o herói, depois de vencer B2, ou ajustar a aproximação e repetir a busca. Teleporte de depuração não demonstra acesso normal. Ver [bridges.js:12](E:/JogoCalculo/src/world/bridges.js:12) e [settlement.js:351](E:/JogoCalculo/src/world/settlement.js:351).

**O que passou nos testes ou está implementado no código**

| Área | Evidência |
|---|---|
| Inicialização | Three.js carregou; cena e título abriram. Nenhuma exceção no carregamento ou na amostragem inicial das sete áreas. A exceção de teclado surgiu no teste específico. |
| Conteúdo cadastrado e instanciado | 28 assentamentos = Base + 21 cidades/acampamentos de métodos + 5 arenas + Usina. 21 guias de cidade e a companheira Raizinha; os Pinguins L/U usam dois modelos. 44 NPCs. |
| Colecionáveis | Exatamente 40 raízes, oito por região, seis tipos. Estrutura de 24 figurinhas e seis cosméticos implementada. Não foram perseguidas e capturadas manualmente todas as raízes. |
| Fases | As 69 combinações concluíram com vitória/3 estrelas na geração testada, seguindo o gabarito interno. Não significa que toda matemática e toda geração aleatória estejam certificadas. |
| Dicas | Todas as entradas têm dicas 1, 2 e 3. Custos 0/1/3; teste de nível 3 consumiu quatro sementes ao subir do nível 1 ao 3, limitou a duas estrelas e aplicou XP ×0,8: 1.136 XP no caso testado. Ressalva de persistência registrada acima. |
| Progressão lógica | Limiares 12/20/20/12/20; derrotar cada chefão desbloqueou o próximo estágio no teste de estado. Usina só liberou após os cinco. Máximo de 189 estrelas das cidades e teto de 99 sementes conferidos. |
| Ponte com fase | Entrada pela porta, íris, conclusão e retorno executados. Resultado observado: vitória da Padaria/Fácil, duas estrelas, bandeira ativa, tutorial em 5 e nenhum bloqueio de controle restante. |
| Salvamento de resultado | Recarregar restaurou duas estrelas, tutorial em 5 e cinco sementes no teste de integração. A falha de salvar durante compra de dicas é uma exceção a esse fluxo. |
| Mundo | Terreno, biomas, água, caminhos, pontes, névoa, instâncias de vegetação e marcos procedurais presentes. Acesso normal e orçamento gráfico têm as ressalvas acima. |
| Interações gerais | Há implementação de grama, flores, pássaros, borboletas, peixes, pegadas, nuvens, árvores, moitas, placas, sino, fogueiras, lama e baús. Presença por inspeção de código; não foi feita uma sessão manual de cada interação. |
| Interface | HUD, minimapa, mapa, viagem rápida, diálogos e menus implementados; controles de teclado, mouse e toque presentes no código. Touch real e todos os tamanhos de tela não foram certificados. |
| Áudio/acessibilidade | Síntese de quatro camadas, crossfade, efeitos, legendas em diversos eventos, opção de sombras e redução de movimento presentes. Há divergências de música, texto e partículas descritas acima. |

**Adaptações e itens que não devem ser confundidos com bugs**

- A ausência do ciclo de dia não é falha: ele está explicitamente marcado como opcional.
- Q/R no lugar de Q/E evita conflito com interação; a rotação já era opcional no PDF.
- Pasta na raiz, arquivos auxiliares e servidor local são adaptações organizacionais documentadas.
- Recompensas de vitória/3 estrelas pagas uma única vez são uma mudança de economia registrada; o texto do PDF não impõe essa restrição para fases. Merece validação de design, sem ser confundida com o bug de persistência de dicas.
- A relação entre 40 raízes capturáveis e 24 figurinhas é ambígua no PDF. A implementação separa coleção de raízes e álbum e registra a decisão.
- As fases foram criadas de novo porque o Documento de Design não estava disponível. A existência de 69 fases executáveis não demonstra equivalência ao jogo tático originalmente previsto.

**Aceite por marco**

| Marco | Parecer |
|---|---|
| M1 | Estrutura funcional; metas de FPS e toque físico não certificadas. |
| M2 | Parcial: animações presentes, com diferenças e painel incompleto. |
| M3 | Mundo presente; conferir conexão da Ponte do Trilho e corrigir orçamento. |
| M4 | Parcial: marcos/prédios/NPCs presentes; planta e seis casas por cidade não atendidas. |
| M5 | Parcial: dicas e custos funcionam; persistência da compra e gatilhos reativos falham/divergem. |
| M6 | Interações gerais presentes no código; conjunto completo de interações regionais incompleto. |
| M7 | Fluxo básico testado e aprovado com ressalvas: erros de fase e persistência detalhados acima. |
| M8 | Conteúdo cadastrado completo; visita normal a todas as regiões ainda não aprovada. |
| M9 | Não aprovado: checklist tem falhas confirmadas de console, orçamento gráfico, acessibilidade, cinemática e fidelidade. |

Ordem recomendada: corrigir erros de fase e salvamento; validar/corrigir o acesso R2 → R3; corrigir visibilidade da cinemática e tutorial; otimizar renderização; completar interações/evoluções; ajustar música e acessibilidade; repetir os testes afetados.

**Evidências locais**

- [Resultados de conteúdo, progressão e renderização](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/audit-results.json).
- [Reprodução dos bugs e execução das 69 fases](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/flow-results.json).
- [Cinemática, casas, integração, recarga e caminhos](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/world-results.json).
- [Colisões da Ponte do Trilho](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/routing-results.json).
- [Captura da Usina ausente na cinemática](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/cine-usina.png).
- [Captura do mapa em tela estreita](C:/Users/igor-/.codex/visualizations/2026/10/25/01a17400-1cb3-7812-bb93-9480ec0e2c84/mobile-map.png).
