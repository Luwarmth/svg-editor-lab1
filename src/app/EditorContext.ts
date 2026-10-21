import { FileStore } from '../io/FileStore';
import { LocalFileStore } from '../io/LocalFileStore';
import { SvgCodec } from '../io/SvgCodec';
import { ShapeFactory } from '../model/ShapeFactory';
import { SvgDocument } from '../model/SvgDocument';
import { TreeFormatter } from '../model/TreeFormatter';

export class EditorContext {
  private current: SvgDocument | null = null;
  private path: string | undefined;
  public readonly factory = new ShapeFactory();
  public readonly formatter = new TreeFormatter();
  public readonly codec = new SvgCodec(this.factory);

  public constructor(public readonly files: FileStore = new LocalFileStore()) {}
  public get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  public get savedPath(): string | undefined { return this.path; }
  public open(document: SvgDocument, path?: string): void { this.current = document; this.path = path; }
  public restore(document: SvgDocument): void { this.current = document.clone(); }
  public markSaved(path: string): void { this.path = path; }
}
