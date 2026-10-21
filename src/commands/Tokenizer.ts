export class Tokenizer {
  public parse(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let value = ''; let quoted = false; let started = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index]!;
      if (char === '"') { quoted = !quoted; started = true; }
      else if (quoted && char === '\\' && ['"', '\\'].includes(line[index + 1] ?? '')) {
        value += line[++index]; started = true;
      } else if (!quoted && /\s/.test(char)) {
        if (started) { tokens.push(value); value = ''; started = false; }
      } else { value += char; started = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (started) tokens.push(value);
    return tokens;
  }
}
