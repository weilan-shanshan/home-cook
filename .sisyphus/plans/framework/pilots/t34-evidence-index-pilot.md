# T34 Pilot — Evidence Index Rollout

## 1. Pilot Goal

使用新建立的 Hermes 风格上下文工程框架，完成一个真实但低风险的小任务：

> 为 `.sisyphus/evidence/` 建立索引说明文件，验证 Intake → Routing → Execution → Evidence → Review → Memory Sync 的闭环是否成立。

## 2. 为什么选这个任务

- 改动小，适合第一次试点
- 能直接验证证据政策是否可执行
- 能测试热记忆 / 会话检索 / Skills / 项目知识仓库的边界
- 能给后续 Wave 7 继续扩展提供低风险样板

## 3. Pilot Intake Summary

- **任务类型**: Quick / Documentation Infrastructure
- **事实类信息**: `.sisyphus/evidence/` 已存在多份验证文件，应形成可读索引
- **情景回忆**: 本轮不依赖历史对话检索
- **方法类信息**: 使用框架中的 evidence policy、review report template、memory entry template
- **用户画像相关**: 用户更关注“系统是否更聪明、更高效”，因此试点需强调方法闭环，而不只是补一个 README

## 4. Execution Steps

1. 建立 `.sisyphus/evidence/README.md`
2. 将已存在 evidence 文件按任务编号归类说明
3. 产出 pilot 评审报告
4. 回写 decisions / learnings / issues
5. 更新 T34 与 `task-status.json`

## 5. Expected Outputs

- `.sisyphus/evidence/README.md`
- `.sisyphus/evidence/task-34-pilot-result.txt`
- `.sisyphus/evidence/reports/T34-review.md`

## 6. Layer Decision

- **MEMORY.md**: 不新增；本次没有新增长期稳定项目事实
- **USER.md**: 不新增；用户偏好未发生新变化
- **session_search**: 不使用；本次不依赖历史情景回忆
- **Skills**: 不新增；本次试点不足以沉淀为通用流程 skill
- **notepads**: 需要，作为项目知识与试点结论沉淀

---
*该 pilot 用于验证框架闭环，而不是追求任务本身的复杂度。*
