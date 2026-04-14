# T31: 任务分解与契约规范 (Decomposition & Contracts)

> **分类 (Category)**: Infrastructure  
> **状态 (Status)**: done  
> **优先级 (Priority)**: High

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: 建立基于契约的任务分解机制，支持高并发开发。
- **前置任务 (Dependencies)**: 
  - T30 (需求摄入)

## 2. 完成定义 (Definition of Done, DoD)

- [x] 在 `02-decomposition.md` 中定义原子化准则。
- [x] 定义 API、类型、Schema 和 UI 契约的标准格式。
- [x] 在 `templates/task-template.md` 中包含契约依赖 (Contracts)。
- [x] 提交一个任务详单示例。

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - 明确 "禁止非正式契约变更" 的管理逻辑。
  - 任务详单必须包含 AC (Acceptance Criteria) 和 QA Scenarios。

## 4. 验证场景 (QA Scenarios)

### Scenario 1: 任务详单模板验证
- **工具 (Tools)**: Read (cat)
- **步骤 (Steps)**:
  1. 读取 `templates/task-template.md`。
- **预期结果 (Expected Results)**: 包含分类、状态、契约依赖、DoD、Guardrails 和 QA Scenarios。
- **证据 (Evidence)**: `.sisyphus/evidence/task-31-template-check.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - 在 T31 任务中将 "Contract Change Management" 列为强制执行点。
- **学习 (Learnings)**: 
  - 发现 API 契约必须在 Wave 1 的 schema 之后立即定义。

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
