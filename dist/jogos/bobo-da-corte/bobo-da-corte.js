/* Bobo da Corte — o jogo de sala do Numera Academy (v14; antes se chamava Quem Divergiu?).
   O telão mostra uma pergunta com resposta numérica; cada jogador faz um palpite em segredo; a turma vota em quem
   deve ter divergido; a reta numérica revela a resposta com as faixas de tolerância (1%, 5% e 20%). O mais votado vira
   o BOBO DA CORTE da rodada: cortina, holofote, a dança do bobo e a roleta de prendas.
   Eventos especiais (v14): Bolão da Convergência (Bisseção × Falsa Posição, ×1,5 para quem acertar), Perturbação da
   Épsilon (b₁ + 0,01 num sistema: quase não muda ou muda tudo?) e Na Mosca (4 decimais certos: carimbo dourado).
   Dois modos: TELÃO (palpites no papel, quem comanda o telão digita na revelação) e PASSA O APARELHO (cada um digita
   escondido, num terminal). Tudo roda neste computador: sem servidor, sem conta, sem internet. Personagens em SVG. */
(function () {
  'use strict';
  const Q = window.BCPerguntas;
  const app = document.getElementById('app'), aviso = document.getElementById('aviso');
  const KEY = 'numera-bobo-da-corte-v1', KEY_ANTIGA = 'numera-quem-divergiu-v1'; // a turma do Quem Divergiu? vem junto
  const MAX = 12, MIN = 2;
  const reduz = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (v, casas) => Q.fmt(v, casas);
  const pct = e => !Number.isFinite(e) ? '—' : e < 1e-4 ? '0%' : e >= 100 ? '> 10.000%' : fmt(e * 100, e < 0.1 ? 2 : 1) + '%';
  const anunciar = t => { aviso.textContent = ''; setTimeout(() => { aviso.textContent = t; }, 30); };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---------- Guardado no navegador (turma, ajustes e estatísticas), sempre conferido ----------
  function carregar() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(KEY_ANTIGA) || 'null');
      if (!d || typeof d !== 'object') return null;
      const nomes = Array.isArray(d.turma) ? d.turma.filter(n => typeof n === 'string').map(n => n.trim().slice(0, 24)).filter(Boolean).slice(0, MAX) : [];
      const c = d.cfg && typeof d.cfg === 'object' ? d.cfg : {};
      const st = d.stats && typeof d.stats === 'object' ? d.stats : {};
      const n = v => Math.max(0, Math.min(1e6, Math.floor(Number(v) || 0)));
      return {
        turma: nomes,
        cfg: {
          modo: c.modo === 'passa' ? 'passa' : 'telao',
          rodadas: [5, 8, 10].includes(c.rodadas) ? c.rodadas : 8,
          tempo: [0, 30, 60, 90].includes(c.tempo) ? c.tempo : 60,
          temas: Array.isArray(c.temas) ? c.temas.filter(t => Q.TEMAS.some(([id]) => id === t)) : null,
          niveis: Array.isArray(c.niveis) ? c.niveis.filter(v => [1, 2, 3].includes(v)) : null,
          relampago: c.relampago !== false, listas: c.listas !== false, som: c.som !== false,
          prendas: ['rodada', 'fim', 'nao'].includes(c.prendas) ? c.prendas : 'rodada', eventos: c.eventos !== false,
        },
        stats: { games: n(st.games), rounds: n(st.rounds), bobos: n(st.bobos) },
      };
    } catch (_) { return null; }
  }
  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 2, turma: S.jogadores.map(j => j.nome), cfg: S.cfg, stats: S.stats })); return true; } catch (_) { return false; }
  }

  // ---------- Estado ----------
  const salvo = carregar();
  const S = {
    fase: 'montar',
    jogadores: [], seq: 0,
    cfg: { modo: 'telao', rodadas: 8, tempo: 60, temas: Q.TEMAS.map(([id]) => id), niveis: [1, 2, 3], relampago: true, listas: true, som: true, prendas: 'rodada', eventos: true },
    stats: { games: 0, rounds: 0, bobos: 0 },
    perguntas: [], r: 0, palpites: {}, votos: {}, vez: 0, segredoAberto: false, dica: false,
    placar: {}, rodadas: [], ap: null, revAnim: false, passos: false, confirmarSair: false, erro: '',
    tempoFim: 0, tempoEsgotado: false,
    // v14: bobos da partida, eventos de cada rodada e o show do bobo
    chapeus: {}, eventos: [], bolao: null, perturb: null, show: null,
  };
  if (salvo) {
    Object.assign(S.cfg, Object.fromEntries(Object.entries(salvo.cfg).filter(([, v]) => v !== null)));
    if (!S.cfg.temas.length) S.cfg.temas = Q.TEMAS.map(([id]) => id);
    if (!S.cfg.niveis.length) S.cfg.niveis = [1, 2, 3];
    S.stats = salvo.stats;
  }
  function addJogador(nome) {
    nome = String(nome || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!nome || S.jogadores.length >= MAX) return false;
    if (S.jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase())) return false;
    S.jogadores.push({ id: 'j' + (++S.seq), nome, look: visual(nome, S.jogadores.length) });
    return true;
  }
  const jog = id => S.jogadores.find(j => j.id === id);
  const pergunta = () => S.perguntas[S.r];
  const resposta = () => Q.resolver(pergunta());

  // ---------- Som (sintetizado, sem arquivos) ----------
  let ac = null;
  function som(tipo) {
    if (!S.cfg.som) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
      const tom = (f, d, tipoOnda = 'sine', v = 0.12, atraso = 0) => { const o = ac.createOscillator(), gg = ac.createGain(); o.type = tipoOnda; o.frequency.value = f; gg.gain.setValueAtTime(v, t + atraso); gg.gain.exponentialRampToValueAtTime(0.0001, t + atraso + d); o.connect(gg); gg.connect(ac.destination); o.start(t + atraso); o.stop(t + atraso + d + 0.02); };
      if (tipo === 'pop') tom(660 + Math.random() * 220, 0.12, 'triangle', 0.1);
      else if (tipo === 'ding') { tom(880, 0.5, 'sine', 0.14); tom(1320, 0.6, 'sine', 0.08, 0.08); }
      else if (tipo === 'carimbo') { tom(110, 0.25, 'square', 0.08); tom(70, 0.3, 'sine', 0.2); }
      else if (tipo === 'tique') tom(1200, 0.05, 'square', 0.04);
      else if (tipo === 'voto') tom(520, 0.08, 'triangle', 0.08);
      else if (tipo === 'fanfarra') [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.35, 'triangle', 0.1, i * 0.14));
      else if (tipo === 'guizo') [1568, 1976, 2349, 1976, 2637, 2093].forEach((f, i) => tom(f, 0.16, 'triangle', 0.05, i * 0.11));
      else if (tipo === 'roleta') for (let i = 0; i < 22; i++) tom(900 + (i % 2) * 140, 0.04, 'square', 0.03, 0.06 * i + 0.004 * i * i);
      else if (tipo === 'cortina') { const n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * 0.8, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length) * 0.5; n.buffer = b; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; n.connect(f); f.connect(g); g.gain.value = 0.25; n.start(t); }
      else if (tipo === 'rufar') { const n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * 1.1, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.35 + 0.65 * Math.abs(Math.sin(i / 900))) * (i / d.length); n.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; n.connect(f); f.connect(g); g.gain.value = 0.18; n.start(t); }
    } catch (_) { /* sem áudio: o jogo segue mudo */ }
  }

  // ---------- Personagens (SVG próprio) ----------
  const PELE = ['#F6D3B3', '#EDB98A', '#D69E6E', '#B07A4F', '#8A5A3B', '#5E3B26'];
  const CABELO = ['#2B1B12', '#5A3520', '#8C5A2B', '#D9A54A', '#1C1C1C', '#B5452E', '#6E6E78'];
  const ROUPA = ['#3B5BDB', '#11805A', '#D2462E', '#8A3FD1', '#F2A705', '#0E8FA8', '#E0578F', '#5D676C', '#2F7D32', '#C2591B', '#4B3FA8', '#1F6FB2'];
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function visual(nome, i) { const h = hash(nome.toLowerCase()); return { pele: PELE[h % PELE.length], cabelo: CABELO[(h >>> 3) % CABELO.length], roupa: ROUPA[i % ROUPA.length], estilo: (h >>> 7) % 6, oculos: ((h >>> 11) % 5) === 0 }; }
  function aluno(j, extra = '') {
    const v = j.look, c = v.cabelo;
    const cab = [
      `<path d="M21 33c0-13 8-21 19-21s19 8 19 21c-4-6-11-9-19-9s-15 3-19 9z" fill="${c}"/>`,
      `<path d="M19 46c-3-20 6-34 21-34s24 14 21 34c-2-9-4-15-6-18-6 3-23 3-30 0-2 3-4 9-6 18z" fill="${c}"/>`,
      `<g fill="${c}"><circle cx="26" cy="22" r="7"/><circle cx="36" cy="16" r="8"/><circle cx="47" cy="17" r="8"/><circle cx="55" cy="25" r="7"/><circle cx="22" cy="31" r="5"/><circle cx="58" cy="33" r="5"/></g>`,
      `<circle cx="40" cy="9" r="7" fill="${c}"/><path d="M21 33c0-13 8-21 19-21s19 8 19 21c-5-7-12-10-19-10s-14 3-19 10z" fill="${c}"/>`,
      `<path d="M21 33c0-13 8-21 19-21s19 8 19 21c-4-6-11-9-19-9s-15 3-19 9z" fill="${c}"/><path d="M58 26c8 4 9 16 3 24-1-8-3-14-6-18z" fill="${c}"/>`,
      `<path d="M21 31l4-14 5 7 4-10 5 8 5-9 4 9 5-6 3 15c-5-5-12-7-19-7s-12 2-20 7z" fill="${c}"/>`,
    ][v.estilo];
    return `<svg class="aluno-svg ${extra}" viewBox="0 0 80 84" aria-hidden="true" focusable="false">
      <path d="M12 84c1-17 13-26 28-26s27 9 28 26z" fill="${j.look.roupa}"/><path d="M33 58l7 8 7-8" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="35" y="49" width="10" height="11" rx="4" fill="${v.pele}"/>
      <circle cx="40" cy="35" r="18" fill="${v.pele}"/>
      ${cab}
      <g class="olhos"><circle cx="33" cy="36" r="2.4" fill="#1B1B1B"/><circle cx="47" cy="36" r="2.4" fill="#1B1B1B"/></g>
      ${v.oculos ? '<g fill="none" stroke="#1B1B1B" stroke-width="1.6"><circle cx="33" cy="36" r="5"/><circle cx="47" cy="36" r="5"/><path d="M38 36h4"/></g>' : ''}
      <circle cx="28" cy="42" r="3" fill="#F28CA8" opacity=".45"/><circle cx="52" cy="42" r="3" fill="#F28CA8" opacity=".45"/>
      <path class="boca" d="M35 44q5 4 10 0" fill="none" stroke="#7A2E1F" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  // Épsilon, a anfitriã da corte (ε é a tolerância): uma estudante jovem, de rabo de cavalo, moletom e fone com
  // microfone. Desenho original; substitui a Profa. Épsilon das versões anteriores.
  function anfitria() {
    return `<svg class="prof-svg" viewBox="0 0 160 230" aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="224" rx="46" ry="6" fill="rgba(0,0,0,.12)"/>
      <path d="M52 222l5-64h46l5 64z" fill="#2F4A7A"/><path d="M80 170v52" stroke="#24395F" stroke-width="2"/>
      <rect x="46" y="214" width="26" height="9" rx="4.5" fill="#F5F2E8"/><rect x="88" y="214" width="26" height="9" rx="4.5" fill="#F5F2E8"/>
      <path d="M36 166c2-36 18-54 44-54s42 18 44 54z" fill="#7B5CD6"/>
      <path d="M58 116q22 18 44 0" fill="none" stroke="#6247B8" stroke-width="5" stroke-linecap="round"/>
      <path d="M71 122v16M89 122v16" stroke="#F5F2E8" stroke-width="2.4" stroke-linecap="round"/><circle cx="71" cy="140" r="2.4" fill="#F5F2E8"/><circle cx="89" cy="140" r="2.4" fill="#F5F2E8"/>
      <rect x="60" y="146" width="40" height="14" rx="7" fill="#6247B8"/>
      <circle cx="103" cy="134" r="8" fill="#F2B705"/><text x="103" y="138" font-size="11" text-anchor="middle" font-weight="700" fill="#5A3B00" font-family="Georgia,serif">ε</text>
      <g class="prof-braco"><path d="M118 134c14 6 22 0 30-20" fill="none" stroke="#7B5CD6" stroke-width="13" stroke-linecap="round"/><circle cx="149" cy="111" r="7" fill="#F1C27D"/><rect x="141" y="80" width="18" height="24" rx="3" fill="#FFFFFF" stroke="#D2C7E8" stroke-width="2" transform="rotate(12 150 92)"/><path d="M146 88h9M146 93h7" stroke="#7B5CD6" stroke-width="2" transform="rotate(12 150 92)"/></g>
      <path d="M42 134c-8 14-8 30-2 40" fill="none" stroke="#7B5CD6" stroke-width="13" stroke-linecap="round"/><circle cx="41" cy="176" r="7" fill="#F1C27D"/>
      <rect x="73" y="94" width="14" height="18" rx="6" fill="#F1C27D"/>
      <g class="rabo"><path d="M100 44c22 2 30 22 24 44-2 8-8 12-12 10 6-12 4-30-12-40z" fill="#3A2116"/><circle cx="101" cy="46" r="5" fill="#F06292"/></g>
      <circle cx="80" cy="72" r="27" fill="#F1C27D"/>
      <path d="M53 70c-2-24 12-36 27-36s29 12 27 34c-4-8-9-12-14-13-8 7-22 9-36 6-2 3-3 6-4 9z" fill="#3A2116"/>
      <path d="M52 64q-4-26 28-30" fill="none" stroke="#5B3420" stroke-width="2" opacity=".6"/>
      <path d="M53 68q-6 0-6 10t7 10" fill="none" stroke="#2B2B48" stroke-width="4" stroke-linecap="round"/><circle cx="51" cy="80" r="6" fill="#2B2B48"/>
      <path d="M53 66q27-40 54 0" fill="none" stroke="#2B2B48" stroke-width="3.5"/>
      <path d="M51 84q4 12 18 12" fill="none" stroke="#2B2B48" stroke-width="2.4" stroke-linecap="round"/><circle cx="70" cy="96" r="2.8" fill="#2B2B48"/>
      <g class="prof-olhos"><ellipse cx="70" cy="74" rx="3.4" ry="4" fill="#1B1B1B"/><ellipse cx="90" cy="74" rx="3.4" ry="4" fill="#1B1B1B"/><circle cx="71.2" cy="72.6" r="1.1" fill="#fff"/><circle cx="91.2" cy="72.6" r="1.1" fill="#fff"/></g>
      <path d="M64 65q6-4 11-1M85 64q6-3 11 1" fill="none" stroke="#3A2116" stroke-width="2" stroke-linecap="round"/>
      <path class="prof-boca" d="M72 85q8 8 16 0z" fill="#7A2E1F" stroke="#7A2E1F" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="62" cy="83" r="4" fill="#F28CA8" opacity=".55"/><circle cx="98" cy="83" r="4" fill="#F28CA8" opacity=".55"/>
      <circle cx="107" cy="80" r="2" fill="#F2B705"/>
    </svg>`;
  }
  // O Bobo da Corte: o jogador da rodada com chapéu de três pontas e guizos, gola de bico, roupa de duas cores e a
  // marotte (o bastão do bobo). As partes têm classes próprias para a dança (CSS).
  function bobo(j, extra = '') {
    const c1 = j.look.roupa, c2 = ROUPA[(ROUPA.indexOf(c1) + 5) % ROUPA.length], pele = j.look.pele, ouro = '#F2B705';
    return `<svg class="bobo-svg ${extra}" viewBox="0 0 200 260" aria-hidden="true" focusable="false">
      <ellipse class="bb-sombra" cx="100" cy="252" rx="52" ry="7" fill="rgba(0,0,0,.2)"/>
      <g class="bb-perna-e"><path d="M88 188l-12 50" stroke="${c2}" stroke-width="17" stroke-linecap="round"/><path d="M78 236q-22 2-28-14q12 6 26 2z" fill="${ouro}"/><circle cx="50" cy="222" r="4" fill="${ouro}"/></g>
      <g class="bb-perna-d"><path d="M112 188l12 50" stroke="${c1}" stroke-width="17" stroke-linecap="round"/><path d="M122 236q22 2 28-14q-12 6-26 2z" fill="${ouro}"/><circle cx="150" cy="222" r="4" fill="${ouro}"/></g>
      <g class="bb-corpo">
        <path d="M66 120h68l10 74H56z" fill="${c1}"/><path d="M100 120h34l10 74h-44z" fill="${c2}"/>
        <path d="M100 136l9 13-9 13-9-13z" fill="${ouro}"/><path d="M100 164l9 13-9 13-9-13z" fill="${ouro}"/>
        <g class="bb-braco-e"><path d="M68 130q-26 8-34 34" fill="none" stroke="${c2}" stroke-width="14" stroke-linecap="round"/><circle cx="33" cy="167" r="8" fill="${pele}"/><path d="M31 168l-9-40" stroke="#8B5A2B" stroke-width="4" stroke-linecap="round"/><circle cx="21" cy="122" r="9" fill="${c1}"/><path d="M14 116l7-12 7 12" fill="${c2}"/><circle cx="21" cy="103" r="3" fill="${ouro}"/></g>
        <g class="bb-braco-d"><path d="M132 130q26 8 34 34" fill="none" stroke="${c1}" stroke-width="14" stroke-linecap="round"/><circle cx="167" cy="167" r="8" fill="${pele}"/></g>
        <path d="M64 120l12 12 12-10 12 10 12-10 12 10 12-12z" fill="${ouro}"/><g fill="${ouro}"><circle cx="76" cy="133" r="3"/><circle cx="100" cy="133" r="3"/><circle cx="124" cy="133" r="3"/></g>
        <rect x="93" y="106" width="14" height="14" rx="5" fill="${pele}"/>
        <g class="bb-cabeca">
          <circle cx="100" cy="90" r="25" fill="${pele}"/>
          <path d="M88 88q5-6 10 0M102 88q5-6 10 0" fill="none" stroke="#1B1B1B" stroke-width="2.6" stroke-linecap="round"/>
          <circle cx="100" cy="95" r="4" fill="#E8554A"/>
          <path d="M87 100q13 15 26 0z" fill="#7A2E1F"/><path d="M91 102q9 5 18 0" fill="none" stroke="#fff" stroke-width="2"/>
          <circle cx="83" cy="98" r="4" fill="#F28CA8" opacity=".55"/><circle cx="117" cy="98" r="4" fill="#F28CA8" opacity=".55"/>
          <g class="bb-chapeu">
            <path d="M76 78q24-14 48 0l2 6q-26-12-52 0z" fill="${ouro}"/>
            <path d="M78 76q-18-30-44-14q16 2 26 16z" fill="${c1}"/><circle class="guizo g1" cx="34" cy="62" r="6.5" fill="${ouro}"/>
            <path d="M88 72q2-44 22-56q-6 26-4 54z" fill="${c2}"/><circle class="guizo g2" cx="110" cy="16" r="6.5" fill="${ouro}"/>
            <path d="M122 76q18-30 44-14q-16 2-26 16z" fill="${c1}"/><circle class="guizo g3" cx="166" cy="62" r="6.5" fill="${ouro}"/>
          </g>
        </g>
      </g>
    </svg>`;
  }

  // ---------- Peças da tela ----------
  const NIVEL = ['', 'Fácil', 'Médio', 'Difícil'];
  const nomeTema = id => (Q.TEMAS.find(([t]) => t === id) || [id, id])[1];
  const btn = (txt, act, cls = 'prim', attrs = '') => `<button type="button" class="b ${cls}" data-a="${act}" ${attrs}>${txt}</button>`;
  function topo() {
    const jogo = !['montar', 'podio'].includes(S.fase);
    const segRel = S.fase === 'bolao' ? 10 : S.fase === 'pergunta' && S.cfg.modo === 'telao' ? S.cfg.tempo : 0;
    const tempo = segRel ? `<div class="relogio" id="relogio" role="timer" aria-label="${S.fase === 'bolao' ? 'Tempo do bolão' : 'Tempo da pergunta'}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="rel-fundo"/><circle cx="18" cy="18" r="15" class="rel-arco" id="rel-arco"/></svg><b id="rel-num">${segRel}</b></div>` : '';
    return `<header class="topo"><a class="marca" href="../../index.html#jogos" aria-label="Numera Academy: voltar aos jogos"><span class="marca-ico" aria-hidden="true">∑</span><span>numera</span></a>
      <h1 class="titulo-jogo"><span class="titulo-ico" aria-hidden="true">🃏</span> Bobo da <span>Corte</span></h1>
      ${jogo ? `<div class="rodada" aria-label="Rodada ${S.r + 1} de ${S.perguntas.length}"><b>${S.r + 1}</b><span>/${S.perguntas.length}</span></div>` : '<div></div>'}
      <div class="topo-acoes">${tempo}
        <button type="button" class="ico" data-a="som" aria-pressed="${S.cfg.som}" aria-label="${S.cfg.som ? 'Som ligado' : 'Som desligado'}" title="Som">${S.cfg.som ? '🔊' : '🔈'}</button>
        <button type="button" class="ico" data-a="tela" aria-label="Tela cheia" title="Tela cheia (telão)">⛶</button>
        ${jogo ? `<button type="button" class="ico sair" data-a="sair" aria-label="${S.confirmarSair ? 'Confirmar: encerrar a partida' : 'Encerrar a partida'}" title="Encerrar">${S.confirmarSair ? 'Encerrar?' : '✕'}</button>` : ''}
      </div></header>`;
  }
  const FALAS = {
    montar: ['Oi, turma! Eu sou a Épsilon. Hoje a corte vai escolher um Bobo… Coloquem os nomes aí embaixo!'],
    bolao: ['Bolão relâmpago! Quem chega antes na raiz: a Bisseção ou a Falsa Posição?', 'Façam suas apostas! Acertou, a rodada vale ×1,5.'],
    perturbacao: ['Agora eu vou mexer só um pouquinho no b…', 'Sistema bem-comportado ou cheio de drama? Vamos ver.'],
    pergunta: ['Leiam em voz alta! Depois, cada um faz o seu palpite em segredo.', 'Valendo! Palpite no papel, sem colar do vizinho.', 'Dá pra estimar antes de calcular. Confiem no método!'],
    passa: ['Passa o aparelho! Quem não é a vez, olha pro outro lado.'],
    voto: ['Agora, sem dó: quem divergiu?', 'Quem vocês acham que chutou mais longe?', 'Votem com o coração… e com o erro relativo.'],
    anotar: ['Mostrem os papéis! Eu anoto os palpites.'],
  };
  function falaAtual() {
    const ap = S.ap;
    switch (S.fase) {
      case 'montar': return FALAS.montar[0];
      case 'bolao': return S.bolao && S.bolao.fechado ? 'Bolão fechado! Agora a pergunta da rodada.' : FALAS.bolao[S.r % 2];
      case 'perturbacao': { const pt = S.perturb; if (!pt || !pt.palpite) return FALAS.perturbacao[S.r % 2]; return pt.r.mudaTudo === (pt.palpite === 'muda') ? `Acertaram! ${pt.r.mudaTudo ? 'Um centésimo no b virou um terremoto no x: sistema mal condicionado.' : 'O x quase não se mexeu: sistema bem condicionado.'}` : `Pegadinha! ${pt.r.mudaTudo ? 'Mudou tudo: κ(A) grande amplia qualquer erro do b.' : 'Quase não mudou: κ(A) pequeno segura o erro.'}`; }
      case 'pergunta': return S.cfg.modo === 'passa' ? `Passa o aparelho pra ${esc(jog(S.jogadores[S.vez]?.id)?.nome || '')}. Ninguém espia!` : (S.tempoEsgotado ? 'Tempo! Canetas para cima.' : S.falaPergunta);
      case 'voto': { const v = S.jogadores[S.vez]; return v ? `${esc(v.nome)}, em quem você vota?` : 'Votos registrados!'; }
      case 'votos': { const mv = maisVotadosParcial(); return !mv.length ? 'Ninguém votou! Então vamos direto à resposta.' : mv.length === 1 ? `A turma acha que quem divergiu foi… <b>${esc(jog(mv[0]).nome)}</b>!` : `Empate! ${mv.map(id => `<b>${esc(jog(id).nome)}</b>`).join(' e ')} estão na mira.`; }
      case 'anotar': return FALAS.anotar[0];
      case 'revelar': return S.revAnim ? 'Vamos ver… a resposta é…' : falaResultado(ap);
      case 'placar': return S.r + 1 < S.perguntas.length ? 'Placar parcial! Próxima pergunta?' : 'Última rodada feita. Hora do pódio!';
      case 'podio': { const t = ranking(), b = boboDaPartida(); return t.length ? `Fim de aula! Parabéns, <b>${esc(t[0].nome)}</b>: raiz da turma!${b ? ` E o Bobo da Corte da partida é… <b>${esc(b.nome)}</b> 🃏` : ''}` : 'Fim de aula!'; }
      default: return '';
    }
  }
  function falaResultado(ap) {
    if (!ap) return '';
    const n = id => `<b>${esc(jog(id).nome)}</b>`;
    const mosca = ap.mosca && ap.mosca.length ? ` ✨ ${ap.mosca.map(n).join(' e ')} ${ap.mosca.length > 1 ? 'acertaram' : 'acertou'} na mosca!` : '';
    const r = (ap.raizes.length ? `${ap.raizes.map(n).join(' e ')} convergi${ap.raizes.length > 1 ? 'ram' : 'u'}!` : 'Ninguém ficou nem na faixa de 50%… a turma divergiu!') + mosca;
    if (!ap.divergiram.length) return `A resposta é ${fmt(ap.resposta, pergunta().casas)}. ${r}`;
    if (!ap.maisVotados.length) return `${ap.divergiram.map(n).join(' e ')} divergi${ap.divergiram.length > 1 ? 'ram' : 'u'}. ${r}`;
    return ap.acertouTurma ? `A turma acertou: ${ap.divergiram.map(n).join(' e ')} divergi${ap.divergiram.length > 1 ? 'ram' : 'u'} mesmo! ${r}` : `Injustiça! ${ap.maisVotados.map(n).join(' e ')} levou os votos, mas quem divergiu foi ${ap.divergiram.map(n).join(' e ')}. ${r}`;
  }
  function prof(fala) {
    return `<aside class="prof" aria-label="Épsilon, a anfitriã"><div class="balao" id="balao"><span class="balao-nome">Épsilon · anfitriã</span><p id="fala">${fala}</p></div>${anfitria()}</aside>`;
  }
  function chips() {
    const p = pergunta(); if (!p) return '';
    return `<div class="quadro-chips"><span class="giz-chip">${esc(nomeTema(p.metodo))}</span><span class="giz-chip">${NIVEL[p.nivel]} ${'★'.repeat(p.nivel)}<span class="apagado">${'★'.repeat(3 - p.nivel)}</span></span>${p.relampago ? '<span class="giz-chip amarelo">⚡ relâmpago</span>' : ''}${p.lista ? `<span class="giz-chip">📄 ${esc(p.dica.replace(/\.$/, ''))}</span>` : ''}</div>`;
  }

  // ---------- Quadro (o que muda a cada fase) ----------
  function quadro() {
    const p = pergunta();
    switch (S.fase) {
      case 'montar': return quadroMontar();
      case 'bolao': return quadroBolao();
      case 'perturbacao': return quadroPerturbacao();
      case 'pergunta': return `${chips()}<p class="giz-pergunta" id="pergunta-t">${esc(p.texto)}</p>${S.dica ? `<p class="giz-dica">💡 ${esc(p.dica)}</p>` : ''}<p class="giz-rodape">${S.cfg.modo === 'telao' ? 'Escreva o seu palpite no caderno, em segredo. Um número só.' : 'Cada um digita o palpite na sua vez, sem ninguém ver.'}</p>`;
      case 'voto': return `${chips()}<p class="giz-pergunta pequena">${esc(p.texto)}</p><p class="giz-grande">Quem tem mais chance de ter <span class="sublinha">divergido</span>?</p><p class="giz-rodape">Cada jogador vota em alguém (menos em si mesmo). O mais votado vira o 🃏 Bobo da Corte da rodada. ${S.cfg.modo === 'telao' ? 'Diga em voz alta; quem comanda o telão toca no nome.' : 'Toque no nome escolhido.'}</p>`;
      case 'votos': return quadroVotos();
      case 'anotar': return `${chips()}<p class="giz-pergunta pequena">${esc(p.texto)}</p><p class="giz-grande">Mostrem os palpites!</p><p class="giz-rodape">Digite o número de cada um nas carteiras. Vale vírgula ou ponto, fração (5/3) e 1e-6.</p>`;
      case 'revelar': return quadroReta();
      case 'placar': return quadroPlacar();
      case 'podio': return quadroPodio();
    }
    return '';
  }
  function quadroMontar() {
    return `<p class="giz-grande">Quem vai ser o <span class="sublinha">Bobo da Corte</span>?</p>
      <ol class="giz-passos"><li><b>Pergunta</b> da matéria, com resposta numérica.</li><li><b>Palpite</b> em segredo: caderno ou aparelho.</li><li><b>Voto</b>: quem divergiu, quem chutou mais longe?</li><li><b>Revelação</b> na reta, com as faixas de tolerância.</li><li><b>🃏 Bobo da Corte</b>: o mais votado veste o chapéu, dança e paga a prenda.</li></ol>
      <p class="giz-rodape">Faixas: ≤ 1% vale 100 · ≤ 5% vale 60 · ≤ 20% vale 30 · ≤ 50% vale 10. Voto certeiro +${Q.BONUS.detetive}; mais perto da resposta +${Q.BONUS.raiz}; votado sem ter divergido +${Q.BONUS.injusticado}; 4 decimais certos (na mosca) +${Q.BONUS.mosca}.</p>`;
  }
  // v14: Bolão da Convergência — antes da pergunta, cada um aposta qual método chega antes na raiz.
  function quadroBolao() {
    const b = S.bolao, apostas = Object.values(b.apostas), nb = apostas.filter(v => v === 'bis').length, nf = apostas.filter(v => v === 'fp').length;
    return `<div class="quadro-chips"><span class="giz-chip amarelo">🎰 Bolão da Convergência</span><span class="giz-chip">tolerância 10⁻⁶</span></div>
      <p class="giz-pergunta" id="pergunta-t">${esc(b.item.texto)}: quem precisa de <span class="sublinha">menos iterações</span>?</p>
      <div class="bolao-opcoes"><div class="bolao-op"><b>Bisseção</b><span>corta o intervalo ao meio</span><em>${nb} ${nb === 1 ? 'aposta' : 'apostas'}</em></div><div class="bolao-op"><b>Falsa Posição</b><span>usa a reta entre as pontas</span><em>${nf} ${nf === 1 ? 'aposta' : 'apostas'}</em></div></div>
      <p class="giz-rodape">Toque em B ou FP na carteira de cada um. Quem acertar ganha ×${String(Q.BOLAO_MULT).replace('.', ',')} nos pontos desta rodada. O resultado sai na revelação.</p>`;
  }
  // v14: Perturbação da Épsilon — b₁ + 0,01 num sistema; a turma decide se a solução quase não muda ou muda tudo.
  function quadroPerturbacao() {
    const pt = S.perturb, r = pt.r, v = x => '(' + x.map(t => fmt(t, 4)).join('; ') + ')';
    return `<div class="quadro-chips"><span class="giz-chip amarelo">🌪️ Perturbação da Épsilon</span><span class="giz-chip">Eliminação de Gauss</span></div>
      <p class="giz-pergunta pequena">Sistema: ${esc(pt.item.texto)}. Solução: x = ${v(r.x)}.</p>
      <p class="giz-pergunta" id="pergunta-t">Vou somar <b>0,01</b> só no b₁. A solução quase não muda ou <span class="sublinha">muda tudo</span>?</p>
      ${pt.palpite ? `<div class="perturb-res"><p>Com b₁ + 0,01: x = <b>${v(r.x2)}</b></p><p>O b mudou ${fmt(r.variacaoB * 100, 2)}%; o x mudou <b>${fmt(r.variacao * 100, 2)}%</b>. Número de condição κ(A) ≈ ${fmt(r.kappa, 1)}.</p><p class="giz-rodape">${r.mudaTudo ? 'κ grande: o sistema é mal condicionado e amplia qualquer erro do b (até o arredondamento).' : 'κ pequeno: o sistema é bem condicionado; o erro do x fica do tamanho do erro do b.'}</p></div>` : '<p class="giz-rodape">A turma decide no grito (ou levantando a mão) e quem comanda o telão toca na resposta.</p>'}`;
  }
  const contarVotos = () => { const c = {}; for (const a of Object.values(S.votos)) c[a] = (c[a] || 0) + 1; return c; };
  function maisVotadosParcial() { const c = contarVotos(), m = Math.max(0, ...Object.values(c)); return m ? Object.keys(c).filter(id => c[id] === m) : []; }
  function quadroVotos() {
    const c = contarVotos(), lista = S.jogadores.filter(j => c[j.id]).sort((a, b) => c[b.id] - c[a.id]), m = Math.max(1, ...Object.values(c));
    return `${chips()}<p class="giz-grande">A turma aposta em…</p><ul class="giz-votos">${lista.map((j, i) => `<li class="${c[j.id] === m ? 'topo-voto' : ''}" style="--i:${i}"><span>${esc(j.nome)}</span><span class="maos" aria-label="${c[j.id]} ${c[j.id] === 1 ? 'voto' : 'votos'}">${'✋'.repeat(Math.min(c[j.id], 12))}</span><b>${c[j.id]}</b></li>`).join('') || '<li><span>Ninguém votou</span></li>'}</ul>`;
  }
  function niceStep(span) { const raw = span / 5, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
  function quadroReta() {
    const ap = S.ap, x0 = ap.resposta, p = pergunta(), casas = p.casas;
    const com = ap.linhas.filter(l => l.palpite !== null);
    const devs = com.map(l => Math.abs(l.palpite - x0)).sort((a, b) => a - b);
    const base = Math.abs(x0) * 0.25, med = devs.length ? devs[Math.floor((devs.length - 1) / 2)] : 0;
    let R = Math.max(base, ...devs.filter(d => d <= Math.max(med * 6, base * 4)));
    R *= 1.15;
    // No celular a reta usa um quadro mais estreito: o texto fica proporcionalmente maior.
    const VW = window.innerWidth < 640 ? 560 : 1000;
    const lo = x0 - R, hi = x0 + R, L = VW < 1000 ? 40 : 70, Rx = VW - L, Y = 226;
    const X = v => L + (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * (Rx - L);
    const step = niceStep((hi - lo) * (VW < 1000 ? 1.6 : 1)), t0 = Math.ceil(lo / step) * step, ticks = [];
    for (let v = t0, k = 0; v <= hi + 1e-12 * Math.abs(hi) && k < 12; v += step, k++) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    const tcasas = Math.max(0, Math.min(8, -Math.floor(Math.log10(step) + 1e-9)));
    const ordem = com.slice().sort((a, b) => (ap.maisVotados.includes(a.id) ? 1 : 0) - (ap.maisVotados.includes(b.id) ? 1 : 0) || b.erro - a.erro);
    const d = i => (S.revAnim ? (0.35 + i * 0.55) : 0).toFixed(2) + 's', tResp = S.revAnim ? 0.35 + ordem.length * 0.55 + 0.5 : 0;
    const faixas = [[0.2, 'f20'], [0.05, 'f5'], [0.01, 'f1']].map(([e, cls]) => { const a = X(x0 - Math.abs(x0) * e), b = X(x0 + Math.abs(x0) * e); return `<g class="faixa ${cls}" style="--d:${(tResp + 0.4).toFixed(2)}s"><rect x="${a.toFixed(1)}" y="54" width="${Math.max(2, b - a).toFixed(1)}" height="${Y - 54}" rx="6"/></g>`; }).join('');
    // Rótulos sem encavalar: cada palpite sobe para a primeira "altura" em que a etiqueta cabe inteira.
    const curto = n => n.length > 11 ? n.slice(0, 10) + '…' : n, info = {};
    for (const l of com) {
      const j = jog(l.id), esq = l.palpite < lo, dir = l.palpite > hi, x = X(l.palpite);
      const lab = `${esq ? '◀ ' : ''}${esc(curto(j.nome))}: ${fmt(l.palpite, Math.max(casas, 2))}${dir ? ' ▶' : ''}`, w = Math.max(90, lab.length * 8.4 + 22);
      info[l.id] = { j, x, w, lab, cx: Math.min(VW - w / 2 - 4, Math.max(w / 2 + 4, x)) };
    }
    const fim = [];
    for (const it of Object.values(info).sort((a, b) => a.cx - b.cx)) { let n = 0; while (fim[n] !== undefined && it.cx - it.w / 2 < fim[n] + 6) n++; fim[n] = it.cx + it.w / 2; it.nivel = Math.min(n, 3); }
    const pins = ordem.map((l, i) => {
      const { j, x, w, lab, cx, nivel } = info[l.id], h = Y - 46 - nivel * 30;
      return `<g class="pin ${ap.divergiram.includes(l.id) ? 'divergiu' : ''} ${ap.raizes.includes(l.id) ? 'raiz' : ''}" style="--d:${d(i)};--c:${j.look.roupa}">
        <line x1="${x.toFixed(1)}" y1="${Y}" x2="${x.toFixed(1)}" y2="${h + 6}"/><circle cx="${x.toFixed(1)}" cy="${Y}" r="7"/>
        <rect x="${(cx - w / 2).toFixed(1)}" y="${h - 18}" width="${w.toFixed(1)}" height="26" rx="13"/><text x="${cx.toFixed(1)}" y="${h}" text-anchor="middle">${lab}</text></g>`;
    }).join('');
    const xa = X(x0);
    const resp = `<g class="resp" style="--d:${tResp.toFixed(2)}s"><line x1="${xa.toFixed(1)}" y1="40" x2="${xa.toFixed(1)}" y2="${Y + 14}"/><path d="M${xa.toFixed(1)} ${Y - 2}l-11 -18h22z"/><rect x="${(xa - 92).toFixed(1)}" y="10" width="184" height="34" rx="17"/><text x="${xa.toFixed(1)}" y="33" text-anchor="middle">x* = ${fmt(x0, casas)}</text></g>`;
    const eixo = `<g class="eixo"><line x1="${L - 20}" y1="${Y}" x2="${Rx + 20}" y2="${Y}"/>${ticks.map(v => `<line x1="${X(v).toFixed(1)}" y1="${Y - 6}" x2="${X(v).toFixed(1)}" y2="${Y + 6}"/><text x="${X(v).toFixed(1)}" y="${Y + 26}" text-anchor="middle">${fmt(v, tcasas)}</text>`).join('')}</g>`;
    const desc = `Reta numérica: a resposta é ${fmt(x0, casas)}. ${com.map(l => `${jog(l.id).nome} chutou ${fmt(l.palpite, Math.max(casas, 2))}, erro de ${pct(l.erro)}`).join('; ')}.`;
    return `${chips()}<p class="giz-pergunta pequena">${esc(p.texto)}</p>
      <svg class="reta ${S.revAnim ? 'anima' : ''}" viewBox="0 0 ${VW} 266" role="img" aria-label="${esc(desc)}">${faixas}${eixo}${resp}${pins}</svg>
      <p class="legenda" style="--d:${(tResp + 0.4).toFixed(2)}s"><span class="lg f1"></span>até 1% de erro: 100 pts <span class="lg f5"></span>até 5%: 60 <span class="lg f20"></span>até 20%: 30 <span class="lg f50"></span>até 50%: 10</p>
      ${S.bolao ? `<p class="giz-bolao" style="--d:${(tResp + 0.6).toFixed(2)}s">🎰 Bolão (${esc(S.bolao.item.texto)}): Bisseção ${S.bolao.res.bis} iterações × Falsa Posição ${S.bolao.res.fp}. ${S.bolao.res.vencedor === 'empate' ? 'Empate!' : `Venceu a ${S.bolao.res.vencedor === 'bis' ? 'Bisseção' : 'Falsa Posição'}: quem apostou nela ganhou ×${String(Q.BOLAO_MULT).replace('.', ',')}.`}</p>` : ''}
      ${S.passos ? `<div class="giz-passos-res"><b>Como se calcula</b><ol>${resposta().passos.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>` : ''}`;
  }
  function ranking() { return S.jogadores.map(j => ({ ...j, pts: S.placar[j.id] || 0 })).sort((a, b) => b.pts - a.pts || a.nome.localeCompare(b.nome)); }
  function quadroPlacar() {
    const r = ranking(), m = Math.max(1, ...r.map(j => j.pts)), ult = S.rodadas[S.rodadas.length - 1];
    const ganho = id => ult ? (ult.linhas.find(l => l.id === id) || {}).pontos || 0 : 0;
    return `<p class="giz-grande">Placar <span class="giz-menor">depois da rodada ${S.r + 1}</span></p><ol class="giz-placar">${r.map((j, i) => `<li style="--i:${i};--c:${j.look.roupa}"><span class="pos">${i + 1}º</span><span class="pl-nome">${esc(j.nome)}${S.chapeus[j.id] ? ` <span class="chapeus" aria-label="${S.chapeus[j.id]} ${S.chapeus[j.id] === 1 ? 'vez' : 'vezes'} Bobo da Corte">${'🃏'.repeat(Math.min(S.chapeus[j.id], 5))}</span>` : ''}</span><span class="barra"><i style="width:${(j.pts / m * 100).toFixed(1)}%"></i></span><b>${j.pts}</b>${ganho(j.id) ? `<em>+${ganho(j.id)}</em>` : '<em class="zero">+0</em>'}</li>`).join('')}</ol>`;
  }
  function titulos() {
    const conta = f => { const c = {}; for (const ap of S.rodadas) for (const id of f(ap)) c[id] = (c[id] || 0) + 1; return c; };
    const top = (c, minimo = 1) => { const m = Math.max(0, ...Object.values(c)); return m >= minimo ? Object.keys(c).filter(id => c[id] === m).map(id => [id, m]) : []; };
    const olho = conta(ap => ap.linhas.filter(l => l.faixa && l.faixa.pontos === 100).map(l => l.id));
    const det = conta(ap => ap.linhas.filter(l => l.bonus.some(b => b[0] === 'detetive')).map(l => l.id));
    const div = conta(ap => ap.divergiram);
    const vot = {}; for (const ap of S.rodadas) for (const l of ap.linhas) vot[l.id] = (vot[l.id] || 0) + l.votos;
    const mosca = conta(ap => ap.mosca || []);
    return [['🎯', 'Olho de Newton', 'mais palpites dentro de 1%', top(olho)], ['✨', 'Na mosca', '4 decimais certos', top(mosca)], ['🔎', 'Detetive do erro', 'mais votos certeiros', top(det)], ['🌪️', 'Mais divergente', 'mais vezes o mais longe da resposta', top(div)], ['🗳️', 'Alvo da turma', 'mais votos recebidos', top(vot)]]
      .filter(t => t[3].length);
  }
  function quadroPodio() {
    const r = ranking().slice(0, 3), lug = [1, 0, 2].filter(i => r[i]);
    const bp = boboDaPartida();
    return `<p class="giz-grande">Pódio</p>${bp ? `<p class="giz-bobo-final">🃏 Bobo da Corte da partida: <b>${esc(bp.nome)}</b> (${bp.n} ${bp.n === 1 ? 'chapéu' : 'chapéus'})</p>` : ''}<div class="podio">${lug.map(i => `<div class="degrau d${i + 1}" style="--c:${r[i].look.roupa}">${aluno(r[i], 'mini')}<b>${esc(r[i].nome)}</b><span>${r[i].pts} pts</span><div class="bloco">${['🥇', '🥈', '🥉'][i]}<i>${i + 1}º</i></div></div>`).join('')}</div>
      <ul class="giz-titulos">${titulos().map(([ico, nome, desc, quem]) => `<li><span aria-hidden="true">${ico}</span><b>${nome}</b><em>${quem.map(([id]) => esc(jog(id).nome)).join(', ')}</em><small>${desc}</small></li>`).join('')}</ul>`;
  }

  // ---------- Carteiras (a turma) ----------
  function carteiras() {
    if (!S.jogadores.length) return `<p class="vazio">A turma está vazia. Adicione pelo menos ${MIN} nomes.</p>`;
    const ap = S.ap, c = contarVotos();
    return `<ul class="turma" aria-label="Turma">${S.jogadores.map((j, i) => {
      const l = ap ? ap.linhas.find(x => x.id === j.id) : null;
      let corpo = '', cls = '', tag = 'div', attrs = '';
      if (S.fase === 'montar') corpo = `<button type="button" class="tirar" data-a="tirar" data-id="${j.id}" aria-label="Tirar ${esc(j.nome)} da turma">✕</button>`;
      if (S.fase === 'bolao') { const ap2 = S.bolao.apostas[j.id]; corpo = `<span class="apostas" role="group" aria-label="Aposta de ${esc(j.nome)}"><button type="button" class="aposta" data-a="apostar" data-id="${j.id}" data-v="bis" aria-pressed="${ap2 === 'bis'}">B</button><button type="button" class="aposta" data-a="apostar" data-id="${j.id}" data-v="fp" aria-pressed="${ap2 === 'fp'}">FP</button></span>`; }
      if (S.fase === 'pergunta') {
        if (S.cfg.modo === 'passa') { const fez = j.id in S.palpites; cls = fez ? 'feito' : i === S.vez ? 'vez' : ''; corpo = `<span class="selo">${fez ? (S.palpites[j.id] === null ? 'pulou' : '✓ palpitou') : i === S.vez ? 'é a vez' : 'esperando'}</span>`; }
        else corpo = '<span class="selo escrevendo">✍️ escrevendo</span>';
      }
      if (S.fase === 'voto') {
        const vez = S.jogadores[S.vez], votou = j.id in S.votos;
        cls = (vez && vez.id === j.id ? 'vez ' : '') + (votou ? 'feito' : '');
        if (vez && vez.id !== j.id) { tag = 'button'; attrs = `type="button" data-a="votar" data-id="${j.id}" aria-label="${esc(vez.nome)} vota em ${esc(j.nome)}"`; cls += ' alvo'; }
        corpo = `<span class="selo">${vez && vez.id === j.id ? 'votando…' : votou ? '✓ votou' : ''}</span>`;
      }
      if (S.fase === 'votos') { const n = c[j.id] || 0; cls = n && maisVotadosParcial().includes(j.id) ? 'mira' : ''; corpo = `<span class="selo votos-n" style="--i:${i}">${n ? '✋'.repeat(Math.min(n, 6)) + ' ' + n : '—'}</span>`; }
      if (S.fase === 'anotar') { const v = S.rascunho[j.id] ?? ''; const lido = Q.lerNumero(v); corpo = `<label class="sr-only" for="pal-${j.id}">Palpite de ${esc(j.nome)}</label><input class="palpite" id="pal-${j.id}" data-id="${j.id}" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="palpite" value="${esc(v)}"><span class="lido" id="lido-${j.id}">${v === '' ? 'sem palpite' : lido === null ? 'não entendi' : '= ' + fmt(lido)}</span>`; }
      if ((S.fase === 'revelar' || S.fase === 'placar') && l) {
        const div = ap.divergiram.includes(j.id), raiz = ap.raizes.includes(j.id), inj = l.bonus.some(b => b[0] === 'injusticado');
        cls = div ? 'divergiu' : raiz ? 'raiz' : '';
        const atraso = S.revAnim ? (0.35 + ap.linhas.filter(x => x.palpite !== null).length * 0.55 + 1.2).toFixed(2) : 0;
        corpo = `<span class="palp">${l.palpite === null ? 'sem palpite' : fmt(l.palpite, Math.max(pergunta().casas, 2))}</span>
          <span class="faixa-tag ${l.faixa ? 'p' + l.faixa.pontos : 'p0'}">${l.faixa ? `${l.faixa.nome} · ${pct(l.erro)}` : '—'}</span>
          <span class="pts" style="--d:${atraso}s">+${l.pontos}${l.bonus.length ? `<small>${l.bonus.map(([b]) => ({ detetive: '🔎', injusticado: '😤', raiz: '👑', mosca: '✨', bolao: '🎰' })[b]).join('')}</small>` : ''}</span>
          ${(ap.mosca || []).includes(j.id) ? `<span class="carimbo dourado" style="--d:${atraso}s">NA MOSCA!</span>` : div ? `<span class="carimbo" style="--d:${atraso}s">DIVERGIU!</span>` : raiz ? `<span class="carimbo verde" style="--d:${atraso}s">CONVERGIU!</span>` : inj ? `<span class="carimbo amarelo" style="--d:${atraso}s">INJUSTIÇA!</span>` : ''}`;
      }
      if (S.fase === 'podio') corpo = `<span class="selo">${S.placar[j.id] || 0} pts</span>`;
      const ch = S.chapeus[j.id] && S.fase !== 'montar' ? `<span class="chapeu-tag" title="${S.chapeus[j.id]} ${S.chapeus[j.id] === 1 ? 'vez' : 'vezes'} Bobo da Corte">🃏${S.chapeus[j.id] > 1 ? '×' + S.chapeus[j.id] : ''}</span>` : '';
      return `<li class="carteira ${cls}" style="--c:${j.look.roupa}"><${tag} class="aluno" ${attrs}>${aluno(j)}<span class="nome">${esc(j.nome)}</span>${ch}</${tag}>${corpo}<span class="mesa" aria-hidden="true"></span></li>`;
    }).join('')}</ul>`;
  }

  // ---------- Barra de ações ----------
  function acoes() {
    const p = pergunta();
    switch (S.fase) {
      case 'bolao': return btn('Fechar o bolão → pergunta', 'fechar-bolao');
      case 'perturbacao': return S.perturb.palpite ? btn(depoisDaRevelacao(), 'pos-revelar') : `${btn('😌 Quase não muda', 'perturb', 'sec', 'data-v="quase"')}${btn('💥 Muda tudo', 'perturb', 'sec', 'data-v="muda"')}`;
      case 'pergunta':
        if (S.cfg.modo === 'passa') return `${btn(S.dica ? 'Esconder dica' : '💡 Dica da Épsilon', 'dica', 'sec')}${btn(`Começar: vez de ${esc(S.jogadores[S.vez]?.nome || '')}`, 'abrir-segredo')}`;
        return `${btn(S.dica ? 'Esconder dica' : '💡 Dica da Épsilon', 'dica', 'sec')}${btn('Todo mundo escreveu → votar', 'ir-voto')}`;
      case 'voto': return `${btn('Desfazer voto', 'desfazer', 'sec', Object.keys(S.votos).length ? '' : 'disabled')}${btn(`${esc(S.jogadores[S.vez]?.nome || '')} não vota`, 'pular-voto', 'sec', S.vez < S.jogadores.length ? '' : 'disabled')}${btn('Revelar votos', 'revelar-votos', 'prim', S.vez >= S.jogadores.length ? '' : 'disabled')}`;
      case 'votos': return S.cfg.modo === 'telao' ? btn('Anotar os palpites →', 'ir-anotar') : btn('Revelar a resposta 🥁', 'revelar');
      case 'anotar': return btn('Revelar a resposta 🥁', 'revelar');
      case 'revelar': return `${btn(S.passos ? 'Esconder o cálculo' : '📐 Como se calcula', 'passos', 'sec', S.revAnim ? 'disabled' : '')}${btn(S.eventos[S.r]?.perturb ? '🌪️ Perturbação da Épsilon →' : depoisDaRevelacao(), S.eventos[S.r]?.perturb ? 'ir-perturbacao' : 'pos-revelar', 'prim', S.revAnim ? 'disabled' : '')}`;
      case 'placar': return S.r + 1 < S.perguntas.length ? btn(`Próxima pergunta (${S.r + 2}/${S.perguntas.length}) →`, 'proxima') : btn('Ver o pódio 🏆', 'podio');
      case 'podio': return `<a class="b sec" href="../../index.html#jogos">← Voltar ao Numera</a>${boboDaPartida() && S.cfg.prendas !== 'nao' ? btn('🎡 Prenda do Bobo da partida', 'prenda-final', 'sec') : ''}${btn('Nova turma', 'nova-turma', 'sec')}${btn('Jogar de novo', 'de-novo')}`;
    }
    return '';
  }

  // ---------- Montar a turma ----------
  function montar() {
    const temas = Q.TEMAS, n = Q.TODAS.filter(q => S.cfg.temas.includes(q.metodo) && S.cfg.niveis.includes(q.nivel) && (S.cfg.relampago || !q.relampago) && (S.cfg.listas !== false || !q.lista)).length;
    const pronto = S.jogadores.length >= MIN && n > 0;
    const chip = (grupo, val, rot, on) => `<button type="button" class="chip" data-a="${grupo}" data-v="${val}" aria-pressed="${on}">${rot}</button>`;
    return `<section class="montar" aria-labelledby="montar-t">
      <div class="cartao"><h2 id="montar-t">1. A turma</h2>
        <form class="add" data-form="add"><label for="novo-nome">Nome do jogador ou do time</label><div class="add-linha"><input id="novo-nome" maxlength="24" autocomplete="off" placeholder="Ex.: Ana, ou Fileira 1" ${S.jogadores.length >= MAX ? 'disabled' : ''}><button type="submit" class="b prim" ${S.jogadores.length >= MAX ? 'disabled' : ''}>Adicionar</button></div></form>
        ${S.erro ? `<p class="erro" role="alert">${esc(S.erro)}</p>` : ''}
        <p class="dica-peq">${S.jogadores.length}/${MAX} jogadores. Turma grande? Jogue em times: um nome por fileira ou por grupo.</p>
        <div class="atalhos">${btn('Turma de exemplo', 'exemplo', 'sec')}${btn('4 times por fileira', 'times', 'sec')}${S.jogadores.length ? btn('Limpar', 'limpar', 'sec') : ''}</div>
      </div>
      <div class="cartao"><h2>2. Como a turma joga</h2>
        <div class="modos" role="radiogroup" aria-label="Modo de jogo">
          <button type="button" class="modo" role="radio" aria-checked="${S.cfg.modo === 'telao'}" data-a="modo" data-v="telao"><b>📽️ Telão</b><span>Palpites no caderno. Na revelação, quem comanda o telão digita os números.</span></button>
          <button type="button" class="modo" role="radio" aria-checked="${S.cfg.modo === 'passa'}" data-a="modo" data-v="passa"><b>📱 Passa o aparelho</b><span>Cada um digita o palpite escondido, na sua vez.</span></button>
        </div>
        <fieldset><legend>Rodadas</legend><div class="chips">${[5, 8, 10].map(v => chip('rodadas', v, v, S.cfg.rodadas === v)).join('')}</div></fieldset>
        ${S.cfg.modo === 'telao' ? `<fieldset><legend>Tempo para pensar</legend><div class="chips">${[[0, 'Sem relógio'], [30, '30 s'], [60, '1 min'], [90, '1 min 30']].map(([v, r]) => chip('tempo', v, r, S.cfg.tempo === v)).join('')}</div></fieldset>` : ''}
        <fieldset><legend>Prenda do Bobo da Corte</legend><div class="chips">${[['rodada', '🎡 Toda rodada'], ['fim', 'Só no fim'], ['nao', 'Sem prenda']].map(([v, r]) => chip('prendas', v, r, S.cfg.prendas === v)).join('')}</div></fieldset>
        <label class="troca"><input type="checkbox" data-a="eventos" ${S.cfg.eventos ? 'checked' : ''}> Eventos especiais: 🎰 Bolão da Convergência e 🌪️ Perturbação da Épsilon</label>
      </div>
      <div class="cartao"><h2>3. A matéria</h2>
        <fieldset><legend>Temas que a turma já viu</legend><div class="chips">${temas.map(([id, rot]) => chip('tema', id, rot, S.cfg.temas.includes(id))).join('')}</div></fieldset>
        <fieldset><legend>Dificuldade</legend><div class="chips">${[1, 2, 3].map(v => chip('nivel', v, `${NIVEL[v]} ${'★'.repeat(v)}`, S.cfg.niveis.includes(v))).join('')}</div></fieldset>
        <label class="troca"><input type="checkbox" data-a="relampago" ${S.cfg.relampago ? 'checked' : ''}> Incluir desafios relâmpago (contas rápidas da antiga Arena)</label>
        <label class="troca"><input type="checkbox" data-a="listas" ${S.cfg.listas !== false ? 'checked' : ''}> Incluir as questões numéricas das listas da disciplina (banco de questões)</label>
        <p class="dica-peq">${n} ${n === 1 ? 'pergunta disponível' : 'perguntas disponíveis'} com essa escolha.${n && n < S.cfg.rodadas ? ` A partida terá ${n} ${n === 1 ? 'rodada' : 'rodadas'}.` : ''}</p>
        ${btn('Abrir a corte ▶', 'comecar', 'prim grande', pronto ? '' : 'disabled')}
        ${!pronto ? `<p class="dica-peq">${S.jogadores.length < MIN ? `Faltam ${MIN - S.jogadores.length} ${MIN - S.jogadores.length === 1 ? 'nome' : 'nomes'} na turma.` : 'Escolha pelo menos um tema e uma dificuldade.'}</p>` : ''}
      </div></section>`;
  }

  // ---------- Tela secreta (passa o aparelho) ----------
  function segredo() {
    const j = S.jogadores[S.vez]; if (!j) return '';
    const p = pergunta(), v = S.rascunho[j.id] ?? '', lido = Q.lerNumero(v);
    return `<div class="segredo" role="dialog" aria-modal="true" aria-labelledby="seg-t"><div class="seg-caixa">
      ${S.segredoAberto ? `<h2 id="seg-t">${esc(j.nome)}, seu palpite</h2><div class="seg-perg-card"><span>Rodada ${S.r + 1} · ${esc(nomeTema(p.metodo))}</span><p class="seg-perg">${esc(p.texto)}</p></div>
        <form data-form="segredo" class="seg-term"><div class="seg-term-topo">Terminal do palpite</div><div class="seg-term-linha"><label for="seg-in">palpite&gt;</label><input id="seg-in" class="palpite grande" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="um número" value="${esc(v)}"></div>
        <p class="lido" id="seg-lido">${v === '' ? 'Vale vírgula ou ponto, 5/3 e 1e-6.' : lido === null ? 'Não entendi esse número.' : 'Vou ler como ' + fmt(lido)}</p>
        <div class="seg-botoes"><button type="button" class="b sec" data-a="seg-pular">Pular (sem palpite)</button><button type="submit" class="b prim">Enviar palpite</button></div></form>`
      : `${aluno(j, 'grande')}<h2 id="seg-t">Vez de ${esc(j.nome)}</h2><p>Passe o aparelho. Os outros olham para o lado!</p><button type="button" class="b prim grande" data-a="seg-abrir">Sou ${esc(j.nome)}: mostrar o campo</button>`}
      </div></div>`;
  }

  // ---------- v14: o show do Bobo da Corte (cortina, holofote, dança e roleta de prendas) ----------
  const ICONE_PRENDA = ['📣', '🚶', '🎵', '💃', '🤖', '✏️', '📺', '🔢', '👑', '📰', '🦶', '🌀'];
  const embaralha = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [b[i], b[k]] = [b[k], b[i]]; } return b; };
  function boboDaPartida() {
    const ids = Object.keys(S.chapeus).filter(id => S.chapeus[id] > 0 && jog(id)); if (!ids.length) return null;
    const m = Math.max(...ids.map(id => S.chapeus[id]));
    const id = ids.filter(x => S.chapeus[x] === m).sort((a, b) => (S.placar[a] || 0) - (S.placar[b] || 0) || jog(a).nome.localeCompare(jog(b).nome))[0];
    return { id, nome: jog(id).nome, n: m };
  }
  function depoisDaRevelacao() { return S.ap && S.ap.bobo ? '🃏 Quem é o Bobo da Corte?' : 'Ver o placar →'; }
  let showTimer = null;
  function abrirShow(b, final = false) {
    clearTimeout(showTimer);
    S.show = { ...b, final, etapa: reduz() ? 'danca' : 'cortina', roda: embaralha(Q.PRENDAS.map((_, i) => i)).slice(0, 8), giros: 0, angulo: 0, prenda: null };
    render(); som('rufar'); setTimeout(() => som('rufar'), 1100);
    anunciar(final ? 'E o Bobo da Corte da partida é…' : 'E o Bobo da Corte da rodada é…');
    if (S.show.etapa === 'cortina') { setTimeout(() => som('cortina'), 2300); showTimer = setTimeout(revelarBobo, 3100); } else revelarBobo();
  }
  function revelarBobo() {
    if (!S.show) return;
    S.show.etapa = 'danca'; render(); som('fanfarra'); setTimeout(() => som('guizo'), 600);
    anunciar(`${jog(S.show.id).nome} é o Bobo da Corte${S.show.final ? ' da partida' : ''}!`);
  }
  function girarRoleta() {
    const sh = S.show; if (!sh) return;
    const n = sh.roda.length, alvo = Math.floor(Math.random() * n), centro = (alvo + 0.5) * 360 / n;
    const novo = sh.angulo - (((sh.angulo % 360) + 360) % 360) + 360 * 5 + (360 - centro);
    sh.giros++; sh.prenda = sh.roda[alvo]; sh.etapa = 'roleta'; sh.anguloAntes = sh.angulo; render();
    const g = app.querySelector('.roleta-giro');
    if (reduz() || !g) { sh.angulo = novo; mostrarPrenda(); return; }
    som('roleta');
    requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = `rotate(${novo}deg)`; }));
    sh.angulo = novo; clearTimeout(showTimer); showTimer = setTimeout(mostrarPrenda, 3900);
  }
  function mostrarPrenda() { if (!S.show) return; S.show.etapa = 'prenda'; render(); som('ding'); anunciar('Prenda: ' + Q.PRENDAS[S.show.prenda]); }
  function fecharShow() { clearTimeout(showTimer); const final = S.show && S.show.final; S.show = null; if (final) render(); else irPara('placar'); }
  function roleta() {
    const sh = S.show, n = sh.roda.length, R = 120, CORES = ['#F2B705', '#E0578F', '#0E8FA8', '#8A3FD1', '#11805A', '#D2462E', '#3B5BDB', '#C2591B'];
    const pt = (a, r) => `${(r * Math.cos((a - 90) * Math.PI / 180)).toFixed(2)} ${(r * Math.sin((a - 90) * Math.PI / 180)).toFixed(2)}`;
    const fatias = sh.roda.map((pi, i) => { const a0 = i * 360 / n, a1 = (i + 1) * 360 / n, am = (a0 + a1) / 2; return `<path d="M0 0L${pt(a0, R)}A${R} ${R} 0 0 1 ${pt(a1, R)}Z" fill="${CORES[i % CORES.length]}" stroke="#fff" stroke-width="3"/><text x="${pt(am, 80).split(' ')[0]}" y="${pt(am, 80).split(' ')[1]}" font-size="28" text-anchor="middle" dominant-baseline="central">${ICONE_PRENDA[pi]}</text>`; }).join('');
    return `<div class="roleta"><div class="roleta-seta" aria-hidden="true"></div><svg class="roleta-svg" viewBox="-130 -130 260 260" role="img" aria-label="Roleta de prendas"><g class="roleta-giro" style="transform:rotate(${sh.etapa === 'roleta' ? sh.anguloAntes : sh.angulo}deg)">${fatias}</g><circle r="18" fill="#fff" stroke="#14202A" stroke-width="4"/><text y="1" font-size="18" text-anchor="middle" dominant-baseline="central">🃏</text></svg></div>`;
  }
  function acoesBobo() {
    const sh = S.show, prenda = sh.final || S.cfg.prendas === 'rodada', continuar = sh.final ? 'Fechar' : 'Ver o placar →';
    if (sh.etapa === 'cortina') return btn('Pular a revelação', 'bobo-pular', 'sec');
    if (sh.etapa === 'danca') return `${prenda ? btn('🎡 Sortear a prenda', 'bobo-roleta') : ''}${btn(continuar, 'bobo-fechar', prenda ? 'sec' : 'prim')}`;
    if (sh.etapa === 'roleta') return btn('Girando…', 'bobo-nada', 'sec', 'disabled');
    return `${sh.giros < 2 ? btn('↻ Girar de novo (a turma deixa?)', 'bobo-roleta', 'sec') : ''}${btn(continuar, 'bobo-fechar')}`;
  }
  function palcoBobo() {
    const sh = S.show, j = jog(sh.id); if (!j) return '';
    const n = S.jogadores.length, idx = S.jogadores.findIndex(x => x.id === sh.id), nm = x => `<b>${esc(x)}</b>`;
    const votantes = (sh.votantes || []).map(id => jog(id)).filter(Boolean).map(x => x.nome);
    const motivo = sh.final ? `Vestiu o chapéu ${S.chapeus[j.id] || 1} ${(S.chapeus[j.id] || 1) === 1 ? 'vez' : 'vezes'} nesta partida.`
      : !sh.porVoto ? 'Ninguém votou, então o chapéu foi para quem mais divergiu.'
      : sh.injusticado ? `Foi o mais votado… mas não divergiu! Injustiça: ${nm(j.nome)} escolhe ${votantes.length > 1 ? `um entre ${votantes.map(nm).join(', ')}` : votantes.length ? nm(votantes[0]) : 'alguém'} para pagar a prenda junto.`
      : 'Foi o mais votado e divergiu mesmo: a corte acertou!';
    const corpo = sh.etapa === 'cortina'
      ? `<p class="bobo-chamada" id="bobo-t">${sh.final ? 'E o Bobo da Corte da partida é…' : 'E o Bobo da Corte da rodada é…'}</p><div class="bobo-fila-wrap"><ul class="bobo-fila" style="--n:${n};--x:${((idx + 0.5) / n * 100).toFixed(2)}%" aria-hidden="true">${S.jogadores.map(x => `<li>${aluno(x, 'mini')}<span>${esc(x.nome)}</span></li>`).join('')}</ul><span class="holofote" style="--x:${((idx + 0.5) / n * 100).toFixed(2)}%" aria-hidden="true"></span></div>`
      : `<div class="bobo-revela">${sh.etapa === 'roleta' || sh.etapa === 'prenda' ? roleta() : bobo(j, 'bobo-danca')}<div class="bobo-texto"><p class="bobo-coroa" aria-hidden="true">🃏</p><h2 id="bobo-t">${nm(j.nome)} é o Bobo da Corte${sh.final ? ' da partida' : ''}!</h2><p>${motivo}</p>${sh.etapa === 'prenda' ? `<p class="prenda-txt"><span>Prenda ${ICONE_PRENDA[sh.prenda]}</span>${esc(Q.PRENDAS[sh.prenda])}</p>` : sh.etapa === 'danca' ? '<p class="bobo-legenda">♪ Dança, Bobo! ♪</p>' : ''}</div></div>`;
    return `<div class="bobo-palco etapa-${sh.etapa}" role="dialog" aria-modal="true" aria-labelledby="bobo-t" tabindex="-1">
      <div class="bobo-luzes" aria-hidden="true"></div>${corpo}
      <div class="cortina esq" aria-hidden="true"></div><div class="cortina dir" aria-hidden="true"></div>
      ${sh.etapa === 'danca' ? `<div class="bobo-confete" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>` : ''}
      <div class="bobo-acoes">${acoesBobo()}</div></div>`;
  }

  // ---------- Desenho da tela ----------
  function render() {
    const focoId = document.activeElement && document.activeElement.id, focoAct = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.a + '|' + (document.activeElement.dataset.id || document.activeElement.dataset.v || '') : '';
    app.className = 'app fase-' + S.fase + (reduz() ? ' sem-anim' : '') + (S.revAnim ? ' anima' : '');
    app.innerHTML = `${topo()}<main id="palco" tabindex="-1" class="palco">
      <div class="cena"><div class="quadro-moldura"><div class="quadro" aria-live="off">${quadro()}</div><div class="giz-bandeja" aria-hidden="true"><i></i><i></i><i></i></div></div>${prof(falaAtual())}</div>
      ${S.fase === 'montar' ? montar() : ''}
      <section class="sala" aria-label="Sala de aula">${carteiras()}</section>
      <div class="acoes">${acoes()}</div></main>
      ${S.fase === 'pergunta' && S.cfg.modo === 'passa' && S.segredoVisivel ? segredo() : ''}${S.show ? palcoBobo() : ''}`;
    if (focoId && document.getElementById(focoId)) document.getElementById(focoId).focus();
    else if (focoAct) { const el = [...app.querySelectorAll('[data-a]')].find(e => e.dataset.a + '|' + (e.dataset.id || e.dataset.v || '') === focoAct && !e.disabled); if (el) el.focus(); }
    if (S.fase === 'pergunta' && S.cfg.modo === 'passa' && S.segredoVisivel) { const f = document.getElementById('seg-in') || app.querySelector('[data-a="seg-abrir"]'); if (f) f.focus(); }
    if (S.show && !app.querySelector('.bobo-palco').contains(document.activeElement)) { const f = app.querySelector('.bobo-acoes .b') || app.querySelector('.bobo-palco'); if (f) f.focus(); }
  }
  function irPara(fase, foco = true) {
    S.fase = fase; S.confirmarSair = false; render();
    if (foco) { const t = app.querySelector('.giz-grande, .giz-pergunta, #montar-t'); const palco = document.getElementById('palco'); if (palco) palco.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: reduz() ? 'auto' : 'smooth' });
  }

  // ---------- Fluxo da partida ----------
  function comecar() {
    S.perguntas = Q.sortear({ temas: S.cfg.temas, niveis: S.cfg.niveis, rodadas: S.cfg.rodadas, relampago: S.cfg.relampago, listas: S.cfg.listas !== false, semente: Date.now() });
    if (!S.perguntas.length) return;
    S.r = 0; S.placar = Object.fromEntries(S.jogadores.map(j => [j.id, 0])); S.rodadas = []; S.chapeus = {}; S.show = null;
    // v14: eventos especiais. Bolão a cada 3 rodadas (2ª, 5ª, 8ª); Perturbação depois das perguntas de sistemas lineares.
    const bolaos = embaralha(Q.BOLAO), perturbs = embaralha(Q.PERTURBACOES);
    S.eventos = S.perguntas.map((p, i) => (S.cfg.eventos ? { bolao: i % 3 === 1 ? bolaos[Math.floor(i / 3) % bolaos.length] : null, perturb: ['gauss', 'seidel'].includes(p.metodo) ? perturbs[i % perturbs.length] : null } : {}));
    salvar(); novaRodada();
  }
  function novaRodada() {
    S.palpites = {}; S.votos = {}; S.vez = 0; S.dica = false; S._ultimoTique = null; S.ap = null; S.passos = false; S.rascunho = {}; S.segredoAberto = false; S.segredoVisivel = false; S.tempoEsgotado = false;
    S.falaPergunta = pick(FALAS.pergunta); S.perturb = null; S.show = null;
    const ev = S.eventos[S.r] || {};
    S.bolao = ev.bolao ? { item: ev.bolao, apostas: {}, res: Q.bolaoContar(ev.bolao), fechado: false } : null;
    if (S.bolao) { irPara('bolao'); anunciar(`Rodada ${S.r + 1}: Bolão da Convergência. ${S.bolao.item.texto}. Quem precisa de menos iterações: Bisseção ou Falsa Posição?`); som('ding'); iniciarRelogio(10, 'bolao'); return; }
    irPergunta();
  }
  function irPergunta() {
    irPara('pergunta'); anunciar(`Rodada ${S.r + 1} de ${S.perguntas.length}. ${pergunta().texto}`);
    iniciarRelogio();
  }
  let relogio = null;
  function iniciarRelogio(segundos, fase = 'pergunta') {
    clearInterval(relogio);
    if (fase === 'pergunta' && (S.cfg.modo !== 'telao' || !S.cfg.tempo)) return;
    const seg0 = segundos || S.cfg.tempo;
    S.tempoFim = Date.now() + seg0 * 1000;
    const total = seg0 * 1000;
    const tick = () => {
      const resta = Math.max(0, S.tempoFim - Date.now()), n = document.getElementById('rel-num'), arco = document.getElementById('rel-arco');
      if (S.fase !== fase) { clearInterval(relogio); return; }
      if (n) n.textContent = Math.ceil(resta / 1000);
      if (arco) arco.style.strokeDashoffset = String(94.25 * (1 - resta / total));
      const seg = Math.ceil(resta / 1000);
      if (seg <= 5 && seg > 0 && seg !== S._ultimoTique) { S._ultimoTique = seg; som('tique'); }
      if (resta <= 0) { clearInterval(relogio); S.tempoEsgotado = true; const f = document.getElementById('fala'); if (f) f.innerHTML = fase === 'bolao' ? 'Tempo! Apostas encerradas.' : 'Tempo! Canetas para cima.'; document.getElementById('relogio')?.classList.add('fim'); anunciar('Tempo esgotado.'); som('carimbo'); }
    };
    tick(); relogio = setInterval(tick, 250);
  }
  function irVoto() { clearInterval(relogio); S.vez = 0; S.votos = {}; irPara('voto'); anunciar(`Votação. ${S.jogadores[0].nome} vota primeiro.`); }
  function votar(alvo) {
    const v = S.jogadores[S.vez]; if (!v || alvo === v.id || !jog(alvo)) return;
    S.votos[v.id] = alvo; S.vez++; som('voto');
    render(); anunciar(S.vez < S.jogadores.length ? `Voto registrado. Agora vota ${S.jogadores[S.vez].nome}.` : 'Todos votaram. Revelem os votos.');
    if (S.vez >= S.jogadores.length) app.querySelector('[data-a="revelar-votos"]')?.focus();
  }
  function revelarVotos() { som('rufar'); irPara('votos'); const mv = maisVotadosParcial(); anunciar(mv.length ? `A turma aposta em ${mv.map(id => jog(id).nome).join(' e ')}.` : 'Ninguém votou.'); setTimeout(() => som('ding'), 900); }
  function revelar() {
    if (S.cfg.modo === 'telao') { S.palpites = {}; for (const j of S.jogadores) { const v = Q.lerNumero(S.rascunho[j.id]); if (v !== null) S.palpites[j.id] = v; } }
    const r = resposta();
    S.ap = Q.apurar({ jogadores: S.jogadores, palpites: S.palpites, votos: S.votos, resposta: r.resposta });
    // v14: quem acertou o bolão multiplica os pontos da rodada
    if (S.bolao && S.bolao.res.vencedor !== 'empate') for (const l of S.ap.linhas) if (S.bolao.apostas[l.id] === S.bolao.res.vencedor && l.pontos > 0) { const extra = Math.round(l.pontos * (Q.BOLAO_MULT - 1)); l.pontos += extra; l.bonus.push(['bolao', extra]); }
    for (const l of S.ap.linhas) S.placar[l.id] = (S.placar[l.id] || 0) + l.pontos;
    if (S.ap.bobo) { S.chapeus[S.ap.bobo.id] = (S.chapeus[S.ap.bobo.id] || 0) + 1; S.stats.bobos = (S.stats.bobos || 0) + 1; }
    S.rodadas.push(S.ap); S.stats.rounds++; salvar();
    S.revAnim = !reduz();
    irPara('revelar');
    const n = S.ap.linhas.filter(l => l.palpite !== null).length, total = S.revAnim ? (0.35 + n * 0.55 + 1.9) * 1000 : 0;
    if (S.revAnim) { for (let i = 0; i < n; i++) setTimeout(() => som('pop'), (0.35 + i * 0.55) * 1000); setTimeout(() => som('rufar'), (0.35 + n * 0.55 - 0.6) * 1000); setTimeout(() => som('ding'), (0.35 + n * 0.55 + 0.5) * 1000); setTimeout(() => som('carimbo'), (0.35 + n * 0.55 + 1.2) * 1000); }
    setTimeout(() => {
      S.revAnim = false;
      const f = document.getElementById('fala'); if (f) f.innerHTML = falaResultado(S.ap);
      app.querySelectorAll('.acoes [disabled]').forEach(b => { b.disabled = false; });
      app.querySelector('.acoes [data-a="pos-revelar"], .acoes [data-a="ir-perturbacao"]')?.focus();
      anunciar(`A resposta é ${fmt(S.ap.resposta, pergunta().casas)}. ` + falaResultado(S.ap).replace(/<[^>]+>/g, ''));
    }, total);
  }
  function encerrar() { clearInterval(relogio); clearTimeout(showTimer); S.show = null; if (S.rodadas.length) { S.stats.games++; salvar(); irPara('podio'); som('fanfarra'); anunciar('Fim de jogo. ' + falaAtual().replace(/<[^>]+>/g, '')); } else irPara('montar'); }

  // ---------- Eventos ----------
  app.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const a = el.dataset.a, id = el.dataset.id, v = el.dataset.v;
    if (a !== 'sair') S.confirmarSair = false;
    switch (a) {
      case 'som': S.cfg.som = !S.cfg.som; salvar(); render(); if (S.cfg.som) som('ding'); return;
      case 'tela': try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (_) { /* sem tela cheia */ } return;
      case 'sair': if (S.confirmarSair) { S.confirmarSair = false; encerrar(); } else { S.confirmarSair = true; render(); app.querySelector('[data-a="sair"]')?.focus(); } return;
      case 'tirar': S.jogadores = S.jogadores.filter(j => j.id !== id); salvar(); render(); return;
      case 'exemplo': S.jogadores = []; ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe'].forEach(addJogador); S.erro = ''; salvar(); render(); return;
      case 'times': S.jogadores = []; ['Fileira 1', 'Fileira 2', 'Fileira 3', 'Fileira 4'].forEach(addJogador); S.erro = ''; salvar(); render(); return;
      case 'limpar': S.jogadores = []; salvar(); render(); return;
      case 'modo': S.cfg.modo = v === 'passa' ? 'passa' : 'telao'; salvar(); render(); return;
      case 'rodadas': S.cfg.rodadas = Number(v); salvar(); render(); return;
      case 'tempo': S.cfg.tempo = Number(v); salvar(); render(); return;
      case 'tema': { const t = S.cfg.temas; S.cfg.temas = t.includes(v) ? t.filter(x => x !== v) : t.concat(v); salvar(); render(); return; }
      case 'nivel': { const n = Number(v), t = S.cfg.niveis; S.cfg.niveis = t.includes(n) ? t.filter(x => x !== n) : t.concat(n).sort(); salvar(); render(); return; }
      case 'comecar': comecar(); return;
      case 'dica': S.dica = !S.dica; render(); return;
      case 'ir-voto': irVoto(); return;
      case 'abrir-segredo': S.segredoVisivel = true; S.segredoAberto = false; render(); return;
      case 'seg-abrir': S.segredoAberto = true; render(); return;
      case 'seg-pular': delete S.palpites[S.jogadores[S.vez].id]; S.palpites[S.jogadores[S.vez].id] = null; proximoSegredo(); return;
      case 'votar': votar(id); return;
      case 'desfazer': { if (!S.vez) return; S.vez--; delete S.votos[S.jogadores[S.vez].id]; render(); return; }
      case 'pular-voto': if (S.vez < S.jogadores.length) { S.vez++; render(); } return;
      case 'revelar-votos': revelarVotos(); return;
      case 'ir-anotar': irPara('anotar'); app.querySelector('.palpite')?.focus(); return;
      case 'revelar': revelar(); return;
      case 'passos': S.passos = !S.passos; render(); return;
      case 'placar': irPara('placar'); return;
      case 'pos-revelar': if (S.ap && S.ap.bobo) abrirShow(S.ap.bobo); else irPara('placar'); return;
      case 'ir-perturbacao': { const it = (S.eventos[S.r] || {}).perturb; S.perturb = { item: it, r: Q.perturbar(it), palpite: null }; irPara('perturbacao'); som('rufar'); anunciar('Perturbação da Épsilon. ' + it.texto + '. Somando 0,01 no b um: a solução quase não muda ou muda tudo?'); return; }
      case 'perturb': { S.perturb.palpite = v === 'muda' ? 'muda' : 'quase'; const acertou = S.perturb.r.mudaTudo === (S.perturb.palpite === 'muda'); som(acertou ? 'ding' : 'carimbo'); render(); anunciar(falaAtual().replace(/<[^>]+>/g, '')); app.querySelector('[data-a="pos-revelar"]')?.focus(); return; }
      case 'apostar': { const b = S.bolao; if (!b || !jog(id)) return; if (b.apostas[id] === v) delete b.apostas[id]; else b.apostas[id] = v; som('voto'); render(); return; }
      case 'fechar-bolao': clearInterval(relogio); S.bolao.fechado = true; irPergunta(); return;
      case 'bobo-pular': clearTimeout(showTimer); revelarBobo(); return;
      case 'bobo-roleta': girarRoleta(); return;
      case 'bobo-fechar': fecharShow(); return;
      case 'prenda-final': { const bp = boboDaPartida(); if (bp) abrirShow({ id: bp.id, votantes: [], porVoto: false, injusticado: false }, true); return; }
      case 'prendas': S.cfg.prendas = ['rodada', 'fim', 'nao'].includes(v) ? v : 'rodada'; salvar(); render(); return;
      case 'proxima': S.r++; novaRodada(); return;
      case 'podio': encerrar(); return;
      case 'de-novo': comecar(); return;
      case 'nova-turma': S.jogadores = []; salvar(); irPara('montar'); return;
    }
  });
  function proximoSegredo() {
    S.segredoAberto = false; S.vez++;
    if (S.vez >= S.jogadores.length) { S.segredoVisivel = false; S.palpites = Object.fromEntries(Object.entries(S.palpites).filter(([, v]) => Number.isFinite(v))); irVoto(); return; }
    render(); anunciar(`Agora é a vez de ${S.jogadores[S.vez].nome}.`);
  }
  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target.dataset.form;
    if (f === 'add') { const inp = document.getElementById('novo-nome'), nome = inp.value; if (!nome.trim()) return; S.erro = addJogador(nome) ? '' : (S.jogadores.length >= MAX ? `A turma já tem ${MAX} jogadores.` : 'Esse nome já está na turma.'); salvar(); render(); document.getElementById('novo-nome')?.focus(); }
    if (f === 'segredo') { const j = S.jogadores[S.vez], v = Q.lerNumero(document.getElementById('seg-in').value); if (v === null) { const l = document.getElementById('seg-lido'); if (l) l.textContent = 'Não entendi esse número. Use, por exemplo, 1,5 ou 5/3.'; return; } S.palpites[j.id] = v; S.rascunho[j.id] = ''; som('pop'); proximoSegredo(); }
  });
  app.addEventListener('input', e => {
    const t = e.target;
    if (t.classList.contains('palpite') && t.dataset.id) { S.rascunho[t.dataset.id] = t.value; const l = document.getElementById('lido-' + t.dataset.id), v = Q.lerNumero(t.value); if (l) l.textContent = t.value === '' ? 'sem palpite' : v === null ? 'não entendi' : '= ' + fmt(v); }
    if (t.id === 'seg-in') { const l = document.getElementById('seg-lido'), v = Q.lerNumero(t.value); if (l) l.textContent = t.value === '' ? 'Vale vírgula ou ponto, 5/3 e 1e-6.' : v === null ? 'Não entendi esse número.' : 'Vou ler como ' + fmt(v); }
  });
  app.addEventListener('change', e => { if (e.target.dataset.a === 'relampago') { S.cfg.relampago = e.target.checked; salvar(); render(); } if (e.target.dataset.a === 'listas') { S.cfg.listas = e.target.checked; salvar(); render(); } if (e.target.dataset.a === 'eventos') { S.cfg.eventos = e.target.checked; salvar(); render(); } });
  app.addEventListener('keydown', e => {
    // Enter num palpite da carteira pula para o próximo; no último, revela.
    if (e.key === 'Enter' && e.target.classList.contains('palpite') && e.target.dataset.id) { e.preventDefault(); const ins = [...app.querySelectorAll('.palpite[data-id]')], i = ins.indexOf(e.target); if (i < ins.length - 1) ins[i + 1].focus(); else app.querySelector('[data-a="revelar"]')?.focus(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.confirmarSair) { S.confirmarSair = false; render(); } if (e.key === 'Escape' && S.show && S.show.etapa !== 'roleta') fecharShow(); });
  S.rascunho = {};

  // Ganchos para os testes automáticos (sem efeito no jogo).
  if (salvo) salvo.turma.forEach(n => addJogador(n)); // a turma da última aula volta pronta
  window.__bc = { S, render, addJogador, comecar, votar, revelar, irVoto, encerrar, abrirShow, girarRoleta, boboDaPartida };
  render();
})();
