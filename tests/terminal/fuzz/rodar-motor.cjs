// Roda a busca automática (smartRoot) do motor em cada caso, sem navegador.
// Uso: node rodar-motor.cjs ../../../dist/math-engine.js polinomios-1000.json resultados-polinomios-v7.json
const fs = require('fs'), vm = require('vm');
const [,, engine, casesFile, outFile] = process.argv;
const ctx = { window: {}, Math, Number, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(engine, 'utf8'), ctx); const M = ctx.window.NumeraMath;
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8')), out = []; const t0 = Date.now(); let worst = 0;
for (const c of cases) {
  const t = Date.now(); let roots = null, error = null;
  try { roots = M.smartRoot(c.src, { tolerance: 1e-6, maxIterations: 100, min: -40, max: 40 }).roots.map(r => r.root); } catch (e) { error = e.message; }
  worst = Math.max(worst, Date.now() - t); out.push({ id: c.id, roots, error });
}
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(`${cases.length} casos em ${Date.now() - t0} ms; pior caso ${worst} ms`);
