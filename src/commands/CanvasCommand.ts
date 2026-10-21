import { EditorContext } from '../app/EditorContext';
import { Command } from './Command';

export class CanvasCommand extends Command {
  public override get mode(): 'query' | 'document' { return this.args.length ? 'document' : 'query'; }
  public execute(context: EditorContext): string[] {
    if (this.args.length) {
      this.args.count(2);
      context.document.resize(this.args.number(0, 'width'), this.args.number(1, 'height'));
    }
    return [`canvas ${context.document.width}x${context.document.height}`];
  }
}
