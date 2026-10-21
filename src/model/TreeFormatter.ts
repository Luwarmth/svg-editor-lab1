import { Shape } from './Shape';
import { SvgDocument } from './SvgDocument';

export class TreeFormatter {
  public tree(document: SvgDocument, id?: string): string[] {
    const root = id === undefined ? null : document.require(id);
    const lines = [root ? root.summary() : `svg (${document.width}x${document.height})`];
    this.append(root ? root.children : document.children, '', lines);
    return lines;
  }
  private append(children: readonly Shape[], prefix: string, lines: string[]): void {
    children.forEach((shape, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${shape.summary()}`);
      this.append(shape.children, `${prefix}${last ? '    ' : '│   '}`, lines);
    });
  }
  public show(document: SvgDocument, id: string): string[] {
    const shape = document.require(id);
    const attributes = [...shape.attributes()].map(([key, value]) => `${key}=${value}`).join(' ');
    const result = [`${shape.label}  parent=${document.parentLabel(id)}`];
    if (attributes) result.push(`  ${attributes}`);
    if (shape.content !== null) result.push(`  text=${JSON.stringify(shape.content)}`);
    return result;
  }
}
