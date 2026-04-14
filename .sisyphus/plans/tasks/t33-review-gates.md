# T33: 评审门禁规范 (Review Gates)

> **分类 (Category)**: Infrastructure  
> **状态 (Status)**: done  
> **优先级 (Priority)**: High

## 1. 任务背景 (Context)

- **核心目标 (Core Objective)**: 建立多层次的自动化与逻辑评审门禁，确保交付质量。
- **前置任务 (Dependencies)**: 
  - T32 (证据与记忆)

## 2. 完成定义 (Definition of Done, DoD)

- [x] 在 `06-review-gates.md` 中定义 4 种评审类型（Atomic, Logic, Design, Final）。
- [x] 在 `templates/review-report-template.md` 中包含 AC 覆盖度核验。
- [x] 定义 G1-G4 自动化门禁逻辑。
- [x] 提交一个评审报告示例。

## 3. 防错边界 (Guardrails)

- **Must HAVE**:
  - 强制要求评审报告包含 "证据核验" (Evidence Verification)。
  - 评审结果必须明确输出 PASS/FAIL/NEEDS_FIX。

## 4. 验证场景 (QA Scenarios)

### Scenario 1: 评审报告模板验证
- **工具 (Tools)**: Read (cat)
- **步骤 (Steps)**:
  1. 读取 `templates/review-report-template.md`。
- **预期结果 (Expected Results)**: 包含评审类型、状态、AC 覆盖度、详细发现、缺陷、设计偏离、证据核验和结论。
- **证据 (Evidence)**: `.sisyphus/evidence/task-33-report-check.txt`

## 5. 记忆记录 (Notepad Sync)

- **决策 (Decisions)**: 
  - 规定 `NEEDS_FIX` 允许并行，但必须在当前 Wave 完结前修复，以防技术债堆积。
- **学习 (Learnings)**: 
  - G4 安全扫描对 IDOR 的 WHERE 子句检查非常关键。

---
*执行此任务前，请先读取 `.sisyphus/plans/framework/03-execution-contracts.md`。*
