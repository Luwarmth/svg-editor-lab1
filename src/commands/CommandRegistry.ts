import { Command } from './Command';
import { HistoryManager } from './HistoryManager';
import { InitCommand } from './InitCommand';
import { ReadCommand } from './ReadCommand';
import { SaveCommand } from './SaveCommand';
import { CanvasCommand } from './CanvasCommand';
import { CreateCommand } from './CreateCommand';
import { DeleteCommand } from './DeleteCommand';
import { MoveCommand } from './MoveCommand';
import { ScaleCommand } from './ScaleCommand';
import { SetCommand } from './SetCommand';
import { GroupCommand } from './GroupCommand';
import { UngroupCommand } from './UngroupCommand';
import { AddToCommand } from './AddToCommand';
import { FrontCommand } from './FrontCommand';
import { BackCommand } from './BackCommand';
import { TreeCommand } from './TreeCommand';
import { ShowCommand } from './ShowCommand';
import { HelpCommand } from './HelpCommand';
import { UndoCommand } from './UndoCommand';
import { RedoCommand } from './RedoCommand';

// TODO (plugin phase): expose command registration without changing this built-in list.
export class CommandRegistry {
  private readonly commands: ReadonlyMap<string, (args: readonly string[]) => Command>;
  public constructor(history: HistoryManager) {
    this.commands = new Map<string, (args: readonly string[]) => Command>([
      ['init', args => new InitCommand(args)], ['read', args => new ReadCommand(args)],
      ['save', args => new SaveCommand(args)], ['canvas', args => new CanvasCommand(args)],
      ['create', args => new CreateCommand(args)], ['delete', args => new DeleteCommand(args)],
      ['move', args => new MoveCommand(args)], ['scale', args => new ScaleCommand(args)],
      ['set', args => new SetCommand(args)], ['group', args => new GroupCommand(args)],
      ['ungroup', args => new UngroupCommand(args)], ['addto', args => new AddToCommand(args)],
      ['front', args => new FrontCommand(args)], ['back', args => new BackCommand(args)],
      ['tree', args => new TreeCommand(args)], ['show', args => new ShowCommand(args)],
      ['help', args => new HelpCommand(args)], ['undo', args => new UndoCommand(args, history)],
      ['redo', args => new RedoCommand(args, history)],
    ]);
  }
  public create(name: string, args: readonly string[]): Command {
    const create = this.commands.get(name);
    if (!create) throw new Error(`unknown command: ${name}`);
    return create(args);
  }
}
