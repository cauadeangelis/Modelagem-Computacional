import { getLevel } from '../fases/catalogo-de-fases.js';
export function analisarPorta(cidade, nivel) {
  let l; try { l = getLevel(cidade.metodo, nivel); } catch (_) { return null; }
  if (l.kind !== 'root') return { texto: 'Este laboratório usa outro tipo de modelo. Confira as condições do método na Casa de Dúvidas.', intervalo: null };
  const a = l.a, b = l.b, x = l.x, sinal = l.f(a) * l.f(b), derivada = l.df ? l.df(x) : NaN;
  return { intervalo: [a, b], texto: `No simulador desta cidade: a = ${a}, b = ${b}. ${sinal < 0 ? 'Há troca de sinal nas pontas; confira também a continuidade.' : sinal === 0 ? 'Uma das pontas já é raiz.' : 'As pontas não trocam de sinal: cuidado com métodos de intervalo.'}${Number.isFinite(derivada) && Math.abs(derivada) < 0.1 ? ' Farejei uma derivada pequena no chute: a tangente pode lançar o próximo ponto para longe.' : ''}` };
}
