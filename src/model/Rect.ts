import { GeometryShape } from './GeometryShape';

export class Rect extends GeometryShape {
  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super('rect', id);
    this.define('x', x, 'x'); this.define('y', y, 'y');
    this.define('width', width); this.define('height', height);
  }
  public override clone(): Rect {
    const copy = new Rect(this.id, this.get('x'), this.get('y'), this.get('width'), this.get('height'));
    this.copyStyles(copy);
    return copy;
  }
}
