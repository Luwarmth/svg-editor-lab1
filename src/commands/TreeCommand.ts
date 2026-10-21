import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class TreeCommand extends Command {
  public execute(context: EditorContext): string[] {
    this.args.count(0, 1);
    return context.formatter.tree(context.document, this.args.length ? this.args.at(0) : undefined);
  }
}
