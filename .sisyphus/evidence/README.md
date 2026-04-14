# Evidence Index

本目录存放由 AI 执行并产出的可验证证据文件。

## 当前索引

### Wave 7 — Framework

- `task-29-tree.txt` — 框架目录、模板与热记忆文件存在性验证
- `task-30-brief-check.txt` — Intake brief 模板可用性验证
- `task-31-template-check.txt` — Task template 契约完整性验证
- `task-32-entry-check.txt` — Memory entry 模板与分层记忆决策验证
- `task-33-report-check.txt` — Review report 模板可用性验证
- `task-34-pilot-result.txt` — T34 试点执行结果

## 命名规则

- 统一格式：`task-{ID}-{scenario-slug}.{ext}`
- 一个场景一个文件，避免把多种验证混入同一文件

## 使用规则

- 证据必须由实际工具、文件状态或验证结果生成
- 没有证据，不应宣称任务完成
- 评审报告统一放在 `evidence/reports/`
