import { FileStore } from '../src/io/FileStore';

export class MemoryFileStore implements FileStore {
  private readonly contents = new Map<string, string>();
  public failWrites = false;
  public read(path: string): string {
    const content = this.contents.get(path);
    if (content === undefined) throw new Error(`cannot read file: ${path}`);
    return content;
  }
  public write(path: string, content: string): void {
    if (this.failWrites) throw new Error(`cannot write file: ${path}`);
    this.contents.set(path, content);
  }
}
