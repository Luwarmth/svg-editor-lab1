import { Group } from './Group';
import { Shape } from './Shape';
import { Value } from './Value';

export class SvgDocument {
  private readonly root = new Group('__internal_canvas__');
  private canvasWidth: number;
  private canvasHeight: number;

  public constructor(width = 800, height = 600) {
    this.canvasWidth = Value.positive(width, 'canvas width');
    this.canvasHeight = Value.positive(height, 'canvas height');
  }
  public get width(): number { return this.canvasWidth; }
  public get height(): number { return this.canvasHeight; }
  public get children(): readonly Shape[] { return this.root.children; }

  public resize(width: number, height: number): void {
    Value.positive(width, 'canvas width'); Value.positive(height, 'canvas height');
    this.canvasWidth = width; this.canvasHeight = height;
  }

  public all(): readonly Shape[] {
    const result: Shape[] = [];
    this.collect(this.root, result);
    return result;
  }
  private collect(parent: Shape, result: Shape[]): void {
    for (const child of parent.children) { result.push(child); this.collect(child, result); }
  }
  public find(id: string): Shape | undefined { return this.all().find(shape => shape.id === id); }
  public require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  public requireContainer(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!shape.container) throw new Error(`not a container: ${id}`);
    return shape.container;
  }
  public assertAvailable(id: string): void {
    Value.id(id);
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
  }

  public add(shape: Shape, parentId?: string): void {
    const incoming: Shape[] = [shape]; this.collect(shape, incoming);
    const ids = new Set<string>();
    for (const node of incoming) {
      this.assertAvailable(node.id);
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    const parent = parentId === undefined ? this.root : this.requireContainer(parentId);
    parent.insert(shape);
  }

  private parentOf(shape: Shape, parent = this.root): Group {
    if (parent.children.includes(shape)) return parent;
    for (const child of parent.children) {
      if (child.container && child.contains(shape)) return this.parentOf(shape, child.container);
    }
    throw new Error(`no parent for shape: ${shape.id}`);
  }
  public parentLabel(id: string): string {
    const parent = this.parentOf(this.require(id));
    return parent === this.root ? 'svg' : parent.label;
  }
  public delete(id: string): void {
    const shape = this.require(id);
    this.parentOf(shape).remove(shape);
  }

  public group(newId: string, ids: readonly string[]): Group {
    this.assertAvailable(newId);
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate shape in group');
    const requested = ids.map(id => this.require(id));
    for (const shape of requested) {
      if (requested.some(other => other !== shape && shape.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const selected = this.all().filter(shape => requested.includes(shape));
    const first = selected[0]!;
    const destination = this.parentOf(first);
    const index = destination.children.indexOf(first);
    const parents = selected.map(shape => this.parentOf(shape));
    const group = new Group(newId);
    selected.forEach((shape, i) => { parents[i]!.remove(shape); group.insert(shape); });
    destination.insert(group, index);
    return group;
  }

  public ungroup(id: string): void {
    const group = this.requireContainer(id);
    const parent = this.parentOf(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(group);
    group.children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
  }

  public addTo(groupId: string, id: string): void {
    const destination = this.requireContainer(groupId);
    const shape = this.require(id);
    if (shape === destination || shape.contains(destination)) {
      throw new Error(`cannot move a container into its own descendant: ${id}`);
    }
    this.parentOf(shape).remove(shape);
    destination.insert(shape);
  }

  public reorder(id: string, front: boolean): void {
    const shape = this.require(id);
    const parent = this.parentOf(shape);
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }

  public clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const shape of this.children) copy.root.insert(shape.clone());
    return copy;
  }
}
