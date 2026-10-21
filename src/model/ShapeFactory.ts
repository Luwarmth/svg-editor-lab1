import { Circle } from './Circle';
import { Ellipse } from './Ellipse';
import { Group } from './Group';
import { Line } from './Line';
import { Rect } from './Rect';
import { Shape } from './Shape';
import { Text } from './Text';
import { Value } from './Value';

interface Registration {
  readonly fields: readonly string[];
  readonly build: (id: string, values: readonly number[], text: string) => Shape;
  readonly paint?: string;
  readonly hasText?: boolean;
}

// TODO (plugin phase): replace built-in registrations with ShapeProvider registrations.
export class ShapeFactory {
  private readonly types = new Map<string, Registration>([
    ['rect', { fields: ['x', 'y', 'width', 'height'], paint: 'fill', build: (id, v) => new Rect(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['circle', { fields: ['cx', 'cy', 'r'], paint: 'fill', build: (id, v) => new Circle(id, v[0]!, v[1]!, v[2]!) }],
    ['ellipse', { fields: ['cx', 'cy', 'rx', 'ry'], paint: 'fill', build: (id, v) => new Ellipse(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['line', { fields: ['x1', 'y1', 'x2', 'y2'], paint: 'stroke', build: (id, v) => new Line(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['text', { fields: ['x', 'y'], hasText: true, build: (id, v, text) => new Text(id, v[0]!, v[1]!, text) }],
    ['g', { fields: [], build: id => new Group(id) }],
  ]);

  private registration(kind: string): Registration {
    const registration = this.types.get(kind);
    if (!registration) throw new Error(`unknown shape type: ${kind} (is the plugin loaded?)`);
    return registration;
  }

  public create(kind: string, id: string, parameters: readonly string[]): Shape {
    const registration = this.registration(kind);
    const required = registration.fields.length + (registration.hasText ? 1 : 0);
    if (parameters.length < required || parameters.length > required + (registration.paint ? 1 : 0)) {
      throw new Error(`invalid parameters for ${kind}; use 'help' for syntax`);
    }
    const values = registration.fields.map((name, index) => Value.number(parameters[index]!, name));
    const shape = registration.build(id, values, parameters[registration.fields.length] ?? '');
    if (registration.paint && parameters[required] !== undefined) shape.set(registration.paint, parameters[required]!);
    return shape;
  }

  public read(kind: string, id: string, attributes: ReadonlyMap<string, string>, text: string): Shape {
    const registration = this.registration(kind);
    const values = registration.fields.map(name => Value.number(attributes.get(name) ?? '0', name));
    const shape = registration.build(id, values, text);
    for (const [name, value] of attributes) {
      if (name === 'id' || name === 'transform' || registration.fields.includes(name)) continue;
      // data-kind marks future plugin types. Phase 1 deliberately degrades to an ordinary g.
      if (name === 'data-kind' && shape.container) continue;
      shape.readAttribute(name, value);
    }
    return shape;
  }
}
