# Mapa do projeto

Onde fica cada coisa. A regra geral: **cada pasta tem um assunto e cada arquivo tem o nome do que ele faz**, em português. Quer achar o código dos bonecos? É JavaScript, então está em `js/` (site) ou em `jogos/calculandia/codigo/` (jogo 3D), na pasta `personagens/`.

```text
Modelagem-Computacional/
├── MAPA-DO-PROJETO.md        este arquivo
├── README.md                 o que é, como abrir, testar e publicar
├── CHANGELOG.md              o que mudou em cada versão
├── package.json              atalhos: npm run servir, testar, banco, atualizar…
├── serve.js                  servidor local sem dependências (http://localhost:8000)
├── banco-de-questoes/        AS QUESTÕES DAS LISTAS, em SQL (separado de todo o resto)
├── dist/                     o site publicado (tudo o que o navegador abre)
├── docs/                     relatório técnico, apresentação, qualidade, documentação do jogo 3D
├── previews/                 capturas de tela das versões
└── tests/                    testes automáticos
```

## Perguntas rápidas: "onde está…?"

| Quero mexer em… | Arquivo |
|---|---|
| uma questão das listas (enunciado, resposta, alternativas) | `banco-de-questoes/questoes.sql` e depois `npm run banco` |
| o texto de uma lição, a fórmula ou o exemplo de um método | `dist/js/conteudo/conteudo.js` |
| as contas no formato dos slides (tabelas da Bisseção, etapas do Gauss…) | `dist/js/motor/passo-a-passo.js` |
| a matemática do Terminal (Bisseção, Newton, Gauss, Seidel…) | `dist/js/motor/motor-numerico.js` |
| como uma questão do banco é resolvida e conferida | `dist/js/motor/resolver-questoes.js` |
| a página Listas | `dist/js/paginas/listas.js` e `dist/css/listas.css` |
| o modo Relâmpago | `dist/js/paginas/relampago.js` |
| os bonecos Raiz e Pivô (site) | `dist/js/personagens/raiz-e-pivo.js` e `dist/css/personagens.css` |
| o herói, a Raizinha, as gatas e os bichos (Calculândia) | `dist/jogos/calculandia/codigo/personagens/` |
| a pergunta da casa verde (Calculândia) | `dist/jogos/calculandia/codigo/fases/pergunta-rapida.js` |
| a tela das casas azul e vermelha (Calculândia) | `dist/jogos/calculandia/codigo/fases/tela-da-questao.js` |
| as perguntas do Quem Divergiu? | `dist/jogos/quem-divergiu/perguntas.js` |
| o menu do topo, o rodapé e o menu do celular | `dist/js/site/moldura.js` |
| cores, fontes e espaçamentos do site | `dist/css/site.css` |
| os exercícios do Treino | `dist/dados/treino-exercicios.js` (gerado por `tests/treino/gerar-treino.py`) |
| o progresso salvo (XP, revisão, estrelas) | `dist/js/progresso/progresso.js` |

## `banco-de-questoes/` — as questões em SQL

| Arquivo | O que é |
|---|---|
| `questoes.sql` | **a fonte das questões.** Banco SQLite com as tabelas `listas`, `temas`, `questoes` e `alternativas`: as Listas 1 a 10 (UERJ), a 4ª e a 5ª Listas da Profa. Danielle (Ibmec), perguntas dos slides e perguntas rápidas de conceito |
| `gerar-arquivo-do-site.cjs` | lê o `questoes.sql` e gera `dist/dados/banco-de-questoes.js`, que o site e os jogos usam |
| `README.md` | como editar, conferir e abrir o banco |

## `dist/` — o site

| Pasta ou arquivo | O que tem |
|---|---|
| `index.html` | a página do site; carrega os arquivos abaixo nesta ordem |
| `manifest.webmanifest`, `sw.js` | instalar como app e funcionar offline (`sw.js` é atualizado por `npm run atualizar`) |
| `css/` | estilos: `site.css` (geral), `listas.css` (Listas e Relâmpago), `terminal.css`, `treino.css`, `grafico-de-convergencia.css`, `personagens.css`, `fontes.css` |
| `dados/` | dados gerados: `banco-de-questoes.js` (do SQL) e `treino-exercicios.js` |
| `fontes/`, `imagens/` | fontes e ícones do próprio site (nada vem de fora) |
| `jogos/` | os dois jogos e as capas da página Jogos |

### `dist/js/` — JavaScript do site

| Pasta | Arquivo | O que faz |
|---|---|---|
| `motor/` | `motor-numerico.js` | métodos numéricos do Terminal e leitor de expressões |
| | `passo-a-passo.js` | os métodos no formato dos slides da professora (tabelas, etapas, notação Eᵢ⁽ᵏ⁾) |
| | `resolver-questoes.js` | refaz a conta de cada questão do banco e confere respostas |
| `conteudo/` | `conteudo.js` | textos das lições, exemplos dos slides, missões, glossário, métodos escondidos |
| `progresso/` | `progresso.js` | XP, estrelas, revisão espaçada e backup |
| `personagens/` | `raiz-e-pivo.js` | o casal de mascotes Raiz e Pivô |
| `terminal/` | `teclado-cientifico.js`, `grafico-de-convergencia.js` | teclado e gráfico do Terminal |
| `treino/` | `treino.js` | página Treino e modo prova |
| `offline/` | `registrar-offline.js` | registra o `sw.js` |
| `site/` | `estado-e-utilitarios.js` | estado da página e utilitários de HTML (ícones, botões) |
| | `jornada-e-backup.js` | jornada do fácil ao difícil, backup e navegação |
| | `moldura.js` | barra do topo, menu do celular e rodapé |
| | `ilustracoes.js`, `demonstracoes.js`, `visuais-das-secoes.js`, `graficos.js` | desenhos e animações em SVG |
| | `eventos-e-inicializacao.js` | cliques, teclado, desenho da página e abertura (carrega por último) |
| `paginas/` | `inicio.js`, `trilhas.js`, `licao.js`, `missoes.js`, `jogos.js`, `listas.js`, `relampago.js`, `revisao-e-progresso.js`, `terminal.js`, `aulas-em-video.js` | uma página do site por arquivo |

Os arquivos de `js/site/` e `js/paginas/` são scripts comuns que compartilham as mesmas variáveis; por isso a ordem do `index.html` importa.

### `dist/jogos/calculandia/` — o jogo 3D

| Pasta | O que tem |
|---|---|
| `index.html`, `estilo.css` | página e estilos do jogo |
| `bibliotecas/three/` | Three.js 0.160.0 (MIT), servido pelo próprio site |
| `fontes/` | fonte Fredoka (OFL) |
| `codigo/principal.js` | início do jogo, laço principal e entrada nas casas |
| `codigo/jogo.js`, `codigo/configuracao.js` | estado compartilhado e números de ajuste |
| `codigo/dados/` | tabelas: regiões e cidades, bichos guias, dicas, falas, conhecimento (cartas), contextos das missões, mestres |
| `codigo/fases/` | as fases: `abrir-fase.js` (escolhe a tela), `pergunta-rapida.js` (casa verde), `tela-da-questao.js` (casas azul e vermelha), `catalogo-de-fases.js`, `sessao.js`, `quadro.js`, `grafico.js`, `metodos-numericos.js`, `numeros.js` |
| `codigo/interface/` | telas e painéis: inventário, Casa de Dúvidas, menu, mapa, minimapa, diálogos, criação do personagem |
| `codigo/personagens/` | herói, Raizinha, Lina e Nina, bichos, moradores, mestres, animações |
| `codigo/mundo/` | ilha: terreno, água, céu, cidades, pontes, estradas, baús |
| `codigo/sistemas/` | áudio, câmera, controles, colisão, progresso, salvamento, tutorial |
| `codigo/motor/numerico.js` | matemática das fases |
| `codigo/utilitarios/` | geometria e matemática auxiliar |

### `dist/jogos/quem-divergiu/` — o jogo de sala

| Arquivo | O que faz |
|---|---|
| `index.html`, `quem-divergiu.css` | página e estilos |
| `quem-divergiu.js` | telas do jogo (turma, palpites, votos, revelação) |
| `perguntas.js` | perguntas próprias, desafios da Arena e as questões numéricas do banco de questões |

## `tests/`

| Pasta ou arquivo | O que confere |
|---|---|
| `verify.cjs` | motor, conteúdo, interface, Treino, PWA e Quem Divergiu? (milhares de verificações no Node) |
| `atualizar.cjs` | acerta o número de verificações mostrado no site e a versão do cache offline |
| `banco/conferir-banco.cjs` | refaz todas as questões do banco e confere respostas, alternativas e observações |
| `calculandia/` | regras das fases, fumaça no navegador (inclui as casas verdes) e alcance do mapa |
| `e2e/` | navegador: fluxos, offline, acessibilidade, compatibilidade, WebKit e capturas |
| `treino/` | gerador e conferência do Treino |
| `terminal/`, `pwa/`, `a11y/`, `rendered/` | Terminal, cache offline, resultado do axe e páginas renderizadas |

## `docs/`

| Arquivo ou pasta | O que é |
|---|---|
| `RELATORIO-TECNICO.md`, `APRESENTACAO.md`, `QUALIDADE.md`, `LIMITES-NUMERICOS.md`, `TREINO.md`, `TESTES-TERMINAL.md` | documentação do site |
| `calculandia/` | documentação do jogo 3D (regras, decisões, auditorias) |
| `organizacionais/` | documentos de organização do grupo (5W2H e diagrama) |

## Nomes antigos → nomes novos (v13)

Para quem tinha o projeto antes da reorganização.

| Antes | Agora |
|---|---|
| `dist/app.js` | dividido em `dist/js/site/*` e `dist/js/paginas/*` |
| `dist/math-engine.js` | `dist/js/motor/motor-numerico.js` |
| `dist/content.js` | `dist/js/conteudo/conteudo.js` |
| `dist/progress.js` | `dist/js/progresso/progresso.js` |
| `dist/mascotes.js` / `mascotes.css` | `dist/js/personagens/raiz-e-pivo.js` / `dist/css/personagens.css` |
| `dist/calculator.js` / `calculator.css` | `dist/js/terminal/teclado-cientifico.js` / `dist/css/terminal.css` |
| `dist/convergencia.js` / `convergencia.css` | `dist/js/terminal/grafico-de-convergencia.js` / `dist/css/grafico-de-convergencia.css` |
| `dist/treino.js`, `treino-data.js` | `dist/js/treino/treino.js`, `dist/dados/treino-exercicios.js` |
| `dist/sw-register.js` | `dist/js/offline/registrar-offline.js` |
| `dist/styles.css`, `fonts.css`, `fonts/` | `dist/css/site.css`, `dist/css/fontes.css`, `dist/fontes/` |
| ícones da raiz (`favicon.svg`, `icon-*.png`…) | `dist/imagens/` |
| `jogos/quem-divergiu/qd.js`, `qd.css` | `quem-divergiu.js`, `quem-divergiu.css` |
| `jogos/calculandia/src/` | `jogos/calculandia/codigo/` |
| `src/main.js`, `game.js`, `config.js` | `codigo/principal.js`, `jogo.js`, `configuracao.js` |
| `src/bridge/level-launcher.js` | `codigo/fases/abrir-fase.js` |
| `src/data/*` | `codigo/dados/*` (`settlements` → `regioes-e-cidades`, `animals` → `bichos-guias`, `hints` → `dicas`, `dialogs` → `falas`, `historicos` → `mestres-historicos`) |
| `src/entities/*` | `codigo/personagens/*` (`hero` → `heroi`, `raiz` → `raizinha`, `companion` → `companheiro`, `gatas` → `gatas-lina-e-nina`, `animal` → `bichos`, `npc` → `moradores`, `historico` → `mestres-da-matematica`, `rig` → `corpo-articulado`, `animations` → `animacoes`) |
| `src/fases/*` | `codigo/fases/*` (`tactical-ui` → `tela-da-questao`, `levels` → `catalogo-de-fases`, `session` → `sessao`, `board` → `quadro`, `plot` → `grafico`, `metodos` → `metodos-numericos`) |
| `src/systems/*` | `codigo/sistemas/*` (`input` → `controles`, `collision` → `colisao`, `particles` → `particulas`, `progress` → `progresso`, `save` → `salvamento`, `cinematic` → `cinematica`, `interaction` → `interacao`, `mestres` → `dicas-dos-mestres`) |
| `src/ui/*` | `codigo/interface/*` (`hud` → `painel-do-jogador`, `map-screen` → `tela-do-mapa`, `minimap` → `minimapa`, `dialog` → `dialogos`, `portraits` → `retratos`, `transitions` → `transicoes`, `creator` → `criacao-de-personagem`, `duvidas` → `casas-de-duvidas`) |
| `src/world/*` | `codigo/mundo/*` (`terrain` → `terreno`, `water` → `agua`, `sky` → `ceu`, `ground` → `chao`, `settlement` → `cidades`, `roads` → `estradas`, `bridges` → `pontes`, `landmarks` → `marcos`, `props` → `objetos`, `fog` → `neblina`, `ambient` → `ambiente`, `extras` → `baus-e-surpresas`) |
| `src/utils/*`, `src/engine/numeric.js` | `codigo/utilitarios/*` (`geo` → `geometria`, `math` → `matematica`), `codigo/motor/numerico.js` |
| `jogos/calculandia/style.css`, `vendor/`, `fonts/` | `estilo.css`, `bibliotecas/`, `fontes/` |
| `docs organizacionais/` | `docs/organizacionais/` |
