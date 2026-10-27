# DECISÕES — Calculândia (overworld)

Registro das escolhas feitas onde o *Documento do Mundo Animado* não respondia, ou onde foi preciso adaptar (regra 6 do prompt mestre).

## Estrutura e tecnologia
- **Pasta**: desde a v12 do Numera Academy, o jogo fica em `dist/jogos/calculandia/`, dentro do site (no lugar da antiga Arena); o GitHub Pages publica o site inteiro. Antes, ficava na raiz do repositório.
- **Servidor local**: módulos ES não abrem por `file://`. O `serve.js` da raiz do repositório (Node, sem dependências) serve o site: `node serve.js` → http://localhost:8000/jogos/calculandia/.
- **Three.js 0.160.0** por importmap, servido pelo próprio site (`vendor/three`, licença MIT); fonte **Fredoka** em `fonts/` (OFL), com `system-ui` de reserva. Nenhum recurso externo (até a v11 do site vinham do jsDelivr e do Google Fonts).
- Arquivos extras além da estrutura da seção 3: `src/game.js` (estado compartilhado + eventos), `src/utils/` (matemática e fábricas de primitivas), `src/world/landmarks.js` (os 28 marcos), `src/world/ground.js` (solo caminhável), `src/world/fog.js` (Névoa do Erro), `src/world/extras.js` (interações regionais), `src/entities/raiz.js` (Raízes Fugitivas), `src/systems/cinematic.js` e `tutorial.js`, `src/ui/portraits.js` e `menu.js`, `src/fases/` (fases táticas).
- **Partes estáticas "assadas"**: cada cidade junta suas malhas estáticas numa só (cores por vértice) para caber no orçamento de draw calls; vegetação usa `InstancedMesh` em blocos de 40×40 para o frustum culling funcionar.
- **Moradores** usam o mesmo esqueleto do herói, mas com as malhas de cada junta fundidas (6 malhas por NPC) e sem sombra projetada (o documento pede sombra só para herói, bichos e prédios).
- **Silhueta do herói**: quando um prédio fica entre a câmera e o herói/Raizinha, uma silhueta azul translúcida aparece (passe extra com `depthFunc = GreaterDepth`). Não estava no documento, mas evita perder o herói de vista na câmera isométrica.

## Fases táticas
- **Atualização de 25/10/2026:** o Documento de Design foi fornecido e as fases próprias de quiz foram substituídas por simulações interativas. O arquivo `src/fases/metodos.js` permanece apenas como referência histórica e não é importado pelo jogo.
- **Motor e catálogo**: `src/engine/numeric.js`, `src/fases/levels.js`, `session.js`, `tactical-ui.js` e `board.js`. Contrato de traço por operação com custo, erro, convergência e alertas; desfazer restaura o estado numérico, sem devolver energia nem apagar penalidades de dicas.
- **Bateria**: orçamento por missão e consumo por operação; bateria zero encerra a tentativa imediatamente.
- **Estrelas e XP**: convergência, precisão, eficiência, tempo, bateria e combo conforme o documento. A terceira estrela exige convergência, eficiência e ausência de vermelho; a segunda premia precisão adicional. Dica 3 mantém o limite de duas estrelas e fator de XP 0,8 do documento do mundo.
- **Sementes de vitória** (Fácil +1, Médio +2, Difícil +3, chefão +3) e o bônus de 3 estrelas (+1) só são pagos **na primeira vez**, para não virar "fazenda" de sementes.
- **Chefões** têm três etapas, energia compartilhada, Fúria e mudanças de patologia. A **Usina** transmite os parâmetros do sistema linear à função de temperatura e depois à EDO de resfriamento.
- "Sair" no meio da fase não conta como derrota (não ativa o gatilho reativo).
- **Precisão e balanceamento**: ajustes numéricos necessários e decisões sobre ambiguidades estão descritos em `IMPLEMENTACAO_REGRAS.md`. Os dados das outras seis combinações do Módulo 0, não individualizadas pelo PDF, reutilizam a missão correspondente.

## Mundo
- **Rios como fronteiras**: cada região é separada por um rio que só se cruza pela ponte do portão; assim a Névoa do Erro realmente tranca as regiões. A ilha também tem um anel de muralha na Usina com o portão em (0, 27).
- **Riacho do tutorial** (1,2 de largura) atravessa o Acampamento Base entre a fogueira e a estrada para R0.
- **Ajustes de posição**: Gaussburgo passou de (−30, −75) para (−25, −77) e a Teia de Lagrange de (65, −55) para (68, −52), para as praças não ficarem em cima do cânion/rio. O caminho Base → R0 ganhou os pontos (−20, 86) e (−62, 72) para contornar o acampamento Cancelamento. O contorno da ilha se alarga perto de cidades na costa (Seidelstadt, Simpson 3/8).
- **Escalas musicais** (tabela 13.1, conferida): Base = Dó maior pentatônica, R0 = Fá maior, R1 = Lá menor pentatônica, R2 = Ré dórico, R3 = Sol maior, R4 = Fá maior, Usina = Mi frígio. Na panorâmica da abertura cada região sobrevoada acrescenta sua camada.
- **Arenas com saída**: as arenas de chefão ficam sobre a estrada. Além do portão de entrada (estrelas mínimas), cada uma tem um portão de saída voltado para a ponte seguinte, que abre quando o chefão cai. Sem ele, a muralha do Cofre-Forte fechava a Ponte do Trilho e R3, R4 e a Usina ficavam inalcançáveis a pé (`tests/world-reach.cjs` verifica todas as portas).
- **Casas decorativas**: a posição usa a ocupação real (prédios, marco, cercadinho, estradas, água e cidades vizinhas) e garante as 6 casas em todas as 13 cidades.
- **Marcos sem evolução no PDF**: turbina (pás douradas e mais rápidas), carrossel (voltas inteiras), telefone (pulso maior e mais rápido) e teia (nós acesos) ganharam evolução própria; os demais ganham uma coroa dourada animada com brilho.
- **Balões**: no máximo 70 caracteres; frases maiores viram balões em sequência.
- **Mapa**: rótulos com pelo menos 16 px reais (nome curto + estrelas); em telas estreitas os rótulos somem e o nome completo aparece numa barra ao tocar na cidade.
- **Interações da §7.2**: o riacho do cipó (8 de largura) e o das pedras (pedras a 1,4) são posicionados depois das cidades, usando as colisões reais; árvores e grama sob a água são removidas. O vagonete liga Gaussburgo a Jacobópolis; o barquinho liga docas na costa do Porto Euler e da Península RK4. Os cogumelos-trampolim têm plataformas de folhas a altura 3, algumas com baú.
- **Orçamento gráfico**: troncos sem tampa, copas poliédricas, trigo mais simples, água 64×64, terreno 24×24 por bloco, pássaros e partículas só desenhados quando ativos/perto, sombra só das peças grandes e dos bichos a menos de 22 unidades. Medido a 1280×800: 52–84 mil triângulos e 134–206 chamadas no passe principal (167–267 com o passe de sombra).
- **Rotação da câmera**: Q e **R** (o documento sugeria Q/E, mas E já é "interagir").
- **Raizdex**: 24 figurinhas = 21 Raízes da Cidade (ganhas ao completar as 3 fases) + 3 secretas (pegar uma Raiz Complexa, pegar as 40 Raízes Fugitivas, vencer a Usina). As 40 Raízes Fugitivas ficam numa seção própria do Raizdex. Cada página de 4 figurinhas libera um dos 6 cosméticos.
- **Raiz Falsa**: some ao ser tocada, mas conta no Raizdex (e dá as 2 sementes).
- **Tutorial** só guia; o jogador pode ignorá-lo. Sementes aparecem no HUD após a árvore do tutorial; minimapa após a primeira fase.
- **H no overworld**: a Raizinha repete o próximo objetivo (dentro da fase, H chama o bicho guia).

## Opcionais e pendências (não implementados)
- Ciclo de dia [OPCIONAL].
- A animação `think` do herói durante a dica não aparece porque a fase cobre o mundo.
- Partículas encolhem em vez de perder opacidade (o pool instanciado usa um material opaco compartilhado).

## Depuração
- `?debug=1` abre um painel de testes: todas as animações do herói (critério do M2), +10 sementes, "vencer próxima" e teleporte por região.
