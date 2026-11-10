// Problemas opcionais calculados, sem consumir energia nem mudar a trilha principal.
export function desafioMestre(id) {
  if (id === 'newton') {
    let x = 2; for (let i = 0; i < 2; i++) x -= (x ** 3 - 2 * x - 5) / (3 * x * x - 2);
    return { texto: 'A cúbica de Newton: x³ − 2x − 5 = 0. Começando em x₀ = 2, qual é x₂ após duas tangentes?', valor: x, erradas: [2.1, 2.5, 1.9], explicacao: 'x₁ = 2,1; x₂ = 2,1 − f(2,1)/f′(2,1) ≈ 2,094568. O resíduo fica pequeno rapidamente.' };
  }
  if (id === 'gauss') return { texto: 'Modelo didático de observações orbitais (não os dados históricos de Ceres): ajuste y = ax + b aos pontos (0;1), (1;2), (2;2). Qual é a inclinação a?', valor: 0.5, erradas: [1, 1.5, 2], explicacao: 'x médio = 1, y médio = 5/3. a = Σ(x−x̄)(y−ȳ)/Σ(x−x̄)² = 1/2; b = 7/6.' };
  if (id === 'lagrange') return { texto: 'Interpole (0;1), (1;2), (2;5). Quanto vale o polinômio em x = 1,5?', valor: 3.25, erradas: [3.5, 2.5, 4], explicacao: 'Os três pontos definem p(x) = x² + 1. Assim p(1,5) = 3,25. Uma reta entre os dois últimos pontos daria 3,5.' };
  if (id === 'euler') return { texto: 'y′ = −2y, y(0) = 1. Faça um passo de Euler explícito de tamanho h = 0,1. Qual é y₁?', valor: 0.8, erradas: [1.2, Math.exp(-0.2), 0.98], explicacao: 'y₁ = y₀ + h(−2y₀) = 1 − 0,2 = 0,8. A solução exata exp(−0,2) é diferente da aproximação de Euler.' };
  return null;
}
export async function jogarDesafio(dlg, quem, id, registro, salvar) {
  const q = desafioMestre(id); if (!q) return;
  const valores = [q.erradas[0], q.valor, q.erradas[1]];
  const resposta = await dlg.show({ ...quem, lines: [q.texto], options: [...valores.map((v, i) => ({ label: v.toFixed(6).replace('.', ','), value: String(i) })), { label: 'Voltar', value: 'voltar' }] });
  if (resposta == null || resposta === 'voltar') return;
  const acerto = resposta === '1';
  if (acerto) { registro.desafio = true; salvar(); }
  await dlg.show({ ...quem, lines: [acerto ? 'Desafio concluído! ✓' : 'Ainda não. Você pode tentar novamente.', q.explicacao] });
}
