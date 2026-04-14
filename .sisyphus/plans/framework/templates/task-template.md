# T{N}: {任务名称} (Task Template)

> **分类 (Category)**: {Quick/Deep/Visual-Engineering/Infrastructure/Audit}  
> **状态 (Status)**: {pending/in_progress/done/failed}  
> **优先级 (Priority)**: {High/Medium/Low}

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: {用一句话描述任务的核心交付物}
- **契约依赖 (Contracts)**: 
  - {列出此任务依赖的前置契约：如 API 签名、表结构、UI 样式 token}
- **前置任务 (Dependencies)**: 
  - {T{X}, T{Y}}

## 2. 完成定义 (Definition of Done, DoD)

- [ ] {核心功能点 1}
- [ ] {核心功能点 2}
- [ ] {技术要求：如 Zod 校验, family_id 过滤}
- [ ] {通过 Lint/Typecheck/Build}
- [ ] {提交证据至 .sisyphus/evidence/}

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - {必须具备的逻辑，如：所有查询带 WHERE family_id = ?}
- **Must NOT HAVE**:
  - {禁止的行为，如：禁止硬编码密钥}

## 4. 验证场景 (QA Scenarios)

### Scenario 1: {场景名称}
- **工具 (Tools)**: {Bash/Curl/Playwright/LSP}
- **步骤 (Steps)**:
  1. {具体操作步骤 1}
  2. {具体操作步骤 2}
- **预期结果 (Expected Results)**: {具体的输出、状态码、字段值}
- **证据 (Evidence)**: `.sisyphus/evidence/task-{N}-{slug}.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - {任务执行中的重要决策}
- **学习 (Learnings)**: 
  - {踩过的坑、发现的隐性规则}
- **未决问题 (Issues)**: 
  - {本任务遗留的问题}

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
