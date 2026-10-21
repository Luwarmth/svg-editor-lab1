import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { LocalFileStore } from '../src/io/LocalFileStore';
import { SvgCodec } from '../src/io/SvgCodec';
import { ShapeFactory } from '../src/model/ShapeFactory';
import { SvgDocument } from '../src/model/SvgDocument';

test('SVG round-trip retains all types, hierarchy, order, styles and literal XML text', () => {
  const document = new SvgDocument(400, 200); const factory = new ShapeFactory(); const codec = new SvgCodec();
  document.add(factory.create('g', 'root', [])); document.require('root').set('fill', '#eee');
  document.add(factory.create('g', 'child', []), 'root');
  document.add(factory.create('rect', 'r', ['-1', '.5', '20', '30', '#abc']), 'child');
  document.add(factory.create('circle', 'c', ['1', '2', '3']), 'child');
  document.add(factory.create('ellipse', 'e', ['1', '2', '3', '4']), 'child');
  document.add(factory.create('line', 'l', ['1', '2', '3', '4', 'black']), 'root');
  document.add(factory.create('text', 't', ['2', '3', 'A&B <世界> "quote"']), 'root');
  document.require('l').set('stroke-width', '2');
  const before = codec.encode(document);
  assert.equal(codec.encode(codec.decode(before).document), before); assert.match(before, /&amp;B &lt;世界&gt;/);
});

test('unnamed elements receive deterministic collision-free IDs reserved across the whole file', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg><rect/><g><rect id="rect1"/><rect/></g><g id="g1"/></svg>');
  assert.deepEqual(result.document.all().map(shape => shape.id), ['rect2', 'g2', 'rect1', 'rect3', 'g1']);
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g2 to unnamed <g>',
    'warning: assigned id rect3 to unnamed <rect>',
  ]);
});

test('XML numeric entities, CDATA, whitespace and presentation attributes survive read/save', () => {
  const codec = new SvgCodec();
  const decoded = codec.decode('<svg><!-- note --><text id="t" x="1" y="2" font-size="18" text-anchor="middle">  A&#10;&amp;<![CDATA[<中国>]]> </text></svg>');
  assert.equal(decoded.document.require('t').content, '  A\n&<中国> ');
  const encoded = codec.encode(decoded.document);
  assert.match(encoded, /font-size="18"/); assert.match(encoded, /text-anchor="middle"/);
  assert.equal(codec.decode(encoded).document.require('t').content, '  A\n&<中国> ');
});

test('nested translation and uniform scaling normalize in SVG transform order', () => {
  const result = new SvgCodec().decode('<svg width="400" height="200"><g id="g" transform="translate(60,40)"><g id="n" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/></g></g></svg>');
  const attrs = result.document.require('r').attributes();
  assert.equal(attrs.get('x'), '260'); assert.equal(attrs.get('y'), '40');
  assert.equal(attrs.get('width'), '96'); assert.equal(attrs.get('height'), '48');
});

test('unsupported or malformed SVG fails explicitly instead of dropping data', () => {
  const codec = new SvgCodec();
  const invalid = [
    '<svg><g></svg>', '<root/>', '<svg/><svg/>',
    '<svg><rect id="x"/><g id="x"/></svg>', '<svg><path id="p"/></svg>',
    '<svg><rect id="r" width="NaN"/></svg>', '<svg><circle id="c" r="-1"/></svg>',
    '<svg><g id="g" transform="rotate(30)"/></svg>', '<svg><g id="g" transform="scale(2,3)"/></svg>',
    '<svg><g id="g" transform="garbage"/></svg>', '<svg viewBox="1 0 800 600"/>',
    '<svg xmlns="wrong"/>', '<svg style="fill:red"/>', '<svg><rect id="r" unknown="x"/></svg>',
    '<svg><text id="t"><tspan>nope</tspan></text></svg>', '<svg>unexpected</svg>',
    '<!DOCTYPE svg [<!ENTITY x "abc">]><svg/>', '<svg><rect id="white space"/></svg>',
  ];
  for (const source of invalid) assert.throws(() => codec.decode(source), /./, source);
});

test('box markup degrades to ordinary g and imported styles remain outside the set whitelist', () => {
  const document = new SvgCodec().decode('<svg><g id="n" data-kind="box"><text id="t" font-size="16">box</text></g></svg>').document;
  assert.equal(document.require('n').kind, 'g');
  assert.throws(() => document.require('t').set('font-size', '20'), /unknown attribute: font-size/);
  assert.equal(document.clone().require('t').attributes().get('font-size'), '16');
});

test('import scaling retains inherited stroke width, dash lengths and text size', () => {
  const document = new SvgCodec().decode('<svg><g id="g" font-size="20" stroke="black" stroke-width="4" stroke-dasharray="2 4" transform="scale(0.5)"><text id="t" x="10">ok</text><rect id="r" width="20" height="20"/></g></svg>').document;
  const text = document.require('t').attributes(); const rect = document.require('r').attributes();
  assert.equal(text.get('x'), '5'); assert.equal(text.get('font-size'), '10');
  assert.equal(rect.get('stroke-width'), '2'); assert.equal(rect.get('stroke-dasharray'), '1 2');
});

test('local file store writes and overwrites SVG, reports errors and cleans temporary files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-'));
  try {
    const store = new LocalFileStore(); const file = join(directory, 'space name.svg');
    store.write(file, '<svg/>'); store.write(file, '<svg width="100"/>');
    assert.equal(readFileSync(file, 'utf8'), '<svg width="100"/>');
    assert.equal(store.read(file), '<svg width="100"/>');
    assert.throws(() => store.read(join(directory, 'absent.svg')), /cannot read file/);
    assert.throws(() => store.write(join(directory, 'absent', 'x.svg'), 'x'), /cannot write file/);
    const target = join(directory, 'target'); mkdirSync(target);
    assert.throws(() => store.write(target, 'x'), /cannot write file/);
    assert.equal(readdirSync(directory).some(name => name.endsWith('.tmp')), false);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
