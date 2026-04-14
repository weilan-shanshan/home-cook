# T32: 证据政策与记忆循环 (Evidence & Memory)

> **分类 (Category)**: Infrastructure  
> **状态 (Status)**: done  
> **优先级 (Priority)**: High

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: 建立证据驱动的交付和闭环的记忆机制。
- **前置任务 (Dependencies)**: 
  - T31 (任务分解)

## 2. 完成定义 (Definition of Done, DoD)

- [x] 在 `04-evidence-policy.md` 中定义具体的证据采集工具（Bash, Curl, Playwright, LSP）。
- [x] 在 `05-memory-loop.md` 中定义四层记忆模型及项目侧 Notepad 的职责。
- [x] 在 `templates/memory-entry-template.md` 中包含分类、背景和影响。
- [x] 创建 `.sisyphus/notepads/agent-framework/` 及其核心 Notepad。
- [x] 明确 `MEMORY.md` / `USER.md` 的字符上限、写入边界与 `add/replace/remove` 语义。

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - 强制要求每条记忆条目包含 "Reasoning/Why"。
  - 证据存储必须遵循统一命名规则。
  - 必须区分“持久事实”和“情景回忆”，禁止把会话日志直接写进热记忆。

## 4. 验证场景 (QA Scenarios)

### Scenario 1: 记忆条目模板验证
- **工具 (Tools)**: Read (cat)
- **步骤 (Steps)**:
  1. 读取 `templates/memory-entry-template.md`。
- **预期结果 (Expected Results)**: 包含分类、状态、背景、挑战、决策、原因和影响范围。
- **证据 (Evidence)**: `.sisyphus/evidence/task-32-entry-check.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - 为框架引入专门的 `implementation-knowledge-base.md`，减少对通用文档的修改频率。
- **学习 (Learnings)**: 
  - 证据文件名包含 `scenario-slug` 有利于快速定位问题。

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
