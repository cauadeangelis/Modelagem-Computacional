/* Numera Academy — Página Listas: as questões das listas da disciplina, lidas do banco de questões
   (banco-de-questoes/questoes.sql → dados/banco-de-questoes.js). Cada questão confere a resposta digitada
   ou escolhida, mostra a resolução no formato dos slides (refeita na hora por js/motor/resolver-questoes.js)
   e, quando o gabarito impresso na lista não confere, a observação explicando.
   Errou? A questão vai para a Revisão (id "l:<questão>"), como as atividades das trilhas.
   Parte da interface: script clássico que compartilha as variáveis dos outros (ordem no index.html). */
'use strict';
const BQ=window.NumeraBanco||null,BR=window.NumeraResolver||null;
const BQ_MAP=new Map(BQ?BQ.questoes.map(q=>[q.id,q]):[]);
const bqLista=id=>BQ.listas.find(l=>l.id===id)||{titulo:id},bqTema=id=>BQ.temas.find(t=>t.id===id)||{nome:id};
const BQ_DIF=['','Fácil','Médio','Difícil'];
s.bq={lista:'',tema:'',filtro:'todas',aberta:null,mc:{},resp:{},fb:{},limite:12};
const bqStatus=id=>p.completed['l:'+id]?'certa':p.review['l:'+id]?'revisar':'nova';
// Número digitado → valor (aceita vírgula, %, frações e o sinal − dos textos).
function bqNumero(txt){return parseAnswer(String(txt).replace(/−/g,'-').replace(/%\s*$/,'').replace(/\s+/g,''));}
function bqVetor(txt){const t=String(txt).replace(/[()[\]]/g,' ').trim();let partes=t.split(/\s*[;|]\s*|\s+/).filter(Boolean);if(partes.length===1&&(t.match(/,/g)||[]).length>1&&!/\./.test(t))partes=t.split(',');return partes.map(bqNumero);}
const bqTol=q=>q.tolerancia!=null?q.tolerancia:Math.max(5*Math.pow(10,-((q.casas!=null?q.casas:4)+1))*1.2,Math.abs(q.valor||0)*1e-9);
function bqConfereTexto(q,txt){
 if(q.tipo==='numero')return BR.confere(q,bqNumero(txt));
 if(q.tipo==='vetor'&&q.vetor&&bqDigita(q)){const v=bqVetor(txt);return v.length===q.vetor.length&&v.every((x,i)=>Math.abs(x-q.vetor[i])<=bqTol(q)*Math.max(1,Math.abs(q.vetor[i])));}
 throw Error('Escolha uma das alternativas.');}
const bqDigita=q=>q.tipo==='numero'||(q.tipo==='vetor'&&!/[a-zA-Z]/.test(q.resposta));
function bqRegistrar(q,ok){const id='l:'+q.id;if(!P.ids.has(id))return '';if(ok){const naRevisao=!!p.review[id],r=P.complete(p,id,{wrong:p.attempts[id]||0,review:naRevisao});persist();return r.xp?` +${r.xp} XP.`:naRevisao?' Revisão registrada.':'';}P.wrong(p,id);persist();return ' Ela foi para o seu caderno de Revisão.';}

/* ---------- resolução no formato dos slides ---------- */
function bqResolucao(q){let r;try{r=BR.resolver(q.parametros);}catch(e){return `<p class="fine">Resolução indisponível: ${safe(e.message)}</p>`;}
 const passos=String(r.resumo||'').replace(/\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g,'.\n').split('\n').filter(Boolean); // sem lookbehind: Safari 15
 const tabela=r.tabela&&r.tabela.linhas.length?`<div class="pp-table-wrap"><table class="pp-table"><thead><tr>${r.tabela.colunas.map(c=>`<th scope="col">${safe(c)}</th>`).join('')}</tr></thead><tbody>${r.tabela.linhas.map((l,i)=>`<tr class="${i===r.tabela.linhas.length-1?'on':''}">${l.map(c=>`<td>${safe(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 const edo=r.linhas&&r.linhas.length?`<div class="pp-table-wrap"><table class="pp-table"><thead><tr><th scope="col">k</th><th scope="col">xₖ</th><th scope="col">yₖ</th></tr></thead><tbody>${r.linhas.map((l,i)=>`<tr class="${i===r.linhas.length-1?'on':''}"><td>${l.k}</td><td>${short(l.x)}</td><td>${num(Number(l.y.toPrecision(9)))}</td></tr>`).join('')}</tbody></table></div>`:'';
 return `<div class="bq-resolucao"><h4>Resolução</h4>${passos.map(t=>`<p>${safe(t)}</p>`).join('')}${tabela}${edo}<p class="bq-resposta"><span>Resposta</span> <b>${safe(q.resposta)}</b></p></div>`;}
function bqGabarito(q){const partes=[];if(q.gabaritoLista&&q.gabaritoLista!==q.resposta)partes.push(`<p><span class="eyebrow">Gabarito impresso na lista</span> ${safe(q.gabaritoLista)}</p>`);if(q.observacao)partes.push(`<p>${safe(q.observacao)}</p>`);return partes.length?`<div class="bq-obs ${q.diverge?'diverge':''}" role="note">${q.diverge?'<b>O gabarito da lista não confere com a conta.</b> ':''}${partes.join('')}</div>`:'';}
const BQ_LAB={bissecao:'bisection',falsaPosicao:'falseposition',newton:'newton',secante:'secant'};
function bqLabBtn(q){const p_=q.parametros;return BQ_LAB[p_.calc]?btn('Abrir no Terminal '+icon('lab'),'bq-lab','text',`data-id="${q.id}"`):'';}

/* ---------- cartão de uma questão ---------- */
function bqAlternativas(q,escolhida,resolvida){return `<div class="bq-alts" role="group" aria-label="Alternativas">${q.alternativas.map((a,i)=>{const est=resolvida?(a.correta?'certa':i===escolhida?'errada':''):'';return `<button type="button" class="bq-alt ${est}" data-act="bq-alt" data-id="${q.id}" data-index="${i}" ${resolvida?'disabled':''} aria-pressed="${i===escolhida}"><span class="bq-letra">${a.letra}</span><span>${safe(a.texto)}</span></button>`;}).join('')}</div>`;}
function bqCartao(q){const aberta=s.bq.aberta===q.id,st=bqStatus(q.id),L=bqLista(q.lista),fb=s.bq.fb[q.id];
 const cab=`<div class="bq-cab"><span class="eyebrow">${safe(L.titulo)}${q.numero?' · '+safe(q.numero):''}</span><div class="bq-tags">${tag(safe(bqTema(q.tema).nome))}${tag(BQ_DIF[q.dificuldade]||'')}${q.rapida?tag('⚡ rápida','bq-tag-rapida'):''}${st==='certa'?tag(icon('check')+' acertou','bq-tag-ok'):st==='revisar'?tag('↻ revisar','bq-tag-rev'):''}${q.diverge?tag('gabarito da lista confere? não','bq-tag-div'):''}</div></div>`;
 if(!aberta)return `<article class="card bq-card" id="bq-${q.id}">${cab}<p class="bq-enunciado">${safe(q.enunciado)}</p><div class="row-actions">${btn(st==='certa'?'Ver de novo':'Resolver','bq-abrir','ghost',`data-id="${q.id}"`)}</div></article>`;
 const resolvida=!!(fb&&fb.fim),mc=s.bq.mc[q.id]||!bqDigita(q);
 let corpo='';
 if(q.tipo==='programa')corpo=`<p class="fine">${safe(q.resposta)}</p>${bqResolucao(q)}`;
 else{
  const form=!mc&&!resolvida?`<form class="bq-form" data-id="${q.id}" id="bq-form-${q.id}"><label for="bq-in-${q.id}">${q.tipo==='vetor'?'Sua resposta (componentes separadas por ;)':'Sua resposta'}</label><div class="bq-linha"><input id="bq-in-${q.id}" class="input" autocomplete="off" inputmode="${q.tipo==='numero'?'decimal':'text'}" spellcheck="false" placeholder="${q.tipo==='vetor'?'Ex.: 1,0397; 1,0147; 0,9895':'Ex.: '+(q.casas?'0,'+'0'.repeat(Math.max(1,q.casas)):'12')}" value="${safe(s.bq.resp[q.id]||'')}"><button type="submit" class="btn primary">Conferir</button></div></form><button type="button" class="btn text bq-troca" data-act="bq-mc" data-id="${q.id}">Prefiro ver as alternativas</button>`:'';
  corpo=form+(mc?bqAlternativas(q,fb?fb.escolha:null,resolvida):'');
  if(fb)corpo+=`<div class="bq-feedback ${fb.ok?'ok':'no'}" role="status"><b>${fb.ok?'Certo!':fb.fim?'Não foi dessa vez.':'Ainda não.'}</b> ${safe(fb.msg)}</div>`;
  if(resolvida||(fb&&fb.ver))corpo+=bqResolucao(q)+bqGabarito(q);
  else if(fb&&!fb.ok)corpo+=`<div class="row-actions">${btn('Ver a resolução','bq-ver','text',`data-id="${q.id}"`)}</div>`;
 }
 return `<article class="card bq-card aberta" id="bq-${q.id}">${cab}<p class="bq-enunciado">${safe(q.enunciado)}</p>${corpo}<div class="row-actions bq-rodape">${btn('Fechar','bq-fechar','ghost',`data-id="${q.id}"`)}${bqLabBtn(q)}</div></article>`;}

/* ---------- página ---------- */
function bqFiltradas(){const f=s.bq;return BQ.questoes.filter(q=>!q.origem&&(!f.lista||q.lista===f.lista)&&(!f.tema||q.tema===f.tema)&&(f.filtro==='todas'||(f.filtro==='revisar'?bqStatus(q.id)==='revisar':f.filtro==='certas'?bqStatus(q.id)==='certa':bqStatus(q.id)==='nova')));}
function listas(){if(!BQ||!BR)return `<div class="wrap page-body">${heading('Listas','Listas de exercícios','O banco de questões não carregou. Recarregue a página.')}</div>`;
 const base=BQ.questoes.filter(q=>!q.origem),certas=base.filter(q=>bqStatus(q.id)==='certa').length,rev=base.filter(q=>bqStatus(q.id)==='revisar').length,lista=bqFiltradas(),vis=lista.slice(0,s.bq.limite);
 const temasUsados=BQ.temas.filter(t=>base.some(q=>q.tema===t.id&&(!s.bq.lista||q.lista===s.bq.lista)));
 const opt=(v,t,sel)=>`<option value="${safe(v)}" ${sel?'selected':''}>${safe(t)}</option>`;
 return `<div class="wrap page-body">${heading('Listas','Exercícios das listas',`As ${base.length} questões das listas da disciplina, com a conta refeita no formato dos slides da professora. Quando o gabarito impresso não confere, a questão explica por quê.`,btn('⚡ Modo Relâmpago','nav','primary','data-page="relampago"'))}
 <div class="stat-row"><div class="stat card"><span>Questões no banco</span><b>${base.length}</b></div><div class="stat card"><span>Você acertou</span><b>${certas}</b></div><div class="stat card"><span>Para revisar</span><b>${rev}</b></div></div>
 <section class="card bq-filtros" aria-label="Filtros"><label>Lista<select id="bq-lista">${opt('','Todas as listas',!s.bq.lista)}${BQ.listas.map(l=>opt(l.id,l.titulo,s.bq.lista===l.id)).join('')}</select></label><label>Assunto<select id="bq-tema">${opt('','Todos os assuntos',!s.bq.tema)}${temasUsados.map(t=>opt(t.id,t.nome,s.bq.tema===t.id)).join('')}</select></label>${tabs([['todas','Todas'],['novas','Não feitas'],['revisar','Para revisar'],['certas','Acertadas']],s.bq.filtro,'bq-filtro')}</section>
 ${s.bq.lista?(()=>{const L=bqLista(s.bq.lista);return `<p class="bq-sobre">${safe(L.instituicao)} · ${safe(L.assunto)}${L.temGabarito?'':' · esta lista não traz gabarito: as respostas são as da conta'}</p>`;})():''}
 <p class="fine" role="status">${lista.length} ${lista.length===1?'questão':'questões'}${lista.length>vis.length?`, mostrando ${vis.length}`:''}.</p>
 <div class="bq-lista">${vis.map(bqCartao).join('')||`<section class="card empty-state"><h2 class="display">Nada por aqui</h2><p>Nenhuma questão com esses filtros.</p></section>`}</div>
 ${lista.length>vis.length?`<div class="row-actions center">${btn(`Mostrar mais ${Math.min(12,lista.length-vis.length)}`,'bq-mais','ghost')}</div>`:''}</div>`;}

/* ---------- ações ---------- */
function bqAbrir(id){const q=BQ_MAP.get(id);if(!q)return;if(s.page!=='listas'){s.bq.lista=q.lista;s.bq.tema='';s.bq.filtro='todas';}const pos=bqFiltradas().findIndex(x=>x.id===id);if(pos<0){s.bq.lista=q.lista;s.bq.tema='';s.bq.filtro='todas';}const i=bqFiltradas().findIndex(x=>x.id===id);if(i>=s.bq.limite)s.bq.limite=i+1;s.bq.aberta=id;s.bq.fb[id]=null;if(s.page!=='listas'){s.reviewId=null;navigate('listas');}else render();setTimeout(()=>{const el=document.getElementById('bq-'+id);if(el&&el.scrollIntoView)el.scrollIntoView({block:'start',behavior:'auto'});const inp=document.getElementById('bq-in-'+id);if(inp)inp.focus({preventScroll:true});},30);}
function bqHandle(act,el){const id=el.dataset.id,q=id?BQ_MAP.get(id):null;
 if(act==='bq-abrir'){bqAbrir(id);return;}
 if(act==='bq-fechar'){s.bq.aberta=null;render();return;}
 if(act==='bq-mc'){s.bq.mc[id]=true;render();return;}
 if(act==='bq-ver'){s.bq.fb[id]=Object.assign({},s.bq.fb[id],{ver:true,fim:true});render();return;}
 if(act==='bq-mais'){s.bq.limite+=12;render();return;}
 if(act==='bq-filtro'){s.bq.filtro=id;s.bq.limite=12;s.bq.aberta=null;render();return;}
 if(act==='bq-lab'&&q){const pr=q.parametros;openInLab({source:`${pr.f} = 0`,mode:'root',algorithm:BQ_LAB[pr.calc],a:pr.a,b:pr.b,x0:pr.x0,x1:pr.x1});return;}
 if(act==='bq-alt'&&q){const i=Number(el.dataset.index),a=q.alternativas[i];if(!a)return;const extra=bqRegistrar(q,a.correta);s.bq.fb[id]={ok:a.correta,fim:true,escolha:i,msg:a.correta?`A resposta é ${q.resposta}.${extra}`:`${a.explicacao||''} A resposta certa é ${q.resposta}.${extra}`};announce(a.correta?'Certo!':'Resposta errada.');render();return;}
}
function bqSubmit(form){const id=form.dataset.id,q=BQ_MAP.get(id);if(!q)return;const inp=form.querySelector('input'),txt=inp?inp.value:'';s.bq.resp[id]=txt;
 let ok;try{ok=bqConfereTexto(q,txt);}catch(e){s.bq.fb[id]={ok:false,fim:false,msg:e.message};render();return;}
 const antes=s.bq.fb[id],tentativas=(antes&&antes.tentativas||0)+1;
 if(ok){const extra=bqRegistrar(q,true);s.bq.fb[id]={ok:true,fim:true,tentativas,msg:`A resposta é ${q.resposta}.${extra}`};}
 else{const extra=tentativas===1?bqRegistrar(q,false):'';s.bq.fb[id]={ok:false,fim:tentativas>=2,tentativas,msg:tentativas>=2?`A resposta certa é ${q.resposta}.`:`Confira a conta e tente de novo, ou veja a resolução.${extra}`};}
 announce(ok?'Certo!':'Resposta errada.');render();focusSoon(ok?`[data-act="bq-fechar"][data-id="${id}"]`:`#bq-in-${id}`);}
function bqChange(el){if(el.id==='bq-lista'){s.bq.lista=el.value;s.bq.tema='';s.bq.limite=12;s.bq.aberta=null;render();return true;}if(el.id==='bq-tema'){s.bq.tema=el.value;s.bq.limite=12;s.bq.aberta=null;render();return true;}return false;}
// Revisão: as questões das listas aparecem no caderno junto com as das trilhas.
const bqTitulo=id=>{const q=BQ_MAP.get(id.slice(2));return q?`${bqLista(q.lista).titulo}${q.numero?' · '+q.numero:''}: ${q.enunciado.length>140?q.enunciado.slice(0,137)+'…':q.enunciado}`:id;};
