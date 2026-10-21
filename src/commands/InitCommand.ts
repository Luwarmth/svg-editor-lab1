import { EditorContext } from '../app/EditorContext';
import { SvgDocument } from '../model/SvgDocument';
import { Command } from './Command';

export class InitCommand extends Command {
  public override get mode(): 'document' { return 'document'; }
  public override get requiresDocument(): boolean { return false; }
  public execute(context: EditorContext): string[] {
    this.args.count(0, 2);
    const document = new SvgDocument(this.args.length >= 1 ? this.args.number(0, 'width') : 800,
      this.args.length >= 2 ? this.args.number(1, 'height') : 600);
    context.open(document);
    return [`canvas ${document.width}x${document.height} created`];
  }
}
