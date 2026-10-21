import { CommandRegistry } from '../commands/CommandRegistry';
import { HistoryManager } from '../commands/HistoryManager';
import { Tokenizer } from '../commands/Tokenizer';
import { EditorContext } from './EditorContext';

export class Editor {
  private readonly tokenizer = new Tokenizer();
  private readonly history = new HistoryManager();
  private readonly registry = new CommandRegistry(this.history);
  public constructor(private readonly context = new EditorContext()) {}

  public execute(line: string): string[] {
    try {
      const tokens = this.tokenizer.parse(line);
      if (!tokens.length) return [];
      return this.history.execute(this.registry.create(tokens[0]!, tokens.slice(1)), this.context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
