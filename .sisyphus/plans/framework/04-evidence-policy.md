# 04-证据政策：无证据不完结 (Evidence Policy)

> **核心逻辑**: 通过结构化的证据链路，建立任务执行的确定性。

## 1. 证据定义 (Evidence)

证据是 Agent 执行任务过程中产出的、可验证的实物证明。

- **运行日志 (Logs)**: `npm start`, `curl`, `bash` 命令的输出（特别是报错和成功的 HTTP 状态码）。
- **截图/视频 (Visuals)**: Playwright 截图、录屏。
- **报告 (Reports)**: `vitest` 报告、LSP 诊断结果 (`lsp_diagnostics`)、Lighthouse 评分。
- **返回值 (Payloads)**: API 的 Response Body (JSON)、数据库查询结果集。
- **构建物 (Artifacts)**: `dist/` 目录结构、生成的迁移 SQL 文件。

## 2. 证据存储规范 (Storage Policy)

- **路径**: 所有证据必须存储在 `.sisyphus/evidence/` 目录下。
- **命名规范**: `task-{ID}-{scenario-slug}.{ext}`
  - 例: `task-06-login-success.txt`
  - 例: `task-17-order-flow.png`
- **生命周期**: 证据随任务生命周期共存，项目结项前不应删除。

## 3. 证据收集工作流 (Workflow)

1. **预设场景 (Pre-scenarios)**: 任务详单中定义的 `QA Scenarios`。
2. **执行测试 (Execution)**: 使用适当的工具（Bash/Curl/Playwright/LSP）运行测试。
3. **捕获证据 (Capture)**: 
   - 使用 `Bash` 重定向输出到文件。
   - 使用 `Playwright` 截图并保存。
   - 使用 `Read` 读取关键文件的最终状态。
4. **验证有效性 (Verification)**: Agent 必须先自查证据是否包含 "Success"、"200 OK" 或 "Pass" 等关键字。
5. **提交证据 (Commitment)**: 将证据文件路径记录在任务进度汇报中。

## 4. 拒绝交付条件 (Rejection Criteria)

如果提交的证据存在以下问题，任务必须被标记为 `failed`：

- **空证据**: 证据文件不存在或为空。
- **无关证据**: 证据内容与任务目标不符（例如：前端任务只提供了后端日志）。
- **矛盾证据**: 证据中显示了明显的 "Error" 或 "Failure"，但 Agent 宣称任务已完成。
- **非机器生成**: 证据仅为 Agent 的文字描述，而非实际的工具输出。

---
*证据不是为了汇报，而是为了建立机器间的信任。*
