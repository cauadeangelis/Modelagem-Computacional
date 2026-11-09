// Tela única de perguntas da Calculândia (v14): casas verde, azul e vermelha e chefões usam a mesma tela.
// Cabeçalho, barra de dispositivos no topo, pergunta em destaque e, embaixo, a resposta:
//   · casa verde: 4 alternativas grandes (perguntas básicas de Cálculo Numérico);
//   · casas azul e vermelha: um terminal onde se digita a resposta (número ou vetor). O terminal também faz
//     contas: "2 − f(2)/df(2)" e Enter mostra o resultado; Enter de novo envia.
// As perguntas vêm do banco de questões do site (dados/banco-de-questoes.js, gerado de questoes.sql):
//   verde = básicas, slides e conceitos; azul = Testes 1 a 6 e listas da professora; vermelha = listas de
//   Cálculo Numérico (UERJ). Só entram questões com até 4 iterações. Sem questão no banco para o método
//   (Spline, Cancelamento…), usa as perguntas geradas de metodos-numericos.js.
// Dispositivos: sementes pagam Dica e Lupa (na casa digitada, a Lupa mostra 4 alternativas); Conceito e
// Inventário são grátis; o Escudo (relíquia) perdoa um erro; o Laboratório abre o simulador antigo.
// Estrelas: 3 de primeira e sem ajuda paga; −1 por ajuda paga; −1 por erro (o Escudo absorve um).
// Erros permitidos: 2 na múltipla escolha, 3 no terminal. Depois da resposta aparece a resolução.
// v14 (Plano de Evolução): nas casas vermelhas, às vezes a pergunta é uma Caça ao Bug Numérico (a tabela do
// estagiário com UMA célula errada: clique nela; js/motor/caca-ao-bug.js do site). No chefão das Raízes, o golpe
// final é o Método Híbrido: zerar f com um orçamento de 8 avaliações, escolhendo Bisseção, Secante ou Newton.
import { G } from '../jogo.js';
import { REGIONS, NIVEIS } from '../dados/regioes-e-cidades.js';
import { FERRAMENTAS } from '../dados/conhecimento.js';
import { abrirDuvidas } from '../interface/casas-de-duvidas.js';
import { abrirInventario } from '../interface/inventario.js';
import { METODOS } from './metodos-numericos.js';

export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// texto com expoentes: e^(0,226t) → e<sup>0,226t</sup> (depois de escapar o HTML)
export const tx = (t) => esc(t).replace(/\^\(([^)]*)\)/g, '<sup>$1</sup>').replace(/\^([−-]?[\w,]+)/g, '<sup>$1</sup>');
const VISTAS = 'calculandia-perguntas-vistas-v2';
// Temas do banco que valem para cada método além dos marcados com a região do próprio método.
const EXTRA = { cancelamento: ['ponto-flutuante'], overflow: ['ponto-flutuante'] };
const CUSTO = { dica: 1, lupa: 2 };
export const CASA_DO_NIVEL = { F: 'verde', M: 'azul', D: 'vermelha', B: 'chefe' };
const ORDEM = { verde: ['verde'], azul: ['azul', 'vermelha'], vermelha: ['vermelha', 'azul'] };
const SELO = { verde: ['● Fácil', 'Casa verde: nível Fácil'], azul: ['● Médio', 'Casa azul: nível Médio'], vermelha: ['● Difícil', 'Casa vermelha: nível Difícil'], chefe: ['☠ Chefão', 'Chefão da região'] };
export const MAX_ITERACOES = 4;

function lerVistas() { try { const d = JSON.parse(localStorage.getItem(VISTAS) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
function salvarVista(chave, id) { try { const d = lerVistas(); d[chave] = [id, ...(Array.isArray(d[chave]) ? d[chave] : [])].slice(0, 16); localStorage.setItem(VISTAS, JSON.stringify(d)); } catch (e) { /* sem armazenamento: só não evita repetir */ } }

/* ---------- escolha das perguntas ---------- */
// Perguntas do banco para um método e uma casa (exportada para os testes). Só questões de até 4 iterações.
export function perguntasDoBanco(metodo, casa = 'verde', banco = globalThis.NumeraBanco) {
  if (!banco || !Array.isArray(banco.questoes)) return [];
  const temas = new Set(banco.temas.filter((t) => t.regiao === metodo || (EXTRA[metodo] || []).includes(t.id)).map((t) => t.id));
  const boas = banco.questoes.filter((q) => temas.has(q.tema) && q.tipo !== 'programa' && q.alternativas && q.alternativas.length === 4 && (q.iteracoes == null || q.iteracoes <= MAX_ITERACOES));
  for (const c of ORDEM[casa] || ['verde']) {
    let lista = boas.filter((q) => q.casa === c);
    // nas casas digitadas, preferimos questões de conta (número ou vetor)
    if (casa !== 'verde') { const digitadas = lista.filter(digitavel); if (digitadas.length) lista = digitadas; }
    if (lista.length) return lista;
  }
  return [];
}
const numerico = (s) => /^[−-]?\d+(,\d+)?$/.test(String(s).trim());
const digitavel = (q) => (q.tipo === 'numero' && q.valor != null) || (q.tipo === 'vetor' && Array.isArray(q.vetor) && !/[a-zA-Z]/.test(q.resposta));

function doBanco(q, casa) {
  const L = (globalThis.NumeraBanco?.listas || []).find((l) => l.id === q.lista);
  const terminal = casa !== 'verde' && digitavel(q);
  return {
    id: q.id, fonte: `${L ? L.titulo : 'Banco de questões'}${q.numero ? ' · ' + q.numero : ''}`, enunciado: q.enunciado, resposta: q.resposta, observacao: q.observacao || '',
    modo: terminal ? 'terminal' : 'mc', tipo: q.tipo, valor: q.valor, vetor: q.vetor, casas: q.casas, tolerancia: q.tolerancia, parametros: q.parametros,
    alternativas: q.alternativas.map((a) => ({ texto: a.texto, correta: !!a.correta, explicacao: a.explicacao || '' })),
  };
}
// reserva: as perguntas geradas para o método (metodos-numericos.js)
function doGerador(metodo, nivel, casa) {
  const gerador = METODOS[metodo];
  if (!gerador) return null;
  let passos = [];
  try { passos = gerador(nivel === 'B' ? 'M' : nivel).passos || []; } catch (e) { passos = []; }
  passos = passos.filter((p) => Array.isArray(p.opcoes) && p.opcoes.length >= 2);
  if (!passos.length) return null;
  const p = passos[Math.floor(Math.random() * passos.length)], certa = String(p.opcoes[p.correta]);
  const terminal = casa !== 'verde' && numerico(certa), casas = terminal ? (certa.split(',')[1] || '').length : null;
  return {
    id: null, fonte: 'Pergunta da cidade', enunciado: `${p.enunciado ? p.enunciado + ' — ' : ''}${p.texto}`, resposta: certa, observacao: '', modo: terminal ? 'terminal' : 'mc', tipo: terminal ? 'numero' : 'texto',
    valor: terminal ? Number(certa.replace('−', '-').replace(',', '.')) : null, casas, tolerancia: terminal ? 0.51 * Math.pow(10, -casas) : null, explica: p.explica || '',
    alternativas: p.opcoes.map((t, i) => ({ texto: String(t), correta: i === p.correta, explicacao: i === p.correta ? '' : p.explica || '' })),
  };
}
// Caça ao Bug: tipos do gerador do site que valem para o método da cidade
export function tiposDeBug(metodo) { const CB = globalThis.NumeraCacaBug; return CB ? CB.TIPOS.filter((t) => CB.gerar(t, 1).metodo === metodo) : []; }
export function perguntaBug(metodo, semente = Math.floor(Math.random() * 1e9)) {
  const tipos = tiposDeBug(metodo); if (!tipos.length) return null;
  const b = globalThis.NumeraCacaBug.gerar(tipos[semente % tipos.length], semente);
  return { id: null, bugTipo: b.tipo, fonte: 'Caça ao Bug Numérico · o caderno do estagiário', enunciado: `${b.titulo}. Exatamente uma célula desta tabela está errada: clique nela.`, modo: 'bug', tipo: 'bug', bug: b,
    resposta: `linha ${b.bug.linha + 1}, coluna ${b.colunas[b.bug.coluna]}: o certo é ${b.certa[b.bug.linha][b.bug.coluna]}`, observacao: '', explica: b.explicacao, dicaBug: b.dica, alternativas: [] };
}
export const CHANCE_BUG = 0.3;
export function escolherPergunta(metodo, nivel, evitar = new Set(), { semBug = false } = {}) {
  if (nivel === 'D' && !semBug && Math.random() < CHANCE_BUG) { const b = perguntaBug(metodo); if (b) return b; }
  const casa = CASA_DO_NIVEL[nivel] === 'chefe' ? 'vermelha' : CASA_DO_NIVEL[nivel] || 'verde', lista = perguntasDoBanco(metodo, casa).filter((q) => !evitar.has(q.id));
  if (lista.length) {
    const chave = `${metodo}-${casa}`, vistas = lerVistas()[chave] || [], novas = lista.filter((q) => !vistas.includes(q.id)), pool = novas.length ? novas : lista;
    const q = pool[Math.floor(Math.random() * pool.length)];
    salvarVista(chave, q.id);
    return doBanco(q, casa);
  }
  return doGerador(metodo, nivel, casa);
}
// Uma questão do banco pelo id (usada pelos testes e, no modo debug, para gravar o vídeo de apresentação)
export function perguntaPorId(id, nivel = 'M', banco = globalThis.NumeraBanco) { const q = banco?.questoes.find((x) => x.id === id); return q ? doBanco(q, CASA_DO_NIVEL[nivel] === 'chefe' ? 'vermelha' : CASA_DO_NIVEL[nivel] || 'verde') : null; }
export function temPergunta(metodo, nivel = 'F') { return !!METODOS[metodo] || perguntasDoBanco(metodo, CASA_DO_NIVEL[nivel] === 'chefe' ? 'vermelha' : CASA_DO_NIVEL[nivel]).length > 0; }

/* ---------- terminal: contas e leitura da resposta ---------- */
// f(…) e df(…) chamam a função da questão (quando ela tem); ans é o último resultado.
function funcoesDa(q) {
  const M = globalThis.NumeraMath, p = q.parametros || {}, out = {};
  if (!M) return out;
  for (const [nome, src] of [['f', p.f], ['df', p.df], ['g', p.g]]) if (typeof src === 'string' && !/y/.test(src)) { try { const g = M.parseExpression(src, ['x']); out[nome] = (x) => g({ x }); } catch (e) { /* sem a função */ } }
  return out;
}
export function avaliarConta(texto, { funcoes = {}, ans = null, vars = {} } = {}) {
  const M = globalThis.NumeraMath;
  if (!M) throw new Error('Calculadora indisponível.');
  let s = String(texto).trim();
  if (!s) throw new Error('Digite um número ou uma conta.');
  // troca f(…), df(…) e g(…) pelo valor, de dentro para fora
  for (let guarda = 0; guarda < 40; guarda++) {
    const m = /\b(df|f|g)\s*\(/.exec(s);
    if (!m) break;
    const nome = m[1], ini = m.index + m[0].length; let nivel = 1, j = ini;
    for (; j < s.length && nivel; j++) { if (s[j] === '(') nivel++; else if (s[j] === ')') nivel--; }
    if (nivel) throw new Error('Faltou fechar um parêntese.');
    if (!funcoes[nome]) throw new Error(`Esta questão não tem ${nome}( ) guardada no terminal.`);
    const dentro = avaliarConta(s.slice(ini, j - 1), { funcoes, ans, vars }), v = funcoes[nome](dentro);
    s = s.slice(0, m.index) + `(${fmtTerm(v, 12).replace(',', '.')})` + s.slice(j);
  }
  const nomes = ['ans', ...Object.keys(vars)], vals = { ans: ans == null ? NaN : ans, ...vars };
  const v = M.parseExpression(s.replace(/(\d),(?=\d)/g, '$1.'), nomes)(vals);
  if (!Number.isFinite(v)) throw new Error('A conta não deu um número (divisão por zero?).');
  return v;
}
// "(1; −2; 3)" → [1, −2, 3]; "1,75" → 1.75. Cada parte pode ser uma conta.
export function lerResposta(texto, ctx = {}) {
  let t = String(texto).trim();
  // tira os parênteses (ou colchetes) de fora só quando envolvem tudo: "(1; 2)" sim, "(a+b)/2" não
  if (/^[([]/.test(t) && /[)\]]$/.test(t)) { let nivel = 0, fecha = -1; for (let i = 0; i < t.length; i++) { if ('(['.includes(t[i])) nivel++; else if (')]'.includes(t[i])) { nivel--; if (nivel === 0) { fecha = i; break; } } } if (fecha === t.length - 1) t = t.slice(1, -1).trim(); }
  let partes = t.split(/\s*;\s*|\n/).filter(Boolean);
  if (partes.length === 1 && /,\s/.test(t)) partes = t.split(/,\s+/);
  const v = partes.map((p) => avaliarConta(p, ctx));
  return v.length === 1 ? v[0] : v;
}
const ehLiteral = (texto) => /^[([]?\s*[−-]?\d+([.,]\d+)?(\s*[;]\s*[−-]?\d+([.,]\d+)?)*\s*[)\]]?$/.test(String(texto).trim());
export function fmtTerm(v, casas = 6) {
  if (!Number.isFinite(v)) return String(v);
  if (v !== 0 && (Math.abs(v) >= 1e9 || Math.abs(v) < 1e-6)) return v.toExponential(6).replace('.', ',').replace('-', '−');
  return String(Number(v.toFixed(casas))).replace('.', ',').replace('-', '−');
}
const tolDe = (q) => (q.tolerancia != null ? q.tolerancia : Math.max(5 * Math.pow(10, -((q.casas != null ? q.casas : 4) + 1)) * 1.2, Math.abs(q.valor || 0) * 1e-9));
export function conferir(q, v) {
  if (q.tipo === 'vetor') return Array.isArray(v) && v.length === q.vetor.length && v.every((x, i) => Math.abs(x - q.vetor[i]) <= tolDe(q) * Math.max(1, Math.abs(q.vetor[i])));
  if (Array.isArray(v)) return false;
  if (globalThis.NumeraResolver && q.id) return globalThis.NumeraResolver.confere(q, v);
  return Math.abs(v - q.valor) <= tolDe(q);
}

/* ---------- Método Híbrido (orçamento de avaliações) ---------- */
export const HIBRIDO = { raiz: 1.3, a: -2, b: 6, orcamento: 8, tol: 1e-6, f: (x) => Math.atan(x - 1.3), df: (x) => 1 / (1 + (x - 1.3) ** 2), custo: { bis: 1, sec: 1, nwt: 2 } };
export function perguntaHibrido() {
  return { id: null, fonte: 'Método Híbrido · golpe final', modo: 'hibrido', tipo: 'hibrido', alternativas: [], observacao: '',
    enunciado: `Zere f(x) = arctg(x − 1,3), começando em [a; b] = [−2; 6] com o chute em x = b = 6. Você tem ${HIBRIDO.orcamento} avaliações: Bisseção e Secante custam 1, Newton custa 2 (f e f′). Meta: |f(x)| ≤ 10⁻⁶. Cuidado: daqui, a tangente do Newton é arremessada para longe.`,
    resposta: 'uma ou duas bisseções para chegar perto da raiz e depois Newton (ou Secante)', explica: 'Nenhum método puro resolve: a Bisseção sozinha gasta 8 avaliações e para em erro ≈ 0,02; o Newton a partir de x = 6 diverge. A jogada de mestre (como no método de Brent) é estreitar o intervalo com a Bisseção até uma zona bem-comportada e então trocar para Newton ou Secante, que convergem muito mais rápido: 1 bisseção + 3 Newtons (7 avaliações) ou 2 bisseções + 4 secantes (6 avaliações).',
    h: { a: HIBRIDO.a, b: HIBRIDO.b, x: HIBRIDO.b, prev: null, ev: 0, hist: [], fora: false } };
}
export function passoHibrido(h, met) {
  const H = HIBRIDO, f = H.f; if (h.ev + H.custo[met] > H.orcamento) return false;
  let nx;
  if (met === 'bis') { const m = (h.a + h.b) / 2; if (f(h.a) * f(m) < 0) h.b = m; else h.a = m; nx = m; }
  else if (met === 'nwt') nx = h.x - f(h.x) / H.df(h.x);
  else { if (h.prev === null) return false; nx = h.x - f(h.x) * (h.x - h.prev) / (f(h.x) - f(h.prev)); }
  h.ev += H.custo[met]; h.prev = h.x; h.x = nx; h.hist.push({ met, x: nx, fx: f(nx), ev: h.ev });
  if (!Number.isFinite(nx) || Math.abs(nx) > 50) h.fora = true;
  return true;
}
export const hibridoVenceu = (h) => !h.fora && Math.abs(HIBRIDO.f(h.x)) <= HIBRIDO.tol;

/* ---------- resolução (formato dos slides) ---------- */
function resolucaoHtml(q) {
  const R = globalThis.NumeraResolver;
  let resumo = q.explica || '', tabela = '';
  if (R && q.parametros) {
    try {
      const r = R.resolver(q.parametros);
      resumo = r.resumo || resumo;
      if (r.tabela && r.tabela.linhas.length) tabela = `<div class="pq-tabela" tabindex="0" role="region" aria-label="Tabela da resolução"><table><thead><tr>${r.tabela.colunas.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.tabela.linhas.map((l, i) => `<tr class="${i === r.tabela.linhas.length - 1 ? 'on' : ''}">${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      else if (r.linhas && r.linhas.length) tabela = `<div class="pq-tabela" tabindex="0" role="region" aria-label="Tabela da resolução"><table><thead><tr><th scope="col">k</th><th scope="col">xₖ</th><th scope="col">yₖ</th></tr></thead><tbody>${r.linhas.map((l) => `<tr><td>${l.k}</td><td>${fmtTerm(l.x, 4)}</td><td>${fmtTerm(l.y, 6)}</td></tr>`).join('')}</tbody></table></div>`;
    } catch (e) { /* sem resolução calculada */ }
  }
  const passos = String(resumo).replace(/\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, '.\n').split('\n').filter(Boolean);
  if (!passos.length && !tabela) return '';
  return `<details class="pq-resol" open><summary>Resolução</summary>${passos.map((p) => `<p>${tx(p)}</p>`).join('')}${tabela}<p class="pq-resp"><span>Resposta</span> <b>${tx(q.resposta)}</b></p></details>`;
}

/* ---------- a tela ---------- */
// perguntas: lista de { q, metodo, nome } (1 nas casas; 3 nos chefões). Resolve com o resultado da fase.
function abrirTela({ settlement, casa, perguntas, freeHint = false, chefe = null, laboratorio = false }) {
  const root = document.getElementById('fase'), regiao = settlement.regiao, temReliquia = (G.progress.d.rpg?.relics || []).length > 0;
  let resolve, fechado = false, idx = 0, erros = 0, pagas = 0, dicaGratis = !!freeHint, escudo = false, escudoUsado = false, fim = null, modal = null, msg = '', vida = perguntas.length;
  const hpMax = perguntas.length;
  let atual = null, ans = null, log = [], errosQ = 0, acertou = false;
  const usados = new Set(), promise = new Promise((r) => { resolve = r; }), $ = (id) => root.querySelector('#' + id);
  const limiteErros = () => (atual.q.modo === 'terminal' ? 3 : atual.q.modo === 'hibrido' ? 1 : 2), vidas = chefe ? 3 : null;
  let errosBug = new Set(), linhaLupa = -1;
  let riscadas = new Set(), erradas = new Set();
  function carregar(i) {
    idx = i; atual = perguntas[i]; ans = null; log = []; errosQ = 0; acertou = false; riscadas = new Set(); erradas = new Set(); msg = ''; errosBug = new Set(); linhaLupa = -1;
    usados.delete('lupa');
    if (G.debug) G.pergunta = { get q() { return atual.q; }, get idx() { return idx; } };
  }
  carregar(0);
  G.audio?.beginTactical?.(); root.classList.remove('hidden');

  const estrelas = () => Math.max(1, 3 - Math.min(1, pagas) - Math.max(0, erros - (escudoUsado ? 1 : 0)));
  function disp(id, rotulo, custo, titulo, extra = '') {
    const preco = custo === 0 ? '<small>grátis</small>' : custo ? `<small>${custo} 🌰</small>` : '';
    return `<button class="btn ${usados.has(id) ? 'usado' : ''}" data-pq="${id}" title="${esc(titulo)}" ${fim ? 'disabled' : ''} ${extra}>${rotulo}${preco}</button>`;
  }
  function areaBug(q, terminado) {
    const b = q.bug;
    return `<div class="pq-bug" role="group" aria-label="Tabela do estagiário"><table><thead><tr>${b.colunas.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.linhas.map((row, i) => `<tr class="${linhaLupa === i ? 'lupa' : ''}">${row.map((v, j) => {
      const certo = b.bug.linha === i && b.bug.coluna === j, cls = terminado && certo ? 'certa' : errosBug.has(i + ',' + j) ? 'errada' : '';
      return `<td><button class="pq-cel ${cls}" data-bug="${i},${j}" ${terminado || errosBug.has(i + ',' + j) ? 'disabled' : ''} aria-label="Linha ${i + 1}, ${esc(b.colunas[j])}: ${esc(v)}">${esc(v)}${terminado && certo ? `<small>certo: ${esc(b.certa[i][j])}</small>` : ''}</button></td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function areaHibrido(q, terminado) {
    const h = q.h, H = HIBRIDO, resta = H.orcamento - h.ev, fx = H.f(h.x);
    const bt = (m, rot, extra = '') => `<button class="btn" data-hib="${m}" ${terminado || h.ev + H.custo[m] > H.orcamento || extra ? 'disabled' : ''}>${rot}</button>`;
    return `<div class="pq-hib"><div class="pq-hib-topo"><span>Orçamento: <b>${resta}</b> de ${H.orcamento} ⚡</span><span class="pq-hib-bat" aria-hidden="true">${'▮'.repeat(Math.max(0, resta))}${'▯'.repeat(Math.min(H.orcamento, h.ev))}</span><span>x = <b>${fmtTerm(h.x, 8)}</b> · |f(x)| = <b>${fmtTerm(Math.abs(fx), 3)}</b></span><span>[a; b] = [${fmtTerm(h.a, 4)}; ${fmtTerm(h.b, 4)}]</span></div>
      <div class="pq-hib-acoes" role="group" aria-label="Escolha o próximo passo">${bt('bis', '✂️ Bisseção · 1 ⚡')}${bt('sec', '🔗 Secante · 1 ⚡', h.prev === null ? 'sem dois pontos' : '')}${bt('nwt', '📐 Newton · 2 ⚡')}</div>
      ${h.hist.length ? `<div class="pq-tabela" tabindex="0" role="region" aria-label="Passos do Método Híbrido"><table><thead><tr><th scope="col">passo</th><th scope="col">método</th><th scope="col">x</th><th scope="col">|f(x)|</th><th scope="col">⚡ gastos</th></tr></thead><tbody>${h.hist.map((p, i) => `<tr class="${i === h.hist.length - 1 ? 'on' : ''}"><td>${i + 1}</td><td>${{ bis: 'Bisseção', sec: 'Secante', nwt: 'Newton' }[p.met]}</td><td>${fmtTerm(p.x, 8)}</td><td>${fmtTerm(Math.abs(p.fx), 3)}</td><td>${p.ev}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>`;
  }
  function areaResposta() {
    const q = atual.q, terminado = acertou || fim || errosQ >= limiteErros();
    if (q.modo === 'bug') return areaBug(q, terminado);
    if (q.modo === 'hibrido') return areaHibrido(q, terminado);
    if (q.modo === 'mc') return `<div class="pq-alts" role="group" aria-label="Alternativas">${q.alternativas.map((a, i) => {
      const est = terminado ? (a.correta ? 'certa' : erradas.has(i) ? 'errada' : riscadas.has(i) ? 'riscada' : '') : erradas.has(i) ? 'errada' : riscadas.has(i) ? 'riscada' : '';
      return `<button class="pq-alt ${est}" data-alt="${i}" ${terminado || erradas.has(i) || riscadas.has(i) ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${tx(a.texto)}</span></button>`;
    }).join('')}</div>`;
    const funcs = Object.keys(funcoesDa(q));
    return `<div class="pq-term" role="group" aria-labelledby="pq-term-t">
      <div class="pq-term-topo"><span id="pq-term-t">Terminal de resposta</span><span class="pq-tentativas" aria-label="Tentativas">${'●'.repeat(Math.max(0, limiteErros() - errosQ))}${'○'.repeat(Math.min(limiteErros(), errosQ))}</span></div>
      <div class="pq-term-log" id="pq-log" aria-live="polite">${log.map((l) => `<div class="${l.c}">${l.h}</div>`).join('') || `<div class="dim">${q.tipo === 'vetor' ? 'Resposta em vetor: (x₁; x₂; …), separe com ponto e vírgula.' : 'Digite a resposta com vírgula ou ponto.'} Pode digitar uma conta: Enter calcula, Enter de novo envia.${funcs.length ? ` Guardadas: ${funcs.map((n) => `${n}( )`).join(', ')}.` : ''}</div>`}</div>
      ${terminado ? '' : `<form class="pq-term-linha" id="pq-form" autocomplete="off"><label for="pq-in">numera&gt;</label><input id="pq-in" type="text" inputmode="text" spellcheck="false" autocapitalize="off" aria-describedby="pq-term-t"><button class="btn" type="submit" id="pq-enviar">Enviar</button></form>`}
    </div>`;
  }
  function cabecalhoChefe() {
    if (!chefe) return '';
    return `<div class="pq-chefe" aria-label="Batalha"><span class="pq-chefe-nome">☠ ${esc(chefe.nome)}</span><span class="pq-hp" role="img" aria-label="Vida do chefão: ${vida} de ${hpMax}"><i style="width:${(100 * vida) / hpMax}%"></i></span><span class="pq-vidas" aria-label="Suas vidas: ${Math.max(0, vidas - erros)} de ${vidas}">${'❤️'.repeat(Math.max(0, vidas - erros))}${'🖤'.repeat(Math.min(vidas, erros))}</span></div>`;
  }
  function desenhar() {
    const q = atual.q, sementes = G.progress.seeds, [selo, seloT] = SELO[casa], terminado = acertou || fim || errosQ >= limiteErros();
    root.innerHTML = `<section class="fase-box pq pq-casa-${casa}" role="dialog" aria-modal="true" aria-labelledby="pq-t">
      <header class="pq-topo"><div class="pq-id"><small>${esc(REGIONS[regiao]?.nome || '')} · ${esc(settlement.nome)}${chefe ? ` · golpe ${idx + 1}` : ''}</small><h2 id="pq-t">${esc(atual.nome || settlement.metodoNome || 'Pergunta')}</h2></div>
        <span class="pq-selo pq-selo-${casa}" title="${esc(seloT)}">${selo}</span><button class="btn" data-pq="sair" id="fz-quit">Sair</button></header>
      ${cabecalhoChefe()}
      <div class="pq-disp" role="toolbar" aria-label="Dispositivos">
        <span class="tq-sementes" title="Sementes: você ganha nos baús e ao vencer fases">🌰 <b>${sementes}</b></span>
        ${disp('conceito', '📘 Conceito', 0, 'Casa de Dúvidas da região: ideia, fórmula e erros comuns')}
        ${disp('dica', '💡 Dica', dicaGratis ? 0 : CUSTO.dica, 'Mostra a fórmula e a ideia do método (tira 1 estrela)', usados.has('dica') || terminado ? 'disabled' : '')}
        ${disp('lupa', '🔍 Lupa', CUSTO.lupa, q.modo === 'terminal' ? 'Mostra 4 alternativas no lugar do terminal (tira 1 estrela)' : 'Risca uma alternativa errada (tira 1 estrela)', riscadas.size || usados.has('lupa') || terminado ? 'disabled' : '')}
        ${temReliquia ? disp('escudo', `🛡️ Escudo${escudo ? ' ativo' : ''}`, null, 'Relíquia: o primeiro erro não tira estrela', escudo ? 'disabled' : '') : ''}
        ${disp('inventario', '🎒 Inventário', null, 'Ferramentas, cartas e relíquias')}
        ${laboratorio ? disp('laboratorio', '🧪 Laboratório', null, 'Troca a pergunta pelo simulador da fase (modo antigo, com bateria e ferramentas)') : ''}
      </div>
      <div class="pq-pergunta"><span class="pq-fonte">${esc(q.fonte)}</span><p class="pq-enunciado">${tx(q.enunciado)}</p></div>
      ${areaResposta()}
      <div id="pq-msg" class="pq-msg ${msg ? msg.tipo : ''}" role="status" aria-live="polite">${msg ? msg.html : ''}</div>
      ${terminado ? resolucaoHtml(q) : ''}
      ${terminado ? `<div class="pq-acoes">${fim?.vitoria ? `<span class="pq-estrelas" aria-label="${fim.estrelas} de 3 estrelas">${'⭐'.repeat(fim.estrelas)}${'☆'.repeat(3 - fim.estrelas)}</span>` : ''}${fim ? '<button class="btn" data-pq="voltar" id="fz-back">Voltar ao mapa</button>' : '<button class="btn" data-pq="proxima" id="pq-proxima">Próximo golpe ▶</button>'}</div>` : ''}
      <div id="pq-overlay" class="tq-overlay hidden"></div>
    </section>`;
    const lg = $('pq-log'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  function focar(sel) { requestAnimationFrame(() => root.querySelector(sel)?.focus?.()); }
  function focoPadrao() { const terminado = acertou || fim || errosQ >= limiteErros(), m = atual.q.modo; focar(terminado ? (fim ? '#fz-back' : '#pq-proxima') : m === 'terminal' ? '#pq-in' : m === 'bug' ? '.pq-cel:not([disabled])' : m === 'hibrido' ? '[data-hib]:not([disabled])' : '.pq-alt:not([disabled])'); }
  function pagar(qtd) { if (qtd === 0) return true; if (G.progress.spendSeeds(qtd)) { G.audio?.sfx?.('semente'); return true; } msg = { tipo: 'no', html: `Faltam sementes (${qtd} 🌰). Abra os baús espalhados pelo mapa para ganhar mais.` }; return false; }

  // acerto/erro de uma pergunta (vale para alternativa e terminal)
  function acerto() {
    acertou = true;
    const q = atual.q;
    if (chefe) {
      vida--; G.audio?.sfx?.('acerto'); G.camRig?.shake?.(0.25, 0.25);
      if (vida <= 0) { fim = { vitoria: true, estrelas: estrelas() }; G.audio?.sfx?.('vitoria'); msg = { tipo: 'ok', html: `<b>Golpe final!</b> ${esc(chefe.nome)} caiu! A resposta é ${tx(q.resposta)}.` }; }
      else msg = { tipo: 'ok', html: `<b>Acertou o golpe!</b> A resposta é ${tx(q.resposta)}. Faltam ${vida} ${vida === 1 ? 'golpe' : 'golpes'}.` };
    } else { fim = { vitoria: true, estrelas: estrelas() }; G.audio?.sfx?.('vitoria'); msg = { tipo: 'ok', html: `<b>Certo!</b> A resposta é ${tx(q.resposta)}.${q.observacao ? ` <br><small>${esc(q.observacao)}</small>` : ''}` }; }
  }
  function erro(explicacao) {
    const q = atual.q; erros++; errosQ++; if (escudo && !escudoUsado) escudoUsado = true;
    const perdeuChefe = chefe && erros >= vidas, perdeuQ = errosQ >= limiteErros();
    if (perdeuChefe || (!chefe && perdeuQ)) { fim = { vitoria: false, estrelas: 0 }; G.audio?.sfx?.('derrota'); msg = { tipo: 'no', html: `<b>Não foi dessa vez.</b> ${esc(explicacao || '')} A resposta certa é <b>${tx(q.resposta)}</b>.` }; return; }
    if (chefe && perdeuQ) { G.audio?.sfx?.('derrota'); msg = { tipo: 'no', html: `<b>O chefão defendeu.</b> ${esc(explicacao || '')} A resposta era <b>${tx(q.resposta)}</b>. Vamos ao próximo golpe.` }; perguntas.push({ ...atual, nome: FERRAMENTAS[atual.metodo]?.nome || atual.nome, q: escolherPergunta(atual.metodo, 'M', new Set([atual.q.id]), { semBug: true }) || escolherPergunta(atual.metodo, 'F') }); return; }
    G.audio?.sfx?.('toc');
    const resta = limiteErros() - errosQ;
    msg = { tipo: 'no', html: `<b>Ainda não.</b> ${esc(explicacao || '')} ${escudoUsado && erros === 1 ? 'O Escudo segurou esta: a estrela continua. ' : ''}${resta === 1 ? 'Você tem mais uma tentativa.' : `Você tem mais ${resta} tentativas.`}` };
  }
  function responderAlt(i) {
    const q = atual.q;
    if (fim || acertou || erradas.has(i) || riscadas.has(i) || q.modo !== 'mc') return;
    const a = q.alternativas[i];
    if (a.correta) acerto(); else { erradas.add(i); erro(a.explicacao); }
    desenhar(); focoPadrao();
  }
  function linha(c, h) { log.push({ c, h }); if (log.length > 12) log = log.slice(-12); }
  function atualizarLog(valor) {
    const el = $('pq-log'), inp = $('pq-in');
    if (el) { el.innerHTML = log.map((l) => `<div class="${l.c}">${l.h}</div>`).join(''); el.scrollTop = el.scrollHeight; }
    if (inp && valor != null) { inp.value = valor; inp.select(); }
  }
  function enviarTerminal(texto) {
    const q = atual.q, ctx = { funcoes: funcoesDa(q), ans };
    const t = String(texto || '').trim();
    if (!t) return;
    if (/^(ajuda|help|\?)$/i.test(t)) { linha('dim', 'Números com vírgula ou ponto (1,75). Contas: + − * / ^, sqrt( ), exp( ), ln( ), sen( ), cos( ), pi. ans = último resultado.' + (Object.keys(ctx.funcoes).length ? ` ${Object.keys(ctx.funcoes).map((n) => `${n}( )`).join(', ')} usam a função da questão.` : '')); desenhar(); focoPadrao(); return; }
    if (/^limpar$/i.test(t)) { log = []; desenhar(); focoPadrao(); return; }
    let v;
    try { v = lerResposta(t, ctx); } catch (e) { linha('erro', `numera&gt; ${esc(t)}<br>⚠ ${esc(e.message)}`); atualizarLog(); return; }
    if (!ehLiteral(t)) {
      // conta: mostra o resultado e deixa no campo, sem redesenhar a tela (o foco fica no terminal); Enter de novo envia
      const mostra = Array.isArray(v) ? `(${v.map((x) => fmtTerm(x)).join('; ')})` : fmtTerm(v);
      if (!Array.isArray(v)) ans = v;
      linha('conta', `numera&gt; ${esc(t)}<br>= <b>${esc(mostra)}</b>`);
      atualizarLog(mostra); return;
    }
    const ok = conferir(q, v);
    linha(ok ? 'certo' : 'errado', `resposta&gt; ${esc(t)} ${ok ? '✔' : '✘'}`);
    if (ok) acerto(); else erro(dicaDoErro(q, v));
    desenhar(); focoPadrao();
  }
  // um palpite errado perto de uma alternativa errada ganha a explicação dela
  function dicaDoErro(q, v) {
    if (Array.isArray(v)) return q.tipo === 'vetor' && v.length !== q.vetor.length ? `A resposta tem ${q.vetor.length} componentes.` : 'Confira cada componente.';
    for (const a of q.alternativas) {
      if (a.correta || !a.explicacao) continue;
      const n = Number(String(a.texto).replace(/[^\d,−-]/g, '').replace('−', '-').replace(',', '.'));
      if (Number.isFinite(n) && Math.abs(n - v) <= tolDe(q) * 2) return a.explicacao;
    }
    return '';
  }
  function proxima() {
    if (idx + 1 >= perguntas.length) return;
    carregar(idx + 1); desenhar(); focoPadrao();
  }
  function acao(id) {
    const q = atual.q;
    if (id === 'sair') { fechar({ vitoria: false, abandonou: true, estrelas: 0 }); return; }
    if (id === 'voltar') { fechar(resultado()); return; }
    if (id === 'proxima') { proxima(); return; }
    if (id === 'laboratorio') { fechar({ vitoria: false, abandonou: true, estrelas: 0, laboratorio: true }); return; }
    if (id === 'conceito') { const close = abrirDuvidas($('pq-overlay'), regiao, { foco: atual.metodo, onClose: () => { modal = null; } }); modal = { close }; return; }
    if (id === 'inventario') { const r = abrirInventario($('pq-overlay'), { aba: 'cartas', onClose: () => { modal = null; } }); modal = r; return; }
    if (id === 'dica' && !usados.has('dica')) {
      const custo = dicaGratis ? 0 : CUSTO.dica, ferramenta = FERRAMENTAS[atual.metodo] || null;
      if (pagar(custo)) { usados.add('dica'); if (custo) pagas++; dicaGratis = false; G.audio?.sfx?.('dica'); msg = { tipo: 'dica', html: ferramenta ? `<b>💡 ${esc(ferramenta.nome)}:</b> ${esc(ferramenta.funcao)} <br><b>Fórmula:</b> ${esc(ferramenta.formula)}` : 'Releia o enunciado com calma e elimine as alternativas absurdas.' }; }
    }
    if (id === 'lupa' && !usados.has('lupa') && !riscadas.size) {
      if (pagar(CUSTO.lupa)) {
        usados.add('lupa'); pagas++;
        if (q.modo === 'bug') { linhaLupa = q.bug.bug.linha; msg = { tipo: 'dica', html: `🔍 A Lupa encontrou a linha do erro: a linha ${linhaLupa + 1}.` }; }
        else if (q.modo === 'hibrido') msg = { tipo: 'dica', html: '🔍 A Lupa sussurra: comece com a Bisseção até chegar perto da raiz e só então troque para Newton ou Secante.' };
        else if (q.modo === 'terminal') { q.modo = 'mc'; msg = { tipo: 'dica', html: '🔍 A Lupa trocou o terminal por 4 alternativas.' }; }
        else { const livres = q.alternativas.map((a, i) => i).filter((i) => !q.alternativas[i].correta && !erradas.has(i)); const r = livres[Math.floor(Math.random() * livres.length)]; if (r != null) riscadas.add(r); msg = { tipo: 'dica', html: `🔍 A Lupa riscou a alternativa ${'ABCD'[r]}.` }; }
      }
    }
    if (id === 'escudo' && temReliquia && !escudo) { escudo = true; usados.add('escudo'); msg = { tipo: 'dica', html: '🛡️ Escudo ativo: se errar uma vez, a estrela fica.' }; }
    desenhar(); if (root.querySelector(`[data-pq="${id}"]:not([disabled])`)) focar(`[data-pq="${id}"]:not([disabled])`); else focoPadrao();
  }
  const resultado = () => ({ vitoria: !!fim?.vitoria, estrelas: fim?.vitoria ? fim.estrelas : 0, erroFinal: 0, iteracoes: erros + (fim?.vitoria ? 1 : 0), bateriaRestante: 0, dicasUsadas: pagas, xp: fim?.vitoria ? (chefe ? 20 : 10) * fim.estrelas : 0, abandonou: !fim, pergunta: perguntas.map((p) => p.q.id).filter(Boolean).join(',') || null });
  function fechar(r) { if (fechado) return; fechado = true; modal?.close?.(); root.removeEventListener('click', clique); root.removeEventListener('submit', envio); window.removeEventListener('keydown', tecla, true); root.classList.add('hidden'); root.innerHTML = ''; G.audio?.endTactical?.(); if (G.debug) G.pergunta = null; resolve(r); }
  function cliqueBug(i, j) {
    const q = atual.q, terminado = acertou || fim || errosQ >= limiteErros(); if (terminado || q.modo !== 'bug') return;
    if (q.bug.bug.linha === i && q.bug.bug.coluna === j) acerto(); else { errosBug.add(i + ',' + j); erro('Essa célula está certa. ' + (errosQ === 0 ? q.dicaBug : '')); }
    desenhar(); focoPadrao();
  }
  function cliqueHibrido(m) {
    const q = atual.q, terminado = acertou || fim || errosQ >= limiteErros(); if (terminado || q.modo !== 'hibrido') return;
    if (!passoHibrido(q.h, m)) return;
    G.audio?.sfx?.(m === 'nwt' ? 'dica' : 'toc');
    if (q.h.fora) erro('A tangente arremessou o ponto para fora do mapa: o Newton divergiu.');
    else if (hibridoVenceu(q.h)) acerto();
    else if (q.h.ev >= HIBRIDO.orcamento || (q.h.ev + 1 > HIBRIDO.orcamento)) erro('Acabou o orçamento antes de |f(x)| ≤ 10⁻⁶.');
    else msg = { tipo: 'dica', html: `${{ bis: 'Bisseção', sec: 'Secante', nwt: 'Newton' }[m]}: x = ${esc(fmtTerm(q.h.x, 8))}, |f(x)| = ${esc(fmtTerm(Math.abs(HIBRIDO.f(q.h.x)), 3))}. Restam ${HIBRIDO.orcamento - q.h.ev} ⚡.` };
    desenhar(); focoPadrao();
  }
  function clique(e) { const cb = e.target.closest('[data-bug]'); if (cb && !cb.disabled) { const [i, j] = cb.dataset.bug.split(',').map(Number); cliqueBug(i, j); return; } const hb = e.target.closest('[data-hib]'); if (hb && !hb.disabled) { cliqueHibrido(hb.dataset.hib); return; } const alt = e.target.closest('[data-alt]'); if (alt && !alt.disabled) { responderAlt(Number(alt.dataset.alt)); return; } const b = e.target.closest('[data-pq]'); if (b && !b.disabled) acao(b.dataset.pq); }
  function envio(e) { if (e.target.id !== 'pq-form') return; e.preventDefault(); enviarTerminal($('pq-in')?.value); }
  function tecla(e) {
    if (fechado || modal || !$('pq-t')) return;
    const alvo = e.target?.tagName, terminado = acertou || fim || errosQ >= limiteErros();
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fim ? fechar(resultado()) : fechar({ vitoria: false, abandonou: true, estrelas: 0 }); return; }
    if (alvo === 'INPUT' || alvo === 'TEXTAREA' || alvo === 'SELECT') { e.stopPropagation(); return; }
    const k = e.key.toLowerCase(), i = '1234'.includes(k) ? '1234'.indexOf(k) : 'abcd'.includes(k) && k.length === 1 ? 'abcd'.indexOf(k) : -1;
    if (i >= 0 && !terminado && atual.q.modo === 'mc') { e.preventDefault(); e.stopPropagation(); responderAlt(i); return; }
    if (terminado && e.key === 'Enter' && !['fz-back', 'pq-proxima'].includes(document.activeElement?.id) && document.activeElement?.tagName !== 'SUMMARY') { e.preventDefault(); fim ? fechar(resultado()) : proxima(); }
  }
  root.addEventListener('click', clique);
  root.addEventListener('submit', envio);
  window.addEventListener('keydown', tecla, true);
  desenhar(); focoPadrao();
  return promise;
}

/* ---------- casas ---------- */
export function runPergunta({ s: settlement, nivel = 'F', freeHint = false, laboratorio = true }) {
  const casa = CASA_DO_NIVEL[nivel] || 'verde', metodo = settlement.metodo, q = (G.debug && G.forcarPergunta && G.forcarPergunta(metodo, nivel)) || escolherPergunta(metodo, nivel);
  if (!q) return Promise.resolve({ vitoria: false, abandonou: true, estrelas: 0, semPergunta: true });
  return abrirTela({ settlement, casa, perguntas: [{ q, metodo, nome: settlement.metodoNome || FERRAMENTAS[metodo]?.nome }], freeHint, laboratorio: laboratorio && casa !== 'verde' });
}

/* ---------- chefões: 3 golpes de métodos diferentes da região ---------- */
export const METODOS_DO_CHEFE = {
  chefe0: ['truncamento', 'cancelamento', 'overflow'],
  chefe1: ['bissecao', 'falsaPosicao', 'pontoFixo', 'newton', 'secante'],
  chefe2: ['gauss', 'pivoteamento', 'lu', 'jacobi', 'seidel'],
  chefe3: ['lagrange', 'spline', 'minimosQuadrados'],
  chefe4: ['trapezio', 'simpson13', 'simpson38', 'euler', 'rk4'],
};
const NOME_CHEFE = { chefe0: 'O Overflow', chefe1: 'A Hidra das Raízes', chefe2: 'O Guardião Hilbert', chefe3: 'O Colosso de Runge', chefe4: 'O Tsunami Rígido' };
export function golpesDoChefe(id, n = 3) {
  const lista = [...(METODOS_DO_CHEFE[id] || [])].sort(() => Math.random() - 0.5), out = [], usadas = new Set();
  for (const m of lista) {
    if (out.length >= n) break;
    // preferimos questões do banco digitáveis; métodos sem banco entram com as perguntas geradas
    const q = escolherPergunta(m, 'D', usadas) || escolherPergunta(m, 'M', usadas);
    if (!q) continue;
    if (q.id) usadas.add(q.id);
    out.push({ q, metodo: m, nome: FERRAMENTAS[m]?.nome || m });
  }
  if (id === 'chefe1' && out.length) out[out.length - 1] = { q: perguntaHibrido(), metodo: 'newton', nome: 'Método Híbrido' };
  return out;
}
export function runChefe({ s: settlement, freeHint = false }) {
  const golpes = golpesDoChefe(settlement.metodo);
  if (!golpes.length) return Promise.resolve({ vitoria: false, abandonou: true, estrelas: 0, semPergunta: true });
  return abrirTela({ settlement, casa: 'chefe', perguntas: golpes, freeHint, chefe: { nome: NOME_CHEFE[settlement.metodo] || settlement.nome } });
}

export { NIVEIS };
