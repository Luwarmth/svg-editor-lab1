import { Command } from './Command';

export class HelpCommand extends Command {
  public override get requiresDocument(): boolean { return false; }
  public execute(): string[] {
    this.args.count(0);
    return [
      'init [w] [h] | read <file.svg> | save [file.svg] | canvas [w h]',
      'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]',
      'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]',
      'create text <id> <x> <y> "content" [in <containerId>]',
      'create g <id> [in <containerId>]',
      'delete <id> | move <id> <dx> <dy> | scale <id> <factor>',
      'set <id> <attr> <value> (fill/stroke/stroke-width, geometry, text content)',
      'group <newGid> <id1> <id2>... | ungroup <gid> | addto <gid> <id>',
      'front <id> | back <id> | tree [id] | show <id> | help | undo | redo',
      'IDs are case-sensitive. Quote arguments containing spaces. # starts a whole-line comment.',
      'End input (Ctrl+D on Unix, Ctrl+Z then Enter on Windows) to exit.',
    ];
  }
}
