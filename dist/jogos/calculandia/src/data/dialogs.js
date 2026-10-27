// Bíblia de humor (seção 14): falas, placas, narrador. Até 70 caracteres por balão.
import { HERO_NAME } from '../config.js';

// Quem joga: nome, gênero e pet escolhidos na tela de criação.
export const JOGADOR = { nome: HERO_NAME, genero: 'm', pet: 'raizinha' };

// Letras, números, espaço, hífen e apóstrofo; até 16 caracteres.
export function limparNome(nome) {
  return String(nome ?? '').normalize('NFC').replace(/[^\p{L}\p{N} '-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16).trim();
}

export function definirJogador(d) {
  JOGADOR.nome = limparNome(d.player?.nome) || HERO_NAME;
  JOGADOR.genero = d.player?.genero === 'f' ? 'f' : 'm';
  JOGADOR.pet = d.pet === 'gatas' ? 'gatas' : 'raizinha';
}

// Marcadores trocados conforme o jogador: {nome}, {o} (o/a), {patrão}, {bom}, {pet}, {dela}, {comigo}
export function tx(s) {
  const f = JOGADOR.genero === 'f', gatas = JOGADOR.pet === 'gatas';
  const troca = {
    nome: JOGADOR.nome, o: f ? 'a' : 'o', patrão: f ? 'patroa' : 'patrão', bom: f ? 'boa' : 'bom',
    pet: gatas ? 'a Lina e a Nina' : 'a Raizinha', dela: gatas ? 'delas' : 'dela', comigo: gatas ? 'com a gente' : 'comigo',
  };
  return String(s).replace(/\{(nome|o|patrão|bom|pet|dela|comigo)\}/g, (_, k) => troca[k]);
}

// "nina:Texto" → ['nina', 'Texto']: as gatas usam o prefixo para escolher quem fala
export function separarFalante(s) {
  const m = /^(lina|nina):/.exec(s);
  return m ? [m[1], s.slice(m[0].length)] : [null, s];
}

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
    'Troca de linha, {patrão}!',
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
    'Raiz capturada! Ela tentou se esconder, mas você é {bom} demais.',
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
    'Eu não entro aí nem a pau, {patrão}.',
    'Essa névoa tem cheiro de erro de arredondamento.',
    'Lá dentro tudo dá NaN. Bora vencer o chefão antes.',
  ],
  raizinha_vitoria: ['Uhuu! Você é demais!', 'Coraçãozinho pra você!', 'Mais uma! A Usina que se cuide.'],
  raizinha_derrota: ['Kkkk desculpa, não resisti. Bora de novo!', 'Calma, raiz é assim mesmo: arisca.', 'Respira. O próximo chute é melhor.'],
  raizinha_bicho: ['Olha um bicho guia ali! Ele dá dicas.', 'Aquele bicho parece saber das coisas.', 'Vai lá dar um oi, {patrão}!'],
  raizinha_raiz: ['Uma Raiz Fugitiva! Corre que ela é rápida!', 'Pega! Pega! Pega!', 'Ela tá em zigue-zague, vai pelo meio!'],
  raizinha_moita: ['Essa moita tá tremendo... suspeito.', 'Tem alguém escondido ali!', 'Mexe naquela moita, aposto que tem raiz.'],
  raizinha_sem_estrelas: ['Faltam {n} estrelas para enfrentar o chefão.', 'O portão só abre com mais {n} estrelas.', 'Junta mais {n} estrelas nas cidades e a gente volta.'],
  raizinha_usina: ['A Usina só abre depois dos 5 chefões.', 'Cinco chefões, cinco chaves. Falta pouco!', 'Daqui sai a fumaça verde... medo.'],
  raizinha_semente: ['Uma semente! Guarda que vale dica.', 'Sementinha! Dica tem preço, né?', 'Ui, semente! Eu como? Não? Tá bom.'],
  raizinha_tibum: ['Tibum! Água não é chão, {patrão}.'],
  raizinha_pao: ['Hmmm, pão truncado! Nhac!'],
  // Lina e Nina: sem a fala própria, usam a da Raizinha; "lina:"/"nina:" escolhe quem fala
  gatas_idle: ['Miau! Tô com fome de sementes.', 'nina:Lina, para de morder meu rabo!', 'lina:Será que tem peixe na Usina?', 'Rrrrr... esse mapa é bom pra cochilar.'],
  gatas_nevoa: ['Fsssst! Pelo arrepiado. Aí a gente não entra, {patrão}.', 'Essa névoa cheira a erro de arredondamento.', 'Lá dentro tudo dá NaN. Vence o chefão antes!'],
  gatas_vitoria: ['Miau! Você é demais!', 'Ronronando de orgulho!', 'nina:Mais uma! A Usina que se cuide.'],
  gatas_derrota: ['Miau... raiz é arisca que nem gato.', 'Calma, até gato erra o pulo. Bora de novo!', 'Respira. O próximo chute é melhor.'],
  gatas_bicho: ['Olha um bicho guia! Prometo não caçar ele.', 'Aquele bicho parece saber das coisas.', 'Vai lá dar um oi, {patrão}!'],
  gatas_raiz: ['Uma Raiz Fugitiva! Modo caça ativado!', 'Pega! Pega! Pega!', 'Ela tá em zigue-zague, vai pelo meio!'],
  gatas_moita: ['Essa moita tá mexendo... minhas orelhas não mentem.', 'Tem alguém escondido ali!', 'Mexe naquela moita, aposto que tem raiz.'],
  gatas_semente: ['Uma semente! Guarda que vale dica.', 'Sementinha! Dá pra brincar de bolinha?', 'nina:Não é petisco? Que pena. Guarda, então.'],
  gatas_tibum: ['Fsss! Água não! Gato e água não combinam.'],
  gatas_pao: ['Nhac! Gato também gosta de pão truncado.'],
  robo: ['DIVIDINDO... POR ZERO... ERRO', 'OVERFLOW... OVERFLOW... OVERFL', 'NaN NaN NaN... BATMAN?', 'TOLERÂNCIA... NÃO... ENCONTRADA'],
  sem_dinheiro: ['Sem sementes, sem dica. Nem bicho trabalha de graça!', 'Seu saldo de sementes deu underflow.', 'Chacoalha umas árvores e volta aqui.'],
  npc: [
    'Bom dia! Ou boa iteração, sei lá.',
    'Dizem que a Usina está cuspindo NaN.',
    'Você é {o} engenheir{o}? Salva a gente!',
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
  return tx(s);
}

// Fala do pet: a versão própria dele, ou a da Raizinha quando não houver
export function falaPet(pet, gatilho, vars) {
  return fala(FALAS[`${pet}_${gatilho}`] ? `${pet}_${gatilho}` : `raizinha_${gatilho}`, vars);
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

export const PET_TUTORIAL = {
  raizinha: {
    conversa: [
      'Oi, {nome}! Eu sou a Raizinha, a sua mandioquinha de estimação.',
      'Cada cidade tem um bicho guia. Ele dá dicas em troca de sementes.',
      'Dentro das fases, aperte H para chamar o bicho. A primeira dica é grátis!',
      'Sementes caem das árvores, dos baús e das vitórias. Guarde bem!',
    ],
    intro: ['Chegou {o} engenheir{o} {nome}!', 'As raízes fugiram...', 'Mas você tem método. Vários.'],
  },
  gatas: {
    conversa: [
      'lina:Miau! Oi, {nome}! Eu sou a Lina.',
      'nina:E eu sou a Nina! A gente vai junto com você pela ilha toda.',
      'lina:Cada cidade tem um bicho guia. Ele dá dicas em troca de sementes.',
      'nina:Dentro das fases, aperte H para chamar o bicho. A primeira dica é grátis!',
      'lina:Sementes caem das árvores, dos baús e das vitórias. Nada de brincar com elas!',
    ],
    intro: ['lina:Miau! Chegou {o} engenheir{o} {nome}!', 'nina:As raízes fugiram...', 'lina:Mas você tem método. Vários.'],
  },
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
