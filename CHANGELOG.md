# Histórico de versões

## v14 — Uma tela de perguntas para a Calculândia, os Testes no banco, a Usina final e o Bobo da Corte

**Banco de questões** (468 questões, antes 334)
- **Testes 1 a 6** da professora entram no banco, com o gabarito oficial conferido pela conta. Cada Teste tem também uma versão curta (até 4 iterações) para o jogo. Os Testes que continuam uma Bisseção já começada usam os parâmetros novos `inicio` e `anterior`, com a mesma numeração e o mesmo arredondamento do gabarito; no Newton, f e f′ são arredondados nas casas pedidas, como na calculadora.
- **86 perguntas básicas** de múltipla escolha, 4 por método do jogo, no nível do início do curso, e duas de Ponto Fixo para digitar.
- Colunas novas `casa` (verde, azul ou vermelha) e `iteracoes`. Verde: básicas, slides e conceitos. Azul: Testes e listas da Profa. Danielle. Vermelha: Listas 1 a 10 de Cálculo Numérico. O teste do banco confere as duas colunas.

**Calculândia: uma tela só para todas as perguntas** (`codigo/fases/pergunta.js`)
- Casas verde, azul e vermelha e chefões usam a mesma tela da antiga casa verde, com o selo da casa, os dispositivos no topo e a resolução completa depois de responder. Toda pergunta tem no máximo 4 iterações.
- **Terminal** nas casas azul e vermelha: a resposta é digitada como conta (`(0.5+1)/2`, `2 - f(2)/df(2)`, `ans`); Enter calcula, Enter de novo envia; 3 tentativas. A Lupa troca o terminal por alternativas.
- **Caça ao Bug Numérico** como tipo de pergunta da casa vermelha: uma tabela com exatamente uma célula errada (8 tipos: metade errada e ponto médio na Bisseção, valor velho no Gauss-Seidel, b esquecido no Gauss, erro absoluto no lugar do relativo, sinal do Newton, ponto da Falsa Posição, peso do Trapézio).
- **Chefões** como sequência de golpes, com barra de vida e 3 corações; o golpe final é o **Método Híbrido**: achar a raiz de atan(x − 1,3) gastando no máximo 8 avaliações, misturando Bisseção (custa 1), Secante (1) e Newton (2). Só um método puro não chega.
- O simulador antigo continua no botão 🧪 **Laboratório** das casas azul e vermelha.
- **Usina final** (`codigo/fases/usina-final.js`): três reatores. Bisseção de x³ − 9x + 3 em [0, 1] com 10 iterações (digita cada xₖ e escolhe a metade), Eliminação de Gauss num sistema 4×4 (os 6 multiplicadores, com pivô, linha alvo e elemento zerado em destaque, e a substituição regressiva) e Newton em x³ − 2x − 5 com 6 iterações. 5 corações e progresso salvo por reator.
- **O final:** vencida a Usina, o Grande Erro fala pela última vez, a câmera chega no reator, a **Usina explode**, a fumaça verde vira vapor, a ilha comemora com fogos e aparece a tela "Calculândia salva!".
- **Mundo que reage:** o reator da Usina gira e explode; a balança de Bi-Polis nivela conforme as casas caem; os três feixes do polvo de Gaussburgo se equilibram.
- **Vídeo-resumo** (página `/video/` do site, com botão "🎬 Vídeo do final (resumão)" na página Jogos e na tela final do jogo): gravado do próprio jogo, quadro a quadro, da abertura à explosão da Usina, com legendas.

**Bobo da Corte** (antigo Quem Divergiu?; `jogos/bobo-da-corte/`, o endereço antigo redireciona)
- Apresentadora nova, mais jovem, e o mais votado de cada rodada vira o **Bobo da Corte**: cortina, holofote, o bobo dançando e a roleta de 12 prendas leves de sala. Prenda em toda rodada, só no fim ou desligada.
- Rodadas especiais: **🎰 Bolão da Convergência** (aposta entre Bisseção e Falsa Posição, ×1,5 para quem acerta), **🌪️ Perturbação da Épsilon** (0,01 a mais no b₁: muda tudo ou quase nada? com o κ∞) e **✨ Na mosca** (+25 para 4 decimais certos). Título novo "Na mosca" e a prenda do Bobo da partida no pódio.
- O salvamento passa a `numera-bobo-da-corte-v1` e lê o antigo na primeira vez.

**Site**
- **Laboratório** (página nova, aberta pelo Terminal): aba Tátil (arraste x₀, x₀ e x₁ ou [a, b] no gráfico; bacias de convergência do Newton; **Corrida de Convergência**), aba Linhas (troque as equações até o medidor de Sassenfeld acender "Convergência garantida!"; **Testar sensibilidade** com ruído de 1% no b e o κ) e aba Fenômenos (a comporta da barragem e a treliça da ponte).
- **Modo Lousa:** toda tabela no formato dos slides tem o botão "▶ Ver construção da tabela", que preenche célula por célula e marca a ponta que herdou o xᵢ. No Gauss, passar o mouse num multiplicador destaca a linha pivô, a linha alvo e o elemento zerado.
- **Relâmpago: Caça ao Bug**, o modo novo com as 8 tabelas com erro plantado.
- **Raiz e Pivô** reagem ao método: na Bisseção a Raiz corta o intervalo ao meio com uma tesoura, no Gauss o Pivô dá o soco de boxeador, cada método tem frases próprias e, num erro em questão com seno ou cosseno, o Pivô aparece com um transferidor torto (calculadora em graus?).

**Correções**
- Respostas como `(a+b)/2` eram recusadas porque o leitor tirava os parênteses de fora mesmo quando não envolviam o texto todo.
- O resumo da Bisseção que continua do meio mostrava "8 iterações"; agora mostra de qual a qual iteração a conta foi.

## v13 — Conteúdo no formato dos slides, banco de questões em SQL e telas mais limpas

**Conteúdo de acordo com os slides da professora (Cap. 2 e Cap. 3)**
- Lições, fórmulas, exemplos e critérios de parada reescritos na notação dos slides: xᵢ = (aᵢ + bᵢ)/2, εₐ = |(x_novo − x_velho)/x_novo|, k > (log(b₀ − a₀) − log ε)/log 2, Eᵢ⁽ᵏ⁾ → Eᵢ⁽ᵏ⁻¹⁾ − mᵢₖEₖ⁽ᵏ⁻¹⁾, pivô, equação pivô, substituição regressiva e pivoteamento parcial.
- Tela nova na lição, **"Como a professora resolve"**, com a tabela do exemplo dos slides; a simulação usa os mesmos exemplos (Exemplos 05, 06, 5, 7 e 1).
- Terminal com a aba **Slides**: a tabela no formato da professora, o critério de parada escolhido e, nos sistemas, as etapas do Gauss e os critérios das linhas e de Sassenfeld.
- O Ponto Fixo continua escondido, como a professora pediu, mas já com o conteúdo no formato dela.

**Banco de questões em SQL** (`banco-de-questoes/questoes.sql`)
- 334 questões: Listas 1 a 10 (UERJ), 4ª e 5ª Listas da Profa. Danielle, perguntas dos slides e perguntas rápidas de conceito, com as versões "1º passo" das questões longas.
- Cada resposta é refeita pelo resolvedor do site (`js/motor/resolver-questoes.js`) a partir dos parâmetros da questão; o teste `tests/banco/conferir-banco.cjs` confere todas.
- 17 gabaritos das listas não conferem com a conta (por exemplo, Lista 1, 12ª: o gabarito é o 5º ponto médio, não o 4º; Lista 3, 27ª: x = 1, não 3). Cada um tem uma observação explicando, e o site mostra junto da resolução.
- Toda questão tem 4 alternativas; cada alternativa errada diz qual erro leva a ela (método trocado, uma iteração a menos, calculadora em graus, sinal trocado na fórmula, fração invertida, ordem da soma em ponto flutuante…).
- `npm run banco` gera `dist/dados/banco-de-questoes.js`, que o site e os jogos leem.

**Site**
- Página nova **Listas**: filtro por lista e por assunto, resposta digitada (ou alternativas), resolução no formato dos slides e o gabarito impresso com a observação quando ele não confere.
- **Revisão**: questão errada nas Listas ou no Relâmpago vai para o caderno, com o mesmo intervalo de 1, 3, 7 e 14 dias.
- **Relâmpago** (na página Jogos): 10 perguntas rápidas de múltipla escolha, com cronômetro, combo de até ×3 e recorde. Atalhos 1–4 e Enter.

**Calculândia**
- **Casa verde = pergunta de múltipla escolha**, direto ao entrar: uma questão do banco do método da cidade (ou, para Spline e Ponto Fixo, as perguntas da própria cidade). No topo, os **dispositivos**: sementes dos baús, Conceito (grátis), Dica (1 🌰), Lupa (2 🌰, risca uma alternativa errada), Escudo (com uma relíquia, perdoa o primeiro erro) e Inventário. Estrelas: 3 de primeira sem ajuda paga.
- **Casas azul e vermelha com a tela mais limpa**: os dispositivos foram para o topo; a missão virou uma linha que abre o contexto completo; o gráfico ocupa a largura toda; embaixo ficam só Executar e Concluir.

**Quem Divergiu?**
- As questões numéricas das listas entram no sorteio (com o passo a passo do resolvedor) e dois temas novos: Interpolação e ajuste; Integração e EDO. Dá para desligar nos ajustes.

**Organização**
- O site e a Calculândia em pastas com nomes em português: `js/motor`, `js/conteudo`, `js/paginas`, `js/site`, `js/personagens`, `css/`, `dados/`, `imagens/`; na Calculândia, `codigo/dados`, `codigo/fases`, `codigo/interface`, `codigo/personagens`, `codigo/mundo`, `codigo/sistemas`. O `app.js` virou um arquivo por página.
- [MAPA-DO-PROJETO.md](MAPA-DO-PROJETO.md): onde fica cada arquivo e a tabela dos nomes antigos para os novos.
- `docs organizacionais/` foi para `docs/organizacionais/`.

## Em andamento — Calculândia: personagem, pet e dicas de controle

- **Criação do personagem:** antes da aventura, o jogador escolhe o boneco **masculino** ou **feminino** (com cabelo, marias-chiquinhas e cílios) e digita o nome dele, com prévias 3D em cada cartão. O nome aparece nas falas, no menu e no final; as falas também mudam conforme o gênero (engenheiro/engenheira, patrão/patroa).
- **Escolha do pet:** a **Raizinha** continua, e agora há a opção **Lina e Nina**, duas gatas que seguem o herói uma de cada lado, sentam quando ele para, conversam entre si e têm falas, retrato e miado próprios. Elas também ajudam nas fases sem bicho guia.
- **Tutorial de comandos, passo a passo:** na primeira vez no mundo, um cartão no alto da tela ensina um comando por vez, em 10 passos: andar (WASD ou setas), correr (Shift), pular (Espaço), girar a câmera (Q/R), zoom (roda do mouse), interagir (E/Enter), conversas (E/Enter/Espaço e 1–3, numa conversa com o pet), pedir dica (H), mapa (M) e menu (Esc). Cada passo só avança quando o jogador faz o comando; as teclas do cartão acendem quando apertadas e andar/correr têm barra de progresso. Dá para **pular o passo** ou **pular o tutorial** (com confirmação). Na tela de toque, os textos falam de joystick e botões, e o passo de girar a câmera sai. O tutorial guiado (fogueira, riacho, árvore…) começa quando ele termina.
- **Menu → Controles:** tabela com todos os comandos de teclado e toque e um botão para refazer o tutorial de comandos.
- Saves antigos passam uma vez pela tela de criação; quem já tinha terminado o tutorial guiado não refaz o de comandos.

**Mestres, construções, inventário e questões**
- **Mestres da matemática:** Ada Lovelace recebe quem chega ao Acampamento Base; Alan Turing, Isaac Newton, Carl Friedrich Gauss, Joseph-Louis Lagrange e Leonhard Euler esperam nas regiões (datas e publicações conferidas). Cada um tem etiqueta com nome e estado da missão (nova, em andamento, concluída), conversa por E/Enter ou toque com história, missão e orientação, falas que mudam com o progresso, opção de pular a apresentação e a página **Menu → Mestres** para rever tudo. Cada missão é a Casa de Calibração da cidade do mestre; concluir rende 2 sementes uma única vez.
- **Cores por dificuldade:** prédios, placas sobre as portas (texto e símbolo), mapa, minimapa, prévia da porta e cabeçalho da questão usam verde ● fácil, azul ■ médio, vermelho ▲ difícil. Fase vencida ganha ✔ na placa e forma cheia no mapa, sem perder a cor do nível.
- **Casas de Dúvidas (amarelas):** uma por região, com conceitos, fórmulas, quando usar, requisitos, erros comuns e exemplos comentados. O botão **📘 Conceito** abre o mesmo conteúdo dentro da questão. Consultar não gasta nada.
- **Inventário (tecla I):** ferramentas, cartas de conhecimento e relíquias em grade, com item em destaque, detalhes (função, quando usar, requisitos, custo) e estados disponível, selecionada, bloqueada e incompatível. Na questão, a barra rápida e o botão Equipar trocam a ferramenta de verdade, com o custo informado antes (grátis antes de agir, 2 ⚡ depois). Os números 1–9 só abrem o item; nada é cobrado sem confirmar.
- **Dicas sem cobrança dupla:** o nível de dica já pago fica guardado por fase; sair, voltar ou conversar com outro personagem não cobra de novo. A penalidade da dica 3 (máx. 2 ⭐) é avisada no botão.
- **Problemas práticos:** as 63 missões e as etapas da Usina ganharam situação, objetivo, dados com unidades, modelo e interpretação do resultado (vazão de sensores, equilíbrio, vazões em rede, calibração, volume acumulado, resfriamento…). Os números das missões não mudaram.
- **Tela de questões reformulada:** cabeçalho compacto com região e dificuldade; instrumentos explicados ("Erro ainda não calculado", ρ e p só com evidência); missão à esquerda com apoio por nível (passo a passo no fácil, decisões no médio, análise de condições no difícil); ferramenta selecionada e parâmetros juntos; cada passo explica o que foi calculado, por quê e como ficou o erro em relação à tolerância; ações principais sempre visíveis com custo; motivo claro quando Concluir está indisponível; histórico, telemetria, professor e sobrecarga em áreas expansíveis.
- **Bhaskara Fantasma:** computador de bordo em texto com a equação, a precisão de 5 algarismos, a fórmula escolhida e cada passo (valor exato × máquina), mostrando o cancelamento. A bancada de testes compara as duas fórmulas sem gastar energia: livre no fácil, após a dica 1 no médio e após a dica 2 no difícil.
- **Correções:** no critério |xₖ − xₖ₋₁| (Falsa posição médio), o primeiro passo não conta como erro zero (antes era possível concluir sem resolver). Numa derrota, o motivo continua visível junto do último cálculo.

## v12 — Jogos: a Calculândia no lugar da Arena e o Quem Divergiu?, o jogo da sala

A turma achou a Arena fraca como jogo. No lugar dela entrou a página **Jogos**, com a Calculândia (o jogo 3D do grupo) e um jogo novo, para a professora jogar com a turma no telão. O repositório passou a reunir o site e os dois jogos, organizados numa estrutura só.

**Página Jogos (no lugar da Arena)**
- Menu, rodapé, celular e início mostram **Jogos** onde antes estava a Arena. Links antigos (`#arena`) levam à página nova.
- Dois cartões, cada um com capa, descrição e o progresso salvo no navegador:
  - Calculândia: estrelas, fases vencidas e Raízes Fugitivas;
  - Quem Divergiu?: partidas jogadas.
- Os resumos leem o salvamento de cada jogo com cada campo conferido: um salvamento quebrado não derruba a página.
- Conquistas novas: **Caçador de Raízes** (vencer uma fase da Calculândia) e **Turma reunida** (jogar uma partida do Quem Divergiu?). Agora são 12.
- O progresso antigo da Arena continua aceito nos backups, mas não conta mais nos totais. O início mostra 90 atividades: 72 etapas e 18 de missão.
- A regra de moedas "+3 por desafio da Arena" saiu. Os 23 desafios numéricos da Arena viraram as perguntas "relâmpago" do Quem Divergiu?.

**Calculândia — Caçadores de Raízes (dist/jogos/calculandia)**
- O jogo entrou no site com o histórico do Git preservado (só renomeações no primeiro commit). A documentação foi para `docs/calculandia` e os testes para `tests/calculandia`.
- **Sem nada de fora do site:** Three.js 0.160.0 e a fonte Fredoka estão no próprio site, não vêm mais de CDN nem do Google Fonts. O jogo abre na rede da faculdade e, depois da primeira visita, funciona sem internet: o service worker guarda os arquivos dele na primeira vez que ele abre, para não pesar no primeiro acesso ao site.
- **Segurança e acesso:**
  - política de segurança (CSP) na página, com o import map liberado por hash;
  - botão "← Numera Academy" na tela inicial e no menu;
  - a página permite zoom: a regra `touch-action` já protege os gestos do jogo.
- Os testes do jogo rodam em qualquer sistema: antes dependiam do Chrome do Windows. Agora entram no CI, num trabalho próprio.

**Quem Divergiu? (dist/jogos/quem-divergiu), o jogo novo**

Inspirado na dinâmica de jogos de festa: pergunta com resposta numérica, palpites em segredo, voto em quem errou feio e revelação. Aqui, a pergunta é da matéria e a revelação ensina erro relativo.

- **Cenário:** sala de aula desenhada para o telão, com quadro verde, giz e carteiras. A **Profa. Épsilon** (ε, a tolerância) comenta cada fase, e os alunos ganham bonecos próprios, gerados pelo nome.
- **Dois modos:**
  - **Telão:** palpites no caderno, com relógio opcional; a professora digita na revelação.
  - **Passa o aparelho:** cada um digita escondido, na sua vez.
- **Voto:** cada jogador aponta quem divergiu (nunca em si mesmo). Os votos são revelados juntos, com suspense.
- **Revelação na reta numérica:**
  - os palpites caem um a um, e o mais votado por último;
  - a resposta cai com as faixas de erro relativo (1%, 5% e 20%);
  - carimbos DIVERGIU!, CONVERGIU! e INJUSTIÇA! nas carteiras;
  - o botão "Como se calcula" mostra o passo a passo no quadro.
- **Pontos e fim de jogo:**
  - pontos pelas faixas (100, 60, 30 e 10);
  - bônus para o voto certeiro (+30), para quem chegou mais perto (+20) e para quem foi votado sem ter divergido (+20);
  - placar animado entre as rodadas;
  - pódio com quatro títulos: Olho de Newton, Detetive do erro, Mais divergente e Alvo da turma.
- **Perguntas:**
  - 30 próprias, de Bisseção, Falsa Posição, Newton, Secante, Gauss, Gauss-Seidel e erro e convergência, e mais 23 relâmpago;
  - respostas calculadas em código e conferidas contra o motor do site;
  - a missão do carnê e a do reservatório aparecem como perguntas;
  - a turma escolhe temas, dificuldade e rodadas, e as perguntas vão do fácil ao difícil;
  - respeitam o Ponto Fixo escondido.
- **Palpites:** aceita vírgula ou ponto, frações (5/3), 1e-6, 2,2·10⁻¹⁶ e π. A tela mostra na hora como leu o número.
- **Sala de aula de verdade:** layout para projetor de 720 linhas, tela cheia, sons sintetizados (com botão), "reduzir movimento" respeitado, leitor de tela avisado a cada fase. A turma e os ajustes ficam salvos para a próxima aula. Funciona offline.

**Organização do repositório**
- `dist/` é o site publicado, com os jogos em `dist/jogos/`. A documentação foi para `docs/`, e na raiz ficaram README, CHANGELOG e `serve.js`, um servidor local sem dependências (`npm run servir`).
- Novos comandos: `npm run testar-calculandia`. O `npm run testar` também roda as regras da Calculândia.

**Testes**
- `tests/verify.cjs`: de 1.680 para **1.994 verificações**:
  - grupo "Jogos (v12)": página, links antigos, resumos dos salvamentos e conquistas;
  - grupo "Quem Divergiu? (v12)": cada resposta conferida contra o motor, sorteio, pontuação, leitura dos palpites e página;
  - os testes da Arena saíram.
- **Fluxos no navegador:** de 97 para **118**, com uma partida inteira do Quem Divergiu? nos dois modos e a Calculândia abrindo sem nenhum pedido para fora do site.
- **Offline:** de 11 para **14**: os dois jogos sem internet.
- **Acessibilidade:** **42 telas**, com as 10 do Quem Divergiu? e a tela inicial da Calculândia.
- **WebKit:** de 28 para **33**.
- **Compatibilidade:** de 128 para **536**, agora com os jogos.
- Capturas de tela refeitas em `previews/v12-*.png`.

## v11 — gamificação: jornada por dificuldade, Raiz e Pivô, moedas e camarim

Pedido da professora, levado pelo autor: tirar o Ponto Fixo por enquanto, organizar o jogo em níveis de dificuldade (do básico ao mais difícil) e deixar a parte visual menos seca, com um personagem (ou um casal) engraçado que se mexe durante os desafios e faz algo diferente a cada 3 acertos seguidos.

**Ponto Fixo escondido (reversível)**
- Uma linha em `content.js`, `C.HIDDEN=['fixedpoint']`, tira o método das trilhas, da Arena (6 desafios), das missões (órbita do cometa), do Treino (20 exercícios), do modo prova, do gabarito completo, do Terminal, do glossário e dos textos de ajuda. Nada foi apagado: o motor, os textos, os exercícios e o progresso de quem já tinha feito etapas do Ponto Fixo continuam guardados (os ids não mudam, e backups antigos são aceitos).
- Para trazer de volta: `C.HIDDEN=[]` e `npm run atualizar`. O teste confere os dois estados: com o método escondido, 1.680 verificações; com ele de volta (Mundo 3, entre a Falsa Posição e o Newton), 1.706.
- O Treino renumera os exercícios visíveis (1 a 120) e evita dois do mesmo método seguidos. Um Terminal salvo com o Ponto Fixo selecionado volta ao Automático.

**Jornada do mais fácil ao mais difícil**
- A página Trilhas virou um mapa em zigue-zague com 6 mundos, na ordem Bisseção (★) → Falsa Posição (★★) → Newton-Raphson (★★★) → Secante (★★★) → Eliminação de Gauss (★★★★) → Gauss-Seidel (★★★★★), com selo Fácil, Médio ou Difícil e o motivo de cada posição. A seção "Por que essa ordem?" explica o critério: o que cada método exige de quem resolve (sinal → corda → derivada → reta por dois pontos sem garantia de cerco → matriz → iteração com critério de convergência) e o que a pesquisa encontrou sobre onde os alunos mais erram (fontes no próprio site e no relatório técnico).
- Cada mundo tem três níveis (Fácil, Médio e Difícil) com 4 etapas cada, e as barrinhas de cada nível aparecem no mapa.
- **Travas:** o próximo mundo abre quando o Nível 1 do anterior é concluído. A leitura e a simulação de um mundo fechado ficam sempre liberadas; só os desafios esperam. Quem já tinha progresso num mundo não perde o acesso.
- **Modo livre:** uma chave no mapa abre todos os mundos de uma vez (para quem estuda para a prova ou já sabe a ordem).
- **Arena em escada:** os desafios vêm do Fácil ao Difícil, com filtro de dificuldade ao lado do filtro de método, e a dificuldade aparece em cada desafio. Missões também mostram a dificuldade.

**Raiz e Pivô, o casal de mascotes**
- **Raiz** é um rabanete (a raiz que a gente procura em toda equação); **Pivô** é um bloquinho de matriz [1 0] de luvas de boxe (o pivô da Eliminação de Gauss) que, quando dança, dá um giro. Desenhos originais em SVG, feitos para o projeto.
- Ficam num palco no canto da tela durante os desafios (trilhas, missões, Arena e revisão), dançando enquanto a pessoa pensa. Saem de cena nas outras páginas, no Treino e no modo prova (para não distrair na avaliação).
- **Reações:** acerto (pulo com brilho), erro (a Raiz murcha e sua, o Pivô bate a luva na testa: "Divergiu… bora de novo."), **3 acertos seguidos** (o Pivô salta, soca a caixa Σ e caem moedas que voam até o contador), nível e mundo concluídos (festa com confete). Cada reação tem frases com trocadilhos de métodos numéricos ("Convergiu!", "Resíduo alto, autoestima intacta.", "TRIPLO! Toma, caixa!").
- No celular o casal fica menor, no canto de baixo, e a página ganha espaço para ele não cobrir o botão de responder. Com "reduzir movimento" ligado no sistema, eles ficam parados e as moedas não voam. Para leitor de tela, são decorativos (`aria-hidden`); o que importa (moedas, sequência, nível concluído) é anunciado em texto.

**Moedas, sequência e camarim**
- **Moedas:** +2 por etapa nova, +3 por desafio novo da Arena, +5 por etapa de missão, +5 a cada 3 acertos seguidos (só se houve ao menos uma atividade nova desde o último bônus, para não "farmar" repetindo), +10 por nível concluído e +30 por mundo completo. Bônus de nível e de mundo são pagos uma vez só.
- **Sequência:** três bolinhas no topo do desafio mostram o caminho até o próximo combo; o erro zera a sequência. A melhor sequência fica guardada.
- **Camarim** (na página Progresso): seis roupas para o casal, compradas com moedas: laço de fita e óculos de coração para a Raiz; gravata-borboleta, óculos escuros e chapéu de formatura para o Pivô; e a coroa da Raiz, o item mais caro. Dá para vestir e tirar.
- **Conquistas novas:** Combo (3 acertos seguidos), Desbravador (3 mundos completos) e Estilo próprio (primeira roupa): 11 no total.
- Moedas, roupas, melhor sequência, modo livre e bônus pagos entram no backup e são validados ao carregar.

**Correções que vieram junto**
- O fim da simulação de um mundo fechado não leva mais aos desafios ("Voltar à trilha").
- Textos de ajuda do Terminal e da aba Convergência não citam o Ponto Fixo enquanto ele está escondido.

**Testes:** `tests/verify.cjs` passou de 1.660 para **1.680 verificações** (grupo novo "Gamificação (v11)", 51 testes: método escondido e preservado, ordem e travas da jornada, modo livre, moedas e bônus, escada da Arena, mascotes, camarim e validação do backup). Fluxos no navegador de 69 para **97** (jornada, travas, combo com moedas, nível concluído, celular, camarim). Acessibilidade em **32 telas** (acerto com os mascotes, filtro de dificuldade da Arena, modo livre e camarim). WebKit de 21 para **28** (dança em CSS e moedas com Web Animations no motor do Safari). Capturas de tela refeitas em `previews/v11-*.png`.

## v10.1 — intervalo [a, b] no Terminal e expoentes elevados

Pedido do autor: nos exercícios da disciplina o intervalo vem dado ("calcule a raiz no intervalo [0, 1] pela Bisseção"), e o Terminal escondia os campos a e b nos controles avançados, com valores padrão que não eram do exercício.

**Terminal**
- **Método e intervalo à vista**, logo abaixo da equação: campo Método, intervalo [a; b] e, conforme o método, x₀, x₁, g(x) e a tolerância ε. "Ajustes avançados" ficou só com o limite de iterações e a faixa de busca.
- **Intervalo escrito junto da equação:** `x³ − 9x + 3 = 0 em [0; 1]`, `... [0, 1]`, `... no intervalo [1,5; 2]`, `x = cos(x), x ∈ [0, 1]` ou `I = [0; 2]`. Ao resolver, o intervalo sai da equação e vai para os campos. Pontas aceitam vírgula decimal e constantes como `pi/2`. O teclado científico avisa "Equação pronta, no intervalo [0; 1]".
- **O intervalo vale para todos os métodos:**
  - Bisseção e Falsa Posição: obrigatório. Sem ele, o Terminal explica e sugere intervalos com troca de sinal; com f(a) e f(b) do mesmo sinal, explica o Teorema do Valor Intermediário e aponta os pedaços do intervalo onde f troca de sinal (ex.: [0; 3] → [0,3; 0,4] e [2,8; 2,9]). Um clique na sugestão preenche e resolve.
  - Newton: sem x₀, começa na ponta onde f(x)·f″(x) > 0 (condição de Fourier) ou no ponto médio.
  - Secante: sem x₀ e x₁, começa pelas pontas a e b.
  - Ponto Fixo: sem x₀, começa no ponto médio e confere max |g′| < 1 e g([a, b]) ⊂ [a, b].
  - Automático: a busca e a comparação ficam dentro de [a, b]; com uma única raiz, todos os métodos partem dos dados do exercício.
- **Resultado:** o intervalo aparece abaixo da equação, com f(a), f(b) e o sinal; o gráfico marca a e b; a Verificação diz o que o intervalo garante; uma raiz que saiu do intervalo (Newton com x₀ ruim) é marcada como "Raiz fora do intervalo pedido". Com várias raízes no intervalo, o Terminal avisa e oferece um botão para cada pedaço. Na Bisseção, mostra quantas iterações o critério da largura do intervalo exigiria, n ≥ log₂((b − a)/ε).
- **Sem valores escondidos:** a, b, x₀ e x₁ começam vazios. Trocar de exemplo, de missão ou de exercício do Treino limpa o intervalo anterior. O histórico guarda a equação com o intervalo.

**Motor**
- `splitInterval`, `parseInterval`, `constValue`, `intervalStart`, `signChanges`, `bisectionBound` e `fixedPointCheck`.
- A busca automática deixou de descartar raízes duplas em faixas estreitas: a checagem de "raiz fantasma" encolhia junto com a faixa. Agora ela só vale para resultados que não vieram certificados.

**Expoentes elevados em todo o site**
- Nenhum texto mostra mais x^3: toda a página passa por um conversor que eleva o expoente (x³, (1 + i)⁻¹², e⁻ˣ, 10⁻⁶), nas lições, missões, Arena, Treino, gabaritos, Terminal, ajuda, mensagens de erro e avisos. A caixa onde se digita a equação continua com o teclado que eleva enquanto se digita; o campo g(x) do Ponto Fixo eleva ao sair dele. A resolução exportada em texto também sai com expoentes elevados.
- `TREINO.md` e a documentação usam expoentes elevados. As tabelas de `TESTES-TERMINAL.md` mantêm o que foi digitado tecla por tecla (com ^) ao lado de como apareceu na tela.
- Capturas de tela refeitas para a versão atual (`previews/v10.1-*.png`, script `tests/e2e/capturar-telas.mjs`); as das versões anteriores foram para `previews/versoes-anteriores/`.

**Testes:** `tests/verify.cjs` passou de 1.596 para **1.660 verificações** (grupos novos "Intervalo no Terminal", 51 testes, e "Expoentes elevados", 13); fluxos no navegador de 58 para 69; acessibilidade em 30 telas.


## v10 — correções da auditoria e aulas em vídeo

Correções dos problemas confirmados na auditoria externa (Manus, 17/10/2026) e aulas do YouTube em cada método. Detalhes item a item em [docs/RESPOSTA-A-AUDITORIA.md](docs/RESPOSTA-A-AUDITORIA.md).

**Matemática**
- **Resíduo pequeno não é mais tratado como raiz.** Todo método (e a busca automática) só aceita |f(x)| ≤ tolerância com evidência: **raiz certificada** (f troca de sinal num intervalo pequeno, com valores acima do arredondamento), **raiz provável de multiplicidade par** (sem troca de sinal, mas |f| desce até o nível do arredondamento) ou então **quase-raiz** (o mínimo de |f| perto dali fica acima do arredondamento: não é raiz). `1e-20·(x² + 1) = 0` e `(x − 1,337)² + 9·10⁻¹³ = 0` deixam de ter "raiz"; `(x − 1,337)² = 0` continua resolvida, marcada como raiz dupla.
- O ruído de arredondamento de cada f é estimado pelo tamanho dos termos da expressão (a árvore sintática do interpretador), não por um valor absoluto fixo.
- A conferência da raiz não entra no custo da comparação de métodos: "avaliações de f" continua sendo o custo do algoritmo como ele é ensinado (x³ − x − 2 com tolerância 10⁻⁶: Secante 6, Newton 7, Falsa Posição 15, Bisseção 24).
- O gráfico de f(x) ganhou escala própria para funções minúsculas ou enormes (eixo vertical em unidades de 10ᴱ): `1e-20·(x² + 1)` não aparece mais como uma reta deitada sobre o eixo, o que sugeria uma raiz em toda parte. Na quase-raiz, a aba Verificação explica que o problema é a tolerância, não o chute inicial.
- **Sistemas em escala extrema**: o teste de posto equilibra linhas e colunas antes de decidir. `1e-20·x = 1e-20, y = 1` agora dá (1, 1). Mensagens separadas para sistema dependente (infinitas soluções), incompatível (nenhuma solução) e mal condicionado (com o número de condição κ e os dígitos perdidos).
- **Gráfico de convergência com desfecho de cada série**: convergência validada, trajetória parcial (parou sem atingir o critério, com o número de iterações), divergência detectada (também a lenta) ou método incompatível com os dados. Linhas tracejadas e rótulo em texto.

**Treino e prova**
- Estado **"visto com ajuda"**: abrir o gabarito antes do acerto não conta mais como resolvido; o resumo separa tentados, vistos com ajuda, resolvidos sozinho e perfeitos.
- **Prova encerrada pelo tempo abre o relatório**, com o aviso "A prova foi encerrada pelo tempo" (também quando o tempo acabou com a página fechada).
- Estado salvo do Treino **validado ao carregar**: ids, tipos, datas, provas e histórico; JSON quebrado ou editado à mão não derruba a tela.

**Progresso**
- **Backup único** (`numera-backup-completo.json`, versão 2): trilhas, XP, Treino, provas, revisões e marcas de leitura. Arquivos antigos continuam aceitos (só trilhas) e a confirmação diz o que cada arquivo traz.
- A gravação passou a ser confirmada: se o navegador recusar (armazenamento cheio, bloqueado ou navegação privada), nenhuma mensagem de "importado" ou "reiniciado" aparece, e o site avisa que aquilo vale só para a aba aberta.

**Acessibilidade**
- O foco volta ao mesmo controle depois de cada redesenho da página (ou vai para o título da questão, na prova).
- Anúncios para leitor de tela numa região própria: início da prova, troca de questão, 5 e 1 minuto restantes, fim pelo tempo, backup exportado.

**Aulas em vídeo**
- 21 aulas do YouTube, **3 por método** (duas em português e uma em inglês), conferidas pelo título e canal: Matemática Universitária, Prof. Jalberth Fernandes, Marconi Arruda Pereira, Oscar Veliz, Jeffrey Chasnov e MIT OpenCourseWare.
- Aparecem na página de cada trilha e na última tela de "Entenda o método" (agora com 7 telas). "Assistir aqui" carrega o player do youtube-nocookie só depois do clique; "Abrir no YouTube" abre em nova aba. Os vídeos não são baixados nem guardados.

**Segurança, privacidade e manutenção**
- **Fontes empacotadas** (Figtree, Newsreader, JetBrains Mono, licença OFL): o site não chama mais o Google Fonts, e a tipografia funciona offline.
- **Política de segurança (CSP)** e Referrer-Policy na página; o registro do service worker saiu do HTML para `sw-register.js` (nenhum script embutido).
- Service worker devolve um erro de verdade (`Response.error()`) quando não há cache nem rede.
- **Playwright 1.56.1** nos testes (o `npm audit` apontava falha alta em versões anteriores à 1.55.1); `npm audit`: 0 vulnerabilidades.
- `tests/verify.cjs` passou de 1.505 para **1.596 verificações** (novo grupo com 90 testes de regressão da auditoria); fluxos no navegador de 41 para 58; acessibilidade em 27 telas.

## v9 — sete métodos, convergência, modo prova e projeto profissional

**Conteúdo**
- **Falsa Posição** e **Ponto Fixo** completos: motor (`falsePosition`, `fixedPoint`), Terminal, trilhas de 12 etapas com leitura guiada e simulação (corda e diagrama em teia), orientações, aprofundamento, 12 desafios novos na Arena e duas missões (taxa embutida num carnê; posição de um cometa pela equação de Kepler).
- As trilhas seguem a ordem clássica do curso: Bisseção, Falsa Posição, Ponto Fixo, Newton-Raphson, Secante, Gauss e Gauss-Seidel. Agora são 84 etapas, 42 desafios, 7 missões e 147 atividades com progresso.
- Glossário com **contração** e **ordem de convergência**.

**Gráfico de convergência** (`convergencia.js`)
- Nova aba **Convergência** no Terminal e gráfico no gabarito de cada exercício do Treino: erro |xₖ − x*| por iteração, em escala logarítmica, com todos os métodos aplicados aos mesmos dados de partida.
- Ordem observada calculada pelos próprios dados (inclinação de ln eₖ₊₁ contra ln eₖ): Bisseção ≈ 1 com fator 0,5; Secante ≈ 1,6; Newton ≈ 2. Em sistemas, Gauss-Seidel contra Jacobi.
- Cores validadas para daltonismo e contraste nos dois temas, legenda com a ordem e os passos até 10⁻⁸, dica ao passar o mouse, navegação pelo teclado (setas) e tabela com os números.

**Treino** (140 exercícios)
- 40 exercícios novos (20 de Falsa Posição e 20 de Ponto Fixo); total de 140, 20 por método, 53 áreas, ordem misturada sem métodos repetidos em sequência.
- A pergunta aparece **sem o nome do método** até o diagnóstico.
- **Dicas por erro típico:** 369 erros previstos e explicados (uma iteração a menos ou a mais, metade errada do intervalo, sinal trocado na fórmula, calculadora em graus, f(x) no lugar de x, Jacobi no lugar de Gauss-Seidel, lado direito esquecido no escalonamento, ordem trocada das incógnitas, outra raiz da equação…).
- Exercícios da v8 revisados para continuar coerentes com sete métodos: as pistas da Bisseção agora falam em cota de erro ou curva torta demais para a corda; os palpites da Secante deixaram de cercar a raiz; Wien e Bishop passaram para o Ponto Fixo; Kepler (Newton) ganhou órbita alongada, em que a iteração direta é lenta.
- **Modo prova:** 5, 10 ou 15 questões, cronômetro opcional, nota (0,4 pelo método e 0,6 pela resposta), relatório para imprimir ou salvar em PDF e histórico das últimas provas.
- **Revisão espaçada dos diagnósticos** errados (1, 3, 7 e 14 dias), integrada ao caderno de Revisão e à contagem do topo.
- Progresso da v8 trazido automaticamente para os 84 exercícios que não mudaram.

**Profissionalização**
- **PWA:** manifesto, ícones, service worker com cache versionado pelo conteúdo e botão “Instalar como app”. Depois da primeira visita, o site abre e calcula sem internet.
- **Testes automáticos no GitHub** (`.github/workflows/testes.yml`) e **publicação no GitHub Pages** (`pages.yml`), só quando os testes passam.
- **Acessibilidade:** auditoria com axe-core (WCAG 2.1 AA) em 25 telas, nos modos claro e escuro, com 0 violações. Contraste do texto secundário corrigido, atributos ARIA corrigidos e fluxo completo pelo teclado testado.
- **Navegadores:** testes no motor do Safari (WebKit) e verificação estática para Safari 15+, Firefox 90+ e Chrome 90+. Corrigida uma expressão regular com lookbehind que derrubava o teclado científico em Safari anterior a 16.4.
- `package.json` com os comandos do projeto, `.gitignore`, `.editorconfig`, `RELATORIO-TECNICO.md`, `QUALIDADE.md` e `TREINO.md` gerado a partir dos dados.
- `tests/verify.cjs` passou de 879 para **1.505 verificações**; o número mostrado no site é conferido pelo próprio teste.

## v8 — aba Treino
- 100 problemas misturados (20 por método) para treinar a decisão de qual método usar: diagnóstico, resolução e gabarito com passo a passo e “por que não os outros”.
- Pistas grifadas depois do diagnóstico, tabuleiro 10 × 10, estatísticas de diagnóstico, “Conferir no terminal” e impressão da lista com gabarito.
- Gabaritos gerados com sympy/mpmath e refeitos pelo motor do site (0 divergências). 879 verificações.

## v7 — Terminal
- Teclado científico com expoentes elevados sem digitar `^`, linha de status e escrita bonita no histórico.
- Busca de raízes reforçada: raízes muito próximas, raízes na borda do domínio, até 400 candidatas e raízes certificadas por troca de sinal.
- 100 equações testadas no navegador (v6: 93; v7: 100) e 1.400 no motor. 556 verificações.

## v6 — nova interface
- Abertura com demonstrações interativas, trilhas em caminho de três níveis, lições em tela cheia, modo escuro. Motor, conteúdo e progresso da v4 preservados. 510 verificações.

## v4 e anteriores
- Cinco métodos, trilhas de 12 etapas, Arena, missões de modelagem, caderno de revisão, estrelas, XP, backup e o Terminal com comparação de métodos e verificação.
