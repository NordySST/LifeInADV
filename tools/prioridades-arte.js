#!/usr/bin/env node
/* Simula muitas vidas e conta quais cenas, criaturas, objetos e pessoas aparecem mais.
 * Serve para decidir o que desenhar primeiro. Uso: node tools/prioridades-arte.js [vidas]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]).filter((f) => !/ui\.js|audio\.js/.test(f));
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of scripts) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const G = ctx.G, A = G.art;
G.seed(2024);
const N = +process.argv[2] || 400;
const cnt = { cenas: {}, criaturas: {}, objetos: {}, pessoas: {} };
const add = (k, n) => (cnt[k][n] = (cnt[k][n] || 0) + 1);
let total = 0;
for (let i = 0; i < N; i++) {
  const s = G.newLife();
  let g = 0;
  while (s.alive && g++ < 400) {
    const inst = G.next(s);
    const sp = A.specFor(s, inst);
    total++;
    add('cenas', sp.kind === 'outdoor' ? sp.biome : sp.kind);
    const f = sp.fig;
    if (f) {
      if (f.t === 'criatura') add('criaturas', A.slug(f.c.base));
      else if (['dragao', 'fantasma', 'cao', 'cavalo', 'gato'].includes(f.t)) add('criaturas', f.t);
      else if (f.t === 'pessoa') add('pessoas', f.opt && f.opt.stage === 'inf' ? 'crianca' : f.opt && f.opt.job === 'mercador' ? 'mercador' : f.opt && f.opt.pack ? 'viajante' : 'pessoa');
      else if (f.t === 'coracao') add('pessoas', 'par');
      else add('objetos', f.t);
    }
    const cs = G.choices(s, inst);
    G.choose(s, inst, G.R.idx(cs));
  }
}
const pct = (n) => ((100 * n) / total).toFixed(1) + '%';
let md = '';
for (const k of ['cenas', 'criaturas', 'pessoas', 'objetos']) {
  md += '\n### ' + k + '\n\n| arquivo | aparece em |\n|---|---|\n';
  for (const [n, c] of Object.entries(cnt[k]).sort((a, b) => b[1] - a[1])) md += '| `' + k + '/' + n + '.png` | ' + pct(c) + ' dos eventos |\n';
}
console.log('Baseado em ' + N + ' vidas simuladas (' + total + ' eventos).\n' + md);
