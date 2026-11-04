/* Numera Academy — service worker (PWA).
   Guarda os arquivos do site no aparelho para funcionar sem internet, inclusive as fontes (v10: empacotadas no site).
   VERSION é calculada a partir do conteúdo dos arquivos (tests/pwa/atualizar-sw.cjs); quando algo muda,
   a versão muda, o cache novo é montado e o antigo é apagado. Não edite VERSION à mão.
   v12: o Quem Divergiu? entra no cache inicial (é leve e precisa abrir sem internet na sala). A Calculândia (≈ 1,5 MB, 3D)
   não pesa no primeiro acesso: cada arquivo dela é guardado na primeira vez que o jogo abre e, daí em diante, ele também
   funciona offline. Uma versão nova do site apaga esse cache junto com o resto. */
const VERSION = 'numera-v13-5153fe381e';
const ASSETS = [
  './',
  'index.html',
  'css/fontes.css',
  'css/grafico-de-convergencia.css',
  'css/listas.css',
  'css/personagens.css',
  'css/site.css',
  'css/terminal.css',
  'css/treino.css',
  'dados/banco-de-questoes.js',
  'dados/treino-exercicios.js',
  'fontes/figtree-latin-ext-wght-normal.woff2',
  'fontes/figtree-latin-wght-normal.woff2',
  'fontes/jetbrains-mono-latin-ext-wght-normal.woff2',
  'fontes/jetbrains-mono-latin-wght-normal.woff2',
  'fontes/newsreader-latin-ext-opsz-normal.woff2',
  'fontes/newsreader-latin-opsz-normal.woff2',
  'imagens/favicon.svg',
  'imagens/icone-192.png',
  'imagens/icone-512.png',
  'imagens/icone-adaptavel-512.png',
  'imagens/icone-apple.png',
  'jogos/capas/calculandia.webp',
  'jogos/capas/quem-divergiu.webp',
  'jogos/quem-divergiu/index.html',
  'jogos/quem-divergiu/perguntas.js',
  'jogos/quem-divergiu/quem-divergiu.css',
  'jogos/quem-divergiu/quem-divergiu.js',
  'js/conteudo/conteudo.js',
  'js/motor/motor-numerico.js',
  'js/motor/passo-a-passo.js',
  'js/motor/resolver-questoes.js',
  'js/offline/registrar-offline.js',
  'js/paginas/aulas-em-video.js',
  'js/paginas/inicio.js',
  'js/paginas/jogos.js',
  'js/paginas/licao.js',
  'js/paginas/listas.js',
  'js/paginas/missoes.js',
  'js/paginas/relampago.js',
  'js/paginas/revisao-e-progresso.js',
  'js/paginas/terminal.js',
  'js/paginas/trilhas.js',
  'js/personagens/raiz-e-pivo.js',
  'js/progresso/progresso.js',
  'js/site/demonstracoes.js',
  'js/site/estado-e-utilitarios.js',
  'js/site/eventos-e-inicializacao.js',
  'js/site/graficos.js',
  'js/site/ilustracoes.js',
  'js/site/jornada-e-backup.js',
  'js/site/moldura.js',
  'js/site/visuais-das-secoes.js',
  'js/terminal/grafico-de-convergencia.js',
  'js/terminal/teclado-cientifico.js',
  'js/treino/treino.js',
  'manifest.webmanifest',
];
const EM_USO = /\/jogos\/calculandia\//; // guardado na primeira vez que abre (ver acima)
const guardar = (req, res) => { if (res.ok && EM_USO.test(new URL(req.url).pathname)) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return res; };

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Outros sites (as aulas do YouTube, por exemplo) não passam pelo cache: sem internet, eles simplesmente não abrem.
  if (url.origin !== self.location.origin) return;
  // Páginas: tenta a rede (para pegar a versão nova) e cai para o cache sem internet.
  if (req.mode === 'navigate') {
    // Sem internet: a própria página, se estiver guardada (os jogos), ou o início do site.
    event.respondWith(fetch(req).then(res => guardar(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html', { ignoreSearch: true })).then(hit => hit || Response.error())));
    return;
  }
  // Arquivos do site: cache primeiro; a versão nova chega junto com um VERSION novo.
  // Sem cache e sem rede, devolve um erro de verdade (Response.error) em vez de uma promessa vazia.
  event.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => guardar(req, res)).catch(() => Response.error())));
});
