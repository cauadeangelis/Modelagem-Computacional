/* Instala o service worker (funciona offline). Abrindo o arquivo direto (file://) o site funciona, mas sem cache offline.
   Fica num arquivo próprio para que a política de segurança (CSP) proíba qualquer script embutido na página. */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
