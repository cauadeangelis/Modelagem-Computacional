/* Numera Academy v11 — Raiz e Pivô, o casal de mascotes.
   Raiz é um rabanete (a "raiz" das equações, e também a do canteiro). Pivô é um bloquinho de matriz de luvas de boxe:
   o pivô da Eliminação de Gauss, que também gira quando dança. Os dois ficam no canto da tela durante os desafios.
   - dançam enquanto você pensa;
   - comemoram o acerto e sofrem (de leve) com o erro;
   - a cada 3 acertos seguidos, o Pivô soca a caixa Σ e caem moedas;
   - fase e mundo concluídos viram festa com confete.
   É só enfeite: o palco tem aria-hidden, e tudo o que importa (acerto, moedas) também aparece em texto na página.
   Com "reduzir movimento" ligado no sistema, os dois ficam parados e só trocam de expressão. */
(function (global) {
  'use strict';
  const doc = global.document;
  const reduce = () => { try { return global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };

  // Camarim: três itens para cada um. Preço em moedas.
  const ITEMS = [
    { id: 'laco', name: 'Laço de fita', who: 'raiz', price: 15 },
    { id: 'gravata', name: 'Gravata-borboleta', who: 'pivo', price: 15 },
    { id: 'coracao', name: 'Óculos de coração', who: 'raiz', price: 25 },
    { id: 'oculos', name: 'Óculos escuros', who: 'pivo', price: 25 },
    { id: 'formatura', name: 'Chapéu de formatura', who: 'pivo', price: 40 },
    { id: 'coroa', name: 'Coroa', who: 'raiz', price: 60 }
  ];

  const PHRASES = {
    ok: ['Convergiu!', 'Essa raiz é nossa!', 'Resíduo zero, coração cheio.', 'Pivotei de alegria!', 'Errou nada!', 'Tá vendo, Pivô? Eu sabia!', 'Nem precisou de dica!'],
    bad: ['Divergiu… bora de novo.', 'Calma, até o Newton erra o chute.', 'Resíduo alto, autoestima intacta.', 'Ainda não convergiu, mas a gente acredita!', 'Respira e confere o sinal.'],
    combo: ['TRIPLO! Toma, caixa!', 'Três seguidas! Chuva de moedas!', 'Pivô, solta o soco!', 'Combo! Ninguém segura esse casal.'],
    level: ['Fase concluída! Próximo nível!', 'Subimos de nível, amor!', 'Essa fase já era. Bora!'],
    world: ['Mundo concluído! Próximo mundo liberado!', 'Zeramos o mundo! Partiu o próximo!']
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // ---------- desenho (SVG) ----------
  // Cada personagem: <g transform> (posição fixa) > <g class="…-body"> (animado pelo CSS, origem nos pés).
  function outfitRaiz(on) {
    return (on.includes('coroa') ? '<g class="mz-item"><path d="M-17 -94 l5 -15 l7 9 l5 -13 l5 13 l7 -9 l5 15z" fill="#F7C531" stroke="#C99400" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-99" r="2.6" fill="#E8457A"/></g>' : '') +
      (on.includes('laco') ? '<g class="mz-item" transform="translate(-27 -78) rotate(-18)"><path d="M0 0 l-12 -8 v16z M0 0 l12 -8 v16z" fill="#FF6FA5" stroke="#D23C76" stroke-width="1.6" stroke-linejoin="round"/><circle r="3.6" fill="#D23C76"/></g>' : '') +
      (on.includes('coracao') ? '<g class="mz-item"><path d="M-13 -64 c-6 -7 -15 -1 -10 6 l10 9 l10 -9 c5 -7 -4 -13 -10 -6z" transform="translate(0 2)" fill="#FF3D7F" opacity=".92"/><path d="M13 -64 c-6 -7 -15 -1 -10 6 l10 9 l10 -9 c5 -7 -4 -13 -10 -6z" transform="translate(0 2)" fill="#FF3D7F" opacity=".92"/><path d="M-3 -60 h6" stroke="#B71C50" stroke-width="2"/></g>' : '');
  }
  function outfitPivo(on) {
    return (on.includes('formatura') ? '<g class="mz-item"><path d="M-26 -90 l26 -11 l26 11 l-26 11z" fill="#20262D"/><rect x="-14" y="-86" width="28" height="8" rx="2" fill="#20262D"/><path d="M22 -89 v14" stroke="#F7C531" stroke-width="2"/><circle cx="22" cy="-74" r="3" fill="#F7C531"/></g>' : '') +
      (on.includes('oculos') ? '<g class="mz-item"><rect x="-22" y="-64" width="17" height="11" rx="4" fill="#15191E"/><rect x="5" y="-64" width="17" height="11" rx="4" fill="#15191E"/><path d="M-5 -60 h10" stroke="#15191E" stroke-width="2.5"/><path d="M-19 -61 l5 -1" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>' : '') +
      (on.includes('gravata') ? '<g class="mz-item" transform="translate(0 -24)"><path d="M0 0 l-11 -7 v14z M0 0 l11 -7 v14z" fill="#E8457A" stroke="#B7285A" stroke-width="1.5" stroke-linejoin="round"/><circle r="3.2" fill="#B7285A"/></g>' : '');
  }
  let uidN = 0;
  function svg(outfit, uid) {
    const on = outfit || [], u = uid || ('m' + (++uidN));
    return `<svg class="mz-svg" viewBox="0 0 260 205" focusable="false" aria-hidden="true">
<defs>
 <radialGradient id="mzRaizSkin-${u}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FF8FB1"/><stop offset=".55" stop-color="#EF4C86"/><stop offset="1" stop-color="#C4245F"/></radialGradient>
 <linearGradient id="mzPivoSkin-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C93FF"/><stop offset="1" stop-color="#3B5BDB"/></linearGradient>
 <linearGradient id="mzBox-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD25E"/><stop offset="1" stop-color="#F29A12"/></linearGradient>
</defs>
<ellipse class="mz-shadow" cx="78" cy="196" rx="34" ry="5"/><ellipse class="mz-shadow" cx="186" cy="196" rx="34" ry="5"/>
<g transform="translate(130 46)"><g class="mz-box">
 <rect x="-19" y="-19" width="38" height="38" rx="8" fill="url(#mzBox-${u})" stroke="#C97A00" stroke-width="2.5"/>
 <circle cx="-12" cy="-12" r="1.8" fill="#C97A00"/><circle cx="12" cy="-12" r="1.8" fill="#C97A00"/><circle cx="-12" cy="12" r="1.8" fill="#C97A00"/><circle cx="12" cy="12" r="1.8" fill="#C97A00"/>
 <text x="0" y="7.5" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="Figtree, sans-serif">Σ</text>
 <g class="mz-bonk"><path d="M-30 -6 l-10 -4 M30 -6 l10 -4 M0 -26 v-10 M-22 -22 l-7 -7 M22 -22 l7 -7" stroke="#F7C531" stroke-width="3" stroke-linecap="round"/></g>
</g></g>
<g class="mz-heart-wrap" transform="translate(132 130)"><path class="mz-heart" d="M0 6 C-12 -3 -9 -14 0 -8 C9 -14 12 -3 0 6Z" fill="#FF5C93"/></g>
<g transform="translate(78 194)"><g class="mz-raiz-body">
 <path class="mz-tail" d="M-3 -6 C-2 2 3 6 1 12" stroke="#C4245F" stroke-width="3" fill="none" stroke-linecap="round"/>
 <g class="mz-legs"><path d="M-11 -14 v12 M11 -14 v12" stroke="#7A1F45" stroke-width="4" stroke-linecap="round"/><ellipse cx="-13" cy="-1" rx="7" ry="3.6" fill="#7A1F45"/><ellipse cx="13" cy="-1" rx="7" ry="3.6" fill="#7A1F45"/></g>
 <g transform="translate(0 -88)"><g class="mz-leaves"><path d="M0 0 C-14 -8 -24 -24 -16 -34 C-6 -26 -2 -12 0 0Z" fill="#35B873"/><path d="M0 0 C-3 -16 2 -34 11 -41 C15 -28 8 -12 0 0Z" fill="#27A162"/><path d="M0 0 C10 -8 24 -18 32 -15 C27 -5 14 1 0 0Z" fill="#46C985"/></g></g>
 <path d="M0 -90 C31 -90 45 -68 43 -47 C41 -24 23 -11 0 -9 C-23 -11 -41 -24 -43 -47 C-45 -68 -31 -90 0 -90Z" fill="url(#mzRaizSkin-${u})"/>
 <path d="M-26 -76 C-20 -84 -10 -87 -2 -87" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35" fill="none"/>
 <g class="mz-arm-l"><path d="M-40 -46 C-50 -44 -55 -38 -57 -30" stroke="#C4245F" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="-57" cy="-29" r="5" fill="#EF4C86"/></g>
 <g class="mz-arm-r"><path d="M40 -46 C50 -44 55 -38 57 -30" stroke="#C4245F" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="57" cy="-29" r="5" fill="#EF4C86"/></g>
 <g class="mz-face">
  <ellipse cx="-13" cy="-58" rx="8.5" ry="9.5" fill="#fff"/><ellipse cx="13" cy="-58" rx="8.5" ry="9.5" fill="#fff"/>
  <g class="mz-eyes"><circle cx="-12" cy="-56" r="4.6" fill="#22122A"/><circle cx="14" cy="-56" r="4.6" fill="#22122A"/><circle cx="-10.5" cy="-58" r="1.6" fill="#fff"/><circle cx="15.5" cy="-58" r="1.6" fill="#fff"/></g>
  <ellipse cx="-26" cy="-43" rx="6" ry="3.6" fill="#FFB3CB" opacity=".8"/><ellipse cx="26" cy="-43" rx="6" ry="3.6" fill="#FFB3CB" opacity=".8"/>
  <path class="mz-smile" d="M-9 -41 Q0 -31 9 -41" stroke="#5B0F2E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="mz-oh" d="M-5 -37 Q0 -43 5 -37 Q0 -33 -5 -37Z" fill="#5B0F2E"/>
  <path class="mz-sweat" d="M30 -74 C34 -66 36 -62 32 -59 C28 -57 26 -62 30 -74Z" fill="#7FD3FF"/>
 </g>
 ${outfitRaiz(on)}
</g></g>
<g transform="translate(186 194)"><g class="mz-pivo-body">
 <g class="mz-legs"><path d="M-12 -14 v10 M12 -14 v10" stroke="#24398F" stroke-width="5" stroke-linecap="round"/><rect x="-24" y="-7" width="18" height="8" rx="4" fill="#F4F6FB" stroke="#24398F" stroke-width="2"/><rect x="6" y="-7" width="18" height="8" rx="4" fill="#F4F6FB" stroke="#24398F" stroke-width="2"/></g>
 <path class="mz-tuft" d="M-6 -88 C-4 -98 4 -100 8 -96 C4 -95 2 -92 4 -88" fill="#24398F"/>
 <rect x="-33" y="-88" width="66" height="76" rx="19" fill="url(#mzPivoSkin-${u})"/>
 <path d="M-23 -80 C-16 -84 -6 -85 4 -85" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3" fill="none"/>
 <text class="mz-belly" x="0" y="-21" text-anchor="middle" font-size="15" font-weight="800" fill="#DCE3FF" font-family="Figtree, sans-serif">[1 0]</text>
 <g class="mz-face">
  <path class="mz-brows" d="M-19 -71 l10 2 M19 -71 l-10 2" stroke="#1B2A6B" stroke-width="3" stroke-linecap="round"/>
  <circle cx="-12" cy="-59" r="7" fill="#fff"/><circle cx="12" cy="-59" r="7" fill="#fff"/>
  <g class="mz-eyes"><circle cx="-11" cy="-58" r="3.6" fill="#101736"/><circle cx="13" cy="-58" r="3.6" fill="#101736"/></g>
  <path class="mz-smile" d="M-8 -45 Q2 -38 10 -46" stroke="#101736" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="mz-oh" d="M-6 -42 Q0 -47 6 -42" stroke="#101736" stroke-width="3" fill="none" stroke-linecap="round"/>
 </g>
 ${outfitPivo(on)}
 <g class="mz-glove-l"><path d="M-33 -46 C-42 -44 -46 -40 -47 -36" stroke="#24398F" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="-48" cy="-35" r="9" fill="#E8457A"/><path d="M-53 -38 C-50 -42 -45 -42 -43 -39" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/></g>
 <g class="mz-glove-r"><path d="M33 -46 C42 -44 46 -40 47 -36" stroke="#24398F" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="48" cy="-35" r="9" fill="#E8457A"/><path d="M43 -38 C46 -42 51 -42 53 -39" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/></g>
</g></g>
<g class="mz-sparkles"><path d="M40 70 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3z" fill="#F7C531"/><path d="M222 64 l2 -7 l2 7 l7 2 l-7 2 l-2 7 l-2 -7 l-7 -2z" fill="#F7C531"/><path d="M118 98 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#9AE6B4"/></g>
</svg>`;
  }

  // ---------- palco ----------
  let stage = null, bubbleTimer = null, reactTimer = null, sayTimer = null, current = [];
  const outfitKey = list => (list || []).slice().sort().join(',');
  function mount() {
    if (stage || !doc || !doc.body) return stage;
    stage = doc.createElement('div');
    stage.className = 'mz-stage';
    stage.id = 'mascotes';
    stage.setAttribute('aria-hidden', 'true');
    stage.hidden = true;
    stage.innerHTML = `<div class="mz-bubble"></div><div class="mz-art">${svg(current)}</div><div class="mz-fx"></div>`;
    doc.body.appendChild(stage);
    return stage;
  }
  function update(opts) {
    const o = opts || {};
    if (!mount()) return;
    if (outfitKey(o.outfit) !== outfitKey(current)) { current = (o.outfit || []).slice(); stage.querySelector('.mz-art').innerHTML = svg(current); }
    const visible = !!o.visible;
    if (stage.hidden === visible) stage.hidden = !visible;
    doc.body.classList.toggle('has-mascots', visible);
    if (visible) {
      const bar = doc.querySelector('.player-bar');
      const h = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
      doc.documentElement.style.setProperty('--mz-bar', h + 'px');
    }
  }
  function say(text, ms) {
    if (!stage) return;
    const b = stage.querySelector('.mz-bubble');
    b.textContent = text; b.classList.add('show');
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => b.classList.remove('show'), ms || 2600);
  }
  // Moedas saem da caixa, caem e voam até o contador de moedas (se ele estiver na tela).
  function coins(n, label) {
    if (!stage) return;
    const fx = stage.querySelector('.mz-fx'), count = Math.max(3, Math.min(8, n || 5));
    for (let i = 0; i < count; i++) {
      const c = doc.createElement('span');
      c.className = 'mz-coin';
      c.textContent = '√';
      const dx = (i - (count - 1) / 2) * 16 + (Math.random() * 8 - 4), up = 40 + Math.random() * 26;
      c.style.setProperty('--dx', dx.toFixed(1) + 'px'); c.style.setProperty('--up', up.toFixed(1) + 'px'); c.style.animationDelay = (i * 40) + 'ms';
      fx.appendChild(c);
      setTimeout(() => flyToCounter(c), 760 + i * 60);
    }
    if (label) { const t = doc.createElement('span'); t.className = 'mz-plus'; t.textContent = label; fx.appendChild(t); setTimeout(() => t.remove(), 1600); }
  }
  function flyToCounter(el) {
    const target = doc.querySelector('.coin-meta');
    if (!target || !el.animate || reduce()) { el.remove(); return; }
    const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = el.animate([{ transform: getComputedStyle(el).transform === 'none' ? 'none' : getComputedStyle(el).transform, opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: .2 }], { duration: 520, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    anim.onfinish = () => { el.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); };
  }
  function confetti() {
    if (!stage || reduce()) return;
    const fx = stage.querySelector('.mz-fx'), colors = ['#F7C531', '#FF5C93', '#4C6EF5', '#35B873', '#FF8A3D'];
    for (let i = 0; i < 22; i++) {
      const c = doc.createElement('i');
      c.className = 'mz-confetti';
      c.style.setProperty('--dx', (Math.random() * 240 - 120).toFixed(0) + 'px');
      c.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      c.style.background = colors[i % colors.length];
      c.style.left = (40 + Math.random() * 20) + '%';
      c.style.animationDelay = (Math.random() * 200).toFixed(0) + 'ms';
      fx.appendChild(c); setTimeout(() => c.remove(), 1900);
    }
  }
  const DURATION = { ok: 1000, bad: 1300, combo: 1900, level: 2600, world: 3000 };
  function react(kind, opts) {
    if (!mount() || stage.hidden) return false;
    const o = opts || {};
    stage.classList.remove('is-ok', 'is-bad', 'is-combo', 'is-level', 'is-world');
    void stage.offsetWidth; // reinicia a animação mesmo se a reação se repetir
    stage.classList.add('is-' + kind);
    clearTimeout(reactTimer); reactTimer = setTimeout(() => stage.classList.remove('is-' + kind), DURATION[kind] || 1200);
    // Com moedas no ar, o balão espera elas passarem (senão as moedas cobrem a frase).
    const text = o.text || pick(PHRASES[kind] || PHRASES.ok), late = !reduce() && (kind === 'combo' || ((kind === 'level' || kind === 'world') && o.coins));
    clearTimeout(sayTimer);
    if (late) { stage.querySelector('.mz-bubble').classList.remove('show'); sayTimer = setTimeout(() => say(text, 2600), kind === 'combo' ? 1450 : 1250); }
    else say(text, kind === 'world' || kind === 'level' ? 3200 : 2400);
    if (kind === 'combo') setTimeout(() => coins(o.coins || 5, o.coins ? '+' + o.coins : ''), reduce() ? 0 : 640);
    if (kind === 'level' || kind === 'world') { confetti(); if (o.coins) setTimeout(() => coins(Math.min(8, o.coins), '+' + o.coins), 300); }
    return true;
  }
  if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount); else mount(); }
  global.NumeraMascotes = { ITEMS, PHRASES, svg, mount, update, react, say };
})(window);
