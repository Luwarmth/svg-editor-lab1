import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class SaveCommand extends Command {
  public override get mode(): 'document' { return 'document'; }
  public execute(context: EditorContext): string[] {
    this.args.count(0, 1);
    const path = this.args.length ? this.args.at(0) : context.savedPath;
    if (!path) throw new Error('no file path. use \'save <file.svg>\' first');
    context.files.write(path, context.codec.encode(context.document));
    context.markSaved(path);
    return [`saved to ${path} (${context.document.all().length} elements)`];
  }
}
