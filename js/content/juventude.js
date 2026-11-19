/* Eventos da juventude (13–19 anos). */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;
  const ST = 'jov';

  G.add([
    {
      id: 'escolha_caminho', st: ST, minAge: 15, w: 40, req: (s) => !s.job,
      text: 'Você já tem idade para escolher um ofício. Em {cidade}, todos parecem saber o que fazer da vida — menos você.',
      choices: [
        { t: 'Prestar o exame da Academia Arcana', check: { s: 'int', d: 5 }, ok: { t: 'Aprovado! Seu nome foi escrito no livro dos aprendizes.', job: 'mago', fx: { int: 1 } }, fail: { t: 'Reprovado. O examinador disse que você "tem a magia de uma batata".', fx: { car: -1 } } },
        { t: 'Alistar-se na guarda do {reino}', out: { t: 'Você recebeu uma lança, um elmo amassado e um sargento que grita muito.', job: 'soldado', fx: { for: 1 } } },
        { t: 'Ser aprendiz de comerciante', out: { t: 'Você aprendeu que tudo tem preço, inclusive as pessoas.', job: 'mercador', fx: { car: 1 } } },
        { t: 'Entrar para o templo de {deus}', out: { t: 'Você raspou a cabeça e fez seus votos.', job: 'sacerdote', fx: { sor: 1 } } },
        { t: 'Seguir uma trupe de bardos', check: { s: 'car', d: 4 }, ok: { t: 'Eles gostaram da sua voz. Você partiu com a trupe.', job: 'bardo', fx: { car: 1 }, travel: true }, fail: { t: 'Eles riram da sua voz. Você voltou pra casa.', fx: { car: -1 } } },
        { t: 'Cuidar das terras da família', req: (s) => s.f.o_campones || s.f.o_cacadores || s.f.o_pescador, out: { t: 'A terra é dura, mas honesta.', job: 'fazendeiro', fx: { for: 1 } } },
        { t: 'Procurar a Guilda das Sombras', req: (s) => s.f.ratos || s.f.t_maoleve || s.f.o_orfao, out: { t: 'Uma senha sussurrada, uma porta escondida. Você é da Guilda agora.', job: 'ladrao', fx: { agi: 1 } } },
        { t: 'Pegar a estrada e virar aventureiro', out: { t: 'Uma mochila, um bastão e muita coragem. O mundo te espera.', job: 'aventureiro', travel: true, fx: { agi: 1 } } },
      ],
    },
    {
      id: 'primeiro_amor', st: ST, minAge: 14, req: (s) => !s.ppl.amor,
      text: ['Você não consegue parar de pensar em {npc}, que trabalha no mercado de {cidade}.', '{npc} chegou à vila com a família e todo mundo comenta. Você incluído.'],
      choices: [
        { t: 'Declarar-se com um poema', check: { s: 'car', d: 4 }, ok: { t: '{npc} corou e aceitou passear com você no fim da tarde.', ppl: { amor: '{npc}' }, set: 'namoro', chain: ['romance_teste', 2, 4] }, fail: { t: '{npc} riu. Não de um jeito bom.', fx: { car: -1 }, set: 'coracao_partido' } },
        { t: 'Ajudar {npc} com o trabalho todos os dias', out: [{ t: 'Depois de semanas, {npc} perguntou: "Você vai me chamar pra sair ou não?"', ppl: { amor: '{npc}' }, set: 'namoro', chain: ['romance_teste', 2, 4] }, { t: '{npc} agradeceu... e começou a namorar o filho do moleiro.', fx: { for: 1 }, set: 'coracao_partido' }] },
        { t: 'Guardar segredo pra sempre', out: { t: 'Você escreveu cartas que nunca enviou.', fx: { int: 1 }, set: 'cartas_secretas' } },
      ],
    },
    {
      id: 'romance_teste', chainOnly: true, req: (s) => s.f.namoro,
      text: 'Seu romance com {amor} enfrenta um problema: {problema}.',
      ctx: (s, c) => { c.problema = R.pick(['a família de {amor} não aprova você', '{rival} começou a cortejar {amor}', '{amor} recebeu uma proposta para morar em {vila}', 'vocês brigaram feio por uma bobagem']).replace(/\{(\w+)\}/g, (m, k) => c[k] || s.ppl[k] || m); },
      choices: [
        { t: 'Lutar pelo amor', check: { s: 'car', d: 4 }, ok: { t: 'Vocês superaram tudo. Agora é sério.', set: 'noivado', fx: { car: 1 } }, fail: { t: '{amor} foi embora. Você aprendeu como dói.', unset: 'namoro', set: 'coracao_partido', fx: { int: 1 } } },
        { t: 'Propor fugir juntos', check: { s: 'sor', d: 4 }, ok: { t: 'Vocês fugiram numa noite de lua cheia!', set: 'noivado', travel: true }, fail: { t: '{amor} não teve coragem. Vocês se despediram na ponte.', unset: 'namoro', set: 'coracao_partido' } },
        { t: 'Deixar ir', out: { t: 'Às vezes amar é abrir a mão.', unset: 'namoro', fx: { int: 1, sor: 1 } } },
      ],
    },
    {
      id: 'torneio_juvenil', st: ST,
      text: 'O torneio de jovens de {lugar} oferece uma bolsa de prata para o campeão.',
      choices: [
        { t: 'Lutar com bastão', check: { s: 'for', d: 5 }, ok: { t: 'Você venceu a final com um golpe limpo!', fx: { gold: 25, for: 1 }, title: 'Campeão Juvenil de {lugar}' }, fail: { t: 'Você caiu na segunda rodada, com o nariz sangrando.', fx: { hp: -2 } } },
        { t: 'Competir no arco', check: { s: 'agi', d: 5 }, ok: { t: 'Flecha no centro. A multidão gritou seu nome.', fx: { gold: 25, agi: 1 }, title: 'Olho de Falcão' }, fail: { t: 'Sua flecha acertou o chapéu de um juiz.', fx: { car: -1, sor: 1 } } },
        { t: 'Apostar nos outros', check: { s: 'int', d: 4 }, ok: { t: 'Você estudou os lutadores e apostou certo.', fx: { gold: 15 } }, fail: { t: 'Seu favorito tropeçou na própria espada.', fx: { gold: -8 } } },
      ],
    },
    {
      id: 'taverna_primeira', st: ST, minAge: 15,
      text: 'Primeira noite na taverna "{taverna}". O lugar cheira a cerveja e encrenca.',
      choices: [
        { t: 'Desafiar alguém na bebida', check: { s: 'for', d: 5 }, ok: { t: 'Você venceu um anão. Um anão! A taverna inteira pagou rodadas.', fx: { car: 1, for: 1 }, title: 'Fígado de Ferro' }, fail: { t: 'Você acordou no chiqueiro, sem uma bota.', fx: { hp: -1, car: -1 } } },
        { t: 'Ouvir conversas', out: [{ t: 'Você ouviu sobre um tesouro escondido em {vila}.', set: 'rumor_tesouro' }, { t: 'Você ouviu que {rival} anda metido com contrabandistas.', set: 'segredo_rival' }] },
        { t: 'Jogar cartas', check: { s: 'sor', d: 4 }, ok: { t: 'Uma noite de sorte!', fx: { gold: [10, 25] } }, fail: { t: 'Você perdeu até o que não tinha.', fx: { gold: -10 } } },
        { t: 'Cantar em cima da mesa', check: { s: 'car', d: 4 }, ok: { t: 'O taverneiro te ofereceu trabalho às sextas.', fx: { car: 1, gold: 5 } }, fail: { t: 'Uma caneca voou na sua direção.', fx: { hp: -1 } } },
      ],
    },
    {
      id: 'fugir_casa', st: ST, w: 6,
      text: 'Depois de uma briga feia com {mae}, você pensa seriamente em fugir de casa.',
      choices: [
        { t: 'Fugir de madrugada', out: { t: 'Você pegou a estrada com uma trouxa e o coração apertado.', travel: true, fx: { agi: 1, car: -1 }, set: 'fugiu' } },
        { t: 'Fazer as pazes', check: { s: 'car', d: 3 }, ok: { t: 'Vocês se abraçaram e choraram juntos.', fx: { car: 1 } }, fail: { t: 'O silêncio durou semanas.', fx: { int: 1 } } },
        { t: 'Ir passar uns dias com {amigo}', req: (s) => s.f.amigo, out: { t: 'A família de {amigo} te tratou como filho.', fx: { car: 1, hp: 1 } } },
      ],
    },
    {
      id: 'mentor_aparece', st: ST,
      text: 'Um estranho de capa cinzenta, que se apresenta como {mentor}, observa você há dias. Hoje ele se aproxima.',
      choices: [
        { t: 'Aceitar ser ensinado', out: [{ t: '{mentor} te ensinou a lutar como a água: sem resistir, sem parar.', fx: { agi: 2 }, set: 'mentor' }, { t: '{mentor} te ensinou a ler as estrelas e os homens.', fx: { int: 1, car: 1 }, set: 'mentor' }, { t: '{mentor} te ensinou que medo é só um conselheiro, não um rei.', fx: { for: 1 }, trait: 'corajoso', set: 'mentor' }] },
        { t: 'Perguntar o que ele quer', check: { s: 'int', d: 4 }, ok: { t: '"Alguém tem que continuar meu trabalho." Ele te deu um anel e sumiu.', item: { n: 'anel de {mentor}', s: 'sor', b: 2, tag: 'anel' }, set: 'mentor' }, fail: { t: 'Ele sorriu e não respondeu. No dia seguinte, tinha ido embora.', fx: { sor: 1 } } },
        { t: 'Denunciar à guarda', out: { t: 'A guarda o prendeu. Na cela, havia só uma pena de corvo no lugar dele.', fx: { sor: -1 }, set: 'traiu_mentor' } },
      ],
    },
    {
      id: 'duelo_rival', st: ST, req: (s) => s.f.rival,
      text: '{rival}, sua velha rixa de infância, te desafia na frente de toda a vila. Agora vocês são quase adultos.',
      choices: [
        { t: 'Aceitar o duelo', combat: { enemy: (s) => ({ name: s.ppl.rival, base: 'bandoleiro', adj: 'teimoso', pow: 4, tipo: 'gente' }) }, ok: { t: 'Você venceu. {rival} te estendeu a mão. Talvez... respeito?', fx: { for: 1, car: 1 }, set: 'rival_respeito' }, fail: { t: '{rival} venceu e cuspiu no chão ao seu lado.', set: 'rival_odio' } },
        { t: 'Propor uma corrida em vez disso', check: { s: 'agi', d: 5 }, ok: { t: 'Você chegou primeiro e {rival} ficou sem palavras.', fx: { agi: 1 } }, fail: { t: 'Você perdeu por um passo.', fx: { car: -1 } } },
        { t: 'Propor uma trégua', check: { s: 'car', d: 5 }, ok: { t: 'Vocês riram das bobagens de infância. Quem diria, viraram amigos.', unset: 'rival', set: 'rival_amigo', fx: { car: 1 } }, fail: { t: '{rival} achou que era covardia.', set: 'rival_odio' } },
      ],
    },
    {
      id: 'bandidos_estrada', st: ['jov', 'adu'], once: false, cd: 20,
      text: 'Bandidos de lenço no rosto fecham a estrada para {vila}. "A bolsa ou a vida!"',
      choices: [
        { t: 'Lutar', combat: { enemy: (s) => ({ name: 'o líder dos bandidos', base: 'salteador', adj: 'astuto', pow: 3 + Math.floor(s.age / 20), tipo: 'gente' }) }, ok: { t: 'Você derrubou o líder e os outros fugiram. Eles deixaram uma sacola para trás.', fx: { gold: [10, 30] } }, fail: { t: 'Você caiu, e eles levaram tudo o que você tinha.', fx: { gold: -20 } } },
        { t: 'Entregar a bolsa', out: { t: 'Eles levaram suas moedas e riram da sua cara.', fx: { gold: -15 } } },
        { t: 'Fugir pelo mato', check: { s: 'agi', d: 4 }, ok: { t: 'Você sumiu entre as árvores.', fx: { agi: 1 } }, fail: { t: 'Uma flecha raspou seu ombro.', fx: { hp: -2 } } },
        { t: 'Convencê-los de que você é um deles', check: { s: 'car', d: 6 }, ok: { t: 'Eles te convidaram para dividir o jantar e te contaram onde escondem o saque.', set: 'esconderijo_bandidos', fx: { car: 1 } }, fail: { t: 'Eles riram. Depois bateram.', fx: { hp: -3, gold: -10 } } },
      ],
    },
    {
      id: 'livro_proibido', st: ST,
      text: 'Um mascate te oferece, em segredo, um livro de capa de couro preto: "{titulo}".',
      ctx: (s, c) => { c.titulo = R.pick(['Os Nomes Verdadeiros', 'Sobre a Morte e Seus Atalhos', 'O Grimório de ' + G.gen.proper(), 'Cartas ao Abismo', 'Tratado das Portas que Não Existem']); },
      choices: [
        { t: 'Comprar (10 ouro)', req: (s) => s.gold >= 10, out: [{ t: 'Você leu de madrugada, à luz de vela. Algo em você mudou.', fx: { gold: -10, int: 2, sor: -1 }, set: 'leu_proibido' }, { t: 'Era um livro de piadas com capa assustadora. Até que eram boas.', fx: { gold: -10, car: 1 } }] },
        { t: 'Folhear antes', check: { s: 'int', d: 4 }, ok: { t: 'Você memorizou as páginas mais importantes sem pagar nada.', fx: { int: 1 }, set: 'leu_proibido' }, fail: { t: 'As letras se mexeram. Você ficou com dor de cabeça por uma semana.', fx: { hp: -1 } } },
        { t: 'Denunciar o mascate', out: { t: 'A guarda te deu uma moeda de recompensa. O mascate te jurou vingança.', fx: { gold: 3 }, set: 'inimigo_mascate' } },
      ],
    },
    {
      id: 'baile_vila', st: ST, minAge: 14,
      text: 'É noite de baile em {cidade}! Lanternas coloridas e música de rabeca.',
      choices: [
        { t: 'Dançar com {amor}', req: (s) => s.f.namoro, out: { t: 'Vocês dançaram como se ninguém estivesse olhando. Todos estavam.', fx: { car: 1, sor: 1 } } },
        { t: 'Tirar alguém para dançar', check: { s: 'car', d: 4 }, ok: { t: '{npc} aceitou e vocês dançaram a noite toda.', fx: { car: 1 } }, fail: { t: 'Três recusas seguidas. Você foi comer bolo.', fx: { hp: 1 } } },
        { t: 'Tocar com os músicos', check: { s: 'car', d: 5 }, ok: { t: 'O baile pediu bis!', fx: { car: 1 }, set: 'musico' }, fail: { t: 'Você atrapalhou o ritmo de todo mundo.', fx: { car: -1 } } },
        { t: 'Ficar no canto observando', out: { t: 'Você viu {rival} beijando alguém escondido atrás do celeiro.', fx: { int: 1 }, set: 'segredo_rival' } },
      ],
    },
    {
      id: 'roubo_mercado', st: ST,
      text: 'No mercado, você vê um batedor de carteiras roubando uma senhora idosa.',
      choices: [
        { t: 'Perseguir o ladrão', check: { s: 'agi', d: 5 }, ok: { t: 'Você o alcançou e devolveu a bolsa. A senhora era tia do prefeito!', fx: { car: 1, gold: 10 } }, fail: { t: 'Ele escapou pelos telhados.', fx: { agi: 1 } } },
        { t: 'Gritar "pega ladrão"', out: { t: 'A multidão o pegou. Você ganhou um abraço da senhora.', fx: { car: 1 } } },
        { t: 'Seguir o ladrão até o esconderijo', check: { s: 'agi', d: 4 }, ok: { t: 'Você descobriu a entrada da Guilda das Sombras.', set: 'sabe_guilda', fx: { int: 1 } }, fail: { t: 'Ele te viu. Agora a Guilda sabe quem você é.', set: 'marcado_guilda' } },
      ],
    },
    {
      id: 'aposta_dados', st: ['jov', 'adu'], once: false, cd: 15,
      text: 'Num beco, um sujeito de dente de ouro chacoalha dados: "Dobro ou nada, amigo?"',
      choices: [
        { t: 'Apostar 10', req: (s) => s.gold >= 10, check: { s: 'sor', d: 5 }, ok: { t: 'Dois seis! Você dobrou.', fx: { gold: 10 } }, fail: { t: 'Os dados eram viciados, você tem certeza.', fx: { gold: -10 } } },
        { t: 'Apostar tudo', req: (s) => s.gold >= 20, check: { s: 'sor', d: 6 }, ok: { t: 'Você limpou o sujeito! Ele saiu jurando vingança.', fn: (s, c, chips) => { chips.push({ k: 'gold', t: '+' + s.gold + ' ouro' }); s.gold *= 2; } }, fail: { t: 'Você ficou sem um tostão.', fn: (s, c, chips) => { chips.push({ k: 'bad', t: '-' + s.gold + ' ouro' }); s.gold = 0; } } },
        { t: 'Desmascarar os dados viciados', check: { s: 'int', d: 5 }, ok: { t: 'Você provou a trapaça. O povo devolveu o dinheiro de todos e te deu uma parte.', fx: { gold: 15, car: 1 } }, fail: { t: 'Os dados eram honestos. Você levou um soco.', fx: { hp: -2 } } },
        { t: 'Ir embora', out: { t: 'A sabedoria às vezes é só não jogar.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'caverna_eco', st: ST,
      text: 'Perto de {cidade} há uma caverna onde, dizem, o eco responde perguntas.',
      choices: [
        { t: 'Perguntar sobre o futuro', out: [{ t: 'O eco respondeu: "...ouro...ouro...". Você sorriu.', fx: { sor: 1 } }, { t: 'O eco respondeu com a voz de {mae}: "volte pra casa". Você correu.', fx: { agi: 1 } }, { t: 'O eco ficou em silêncio. Isso foi pior que qualquer resposta.', fx: { int: 1 }, set: 'eco_silencio' }] },
        { t: 'Explorar mais fundo', check: { s: 'agi', d: 5 }, ok: { t: 'No fundo, uma câmara com cristais que cantavam. Você levou um.', item: { n: 'cristal cantante', s: 'int', b: 1, tag: 'cristal' } }, fail: { t: 'Você se perdeu por dois dias no escuro.', fx: { hp: -3 }, cause: 'perdido numa caverna' } },
        { t: 'Gritar um palavrão', out: { t: 'O eco gritou de volta algo bem pior. Você riu até doer a barriga.', fx: { car: 1 } } },
      ],
    },
    {
      id: 'amigo_divida', st: ST, req: (s) => s.f.amigo,
      text: '{amigo} aparece desesperado: deve dinheiro para gente perigosa e precisa de 20 moedas até amanhã.',
      choices: [
        { t: 'Emprestar o dinheiro', req: (s) => s.gold >= 20, out: [{ t: '{amigo} jurou pagar de volta. E pagou, anos depois, com juros.', fx: { gold: -20, car: 1 }, set: 'amigo_deve', chain: ['amigo_paga', 8, 15] }, { t: '{amigo} chorou de gratidão.', fx: { gold: -20, car: 1 }, set: 'amigo_leal' }] },
        { t: 'Ir junto falar com os credores', check: { s: 'for', d: 5 }, ok: { t: 'Vocês intimidaram os credores e conseguiram mais prazo.', fx: { for: 1 }, set: 'amigo_leal' }, fail: { t: 'Vocês apanharam juntos. Pelo menos foram juntos.', fx: { hp: -3 }, set: 'amigo_leal' } },
        { t: 'Recusar', out: { t: '{amigo} sumiu de {cidade} no dia seguinte. Você nunca soube o que aconteceu.', unset: 'amigo', set: 'amigo_sumiu', fx: { int: 1 } } },
      ],
    },
    {
      id: 'amigo_paga', chainOnly: true, req: (s) => s.f.amigo_deve,
      text: 'Uma carta chega para você. É de {amigo}, que agora mora em {vila}.',
      choices: [{ t: 'Abrir a carta', out: { t: 'Dentro, uma bolsa de moedas e um bilhete: "Nunca esqueci. Obrigado."', fx: { gold: [40, 70], car: 1 }, unset: 'amigo_deve' } }],
    },
    {
      id: 'cao_salva', st: ['jov', 'adu'], req: (s) => s.f.cao && !s.f.cao_morto,
      text: 'Você está atravessando um bosque quando {criatura} salta das sombras!',
      choices: [{ t: 'Gritar', out: { t: '{cao}, já velho, se jogou na frente da fera e lutou até ela fugir. Ele não levantou mais. Você o enterrou sob um carvalho.', set: 'cao_morto', fx: { car: 1, for: 1 }, title: 'Amigo de {cao}' } }],
    },
    {
      id: 'carta_misteriosa', st: ['jov', 'adu'],
      text: 'Uma carta sem remetente chega para você. O lacre tem um símbolo que você não reconhece.',
      choices: [
        { t: 'Abrir', out: [{ t: '"Você é o herdeiro legítimo de uma casa esquecida." Junto, um anel de sinete.', item: { n: 'anel de sinete misterioso', s: 'car', b: 1, tag: 'anel' }, set: 'herdeiro' }, { t: 'Um mapa rabiscado com um X perto de {vila}.', set: 'mapa_x' }, { t: '"Pare de procurar." Você nem sabia que estava procurando algo.', fx: { int: 1 }, set: 'carta_ameaca' }] },
        { t: 'Queimar sem ler', out: { t: 'A fumaça formou um rosto por um instante.', fx: { sor: -1, int: 1 } } },
        { t: 'Mostrar ao sacerdote de {deus}', out: { t: 'O sacerdote empalideceu e te pediu para nunca mais falar disso.', fx: { int: 1 }, set: 'segredo_divino' } },
      ],
    },
    {
      id: 'feiticeira_floresta', st: ['jov', 'adu'],
      text: 'Na beira da floresta, uma cabana torta solta fumaça verde. Uma mulher de olhos amarelos te chama pelo nome.',
      choices: [
        { t: 'Entrar e tomar o chá oferecido', out: [{ t: 'O chá te deu visões de lugares distantes.', fx: { int: 2 } }, { t: 'O chá tinha gosto de meia. Mas você nunca mais ficou resfriado.', fx: { maxHp: 2 } }, { t: 'Você dormiu três dias. Quando acordou, ela tinha sumido — e suas moedas também.', fx: { gold: -15, sor: 1 } }] },
        { t: 'Pedir que leia sua sorte', out: { t: '"Cuidado com quem te chama de amigo em {vila}."', set: 'aviso_feiticeira', fx: { int: 1 } } },
        { t: 'Pedir para ser aprendiz', check: { s: 'int', d: 5 }, ok: { t: 'Ela aceitou. Um verão inteiro aprendendo ervas e maldições.', fx: { int: 1 }, set: ['sabe_ervas', 'centelha_magica'] }, fail: { t: '"Você não está pronto." A porta bateu sozinha.', fx: { car: -1 } } },
        { t: 'Fugir', out: { t: 'Você ouviu uma risada atrás de você o caminho inteiro.', fx: { agi: 1 } } },
      ],
    },
    {
      id: 'recrutador', st: ST, minAge: 16, req: (s) => s.job !== 'soldado',
      text: 'Um recrutador do exército bate na mesa da taverna: "Ouro, glória e três refeições por dia! Quem se alista?"',
      choices: [
        { t: 'Alistar-se', out: { t: 'Você trocou sua vida antiga por um uniforme.', job: 'soldado', fx: { for: 1 } } },
        { t: 'Perguntar sobre a guerra', check: { s: 'int', d: 4 }, ok: { t: 'Você descobriu que a "guerra" era uma briga de dois nobres por um rio. Não foi.', fx: { int: 1 } }, fail: { t: 'Ele te enrolou com histórias de heróis.', fx: {} } },
        { t: 'Esconder-se embaixo da mesa', out: { t: 'Ele fingiu não ver. Piscou ao sair.', fx: { agi: 1 } } },
      ],
    },
    {
      id: 'travessia_barco', st: ['jov', 'adu'],
      text: 'Para chegar a {vila}, você embarca numa balsa velha. No meio do rio, ela começa a afundar.',
      choices: [
        { t: 'Nadar até a margem', check: { s: 'agi', d: 4 }, ok: { t: 'Você chegou ensopado, mas vivo.', fx: { agi: 1 } }, fail: { t: 'A correnteza te levou longe. Você perdeu algo valioso.', fx: { hp: -3 }, lose: 'any', cause: 'afogamento' } },
        { t: 'Ajudar uma criança a se salvar', check: { s: 'for', d: 5 }, ok: { t: 'Você salvou a criança. Os pais dela te deram tudo que tinham.', fx: { gold: 20, car: 1 }, trait: 'gentil' }, fail: { t: 'Vocês dois quase se afogaram. Um pescador salvou os dois.', fx: { hp: -3 } } },
        { t: 'Tapar o buraco', check: { s: 'int', d: 5 }, ok: { t: 'Com sua capa e um balde, você salvou a balsa!', fx: { int: 1, car: 1 } }, fail: { t: 'Não funcionou. Todo mundo nadou.', fx: { hp: -1 } } },
      ],
    },
    {
      id: 'peste_vila', st: ['jov', 'adu'], w: 5,
      text: 'Uma peste chega a {lugar}. Corpos são queimados na praça e as portas se fecham.',
      choices: [
        { t: 'Cuidar dos doentes', check: { s: 'sor', d: 5 }, ok: { t: 'Você salvou muitas vidas e não pegou a doença.', fx: { car: 2 }, title: 'Mão Que Cura' }, fail: { t: 'Você pegou a peste. Sobreviveu por pouco.', fx: { hp: -5, maxHp: -1 }, cause: 'a peste' } },
        { t: 'Fugir para longe', out: { t: 'Você deixou tudo para trás.', travel: true, fx: { sor: 1, car: -1 } } },
        { t: 'Trancar-se em casa', check: { s: 'sor', d: 3 }, ok: { t: 'A peste passou pela sua porta sem bater.', fx: { int: 1 } }, fail: { t: 'A peste entrou pela janela.', fx: { hp: -4 }, cause: 'a peste' } },
        { t: 'Buscar a cura com as ervas', req: (s) => s.f.sabe_ervas, check: { s: 'int', d: 5 }, ok: { t: 'Seu chá de ervas funcionou! A vila te chama de milagreiro.', fx: { car: 2, gold: 30 }, title: 'Erveiro da Peste' }, fail: { t: 'As ervas aliviaram, mas não curaram.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'irmao_encrenca', st: ['jov', 'adu'], req: (s) => s.f.irmao,
      text: 'Seu irmão, {irmao}, se meteu em encrenca: foi preso por {crime}.',
      ctx: (s, c) => { c.crime = R.pick(['roubar galinhas do prefeito', 'brigar com um guarda', 'cantar músicas ofensivas sobre o rei', 'dever dinheiro a um agiota', 'ser confundido com um ladrão famoso']); },
      choices: [
        { t: 'Pagar a fiança (20 ouro)', req: (s) => s.gold >= 20, out: { t: '{irmao} saiu, prometendo nunca mais aprontar. Mentira, claro.', fx: { gold: -20, car: 1 } } },
        { t: 'Tirar da cadeia à noite', check: { s: 'agi', d: 6 }, ok: { t: 'Uma fuga digna de canção!', fx: { agi: 1 }, set: 'procurado' }, fail: { t: 'Agora são dois irmãos presos.', fx: { gold: -15, car: -1 } } },
        { t: 'Convencer o juiz', check: { s: 'car', d: 5 }, ok: { t: 'O juiz soltou {irmao} com uma advertência.', fx: { car: 1 } }, fail: { t: '{irmao} pegou um mês de trabalhos forçados.', fx: {} } },
        { t: 'Deixar aprender a lição', out: { t: '{irmao} nunca te perdoou completamente.', set: 'irmao_magoado', fx: { int: 1 } } },
      ],
    },
    {
      id: 'acidente_cicatriz', st: ST,
      text: ['Você estava {atividade} quando tudo deu errado.'],
      ctx: (s, c) => { c.atividade = R.pick(['cortando lenha', 'domando um cavalo', 'escalando um muro', 'ajudando no telhado', 'brincando com uma faca']); },
      choices: [
        { t: 'Tentar se segurar', check: { s: 'agi', d: 4 }, ok: { t: 'Por um triz! Só um arranhão.', fx: { agi: 1 } }, fail: { t: 'Você ganhou uma cicatriz que contaria como história de batalha.', fx: { hp: -2 }, trait: 'cicatriz' } },
        { t: 'Aguentar a dor calado', out: { t: 'Doeu. Muito. Mas você ficou mais forte.', fx: { hp: -1, for: 1 } } },
      ],
    },
    {
      id: 'compor_cancao', st: ['jov', 'adu'],
      text: 'Uma melodia não sai da sua cabeça. Talvez seja hora de escrever uma canção.',
      choices: [
        { t: 'Uma canção de amor', check: { s: 'car', d: 4 }, ok: { t: 'A canção se espalhou pelas tavernas de {lugar}!', fx: { car: 1, gold: 10 }, set: 'cancao_famosa' }, fail: { t: 'Ficou meio brega. Sua mãe gostou.', fx: { car: 1 } } },
        { t: 'Uma canção satírica sobre o rei', check: { s: 'int', d: 5 }, ok: { t: 'O povo adorou. A guarda, não.', fx: { car: 2 }, set: 'procurado' }, fail: { t: 'Você foi preso por uma noite.', fx: { gold: -10 } } },
        { t: 'Desistir', out: { t: 'A melodia ficou te assombrando por anos.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'peregrino_cego', st: ['jov', 'adu', 'vel'],
      text: 'Um peregrino cego pede que você o guie até o santuário de {deus}, a dois dias de viagem.',
      choices: [
        { t: 'Guiá-lo', out: [{ t: 'No santuário, ele tocou seu rosto: "Você terá o que mais deseja". E desapareceu.', fx: { sor: 2 }, set: 'abencoado' }, { t: 'A viagem foi longa e o peregrino falou o tempo todo. Você aprendeu muito.', fx: { int: 1, hp: -1 } }] },
        { t: 'Indicar o caminho', out: { t: 'Ele agradeceu e seguiu sozinho, tateando.', fx: {} } },
        { t: 'Perguntar se ele é mesmo cego', check: { s: 'int', d: 5 }, ok: { t: 'Ele riu e tirou a venda: era um ladrão disfarçado. Te ofereceu sociedade.', set: 'contato_ladrao', fx: { int: 1 } }, fail: { t: 'Ele era cego, e você foi grosseiro.', fx: { car: -1, sor: -1 } } },
      ],
    },
    {
      id: 'cavalo_selvagem', st: ['jov', 'adu'],
      text: 'Um cavalo selvagem negro com uma mancha branca na testa aparece perto do riacho.',
      choices: [
        { t: 'Tentar montá-lo', check: { s: 'agi', d: 6 }, ok: { t: 'Depois de dez quedas, ele aceitou você. Você o chamou de {npc}.', set: 'cavalo', ppl: { cavalo: '{npc}' }, fx: { agi: 1 }, title: 'Domador de {npc}' }, fail: { t: 'Ele te jogou num arbusto de espinhos.', fx: { hp: -2 } } },
        { t: 'Oferecer uma maçã', check: { s: 'car', d: 5 }, ok: { t: 'Ele comeu da sua mão e passou a te seguir.', set: 'cavalo', ppl: { cavalo: '{npc}' } }, fail: { t: 'Ele comeu a maçã e foi embora.', fx: {} } },
        { t: 'Só admirar', out: { t: 'Você nunca esqueceu aquela imagem.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'espelho_feira', st: ['jov', 'adu'],
      text: 'Numa feira em {vila}, uma tenda vende "espelhos que mostram quem você será".',
      choices: [
        { t: 'Olhar (2 ouro)', req: (s) => s.gold >= 2, out: [{ t: 'Você se viu velho, rico e sozinho.', fx: { gold: -2, int: 1 } }, { t: 'Você se viu com uma coroa na cabeça. O feirante parou de sorrir.', fx: { gold: -2, sor: 1 }, set: 'visao_coroa' }, { t: 'Você não viu nada. O feirante ficou pálido e devolveu o dinheiro.', fx: { sor: -1 } }] },
        { t: 'Quebrar o espelho', out: { t: 'Sete anos de azar? Você ri do destino.', fx: { sor: -2, for: 1 } } },
        { t: 'Desmascarar o truque', check: { s: 'int', d: 4 }, ok: { t: 'Eram pinturas atrás de vidro. O feirante te pagou pra ficar quieto.', fx: { gold: 8 } }, fail: { t: 'Não era truque. Você não quer falar sobre isso.', fx: { int: 1 } } },
      ],
    },
  ]);
})();
