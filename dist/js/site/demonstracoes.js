/* Numera Academy — Demonstrações interativas da página inicial (Newton, Bisseção e Secante animados).
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* ---------- Demonstrações interativas da abertura ---------- */
const HERO_SOURCE='x^3 - x - 2';let heroFn=null;const heroF=()=>heroFn||(heroFn=M.parseFunction(HERO_SOURCE));
const ROOT=1.5213797068045676;
const G={W:560,H:320,L:44,R:18,T:16,B:34,lo:-1,hi:3,ylo:-6,yhi:22,min:-0.9,max:2.9};
const GX=x=>G.L+(x-G.lo)/(G.hi-G.lo)*(G.W-G.L-G.R),GY=y=>G.T+(G.yhi-y)/(G.yhi-G.ylo)*(G.H-G.T-G.B);
function demoBase(extra){const f=heroF();let path='',pen=false;for(let i=0;i<=160;i++){const x=G.lo+(G.hi-G.lo)*i/160,y=f(x);if(!Number.isFinite(y)||y>G.yhi+8||y<G.ylo-8){pen=false;continue;}path+=(pen?'L':'M')+GX(x).toFixed(1)+' '+GY(y).toFixed(1)+' ';pen=true;}
 const gx=[-1,0,1,2,3].map(v=>`<path class="g-grid" d="M${GX(v).toFixed(1)} ${G.T}V${G.H-G.B}"/><text class="g-label" x="${GX(v).toFixed(1)}" y="${G.H-12}" text-anchor="middle">${v}</text>`).join(''),gy=[-5,0,5,10,15,20].map(v=>`<path class="g-grid" d="M${G.L} ${GY(v).toFixed(1)}H${G.W-G.R}"/><text class="g-label" x="${G.L-8}" y="${(GY(v)+4).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
 return `${gx}${gy}<path class="g-axis" d="M${G.L} ${GY(0).toFixed(1)}H${G.W-G.R}"/><text class="g-label" x="${G.W-G.R-4}" y="${(GY(0)-8).toFixed(1)}" text-anchor="end">x</text><g clip-path="url(#democlip)">${extra.under||''}<path class="g-curve" d="${path}"/>${extra.over||''}</g><circle class="g-root" cx="${GX(ROOT).toFixed(1)}" cy="${GY(0).toFixed(1)}" r="3.5"/>${extra.top||''}`;}
function demoState(){const f=heroF(),d=s.demos;
 if(s.demo==='bisection'){const {a,b}=d.bisection,fa=f(a),fb=f(b),m=(a+b)/2,fm=f(m),keepLeft=fa*fm<=0;return {kind:'bisection',a,b,fa,fb,m,fm,keepLeft,done:(b-a)/2<1e-4||Math.abs(fm)<1e-9};}
 if(s.demo==='secant'){const {x0,x1}=d.secant,f0=f(x0),f1=f(x1),den=f1-f0,x2=Math.abs(den)<1e-12?NaN:x1-f1*(x1-x0)/den;return {kind:'secant',x0,x1,f0,f1,x2,done:Math.abs(f1)<1e-9,out:!(x2>=G.min&&x2<=G.max)};}
 const {x0}=d.newton,fx=f(x0),dv=M.derivative(f,x0),flat=!Number.isFinite(dv)||Math.abs(dv)<0.15,x1=flat?NaN:x0-fx/dv;return {kind:'newton',x0,fx,d:dv,flat,x1,done:Math.abs(fx)<1e-6,out:!flat&&!(x1>=G.min&&x1<=G.max)};}
function demoPlot(){const st=demoState(),f=heroF();let svg='',read='',note='';
 if(st.kind==='newton'){const {x0,fx,d,flat,x1}=st;
  svg=demoBase({over:`${Number.isFinite(d)?`<path class="g-tangent" d="M${GX(G.lo).toFixed(1)} ${GY(fx+d*(G.lo-x0)).toFixed(1)}L${GX(G.hi).toFixed(1)} ${GY(fx+d*(G.hi-x0)).toFixed(1)}"/>`:''}${fx<=G.yhi&&fx>=G.ylo?`<path class="g-guide" d="M${GX(x0).toFixed(1)} ${GY(0).toFixed(1)}V${GY(fx).toFixed(1)}"/><circle class="g-point" cx="${GX(x0).toFixed(1)}" cy="${GY(fx).toFixed(1)}" r="5"/>`:''}`,top:`${!flat&&!st.out?`<circle class="g-next" cx="${GX(x1).toFixed(1)}" cy="${GY(0).toFixed(1)}" r="6"/><text class="g-tag" x="${GX(x1).toFixed(1)}" y="${(GY(0)+22).toFixed(1)}" text-anchor="middle">x₁</text>`:''}<g class="g-handle" transform="translate(${GX(x0).toFixed(1)} ${GY(0).toFixed(1)})"><circle r="16" class="g-handle-halo"/><circle r="8" class="g-handle-dot"/></g><text class="g-tag strong" x="${GX(x0).toFixed(1)}" y="${(GY(0)-16).toFixed(1)}" text-anchor="middle">x₀</text>`});
  read=`<div><span>x₀</span><b>${short(x0)}</b></div><div><span>f(x₀)</span><b>${short(fx)}</b></div><div><span>f′(x₀)</span><b>${short(d)}</b></div><div class="accent"><span>x₁ = x₀ − f/f′</span><b>${flat?'—':short(x1)}</b></div>`;
  note=flat?'A tangente está quase horizontal: o próximo palpite iria para muito longe. É uma armadilha do Newton-Raphson.':st.done?'Chegamos à raiz: |f(x)| já é praticamente zero.':st.out?`O próximo palpite, x₁ ≈ ${short(x1)}, cai fora do gráfico. Um x₀ ruim pode afastar o método da raiz.`:`A tangente em x₀ cruza o eixo em x₁ ≈ ${short(x1)}. Esse é o próximo palpite. Arraste o ponto azul.`;}
 else if(st.kind==='bisection'){const {a,b,fa,fb,m,fm}=st;
  svg=demoBase({under:`<rect class="g-band" x="${GX(a).toFixed(1)}" y="${G.T}" width="${Math.max(1,GX(b)-GX(a)).toFixed(1)}" height="${G.H-G.T-G.B}"/>`,over:`<circle class="g-point" cx="${GX(a).toFixed(1)}" cy="${GY(Math.max(G.ylo,Math.min(G.yhi,fa))).toFixed(1)}" r="4.5"/><circle class="g-point" cx="${GX(b).toFixed(1)}" cy="${GY(Math.max(G.ylo,Math.min(G.yhi,fb))).toFixed(1)}" r="4.5"/><path class="g-guide" d="M${GX(m).toFixed(1)} ${G.T}V${G.H-G.B}"/>`,top:`<circle class="g-next" cx="${GX(m).toFixed(1)}" cy="${GY(0).toFixed(1)}" r="6"/><text class="g-tag" x="${GX(m).toFixed(1)}" y="${(GY(0)+22).toFixed(1)}" text-anchor="middle">m</text>`});
  read=`<div><span>a</span><b>${short(a)}</b></div><div><span>b</span><b>${short(b)}</b></div><div><span>m = (a+b)/2</span><b>${short(m)}</b></div><div class="accent"><span>f(m)</span><b>${short(fm)}</b></div>`;
  note=st.done?`O intervalo ficou com largura ${short(b-a)}: o ponto médio está a menos de ${short((b-a)/2)} da raiz.`:`f(m) ${fm<0?'é negativo':'é positivo'}. A raiz fica na metade ${st.keepLeft?'da esquerda, [a, m]':'da direita, [m, b]'}, onde o sinal muda.`;}
 else{const {x0,x1,f0,f1,x2}=st,slope=(f1-f0)/(x1-x0);
  svg=demoBase({over:`<path class="g-tangent solid" d="M${GX(G.lo).toFixed(1)} ${GY(f0+slope*(G.lo-x0)).toFixed(1)}L${GX(G.hi).toFixed(1)} ${GY(f0+slope*(G.hi-x0)).toFixed(1)}"/>${[[x0,f0],[x1,f1]].filter(([,y])=>y<=G.yhi&&y>=G.ylo).map(([x,y])=>`<circle class="g-point" cx="${GX(x).toFixed(1)}" cy="${GY(y).toFixed(1)}" r="5"/>`).join('')}`,top:`${!st.out&&Number.isFinite(x2)?`<circle class="g-next" cx="${GX(x2).toFixed(1)}" cy="${GY(0).toFixed(1)}" r="6"/><text class="g-tag" x="${GX(x2).toFixed(1)}" y="${(GY(0)+22).toFixed(1)}" text-anchor="middle">x₂</text>`:''}`});
  read=`<div><span>x₀</span><b>${short(x0)}</b></div><div><span>x₁</span><b>${short(x1)}</b></div><div><span>f(x₁)</span><b>${short(f1)}</b></div><div class="accent"><span>x₂</span><b>${short(x2)}</b></div>`;
  note=st.done?'Chegamos à raiz sem calcular nenhuma derivada.':st.out?`O próximo ponto, x₂ ≈ ${short(x2)}, sai do gráfico. Recomece com outros pontos.`:`A reta pelos dois últimos pontos cruza o eixo em x₂ ≈ ${short(x2)}. A Secante troca a derivada por essa inclinação.`;}
 return `<svg class="demo-svg ${st.kind==='newton'?'draggable':''}" viewBox="0 0 ${G.W} ${G.H}" role="img" aria-label="Gráfico de f(x) = x³ − x − 2 com o passo atual do método"><defs><clipPath id="democlip"><rect x="${G.L}" y="${G.T}" width="${G.W-G.L-G.R}" height="${G.H-G.T-G.B}"/></clipPath></defs>${svg}</svg><div class="demo-readout">${read}</div><p class="demo-note" role="status">${note}</p>`;}
const DEMOS=[['newton','Newton-Raphson'],['bisection','Bisseção'],['secant','Secante']];
function demoStepLabel(){return s.demo==='bisection'?'Dividir ao meio':s.demo==='secant'?'Traçar a próxima secante':'Dar o próximo passo';}
function demoCount(){const k=s.demos[s.demo].k;return k?`${k} ${k===1?'passo':'passos'}`:s.demo==='newton'?'Arraste o ponto azul':'Clique para avançar';}
function heroWidget(){return `<div class="demo-tabs" role="group" aria-label="Escolha o método da demonstração">${DEMOS.map(([id,t])=>`<button type="button" data-act="demo" data-id="${id}" class="${s.demo===id?'active':''}" aria-pressed="${s.demo===id}">${t}</button>`).join('')}</div><div class="demo-fn"><code>f(x) = x³ − x − 2</code><span class="autoplay" id="autoplay-label">${demoAuto.on?'Demonstração automática':''}</span></div><div id="demo-plot">${demoPlot()}</div><div class="demo-controls">${s.demo==='newton'?`<label class="sr-only" for="demo-x0">Posição do palpite x₀</label><input id="demo-x0" type="range" min="${G.min}" max="${G.max}" step="0.01" value="${s.demos.newton.x0}">`:''}<div class="demo-buttons">${btn(demoStepLabel(),'demo-step','primary')}${btn('Recomeçar','demo-reset','ghost')}<span class="demo-count" id="demo-count">${demoCount()}</span></div></div>`;}
function refreshDemo(){const plot=$('#demo-plot');if(plot)plot.innerHTML=demoPlot();const range=$('#demo-x0');if(range&&document.activeElement!==range)range.value=s.demos.newton.x0;const count=$('#demo-count');if(count)count.textContent=demoCount();const lab=$('#autoplay-label');if(lab)lab.textContent=demoAuto.on?'Demonstração automática':'';}
function setNewtonX(x,round=true){const v=Math.min(G.max,Math.max(G.min,x));s.demos.newton.x0=round?Math.round(v*1000)/1000:v;}
function demoReset(id=s.demo){s.demos[id]=id==='newton'?{x0:2.4,k:0}:id==='bisection'?{a:0.5,b:2.5,k:0}:{x0:0.6,x1:2.6,k:0};}
function demoStep(){const st=demoState(),d=s.demos[s.demo];if(st.done)return false;
 if(st.kind==='newton'){if(st.flat||st.out)return false;setNewtonX(st.x1,false);}
 else if(st.kind==='bisection'){if(st.keepLeft)d.b=st.m;else d.a=st.m;}
 else{if(st.out||!Number.isFinite(st.x2))return false;d.x0=d.x1;d.x1=st.x2;}
 d.k++;return true;}
/* Demonstração automática: roda sozinha até a pessoa interagir. Desligada com movimento reduzido. */
const demoAuto={on:false,timer:null};
function stopAuto(){demoAuto.on=false;if(demoAuto.timer){clearTimeout(demoAuto.timer);demoAuto.timer=null;}const lab=$('#autoplay-label');if(lab)lab.textContent='';}
function autoTick(){demoAuto.timer=null;if(!demoAuto.on)return;if(!$('#demo-plot')){demoAuto.on=false;return;}
 if(!demoStep()){const i=DEMOS.findIndex(([id])=>id===s.demo);s.demo=DEMOS[(i+1)%DEMOS.length][0];demoReset(s.demo);const w=$('#hero-widget');if(w)w.innerHTML=heroWidget();}else refreshDemo();
 demoAuto.timer=setTimeout(autoTick,1700);}
function startAuto(){if(demoAuto.on||typeof window.matchMedia!=='function')return;try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(_){return;}demoAuto.on=true;demoAuto.timer=setTimeout(autoTick,2200);}

