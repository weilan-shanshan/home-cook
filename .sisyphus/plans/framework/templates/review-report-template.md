# 评审报告 (Review Report): T{N}-{任务名称}

> **评审类型**: {Atomic-Check/Logic-Review/Design-Review/Final-Review}  
> **评审 Agent**: {Oracle/Deep/UI-UX}  
> **日期**: 202X-XX-XX  
> **状态**: {PASS/FAIL/NEEDS_FIX}

## 1. 任务背景与 AC 覆盖度 (AC Coverage)

| AC 编号 | 核心功能点 (AC Description) | 达成情况 (Result) | 备注 (Notes) |
| :--- | :--- | :--- | :--- |
| AC 01 | {核心功能点 1} | ✅ | {无问题 / 具体情况描述} |
| AC 02 | {核心功能点 2} | ❌ | {失败的具体原因：见 2.1} |
| AC 03 | {安全性：family_id 隔离} | ✅ | {已验证：见 证据引用} |

## 2. 详细发现 (Findings)

### 2.1 缺陷/问题 (Bugs / Logic Flaws)
- **描述**: {问题描述: 如 `GET /api/recipes/:id` 路由缺少 family_id 校验}
- **行号**: `backend/src/routes/recipes.ts:45`
- **等级**: {High/Medium/Low}
- **建议**: {修复建议: 使用 `c.get('familyId')` 进行过滤}

### 2.2 设计偏离 (Design Deviations)
- **描述**: {设计偏离: 如 卡片圆角使用了 rounded-md, 应为 rounded-2xl}
- **等级**: {Low}
- **建议**: {修复建议: 使用 tailwind 自定义类名 `rounded-card`}

## 3. 证据核验 (Evidence Verification)

| 证据文件名 | 校验结果 | 逻辑描述 |
| :--- | :--- | :--- |
| `task-N-success.txt` | ✅ | {已成功返回 200 OK，包含预期的 JSON 字段} |
| `task-N-error.txt` | ⚠️ | {捕获了 401 报错，符合预期的安全策略} |

## 4. 结论与建议 (Conclusion & Next Steps)

- **结论**: {PASS / FAIL / NEEDS_FIX}
- **后续动作**: 
  - [ ] {如果是 FAIL: 立即打回任务，Agent 重新执行}
  - [ ] {如果是 NEEDS_FIX: 生成修复任务 T{N}-FIX，允许进入 Wave 4}
  - [ ] {如果是 PASS: 触发依赖此任务的所有后续任务}

---
*评审报告由审计 Agent 自动生成，归档于 .sisyphus/evidence/reports/。*
