#!/usr/bin/env node
/* Copia os arquivos do jogo para www/, a pasta que o Capacitor empacota no app. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
for (const item of ['index.html', 'manifest.webmanifest', 'icon.svg', 'sw.js', 'css', 'js', 'fonts', 'img']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('Jogo copiado para www/');
