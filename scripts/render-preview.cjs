const { readFileSync, writeFileSync } = require('node:fs');
const { Resvg } = require('@resvg/resvg-js');

const source = process.argv[2] ?? 'examples/flowchart.svg';
const target = process.argv[3] ?? 'doc/flowchart-preview.png';
const renderer = new Resvg(readFileSync(source, 'utf8'), {
  background: 'white', font: { loadSystemFonts: true, defaultFontFamily: 'Microsoft YaHei' },
});
writeFileSync(target, renderer.render().asPng());
console.log(`Rendered ${source} -> ${target}`);
