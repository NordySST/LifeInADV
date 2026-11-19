#!/usr/bin/env node
/* Gera um único arquivo HTML com todo o jogo (fontes e imagens embutidas).
 * Útil para hospedar ou compartilhar o jogo como uma página só.
 * Uso: node tools/build-web-unico.js [saida.html]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const outFile = process.argv[2] || path.join(root, 'www-unico.html');
const tmpManifest = path.join(require('os').tmpdir(), 'milvidas-manifest-embutido.js');
execFileSync(process.execPath, [path.join(__dirname, 'gerar-manifesto.js'), '--embutir', tmpManifest], { stdio: 'inherit' });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
css = css.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (m, f) => 'url(data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'fonts', f)).toString('base64') + ')');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => '<script>\n' + fs.readFileSync(s === 'img/manifest.js' ? tmpManifest : path.join(root, s), 'utf8') + '\n</script>').join('\n');
fs.writeFileSync(outFile, '<title>Mil Vidas</title>\n<meta name="theme-color" content="#c6b591">\n<style>\n' + css + '\n</style>\n<div id="app"></div>\n' + js + '\n');
console.log('Arquivo único gerado em ' + outFile);
