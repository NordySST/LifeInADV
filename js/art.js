/* Mil Vidas — arte em pixel "pintada".
 * Tudo é gerado por código, sem imagens externas:
 *  - paisagens com ruído fractal, rampas de cor com variação de matiz, névoa atmosférica e luz;
 *  - interiores iluminados por velas, lareiras e janelas;
 *  - criaturas e pessoas montadas com formas 3D sombreadas e reduzidas a pixels, com contorno;
 *  - bordas de ilustração "rasgadas", como num livro antigo.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const A = (G.art = {});
  const W = 192, H = 120;
  const SPR = 1.2; // escala dos personagens nas cenas
  A.W = W; A.H = H;

  /* ======================= utilidades ======================= */
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  A.hash = hash; A.rng = rng;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

  const hexCache = new Map();
  function rgb(h) { let v = hexCache.get(h); if (!v) { const n = parseInt(h.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; hexCache.set(h, v); } return v; }
  const pack = (c) => ((255 << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0;
  const unpack = (u) => [u & 255, (u >>> 8) & 255, (u >>> 16) & 255];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const toHex = (c) => '#' + ((1 << 24) | (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2])).toString(16).slice(1);
  const ramp = (list) => list.map(rgb);
  // rampa com variação de matiz: sombras puxam para o roxo, luzes para o amarelo
  function rampFrom(hex, n = 7, sh = '#1e1430', hi = '#fff1c8', hiAmt = 0.5) {
    const b = rgb(hex), s = rgb(sh), h = rgb(hi), out = [];
    for (let i = 0; i < n; i++) { const v = (i / (n - 1)) * 2 - 1; out.push(v < 0 ? mixc(b, s, -v * 0.8) : mixc(b, h, v * hiAmt)); }
    return out;
  }
  A.mix = (a, b, f) => toHex(mixc(rgb(a), rgb(b), f));
  A.dark = (c, f) => A.mix(c, '#140c1c', f == null ? 0.35 : f);
  A.light = (c, f) => A.mix(c, '#ffffff', f == null ? 0.3 : f);

  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
  const bay = (x, y) => BAY[y & 3][x & 3];
  function shade(rp, v, x, y) {
    v = clamp(v);
    const t = v * (rp.length - 1), i = Math.floor(t);
    if (i >= rp.length - 1) return rp[rp.length - 1];
    return t - i > bay(x, y) ? rp[i + 1] : rp[i];
  }
  const qa = (a, x, y, steps = 5) => Math.floor(clamp(a) * steps + bay(x, y)) / steps;

  function Noise(seed) {
    const r = rng(seed), p = [];
    for (let i = 0; i < 256; i++) p.push(i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const perm = new Uint16Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const val = new Float32Array(256); for (let i = 0; i < 256; i++) val[i] = r();
    const n2 = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      const a = val[perm[perm[X] + Y]], b = val[perm[perm[X + 1] + Y]], c = val[perm[perm[X] + Y + 1]], d = val[perm[perm[X + 1] + Y + 1]];
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x, y, o = 4) => { let s = 0, a = 1, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; };
    return { n2, fbm };
  }
  const NZ = Noise(7);

  /* ======================= buffer ======================= */
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
    set(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = pack(c); }
    px(x, y, hex) { if (hex) this.set(x, y, rgb(hex)); }
    get(x, y) { return unpack(this.d[(y | 0) * this.w + (x | 0)]); }
    mix(x, y, c, a) {
      x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
      const i = y * this.w + x, o = this.d[i];
      this.d[i] = o >>> 24 ? pack(mixc(unpack(o), c, Math.min(1, a))) : pack(c);
    }
    rect(x, y, w, h, hex) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, hex); }
    blit(s, x, y, flip) {
      x |= 0; y |= 0;
      for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
        const u = s.d[j * s.w + i]; if (!(u >>> 24)) continue;
        const X = x + (flip ? s.w - 1 - i : i), Y = y + j;
        if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = u;
      }
    }
    toCanvas(cv) {
      cv.width = this.w; cv.height = this.h;
      const cx = cv.getContext('2d'), img = cx.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      cx.putImageData(img, 0, 0);
      return cv;
    }
  }
  A.Buf = Buf;

  /* ======================= ícones da interface ======================= */
  function spr(rows) { return { rows, w: Math.max(...rows.map((r) => r.length)), h: rows.length }; }
  function draw(b, s, x, y, pal, flip) {
    for (let j = 0; j < s.h; j++) for (let i = 0; i < s.rows[j].length; i++) {
      const ch = s.rows[j][i]; if (ch === '.' || ch === ' ') continue;
      const c = ch === 'k' ? pal.k || '#2a1a14' : pal[ch];
      if (c) b.px(flip ? x + s.w - 1 - i : x + i, y + j, c);
    }
  }
  const ICONS = {
    heart: ['.kk...kk.', 'kRwk.kRRk', 'kRRRkRRRk', 'kRRRRRRrk', '.kRRRRrk.', '..kRRrk..', '...kRk...', '....k....'],
    half: ['.kk...kk.', 'kRwk.kggk', 'kRRRkgggk', 'kRRRRgggk', '.kRRRggk.', '..kRRgk..', '...kRk...', '....k....'],
    empty: ['.kk...kk.', 'kggk.kggk', 'kgggkgggk', 'kgggggggk', '.kgggggk.', '..kgggk..', '...kgk...', '....k....'],
    coin: ['..kkkk..', '.kYYyyk.', 'kYyyyyok', 'kYyyyyok', 'kyyyyyok', 'kyyyyook', '.kooook.', '..kkkk..'],
    for: ['......kkk', '.....kwlk', '....kwlk.', '...kwlk..', 'k.kwlk...', 'kkwlk....', '.kyk.....', 'kykkk....', 'kk.......'],
    agi: ['.....k.k.', '....kwkwk', '..kkkwwk.', '.kbbbkk..', '.kbbbk...', '.kbbbk...', '.kbbbbkk.', '.kbbbbbbk', '.kkkkkkkk'],
    int: ['.kkkkkkk.', 'kBBBBBBBk', 'kBwwwwwBk', 'kBBBBBBBk', 'kBwwwwBBk', 'kBBBBBBBk', 'kBwwwwwBk', 'kBBBBBBBk', '.kkkkkkk.'],
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
    orn: ['....k....', '...kYk...', '..kYoYk..', '.kYokoYk.', 'kYokRkoYk', '.kYokoYk.', '..kYoYk..', '...kYk...', '....k....'],
    book: ['.kkkkkkkk', 'kBBBBBBBk', 'kBYBBBBBk', 'kBBBBBBBk', 'kBBYYYBBk', 'kBBBBBBBk', 'kBBBBBBBk', 'kwwwwwwwk', '.kkkkkkkk'],
    bag: ['...kkk...', '..kbbbk..', '...kRk...', '.kkbbbkk.', 'kbbbbbbbk', 'kbbybbbbk', 'kbbbbbbbk', 'kbbbbbbbk', '.kkkkkkk.'],
    menu: ['.........', 'kkkkkkkkk', 'kYYYYYYYk', 'kkkkkkkkk', '.........', 'kkkkkkkkk', 'kYYYYYYYk', 'kkkkkkkkk', '.........'],
  };
  const ICON_PAL = { k: '#2a1a14', R: '#d8343e', r: '#9a1e2e', w: '#ffffff', g: '#9a8c78', Y: '#fee761', y: '#f0a830', o: '#a8642a', l: '#c0cbdc', b: '#8b5a2b', B: '#3a5ea8', G: '#3e9a4a', s: '#f2c79a' };
  const iconCache = {};
  A.icon = function (name) {
    if (iconCache[name]) return iconCache[name];
    const s = spr(ICONS[name]);
    const b = new Buf(s.w, s.h);
    draw(b, s, 0, 0, ICON_PAL);
    if (typeof document === 'undefined') return '';
    return (iconCache[name] = b.toCanvas(document.createElement('canvas')).toDataURL());
  };

  /* ======================= formas 3D → pixels ======================= */
  const LV = (() => { const v = [-0.55, -0.62, 0.56], m = Math.hypot(...v); return v.map((a) => a / m); })();
  const E = (cx, cy, rx, ry, rp, o) => Object.assign({ k: 'e', cx, cy, rx, ry, rp }, o);
  const C = (x1, y1, x2, y2, r1, r2, rp, o) => Object.assign({ k: 'c', x1, y1, x2, y2, r1, r2: r2 == null ? r1 : r2, rp }, o);
  const P = (pts, rp, o) => Object.assign({ k: 'p', pts, rp }, o);
  function chain(pts, r0, r1, rp, o) { const out = []; for (let i = 0; i < pts.length; i++) { const t = i / Math.max(1, pts.length - 1); out.push(E(pts[i][0], pts[i][1], r0 + (r1 - r0) * t, r0 + (r1 - r0) * t, rp, Object.assign({ g: 'chain' + (o && o.gid || '') }, o))); } return out; }
  function bbox(s) {
    if (s.k === 'e') return [s.cx - s.rx, s.cy - s.ry, s.cx + s.rx, s.cy + s.ry];
    if (s.k === 'c') { const r = Math.max(s.r1, s.r2); return [Math.min(s.x1, s.x2) - r, Math.min(s.y1, s.y2) - r, Math.max(s.x1, s.x2) + r, Math.max(s.y1, s.y2) + r]; }
    const xs = s.pts.map((p) => p[0]), ys = s.pts.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function inPoly(pts, x, y) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
  function transform(s, f) {
    const o = Object.assign({}, s);
    if (s.k === 'e') { [o.cx, o.cy] = f(s.cx, s.cy); o.rx = s.rx * f.k; o.ry = s.ry * f.k; }
    else if (s.k === 'c') { [o.x1, o.y1] = f(s.x1, s.y1); [o.x2, o.y2] = f(s.x2, s.y2); o.r1 = s.r1 * f.k; o.r2 = s.r2 * f.k; }
    else o.pts = s.pts.map((p) => f(p[0], p[1]));
    return o;
  }
  const shift = (dx, dy) => Object.assign((a, b) => [a + dx, b + dy], { k: 1 });
  // rasteriza uma lista de formas (de trás para frente) num sprite com contorno
  function rasterize(shapes, scale = 1, outline = '#1a0f14') {
    const tf = (x, y) => [x * scale, y * scale]; tf.k = scale;
    const sh = shapes.map((s) => transform(s, tf));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of sh) { const b = bbox(s); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    const ox = Math.floor(x0) - 2, oy = Math.floor(y0) - 2;
    const w = Math.ceil(x1) - ox + 3, h = Math.ceil(y1) - oy + 3;
    const d = new Uint32Array(w * h), id = new Int16Array(w * h).fill(-1), dk = new Uint32Array(w * h), grp = [];
    sh.forEach((s, si) => {
      grp[si] = s.g != null ? s.g : si;
      const b = bbox(s);
      for (let y = Math.floor(b[1]); y <= Math.ceil(b[3]); y++) for (let x = Math.floor(b[0]); x <= Math.ceil(b[2]); x++) {
        const px = x + 0.5, py = y + 0.5;
        let nx = 0, ny = 0, nz = 1, inside = false;
        if (s.k === 'e') { const dx = (px - s.cx) / s.rx, dy = (py - s.cy) / s.ry, q = dx * dx + dy * dy; if (q <= 1) { inside = true; nx = dx; ny = dy; nz = Math.sqrt(1 - q); } }
        else if (s.k === 'c') {
          const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L2 = vx * vx + vy * vy || 1e-6;
          const u = clamp(((px - s.x1) * vx + (py - s.y1) * vy) / L2);
          const qx = s.x1 + vx * u, qy = s.y1 + vy * u, r = s.r1 + (s.r2 - s.r1) * u, ddx = px - qx, ddy = py - qy, dd = Math.hypot(ddx, ddy);
          if (dd <= r + 0.15) { inside = true; nx = ddx / (r + 0.15); ny = ddy / (r + 0.15); nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); }
        } else if (inPoly(s.pts, px, py)) { inside = true; nx = s.nx || 0; ny = s.ny || 0; nz = s.nz == null ? 1 : s.nz; const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m; }
        if (!inside) continue;
        const X = x - ox, Y = y - oy;
        if (s.alpha != null && bay(X, Y) > s.alpha) continue;
        const dot = Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]);
        const band = dot < 0.12 ? 0.05 : dot < 0.45 ? 0.38 : dot < 0.8 ? 0.72 : 1;
        let v = (s.amb == null ? 0.2 : s.amb) + (s.dif == null ? 0.8 : s.dif) * (band * 0.65 + dot * 0.35) - (s.k === 'p' ? 0 : (1 - nz) * 0.12);
        if (s.fur) v += (NZ.n2(px * 1.6 + si * 7.3, py * 0.7) - 0.5) * s.fur;
        if (s.tex) v += (NZ.n2(px * (s.ts || 0.7) + si * 13.1, py * (s.ts || 0.7)) - 0.5) * s.tex;
        if (s.stripe) v += ((Math.floor(py * s.stripe) % 2) ? -0.12 : 0.06);
        if (s.vstripe) v += ((Math.floor(px * s.vstripe + Math.sin(py * 0.4)) % 2) ? -0.1 : 0.05);
        if (s.dv) v += s.dv;
        const i = Y * w + X;
        d[i] = pack(shade(s.rp, v, X, Y)); id[i] = si;
        dk[i] = pack(mixc(s.rp[0], rgb(outline), 0.45));
      }
    });
    // linhas de contorno internas entre partes diferentes
    const out = new Uint32Array(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, s = id[i];
      if (s < 0) continue;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + ax, Y = y + ay; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const t = id[Y * w + X];
        if (t > s && grp[t] !== grp[s] && !sh[s].noLine && !sh[t].noLine) { out[i] = pack(mixc(unpack(d[i]), unpack(dk[i]), 0.6)); break; }
      }
    }
    // contorno externo
    const ol = pack(rgb(outline));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (id[i] >= 0) continue;
      let near = -1;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + ax, Y = y + ay; if (X >= 0 && Y >= 0 && X < w && Y < h && id[Y * w + X] >= 0) { near = Y * w + X; break; } }
      if (near >= 0 && !sh[id[near]].noOutline) out[i] = sh[id[near]].glow ? pack(mixc(unpack(d[near]), [255, 255, 255], 0.2)) : ol;
    }
    return { w, h, d: out, ox: -ox, oy: -oy };
  }

  /* ======================= materiais ======================= */
  const M = {
    grass: ramp(['#16261a', '#1f3a20', '#2b5027', '#3b6a2f', '#528438', '#6f9e44', '#93b858', '#b9cf7a']),
    leaf: ramp(['#0c1812', '#13261a', '#1b3822', '#264c2a', '#356432', '#4a7c3a', '#679645', '#8bb256']),
    rock: ramp(['#1a1820', '#27252e', '#36343e', '#48464f', '#5d5b63', '#76747a', '#929095', '#b2b0b2']),
    moss: ramp(['#1c2418', '#2a3822', '#3a4e2c', '#4e6636', '#678042', '#859c52']),
    dirt: ramp(['#22180f', '#33241a', '#4a3524', '#624830', '#7c5e3e', '#987752', '#b5946c', '#d0b18a']),
    sand: ramp(['#5a3c26', '#7a5434', '#9a6e40', '#b8894e', '#d0a35f', '#e2bf7a', '#f0d79c', '#faeac0']),
    snow: ramp(['#4a5478', '#606c94', '#7a87ae', '#97a4c6', '#b5c0dc', '#d2daec', '#e9eef8', '#ffffff']),
    water: ramp(['#0b1626', '#10233c', '#173453', '#20476a', '#2c5e82', '#40789a', '#6098b4', '#8cbccf']),
    swamp: ramp(['#10140f', '#181f15', '#222c1d', '#2e3b26', '#3c4c2f', '#4f603a', '#677848']),
    wood: ramp(['#1a0f0a', '#2a1810', '#3d2416', '#52321e', '#6a4428', '#855834', '#a26f44', '#c08a58']),
    bark: ramp(['#120c09', '#1d140e', '#2b1e14', '#3b2a1c', '#4d3825', '#634a31']),
    stone: ramp(['#1e1b22', '#2c2830', '#3c3842', '#4f4a54', '#645f68', '#7c777f', '#96929a', '#b3aeb4']),
    plaster: ramp(['#4a3a30', '#665040', '#836a52', '#a08766', '#bda57e', '#d5c09a', '#e8d8b6']),
    roof: ramp(['#2a1010', '#431a16', '#5e261e', '#7c3626', '#9a4a32', '#b46240', '#c97e52']),
    roofB: ramp(['#161e2e', '#22304a', '#2f4262', '#3f567a', '#546e92', '#6e88aa']),
    steel: ramp(['#1e2230', '#30364a', '#4a5268', '#6a7488', '#8e98aa', '#b8c0ce', '#e2e8f0']),
    gold: ramp(['#3a2008', '#5e3a10', '#8a5a18', '#b88224', '#dcaa3a', '#f4d062', '#fff0a8']),
    straw: ramp(['#4a3416', '#6a4c20', '#8c682c', '#ae883a', '#cca84e', '#e2c66a']),
    ivory: ramp(['#5a5040', '#7e7258', '#a29676', '#c4ba98', '#e0d8bc', '#f6f0dc']),
    glowB: ramp(['#1a3a6a', '#2a5a9a', '#4a8ad0', '#7ab8f0', '#b0e0ff', '#e8f8ff']),
    glowG: ramp(['#1a4a20', '#2a7a30', '#4aaa40', '#7ad060', '#b0f090', '#e8ffd0']),
    fire: ramp(['#5a1010', '#9a2414', '#d8401a', '#f07a22', '#fcae3c', '#fee26a', '#fffbd0']),
    red: ramp(['#2a0a10', '#4a1018', '#701a22', '#9a2a2c', '#c04436', '#dc6a4a']),
    paper: ramp(['#6a5a44', '#8a7a5e', '#aa9a7a', '#c6b896', '#ded2b2', '#f0e8d0']),
    eye: ramp(['#0a0608', '#140c10', '#1e1418']),
    eyeR: ramp(['#5a0a0a', '#c01818', '#ff5a3a', '#ffd0a0']),
    eyeY: ramp(['#5a3a08', '#c08a18', '#ffd040', '#fff0b0']),
    white: ramp(['#8a8a94', '#b4b4bc', '#dcdce2', '#f6f6fa']),
  };
  A.M = M;

  /* ======================= pessoas ======================= */
  const SKINS = ['#f2c9a6', '#e3b08a', '#c88e64', '#9a6644', '#6e432a'];
  const HAIRS = ['#2a1c14', '#5b3a21', '#9a5a26', '#d8b058', '#b8402a', '#3a3440', '#e8e0d0'];
  const JOBCOL = { null: '#8a6e50', mago: '#4a3a9a', soldado: '#7a2a2a', ladrao: '#34343e', mercador: '#2a6a50', sacerdote: '#d8d0b8', bardo: '#a8304e', fazendeiro: '#7a6a3a', aventureiro: '#3a5a7a' };
  const CLOAK = { null: '#5a4a38', mago: '#2a2260', soldado: '#5a5a62', ladrao: '#1e1e26', mercador: '#6a4a2a', sacerdote: '#a89c7a', bardo: '#5a2a5a', fazendeiro: '#5a4a2a', aventureiro: '#6a3a26' };
  A.newLook = function (seedStr, sexo) {
    const r = rng(hash(seedStr));
    const p = (a) => a[Math.floor(r() * a.length)];
    return { skin: p(SKINS), hair: p(HAIRS.slice(0, 6)), style: Math.floor(r() * 4), eye: p(['#2a1a14', '#2a4a8a', '#3a6a3a', '#6a3a1a']), beard: sexo === 'm' && r() < 0.45, sexo, bg: p(['#3a4466', '#5a3a4a', '#2f4a3a', '#4a3a6a', '#5a4a2a']) };
  };

  function personShapes(look, job, stage, opt) {
    opt = opt || {};
    const vel = stage === 'vel', kid = stage === 'inf';
    const skin = rampFrom(look.skin, 7, '#3a1a2a', '#fff4e4', 0.45);
    const hair = rampFrom(vel ? '#cfcfd6' : look.hair, 6, '#120a10', '#fff0c8', 0.55);
    const cloth = rampFrom(opt.cloth || JOBCOL[job] || JOBCOL.null);
    const cloak = rampFrom(opt.cloak || CLOAK[job] || CLOAK.null);
    const pants = rampFrom(opt.pants || '#4a3a2e'), boots = rampFrom('#2e2018'), leather = rampFrom('#6a4428');
    const hood = rampFrom(job === 'ladrao' ? '#26262e' : '#cfc6a8');
    const hx = vel ? 1 : 0, hy = vel ? 1.2 : 0;
    const s = [];
    if (job === 'mercador' || opt.pack) s.push(E(12.5, 22, 4.2, 5.8, leather, { tex: 0.2 }));
    s.push(E(16.5, 27, 6, 11, cloak, { tex: 0.18, ts: 0.5, vstripe: 0.45 }));
    if (job === 'soldado' && !kid) s.push(E(14.5, 24, 4.6, 6.8, M.steel, { amb: 0.3 }), E(14.5, 24, 1.4, 1.4, M.gold, { g: 'shield' }));
    s.push(C(19, 31, 17.5, 43, 2.6, 2.3, pants, { dv: -0.12 }), E(17.5, 44, 2.8, 2, boots, { dv: -0.1 }));
    s.push(C(17, 18.5, 15.5, 27, 2.1, 1.8, cloth, { dv: -0.15 }), E(15.6, 28, 1.6, 1.6, skin, { dv: -0.1 }));
    s.push(C(21.5, 31, 23.5, 43, 2.7, 2.4, pants, { vstripe: 0.6 }), C(23, 39, 24, 43, 2.7, 2.6, boots), E(24.5, 44.3, 3.2, 2, boots), C(22.6, 39, 25.2, 39, 0.6, 0.6, leather, { noLine: true }));
    if ((job === 'sacerdote' || job === 'mago') && !kid) s.push(E(20, 33, 6.5, 11, cloth, { tex: 0.12, g: 'robe' }));
    s.push(E(20, 24, 5.8, 8.5, cloth, { tex: 0.12, g: 'robe' }));
    s.push(E(20.5, 31, 5.2, 2.6, cloth, { dv: -0.08, g: 'robe' }), C(14.6, 29, 25.4, 29, 1.1, 1.1, leather), E(24, 29, 0.9, 0.9, M.gold), E(17.6, 31, 1.8, 2.2, leather, { tex: 0.2 }));
    s.push(C(17, 16.5, 24, 16.5, 1, 0.9, rampFrom(A.light(opt.cloth || JOBCOL[job] || JOBCOL.null, 0.25)), { noLine: true }));
    s.push(E(18.5, 17.5, 6, 3.2, cloak));
    const hooded = (job === 'ladrao' || job === 'sacerdote') && !kid;
    if (hooded) s.push(E(21 + hx, 10 + hy, 6.8, 7, hood, { tex: 0.15 }));
    s.push(C(21 + hx, 14 + hy, 21, 17, 1.6, 1.6, skin, { dv: -0.1 }));
    if (look.style === 1 && !hooded) s.push(C(18 + hx, 9 + hy, 16.5 + hx, 19 + hy, 3, 2.2, hair, { tex: 0.35, ts: 1.2 }));
    if (look.style === 3 && !hooded) s.push(C(16.5 + hx, 9 + hy, 13 + hx, 15 + hy, 1.6, 1.1, hair, { tex: 0.3 }));
    s.push(E(21.5 + hx, 10.5 + hy, 5, 5.6, skin));
    s.push(E(19.6 + hx, 11 + hy, 1.1, 1.5, skin, { dv: -0.05 }));
    s.push(E(24.4 + hx, 10.2 + hy, 0.7, 0.9, M.eye, { noLine: true }));
    s.push(E(26.2 + hx, 11.8 + hy, 1, 0.9, skin, { g: 'face' }));
    if (!hooded) {
      if (look.style === 2) s.push(E(20.8 + hx, 7.4 + hy, 4.8, 2.8, hair, { tex: 0.3, ts: 1.5 }));
      else s.push(E(20.5 + hx, 7.6 + hy, 5.2, 3.6, hair, { tex: 0.35, ts: 1.4 }), E(18 + hx, 10 + hy, 2.6, 3.2, hair, { tex: 0.3, ts: 1.4 }), C(23.5 + hx, 5.5 + hy, 26 + hx, 8 + hy, 1.2, 0.6, hair, { g: 'hair' }), C(21 + hx, 5 + hy, 22.5 + hx, 8.5 + hy, 1.1, 0.5, hair, { g: 'hair' }));
    } else s.push(E(21.5 + hx, 7 + hy, 5.6, 3.4, hood));
    if (look.beard && !kid && stage !== 'jov') s.push(E(23 + hx, 13.8 + hy, 3.2, 2.4, hair, { tex: 0.35, ts: 1.5 }));
    // chapéus
    if (!kid) {
      if (job === 'mago') { const hr = rampFrom('#3a2a8a'); s.push(P([[15, 8.5], [27, 8.5], [21, -5], [17, -3]], hr, { nx: -0.3, ny: -0.5, tex: 0.15 }), E(21, 8.4, 7.6, 1.5, hr)); }
      if (job === 'soldado') s.push(E(21.3 + hx, 8.4 + hy, 5.7, 4.5, M.steel, { amb: 0.3 }), C(25.8, 7.5, 25.8, 12, 0.5, 0.5, M.steel));
      if (job === 'fazendeiro') s.push(E(21.5, 7.6, 8.6, 1.6, M.straw, { tex: 0.3 }), E(21.3, 6, 4.2, 2.8, M.straw, { tex: 0.3 }));
      if (job === 'bardo') s.push(E(20.5, 7, 5.6, 2.6, rampFrom('#2a6a3a')), C(17, 6, 11.5, 0.5, 0.9, 0.3, M.white));
      if (job === 'aventureiro') s.push(C(16.5, 6.6, 25.2, 6.2, 0.8, 0.8, M.red), C(16.5, 6.6, 13.5, 9.5, 0.6, 0.4, M.red));
    }
    s.push(C(22.5, 18, 25.5, 27, 2.2, 1.9, cloth, { vstripe: 0.5 }), C(25.1, 25.6, 25.8, 27, 2.1, 2, leather, { noLine: true }));
    s.push(E(26.3, 28, 1.8, 1.8, skin));
    // objetos na mão
    if (!kid) {
      if (job === 'aventureiro' || job === 'soldado' || opt.sword) s.push(C(27, 27, 33.5, 8, 0.9, 0.55, M.steel, { amb: 0.45 }), C(25.4, 25.4, 28.8, 28.8, 0.7, 0.7, M.gold));
      if (job === 'mago') s.push(C(28, 45, 28.5, 3, 0.8, 0.8, M.wood), E(28.6, 2.4, 2.1, 2.1, M.glowB, { amb: 0.75, glow: true }));
      if (job === 'ladrao' && !opt.sword) s.push(C(27, 28.5, 31, 24, 0.6, 0.45, M.steel, { amb: 0.4 }));
      if (job === 'bardo') s.push(E(23.5, 26, 3.8, 2.9, M.wood, { tex: 0.15 }), C(25.5, 25, 32, 19.5, 0.6, 0.6, M.wood));
      if (job === 'fazendeiro') s.push(C(28, 45, 28, 9, 0.7, 0.7, M.wood), C(28, 9, 32.5, 11.5, 1, 0.9, M.steel));
      if (job === 'sacerdote') s.push(E(26.5, 27, 2.3, 1.7, M.red));
      if (job === 'mercador') s.push(C(27, 28, 29, 33, 1.6, 1.8, leather));
      if (vel) s.push(C(28.5, 28, 29.5, 45.5, 0.7, 0.7, M.wood));
    }
    return s;
  }
  function personSprite(look, job, stage, opt) {
    return rasterize(personShapes(look, job, stage, opt), (stage === 'inf' ? 0.78 : 1) * SPR);
  }
  A.personSprite = personSprite;

  function mirror(s) { const d = new Uint32Array(s.w * s.h); for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) d[y * s.w + x] = s.d[y * s.w + (s.w - 1 - x)]; return { w: s.w, h: s.h, d }; }

  /* ======================= criaturas ======================= */
  function quad(p) {
    const main = rampFrom(p.main), belly = rampFrom(p.belly || A.light(p.main, 0.25)), s = [];
    const bl = p.bl, bh = p.bh, leg = p.leg, lr = p.lr || 2, hr = p.hr, neck = p.neck || 3;
    const by = -(leg + bh * 0.75), bx0 = -bl * 0.62, bx1 = bl * 0.62;
    s.push(C(bx0 - 1.5, by + 2, bx0 - 2.5, -1, lr, lr * 0.8, main, { dv: -0.2 }), C(bx1 - 0.5, by + 2, bx1 + 0.5, -1, lr, lr * 0.8, main, { dv: -0.2 }));
    if (p.tail === 'bushy') s.push(C(-bl, by - 1, -bl - 7, by + 3, 2.6, 1.5, main, { tex: 0.4 }));
    if (p.tail === 'thin') s.push(C(-bl, by - 1, -bl - 5, by + 4, 1.1, 0.5, main));
    if (p.tail === 'long') s.push(...chain([[-bl, by], [-bl - 4, by + 1], [-bl - 8, by + 2], [-bl - 12, by + 3], [-bl - 15, by + 3]], bh * 0.8, 0.8, main, { tex: 0.3, gid: 't' }));
    if (p.tail === 'horse') s.push(C(-bl, by - 2, -bl - 4, by + 9, 1.8, 1.2, rampFrom('#1a1210'), { tex: 0.5, ts: 1.5 }));
    if (p.tail === 'up') s.push(C(-bl, by, -bl - 3, by - 8, 1.1, 0.8, main));
    s.push(E(0, by, bl, bh, main, { tex: 0.22, ts: 0.6, fur: 0.3, g: 'body' }));
    s.push(E(0, by + bh * 0.45, bl * 0.75, bh * 0.5, belly, { tex: 0.2, g: 'body' }));
    if (p.spots) for (let i = 0; i < 6; i++) s.push(E(-bl * 0.6 + i * bl * 0.25, by - bh * 0.2 + (i % 2) * 2, 0.9, 0.8, rampFrom(A.dark(p.main, 0.5)), { g: 'body', noLine: true }));
    s.push(E(bl * 0.7, by + 0.5, bh * 0.85, bh * 0.95, main, { tex: 0.2, fur: 0.3, g: 'body' }));
    s.push(C(bx0 + 0.5, by + 2, bx0 - 0.5, -0.8, lr, lr * 0.85, main), C(bx1 + 1, by + 2, bx1 + 2, -0.8, lr, lr * 0.85, main));
    s.push(E(bx0 - 0.3, -0.6, lr * 1.2, lr * 0.7, main, { dv: -0.1 }), E(bx1 + 2.3, -0.6, lr * 1.2, lr * 0.7, main, { dv: -0.1 }));
    const hx = bl * 0.75 + neck + hr * 0.4, hy = by - bh * 0.85 - neck * 0.55;
    s.push(C(bl * 0.75, by - 1, hx - hr * 0.3, hy + hr * 0.2, bh * 0.62, hr * 0.8, main, { g: 'body', tex: 0.25 }));
    if (p.mane === 'neck') s.push(C(bl * 0.5, by - bh * 0.7, hx - hr * 0.6, hy - hr * 0.5, 1.6, 1.3, rampFrom('#1a1210'), { tex: 0.5 }));
    if (p.mane === true) s.push(E(hx - hr * 0.7, hy + hr * 0.3, hr * 1.25, hr * 1.5, rampFrom(A.dark(p.main, 0.2)), { tex: 0.55, ts: 1.2 }));
    if (p.ears === 'pt') s.push(P([[hx - hr * 0.55, hy - hr * 0.5], [hx - hr * 0.05, hy - hr * 0.65], [hx - hr * 0.45, hy - hr * 1.7]], main, { nx: -0.4, ny: -0.3, g: 'head' }));
    if (p.ears === 'rd') s.push(E(hx - hr * 0.35, hy - hr * 0.8, hr * 0.38, hr * 0.38, main, { g: 'head' }));
    s.push(E(hx, hy, hr, hr * 0.85, main, { tex: 0.2, fur: 0.22, g: 'head' }));
    if (p.sn) s.push(C(hx + hr * 0.4, hy + hr * 0.15, hx + hr * 0.4 + p.sn, hy + hr * 0.42, hr * 0.56, hr * 0.38, main, { g: 'head' }), E(hx + hr * 0.45 + p.sn, hy + hr * 0.3, 0.9, 0.8, M.eye, { noLine: true, g: 'head' }));
    if (p.teeth) s.push(C(hx + hr * 0.5, hy + hr * 0.75, hx + hr * 0.4 + p.sn, hy + hr * 0.75, 0.45, 0.45, M.white, { noLine: true, g: 'head' }));
    s.push(E(hx + hr * 0.3, hy - hr * 0.22, 0.85, 0.75, p.eyes === 'r' ? M.eyeR : p.eyes === 'y' ? M.eyeY : M.eye, { amb: 0.8, noLine: true, g: 'head' }));
    if (p.horns === 'bull') s.push(C(hx - hr * 0.2, hy - hr * 0.6, hx + hr * 0.7, hy - hr * 1.7, 0.9, 0.35, M.ivory, { g: 'head' }));
    if (p.horns === 'curl') s.push(C(hx - hr * 0.3, hy - hr * 0.7, hx - hr * 1.3, hy - hr * 1.2, 1, 0.8, M.ivory, { g: 'head' }), C(hx - hr * 1.3, hy - hr * 1.2, hx - hr * 1.1, hy, 0.8, 0.5, M.ivory, { g: 'head' }));
    if (p.horns === 'dragon') s.push(C(hx - hr * 0.4, hy - hr * 0.5, hx - hr * 1.8, hy - hr * 1.6, 1, 0.3, M.ivory, { g: 'head' }), C(hx, hy - hr * 0.7, hx - hr * 0.6, hy - hr * 2, 0.8, 0.25, M.ivory, { g: 'head' }));
    if (p.tusks) s.push(C(hx + hr * 0.7, hy + hr * 0.7, hx + hr * (p.tusks === 'long' ? 2.6 : 1.3), hy - hr * (p.tusks === 'long' ? 0.2 : 0.1), 0.7, 0.35, M.ivory, { g: 'head' }));
    if (p.trunk) s.push(...chain([[hx + hr * 0.7, hy + hr * 0.3], [hx + hr * 1.1, hy + hr * 1.2], [hx + hr * 1.2, hy + hr * 2.2], [hx + hr * 1.0, hy + hr * 3]], hr * 0.4, hr * 0.25, main, { gid: 'tr' }));
    if (p.crown) s.push(P([[hx - 2, hy - hr * 0.7], [hx + 2, hy - hr * 0.7], [hx + 2.4, hy - hr * 1.5], [hx + 0.8, hy - hr * 1.0], [hx, hy - hr * 1.6], [hx - 0.8, hy - hr * 1.0], [hx - 2.4, hy - hr * 1.5]], M.gold, { amb: 0.5 }));
    return s;
  }
  function dragonShapes(p) {
    const opts = Object.assign({ bl: 16, bh: 7.5, leg: 9, lr: 2.8, hr: 4.6, sn: 6, neck: 3, tail: 'long', horns: 'dragon', teeth: 1, eyes: 'y' }, p);
    const s = quad(opts);
    const main = rampFrom(p.main), wing = rampFrom(A.dark(p.main, 0.2));
    const by = -(opts.leg + opts.bh * 0.75);
    const head = s.filter((x) => x.g === 'head');
    const rest = s.filter((x) => x.g !== 'head' && !(x.k === 'c' && x.g === 'body'));
    const hx0 = opts.bl * 0.75 + opts.neck + opts.hr * 0.4, hy0 = by - opts.bh * 0.85 - opts.neck * 0.55;
    const nx = 21, ny = by - 20;
    const moved = head.map((x) => transform(x, shift(nx - hx0, ny - hy0)));
    const neck = chain([[12, by - 2], [15, by - 7], [17.5, by - 12], [19.5, by - 16]], 4.2, 3.2, main, { tex: 0.3, gid: 'n' });
    const spikes = [];
    for (let i = 0; i < 6; i++) spikes.push(P([[-12 + i * 4, by - opts.bh + 0.8], [-10 + i * 4, by - opts.bh + 0.8], [-11.5 + i * 4, by - opts.bh - 3]], M.ivory, { ny: -0.6 }));
    const wingFar = P([[-6, by - 4], [6, by - 5], [14, by - 30], [4, by - 24], [-2, by - 27], [-6, by - 20]], wing, { nx: -0.2, ny: -0.4, tex: 0.25, dv: -0.15 });
    const wingNear = P([[-3, by - 3], [9, by - 3], [-12, by - 34], [-14, by - 22], [-20, by - 24], [-16, by - 12]], wing, { nx: -0.5, ny: -0.3, tex: 0.25 });
    return [wingFar, ...spikes, ...rest, ...neck, wingNear, ...moved];
  }
  function biped(p) {
    const main = rampFrom(p.main), s = [], hip = p.hip || 10, bh = p.bh || 8, bw = p.bw || 8, lr = p.lr || 2.8, ar = p.ar || 2.6, hr = p.hr || 4.5;
    const ty = -hip - bh;
    if (p.wings) s.push(P([[-2, ty - 2], [-18, ty - 16], [-16, ty - 4], [-20, ty + 4], [-6, ty + 6]], rampFrom(A.dark(p.main, 0.25)), { nx: -0.5, tex: 0.3 }));
    s.push(C(-bw * 0.8, ty - bh * 0.5, -bw * 1.3, -hip * 0.6, ar, ar * 0.9, main, { dv: -0.18, tex: p.tex }));
    if (p.tail === 'smoke') s.push(...chain([[0, -hip * 0.6], [-3, -hip * 0.3], [-6, -2], [-9, 0]], bw * 0.8, 1.2, main, { alpha: 0.85, gid: 's' }));
    else s.push(C(-2.6, -hip, -3, 0, lr, lr * 0.85, main, { dv: -0.12, tex: p.tex }), C(2.6, -hip, 3.2, 0, lr, lr * 0.85, main, { tex: p.tex }), E(-3, -0.4, lr * 1.3, lr * 0.6, main, { dv: -0.1 }), E(3.6, -0.4, lr * 1.3, lr * 0.6, main));
    s.push(E(0, ty, bw, bh, main, { tex: p.tex == null ? 0.25 : p.tex, ts: p.ts, stripe: p.stripe, g: 'torso' }));
    if (p.belly) s.push(E(1, ty + bh * 0.3, bw * 0.65, bh * 0.6, rampFrom(p.belly), { tex: 0.2, g: 'torso' }));
    const hx = bw * 0.3, hy = ty - bh - hr * 0.55;
    s.push(E(hx, hy, hr, hr * 0.92, main, { tex: p.tex == null ? 0.2 : p.tex, ts: p.ts, stripe: p.stripe }));
    if (p.jaw) s.push(C(hx + hr * 0.1, hy + hr * 0.55, hx + hr * 0.9, hy + hr * 0.55, 0.6, 0.6, M.white, { noLine: true }));
    const er = p.eyes === 'y' ? M.eyeY : p.eyes === 'b' ? M.glowB : M.eyeR;
    s.push(E(hx + hr * 0.45, hy - hr * 0.15, 0.85, 0.8, er, { amb: 0.9, noLine: true }), E(hx - hr * 0.05, hy - hr * 0.15, 0.75, 0.75, er, { amb: 0.9, noLine: true }));
    if (p.horns) s.push(C(hx - hr * 0.5, hy - hr * 0.6, hx - hr * 1.2, hy - hr * 1.6, 0.9, 0.3, M.ivory), C(hx + hr * 0.4, hy - hr * 0.7, hx + hr * 0.8, hy - hr * 1.7, 0.9, 0.3, M.ivory));
    if (p.hat) s.push(E(hx, hy - hr * 0.7, hr * 1.8, hr * 0.35, M.straw, { tex: 0.3 }), E(hx, hy - hr * 1.1, hr * 0.9, hr * 0.6, M.straw, { tex: 0.3 }));
    s.push(C(bw * 0.8, ty - bh * 0.5, bw * 1.5, -hip * 0.55, ar, ar * 0.9, main, { tex: p.tex }));
    s.push(E(bw * 1.55, -hip * 0.5, ar * 1.2, ar * 1.1, main));
    if (p.club) s.push(C(bw * 1.6, -hip * 0.4, bw * 2.6, ty - bh * 1.4, 1.4, 3, M.wood, { tex: 0.35 }));
    return s;
  }
  function serpent(p) {
    const main = rampFrom(p.main), s = [], heads = p.heads || 1;
    if (p.form === 'worm') {
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([Math.sin(t * 2.4) * 6 * t, -t * 46]); }
      s.push(...chain(pts, 11, 9, main, { tex: 0.35, stripe: 0.5, gid: 'w' }));
      s.push(E(pts[10][0] + 2, pts[10][1] - 2, 8, 6, rampFrom('#3a0e14'), { amb: 0.5 }));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s.push(E(pts[10][0] + 2 + Math.cos(a) * 7, pts[10][1] - 2 + Math.sin(a) * 5, 0.9, 0.9, M.ivory, { noLine: true })); }
      return s;
    }
    if (heads > 1) s.push(E(-14, -6, 12, 7, main, { tex: 0.3 }));
    for (let k = 0; k < heads; k++) {
      const off = (k - (heads - 1) / 2) * 9, pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([-14 + 12 * t + off * t + Math.sin(t * 5.5 + k) * 6 * (1 - t * 0.5), -Math.pow(t, 0.9) * (p.tall || 34)]); }
      s.push(...chain(pts, p.r0 || 6, p.r1 || 3.2, main, { tex: 0.35, ts: 1, gid: 'n' + k, dv: k === 0 && heads > 1 ? -0.12 : 0 }));
      const [hx, hy] = pts[pts.length - 1];
      s.push(E(hx + 2, hy, 4.6, 3.4, main, { tex: 0.2 }), C(hx + 3, hy + 2, hx + 7.5, hy + 2.4, 1.6, 1.2, main), E(hx + 2.6, hy - 1.2, 0.8, 0.8, M.eyeY, { amb: 0.9, noLine: true }));
      if (p.fin) s.push(P([[hx - 2, hy - 2], [hx + 2, hy - 2.5], [hx - 4, hy - 8]], rampFrom(A.dark(p.main, 0.2)), { ny: -0.5 }));
    }
    return s;
  }
  function flyer(p) {
    const main = rampFrom(p.main), wing = rampFrom(p.wing || A.dark(p.main, 0.15)), s = [], y = -(p.fly || 4);
    s.push(P([[-2, y - 10], [8, y - 12], [-4, y - 34], [-10, y - 26], [-14, y - 28]], wing, { nx: -0.3, ny: -0.4, tex: 0.3, dv: -0.18 }));
    if (p.lion) s.push(...quad({ bl: 11, bh: 5.5, leg: 8, hr: 3.6, sn: 0, main: '#b88a4a', tail: 'thin' }).filter((x) => x.g !== 'head'));
    s.push(E(0, y - 10, 8, 5.5, main, { tex: 0.35, ts: 1.2, g: 'b' }));
    s.push(P([[-7, y - 10], [-15, y - 6], [-14, y - 13]], wing, { nx: -0.3 }));
    s.push(E(7.5, y - 15, 3.6, 3.2, rampFrom(p.head || p.main), { tex: 0.25 }), P([[10.5, y - 16], [14.5, y - 14], [10.5, y - 13]], M.gold, { nx: 0.2, ny: -0.2 }), E(8.8, y - 16, 0.7, 0.7, M.eyeY, { amb: 0.9, noLine: true }));
    if (!p.lion) s.push(C(1, y - 6, 0, y + 2, 0.7, 0.6, M.gold), C(4, y - 6, 4, y + 2, 0.7, 0.6, M.gold));
    s.push(P([[0, y - 12], [10, y - 13], [-6, y - 40], [-12, y - 30], [-18, y - 32], [-10, y - 18]], wing, { nx: -0.5, ny: -0.3, tex: 0.3 }));
    return s;
  }
  function arach(p) {
    const main = rampFrom(p.main), s = [];
    if (p.form === 'crab') {
      for (let i = 0; i < 3; i++) s.push(C(-4 + i * 3, -6, -9 + i * 2, 0, 1, 0.7, main, { dv: -0.15 }));
      s.push(E(0, -8, 11, 6.5, main, { tex: 0.3 }), E(2, -14, 0.9, 1.2, M.eye), E(5, -14, 0.9, 1.2, M.eye));
      s.push(C(8, -9, 14, -14, 1.6, 1.4, main), E(16, -16, 4.2, 3.2, main), E(19, -18, 2.6, 1.6, main));
      for (let i = 0; i < 3; i++) s.push(C(2 + i * 3, -5, 7 + i * 2, 0, 1, 0.7, main));
      return s;
    }
    const legs = (dv) => { for (let i = 0; i < 4; i++) { const ax = -2 + i * 3, kx = ax - 5 + i * 3, fx = kx - 3 + i * 2; s.push(C(ax, -9, kx, -16, 1, 0.8, main, { dv }), C(kx, -16, fx, 0, 0.8, 0.5, main, { dv })); } };
    legs(-0.2);
    if (p.form === 'scorpion') {
      s.push(...chain([[-8, -6], [-13, -10], [-15, -17], [-12, -23], [-6, -25]], 3.2, 1.8, main, { tex: 0.25, gid: 't' }), P([[-6, -27], [-2, -25], [-5, -22]], M.ivory));
      s.push(E(0, -7, 9, 4.5, main, { tex: 0.3, stripe: 0.6 }), C(7, -8, 13, -12, 1.4, 1.2, main), E(15, -13, 3.2, 2.2, main), C(7, -6, 13, -4, 1.4, 1.2, main), E(15, -4, 3.2, 2.2, main));
    } else {
      s.push(E(-7, -11, 8, 7, main, { tex: 0.35, ts: 0.9 }), E(3, -10, 4.5, 3.8, main, { tex: 0.2 }));
      for (let i = 0; i < 4; i++) s.push(E(5.5 + (i % 2) * 1.6, -11.5 + Math.floor(i / 2) * 1.6, 0.6, 0.6, M.eyeR, { amb: 0.9, noLine: true }));
    }
    legs(0);
    return s;
  }
  function spirit(p) {
    const main = rampFrom(p.main, 7, '#2a3a5a', '#ffffff', 0.6), s = [];
    if (p.form === 'wisp') return [E(0, -22, 7, 7, main, { amb: 0.7, alpha: 0.75, glow: true }), E(0, -22, 4, 4, M.white, { amb: 0.9, noLine: true })];
    if (p.form === 'tree') {
      const leaf = rampFrom(p.main);
      s.push(C(-2, 0, -1, -26, 5, 3.6, M.bark, { tex: 0.5, ts: 0.6 }), C(-1, -18, -10, -28, 1.6, 0.8, M.bark), C(0, -20, 9, -30, 1.6, 0.8, M.bark));
      for (const [x, y, r] of [[-8, -32, 7], [6, -34, 7], [-1, -38, 8], [-12, -26, 5], [10, -26, 5]]) s.push(E(x, y, r, r * 0.85, leaf, { tex: 0.5, ts: 0.8 }));
      s.push(E(-3, -16, 1.2, 1, M.eyeY, { amb: 0.9 }), E(1.5, -16, 1.2, 1, M.eyeY, { amb: 0.9 }), C(-3, -11, 2, -11, 0.7, 0.7, M.eye));
      return s;
    }
    if (p.form === 'mermaid') {
      const tail = rampFrom('#2a8a8a');
      s.push(...chain([[-2, -6], [-6, -3], [-10, -2], [-14, -4]], 4, 1.6, tail, { tex: 0.35, gid: 't' }), P([[-14, -4], [-20, -9], [-19, 0]], tail));
      return s.concat(personShapes(A.newLook('sereia', 'f'), null, 'jov', { cloth: '#3aa0a0', cloak: '#1e6a6a' }).filter((x) => (x.k === 'e' ? x.cy : x.k === 'c' ? Math.max(x.y1, x.y2) : 0) < 29).map((x) => transform(x, shift(-20, -34))));
    }
    s.push(...chain([[2, -14], [-2, -8], [-6, -5], [-10, -3]], 6, 1.4, main, { alpha: 0.8, gid: 'g', amb: 0.45 }));
    s.push(E(2, -22, 7, 9, main, { alpha: 0.85, amb: 0.45 }));
    s.push(E(-1, -24, 1.4, 2, M.eye, { noLine: true }), E(4, -24, 1.4, 2, M.eye, { noLine: true }), E(1.5, -18.5, 1.6, 1.2, M.eye, { noLine: true }));
    s.push(C(-4, -18, -9, -12, 1.4, 0.8, main, { alpha: 0.8 }), C(8, -18, 12, -12, 1.4, 0.8, main, { alpha: 0.8 }));
    return s;
  }

  const SPECIES = {
    lobo: ['quad', { bl: 11, bh: 5.5, leg: 9, hr: 4, sn: 4.5, ears: 'pt', tail: 'bushy', main: '#6e6e7a', belly: '#a8a6ac', eyes: 'y' }],
    'lobo branco': ['quad', { bl: 12, bh: 6, leg: 9.5, hr: 4.2, sn: 4.5, ears: 'pt', tail: 'bushy', main: '#cfd4de', belly: '#eef0f4', eyes: 'y' }],
    urso: ['quad', { bl: 13, bh: 8.5, leg: 7, lr: 3, hr: 5, sn: 2.6, ears: 'rd', main: '#56402c', belly: '#7a5a3e' }],
    'urso polar': ['quad', { bl: 14, bh: 9, leg: 7.5, lr: 3.2, hr: 5, sn: 3, ears: 'rd', main: '#dfe2e8' }],
    javali: ['quad', { bl: 10, bh: 6.5, leg: 5, lr: 1.8, hr: 4.2, sn: 4, ears: 'pt', tail: 'thin', tusks: 1, mane: true, main: '#4a3628', eyes: 'r' }],
    lince: ['quad', { bl: 10, bh: 5, leg: 8, hr: 3.8, sn: 2, ears: 'pt', tail: 'thin', main: '#c09a64', spots: 1, eyes: 'y' }],
    'cabra montesa': ['quad', { bl: 9, bh: 5.5, leg: 9, lr: 1.4, hr: 3.2, sn: 3, horns: 'curl', ears: 'pt', tail: 'thin', main: '#d4ccbc' }],
    'touro bravo': ['quad', { bl: 13, bh: 8, leg: 8, lr: 2.6, hr: 4.6, sn: 3, horns: 'bull', tail: 'thin', main: '#2e2222', eyes: 'r' }],
    chacal: ['quad', { bl: 9, bh: 4.5, leg: 8, hr: 3.4, sn: 4, ears: 'pt', tail: 'bushy', main: '#b08c62', eyes: 'y' }],
    crocodilo: ['quad', { bl: 16, bh: 3.6, leg: 3, lr: 1.6, hr: 3.4, sn: 9, tail: 'long', teeth: 1, main: '#4e6a38', belly: '#a8a878', eyes: 'y' }],
    mamute: ['quad', { bl: 15, bh: 11, leg: 10, lr: 3.6, hr: 6.5, sn: 0, trunk: 1, tusks: 'long', ears: 'rd', mane: true, main: '#6a4a32' }],
    'sapo-rei': ['quad', { bl: 7, bh: 6, leg: 3.5, lr: 2.2, hr: 5, sn: 1, crown: 1, main: '#5a9a3a', belly: '#c8d890', eyes: 'y' }],
    troll: ['biped', { hip: 10, bh: 8, bw: 8, hr: 4.5, main: '#6a8a5a', club: 1, jaw: 1, tex: 0.3 }],
    ogro: ['biped', { hip: 11, bh: 9, bw: 10, hr: 4.6, main: '#a08a5a', belly: '#c0a878', club: 1, jaw: 1 }],
    yeti: ['biped', { hip: 11, bh: 9, bw: 9, hr: 5, main: '#dfe6ee', tex: 0.55, ts: 1.3, eyes: 'b' }],
    'golem de pedra': ['biped', { hip: 12, bh: 10, bw: 11, lr: 3.6, ar: 3.4, hr: 4, main: '#76767e', tex: 0.7, ts: 0.35, eyes: 'b' }],
    múmia: ['biped', { hip: 11, bh: 7, bw: 5.5, lr: 2, ar: 1.8, hr: 3.8, main: '#cfc2a2', tex: 0.3, stripe: 0.7, eyes: 'y' }],
    'espantalho vivo': ['biped', { hip: 12, bh: 6, bw: 5, lr: 1.4, ar: 1.4, hr: 3.8, main: '#c8a050', tex: 0.5, ts: 1.4, hat: 1, eyes: 'y' }],
    gárgula: ['biped', { hip: 8, bh: 7, bw: 6.5, hr: 4, main: '#6a6a78', tex: 0.6, ts: 0.5, horns: 1, wings: 1, eyes: 'r' }],
    'gênio rancoroso': ['biped', { hip: 12, bh: 8, bw: 7, hr: 4.2, main: '#5a7ae0', tail: 'smoke', eyes: 'y' }],
    'aranha gigante': ['arach', { main: '#3a2a3a' }],
    'escorpião gigante': ['arach', { form: 'scorpion', main: '#7a3424' }],
    'caranguejo gigante': ['arach', { form: 'crab', main: '#b8402c' }],
    'sanguessuga gigante': ['serpent', { main: '#4a2a3a', tall: 16, r0: 4, r1: 3 }],
    hidra: ['serpent', { main: '#3a7a5a', heads: 3, tall: 34, r0: 4.2, r1: 2.8, fin: 1 }],
    'serpente marinha': ['serpent', { main: '#2a6a8a', tall: 42, r0: 7, r1: 3.6, fin: 1 }],
    'verme da areia': ['serpent', { form: 'worm', main: '#c0946a' }],
    'águia gigante': ['flyer', { main: '#6a4a2a', head: '#f0ece0', fly: 10 }],
    'gaivota monstruosa': ['flyer', { main: '#e8e8f0', wing: '#9a9aa8', fly: 14 }],
    grifo: ['flyer', { main: '#7a5a34', head: '#f0ece0', lion: 1, fly: 0 }],
    'árvore desperta': ['spirit', { form: 'tree', main: '#4a7a3a' }],
    'fogo-fátuo': ['spirit', { form: 'wisp', main: '#90e0ff' }],
    'espírito do gelo': ['spirit', { main: '#c0ecff' }],
    afogado: ['spirit', { main: '#7aa0a0' }],
    sereia: ['spirit', { form: 'mermaid', main: '#3aa0a0' }],
    __dragao: ['dragon', { main: '#8a2a24' }],
  };
  const PEOPLE_COLORS = { bandoleiro: '#6a3a2a', pirata: '#2a3a6a', salteador: '#4a4a3a', saqueador: '#8a6a3a', 'caçador renegado': '#3a4a2a', 'bruxa da mata': '#3a2a4a', 'bruxa do brejo': '#2a3a2a', centauro: '#6a4a2a', duende: '#3a6a2a' };

  const cache = { cre: {}, misc: {} };
  function creatureSprite(c) {
    const key = c.base + '|' + c.adj;
    if (cache.cre[key]) return cache.cre[key];
    const sp = SPECIES[c.base];
    const scale = clamp(0.85 + ((c.pow || 3) - 3) * 0.1, 0.75, 1.5);
    let sprite;
    if (!sp) {
      const witch = /bruxa/.test(c.base), kid = /duende/.test(c.base);
      const col = PEOPLE_COLORS[c.base] || '#4a3a3a';
      const look = A.newLook(c.base + c.adj, witch ? 'f' : 'm');
      sprite = mirror(personSprite(look, witch ? 'mago' : 'ladrao', kid ? 'inf' : 'adu', { cloth: col, cloak: A.dark(col, 0.3), sword: !witch && !kid }));
    } else {
      const [kind, p0] = sp;
      const p = Object.assign({}, p0);
      if (/albin/.test(c.adj)) p.main = '#eeeef2';
      if (/sombri|amaldiçoad/.test(c.adj)) p.main = A.mix(p.main, '#2a1838', 0.5);
      if (/pestilent/.test(c.adj)) p.main = A.mix(p.main, '#7a8a2a', 0.45);
      if (/olhos vermelhos|amaldiçoad|enfurecid/.test(c.adj)) p.eyes = 'r';
      const builders = { quad, biped, serpent, flyer, arach, spirit, dragon: dragonShapes };
      sprite = mirror(rasterize(builders[kind](p), (kind === 'dragon' ? 1.25 : scale) * SPR));
    }
    return (cache.cre[key] = sprite);
  }

  A.creatureSprite = creatureSprite;

  /* ======================= objetos ======================= */
  function objectSprite(t, look) {
    const key = t + (look ? look.skin : '');
    if (cache.misc[key]) return cache.misc[key];
    let s;
    if (t === 'bau') s = [P([[-9, -1], [9, -1], [9, -11], [-9, -11]], M.wood, { tex: 0.2, stripe: 0.4 }), P([[-9, -11], [9, -11], [7, -15], [-7, -15]], M.wood, { ny: -0.8, tex: 0.2 }), C(-9, -7, 9, -7, 0.8, 0.8, M.gold), C(-5, -15, -5, -1, 0.7, 0.7, M.gold), C(5, -15, 5, -1, 0.7, 0.7, M.gold), E(0, -9, 1.6, 2, M.gold, { amb: 0.5 })];
    else if (t === 'cristal') s = [E(2, 0, 10, 2, M.rock, { tex: 0.4 }), P([[-6, 0], [-3, -18], [0, 0]], M.glowB, { nx: -0.6, amb: 0.5, glow: true }), P([[-1, 0], [3, -26], [7, 0]], M.glowB, { nx: 0.2, amb: 0.6, glow: true }), P([[4, 0], [9, -14], [11, 0]], M.glowB, { nx: 0.7, amb: 0.4, glow: true })];
    else if (t === 'caldeirao') s = [C(-7, -1, -8, 3, 0.8, 0.8, M.steel), C(7, -1, 8, 3, 0.8, 0.8, M.steel), E(0, -8, 10, 8, rampFrom('#3a3a44'), { tex: 0.2 }), E(0, -14, 9, 2.4, M.glowG, { amb: 0.7, glow: true }), C(-10, -14, 10, -14, 1, 1, M.steel)];
    else if (t === 'tumulo') s = [E(0, 0, 11, 2, M.moss, { tex: 0.5 }), P([[-8, 0], [8, 0], [8, -18], [-8, -18]], M.stone, { tex: 0.35, ts: 0.6, g: 'st' }), E(0, -18, 8, 6, M.stone, { tex: 0.35, g: 'st' }), C(0, -20, 0, -8, 0.8, 0.8, rampFrom('#2a2630'), { noLine: true }), C(-4, -16, 4, -16, 0.8, 0.8, rampFrom('#2a2630'), { noLine: true })];
    else if (t === 'fogueira') s = [E(0, -1, 9, 2.4, M.rock, { tex: 0.5 }), C(-7, -2, 6, -5, 1.6, 1.6, M.wood, { tex: 0.3 }), C(7, -2, -5, -5, 1.6, 1.6, M.wood, { tex: 0.3 })];
    else if (t === 'quadro') s = [C(-8, 0, -8, -26, 1, 1, M.wood), C(8, 0, 8, -26, 1, 1, M.wood), P([[-11, -12], [11, -12], [11, -28], [-11, -28]], M.wood, { tex: 0.3, stripe: 0.3 }), P([[-9, -15], [-2, -15], [-2, -25], [-9, -25]], M.paper, { amb: 0.6 }), P([[1, -14], [9, -14], [9, -22], [1, -22]], M.paper, { amb: 0.5 }), P([[2, -23], [8, -23], [8, -27], [2, -27]], M.paper, { amb: 0.55 })];
    else if (t === 'livro') s = [P([[-10, -4], [0, -2], [0, -14], [-10, -16]], M.paper, { nx: -0.3, amb: 0.6, stripe: 0.6 }), P([[0, -2], [10, -4], [10, -16], [0, -14]], M.paper, { nx: 0.3, amb: 0.5, stripe: 0.6 }), C(0, -2, 0, -14, 0.6, 0.6, M.red)];
    else if (t === 'berco') s = [C(-9, -1, -10, 3, 0.8, 0.8, M.wood), C(9, -1, 10, 3, 0.8, 0.8, M.wood), E(0, -6, 11, 6, M.wood, { tex: 0.2, stripe: 0.4 }), E(-4, -11, 3.4, 3, rampFrom((look && look.skin) || '#f2c9a6')), E(3, -10, 7, 3, rampFrom('#e8d8b0'), { tex: 0.2 })];
    else { s = []; for (let i = 0; i < 12; i++) s.push(E(-8 + (i % 5) * 4, -1 - Math.floor(i / 5) * 2.6, 2.6, 1.4, M.gold, { amb: 0.4 })); }
    return (cache.misc[key] = rasterize(s, SPR));
  }

  /* ======================= cenário ======================= */
  const TOD = {
    dia: { sky: ['#3a64ac', '#5582c0', '#79a2d0', '#a3c2dc', '#cddbe0'], fog: '#c2d0d6', light: 1, sun: [0.78, 0.16], sunCol: '#fff4d6', cl: '#f4f2ec', cd: '#a8b4c8' },
    tarde: { sky: ['#241e48', '#45285a', '#7a3a66', '#b6565e', '#e2865a', '#f4bc74'], fog: '#d29a78', light: 0.85, sun: [0.52, 0.5], sunCol: '#ffe2a2', cl: '#f6b48a', cd: '#7a4a6a', tint: ['#ff8a50', 0.1] },
    noite: { sky: ['#04060e', '#0a1022', '#111c38', '#192a4a', '#22385a'], fog: '#26345a', light: 0.55, moon: [0.8, 0.18], cl: '#4a5a7a', cd: '#1a2238', tint: ['#1a2a5a', 0.35] },
    tempestade: { sky: ['#20242c', '#2e333e', '#40474f', '#555e68', '#6a737c'], fog: '#727c84', light: 0.65, cl: '#6a727c', cd: '#2a2e36', tint: ['#3a4452', 0.2] },
    neblina: { sky: ['#4e5a5a', '#6a7874', '#8a9890', '#a8b4aa', '#c0c8bc'], fog: '#b2bcb0', light: 0.82, cl: '#d0d6cc', cd: '#8a948c', tint: ['#8a9a90', 0.1] },
    sonho: { sky: ['#140a30', '#2e1452', '#5a2672', '#94448a', '#d0729c', '#f2a8b4'], fog: '#b67ab0', light: 0.85, cl: '#f0c0e0', cd: '#7a3a8a', tint: ['#a050c0', 0.1] },
  };

  function ctxFor(b, sp) {
    const T = TOD[sp.tod] || TOD.dia;
    return { b, w: b.w, h: b.h, T, n: Noise(sp.seed), r: rng(sp.seed), sp, fog: rgb(T.fog), light: T.light, tint: T.tint ? [rgb(T.tint[0]), T.tint[1]] : null, hor: Math.round(b.h * 0.5), over: [], lights: [], amb: 0.4 };
  }
  // pinta um pixel de material com luz, névoa e tom do horário
  function put(S, x, y, rp, v, depth) {
    let c = shade(rp, v * S.light + (1 - S.light) * 0.08, x, y);
    if (depth) c = mixc(c, S.fog, qa(depth, x, y, 6) * 0.95);
    if (S.tint) c = mixc(c, S.tint[0], S.tint[1]);
    S.b.set(x, y, c);
  }

  function paintSky(S, y1) {
    const { b, w, T } = S, sk = T.sky.map(rgb), n = sk.length - 1;
    for (let y = 0; y < y1; y++) {
      const t = (y / Math.max(1, y1 - 1)) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
      for (let x = 0; x < w; x++) b.set(x, y, f > bay(x, y) ? sk[i + 1] : sk[i]);
    }
    if (T.sun) {
      const sx = T.sun[0] * w, sy = T.sun[1] * y1 + 4, sc = rgb(T.sunCol);
      for (let y = 0; y < y1; y++) for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - sx, (y - sy) * 1.1), g = Math.pow(clamp(1 - d / (w * 0.32)), 2) * 0.8;
        if (g > 0) b.mix(x, y, sc, qa(g, x, y, 6));
        if (d < 6) b.set(x, y, d < 4.5 ? [255, 252, 236] : sc);
      }
    }
    if (T.moon) {
      const mx = T.moon[0] * w, my = T.moon[1] * y1 + 4;
      for (let i = 0; i < 70; i++) { const x = Math.floor(S.r() * w), y = Math.floor(S.r() * y1 * 0.9); S.over.push({ k: 'star', x, y, ph: S.r() * 6 }); b.set(x, y, [120, 130, 170]); }
      for (let y = 0; y < y1; y++) for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - mx, y - my), g = Math.pow(clamp(1 - d / 34), 2) * 0.35;
        if (g > 0) b.mix(x, y, [180, 190, 230], qa(g, x, y));
        if (d < 6) { const dd = Math.hypot(x - mx - 2.5, y - my + 1.5); b.set(x, y, dd < 5 ? mixc(sk[1], [200, 200, 230], 0.15) : d < 4.2 ? [246, 242, 220] : [214, 210, 196]); }
      }
    }
    const cl = rgb(T.cl), cd = rgb(T.cd);
    for (let y = 0; y < y1 - 4; y++) for (let x = 0; x < w; x++) {
      const v = S.n.fbm(x * 0.018 + 3, y * 0.06 + 7, 5) - (y / y1) * 0.08, thr = 0.56;
      if (v > thr) {
        const top = S.n.fbm(x * 0.018 + 3, (y - 3) * 0.06 + 7, 5) - ((y - 3) / y1) * 0.08;
        const lit = clamp(0.35 + (v - top) * 4 + (v - thr) * 2);
        b.mix(x, y, mixc(cd, cl, qa(lit, x, y, 4)), qa(Math.min(1, (v - thr) * 9), x, y, 3));
      }
    }
  }

  const ridge = (S, x, base, amp, f, off) => base - amp * S.n.fbm(x * f + off, off * 0.37, 5);

  /* ======================= detalhes: pedra, folhagem, grama ======================= */
  const hash2 = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
  function vor(x, y, sc, seed) {
    const gx = Math.floor(x / sc), gy = Math.floor(y / sc);
    let d1 = 1e9, d2 = 1e9, id = 0, cx = 0, cy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const X = gx + i, Y = gy + j, h = hash2(X, Y, seed);
      const px = (X + ((h & 255) / 255) * 0.8 + 0.1) * sc, py = (Y + (((h >>> 8) & 255) / 255) * 0.8 + 0.1) * sc;
      const d = (x - px) * (x - px) + (y - py) * (y - py);
      if (d < d1) { d2 = d1; d1 = d; id = h; cx = px; cy = py; } else if (d < d2) d2 = d;
    }
    return { d1: Math.sqrt(d1), d2: Math.sqrt(d2), id, cx, cy };
  }
  // pedra facetada: cada célula tem luz própria e as junções viram rachaduras
  function stoneV(x, y, sc, seed) {
    const c = vor(x, y, sc, seed), edge = c.d2 - c.d1;
    const dx = (x - c.cx) / sc, dy = (y - c.cy) / sc;
    let v = 0.4 + (((c.id >>> 16) & 255) / 255) * 0.25 + (-dx * 0.55 - dy * 0.7) * 0.55;
    if (edge < 1.1) v = 0.06 + edge * 0.08; else if (edge < 2) v -= 0.14;
    return v;
  }
  A.stoneV = stoneV;

  function rock(S, cx, cy, rx, ry, depth, mat, mossy) {
    const sc = Math.max(2.5, rx * 0.4), seed = (cx * 7 + cy * 13) | 0;
    for (let y = Math.floor(cy - ry); y <= cy + ry * 0.4; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, q = dx * dx + dy * dy;
      if (q > 1 - S.n.n2(x * 0.45, y * 0.45) * 0.35) continue;
      const nz = Math.sqrt(clamp(1 - q)), dot = dx * LV[0] + dy * LV[1] + nz * LV[2];
      const sv = stoneV(x, y, sc, seed);
      const v = 0.08 + 0.5 * Math.max(0, dot) + (sv - 0.4) * 0.7;
      const moss = mossy !== false && dy < -0.2 + (S.n.n2(x * 0.3, y * 0.3) - 0.5) * 0.7 && dot > 0.25 && rx > 3;
      put(S, x, y, moss ? M.moss : mat || M.rock, moss ? v + 0.15 + (S.n.n2(x * 1.3, y * 1.3) - 0.5) * 0.3 : v, depth);
    }
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) for (let k = 1; k <= 2; k++) S.b.mix(x, Math.round(cy + ry * 0.4) + k, [12, 10, 16], 0.25 / k);
  }

  // folhagem: muitos cachos pequenos, cada um iluminado como uma esfera
  function foliage(S, cx, cy, rx, ry, depth, mat, dense) {
    mat = mat || M.leaf;
    const n = Math.max(6, Math.floor(((rx * ry) / 6) * (dense || 1)));
    const clumps = [];
    for (let i = 0; i < n; i++) {
      const u = Math.sqrt(S.r()), a = S.r() * Math.PI * 2;
      clumps.push([cx + Math.cos(a) * u * rx * 0.85, cy + Math.sin(a) * u * ry * 0.85, 1.6 + S.r() * Math.min(4.2, rx * 0.32)]);
    }
    clumps.sort((p, q) => p[1] - q[1]);
    for (const [px, py, r] of clumps) {
      for (let y = Math.floor(py - r); y <= py + r; y++) for (let x = Math.floor(px - r); x <= px + r; x++) {
        const lx = (x + 0.5 - px) / r, ly = (y + 0.5 - py) / r, q = lx * lx + ly * ly;
        if (q > 1 - S.n.n2(x * 0.9, y * 0.9) * 0.55) continue;
        const gx = (x - cx) / rx, gy = (y - cy) / ry;
        let nx = lx * 0.55 + gx * 0.6, ny = ly * 0.55 + gy * 0.6;
        const m = nx * nx + ny * ny; if (m > 1) { nx /= Math.sqrt(m); ny /= Math.sqrt(m); }
        const nz = Math.sqrt(clamp(1 - nx * nx - ny * ny)), dot = nx * LV[0] + ny * LV[1] + nz * LV[2];
        const v = 0.08 + 0.78 * Math.max(0, dot) + (S.n.n2(x * 1.7, y * 1.7) - 0.5) * 0.22 - Math.max(0, gy - 0.3) * 0.25 - q * 0.12;
        put(S, x, y, mat, v, depth);
      }
    }
  }
  function trunk(S, x0, yb, yt, w, depth) {
    for (let y = Math.round(yt); y <= yb; y++) {
      const t = (y - yt) / Math.max(1, yb - yt), flare = t > 0.8 ? (t - 0.8) * w * 2.5 : 0, hw = w / 2 + flare;
      for (let x = Math.floor(x0 - hw); x <= x0 + hw; x++) {
        const nx = (x - x0) / (hw + 0.01);
        const v = 0.12 + 0.55 * clamp(-nx * 0.7 + Math.sqrt(clamp(1 - nx * nx)) * 0.45) + (S.n.n2(x * 1.6, y * 0.18) - 0.5) * 0.45;
        put(S, x, y, M.bark, v, depth);
      }
    }
  }
  function treeRound(S, cx, cy, r, depth, mat) {
    const yb = Math.round(cy + r * 1.7);
    trunk(S, cx, yb, cy, Math.max(1.5, r * 0.28), depth);
    if (r > 5) { for (let i = 0; i < r * 0.8; i++) { put(S, Math.round(cx - i * 0.8), Math.round(cy + r * 0.5 - i * 0.6), M.bark, 0.3, depth); put(S, Math.round(cx + i * 0.9), Math.round(cy + r * 0.6 - i * 0.5), M.bark, 0.25, depth); } }
    foliage(S, cx - r * 0.35, cy + r * 0.1, r * 0.75, r * 0.6, depth, mat);
    foliage(S, cx + r * 0.4, cy + r * 0.15, r * 0.7, r * 0.55, depth, mat);
    foliage(S, cx, cy - r * 0.35, r * 0.85, r * 0.7, depth, mat);
  }
  function treePine(S, x0, yb, hgt, depth, snowy) {
    x0 = Math.round(x0); yb = Math.round(yb);
    trunk(S, x0, yb, yb - 4, Math.max(1, hgt * 0.07), depth);
    const tiers = Math.max(3, Math.floor(hgt / 5));
    for (let j = 0; j < hgt; j++) {
      const t = j / hgt, tf = (j % Math.ceil(hgt / tiers)) / Math.ceil(hgt / tiers);
      const hw = (t * 0.34 * hgt + 0.7) * (0.6 + tf * 0.5), y = yb - 3 - hgt + j;
      for (let x = Math.floor(x0 - hw - 1); x <= x0 + hw + 1; x++) {
        const rel = (x - x0) / (hw + 0.01);
        if (Math.abs(rel) > 1 + (S.n.n2(x * 1.4, y * 1.4) - 0.5) * 0.5) continue;
        const v = 0.5 - rel * 0.35 - tf * 0.18 + (S.n.n2(x * 1.6, y * 2.2) - 0.5) * 0.5;
        if (snowy && tf < 0.3 && S.n.n2(x * 0.9, y) > 0.35) put(S, x, y, M.snow, v + 0.35, depth); else put(S, x, y, M.leaf, v, depth);
      }
    }
  }
  function grassBlades(S, gTop, mat, count, avoid) {
    const { w, h } = S;
    for (let i = 0; i < count; i++) {
      const y = gTop + 1 + Math.floor(Math.pow(S.r(), 0.6) * (h - gTop - 1)), k = (y - gTop) / (h - gTop), x = Math.floor(S.r() * w);
      if (avoid && avoid(x, y)) continue;
      const len = 1 + Math.floor(k * (2 + S.r() * 5)), lean = (S.r() - 0.4) * 0.9;
      for (let j = 0; j < len; j++) put(S, Math.round(x + lean * j * 0.7), y - j, mat, 0.3 + (j / len) * 0.55 + (S.r() - 0.5) * 0.1, (1 - k) * 0.5);
    }
  }
  // pequenos objetos que enriquecem o chão
  function prop(S, kind, x, y, k) {
    x = Math.round(x); y = Math.round(y);
    const d = (1 - k) * 0.45, s = 0.5 + k;
    if (kind === 'fern') for (let a = -1.3; a <= 1.3; a += 0.32) { const len = (4 + S.r() * 3) * s; for (let i = 0; i < len; i++) { const X = Math.round(x + Math.sin(a) * i), Y = Math.round(y - Math.cos(a) * i * 0.8 + (i * i) / (len * 2.2)); put(S, X, Y, M.leaf, 0.35 + (i / len) * 0.4 + (a < 0 ? 0.1 : -0.05), d); if (i % 2) put(S, X + (a < 0 ? -1 : 1), Y + 1, M.leaf, 0.3, d); } }
    else if (kind === 'mush') { const cap = rampFrom(S.r() < 0.6 ? '#b8322a' : '#c8a060'); for (let i = 0; i < 2 + (k > 0.6 ? 1 : 0); i++) { const mx = x + i * 3, hh = Math.round(2 + s * 2); for (let j = 0; j < hh; j++) put(S, mx, y - j, M.paper, 0.7, d); for (let X = -2; X <= 2; X++) for (let Y = -1; Y <= 0; Y++) put(S, mx + X, y - hh + Y, cap, 0.6 - X * 0.12 + Y * 0.2, d); if (cap[0][0] > 60) S.b.set(mx - 1, y - hh - 1, [240, 230, 220]); } }
    else if (kind === 'log') { const len = Math.round(10 + s * 10), r = Math.max(2, Math.round(s * 2.2)); for (let X = 0; X < len; X++) for (let Y = -r; Y <= r; Y++) put(S, x + X, y + Y - r, M.bark, 0.25 + (-Y / r) * 0.3 + (S.n.n2((x + X) * 0.3, Y * 1.5) - 0.5) * 0.4, d); for (let Y = -r; Y <= r; Y++) for (let X = -1; X <= 0; X++) put(S, x + len + X, y + Y - r, M.wood, 0.55 + (Math.abs(Y) === Math.floor(r / 2) ? -0.25 : 0), d); for (let i = 0; i < len; i += 3) put(S, x + i, y - 2 * r - 1, M.moss, 0.6, d); }
    else if (kind === 'stump') { for (let Y = 0; Y < 4 * s; Y++) for (let X = -3; X <= 3; X++) put(S, x + X, y - Y, M.bark, 0.3 - X * 0.06 + (S.n.n2(X, Y * 2) - 0.5) * 0.3, d); for (let X = -3; X <= 3; X++) put(S, x + X, Math.round(y - 4 * s), M.wood, 0.7 - Math.abs(X) * 0.08, d); }
    else if (kind === 'flowers') { const c = rgb(['#e8d860', '#e88a9a', '#f4f0e8', '#a07ad8', '#e8783a'][Math.floor(S.r() * 5)]); for (let i = 0; i < 5; i++) { const fx = x + Math.round((S.r() - 0.5) * 8), fy = y - Math.round(S.r() * 3); put(S, fx, fy + 1, M.leaf, 0.4, d); S.b.set(fx, fy, c); if (k > 0.6) S.b.set(fx + 1, fy, mixc(c, [255, 255, 255], 0.3)); } }
    else if (kind === 'bush') foliage(S, x, y - 3 * s, 5 * s + 2, 3.5 * s + 1, d, M.leaf);
    else if (kind === 'pebbles') for (let i = 0; i < 4; i++) rock(S, x + (S.r() - 0.5) * 8, y + S.r() * 2, 1 + S.r() * s * 1.5, 0.8 + S.r() * s, d, M.rock, false);
    else if (kind === 'reeds') for (let i = 0; i < 6; i++) { const rx = x + i * 2 - 6, hh = Math.round((6 + S.r() * 6) * s); for (let j = 0; j < hh; j++) put(S, rx + Math.round(j * 0.1), y - j, M.moss, 0.35 + (j / hh) * 0.4, d); put(S, rx + 1, y - hh, M.wood, 0.4, d); put(S, rx + 1, y - hh + 1, M.wood, 0.3, d); }
    else if (kind === 'bones') { for (let i = 0; i < 6; i++) put(S, x + i, y - (i % 2), M.ivory, 0.75, d); put(S, x + 7, y - 1, M.ivory, 0.8, d); put(S, x + 8, y - 2, M.ivory, 0.6, d); }
    else if (kind === 'fence') { for (let i = 0; i < 4; i++) for (let j = 0; j < 7 * s; j++) put(S, x + i * 6, y - j, M.wood, 0.45 - (j === 0 ? 0.15 : 0), d); for (const yy of [y - 2 * s, y - 5 * s]) for (let X = x - 1; X < x + 20; X++) put(S, X, Math.round(yy), M.wood, 0.6, d); }
  }

  function paintMountains(S, base, amp, depth, snow, mat) {
    const { w, h } = S;
    const off = 11 + base * 0.1, hs = [];
    for (let x = -1; x <= w; x++) hs.push(ridge(S, x, base, amp, 0.012, off));
    const rn = (x, y) => 1 - Math.abs(2 * S.n.fbm(x * 0.035 + off, y * 0.05, 4) - 1);
    for (let x = 0; x < w; x++) {
      const top = Math.round(hs[x + 1]), slope = hs[x + 2] - hs[x];
      for (let y = Math.max(0, top); y < h; y++) {
        const dy = y - top, r0 = rn(x, y);
        let v = 0.38 + (rn(x - 1, y) - rn(x + 1, y)) * 2.6 + r0 * 0.25 + (slope > 0 ? 0.12 : -0.06) - dy * 0.005;
        v += (S.n.n2(x * 0.6, y * 0.35) - 0.5) * 0.15;
        const sn = snow && y < base - amp * 0.3 + S.n.n2(x * 0.15, 3) * 7 && r0 > 0.35;
        put(S, x, y, sn ? M.snow : mat || M.rock, sn ? v + 0.35 : v, clamp(depth + dy * 0.014));
      }
    }
  }

  function paintGround(S, gTop, mat, opt) {
    opt = opt || {};
    const { w, h } = S;
    const vx = w * (0.5 + (S.r() - 0.5) * 0.3), bend = S.r() * 6;
    const pathAt = (x, y) => { if (!opt.path) return false; const k = (y - gTop) / (h - gTop), hw = 1.5 + 26 * Math.pow(k, 1.3), cx = vx + (w * 0.5 - vx) * k + Math.sin(k * 3.2 + bend) * 10 * k; return Math.abs(x - cx) < hw + (S.n.n2(x * 0.3, y * 0.3) - 0.5) * 4 * (0.3 + k); };
    const ht = (x, y, k) => S.n.fbm(x * 0.07 / (0.35 + k), y * 0.11 / (0.35 + k * 0.5), 4);
    for (let y = gTop; y < h; y++) {
      const k = (y - gTop) / (h - gTop), depth = clamp((1 - k) * 0.55);
      for (let x = 0; x < w; x++) {
        const hx = ht(x + 1, y, k) - ht(x - 1, y, k), hy = ht(x, y + 1, k) - ht(x, y - 1, k);
        const relief = clamp((-hx * LV[0] - hy * LV[1]) * 5, -0.25, 0.25);
        if (pathAt(x, y)) {
          const st = stoneV(x / (0.4 + k * 0.8), y * 1.6 / (0.4 + k), 3.2, 77);
          put(S, x, y, opt.pathMat || M.dirt, 0.3 + relief * 0.6 + (S.n.n2(x * 0.5 / (0.3 + k), y * 0.6) - 0.5) * 0.35 + (st < 0.2 && k > 0.3 ? -0.15 : 0), depth);
        } else if (opt.ripples) put(S, x, y, mat, 0.45 + relief * 0.8 + Math.sin(x * 0.2 / (0.4 + k) + ht(x, y, k) * 8 + y * 0.5) * 0.14, depth);
        else put(S, x, y, mat, 0.32 + ht(x, y, k) * 0.35 + relief + (S.n.n2(x * 0.7, y * 1.1) - 0.5) * 0.25 + k * 0.06, depth);
      }
    }
    if (opt.tufts) grassBlades(S, gTop, mat, opt.blades || 900, pathAt);
    const props = opt.props || [];
    for (let i = 0; i < (opt.nprops || 12); i++) {
      if (!props.length) break;
      const k = 0.15 + S.r() * 0.85, y = gTop + 3 + k * (h - gTop - 5), x = S.r() * w;
      if (pathAt(x, y)) continue;
      prop(S, props[Math.floor(S.r() * props.length)], x, y, k);
    }
    if (opt.stones) for (let i = 0; i < 8; i++) { const k = S.r(), y = gTop + 3 + k * (h - gTop - 6); rock(S, S.r() * w, y, 1.5 + k * 5, 1 + k * 3, (1 - k) * 0.5); }
  }

  function frameForest(S) {
    const { w, h } = S;
    trunk(S, 5, h, -2, 13, 0);
    trunk(S, w - 6, h, -2, 11, 0);
    for (let i = 0; i < 6; i++) { const y = 20 + i * 14; for (let j = 0; j < 9; j++) put(S, 11 + j, Math.round(y - j * 0.7 + (S.r() - 0.5)), M.bark, 0.3, 0); }
    foliage(S, 18, 8, 34, 16, 0, M.leaf, 0.9);
    foliage(S, w - 16, 6, 30, 14, 0, M.leaf, 0.9);
    foliage(S, w / 2, -6, 50, 9, 0.05, M.leaf, 0.6);
    for (let i = 0; i < 4; i++) { const vx = 18 + i * 8, len = 24 + i * 6; for (let j = 0; j < len; j++) put(S, vx + Math.round(Math.sin(j * 0.4) * 1.5), 16 + j, M.leaf, 0.4 + (j % 3) * 0.08, 0); }
  }
  function lightRays(S, sx, sy) {
    const { w, h } = S;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ang = Math.atan2(y - sy, x - sx), band = S.n.n2(ang * 9, 3.3), d = Math.hypot(x - sx, y - sy);
      if (band > 0.6 && y > sy) S.b.mix(x, y, [255, 246, 210], qa((band - 0.6) * 0.7 * clamp(1 - d / (w * 1.1)), x, y, 5));
    }
  }

  function paintHills(S, base, amp, mat, depth, f) {
    const { w, h } = S;
    for (let x = 0; x < w; x++) {
      const top = Math.round(ridge(S, x, base, amp, f || 0.02, 37)), t2 = ridge(S, x + 2, base, amp, f || 0.02, 37);
      for (let y = Math.max(0, top); y < h; y++) put(S, x, y, mat, 0.45 + (t2 > top ? 0.15 : -0.08) + (S.n.fbm(x * 0.12, y * 0.12, 3) - 0.5) * 0.45 - (y - top) * 0.004, depth);
    }
  }
  function treeDead(S, x0, yb, hgt, depth) {
    const seg = (x, y, a, len, wdt) => {
      for (let i = 0; i < len; i++) { const X = Math.round(x + Math.cos(a) * i), Y = Math.round(y - Math.sin(a) * i); for (let k = 0; k < wdt; k++) put(S, X + k, Y, M.bark, k ? 0.2 : 0.45, depth); }
      return [x + Math.cos(a) * len, y - Math.sin(a) * len];
    };
    const [tx, ty] = seg(x0, yb, Math.PI / 2, hgt, 2);
    seg(tx, ty + 4, 2.3, hgt * 0.45, 1); seg(tx, ty + 7, 0.6, hgt * 0.4, 1); seg(tx - 1, ty, 1.9, hgt * 0.3, 1);
  }


  function palm(S, x0, yb) {
    x0 = Math.round(x0); yb = Math.round(yb);
    for (let j = 0; j < 22; j++) { const x = x0 + Math.round(Math.sin(j * 0.12) * 3); put(S, x, yb - j, M.bark, 0.5, 0.05); put(S, x + 1, yb - j, M.bark, 0.25, 0.05); }
    const tx = x0 + Math.round(Math.sin(22 * 0.12) * 3), ty = yb - 22;
    for (const a of [-2.6, -2.1, -1.2, -0.5, 0.2, 0.7]) for (let i = 0; i < 12; i++) { const x = Math.round(tx + Math.cos(a) * i * 1.1), y = Math.round(ty + Math.sin(a) * i * 0.5 + i * i * 0.05); put(S, x, y, M.leaf, 0.6 - i * 0.03, 0.05); put(S, x, y + 1, M.leaf, 0.3, 0.05); }
  }
  function cactus(S, x0, yb) {
    x0 = Math.round(x0); yb = Math.round(yb);
    const mat = rampFrom('#4a8a3a');
    for (let y = yb - 18; y <= yb; y++) for (let dx = -2; dx <= 2; dx++) put(S, x0 + dx, y, mat, 0.3 + (2 - dx) * 0.12, 0.1);
    for (let y = yb - 12; y <= yb - 9; y++) for (let dx = -6; dx <= -3; dx++) put(S, x0 + dx, y, mat, 0.5, 0.1);
    for (let y = yb - 16; y <= yb - 9; y++) for (let dx = -7; dx <= -5; dx++) put(S, x0 + dx, y, mat, 0.45 + (dx === -7 ? 0.15 : 0), 0.1);
  }

  function paintOutdoor(S, biome) {
    const { w, h } = S, hor = Math.round(h * 0.48);
    paintSky(S, hor + 14);
    const gTop = hor + 10;
    if (biome === 'montanha' || biome === 'tundra') { paintMountains(S, hor + 4, h * 0.42, 0.62, true); paintMountains(S, hor + 10, h * 0.22, 0.4, biome === 'tundra'); }
    else if (biome !== 'costa') paintMountains(S, hor + 4, h * 0.2, 0.72, false);
    if (biome === 'costa') {
      for (let y = hor; y < gTop + 8; y++) for (let x = 0; x < w; x++) {
        const k = (y - hor) / (gTop + 8 - hor), wave = S.n.n2(x * 0.12 / (0.2 + k), y * 1.4);
        put(S, x, y, M.water, 0.55 - k * 0.15 + (wave > 0.62 ? 0.35 : 0) + (S.T.sun && Math.abs(x - S.T.sun[0] * w) < 6 + k * 14 && wave > 0.45 ? 0.4 : 0), (1 - k) * 0.35);
        if (wave > 0.7 && S.r() < 0.3) S.over.push({ k: 'glint', x, y });
      }
      paintGround(S, gTop + 8, M.sand, { stones: true });
      for (let x = 0; x < w; x++) { const y = gTop + 8 + Math.round(S.n.n2(x * 0.1, 5) * 3); put(S, x, y, M.sand, 0.95, 0.1); put(S, x, y + 1, M.sand, 0.35, 0.1); }
      for (let i = 0; i < 3; i++) palm(S, 16 + i * 70 + S.r() * 20, gTop + 12 + S.r() * 6);
      return { gTop: gTop + 8 };
    }
    if (biome === 'deserto') {
      paintHills(S, hor + 8, 10, M.sand, 0.5, 0.025);
      paintGround(S, gTop + 2, M.sand, { ripples: true, props: ['bones', 'pebbles'], nprops: 6 });
      rock(S, w * 0.85, gTop + 12, 14, 9, 0.15, rampFrom('#a0603a'), false);
      for (let i = 0; i < 3; i++) cactus(S, 20 + S.r() * (w - 40), gTop + 10 + S.r() * 20);
      return { gTop: gTop + 2 };
    }
    if (biome === 'pantano') {
      for (let i = 0; i < 9; i++) treeDead(S, Math.floor(S.r() * w), hor + 10, 14 + S.r() * 10, 0.55);
      paintGround(S, gTop, M.swamp, { tufts: true, blades: 700, props: ['reeds', 'reeds', 'mush', 'log', 'bones'], nprops: 12 });
      for (let y = gTop + 4; y < h; y++) for (let x = 0; x < w; x++) if (S.n.fbm(x * 0.035, y * 0.12 + 40, 3) < 0.4) { const sk = S.b.get(x, Math.max(0, 2 * gTop - y - 4)); S.b.set(x, y, mixc(mixc(sk, [30, 40, 30], 0.55), [10, 14, 10], ((y - gTop) / h) * 0.4)); }
      treeDead(S, 10, h - 4, 40, 0.05); treeDead(S, w - 18, h - 2, 36, 0.05);
      S.over.push({ k: 'mist' });
      return { gTop };
    }
    if (biome === 'tundra') {
      for (let i = 0; i < 14; i++) treePine(S, S.r() * w, hor + 12 + S.r() * 4, 8 + S.r() * 6, 0.45, true);
      paintGround(S, gTop, M.snow, { path: true, pathMat: M.snow, props: ['pebbles'], nprops: 6 });
      rock(S, w * 0.75, gTop + 18, 10, 6, 0.1, M.rock, false);
      for (const x of [8, w - 10]) treePine(S, x, h - 2, 52, 0, true);
      S.over.push({ k: 'snow' });
      return { gTop };
    }
    if (biome === 'montanha') {
      for (let i = 0; i < 14; i++) treePine(S, S.r() * w, hor + 14 + S.r() * 4, 7 + S.r() * 8, 0.4, false);
      paintGround(S, gTop + 2, M.moss, { path: true, stones: true, tufts: true, blades: 600, props: ['pebbles', 'fern', 'bush'], nprops: 8 });
      rock(S, 10, h - 8, 26, 24, 0); rock(S, 26, h - 2, 14, 9, 0); rock(S, w - 8, h - 4, 22, 18, 0);
      treePine(S, w - 18, h - 18, 34, 0, false);
      return { gTop: gTop + 2 };
    }
    if (biome === 'floresta') {
      for (let x = -10; x < w + 10; x += 14) foliage(S, x + S.r() * 6, hor + 2 + S.r() * 4, 12, 9, 0.6, M.leaf, 0.7);
      for (let i = 0; i < 7; i++) treeRound(S, 20 + S.r() * (w - 40), hor + 2 + S.r() * 5, 7 + S.r() * 5, 0.32);
      paintGround(S, gTop, M.grass, { path: true, tufts: true, blades: 1100, props: ['fern', 'fern', 'mush', 'log', 'stump', 'flowers', 'bush'], nprops: 14 });
      if (S.sp.tod === 'dia' || S.sp.tod === 'neblina') lightRays(S, w * 0.8, -10);
      frameForest(S);
      S.over.push({ k: 'motes' });
      return { gTop };
    }
    paintHills(S, hor + 9, 6, M.grass, 0.45, 0.03);
    for (let x = 0; x < w; x += 9) if (S.r() < 0.5) foliage(S, x, hor + 9, 6, 3, 0.5, M.leaf, 0.7);
    for (let i = 0; i < 5; i++) treeRound(S, S.r() * w, hor + 6 + S.r() * 6, 4 + S.r() * 5, 0.32);
    paintGround(S, gTop + 2, M.grass, { path: true, tufts: true, blades: 1000, stones: true, props: ['flowers', 'flowers', 'bush', 'pebbles', 'fence'], nprops: 10 });
    return { gTop: gTop + 2 };
  }

  function paintTown(S, kind) {
    const { w, h } = S, hor = Math.round(h * 0.45), night = S.sp.tod === 'noite';
    paintSky(S, hor + 20);
    paintMountains(S, hor + 6, 18, 0.75, false);
    let x = -6;
    while (x < w) {
      const hw = 22 + Math.floor(S.r() * 14), hh = 20 + Math.floor(S.r() * 14), base = hor + 26, top = base - hh;
      const roofM = S.r() < 0.7 ? M.roof : M.roofB;
      for (let y = top; y < base; y++) for (let X = x; X < x + hw; X++) {
        const timber = (X - x) % 9 === 0 || y === top || y === top + Math.floor(hh / 2) || ((X - x + (y - top)) % 9 === 0 && y > top + hh / 2);
        put(S, X, y, timber ? M.wood : M.plaster, timber ? 0.3 : 0.6 + (S.n.n2(X * 0.4, y * 0.4) - 0.5) * 0.25 - ((X - x) / hw) * 0.15, 0.15);
      }
      for (let j = 0; j < 12; j++) for (let X = x - 3 + j; X < x + hw + 3 - j; X++) put(S, X, top - 1 - j, roofM, 0.35 + (j % 3 === 0 ? -0.12 : 0.1) + (X < x + hw / 2 ? 0.15 : -0.05), 0.15);
      if (S.r() < 0.6) for (let y = top - 16; y < top - 4; y++) for (let X = x + hw - 8; X < x + hw - 4; X++) put(S, X, y, M.stone, 0.45, 0.15);
      for (const wx of [x + 5, x + hw - 10]) {
        for (let y = top + 4; y < top + 10; y++) for (let X = wx; X < wx + 5; X++) S.b.set(X, y, night ? (X === wx + 2 || y === top + 7 ? [90, 50, 20] : [250, 200, 110]) : X === wx + 2 || y === top + 7 ? [60, 40, 30] : mixc([40, 60, 90], [140, 170, 200], (y - top - 4) / 8));
        for (let y = top + 3; y < top + 11; y++) { put(S, wx - 2, y, roofM, 0.3 + (y % 2) * 0.1, 0.12); put(S, wx - 1, y, roofM, 0.45, 0.12); put(S, wx + 5, y, roofM, 0.4, 0.12); put(S, wx + 6, y, roofM, 0.25 + (y % 2) * 0.1, 0.12); }
        for (let X = wx - 1; X < wx + 6; X++) { put(S, X, top + 10, M.wood, 0.55, 0.12); put(S, X, top + 11, M.wood, 0.3, 0.12); if (S.r() < 0.6) S.b.set(X, top + 9, rgb(['#d84a3a', '#f0c040', '#e88aa0', '#5aa040'][Math.floor(S.r() * 4)])); }
      }
      for (let y = base - 9; y < base; y++) for (let X = x + Math.floor(hw / 2) - 3; X < x + Math.floor(hw / 2) + 3; X++) put(S, X, y, M.wood, 0.3 + (X % 2) * 0.1, 0.1);
      x += hw + 2 + Math.floor(S.r() * 5);
    }
    const gTop = hor + 26;
    for (let y = gTop; y < h; y++) {
      const k = (y - gTop) / (h - gTop);
      for (let X = 0; X < w; X++) put(S, X, y, M.stone, 0.12 + stoneV((X - w / 2) / (0.35 + k) + w / 2, (y - gTop) / (0.25 + k * 0.6), 4.5, 31) * 0.95 + k * 0.05, (1 - k) * 0.4);
    }
    for (let i = 0; i < 4; i++) {
      const bx = Math.round(10 + S.r() * (w - 20)), by = gTop + 3;
      for (let y = by - 9; y < by; y++) for (let x = bx - 4; x <= bx + 4; x++) { const nx = (x - bx) / 4.5; put(S, x, y, (y - by + 9) % 4 === 1 ? M.steel : M.wood, 0.15 + 0.6 * clamp(-nx * 0.6 + Math.sqrt(clamp(1 - nx * nx)) * 0.5), 0.1); }
      if (S.r() < 0.5) for (let y = by - 7; y < by; y++) for (let x = bx + 6; x < bx + 13; x++) put(S, x, y, M.wood, (x === bx + 6 || y === by - 7 || x === bx + 12 || y === by - 1 || x - bx - 6 === y - by + 7) ? 0.25 : 0.55, 0.1);
    }
    if (kind === 'mercado') for (let i = 0; i < 3; i++) {
      const sx = 14 + i * 62, sy = gTop + 18, cols = [['#c8402c', '#f0e8d0'], ['#3a5ea8', '#f0e8d0'], ['#3e8a4a', '#f0e8d0']][i];
      for (let y = sy - 22; y < sy - 16; y++) for (let X = sx; X < sx + 36; X++) put(S, X, y, rampFrom(cols[Math.floor((X - sx) / 5) % 2]), 0.6 - (y - sy + 22) * 0.06, 0);
      for (let y = sy - 16; y < sy; y++) { put(S, sx + 1, y, M.wood, 0.5, 0); put(S, sx + 34, y, M.wood, 0.4, 0); }
      for (let y = sy - 6; y < sy; y++) for (let X = sx; X < sx + 36; X++) put(S, X, y, M.wood, 0.45 + (y === sy - 6 ? 0.25 : 0), 0);
      for (let f = 0; f < 8; f++) rock(S, sx + 4 + f * 4, sy - 7, 1.8, 1.6, 0, rampFrom(['#d8402a', '#f0a830', '#5aa040', '#e8d860', '#a04a8a'][f % 5]));
    }
    if (kind === 'festa') {
      const cols = ['#d8402a', '#f0a830', '#3e9a4a', '#3a5ea8', '#a04a8a'];
      for (let line = 0; line < 2; line++) for (let X = 0; X < w; X++) {
        const y = 12 + line * 14 + Math.round(Math.sin(X * 0.06 + line) * 4);
        S.b.set(X, y, [50, 34, 24]);
        if (X % 7 === 0) { const c = rgb(cols[(X / 7 + line) % 5]); for (let j = 1; j < 4; j++) for (let i = -2 + j; i <= 2 - j; i++) S.b.set(X + i, y + j, c); }
        if (X % 23 === 11) S.over.push({ k: 'lantern', x: X, y: y + 2 });
      }
      if (night) S.over.push({ k: 'fireworks' });
    }
    return { gTop };
  }

  function lightAt(S, x, y) {
    let L = S.amb, wsum = 0, col = [0, 0, 0];
    for (const [lx, ly, r, c] of S.lights) {
      const d = Math.hypot(x - lx, (y - ly) * 1.1), f = Math.pow(clamp(1 - d / r), 2);
      if (f <= 0) continue;
      L += f * 0.85; col = mixc(col, c, f / (wsum + f)); wsum += f;
    }
    return [clamp(L, 0, 1.15), col, clamp(wsum)];
  }
  function putLit(S, x, y, rp, v) {
    const [L, col, ws] = lightAt(S, x, y);
    let c = shade(rp, v * L, x, y);
    if (ws > 0.05) c = mixc(c, col, qa(ws * 0.25, x, y, 4));
    S.b.set(x, y, c);
  }
  function paintInterior(S, kind) {
    const { w, h } = S, floor = Math.round(h * 0.74), r = S.r;
    S.amb = kind === 'caverna' ? 0.28 : 0.46;
    if (kind === 'taverna') S.lights.push([28, floor - 8, 60, [255, 150, 60]], [96, 8, 52, [255, 200, 120]], [160, 22, 40, [255, 200, 120]]);
    if (kind === 'casa') S.lights.push([150, floor - 6, 70, [255, 150, 60]], [38, 34, 50, [200, 220, 255]], [84, floor - 20, 26, [255, 200, 120]]);
    if (kind === 'templo') S.lights.push([96, 30, 80, [255, 240, 200]], [76, floor - 20, 26, [255, 200, 120]], [116, floor - 20, 26, [255, 200, 120]], [54, floor - 18, 30, [255, 160, 70]], [138, floor - 18, 30, [255, 160, 70]]);
    if (kind === 'biblioteca') S.lights.push([110, floor - 16, 64, [255, 190, 110]]);
    if (kind === 'caverna') S.lights.push([24, 46, 60, [255, 150, 70]], [170, 50, 56, [255, 150, 70]], [110, floor + 6, 34, [120, 220, 255]], [44, floor, 30, [110, 210, 250]], [160, floor, 30, [180, 130, 250]]);
    for (let y = 0; y < floor; y++) for (let x = 0; x < w; x++) {
      if (kind === 'taverna' || kind === 'casa') {
        const board = Math.floor(x / 9), seam = x % 9 === 0, beam = y >= 12 && y < 17;
        putLit(S, x, y, M.wood, beam ? 0.35 + (y === 12 ? 0.2 : 0) : seam ? 0.15 : 0.45 + ((board * 37) % 7) * 0.03 + (S.n.n2(x * 0.15, y * 0.04 + board) - 0.5) * 0.3);
      } else if (kind === 'templo' || kind === 'biblioteca') {
        const row = Math.floor(y / 7), cx = (x + (row % 2) * 7) % 14, cy = y % 7;
        putLit(S, x, y, M.stone, cx === 0 || cy === 0 ? 0.15 : 0.5 + (S.n.n2(x * 0.3, y * 0.3) - 0.5) * 0.3 + (cy === 1 ? 0.1 : 0));
      } else putLit(S, x, y, M.rock, 0.25 + S.n.fbm(x * 0.06, y * 0.08, 5) * 0.55 + (S.n.n2(x * 0.4, y * 0.4) - 0.5) * 0.2);
    }
    for (let y = floor; y < h; y++) {
      const k = (y - floor) / (h - floor);
      for (let x = 0; x < w; x++) {
        if (kind === 'caverna') putLit(S, x, y, M.rock, 0.3 + S.n.fbm(x * 0.08, y * 0.3, 3) * 0.4);
        else if (kind === 'templo') { const tx = Math.floor((x - w / 2) / (6 + k * 14) + 50), ty = Math.floor((y - floor) / (2 + k * 5)); putLit(S, x, y, (tx + ty) % 2 ? M.stone : M.plaster, 0.45 + (1 - k) * 0.1); }
        else { const sw = 6 + k * 16, seam = Math.floor(((x - w / 2) / sw) * 2) !== Math.floor(((x - 1 - w / 2) / sw) * 2); putLit(S, x, y, M.wood, seam ? 0.2 : 0.45 + (S.n.n2(x * 0.1, y) - 0.5) * 0.2); }
      }
    }
    const cyl = (x0, x1, y0, y1, mat) => { const cx = (x0 + x1) / 2, R = (x1 - x0) / 2; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const nx = (x - cx) / R; putLit(S, x, y, mat, 0.15 + 0.75 * clamp(-nx * 0.6 + Math.sqrt(clamp(1 - nx * nx)) * 0.5) + (S.n.n2(x * 0.3, y * 0.2) - 0.5) * 0.2); } };
    if (kind === 'taverna') {
      for (let y = floor - 34; y < floor; y++) for (let x = 6; x < 50; x++) { const inner = x > 14 && x < 42 && y > floor - 22; putLit(S, x, y, inner ? M.rock : M.stone, inner ? 0.08 : 0.45 + ((Math.floor(y / 5) + Math.floor(x / 8)) % 2) * 0.1); }
      S.over.push({ k: 'fire', x: 28, y: floor - 1, s: 1.4 });
      for (let x = 112; x < w; x++) for (let y = floor - 48; y < floor - 46; y++) putLit(S, x, y, M.wood, 0.55);
      for (let i = 0; i < 10; i++) { const bx = 116 + i * 7, c = rampFrom(['#3a7a4a', '#8a2a2a', '#c8a050', '#3a5a8a'][i % 4]); for (let y = floor - 58; y < floor - 48; y++) for (let X = bx; X < bx + 3; X++) if (y > floor - 55 || X === bx + 1) putLit(S, X, y, c, 0.4 + (X === bx ? 0.3 : 0)); }
      for (const bx of [128, 150, 172]) cyl(bx - 8, bx + 8, floor - 42, floor - 22, M.wood);
      for (let y = floor - 16; y < floor + 4; y++) for (let x = 112; x < w; x++) putLit(S, x, y, M.wood, y < floor - 13 ? 0.7 : 0.35 + ((x - 112) % 12 === 0 ? -0.15 : 0));
      for (const lx of [96, 160]) S.over.push({ k: 'lantern', x: lx, y: 20 });
    }
    if (kind === 'casa') {
      const T = TOD[S.sp.tod] || TOD.dia, sk = T.sky.map(rgb);
      for (let y = 20; y < 50; y++) for (let x = 22; x < 54; x++) {
        if (x < 24 || x > 51 || y < 22 || y > 47 || x === 37 || y === 34) putLit(S, x, y, M.wood, 0.35);
        else S.b.set(x, y, sk[Math.min(sk.length - 1, Math.floor(((y - 20) / 30) * sk.length))]);
      }
      for (let y = floor - 52; y < floor; y++) for (let x = 124; x < 178; x++) { const inner = x > 134 && x < 168 && y > floor - 26; putLit(S, x, y, inner ? M.rock : M.stone, inner ? 0.06 : 0.45 + ((Math.floor(y / 5) + Math.floor(x / 9)) % 2) * 0.12); }
      for (let y = floor - 30; y < floor - 26; y++) for (let x = 118; x < 184; x++) putLit(S, x, y, M.wood, 0.6);
      S.over.push({ k: 'fire', x: 151, y: floor - 1, s: 1.3 });
      for (let y = floor - 14; y < floor - 11; y++) for (let x = 64; x < 104; x++) putLit(S, x, y, M.wood, 0.65);
      for (const lx of [67, 99]) for (let y = floor - 11; y < floor + 4; y++) putLit(S, lx, y, M.wood, 0.3);
    }
    if (kind === 'templo') {
      for (let y = 6; y < 50; y++) for (let x = 82; x < 110; x++) { const dx = x - 96; if (y < 18 && dx * dx + (y - 18) * (y - 18) > 14 * 14) continue; const cell = (Math.floor(x / 4) + Math.floor(y / 5) * 3) % 5; S.b.set(x, y, x % 4 === 0 || y % 5 === 0 ? [40, 36, 50] : rgb(['#e8c060', '#6a9ad8', '#d86a5a', '#8ad0a0', '#f0e8d0'][cell])); }
      for (const cx of [30, 162]) cyl(cx - 9, cx + 9, 0, floor + 6, M.stone);
      for (let y = floor - 12; y < floor; y++) for (let x = 70; x < 122; x++) putLit(S, x, y, M.plaster, y === floor - 12 ? 0.9 : 0.6);
      for (const cx of [76, 116]) { for (let y = floor - 20; y < floor - 12; y++) for (let x = cx - 1; x <= cx; x++) putLit(S, x, y, M.white, 0.8); S.over.push({ k: 'candle', x: cx, y: floor - 21 }); }
      S.over.push({ k: 'shaft', x: 96, y: 30 }, { k: 'motes' });
    }
    if (kind === 'biblioteca') {
      for (let shelf = 0; shelf < 5; shelf++) {
        const sy = 4 + shelf * 16;
        if (sy > floor - 4) break;
        for (let x = 2; x < w - 2;) {
          const bw = 2 + Math.floor(r() * 3), bh = 8 + Math.floor(r() * 4), c = rampFrom(['#8a2a2a', '#2a4a7a', '#3a6a3a', '#b08a3a', '#5a2a6a', '#c8b898', '#6a3a1a'][Math.floor(r() * 7)]);
          for (let y = sy + 12 - bh; y < sy + 12; y++) for (let X = x; X < x + bw; X++) putLit(S, X, y, c, 0.35 + (X === x ? 0.3 : 0) + (y === sy + 12 - bh + 2 ? 0.25 : 0));
          x += bw + (r() < 0.12 ? 3 : 0);
        }
        for (let x = 0; x < w; x++) for (let y = sy + 12; y < sy + 15; y++) putLit(S, x, y, M.wood, y === sy + 12 ? 0.7 : 0.35);
      }
      for (let y = floor - 14; y < floor - 11; y++) for (let x = 90; x < 130; x++) putLit(S, x, y, M.wood, 0.65);
      S.over.push({ k: 'candle', x: 110, y: floor - 15 }, { k: 'motes' });
    }
    if (kind === 'caverna') {
      for (let i = 0; i < 14; i++) { const x = Math.floor(r() * w), len = 6 + r() * 16; for (let j = 0; j < len; j++) for (let k = -Math.floor((len - j) / 5); k <= Math.floor((len - j) / 5); k++) putLit(S, x + k, j, M.rock, 0.35 - k * 0.08); }
      for (const tx of [24, 170]) { for (let y = 46; y < 56; y++) putLit(S, tx, y, M.wood, 0.4); S.over.push({ k: 'fire', x: tx, y: 46, s: 0.6 }); }
      for (let i = 0; i < 5; i++) { const cx = 96 + i * 7, hh = 6 + (i % 3) * 4; for (let y = 0; y < hh; y++) for (let x = -1; x <= 1; x++) S.b.set(cx + x, floor + 8 - y, mixc([90, 200, 240], [220, 250, 255], ((x + 1) / 2) * (1 - y / hh))); }
      S.over.push({ k: 'drip' });
    }
    // ---- mobília e objetos ----
    const ell = (cx, cy, rx, ry, mat, vb, flat) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry, q = dx * dx + dy * dy; if (q > 1) continue; const nz = Math.sqrt(1 - q), dot = flat ? 0.6 - dy * 0.3 : dx * LV[0] + dy * LV[1] + nz * LV[2]; putLit(S, x, y, mat, (vb || 0) + 0.15 + 0.7 * Math.max(0, dot)); } };
    const box = (x0, y0, x1, y1, mat, v, edge) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) putLit(S, x, y, mat, v + (edge && (x === x0 || y === y0) ? 0.2 : 0) + (S.n.n2(x * 0.5, y * 0.5) - 0.5) * 0.15); };
    const mug = (x, y) => { box(x, y - 4, x + 3, y, M.wood, 0.55, true); putLit(S, x + 3, y - 3, M.wood, 0.4); for (let X = x; X < x + 3; X++) S.b.set(X, y - 5, [240, 232, 210]); };
    if (kind === 'taverna') {
      for (let y = 0; y < 8; y++) putLit(S, 96, y, M.steel, 0.4);
      ell(96, 9, 13, 1.6, M.wood, 0.1);
      for (const cx of [85, 96, 107]) { box(cx, 4, cx + 2, 8, M.white, 0.7); S.over.push({ k: 'candle', x: cx + 1, y: 3 }); }
      for (let i = 0; i < 7; i++) { const hx = 58 + i * 6, len = 4 + (i % 3) * 2; for (let j = 0; j < len; j++) putLit(S, hx, 17 + j, i % 2 ? M.straw : M.red, 0.5 - j * 0.03); }
      for (let i = 0; i < 6; i++) ell(56 + i * 9, 24, 3.2, 3.2, rampFrom(['#d8d0c0', '#6a8ab0', '#c8a060'][i % 3]), 0.1, true);
      for (let y = 25; y < 27; y++) for (let x = 52; x < 106; x++) putLit(S, x, y + 3, M.wood, 0.6);
      ell(70, floor + 3, 15, 3.2, M.wood, 0.15, true); box(68, floor + 5, 72, floor + 16, M.wood, 0.3);
      mug(62, floor + 3); mug(74, floor + 2); ell(68, floor + 2, 3, 1, M.white, 0.2, true);
      for (const sx of [50, 88]) { ell(sx, floor + 9, 5, 1.6, M.wood, 0.2, true); box(sx - 1, floor + 10, sx + 1, floor + 18, M.wood, 0.25); }
    }
    if (kind === 'templo') {
      for (const [x0, x1] of [[0, 46], [146, 192]]) for (let row = 0; row < 3; row++) { const y = floor + 6 + row * 8; box(x0, y, x1, y + 2, M.wood, 0.6, true); box(x0, y + 2, x1, y + 6, M.wood, 0.3); }
      for (const cx of [30, 162]) { box(cx - 6, 8, cx + 6, 44, M.red, 0.45); for (let y = 8; y < 44; y++) { putLit(S, cx - 6, y, M.gold, 0.6); putLit(S, cx + 5, y, M.gold, 0.6); } for (let x = cx - 6; x < cx + 6; x++) putLit(S, x, 44 + (Math.abs(x - cx) < 3 ? 2 : 0), M.red, 0.35); ell(cx, 24, 3, 3, M.gold, 0.2); }
      for (const bx of [54, 138]) { box(bx - 1, floor - 14, bx + 1, floor + 2, M.steel, 0.4); ell(bx, floor - 15, 5, 2, M.steel, 0.2); S.over.push({ k: 'fire', x: bx, y: floor - 16, s: 0.5 }); }
    }
    if (kind === 'casa') {
      box(2, floor - 10, 52, floor + 6, M.wood, 0.35, true);
      for (let y = floor - 9; y < floor + 2; y++) for (let x = 3; x < 51; x++) { const c = (Math.floor(x / 6) + Math.floor(y / 4)) % 2; putLit(S, x, y, c ? rampFrom('#8a2a3a') : rampFrom('#d8c8a0'), 0.5 + (y === floor - 9 ? 0.2 : 0)); }
      ell(10, floor - 10, 7, 3, M.white, 0.1);
      for (let y = floor + 8; y < floor + 22; y++) for (let x = 60; x < 120; x++) { const dx = (x - 90) / 30, dy = (y - floor - 15) / 7; const q = dx * dx + dy * dy; if (q > 1) continue; putLit(S, x, y, q > 0.7 ? M.gold : (Math.floor(x / 4) + Math.floor(y / 2)) % 3 ? M.red : rampFrom('#3a4a7a'), 0.5); }
      for (let y = 40; y < 42; y++) for (let x = 60; x < 108; x++) putLit(S, x, y, M.wood, 0.6);
      for (let i = 0; i < 6; i++) ell(64 + i * 8, 36, 2.6, 3.6, rampFrom(['#a0603a', '#6a8a4a', '#c8b088', '#5a6a9a'][i % 4]), 0.1);
      box(83, floor - 20, 85, floor - 14, M.white, 0.7); S.over.push({ k: 'candle', x: 84, y: floor - 21 });
      ell(76, floor - 15, 4, 1.6, M.straw, 0.2);
    }
    if (kind === 'biblioteca') {
      ell(36, floor - 10, 7, 7, rampFrom('#3a6a9a'), 0.05);
      for (let y = floor - 15; y < floor - 5; y++) for (let x = 31; x < 41; x++) if (S.n.n2(x * 0.5, y * 0.5) > 0.55) { const dx = (x - 36) / 7, dy = (y - floor + 10) / 7; if (dx * dx + dy * dy < 0.9) putLit(S, x, y, M.grass, 0.6); }
      box(35, floor - 3, 37, floor + 6, M.wood, 0.4); ell(36, floor + 6, 5, 1.4, M.wood, 0.2, true);
      for (let i = 0; i < 40; i++) { const t = i / 40; const x = Math.round(156 + t * 18), y = Math.round(10 + t * (floor - 4)); putLit(S, x, y, M.wood, 0.55); putLit(S, x + 7, y, M.wood, 0.45); if (i % 5 === 0) for (let X = x; X <= x + 7; X++) putLit(S, X, y, M.wood, 0.5); }
      for (let i = 0; i < 4; i++) box(140 - i, floor + 8 - i * 3, 152 - i, floor + 11 - i * 3, rampFrom(['#8a2a2a', '#2a4a7a', '#b08a3a', '#3a6a3a'][i]), 0.45, true);
    }
    if (kind === 'caverna') {
      for (const [cx, cy, col] of [[44, floor + 4, '#6ad0f0'], [160, floor + 2, '#b07af0'], [70, floor - 30, '#6ad0f0']]) {
        for (let k = 0; k < 4; k++) { const hh = 6 + k * 3, x0 = cx - 6 + k * 4; for (let y = 0; y < hh; y++) for (let x = -1; x <= 1; x++) S.b.set(x0 + x - Math.round(y * (k - 1.5) * 0.15), cy - y, mixc(rgb(col), [255, 255, 255], (x === -1 ? 0.4 : 0) + (y / hh) * 0.3)); }
        S.over.push({ k: 'sparkle', x: cx, y: cy - 8 });
      }
      for (let i = 0; i < 6; i++) { const mx = 90 + i * 8, my = floor + 14 + (i % 2) * 3; for (let j = 0; j < 3; j++) S.b.set(mx, my - j, [200, 230, 220]); for (let x = -2; x <= 2; x++) S.b.set(mx + x, my - 3, mixc([90, 220, 200], [220, 255, 250], (2 - Math.abs(x)) / 3)); }
      for (let y = floor + 20; y < floor + 26; y++) for (let x = 120; x < 160; x++) { const dx = (x - 140) / 20, dy = (y - floor - 23) / 3; if (dx * dx + dy * dy < 1) S.b.set(x, y, mixc(S.b.get(x, 2 * (floor + 20) - y), [40, 80, 110], 0.5)); }
    }
    return { gTop: floor };
  }

  function paintSea(S) {
    const { w, h } = S, hor = Math.round(h * 0.45);
    paintSky(S, hor + 2);
    for (let y = hor; y < h; y++) {
      const k = (y - hor) / (h - hor);
      for (let x = 0; x < w; x++) {
        const wave = S.n.n2(x * 0.1 / (0.15 + k), y * 0.9);
        let c = shade(M.water, 0.5 - k * 0.2 + (wave > 0.6 ? 0.3 : wave < 0.3 ? -0.15 : 0), x, y);
        c = mixc(c, S.b.get(x, Math.max(0, 2 * hor - y)), (1 - k) * 0.35);
        if (S.tint) c = mixc(c, S.tint[0], S.tint[1]);
        S.b.set(x, y, c);
        if (wave > 0.72 && S.r() < 0.3) S.over.push({ k: 'glint', x, y });
      }
    }
    const py = h - 22;
    for (let y = py; y < py + 5; y++) for (let x = 0; x < 72; x++) put(S, x, y, M.wood, (x % 8 === 0 ? 0.15 : 0.55) + (y === py ? 0.2 : 0), 0);
    for (const px of [6, 34, 64]) for (let y = py + 5; y < h; y++) for (let x = px; x < px + 3; x++) put(S, x, y, M.wood, 0.3 + (x === px ? 0.15 : 0), 0);
    const bx = 120, by = hor + 26;
    for (let y = by; y < by + 7; y++) for (let x = bx + (y - by); x < bx + 46 - (y - by); x++) put(S, x, y, M.wood, 0.5 - (y - by) * 0.05, 0.2);
    for (let y = by - 34; y < by; y++) put(S, bx + 22, y, M.wood, 0.4, 0.2);
    for (let y = by - 32; y < by - 4; y++) for (let x = bx + 23; x < bx + 23 + (y - by + 32) * 0.65; x++) put(S, x, y, M.paper, 0.75 - (x - bx - 23) * 0.02, 0.2);
    return { gTop: py, ground: py + 1 };
  }
  function paintGraveyard(S) {
    const r = paintOutdoor(S, 'planicie');
    const t = objectSprite('tumulo');
    for (let i = 0; i < 6; i++) { const x = 10 + i * 34 + S.r() * 8, y = r.gTop + 8 + (i % 2) * 6; S.b.blit(t, Math.round(x - t.w / 2), Math.round(y - t.h)); }
    for (let x = 0; x < S.w; x += 6) for (let y = r.gTop + 2; y < r.gTop + 10; y++) put(S, x, y, rampFrom('#2a2a30'), 0.5, 0.2);
    for (let x = 0; x < S.w; x++) put(S, x, r.gTop + 3, rampFrom('#2a2a30'), 0.5, 0.2);
    S.over.push({ k: 'mist' });
    return r;
  }
  function paintRuin(S) {
    const r = paintOutdoor(S, ['tundra', 'costa', 'pantano'].includes(S.sp.biome) ? 'planicie' : S.sp.biome);
    for (const [cx, hh] of [[30, 40], [58, 26], [140, 46], [168, 20]]) {
      const base = r.gTop + 14;
      for (let y = base - hh; y < base; y++) for (let x = cx - 5; x <= cx + 5; x++) { const nx = (x - cx) / 5; put(S, x, y, M.stone, 0.2 + 0.6 * clamp(-nx * 0.6 + Math.sqrt(clamp(1 - nx * nx)) * 0.5) + (S.n.n2(x * 0.4, y * 0.2) - 0.5) * 0.3, 0.05); }
      for (let y = base - hh - 3; y < base - hh; y++) for (let x = cx - 7; x <= cx + 7; x++) put(S, x, y, M.stone, 0.6, 0.05);
      for (let x = cx - 7; x <= cx + 7; x++) for (let y = base - hh - 4 - Math.floor(S.n.n2(x * 0.5, 1) * 4); y < base - hh - 1; y++) put(S, x, y, M.moss, 0.5 + S.n.n2(x, y) * 0.3, 0.05);
    }
    rock(S, 100, r.gTop + 16, 9, 4, 0.05, M.stone);
    return r;
  }
  function paintBattle(S) {
    const r = paintOutdoor(S, 'planicie');
    for (const [bx, c] of [[40, '#8a2a2a'], [100, '#2a4a8a'], [160, '#8a2a2a']]) {
      const by = r.gTop + 4;
      for (let y = by - 30; y < by; y++) put(S, bx, y, M.wood, 0.4, 0.2);
      for (let y = by - 30; y < by - 18; y++) for (let x = bx + 1; x < bx + 14; x++) put(S, x, y + Math.round(Math.sin(x * 0.4)), rampFrom(c), 0.6 - (x - bx) * 0.02 + (y === by - 25 ? 0.2 : 0), 0.2);
    }
    S.over.push({ k: 'smoke' });
    return r;
  }
  function paintDream(S) {
    const { w, h } = S;
    paintSky(S, h);
    for (let i = 0; i < 5; i++) {
      const cx = 20 + i * 40 + S.r() * 10, cy = 40 + S.r() * 40, rw = 10 + S.r() * 8;
      for (let y = cy; y < cy + rw * 1.2; y++) { const ww = rw * (1 - (y - cy) / (rw * 1.2)); for (let x = cx - ww; x < cx + ww; x++) put(S, Math.round(x), Math.round(y), M.rock, 0.35 + ((cx - x) / rw) * 0.2, 0.2); }
      for (let x = cx - rw; x < cx + rw; x++) for (let y = cy - 2; y < cy + 1; y++) put(S, Math.round(x), Math.round(y), M.grass, 0.6, 0.2);
    }
    S.over.push({ k: 'motes' });
    return { gTop: h - 22 };
  }

  /* ======================= efeitos animados ======================= */
  function overlays(S, b, t) {
    const { w, h } = b;
    for (const o of S.over) {
      if (o.k === 'star') { const s = Math.sin(t * 2.2 + o.ph); if (s > 0.2) b.set(o.x, o.y, s > 0.85 ? [255, 255, 255] : [200, 210, 240]); }
      else if (o.k === 'glint') { if (Math.sin(t * 3 + o.x * 1.7 + o.y) > 0.75) b.set(o.x, o.y, [240, 248, 255]); }
      else if (o.k === 'fire' || o.k === 'candle') {
        const s = o.k === 'candle' ? 0.3 : o.s || 1, n = Math.floor(22 * s) + 4;
        for (let i = 0; i < n; i++) {
          const a = NZ.n2(i * 3.1, t * 8 + i), hgt = (5 + 10 * s) * (0.4 + a), x = Math.round(o.x + (NZ.n2(i, t * 5) - 0.5) * 8 * s);
          for (let j = 0; j < hgt; j++) { const f = j / hgt; b.set(x + Math.round(Math.sin(t * 9 + i + j * 0.5) * f * 1.5), o.y - j, shade(M.fire, 1 - f * 0.85, x, o.y - j)); }
        }
        if (o.k === 'fire') for (let i = 0; i < 3; i++) b.set(o.x + Math.round(Math.sin(t * 4 + i * 2) * 6), o.y - 12 - ((t * 20 + i * 7) % 18) * s, [255, 200, 90]);
      } else if (o.k === 'lantern') {
        for (let y = o.y; y < o.y + 5; y++) for (let x = o.x - 2; x <= o.x + 2; x++) b.set(x, y, Math.abs(x - o.x) === 2 || y === o.y ? [60, 36, 20] : Math.sin(t * 6 + o.x) > -0.7 ? [255, 220, 120] : [240, 170, 70]);
      } else if (o.k === 'snow' || o.k === 'rain') {
        const snow = o.k === 'snow';
        for (let i = 0; i < (snow ? 90 : 110); i++) {
          const sp = snow ? 10 + (i % 5) * 3 : 90 + (i % 4) * 20;
          const x = Math.floor(((i * 53.3 + (snow ? Math.sin(t + i) * 4 : -t * 30)) % w + w) % w), y = Math.floor((i * 31.7 + t * sp) % h);
          if (snow) b.set(x, y, i % 3 ? [240, 246, 255] : [200, 210, 230]); else { b.mix(x, y, [170, 190, 220], 0.7); b.mix(x - 1, y + 1, [150, 170, 200], 0.5); }
        }
      } else if (o.k === 'motes') {
        const night = S.sp.tod === 'noite';
        for (let i = 0; i < 24; i++) { const x = (i * 37.1 + Math.sin(t * 0.7 + i) * 10 + t * 3) % w, y = (i * 23.3 + Math.cos(t * 0.5 + i * 2) * 8) % (h * 0.85); if (Math.sin(t * 2 + i) > -0.2) b.mix(x, y, night ? [200, 255, 140] : [255, 240, 190], 0.8); }
      } else if (o.k === 'mist') {
        for (let y = Math.floor(h * 0.55); y < h; y++) for (let x = 0; x < w; x++) { const v = NZ.fbm(x * 0.03 + t * 0.15, y * 0.1, 3) - 0.45; if (v > 0) b.mix(x, y, S.fog, qa(v * 1.6, x, y, 4)); }
      } else if (o.k === 'smoke') {
        for (let y = 0; y < h * 0.7; y++) for (let x = 0; x < w; x++) { const v = NZ.fbm(x * 0.04, y * 0.05 + t * 0.4, 3) - 0.55 + (y / h) * 0.2; if (v > 0) b.mix(x, y, [90, 84, 88], qa(v * 1.8, x, y, 4)); }
      } else if (o.k === 'shaft') {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.abs(x - o.x - (y - o.y) * 0.45); if (d < 16 && y > o.y - 10) b.mix(x, y, [255, 240, 200], qa((1 - d / 16) * 0.22 * (0.8 + 0.2 * Math.sin(t)), x, y, 4)); }
      } else if (o.k === 'fireworks') {
        for (let i = 0; i < 2; i++) { const ph = (t * 0.6 + i * 0.5) % 1.4; if (ph < 1) { const cx = 50 + i * 90, cy = 18 + i * 6, col = [[255, 120, 90], [140, 200, 255]][i]; for (let a = 0; a < 16; a++) { const ang = (a / 16) * Math.PI * 2; b.set(cx + Math.cos(ang) * ph * 16, cy + Math.sin(ang) * ph * 12 + ph * ph * 4, ph > 0.8 ? mixc(col, [60, 40, 60], 0.5) : col); } } }
      } else if (o.k === 'drip') {
        for (let i = 0; i < 4; i++) b.set(30 + i * 41, (t * 40 + i * 30) % (h * 0.75), [150, 200, 230]);
      } else if (o.k === 'hearts') {
        for (let i = 0; i < 3; i++) { const x = Math.round(o.x + Math.sin(t * 2 + i * 2) * 6), y = Math.round(o.y - ((t * 8 + i * 9) % 24)); for (const [dx, dy] of [[-1, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [0, 3]]) b.set(x + dx, y + dy, [230, 70, 90]); }
      } else if (o.k === 'sparkle') {
        for (let i = 0; i < 8; i++) { const a = t * 1.5 + i * 0.8; if (Math.sin(t * 5 + i) > 0) b.set(o.x + Math.cos(a) * (10 + i), o.y + Math.sin(a * 1.3) * 8, [220, 240, 255]); }
      }
    }
  }

  /* ======================= borda rasgada ======================= */
  const maskCache = {};
  function tornMask(w, h, seed, sides) {
    const key = w + 'x' + h + ':' + (seed % 5) + sides;
    if (maskCache[key]) return maskCache[key];
    const n = Noise((seed % 5) + 99), m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.min(sides.includes('l') ? x : 99, sides.includes('r') ? w - 1 - x : 99, sides.includes('t') ? y : 99, sides.includes('b') ? h - 1 - y : 99);
      const thr = 1.5 + n.fbm(x * 0.12, y * 0.12, 3) * 7;
      m[y * w + x] = d < thr ? 0 : d < thr + 3 && n.n2(x * 0.9, y * 0.9) > 0.68 ? 0 : 1;
    }
    return (maskCache[key] = m);
  }

  /* ======================= cena completa ======================= */
  function buildScene(sp, s, w, h) {
    const b = new Buf(w, h), S = ctxFor(b, sp), k = sp.kind;
    let res;
    if (['taverna', 'templo', 'casa', 'biblioteca', 'caverna'].includes(k)) res = paintInterior(S, k);
    else if (k === 'cidade' || k === 'mercado' || k === 'festa') res = paintTown(S, k);
    else if (k === 'mar') res = paintSea(S);
    else if (k === 'cemiterio') res = paintGraveyard(S);
    else if (k === 'ruina') res = paintRuin(S);
    else if (k === 'batalha') res = paintBattle(S);
    else if (k === 'sonho') res = paintDream(S);
    else res = paintOutdoor(S, sp.biome);
    if (sp.weather === 'chuva') S.over.push({ k: 'rain' });
    if (sp.weather === 'neve' && !S.over.some((o) => o.k === 'snow')) S.over.push({ k: 'snow' });
    const ground = res.ground || Math.min(h - 6, Math.max(res.gTop + 16, Math.round(h * 0.86)));
    const sprites = [];
    const fx = Math.round(w * 0.68);
    if (s && !sp.noHero) sprites.push({ spr: personSprite(s.look, s.job, G.stage(s)), x: Math.round(w * 0.3), y: ground, bob: 0 });
    const f = sp.fig;
    if (f) {
      let spr2 = null, lift = 0, bob = 1;
      if (f.t === 'criatura') { spr2 = creatureSprite(f.c); if (/fogo-fátuo|espírito|afogado/.test(f.c.base)) lift = 6; }
      else if (f.t === 'pessoa') spr2 = mirror(personSprite(f.look, f.opt && f.opt.job, (f.opt && f.opt.stage) || 'adu', f.opt));
      else if (f.t === 'dragao') spr2 = creatureSprite({ base: '__dragao', adj: 'ancião', pow: 9 });
      else if (f.t === 'fantasma') { spr2 = creatureSprite({ base: 'afogado', adj: 'solitário', pow: 3 }); lift = 6; }
      else if (f.t === 'cao') spr2 = mirror(rasterize(quad({ bl: 8, bh: 4.5, leg: 7, hr: 3.4, sn: 3, ears: 'rd', tail: 'thin', main: '#a87038' }), SPR));
      else if (f.t === 'cavalo') spr2 = mirror(rasterize(quad({ bl: 13, bh: 6.5, leg: 14, lr: 1.8, hr: 3.6, sn: 5, neck: 7, ears: 'pt', tail: 'horse', mane: 'neck', main: '#2e2420' }), SPR));
      else if (f.t === 'gato') spr2 = mirror(rasterize(quad({ bl: 5.5, bh: 3.2, leg: 4.5, hr: 2.8, sn: 0.8, ears: 'pt', tail: 'up', main: '#26222c', eyes: 'y' }), SPR));
      else if (f.t === 'coracao') { spr2 = mirror(personSprite(A.newLook('par' + sp.seed, s && s.look.sexo === 'm' ? 'f' : 'm'), null, 'jov', { cloth: '#8a3a5a' })); S.over.push({ k: 'hearts', x: Math.round(w * 0.49), y: ground - 42 }); }
      else { spr2 = objectSprite(f.t, s && s.look); bob = 0; if (f.t === 'livro' || f.t === 'cristal') { lift = f.t === 'livro' ? 10 : 0; S.over.push({ k: 'sparkle', x: fx, y: ground - 18 }); } if (f.t === 'fogueira') S.over.push({ k: 'fire', x: fx, y: ground - 3, s: 0.8 }); }
      if (spr2) sprites.push({ spr: spr2, x: fx, y: ground - lift, bob, ground, file: typeof document !== 'undefined' ? figFile(sp) : null, hgt: figHeight(sp) });
    }
    for (const it of sprites) { const gw = it.spr.w * 0.38; for (let x = -gw; x < gw; x++) for (let y = -1; y <= 1; y++) b.mix(it.x + x, ground + y, [10, 8, 16], 0.32 * (1 - Math.abs(x) / gw)); }
    return { base: b, S, sprites, mask: tornMask(w, h, sp.seed, 'lrtb'), seed: sp.seed, bg: typeof document !== 'undefined' ? sceneFile(sp) : null };
  }

  function frame(c, t, cv) {
    const b = new Buf(c.base.w, c.base.h);
    b.d.set(c.base.d);
    for (const it of c.sprites) b.blit(it.spr, it.x - Math.round(it.spr.w / 2), it.y - it.spr.h + 1 + (it.bob && Math.floor(t * 1.6) % 2 ? 1 : 0));
    overlays(c.S, b, t);
    if (c.mask) for (let i = 0; i < b.d.length; i++) if (!c.mask[i]) b.d[i] = 0;
    return b.toCanvas(cv);
  }

  /* ======================= imagens prontas (opcional) =======================
   * Se existir uma imagem em img/ (listada em img/manifest.js) ela substitui a arte gerada.
   * Onde não houver imagem, continua valendo a arte gerada por código.
   */
  const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  A.slug = slug;
  const fileName = (f) => (typeof f === 'string' ? f : f.n);
  const srcOf = (dir, f) => (typeof f === 'string' ? 'img/' + dir + '/' + f : f.src);
  function pickFile(dir, names, seed) {
    const list = (G.IMG && G.IMG[dir]) || [];
    if (!list.length) return null;
    for (const n of names) {
      if (!n) continue;
      const re = new RegExp('^' + n + '(-\\d+)?\\.(png|webp|jpe?g|gif)$', 'i');
      const m = list.filter((f) => re.test(fileName(f)));
      if (m.length) return srcOf(dir, m[(seed >>> 0) % m.length]);
    }
    return null;
  }
  A.pickFile = pickFile;
  const sceneName = (sp) => (sp.kind === 'outdoor' ? sp.biome : sp.kind);
  function sceneFile(sp) { const base = sceneName(sp); return pickFile('cenas', [base + '-' + sp.tod, base], sp.seed || 0); }
  function figFile(sp) {
    const f = sp.fig; if (!f) return null;
    const seed = sp.seed || 0;
    if (f.t === 'criatura') { const b = slug(f.c.base === '__dragao' ? 'dragao' : f.c.base); return pickFile('criaturas', [b + '-' + slug(f.c.adj || ''), b], seed); }
    if (f.t === 'dragao') return pickFile('criaturas', ['dragao'], seed);
    if (f.t === 'fantasma') return pickFile('criaturas', ['fantasma', 'afogado'], seed);
    if (['cao', 'cavalo', 'gato'].includes(f.t)) return pickFile('criaturas', [f.t], seed);
    if (f.t === 'pessoa') { const o = f.opt || {}; return pickFile('pessoas', [o.stage === 'inf' ? 'crianca' : o.job === 'mercador' ? 'mercador' : o.pack ? 'viajante' : null, 'pessoa'], seed); }
    if (f.t === 'coracao') return pickFile('pessoas', ['par', 'pessoa'], seed);
    return pickFile('objetos', [f.t], seed);
  }
  // altura (em pixels da cena de 192×120) com que cada imagem é desenhada
  function figHeight(sp) {
    const f = sp.fig;
    if (f.t === 'criatura') return /drag/.test(f.c.base) ? 82 : clamp(30 + (f.c.pow || 3) * 5, 30, 80);
    return { dragao: 82, fantasma: 46, cao: 26, cavalo: 50, gato: 18, pessoa: f.opt && f.opt.stage === 'inf' ? 38 : 50, coracao: 50, tumulo: 30, quadro: 36, fogueira: 16, moedas: 12, berco: 22, bau: 22, cristal: 30, caldeirao: 24, livro: 18 }[f.t] || 30;
  }

  const imgCache = {};
  function loadImg(src) {
    let e = imgCache[src];
    if (!e) {
      e = imgCache[src] = { img: new Image(), ok: false, bad: false };
      e.img.onload = () => { e.ok = true; };
      e.img.onerror = () => { e.bad = true; };
      e.img.src = src;
    }
    return e;
  }
  const maskCv = {};
  function tornMaskCanvas(seed) {
    const key = seed % 5;
    if (maskCv[key]) return maskCv[key];
    const m = tornMask(W, H, seed, 'lrtb'), b = new Buf(W, H);
    for (let i = 0; i < m.length; i++) if (!m[i]) b.d[i] = 0xff000000;
    return (maskCv[key] = b.toCanvas(document.createElement('canvas')));
  }
  const SAFE_OVER = ['rain', 'snow', 'motes', 'sparkle', 'hearts'];
  function frameImg(c, t, cv) {
    let bgE = c.bg ? loadImg(c.bg) : null;
    if (bgE && bgE.bad) { c.bg = null; bgE = null; }
    if (bgE && !bgE.ok) return frame(c, t, cv);
    const outW = bgE ? Math.max(W, Math.min(bgE.img.naturalWidth, 960)) : W * 2, outH = Math.round((outW * H) / W), k = outW / W;
    if (cv.width !== outW || cv.height !== outH) { cv.width = outW; cv.height = outH; }
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, outW, outH);
    const tmp = c._tmp || (c._tmp = document.createElement('canvas'));
    if (bgE) {
      cx.drawImage(bgE.img, 0, 0, outW, outH);
      for (const it of c.sprites) { cx.fillStyle = 'rgba(10,8,16,.28)'; cx.beginPath(); cx.ellipse(it.x * k, (it.ground || it.y) * k, (it.hgt || it.spr.h) * 0.45 * k, 2 * k, 0, 0, Math.PI * 2); cx.fill(); }
    } else {
      const b = new Buf(W, H); b.d.set(c.base.d); overlays(c.S, b, t); b.toCanvas(tmp);
      cx.drawImage(tmp, 0, 0, outW, outH);
    }
    const bobOn = Math.floor(t * 1.6) % 2;
    for (const it of c.sprites) {
      const e = it.file ? loadImg(it.file) : null;
      const bob = it.bob && bobOn ? k : 0;
      if (e && e.ok) {
        const ih = it.hgt * k, iw = (ih * e.img.naturalWidth) / e.img.naturalHeight;
        cx.drawImage(e.img, Math.round(it.x * k - iw / 2), Math.round(it.y * k - ih + bob), Math.round(iw), Math.round(ih));
      } else {
        if (!it._cv) { const b = new Buf(it.spr.w, it.spr.h); b.d.set(it.spr.d); it._cv = b.toCanvas(document.createElement('canvas')); }
        cx.drawImage(it._cv, Math.round((it.x - Math.round(it.spr.w / 2)) * k), Math.round((it.y - it.spr.h + 1) * k + bob), it.spr.w * k, it.spr.h * k);
      }
    }
    if (bgE) {
      const b = new Buf(W, H);
      overlays(Object.assign({}, c.S, { over: c.S.over.filter((o) => SAFE_OVER.includes(o.k)) }), b, t);
      b.toCanvas(tmp); cx.drawImage(tmp, 0, 0, outW, outH);
    }
    cx.globalCompositeOperation = 'destination-out';
    cx.drawImage(tornMaskCanvas(c.seed || 0), 0, 0, outW, outH);
    cx.globalCompositeOperation = 'source-over';
    return cv;
  }
  function usesImages(c) { return !!(c.bg || c.sprites.some((it) => it.file)); }

  A.render = function (cv, sp, t, s) {
    if (!sp._c) Object.defineProperty(sp, '_c', { value: buildScene(sp, s, W, H), enumerable: false, writable: true });
    return usesImages(sp._c) ? frameImg(sp._c, t, cv) : frame(sp._c, t, cv);
  };

  /* ======================= escolha da cena para cada evento ======================= */
  const RULES = [
    [/drag[aã]o/, 'outdoor', { t: 'dragao' }, 'tarde'],
    [/taverna|estalagem|dados|bebida|caneca|aposta_dados/, 'taverna'],
    [/cemit[eé]rio|morte_velhice|viuvez/, 'cemiterio', { t: 'tumulo' }, 'noite'],
    [/fantasma|assombrad|esp[ií]rito/, 'casa', { t: 'fantasma' }, 'noite'],
    [/templo|sacerdote|coro|santu[aá]rio|milagre|exorcismo|heresia|peregrino/, 'templo'],
    [/biblioteca|livro|mago_|feiti[cç]|arcan|grim[oó]rio|aprender_ler/, 'biblioteca', { t: 'livro' }],
    [/caverna|masmorra|eco|mina/, 'caverna', { t: 'bau' }],
    [/barco|balsa|garrafa|naufr|mar[ ,.]|tesouro_rio|travessia|rio_proibido/, 'mar'],
    [/batalha|guerra|cerco|torneio|duelo|recrut|soldado|desert/, 'batalha'],
    [/festa|baile|festival|circo|anivers/, 'festa'],
    [/mercad|caravana|feira|imposto|padaria|doces|mascate|artefato|alaúde|luthier|espelho/, 'mercado'],
    [/fazenda|colheita|arado|galinha/, 'outdoor', { t: 'fogueira' }],
    [/nasc|beb[eê]|irmao_nasce|filho_nasce|neto|berço/, 'casa', { t: 'berco' }],
    [/casamento|amor|beijo|romance|paix/, 'outdoor', { t: 'coracao' }, 'tarde'],
    [/\bc[aã]o\b|cachorro|vira-lata/, 'outdoor', { t: 'cao' }],
    [/\bgato\b/, 'casa', { t: 'gato' }],
    [/cavalo/, 'outdoor', { t: 'cavalo' }],
    [/tesouro|heran[cç]a|mapa|ba[uú]/, 'outdoor', { t: 'bau' }],
    [/bruxa|feiticeira|maldi[cç]/, 'outdoor', { t: 'caldeirao' }, 'noite'],
    [/sonho|vidente|profecia|estrela/, 'sonho', { t: 'cristal' }, 'sonho'],
    [/doen[cç]a|febre|peste|sa[uú]de|testamento|mem[oó]rias|\bcasa\b|fam[ií]lia|primeiros_passos|primeira_palavra|crise/, 'casa'],
    [/rei|corte|conselho|convite/, 'cidade'],
    [/tempestade|chuva|terremoto|eclipse|incendio/, 'outdoor', null, 'tempestade', 'chuva'],
  ];

  A.specFor = function (s, inst) {
    const reg = s.world.regions[s.reg];
    const key = inst.key || inst.id;
    const r = rng(hash(key + ':' + s.turn));
    const sp = { kind: 'outdoor', biome: reg.biome, tod: r() < 0.5 ? 'dia' : r() < 0.45 ? 'tarde' : r() < 0.5 ? 'neblina' : 'noite', fig: null, weather: null, seed: hash(key + s.name + s.turn) };
    const pref = String(key).split(':')[0];
    const quem = () => A.newLook(key + 'npc', r() < 0.5 ? 'm' : 'f');
    if (pref === 'cri') sp.fig = { t: 'criatura', c: (inst.e && inst.e.art && inst.e.art.c) || { base: 'lobo', adj: 'faminto', tipo: 'fera', pow: 3 } };
    else if (pref === 'viaj') sp.fig = { t: 'pessoa', look: quem(), opt: { cloak: '#5a4a3a', cloth: '#6a5a4a', pack: true } };
    else if (pref === 'masc') { sp.kind = r() < 0.5 ? 'outdoor' : 'mercado'; sp.fig = { t: 'pessoa', look: quem(), opt: { job: 'mercador' } }; }
    else if (pref === 'lug') { sp.kind = /caverna|mina|cripta|poço/.test(inst.text) ? 'caverna' : 'ruina'; sp.fig = { t: r() < 0.5 ? 'bau' : 'cristal' }; }
    else if (pref === 'mis') { sp.kind = 'cidade'; sp.fig = { t: 'quadro' }; }
    else if (pref === 'fes') { sp.kind = 'festa'; sp.tod = r() < 0.5 ? 'noite' : 'tarde'; }
    else if (pref === 'son') { sp.kind = 'sonho'; sp.tod = 'sonho'; sp.fig = { t: 'cristal' }; }
    else if (pref === 'brin') { sp.fig = { t: 'pessoa', look: quem(), opt: { stage: 'inf' } }; sp.tod = 'dia'; }
    else if (pref === 'cli') {
      sp.tod = /seca/.test(inst.text) ? 'dia' : 'tempestade';
      sp.weather = /inverno|neve/.test(inst.text) || reg.biome === 'tundra' ? 'neve' : /seca|primavera/.test(inst.text) ? null : 'chuva';
      if (/nevoeiro/.test(inst.text)) { sp.tod = 'neblina'; sp.weather = null; }
    } else {
      const hay = (inst.id + ' ' + inst.text).toLowerCase();
      for (const [re, kind, fig, tod, weather] of RULES) if (re.test(hay)) { sp.kind = kind; if (fig) sp.fig = fig; if (tod) sp.tod = tod; if (weather) sp.weather = weather; break; }
      if (/noite|lua|madrugada/.test(hay) && sp.kind === 'outdoor') sp.tod = 'noite';
      if (!sp.fig && /\{npc\}|um estranho|uma mulher|um velho|mendigo|escriba|nobre|mentor|recrutador|valent|rival|amigo/.test(inst.e && typeof inst.e.text === 'string' ? inst.e.text : hay)) sp.fig = { t: 'pessoa', look: quem(), opt: {} };
    }
    if (sp.kind === 'mar' && sp.tod === 'neblina') sp.tod = 'dia';
    if (reg.biome === 'tundra' && !sp.weather && sp.kind === 'outdoor' && r() < 0.5) sp.weather = 'neve';
    return sp;
  };

  /* ======================= título e túmulo ======================= */
  const titleCache = {};
  A.renderTitle = function (cv, t, seed) {
    const capa = typeof document !== 'undefined' && pickFile('cenas', ['titulo'], seed);
    if (capa) {
      const e = loadImg(capa);
      if (e.ok) { const w = Math.min(e.img.naturalWidth, 720), h = Math.round((w * e.img.naturalHeight) / e.img.naturalWidth); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(e.img, 0, 0, w, h); return cv; }
    }
    const key = 'T' + seed;
    if (!titleCache[key]) {
      const w = 120, h = 168, b = new Buf(w, h);
      const S = ctxFor(b, { kind: 'outdoor', tod: 'tarde', seed: seed * 31 + 5 });
      paintSky(S, 96);
      paintMountains(S, 92, 50, 0.7, true);
      const cx = 78, cyb = 70;
      for (const [x0, ww, hh] of [[cx - 10, 20, 14], [cx - 13, 5, 22], [cx + 8, 5, 22], [cx - 2, 5, 28]]) for (let y = cyb - hh; y < cyb; y++) for (let x = x0; x < x0 + ww; x++) put(S, x, y, M.stone, 0.4 + (x === x0 ? 0.2 : 0), 0.6);
      for (const tx of [cx - 11, cx + 10, cx]) for (let j = 0; j < 6; j++) for (let x = tx - (5 - j) / 2; x <= tx + (5 - j) / 2; x++) put(S, Math.round(x), cyb - (tx === cx ? 28 : 22) - j, M.roof, 0.5, 0.6);
      paintHills(S, 104, 10, M.leaf, 0.45, 0.04);
      for (let i = 0; i < 14; i++) treeRound(S, S.r() * w, 100 + S.r() * 10, 4 + S.r() * 4, 0.35);
      for (let y = 96; y < 116; y++) for (let x = 0; x < w; x++) { const v = S.n.fbm(x * 0.05, y * 0.2, 3); if (v > 0.45) b.mix(x, y, S.fog, qa((v - 0.45) * 2.2, x, y, 4)); }
      paintGround(S, 118, M.moss, { tufts: true, path: true, stones: true });
      rock(S, 22, h - 10, 34, 22, 0); rock(S, w - 4, h - 4, 20, 16, 0);
      const hero = personSprite(A.newLook('titulo' + seed, seed % 2 ? 'm' : 'f'), 'aventureiro', 'jov');
      S.over.push({ k: 'motes' });
      titleCache[key] = { base: b, S, sprites: [{ spr: hero, x: 30, y: h - 24, bob: 0 }], mask: tornMask(w, h, 3, 'b') };
    }
    return frame(titleCache[key], t, cv);
  };

  A.renderGrave = function (cv, s, t) {
    if (!s._grave) Object.defineProperty(s, '_grave', { value: buildScene({ kind: 'cemiterio', tod: 'noite', seed: hash(s.name + 'grave'), noHero: true, fig: { t: 'tumulo' } }, null, W, H), enumerable: false, writable: true });
    return usesImages(s._grave) ? frameImg(s._grave, t, cv) : frame(s._grave, t, cv);
  };

  /* ======================= retrato ======================= */
  A.portrait = function (look, job, stage) {
    const size = 48, b = new Buf(size, size);
    const bg = rampFrom(look.bg || '#3a4466');
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const d = Math.hypot(x - 18, y - 16) / 40; b.set(x, y, shade(bg, 0.75 - d * 0.7 + (NZ.n2(x * 0.3, y * 0.3) - 0.5) * 0.15, x, y)); }
    const kid = stage === 'inf', vel = stage === 'vel';
    const skin = rampFrom(look.skin, 8, '#3a1a2a', '#fff4e4', 0.45), hair = rampFrom(vel ? '#cfcfd6' : look.hair, 7, '#120a10', '#fff0c8', 0.55);
    const cloth = rampFrom(JOBCOL[job] || JOBCOL.null), cloak = rampFrom(CLOAK[job] || CLOAK.null);
    const fy = kid ? 24 : 22, frx = kid ? 9.5 : 8.6, fry = kid ? 10 : 11;
    const hooded = (job === 'ladrao' || job === 'sacerdote') && !kid, hood = rampFrom(job === 'ladrao' ? '#26262e' : '#cfc6a8');
    const s = [];
    if (look.style === 1 && !hooded) s.push(E(24, 26, 12, 15, hair, { tex: 0.4, ts: 0.9 }));
    s.push(E(24, 47, 21, 11, cloak, { tex: 0.2 }), E(24, 45, 11, 8, cloth, { tex: 0.15 }));
    if (hooded) s.push(E(24, fy, 14, 15, hood, { tex: 0.2 }));
    s.push(C(24, fy + 8, 24, fy + 12, 3.8, 4.2, skin, { dv: -0.15 }));
    s.push(E(15.5, fy + 1, 1.8, 2.8, skin, { dv: -0.05 }), E(32.5, fy + 1, 1.8, 2.8, skin, { dv: -0.12 }));
    s.push(E(24, fy, frx, fry, skin, { g: 'face' }));
    const ey = fy - 0.5;
    for (const ex of [20.2, 27.8]) s.push(E(ex, ey, kid ? 2 : 1.7, kid ? 1.6 : 1.15, M.white, { amb: 0.7, noLine: true, g: 'face' }), E(ex + 0.3, ey + 0.2, kid ? 1.4 : 1.15, kid ? 1.5 : 1.2, rampFrom(look.eye || '#2a1a14', 5, '#000000', '#ffffff', 0.3), { amb: 0.35, noLine: true, g: 'face' }));
    s.push(C(17.5, ey - 3.2, 22, ey - 3.6, 0.8, 0.7, hair, { noLine: true }), C(26, ey - 3.6, 30.5, ey - 3.2, 0.8, 0.7, hair, { noLine: true }));
    s.push(C(24.5, ey + 1, 25.5, ey + 5, 0.9, 1.3, skin, { g: 'face', noLine: true, dv: 0.05 }));
    s.push(C(21.5, fy + 7.6, 26.5, fy + 7.6, 0.8, 0.8, rampFrom('#a04a4a'), { noLine: true, g: 'face' }));
    if (vel) s.push(C(17, fy + 4, 18.5, fy + 7, 0.4, 0.4, skin, { dv: -0.35, noLine: true }), C(31, fy + 4, 29.5, fy + 7, 0.4, 0.4, skin, { dv: -0.35, noLine: true }), C(20, fy - 6.5, 28, fy - 6.5, 0.35, 0.35, skin, { dv: -0.3, noLine: true }));
    if (look.beard && !kid && stage !== 'jov') s.push(E(24, fy + 7.5, 7.5, 5.5, hair, { tex: 0.45, ts: 1.4 }), C(21.5, fy + 6.6, 26.5, fy + 6.6, 0.7, 0.7, rampFrom('#6a2a2a'), { noLine: true }));
    if (!hooded) {
      if (look.style === 2) s.push(E(24, fy - 8.5, 9.6, 5, hair, { tex: 0.35, ts: 1.6 }));
      else s.push(E(24, fy - 8, 10.4, 6.5, hair, { tex: 0.4, ts: 1.5 }), E(16, fy - 3, 3, 6, hair, { tex: 0.35, ts: 1.5 }), E(32, fy - 3, 3, 6, hair, { tex: 0.35, ts: 1.5 }));
      if (look.style === 3) s.push(E(34, fy - 2, 4, 4, hair, { tex: 0.35 }));
    } else s.push(E(24, fy - 9, 12, 6, hood, { tex: 0.2 }));
    if (!kid) {
      if (job === 'mago') { const hr = rampFrom('#3a2a8a'); s.push(E(24, fy - 10, 15, 3, hr), P([[13, fy - 11], [35, fy - 11], [30, fy - 24], [22, fy - 30]], hr, { nx: -0.3, ny: -0.4, tex: 0.15 })); }
      if (job === 'soldado') s.push(E(24, fy - 8, 11.5, 8, M.steel, { amb: 0.3 }), C(24, fy - 6, 24, fy + 2, 1, 1, M.steel));
      if (job === 'fazendeiro') s.push(E(24, fy - 10, 17, 3, M.straw, { tex: 0.3 }), E(24, fy - 13, 9, 5, M.straw, { tex: 0.3 }));
      if (job === 'bardo') s.push(E(23, fy - 11, 11, 4.5, rampFrom('#2a6a3a')), C(31, fy - 13, 40, fy - 22, 1.2, 0.4, M.white));
      if (job === 'aventureiro') s.push(C(14.5, fy - 6, 33.5, fy - 6, 1.3, 1.3, M.red));
      if (job === 'sacerdote') s.push(C(18, fy - 9.5, 30, fy - 9.5, 0.8, 0.8, M.gold));
    }
    const p = rasterize(s, 1);
    b.blit(p, -p.ox, -p.oy);
    for (let i = 0; i < size; i++) { b.set(i, 0, [26, 15, 20]); b.set(i, size - 1, [26, 15, 20]); b.set(0, i, [26, 15, 20]); b.set(size - 1, i, [26, 15, 20]); }
    return b;
  };
  A.portraitCanvas = (cv, s) => A.portrait(s.look, s.job, G.stage(s)).toCanvas(cv);

  /* ======================= textura de papel ======================= */
  let paperURL = null;
  A.paper = function () {
    if (paperURL || typeof document === 'undefined') return paperURL || '';
    const n = 64, b = new Buf(n, n), base = ramp(['#b8a888', '#c6b694', '#d0c09e', '#d8caa8', '#e0d3b2']), nz = Noise(42);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) b.set(x, y, shade(base, 0.55 + (nz.fbm(x * 0.15, y * 0.15, 3) - 0.5) * 0.6 + (nz.n2(x * 1.3, y * 1.3) - 0.5) * 0.2, x, y));
    return (paperURL = b.toCanvas(document.createElement('canvas')).toDataURL());
  };
})();
