# AI Agent 协作框架 (Agent Operating Framework)

## 愿景与目标

> **核心使命**: 建立一套基于 Markdown 的、缓存友好的、证据导向的 AI 协作标准，提升复杂工程任务的规划、路由、执行、记忆与评审效率。

本框架受 Hermes 的上下文工程思路启发，重点不只是“多记录”，而是把信息按热度和用途分层，尽量维持提示词前缀稳定，让高频信息常驻、低频信息按需检索、可复用流程按技能加载，从而在多窗口、多 Agent 协作场景下兼顾质量、速度和缓存命中率。

## 目录结构

### 核心规范 (Core Framework)
- [00-宪章：协作准则与价值观](./framework/00-charter.md)
- [01-入口与路由：任务分发逻辑](./framework/01-intake-routing.md)
- [02-任务分解：原子化与契约化](./framework/02-decomposition.md)
- [03-执行契约：DoD 与 Guardrails](./framework/03-execution-contracts.md)
- [04-证据政策：无证据不完结](./framework/04-evidence-policy.md)
- [05-记忆循环：四层记忆与冷热分层](./framework/05-memory-loop.md)
- [06-评审门禁：自动化与人工校验](./framework/06-review-gates.md)
- [07-上下文装配：提示词顺序与缓存策略](./framework/07-context-assembly.md)

### 标准模板 (Templates)
- [任务详单模板](./framework/templates/task-template.md)
- [需求简报模板](./framework/templates/intake-brief-template.md)
- [评审报告模板](./framework/templates/review-report-template.md)
- [记忆条目模板](./framework/templates/memory-entry-template.md)
- [MEMORY 模板](./framework/templates/MEMORY.template.md)
- [USER 模板](./framework/templates/USER.template.md)
- [Skills 索引模板](./framework/templates/skills-index-template.md)

## 核心支柱

1. **证据驱动 (Evidence-First)**: 所有任务必须提供可验证的证据（日志、截图、测试结果），严禁凭空宣布完成。
2. **契约化分解 (Contractual Decomposition)**: 任务边界通过输入输出契约锁定，确保并行开发时的兼容性。
3. **分层记忆 (Layered Memory)**: 高频事实进入 `MEMORY.md` / `USER.md`，情景回忆走 `session_search`，方法论沉淀为 Skills，可选画像交给 Honcho。
4. **缓存优先 (Cache-First Prompting)**: 越常用的信息越固定、越靠前；越偶发的信息越晚装配、按需检索。
5. **门禁控制 (Gatekeeping)**: 关键节点设立强制门禁，未通过验证不进入下一阶段。

---

## 快速开始

1. **发起任务**: 使用 [需求简报模板](./framework/templates/intake-brief-template.md) 定义目标。
2. **装配上下文**: 按 [07-上下文装配](./framework/07-context-assembly.md) 固定前缀和记忆层次。
3. **任务分解**: 按 [02-任务分解](./framework/02-decomposition.md) 拆分为 T 任务。
4. **执行与记录**: 遵循 [03-执行契约](./framework/03-execution-contracts.md)，并按 [05-记忆循环](./framework/05-memory-loop.md) 选择写入热记忆、会话检索或技能索引。
5. **验证与关闭**: 按 [06-评审门禁](./framework/06-review-gates.md) 提交证据并关闭任务。

## Hermes 风格落地要点

### 1. 四层记忆，不混存

- **热记忆**: `MEMORY.md` / `USER.md`，只存最稳定、最常用、最值得常驻提示词的事实。
- **会话检索**: `session_search`，处理“我们之前聊过什么”的情景回忆，不污染热记忆。
- **Skills**: 复用型工作流和套路，不把全文塞进提示词，只放轻量索引，真正用到时再加载。
- **Honcho（可选）**: 跨会话用户画像，只有在确实提升质量时才启用。

### 2. 缓存优先，不追求一次性塞满

- 需要每轮都用的信息，尽量前置并保持稳定。
- 体量大但低频的信息，不进固定提示词。
- 临时状态、任务进度、某次对话结果，不进入 `MEMORY.md` / `USER.md`。

### 3. 写入以字符数为边界，而非 token

- `MEMORY.md` 采用小体量、纯文本、便于替换的结构。
- `USER.md` 只保留用户偏好、沟通风格、身份与长期稳定约束。
- 对热记忆的管理应优先使用 `add / replace / remove` 思路，而不是不断追加日志。

---
*本框架为当前仓库的协作操作层，后续可在试点执行中持续迭代。*
