import { Shape } from './Shape';
import { Value } from './Value';

export abstract class GeometryShape extends Shape {
  private readonly values = new Map<string, number>();
  private readonly horizontal = new Set<string>();
  private readonly vertical = new Set<string>();
  private readonly dimensions = new Set<string>();

  protected define(name: string, value: number, axis?: 'x' | 'y'): void {
    if (axis === 'x') this.horizontal.add(name);
    else if (axis === 'y') this.vertical.add(name);
    else this.dimensions.add(name);
    this.assign(name, value);
  }

  protected get(name: string): number {
    const value = this.values.get(name);
    if (value === undefined) throw new Error(`unknown attribute: ${name}`);
    return value;
  }

  private assign(name: string, value: number): void {
    Value.finite(value, name);
    if (this.dimensions.has(name)) Value.nonnegative(value, name);
    this.values.set(name, Object.is(value, -0) ? 0 : value);
  }

  public override set(name: string, value: string): void {
    if (this.values.has(name)) this.assign(name, Value.number(value, name));
    else super.set(name, value);
  }

  public override move(dx: number, dy: number): void {
    Value.finite(dx, 'dx');
    Value.finite(dy, 'dy');
    const updates = new Map<string, number>();
    for (const name of this.horizontal) updates.set(name, Value.finite(this.get(name) + dx, name));
    for (const name of this.vertical) updates.set(name, Value.finite(this.get(name) + dy, name));
    for (const [name, value] of updates) this.assign(name, value);
  }

  public override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    const updates = [...this.values].map(([name, value]) => [name, Value.finite(value * factor, name)] as const);
    for (const [name, value] of updates) this.assign(name, value);
  }

  public override attributes(): ReadonlyMap<string, string> {
    const attributes = new Map([...this.values].map(([name, value]) => [name, String(value)] as const));
    for (const [name, value] of super.attributes()) attributes.set(name, value);
    return attributes;
  }

  public override geometrySummary(): string {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join(' ');
  }
}
