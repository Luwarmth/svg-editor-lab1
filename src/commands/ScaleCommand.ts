import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class ScaleCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(2);
    const shape = context.document.require(this.args.at(0));
    const factor = this.args.number(1, 'scale factor');
    shape.scale(factor);
    return [`${shape.label} scaled by ${factor}`];
  }
}
