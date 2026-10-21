import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class GroupCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(2, Number.POSITIVE_INFINITY);
    const group = context.document.group(this.args.at(0), this.args.rest(1));
    return [`${group.label} created with ${group.children.length} children`];
  }
}
