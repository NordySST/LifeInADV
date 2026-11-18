/* Eventos da velhice (50+) e eventos que podem ocorrer em qualquer fase. */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;
  const ST = 'vel';

  G.add([
    /* ---------- Velhice ---------- */
    {
      id: 'neto', st: ST, req: (s) => (s.f.filhos || 0) > 0,
      text: '{filho} aparece na sua porta com um bebê no colo: seu primeiro neto!',
      choices: [
        { t: 'Segurar o bebê', out: { t: 'O bebê agarrou seu dedo com força. Você chorou sem vergonha.', fx: { car: 1, hp: 2 }, set: 'neto' } },
        { t: 'Contar suas aventuras para ele', out: { t: 'Ele dormiu na segunda história. Vai ouvir o resto quando crescer.', fx: { int: 1 }, set: 'neto' } },
      ],
    },
    {
      id: 'memorias', st: ST,
      text: 'Sentado na varanda, você pensa em tudo que viveu. Um jovem escriba de {vila} quer escrever suas memórias.',
      choices: [
        { t: 'Contar tudo, sem esconder nada', out: { t: 'O livro foi um escândalo e um sucesso!', fx: { gold: 50, car: 1 }, title: 'Autor de Memórias' } },
        { t: 'Aumentar um pouco as histórias', out: { t: 'Nas memórias, você matou três dragões. A verdade é chata.', fx: { car: 2 } } },
        { t: 'Recusar', out: { t: 'Algumas histórias são só suas.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'aprendiz_velho', st: ST,
      text: 'Um jovem chamado {npc} bate à sua porta pedindo para aprender tudo o que você sabe.',
      choices: [
        { t: 'Ensinar com paciência', out: { t: '{npc} se tornou alguém incrível. Seu legado vive.', fx: { car: 1, int: 1 }, set: 'legado', title: 'Mestre de {npc}' } },
        { t: 'Ensinar com rigidez', check: { s: 'for', d: 4 }, ok: { t: '{npc} reclamou muito, mas virou um prodígio.', fx: { for: 1 }, set: 'legado' }, fail: { t: '{npc} desistiu no terceiro dia.', fx: {} } },
        { t: 'Mandar embora', out: { t: 'Você está velho demais para isso.', fx: { hp: 1 } } },
      ],
    },
    {
      id: 'saude_fraca', st: ST, once: false, cd: 8,
      text: ['Seus joelhos estalam como lenha na fogueira.', 'Acordar está ficando mais difícil a cada dia.', 'Você esqueceu onde deixou os óculos. Estavam na sua cabeça.'],
      choices: [
        { t: 'Caminhar todos os dias', check: { s: 'for', d: 4 }, ok: { t: 'Você se sente anos mais jovem.', fx: { hp: 2 } }, fail: { t: 'Você tropeçou e machucou o quadril.', fx: { hp: -2 } } },
        { t: 'Tomar remédios da curandeira', req: (s) => s.gold >= 10, out: { t: 'Amargo, mas funciona.', fx: { gold: -10, hp: 3 } } },
        { t: 'Aceitar a idade', out: { t: 'Envelhecer é um privilégio.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'testamento', st: ST, minAge: 60,
      text: 'É hora de pensar no testamento. O que você vai deixar para o mundo?',
      choices: [
        { t: 'Deixar tudo para a família', req: (s) => (s.f.filhos || 0) > 0 || s.f.irmao, out: { t: 'Sua família será bem cuidada.', fx: { car: 1 }, set: 'testamento' } },
        { t: 'Doar ao templo de {deus}', out: { t: 'Os sacerdotes vão rezar por você por cem anos.', fx: { sor: 2 }, set: 'testamento' } },
        { t: 'Esconder o ouro e deixar um mapa enigmático', out: { t: 'Gerações vão procurar seu tesouro. Você ri só de imaginar.', fx: { int: 1 }, title: 'Lenda do Tesouro Perdido', set: 'testamento' } },
        { t: 'Gastar tudo antes de morrer', out: { t: 'Uma festa de uma semana!', fx: { hp: 2, car: 1 }, fn: (s) => { s.gold = 0; } } },
      ],
    },
    {
      id: 'amor_antigo', st: ST, req: (s) => s.ppl.amor && !s.f.casado,
      text: 'Na feira de {vila}, você reconhece um rosto envelhecido: é {amor}, seu amor de juventude.',
      choices: [
        { t: 'Falar com {amor}', out: [{ t: 'Vocês conversaram como se nenhum dia tivesse passado. E decidiram passar os últimos anos juntos.', set: 'casado', ppl: { conjuge: '{amor}' }, fx: { car: 2, hp: 3 } }, { t: 'Vocês tomaram chá e lembraram de tudo. Foi o bastante.', fx: { sor: 1 } }] },
        { t: 'Apenas observar de longe', out: { t: 'Você sorriu sozinho e foi embora.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'conselho_vila', st: ST,
      text: 'Os moradores de {lugar} querem que você faça parte do conselho dos anciãos.',
      choices: [
        { t: 'Aceitar', out: { t: 'Agora suas palavras têm peso. E as reuniões são longas.', fx: { car: 1, int: 1 }, title: 'Ancião do Conselho' } },
        { t: 'Recusar e pescar', out: { t: 'Os peixes não pedem conselho. Ótimo.', fx: { hp: 2 } } },
      ],
    },
    {
      id: 'viuvez', st: ST, req: (s) => s.f.casado && !s.f.viuvo, w: 5,
      text: '{conjuge} adoece numa noite de inverno e não melhora.',
      choices: [
        { t: 'Ficar ao lado até o fim', out: { t: '{conjuge} partiu segurando sua mão. A casa ficou grande demais.', set: 'viuvo', fx: { hp: -2, int: 1 } } },
        { t: 'Buscar todos os curandeiros', req: (s) => s.gold >= 50, check: { s: 'sor', d: 5 }, ok: { t: 'Um curandeiro do deserto salvou {conjuge}! Vocês ganharam mais anos juntos.', fx: { gold: -50, car: 1 } }, fail: { t: 'Nada funcionou. {conjuge} partiu.', fx: { gold: -50 }, set: 'viuvo' } },
      ],
    },
    {
      id: 'ultima_aventura', st: ST, req: (s) => ['aventureiro', 'soldado', 'ladrao'].includes(s.job),
      text: 'Seus velhos companheiros de armas aparecem: "Uma última aventura, pelos velhos tempos?"',
      choices: [
        { t: 'Pegar a espada mais uma vez', check: { s: 'for', d: 6 }, ok: { t: 'Vocês voltaram com ouro e mais uma história.', fx: { gold: 80 }, title: 'Velho Leão' }, fail: { t: 'Seu corpo já não era o mesmo.', fx: { hp: -5 }, cause: 'a última aventura' } },
        { t: 'Ir só para contar piadas', out: { t: 'Eles disseram que você foi o melhor da viagem.', fx: { car: 1 } } },
        { t: 'Recusar', out: { t: 'Você brindou à saúde deles e ficou em casa.', fx: { hp: 1 } } },
      ],
    },
    {
      id: 'aniversario', st: ST,
      text: 'É seu aniversário de {idade} anos! {quem} prepara uma surpresa.',
      ctx: (s, c) => { c.idade = s.age; c.quem = s.f.casado && !s.f.viuvo ? s.ppl.conjuge : s.ppl.filho || 'A vizinhança'; },
      choices: [
        { t: 'Fingir surpresa', out: { t: 'Uma noite de bolo e risadas.', fx: { hp: 2, car: 1 } } },
        { t: 'Fazer um discurso emocionado', check: { s: 'car', d: 4 }, ok: { t: 'Ninguém ficou de olho seco.', fx: { car: 1 } }, fail: { t: 'Você dormiu no meio do próprio discurso.', fx: { hp: 1 } } },
      ],
    },
    {
      id: 'viagem_final', st: ST, req: (s) => s.f.sonha_viajar || s.f.fugiu,
      text: 'Você sempre quis ver o mundo. Ainda dá tempo?',
      choices: [
        { t: 'Partir sem olhar para trás', out: { t: 'Você viu o mar, as montanhas e o deserto. Valeu cada passo.', travel: true, fx: { int: 1, sor: 1 }, title: 'Andarilho de Cabelos Brancos' } },
        { t: 'Fazer só uma viagem curta', out: { t: 'Um passeio até {vila}. O suficiente.', fx: { hp: 1 } } },
      ],
    },
    {
      id: 'dragao_pet_velho', st: ST, req: (s) => s.f.dragao_pet,
      text: 'Seu dragão, agora enorme, pousa no telhado e o telhado desaba. De novo.',
      choices: [
        { t: 'Dar uma bronca', out: { t: 'Ele baixou a cabeça. Uma montanha de culpa.', fx: { car: 1 } } },
        { t: 'Dar um passeio nas costas dele', check: { s: 'agi', d: 5 }, ok: { t: 'Você voou sobre o {reino} como nenhum velho jamais voou.', fx: { sor: 2 }, title: 'Cavaleiro de Dragão' }, fail: { t: 'Você caiu num lago. Ele te pescou.', fx: { hp: -2 } } },
      ],
    },
    {
      id: 'netos_historias', st: ST, req: (s) => s.f.neto,
      text: 'Seus netos pedem: "Conta de novo a história de quando você {feito}!"',
      ctx: (s, c) => { c.feito = s.titles.length ? 'virou ' + R.pick(s.titles) : 'quase virou herói'; },
      choices: [
        { t: 'Contar a verdade', out: { t: 'Eles ficaram fascinados.', fx: { car: 1 } } },
        { t: 'Exagerar tudo', out: { t: 'Agora havia três dragões e um exército. Eles adoraram.', fx: { car: 1, sor: 1 } } },
      ],
    },

    /* ---------- Qualquer fase ---------- */
    {
      id: 'estrela_cadente', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'Uma estrela cadente atravessa o céu de {lugar}. Dizem que ela realiza um desejo.',
      choices: [
        { t: 'Desejar riqueza', out: [{ t: 'No dia seguinte você achou uma bolsa na estrada.', fx: { gold: [10, 30] } }, { t: 'Nada aconteceu. Ou ainda vai acontecer.', fx: { sor: 1 } }] },
        { t: 'Desejar saúde', out: { t: 'Você se sente mais forte.', fx: { maxHp: 1, hp: 2 } } },
        { t: 'Correr até onde ela caiu', check: { s: 'agi', d: 5 }, ok: { t: 'Uma pedra quente e brilhante! Você a guardou.', item: { n: 'fragmento de estrela', s: 'sor', b: 2, tag: 'estrela' } }, fail: { t: 'Você se perdeu no escuro.', fx: { hp: -1 } } },
      ],
    },
    {
      id: 'mendigo_profecia', st: ['jov', 'adu', 'vel'],
      text: 'Um mendigo agarra seu braço: "{profecia}"',
      ctx: (s, c) => { c.profecia = R.pick(['Quando a lua ficar vermelha, não atravesse a ponte!', 'Você já morreu uma vez e nem percebeu.', 'O rei usa sapatos de mulher!', 'Seu nome será esquecido... a menos que você plante uma árvore.', 'Tem um gato te seguindo. Sempre teve.']); },
      choices: [
        { t: 'Dar uma moeda', req: (s) => s.gold > 0, out: [{ t: 'Ele mordeu a moeda e desapareceu numa nuvem de fumaça.', fx: { gold: -1, sor: 2 } }, { t: 'Ele agradeceu e foi beber.', fx: { gold: -1, car: 1 } }] },
        { t: 'Perguntar mais', check: { s: 'car', d: 4 }, ok: { t: 'Ele te contou segredos sobre {lugar} que ninguém mais sabe.', fx: { int: 2 } }, fail: { t: 'Ele começou a cantar e não parou mais.', fx: {} } },
        { t: 'Puxar o braço', out: { t: 'Ele riu de um jeito que te deu calafrios.', fx: { sor: -1 } } },
      ],
    },
    {
      id: 'chuva_estranha', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'Hoje choveu {coisa} em {lugar}. Ninguém sabe explicar.',
      ctx: (s, c) => { c.coisa = R.pick(['sapos', 'pétalas de rosa', 'peixinhos prateados', 'moedas de cobre', 'cinzas mornas', 'penas azuis']); },
      choices: [
        { t: 'Recolher o que puder', out: [{ t: 'Você juntou um bom punhado. Pode ser útil.', fx: { gold: [2, 12] } }, { t: 'Não serviu pra nada, mas foi divertido.', fx: { car: 1 } }] },
        { t: 'Investigar a causa', check: { s: 'int', d: 5 }, ok: { t: 'Era um mago bêbado numa torre próxima. Ele te pagou para ficar calado.', fx: { gold: 20, int: 1 } }, fail: { t: 'Mistério sem solução.', fx: { int: 1 } } },
        { t: 'Rezar para {deus}', out: { t: 'Talvez seja um sinal. Você se sente protegido.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'gato_preto', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'Um gato preto de um olho só senta à sua frente e não sai mais.',
      choices: [
        { t: 'Adotar o gato', out: [{ t: 'Ele trouxe sorte. Ou pelo menos ratos mortos.', fx: { sor: 1 }, set: 'gato' }, { t: 'Desde que ele chegou, coisas estranhas acontecem à noite.', fx: { int: 1 }, set: 'gato' }] },
        { t: 'Espantar', out: { t: 'Ele voltou no dia seguinte. E no outro.', fx: { sor: -1 } } },
      ],
    },
    {
      id: 'circo', st: ['inf', 'jov', 'adu'],
      text: 'O Circo dos Mil Olhos chega a {lugar}! Lonas listradas, feras exóticas e um homem que engole espadas.',
      choices: [
        { t: 'Assistir ao espetáculo', out: { t: 'Uma noite mágica que você nunca esqueceu.', fx: { car: 1, sor: 1 } } },
        { t: 'Visitar a tenda proibida', check: { s: 'agi', d: 4 }, ok: [{ t: 'Lá dentro, uma criatura numa jaula te pediu ajuda com voz humana.', set: 'criatura_circo', fx: { int: 1 } }, { t: 'Era só o depósito de lantejoulas.', fx: { car: 1 } }], fail: { t: 'O domador te pegou e te jogou para fora.', fx: { hp: -1 } } },
        { t: 'Pedir para entrar para o circo', check: { s: 'agi', d: 6 }, ok: { t: 'Você viajou com eles por uma temporada inteira!', travel: true, fx: { agi: 2, gold: 20 } }, fail: { t: 'Eles disseram que você não tinha "aquele algo".', fx: { car: -1 } } },
      ],
    },
    {
      id: 'liberta_criatura', st: ['jov', 'adu'], req: (s) => s.f.criatura_circo,
      text: 'Você não consegue esquecer a criatura que falava na jaula do circo. O circo está acampado perto de {vila}.',
      choices: [
        { t: 'Libertá-la à noite', check: { s: 'agi', d: 6 }, ok: { t: 'Era uma princesa encantada! A família dela te cobriu de ouro.', fx: { gold: 150 }, title: 'Libertador', unset: 'criatura_circo' }, fail: { t: 'Os seguranças do circo te pegaram.', fx: { hp: -3 }, unset: 'criatura_circo' } },
        { t: 'Comprar a criatura', req: (s) => s.gold >= 60, out: { t: 'Livre, ela virou um falcão e voltava todo ano para te visitar.', fx: { gold: -60, sor: 3 }, unset: 'criatura_circo' } },
        { t: 'Esquecer o assunto', out: { t: 'Você pensa nela às vezes.', unset: 'criatura_circo' } },
      ],
    },
    {
      id: 'terremoto', st: ['inf', 'jov', 'adu', 'vel'], w: 5,
      text: 'O chão de {lugar} treme violentamente. Paredes racham, sinos tocam sozinhos.',
      choices: [
        { t: 'Correr para campo aberto', check: { s: 'agi', d: 4 }, ok: { t: 'Você escapou ileso.', fx: { agi: 1 } }, fail: { t: 'Uma parede caiu sobre você.', fx: { hp: -4 }, cause: 'um terremoto' } },
        { t: 'Ajudar os vizinhos', check: { s: 'for', d: 5 }, ok: { t: 'Você tirou três pessoas dos escombros.', fx: { car: 2 } }, fail: { t: 'Um tremor secundário te derrubou.', fx: { hp: -3 }, cause: 'um terremoto' } },
        { t: 'Ver a fenda que se abriu', out: [{ t: 'No fundo da fenda, algo brilhava. Você puxou um item antigo.', item: 'gen' }, { t: 'Da fenda saía um vapor que cheirava a enxofre e risadas.', fx: { int: 1 }, set: 'fenda' }] },
      ],
    },
    {
      id: 'fantasma', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'À noite, uma figura translúcida aparece no pé da sua cama. {fala}',
      ctx: (s, c) => { c.fala = R.pick(['Ela parece procurar algo.', 'Ela chora em silêncio.', 'Ela aponta para a janela.', 'Ela tem o seu rosto.']); },
      choices: [
        { t: 'Perguntar o que ela quer', check: { s: 'car', d: 4 }, ok: [{ t: 'Ela queria que alguém encontrasse sua aliança perdida no jardim. Você achou e ela sorriu antes de sumir.', fx: { sor: 2 } }, { t: 'Ela sussurrou o lugar de um tesouro antes de sumir.', set: 'mapa_x' }], fail: { t: 'Ela gritou e você não dormiu por uma semana.', fx: { hp: -1 } } },
        { t: 'Cobrir a cabeça', out: { t: 'Ela ficou lá a noite toda. De manhã, tinha sumido.', fx: { int: 1 } } },
        { t: 'Jogar sal', req: (s) => s.f.viu_fantasma || s.f.sabe_ervas || s.job === 'sacerdote', out: { t: 'Funcionou. Você é especialista nisso agora.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'banquete_estranho', st: ['jov', 'adu', 'vel'],
      text: 'Um nobre excêntrico, {npc} de {vila}, convida todos que passam para um banquete. Há um prato coberto no centro da mesa.',
      choices: [
        { t: 'Destampar o prato', out: [{ t: 'Um ganso de ouro maciço! O nobre te deu como prêmio pela coragem.', fx: { gold: 60 } }, { t: 'Um bilhete: "Curiosidade mata". O nobre gargalhou e te expulsou.', fx: { car: -1 } }, { t: 'Uma torta enorme. De dentro saíram vinte pombos.', fx: { car: 1 } }] },
        { t: 'Comer e ficar quieto', out: { t: 'A melhor refeição em anos.', fx: { hp: 3 } } },
        { t: 'Desconfiar do vinho', check: { s: 'int', d: 5 }, ok: { t: 'Envenenado! Você salvou os convidados e desmascarou o nobre.', fx: { car: 2, gold: 30 } }, fail: { t: 'O vinho era só ruim mesmo.', fx: {} } },
      ],
    },
    {
      id: 'tesouro_rio', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'Uma garrafa com uma mensagem chega à margem do rio.',
      choices: [
        { t: 'Ler a mensagem', out: [{ t: '"Socorro, estou preso numa ilha!" Você levou a carta à guarda costeira. Um náufrago foi salvo e te mandou ouro.', fx: { gold: 40, car: 1 } }, { t: 'Uma receita de bolo. Excelente, aliás.', fx: { hp: 1 } }, { t: 'Um mapa parcial. Isso pode ser algo.', set: 'mapa_x' }, { t: 'Uma carta de amor sem nome. Você ficou pensando nela por dias.', fx: { car: 1 } }] },
        { t: 'Jogar de volta', out: { t: 'Talvez chegue a quem precisa.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'eclipse', st: ['inf', 'jov', 'adu', 'vel'],
      text: 'O sol some no meio do dia. Os animais ficam em silêncio. As pessoas de {lugar} entram em pânico.',
      choices: [
        { t: 'Acalmar a multidão', check: { s: 'car', d: 5 }, ok: { t: 'Você explicou que era só a lua passando. Virou referência na vila.', fx: { car: 1, int: 1 } }, fail: { t: 'Ninguém te ouviu. Você foi pisoteado.', fx: { hp: -2 } } },
        { t: 'Olhar para o céu', out: { t: 'Por um instante, você viu estrelas ao meio-dia. Algo em você despertou.', fx: { int: 1, sor: 1 }, trait: 'marcado' } },
        { t: 'Aproveitar a confusão', check: { s: 'agi', d: 4 }, ok: { t: 'Bolsos cheios, consciência pesada.', fx: { gold: 15, sor: -1 } }, fail: { t: 'Quando a luz voltou, você estava com a mão no bolso de um guarda.', fx: { hp: -2, gold: -10 } } },
      ],
    },
  ]);
})();
