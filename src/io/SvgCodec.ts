import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Shape } from '../model/Shape';
import { ShapeFactory } from '../model/ShapeFactory';
import { SvgDocument } from '../model/SvgDocument';
import { Value } from '../model/Value';
import { SvgTransform } from './SvgTransform';
import { Xml } from './Xml';

interface XmlNode {
  [name: string]: unknown;
  ':@'?: Record<string, string>;
}

export class SvgCodec {
  public constructor(private readonly factory = new ShapeFactory()) {}

  public encode(document: SvgDocument): string {
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`];
    for (const shape of document.children) this.serialize(shape, 1, lines);
    lines.push('</svg>', '');
    return lines.join('\n');
  }

  private serialize(shape: Shape, depth: number, lines: string[]): void {
    const indent = '  '.repeat(depth);
    const attributes = new Map([['id', shape.id], ...shape.attributes()]);
    const tag = `${indent}<${shape.kind} ${[...attributes].map(([name, value]) => `${name}="${Xml.escape(value)}"`).join(' ')}`;
    if (shape.content !== null) lines.push(`${tag}>${Xml.escape(shape.content)}</${shape.kind}>`);
    else if (shape.children.length === 0) lines.push(`${tag}/>`);
    else {
      lines.push(`${tag}>`);
      for (const child of shape.children) this.serialize(child, depth + 1, lines);
      lines.push(`${indent}</${shape.kind}>`);
    }
  }

  public decode(source: string): { document: SvgDocument; warnings: string[] } {
    Value.text(source);
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('SVG document types and entity declarations are not supported');
    const valid = XMLValidator.validate(source);
    if (valid !== true) throw new Error(`invalid SVG XML: ${valid.err.msg}`);
    const parser = new XMLParser({
      preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: '',
      parseTagValue: false, parseAttributeValue: false, trimValues: false,
      ignoreDeclaration: true, ignorePiTags: true, cdataPropName: '#cdata',
      processEntities: true, htmlEntities: true,
    });
    const nodes = parser.parse(source) as XmlNode[];
    if (nodes.some(node => this.tag(node) === '#text' && String(node['#text']).trim())) throw new Error('unexpected text outside <svg>');
    const elements = nodes.filter(node => this.tag(node) !== '#text');
    if (elements.length !== 1 || this.tag(elements[0]!) !== 'svg') throw new Error('expected a single <svg> root');
    const root = elements[0]!;
    const rootAttributes = new Map(Object.entries(root[':@'] ?? {}));
    if (rootAttributes.has('xmlns') && rootAttributes.get('xmlns') !== 'http://www.w3.org/2000/svg') throw new Error('invalid SVG namespace');
    const width = this.dimension(rootAttributes.get('width') ?? '800', 'canvas width');
    const height = this.dimension(rootAttributes.get('height') ?? '600', 'canvas height');
    const viewBox = rootAttributes.get('viewBox');
    if (viewBox !== undefined) {
      const values = viewBox.trim().split(/[\s,]+/).map(raw => Value.number(raw, 'viewBox'));
      if (values.length !== 4 || values[0] !== 0 || values[1] !== 0 || values[2] !== width || values[3] !== height) {
        throw new Error('unsupported viewBox: expected 0 0 width height');
      }
    }
    for (const key of rootAttributes.keys()) {
      if (!['xmlns', 'width', 'height', 'viewBox', 'version', 'id'].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    }
    const children = this.childNodes(root);
    const used = new Set<string>();
    this.reserveIds(children, used);
    const document = new SvgDocument(width, height);
    const warnings: string[] = [];
    for (const child of children) {
      const shape = this.deserialize(child, used, warnings);
      if (shape) document.add(shape);
    }
    return { document, warnings };
  }

  private dimension(raw: string, name: string): number {
    return Value.positive(Value.number(raw.replace(/px$/, ''), name), name);
  }
  private tag(node: XmlNode): string {
    return Object.keys(node).find(name => name !== ':@') ?? '';
  }
  private childNodes(node: XmlNode): XmlNode[] {
    const value = node[this.tag(node)];
    return Array.isArray(value) ? value as XmlNode[] : [];
  }
  private reserveIds(nodes: XmlNode[], used: Set<string>): void {
    for (const node of nodes) {
      const id = node[':@']?.id;
      if (id !== undefined) {
        Value.id(id);
        if (used.has(id)) throw new Error(`id already exists: ${id}`);
        used.add(id);
      }
      this.reserveIds(this.childNodes(node), used);
    }
  }
  private deserialize(node: XmlNode, used: Set<string>, warnings: string[], inherited: ReadonlyMap<string, string> = new Map()): Shape | null {
    const kind = this.tag(node);
    if (kind === '#text') {
      if (String(node['#text']).trim()) throw new Error('unexpected text outside <text>');
      return null;
    }
    const attributes = new Map(Object.entries(node[':@'] ?? {}));
    let id = attributes.get('id');
    if (id === undefined) {
      let index = 1;
      while (used.has(`${kind}${index}`)) index++;
      id = `${kind}${index}`; used.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${kind}>`);
    }
    const children = this.childNodes(node);
    const text = this.textContent(children);
    const shape = this.factory.read(kind, id, attributes, text);
    const effective = new Map([...inherited, ...shape.attributes()]);
    if (shape.container) {
      for (const child of children) {
        const childShape = this.deserialize(child, used, warnings, effective);
        if (childShape) shape.container.insert(childShape);
      }
    } else if (shape.content !== null) {
      if (children.some(child => !['#text', '#cdata'].includes(this.tag(child)))) throw new Error('nested text elements are not supported');
    } else if (children.some(child => this.tag(child) !== '#text' || String(child['#text']).trim())) {
      throw new Error(`unexpected content in <${kind}>`);
    }
    if (attributes.has('transform')) new SvgTransform().apply(shape, attributes.get('transform')!, inherited);
    return shape;
  }

  private textContent(nodes: XmlNode[]): string {
    return nodes.map(node => {
      if (this.tag(node) === '#text') return String(node['#text']);
      if (this.tag(node) === '#cdata') return this.textContent(this.childNodes(node));
      return '';
    }).join('');
  }
}
