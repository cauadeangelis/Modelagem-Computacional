/* Numera Academy — Ilustrações SVG de cada método.
   Parte da interface (antes, app.js). Os arquivos de js/site e js/paginas são scripts clássicos que
   compartilham as mesmas variáveis; a ordem de carregamento está no index.html. */
'use strict';
/* ---------- Ilustrações dos métodos (SVG próprio) ---------- */
function art(id,cls=''){const curve='M8 70 C34 69 52 60 66 44 S92 12 112 6';const map={
 bisection:`<rect class="a-band" x="10" y="14" width="100" height="10" rx="5"/><rect class="a-band" x="35" y="30" width="50" height="10" rx="5"/><rect class="a-band" x="47" y="46" width="26" height="10" rx="5"/><rect class="a-band strong" x="54" y="62" width="12" height="10" rx="5"/><path class="a-line" d="M60 8V76"/>`,
 newton:`<path class="a-axis" d="M6 52H114"/><path class="a-curve" d="${curve}"/><path class="a-dash" d="M50 76 104 14"/><circle class="a-dot" cx="94" cy="25" r="5"/><circle class="a-ring" cx="71" cy="52" r="5"/>`,
 secant:`<path class="a-axis" d="M6 52H114"/><path class="a-curve" d="${curve}"/><path class="a-solid" d="M30 76 110 0"/><circle class="a-dot" cx="52" cy="55" r="5"/><circle class="a-dot" cx="98" cy="12" r="5"/><circle class="a-ring" cx="58" cy="52" r="5"/>`,
 gauss:`${[0,1,2].map(r=>[0,1,2,3].map(c=>`<rect class="${c<r?'a-cell zero':c===3?'a-cell rhs':'a-cell'}" x="${16+c*24}" y="${8+r*24}" width="20" height="20" rx="6"/>`).join('')).join('')}`,
 falseposition:`<path class="a-axis" d="M6 52H114"/><path class="a-curve" d="${curve}"/><path class="a-solid" d="M8 70 L112 6"/><path class="a-dash" d="M37 52V62"/><circle class="a-dot" cx="8" cy="70" r="5"/><circle class="a-dot" cx="112" cy="6" r="5"/><circle class="a-ring" cx="37" cy="52" r="5"/>`,
 fixedpoint:`<path class="a-axis" d="M10 72 L110 8"/><path class="a-curve" d="M10 30 C40 34 70 42 110 50"/><path class="a-solid" d="M20 72 V32 H72.5 V42.5 H56 V39.2 H61.2 V40.2"/><circle class="a-dot" cx="20" cy="72" r="4"/><circle class="a-ring big" cx="60" cy="40" r="8"/>`,
 seidel:`<path class="a-solid" d="M12 70 L40 18 L58 58 L72 30 L80 48 L86 38"/><circle class="a-dot" cx="12" cy="70" r="4"/><circle class="a-dot" cx="40" cy="18" r="4"/><circle class="a-dot" cx="58" cy="58" r="4"/><circle class="a-dot" cx="72" cy="30" r="4"/><circle class="a-ring big" cx="84" cy="41" r="9"/>`};
 return `<svg class="art ${cls}" viewBox="0 0 120 80" aria-hidden="true">${map[id]||''}</svg>`;}

