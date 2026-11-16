// Região 1 da Calculândia (v16): perguntas fixas, sempre as mesmas, e uma rota em ordem.
// A professora joga na ordem: as 3 casas do Cancelamento, depois as 3 da Padaria, depois as 3 do Galinheiro
// (em cada vila: verde, azul, vermelha) e, por fim, o chefão do Silo. Cada lugar mostra o número da rota
// (1ª … 9ª, 10º) no mapa, no minimapa e em cima do prédio; só abre o próximo da lista.
//   · verdes (múltipla escolha): a 3ª iteração da Bisseção de x·e⁻ˣ − c (x médio, f(x médio), Er%);
//   · azuis (terminal): a Questão 01 de Lagrange, letra a no Cancelamento, b na Padaria, c no Galinheiro;
//   · vermelhas (terminal, um x de cada vez): a 1ª iteração de Gauss-Seidel em sistemas 4×4;
//   · chefão: a Bisseção de x·e⁻ˣ − 0,200 com ε = 0,80% — o jogador descobre que para na 5ª e digita o x final.
// As outras regiões continuam sorteando do banco de questões.

export const ROTA_R1 = [
  { sid: 'C0.2', nivel: 'F' }, { sid: 'C0.2', nivel: 'M' }, { sid: 'C0.2', nivel: 'D' },
  { sid: 'C0.1', nivel: 'F' }, { sid: 'C0.1', nivel: 'M' }, { sid: 'C0.1', nivel: 'D' },
  { sid: 'C0.3', nivel: 'F' }, { sid: 'C0.3', nivel: 'M' }, { sid: 'C0.3', nivel: 'D' },
  { sid: 'B0', nivel: 'B' },
].map((r, i) => ({ ...r, ordem: i + 1, chave: r.nivel === 'B' ? r.sid : `${r.sid}-${r.nivel}`, rotulo: r.nivel === 'B' ? `${i + 1}º` : `${i + 1}ª` }));
const POR_CHAVE = Object.fromEntries(ROTA_R1.map((r) => [r.chave, r]));
const VILA = { 'C0.1': 'Padaria', 'C0.2': 'Cancelamento', 'C0.3': 'Galinheiro', B0: 'Silo' };
const NOME_NIVEL = { F: 'casa verde', M: 'casa azul', D: 'casa vermelha', B: 'chefão' };

export const naRota = (sid, nivel) => POR_CHAVE[nivel === 'B' ? sid : `${sid}-${nivel}`] || null;
// progresso: precisa de won(chave)
export function proximaDaRota(progress) { return ROTA_R1.find((r) => !progress.won(r.chave)) || null; }
export function liberadaNaRota(progress, sid, nivel) {
  const r = naRota(sid, nivel); if (!r) return true;
  return ROTA_R1.slice(0, r.ordem - 1).every((x) => progress.won(x.chave));
}
export const descricaoDaRota = (r) => `${r.rotulo} da rota: ${NOME_NIVEL[r.nivel]} ${r.nivel === 'B' ? 'do Silo' : `${r.sid === 'C0.1' ? 'da' : 'do'} ${VILA[r.sid]}`}`;

/* ---------- formatação ---------- */
const br = (v, d) => { const k = 10 ** d, r = Math.sign(v) * Math.round(Math.abs(v) * k * (1 + 1e-12)) / k; return r.toFixed(d).replace('.', ',').replace('-', '−'); };
const tabela = (cab, linhas) => `<div class="pq-tabela r1-tab" tabindex="0" role="region" aria-label="Tabela da questão"><table><thead><tr>${cab.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const pendente = '<span class="r1-q">?</span>';

/* ---------- verdes: Bisseção, 3ª iteração ---------- */
const BIS_TXT = (c, ab) => `<p>O método da bisseção foi utilizado para determinar o zero da função <b>f(x) = x·e<sup>−x</sup> − ${c}</b> no intervalo inicial <b>[a, b] = ${ab}</b>. A 2ª iteração já foi calculada. Use <b>Er% = |(x<sub>r,atual</sub> − x<sub>r,anterior</sub>) / x<sub>r,atual</sub>| × 100%</b> e o sinal da função para escolher o novo intervalo. N = 15, ε = 0,40%.</p>`;
const CAB_BIS = ['Iter.', 'a', 'b', 'xr', 'f(a)', 'f(b)', 'f(xr)', 'Er%'];
function verde({ id, c, ab, l2, l3, alvo, pede, resposta, alts, passos }) {
  return () => ({
    id, fixa: true, modo: 'mc', tipo: 'texto', fonte: 'Questão 03 · Teste (Bisseção)', resposta,
    html: () => `${BIS_TXT(c, ab)}${tabela(CAB_BIS, [['2ª', ...l2], ['3ª', ...l3.map((v, j) => (j === alvo ? pendente : '·'))]])}<p class="r1-pede">${pede}</p>`,
    alternativas: alts.map(([texto, correta, explicacao]) => ({ texto, correta, explicacao })),
    resolucaoHtml: `<ol>${passos.map((p) => `<li>${p}</li>`).join('')}</ol>${tabela(CAB_BIS, [['2ª', ...l2], ['3ª', ...l3]])}`,
  });
}

/* ---------- azuis: Lagrange (uma letra por casa) ---------- */
const LAG_TXT = `<p>Você é responsável pela engenharia de software do firmware de um relógio inteligente (smartwatch) para atletas. O dispositivo monitora sinais fisiológicos, porém, para economizar bateria, seu sensor opera em um regime de amostragem esparsa, coletando dados apenas em instantes estratégicos.</p>
<p>Para exibir um gráfico contínuo sem carregar modelos complexos de Inteligência Artificial, o processador utiliza <b>interpolação polinomial de Lagrange</b>, calculada localmente por Edge Computing. Durante a calibração, foram coletados os três registros abaixo, em que <b>x</b> é o tempo (s) e <b>f(x)</b> representa a resposta térmica em graus relativos:</p>
${tabela(['x', '0', '1', '2'], [['<b>f(x)</b>', '1,0000', '2,9500', '5,4000']])}
<p>O sistema precisa estimar a resposta térmica no instante <b>x = 1,35 s</b>, para prever aquecimento e acionar o mecanismo de proteção do dispositivo. Como os recursos de hardware são limitados, resolva analiticamente com os polinômios base de Lagrange.</p>`;
const ITENS = ['a) Desenvolva os três polinômios base de Lagrange L₀(x), L₁(x) e L₂(x).', 'b) Determine o polinômio interpolador final P₂(x), simplificado e ordenado por grau.', 'c) Calcule f(1,35) com 4 casas decimais e avalie se a estimativa é coerente com os dados vizinhos.'];
// cada etapa é múltipla escolha (v16.1): a alternativa errada explica o engano mais comum
const op = (rotulo, mostra, opcoes) => ({ rotulo, tipo: 'escolha', mostra, opcoes: opcoes.map(([t, certa]) => [t, certa]), dica: (i) => (opcoes[i] && opcoes[i][2]) || 'Não confere.' });
function azul(letra) {
  const k = 'abc'.indexOf(letra);
  const etapas = [
    [op('L₀(x)', '(x² − 3x + 2)/2', [
      ['(x² + 3x + 2)/2', false, 'Sinal trocado: o numerador é (x − 1)(x − 2) = x² − 3x + 2.'],
      ['(x² − 3x + 2)/2', true],
      ['−(x² − 3x + 2)', false, 'Denominador errado: (0 − 1)(0 − 2) = +2, não −1.'],
      ['x² − 3x + 2', false, 'Faltou dividir por (0 − 1)(0 − 2) = 2. Teste: L₀(0) tem que dar 1.']]),
    op('L₁(x)', '−x² + 2x', [
      ['x² − 2x', false, 'Faltou o sinal do denominador: (1 − 0)(1 − 2) = −1.'],
      ['(x² − 2x)/2', false, 'O denominador é (1 − 0)(1 − 2) = −1, não 2. Teste: L₁(1) tem que dar 1.'],
      ['−x² + 2x', true],
      ['−x² − 2x', false, 'O numerador é (x − 0)(x − 2) = x² − 2x; dividido por −1 dá −x² + 2x.']]),
    op('L₂(x)', '(x² − x)/2', [
      ['(x² − x)/2', true],
      ['x² − x', false, 'Faltou dividir por (2 − 0)(2 − 1) = 2. Teste: L₂(2) tem que dar 1.'],
      ['(x² + x)/2', false, 'Sinal trocado: o numerador é (x − 0)(x − 1) = x² − x.'],
      ['−(x² − x)/2', false, 'O denominador (2 − 0)(2 − 1) = 2 é positivo.']])],
    [op('P₂(x)', '0,25x² + 1,7x + 1', [
      ['2,2x + 1', false, 'Essa é só a reta entre x = 0 e x = 2: com 3 pontos o polinômio é de grau 2.'],
      ['0,25x² + 2,7x + 1', false, 'Confira o termo em x: −1,5 + 5,9 − 2,7 = 1,7. Teste: P₂(1) tem que dar 2,95.'],
      ['1,7x² + 0,25x + 1', false, 'Os coeficientes de x² e de x estão trocados.'],
      ['0,25x² + 1,7x + 1', true]])],
    [op('f(1,35)', '3,7506', [
      ['3,2950', false, 'Faltou o termo 0,25·(1,35)² = 0,455625.'],
      ['3,7506', true],
      ['3,8075', false, 'Essa é a reta entre x = 1 e x = 2; use o P₂(x) da letra b.'],
      ['3,7056', false, 'Confira a conta: 0,455625 + 2,295 + 1 = 3,750625 ≈ 3,7506.']]),
      op('Coerente?', 'sim, fica entre 2,95 e 5,40', [
        ['Sim: fica entre f(1) = 2,95 e f(2) = 5,40', true],
        ['Não: foge dos dados vizinhos', false, '1,35 está entre x = 1 e x = 2; olhe se o valor está entre f(1) e f(2).']])],
  ][k];
  const passos = [
    ['L₀(x) = (x − 1)(x − 2) / ((0 − 1)(0 − 2)) = (x² − 3x + 2)/2.', 'L₁(x) = (x − 0)(x − 2) / ((1 − 0)(1 − 2)) = −x² + 2x.', 'L₂(x) = (x − 0)(x − 1) / ((2 − 0)(2 − 1)) = (x² − x)/2.', 'Conferência: cada Lᵢ vale 1 no seu ponto e 0 nos outros dois.'],
    ['P₂(x) = 1,0000·L₀(x) + 2,9500·L₁(x) + 5,4000·L₂(x).', 'x²: 0,5 − 2,95 + 2,7 = 0,25. x: −1,5 + 5,9 − 2,7 = 1,7. Termo independente: 1.', 'P₂(x) = 0,25x² + 1,7x + 1 (P₂(0) = 1, P₂(1) = 2,95, P₂(2) = 5,40).'],
    ['f(1,35) ≈ P₂(1,35) = 0,25·(1,35)² + 1,7·1,35 + 1 = 0,455625 + 2,295 + 1 = 3,750625 ≈ 3,7506.', 'Coerente: 1,35 está entre x = 1 e x = 2, e 3,7506 está entre f(1) = 2,95 e f(2) = 5,40, mais perto de 2,95, como 1,35 está mais perto de 1.'],
  ][k];
  return () => ({
    id: `r1-lagrange-${letra}`, fixa: true, modo: 'etapas', tipo: 'etapas', fonte: `Questão 01 · Teste (Interpolação de Lagrange) · letra ${letra}`,
    resposta: etapas.map((e) => `${e.rotulo} = ${e.mostra}`).join('; '),
    ajuda: ['Escolha um polinômio de cada vez: L₀, depois L₁ e L₂. Teste cada um em x = 0, 1 e 2.', 'Monte 1·L₀ + 2,95·L₁ + 5,4·L₂ e confira nos três pontos.', 'Calcule P₂(1,35) com P₂(x) = 0,25x² + 1,7x + 1 e depois diga se é coerente.'][k],
    html: () => `${LAG_TXT}<ul class="r1-itens"><li class="agora">${ITENS[k]}</li></ul>`,
    etapas, passo: 0, log: [],
    resolucaoHtml: `<ol>${passos.map((p) => `<li>${p}</li>`).join('')}</ol>`,
  });
}

/* ---------- vermelhas: Gauss-Seidel, 1ª iteração ---------- */
const SUB = ['₁', '₂', '₃', '₄'];
const r4 = (v) => Math.sign(v) * Math.round(Math.abs(v) * 1e4 * (1 + 1e-12)) / 1e4;
function equacao(lin, bi) { let t = ''; lin.forEach((c, j) => { if (!c) return; const m = Math.abs(c) === 1 ? '' : Math.abs(c); t += (t ? (c < 0 ? ' − ' : ' + ') : c < 0 ? '−' : '') + m + 'x' + SUB[j]; }); return t + ' = ' + String(bi).replace('-', '−'); }
export function seidel1(A, b) {
  const x = [0, 0, 0, 0], passos = [];
  for (let i = 0; i < 4; i++) {
    let s = b[i]; const termos = [];
    for (let j = 0; j < 4; j++) { if (j === i || !A[i][j]) continue; s -= A[i][j] * x[j]; termos.push(`${A[i][j] < 0 ? ' + ' : ' − '}${Math.abs(A[i][j]) === 1 ? '' : Math.abs(A[i][j]) + '·'}${x[j] < 0 ? `(${br(x[j], 4)})` : br(x[j], 4)}`); }
    const bruto = s / A[i][i]; x[i] = r4(bruto);
    passos.push(`x${SUB[i]}⁽¹⁾ = (${String(b[i]).replace('-', '−')}${termos.join('')}) / ${A[i][i]} = ${br(s, 4)} / ${A[i][i]} = ${br(bruto, 6)} ≈ <b>${br(x[i], 4)}</b>`);
  }
  return { x, passos };
}
function vermelha(id, A, b) {
  const sol = seidel1(A, b);
  const etapas = sol.x.map((v, i) => ({ rotulo: `x${SUB[i]}⁽¹⁾`, tipo: 'num', alvo: v, tol: 1.0001e-4, mostra: br(v, 4), dica: (n) => {
    const jac = r4(b[i] / A[i][i]);
    if (i > 0 && Math.abs(n - jac) < 2e-4) return 'Esse é o valor com os zeros (Jacobi). No Gauss-Seidel, use os x novos assim que eles saem.';
    if (Math.abs(n - v) < 1e-3) return 'Quase: confira o arredondamento para 4 casas.';
    return `x${SUB[i]} não confere.`;
  } }));
  return () => ({
    id, fixa: true, modo: 'etapas', tipo: 'etapas', fonte: 'Teste · Gauss-Seidel (adaptada: só a 1ª iteração)', semFormula: true,
    resposta: `X⁽¹⁾ = (${sol.x.map((v) => br(v, 4)).join('; ')})`,
    ajuda: 'Um x de cada vez, com 4 casas (pode digitar a conta, ex.: 14/9).',
    html: (q) => `<div class="r1-sis">${A.map((l, i) => equacao(l, b[i])).join('<br>')}</div>
      <p><b>Determine a solução aproximada após a primeira iteração, utilizando o método de Gauss-Seidel.</b> Considere a estimativa inicial X⁽⁰⁾ = (0, 0, 0, 0)ᵀ. <b>Arredonde cada valor calculado de x para 4 casas decimais antes de usá-lo nas próximas substituições.</b></p>
      ${tabela(['Iteração', 'x₁', 'x₂', 'x₃', 'x₄'], [['0', '0,0000', '0,0000', '0,0000', '0,0000'], ['1', ...sol.x.map((v, i) => (q.final || i < q.passo ? `<b class="r1-ok">${br(v, 4)}</b>` : i === q.passo ? pendente : '·'))]])}`,
    etapas, passo: 0, log: [],
    resolucaoHtml: `<ol>${sol.passos.map((p) => `<li>${p}</li>`).join('')}</ol><p>X⁽¹⁾ = (${sol.x.map((v) => br(v, 4)).join('; ')})</p>`,
  });
}

/* ---------- chefão do Silo: Bisseção, quando parar? ---------- */
const BF = (x) => x * Math.exp(-x) - 0.2;
export const CHEFE_R1 = (() => { let a = 2.5, b = 2.75, prev = 2.625; const L = []; for (let k = 3; k <= 8; k++) { if (BF(a) * BF(prev) > 0) a = prev; else b = prev; const x = (a + b) / 2; L.push({ k, a, b, x, fa: BF(a), fb: BF(b), fx: BF(x), er: Math.abs((x - prev) / x) * 100 }); prev = x; } return { eps: 0.8, linhas: L, raiz: L.find((l) => l.er < 0.8) }; })();
function chefe() {
  const C = CHEFE_R1, R = C.raiz, pct = (v) => v.toFixed(2).replace('.', ',') + '%';
  return () => ({
    id: 'r1-chefe-bissecao', fixa: true, modo: 'etapas', tipo: 'etapas', fonte: 'Questão 01 · Teste (Bisseção, adaptada)',
    resposta: `x ≈ ${br(R.x, 6)} (para na ${R.k}ª iteração: Er% = ${pct(R.er)} < 0,80%)`,
    ajuda: 'Faça as iterações no papel e digite só o x final, com 6 casas.',
    html: (q) => `<p>O método da bisseção foi utilizado para determinar o zero da função <b>f(x) = x·e<sup>−x</sup> − 0,200</b> no intervalo inicial <b>[a, b] = [2,25; 2,75]</b>.</p>
      <p>Sabendo que a <b>2ª iteração</b> já foi calculada, continue os cálculos a partir da <b>3ª iteração</b> e determine o erro relativo percentual após cada etapa (teste de parada). Considere o número máximo de iterações <b>N = 15</b> e a tolerância <b>ε = 8 × 10<sup>−1</sup>% = 0,80%</b>.</p>
      <p>Utilize Er% = |(x<sub>r,atual</sub> − x<sub>r,anterior</sub>) / x<sub>r,atual</sub>| × 100%. O sinal da função deve ser empregado para selecionar o novo intervalo após cada iteração.</p>
      ${tabela(CAB_BIS, [['2ª', '2,500000', '2,750000', '2,625000', '0,005212', '−0,024198', '−0,009846', '4,76%'], ...(q.final ? C.linhas.filter((l) => l.k <= R.k).map((l) => [`${l.k}ª`, br(l.a, 6), br(l.b, 6), br(l.x, 6), br(l.fa, 6), br(l.fb, 6), br(l.fx, 6), pct(l.er)]) : [['3ª', '…', '…', '…', '…', '…', '…', '…']])])}
      <p class="r1-pede">Qual é a raiz aproximada, o xr da iteração em que o método para?</p>`,
    etapas: [{ rotulo: 'x final', tipo: 'num', alvo: R.x, tol: 1.01e-6, mostra: br(R.x, 6), dica: (n) => {
      const L = C.linhas.find((l) => Math.abs(n - l.x) <= 1.01e-6);
      if (L && L.k < R.k) return `Parou cedo: na ${L.k}ª o Er% (${pct(L.er)}) ainda é maior que ε = 0,80%.`;
      if (L && L.k > R.k) return `Passou do ponto: na ${R.k}ª o Er% já era ${pct(R.er)} < 0,80%.`;
      if (Math.abs(n - 2.625) < 1e-6) return 'Esse é o xr da 2ª, que já veio dado.';
      if (Math.abs(n - R.x) < 1e-3) return 'Quase: confira as 6 casas.';
      return 'Não confere: refaça as iterações olhando o sinal de f(xr).';
    } }],
    passo: 0, log: [],
    resolucaoHtml: `<ol>${C.linhas.filter((l) => l.k <= R.k).map((l) => `<li>${l.k}ª: [a, b] = [${br(l.a, 6)}; ${br(l.b, 6)}], xr = ${br(l.x, 6)}, f(xr) = ${br(l.fx, 6)}, Er% = ${pct(l.er)} ${l.er < C.eps ? '&lt; 0,80% → <b>para</b>' : '&gt; 0,80% → continua'}.</li>`).join('')}<li>Raiz aproximada: <b>x ≈ ${br(R.x, 6)}</b>, na ${R.k}ª iteração.</li></ol>`,
  });
}

/* ---------- as 10 perguntas ---------- */
const FABRICAS = {
  'C0.2-F': verde({ id: 'r1-bis-xmedio', c: '0,180', ab: '[2,5; 3]', l2: ['2,500000', '2,750000', '2,625000', '0,025212', '−0,004198', '0,010154', '4,76%'], l3: ['2,625000', '2,750000', '2,687500', '0,010154', '−0,004198', '0,002887', '2,33%'], alvo: 2,
    pede: 'Calcule o x médio (xr) da 3ª iteração.', resposta: '2,687500',
    alts: [['2,562500', false, 'Esse é o meio de [2,5; 2,625]: metade errada. Como f(xr) = 0,010154 tem o mesmo sinal de f(a), o a vira 2,625.'], ['2,687500', true, ''], ['2,625000', false, 'Esse é o xr da 2ª iteração; a 3ª começa no novo intervalo [2,625; 2,75].'], ['2,750000', false, 'Esse é o b do intervalo, não o ponto médio.']],
    passos: ['Na 2ª iteração, f(a) = 0,025212 e f(xr) = 0,010154 têm o mesmo sinal (+): a raiz não está em [a, xr].', 'O novo intervalo é [xr, b] = [2,625; 2,75]: o a vira 2,625 e o b continua 2,75.', 'x médio da 3ª: xr = (2,625 + 2,75)/2 = <b>2,687500</b>.'] }),
  'C0.1-F': verde({ id: 'r1-bis-fxmedio', c: '0,220', ab: '[2; 2,5]', l2: ['2,250000', '2,500000', '2,375000', '0,017148', '−0,014788', '0,000909', '5,26%'], l3: ['2,375000', '2,500000', '2,437500', '0,000909', '−0,014788', '−0,007014', '2,56%'], alvo: 5,
    pede: 'Calcule f(xr), o valor da função no x médio da 3ª iteração.', resposta: '−0,007014',
    alts: [['−0,014788', false, 'Esse é o f(b) = f(2,5); o pedido é f no ponto médio 2,4375.'], ['0,007014', false, 'O valor está certo, mas o sinal não: 2,4375·e^(−2,4375) = 0,212986, que é menor que 0,220.'], ['0,000909', false, 'Esse é o f(xr) da 2ª iteração; a 3ª tem um novo xr = 2,4375.'], ['−0,007014', true, '']],
    passos: ['Na 2ª iteração, f(a) = 0,017148 e f(xr) = 0,000909 têm o mesmo sinal (+): o novo intervalo é [2,375; 2,5].', 'x médio da 3ª: xr = (2,375 + 2,5)/2 = 2,437500.', 'f(xr) = 2,4375·e<sup>−2,4375</sup> − 0,220 = 0,212986 − 0,220 = <b>−0,007014</b>.'] }),
  'C0.3-F': verde({ id: 'r1-bis-erro', c: '0,250', ab: '[1,95; 2,45]', l2: ['1,950000', '2,200000', '2,075000', '0,027434', '−0,006233', '0,010530', '6,02%'], l3: ['2,075000', '2,200000', '2,137500', '0,010530', '−0,006233', '0,002117', '2,92%'], alvo: 6,
    pede: 'Calcule o erro relativo percentual (Er%) da 3ª iteração.', resposta: '2,92%',
    alts: [['3,01%', false, 'Você dividiu pelo x anterior (2,075). A fórmula divide pelo x atual: 2,1375.'], ['6,25%', false, 'Faltou dividir pelo x atual: |2,1375 − 2,075| × 100 = 6,25.'], ['2,92%', true, ''], ['6,02%', false, 'Esse é o Er% da 2ª iteração, que já veio na tabela.']],
    passos: ['Na 2ª iteração, f(a) = 0,027434 e f(xr) = 0,010530 têm o mesmo sinal (+): o novo intervalo é [2,075; 2,2].', 'x médio da 3ª: xr = (2,075 + 2,2)/2 = 2,137500.', 'Er% = |(2,1375 − 2,075) / 2,1375| × 100% = (0,0625 / 2,1375) × 100% = <b>2,92%</b>, ainda maior que 0,40%.'] }),
  'C0.2-M': azul('a'), 'C0.1-M': azul('b'), 'C0.3-M': azul('c'),
  'C0.2-D': vermelha('r1-seidel-cancelamento', [[9, 1, -1, 1], [2, 10, 1, -1], [-1, 2, 11, 1], [1, -1, 2, 12]], [14, 19, -6, 21]),
  'C0.1-D': vermelha('r1-seidel-padaria', [[10, -1, 2, 0], [1, 9, -1, 2], [2, 1, 11, -1], [-1, 2, 1, 10]], [23, -2, 11, 27]),
  'C0.3-D': vermelha('r1-seidel-galinheiro', [[8, 1, 1, -1], [1, 11, -2, 1], [2, -1, 10, 1], [-1, 1, 2, 9]], [14, 16, 29, -2]),
  B0: chefe(),
};
// uma pergunta nova (com estado limpo) para a casa, ou null fora da região 1
export function perguntaFixa(sid, nivel) { const f = FABRICAS[nivel === 'B' ? sid : `${sid}-${nivel}`]; return f ? f() : null; }
export const CHAVES_FIXAS = Object.keys(FABRICAS);
