// Deixa os números "oficiais" em dia antes de publicar:
// 1) VERIFY_COUNT em dist/app.js (o número de verificações mostrado no site);
// 2) a VERSION do service worker (cache offline), que depende do conteúdo dos arquivos.
// Uso: node tests/atualizar.cjs
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), app = path.join(root, 'dist/app.js');
const run = () => spawnSync(process.execPath, [path.join(__dirname, 'verify.cjs')], { encoding: 'utf8' });
const sw = () => spawnSync(process.execPath, [path.join(__dirname, 'pwa/atualizar-sw.cjs')], { encoding: 'utf8' }).stdout.trim();
for (let i = 0; i < 3; i++) {
  console.log(sw());
  const r = run(), out = r.stdout + r.stderr;
  if (r.status === 0) { const n = JSON.parse(r.stdout).checks; console.log(`verify.cjs: PASS com ${n} verificações`); process.exit(0); }
  const m = /o total real é (\d+)/.exec(out);
  if (!m) { console.error(out.split('\n').filter(l => /Error/.test(l)).join('\n')); process.exit(1); }
  fs.writeFileSync(app, fs.readFileSync(app, 'utf8').replace(/const VERIFY_COUNT=\d+;/, `const VERIFY_COUNT=${m[1]};`));
  console.log('VERIFY_COUNT →', m[1]);
}
process.exit(1);
