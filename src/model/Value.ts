export class Value {
  public static number(raw: string, name: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`invalid number for ${name}: ${raw}`);
    }
    return this.finite(Number(raw), name);
  }

  public static finite(value: number, name: string): number {
    if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
    return Object.is(value, -0) ? 0 : value;
  }

  public static nonnegative(value: number, name: string): number {
    this.finite(value, name);
    if (value < 0) throw new Error(`${name} must be nonnegative`);
    return value;
  }

  public static positive(value: number, name: string): number {
    this.finite(value, name);
    if (value <= 0) throw new Error(`${name} must be positive`);
    return value;
  }

  public static text(value: string): string {
    if (/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value)) {
      throw new Error('invalid XML character');
    }
    return value;
  }

  public static id(value: string): string {
    this.text(value);
    if (!value || /\s/.test(value)) throw new Error(`invalid id: ${value}`);
    return value;
  }
}
