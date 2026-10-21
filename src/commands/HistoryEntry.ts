import { SvgDocument } from '../model/SvgDocument';

export class HistoryEntry {
  public constructor(private readonly before: SvgDocument, private readonly after: SvgDocument,
    public readonly summary: string) {}
  public undo(): SvgDocument { return this.before.clone(); }
  public redo(): SvgDocument { return this.after.clone(); }
}
