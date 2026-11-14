/* Instala o service worker (funciona offline). Abrindo o arquivo direto (file://) o site funciona, mas sem cache offline.
   Fica num arquivo próprio para que a política de segurança (CSP) proíba qualquer script embutido na página.
   v15: quando sai uma versão nova do site, o service worker novo assume e a página recarrega uma vez sozinha,
   em vez de continuar mostrando os arquivos antigos do cache até a próxima visita. */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  var tinhaControle = !!navigator.serviceWorker.controller, recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!tinhaControle || recarregou) { tinhaControle = true; return; }
    recarregou = true; location.reload();
  });
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) { if (reg && reg.update) reg.update().catch(function () {}); }).catch(function () {});
  });
}
