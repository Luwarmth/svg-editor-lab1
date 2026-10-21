# Lab1 Phase 1：SVG CLI 编辑器

## 架构方案

### 工作方案与阶段验收

1. 工程与设计：初始化 TypeScript、严格类型检查和 Git；先写职责、依赖和验收边界。
2. 最小纵向流程：CLI → Command → 文档模型 → SVG 文件，浏览器能打开矩形。
3. 图形与编辑：六种类型、属性白名单、移动缩放删除、Command + 文档快照撤销。
4. 层级：创建时归属、分组/解组/迁移、同级顺序、循环检测与整棵子树恢复。
5. SVG 读写：XML 解析、缺 id 补全、往返保持、文件错误与历史屏障。
6. 验收交付：自动测试、典型会话、SVG 预览、依赖检查；更新文档，推送远端与最终 final tag。

每阶段单独提交，提交前至少通过该阶段相关验证。Git 提交身份及远程仓库地址由用户提供，不臆造作者身份；仅在完成验收、准备正式交付时打 final tag。

### 模块划分

| 目录 | 职责 |
| --- | --- |
| src/cli | 逐行输入、交互提示与展示 |
| src/commands | 参数分词、每类命令、命令注册表、编辑事务与历史 |
| src/model | 封装图形状态、图形多态、容器树、文档与工厂 |
| src/io | 文件接口与本地实现、SVG 编解码、XML 转义 |
| src/app | 文档会话、依赖装配和命令调用入口 |
| tests | 跨命令验收、模型边界、文件读写往返、真实进程测试 |

```plantuml
@startuml
package "src/cli" as cli {}
package "src/app" {
  component Editor
  component EditorContext
}
package "src/commands" as commands {}
package "src/model" as model {}
package "src/io" as io {}
cli --> Editor
Editor --> commands
Editor --> EditorContext
commands --> EditorContext
commands --> model
EditorContext --> model
EditorContext --> io
io --> model
@enduml
```

### 设计模式与落地

- Command：每条命令一个类，由注册表构造；编辑由历史管理器执行，查询不入栈，成功的文档 IO 设置历史屏障。
- Composite：Shape 为共同抽象，Group 内部持有 Shape 子节点；move/scale/set/delete 无须按标签判断具体图形。
- Memento：一条成功编辑保存前后文档快照。优先保障层级、顺序、属性及失败回滚的准确性；每次编辑耗时和历史内存约为 O(文档大小)。课程规模可接受，后续可替换为命令差量。
- Factory：只在 ShapeFactory 中按类型名选择具体图形类，读取和创建共享入口。
- IO 隔离：FileStore 接口隔离文件系统，测试可使用内存实现。

按名字分派仅允许 CommandRegistry（命令名）和 ShapeFactory（图形类型名）。这两处集中注册点标注为后续插件化阶段的待重构项，本阶段不提前构建插件系统。

### 依赖方向规则

- model 不依赖其他业务层、终端、文件系统或 XML 库。
- io 只依赖 model 和文件/XML 库；模型不负责序列化。
- commands 只使用 EditorContext、model 和 io，不接触终端或 Node 文件 API。
- app/EditorContext 为会话接口，不依赖命令；app/Editor 是装配和调用入口，可依赖 commands。
- cli 只依赖 app。main 为程序装配入口，可依赖 app、cli。
- tests 可依赖所有层。通过静态 import 检查脚本验证核心依赖方向。

### 变化点假设

| 变化点 | 本阶段安排 |
| --- | --- |
| 新图形类型 | Shape 多态与集中工厂注册；后续可改为 Provider 注册 |
| 新命令 | 独立 Command 子类与集中注册 |
| 图形界面或其他输入渠道 | 模型与命令不依赖终端，可复用 Editor 入口 |
| 文件存储位置 | FileStore 接口，当前仅本地文件 |
| 历史内存增长 | HistoryManager 集中快照策略，暂不做差量优化 |
| box 插件 | 不实现；保持普通 Group 递归组合能力 |

### 实现边界与解释

- group 的输入顺序不决定绘制顺序：选中节点按原文档深度优先顺序收入新组。跨父容器时新组放到第一个被选节点的原位置，其余节点迁入；该选择写入测试。
- front 移到兄弟数组末端（SVG 后画，视觉最前）；back 移到数组开头。
- 文档 IO 屏障清除旧历史并锁定 undo/redo；成功的新编辑解锁且开启新历史段。失败的 IO 不建立屏障。canvas 查询不建立屏障。
- CLI 仅整行以 # 开头为注释；颜色 #ffffff 正常解析。双引号支持空串、空格及转义的双引号、反斜杠。
- SVG 支持实验要求的六类图形及嵌套 g；不承诺任意 SVG 的完整兼容。未知标签、无法表达的坐标变换必须明确报错，避免静默破坏。
- 尺寸/半径非负，画布尺寸为正；坐标允许负值，数值必须有限。缩放不改变 stroke-width 或字体大小，因为实验定义缩放全部几何属性。
- read 支持 translate 与正数等比 scale，按 SVG 顺序归一化到几何坐标；导入变换另将描边宽度、虚线长度、文字字号换算为绝对数值，保持这些变换的外观。旋转、矩阵、非等比缩放和非默认 viewBox 明确拒绝。
- 导入保留常见字体/透明度/描边展示属性，但 CLI 的 set 仍严格限制在实验白名单。未知属性、CSS style、未知标签和嵌套 tspan 明确报错，不静默丢弃。分组关系变化后，样式按新的 SVG 父级继承。
- 快捷帮助允许在没有文档时使用。初次 init 后 save 无参数会提示提供路径；首次显式 save 成功后，后续 save 可复用该路径。

## 过程记录

### 2026-10-22：启动与方案

- 用户先要求解读实验，再制定工作计划，随后授权按方案推进。
- 检查目录后发现仅有老师的 phase_cli_1.md，无已有源码或 AGENTS.md。
- 选择面向对象的 Command + Composite，并用快照降低复杂层级撤销的恢复风险。
- AI 方案自查：不能把整个实验当成一次大提交；不能将 box 误纳入本阶段；文件 IO 失败不能提前清空历史。
- 实施顺序修订：先建立完整的模型多态与四个模型测试，再接通 CLI 纵向流程。原因是容器顺序和克隆属于所有命令共享的基础，先验证可减少后续返工；模块职责没有变化。
- GitHub 账户经连接工具核对为 Luwarmth；用户随后明确提供提交邮箱。首条方案提交使用 GitHub 隐私邮箱，后续提交使用用户指定邮箱。
- 用户要求协助创建远程仓库，已创建私有仓库 https://github.com/Luwarmth/svg-editor-lab1 并回读确认归属与私有状态。

### 2026-10-22：模型、命令与验证迭代

- 模型阶段先验证六类图形的多态移动/缩放、独立克隆、层级顺序、重复 id 和循环拒绝，四项测试通过后独立提交并推送。
- 分组边界推演：跨父容器时仅记新父级不足以撤销，需要恢复所有原父级与兄弟索引。采用完整文档快照，并用跨父级 group、删除子树和 addto 的前后状态对比验证恢复。
- 失败回滚验证：容器中第一个图形移动成功、后续图形发生浮点溢出时，操作可能部分生效。增加事务测试，确认整份文档回到命令前，历史记录也不改变。
- XML 实测发现 CDATA 被解析为嵌套节点，直接拼接会得到 [object Object]；改为递归提取文本。数字字符引用默认未解码，启用解析器解码并补充一次解码、未知实体及非法 Unicode 的边界检查。
- 文件覆盖写入采用同目录临时文件加重命名，避免写入失败时截断旧文件。Windows 沙箱临时目录的覆盖测试失败，提升到正常权限重测后通过；未将环境权限问题误判为代码缺陷。
- 抽查发现导入 scale 只缩放坐标会改变文字/描边的实际显示比例；补齐导入时的样式换算，同时保留 CLI scale 按实验定义只缩放几何的行为。
- 参数分词从原方案的 cli 移到 commands：Editor 可以直接接受命令字符串，终端输入与测试输入共用同一套解析；依赖规则相应更新，无反向依赖。
- 老师的典型会话改为可回放脚本，保留两个预期错误；另用真实子进程验证中文流程图的保存结果。
- 内置浏览器策略拒绝 file:// 本地文件导航，未绕过该限制。改用本地 resvg 渲染器检查 SVG，确认两块矩形、中文标签和连线位置正确；没有声称完成浏览器实测。

### 开发提交

阶段提交依次为架构方案、图形模型、SVG 读写、CLI 与历史管理、XML 边界修复、验收脚本和文档。可用 `git log --oneline --reverse` 查看实际记录。远程仓库为私有，老师查看时需要仓库访问权限。

## 一致性自查

1. 模块划分：实际采用 src/cli、src/commands、src/model、src/io、src/app，与修订方案一致。src/main.ts 仅装配启动；scripts 是开发工具，tests 是验收代码。
2. 依赖方向：`npm run check:architecture` 检查 46 个应用 TypeScript 文件，通过层间 import 检查。commands 对 app 只依赖 EditorContext；EditorContext 不反向依赖命令，避免会话层与命令实现形成循环。
3. 范式：应用代码一类一文件，类名与文件名一致；检查未发现自由函数、switch 或显式 any。几何字段与样式使用私有存储，由方法校验后修改。
4. 多态抽查：MoveCommand/ScaleCommand 调用 Shape.move/scale；Group 递归调用子节点同一接口。SvgCodec 通过通用属性/子节点接口序列化；导入交给 ShapeFactory，无按标签的图形行为分派。
5. 扩展点：按类型名和命令名的分派集中在 ShapeFactory、CommandRegistry；两处 TODO 已标注后续 Provider/注册式扩展，未实现本阶段不要求的 box 插件。
6. 修订记录：分词归属、实施顺序、跨父级分组位置、IO 历史段和 SVG 兼容范围均已在本文记录。静态脚本检查不能证明所有运行时设计质量，仍结合代码抽查和功能验收。

## 质量保证手段

2026-10-22 实际执行 `npm run verify`：严格类型检查通过，架构检查通过，Node 内置测试运行器 **28 项测试全部通过**。

| 验证范围 | 实际依据 |
| --- | --- |
| 六种图形与公共操作 | 模型多态、属性白名单、移动/缩放、独立克隆 |
| 分组与层级 | in、跨父级 group、ungroup、addto、前后顺序、循环拒绝 |
| 历史与事务 | 每命令一个单元、完整子树恢复、重做分叉、IO 屏障、溢出回滚 |
| 文件与 SVG | 缺 id 预留去重、七元素外部示例、读写失败、覆盖保存、XML 文本与字符引用、变换换算 |
| 真实 CLI | 两个子进程分别回放老师完整会话和中文流程图；检查生成文件的模型状态 |
| 人可见输出 | npm run demo / demo:session 成功；流程图用 resvg 输出 PNG 并实际查看 |
| 架构 | 静态 import、一类一文件、无应用层自由函数/switch/显式 any；结合人工抽查 |

![流程图输出的本地渲染预览](flowchart-preview.png)

## 运行、演示与提交检查

```sh
npm ci
npm run cli
npm run verify
npm run demo
npm run preview
```

主目录 README 提供启动说明。examples/flowchart.commands 可回放实验流程图，examples/session.commands 可回放典型会话；后者两条 error 是预期结果。

提交代码需保留分步历史，并将最终验收提交标记为 final 后与 main 一起推送。原始任务未给出截止时间，用户仍应核对课程平台的具体截止时间与老师访问仓库的方式。
