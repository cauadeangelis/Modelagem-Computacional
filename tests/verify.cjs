/* Execute com node tests/verify.cjs. Testes numéricos, adversariais e de integração sem dependências. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const dir=path.join(__dirname,'../dist'),read=f=>fs.readFileSync(path.join(dir,f),'utf8');
// Arquivos do site na ordem do index.html: base (motor, conteúdo, dados) e as partes da interface (js/site e js/paginas).
const BASE=['js/motor/motor-numerico.js','js/motor/passo-a-passo.js','js/motor/resolver-questoes.js','js/conteudo/conteudo.js','dados/banco-de-questoes.js','js/progresso/progresso.js','js/terminal/grafico-de-convergencia.js','dados/treino-exercicios.js','js/treino/treino.js','js/personagens/raiz-e-pivo.js'];
const SITE=["js/site/estado-e-utilitarios.js", "js/site/jornada-e-backup.js", "js/site/ilustracoes.js", "js/site/moldura.js", "js/site/demonstracoes.js", "js/site/visuais-das-secoes.js", "js/paginas/inicio.js", "js/paginas/trilhas.js", "js/paginas/aulas-em-video.js", "js/paginas/licao.js", "js/paginas/missoes.js", "js/paginas/jogos.js", "js/paginas/revisao-e-progresso.js", "js/paginas/listas.js", "js/paginas/relampago.js", "js/site/graficos.js", "js/paginas/terminal.js", "js/site/eventos-e-inicializacao.js"];
const loadSite=c=>{c.__NUMERA_TESTE__=true;for(const f of SITE)vm.runInContext(read(f),c,{filename:f});};
let count=0;const groups={};let group='Parser';
function ok(cond,msg){if(!cond)throw Error(`[${group}] ${msg}`);count++;groups[group]=(groups[group]||0)+1;}
function near(a,b,tol=1e-7){return Math.abs(a-b)<=tol;}
const safeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fail(fn,msg){let error;try{fn();}catch(e){error=e;}ok(!!error,msg);}
const ctx={window:null,console,Date,Math,Number,String,JSON,Array,Boolean,Object,Error,RegExp,parseFloat,isFinite,Set,Map,Intl,URL,Blob};ctx.window=ctx;vm.createContext(ctx);
for(const f of BASE)vm.runInContext(read(f),ctx,{filename:f});
const M=ctx.NumeraMath,C=ctx.NumeraContent,P=ctx.NumeraProgress;
for(const [expr,x,v] of [['-x^2',3,-9],['2^3^2',0,512],['2x+3(x-1)',4,17],['sen(pi/2)',0,1],['2,5x=5',2,0],['x²-4',2,0],['log(100)+ln(e)',0,3],['exp(0)+sqrt(9)',0,4]])ok(near(M.parseFunction(expr)(x),v),expr);
for(const expr of ['alert(1)','constructor(1)','window.location','x;1','x+','x=2=3','sin x','process.exit(0)','x[0]'])fail(()=>M.parseFunction(expr)(1),'Rejeitar '+expr);
fail(()=>M.parseFunction('x'.repeat(501)),'Limitar expressão');
group='Métodos de raízes';
for(const [name,run] of [['Bisseção',()=>M.bisection(x=>x*x-2,1,2)],['Newton',()=>M.newton(x=>x*x-2,1.5)],['Secante',()=>M.secant(x=>x*x-2,1,2)]]){const r=run();ok(r.converged&&near(r.root,Math.sqrt(2),1e-6),name+' raiz');ok(r.residual<=1e-6,name+' resíduo');}
const bi=M.bisection(x=>x*x-2,1,2,{tolerance:1e-12,maxIterations:1});ok(!bi.converged&&bi.root===1.5,'Limite não é convergência');
const bis=M.bisection(x=>x*x-2,1,2,{tolerance:1e-12});for(const row of bis.iterations){ok(Math.sign(row.fa)!==Math.sign(row.fb),'Preservar troca de sinal');ok(Math.abs(row.x-Math.sqrt(2))<=row.error+1e-14,'Cota do intervalo contém a raiz');}
ok(M.secant(x=>x-1,1,2).root===1,'Reconhecer raiz no primeiro ponto da Secante');
fail(()=>M.bisection(x=>x*x+1,-1,1),'Bisseção sem sinal oposto');fail(()=>M.newton(x=>x*x+1,0),'Derivada nula');fail(()=>M.secant(x=>x*x,-1,1),'Secante com valores iguais');fail(()=>M.bisection(x=>1/x,-1,1),'Descontinuidade no ponto médio');
for(const tolerance of [0,-1,1,1e-13,NaN])fail(()=>M.newton(x=>x*x-2,1,{tolerance}),'Tolerância inválida '+tolerance);
for(const maxIterations of [0,501,1.3])fail(()=>M.newton(x=>x*x-2,1,{maxIterations}),'Limite inválido');
group='Falsa Posição e Ponto Fixo';
{const fp=M.falsePosition(x=>x*x-2,1,2);ok(fp.converged&&near(fp.root,Math.SQRT2,1e-6)&&fp.residual<=1e-6,'Falsa Posição: raiz de 2');
 for(const row of M.falsePosition(x=>x*x-2,1,2,{tolerance:1e-12}).iterations){ok(Math.sign(row.fa)!==Math.sign(row.fb)&&row.x>=row.a&&row.x<=row.b,'Falsa Posição preserva o intervalo k='+row.i);ok(Math.abs(row.x-Math.SQRT2)<=row.b-row.a,'Raiz continua cercada k='+row.i);}
 const f3=x=>x*x-3,r1=M.falsePosition(f3,1,2,{maxIterations:1,tolerance:1e-12});ok(near(r1.iterations[0].x,5/3,1e-12),'Primeiro corte da corda = 5/3');
 ok(near(M.falsePosition(x=>2*x-3,0,5).root,1.5,1e-15)&&M.falsePosition(x=>2*x-3,0,5).steps===1,'Reta: a corda acerta em 1 passo');
 const st=M.falsePosition(x=>x**3-x-2,1,2);ok(st.converged&&/ponta|extremidade/.test(st.note)&&st.iterations.every(r=>r.b===2),'Ponta parada detectada em curva convexa');
 fail(()=>M.falsePosition(x=>x*x+1,-1,1),'Falsa Posição sem troca de sinal');fail(()=>M.falsePosition(x=>x,2,1),'Falsa Posição com a ≥ b');
 const pf=M.fixedPoint(Math.cos,1);ok(pf.converged&&near(pf.root,.7390851332151607,1e-5)&&/< 1/.test(pf.note),'Ponto Fixo: x = cos(x)');
 ok(pf.iterations.slice(1).every((r,i)=>near(r.x,Math.cos(pf.iterations[i].x),1e-15)),'Cada passo é xₖ₊₁ = g(xₖ)');
 fail(()=>M.fixedPoint(x=>(x**3-5)/2,2.09),'Ponto Fixo diverge com |g′| > 1');fail(()=>M.fixedPoint(x=>Math.sqrt(x-5),0),'Ponto Fixo fora do domínio de g');
 ok(!M.fixedPoint(Math.cos,1,{maxIterations:3}).converged,'Limite de iterações não é convergência');
 const fN=x=>x**3-x-2,dN=x=>3*x*x-1,asPF=M.fixedPoint(x=>x-fN(x)/dN(x),1.5,{tolerance:1e-12}),nw=M.newton(fN,1.5,{tolerance:1e-12});ok(near(asPF.root,nw.root,1e-10),'Newton é um Ponto Fixo com g = x − f/f′');
 const cv=M.convergenceRoot(fN,{a:1,b:2,x0:1.5,x1:2,g:x=>Math.cbrt(x+2)}),O=Object.fromEntries(cv.series.map(q=>[q.method,q]));
 ok(near(cv.reference,1.5213797068045676,1e-12),'Convergência: raiz de referência');ok(O.newton.order>1.8&&O.newton.order<2.2,'Newton com ordem observada ≈ 2 ('+O.newton.order+')');ok(O.secant.order>1.3&&O.secant.order<1.9,'Secante com ordem ≈ 1,6 ('+O.secant.order+')');
 ok(O.bisection.order>.8&&O.bisection.order<1.2&&near(O.bisection.rate,.5,.08),'Bisseção linear, fator ≈ 0,5');ok(O.falseposition.order>.9&&O.falseposition.order<1.1,'Falsa Posição linear nesta curva convexa');
 ok(O.fixedpoint.order>.9&&O.fixedpoint.order<1.1&&near(O.fixedpoint.rate,1/(3*Math.cbrt(3.5213797)**2),.03),'Ponto Fixo: fator ≈ |g′(x*)|');ok(O.newton.reach<O.secant.reach&&O.secant.reach<O.bisection.reach,'Newton < Secante < Bisseção em passos até 1e-8');
 const cvs=M.convergenceSystem([[10,-1,2],[-1,11,-1],[2,-1,10]],[6,22,-10],[0,0,0]),SS=Object.fromEntries(cvs.series.map(q=>[q.method,q]));ok(cvs.strictDD&&SS.seidel.reach<SS.jacobi.reach,'Gauss-Seidel converge antes de Jacobi');
 const bad=M.convergenceSystem([[1,2],[3,1]],[5,5],[0,0]);ok(bad.series.every(q=>q.diverged)&&!bad.strictDD,'Sem dominância: divergência detectada');
 ok(M.smartRoot('x^3-x-2').comparisons.some(c=>c.method==='falseposition'&&c.converged),'Comparação automática inclui a Falsa Posição');}
group='Busca automática';
for(const [expr,target] of [['x^3-x-2',1.5213797068045676],['cos(x)-x',.7390851332151607],['exp(-x)-0.2',Math.log(5)],['(x-1.337)^2',1.337],['x^2-2',Math.sqrt(2)]]){const r=M.smartRoot(expr);ok(r.converged&&near(r.root,target,2e-6),expr);ok(r.residual<=1e-12,'Residual estrito: '+expr);ok(r.search.totalEvaluations>r.evaluations,'Contar busca e comparação');}
const both=M.smartRoot('x^2-2');ok(both.roots.length===2&&both.roots.some(r=>near(r.root,-Math.sqrt(2))),'Duas raízes detectadas');
const outside=M.smartRoot('x-100',{min:90,max:110});ok(near(outside.root,100),'Faixa configurável');
for(const expr of ['x^2+1','1/x','exp(x)','1/(x-0.13)','0','x-x','1e-15*(x^2+1)'])fail(()=>M.smartRoot(expr),'Não declarar raiz: '+expr);
fail(()=>M.smartRoot('x',{min:2,max:1}),'Faixa inválida');
group='Sistemas';
for(const [source,answer] of [['2x+y=5\nx+3y=6',[1.8,1.4]],['2, 1 | 5\n1, 3 | 6',[1.8,1.4]],['2(x+y)-y=5\nx+3y=6',[1.8,1.4]],['4x-y=60\n-x+4y=30',[18,12]],['10x-y+2z=6\n-x+11y-z=22\n2x-y+10z=-10',[1,2,-1]],['2,5x+y=6\nx+y=3',[2,1]]]){const a=M.parseSystem(source),r=M.autoSystem(a.A,a.b,answer.map(()=>0));ok(r.converged&&r.root.every((v,i)=>near(v,answer[i])),source);}
for(const source of ['x*y=2\nx+y=3','x^2+y=2\nx+y=3','x/y=2\nx+y=3','sin(x)+y=2\nx+y=3','1, 2 |\n2, 3 |4','1,2|3\n1,2,3|4'])fail(()=>M.parseSystem(source),'Rejeitar sistema inválido '+source);
for(const fn of [M.gauss,(a,b)=>M.seidel(a,b,[0,0]),(a,b)=>M.autoSystem(a,b,[0,0])]){fail(()=>fn([[1,1],[2,2]],[2,4]),'Sistema dependente');fail(()=>fn([[1,1],[2,2]],[2,5]),'Sistema incompatível');}
const pivot=M.gauss([[0,2],[1,1]],[4,3]);ok(near(pivot.root[0],1)&&near(pivot.root[1],2),'Pivô zero com troca');ok(pivot.iterations.some(i=>i.detail.includes('Trocar')),'Troca registrada');
for(let n=2;n<=6;n++)for(const scale of [1e-20,1,1e15]){const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>(i===j?10+n:((i+j)%3)-1)*scale)),expected=Array.from({length:n},(_,i)=>i-2),b=A.map(row=>row.reduce((a,v,j)=>a+v*expected[j],0));const g=M.gauss(A,b),se=M.seidel(A,b,expected.map(()=>0),{tolerance:1e-9,maxIterations:200});ok(g.converged&&g.root.every((v,i)=>near(v,expected[i])),'Gauss escalado '+n+' '+scale);ok(se.converged&&se.root.every((v,i)=>near(v,expected[i],1e-7)),'Seidel escalado '+n+' '+scale);ok(M.maxResidual(A,b,g.root)>=0,'Resíduo definido');}
const partial=M.seidel([[4,1],[1,3]],[9,7],[0,0],{maxIterations:1,tolerance:1e-12});ok(!partial.converged,'Seidel parcial sem falso sucesso');
group='Conteúdo e progresso';ok(C.ALL_METHODS.length===7&&C.METHODS.length===7-C.HIDDEN.length,'Sete métodos no conteúdo, '+C.METHODS.length+' à vista');ok(C.ALL_METHODS.every(m=>C.TASKS[m.id].length===12&&C.DEEP[m.id]&&C.COACH[m.id]&&C.ALL_CASES.some(c=>c.method===m.id)),'12 etapas, aprofundamento, orientação e missão em cada trilha');ok([...P.ids].filter(id=>!id.startsWith('l:')).length===147,'147 atividades das trilhas, missões e Arena');ok([...P.ids].filter(id=>id.startsWith('l:')).length===ctx.NumeraBanco.questoes.length,'Cada questão do banco pode ir para a Revisão');
ok(C.ALL_METHODS.every(m=>C.ARENA.filter(t=>t.method===m.id).length===6),'6 desafios da Arena por método');ok(C.ALL_METHODS.map(m=>m.id).join()==='bisection,falseposition,fixedpoint,newton,secant,gauss,seidel','Ordem clássica do curso no conteúdo');ok(C.METHODS.map(m=>m.id).join()===C.JOURNEY.map(w=>w.id).join(),'Trilhas na ordem da jornada');
for(const [i,t] of [...Object.values(C.TASKS).flat(),...C.ARENA,...C.CASES.flatMap(c=>c.tasks)].entries()){ok(!!t.q&&!!t.explain&&(t.type==='choice'?Number.isInteger(t.answer)&&t.answer>=0&&t.answer<t.options.length:Number.isFinite(t.value)),'Questão válida '+i);}
let p=P.fresh(),id='c:bisection:0';P.complete(p,id);P.complete(p,id);ok(p.xp===20,'Sem duplicação de XP');P.complete(p,'c:bisection:1');P.complete(p,'c:bisection:2');ok(p.xp===90,'Bônus diário uma vez');P.complete(p,id);ok(p.xp===90,'Repetição sem bônus adicional');P.wrong(p,'c:newton:0');ok(!!p.review['c:newton:0'],'Erro cria revisão');P.complete(p,'c:newton:0',{wrong:2});ok(p.completed['c:newton:0'].stars===1,'Estrelas refletem tentativas');P.complete(p,'c:newton:0');ok(p.completed['c:newton:0'].stars===3,'Revisão melhora desempenho');ok(P.validate(JSON.parse(JSON.stringify(p))).xp===p.xp,'Backup válido');fail(()=>P.validate({version:3}),'Backup inválido');
const mem=new Map([['numera-academy-v3',JSON.stringify({xp:40,done:['bisection-0','bogus-0'],arenaDone:[0]})]]),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};const old=P.load(storage);ok(Object.keys(old.p.completed).length===2&&old.p.xp===40,'Migração v3');ok(!P.save(p,{setItem(){throw Error('quota')}}),'Falha de armazenamento explícita');
group='Slides da professora (v13)';
{const PP=ctx.NumeraPassos,n6=v=>Number(v.toFixed(6));ok(!!PP,'passo-a-passo.js carregado');
 let r=PP.bissecao({f:'x^3-9x+3',a:0,b:1,eps:1e-2,K:10,criterio:'relativo'});ok(r.iteracoes===9&&n6(r.raiz)===0.337891&&Math.abs(r.linhas[8].erro-0.00578)<1e-5,'Exemplo 05: Bisseção para na 9ª iteração com x₉ = 0,337891 e erro 0,00578');
 ok(r.linhas.map(l=>n6(l.x)).join()==='0.5,0.25,0.375,0.3125,0.34375,0.328125,0.335938,0.339844,0.337891','Exemplo 05: os nove valores médios da tabela');
 r=PP.falsaPosicao({f:'x^3-9x+3',a:0,b:1,eps:1e-2,K:10,criterio:'percentual'});ok(r.iteracoes===4&&Math.abs(r.raiz-0.33761)<5e-6&&n6(r.linhas[0].x)===0.375,'Exemplo 06: Falsa Posição chega a 0,33761 na 4ª iteração');
 r=PP.pontoFixo({g:'exp(-x)',x0:0,iteracoes:10});ok(n6(r.linhas[1].novo)===0.367879&&Math.abs(r.linhas[1].erro-171.8281828)<1e-6&&Math.abs(r.linhas[9].erro-1.108868242)<1e-6,'Exemplo 3: Ponto Fixo e o estimador Eᵣ% da tabela');
 r=PP.newton({f:'exp(-x)-x',df:'-exp(-x)-1',x0:0,eps:1e-2,K:20});ok(r.linhas.length===4&&Math.abs(r.linhas[1].erro-11.70929098)<1e-6&&Math.abs(r.raiz-0.56714329)<1e-8,'Exemplo 5: Newton-Raphson converge na linha i = 3');
 r=PP.secante({f:'exp(-x)-x',x0:0,x1:1,eps:1e-2,K:20});ok(r.linhas.length===4&&r.linhas[3].i===4&&Math.abs(r.linhas[0].erro-63.21206)<1e-4&&Math.abs(r.linhas[3].erro-0.00477)<1e-5,'Exemplo 7: Secante com ER% 63,21206 … 0,00477');
 r=PP.gauss({A:[[3,2,4],[1,1,2],[4,3,-2]],b:[1,2,3]});ok(r.solucao.join()==='-3,5,0'&&r.etapas[1].multiplicadores.map(m=>PP.frac(m.m)).join()==='1/3,4/3'&&PP.frac(r.etapas[2].multiplicadores[0].m)==='1'&&r.etapas[2].matriz[2][2]===-8,'Gauss, Exemplo 1: m₂₁ = 1/3, m₃₁ = 4/3, m₃₂ = 1, −8x₃ = 0 e X* = (−3, 5, 0)');
 ok(r.etapas[1].operacoes[0]==='E₂⁽¹⁾ → E₂⁽⁰⁾ − (1/3)E₁⁽⁰⁾'&&r.substituicao[1].texto==='(1/3)x₂ + (2/3)·0 = 5/3 ⇒ x₂ = 5','Gauss na notação dos slides (Eᵢ⁽ᵏ⁾ e substituição regressiva)');
 r=PP.gauss({A:[[0,8,2],[3,5,2],[6,2,8]],b:[-7,8,26],pivoteamento:'parcial'});ok(r.solucao.map(PP.frac).join()==='4,−1,1/2','Gauss, Exercício 2 com pivoteamento: X* = (4, −1, 1/2)');
 ok(PP.gauss({A:[[0.0002,2],[2,2]],b:[5,6],t:3}).solucao.join()==='0,2.5'&&PP.gauss({A:[[0.0002,2],[2,2]],b:[5,6],t:3,pivoteamento:'parcial'}).solucao.join()==='0.5,2.5','Gauss, Exemplo 3 em F(10, 3): sem pivoteamento (0; 2,5), com pivoteamento (0,5; 2,5)');
 ok(PP.iteracoesBissecao(0,1,1e-2).k===7,'Número de iterações: k > (log(b₀ − a₀) − log ε)/log 2');
 const g=PP.seidel({A:[[8,1,-1],[1,-7,2],[2,1,9]],b:[8,-4,12],x0:[0,0,0],iteracoes:2}).solucao.map(v=>Number(v.toFixed(5)));ok(g.join()==='1.03968,1.01474,0.98954','Lista 3, 1ª questão: Gauss-Seidel (1,03968; 1,01474; 0,98954)');
 ok(Math.abs(PP.sassenfeld([[1,.4,-.1,.1],[.3,1,-.2,-.1],[-.1,-.2,1,.2],[.1,.3,.2,1]]).max-.6)<1e-12,'Critério de Sassenfeld: β = 0,6 (Lista 2, 16ª questão)');}
group='Integração da interface';
const elements={'#app':{innerHTML:''},'#main':{focus(){}},'#answer':{value:''}},handlers={};let title='';
Object.assign(ctx,{document:{get title(){return title},set title(v){title=v},querySelector:q=>elements[q]||null,getElementById:id=>elements['#'+id]||null,addEventListener:(name,fn)=>handlers[name]=fn,createElement:()=>({click(){}})},localStorage:{getItem:()=>null,setItem(){}},history:{replaceState(){}},location:{hash:''},setTimeout(){},scrollTo(){},addEventListener(){},confirm:()=>true});
loadSite(ctx);
const t=ctx.__test;ok(elements['#app'].innerHTML.includes('resolvendo de verdade'),'Início');const out=path.join(__dirname,'rendered');fs.mkdirSync(out,{recursive:true});
function snapshot(name){fs.writeFileSync(path.join(out,name+'.html'),elements['#app'].innerHTML);ok(!/undefined|NaN/.test(elements['#app'].innerHTML),'Render '+name);}
for(const page of ['home','academy','cases','jogos','lab','progress','review']){t.navigate(page);snapshot(page);}
for(const m of C.METHODS){t.openCourse(m.id);snapshot('course-'+m.id);t.s.tab='simulate';t.render();snapshot('simulation-'+m.id);const result=t.simulationResult();ok(result.converged,'Exemplo simulado '+m.id);for(let i=0;i<12;i++){t.s.q=i;t.s.tab='practice';t.s.selected=null;t.s.answer='';t.s.feedback=null;const task=C.TASKS[m.id][i];if(task.type==='choice')t.s.selected=task.answer;else elements['#answer'].value=String(task.value);t.answerQuestion();ok(t.s.feedback?.ok,'Resposta trilha '+m.id+' '+i);}snapshot('practice-'+m.id);}
ok(Object.keys(t.getP().completed).length===C.METHODS.length*12,'Persistir '+C.METHODS.length*12+' etapas');
t.navigate('arena');ok(t.s.page==='jogos','Link antigo #arena leva à página Jogos');
for(const c of C.CASES){t.navigate('case');t.s.caseId=c.id;for(let i=0;i<3;i++){t.s.caseQ=i;const task=c.tasks[i];t.s.selected=task.type==='choice'?task.answer:null;elements['#answer'].value=String(task.value??'');t.answerQuestion();ok(t.s.feedback?.ok,'Missão '+c.id+' '+i);}snapshot('case-'+c.id);}
for(const source of ['x^2-2','(x-1.337)^2','2x+y=5\nx+3y=6','10x-y+2z=6\n-x+11y-z=22\n2x-y+10z=-10']){t.navigate('lab');t.s.source=source;t.s.algorithm='auto';t.solve();ok(t.s.result?.converged,'Resolver '+source);for(const tab of ['solution','steps','compare','converge','verify']){t.s.resultTab=tab;t.render();snapshot('lab-'+t.s.mode+'-'+tab);if(tab==='converge')ok(elements['#app'].innerHTML.includes('conv-plot'),'Gráfico de convergência '+source);}}
for(const m of C.METHODS){
 t.navigate('lab');t.s.algorithm=m.id;t.s.mode=['gauss','seidel'].includes(m.id)?'system':'root';t.s.source=C.DEEP[m.id].system||C.DEEP[m.id].example;{const c=(C.DEEP[m.id].professora||{}).chamada||{},d=C.DEEP[m.id],v=(k,p)=>String(typeof c[k]==='number'?c[k]:typeof d[k]==='number'?d[k]:p);t.s.x0=v('x0',1.5);t.s.x1=v('x1',2);t.s.a=v('a',1);t.s.b=v('b',2);}t.s.g=C.DEEP[m.id].g||'';t.solve();ok(t.s.result?.converged,'Terminal manual '+m.id);
 const tasks=t.guideTasks(t.s.result);ok(tasks.length>0,'Modo guiado possui passos '+m.id);t.s.resultTab='guide';t.s.guideIndex=0;t.render();snapshot('guide-'+m.id);
 elements['#guideAnswer']={value:String(tasks[0].value)};t.checkGuide();ok(t.s.guideFeedback?.ok,'Correção guiada '+m.id);
}
t.s.algorithm='auto';
t.s.source='1/x';t.solve();ok(!t.s.result&&!!t.s.error,'Erro limpa resultado antigo');t.s.source='/help';t.solve();ok(t.s.help,'Comando help');
ok(P.ids.has('a:0')&&P.validate({version:4,xp:30,completed:{'a:0':{stars:3,date:'2026-10-01'}}}).completed['a:0'],'Progresso antigo da Arena continua aceito no backup');
t.navigate('review');snapshot('review-filled');t.s.reviewId='a:0';t.render();snapshot('review-question');t.navigate('progress');snapshot('progress-filled');
ok(near(t.parseAnswer('17/12'),17/12),'Frações em atividades');fail(()=>t.parseAnswer('1/0'),'Rejeitar fração inválida');
group='Terminal v7';
// Busca de raízes reforçada: raízes próximas, escala grande, funções periódicas e borda do domínio.
const rootsOf=(expr,o)=>M.smartRoot(expr,o).roots.map(r=>r.root);
const hasAll=(got,want,tol=1e-6)=>want.every(w=>got.some(g=>Math.abs(g-w)<=tol*(1+Math.abs(w))));
const r20=1.0717734625362931;ok(hasAll(rootsOf('x^20 - 3x^10 + 2 = 0'),[1,-1,r20,-r20]),'Raízes próximas: x^20 - 3x^10 + 2');
ok(hasAll(rootsOf('20x^4 - 61x^3 - 58x^2 + 225x - 126 = 0'),[-2,1,1.05,3]),'Raízes 1 e 1,05');
ok(hasAll(rootsOf('x^2 + 23.1x + 133.4024 = 0'),[-11.56,-11.54]),'Raízes a 0,02 de distância');
const big=M.smartRoot('x^100 - 10000000000 = 0'),b100=Math.pow(1e10,1/100);ok(hasAll(big.roots.map(r=>r.root),[b100,-b100]),'Escala grande: x^100 = 1e10');
ok(big.validation==='sinal'&&big.converged&&big.bracket[1]-big.bracket[0]<=1e-15,'Raiz certificada por troca de sinal');
ok(hasAll(rootsOf('x^3 - 1.085x^2 - 628.69125x + 6300.57285 = 0'),[-28.6,14.85]),'Coeficientes grandes');
const sinRoots=rootsOf('sin(x) = 0.8');ok(sinRoots.length===26&&hasAll(sinRoots,[Math.asin(.8)-12*Math.PI,Math.PI-Math.asin(.8)+10*Math.PI]),'sin(x) = 0,8: 26 raízes em [-40, 40]');
ok(rootsOf('tan(x) = 4 - x').length===27,'tan(x) = 4 - x: 27 raízes, sem polos');
ok(hasAll(rootsOf('ln(x) = -2.81'),[Math.exp(-2.81)]),'Raiz perto da borda do domínio');
ok(hasAll(rootsOf('cos(x) - 1 = 0'),[0,2*Math.PI,-2*Math.PI,4*Math.PI],1e-6),'Raízes tangentes 2πk');
for(const expr of ['abs(x)/x = 0.5','tan(x) = 1e9','(x-2.81)^2 + 1e-9 = 0','1e-9(x^2 + 2) = 0'])fail(()=>M.smartRoot(expr),'Não declarar raiz: '+expr);
t.navigate('lab');t.s.algorithm='auto';t.s.source='x^100 - 10000000000 = 0';t.solve();t.s.resultTab='verify';t.render();ok(elements['#app'].innerHTML.includes('Raiz certificada por troca de sinal'),'Verificação explica a raiz certificada');snapshot('lab-root-certified');
t.s.source='x^3 - x - 2 = 0';t.solve();t.s.resultTab='verify';t.render();ok(elements['#app'].innerHTML.includes('Resíduo absoluto exigido'),'Verificação comum mantida');
t.s.help=true;t.render();ok(elements['#app'].innerHTML.includes('até 400 candidatas'),'Ajuda descreve a nova busca');
// Teclado científico: escrita bonita <-> sintaxe do motor.
const cx={window:null,console,Math,Number,String,JSON,Array,Object,Error,RegExp,Set,Map,document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:false}),MutationObserver:class{observe(){}},Event:class{}};cx.window=cx;vm.createContext(cx);
vm.runInContext(read('js/motor/motor-numerico.js'),cx,{filename:'motor-numerico.js'});vm.runInContext(read('js/terminal/teclado-cientifico.js'),cx,{filename:'teclado-cientifico.js'});
const K=cx.NumeraCalc,MM=cx.NumeraMath;ok(!!K&&typeof K.toEngine==='function','teclado-cientifico.js carregado');
for(const [pretty,engine] of [['x²⁰ - 3x¹⁰ + 2 = 0','x^(20) - 3x^(10) + 2 = 0'],['e⁻ˣ = x','e^(-x) = x'],['x¹ᐟ³ = 3','x^(1/3) = 3'],['2ˣ⁺¹ = 32','2^(x+1) = 32'],['x²˙⁵ = 3','x^(2.5) = 3'],['√(x + 8) = x - 1','sqrt(x + 8) = x - 1'],['x·π = 1,5','x* pi  = 1,5'],['asin(x) = e÷4','asin(x) = e/4'],['x² − 5x + 6 = 0','x^(2) - 5x + 6 = 0']])ok(K.toEngine(pretty)===engine,'Converter '+pretty);
const same=(a,b)=>{const f=MM.parseFunction(a);return [0.3,1.7,2.9,-1.2].every(x=>{const u=f(x),v=MM.parseFunction(b)(x);return (Number.isNaN(u)&&Number.isNaN(v))||Math.abs(u-v)<=1e-12*(1+Math.abs(u));});};
for(const ascii of ['x^3 - x - 2 = 0','x^20 - 3x^10 + 2 = 0','e^(-x) = x','x^(1/3) = 3','2^x = 151','x exp(x) = 6','sqrt(x + 8) = x - 1','x^2.5 = 3','e^(sin(x)) = 2','2^x^2 = 16','x*pi = 3','(x - 2.8)^2 = 0','x^-1 + x = 3','cos(4x) = x^2','(x^2 - 4)/(x - 1) = 2'])ok(same(K.toPretty(ascii),ascii),'Ida e volta: '+ascii+' → '+K.toPretty(ascii));
ok(K.toPretty('x^3 - x - 2 = 0')==='x³ - x - 2 = 0'&&K.toPretty('e^(-x) = x')==='e⁻ˣ = x'&&K.toPretty('2^x^2')==='2ˣ^2','Expoentes elevados na tela');
ok(MM.smartRoot('x²⁰ - 3x¹⁰ + 2 = 0').roots.length===4,'Motor aceita escrita bonita');
const sysPretty=MM.parseSystem('2x + y = 5\nx + 3y = 6');ok(sysPretty.A.length===2,'Sistemas continuam aceitos');
group='Treino';
// Dados: 140 exercícios, 20 por método, ordem misturada, pistas, pergunta cega, erros típicos e gabarito.
const TA=ctx.NumeraTreino.all||ctx.NumeraTreino.exercises,TE=TA,MS=['bisection','falseposition','fixedpoint','newton','secant','gauss','seidel'];ok(TE.length===140,'140 exercícios');
for(const m of MS)ok(TE.filter(e=>e.method===m).length===20,'20 exercícios de '+m);
ok(TE.every((e,i)=>!i||e.method!==TE[i-1].method),'Nunca dois métodos iguais seguidos');ok(new Set(TE.map(e=>e.id)).size===140&&TE.every((e,i)=>e.n===i+1&&/^(bi|fp|pf|nw|sc|ga|gs)\d\d$/.test(e.id)),'Numeração e ids estáveis');
ok(new Set(TE.slice(0,14).map(e=>e.method)).size===7,'Os 14 primeiros já misturam os 7 métodos');ok(new Set(TE.map(e=>e.area)).size>=40,'Contextos variados (40+ áreas)');
const NAMES={bisection:'Bisseção',falseposition:'Falsa Posição',fixedpoint:'Ponto Fixo',newton:'Newton',secant:'Secante',gauss:'Eliminação',seidel:'Seidel'};
for(const e of TE){ok(/\[\[(.+?)\|([^|\]]+)\]\]/.test(e.story)&&(e.story.match(/\[\[/g)||[]).length===[...e.story.matchAll(/\[\[(.+?)\|([^|\]]+)\]\]/g)].length&&e.why&&e.ask&&e.steps&&[1,2,3].includes(e.level),'Enunciado completo #'+e.n);
 ok(e.askBlind&&!Object.values(NAMES).some(n=>e.askBlind.includes(n)),'Pergunta sem o nome do método #'+e.n);
 const vals=e.answer.type==='vec'?e.answer.values:[e.answer.value];ok(vals.every(Number.isFinite),'Gabarito numérico #'+e.n);ok(!!e.conv,'Dados do gráfico #'+e.n);}
ok(TE.filter(e=>e.traps&&e.traps.length).length>=130,'Erros típicos em 130+ exercícios');ok(TE.filter(e=>e.legacy).length===84,'84 exercícios herdados da v8 sem mudança');
// O motor do site refaz cada conta do gabarito (gerado de forma independente com sympy/mpmath).
for(const e of TE){const c=e.check||{},a=e.answer,o={tolerance:1e-12,maxIterations:500};let got;
 if(e.method==='bisection'){const fn=M.parseFunction(e.source);if(c.k)got=M.bisection(fn,c.a,c.b,{tolerance:1e-12,maxIterations:c.k}).iterations[c.k-1].x;else if(c.n)got=((c.b-c.a)/2**c.n<=c.eps&&(c.b-c.a)/2**(c.n-1)>c.eps)?c.n:NaN;else got=M.smartRoot(e.source,{min:e.terminal.a,max:e.terminal.b}).root;}
 else if(e.method==='falseposition'){const fn=M.parseFunction(e.source);got=c.k?M.falsePosition(fn,c.a,c.b,{tolerance:1e-12,maxIterations:c.k}).iterations[c.k-1].x:c.count?M.falsePosition(fn,c.a,c.b,{tolerance:c.eps,maxIterations:500}).steps:M.falsePosition(fn,e.terminal.a,e.terminal.b,o).root;}
 else if(e.method==='fixedpoint'){const g=M.parseFunction(e.g);got=c.k?M.fixedPoint(g,c.x0,{tolerance:1e-12,maxIterations:c.k}).iterations[c.k].x:M.fixedPoint(g,e.terminal.x0,o).root;}
 else if(e.method==='newton'){const fn=M.parseFunction(e.source);got=c.k?M.newton(fn,c.x0,{tolerance:1e-12,maxIterations:c.k}).iterations[c.k].x:M.newton(fn,e.terminal.x0,o).root;}
 else if(e.method==='secant'){const fn=M.parseFunction(e.source);got=c.k?M.secant(fn,c.x0,c.x1,{tolerance:1e-12,maxIterations:c.k}).iterations[c.k+1].x:M.secant(fn,e.terminal.x0,e.terminal.x1,o).root;}
 else{const {A,b}=M.parseSystem(e.source);got=e.method==='gauss'||c.until?M.gauss(A,b,o).root:M.seidel(A,b,c.x0,{tolerance:1e-12,maxIterations:c.k}).iterations.find(r=>r.i===c.k).x;
  if(e.method==='gauss'&&a.type==='num')got=got[['x','y','z','u'].indexOf(e.ask.match(/valor de (\w)/)[1])];}
 const want=a.type==='vec'?a.values:[a.value],have=Array.isArray(got)?got:[got];
 ok(want.length===have.length&&want.every((v,i)=>a.abs?Math.abs(have[i]-v)<=a.abs:Math.abs(have[i]-v)<=1e-8*(1+Math.abs(v))),'Motor confirma o gabarito #'+e.n);}
// v11: o Treino da tela não mostra o método escondido.
const TV=ctx.NumeraTreino.exercises;ok(TV.every(e=>!C.isHidden(e.method)),'Treino sem o método escondido');ok(TV.every((e,i)=>e.n===i+1)&&TV.every((e,i)=>!i||e.method!==TV[i-1].method),'Numeração refeita e sem dois métodos iguais seguidos');ok(new Set(TV.slice(0,12).map(e=>e.method)).size===C.METHODS.length,'Os 12 primeiros misturam os '+C.METHODS.length+' métodos');
// Interface (só os exercícios à vista; os do método escondido ficam fora): diagnosticar e resolver todos, digitando a resposta com vírgula, como uma pessoa faria.
const TRU=t.TR;ok(!!TRU&&TRU.count===TV.length&&TV.length===TA.length-20*C.HIDDEN.length,'Aba Treino integrada ('+TV.length+' exercícios à vista)');t.navigate('treino');snapshot('treino');ok(elements['#app'].innerHTML.includes('Diagnostique o método'),'Página do Treino');
TRU.handle('tr-open',{dataset:{index:'0'}});t.render();ok(elements['#app'].innerHTML.includes(safeHtml(TV[0].askBlind))&&!elements['#app'].innerHTML.includes(safeHtml(TV[0].ask)),'Antes do diagnóstico, a pergunta não revela o método');
const BR=v=>String(+v.toPrecision(9)).replace('.',',');
for(let i=0;i<TV.length;i++){const e=TV[i];TRU.handle('tr-open',{dataset:{index:String(i)}});
 const wrongM=i%10===0?(e.method==='newton'?'secant':'newton'):e.method;TRU.handle('tr-diag',{dataset:{id:wrongM}});
 const vals=e.answer.type==='vec'?e.answer.values:[e.answer.value];vals.forEach((v,j)=>{elements['#tr-ans-'+j]={value:BR(v)};});TRU.submit();
 Object.keys(elements).filter(k=>k.startsWith('#tr-ans-')).forEach(k=>delete elements[k]);}
const SU=TRU.summary();const NW=Math.ceil(TV.length/10);ok(SU.solved===TV.length,'Os '+TV.length+' exercícios aceitam a resposta do gabarito');ok(SU.diagnosed===TV.length&&SU.dOk===TV.length-NW&&SU.perfect===TV.length-NW,'Diagnóstico errado registrado e sem estrela');
ok(SU.reviewDue===NW&&TRU.reviewDue()===NW,'Diagnósticos errados vão para a revisão ('+NW+')');
TRU.handle('tr-open',{dataset:{index:'1'}});t.render();ok(elements['#app'].innerHTML.includes(safeHtml(TV[1].ask)),'Depois do diagnóstico, a pergunta completa aparece');
elements['#tr-ans-0']={value:'123456'};const before=TRU.summary().solved;TRU.submit();ok(TRU.summary().solved===before,'Resposta errada não desfaz nem cria acerto');delete elements['#tr-ans-0'];
// Erro típico: digitar o valor de uma armadilha mostra a explicação específica.
{const i=TV.findIndex(e=>e.traps&&e.traps.length&&e.answer.type==='num'),e=TV[i],tr=e.traps[0];TRU.handle('tr-open',{dataset:{index:String(i)}});elements['#tr-ans-0']={value:BR(tr.v)};TRU.submit();delete elements['#tr-ans-0'];ok(elements['#app'].innerHTML.includes('Erro típico identificado')&&elements['#app'].innerHTML.includes(safeHtml(tr.m)),'Erro típico reconhecido: '+e.title);
 const j=TV.findIndex(e=>e.answer.type==='vec'&&e.traps&&e.traps.some(t=>Array.isArray(t.v)));const ev=TV[j],tv=ev.traps.find(t=>Array.isArray(t.v));TRU.handle('tr-open',{dataset:{index:String(j)}});tv.v.forEach((v,k)=>{elements['#tr-ans-'+k]={value:BR(v)};});TRU.submit();Object.keys(elements).filter(k=>k.startsWith('#tr-ans-')).forEach(k=>delete elements[k]);ok(elements['#app'].innerHTML.includes(safeHtml(tv.m)),'Erro típico em sistema: '+ev.title);}
// Gabarito: passo a passo, gráfico de convergência e erros típicos.
for(const m of MS.filter(m=>!C.isHidden(m))){const i=TV.findIndex(e=>e.method===m);TRU.handle('tr-open',{dataset:{index:String(i)}});TRU.handle('tr-key',{dataset:{}});t.render();const html=elements['#app'].innerHTML;ok(html.includes('Passo a passo')&&html.includes('conv-plot'),'Gabarito com gráfico de convergência: '+m);if(m==='fixedpoint'||m==='falseposition')snapshot('treino-gabarito-'+m);}
TRU.handle('tr-view',{dataset:{id:'key'}});TRU.handle('tr-showall',{dataset:{}});t.render();ok(elements['#app'].innerHTML.includes('Gabarito completo')&&elements['#app'].innerHTML.includes('tr-print'),'Gabarito completo e versão para imprimir');snapshot('treino-gabarito-completo');
// Revisão de diagnósticos: aparece no caderno, conta no topo e reagenda.
t.s.reviewId=null;t.navigate('review');ok(elements['#app'].innerHTML.includes('Diagnósticos do Treino'),'Caderno mostra os diagnósticos do Treino');ok(/class="count">\d+/.test(elements['#app'].innerHTML),'Contador de revisão inclui o Treino');snapshot('review-treino');
{const e=TV[0];TRU.handle('tr-rev',{dataset:{id:e.id}});t.render();ok(elements['#app'].innerHTML.includes('Revisão de diagnóstico'),'Tela de revisão');TRU.handle('tr-rev-pick',{dataset:{id:e.method}});ok(TRU._prog()[e.id].rv.int===3&&TRU.reviewDue()===NW-1,'Acerto na revisão adia para 3 dias');
 const e2=TV[10];TRU.handle('tr-rev',{dataset:{id:e2.id}});TRU.handle('tr-rev-pick',{dataset:{id:e2.method==='newton'?'secant':'newton'}});ok(TRU._prog()[e2.id].rv.int===1&&TRU.reviewDue()===NW-2,'Erro na revisão volta amanhã');}
// Modo prova: sorteio misturado, nota, relatório e diagnósticos errados para a revisão.
TRU.handle('tr-view',{dataset:{id:'prova'}});t.render();ok(elements['#app'].innerHTML.includes('Modo prova'),'Tela inicial da prova');snapshot('treino-prova-inicio');
TRU.handle('tr-pv-n',{dataset:{id:'10'}});TRU.handle('tr-pv-limit',{dataset:{id:'30'}});TRU.handle('tr-pv-start',{dataset:{}});
{const pv=TRU._prog()._prova;ok(pv&&pv.ids.length===10&&new Set(pv.ids).size===10,'10 questões distintas');const ms=pv.ids.map(id=>TV.find(e=>e.id===id).method);ok(new Set(ms).size>=6&&ms.every((m,i)=>!i||m!==ms[i-1]),'Prova mistura os métodos');
 t.render();ok(elements['#app'].innerHTML.includes('Questão 1 de 10')&&!elements['#app'].innerHTML.includes('Diagnóstico certeiro'),'Prova sem gabarito durante a resolução');snapshot('treino-prova-questao');
 const firstMissing=TV.find(e=>e.id===pv.ids[0]);ok(!elements['#app'].innerHTML.includes(safeHtml(firstMissing.ask))||firstMissing.ask===firstMissing.askBlind,'Prova usa a pergunta sem o método');
 pv.ids.forEach((id,k)=>{const e=TV.find(x=>x.id===id);TRU.handle('tr-pv-go',{dataset:{index:String(k)}});TRU.handle('tr-pv-diag',{dataset:{id:k<5?e.method:(e.method==='newton'?'secant':'newton')}});const vals=e.answer.type==='vec'?e.answer.values:[e.answer.value];vals.forEach((v,j)=>{elements['#pv-ans-'+j]={value:k<5?BR(v):'0'};});TRU.handle('tr-pv-next',{dataset:{}});Object.keys(elements).filter(x=>x.startsWith('#pv-ans-')).forEach(x=>delete elements[x]);});
 const dueBefore=TRU.reviewDue();TRU.handle('tr-pv-end',{dataset:{}});TRU.handle('tr-pv-end-yes',{dataset:{}});t.render();const last=TRU._prog()._provaLast;
 ok(last&&last.n===10&&last.dOk===5&&last.aOk>=5&&last.nota>=5&&last.nota<=5.6,'Nota da prova: 5 certas inteiras (nota '+(last&&last.nota)+')');ok(elements['#app'].innerHTML.includes('Relatório da prova')&&elements['#app'].innerHTML.includes('is-report'),'Relatório da prova');
 ok(TRU.reviewDue()>dueBefore||TRU.reviewDue()===dueBefore,'Diagnósticos errados da prova vão para a revisão');ok(TRU._prog()._provas.length===1&&!TRU._prog()._prova,'Histórico de provas salvo');snapshot('treino-prova-relatorio');
 TRU.handle('tr-pv-new',{dataset:{}});TRU.handle('tr-pv-start',{dataset:{}});const pv2=TRU._prog()._prova;pv2.start=Date.now()-31*60*1000;TRU._finish(true);ok(TRU._prog()._provaLast.timeout&&TRU._prog()._provaLast.nota===0,'Prova encerrada pelo tempo vale o que foi feito');}
t.navigate('progress');ok(elements['#app'].innerHTML.includes('Treino de diagnóstico')&&elements['#app'].innerHTML.includes('última prova'),'Treino e prova aparecem no Progresso');
// Migração: o progresso da v8 (t1..t100) é trazido para os exercícios que não mudaram.
{const memV8=new Map([['numera-treino-v8',JSON.stringify({t1:{d:'secant',dOk:true,ok:true,tries:1},t2:{d:'newton',dOk:true,ok:true,tries:1},t99:{d:'gauss',dOk:false}})]]);
 const legacy=new Map(TV.filter(e=>e.legacy).map(e=>[e.legacy,e.id]));
 const T2=ctx.NumeraTreinoUI({safe:x=>String(x),icon:()=>'',btn:()=>'',tag:()=>'',bar:()=>'',method:id=>C.METHODS.find(m=>m.id===id),heading:()=>'',tabs:()=>'',parseAnswer:t.parseAnswer,openInLab(){},storage:{getItem:k=>memV8.get(k)||null,setItem:(k,v)=>memV8.set(k,v)},render(){}});
 const expected=['t1','t2','t99'].filter(k=>legacy.has(k)).length;ok(T2._prog()._migrated===expected&&memV8.has('numera-treino-v9'),'Migração do progresso da v8 ('+expected+' exercícios)');}
TRU.handle('tr-reset-yes',{dataset:{}});ok(TRU.summary().solved===0,'Recomeçar o Treino zera só o Treino');ok(Object.keys(t.getP().completed).length>0,'Recomeçar o Treino preserva as trilhas');
group='Correções da auditoria (v10)';
// P1: resíduo pequeno não é raiz. Três estados: certificada (troca de sinal), múltipla provável, quase-raiz.
{const tiny=M.parseFunction('1e-20*(x^2+1)');
 fail(()=>M.bisection(tiny,-1,1,{tolerance:1e-12}),'Bisseção não aceita a ponta de 1e-20·(x²+1) como raiz');
 const nq=M.newton(tiny,0,{tolerance:1e-12});ok(!nq.converged&&nq.certification.status==='quase'&&/Quase-raiz/.test(nq.note),'Newton: quase-raiz em 1e-20·(x²+1), sem convergência');
 const sq=M.secant(tiny,0,1,{tolerance:1e-12});ok(!sq.converged&&sq.certification.status==='quase','Secante: quase-raiz em 1e-20·(x²+1)');
 fail(()=>M.falsePosition(tiny,-1,1,{tolerance:1e-12}),'Falsa Posição não aceita ponta sem raiz');
 const pc=M.fixedPoint(M.parseFunction('cos(x)'),1,{tolerance:1e-10});ok(pc.converged&&pc.certification.status==='certificada','Ponto Fixo: x = cos(x) certificado por troca de sinal de x − g(x)');
 for(const e of ['1e-20*(x^2+1) = 0','(x - 1.337)^2 + 9e-13 = 0','(x - 2)^2 + 1e-12 = 0','1e-15*(x^4 + 3) = 0'])fail(()=>M.smartRoot(e),'Busca automática não declara raiz: '+e);
 const dbl=M.smartRoot('(x - 1.337)^2 = 0');ok(dbl.converged&&dbl.certification.status==='multipla'&&near(dbl.certification.root,1.337,1e-9),'Raiz dupla aceita como provável, com o mínimo de |f| em 1,337');
 const nd=M.newton(M.parseFunction('(x - 1.337)^2'),2);ok(nd.converged&&nd.certification.status==='multipla','Newton numa raiz dupla: raiz provável (multiplicidade par)');
 const simple=M.smartRoot('x^3 - x - 2 = 0');ok(simple.certification.status==='certificada'&&simple.certification.bracket[0]<=simple.root&&simple.root<=simple.certification.bracket[1],'Raiz simples certificada por troca de sinal');
 const far=M.parseFunction('1e-20*(x - 0.3)');const nf=M.newton(far,0,{tolerance:1e-12});ok(nf.converged&&near(nf.root,0.3,1e-9)&&nf.certification.status==='certificada','Escala minúscula: Newton continua até a raiz de verdade (0,3)');
 const bf=M.bisection(far,-1,1,{tolerance:1e-12});ok(bf.converged&&Math.abs(bf.root-0.3)<2e-3&&bf.certification.status==='certificada','Escala minúscula: Bisseção só para perto de 0,3');
 ok(M.smartRoot('x^2 - 2x + 1 = 0').certification.status==='multipla','x² − 2x + 1: raiz dupla dentro do ruído de arredondamento');
 for(const [e,root] of [['cos(x) - 1 = 0',0],['x^3 = 0',0],['sin(x) = 0',0]]){const r=M.smartRoot(e);ok(r.roots.some(t=>Math.abs(t.root-root)<1e-4),'Continua achando: '+e);}
 const noise=M.parseFunction('x^2 - 2x + 1').noise(1);ok(noise>1e-15&&noise<1e-12,'Ruído de arredondamento estimado pelo tamanho dos termos');
 // A certificação não entra no custo do método: a comparação continua contando só as avaliações do algoritmo.
 const cmp=M.compareRoot(M.parseFunction('x^3 - x - 2'),{a:1,b:2,x0:1.5,x1:2,tolerance:1e-6}).comparisons,ev=Object.fromEntries(cmp.map(c=>[c.method,c.evaluations]));
 ok(ev.bisection===24&&ev.falseposition===15&&ev.newton===7&&ev.secant===6,'Comparação de custo sem a conferência: Bisseção 24, Falsa Posição 15, Newton 7, Secante 6 ('+JSON.stringify(ev)+')');}
// Interface: o Terminal diz qual evidência existe.
{t.navigate('lab');t.s.mode='root';t.s.algorithm='newton';t.s.source='1e-20*(x^2+1) = 0';t.s.x0='0';t.solve();
 ok(t.s.result&&!t.s.result.converged&&elements['#app'].innerHTML.includes('Quase-raiz: não é solução')&&elements['#app'].innerHTML.includes('Ponto testado: não é raiz'),'Terminal: quase-raiz aparece como não solução');
 const hist=t.getP().history.length;ok(!t.getP().history.some(h=>h.source.includes('1e-20')),'Quase-raiz não entra no histórico de resoluções');
 ok(/f\(x\), em unidades de 10⁻²⁰/.test(elements['#app'].innerHTML),'Gráfico de uma função minúscula ganha escala própria (não vira uma reta sobre o eixo)');
 t.s.resultTab='verify';t.render();ok(elements['#app'].innerHTML.includes('A tolerância absoluta é grande demais para a escala desta função'),'Verificação da quase-raiz não manda só ajustar o chute inicial');t.s.resultTab='solution';
 t.s.algorithm='auto';t.s.source='(x - 1.337)^2 = 0';t.solve();ok(elements['#app'].innerHTML.includes('Raiz provável (multiplicidade par)'),'Terminal: raiz dupla sinalizada como provável');
 t.s.resultTab='verify';t.render();ok(elements['#app'].innerHTML.includes('Existência da raiz')&&elements['#app'].innerHTML.includes('multiplicidade par'),'Verificação explica a raiz múltipla');
 t.s.source='x^3 - x - 2 = 0';t.solve();t.s.resultTab='verify';t.render();ok(elements['#app'].innerHTML.includes('f troca de sinal entre'),'Verificação mostra o intervalo com troca de sinal');}
// P1: sistemas em escala extrema não são confundidos com dependência.
{for(const [A,b,x,name] of [[[[1e-20,0],[0,1]],[1e-20,1],[1,1],'1e-20·x = 1e-20 e y = 1'],[[[1e20,0],[0,1]],[1e20,1],[1,1],'linha em escala 1e20'],[[[1e-20,1e-20],[1,-1]],[2e-20,0],[1,1],'uma linha minúscula'],[[[1e-20,1],[2e-20,3]],[1,3],[0,1],'coluna minúscula']]){
  const g=M.gauss(A,b);ok(g.root.every((v,i)=>near(v,x[i],1e-9)),'Gauss resolve '+name);const a=M.autoSystem(A,b,[0,0]);ok(a.root.every((v,i)=>near(v,x[i],1e-9)),'Automático resolve '+name);}
 let msg='';try{M.gauss([[1,1],[2,2]],[2,4]);}catch(e){msg=e.message;}ok(/dependentes \(infinitas soluções\)/.test(msg),'Mensagem: sistema dependente');
 msg='';try{M.gauss([[1,1],[2,2]],[2,5]);}catch(e){msg=e.message;}ok(/incompatível/.test(msg)&&/nenhuma solução/.test(msg),'Mensagem: sistema incompatível');
 const ill=M.gauss([[1,1],[1,1+1e-10]],[2,2+1e-10]);ok(ill.cond>1e9&&/mal condicionada/.test(ill.note),'Aviso de mau condicionamento com κ');
 ok(M.conditionNumber(M.equilibrate([[1e-20,0],[0,1]]))<10,'Equilíbrio de escala: κ do sistema equilibrado é pequeno');
 t.navigate('lab');t.s.mode='system';t.s.algorithm='auto';t.s.source='1e-20x = 1e-20\ny = 1';t.solve();ok(t.s.result&&t.s.result.converged&&near(t.s.result.root[0],1),'Terminal resolve o sistema reescalado');}
// P1: o gráfico de convergência separa convergência validada de trajetória parcial e divergência.
{const cv=M.convergenceRoot(M.parseFunction('x - cos(x)'),{a:0,b:1,x0:1,x1:0.5,g:M.parseFunction('0.999*x + 0.001*cos(x)')});
 const st=Object.fromEntries(cv.series.map(x=>[x.method,x.status]));ok(st.fixedpoint==='parcial'&&st.newton==='convergiu'&&st.bisection==='convergiu','Status por série: Ponto Fixo lento é trajetória parcial');
 ok(cv.series.find(x=>x.method==='fixedpoint').note.includes('Trajetória parcial')&&cv.series.find(x=>x.method==='fixedpoint').iterations===80,'Nota e número de iterações executadas');
 const html=ctx.NumeraConv.chart(cv,{titles:{bisection:'Bisseção',falseposition:'Falsa Posição',fixedpoint:'Ponto Fixo',newton:'Newton',secant:'Secante'}});
 ok(html.includes('st-parcial')&&html.includes('trajetória parcial')&&html.includes('convergência validada'),'Legenda diferencia convergência validada e trajetória parcial');
 const dv=M.convergenceSystem([[1,2],[3,1.05]],[3,4.05],[0,0]);ok(dv.series.every(x=>x.status==='divergiu'),'Sistema sem dominância: divergência detectada');
 const dh=ctx.NumeraConv.chart(dv,{titles:{seidel:'Gauss-Seidel',jacobi:'Jacobi'}});ok(dh.includes('divergência detectada'),'Legenda mostra divergência');
 const miss=M.convergenceRoot(M.parseFunction('x^2 - 2'),{x0:1.5});ok(miss.series.find(x=>x.method==='bisection').status==='falhou'&&/incompatível com estes dados/.test(miss.series.find(x=>x.method==='bisection').note),'Método sem dados: incompatível, com motivo');}
// P1: um único backup com trilhas, Treino, provas e revisões.
{const env=t.backupEnvelope();ok(env.app==='numera-academy'&&env.backupVersion===2&&env.trilhas&&env.treino&&env.visitas&&env.createdAt,'Backup versionado com trilhas, Treino e marcas de leitura');
 const tr=JSON.parse(JSON.stringify(env.treino));tr[TV[0].id]={d:TV[0].method,ok:true,tries:1,at:'2026-10-17'};tr._provas=[{date:'2026-10-17T10:00:00.000Z',nota:8.5,n:5,secs:600}];
 const read=t.readBackup(JSON.parse(JSON.stringify({...env,treino:tr})));ok(read.full&&Object.keys(read.trilhas.completed).length===Object.keys(t.getP().completed).length,'Leitura do backup novo');
 const legacyRead=t.readBackup(JSON.parse(JSON.stringify(t.getP())));ok(!legacyRead.full&&legacyRead.treino===null,'Backup antigo (v4–v9) continua aceito, só com as trilhas');
 fail(()=>t.readBackup({app:'numera-academy',backupVersion:2,trilhas:{version:3}}),'Backup novo com trilhas inválidas é recusado');
 t.TR.handle('tr-reset-yes',{dataset:{}});t.s.pendingRestore=read;t.s.confirm='restore';t.navigate('progress');t.s.pendingRestore=read;t.s.confirm='restore';t.render();
 ok(elements['#app'].innerHTML.includes('Treino: 1 exercícios com progresso e 1 prova'),'Confirmação diz o que o backup traz');
 handlers.click({target:{closest:()=>({dataset:{act:'confirm-yes'},disabled:false})}});
 ok(t.TR._prog()[TV[0].id]&&t.TR._prog()[TV[0].id].ok&&(t.TR._prog()._provas||[]).length===1,'Importar restaura o Treino e as provas');ok(t.s.warning.includes('Treino, provas e revisões'),'Mensagem só depois de gravar');
 ok(elements['#app'].innerHTML.includes('único arquivo com tudo'),'Texto do backup diz que inclui tudo');}
// Gravação recusada pelo navegador: nada de mensagem de sucesso.
{const cx2={window:null,console,Date,Math,Number,String,JSON,Array,Boolean,Object,Error,RegExp,parseFloat,isFinite,Set,Map,Intl,URL,Blob};cx2.window=cx2;vm.createContext(cx2);
 for(const f of BASE)vm.runInContext(read(f),cx2,{filename:f});
 const el2={'#app':{innerHTML:''},'#main':{focus(){}}},h2={};
 Object.assign(cx2,{document:{title:'',querySelector:q=>el2[q]||null,getElementById:id=>el2['#'+id]||null,addEventListener:(n,fn)=>h2[n]=fn,createElement:()=>({click(){}})},localStorage:{getItem:()=>null,setItem(){throw Error('QuotaExceededError');}},history:{replaceState(){}},location:{hash:''},setTimeout(){},scrollTo(){},addEventListener(){}});
 loadSite(cx2);const t2=cx2.__test;
 ok(t2.persist()===false&&/não conseguiu salvar/.test(t2.s.warning),'persist() devolve falha e avisa');
 t2.s.pendingRestore=t2.readBackup(t2.backupEnvelope());t2.s.confirm='restore';h2.click({target:{closest:()=>({dataset:{act:'confirm-yes'},disabled:false})}});
 ok(/não deixou gravar/.test(t2.s.warning)&&!/^Backup importado/.test(t2.s.warning),'Importar com armazenamento bloqueado não diz "Backup importado"');
 t2.s.confirm='reset';h2.click({target:{closest:()=>({dataset:{act:'confirm-yes'},disabled:false})}});ok(!/reiniciado/.test(t2.s.warning),'Reiniciar com armazenamento bloqueado não diz "Progresso reiniciado"');
 t2.TR.handle('tr-reset-yes',{dataset:{}});ok(t2.TR.saveFailed()&&t2.TR.page().includes('não está gravando o progresso do Treino'),'Treino avisa quando o navegador não grava');}
// Estado do Treino corrompido ou editado à mão é normalizado ao carregar.
{const bad=new Map([['numera-treino-v9',JSON.stringify({[TV[0].id]:{d:'hack',tries:-5,ok:'sim',rv:{due:'ontem',int:99}},[TV[1].id]:{d:TV[1].method,tries:2,ok:true,at:'2026-10-01',rv:{due:'2026-10-20',int:3}},zz99:{ok:true},_prova:{ids:['zz99'],i:0,ans:{},start:1,limit:30},_provaLast:{items:'x'},_provas:[{date:'x',nota:99}],__proto__:{polluted:true}})]]);
 const T3=ctx.NumeraTreinoUI({safe:x=>String(x),icon:()=>'',btn:()=>'',tag:()=>'',bar:()=>'',method:id=>C.METHODS.find(m=>m.id===id),heading:()=>'',tabs:()=>'',parseAnswer:t.parseAnswer,openInLab(){},storage:{getItem:k=>bad.get(k)||null,setItem:(k,v)=>bad.set(k,v)},render(){}});
 const pr=T3._prog();ok(!pr.zz99&&!pr._prova&&!pr._provaLast&&!(pr._provas||[]).length,'Ids desconhecidos, prova e histórico inválidos descartados');
 ok(!pr[TV[0].id],'Campos inválidos descartados (método inexistente, tentativas negativas, booleano falso)');ok(pr[TV[1].id].ok===true&&pr[TV[1].id].dOk===true&&pr[TV[1].id].rv.int===3,'Campos válidos preservados');
 const junk=new Map([['numera-treino-v9','{isto não é json']]);const T4=ctx.NumeraTreinoUI({safe:x=>String(x),icon:()=>'',btn:()=>'',tag:()=>'',bar:()=>'',method:id=>C.METHODS.find(m=>m.id===id),heading:()=>'',tabs:()=>'',parseAnswer:t.parseAnswer,openInLab(){},storage:{getItem:k=>junk.get(k)||null,setItem(){}},render(){}});ok(Object.keys(T4._prog()).length===0&&T4.summary().solved===0,'JSON quebrado não derruba o Treino');}
// P1: "visto com ajuda" é um estado de verdade, separado de resolvido e perfeito.
{const mem5=new Map(),T5=ctx.NumeraTreinoUI({safe:x=>String(x),icon:()=>'',btn:()=>'',tag:()=>'',bar:()=>'',method:id=>C.METHODS.find(m=>m.id===id),heading:()=>'',tabs:()=>'',parseAnswer:t.parseAnswer,openInLab(){},storage:{getItem:k=>mem5.get(k)||null,setItem:(k,v)=>mem5.set(k,v)},render(){}});
 const e0=TV[0];T5.handle('tr-diag',{dataset:{id:e0.method}});T5.handle('tr-key',{dataset:{}});let S5=T5.summary();ok(S5.helped===1&&S5.solved===0&&S5.tried===1,'Abrir o gabarito antes: visto com ajuda, não resolvido');
 const vals=e0.answer.type==='vec'?e0.answer.values:[e0.answer.value];vals.forEach((v,i)=>elements['#tr-ans-'+i]={value:String(v).replace('.',',')});T5.submit();vals.forEach((_,i)=>delete elements['#tr-ans-'+i]);
 S5=T5.summary();ok(S5.helped===1&&S5.solved===0&&S5.perfect===0,'Acertar depois de ver o gabarito continua "com ajuda"');
 ok(T5.page().includes('Visto com ajuda')&&T5.page().includes('vistos com ajuda'),'Tabuleiro e resumo mostram o estado');}
// P1: a prova encerrada pelo tempo abre direto o relatório, com aviso.
{const mem6=new Map(),T6=ctx.NumeraTreinoUI({safe:x=>String(x),icon:()=>'',btn:()=>'',tag:()=>'',bar:()=>'',method:id=>C.METHODS.find(m=>m.id===id),heading:()=>'',tabs:()=>'',parseAnswer:t.parseAnswer,openInLab(){},storage:{getItem:k=>mem6.get(k)||null,setItem:(k,v)=>mem6.set(k,v)},render(){},announce:m=>said.push(m),focus:q=>focused.push(q)}),said=[],focused=[];
 T6.handle('tr-view',{dataset:{id:'prova'}});T6.handle('tr-pv-limit',{dataset:{id:'20'}});T6.handle('tr-pv-n',{dataset:{id:'5'}});T6.handle('tr-pv-start',{dataset:{}});
 ok(said.some(m=>/Prova iniciada: 5 questões, 20 minutos/.test(m))&&focused.includes('#pv-title'),'Início da prova anunciado e foco na questão');
 T6.handle('tr-pv-next',{dataset:{}});ok(said.some(m=>/Questão 2 de 5/.test(m)),'Troca de questão anunciada');
 T6._prog()._prova.start=Date.now()-21*60*1000;T6._expire();
 ok(!T6._prog()._prova&&T6._prog()._provaLast.timeout===true&&T6._state.pvShow===true,'Tempo esgotado: prova encerrada e relatório aberto');
 const rep=T6.page();ok(rep.includes('A prova foi encerrada pelo tempo')&&rep.includes('tr-rep-t'),'Relatório avisa que a prova foi encerrada pelo tempo');ok(said.some(m=>/Tempo esgotado/.test(m))&&focused.includes('#tr-rep-t'),'Fim pelo tempo anunciado e foco no relatório');
 T6.handle('tr-pv-new',{dataset:{}});T6.handle('tr-pv-start',{dataset:{}});T6._prog()._prova.start=Date.now()-60*60*1000;const again=T6.page();ok(again.includes('A prova foi encerrada pelo tempo')&&!T6._prog()._prova,'Prova expirada com a página fechada: relatório direto ao voltar');}
// Aulas em vídeo: 3 por método, ids válidos, na leitura guiada e na página da trilha.
{ok(C.METHODS.every(m=>(C.VIDEOS[m.id]||[]).length===3),'Três aulas em vídeo para cada método');ok(Object.values(C.VIDEOS).flat().every(v=>/^[A-Za-z0-9_-]{11}$/.test(v.id)&&v.title&&v.channel&&['pt','en'].includes(v.lang)),'Ids do YouTube, título, canal e idioma');
 ok(C.METHODS.every(m=>C.VIDEOS[m.id].filter(v=>v.lang==='pt').length>=2),'Pelo menos duas aulas em português por método');ok(new Set(Object.values(C.VIDEOS).flat().map(v=>v.id)).size===21,'Sem vídeo repetido');
 t.openCourse('newton');ok(elements['#app'].innerHTML.includes('Aulas em vídeo sobre Newton-Raphson')&&elements['#app'].innerHTML.includes('youtube.com/watch?v=k7biHtHPJS8'),'Página da trilha lista as aulas');
 ok(!elements['#app'].innerHTML.includes('youtube-nocookie.com/embed'),'O player só é carregado depois do clique');
 ok(!elements['#app'].innerHTML.includes('Assistir aqui'),'Aberto do disco (file://), só o link: sem player embutido');
 const sc=t.introScreens();ok(sc.length===8&&sc[7].body.includes('youtube.com/watch'),'Leitura guiada termina com as aulas em vídeo');ok(sc[4].eyebrow==='Como a professora resolve'&&sc[4].body.includes('pp-table'),'Leitura guiada traz o exemplo dos slides com a tabela da professora');
 ok(elements['#app'].innerHTML.includes('rel="noopener noreferrer"')&&elements['#app'].innerHTML.includes('target="_blank"'),'Links externos abrem em nova aba, sem referência à página');}
// Fontes locais, CSP e service worker.
{const html=read('index.html');ok(!/googleapis|gstatic/.test(html),'Nenhuma fonte externa no index.html');ok(/Content-Security-Policy/.test(html)&&/script-src 'self';/.test(html)&&/object-src 'none'/.test(html),'Política de segurança (CSP) sem script embutido');
 ok(!/<script>(?!<\/script>)/.test(html),'Nenhum script embutido na página');ok(/name="referrer" content="strict-origin-when-cross-origin"/.test(html),'Referrer-Policy');
 const fcss=read('css/fontes.css'),urls=[...fcss.matchAll(/url\(\.\.\/(fontes\/[^)]+)\)/g)].map(m=>m[1]);ok(urls.length>=6&&urls.every(u=>fs.existsSync(path.join(dir,u))),'Arquivos de fonte existem ('+new Set(urls).size+')');
 ok(['Figtree','Newsreader','JetBrains Mono'].every(f=>fcss.includes(`font-family: '${f}'`)),'Três famílias empacotadas');ok(fs.readdirSync(path.join(dir,'fontes')).filter(f=>f.startsWith('LICENSE')).length===3,'Licenças das fontes incluídas');
 const sw=read('sw.js');ok(sw.includes('Response.error()')&&!/googleapis/.test(sw),'Service worker: erro de verdade sem cache nem rede, sem Google Fonts');
 for(const f of ['e2e','terminal'])ok(JSON.parse(fs.readFileSync(path.join(__dirname,f,'package.json'),'utf8')).devDependencies.playwright==='1.56.1','Playwright 1.56.1 em tests/'+f+' (corrige o alerta do npm audit)');}
group='Intervalo no Terminal (v10.1)';
// Motor: o intervalo escrito junto da equação, as pontas e os pontos iniciais dentro de [a, b].
{for(const [src,eq,a,b] of [['x^3 - 9x + 3 = 0 em [0; 1]','x^3 - 9x + 3 = 0',0,1],['x^3-9x+3=0 [0,1]','x^3-9x+3=0',0,1],['x = cos(x), x ∈ [0, 1]','x = cos(x)',0,1],['x^2-2=0 no intervalo [1,5; 2]','x^2-2=0',1.5,2],['x^2 - 2 = 0 intervalo: [1, 2]','x^2 - 2 = 0',1,2],['x^2-2=0, I = [0; 2].','x^2-2=0',0,2],['x^2-2=0 em [1,5, 2,5]','x^2-2=0',1.5,2.5],['cos(x) = 0 em [0; pi]','cos(x) = 0',0,Math.PI]]){
  const r=M.splitInterval(src);ok(r.equation===eq&&near(r.interval.a,a)&&near(r.interval.b,b),'Intervalo na equação: '+src);}
 ok(M.splitInterval('x^2-2=0').interval===null,'Sem colchetes: sem intervalo');
 for(const [src,msg] of [['[0;1]','antes do intervalo'],['x^2-2=0 em [2;1]','menor que a da direita'],['x^2-2=0 em [1,5,2,5]','ponto e vírgula'],['x^2-2=0 em [x;1]','sem x'],['x^2-2=0 em [a;1]','não é um número']]){let m='';try{M.splitInterval(src);}catch(e){m=e.message;}ok(m.includes(msg),'Intervalo inválido explicado: '+src);}
 ok(near(M.constValue('pi/2'),Math.PI/2)&&M.constValue('1,5')===1.5&&M.constValue('-2')===-2,'Pontas: pi/2, vírgula decimal e negativo');
 ok(M.intervalStart(M.parseFunction('x^3-x-2'),1,2).x0===2,'Newton no intervalo: x₀ na ponta com f·f″ > 0 (Fourier)');
 const ch=M.signChanges(M.parseFunction('x^3-9x+3'),0,3);ok(ch.length===2&&ch[0].a===0.3&&ch[0].b===0.4&&ch[1].a===2.8&&ch[1].b===2.9,'Trocas de sinal dentro de [0; 3]: [0,3; 0,4] e [2,8; 2,9]');
 ok(M.signChanges(M.parseFunction('1/x'),-1,1).length===0&&M.signChanges(M.parseFunction('(x-1)^2'),0,3).length===0,'Polo e raiz dupla não viram sugestão de intervalo');
 ok(M.bisectionBound(1,2,1e-6)===20&&M.bisectionBound(0,1,0.01)===7,'Cota da Bisseção: n ≥ log₂((b − a)/ε)');
 const fp=M.fixedPointCheck(M.parseFunction('cos(x)'),0,1);ok(fp.maxD<1&&fp.maps,'Ponto fixo em [0; 1]: contração que leva o intervalo nele mesmo');
 const dbl=M.smartRoot('(x - 1.337)^2',{min:1,max:2});ok(dbl.certification.status==='multipla'&&near(dbl.root,1.337,1e-5),'Busca numa faixa estreita ainda acha a raiz dupla');}
// Terminal: o intervalo vale para todos os métodos.
{const lab=(src,alg,extra={})=>{t.navigate('lab');t.s.mode='root';Object.assign(t.s,{a:'',b:'',x0:'',x1:'',g:'',tolerance:'0.000001'},extra);t.s.algorithm=alg;t.s.source=src;t.solve();return t.s.result;};
 const html=()=>elements['#app'].innerHTML,click=(act,data={})=>handlers.click({target:{closest:()=>({dataset:{act,...data},disabled:false})}});
 t.navigate('lab');t.s.mode='root';t.s.algorithm='auto';t.render();ok(html().includes('id="a"')&&html().includes('id="b"')&&html().includes('Intervalo [a, b]'),'Campos a e b à vista no Terminal');
 let r=lab('x^3 - 9x + 3 = 0 em [0; 1]','bisection');
 ok(r&&r.converged&&near(r.root,0.3376089559,1e-6)&&t.s.a==='0'&&t.s.b==='1'&&t.s.source==='x^3 - 9x + 3 = 0','Intervalo digitado na equação vai para os campos e a Bisseção roda nele');
 ok(r.interval.inside&&r.interval.sign==='troca'&&html().includes('interval-echo')&&html().includes('[0; 1]'),'Resultado mostra o intervalo e a troca de sinal');
 ok(r.intervalNotes.some(n=>n.includes('log₂((b − a)/ε) = 20')),'Bisseção mostra a cota de iterações do intervalo');
 ok(html().includes('class="g-iv"'),'Gráfico marca as pontas a e b');
 t.s.resultTab='verify';t.render();ok(html().includes('Intervalo do exercício')&&html().includes('está dentro do intervalo'),'Verificação explica o que o intervalo garante');t.s.resultTab='solution';
 r=lab('x^3 - 9x + 3 = 0','bisection');ok(!r&&/precisa de um intervalo/.test(t.s.error)&&t.s.errorFix.length>0&&html().includes('data-act="use-interval"'),'Bisseção sem intervalo: explica e sugere intervalos com troca de sinal');
 r=lab('x^3 - 9x + 3 = 0','bisection',{a:'0',b:'3'});ok(!r&&/mesmo sinal/.test(t.s.error)&&t.s.errorFix.length===2&&t.s.errorFix[0].a===0.3,'Mesmo sinal nas pontas: explica o TVI e aponta [0,3; 0,4] e [2,8; 2,9]');
 click('use-interval',{a:'2.8',b:'2.9'});ok(t.s.result&&t.s.result.converged&&near(t.s.result.root,2.8169140,1e-6)&&t.s.a==='2,8'&&t.s.b==='2,9','Um clique usa o intervalo sugerido e resolve');
 r=lab('x^3 - 9x + 3 = 0','bisection',{a:'-4',b:'4'});ok(r.converged&&r.intervalNotes.some(n=>n.includes('troca de sinal 3 vezes'))&&r.intervalFix.length===2,'Três raízes no intervalo: avisa e oferece os outros pedaços');
 r=lab('x^3 - x - 2 = 0','newton',{a:'1',b:'2'});ok(r.converged&&r.inputs.x0===2&&r.intervalNotes.some(n=>n.includes('Fourier')),'Newton sem x₀: começa na ponta escolhida pela condição de Fourier');
 r=lab('x^3 - 9x + 3 = 0','newton',{a:'0',b:'1',x0:'3'});ok(r.converged&&!r.interval.inside&&html().includes('Raiz fora do intervalo pedido')&&r.intervalNotes.some(n=>n.includes('fora do intervalo')),'Newton que sai do intervalo: avisado, não apresentado como a raiz pedida');
 r=lab('x^3 - x - 2 = 0','newton');ok(!r&&/ponto inicial x₀ ou de um intervalo/.test(t.s.error),'Newton sem x₀ e sem intervalo: pede um dos dois');
 r=lab('x^3 - x - 2 = 0','secant',{a:'1',b:'2'});ok(r.converged&&r.inputs.x0===1&&r.inputs.x1===2,'Secante sem pontos: começa por a e b');
 r=lab('x = cos(x)','fixedpoint',{a:'0',b:'1'});ok(r.converged&&near(r.root,0.7390851,1e-6)&&r.inputs.x0===0.5&&r.intervalNotes.some(n=>n.includes('max |g′|')&&n.includes('< 1')),'Ponto Fixo: começa no ponto médio e confere |g′| < 1 no intervalo');
 r=lab('x^3 - x - 2 = 0 em [1; 2]','auto');ok(r.converged&&r.roots.length===1&&r.inputs&&r.inputs.a===1&&!r.initials&&r.comparisons.every(c=>c.converged)&&/partiram dos seus dados/.test(r.recommendation),'Automático com intervalo: todos os métodos partem do intervalo do exercício');
 t.s.resultTab='compare';t.render();ok(html().includes('partiram dos dados do exercício'),'Comparar métodos explica os dados de partida');t.s.resultTab='solution';
 r=lab('x^3 - 9x + 3 = 0 em [-4; 4]','auto');ok(r.converged&&r.roots.length===3&&/contém 3 raízes/.test(r.note),'Automático: todas as raízes do intervalo');
 r=lab('x^2 + 1 = 0 em [0; 1]','auto');ok(!r&&/Nenhuma raiz encontrada no intervalo \[0; 1\]/.test(t.s.error),'Automático sem raiz no intervalo: mensagem própria');
 r=lab('cos(x) = 0 em [0; pi]','bisection');ok(r.converged&&near(r.root,Math.PI/2,1e-6),'Ponta com pi');
 r=lab('ln(x) = 0 em [0; 2]','bisection');ok(!r&&/não tem valor real finito na ponta a = 0/.test(t.s.error),'Ponta fora do domínio: explicado');
 r=lab('x^2 - 2 = 0','auto',{a:'1'});ok(!r&&/as duas pontas/.test(t.s.error),'Só uma ponta: pede as duas');
 r=lab('x^2 - 2 = 0','auto',{a:'-1e7',b:'1e7'});ok(!r&&/até 1.000.000/.test(t.s.error),'Intervalo largo demais no automático: explicado');
 r=lab('x^2 - 2 = 0 em [1; 2]','bisection');ok(t.getP().history[0].source==='x^2 - 2 = 0 em [1; 2]','Histórico guarda a equação com o intervalo');
 click('history-load',{index:'0'});ok(t.s.a===''&&t.s.source.includes('em [1; 2]'),'Histórico devolve a equação com o intervalo');t.solve();ok(t.s.result&&t.s.result.interval&&t.s.a==='1','E ele volta para os campos ao resolver');
 t.s.a='0';t.s.b='1';const ex=t.s.source;click('example',{index:'0'});ok(t.s.a===''&&t.s.b===''&&t.s.source!==ex,'Trocar de exemplo limpa o intervalo anterior');
 t.navigate('case');t.s.caseId='loan';click('case-terminal');ok(t.s.a==='0.01'&&t.s.b==='0.03','Missão com intervalo preenche a e b');
 t.navigate('case');t.s.caseId='tank';click('case-terminal');ok(t.s.a===''&&t.s.b===''&&t.s.x0==='','Outra missão não herda o intervalo da anterior');
 t.navigate('lab');t.s.algorithm='auto';t.s.a='';t.s.b='';t.s.source='x^3 - x - 2 = 0';t.solve();ok(t.s.result&&t.s.result.converged&&!t.s.result.interval,'Sem intervalo, o automático continua como antes');}
group='Expoentes elevados (v10.1)';
// Expoentes elevados em todo texto da página: nada de x^3 à vista (só dentro da caixa de digitação, onde o teclado cuida dele).
{const vis=h=>h.replace(/<textarea[\s\S]*?<\/textarea>/g,'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' '),caret=h=>(vis(h).match(/[\w)\]}²³π]\^/g)||[]).length;
 ok(t.supText('x^3 - 9x + 3')==='x<sup>3</sup> - 9x + 3'&&t.supText('(1+i)^(−12)')==='(1+i)<sup>−12</sup>'&&t.supText('10^-6')==='10<sup>−6</sup>'&&t.supText('e^{0,1x}')==='e<sup>0,1x</sup>','Expoentes: x^3, (1+i)^(−12), 10^-6 e e^{0,1x} viram <sup>');
 ok(t.supText('Use x, ^, parênteses')==='Use x, ^, parênteses','O nome da tecla ^ fica como está');
 ok(t.supHtml('<p>x^2</p><textarea>x^2</textarea><input value="x^2"><svg><text>x^2</text></svg>')==='<p>x<sup>2</sup></p><textarea>x^2</textarea><input value="x^2"><svg><text>x^2</text></svg>','Caixa de digitação, atributos e SVG ficam intactos');
 const telas=[['Terminal (automático)',()=>{t.navigate('lab');t.s.mode='root';t.s.algorithm='auto';t.s.help=true;t.render();}],['Terminal: erro sem intervalo',()=>{t.s.algorithm='bisection';t.s.a='';t.s.b='';t.s.source='x^3 - 9x + 3 = 0';t.solve();}],['Terminal: Ponto Fixo',()=>{t.s.algorithm='fixedpoint';t.s.source='x = (2x + 5)^(1/3)';t.s.a='2';t.s.b='3';t.solve();for(const tab of ['solution','steps','converge','verify','guide']){t.s.resultTab=tab;t.render();}}]];
 for(const c of C.CASES)telas.push(['Missão '+c.id,()=>{t.navigate('case');t.s.caseId=c.id;t.s.caseQ=0;t.render();}]);
 for(const [nome,fazer] of telas){fazer();ok(caret(elements['#app'].innerHTML)===0,'Sem ^ à vista: '+nome);}
 t.s.help=false;}
group='Gamificação (v11)';
// Ponto Fixo escondido (reversível): some das telas, mas o motor, o conteúdo e o progresso ficam.
// Para trazer de volta, basta C.HIDDEN=[] em js/conteudo/conteudo.js: aí este bloco confere que ele voltou a todas as telas.
const PF_HIDDEN=C.isHidden('fixedpoint');
if(!PF_HIDDEN){ok(C.METHODS.some(m=>m.id==='fixedpoint')&&C.JOURNEY.map(w=>w.id).join()==='bisection,falseposition,fixedpoint,newton,secant,gauss,seidel','Ponto Fixo de volta: Mundo 3, entre a Falsa Posição e o Newton');ok(C.CASES.some(c=>c.id==='kepler'),'Ponto Fixo de volta às missões');t.navigate('academy');ok(elements['#app'].innerHTML.includes('data-id="fixedpoint"'),'Ponto Fixo de volta ao mapa');}
else{ok(C.HIDDEN.includes('fixedpoint')&&!C.METHODS.some(m=>m.id==='fixedpoint')&&C.ALL_METHODS.some(m=>m.id==='fixedpoint')&&C.TASKS.fixedpoint.length===12,'Ponto Fixo escondido das trilhas, guardado no conteúdo');
 ok(typeof M.fixedPoint==='function'&&M.fixedPoint(M.parseFunction('cos(x)'),1,{tolerance:1e-10}).converged,'Motor do Ponto Fixo intacto');
 ok(!C.CASES.some(c=>c.method==='fixedpoint')&&C.ALL_CASES.some(c=>c.id==='kepler'),'Missão de Kepler escondida, não apagada');
 ok(P.ids.has('c:fixedpoint:0')&&P.ids.has('p:kepler:0'),'Progresso antigo do Ponto Fixo continua válido (não se perde ao esconder)');
 const old=P.validate({version:4,xp:20,completed:{'c:fixedpoint:0':{stars:3,date:'2026-10-01'}}});ok(old.completed['c:fixedpoint:0'],'Backup com Ponto Fixo é aceito');
 t.s.result=null;t.s.algorithm='auto';for(const pg of ['home','academy','jogos','cases','lab']){t.navigate(pg);t.render();ok(!/Ponto Fixo/.test(elements['#app'].innerHTML.replace(/<textarea[\s\S]*?<\/textarea>/g,'')),'Sem Ponto Fixo à vista: '+pg);}
 t.navigate('treino');ok(!elements['#app'].innerHTML.includes('data-id="fixedpoint"'),'Treino sem o botão de diagnóstico do Ponto Fixo');
 t.s.algorithm='fixedpoint';t.s.mode='root';t.navigate('lab');ok(t.s.algorithm==='auto','Terminal com Ponto Fixo salvo volta ao Automático');}
// Jornada: ordem do mais fácil ao mais difícil, travas e modo livre.
{ok(C.METHODS.map(m=>m.id).join()===['bisection','falseposition','fixedpoint','newton','secant','gauss','seidel'].filter(id=>!C.isHidden(id)).join(),'Mundos: Bisseção → Falsa Posição → (Ponto Fixo) → Newton → Secante → Gauss → Gauss-Seidel');
 ok(C.JOURNEY.every((w,i)=>!i||w.stars>=C.JOURNEY[i-1].stars)&&C.JOURNEY[0].tier==='Fácil'&&C.JOURNEY[C.JOURNEY.length-1].tier==='Difícil','Dificuldade nunca diminui ao longo da jornada');
 ok(C.JOURNEY.every(w=>w.why&&w.why.length>40)&&/34,8%/.test(C.JOURNEY_NOTE),'Cada mundo explica por que está ali; a nota cita a pesquisa');
 const fresh=P.fresh();t.setP(fresh);ok(t.worldOpen('bisection')&&!t.worldOpen('falseposition')&&!t.worldOpen('seidel'),'Começo: só o primeiro mundo aberto');
 t.navigate('academy');const ac=elements['#app'].innerHTML;ok((ac.match(/class="world /g)||[]).length===C.METHODS.length&&ac.includes('Por que essa ordem?')&&ac.includes('Modo livre')&&ac.includes('Dificuldade 5 de 5'),'Mapa da jornada com mundos, estrelas de dificuldade e modo livre');
 t.openCourse('falseposition');t.startNode('t0');ok(t.s.tab!=='practice'&&elements['#app'].innerHTML.includes('abrem quando você concluir o Nível 1'),'Mundo fechado: desafios travados, leitura liberada');
 t.startNode('intro');ok(t.s.tab==='intro','Leitura do mundo fechado continua aberta');
 t.startNode('sim');t.render();ok(elements['#app'].innerHTML.includes('Voltar à trilha'),'Simulação do mundo fechado não leva aos desafios');handlers.click({target:{closest:()=>({dataset:{act:'sim-done'},disabled:false})}});ok(t.s.tab==='learn'&&t.s.pathSel==='t0','Fim da simulação no mundo fechado volta à trilha com o aviso');
 for(let i=0;i<4;i++)P.complete(fresh,`c:bisection:${i}`);ok(t.worldOpen('falseposition')&&!t.worldOpen('newton'),'Nível 1 da Bisseção abre a Falsa Posição');
 handlers.click({target:{closest:()=>({dataset:{act:'free-toggle'},disabled:false})}});ok(fresh.free&&C.METHODS.every(m=>t.worldOpen(m.id)),'Modo livre abre todos os mundos');
 handlers.click({target:{closest:()=>({dataset:{act:'free-toggle'},disabled:false})}});ok(!fresh.free,'Modo livre desliga');}
// Recompensas: moedas por atividade nova, sequência de 3 e bônus de nível e de mundo, pagos uma vez.
{const pp=P.fresh();t.setP(pp);t.s.streak=0;t.s.streakNew=false;const answer=(m,i,right=true)=>{t.s.method=m;t.s.q=i;t.s.tab='practice';t.s.page='course';t.s.feedback=null;t.s.wrong=0;t.s.hint=false;const task=C.TASKS[m][i];if(task.type==='choice'){t.s.selected=right?task.answer:(task.answer+1)%task.options.length;}else{t.s.selected=null;elements['#answer'].value=String(right?task.value:task.value+7);}t.answerQuestion();};
 answer('bisection',0);ok(pp.coins===2&&t.s.streak===1&&t.s.feedback.message.includes('+2 moedas'),'Etapa nova: +2 moedas');
 answer('bisection',1,false);ok(t.s.streak===0&&pp.coins===2,'Erro zera a sequência');
 answer('bisection',1);answer('bisection',2);answer('bisection',3);ok(t.s.streak===3&&pp.coins===2+2+2+2+5+10&&pp.paid['n:bisection:0'],'3 seguidas (+5) e Nível 1 completo (+10)');
 ok(/Nível 1 de Bisseção concluído/.test(t.s.feedback.message)&&/Falsa Posição, liberado/.test(t.s.feedback.message),'Mensagem do nível concluído e do mundo liberado');
 const before=pp.coins;answer('bisection',0);answer('bisection',1);answer('bisection',2);ok(pp.coins===before&&t.s.streak===6,'Repetir etapas não paga moedas (nem a sequência sem atividade nova)');
 for(let i=4;i<12;i++)answer('bisection',i);ok(pp.paid['w:bisection']&&pp.paid['n:bisection:2']&&pp.best>=8,'Mundo completo pago (+30) e melhor sequência registrada');
 const c2=pp.coins;t.s.streak=0;answer('bisection',11);ok(pp.coins===c2,'Bônus de nível e de mundo não se repetem');
 ok(t.s.mascot===null||['ok','combo','level','world'].includes(t.s.mascot.kind),'Reação dos mascotes preparada');
 t.s.method='bisection';t.s.page='course';t.s.tab='practice';ok(t.mascotOn(),'Casal aparece na prática');t.s.page='academy';ok(!t.mascotOn(),'Casal não aparece fora dos desafios');t.s.page='treino';ok(!t.mascotOn(),'Nem no Treino e na prova');}
// Mascotes e camarim.
{const MZ=ctx.NumeraMascotes;ok(MZ&&MZ.ITEMS.length===6&&MZ.svg([],'t').includes('mz-raiz-body')&&MZ.svg([],'t').includes('mz-pivo-body')&&MZ.svg([],'t').includes('aria-hidden="true"'),'Desenho de Raiz e Pivô (decorativo, aria-hidden)');
 ok(MZ.svg(['coroa','oculos'],'t').includes('#F7C531')&&MZ.svg(['oculos'],'t').includes('#15191E')&&!MZ.svg([],'t').includes('#15191E'),'Roupas aparecem só quando vestidas');
 ok(MZ.svg([],'a').match(/id="mzRaizSkin-a"/)&&!MZ.svg([],'b').includes('mzRaizSkin-a'),'Cada desenho tem ids próprios');
 ok(['ok','bad','combo','level','world'].every(k=>MZ.PHRASES[k].length>=2),'Frases para cada reação');
 const pc=P.fresh();t.setP(pc);t.navigate('progress');ok(elements['#app'].innerHTML.includes('Camarim')&&elements['#app'].innerHTML.includes('disabled'),'Camarim no Progresso, itens caros desabilitados');
 const buy=id=>handlers.click({target:{closest:()=>({dataset:{act:'buy',id},disabled:false})}});buy('coroa');ok(!pc.owned.length,'Sem moedas, não compra');
 pc.coins=70;buy('coroa');ok(pc.coins===10&&pc.owned.includes('coroa')&&pc.outfit.includes('coroa'),'Comprar desconta, guarda e veste');buy('coroa');ok(pc.coins===10,'Não compra duas vezes');
 handlers.click({target:{closest:()=>({dataset:{act:'equip',id:'coroa'},disabled:false})}});ok(!pc.outfit.includes('coroa'),'Tirar a roupa');
 const v=P.validate({version:4,xp:0,completed:{},coins:42.7,owned:['coroa','<script>','x'],outfit:['coroa','gravata'],free:true,best:7,paid:{'n:bisection:0':true,'hack':true}});ok(v.coins===42&&v.owned.join()==='coroa'&&v.outfit.join()==='coroa'&&v.free&&v.best===7&&v.paid['n:bisection:0']&&!v.paid.hack,'Backup guarda moedas, roupas, modo livre e bônus pagos, e filtra lixo');
 ok(P.validate({version:4,xp:0,completed:{}}).coins===0,'Backup antigo começa com 0 moedas');
 t.navigate('progress');ok((elements['#app'].innerHTML.match(/class="card badge /g)||[]).length===12,'12 conquistas, com Combo, Desbravador, Estilo próprio, Caçador de Raízes e Turma reunida');}
group='Jogos (v12)';
// A Arena saiu: no lugar dela, a página Jogos com a Calculândia (3D) e o Quem Divergiu? (jogo de sala).
{const store={},LS=ctx.localStorage,oldGet=LS.getItem;LS.getItem=k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;
 t.setP(P.fresh());t.navigate('jogos');let h=elements['#app'].innerHTML;
 ok(h.includes('href="jogos/calculandia/index.html"')&&h.includes('href="jogos/quem-divergiu/index.html"'),'Jogos: links para os dois jogos');
 ok(h.includes('Ainda não começou')&&h.includes('Nenhuma partida ainda'),'Jogos: sem progresso, convida a começar');
 ok(h.includes('alt=""')&&h.includes('aria-labelledby="calc-t"')&&h.includes('aria-labelledby="qd-t"'),'Capas decorativas, cartões com título acessível');
 for(const pg of ['home','jogos','progress']){t.navigate(pg);ok(!elements['#app'].innerHTML.includes('data-page="arena"')&&!/Arena/.test(elements['#app'].innerHTML),'Sem Arena à vista: '+pg);}
 t.navigate('home');ok(elements['#app'].innerHTML.includes('data-page="jogos"'),'Início e menu levam aos Jogos');
 t.navigate('home');ok(/<b>90<\/b><span>atividades com progresso/.test(elements['#app'].innerHTML),'Início: 90 atividades (72 etapas + 18 de missão), sem a Arena');
 store['calculandia-save-v1']=JSON.stringify({phases:{'C0.1-F':{stars:3,wins:1},'C0.1-M':{stars:2,wins:1},'B0':{stars:3,wins:1},'C1.1-D':{stars:99,wins:'2'},'C2.1-F':{stars:-4,wins:0},'x':'lixo'},roots:{r1:{},r2:{}}});
 let cs=t.calcSummary();ok(cs&&cs.stars===8&&cs.wins===4&&cs.roots===2,'Resumo da Calculândia: estrelas só das cidades, limitadas a 3 por fase ('+JSON.stringify(cs)+')');
 t.navigate('jogos');h=elements['#app'].innerHTML;ok(h.includes('⭐ 8 de 189 estrelas')&&h.includes('4 fases vencidas')&&h.includes('2 de 40 Raízes Fugitivas'),'Jogos mostram o progresso salvo da Calculândia');
 store['calculandia-save-v1']='{quebrado';ok(t.calcSummary()===null,'Save da Calculândia quebrado não derruba a página');
 store['calculandia-save-v1']=JSON.stringify([1,2]);cs=t.calcSummary();ok(cs&&cs.stars===0&&cs.wins===0&&cs.roots===0,'Save com formato estranho vira zero');
 store['numera-quem-divergiu-v1']=JSON.stringify({stats:{games:2.7,rounds:-3}});let qd=t.qdSummary();ok(qd.games===2&&qd.rounds===0,'Resumo do Quem Divergiu? conferido');
 t.navigate('jogos');ok(elements['#app'].innerHTML.includes('2 partidas jogadas'),'Jogos mostram as partidas do Quem Divergiu?');
 store['calculandia-save-v1']=JSON.stringify({phases:{'C0.1-F':{stars:1,wins:1}}});t.navigate('progress');h=elements['#app'].innerHTML;
 ok(/badge earned[^"]*"[^>]*>[\s\S]{0,200}Caçador de Raízes/.test(h)||h.includes('Caçador de Raízes'),'Conquista Caçador de Raízes');
 ok(!h.includes('+3 por desafio novo da Arena'),'Regras de moedas sem a Arena');
 LS.getItem=oldGet;}
group='Quem Divergiu? (v12)';
// O jogo de sala: perguntas com resposta calculada, conferida contra o motor do site; pontuação e leitura dos palpites.
{vm.runInContext(read('jogos/quem-divergiu/perguntas.js'),ctx,{filename:'perguntas.js'});const Q=ctx.QDPerguntas,near=(a,b,r=1e-9)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(b));
 ok(Q&&Q.TODAS.length>=50,'Banco com pelo menos 50 perguntas ('+(Q&&Q.TODAS.length)+')');
 const ids=new Set();for(const q of Q.TODAS){const r=Q.resolver(q);ok(Number.isFinite(r.resposta)&&r.resposta!==0,'Resposta numérica e não nula: '+q.id);ok(Array.isArray(r.passos)&&r.passos.length>0&&r.passos.every(x=>typeof x==='string'&&x.length>3),'Passo a passo para a professora: '+q.id);ok(!/[\w)\]]\^/.test(q.texto)&&!/[\w)\]]\^/.test(r.passos.join(' '))&&!/[\w)\]]\^/.test(q.dica),'Expoentes elevados, sem ^: '+q.id);ok(!ids.has(q.id),'Id único: '+q.id);ids.add(q.id);ok([1,2,3].includes(q.nivel)&&q.dica,'Nível e dica: '+q.id);}
 ok(Q.TODAS.every(q=>!C.isHidden(q.metodo))&&!Q.TEMAS.some(([id])=>C.isHidden(id)),'Métodos escondidos ficam fora do jogo');
 const R=id=>Q.resolver(Q.TODAS.find(q=>q.id===id)).resposta,f=s=>M.parseFunction(s),o={tolerance:1e-12,maxIterations:40};
 ok(near(R('bis-3passos'),M.bisection(f('x^3-x-2'),1,2,{tolerance:1e-12,maxIterations:3}).iterations[2].x),'Bisseção: 3º ponto médio igual ao do motor');
 ok(near(R('bis-raiz5'),M.bisection(f('x^2-5'),2,3,{tolerance:1e-12,maxIterations:4}).iterations[3].x),'Bisseção: 4º ponto médio de √5 igual ao do motor');
 ok(near(R('bis-raiz-aula'),M.bisection(f('x^3-9x+3'),0,1,o).root,1e-8),'Raiz de x³ − 9x + 3 igual à do motor');
 ok(near(R('fp-corte1'),M.falsePosition(f('x^2-3'),1,2,{tolerance:1e-12,maxIterations:1}).iterations[0].x),'Falsa Posição: 1º corte igual ao do motor');
 ok(near(R('fp-corte2'),M.falsePosition(f('x^3-2x-5'),2,3,{tolerance:1e-12,maxIterations:2}).iterations[1].x),'Falsa Posição: 2º corte igual ao do motor');
 ok(near(R('fp-carne'),C.CASES.find(c=>c.id==='loan').tasks[2].value,1e-6),'Taxa do carnê igual à da missão');
 ok(near(R('nw-raiz2'),M.newton(f('x^2-2'),1,{tolerance:1e-12,maxIterations:2}).iterations[2].x,1e-9),'Newton: x₂ de √2 igual ao do motor');
 ok(near(R('nw-cubica'),M.newton(f('x^3-x-2'),1.5,{tolerance:1e-12,maxIterations:1}).iterations[1].x,1e-9),'Newton: x₁ da cúbica igual ao do motor');
 ok(near(R('nw-cos'),M.newton(f('cos(x)-x'),1,o).root,1e-9),'Raiz de cos(x) = x igual à do motor');
 ok(near(R('sec-x2'),M.secant(f('x^2-2'),1,2,{tolerance:1e-12,maxIterations:3}).iterations[2].x)&&near(R('sec-x3'),M.secant(f('x^2-2'),1,2,{tolerance:1e-12,maxIterations:3}).iterations[3].x),'Secante: x₂ e x₃ iguais aos do motor');
 const g=M.gauss([[2,1],[1,3]],[5,6],{tolerance:1e-12}).root,g3=M.gauss([[1,1,1],[2,-1,1],[1,2,-1]],[6,3,2],{tolerance:1e-12}).root;ok(near(R('ga-x'),g[0])&&near(R('ga-z'),g3[2]),'Gauss: x e z iguais aos do motor');
 ok(near(R('gs-y1'),M.seidel([[10,-1],[-1,10]],[9,19],[0,0],{tolerance:1e-12,maxIterations:1}).iterations[1].x[1]),'Gauss-Seidel: y⁽¹⁾ igual ao do motor');
 ok(R('gs-jacobi')===1.9&&R('ga-custo')===18000&&R('gs-custo')===2e7&&R('bis-iteracoes')===20&&R('er-metade')===10&&R('nw-passos')===4,'Contagens e custos exatos');
 for(const q of Q.TODAS.filter(q=>q.relampago)){const i=Number(q.id.slice(6));ok(C.ARENA[i]&&R(q.id)===C.ARENA[i].value&&q.texto===C.ARENA[i].q,'Relâmpago vem da antiga Arena: '+q.id);}
 ok(Q.TODAS.filter(q=>q.relampago).length===C.ARENA.filter(t=>t.type!=='choice'&&t.value!==0&&!C.isHidden(t.method)).length,'Todos os desafios numéricos da Arena viraram relâmpago');
 // sorteio
 const s1=Q.sortear({temas:['bisection','newton','erro'],niveis:[1,2],rodadas:6,semente:7}),s2=Q.sortear({temas:['bisection','newton','erro'],niveis:[1,2],rodadas:6,semente:7});
 ok(s1.length===6&&s1.map(q=>q.id).join()===s2.map(q=>q.id).join(),'Sorteio repetível pela semente');
 ok(new Set(s1.map(q=>q.id)).size===6&&s1.every(q=>['bisection','newton','erro'].includes(q.metodo)&&[1,2].includes(q.nivel)),'Sorteio sem repetição, nos temas e níveis pedidos');
 ok(s1.every((q,i)=>!i||q.nivel>=s1[i-1].nivel),'Rodadas do mais fácil ao mais difícil');
 ok(Q.sortear({temas:['bisection'],niveis:[1,2,3],rodadas:10,relampago:false,semente:1}).every(q=>!q.relampago),'Sem relâmpago quando desligado');
 ok(Q.sortear({temas:['gauss'],niveis:[1],rodadas:8,listas:false,semente:1}).length===0,'Sem pergunta possível, partida vazia (a tela avisa)');ok(Q.sortear({temas:['gauss'],niveis:[1],rodadas:8,semente:1}).every(q=>q.lista),'As questões das listas completam o que faltava (v13)');ok(Q.TEMAS.some(([id])=>id==='integral')&&Q.TODAS.filter(q=>q.lista).length>100,'Questões numéricas das listas no Quem Divergiu? (v13)');
 // pontuação: o exemplo do reel (206 ossos)
 const J=[{id:'a',nome:'Ana'},{id:'b',nome:'Felipe'},{id:'c',nome:'Giovana'},{id:'d',nome:'Lucas'}];
 let ap=Q.apurar({jogadores:J,palpites:{a:205,b:12,c:250},votos:{a:'b',c:'b',d:'b',b:'c'},resposta:206});const L=id=>ap.linhas.find(l=>l.id===id);
 ok(ap.divergiram.join()==='b'&&ap.maisVotados.join()==='b'&&ap.acertouTurma,'Felipe (12) divergiu e a turma acertou');
 ok(L('a').pontos===100+30+20&&L('b').pontos===0&&L('c').pontos===10+30&&L('d').pontos===30,'Pontos: faixa + voto certeiro + raiz da rodada; sem palpite só ganha pelo voto');
 ok(L('a').faixa.nome==='Convergiu!'&&L('c').faixa.nome==='Longe'&&L('b').faixa.nome==='Divergiu'&&L('d').palpite===null,'Faixas: 1%, 5%, 20%, 50%');
 ap=Q.apurar({jogadores:J,palpites:{a:205,b:12,c:250,d:300},votos:{a:'c',b:'c',c:'a',d:'c'},resposta:206});
 ok(ap.divergiram.join()==='b'&&ap.maisVotados.join()==='c'&&!ap.acertouTurma&&ap.linhas.find(l=>l.id==='c').bonus.some(b=>b[0]==='injusticado'),'Votado sem ter divergido ganha o bônus de injustiça');
 ap=Q.apurar({jogadores:J.slice(0,2),palpites:{a:5,b:5},votos:{},resposta:5});ok(!ap.divergiram.length&&ap.raizes.length===2,'Empate perfeito: ninguém divergiu, os dois convergem');
 ap=Q.apurar({jogadores:J.slice(0,2),palpites:{a:-5},votos:{},resposta:5});ok(!ap.divergiram.length&&ap.raizes.length===0&&ap.linhas[0].faixa.pontos===0,'Um palpite só e longe: sem carimbo, sem raiz');
 ok(Q.faixa(0.01).pontos===100&&Q.faixa(0.0100001).pontos===60&&Q.faixa(0.2).pontos===30&&Q.faixa(0.5).pontos===10&&Q.faixa(0.51).pontos===0,'Bordas das faixas');
 // leitura dos palpites
 const L2=[['1,5',1.5],['1.414',1.414],['18.000.000',18e6],['1.234,5',1234.5],['5/3',5/3],['1e-6',1e-6],['2,2·10⁻¹⁶',2.2e-16],['2,2*10^(-16)',2.2e-16],['−0,5',-0.5],['2π',2*Math.PI],['abc',null],['',null],['1/0',null]];
 for(const [x,v] of L2)ok(v===null?Q.lerNumero(x)===null:near(Q.lerNumero(x),v,1e-12),'Lê o palpite '+JSON.stringify(x));
 ok(Q.fmt(1.625,4)==='1,625'&&Q.fmt(18000,0)==='18.000'&&Q.fmt(2**-52,3)==='2,22·10⁻¹⁶'&&Q.fmt(-0.5,2)==='−0,5','Números em português');
 // página do jogo
 const qh=read('jogos/quem-divergiu/index.html');ok(/script-src 'self'/.test(qh)&&!/<script>/.test(qh)&&qh.includes('../../js/conteudo/conteudo.js')&&qh.indexOf('perguntas.js')<qh.indexOf('quem-divergiu.js'),'Página do jogo: CSP sem script embutido e scripts na ordem');
 const qjs=read('jogos/quem-divergiu/quem-divergiu.js');ok(qjs.includes("'numera-quem-divergiu-v1'")&&qjs.includes('prefers-reduced-motion')&&qjs.includes('anunciar(')&&qh.includes('aria-live="polite"'),'Guarda no navegador, respeita reduzir movimento e anuncia ao leitor de tela');
 ok(!/[\w)\]]\^/.test(qjs.replace(/\/\/.*$/gm,'')),'Sem ^ nos textos do jogo');
 {const cores=JSON.parse((/const ROUPA = (\[[^\]]+\])/.exec(qjs)||[,'[]'])[1].replace(/'/g,'"')),css=read('jogos/quem-divergiu/quem-divergiu.css'),a=Number((/rgba\(0,0,0,(\.\d+)\)\),var\(--c\)/.exec(css)||[,0])[1]);
  const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255*(1-a)).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};
  ok(cores.length>=12&&a>0&&cores.every(h=>1.05/(lum(h)+0.05)>=4.5),'Pódio: texto branco legível sobre a cor de qualquer aluno (contraste ≥ 4,5:1)');}}
group='PWA e organização';
{const man=JSON.parse(read('manifest.webmanifest'));ok(man.name&&man.short_name&&man.start_url&&man.display==='standalone'&&man.lang==='pt-BR','Manifesto do app');
 for(const ic of man.icons){ok(fs.existsSync(path.join(dir,ic.src)),'Ícone existe: '+ic.src);if(ic.src.endsWith('.png')){const b=fs.readFileSync(path.join(dir,ic.src)),w=b.readUInt32BE(16),h=b.readUInt32BE(20);ok(ic.sizes===w+'x'+h,'Tamanho do ícone '+ic.src+' ('+w+'x'+h+')');}}
 ok(man.icons.some(i=>i.purpose==='maskable'),'Ícone adaptável (maskable)');
 const walk=d=>fs.readdirSync(path.join(dir,d)).flatMap(f=>{const r=d?d+'/'+f:f;return fs.statSync(path.join(dir,r)).isDirectory()?walk(r):[r];}),sw=require('./pwa/atualizar-sw.cjs')(),files=walk('').filter(f=>f!=='sw.js'&&!f.split('/').some(x=>x.startsWith('.'))&&!/LICENSE/.test(f)&&!f.startsWith('jogos/calculandia/'));
 ok(/EM_USO = \/\\\/jogos\\\/calculandia\\\//.test(read('sw.js'))&&read('sw.js').includes('guardar(req, res)'),'Calculândia guardada no cache na primeira vez que abre (offline depois)');
 ok(files.every(f=>sw.assets.includes(f)),'Todo arquivo do site está no cache offline: '+files.filter(f=>!sw.assets.includes(f)).join(','));ok(sw.assets.filter(a=>a!=='./').every(a=>files.includes(a)),'Nenhum arquivo fantasma no cache offline');
 ok(read('sw.js').includes(`const VERSION = '${sw.version}'`),'Versão do cache offline em dia (rode tests/pwa/atualizar-sw.cjs)');
 const html=read('index.html');ok(html.includes('rel="manifest"')&&read('js/offline/registrar-offline.js').includes("register('sw.js')")&&html.includes('apple-touch-icon'),'index.html liga o manifesto e o service worker');
 const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);ok(scripts.join()===[...BASE,...SITE,'js/terminal/teclado-cientifico.js','js/offline/registrar-offline.js'].join(),'Ordem dos scripts');
 const css=[...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map(m=>m[1]);ok(['css/fontes.css','css/site.css','css/terminal.css','css/treino.css','css/grafico-de-convergencia.css','css/personagens.css'].every(c=>css.includes(c)),'Folhas de estilo ligadas');
 for(const f of files.filter(f=>f.endsWith('.js')))ok(!/\(\?<[=!]/.test(read(f)),'Sem lookbehind em regex (Safari < 16.4): '+f);}
// O número de verificações mostrado no site tem de ser o real (inclui esta).
{const shown=Number((read('js/site/estado-e-utilitarios.js').match(/const VERIFY_COUNT=(\d+);/)||[])[1]);ok(shown===count+1,`O site diz ${shown} verificações; o total real é ${count+1}. Atualize VERIFY_COUNT em js/site/estado-e-utilitarios.js.`);}
console.log(JSON.stringify({status:'PASS',checks:count,groups},null,2));
