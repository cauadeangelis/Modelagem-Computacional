// A cena usa somente valores de passos já concluídos: não revela a próxima resposta.
export function cenaUsina(reator, valores, residuo, passos) {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
  const n = v => Number.isFinite(v) ? Number(v.toPrecision(5)).toString() : '—';
  const cor = residuo < 0.001 ? '#67dba6' : '#ffb86b';
  let cena, descricao;
  if (reator === 1) {
    const ps = [[35, 80], ...valores.map((v, i) => [110 + i * 90, 80 + clamp(v * 12, -45, 60)]), [465, 80]];
    cena = `<polyline points="${ps.map(p => p.join(',')).join(' ')}" fill="none" stroke="${cor}" stroke-width="6"/>${ps.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${cor}"/>`).join('')}`;
    descricao = `Estrutura de quatro nós: deslocamentos (${valores.map(n).join('; ')}). Os nós são atualizados na substituição regressiva; antes disso ficam na posição inicial.`;
  } else {
    const x = valores[0], h = clamp(x * (reator === 0 ? 110 : 25), 0, 120), y = 150 - h;
    cena = `<path d="M20 60H230V150H20Z" fill="#62b5f1" opacity=".65"/><rect x="230" y="25" width="22" height="125" fill="#7a8595"/><rect x="225" y="${y}" width="32" height="${h}" fill="${cor}"/><path d="M257 ${150 - h / 3}Q330 135 470 148" stroke="#62b5f1" stroke-width="12" fill="none"/>`;
    descricao = `Atuador hidráulico: posição proporcional à aproximação ${n(x)}. O resíduo ${n(residuo)} indica o desequilíbrio do modelo numérico.`;
  }
  return `<details class="uf-fenomeno" open><summary>Fenômeno a cada passo</summary><svg viewBox="0 0 500 175" role="img" aria-label="${descricao}" style="display:block;width:100%;max-height:180px"><path d="M15 158H485" stroke="currentColor"/>${cena}</svg><p>${descricao}</p><p>Passos concluídos: ${passos} · resíduo: ${n(residuo)}. Representação didática em escala visual, sem unidades físicas atribuídas à equação do reator.</p></details>`;
}
