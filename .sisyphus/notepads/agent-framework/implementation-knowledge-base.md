# 框架实现知识库 (Implementation Knowledge Base)

> **版本**: 1.0  
> **分类**: Framework  
> **日期**: 2026-04-13

## 1. 核心业务含义

- **Wave (波次)**: 任务的并行单元，一个 Wave 内的任务无互相依赖。
- **AC (Acceptance Criteria)**: 完成定义中的核心功能点。
- **Contract (契约)**: 跨任务共享的技术协议（API, Schema, Types）。
- **Guardrail (护栏)**: 执行任务时的强制性限制规则。
- **Evidence (证据)**: 物理证明文件，存放在 `.sisyphus/evidence/`。
- **Hot Memory (热记忆)**: 每轮都跟随提示词前缀进入上下文的小体量稳定事实。
- **Session Recall (情景回忆)**: 通过 `session_search` 检索“之前聊过什么”。
- **Skills Index (技能索引)**: 可复用工作流的轻量入口，而不是常驻全文。

## 2. 常用工具指南

### 2.1 证据收集工具
- **Bash (cat, curl)**: 用于捕获文本日志和 API 响应。
- **Playwright (browser_snapshot, take_screenshot)**: 用于捕获 UI 的交互状态。
- **LSP (lsp_diagnostics)**: 用于捕获静态检查报告。

### 2.2 记忆记录工具
- **Edit**: 增量更新 `.sisyphus/notepads/` 中的记忆条目。
- **Read/Grep**: 在开始任务前全文搜索 `notepads/` 目录以获取上下文。

### 2.3 Hermes 风格记忆操作
- **add**: 新增稳定且高命中的事实。
- **replace**: 用新事实替换旧事实，保持热记忆精简。
- **remove**: 删除低命中、过期或错误的条目。

## 3. 命名与目录规范

- **任务详单**: `.sisyphus/plans/tasks/t{N}-{name}.md`
- **证据文件**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- **评审报告**: `.sisyphus/evidence/reports/T{N}-report.md`
- **记忆条目**: `.sisyphus/notepads/agent-framework/{decisions|learnings|issues}.md`
- **热记忆模板**: `.sisyphus/plans/framework/templates/{MEMORY.template.md|USER.template.md}`
- **上下文顺序规范**: `.sisyphus/plans/framework/07-context-assembly.md`

## 4. 协作协议规范

- **协议文件**: `.sisyphus/plans/tasks/task-status.json`
- **状态流转**: `pending` -> `in_progress` -> `done`/`failed`
- **并发锁机制**: 每次开始新任务前必须先读取 `task-status.json` 并检查 `deps`。

## 5. Hermes 风格触发规则

- **问“项目长期约束是什么”** → 看 `MEMORY.md`
- **问“用户长期偏好是什么”** → 看 `USER.md`
- **问“我们之前讨论过哪个方案”** → 用 `session_search`
- **问“这类任务通常怎么做”** → 命中 Skills 索引再加载
- **问“这个用户在跨会话层面是什么类型的人”** → 视需要启用 Honcho
