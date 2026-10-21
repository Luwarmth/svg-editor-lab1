import { GeometryShape } from './GeometryShape';
import { Value } from './Value';

export class Text extends GeometryShape {
  private text: string;
  public constructor(id: string, x: number, y: number, content: string) {
    super('text', id);
    this.define('x', x, 'x'); this.define('y', y, 'y');
    this.text = Value.text(content);
  }
  public override get content(): string { return this.text; }
  public override set(name: string, value: string): void {
    if (name === 'text') this.text = Value.text(value);
    else super.set(name, value);
  }
  public override geometrySummary(): string {
    return `(${this.get('x')},${this.get('y')}) ${JSON.stringify(this.text)}`;
  }
  public override clone(): Text {
    const copy = new Text(this.id, this.get('x'), this.get('y'), this.text);
    this.copyStyles(copy);
    return copy;
  }
}
