// Situações práticas de cada missão: contexto, objetivo, dados com unidades e o que o resultado significa.
// Os números das missões (levels.js) não mudam: cada história foi escrita em cima deles.
// Chave: id da missão (método-dificuldade); as etapas especiais dos chefões usam o nome.
const C = (ctx, obj, dados, un, sig, modelo) => ({ ctx, obj, dados, un, sig, modelo });

const LEITURAS = C('O medidor de vazão da Padaria registra 100 leituras, em litros por minuto, mas o painel só guarda 4 algarismos significativos.',
  'Somar as 100 leituras guardadas com erro acumulado de no máximo 0,01 L/min (em 0,05 L/min o reservatório transborda).',
  ['100 leituras entre 3,000 e 3,100 L/min', 'Memória: 4 algarismos significativos', 'Custo: 0,05 ⚡ por leitura'], 'L/min', 'é a soma guardada; o erro mostra quanto o painel se afastou da soma real', 'S = Σ fl(vᵢ); erro = |S − Σ vᵢ|');
const BHASKARA = C('O filtro do rádio do acampamento tem dois tempos de resposta, em milissegundos, que são as raízes de x² − 1000x + 1 = 0. O pequeno controla o chiado.',
  'Calcular a raiz pequena com erro relativo menor que 10⁻⁴ numa máquina de 5 algarismos.',
  ['a = 1, b = −1000, c = 1', 'Máquina: 5 algarismos significativos em cada operação', 'Raiz pequena ≈ 0,001 ms'], 'ms', 'é o tempo de resposta rápido do filtro', 'x = (1000 ± √(1000² − 4))/2; como x₁·x₂ = c/a, também x₂ = c/(a·x₁)');
const SATELITE = C('O satélite mede deslocamentos de 300 km e 400 km em direções perpendiculares. O computador de bordo é de meia precisão (16 bits): o maior número é 65 504.',
  'Calcular a distância √(300² + 400²) sem Infinity, com erro relativo ≤ 10⁻⁶.',
  ['x = 300 km, y = 400 km', 'Máquina: 16 bits, máximo 65 504', 'Resposta esperada: 500 km'], 'km', 'é a distância percorrida pelo satélite', 'd = √(x² + y²) = m·√((x/m)² + (y/m)²)');

export const CONTEXTOS = {
  'truncamento-F': LEITURAS, 'truncamento-M': LEITURAS, 'truncamento-D': LEITURAS,
  'cancelamento-F': BHASKARA, 'cancelamento-M': BHASKARA, 'cancelamento-D': BHASKARA,
  'overflow-F': SATELITE, 'overflow-M': SATELITE, 'overflow-D': SATELITE,
  'kahan-D': C('O cofre do silo recebe 10 000 depósitos de 10⁻⁷ moedas numa conta que já tem 1 moeda, somados em float32.', 'Obter o saldo 1,001 com erro ≤ 10⁻⁶.', ['1 + 10 000 × 10⁻⁷', 'float32: cerca de 7 algarismos'], 'moedas', 'é o saldo final da conta', 'S = 1 + Σ 10⁻⁷ (10 000 parcelas)'),

  'bissecao-F': C('A Ponte Vibrante de Bi-Polis só fica parada quando a força do vento equilibra a rigidez dos cabos: x³ − x − 2 = 0, com x em metros de afastamento do pilar.', 'Achar o ponto de equilíbrio com o intervalo reduzido até largura/2 ≤ 0,01 m.', ['f(x) = x³ − x − 2', 'f(1) = −2 < 0 e f(2) = 4 > 0', 'Tolerância: 0,01 m'], 'm', 'é onde a ponte fica em equilíbrio'),
  'bissecao-M': C('No viveiro, o crescimento das mudas (eˣ) iguala a perda de calor (3x²) em três temperaturas, com x em dezenas de °C. O aquecedor precisa da menor positiva.', 'Localizar a menor raiz positiva com largura/2 ≤ 10⁻⁴; a névoa só mostra pontos sondados.', ['f(x) = eˣ − 3x²', 'Três raízes; a pedida está em [0, 1]', 'Até 4 sondas de 1 ⚡'], 'dezenas de °C', 'é a menor temperatura de equilíbrio do viveiro'),
  'bissecao-D': C('O controlador da comporta usa a razão (x − 2)/(x − 1), com x = abertura em metros. Em x = 1 o denominador zera e o sinal salta sem passar por zero.', 'Achar a abertura neutra com largura/2 e |f| abaixo de 10⁻⁶.', ['f(x) = (x − 2)/(x − 1)', 'Polo em x = 1', 'Intervalo inicial [0,5; 1,5]'], 'm', 'é a abertura em que o controlador fica neutro'),
  'falsaPosicao-F': C('O cabo diagonal de um painel quadrado de 1 m de lado mede x, com x² = 2 (Pitágoras).', 'Medir o cabo com erro ≤ 0,01 m.', ['f(x) = x² − 2', 'Intervalo [1, 2] m'], 'm', 'é o comprimento do cabo diagonal'),
  'falsaPosicao-M': C('Na neblina, o feixe do farol (cos x) cruza a curva de atenuação (x·eˣ) no ângulo de alcance máximo, em radianos.', 'Achar o ângulo com |xₖ − xₖ₋₁| ≤ 10⁻⁴.', ['f(x) = cos x − x·eˣ', 'Intervalo [0, 1] rad'], 'rad', 'é o ângulo de alcance máximo do farol'),
  'falsaPosicao-D': C('A mola do extremo preso responde como x¹⁰: quase nada até x ≈ 1 cm e depois dispara.', 'Achar a deformação com força 1 (resíduo ≤ 10⁻⁶).', ['f(x) = x¹⁰ − 1', 'Intervalo [0; 1,3] cm'], 'cm', 'é a deformação em que a mola faz força 1'),
  'pontoFixo-F': C('O sonar ecoa: cada estimativa de distância, em km, é o cosseno da anterior. A distância estável satisfaz x = cos x.', 'Achar a distância estável com erro ≤ 0,01 km.', ['g(x) = cos x', 'Chute inicial x₀ = 1 km'], 'km', 'é a distância estável do eco'),
  'pontoFixo-M': C('A fiação da vila divide um cabo em duas partes na razão áurea: x² = x + 1.', 'Achar φ com erro ≤ 10⁻⁴ escolhendo a fiação g certa.', ['Três fiações: x²−1, 1+1/x, √(1+x)', 'Chute x₀ = 1'], '(razão)', 'é a razão áurea usada no corte do cabo'),
  'pontoFixo-D': C('População de vagalumes: a fração da capacidade no ano seguinte é 3,3·x·(1 − x). O equilíbrio existe, mas a iteração pura oscila.', 'Achar o equilíbrio com erro ≤ 10⁻⁶ (amortecendo se precisar).', ['g(x) = 3,3x(1 − x)', 'Chute x₀ = 0,6'], 'da capacidade', 'é a fração estável da população'),
  'newton-F': C('O Canhão de Tangente precisa da diagonal de uma placa quadrada de 1 m: x² = 2.', 'Diagonal com erro ≤ 0,01 m.', ['f(x) = x² − 2, f′(x) = 2x', 'Mira inicial 1,5 m'], 'm', 'é a diagonal da placa'),
  'newton-M': C('O perfil do vale segue y = x³ − 2x + 2 (km). A trilha cruza o nível do rio (y = 0) num único ponto, à esquerda da vila.', 'Achar o cruzamento com erro ≤ 10⁻⁴ km; a mira em 0 entra em ciclo.', ['f(x) = x³ − 2x + 2', 'f′(x) = 3x² − 2', 'Mira inicial 0'], 'km', 'é onde a trilha encontra o rio'),
  'newton-D': C('A viga encosta no apoio de forma tangente: f(x) = (x − 1)²(x + 2) toca zero em x = 1 m sem trocar de sinal.', 'Achar o ponto de contato com erro ≤ 10⁻⁶ m.', ['f(x) = x³ − 3x + 2', 'Raiz dupla em x = 1'], 'm', 'é o ponto de contato da viga'),
  'secante-F': C('Duas sondas medem o cabo diagonal de uma placa de 1 m × 1 m: x² = 2, sem a derivada à mão.', 'Erro ≤ 0,01 m.', ['f(x) = x² − 2', 'Sondas em 1 e 2'], 'm', 'é a diagonal medida pelas sondas'),
  'secante-M': C('O tempo de carga de um capacitor, em segundos, satisfaz x·eˣ = 1. O sensor de derivada está quebrado.', 'Erro ≤ 10⁻⁴ s.', ['f(x) = x·eˣ − 1', 'Sem f′'], 's', 'é o tempo de carga do capacitor'),
  'secante-D': C('O cabo de uma torre com base 1 m e altura 2 m mede x, com x² = 5. As sondas começam em pontos simétricos.', 'Erro ≤ 10⁻⁶ m.', ['f(x) = x² − 5', 'Sondas em −1 e 1 (mesmo f!)'], 'm', 'é o comprimento do cabo'),
  'gauss-F': C('Três reservatórios trocam água por três canos. O balanço de cada reservatório dá uma equação; a solução são as vazões dos canos (negativo = sentido contrário).', 'Vazões com erro ≤ 0,01 m³/h.', ['2x + y − z = 8', '−3x − y + 2z = −11', '−2x + y + 2z = −3'], 'm³/h', 'são as vazões dos três canos'),
  'gauss-M': C('Três tipos de ração (kg) alimentam baias com nutrientes conhecidos; a primeira baia não usa o primeiro tipo.', 'Quantidades com resíduo ≤ 10⁻⁴.', ['A = [0 2 1; 1 1 1; 2 1 3]', 'Pivô a₁₁ = 0'], 'kg', 'são as quantidades de cada ração'),
  'gauss-D': C('Quatro sensores sobrepostos: a resposta combinada forma a matriz de Hilbert, famosa por ser mal condicionada.', 'Ganhos com erro ≤ 10⁻⁶ numa máquina de 4 casas decimais.', ['A = H₄ (aᵢⱼ = 1/(i+j−1))', 'Até 2 refinamentos'], '(ganho)', 'são os ganhos de calibração dos sensores'),
  'pivoteamento-F': C('Uma balança muito sensível (coeficiente 0,0001) e uma comum determinam duas massas.', 'Massas com erro ≤ 0,01 kg numa máquina de 3 algarismos.', ['0,0001x + y = 1', 'x + y = 2'], 'kg', 'são as duas massas'),
  'pivoteamento-M': C('Uma rede tem um resistor de 100 kΩ e outros de poucos ohms; as equações têm escalas muito diferentes.', 'Correntes com erro ≤ 10⁻⁴ mA (4 algarismos).', ['2x + 100 000y = …', 'x + y = …'], 'mA', 'são as correntes da rede'),
  'pivoteamento-D': C('No reator Wilkinson, cinco válvulas acopladas: sem cuidado, os números crescem a cada eliminação.', 'Aberturas com resíduo ≤ 10⁻⁶ (6 algarismos).', ['Matriz de Wilkinson 5×5', '1 refinamento'], '(abertura)', 'são as aberturas das válvulas'),
  'lu-F': C('O mesmo cofre recebe três senhas diferentes (três vetores b). Fatorar uma vez e resolver três vezes economiza energia.', 'Resolver os três sistemas com erro ≤ 0,01.', ['A = [2 1 1; 4 3 3; 8 7 9]', '3 vetores b'], '(dígitos)', 'são as senhas do cofre'),
  'lu-M': C('Cabos cruzados: a rede de cabos tem pivô zero; a fatoração precisa da permutação P.', 'Forças com erro ≤ 10⁻⁴ kN.', ['A = [0 2 1; 1 1 1; 2 1 3]'], 'kN', 'são as forças nos cabos'),
  'lu-D': C('Refinar a calibração dos sensores sobrepostos: resolva e use o resíduo para corrigir.', 'Erro ≤ 10⁻⁶ (5 algarismos).', ['A = H₄', 'Até 3 refinamentos'], '(ganho)', 'são os ganhos refinados'),
  'jacobi-F': C('Três salas vizinhas trocam calor; cada uma tem forte ligação com o próprio aquecedor (diagonal dominante).', 'Desvios de temperatura com erro ≤ 0,01 °C.', ['A = [10 2 1; 1 5 1; 2 3 10]', 'Chute: 0 °C'], '°C', 'são os desvios de temperatura das salas'),
  'jacobi-M': C('As mesmas salas, com as equações embaralhadas: a diagonal dominante sumiu da ordem atual.', 'Erro ≤ 10⁻⁴ °C.', ['Linhas trocadas', 'Reordene ou troque colunas'], '°C', 'são os desvios de temperatura'),
  'jacobi-D': C('Uma rede especial sem diagonal dominante em que Jacobi termina em 3 varreduras.', 'Erro ≤ 10⁻⁶.', ['A = [1 2 −2; 1 1 1; 2 2 1]'], '', 'é a solução da rede'),
  'seidel-F': C('Cascata de três tanques: cada nível depende dos vizinhos; Seidel usa o nível novo assim que ele sai.', 'Erro ≤ 0,01 m.', ['A = [10 2 1; 1 5 1; 2 3 10]'], 'm', 'são os níveis dos tanques'),
  'seidel-M': C('Os tanques com as equações embaralhadas: confira o critério de Sassenfeld antes de iterar.', 'Erro ≤ 10⁻⁴ m.', ['Linhas trocadas'], 'm', 'são os níveis dos tanques'),
  'seidel-D': C('Um sistema em que Jacobi diverge, mas Seidel converge devagar.', 'Erro ≤ 10⁻⁶.', ['A = [2 −1 1; 2 2 2; −1 −1 2]', 'Até 3 alertas vermelhos'], '', 'é a solução do sistema'),
  'lagrange-F': C('O forno da padaria foi medido às 0, 1 e 2 h: 100 °C, 300 °C e 200 °C (em centenas de °C: 1, 3, 2).', 'Estimar a temperatura às 0,5 h com erro ≤ 0,01.', ['(0; 1), (1; 3), (2; 2)', 'Consulta: t = 0,5 h'], '×100 °C', 'é a temperatura estimada do forno às 0,5 h'),
  'lagrange-M': C('A altura de uma cadeira da roda-gigante segue sen θ (em raios); só há leituras em 0°, 30° e 60°.', 'Estimar a altura em 45° com erro ≤ 0,002.', ['Nós: 0, π/6, π/3', 'Até 4 nós'], 'raios', 'é a altura relativa da cadeira em 45°'),
  'lagrange-D': C('Um sinal de rádio 1/(1 + 25x²) foi amostrado em 11 pontos igualmente espaçados: o polinômio oscila nas bordas.', 'Erro máximo da curva ≤ 0,15.', ['f(x) = 1/(1 + 25x²), −1 ≤ x ≤ 1', '11 nós'], '', 'é o erro máximo da curva reconstruída'),
  'spline-F': C('A régua flexível do desenhista passa por três pinos (m).', 'Curvaturas com erro ≤ 0,01.', ['(0; 0), (1; 1), (2; 0)', 'Borda natural'], '1/m', 'são as curvaturas da régua'),
  'spline-M': C('O trilho da montanha-russa passa por cinco pontos (m); curvatura contínua evita trancos nos passageiros.', 'Erro ≤ 10⁻⁴.', ['(0;0), (1;2), (2;1), (3;3), (4;2)'], '1/m', 'são as curvaturas do trilho'),
  'spline-D': C('A curva de aquecimento eˣ foi medida em 5 pontos e as inclinações das pontas são conhecidas.', 'Erro máximo da curva ≤ 0,005.', ['Nós em 0; 0,5; 1; 1,5; 2', 'S′(0) = 1, S′(2) = e²'], '', 'é o erro máximo da curva'),
  'minimosQuadrados-F': C('Calibração de um sensor de pressão: tensão (V) × pressão (kPa) em 4 medições com ruído.', 'Coeficientes da reta y = a + bx com erro ≤ 0,01.', ['(1; 2,1), (2; 3,9), (3; 6,2), (4; 7,8)'], 'a em kPa; b em kPa/V', 'dá a pressão a partir da tensão do sensor'),
  'minimosQuadrados-M': C('Uma colônia de bactérias foi medida por 4 horas (milhares de células).', 'Ajustar y = a·e^{bx} com erro ≤ 0,01 nos coeficientes.', ['(0; 2), (1; 3,3), (2; 5,4), (3; 9)'], 'a em mil células; b por hora', 'descreve o crescimento da colônia'),
  'minimosQuadrados-D': C('Leituras de um termômetro entre os instantes 1000 e 1010 s: o ajuste quadrático direto sofre com números grandes.', 'Coeficientes com erro ≤ 10⁻⁶.', ['6 pontos em x = 1000…1010', 'Modelo y = a + bt + ct², t = x − 1005'], '', 'descreve a temperatura ao longo do tempo'),
  'trapezio-F': C('A vazão de entrada do reservatório é q(t) = t² m³/min durante 2 minutos. O volume acumulado é a área sob a vazão.', 'Volume com erro ≤ 0,01 m³.', ['q(t) = t² m³/min', '0 ≤ t ≤ 2 min'], 'm³', 'é o volume que entrou no reservatório'),
  'trapezio-M': C('O arco da ponte segue y = sen x (m) entre os pilares; a área define a tinta da pintura.', 'Área com erro ≤ 10⁻³ m².', ['y = sen x', '0 ≤ x ≤ π m'], 'm²', 'é a área a pintar'),
  'trapezio-D': C('O U do erro: em float32, h pequeno demais traz de volta o erro de arredondamento.', 'Ficar a no máximo 20% acima do mínimo do modelo E(h) = h²/3 + ε/h.', ['∫₀² x² dx em float32', 'ε = 2⁻²³'], '', 'mostra o h que equilibra truncamento e arredondamento'),
  'simpson13-F': C('A mesma vazão q(t) = t² m³/min por 2 minutos: Simpson integra parábolas exatamente.', 'Volume com erro ≤ 0,01 m³.', ['q(t) = t²', '0 ≤ t ≤ 2 min'], 'm³', 'é o volume que entrou'),
  'simpson13-M': C('O arco da ponte de novo (y = sen x, m), agora com menos avaliações.', 'Área com erro ≤ 10⁻⁴ m².', ['y = sen x', '0 ≤ x ≤ π'], 'm²', 'é a área a pintar'),
  'simpson13-D': C('Uma comporta abre de repente: a vazão é q(t) = √t m³/s no primeiro segundo; a derivada é infinita em t = 0.', 'Volume com erro ≤ 10⁻⁶ m³ e no máximo 5 avaliações.', ['q(t) = √t', '0 ≤ t ≤ 1 s'], 'm³', 'é o volume do primeiro segundo'),
  'simpson38-F': C('O arco da ponte (y = sen x) dividido em três fatias.', 'Área com erro ≤ 0,01 m².', ['y = sen x', 'n = 3'], 'm²', 'é a área do arco'),
  'simpson38-M': C('Um painel solar gera P(t) = sen t kW por 1,4 h; com 7 intervalos, a energia é a integral.', 'Energia com erro ≤ 10⁻⁴ kWh.', ['P(t) = sen t kW', '0 ≤ t ≤ 1,4 h', 'n = 7 (ímpar)'], 'kWh', 'é a energia gerada pelo painel'),
  'simpson38-D': C('Um pulso de chuva estreito, 1/(1 + 400(t − 0,5)²) mm/h, cai durante 1 h.', 'Volume com erro ≤ 10⁻⁴ mm.', ['Pico em t = 0,5 h'], 'mm', 'é a chuva acumulada'),
  'euler-F': C('O fermento cresce na taxa y′ = y (kg/h); a massa inicial é 1 kg.', 'Massa em t = 0,5 h com erro ≤ 0,01 kg.', ['y′ = y, y(0) = 1 kg', 'h = 0,1 h'], 'kg', 'é a massa de fermento em 0,5 h'),
  'euler-M': C('Resfriamento de um equipamento: o excesso de temperatura sobre o ambiente cai com y′ = −2y (y em dezenas de °C, t em h).', 'Excesso em t = 1 h com erro ≤ 0,01.', ['y′ = −2y, y(0) = 1 (10 °C acima)', 'h inicial 0,1 h'], '×10 °C', 'é o excesso de temperatura após 1 h'),
  'euler-D': C('Um chip com dissipador forte esfria com y′ = −50y: o problema é rígido e passos grandes explodem.', 'Excesso em t = 0,5 com erro ≤ 10⁻³.', ['y′ = −50y, y(0) = 1', 'h = 0,05'], '×10 °C', 'é o excesso de temperatura do chip'),
  'rk4-F': C('O fermento (y′ = y) acompanhado num único passo de 0,5 h com quatro sondas.', 'Massa em 0,5 h com erro ≤ 0,01 kg.', ['y′ = y, y(0) = 1 kg', 'h = 0,5 h'], 'kg', 'é a massa de fermento'),
  'rk4-M': C('Duelo Euler × RK4: o fermento até 1 h.', 'Massa com erro ≤ 10⁻³ kg.', ['y′ = y', 'até t = 1 h'], 'kg', 'é a massa de fermento em 1 h'),
  'rk4-D': C('Resfriamento rígido do reator: y′ = −100y.', 'Erro ≤ 10⁻³ em t = 0,5.', ['y′ = −100y, y(0) = 1', 'h = 0,05'], '×10 °C', 'é o excesso de temperatura do reator'),
  'Temperatura Crítica': C('A solução da etapa anterior define a temperatura crítica T* da Usina; a função T² − T*² zera nela.', 'Encontrar T* com erro ≤ 10⁻⁶.', ['T* = 1 + média da solução anterior'], '(×100 °C)', 'é a temperatura crítica da Usina'),
  'Resfriamento da Usina': C('Com a temperatura crítica encontrada, a Usina precisa esfriar: y′ = −λy, com λ = 20 + 10T.', 'Acompanhar até t = 0,5 com erro ≤ 10⁻³.', ['y(0) = T', 'λ = 20 + 10T'], '(×100 °C)', 'é a temperatura da Usina após o resfriamento'),
};

export function contextoDe(level) {
  return (['Temperatura Crítica', 'Resfriamento da Usina'].includes(level.name) && CONTEXTOS[level.name]) || CONTEXTOS[level.id] || null;
}

// Apoio conforme a dificuldade: passo a passo no fácil, decisões no médio, análise de condições no difícil
export const APOIO = {
  F: { titulo: 'Passo a passo', texto: 'O guia mostra o próximo passo sugerido e por quê. Siga, observe o erro cair e conclua quando ele ficar abaixo da tolerância.' },
  M: { titulo: 'Decisões', texto: 'Você escolhe o método e os parâmetros. Antes de agir, pergunte: o método se aplica? O erro está caindo a cada passo?' },
  D: { titulo: 'Análise de condições', texto: 'Algo nesta missão quebra o caminho óbvio. Confira as condições do método (requisitos na carta) e as limitações da máquina antes de gastar energia.' },
};
