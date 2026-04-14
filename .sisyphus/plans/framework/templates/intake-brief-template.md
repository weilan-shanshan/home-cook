# {项目名称/功能点}: 需求简报 (Intake Brief)

> **版本**: 1.0  
> **摄入 Agent**: {Agent Name}  
> **摄入日期**: 202X-XX-XX

## 1. 业务愿景 (Vision)

用一句话描述此需求对用户的核心价值：
> {描述愿景：如：让家庭成员能够快速、安全地在手机上完成点餐，无需群聊沟通。}

## 2. 核心功能点 (Features)

- [ ] **功能 1**: {具体描述}
- [ ] **功能 2**: {具体描述}
- [ ] **功能 3**: {具体描述}

## 3. 技术约束与规范 (Constraints)

- **技术栈 (Stack)**: {React/Vite, Hono, SQLite, Drizzle}
- **安全性 (Security)**: {Session-based auth, family_id IDOR 隔离}
- **性能 (Performance)**: {PWA 离线支持, 图片直传 COS, 响应式设计}
- **设计风格 (UI/UX)**: {Apple 风格, 柔和阴影, 毛玻璃, #F5F5F7 背景}

## 4. 交付清单 (Deliverables)

- [ ] {核心 API 端点列表}
- [ ] {核心页面路由列表}
- [ ] {核心组件库定义}
- [ ] {相关 SQL 迁移文件}

## 5. 任务分解建议 (Decomposition)

| Wave | 任务编号 | 任务名称 | 分类 | 优先级 | 依赖项 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wave 1** | T01 | {任务名} | {Category} | {Priority} | {Deps} |
| **Wave 2** | T02 | {任务名} | {Category} | {Priority} | {Deps} |

## 6. 风险评估 (Risk Assessment)

- **风险 1**: {风险描述: 如 第三方库版本冲突} -> **对策**: {对策描述: 先在隔离环境验证版本}
- **风险 2**: {风险描述: API 定义不清晰} -> **对策**: {对策描述: 先输出 API 契约并评审}

---
*本简报由 Intake Agent 生成，分发任务前请确认其完整性。*
