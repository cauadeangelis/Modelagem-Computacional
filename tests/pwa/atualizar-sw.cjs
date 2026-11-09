// Mantém o service worker (dist/sw.js) em dia sozinho:
//  1) ASSETS: a lista de arquivos guardados para funcionar offline é montada a partir das pastas do site
//     (tudo em dist/, menos o próprio sw.js, licenças, arquivos ocultos e a Calculândia, que é guardada
//     na primeira vez que abre);
//  2) VERSION: um resumo (hash) do conteúdo desses arquivos. Mudou um arquivo, muda a versão e o cache é refeito.
// As quebras de linha são normalizadas (CRLF → LF) nos arquivos de texto: no Windows o Git costuma trocar LF por
// CRLF ao baixar, e sem isso a versão calculada lá seria diferente da calculada no Linux/Mac.
// Uso: node tests/pwa/atualizar-sw.cjs        (atualiza dist/sw.js)
//      node tests/pwa/atualizar-sw.cjs --check (só confere; sai com erro se estiver desatualizado)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dist = path.join(__dirname, '../../dist'), swPath = path.join(dist, 'sw.js');
const PREFIXO = 'numera-v14-';
const TEXTO = /\.(js|css|html|json|webmanifest|svg|txt|md|sql)$/i;
const walk = (d) => fs.readdirSync(path.join(dist, d), { withFileTypes: true }).flatMap((e) => {
  const r = d ? d + '/' + e.name : e.name;
  return e.isDirectory() ? walk(r) : [r];
});
const conteudo = (rel) => { const b = fs.readFileSync(path.join(dist, rel)); return TEXTO.test(rel) ? Buffer.from(b.toString('utf8').split('\r\n').join('\n')) : b; };
function listaDeArquivos() {
  const files = walk('').filter((f) => f !== 'sw.js' && !f.split('/').some((x) => x.startsWith('.')) && !/LICENSE/.test(f) && !f.startsWith('jogos/calculandia/'));
  files.sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  return ['./', ...files];
}
function expected() {
  const sw = fs.readFileSync(swPath, 'utf8'), assets = listaDeArquivos();
  const h = crypto.createHash('sha256');
  for (const a of assets) { if (a === './') continue; h.update(a); h.update(conteudo(a)); }
  // A Calculândia é guardada na primeira vez que abre: os arquivos dela também entram na versão,
  // senão quem já jogou continuaria com o index.html ou os módulos antigos depois de uma atualização.
  for (const f of walk('jogos/calculandia').filter((f) => /\.(js|html|css)$/.test(f) && !f.includes('/bibliotecas/')).sort()) { h.update(f); h.update(conteudo(f)); }
  return { sw, assets, version: PREFIXO + h.digest('hex').slice(0, 10) };
}
const montar = (sw, assets, version) => sw
  .replace(/const VERSION = '[^']+';/, `const VERSION = '${version}';`)
  .replace(/const ASSETS = \[[^\]]*\];/, 'const ASSETS = [\n' + assets.map((a) => `  '${a}',`).join('\n') + '\n];');
module.exports = expected;
if (require.main === module) {
  const { sw, assets, version } = expected(), novo = montar(sw, assets, version);
  if (process.argv.includes('--check')) {
    if (novo !== sw) { console.error(`sw.js desatualizado (versão ou lista de arquivos). Rode: node tests/pwa/atualizar-sw.cjs`); process.exit(1); }
    console.log('sw.js em dia:', version, `(${assets.length - 1} arquivos)`);
  } else { fs.writeFileSync(swPath, novo); console.log('sw.js →', version, `(${assets.length - 1} arquivos)`); }
}
