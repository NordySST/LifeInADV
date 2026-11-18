/* Origens, traços e eventos estruturais (nascimento, morte por velhice, etc). */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;

  G.ORIGINS = [
    { id: 'campones', nome: 'Família de camponeses', fx: { for: 1, sor: 0 }, gold: 5 },
    { id: 'nobre', nome: 'Casa nobre decadente', fx: { car: 1, int: 1, for: -1 }, gold: 40 },
    { id: 'orfao', nome: 'Órfão das ruas', fx: { agi: 2, car: -1 }, gold: 0 },
    { id: 'ferreiro', nome: 'Família de ferreiros', fx: { for: 2, agi: -1 }, gold: 10 },
    { id: 'pescador', nome: 'Vila de pescadores', fx: { agi: 1, sor: 1 }, gold: 5 },
    { id: 'druida', nome: 'Criado entre druidas', fx: { int: 1, sor: 1, car: -1 }, gold: 0 },
    { id: 'mercador', nome: 'Família de mercadores', fx: { car: 1, int: 1, for: -1 }, gold: 25 },
    { id: 'artistas', nome: 'Trupe de artistas itinerantes', fx: { car: 2, int: -1 }, gold: 5 },
    { id: 'templo', nome: 'Deixado na porta de um templo', fx: { int: 1, sor: 1 }, gold: 0 },
    { id: 'cacadores', nome: 'Clã de caçadores', fx: { agi: 1, for: 1, int: -1 }, gold: 5 },
  ];

  G.TRAITS = [
    { id: 'corajoso', nome: 'Corajoso', fx: { for: 1 }, nao: ['medroso'] },
    { id: 'medroso', nome: 'Medroso', fx: { agi: 1, for: -1 }, nao: ['corajoso'] },
    { id: 'curioso', nome: 'Curioso', fx: { int: 1 } },
    { id: 'sortudo', nome: 'Sortudo', fx: { sor: 2 }, nao: ['azarado'] },
    { id: 'azarado', nome: 'Azarado', fx: { sor: -2, car: 1 }, nao: ['sortudo'] },
    { id: 'bonito', nome: 'Bonito', fx: { car: 2 } },
    { id: 'robusto', nome: 'Robusto', fx: { maxHp: 3 }, nao: ['fragil'] },
    { id: 'fragil', nome: 'Frágil', fx: { maxHp: -2, int: 1 }, nao: ['robusto'] },
    { id: 'esperto', nome: 'Esperto', fx: { int: 2 } },
    { id: 'teimoso', nome: 'Teimoso', fx: { for: 1, car: -1 } },
    { id: 'gentil', nome: 'Gentil', fx: { car: 1 }, nao: ['ganancioso'] },
    { id: 'ganancioso', nome: 'Ganancioso', fx: { gold: 10, car: -1 }, nao: ['gentil'] },
    { id: 'sonhador', nome: 'Sonhador', fx: { int: 1, sor: 1, for: -1 } },
    { id: 'brigao', nome: 'Brigão', fx: { for: 2, car: -1 } },
    { id: 'maoleve', nome: 'Mão-leve', fx: { agi: 2, sor: -1 } },
    { id: 'marcado', nome: 'Marcado pelas estrelas', fx: { sor: 1, int: 1 } },
    { id: 'cicatriz', nome: 'Cheio de cicatrizes', fx: { maxHp: 1 } },
    { id: 'fe', nome: 'Devoto', fx: { sor: 1 } },
  ];

  const NASC = {
    campones: 'Você nasceu numa casa de pau a pique em {cidade}, entre galinhas e sacos de nabo. Seu pai, {pai}, chorou mais alto que você.',
    nobre: 'Você nasceu num quarto com tapeçarias puídas da casa {sobrenome}, uma família nobre com mais nome do que ouro.',
    orfao: 'Ninguém sabe ao certo onde você nasceu. Você foi achado num cesto, num beco de {cidade}, enrolado numa capa de mercador.',
    ferreiro: 'Você nasceu ao som de martelos. Na forja da família, em {cidade}, {mae} jurou que você tinha mãos de ferro.',
    pescador: 'Você nasceu numa noite de maré alta em {cidade}. Os pescadores dizem que isso traz sorte — ou afogamento.',
    druida: 'Você nasceu sob um carvalho sagrado em {lugar}. Os druidas leram seu futuro nas raízes e ficaram em silêncio.',
    mercador: 'Você nasceu no meio de uma viagem, numa carroça carregada de especiarias rumo a {cidade}.',
    artistas: 'Você nasceu nos bastidores de uma peça. A plateia aplaudiu achando que o choro era parte do espetáculo.',
    templo: 'Você foi deixado na porta do templo de {deus}, em {cidade}, com um bilhete que dizia apenas: "{nome}".',
    cacadores: 'Você nasceu num acampamento de caçadores em {lugar}, enrolado em pele de lobo.',
  };
  const PRESSAGIO = [
    'Naquela noite, um cometa cortou o céu.', 'Choveu sem nuvens no dia em que você nasceu.', 'Um corvo pousou na janela e não foi embora.',
    'Os cães da vila uivaram até o amanhecer.', 'Nada de especial aconteceu — e isso, por si só, já era raro.', 'Uma parteira cega disse que você viveria muitas vidas.',
    'O sino do templo tocou sozinho três vezes.', 'Uma raposa branca foi vista na estrada.',
  ];

  G.add([
    {
      id: 'nascimento', chainOnly: true,
      text: (s) => NASC[s.origin] + ' ' + R.pick(PRESSAGIO),
      choices: [
        { t: 'Chorar a plenos pulmões', out: [{ t: 'Seus pulmões eram fortes. A vila inteira soube que você chegou.', fx: { for: 1 } }, { t: 'Você chorou tanto que ganhou o apelido de "Trovãozinho".', fx: { car: 1 } }] },
        { t: 'Observar tudo em silêncio', out: [{ t: 'Seus olhos acompanhavam cada vela. "Essa criança pensa", disse {mae}.', fx: { int: 1 } }, { t: 'Você estudou o rosto de cada pessoa que se aproximou.', fx: { car: 1 } }] },
        { t: 'Agarrar o dedo de quem estiver perto', out: [{ t: 'Você agarrou com uma força surpreendente.', fx: { for: 1 } }, { t: 'Você agarrou um amuleto em vez de um dedo, e não soltou mais.', fx: { sor: 1 }, item: { n: 'amuleto de berço', s: 'sor', b: 1, tag: 'amuleto' } }] },
      ],
    },
    {
      id: 'tempo_passa', chainOnly: true, once: false,
      text: ['Os dias passam sem grandes acontecimentos em {lugar}.', 'Um ano tranquilo. Você mal se lembra dele depois.', 'A vida segue seu curso, lenta como um rio de planície.'],
      choices: [
        { t: 'Trabalhar duro', out: { t: 'Você juntou algumas moedas.', fx: { gold: [3, 10] } } },
        { t: 'Descansar', out: { t: 'Você recuperou as forças.', fx: { hp: 2 } } },
        { t: 'Estudar', out: { t: 'Você aprendeu uma coisa ou outra.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'morte_velhice', chainOnly: true,
      text: (s) => (s.f.casado ? 'Numa manhã fria, ' + (s.f.viuvo ? 'sozinho com suas lembranças' : 'ao lado de {conjuge}') + ', você sente que chegou a hora.' : 'Numa manhã fria, você sente que chegou a hora.') + ' A respiração fica leve, como se o corpo finalmente pudesse descansar.',
      choices: [
        { t: 'Contar uma última história', out: { t: 'Você contou a melhor história da sua vida e fechou os olhos sorrindo.', die: 'velhice, contando histórias' } },
        { t: 'Fazer as pazes com {deus}', out: { t: 'Uma paz enorme tomou conta de você. Dizem que o quarto cheirou a flores.', die: 'velhice, em paz' } },
        { t: 'Recusar-se a morrer hoje', req: (s) => !s.f.teimou_morte, check: { s: 'for', d: 9 }, ok: { t: 'Por pura teimosia, você viveu mais um ano. Os médicos não acreditaram.', set: 'teimou_morte', fn: (s) => { s.lifespan = s.age + R.int(2, 5); delete s.seen.morte_velhice; }, fx: { hp: 3 } }, fail: { t: 'Você lutou até o fim, resmungando contra o destino.', die: 'velhice, teimando até o fim' } },
      ],
    },
    {
      id: 'missao_resolucao', chainOnly: true, once: false, cd: 1,
      req: (s) => !!s.f.missao,
      text: (s) => 'Chegou a hora de cumprir o serviço aceito em ' + s.f.missao.vila + ': ' + s.f.missao.tarefa + '. ' + s.f.missao.complica,
      choices: (function () {
        const res = (stat) => ({
          t: { for: 'Resolver na força bruta', agi: 'Agir rápido e em silêncio', int: 'Planejar com cuidado', car: 'Negociar uma saída', sor: 'Confiar na sorte' }[stat],
          check: (s) => ({ s: stat, d: s.f.missao ? s.f.missao.dif + (s.f.missao.stat === stat ? -2 : stat === 'sor' ? 2 : 0) : 5 }),
          ok: { t: 'Serviço cumprido! {cliente} pagou o combinado e espalhou seu nome por aí.', fn: (s, c, chips) => { const m = s.f.missao; s.gold += m.ouro; chips.push({ k: 'gold', t: '+' + m.ouro + ' ouro' }); s.f.missoes = (s.f.missoes || 0) + 1; if (s.f.missoes === 3) { s.titles.push('Faz-Tudo de Confiança'); chips.push({ k: 'title', t: 'Faz-Tudo de Confiança' }); } delete s.f.missao; } },
          fail: [{ t: 'Deu tudo errado. Você voltou machucado e de mãos vazias.', fx: { hp: [-4, -2] }, fn: (s) => delete s.f.missao, cause: 'uma missão que deu errado' }, { t: 'Você falhou, e {cliente} exigiu seu adiantamento de volta.', fx: { gold: -15 }, fn: (s) => delete s.f.missao }],
        });
        return ['for', 'agi', 'int', 'car', 'sor'].map(res);
      })(),
      ctx: (s, c) => { if (s.f.missao) { c.cliente = s.f.missao.cliente; } },
    },
  ]);

})();
