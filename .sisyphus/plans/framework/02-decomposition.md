# 02-任务分解：原子化与契约化 (Decomposition & Contracts)

> **核心逻辑**: 将需求分解为可独立执行、可并行交付的原子任务单元。

## 1. 原子化准则 (Atomicity Rules)

一个合格的原子任务必须满足以下标准：

- **单一职责**: 仅解决一个核心逻辑块（如：一个 CRUD 路由，一个 UI 页面，一个工具函数集）。
- **短周期**: 理想情况下，串行执行时间在 30-60 分钟内。
- **可隔离**: 任务在执行时，不应依赖于同 Wave 内其他任务的中间态文件。
- **可验证**: 任务结束时，必须有明确的 `Acceptance Criteria` (AC) 和 `QA Scenarios`。

## 2. 契约化 (Contracting)

任务间的依赖通过 **契约 (Contract)** 锁定。契约是下游任务的输入，是上游任务的输出。

- **API 契约**: 定义端点、输入输出 DTO、HTTP 状态码。
- **类型契约 (TypeScript)**: 定义共享的 `interface`, `type`, `AppType` (Hono RPC)。
- **Schema 契约**: 数据库表结构、字段约束、迁移文件。
- **UI 契约**: 色值、间距、圆角、组件 Props、CSS 类名。

## 3. 分解工作流 (Workflow)

1. **确定 Wave 结构**: 
   - Wave 1: 基础设施、Schema、契约定义。
   - Wave 2: 核心后端逻辑、API 实现。
   - Wave 3: 前端 UI、交互逻辑。
   - Wave 4: 集成、系统测试、备份。
2. **定义依赖图 (Dependency Graph)**: 
   - 使用 Markdown 列表或 Mermaid 描述任务间的拓扑关系。
3. **分配分类与技能 (Categorization)**: 
   - 为每个任务分配 `Category` (Quick/Deep/Visual-Engineering 等)。
4. **生成任务文件**: 
   - 使用 [任务详单模板](./templates/task-template.md) 为每个任务生成详单。

## 4. 契约变动管理 (Contract Change Management)

- **禁止非正式变更**: 执行过程中若发现契约需调整，必须先更新 `decisions.md`。
- **向后兼容**: 尽量在不破坏现有契约的前提下进行扩展。
- **受影响范围通知**: 契约变更后，必须同步检查所有受该契约影响的任务（状态改为 `pending` 或重新评估）。

---
*分解不是简单的拆分，而是通过契约建立起一种确定性的并行协作机制。*
