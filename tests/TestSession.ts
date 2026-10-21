import assert from 'node:assert/strict';
import { Editor } from '../src/app/Editor';
import { EditorContext } from '../src/app/EditorContext';
import { MemoryFileStore } from './MemoryFileStore';

export class TestSession {
  public readonly files = new MemoryFileStore();
  public readonly context = new EditorContext(this.files);
  public readonly editor = new Editor(this.context);
  public run(line: string): string { return this.editor.execute(line).join('\n'); }
  public ok(line: string): string {
    const output = this.run(line);
    assert.ok(!output.startsWith('error:'), `${line}\n${output}`);
    return output;
  }
  public state(): string { return this.context.codec.encode(this.context.document); }
}
