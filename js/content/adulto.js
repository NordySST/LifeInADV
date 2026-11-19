/* Eventos da vida adulta (20–49 anos): gerais e por ofício. */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;
  const ST = 'adu';
  const job = (j) => (s) => s.job === j;

  G.add([
    /* ---------- Sem ofício ---------- */
    {
      id: 'sem_oficio', st: ST, w: 40, req: (s) => !s.job,
      text: 'Você já é adulto e ainda não tem um ofício. As pessoas de {lugar} começam a comentar.',
      choices: [
        { t: 'Virar aventureiro', out: { t: 'Uma espada velha e muita vontade.', job: 'aventureiro' } },
        { t: 'Trabalhar no campo', out: { t: 'Calos nas mãos, pão na mesa.', job: 'fazendeiro', fx: { for: 1 } } },
        { t: 'Abrir uma banca no mercado', out: { t: 'Começou vendendo meias. Já é alguma coisa.', job: 'mercador', fx: { car: 1 } } },
        { t: 'Entrar para a milícia', out: { t: 'Você ganhou um escudo e um apelido ruim.', job: 'soldado' } },
        { t: 'Tocar nas tavernas', out: { t: 'Você aprendeu três acordes e muitas piadas.', job: 'bardo' } },
      ],
    },

    /* ---------- Mago ---------- */
    {
      id: 'mago_feitico', st: ST, req: job('mago'),
      text: 'Seu mestre na Academia te passa o primeiro feitiço de verdade: {feitico}.',
      ctx: (s, c) => { c.feitico = R.pick(['Bola de Fogo', 'Mão Invisível', 'Voz do Trovão', 'Luz Fria', 'Sono Profundo']); },
      choices: [
        { t: 'Praticar até dominar', check: { s: 'int', d: 5 }, ok: { t: 'Dominado! Você sentiu o mundo dobrar à sua vontade.', fx: { int: 2 }, title: 'Arcanista' }, fail: { t: 'Você queimou as próprias sobrancelhas.', fx: { hp: -2, car: -1 } } },
        { t: 'Modificar o feitiço', check: { s: 'int', d: 7 }, ok: { t: 'Você criou uma variação nova! A Academia registrou com seu nome.', fx: { int: 2, car: 1 }, title: 'Inventor de Feitiços' }, fail: { t: 'Explosão. Sua torre ficou sem uma parede.', fx: { hp: -4 }, cause: 'um feitiço que explodiu' } },
        { t: 'Vender o pergaminho', out: { t: 'Um nobre pagou bem. Seu mestre ficou furioso.', fx: { gold: 40, int: -1 } } },
      ],
    },
    {
      id: 'mago_familiar', st: ST, req: job('mago'),
      text: 'Chegou a hora de invocar seu familiar, a criatura que te acompanhará na magia.',
      choices: [
        { t: 'Invocar com humildade', out: [{ t: 'Um gato preto de olhos de prata surgiu. Ele te despreza com carinho.', fx: { sor: 1 }, set: 'familiar' }, { t: 'Um sapo falante, muito educado, surgiu.', fx: { int: 1 }, set: 'familiar' }, { t: 'Uma coruja de penas azuis pousou em seu ombro.', fx: { int: 1 }, set: 'familiar' }] },
        { t: 'Invocar algo poderoso', check: { s: 'int', d: 7 }, ok: { t: 'Um pequeno dragão de fumaça! Os outros alunos morreram de inveja.', fx: { int: 1, car: 2 }, set: 'familiar', title: 'Mestre do Dragão de Fumaça' }, fail: { t: 'Algo saiu do círculo. Algo com dentes.', fx: { hp: -5 }, cause: 'a própria invocação' } },
      ],
    },
    {
      id: 'mago_biblioteca', st: ST, req: job('mago'),
      text: 'Na seção proibida da biblioteca arcana, um livro sussurra seu nome.',
      choices: [
        { t: 'Abrir o livro', check: { s: 'int', d: 6 }, ok: { t: 'O livro te ensinou segredos esquecidos.', fx: { int: 3 }, set: 'leu_proibido' }, fail: { t: 'O livro tentou te engolir. Você perdeu anos de memória.', fx: { int: -2, hp: -2 } } },
        { t: 'Avisar o arquimago', out: { t: 'O arquimago trancou o livro e te promoveu a monitor.', fx: { car: 1, gold: 15 } } },
        { t: 'Roubar o livro', check: { s: 'agi', d: 6 }, ok: { t: 'Agora ele sussurra só para você.', item: { n: 'livro sussurrante', s: 'int', b: 2, tag: 'livro' } }, fail: { t: 'Você foi expulso da Academia.', job: 'aventureiro', fx: { car: -2 } } },
      ],
    },
    {
      id: 'mago_duelo', st: ST, req: job('mago'),
      text: 'Um mago rival, {npc} da Torre Escarlate, te desafia para um duelo arcano.',
      choices: [
        { t: 'Aceitar', check: { s: 'int', d: 7 }, ok: { t: 'Você venceu com um feitiço elegante. {npc} ficou com o cabelo verde.', fx: { int: 1, car: 1, gold: 30 }, title: 'Duelista Arcano' }, fail: { t: '{npc} te transformou em sapo por uma semana.', fx: { car: -1, hp: -2 } } },
        { t: 'Propor um debate', check: { s: 'car', d: 5 }, ok: { t: 'Vocês discutiram teoria a noite toda e viraram parceiros de pesquisa.', fx: { int: 2 } }, fail: { t: '{npc} achou covardia e espalhou para toda a Academia.', fx: { car: -1 } } },
        { t: 'Sabotar o cajado dele', check: { s: 'agi', d: 5 }, ok: { t: 'O feitiço dele saiu pela culatra. Ninguém soube.', fx: { agi: 1 } }, fail: { t: 'Pego no flagra. Que vergonha.', fx: { car: -2 } } },
      ],
    },

    /* ---------- Soldado ---------- */
    {
      id: 'soldado_batalha', st: ST, req: job('soldado'), once: false, cd: 10,
      text: 'Batalha em {lugar}! Seu batalhão é mandado para a linha de frente contra as tropas de {inimigo}.',
      ctx: (s, c) => { c.inimigo = 'Lorde ' + G.gen.first('m') + ' ' + G.gen.surname(); },
      choices: [
        { t: 'Avançar com o escudo erguido', check: { s: 'for', d: 6 }, ok: { t: 'Você rompeu a linha inimiga! Foi promovido.', fx: { for: 1, gold: 30 }, inc: { patente: 1 }, title: 'Herói de {lugar}' }, fail: { t: 'Uma lança atravessou sua defesa.', fx: { hp: -5 }, cause: 'em batalha, na linha de frente' } },
        { t: 'Proteger um companheiro ferido', check: { s: 'for', d: 5 }, ok: { t: 'Você carregou {npc} para fora do campo. Ele te deve a vida.', fx: { car: 2 }, set: 'salvou_soldado' }, fail: { t: 'Vocês dois foram feridos.', fx: { hp: -4 }, cause: 'em batalha, salvando um amigo' } },
        { t: 'Flanquear pelo bosque', check: { s: 'int', d: 6 }, ok: { t: 'A manobra decidiu a batalha. O general quis saber seu nome.', fx: { int: 1, gold: 25 }, inc: { patente: 1 } }, fail: { t: 'Você se perdeu e chegou quando tudo tinha acabado.', fx: { car: -1 } } },
        { t: 'Desertar', out: { t: 'Você fugiu na noite. Agora é um desertor.', job: 'aventureiro', set: 'desertor', travel: true, fx: { car: -1 } } },
      ],
    },
    {
      id: 'soldado_cerco', st: ST, req: job('soldado'),
      text: 'Seu forte está cercado há semanas. A comida acabou e o moral está no chão.',
      choices: [
        { t: 'Liderar uma saída noturna', check: { s: 'for', d: 7 }, ok: { t: 'Vocês queimaram as máquinas de cerco do inimigo!', fx: { for: 1, car: 2 }, title: 'Lobo do Cerco' }, fail: { t: 'Emboscada. Poucos voltaram.', fx: { hp: -6 }, cause: 'numa saída noturna durante um cerco' } },
        { t: 'Racionar e animar a tropa', check: { s: 'car', d: 5 }, ok: { t: 'Suas histórias mantiveram todos vivos até o reforço chegar.', fx: { car: 2 } }, fail: { t: 'A fome venceu. O forte se rendeu.', fx: { hp: -3, gold: -20 } } },
        { t: 'Negociar a rendição', check: { s: 'car', d: 6 }, ok: { t: 'Termos honrosos. Ninguém morreu.', fx: { int: 1 } }, fail: { t: 'Vocês viraram prisioneiros por um ano.', age: 1, fx: { hp: -2 } } },
      ],
    },
    {
      id: 'soldado_promocao', st: ST, req: (s) => s.job === 'soldado' && (s.f.patente || 0) >= 1,
      text: 'O general te chama à tenda dele. "Precisamos de um capitão."',
      choices: [
        { t: 'Aceitar o comando', out: { t: 'Capitão {sobrenome}. Soa bem.', fx: { car: 1, gold: 50 }, title: 'Capitão' } },
        { t: 'Recusar e ficar com os amigos', out: { t: 'Seus companheiros fizeram uma festa em sua homenagem.', fx: { car: 2 } } },
      ],
    },
    {
      id: 'soldado_guarda_rei', st: ST, req: job('soldado'),
      text: 'Você é escalado para escoltar {rei}, a majestade do {reino}, numa viagem secreta.',
      choices: [
        { t: 'Ficar alerta a viagem toda', check: { s: 'int', d: 5 }, ok: { t: 'Você frustrou um atentado! A realeza não esqueceu.', fx: { gold: 80 }, title: 'Escudo da Coroa' }, fail: { t: 'Um assassino quase te matou no lugar de {rei}.', fx: { hp: -5 }, cause: 'protegendo {rei}' } },
        { t: 'Puxar conversa com {rei}', check: { s: 'car', d: 6 }, ok: { t: '{rei} riu das suas histórias e te deu um broche de ouro.', item: { n: 'broche real', s: 'car', b: 2, tag: 'broche' } }, fail: { t: '{rei} mandou você para o fim da fila.', fx: { car: -1 } } },
      ],
    },

    /* ---------- Ladrão ---------- */
    {
      id: 'ladrao_golpe', st: ST, req: job('ladrao'), once: false, cd: 10,
      text: 'A Guilda planeja um golpe: {alvo}. Precisam de você.',
      ctx: (s, c) => { c.alvo = R.pick(['o cofre do banqueiro {npc}', 'a coroa de exibição do museu de {vila}', 'o carregamento de especiarias do porto', 'a mansão de um nobre bêbado', 'o tesouro do templo de {deus}']).replace(/\{(\w+)\}/g, (m, k) => c[k] || m); },
      choices: [
        { t: 'Entrar pelos telhados', check: { s: 'agi', d: 6 }, ok: { t: 'Limpo e silencioso. Sua parte foi generosa.', fx: { gold: [40, 90], agi: 1 } }, fail: { t: 'Um guarda te viu. Você caiu do telhado fugindo.', fx: { hp: -4 }, set: 'procurado', cause: 'caindo de um telhado em fuga' } },
        { t: 'Disfarçar-se de criado', check: { s: 'car', d: 6 }, ok: { t: 'Ninguém desconfiou. Você saiu pela porta da frente com o saque.', fx: { gold: [40, 90], car: 1 } }, fail: { t: 'Seu disfarce caiu. Você foi preso por meses.', fx: { gold: -30 }, age: 1 } },
        { t: 'Trair a Guilda e avisar a guarda', out: { t: 'A guarda te pagou bem. A Guilda... nunca esquece.', fx: { gold: 60 }, set: 'traiu_guilda', job: 'aventureiro' } },
      ],
    },
    {
      id: 'ladrao_mestre', st: ST, req: job('ladrao'),
      text: 'O Mestre da Guilda, conhecido apenas como "O Corvo", quer te testar pessoalmente.',
      choices: [
        { t: 'Roubar algo do próprio Corvo', check: { s: 'agi', d: 7 }, ok: { t: 'Você roubou o anel dele enquanto ele falava. Ele riu e te nomeou braço-direito.', title: 'Asa do Corvo', fx: { agi: 1, gold: 50 } }, fail: { t: 'Ele quebrou dois dos seus dedos. "Ainda não."', fx: { hp: -3, agi: -1 } } },
        { t: 'Responder ao enigma dele', check: { s: 'int', d: 6 }, ok: { t: 'Ele assentiu. "Cabeça vale mais que mãos."', fx: { int: 1, gold: 30 } }, fail: { t: 'Ele suspirou. Você passou um ano limpando a Guilda.', fx: { car: -1 } } },
      ],
    },
    {
      id: 'ladrao_perseguido', st: ST, req: (s) => s.job === 'ladrao' || s.f.procurado,
      text: 'Cartazes com seu rosto (muito mal desenhado) aparecem por toda {lugar}. Há uma recompensa pela sua cabeça.',
      choices: [
        { t: 'Mudar de região', out: { t: 'Novo lugar, novo nome, mesmas manias.', travel: true, unset: 'procurado' } },
        { t: 'Subornar o capitão da guarda', req: (s) => s.gold >= 30, out: { t: 'Os cartazes sumiram em uma noite.', fx: { gold: -30 }, unset: 'procurado' } },
        { t: 'Desafiar a guarda', check: { s: 'agi', d: 6 }, ok: { t: 'Você virou uma lenda local. O povo te esconde.', fx: { car: 2 }, title: 'Fantasma de {lugar}' }, fail: { t: 'Capturado! Você passou anos na prisão.', age: 3, fx: { hp: -3, for: 1 }, unset: 'procurado' } },
      ],
    },

    /* ---------- Mercador ---------- */
    {
      id: 'mercador_caravana', st: ST, req: job('mercador'), once: false, cd: 10,
      text: 'Uma caravana para {vila} pode render muito — ou te arruinar. Você investe?',
      choices: [
        { t: 'Investir tudo', req: (s) => s.gold >= 20, check: { s: 'sor', d: 5 }, ok: { t: 'A caravana voltou carregada! Lucro enorme.', fn: (s, c, chips) => { const g = Math.floor(s.gold * 0.8); s.gold += g; chips.push({ k: 'gold', t: '+' + g + ' ouro' }); } }, fail: { t: 'Saqueadores levaram tudo.', fn: (s, c, chips) => { const g = Math.floor(s.gold * 0.6); s.gold -= g; chips.push({ k: 'bad', t: '-' + g + ' ouro' }); } } },
        { t: 'Investir pouco', check: { s: 'int', d: 4 }, ok: { t: 'Lucro modesto, mas seguro.', fx: { gold: [10, 25] } }, fail: { t: 'Prejuízo pequeno.', fx: { gold: -5 } } },
        { t: 'Ir junto com a caravana', check: { s: 'for', d: 5 }, ok: { t: 'Sua presença afastou os bandidos. Lucro e aventura!', fx: { gold: [30, 50] }, travel: true }, fail: { t: 'Emboscada no caminho.', fx: { hp: -4, gold: -10 }, cause: 'defendendo uma caravana' } },
      ],
    },
    {
      id: 'mercador_rival', st: ST, req: job('mercador'),
      text: '{npc}, um mercador de {vila}, abre uma loja igual à sua bem do outro lado da rua — e mais barata.',
      choices: [
        { t: 'Baixar os preços', check: { s: 'int', d: 5 }, ok: { t: '{npc} quebrou primeiro.', fx: { gold: 20 } }, fail: { t: 'Vocês dois quase faliram.', fx: { gold: -25 } } },
        { t: 'Propor sociedade', check: { s: 'car', d: 5 }, ok: { t: 'Juntos, vocês dominaram o mercado de {lugar}.', fx: { gold: 40, car: 1 }, title: 'Magnata de {lugar}' }, fail: { t: '{npc} riu na sua cara.', fx: { car: -1 } } },
        { t: 'Espalhar boatos sobre ele', check: { s: 'car', d: 4 }, ok: { t: 'Os clientes voltaram para você.', fx: { gold: 15, sor: -1 } }, fail: { t: 'O boato voltou contra você.', fx: { car: -2 } } },
      ],
    },
    {
      id: 'mercador_artefato', st: ST, req: job('mercador'),
      text: 'Um viajante tenta vender para você um artefato "que pertenceu a um rei antigo" por 50 moedas.',
      choices: [
        { t: 'Comprar', req: (s) => s.gold >= 50, out: [{ t: 'Era verdadeiro! Você revendeu por 300 a um colecionador.', fx: { gold: 250 }, w: 3 }, { t: 'Era falso. Uma lição cara.', fx: { gold: -50, int: 1 }, w: 7 }] },
        { t: 'Avaliar com cuidado', check: { s: 'int', d: 6 }, ok: [{ t: 'Era verdadeiro, e você pagou só 20 depois de apontar "defeitos".', fx: { gold: 100 } }, { t: 'Falsificação grosseira. Você mandou o viajante embora.', fx: { int: 1 } }], fail: { t: 'Você ficou na dúvida e o viajante foi embora.', fx: {} } },
      ],
    },

    /* ---------- Sacerdote ---------- */
    {
      id: 'sacerdote_milagre', st: ST, req: job('sacerdote'),
      text: 'Uma mãe traz uma criança doente ao templo e implora por um milagre de {deus}.',
      choices: [
        { t: 'Rezar com toda fé', check: { s: 'sor', d: 5 }, ok: { t: 'A febre baixou diante de todos. Falam de milagre.', fx: { car: 2 }, title: 'Mão de {deus}' }, fail: { t: 'Nada aconteceu. A mãe saiu chorando. Você também.', fx: { sor: -1 } } },
        { t: 'Usar medicina e ervas', check: { s: 'int', d: 5 }, ok: { t: 'A criança sarou. Você não contou que não foi milagre.', fx: { int: 1, car: 1 } }, fail: { t: 'Você fez o que pôde.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'sacerdote_heresia', st: ST, req: job('sacerdote'),
      text: 'Você descobre que o sumo-sacerdote desvia as doações do templo para uma mansão secreta.',
      choices: [
        { t: 'Denunciar publicamente', check: { s: 'car', d: 6 }, ok: { t: 'O povo te apoiou. Você assumiu o templo.', fx: { car: 2, gold: 30 }, title: 'Sumo-Sacerdote' }, fail: { t: 'Ninguém acreditou. Você foi exilado.', travel: true, fx: { car: -2 } } },
        { t: 'Chantagear', out: { t: 'Você ganhou uma "doação mensal" bem generosa.', fx: { gold: 60, sor: -2 } } },
        { t: 'Rezar por orientação', out: { t: 'No sonho, {deus} disse apenas: "Paciência". Um ano depois, ele foi pego.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'sacerdote_exorcismo', st: ST, req: job('sacerdote'),
      text: 'Uma casa em {vila} está assombrada. Os pratos voam e as velas se acendem sozinhas.',
      choices: [
        { t: 'Expulsar o espírito', check: { s: 'sor', d: 6 }, ok: { t: 'O espírito partiu em paz.', fx: { car: 1, gold: 20 } }, fail: { t: 'O espírito te jogou pela janela.', fx: { hp: -3 } } },
        { t: 'Conversar com o espírito', check: { s: 'car', d: 5 }, ok: { t: 'Era uma avó brava porque a família vendeu suas panelas. Vocês negociaram.', fx: { car: 1, int: 1 } }, fail: { t: 'O espírito não gosta de conversa.', fx: { hp: -2 } } },
      ],
    },

    /* ---------- Bardo ---------- */
    {
      id: 'bardo_corte', st: ST, req: job('bardo'),
      text: 'Você é convidado a tocar na corte de {rei}. Um erro pode custar sua cabeça; um acerto, sua fortuna.',
      choices: [
        { t: 'Tocar uma balada épica', check: { s: 'car', d: 6 }, ok: { t: 'A corte chorou. {rei} te nomeou bardo real.', fx: { gold: 100, car: 1 }, title: 'Bardo Real' }, fail: { t: 'Você bocejou no meio da música. Expulso.', fx: { car: -1 } } },
        { t: 'Contar piadas sobre os nobres', check: { s: 'int', d: 6 }, ok: { t: '{rei} gargalhou. Os nobres, nem tanto.', fx: { gold: 50 }, set: 'nobres_inimigos' }, fail: { t: 'Uma noite no calabouço.', fx: { hp: -2 } } },
      ],
    },
    {
      id: 'bardo_lenda', st: ST, req: job('bardo'),
      text: 'Você quer escrever a maior canção de todos os tempos, mas precisa de uma história real para contar.',
      choices: [
        { t: 'Seguir um herói em sua missão', check: { s: 'agi', d: 5 }, ok: { t: 'Você viu tudo e sobreviveu para cantar!', fx: { car: 2, gold: 30 }, set: 'cancao_famosa' }, fail: { t: 'O herói morreu e você quase junto.', fx: { hp: -4 }, cause: 'seguindo um herói' } },
        { t: 'Inventar tudo', out: { t: 'A canção fez sucesso. Ninguém precisa saber.', fx: { car: 1, gold: 15 } } },
        { t: 'Cantar sua própria vida', out: { t: 'Uma canção honesta. Fez poucos ouvintes, mas todos choraram.', fx: { int: 1, car: 1 } } },
      ],
    },
    {
      id: 'bardo_alaude', st: ST, req: job('bardo'),
      text: 'Um luthier excêntrico de {vila} diz ter construído um alaúde com madeira de árvore encantada.',
      choices: [
        { t: 'Comprar (40 ouro)', req: (s) => s.gold >= 40, out: { t: 'O alaúde soa como cem vozes.', fx: { gold: -40 }, item: { n: 'alaúde encantado', s: 'car', b: 3, tag: 'alaude' } } },
        { t: 'Trocar por uma canção sobre ele', check: { s: 'car', d: 5 }, ok: { t: 'Ele ficou tão vaidoso que te deu o alaúde.', item: { n: 'alaúde encantado', s: 'car', b: 3, tag: 'alaude' } }, fail: { t: 'Ele odiou a canção.', fx: { car: -1 } } },
      ],
    },

    /* ---------- Fazendeiro ---------- */
    {
      id: 'fazenda_colheita', st: ST, req: job('fazendeiro'), once: false, cd: 8,
      text: ['A colheita deste ano em suas terras promete ser {tipo}.'],
      ctx: (s, c) => { c.tipo = R.pick(['farta', 'fraca por causa da seca', 'ameaçada por gafanhotos', 'estranha — as abóboras estão brilhando']); },
      choices: [
        { t: 'Trabalhar de sol a sol', check: { s: 'for', d: 4 }, ok: { t: 'Celeiros cheios!', fx: { gold: [20, 40], for: 1 } }, fail: { t: 'Seu corpo não aguentou o ritmo.', fx: { hp: -2, gold: 5 } } },
        { t: 'Testar uma técnica nova', check: { s: 'int', d: 5 }, ok: { t: 'Rendimento dobrado! Os vizinhos vieram aprender.', fx: { gold: 40, int: 1 } }, fail: { t: 'Metade da plantação morreu.', fx: { gold: -10 } } },
        { t: 'Oferecer parte a {deus}', out: { t: 'Os deuses gostam de quem divide.', fx: { sor: 2, gold: 10 } } },
      ],
    },
    {
      id: 'fazenda_bicho', st: ST, req: job('fazendeiro'),
      text: 'Algo está matando suas galinhas à noite. Pegadas enormes no barro.',
      choices: [
        { t: 'Esperar acordado com um forcado', combat: { enemy: (s, c) => ({ name: c._cri.full.replace(/^uma? /, (m) => (m === 'um ' ? 'o ' : 'a ')), base: c._cri.base, adj: c._cri.adj, pow: c._cri.pow, tipo: c._cri.tipo }) }, ok: { t: 'Era {criatura}! Você a expulsou para sempre.', fx: { for: 1 }, title: 'Defensor do Galinheiro' }, fail: { t: '{criatura} levou metade das galinhas e te deixou marcado.', fx: { gold: -5 } } },
        { t: 'Montar uma armadilha', check: { s: 'int', d: 5 }, ok: { t: 'Pegou! Você vendeu o couro na cidade.', fx: { gold: 25 } }, fail: { t: 'Pegou foi o seu pé.', fx: { hp: -2 } } },
        { t: 'Mudar as galinhas de lugar', out: { t: 'Problema resolvido, mais ou menos.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'fazenda_tesouro', st: ST, req: job('fazendeiro'),
      text: 'Arando um campo novo, seu arado bate em algo metálico.',
      choices: [
        { t: 'Cavar', out: [{ t: 'Um baú de moedas antigas!', fx: { gold: [60, 120] } }, { t: 'Uma armadura antiga. Ainda serve!', item: 'gen' }, { t: 'Uma tampa de pedra com runas... e um gemido lá embaixo. Você tampou de novo.', fx: { int: 1 }, set: 'tumba_fazenda' }] },
        { t: 'Chamar um sacerdote', out: { t: 'O sacerdote abençoou o local. As colheitas seguintes foram enormes.', fx: { sor: 2 } } },
      ],
    },

    /* ---------- Aventureiro ---------- */
    {
      id: 'aventura_masmorra', st: ST, req: job('aventureiro'), once: false, cd: 8,
      text: 'Uma masmorra esquecida foi descoberta sob {vila}. Aventureiros de toda parte estão chegando.',
      choices: [
        { t: 'Ir na frente do grupo', combat: { enemy: (s) => ({ name: 'o guardião de pedra', base: 'golem de pedra', adj: 'antigo', pow: 6 + Math.floor(s.age / 25), tipo: 'monstro' }) }, ok: { t: 'Você derrotou o guardião e ficou com a melhor parte do tesouro.', fx: { gold: [40, 80] }, item: 'gen', title: 'Quebra-Masmorras' }, fail: { t: 'O guardião te expulsou da masmorra. Os outros seguiram sem você.' } },
        { t: 'Desarmar as armadilhas', check: { s: 'agi', d: 6 }, ok: { t: 'Graças a você ninguém morreu. Todos te pagaram.', fx: { gold: [30, 50], agi: 1 } }, fail: { t: 'Um dardo envenenado te acertou.', fx: { hp: -4 }, cause: 'veneno numa masmorra' } },
        { t: 'Decifrar os mapas', check: { s: 'int', d: 5 }, ok: { t: 'Você achou uma passagem secreta que ninguém viu.', fx: { gold: 60, int: 1 } }, fail: { t: 'Vocês andaram em círculos por dias.', fx: { hp: -2 } } },
      ],
    },
    {
      id: 'aventura_dragao', st: ST, req: (s) => s.job === 'aventureiro' || s.job === 'soldado', minAge: 25,
      text: 'Um dragão chamado {dragao} desperta nas montanhas e exige tributo de {lugar}.',
      ctx: (s, c) => { c.dragao = G.gen.proper() + ', o ' + R.pick(['Rubro', 'Cinzento', 'Insaciável', 'Velho', 'Sem Asas', 'de Cristal']); },
      choices: [
        { t: 'Enfrentar o dragão', combat: { enemy: (s, c) => ({ name: c.dragao, base: '__dragao', adj: 'ancião', pow: 9, tipo: 'monstro', boss: true }) }, ok: { t: 'Contra todas as chances, você matou {dragao}! Seu nome será cantado por séculos.', fx: { gold: 300 }, title: 'Mata-Dragões' }, fail: { t: 'Chamuscado e humilhado, você fugiu. {dragao} riu de você do alto da montanha.' } },
        { t: 'Negociar com o dragão', check: { s: 'car', d: 8 }, ok: { t: '{dragao} achou você divertido e aceitou trocar o tributo por histórias.', fx: { car: 2, int: 1 }, title: 'Amigo de Dragões' }, fail: { t: '{dragao} não estava com fome de conversa.', fx: { hp: -6 }, cause: 'as garras de {dragao}' } },
        { t: 'Roubar o tesouro enquanto ele dorme', check: { s: 'agi', d: 8 }, ok: { t: 'Você saiu com um saco de ouro e um ovo de dragão!', fx: { gold: 200 }, set: 'ovo_dragao', title: 'Ladrão de Dragões' }, fail: { t: '{dragao} abriu um olho.', fx: { hp: -7 }, cause: 'o despertar de {dragao}' } },
        { t: 'Fugir de {lugar}', out: { t: 'Sábia decisão. Viver é bom.', travel: true } },
      ],
    },
    {
      id: 'aventura_grupo', st: ST, req: job('aventureiro'),
      text: 'Um grupo de aventureiros procura mais um membro: {a}, {b} e {c}.',
      ctx: (s, c) => { c.a = 'uma guerreira chamada ' + G.gen.first('f'); c.b = 'um mago meio surdo chamado ' + G.gen.first('m'); c.c = 'um ladrão que não para de falar, ' + G.gen.first('m'); },
      choices: [
        { t: 'Entrar no grupo', out: [{ t: 'Anos de aventuras juntos. Vocês viraram uma família.', fx: { car: 1, gold: 40 }, set: 'grupo' }, { t: 'O ladrão fugiu com o dinheiro de todos na primeira semana.', fx: { gold: -20, int: 1 } }] },
        { t: 'Liderar o grupo', check: { s: 'car', d: 6 }, ok: { t: 'Sob seu comando, o grupo ficou famoso.', fx: { car: 2, gold: 50 }, set: 'grupo', title: 'Capitão da Companhia' }, fail: { t: 'Ninguém te obedeceu. Você saiu.', fx: { car: -1 } } },
        { t: 'Preferir andar só', out: { t: 'Lobo solitário. Menos amigos, mais ouro.', fx: { for: 1 } } },
      ],
    },
    {
      id: 'aventura_portal', st: ST, req: (s) => s.job === 'aventureiro' || s.job === 'mago',
      text: 'Nas ruínas de {lugar}, um portal de luz azul pulsa no ar.',
      choices: [
        { t: 'Atravessar', out: [{ t: 'Você voltou dias depois, com olhos diferentes e um bolso cheio de pedras que cantam.', fx: { int: 2, gold: 50 } }, { t: 'Você caiu em outra região do mundo.', travel: true, fx: { sor: 1 } }, { t: 'Você voltou dez anos depois. Para você, foi uma hora.', age: 8, fx: { sor: 1 }, set: 'perdeu_tempo' }] },
        { t: 'Estudar o portal', check: { s: 'int', d: 7 }, ok: { t: 'Você aprendeu a fechar e abrir o portal.', fx: { int: 2 }, title: 'Guardião do Portal' }, fail: { t: 'O portal se fechou na sua mão.', fx: { hp: -3 } } },
        { t: 'Ir embora rápido', out: { t: 'Algo do outro lado ficou te olhando.', fx: {} } },
      ],
    },

    /* ---------- Vida e família ---------- */
    {
      id: 'reencontro_amor', st: ST, req: (s) => !s.f.casado && !s.f.noivado,
      text: 'Numa festa em {vila}, você conhece {npc}. A conversa flui como se vocês se conhecessem há anos.',
      choices: [
        { t: 'Pedir para se verem de novo', check: { s: 'car', d: 4 }, ok: { t: '{npc} disse sim. Você não dormiu de ansiedade.', ppl: { amor: '{npc}' }, set: 'noivado' }, fail: { t: '{npc} já era comprometido.', fx: { int: 1 } } },
        { t: 'Deixar o destino decidir', check: { s: 'sor', d: 5 }, ok: { t: 'Vocês se esbarraram três vezes na mesma semana. Era sinal.', ppl: { amor: '{npc}' }, set: 'noivado' }, fail: { t: 'Vocês nunca mais se viram.', fx: { sor: 1 } } },
        { t: 'Focar no trabalho', out: { t: 'Amor pode esperar. Ouro, não.', fx: { gold: 10 } } },
      ],
    },
    {
      id: 'casamento', st: ['jov', 'adu'], minAge: 18, w: 30, req: (s) => s.f.noivado && !s.f.casado,
      text: 'Você e {amor} estão juntos há um bom tempo. A pergunta paira no ar.',
      choices: [
        { t: 'Pedir {amor} em casamento', check: { s: 'car', d: 3 }, ok: { t: 'Um casamento simples e lindo. Até {rival} apareceu para brindar.', set: 'casado', ppl: { conjuge: '{amor}' }, fx: { car: 1, hp: 2 } }, fail: { t: '{amor} pediu mais tempo. Vocês ainda estão juntos.', fx: {} } },
        { t: 'Fazer uma festa enorme', req: (s) => s.gold >= 40, out: { t: 'Três dias de festa! A vila inteira lembrará disso.', set: 'casado', ppl: { conjuge: '{amor}' }, fx: { gold: -40, car: 2 } } },
        { t: 'Terminar', out: { t: 'Você não estava pronto. {amor} entendeu, mas doeu.', unset: ['noivado', 'namoro'], fx: { int: 1 } } },
      ],
    },
    {
      id: 'filho_nasce', st: ST, once: false, cd: 6, req: (s) => s.f.casado && !s.f.viuvo && (s.f.filhos || 0) < 3,
      text: 'Você e {conjuge} vão ter um bebê!',
      choices: [
        { t: 'Escolher o nome {npc}', out: { t: '{npc} nasceu saudável e barulhento.', inc: { filhos: 1 }, ppl: { filho: '{npc}' }, fx: { car: 1 }, chain: ['filho_cresce', 8, 12] } },
        { t: 'Deixar {conjuge} escolher', out: { t: '{conjuge} escolheu {npc2}. Perfeito.', inc: { filhos: 1 }, ppl: { filho: '{npc2}' }, fx: { sor: 1 }, chain: ['filho_cresce', 8, 12] } },
      ],
    },
    {
      id: 'filho_cresce', chainOnly: true, req: (s) => s.ppl.filho,
      text: '{filho} já não é mais criança, e decidiu {decisao}.',
      ctx: (s, c) => { c.decisao = R.pick(['seguir o seu ofício', 'partir para o mar', 'estudar na Academia Arcana', 'se casar com alguém de {vila}', 'virar aventureiro']).replace('{vila}', c.vila); },
      choices: [
        { t: 'Dar sua bênção', out: { t: '{filho} te abraçou forte antes de partir.', fx: { car: 1, sor: 1 } } },
        { t: 'Tentar impedir', check: { s: 'car', d: 5 }, ok: { t: '{filho} ficou e te agradeceu anos depois.', fx: { car: 1 } }, fail: { t: '{filho} foi mesmo assim, magoado.', set: 'filho_magoado' } },
        { t: 'Dar um presente', req: (s) => s.items.length > 0, out: { t: 'Você deu seu objeto mais precioso. {filho} jurou honrá-lo.', lose: 'any', fx: { car: 2 } } },
      ],
    },
    {
      id: 'heranca', st: ST, w: 6,
      text: 'Um advogado de {vila} te procura: um parente distante, {npc} {sobrenome}, morreu e deixou algo para você.',
      choices: [
        { t: 'Aceitar a herança', out: [{ t: 'Uma fortuna inesperada!', fx: { gold: [80, 150] } }, { t: 'Uma casa caindo aos pedaços... e as dívidas dela.', fx: { gold: -30 } }, { t: 'Um gato de 20 anos e uma carta misteriosa.', set: 'mapa_x', fx: { sor: 1 } }, { t: 'Uma espada de família com uma maldição divertida: ela canta.', item: { n: 'espada cantora da família', s: 'for', b: 2, tag: 'espada' } }] },
        { t: 'Desconfiar e investigar', check: { s: 'int', d: 5 }, ok: { t: 'O "advogado" era um golpista. Você o entregou e ganhou a recompensa.', fx: { gold: 30 } }, fail: { t: 'Enquanto você investigava, outro parente levou tudo.', fx: {} } },
      ],
    },
    {
      id: 'incendio', st: ['adu', 'vel'],
      text: 'Fogo! A casa ao lado da sua está em chamas e há gritos lá dentro.',
      choices: [
        { t: 'Entrar no fogo', check: { s: 'for', d: 6 }, ok: { t: 'Você saiu com duas crianças nos braços. A vila te carregou nos ombros.', fx: { car: 2 }, title: 'Herói do Incêndio' }, fail: { t: 'O teto desabou.', fx: { hp: -6 }, cause: 'um incêndio, tentando salvar vizinhos' } },
        { t: 'Organizar a fila de baldes', check: { s: 'car', d: 4 }, ok: { t: 'O fogo foi controlado. Ninguém morreu.', fx: { car: 1 } }, fail: { t: 'O caos venceu. A casa queimou inteira.', fx: { int: 1 } } },
        { t: 'Salvar suas próprias coisas', out: { t: 'Suas coisas sobreviveram. Sua reputação, não.', fx: { car: -2 } } },
      ],
    },
    {
      id: 'imposto', st: ['adu', 'vel'], once: false, cd: 15,
      text: 'O cobrador de impostos do {reino} bate à sua porta com um livro grosso e dois guardas.',
      choices: [
        { t: 'Pagar', out: { t: 'Dói no bolso, mas dorme-se tranquilo.', fn: (s, c, chips) => { const g = Math.ceil(s.gold * 0.25); s.gold -= g; if (g) chips.push({ k: 'bad', t: '-' + g + ' ouro' }); } } },
        { t: 'Esconder o ouro', check: { s: 'agi', d: 5 }, ok: { t: 'Eles não acharam nada.', fx: { agi: 1 } }, fail: { t: 'Acharam — e multaram.', fn: (s, c, chips) => { const g = Math.ceil(s.gold * 0.5); s.gold -= g; chips.push({ k: 'bad', t: '-' + g + ' ouro' }); } } },
        { t: 'Argumentar sobre a lei', check: { s: 'int', d: 6 }, ok: { t: 'Você achou uma brecha. Isento por cinco anos!', fx: { int: 1 } }, fail: { t: 'O cobrador anotou seu nome num livro diferente.', fx: { gold: -10 } } },
      ],
    },
    {
      id: 'reencontro_amigo', st: ['adu', 'vel'], req: (s) => s.f.amigo || s.f.amigo_sumiu,
      text: 'Numa estrada poeirenta, você reconhece um rosto: é {amigo}, seu amigo de infância!',
      choices: [
        { t: 'Abraçar e beber juntos', out: [{ t: 'Vocês riram até o sol nascer, lembrando dos velhos tempos.', fx: { car: 1, hp: 2 } }, { t: '{amigo} enriqueceu e fez questão de dividir com você.', fx: { gold: 50 } }, { t: '{amigo} está doente. Vocês se despediram como se fosse a última vez. Foi.', fx: { int: 1 }, set: 'amigo_morto' }] },
        { t: 'Perguntar o que aconteceu', req: (s) => s.f.amigo_sumiu, out: { t: '{amigo} contou que fugiu dos credores e virou pirata. Ele te perdoou.', fx: { car: 1 }, unset: 'amigo_sumiu', set: 'amigo' } },
      ],
    },
    {
      id: 'rival_volta', st: ['adu', 'vel'], req: (s) => s.f.rival || s.f.rival_odio || s.f.rival_respeito,
      text: '{rival} reaparece em sua vida — agora {situacao}.',
      ctx: (s, c) => { c.situacao = R.pick(['como um nobre poderoso', 'mendigando na praça', 'como capitão da guarda local', 'liderando um bando de mercenários', 'como seu novo vizinho']); },
      choices: [
        { t: 'Estender a mão', check: { s: 'car', d: 5 }, ok: { t: 'Depois de tantos anos, a rixa acabou. Vocês riram juntos.', fx: { car: 2 }, unset: ['rival', 'rival_odio'], set: 'rival_amigo' }, fail: { t: '{rival} cuspiu no chão.', fx: { car: -1 } } },
        { t: 'Vingar-se', check: { s: 'int', d: 6 }, ok: { t: 'Você arruinou {rival} de forma elegante.', fx: { gold: 30, sor: -1 }, title: 'Vingador Paciente' }, fail: { t: 'A vingança te custou caro.', fx: { gold: -30, hp: -2 } } },
        { t: 'Ignorar', out: { t: 'Você é maior que isso agora.', fx: { int: 1 } } },
      ],
    },
    {
      id: 'guerra', st: ST, w: 5,
      text: 'Guerra! O {reino} declara guerra a um reino vizinho. Recrutadores varrem {lugar}.',
      choices: [
        { t: 'Lutar pelo reino', check: { s: 'for', d: 6 }, ok: { t: 'Você voltou com medalhas e histórias que não conta.', fx: { gold: 50, for: 1 }, title: 'Veterano da Grande Guerra' }, fail: { t: 'Você voltou, mas não inteiro.', fx: { hp: -5, maxHp: -1 }, cause: 'a Grande Guerra' } },
        { t: 'Lucrar vendendo suprimentos', check: { s: 'int', d: 5 }, ok: { t: 'Lucro enorme. Um pouco sujo, talvez.', fx: { gold: 80, sor: -1 } }, fail: { t: 'Suas carroças foram confiscadas.', fx: { gold: -30 } } },
        { t: 'Fugir para longe', out: { t: 'Você esperou a guerra acabar em outra terra.', travel: true } },
        { t: 'Esconder refugiados', check: { s: 'agi', d: 5 }, ok: { t: 'Você salvou dezenas de famílias.', fx: { car: 2, sor: 1 }, title: 'Abrigo dos Inocentes' }, fail: { t: 'Descoberto. Você foi preso como traidor.', fx: { hp: -3, gold: -40 }, age: 2 } },
      ],
    },
    {
      id: 'mapa_tesouro', st: ['adu', 'vel'], req: (s) => s.f.mapa_x || s.f.rumor_tesouro,
      text: 'Você finalmente decide seguir as pistas do tesouro escondido perto de {vila}.',
      choices: [
        { t: 'Cavar onde o X indica', check: { s: 'sor', d: 5 }, ok: { t: 'Um baú pesado, cheio de ouro e uma coroa amassada!', fx: { gold: [100, 200] }, title: 'Caçador de Tesouros', unset: ['mapa_x', 'rumor_tesouro'] }, fail: { t: 'Só pedras e um bilhete: "Chegou tarde."', fx: { int: 1 }, unset: ['mapa_x', 'rumor_tesouro'] } },
        { t: 'Decifrar o enigma do mapa', check: { s: 'int', d: 6 }, ok: { t: 'O X era uma pista falsa. O tesouro real estava sob o poço.', fx: { gold: 150 }, item: 'gen', unset: ['mapa_x', 'rumor_tesouro'] }, fail: { t: 'Você caiu numa armadilha antiga.', fx: { hp: -4 }, cause: 'uma armadilha de tesouro' } },
      ],
    },
    {
      id: 'maldicao', st: ['adu', 'vel'], w: 6,
      text: 'Você acorda com {sintoma}. Uma bruxa ofendida, talvez? Ou foi aquele anel?',
      ctx: (s, c) => { c.sintoma = R.pick(['a pele levemente azulada', 'uma voz que só fala em rimas', 'a sombra se movendo sozinha', 'pássaros te seguindo para todo lado', 'o cabelo completamente branco']); },
      choices: [
        { t: 'Procurar um sacerdote', check: { s: 'sor', d: 5 }, ok: { t: 'Maldição quebrada!', fx: { gold: -10 } }, fail: { t: 'A maldição piorou.', fx: { sor: -2, gold: -10 } } },
        { t: 'Abraçar a maldição', out: { t: 'Você virou uma atração local. Até que tem charme.', fx: { car: 1, sor: -1 }, trait: 'marcado' } },
        { t: 'Quebrar a maldição você mesmo', check: { s: 'int', d: 6 }, ok: { t: 'Você estudou e se curou. E aprendeu muito no caminho.', fx: { int: 2 } }, fail: { t: 'Você só conseguiu trocar uma maldição por outra.', fx: { car: -1 } } },
      ],
    },
    {
      id: 'doenca_grave', st: ['adu', 'vel'], w: 6,
      text: 'Uma tosse que não passa. O médico de {lugar} faz uma cara preocupada.',
      choices: [
        { t: 'Pagar o melhor médico (40 ouro)', req: (s) => s.gold >= 40, out: { t: 'Tratamento caro, mas eficaz.', fx: { gold: -40, hp: 3 } } },
        { t: 'Tratar com ervas', check: { s: 'int', d: 5 }, ok: { t: 'As ervas funcionaram.', fx: { hp: 2 } }, fail: { t: 'Você piorou muito.', fx: { hp: -4, maxHp: -1 }, cause: 'uma doença nos pulmões' } },
        { t: 'Ignorar e trabalhar', check: { s: 'for', d: 6 }, ok: { t: 'Você venceu a doença na teimosia.', fx: { for: 1 } }, fail: { t: 'A doença te derrubou por meses.', fx: { hp: -5 }, cause: 'uma doença ignorada' } },
      ],
    },
    {
      id: 'torneio_real', st: ST,
      text: 'O grande torneio real acontece na capital do {reino}. O prêmio: 200 moedas e um título.',
      choices: [
        { t: 'Justa a cavalo', req: (s) => s.f.cavalo, check: { s: 'agi', d: 6 }, ok: { t: 'Você e {cavalo} derrubaram todos! Campeão!', fx: { gold: 200 }, title: 'Campeão do Torneio Real' }, fail: { t: 'Você caiu na primeira investida.', fx: { hp: -3 } } },
        { t: 'Combate a pé', check: { s: 'for', d: 7 }, ok: { t: 'Campeão! A multidão grita seu nome.', fx: { gold: 200 }, title: 'Campeão do Torneio Real' }, fail: { t: 'Derrota honrosa nas semifinais.', fx: { hp: -3, car: 1 } } },
        { t: 'Assistir e vender petiscos', check: { s: 'car', d: 4 }, ok: { t: 'Você vendeu tudo. Que lucro!', fx: { gold: 40 } }, fail: { t: 'Choveu e ninguém comprou nada.', fx: { gold: -5 } } },
      ],
    },
    {
      id: 'estalagem', st: ['adu', 'vel'], req: (s) => s.gold >= 100 && !s.f.estalagem,
      text: 'A estalagem "{taverna}" está à venda por 100 moedas. O dono quer se aposentar.',
      choices: [
        { t: 'Comprar', out: { t: 'Agora você é dono de estalagem! Lucro garantido... você espera.', fx: { gold: -100 }, set: 'estalagem', title: 'Dono de {taverna}' } },
        { t: 'Recusar', out: { t: 'Talvez outro dia.', fx: {} } },
      ],
    },
    {
      id: 'estalagem_lucro', st: ['adu', 'vel'], once: false, cd: 6, req: (s) => s.f.estalagem,
      text: 'Movimento na sua estalagem: {acontecimento}.',
      ctx: (s, c) => { c.acontecimento = R.pick(['uma caravana inteira se hospedou', 'uma briga de anões quebrou metade das mesas', 'um bardo famoso tocou de graça', 'a cerveja azedou']); },
      choices: [
        { t: 'Cuidar pessoalmente', check: { s: 'car', d: 4 }, ok: { t: 'Bons negócios!', fx: { gold: [20, 50] } }, fail: { t: 'Prejuízo este mês.', fx: { gold: -15 } } },
        { t: 'Deixar o gerente cuidar', check: { s: 'sor', d: 4 }, ok: { t: 'O gerente é honesto. Lucro!', fx: { gold: [15, 30] } }, fail: { t: 'O gerente sumiu com o caixa.', fx: { gold: -30 } } },
      ],
    },
    {
      id: 'convite_rei', st: ST, req: (s) => s.titles.length >= 2,
      text: 'Sua fama chegou até {rei}, que te convida ao palácio.',
      choices: [
        { t: 'Aceitar um cargo na corte', out: { t: 'Você virou conselheiro real. Muito ouro, muitos inimigos.', fx: { gold: 100, car: 1 }, set: 'corte', title: 'Conselheiro de {rei}' } },
        { t: 'Pedir terras', out: { t: '{rei} te deu um pedaço de terra em {lugar}. Agora você é nobre!', title: 'Senhor de Terras', fx: { gold: 50 }, set: 'nobre' } },
        { t: 'Recusar educadamente', out: { t: 'Liberdade não tem preço.', fx: { sor: 1 } } },
      ],
    },
    {
      id: 'traicao', st: ST, req: (s) => s.gold >= 50,
      text: 'Um sócio de confiança, {npc}, some com metade das suas economias.',
      choices: [
        { t: 'Persegui-lo', check: { s: 'agi', d: 6 }, ok: { t: 'Você o alcançou e recuperou tudo.', fx: { agi: 1 } }, fail: { t: 'Ele sumiu no mundo.', fn: (s, c, chips) => { const g = Math.floor(s.gold / 2); s.gold -= g; chips.push({ k: 'bad', t: '-' + g + ' ouro' }); } } },
        { t: 'Contratar um caçador de recompensas', out: { t: 'Ele foi encontrado. Você recuperou parte do dinheiro.', fn: (s, c, chips) => { const g = Math.floor(s.gold / 4); s.gold -= g; chips.push({ k: 'bad', t: '-' + g + ' ouro' }); } } },
        { t: 'Aceitar a perda e seguir', out: { t: 'Você aprendeu a não confiar tão fácil.', fn: (s, c, chips) => { const g = Math.floor(s.gold / 2); s.gold -= g; chips.push({ k: 'bad', t: '-' + g + ' ouro' }); }, fx: { int: 2 } } },
      ],
    },
    {
      id: 'ovo_dragao_choca', st: ['adu', 'vel'], req: (s) => s.f.ovo_dragao,
      text: 'O ovo de dragão que você guardou começa a rachar.',
      choices: [
        { t: 'Criar o filhote', out: { t: 'Um dragãozinho que te chama de mãe/pai. Você está em apuros. Felizes apuros.', title: 'Pai/Mãe de Dragão', set: 'dragao_pet', fx: { car: 2 } } },
        { t: 'Vender a um colecionador', out: { t: 'Uma fortuna!', fx: { gold: 400 } } },
        { t: 'Devolver às montanhas', out: { t: 'Dias depois, um dragão adulto sobrevoou sua casa e deixou cair um baú de ouro.', fx: { gold: 150, sor: 2 } } },
      ],
    },
    {
      id: 'conjuge_crise', st: ['adu', 'vel'], req: (s) => s.f.casado && !s.f.viuvo,
      text: '{conjuge} anda distante. Uma noite, vocês finalmente conversam.',
      choices: [
        { t: 'Ouvir com atenção', check: { s: 'car', d: 4 }, ok: { t: 'Vocês se reconectaram. O amor ficou mais forte.', fx: { car: 1, hp: 2 } }, fail: { t: 'Vocês brigaram. O silêncio durou semanas.', fx: { hp: -1 } } },
        { t: 'Propor uma viagem juntos', req: (s) => s.gold >= 20, out: { t: 'Uma viagem inesquecível para {vila}.', fx: { gold: -20, car: 1, sor: 1 } } },
        { t: 'Dar um presente caro', req: (s) => s.gold >= 30, out: { t: '{conjuge} sorriu, mas disse que preferia seu tempo.', fx: { gold: -30, int: 1 } } },
      ],
    },
    {
      id: 'golem_mercado', st: ['adu', 'vel'],
      text: 'Um golem de barro desgovernado atravessa o mercado de {vila}, destruindo barracas.',
      choices: [
        { t: 'Apagar a runa da testa dele', check: { s: 'agi', d: 6 }, ok: { t: 'Você pulou, apagou a runa e o golem desabou. Aplausos!', fx: { agi: 1, gold: 20 }, title: 'Desmancha-Golens' }, fail: { t: 'Ele te arremessou contra uma barraca de repolhos.', fx: { hp: -3 } } },
        { t: 'Atraí-lo para o rio', check: { s: 'int', d: 5 }, ok: { t: 'O barro derreteu na água.', fx: { int: 1, car: 1 } }, fail: { t: 'Ele não caiu no truque.', fx: { hp: -2 } } },
        { t: 'Saquear as barracas na confusão', check: { s: 'agi', d: 4 }, ok: { t: 'Bolsos cheios.', fx: { gold: 20, sor: -1 } }, fail: { t: 'Pego pelos guardas.', fx: { gold: -15, car: -1 } } },
      ],
    },
  ]);
})();
