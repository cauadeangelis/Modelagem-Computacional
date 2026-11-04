/* Numera Academy — Jornada (mundos do fácil ao difícil), backup do progresso e navegação entre páginas.
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* ---------- Jornada (v11): mundos do mais fácil ao mais difícil ----------
   C.METHODS já vem na ordem da jornada. O mundo seguinte abre quando o Nível 1 (4 primeiras etapas) do anterior termina;
   o modo livre (para professores) abre tudo. Ler a ideia e ver a simulação nunca fica bloqueado: só os desafios. */
const JOURNEY=()=>C.JOURNEY||C.METHODS.map((m,i)=>({id:m.id,stars:Math.min(5,i+1),tier:'',why:''}));
const world=id=>JOURNEY().find(w=>w.id===id)||{stars:3,tier:'Médio',why:''};
const worldIdx=id=>C.METHODS.findIndex(m=>m.id===id);
const levelDone=(id,l)=>[0,1,2,3].every(j=>p.completed[`c:${id}:${l*4+j}`]);
const prevWorld=id=>{const i=worldIdx(id);return i>0?C.METHODS[i-1]:null;};
const nextWorld=id=>{const i=worldIdx(id);return i>=0&&i<C.METHODS.length-1?C.METHODS[i+1]:null;};
const worldOpen=id=>{const pr=prevWorld(id);return !!p.free||!pr||levelDone(pr.id,0)||doneCount(id)>0;};
const diffStars=(n,cls='')=>`<span class="diff ${cls}" role="img" aria-label="Dificuldade ${n} de 5">${'★'.repeat(n)}<span>${'★'.repeat(5-n)}</span></span>`;
const tierTag=id=>{const w=world(id);return w.tier?`<span class="tier tier-${w.tier==='Fácil'?'easy':w.tier==='Médio'?'mid':'hard'}">${w.tier}</span>`:'';};
const coinChip=(cls='')=>`<span class="coin-meta ${cls}" role="img" aria-label="${p.coins} moedas"><span class="coin-ico" aria-hidden="true">√</span><b>${p.coins}</b></span>`;
const comboPips=()=>{const n=s.streak||0,k=n%3,full=n>0&&k===0?3:k;return `<span class="combo-pips ${full===3?'full':''}" role="img" aria-label="Sequência: ${n} ${n===1?'acerto seguido':'acertos seguidos'}. A cada 3, o Pivô solta moedas.">${[0,1,2].map(i=>`<i class="${i<full?'on':''}"></i>`).join('')}</span>`;};
// persist devolve se gravou de verdade. Mensagens de "salvo" só aparecem quando a gravação foi confirmada.
function persist(){const ok=P.save(p,storage);if(!ok)s.warning='O navegador não conseguiu salvar (armazenamento cheio, bloqueado ou navegação privada). O que você fizer agora vale só nesta aba: exporte um backup para não perder.';return ok;}
// Leitor de tela: uma região fora do #app (que é redesenhado) anuncia mudanças importantes sem tirar o foco.
function announce(msg){const el=document.getElementById&&document.getElementById('announcer');if(!el)return;el.textContent='';setTimeout(()=>{el.textContent=msg;},40);}
let focusAfter=null;const focusSoon=sel=>{focusAfter=sel;};
// Backup único (v10): trilhas, Treino (exercícios, revisões, provas) e marcas de leitura num só arquivo versionado.
function backupEnvelope(){return {app:'numera-academy',backupVersion:2,createdAt:new Date().toISOString(),trilhas:p,treino:TR?TR.exportState():{},visitas:visited};}
function readBackup(raw){
 if(raw&&raw.app==='numera-academy'&&raw.backupVersion===2){
  const trilhas=P.validate(raw.trilhas),treino=raw.treino&&typeof raw.treino==='object'?raw.treino:{};
  const vis={};if(raw.visitas&&typeof raw.visitas==='object')for(const [k,v] of Object.entries(raw.visitas).slice(0,200))if(v===true&&/^[a-z]+:[a-z]+$/.test(k))vis[k]=true;
  return {trilhas,treino,visitas:vis,full:true};
 }
 return {trilhas:P.validate(raw),treino:null,visitas:null,full:false};// arquivo antigo (v4–v9): só trilhas
}
function resetQuestion(){s.selected=null;s.answer='';s.feedback=null;s.hint=false;s.wrong=0;}
function navigate(page,updateHash=true){if(page==='arena'){page='jogos';updateHash=true;} // links antigos da Arena (até a v11) levam aos Jogos
 s.page=page;s.confirm=null;resetQuestion();if(updateHash)history.replaceState(null,'','#'+page);render();window.scrollTo({top:0,behavior:'auto'});$('#main')?.focus({preventScroll:true});}

