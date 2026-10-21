import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TestSession } from './TestSession';

test('help works before init; other document operations require a document', () => {
  const s = new TestSession(); assert.match(s.ok('help'), /create ellipse/);
  for (const command of ['tree', 'show x', 'save a.svg', 'create g x', 'undo', 'redo', 'canvas']) {
    assert.equal(s.run(command), "error: no document. use 'init' or 'read' first");
  }
  assert.equal(s.ok('init'), 'canvas 800x600 created');
  assert.equal(s.run('undo'), 'error: undo not allowed after io command');
});

test('tokenization preserves quotes, escapes, Chinese, empty content and hex colors', () => {
  const s = new TestSession(); s.ok('init');
  assert.equal(s.ok('  # comment'), ''); assert.equal(s.ok(' '), '');
  s.ok('create rect bg 0 0 100 100 #ffffff');
  s.ok('create text t 1 2 "开始 \\"A\\" \\\\ path"');
  assert.equal(s.context.document.require('t').content, '开始 "A" \\ path');
  s.ok('set t text ""'); assert.equal(s.context.document.require('t').content, '');
  assert.equal(s.run('set t text "unfinished'), 'error: unterminated double quote');
  assert.equal(s.context.document.require('bg').attributes().get('fill'), '#ffffff');
});

test('all six create forms support in, defaults and case-sensitive ids', () => {
  const s = new TestSession(); s.ok('init 400 200'); s.ok('create g scene');
  for (const command of [
    'create g inner in scene', 'create rect r 1 2 3 4 in inner',
    'create circle c 5 6 7 red in scene', 'create ellipse e 8 9 10 11 in scene',
    'create line l 12 13 14 15 black in scene', 'create text t 16 17 "hello world" in scene',
    'create rect R 0 0 1 1',
  ]) s.ok(command);
  assert.equal(s.context.document.parentLabel('r'), 'g#inner');
  assert.equal(s.context.document.require('r').attributes().has('fill'), false);
  assert.equal(s.context.document.require('l').attributes().get('stroke'), 'black');
  assert.match(s.ok('tree inner'), /^g#inner\n└── rect#r.*x=1.*height=4/);
  assert.match(s.ok('show c'), /parent=g#scene/);
  assert.equal(s.context.document.all().length, 8);
});

test('geometric edits, styles, text edits and container styles undo and redo', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g g');
  s.ok('create circle c 10 20 3 in g'); s.ok('create text t 4 5 "old" in g');
  for (const command of ['move g 2.5 -1', 'scale g 2', 'set c r 9', 'set c stroke-width 2', 'set g fill red', 'set t text "new"']) {
    const before = s.state(); s.ok(command); const after = s.state();
    assert.notEqual(before, after); s.ok('undo'); assert.equal(s.state(), before);
    s.ok('redo'); assert.equal(s.state(), after);
  }
  assert.equal(s.context.document.require('c').attributes().get('cx'), '25');
  assert.equal(s.context.document.require('c').attributes().get('cy'), '38');
  assert.equal(s.context.document.require('t').content, 'new');
});

test('delete subtree is one undo unit and restores all properties and position', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g a'); s.ok('create g b');
  s.ok('create g inner in a'); s.ok('create rect r 1 2 3 4 red in inner');
  s.ok('set a stroke black'); const before = s.state(); s.ok('delete a');
  assert.deepEqual(s.context.document.children.map(shape => shape.id), ['b']);
  s.ok('undo'); assert.equal(s.state(), before); s.ok('redo');
  assert.equal(s.context.document.find('r'), undefined);
});

test('group from different parents uses document order and restores both parents', () => {
  const s = new TestSession(); s.ok('init');
  for (const command of ['create g left', 'create g right', 'create g a in left', 'create g b in left', 'create g c in right']) s.ok(command);
  const before = s.state(); s.ok('group cluster c a');
  assert.equal(s.context.document.parentLabel('cluster'), 'g#left');
  assert.deepEqual(s.context.document.require('cluster').children.map(shape => shape.id), ['a', 'c']);
  s.ok('undo'); assert.equal(s.state(), before); s.ok('redo');
  s.ok('ungroup cluster'); assert.deepEqual(s.context.document.require('left').children.map(shape => shape.id), ['a', 'c', 'b']);
  s.ok('undo'); assert.ok(s.context.document.find('cluster'));
});

test('addto appends, front/back apply within siblings, and each operation can undo', () => {
  const s = new TestSession(); s.ok('init');
  for (const command of ['create g parent', 'create g a in parent', 'create g b in parent', 'create g c']) s.ok(command);
  for (const command of ['addto parent c', 'front a', 'back c', 'addto parent b']) {
    const before = s.state(); s.ok(command); const after = s.state(); s.ok('undo');
    assert.equal(s.state(), before); s.ok('redo'); assert.equal(s.state(), after);
  }
  assert.deepEqual(s.context.document.require('parent').children.map(shape => shape.id), ['c', 'a', 'b']);
});

test('invalid commands leave the document and redo history unchanged', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g outer'); s.ok('create g inner in outer');
  s.ok('create rect r 1 2 3 4'); s.ok('move r 1 0'); s.ok('undo'); const before = s.state();
  const failures = [
    'create g r', 'delete missing', 'create g x in missing', 'create g x in r',
    'create hexagon x', 'create box x', 'group bad outer inner', 'group bad r r',
    'addto inner outer', 'addto outer outer', 'ungroup outer', 'ungroup r',
    'scale r 0', 'scale r -1', 'scale r NaN', 'move r Infinity 1',
    'set r bogus x', 'set r id changed', 'set r width -1', 'set r stroke-width -1',
    'set outer x 5', 'set r text nope', 'create circle bad 0 0 -2',
    'create rect bad 0 0 1', 'canvas 100 -1', 'init 0', 'unknown', 'undo extra',
  ];
  for (const command of failures) {
    assert.match(s.run(command), /^error: [^\n]*$/, command); assert.equal(s.state(), before, command);
  }
  s.ok('redo'); assert.equal(s.context.document.require('r').attributes().get('x'), '2');
});

test('transaction restores partial group changes if arithmetic overflows', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g g');
  s.ok('create rect a 1 1 1 1 in g'); s.ok('create rect b 1e308 1 1 1 in g');
  const before = s.state();
  assert.match(s.run('move g 1e308 0'), /^error:/); assert.equal(s.state(), before);
  assert.match(s.run('scale g 10'), /^error:/); assert.equal(s.state(), before);
  s.ok('undo'); assert.equal(s.context.document.find('b'), undefined);
});

test('queries preserve redo; successful new edits clear it', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g a'); s.ok('create g b'); s.ok('undo');
  for (const query of ['tree', 'show a', 'help', 'canvas']) s.ok(query);
  s.ok('redo'); assert.ok(s.context.document.find('b')); s.ok('undo');
  s.ok('create g c'); assert.equal(s.run('redo'), 'error: nothing to redo');
});

test('successful document operations create a history barrier and new edit unlocks it', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g a'); s.ok('save a.svg');
  for (const operation of ['save', 'canvas 100 100', 'read a.svg', 'init']) {
    s.ok(operation);
    assert.equal(s.run('undo'), 'error: undo not allowed after io command');
    assert.equal(s.run('redo'), 'error: undo not allowed after io command');
    assert.match(s.run('delete absent'), /^error:/);
    assert.equal(s.run('undo'), 'error: undo not allowed after io command');
    s.ok('create g next'); s.ok('undo'); s.ok('redo');
    s.ok('delete next');
  }
});

test('failed read/save preserve both document history and default file path', () => {
  const s = new TestSession(); s.ok('init'); s.ok('create g g');
  assert.match(s.run('save'), /no file path/); s.ok('save first.svg');
  s.ok('create rect r 0 0 1 1'); const before = s.state();
  s.files.failWrites = true;
  assert.equal(s.run('save other.svg'), 'error: cannot write file: other.svg');
  assert.equal(s.context.savedPath, 'first.svg'); assert.equal(s.state(), before);
  assert.equal(s.run('read missing.svg'), 'error: cannot read file: missing.svg');
  s.files.failWrites = false; s.files.write('invalid.svg', '<svg><g></svg>');
  assert.match(s.run('read invalid.svg'), /^error: invalid SVG XML:/);
  assert.equal(s.context.savedPath, 'first.svg'); s.ok('undo'); assert.equal(s.context.document.find('r'), undefined);
});

test('save without a path reuses read or last successful save path', () => {
  const s = new TestSession(); s.files.write('space name.svg', '<svg width="20" height="30"><g id="g"/></svg>');
  s.ok('read "space name.svg"'); s.ok('create text t 1 2 "hello"'); s.ok('save');
  assert.match(s.files.read('space name.svg'), /hello/);
  s.ok('save second.svg'); s.ok('set t text "changed"'); s.ok('save');
  assert.match(s.files.read('second.svg'), /changed/); s.ok('init'); assert.match(s.run('save'), /no file path/);
});
