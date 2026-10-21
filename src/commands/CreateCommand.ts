import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class CreateCommand extends Command {
  public override get mode(): 'edit' { return 'edit'; }
  public execute(context: EditorContext): string[] {
    this.args.count(2, Number.POSITIVE_INFINITY);
    const kind = this.args.at(0); const id = this.args.at(1);
    const parameters = [...this.args.rest(2)];
    let parentId: string | undefined;
    if (parameters.length >= 2 && parameters.at(-2) === 'in') {
      parentId = parameters.pop()!; parameters.pop();
    }
    context.document.assertAvailable(id);
    const shape = context.factory.create(kind, id, parameters);
    context.document.add(shape, parentId);
    return [`${shape.label} created${parentId === undefined ? '' : ` in g#${parentId}`}`];
  }
}
