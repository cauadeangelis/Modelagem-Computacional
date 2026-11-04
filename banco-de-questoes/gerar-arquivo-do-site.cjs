#!/usr/bin/env node
/* Gera dist/dados/banco-de-questoes.js a partir de banco-de-questoes/questoes.sql.
   O site e os jogos não leem SQL direto (é um site estático); leem este arquivo JavaScript, que é só uma
   "fotografia" do banco. Sempre que mudar o questoes.sql, rode:
       npm run banco            (ou: node banco-de-questoes/gerar-arquivo-do-site.cjs)
   Para só conferir se o arquivo do site está em dia (usado nos testes):
       node banco-de-questoes/gerar-arquivo-do-site.cjs --conferir
   Funciona em qualquer Node ≥ 18: usa o SQLite embutido do Node (node:sqlite) quando existe e, se não existir,
   lê os INSERTs do arquivo com um leitor simples (o questoes.sql só tem CREATE TABLE e INSERT). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const RAIZ = path.join(__dirname, '..');
const SQL = path.join(__dirname, 'questoes.sql');
const SAIDA = path.join(RAIZ, 'dist/dados/banco-de-questoes.js');

/* ---------- leitura ---------- */
// Leitor dos INSERTs: separa os comandos por ';' fora de aspas e lê os valores ('texto', números e NULL).
function lerInserts(texto) {
  const tabelas = {};
  let i = 0;
  const n = texto.length;
  while (i < n) {
    // pula espaços e comentários
    if (texto.startsWith('--', i)) { i = texto.indexOf('\n', i); if (i < 0) break; continue; }
    if (/\s/.test(texto[i])) { i++; continue; }
    // lê um comando até o ';' fora de aspas
    let j = i, aspas = false;
    while (j < n) { const c = texto[j]; if (c === "'") { if (aspas && texto[j + 1] === "'") { j += 2; continue; } aspas = !aspas; } else if (c === ';' && !aspas) break; j++; }
    const cmd = texto.slice(i, j).trim();
    i = j + 1;
    const m = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \(/.exec(cmd);
    if (!m) continue;
    const cols = m[2].split(',').map((s) => s.trim()), vals = [];
    let k = m[0].length;
    while (k < cmd.length) {
      const c = cmd[k];
      if (c === ' ' || c === ',' || c === '\n') { k++; continue; }
      if (c === ')') break;
      if (c === "'") { let s = ''; k++; for (;;) { if (cmd[k] === "'") { if (cmd[k + 1] === "'") { s += "'"; k += 2; continue; } k++; break; } s += cmd[k++]; } vals.push(s); continue; }
      const t = /^(NULL|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i.exec(cmd.slice(k));
      if (!t) throw new Error('Valor inesperado no INSERT de ' + m[1] + ': ' + cmd.slice(k, k + 40));
      vals.push(/^NULL$/i.test(t[1]) ? null : Number(t[1])); k += t[1].length;
    }
    if (vals.length !== cols.length) throw new Error(`INSERT de ${m[1]} com ${vals.length} valores para ${cols.length} colunas`);
    (tabelas[m[1]] = tabelas[m[1]] || []).push(Object.fromEntries(cols.map((c2, x) => [c2, vals[x]])));
  }
  return tabelas;
}
function lerComSqlite(texto) {
  let sqlite;
  try { const aviso = process.emitWarning; process.emitWarning = () => {}; sqlite = require('node:sqlite'); process.emitWarning = aviso; } catch (e) { return null; }
  const db = new sqlite.DatabaseSync(':memory:');
  db.exec(texto);
  const tudo = (t, ordem) => db.prepare(`SELECT * FROM ${t} ORDER BY ${ordem}`).all().map((r) => Object.assign({}, r));
  return { sobre: tudo('sobre', 'rowid'), listas: tudo('listas', 'ordem'), temas: tudo('temas', 'ordem'), questoes: tudo('questoes', 'rowid'), alternativas: tudo('alternativas', 'rowid') };
}
function lerBanco(opcoes = {}) {
  const texto = fs.readFileSync(SQL, 'utf8');
  const t = (!opcoes.semSqlite && lerComSqlite(texto)) || lerInserts(texto);
  return { texto, t };
}

/* ---------- objeto do site ---------- */
function montarObjeto({ texto, t }) {
  const hash = crypto.createHash('sha256').update(texto.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
  const sobre = Object.fromEntries((t.sobre || []).map((r) => [r.chave, r.valor]));
  const alts = {};
  for (const a of t.alternativas || []) (alts[a.questao_id] = alts[a.questao_id] || []).push({ letra: a.letra, texto: a.texto, correta: a.correta === 1, explicacao: a.explicacao || undefined });
  const json = (s) => (s == null ? undefined : JSON.parse(s));
  const semVazios = (o) => JSON.parse(JSON.stringify(o));
  const questoes = t.questoes.map((q) => semVazios({
    id: q.id, lista: q.lista_id, numero: q.numero, secao: q.secao || undefined, tema: q.tema_id, dificuldade: q.dificuldade, tipo: q.tipo,
    rapida: q.rapida === 1 || undefined, origem: q.origem_id || undefined, enunciado: q.enunciado, gabaritoLista: q.gabarito_lista || undefined,
    resposta: q.resposta, valor: q.valor ?? undefined, valorLista: q.valor_lista ?? undefined, vetor: json(q.vetor), vetorLista: json(q.vetor_lista), matriz: json(q.matriz),
    casas: q.casas ?? undefined, tolerancia: q.tolerancia ?? undefined, parametros: json(q.parametros), observacao: q.observacao || undefined, diverge: q.diverge === 1 || undefined,
    alternativas: (alts[q.id] || []).sort((a, b) => a.letra.localeCompare(b.letra)),
  }));
  return {
    versao: sobre.versao || '1', hash,
    listas: [...t.listas].sort((a, b) => a.ordem - b.ordem).map((l) => ({ id: l.id, titulo: l.titulo, instituicao: l.instituicao, assunto: l.assunto, temGabarito: l.tem_gabarito === 1 })),
    temas: [...t.temas].sort((a, b) => a.ordem - b.ordem).map((x) => semVazios({ id: x.id, nome: x.nome, licao: x.licao_do_site || undefined, regiao: x.regiao_calculandia })),
    questoes,
  };
}
function gerarTexto(obj) {
  const { questoes, ...resto } = obj;
  const cab = JSON.stringify(resto).slice(0, -1);
  return `/* GERADO por banco-de-questoes/gerar-arquivo-do-site.cjs a partir de banco-de-questoes/questoes.sql.
   Não edite à mão: edite o questoes.sql e rode "npm run banco". ${questoes.length} questões. */
window.NumeraBanco = ${cab},"questoes":[
${questoes.map((q) => JSON.stringify(q)).join(',\n')}
]};
`;
}

module.exports = { lerInserts, lerComSqlite, lerBanco, montarObjeto, gerarTexto, SQL, SAIDA };

if (require.main === module) {
  const texto = gerarTexto(montarObjeto(lerBanco()));
  if (process.argv.includes('--conferir')) {
    const atual = fs.existsSync(SAIDA) ? fs.readFileSync(SAIDA, 'utf8').replace(/\r\n/g, '\n') : '';
    if (atual !== texto) { console.error('dist/dados/banco-de-questoes.js está desatualizado: rode "npm run banco".'); process.exit(1); }
    console.log('banco-de-questoes.js em dia com o questoes.sql');
  } else {
    fs.writeFileSync(SAIDA, texto);
    console.log(`Gerado ${path.relative(RAIZ, SAIDA)} (${(texto.length / 1024).toFixed(0)} KB) a partir do questoes.sql`);
  }
}
