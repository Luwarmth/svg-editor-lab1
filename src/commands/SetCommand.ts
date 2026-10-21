import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class SetCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(3);
    const shape = context.document.require(this.args.at(0));
    const name = this.args.at(1); const value = this.args.at(2);
    shape.set(name, value);
    return [`${shape.label} updated: ${name}=${JSON.stringify(value)}`];
  }
}
