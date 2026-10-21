import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';
import { HistoryManager } from './HistoryManager';

export class UndoCommand extends Command {
  public constructor(raw: readonly string[], private readonly history: HistoryManager) { super(raw); }
  public execute(context: EditorContext): string[] {
    this.args.count(0); return this.history.undo(context);
  }
}
