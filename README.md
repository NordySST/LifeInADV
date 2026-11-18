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

## Arte e som

Nada de imagens ou áudios externos: tudo é gerado por código (`js/art.js` e `js/audio.js`), então o jogo continua leve e funciona offline.

- **Livro ilustrado**: página de pergaminho texturizada, texto em fonte serifada ([Alegreya](fonts/OFL-Alegreya.txt), OFL), ilustrações com bordas rasgadas, opções com ornamentos e efeitos listados abaixo do texto.
- **Pixel art "pintada"**: paisagens com ruído fractal, rampas de cor com variação de matiz (sombras roxas, luzes amareladas), névoa atmosférica, sol/lua com brilho, nuvens sombreadas, trilhas em perspectiva e molduras de floresta.
- **7 biomas e várias ambientações**: floresta, montanha, costa, pântano, deserto, planície, tundra; taverna, templo com vitral e feixe de luz, casa com lareira, biblioteca, caverna com tochas e cristais; cidade, mercado, festa com lanternas e fogos, batalha, mar com píer, cemitério, sonho e ruínas. Horários: dia, entardecer, noite, neblina, tempestade.
- **Iluminação nos interiores**: cada pixel recebe luz de velas, lareiras e janelas.
- **Criaturas montadas com formas 3D** sombreadas e reduzidas a pixels com contorno (mais de 35 espécies: lobos, ursos, mamutes, trolls, golens, hidras, grifos, aranhas, espíritos, dragões...). Adjetivos mudam cores e olhos (albina, sombria, pestilenta, olhos vermelhos) e o poder muda o tamanho.
- **Personagem e retrato** gerados para cada vida, que mudam com o ofício e envelhecem.
- **Animações**: fogo, velas, estrelas, brilho na água, chuva, neve, névoa, fumaça, vaga-lumes e poeira na luz.
- **Som**: sintetizador chiptune em WebAudio com eco, efeitos sonoros e música procedural própria para cada fase de cada vida.

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
fonts/                  fontes Alegreya e Pixelify Sans (OFL)
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

## Testando no Android

A cada `push`, o GitHub Actions (`.github/workflows/android.yml`) testa o conteúdo, empacota o jogo com o
[Capacitor](https://capacitorjs.com/) e compila um APK.

1. No celular, abra a página **Releases** do repositório e baixe o `mil-vidas.apk` da versão **"APK de teste"**
   (o arquivo também fica em *Actions → APK Android → Artifacts*).
2. Toque no arquivo baixado. O Android vai pedir para permitir a instalação de apps desta fonte — permita.
3. Abra o **Mil Vidas** na tela inicial.

É um APK de *debug* (para testes). Para publicar na Play Store será preciso gerar uma versão assinada (`bundleRelease`).

### Compilando no seu computador

Com Node 22+, Java 21 e Android Studio instalados:

```bash
npm install
npm run build          # copia o jogo para www/
npx cap add android    # só na primeira vez
npx cap sync android
npx cap open android   # abre no Android Studio (Run ▶ para instalar no celular via USB)
```

O ícone e a tela de abertura ficam em `assets/` e são aplicados com `npx @capacitor/assets generate --android`.
