import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class ReadCommand extends Command {
  public override get mode(): 'document' { return 'document'; }
  public override get requiresDocument(): boolean { return false; }
  public execute(context: EditorContext): string[] {
    this.args.count(1);
    const path = this.args.at(0);
    const result = context.codec.decode(context.files.read(path));
    context.open(result.document, path);
    return [...result.warnings, `read ${path} (${result.document.all().length} elements)`];
  }
}
