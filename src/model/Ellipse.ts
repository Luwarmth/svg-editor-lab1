import { GeometryShape } from './GeometryShape';

export class Ellipse extends GeometryShape {
  public constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super('ellipse', id);
    this.define('cx', cx, 'x'); this.define('cy', cy, 'y'); this.define('rx', rx); this.define('ry', ry);
  }
  public override clone(): Ellipse {
    const copy = new Ellipse(this.id, this.get('cx'), this.get('cy'), this.get('rx'), this.get('ry'));
    this.copyStyles(copy);
    return copy;
  }
}
