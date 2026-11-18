/* Eventos da infância (0–12 anos). */
(function () {
  'use strict';
  const G = globalThis.G;
  const ST = 'inf';

  G.add([
    {
      id: 'primeiros_passos', st: ST, maxAge: 3,
      text: ['Chegou a hora dos primeiros passos. {mae} estende os braços do outro lado da sala.', 'Você se agarra na perna da mesa, decidido a ficar de pé.'],
      choices: [
        { t: 'Andar até {mae}', check: { s: 'agi', d: 2 }, ok: { t: 'Três passos tortos e um abraço. A família comemorou como se fosse festa.', fx: { agi: 1 } }, fail: { t: 'Você caiu de cara no chão, mas levantou rindo.', fx: { for: 1 } } },
        { t: 'Engatinhar mesmo, é mais rápido', out: { t: 'Você engatinhou tão rápido que ninguém conseguiu te pegar por meses.', fx: { agi: 1 } } },
        { t: 'Sentar e esperar que te carreguem', out: { t: 'Funcionou. Você descobriu cedo o poder de um olhar pidão.', fx: { car: 1 } } },
      ],
    },
    {
      id: 'primeira_palavra', st: ST, maxAge: 4,
      text: 'Todos esperam sua primeira palavra. A família faz apostas.',
      choices: [
        { t: '"Mamãe"', out: { t: '{mae} chorou de emoção.', fx: { car: 1 } } },
        { t: '"Ouro"', out: { t: 'Um silêncio constrangido. Depois, gargalhadas. Seu apelido virou "Moedinha".', fx: { gold: 2, sor: 1 } } },
        { t: 'Um palavrão que ouviu do vizinho', out: { t: 'O vizinho nunca mais foi convidado para jantar.', fx: { car: -1, for: 1 } } },
        { t: 'O nome de {deus}', out: { t: 'Os mais velhos acharam um sinal divino.', fx: { sor: 1 }, set: 'abencoado' } },
      ],
    },
    {
      id: 'cao_vira_lata', st: ST,
      text: 'Um cão vira-lata, magro e de orelha rasgada, começa a seguir você pelas ruas de {cidade}.',
      choices: [
        { t: 'Dividir seu pão com ele', out: [{ t: 'Ele nunca mais saiu do seu lado. Você o chamou de {npc}.', set: 'cao', ppl: { cao: '{npc}' } }] },
        { t: 'Espantá-lo com uma pedra', out: { t: 'Ele foi embora mancando. Algo em você ficou mais duro.', fx: { for: 1, car: -1 } } },
        { t: 'Levar para casa escondido', check: { s: 'agi', d: 3 }, ok: { t: 'Ninguém percebeu por uma semana. Quando perceberam, já era tarde: ele era da família. Você o chamou de {npc}.', set: 'cao', ppl: { cao: '{npc}' }, fx: { agi: 1 } }, fail: { t: 'Você foi pego e levou um sermão. O cão foi solto na estrada.', fx: { car: -1 } } },
      ],
    },
    {
      id: 'febre', st: ST,
      text: ['Uma febre forte toma conta de você. A curandeira franze a testa.', 'Você acorda tremendo, com o corpo em chamas. A doença do inverno chegou à vila.'],
      choices: [
        { t: 'Tomar o chá amargo da curandeira', check: { s: 'sor', d: 3 }, ok: { t: 'A febre passou em três dias.', fx: { maxHp: 1 } }, fail: { t: 'Foi um mês de cama. Você ficou mais fraco, mas sobreviveu.', fx: { maxHp: -1, int: 1 } } },
        { t: 'Rezar para {deus}', check: { s: 'sor', d: 4 }, ok: { t: 'Você sonhou com uma luz morna. Acordou curado.', fx: { sor: 1 }, set: 'abencoado' }, fail: { t: 'Os deuses estavam ocupados. A febre demorou a ir embora.', fx: { hp: -2 } } },
        { t: 'Aguentar firme', check: { s: 'for', d: 3 }, ok: { t: 'Seu corpo venceu a doença sozinho.', fx: { for: 1, maxHp: 1 } }, fail: { t: 'A febre deixou marcas. Você ficou magrinho por anos.', fx: { for: -1 } } },
      ],
    },
    {
      id: 'amigo_infancia', st: ST, minAge: 3,
      text: 'Uma criança da sua idade, {amigo}, aparece com um sapo em cada mão e pergunta se você quer ver qual pula mais longe.',
      choices: [
        { t: 'Apostar no sapo da esquerda', out: [{ t: 'Seu sapo ganhou! Vocês viraram melhores amigos na hora.', set: 'amigo', fx: { sor: 1 } }, { t: 'Seu sapo perdeu feio, mas vocês riram tanto que viraram melhores amigos.', set: 'amigo', fx: { car: 1 } }] },
        { t: 'Soltar os sapos no rio', out: { t: '{amigo} ficou furioso por uma semana e depois esqueceu. Vocês viraram amigos.', set: 'amigo', fx: { car: -1, sor: 1 } } },
        { t: 'Ignorar e voltar pra casa', out: { t: '{amigo} ficou olhando você ir embora.', set: 'sem_amigo' } },
      ],
    },
    {
      id: 'rio_proibido', st: ST, minAge: 5,
      text: 'As crianças da vila vão nadar no rio que os adultos chamam de "proibido". Dizem que algo mora no fundo.',
      choices: [
        { t: 'Mergulhar até o fundo', check: { s: 'agi', d: 4 }, ok: [{ t: 'No fundo você achou uma moeda antiga com um rosto desconhecido.', item: { n: 'moeda de rosto esquecido', s: 'sor', b: 1, tag: 'moeda' } }, { t: 'Você tocou o fundo e voltou. As outras crianças passaram a te respeitar.', fx: { car: 1, agi: 1 } }], fail: { t: 'Algo agarrou seu tornozelo. Você subiu engasgado e nunca soube o que era.', fx: { hp: -2 }, set: 'medo_rio' } },
        { t: 'Ficar na margem vigiando', out: { t: 'Você viu algo grande se mexer sob a água. Ninguém acreditou em você.', fx: { int: 1 }, set: 'viu_criatura_rio' } },
        { t: 'Contar para os adultos', out: { t: 'As crianças foram pegas e te chamaram de dedo-duro por um ano.', fx: { car: -1, sor: 1 } } },
      ],
    },
    {
      id: 'contador_historias', st: ST,
      text: 'Um velho de barba amarela senta na praça de {cidade} e conta histórias em troca de pão. Hoje ele fala de {criatura}.',
      choices: [
        { t: 'Ouvir até o fim', out: [{ t: 'Você decorou cada palavra. Anos depois, isso ainda ecoaria na sua cabeça.', fx: { int: 1 }, set: 'ouviu_lendas' }, { t: 'O velho piscou para você e disse: "Você vai ver isso de perto um dia".', fx: { sor: 1 }, set: 'profecia_velho' }] },
        { t: 'Perguntar se é verdade', out: { t: '"Tudo é verdade, se você for longe o bastante", respondeu ele.', fx: { int: 1, car: 1 } } },
        { t: 'Roubar o pão dele', check: { s: 'agi', d: 3 }, ok: { t: 'Você fugiu com o pão. Estava duro e sem graça.', fx: { agi: 1, car: -1 } }, fail: { t: 'O velho te pegou pela orelha com uma força assustadora.', fx: { hp: -1 } } },
      ],
    },
    {
      id: 'valentao', st: ST, minAge: 5,
      text: 'Uma criança maior, {rival}, rouba seu brinquedo e te empurra na lama na frente de todo mundo.',
      choices: [
        { t: 'Partir pra briga', check: { s: 'for', d: 4 }, ok: { t: 'Você venceu. {rival} nunca esqueceu essa humilhação.', fx: { for: 1 }, set: 'rival' }, fail: { t: 'Você apanhou feio. {rival} riu de você por anos.', fx: { hp: -2 }, set: 'rival' } },
        { t: 'Responder com uma piada', check: { s: 'car', d: 4 }, ok: { t: 'Todo mundo riu de {rival}, não de você.', fx: { car: 1 }, set: 'rival' }, fail: { t: 'A piada não saiu. Você ficou vermelho e foi embora.', fx: { car: -1 } } },
        { t: 'Planejar uma vingança', out: { t: 'Uma semana depois, as botas de {rival} amanheceram cheias de minhocas.', fx: { int: 1 }, set: 'rival' } },
        { t: 'Deixar pra lá', out: { t: 'Você engoliu o choro. Algo em você aprendeu a ter paciência.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'arvore_alta', st: ST, minAge: 4,
      text: 'Existe uma árvore enorme no limite de {cidade}. Dizem que do topo dá pra ver {lugar} inteiro.',
      choices: [
        { t: 'Subir até o topo', check: { s: 'agi', d: 4 }, ok: { t: 'A vista era tão bonita que você decidiu que um dia veria o mundo inteiro.', fx: { agi: 1 }, set: 'sonha_viajar' }, fail: { t: 'Um galho quebrou. Você caiu e quebrou o braço.', fx: { hp: -3, for: -1 } } },
        { t: 'Subir até a metade', out: { t: 'Você achou um ninho com um ovo azul brilhante.', fx: { sor: 1 } } },
        { t: 'Desenhar a árvore', out: { t: 'O desenho ficou tão bom que {mae} o pendurou na parede.', fx: { int: 1, car: 1 } } },
      ],
    },
    {
      id: 'festa_colheita', st: ST, minAge: 4,
      text: 'É a festa da colheita em {cidade}! Há corridas de saco, torta de abóbora e um porco ensebado para pegar.',
      choices: [
        { t: 'Corrida de saco', check: { s: 'agi', d: 3 }, ok: { t: 'Você ganhou uma fita azul e um doce.', fx: { agi: 1 }, title: 'Campeão da Corrida de Saco' }, fail: { t: 'Você caiu na primeira curva.', fx: { car: 1 } } },
        { t: 'Pegar o porco ensebado', check: { s: 'for', d: 4 }, ok: { t: 'Você agarrou o porco! A vila inteira aplaudiu.', fx: { for: 1, car: 1 } }, fail: { t: 'O porco te arrastou pela lama.', fx: { hp: -1 } } },
        { t: 'Comer torta até passar mal', out: { t: 'Valeu cada pedaço.', fx: { hp: -1, sor: 1 } } },
        { t: 'Dançar com {amigo}', req: (s) => s.f.amigo, out: { t: 'Vocês dançaram até os pés doerem.', fx: { car: 1 } } },
      ],
    },
    {
      id: 'moeda_poco', st: ST,
      text: 'Você vê o brilho de uma moeda de ouro no fundo do poço da praça.',
      choices: [
        { t: 'Descer pela corda', check: { s: 'agi', d: 4 }, ok: { t: 'Uma moeda de ouro! Você se sentiu rico por uma semana.', fx: { gold: 10 } }, fail: { t: 'A corda escorregou. Você passou a tarde no fundo do poço gritando.', fx: { hp: -1, car: -1 } } },
        { t: 'Deixar lá — é um desejo de alguém', out: { t: 'Naquela noite você sonhou que alguém agradecia.', fx: { sor: 1 } } },
        { t: 'Jogar sua própria moeda e fazer um desejo', req: (s) => s.gold > 0, out: { t: 'Você desejou... bem, isso é segredo.', fx: { gold: -1, sor: 2 } } },
      ],
    },
    {
      id: 'forja_familia', st: ST, minAge: 6, req: (s) => s.f.o_ferreiro,
      text: '{pai} te chama à forja: "Hoje você segura o martelo".',
      choices: [
        { t: 'Bater com toda força', check: { s: 'for', d: 3 }, ok: { t: 'O ferro cantou. {pai} sorriu de orelha a orelha.', fx: { for: 1 }, set: 'sabe_forjar' }, fail: { t: 'O martelo escapou e amassou o seu pé.', fx: { hp: -2 } } },
        { t: 'Prestar atenção na técnica', out: { t: 'Você entendeu que forjar é mais paciência do que força.', fx: { int: 1 }, set: 'sabe_forjar' } },
        { t: 'Dizer que prefere outra coisa', out: { t: '{pai} ficou calado o jantar inteiro.', fx: { car: -1, int: 1 } } },
      ],
    },
    {
      id: 'tutor_nobre', st: ST, minAge: 6, req: (s) => s.f.o_nobre,
      text: 'Sua família contrata um tutor severo, Mestre {npc}, para ensinar etiqueta, história e esgrima.',
      choices: [
        { t: 'Dedicar-se à esgrima', check: { s: 'agi', d: 3 }, ok: { t: 'Você tem talento com a lâmina.', fx: { agi: 1, for: 1 } }, fail: { t: 'Você só aprendeu a se machucar com elegância.', fx: { hp: -1, car: 1 } } },
        { t: 'Mergulhar nos livros', out: { t: 'Você leu a biblioteca inteira da família — que eram só onze livros.', fx: { int: 2 } } },
        { t: 'Fugir das aulas', check: { s: 'agi', d: 3 }, ok: { t: 'Você conheceu cada rua de {cidade} enquanto o tutor te procurava.', fx: { agi: 1, sor: 1 } }, fail: { t: 'Você foi pego e ficou sem sobremesa por um mês.', fx: { car: -1 } } },
      ],
    },
    {
      id: 'gangue_rua', st: ST, minAge: 6, req: (s) => s.f.o_orfao,
      text: 'Uma gangue de crianças de rua, os Ratos de {cidade}, oferece proteção — em troca de você roubar para eles.',
      choices: [
        { t: 'Entrar para os Ratos', out: { t: 'Você ganhou irmãos de sangue e aprendeu a abrir bolsos.', fx: { agi: 1 }, set: 'ratos', trait: 'maoleve' } },
        { t: 'Recusar e sobreviver sozinho', check: { s: 'for', d: 3 }, ok: { t: 'Você aprendeu a se virar. Ninguém mexia com você.', fx: { for: 1 } }, fail: { t: 'Os Ratos te deram uma surra de lição.', fx: { hp: -3 } } },
        { t: 'Pedir abrigo no templo de {deus}', out: { t: 'As sacerdotisas te deram uma cama e trabalho na cozinha.', fx: { int: 1 }, set: 'abrigo_templo' } },
      ],
    },
    {
      id: 'barco_pai', st: ST, minAge: 6, req: (s) => s.f.o_pescador,
      text: '{pai} te leva pela primeira vez no barco de pesca. O mar está agitado.',
      choices: [
        { t: 'Puxar a rede', check: { s: 'for', d: 3 }, ok: { t: 'A rede veio cheia! Até um peixe dourado veio junto.', fx: { for: 1, gold: 5 } }, fail: { t: 'Você caiu na água. {pai} te puxou pelo cabelo.', fx: { hp: -1, agi: 1 } } },
        { t: 'Observar as nuvens', out: { t: 'Você aprendeu a prever tempestades pelo cheiro do vento.', fx: { int: 1 }, set: 'le_clima' } },
        { t: 'Enjoar e vomitar', out: { t: 'Os pescadores riram, mas te deram gengibre e um tapinha nas costas.', fx: { car: 1 } } },
      ],
    },
    {
      id: 'ritual_druida', st: ST, minAge: 7, req: (s) => s.f.o_druida,
      text: 'Os druidas te levam ao círculo de pedras para seu primeiro ritual. Você deve passar a noite sozinho na floresta.',
      choices: [
        { t: 'Conversar com os animais', check: { s: 'car', d: 3 }, ok: { t: 'Uma coruja ficou ao seu lado a noite inteira.', fx: { car: 1, sor: 1 }, set: 'fala_animais' }, fail: { t: 'Os animais te ignoraram com desprezo.', fx: { int: 1 } } },
        { t: 'Meditar até o amanhecer', out: { t: 'Você ouviu as árvores sussurrarem seu nome.', fx: { int: 2 } } },
        { t: 'Fugir de volta ao acampamento', out: { t: 'Os druidas não disseram nada. O silêncio deles doeu mais que bronca.', fx: { agi: 1, car: -1 } } },
      ],
    },
    {
      id: 'palco_trupe', st: ST, minAge: 5, req: (s) => s.f.o_artistas,
      text: 'O ator principal da trupe ficou rouco. Alguém precisa substituí-lo na peça de hoje em {vila}.',
      choices: [
        { t: 'Subir ao palco', check: { s: 'car', d: 3 }, ok: { t: 'Você roubou a cena. A plateia jogou flores — e moedas.', fx: { car: 1, gold: 5 }, set: 'ator' }, fail: { t: 'Você esqueceu as falas e improvisou uma dança de galinha. Riram, pelo menos.', fx: { car: 1 } } },
        { t: 'Cuidar dos efeitos especiais', out: { t: 'Você fez o trovão com uma folha de metal. Ficou perfeito.', fx: { int: 1 } } },
        { t: 'Fazer malabarismo no intervalo', check: { s: 'agi', d: 3 }, ok: { t: 'Três bolas, quatro, cinco! A plateia vibrou.', fx: { agi: 1 } }, fail: { t: 'Uma bola acertou o prefeito.', fx: { car: -1, sor: 1 } } },
      ],
    },
    {
      id: 'coro_templo', st: ST, minAge: 5, req: (s) => s.f.o_templo,
      text: 'A sacerdotisa-mor quer que você cante no coro do templo de {deus} durante a festa sagrada.',
      choices: [
        { t: 'Cantar com o coração', check: { s: 'car', d: 3 }, ok: { t: 'Sua voz encheu o templo. Até a sacerdotisa chorou.', fx: { car: 1 }, set: 'abencoado' }, fail: { t: 'Você desafinou bem na nota mais alta.', fx: { sor: 1 } } },
        { t: 'Explorar as catacumbas durante a festa', check: { s: 'agi', d: 3 }, ok: { t: 'Lá embaixo, você achou um livro de orações proibidas.', item: { n: 'livro de orações proibidas', s: 'int', b: 1, tag: 'livro' }, set: 'oracoes_proibidas' }, fail: { t: 'Você se perdeu e só foi achado no dia seguinte.', fx: { hp: -1 } } },
        { t: 'Ajudar na cozinha da festa', out: { t: 'Você comeu mais do que ajudou, mas fez amizade com todos.', fx: { car: 1, hp: 1 } } },
      ],
    },
    {
      id: 'primeira_cacada', st: ST, minAge: 7, req: (s) => s.f.o_cacadores,
      text: 'Seu clã te leva para sua primeira caçada. Um cervo branco aparece entre as árvores.',
      choices: [
        { t: 'Atirar a flecha', check: { s: 'agi', d: 4 }, ok: { t: 'Acertou! Mas o cervo virou névoa. Os anciãos ficaram pálidos.', fx: { agi: 1 }, set: 'cervo_branco' }, fail: { t: 'Errou. O cervo te olhou nos olhos antes de sumir.', fx: { sor: 1 } } },
        { t: 'Baixar o arco', out: { t: 'O cervo abaixou a cabeça para você, como numa reverência.', fx: { sor: 2 }, set: 'abencoado' } },
        { t: 'Gritar para os outros', out: { t: 'O cervo fugiu e os caçadores te olharam com desprezo.', fx: { car: -1, int: 1 } } },
      ],
    },
    {
      id: 'contas_mercador', st: ST, minAge: 6, req: (s) => s.f.o_mercador,
      text: '{pai} pede que você cuide da banca de especiarias enquanto ele negocia com um comprador de {vila}.',
      choices: [
        { t: 'Vender com lábia', check: { s: 'car', d: 3 }, ok: { t: 'Você vendeu canela pelo dobro do preço.', fx: { car: 1, gold: 8 } }, fail: { t: 'Você deu troco a mais para todo mundo.', fx: { gold: -3 } } },
        { t: 'Conferir as contas do pai', out: [{ t: 'Você achou um erro que ia custar caro. {pai} ficou orgulhoso.', fx: { int: 2 } }, { t: 'As contas estavam perfeitas. Você aprendeu a fazê-las também.', fx: { int: 1 } }] },
        { t: 'Provar as especiarias', out: { t: 'Pimenta do deserto. Você chorou por uma hora.', fx: { hp: -1, for: 1 } } },
      ],
    },
    {
      id: 'irmao_nasce', st: ST, minAge: 2, maxAge: 9, w: 6, req: (s) => !s.f.o_orfao && !s.f.o_templo,
      text: 'A família ganhou um novo membro: um bebê chamado {irmao}. Agora você não é mais o centro das atenções.',
      choices: [
        { t: 'Cuidar do bebê', out: { t: '{irmao} só para de chorar no seu colo.', fx: { car: 1 }, set: 'irmao' } },
        { t: 'Ficar com ciúmes', out: { t: 'Você escondeu as fraldas. Depois ficou com remorso.', fx: { int: 1 }, set: ['irmao', 'ciume_irmao'] } },
        { t: 'Ensinar coisas a ele quando crescer', out: { t: 'Você jurou que {irmao} seria a pessoa mais esperta do mundo.', fx: { int: 1 }, set: 'irmao' } },
      ],
    },
    {
      id: 'lobos_noite', st: ST, minAge: 6,
      text: 'Lobos rondam {cidade} à noite. Você ouve as ovelhas gritando no curral.',
      choices: [
        { t: 'Pegar uma tocha e ir lá', check: { s: 'for', d: 5 }, ok: { t: 'Os lobos fugiram do fogo. Você virou o herói da semana.', fx: { for: 1, car: 1 }, trait: 'corajoso' }, fail: { t: 'Um lobo te mordeu a perna. Você ficou com uma cicatriz.', fx: { hp: -3 }, trait: 'cicatriz' } },
        { t: 'Acordar os adultos', out: { t: 'Os adultos espantaram os lobos. Você salvou o rebanho.', fx: { car: 1 } } },
        { t: 'Esconder debaixo da coberta', out: { t: 'Você passou a noite tremendo. No dia seguinte faltavam três ovelhas.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'biblioteca_escondida', st: ST, minAge: 6,
      text: 'Brincando de esconde-esconde, você encontra uma porta atrás de uma estante velha. Lá dentro, pilhas de livros empoeirados.',
      choices: [
        { t: 'Ler o livro mais antigo', out: [{ t: 'Era um tratado de magia. Você não entendeu quase nada, mas algo despertou.', fx: { int: 2 }, set: 'centelha_magica' }, { t: 'Era um livro de receitas. Muito bem escrito, aliás.', fx: { int: 1 } }] },
        { t: 'Contar para {amigo}', req: (s) => s.f.amigo, out: { t: 'Vocês transformaram o lugar no quartel-general secreto.', fx: { car: 1, int: 1 }, set: 'qg_secreto' } },
        { t: 'Fechar a porta e esquecer', out: { t: 'Às vezes, você ainda sonha com aquela porta.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'sonho_deus', st: ST,
      text: 'Você sonha com uma figura feita de luz que diz ser {deus}. Ela pede que você escolha um presente.',
      choices: [
        { t: 'Força', out: { t: 'Você acordou com as mãos formigando.', fx: { for: 1 } } },
        { t: 'Sabedoria', out: { t: 'Você acordou lembrando de coisas que nunca aprendeu.', fx: { int: 1 } } },
        { t: 'Sorte', out: { t: 'Você acordou e achou uma moeda no travesseiro.', fx: { sor: 1, gold: 1 } } },
        { t: 'Perguntar o preço do presente', out: { t: 'A figura riu. "Esperto". Você acordou sem presente — mas com um sorriso.', fx: { int: 1, sor: 1 }, set: 'deus_simpatia' } },
      ],
    },
    {
      id: 'doces_roubados', st: ST, minAge: 4,
      text: 'A padaria de {npc} está com uma bandeja de bolinhos de mel esfriando na janela.',
      choices: [
        { t: 'Pegar um bolinho', check: { s: 'agi', d: 3 }, ok: { t: 'O melhor bolinho da sua vida. O sabor do crime.', fx: { agi: 1 } }, fail: { t: '{npc} te pegou e te fez trabalhar na padaria por uma semana.', fx: { for: 1, car: -1 } } },
        { t: 'Pedir educadamente', check: { s: 'car', d: 2 }, ok: { t: '{npc} te deu dois.', fx: { car: 1 } }, fail: { t: '"Só se pagar". Você não tinha dinheiro.', fx: {} } },
        { t: 'Oferecer ajuda em troca', out: { t: 'Você ganhou bolinhos por um mês e aprendeu a fazer pão.', fx: { for: 1 }, set: 'sabe_pao' } },
      ],
    },
    {
      id: 'pai_guerra', st: ST, minAge: 5, w: 6, req: (s) => !s.f.o_orfao && !s.f.o_templo,
      text: 'Arautos do {kingdom} chegam a {cidade}: todos os homens e mulheres aptos devem se alistar. {pai} é convocado.',
      ctx: (s, c) => { c.kingdom = s.world.kingdom; },
      choices: [
        { t: 'Implorar para ele não ir', out: { t: '{pai} te abraçou forte e foi mesmo assim.', fx: { car: 1 }, set: 'pai_guerra', chain: ['pai_volta', 4, 7] } },
        { t: 'Dar a ele seu amuleto da sorte', out: { t: '{pai} guardou o presente no peito.', fx: { sor: -1 }, set: ['pai_guerra', 'deu_amuleto'], chain: ['pai_volta', 4, 7] } },
        { t: 'Prometer cuidar da família', out: { t: 'Você cresceu um pouco naquele dia.', fx: { for: 1, int: 1 }, set: 'pai_guerra', chain: ['pai_volta', 4, 7] } },
      ],
    },
    {
      id: 'pai_volta', chainOnly: true, req: (s) => s.f.pai_guerra,
      text: 'Anos se passaram desde que {pai} partiu para a guerra. Hoje, um cavaleiro aparece na estrada.',
      choices: [
        { t: 'Correr até ele', out: [{ t: 'Era {pai}! Mais magro, cheio de cicatrizes, mas vivo.', req: (s) => !s.f.deu_amuleto, w: 6, fx: { car: 1 }, set: 'pai_vivo' }, { t: 'Era {pai}! Ele tirou seu amuleto do peito: "Isso me salvou três vezes".', req: (s) => s.f.deu_amuleto, w: 12, fx: { sor: 2 }, set: 'pai_vivo' }, { t: 'Era um mensageiro. Ele te entregou a espada de {pai}. Você não chorou na frente dele.', w: 5, item: { n: 'espada do pai', s: 'for', b: 1, tag: 'espada' }, fx: { for: 1 }, set: 'pai_morto' }] },
      ],
    },
    {
      id: 'passaro_ferido', st: ST, minAge: 3,
      text: 'Você encontra {bicho} ferido na beira da estrada.',
      ctx: (s, c) => { c.bicho = G.R.pick(['um filhote de raposa', 'um corvo de asa quebrada', 'uma coruja pequenina', 'um esquilo de três cores', 'um gato selvagem']); },
      choices: [
        { t: 'Cuidar dele em segredo', check: { s: 'int', d: 3 }, ok: { t: 'Ele sarou e passou a te visitar todo dia por anos.', fx: { car: 1, sor: 1 }, set: 'amigo_animal' }, fail: { t: 'Ele não resistiu. Você o enterrou sob uma pedra bonita.', fx: { int: 1 } } },
        { t: 'Levar para a curandeira', out: { t: 'A curandeira gostou tanto de você que passou a te ensinar sobre ervas.', fx: { int: 1 }, set: 'sabe_ervas' } },
        { t: 'Deixar a natureza seguir', out: { t: 'Você seguiu seu caminho. A natureza é dura.', fx: { for: 1 } } },
      ],
    },
    {
      id: 'desafio_cemiterio', st: ST, minAge: 7,
      text: 'As crianças te desafiam a passar a meia-noite sozinho no cemitério de {cidade}.',
      choices: [
        { t: 'Aceitar o desafio', check: { s: 'for', d: 4 }, ok: [{ t: 'Você ficou até o amanhecer. Ninguém mais duvidou de você.', fx: { car: 1, for: 1 } }, { t: 'À meia-noite, uma senhora pálida perguntou as horas e sumiu. Você nunca contou isso a ninguém.', fx: { int: 1 }, set: 'viu_fantasma' }], fail: { t: 'Uma coruja piou e você saiu correndo, gritando.', fx: { car: -1, agi: 1 } } },
        { t: 'Aceitar, mas levar {amigo}', req: (s) => s.f.amigo, out: { t: 'Vocês passaram a noite contando histórias de terror um para o outro.', fx: { car: 1 } } },
        { t: 'Recusar', out: { t: 'Te chamaram de covarde. Você chamou de bobos. Empate.', fx: {} } },
      ],
    },
    {
      id: 'aprender_ler', st: ST, minAge: 5,
      text: 'Um escriba viajante oferece ensinar as crianças a ler em troca de comida.',
      choices: [
        { t: 'Estudar todos os dias', out: { t: 'Em poucos meses você lia qualquer placa de {cidade}.', fx: { int: 2 }, set: 'le' } },
        { t: 'Aprender só a assinar o nome', out: { t: 'Pelo menos seu nome você escreve bonito.', fx: { int: 1, car: 1 } } },
        { t: 'Preferir brincar lá fora', out: { t: 'Você subiu em muro, caiu de muro, subiu de novo.', fx: { agi: 1, for: 1 } } },
      ],
    },
    {
      id: 'tempestade_inf', st: ST,
      text: 'Uma tempestade terrível arranca o telhado da sua casa no meio da noite.',
      choices: [
        { t: 'Ajudar a segurar as telhas', check: { s: 'for', d: 4 }, ok: { t: 'Você e {mae} salvaram metade do telhado.', fx: { for: 1 } }, fail: { t: 'Uma telha te acertou a cabeça.', fx: { hp: -2 } } },
        { t: 'Proteger os mais novos', out: { t: 'Você cantou para acalmá-los até a chuva passar.', fx: { car: 1 } } },
        { t: 'Olhar os raios pela janela', out: { t: 'Um raio caiu tão perto que você sentiu o gosto de metal. Desde então, tem sonhos estranhos.', fx: { int: 1 }, set: 'tocado_raio' } },
      ],
    },
    {
      id: 'cigana_mao', st: ST, minAge: 6,
      text: 'Uma vidente de lenço vermelho segura sua mão no mercado e franze a testa.',
      choices: [
        { t: '"O que você vê?"', out: [{ t: '"Uma vida longa... se você evitar {criatura}."', set: 'aviso_vidente' }, { t: '"Ouro. Muito ouro. E uma traição."', fx: { sor: 1 }, set: 'profecia_ouro' }, { t: '"Você vai amar alguém de {vila}."', set: 'profecia_amor' }] },
        { t: 'Puxar a mão e correr', out: { t: 'Ela gritou algo numa língua estranha. Você sentiu um arrepio.', fx: { sor: -1, agi: 1 } } },
        { t: 'Ler a mão dela de volta', check: { s: 'car', d: 4 }, ok: { t: 'Ela gargalhou e te deu um amuleto de presente.', item: { n: 'amuleto de lenço vermelho', s: 'sor', b: 1, tag: 'amuleto' } }, fail: { t: 'Ela não achou graça.', fx: { car: -1 } } },
      ],
    },
    {
      id: 'cao_aventura', st: ST, req: (s) => s.f.cao,
      text: '{cao}, seu cão, aparece com algo na boca e quer que você o siga até a floresta.',
      choices: [
        { t: 'Seguir {cao}', out: [{ t: 'Ele te levou a uma bolsa perdida cheia de moedas.', fx: { gold: [8, 20] } }, { t: 'Ele te levou até uma criança perdida. Os pais dela te recompensaram.', fx: { car: 1, gold: 5 } }, { t: 'Ele só queria brincar. Foi a melhor tarde do ano.', fx: { hp: 2, sor: 1 } }] },
        { t: 'Mandá-lo largar', out: { t: 'Era um osso. Gigante. De quê, você não quis saber.', fx: { int: 1 } } },
      ],
    },
  ]);
})();
