// Ícones das ferramentas, relíquias e cartas: desenhos simples em SVG, no traço da Calculândia
// (contorno marrom-escuro, cores chapadas). Cada um lembra a ideia do método.
const S = (body, bg = '#fff7e6') => `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="1" y="1" width="30" height="30" rx="6" fill="${bg}" stroke="#3a2a1a" stroke-width="2"/>${body}</svg>`;
const L = 'stroke="#3a2a1a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const curva = `<path d="M5 24 C 12 24, 16 6, 27 7" ${L}/>`;
const eixo = '<path d="M4 18 H28" stroke="#9b8a6a" stroke-width="1.5"/>';

export const ICONES = {
  truncamento: S(`<text x="16" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="#3a2a1a">3,0009</text><path d="M7 20 H25" ${L}/><text x="16" y="28" text-anchor="middle" font-size="9" font-weight="700" fill="#2e8b3a">3,001</text>`, '#fff3c4'),
  cancelamento: S(`<text x="16" y="14" text-anchor="middle" font-size="7" font-weight="700" fill="#3a2a1a">1000−1000</text><text x="16" y="27" text-anchor="middle" font-size="12" font-weight="700" fill="#c0352b">0?</text>`, '#fff3c4'),
  overflow: S(`<path d="M9 12 V26 H23 V12" ${L}/><path d="M8 10 C 10 4, 22 4, 24 10" stroke="#4fb3d9" stroke-width="3" fill="none"/><path d="M10 17 H22 V25 H10Z" fill="#4fb3d9"/>`, '#fff3c4'),
  bissecao: S(`${eixo}<path d="M6 10 V26 M26 10 V26" stroke="#8e5bd1" stroke-width="2.5"/><path d="M16 8 V28" stroke="#c0352b" stroke-width="2" stroke-dasharray="3 2"/>${curva}`),
  falsaPosicao: S(`${eixo}${curva}<path d="M5 24 L27 7" stroke="#c0352b" stroke-width="2"/>`),
  pontoFixo: S(`<path d="M5 27 L27 5" stroke="#9b8a6a" stroke-width="1.5"/><path d="M8 26 V12 H14 V18 H11 V15 H12" ${L} stroke="#1f5fbf"/><path d="M5 22 C 12 10, 20 14, 27 12" ${L}/>`),
  newton: S(`${eixo}${curva}<path d="M10 27 L27 3" stroke="#c0352b" stroke-width="2"/><circle cx="21" cy="11" r="2.2" fill="#c0352b"/>`),
  secante: S(`${eixo}${curva}<circle cx="11" cy="21" r="2" fill="#1f5fbf"/><circle cx="22" cy="9" r="2" fill="#1f5fbf"/><path d="M6 27 L27 5" stroke="#1f5fbf" stroke-width="2"/>`),
  gauss: S(`<path d="M7 7 H25 V25 Z" fill="#79c267" stroke="#3a2a1a" stroke-width="2"/><path d="M7 7 V25 H25" ${L} stroke-dasharray="2 2"/>`),
  pivoteamento: S(`<path d="M8 10 H24 M8 22 H24" ${L}/><path d="M12 13 V19 M10 17 L12 19 L14 17 M20 19 V13 M18 15 L20 13 L22 15" stroke="#c0352b" stroke-width="2" fill="none"/>`),
  lu: S(`<path d="M5 7 V25 H15 Z" fill="#5d9be0" stroke="#3a2a1a" stroke-width="1.6"/><path d="M17 7 H27 V25 Z" fill="#e2675e" stroke="#3a2a1a" stroke-width="1.6"/>`),
  jacobi: S(`<rect x="7" y="7" width="18" height="18" ${L}/><path d="M7 13 H25 M7 19 H25 M13 7 V25 M19 7 V25" stroke="#9b8a6a" stroke-width="1"/><path d="M8 8 L24 24" stroke="#2e8b3a" stroke-width="3"/>`),
  seidel: S(`<rect x="7" y="7" width="18" height="18" ${L}/><path d="M8 8 L24 24" stroke="#2e8b3a" stroke-width="3"/><path d="M10 26 C 4 18, 6 10, 12 6" stroke="#1f5fbf" stroke-width="2" fill="none"/>`),
  lagrange: S(`<path d="M5 22 C 10 6, 18 6, 27 18" ${L}/><circle cx="7" cy="18" r="2.2" fill="#c0352b"/><circle cx="16" cy="9" r="2.2" fill="#c0352b"/><circle cx="25" cy="16" r="2.2" fill="#c0352b"/>`),
  newtonInterp: S(`<path d="M6 25 H12 V19 H18 V13 H24 V7" ${L}/><circle cx="24" cy="7" r="2.2" fill="#c0352b"/>`),
  spline: S(`<path d="M4 20 C 9 8, 13 8, 16 16 S 24 26, 28 12" ${L} stroke="#8e5bd1" stroke-width="2.5"/><circle cx="16" cy="16" r="2" fill="#3a2a1a"/>`),
  minimosQuadrados: S(`<path d="M5 25 L27 8" stroke="#c0352b" stroke-width="2"/>${[[8, 21], [12, 20], [15, 16], [19, 15], [22, 10], [25, 11]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#1f5fbf"/>`).join('')}`),
  trapezio: S(`<path d="M6 26 V18 L16 12 V26 Z M16 26 V12 L26 9 V26 Z" fill="#9ad37a" stroke="#3a2a1a" stroke-width="1.6"/>`),
  simpson13: S(`<path d="M5 26 V20 C 10 8, 20 8, 27 16 V26 Z" fill="#7ab8f5" stroke="#3a2a1a" stroke-width="1.6"/>`),
  simpson38: S(`<path d="M5 26 V20 C 9 9, 14 9, 18 13 S 25 10, 27 14 V26 Z" fill="#5d9be0" stroke="#3a2a1a" stroke-width="1.6"/>`),
  combo: S(`<path d="M5 26 V19 C 9 10, 14 10, 16 14 V26 Z" fill="#7ab8f5" stroke="#3a2a1a" stroke-width="1.4"/><path d="M16 26 V14 C 20 10, 24 9, 27 13 V26 Z" fill="#5d9be0" stroke="#3a2a1a" stroke-width="1.4"/>`),
  euler: S(`<path d="M5 25 C 12 23, 20 15, 27 6" stroke="#9b8a6a" stroke-width="1.5" fill="none"/><path d="M5 25 L12 21 L19 15 L27 9" ${L} stroke="#c0352b"/>`),
  rk4: S(`<path d="M5 25 C 12 23, 20 15, 27 6" ${L}/>${[[8, 23, 13, 21], [12, 21, 17, 18], [16, 18, 21, 14], [20, 15, 25, 10]].map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}" stroke="#e07a3f" stroke-width="2.4"/>`).join('')}`),
  implicito: S(`<path d="M5 8 C 10 20, 18 24, 27 25" ${L}/><path d="M24 22 L18 17 M18 17 V22 M18 17 H23" stroke="#2e8b3a" stroke-width="2" fill="none"/>`),
  // relíquias: gema com uma letra
  reliquia: (letra) => S(`<path d="M16 4 L26 12 L16 28 L6 12 Z" fill="#b48de8" stroke="#3a2a1a" stroke-width="2"/><text x="16" y="17" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">${letra}</text>`, '#efe6f7'),
  carta: (letra) => S(`<rect x="8" y="5" width="16" height="22" rx="2" fill="#fffdf6" stroke="#3a2a1a" stroke-width="2"/><text x="16" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="#8a4d12">${letra}</text>`, '#f7e7c6'),
  cadeado: S(`<rect x="9" y="14" width="14" height="12" rx="2" fill="#9b8a6a" stroke="#3a2a1a" stroke-width="2"/><path d="M12 14 V10 a4 4 0 0 1 8 0 V14" ${L}/>`, '#e9dfca'),
};

export function icone(id) { return ICONES[id] || ICONES.carta('?'); }
