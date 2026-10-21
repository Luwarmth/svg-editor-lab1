import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class FrontCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(1); const id = this.args.at(0);
    context.document.reorder(id, true);
    return [`${context.document.require(id).label} brought to front`];
  }
}
