import { Shape } from '../model/Shape';
import { Value } from '../model/Value';

export class SvgTransform {
  public apply(shape: Shape, source: string, inherited: ReadonlyMap<string, string> = new Map()): void {
    const operations: Array<{ name: string; values: number[] }> = [];
    const pattern = /([a-zA-Z]+)\s*\(([^()]*)\)/g;
    let end = 0;
    for (const match of source.matchAll(pattern)) {
      if (!/^[\s,]*$/.test(source.slice(end, match.index))) throw new Error('unsupported SVG transform');
      const values = match[2]!.trim().split(/[\s,]+/).filter(Boolean).map(raw => Value.number(raw, 'transform'));
      const name = match[1]!;
      // Translation and uniform positive scaling are the transformations representable
      // by the Phase 1 geometric model. Reject everything else instead of corrupting it.
      if (name === 'translate' && (values.length === 1 || values.length === 2)) {
        operations.push({ name, values });
      } else if (name === 'scale' && (values.length === 1 || (values.length === 2 && values[0] === values[1]))) {
        Value.positive(values[0]!, 'scale factor'); operations.push({ name, values });
      } else throw new Error(`unsupported SVG transform: ${match[0]}`);
      end = match.index! + match[0].length;
    }
    if (!/^[\s,]*$/.test(source.slice(end))) throw new Error('unsupported SVG transform');
    for (const operation of operations.reverse()) {
      if (operation.name === 'translate') shape.move(operation.values[0]!, operation.values[1] ?? 0);
      else {
        shape.scale(operation.values[0]!);
        this.scalePresentation(shape, operation.values[0]!, inherited);
      }
    }
  }

  private scalePresentation(shape: Shape, factor: number, inherited: ReadonlyMap<string, string>): void {
    const effective = new Map([...inherited, ...shape.attributes()]);
    if (shape.container) {
      for (const child of shape.children) this.scalePresentation(child, factor, effective);
      return;
    }
    // Import normalization preserves the appearance of an SVG transform; the CLI
    // scale command intentionally changes only geometry as specified by the lab.
    const stroke = Value.number((effective.get('stroke-width') ?? '1').replace(/px$/, ''), 'stroke-width');
    shape.set('stroke-width', String(Value.finite(stroke * factor, 'stroke-width')));
    if (shape.content !== null) {
      const font = Value.number((effective.get('font-size') ?? '16').replace(/px$/, ''), 'font-size');
      shape.readAttribute('font-size', String(Value.finite(font * factor, 'font-size')));
    }
    const dash = effective.get('stroke-dasharray');
    if (dash && dash !== 'none') {
      const values = dash.trim().split(/[\s,]+/).map(raw => Value.number(raw.replace(/px$/, ''), 'stroke-dasharray'));
      shape.readAttribute('stroke-dasharray', values.map(value => Value.finite(value * factor, 'stroke-dasharray')).join(' '));
    }
  }
}
