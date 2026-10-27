// Compatibilidade com navegadores mais antigos (alvo: Chrome/Edge 90+, Firefox 90+, Safari 15+ / iOS 15+).
// 1) Cada .js precisa ser JavaScript ES2021 válido (o que o Safari 15 entende), verificado com o parser acorn.
// 2) Recursos que esses navegadores NÃO têm são proibidos (ex.: lookbehind em regex só existe no Safari 16.4+).
// 3) Recursos de CSS recentes só podem aparecer como melhoria progressiva (sem eles, a página continua usável).
// Uso: node checar-compat.mjs
import fs from 'node:fs'; import path from 'node:path'; import { parse } from 'acorn';
const dist = path.join(path.dirname(new URL(import.meta.url).pathname), '../../dist');
let n = 0; const falhas = [];
const ok = (c, m) => { n++; if (!c) { falhas.push(m); console.log('  FALHOU:', m); } };
const PROIBIDO_JS = [[/\(\?<[=!]/, 'lookbehind em regex (Safari < 16.4)'], [/\.at\(/, 'Array.prototype.at (Safari < 15.4)'], [/structuredClone\(/, 'structuredClone (Safari < 15.4)'],
  [/Object\.hasOwn\(/, 'Object.hasOwn (Safari < 15.4)'], [/\.findLast(Index)?\(/, 'findLast (Firefox < 104)'], [/\.(toSorted|toReversed|toSpliced|with)\(/, 'métodos de cópia de array (2023)'], [/\bstatic\s*\{/, 'bloco static em classe']];
for (const f of fs.readdirSync(dist).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(dist, f), 'utf8');
  let err = null; try { parse(src, { ecmaVersion: 2021, sourceType: 'script' }); } catch (e) { err = e.message; }
  ok(!err, `${f}: JavaScript ES2021 válido ${err || ''}`);
  for (const [re, nome] of PROIBIDO_JS) ok(!re.test(src), `${f}: sem ${nome}`);
}
// CSS: recursos recentes permitidos apenas nas regras listadas (melhorias progressivas).
const PROGRESSIVO = { ':has(': ['calculator.css'], 'text-wrap': ['styles.css'], 'aspect-ratio': ['treino.css', 'styles.css'] };
const PROIBIDO_CSS = ['@container', 'color-mix(', '@layer', 'subgrid', '@scope', 'anchor-name'];
for (const f of fs.readdirSync(dist).filter(f => f.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(dist, f), 'utf8');
  for (const p of PROIBIDO_CSS) ok(!css.includes(p), `${f}: sem ${p}`);
  for (const [p, onde] of Object.entries(PROGRESSIVO)) if (css.includes(p)) ok(onde.includes(f), `${f}: ${p} só como melhoria progressiva`);
}
// v12: os jogos.
// Quem Divergiu? segue a mesma regra do site (scripts clássicos ES2021, Safari 15+).
const qd = path.join(dist, 'jogos/quem-divergiu');
for (const f of fs.readdirSync(qd).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(qd, f), 'utf8');
  let err = null; try { parse(src, { ecmaVersion: 2021, sourceType: 'script' }); } catch (e) { err = e.message; }
  ok(!err, `quem-divergiu/${f}: JavaScript ES2021 válido ${err || ''}`);
  for (const [re, nome] of PROIBIDO_JS) ok(!re.test(src), `quem-divergiu/${f}: sem ${nome}`);
}
{ const css = fs.readFileSync(path.join(qd, 'qd.css'), 'utf8'); for (const p of PROIBIDO_CSS) ok(!css.includes(p), `qd.css: sem ${p}`); ok(!/[^-]backdrop-filter/.test(css.replace(/-webkit-backdrop-filter:[^;]+;backdrop-filter/g, '')), 'qd.css: backdrop-filter com o prefixo do Safari'); }
// Calculândia: módulos ES (3D com Three.js e WebGL 2). Ela usa Array.prototype.at e structuredClone, então o mínimo dela é
// Chrome/Edge 98+, Firefox 94+ e Safari 15.4+ (declarado no README); o resto da lista continua proibido.
const calc = path.join(dist, 'jogos/calculandia/src'), walk = d => fs.readdirSync(d).flatMap(f => fs.statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]);
const PROIBIDO_CALC = PROIBIDO_JS.filter(([, nome]) => !/Array\.prototype\.at|structuredClone/.test(nome));
for (const f of walk(calc).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(f, 'utf8'), rel = path.relative(dist, f);
  let err = null; try { parse(src, { ecmaVersion: 2022, sourceType: 'module' }); } catch (e) { err = e.message; }
  ok(!err, `${rel}: módulo ES válido ${err || ''}`);
  for (const [re, nome] of PROIBIDO_CALC) ok(!re.test(src), `${rel}: sem ${nome}`);
  ok(!/from\s+['"]https?:/.test(src), `${rel}: nada importado de fora do site`);
}
console.log(`Compatibilidade: ${n - falhas.length}/${n} verificações`);
process.exit(falhas.length ? 1 : 0);
