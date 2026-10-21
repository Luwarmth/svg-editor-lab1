import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { SvgCodec } from '../src/io/SvgCodec';

test('actual CLI replays the teacher transcript, reports expected errors and keeps running', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-session-'));
  try {
    mkdirSync(join(directory, 'examples'));
    writeFileSync(join(directory, 'examples', 'other.svg'), readFileSync('examples/other.svg'));
    const result = spawnSync(process.execPath, [resolve('dist/src/main.js')], {
      cwd: directory, input: readFileSync('examples/session.commands', 'utf8'), encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/);
    assert.match(result.stdout, /error: cannot group a container into its own descendant: markers/);
    assert.match(result.stdout, /error: undo not allowed after io command/);
    assert.equal(result.stdout.split('\n').filter(line => line.startsWith('error:')).length, 2);
    assert.match(result.stdout, /warning: assigned id rect1 to unnamed <rect>/);
    assert.match(result.stdout, /read examples\/other.svg \(7 elements\)/);
    const saved = new SvgCodec().decode(readFileSync(join(directory, 'examples', 'demo.svg'), 'utf8')).document;
    assert.equal(saved.all().length, 5); assert.equal(saved.require('c1').attributes().get('cx'), '130');
    assert.equal(saved.require('title').content, 'My Diagram');
    assert.equal(saved.parentLabel('box'), 'g#markers');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('actual CLI builds and saves the complete Chinese two-node flowchart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-flow-'));
  try {
    mkdirSync(join(directory, 'examples'));
    const result = spawnSync(process.execPath, [resolve('dist/src/main.js')], {
      cwd: directory, input: readFileSync('examples/flowchart.commands', 'utf8'), encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr); assert.doesNotMatch(result.stdout, /error:/);
    const saved = new SvgCodec().decode(readFileSync(join(directory, 'examples', 'flowchart.svg'), 'utf8')).document;
    assert.equal(saved.all().length, 8); assert.equal(saved.parentLabel('process-label'), 'g#node2');
    assert.equal(saved.require('process').attributes().get('y'), '100');
    assert.equal(saved.require('process-label').content, '处理数据 v2');
    assert.equal(saved.require('arrow1').attributes().get('stroke'), 'black');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
