// Escreve TREINO.md a partir de dist/treino-data.js (a documentação nunca fica desatualizada em relação aos dados).
// Uso: node tests/treino/gerar-treino-md.cjs
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '../..');
const w = {}; new Function('window', fs.readFileSync(path.join(root, 'dist/treino-data.js'), 'utf8'))(w);
const E = w.NumeraTreino.exercises;
const NOME = { bisection: 'Bisseção', falseposition: 'Falsa Posição', fixedpoint: 'Ponto Fixo', newton: 'Newton-Raphson', secant: 'Secante', gauss: 'Eliminação de Gauss', seidel: 'Gauss-Seidel' };
// Expoentes elevados de verdade no Markdown (<sup>), como no site: nada de x^3 no texto.
function supMd(t) {
  let out = '', i = 0;
  while (i < t.length) {
    if (t[i] === '^' && i > 0 && /[\w)\]}²³π.]/.test(t[i - 1])) {
      const j = i + 1;
      if (t[j] === '(' || t[j] === '{') {
        const open = t[j], close = open === '(' ? ')' : '}'; let d = 0, k = j;
        for (; k < t.length; k++) { if (t[k] === open) d++; else if (t[k] === close && --d === 0) break; }
        if (k < t.length) { out += '<sup>' + supMd(t.slice(j + 1, k)).replace(/-/g, '−') + '</sup>'; i = k + 1; continue; }
      }
      const m = /^[+\-−]?(?:\d+(?:[.,]\d+)?|[a-zA-Zπ])/.exec(t.slice(j));
      if (m) { out += '<sup>' + m[0].replace('-', '−') + '</sup>'; i = j + m[0].length; continue; }
    }
    out += t[i]; i++;
  }
  return out;
}
// Fórmula na sintaxe do motor -> texto de leitura: · no produto, − no menos, vírgula decimal, √, π, eˣ e expoentes elevados.
const mathMd = src => supMd(String(src).replace(/exp\(([^()]*)\)/g, 'e^($1)').replace(/abs\(([^()]*)\)/g, '|$1|').replace(/sqrt\(/g, '√(')
  .replace(/asin\(/g, 'arcsen(').replace(/(^|[^a-z])pi(?![a-z])/g, '$1π').replace(/\*/g, '·').replace(/(\d)\.(\d)/g, '$1,$2').replace(/-/g, '−'));
const ORDEM = Object.keys(NOME), CURTO = { bisection: 'B', falseposition: 'FP', fixedpoint: 'PF', newton: 'N', secant: 'S', gauss: 'G', seidel: 'GS' };
const br = v => typeof v !== 'number' ? String(v) : (Math.abs(v) !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e9)) ? v.toExponential(4).replace('.', ',').replace('e', '·10^') : Number(v.toPrecision(10)).toLocaleString('pt-BR', { maximumFractionDigits: 10 });
const resp = e => e.answer.type === 'vec' ? e.answer.names.map((n, i) => `${n} ≈ ${br(e.answer.values[i])}`).join(', ') : br(e.answer.value);
const bold = s => s.replace(/\[\[(.+?)\|([^|\]]+)\]\]/g, '**$1**');
const areas = [...new Set(E.map(e => e.area))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const lv = m => [1, 2, 3].map(l => E.filter(e => e.method === m && e.level === l).length);
const tot = [1, 2, 3].map(l => E.filter(e => e.level === l).length);
const nTraps = E.reduce((s, e) => s + (e.traps || []).length, 0);
let md = `# Treino — ${E.length} exercícios de diagnóstico e resolução

> Arquivo gerado por \`tests/treino/gerar-treino-md.cjs\` a partir de \`dist/treino-data.js\`. Não edite à mão.

> **v11:** a pedido da professora, o Ponto Fixo está escondido no site, então o Treino mostra 120 exercícios (renumerados de 1 a 120, sem dois métodos iguais seguidos). Os 20 do Ponto Fixo continuam no arquivo e neste documento, com a numeração original, e voltam ao site quando o método voltar.

A aba **Treino** (entre Jogos e Terminal) tem ${E.length} problemas misturados, **20 para cada um dos sete métodos**. Em cada um, a pessoa:

1. **Diagnostica** qual dos sete métodos é o mais indicado, lendo as pistas do enunciado. Até o diagnóstico, a pergunta aparece **sem o nome do método**, para não entregar a resposta;
2. **Resolve** o que se pede (uma iteração, o número de iterações, a raiz ou a solução do sistema);
3. **Confere** no gabarito: resposta, por que aquele método, passo a passo, **gráfico de convergência** com os métodos lado a lado, **erros típicos** e por que os outros seis seriam piores.

## Novidades da v9

- **Falsa Posição e Ponto Fixo:** 20 exercícios novos de cada, em 40 contextos (finanças, termodinâmica, epidemiologia, órbitas, recursos humanos, clima…).
- **Pergunta sem o método** até o diagnóstico (antes, o texto da pergunta já dizia “faça 3 iterações da Bisseção”).
- **Dicas por erro típico:** ${nTraps} erros comuns previstos (uma iteração a menos, metade errada do intervalo, sinal trocado na fórmula, calculadora em graus, Jacobi no lugar de Gauss-Seidel, lado direito esquecido no escalonamento…). Se a resposta digitada bate com um deles, a tela explica exatamente o engano.
- **Gráfico de convergência no gabarito**, calculado pelo motor: erro por iteração em escala logarítmica, com a ordem observada de cada método.
- **Modo prova:** 5, 10 ou 15 questões sorteadas e misturadas, com cronômetro opcional, nota de 0 a 10 (0,4 pelo método e 0,6 pela resposta) e relatório para imprimir ou salvar em PDF.
- **Revisão espaçada dos diagnósticos:** cada diagnóstico errado (no Treino ou na prova) vai para o caderno de Revisão e volta depois de 1, 3, 7 e 14 dias.
- **Progresso da v8 preservado:** ${E.filter(e => e.legacy).length} exercícios não mudaram e trazem o progresso antigo; os que mudaram recomeçam.

## Como os exercícios foram feitos e conferidos

- **Gerador:** \`tests/treino/gerar-treino.py\` escreve \`dist/treino-data.js\` (reproduzível byte a byte).
- **Gabarito independente do site:** sympy (derivadas exatas e frações) e mpmath com 50 dígitos.
- **Conferência com o motor do site:** \`node tests/treino/conferir-com-motor.cjs\` refaz as ${E.length} contas com o \`math-engine.js\`, confere que nenhum erro típico é aceito como certo e que o gráfico de convergência de cada gabarito mostra o método do exercício chegando à raiz certa.
- **Pela interface:** \`node tests/verify.cjs\` (grupo “Treino”) resolve os ${E.length} exercícios digitando a resposta com vírgula, faz uma prova completa, testa a revisão, os erros típicos e a migração do progresso.
- **Ordem:** misturada com semente fixa, **nunca dois métodos iguais seguidos**; os 14 primeiros já trazem os 7 métodos e o primeiro é de nível 1. Sequência dos 30 primeiros: ${E.slice(0, 30).map(e => CURTO[e.method]).join(' ')}.

## Distribuição

| Método | Nível 1 | Nível 2 | Nível 3 | Total |
|---|---|---|---|---|
${ORDEM.map(m => `| ${NOME[m]} | ${lv(m).join(' | ')} | 20 |`).join('\n')}
| **Total** | ${tot.join(' | ')} | **${E.length}** |

São ${areas.length} áreas: ${areas.join(', ')}.

## As pistas que decidem o método

| Método | Pistas típicas no enunciado |
|---|---|
| Bisseção | **sinais opostos** nas pontas e exigência de **erro garantido de antemão** (cota (b − a)/2ⁿ); curva torta demais para a corda; Newton falha (ciclo, derivada nula, exponencial íngreme, bico, polo) |
| Falsa Posição | **sinais opostos** nas pontas e **curva quase reta** no intervalo; a raiz precisa **continuar cercada**, mas com menos avaliações que a Bisseção; sem derivada |
| Ponto Fixo | a equação **já vem na forma x = g(x)** (regra de atualização, modelo ano a ano, equilíbrio); **\\|g′\\| < 1** perto da raiz (contração); **um único chute**; sem derivada |
| Newton-Raphson | **derivada fácil**; **chute inicial bom**; muitas casas em poucas iterações (convergência quadrática); a iteração direta x = g(x) seria lenta |
| Secante | **derivada trabalhosa, cara ou indisponível** (planilha, simulador, ajuste de dados) e **dois palpites que não cercam a raiz** (mesmo sinal: Bisseção e Falsa Posição nem começam) |
| Eliminação de Gauss | **sistema pequeno** e **solução exata**; **sem dominância diagonal**; pivô nulo ou minúsculo |
| Gauss-Seidel | **dominância diagonal estrita**; **sistema grande ou esparso**; **boa aproximação inicial**; pede iterações |

## Lista completa com gabarito

Nos enunciados abaixo, as pistas aparecem em **negrito**. Na tela, elas só são marcadas depois do diagnóstico.

`;
for (const e of E) {
  const eq = e.system ? e.system.map(mathMd).join(' ; ') : e.g ? `x = ${mathMd(e.g)}` : `f(x) = ${mathMd(e.source)}`;
  md += `### ${e.n}. ${e.title}\n*Nível ${e.level} · ${e.area} · id \`${e.id}\`*\n\n${bold(e.story)}\n\n${eq}\n\n**Pergunta (sem o método):** ${e.askBlind}\n\n**Depois do diagnóstico:** ${e.ask}\n\n**Gabarito:** ${NOME[e.method]} — ${resp(e)}${e.answer.abs ? ` (tolerância ${String(e.answer.abs).replace('.', ',')})` : ''}. ${e.why}\n`;
  if (e.traps && e.traps.length) md += `\n**Erros típicos reconhecidos:** ${e.traps.map(t => `${Array.isArray(t.v) ? '(' + t.v.map(br).join('; ') + ')' : br(t.v)} → ${t.m}`).join(' · ')}\n`;
  md += '\n';
}
md = md.split('\n').map(l => /^\|[-| ]+\|$/.test(l) ? l : supMd(l)).join('\n');
fs.writeFileSync(path.join(root, 'docs/TREINO.md'), md);
console.log(`TREINO.md: ${E.length} exercícios, ${md.split('\n').length} linhas`);
