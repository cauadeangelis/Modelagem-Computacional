// Recalcula a VERSION do service worker a partir do conteúdo dos arquivos listados em ASSETS.
// Uso: node tests/pwa/atualizar-sw.cjs        (atualiza dist/sw.js)
//      node tests/pwa/atualizar-sw.cjs --check (só confere; sai com erro se estiver desatualizada)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dist = path.join(__dirname, '../../dist'), swPath = path.join(dist, 'sw.js');
function expected() {
  const sw = fs.readFileSync(swPath, 'utf8');
  const assets = JSON.parse(sw.match(/const ASSETS = (\[[^\]]*\]);/)[1].replace(/'/g, '"'));
  const h = crypto.createHash('sha256');
  for (const a of assets) { if (a === './') continue; h.update(a); h.update(fs.readFileSync(path.join(dist, a))); }
  return { sw, assets, version: 'numera-v12-' + h.digest('hex').slice(0, 10) };
}
module.exports = expected;
if (require.main === module) {
  const { sw, version } = expected(), cur = sw.match(/const VERSION = '([^']+)'/)[1];
  if (process.argv.includes('--check')) { if (cur !== version) { console.error(`sw.js desatualizado: ${cur} ≠ ${version}. Rode node tests/pwa/atualizar-sw.cjs`); process.exit(1); } console.log('sw.js em dia:', version); }
  else { fs.writeFileSync(swPath, sw.replace(/const VERSION = '[^']+'/, `const VERSION = '${version}'`)); console.log('sw.js →', version); }
}
