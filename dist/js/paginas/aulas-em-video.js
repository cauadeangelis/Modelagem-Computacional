/* Numera Academy — Aulas em vídeo do YouTube (o player só carrega depois do clique).
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* ---------- Aulas em vídeo (v10) ----------
   Vídeos de terceiros no YouTube. "Assistir aqui" só aparece quando a página está num endereço http(s)
   (aberta do disco, ou dentro de uma página que proíbe players externos, fica só o link) e carrega o player
   do youtube-nocookie apenas depois do clique: nada é baixado nem guardado pelo Numera. */
const NO_EMBED=(()=>{try{return !/^https?:$/.test(location.protocol)||!!document.querySelector('meta[name="numera-no-embed"]');}catch(_){return true;}})();
function videoList(id,where){const vs=(C.VIDEOS&&C.VIDEOS[id])||[];if(!vs.length)return '';
 return `<div class="videos ${where||''}">${vs.map((v,k)=>{const key=`${id}:${k}`,open=s.videoOpen===key;return `<article class="video-card"><div class="video-tags"><span class="video-chip lang-${v.lang}">${v.lang==='pt'?'Português':'Inglês'}</span><span class="video-chip">${safe(v.kind)}</span></div><h3>${safe(v.title)}</h3><p class="video-channel">${safe(v.channel)}</p><p class="fine">${safe(v.note)}</p>${open?`<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0" title="${safe(v.title)}" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`:''}<div class="row-actions">${NO_EMBED?'':btn(open?'Fechar o vídeo':icon('play')+' Assistir aqui','video-toggle',open?'ghost':'blue',`data-id="${key}" aria-expanded="${open}"`)}<a class="btn text" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗<span class="sr-only"> (abre em nova aba)</span></a></div></article>`;}).join('')}</div>
 <p class="fine video-note">Vídeos de canais de terceiros, hospedados no YouTube: precisam de internet e podem sair do ar ou mudar. O Numera só aponta para eles; não baixa nem guarda os vídeos.</p>`;}

