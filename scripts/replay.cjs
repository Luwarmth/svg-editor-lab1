const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/src/main.js')], {
  input: readFileSync(process.argv[2], 'utf8'), encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'],
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
