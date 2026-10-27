// Bíblia de humor (seção 14): falas, placas, narrador. Até 70 caracteres por balão.

export const FALAS = {
  divisao_zero: [
    'Você tentou dividir por zero. O universo pediu pra você sair.',
    'Aí o denominador pediu demissão.',
    'Dividir por zero: o botão de autodestruição da matemática.',
  ],
  overflow: [
    'Esse número não coube na calça (16 bits).',
    'Estourou o limite. O infinito chegou antes de você.',
    'Tinha ovo demais no ninho.',
  ],
  divergencia: [
    'Chutou tão longe que foi parar em Marte.',
    'A tangente foi passear e não voltou.',
    'Sua mira tem vida própria.',
  ],
  convergencia_lenta: [
    'Tá chegando... tipo ônibus em dia de chuva.',
    'Devagar e sempre, mas sempre devagar.',
    'A raiz já deu tempo de tomar um café.',
  ],
  pivo_zero: [
    'O pivô pediu demissão. Contrate outro.',
    'Pivô zero: a linha de cima ficou de greve.',
    'Troca de linha, patrão!',
  ],
  polo: [
    'Isso não é raiz, é um fantasma de sinal trocado.',
    'Bolzano está chorando. Continuidade, né?',
    'Quase! Mas aí é buraco, não raiz.',
  ],
  cancelamento: [
    'Subtraiu quase iguais: os dígitos bons foram embora.',
    'Sobrou só o ruído. Os algarismos fugiram de mãos dadas.',
    'Cancelamento catastrófico: tipo apagar a lousa errada.',
  ],
  fase_vencida: [
    'Raiz capturada! Ela tentou se esconder, mas você é bom demais.',
    'Erro: zero. Orgulho: infinito.',
    'Mais uma raiz pra coleção!',
  ],
  fase_perdida: [
    'Toda raiz foge na primeira vez.',
    'Respira, a próxima iteração é sua.',
    'Até o Newton errou o chute no começo.',
  ],
  erro_generico: [
    'Opa, esse passo saiu torto. Bora de novo!',
    'Quase! O erro relativo deu uma piscadinha.',
    'Hmm, a conta escorregou numa casca de banana.',
  ],
  grande_erro: [
    'Hehehe, seu erro relativo é meu combustível.',
    'Truncar? Eu adoro. Obrigado pelos dígitos!',
    'Nenhuma tolerância vai te salvar.',
  ],
  raizinha_idle: [
    'Estou com fome de sementes.',
    'Será que a gente chega antes da Usina?',
    'Você acha que raiz tem raiz?',
  ],
  raizinha_nevoa: [
    'Eu não entro aí nem a pau, patrão.',
    'Essa névoa tem cheiro de erro de arredondamento.',
    'Lá dentro tudo dá NaN. Bora vencer o chefão antes.',
  ],
  raizinha_vitoria: ['Uhuu! Você é demais!', 'Coraçãozinho pra você!', 'Mais uma! A Usina que se cuide.'],
  raizinha_derrota: ['Kkkk desculpa, não resisti. Bora de novo!', 'Calma, raiz é assim mesmo: arisca.', 'Respira. O próximo chute é melhor.'],
  raizinha_bicho: ['Olha um bicho guia ali! Ele dá dicas.', 'Aquele bicho parece saber das coisas.', 'Vai lá dar um oi, patrão!'],
  raizinha_raiz: ['Uma Raiz Fugitiva! Corre que ela é rápida!', 'Pega! Pega! Pega!', 'Ela tá em zigue-zague, vai pelo meio!'],
  raizinha_moita: ['Essa moita tá tremendo... suspeito.', 'Tem alguém escondido ali!', 'Mexe naquela moita, aposto que tem raiz.'],
  raizinha_sem_estrelas: ['Faltam {n} estrelas para enfrentar o chefão.', 'O portão só abre com mais {n} estrelas.', 'Junta mais {n} estrelas nas cidades e a gente volta.'],
  raizinha_usina: ['A Usina só abre depois dos 5 chefões.', 'Cinco chefões, cinco chaves. Falta pouco!', 'Daqui sai a fumaça verde... medo.'],
  raizinha_semente: ['Uma semente! Guarda que vale dica.', 'Sementinha! Dica tem preço, né?', 'Ui, semente! Eu como? Não? Tá bom.'],
  robo: ['DIVIDINDO... POR ZERO... ERRO', 'OVERFLOW... OVERFLOW... OVERFL', 'NaN NaN NaN... BATMAN?', 'TOLERÂNCIA... NÃO... ENCONTRADA'],
  sem_dinheiro: ['Sem sementes, sem dica. Nem bicho trabalha de graça!', 'Seu saldo de sementes deu underflow.', 'Chacoalha umas árvores e volta aqui.'],
  npc: [
    'Bom dia! Ou boa iteração, sei lá.',
    'Dizem que a Usina está cuspindo NaN.',
    'Você é o(a) engenheiro(a)? Salva a gente!',
    'Minha ponte balança desde que a raiz fugiu.',
    'Meu pão saiu com 0,999... de tamanho.',
    'Já tentou desligar e ligar a equação de novo?',
    'Ontem choveu número complexo aqui.',
    'Cuidado com as moitas: tem raiz escondida.',
    'O bicho guia daqui é sabido demais.',
    'Fala baixo que o Grande Erro escuta.',
  ],
  npc_festa: ['Viva! A raiz voltou!', 'Festa! O erro foi pra zero!', 'Chama a banda, chama o polvo!'],
  arvore: ['Caiu uma semente!', 'Chacoalhou, ganhou!', 'Semente fresquinha!'],
  arvore_vazia: ['Essa árvore já deu o que tinha.', 'Só folha agora. Volta outro dia.', 'A árvore está de férias.'],
  sino: ['Dlém! Dlém!', 'Todo mundo acordou!', 'O sino tocou: hora da raiz!'],
  bau_vazio: ['O baú está vazio.', 'Alguém já passou por aqui... você!', 'Nada além de poeira.'],
};

const ultimo = {};
// Sorteia sem repetir a anterior (regra 6 do tom)
export function fala(gatilho, vars) {
  const lista = FALAS[gatilho] || FALAS.erro_generico;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimo[gatilho]) i = (i + 1) % lista.length;
  ultimo[gatilho] = i;
  let s = lista[i];
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

// Placas de entrada das cidades (trocadilhos)
export const PLACAS = {
  'C1.1': 'Bem-vindo a Bi-Polis: aqui tudo se resolve no meio-termo.',
  'C1.2': 'Pontes de corda esticada. Se um lado não anda, desconfie.',
  'C1.4': 'Não estacione sob a macieira.',
  'C2.1': 'Aqui ninguém fica abaixo da diagonal.',
  'C2.4': 'Espere todo mundo terminar para atualizar.',
  'C2.5': 'Fofoca aqui corre rápido.',
  'C3.3': 'O menor esforço possível desde 1805.',
  'C3.2': 'Curva aqui não tem quina.',
  'C4.1': 'Sem trapaça nas áreas.',
  'C4.4': 'Passo curto, viagem longa.',
  'C0.1': 'Pão truncado: o que sobra, a gente come.',
  'C0.2': 'Proibido subtrair quase iguais.',
  'C0.3': 'Limite de 32767 ovos por ninho.',
  'C1.3': 'Daqui você sai, mas sempre volta.',
  'C1.5': 'Sem derivada desde sempre.',
  'C2.2': 'Pivô zero não entra.',
  'C2.3': 'Fatorou? Agora é só resolver.',
  'C3.1': 'Passamos por todos os pontos.',
  'C4.2': 'Só intervalos pares, por favor.',
  'C4.3': 'Três de cada vez, sem empurrar.',
  'C4.5': 'Quatro motores, uma média.',
  'A0': 'Acampamento Base: wi-fi não, mas tem fogueira.',
};
export const PLACA_ESTRADA = 'Atenção: ponte em manutenção (sinal trocado).';
export const PLACAS_EXTRA = [
  'Raízes fugitivas: favor não alimentar.',
  'Limite de velocidade: 1 iteração por segundo.',
  'Aqui jaz um erro de arredondamento. Descanse em 0,9999...',
  'Cuidado: área sujeita a overflow.',
];

export const LOADING = [
  'Dividindo por zero... brincadeira.',
  'Arredondando a barra de progresso para cima.',
  'Procurando uma raiz que não fugiu.',
  'Calculando a tangente da preguiça.',
  'Fazendo a conta da conta.',
  'Truncando a paciência.',
];

export const RAIZINHA_TUTORIAL = {
  conversa: [
    'Oi, eu sou a Raizinha! A sua mandioquinha de estimação.',
    'Cada cidade tem um bicho guia. Ele dá dicas em troca de sementes.',
    'Dentro das fases, aperte H para chamar o bicho. A primeira dica é grátis!',
    'Sementes caem das árvores, dos baús e das vitórias. Guarde bem!',
  ],
  intro: ['Chegou o(a) engenheiro(a)!', 'As raízes fugiram...', 'Mas você tem método. Vários.'],
};

// Cinemática
export const CINE = {
  vilao: 'Hehehe. Agora ninguém acha a solução!',
  fim: 'Use WASD ou toque para andar.',
};

export const CREDITOS = [
  'Calculândia — Caçadores de Raízes',
  'Overworld feito só com primitivas, código e Web Audio.',
  'Baseado no Documento do Mundo Animado.',
  'Matemática de verdade, piadas de verdade.',
];
