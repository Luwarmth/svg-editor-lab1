import { Shape } from './Shape';
import { Value } from './Value';

export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  public constructor(id: string) { super('g', id); }
  public override get container(): Group { return this; }
  public override get children(): readonly Shape[] { return [...this.nodes]; }
  public override geometrySummary(): string { return ''; }

  public insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || shape.contains(this)) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    if (this.nodes.includes(shape)) throw new Error(`shape already in container: ${shape.id}`);
    if (!Number.isInteger(index) || index < 0 || index > this.nodes.length) throw new Error('invalid child index');
    this.nodes.splice(index, 0, shape);
  }

  public remove(shape: Shape): number {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.nodes.splice(index, 1);
    return index;
  }

  public override move(dx: number, dy: number): void {
    Value.finite(dx, 'dx'); Value.finite(dy, 'dy');
    for (const node of this.nodes) node.move(dx, dy);
  }
  public override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    for (const node of this.nodes) node.scale(factor);
  }
  public override clone(): Group {
    const copy = new Group(this.id);
    this.copyStyles(copy);
    for (const node of this.nodes) copy.insert(node.clone());
    return copy;
  }
}
