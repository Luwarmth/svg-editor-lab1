# SVG CLI Editor — Lab1 Phase 1

使用 TypeScript、Command 和 Composite 实现的面向对象 SVG 命令行编辑器。

## 安装与运行

需要 Node.js 22 或以上版本，以及 npm。首次下载项目后：

```sh
npm ci
npm run cli
```

看到 `svg>` 后逐行输入命令。输入 `help` 查看完整语法。Windows 使用 Ctrl+Z 后按 Enter 结束输入，macOS/Linux 使用 Ctrl+D。

```text
init 800 600
create g node
create rect frame 100 100 160 60 #4a90d9 in node
create text label 130 135 "开始" in node
move node 20 0
undo
tree
save my-diagram.svg
```

将生成的 `.svg` 文件拖进浏览器即可预览。

## 示例与检查

```sh
npm run demo
npm run demo:session
npm run verify
npm run preview
```

- `demo`：回放 `examples/flowchart.commands`，保存 `examples/flowchart.svg`。
- `demo:session`：回放老师的完整示例，保存 `examples/demo.svg`；其中非法分组与保存后撤销的两条错误是刻意保留的验收场景。
- `verify`：严格类型检查、架构依赖检查和完整自动测试。
- `preview`：将流程图 SVG 本地渲染为 `doc/flowchart-preview.png`，便于检查中文和图形位置。
- 程序也支持 stdin 脚本输入；非交互输入不输出提示符，便于回放和比对。

当前内置 rect、circle、ellipse、line、text、g 六种类型。box 和插件系统属于后续阶段；任意 SVG 的完整兼容不在本阶段范围内。

架构方案、过程记录、一致性自查、质量保证与兼容边界见 [doc/README.md](doc/README.md)。老师的原始要求见 [phase_cli_1.md](phase_cli_1.md)。
