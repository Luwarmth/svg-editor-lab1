import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { FileStore } from './FileStore';

export class LocalFileStore implements FileStore {
  public read(path: string): string {
    try { return readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
  }
  public write(path: string, content: string): void {
    // Same-directory temporary file keeps a failed write from truncating a valid SVG.
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      try { unlinkSync(temporary); } catch { /* There may be no temporary file to remove. */ }
      throw new Error(`cannot write file: ${path}`);
    }
  }
}
