/* Geradores procedurais.
 * Cada gerador combina peças (quem, situação, verdade oculta, lugar, criatura...)
 * para montar um evento novo na hora. Com poucas listas, saem milhares de combinações,
 * e o resultado de cada escolha depende de uma "verdade" escondida sorteada junto.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;
  const g = (s, k) => G.stat(s, k);

  /* ======================= 1. Viajante na estrada ======================= */
  const VIAJANTES = ['uma velha de capa remendada', 'um cavaleiro sem cavalo', 'uma criança perdida', 'um monge que não fala', 'um anão bêbado',
    'uma elfa ferida', 'um bardo desafinado', 'um peregrino coberto de cinzas', 'um soldado desertor', 'uma alquimista apressada',
    'um gigante tímido', 'um homem com uma gaiola vazia', 'uma mulher com um véu de prata', 'um menino com um corvo no ombro',
    'um mercador sem mercadorias', 'uma noiva ainda de vestido', 'um velho carregando um sino', 'um halfling muito educado'];
  const PEDIDOS = [
    ['pede ajuda para encontrar {coisa}', 'ajudar a procurar'], ['pede um pouco de comida', 'dividir sua comida'],
    ['pede escolta até {vila}', 'escoltar até {vila}'], ['pede que você guarde um embrulho por uma noite', 'guardar o embrulho'],
    ['oferece uma previsão do futuro em troca de uma moeda', 'pagar pela previsão'], ['pede que você leve uma carta até {vila}', 'levar a carta'],
    ['pede abrigo da chuva', 'oferecer abrigo'], ['pede ajuda para enterrar alguém', 'ajudar no enterro']];
  const COISAS = ['uma chave de bronze', 'um filhote de cabra', 'um anel de casamento', 'um livro de capa vermelha', 'o caminho de casa', 'um irmão desaparecido'];
  const VERDADES = [
    { id: 'honesto', w: 40 }, { id: 'golpista', w: 22 }, { id: 'amaldicoado', w: 12 }, { id: 'divino', w: 6 }, { id: 'perigoso', w: 12 }, { id: 'rico', w: 8 }];

  G.addGen({
    id: 'viajante', w: 14, st: ['jov', 'adu', 'vel'],
    make(s) {
      const vi = R.idx(VIAJANTES), pi = R.idx(PEDIDOS), v = R.wpick(VERDADES, (x) => x.w);
      const coisa = R.pick(COISAS);
      const [ped, acao] = PEDIDOS[pi];
      const quem = VIAJANTES[vi];
      const Quem = G.gen.cap(quem);
      const resAjudar = {
        honesto: [{ t: 'Foi um gesto pequeno, mas a gratidão foi enorme. Você ganhou um amigo em {vila}.', fx: { car: 1, gold: [3, 10] } }, { t: 'Em agradecimento, recebeu uma bênção sincera — e um pão doce.', fx: { sor: 1, hp: 1 } }],
        golpista: [{ t: 'Enquanto você ajudava, sua bolsa sumiu. O sorriso também.', fx: { gold: [-25, -8], int: 1 } }],
        amaldicoado: [{ t: 'Ao tocar suas mãos, você sentiu um frio estranho. Uma maldição passou para você.', fx: { sor: -2 }, set: 'amaldicoado' }],
        divino: [{ t: 'Ao final, a figura brilhou: era {deus} disfarçado! "Raros ajudam sem perguntar."', fx: { sor: 2, maxHp: 2 }, title: 'Favorecido de {deus}' }],
        perigoso: [{ t: 'Era uma emboscada! Comparsas saíram do mato.', fx: { hp: [-4, -2], gold: [-15, -5] }, cause: 'uma emboscada na estrada' }],
        rico: [{ t: 'Era alguém muito rico disfarçado, testando a bondade dos outros. A recompensa foi gorda!', fx: { gold: [40, 90] } }],
      };
      const resInterrogar = {
        honesto: { t: 'As histórias batiam. Você ajudou com confiança e ainda aprendeu algo.', fx: { car: 1, int: 1 } },
        golpista: { t: 'Você percebeu a mentira e o golpista fugiu correndo.', fx: { int: 1 } },
        amaldicoado: { t: 'Você notou a marca da maldição e indicou o templo mais próximo, mantendo distância.', fx: { int: 1, sor: 1 } },
        divino: { t: 'Algo nos olhos dele não era deste mundo. Ele sorriu: "Esperto". E sumiu, deixando um presente.', item: (st) => G.gen.item(2) },
        perigoso: { t: 'Você percebeu a armadilha e deu meia-volta antes dos comparsas aparecerem.', fx: { int: 1, agi: 1 } },
        rico: { t: 'Você notou os anéis escondidos sob a luva. Fingiu não ver, ajudou, e foi recompensado.', fx: { gold: [30, 60] } },
      };
      const roubar = {
        honesto: { t: 'Você levou pouca coisa e muita culpa.', fx: { gold: [2, 8], sor: -1 } },
        golpista: { t: 'Ladrão que rouba ladrão... Você achou bolsos cheios de moedas alheias!', fx: { gold: [20, 40] } },
        amaldicoado: { t: 'O que você roubou estava amaldiçoado.', fx: { sor: -2, gold: 5 }, set: 'amaldicoado' },
        divino: { t: 'Sua mão queimou ao tocar a bolsa. Uma voz trovejou: "Ingrato!"', fx: { sor: -3, hp: -2 }, set: 'ira_divina' },
        perigoso: { t: 'Ele era mais perigoso que você.', fx: { hp: [-5, -3] }, cause: 'tentando roubar a pessoa errada' },
        rico: { t: 'Uma bolsa pesada! Mas a guarda logo começou a procurar por você.', fx: { gold: [40, 80] }, set: 'procurado' },
      };
      return {
        key: 'viaj:' + vi + ':' + pi + ':' + v.id,
        text: 'Na estrada para {vila}, ' + quem + ' ' + ped.replace('{coisa}', coisa) + '.',
        choices: [
          { t: G.gen.cap(acao), out: resAjudar[v.id] },
          { t: 'Fazer perguntas antes', check: { s: 'int', d: 4 + Math.floor(s.age / 20) }, ok: resInterrogar[v.id], fail: { t: 'Você não conseguiu ler a pessoa e seguiu seu caminho, desconfiado.', fx: {} } },
          { t: 'Seguir em frente', out: { t: Quem + ' ficou para trás na estrada. Você nunca saberá quem era.', fx: v.id === 'perigoso' ? { int: 1 } : {} } },
          { t: 'Tentar roubar', req: (st) => st.job === 'ladrao' || st.f.t_maoleve || st.f.ratos || st.f.t_ganancioso, check: { s: 'agi', d: 5 }, ok: roubar[v.id], fail: { t: 'Você foi pego no flagra e apanhou.', fx: { hp: -2, car: -1 } } },
        ],
      };
    },
  });

  /* ======================= 2. Encontro com criatura ======================= */
  G.addGen({
    id: 'criatura', w: 16, st: ['jov', 'adu', 'vel'], req: (s) => s.age >= 16,
    make(s) {
      const reg = G.region(s);
      const c = G.gen.creature(reg.biome, s.age);
      const p = Math.max(2, c.pow);
      const LUGAR = ['Atravessando ' + reg.name, 'Ao montar acampamento', 'Perto de um riacho', 'Numa trilha estreita', 'Ao anoitecer', 'Voltando de {vila}', 'Numa ponte de cordas'];
      const li = R.idx(LUGAR);
      const verbo = { fera: 'rosna e avança', monstro: 'bloqueia o caminho', gente: 'saca uma arma', espirito: 'surge do nada, flutuando' }[c.tipo];
      const loot = c.tipo === 'gente' ? { gold: [10, 40] } : { gold: [5, 20] };
      const vit = [
        { t: 'Você derrotou ' + c.full + '! ' + (c.tipo === 'gente' ? 'Levou o que tinha nos bolsos.' : 'Vendeu as presas e o couro.'), fx: Object.assign({ for: R.chance(0.3) ? 1 : 0 }, loot) },
        { t: 'Vitória suada contra ' + c.full + '. Entre os restos, algo brilhava.', item: 'gen', fx: { hp: -1 }, w: 4 },
      ];
      if (p >= 7) vit.push({ t: 'A vitória contra ' + c.full + ' foi tão épica que os bardos comporão canções!', title: 'Algoz de ' + G.gen.cap(c.base), fx: { gold: [30, 60] }, w: 6 });
      return {
        key: 'cri:' + c.key + ':' + li,
        text: LUGAR[li] + ', ' + c.full + ' ' + verbo + '!' + (p >= 8 ? ' Parece extremamente perigoso.' : p <= 3 ? ' Não parece tão ameaçador.' : ''),
        choices: [
          { t: 'Lutar', check: { s: 'for', d: p }, ok: vit, fail: { t: c.g === 'm' ? 'O ' + c.base + ' te feriu gravemente antes de você escapar.' : 'A ' + c.base + ' te feriu gravemente antes de você escapar.', fx: { hp: -Math.max(2, Math.ceil(p * 0.8)) }, cause: 'atacado por ' + c.full } },
          { t: 'Fugir', check: { s: 'agi', d: p - 1 }, ok: { t: 'Você escapou por pouco.', fx: { agi: R.chance(0.3) ? 1 : 0 } }, fail: { t: 'Não deu para fugir a tempo.', fx: { hp: -Math.ceil(p / 2) }, cause: 'alcançado por ' + c.full } },
          c.tipo === 'gente' || c.tipo === 'espirito'
            ? { t: 'Conversar', check: { s: 'car', d: p }, ok: [{ t: 'A conversa desarmou o encontro. Vocês se despediram em paz.', fx: { car: 1 } }, { t: 'Com palavras certas, você ganhou um aliado improvável — e um conselho valioso.', fx: { int: 1, sor: 1 } }], fail: { t: 'Palavras não funcionaram.', fx: { hp: -Math.ceil(p / 2) }, cause: 'um encontro com ' + c.full } }
            : { t: 'Distrair com comida', check: { s: 'int', d: p - 1 }, ok: { t: 'Você jogou suas provisões para longe e passou de fininho.', fx: { int: 1 } }, fail: { t: 'Ignorou a comida e veio atrás de você.', fx: { hp: -Math.ceil(p / 2) }, cause: 'atacado por ' + c.full } },
          { t: 'Usar magia', req: (st) => st.job === 'mago' || st.f.centelha_magica, check: { s: 'int', d: p - 1 }, ok: { t: 'Um clarão arcano e ' + c.full + ' fugiu apavorado.', fx: { int: 1, gold: [0, 10] } }, fail: { t: 'O feitiço falhou na hora errada.', fx: { hp: -Math.ceil(p / 2) }, cause: 'um feitiço que falhou' } },
        ],
      };
    },
  });

  /* ======================= 3. Mercador ambulante ======================= */
  const VENDEDORES = ['Um mercador de bigode encerado', 'Uma velha com uma carroça puxada por um bode', 'Um gnomo com uma mochila maior que ele', 'Um sujeito de capa cheia de bolsos', 'Uma ex-aventureira de perna de pau', 'Um menino esperto demais para a idade'];
  const FRASES = ['"Peça única! Pertenceu a um herói!"', '"Só hoje, preço de amigo!"', '"Não pergunte de onde veio."', '"Achei num túmulo. Quer dizer, numa loja."', '"Esse aqui escolhe o dono."'];
  G.addGen({
    id: 'mascate', w: 9, st: ['jov', 'adu', 'vel'],
    make(s) {
      const it = G.gen.item();
      const vi = R.idx(VENDEDORES), fi = R.idx(FRASES);
      const truth = R.wpick([{ id: 'real', w: 50 }, { id: 'falso', w: 30 }, { id: 'amaldicoado', w: 10 }, { id: 'abencoado', w: 10 }], (x) => x.w).id;
      const price = Math.max(5, (it.b + 1) * R.int(8, 18));
      const real = Object.assign({}, it);
      if (truth === 'falso') { real.n = it.n + ' (falsificado)'; real.b = 0; }
      if (truth === 'amaldicoado') { real.n = it.n + ' amaldiçoado'; real.b = -1; }
      if (truth === 'abencoado') { real.b = it.b + 1; real.n = it.n + ' abençoado'; }
      const buy = (p) => ({ fx: { gold: -p }, item: real, t: { real: 'Bom negócio! O item é genuíno.', falso: 'Em casa, a "relíquia" descascou. Era tinta sobre lata.', amaldicoado: 'Desde que o comprou, tudo dá meio errado...', abencoado: 'O item brilha levemente à noite. É melhor do que o mercador sabia!' }[truth] });
      return {
        key: 'masc:' + it.key + ':' + truth,
        text: VENDEDORES[vi] + ' te oferece: ' + it.n + ', por ' + price + ' moedas. ' + FRASES[fi],
        choices: [
          { t: 'Comprar (' + price + ' ouro)', req: (st) => st.gold >= price, out: buy(price) },
          { t: 'Pechinchar', req: (st) => st.gold >= Math.ceil(price / 2), check: { s: 'car', d: 5 }, ok: buy(Math.ceil(price / 2)), fail: { t: 'O vendedor se ofendeu e foi embora.', fx: {} } },
          { t: 'Examinar com cuidado', check: { s: 'int', d: 5 }, ok: { t: { real: 'Parece genuíno. Mas você hesitou e o vendedor já tinha outro cliente.', falso: 'Falsificação! Você o desmascarou e ele te pagou para ficar quieto.', amaldicoado: 'Você sentiu a maldição só de tocar. Melhor não.', abencoado: 'Há uma bênção nesse objeto! O vendedor nem sabe. Você comprou baratinho.' }[truth], fx: truth === 'falso' ? { gold: 8, int: 1 } : truth === 'abencoado' ? { gold: -Math.min(s.gold, 5) } : { int: 1 }, item: truth === 'abencoado' ? real : undefined }, fail: { t: 'Você não conseguiu tirar conclusão nenhuma.', fx: {} } },
          { t: 'Recusar', out: { t: 'Você seguiu seu caminho.', fx: {} } },
        ],
      };
    },
  });

  /* ======================= 4. Lugar misterioso ======================= */
  const LUGARES = [['uma ruína', 'f'], ['uma caverna', 'f'], ['um santuário esquecido', 'm'], ['uma torre sem portas', 'f'], ['um poço seco', 'm'], ['uma cripta', 'f'],
    ['um acampamento abandonado', 'm'], ['um círculo de pedras', 'm'], ['um navio encalhado longe do mar', 'm'], ['uma árvore oca gigante', 'f'], ['uma mina antiga', 'f'], ['um moinho que gira sem vento', 'm']];
  const DETALHES = ['coberto de runas que brilham', 'de onde sai uma música baixa', 'guardado por estátuas sem rosto', 'com cheiro de enxofre', 'onde a neblina não entra',
    'com pegadas frescas na entrada', 'com um altar dedicado a {deus}', 'onde o tempo parece parar', 'cercado de flores azuis', 'onde nenhum pássaro canta'];
  const CONTEUDO = [{ id: 'tesouro', w: 22 }, { id: 'armadilha', w: 18 }, { id: 'espirito', w: 12 }, { id: 'monstro', w: 14 }, { id: 'saber', w: 14 }, { id: 'vazio', w: 12 }, { id: 'portal', w: 4 }, { id: 'eremita', w: 8 }];
  const fem = (txt, gnd) => (gnd === 'f' ? txt.replace(/coberto/, 'coberta').replace(/guardado/, 'guardada').replace(/cercado/, 'cercada') : txt);
  G.addGen({
    id: 'lugar', w: 12, st: ['jov', 'adu', 'vel'],
    make(s) {
      const li = R.idx(LUGARES), di = R.idx(DETALHES);
      const [lug, gnd] = LUGARES[li];
      const cont = R.wpick(CONTEUDO, (x) => x.w).id;
      const dano = -R.int(2, 4 + Math.floor(s.age / 20));
      const R_ = {
        tesouro: [{ t: 'Lá dentro, um pequeno tesouro esquecido!', fx: { gold: [20, 70] } }, { t: 'Entre ossos e poeira, um objeto que valia a pena.', item: 'gen' }],
        armadilha: [{ t: 'O chão cedeu! Uma armadilha antiga.', fx: { hp: dano }, cause: 'uma armadilha em ' + lug }],
        espirito: [{ t: 'Um espírito guardião te observou e, satisfeito, te abençoou.', fx: { sor: 1, hp: 2 } }, { t: 'Um espírito furioso te expulsou aos gritos.', fx: { hp: -2, sor: -1 } }],
        monstro: [{ t: 'Algo vivia lá dentro. E não gostou da visita.', fx: { hp: dano }, cause: 'algo que vivia em ' + lug }],
        saber: [{ t: 'Paredes cobertas de escritos antigos. Você aprendeu muito.', fx: { int: 2 } }, { t: 'Um diário de um explorador antigo, com segredos de ' + G.region(s).name + '.', fx: { int: 1, sor: 1 }, set: 'mapa_x' }],
        vazio: [{ t: 'Nada. Absolutamente nada. Que decepção.', fx: {} }, { t: 'Vazio, mas você achou um bom lugar para descansar.', fx: { hp: 2 } }],
        portal: [{ t: 'Um arco de pedra brilhou e te engoliu. Você acordou em outra terra.', travel: true, fx: { sor: 1, int: 1 } }],
        eremita: [{ t: 'Um eremita vivia ali. Ele te ensinou uma técnica antiga em troca de companhia.', fn: (st, c, chips) => { const k = R.pick(Object.keys(G.STATS)); st.st[k]++; chips.push({ k: 'ok', t: '+1 ' + G.STATS[k] }); } }],
      };
      const cuidadoso = { armadilha: { t: 'Você viu a armadilha a tempo e a desarmou. Atrás dela, um pequeno baú!', fx: { gold: [15, 40], agi: 1 } }, monstro: { t: 'Você ouviu a respiração lá dentro e saiu de fininho.', fx: { agi: 1 } } };
      return {
        key: 'lug:' + li + ':' + di + ':' + cont,
        text: 'Você encontra ' + lug + ' ' + fem(DETALHES[di], gnd) + '.',
        choices: [
          { t: 'Entrar com cuidado', check: { s: 'agi', d: 5 }, ok: cuidadoso[cont] || R_[cont], fail: R_[cont] },
          { t: 'Entrar decidido', check: { s: 'for', d: 5 }, ok: cont === 'monstro' ? { t: 'Algo te atacou, mas você venceu! Havia um ninho de tesouros.', fx: { gold: [20, 50] } } : R_[cont], fail: cont === 'armadilha' || cont === 'monstro' ? R_[cont] : { t: 'Você tropeçou na entrada e se machucou.', fx: { hp: -1 } } },
          { t: 'Estudar de fora', check: { s: 'int', d: 5 }, ok: { t: { tesouro: 'Você deduziu onde estava o esconderijo e pegou o tesouro sem riscos.', armadilha: 'As marcas no chão denunciavam a armadilha. Melhor não entrar.', espirito: 'As oferendas na entrada indicavam um espírito. Você deixou uma moeda e sentiu a bênção.', monstro: 'Ossos roídos na entrada. Nem pensar.', saber: 'Das inscrições da entrada você aprendeu algo valioso.', vazio: 'Saqueado há anos. Não vale a pena.', portal: 'As runas descreviam um portal. Fascinante — e perigoso.', eremita: 'Fumaça de cachimbo. Alguém mora ali. Você bateu antes de entrar e foi bem recebido.' }[cont], fx: cont === 'tesouro' ? { gold: [15, 40] } : cont === 'saber' || cont === 'portal' ? { int: 1 } : cont === 'espirito' ? { sor: 1 } : cont === 'eremita' ? { car: 1, int: 1 } : {} }, fail: { t: 'Você ficou horas olhando e não entendeu nada.', fx: {} } },
          { t: 'Ir embora', out: { t: 'Algumas portas é melhor deixar fechadas.', fx: {} } },
        ],
      };
    },
  });

  /* ======================= 5. Quadro de missões ======================= */
  const CLIENTES = ['um moleiro desesperado', 'a viúva do ferreiro', 'um nobre entediado', 'o sacerdote local', 'uma guilda de mercadores', 'uma criança com um cofrinho', 'o prefeito de {vila}', 'uma bruxa aposentada'];
  const TAREFAS = [
    ['recuperar um colar roubado por {criatura}', 'for', 'O ladrão se escondeu num covil difícil de alcançar.'],
    ['entregar um pacote misterioso que não pode ser aberto', 'agi', 'Alguém está seguindo você pela estrada.'],
    ['descobrir quem envenena os poços', 'int', 'Os suspeitos são todos simpáticos demais.'],
    ['convencer um dragão velho a se mudar', 'car', 'O dragão está de muito mau humor hoje.'],
    ['achar um gato que fugiu', 'sor', 'O gato tem o péssimo hábito de entrar em lugares impossíveis.'],
    ['escoltar uma noiva até o casamento', 'for', 'Um pretendente rejeitado contratou capangas.'],
    ['roubar de volta um contrato assinado', 'agi', 'O contrato está num cofre vigiado por cães.'],
    ['decifrar um mapa antigo', 'int', 'Metade do mapa está escrita numa língua morta.'],
    ['acalmar uma briga entre duas famílias', 'car', 'As duas famílias trouxeram forcados.'],
    ['caçar o javali que destrói as plantações', 'for', 'O javali é do tamanho de uma carroça.'],
    ['espantar um fantasma do celeiro', 'sor', 'O fantasma parece gostar muito do celeiro.'],
  ];
  G.addGen({
    id: 'missao', w: 9, st: ['jov', 'adu'], req: (s) => !s.f.missao && s.age >= 16,
    make(s) {
      const ci = R.idx(CLIENTES), ti = R.idx(TAREFAS);
      const vila = G.gen.town();
      const cri = G.gen.creature(G.region(s).biome, s.age).full;
      const [tar, stat, complica] = TAREFAS[ti];
      const cliente = CLIENTES[ci].replace('{vila}', vila);
      const tarefa = tar.replace('{criatura}', cri);
      const dif = R.int(4, 7) + Math.floor(s.age / 20);
      const ouro = dif * R.int(6, 12);
      return {
        key: 'mis:' + ci + ':' + ti,
        text: 'No quadro de avisos de ' + vila + ', ' + cliente + ' oferece ' + ouro + ' moedas para quem aceitar ' + tarefa + '.',
        choices: [
          { t: 'Aceitar o serviço', out: { t: 'Você arrancou o aviso do quadro. Agora não tem volta.', fn: (st) => { st.f.missao = { cliente: G.gen.cap(cliente), tarefa, vila, stat, dif, ouro, complica }; }, chain: ['missao_resolucao', 0, 2] } },
          { t: 'Pedir adiantamento', check: { s: 'car', d: 5 }, ok: { t: 'Metade adiantada! E o serviço ainda está de pé.', fx: { gold: Math.floor(ouro / 3) }, fn: (st) => { st.f.missao = { cliente: G.gen.cap(cliente), tarefa, vila, stat, dif, ouro: Math.ceil(ouro * 0.66), complica }; }, chain: ['missao_resolucao', 0, 2] }, fail: { t: 'O cliente achou abuso e escolheu outra pessoa.', fx: {} } },
          { t: 'Ignorar', out: { t: 'Outro aventureiro pegou o serviço.', fx: {} } },
        ],
      };
    },
  });

  /* ======================= 6. Festival ======================= */
  const FESTAS = ['da Lua Cheia', 'das Lanternas', 'do Primeiro Queijo', 'dos Mortos Alegres', 'da Colheita Dourada', 'do Solstício', 'das Máscaras', 'do Peixe Gigante', 'de {deus}'];
  const COMPETICOES = [['luta na lama', 'for'], ['corrida de porcos', 'agi'], ['concurso de enigmas', 'int'], ['concurso de canto', 'car'], ['roda da fortuna', 'sor'], ['arremesso de tronco', 'for'], ['competição de arco', 'agi'], ['duelo de insultos poéticos', 'car'], ['torneio de xadrez de pedra', 'int']];
  G.addGen({
    id: 'festival', w: 8,
    make(s) {
      const fi = R.idx(FESTAS), ci = R.idx(COMPETICOES);
      const [comp, stat] = COMPETICOES[ci];
      const d = R.int(3, 6) + Math.floor(s.age / 25);
      const premio = R.int(10, 40);
      return {
        key: 'fes:' + fi + ':' + ci,
        text: 'É o Festival ' + FESTAS[fi] + ' em {vila}! O destaque do ano é a ' + comp + ', com prêmio de ' + premio + ' moedas.',
        choices: [
          { t: 'Competir na ' + comp, check: { s: stat, d }, ok: [{ t: 'Você venceu a ' + comp + '! O povo te carregou nos ombros.', fx: { gold: premio, car: 1 } }, { t: 'Campeão! E ganhou um apelido que vai te seguir pra sempre.', fx: { gold: premio }, title: 'Campeão da ' + G.gen.cap(comp), w: 3 }], fail: [{ t: 'Você ficou em último. Pelo menos foi divertido.', fx: { car: 1 } }, { t: 'Uma derrota dolorosa — literalmente.', fx: { hp: -1 } }] },
          { t: 'Apostar em alguém', check: { s: 'sor', d: 4 }, ok: { t: 'Aposta certeira!', fx: { gold: [8, 25] } }, fail: { t: 'Seu favorito perdeu feio.', fx: { gold: -8 } } },
          { t: 'Dançar e comer', out: [{ t: 'Você dançou com {npc} a noite toda.', fx: { car: 1, hp: 1 } }, { t: 'Você comeu tanto que precisou ser carregado para casa.', fx: { hp: 2 } }, { t: 'Entre uma dança e outra, alguém deixou cair uma bolsa. Agora é sua.', fx: { gold: [5, 15] } }] },
          { t: 'Trabalhar na festa', out: { t: 'Enquanto todos se divertiam, você lucrava.', fx: { gold: [8, 20] } } },
        ],
      };
    },
  });

  /* ======================= 7. Sonho / presságio ======================= */
  const SIMBOLOS = ['uma serpente', 'uma porta vermelha', 'um lobo de prata', 'uma árvore em chamas', 'uma criança coroada', 'um olho no céu', 'uma ponte quebrada', 'um peixe falante', 'um relógio sem ponteiros', 'sua própria lápide'];
  const ACOES = ['te oferecia uma chave', 'chorava em silêncio', 'repetia seu nome', 'apontava para o norte', 'ria sem parar', 'se transformava em fumaça', 'te seguia sem dizer nada'];
  G.addGen({
    id: 'sonho', w: 6,
    make(s) {
      const si = R.idx(SIMBOLOS), ai = R.idx(ACOES);
      const bom = R.chance(0.6);
      const k = R.pick(Object.keys(G.STATS));
      return {
        key: 'son:' + si + ':' + ai,
        text: 'Você sonha com ' + SIMBOLOS[si] + ' que ' + ACOES[ai] + '. Ao acordar, a imagem não sai da sua cabeça.',
        choices: [
          { t: 'Buscar um intérprete de sonhos', out: bom ? { t: '"Um ótimo presságio!", disse o intérprete. E você se sentiu mesmo melhor.', fx: { [k]: 1 } } : { t: '"Cuidado nos próximos dias", alertou o intérprete. Você ficou de olhos abertos.', fx: { int: 1 } } },
          { t: 'Escrever o sonho num diário', out: { t: 'Com o tempo, seus sonhos ficaram mais nítidos. Quase proféticos.', fx: { int: 1 } } },
          { t: 'Ignorar', out: bom ? { t: 'Era só um sonho.', fx: {} } : { t: 'Você ignorou. Talvez não devesse.', fx: { sor: -1 } } },
        ],
      };
    },
  });

  /* ======================= 8. Brincadeiras da infância ======================= */
  const BRINC = [['pique-esconde', 'agi'], ['guerra de lama', 'for'], ['caça ao tesouro', 'int'], ['teatro de fantoches', 'car'], ['corrida até o moinho', 'agi'], ['pescaria no riacho', 'sor'], ['construir uma jangada', 'int'], ['luta de travesseiros', 'for'], ['espiar o vizinho estranho', 'agi'], ['inventar uma língua secreta', 'int']];
  const COMPANHIAS = ['as crianças da vizinhança', '{amigo}', 'seu primo {npc}', 'um menino novo na vila', 'uma menina que diz ser filha de uma bruxa', 'o filho do padeiro'];
  const PALCOS = ['no celeiro', 'na beira do rio', 'na praça de {cidade}', 'no bosque proibido', 'no telhado da igreja', 'nas ruínas perto de casa'];
  G.addGen({
    id: 'brincadeira', w: 14, st: ['inf'], req: (s) => s.age >= 4,
    make(s) {
      const bi = R.idx(BRINC), ci = R.idx(COMPANHIAS), pi = R.idx(PALCOS);
      const [b, stat] = BRINC[bi];
      const comp = COMPANHIAS[ci] === '{amigo}' && !s.f.amigo ? 'as crianças da vizinhança' : COMPANHIAS[ci];
      const surpresas = [
        { t: 'No meio da brincadeira, vocês acharam uma moeda antiga enterrada!', fx: { gold: [2, 8] } },
        { t: 'Vocês riram tanto que doeu a barriga.', fx: { car: 1 } },
        { t: 'Alguém se machucou de leve. Foi você.', fx: { hp: -1, for: 1 } },
        { t: 'Um adulto ralhou com todos, mas valeu a pena.', fx: { agi: 1 } },
        { t: 'Vocês viram uma luz estranha entre as árvores e correram pra casa.', fx: { int: 1 }, set: 'luz_bosque' },
      ];
      return {
        key: 'brin:' + bi + ':' + ci + ':' + pi,
        text: 'Uma tarde de ' + b + ' com ' + comp + ' ' + PALCOS[pi] + '.',
        choices: [
          { t: 'Querer vencer a qualquer custo', check: { s: stat, d: 3 }, ok: { t: 'Você venceu! Foi o assunto da semana.', fx: { [stat]: 1 } }, fail: { t: 'Você perdeu e ficou emburrado o resto do dia.', fx: { car: -1 } } },
          { t: 'Brincar só pela diversão', out: surpresas },
          { t: 'Mudar as regras no meio do jogo', check: { s: 'car', d: 3 }, ok: { t: 'Todos aceitaram suas regras novas. Você nasceu para liderar.', fx: { car: 1 } }, fail: { t: 'Te chamaram de trapaceiro.', fx: { car: -1, int: 1 } } },
        ],
      };
    },
  });

  /* ======================= 9. Clima e estações ======================= */
  const CLIMAS = [
    ['Um inverno rigoroso congela {lugar}.', 'for', 'Lenha cortada, casa aquecida.', 'O frio entrou nos ossos.'],
    ['Uma seca longa racha a terra de {lugar}.', 'int', 'Você achou água onde ninguém procurava.', 'Sede e poeira por meses.'],
    ['Uma enchente invade as ruas de {lugar}.', 'agi', 'Você salvou suas coisas a tempo.', 'A água levou parte do que você tinha.'],
    ['Uma primavera tão bonita que até os velhos ranzinzas sorriem.', 'car', 'Você fez muitos amigos novos.', 'Alergia. Muita alergia.'],
    ['Um nevoeiro estranho cobre {lugar} por uma semana inteira.', 'sor', 'No nevoeiro, você achou uma bolsa perdida.', 'Você se perdeu no nevoeiro por dois dias.'],
  ];
  G.addGen({
    id: 'clima', w: 5,
    make(s) {
      const ci = R.idx(CLIMAS);
      const [txt, stat, ok, bad] = CLIMAS[ci];
      return {
        key: 'cli:' + ci + ':' + G.region(s).biome,
        text: txt,
        choices: [
          { t: 'Enfrentar a situação', check: { s: stat, d: 4 }, ok: { t: ok, fx: stat === 'sor' ? { gold: [5, 20] } : { [stat]: 1 } }, fail: { t: bad, fx: { hp: -2 }, cause: 'o clima implacável' } },
          { t: 'Ajudar os vizinhos', out: { t: 'Juntos é mais fácil. Todos se lembraram de você.', fx: { car: 1 } } },
          { t: 'Viajar para outra região', req: (st) => G.stage(st) !== 'inf', out: { t: 'Você partiu em busca de um lugar mais gentil.', travel: true } },
        ],
      };
    },
  });
})();
