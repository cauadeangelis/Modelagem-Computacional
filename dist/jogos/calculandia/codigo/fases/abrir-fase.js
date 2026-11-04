// Ponte entre o overworld e as fases táticas (seção 10.1). A única ligação entre os dois mundos.
import { runFase, batteryFor } from './tela-da-questao.js';
import { SETTLEMENT_BY_ID } from '../dados/regioes-e-cidades.js';

// launchLevel({ id, metodo, nivel }) → Promise<{ vitoria, estrelas, erroFinal, iteracoes, bateriaRestante, dicasUsadas, xp }>
export function launchLevel({ id, metodo, nivel, freeHint = false }) {
  const s = SETTLEMENT_BY_ID[id];
  return runFase({ s: { ...s, metodo: metodo || s.metodo }, nivel, animalId: s.bicho, freeHint });
}

export { batteryFor };
