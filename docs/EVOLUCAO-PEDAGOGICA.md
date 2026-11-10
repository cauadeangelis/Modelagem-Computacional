# Evolução pedagógica da v14

Implementação local do Plano de Evolução do Numera Academy, em 10/11/2026. A base já continha boa parte das fases 1 a 4; essas implementações foram preservadas. Não foram adicionadas dependências de execução ou serviços externos.

## Como experimentar

Execute `npm run servir` e abra `http://127.0.0.1:8000/#lab`.

- **Terminal → Experimentos:** manipule a equação digitada, prepare as linhas do sistema e teste a sensibilidade, explore fenômenos, insira pontos ou experimente a precisão da máquina.
- **Trilhas → Veja o método em ação:** o botão de manipulação leva os dados daquele exemplo ao laboratório. A precisão também pode ser explorada a partir da lição.
- **Missões → Explorar fenômeno relacionado:** abre um experimento complementar sem alterar a pergunta, a resposta ou o progresso da missão. O painel avisa que utiliza dados próprios.
- **Laboratório → Fenômenos:** comporta, treliça, malha térmica e drone. Cada avanço corresponde a uma operação numérica; os valores e resíduos aparecem em texto.
- **Calculândia:** na proximidade de uma porta, use H (ou o botão de dica no celular) e escolha a habilidade do companheiro. Raizinha analisa o modelo do simulador daquela cidade; Lina e Nina marcam visualmente as duas pontas por 12 segundos após a conversa. A análise não antecipa as respostas das questões sorteadas das listas.
- **Mestres:** vença a Casa de Calibração associada a Newton, Gauss, Lagrange ou Euler e converse novamente para abrir o desafio opcional. A conclusão é salva; refazer não concede recompensas repetidas.
- **Usina:** o painel “Fenômeno a cada passo” usa apenas aproximações já calculadas. Nos sistemas, os nós mudam durante a substituição regressiva. Não revela o próximo valor solicitado.

## Cobertura do plano

| Proposta | Situação e localização |
|---|---|
| Modo Lousa, pivô, mascotes e Caça ao Bug | Já existentes e preservados; as tabelas novas também usam o Modo Lousa |
| Gráfico tátil, bacias e corrida | Existentes no Laboratório; agora importam a equação e os parâmetros do Terminal ou da Trilha; arrastar sincroniza os campos do Terminal |
| Troca de linhas e sensibilidade | Existentes no Laboratório e no simulador da Calculândia; agora aceitam o sistema digitado no Terminal, com diagnóstico de singularidade |
| Comporta | Ampliada para Bisseção, Falsa Posição, Newton e Secante; chute inicial ajustável, alarme visual de domínio e transbordamento |
| Treliça | Mantida a relaxação por nós; acrescentada comparação de Gauss com/sem pivoteamento numa máquina de quatro algarismos |
| Malha térmica | Nova malha 3×3: Seidel e Jacobi célula por célula, resíduos, tolerância e Euler explícito para resfriamento |
| Drone | Nova cena SVG com argolas, rota, voo por passos, colisão por oscilação de Runge e consumo integrado; polinômio de grau 10 versus spline cúbica natural |
| Régua de mantissa | Nova comparação de cancelamento e racionalização, de 2 a 10 algarismos, com erro relativo contra referência |
| Pontos no Terminal | Newton, Lagrange, Mínimos Quadrados, Trapézios e Simpson 1/3; tabela de cálculo, gráfico e áreas por painel |
| Ponto Fixo opcional | Pesquisa avançada com chave desligada por padrão, g(x) editável e diagrama em teia; mantém `C.HIDDEN` e a grade principal intactos |
| Método Híbrido e eventos do Bobo da Corte | Já existentes: orçamento de avaliações, Bolão, Perturbação e Na Mosca |
| Mundo 3D reativo | Já existentes: balança de Bi-Polis, feixes de Gaussburgo e Usina com vapor/turbinas após a vitória |
| Pets, mestres e Usina | Novas habilidades contextualizadas, quatro desafios opcionais e cena ligada aos passos dos reatores |

Os fenômenos são modelos didáticos, não simuladores de engenharia validados. O exemplo de observações orbitais de Gauss é identificado como fictício. Na Usina, as equações originais dos reatores continuam sendo as avaliadas; a cena representa seu estado sem atribuir unidades físicas artificiais a elas.

## Modelos e limites

- Malha: Laplace discreto `4Ti − soma(vizinhos) = 0`, borda superior a 100 °C e demais bordas a 20 °C. Ambas as técnicas partem de 20 °C. O resíduo é calculado contra as equações originais, não apenas contra a diferença entre varreduras.
- Resfriamento: `T′ = −(T − 20)` e `T(0) = 100`; Euler é assintoticamente estável para `0 < Δt < 2`. A tabela mostra também a solução exata.
- Drone: 11 nós equidistantes em `[-1, 1]` com `y = 0,25 + 1/(1 + 25x²)`. Energia adimensional: integral de `1 + (dy/dx)²`, por trapézios em 200 subintervalos. Colisões e consumo usam a mesma rota amostrada exibida na cena.
- Pontos: entre 2 e 12 pares finitos com abscissas distintas; ordenação por x. Trapézios admite espaçamento irregular; Simpson exige número par de subintervalos de mesmo tamanho. Spline natural fixa as segundas derivadas das extremidades em zero.
- Mantissa: cada operação é arredondada ao número de algarismos selecionado, não somente o resultado final.
- As interações novas têm avanço manual. As animações existentes de água, treliça e corrida respeitam movimento reduzido. Tabelas com rolagem podem receber foco por teclado.

## Arquivos e validação

O motor puro está em `dist/js/motor/experimentos.js`; a interface complementar, em `dist/js/paginas/simulador-fenomenos.js`; os estilos, em `dist/css/experimentos.css`. Os recursos são incluídos no cache pelo gerador de `dist/sw.js`.

Comandos de conferência:

```text
npm run atualizar
npm run testar
npm run testar-navegador
npm run testar-calculandia
```

`testar` inclui `tests/experimentos.test.cjs`: referências analíticas, spline, Laplace, estabilidade, Runge, arredondamento e desafios. `testar-navegador` inclui `tests/e2e/testar-experimentos.mjs`: arraste, teclado, dados importados, Missões, Trilhas, sistema singular, colisão, limites físicos, axe nos novos painéis em claro/escuro, celular e offline.

Validação executada nesta implementação: 3.217 verificações da suíte principal, 468 questões, 140 gabaritos de treino, 85 testes de regras/experimentos, 846 verificações de compatibilidade, 130 fluxos existentes, 98 auditorias de acessibilidade existentes, 14 verificações offline e a suíte nova de experimentos. A suíte de navegador da Calculândia montou 69 fases, conferiu as casas, o chefão e os três reatores, sem erros de JavaScript.

No Windows, os testes agora normalizam CRLF na comparação textual das resoluções SQL e usam `fileURLToPath` para localizar a pasta na verificação de compatibilidade. O servidor de desenvolvimento aceita conexões apenas em `127.0.0.1`.
