// Tabela mestre do mundo (seções 4 e 5.1). Adicionar uma cidade = adicionar uma linha aqui.
import { PALETTE } from '../configuracao.js';

// índice de região: 0 Base, 1 R0, 2 R1, 3 R2, 4 R3, 5 R4, 6 Usina
export const REGIONS = [
  { id: 'base', nome: 'Acampamento Base', modulo: null, pal: PALETTE.base, musica: 'base', areia: '#f0dca0' },
  { id: 'r0', nome: 'Campos do Arredondamento', modulo: 0, pal: PALETTE.r0, musica: 'r0', areia: '#efd9a0' },
  { id: 'r1', nome: 'Selva das Raízes', modulo: 1, pal: PALETTE.r1, musica: 'r1', areia: '#b8a46a' },
  { id: 'r2', nome: 'Planalto dos Cofres', modulo: 2, pal: PALETTE.r2, musica: 'r2', areia: '#e8cfa6' },
  { id: 'r3', nome: 'Parque das Curvas', modulo: 3, pal: PALETTE.r3, musica: 'r3', areia: '#efe1b0' },
  { id: 'r4', nome: 'Costa das Integrais', modulo: 4, pal: PALETTE.r4, musica: 'r4', areia: '#f3e0a8' },
  { id: 'usina', nome: 'Usina Central', modulo: 'final', pal: PALETTE.usina, musica: 'usina', areia: '#9a9a96' },
];

// chefão que precisa cair para liberar cada região (índice da região -> id do chefão)
export const UNLOCK_BY = { 2: 'B0', 3: 'B1', 4: 'B2', 5: 'B3' };
export const BOSS_OF_REGION = { 1: 'B0', 2: 'B1', 3: 'B2', 4: 'B3', 5: 'B4' };
// mínimo de estrelas na região para enfrentar o chefão (seção 10.4)
export const STAR_REQ = { 1: 12, 2: 20, 3: 20, 4: 12, 5: 20 };

// Cor e símbolo de cada dificuldade: iguais em prédios, placas, mapa, minimapa e na tela da missão.
// Verde ● fácil · azul ■ médio · vermelho ▲ difícil · amarelo ? Casa de Dúvidas (apoio, sem fase).
export const NIVEIS = {
  F: { nome: 'Calibração', predio: 'Casa de Calibração', dificuldade: 'Fácil', cor: '#2e8b3a', parede: '#79c267', telhado: '#3d7a33', simbolo: '●' },
  M: { nome: 'Operação', predio: 'Oficina de Operação', dificuldade: 'Médio', cor: '#1f5fbf', parede: '#5d9be0', telhado: '#2c5c9a', simbolo: '■' },
  D: { nome: 'Crise', predio: 'Torre de Crise', dificuldade: 'Difícil', cor: '#c0352b', parede: '#e2675e', telhado: '#962b25', simbolo: '▲' },
};
export const DUVIDAS = { predio: 'Casa de Dúvidas', cor: '#a87200', parede: '#f2c94c', telhado: '#c2891a', simbolo: '?' };

export const SETTLEMENTS = [
  { id: 'A0', nome: 'Acampamento Base', x: 0, z: 90, tipo: 'acampamento', regiao: 0, marco: 'barco', bicho: null, metodo: null },

  { id: 'C0.1', nome: 'Padaria do Truncamento', x: -80, z: 55, tipo: 'acampamento', regiao: 1, marco: 'padaria', bicho: 'urso', metodo: 'truncamento', metodoNome: 'Truncamento × Arredondamento' , duvidas: true },
  { id: 'C0.2', nome: 'Acampamento Cancelamento', x: -55, z: 62, tipo: 'acampamento', regiao: 1, marco: 'turbina', bicho: 'axolote', metodo: 'cancelamento', metodoNome: 'Cancelamento catastrófico' },
  { id: 'C0.3', nome: 'Galinheiro do Overflow', x: -50, z: 35, tipo: 'acampamento', regiao: 1, marco: 'galinheiro', bicho: 'galinha', metodo: 'overflow', metodoNome: 'Overflow e escala' },
  { id: 'B0', nome: 'Silo do Estouro', x: -85, z: 28, tipo: 'arena', regiao: 1, marco: 'silo', bicho: null, metodo: 'chefe0', metodoNome: 'Chefão: Erros de máquina' },

  { id: 'C1.1', nome: 'Bi-Polis', x: -90, z: -15, tipo: 'cidade', regiao: 2, marco: 'balanca', bicho: 'tatu', metodo: 'bissecao', metodoNome: 'Bisseção' , duvidas: true },
  { id: 'C1.2', nome: 'Falsópolis', x: -65, z: -10, tipo: 'cidade', regiao: 2, marco: 'pontesCorda', bicho: 'camaleao', metodo: 'falsaPosicao', metodoNome: 'Falsa Posição' },
  { id: 'C1.3', nome: 'Vila Fixa', x: -95, z: -45, tipo: 'acampamento', regiao: 2, marco: 'carrossel', bicho: 'hamster', metodo: 'pontoFixo', metodoNome: 'Ponto Fixo' },
  { id: 'C1.4', nome: 'Newtonópolis', x: -70, z: -40, tipo: 'cidade', regiao: 2, marco: 'macieira', bicho: 'gaviao', metodo: 'newton', metodoNome: 'Newton-Raphson' },
  { id: 'C1.5', nome: 'Secantelândia', x: -45, z: -30, tipo: 'cidade', regiao: 2, marco: 'tirolesa', bicho: 'cobra', metodo: 'secante', metodoNome: 'Secante' },
  { id: 'B1', nome: 'Pântano da Hidra', x: -50, z: -60, tipo: 'arena', regiao: 2, marco: 'hidra', bicho: null, metodo: 'chefe1', metodoNome: 'Chefão: Raízes de equações' },

  { id: 'C2.1', nome: 'Gaussburgo', x: -25, z: -77, tipo: 'cidade', regiao: 3, marco: 'polvo', bicho: 'polvo', metodo: 'gauss', metodoNome: 'Eliminação de Gauss' , duvidas: true },
  { id: 'C2.2', nome: 'Pivô-Ville', x: -15, z: -100, tipo: 'acampamento', regiao: 3, marco: 'plataforma', bicho: 'caranguejo', metodo: 'pivoteamento', metodoNome: 'Pivoteamento' },
  { id: 'C2.3', nome: 'Vila LU', x: 10, z: -100, tipo: 'acampamento', regiao: 3, marco: 'torresLU', bicho: 'pinguins', metodo: 'lu', metodoNome: 'Fatoração LU' },
  { id: 'C2.4', nome: 'Jacobópolis', x: 35, z: -80, tipo: 'cidade', regiao: 3, marco: 'relogio', bicho: 'esquiloJ', metodo: 'jacobi', metodoNome: 'Jacobi' },
  { id: 'C2.5', nome: 'Seidelstadt', x: 35, z: -102, tipo: 'cidade', regiao: 3, marco: 'telefone', bicho: 'esquiloS', metodo: 'seidel', metodoNome: 'Gauss-Seidel' },
  { id: 'B2', nome: 'Cofre-Forte Hilbert', x: 60, z: -85, tipo: 'arena', regiao: 3, marco: 'cofre', bicho: null, metodo: 'chefe2', metodoNome: 'Chefão: Sistemas lineares' },

  { id: 'C3.1', nome: 'Teia de Lagrange', x: 68, z: -52, tipo: 'cidade', regiao: 4, marco: 'teia', bicho: 'aranha', metodo: 'lagrange', metodoNome: 'Interpolação de Lagrange' , duvidas: true },
  { id: 'C3.2', nome: 'Vale do Spline', x: 90, z: -40, tipo: 'cidade', regiao: 4, marco: 'montanhaRussa', bicho: 'minhoca', metodo: 'spline', metodoNome: 'Spline cúbica' },
  { id: 'C3.3', nome: 'Preguiçópolis dos Mínimos Quadrados', x: 75, z: -15, tipo: 'cidade', regiao: 4, marco: 'rede', bicho: 'preguica', metodo: 'minimosQuadrados', metodoNome: 'Mínimos Quadrados' },
  { id: 'B3', nome: 'Colina do Colosso de Runge', x: 60, z: 0, tipo: 'arena', regiao: 4, marco: 'colosso', bicho: null, metodo: 'chefe3', metodoNome: 'Chefão: Interpolação e ajuste' },

  { id: 'C4.1', nome: 'Trapezópolis', x: 50, z: 30, tipo: 'cidade', regiao: 5, marco: 'barragem', bicho: 'castor', metodo: 'trapezio', metodoNome: 'Regra do Trapézio' , duvidas: true },
  { id: 'C4.2', nome: 'Lagoa do Simpson 1/3', x: 80, z: 28, tipo: 'cidade', regiao: 5, marco: 'arcos', bicho: 'sapo', metodo: 'simpson13', metodoNome: 'Simpson 1/3' },
  { id: 'C4.3', nome: 'Lagoa do Simpson 3/8', x: 100, z: 50, tipo: 'acampamento', regiao: 5, marco: 'cascatas', bicho: 'sapinho', metodo: 'simpson38', metodoNome: 'Simpson 3/8' },
  { id: 'C4.4', nome: 'Porto Euler', x: 75, z: 65, tipo: 'cidade', regiao: 5, marco: 'porto', bicho: 'tartaruga', metodo: 'euler', metodoNome: 'Método de Euler' },
  { id: 'C4.5', nome: 'Península RK4', x: 45, z: 75, tipo: 'acampamento', regiao: 5, marco: 'lancha', bicho: 'lebre', metodo: 'rk4', metodoNome: 'Runge-Kutta 4' },
  { id: 'B4', nome: 'Farol do Tsunami', x: 20, z: 55, tipo: 'arena', regiao: 5, marco: 'farol', bicho: null, metodo: 'chefe4', metodoNome: 'Chefão: Integrais e EDOs' },

  { id: 'F', nome: 'Usina Central', x: 0, z: 0, tipo: 'final', regiao: 6, marco: 'reator', bicho: null, metodo: 'final', metodoNome: 'Final: o Grande Erro' },
];

export const SETTLEMENT_BY_ID = Object.fromEntries(SETTLEMENTS.map((s) => [s.id, s]));
export const CITIES = SETTLEMENTS.filter((s) => s.id.startsWith('C'));
export const BOSSES = SETTLEMENTS.filter((s) => s.id.startsWith('B'));

// Caminhos (seção 4). Pontes estão nos pontos de passagem.
export const PATHS = [
  [[0, 90], [-20, 86], [-40, 78], [-62, 72], [-80, 55]],
  [[-80, 55], [-55, 62], [-50, 35], [-85, 28]],
  [[-85, 28], [-90, 10], [-90, -15]],
  [[-90, -15], [-65, -10], [-95, -45], [-70, -40], [-45, -30], [-50, -60]],
  [[-50, -60], [-38, -72], [-25, -77]],
  [[-25, -77], [-15, -100], [10, -100], [35, -80], [35, -91], [35, -102], [60, -85]],
  [[60, -85], [66, -68], [68, -52]],
  [[68, -52], [90, -40], [75, -15], [60, 0]],
  [[60, 0], [55, 15], [50, 30]],
  [[50, 30], [80, 28], [100, 50], [75, 65], [45, 75], [20, 55]],
  [[20, 55], [10, 30], [0, 27]],
];

// Rios: separam as regiões (só se cruza pelas pontes). hw = meia-largura do leito.
export const RIVERS = [
  { id: 'r01', hw: 3.5, pts: [[-26, 6], [-50, 12], [-70, 8], [-90, 10], [-140, 16]] },
  { id: 'r12', hw: 4, canyon: true, pts: [[-15, -23], [-34, -48], [-38, -72], [-52, -92], [-72, -124]] },
  { id: 'r23', hw: 3.5, pts: [[17, -21], [38, -48], [55, -62], [66, -68], [90, -80], [115, -98]] },
  { id: 'r34', hw: 3.5, pts: [[26, 5], [40, 10], [55, 15], [80, 15], [140, 24]] },
  { id: 'r4A', hw: 3.5, pts: [[-10, 25], [-6, 45], [6, 68], [18, 90], [30, 138]] },
  { id: 'rj', hw: 2.4, pts: [[29, -90.5], [35, -91], [42, -91.5]] },
];

// Riacho do tutorial (1,2 de largura): pede o primeiro pulo
export const CREEK = { hw: 0.6, pts: [[-24, 122], [-13, 88], [-5, 62], [1, 52]] };

export const BRIDGES = [
  { id: 'b01', nome: 'Portão da Selva', x: -90, z: 10, river: 'r01', trava: 2 },
  { id: 'b12', nome: 'Ponte do Cânion', x: -38, z: -72, river: 'r12', trava: 3 },
  { id: 'b23', nome: 'Ponte do Trilho', x: 66, z: -68, river: 'r23', trava: 4 },
  { id: 'b34', nome: 'Ponte da Maré', x: 55, z: 15, river: 'r34', trava: 5 },
  { id: 'bj', nome: 'Ponte do Rio', x: 35, z: -91, river: 'rj', trava: null },
];

// Colinas do Parque das Curvas [x, z, raio, altura]
export const HILLS = [
  [82, -27, 9, 6], [100, -58, 10, 5], [52, -38, 7, 3.5], [96, -8, 8, 4.5], [84, -76, 8, 3], [108, -30, 7, 4],
];

// Raio de achatamento do terreno em torno de cada tipo de assentamento
export const FLAT_RADIUS = { cidade: 18, acampamento: 12.5, arena: 15, final: 0 };
export const CLEAR_RADIUS = { cidade: 19, acampamento: 13, arena: 15.5, final: 30 };
