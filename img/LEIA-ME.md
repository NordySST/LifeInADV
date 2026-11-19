# Imagens do Mil Vidas

> As imagens atuais vêm de pacotes gratuitos do OpenGameArt — veja [CREDITOS.md](CREDITOS.md). Ao trocar ou acrescentar imagens, registre a origem lá.

Coloque imagens nestas pastas e o jogo passa a usá-las automaticamente. **Onde não houver imagem, continua aparecendo a arte gerada por código** — então dá para ir trocando aos poucos.

```
img/
  cenas/      fundos das ilustrações (paisagens e ambientes)
  criaturas/  monstros e animais, com fundo transparente
  pessoas/    personagens que aparecem nos eventos, com fundo transparente
  objetos/    baú, cristal, livro... com fundo transparente
```

Depois de colocar ou remover imagens, rode `node tools/gerar-manifesto.js` (o APK do GitHub já faz isso sozinho).

## Nomes dos arquivos

O nome diz onde a imagem é usada. Formatos aceitos: `.png`, `.webp`, `.jpg`.

| Tipo | Nome | Exemplos |
|---|---|---|
| Cena | `cenas/<lugar>.png` | `cenas/floresta.png`, `cenas/taverna.png` |
| Cena num horário | `cenas/<lugar>-<horário>.png` | `cenas/floresta-noite.png`, `cenas/costa-tarde.png` |
| Várias versões | acrescente `-2`, `-3`... | `cenas/floresta-2.png` (o jogo sorteia entre elas) |
| Criatura | `criaturas/<nome>.png` | `criaturas/lobo.png`, `criaturas/urso-polar.png` |
| Criatura com adjetivo | `criaturas/<nome>-<adjetivo>.png` | `criaturas/lobo-albino.png`, `criaturas/troll-ancião.png` vira `troll-anciao.png` |
| Pessoa | `pessoas/<papel>.png` | `pessoa`, `viajante`, `mercador`, `crianca`, `par` |
| Objeto | `objetos/<objeto>.png` | `bau`, `cristal`, `livro`, `berco`, `quadro`, `tumulo`, `caldeirao`, `fogueira`, `moedas` |
| Capa do menu | `cenas/titulo.png` | ilustração vertical (proporção 5:7) |
| Herói (personagem do jogador) | `pessoas/heroi-<ofício>.png`, `pessoas/heroi-velho.png`, `pessoas/heroi-f.png`, `pessoas/heroi.png` | **virado para a direita**; ofícios: `mago`, `soldado`, `ladrao`, `mercador`, `sacerdote`, `bardo`, `fazendeiro`, `aventureiro` |

Nomes em minúsculas, sem acento, com hífen no lugar de espaço.

**Lugares:** `floresta`, `montanha`, `costa`, `pantano`, `deserto`, `planicie`, `tundra`, `taverna`, `templo`, `casa`, `biblioteca`, `caverna`, `cidade`, `mercado`, `festa`, `batalha`, `mar`, `cemiterio`, `ruina`, `sonho`.
**Horários:** `dia`, `tarde`, `noite`, `neblina`, `tempestade`.

## Como desenhar para encaixar

**Cenas**
- Proporção **16:10**. Tamanhos ideais: **384×240** ou **576×360** pixels (múltiplos de 192×120).
- Horizonte perto da metade da altura; **o quarto de baixo deve ser chão livre**, porque é ali que ficam o personagem (a ~30% da largura) e a criatura/pessoa do evento (a ~68%).
- Não desenhe personagens no fundo — eles são colocados por cima.
- As bordas recebem um corte "rasgado" automático; não precisa fazer moldura.

**Criaturas, pessoas e objetos**
- **Fundo transparente** (PNG), corpo inteiro, **vista de lado, virados para a esquerda** (olhando para o herói).
- Os pés/base encostados na borda de baixo da imagem.
- Qualquer tamanho; o jogo ajusta a altura conforme o tipo (criaturas mais fortes aparecem maiores). Algo entre 96 e 256 px de altura fica ótimo.

**Estilo (para tudo combinar)**
- Pixel art detalhada, "pintada", com sombreamento suave em faixas e pouca ou nenhuma linha preta grossa.
- Luz vindo de **cima à esquerda**.
- Paleta terrosa e quente; céus com degradê; névoa leve no fundo.
- Evite texto dentro das imagens.

### Modelo de pedido para ferramentas de geração de imagem

> *Pixel art, detailed painterly 16-bit style, side view landscape illustration of a [misty forest with a dirt path], horizon at the middle, empty ground in the lower quarter, soft light from the upper left, warm earthy palette, atmospheric fog in the distance, no characters, no text, 16:10 aspect ratio.*

> *Pixel art sprite, detailed painterly 16-bit style, full body [giant grey wolf], side view facing left, soft light from the upper left, transparent background, no text.*

Gere todas as imagens com o mesmo modelo de pedido (e, se a ferramenta permitir, com uma imagem de referência de estilo) para manter a coerência. Confira se a licença da ferramenta permite usar as imagens num jogo.

## O que desenhar primeiro

Lista gerada por `node tools/prioridades-arte.js`, que simula centenas de vidas e conta o que mais aparece. Comece pelo topo de cada tabela: as **cenas** são o que mais muda o visual.

### cenas

| arquivo | aparece em |
|---|---|
| `cenas/casa.png` | 14.1% dos eventos |
| `cenas/festa.png` | 8.6% dos eventos |
| `cenas/sonho.png` | 6.9% dos eventos |
| `cenas/planicie.png` | 6.8% dos eventos |
| `cenas/pantano.png` | 6.1% dos eventos |
| `cenas/mercado.png` | 6.0% dos eventos |
| `cenas/tundra.png` | 5.8% dos eventos |
| `cenas/floresta.png` | 5.4% dos eventos |
| `cenas/costa.png` | 5.4% dos eventos |
| `cenas/deserto.png` | 4.5% dos eventos |
| `cenas/montanha.png` | 4.4% dos eventos |
| `cenas/biblioteca.png` | 4.3% dos eventos |

### criaturas

| arquivo | aparece em |
|---|---|
| `criaturas/gato.png` | 2.5% dos eventos |
| `criaturas/fantasma.png` | 2.1% dos eventos |
| `criaturas/cao.png` | 1.1% dos eventos |
| `criaturas/cavalo.png` | 1.0% dos eventos |
| `criaturas/dragao.png` | 0.4% dos eventos |
| `criaturas/lobo.png` | 0.2% dos eventos |
| `criaturas/sapo-rei.png` | 0.2% dos eventos |
| `criaturas/espirito-do-gelo.png` | 0.2% dos eventos |
| `criaturas/bruxa-do-brejo.png` | 0.1% dos eventos |
| `criaturas/gargula.png` | 0.1% dos eventos |
| `criaturas/centauro.png` | 0.1% dos eventos |
| `criaturas/salteador.png` | 0.1% dos eventos |

### pessoas

| arquivo | aparece em |
|---|---|
| `pessoas/pessoa.png` | 7.4% dos eventos |
| `pessoas/viajante.png` | 4.6% dos eventos |
| `pessoas/mercador.png` | 3.2% dos eventos |
| `pessoas/crianca.png` | 1.9% dos eventos |
| `pessoas/par.png` | 0.6% dos eventos |

### objetos

| arquivo | aparece em |
|---|---|
| `objetos/cristal.png` | 8.8% dos eventos |
| `objetos/bau.png` | 5.2% dos eventos |
| `objetos/livro.png` | 4.3% dos eventos |
| `objetos/berco.png` | 2.1% dos eventos |
| `objetos/quadro.png` | 2.1% dos eventos |
| `objetos/tumulo.png` | 1.3% dos eventos |
| `objetos/caldeirao.png` | 0.9% dos eventos |
| `objetos/fogueira.png` | 0.5% dos eventos |


_(As criaturas aparecem uma de cada vez e variam muito: são mais de 35 espécies. Por isso cada uma, sozinha, tem porcentagem baixa.)_
