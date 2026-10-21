import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class UngroupCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(1);
    const id = this.args.at(0); context.document.ungroup(id);
    return [`g#${id} ungrouped`];
  }
}
