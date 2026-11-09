#!/usr/bin/env node
/* Confere o banco de questões (banco-de-questoes/questoes.sql):
   1. dist/dados/banco-de-questoes.js está em dia com o .sql (e o leitor simples lê igual ao SQLite);
   2. cada resposta é refeita pelo resolvedor do site a partir dos "parametros" e bate com a gravada;
   3. quando o gabarito da lista não bate com a conta, existe uma observação explicando;
   4. alternativas: 4 por questão (menos as de programação), exatamente 1 correta, textos diferentes;
   5. referências (lista, tema, origem) válidas e nada de LaTeX.
   Uso: node tests/banco/conferir-banco.cjs */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '../..');
const G = require(path.join(RAIZ, 'banco-de-questoes/gerar-arquivo-do-site.cjs'));
const falhas = [];
const falha = (m) => { falhas.push(m); };

// 1. arquivo do site em dia
const banco = G.lerBanco(), objeto = G.montarObjeto(banco), texto = G.gerarTexto(objeto);
const noSite = fs.readFileSync(G.SAIDA, 'utf8').replace(/\r\n/g, '\n');
if (noSite !== texto) falha('dist/dados/banco-de-questoes.js desatualizado: rode "npm run banco".');
const simples = G.gerarTexto(G.montarObjeto(G.lerBanco({ semSqlite: true })));
if (simples !== texto) falha('O leitor simples de INSERTs leu o questoes.sql diferente do SQLite.');

// 2. resolvedor do site
const ctx = { console, Math, Number, String, JSON, Array, Object, Error, RegExp, Set, Map, isFinite, parseFloat };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['js/motor/motor-numerico.js', 'js/motor/passo-a-passo.js', 'js/motor/resolver-questoes.js']) vm.runInContext(fs.readFileSync(path.join(RAIZ, 'dist', f), 'utf8'), ctx, { filename: f });
vm.runInContext(noSite, ctx, { filename: 'banco-de-questoes.js' });
const R = ctx.NumeraResolver, B = ctx.NumeraBanco;
const perto = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const limpa = (v) => (Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(12)));
const linhasSql = Object.fromEntries(banco.t.questoes.map((q) => [q.id, q]));
const ids = new Set(B.questoes.map((q) => q.id)), listas = new Set(B.listas.map((l) => l.id)), temas = new Set(B.temas.map((t) => t.id));
let conferidas = 0;
for (const q of B.questoes) {
  const onde = `[${q.id}]`;
  if (!listas.has(q.lista)) falha(`${onde} lista inexistente ${q.lista}`);
  if (!temas.has(q.tema)) falha(`${onde} tema inexistente ${q.tema}`);
  if (q.origem && !ids.has(q.origem)) falha(`${onde} origem inexistente ${q.origem}`);
  let r;
  try { r = R.resolver(q.parametros); } catch (e) { falha(`${onde} o resolvedor falhou: ${e.message}`); continue; }
  if (q.tipo === 'numero' && !(r.valor != null && perto(limpa(r.valor), q.valor))) falha(`${onde} valor gravado ${q.valor}, conta ${r.valor}`);
  if (q.vetor && !(r.vetor && r.vetor.length === q.vetor.length && r.vetor.every((v, i) => perto(limpa(v), q.vetor[i])))) falha(`${onde} vetor gravado ${JSON.stringify(q.vetor)}, conta ${JSON.stringify(r.vetor)}`);
  if (q.matriz && JSON.stringify(q.matriz) !== JSON.stringify(r.matriz, (k, v) => (typeof v === 'number' ? limpa(v) : v))) falha(`${onde} matriz gravada não confere com a conta`);
  const resol = linhasSql[q.id].resolucao, esperado = ((r.resumo || '') + (r.tabela && r.tabela.linhas.length && r.tabela.linhas.length <= 16 ? '\n' + r.tabela.colunas.join(' | ') + '\n' + r.tabela.linhas.map((l) => l.join(' | ')).join('\n') : '')).trim();
  if (resol !== esperado) falha(`${onde} a resolução gravada difere da que o resolvedor mostra no site`);
  if (q.tipo === 'numero' && !R.confere(q, q.valor)) falha(`${onde} confere() recusa a própria resposta`);
  // 3. gabarito da lista
  if (q.diverge && !q.observacao) falha(`${onde} gabarito da lista diverge sem observação`);
  if (q.valorLista != null && q.valor != null) { const tol = q.tolerancia != null ? q.tolerancia : 0.6 * Math.pow(10, -(q.casas ?? 4)); if (Math.abs(q.valor - q.valorLista) > tol * (1 + 1e-9) && !q.diverge) falha(`${onde} diverge do gabarito da lista mas não está marcada`); }
  // 4. alternativas
  if (q.tipo !== 'programa') {
    const a = q.alternativas;
    if (a.length !== 4) falha(`${onde} ${a.length} alternativas`);
    if (a.filter((x) => x.correta).length !== 1) falha(`${onde} precisa de exatamente 1 alternativa correta`);
    if (new Set(a.map((x) => x.texto)).size !== a.length) falha(`${onde} alternativas repetidas`);
    if (a.map((x) => x.letra).join('') !== 'ABCD') falha(`${onde} letras fora de ordem`);
    const certa = a.find((x) => x.correta);
    if (certa && q.tipo !== 'texto' && certa.texto !== q.resposta) falha(`${onde} a alternativa correta não é a resposta`);
    if (a.some((x) => !x.correta && !x.explicacao)) falha(`${onde} alternativa errada sem explicação`);
  }
  // 5. casa da Calculândia e número de iterações
  if (!['verde', 'azul', 'vermelha'].includes(q.casa)) falha(`${onde} casa inválida ${q.casa}`);
  if (q.casa === 'verde' && q.tipo !== 'programa' && q.alternativas.length !== 4) falha(`${onde} casa verde sem alternativas`);
  const its = r.run && Number.isFinite(r.run.iteracoes) ? r.run.iteracoes : r.linhas && r.linhas.length > 1 ? r.linhas.length - 1 : undefined;
  if (q.iteracoes !== its) falha(`${onde} iterações gravadas ${q.iteracoes}, conta ${its}`);
  // 6. sem LaTeX
  if (/\\(frac|sqrt|cdot|left|right|begin|mathrm)|\$/.test(JSON.stringify(q))) falha(`${onde} tem LaTeX`);
  conferidas++;
}
const rapidas = B.questoes.filter((q) => q.rapida).length;
for (const t of B.temas) if (!B.questoes.some((q) => q.tema === t.id)) falha(`tema ${t.id} sem questões`);
// a Calculândia precisa de pergunta verde para cada método com tema no banco, e de questões azuis dos Testes
for (const t of B.temas) if (!B.questoes.some((q) => q.tema === t.id && q.casa === 'verde') && !B.temas.some((u) => u.regiao === t.regiao && B.questoes.some((q) => q.tema === u.id && q.casa === 'verde'))) falha(`método ${t.regiao} sem pergunta para a casa verde`);
for (let k = 1; k <= 6; k++) if (!B.questoes.some((q) => q.lista === `teste-${k}` && q.casa === 'azul' && q.iteracoes != null && q.iteracoes <= 4)) falha(`Teste ${k} sem versão de até 4 iterações para a casa azul`);
if (falhas.length) { console.error(falhas.join('\n')); console.error(`\nBANCO: ${falhas.length} problema(s).`); process.exit(1); }
console.log(`Banco de questões: ${conferidas} questões conferidas pelo resolvedor (${rapidas} rápidas, ${B.questoes.filter((q) => q.diverge).length} com gabarito da lista divergente e explicado).`);
