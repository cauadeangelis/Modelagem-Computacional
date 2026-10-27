# Implementação das regras de Caçadores de Raízes

Atualização de 25/10/2026, após a auditoria do Documento de Design. O mundo 3D continua sendo a entrada para as fases; as portas agora lançam simulações numéricas, em lugar do quiz.

## Funcionalidades entregues

- Catálogo dos 21 métodos, em três dificuldades, com funções, matrizes, leituras, nós, EDOs, tolerâncias e baterias das missões. O Módulo 0 reutiliza cada cenário nas dificuldades que o PDF não detalha individualmente.
- Motor matemático separado da interface: raízes, eliminação e pivoteamento, LU reutilizável, refinamento, Jacobi/Seidel, Newton/Lagrange, spline natural/completa via Thomas, MMQ linear/exponencial/centralizado, quadraturas, adaptatividade, Euler explícito/implícito e RK4.
- Arredondamento e truncamento, meia precisão, float32, cancelamento, overflow e soma compensada de Kahan no chefão.
- Estado por operação, histórico e desfazer; custos por operação; vitória condicionada à precisão e às condições de conclusão; derrota imediata por energia ou integridade zero.
- Arsenal com escolha inicial e troca de método; controles equivalentes por teclado, mouse e toque; âncoras, mira, sondas, nós e reta arrastáveis; manipulação de linhas/colunas e multiplicadores; h/n ajustáveis.
- Campo Canvas com tangentes, cordas, teia de ponto fixo, intervalos, curvas, resíduos, áreas interpoladas, trajetórias, campo de direções e quatro sondas de RK4. Resolução ajustada a `devicePixelRatio`, alvos de arraste de 48 px e controles de pelo menos 44 px.
- Integridade, energia, erro, radar logarítmico, razão de convergência, ordem estimada, alertas e telemetria; modo professor por D; Auto executa uma operação e Sobrecarga Manual ativa tempo/integridade.
- Fórmula de XP e combo, estrelas, penalidade de dica L3, perks por XP, registro de relíquias e Diário de Campo com traço e imagem congelada da derrota. Saves antigos ganham os novos campos sem perder o progresso do mundo.
- Seis batalhas de três etapas. Fúria altera a função, condicionamento ou rigidez; a Hidra regenera quando se repete a ferramenta anterior. No final, a solução linear determina a temperatura crítica, e a temperatura calculada define o resfriamento.
- Áudio sintetizado com camadas condicionadas a energia, erro, tolerância e integridade; feedback sonoro/visual ligado aos traços numéricos.
- Guias e dicas preservados. O gasto de sementes é salvo imediatamente. O fluxo de entrada/saída pela porta foi testado e a sobreposição da íris que bloqueava cliques foi corrigida.

## Validação

Comando sem dependências adicionais: `node --test tests/calculandia/rules.test.mjs`.

A suíte contém 79 testes, incluindo solução das 63 combinações de missão dentro da energia, seis batalhas completas, referências numéricas independentes, laboratório de bits, fórmula de XP, patologias, bateria zero, prévia, configuração e desfazer. Os testes de referências conferem valores concretos de bisseção, Newton, secante, RK4, Jacobi, LU, spline e MMQ.

`node tests/browser-smoke.cjs` usa Playwright/Chrome em contexto isolado. Verifica montagem de todas as 69 entradas, conclusão de Trapézios, persistência de XP, derrota/diário, estudo de relíquia, teclado sem operação duplicada, Tab, arraste, largura de 390 px e fluxo real porta → fase → vitória → mundo. Não usa o save do navegador do jogador. As dependências de Playwright/Chrome podem ser indicadas pelas variáveis descritas no README.

## Decisões e ajustes em relação aos números do PDF

1. **Bisseção Fácil:** a sétima aproximação de x³−x−2 em [1,2] é 1,5234375, com cota 1/128. O valor 1,5214 da p. 22 é a raiz de referência, não o sétimo ponto médio. O teste usa o ponto e a cota reais.
2. **Seidel Difícil:** a matriz fornecida, partindo de zero, atinge erro máximo <10⁻⁶ em 25 varreduras, não em aproximadamente 20. A bateria foi calibrada de 25 para 30, seguindo a orientação de reservar cerca de 20% acima do mínimo, e evitando vitória com bateria zero.
3. **Gauss/Hilbert:** a eliminação mantém quatro casas decimais. O refinamento calcula o resíduo em alta precisão e prepara fatores da correção com oito algarismos, cobrando n+1 na primeira correção e 1 nas seguintes. Isso permite a precisão exigida dentro de dois refinamentos. LU/Hilbert reutiliza seus próprios fatores de cinco algarismos.
4. **Escolha inicial:** selecionar a ferramenta antes da primeira operação é gratuito. Trocar depois custa 2. Isso permite escolher o combo de Simpson na missão com oito avaliações e bateria 9; cobrar troca antes de começar tornaria esse orçamento impossível.
5. **Acumulador:** o PDF dá 100 leituras e bateria 8, sem custo por leitura. Cada leitura custa 0,05, totalizando 5; o lote de dez apenas repete a operação com a política escolhida. Os dados têm viés positivo no truncamento e cancelamento parcial no arredondamento.
6. **Estrelas:** a terceira estrela exige convergência, no máximo i_ótimo+1 operações e nenhum alerta vermelho. A segunda premia erro ≤τ/10 e energia positiva. A terceira não depende da segunda, pois impor ambas eliminaria a recompensa de eficiência em várias missões do catálogo. A dica L3 limita a duas.
7. **Erro zero:** o fator logarítmico de precisão recebe diretamente seu teto de 1,5, evitando NaN/Infinity no XP.
8. **Curva em U:** a tela distingue o erro medido da quadratura float32 do modelo E(h)=h²/3+ε/h. O objetivo compara o excesso relativo do modelo ao mínimo teórico (limite 20%); cada experimento custa 1. Não apresenta o modelo como se fosse erro medido.
9. **Erros máximos de curvas:** interpolação e spline usam uma malha de referência de 1001 pontos, explicitada na interface; essa é uma estimativa numérica do máximo contínuo.
10. **RPG:** níveis/perks, dano por alerta, duração da sobrecarga e baterias de chefes sem valor explícito no PDF receberam parâmetros concretos no código. As relíquias necessárias são oferecidas como ferramentas da missão; vencer chefes ou estudar derrotas registra os conceitos no inventário permanente.
11. **Final:** o documento define a dependência entre etapas, sem fórmulas específicas. A média da solução de H₄ define T*=1+média(x); a função é T²−T*²; a temperatura encontrada define λ=20+10T e y(0)=T na EDO de resfriamento.

12. **Critério |xₖ − xₖ₋₁|:** o primeiro passo não tem iterado anterior; o erro fica indefinido até o segundo passo (antes, o ponto médio igual ao chute inicial dava erro zero).
13. **Dicas pagas:** o nível de dica comprado é guardado por fase em `ajuda` no save e não é cobrado de novo. A penalidade da dica 3 vale para a tentativa em que ela é exibida.

## Organização

- `src/engine/numeric.js`: operações matemáticas puras.
- `src/fases/levels.js`: dados e orçamento de cada missão/batalha.
- `src/fases/session.js`: ações, critérios, traços, alertas, pontuação e encadeamento.
- `src/fases/tactical-ui.js` e `board.js`: interface, interação e visualização.
- `src/systems/progress.js` e `save.js`: XP, combo, perks, diário e migração do save.
- `src/systems/audio.js`: música e efeitos condicionados ao estado numérico.
- `src/fases/fase-ui.js`: reexportação compatível para importações antigas.

As auditorias anteriores são registros do estado anterior a esta implementação. A auditoria do mundo animado inclui questões próprias do overworld, fora desta mudança das regras táticas.
