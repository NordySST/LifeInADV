/* Mil Vidas — geradores de nomes, lugares, criaturas, itens e mundo.
 * Cada vida acontece num mundo diferente: regiões, cidade natal e deuses mudam.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;

  const INI = ['Al', 'Ber', 'Cai', 'Dar', 'El', 'Fen', 'Gar', 'Hel', 'Ia', 'Jo', 'Kal', 'Lor', 'Ma', 'Nor', 'Or', 'Pe', 'Ra', 'Sel',
    'Tor', 'Ul', 'Val', 'Ze', 'Bri', 'Ce', 'Do', 'Es', 'Flo', 'Gui', 'Ira', 'Lu', 'Mi', 'Na', 'Ro', 'Si', 'Ta', 'Vi', 'Ar', 'Is', 'Ot', 'Be', 'Cla', 'Ti'];
  const MEIO = ['', '', '', 'r', 'l', 'n', 'ri', 'la', 've', 'do', 'mi', 'ran', 'sel', 'te', 'ni', 'ma', 'go'];
  const FIM_M = ['o', 'an', 'im', 'us', 'el', 'ar', 'ão', 'or', 'ias', 'em', 'ino', 'aldo', 'ério', 'ito'];
  const FIM_F = ['a', 'ia', 'ena', 'ina', 'ise', 'ara', 'ela', 'ira', 'ane', 'ícia', 'ita', 'alda', 'érica', 'ola'];
  const SOB1 = ['Pedra', 'Vento', 'Rio', 'Ferro', 'Lua', 'Sol', 'Corvo', 'Lobo', 'Cinza', 'Prata', 'Mato', 'Brasa', 'Névoa', 'Carvalho', 'Espinho', 'Trovão', 'Sal', 'Orvalho'];
  const SOB2 = ['verde', 'bravo', 'alto', 'fundo', 'claro', 'negro', 'frio', 'manso', 'forte', 'velho', 'torto', 'largo', 'fino', 'leal'];
  const PROP_FIM = ['or', 'ia', 'an', 'eth', 'ur', 'ena', 'im', 'ar', 'oth', 'iel', 'unda', 'ash'];

  const BIOMAS = {
    floresta: ['Floresta', 'Bosques', 'Mata'],
    montanha: ['Montes', 'Picos', 'Serra'],
    costa: ['Costa', 'Baía', 'Enseada'],
    pantano: ['Pântano', 'Charcos', 'Brejos'],
    deserto: ['Deserto', 'Dunas', 'Areais'],
    planicie: ['Planícies', 'Campos', 'Pradarias'],
    tundra: ['Ermos Gelados', 'Tundra', 'Vale Gélido'],
  };

  // [nome, gênero, poder, tipo]
  const CRIATURAS = {
    floresta: [['lobo', 'm', 3, 'fera'], ['urso', 'm', 5, 'fera'], ['javali', 'm', 3, 'fera'], ['aranha gigante', 'f', 4, 'monstro'], ['duende', 'm', 2, 'gente'], ['árvore desperta', 'f', 6, 'espirito'], ['lince', 'm', 3, 'fera'], ['bruxa da mata', 'f', 5, 'gente']],
    montanha: [['troll', 'm', 6, 'monstro'], ['águia gigante', 'f', 4, 'fera'], ['cabra montesa', 'f', 2, 'fera'], ['gárgula', 'f', 5, 'monstro'], ['bandoleiro', 'm', 3, 'gente'], ['grifo', 'm', 6, 'fera'], ['golem de pedra', 'm', 7, 'monstro']],
    costa: [['caranguejo gigante', 'm', 3, 'fera'], ['sereia', 'f', 4, 'espirito'], ['pirata', 'm', 3, 'gente'], ['serpente marinha', 'f', 7, 'monstro'], ['afogado', 'm', 4, 'espirito'], ['gaivota monstruosa', 'f', 2, 'fera']],
    pantano: [['crocodilo', 'm', 4, 'fera'], ['bruxa do brejo', 'f', 5, 'gente'], ['sanguessuga gigante', 'f', 3, 'monstro'], ['fogo-fátuo', 'm', 3, 'espirito'], ['hidra', 'f', 8, 'monstro'], ['sapo-rei', 'm', 3, 'fera']],
    deserto: [['escorpião gigante', 'm', 4, 'monstro'], ['saqueador', 'm', 3, 'gente'], ['múmia', 'f', 5, 'espirito'], ['verme da areia', 'm', 7, 'monstro'], ['chacal', 'm', 2, 'fera'], ['gênio rancoroso', 'm', 6, 'espirito']],
    planicie: [['lobo', 'm', 3, 'fera'], ['salteador', 'm', 3, 'gente'], ['touro bravo', 'm', 3, 'fera'], ['ogro', 'm', 5, 'monstro'], ['espantalho vivo', 'm', 3, 'espirito'], ['centauro', 'm', 5, 'gente']],
    tundra: [['lobo branco', 'm', 4, 'fera'], ['yeti', 'm', 6, 'monstro'], ['espírito do gelo', 'm', 5, 'espirito'], ['mamute', 'm', 6, 'fera'], ['caçador renegado', 'm', 3, 'gente'], ['urso polar', 'm', 5, 'fera']],
  };
  const ADJ = [['jovem', 'jovem', -1], ['faminto', 'faminta', 0], ['enfurecido', 'enfurecida', 1], ['ancião', 'anciã', 2], ['ferido', 'ferida', -1],
    ['sombrio', 'sombria', 1], ['albino', 'albina', 0], ['pestilento', 'pestilenta', 1], ['gigantesco', 'gigantesca', 2], ['astuto', 'astuta', 1],
    ['assustado', 'assustada', -1], ['de olhos vermelhos', 'de olhos vermelhos', 1], ['coberto de cicatrizes', 'coberta de cicatrizes', 1],
    ['esquelético', 'esquelética', 0], ['amaldiçoado', 'amaldiçoada', 2], ['solitário', 'solitária', 0]];

  // [nome, gênero, atributo]
  const ITENS = [['espada', 'f', 'for'], ['machado', 'm', 'for'], ['adaga', 'f', 'agi'], ['arco', 'm', 'agi'], ['capa', 'f', 'agi'], ['anel', 'm', 'sor'],
    ['amuleto', 'm', 'sor'], ['cajado', 'm', 'int'], ['livro', 'm', 'int'], ['grimório', 'm', 'int'], ['alaúde', 'm', 'car'], ['broche', 'm', 'car'],
    ['escudo', 'm', 'for'], ['lança', 'f', 'for'], ['manto', 'm', 'car'], ['bússola', 'f', 'int'], ['moeda', 'f', 'sor'], ['flauta', 'f', 'car'],
    ['elmo', 'm', 'for'], ['luva', 'f', 'agi'], ['trevo de ferro', 'm', 'sor'], ['lente', 'f', 'int']];
  const QUAL = [['enferrujado', 'enferrujada', 0, 3], ['comum', 'comum', 1, 6], ['bem-feito', 'bem-feita', 1, 5], ['élfico', 'élfica', 2, 2],
    ['encantado', 'encantada', 2, 2], ['antigo', 'antiga', 1, 4], ['rúnico', 'rúnica', 2, 2], ['lendário', 'lendária', 3, 0.5], ['torto', 'torta', 0, 2]];
  const SUF = ['', '', '', ' do Lobo', ' da Aurora', ' dos Reis Antigos', ' do Viajante', ' sem Nome', ' das Marés', ' do Eclipse', ' da Última Chama'];

  const TAV_N = [['Javali', 'm'], ['Caneca', 'f'], ['Dragão', 'm'], ['Coruja', 'f'], ['Barril', 'm'], ['Sereia', 'f'], ['Bode', 'm'], ['Lanterna', 'f'], ['Corvo', 'm'], ['Bota', 'f'], ['Gato', 'm'], ['Panela', 'f']];
  const TAV_A = [['Bêbado', 'Bêbada'], ['Furado', 'Furada'], ['Dourado', 'Dourada'], ['Risonho', 'Risonha'], ['Manco', 'Manca'], ['Sonolento', 'Sonolenta'], ['Cantante', 'Cantante'], ['Perdido', 'Perdida'], ['Zangado', 'Zangada'], ['de Três Pernas', 'de Três Pernas']];
  const VILA_A = ['Vila', 'Porto', 'Monte', 'Vale', 'Ponte', 'Campo', 'Forte', 'Lago', 'Bosque', 'Passo', 'Poço', 'Torre'];
  const VILA_B = ['Alto', 'Fundo', 'Velho', 'Novo', 'Dourado', 'Sombrio', 'Esquecido', 'das Brumas', 'do Corvo', 'dos Ventos', 'da Lua', 'de Prata',
    'das Cinzas', 'do Carvalho', 'dos Sinos', 'das Garças', 'do Lobo', 'Quebrado', 'Real', 'do Sal'];
  const DOMINIOS = ['das colheitas', 'do mar', 'da guerra', 'da lua', 'dos ladrões', 'da forja', 'dos mortos', 'do vento', 'do conhecimento', 'da sorte', 'do fogo', 'dos sonhos', 'das estradas', 'do riso'];

  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

  G.gen = {
    first(sx) {
      let n;
      do n = R.pick(INI) + R.pick(MEIO) + R.pick(sx === 'f' ? FIM_F : FIM_M);
      while (n.length > 10 || /([aeiou])\1/.test(n));
      return n;
    },
    surname: () => R.pick(SOB1) + R.pick(SOB2),
    proper() {
      let n;
      do n = R.pick(INI) + R.pick(MEIO) + R.pick(PROP_FIM);
      while (n.length > 10 || /([aeiou])\1/.test(n));
      return n;
    },
    town: () => R.pick(VILA_A) + ' ' + R.pick(VILA_B),
    tavern() { const [n, g] = R.pick(TAV_N); const a = R.pick(TAV_A); return (g === 'm' ? 'O ' : 'A ') + n + ' ' + (g === 'm' ? a[0] : a[1]); },
    god() { return { nome: G.gen.proper(), dom: R.pick(DOMINIOS) }; },
    world() {
      const biomes = R.sample(Object.keys(BIOMAS), 5);
      const regions = biomes.map((b) => ({ biome: b, name: R.pick(BIOMAS[b]) + ' de ' + G.gen.proper() }));
      const gods = [];
      while (gods.length < 4) { const g = G.gen.god(); if (!gods.some((x) => x.dom === g.dom)) gods.push(g); }
      return { regions, gods, homeTown: G.gen.town(), kingdom: 'Reino de ' + G.gen.proper(), king: G.gen.first(R.pick(['m', 'f'])) };
    },
    creature(biome, age) {
      const [n, g, p, tipo] = R.pick(CRIATURAS[biome] || CRIATURAS.planicie);
      const a = R.pick(ADJ);
      const adj = g === 'm' ? a[0] : a[1];
      const art = g === 'm' ? 'um' : 'uma';
      const pow = p + a[2] + Math.floor((age || 20) / 25);
      return { nome: n + ' ' + adj, base: n, adj, g, art, pow, tipo, full: art + ' ' + n + ' ' + adj, key: biome + ':' + n + ':' + a[0] };
    },
    item(minQ) {
      const [n, g, st] = R.pick(ITENS);
      let q = R.wpick(QUAL, (x) => x[3]);
      if (minQ && q[2] < minQ) q = R.wpick(QUAL.filter((x) => x[2] >= minQ), (x) => x[3]);
      const suf = R.pick(SUF);
      const b = q[2] + (suf && R.chance(0.3) ? 1 : 0);
      return { n: n + ' ' + (g === 'm' ? q[0] : q[1]) + suf, s: st, b, tag: n, key: n + ':' + q[0] + ':' + suf };
    },
    cap,
    BIOMAS,
  };
})();
