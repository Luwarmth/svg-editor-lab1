import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class BackCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(1); const id = this.args.at(0);
    context.document.reorder(id, false);
    return [`${context.document.require(id).label} sent to back`];
  }
}
