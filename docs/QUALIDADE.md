# Qualidade: testes, acessibilidade, navegadores e funcionamento offline

Este documento resume como o site foi conferido (a tabela vem da v10.1, com as suítes acrescentadas depois) e como repetir cada conferência. Todos os números abaixo vêm da última execução das suítes.

## Testes automáticos

| Suíte | Como rodar | O que confere | Resultado |
|---|---|---|---|
| Banco de questões (v13) | `node tests/banco/conferir-banco.cjs` | as 334 questões de `banco-de-questoes/questoes.sql` refeitas pelo resolvedor do site a partir dos parâmetros (valor, vetor, matriz e resolução); arquivo do site em dia com o SQL (e o leitor simples lê igual ao SQLite); 4 alternativas com uma só correta e cada errada explicada; observação em todo gabarito da lista que não confere; nada de LaTeX | 334 / 334, 17 gabaritos divergentes explicados |
| Verificações gerais | `node tests/verify.cjs` | parser sem `eval`, propriedades dos 7 métodos, entradas inválidas, busca automática, sistemas em escalas de 1e−20 a 1e15, convergência e ordem observada, conteúdo das 84 etapas, dos desafios (hoje perguntas relâmpago do Quem Divergiu?) e das missões, progresso e backup, interface com DOM simulado (todas as páginas, Terminal, modo guiado), Treino (os 140 exercícios resolvidos pela interface), prova, revisão, migração da v8, PWA, o número exibido no site e as correções da auditoria externa (quase-raízes, raízes duplas, sistemas reescalados, status da convergência, backup completo, armazenamento bloqueado, estado corrompido, fim da prova pelo tempo, foco e anúncios, aulas em vídeo, fontes e CSP) e o intervalo [a, b] do Terminal (intervalo digitado na equação, pontas com vírgula e pi, mesmo sinal com sugestões, Fourier no Newton, pontas na Secante, teste de contração no Ponto Fixo, raiz fora do intervalo, várias raízes, automático restrito ao intervalo, histórico, missões) os expoentes elevados (nenhum x^3 à vista em nenhuma tela; caixa de digitação, atributos e desenhos intactos) e, na v11, a gamificação: Ponto Fixo escondido de todas as telas mas preservado no motor, no conteúdo e no progresso (e de volta a todas elas quando `C.HIDDEN` fica vazio), ordem e travas da jornada, modo livre, regras de moedas e bônus pagos uma vez, mascotes, camarim e validação do backup e, na v12, a página Jogos (links antigos da Arena, resumos dos salvamentos dos jogos, conquistas) e o Quem Divergiu? (cada resposta conferida contra o motor, sorteio repetível, pontuação, leitura dos palpites) | **1.994 / 1.994** |
| Gabarito do Treino | `node tests/treino/conferir-com-motor.cjs` | refaz as 140 respostas (geradas com sympy/mpmath, 50 dígitos) com o motor do site; confere que nenhum dos 369 erros típicos é aceito como certo e que os 140 gráficos de convergência mostram o método certo chegando à raiz | **0 divergências** |
| Gerador reproduzível | `python3 tests/treino/gerar-treino.py /tmp/t.js && cmp /tmp/t.js dist/treino-data.js` | o arquivo publicado é exatamente o que o gerador produz | idêntico |
| Terminal no navegador | `tests/terminal/` (ver TESTES-TERMINAL.md) | 100 equações digitadas tecla por tecla; 19 cenários do teclado científico; 1.000 polinômios e 400 equações transcendentes direto no motor, cada raiz comparada com uma referência independente (sympy exato nos polinômios; varredura densa refinada pelo mpmath com 40 dígitos nas transcendentes), contando raízes que faltam e raízes a mais | **100 / 100**; 19 / 19; 1.000 / 1.000 e 398 / 400 (2 erros da referência, explicados) |
| Fluxos completos | `node tests/e2e/testar-fluxos.mjs URL` | trilhas dos métodos novos, missões, Terminal (Falsa Posição, convergência com mouse e teclado), Treino (erro típico, gabarito), uso só com teclado, revisão, prova completa com nota 10, impressão do relatório, celular (8 páginas sem rolagem lateral), modo escuro; na v10, quase-raiz e raiz dupla no Terminal, aulas em vídeo (cartões, player sob demanda, links), prova encerrada pelo tempo com relatório e foco, backup completo; na v10.1, intervalo escrito na equação, mesmo sinal com sugestões clicáveis, Enter no campo b, celular sem rolagem lateral, nenhum ^ à vista no Terminal, na ajuda, na missão do carnê e no gabarito completo do Treino; na v11, mapa com só o Mundo 1 aberto, mundo fechado com leitura e simulação liberadas, mascotes dançando e reagindo ao erro, combo com moedas voando até o contador, nível concluído abrindo o Mundo 2, celular sem rolagem lateral e sem o casal cobrir o botão, modo livre, compra e roupa no camarim, Ponto Fixo fora do Terminal e das missões; na v12, a página Jogos (link antigo #arena, capas), uma partida inteira do Quem Divergiu? no telão (pergunta, relógio, votos, palpites lidos na hora, reta, carimbos, cálculo, placar, pódio, salvamento) e no passa o aparelho, e a Calculândia abrindo sem nenhum pedido para fora do site | **118 / 118** |
| Offline (PWA) | `node tests/e2e/testar-offline.mjs URL` | service worker ativo, 36 arquivos em cache (incluindo as 6 fontes e o Quem Divergiu?), a Calculândia guardada na primeira visita, manifesto, páginas, Terminal e tipografia funcionando sem internet | **14 / 14** |
| Acessibilidade | `node tests/e2e/auditar-a11y.mjs URL` | axe-core 4.10, regras WCAG 2.0/2.1 A e AA, em 42 telas (incluindo as aulas em vídeo e o Terminal com intervalo: erro com sugestões, resultado e avisos, e, na v11, o mapa da jornada, um mundo travado, o acerto com os mascotes em cena, o camarim e o modo livre; na v12, a página Jogos, as 10 telas do Quem Divergiu? e a tela inicial da Calculândia), nos modos claro e escuro | **0 violações** (86 / 86) |
| Motor do Safari | `xvfb-run -a python3 tests/e2e/testar-webkit.py URL` | WebKitGTK 2.52 + Selenium: todos os scripts carregam, 8 páginas, teclado científico, convergência, Newton com x₀, jornada travada, mascotes dançando (animação CSS), combo com moedas (Web Animations), Treino e prova , e uma rodada inteira do Quem Divergiu? | **33 / 33** |
| Compatibilidade | `node tests/e2e/checar-compat.mjs` | todo `.js` é ES2021 válido (acorn) e não usa recursos ausentes em Safari 15, Firefox 90 ou Chrome 90; CSS recente só como melhoria progressiva ; na v12, o Quem Divergiu? com a mesma regra e os módulos da Calculândia (módulo ES válido, nada importado de fora) | **536 / 536** |
| Calculândia | `node --test tests/calculandia/rules.test.mjs` · `node tests/calculandia/browser-smoke.cjs` · `node tests/calculandia/world-reach.cjs` | regras das 63 fases, dos chefões e da Usina (bateria, estrelas, XP, desfazer); no navegador, as 69 montagens de fase, vitória, derrota e dica salvas, celular sem rolagem lateral; e uma busca a pé que alcança todas as portas do mapa | **79 / 79**, sem erros |

Na v13 os testes de navegador também cobrem a página Listas, a Revisão com questões das listas, o Relâmpago (rodada inteira pelo teclado), as 21 casas verdes da Calculândia e as telas novas na auditoria de acessibilidade. O repositório não tem mais workflows do GitHub Actions: rode as suítes localmente (`npm run testar`, `npm run testar-navegador`, `npm run testar-calculandia`).

## Acessibilidade

Telas auditadas (cada uma no tema claro e no escuro): início, trilhas, página de uma trilha, lição (leitura, simulação e prática), missões, missão, Jogos, Terminal vazio e com resultado (solução, passos, comparação, convergência, verificação e “resolver comigo”), Treino (exercício, gabarito, revisão, prova: início, questão e relatório, gabarito completo), Revisão, Progresso com o camarim e, na v11, o mapa da jornada (com e sem o modo livre), um mundo travado e um acerto com Raiz e Pivô em cena.

Correções feitas na v9 a partir da auditoria:
- **Contraste:** o tom de texto secundário (`--subtle`) passou de #8B9396 (2,8:1 sobre o fundo) para #687175 (4,5:1) no tema claro e de #7D888B para #8E999C no escuro. O botão “Resolver” do Terminal ganhou um estado de foco/hover com contraste suficiente. As etapas bloqueadas do Treino deixaram de usar transparência no texto.
- **ARIA:** `aria-label` em `div` e `span` sem papel recebeu o papel adequado (`img` nas barras de progresso, estrelas e vidas; `group` no gráfico interativo e na barra da prova), e as fórmulas deixaram de esconder o próprio conteúdo atrás de um rótulo genérico.
- **Teclado:** o gráfico de convergência recebe foco e é percorrido com as setas (Home e End vão ao começo e ao fim); o diagnóstico e a resposta do Treino funcionam só com Tab e Enter. O foco visível já existia (contorno azul de 3 px) e o modo “movimento reduzido” desliga animações.
- **Cor nunca sozinha:** no gráfico, cada método tem cor, nome na legenda e tabela de números; no Treino, o estado de cada casa do tabuleiro também é anunciado em texto.

Correções feitas na v10 a partir da auditoria externa:
- **Foco preservado:** depois de cada redesenho da página, o foco volta ao mesmo controle. Na prova, ao trocar de questão o foco vai ao título da questão; ao terminar (pelo botão ou pelo tempo), ao título do relatório.
- **Anúncios:** uma região `aria-live` fora da área redesenhada anuncia início da prova, troca de questão, 5 e 1 minuto restantes, fim pelo tempo, backup restaurado ou recusado e falha de gravação. O cronômetro não anuncia cada segundo.
- **Status além da cor:** no gráfico de convergência, cada série tem um selo em texto (convergiu, parcial, divergiu); parcial e divergência também ficam tracejadas. No Terminal, quase-raiz aparece com rótulo próprio, não só com outra cor.

Cuidados de acessibilidade na v12 (Quem Divergiu?):
- A reta numérica é uma imagem com descrição completa (a resposta e o palpite e o erro de cada um), e os mesmos números aparecem em texto nas carteiras.
- Uma região `aria-live` anuncia cada fase (pergunta, vez de cada um, votos, resultado). O relógio só avisa quando o tempo acaba.
- Botões de voto dizem quem vota em quem ("Ana vota em Bruno"); os campos de palpite têm rótulo com o nome do aluno.
- Com "reduzir movimento" ligado, a revelação aparece pronta, sem quedas nem carimbos animados.
- Nenhum botão se mexe ao ser pressionado: mexer na caixa muda a área de clique, e um clique na borda se perdia.

Cuidados de acessibilidade na v11:
- **Mascotes decorativos:** o palco de Raiz e Pivô tem `aria-hidden="true"` e fica fora da área redesenhada; tudo o que eles comunicam (moedas ganhas, combo, nível concluído, mundo liberado) também aparece no retorno da questão e é anunciado na região `aria-live`.
- **Movimento:** com "reduzir movimento" ligado no sistema (`prefers-reduced-motion`), o casal fica parado e as moedas e o confete não aparecem. Os mascotes também não aparecem no Treino nem no modo prova, para não distrair na avaliação.
- **Travas e dificuldade em texto:** cada mundo do mapa tem um rótulo completo para leitor de tela ("Mundo 3: Newton-Raphson. Dificuldade Médio, 3 de 5. 0 de 12 etapas. Desafios bloqueados."); as estrelas de dificuldade têm `role="img"` e rótulo; o modo livre é um `role="switch"` com `aria-checked`.

A auditoria automática cobre o que pode ser medido por regras. Testes com pessoas usando leitores de tela não foram feitos.

## Navegadores

| Navegador | Versão mínima | Como foi conferido |
|---|---|---|
| Chrome / Edge | 90 | Chromium 141 (Playwright 1.56.1, `npm audit` sem vulnerabilidades): todas as suítes |
| Safari (macOS e iOS) | 15 | WebKitGTK 2.52 (mesmo motor) com Selenium; análise estática |
| Firefox | 90 | análise estática (o Firefox não pôde ser baixado no ambiente de testes); recomenda-se abrir uma vez antes da apresentação |
| Calculândia (3D) | WebGL 2 · Chrome/Edge 98, Firefox 94, Safari 15.4 | Chromium com WebGL por software; o jogo usa `Array.prototype.at` e `structuredClone` |

Recursos de CSS recentes aparecem só como melhoria: `:has()` (destaque do campo no modo expoente), `text-wrap: balance` (títulos) e `aspect-ratio` (casas do tabuleiro e player de vídeo, com alternativa por `padding-top` quando falta). Sem eles, a página continua completa.

## Segurança e privacidade

- **Política de segurança (CSP)** em `<meta>`: scripts, estilos, fontes e imagens só do próprio site; molduras só de `https://www.youtube-nocookie.com`; sem `eval` e sem script embutido no HTML (o registro do service worker foi para `sw-register.js`). `Referrer-Policy: strict-origin-when-cross-origin`.
- **Sem chamadas externas ao abrir:** fontes empacotadas em `dist/fonts/` (Figtree, Newsreader e JetBrains Mono, licença SIL OFL, arquivos de licença junto). O player do YouTube só é criado quando a pessoa clica em "Assistir aqui".
- **Limite:** `Permissions-Policy`, `X-Content-Type-Options` e `frame-ancestors` só funcionam como cabeçalho HTTP, e o GitHub Pages não permite cabeçalhos próprios. Numa hospedagem que permita (Netlify, Cloudflare Pages), vale configurá-los.
- **Dados guardados:** o Treino e o backup são validados ao carregar (`normalize()`); dados quebrados viram estado vazio em vez de travar a página. Se o navegador recusar a gravação, a página avisa em vez de dizer "salvo".

## Funcionamento offline (PWA)

- `dist/manifest.webmanifest`: nome, ícones (192, 512 e adaptável), cores e atalhos para Treino e Terminal.
- `dist/sw.js`: guarda os 36 arquivos do site (incluindo as fontes e o Quem Divergiu?) na primeira visita; a Calculândia (≈ 1,5 MB) é guardada na primeira vez que abre. A versão do cache é um resumo do conteúdo dos arquivos (`tests/pwa/atualizar-sw.cjs`), então qualquer mudança gera um cache novo e o antigo é apagado. Páginas tentam a rede primeiro; arquivos vêm do cache. Pedidos para outros sites (o player do YouTube) não passam pelo service worker. Sem cache e sem rede, a resposta é um erro de verdade (`Response.error()`).
- O botão **Instalar como app** aparece no rodapé quando o navegador permite.
- Abrindo `index.html` direto do disco (`file://`), o site funciona igual, mas o navegador não permite service worker; o modo offline instalável vale para o endereço publicado. Também em `file://` o player do YouTube não é embutido (o YouTube recusa essa origem); ficam os links.

## Antes de publicar uma mudança

```bash
npm run gerar-treino      # se mudou o gerador do Treino
node tests/treino/gerar-treino-md.cjs   # atualiza TREINO.md
npm run atualizar         # acerta o número de verificações do site e a versão do cache offline
npm run testar
```
