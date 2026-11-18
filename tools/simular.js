#!/usr/bin/env node
/* Simula muitas vidas com escolhas aleatórias para:
 *  - detectar erros no conteúdo (placeholders não preenchidos, exceções)
 *  - medir o quanto as vidas se repetem entre si
 * Uso: node tools/simular.js [numero_de_vidas] [semente]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]).filter((f) => !f.endsWith('ui.js'));
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of scripts) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const G = ctx.G;

const N = +process.argv[2] || 300;
G.seed(+process.argv[3] || 12345);

const problems = new Map();
const note = (k, v) => { if (!problems.has(k)) problems.set(k, v); };
const runs = [];
let turns = 0;
const ages = [];
const causes = {};

for (let i = 0; i < N; i++) {
  const s = G.newLife();
  const keys = new Set();
  let guard = 0;
  while (s.alive && guard++ < 400) {
    let inst;
    try { inst = G.next(s); } catch (e) { note('next:' + e.message, e.stack); break; }
    if (!inst) break;
    if (/\{\w+\}/.test(inst.text)) note('placeholder:' + inst.id, inst.text);
    const cs = G.choices(s, inst);
    if (!cs.length) { note('sem escolhas:' + inst.id, ''); break; }
    for (const c of cs) if (/\{\w+\}/.test(G.fill(c.t, s, inst.ctx))) note('placeholder-escolha:' + inst.id, c.t);
    keys.add(inst.key);
    let r;
    try { r = G.choose(s, inst, G.R.idx(cs)); } catch (e) { note('choose:' + inst.id + ':' + e.message, e.stack); break; }
    if (/\{\w+\}/.test(r.text)) note('placeholder-resultado:' + inst.id, r.text);
    turns++;
  }
  if (guard >= 400) note('loop infinito', s.name);
  ages.push(s.age);
  const c = (s.cause || '?').replace(/ .*$/, '');
  causes[c] = (causes[c] || 0) + 1;
  runs.push(keys);
}

// sobreposição média entre pares de vidas (índice de Jaccard)
let jac = 0, pairs = 0;
for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < Math.min(runs.length, i + 30); j++) {
  const a = runs[i], b = runs[j];
  let inter = 0;
  for (const k of a) if (b.has(k)) inter++;
  jac += inter / (a.size + b.size - inter);
  pairs++;
}
const allKeys = new Set();
runs.forEach((r) => r.forEach((k) => allKeys.add(k)));
const hand = G.list.length;
const handSeen = G.list.filter((e) => G.meta.seen[e.id]).length;
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);

console.log('Vidas simuladas:            ', N);
console.log('Eventos por vida (média):   ', (turns / N).toFixed(1));
console.log('Idade ao morrer (média):    ', avg(ages), ' min', Math.min(...ages), ' max', Math.max(...ages));
console.log('Eventos escritos à mão:     ', hand, '(vistos ao menos uma vez:', handSeen + ')');
console.log('Situações distintas vistas: ', allKeys.size);
console.log('Repetição média entre 2 vidas (Jaccard):', (100 * jac / pairs).toFixed(1) + '%');
console.log('Causas de morte mais comuns:', Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x[0] + ' ' + x[1]).join(', '));
if (problems.size) {
  console.log('\nPROBLEMAS (' + problems.size + '):');
  for (const [k, v] of problems) console.log(' -', k, '\n   ', String(v).split('\n').slice(0, 3).join('\n    '));
  process.exitCode = 1;
} else console.log('\nNenhum problema encontrado.');
