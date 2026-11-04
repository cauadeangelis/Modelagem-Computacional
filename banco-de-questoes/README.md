# Banco de questões

As questões das listas da disciplina num banco SQL só nosso, separado do resto do projeto. É daqui que saem:

- a página **Listas** do site (todas as questões, com resolução no formato dos slides);
- a **Revisão** (questão errada vai para o caderno);
- o modo **Relâmpago** (perguntas rápidas de múltipla escolha, com cronômetro);
- as **casas verdes da Calculândia** (uma pergunta de múltipla escolha do método da cidade);
- as questões numéricas do **Quem Divergiu?** (a professora liga ou desliga na tela de ajustes).

## O que tem

| Lista | Origem | Questões |
|---|---|---|
| Slides da professora | perguntas de conceito do Cap. 2 e do Cap. 3 (Profa. Danielle Teixeira, Ibmec) | 22 |
| 4ª Lista e 5ª Lista | Profa. Danielle Teixeira, Ibmec (sem gabarito: as respostas são as da conta) | 47 |
| Listas 1 a 10 | Cálculo Numérico, UERJ (com gabarito) | 254 |
| Perguntas rápidas de conceito | ponto flutuante, interpolação, ajuste, integração e EDO | 11 |

São 334 questões no total, contando as versões rápidas ("1º passo") de questões longas. As fórmulas estão em texto Unicode (x₁, x², √, ≤), sem LaTeX.

## Tabelas

| Tabela | Colunas principais |
|---|---|
| `listas` | `id`, `titulo`, `instituicao`, `assunto`, `ordem`, `tem_gabarito` |
| `temas` | `id`, `nome`, `licao_do_site` (lição do site), `regiao_calculandia` (método da cidade no jogo) |
| `questoes` | `enunciado`, `gabarito_lista` (como está impresso), `resposta` (a da conta), `valor`/`vetor`/`matriz`, `casas`, `tolerancia`, `parametros` (o que o resolvedor precisa para refazer a conta), `resolucao`, `observacao`, `diverge`, `rapida`, `origem_id` |
| `alternativas` | `questao_id`, `letra` (A–D), `texto`, `correta`, `explicacao` (por que a errada está errada) |

## Regras

1. **A resposta é sempre a da conta.** `tests/banco/conferir-banco.cjs` refaz cada questão a partir de `parametros`, com o mesmo código que o site usa (`dist/js/motor/resolver-questoes.js`), e confere `valor`, `vetor`, `matriz` e `resolucao`.
2. **Gabarito da lista que não confere ganha observação.** Quando o número impresso na lista é diferente da conta, `diverge = 1` e `observacao` explica a diferença (são 17 casos; por exemplo, a 12ª questão da Lista 1 traz o 5º ponto médio em vez do 4º). O site mostra a observação junto da resolução.
3. **Cada questão (menos as de programação) tem 4 alternativas**, uma só correta, e cada alternativa errada diz qual erro leva a ela (método trocado, uma iteração a menos, calculadora em graus, sinal trocado, fração invertida…).
4. `rapida = 1` marca as perguntas curtas, usadas no Relâmpago e nas casas verdes.

## Como editar

1. Edite `questoes.sql` (num editor de texto ou num programa de SQLite).
2. Gere o arquivo do site:

   ```bash
   npm run banco              # ou: node banco-de-questoes/gerar-arquivo-do-site.cjs
   ```

3. Confira:

   ```bash
   node tests/banco/conferir-banco.cjs
   npm run atualizar          # acerta o cache offline do site
   ```

O site é estático e não lê SQL diretamente: lê `dist/dados/banco-de-questoes.js`, que é uma cópia gerada do banco. Não edite esse arquivo à mão.

## Abrir num programa de banco de dados

```bash
sqlite3 numera.db < banco-de-questoes/questoes.sql
sqlite3 numera.db "SELECT id, numero, resposta FROM questoes WHERE lista_id = 'lista-01' LIMIT 5;"
```

Exemplos de consultas:

```sql
-- quantas questões por assunto
SELECT t.nome, COUNT(*) FROM questoes q JOIN temas t ON t.id = q.tema_id GROUP BY t.nome ORDER BY 2 DESC;

-- gabaritos das listas que não conferem com a conta, com a explicação
SELECT id, gabarito_lista, resposta, observacao FROM questoes WHERE diverge = 1;

-- as alternativas de uma questão
SELECT letra, texto, correta, explicacao FROM alternativas WHERE questao_id = 'l01-zeros-03' ORDER BY letra;
```

O gerador funciona em qualquer Node 18 ou mais novo: usa o SQLite embutido do Node (`node:sqlite`) quando existe e, se não existir, lê os `INSERT` do arquivo com um leitor simples.
