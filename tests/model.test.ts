import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ShapeFactory } from '../src/model/ShapeFactory';
import { SvgDocument } from '../src/model/SvgDocument';
import { TreeFormatter } from '../src/model/TreeFormatter';

test('six polymorphic types move and scale their geometric attributes', () => {
  const factory = new ShapeFactory();
  const inputs = [
    ['rect', ['1', '2', '3', '4']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4']],
    ['text', ['1', '2', '开始']], ['g', []],
  ] as const;
  for (const [kind, values] of inputs) {
    const shape = factory.create(kind, kind, values);
    const copy = shape.clone();
    shape.move(10, 20); shape.scale(2);
    if (kind !== 'g') {
      const attrs = shape.attributes();
      assert.equal(attrs.get(kind === 'line' ? 'x1' : kind === 'circle' || kind === 'ellipse' ? 'cx' : 'x'), '22');
    }
    assert.equal(copy.attributes().values().next().value, kind === 'g' ? undefined : '1');
  }
});

test('nested containers compose and cloning is independent', () => {
  const factory = new ShapeFactory(); const document = new SvgDocument();
  document.add(factory.create('g', 'scene', []));
  document.add(factory.create('g', 'node', []), 'scene');
  document.add(factory.create('rect', 'r', ['1', '2', '3', '4']), 'node');
  const copy = document.clone();
  document.require('scene').move(10, 20);
  assert.equal(document.require('r').attributes().get('x'), '11');
  assert.equal(copy.require('r').attributes().get('x'), '1');
  document.delete('scene'); assert.equal(document.all().length, 0);
  assert.equal(copy.all().length, 3);
});

test('group preserves original document order and ungroup restores its position', () => {
  const factory = new ShapeFactory(); const document = new SvgDocument();
  document.add(factory.create('g', 'scene', []));
  for (const id of ['a', 'b', 'c']) document.add(factory.create('g', id, []), 'scene');
  document.group('pair', ['c', 'a']);
  assert.deepEqual(document.require('pair').children.map(shape => shape.id), ['a', 'c']);
  assert.deepEqual(document.require('scene').children.map(shape => shape.id), ['pair', 'b']);
  document.ungroup('pair');
  assert.deepEqual(document.require('scene').children.map(shape => shape.id), ['a', 'c', 'b']);
});

test('validation prevents cycles, duplicate IDs and unsupported attributes', () => {
  const factory = new ShapeFactory(); const document = new SvgDocument();
  document.add(factory.create('g', 'outer', [])); document.add(factory.create('g', 'inner', []), 'outer');
  assert.throws(() => document.addTo('inner', 'outer'), /own descendant/);
  assert.throws(() => document.group('bad', ['inner', 'outer']), /own descendant: outer/);
  assert.throws(() => document.add(factory.create('g', 'inner', [])), /id already exists/);
  assert.throws(() => document.ungroup('outer'), /top-level/);
  assert.throws(() => document.require('outer').set('x', '1'), /unknown attribute/);
  assert.throws(() => factory.create('box', 'b', []), /unknown shape type/);
  assert.throws(() => factory.create('circle', 'c', ['0', '0', '-1']), /nonnegative/);
  assert.match(new TreeFormatter().tree(document).join('\n'), /g#outer\n.*g#inner/);
});
