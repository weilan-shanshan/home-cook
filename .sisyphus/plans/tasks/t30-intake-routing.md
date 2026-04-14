# T30: 需求摄入与路由规范 (Intake & Routing)

> **分类 (Category)**: Infrastructure  
> **状态 (Status)**: done  
> **优先级 (Priority)**: Medium

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: 实现需求摄入（Intake）和路由（Routing）的结构化工作流，提升复杂需求的转化率。
- **前置任务 (Dependencies)**: 
  - T29 (框架基础)

## 2. 完成定义 (Definition of Done, DoD)

- [x] 细化 `01-intake-routing.md` 的工作流，包含路由规则。
- [x] 在 `templates/intake-brief-template.md` 中包含风险评估和交付清单。
- [x] 定义“事实 / 情景 / 方法 / 画像”的信息分流规则。
- [x] 提交一个示例需求简报作为证据。

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - 明确 "禁止路由模糊需求" 的红线条件。
  - 路由逻辑必须包含 "技能匹配" (Agent Skills)。
  - 路由逻辑必须说明何时写入热记忆，何时改走 `session_search`。

## 4. 验证场景 (QA Scenarios)

### Scenario 1: 需求简报模板可用性
- **工具 (Tools)**: Read (cat)
- **步骤 (Steps)**:
  1. 读取 `templates/intake-brief-template.md`。
- **预期结果 (Expected Results)**: 包含愿景、功能点、技术约束、交付清单、任务分解和风险评估。
- **证据 (Evidence)**: `.sisyphus/evidence/task-30-brief-check.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - 将 Intake Agent 作为一个虚拟角色，不要求实际实现脚本。
- **学习 (Learnings)**: 
  - 路由逻辑需要强调 "相似聚合" 以减少 Agent 的上下文切换成本。

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
