# 记忆条目 (Memory Entry): {分类} - {简短名称}

> **分类 (Category)**: {Decision/Learning/Issue/Implementation}  
> **状态 (Status)**: {Open/Closed/Deprecated}  
> **日期**: 202X-XX-XX  
> **记录者**: {Agent Name}

## 1. 背景描述 (Background)

- **情境 (Context)**: {任务执行中的情境：如 在执行 T06 认证系统开发时}
- **挑战 (Challenge)**: {遇到的问题或决策点：如 Lucia v3 文档不匹配，适配器配置失败}

## 2. 核心内容 (Core)

### {Decision: 决策描述 / Learning: 学习收获 / Issue: 问题描述}

- **原方案 (Original Proposal)**: {如果有：原来的方案或做法}
- **新方案 (New Solution / Outcome)**: {采取的新方案或学习到的知识点：如 使用 better-sqlite3 适配器，显式指定 tableNames}
- **原因 (Reasoning/Why)**: {逻辑依据：如 为了解决 `table names not found` 的错误，必须手动注入表名}

## 3. 业务影响与操作指南 (Impact & Action)

- **影响范围 (Affected Scope)**: {所有受影响的文件或任务：如 `backend/src/lib/auth.ts`, T15, T19}
- **操作指南 (Instructions)**: {给后续 Agent 的操作说明：如 如果你需要在其他地方引入认证，请使用 `lucia` 对象而非 `new Lucia()`}

## 4. 相关引用 (References)

- **文件 (Files)**: {相关文件路径: `backend/src/db/schema.ts`}
- **证据 (Evidence)**: {相关证据路径: `.sisyphus/evidence/task-06-auth-init.txt`}
- **任务 (Tasks)**: {相关任务 ID: T06}

## 5. 记忆分层决策 (Layer Decision)

- **应进入哪一层**: {MEMORY.md / USER.md / session_search / Skills / notepads}
- **为什么是这一层**: {这是长期事实 / 用户偏好 / 情景回忆 / 可复用流程 / 项目知识}
- **是否需要热记忆预算检查**: {Yes/No}

---
*记忆条目由 Agent 在执行任务时动态生成，通过 `Edit` 写入对应的 Notepad。*
