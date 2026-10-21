import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class DeleteCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(1);
    const shape = context.document.require(this.args.at(0));
    context.document.delete(shape.id);
    return [`${shape.label} deleted`];
  }
}
