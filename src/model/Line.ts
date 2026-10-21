import { GeometryShape } from './GeometryShape';

export class Line extends GeometryShape {
  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super('line', id);
    this.define('x1', x1, 'x'); this.define('y1', y1, 'y');
    this.define('x2', x2, 'x'); this.define('y2', y2, 'y');
  }
  public override clone(): Line {
    const copy = new Line(this.id, this.get('x1'), this.get('y1'), this.get('x2'), this.get('y2'));
    this.copyStyles(copy);
    return copy;
  }
}
