// Formatação numérica em pt-BR e montagem de alternativas.
import { shuffle } from '../utils/math.js';

const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const sup = (s) => s.split('').map((c) => SUP[c] ?? c).join('');

export function fmt(v, casas = 4) {
  if (typeof v === 'string') return v;
  if (Number.isNaN(v)) return 'NaN';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
  if (v !== 0 && (Math.abs(v) >= 1e7 || Math.abs(v) < 1e-4)) {
    const [m, e] = v.toExponential(3).split('e');
    const mm = String(Number(m)).replace('.', ',').replace('-', '−');
    return `${mm}·10${sup(e.replace('+', ''))}`;
  }
  let r = Number(v.toFixed(casas));
  if (Object.is(r, -0)) r = 0;
  return r.toLocaleString('pt-BR', { maximumFractionDigits: casas, useGrouping: false }).replace('-', '−');
}

export const iv = (a, b) => `[${fmt(a)}; ${fmt(b)}]`;

// alternativas: a correta + distratores únicos (até 4), embaralhadas
export function opcoes(correct, wrongs = [], f = fmt) {
  const isStr = typeof correct === 'string';
  const cs = isStr ? correct : f(correct);
  const set = [cs];
  for (const w of wrongs) {
    if (set.length >= 4) break;
    const s = typeof w === 'string' ? w : f(w);
    if (!set.includes(s) && s !== 'NaN') set.push(s);
  }
  let k = 1;
  while (!isStr && set.length < 4 && k < 30) {
    const delta = correct === 0 ? 0.1 * k : Math.abs(correct) * 0.12 * Math.ceil(k / 2);
    const s = f(correct + (k % 2 ? delta : -delta));
    if (!set.includes(s)) set.push(s);
    k++;
  }
  const order = shuffle([...set.keys()]);
  return { opcoes: order.map((i) => set[i]), correta: order.indexOf(0) };
}

export const R = () => Math.random();
export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const nz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
