// Transições: íris (círculo que fecha ao redor da porta), fade e flash.
const iris = () => document.getElementById('iris');

function anim(dur, fn) {
  return new Promise((res) => {
    const t0 = performance.now();
    // setTimeout (e não rAF) para a transição terminar mesmo com a aba em segundo plano
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (dur * 1000));
      fn(k);
      if (k < 1) setTimeout(step, 16); else res();
    };
    step();
  });
}

// closing=true: o círculo fecha até cobrir a tela
export function irisTo(x, y, closing, dur = 0.5) {
  const el = iris();
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
  el.style.pointerEvents = 'auto';
  return anim(dur, (k) => {
    const e = closing ? 1 - k * k : k * (2 - k);
    const r = Math.max(0, R * e);
    el.style.background = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #1b1430 ${r + 1.5}px)`;
  }).then(() => {
    if (!closing) { el.style.background = 'none'; el.style.pointerEvents = 'none'; }
  });
}

export function fade(on, dur = 0.5) {
  const el = document.getElementById('fade');
  el.style.transition = `opacity ${dur}s`;
  el.style.opacity = on ? '1' : '0';
  el.style.pointerEvents = on ? 'auto' : 'none';
  return new Promise((r) => setTimeout(r, dur * 1000 + 30));
}

export function flash(color = '#b7ff3c', dur = 0.6) {
  const el = document.getElementById('flash');
  el.style.background = color;
  return anim(dur, (k) => { el.style.opacity = String((1 - k) * 0.85); });
}
