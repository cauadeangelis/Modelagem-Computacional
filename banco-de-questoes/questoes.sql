-- Banco de questões do Numera Academy (SQLite).
-- Fonte única das questões: o site (Listas, Revisão, Relâmpago) e os jogos (Calculândia e Quem Divergiu?)
-- leem o arquivo dist/dados/banco-de-questoes.js, que é GERADO a partir deste arquivo:
--     npm run banco          (ou: node banco-de-questoes/gerar-arquivo-do-site.cjs)
-- Para abrir em um programa de banco de dados: sqlite3 numera.db < banco-de-questoes/questoes.sql
--
-- Regras do banco:
--   * resposta/valor/vetor/matriz são SEMPRE os da conta, refeita a partir de "parametros" pelo
--     arquivo dist/js/motor/resolver-questoes.js (o teste tests/banco/conferir-banco.cjs confere todas).
--   * gabarito_lista guarda o que está impresso na lista; quando não bate com a conta, "observacao" explica.
--   * Fórmulas em texto Unicode (x₁, x², √, ≤), sem LaTeX.
--   * rapida = 1 marca as perguntas curtas usadas no modo Relâmpago e nas casas verdes da Calculândia.

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

CREATE TABLE sobre (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE listas (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL,
  instituicao   TEXT NOT NULL,
  assunto       TEXT NOT NULL,
  ordem         INTEGER NOT NULL,
  tem_gabarito  INTEGER NOT NULL CHECK (tem_gabarito IN (0, 1))
);

CREATE TABLE temas (
  id                  TEXT PRIMARY KEY,
  nome                TEXT NOT NULL,
  licao_do_site       TEXT,           -- id da lição em dist/js/conteudo/conteudo.js (NULL = sem lição própria)
  regiao_calculandia  TEXT NOT NULL,  -- método do catálogo de fases da Calculândia
  ordem               INTEGER NOT NULL
);

CREATE TABLE questoes (
  id              TEXT PRIMARY KEY,
  lista_id        TEXT NOT NULL REFERENCES listas(id),
  numero          TEXT NOT NULL,      -- como aparece na lista ("12ª", "2 (a)")
  secao           TEXT,
  tema_id         TEXT NOT NULL REFERENCES temas(id),
  dificuldade     INTEGER NOT NULL CHECK (dificuldade BETWEEN 1 AND 3),
  tipo            TEXT NOT NULL CHECK (tipo IN ('numero', 'vetor', 'matriz', 'sistema', 'texto', 'programa')),
  rapida          INTEGER NOT NULL DEFAULT 0 CHECK (rapida IN (0, 1)),
  origem_id       TEXT REFERENCES questoes(id),  -- versões rápidas apontam para a questão completa
  enunciado       TEXT NOT NULL,
  gabarito_lista  TEXT,               -- como está impresso na lista (NULL quando a lista não traz gabarito)
  resposta        TEXT NOT NULL,      -- resposta certa, já formatada
  valor           REAL,               -- resposta numérica (tipo numero)
  valor_lista     REAL,               -- número do gabarito da lista, para comparação
  vetor           TEXT,               -- JSON: resposta em vetor
  vetor_lista     TEXT,               -- JSON: vetor do gabarito da lista
  matriz          TEXT,               -- JSON: resposta em matriz(es)
  casas           INTEGER,            -- casas decimais pedidas
  tolerancia      REAL,               -- folga aceita na correção (NULL = meia unidade da última casa)
  parametros      TEXT NOT NULL,      -- JSON com o que o resolvedor precisa para refazer a conta
  resolucao       TEXT NOT NULL,
  observacao      TEXT,
  diverge         INTEGER NOT NULL DEFAULT 0 CHECK (diverge IN (0, 1))  -- 1 = gabarito da lista não bate com a conta
);

CREATE TABLE alternativas (
  questao_id  TEXT NOT NULL REFERENCES questoes(id),
  letra       TEXT NOT NULL CHECK (letra IN ('A', 'B', 'C', 'D')),
  texto       TEXT NOT NULL,
  correta     INTEGER NOT NULL CHECK (correta IN (0, 1)),
  explicacao  TEXT,                   -- por que a alternativa errada está errada
  PRIMARY KEY (questao_id, letra)
);

CREATE INDEX questoes_por_tema ON questoes(tema_id);
CREATE INDEX questoes_por_lista ON questoes(lista_id);
CREATE INDEX questoes_rapidas ON questoes(rapida, tema_id);

INSERT INTO sobre (chave, valor) VALUES ('versao', '1');
INSERT INTO sobre (chave, valor) VALUES ('descricao', 'Questões das listas de Cálculo Numérico (UERJ, Listas 1 a 10; Ibmec, 4ª e 5ª Listas da Profa. Danielle Teixeira) e perguntas de conceito dos slides.');

INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('slides', 'Slides da professora — perguntas de conceito', 'Ibmec — Profa. Danielle Teixeira (Cap. 2 e Cap. 3)', 'Teorema 1, Bisseção, Falsa Posição, Newton-Raphson, Secante, Eliminação de Gauss e pivoteamento', 1, 0);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('ibmec-04', '4ª Lista de Cálculo Numérico', 'Ibmec — Profa. Danielle Teixeira', 'Bisseção e Falsa Posição', 2, 0);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('ibmec-05', '5ª Lista de Cálculo Numérico', 'Ibmec — Profa. Danielle Teixeira', 'Newton-Raphson e Secante', 3, 0);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-01', 'Lista 1 — Erros e zeros de funções', 'UERJ — Cálculo Numérico', 'Ponto flutuante; Bisseção, Falsa Posição, Newton-Raphson e Secante', 4, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-02', 'Lista 2 — Resolução de sistemas lineares', 'UERJ — Cálculo Numérico', 'Gauss, LU, pivoteamento e erro entre iterações', 5, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-03', 'Lista 3 — Gauss-Jacobi e Gauss-Seidel', 'UERJ — Cálculo Numérico', 'Jacobi, Seidel, critérios de convergência e Cholesky', 6, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-04', 'Lista 4 — Revisão', 'UERJ — Cálculo Numérico', 'Séries, sistemas, LU, pivoteamento e zeros de funções', 7, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-05', 'Lista 5 — Fatoração de Cholesky', 'UERJ — Cálculo Numérico', 'Cholesky: fatoração e sistemas', 8, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-06', 'Lista 6 — Interpolação', 'UERJ — Cálculo Numérico', 'Interpolação linear, polinomial (Lagrange) e inversa', 9, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-07', 'Lista 7 — Ajuste de curvas', 'UERJ — Cálculo Numérico', 'Mínimos quadrados: reta, parábola, exponencial e outras bases', 10, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-08', 'Lista 8 — Integração numérica', 'UERJ — Cálculo Numérico', 'Trapézios, Simpson 1/3 e retângulos', 11, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-09', 'Lista 9 — Integração numérica (continuação)', 'UERJ — Cálculo Numérico', 'Simpson 3/8', 12, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('lista-10', 'Lista 10 — Equações diferenciais', 'UERJ — Cálculo Numérico', 'PVI: Euler e Taylor de 2ª ordem', 13, 1);
INSERT INTO listas (id, titulo, instituicao, assunto, ordem, tem_gabarito) VALUES ('conceitos', 'Perguntas rápidas de conceito', 'Numera Academy', 'Ponto flutuante, interpolação, ajuste, integração e EDO', 14, 0);

INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('ponto-flutuante', 'Ponto flutuante e erros', NULL, 'truncamento', 1);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('series', 'Séries e erro de truncamento', NULL, 'truncamento', 2);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('bissecao', 'Bisseção', 'bisection', 'bissecao', 3);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('falsa-posicao', 'Falsa Posição', 'falseposition', 'falsaPosicao', 4);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('newton', 'Newton-Raphson', 'newton', 'newton', 5);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('secante', 'Secante', 'secant', 'secante', 6);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('gauss', 'Eliminação de Gauss', 'gauss', 'gauss', 7);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('pivoteamento', 'Pivoteamento parcial', 'gauss', 'pivoteamento', 8);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('lu', 'Fatoração LU', 'gauss', 'lu', 9);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('cholesky', 'Fatoração de Cholesky', 'gauss', 'lu', 10);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('markov', 'Sistemas [a b c]·M = [a b c]', 'gauss', 'gauss', 11);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('jacobi', 'Gauss-Jacobi', 'seidel', 'jacobi', 12);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('seidel', 'Gauss-Seidel', 'seidel', 'seidel', 13);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('criterios', 'Critérios de convergência (linhas e Sassenfeld)', 'seidel', 'seidel', 14);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('erro-vetor', 'Erro relativo entre iterações', 'seidel', 'jacobi', 15);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('interpolacao', 'Interpolação', NULL, 'lagrange', 16);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('minimos-quadrados', 'Mínimos quadrados', NULL, 'minimosQuadrados', 17);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('trapezios', 'Regra dos trapézios', NULL, 'trapezio', 18);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('retangulos', 'Regra dos retângulos (ponto médio)', NULL, 'trapezio', 19);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('simpson13', 'Regra de Simpson 1/3', NULL, 'simpson13', 20);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('simpson38', 'Regra de Simpson 3/8', NULL, 'simpson38', 21);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('euler', 'Método de Euler', NULL, 'euler', 22);
INSERT INTO temas (id, nome, licao_do_site, regiao_calculandia, ordem) VALUES ('taylor', 'Taylor de 2ª ordem', NULL, 'rk4', 23);

-- ======================================================================
-- Slides da professora — perguntas de conceito (Ibmec — Profa. Danielle Teixeira (Cap. 2 e Cap. 3))
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-teorema1', 'slides', '', 'Cap. 3 — Raízes de Equações', 'bissecao', 1, 'texto', 1, NULL, 'Pelo Teorema 1 dos slides, o que garante que existe pelo menos uma raiz de f em [a, b]?', NULL, 'f contínua em [a, b] e f(a)·f(b) < 0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Se f é contínua em [a, b] e f(a)·f(b) < 0, existe pelo menos um x₀ em [a, b] com f(x₀) = 0. É a base dos métodos intervalares (Bisseção e Falsa Posição)."}', 'Se f é contínua em [a, b] e f(a)·f(b) < 0, existe pelo menos um x₀ em [a, b] com f(x₀) = 0. É a base dos métodos intervalares (Bisseção e Falsa Posição).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-teorema1', 'A', 'f(a)·f(b) > 0', 0, 'Sinais iguais nos extremos não garantem raiz nenhuma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-teorema1', 'B', 'f derivável e f′(a) = 0', 0, 'O teorema usa o sinal de f nos extremos, não a derivada.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-teorema1', 'C', 'f crescente em [a, b]', 0, 'Crescer não basta: f(x) = x + 5 cresce em [0, 1] e não tem raiz ali.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-teorema1', 'D', 'f contínua em [a, b] e f(a)·f(b) < 0', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-bis-formula', 'slides', '', 'Cap. 3 — Raízes de Equações', 'bissecao', 1, 'texto', 1, NULL, 'Na Bisseção, como a professora calcula a aproximação xᵢ a cada iteração?', NULL, 'xᵢ = (aᵢ + bᵢ)/2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"O valor médio do intervalo: xᵢ = (aᵢ + bᵢ)/2. Depois verifica o sinal de f(xᵢ) para escolher os novos extremos."}', 'O valor médio do intervalo: xᵢ = (aᵢ + bᵢ)/2. Depois verifica o sinal de f(xᵢ) para escolher os novos extremos.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-formula', 'A', 'xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ))', 0, 'Essa é a média ponderada da Falsa Posição.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-formula', 'B', 'xᵢ = (aᵢ + bᵢ)/2', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-formula', 'C', 'xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ)', 0, 'Essa é a fórmula do Newton-Raphson.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-formula', 'D', 'xᵢ = √(aᵢ·bᵢ)', 0, 'A Bisseção usa a média aritmética, não a geométrica.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-bis-k', 'slides', '', 'Cap. 3 — Raízes de Equações', 'bissecao', 1, 'numero', 1, NULL, 'Pela fórmula dos slides, k > (log(b₀ − a₀) − log ε)/log 2. Quantas iterações da Bisseção são necessárias em [0, 1] com ε = 10⁻²?', NULL, '7', 7, NULL, NULL, NULL, NULL, 0, 0.1, '{"calc":"iteracoesBissecao","a":0,"b":1,"eps":0.01}', 'k > (log(1) − log(0,01))/log 2 = 6,6439, então k = 7.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-k', 'A', '6', 0, 'k precisa ser o primeiro inteiro maior que (log(b₀ − a₀) − log ε)/log 2: arredondar para baixo deixa b − a ainda maior que ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-k', 'B', '8', 0, 'Uma a mais do que o necessário: k é o primeiro inteiro acima do limite.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-k', 'C', '10', 0, 'Confira a conta: k > (log(b₀ − a₀) − log ε)/log 2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-k', 'D', '7', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-bis-x1', 'slides', '', 'Cap. 3 — Raízes de Equações', 'bissecao', 1, 'numero', 1, NULL, 'Exemplo 05 dos slides: f(x) = x³ − 9x + 3 em [0, 1]. Qual é x₁ da Bisseção?', NULL, '0,50', 0.5, NULL, NULL, NULL, NULL, 2, NULL, '{"calc":"bissecao","f":"x^3-9x+3","a":0,"b":1,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | 3,000000 | −5,000000 | −1,375000 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-x1', 'A', '0,38', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-x1', 'B', '0,47', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-x1', 'C', '0,50', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-x1', 'D', '0,25', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-bis-novo', 'slides', '', 'Cap. 3 — Raízes de Equações', 'bissecao', 1, 'texto', 1, NULL, 'Exemplo 05: f(x) = x³ − 9x + 3 em [0, 1]. Com x₁ = 0,5 e f(0,5) = −1,375 < 0, quais são os novos extremos?', NULL, 'a₂ = 0 e b₂ = 0,5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"f(0) = 3 > 0 e f(0,5) < 0: a troca de sinal está em [0; 0,5]. Então a₂ = 0 e b₂ = x₁ = 0,5."}', 'f(0) = 3 > 0 e f(0,5) < 0: a troca de sinal está em [0; 0,5]. Então a₂ = 0 e b₂ = x₁ = 0,5.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-novo', 'A', 'a₂ = 0,5 e b₂ = 1', 0, 'f(0,5) e f(1) são ambos negativos: ali não há troca de sinal.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-novo', 'B', 'a₂ = 0 e b₂ = 0,5', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-novo', 'C', 'a₂ = 0,25 e b₂ = 0,75', 0, 'Os novos extremos são um extremo antigo e o próprio x₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-bis-novo', 'D', 'a₂ = 0 e b₂ = 1', 0, 'O intervalo precisa diminuir a cada iteração.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-fp-formula', 'slides', '', 'Cap. 3 — Raízes de Equações', 'falsa-posicao', 1, 'texto', 1, NULL, 'Na Falsa Posição, o intervalo é dividido por qual ponto?', NULL, 'xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ))', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Uma média aritmética ponderada que leva em conta o valor da função nos extremos: é onde a reta entre (a, f(a)) e (b, f(b)) corta o eixo x. O resto do algoritmo é igual ao da Bisseção."}', 'Uma média aritmética ponderada que leva em conta o valor da função nos extremos: é onde a reta entre (a, f(a)) e (b, f(b)) corta o eixo x. O resto do algoritmo é igual ao da Bisseção.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-formula', 'A', 'xᵢ₊₁ = g(xᵢ)', 0, 'Essa é a iteração de ponto fixo.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-formula', 'B', 'xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ))', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-formula', 'C', 'xᵢ = (aᵢ·f(aᵢ) + bᵢ·f(bᵢ)) / (f(aᵢ) + f(bᵢ))', 0, 'Os pesos estão trocados e os sinais errados.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-formula', 'D', 'xᵢ = (aᵢ + bᵢ)/2', 0, 'Esse é o valor médio da Bisseção.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-fp-x1', 'slides', '', 'Cap. 3 — Raízes de Equações', 'falsa-posicao', 1, 'numero', 1, NULL, 'Exemplo 06 dos slides: f(x) = x³ − 9x + 3 em [0, 1]. Qual é x₁ da Falsa Posição?', NULL, '0,375', 0.375, NULL, NULL, NULL, NULL, 3, NULL, '{"calc":"falsaPosicao","f":"x^3-9x+3","a":0,"b":1,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 0,375000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,375000 | 3,000000 | −5,000000 | −0,322266 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-x1', 'A', '0,500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-x1', 'B', '0,339', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-x1', 'C', '0,390', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-x1', 'D', '0,375', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-fp-vs-bis', 'slides', '', 'Cap. 3 — Raízes de Equações', 'falsa-posicao', 1, 'texto', 1, NULL, 'No mesmo problema (x³ − 9x + 3 em [0, 1], ε = 10⁻²), o que os slides concluem ao comparar Bisseção e Falsa Posição?', NULL, 'A Falsa Posição converge mais rápido (4 iterações contra 9)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"A Bisseção precisou de 9 iterações e a Falsa Posição chegou a x₄ = 0,33761 em 4. A Bisseção tem convergência linear (p = 1)."}', 'A Bisseção precisou de 9 iterações e a Falsa Posição chegou a x₄ = 0,33761 em 4. A Bisseção tem convergência linear (p = 1).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-vs-bis', 'A', 'A Falsa Posição converge mais rápido (4 iterações contra 9)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-vs-bis', 'B', 'As duas levam o mesmo número de iterações', 0, 'A Falsa Posição usa os valores de f e chega antes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-vs-bis', 'C', 'A Falsa Posição diverge nesse exemplo', 0, 'Ela é intervalar: com f(a)·f(b) < 0 a raiz fica sempre cercada.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-fp-vs-bis', 'D', 'A Bisseção converge mais rápido', 0, 'No exemplo dos slides a Bisseção levou 9 iterações.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-ea', 'slides', '', 'Cap. 3 — Raízes de Equações', 'newton', 1, 'texto', 1, NULL, 'Qual é o erro relativo aproximado usado como critério de parada nos slides?', NULL, 'εₐ = |(x_novo − x_velho)/x_novo| × 100%', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Compara a aproximação nova com a anterior, relativa à nova: εₐ = |(xᵢ₊₁ − xᵢ)/xᵢ₊₁| × 100%. Para quando εₐ < ε (ou quando atinge o número máximo de iterações)."}', 'Compara a aproximação nova com a anterior, relativa à nova: εₐ = |(xᵢ₊₁ − xᵢ)/xᵢ₊₁| × 100%. Para quando εₐ < ε (ou quando atinge o número máximo de iterações).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ea', 'A', 'εₐ = |(x_novo − x_velho)/x_velho| × 100%', 0, 'O denominador é a aproximação nova (a melhor que temos).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ea', 'B', 'εₐ = |f(x_novo)|', 0, 'Esse é o resíduo; o estimador dos slides compara duas aproximações.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ea', 'C', 'εₐ = |(x_novo − x_velho)/x_novo| × 100%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ea', 'D', 'εₐ = |x_novo − x_velho| × 100%', 0, 'Esse é o erro absoluto (em %), sem dividir pela aproximação.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-nr-formula', 'slides', '', 'Cap. 3 — Raízes de Equações', 'newton', 1, 'texto', 1, NULL, 'Qual é a fórmula do Newton-Raphson, obtida prolongando a tangente em xᵢ até o eixo x?', NULL, 'xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Da reta tangente: f′(xᵢ) = (f(xᵢ) − 0)/(xᵢ − xᵢ₊₁). Reorganizando: xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ)."}', 'Da reta tangente: f′(xᵢ) = (f(xᵢ) − 0)/(xᵢ − xᵢ₊₁). Reorganizando: xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-formula', 'A', 'xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-formula', 'B', 'xᵢ₊₁ = xᵢ − f′(xᵢ)/f(xᵢ)', 0, 'A fração está invertida.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-formula', 'C', 'xᵢ₊₁ = xᵢ + f(xᵢ)/f′(xᵢ)', 0, 'O sinal é de menos: andamos contra a inclinação para chegar ao zero.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-formula', 'D', 'xᵢ₊₁ = xᵢ − f(xᵢ)(xᵢ − xᵢ₋₁)/(f(xᵢ) − f(xᵢ₋₁))', 0, 'Essa é a Secante, que troca f′ por uma diferença finita.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-nr-x1', 'slides', '', 'Cap. 3 — Raízes de Equações', 'newton', 1, 'numero', 1, NULL, 'Exemplo 5 dos slides: f(x) = e⁻ˣ − x com x₀ = 0. Qual é x₁ pelo Newton-Raphson?', NULL, '0,50', 0.5, NULL, NULL, NULL, NULL, 2, NULL, '{"calc":"newton","f":"exp(-x)-x","df":"-exp(-x)-1","x0":0,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 0,500000. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,000000 | 1,000000 | −2,000000 | 0,500000 | 1,000000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-x1', 'A', '0,53', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-x1', 'B', '0,57', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-x1', 'C', '−0,50', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-x1', 'D', '0,50', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-nr-desv', 'slides', '', 'Cap. 3 — Raízes de Equações', 'newton', 1, 'texto', 1, NULL, 'Qual destas situações está entre as desvantagens do Newton-Raphson mostradas nos slides?', NULL, 'f′(xᵢ) = 0 ou perto de zero: a tangente fica horizontal e o passo explode', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Os slides mostram casos de convergência muito lenta, de oscilação em torno de um mínimo local e o \"desastre\" quando f′(xᵣ) = 0: a tangente horizontal nunca corta o eixo x."}', 'Os slides mostram casos de convergência muito lenta, de oscilação em torno de um mínimo local e o "desastre" quando f′(xᵣ) = 0: a tangente horizontal nunca corta o eixo x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-desv', 'A', 'Precisa de duas aproximações iniciais', 0, 'Quem precisa de duas é a Secante.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-desv', 'B', 'Tem convergência linear', 0, 'Newton tem convergência quadrática (p = 2).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-desv', 'C', 'f′(xᵢ) = 0 ou perto de zero: a tangente fica horizontal e o passo explode', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-nr-desv', 'D', 'Precisa que f(a)·f(b) < 0', 0, 'Essa exigência é dos métodos intervalares.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-sec-ordem', 'slides', '', 'Cap. 3 — Raízes de Equações', 'secante', 1, 'texto', 1, NULL, 'Qual é a ordem de convergência da Secante, segundo os slides?', NULL, 'p = 1,618', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"A Secante tem p = 1,618: maior que a dos métodos de convergência linear (p = 1) e menor que a do Newton-Raphson (p = 2)."}', 'A Secante tem p = 1,618: maior que a dos métodos de convergência linear (p = 1) e menor que a do Newton-Raphson (p = 2).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-ordem', 'A', 'p = 3', 0, 'Nenhum dos métodos do capítulo chega a p = 3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-ordem', 'B', 'p = 2', 0, 'p = 2 é a do Newton-Raphson.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-ordem', 'C', 'p = 1,618', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-ordem', 'D', 'p = 1', 0, 'p = 1 é a convergência linear (como a da Bisseção).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-sec-x2', 'slides', '', 'Cap. 3 — Raízes de Equações', 'secante', 1, 'numero', 1, NULL, 'Exemplo 7 dos slides: f(x) = e⁻ˣ − x com x₀ = 0 e x₁ = 1. Qual é x₂ pela Secante?', NULL, '0,6127', 0.61269983678, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"secante","f":"exp(-x)-x","x0":0,"x1":1,"iteracoes":1}', 'Secante: 1 iteração; x = 0,612700. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,000000 | 1,000000 | 1,000000 | −0,632121 | 0,612700 | 0,632121', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-x2', 'A', '0,6678', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-x2', 'B', '0,6127', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-x2', 'C', '0,5882', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-x2', 'D', '0,5638', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-sec-vs-fp', 'slides', '', 'Cap. 3 — Raízes de Equações', 'secante', 1, 'texto', 1, NULL, 'Qual a diferença entre a Secante e a Falsa Posição?', NULL, 'A Secante usa sempre os dois últimos pontos, sem exigir troca de sinal; a Falsa Posição mantém a raiz cercada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"As duas usam a reta entre dois pontos, mas a Falsa Posição é intervalar (guarda o par com f(a)·f(b) < 0) e a Secante é aberta: usa xᵢ₋₁ e xᵢ, mesmo que tenham o mesmo sinal."}', 'As duas usam a reta entre dois pontos, mas a Falsa Posição é intervalar (guarda o par com f(a)·f(b) < 0) e a Secante é aberta: usa xᵢ₋₁ e xᵢ, mesmo que tenham o mesmo sinal.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-vs-fp', 'A', 'São o mesmo método com nomes diferentes', 0, 'A escolha dos pontos muda: uma é intervalar, a outra é aberta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-vs-fp', 'B', 'A Falsa Posição usa o ponto médio', 0, 'O ponto médio é da Bisseção.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-vs-fp', 'C', 'A Secante usa a derivada exata', 0, 'A Secante troca a derivada por uma diferença finita.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-sec-vs-fp', 'D', 'A Secante usa sempre os dois últimos pontos, sem exigir troca de sinal; a Falsa Posição mantém a raiz cercada', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-op-elem', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 1, 'texto', 1, NULL, 'Qual destas NÃO é uma das operações elementares do teorema dos slides (que não mudam a solução de AX = B)?', NULL, 'Multiplicar uma equação por zero', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"As operações são: multiplicar Eᵢ por λ ≠ 0; somar a Eᵢ um múltiplo λ de Eⱼ; trocar Eᵢ e Eⱼ de posição. Multiplicar por zero apaga a equação e muda o sistema."}', 'As operações são: multiplicar Eᵢ por λ ≠ 0; somar a Eᵢ um múltiplo λ de Eⱼ; trocar Eᵢ e Eⱼ de posição. Multiplicar por zero apaga a equação e muda o sistema.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-op-elem', 'A', 'Trocar Eᵢ e Eⱼ de posição', 0, 'Essa é a 3ª operação elementar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-op-elem', 'B', 'Multiplicar Eᵢ por λ ≠ 0', 0, 'Essa é a 1ª operação elementar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-op-elem', 'C', 'Multiplicar uma equação por zero', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-op-elem', 'D', 'Somar a Eᵢ o múltiplo λ·Eⱼ', 0, 'Essa é a 2ª operação elementar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-pivo', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 1, 'texto', 1, NULL, 'Para a professora, o que é o pivô na Eliminação de Gauss?', NULL, 'O primeiro elemento não nulo de cada equação (linha)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Pivô é o primeiro elemento não nulo de cada equação; a linha que o contém é a equação pivô. O objetivo da eliminação é zerar os coeficientes abaixo de cada pivô."}', 'Pivô é o primeiro elemento não nulo de cada equação; a linha que o contém é a equação pivô. O objetivo da eliminação é zerar os coeficientes abaixo de cada pivô.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivo', 'A', 'O termo independente bᵢ', 0, 'O pivô está na matriz dos coeficientes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivo', 'B', 'O maior elemento da matriz', 0, 'O maior |aᵢₖ| da coluna é o critério do pivoteamento parcial, não a definição de pivô.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivo', 'C', 'O determinante de A', 0, 'O determinante é o produto dos pivôs, mas não é o pivô.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivo', 'D', 'O primeiro elemento não nulo de cada equação (linha)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-m31', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 1, 'numero', 1, NULL, 'Exemplo 1 dos slides: A = [3 2 4; 1 1 2; 4 3 −2]. Na Etapa 1, qual é o multiplicador m₃₁?', NULL, '1,3333', 1.33333333333, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"gauss-multiplicador","A":[[3,2,4],[1,1,2],[4,3,-2]],"i":3,"k":1}', 'm₃₁ = a₃₁/a₁₁ = 4/3 = 1,3333.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-m31', 'A', '−1,3333', 0, 'Sinal trocado: mᵢₖ = aᵢₖ/aₖₖ, e a operação é Eᵢ − mᵢₖEₖ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-m31', 'B', '0,7500', 0, 'Fração invertida: mᵢₖ = aᵢₖ/aₖₖ (o pivô fica no denominador).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-m31', 'C', '1,3867', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-m31', 'D', '1,3333', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-ex1', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 2, 'vetor', 0, NULL, 'Exemplo 1 dos slides: 3x₁ + 2x₂ + 4x₃ = 1; x₁ + x₂ + 2x₃ = 2; 4x₁ + 3x₂ − 2x₃ = 3. Qual é a solução pela Eliminação de Gauss?', NULL, '(−3,00; 5,00; 0,00)', NULL, NULL, '[-3,5,0]', NULL, NULL, 2, NULL, '{"calc":"gauss","A":[[3,2,4],[1,1,2],[4,3,-2]],"b":[1,2,3]}', 'Solução: X* = (−3; 5; 0). −8x₃ = 0 ⇒ x₃ = 0; (1/3)x₂ + (2/3)·0 = 5/3 ⇒ x₂ = 5; 3x₁ + 2·5 + 4·0 = 1 ⇒ x₁ = −3', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ex1', 'A', '(−3,36; 5,00; 0,00)', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ex1', 'B', '(5,00; −3,00; 0,00)', 0, 'Componentes trocadas de posição.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ex1', 'C', '(−3,00; 5,00; 0,00)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-ex1', 'D', '(−2,70; 4,50; −0,05)', 0, 'Não confere: refaça a conta passo a passo.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-regressiva', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 1, 'texto', 1, NULL, 'Depois da eliminação, por qual equação começa a substituição regressiva?', NULL, 'Pela última: xₙ = bₙ⁽ⁿ⁻¹⁾/aₙₙ⁽ⁿ⁻¹⁾', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"O sistema ficou triangular superior. A última equação tem só xₙ; o valor é substituído na (n − 1)-ésima para achar xₙ₋₁, e assim por diante."}', 'O sistema ficou triangular superior. A última equação tem só xₙ; o valor é substituído na (n − 1)-ésima para achar xₙ₋₁, e assim por diante.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-regressiva', 'A', 'Pela última: xₙ = bₙ⁽ⁿ⁻¹⁾/aₙₙ⁽ⁿ⁻¹⁾', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-regressiva', 'B', 'Por qualquer uma, a ordem não importa', 0, 'Só a última tem uma incógnita sozinha.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-regressiva', 'C', 'Pela equação com o maior pivô', 0, 'A ordem é fixa: de baixo para cima.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-regressiva', 'D', 'Pela primeira: x₁ = b₁/a₁₁', 0, 'Na primeira equação ainda aparecem todas as incógnitas.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-pivoteamento', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'pivoteamento', 1, 'texto', 1, NULL, 'Por que usar o pivoteamento parcial?', NULL, 'Pivôs próximos de zero geram multiplicadores grandes, que ampliam os erros de arredondamento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Escolhendo como pivô o maior |aᵢₖ| da coluna, todos os multiplicadores ficam com |mᵢₖ| ≤ 1 e os erros de arredondamento não são ampliados."}', 'Escolhendo como pivô o maior |aᵢₖ| da coluna, todos os multiplicadores ficam com |mᵢₖ| ≤ 1 e os erros de arredondamento não são ampliados.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivoteamento', 'A', 'Para dispensar a substituição regressiva', 0, 'A substituição regressiva continua necessária.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivoteamento', 'B', 'Para deixar a matriz simétrica', 0, 'A troca de linhas não torna a matriz simétrica.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivoteamento', 'C', 'Para a matriz ficar diagonal', 0, 'A eliminação continua produzindo uma triangular superior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-pivoteamento', 'D', 'Pivôs próximos de zero geram multiplicadores grandes, que ampliam os erros de arredondamento', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('sl-singular', 'slides', '', 'Cap. 2 — Sistemas de Equações: Métodos Diretos', 'gauss', 1, 'texto', 1, NULL, 'Nos slides, sistemas singulares aparecem graficamente como retas paralelas ou coincidentes. O que cada caso significa?', NULL, 'Paralelas: nenhuma solução; coincidentes: infinitas soluções', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Duas retas paralelas nunca se cruzam (sistema sem solução); retas coincidentes se cruzam em todos os pontos (infinitas soluções). Retas quase paralelas formam um sistema mal condicionado."}', 'Duas retas paralelas nunca se cruzam (sistema sem solução); retas coincidentes se cruzam em todos os pontos (infinitas soluções). Retas quase paralelas formam um sistema mal condicionado.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-singular', 'A', 'As duas têm solução única', 0, 'Solução única é quando as retas se cruzam em um ponto só.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-singular', 'B', 'Paralelas: nenhuma solução; coincidentes: infinitas soluções', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-singular', 'C', 'Paralelas: sistema mal condicionado', 0, 'Mal condicionado é quando as inclinações são muito próximas, mas não iguais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('sl-singular', 'D', 'Paralelas: infinitas soluções; coincidentes: nenhuma', 0, 'Está trocado.');

-- ======================================================================
-- 4ª Lista de Cálculo Numérico (Ibmec — Profa. Danielle Teixeira)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-01', 'ibmec-04', '1', '4ª Lista de Cálculo Numérico', 'bissecao', 2, 'numero', 0, NULL, 'Utilizando o método da Bisseção, determine o zero da função f(x) = eˣ − 3x, onde [a, b] = [1, 2]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere o número máximo de iterações N = 20 e ε = 10⁻⁵.', NULL, '1,5121', 1.5121383667, NULL, NULL, NULL, NULL, 4, 0.0001, '{"calc":"bissecao","f":"exp(x)-3x","a":1,"b":2,"eps":0.00001,"K":20,"criterio":"largura"}', 'Bisseção: 17 iterações; x = 1,512138. b − a = 7,629×10⁻⁶ < ε = 1,000×10⁻⁵ na 17ª iteração.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01', 'A', '1,5121', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01', 'B', '1,7500', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01', 'C', '1,6250', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01', 'D', '1,5726', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-01-r', 'ibmec-04', '1 · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-01', 'Bisseção, 1º passo: f(x) = eˣ − 3x em [1; 2]. Qual é x₁?', NULL, '1,5000', 1.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"exp(x)-3x","a":1,"b":2,"iteracoes":1}', 'Bisseção: 1 iteração; x = 1,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,500000 | −0,281718 | 1,389056 | −0,018311 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01-r', 'A', '1,1686', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01-r', 'B', '1,4400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01-r', 'C', '1,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-01-r', 'D', '1,7500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02a', 'ibmec-04', '2 (a)', '4ª Lista de Cálculo Numérico', 'bissecao', 2, 'numero', 0, NULL, 'Use o método da Bisseção para obter a menor raiz positiva de x/2 − tg x = 0 com precisão ε = 10⁻⁴, no intervalo [4; 4,5]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 20.', NULL, '4,2748', 4.27484130859, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"bissecao","f":"x/2-tan(x)","a":4,"b":4.5,"eps":0.0001,"K":20,"criterio":"largura"}', 'Bisseção: 13 iterações; x = 4,274841. b − a = 6,104×10⁻⁵ < ε = 0,0001 na 13ª iteração.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,000000 | 4,500000 | 4,250000 | 0,842179 | −2,387332 | 0,118691 | —
2 | 4,250000 | 4,500000 | 4,375000 | 0,118691 | −2,387332 | −0,663112 | 0,028571
3 | 4,250000 | 4,375000 | 4,312500 | 0,118691 | −0,663112 | −0,209705 | 0,014493
4 | 4,250000 | 4,312500 | 4,281250 | 0,118691 | −0,209705 | −0,033287 | 0,00729927
5 | 4,250000 | 4,281250 | 4,265625 | 0,118691 | −0,033287 | 0,045436 | 0,003663
6 | 4,265625 | 4,281250 | 4,273438 | 0,045436 | −0,033287 | 0,006794 | 0,00182815
7 | 4,273438 | 4,281250 | 4,277344 | 0,006794 | −0,033287 | −0,013061 | 0,000913242
8 | 4,273438 | 4,277344 | 4,275391 | 0,006794 | −0,013061 | −0,003088 | 0,00045683
9 | 4,273438 | 4,275391 | 4,274414 | 0,006794 | −0,003088 | 0,001865 | 0,000228467
10 | 4,274414 | 4,275391 | 4,274902 | 0,001865 | −0,003088 | −0,000609 | 0,00011422
11 | 4,274414 | 4,274902 | 4,274658 | 0,001865 | −0,000609 | 0,000629 | 5,711×10⁻⁵
12 | 4,274658 | 4,274902 | 4,274780 | 0,000629 | −0,000609 | 0,000010 | 2,856×10⁻⁵
13 | 4,274780 | 4,274902 | 4,274841 | 0,000010 | −0,000609 | −0,000299 | 1,428×10⁻⁵', 'A lista não fixa o intervalo; usamos o primeiro intervalo com troca de sinal que contém a menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a', 'A', '4,3125', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a', 'B', '4,1038', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a', 'C', '4,2748', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a', 'D', '4,3750', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02a-r', 'ibmec-04', '2 (a) · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-02a', 'Bisseção, 1º passo: f(x) = x/2 − tg x em [4; 4,5]. Qual é x₁?', NULL, '4,2500', 4.25, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"x/2-tan(x)","a":4,"b":4.5,"iteracoes":1}', 'Bisseção: 1 iteração; x = 4,250000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,000000 | 4,500000 | 4,250000 | 0,842179 | −2,387332 | 0,118691 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a-r', 'A', '4,2500', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a-r', 'B', '4,1304', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a-r', 'C', '4,0800', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02a-r', 'D', '4,3750', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02b', 'ibmec-04', '2 (b)', '4ª Lista de Cálculo Numérico', 'bissecao', 2, 'numero', 0, NULL, 'Use o método da Bisseção para obter a menor raiz positiva de 2cos x = eˣ/2 com precisão ε = 10⁻⁴, no intervalo [0, 1]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 20.', NULL, '0,9048', 0.904846191406, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"bissecao","f":"2cos(x)-exp(x)/2","a":0,"b":1,"eps":0.0001,"K":20,"criterio":"largura"}', 'Bisseção: 14 iterações; x = 0,904846. b − a = 6,104×10⁻⁵ < ε = 0,0001 na 14ª iteração.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | 1,500000 | −0,278536 | 0,930804 | —
2 | 0,500000 | 1,000000 | 0,750000 | 0,930804 | −0,278536 | 0,404878 | 0,333333
3 | 0,750000 | 1,000000 | 0,875000 | 0,404878 | −0,278536 | 0,082556 | 0,142857
4 | 0,875000 | 1,000000 | 0,937500 | 0,082556 | −0,278536 | −0,093185 | 0,066667
5 | 0,875000 | 0,937500 | 0,906250 | 0,082556 | −0,093185 | −0,004108 | 0,034483
6 | 0,875000 | 0,906250 | 0,890625 | 0,082556 | −0,004108 | 0,039526 | 0,017544
7 | 0,890625 | 0,906250 | 0,898438 | 0,039526 | −0,004108 | 0,017785 | 0,00869565
8 | 0,898438 | 0,906250 | 0,902344 | 0,017785 | −0,004108 | 0,006857 | 0,004329
9 | 0,902344 | 0,906250 | 0,904297 | 0,006857 | −0,004108 | 0,001380 | 0,00215983
10 | 0,904297 | 0,906250 | 0,905273 | 0,001380 | −0,004108 | −0,001363 | 0,00107875
11 | 0,904297 | 0,905273 | 0,904785 | 0,001380 | −0,001363 | 0,000009 | 0,000539665
12 | 0,904785 | 0,905273 | 0,905029 | 0,000009 | −0,001363 | −0,000677 | 0,00026976
13 | 0,904785 | 0,905029 | 0,904907 | 0,000009 | −0,000677 | −0,000334 | 0,000134898
14 | 0,904785 | 0,904907 | 0,904846 | 0,000009 | −0,000334 | −0,000163 | 6,745×10⁻⁵', 'A lista não fixa o intervalo; usamos o primeiro intervalo com troca de sinal que contém a menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b', 'A', '0,8687', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b', 'B', '0,8750', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b', 'C', '0,9048', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b', 'D', '0,7500', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02b-r', 'ibmec-04', '2 (b) · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-02b', 'Bisseção, 1º passo: f(x) = 2cos x − eˣ/2 em [0; 1]. Qual é x₁?', NULL, '0,5000', 0.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"2cos(x)-exp(x)/2","a":0,"b":1,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | 1,500000 | −0,278536 | 0,930804 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b-r', 'A', '0,7500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b-r', 'B', '0,4800', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b-r', 'C', '0,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02b-r', 'D', '0,8434', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02c', 'ibmec-04', '2 (c)', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 0, NULL, 'Use o método da Bisseção para obter a menor raiz positiva de x⁵ − 6 = 0 com precisão ε = 10⁻⁴, no intervalo [1, 2]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 20.', NULL, '1,4310', 1.43096923828, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"bissecao","f":"x^5-6","a":1,"b":2,"eps":0.0001,"K":20,"criterio":"largura"}', 'Bisseção: 14 iterações; x = 1,430969. b − a = 6,104×10⁻⁵ < ε = 0,0001 na 14ª iteração.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,500000 | −5,000000 | 26,000000 | 1,593750 | —
2 | 1,000000 | 1,500000 | 1,250000 | −5,000000 | 1,593750 | −2,948242 | 0,200000
3 | 1,250000 | 1,500000 | 1,375000 | −2,948242 | 1,593750 | −1,085114 | 0,090909
4 | 1,375000 | 1,500000 | 1,437500 | −1,085114 | 1,593750 | 0,138175 | 0,043478
5 | 1,375000 | 1,437500 | 1,406250 | −1,085114 | 0,138175 | −0,500633 | 0,022222
6 | 1,406250 | 1,437500 | 1,421875 | −0,500633 | 0,138175 | −0,188248 | 0,010989
7 | 1,421875 | 1,437500 | 1,429688 | −0,188248 | 0,138175 | −0,026820 | 0,00546448
8 | 1,429688 | 1,437500 | 1,433594 | −0,026820 | 0,138175 | 0,055228 | 0,0027248
9 | 1,429688 | 1,433594 | 1,431641 | −0,026820 | 0,055228 | 0,014092 | 0,00136426
10 | 1,429688 | 1,431641 | 1,430664 | −0,026820 | 0,014092 | −0,006392 | 0,000682594
11 | 1,430664 | 1,431641 | 1,431152 | −0,006392 | 0,014092 | 0,003843 | 0,00034118
12 | 1,430664 | 1,431152 | 1,430908 | −0,006392 | 0,003843 | −0,001276 | 0,000170619
13 | 1,430908 | 1,431152 | 1,431030 | −0,001276 | 0,003843 | 0,001283 | 8,530×10⁻⁵
14 | 1,430908 | 1,431030 | 1,430969 | −0,001276 | 0,001283 | 0,000003 | 4,265×10⁻⁵', 'A lista não fixa o intervalo; usamos o primeiro intervalo com troca de sinal que contém a menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c', 'A', '1,3750', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c', 'B', '1,4310', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c', 'C', '1,3737', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c', 'D', '1,2500', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-02c-r', 'ibmec-04', '2 (c) · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-02c', 'Bisseção, 1º passo: f(x) = x⁵ − 6 em [1; 2]. Qual é x₁?', NULL, '1,5000', 1.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"x^5-6","a":1,"b":2,"iteracoes":1}', 'Bisseção: 1 iteração; x = 1,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,500000 | −5,000000 | 26,000000 | 1,593750 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c-r', 'A', '1,5600', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c-r', 'B', '1,2500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c-r', 'C', '1,1613', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-02c-r', 'D', '1,5000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-03', 'ibmec-04', '3', '4ª Lista de Cálculo Numérico', 'bissecao', 2, 'numero', 0, NULL, 'Utilizando o método da Bisseção, determine o zero da função f(x) = x·log x − 1, onde [a, b] = [2, 3]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 15 e ε = 5×10⁻⁴.', NULL, '2,5063', 2.50634765625, NULL, NULL, NULL, NULL, 4, 0.005, '{"calc":"bissecao","f":"x*log(x)-1","a":2,"b":3,"eps":0.0005,"K":15,"criterio":"largura"}', 'Bisseção: 11 iterações; x = 2,506348. b − a = 0,000488281 < ε = 0,0005 na 11ª iteração.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 2,000000 | 3,000000 | 2,500000 | −0,397940 | 0,431364 | −0,005150 | —
2 | 2,500000 | 3,000000 | 2,750000 | −0,005150 | 0,431364 | 0,208165 | 0,090909
3 | 2,500000 | 2,750000 | 2,625000 | −0,005150 | 0,208165 | 0,100214 | 0,047619
4 | 2,500000 | 2,625000 | 2,562500 | −0,005150 | 0,100214 | 0,047201 | 0,024390
5 | 2,500000 | 2,562500 | 2,531250 | −0,005150 | 0,047201 | 0,020942 | 0,012346
6 | 2,500000 | 2,531250 | 2,515625 | −0,005150 | 0,020942 | 0,007875 | 0,00621118
7 | 2,500000 | 2,515625 | 2,507813 | −0,005150 | 0,007875 | 0,001357 | 0,00311526
8 | 2,500000 | 2,507813 | 2,503906 | −0,005150 | 0,001357 | −0,001898 | 0,00156006
9 | 2,503906 | 2,507813 | 2,505859 | −0,001898 | 0,001357 | −0,000271 | 0,000779423
10 | 2,505859 | 2,507813 | 2,506836 | −0,000271 | 0,001357 | 0,000543 | 0,00038956
11 | 2,505859 | 2,506836 | 2,506348 | −0,000271 | 0,000543 | 0,000136 | 0,000194818', 'Aqui log é o logaritmo na base 10 (com ln a raiz ficaria fora de [2, 3]).', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03', 'A', '2,4061', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03', 'B', '2,5063', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03', 'C', '2,7500', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03', 'D', '2,6250', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-03-r', 'ibmec-04', '3 · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-03', 'Bisseção, 1º passo: f(x) = x·log x − 1 em [2; 3]. Qual é x₁?', NULL, '2,5000', 2.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"x*log(x)-1","a":2,"b":3,"iteracoes":1}', 'Bisseção: 1 iteração; x = 2,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 2,000000 | 3,000000 | 2,500000 | −0,397940 | 0,431364 | −0,005150 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03-r', 'A', '2,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03-r', 'B', '2,7500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03-r', 'C', '2,4798', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-03-r', 'D', '2,4000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-04', 'ibmec-04', '4', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 0, NULL, 'Utilizando o método da Bisseção, determine o zero da função f(x) = x³ − 9x + 3, onde [a, b] = [0, 1]. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 15 e ε = 10⁻³.', NULL, '0,3369', 0.3369140625, NULL, NULL, NULL, NULL, 4, 0.01, '{"calc":"bissecao","f":"x^3-9x+3","a":0,"b":1,"eps":0.001,"K":15,"criterio":"largura"}', 'Bisseção: 10 iterações; x = 0,336914. b − a = 0,000976563 < ε = 0,001 na 10ª iteração.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | 3,000000 | −5,000000 | −1,375000 | —
2 | 0,000000 | 0,500000 | 0,250000 | 3,000000 | −1,375000 | 0,765625 | 1,000000
3 | 0,250000 | 0,500000 | 0,375000 | 0,765625 | −1,375000 | −0,322266 | 0,333333
4 | 0,250000 | 0,375000 | 0,312500 | 0,765625 | −0,322266 | 0,218018 | 0,200000
5 | 0,312500 | 0,375000 | 0,343750 | 0,218018 | −0,322266 | −0,053131 | 0,090909
6 | 0,312500 | 0,343750 | 0,328125 | 0,218018 | −0,053131 | 0,082203 | 0,047619
7 | 0,328125 | 0,343750 | 0,335938 | 0,082203 | −0,053131 | 0,014474 | 0,023256
8 | 0,335938 | 0,343750 | 0,339844 | 0,014474 | −0,053131 | −0,019344 | 0,011494
9 | 0,335938 | 0,339844 | 0,337891 | 0,014474 | −0,019344 | −0,002439 | 0,00578035
10 | 0,335938 | 0,337891 | 0,336914 | 0,014474 | −0,002439 | 0,006017 | 0,00289855', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04', 'A', '0,3750', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04', 'B', '0,3369', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04', 'C', '0,2500', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04', 'D', '0,3504', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-04-r', 'ibmec-04', '4 · 1º passo', '4ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, 'ib4-04', 'Bisseção, 1º passo: f(x) = x³ − 9x + 3 em [0; 1]. Qual é x₁?', NULL, '0,5000', 0.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"x^3-9x+3","a":0,"b":1,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | 3,000000 | −5,000000 | −1,375000 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04-r', 'A', '0,3750', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04-r', 'B', '0,2500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04-r', 'C', '0,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-04-r', 'D', '0,5200', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05a', 'ibmec-04', '5 (1)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de f(x) = eˣ − 3x no intervalo [1; 2], com ε = 10⁻⁵ e N = 20 (é a 1ª questão refeita pela Falsa Posição).', NULL, '1,5121', 1.51212366484, NULL, NULL, NULL, NULL, 4, 0.0001, '{"calc":"falsaPosicao","f":"exp(x)-3x","a":1,"b":2,"eps":0.00001,"K":20,"criterio":"relativo"}', 'Falsa Posição: 15 iterações; x = 1,512124. Na 15ª iteração o erro estimado é menor que o critério de parada: 8,439×10⁻⁶ ≤ 1,000×10⁻⁵.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,168615 | −0,281718 | 1,389056 | −0,288312 | —
2 | 1,168615 | 2,000000 | 1,311517 | −0,288312 | 1,389056 | −0,222751 | 0,108959
3 | 1,311517 | 2,000000 | 1,406665 | −0,222751 | 1,389056 | −0,137677 | 0,067641
4 | 1,406665 | 2,000000 | 1,460170 | −0,137677 | 1,389056 | −0,073818 | 0,036643
5 | 1,460170 | 2,000000 | 1,487411 | −0,073818 | 1,389056 | −0,036611 | 0,018314
6 | 1,487411 | 2,000000 | 1,500574 | −0,036611 | 1,389056 | −0,017460 | 0,00877211
7 | 1,500574 | 2,000000 | 1,506773 | −0,017460 | 1,389056 | −0,008172 | 0,00411456
8 | 1,506773 | 2,000000 | 1,509658 | −0,008172 | 1,389056 | −0,003791 | 0,00191078
9 | 1,509658 | 2,000000 | 1,510993 | −0,003791 | 1,389056 | −0,001751 | 0,000883231
10 | 1,510993 | 2,000000 | 1,511608 | −0,001751 | 1,389056 | −0,000808 | 0,000407379
11 | 1,511608 | 2,000000 | 1,511892 | −0,000808 | 1,389056 | −0,000372 | 0,00018771
12 | 1,511892 | 2,000000 | 1,512023 | −0,000372 | 1,389056 | −0,000171 | 8,645×10⁻⁵
13 | 1,512023 | 2,000000 | 1,512083 | −0,000171 | 1,389056 | −0,000079 | 3,981×10⁻⁵
14 | 1,512083 | 2,000000 | 1,512111 | −0,000079 | 1,389056 | −0,000036 | 1,833×10⁻⁵
15 | 1,512111 | 2,000000 | 1,512124 | −0,000036 | 1,389056 | −0,000017 | 8,439×10⁻⁶', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a', 'A', '1,5121', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a', 'B', '1,5726', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a', 'C', '1,4067', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a', 'D', '1,3115', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05a-r', 'ibmec-04', '5 (1) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05a', 'Falsa Posição, 1º passo: f(x) = eˣ − 3x em [1; 2]. Qual é x₁?', NULL, '1,1686', 1.16861533992, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"exp(x)-3x","a":1,"b":2,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 1,168615. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,168615 | −0,281718 | 1,389056 | −0,288312 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a-r', 'A', '1,5000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a-r', 'B', '1,1686', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a-r', 'C', '1,3115', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05a-r', 'D', '1,2154', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05b', 'ibmec-04', '5 (2a)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de x/2 − tg x = 0 no intervalo [4; 4,5], com ε = 10⁻⁴ e N = 20 (é a 2ª (a) questão refeita pela Falsa Posição).', NULL, '4,2744', 4.27436437328, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"falsaPosicao","f":"x/2-tan(x)","a":4,"b":4.5,"eps":0.0001,"K":20,"criterio":"relativo"}', 'Falsa Posição: 10 iterações; x = 4,274364. Na 10ª iteração o erro estimado é menor que o critério de parada: 8,958×10⁻⁵ ≤ 0,0001.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,000000 | 4,500000 | 4,130388 | 0,842179 | −2,387332 | 0,545511 | —
2 | 4,130388 | 4,500000 | 4,199136 | 0,545511 | −2,387332 | 0,325377 | 0,016372
3 | 4,199136 | 4,500000 | 4,235223 | 0,325377 | −2,387332 | 0,183426 | 0,00852074
4 | 4,235223 | 4,500000 | 4,254115 | 0,183426 | −2,387332 | 0,099895 | 0,0044409
5 | 4,254115 | 4,500000 | 4,263991 | 0,099895 | −2,387332 | 0,053343 | 0,00231603
6 | 4,263991 | 4,500000 | 4,269149 | 0,053343 | −2,387332 | 0,028179 | 0,00120823
7 | 4,269149 | 4,500000 | 4,271842 | 0,028179 | −2,387332 | 0,014800 | 0,000630413
8 | 4,271842 | 4,500000 | 4,273248 | 0,014800 | −2,387332 | 0,007749 | 0,000328953
9 | 4,273248 | 4,500000 | 4,273981 | 0,007749 | −2,387332 | 0,004051 | 0,000171657
10 | 4,273981 | 4,500000 | 4,274364 | 0,004051 | −2,387332 | 0,002116 | 8,958×10⁻⁵', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b', 'A', '4,1991', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b', 'B', '4,2352', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b', 'C', '4,4453', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b', 'D', '4,2744', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05b-r', 'ibmec-04', '5 (2a) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05b', 'Falsa Posição, 1º passo: f(x) = x/2 − tg x em [4; 4,5]. Qual é x₁?', NULL, '4,1304', 4.13038797159, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"x/2-tan(x)","a":4,"b":4.5,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 4,130388. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,000000 | 4,500000 | 4,130388 | 0,842179 | −2,387332 | 0,545511 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b-r', 'A', '4,1304', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b-r', 'B', '3,9652', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b-r', 'C', '4,2500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05b-r', 'D', '4,1991', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05c', 'ibmec-04', '5 (2b)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de 2cos x = eˣ/2 no intervalo [0; 1], com ε = 10⁻⁴ e N = 20 (é a 2ª (b) questão refeita pela Falsa Posição).', NULL, '0,9048', 0.90478805515, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"falsaPosicao","f":"2cos(x)-exp(x)/2","a":0,"b":1,"eps":0.0001,"K":20,"criterio":"relativo"}', 'Falsa Posição: 5 iterações; x = 0,904788. Na 5ª iteração o erro estimado é menor que o critério de parada: 4,311×10⁻⁶ ≤ 0,0001.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,843390 | 1,500000 | −0,278536 | 0,167753 | —
2 | 0,843390 | 1,000000 | 0,902257 | 0,167753 | −0,278536 | 0,007100 | 0,065244
3 | 0,902257 | 1,000000 | 0,904687 | 0,007100 | −0,278536 | 0,000285 | 0,00268553
4 | 0,904687 | 1,000000 | 0,904784 | 0,000285 | −0,278536 | 0,000011 | 0,00010766
5 | 0,904784 | 1,000000 | 0,904788 | 0,000011 | −0,278536 | 0,000000 | 4,311×10⁻⁶', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c', 'A', '0,9063', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c', 'B', '0,9048', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c', 'C', '0,9023', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c', 'D', '0,9410', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05c-r', 'ibmec-04', '5 (2b) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05c', 'Falsa Posição, 1º passo: f(x) = 2cos x − eˣ/2 em [0; 1]. Qual é x₁?', NULL, '0,8434', 0.843390150596, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"2cos(x)-exp(x)/2","a":0,"b":1,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 0,843390. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,843390 | 1,500000 | −0,278536 | 0,167753 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c-r', 'A', '0,8771', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c-r', 'B', '0,5000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c-r', 'C', '0,9023', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05c-r', 'D', '0,8434', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05d', 'ibmec-04', '5 (2c)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de x⁵ − 6 = 0 no intervalo [1; 2], com ε = 10⁻⁴ e N = 20 (é a 2ª (c) questão refeita pela Falsa Posição).', NULL, '1,4309', 1.43085305184, NULL, NULL, NULL, NULL, 4, 0.001, '{"calc":"falsaPosicao","f":"x^5-6","a":1,"b":2,"eps":0.0001,"K":20,"criterio":"relativo"}', 'Falsa Posição: 14 iterações; x = 1,430853. Na 14ª iteração o erro estimado é menor que o critério de parada: 6,874×10⁻⁵ ≤ 0,0001.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,161290 | −5,000000 | 26,000000 | −3,887951 | —
2 | 1,161290 | 2,000000 | 1,270393 | −3,887951 | 26,000000 | −2,691045 | 0,085881
3 | 1,270393 | 2,000000 | 1,338826 | −2,691045 | 26,000000 | −1,698494 | 0,051114
4 | 1,338826 | 2,000000 | 1,379370 | −1,698494 | 26,000000 | −1,006520 | 0,029393
5 | 1,379370 | 2,000000 | 1,402500 | −1,006520 | 26,000000 | −0,573564 | 0,016492
6 | 1,402500 | 2,000000 | 1,415397 | −0,573564 | 26,000000 | −0,319444 | 0,00911153
7 | 1,415397 | 2,000000 | 1,422492 | −0,319444 | 26,000000 | −0,175625 | 0,00498804
8 | 1,422492 | 2,000000 | 1,426367 | −0,175625 | 26,000000 | −0,095866 | 0,00271654
9 | 1,426367 | 2,000000 | 1,428474 | −0,095866 | 26,000000 | −0,052123 | 0,00147521
10 | 1,428474 | 2,000000 | 1,429618 | −0,052123 | 26,000000 | −0,028279 | 0,000799839
11 | 1,429618 | 2,000000 | 1,430237 | −0,028279 | 26,000000 | −0,015325 | 0,00043329
12 | 1,430237 | 2,000000 | 1,430573 | −0,015325 | 26,000000 | −0,008300 | 0,000234613
13 | 1,430573 | 2,000000 | 1,430755 | −0,008300 | 26,000000 | −0,004493 | 0,000127003
14 | 1,430755 | 2,000000 | 1,430853 | −0,004493 | 26,000000 | −0,002432 | 6,874×10⁻⁵', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d', 'A', '1,3736', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d', 'B', '1,2704', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d', 'C', '1,3388', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d', 'D', '1,4309', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05d-r', 'ibmec-04', '5 (2c) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05d', 'Falsa Posição, 1º passo: f(x) = x⁵ − 6 em [1; 2]. Qual é x₁?', NULL, '1,1613', 1.16129032258, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"x^5-6","a":1,"b":2,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 1,161290. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 2,000000 | 1,161290 | −5,000000 | 26,000000 | −3,887951 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d-r', 'A', '1,1613', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d-r', 'B', '1,5000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d-r', 'C', '1,2704', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05d-r', 'D', '1,1148', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05e', 'ibmec-04', '5 (3)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de f(x) = x·log x − 1 no intervalo [2; 3], com ε = 5×10⁻⁴ e N = 15 (é a 3ª questão refeita pela Falsa Posição).', NULL, '2,5061', 2.50612795886, NULL, NULL, NULL, NULL, 4, 0.005, '{"calc":"falsaPosicao","f":"x*log(x)-1","a":2,"b":3,"eps":0.0005,"K":15,"criterio":"relativo"}', 'Falsa Posição: 3 iterações; x = 2,506128. Na 3ª iteração o erro estimado é menor que o critério de parada: 0,000464328 ≤ 0,0005.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 2,000000 | 3,000000 | 2,479848 | −0,397940 | 0,431364 | −0,021886 | —
2 | 2,479848 | 3,000000 | 2,504964 | −0,021886 | 0,431364 | −0,001016 | 0,010026
3 | 2,504964 | 3,000000 | 2,506128 | −0,001016 | 0,431364 | −0,000047 | 0,000464328', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e', 'A', '2,6250', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e', 'B', '2,4059', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e', 'C', '2,2806', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e', 'D', '2,5061', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05e-r', 'ibmec-04', '5 (3) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05e', 'Falsa Posição, 1º passo: f(x) = x·log x − 1 em [2; 3]. Qual é x₁?', NULL, '2,4798', 2.47984830373, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"x*log(x)-1","a":2,"b":3,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 2,479848. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 2,000000 | 3,000000 | 2,479848 | −0,397940 | 0,431364 | −0,021886 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e-r', 'A', '2,5000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e-r', 'B', '2,4798', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e-r', 'C', '2,5050', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05e-r', 'D', '2,5790', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05f', 'ibmec-04', '5 (4)', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 2, 'numero', 0, NULL, 'Use o método da Falsa Posição para determinar o zero de f(x) = x³ − 9x + 3 no intervalo [0; 1], com ε = 10⁻³ e N = 15 (é a 4ª questão refeita pela Falsa Posição).', NULL, '0,3376', 0.337609625287, NULL, NULL, NULL, NULL, 4, 0.01, '{"calc":"falsaPosicao","f":"x^3-9x+3","a":0,"b":1,"eps":0.001,"K":15,"criterio":"relativo"}', 'Falsa Posição: 4 iterações; x = 0,337610. Na 4ª iteração o erro estimado é menor que o critério de parada: 7,529×10⁻⁵ ≤ 0,001.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,375000 | 3,000000 | −5,000000 | −0,322266 | —
2 | 0,000000 | 0,375000 | 0,338624 | 3,000000 | −0,322266 | −0,008790 | 0,107422
3 | 0,000000 | 0,338624 | 0,337635 | 3,000000 | −0,008790 | −0,000226 | 0,00293007
4 | 0,000000 | 0,337635 | 0,337610 | 3,000000 | −0,000226 | −0,000006 | 7,529×10⁻⁵', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f', 'A', '0,3125', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f', 'B', '0,3511', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f', 'C', '0,3376', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f', 'D', '0,3680', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib4-05f-r', 'ibmec-04', '5 (4) · 1º passo', '4ª Lista de Cálculo Numérico', 'falsa-posicao', 1, 'numero', 1, 'ib4-05f', 'Falsa Posição, 1º passo: f(x) = x³ − 9x + 3 em [0; 1]. Qual é x₁?', NULL, '0,3750', 0.375, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"falsaPosicao","f":"x^3-9x+3","a":0,"b":1,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 0,375000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,375000 | 3,000000 | −5,000000 | −0,322266 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f-r', 'A', '0,3600', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f-r', 'B', '0,3386', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f-r', 'C', '0,5000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib4-05f-r', 'D', '0,3750', 1, NULL);

-- ======================================================================
-- 5ª Lista de Cálculo Numérico (Ibmec — Profa. Danielle Teixeira)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-01', 'ibmec-05', '1', '5ª Lista de Cálculo Numérico', 'newton', 2, 'numero', 0, NULL, 'Utilizando o método de Newton-Raphson, determine o zero da função f(x) = eˣ − 3x, onde x₀ = 2. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 10 e ε = 10⁻⁷.', NULL, '1,512135', 1.51213455166, NULL, NULL, NULL, NULL, 6, 0.000001, '{"calc":"newton","f":"exp(x)-3x","df":"exp(x)-3","x0":2,"eps":1e-7,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 6 iterações; x = 1,512135. O método convergiu na 6ª iteração: εₐ = 7,109×10⁻¹² ≤ ε = 1,000×10⁻⁷.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | 1,389056 | 4,389056 | 1,683518 | 0,187988
1 | 1,683518 | 0,333912 | 2,384467 | 1,543482 | 0,090728
2 | 1,543482 | 0,050415 | 1,680861 | 1,513489 | 0,019817
3 | 1,513489 | 0,002085 | 1,542550 | 1,512137 | 0,000893684
4 | 1,512137 | 0,000004 | 1,536416 | 1,512135 | 1,785×10⁻⁶
5 | 1,512135 | 0,000000 | 1,536404 | 1,512135 | 7,109×10⁻¹²', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01', 'A', '1,513489', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01', 'B', '1,543482', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01', 'C', '5,822140', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01', 'D', '1,512135', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-01-r', 'ibmec-05', '1 · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-01', 'Newton-Raphson, 1º passo: f(x) = eˣ − 3x, f′(x) = eˣ − 3 e x₀ = 2. Qual é x₁?', NULL, '1,683518', 1.68351826278, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"exp(x)-3x","df":"exp(x)-3","x0":2,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 1,683518. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | 1,389056 | 4,389056 | 1,683518 | 0,187988', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01-r', 'A', '1,750859', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01-r', 'B', '2,316482', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01-r', 'C', '1,543482', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-01-r', 'D', '1,683518', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02a', 'ibmec-05', '2 (a)', '5ª Lista de Cálculo Numérico', 'newton', 2, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter a menor raiz positiva de x/2 − tg x = 0 com precisão ε = 10⁻⁴, partindo de x₀ = 4,5. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 10.', NULL, '4,2748', 4.27478227185, NULL, NULL, NULL, NULL, 4, 0.0001, '{"calc":"newton","f":"x/2-tan(x)","df":"1/2-1/cos(x)^2","x0":4.5,"eps":0.0001,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 5 iterações; x = 4,274782. O método convergiu na 5ª iteração: εₐ = 3,007×10⁻⁶ ≤ ε = 0,0001.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 4,500000 | −2,387332 | −22,004849 | 4,391509 | 0,024705
1 | 4,391509 | −0,812972 | −9,552436 | 4,306403 | 0,019763
2 | 4,306403 | −0,173096 | −5,911657 | 4,277122 | 0,00684581
3 | 4,277122 | −0,011925 | −5,124591 | 4,274795 | 0,000544361
4 | 4,274795 | −0,000065 | −5,068747 | 4,274782 | 3,007×10⁻⁶', 'A lista não fixa x₀ neste item; usamos um chute perto da menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a', 'A', '4,2748', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a', 'B', '4,3064', 0, 'Parou cedo demais: com 2 iterações o erro ainda está bem acima de ε.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a', 'C', '4,2771', 0, 'Parou cedo demais: com 3 iterações o critério de parada ainda não foi atingido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a', 'D', '4,7124', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02a-r', 'ibmec-05', '2 (a) · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-02a', 'Newton-Raphson, 1º passo: f(x) = x/2 − tg x, f′(x) = 1/2 − 1/cos²x e x₀ = 4,5. Qual é x₁?', NULL, '4,3915', 4.391508817, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"newton","f":"x/2-tan(x)","df":"1/2-1/cos(x)^2","x0":4.5,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 4,391509. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 4,500000 | −2,387332 | −22,004849 | 4,391509 | 0,024705', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a-r', 'A', '4,3915', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a-r', 'B', '4,3064', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a-r', 'C', '8,7895', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02a-r', 'D', '4,6085', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02b', 'ibmec-05', '2 (b)', '5ª Lista de Cálculo Numérico', 'newton', 2, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter a menor raiz positiva de 2cos x = eˣ/2 com precisão ε = 10⁻⁴, partindo de x₀ = 1. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 10.', NULL, '0,9048', 0.904788217888, NULL, NULL, NULL, NULL, 4, 0.0001, '{"calc":"newton","f":"2cos(x)-exp(x)/2","df":"-2sin(x)-exp(x)/2","x0":1,"eps":0.0001,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 3 iterações; x = 0,904788. O método convergiu na 3ª iteração: εₐ = 6,459×10⁻⁶ ≤ ε = 0,0001.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | −0,278536 | −3,042083 | 0,908439 | 0,100789
1 | 0,908439 | −0,010269 | −2,817313 | 0,904794 | 0,00402842
2 | 0,904794 | −0,000016 | −2,808307 | 0,904788 | 6,459×10⁻⁶', 'A lista não fixa x₀ neste item; usamos um chute perto da menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b', 'A', '0,9048', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b', 'B', '1,5835', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b', 'C', '0,9410', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b', 'D', '1,3861', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02b-r', 'ibmec-05', '2 (b) · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-02b', 'Newton-Raphson, 1º passo: f(x) = 2cos x − eˣ/2, f′(x) = −2sen x − eˣ/2 e x₀ = 1. Qual é x₁?', NULL, '0,9084', 0.908438950177, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"newton","f":"2cos(x)-exp(x)/2","df":"-2sin(x)-exp(x)/2","x0":1,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 0,908439. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | −0,278536 | −3,042083 | 0,908439 | 0,100789', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b-r', 'A', '1,4595', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b-r', 'B', '0,9048', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b-r', 'C', '0,9084', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02b-r', 'D', '1,0916', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02c', 'ibmec-05', '2 (c)', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter a menor raiz positiva de x⁵ − 6 = 0 com precisão ε = 10⁻⁴, partindo de x₀ = 1,5. Após cada iteração, determine os erros absoluto e relativo (teste de parada). Considere N = 10.', NULL, '1,4310', 1.43096908474, NULL, NULL, NULL, NULL, 4, 0.0001, '{"calc":"newton","f":"x^5-6","df":"5x^4","x0":1.5,"eps":0.0001,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 3 iterações; x = 1,430969. O método convergiu na 3ª iteração: εₐ = 3,566×10⁻⁵ ≤ ε = 0,0001.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,500000 | 1,593750 | 25,312500 | 1,437037 | 0,043814
1 | 1,437037 | 0,128297 | 21,322683 | 1,431020 | 0,00420464
2 | 1,431020 | 0,001070 | 20,967804 | 1,430969 | 3,566×10⁻⁵', 'A lista não fixa x₀ neste item; usamos um chute perto da menor raiz positiva.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c', 'A', '1,4882', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c', 'B', '1,4310', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c', 'C', '1,8567', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c', 'D', '1,3022', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-02c-r', 'ibmec-05', '2 (c) · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-02c', 'Newton-Raphson, 1º passo: f(x) = x⁵ − 6, f′(x) = 5x⁴ e x₀ = 1,5. Qual é x₁?', NULL, '1,4370', 1.43703703704, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"newton","f":"x^5-6","df":"5x^4","x0":1.5,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 1,437037. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,500000 | 1,593750 | 25,312500 | 1,437037 | 0,043814', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c-r', 'A', '1,4310', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c-r', 'B', '1,3796', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c-r', 'C', '1,5630', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-02c-r', 'D', '1,4370', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-03', 'ibmec-05', '3', '5ª Lista de Cálculo Numérico', 'newton', 3, 'texto', 0, NULL, 'Com o uso da calculadora, aplique o método de Newton-Raphson à equação x³ − 2x² − 3x + 10 = 0 com x₀ = 1,9. O que acontece?', NULL, 'O primeiro passo é enorme (x₁ ≈ −4,92) porque f′(1,9) ≈ 0,23 é quase zero; depois o método vai para a única raiz real, x ≈ −2', NULL, NULL, NULL, NULL, NULL, NULL, 0.0001, '{"calc":"texto","resumo":"f′(x) = 3x² − 4x − 3 e f′(1,9) = 0,23: a tangente é quase horizontal e x₁ = 1,9 − f(1,9)/f′(1,9) ≈ 1,9 − 1,569/0,23 ≈ −4,92 cai longe. Daí em diante o método ainda acha a raiz real x ≈ −2, mas o primeiro passo mostra o perigo de f′(xᵢ) ≈ 0 (um dos itens de \"desvantagens\" dos slides)."}', 'f′(x) = 3x² − 4x − 3 e f′(1,9) = 0,23: a tangente é quase horizontal e x₁ = 1,9 − f(1,9)/f′(1,9) ≈ 1,9 − 1,569/0,23 ≈ −4,92 cai longe. Daí em diante o método ainda acha a raiz real x ≈ −2, mas o primeiro passo mostra o perigo de f′(xᵢ) ≈ 0 (um dos itens de "desvantagens" dos slides).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-03', 'A', 'f′(1,9) ≈ 0,23 é quase zero: x₁ ≈ −4,92 vai para longe, e só depois o método caminha para a raiz real x ≈ −2', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-03', 'B', 'O método fica oscilando entre 1,9 e 2,1 para sempre', 0, 'O primeiro passo já sai para x ≈ −4,92.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-03', 'C', 'O método para: f′(1,9) = 0', 0, 'f′(1,9) = 0,23, pequeno mas diferente de zero.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-03', 'D', 'O método converge rapidamente para uma raiz perto de 1,9', 0, 'A equação não tem raiz perto de 1,9: f(1,9) ≈ 1,57 e f tem mínimo local positivo ali.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-04', 'ibmec-05', '4', '5ª Lista de Cálculo Numérico', 'newton', 2, 'numero', 0, NULL, 'Seja a equação f(x) = x − x·ln x = 0. Utilize o método de Newton-Raphson para determinar a raiz positiva desta equação, partindo de x₀ = 2. Considere ε = 10⁻⁵ e N = 10.', NULL, '2,71828', 2.71828182846, NULL, NULL, NULL, NULL, 5, 0.0001, '{"calc":"newton","f":"x-x*ln(x)","df":"-ln(x)","x0":2,"eps":0.00001,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 4 iterações; x = 2,718282. O método convergiu na 4ª iteração: εₐ = 1,464×10⁻⁶ ≤ ε = 1,000×10⁻⁵.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | 0,613706 | −0,693147 | 2,885390 | 0,306853
1 | 2,885390 | −0,172143 | −1,059660 | 2,722939 | 0,059660
2 | 2,722939 | −0,004661 | −1,001712 | 2,718286 | 0,0017119
3 | 2,718286 | −0,000004 | −1,000001 | 2,718282 | 1,464×10⁻⁶', 'A lista não traz x₀; usamos x₀ = 2. A raiz exata é x = e.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04', 'A', '2,71828', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04', 'B', '2,47364', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04', 'C', '2,82701', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04', 'D', '3,12602', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-04-r', 'ibmec-05', '4 · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-04', 'Newton-Raphson, 1º passo: f(x) = x − x·ln x, f′(x) = −ln x e x₀ = 2. Qual é x₁?', NULL, '2,88539', 2.88539008178, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x-x*ln(x)","df":"-ln(x)","x0":2,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 2,885390. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | 0,613706 | −0,693147 | 2,885390 | 0,306853', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04-r', 'A', '2,72294', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04-r', 'B', '2,88539', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04-r', 'C', '2,76997', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-04-r', 'D', '1,11461', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-05a', 'ibmec-05', '5 (a)', '5ª Lista de Cálculo Numérico', 'bissecao', 1, 'texto', 1, NULL, 'Considere a equação não linear 1 + sen x = x. Mostre que existe uma raiz real x̄ no intervalo (1, 2).', NULL, 'f(1) = 0,8415 > 0 e f(2) = −0,0907 < 0; f é contínua, então pelo Teorema 1 há raiz em (1, 2)', NULL, NULL, NULL, NULL, NULL, NULL, 0.0001, '{"calc":"texto","resumo":"Com f(x) = 1 + sen x − x: f(1) = 1 + 0,8415 − 1 = 0,8415 > 0 e f(2) = 1 + 0,9093 − 2 = −0,0907 < 0. Como f é contínua e f(1)·f(2) < 0, o Teorema 1 garante uma raiz em (1, 2)."}', 'Com f(x) = 1 + sen x − x: f(1) = 1 + 0,8415 − 1 = 0,8415 > 0 e f(2) = 1 + 0,9093 − 2 = −0,0907 < 0. Como f é contínua e f(1)·f(2) < 0, o Teorema 1 garante uma raiz em (1, 2).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05a', 'A', 'f(1,5) = 0', 0, 'f(1,5) ≈ 0,4975, não é zero.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05a', 'B', 'f(1)·f(2) < 0 e f é contínua (Teorema 1)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05a', 'C', 'f(1) e f(2) são positivos', 0, 'f(2) = 1 + sen 2 − 2 ≈ −0,09 é negativo.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05a', 'D', 'f′(x) > 0 em todo o intervalo', 0, 'O que garante a raiz é a troca de sinal de f, não o sinal de f′.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-05b', 'ibmec-05', '5 (b)', '5ª Lista de Cálculo Numérico', 'bissecao', 1, 'numero', 1, NULL, 'Para a equação 1 + sen x = x no intervalo (1, 2), estime quantas iterações seriam necessárias para aproximar x̄ com precisão ε = 0,01, utilizando o método da Bisseção.', NULL, '7', 7, NULL, NULL, NULL, NULL, 0, 0.1, '{"calc":"iteracoesBissecao","a":1,"b":2,"eps":0.01}', 'k > (log(1) − log(0,01))/log 2 = 6,6439, então k = 7.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05b', 'A', '10', 0, 'Confira a conta: k > (log(b₀ − a₀) − log ε)/log 2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05b', 'B', '8', 0, 'Uma a mais do que o necessário: k é o primeiro inteiro acima do limite.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05b', 'C', '7', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05b', 'D', '6', 0, 'k precisa ser o primeiro inteiro maior que (log(b₀ − a₀) − log ε)/log 2: arredondar para baixo deixa b − a ainda maior que ε.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-05c', 'ibmec-05', '5 (c)', '5ª Lista de Cálculo Numérico', 'newton', 2, 'numero', 0, NULL, 'Utilizando o método de Newton-Raphson, obtenha uma aproximação para a raiz de 1 + sen x = x em (1, 2), com precisão ε = 0,01, partindo de x₀ = 2.', NULL, '1,9346', 1.93456387382, NULL, NULL, NULL, NULL, 4, 0.005, '{"calc":"newton","f":"1+sin(x)-x","df":"cos(x)-1","x0":2,"eps":0.01,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 2 iterações; x = 1,934564. O método convergiu na 2ª iteração: εₐ = 0,000717101 ≤ ε = 0,01.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | −0,090703 | −1,416147 | 1,935951 | 0,033084
1 | 1,935951 | −0,001883 | −1,357094 | 1,934564 | 0,000717101', 'A lista não traz x₀; usamos o extremo x₀ = 2.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c', 'A', '−698,6058', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c', 'B', '1,9346', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c', 'C', '2,1884', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c', 'D', '1,8572', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-05c-r', 'ibmec-05', '5 (c) · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-05c', 'Newton-Raphson, 1º passo: f(x) = 1 + sen x − x, f′(x) = cos x − 1 e x₀ = 2. Qual é x₁?', NULL, '1,9360', 1.93595115222, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"newton","f":"1+sin(x)-x","df":"cos(x)-1","x0":2,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 1,935951. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 2,000000 | −0,090703 | −1,416147 | 1,935951 | 0,033084', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c-r', 'A', '1,9360', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c-r', 'B', '2,0640', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c-r', 'C', '1,9346', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-05c-r', 'D', '−1582,2799', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-06', 'ibmec-05', '6', '5ª Lista de Cálculo Numérico', 'newton', 2, 'programa', 0, NULL, 'Faça um programa que determine a raiz de uma equação através do método de Newton-Raphson. Refaça os exercícios 1, 2, 3, 4 e 5 utilizando este programa.', NULL, 'Atividade de programação: confira os exercícios no Terminal do site.', NULL, NULL, NULL, NULL, NULL, NULL, 0.0001, '{"calc":"texto","resumo":"Use o Terminal do site (aba Newton-Raphson) para conferir cada exercício: ele mostra a tabela i, xᵢ, f(xᵢ), f′(xᵢ), xᵢ₊₁ e Eᵣ%, igual à dos slides."}', 'Use o Terminal do site (aba Newton-Raphson) para conferir cada exercício: ele mostra a tabela i, xᵢ, f(xᵢ), f′(xᵢ), xᵢ₊₁ e Eᵣ%, igual à dos slides.', NULL, 0);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-07', 'ibmec-05', '7', '5ª Lista de Cálculo Numérico', 'secante', 2, 'numero', 0, NULL, 'Aplique o método da Secante (a derivada do Newton-Raphson substituída por f′(x) ≅ (f(xₖ) − f(xₖ₋₁))/(xₖ − xₖ₋₁)) à equação x − x·ln x = 0, com x₀ = 2 e x₁ = 3, ε = 10⁻⁵ e N = 10.', NULL, '2,71828', 2.71828182184, NULL, NULL, NULL, NULL, 5, 0.0001, '{"calc":"secante","f":"x-x*ln(x)","x0":2,"x1":3,"eps":0.00001,"K":10,"criterio":"relativo"}', 'Secante: 4 iterações; x = 2,718282. O método convergiu na 4ª iteração: εₐ = 6,291×10⁻⁶ ≤ ε = 1,000×10⁻⁵.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 2,000000 | 3,000000 | 0,613706 | −0,295837 | 2,674741 | 0,121604
2 | 3,000000 | 2,674741 | −0,295837 | 0,043190 | 2,716177 | 0,015255
3 | 2,674741 | 2,716177 | 0,043190 | 0,002104 | 2,718299 | 0,000780513
4 | 2,716177 | 2,718299 | 0,002104 | −0,000017 | 2,718282 | 6,291×10⁻⁶', 'A lista manda refazer "os exercícios 7 e 8", que não estão nela; aqui usamos a equação da 4ª questão, que tem a raiz entre x₀ = 2 e x₁ = 3.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07', 'A', '2,71828', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07', 'B', '2,82701', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07', 'C', '3,12602', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07', 'D', '2,96293', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-07-r', 'ibmec-05', '7 · 1º passo', '5ª Lista de Cálculo Numérico', 'secante', 1, 'numero', 1, 'ib5-07', 'Secante, 1º passo: f(x) = x − x·ln x, x₀ = 2 e x₁ = 3. Qual é x₂?', NULL, '2,67474', 2.67474102154, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"x-x*ln(x)","x0":2,"x1":3,"iteracoes":1}', 'Secante: 1 iteração; x = 2,674741. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 2,000000 | 3,000000 | 0,613706 | −0,295837 | 2,674741 | 0,121604', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07-r', 'A', '2,56775', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07-r', 'B', '2,67474', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07-r', 'C', '2,91547', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-07-r', 'D', '2,71618', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-08', 'ibmec-05', '8', '5ª Lista de Cálculo Numérico', 'secante', 2, 'programa', 0, NULL, 'Faça um programa que determine a raiz de uma equação através do método da Secante. Refaça os exercícios 1, 2, 3, 4 e 5 utilizando este programa.', NULL, 'Atividade de programação: confira os exercícios no Terminal do site.', NULL, NULL, NULL, NULL, NULL, NULL, 0.0001, '{"calc":"texto","resumo":"Use o Terminal do site (aba Secante) para conferir: ele mostra a tabela com xᵢ₋₁, xᵢ, f(xᵢ₋₁), f(xᵢ), xᵢ₊₁ e Eᵣ%."}', 'Use o Terminal do site (aba Secante) para conferir: ele mostra a tabela com xᵢ₋₁, xᵢ, f(xᵢ₋₁), f(xᵢ), xᵢ₊₁ e Eᵣ%.', NULL, 0);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-09', 'ibmec-05', '9', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 0, NULL, 'Determine, usando o método de Newton-Raphson, a menor raiz positiva da equação 4cos x − eˣ = 0, onde x₀ = 1 e ε = 10⁻².', NULL, '0,905', 0.904794061672, NULL, NULL, NULL, NULL, 3, 0.005, '{"calc":"newton","f":"4cos(x)-exp(x)","df":"-4sin(x)-exp(x)","x0":1,"eps":0.01,"K":10,"criterio":"relativo"}', 'Newton-Raphson: 2 iterações; x = 0,904794. O método convergiu na 2ª iteração: εₐ = 0,00402842 ≤ ε = 0,01.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | −0,557073 | −6,084166 | 0,908439 | 0,100789
1 | 0,908439 | −0,020538 | −5,634626 | 0,904794 | 0,00402842', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09', 'A', '0,905', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09', 'B', '0,941', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09', 'C', '1,265', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09', 'D', '1,390', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-09-r', 'ibmec-05', '9 · 1º passo', '5ª Lista de Cálculo Numérico', 'newton', 1, 'numero', 1, 'ib5-09', 'Newton-Raphson, 1º passo: f(x) = 4cos x − eˣ, f′(x) = −4sen x − eˣ e x₀ = 1. Qual é x₁?', NULL, '0,9084', 0.908438950177, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"newton","f":"4cos(x)-exp(x)","df":"-4sin(x)-exp(x)","x0":1,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 0,908439. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | −0,557073 | −6,084166 | 0,908439 | 0,100789', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09-r', 'A', '0,9084', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09-r', 'B', '0,9048', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09-r', 'C', '1,0916', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-09-r', 'D', '1,4595', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-10', 'ibmec-05', '10', '5ª Lista de Cálculo Numérico', 'secante', 1, 'numero', 0, NULL, 'Determine, usando o método da Secante, a menor raiz positiva da equação x − 5e⁻ˣ = 0, onde x₀ = 1, x₁ = 2 e ε = 10⁻².', NULL, '1,327', 1.32692071945, NULL, NULL, NULL, NULL, 3, 0.005, '{"calc":"secante","f":"x-5exp(-x)","x0":1,"x1":2,"eps":0.01,"K":10,"criterio":"relativo"}', 'Secante: 3 iterações; x = 1,326921. O método convergiu na 3ª iteração: εₐ = 0,00860962 ≤ ε = 0,01.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,000000 | 2,000000 | −0,839397 | 1,323324 | 1,388121 | 0,440797
2 | 2,000000 | 1,388121 | 1,323324 | 0,140402 | 1,315496 | 0,055207
3 | 1,388121 | 1,315496 | 0,140402 | −0,026209 | 1,326921 | 0,00860962', 'Na lista está "x₀ = 1 e x₀ = 2"; o segundo é o x₁.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10', 'A', '1,327', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10', 'B', '1,315', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10', 'C', '1,446', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10', 'D', '1,380', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('ib5-10-r', 'ibmec-05', '10 · 1º passo', '5ª Lista de Cálculo Numérico', 'secante', 1, 'numero', 1, 'ib5-10', 'Secante, 1º passo: f(x) = x − 5e⁻ˣ, x₀ = 1 e x₁ = 2. Qual é x₂?', NULL, '1,3881', 1.38812093076, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"secante","f":"x-5exp(-x)","x0":1,"x1":2,"iteracoes":1}', 'Secante: 1 iteração; x = 1,388121. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,000000 | 2,000000 | −0,839397 | 1,323324 | 1,388121 | 0,440797', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10-r', 'A', '1,5131', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10-r', 'B', '1,3155', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10-r', 'C', '1,3881', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('ib5-10-r', 'D', '1,3326', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

-- ======================================================================
-- Lista 1 — Erros e zeros de funções (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-01', 'lista-01', '1ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'numero', 1, NULL, 'Para fazer contas, um engenheiro tem à sua disposição um dispositivo eletrônico que usa o sistema decimal de ponto flutuante (β, t, L, U) = (10, 4, −1023, 1024). A representação em ponto flutuante de um número α é denotada por fl(α). Nesse dispositivo, arredonda-se a parcela de α que não pode ser incorporada à mantissa de fl(α). Qual é o resultado final da operação fl(fl(x) + fl(y)), onde x = 273,95 e y = 21,13?', '0,2951 × 10³', '295,1', 295.1, 295.1, NULL, NULL, NULL, 1, NULL, '{"calc":"fl","t":4,"m":-1023,"M":1024,"modo":"arredondamento","expr":["+",273.95,21.13]}', 'fl(274 + 21,13) = fl(295,13) = 295,1. Resultado: 0,2951 × 10³.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-01', 'A', '295,0', 0, 'Esse resultado é com truncamento; o sistema do enunciado faz arredondamento.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-01', 'B', '29,5', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-01', 'C', '2951,0', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-01', 'D', '295,1', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-02', 'lista-01', '2ª', 'Representação de Números e Erros', 'ponto-flutuante', 2, 'numero', 0, NULL, 'Considere o sistema de ponto flutuante F(10, 4, −6, 9), que trunca a parcela que não pode ser incorporada à mantissa, e os números a = 0,9450 × 10⁴ e b = 0,1382 × 10². Nesse sistema, qual o resultado de (a × b) − (a + b)?', '0,1211 × 10⁶', '121000', 121000, 121100, NULL, NULL, NULL, 0, NULL, '{"calc":"fl","t":4,"m":-6,"M":9,"modo":"truncamento","expr":["-",["*",9450,13.82],["+",9450,13.82]]}', 'fl(9450 × 13,82) = fl(130599) = 130500; fl(9450 + 13,82) = fl(9463,82) = 9463; fl(130500 − 9463) = fl(121037) = 121000. Resultado: 0,1210 × 10⁶.', 'Com truncamento, como diz o enunciado, o resultado é 0,1210 × 10⁶. O gabarito da lista (0,1211 × 10⁶) é o que sai com arredondamento.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-02', 'A', '121100', 0, 'Esse resultado é com arredondamento; o sistema do enunciado faz truncamento. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-02', 'B', '1210000', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-02', 'C', '121000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-02', 'D', '12100', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-03', 'lista-01', '3ª', 'Representação de Números e Erros', 'ponto-flutuante', 2, 'numero', 0, NULL, 'Considere o sistema de ponto flutuante F(10, 4, −6, 6). Calcule S = 43560 + Σₖ₌₁¹⁰ 3 (somando da esquerda para a direita).', '0,4356 × 10⁵', '43560', 43560, 43560, NULL, NULL, NULL, 0, NULL, '{"calc":"fl","t":4,"m":-6,"M":6,"modo":"arredondamento","expr":["soma",43560,3,3,3,3,3,3,3,3,3,3]}', 'fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560; fl(43560 + 3) = 43560. Resultado: 0,4356 × 10⁵.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-03', 'A', '43560', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-03', 'B', '435600', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-03', 'C', '43590', 0, 'Somou na outra ordem: em ponto flutuante a ordem das parcelas muda o resultado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-03', 'D', '4356', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-04', 'lista-01', '4ª', 'Representação de Números e Erros', 'ponto-flutuante', 2, 'numero', 0, NULL, 'Considere o sistema de ponto flutuante F(10, 4, −6, 6). Calcule S = (Σₖ₌₁¹⁰ 3) + 43560.', '0,4359 × 10⁵', '43590', 43590, 43590, NULL, NULL, NULL, 0, NULL, '{"calc":"fl","t":4,"m":-6,"M":6,"modo":"arredondamento","expr":["soma",3,3,3,3,3,3,3,3,3,3,43560]}', 'fl(3 + 3) = 6; fl(6 + 3) = 9; fl(9 + 3) = 12; fl(12 + 3) = 15; fl(15 + 3) = 18; fl(18 + 3) = 21; fl(21 + 3) = 24; fl(24 + 3) = 27; fl(27 + 3) = 30; fl(30 + 43560) = 43590. Resultado: 0,4359 × 10⁵.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-04', 'A', '43590', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-04', 'B', '4359', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-04', 'C', '435900', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-04', 'D', '43560', 0, 'Somou na outra ordem: em ponto flutuante a ordem das parcelas muda o resultado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-05', 'lista-01', '5ª', 'Representação de Números e Erros', 'ponto-flutuante', 2, 'numero', 0, NULL, 'Considere o sistema F(10, 4, −6, 6) e as somas S₁ = 43560 + Σₖ₌₁¹⁰ 3 e S₂ = (Σₖ₌₁¹⁰ 3) + 43560. Determine ε = (S₂ − S₁)/S₂, em porcentagem.', '0,07%', '0,07%', 0.0688231245699, 0.07, NULL, NULL, NULL, 2, NULL, '{"calc":"fl-erro","t":4,"modo":"arredondamento","s1":["soma",43560,3,3,3,3,3,3,3,3,3,3],"s2":["soma",3,3,3,3,3,3,3,3,3,3,43560]}', 'S₁ = 0,4356 × 10⁵ e S₂ = 0,4359 × 10⁵: ε = (S₂ − S₁)/S₂ = 0,0688%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-05', 'A', '0,04%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-05', 'B', '0,00%', 0, 'Faltou multiplicar por 100 para dar a porcentagem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-05', 'C', '0,01%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-05', 'D', '0,07%', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-06', 'lista-01', '6ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'numero', 1, NULL, 'Considere o sistema de ponto flutuante F(β, t, L, U) = F(10, 3, −3, 4), que trunca a parcela que não pode ser incorporada à mantissa. Nesse sistema, qual o resultado de 10³ + 1 − 10³?', '0', '0', 0, 0, NULL, NULL, NULL, 0, NULL, '{"calc":"fl","t":3,"m":-3,"M":4,"modo":"truncamento","expr":["-",["+",1000,1],1000]}', 'fl(1000 + 1) = fl(1001) = 1000; fl(1000 − 1000) = fl(0) = 0. Resultado: 0.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-06', 'A', '3', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-06', 'B', '1', 0, 'Conta exata, sem passar cada operação por fl(·): numa máquina de t dígitos cada resultado parcial é arredondado ou truncado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-06', 'C', '−6', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-06', 'D', '0', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-07', 'lista-01', '7ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'numero', 1, NULL, 'Um dispositivo usa o sistema decimal de ponto flutuante (β, t, L, U) = (10, 4, −63, 64) e arredonda a parcela de α que não cabe na mantissa de fl(α). Qual é o resultado final da operação fl(fl(x) + fl(y)), onde x = 192,86 e y = 19,21?', '0,2121 × 10³', '212,1', 212.1, 212.1, NULL, NULL, NULL, 1, NULL, '{"calc":"fl","t":4,"m":-63,"M":64,"modo":"arredondamento","expr":["+",192.86,19.21]}', 'fl(192,9 + 19,21) = fl(212,11) = 212,1. Resultado: 0,2121 × 10³.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-07', 'A', '212,1', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-07', 'B', '212,0', 0, 'Esse resultado é com truncamento; o sistema do enunciado faz arredondamento.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-07', 'C', '2121,0', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-07', 'D', '21,2', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-08', 'lista-01', '8ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'vetor', 1, NULL, 'Considere o sistema de ponto flutuante F(β, t, m, M) = (10, 3, −5, 5). Quais são o menor e o maior número em módulo representados nesse sistema, respectivamente?', '0,100 × 10⁻⁵ e 0,999 × 10⁵', '0,100 × 10⁻⁵ e 0,999 × 10⁵', NULL, NULL, '[0.000001,99900]', '[0.000001,99900]', NULL, 0, NULL, '{"calc":"fl-limites","t":3,"m":-5,"M":5}', 'Menor: 0,100 × 10⁻⁵; maior: 0,999 × 10⁵.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-08', 'A', '0,999 × 10⁻⁵ e 0,999 × 10⁴', 0, 'Expoentes deslocados: confira m e M.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-08', 'B', '0,100 × 10⁻⁵ e 0,100 × 10⁶', 0, 'O maior número é 0,999… × 10ᴹ, que é menor que 10ᴹ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-08', 'C', '0,100 × 10⁻⁴ e 0,100 × 10⁶', 0, 'O menor positivo é 0,100… × 10ᵐ (não 10ᵐ) e o maior é 0,999… × 10ᴹ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-08', 'D', '0,100 × 10⁻⁵ e 0,999 × 10⁵', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-09', 'lista-01', '9ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'numero', 1, NULL, 'A região de overflow de um sistema de ponto flutuante F(β, t, m, M) = (10, 3, −3, M) é o conjunto O = {x ∈ ℝ | |x| > 9990}. Qual o valor da cota superior M?', 'M = +4', '4', 4, 4, NULL, NULL, NULL, 0, NULL, '{"calc":"fl-overflow-M","t":3,"limite":9990}', 'O maior número é 0,999 × 10ᴹ = 9990 ⇒ M = 4.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-09', 'A', '3', 0, 'Confira: o maior número é 0,999… × 10ᴹ e o menor positivo é 0,100… × 10ᵐ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-09', 'B', '4', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-09', 'C', '−4', 0, 'Sinal do expoente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-09', 'D', '5', 0, 'Confira: o maior número é 0,999… × 10ᴹ e o menor positivo é 0,100… × 10ᵐ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-10', 'lista-01', '10ª', 'Representação de Números e Erros', 'ponto-flutuante', 1, 'numero', 1, NULL, 'A região de underflow de um sistema de ponto flutuante F(β, t, m, M) = (10, 3, m, 4) é o conjunto U = {x ∈ ℝ | x ≠ 0 e |x| < 0,0001}. Qual o valor da cota inferior m?', 'm = −3 (na lista está escrito "a = −3")', '−3', -3, -3, NULL, NULL, NULL, 0, NULL, '{"calc":"fl-underflow-m","t":3,"limite":0.0001}', 'O menor positivo é 0,100 × 10ᵐ = 10ᵐ⁻¹ = 0,0001 ⇒ m = -3.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-10', 'A', '−2', 0, 'Confira: o maior número é 0,999… × 10ᴹ e o menor positivo é 0,100… × 10ᵐ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-10', 'B', '−3', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-10', 'C', '3', 0, 'Sinal do expoente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-10', 'D', '−4', 0, 'Confira: o maior número é 0,999… × 10ᴹ e o menor positivo é 0,100… × 10ᵐ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-erros-11', 'lista-01', '11ª', 'Representação de Números e Erros', 'ponto-flutuante', 2, 'numero', 0, NULL, 'Considere o sistema de ponto flutuante F(10, 4, −10, 10), que trunca a parcela que não pode ser incorporada à mantissa, e os números a = 0,7237 × 10⁴, b = 0,2145 × 10⁻³ e c = 0,2885 × 10¹ (na lista, o terceiro aparece como "a"). Nesse sistema, qual o resultado de a + b − c?', '0,7234 × 10⁴', '7234', 7234, 7234, NULL, NULL, NULL, 0, NULL, '{"calc":"fl","t":4,"m":-10,"M":10,"modo":"truncamento","expr":["-",["+",7237,0.0002145],2.885]}', 'fl(7237 + 0,0002145) = fl(7237) = 7237; fl(7237 − 2,885) = fl(7234,11) = 7234. Resultado: 0,7234 × 10⁴.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-11', 'A', '6945', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-11', 'B', '723', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-11', 'C', '7234', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-erros-11', 'D', '72340', 0, 'Expoente errado: confira a normalização 0,d₁d₂d₃d₄ × 10ᵉ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-01', 'lista-01', '1ª', 'Zeros de Funções Reais', 'newton', 2, 'numero', 0, NULL, 'Considere a equação não linear x − cos x = 0. Determine, com duas iterações, a raiz real no intervalo (0, 1), usando o método de Newton-Raphson. Use 5 casas decimais nos cálculos.', '0,73914', '0,73914', 0.73914, 0.73914, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x-cos(x)","df":"1+sin(x)","x0":0.5,"iteracoes":2,"casas":5}', 'Newton-Raphson: 2 iterações; x = 0,73914. 2 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,50000 | −0,37758 | 1,47943 | 0,75522 | 0,33794
1 | 0,75522 | 0,02710 | 1,68545 | 0,73914 | 0,02176', 'A lista não diz o x₀; usamos o ponto médio do intervalo, x₀ = 0,5.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01', 'A', '0,73909', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01', 'B', '0,73914', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01', 'C', '−0,33913', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01', 'D', '0,75522', 0, 'Esse é o resultado com 1 iteração: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-01-r', 'lista-01', '1ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-01', 'Newton-Raphson, 1º passo: f(x) = x − cos x, f′(x) = 1 + sen x e x₀ = 0,5. Qual é x₁?', NULL, '0,75522', 0.755222417106, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x-cos(x)","df":"1+sin(x)","x0":0.5,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 0,755222. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,500000 | −0,377583 | 1,479426 | 0,755222 | 0,337943', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01-r', 'A', '0,73914', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01-r', 'B', '0,75522', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01-r', 'C', '0,24478', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-01-r', 'D', '0,99564', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-02', 'lista-01', '2ª', 'Zeros de Funções Reais', 'newton', 2, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter a raiz da equação 2cos x = eˣ/2. Faça duas iterações. Considere x₀ = 0,5.', '0,910213', '0,910213', 0.910212955582, 0.910213, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"2cos(x)-exp(x)/2","df":"-2sin(x)-exp(x)/2","x0":0.5,"iteracoes":2}', 'Newton-Raphson: 2 iterações; x = 0,910213. 2 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,500000 | 0,930804 | −1,783212 | 1,021982 | 0,510755
1 | 1,021982 | −0,345996 | −3,095636 | 0,910213 | 0,122794', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02', 'A', '0,910213', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02', 'B', '−3,414829', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02', 'C', '0,904801', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02', 'D', '1,021982', 0, 'Esse é o resultado com 1 iteração: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-02-r', 'lista-01', '2ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-02', 'Newton-Raphson, 1º passo: f(x) = 2cos x − eˣ/2, f′(x) = −2sen x − eˣ/2 e x₀ = 0,5. Qual é x₁?', NULL, '1,021982', 1.02198204054, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"2cos(x)-exp(x)/2","df":"-2sin(x)-exp(x)/2","x0":0.5,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 1,021982. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,500000 | 0,930804 | −1,783212 | 1,021982 | 0,510755', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02-r', 'A', '1,896465', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02-r', 'B', '−0,021982', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02-r', 'C', '0,910213', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-02-r', 'D', '1,021982', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-03', 'lista-01', '3ª', 'Zeros de Funções Reais', 'newton', 1, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter o zero da função f(x) = x² + x − 6. Considere x₀ = 1,5 e apenas duas iterações. Use 5 casas decimais.', '2,00076', '2,00076', 2.00076, 2.00076, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x^2+x-6","df":"2x+1","x0":1.5,"iteracoes":2,"casas":5}', 'Newton-Raphson: 2 iterações; x = 2,00076. 2 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,50000 | −2,25000 | 4,00000 | 2,06250 | 0,27273
1 | 2,06250 | 0,31641 | 5,12500 | 2,00076 | 0,03086', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03', 'A', '−0,51766', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03', 'B', '2,06250', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03', 'C', '2,00076', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03', 'D', '2,00000', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-03-r', 'lista-01', '3ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-03', 'Newton-Raphson, 1º passo: f(x) = x² + x − 6, f′(x) = 2x + 1 e x₀ = 1,5. Qual é x₁?', NULL, '2,06250', 2.0625, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x^2+x-6","df":"2x+1","x0":1.5,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 2,062500. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,500000 | −2,250000 | 4,000000 | 2,062500 | 0,272727', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03-r', 'A', '0,93750', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03-r', 'B', '2,00076', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03-r', 'C', '2,06250', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-03-r', 'D', '2,14500', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-04', 'lista-01', '4ª', 'Zeros de Funções Reais', 'newton', 1, 'numero', 0, NULL, 'Use o método de Newton-Raphson para obter o zero da função f(x) = x² + x − 6. Considere x₀ = −2,0 e apenas duas iterações. Use 6 casas decimais.', '−3,019608', '−3,019608', -3.019608, -3.019608, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"x^2+x-6","df":"2x+1","x0":-2,"iteracoes":2,"casas":6}', 'Newton-Raphson: 2 iterações; x = −3,019608. 2 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | −2,000000 | −4,000000 | −3,000000 | −3,333333 | 0,400000
1 | −3,333333 | 1,777776 | −5,666666 | −3,019608 | 0,103896', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04', 'A', '−3,000076', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04', 'B', '−3,333333', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04', 'C', '−3,019608', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04', 'D', '17,999962', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-04-r', 'lista-01', '4ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-04', 'Newton-Raphson, 1º passo: f(x) = x² + x − 6, f′(x) = 2x + 1 e x₀ = −2. Qual é x₁?', NULL, '−3,333333', -3.33333333333, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"x^2+x-6","df":"2x+1","x0":-2,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = −3,333333. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | −2,000000 | −4,000000 | −3,000000 | −3,333333 | 0,400000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04-r', 'A', '−3,200000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04-r', 'B', '−3,019608', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04-r', 'C', '−3,333333', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-04-r', 'D', '−0,666667', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-05', 'lista-01', '5ª', 'Zeros de Funções Reais', 'secante', 1, 'numero', 0, NULL, 'Use o método da Secante para determinar a raiz da equação x² + x − 6 = 0, considerando x₀ = 1,5 e x₁ = 1,7. Faça 2 iterações e use 5 casas decimais.', '1,99774', '1,99774', 1.99774, 1.99774, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"x^2+x-6","x0":1.5,"x1":1.7,"iteracoes":2,"casas":5}', 'Secante: 2 iterações; x = 1,99774. 2 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,50000 | 1,70000 | −2,25000 | −1,41000 | 2,03571 | 0,16491
2 | 1,70000 | 2,03571 | −1,41000 | 0,17983 | 1,99774 | 0,01901', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05', 'A', '1,99998', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05', 'B', '2,03571', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05', 'C', '1,99774', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05', 'D', '2,07765', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-05-r', 'lista-01', '5ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-05', 'Secante, 1º passo: f(x) = x² + x − 6, x₀ = 1,5 e x₁ = 1,7. Qual é x₂?', NULL, '2,03571', 2.03571428571, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"x^2+x-6","x0":1.5,"x1":1.7,"iteracoes":1}', 'Secante: 1 iteração; x = 2,035714. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,500000 | 1,700000 | −2,250000 | −1,410000 | 2,035714 | 0,164912', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05-r', 'A', '2,21893', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05-r', 'B', '2,03571', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05-r', 'C', '1,99774', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-05-r', 'D', '1,95429', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-06', 'lista-01', '6ª', 'Zeros de Funções Reais', 'newton', 2, 'numero', 0, NULL, 'Seja a função f(x) = x·e⁻ˣ − 0,2. Encontre o zero de f(x) pelo método de Newton-Raphson. Considere 6 casas decimais e três iterações, com x₀ = 0,0.', '0,259154', '0,259154', 0.259154, 0.259154, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"x*exp(-x)-0.2","df":"(1-x)*exp(-x)","x0":0,"iteracoes":3,"casas":6}', 'Newton-Raphson: 3 iterações; x = 0,259154. 3 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,000000 | −0,200000 | 1,000000 | 0,200000 | 1,000000
1 | 0,200000 | −0,036254 | 0,654985 | 0,255351 | 0,216764
2 | 0,255351 | −0,002194 | 0,576838 | 0,259154 | 0,014675', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06', 'A', '0,259171', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06', 'B', '0,255351', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06', 'C', '−0,918291', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06', 'D', '0,259154', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-06-r', 'lista-01', '6ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-06', 'Newton-Raphson, 1º passo: f(x) = x·e⁻ˣ − 0,2, f′(x) = (1 − x)·e⁻ˣ e x₀ = 0. Qual é x₁?', NULL, '0,200000', 0.2, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"newton","f":"x*exp(-x)-0.2","df":"(1-x)*exp(-x)","x0":0,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 0,200000. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 0,000000 | −0,200000 | 1,000000 | 0,200000 | 1,000000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06-r', 'A', '0,192000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06-r', 'B', '0,255351', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06-r', 'C', '−0,200000', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-06-r', 'D', '0,200000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-07', 'lista-01', '7ª', 'Zeros de Funções Reais', 'secante', 2, 'numero', 0, NULL, 'Use o método da Secante e três iterações para determinar o zero da função f(x) = x − 2 sen x, considerando 6 casas decimais, x₀ = π/2 e x₁ = 3π/2.', '1,899844', '1,899844', 1.899844, 1.899844, NULL, NULL, NULL, 6, NULL, '{"calc":"secante","f":"x-2sin(x)","x0":1.5707963267948966,"x1":4.71238898038469,"iteracoes":3,"casas":6}', 'Secante: 3 iterações; x = 1,899844. 3 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,570796 | 4,712389 | −0,429204 | 6,712389 | 1,759603 | 1,678098
2 | 4,712389 | 1,759603 | 6,712389 | −0,204855 | 1,847050 | 0,047344
3 | 1,759603 | 1,847050 | −0,204855 | −0,077118 | 1,899844 | 0,027789', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07', 'A', '1,895369', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07', 'B', '1,847050', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07', 'C', '1,899844', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07', 'D', '1,879596', 0, 'Esse valor sai da Falsa Posição, que guarda o par com troca de sinal. A Secante usa sempre os dois últimos pontos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-07-r', 'lista-01', '7ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-07', 'Secante, 1º passo: f(x) = x − 2sen x, x₀ = 1,570796 e x₁ = 4,712389. Qual é x₂?', NULL, '1,759603', 1.75960338595, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"secante","f":"x-2sin(x)","x0":1.5707963267948966,"x1":4.71238898038469,"iteracoes":1}', 'Secante: 1 iteração; x = 1,759603. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 1,570796 | 4,712389 | −0,429204 | 6,712389 | 1,759603 | 1,678097', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07-r', 'A', '1,759603', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07-r', 'B', '1,847050', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07-r', 'C', '0,000085', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-07-r', 'D', '1,829988', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-08', 'lista-01', '8ª', 'Zeros de Funções Reais', 'newton', 2, 'numero', 0, NULL, 'Seja a função f(x) = eˣ/2 − cos(2x). Depois de três iterações do método de Newton, com chute inicial x₀ = −1, determine aproximadamente o zero dessa função.', '−0,65388', '−0,65388', -0.653880945168, -0.65388, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"exp(x)/2-cos(2x)","df":"exp(x)/2+2sin(2x)","x0":-1,"iteracoes":3}', 'Newton-Raphson: 3 iterações; x = −0,653881. 3 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | −1,000000 | 0,600087 | −1,634655 | −0,632897 | 0,580036
1 | −0,632897 | −0,034770 | −1,642167 | −0,654070 | 0,032371
2 | −0,654070 | 0,000316 | −1,671445 | −0,653881 | 0,000289343', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08', 'A', '−4,03722', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08', 'B', '4,16576', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08', 'C', '−0,65388', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08', 'D', '−0,65407', 0, 'Esse é o resultado com 2 iterações: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-08-r', 'lista-01', '8ª · 1º passo', 'Zeros de Funções Reais', 'newton', 1, 'numero', 1, 'l01-zeros-08', 'Newton-Raphson, 1º passo: f(x) = eˣ/2 − cos(2x), f′(x) = eˣ/2 + 2sen(2x) e x₀ = −1. Qual é x₁?', NULL, '−0,63290', -0.632897150601, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"exp(x)/2-cos(2x)","df":"exp(x)/2+2sin(2x)","x0":-1,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = −0,632897. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | −1,000000 | 0,600087 | −1,634655 | −0,632897 | 0,580036', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08-r', 'A', '−0,63290', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08-r', 'B', '6,14426', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08-r', 'C', '−0,65407', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-08-r', 'D', '−1,36710', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-09', 'lista-01', '9ª', 'Zeros de Funções Reais', 'newton', 2, 'texto', 0, NULL, 'Se o método de Newton for usado para encontrar uma raiz da função f(x) = x² − 4x + 3, adotando como chute inicial x₀ = 2, qual das afirmações a seguir é a correta?', 'O método de Newton atinge um extremo local', 'O método de Newton atinge um extremo local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"f′(x) = 2x − 4 e f′(2) = 0: em x₀ = 2 a tangente é horizontal (ponto de mínimo da parábola) e a fórmula xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ) divide por zero. É o caso \"f′(xᵣ) = 0 (desastre!)\" dos slides."}', 'f′(x) = 2x − 4 e f′(2) = 0: em x₀ = 2 a tangente é horizontal (ponto de mínimo da parábola) e a fórmula xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ) divide por zero. É o caso "f′(xᵣ) = 0 (desastre!)" dos slides.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-09', 'A', 'O método converge para a raiz x = 1', 0, 'Seria preciso f′(x₀) ≠ 0 para dar o primeiro passo.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-09', 'B', 'O método oscila entre x = 1 e x = 3', 0, 'Não há primeiro passo: a divisão por f′(2) = 0 não existe.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-09', 'C', 'O método de Newton atinge um extremo local: f′(2) = 0 e a tangente é horizontal', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-09', 'D', 'O método converge para a raiz x = 3', 0, 'Seria preciso f′(x₀) ≠ 0 para dar o primeiro passo.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-10', 'lista-01', '10ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = cos²x + 2x − 2. Usando o método da Bisseção no intervalo [0,69; 0,72] e 3 iterações, encontre uma aproximação para a raiz.', '0,71484', '0,71625', 0.71625, 0.71484, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"cos(x)^2+2x-2","a":0.69,"b":0.72,"iteracoes":3}', 'Bisseção: 3 iterações; x = 0,716250. 3 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,690000 | 0,720000 | 0,705000 | −0,025180 | 0,005212 | −0,009948 | —
2 | 0,705000 | 0,720000 | 0,712500 | −0,009948 | 0,005212 | −0,002360 | 0,010526
3 | 0,712500 | 0,720000 | 0,716250 | −0,002360 | 0,005212 | 0,001428 | 0,0052356', 'O gabarito da lista (0,71484) é a raiz que a Falsa Posição encontra (13ª questão). Com 3 iterações da Bisseção em [0,69; 0,72] os pontos médios são 0,705; 0,7125 e 0,71625.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10', 'A', '0,71484', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10', 'B', '0,71625', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10', 'C', '0,71250', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10', 'D', '0,71438', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-10-r', 'lista-01', '10ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-10', 'Bisseção, 1º passo: f(x) = cos²x + 2x − 2 em [0,69; 0,72]. Qual é x₁?', NULL, '0,70500', 0.705, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"cos(x)^2+2x-2","a":0.69,"b":0.72,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,705000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,690000 | 0,720000 | 0,705000 | −0,025180 | 0,005212 | −0,009948 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10-r', 'A', '0,67680', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10-r', 'B', '0,71486', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10-r', 'C', '0,70500', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-10-r', 'D', '0,71250', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-11', 'lista-01', '11ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = 2x − log x − 7. Usando o método da Bisseção no intervalo [3,75; 3,85] e 3 iterações, encontre uma aproximação para a raiz.', '3,78750', '3,78750', 3.7875, 3.7875, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"2x-log(x)-7","a":3.75,"b":3.85,"iteracoes":3}', 'Bisseção: 3 iterações; x = 3,787500. 3 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,750000 | 3,850000 | 3,800000 | −0,074031 | 0,114539 | 0,020216 | —
2 | 3,750000 | 3,800000 | 3,775000 | −0,074031 | 0,020216 | −0,026917 | 0,00662252
3 | 3,775000 | 3,800000 | 3,787500 | −0,026917 | 0,020216 | −0,003353 | 0,00330033', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11', 'A', '3,77500', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11', 'B', '3,78928', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11', 'C', '3,79375', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11', 'D', '3,78750', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-11-r', 'lista-01', '11ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-11', 'Bisseção, 1º passo: f(x) = 2x − log x − 7 em [3,75; 3,85]. Qual é x₁?', NULL, '3,80000', 3.8, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"2x-log(x)-7","a":3.75,"b":3.85,"iteracoes":1}', 'Bisseção: 1 iteração; x = 3,800000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,750000 | 3,850000 | 3,800000 | −0,074031 | 0,114539 | 0,020216 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11-r', 'A', '3,78926', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11-r', 'B', '3,95200', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11-r', 'C', '3,80000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-11-r', 'D', '3,77500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-12', 'lista-01', '12ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = ln x − x⁴/81. Usando o método da Bisseção no intervalo [1,0; 1,2] e 4 iterações, encontre uma aproximação para a raiz.', '1,01875', '1,01250', 1.0125, 1.01875, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"ln(x)-x^4/81","a":1,"b":1.2,"iteracoes":4}', 'Bisseção: 4 iterações; x = 1,012500. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 1,200000 | 1,100000 | −0,012346 | 0,156722 | 0,077235 | —
2 | 1,000000 | 1,100000 | 1,050000 | −0,012346 | 0,077235 | 0,033784 | 0,047619
3 | 1,000000 | 1,050000 | 1,025000 | −0,012346 | 0,033784 | 0,011065 | 0,024390
4 | 1,000000 | 1,025000 | 1,012500 | −0,012346 | 0,011065 | −0,000552 | 0,012346', 'O gabarito da lista (1,01875) é o 5º ponto médio. Com 4 iterações a Bisseção em [1,0; 1,2] dá 1,1; 1,05; 1,025 e 1,0125.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12', 'A', '1,01309', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12', 'B', '1,01250', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12', 'C', '1,02500', 0, 'Esse é o resultado com 3 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12', 'D', '1,01875', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-12-r', 'lista-01', '12ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-12', 'Bisseção, 1º passo: f(x) = ln x − x⁴/81 em [1; 1,2]. Qual é x₁?', NULL, '1,10000', 1.1, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"ln(x)-x^4/81","a":1,"b":1.2,"iteracoes":1}', 'Bisseção: 1 iteração; x = 1,100000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 1,200000 | 1,100000 | −0,012346 | 0,156722 | 0,077235 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12-r', 'A', '1,01460', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12-r', 'B', '1,10000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12-r', 'C', '1,14400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-12-r', 'D', '1,05000', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-13', 'lista-01', '13ª', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = cos²x + 2x − 2. Usando o método da Falsa Posição no intervalo [0,69; 0,72] e 2 iterações, encontre uma aproximação para a raiz.', '0,71484', '0,71484', 0.714835900242, 0.71484, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"cos(x)^2+2x-2","a":0.69,"b":0.72,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 0,714836. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,690000 | 0,720000 | 0,714855 | −0,025180 | 0,005212 | 0,000020 | —
2 | 0,690000 | 0,714855 | 0,714836 | −0,025180 | 0,000020 | 0,000000 | 2,710×10⁻⁵', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13', 'A', '0,71486', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13', 'B', '0,71250', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13', 'C', '0,68624', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13', 'D', '0,71484', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-13-r', 'lista-01', '13ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-13', 'Falsa Posição, 1º passo: f(x) = cos²x + 2x − 2 em [0,69; 0,72]. Qual é x₁?', NULL, '0,71486', 0.714855273799, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"cos(x)^2+2x-2","a":0.69,"b":0.72,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 0,714855. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,690000 | 0,720000 | 0,714855 | −0,025180 | 0,005212 | 0,000020 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13-r', 'A', '0,74345', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13-r', 'B', '0,71486', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13-r', 'C', '0,71484', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-13-r', 'D', '0,70500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-14', 'lista-01', '14ª', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = 2x − log x − 7. Usando o método da Falsa Posição no intervalo [3,6; 3,8] e 2 iterações, encontre uma aproximação para a raiz.', '3,78928', '3,78928', 3.789278247, 3.78928, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"2x-log(x)-7","a":3.6,"b":3.8,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 3,789278. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,600000 | 3,800000 | 3,789261 | −0,356303 | 0,020216 | −0,000032 | —
2 | 3,789261 | 3,800000 | 3,789278 | −0,000032 | 0,020216 | −0,000000 | 4,442×10⁻⁶', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14', 'A', '3,94085', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14', 'B', '3,78928', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14', 'C', '3,75000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14', 'D', '3,78926', 0, 'Esse é o resultado com 1 iteração: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-14-r', 'lista-01', '14ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-14', 'Falsa Posição, 1º passo: f(x) = 2x − log x − 7 em [3,6; 3,8]. Qual é x₁?', NULL, '3,78926', 3.78926141388, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"2x-log(x)-7","a":3.6,"b":3.8,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 3,789261. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,600000 | 3,800000 | 3,789261 | −0,356303 | 0,020216 | −0,000032 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14-r', 'A', '3,78928', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14-r', 'B', '3,78926', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14-r', 'C', '3,63769', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-14-r', 'D', '3,70000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-15', 'lista-01', '15ª', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = x⁴ − 8x + 5. Usando o método da Falsa Posição no intervalo [0,6; 0,7] e 2 iterações, encontre uma aproximação para a raiz.', '0,64693', '0,64690', 0.646903777445, 0.64693, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"x^4-8x+5","a":0.6,"b":0.7,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 0,646904. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,600000 | 0,700000 | 0,647803 | 0,329600 | −0,359900 | −0,006317 | —
2 | 0,600000 | 0,647803 | 0,646904 | 0,329600 | −0,006317 | −0,000101 | 0,00138966', 'O gabarito da lista (0,64693) difere na 5ª casa; com as contas completas a Falsa Posição dá 0,64690.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15', 'A', '0,62500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15', 'B', '0,64689', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15', 'C', '0,64780', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15', 'D', '0,64690', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-15-r', 'lista-01', '15ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-15', 'Falsa Posição, 1º passo: f(x) = x⁴ − 8x + 5 em [0,6; 0,7]. Qual é x₁?', NULL, '0,64780', 0.64780275562, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"x^4-8x+5","a":0.6,"b":0.7,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 0,647803. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,600000 | 0,700000 | 0,647803 | 0,329600 | −0,359900 | −0,006317 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15-r', 'A', '0,65000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15-r', 'B', '0,64690', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15-r', 'C', '0,67371', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-15-r', 'D', '0,64780', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-16', 'lista-01', '16ª', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = ln x − x⁴/81. Usando o método da Falsa Posição no intervalo [1,0; 1,2] e 2 iterações, encontre uma aproximação para a raiz.', '1,01310', '1,01310', 1.01310174123, 1.0131, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"ln(x)-x^4/81","a":1,"b":1.2,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 1,013102. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 1,200000 | 1,014604 | −0,012346 | 0,156722 | 0,001416 | —
2 | 1,000000 | 1,014604 | 1,013102 | −0,012346 | 0,001416 | 0,000011 | 0,00148329', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16', 'A', '1,05000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16', 'B', '1,01460', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16', 'C', '1,01309', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16', 'D', '1,01310', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-16-r', 'lista-01', '16ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-16', 'Falsa Posição, 1º passo: f(x) = ln x − x⁴/81 em [1; 1,2]. Qual é x₁?', NULL, '1,01460', 1.01460446071, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"ln(x)-x^4/81","a":1,"b":1.2,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 1,014604. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,000000 | 1,200000 | 1,014604 | −0,012346 | 0,156722 | 0,001416 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16-r', 'A', '1,05519', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16-r', 'B', '1,01310', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16-r', 'C', '1,01460', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-16-r', 'D', '1,10000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-17', 'lista-01', '17ª', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = sen x − x/2. Usando o método da Falsa Posição no intervalo [1,8; 1,9] e 2 iterações, encontre uma aproximação para a raiz.', '1,89549', '1,89549', 1.89549357712, 1.89549, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"sin(x)-x/2","a":1.8,"b":1.9,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 1,895494. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,800000 | 1,900000 | 1,895229 | 0,073848 | −0,003700 | 0,000217 | —
2 | 1,895229 | 1,900000 | 1,895494 | 0,000217 | −0,003700 | 0,000001 | 0,000139663', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17', 'A', '1,97131', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17', 'B', '1,87500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17', 'C', '1,89523', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17', 'D', '1,89549', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-17-r', 'lista-01', '17ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-17', 'Falsa Posição, 1º passo: f(x) = sen x − x/2 em [1,8; 1,9]. Qual é x₁?', NULL, '1,89523', 1.89522884651, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"sin(x)-x/2","a":1.8,"b":1.9,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 1,895229. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,800000 | 1,900000 | 1,895229 | 0,073848 | −0,003700 | 0,000217 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17-r', 'A', '1,89549', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17-r', 'B', '1,89523', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17-r', 'C', '1,85000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-17-r', 'D', '1,97104', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-18', 'lista-01', '18ª', 'Zeros de Funções Reais', 'secante', 1, 'numero', 0, NULL, 'Seja a função f(x) = cos²x + 2x − 2. Usando o método da Secante com x₀ = 0,6, x₁ = 0,8 e 2 iterações, encontre uma aproximação para a raiz.', '0,71483', '0,71483', 0.714825022153, 0.71483, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"cos(x)^2+2x-2","x0":0.6,"x1":0.8,"iteracoes":2}', 'Secante: 2 iterações; x = 0,714825. 2 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,600000 | 0,800000 | −0,118821 | 0,085400 | 0,716365 | 0,116749
2 | 0,800000 | 0,716365 | 0,085400 | 0,001544 | 0,714825 | 0,00215438', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18', 'A', '0,71483', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18', 'B', '0,71637', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18', 'C', '0,71484', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18', 'D', '0,71487', 0, 'Esse valor sai da Falsa Posição, que guarda o par com troca de sinal. A Secante usa sempre os dois últimos pontos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-18-r', 'lista-01', '18ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-18', 'Secante, 1º passo: f(x) = cos²x + 2x − 2, x₀ = 0,6 e x₁ = 0,8. Qual é x₂?', NULL, '0,71637', 0.716365028442, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"cos(x)^2+2x-2","x0":0.6,"x1":0.8,"iteracoes":1}', 'Secante: 1 iteração; x = 0,716365. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,600000 | 0,800000 | −0,118821 | 0,085400 | 0,716365 | 0,116749', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18-r', 'A', '0,71483', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18-r', 'B', '0,50003', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18-r', 'C', '0,71637', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-18-r', 'D', '0,68771', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-19', 'lista-01', '19ª', 'Zeros de Funções Reais', 'secante', 1, 'numero', 0, NULL, 'Seja a função f(x) = eˣ − 3x. Usando o método da Secante com x₀ = 0,5, x₁ = 0,7 e 2 iterações, encontre uma aproximação para a raiz.', '0,61851', '0,61851', 0.618510689227, 0.61851, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"exp(x)-3x","x0":0.5,"x1":0.7,"iteracoes":2}', 'Secante: 2 iterações; x = 0,618511. 2 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,500000 | 0,700000 | 0,148721 | −0,086247 | 0,626588 | 0,117161
2 | 0,700000 | 0,626588 | −0,086247 | −0,008549 | 0,618511 | 0,013060', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19', 'A', '0,61906', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19', 'B', '0,62659', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19', 'C', '0,61971', 0, 'Esse valor sai da Falsa Posição, que guarda o par com troca de sinal. A Secante usa sempre os dois últimos pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19', 'D', '0,61851', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-19-r', 'lista-01', '19ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-19', 'Secante, 1º passo: f(x) = eˣ − 3x, x₀ = 0,5 e x₁ = 0,7. Qual é x₂?', NULL, '0,62659', 0.626588228362, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"exp(x)-3x","x0":0.5,"x1":0.7,"iteracoes":1}', 'Secante: 1 iteração; x = 0,626588. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,500000 | 0,700000 | 0,148721 | −0,086247 | 0,626588 | 0,117161', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19-r', 'A', '0,60152', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19-r', 'B', '0,68298', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19-r', 'C', '0,62659', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-19-r', 'D', '0,61851', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-20', 'lista-01', '20ª', 'Zeros de Funções Reais', 'secante', 1, 'numero', 0, NULL, 'Seja a função f(x) = 2,7 − 4e⁻ˣ − x. Usando o método da Secante com x₀ = 0,6, x₁ = 0,8 e 2 iterações, encontre uma aproximação para a raiz.', '0,68631', '0,68512', 0.685123922275, 0.68631, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"2.7-4exp(-x)-x","x0":0.6,"x1":0.8,"iteracoes":2}', 'Secante: 2 iterações; x = 0,685124. 2 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,600000 | 0,800000 | −0,095247 | 0,102684 | 0,696242 | 0,149025
2 | 0,800000 | 0,696242 | 0,102684 | 0,009938 | 0,685124 | 0,016228', 'O gabarito da lista (0,68631) é praticamente a raiz. Com 2 iterações da Secante a partir de 0,6 e 0,8 sai 0,68512; a 3ª iteração dá 0,68635.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20', 'A', '0,68635', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20', 'B', '0,68715', 0, 'Esse valor sai da Falsa Posição, que guarda o par com troca de sinal. A Secante usa sempre os dois últimos pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20', 'C', '0,69624', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20', 'D', '0,68512', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-20-r', 'lista-01', '20ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-20', 'Secante, 1º passo: f(x) = 2,7 − 4e⁻ˣ − x, x₀ = 0,6 e x₁ = 0,8. Qual é x₂?', NULL, '0,69624', 0.696242321373, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"2.7-4exp(-x)-x","x0":0.6,"x1":0.8,"iteracoes":1}', 'Secante: 1 iteração; x = 0,696242. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,600000 | 0,800000 | −0,095247 | 0,102684 | 0,696242 | 0,149025', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20-r', 'A', '0,68512', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20-r', 'B', '0,72409', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20-r', 'C', '0,69624', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-20-r', 'D', '0,63358', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-21', 'lista-01', '21ª', 'Zeros de Funções Reais', 'secante', 1, 'numero', 0, NULL, 'Seja a função f(x) = 2x − log x − 7. Usando o método da Secante com x₀ = 3,0, x₁ = 4,0 e 2 iterações, encontre uma aproximação para a raiz.', '3,78928', '3,78928', 3.78927579688, 3.78928, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"2x-log(x)-7","x0":3,"x1":4,"iteracoes":2}', 'Secante: 2 iterações; x = 3,789276. 2 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 3,000000 | 4,000000 | −1,477121 | 0,397940 | 3,787772 | 0,056030
2 | 4,000000 | 3,787772 | 0,397940 | −0,002839 | 3,789276 | 0,000396787', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21', 'A', '3,63770', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21', 'B', '3,78928', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21', 'C', '3,78777', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21', 'D', '3,44824', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-21-r', 'lista-01', '21ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-21', 'Secante, 1º passo: f(x) = 2x − log x − 7, x₀ = 3 e x₁ = 4. Qual é x₂?', NULL, '3,78777', 3.787772263, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"2x-log(x)-7","x0":3,"x1":4,"iteracoes":1}', 'Secante: 1 iteração; x = 3,787772. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 3,000000 | 4,000000 | −1,477121 | 0,397940 | 3,787772 | 0,056030', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21-r', 'A', '3,93928', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21-r', 'B', '3,44687', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21-r', 'C', '3,78928', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-21-r', 'D', '3,78777', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-22', 'lista-01', '22ª', 'Zeros de Funções Reais', 'secante', 2, 'numero', 0, NULL, 'Seja a função f(x) = ln x − x⁴/81. Usando o método da Secante com x₀ = 0,5, x₁ = 1,5 e 3 iterações, encontre uma aproximação para a raiz.', '1,01825', '1,01825', 1.01825426393, 1.01825, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"ln(x)-x^4/81","x0":0.5,"x1":1.5,"iteracoes":3}', 'Secante: 3 iterações; x = 1,018254. 3 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,500000 | 1,500000 | −0,693919 | 0,342965 | 1,169235 | 0,282890
2 | 1,500000 | 1,169235 | 0,342965 | 0,133276 | 0,959005 | 0,219216
3 | 1,169235 | 0,959005 | 0,133276 | −0,052301 | 1,018254 | 0,058187', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22', 'A', '1,01825', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22', 'B', '1,02799', 0, 'Esse valor sai da Falsa Posição, que guarda o par com troca de sinal. A Secante usa sempre os dois últimos pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22', 'C', '0,95901', 0, 'Esse é o resultado com 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22', 'D', '1,01326', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-22-r', 'lista-01', '22ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-22', 'Secante, 1º passo: f(x) = ln x − x⁴/81, x₀ = 0,5 e x₁ = 1,5. Qual é x₂?', NULL, '1,16923', 1.16923480033, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"ln(x)-x^4/81","x0":0.5,"x1":1.5,"iteracoes":1}', 'Secante: 1 iteração; x = 1,169235. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 0,500000 | 1,500000 | −0,693919 | 0,342965 | 1,169235 | 0,282890', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22-r', 'A', '1,16923', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22-r', 'B', '0,95901', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22-r', 'C', '1,21600', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-22-r', 'D', '1,06400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-23', 'lista-01', '23ª', 'Zeros de Funções Reais', 'secante', 2, 'numero', 0, NULL, 'Seja a função f(x) = cos(π(x + 1)/8 + 0,148x − 0,9062). Usando o método da Secante com x₀ = 3,0, x₁ = 4,0 e 3 iterações, encontre uma aproximação para a raiz.', '3,85482', '3,85482', 3.85481928052, 3.85482, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"cos(pi*(x+1)/8+0.148x-0.9062)","x0":3,"x1":4,"iteracoes":3}', 'Secante: 3 iterações; x = 3,854819. 3 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 3,000000 | 4,000000 | 0,445918 | −0,078418 | 3,850443 | 0,038842
2 | 4,000000 | 3,850443 | −0,078418 | 0,002366 | 3,854824 | 0,00113653
3 | 3,850443 | 3,854824 | 0,002366 | −0,000002 | 3,854819 | 1,132×10⁻⁶', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23', 'A', '4,00901', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23', 'B', '3,85482', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23', 'C', '−4,13899', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23', 'D', '3,50789', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-23-r', 'lista-01', '23ª · 1º passo', 'Zeros de Funções Reais', 'secante', 1, 'numero', 1, 'l01-zeros-23', 'Secante, 1º passo: f(x) = cos(π·(x + 1)/8 + 0,148x − 0,9062), x₀ = 3 e x₁ = 4. Qual é x₂?', NULL, '3,85044', 3.85044253686, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"secante","f":"cos(pi*(x+1)/8+0.148x-0.9062)","x0":3,"x1":4,"iteracoes":1}', 'Secante: 1 iteração; x = 3,850443. 1 iterações, como pedido.
i | xᵢ₋₁ | xᵢ | f(xᵢ₋₁) | f(xᵢ) | xᵢ₊₁ | Eᵣ%
1 | 3,000000 | 4,000000 | 0,445918 | −0,078418 | 3,850443 | 0,038842', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23-r', 'A', '3,85482', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23-r', 'B', '3,85044', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23-r', 'C', '−13,76026', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-23-r', 'D', '4,00446', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-24', 'lista-01', '24ª', 'Zeros de Funções Reais', 'falsa-posicao', 2, 'numero', 0, NULL, 'Seja a função f(x) = cos(π(x + 1)/8 + 0,148x − 0,9062). Usando o método da Falsa Posição no intervalo [3,0; 4,0] e 3 iterações, encontre uma aproximação para a raiz.', '3,85482', '3,85482', 3.85481928052, 3.85482, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"cos(pi*(x+1)/8+0.148x-0.9062)","a":3,"b":4,"iteracoes":3}', 'Falsa Posição: 3 iterações; x = 3,854819. 3 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,000000 | 4,000000 | 3,850443 | 0,445918 | −0,078418 | 0,002366 | —
2 | 3,850443 | 4,000000 | 3,854824 | 0,002366 | −0,078418 | −0,000002 | 0,00113653
3 | 3,850443 | 3,854824 | 3,854819 | 0,002366 | −0,000002 | 0,000000 | 1,132×10⁻⁶', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24', 'A', '3,85482', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24', 'B', '4,20175', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24', 'C', '3,87500', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24', 'D', '4,00901', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-24-r', 'lista-01', '24ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-24', 'Falsa Posição, 1º passo: f(x) = cos(π·(x + 1)/8 + 0,148x − 0,9062) em [3; 4]. Qual é x₁?', NULL, '3,85044', 3.85044253686, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"cos(pi*(x+1)/8+0.148x-0.9062)","a":3,"b":4,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 3,850443. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,000000 | 4,000000 | 3,850443 | 0,445918 | −0,078418 | 0,002366 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24-r', 'A', '4,00446', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24-r', 'B', '3,50000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24-r', 'C', '3,85482', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-24-r', 'D', '3,85044', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-25', 'lista-01', '25ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = cos(π(x + 1)/8 + 0,148x − 0,9062). Usando o método da Bisseção no intervalo [3,0; 4,0] e 4 iterações, encontre uma aproximação para a raiz.', '3,81250', '3,81250', 3.8125, 3.8125, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"cos(pi*(x+1)/8+0.148x-0.9062)","a":3,"b":4,"iteracoes":4}', 'Bisseção: 4 iterações; x = 3,812500. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,000000 | 4,000000 | 3,500000 | 0,445918 | −0,078418 | 0,190676 | —
2 | 3,500000 | 4,000000 | 3,750000 | 0,190676 | −0,078418 | 0,056645 | 0,066667
3 | 3,750000 | 4,000000 | 3,875000 | 0,056645 | −0,078418 | −0,010911 | 0,032258
4 | 3,750000 | 3,875000 | 3,812500 | 0,056645 | −0,010911 | 0,022880 | 0,016393', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25', 'A', '3,85482', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25', 'B', '3,87500', 0, 'Esse é o resultado com 3 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25', 'C', '3,81250', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25', 'D', '3,84375', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-25-r', 'lista-01', '25ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-25', 'Bisseção, 1º passo: f(x) = cos(π·(x + 1)/8 + 0,148x − 0,9062) em [3; 4]. Qual é x₁?', NULL, '3,50000', 3.5, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"cos(pi*(x+1)/8+0.148x-0.9062)","a":3,"b":4,"iteracoes":1}', 'Bisseção: 1 iteração; x = 3,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 3,000000 | 4,000000 | 3,500000 | 0,445918 | −0,078418 | 0,190676 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25-r', 'A', '3,75000', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25-r', 'B', '3,50000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25-r', 'C', '3,85044', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-25-r', 'D', '3,64000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-26', 'lista-01', '26ª', 'Zeros de Funções Reais', 'falsa-posicao', 2, 'numero', 0, NULL, 'Seja a função f(x) = √x − 5e⁻ˣ. Usando o método da Falsa Posição no intervalo [1,3; 1,6] e 3 iterações, encontre uma aproximação para a raiz.', '1,43047', '1,43047', 1.43047163218, 1.43047, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"sqrt(x)-5exp(-x)","a":1.3,"b":1.6,"iteracoes":3}', 'Falsa Posição: 3 iterações; x = 1,430472. 3 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,300000 | 1,600000 | 1,439660 | −0,222484 | 0,255428 | 0,014816 | —
2 | 1,300000 | 1,439660 | 1,430940 | −0,222484 | 0,014816 | 0,000798 | 0,00609384
3 | 1,300000 | 1,430940 | 1,430472 | −0,222484 | 0,000798 | 0,000043 | 0,000327293', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26', 'A', '1,43045', 0, 'Esse é o resultado com 4 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26', 'B', '1,41250', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26', 'C', '1,43047', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26', 'D', '1,43094', 0, 'Esse é o resultado com 2 iterações: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-26-r', 'lista-01', '26ª · 1º passo', 'Zeros de Funções Reais', 'falsa-posicao', 1, 'numero', 1, 'l01-zeros-26', 'Falsa Posição, 1º passo: f(x) = √x − 5e⁻ˣ em [1,3; 1,6]. Qual é x₁?', NULL, '1,43966', 1.43965972824, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"sqrt(x)-5exp(-x)","a":1.3,"b":1.6,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 1,439660. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,300000 | 1,600000 | 1,439660 | −0,222484 | 0,255428 | 0,014816 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26-r', 'A', '1,38207', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26-r', 'B', '1,43094', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26-r', 'C', '1,45000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-26-r', 'D', '1,43966', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-27', 'lista-01', '27ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = √x − 5e⁻ˣ. Usando o método da Bisseção no intervalo [1,25; 1,55] e 4 iterações, encontre uma aproximação para a raiz.', '1,418750', '1,418750', 1.41875, 1.41875, NULL, NULL, NULL, 6, NULL, '{"calc":"bissecao","f":"sqrt(x)-5exp(-x)","a":1.25,"b":1.55,"iteracoes":4}', 'Bisseção: 4 iterações; x = 1,418750. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,250000 | 1,550000 | 1,400000 | −0,314490 | 0,183750 | −0,049769 | —
2 | 1,400000 | 1,550000 | 1,475000 | −0,049769 | 0,183750 | 0,070602 | 0,050847
3 | 1,400000 | 1,475000 | 1,437500 | −0,049769 | 0,070602 | 0,011354 | 0,026087
4 | 1,400000 | 1,437500 | 1,418750 | −0,049769 | 0,011354 | −0,018969 | 0,013216', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27', 'A', '1,418750', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27', 'B', '1,430449', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27', 'C', '1,437500', 0, 'Esse é o resultado com 3 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27', 'D', '1,428125', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-27-r', 'lista-01', '27ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-27', 'Bisseção, 1º passo: f(x) = √x − 5e⁻ˣ em [1,25; 1,55]. Qual é x₁?', NULL, '1,400000', 1.4, NULL, NULL, NULL, NULL, 6, NULL, '{"calc":"bissecao","f":"sqrt(x)-5exp(-x)","a":1.25,"b":1.55,"iteracoes":1}', 'Bisseção: 1 iteração; x = 1,400000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 1,250000 | 1,550000 | 1,400000 | −0,314490 | 0,183750 | −0,049769 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27-r', 'A', '1,400000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27-r', 'B', '1,475000', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27-r', 'C', '1,456000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-27-r', 'D', '1,439361', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-28', 'lista-01', '28ª', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = x² − sen x. Usando o método da Bisseção no intervalo [0,86; 0,89] e 4 iterações, encontre uma aproximação para a raiz.', '0,87688', '0,87688', 0.876875, 0.87688, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"x^2-sin(x)","a":0.86,"b":0.89,"iteracoes":4}', 'Bisseção: 4 iterações; x = 0,876875. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,860000 | 0,890000 | 0,875000 | −0,018243 | 0,015028 | −0,001919 | —
2 | 0,875000 | 0,890000 | 0,882500 | −0,001919 | 0,015028 | 0,006477 | 0,00849858
3 | 0,875000 | 0,882500 | 0,878750 | −0,001919 | 0,006477 | 0,002260 | 0,00426743
4 | 0,875000 | 0,878750 | 0,876875 | −0,001919 | 0,002260 | 0,000166 | 0,00213828', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28', 'A', '0,87594', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28', 'B', '0,87673', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28', 'C', '0,87688', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28', 'D', '0,87875', 0, 'Esse é o resultado com 3 iterações: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l01-zeros-28-r', 'lista-01', '28ª · 1º passo', 'Zeros de Funções Reais', 'bissecao', 1, 'numero', 1, 'l01-zeros-28', 'Bisseção, 1º passo: f(x) = x² − sen x em [0,86; 0,89]. Qual é x₁?', NULL, '0,87500', 0.875, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"x^2-sin(x)","a":0.86,"b":0.89,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,875000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,860000 | 0,890000 | 0,875000 | −0,018243 | 0,015028 | −0,001919 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28-r', 'A', '0,88250', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28-r', 'B', '0,87500', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28-r', 'C', '0,87645', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l01-zeros-28-r', 'D', '0,84000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

-- ======================================================================
-- Lista 2 — Resolução de sistemas lineares (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-01', 'lista-02', '1ª', 'Resolução de Sistemas Lineares', 'lu', 2, 'sistema', 0, NULL, 'Depois de aplicar o processo de fatoração LU ao sistema AX = B, com B = (9; 3; −2)ᵀ, foram encontradas as matrizes U = [3 −4 1; 0 10/3 5/3; 0 0 −7] e L = [1 0 0; 1/3 1 0; 4/3 8/5 1]. Qual é o sistema AX = B?', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', NULL, NULL, NULL, NULL, '{"A":[[3,-4,1],[1,2,2],[4,0,-3]],"b":[9,3,-2]}', 4, NULL, '{"calc":"lu-sistema","L":[[1,0,0],[0.3333333333333333,1,0],[1.3333333333333333,1.6,1]],"U":[[3,-4,1],[0,3.3333333333333335,1.6666666666666667],[0,0,-7]],"b":[9,3,-2]}', 'A = L·U (multiplique as matrizes) e o lado direito é o próprio B.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-01', 'A', '3x₁ − 2,4x₂ + x₃ = 9; (10/3)x₁ + 6x₂ + (5/3)x₃ = 3; −(28/3)x₁ − 11,2x₂ − 7x₃ = −2', 0, 'Multiplicou U·L; o certo é A = L·U.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-01', 'B', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-01', 'C', '3x₁ − 4x₂ + x₃ = 9; −x₁ + (14/3)x₂ + (4/3)x₃ = 3; −4x₁ − 11x₃ = −2', 0, 'Sinal dos multiplicadores trocado em L.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-01', 'D', '3x₁ − 4x₂ + x₃ = 9; (10/3)x₂ + (5/3)x₃ = 3; −7x₃ = −2', 0, 'Esse é o sistema triangular U·X = B: faltou multiplicar por L (A = L·U).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-02', 'lista-02', '2ª', 'Resolução de Sistemas Lineares', 'erro-vetor', 1, 'numero', 1, NULL, 'Um processo iterativo para a determinação do vetor solução de um sistema linear fornece, nos passos k e k + 1, x⁽ᵏ⁾ = (1,573; 0,988; −2,034) e x⁽ᵏ⁺¹⁾ = (1,512; 1,012; −2,008). Qual a melhor aproximação do erro relativo?', '3%', '3%', 3.03784860558, 3, NULL, NULL, NULL, 0, 0.1, '{"calc":"erro-vetor","novo":[1.512,1.012,-2.008],"velho":[1.573,0.988,-2.034],"percentual":true}', 'd = máx|Δx| / máx|x| = 0,06100 / 2,00800 = 0,0304 = 3,04%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-02', 'A', '0%', 0, 'Esse é o erro relativo sem multiplicar por 100: a questão pede em porcentagem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-02', 'B', '3%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-02', 'C', '6%', 0, 'Somou todas as diferenças; o critério usa só a maior delas, máx|Δx|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-02', 'D', '9%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-03', 'lista-02', '3ª', 'Resolução de Sistemas Lineares', 'lu', 1, 'texto', 1, NULL, 'Considere o sistema linear Ma = c, com M ∈ ℝⁿˣⁿ e c ∈ ℝⁿ. Suponha que são conhecidas duas matrizes quadradas Q e R tais que QR = M, onde Q é triangular inferior e R é triangular superior. Então, pode-se resolver o sistema Ma = c resolvendo-se quais sistemas lineares?', 'Qb = c e Ra = b', 'Qb = c e Ra = b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Ma = c ⇔ Q(Ra) = c. Chamando b = Ra: primeiro Qb = c (substituição progressiva, Q é triangular inferior) e depois Ra = b (substituição regressiva, R é triangular superior)."}', 'Ma = c ⇔ Q(Ra) = c. Chamando b = Ra: primeiro Qb = c (substituição progressiva, Q é triangular inferior) e depois Ra = b (substituição regressiva, R é triangular superior).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-03', 'A', 'Ra = c e Qb = a', 0, 'A ordem é ao contrário: Q (inferior) recebe o lado direito c.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-03', 'B', 'Qa = c e Rb = a', 0, 'A incógnita a aparece no sistema com R, porque M·a = Q·(R·a).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-03', 'C', 'Rb = c e Qa = b', 0, 'R é a triangular superior: ela fica com a incógnita original a, no segundo sistema.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-03', 'D', 'Qb = c e Ra = b', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-04', 'lista-02', '4ª', 'Resolução de Sistemas Lineares', 'gauss', 2, 'matriz', 0, NULL, 'Depois da primeira etapa do Método de Eliminação de Gauss efetuada sobre a matriz ampliada [A|B] = [−2 5 −3 | 1; 3 2 −2 | −5; 5 1 3 | 8], qual é [A⁽¹⁾|B⁽¹⁾]?', '[−2 5 −3 | 1; 0 19/2 −13/2 | −7/2; 0 27/2 −9/2 | 21/2]', '[−2 5 −3 | 1; 0 9,5 −6,5 | −3,5; 0 13,5 −4,5 | 10,5]', NULL, NULL, NULL, NULL, '[[-2,5,-3,1],[0,9.5,-6.5,-3.5],[0,13.5,-4.5,10.5]]', 4, NULL, '{"calc":"gauss-etapa","A":[[-2,5,-3],[3,2,-2],[5,1,3]],"b":[1,-5,8],"etapa":1}', 'E₂⁽¹⁾ → E₂⁽⁰⁾ − (−3/2)E₁⁽⁰⁾; E₃⁽¹⁾ → E₃⁽⁰⁾ − (−5/2)E₁⁽⁰⁾', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04', 'A', '[−2 5 −3 | 1; 6 −5,5 2,5 | −6,5; 10 −11,5 10,5 | 5,5]', 0, 'Somou m·E₁ em vez de subtrair: Eᵢ⁽¹⁾ → Eᵢ⁽⁰⁾ − mᵢ₁E₁⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04', 'B', '[−2 5 −3 | 1; 5/3 16/3 −4 | −13/3; 4,2 3 1,8 | 8,4]', 0, 'Multiplicador invertido: mᵢ₁ = aᵢ₁/a₁₁ (o pivô fica no denominador).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04', 'C', '[−2 5 −3 | 1; 0 9,5 −6,5 | −5; 0 13,5 −4,5 | 8]', 0, 'Esqueceu de aplicar a operação ao lado direito B.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04', 'D', '[−2 5 −3 | 1; 0 9,5 −6,5 | −3,5; 0 13,5 −4,5 | 10,5]', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-04-r', 'lista-02', '4ª · multiplicador', 'Resolução de Sistemas Lineares', 'gauss', 1, 'numero', 1, 'l02-04', 'Etapa 1 da Eliminação de Gauss em [A|B] = [−2 5 −3 | 1; 3 2 −2 | −5; 5 1 3 | 8]: qual é o multiplicador m₂₁?', NULL, '−1,5000', -1.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"gauss-multiplicador","A":[[-2,5,-3],[3,2,-2],[5,1,3]],"i":2,"k":1}', 'm₂₁ = a₂₁/a₁₁ = 3/−2 = −1,5000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04-r', 'A', '−1,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04-r', 'B', '−0,6667', 0, 'Fração invertida: mᵢₖ = aᵢₖ/aₖₖ (o pivô fica no denominador).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04-r', 'C', '1,5000', 0, 'Sinal trocado: mᵢₖ = aᵢₖ/aₖₖ, e a operação é Eᵢ − mᵢₖEₖ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-04-r', 'D', '−1,4400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-05', 'lista-02', '5ª', 'Resolução de Sistemas Lineares', 'lu', 2, 'sistema', 0, NULL, 'Depois de aplicar o processo de fatoração LU ao sistema Ax = b, com b = (3; 5; 1)ᵀ, foram encontradas as matrizes U = [2 −3 5; 0 −1 4; 0 0 3] e L = [1 0 0; 1 1 0; −2 −1 1]. Qual é o sistema Ax = b?', '2x₁ − 3x₂ + 5x₃ = 3; 2x₁ − 4x₂ + 9x₃ = 5; −4x₁ + 7x₂ − 11x₃ = 1', '2x₁ − 3x₂ + 5x₃ = 3; 2x₁ − 4x₂ + 9x₃ = 5; −4x₁ + 7x₂ − 11x₃ = 1', NULL, NULL, NULL, NULL, '{"A":[[2,-3,5],[2,-4,9],[-4,7,-11]],"b":[3,5,1]}', 4, NULL, '{"calc":"lu-sistema","L":[[1,0,0],[1,1,0],[-2,-1,1]],"U":[[2,-3,5],[0,-1,4],[0,0,3]],"b":[3,5,1]}', 'A = L·U (multiplique as matrizes) e o lado direito é o próprio B.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-05', 'A', '2x₁ − 3x₂ + 5x₃ = 3; 2x₁ − 4x₂ + 9x₃ = 5; −4x₁ + 7x₂ − 11x₃ = 1', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-05', 'B', '2x₁ − 3x₂ + 5x₃ = 3; −x₂ + 4x₃ = 5; 3x₃ = 1', 0, 'Esse é o sistema triangular U·X = B: faltou multiplicar por L (A = L·U).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-05', 'C', '−11x₁ − 8x₂ + 5x₃ = 3; −9x₁ − 5x₂ + 4x₃ = 5; −6x₁ − 3x₂ + 3x₃ = 1', 0, 'Multiplicou U·L; o certo é A = L·U.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-05', 'D', '2x₁ − 3x₂ + 5x₃ = 3; −2x₁ + 2x₂ − x₃ = 5; 4x₁ − 7x₂ + 17x₃ = 1', 0, 'Sinal dos multiplicadores trocado em L.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-06', 'lista-02', '6ª', 'Resolução de Sistemas Lineares', 'erro-vetor', 1, 'numero', 1, NULL, 'Um processo iterativo fornece, nos passos 6 e 7, x⁽⁶⁾ = (7,079; 2,038; 0,971) e x⁽⁷⁾ = (6,991; 1,981; 1,009). Qual a melhor aproximação do erro relativo?', '1,3%', '1,3%', 1.25876126448, 1.3, NULL, NULL, NULL, 1, NULL, '{"calc":"erro-vetor","novo":[6.991,1.981,1.009],"velho":[7.079,2.038,0.971],"percentual":true}', 'd = máx|Δx| / máx|x| = 0,08800 / 6,99100 = 0,0126 = 1,26%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-06', 'A', '0,0%', 0, 'Esse é o erro relativo sem multiplicar por 100: a questão pede em porcentagem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-06', 'B', '1,3%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-06', 'C', '2,6%', 0, 'Somou todas as diferenças; o critério usa só a maior delas, máx|Δx|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-06', 'D', '0,1%', 0, 'Esse é o erro absoluto máx|Δx|: faltou dividir pelo maior |x|.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-07', 'lista-02', '7ª', 'Resolução de Sistemas Lineares', 'lu', 2, 'matriz', 0, NULL, 'Dada a matriz A = [1 1 1; 2 1 −1; 3 2 0], determine as matrizes L e U da fatoração LU.', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', NULL, NULL, NULL, NULL, '{"L":[[1,0,0],[2,1,0],[3,1,1]],"U":[[1,1,1],[0,-1,-3],[0,0,0]]}', 4, NULL, '{"calc":"lu","A":[[1,1,1],[2,1,-1],[3,2,0]]}', 'L guarda os multiplicadores; U é a matriz triangular superior da eliminação. det(A) = 0.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-07', 'A', 'L = [1 0 0; 1 −1 0; 1 −3 0] e U = [1 2 3; 0 1 1; 0 0 1]', 0, 'Matrizes transpostas: L é a triangular inferior com 1 na diagonal, U é a triangular superior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-07', 'B', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-07', 'C', 'L = [1 0 0; −2 1 0; −3 −1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 0, 'Sinal dos multiplicadores trocado: em L ficam os mᵢₖ = aᵢₖ/aₖₖ, com o mesmo sinal.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-07', 'D', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 2]', 0, 'A última etapa não confere: refaça E₃ − m₃₂E₂.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-08', 'lista-02', '7ª (repetida)', 'Resolução de Sistemas Lineares', 'lu', 2, 'sistema', 0, NULL, 'Depois de aplicar o processo de fatoração LU ao sistema AX = B, com B = (1; 4; 4)ᵀ, foram encontradas as matrizes U = [1 1 1; 0 −1 −3; 0 0 1] e L = [1 0 0; 2 1 0; 3 1 1]. Qual é o sistema AX = B?', 'x₁ + x₂ + x₃ = 1; 2x₁ + x₂ − x₃ = 4; 3x₁ + 2x₂ + x₃ = 4', 'x₁ + x₂ + x₃ = 1; 2x₁ + x₂ − x₃ = 4; 3x₁ + 2x₂ + x₃ = 4', NULL, NULL, NULL, NULL, '{"A":[[1,1,1],[2,1,-1],[3,2,1]],"b":[1,4,4]}', 4, NULL, '{"calc":"lu-sistema","L":[[1,0,0],[2,1,0],[3,1,1]],"U":[[1,1,1],[0,-1,-3],[0,0,1]],"b":[1,4,4]}', 'A = L·U (multiplique as matrizes) e o lado direito é o próprio B.', 'Na lista esta questão aparece numerada de novo como 7ª.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-08', 'A', 'x₁ + x₂ + x₃ = 1; 2x₁ + x₂ − x₃ = 4; 3x₁ + 2x₂ + x₃ = 4', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-08', 'B', 'x₁ + x₂ + x₃ = 1; −x₂ − 3x₃ = 4; x₃ = 4', 0, 'Esse é o sistema triangular U·X = B: faltou multiplicar por L (A = L·U).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-08', 'C', '6x₁ + 2x₂ + x₃ = 1; −11x₁ − 4x₂ − 3x₃ = 4; 3x₁ + x₂ + x₃ = 4', 0, 'Multiplicou U·L; o certo é A = L·U.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-08', 'D', 'x₁ + x₂ + x₃ = 1; −2x₁ − 3x₂ − 5x₃ = 4; −3x₁ − 2x₂ + x₃ = 4', 0, 'Sinal dos multiplicadores trocado em L.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-09', 'lista-02', '9ª', 'Resolução de Sistemas Lineares', 'erro-vetor', 1, 'numero', 1, NULL, 'Um processo iterativo fornece, nos passos 8 e 9, x⁽⁸⁾ = (0,17780; 0,66953; −0,59288; −0,21891; −0,59286) e x⁽⁹⁾ = (0,15008; 0,64623; −0,60945; −0,25199; −0,60947). Determine o erro relativo.', '0,051', '0,051', 0.0511892050818, 0.051, NULL, NULL, NULL, 3, NULL, '{"calc":"erro-vetor","novo":[0.15008,0.64623,-0.60945,-0.25199,-0.60947],"velho":[0.1778,0.66953,-0.59288,-0.21891,-0.59286]}', 'd = máx|Δx| / máx|x| = 0,03308 / 0,64623 = 0,0512.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-09', 'A', '5,119', 0, 'Esse é o erro em porcentagem; a questão pede o valor relativo, sem multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-09', 'B', '0,051', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-09', 'C', '0,049', 0, 'Dividiu pelo maior |x| da iteração anterior; o critério usa o vetor novo: d = máx|Δx| / máx|x⁽ᵏ⁺¹⁾|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-09', 'D', '0,181', 0, 'Somou todas as diferenças; o critério usa só a maior delas, máx|Δx|.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-10', 'lista-02', '10ª', 'Resolução de Sistemas Lineares', 'pivoteamento', 3, 'texto', 0, NULL, 'Resolva o sistema 10⁻⁸x₁ + x₂ = 2 + 10⁻⁸; x₁ + x₂ = 3 por eliminação gaussiana (EG) e por eliminação gaussiana com pivoteamento parcial (EGPP), num sistema de ponto flutuante de base 10 com precisão 5 (mantissa de 5 dígitos) e expoentes entre −10 e 10. Quais são os resultados?', 'EG = (0; 2), EGPP = (1; 2)', 'EG = (0,0000; 2,0000), EGPP = (1,0000; 2,0000)', NULL, NULL, '[0,2,1,2]', '[0,2,1,2]', NULL, NULL, NULL, '{"calc":"gauss-eg-egpp","A":[[1e-8,1],[1,1]],"b":[2.00000001,3],"t":5}', 'Com 5 dígitos na mantissa: sem pivoteamento, EG = (0,0000; 2,0000); com pivoteamento parcial (troca para o maior |aᵢ₁|), EGPP = (1,0000; 2,0000).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-10', 'A', 'EG = (1; 2), EGPP = (0; 2)', 0, 'É o contrário: o pivoteamento parcial é que salva o x₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-10', 'B', 'EG = (0; 2), EGPP = (1; 2)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-10', 'C', 'EG = (0; 2), EGPP = (0; 2)', 0, 'Com a troca de linhas o multiplicador fica 10⁻⁸ e o x₁ = 1 aparece certo.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-10', 'D', 'EG = (1; 2), EGPP = (1; 2)', 0, 'Com só 5 dígitos, o pivô 10⁻⁸ gera m₂₁ = 10⁸ e o x₁ da EG se perde.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-11', 'lista-02', '11ª', 'Resolução de Sistemas Lineares', 'pivoteamento', 3, 'texto', 0, NULL, 'Resolva o sistema 10⁻⁵x₁ + x₂ = 2 + 10⁻⁵; x₁ + x₂ = 3 por EG e por EGPP, num sistema de ponto flutuante de base 10 com precisão 10 e expoentes entre −10 e 10. Quais são os resultados?', 'EG = (1; 2), EGPP = (1; 2)', 'EG = (1,0000; 2,0000), EGPP = (1,0000; 2,0000)', NULL, NULL, '[1,2,1,2]', '[1,2,1,2]', NULL, NULL, NULL, '{"calc":"gauss-eg-egpp","A":[[0.00001,1],[1,1]],"b":[2.00001,3],"t":10}', 'Com 10 dígitos na mantissa: sem pivoteamento, EG = (1,0000; 2,0000); com pivoteamento parcial (troca para o maior |aᵢ₁|), EGPP = (1,0000; 2,0000).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-11', 'A', 'EG = (0; 3), EGPP = (1; 2)', 0, 'x₂ = 2 sai igual nas duas: só x₁ corre risco.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-11', 'B', 'EG = (0; 2), EGPP = (1; 2)', 0, 'Isso acontece com 5 dígitos e pivô 10⁻⁸ (questão anterior). Com 10 dígitos o 10⁻⁵ ainda cabe na conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-11', 'C', 'EG = (1; 2), EGPP = (0; 2)', 0, 'O pivoteamento parcial nunca piora este caso.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-11', 'D', 'EG = (1; 2), EGPP = (1; 2)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-12', 'lista-02', '12ª', 'Resolução de Sistemas Lineares', 'pivoteamento', 2, 'texto', 0, NULL, 'Durante o uso do algoritmo de eliminação gaussiana com pivoteamento parcial, ao encontrarmos um pivô nulo, qual ou quais das três situações são possíveis? 1. O sistema tem uma única solução. 2. O sistema tem infinitas soluções. 3. O sistema não tem solução.', 'Todas as três podem ocorrer', 'Todas as três podem ocorrer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Um zero na posição do pivô, por si só, não decide nada: se existir um elemento não nulo abaixo dele, trocamos as linhas (pivoteamento) e a solução pode ser única. Se a coluna inteira abaixo for nula, A é singular e o sistema tem infinitas soluções ou nenhuma, conforme o lado direito (slides: sistemas singulares)."}', 'Um zero na posição do pivô, por si só, não decide nada: se existir um elemento não nulo abaixo dele, trocamos as linhas (pivoteamento) e a solução pode ser única. Se a coluna inteira abaixo for nula, A é singular e o sistema tem infinitas soluções ou nenhuma, conforme o lado direito (slides: sistemas singulares).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-12', 'A', 'Nenhuma: o algoritmo sempre para com erro', 0, 'O pivoteamento existe justamente para contornar o pivô nulo.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-12', 'B', 'Todas as três podem ocorrer', 1, 'Se houver um elemento não nulo abaixo, a troca de linhas resolve e a solução pode ser única; se a coluna inteira for nula, A é singular e sobram infinitas soluções ou nenhuma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-12', 'C', 'Só a 2 e a 3', 0, 'Um zero na diagonal antes da troca não impede solução única: basta trocar a equação pivô.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-12', 'D', 'Só a 1 (solução única)', 0, 'Quando toda a coluna é nula, a matriz é singular e não há solução única.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-13', 'lista-02', '13ª', 'Resolução de Sistemas Lineares', 'lu', 1, 'numero', 1, NULL, 'Considere a matriz B = LU, onde L = [1 0 0 0; 1/2 1 0 0; 0 −1/4 1 0; 0 0 −2 1] e U = [2 −4 0 0; 0 4 12 0; 0 0 −1 −5; 0 0 0 1]. Qual o determinante de B?', '−8', '−8', -8, -8, NULL, NULL, NULL, 0, NULL, '{"calc":"det-lu","L":[[1,0,0,0],[0.5,1,0,0],[0,-0.25,1,0],[0,0,-2,1]],"U":[[2,-4,0,0],[0,4,12,0],[0,0,-1,-5],[0,0,0,1]]}', 'det(B) = det(L)·det(U) = 1 · (2 · 4 · −1 · 1) = −8.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-13', 'A', '−5', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-13', 'B', '−8', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-13', 'C', '6', 0, 'Isso é a soma da diagonal de U (o traço); o determinante é o produto.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-13', 'D', '8', 0, 'Sinal trocado: det(B) = det(L)·det(U), com det(L) = 1.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-14', 'lista-02', '14ª', 'Resolução de Sistemas Lineares', 'lu', 2, 'matriz', 0, NULL, 'Dada a matriz A = [1 1 1; 2 1 −1; 3 2 0], determine as matrizes L e U.', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', NULL, NULL, NULL, NULL, '{"L":[[1,0,0],[2,1,0],[3,1,1]],"U":[[1,1,1],[0,-1,-3],[0,0,0]]}', 4, NULL, '{"calc":"lu","A":[[1,1,1],[2,1,-1],[3,2,0]]}', 'L guarda os multiplicadores; U é a matriz triangular superior da eliminação. det(A) = 0.', 'Igual à 7ª questão desta lista.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-14', 'A', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 2]', 0, 'A última etapa não confere: refaça E₃ − m₃₂E₂.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-14', 'B', 'L = [1 0 0; 2 1 0; 3 1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-14', 'C', 'L = [1 0 0; 1 −1 0; 1 −3 0] e U = [1 2 3; 0 1 1; 0 0 1]', 0, 'Matrizes transpostas: L é a triangular inferior com 1 na diagonal, U é a triangular superior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-14', 'D', 'L = [1 0 0; −2 1 0; −3 −1 1] e U = [1 1 1; 0 −1 −3; 0 0 0]', 0, 'Sinal dos multiplicadores trocado: em L ficam os mᵢₖ = aᵢₖ/aₖₖ, com o mesmo sinal.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-15', 'lista-02', '15ª', 'Resolução de Sistemas Lineares', 'gauss', 2, 'matriz', 0, NULL, 'Depois da primeira etapa do Método de Eliminação de Gauss sobre [A|B] = [−2 5 −3 | 1; 3 2 −2 | −5; 5 1 3 | 8], qual é [A⁽¹⁾|B⁽¹⁾]?', '[−2 5 −3 | 1; 0 19/2 −13/2 | −7/2; 0 27/2 −9/2 | 21/2]', '[−2 5 −3 | 1; 0 9,5 −6,5 | −3,5; 0 13,5 −4,5 | 10,5]', NULL, NULL, NULL, NULL, '[[-2,5,-3,1],[0,9.5,-6.5,-3.5],[0,13.5,-4.5,10.5]]', 4, NULL, '{"calc":"gauss-etapa","A":[[-2,5,-3],[3,2,-2],[5,1,3]],"b":[1,-5,8],"etapa":1}', 'E₂⁽¹⁾ → E₂⁽⁰⁾ − (−3/2)E₁⁽⁰⁾; E₃⁽¹⁾ → E₃⁽⁰⁾ − (−5/2)E₁⁽⁰⁾', 'Igual à 4ª questão desta lista.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-15', 'A', '[−2 5 −3 | 1; 6 −5,5 2,5 | −6,5; 10 −11,5 10,5 | 5,5]', 0, 'Somou m·E₁ em vez de subtrair: Eᵢ⁽¹⁾ → Eᵢ⁽⁰⁾ − mᵢ₁E₁⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-15', 'B', '[−2 5 −3 | 1; 0 9,5 −6,5 | −5; 0 13,5 −4,5 | 8]', 0, 'Esqueceu de aplicar a operação ao lado direito B.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-15', 'C', '[−2 5 −3 | 1; 0 9,5 −6,5 | −3,5; 0 13,5 −4,5 | 10,5]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-15', 'D', '[−2 5 −3 | 1; 5/3 16/3 −4 | −13/3; 4,2 3 1,8 | 8,4]', 0, 'Multiplicador invertido: mᵢ₁ = aᵢ₁/a₁₁ (o pivô fica no denominador).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-16', 'lista-02', '16ª', 'Resolução de Sistemas Lineares', 'criterios', 2, 'numero', 0, NULL, 'Seja o sistema linear x₁ + 0,4x₂ − 0,1x₃ + 0,1x₄ = 0,3; 0,3x₁ + 0,2x₂ − 0,2x₃ − 0,1x₄ = −2,5; −0,1x₁ − 0,2x₂ + 0,6x₃ + 0,2x₄ = 1,2; 0,1x₁ + 0,3x₂ + 0,2x₃ + x₄ = −2,4. Para essa disposição de linhas e colunas, o critério de Sassenfeld fornece que valor para β?', 'β = 0,6', '2,40', 2.4, 0.6, NULL, NULL, NULL, 2, NULL, '{"calc":"sassenfeld","A":[[1,0.4,-0.1,0.1],[0.3,0.2,-0.2,-0.1],[-0.1,-0.2,0.6,0.2],[0.1,0.3,0.2,1]]}', 'β = (0,6000; 2,4000; 1,2333; 1,0267); β = máx βᵢ = 2,4000.', 'O gabarito da lista (β = 0,6) é só o β₁. O critério de Sassenfeld usa β = máx βᵢ, e aqui β₂ = 2,4: como β > 1, o critério não garante a convergência nessa disposição.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16', 'A', '2,40', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16', 'B', '3,00', 0, 'Esse é o máx αᵢ do critério das linhas, não o β de Sassenfeld.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16', 'C', '0,60', 0, 'Esse é só o β₁. O critério de Sassenfeld usa β = máx βᵢ. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16', 'D', '1,23', 0, 'Esse é o β₃; o critério usa o maior βᵢ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-16-r', 'lista-02', '16ª · β₁', 'Resolução de Sistemas Lineares', 'criterios', 1, 'numero', 1, 'l02-16', 'Critério de Sassenfeld para A = [1 0,4 −0,1 0,1; 0,3 0,2 −0,2 −0,1; −0,1 −0,2 0,6 0,2; 0,1 0,3 0,2 1]: qual é β₁ = (|a₁₂| + … + |a₁ₙ|)/|a₁₁|?', NULL, '0,6000', 0.6, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"sassenfeld","A":[[1,0.4,-0.1,0.1],[0.3,0.2,-0.2,-0.1],[-0.1,-0.2,0.6,0.2],[0.1,0.3,0.2,1]],"indice":1}', 'β₁ = 0,6000 (β = (0,6000; 2,4000; 1,2333; 1,0267)).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16-r', 'A', '3,0000', 0, 'Esse é o máx αᵢ do critério das linhas, não o β de Sassenfeld.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16-r', 'B', '0,6000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16-r', 'C', '2,4000', 0, 'Esse é o β₂.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-16-r', 'D', '1,2333', 0, 'Esse é o β₃.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-17', 'lista-02', '17ª', 'Resolução de Sistemas Lineares', 'erro-vetor', 1, 'numero', 1, NULL, 'Um processo iterativo fornece, nos passos 8 e 9, x⁽⁸⁾ = (−0,17621; −0,63841; 0,57311; 0,20738; 0,57194) e x⁽⁹⁾ = (−0,15998; −0,64912; 0,61725; 0,26008; 0,61336). Qual a melhor aproximação do erro relativo no 9º passo?', '6,4%', '8,1%', 8.11868375647, 6.4, NULL, NULL, NULL, 1, NULL, '{"calc":"erro-vetor","novo":[-0.15998,-0.64912,0.61725,0.26008,0.61336],"velho":[-0.17621,-0.63841,0.57311,0.20738,0.57194],"percentual":true}', 'd = máx|Δx| / máx|x| = 0,05270 / 0,64912 = 0,0812 = 8,12%.', 'O gabarito da lista (6,4%) não sai da fórmula d = máx|Δx| / máx|x|: a maior diferença é 0,05270 (4ª componente) e o maior |x⁽⁹⁾| é 0,64912, o que dá 8,1%.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-17', 'A', '8,3%', 0, 'Dividiu pelo maior |x| da iteração anterior; o critério usa o vetor novo: d = máx|Δx| / máx|x⁽ᵏ⁺¹⁾|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-17', 'B', '0,1%', 0, 'Esse é o erro relativo sem multiplicar por 100: a questão pede em porcentagem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-17', 'C', '8,1%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-17', 'D', '25,4%', 0, 'Somou todas as diferenças; o critério usa só a maior delas, máx|Δx|.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l02-18', 'lista-02', '18ª', 'Resolução de Sistemas Lineares', 'erro-vetor', 1, 'numero', 1, NULL, 'Um processo iterativo fornece, nos passos 6 e 7, x⁽⁶⁾ = (0,16791; 0,71865; −0,53142; −0,22716; −0,59173) e x⁽⁷⁾ = (0,17382; 0,73170; −0,51010; −0,18119; −0,57937). Qual a melhor aproximação do erro relativo na 7ª iteração?', '0,063', '0,063', 0.0628262949296, 0.063, NULL, NULL, NULL, 3, NULL, '{"calc":"erro-vetor","novo":[0.17382,0.7317,-0.5101,-0.18119,-0.57937],"velho":[0.16791,0.71865,-0.53142,-0.22716,-0.59173]}', 'd = máx|Δx| / máx|x| = 0,04597 / 0,73170 = 0,0628.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-18', 'A', '0,063', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-18', 'B', '0,064', 0, 'Dividiu pelo maior |x| da iteração anterior; o critério usa o vetor novo: d = máx|Δx| / máx|x⁽ᵏ⁺¹⁾|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-18', 'C', '6,283', 0, 'Esse é o erro em porcentagem; a questão pede o valor relativo, sem multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l02-18', 'D', '0,135', 0, 'Somou todas as diferenças; o critério usa só a maior delas, máx|Δx|.');

-- ======================================================================
-- Lista 3 — Gauss-Jacobi e Gauss-Seidel (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-01', 'lista-03', '1ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Efetuando os cálculos com três casas decimais e apenas duas iterações, determine a solução do sistema AX = B pelo método de Gauss-Seidel, onde A = [8 1 −1; 1 −7 2; 2 1 9], B = (8; −4; 12) e X⁽⁰⁾ = (0; 0; 0).', '(1,03968; 1,01474; 0,98954)', '(1,0397; 1,0147; 0,9895)', NULL, NULL, '[1.03968253968,1.01473922902,0.989543965734]', '[1.03968,1.01474,0.98954]', NULL, 4, 0.002, '{"calc":"seidel","A":[[8,1,-1],[1,-7,2],[2,1,9]],"b":[8,-4,12],"x0":[0,0,0],"iteracoes":2}', 'Gauss-Seidel: X⁽2⁾ = (1,03968; 1,01474; 0,98954).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 0,71429 | 1,03175 | 1,00000
2 | 1,03968 | 1,01474 | 0,98954 | 0,28899', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01', 'A', '(1,0397; 1,0147; 0,9895)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01', 'B', '(1,0952; 1,0952; 1,0476)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01', 'C', '(1,0000; 0,7143; 1,0317)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01', 'D', '(0,9969; 0,9966; 1,0011)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-01-r', 'lista-03', '1ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-01', 'Gauss-Seidel, 1ª iteração: A = [8 1 −1; 1 −7 2; 2 1 9], B = (8; −4; 12) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '1,0000', 1, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[8,1,-1],[1,-7,2],[2,1,9]],"b":[8,-4,12],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 1,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 0,71429 | 1,03175 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01-r', 'A', '1,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01-r', 'B', '8,0000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01-r', 'C', '1,0400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-01-r', 'D', '1,0000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-02', 'lista-03', '2ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Efetuando os cálculos com três casas decimais e apenas duas iterações, determine a solução do sistema AX = B pelo método de Gauss-Jacobi, onde A = [8 1 −1; 1 −7 2; 2 1 9], B = (8; −4; 12) e X⁽⁰⁾ = (0; 0; 0).', '(1,0952; 1,0952; 1,0476)', '(1,0952; 1,0952; 1,0476)', NULL, NULL, '[1.09523809524,1.09523809524,1.04761904762]', '[1.0952,1.0952,1.0476]', NULL, 4, 0.002, '{"calc":"jacobi","A":[[8,1,-1],[1,-7,2],[2,1,9]],"b":[8,-4,12],"x0":[0,0,0],"iteracoes":2}', 'Gauss-Jacobi: X⁽2⁾ = (1,09524; 1,09524; 1,04762).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 0,57143 | 1,33333 | 1,00000
2 | 1,09524 | 1,09524 | 1,04762 | 0,47826', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02', 'A', '(1,0952; 1,0952; 1,0476)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02', 'B', '(1,0397; 1,0147; 0,9895)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02', 'C', '(1,0000; 0,5714; 1,3333)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02', 'D', '(0,9940; 1,0272; 0,9683)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-02-r', 'lista-03', '2ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-02', 'Gauss-Jacobi, 1ª iteração: A = [8 1 −1; 1 −7 2; 2 1 9], B = (8; −4; 12) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '1,0000', 1, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[8,1,-1],[1,-7,2],[2,1,9]],"b":[8,-4,12],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 1,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 0,57143 | 1,33333 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02-r', 'A', '1,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02-r', 'B', '1,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02-r', 'C', '8,0000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-02-r', 'D', '1,0400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-03', 'lista-03', '3ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'vetor', 0, NULL, 'Considere o sistema x₁ + x₂ + x₃ = 10; x₁ − 2x₂ + x₃ = 4; x₁ + x₃ = 8 e o vetor obtido no passo 6 pelo método de Gauss-Seidel, x⁽⁶⁾ = (7,079; 2,038; 0,971). Obtenha o resultado para o 7º passo.', '(6,991; 1,981; 1,009)', '(6,991; 1,981; 1,009)', NULL, NULL, '[6.991,1.981,1.009]', '[6.991,1.981,1.009]', NULL, 3, NULL, '{"calc":"seidel","A":[[1,1,1],[1,-2,1],[1,0,1]],"b":[10,4,8],"x0":[7.079,2.038,0.971],"iteracoes":1}', 'Gauss-Seidel: X⁽1⁾ = (6,99100; 1,98100; 1,00900).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 7,07900 | 2,03800 | 0,97100 | —
1 | 6,99100 | 1,98100 | 1,00900 | 0,01259', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03', 'A', '(6,991; 2,025; 0,921)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03', 'B', '(7,010; 2,010; 0,990)', 0, 'Esse é o vetor depois de 2 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03', 'C', '(6,991; 1,981; 1,009)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03', 'D', '(6,991; 1,981; −1,009)', 0, 'Sinal da última componente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-03-r', 'lista-03', '3ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-03', 'Gauss-Seidel, 1ª iteração: A = [1 1 1; 1 −2 1; 1 0 1], B = (10; 4; 8) e X⁽⁰⁾ = (7,079; 2,038; 0,971). Qual é x₁⁽¹⁾?', NULL, '6,9910', 6.991, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[1,1,1],[1,-2,1],[1,0,1]],"b":[10,4,8],"x0":[7.079,2.038,0.971],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 6,99100.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 7,07900 | 2,03800 | 0,97100 | —
1 | 6,99100 | 1,98100 | 1,00900 | 0,01259', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03-r', 'A', '13,0090', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03-r', 'B', '0,1430', 0, 'Fração invertida: divide-se por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03-r', 'C', '10,0000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-03-r', 'D', '6,9910', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-04', 'lista-03', '4ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'vetor', 0, NULL, 'Considere o sistema x₁ + x₂ + x₃ = 10; x₁ − 2x₂ + x₃ = 4; x₁ + x₃ = 8 e o vetor obtido no passo 6 pelo método de Gauss-Jacobi, x⁽⁶⁾ = (7,079; 2,038; 0,971). Obtenha o resultado para o 7º passo.', '(6,991; 2,025; 0,921)', '(6,991; 2,025; 0,921)', NULL, NULL, '[6.991,2.025,0.921]', '[6.991,2.025,0.921]', NULL, 3, NULL, '{"calc":"jacobi","A":[[1,1,1],[1,-2,1],[1,0,1]],"b":[10,4,8],"x0":[7.079,2.038,0.971],"iteracoes":1}', 'Gauss-Jacobi: X⁽1⁾ = (6,99100; 2,02500; 0,92100).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 7,07900 | 2,03800 | 0,97100 | —
1 | 6,99100 | 2,02500 | 0,92100 | 0,01259', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04', 'A', '(6,991; 2,025; 0,921)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04', 'B', '(6,991; 1,981; 1,009)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04', 'C', '(6,991; 2,025; −0,921)', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04', 'D', '(7,054; 1,956; 1,009)', 0, 'Esse é o vetor depois de 2 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-04-r', 'lista-03', '4ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-04', 'Gauss-Jacobi, 1ª iteração: A = [1 1 1; 1 −2 1; 1 0 1], B = (10; 4; 8) e X⁽⁰⁾ = (7,079; 2,038; 0,971). Qual é x₁⁽¹⁾?', NULL, '6,9910', 6.991, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[1,1,1],[1,-2,1],[1,0,1]],"b":[10,4,8],"x0":[7.079,2.038,0.971],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 6,99100.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 7,07900 | 2,03800 | 0,97100 | —
1 | 6,99100 | 2,02500 | 0,92100 | 0,01259', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04-r', 'A', '13,0090', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04-r', 'B', '6,9910', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04-r', 'C', '10,0000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-04-r', 'D', '0,1430', 0, 'Fração invertida: divide-se por a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-05', 'lista-03', '5ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'vetor', 0, NULL, 'Considere o sistema 4,00x₁ + 0,24x₂ − 0,08x₃ = 8,00; 0,09x₁ + 3,00x₂ − 0,15x₃ = 9,00; 0,04x₁ − 0,08x₂ + 4,00x₃ = 20,00 e o vetor X⁽⁰⁾ = (0; 0; 0). Pelo método de Gauss-Jacobi, obtenha o resultado para o 2º passo.', '(1,920; 3,190; 5,040)', '(1,920; 3,190; 5,040)', NULL, NULL, '[1.92,3.19,5.04]', '[1.92,3.19,5.04]', NULL, 3, NULL, '{"calc":"jacobi","A":[[4,0.24,-0.08],[0.09,3,-0.15],[0.04,-0.08,4]],"b":[8,9,20],"x0":[0,0,0],"iteracoes":2}', 'Gauss-Jacobi: X⁽2⁾ = (1,92000; 3,19000; 5,04000).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 2,00000 | 3,00000 | 5,00000 | 1,00000
2 | 1,92000 | 3,19000 | 5,04000 | 0,03770', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05', 'A', '(1,909; 3,194; 5,045)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05', 'B', '(2,000; 3,000; 5,000)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05', 'C', '(1,924; 3,194; 5,045)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05', 'D', '(1,920; 3,190; 5,040)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-05-r', 'lista-03', '5ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-05', 'Gauss-Jacobi, 1ª iteração: A = [4 0,24 −0,08; 0,09 3 −0,15; 0,04 −0,08 4], B = (8; 9; 20) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '2,0000', 2, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[4,0.24,-0.08],[0.09,3,-0.15],[0.04,-0.08,4]],"b":[8,9,20],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 2,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 2,00000 | 3,00000 | 5,00000 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05-r', 'A', '8,0000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05-r', 'B', '2,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05-r', 'C', '0,5000', 0, 'Fração invertida: divide-se por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-05-r', 'D', '2,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-06', 'lista-03', '6ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'vetor', 0, NULL, 'Considere o sistema 4,00x₁ + 0,24x₂ − 0,08x₃ = 8,00; 0,09x₁ + 3,00x₂ − 0,15x₃ = 9,00; 0,04x₁ − 0,08x₂ + 4,00x₃ = 20,00 e o vetor X⁽⁰⁾ = (0; 0; 0). Pelo método de Gauss-Seidel, obtenha o resultado para o 2º passo.', '(1,924; 3,194; 5,045)', '(1,924; 3,194; 5,045)', NULL, NULL, '[1.924376,3.19420872,5.0446404144]', '[1.924,3.194,5.045]', NULL, 3, NULL, '{"calc":"seidel","A":[[4,0.24,-0.08],[0.09,3,-0.15],[0.04,-0.08,4]],"b":[8,9,20],"x0":[0,0,0],"iteracoes":2}', 'Gauss-Seidel: X⁽2⁾ = (1,92438; 3,19421; 5,04464).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 2,00000 | 2,94000 | 5,03880 | 1,00000
2 | 1,92438 | 3,19421 | 5,04464 | 0,05039', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06', 'A', '(1,920; 3,190; 5,040)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06', 'B', '(1,909; 3,195; 5,045)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06', 'C', '(2,000; 2,940; 5,039)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06', 'D', '(1,924; 3,194; 5,045)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-06-r', 'lista-03', '6ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-06', 'Gauss-Seidel, 1ª iteração: A = [4 0,24 −0,08; 0,09 3 −0,15; 0,04 −0,08 4], B = (8; 9; 20) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '2,0000', 2, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[4,0.24,-0.08],[0.09,3,-0.15],[0.04,-0.08,4]],"b":[8,9,20],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 2,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 2,00000 | 2,94000 | 5,03880 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06-r', 'A', '8,0000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06-r', 'B', '2,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06-r', 'C', '0,5000', 0, 'Fração invertida: divide-se por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-06-r', 'D', '2,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-07', 'lista-03', '7ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Resolva o sistema AX = B pelo método de Gauss-Jacobi, com apenas duas iterações, dados A = [5 0 0 −3 −1; −1 4 0 0 −1; 0 0 2 −1 0; −1 0 0 4 −2; 0 0 0 −1 2], B = (2; 3; −1; 0; −1) e X⁽⁰⁾ = (1; 1; 1; 1; 1).', '(0,850; 1,050; −0,125; 0,300; −0,125)', '(0,850; 1,050; −0,125; 0,300; −0,125)', NULL, NULL, '[0.85,1.05,-0.125,0.3,-0.125]', '[0.85,1.05,-0.125,0.3,-0.125]', NULL, 3, NULL, '{"calc":"jacobi","A":[[5,0,0,-3,-1],[-1,4,0,0,-1],[0,0,2,-1,0],[-1,0,0,4,-2],[0,0,0,-1,2]],"b":[2,3,-1,0,-1],"x0":[1,1,1,1,1],"iteracoes":2}', 'Gauss-Jacobi: X⁽2⁾ = (0,85000; 1,05000; −0,12500; 0,30000; −0,12500).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | x₅⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | —
1 | 1,20000 | 1,25000 | 0,00000 | 0,75000 | 0,00000 | 0,80000
2 | 0,85000 | 1,05000 | −0,12500 | 0,30000 | −0,12500 | 0,42857', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07', 'A', '(1,200; 1,250; 0,000; 0,750; 0,000)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07', 'B', '(0,555; 0,931; −0,350; 0,150; −0,350)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07', 'C', '(0,850; 1,050; −0,125; 0,300; −0,125)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07', 'D', '(0,860; 0,940; −0,100; 0,165; −0,418)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-07-r', 'lista-03', '7ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-07', 'Gauss-Jacobi, 1ª iteração: A = [5 0 0 −3 −1; −1 4 0 0 −1; 0 0 2 −1 0; −1 0 0 4 −2; 0 0 0 −1 2], B = (2; 3; −1; 0; −1) e X⁽⁰⁾ = (1; 1; 1; 1; 1). Qual é x₁⁽¹⁾?', NULL, '1,2000', 1.2, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[5,0,0,-3,-1],[-1,4,0,0,-1],[0,0,2,-1,0],[-1,0,0,4,-2],[0,0,0,-1,2]],"b":[2,3,-1,0,-1],"x0":[1,1,1,1,1],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 1,20000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | x₅⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | —
1 | 1,20000 | 1,25000 | 0,00000 | 0,75000 | 0,00000 | 0,80000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07-r', 'A', '−0,4000', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07-r', 'B', '0,4000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07-r', 'C', '1,2000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-07-r', 'D', '6,0000', 0, 'Faltou dividir por a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-08', 'lista-03', '8ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Resolva o sistema AX = B pelo método de Gauss-Seidel, com apenas duas iterações, dados A = [5 0 0 −3 −1; −1 4 0 0 −1; 0 0 2 −1 0; −1 0 0 4 −2; 0 0 0 −1 2], B = (2; 3; −1; 0; −1) e X⁽⁰⁾ = (1; 1; 1; 1; 1).', '(0,8600; 0,9400; −0,1000; 0,1650; −0,4175)', '(0,8600; 0,9400; −0,1000; 0,1650; −0,4175)', NULL, NULL, '[0.86,0.94,-0.1,0.165,-0.4175]', '[0.86,0.94,-0.1,0.165,-0.4175]', NULL, 4, NULL, '{"calc":"seidel","A":[[5,0,0,-3,-1],[-1,4,0,0,-1],[0,0,2,-1,0],[-1,0,0,4,-2],[0,0,0,-1,2]],"b":[2,3,-1,0,-1],"x0":[1,1,1,1,1],"iteracoes":2}', 'Gauss-Seidel: X⁽2⁾ = (0,86000; 0,94000; −0,10000; 0,16500; −0,41750).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | x₅⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | —
1 | 1,20000 | 1,30000 | 0,00000 | 0,80000 | −0,10000 | 0,84615
2 | 0,86000 | 0,94000 | −0,10000 | 0,16500 | −0,41750 | 0,67553', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08', 'A', '(0,8600; 0,9400; −0,1000; 0,1650; −0,4175)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08', 'B', '(0,4155; 0,7495; −0,4175; −0,1049; −0,5524)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08', 'C', '(0,8500; 1,0500; −0,1250; 0,3000; −0,1250)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08', 'D', '(1,2000; 1,3000; 0,0000; 0,8000; −0,1000)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-08-r', 'lista-03', '8ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-08', 'Gauss-Seidel, 1ª iteração: A = [5 0 0 −3 −1; −1 4 0 0 −1; 0 0 2 −1 0; −1 0 0 4 −2; 0 0 0 −1 2], B = (2; 3; −1; 0; −1) e X⁽⁰⁾ = (1; 1; 1; 1; 1). Qual é x₁⁽¹⁾?', NULL, '1,2000', 1.2, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[5,0,0,-3,-1],[-1,4,0,0,-1],[0,0,2,-1,0],[-1,0,0,4,-2],[0,0,0,-1,2]],"b":[2,3,-1,0,-1],"x0":[1,1,1,1,1],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 1,20000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | x₅⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | 1,00000 | —
1 | 1,20000 | 1,30000 | 0,00000 | 0,80000 | −0,10000 | 0,84615', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08-r', 'A', '−0,4000', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08-r', 'B', '0,4000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08-r', 'C', '6,0000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-08-r', 'D', '1,2000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-09', 'lista-03', '9ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Seidel ao sistema 4x₁ − 2x₂ = 0; −2x₁ + x₂ − x₃ = 0; −x₂ − 2x₃ = 10, com apenas três iterações e X⁽⁰⁾ = (0; 0; 0).', '(−2,50; −7,50; −1,25)', '(−2,50; −7,50; −1,25)', NULL, NULL, '[-2.5,-7.5,-1.25]', '[-2.5,-7.5,-1.25]', NULL, 2, NULL, '{"calc":"seidel","A":[[4,-2,0],[-2,1,-1],[0,-1,-2]],"b":[0,0,10],"x0":[0,0,0],"iteracoes":3}', 'Gauss-Seidel: X⁽3⁾ = (−2,50000; −7,50000; −1,25000).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 0,00000 | 0,00000 | −5,00000 | 1,00000
2 | 0,00000 | −5,00000 | −2,50000 | 1,00000
3 | −2,50000 | −7,50000 | −1,25000 | 0,33333', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09', 'A', '(−2,50; −7,50; −1,25)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09', 'B', '(−2,50; −5,00; −2,50)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09', 'C', '(0,00; −5,00; −2,50)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09', 'D', '(−3,75; −8,75; −0,63)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-09-r', 'lista-03', '9ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-09', 'Gauss-Seidel, 1ª iteração: A = [4 −2 0; −2 1 −1; 0 −1 −2], B = (0; 0; 10) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '0,0000', 0, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[4,-2,0],[-2,1,-1],[0,-1,-2]],"b":[0,0,10],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 0,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 0,00000 | 0,00000 | −5,00000 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09-r', 'A', '0,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09-r', 'B', '0,4000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09-r', 'C', '0,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-09-r', 'D', '0,9000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-10', 'lista-03', '10ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Jacobi ao sistema 4x₁ − 2x₂ = 0; −2x₁ + x₂ − x₃ = 0; −x₂ − 2x₃ = 10, com apenas três iterações e X⁽⁰⁾ = (0; 0; 0).', '(−2,50; −5,00; −2,50)', '(−2,50; −5,00; −2,50)', NULL, NULL, '[-2.5,-5,-2.5]', '[-2.5,-5,-2.5]', NULL, 2, NULL, '{"calc":"jacobi","A":[[4,-2,0],[-2,1,-1],[0,-1,-2]],"b":[0,0,10],"x0":[0,0,0],"iteracoes":3}', 'Gauss-Jacobi: X⁽3⁾ = (−2,50000; −5,00000; −2,50000).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 0,00000 | 0,00000 | −5,00000 | 1,00000
2 | 0,00000 | −5,00000 | −5,00000 | 1,00000
3 | −2,50000 | −5,00000 | −2,50000 | 0,50000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10', 'A', '(−2,50; −7,50; −2,50)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10', 'B', '(−2,50; −7,50; −1,25)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10', 'C', '(−2,50; −5,00; −2,50)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10', 'D', '(0,00; −5,00; −5,00)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-10-r', 'lista-03', '10ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-10', 'Gauss-Jacobi, 1ª iteração: A = [4 −2 0; −2 1 −1; 0 −1 −2], B = (0; 0; 10) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '0,0000', 0, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[4,-2,0],[-2,1,-1],[0,-1,-2]],"b":[0,0,10],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 0,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 0,00000 | 0,00000 | −5,00000 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10-r', 'A', '0,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10-r', 'B', '−0,9000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10-r', 'C', '−0,4000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-10-r', 'D', '0,0000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-11', 'lista-03', '11ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Seidel ao sistema 4x₁ − 2x₂ − x₃ = 10; −2x₁ + 9x₂ − 5x₄ = −5; −x₁ + 6x₃ − 3x₄ = 0; −5x₂ − 3x₃ + 10x₄ = 0, com apenas três iterações e X⁽⁰⁾ = (2,0; 0,1; 0,5; 0,2).', '(2,7326; 0,1968; 0,5860; 0,2742)', '(2,7326; 0,1968; 0,5860; 0,2742)', NULL, NULL, '[2.73263599537,0.196808127572,0.586039448302,0.274215898277]', '[2.7326,0.1968,0.586,0.2742]', NULL, 4, NULL, '{"calc":"seidel","A":[[4,-2,-1,0],[-2,9,0,-5],[-1,0,6,-3],[0,-5,-3,10]],"b":[10,-5,0,0],"x0":[2,0.1,0.5,0.2],"iteracoes":3}', 'Gauss-Seidel: X⁽3⁾ = (2,73264; 0,19681; 0,58604; 0,27422).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 2,00000 | 0,10000 | 0,50000 | 0,20000 | —
1 | 2,67500 | 0,15000 | 0,54583 | 0,23875 | 0,25234
2 | 2,71146 | 0,17963 | 0,57128 | 0,26120 | 0,01345
3 | 2,73264 | 0,19681 | 0,58604 | 0,27422 | 0,0077499', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11', 'A', '(2,7115; 0,0963; 0,4997; 0,2388)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11', 'B', '(2,7449; 0,2068; 0,5946; 0,2818)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11', 'C', '(2,7115; 0,1796; 0,5713; 0,2612)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11', 'D', '(2,7326; 0,1968; 0,5860; 0,2742)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-11-r', 'lista-03', '11ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-11', 'Gauss-Seidel, 1ª iteração: A = [4 −2 −1 0; −2 9 0 −5; −1 0 6 −3; 0 −5 −3 10], B = (10; −5; 0; 0) e X⁽⁰⁾ = (2; 0,1; 0,5; 0,2). Qual é x₁⁽¹⁾?', NULL, '2,6750', 2.675, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[4,-2,-1,0],[-2,9,0,-5],[-1,0,6,-3],[0,-5,-3,10]],"b":[10,-5,0,0],"x0":[2,0.1,0.5,0.2],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 2,67500.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 2,00000 | 0,10000 | 0,50000 | 0,20000 | —
1 | 2,67500 | 0,15000 | 0,54583 | 0,23875 | 0,25234', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11-r', 'A', '10,7000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11-r', 'B', '2,5000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11-r', 'C', '2,6750', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-11-r', 'D', '2,3250', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-12', 'lista-03', '12ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Jacobi ao sistema 4x₁ − 2x₂ − x₃ = 10; −2x₁ + 9x₂ − 5x₄ = −5; −x₁ + 6x₃ − 3x₄ = 0; −5x₂ − 3x₃ + 10x₄ = 0, com apenas três iterações e X⁽⁰⁾ = (2,0; 0,1; 0,5; 0,2).', '(2,7115; 0,0963; 0,4997; 0,2388)', '(2,7115; 0,0963; 0,4997; 0,2388)', NULL, NULL, '[2.71145833333,0.0962962962963,0.499722222222,0.23875]', '[2.7115,0.0963,0.4997,0.2388]', NULL, 4, NULL, '{"calc":"jacobi","A":[[4,-2,-1,0],[-2,9,0,-5],[-1,0,6,-3],[0,-5,-3,10]],"b":[10,-5,0,0],"x0":[2,0.1,0.5,0.2],"iteracoes":3}', 'Gauss-Jacobi: X⁽3⁾ = (2,71146; 0,09630; 0,49972; 0,23875).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 2,00000 | 0,10000 | 0,50000 | 0,20000 | —
1 | 2,67500 | 0,00000 | 0,43333 | 0,20000 | 0,25234
2 | 2,60833 | 0,15000 | 0,54583 | 0,13000 | 0,05751
3 | 2,71146 | 0,09630 | 0,49972 | 0,23875 | 0,04011', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12', 'A', '(2,6083; 0,1500; 0,5458; 0,1300)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12', 'B', '(2,7326; 0,1968; 0,5860; 0,2742)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12', 'C', '(2,6731; 0,1796; 0,5713; 0,1981)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12', 'D', '(2,7115; 0,0963; 0,4997; 0,2388)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-12-r', 'lista-03', '12ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-12', 'Gauss-Jacobi, 1ª iteração: A = [4 −2 −1 0; −2 9 0 −5; −1 0 6 −3; 0 −5 −3 10], B = (10; −5; 0; 0) e X⁽⁰⁾ = (2; 0,1; 0,5; 0,2). Qual é x₁⁽¹⁾?', NULL, '2,6750', 2.675, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[4,-2,-1,0],[-2,9,0,-5],[-1,0,6,-3],[0,-5,-3,10]],"b":[10,-5,0,0],"x0":[2,0.1,0.5,0.2],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 2,67500.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 2,00000 | 0,10000 | 0,50000 | 0,20000 | —
1 | 2,67500 | 0,00000 | 0,43333 | 0,20000 | 0,25234', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12-r', 'A', '2,5000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12-r', 'B', '2,6750', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12-r', 'C', '10,7000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-12-r', 'D', '2,3250', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-13', 'lista-03', '13ª', 'Gauss-Jacobi e Gauss-Seidel', 'cholesky', 1, 'matriz', 1, NULL, 'A matriz M admite uma fatoração de Cholesky cuja matriz triangular superior é R = [2 1 −2; 0 3 2; 0 0 1]. Qual é a matriz M?', 'M = [4 2 −4; 2 10 4; −4 4 9]', 'M = [4 2 −4; 2 10 4; −4 4 9]', NULL, NULL, NULL, NULL, '{"M":[[4,2,-4],[2,10,4],[-4,4,9]]}', 4, NULL, '{"calc":"cholesky-M","R":[[2,1,-2],[0,3,2],[0,0,1]]}', 'M = Rᵀ·R (a transposta da triangular superior vezes ela mesma).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-13', 'A', 'M = [9 −1 −2; −1 13 2; −2 2 1]', 0, 'Multiplicou R·Rᵀ; com R triangular superior, M = Rᵀ·R.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-13', 'B', 'M = [4 1 −2; 1 9 2; −2 2 1]', 0, 'Elevou só a diagonal ao quadrado: cada mᵢⱼ é uma soma de produtos (Rᵀ·R).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-13', 'C', 'M = [4 2 −4; 2 10 4; −4 4 9]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-13', 'D', 'M = [4 −2 4; −2 10 −4; 4 −4 9]', 0, 'Sinais fora da diagonal trocados.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-14', 'lista-03', '14ª', 'Gauss-Jacobi e Gauss-Seidel', 'criterios', 2, 'texto', 0, NULL, 'Usando o critério das linhas, para que valores de k o método de Gauss-Jacobi vai gerar uma sequência convergente à solução do sistema 3x₁ + kx₂ − x₃ = 1; −2x₁ − 3x₂ = 1; kx₁ − x₂ + 3x₃ = 1?', '0,3770', '|k| < 2, ou seja, −2 < k < 2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"α₁ = (|k| + 1)/3, α₂ = 2/3 e α₃ = (|k| + 1)/3. O critério pede máx αᵢ < 1, ou seja, |k| + 1 < 3: |k| < 2 (−2 < k < 2)."}', 'α₁ = (|k| + 1)/3, α₂ = 2/3 e α₃ = (|k| + 1)/3. O critério pede máx αᵢ < 1, ou seja, |k| + 1 < 3: |k| < 2 (−2 < k < 2).', 'O gabarito da lista ("0,3770") não responde à pergunta: pelo critério das linhas a condição é |k| < 2.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-14', 'A', '|k| < 3', 0, 'Faltou somar o 1 do coeficiente −x₃: (|k| + 1)/3 < 1.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-14', 'B', '|k| < 1', 0, 'Isso vem de exigir |k|/3 < 1/3; o critério soma todos os módulos fora da diagonal.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-14', 'C', '|k| < 2 (−2 < k < 2)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-14', 'D', 'k < 2', 0, 'O critério usa |k|: k = −5 também falha.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-15', 'lista-03', '15ª', 'Gauss-Jacobi e Gauss-Seidel', 'criterios', 1, 'texto', 1, NULL, 'Dada uma matriz quadrada A e um sistema linear Ax = b, o que podemos dizer das afirmações? (A) Caso a matriz seja diagonal dominante, posso garantir que o método de Jacobi converge. (B) Caso não haja diagonal dominância, mas seja possível fazer trocas entre as linhas da matriz e torná-la diagonal dominante (fazendo as mesmas alterações no lado direito), então o método de Gauss-Seidel converge, caso aplicado nesse novo sistema.', 'Ambas são verdadeiras', 'Ambas são verdadeiras', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Diagonal dominante (estrita) é exatamente o critério das linhas: garante a convergência de Jacobi e de Seidel. Trocar linhas junto com o lado direito não muda a solução, então vale aplicar o método no sistema reordenado."}', 'Diagonal dominante (estrita) é exatamente o critério das linhas: garante a convergência de Jacobi e de Seidel. Trocar linhas junto com o lado direito não muda a solução, então vale aplicar o método no sistema reordenado.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-15', 'A', 'Só (A) é verdadeira', 0, 'Reordenar as equações (com o lado direito junto) não muda a solução; o novo sistema satisfaz o critério.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-15', 'B', 'Ambas são falsas', 0, 'As duas são consequências do critério das linhas.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-15', 'C', 'Ambas são verdadeiras', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-15', 'D', 'Só (B) é verdadeira', 0, 'A diagonal dominante estrita garante Jacobi também.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-16', 'lista-03', '16ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'vetor', 0, NULL, 'Considere o sistema 2x₁ + x₂ + x₃ = 2; x₁ − 4x₂ + x₃ = 8; x₁ + 2x₃ = 4. Ache a aproximação da solução calculada no segundo passo do método de Gauss-Jacobi, usando como vetor inicial um vetor todo de 1s.', '(0,25; −1,25; 4,00)', '(1,000; −1,625; 2,000)', NULL, NULL, '[1,-1.625,2]', '[0.25,-1.25,4]', NULL, 3, NULL, '{"calc":"jacobi","A":[[2,1,1],[1,-4,1],[1,0,2]],"b":[2,8,4],"x0":[1,1,1],"iteracoes":2}', 'Gauss-Jacobi: X⁽2⁾ = (1,00000; −1,62500; 2,00000).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | —
1 | 0,00000 | −1,50000 | 1,50000 | 1,66667
2 | 1,00000 | −1,62500 | 2,00000 | 0,50000', 'O gabarito da lista (0,25; −1,25; 4,00) não é o 2º passo de Jacobi para este sistema. Partindo de (1; 1; 1): X⁽¹⁾ = (0; −1,5; 1,5) e X⁽²⁾ = (1; −1,625; 2).', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16', 'A', '(0,000; −1,500; 1,500)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16', 'B', '(0,875; −1,281; 1,563)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16', 'C', '(1,000; −1,625; 2,000)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16', 'D', '(0,813; −1,250; 1,500)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-16-r', 'lista-03', '16ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-16', 'Gauss-Jacobi, 1ª iteração: A = [2 1 1; 1 −4 1; 1 0 2], B = (2; 8; 4) e X⁽⁰⁾ = (1; 1; 1). Qual é x₁⁽¹⁾?', NULL, '0,0000', 0, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[2,1,1],[1,-4,1],[1,0,2]],"b":[2,8,4],"x0":[1,1,1],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 0,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 1,00000 | 1,00000 | 1,00000 | —
1 | 0,00000 | −1,50000 | 1,50000 | 1,66667', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16-r', 'A', '1,0000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16-r', 'B', '0,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16-r', 'C', '2,0000', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-16-r', 'D', '−0,4000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-17', 'lista-03', '17ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Considere o sistema 10x₁ + 2x₂ + x₃ = 7; x₁ + 5x₂ + x₃ = −8; 2x₁ + 3x₂ + 10x₃ = 6 e o vetor X⁽⁰⁾ = (0,7; −1,6; 0,6). Pelo método de Gauss-Jacobi, obtenha o resultado após a terceira iteração.', '(0,9944; −1,9888; 0,9984)', '(0,9994; −1,9888; 0,9984)', NULL, NULL, '[0.9994,-1.9888,0.9984]', '[0.9944,-1.9888,0.9984]', NULL, 4, NULL, '{"calc":"jacobi","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.7,-1.6,0.6],"iteracoes":3}', 'Gauss-Jacobi: X⁽3⁾ = (0,99940; −1,98880; 0,99840).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,70000 | −1,60000 | 0,60000 | —
1 | 0,96000 | −1,86000 | 0,94000 | 0,18280
2 | 0,97800 | −1,98000 | 0,96600 | 0,06061
3 | 0,99940 | −1,98880 | 0,99840 | 0,01629', 'A primeira componente do gabarito (0,9944) parece erro de digitação: a conta dá 0,9994.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17', 'A', '(0,9979; −1,9996; 0,9968)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17', 'B', '(0,9780; −1,9800; 0,9660)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17', 'C', '(0,9985; −1,9999; 1,0003)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17', 'D', '(0,9994; −1,9888; 0,9984)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-17-r', 'lista-03', '17ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-17', 'Gauss-Jacobi, 1ª iteração: A = [10 2 1; 1 5 1; 2 3 10], B = (7; −8; 6) e X⁽⁰⁾ = (0,7; −1,6; 0,6). Qual é x₁⁽¹⁾?', NULL, '0,9600', 0.96, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.7,-1.6,0.6],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 0,96000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,70000 | −1,60000 | 0,60000 | —
1 | 0,96000 | −1,86000 | 0,94000 | 0,18280', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17-r', 'A', '0,9600', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17-r', 'B', '9,6000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17-r', 'C', '0,7000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-17-r', 'D', '0,4400', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-18', 'lista-03', '18ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Considere o sistema 10x₁ + 2x₂ + x₃ = 7; x₁ + 5x₂ + x₃ = −8; 2x₁ + 3x₂ + 10x₃ = 6 e o vetor X⁽⁰⁾ = (0,7; −1,6; 0,6). Pelo método de Gauss-Seidel, obtenha o resultado após a terceira iteração.', '(0,99852; −1,99993; 1,00027)', '(0,99852; −1,99993; 1,00027)', NULL, NULL, '[0.99852336,-1.999925152,1.0002728736]', '[0.99852,-1.99993,1.00027]', NULL, 5, NULL, '{"calc":"seidel","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.7,-1.6,0.6],"iteracoes":3}', 'Gauss-Seidel: X⁽3⁾ = (0,99852; −1,99993; 1,00027).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,70000 | −1,60000 | 0,60000 | —
1 | 0,96000 | −1,91200 | 0,98160 | 0,19958
2 | 0,98424 | −1,99317 | 1,00110 | 0,04072
3 | 0,99852 | −1,99993 | 1,00027 | 0,00714195', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18', 'A', '(0,99852; −1,99993; 1,00027)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18', 'B', '(0,98424; −1,99317; 1,00110)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18', 'C', '(0,99940; −1,98880; 0,99840)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18', 'D', '(0,99996; −2,00005; 1,00002)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-18-r', 'lista-03', '18ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-18', 'Gauss-Seidel, 1ª iteração: A = [10 2 1; 1 5 1; 2 3 10], B = (7; −8; 6) e X⁽⁰⁾ = (0,7; −1,6; 0,6). Qual é x₁⁽¹⁾?', NULL, '0,9600', 0.96, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.7,-1.6,0.6],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 0,96000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,70000 | −1,60000 | 0,60000 | —
1 | 0,96000 | −1,91200 | 0,98160 | 0,19958', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18-r', 'A', '9,6000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18-r', 'B', '0,4400', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18-r', 'C', '0,9600', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-18-r', 'D', '0,7000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-19', 'lista-03', '19ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Considere o sistema 10x₁ + 2x₂ − x₃ = 10; x₁ + 10x₂ + x₃ = 12; 2x₁ − x₂ + 10x₃ = 11 e o vetor X⁽⁰⁾ = (0; 0; 0). Pelo método de Gauss-Jacobi, obtenha o resultado após a terceira iteração.', '(0,99852; −1,99993; 1,00027)', '(0,9040; 1,0110; 1,0250)', NULL, NULL, '[0.904,1.011,1.025]', '[0.99852,-1.99993,1.00027]', NULL, 4, NULL, '{"calc":"jacobi","A":[[10,2,-1],[1,10,1],[2,-1,10]],"b":[10,12,11],"x0":[0,0,0],"iteracoes":3}', 'Gauss-Jacobi: X⁽3⁾ = (0,90400; 1,01100; 1,02500).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 1,20000 | 1,10000 | 1,00000
2 | 0,87000 | 0,99000 | 1,02000 | 0,20588
3 | 0,90400 | 1,01100 | 1,02500 | 0,03317', 'A lista repete aqui o gabarito da 18ª questão. Para este sistema, 3 iterações de Jacobi a partir de (0; 0; 0) dão (0,904; 1,011; 1,025).', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19', 'A', '(0,9040; 1,0110; 1,0250)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19', 'B', '(0,9003; 1,0075; 1,0207)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19', 'C', '(0,8700; 0,9900; 1,0200)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19', 'D', '(0,9003; 1,0071; 1,0203)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-19-r', 'lista-03', '19ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-19', 'Gauss-Jacobi, 1ª iteração: A = [10 2 −1; 1 10 1; 2 −1 10], B = (10; 12; 11) e X⁽⁰⁾ = (0; 0; 0). Qual é x₁⁽¹⁾?', NULL, '1,0000', 1, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[10,2,-1],[1,10,1],[2,-1,10]],"b":[10,12,11],"x0":[0,0,0],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 1,00000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 1,00000 | 1,20000 | 1,10000 | 1,00000', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19-r', 'A', '1,0400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19-r', 'B', '1,5000', 0, 'Não confere: x₁ = b₁/a₁₁ quando X⁽⁰⁾ = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19-r', 'C', '1,0000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-19-r', 'D', '10,0000', 0, 'Faltou dividir por a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-20', 'lista-03', '20ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Considere o sistema 10x₁ + 2x₂ + x₃ = 7; x₁ + 5x₂ + x₃ = −8; 2x₁ + 3x₂ + 10x₃ = 6 e o vetor X⁽⁰⁾ = (0,5; −1,0; 0,4). Pelo método de Gauss-Seidel, obtenha o resultado após a segunda iteração.', '(0,97204; −1,99113; 1,00293)', '(0,97204; −1,99113; 1,00293)', NULL, NULL, '[0.97204,-1.991128,1.0029304]', '[0.97204,-1.99113,1.00293]', NULL, 5, NULL, '{"calc":"seidel","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.5,-1,0.4],"iteracoes":2}', 'Gauss-Seidel: X⁽2⁾ = (0,97204; −1,99113; 1,00293).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,50000 | −1,00000 | 0,40000 | —
1 | 0,86000 | −1,85200 | 0,98360 | 0,46004
2 | 0,97204 | −1,99113 | 1,00293 | 0,06987', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20', 'A', '(0,99793; −2,00017; 1,00047)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20', 'B', '(0,97204; −1,99113; 1,00293)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20', 'C', '(0,86000; −1,85200; 0,98360)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20', 'D', '(0,97600; −1,93200; 0,96200)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-20-r', 'lista-03', '20ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-20', 'Gauss-Seidel, 1ª iteração: A = [10 2 1; 1 5 1; 2 3 10], B = (7; −8; 6) e X⁽⁰⁾ = (0,5; −1; 0,4). Qual é x₁⁽¹⁾?', NULL, '0,8600', 0.86, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[10,2,1],[1,5,1],[2,3,10]],"b":[7,-8,6],"x0":[0.5,-1,0.4],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 0,86000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,50000 | −1,00000 | 0,40000 | —
1 | 0,86000 | −1,85200 | 0,98360 | 0,46004', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20-r', 'A', '8,6000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20-r', 'B', '0,5400', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20-r', 'C', '0,7000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-20-r', 'D', '0,8600', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-21', 'lista-03', '21ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Considere o sistema 10x₁ + 2x₂ − x₃ = 10; x₁ + 10x₂ + x₃ = 12; 2x₁ − x₂ + 10x₃ = 11 e o vetor X⁽⁰⁾ = (0,5; −1,0; 0,4). Pelo método de Gauss-Seidel, obtenha o resultado após a segunda iteração.', '(0,9931; 1,0030; 1,0017)', '(0,8884; 1,0156; 1,0239)', NULL, NULL, '[0.88836,1.015604,1.0238884]', '[0.9931,1.003,1.0017]', NULL, 4, NULL, '{"calc":"seidel","A":[[10,2,-1],[1,10,1],[2,-1,10]],"b":[10,12,11],"x0":[0.5,-1,0.4],"iteracoes":2}', 'Gauss-Seidel: X⁽2⁾ = (0,88836; 1,01560; 1,02389).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,50000 | −1,00000 | 0,40000 | —
1 | 1,24000 | 1,03600 | 0,95560 | 1,64194
2 | 0,88836 | 1,01560 | 1,02389 | 0,34344', 'O gabarito da lista não sai deste ponto de partida: com X⁽⁰⁾ = (0,5; −1,0; 0,4), 2 iterações de Seidel dão (0,88836; 1,01560; 1,02389). A solução exata do sistema é (1; 1; 1).', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21', 'A', '(1,2400; 1,0360; 0,9556)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21', 'B', '(0,8993; 1,0077; 1,0209)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21', 'C', '(0,8884; 1,0156; 1,0239)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21', 'D', '(0,8680; 0,9860; 0,9630)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-21-r', 'lista-03', '21ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-21', 'Gauss-Seidel, 1ª iteração: A = [10 2 −1; 1 10 1; 2 −1 10], B = (10; 12; 11) e X⁽⁰⁾ = (0,5; −1; 0,4). Qual é x₁⁽¹⁾?', NULL, '1,2400', 1.24, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[10,2,-1],[1,10,1],[2,-1,10]],"b":[10,12,11],"x0":[0.5,-1,0.4],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 1,24000.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,50000 | −1,00000 | 0,40000 | —
1 | 1,24000 | 1,03600 | 0,95560 | 1,64194', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21-r', 'A', '1,2400', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21-r', 'B', '1,0000', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21-r', 'C', '12,4000', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-21-r', 'D', '0,7600', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-22', 'lista-03', '22ª', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Jacobi ao sistema 8x₁ + x₂ + 2x₃ + 3x₄ = 13; 2x₁ + 7x₂ + x₃ + x₄ = 3; x₁ + x₂ + 9x₃ + 2x₄ = 7; x₁ + 2x₂ + 3x₃ + 11x₄ = 10, com apenas três iterações e X⁽⁰⁾ = (1,20; −0,05; 0,20; 0,50).', '(1,2908; −0,0733; 0,5188; 0,7027)', '(1,2908; −0,0733; 0,5188; 0,7027)', NULL, NULL, '[1.29084032287,-0.0732941661513,0.518809122976,0.702658894136]', '[1.2908,-0.0733,0.5188,0.7027]', NULL, 4, NULL, '{"calc":"jacobi","A":[[8,1,2,3],[2,7,1,1],[1,1,9,2],[1,2,3,11]],"b":[13,3,7,10],"x0":[1.2,-0.05,0.2,0.5],"iteracoes":3}', 'Gauss-Jacobi: X⁽3⁾ = (1,29084; −0,07329; 0,51881; 0,70266).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 1,20000 | −0,05000 | 0,20000 | 0,50000 | —
1 | 1,39375 | −0,01429 | 0,53889 | 0,75455 | 0,24315
2 | 1,20911 | −0,15442 | 0,45683 | 0,63801 | 0,15271
3 | 1,29084 | −0,07329 | 0,51881 | 0,70266 | 0,06332', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22', 'A', '(1,2582; −0,0993; 0,4990; 0,6767)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22', 'B', '(1,2908; −0,0733; 0,5188; 0,7027)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22', 'C', '(1,2091; −0,1544; 0,4568; 0,6380)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22', 'D', '(1,2410; −0,1147; 0,4863; 0,6636)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-22-r', 'lista-03', '22ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'jacobi', 1, 'numero', 1, 'l03-22', 'Gauss-Jacobi, 1ª iteração: A = [8 1 2 3; 2 7 1 1; 1 1 9 2; 1 2 3 11], B = (13; 3; 7; 10) e X⁽⁰⁾ = (1,2; −0,05; 0,2; 0,5). Qual é x₁⁽¹⁾?', NULL, '1,3938', 1.39375, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"jacobi","A":[[8,1,2,3],[2,7,1,1],[1,1,9,2],[1,2,3,11]],"b":[13,3,7,10],"x0":[1.2,-0.05,0.2,0.5],"iteracoes":1,"componente":1}', 'Gauss-Jacobi: x₁⁽¹⁾ = 1,39375.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 1,20000 | −0,05000 | 0,20000 | 0,50000 | —
1 | 1,39375 | −0,01429 | 0,53889 | 0,75455 | 0,24315', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22-r', 'A', '1,3938', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22-r', 'B', '1,8563', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22-r', 'C', '1,6250', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-22-r', 'D', '11,1500', 0, 'Faltou dividir por a₁₁.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-23', 'lista-03', '23ª', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 2, 'vetor', 0, NULL, 'Aplique o método de Gauss-Seidel ao sistema 8x₁ + x₂ + 2x₃ + 3x₄ = 13; 2x₁ + 7x₂ + x₃ + x₄ = 3; x₁ + x₂ + 9x₃ + 2x₄ = 7; x₁ + 2x₂ + 3x₃ + 11x₄ = 10, com apenas três iterações e X⁽⁰⁾ = (1,20; −0,05; 0,20; 0,50).', '(1,2582; −0,0993; 0,4990; 0,6767)', '(1,2582; −0,0993; 0,4990; 0,6767)', NULL, NULL, '[1.25820246372,-0.0993295944247,0.498964854318,0.676687469288]', '[1.2582,-0.0993,0.499,0.6767]', NULL, 4, NULL, '{"calc":"seidel","A":[[8,1,2,3],[2,7,1,1],[1,1,9,2],[1,2,3,11]],"b":[13,3,7,10],"x0":[1.2,-0.05,0.2,0.5],"iteracoes":3}', 'Gauss-Seidel: X⁽3⁾ = (1,25820; −0,09933; 0,49896; 0,67669).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 1,20000 | −0,05000 | 0,20000 | 0,50000 | —
1 | 1,39375 | −0,06964 | 0,51954 | 0,65335 | 0,22927
2 | 1,25881 | −0,09865 | 0,50368 | 0,67522 | 0,10720
3 | 1,25820 | −0,09933 | 0,49896 | 0,67669 | 0,00374793', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23', 'A', '(1,2589; −0,0991; 0,4985; 0,6767)', 0, 'Esse é o vetor depois de 4 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23', 'B', '(1,2908; −0,0733; 0,5188; 0,7027)', 0, 'Esse é o resultado do Gauss-Jacobi. No Seidel, cada valor novo entra na hora no cálculo dos seguintes.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23', 'C', '(1,2588; −0,0986; 0,5037; 0,6752)', 0, 'Esse é o vetor depois de 2 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23', 'D', '(1,2582; −0,0993; 0,4990; 0,6767)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-23-r', 'lista-03', '23ª · 1ª componente', 'Gauss-Jacobi e Gauss-Seidel', 'seidel', 1, 'numero', 1, 'l03-23', 'Gauss-Seidel, 1ª iteração: A = [8 1 2 3; 2 7 1 1; 1 1 9 2; 1 2 3 11], B = (13; 3; 7; 10) e X⁽⁰⁾ = (1,2; −0,05; 0,2; 0,5). Qual é x₁⁽¹⁾?', NULL, '1,3938', 1.39375, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"seidel","A":[[8,1,2,3],[2,7,1,1],[1,1,9,2],[1,2,3,11]],"b":[13,3,7,10],"x0":[1.2,-0.05,0.2,0.5],"iteracoes":1,"componente":1}', 'Gauss-Seidel: x₁⁽¹⁾ = 1,39375.
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | x₄⁽ᵏ⁾ | dᵣ
0 | 1,20000 | −0,05000 | 0,20000 | 0,50000 | —
1 | 1,39375 | −0,06964 | 0,51954 | 0,65335 | 0,22927', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23-r', 'A', '11,1500', 0, 'Faltou dividir por a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23-r', 'B', '1,8563', 0, 'Sinal trocado: x₁ = (b₁ − a₁₂x₂ − a₁₃x₃ − …)/a₁₁.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23-r', 'C', '1,6250', 0, 'Ignorou os termos com os valores de X⁽⁰⁾.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-23-r', 'D', '1,3938', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-24', 'lista-03', '24ª', 'Gauss-Jacobi e Gauss-Seidel', 'cholesky', 1, 'numero', 1, NULL, 'A matriz M admite uma fatoração de Cholesky cuja matriz triangular superior é R = [1 2 3; 0 2 3; 0 0 3]. Qual é o determinante da matriz M?', '36', '36', 36, 36, NULL, NULL, NULL, 0, NULL, '{"calc":"cholesky-det","R":[[1,2,3],[0,2,3],[0,0,3]]}', 'det M = (produto da diagonal)² = (1·2·3)² = 36.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-24', 'A', '39', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-24', 'B', '14', 0, 'Soma dos quadrados da diagonal; o determinante é o produto (ao quadrado).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-24', 'C', '36', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-24', 'D', '6', 0, 'Esse é det(G) só: det M = det(G)·det(Gᵀ) = (produto da diagonal)².');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-25', 'lista-03', '25ª', 'Gauss-Jacobi e Gauss-Seidel', 'cholesky', 1, 'numero', 1, NULL, 'A matriz M admite uma fatoração de Cholesky cuja matriz triangular inferior é G = [2 0 0; 6 1 0; −8 5 3]. Qual é o determinante da matriz M?', '36', '36', 36, 36, NULL, NULL, NULL, 0, NULL, '{"calc":"cholesky-det","G":[[2,0,0],[6,1,0],[-8,5,3]]}', 'det M = (produto da diagonal)² = (2·1·3)² = 36.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-25', 'A', '33', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-25', 'B', '14', 0, 'Soma dos quadrados da diagonal; o determinante é o produto (ao quadrado).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-25', 'C', '6', 0, 'Esse é det(G) só: det M = det(G)·det(Gᵀ) = (produto da diagonal)².');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-25', 'D', '36', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-26', 'lista-03', '26ª', 'Gauss-Jacobi e Gauss-Seidel', 'criterios', 2, 'numero', 0, NULL, 'Seja o sistema linear x₁ + 0,4x₂ − 0,1x₃ + 0,1x₄ = 0,3; 0,3x₁ + 0,2x₂ − 0,2x₃ − 0,1x₄ = −2,5; −0,1x₁ − 0,2x₂ + 0,6x₃ + 0,2x₄ = 1,2; 0,1x₁ + 0,3x₂ + 0,2x₃ + x₄ = −2,4. Para essa disposição de linhas e colunas, o critério de Sassenfeld fornece que valor para β?', 'β = 0,6', '2,40', 2.4, 0.6, NULL, NULL, NULL, 2, NULL, '{"calc":"sassenfeld","A":[[1,0.4,-0.1,0.1],[0.3,0.2,-0.2,-0.1],[-0.1,-0.2,0.6,0.2],[0.1,0.3,0.2,1]]}', 'β = (0,6000; 2,4000; 1,2333; 1,0267); β = máx βᵢ = 2,4000.', 'Igual à 16ª questão da Lista 2. Igual à 16ª questão da Lista 2. O gabarito da lista (β = 0,6) é só o β₁; o critério usa o maior βᵢ, que é β₂ = 2,4.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-26', 'A', '1,23', 0, 'Esse é o β₃; o critério usa o maior βᵢ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-26', 'B', '0,60', 0, 'Esse é só o β₁. O critério de Sassenfeld usa β = máx βᵢ. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-26', 'C', '3,00', 0, 'Esse é o máx αᵢ do critério das linhas, não o β de Sassenfeld.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-26', 'D', '2,40', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l03-27', 'lista-03', '27ª', 'Gauss-Jacobi e Gauss-Seidel', 'cholesky', 2, 'numero', 0, NULL, 'A matriz M admite uma fatoração de Cholesky cuja matriz triangular inferior é G = [2 0 0; 6 x 0; −8 5 3]. Determine o valor de x (x > 0) para que o determinante da matriz M seja igual a 36.', '3', '1', 1, 3, NULL, NULL, NULL, 0, NULL, '{"calc":"cholesky-x","diag":[2,3],"det":36}', 'det M = (2·3·x)² = 36 ⇒ |x| = 1.', 'O gabarito da lista (3) não confere: det M = (det G)² = (2·x·3)² = 36 dá 6x = 6, ou seja, x = 1.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-27', 'A', '4', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-27', 'B', '−5', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-27', 'C', '1', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l03-27', 'D', '6', 0, 'Faltou dividir pelos outros elementos da diagonal: det M = (2·x·3)².');

-- ======================================================================
-- Lista 4 — Revisão (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-01', 'lista-04', '1ª', 'Revisão', 'series', 2, 'numero', 0, NULL, 'Considere o desenvolvimento de f(x) = cotg(x) em série até o quarto termo: cotg(x) ≈ 1/x − x/3 − x³/45 − 2x⁵/945. Determine aproximadamente o erro relativo que se comete ao usar essa expansão em relação ao valor correto cotg(0,76) = 1,05213158.', '0,003128%', '0,003129%', 0.00312879131137, 0.003128, NULL, NULL, NULL, 6, 0.000002, '{"calc":"serie","serie":"cotg","x":0.76,"exato":1.05213158}', 'Soma dos quatro termos: 1,05216450. Erro relativo = |1,05216450 − 1,05213158| / 1,05213158 × 100% = 0,003129%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-01', 'A', '0,000031%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-01', 'B', '0,003129%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-01', 'C', '0,003004%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-01', 'D', '0,054132%', 0, 'Usou só três termos da série; a questão pede até o quarto.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-02', 'lista-04', '2ª', 'Revisão', 'markov', 3, 'vetor', 0, NULL, 'Resolva pelo método de Gauss o sistema [a b c]·M = [a b c], com M = [0,8 0,2 0; 0,2 0 0,8; 0,2 0,2 0,6] e a + b + c = 1.', 'a = 0,5; b = 0,1667; c = 0,3333', '(0,5000; 0,1667; 0,3333)', NULL, NULL, '[0.5,0.166666666667,0.333333333333]', '[0.5,0.1667,0.3333]', NULL, 4, NULL, '{"calc":"markov","M":[[0.8,0.2,0],[0.2,0,0.8],[0.2,0.2,0.6]]}', '[a b c]·M = [a b c] vira (Mᵀ − I)·v = 0; trocando a última equação por a + b + c = 1 e resolvendo por Gauss: (0,5000; 0,1667; 0,3333).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-02', 'A', '(0,1667; 0,5000; 0,3333)', 0, 'Componentes trocadas de posição.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-02', 'B', '(0,3333; 0,3333; 0,3333)', 0, 'Resolveu M·v = v (vetor coluna). A equação é [a b c]·M = [a b c], ou seja, (Mᵀ − I)·v = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-02', 'C', '(0,5000; 0,1667; 0,3333)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-02', 'D', '(0,5000; 0,1667; −0,3333)', 0, 'Sinal da última componente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-03', 'lista-04', '3ª', 'Revisão', 'lu', 2, 'sistema', 0, NULL, 'Depois de aplicar o processo de fatoração LU ao sistema AX = B, com B = (9; 3; −2)ᵀ, foram encontradas as matrizes U = [3 −4 1; 0 10/3 5/3; 0 0 −7] e L = [1 0 0; 1/3 1 0; 4/3 8/5 1]. Determine o sistema AX = B.', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', NULL, NULL, NULL, NULL, '{"A":[[3,-4,1],[1,2,2],[4,0,-3]],"b":[9,3,-2]}', 4, NULL, '{"calc":"lu-sistema","L":[[1,0,0],[0.3333333333333333,1,0],[1.3333333333333333,1.6,1]],"U":[[3,-4,1],[0,3.3333333333333335,1.6666666666666667],[0,0,-7]],"b":[9,3,-2]}', 'A = L·U (multiplique as matrizes) e o lado direito é o próprio B.', 'Igual à 1ª questão da Lista 2.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-03', 'A', '3x₁ − 4x₂ + x₃ = 9; (10/3)x₂ + (5/3)x₃ = 3; −7x₃ = −2', 0, 'Esse é o sistema triangular U·X = B: faltou multiplicar por L (A = L·U).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-03', 'B', '3x₁ − 4x₂ + x₃ = 9; −x₁ + (14/3)x₂ + (4/3)x₃ = 3; −4x₁ − 11x₃ = −2', 0, 'Sinal dos multiplicadores trocado em L.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-03', 'C', '3x₁ − 4x₂ + x₃ = 9; x₁ + 2x₂ + 2x₃ = 3; 4x₁ − 3x₃ = −2', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-03', 'D', '3x₁ − 2,4x₂ + x₃ = 9; (10/3)x₁ + 6x₂ + (5/3)x₃ = 3; −(28/3)x₁ − 11,2x₂ − 7x₃ = −2', 0, 'Multiplicou U·L; o certo é A = L·U.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-04', 'lista-04', '4ª', 'Revisão', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = eˣ/2 − cos(2x). Usando o método da Bisseção no intervalo [0, 1], com 4 iterações, encontre uma aproximação da raiz.', '0,4375', '0,4375', 0.4375, 0.4375, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"exp(x)/2-cos(2x)","a":0,"b":1,"iteracoes":4}', 'Bisseção: 4 iterações; x = 0,437500. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | −0,500000 | 1,775288 | 0,284058 | —
2 | 0,000000 | 0,500000 | 0,250000 | −0,500000 | 0,284058 | −0,235570 | 1,000000
3 | 0,250000 | 0,500000 | 0,375000 | −0,235570 | 0,284058 | −0,004193 | 0,333333
4 | 0,375000 | 0,500000 | 0,437500 | −0,004193 | 0,284058 | 0,133418 | 0,142857', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04', 'A', '0,4063', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04', 'B', '0,4375', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04', 'C', '0,3750', 0, 'Esse é o resultado com 3 iterações: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04', 'D', '0,3732', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-04-r', 'lista-04', '4ª · 1º passo', 'Revisão', 'bissecao', 1, 'numero', 1, 'l04-04', 'Bisseção, 1º passo: f(x) = eˣ/2 − cos(2x) em [0; 1]. Qual é x₁?', NULL, '0,5000', 0.5, NULL, NULL, NULL, NULL, 4, NULL, '{"calc":"bissecao","f":"exp(x)/2-cos(2x)","a":0,"b":1,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,500000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,000000 | 1,000000 | 0,500000 | −0,500000 | 1,775288 | 0,284058 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04-r', 'A', '0,2198', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04-r', 'B', '0,5200', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04-r', 'C', '0,5000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-04-r', 'D', '0,2500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-05', 'lista-04', '5ª', 'Revisão', 'series', 2, 'numero', 0, NULL, 'Considere o desenvolvimento de f(x) = cosec(x) em série até o quarto termo: cosec(x) ≈ 1/x + x/6 + 7x³/360 + 31x⁵/15120. Determine aproximadamente o erro relativo que se comete ao usar essa expansão em relação ao valor correto cosec(1,1) = 1,12207332.', '0,041579%', '0,041579%', 0.0415793202672, 0.041579, NULL, NULL, NULL, 6, 0.000002, '{"calc":"serie","serie":"cosec","x":1.1,"exato":1.12207332}', 'Soma dos quatro termos: 1,12160677. Erro relativo = |1,12160677 − 1,12207332| / 1,12207332 × 100% = 0,041579%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-05', 'A', '0,039916%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-05', 'B', '0,000416%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-05', 'C', '0,041579%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-05', 'D', '0,335853%', 0, 'Usou só três termos da série; a questão pede até o quarto.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-06', 'lista-04', '6ª', 'Revisão', 'markov', 3, 'vetor', 0, NULL, 'Resolva pelo método de Gauss o sistema [a b c]·M = [a b c], com M = [0,7 0,2 0,1; 0,3 0,5 0,2; 0,3 0,3 0,4] e a + b + c = 1.', 'a = 0,5; b = 0,3125; c = 0,1875', '(0,5000; 0,3125; 0,1875)', NULL, NULL, '[0.5,0.3125,0.1875]', '[0.5,0.3125,0.1875]', NULL, 4, NULL, '{"calc":"markov","M":[[0.7,0.2,0.1],[0.3,0.5,0.2],[0.3,0.3,0.4]]}', '[a b c]·M = [a b c] vira (Mᵀ − I)·v = 0; trocando a última equação por a + b + c = 1 e resolvendo por Gauss: (0,5000; 0,3125; 0,1875).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-06', 'A', '(0,5000; 0,3125; 0,1875)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-06', 'B', '(0,3333; 0,3333; 0,3333)', 0, 'Resolveu M·v = v (vetor coluna). A equação é [a b c]·M = [a b c], ou seja, (Mᵀ − I)·v = 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-06', 'C', '(0,5000; 0,3125; −0,1875)', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-06', 'D', '(0,3125; 0,5000; 0,1875)', 0, 'Componentes trocadas de posição.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-07', 'lista-04', '7ª', 'Revisão', 'pivoteamento', 3, 'texto', 0, NULL, 'Seja um sistema linear Ax = b com A = [14 6,7 6,7 6,7; 10,5 13,4 6,7 13,4; 7 6,7 6,7 13,4; 3,5 6,7 13,4 6,7] e b = (3,4; 7,5; −8,9; 8,8). Usando a eliminação gaussiana com pivoteamento parcial, serão necessárias trocas de linhas para calcular quais pivôs?', '(d) para o cálculo do terceiro pivô', '3º pivô', NULL, NULL, '[3]', '[3]', NULL, NULL, NULL, '{"calc":"gauss-trocas","A":[[14,6.7,6.7,6.7],[10.5,13.4,6.7,13.4],[7,6.7,6.7,13.4],[3.5,6.7,13.4,6.7]],"b":[3.4,7.5,-8.9,8.8]}', 'Etapa 1: o maior |aᵢₖ| já está na equação pivô, sem troca; Etapa 2: o maior |aᵢₖ| já está na equação pivô, sem troca; Etapa 3: |a₄₃| é o maior elemento da coluna 3 em módulo.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-07', 'A', 'Para o cálculo do primeiro pivô', 0, 'O 14 já é o maior |aᵢ₁| da primeira coluna.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-07', 'B', 'Não será necessária nenhuma troca', 0, 'Na 3ª etapa o maior |aᵢ₃| está na 4ª equação: é preciso trocar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-07', 'C', 'Só para o cálculo do terceiro pivô', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-07', 'D', 'Para o cálculo do segundo pivô', 0, 'Depois da 1ª etapa, o maior |aᵢ₂| da coluna 2 já está na 2ª equação.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-08', 'lista-04', '8ª', 'Revisão', 'jacobi', 1, 'vetor', 0, NULL, 'Considere o sistema 4,00x₁ + 0,24x₂ − 0,08x₃ = 8,00; 0,09x₁ + 3,00x₂ − 0,15x₃ = 9,00; 0,04x₁ − 0,08x₂ + 4,00x₃ = 20,00 e o vetor X⁽⁰⁾ = (0; 0; 0). Pelo método de Gauss-Jacobi, obtenha o resultado para o 2º passo.', '(1,920; 3,190; 5,040)', '(1,920; 3,190; 5,040)', NULL, NULL, '[1.92,3.19,5.04]', '[1.92,3.19,5.04]', NULL, 3, NULL, '{"calc":"jacobi","A":[[4,0.24,-0.08],[0.09,3,-0.15],[0.04,-0.08,4]],"b":[8,9,20],"x0":[0,0,0],"iteracoes":2}', 'Gauss-Jacobi: X⁽2⁾ = (1,92000; 3,19000; 5,04000).
k | x₁⁽ᵏ⁾ | x₂⁽ᵏ⁾ | x₃⁽ᵏ⁾ | dᵣ
0 | 0,00000 | 0,00000 | 0,00000 | —
1 | 2,00000 | 3,00000 | 5,00000 | 1,00000
2 | 1,92000 | 3,19000 | 5,04000 | 0,03770', 'Igual à 5ª questão da Lista 3.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-08', 'A', '(1,920; 3,190; 5,040)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-08', 'B', '(1,909; 3,194; 5,045)', 0, 'Esse é o vetor depois de 3 iterações: uma a mais.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-08', 'C', '(1,924; 3,194; 5,045)', 0, 'Esse é o resultado do Gauss-Seidel. No Jacobi, toda a iteração usa só os valores da iteração anterior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-08', 'D', '(2,000; 3,000; 5,000)', 0, 'Esse é o vetor depois de 1 iteração: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-09', 'lista-04', '9ª', 'Revisão', 'bissecao', 1, 'numero', 0, NULL, 'Seja a função f(x) = sen(5x) − eˣ/5. Usando o método da Bisseção no intervalo [0,5; 0,6] e 4 iterações, qual aproximação da raiz é encontrada?', '0,55625', '0,55625', 0.55625, 0.55625, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"sin(5x)-exp(x)/5","a":0.5,"b":0.6,"iteracoes":4}', 'Bisseção: 4 iterações; x = 0,556250. 4 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,500000 | 0,600000 | 0,550000 | 0,268728 | −0,223304 | 0,035010 | —
2 | 0,550000 | 0,600000 | 0,575000 | 0,035010 | −0,223304 | −0,091980 | 0,043478
3 | 0,550000 | 0,575000 | 0,562500 | 0,035010 | −0,091980 | −0,027826 | 0,022222
4 | 0,550000 | 0,562500 | 0,556250 | 0,035010 | −0,027826 | 0,003771 | 0,011236', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09', 'A', '0,55625', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09', 'B', '0,55938', 0, 'Esse é o resultado com 5 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09', 'C', '0,55700', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09', 'D', '0,56250', 0, 'Esse é o resultado com 3 iterações: faltou uma.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-09-r', 'lista-04', '9ª · 1º passo', 'Revisão', 'bissecao', 1, 'numero', 1, 'l04-09', 'Bisseção, 1º passo: f(x) = sen(5x) − eˣ/5 em [0,5; 0,6]. Qual é x₁?', NULL, '0,55000', 0.55, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"bissecao","f":"sin(5x)-exp(x)/5","a":0.5,"b":0.6,"iteracoes":1}', 'Bisseção: 1 iteração; x = 0,550000. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 0,500000 | 0,600000 | 0,550000 | 0,268728 | −0,223304 | 0,035010 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09-r', 'A', '0,57500', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09-r', 'B', '0,57200', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09-r', 'C', '0,55000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-09-r', 'D', '0,55462', 0, 'Esse valor sai da Falsa Posição (média ponderada pelos valores de f). A Bisseção usa o valor médio xᵢ = (aᵢ + bᵢ)/2.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-10', 'lista-04', '10ª', 'Revisão', 'newton', 2, 'numero', 0, NULL, 'Realize duas iterações do método de Newton, com chute inicial x₀ = 1, para encontrar uma raiz de f(x) = x/4 + cos(x). A raiz aproximada x₂ é:', '2,10531', '2,10531', 2.10531107489, 2.10531, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x/4+cos(x)","df":"1/4-sin(x)","x0":1,"iteracoes":2}', 'Newton-Raphson: 2 iterações; x = 2,105311. 2 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | 0,790302 | −0,591471 | 2,336164 | 0,571948
1 | 2,336164 | −0,108761 | −0,471128 | 2,105311 | 0,109653', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10', 'A', '2,10531', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10', 'B', '2,13300', 0, 'Esse é o resultado com 3 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10', 'C', '2,33616', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10', 'D', '1,14691', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-10-r', 'lista-04', '10ª · 1º passo', 'Revisão', 'newton', 1, 'numero', 1, 'l04-10', 'Newton-Raphson, 1º passo: f(x) = x/4 + cos x, f′(x) = 1/4 − sen x e x₀ = 1. Qual é x₁?', NULL, '2,33616', 2.33616411653, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"newton","f":"x/4+cos(x)","df":"1/4-sin(x)","x0":1,"iteracoes":1}', 'Newton-Raphson: 1 iteração; x = 2,336164. 1 iterações, como pedido.
i | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | Eᵣ%
0 | 1,000000 | 0,790302 | −0,591471 | 2,336164 | 0,571948', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10-r', 'A', '2,10531', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10-r', 'B', '−0,33616', 0, 'Sinal trocado na fórmula: o certo é xᵢ₊₁ = xᵢ − f(xᵢ)/f′(xᵢ).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10-r', 'C', '2,33616', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-10-r', 'D', '−4,37459', 0, 'Calculadora em graus: nos métodos numéricos as funções trigonométricas usam radianos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-11', 'lista-04', '11ª', 'Revisão', 'falsa-posicao', 1, 'numero', 0, NULL, 'Seja a função f(x) = 2x − ln x − 7. Usando o método da Falsa Posição no intervalo [4,1; 4,3] e 2 iterações, encontre uma aproximação para a raiz.', '4,21991', '4,21991', 4.21990628996, 4.21991, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"2x-ln(x)-7","a":4.1,"b":4.3,"iteracoes":2}', 'Falsa Posição: 2 iterações; x = 4,219906. 2 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,100000 | 4,300000 | 4,219752 | −0,210987 | 0,141385 | −0,000272 | —
2 | 4,219752 | 4,300000 | 4,219906 | −0,000272 | 0,141385 | −0,000000 | 3,646×10⁻⁵', 'Na lista está escrito "log x", mas o intervalo [4,1; 4,3] só tem raiz com o logaritmo natural (ln).', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11', 'A', '4,21975', 0, 'Esse é o resultado com 1 iteração: faltou uma.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11', 'B', '4,38870', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11', 'C', '4,25000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11', 'D', '4,21991', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l04-11-r', 'lista-04', '11ª · 1º passo', 'Revisão', 'falsa-posicao', 1, 'numero', 1, 'l04-11', 'Falsa Posição, 1º passo: f(x) = 2x − ln x − 7 em [4,1; 4,3]. Qual é x₁?', NULL, '4,21975', 4.21975242246, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"falsaPosicao","f":"2x-ln(x)-7","a":4.1,"b":4.3,"iteracoes":1}', 'Falsa Posição: 1 iteração; x = 4,219752. 1 iterações, como pedido.
i | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | εₐ
1 | 4,100000 | 4,300000 | 4,219752 | −0,210987 | 0,141385 | −0,000272 | —', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11-r', 'A', '4,21975', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11-r', 'B', '4,20000', 0, 'Esse valor sai da Bisseção (valor médio). A Falsa Posição usa xᵢ = (aᵢ·f(bᵢ) − bᵢ·f(aᵢ)) / (f(bᵢ) − f(aᵢ)).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11-r', 'C', '4,05096', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l04-11-r', 'D', '4,21991', 0, 'Esse é o resultado com 2 iterações: uma a mais do que o pedido.');

-- ======================================================================
-- Lista 5 — Fatoração de Cholesky (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l05-1a', 'lista-05', '1ª (a)', 'Fatoração de Cholesky', 'cholesky', 2, 'matriz', 0, NULL, 'Use o algoritmo de Cholesky para encontrar uma fatoração da forma A = G·Gᵀ para A = [4 1 1 1; 1 3 −1 1; 1 −1 2 0; 1 1 0 2].', 'G = [2 0 0 0; 0,5 1,658311 0 0; 0,5 −0,7537785 1,087113 0; 0,5 0,4522671 0,08362442 1,240346]', 'G = [2 0 0 0; 0,5 1,6583 0 0; 0,5 −0,7538 1,0871 0; 0,5 0,4523 0,0836 1,2403]', NULL, NULL, NULL, NULL, '{"G":[[2,0,0,0],[0.5,1.65831239518,0,0],[0.5,-0.753778361444,1.08711461301,0],[0.5,0.452267016867,0.0836242010007,1.24034734589]]}', 4, NULL, '{"calc":"cholesky","A":[[4,1,1,1],[1,3,-1,1],[1,-1,2,0],[1,1,0,2]]}', 'A = G·Gᵀ com G triangular inferior: gⱼⱼ = √(aⱼⱼ − Σgⱼₖ²) e gᵢⱼ = (aᵢⱼ − Σgᵢₖgⱼₖ)/gⱼⱼ.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1a', 'A', 'G = [2 0 0 0; −0,5 1,6583 0 0; −0,5 0,7538 1,0871 0; −0,5 −0,4523 −0,0836 1,2403]', 0, 'Sinal dos elementos abaixo da diagonal trocado: gᵢⱼ = (aᵢⱼ − Σgᵢₖgⱼₖ)/gⱼⱼ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1a', 'B', 'G = [2 0,5 0,5 0,5; 0 1,6583 −0,7538 0,4523; 0 0 1,0871 0,0836; 0 0 0 1,2403]', 0, 'Essa é Gᵀ (triangular superior); a fatoração pede G triangular inferior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1a', 'C', 'G = [2 0 0 0; 0,5 1,6583 0 0; 0,5 −0,7538 1,0871 0; 0,5 0,4523 0,0836 1,2403]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1a', 'D', 'G = [4 0 0 0; 0,5 2,75 0 0; 0,5 −0,7538 1,1818 0; 0,5 0,4523 0,0836 1,5385]', 0, 'Faltou a raiz na diagonal: gⱼⱼ = √(aⱼⱼ − Σgⱼₖ²).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l05-1b', 'lista-05', '1ª (b)', 'Fatoração de Cholesky', 'cholesky', 2, 'matriz', 0, NULL, 'Use o algoritmo de Cholesky para encontrar uma fatoração da forma A = G·Gᵀ para A = [6 2 1 −1; 2 4 1 0; 1 1 4 −1; −1 0 −1 3].', 'G = [2,449489 0 0 0; 0,8164966 1,825741 0 0; 0,4082483 0,3651483 1,923538 0; −0,4082483 0,1825741 −0,4678876 1,606574]', 'G = [2,4495 0 0 0; 0,8165 1,8257 0 0; 0,4082 0,3651 1,9235 0; −0,4082 0,1826 −0,4679 1,6066]', NULL, NULL, NULL, NULL, '{"G":[[2.44948974278,0,0,0],[0.816496580928,1.82574185835,0,0],[0.408248290464,0.36514837167,1.92353840617,0],[-0.408248290464,0.182574185835,-0.467887720419,1.60657433102]]}', 4, NULL, '{"calc":"cholesky","A":[[6,2,1,-1],[2,4,1,0],[1,1,4,-1],[-1,0,-1,3]]}', 'A = G·Gᵀ com G triangular inferior: gⱼⱼ = √(aⱼⱼ − Σgⱼₖ²) e gᵢⱼ = (aᵢⱼ − Σgᵢₖgⱼₖ)/gⱼⱼ.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1b', 'A', 'G = [2,4495 0 0 0; −0,8165 1,8257 0 0; −0,4082 −0,3651 1,9235 0; 0,4082 −0,1826 0,4679 1,6066]', 0, 'Sinal dos elementos abaixo da diagonal trocado: gᵢⱼ = (aᵢⱼ − Σgᵢₖgⱼₖ)/gⱼⱼ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1b', 'B', 'G = [6 0 0 0; 0,8165 3,3333 0 0; 0,4082 0,3651 3,7 0; −0,4082 0,1826 −0,4679 2,5811]', 0, 'Faltou a raiz na diagonal: gⱼⱼ = √(aⱼⱼ − Σgⱼₖ²).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1b', 'C', 'G = [2,4495 0,8165 0,4082 −0,4082; 0 1,8257 0,3651 0,1826; 0 0 1,9235 −0,4679; 0 0 0 1,6066]', 0, 'Essa é Gᵀ (triangular superior); a fatoração pede G triangular inferior.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-1b', 'D', 'G = [2,4495 0 0 0; 0,8165 1,8257 0 0; 0,4082 0,3651 1,9235 0; −0,4082 0,1826 −0,4679 1,6066]', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l05-2a', 'lista-05', '2ª (a)', 'Fatoração de Cholesky', 'cholesky', 2, 'vetor', 0, NULL, 'Use a fatoração de Cholesky para resolver o sistema 4x₁ + x₂ + x₃ + x₄ = 0,65; x₁ + 4x₂ − x₃ + x₄ = 0,05; x₁ − x₂ + 2x₃ = 0; x₁ + x₂ + 2x₄ = 0,5.', '(0,2; −0,2; −0,2; 0,25)', '(0,1750; −0,1250; −0,1500; 0,2250)', NULL, NULL, '[0.175,-0.125,-0.15,0.225]', '[0.2,-0.2,-0.2,0.25]', NULL, 4, NULL, '{"calc":"cholesky-sistema","A":[[4,1,1,1],[1,4,-1,1],[1,-1,2,0],[1,1,0,2]],"b":[0.65,0.05,0,0.5]}', 'G·y = b dá y = (0,325000; −0,058095; −0,173205; 0,284605); Gᵀ·x = y dá x = (0,175000; −0,125000; −0,150000; 0,225000).', 'O gabarito da lista (0,2; −0,2; −0,2; 0,25) é a solução com 3x₂ na 2ª equação (a matriz da 1ª questão, item a). Com o sistema como está escrito (4x₂), a solução é (0,175; −0,125; −0,15; 0,225).', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2a', 'A', '(0,1750; −0,1250; −0,1500; 0,2250)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2a', 'B', '(0,1750; −0,1250; −0,1500; −0,2250)', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2a', 'C', '(−0,1250; 0,1750; −0,1500; 0,2250)', 0, 'Componentes trocadas de posição.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2a', 'D', '(0,1960; −0,1250; −0,1500; 0,2250)', 0, 'A primeira componente não confere: refaça a conta.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l05-2b', 'lista-05', '2ª (b)', 'Fatoração de Cholesky', 'cholesky', 2, 'vetor', 0, NULL, 'Use a fatoração de Cholesky para resolver o sistema 6x₁ + 2x₂ + x₃ − x₄ = 0; 2x₁ + 4x₂ + x₃ = 7; x₁ + x₂ + 4x₃ − x₄ = −1; −x₁ − x₃ + 3x₄ = −2.', '(−0,8586874; 2,4188482; −0,95811518; −1,2722513)', '(−0,8586; 2,4188; −0,9581; −1,2723)', NULL, NULL, '[-0.858638743455,2.41884816754,-0.958115183246,-1.2722513089]', '[-0.8586874,2.4188482,-0.95811518,-1.2722513]', NULL, 4, NULL, '{"calc":"cholesky-sistema","A":[[6,2,1,-1],[2,4,1,0],[1,1,4,-1],[-1,0,-1,3]],"b":[0,7,-1,-2]}', 'G·y = b dá y = (0,000000; 3,834058; −1,247701; −2,043966); Gᵀ·x = y dá x = (−0,858639; 2,418848; −0,958115; −1,272251).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2b', 'A', '(2,4188; −0,8586; −0,9581; −1,2723)', 0, 'Componentes trocadas de posição.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2b', 'B', '(−0,8586; 2,4188; −0,9581; −1,2723)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2b', 'C', '(−0,8586; 2,4188; −0,9581; 1,2723)', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-2b', 'D', '(−0,9617; 2,4188; −0,9581; −1,2723)', 0, 'A primeira componente não confere: refaça a conta.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l05-3', 'lista-05', '3ª', 'Fatoração de Cholesky', 'cholesky', 1, 'matriz', 1, NULL, 'A matriz M admite uma fatoração de Cholesky cuja matriz triangular superior é R = [2 1 −2; 0 3 2; 0 0 1]. Determine a matriz M.', NULL, 'M = [4 2 −4; 2 10 4; −4 4 9]', NULL, NULL, NULL, NULL, '{"M":[[4,2,-4],[2,10,4],[-4,4,9]]}', 4, NULL, '{"calc":"cholesky-M","R":[[2,1,-2],[0,3,2],[0,0,1]]}', 'M = Rᵀ·R (a transposta da triangular superior vezes ela mesma).', 'A lista não traz a resposta desta questão; a resposta é a calculada (igual à 13ª questão da Lista 3).', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-3', 'A', 'M = [4 1 −2; 1 9 2; −2 2 1]', 0, 'Elevou só a diagonal ao quadrado: cada mᵢⱼ é uma soma de produtos (Rᵀ·R).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-3', 'B', 'M = [4 2 −4; 2 10 4; −4 4 9]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-3', 'C', 'M = [4 −2 4; −2 10 −4; 4 −4 9]', 0, 'Sinais fora da diagonal trocados.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l05-3', 'D', 'M = [9 −1 −2; −1 13 2; −2 2 1]', 0, 'Multiplicou R·Rᵀ; com R triangular superior, M = Rᵀ·R.');

-- ======================================================================
-- Lista 6 — Interpolação (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-01', 'lista-06', '1ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Obtenha ln(3,7) por interpolação linear, onde f(x) = ln(x) está tabelada: xᵢ: 1,0 | 2,0 | 3,0 | 4,0; fᵢ: 0,0000 | 0,6931 | 1,0986 | 1,3863.', '1,3000', '1,3000', 1.29999, 1.3, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-linear","xs":[1,2,3,4],"ys":[0,0.6931,1.0986,1.3863],"x":3.7}', 'Entre os dois pontos vizinhos de x = 3,7: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = 1,3000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-01', 'A', '1,3520', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-01', 'B', '1,3863', 0, 'Esse é só o valor tabelado mais próximo, sem interpolar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-01', 'C', '1,3000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-01', 'D', '1,3825', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-02', 'lista-06', '2ª', 'Interpolação', 'interpolacao', 1, 'numero', 0, NULL, 'Obtenha ln(3,7) por interpolação linear (tabela: xᵢ: 1,0 | 2,0 | 3,0 | 4,0; fᵢ: 0,0000 | 0,6931 | 1,0986 | 1,3863) e determine o erro relativo cometido, sabendo que ln(3,7) = 1,3083. Considere 4 casas decimais.', '0,60%', '0,64%', 0.635175418482, 0.6, NULL, NULL, NULL, 2, NULL, '{"calc":"interp-linear-erro","xs":[1,2,3,4],"ys":[0,0.6931,1.0986,1.3863],"x":3.7,"exato":1.3083}', 'p₁(3,7) = 1,3000; erro relativo = |1,3000 − 1,3083| / 1,3083 × 100% = 0,64%.', 'O gabarito da lista (0,60%) não confere: p₁(3,7) = 1,3000 e |1,3000 − 1,3083| / 1,3083 = 0,63%.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-02', 'A', '0,83%', 0, 'Esse é o erro absoluto (× 100); o relativo divide por |valor correto|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-02', 'B', '0,64%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-02', 'C', '0,01%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-02', 'D', '5,67%', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-03', 'lista-06', '3ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Obtenha ln(2,4) por interpolação linear, onde f(x) = ln(x) está tabelada: xᵢ: 1,0 | 2,0 | 3,0 | 4,0; fᵢ: 0,0000 | 0,6931 | 1,0986 | 1,3863.', '0,8553', '0,8553', 0.8553, 0.8553, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-linear","xs":[1,2,3,4],"ys":[0,0.6931,1.0986,1.3863],"x":2.4}', 'Entre os dois pontos vizinhos de x = 2,4: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = 0,8553.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-03', 'A', '0,8553', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-03', 'B', '0,9703', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-03', 'C', '0,8211', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-03', 'D', '0,6931', 0, 'Esse é só o valor tabelado mais próximo, sem interpolar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-04', 'lista-06', '4ª', 'Interpolação', 'interpolacao', 1, 'numero', 0, NULL, 'Obtenha ln(2,4) por interpolação linear (tabela: xᵢ: 1,0 | 2,0 | 3,0 | 4,0; fᵢ: 0,0000 | 0,6931 | 1,0986 | 1,3863) e determine o erro relativo cometido, sabendo que ln(2,4) = 0,8755. Considere 4 casas decimais.', '2,30%', '2,31%', 2.30725299829, 2.3, NULL, NULL, NULL, 2, 0.01, '{"calc":"interp-linear-erro","xs":[1,2,3,4],"ys":[0,0.6931,1.0986,1.3863],"x":2.4,"exato":0.8755}', 'p₁(2,4) = 0,8553; erro relativo = |0,8553 − 0,8755| / 0,8755 × 100% = 2,31%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-04', 'A', '10,83%', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-04', 'B', '2,31%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-04', 'C', '2,02%', 0, 'Esse é o erro absoluto (× 100); o relativo divide por |valor correto|.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-04', 'D', '0,02%', 0, 'Faltou multiplicar por 100.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-05', 'lista-06', '5ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Através de um polinômio do segundo grau, encontre f(0,5) para a tabela xᵢ: −1,0 | 0,0 | 2,0; fᵢ: 4,0 | 2,0 | 0,0. Considere 4 casas decimais.', '1,2500', '1,2500', 1.25, 1.25, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-poli","xs":[-1,0,2],"ys":[4,2,0],"x":0.5}', 'Polinômio de grau 2 pelos pontos dados (Lagrange): p(0,50000) = 1,25000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-05', 'A', '1,2500', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-05', 'B', '1,3000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-05', 'C', '1,3625', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-05', 'D', '1,5000', 0, 'Esse é o valor da interpolação linear entre os vizinhos; a questão pede o polinômio que passa por todos os pontos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-06', 'lista-06', '6ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Através de um polinômio do segundo grau, encontre f(1,0) para a tabela xᵢ: −1,0 | 0,0 | 2,0; fᵢ: 6,0 | 3,0 | 9,0. Considere 4 casas decimais.', '4,000', '4,000', 4, 4, NULL, NULL, NULL, 3, NULL, '{"calc":"interp-poli","xs":[-1,0,2],"ys":[6,3,9],"x":1}', 'Polinômio de grau 2 pelos pontos dados (Lagrange): p(1,00000) = 4,00000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-06', 'A', '4,360', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-06', 'B', '4,160', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-06', 'C', '6,000', 0, 'Esse é o valor da interpolação linear entre os vizinhos; a questão pede o polinômio que passa por todos os pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-06', 'D', '4,000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-07', 'lista-06', '7ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Usando a interpolação linear, determine x* tal que f(x*) = 1,95, para a tabela xᵢ: 0,5 | 0,6 | 0,7 | 0,8; fᵢ: 1,65 | 1,82 | 2,01 | 2,23. Trabalhe com 4 casas decimais.', '0,6684', '0,6684', 0.668421052632, 0.6684, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-inversa-linear","xs":[0.5,0.6,0.7,0.8],"ys":[1.65,1.82,2.01,2.23],"y":1.95}', 'Interpolação linear invertida entre os pontos vizinhos de y = 1,95: x* = 0,6684.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-07', 'A', '0,6952', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-07', 'B', '0,6684', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-07', 'C', '0,6765', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-07', 'D', '0,6727', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-08', 'lista-06', '8ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Dada a tabela xᵢ: 1,3 | 1,4 | 1,5; fᵢ: 3,669 | 4,055 | 4,482, determine o polinômio interpolador que passa por todos os pontos e calcule f(1,35).', '3,857', '3,857', 3.856875, 3.857, NULL, NULL, NULL, 3, NULL, '{"calc":"interp-poli","xs":[1.3,1.4,1.5],"ys":[3.669,4.055,4.482],"x":1.35}', 'Polinômio de grau 2 pelos pontos dados (Lagrange): p(1,35000) = 3,85688.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-08', 'A', '3,862', 0, 'Esse é o valor da interpolação linear entre os vizinhos; a questão pede o polinômio que passa por todos os pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-08', 'B', '3,857', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-08', 'C', '3,510', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-08', 'D', '3,703', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-09', 'lista-06', '9ª', 'Interpolação', 'interpolacao', 1, 'vetor', 0, NULL, 'Dada a tabela xᵢ: 3,0 | 3,1 | 3,2 | 3,3; fᵢ: 1,0986 | 1,1314 | 1,1632 | 1,1939, determine o polinômio do primeiro grau que passa pelos pontos 3,1 e 3,2.', '0,3180x + 0,1456', 'p(x) = 0,3180x + 0,1456', NULL, NULL, '[0.1456,0.318]', '[0.1456,0.318]', NULL, 4, NULL, '{"calc":"interp-poli-coef","xs":[3.1,3.2],"ys":[1.1314,1.1632]}', 'p(x) = 0,3180x + 0,1456.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-09', 'A', 'p(x) = 0,3180x + 0,1631', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-09', 'B', 'p(x) = −0,3180x + 0,1456', 0, 'Sinais trocados nos termos de grau ímpar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-09', 'C', 'p(x) = 0,3180x + 0,1456', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-09', 'D', 'p(x) = 0,1456x + 0,3180', 0, 'Coeficientes na ordem inversa.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-10', 'lista-06', '10ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Dada a tabela xᵢ: 3,0 | 3,1 | 3,2 | 3,3; fᵢ: 1,0986 | 1,1314 | 1,1632 | 1,1939, determine o polinômio do primeiro grau que passa pelos pontos 3,1 e 3,2 e calcule f(3,16).', '1,1505', '1,1505', 1.15048, 1.1505, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-linear","xs":[3,3.1,3.2,3.3],"ys":[1.0986,1.1314,1.1632,1.1939],"x":3.16}', 'Entre os dois pontos vizinhos de x = 3,16: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = 1,1505.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-10', 'A', '1,1511', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-10', 'B', '1,1965', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-10', 'C', '1,1632', 0, 'Esse é só o valor tabelado mais próximo, sem interpolar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-10', 'D', '1,1505', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-11', 'lista-06', '11ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Seja a função y = f(x) definida pelos pontos (0,00; 1,35) e (1,00; 2,94). Determine x* tal que f(x*) = 2,78.', '0,8994', '0,8994', 0.899371069182, 0.8994, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-inversa-linear","xs":[0,1],"ys":[1.35,2.94],"y":2.78}', 'Interpolação linear invertida entre os pontos vizinhos de y = 2,78: x* = 0,8994.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-11', 'A', '0,9353', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-11', 'B', '0,9803', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-11', 'C', '0,7645', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-11', 'D', '0,8994', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-12', 'lista-06', '12ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Determine a função quadrática que se aproxima de f(x) dada na tabela xᵢ: 0,0 | π/6 | π/4; fᵢ: 0,0000 | 0,3282 | 0,5601 e calcule f(π/12). Considere 5 casas decimais.', '0,1415', '0,1415', 0.1415, 0.1415, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-poli","xs":[0,0.5235987755982988,0.7853981633974483],"ys":[0,0.3282,0.5601],"x":0.2617993877991494}', 'Polinômio de grau 2 pelos pontos dados (Lagrange): p(0,26180) = 0,14150.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-12', 'A', '0,1641', 0, 'Esse é o valor da interpolação linear entre os vizinhos; a questão pede o polinômio que passa por todos os pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-12', 'B', '0,1288', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-12', 'C', '0,1472', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-12', 'D', '0,1415', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-13', 'lista-06', '13ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Qual o valor de c para que g(x) = −x² + 2x + c interpole os pontos (0, 1) e (2, 1)?', 'c = 1', '1', 1, 1, NULL, NULL, NULL, 0, NULL, '{"calc":"interp-c","x0":0,"y0":1}', 'g(0) = 1 ⇒ c = 1.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-13', 'A', '1', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-13', 'B', '−2', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-13', 'C', '3', 0, 'Confira g(0) = c.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-13', 'D', '−1', 0, 'Sinal trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-14', 'lista-06', '14ª', 'Interpolação', 'interpolacao', 3, 'vetor', 0, NULL, 'Qual polinômio interpola os pontos da tabela x: 1 | 2 | 3 | 4; y: 1958 | 1962 | 1970 | 1994?', 'p(x) = 2x³ − 10x² + 20x + 1946', 'p(x) = 2,00x³ − 10,00x² + 20,00x + 1946,00', NULL, NULL, '[1946,20,-10,2]', '[1946,20,-10,2]', NULL, 2, NULL, '{"calc":"interp-poli-coef","xs":[1,2,3,4],"ys":[1958,1962,1970,1994]}', 'p(x) = 2,0000x³ − 10,0000x² + 20,0000x + 1946,0000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-14', 'A', 'p(x) = 2,00x³ − 10,00x² + 20,00x + 1946,00', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-14', 'B', 'p(x) = 1946,00x³ + 20,00x² − 10,00x + 2,00', 0, 'Coeficientes na ordem inversa.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-14', 'C', 'p(x) = −2,00x³ − 10,00x² + 20,00x + 1946,00', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-14', 'D', 'p(x) = −2,00x³ − 10,00x² − 20,00x + 1946,00', 0, 'Sinais trocados nos termos de grau ímpar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-15', 'lista-06', '15ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Obtenha f(3,6) por interpolação linear, onde f(x) está tabelada: xᵢ: 1,5 | 2,4 | 3,2 | 4,1; fᵢ: −0,5945 | −0,1245 | 0,1632 | 0,4111.', '0,2734', '0,2734', 0.273377777778, 0.2734, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-linear","xs":[1.5,2.4,3.2,4.1],"ys":[-0.5945,-0.1245,0.1632,0.4111],"x":3.6}', 'Entre os dois pontos vizinhos de x = 3,6: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = 0,2734.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-15', 'A', '0,3071', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-15', 'B', '0,2734', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-15', 'C', '0,2843', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-15', 'D', '0,1632', 0, 'Esse é só o valor tabelado mais próximo, sem interpolar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-16', 'lista-06', '16ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Obtenha x* tal que f(x*) = 0,27336 por interpolação linear, onde f(x) está tabelada: xᵢ: 1,5 | 2,4 | 3,2 | 4,1; fᵢ: −0,5945 | −0,1245 | 0,1632 | 0,4111.', '3,60', '3,60', 3.59993545785, 3.6, NULL, NULL, NULL, 2, NULL, '{"calc":"interp-inversa-linear","xs":[1.5,2.4,3.2,4.1],"ys":[-0.5945,-0.1245,0.1632,0.4111],"y":0.27336}', 'Interpolação linear invertida entre os pontos vizinhos de y = 0,27336: x* = 3,5999.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-16', 'A', '3,16', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-16', 'B', '3,60', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-16', 'C', '3,51', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-16', 'D', '3,46', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-17', 'lista-06', '17ª', 'Interpolação', 'interpolacao', 1, 'numero', 1, NULL, 'Obtenha f(3,8) por interpolação linear, onde f(x) está tabelada: xᵢ: 1,5 | 2,4 | 3,2 | 4,1; fᵢ: −0,5945 | −0,1245 | 0,1632 | 0,4111.', '0,3285', '0,3285', 0.328466666667, 0.3285, NULL, NULL, NULL, 4, NULL, '{"calc":"interp-linear","xs":[1.5,2.4,3.2,4.1],"ys":[-0.5945,-0.1245,0.1632,0.4111],"x":3.8}', 'Entre os dois pontos vizinhos de x = 3,8: p₁(x) = y₀ + (y₁ − y₀)(x − x₀)/(x₁ − x₀) = 0,3285.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-17', 'A', '0,4111', 0, 'Esse é só o valor tabelado mais próximo, sem interpolar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-17', 'B', '0,3416', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-17', 'C', '0,3790', 0, 'Usou o segmento errado da tabela: a interpolação linear usa os dois pontos vizinhos de x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-17', 'D', '0,3285', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-18', 'lista-06', '18ª', 'Interpolação', 'interpolacao', 2, 'numero', 0, NULL, 'Dada a tabela x: 2,00 | 2,50 | 3,00; f(x): 0,301 | 0,398 | 0,477, obtenha f(2,40) por interpolação polinomial, usando a fórmula de Lagrange.', '0,380', '0,380', 0.38004, 0.38, NULL, NULL, NULL, 3, NULL, '{"calc":"interp-poli","xs":[2,2.5,3],"ys":[0.301,0.398,0.477],"x":2.4}', 'Polinômio de grau 2 pelos pontos dados (Lagrange): p(2,40000) = 0,38004.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-18', 'A', '0,365', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-18', 'B', '0,346', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-18', 'C', '0,379', 0, 'Esse é o valor da interpolação linear entre os vizinhos; a questão pede o polinômio que passa por todos os pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-18', 'D', '0,380', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-19', 'lista-06', '19ª', 'Interpolação', 'interpolacao', 2, 'vetor', 0, NULL, 'Dada a tabela x: 2,00 | 2,50 | 3,00; f(x): 0,301 | 0,398 | 0,477, obtenha o polinômio que melhor interpola a função f(x).', '−0,036x² + 0,356x − 0,267', 'p(x) = −0,036x² + 0,356x − 0,267', NULL, NULL, '[-0.267,0.356,-0.036]', '[-0.267,0.356,-0.036]', NULL, 3, NULL, '{"calc":"interp-poli-coef","xs":[2,2.5,3],"ys":[0.301,0.398,0.477]}', 'p(x) = −0,0360x² + 0,3560x − 0,2670.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-19', 'A', 'p(x) = −0,036x² + 0,356x − 0,267', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-19', 'B', 'p(x) = −0,267x² + 0,356x − 0,036', 0, 'Coeficientes na ordem inversa.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-19', 'C', 'p(x) = −0,036x² − 0,356x − 0,267', 0, 'Sinais trocados nos termos de grau ímpar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-19', 'D', 'p(x) = 0,036x² + 0,356x − 0,267', 0, 'Sinal da última componente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l06-20', 'lista-06', '20ª', 'Interpolação', 'interpolacao', 3, 'numero', 0, NULL, 'Dada a tabela x: 2,00 | 2,50 | 3,00; f(x): 0,301 | 0,398 | 0,477, obtenha a melhor aproximação para x* tal que f(x*) = 0,350, utilizando um polinômio que passe por x₀, x₁ e x₂.', '2,236', '2,237', 2.23688206613, 2.236, NULL, NULL, NULL, 3, 0.002, '{"calc":"interp-inversa-lagrange","xs":[2,2.5,3],"ys":[0.301,0.398,0.477],"y":0.35}', 'Interpolação inversa: trocamos os papéis de x e y e passamos o polinômio de Lagrange pelos pontos (yᵢ; xᵢ). Em y = 0,35: x* = 2,2369.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-20', 'A', '2,253', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-20', 'B', '2,237', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-20', 'C', '2,196', 0, 'Usou outro par de pontos da tabela: o certo é o segmento em que f passa por ȳ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l06-20', 'D', '2,241', 0, 'Resolveu p(x*) = ȳ com o polinômio direto; a lista usa a interpolação inversa (x como polinômio em y).');

-- ======================================================================
-- Lista 7 — Ajuste de curvas (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-01', 'lista-07', '1ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'A partir da reta que melhor ajusta os pontos da tabela (x: 0 | 1 | 2 | 3 | 4; y: 0 | 1 | 1 | 4 | 4), determine a imagem de x = 5.', '5,3', '5,3', 5.3, 5.3, NULL, NULL, NULL, 1, NULL, '{"calc":"mq","base":"reta","xs":[0,1,2,3,4],"ys":[0,1,1,4,4],"x":5}', 'g(x) = −0,2000 + 1,1000·x; g(5) = 5,3000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-01', 'A', '5,0', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-01', 'B', '5,3', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-01', 'C', '4,5', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-01', 'D', '5,8', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede a reta.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-02', 'lista-07', '2ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(x) = a + bx² aos pontos da tabela (x: 0,0 | 1,0 | 2,0; f(x): 1,1 | 0,1 | −3,1).', 'g(x) = −1,05x² + 1,12', 'g(x) = −1,05x² + 1,12', NULL, NULL, '[1.12307692308,-1.05384615385]', '[1.12,-1.05]', NULL, 2, 0.006, '{"calc":"mq","base":"a+bx2","xs":[0,1,2],"ys":[1.1,0.1,-3.1]}', 'g(x) = 1,1231 − 1,0538·x².', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-02', 'A', 'g(x) = −1,05x² + 1,12', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-02', 'B', 'g(x) = −1,05x² + 1,26', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-02', 'C', 'g(x) = 1,12x² − 1,05', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-02', 'D', 'g(x) = 1,05x² + 1,12', 0, 'Sinal do segundo coeficiente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-03', 'lista-07', '3ª', 'Ajuste de Curvas', 'minimos-quadrados', 3, 'numero', 0, NULL, 'Um sinal em um osciloscópio pode ser aproximado por uma função da forma g(x) = a·x + b·cos x. Algumas medidas: xᵢ: 0,0 | 1,5 | 3,0 | 4,5 | 6,0; fᵢ: 1,00 | 1,57 | 2,00 | 4,30 | 7,00. Utilizando o método dos mínimos quadrados, obtenha um valor aproximado para g(3,5).', '2,5630', '2,5631', 2.56307186609, 2.563, NULL, NULL, NULL, 4, 0.0002, '{"calc":"mq","base":"ax+bcos","xs":[0,1.5,3,4.5,6],"ys":[1,1.57,2,4.3,7],"x":3.5}', 'g(x) = 1,0034·x + 1,0133·cos x; g(3,5) = 2,5631.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-03', 'A', '2,9243', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede g(x) = a·x + b·cos x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-03', 'B', '2,5631', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-03', 'C', '3,6650', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede g(x) = a·x + b·cos x.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-03', 'D', '2,8379', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede g(x) = a·x + b·cos x.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-04', 'lista-07', '4ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(x) = a + bx² aos pontos da tabela (x: 0,0 | 1,0 | 2,0; f(x): 1,1 | 0,1 | −3,1) e determine aproximadamente x* tal que g(x*) = −2,5.', '1,8568', '1,8542', 1.85417264686, 1.8568, NULL, NULL, NULL, 4, 0.005, '{"calc":"mq","base":"a+bx2","xs":[0,1,2],"ys":[1.1,0.1,-3.1],"y":-2.5,"faixa":[0,4]}', 'g(x) = 1,1231 − 1,0538·x²; g(x*) = −2,5 ⇒ x* = 1,8542.', 'A lista chega a 1,8568 usando os coeficientes já arredondados (1,12 e −1,05); com os coeficientes completos, x* = 1,8542.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-04', 'A', '1,7800', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-04', 'B', '1,8889', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede g(x) = a + bx².');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-04', 'C', '1,8542', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-04', 'D', '1,6873', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-05', 'lista-07', '5ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'A partir da reta que melhor ajusta os pontos da tabela (x: 0 | 1 | 2 | 3 | 4; y: 0 | 1 | 1 | 4 | 4), determine de forma aproximada x* tal que g(x*) = 3,5.', '3,364', '3,364', 3.36363636364, 3.364, NULL, NULL, NULL, 3, NULL, '{"calc":"mq","base":"reta","xs":[0,1,2,3,4],"ys":[0,1,1,4,4],"y":3.5}', 'g(x) = −0,2000 + 1,1000·x; g(x*) = 3,5 ⇒ x* = 3,3636.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-05', 'A', '3,666', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-05', 'B', '3,498', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-05', 'C', '3,371', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede a reta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-05', 'D', '3,364', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-06', 'lista-07', '6ª', 'Ajuste de Curvas', 'minimos-quadrados', 1, 'vetor', 0, NULL, 'Qual a reta que melhor ajusta os pontos da tabela x: 4,0 | 5,0 | 6,0 | 7,0; y: 0,000 | 0,405 | 0,588 | 0,693?', 'y = 0,226x − 0,822', 'g(x) = 0,226x − 0,823', NULL, NULL, '[-0.8226,0.2262]', '[-0.822,0.226]', NULL, 3, NULL, '{"calc":"mq","base":"reta","xs":[4,5,6,7],"ys":[0,0.405,0.588,0.693]}', 'g(x) = −0,8226 + 0,2262·x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-06', 'A', 'g(x) = 0,226x − 0,921', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-06', 'B', 'g(x) = −0,823x + 0,226', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-06', 'C', 'g(x) = −0,226x − 0,823', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-06', 'D', 'g(x) = 0,226x − 0,823', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-07', 'lista-07', '7ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Ajuste os dados da tabela (x: 1 | 2 | 3; y: 1 | 2 | 4) por um polinômio da forma g(x) = a + bx + cx² pelo método dos mínimos quadrados. Determine g(4).', '7,000', '7,000', 7, 7, NULL, NULL, NULL, 3, NULL, '{"calc":"mq","base":"parabola","xs":[1,2,3],"ys":[1,2,4],"x":4}', 'g(x) = 1,0000 − 0,5000·x + 0,5000·x²; g(4) = 7,0000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-07', 'A', '8,000', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-07', 'B', '5,333', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-07', 'C', '7,280', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-07', 'D', '7,000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-08', 'lista-07', '8ª', 'Ajuste de Curvas', 'minimos-quadrados', 3, 'numero', 0, NULL, 'Ajuste os dados da tabela (x: 1 | 2 | 3; y: 1 | 2 | 4) por um polinômio da forma g(x) = a + bx + cx² pelo método dos mínimos quadrados. Determine aproximadamente x* tal que g(x*) = 3,0.', '2,56', '2,56', 2.56155281281, 2.56, NULL, NULL, NULL, 2, NULL, '{"calc":"mq","base":"parabola","xs":[1,2,3],"ys":[1,2,4],"y":3,"faixa":[1,4]}', 'g(x) = 1,0000 − 0,5000·x + 0,5000·x²; g(x*) = 3 ⇒ x* = 2,5616.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-08', 'A', '2,44', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-08', 'B', '2,46', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-08', 'C', '2,58', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-08', 'D', '2,56', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-09', 'lista-07', '9ª', 'Ajuste de Curvas', 'minimos-quadrados', 1, 'vetor', 0, NULL, 'A tabela mostra o resultado de um teste com 3 digitadores de idades diferentes (idade: 30 | 35 | 40; palavras por minuto: 70 | 65 | 58). Utilizando o método dos mínimos quadrados, encontre a reta y = c₀ + c₁x que melhor ajusta os pontos, sendo x a idade e y o número de palavras por minuto.', 'y = 106,33 − 1,2x', 'g(x) = −1,20x + 106,33', NULL, NULL, '[106.333333333,-1.2]', '[106.33,-1.2]', NULL, 2, NULL, '{"calc":"mq","base":"reta","xs":[30,35,40],"ys":[70,65,58]}', 'g(x) = 106,3333 − 1,2000·x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-09', 'A', 'g(x) = 1,20x + 106,33', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-09', 'B', 'g(x) = −1,20x + 106,33', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-09', 'C', 'g(x) = −1,20x + 119,09', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-09', 'D', 'g(x) = 106,33x − 1,20', 0, 'Coeficientes trocados de lugar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-10', 'lista-07', '10ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Com a reta de mínimos quadrados dos digitadores (idade: 30 | 35 | 40; palavras por minuto: 70 | 65 | 58), determine aproximadamente a idade do digitador capaz de digitar 39 palavras por minuto.', '56', '56', 56.1111111111, 56, NULL, NULL, NULL, 0, 0.6, '{"calc":"mq","base":"reta","xs":[30,35,40],"ys":[70,65,58],"y":39,"faixa":[30,80]}', 'g(x) = 106,3333 − 1,2000·x; g(x*) = 39 ⇒ x* = 56,1111.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-10', 'A', '50', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede a reta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-10', 'B', '61', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede a reta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-10', 'C', '56', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-10', 'D', '59', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-11', 'lista-07', '11ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'A população de uma localidade variou com o tempo segundo a tabela (ano: 4 | 5 | 6 | 7; população × 10⁴: 1,0 | 1,5 | 1,8 | 2,0). Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(t) = at² + bt + c.', 'g(t) = −0,075t² + 1,155t − 2,415', 'g(x) = −0,075x² + 1,155x − 2,415', NULL, NULL, '[-2.415,1.155,-0.075]', '[-2.415,1.155,-0.075]', NULL, 3, NULL, '{"calc":"mq","base":"parabola","xs":[4,5,6,7],"ys":[1,1.5,1.8,2]}', 'g(x) = −2,4150 + 1,1550·x − 0,0750·x².', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-11', 'A', 'g(x) = −0,075x² + 1,155x − 2,415', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-11', 'B', 'g(x) = 0,075x² + 1,155x − 2,415', 0, 'Sinal da última componente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-11', 'C', 'g(x) = −0,075x² − 2,415x + 1,155', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-11', 'D', 'g(x) = −0,075x² − 1,155x − 2,415', 0, 'Sinal do segundo coeficiente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-12', 'lista-07', '12ª', 'Ajuste de Curvas', 'minimos-quadrados', 3, 'numero', 0, NULL, 'Com o ajuste g(t) = at² + bt + c da população (ano: 4 | 5 | 6 | 7; população × 10⁴: 1,0 | 1,5 | 1,8 | 2,0), determine aproximadamente em que ano a população era de 17 000 pessoas.', '5,6', '5,6', 5.59682779275, 5.6, NULL, NULL, NULL, 1, NULL, '{"calc":"mq","base":"parabola","xs":[4,5,6,7],"ys":[1,1.5,1.8,2],"y":1.7,"faixa":[4,7]}', 'g(x) = −2,4150 + 1,1550·x − 0,0750·x²; g(x*) = 1,7 ⇒ x* = 5,5968.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-12', 'A', '6,0', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-12', 'B', '5,9', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede a parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-12', 'C', '5,3', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-12', 'D', '5,6', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-13', 'lista-07', '13ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Com os dados da população (ano: 4 | 5 | 6 | 7; população × 10⁴: 1,0 | 1,5 | 1,8 | 2,0), ajuste pelo método dos mínimos quadrados uma função do tipo g(t) = a·eᵇᵗ.', 'g(t) = 0,439·e^(0,226t)', 'g(t) = 0,439·e^(0,226t)', NULL, NULL, '[0.43938908248,0.226176309847]', '[0.439,0.226]', NULL, 3, NULL, '{"calc":"mq","base":"exp","xs":[4,5,6,7],"ys":[1,1.5,1.8,2]}', 'g(t) = 0,439·e^(0,226t).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-13', 'A', 'g(t) = 0,226·e^(0,439t)', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-13', 'B', 'g(t) = 0,439·e^(−0,226t)', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-13', 'C', 'g(t) = −0,822·e^(0,226t)', 0, 'Esse é o coeficiente linear da reta ajustada (ln a ou log a): falta voltar para a, elevando e (ou 10) a esse valor.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-13', 'D', 'g(t) = 0,439·e^(0,226t)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-14', 'lista-07', '14ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Uma função f varia segundo a tabela x: 0,00 | 0,25 | 0,50 | 0,75 | 1,00; f(x): 1,0000 | 1,2840 | 1,6487 | 2,1179 | 2,7183. Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(x) = ax² + bx + c.', 'g(x) = 0,8432x² + 0,8647x + 1,0051', 'g(x) = 0,8426x² + 0,8656x + 1,0050', NULL, NULL, '[1.00500857143,0.865571428571,0.842628571429]', '[1.0051,0.8647,0.8432]', NULL, 4, 0.002, '{"calc":"mq","base":"parabola","xs":[0,0.25,0.5,0.75,1],"ys":[1,1.284,1.6487,2.1179,2.7183]}', 'g(x) = 1,0050 + 0,8656·x + 0,8426·x².', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-14', 'A', 'g(x) = 0,8426x² + 1,0050x + 0,8656', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-14', 'B', 'g(x) = 0,8426x² + 0,8656x + 1,0050', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-14', 'C', 'g(x) = 0,8426x² − 0,8656x + 1,0050', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-14', 'D', 'g(x) = −0,8426x² + 0,8656x + 1,0050', 0, 'Sinal da última componente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-15', 'lista-07', '15ª', 'Ajuste de Curvas', 'minimos-quadrados', 1, 'vetor', 0, NULL, 'Uma rede de eletrodomésticos tem o volume de computadores vendidos em função do tempo (t (mês): 1 | 2 | 3 | 4 | 5 | 6; n(t) (× 10³): 9 | 11 | 10 | 13 | 13 | 14). Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(t) = at + b.', 'g(t) = 0,97t + 8,27', 'g(x) = 0,97x + 8,27', NULL, NULL, '[8.26666666667,0.971428571429]', '[8.27,0.97]', NULL, 2, NULL, '{"calc":"mq","base":"reta","xs":[1,2,3,4,5,6],"ys":[9,11,10,13,13,14]}', 'g(x) = 8,2667 + 0,9714·x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-15', 'A', 'g(x) = 0,97x + 9,26', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-15', 'B', 'g(x) = 0,97x + 8,27', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-15', 'C', 'g(x) = −0,97x + 8,27', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-15', 'D', 'g(x) = 8,27x + 0,97', 0, 'Coeficientes trocados de lugar.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-16', 'lista-07', '16ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Com o ajuste g(t) = at + b das vendas (t (mês): 1 | 2 | 3 | 4 | 5 | 6; n(t) (× 10³): 9 | 11 | 10 | 13 | 13 | 14), determine em que mês o número de computadores vendidos será 16 000.', '8', '8', 7.96078431373, 8, NULL, NULL, NULL, 0, 0.1, '{"calc":"mq","base":"reta","xs":[1,2,3,4,5,6],"ys":[9,11,10,13,13,14],"y":16,"faixa":[1,12]}', 'g(x) = 8,2667 + 0,9714·x; g(x*) = 16 ⇒ x* = 7,9608.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-16', 'A', '2', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-16', 'B', '7', 0, 'Esse é o resultado com outro ajuste (uma exponencial); a questão pede a reta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-16', 'C', '5', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-16', 'D', '8', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-17', 'lista-07', '17ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'A partir dos valores tabelados x: 0 | 100 | 200 | 300 | 400; y: 50 | 40 | 25 | 15 | 0, calcule a relação linear que melhor expressa y como função de x e determine a imagem de 600.', '−24', '−24', -24, -24, NULL, NULL, NULL, 0, NULL, '{"calc":"mq","base":"reta","xs":[0,100,200,300,400],"ys":[50,40,25,15,0],"x":600}', 'g(x) = 51,0000 − 0,1250·x; g(600) = −24,0000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-17', 'A', '21', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede a reta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-17', 'B', '−18', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-17', 'C', '−27', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-17', 'D', '−24', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-18', 'lista-07', '18ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Ache a função do tipo y = a + bx³ que melhor se ajusta à tabela x: 5 | 7 | 9 | 11 | 12; y: 290 | 560 | 1184 | 1810 | 2300, pelo método dos mínimos quadrados.', 'y = 166,8 + 1,25x³', 'g(x) = 166,80 + 1,25x³', NULL, NULL, '[166.804506542,1.2476450816]', '[166.8,1.25]', NULL, 2, 0.06, '{"calc":"mq","base":"a+bx3","xs":[5,7,9,11,12],"ys":[290,560,1184,1810,2300]}', 'g(x) = 166,8045 + 1,2476·x³.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-18', 'A', 'g(x) = 166,80 − 1,25x³', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-18', 'B', 'g(x) = 1,25 + 166,80x³', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-18', 'C', 'g(x) = 186,82 + 1,25x³', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-18', 'D', 'g(x) = 166,80 + 1,25x³', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-19', 'lista-07', '19ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'A população de uma localidade variou segundo a tabela ano: 2 | 3 | 4 | 5; população × 10⁴: 0,69 | 0,81 | 1,08 | 1,46. Utilizando o método dos mínimos quadrados, ajuste uma função do tipo g(t) = a·eᵇᵗ e calcule a população no ano 7.', '23 550', '23539', 23538.8472868, 23550, NULL, NULL, NULL, 0, 30, '{"calc":"mq","base":"exp","xs":[2,3,4,5],"ys":[0.69,0.81,1.08,1.46],"x":7,"escala":10000}', 'g(t) = 0,399·e^(0,254t); g(7) = 23538,8473.', 'Com os coeficientes completos dá 23 539 pessoas; a lista arredonda a e b antes e chega a 23 550.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-19', 'A', '26280', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede a exponencial.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-19', 'B', '22597', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-19', 'C', '19130', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede a exponencial.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-19', 'D', '23539', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-20', 'lista-07', '20ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Com os dados da população (ano: 4 | 5 | 6 | 7; população × 10⁴: 1,0 | 1,5 | 1,8 | 2,0), ajuste uma função do tipo g(t) = a·eᵇᵗ e calcule o ano em que a população será de 42 070 pessoas.', '10', '10', 9.9883129754, 10, NULL, NULL, NULL, 0, 0.1, '{"calc":"mq","base":"exp","xs":[4,5,6,7],"ys":[1,1.5,1.8,2],"y":42070,"escala":10000}', 'g(t) = 0,439·e^(0,226t); g(x*) = 42070 ⇒ x* = 9,9883.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-20', 'A', '10', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-20', 'B', '4', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-20', 'C', '7', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-20', 'D', '1', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-21', 'lista-07', '21ª', 'Ajuste de Curvas', 'minimos-quadrados', 1, 'vetor', 0, NULL, 'Ajuste a tabela x: −1 | 0 | 1 | 2; y: 1 | −1 | 2 | 3 por uma reta utilizando o método dos mínimos quadrados.', 'y = 0,9x + 0,8', 'g(x) = 0,9x + 0,8', NULL, NULL, '[0.8,0.9]', '[0.8,0.9]', NULL, 1, NULL, '{"calc":"mq","base":"reta","xs":[-1,0,1,2],"ys":[1,-1,2,3]}', 'g(x) = 0,8000 + 0,9000·x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-21', 'A', 'g(x) = 0,9x + 0,9', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-21', 'B', 'g(x) = −0,9x + 0,8', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-21', 'C', 'g(x) = 0,8x + 0,9', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-21', 'D', 'g(x) = 0,9x + 0,8', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-22', 'lista-07', '22ª', 'Ajuste de Curvas', 'minimos-quadrados', 1, 'vetor', 0, NULL, 'Ache a fórmula do tipo y = ax + b para a tabela x: 0,30 | 0,40 | 0,50 | 0,80; y: 0,30 | 0,30 | 0,40 | 0,60 pelo método dos mínimos quadrados. Use 3 decimais.', 'y = 0,643x + 0,079', 'g(x) = 0,643x + 0,079', NULL, NULL, '[0.0785714285714,0.642857142857]', '[0.079,0.643]', NULL, 3, NULL, '{"calc":"mq","base":"reta","xs":[0.3,0.4,0.5,0.8],"ys":[0.3,0.3,0.4,0.6]}', 'g(x) = 0,0786 + 0,6429·x.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-22', 'A', 'g(x) = 0,643x + 0,079', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-22', 'B', 'g(x) = 0,079x + 0,643', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-22', 'C', 'g(x) = 0,643x + 0,088', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-22', 'D', 'g(x) = −0,643x + 0,079', 0, 'Sinal do segundo coeficiente trocado.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-23', 'lista-07', '23ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Ache a fórmula do tipo y = a·10ᵇˣ pelo método dos mínimos quadrados para a tabela x: 1 | 2 | 3 | 4 | 5 | 6; y: 1,3 | 2,8 | 6,2 | 13,8 | 33,6 | 64,2. Use 3 decimais.', 'y = 0,584·10^(0,344x)', 'y = 0,583·10^(0,344x)', NULL, NULL, '[0.583322586444,0.344371128967]', '[0.584,0.344]', NULL, 3, 0.001, '{"calc":"mq","base":"pot10","xs":[1,2,3,4,5,6],"ys":[1.3,2.8,6.2,13.8,33.6,64.2]}', 'y = 0,583·10^(0,344x).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-23', 'A', 'y = 0,583·10^(−0,344x)', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-23', 'B', 'y = 0,583·10^(0,344x)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-23', 'C', 'y = 0,344·10^(0,583x)', 0, 'Coeficientes trocados de lugar.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-23', 'D', 'y = −0,539·10^(0,344x)', 0, 'Esse é o coeficiente linear da reta ajustada (ln a ou log a): falta voltar para a, elevando e (ou 10) a esse valor.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-24', 'lista-07', '24ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'numero', 0, NULL, 'Ache a fórmula do tipo y = a·10ᵇˣ pelo método dos mínimos quadrados para a tabela x: 1 | 2 | 3 | 4 | 5 | 6; y: 1,3 | 2,8 | 6,2 | 13,8 | 33,6 | 64,2 e calcule o x correspondente a y = 50. Use 3 decimais.', '5,62', '5,61', 5.61330799522, 5.62, NULL, NULL, NULL, 2, 0.01, '{"calc":"mq","base":"pot10","xs":[1,2,3,4,5,6],"ys":[1.3,2.8,6.2,13.8,33.6,64.2],"y":50}', 'y = 0,583·10^(0,344x); g(x*) = 50 ⇒ x* = 5,6133.', 'A lista usa a = 0,584 e b = 0,344 já arredondados (x = 5,618 ≈ 5,62); com os coeficientes completos, x = 5,613.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-24', 'A', '6,01', 0, 'Esse é o resultado com outro ajuste (uma reta); a questão pede y = a·10ᵇˣ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-24', 'B', '5,61', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-24', 'C', '5,84', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-24', 'D', '5,57', 0, 'Esse é o resultado com outro ajuste (uma parábola); a questão pede y = a·10ᵇˣ.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l07-25', 'lista-07', '25ª', 'Ajuste de Curvas', 'minimos-quadrados', 2, 'vetor', 0, NULL, 'Foram feitas cinco medições da velocidade de um carro de Fórmula 1 e da pressão do ar na superfície do aerofólio dianteiro: Vᵢ: 7,87 | 11,50 | 16,40 | 22,60 | 32,80; pᵢ: 0,014 | 0,028 | 0,056 | 0,112 | 0,225. Utilize o método dos mínimos quadrados, considerando p(V) = a + bV².', 'p = 0,001203 + 0,000209V²', 'p(V) = 0,001204 + 0,000209V²', NULL, NULL, '[0.0012035526966,0.000209285466668]', '[0.001203,0.000209]', NULL, 6, NULL, '{"calc":"mq","base":"a+bv2","xs":[7.87,11.5,16.4,22.6,32.8],"ys":[0.014,0.028,0.056,0.112,0.225]}', 'g(x) = 0,0012 + 0,0002·V².', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-25', 'A', 'p(V) = 0,001348 + 0,000209V²', 0, 'A primeira componente não confere: refaça a conta.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-25', 'B', 'p(V) = 0,001204 − 0,000209V²', 0, 'Sinal do segundo coeficiente trocado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-25', 'C', 'p(V) = 0,001204 + 0,000209V²', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l07-25', 'D', 'p(V) = 0,000209 + 0,001204V²', 0, 'Coeficientes trocados de lugar.');

-- ======================================================================
-- Lista 8 — Integração numérica (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-01', 'lista-08', '1ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule a integral ∫₀¹ eˣ dx aplicando a regra de Simpson, com 5 pontos e 5 casas decimais.', '1,7183', '1,7183', 1.71831884192, 1.7183, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","f":"exp(x)","a":0,"b":1,"pontos":5}', 'regra de Simpson (1/3) com 5 pontos: I ≈ 1,71832.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-01', 'A', '1,7272', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-01', 'B', '1,7138', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-01', 'C', '1,7871', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-01', 'D', '1,7183', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-02', 'lista-08', '2ª', 'Integração Numérica', 'trapezios', 2, 'numero', 0, NULL, 'Calcule a integral Iₜ = ∫₀¹ eˣ dx pela regra dos trapézios, com 5 pontos e 5 casas decimais, e determine o erro relativo E_R = |Iₜ − I_c| / |I_c| em relação ao valor correto I_c.', '0,52%', '0,52%', 0.520291604695, 0.52, NULL, NULL, NULL, 2, NULL, '{"calc":"integral-erro","regra":"trapezios","f":"exp(x)","a":0,"b":1,"pontos":5,"exato":1.718281828459045}', 'regra dos trapézios: I ≈ 1,72722; valor correto 1,71828; E_R = 0,52%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-02', 'A', '0,01%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-02', 'B', '0,52%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-02', 'C', '0,26%', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-02', 'D', '0,00%', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-03', 'lista-08', '3ª', 'Integração Numérica', 'retangulos', 1, 'numero', 0, NULL, 'Calcule a integral ∫₀¹ (−x² + 2x + 2) dx pela regra dos retângulos, com 4 subintervalos e 4 casas decimais.', '2,6719', '2,6719', 2.671875, 2.6719, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"retangulos","f":"-x^2+2x+2","a":0,"b":1,"n":4}', 'regra dos retângulos (ponto médio) com n = 4: I ≈ 2,67188.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-03', 'A', '2,6719', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-03', 'B', '2,6667', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos retângulos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-03', 'C', '2,5650', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-03', 'D', '2,6563', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra dos retângulos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-04', 'lista-08', '4ª', 'Integração Numérica', 'trapezios', 2, 'numero', 0, NULL, 'Usando a regra dos trapézios com 4 subintervalos e 4 casas decimais, obtenha o erro relativo E_R = |Iₜ − I_c| / |I_c| ao calcular Iₜ = ∫₀¹ (−x² + 2x + 2) dx, em relação ao seu valor correto.', '0,39%', '0,39%', 0.390625, 0.39, NULL, NULL, NULL, 2, NULL, '{"calc":"integral-erro","regra":"trapezios","f":"-x^2+2x+2","a":0,"b":1,"n":4,"exato":2.6666666666666665}', 'regra dos trapézios: I ≈ 2,65625; valor correto 2,66667; E_R = 0,39%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-04', 'A', '0,20%', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-04', 'B', '0,42%', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-04', 'C', '0,39%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-04', 'D', '0,00%', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-05', 'lista-08', '5ª', 'Integração Numérica', 'retangulos', 2, 'numero', 0, NULL, 'Usando a regra dos retângulos com 4 subintervalos e 4 casas decimais, obtenha o erro relativo E_R = |I_r − I_c| / |I_c| ao calcular ∫ eˣ·cos x dx de 0 a 1,2, em relação ao seu valor correto.', '0,66%', '0,65%', 0.653672995637, 0.66, NULL, NULL, NULL, 2, 0.01, '{"calc":"integral-erro","regra":"retangulos","f":"exp(x)cos(x)","a":0,"b":1.2,"n":4}', 'regra dos retângulos (ponto médio): I ≈ 1,65955; valor correto 1,64877; E_R = 0,65%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-05', 'A', '1,31%', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra dos retângulos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-05', 'B', '0,65%', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-05', 'C', '0,01%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-05', 'D', '0,02%', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos retângulos.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-06', 'lista-08', '6ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Calcule a integral ∫ eˣ·cos x dx de 0 a 1,2 pela regra dos trapézios, com 4 subintervalos e 4 casas decimais.', '1,6272', '1,6272', 1.62716333485, 1.6272, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","f":"exp(x)cos(x)","a":0,"b":1.2,"n":4}', 'regra dos trapézios com n = 4: I ≈ 1,62716.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-06', 'A', '1,6272', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-06', 'B', '1,6922', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-06', 'C', '1,6596', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-06', 'D', '1,6485', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-07', 'lista-08', '7ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule a integral ∫ eˣ·cos x dx de 0 a 1,2 pela regra de Simpson, com 4 subintervalos e 4 casas decimais.', '1,6485', '1,6485', 1.64847219376, 1.6485, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","f":"exp(x)cos(x)","a":0,"b":1.2,"n":4}', 'regra de Simpson (1/3) com n = 4: I ≈ 1,64847.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-07', 'A', '1,6596', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-07', 'B', '1,5825', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-07', 'C', '1,6272', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-07', 'D', '1,6485', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-08', 'lista-08', '8ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫₀¹ e⁻ˣ² dx pela regra de Simpson, com 4 subintervalos e 4 casas decimais.', '0,7469', '0,7469', 0.746855379791, 0.7469, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","f":"exp(-x^2)","a":0,"b":1,"n":4}', 'regra de Simpson (1/3) com n = 4: I ≈ 0,74686.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-08', 'A', '0,7430', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-08', 'B', '0,7469', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-08', 'C', '0,7487', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-08', 'D', '0,7170', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-09', 'lista-08', '9ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Calcule ∫₀¹ (6 − 6x⁵) dx pela regra dos trapézios, com 4 trapézios e 4 casas decimais.', '4,8457', '4,8457', 4.845703125, 4.8457, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","f":"6-6x^5","a":0,"b":1,"n":4}', 'regra dos trapézios com n = 4: I ≈ 4,84570.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-09', 'A', '4,9922', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-09', 'B', '4,6519', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-09', 'C', '4,8457', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-09', 'D', '5,0764', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-10', 'lista-08', '10ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫ f(x) dx de 1,9 a 2,3, dada a tabela xᵢ: 1,9 | 2,0 | 2,1 | 2,2 | 2,3; fᵢ: 3,41773 | 3,76220 | 4,14431 | 4,56791 | 5,03722, usando a regra de Simpson. Utilize 5 casas decimais.', '1,6688', '1,6688', 1.66880033333, 1.6688, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","xs":[1.9,2,2.1,2.2,2.3],"ys":[3.41773,3.7622,4.14431,4.56791,5.03722]}', 'regra de Simpson (1/3) com os 5 pontos da tabela: I ≈ 1,66880.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-10', 'A', '1,6020', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-10', 'B', '1,8190', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-10', 'C', '1,6688', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-10', 'D', '1,6702', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-11', 'lista-08', '11ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Calcule ∫ f(x) dx de 1,9 a 2,3, dada a tabela xᵢ: 1,9 | 2,0 | 2,1 | 2,2 | 2,3; fᵢ: 3,41773 | 3,76220 | 4,14431 | 4,56791 | 5,03722, usando a regra dos trapézios. Utilize 5 casas decimais.', '1,6702', '1,6702', 1.6701895, 1.6702, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","xs":[1.9,2,2.1,2.2,2.3],"ys":[3.41773,3.7622,4.14431,4.56791,5.03722]}', 'regra dos trapézios com os 5 pontos da tabela: I ≈ 1,67019.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-11', 'A', '1,5199', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-11', 'B', '1,6702', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-11', 'C', '1,6688', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-11', 'D', '1,7370', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-12', 'lista-08', '12ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫₁² x·ln(x) dx pela regra de Simpson, com 5 pontos e 5 casas decimais.', '0,6363', '0,6363', 0.636309829797, 0.6363, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","f":"x*ln(x)","a":1,"b":2,"pontos":5}', 'regra de Simpson (1/3) com 5 pontos: I ≈ 0,63631.', 'Na lista está "x·log(x)"; o gabarito corresponde ao logaritmo natural.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-12', 'A', '0,6618', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-12', 'B', '0,6399', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-12', 'C', '0,6345', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-12', 'D', '0,6363', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-13', 'lista-08', '13ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Calcule ∫₁² x·ln(x) dx pela regra dos trapézios, com 5 pontos e 5 casas decimais.', '0,6399', '0,6399', 0.639900477688, 0.6399, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","f":"x*ln(x)","a":1,"b":2,"pontos":5}', 'regra dos trapézios com 5 pontos: I ≈ 0,63990.', 'Na lista está "x·log(x)"; o gabarito corresponde ao logaritmo natural.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-13', 'A', '0,6399', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-13', 'B', '0,6345', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-13', 'C', '0,6363', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-13', 'D', '0,6143', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-14', 'lista-08', '14ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫₆¹⁰ log₁₀(x) dx aplicando a fórmula de Simpson, com 2 subintervalos e 5 casas decimais.', '3,59367', '3,59367', 3.59367413223, 3.59367, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson13","f":"log(x)","a":6,"b":10,"n":2}', 'regra de Simpson (1/3) com n = 2: I ≈ 3,59367.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-14', 'A', '3,44993', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-14', 'B', '3,59367', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-14', 'C', '3,59868', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-14', 'D', '3,58433', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-15', 'lista-08', '15ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫ f(x) dx de 6,0 a 8,0, dada a tabela xᵢ: 6,0 | 6,5 | 7,0 | 7,5 | 8,0; fᵢ: 0,77815 | 0,81291 | 0,84510 | 0,87506 | 0,90309, usando a regra de Simpson. Utilize 5 casas decimais.', '1,68722', '1,68722', 1.68722, 1.68722, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson13","xs":[6,6.5,7,7.5,8],"ys":[0.77815,0.81291,0.8451,0.87506,0.90309]}', 'regra de Simpson (1/3) com os 5 pontos da tabela: I ≈ 1,68722.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-15', 'A', '1,68685', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-15', 'B', '1,83907', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-15', 'C', '1,68722', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-15', 'D', '1,61973', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-16', 'lista-08', '16ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Calcule ∫ f(x) dx de 6,0 a 8,0, dada a tabela xᵢ: 6,0 | 6,5 | 7,0 | 7,5 | 8,0; fᵢ: 0,77815 | 0,81291 | 0,84510 | 0,87506 | 0,90309, usando a regra dos trapézios. Utilize 5 casas decimais.', '1,68685', '1,68685', 1.686845, 1.68685, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"trapezios","xs":[6,6.5,7,7.5,8],"ys":[0.77815,0.81291,0.8451,0.87506,0.90309]}', 'regra dos trapézios com os 5 pontos da tabela: I ≈ 1,68684.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-16', 'A', '1,75432', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-16', 'B', '1,68722', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-16', 'C', '1,83866', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-16', 'D', '1,68685', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-17', 'lista-08', '17ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule a integral ∫ dx/x de 3,0 a 3,4 pela regra de Simpson, com 5 pontos e 5 casas decimais.', '0,12516', '0,12516', 0.125163159105, 0.12516, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson13","f":"1/x","a":3,"b":3.4,"pontos":5}', 'regra de Simpson (1/3) com 5 pontos: I ≈ 0,12516.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-17', 'A', '0,12515', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-17', 'B', '0,12516', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-17', 'C', '0,12518', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-17', 'D', '0,12016', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-18', 'lista-08', '18ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Encontre o valor de ∫ cos x dx de π/4 a π/2 aplicando a regra dos trapézios com 4 subintervalos. Considere 5 casas decimais.', '0,29195', '0,29195', 0.291951617459, 0.29195, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"trapezios","f":"cos(x)","a":0.7853981633974483,"b":1.5707963267948966,"n":4}', 'regra dos trapézios com n = 4: I ≈ 0,29195.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-18', 'A', '0,29195', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-18', 'B', '0,29336', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-18', 'C', '0,29290', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-18', 'D', '0,28027', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-19', 'lista-08', '19ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Encontre o valor de ∫ √(sen x) dx de 0 a π aplicando a regra de Simpson com 5 pontos. Considere 5 casas decimais.', '2,28477', '2,28477', 2.28476811222, 2.28477, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson13","f":"sqrt(sin(x))","a":0,"b":3.141592653589793,"pontos":5}', 'regra de Simpson (1/3) com 5 pontos: I ≈ 2,28477.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-19', 'A', '2,28477', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-19', 'B', '2,37616', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-19', 'C', '2,48155', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-19', 'D', '2,10628', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-20', 'lista-08', '20ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Calcule ∫₀⁴ dx/√(25 − x²) aplicando a regra de Simpson com 4 subintervalos.', '0,9287', '0,9288', 0.928755231578, 0.9287, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","f":"1/sqrt(25-x^2)","a":0,"b":4,"n":4}', 'regra de Simpson (1/3) com n = 4: I ≈ 0,92876.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-20', 'A', '0,8916', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-20', 'B', '0,9288', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-20', 'C', '0,9390', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-20', 'D', '0,9217', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-21', 'lista-08', '21ª', 'Integração Numérica', 'trapezios', 2, 'numero', 0, NULL, 'Calcule ∫₀⁴ dx/√(25 − x²) pela regra dos trapézios com 5 pontos e o erro relativo cometido em relação ao valor correto I_c = 0,9273: E_R = |I − I_c| / |I_c| × 100.', '1,26%', '1,26%', 1.26266603414, 1.26, NULL, NULL, NULL, 2, NULL, '{"calc":"integral-erro","regra":"trapezios","f":"1/sqrt(25-x^2)","a":0,"b":4,"pontos":5,"exato":0.9273}', 'regra dos trapézios: I ≈ 0,93901; valor correto 0,92730; E_R = 1,26%.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-21', 'A', '0,61%', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-21', 'B', '0,16%', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-21', 'C', '0,01%', 0, 'Faltou multiplicar por 100.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-21', 'D', '1,26%', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-22', 'lista-08', '22ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Dada a tabela Vᵢ: 2 | 4 | 6 | 8 | 10; pᵢ: 10,5 | 42,7 | 25,3 | 16,7 | 13,0, com p = p(V), para vapor de água superaquecido, ache o trabalho realizado W = ∫ p(V) dV (de V₀ a V₄). Utilize a regra de Simpson.', '207,8', '207,8', 207.8, 207.8, NULL, NULL, NULL, 1, NULL, '{"calc":"integral","regra":"simpson13","xs":[2,4,6,8,10],"ys":[10.5,42.7,25.3,16.7,13]}', 'regra de Simpson (1/3) com os 5 pontos da tabela: I ≈ 207,80000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-22', 'A', '207,8', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-22', 'B', '199,5', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-22', 'C', '192,9', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-22', 'D', '189,1', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-23', 'lista-08', '23ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Dada a tabela Vᵢ: 2 | 4 | 6 | 8 | 10; pᵢ: 10,5 | 42,7 | 25,3 | 16,7 | 13,0, com p = p(V), para vapor de água superaquecido, ache o trabalho realizado W = ∫ p(V) dV (de V₀ a V₄). Utilize a regra dos trapézios.', '192,9', '192,9', 192.9, 192.9, NULL, NULL, NULL, 1, NULL, '{"calc":"integral","regra":"trapezios","xs":[2,4,6,8,10],"ys":[10.5,42.7,25.3,16.7,13]}', 'regra dos trapézios com os 5 pontos da tabela: I ≈ 192,90000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-23', 'A', '185,2', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-23', 'B', '192,9', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-23', 'C', '207,8', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-23', 'D', '210,3', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-24', 'lista-08', '24ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'A tabela fornece o tempo de percurso e a velocidade instantânea de um móvel (t (s): 0 | 5 | 10 | 15 | 20; v (m/s): 0,000 | 6,583 | 10,417 | 14,139 | 17,500). Ache o espaço percorrido pelo móvel, utilizando a regra de Simpson.', '202,04 m', '202,04 m', 202.036666667, 202.04, NULL, NULL, NULL, 2, NULL, '{"calc":"integral","regra":"simpson13","xs":[0,5,10,15,20],"ys":[0,6.583,10.417,14.139,17.5]}', 'regra de Simpson (1/3) com os 5 pontos da tabela: I ≈ 202,03667.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-24', 'A', '210,12 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-24', 'B', '183,85 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-24', 'C', '202,04 m', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-24', 'D', '199,45 m', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-25', 'lista-08', '25ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'A tabela fornece o tempo de percurso e a velocidade instantânea de um móvel (t (s): 0 | 5 | 10 | 15 | 20; v (m/s): 0,000 | 6,583 | 10,417 | 14,139 | 17,500). Ache o espaço percorrido pelo móvel, utilizando a regra dos trapézios.', '199,45 m', '199,45 m', 199.445, 199.45, NULL, NULL, NULL, 2, NULL, '{"calc":"integral","regra":"trapezios","xs":[0,5,10,15,20],"ys":[0,6.583,10.417,14.139,17.5]}', 'regra dos trapézios com os 5 pontos da tabela: I ≈ 199,44500.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-25', 'A', '207,42 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-25', 'B', '202,04 m', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-25', 'C', '181,49 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-25', 'D', '199,45 m', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-26', 'lista-08', '26ª', 'Integração Numérica', 'simpson13', 2, 'numero', 0, NULL, 'Sabendo que a abscissa do centro de gravidade de uma área pode ser calculada por x̄ = ∫x·y dx / ∫y dx (de x₀ a x₄), ache a abscissa do centro de gravidade da seção central de uma embarcação baseada na tabela (x (m): 0 | 2 | 4 | 6 | 8; y (m): 12,5 | 12,8 | 12,9 | 13,0 | 13,0). Utilize a regra de Simpson.', '4,0233 m', '4,0233 m', 4.02330097087, 4.0233, NULL, NULL, NULL, 4, NULL, '{"calc":"centro-gravidade","regra":"simpson13","xs":[0,2,4,6,8],"ys":[12.5,12.8,12.9,13,13]}', 'x̄ = ∫x·y dx / ∫y dx = 414,4000 / 103,0000 = 4,0233 (regra de Simpson (1/3)).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-26', 'A', '4,0233 m', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-26', 'B', '4,0000 m', 0, 'Esse é só o meio do intervalo; o centro de gravidade pondera cada x pela altura y: x̄ = ∫x·y dx / ∫y dx.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-26', 'C', '3,8624 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-26', 'D', '4,0272 m', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-27', 'lista-08', '27ª', 'Integração Numérica', 'trapezios', 2, 'numero', 0, NULL, 'Sabendo que a abscissa do centro de gravidade de uma área pode ser calculada por x̄ = ∫x·y dx / ∫y dx (de x₀ a x₄), ache a abscissa do centro de gravidade da seção central de uma embarcação baseada na tabela (x (m): 0 | 2 | 4 | 6 | 8; y (m): 12,5 | 12,8 | 12,9 | 13,0 | 13,0). Utilize a regra dos trapézios.', '4,0272 m', '4,0272 m', 4.02721088435, 4.0272, NULL, NULL, NULL, 4, NULL, '{"calc":"centro-gravidade","regra":"trapezios","xs":[0,2,4,6,8],"ys":[12.5,12.8,12.9,13,13]}', 'x̄ = ∫x·y dx / ∫y dx = 414,4000 / 102,9000 = 4,0272 (regra dos trapézios).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-27', 'A', '4,0000 m', 0, 'Esse é só o meio do intervalo; o centro de gravidade pondera cada x pela altura y: x̄ = ∫x·y dx / ∫y dx.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-27', 'B', '4,0272 m', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-27', 'C', '4,0233 m', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-27', 'D', '4,1883 m', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-28', 'lista-08', '28ª', 'Integração Numérica', 'simpson13', 1, 'numero', 0, NULL, 'Seja c (cal/g·°C) o calor específico de um corpo à temperatura θ (°C). Encontre o calor Q (cal) necessário para elevar a temperatura de um grama de água de 0 °C a 8 °C, com Q = m·∫c dθ, dada a tabela θᵢ: 0 | 2 | 4 | 6 | 8; cᵢ: 1,00664 | 1,00543 | 1,00453 | 1,00331 | 1,00233. Utilize a regra de Simpson.', '8,0353 cal', '8,0353 cal', 8.03532666667, 8.0353, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson13","xs":[0,2,4,6,8],"ys":[1.00664,1.00543,1.00453,1.00331,1.00233]}', 'regra de Simpson (1/3) com os 5 pontos da tabela: I ≈ 8,03533.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-28', 'A', '7,3121 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-28', 'B', '7,7139 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-28', 'C', '8,0355 cal', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-28', 'D', '8,0353 cal', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-29', 'lista-08', '29ª', 'Integração Numérica', 'trapezios', 1, 'numero', 0, NULL, 'Seja c (cal/g·°C) o calor específico de um corpo à temperatura θ (°C). Encontre o calor Q (cal) necessário para elevar a temperatura de um grama de água de 0 °C a 8 °C, com Q = m·∫c dθ, dada a tabela θᵢ: 0 | 2 | 4 | 6 | 8; cᵢ: 1,00664 | 1,00543 | 1,00453 | 1,00331 | 1,00233. Utilize a regra dos trapézios.', '8,0355 cal', '8,0355 cal', 8.03551, 8.0355, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","xs":[0,2,4,6,8],"ys":[1.00664,1.00543,1.00453,1.00331,1.00233]}', 'regra dos trapézios com os 5 pontos da tabela: I ≈ 8,03551.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-29', 'A', '7,3123 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-29', 'B', '8,0355 cal', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-29', 'C', '7,7141 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-29', 'D', '8,0353 cal', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-30', 'lista-08', '30ª', 'Integração Numérica', 'simpson13', 2, 'numero', 0, NULL, 'Ache o comprimento do arco da curva y = x³, da origem até o ponto (2, 8): C = ∫ √(1 + (dy/dx)²) dx = ∫₀² √(1 + 9x⁴) dx. Utilize a regra de Simpson com 5 pontos e 4 decimais.', '8,610', '8,610', 8.61013967117, 8.61, NULL, NULL, NULL, 3, NULL, '{"calc":"integral","regra":"simpson13","f":"sqrt(1+9x^4)","a":0,"b":2,"pontos":5}', 'regra de Simpson (1/3) com 5 pontos: I ≈ 8,61014.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-30', 'A', '8,878', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-30', 'B', '8,507', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-30', 'C', '8,955', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-30', 'D', '8,610', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-31', 'lista-08', '31ª', 'Integração Numérica', 'trapezios', 2, 'numero', 0, NULL, 'Ache o comprimento do arco da curva y = x³, da origem até o ponto (2, 8): C = ∫ √(1 + (dy/dx)²) dx = ∫₀² √(1 + 9x⁴) dx. Utilize a regra dos trapézios com 5 pontos e 4 decimais.', '8,8784 u.c.', '8,8784 u.c.', 8.87837349077, 8.8784, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"trapezios","f":"sqrt(1+9x^4)","a":0,"b":2,"pontos":5}', 'regra dos trapézios com 5 pontos: I ≈ 8,87837.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-31', 'A', '8,5069 u.c.', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-31', 'B', '8,5232 u.c.', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-31', 'C', '8,6101 u.c.', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra dos trapézios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-31', 'D', '8,8784 u.c.', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l08-32', 'lista-08', '32ª', 'Integração Numérica', 'simpson13', 3, 'numero', 0, NULL, 'A função de Debye é usada no cálculo do calor específico, a volume constante, de certas substâncias: C(θ) = (3/θ³)·∫ x³/(eˣ − 1) dx, de 0 a θ. Calcule C(0,4) usando a regra de Simpson com passo h = 0,1. Trabalhe com 4 decimais. Observação: lim (x→0) x³/(eˣ − 1) = 0.', '0,858', '0,858', 0.858005377385, 0.858, NULL, NULL, NULL, 3, NULL, '{"calc":"integral","regra":"simpson13","f":"x^3/(exp(x)-1)","a":0,"b":0.4,"n":4,"f0":0,"fator":46.875}', 'regra de Simpson (1/3) com n = 4: I ≈ 0,85801.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-32', 'A', '0,824', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-32', 'B', '0,858', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-32', 'C', '0,881', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l08-32', 'D', '0,847', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 1/3.');

-- ======================================================================
-- Lista 9 — Integração numérica (continuação) (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-01', 'lista-09', '1ª', 'Integração Numérica — continuação', 'simpson38', 1, 'numero', 0, NULL, 'Calcule a integral ∫₀¹ eˣ dx aplicando a regra de Simpson 3/8, com 7 pontos e 5 casas decimais.', '1,71830', '1,71830', 1.71829829247, 1.7183, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson38","f":"exp(x)","a":0,"b":1,"pontos":7}', 'regra de Simpson 3/8 com 7 pontos: I ≈ 1,71830.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-01', 'A', '1,72226', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-01', 'B', '1,71629', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-01', 'C', '1,71830', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-01', 'D', '1,71829', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra de Simpson 3/8.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-02', 'lista-09', '2ª', 'Integração Numérica — continuação', 'simpson38', 1, 'numero', 0, NULL, 'Calcule a integral ∫ eˣ·cos x dx de 0 a 1,2 pela regra de Simpson 3/8, com 3 subintervalos e 4 casas decimais.', '1,6166', '1,6465', 1.64653539297, 1.6166, NULL, NULL, NULL, 4, NULL, '{"calc":"integral","regra":"simpson38","f":"exp(x)cos(x)","a":0,"b":1.2,"n":3}', 'regra de Simpson 3/8 com n = 3: I ≈ 1,64654.', 'O gabarito da lista (1,6166) não sai da regra 3/8 com 3 subintervalos (h = 0,4): (3·0,4/8)·[f(0) + 3f(0,4) + 3f(0,8) + f(1,2)] = 1,6465. O valor exato da integral é 1,6488.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-02', 'A', '1,7124', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-02', 'B', '1,6678', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-02', 'C', '1,6465', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-02', 'D', '1,6105', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-03', 'lista-09', '3ª', 'Integração Numérica — continuação', 'simpson38', 1, 'numero', 0, NULL, 'Calcule ∫₁² x·ln(x) dx pela regra de Simpson 3/8, com 7 pontos e 5 casas decimais.', '0,63630', '0,63630', 0.63630127457, 0.6363, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson38","f":"x*ln(x)","a":1,"b":2,"pontos":7}', 'regra de Simpson 3/8 com 7 pontos: I ≈ 0,63630.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-03', 'A', '0,63790', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-03', 'B', '0,61085', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-03', 'C', '0,63630', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-03', 'D', '0,63549', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 3/8.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-04', 'lista-09', '4ª', 'Integração Numérica — continuação', 'simpson38', 1, 'numero', 0, NULL, 'Dada a tabela Vᵢ: 2 | 4 | 6 | 8 | 10 | 12 | 14; pᵢ: 10,5 | 42,7 | 25,3 | 16,7 | 13,0 | 15,8 | 32,4, com p = p(V), para vapor de água superaquecido, ache o trabalho realizado W = ∫ p(V) dV (de V₀ a V₆). Utilize a regra de Simpson 3/8.', '275,03', '275,03', 275.025, 275.03, NULL, NULL, NULL, 2, NULL, '{"calc":"integral","regra":"simpson38","xs":[2,4,6,8,10,12,14],"ys":[10.5,42.7,25.3,16.7,13,15.8,32.4]}', 'regra de Simpson 3/8 com os 7 pontos da tabela: I ≈ 275,02500.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-04', 'A', '269,90', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-04', 'B', '280,20', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-04', 'C', '275,03', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-04', 'D', '286,03', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-05', 'lista-09', '5ª', 'Integração Numérica — continuação', 'simpson38', 2, 'numero', 0, NULL, 'Sabendo que a abscissa do centro de gravidade de uma área pode ser calculada por x̄ = ∫x·y dx / ∫y dx (de x₀ a x₆), ache a abscissa do centro de gravidade da seção central de uma embarcação baseada na tabela x (m): 0 | 2 | 4 | 6 | 8 | 10 | 12; y (m): 12,5 | 12,8 | 12,9 | 13,0 | 13,0 | 13,3 | 14,2. Utilize a regra de Simpson 3/8.', '6,0799 m', '6,0805 m', 6.08049832295, 6.0799, NULL, NULL, NULL, 4, 0.001, '{"calc":"centro-gravidade","regra":"simpson38","xs":[0,2,4,6,8,10,12],"ys":[12.5,12.8,12.9,13,13,13.3,14.2]}', 'x̄ = ∫x·y dx / ∫y dx = 951,7500 / 156,5250 = 6,0805 (regra de Simpson 3/8).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-05', 'A', '6,0792 m', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra de Simpson 3/8. (É o valor que aparece no gabarito da lista: veja a observação da questão.)');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-05', 'B', '6,0000 m', 0, 'Esse é só o meio do intervalo; o centro de gravidade pondera cada x pela altura y: x̄ = ∫x·y dx / ∫y dx.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-05', 'C', '6,0932 m', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-05', 'D', '6,0805 m', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-06', 'lista-09', '6ª', 'Integração Numérica — continuação', 'simpson38', 1, 'numero', 0, NULL, 'Seja c (cal/g·°C) o calor específico de um corpo à temperatura θ (°C), dado na tabela θᵢ: 0 | 2 | 4 | 6; cᵢ: 1,00664 | 1,00543 | 1,00453 | 1,00331. Encontre o calor Q (cal) necessário para elevar a temperatura de um grama de água de 0 °C a 6 °C, com Q = m·∫c dθ. Utilize a regra de Simpson 3/8.', '6,02987 cal', '6,02987 cal', 6.0298725, 6.02987, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson38","xs":[0,2,4,6],"ys":[1.00664,1.00543,1.00453,1.00331]}', 'regra de Simpson 3/8 com os 4 pontos da tabela: I ≈ 6,02987.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-06', 'A', '6,02987 cal', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-06', 'B', '5,78868 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-06', 'C', '5,48718 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-06', 'D', '6,93435 cal', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-09', 'lista-09', '9ª', 'Integração Numérica — continuação', 'simpson38', 2, 'numero', 0, NULL, 'Ache o comprimento do arco da curva y = x³, da origem até o ponto (2, 8): C = ∫ √(1 + (dy/dx)²) dx = ∫₀² √(1 + 9x⁴) dx. Utilize a regra de Simpson 3/8 com 7 pontos e 5 decimais.', '8,62333', '8,62333', 8.62332559743, 8.62333, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson38","f":"sqrt(1+9x^4)","a":0,"b":2,"pontos":7}', 'regra de Simpson 3/8 com 7 pontos: I ≈ 8,62333.', 'A lista pula da 6ª para a 9ª questão.', 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-09', 'A', '8,74108', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-09', 'B', '8,62333', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-09', 'C', '8,57495', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-09', 'D', '8,62949', 0, 'Esse é o resultado pela regra de Simpson 1/3; a questão pede a regra de Simpson 3/8.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l09-10', 'lista-09', '10ª', 'Integração Numérica — continuação', 'simpson38', 2, 'numero', 0, NULL, 'Ache o comprimento do arco da curva y = x³, da origem até o ponto (2, 8): C = ∫ √(1 + (dy/dx)²) dx = ∫₀² √(1 + 9x⁴) dx. Utilize a regra de Simpson 3/8 com 9 subintervalos e 5 decimais.', '8,63001 u.c.', '8,63001 u.c.', 8.63000577071, 8.63001, NULL, NULL, NULL, 5, NULL, '{"calc":"integral","regra":"simpson38","f":"sqrt(1+9x^4)","a":0,"b":2,"n":9}', 'regra de Simpson 3/8 com n = 9: I ≈ 8,63001.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-10', 'A', '8,67954 u.c.', 0, 'Esse é o resultado pela regra dos trapézios; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-10', 'B', '8,63001 u.c.', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-10', 'C', '8,60572 u.c.', 0, 'Esse é o resultado pela regra dos retângulos; a questão pede a regra de Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l09-10', 'D', '8,97521 u.c.', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

-- ======================================================================
-- Lista 10 — Equações diferenciais (UERJ — Cálculo Numérico)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-1-euler', 'lista-10', '1ª (Euler)', 'Equações Diferenciais', 'euler', 1, 'numero', 0, NULL, 'Resolva o PVI y′ = y, y(0) = 1, utilizando o método de Euler com h = 0,05. Determine y(0,10).', '1,10250', '1,10250', 1.1025, 1.1025, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"y","x0":0,"y0":1,"h":0.05,"xf":0.1}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,05, 2 passos: y(0,1) ≈ 1,10250.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler', 'A', '1,05000', 0, 'Parou um passo antes: até 0,1 são 2 passos de h = 0,05.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler', 'B', '1,10250', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler', 'C', '1,10513', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler', 'D', '1,14660', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-1-euler-r', 'lista-10', '1ª (Euler) · 1º passo', 'Equações Diferenciais', 'euler', 1, 'numero', 1, 'l10-1-euler', 'Euler, 1º passo: y′ = y, y(0) = 1 e h = 0,05. Qual é y₁ ≈ y(0,05)?', NULL, '1,05000', 1.05, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"y","x0":0,"y0":1,"h":0.05,"xf":0.05}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,05, 1 passos: y(0,05) ≈ 1,05000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler-r', 'A', '1,05000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler-r', 'B', '1,09200', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler-r', 'C', '1,14450', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-euler-r', 'D', '1,05125', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-1-taylor', 'lista-10', '1ª (Taylor)', 'Equações Diferenciais', 'taylor', 2, 'numero', 0, NULL, 'Resolva o PVI y′ = y, y(0) = 1, utilizando o método de Taylor de segunda ordem com h = 0,05. Determine y(0,10).', '1,10513', '1,10513', 1.1051265625, 1.10513, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"y","x0":0,"y0":1,"h":0.05,"xf":0.1}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,05, 2 passos: y(0,1) ≈ 1,10513.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor', 'A', '1,10250', 0, 'Esse é o resultado pelo método de Euler.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor', 'B', '1,10513', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor', 'C', '1,05125', 0, 'Parou um passo antes: até 0,1 são 2 passos de h = 0,05.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor', 'D', '1,06092', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-1-taylor-r', 'lista-10', '1ª (Taylor) · 1º passo', 'Equações Diferenciais', 'taylor', 1, 'numero', 1, 'l10-1-taylor', 'Taylor de 2ª ordem, 1º passo: y′ = y, y(0) = 1 e h = 0,05. Qual é y₁ ≈ y(0,05)?', NULL, '1,05125', 1.05125, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"y","x0":0,"y0":1,"h":0.05,"xf":0.05}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,05, 1 passos: y(0,05) ≈ 1,05125.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor-r', 'A', '1,00920', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor-r', 'B', '0,95664', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor-r', 'C', '1,05000', 0, 'Esse é o resultado pelo método de Euler.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-1-taylor-r', 'D', '1,05125', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-2-euler', 'lista-10', '2ª (Euler)', 'Equações Diferenciais', 'euler', 1, 'numero', 0, NULL, 'Resolva o PVI x·y′ = x − y, y(2) = 2, utilizando o método de Euler com h = 0,025. Determine y(2,1).', '2,00181', '2,00181', 2.00180722892, 2.00181, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"(x-y)/x","x0":2,"y0":2,"h":0.025,"xf":2.1}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,025, 4 passos: y(2,1) ≈ 2,00181.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler', 'A', '2,00181', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler', 'B', '2,00091', 0, 'Parou um passo antes: até 2,1 são 4 passos de h = 0,025.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler', 'C', '2,00239', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler', 'D', '1,92173', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-2-euler-r', 'lista-10', '2ª (Euler) · 1º passo', 'Equações Diferenciais', 'euler', 1, 'numero', 1, 'l10-2-euler', 'Euler, 1º passo: y′ = (x − y)/x, y(2) = 2 e h = 0,025. Qual é y₁ ≈ y(2,025)?', NULL, '2,00000', 2, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"(x-y)/x","x0":2,"y0":2,"h":0.025,"xf":2.025}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,025, 1 passos: y(2,025) ≈ 2,00000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler-r', 'A', '2,08000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler-r', 'B', '1,82000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler-r', 'C', '2,00016', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-euler-r', 'D', '2,00000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-2-taylor', 'lista-10', '2ª (Taylor)', 'Equações Diferenciais', 'taylor', 2, 'numero', 0, NULL, 'Resolva o PVI x·y′ = x − y, y(2) = 2, utilizando o método de Taylor de segunda ordem com h = 0,025. Determine y(2,1).', '2,00239', '2,00239', 2.00238799752, 2.00239, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"(x-y)/x","x0":2,"y0":2,"h":0.025,"xf":2.1}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,025, 4 passos: y(2,1) ≈ 2,00239.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor', 'A', '2,00136', 0, 'Parou um passo antes: até 2,1 são 4 passos de h = 0,025.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor', 'B', '2,00239', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor', 'C', '2,00181', 0, 'Esse é o resultado pelo método de Euler.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor', 'D', '2,08248', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-2-taylor-r', 'lista-10', '2ª (Taylor) · 1º passo', 'Equações Diferenciais', 'taylor', 1, 'numero', 1, 'l10-2-taylor', 'Taylor de 2ª ordem, 1º passo: y′ = (x − y)/x, y(2) = 2 e h = 0,025. Qual é y₁ ≈ y(2,025)?', NULL, '2,00016', 2.00015625, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"(x-y)/x","x0":2,"y0":2,"h":0.025,"xf":2.025}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,025, 1 passos: y(2,025) ≈ 2,00016.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor-r', 'A', '1,82014', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor-r', 'B', '2,00016', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor-r', 'C', '1,92015', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-2-taylor-r', 'D', '2,00000', 0, 'Esse é o resultado pelo método de Euler.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-3-euler', 'lista-10', '3ª (Euler)', 'Equações Diferenciais', 'euler', 1, 'numero', 0, NULL, 'Resolva o PVI y′ = 0,04y, y(0) = 1000, utilizando o método de Euler com h = 0,2. Determine y(1).', '1040,64514', '1040,64514', 1040.64514051, 1040.64514, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"0.04y","x0":0,"y0":1000,"h":0.2,"xf":1}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,2, 5 passos: y(1) ≈ 1040,64514.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler', 'A', '999,01933', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler', 'B', '1040,81033', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler', 'C', '1040,64514', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler', 'D', '1032,38605', 0, 'Parou um passo antes: até 1 são 5 passos de h = 0,2.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-3-euler-r', 'lista-10', '3ª (Euler) · 1º passo', 'Equações Diferenciais', 'euler', 1, 'numero', 1, 'l10-3-euler', 'Euler, 1º passo: y′ = 0,04y, y(0) = 1000 e h = 0,2. Qual é y₁ ≈ y(0,2)?', NULL, '1008,00000', 1008, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"0.04y","x0":0,"y0":1000,"h":0.2,"xf":0.2}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,2, 1 passos: y(0,2) ≈ 1008,00000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler-r', 'A', '1008,00000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler-r', 'B', '1048,32000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler-r', 'C', '1098,72000', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-euler-r', 'D', '1008,03200', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-3-taylor', 'lista-10', '3ª (Taylor)', 'Equações Diferenciais', 'taylor', 2, 'numero', 0, NULL, 'Resolva o PVI y′ = 0,04y, y(0) = 1000, utilizando o método de Taylor de segunda ordem com h = 0,2. Determine y(1).', '1040,81103', '1040,81033', 1040.81033277, 1040.81103, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"0.04y","x0":0,"y0":1000,"h":0.2,"xf":1}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,2, 5 passos: y(1) ≈ 1040,81033.', 'O gabarito da lista (1040,81103) tem dígitos trocados: (1 + 0,2·0,04 + 0,02·0,0016)⁵·1000 = 1040,81034.', 1);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor', 'A', '1032,51715', 0, 'Parou um passo antes: até 1 são 5 passos de h = 0,2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor', 'B', '999,17792', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor', 'C', '1040,81033', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor', 'D', '1040,64514', 0, 'Esse é o resultado pelo método de Euler.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-3-taylor-r', 'lista-10', '3ª (Taylor) · 1º passo', 'Equações Diferenciais', 'taylor', 1, 'numero', 1, 'l10-3-taylor', 'Taylor de 2ª ordem, 1º passo: y′ = 0,04y, y(0) = 1000 e h = 0,2. Qual é y₁ ≈ y(0,2)?', NULL, '1008,03200', 1008.032, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"0.04y","x0":0,"y0":1000,"h":0.2,"xf":0.2}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,2, 1 passos: y(0,2) ≈ 1008,03200.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor-r', 'A', '1008,00000', 0, 'Esse é o resultado pelo método de Euler.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor-r', 'B', '1008,03200', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor-r', 'C', '917,30912', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-3-taylor-r', 'D', '1048,35328', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-4-euler', 'lista-10', '4ª (Euler)', 'Equações Diferenciais', 'euler', 2, 'numero', 0, NULL, 'Resolva o PVI y′ = 2y/(x + 1) + (x + 1)³, y(0) = 3, utilizando o método de Euler com h = 0,2. Determine y(1).', '15,20876', '15,20876', 15.2087555556, 15.20876, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"2y/(x+1)+(x+1)^3","x0":0,"y0":3,"h":0.2,"xf":1}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,2, 5 passos: y(1) ≈ 15,20876.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler', 'A', '14,60041', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler', 'B', '15,20876', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler', 'C', '11,48920', 0, 'Parou um passo antes: até 1 são 5 passos de h = 0,2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler', 'D', '17,81407', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-4-euler-r', 'lista-10', '4ª (Euler) · 1º passo', 'Equações Diferenciais', 'euler', 1, 'numero', 1, 'l10-4-euler', 'Euler, 1º passo: y′ = 2y/(x + 1) + (x + 1)³, y(0) = 3 e h = 0,2. Qual é y₁ ≈ y(0,2)?', NULL, '4,40000', 4.4, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"euler","f":"2y/(x+1)+(x+1)^3","x0":0,"y0":3,"h":0.2,"xf":0.2}', 'Euler: yₖ₊₁ = yₖ + h·f(xₖ, yₖ), h = 0,2, 1 passos: y(0,2) ≈ 4,40000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler-r', 'A', '4,22400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler-r', 'B', '4,62000', 0, 'Esse é o resultado pelo método de Taylor de 2ª ordem.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler-r', 'C', '4,00400', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-euler-r', 'D', '4,40000', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-4-taylor', 'lista-10', '4ª (Taylor)', 'Equações Diferenciais', 'taylor', 3, 'numero', 0, NULL, 'Resolva o PVI y′ = 2y/(x + 1) + (x + 1)³, y(0) = 3, utilizando o método de Taylor de segunda ordem com h = 0,2. Determine y(1).', '17,81407', '17,81407', 17.8140744141, 17.81407, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"2y/(x+1)+(x+1)^3","x0":0,"y0":3,"h":0.2,"xf":1}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,2, 5 passos: y(1) ≈ 17,81407.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor', 'A', '13,22218', 0, 'Parou um passo antes: até 1 são 5 passos de h = 0,2.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor', 'B', '17,10151', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor', 'C', '17,81407', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor', 'D', '15,20876', 0, 'Esse é o resultado pelo método de Euler.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('l10-4-taylor-r', 'lista-10', '4ª (Taylor) · 1º passo', 'Equações Diferenciais', 'taylor', 1, 'numero', 1, 'l10-4-taylor', 'Taylor de 2ª ordem, 1º passo: y′ = 2y/(x + 1) + (x + 1)³, y(0) = 3 e h = 0,2. Qual é y₁ ≈ y(0,2)?', NULL, '4,62000', 4.62000000001, NULL, NULL, NULL, NULL, 5, NULL, '{"calc":"taylor2","f":"2y/(x+1)+(x+1)^3","x0":0,"y0":3,"h":0.2,"xf":0.2}', 'Taylor de 2ª ordem: yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f), h = 0,2, 1 passos: y(0,2) ≈ 4,62000.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor-r', 'A', '4,62000', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor-r', 'B', '4,80480', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor-r', 'C', '4,40000', 0, 'Esse é o resultado pelo método de Euler.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('l10-4-taylor-r', 'D', '5,03580', 0, 'Não confere: refaça a conta passo a passo (veja a resolução).');

-- ======================================================================
-- Perguntas rápidas de conceito (Numera Academy)
-- ======================================================================

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-fl-trunc', 'conceitos', '', 'Perguntas rápidas de conceito', 'ponto-flutuante', 1, 'texto', 1, NULL, 'Num sistema F(10, 4, m, M), qual é fl(3,14159) com truncamento?', NULL, '0,3141 × 10¹', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Normalizando, 3,14159 = 0,314159 × 10¹. A mantissa guarda t = 4 dígitos e truncar é descartar o resto: 0,3141 × 10¹."}', 'Normalizando, 3,14159 = 0,314159 × 10¹. A mantissa guarda t = 4 dígitos e truncar é descartar o resto: 0,3141 × 10¹.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-trunc', 'A', '3,141 × 10⁰', 0, 'A mantissa normalizada é 0,d₁d₂d₃d₄ com d₁ ≠ 0.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-trunc', 'B', '0,3141 × 10¹', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-trunc', 'C', '0,31415 × 10¹', 0, 'São 5 dígitos: a mantissa tem t = 4.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-trunc', 'D', '0,3142 × 10¹', 0, 'Esse é o arredondamento: o 5º dígito (5) faria o 4º subir. Truncar só corta.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-fl-overflow', 'conceitos', '', 'Perguntas rápidas de conceito', 'ponto-flutuante', 1, 'texto', 1, NULL, 'Num sistema de ponto flutuante F(β, t, m, M), quando acontece overflow?', NULL, 'Quando o expoente do resultado passa de M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"O maior número representável é 0,(β−1)(β−1)… × βᴹ. Um resultado com expoente maior que M não cabe: é overflow. Expoente menor que m é underflow."}', 'O maior número representável é 0,(β−1)(β−1)… × βᴹ. Um resultado com expoente maior que M não cabe: é overflow. Expoente menor que m é underflow.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-overflow', 'A', 'Quando o resultado é zero', 0, 'Zero é representável.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-overflow', 'B', 'Quando o expoente do resultado passa de M', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-overflow', 'C', 'Quando a mantissa tem mais de t dígitos', 0, 'Aí basta arredondar ou truncar: não é overflow.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-fl-overflow', 'D', 'Quando o expoente fica menor que m', 0, 'Isso é underflow.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-interp-grau', 'conceitos', '', 'Perguntas rápidas de conceito', 'interpolacao', 1, 'texto', 1, NULL, 'Por n + 1 pontos com abscissas distintas passa um único polinômio interpolador de que grau?', NULL, 'Grau no máximo n', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"O sistema de Vandermonde com n + 1 pontos distintos tem solução única: o polinômio interpolador tem grau ≤ n."}', 'O sistema de Vandermonde com n + 1 pontos distintos tem solução única: o polinômio interpolador tem grau ≤ n.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-grau', 'A', 'Sempre grau 1', 0, 'Grau 1 é a interpolação linear, entre dois pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-grau', 'B', 'Grau 2n', 0, 'Grau 2n tem coeficientes demais para os n + 1 pontos.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-grau', 'C', 'Grau no máximo n', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-grau', 'D', 'Grau n + 1', 0, 'Com grau n + 1 sobram coeficientes: haveria infinitos polinômios.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-interp-inversa', 'conceitos', '', 'Perguntas rápidas de conceito', 'interpolacao', 1, 'texto', 1, NULL, 'Para achar x* tal que f(x*) = ȳ com uma tabela, o que a interpolação inversa faz?', NULL, 'Troca os papéis de x e y e interpola x como função de y', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Em vez de montar p(x) e resolver p(x*) = ȳ, montamos x(y) passando pelos pontos (yᵢ, xᵢ) e calculamos x(ȳ). Exige f monótona no trecho."}', 'Em vez de montar p(x) e resolver p(x*) = ȳ, montamos x(y) passando pelos pontos (yᵢ, xᵢ) e calculamos x(ȳ). Exige f monótona no trecho.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-inversa', 'A', 'Calcula f(ȳ) diretamente na tabela', 0, 'ȳ é um valor de f, não uma abscissa.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-inversa', 'B', 'Usa o método da Bisseção na tabela', 0, 'A Bisseção precisa de f em qualquer ponto, não só na tabela.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-inversa', 'C', 'Deriva a tabela', 0, 'Não há derivada na interpolação inversa.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-interp-inversa', 'D', 'Troca os papéis de x e y e interpola x como função de y', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-mq-ideia', 'conceitos', '', 'Perguntas rápidas de conceito', 'minimos-quadrados', 1, 'texto', 1, NULL, 'O que o método dos mínimos quadrados minimiza?', NULL, 'A soma dos quadrados dos desvios, Σ(yᵢ − g(xᵢ))²', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"O ajuste não passa por todos os pontos: escolhe os coeficientes que deixam a soma Σ(yᵢ − g(xᵢ))² a menor possível. Daí saem as equações normais."}', 'O ajuste não passa por todos os pontos: escolhe os coeficientes que deixam a soma Σ(yᵢ − g(xᵢ))² a menor possível. Daí saem as equações normais.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-ideia', 'A', 'O número de pontos fora da curva', 0, 'O critério é contínuo: usa o tamanho dos desvios.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-ideia', 'B', 'A soma dos desvios, Σ(yᵢ − g(xᵢ))', 0, 'Desvios positivos e negativos se cancelariam.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-ideia', 'C', 'A soma dos quadrados dos desvios, Σ(yᵢ − g(xᵢ))²', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-ideia', 'D', 'O maior desvio', 0, 'Minimizar o maior desvio é outro critério (minimax).');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-mq-exp', 'conceitos', '', 'Perguntas rápidas de conceito', 'minimos-quadrados', 1, 'texto', 1, NULL, 'Como ajustar g(t) = a·eᵇᵗ com o método dos mínimos quadrados para retas?', NULL, 'Aplicar ln: ln g = ln a + b·t, e ajustar uma reta aos pontos (tᵢ, ln yᵢ)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"A exponencial vira reta depois do logaritmo: Y = ln y = ln a + b·t. Ajusta-se a reta e depois a = e elevado ao coeficiente linear."}', 'A exponencial vira reta depois do logaritmo: Y = ln y = ln a + b·t. Ajusta-se a reta e depois a = e elevado ao coeficiente linear.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-exp', 'A', 'Ajustar uma reta direto aos pontos (tᵢ, yᵢ)', 0, 'A reta não descreve a curva exponencial.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-exp', 'B', 'Elevar os yᵢ ao quadrado', 0, 'O quadrado não lineariza a exponencial.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-exp', 'C', 'Usar interpolação de Lagrange', 0, 'Lagrange passa por todos os pontos; aqui queremos o melhor ajuste.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-mq-exp', 'D', 'Aplicar ln: ln g = ln a + b·t, e ajustar uma reta aos pontos (tᵢ, ln yᵢ)', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-trap-formula', 'conceitos', '', 'Perguntas rápidas de conceito', 'trapezios', 1, 'texto', 1, NULL, 'Qual é a regra dos trapézios repetida com n subintervalos de largura h?', NULL, 'I ≈ (h/2)·[f₀ + 2(f₁ + … + fₙ₋₁) + fₙ]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Cada trapézio vale (h/2)(fᵢ + fᵢ₊₁); somando, os pontos internos aparecem duas vezes."}', 'Cada trapézio vale (h/2)(fᵢ + fᵢ₊₁); somando, os pontos internos aparecem duas vezes.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-trap-formula', 'A', 'I ≈ (3h/8)·[f₀ + 3f₁ + 3f₂ + 2f₃ + … + fₙ]', 0, 'Essa é a Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-trap-formula', 'B', 'I ≈ h·(f₀ + f₁ + … + fₙ)', 0, 'Os extremos têm peso 1/2, não 1.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-trap-formula', 'C', 'I ≈ (h/2)·[f₀ + 2(f₁ + … + fₙ₋₁) + fₙ]', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-trap-formula', 'D', 'I ≈ (h/3)·[f₀ + 4f₁ + 2f₂ + … + fₙ]', 0, 'Essa é a regra de Simpson 1/3.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-simp-n', 'conceitos', '', 'Perguntas rápidas de conceito', 'simpson13', 1, 'texto', 1, NULL, 'Que condição o número de subintervalos n precisa cumprir na regra de Simpson 1/3?', NULL, 'n precisa ser par', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Simpson 1/3 usa parábolas por três pontos, ou seja, pares de subintervalos: n par (número ímpar de pontos)."}', 'Simpson 1/3 usa parábolas por três pontos, ou seja, pares de subintervalos: n par (número ímpar de pontos).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp-n', 'A', 'Qualquer n serve', 0, 'Os pesos 1-4-2-4-…-1 só fecham com n par.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp-n', 'B', 'n precisa ser múltiplo de 3', 0, 'Essa é a condição da Simpson 3/8.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp-n', 'C', 'n precisa ser ímpar', 0, 'Com n ímpar sobra um subintervalo sem parábola.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp-n', 'D', 'n precisa ser par', 1, NULL);

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-simp38-n', 'conceitos', '', 'Perguntas rápidas de conceito', 'simpson38', 1, 'texto', 1, NULL, 'Que condição o número de subintervalos n precisa cumprir na regra de Simpson 3/8?', NULL, 'n precisa ser múltiplo de 3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"A Simpson 3/8 usa cúbicas por quatro pontos, ou seja, blocos de 3 subintervalos."}', 'A Simpson 3/8 usa cúbicas por quatro pontos, ou seja, blocos de 3 subintervalos.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp38-n', 'A', 'n precisa ser par', 0, 'Essa é a condição da Simpson 1/3.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp38-n', 'B', 'n precisa ser primo', 0, 'Não há condição de primalidade.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp38-n', 'C', 'n precisa ser múltiplo de 3', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-simp38-n', 'D', 'n precisa ser 8', 0, 'O 8 do nome vem do fator 3h/8.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-euler', 'conceitos', '', 'Perguntas rápidas de conceito', 'euler', 1, 'texto', 1, NULL, 'Qual é a fórmula do método de Euler para y′ = f(x, y)?', NULL, 'yₖ₊₁ = yₖ + h·f(xₖ, yₖ)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"Euler segue a reta tangente por um passo h: é a série de Taylor cortada no termo de 1ª ordem."}', 'Euler segue a reta tangente por um passo h: é a série de Taylor cortada no termo de 1ª ordem.', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-euler', 'A', 'yₖ₊₁ = yₖ + h·f(xₖ, yₖ)', 1, NULL);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-euler', 'B', 'yₖ₊₁ = h·f(xₖ, yₖ)', 0, 'Faltou somar o yₖ.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-euler', 'C', 'yₖ₊₁ = yₖ + (h²/2)·f(xₖ, yₖ)', 0, 'O termo de 1ª ordem é h·f.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-euler', 'D', 'yₖ₊₁ = yₖ − f(xₖ, yₖ)/f′(xₖ, yₖ)', 0, 'Isso lembra o Newton-Raphson, que acha raízes.');

INSERT INTO questoes (id, lista_id, numero, secao, tema_id, dificuldade, tipo, rapida, origem_id, enunciado, gabarito_lista, resposta, valor, valor_lista, vetor, vetor_lista, matriz, casas, tolerancia, parametros, resolucao, observacao, diverge) VALUES ('cc-taylor2', 'conceitos', '', 'Perguntas rápidas de conceito', 'taylor', 1, 'texto', 1, NULL, 'O que o método de Taylor de 2ª ordem acrescenta ao método de Euler?', NULL, 'O termo (h²/2)·y″, com y″ = fₓ + f_y·f', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"calc":"texto","resumo":"yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f). O termo extra corrige a curvatura e reduz o erro local de O(h²) para O(h³)."}', 'yₖ₊₁ = yₖ + h·f + (h²/2)·(fₓ + f_y·f). O termo extra corrige a curvatura e reduz o erro local de O(h²) para O(h³).', NULL, 0);
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-taylor2', 'A', 'Um passo h dividido por 2', 0, 'Dividir o passo é outra ideia (Euler com h/2).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-taylor2', 'B', 'Nada: é o mesmo método', 0, 'O termo de 2ª ordem muda o resultado.');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-taylor2', 'C', 'A média de duas inclinações', 0, 'Isso é o Euler melhorado (Heun).');
INSERT INTO alternativas (questao_id, letra, texto, correta, explicacao) VALUES ('cc-taylor2', 'D', 'O termo (h²/2)·y″, com y″ = fₓ + f_y·f', 1, NULL);

COMMIT;
