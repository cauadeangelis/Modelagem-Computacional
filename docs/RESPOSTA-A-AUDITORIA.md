# Resposta à auditoria externa (v10)

A auditoria "Análise profissional — Numera Academy v9" (Manus, 17/10/2026) apontou problemas confirmados e sugestões de evolução. Esta tabela diz o que a v10 fez com cada item. Todos os itens corrigidos ganharam testes de regressão no grupo "Correções da auditoria (v10)" de `tests/verify.cjs` (90 verificações) e nos fluxos de navegador.

## Achados críticos (P1) e Fase 0

| Item da auditoria | Situação na v10 | O que mudou |
|---|---|---|
| Resíduo pequeno apresentado como raiz (`1e-20·(x² + 1)`, `(x − 1,337)² + 9·10⁻¹³`) | **Corrigido** | Cada método só aceita \|f\| ≤ tolerância com evidência: troca de sinal acima do arredondamento (raiz certificada), \|f\| no nível do arredondamento sem troca de sinal (raiz provável de multiplicidade par) ou nenhuma das duas (quase-raiz, rejeitada). O ruído é estimado pelo tamanho dos termos da expressão. O Terminal mostra o estado no título, na resposta e na aba Verificação; quase-raiz não entra no histórico, e o gráfico de f(x) ganhou escala própria para que uma função minúscula não pareça deitada sobre o eixo. A conferência não entra no custo da comparação de métodos. |
| Sistemas válidos rejeitados após reescala (`1e-20·x = 1e-20`, `y = 1`) | **Corrigido** | O teste de posto equilibra linhas e colunas antes de decidir. Mensagens distintas para dependente, incompatível e mal condicionado (com κ). A eliminação continua com pivotamento parcial comum, o que o curso ensina; a escala só entra no teste de unicidade. |
| Gráfico de convergência mostrando trajetória parcial como convergência | **Corrigido** | Cada série traz `status` (convergiu, parcial, divergiu, falhou, outra raiz), nota e iterações executadas. Legenda, tabela e descrição para leitor de tela mostram o desfecho; parcial e divergência ficam tracejadas. Divergência lenta também é detectada. |
| Backup sem Treino, provas e revisões | **Corrigido** | Um único arquivo versionado (`backupVersion: 2`) com trilhas, Treino, provas, revisões e marcas de leitura. Backups antigos continuam aceitos (só trilhas), e a confirmação diz o que o arquivo traz. |
| Fim da prova pelo tempo não abre o relatório | **Corrigido** | Ao expirar, a prova é encerrada, o relatório abre com "A prova foi encerrada pelo tempo" e o leitor de tela é avisado. Se o tempo acabou com a página fechada, o relatório abre ao voltar. |
| "Resolvido com ajuda" sem correspondência no tabuleiro | **Corrigido** | Estados novo, em andamento, diagnóstico a revisar, visto com ajuda, resolvido e perfeito. O resumo separa tentados, vistos com ajuda, resolvidos sozinho e perfeitos. |
| Foco e anúncios no modo prova | **Corrigido** | O foco volta ao mesmo controle depois de cada redesenho; na prova vai ao título da questão e, no fim, ao relatório. Uma região `aria-live` anuncia início, troca de questão, 5 e 1 minuto restantes e o fim pelo tempo. O relógio continua sem anunciar cada segundo. |
| Playwright com vulnerabilidade conhecida | **Corrigido** | Playwright 1.56.1 em `tests/e2e` e `tests/terminal`, lockfiles refeitos; `npm audit`: 0 vulnerabilidades. |
| Testes de armazenamento bloqueado, estado corrompido e reescala | **Corrigido** | Testes novos para cada caso, inclusive o app carregado com `localStorage` que recusa gravação. |

## Arquitetura, segurança e manutenção

| Item | Situação | Observação |
|---|---|---|
| 5.2 Estado do Treino sem validação | **Corrigido** | `normalize()` aceita só ids conhecidos, tipos certos, datas válidas e tamanhos limitados; JSON quebrado vira estado vazio. |
| 5.3 Falha de armazenamento mascarada como sucesso | **Corrigido** | `persist()` e o `save()` do Treino devolvem sucesso ou falha; mensagens de sucesso só aparecem quando a gravação foi confirmada. |
| 5.4 Fontes externas e fallback do service worker | **Corrigido** | Fontes empacotadas (OFL) e em cache offline; nenhuma chamada ao Google Fonts; `Response.error()` quando não há cache nem rede. |
| 5.4 Cabeçalhos de segurança | **Parcial** | CSP e Referrer-Policy foram para a página (`<meta>`), sem nenhum script embutido. `Permissions-Policy` e `X-Content-Type-Options` só existem como cabeçalho HTTP, e o GitHub Pages não permite cabeçalhos próprios; ficam para uma hospedagem que permita. |
| 5.1 Modularização (core/, content/, state/, ui/) | **Não feito** | É uma reorganização grande sem mudança visível para o aluno. O motor já é independente da interface e testado no Node; a separação de `app.js` fica como próxima etapa técnica. |

## Testes

| Item | Situação | Observação |
|---|---|---|
| 6.1 Fuzz "exercita execução, não correção" | **Já existia** | `tests/terminal/fuzz/conferir.py` compara cada raiz com uma referência independente (raízes exatas do sympy nos polinômios; varredura de 2 milhões de pontos refinada pelo mpmath com 40 dígitos nas transcendentes), conta raízes que faltam e raízes a mais, e falha no CI se houver alguma. A auditoria provavelmente leu só `rodar-motor.cjs`. Resultado atual: 1.000/1.000 e 398/400, com os 2 casos explicados (a referência perde raízes duplas de cos(x) − 1). |
| 6.2 Regressão visual por screenshots | **Não feito** | Os testes geram capturas, mas não comparam pixel a pixel. |
| 6.3 Firefox e leitores de tela reais | **Continua pendente** | Sem Firefox no ambiente de testes e sem testes com pessoas. Continua declarado na documentação. |

## UX e evolução (Fases 1 a 3)

Onboarding por objetivo, modo Essencial/Aprofundado no gabarito, navegação do celular com menos destinos, mapa de competências, modo professor, provas por semente com exportação em CSV e o piloto com alunos **não entraram na v10**. São mudanças de produto que pedem decisões suas (por exemplo, o que tirar da barra do celular) e, no caso do piloto, uma turma. Continuam como próximos passos, nessa ordem de prioridade.

## Pedido seu, além da auditoria

**Aulas em vídeo:** 21 aulas do YouTube, 3 por método (duas em português, uma em inglês), conferidas pelo título e canal. Elas aparecem na página de cada trilha e na última tela de "Entenda o método". O site aponta para os vídeos ou abre o player do YouTube na própria página; não os baixa. Baixar vídeos do YouTube viola os termos do serviço e o direito autoral dos professores, e deixaria o site com centenas de megabytes.
