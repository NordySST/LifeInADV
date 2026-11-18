# Mil Vidas

RPG de texto para celular em que você vive uma vida inteira — do nascimento à morte — tomando decisões a cada ano.
O foco do projeto é **variedade**: jogar várias vezes deve render histórias realmente diferentes.

## Como jogar

Abra `index.html` no navegador (funciona direto do arquivo). Para testar no celular, sirva a pasta numa rede local:

```bash
python3 -m http.server 8000
# no celular: http://IP-DO-COMPUTADOR:8000
```

Servido via http(s), o jogo vira um **PWA**: dá para "Adicionar à tela inicial" e jogar offline.

## Por que as vidas não se repetem

| Camada | O que faz |
|---|---|
| **Personagem sorteado** | 10 origens × 18 traços (2 por vida) × nomes e atributos aleatórios. A origem e os traços liberam eventos exclusivos. |
| **Mundo gerado** | Cada vida tem um reino, 5 regiões (com biomas diferentes), cidade natal e 4 deuses novos. O bioma muda as criaturas que aparecem. |
| **138 eventos escritos à mão** | Com condições (idade, ofício, origem, decisões anteriores), textos e resultados alternativos, e testes de atributo. |
| **9 geradores procedurais** | Montam eventos combinando peças: viajantes (quem × pedido × verdade oculta), criaturas (bioma × espécie × adjetivo), mercadores (item × qualidade × falso/amaldiçoado/abençoado), lugares misteriosos, missões, festivais, sonhos, brincadeiras e clima. São milhares de combinações. |
| **Verdades ocultas** | Muitos eventos sorteiam um segredo (ex.: o viajante é um golpista, ou um deus disfarçado). A mesma escolha pode dar resultados opostos em vidas diferentes. |
| **Cadeias de eventos** | Decisões agendam consequências anos depois (o pai que vai à guerra, o amigo que paga a dívida, a missão aceita, o filho que cresce). |
| **Memória entre vidas** | O jogo lembra o que você já viu: eventos inéditos ficam ~3× mais prováveis, e os muito repetidos ficam raros. |
| **Ofícios** | Mago, soldado, ladrão, mercador, sacerdote, bardo, fazendeiro ou aventureiro — cada um com seu próprio conjunto de eventos. |

Numa simulação de 500 vidas com escolhas aleatórias, duas vidas compartilham em média **só ~15% das situações**,
e apareceram mais de 3.000 situações diferentes.

## Arte e som (16 bits)

Nada de imagens ou áudios externos: tudo é gerado por código, então o jogo continua leve (e funciona offline).

- **Cenas animadas** em 160×90 pixels, ampliadas sem suavização: céus com *dithering* ordenado (dia, entardecer, noite, tempestade, sonho),
  paisagens para os 7 biomas, interiores (taverna, templo, casa, biblioteca, caverna), cidade, mercado, festa com fogos, batalha, mar e cemitério.
  Chuva, neve, fogo, água e estrelas se mexem.
- **Cada evento escolhe sua cena** (`js/art.js` → `A.specFor`): pelo tipo de evento procedural, por palavras-chave ou pelo bioma da região atual.
- **Sprites com troca de paleta**: a mesma criatura muda de cor conforme a espécie e o adjetivo (albina, sombria, pestilenta...).
- **Retrato e boneco do personagem** gerados para cada vida (pele, cabelo, penteado, barba), que mudam com o ofício (chapéu de mago, elmo...) e envelhecem.
- **Interface** em janelas de RPG clássico, com fonte pixelada ([Pixelify Sans](fonts/OFL-PixelifySans.txt), licença OFL), cursor, texto que se digita e ícones em pixel.
- **Som** (`js/audio.js`): sintetizador chiptune em WebAudio (ondas de pulso, triângulo, ruído e eco), com efeitos para sucesso, falha, ouro, item, título, dano, viagem, nascimento e morte.
- **Música procedural**: cada vida compõe seus próprios temas para infância, juventude, vida adulta e velhice, além das músicas do menu e da morte.
  Música e efeitos podem ser desligados em "Som".

## Estrutura

```
index.html              página do jogo
css/style.css           visual (pensado para retrato/celular)
js/engine.js            motor: estado, sorteio de eventos, efeitos, memória entre vidas
js/gen.js               geradores de nomes, cidades, regiões, criaturas, itens e deuses
js/content/*.js         conteúdo: origens/traços, infância, juventude, adulto, velhice, procedural
js/art.js               arte em pixel: cenas, sprites, retratos e ícones
js/audio.js             sintetizador, efeitos sonoros e música procedural
js/ui.js                telas e interação
fonts/                  fonte pixelada (OFL)
tools/simular.js        simulador para testar conteúdo e medir repetição
sw.js, manifest...      PWA (instalação e modo offline)
```

## Como adicionar eventos

Cada evento é um objeto num arquivo de `js/content/`:

```js
{
  id: 'ponte_quebrada',           // único
  st: ['jov', 'adu'],             // fases: inf, jov, adu, vel (omitir = qualquer)
  minAge: 16,                     // opcional
  w: 10,                          // peso no sorteio (padrão 10)
  req: (s) => s.job === 'soldado',// condição opcional
  text: ['Variação 1 em {vila}.', 'Variação 2 com {npc}.'],
  choices: [
    { t: 'Pular', check: { s: 'agi', d: 5 },          // teste de atributo
      ok:   { t: 'Você conseguiu!', fx: { agi: 1 } },
      fail: { t: 'Caiu no rio.', fx: { hp: -3 }, cause: 'afogamento' } },
    { t: 'Voltar', out: [                              // resultados sorteados
      { t: 'Nada aconteceu.', w: 3 },
      { t: 'Achou um item!', item: 'gen', w: 1 },
    ] },
  ],
}
```

**Efeitos disponíveis num resultado:** `fx` (`for`, `agi`, `int`, `car`, `sor`, `hp`, `maxHp`, `gold` — número ou `[min, max]`),
`set`/`unset` (marcadores), `inc`, `item` (`'gen'` gera um item aleatório), `lose`, `job`, `title`, `trait`, `ppl` (nomeia pessoas),
`chain: ['id_evento', minAnos, maxAnos]` (agenda consequência), `travel`, `age`, `die`, `cause`, `fn` (código livre).

**Variáveis de texto:** `{nome}`, `{sobrenome}`, `{pai}`, `{mae}`, `{irmao}`, `{amigo}`, `{rival}`, `{mentor}`, `{amor}`, `{conjuge}`,
`{filho}`, `{cidade}`, `{lugar}`, `{vila}`, `{npc}`, `{npc2}`, `{criatura}`, `{deus}`, `{taverna}`, `{item}`, `{reino}`, `{rei}`.

Depois de adicionar conteúdo, rode o simulador — ele aponta variáveis sem valor e erros:

```bash
node tools/simular.js 500
```

## Levando para Android / iOS

O jogo é HTML/JS puro, então pode ser empacotado com o [Capacitor](https://capacitorjs.com/):

```bash
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Mil Vidas" com.seunome.milvidas --web-dir .
npx cap add android   # ou ios (precisa de um Mac com Xcode)
npx cap open android  # abre no Android Studio para gerar o APK/AAB
```

(Para publicar, o ideal é mover os arquivos do jogo para uma pasta `www/` e apontar `--web-dir www`.)
