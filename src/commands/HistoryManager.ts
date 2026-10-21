import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';
import { HistoryEntry } from './HistoryEntry';

export class HistoryManager {
  private readonly past: HistoryEntry[] = [];
  private readonly future: HistoryEntry[] = [];
  private blocked = false;

  public execute(command: Command, context: EditorContext): string[] {
    if (command.requiresDocument) void context.document;
    if (command.mode !== 'edit') {
      const output = command.execute(context);
      if (command.mode === 'document') this.barrier();
      return output;
    }
    const before = context.document.clone();
    try {
      const output = command.execute(context);
      const after = context.document.clone();
      this.past.push(new HistoryEntry(before, after, output.join('; ')));
      this.future.length = 0;
      this.blocked = false;
      return output;
    } catch (error) {
      context.restore(before);
      throw error;
    }
  }

  private barrier(): void {
    this.past.length = 0; this.future.length = 0; this.blocked = true;
  }
  private assertAllowed(): void {
    if (this.blocked) throw new Error('undo not allowed after io command');
  }
  public undo(context: EditorContext): string[] {
    this.assertAllowed();
    const entry = this.past.at(-1);
    if (!entry) throw new Error('nothing to undo');
    context.restore(entry.undo()); this.past.pop(); this.future.push(entry);
    return [`undone: ${entry.summary}`];
  }
  public redo(context: EditorContext): string[] {
    this.assertAllowed();
    const entry = this.future.at(-1);
    if (!entry) throw new Error('nothing to redo');
    context.restore(entry.redo()); this.future.pop(); this.past.push(entry);
    return [`redone: ${entry.summary}`];
  }
}
