const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..', 'src');
const files = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.ts'));
const allowed = {
  model: new Set(['model']), io: new Set(['io', 'model']),
  commands: new Set(['commands', 'model', 'io', 'app']),
  app: new Set(['app', 'commands', 'model', 'io']), cli: new Set(['cli', 'app']),
};
const violations = [];
for (const file of files) {
  const fullPath = path.join(root, file);
  const layer = file.split(path.sep)[0];
  const source = ts.createSourceFile(fullPath, fs.readFileSync(fullPath, 'utf8'), ts.ScriptTarget.Latest, true);
  let classes = 0;
  for (const statement of source.statements) {
    if (ts.isClassDeclaration(statement)) {
      classes++;
      if (statement.name?.text !== path.basename(file, '.ts')) violations.push(`${file}: class and file names differ`);
    }
    if (ts.isFunctionDeclaration(statement)) violations.push(`${file}: free function in application code`);
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = statement.moduleSpecifier.text;
    if (!moduleName.startsWith('.')) {
      if (layer === 'model' || layer === 'commands' || layer === 'app') violations.push(`${file}: external dependency ${moduleName}`);
      continue;
    }
    const target = path.relative(root, path.resolve(path.dirname(fullPath), moduleName));
    const targetLayer = target.split(path.sep)[0];
    if (allowed[layer] && !allowed[layer].has(targetLayer)) violations.push(`${file}: forbidden dependency on ${target}`);
    if (layer === 'commands' && targetLayer === 'app' && target !== path.join('app', 'EditorContext')) {
      violations.push(`${file}: commands may only depend on app/EditorContext`);
    }
    if (file === path.join('app', 'EditorContext.ts') && targetLayer === 'commands') {
      violations.push(`${file}: context must not depend on command implementations`);
    }
  }
  if (classes > 1) violations.push(`${file}: more than one class`);
  const inspect = node => {
    if (ts.isSwitchStatement(node)) violations.push(`${file}: review switch dispatch`);
    if (node.kind === ts.SyntaxKind.AnyKeyword) violations.push(`${file}: explicit any`);
    ts.forEachChild(node, inspect);
  };
  inspect(source);
}
if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else console.log(`Architecture check passed: ${files.length} TypeScript files; layer imports, class names, no free functions, no switch, no explicit any.`);
