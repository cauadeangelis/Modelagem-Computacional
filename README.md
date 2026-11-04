# Numera Academy

Jogo e laboratório de **métodos numéricos** para a disciplina de Modelagem Computacional. Num só site:

- **Jornada:** seis métodos (Bisseção, Falsa Posição, Newton-Raphson, Secante, Eliminação de Gauss e Gauss-Seidel) em mundos do mais fácil ao mais difícil, com lições, simulações, missões, moedas e **Raiz e Pivô**, o casal de mascotes que torce durante os desafios. O conteúdo segue os slides da professora (Cap. 2 e Cap. 3): mesma notação, mesmas tabelas e mesmos exemplos.
- **Listas:** as questões das listas da disciplina num **banco de questões em SQL** ([`banco-de-questoes/`](banco-de-questoes/README.md)), com correção na hora, resolução no formato dos slides e explicação quando o gabarito impresso não confere com a conta. Questão errada vai para a **Revisão**.
- **Jogos:**
  - **Relâmpago:** 10 perguntas rápidas de múltipla escolha, com cronômetro e combo.
  - **Calculândia — Caçadores de Raízes:** aventura 3D com 63 fases, 21 métodos, cinco chefões e a Usina. As casas verdes trazem uma pergunta de múltipla escolha do banco; as azuis e vermelhas, o simulador.
  - **Quem Divergiu?:** jogo de sala para o telão. A professora projeta uma pergunta com resposta numérica, cada aluno faz um palpite em segredo, a turma vota em quem divergiu e a reta numérica revela a resposta.
- **Treino de diagnóstico** com 120 exercícios, **modo prova** e um **Terminal** que mostra cada passo do cálculo, com a aba **Slides** (tabela no formato da professora) e gráfico de convergência.

É um site estático: HTML, CSS e JavaScript puros, sem build, sem servidor, sem conta e sem rastreadores. Funciona offline e pode ser instalado como app.

**Versão 13** · [Mapa do projeto (onde fica cada arquivo)](MAPA-DO-PROJETO.md) · [O que mudou](CHANGELOG.md) · [Banco de questões](banco-de-questoes/README.md) · [Relatório técnico](docs/RELATORIO-TECNICO.md) · [Roteiro de apresentação](docs/APRESENTACAO.md) · [Qualidade](docs/QUALIDADE.md) · [Calculândia](docs/calculandia/README.md)

| Listas: resolução no formato dos slides e o gabarito da lista que não confere | Calculândia: a casa verde com os dispositivos no topo |
|---|---|
| ![Questão da Lista 1 com a tabela da Bisseção e a observação sobre o gabarito](previews/v13-listas-questao.png) | ![Pergunta de múltipla escolha da casa verde de Bi-Polis](previews/v13-calculandia-casa-verde.png) |
| **Relâmpago:** pergunta rápida com cronômetro | **Calculândia:** a tela mais limpa das casas azul e vermelha |
| ![Pergunta do Relâmpago respondida](previews/v13-relampago-resposta.png) | ![Simulador do Newton com a tela nova](previews/v13-calculandia-tela-limpa.png) |

## Abrir

```bash
node serve.js            # ou: npm run servir
```

Abra http://localhost:8000. O site também abre direto do disco (`dist/index.html`), mas a Calculândia usa módulos ES e precisa de um endereço `http(s)`: pelo `serve.js`, por `python3 -m http.server 8000 -d dist` ou publicado no GitHub Pages ([como publicar](#publicar)).

| Endereço | O que abre |
|---|---|
| `/` | Numera Academy (início, trilhas, missões, listas, jogos, Treino, Terminal) |
| `/#listas` | as questões das listas (banco de questões) |
| `/#relampago` | modo Relâmpago |
| `/#jogos` | página Jogos, com o progresso salvo de cada jogo |
| `/jogos/calculandia/` | Calculândia (3D) |
| `/jogos/quem-divergiu/` | Quem Divergiu? (telão da sala) |

## O que tem

| Parte | Conteúdo |
|---|---|
| **Jornada (Trilhas)** | 6 mundos em ordem de dificuldade (★ a ★★★★★), cada um com 12 etapas em três níveis, leitura guiada, aulas em vídeo e simulação passo a passo. O Nível 1 de um mundo abre o próximo; o **modo livre** abre tudo |
| **Raiz e Pivô** | mascotes que dançam durante os desafios; a cada **3 acertos seguidos**, o Pivô soca a caixa Σ e caem moedas |
| **Missões** | 6 problemas aplicados em três etapas: formular, calcular e interpretar |
| **Listas** | 334 questões (Listas 1 a 10, 4ª e 5ª Listas da Profa. Danielle, perguntas dos slides e de conceito), com filtro por lista e por assunto, resposta digitada ou alternativas, resolução no formato dos slides e observação quando o gabarito da lista não confere |
| **Relâmpago** | 10 perguntas rápidas por rodada, com cronômetro, combo de até ×3 e recorde; atalhos 1–4 e Enter |
| **Jogos** | **Relâmpago**, **Calculândia** (aventura 3D, para jogar sozinho) e **Quem Divergiu?** (jogo de sala, para a turma inteira) |
| **Treino** | 120 problemas misturados: diagnosticar o método, resolver e conferir, com **369 erros típicos** reconhecidos |
| **Modo prova** | 5, 10 ou 15 questões, cronômetro, nota de 0 a 10 e relatório em PDF |
| **Terminal** | equações e sistemas lineares, intervalo [a, b] do exercício, teclado científico, comparação de métodos, aba **Slides** (tabela no formato da professora), aba Convergência e verificação da raiz |
| **Progresso** | XP, moedas, 12 conquistas (2 delas pelos jogos), camarim e backup em JSON |

### Quem Divergiu? em sala

1. **Monte a turma:** até 12 nomes, ou times (Fileira 1, Fileira 2…). Escolha os temas que a turma já viu, a dificuldade e o número de rodadas.
2. **Palpite em segredo:**
   - **Telão:** cada um escreve o número no caderno, com relógio opcional.
   - **Passa o aparelho:** cada um digita escondido, na sua vez.
3. **Voto:** cada jogador aponta quem ele acha que chutou mais longe. Os votos aparecem juntos.
4. **Revelação:** a resposta cai na reta numérica, com as faixas de erro relativo de 1%, 5% e 20%.
   - Quem mais se aproximou leva o carimbo CONVERGIU; quem mais se afastou, DIVERGIU.
   - O botão "Como se calcula" mostra o passo a passo no quadro.

Pontos: até 1% de erro vale 100, até 5% vale 60, até 20% vale 30 e até 50% vale 10. Há bônus para quem acertar o voto (+30), para quem chegar mais perto (+20) e para quem foi votado sem ter divergido (+20). No fim, pódio e títulos (Olho de Newton, Detetive do erro, Mais divergente, Alvo da turma).

São 30 perguntas próprias, os 23 desafios numéricos da antiga Arena (como "relâmpago") e as questões numéricas das listas (banco de questões; dá para desligar nos ajustes). As respostas são **calculadas**, nunca digitadas, e conferidas nos testes contra o motor do site.

## Organização

Cada pasta tem um assunto e cada arquivo tem o nome do que faz. O [Mapa do projeto](MAPA-DO-PROJETO.md) lista tudo, arquivo por arquivo, e traz a tabela dos nomes antigos para os novos.

```text
banco-de-questoes/            as questões das listas em SQL (questoes.sql) e o gerador do arquivo do site
dist/                         o site (o que o navegador abre)
  index.html                  página do site
  css/                        estilos (site, listas, terminal, treino, personagens…)
  js/motor/                   métodos numéricos, formato dos slides e resolvedor das questões
  js/conteudo/                textos das lições e exemplos dos slides
  js/paginas/                 uma página por arquivo (início, trilhas, lição, listas, relâmpago, terminal…)
  js/site/                    moldura, estado, desenhos e eventos
  js/personagens/             Raiz e Pivô
  dados/                      dados gerados (banco-de-questoes.js, treino-exercicios.js)
  jogos/calculandia/          Calculândia: index.html, estilo.css, codigo/ (dados, fases, interface, personagens, mundo, sistemas)
  jogos/quem-divergiu/        Quem Divergiu?: index.html, quem-divergiu.js, perguntas.js
docs/                         relatório técnico, apresentação, qualidade, Calculândia e documentos organizacionais
tests/                        testes automáticos (verify, banco, calculandia, e2e, treino, terminal, pwa)
previews/                     capturas de tela
serve.js                      servidor local sem dependências
```

## Testes

```bash
npm run testar               # verify + banco de questões + gabarito do Treino + cache offline + regras da Calculândia
npm run servir               # em outro terminal, para os testes de navegador
npm run testar-navegador     # compatibilidade, fluxos, offline e acessibilidade (Playwright: cd tests/e2e && npm ci)
npm run testar-calculandia   # Calculândia no navegador: as 69 montagens de fase, as 21 casas verdes e o alcance do mapa
```

| Suíte | O que confere |
|---|---|
| `tests/verify.cjs` | motor, conteúdo, formato dos slides, progresso, interface (DOM simulado), Treino, prova, PWA, página Jogos e Quem Divergiu? |
| `tests/banco/conferir-banco.cjs` | as 334 questões refeitas pelo resolvedor do site, alternativas (4, uma certa, cada errada explicada) e observação em todo gabarito da lista que não confere |
| `tests/treino/conferir-com-motor.cjs` | os 140 gabaritos do Treino refeitos pelo motor |
| `tests/calculandia/rules.test.mjs` | regras das 63 fases, chefões, Usina, bateria, estrelas e XP |
| `tests/calculandia/browser-smoke.cjs` e `world-reach.cjs` | todas as fases abrem no navegador, as casas verdes trazem a pergunta, vitória e derrota salvas, portas alcançáveis a pé |
| `tests/e2e/testar-fluxos.mjs` | fluxos completos do site, inclusive Listas, Revisão e Relâmpago, a página Jogos e o Quem Divergiu? |
| `tests/e2e/testar-offline.mjs` | o site e os jogos abrem sem internet |
| `tests/e2e/auditar-a11y.mjs` | axe-core, WCAG 2.1 AA, no modo claro e no escuro, inclusive Listas e Relâmpago |
| `tests/e2e/testar-webkit.py` | motor do Safari (WebKit) |
| `tests/e2e/checar-compat.mjs` | ES2021 e recursos suportados (site e Quem Divergiu?: Safari 15+; Calculândia: módulos ES) |

Antes de enviar uma mudança, rode `npm run atualizar`: ele acerta o número de verificações mostrado no site e a versão do cache offline. Mudou o `questoes.sql`? Rode `npm run banco` antes.

## Publicar

O repositório não tem mais workflows do GitHub Actions. Para ver o site, baixe o repositório e rode `npm run servir`. Para publicar no GitHub Pages, é preciso um workflow que publique a pasta `dist/` (o Pages, sem workflow, só publica a raiz ou a pasta `docs/`). Repositório privado: o GitHub Pages exige um plano pago.

## Ponto Fixo escondido por enquanto

A professora pediu para tirar o Ponto Fixo por enquanto. Em `dist/js/conteudo/conteudo.js`, a linha `C.HIDDEN=['fixedpoint'];` o tira das trilhas, das missões, do Treino, do Terminal e do Quem Divergiu?. Para trazê-lo de volta:

1. troque a linha por `C.HIDDEN=[];`;
2. rode `npm run atualizar`.

## Navegadores

| Parte | Mínimo | Testado de verdade |
|---|---|---|
| Site (com Listas e Relâmpago) e Quem Divergiu? | Chrome/Edge 90+, Firefox 90+, Safari 15+ (iOS 15+) | Chromium e WebKit (motor do Safari) |
| Calculândia (3D) | WebGL 2 e Chrome/Edge 98+, Firefox 94+, Safari 15.4+ | Chromium (WebGL por software) |

O Firefox foi verificado por análise estática. Detalhes em [docs/QUALIDADE.md](docs/QUALIDADE.md).

## Dados e privacidade

Tudo fica no `localStorage` do navegador; nada é enviado para servidor:

| Chave | Parte |
|---|---|
| `numera-academy-v4` | trilhas, missões e questões das listas (acertos e Revisão) |
| `numera-relampago-v1` | Relâmpago: recorde e número de rodadas |
| `numera-treino-v9` | Treino |
| `calculandia-save-v1` | Calculândia |
| `calculandia-perguntas-vistas-v1` | Calculândia: últimas perguntas das casas verdes, para não repetir |
| `numera-quem-divergiu-v1` | Quem Divergiu?: nomes da turma, ajustes e número de partidas |

Fontes, Three.js e imagens vêm do próprio site. A única coisa de fora são as aulas do YouTube: o player só carrega quando você clica em "Assistir aqui".

## Créditos

- **Numera Academy** e **Quem Divergiu?:** Cauã De Angelis (Engenharia de Computação, UVA), para Modelagem Computacional.
- **Conteúdo e questões:** slides do Cap. 2 e do Cap. 3 e a 4ª e a 5ª Listas da Profa. Danielle Teixeira; Listas 1 a 10 de Cálculo Numérico (UERJ).
- **Calculândia:** Igor Mariano.
- **Personagens:** Raiz, Pivô, a Profa. Épsilon e os alunos do Quem Divergiu? são desenhos originais em SVG.
- **Bibliotecas:** Three.js (MIT) e as fontes Figtree, Newsreader, JetBrains Mono e Fredoka (SIL OFL), com as licenças junto dos arquivos.

Fórmulas e condições dos métodos conferidas nas referências do [relatório técnico](docs/RELATORIO-TECNICO.md).
