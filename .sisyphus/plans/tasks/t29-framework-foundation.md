# T29: 框架基础构建 (Framework Foundation)

> **分类 (Category)**: Infrastructure  
> **状态 (Status)**: done  
> **优先级 (Priority)**: High

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: 建立 AI Agent 协作框架的基础目录结构、核心规范文档以及首批热记忆实例文件。
- **契约依赖 (Contracts)**: 
  - 继承 `private-chef.md` 的 Wave 结构思维。
  - 使用 Markdown 规范。
- **前置任务 (Dependencies)**: 
  - 无 (Foundation Task)

## 2. 完成定义 (Definition of Done, DoD)

- [x] 创建 `.sisyphus/plans/agent-operating-framework.md` 索引文件。
- [x] 创建 `.sisyphus/plans/framework/00-07.md` 核心规范文件（中文）。
- [x] 创建 `.sisyphus/plans/framework/templates/*.md` 模板集。
- [x] 创建与 Hermes 风格一致的 `MEMORY` / `USER` / `Skills 索引` 模板。
- [x] 创建上下文装配规范，明确提示词固定顺序与缓存策略。
- [x] 落地 `.sisyphus/MEMORY.md`、`.sisyphus/USER.md`、`.sisyphus/skills-index.md`。
- [x] 规范文件内容包含：愿景、核心逻辑、DoD、Guardrails 和工作流。
- [x] 提交目录结构截图作为证据。

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - 必须使用中文编写，风格与现有 `private-chef.md` 一致。
  - 必须体现受 Hermes 类工作流启发的证据导向思维，但不得虚构特定实现细节。
  - 必须体现“提示词尽量不变，能缓存的都缓存，剩下的按需检索”的设计取向。
- **Must NOT HAVE**:
  - 禁止包含任何不可执行的脚本或代码。
  - 禁止使用占位符。

## 4. 验证场景 (QA Scenarios)

### Scenario 1: 目录完整性验证
- **工具 (Tools)**: Bash (ls -R)
- **步骤 (Steps)**:
  1. 运行 `ls -R .sisyphus/plans/framework/`
- **预期结果 (Expected Results)**: 包含 00-07 核心规范、模板集以及 `.sisyphus/MEMORY.md`、`.sisyphus/USER.md`、`.sisyphus/skills-index.md`。
- **证据 (Evidence)**: `.sisyphus/evidence/task-29-tree.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - 采用 Wave 7 作为框架引入的切入点，不破坏前 6 个 Wave 的逻辑。
- **学习 (Learnings)**: 
  - 发现现有任务系统缺乏统一的证据存储规范，在 04-evidence-policy.md 中进行了补强。

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
