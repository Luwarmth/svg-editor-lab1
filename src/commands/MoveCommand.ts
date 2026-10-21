import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class MoveCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(3);
    const shape = context.document.require(this.args.at(0));
    const dx = this.args.number(1, 'dx'); const dy = this.args.number(2, 'dy');
    shape.move(dx, dy);
    return [`${shape.label} moved by (${dx},${dy})`];
  }
}
