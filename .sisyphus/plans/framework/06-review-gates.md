# 06-评审门禁：自动化与人工校验 (Review Gates)

> **核心逻辑**: 在任务交付前，通过多层次的自动化与逻辑校验，确保符合最高交付标准。

## 1. 评审分类 (Review Types)

| 评审类型 | 触发条件 | 执行者 | 重点校验 |
| :--- | :--- | :--- | :--- |
| **Atomic-Check** | 任务完结前 | 当前 Agent | `Acceptance Criteria`, `QA Scenarios` |
| **Logic-Review** | Wave 完成后 | `oracle` / `deep` | 业务逻辑、安全性、跨任务兼容性 |
| **Design-Review** | `visual-engineering` 任务完结 | `frontend-ui-ux` | Apple 风格、响应式、交互细腻度 |
| **Final-Review** | 全部 Wave 完结 | 全体协作窗口 + 用户 | 端到端集成、需求覆盖度、部署状态 |

## 2. 自动化门禁 (Automated Gates)

- **G1: Build Check**: `npm run build` 必须 0 错误（前端 + 后端）。
- **G2: Test Pass**: `vitest` 关键路径测试通过率必须 100%。
- **G3: LSP Clean**: `lsp_diagnostics` 在修改的文件及其依赖中不应有 Error。
- **G4: Security Scan**: 检查环境变量泄漏、IDOR 过滤（WHERE 子句）、SQL 注入防护（ORM 规范）。

## 3. 评审报告规范 (Reporting)

评审结果必须按照 [评审报告模板](./templates/review-report-template.md) 进行记录。

- **状态 (Status)**: `PASS` / `FAIL` / `NEEDS_FIX`。
- **发现 (Findings)**: 具体的代码行号、逻辑缺陷或样式偏离。
- **建议 (Recommendations)**: 如何修复或优化的具体建议。
- **证据引用 (References)**: 指向相关的证据文件路径。

## 4. 评审工作流 (Workflow)

1. **预评审 (Pre-review)**: 当前 Agent 自查，运行 `Atomic-Check`。
2. **正式评审 (Submission)**: 将任务状态改为 `done` 并提供证据。
3. **第三方校验 (Peer Review)**: 触发 `oracle` Agent 进行交叉审计。
4. **决策处理 (Verdict)**:
   - **PASS**: 依赖此任务的后续任务自动变为 `available`。
   - **FAIL**: 任务状态改为 `failed`，需修复并重新提交。
   - **NEEDS_FIX**: 允许后续任务并行，但必须在当前 Wave 完结前提交修复补丁。

---
*门禁不是为了阻拦，而是为了保证交付的确定性。*
