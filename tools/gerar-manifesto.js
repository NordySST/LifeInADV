#!/usr/bin/env node
/* Lista as imagens de img/ em img/manifest.js para o jogo saber quais existem.
 * Uso: node tools/gerar-manifesto.js            (gera img/manifest.js)
 *      node tools/gerar-manifesto.js --embutir X (gera X com as imagens embutidas, para a versão de arquivo único)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'img');
const DIRS = ['cenas', 'criaturas', 'objetos', 'pessoas'];
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };
const embed = process.argv[2] === '--embutir';
const out = {};
let total = 0;
for (const d of DIRS) {
  const dir = path.join(root, d);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()]).sort() : [];
  out[d] = files.map((f) => (embed ? { n: f, src: 'data:' + MIME[path.extname(f).toLowerCase()] + ';base64,' + fs.readFileSync(path.join(dir, f)).toString('base64') } : f));
  total += files.length;
}
const js = '/* Gerado por tools/gerar-manifesto.js — não edite à mão. */\nglobalThis.G.IMG = ' + JSON.stringify(out, null, embed ? 0 : 1) + ';\n';
const dest = embed ? process.argv[3] : path.join(root, 'manifest.js');
fs.writeFileSync(dest, js);
console.log(total + ' imagem(ns) listada(s) em ' + path.relative(process.cwd(), dest));
