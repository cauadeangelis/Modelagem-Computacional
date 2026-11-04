/* Numera Academy — Gráficos SVG da função e do Ponto Fixo (diagrama em teia).
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* ---------- Gráficos ---------- */
function graph(fn,r,input={},row=null){
 // Só marca raízes no eixo quando a execução foi aceita: uma quase-raiz não ganha a bolinha verde de raiz.
 const roots=r.converged===false&&!r.roots?[]:r.roots?.map(x=>x.root)||[r.root],center=typeof r.root==='number'?r.root:0;
 let a=Number(input.a),b=Number(input.b);if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b){a=center-2;b=center+2;}
 if(row&&Number.isFinite(row.a)){a=Math.min(a,row.a);b=Math.max(b,row.b);}
 const span=Math.max(b-a,.2),lo=Math.min(a,center)-span*.25,hi=Math.max(b,center)+span*.25,W=640,H=290,L=48,R=18,T=22,B=38;
 const pts=[];for(let i=0;i<=240;i++){const x=lo+(hi-lo)*i/240;let y;try{y=fn(x);}catch(_){y=NaN;}pts.push([x,y]);}
 const ys=pts.map(q=>q[1]).filter(Number.isFinite).sort((u,v)=>u-v);if(!ys.length)return '<p class="fine">Sem pontos reais finitos para desenhar nesta faixa.</p>';
 let low=Math.min(0,ys[Math.floor(ys.length*.03)]),high=Math.max(0,ys[Math.floor(ys.length*.97)]);if(!(high-low>1e-300)){low-=1;high+=1;}const pad=(high-low)*.12;low-=pad;high+=pad;
 // Escala do eixo vertical: funções minúsculas (1e-20·(x²+1)) ou enormes ganham um fator 10ᴱ no rótulo, em vez de virar uma reta sobre o eixo.
 const mag=Math.max(Math.abs(low),Math.abs(high)),E=mag<1e-3||mag>=1e6?Math.floor(Math.log10(mag)):0,unit=Math.pow(10,E),sup=n=>String(n).replace(/[-0-9]/g,c=>'⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
 const X=x=>L+(x-lo)/(hi-lo)*(W-L-R),Y=y=>H-B-(y-low)/(high-low)*(H-T-B);
 let path='',last=null;for(const [x,y]of pts){if(!Number.isFinite(y)||y<low-(high-low)*2||y>high+(high-low)*2){last=null;continue;}const px=X(x),py=Y(y);path+=(last&&Math.abs(py-last)<H*.6?'L':'M')+px.toFixed(2)+' '+py.toFixed(2)+' ';last=py;}
 let overlay='';if(r.interval&&!row)for(const [v,l] of [[r.interval.a,'a'],[r.interval.b,'b']])if(v>=lo&&v<=hi)overlay+=`<path class="g-iv" d="M${X(v)} ${T}V${H-B}"/><text class="g-label g-iv-label" x="${X(v)+5}" y="${T+14}">${l}</text>`;
 if(row?.a!==undefined)overlay+=`<rect class="g-band" x="${X(row.a)}" y="${T}" width="${Math.max(0,X(row.b)-X(row.a))}" height="${H-T-B}"/>`;
 if(row?.kept!==undefined&&Number.isFinite(row.fa)&&Number.isFinite(row.fb))overlay+=`<path class="g-chord" d="M${X(row.a)} ${Y(row.fa)}L${X(row.b)} ${Y(row.fb)}"/><circle class="g-point" cx="${X(row.a)}" cy="${Y(row.fa)}" r="4"/><circle class="g-point" cx="${X(row.b)}" cy="${Y(row.fb)}" r="4"/>`;
 if(row?.derivative!==undefined){const xx=row.previous,yy=fn(xx),d=row.derivative;overlay+=`<path class="g-tangent" d="M${X(lo)} ${Y(yy+d*(lo-xx))}L${X(hi)} ${Y(yy+d*(hi-xx))}"/>`;}
 if(row?.f0!==undefined&&row.x1!==row.x0){const slope=(row.f1-row.f0)/(row.x1-row.x0);overlay+=`<path class="g-tangent" d="M${X(lo)} ${Y(row.f0+slope*(lo-row.x0))}L${X(hi)} ${Y(row.f0+slope*(hi-row.x0))}"/>`;}
 const marker=row&&typeof row.x==='number'?row.x:center;
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico aproximado de f(x). Faixa ${num(lo)} a ${num(hi)}.${E?` Eixo vertical em unidades de 10 elevado a ${E}.`:''} O desenho não prova continuidade."><defs><clipPath id="plotclip"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath></defs>${Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return `<path class="g-grid" d="M${L} ${Y(v)}H${W-R}"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" class="g-label">${safe(Number((v/unit).toPrecision(3)).toLocaleString('pt-BR'))}</text>`;}).join('')}<path class="g-axis" d="M${L} ${Y(0)}H${W-R}"/><g clip-path="url(#plotclip)">${overlay}<path class="g-curve" d="${path}"/>${roots.filter(v=>v>=lo&&v<=hi).map(v=>`<circle class="g-root" cx="${X(v)}" cy="${Y(0)}" r="4"/>`).join('')}${Number.isFinite(fn(marker))?`<circle class="g-point big" cx="${X(marker)}" cy="${Y(fn(marker))}" r="6"/>`:''}</g>${Array.from({length:5},(_,i)=>{const v=lo+(hi-lo)*i/4;return `<text class="g-label" x="${X(v)}" y="${H-12}" text-anchor="middle">${safe(Number(v.toPrecision(3)).toLocaleString('pt-BR'))}</text>`;}).join('')}<text x="${W-R-4}" y="${Y(0)-8}" text-anchor="end" class="g-label">x</text><text x="${L}" y="16" class="g-label">${E?'f(x), em unidades de 10'+sup(E):'f(x)'}</text></svg></div>`;
}

/* Diagrama em teia do Ponto Fixo: y = g(x), y = x e os degraus xₖ → g(xₖ) → xₖ₊₁. */
function cobweb(g,r,row=null){
 const its=r.iterations,upto=row?Math.max(0,its.indexOf(row)):its.length-1,shown=its.slice(0,Math.min(its.length,Math.max(upto+1,1)));
 const xs=its.slice(0,12).map(t=>t.x).concat(its.slice(0,12).map(t=>t.gx)).filter(Number.isFinite);if(!xs.length)return '';
 let lo=Math.min(...xs),hi=Math.max(...xs);const span=Math.max(hi-lo,.2);lo-=span*.3;hi+=span*.3;
 const W=640,H=320,L=48,R=18,T=18,B=38,X=x=>L+(x-lo)/(hi-lo)*(W-L-R),Y=y=>H-B-(y-lo)/(hi-lo)*(H-T-B);
 let path='',pen=false;for(let i=0;i<=240;i++){const x=lo+(hi-lo)*i/240;let y;try{y=g(x);}catch(_){y=NaN;}if(!Number.isFinite(y)||y<lo-(hi-lo)||y>hi+(hi-lo)){pen=false;continue;}path+=(pen?'L':'M')+X(x).toFixed(1)+' '+Y(y).toFixed(1)+' ';pen=true;}
 let web=`M${X(shown[0].x).toFixed(1)} ${Y(lo).toFixed(1)}V${Y(shown[0].x).toFixed(1)}`;
 for(let k=0;k<shown.length;k++){const t=shown[k];if(!Number.isFinite(t.gx))break;web+=`V${Y(t.gx).toFixed(1)}`;if(k<shown.length-1)web+=`H${X(t.gx).toFixed(1)}`;}
 const cur=shown[shown.length-1],ticks=Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama em teia do Ponto Fixo: curva y = g(x), diagonal y = x e ${shown.length} iterações"><defs><clipPath id="webclip"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath></defs>${ticks.map(v=>`<path class="g-grid" d="M${L} ${Y(v).toFixed(1)}H${W-R}"/><text class="g-label" x="${L-8}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end">${safe(short(v))}</text><text class="g-label" x="${X(v).toFixed(1)}" y="${H-12}" text-anchor="middle">${safe(short(v))}</text>`).join('')}<g clip-path="url(#webclip)"><path class="g-diag" d="M${X(lo)} ${Y(lo)}L${X(hi)} ${Y(hi)}"/><path class="g-curve" d="${path}"/><path class="g-web" d="${web}"/>${Number.isFinite(cur.gx)?`<circle class="g-point big" cx="${X(cur.x).toFixed(1)}" cy="${Y(cur.gx).toFixed(1)}" r="6"/>`:''}</g><text class="g-label" x="${W-R-4}" y="${(Y(hi)+14).toFixed(1)}" text-anchor="end">y = x</text><text class="g-label" x="${L}" y="14">y = g(x)</text></svg></div>`;}

