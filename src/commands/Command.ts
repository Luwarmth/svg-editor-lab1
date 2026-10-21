import { EditorContext } from '../app/EditorContext';
import { Arguments } from './Arguments';

export abstract class Command {
  protected readonly args: Arguments;
  public constructor(raw: readonly string[]) { this.args = new Arguments(raw); }
  public get mode(): 'edit' | 'query' | 'document' { return 'query'; }
  public get requiresDocument(): boolean { return true; }
  public abstract execute(context: EditorContext): string[];
}
