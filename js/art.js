/* Mil Vidas — arte em pixel no estilo 16 bits.
 * Tudo é desenhado por código numa tela de 160×90 pixels e ampliado sem suavização:
 * céus com dithering ordenado, montanhas em camadas, interiores, sprites com troca de paleta,
 * retratos gerados para cada personagem e ícones da interface.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const A = (G.art = {});
  const W = 160, H = 90;
  A.W = W; A.H = H;

  /* ---------------- utilidades ---------------- */
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  A.hash = hash; A.rng = rng;

  const rgbCache = new Map();
  function rgb(hex) {
    let v = rgbCache.get(hex);
    if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(hex, v); }
    return v;
  }
  const toHex = (r, g, b) => '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
  const mix = (a, b, f) => { const x = rgb(a), y = rgb(b); return toHex(x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f); };
  const dark = (c, f) => mix(c, '#0c0818', f == null ? 0.35 : f);
  const light = (c, f) => mix(c, '#ffffff', f == null ? 0.3 : f);
  A.mix = mix; A.dark = dark; A.light = light;
  const u32Cache = new Map();
  function u32(hex) { let v = u32Cache.get(hex); if (v === undefined) { const [r, g, b] = rgb(hex); v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; u32Cache.set(hex, v); } return v; }

  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));

  /* ---------------- buffer de pixels ---------------- */
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); this.tint = null; }
    px(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; this.d[y * this.w + x] = u32(this.tint ? this.tint(c) : c); }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
    dith(x, y, w, h, c1, c2, f) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; this.px(X, Y, f > BAYER[Y & 3][X & 3] ? c2 : c1); } }
    grad(y0, y1, cols, x0 = 0, x1 = this.w) {
      const n = cols.length - 1;
      for (let y = y0; y < y1; y++) {
        const t = ((y - y0) / Math.max(1, y1 - y0 - 1)) * n; const i = Math.min(n - 1, Math.floor(t)); const f = t - i;
        for (let x = x0; x < x1; x++) this.px(x, y, f > BAYER[y & 3][x & 3] ? cols[i + 1] : cols[i]);
      }
    }
    circle(cx, cy, r, c, c2) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d <= r * r + r * 0.6) this.px(cx + x, cy + y, c2 && x + y > r * 0.3 ? c2 : c); } }
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) this.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c); }
    toCanvas(cv) {
      cv.width = this.w; cv.height = this.h;
      const cx = cv.getContext('2d');
      const img = cx.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      cx.putImageData(img, 0, 0);
      return cv;
    }
  }
  A.Buf = Buf;

  /* ---------------- sprites em texto ---------------- */
  function spr(rows) { return { rows, w: Math.max(...rows.map((r) => r.length)), h: rows.length }; }
  function draw(b, s, x, y, pal, flip, sc) {
    sc = sc || 1;
    for (let j = 0; j < s.h; j++) {
      const row = s.rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = ch === 'k' ? pal.k || '#140c1c' : pal[ch];
        if (c) b.rect((flip ? x + (s.w - 1 - i) * sc : x + i * sc), y + j * sc, sc, sc, c);
      }
    }
  }
  A.draw = draw;

  const S = {
    fera: spr([
      '..k.k...........',
      '.kakak..........',
      '.kaaaak......kk.',
      'kaeaaaakkkkkkkak',
      'kaaaaaaaaaaaaak.',
      '.kwaaaaaaaaaaak.',
      '..kkaabbbbbbaak.',
      '...kaabbbbbbaak.',
      '...kak..kak.kak.',
      '...kak..kak.kak.',
      '...kk...kk..kk..',
    ]),
    monstro: spr([
      '....kkkkkkkk....',
      '...kaaaaaaaak...',
      '..kacaaaaaaaak..',
      '..kaeekaakeeak..',
      '..kaaaaaaaaaak..',
      '..kawkwkkwkwak..',
      '.kkaaaaaaaaaakk.',
      'kaakaaaaaaaakaak',
      'kaakabbbbbbakaak',
      'kaakabbbbbbakaak',
      'kcck.kaaaak.kcck',
      '.kk..kaaaak..kk.',
      '.....kakkak.....',
      '....kaak.kaak...',
      '....kaak.kaak...',
      '....kkkk.kkkk...',
    ]),
    espirito: spr([
      '.....kkkkkk.....',
      '....kaaaaaak....',
      '...kacaaaaaak...',
      '..kaccaaaaaaak..',
      '..kaaeeaaeeaak..',
      '..kaaeeaaeeaak..',
      '..kaaaaaaaaaak..',
      '..kaaaakkaaaak..',
      '..kaaaakkaaaak..',
      '.kaaaaaaaaaaaak.',
      'kaakaaaaaaaakaak',
      '.kkaaaaaaaaaakk.',
      '..kaaaaaaaaaak..',
      '..kaaaaaaaaaak..',
      '..kaakaakaakak..',
      '..kk..kk..kk.k..',
    ]),
    dragao: spr([
      '..............kk..........',
      '.............kbbk.........',
      '............kbbbbk........',
      '...........kbbbbbbk.......',
      '..........kbbbkbbbbk......',
      '..kkkk...kbbbk.kbbbbk.....',
      '.kaaaak.kbbbk...kbbbbk....',
      'kaeaaaakbbbk.....kkkkk....',
      'kaaaaaaakkk...............',
      'kwkwkaaaakkkkkkkk.........',
      '.kkk.kaaaaaaaaaaak........',
      '......kaacccccaaaak.......',
      '......kaacccccaaaaakk.....',
      '.......kaaaaaaaaaakaak....',
      '.......kak.kak.kak..kaak..',
      '.......kak.kak.kak...kaakk',
      '......kkk.kkk.kkk.....kkak',
      '........................kk',
    ]),
    bau: spr([
      '..kkkkkkkkkk..',
      '.kbbbbbbbbbbk.',
      'kbbbbbbbbbbbbk',
      'kyyyyyyyyyyyyk',
      'kbbbbbkkbbbbbk',
      'kkkkkkyykkkkkk',
      'kbbbbbkkbbbbbk',
      'kbbbbbbbbbbbbk',
      'kyyyyyyyyyyyyk',
      'kbbbbbbbbbbbbk',
      'kkkkkkkkkkkkkk',
    ]),
    gato: spr([
      'k.....k...',
      'kk...kk...',
      'kaaaaak...',
      'kgaagak...',
      'kaawaak..k',
      '.kaaak..ka',
      'kaaaaak.ka',
      'kaaaaakka.',
      'kaaaaaak..',
      'kkkkkkk...',
    ]),
    berco: spr([
      '....kkkkk.....',
      '...kssssk.....',
      '...kseesk.....',
      '..kkkskkkkkkk.',
      '..kwwwwwwwwwk.',
      '.kbbbbbbbbbbbk',
      '.kbcbbbcbbbcbk',
      '..kkkkkkkkkkk.',
      '...k.......k..',
      '..kk.......kk.',
    ]),
    livro: spr([
      '.kkkkkkkkkkk.',
      'kaaaaaakaaaak',
      'kawwwwakawwwk',
      'kaaaaaakaaaak',
      'kawwwwakawwwk',
      'kaaaaaakaaaak',
      'kawwwaakawwak',
      'kaaaaaakaaaak',
      '.kkkkkkkkkkk.',
    ]),
    tumulo: spr([
      '...kkkkkk...',
      '..kccccccck.',
      '.kccaaaaaacK',
      '.kcaaakaaaak',
      '.kcaakkkaaak',
      '.kcaaakaaaak',
      '.kcaaakaaaak',
      '.kcaaaaaaaak',
      '.kcbbbbbbbak',
      '.kcaaaaaaaak',
      '.kbbbbbbbbbk',
      'kgggggggggggk',
    ]),
    quadro: spr([
      'kkkkkkkkkkkkkk',
      'kbbbbbbbbbbbbk',
      'kbwwwkbbwwwwbk',
      'kbwkwkbbwkkwbk',
      'kbwwwkbbwwwwbk',
      'kbbbbbbbbbbbbk',
      'kbwwwwwkbwwwbk',
      'kbwkkkwkbwkwbk',
      'kbwwwwwkbwwwbk',
      'kkkkkkkkkkkkkk',
      '.....kbk......',
      '.....kbk......',
      '.....kbk......',
      '....kkkkk.....',
    ]),
    caldeirao: spr([
      '..g...g..g..',
      '...g.g...g..',
      'kkkkkkkkkkkk',
      'kgggggggggg k',
      '.kaaaaaaaak.',
      'kaaaaaaaaaak',
      'kacaaaaaaaak',
      'kaaaaaaaaaak',
      '.kaaaaaaaak.',
      '..kkkkkkkk..',
      '..k......k..',
    ]),
    caneca: spr([
      '.wwwwww.',
      'kwwwwwwk',
      'kyyyyyykkk',
      'kyYyyyyk.k',
      'kyYyyyyk.k',
      'kyyyyyykkk',
      'kyyyyyyk',
      'kkkkkkkk',
    ]),
    bandeira: spr([
      'k.........',
      'kkkkkkkk..',
      'kaaaaaaak.',
      'kaacaaaak.',
      'kaccaaaaak',
      'kaacaaaak.',
      'kaaaaaaak.',
      'kkkkkkkk..',
      'k.........',
      'k.........',
      'k.........',
      'k.........',
      'k.........',
      'k.........',
    ]),
    cristal: spr([
      '....kk....',
      '...kcak...',
      '..kccaak..',
      '.kccaaabk.',
      'kccaaaabbk',
      'kcaaaaabbk',
      '.kaaaabbk.',
      '..kaabbk..',
      '...kabk...',
      '....kk....',
    ]),
    mochila: spr([
      '..kkkkkk..',
      '.kbbbbbbk.',
      'kbbkkkkbbk',
      'kbbyyyybbk',
      'kbbbbbbbbk',
      'kbbbbbbbbk',
      'kbbbbbbbbk',
      '.kkkkkkkk.',
    ]),
  };
  // corrige caracteres usados como variação
  S.tumulo.rows = S.tumulo.rows.map((r) => r.replace('K', 'k'));
  S.caldeirao.rows = S.caldeirao.rows.map((r) => r.replace(' ', ''));

  /* ---------------- ícones da interface ---------------- */
  const ICONS = {
    heart: ['.kk...kk.', 'kRwk.kRRk', 'kRRRkRRRk', 'kRRRRRRRk', '.kRRRRRk.', '..kRRRk..', '...kRk...', '....k....'],
    half: ['.kk...kk.', 'kRwk.kggk', 'kRRRkgggk', 'kRRRRgggk', '.kRRRggk.', '..kRRgk..', '...kRk...', '....k....'],
    empty: ['.kk...kk.', 'kggk.kggk', 'kgggkgggk', 'kgggggggk', '.kgggggk.', '..kgggk..', '...kgk...', '....k....'],
    coin: ['..kkkk..', '.kYYyyk.', 'kYyyyyok', 'kYyyyyok', 'kyyyyyok', 'kyyyyook', '.kooook.', '..kkkk..'],
    for: ['......kkk', '.....kwlk', '....kwlk.', '...kwlk..', 'k.kwlk...', 'kkwlk....', '.kyk.....', 'kykkk....', 'kk.......'],
    agi: ['.....k.k.', '....kwkwk', '..kkkwwk.', '.kbbbkk..', '.kbbbk...', '.kbbbk...', '.kbbbbkk.', '.kbbbbbbk', '.kkkkkkkk'],
    int: ['.kkkkkkk.', 'kbbbbbbbk', 'kbwwwwwbk', 'kbbbbbbbk', 'kbwwwwbbk', 'kbbbbbbbk', 'kbwwwwwbk', 'kbbbbbbbk', '.kkkkkkk.'],
    car: ['.kkkkkkk.', 'kwwwwwwwk', 'kwkkwkkwk', 'kwwwwwwwk', 'kwwwwwwwk', 'kwkwwwkwk', '.kwkkkwk.', '..kwwwk..', '...kkk...'],
    sor: ['...kkk...', '..kGGGk..', '.kkGgGkk.', 'kGGkGkGGk', 'kGgGkGgGk', '.kkGkGkk.', '..kGkGk..', '...kbk...', '....kb...'],
    item: ['..kkkkk..', '.kb...bk.', 'kkkkkkkkk', 'kbbbbbbbk', 'kbbyyybbk', 'kbbbbbbbk', 'kbbbbbbbk', '.kkkkkkk.'],
    title: ['kRRk.kBBk', '.kRRkBBk.', '..kRkBk..', '..kkkkk..', '.kYYYYYk.', 'kYYwYYYok', 'kYwYYYYok', '.kYYYYok.', '..kkkkk..'],
    travel: ['...kkk...', '.kkwwwkk.', 'kwwwRwwwk', 'kwwwRwwwk', 'kwwwkwwwk', 'kwwwbwwwk', 'kwwwbwwwk', '.kkwwwkk.', '...kkk...'],
    sound: ['....kk...', '...kwk.k.', 'kkkwwk..k', 'kwwwwk.k.', 'kwwwwk..k', 'kkkwwk.k.', '...kwk..k', '....kk...'],
    mute: ['....kk...', '...kwk...', 'kkkwwkR.R', 'kwwwwk.R.', 'kwwwwkR.R', 'kkkwwk...', '...kwk...', '....kk...'],
    music: ['...kkkkkk', '...kwwwwk', '...kkkkkk', '...k....k', '...k....k', '.kkk..kkk', 'kwwk.kwwk', 'kwwk.kwwk', '.kk...kk.'],
    scroll: ['.kkkkkkk.', 'kwwwwwwwk', '.kwkkkwk.', '.kwwwwwk.', '.kwkkwwk.', '.kwwwwwk.', '.kwkkkwk.', 'kwwwwwwwk', '.kkkkkkk.'],
    face: ['..kkkkk..', '.kssssk..', 'kssssssk.', 'ksksskssk', 'kssssssk.', 'ksskksk..', '.kssssk..', '..kkkk...'],
    cursor: ['k.......', 'kwk.....', 'kwwk....', 'kwwwk...', 'kwwwwk..', 'kwwwk...', 'kwwk....', 'kwk.....', 'k.......'],
  };
  const ICON_PAL = { k: '#140c1c', R: '#e43b44', w: '#ffffff', g: '#5a5a78', Y: '#fee761', y: '#feae34', o: '#b86f2a', l: '#c0cbdc', b: '#8b5a2b', B: '#3a6ec8', G: '#3ea84a', s: '#f2c79a' };
  const iconCache = {};
  A.icon = function (name) {
    if (iconCache[name]) return iconCache[name];
    const rows = ICONS[name];
    const s = spr(rows);
    const b = new Buf(s.w, s.h);
    draw(b, s, 0, 0, ICON_PAL);
    if (typeof document === 'undefined') return '';
    return (iconCache[name] = b.toCanvas(document.createElement('canvas')).toDataURL());
  };

  /* ---------------- aparência do personagem ---------------- */
  const SKINS = ['#f6d2b0', '#e8b48c', '#c98e62', '#9a6440', '#6b4128'];
  const HAIRS = ['#2a1c14', '#5b3a21', '#a8642a', '#e0b850', '#c8402c', '#3a3a5a', '#7a3a8a'];
  const JOBCOL = { null: '#7a6a55', mago: '#4a3aa8', soldado: '#8a8f9a', ladrao: '#3c3c48', mercador: '#2f7a5a', sacerdote: '#e8e0c8', bardo: '#c03a5a', fazendeiro: '#8a6a2a', aventureiro: '#3d6694' };
  A.newLook = function (seedStr, sexo) {
    const r = rng(hash(seedStr));
    const p = (a) => a[Math.floor(r() * a.length)];
    return { skin: p(SKINS), hair: p(HAIRS), style: Math.floor(r() * 4), eye: p(['#140c1c', '#2a4a8a', '#3a6a3a', '#6a3a1a']), beard: sexo === 'm' && r() < 0.45, bg: p(['#3a4466', '#5a3a4a', '#2f4a3a', '#4a3a6a', '#5a4a2a']) };
  };
  function lookPal(look, job, stage) {
    const hair = stage === 'vel' ? '#d8d8e0' : stage === 'adu' && look.style === 3 ? mix(look.hair, '#d8d8e0', 0.25) : look.hair;
    const c = JOBCOL[job] || JOBCOL.null;
    return { h: hair, H: dark(hair, 0.3), s: look.skin, S: dark(look.skin, 0.2), e: look.eye, c, d: dark(c, 0.35), C: light(c, 0.25), p: '#4a3a2a', f: '#2a1c14', b: '#c99a2e', w: '#ffffff' };
  }

  // corpo inteiro (12×16) para os cenários
  const HERO = [
    '....kkkk....', '...khhhhk...', '..khhhhhhk..', '..khsssshk..', '..ksessesk..', '..kssssssk..', '...kssssk...',
    '..kcccccck..', '.kcccddccck.', '.ksccccccsk.', '..kccbbcck..', '..kppppppk..', '..kppkkppk..', '..kpk..kpk..', '..kfk..kfk..', '..kkk..kkk..'];
  const HAIR_STYLES = [
    null,
    { 3: '.khsssshk...', 4: '.khsessesk..', 5: '.khssssssk..', 6: '.khkssssk...' }, // cabelo comprido
    { 1: '...kkkkkk...', 2: '..khhhhhhk..', 3: '..kssssssk..' }, // curto
    { 0: '.....kk.....', 1: '...khhhhk...', 2: '..khhhhhhkk.', 3: '..khsssshkhk', 4: '..ksessesk.k' }, // rabo de cavalo
  ];
  const HATS = {
    mago: ['......kk....', '.....kcck...', '....kccck...', '...kcccck...', '.kkccccccck.', 'kCCCCCCCCCCk'],
    soldado: ['...kkkkkk...', '..klllllk...', '.kllllllllk.', '.kkkkkkkkkk.'],
    ladrao: ['....kkkk....', '...kddddk...', '..kddddddk..', '.kddddddddk.'],
    bardo: ['........kk..', '...kkkkkRk..', '..kccccckk..', '.kkkkkkkkkk.'],
    fazendeiro: ['...kkkkkk...', '..kyyyyyyk..', 'kkyyyyyyyykk', 'kyyyyyyyyyyk'],
    sacerdote: ['....kkkk....', '...kwwwwk...', '..kwbwwbwk..'],
    aventureiro: ['............', '............', '..kRRRRRRkR.', '..kkkkkkkkRk'],
    mercador: ['............', '...kkkkkk...', '..kccccccK..', '.kkkkkkkkkk.'],
  };
  A.hero = function (b, x, y, look, opt) {
    opt = opt || {};
    look = look || A.newLook(String(x) + y, 'm');
    const st = opt.stage || 'adu';
    const pal = Object.assign(lookPal(look, opt.job, st), { l: '#c0cbdc', R: '#c8402c', y: '#e8c060', K: '#140c1c' }, opt.pal || {});
    let rows = HERO.slice();
    const hs = HAIR_STYLES[look.style];
    if (hs) for (const k in hs) rows[k] = hs[k];
    if (look.beard && st !== 'inf' && st !== 'jov') { rows[5] = '..khsssshk..'; rows[6] = '...khhhhk...'; }
    if (st === 'inf') rows = rows.filter((r, i) => i !== 8 && i !== 11 && i !== 12);
    const top = y + (16 - rows.length);
    const flip = !!opt.flip;
    draw(b, spr(rows), x, top, pal, flip);
    const hat = opt.hat !== undefined ? opt.hat : st !== 'inf' && HATS[opt.job];
    if (hat) draw(b, spr(hat), x, top - hat.length + 3, pal, flip);
    if (st === 'vel' || opt.staff) { const sx = flip ? x - 1 : x + 12; b.line(sx, top + 6, sx, top + 15, '#6a4a2a'); b.px(sx, top + 5, '#8a6a3a'); }
    if (opt.pack) draw(b, S.mochila, flip ? x + 9 : x - 7, top + 6, { b: '#8b5a2b', y: '#e8c060' }, flip);
  };

  // retrato (32×32) para a interface
  A.portrait = function (look, job, stage) {
    const b = new Buf(32, 32);
    const pal = lookPal(look, job, stage);
    b.grad(0, 32, [light(look.bg, 0.15), look.bg, dark(look.bg, 0.3)]);
    const kid = stage === 'inf';
    const cy = kid ? 15 : 13;
    // ombros
    b.rect(5, 26, 22, 6, pal.c); b.rect(4, 28, 24, 4, pal.c); b.rect(13, 25, 6, 2, pal.s); b.rect(14, 26, 4, 2, pal.d);
    b.rect(5, 26, 1, 6, '#140c1c'); b.rect(26, 26, 1, 6, '#140c1c'); b.rect(6, 25, 20, 1, '#140c1c');
    b.rect(15, 27, 2, 5, pal.d);
    // pescoço e rosto
    b.rect(13, cy + 8, 6, 5, pal.S);
    const fw = kid ? 13 : 12, fh = kid ? 12 : 13, fx = 16 - Math.floor(fw / 2), fy = cy - 5;
    for (let j = 0; j < fh; j++) {
      const inset = j === 0 || j === fh - 1 ? 2 : j === 1 || j === fh - 2 ? 1 : 0;
      b.rect(fx + inset, fy + j, fw - inset * 2, 1, pal.s);
      b.px(fx + inset - 1, fy + j, '#140c1c'); b.px(fx + fw - inset, fy + j, '#140c1c');
    }
    b.rect(fx + 2, fy - 1, fw - 4, 1, '#140c1c'); b.rect(fx + 2, fy + fh, fw - 4, 1, '#140c1c');
    b.rect(fx + fw - 3, fy + 2, 2, fh - 4, pal.S);
    // olhos, sobrancelhas, nariz, boca
    const ey = fy + Math.floor(fh * 0.45);
    for (const ex of [fx + 3, fx + fw - 5]) { b.rect(ex, ey, 2, 2, pal.e); b.px(ex, ey, '#ffffff'); b.rect(ex, ey - 2, 2, 1, stage === 'vel' ? '#b0b0b8' : pal.H); }
    b.px(16, ey + 3, pal.S); b.px(16, ey + 2, pal.S);
    b.rect(15, ey + 5, 3, 1, dark(pal.s, 0.45));
    if (kid || look.style === 1) { b.px(fx + 2, ey + 3, '#e88a8a'); b.px(fx + fw - 3, ey + 3, '#e88a8a'); }
    if (stage === 'vel') { b.px(fx + 2, ey + 4, pal.S); b.px(fx + fw - 3, ey + 4, pal.S); b.rect(fx + 3, ey - 4, 3, 1, pal.S); }
    // barba
    if (look.beard && !kid && stage !== 'jov') { b.rect(fx + 1, ey + 4, fw - 2, fh - (ey - fy) - 4, pal.h); b.rect(15, ey + 5, 3, 1, dark(pal.h, 0.5)); }
    // cabelo
    const hairTop = fy - 2;
    b.rect(fx, hairTop, fw, 4, pal.h); b.rect(fx + 1, hairTop - 1, fw - 2, 1, pal.h); b.rect(fx + 2, hairTop - 2, fw - 4, 1, '#140c1c');
    b.rect(fx + 2, hairTop + 1, fw - 6, 1, light(pal.h, 0.25));
    if (look.style === 1) { b.rect(fx - 1, fy, 3, fh + 3, pal.h); b.rect(fx + fw - 2, fy, 3, fh + 3, pal.h); }
    if (look.style === 2) { b.rect(fx, hairTop + 2, fw, 1, pal.h); }
    if (look.style === 3) { b.rect(fx + fw - 1, fy + 1, 4, 3, pal.h); b.rect(fx + fw + 1, fy + 3, 2, 7, pal.h); }
    if (look.style === 0) { b.rect(fx - 1, fy, 2, 5, pal.h); b.rect(fx + fw - 1, fy, 2, 5, pal.h); }
    // chapéu de ofício
    if (!kid && job) {
      const hx = fx - 2, hy = hairTop - 1, hw = fw + 4;
      if (job === 'mago') { b.rect(hx - 1, hy + 1, hw + 2, 2, pal.c); for (let j = 0; j < 9; j++) b.rect(16 - Math.ceil((9 - j) / 2) + 1, hy - 9 + j, Math.ceil((9 - j)) + 1, 1, pal.c); b.px(18, hy - 6, '#fee761'); }
      if (job === 'soldado') { b.rect(hx, hy - 2, hw, 4, '#a0a8b8'); b.rect(hx, hy - 2, hw, 1, '#d0d8e8'); b.rect(15, hy + 2, 2, 5, '#a0a8b8'); }
      if (job === 'ladrao') { b.rect(hx - 1, hy - 2, hw + 2, 3, pal.d); b.rect(fx - 2, fy, 2, fh, pal.d); b.rect(fx + fw, fy, 2, fh, pal.d); b.rect(fx + 1, ey + 4, fw - 2, 4, pal.d); }
      if (job === 'bardo') { b.rect(hx, hy - 1, hw, 3, pal.c); b.line(hx + hw - 2, hy - 1, hx + hw + 3, hy - 6, '#f4f4f4'); }
      if (job === 'fazendeiro') { b.rect(hx - 3, hy + 1, hw + 6, 2, '#e8c060'); b.rect(hx + 1, hy - 3, hw - 2, 4, '#e8c060'); b.rect(hx + 1, hy, hw - 2, 1, '#c8402c'); }
      if (job === 'sacerdote') { b.rect(hx + 1, hy, hw - 2, 2, '#fee761'); b.px(16, hy - 1, '#fee761'); }
      if (job === 'aventureiro') { b.rect(fx, hy + 2, fw, 2, '#c8402c'); b.rect(fx + fw, hy + 3, 3, 1, '#c8402c'); b.rect(fx + fw + 1, hy + 4, 2, 2, '#c8402c'); }
      if (job === 'mercador') { b.rect(hx + 1, hy - 1, hw - 2, 3, pal.c); b.rect(hx + 1, hy + 1, hw - 2, 1, '#e8c060'); }
    }
    // moldura
    for (let i = 0; i < 32; i++) { b.px(i, 0, '#140c1c'); b.px(i, 31, '#140c1c'); b.px(0, i, '#140c1c'); b.px(31, i, '#140c1c'); }
    return b;
  };

  /* ---------------- céus e paisagens ---------------- */
  const SKY = {
    dia: ['#2b5fd9', '#4a85ee', '#78aaf6', '#a8cdfa', '#d4e8fc'],
    tarde: ['#2c2560', '#5a3478', '#a8487a', '#e87a6a', '#fcbc78'],
    noite: ['#080a20', '#0e1438', '#16205a', '#24306e'],
    sonho: ['#1a0a3a', '#4a1a6a', '#8a3a8a', '#d06aa0'],
    tempestade: ['#2a2e3a', '#3a404e', '#4c5464', '#5e6878'],
  };
  const NIGHT_TINT = (c) => mix(c, '#0a1030', 0.55);
  const DUSK_TINT = (c) => mix(c, '#70305a', 0.22);

  const BIO = {
    floresta: { far: '#5a7a9a', mid: '#2e5a3a', near: '#1f4a2a', ground: '#3f7a32', groundD: '#2e5a26', tree: 'pinho', treeC: '#1e4a2a' },
    montanha: { far: '#7080a8', mid: '#5a6478', near: '#4a5060', ground: '#6a7048', groundD: '#4e5436', snow: true, tree: 'pinho', treeC: '#2a4a3a' },
    costa: { far: '#6a8ab8', mid: '#3a7ab8', near: '#2a5a98', ground: '#e8d098', groundD: '#c8a870', sea: true, tree: 'palmeira', treeC: '#2e7a3a' },
    pantano: { far: '#5a6a68', mid: '#3e5040', near: '#2e3e2e', ground: '#4a5a32', groundD: '#36442a', bog: true, tree: 'morta', treeC: '#3a3428' },
    deserto: { far: '#c88a6a', mid: '#e0a060', near: '#d08a48', ground: '#f0c47a', groundD: '#d8a45a', tree: 'cacto', treeC: '#4a8a3a' },
    planicie: { far: '#7090b8', mid: '#5a9a48', near: '#4a8a3a', ground: '#78b84a', groundD: '#5a9a3a', tree: 'redonda', treeC: '#3a7a32' },
    tundra: { far: '#a0b4cc', mid: '#c8d8e8', near: '#b0c4d8', ground: '#eef4fa', groundD: '#cad8e6', snow: true, tree: 'pinhoneve', treeC: '#2a4a4a' },
  };

  function ridge(b, base, amp, f1, f2, p1, p2, col, top, off) {
    for (let x = 0; x < W; x++) {
      const X = x + (off || 0);
      const h = Math.round(base - amp * (0.6 * Math.sin(X * f1 + p1) + 0.4 * Math.sin(X * f2 + p2)));
      for (let y = h; y < H; y++) b.px(x, y, col);
      if (top) b.px(x, h, top);
    }
  }
  function peaks(b, base, r, col, snow) {
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(r() * W), hh = 18 + Math.floor(r() * 22), w = hh + Math.floor(r() * 10);
      for (let y = 0; y < hh; y++) {
        const half = Math.floor((y / hh) * w * 0.6);
        for (let x = -half; x <= half; x++) {
          const shade = x > half * 0.15 ? dark(col, 0.18) : col;
          b.px(cx + x, base - hh + y, snow && y < hh * 0.3 ? (x > 0 ? '#c8d4e8' : '#f4f8ff') : shade);
        }
      }
    }
  }
  function tree(b, kind, x, yb, c, r) {
    const d = dark(c, 0.3), l = light(c, 0.2);
    if (kind === 'pinho' || kind === 'pinhoneve') {
      const h = 10 + Math.floor(r() * 8);
      b.rect(x, yb - 2, 1, 3, '#4a2e1e');
      for (let j = 0; j < h; j++) { const w = Math.floor((j / h) * 4) + ((j % 3 === 2) ? 1 : 0); for (let i = -w; i <= w; i++) b.px(x + i, yb - h + j - 1, i > 0 ? d : i < 0 && j % 3 === 0 ? l : c); }
      if (kind === 'pinhoneve') for (let j = 0; j < h; j += 3) b.px(x - Math.floor((j / h) * 4), yb - h + j - 1, '#ffffff');
    } else if (kind === 'redonda') {
      b.rect(x, yb - 5, 2, 6, '#5a3a22');
      b.circle(x + 1, yb - 9, 5, c, d); b.px(x - 1, yb - 12, l); b.px(x, yb - 12, l); b.px(x - 2, yb - 11, l);
    } else if (kind === 'palmeira') {
      for (let j = 0; j < 12; j++) b.px(x + Math.floor(j / 5), yb - j, '#8a6a3a');
      const tx = x + 2, ty = yb - 12;
      for (let i = -6; i <= 6; i++) { b.px(tx + i, ty + Math.floor(Math.abs(i) / 2), c); b.px(tx + i, ty + 1 + Math.floor(Math.abs(i) / 2), d); }
    } else if (kind === 'morta') {
      b.line(x, yb, x, yb - 12, c); b.line(x, yb - 8, x - 4, yb - 12, c); b.line(x, yb - 6, x + 3, yb - 10, c); b.line(x + 3, yb - 10, x + 5, yb - 10, c);
    } else if (kind === 'cacto') {
      b.rect(x, yb - 10, 3, 11, c); b.rect(x + 1, yb - 10, 1, 11, light(c, 0.15)); b.rect(x - 3, yb - 7, 3, 2, c); b.rect(x - 3, yb - 10, 2, 3, c); b.rect(x + 3, yb - 5, 3, 2, c); b.rect(x + 4, yb - 8, 2, 3, c);
    }
  }
  function clouds(b, r, t, col, y0) {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const w = 14 + Math.floor(r() * 16), y = y0 + Math.floor(r() * 20);
      const x = Math.floor(((r() * (W + 40) + t * (2 + i * 0.7)) % (W + 40))) - 30;
      b.rect(x + 3, y, w - 6, 2, col); b.rect(x, y + 2, w, 3, col); b.rect(x + 2, y + 5, w - 4, 1, dark(col, 0.12));
      b.rect(x + 5, y - 2, 7, 2, col);
    }
  }
  function stars(b, r, t, yMax) {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * yMax), ph = r() * 6;
      const on = Math.sin(t * 2 + ph) > -0.3;
      b.px(x, y, on ? (i % 5 === 0 ? '#fee761' : '#ffffff') : '#5a6aa0');
      if (i % 9 === 0 && on) { b.px(x - 1, y, '#8a9ad0'); b.px(x + 1, y, '#8a9ad0'); }
    }
  }
  function sky(b, tod, r, t, yMax) {
    b.grad(0, yMax, SKY[tod]);
    if (tod === 'noite' || tod === 'sonho') { stars(b, r, t, yMax); b.circle(130, 16, 7, '#f4f0d8'); b.circle(133, 14, 6, SKY[tod][1]); }
    else if (tod === 'dia') { b.circle(28, 16, 7, '#fff4b0'); b.circle(28, 16, 5, '#ffffff'); clouds(b, r, t, '#ffffff', 8); }
    else if (tod === 'tarde') { b.circle(80, yMax - 6, 12, '#ffd27a'); b.circle(80, yMax - 6, 9, '#fff0b0'); clouds(b, r, t, '#e88a8a', 10); }
    else if (tod === 'tempestade') clouds(b, r, t, '#6a7080', 2);
  }

  function landscape(b, sp, r, t) {
    const bio = BIO[sp.biome] || BIO.planicie;
    const tod = sp.tod;
    b.tint = null;
    sky(b, tod, r, t, 60);
    b.tint = tod === 'noite' ? NIGHT_TINT : tod === 'tarde' ? DUSK_TINT : tod === 'tempestade' ? (c) => mix(c, '#30344a', 0.35) : null;
    if (sp.biome === 'montanha' || sp.biome === 'tundra') peaks(b, 62, r, bio.far, bio.snow);
    else ridge(b, 50, 6, 0.04, 0.09, r() * 6, r() * 6, bio.far, light(bio.far, 0.15));
    if (bio.sea) {
      for (let y = 54; y < 70; y++) for (let x = 0; x < W; x++) {
        const wave = ((x + Math.floor(t * 6) + y * 3) % 23 === 0) || ((x - Math.floor(t * 4) + y * 7) % 31 === 0);
        b.px(x, y, wave ? '#d4ecff' : y < 58 ? '#5a9ad8' : y < 63 ? bio.mid : bio.near);
      }
    } else ridge(b, 60, 4, 0.06, 0.13, r() * 6, r() * 6, bio.mid, light(bio.mid, 0.12));
    if (sp.biome === 'deserto') ridge(b, 66, 3, 0.05, 0.11, r() * 6, r() * 6, bio.near, light(bio.near, 0.2));
    // árvores ao fundo
    const nt = sp.biome === 'deserto' ? 3 : sp.biome === 'floresta' ? 16 : sp.biome === 'costa' ? 3 : 7;
    for (let i = 0; i < nt; i++) tree(b, bio.tree, Math.floor(r() * W), 66 + Math.floor(r() * 4), bio.treeC, r);
    // chão
    b.grad(70, H, [bio.ground, bio.ground, bio.groundD]);
    for (let i = 0; i < 40; i++) { const x = Math.floor(r() * W), y = 71 + Math.floor(r() * 18); b.px(x, y, dark(bio.ground, 0.15)); b.px(x + 1, y, light(bio.ground, 0.15)); }
    b.rect(0, 70, W, 1, light(bio.ground, 0.2));
    if (bio.bog) for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 140), y = 74 + Math.floor(r() * 12), w = 10 + Math.floor(r() * 14); b.rect(x, y, w, 2, '#4a5a4a'); b.rect(x + 2, y, Math.max(1, (w / 3) | 0), 1, Math.sin(t * 3 + i) > 0 ? '#7a8a6a' : '#5a6a5a'); }
    // árvores na frente, nas bordas
    if (sp.biome === 'floresta' || sp.biome === 'tundra' || sp.biome === 'montanha') { tree(b, bio.tree, 4, 84, dark(bio.treeC, 0.1), r); tree(b, bio.tree, 154, 86, dark(bio.treeC, 0.1), r); }
    b.tint = null;
  }

  /* ---------------- interiores ---------------- */
  function planks(b, y0, y1, c) { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) b.px(x, y, (y - y0) % 6 === 0 ? dark(c, 0.35) : ((x + Math.floor((y - y0) / 6) * 17) % 37 === 0 ? dark(c, 0.25) : y % 6 === 1 ? light(c, 0.08) : c)); }
  function bricks(b, y0, y1, c, x0 = 0, x1 = W) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const row = Math.floor(y / 6); const edge = y % 6 === 0 || (x + (row % 2) * 8) % 16 === 0; b.px(x, y, edge ? dark(c, 0.3) : (x * 7 + y * 13) % 11 === 0 ? light(c, 0.08) : c); } }
  function flame(b, x, y, t, s) {
    s = s || 1;
    const f = Math.floor(t * 10) % 3;
    const cols = ['#e43b44', '#f77622', '#feae34', '#fee761'];
    for (let i = 0; i < 4; i++) { const hh = (4 - i) * s + ((f + i) % 2); b.rect(x - (3 - i) * s + 1, y - hh * 2 + 1, Math.max(1, (3 - i) * 2 * s - 1), hh * 2, cols[i]); }
  }
  function lantern(b, x, y, t, i) { b.line(x, 0, x, y, '#3a2a20'); b.rect(x - 2, y, 5, 5, '#3a2a20'); b.rect(x - 1, y + 1, 3, 3, Math.sin(t * 5 + i) > -0.6 ? '#fee761' : '#feae34'); }

  function interior(b, sp, r, t) {
    const k = sp.kind;
    if (k === 'taverna') {
      planks(b, 0, 64, '#7a4a2a');
      for (let i = 0; i < 3; i++) lantern(b, 30 + i * 50, 10, t, i);
      b.rect(0, 64, W, 26, '#4a2c1a'); planks(b, 64, 90, '#5a3620');
      b.rect(96, 50, 64, 18, '#5a3216'); b.rect(96, 50, 64, 3, '#8a5a2a'); // balcão
      for (let i = 0; i < 2; i++) { const x = 104 + i * 22; b.rect(x, 32, 14, 16, '#8a5a2a'); b.rect(x, 36, 14, 2, '#3a2a20'); b.rect(x, 43, 14, 2, '#3a2a20'); b.rect(x + 5, 40, 3, 2, '#c99a2e'); }
      draw(b, S.caneca, 140, 41, { y: '#feae34', Y: '#fee761', w: '#ffffff' });
    } else if (k === 'templo') {
      bricks(b, 0, 70, '#8a8aa0');
      // vitral
      const wx = 66, wy = 8;
      b.rect(wx, wy + 6, 28, 34, '#2a2a3a');
      b.circle(wx + 14, wy + 8, 14, '#2a2a3a');
      const glass = ['#e43b44', '#3a6ec8', '#fee761', '#3ea84a', '#b55088'];
      for (let y = wy - 4; y < wy + 38; y++) for (let x = wx + 2; x < wx + 26; x++) { const dx = x - (wx + 14), dy = y - (wy + 8); if (y < wy + 8 && dx * dx + dy * dy > 11 * 11) continue; const cell = (Math.floor(x / 5) + Math.floor(y / 6) * 3) % glass.length; b.px(x, y, (x % 5 === 0 || y % 6 === 0) ? '#1a1a2a' : Math.sin(t * 1.5 + cell) > 0.6 ? light(glass[cell], 0.3) : glass[cell]); }
      for (const px of [20, 128]) { b.rect(px, 4, 12, 66, '#b0b0c4'); b.rect(px, 4, 3, 66, '#d0d0e0'); b.rect(px + 9, 4, 3, 66, '#7a7a90'); b.rect(px - 2, 2, 16, 4, '#d0d0e0'); }
      b.rect(0, 70, W, 20, '#5a4a6a'); for (let x = 0; x < W; x += 16) b.rect(x, 70, 1, 20, '#4a3a5a');
      b.rect(60, 58, 40, 12, '#e8e0c8'); b.rect(60, 58, 40, 2, '#ffffff'); b.rect(58, 68, 44, 2, '#b0a890');
      for (const cx of [66, 94]) { b.rect(cx, 52, 2, 6, '#f4f0e0'); flame(b, cx + 1, 52, t, 0.5); }
    } else if (k === 'casa') {
      planks(b, 0, 66, '#9a6a3a');
      // janela
      b.rect(18, 12, 34, 28, '#3a2a1a');
      b.grad(14, 38, sp.tod === 'noite' || sp.tod === 'tempestade' ? SKY.noite : SKY.dia, 20, 50);
      b.rect(34, 14, 2, 24, '#3a2a1a'); b.rect(20, 25, 30, 2, '#3a2a1a'); b.rect(16, 40, 38, 3, '#6a4a2a');
      // lareira
      bricks(b, 0, 66, '#9a5a4a', 98, 146);
      b.rect(106, 40, 32, 26, '#1a1010'); b.rect(106, 40, 32, 2, '#3a2020');
      flame(b, 122, 64, t, 1.6);
      b.rect(94, 34, 56, 4, '#5a3a2a'); b.rect(94, 34, 56, 1, '#8a5a3a');
      b.rect(100, 28, 4, 6, '#c8402c'); b.rect(136, 30, 6, 4, '#e8e0c8');
      // chão e mesa
      planks(b, 66, 90, '#6a4628');
      b.rect(56, 58, 30, 3, '#5a3216'); b.rect(58, 61, 2, 9, '#5a3216'); b.rect(82, 61, 2, 9, '#5a3216');
      b.rect(62, 54, 5, 4, '#e8e0c8'); b.rect(72, 55, 6, 3, '#c8402c');
    } else if (k === 'biblioteca') {
      b.rect(0, 0, W, 90, '#2a1a3a');
      const spines = ['#c8402c', '#3a6ec8', '#3ea84a', '#feae34', '#8a4ab8', '#e8e0c8', '#b55088'];
      for (let sh = 0; sh < 4; sh++) {
        const y = 6 + sh * 16;
        b.rect(0, y + 12, W, 3, '#5a3a22');
        for (let x = 2; x < W - 2;) { const w = 2 + Math.floor(r() * 3), h = 8 + Math.floor(r() * 4); const c = spines[Math.floor(r() * spines.length)]; b.rect(x, y + 12 - h, w, h, c); b.rect(x, y + 12 - h, 1, h, light(c, 0.2)); x += w + (r() < 0.15 ? 3 : 0); }
      }
      b.rect(0, 70, W, 20, '#3a2a4a');
      b.dith(0, 66, W, 6, '#2a1a3a', '#3a2a4a', 0.5);
      for (let i = 0; i < 14; i++) { const a = t * 0.8 + i; b.px(80 + Math.cos(a) * (20 + i * 2), 40 + Math.sin(a * 1.3) * 12, i % 2 ? '#fee761' : '#b0a0ff'); }
    } else if (k === 'caverna') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = Math.sin(x * 0.3 + y * 0.2) + Math.sin(x * 0.13 - y * 0.31) + (r() * 0.6); b.px(x, y, n > 1.2 ? '#4a4258' : n > 0 ? '#352f44' : '#26212f'); }
      for (let i = 0; i < 10; i++) { const x = Math.floor(r() * W), h = 4 + Math.floor(r() * 10); for (let j = 0; j < h; j++) b.rect(x - Math.floor((h - j) / 4), j, Math.floor((h - j) / 2) + 1, 1, '#1a1622'); }
      b.grad(70, H, ['#3a3448', '#2a2436']);
      for (const tx of [20, 140]) { b.rect(tx, 30, 2, 8, '#6a4a2a'); flame(b, tx + 1, 30, t, 0.6); }
    }
  }

  /* ---------------- cenas compostas ---------------- */
  function houses(b, r, y, night, t) {
    const roofs = ['#a83a3a', '#3a5aa8', '#6a4a8a', '#3a7a4a', '#8a5a2a'];
    for (let x = -4; x < W;) {
      const w = 18 + Math.floor(r() * 10), h = 12 + Math.floor(r() * 8), rc = roofs[Math.floor(r() * roofs.length)];
      const wall = night ? '#6a6070' : '#e8dcc0';
      b.rect(x, y - h, w, h, wall); b.rect(x, y - h, 1, h, dark(wall, 0.3)); b.rect(x + w - 1, y - h, 1, h, dark(wall, 0.3));
      for (let j = 0; j < 7; j++) b.rect(x - 2 + j, y - h - 7 + j, w + 4 - j * 2, 1, j === 0 ? light(rc, 0.2) : rc);
      const lit = night && Math.sin(t * 0.5 + x) > -0.5;
      b.rect(x + 4, y - h + 4, 4, 4, lit ? '#fee761' : '#3a4a6a'); if (w > 20) b.rect(x + w - 8, y - h + 4, 4, 4, lit ? '#feae34' : '#3a4a6a');
      b.rect(x + Math.floor(w / 2) - 2, y - 7, 5, 7, '#5a3a22');
      x += w + 2 + Math.floor(r() * 6);
    }
  }

  function composite(b, sp, r, t) {
    const k = sp.kind;
    if (['taverna', 'templo', 'casa', 'biblioteca', 'caverna'].includes(k)) return interior(b, sp, r, t);
    if (k === 'sonho') {
      sky(b, 'sonho', r, t, H);
      for (let i = 0; i < 5; i++) { const x = 15 + i * 32, y = 50 + Math.sin(t + i) * 4; b.rect(x, y, 18, 4, '#6a3a8a'); b.rect(x + 2, y + 4, 14, 3, '#4a2a6a'); b.rect(x + 5, y + 7, 8, 2, '#3a1a5a'); }
      return;
    }
    if (k === 'mar') {
      sky(b, sp.tod, r, t, 50);
      b.tint = sp.tod === 'noite' ? NIGHT_TINT : null;
      ridge(b, 48, 2, 0.05, 0.1, r() * 6, 1, '#4a6a8a');
      for (let y = 50; y < H; y++) for (let x = 0; x < W; x++) { const s = (x * 3 + y * 11 + Math.floor(t * 8) * (y % 2 ? 1 : -1)) % 29; b.px(x, y, s === 0 ? '#d4ecff' : y < 56 ? '#4a8ad0' : y < 68 ? '#2e6ab8' : '#1e4a90'); }
      // barco
      const bx = 96, by = 62 + Math.round(Math.sin(t * 2));
      b.rect(bx, by, 30, 4, '#6a3a1a'); b.rect(bx + 2, by + 4, 26, 2, '#4a2a12'); b.rect(bx + 14, by - 22, 2, 22, '#4a2a12');
      for (let j = 0; j < 18; j++) b.rect(bx + 16, by - 21 + j, Math.floor(j * 0.7) + 1, 1, '#f4f0e0');
      b.tint = null;
      return;
    }
    if (k === 'cemiterio') {
      sky(b, 'noite', r, t, 62);
      b.tint = NIGHT_TINT;
      ridge(b, 58, 4, 0.05, 0.1, r() * 6, 2, '#2a3a2a');
      b.grad(66, H, ['#3a4a3a', '#2a3a2a']);
      b.tint = null;
      for (let i = 0; i < 5; i++) draw(b, S.tumulo, 6 + i * 31 + Math.floor(r() * 6), 56 + (i % 2) * 6, { a: '#8a8aa0', b: '#6a6a80', c: '#b0b0c4', g: '#2a3a2a' });
      for (let x = 0; x < W; x++) { const f = 0.35 + 0.25 * Math.sin(x * 0.08 + t); for (let y = 74; y < 82; y++) if (f > BAYER[y & 3][x & 3]) b.px(x, y, '#8a9ab0'); }
      return;
    }
    // exteriores com o bioma atual
    landscape(b, Object.assign({}, sp, { biome: sp.kind === 'cidade' || sp.kind === 'mercado' || sp.kind === 'festa' ? (sp.biome === 'deserto' || sp.biome === 'tundra' || sp.biome === 'costa' ? sp.biome : 'planicie') : sp.biome }), r, t);
    if (k === 'cidade' || k === 'mercado' || k === 'festa') {
      b.tint = sp.tod === 'noite' ? NIGHT_TINT : null;
      houses(b, r, 70, sp.tod === 'noite', t);
      b.tint = null;
      b.rect(0, 70, W, 20, '#8a8070'); for (let y = 72; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) b.rect(x, y, 7, 3, '#9a9080');
    }
    if (k === 'mercado') for (let i = 0; i < 3; i++) { const x = 8 + i * 52, c = ['#c8402c', '#3a6ec8', '#3ea84a'][i]; for (let s = 0; s < 22; s += 4) b.rect(x + s, 58, 4, 4, s % 8 ? '#f4f0e0' : c); b.rect(x, 62, 1, 12, '#5a3a22'); b.rect(x + 23, 62, 1, 12, '#5a3a22'); b.rect(x, 70, 24, 4, '#8a5a2a'); for (let f = 0; f < 5; f++) b.rect(x + 2 + f * 4, 68, 3, 2, ['#e43b44', '#feae34', '#3ea84a', '#fee761', '#b55088'][f]); }
    if (k === 'festa') {
      const cols = ['#e43b44', '#feae34', '#3ea84a', '#3a6ec8', '#b55088'];
      for (let x = 0; x < W; x++) { const y = 24 + Math.round(Math.sin(x * 0.07) * 4); b.px(x, y, '#3a2a20'); if (x % 8 === 0) { const c = cols[(x / 8 + Math.floor(t * 3)) % cols.length]; b.rect(x - 1, y + 1, 3, 3, c); } }
      if (sp.tod === 'noite') for (let i = 0; i < 2; i++) { const ph = (t * 0.7 + i * 0.5) % 1.5; if (ph < 1) { const cx = 40 + i * 80, cy = 14 + i * 4; for (let a = 0; a < 12; a++) { const ang = (a / 12) * Math.PI * 2; b.px(cx + Math.cos(ang) * ph * 14, cy + Math.sin(ang) * ph * 10, cols[(a + i) % 5]); } } }
    }
    if (k === 'batalha') {
      for (let i = 0; i < 3; i++) draw(b, S.bandeira, 30 + i * 50, 48 + (i % 2) * 4, { a: i === 1 ? '#3a6ec8' : '#c8402c', c: '#fee761' });
      for (let i = 0; i < 30; i++) { const x = (i * 37 + Math.floor(t * 4)) % W, y = 40 + ((i * 13) % 26) - Math.floor((t * 3 + i) % 10); b.px(x, y, '#a0a0a8'); b.px(x + 1, y, '#80808a'); }
    }
    if (k === 'ruina') {
      for (const [x, h] of [[18, 22], [40, 14], [118, 26], [140, 12]]) { b.rect(x, 70 - h, 9, h, '#9a9488'); b.rect(x, 70 - h, 2, h, '#bab4a8'); b.rect(x + 7, 70 - h, 2, h, '#7a7468'); b.rect(x - 1, 70 - h - 2, 11, 2, '#bab4a8'); }
      b.rect(52, 66, 20, 4, '#9a9488'); b.rect(96, 67, 12, 3, '#8a8478');
    }
    if (sp.weather === 'chuva' || sp.weather === 'neve') {
      for (let i = 0; i < 70; i++) {
        const sp2 = sp.weather === 'chuva' ? 60 : 12;
        const x = (i * 23 + Math.floor(t * (sp.weather === 'chuva' ? 20 : 4))) % W;
        const y = (i * 37 + Math.floor(t * sp2)) % H;
        if (sp.weather === 'chuva') { b.px(x, y, '#a8c8f0'); b.px(x - 1, y + 1, '#7898c0'); } else b.px(x + Math.round(Math.sin(t + i)), y, '#ffffff');
      }
    }
  }

  /* ---------------- figuras em primeiro plano ---------------- */
  const CRI_COLORS = {
    lobo: '#7a7a8a', 'lobo branco': '#e8eef4', urso: '#6a4a2a', 'urso polar': '#f0f4f8', javali: '#5a3a2a', lince: '#c8a060', 'cabra montesa': '#d8d0c0',
    'touro bravo': '#3a2a2a', chacal: '#c8a070', crocodilo: '#4a7a3a', mamute: '#7a5a3a', 'sapo-rei': '#5a9a3a', 'caranguejo gigante': '#c8402c',
    'águia gigante': '#8a6a3a', grifo: '#c8a050', 'gaivota monstruosa': '#e8e8f0', troll: '#6a8a5a', ogro: '#9a8a5a', 'golem de pedra': '#8a8a90',
    gárgula: '#6a6a7a', yeti: '#e0e8f0', 'verme da areia': '#c89a6a', 'escorpião gigante': '#8a3a2a', hidra: '#3a7a5a', 'serpente marinha': '#2a6a8a',
    'aranha gigante': '#3a2a3a', 'sanguessuga gigante': '#5a3a4a', 'árvore desperta': '#5a7a3a', 'espantalho vivo': '#c8a050', múmia: '#d8ccb0',
    'fogo-fátuo': '#a0e8ff', sereia: '#8ad0e0', afogado: '#7aa0a8', 'espírito do gelo': '#c8f0ff', 'gênio rancoroso': '#6a8ae8',
  };
  function creaturePal(c) {
    let base = CRI_COLORS[c.base] || '#7a7a8a';
    if (/albin/.test(c.adj)) base = '#f0f0f4';
    if (/sombri|amaldiçoad/.test(c.adj)) base = mix(base, '#3a1a4a', 0.5);
    if (/pestilent/.test(c.adj)) base = mix(base, '#7a9a2a', 0.45);
    return { a: base, b: dark(base, 0.25), c: light(base, 0.35), e: /olhos vermelhos|amaldiçoad|enfurecid/.test(c.adj) ? '#ff3030' : '#fee761', w: '#ffffff' };
  }
  function creatureSprite(c) {
    if (/dragão|hidra|serpente|verme/.test(c.base)) return 'dragao';
    if (c.tipo === 'espirito') return 'espirito';
    if (c.tipo === 'gente') return 'gente';
    if (c.tipo === 'monstro' && !/aranha|escorpião|sanguessuga|caranguejo/.test(c.base)) return 'monstro';
    return 'fera';
  }

  function figure(b, sp, t, look, s) {
    const bob = Math.floor(t * 2) % 2;
    const f = sp.fig;
    const gx = 112, gy = 70;
    const sprBottom = (x, sprite, pal, flip, dy) => draw(b, sprite, x, gy - sprite.h + (dy || 0), pal, flip);
    if (!f) return;
    if (f.t === 'criatura') {
      const kind = creatureSprite(f.c), pal = creaturePal(f.c);
      if (kind === 'gente') A.hero(b, gx, gy - 16, f.look, { job: 'ladrao', flip: true, pal: { c: pal.a, d: pal.b } });
      else if (kind === 'dragao') sprBottom(gx - 8, S.dragao, Object.assign({}, pal, { b: dark(pal.a, 0.15), c: light(pal.a, 0.4) }), false, bob);
      else if (kind === 'espirito') { b.tint = null; sprBottom(gx, S.espirito, pal, false, -6 + Math.round(Math.sin(t * 3) * 2)); }
      else sprBottom(gx, S[kind], pal, false, bob);
      return;
    }
    if (f.t === 'pessoa') { A.hero(b, gx, gy - 16 + (bob && f.idle ? 0 : 0), f.look, Object.assign({ flip: true }, f.opt)); return; }
    if (f.t === 'dragao') { sprBottom(gx - 10, S.dragao, { a: '#c8402c', b: '#8a2a2a', c: '#feae34', e: '#fee761', w: '#ffffff' }, false, bob); return; }
    if (f.t === 'fantasma') { sprBottom(gx, S.espirito, { a: '#d8e8ff', b: '#a0b0d0', c: '#ffffff', e: '#2a2a4a' }, false, -6 + Math.round(Math.sin(t * 3) * 2)); return; }
    if (f.t === 'cao') { sprBottom(gx, S.fera, { a: '#b07a3a', b: '#8a5a2a', c: '#d0a060', e: '#140c1c', w: '#ffffff' }, false, 0); return; }
    if (f.t === 'cavalo') { sprBottom(gx, S.fera, { a: '#3a2a2a', b: '#2a1a1a', c: '#6a5a5a', e: '#ffffff', w: '#3a2a2a' }, false, 0); b.rect(gx + 3, gy - 12, 2, 2, '#ffffff'); return; }
    if (f.t === 'gato') { sprBottom(gx + 2, S.gato, { a: '#2a2430', g: '#7ae04a', w: '#e88a8a' }, false, 0); return; }
    if (f.t === 'bebe') { sprBottom(gx, S.berco, { s: look.skin, e: '#140c1c', w: '#f4f0e0', b: '#8a5a2a', c: '#feae34' }); return; }
    if (f.t === 'bau') { sprBottom(gx, S.bau, { b: '#8a5a2a', y: '#fee761' }); if (Math.floor(t * 3) % 3 === 0) b.px(gx + 3, gy - 10, '#ffffff'); return; }
    if (f.t === 'livro') { sprBottom(gx, S.livro, { a: '#8a3a2a', w: '#f4f0e0' }, false, -10 + Math.round(Math.sin(t * 2) * 2)); return; }
    if (f.t === 'cristal') { sprBottom(gx + 2, S.cristal, { a: '#8ad0f0', b: '#4a8ac0', c: '#e0f4ff' }, false, -8 + Math.round(Math.sin(t * 2) * 2)); return; }
    if (f.t === 'quadro') { sprBottom(gx, S.quadro, { b: '#8a5a2a', w: '#f4f0e0' }); return; }
    if (f.t === 'caldeirao') { sprBottom(gx, S.caldeirao, { a: '#3a3a44', c: '#6a6a78', g: Math.floor(t * 4) % 2 ? '#7ae04a' : '#3ea84a' }); flame(b, gx + 6, gy, t, 0.6); return; }
    if (f.t === 'tumulo') { sprBottom(gx, S.tumulo, { a: '#8a8aa0', b: '#6a6a80', c: '#b0b0c4', g: '#3a5a3a' }); return; }
    if (f.t === 'fogueira') { b.rect(gx - 2, gy - 3, 14, 3, '#6a3a1a'); b.line(gx - 2, gy - 1, gx + 12, gy - 4, '#4a2a12'); flame(b, gx + 5, gy - 2, t, 1); return; }
    if (f.t === 'coracao') { draw(b, spr(ICONS.heart), gx + 2, gy - 30 + Math.round(Math.sin(t * 3) * 2), ICON_PAL); draw(b, spr(ICONS.heart), gx + 12, gy - 22 + Math.round(Math.cos(t * 3) * 2), ICON_PAL); }
    if (f.t === 'moedas') { for (let i = 0; i < 5; i++) draw(b, spr(ICONS.coin), gx + (i % 3) * 7, gy - 8 - Math.floor(i / 3) * 6, ICON_PAL); }
    if (f.t === 'sombra') { for (let y = 0; y < 18; y++) for (let x = 0; x < 12; x++) if ((x - 6) ** 2 / 36 + (y - 9) ** 2 / 81 < 1 && (x + y + Math.floor(t * 4)) % 2) b.px(gx + x, gy - 18 + y, '#140c1c'); }
  }

  /* ---------------- escolha da cena para cada evento ---------------- */
  const RULES = [
    [/drag[aã]o/, 'outdoor', { t: 'dragao' }, 'tarde'],
    [/taverna|estalagem|dados|bebida|caneca|aposta_dados/, 'taverna'],
    [/cemit[eé]rio|morte_velhice|viuvez/, 'cemiterio', { t: 'tumulo' }],
    [/fantasma|assombrad|esp[ií]rito/, 'casa', { t: 'fantasma' }, 'noite'],
    [/templo|sacerdote|coro|santu[aá]rio|milagre|exorcismo|heresia|peregrino/, 'templo'],
    [/biblioteca|livro|mago_|feiti[cç]|arcan|grim[oó]rio|aprender_ler/, 'biblioteca', { t: 'livro' }],
    [/caverna|masmorra|eco|mina/, 'caverna', { t: 'bau' }],
    [/barco|balsa|garrafa|naufr|mar[ ,.]|tesouro_rio|travessia|rio_proibido/, 'mar'],
    [/batalha|guerra|cerco|torneio|duelo|recrut|soldado|desert/, 'batalha'],
    [/festa|baile|festival|circo|anivers/, 'festa'],
    [/mercad|caravana|feira|imposto|padaria|doces|mascate|artefato|alaúde|luthier|espelho/, 'mercado'],
    [/fazenda|colheita|arado|galinha/, 'outdoor', { t: 'fogueira' }],
    [/nasc|beb[eê]|irmao_nasce|filho_nasce|neto|berço/, 'casa', { t: 'bebe' }],
    [/casamento|amor|beijo|romance|paix/, 'outdoor', { t: 'coracao' }, 'tarde'],
    [/c[aã]o|cachorro/, 'outdoor', { t: 'cao' }],
    [/gato/, 'casa', { t: 'gato' }],
    [/cavalo/, 'outdoor', { t: 'cavalo' }],
    [/tesouro|heran[cç]a|mapa|ba[uú]/, 'outdoor', { t: 'bau' }],
    [/bruxa|feiticeira|maldi[cç]/, 'outdoor', { t: 'caldeirao' }, 'noite'],
    [/sonho|vidente|profecia|estrela/, 'sonho', { t: 'cristal' }],
    [/doen[cç]a|febre|peste|sa[uú]de|testamento|mem[oó]rias|casa|fam[ií]lia|prim|crise/, 'casa'],
    [/rei|corte|conselho|convite/, 'cidade'],
    [/tempestade|chuva|terremoto|eclipse|incendio/, 'outdoor', null, 'tempestade', 'chuva'],
  ];

  A.specFor = function (s, inst) {
    const reg = s.world.regions[s.reg];
    const key = inst.key || inst.id;
    const r = rng(hash(key + ':' + s.turn));
    const sp = { kind: 'outdoor', biome: reg.biome, tod: r() < 0.6 ? 'dia' : r() < 0.6 ? 'tarde' : 'noite', fig: null, weather: null, seed: hash(key + s.name) };
    const pref = String(key).split(':')[0];
    const quem = () => A.newLook(key + 'npc', r() < 0.5 ? 'm' : 'f');
    if (pref === 'cri') {
      const c = inst.e && inst.e.art && inst.e.art.c;
      sp.fig = { t: 'criatura', c: c || { base: 'lobo', adj: 'faminto', tipo: 'fera' }, look: quem() };
    } else if (pref === 'viaj') sp.fig = { t: 'pessoa', look: quem(), opt: { hat: null, staff: true, pal: { c: '#6a5a4a', d: '#4a3a2a' } } };
    else if (pref === 'masc') { sp.kind = r() < 0.5 ? 'outdoor' : 'mercado'; sp.fig = { t: 'pessoa', look: quem(), opt: { job: 'mercador', pack: true } }; }
    else if (pref === 'lug') { sp.kind = /caverna|mina|cripta|poço/.test(inst.text) ? 'caverna' : 'ruina'; sp.fig = { t: r() < 0.5 ? 'bau' : 'cristal' }; }
    else if (pref === 'mis') { sp.kind = 'cidade'; sp.fig = { t: 'quadro' }; }
    else if (pref === 'fes') { sp.kind = 'festa'; sp.tod = r() < 0.5 ? 'noite' : 'tarde'; }
    else if (pref === 'son') { sp.kind = 'sonho'; sp.fig = { t: 'cristal' }; }
    else if (pref === 'brin') { sp.fig = { t: 'pessoa', look: quem(), opt: { stage: 'inf', hat: null } }; sp.tod = 'dia'; }
    else if (pref === 'cli') { sp.tod = 'tempestade'; sp.weather = /inverno|neve/.test(inst.text) || reg.biome === 'tundra' ? 'neve' : /seca/.test(inst.text) ? null : 'chuva'; if (/seca/.test(inst.text)) sp.tod = 'dia'; }
    else {
      const hay = (inst.id + ' ' + inst.text).toLowerCase();
      for (const [re, kind, fig, tod, weather] of RULES) {
        if (re.test(hay)) { sp.kind = kind; if (fig) sp.fig = fig; if (tod) sp.tod = tod; if (weather) sp.weather = weather; break; }
      }
      if (/noite|lua|madrugada/.test(hay) && sp.kind === 'outdoor') sp.tod = 'noite';
      if (!sp.fig && /\{npc\}|um estranho|uma mulher|um velho|mendigo|escriba|nobre|mentor|recrutador|valent|rival|amigo/.test(inst.e && typeof inst.e.text === 'string' ? inst.e.text : hay)) sp.fig = { t: 'pessoa', look: quem(), opt: {} };
    }
    if (reg.biome === 'tundra' && !sp.weather && sp.kind === 'outdoor' && r() < 0.5) sp.weather = 'neve';
    return sp;
  };

  /* ---------------- renderização ---------------- */
  A.render = function (cv, sp, t, s) {
    const b = new Buf(W, H);
    const r = rng(sp.seed);
    composite(b, sp, r, t);
    const st = s ? G.stage(s) : 'adu';
    if (s && !sp.noHero) A.hero(b, 26, 54, s.look, { job: s.job, stage: st });
    figure(b, sp, t, s ? s.look : {}, s);
    if (sp.flash) { const f = sp.flash; for (let i = 0; i < b.d.length; i += 1) if (((i % W) + Math.floor(i / W)) % 2 === 0) b.d[i] = u32(f); }
    return b.toCanvas(cv);
  };

  A.renderTitle = function (cv, t, seed) {
    const b = new Buf(W, H);
    const r = rng(seed);
    const biomes = Object.keys(BIO);
    landscape(b, { biome: biomes[seed % biomes.length], tod: 'tarde' }, r, t);
    const look = A.newLook('titulo' + seed, seed % 2 ? 'm' : 'f');
    A.hero(b, 72, 54, look, { job: 'aventureiro', stage: 'jov' });
    return b.toCanvas(cv);
  };

  A.renderGrave = function (cv, s, t) {
    const b = new Buf(W, H);
    const r = rng(hash(s.name + 'grave'));
    sky(b, 'noite', r, t, 62);
    b.tint = NIGHT_TINT;
    ridge(b, 58, 4, 0.05, 0.1, r() * 6, 2, '#2a3a2a');
    b.grad(66, H, ['#3a4a3a', '#2a3a2a']);
    tree(b, 'morta', 14, 66, '#3a3428', r); tree(b, 'morta', 148, 68, '#3a3428', r);
    b.tint = null;
    const small = { a: '#6a6a80', b: '#4a4a60', c: '#8a8aa0', g: '#2a3a2a' };
    for (const [x, y] of [[22, 58], [42, 62], [108, 62], [128, 58]]) draw(b, S.tumulo, x, y, small);
    // o túmulo do personagem, maior e com flores
    draw(b, S.tumulo, 68, 44, { a: '#b0b0c4', b: '#80809a', c: '#e0e0f0', g: '#3a5a3a' }, false, 2);
    for (const [fx, fc] of [[66, '#e43b44'], [70, '#fee761'], [90, '#b55088'], [94, '#e43b44']]) { b.px(fx, 66, '#3ea84a'); b.px(fx, 65, fc); }
    for (let x = 0; x < W; x++) { const f = 0.3 + 0.25 * Math.sin(x * 0.08 + t); for (let y = 76; y < 84; y++) if (f > BAYER[y & 3][x & 3]) b.px(x, y, '#8a9ab0'); }
    // alma subindo
    for (let i = 0; i < 6; i++) { const y = 40 - ((t * 6 + i * 7) % 34), x = 80 + Math.sin(t * 1.5 + i) * 5; b.px(x, y, i % 2 ? '#e0e8ff' : '#fee761'); }
    return b.toCanvas(cv);
  };

  A.portraitCanvas = function (cv, s) {
    return A.portrait(s.look, s.job, G.stage(s)).toCanvas(cv);
  };
})();
