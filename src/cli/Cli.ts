import { createInterface } from 'node:readline';
import { Editor } from '../app/Editor';

export class Cli {
  public constructor(private readonly editor = new Editor()) {}
  public run(): void {
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
    console.log("svg-editor 0.1 — type 'help' for commands");
    input.setPrompt('svg> ');
    if (interactive) input.prompt();
    input.on('line', line => {
      for (const output of this.editor.execute(line)) console.log(output);
      if (interactive) input.prompt();
    });
    input.on('SIGINT', () => input.close());
  }
}
