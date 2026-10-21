import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class ShowCommand extends Command {
  public execute(context: EditorContext): string[] {
    this.args.count(1);
    return context.formatter.show(context.document, this.args.at(0));
  }
}
