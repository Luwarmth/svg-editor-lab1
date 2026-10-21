import { GeometryShape } from './GeometryShape';

export class Circle extends GeometryShape {
  public constructor(id: string, cx: number, cy: number, r: number) {
    super('circle', id);
    this.define('cx', cx, 'x'); this.define('cy', cy, 'y'); this.define('r', r);
  }
  public override clone(): Circle {
    const copy = new Circle(this.id, this.get('cx'), this.get('cy'), this.get('r'));
    this.copyStyles(copy);
    return copy;
  }
}
