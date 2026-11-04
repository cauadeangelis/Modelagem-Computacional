# Calculândia — Caçadores de Raízes

> **v13:** o código foi reorganizado em pastas com nomes em português (`codigo/dados`, `codigo/fases`, `codigo/interface`, `codigo/personagens`, `codigo/mundo`, `codigo/sistemas`; antes `src/`), e `vendor/`, `fonts/` e `style.css` viraram `bibliotecas/`, `fontes/` e `estilo.css`. Os nomes de arquivo citados nos documentos mais antigos desta pasta (auditorias e decisões) são os da versão anterior: a correspondência está no [Mapa do projeto](../../MAPA-DO-PROJETO.md#nomes-antigos--nomes-novos-v13). A casa verde agora abre uma pergunta de múltipla escolha do banco de questões do site (`codigo/fases/pergunta-rapida.js`).

> **v12:** o jogo agora faz parte do site Numera Academy, no lugar da antiga Arena: o código está em `dist/jogos/calculandia/`, os testes em `tests/calculandia/` e esta documentação em `docs/calculandia/`. Three.js 0.160.0 e a fonte Fredoka são servidos pelo próprio site (`vendor/` e `fonts/`), sem CDN, e o jogo funciona offline depois da primeira visita.

Overworld 3D do jogo de Cálculo Numérico, feito a partir do *Documento do Mundo Animado*. Three.js, tudo gerado por código (primitivas, animação procedural, áudio sintetizado), sem etapa de build.

## Como rodar

Precisa de um servidor local (módulos ES não abrem por `file://`):

Na raiz do repositório:

```bash
node serve.js
```

Depois abra http://localhost:8000/jogos/calculandia/. Para o painel de testes: http://localhost:8000/jogos/calculandia/?debug=1. Também dá para entrar pelo site: **Jogos → Jogar a Calculândia**.

## Controles

| Ação | Teclado / mouse | Toque |
|---|---|---|
| Andar | WASD ou setas · clique no chão | joystick · toque no chão |
| Correr | Shift | toque duplo no joystick |
| Pular | Espaço | botão Pular |
| Interagir | E ou Enter | botão Interagir |
| Dica | H | botão Dica |
| Mapa / Menu | M / Esc | botões 🗺️ / ☰ |
| Câmera | roda = zoom · Q/R giram 90° | pinça = zoom |

Na fase tática: **Auto** (ou Enter/Espaço fora dos campos) executa uma operação numérica; **H** chama o guia; **D** abre o modo professor. Arraste âncoras, mira, sondas e nós, ou use os campos equivalentes. Linhas de matriz podem ser arrastadas para preparar uma eliminação. Troque ferramentas pelo arsenal; **Estabilizar** só libera quando os critérios da missão forem atendidos.

## Regras numéricas e validação

As portas agora usam o simulador do *Documento de Design do Jogo*: 63 fases, cinco chefões e a Usina. Cada missão tem dados, tolerância, bateria e armadilhas próprios. Há integridade, radar, telemetria, desfazer, relíquias, XP acumulado, perks e Diário de Campo no menu. O progresso antigo do mundo é preservado.

```bash
node --test tests/calculandia/rules.test.mjs
```

Para o mundo: `node tests/calculandia/world-reach.cjs` faz uma busca a pé (sem pulos, com portões abertos) e falha se alguma porta de fase ficar inalcançável. Também usa Playwright/Chrome e não altera o save.

O teste de navegador é opcional e precisa de Playwright e Chrome: `node tests/calculandia/browser-smoke.cjs`. Usa o Playwright de `tests/e2e` (`cd tests/e2e && npm ci`) e o Chromium dele; aceita `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE` (no Windows, usa o Chrome instalado) e `TACTICAL_SCREENSHOT`. Usa um contexto isolado e não altera o save do jogador. O Three.js vem de `vendor/three` (sem CDN).

Detalhes, critérios e ajustes de balanceamento: [IMPLEMENTACAO_REGRAS.md](IMPLEMENTACAO_REGRAS.md).

## O que tem

- Ilha de 240×240 com 6 regiões + Usina, rios, pontes, praias, vegetação instanciada e Névoa do Erro nos portões.
- 28 assentamentos (21 cidades/acampamentos, 5 arenas de chefão, Usina), cada um com marco animado, 3 prédios-fase, placa, fogueira, sino e moradores.
- Tela de criação: herói masculino ou feminino, nome digitado pelo jogador e pet (Raizinha ou as gatas Lina e Nina), com prévias 3D (`codigo/interface/criacao-de-personagem.js`). As falas trocam `{nome}`, `{o}`, `{patrão}` e `{pet}` conforme a escolha (`codigo/dados/falas.js`).
- Mestres históricos (`codigo/dados/mestres-historicos.js`, `codigo/sistemas/dicas-dos-mestres.js`): recepção na Base e um mestre por região, com missão, etiqueta de nome e Menu → Mestres.
- Cores e símbolos de dificuldade em `NIVEIS` (`codigo/dados/regioes-e-cidades.js`); Casas de Dúvidas em cinco cidades (`duvidas: true`), com conteúdo em `codigo/dados/conhecimento.js`.
- Inventário (`codigo/interface/inventario.js`, tecla I) com ferramentas, cartas e relíquias; ícones em `codigo/interface/icones.js`. Contextos práticos das missões em `codigo/dados/contextos.js`.
- Herói com todas as animações da seção 6.3, pet que segue o herói (`codigo/personagens/companheiro.js` e `codigo/personagens/gatas-lina-e-nina.js`), 22 bichos guias com 3 níveis de dica.
- 21 métodos numéricos jogáveis em 3 dificuldades + 5 chefões + final (`codigo/fases/`).
- 40 Raízes Fugitivas (6 tipos), Raizdex com cosméticos, baús, árvores, flores, pássaros, borboletas, peixes, nuvens, lama e interações por região.
- Cinemática de abertura (pule segurando Espaço), tutorial guiado, tutorial de comandos passo a passo na primeira vez no mundo (um comando por vez, só avança quando o jogador faz; dá para pular; Menu → Controles mostra tudo e refaz o tutorial), mapa com viagem rápida, minimapa, salvamento em `localStorage`.

Decisões e pendências: veja [DECISOES.md](DECISOES.md).
