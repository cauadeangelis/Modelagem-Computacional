/* Progresso local, migração da v3 e validação de backups. Não depende da interface. */
(function(global){'use strict';
const KEY='numera-academy-v4',C=global.NumeraContent;
const ids=new Set([...Object.entries(C.TASKS).flatMap(([m,t])=>t.map((_,i)=>`c:${m}:${i}`)),...C.ARENA.map((_,i)=>`a:${i}`),...(C.ALL_CASES||C.CASES).flatMap(c=>c.tasks.map((_,i)=>`p:${c.id}:${i}`))]); // inclui o que está escondido: o progresso guardado não se perde
const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x));
// v11: moedas (recompensa de sequência e de fase), itens do camarim dos mascotes, melhor sequência e modo livre da jornada.
const fresh=()=>({version:4,xp:0,completed:{},attempts:{},review:{},activity:{},history:[],labCount:0,coins:0,owned:[],outfit:[],best:0,free:false,paid:{}});
const ITEM=/^[a-z]{2,20}$/,PAID=/^(n|m):[a-z]+:\d$|^w:[a-z]+$/;
function validate(raw){
 if(!raw||raw.version!==4||typeof raw.completed!=='object'||!raw.completed||Array.isArray(raw.completed))throw Error('Backup inválido. Use um arquivo exportado pela Numera v4.');
 const p=fresh();p.xp=Number.isFinite(raw.xp)?Math.min(1000000,Math.max(0,Math.floor(raw.xp))):0;p.labCount=Number.isFinite(raw.labCount)?Math.min(1000000,Math.max(0,Math.floor(raw.labCount))):0;
 for(const [id,v] of Object.entries(raw.completed))if(ids.has(id)&&v&&Number.isInteger(v.stars)&&v.stars>=1&&v.stars<=3)p.completed[id]={stars:v.stars,date:validDate(v.date)?v.date:day()};
 for(const [id,v] of Object.entries(raw.attempts||{}))if(ids.has(id)&&Number.isFinite(v)&&v>=0)p.attempts[id]=Math.min(10000,Math.floor(v));
 for(const [id,v] of Object.entries(raw.review||{}))if(ids.has(id)&&v&&validDate(v.due))p.review[id]={due:v.due,interval:[1,3,7,14].includes(v.interval)?v.interval:1};
 for(const [d,values] of Object.entries(raw.activity||{}))if(validDate(d)&&Array.isArray(values))p.activity[d]=[...new Set(values.filter(id=>ids.has(id)))];
 p.coins=Number.isFinite(raw.coins)?Math.min(1000000,Math.max(0,Math.floor(raw.coins))):0;p.best=Number.isFinite(raw.best)?Math.min(100000,Math.max(0,Math.floor(raw.best))):0;p.free=raw.free===true;
 p.owned=[...new Set((Array.isArray(raw.owned)?raw.owned:[]).filter(x=>typeof x==='string'&&ITEM.test(x)))].slice(0,50);p.outfit=[...new Set((Array.isArray(raw.outfit)?raw.outfit:[]).filter(x=>p.owned.includes(x)))].slice(0,10);
 for(const k of Object.keys(raw.paid&&typeof raw.paid==='object'?raw.paid:{}))if(PAID.test(k)&&raw.paid[k]===true)p.paid[k]=true;
 p.history=(Array.isArray(raw.history)?raw.history:[]).filter(h=>h&&typeof h.source==='string'&&h.source.length<=4000&&typeof h.method==='string').slice(0,10).map(h=>({source:h.source,method:h.method,date:String(h.date||'').slice(0,40),summary:String(h.summary||'').slice(0,200)}));
 return p;
}
function load(storage){let warning='';try{const raw=storage.getItem(KEY);if(raw)return {p:validate(JSON.parse(raw)),warning};const old=JSON.parse(storage.getItem('numera-academy-v3')||'null');if(old){const p=fresh();p.xp=Math.max(0,Math.min(1000000,Number(old.xp)||0));for(const s of old.done||[]){const m=/^(bisection|newton|secant|gauss|seidel)-(\d+)$/.exec(s);if(m&&ids.has(`c:${m[1]}:${m[2]}`))p.completed[`c:${m[1]}:${m[2]}`]={stars:1,date:day()};}for(const i of old.arenaDone||[])if(ids.has(`a:${i}`))p.completed[`a:${i}`]={stars:1,date:day()};return {p,warning:'Seu progresso da versão 3 foi importado. As estrelas começam em 1 porque a versão anterior não registrava tentativas.'};}}catch(e){warning='Não foi possível ler o progresso salvo. A sessão continua; exporte um backup antes de fechar.';}return {p:fresh(),warning};}
function save(p,storage){try{storage.setItem(KEY,JSON.stringify(p));return true;}catch(_){return false;}}
function complete(p,id,{wrong=0,hint=false,review=false}={}){
 if(!ids.has(id))throw Error('Atividade desconhecida.');const today=day(),first=!p.completed[id],stars=wrong===0&&!hint?3:wrong<=1?2:1;
 p.completed[id]={stars:Math.max(p.completed[id]?.stars||0,stars),date:today};
 const events=p.activity[today]??[];const newToday=!events.includes(id);if(newToday)events.push(id);p.activity[today]=events;
 let xp=first?(id.startsWith('p:')?40:id.startsWith('a:')?30:20):0;
 if(newToday&&events.length===3)xp+=30;
 p.xp+=xp;
 if(p.review[id]||wrong>0||hint||review){const prev=p.review[id]?.interval||0,days=wrong||hint?1:prev<3?3:prev<7?7:14,d=new Date();d.setDate(d.getDate()+days);p.review[id]={due:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,interval:days};}
 return {first,xp,stars};
}
function wrong(p,id){p.attempts[id]=(p.attempts[id]||0)+1;p.review[id]={due:day(),interval:1};}
function streak(p){let d=new Date(),count=0;const date=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;if(!p.activity[date(d)]?.length)d.setDate(d.getDate()-1);while(p.activity[date(d)]?.length){count++;d.setDate(d.getDate()-1);if(count>3650)break;}return count;}
global.NumeraProgress={KEY,ids,day,fresh,validate,load,save,complete,wrong,streak};
})(window);
