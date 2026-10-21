import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class AddToCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(2);
    const gid = this.args.at(0); const id = this.args.at(1);
    context.document.addTo(gid, id);
    return [`${context.document.require(id).label} moved into g#${gid}`];
  }
}
