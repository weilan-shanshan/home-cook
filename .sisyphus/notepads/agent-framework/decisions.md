# 框架决策记录 (Decisions)

> **版本**: 1.0  
> **分类**: Framework  
> **日期**: 2026-04-13

## D01: 采用 Wave 7 作为框架引入切入点
- **描述**: 在现有的 6 个开发 Wave 之后，新增 Wave 7 专门用于协作框架的构建与试点。
- **原因**: 避免干扰正在进行的 T01-T28 任务，确保开发环境的稳定性。
- **影响范围**: `plans/tasks/README.md`, `task-status.json`。

## D02: 协作框架文档强制中文化
- **描述**: 框架的核心规范 (00-06) 和模板全部采用中文。
- **原因**: 与项目现有 `private-chef.md` 及任务详单风格保持高度统一，降低 AI 在上下文切换时的理解偏差。
- **影响范围**: `.sisyphus/plans/framework/`。

## D03: 证据存储强制统一命名规范
- **描述**: 所有任务证据必须命名为 `task-{ID}-{scenario-slug}.{ext}` 并存放在 `.sisyphus/evidence/`。
- **原因**: 建立可自动索引和核验的证据链，支持未来的自动化评审 Agent。
- **影响范围**: `04-evidence-policy.md`, 任务详单模板。

## D04: 引入 4 个核心 Notepad 作为持久化记忆
- **描述**: 建立 `decisions.md`, `learnings.md`, `issues.md` 和 `implementation-knowledge-base.md`。
- **原因**: 解决多窗口并行开发导致的上下文断裂问题，将动态知识沉淀为持久化资产。
- **影响范围**: `.sisyphus/notepads/agent-framework/`。

## D05: 采用四层记忆架构而非单一 Notepad
- **描述**: 记忆分为 `MEMORY.md` / `USER.md` 热记忆、`session_search` 情景回忆、Skills 程序性记忆，以及可选的 Honcho 用户画像。
- **原因**: 不是所有记忆都适合进入固定提示词；分层后更利于缓存和按需检索。
- **影响范围**: `05-memory-loop.md`, `07-context-assembly.md`, 模板层。

## D06: 热记忆按字符数而非 token 数控制体量
- **描述**: `MEMORY.md` 和 `USER.md` 使用字符数上限进行管理，保持小而稳。
- **原因**: 更简单、模型无关、便于 `replace/remove` 操作。
- **影响范围**: `MEMORY.template.md`, `USER.template.md`, 记忆维护策略。

## D07: T34 选择 evidence index 作为第一轮 pilot
- **描述**: 首次试点任务选用 `.sisyphus/evidence/README.md` 索引建设，而不是直接挑复杂业务任务。
- **原因**: 目标是先验证框架闭环本身，而不是让业务复杂度掩盖框架问题。
- **影响范围**: `t34-framework-pilot.md`, `pilots/t34-evidence-index-pilot.md`, `evidence/README.md`。
