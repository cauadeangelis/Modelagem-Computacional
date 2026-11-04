// Ponte entre o overworld e as fases (seção 10.1). A única ligação entre os dois mundos.
// v13: a casa verde (nível F) abre uma pergunta de múltipla escolha do banco de questões
// (pergunta-rapida.js); as casas azul e vermelha e os chefões abrem o simulador (tela-da-questao.js).
import { runFase, batteryFor } from './tela-da-questao.js';
import { runPergunta, temPerguntaRapida } from './pergunta-rapida.js';
import { SETTLEMENT_BY_ID } from '../dados/regioes-e-cidades.js';

// launchLevel({ id, metodo, nivel }) → Promise<{ vitoria, estrelas, erroFinal, iteracoes, bateriaRestante, dicasUsadas, xp }>
export function launchLevel({ id, metodo, nivel, freeHint = false }) {
  const s = SETTLEMENT_BY_ID[id], cidade = { ...s, metodo: metodo || s.metodo };
  if (nivel === 'F' && temPerguntaRapida(cidade.metodo)) return runPergunta({ s: cidade, freeHint });
  return runFase({ s: cidade, nivel, animalId: s.bicho, freeHint });
}

export { batteryFor };
