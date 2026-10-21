import type { Group } from './Group';
import { Value } from './Value';

export abstract class Shape {
  private readonly styles = new Map<string, string>();

  protected constructor(public readonly kind: string, public readonly id: string) {
    Value.id(id);
  }

  public get label(): string { return `${this.kind}#${this.id}`; }
  public get container(): Group | null { return null; }
  public get children(): readonly Shape[] { return []; }
  public get content(): string | null { return null; }
  public abstract move(dx: number, dy: number): void;
  public abstract scale(factor: number): void;
  public abstract clone(): Shape;
  public abstract geometrySummary(): string;

  public contains(target: Shape): boolean {
    return this.children.some(child => child === target || child.contains(target));
  }

  public set(name: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(name)) {
      throw new Error(`unknown attribute: ${name}`);
    }
    if (name === 'stroke-width') Value.nonnegative(Value.number(value, name), name);
    this.styles.set(name, Value.text(value));
  }

  public attributes(): ReadonlyMap<string, string> {
    return new Map(this.styles);
  }

  public readAttribute(name: string, value: string): void {
    if (['font-size', 'font-family', 'font-weight', 'text-anchor', 'opacity',
      'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
      'dominant-baseline', 'xml:space'].includes(name)) {
      this.styles.set(name, Value.text(value));
    } else this.set(name, value);
  }

  public summary(): string {
    const styles = [...this.styles].map(([key, value]) => `${key}=${value}`).join(' ');
    return [this.label, this.geometrySummary(), styles].filter(Boolean).join('  ');
  }

  protected copyStyles(target: Shape): void {
    for (const [name, value] of this.styles) target.styles.set(name, value);
  }
}
