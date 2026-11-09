/* Numera Academy — Estado da página, progresso carregado e utilitários de HTML (ícones, botões, etiquetas).
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* Numera Academy v12 — interface. v12: a Arena deu lugar à página Jogos, com a Calculândia (aventura 3D, em jogos/calculandia) e o Bobo da Corte (antigo Quem Divergiu?; jogo de sala para o telão, em jogos/bobo-da-corte). v11: v11: jornada do Fácil ao Difícil (mundos travados por nível), moedas, sequência de acertos, camarim e o casal Raiz e Pivô torcendo nos desafios; Ponto Fixo escondido por enquanto (C.HIDDEN, reversível). v10.1: intervalo [a, b] à vista no Terminal, usado por todos os métodos. v10: raízes certificadas (troca de sinal, raiz múltipla provável ou quase-raiz), sistemas com escala equilibrada, backup único, foco e anúncios para leitor de tela, aulas em vídeo. Treino e modo prova em treino.js/treino-data.js; gráfico de convergência em convergencia.js. Conteúdo (content.js) e progresso (progress.js) são os mesmos da v4; a busca de raízes (smartRoot em math-engine.js) foi reforçada na v7 e o teclado científico do terminal fica em calculator.js. */
const M=window.NumeraMath,C=window.NumeraContent,P=window.NumeraProgress;
const $=sel=>document.querySelector(sel),safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>typeof n==='number'&&Number.isFinite(n)?(n!==0&&(Math.abs(n)<1e-5||Math.abs(n)>1e8)?n.toExponential(5):Number(n.toPrecision(10)).toLocaleString('pt-BR',{maximumFractionDigits:10})):String(n??'—');
const short=n=>typeof n==='number'&&Number.isFinite(n)?Number(n.toPrecision(5)).toLocaleString('pt-BR',{maximumFractionDigits:4}):'—';
let storage;try{storage=window.localStorage;}catch(_){storage={getItem(){throw Error('storage')},setItem(){throw Error('storage')}};}
let loaded=P.load(storage),p=loaded.p;
const VISITED_KEY='numera-academy-v6-visitas';
let visited={};try{visited=JSON.parse(storage.getItem(VISITED_KEY)||'{}')||{};}catch(_){visited={};}
function markVisited(key){visited[key]=true;try{storage.setItem(VISITED_KEY,JSON.stringify(visited));}catch(_){}}
const s={page:'home',method:'bisection',tab:'learn',q:0,selected:null,answer:'',feedback:null,hint:false,wrong:0,reviewId:null,caseId:'tank',caseQ:0,sim:0,warning:loaded.warning,result:null,resultTab:'solution',error:'',source:'x^3 - x - 2 = 0',mode:'root',algorithm:'auto',a:'',b:'',x0:'',x1:'',g:'',errorFix:null,min:'-40',max:'40',tolerance:'0.000001',maxIterations:'100',initial:'',historyOpen:false,guideIndex:0,guideAnswer:'',guideFeedback:null,
 demo:'newton',demos:{newton:{x0:2.4,k:0},bisection:{a:0.5,b:2.5,k:0},secant:{x0:0.6,x1:2.6,k:0}},featTab:'roots',topicsTab:'roots',introStep:0,pathSel:null,confirm:null,pendingRestore:null};
const ICON={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',academy:'M4 4h6c2 0 2 2 2 2s0-2 2-2h6v15h-6c-2 0-2 2-2 2s0-2-2-2H4ZM12 6v15',jogos:'M7 8h10a4.5 4.5 0 0 1 4.4 5.5l-.9 3.6a2.4 2.4 0 0 1-4.1 1.1L14 16h-4l-2.4 2.2a2.4 2.4 0 0 1-4.1-1.1l-.9-3.6A4.5 4.5 0 0 1 7 8ZM8 11v4M6 13h4M15.5 12h.01M17.5 14h.01',cases:'M3 7h18v14H3ZM8 7V3h8v4M3 12h18M10 12v3h4v-3',lab:'m4 7 5 5-5 5M12 17h8',progress:'M4 20V10M10 20V4M16 20v-7M22 20H2',review:'M20 7a9 9 0 1 0 1 8M20 2v5h-5',arrow:'M5 12h14m-5-5 5 5-5 5',check:'m5 12 4 4L19 6',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',flame:'M12 21c-4 0-7-2.7-7-6.6 0-3.4 2.4-5.4 4-7.4.3 1.8 1.2 3 2.4 3.6C11 7 12.6 4.6 14.6 3c.2 2.6 1.6 4.4 3 6 1.2 1.4 1.4 3 1.4 4.4C19 18.3 16 21 12 21Z',back:'M19 12H5m5-5-5 5 5 5',lock:'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5Z',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',close:'M6 6l12 12M18 6 6 18',book:'M3 5.5c3-1.4 6-1.2 9 1 3-2.2 6-2.4 9-1v13c-3-1.4-6-1.2-9 1-3-2.2-6-2.4-9-1ZM12 6.5v13',play:'M8 5v14l11-7Z',flag:'M5 21V4h11l-1.5 4L16 12H5',clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',treino:'M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12',listas:'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',bolt:'M13 2 4 14h7l-1 8 9-12h-7Z'};
const icon=(k,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[k]||ICON.spark}"/></svg>`;
const btn=(text,act,cls='primary',attrs='')=>`<button type="button" class="btn ${cls}" data-act="${act}" ${attrs}>${text}</button>`;
const tag=(text,cls='')=>`<span class="tag ${cls}">${text}</span>`;
const stars=n=>`<span class="stars" role="img" aria-label="${n} de 3 estrelas">${'★'.repeat(n)}<span>${'★'.repeat(3-n)}</span></span>`;
const method=id=>(C.ALL_METHODS||C.METHODS).find(m=>m.id===id); // inclui os escondidos: histórico e Treino antigos continuam legíveis
const ROOTS=()=>C.METHODS.filter(m=>m.category!=='Sistemas lineares'),SYSTEMS=()=>C.METHODS.filter(m=>m.category==='Sistemas lineares'),isSysMethod=id=>id==='gauss'||id==='seidel';
const WORDS={3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',10:'dez'},words=n=>WORDS[n]||String(n),cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
/* Número de verificações automáticas de tests/verify.cjs (o próprio teste confere este valor). */
const VERIFY_COUNT=3215;
const doneCount=id=>C.TASKS[id].filter((_,i)=>p.completed[`c:${id}:${i}`]).length;
// v11: só conta o que está à vista (o Ponto Fixo escondido guarda o progresso, mas não entra nos totais).
const visibleIds=()=>[...C.METHODS.flatMap(m=>C.TASKS[m.id].map((_,i)=>`c:${m.id}:${i}`)),...C.CASES.flatMap(c=>c.tasks.map((_,i)=>`p:${c.id}:${i}`))];
const hiddenId=id=>{const a=String(id).split(':');return a[0]==='c'?C.isHidden&&C.isHidden(a[1]):a[0]==='a'?true:a[0]==='p'?!C.CASES.some(c=>c.id===a[1]):false;};
const totalDone=()=>Object.keys(p.completed).filter(id=>!hiddenId(id)).length;
const courseDone=()=>C.METHODS.reduce((n,m)=>n+doneCount(m.id),0);
const due=()=>Object.keys(p.review).filter(id=>p.review[id].due<=P.day()&&!hiddenId(id));
const dueAll=()=>due().length+(TR?TR.reviewDue():0);
const nextQ=id=>{const n=C.TASKS[id].findIndex((_,i)=>!p.completed[`c:${id}:${i}`]);return n<0?0:n;};
const nextMethod=()=>C.METHODS.find(m=>doneCount(m.id)<C.TASKS[m.id].length)||C.METHODS[0];
const level=()=>1+Math.floor(p.xp/200);
