// Ponte entre o overworld e as fases (seção 10.1). A única ligação entre os dois mundos.
// v14: todas as casas e os chefões abrem a mesma tela de perguntas (pergunta.js): casa verde com
// alternativas; azul e vermelha com o terminal de resposta; chefões com três golpes. A Usina Central abre a
// fase final (usina-final.js). O simulador antigo (tela-da-questao.js) continua acessível pelo botão
// 🧪 Laboratório das casas azul e vermelha.
import { runFase, batteryFor } from './tela-da-questao.js';
import { runPergunta, runChefe, temPergunta } from './pergunta.js';
import { runUsinaFinal } from './usina-final.js';
import { SETTLEMENT_BY_ID } from '../dados/regioes-e-cidades.js';

// launchLevel({ id, metodo, nivel }) → Promise<{ vitoria, estrelas, erroFinal, iteracoes, bateriaRestante, dicasUsadas, xp }>
export async function launchLevel({ id, metodo, nivel, freeHint = false }) {
  const s = SETTLEMENT_BY_ID[id], cidade = { ...s, metodo: metodo || s.metodo };
  if (cidade.metodo === 'final') return runUsinaFinal({ s: cidade, freeHint });
  if (nivel === 'B') return runChefe({ s: cidade, freeHint });
  if (temPergunta(cidade.metodo, nivel)) {
    const r = await runPergunta({ s: cidade, nivel, freeHint });
    if (!r.laboratorio && !r.semPergunta) return r;
  }
  return runFase({ s: cidade, nivel, animalId: s.bicho, freeHint });
}

export { batteryFor };
