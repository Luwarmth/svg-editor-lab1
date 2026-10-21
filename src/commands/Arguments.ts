import { Value } from '../model/Value';

export class Arguments {
  public constructor(private readonly values: readonly string[]) {}
  public get length(): number { return this.values.length; }
  public at(index: number): string {
    const value = this.values[index];
    if (value === undefined) throw new Error('missing argument; use \'help\' for syntax');
    return value;
  }
  public number(index: number, name: string): number { return Value.number(this.at(index), name); }
  public rest(index: number): readonly string[] { return this.values.slice(index); }
  public count(min: number, max = min): void {
    if (this.length < min || this.length > max) throw new Error('invalid argument count; use \'help\' for syntax');
  }
}
