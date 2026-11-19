# Prompts para o ChatGPT — animação de ataque

## Como usar

1. **Peça um personagem por vez.** Se pedir vários de uma vez, o ChatGPT muda o desenho deles.
2. Anexe a imagem do personagem que está na pasta `ampliados/` do zip. Por exemplo: `ampliados/3-feras/lobo.png`.
3. Cole o **PROMPT BASE** e, embaixo dele, a linha daquele personagem que está na **TABELA DE ATAQUES**.
4. Salve o resultado com o nome `<nome>-ataque.png`. Exemplos: `heroi-adulto-ataque.png` e `lobo-ataque.png`.
5. Me mande as imagens. Eu corto os quadros, ajusto o tamanho e coloco no jogo.

> **Sprite ou vídeo?** Prefira o **sprite**. Em vídeo, o pixel art fica borrado e muda de cor entre os quadros, e eu ainda precisaria extrair os quadros e limpar o fundo. Se mesmo assim quiser vídeo, use o prompt de vídeo que está no final deste arquivo.

---

## PROMPT BASE (sprite sheet)

```
Anexei um sprite em pixel art 16-bit de um personagem do meu jogo.
Crie uma SPRITE SHEET com a animação de ATAQUE deste MESMO personagem.

REGRAS OBRIGATÓRIAS:
- Mantenha o personagem IDÊNTICO ao anexo: mesmas cores, mesma paleta,
  mesmas proporções, mesmo contorno escuro, mesmo tamanho de pixel.
  Não redesenhe, não adicione detalhes, não mude o estilo.
- Pixel art puro: pixels grandes e nítidos, sem anti-aliasing, sem
  degradês suaves, sem borrão, sem efeito 3D.
- 4 quadros lado a lado em UMA linha horizontal, todos do MESMO tamanho:
  1) preparação (recua o corpo / ergue a arma)
  2) antecipação (tensão máxima, um instante antes do golpe)
  3) GOLPE (extensão máxima, momento do impacto; pode ter um pequeno
     rastro do golpe em 2-3 cores da mesma paleta)
  4) retorno (voltando para a pose original)
- Os pés (ou a base do corpo) ficam SEMPRE na mesma linha e na mesma
  posição horizontal em todos os quadros; só o corpo e a arma se movem.
- Deixe espaço vazio ao redor para o golpe caber sem cortar nada.
- Mantenha o personagem virado para o MESMO LADO da imagem anexada.
- Fundo TRANSPARENTE (se não conseguir, use fundo liso magenta #FF00FF,
  sem sombra, sem chão, sem cenário).
- Sem texto, sem números, sem molduras, sem linhas separando os quadros.

ATAQUE DESTE PERSONAGEM:
```

*(Cole aqui a linha do personagem que está na tabela abaixo.)*

---

## TABELA DE ATAQUES

### Herói (virado para a direita)

| Arquivo | Linha para colar |
|---|---|
| heroi-crianca | Uma criança golpeando com um galho de madeira, de cima para baixo, de forma desajeitada. |
| heroi-jovem | Um jovem dando um corte horizontal com uma espada curta simples de ferro, que aparece na mão direita. |
| heroi-adulto | Um adulto dando um golpe de espada de cima para baixo, com as duas mãos, firme e forte. |
| heroi-velho | Um idoso golpeando à frente com a bengala/cajado que ele já segura, inclinando o corpo. |

### Humanoides (mantenha virados como estão)

| Arquivo | Linha para colar |
|---|---|
| bandoleiro, salteador, cacador-renegado *(é a mesma imagem: basta uma animação)* | Golpe com o bastão/porrete que ele segura, girando de trás para frente. |
| saqueador | Investida com um soco de manopla, avançando o ombro e com a capa esvoaçando. |
| bruxa-da-mata, bruxa-do-brejo *(é a mesma imagem)* | Ergue as mãos em garra e lança uma pequena esfera de magia roxa para a frente. |
| afogado | Avança com os braços e uma onda da névoa azul da parte de baixo se projeta para frente. |
| mumia | Arranhão com o braço longo, curvando o corpo para frente. |
| mumia-2 | Avança com o braço e a chama da cabeça explode para frente. |
| ogro | Golpe com as duas garras para baixo, com as chamas das mãos crescendo. |
| troll | O corpo de lodo se estica e dá uma bofetada pesada com o braço. |

### Feras

| Arquivo | Linha para colar |
|---|---|
| lobo | Salto para a frente com a boca aberta, mordendo. |
| lobo-sombrio, chacal *(é a mesma imagem)* | Bote com mordida, abaixando a cabeça e projetando o corpo para frente. |
| lince | Patada com as garras à frente, arqueando as costas. |
| aranha-gigante | Ergue as patas da frente e crava as presas para baixo. |
| sapo-rei | Língua longa disparando para frente e um golpe com o cetro. |
| cavalo | Empina nas patas traseiras e dá um coice com as dianteiras. |

### Sobrenaturais e chefes

| Arquivo | Linha para colar |
|---|---|
| fantasma | Avança flutuando e balança a lanterna como uma clava, com a chama crescendo. |
| fantasma-2 | Abre o manto e projeta as mãos para frente, com olhos brilhando. |
| fantasma-3 | Investida com a caveira à frente e a boca abrindo. |
| espirito-do-gelo | Lança uma rajada de cristais de gelo azul da lanterna. |
| fogo-fatuo | A caveira em chamas avança e cospe uma bola de fogo. |
| gargula | Bate as asas, mergulha para a frente e golpeia com as correntes. |
| dragao | Ergue a cabeça e solta um jato de fogo para a frente (o fogo pode ocupar boa parte do quadro 3). |
| dragao-2 | Arqueia o pescoço e dá uma mordida rápida, chicoteando a cauda. |

---

## (Opcional) Hit e morte

Se quiser animações completas, use o mesmo PROMPT BASE e troque o trecho dos quadros por um destes:

- **Dano (`-dano.png`):** 2 quadros. 1) o corpo recua com o impacto; 2) volta à pose.
- **Derrota (`-derrota.png`):** 4 quadros. O personagem cambaleia, cai e some.

---

## PROMPT DE VÍDEO (se preferir vídeo)

```
Use a imagem anexada (pixel art 16-bit) como o personagem.
Faça um vídeo curto de 1 a 2 segundos, em loop, com câmera parada e
fundo liso magenta #FF00FF, mostrando o personagem executando um
ataque: [COLE A LINHA DA TABELA].
Mantenha o visual de pixel art exatamente como no anexo (mesma paleta,
pixels nítidos, sem suavização, sem 3D), o personagem no mesmo lugar
e no mesmo tamanho, sem cortes de câmera, sem cenário e sem texto.
```
