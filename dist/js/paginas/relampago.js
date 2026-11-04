/* Numera Academy — Modo Relâmpago: 10 perguntas rápidas de múltipla escolha, com cronômetro e combo.
   As perguntas vêm do banco de questões (as marcadas como "rápida": primeiro passo de um método,
   conceitos dos slides, contas de uma linha). Errou ou o tempo acabou? A questão vai para a Revisão.
   Atalhos: 1–4 (ou A–D) respondem; Enter passa para a próxima.
   Parte da interface: script clássico que compartilha as variáveis dos outros (ordem no index.html). */
'use strict';
const RL_KEY='numera-relampago-v1',RL_N=10;
const RL_GRUPOS=[['tudo','Tudo',null],['raizes','Raízes',['bissecao','falsa-posicao','newton','secante']],['sistemas','Sistemas',['gauss','pivoteamento','lu','cholesky','markov','jacobi','seidel','criterios','erro-vetor']],['erros','Erros',['ponto-flutuante','series']],['aprox','Interpolação e ajuste',['interpolacao','minimos-quadrados']],['integra','Integração e EDO',['trapezios','retangulos','simpson13','simpson38','euler','taylor']]];
s.rl={fase:'inicio',grupo:'tudo',ids:[],i:0,pontos:0,combo:0,melhorCombo:0,acertos:0,escolha:null,fim:null,limite:20,erros:[],recorde:false};
let rlTimer=null;
const rlLer=()=>{try{const d=JSON.parse(storage.getItem(RL_KEY)||'null');return d&&typeof d==='object'?{recorde:Math.max(0,Math.floor(Number(d.recorde)||0)),partidas:Math.max(0,Math.floor(Number(d.partidas)||0))}:{recorde:0,partidas:0};}catch(_){return {recorde:0,partidas:0};}};
const rlSalvar=d=>{try{storage.setItem(RL_KEY,JSON.stringify(d));}catch(_){}};
function rlPool(grupo){if(!BQ)return [];const temas=(RL_GRUPOS.find(g=>g[0]===grupo)||RL_GRUPOS[0])[2],no=q=>!temas||temas.includes(q.tema),ok=q=>q.alternativas&&q.alternativas.length===4;
 const rapidas=BQ.questoes.filter(q=>q.rapida&&no(q)&&ok(q)),extra=BQ.questoes.filter(q=>!q.rapida&&no(q)&&ok(q)&&q.dificuldade<=2&&q.tipo!=='matriz'&&q.tipo!=='sistema');
 const emb=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 return emb(rapidas).concat(emb(extra)).slice(0,RL_N).map(q=>q.id);}
const rlTempo=q=>q.rapida?(q.tipo==='texto'?25:30):60;
function rlParar(){if(rlTimer){clearInterval(rlTimer);rlTimer=null;}}
function rlTick(){if(s.page!=='relampago'||s.rl.fase!=='jogo'||s.rl.escolha!==null){rlParar();return;}const resta=Math.max(0,s.rl.fim-Date.now()),q=BQ_MAP.get(s.rl.ids[s.rl.i]),total=rlTempo(q)*1000;
 const barra=document.getElementById('rl-barra'),txt=document.getElementById('rl-seg');if(barra)barra.style.width=(resta/total*100).toFixed(1)+'%';if(txt)txt.textContent=Math.ceil(resta/1000)+' s';if(barra&&resta<5000)barra.classList.add('pouco');
 if(resta<=0){rlParar();rlResponder(-1);}}
function rlComecar(){const ids=rlPool(s.rl.grupo);if(!ids.length)return;Object.assign(s.rl,{fase:'jogo',ids,i:0,pontos:0,combo:0,melhorCombo:0,acertos:0,escolha:null,erros:[],recorde:false});rlPergunta();}
function rlPergunta(){const q=BQ_MAP.get(s.rl.ids[s.rl.i]);s.rl.escolha=null;s.rl.limite=rlTempo(q);s.rl.fim=Date.now()+s.rl.limite*1000;render();rlParar();rlTimer=setInterval(rlTick,200);focusSoon('[data-act="rl-alt"][data-index="0"]');}
function rlResponder(i){const r=s.rl;if(r.fase!=='jogo'||r.escolha!==null)return;rlParar();const q=BQ_MAP.get(r.ids[r.i]),a=q.alternativas[i],ok=!!(a&&a.correta),resta=Math.max(0,(r.fim-Date.now())/1000);r.escolha=i;
 if(ok){r.combo++;r.melhorCombo=Math.max(r.melhorCombo,r.combo);r.acertos++;const mult=Math.min(3,1+0.5*(r.combo-1)),ganho=Math.round((100+5*Math.ceil(resta))*mult);r.pontos+=ganho;r.ultimo={ok:true,ganho,mult};}
 else{r.combo=0;r.erros.push(q.id);r.ultimo={ok:false,tempo:i<0};}
 bqRegistrar(q,ok);announce(ok?`Certo! Mais ${r.ultimo.ganho} pontos.`:i<0?'O tempo acabou.':'Resposta errada.');render();focusSoon('[data-act="rl-proxima"]');}
function rlProxima(){const r=s.rl;if(r.i<r.ids.length-1){r.i++;rlPergunta();return;}r.fase='fim';const d=rlLer();d.partidas++;if(r.pontos>d.recorde){d.recorde=r.pontos;r.recorde=true;}rlSalvar(d);render();focusSoon('[data-act="rl-comecar"]');}
function rlCartaoJogos(){const d=rlLer();return `<article class="game-card card game-rl" aria-labelledby="rl-t"><div class="rl-capa" aria-hidden="true"><span>⚡</span></div><div class="game-body"><span class="eyebrow">Perguntas rápidas · para jogar sozinho</span><h2 class="display" id="rl-t">Relâmpago</h2><p>Dez perguntas curtas das listas e dos slides, de múltipla escolha e com cronômetro: o primeiro passo da Bisseção, o multiplicador do Gauss, a fórmula da Secante. Acertos seguidos multiplicam os pontos.</p><ul class="game-facts"><li><b>10</b><span>perguntas por rodada</span></li><li><b>${BQ?BQ.questoes.filter(q=>q.rapida).length:0}</b><span>perguntas rápidas no banco</span></li><li><b>×3</b><span>combo máximo</span></li></ul><p class="game-progress">${d.partidas?`Recorde: ${d.recorde} pontos · ${d.partidas} ${d.partidas===1?'rodada':'rodadas'}`:'Nenhuma rodada ainda.'}</p><div class="row-actions">${btn('Jogar o Relâmpago '+icon('arrow'),'nav','primary','data-page="relampago"')}</div><p class="fine">Errou? A questão vai para a Revisão, com a resolução no formato dos slides.</p></div></article>`;}

function relampago(){if(!BQ)return `<div class="wrap page-body">${heading('Relâmpago','Perguntas rápidas','O banco de questões não carregou. Recarregue a página.')}</div>`;const r=s.rl,d=rlLer();
 if(r.fase==='inicio')return `<div class="wrap page-body rl">${heading('Relâmpago','Perguntas rápidas',`${RL_N} perguntas de múltipla escolha, cada uma com cronômetro. Acertos seguidos multiplicam os pontos (até ×3). Atalhos: 1 a 4 respondem, Enter passa.`)}
  <section class="card rl-inicio"><h2 class="display">Escolha o assunto</h2><div class="rl-grupos" role="group" aria-label="Assunto">${RL_GRUPOS.map(([id,nome])=>{const n=rlPoolSize(id);return `<button type="button" class="rl-grupo ${r.grupo===id?'active':''}" data-act="rl-grupo" data-id="${id}" aria-pressed="${r.grupo===id}" ${n<4?'disabled':''}><b>${nome}</b><span>${n} perguntas</span></button>`;}).join('')}</div>
  <div class="row-actions">${btn('Começar '+icon('arrow'),'rl-comecar','primary')}${btn('Ver as listas','nav','ghost','data-page="listas"')}</div><p class="fine">${d.partidas?`Seu recorde: <b>${d.recorde}</b> pontos em ${d.partidas} ${d.partidas===1?'rodada':'rodadas'}.`:'Primeira rodada: boa sorte!'}</p></section></div>`;
 if(r.fase==='fim'){const erradas=r.erros.map(id=>BQ_MAP.get(id)).filter(Boolean);return `<div class="wrap page-body rl">${heading('Relâmpago',r.recorde?'Novo recorde!':'Fim da rodada',`${r.acertos} de ${r.ids.length} certas · combo máximo ×${Math.min(3,1+0.5*Math.max(0,r.melhorCombo-1)).toString().replace('.',',')} (${r.melhorCombo} seguidas).`)}
  <div class="stat-row"><div class="stat card"><span>Pontos</span><b>${r.pontos}</b></div><div class="stat card"><span>Acertos</span><b>${r.acertos}/${r.ids.length}</b></div><div class="stat card"><span>Recorde</span><b>${d.recorde}</b></div></div>
  ${erradas.length?`<section class="card rl-erros"><h2>Para rever</h2><p class="fine">Estas foram para o seu caderno de Revisão.</p><ul>${erradas.map(q=>`<li><p>${safe(q.enunciado)}</p><p><span class="eyebrow">Resposta</span> <b>${safe(q.resposta)}</b></p>${btn('Ver a resolução','bq-abrir','text',`data-id="${q.id}"`)}</li>`).join('')}</ul></section>`:''}
  <div class="row-actions">${btn('Jogar de novo '+icon('arrow'),'rl-comecar','primary')}${btn('Trocar de assunto','rl-inicio','ghost')}${btn('Ver as listas','nav','ghost','data-page="listas"')}</div></div>`;}
 const q=BQ_MAP.get(r.ids[r.i]),resp=r.escolha!==null,resta=Math.max(0,r.fim-Date.now()),mult=Math.min(3,1+0.5*Math.max(0,r.combo-1)),L=bqLista(q.lista);
 return `<div class="wrap page-body rl rl-jogo"><div class="rl-topo"><button type="button" class="icon-btn" data-act="rl-sair" aria-label="Sair da rodada">${icon('close')}</button><span class="rl-contador">${r.i+1}/${r.ids.length}</span><div class="rl-tempo" aria-hidden="true"><span id="rl-barra" class="${resta<5000?'pouco':''}" style="width:${resp?0:(resta/(r.limite*1000)*100).toFixed(1)}%"></span></div><span id="rl-seg" class="rl-seg">${resp?'':Math.ceil(resta/1000)+' s'}</span><span class="rl-pontos"><b>${r.pontos}</b> pts${r.combo>1?` <span class="rl-combo">×${String(mult).replace('.',',')}</span>`:''}</span></div>
 <section class="card rl-pergunta"><span class="eyebrow">${safe(bqTema(q.tema).nome)} · ${safe(L.titulo)}${q.numero?' · '+safe(q.numero):''}</span><h1 class="rl-enunciado">${safe(q.enunciado)}</h1>
 <div class="bq-alts rl-alts" role="group" aria-label="Alternativas">${q.alternativas.map((a,i)=>{const est=resp?(a.correta?'certa':i===r.escolha?'errada':''):'';return `<button type="button" class="bq-alt ${est}" data-act="rl-alt" data-index="${i}" ${resp?'disabled':''}><span class="bq-letra">${i+1}</span><span>${safe(a.texto)}</span></button>`;}).join('')}</div>
 ${resp?`<div class="bq-feedback ${r.ultimo.ok?'ok':'no'}" role="status"><b>${r.ultimo.ok?`Certo! +${r.ultimo.ganho}`:r.ultimo.tempo?'O tempo acabou.':'Errou.'}</b> ${r.ultimo.ok?(r.ultimo.mult>1?`Combo ×${String(r.ultimo.mult).replace('.',',')}.`:''):safe((q.alternativas[r.escolha]||{}).explicacao||'')+' A resposta é '+safe(q.resposta)+'.'}</div><div class="row-actions">${btn(r.i<r.ids.length-1?'Próxima '+icon('arrow'):'Ver o resultado '+icon('arrow'),'rl-proxima','primary')}</div>`:''}</section></div>`;}
function rlPoolSize(grupo){const temas=(RL_GRUPOS.find(g=>g[0]===grupo)||RL_GRUPOS[0])[2];return BQ?BQ.questoes.filter(q=>(!temas||temas.includes(q.tema))&&q.alternativas&&q.alternativas.length===4&&(q.rapida||q.dificuldade<=2&&q.tipo!=='matriz'&&q.tipo!=='sistema')).length:0;}
function rlHandle(act,el){
 if(act==='rl-grupo'){s.rl.grupo=el.dataset.id;render();return;}
 if(act==='rl-comecar'){rlComecar();return;}
 if(act==='rl-inicio'){s.rl.fase='inicio';render();return;}
 if(act==='rl-alt'){rlResponder(Number(el.dataset.index));return;}
 if(act==='rl-proxima'){rlProxima();return;}
 if(act==='rl-sair'){rlParar();s.rl.fase='inicio';render();return;}
}
document.addEventListener('keydown',e=>{if(s.page!=='relampago'||s.rl.fase!=='jogo'||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT')return;
 if(s.rl.escolha===null){const k=e.key.toLowerCase(),i='1234'.indexOf(k)>=0?'1234'.indexOf(k):'abcd'.indexOf(k);if(i>=0&&k.length===1){e.preventDefault();rlResponder(i);}}
 else if(e.key==='Enter'&&!(e.target.closest&&e.target.closest('button'))){e.preventDefault();rlProxima();}});
