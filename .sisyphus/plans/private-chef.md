# 私厨 — 家庭烹饪管理 PWA 开发工作计划

## TL;DR

> **Quick Summary**: 将私厨 PWA 技术方案拆分为 20+ 个可并行执行的开发任务，按 5 个 Wave 组织，最大化 AI agent 并行吞吐。前后端共享类型契约，所有路由强制 familyId 鉴权。
> 
> **Deliverables**:
> - 完整的前端 PWA 应用（React + Vite + shadcn/ui）
> - 完整的后端 API 服务（Hono + SQLite + Drizzle）
> - 企微 Webhook 通知集成
> - 服务器部署（PM2 + Cloudflare Tunnel）
> - Cloudflare Pages 前端部署配置
> - SQLite 自动备份到 COS
> - 关键路径自动化测试（认证、点餐）
> 
> **Estimated Effort**: Large（5-6 天顺序开发，并行可压至 2-3 天）
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 2/3 → Task 6 → Task 10 → Task 17 → Final Verification

---

## Context

### Original Request
将已定稿的私厨技术方案拆分成多个可独立执行的并行任务，目标是让多个 AI agent 并行开发缩短时间。

### Interview Summary
**Key Discussions**:
- 范围: 开发 + 部署全包（所有 AI 可做的任务）
- 测试: 关键路径写测试（认证、点餐核心流程），使用 vitest
- 技术方案已完全定稿，无需调整技术选型

**Technical Spec Reference**: `私厨-技术方案.md`（841行，包含完整的架构设计、数据模型、API、页面结构、部署方案）

### Metis Review
**Identified Gaps** (addressed):
1. **Bootstrap 注册流程模糊** → 明确：第一个注册的用户自动创建家庭成为 admin，后续用户通过邀请码加入
2. **"Apple 风 UI" 范围不清** → 锁定为 5 个具体 CSS 干预点：系统字体栈、大圆角(rounded-2xl)、柔和阴影(shadow-sm~xl)、毛玻璃(backdrop-blur + @supports降级)、纯色底(#F5F5F7)
3. **缺少前后端共享类型契约** → Wave 1 的脚手架任务必须导出 Hono RPC `AppType`，所有前端 API 调用基于此类型
4. **Lucia v3 可能已废弃** → 脚手架阶段验证，若废弃则使用手动 session 管理（better-sqlite3 + argon2 + crypto.randomUUID）
5. **IDOR 漏洞风险** → 每个路由任务的 guardrail：所有数据查询必须 WHERE family_id = 当前用户的 familyId
6. **Recipe 删除级联危险** → order_items 的 recipe_id 外键改为 ON DELETE RESTRICT，防止有活跃订单时删菜谱

---

## Agent 协作框架 (Operating Framework)

> **重要**: 本项目已启用 [AI Agent 协作框架](./agent-operating-framework.md)。后续所有 Wave 7 及以后的任务执行、证据提交、记忆记录必须严格遵循该框架规范。

---

## Work Objectives

### Core Objective
构建一个家庭（5-10人）私人菜谱管理与点餐 PWA，包含完整的前后端代码和部署基础设施。

### Concrete Deliverables
- `frontend/` - React PWA 前端应用（13 个页面组件 + shadcn/ui 组件库）
- `backend/` - Hono REST API 后端（10 个路由模块 + 认证中间件 + Drizzle ORM）
- `backend/scripts/backup.sh` - SQLite 自动备份脚本
- `.env.example` - 环境变量模板
- Cloudflare Pages 部署配置
- PM2 + Cloudflare Tunnel 后端部署配置

### Definition of Done
- [ ] `cd backend && npm run build` 编译成功无报错
- [ ] `cd frontend && npm run build` 编译成功无报错
- [ ] `cd backend && npx vitest run` 关键路径测试全部通过
- [ ] 后端启动后 `curl http://localhost:3000/api/auth/me` 返回 401
- [ ] 前端构建产物包含 `manifest.webmanifest` 和 Service Worker

### Must Have
- 所有 SQL 查询使用参数化（better-sqlite3 天然支持）
- 所有密钥/Webhook URL 放 `.env`，不硬编码
- 图片上传使用 COS 预签名 URL 直传，不经后端
- 所有非公开路由经认证中间件保护
- 所有数据查询带 `WHERE family_id = ?` 防止 IDOR
- SQLite 初始化配置：WAL + busy_timeout=5000 + foreign_keys=ON
- 毛玻璃 CSS 使用 `@supports` 降级

### Must NOT Have (Guardrails)
- 不使用 `as any`、`@ts-ignore`、`@ts-expect-error`
- 不使用 `CREATE TABLE IF NOT EXISTS` 内联建表（用 Drizzle 迁移）
- 不使用 Base64 编码上传图片
- 不在 `localStorage` 存认证 token（用 HttpOnly Cookie）
- 不对 sticky 全宽元素加 `backdrop-filter: blur()`（严重卡顿）
- 不创建 `URL.createObjectURL()` 后忘记 `revokeObjectURL()`
- 不在循环中查询数据库（N+1 问题）
- 不包含二期功能（家庭广场、AI 许愿、分享卡片）
- 不做离线功能

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield, 需在脚手架阶段设置)
- **Automated tests**: YES (关键路径 - 认证注册/登录/登出、点餐创建/状态流转)
- **Framework**: vitest（前后端统一，与 Vite 生态匹配）
- **Approach**: Tests-after（先实现，后补关键路径测试）

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright - Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Library/Module**: Use Bash (node/npx) - Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation, 全部独立可并行):
├── Task 1: 项目脚手架 — monorepo 结构 + 所有配置文件 [quick]
├── Task 2: Drizzle schema + 迁移文件 [quick]
├── Task 3: shadcn/ui 组件库初始化 + Apple 风全局样式 [visual-engineering]
├── Task 4: 环境变量 + COS 预签名工具 [quick]
├── Task 5: 企微 Webhook 推送模块 [quick]

Wave 2 (After Wave 1 — 核心后端模块, 最大并行):
├── Task 6: 认证系统 — Lucia v3 + 注册/登录/登出 + 中间件 (depends: 1,2) [deep]
├── Task 7: 菜谱 CRUD 路由 (depends: 1,2) [unspecified-high]
├── Task 8: 标签系统路由 (depends: 1,2) [quick]
├── Task 9: 图片上传路由 — COS 预签名 (depends: 1,2,4) [quick]
├── Task 10: 点餐系统路由 (depends: 1,2) [unspecified-high]
├── Task 11: 许愿菜单路由 (depends: 1,2) [quick]
├── Task 12: 收藏路由 (depends: 1,2) [quick]
├── Task 13: 烹饪日志 + 评分路由 (depends: 1,2) [unspecified-high]
├── Task 14: 家庭管理路由 (depends: 1,2) [quick]

Wave 3 (After Wave 2 — 前端页面, 最大并行):
├── Task 15: 前端认证页面 — 登录/注册 (depends: 3,6) [visual-engineering]
├── Task 16: 前端菜谱页面 — 列表+详情+表单 (depends: 3,7,8,9) [visual-engineering]
├── Task 17: 前端点餐页面 — 点餐创建+列表 (depends: 3,10) [visual-engineering]
├── Task 18: 前端许愿+收藏+日志页面 (depends: 3,11,12,13) [visual-engineering]
├── Task 19: 前端个人中心+家庭管理页面 (depends: 3,6,14) [visual-engineering]
├── Task 20: 前端布局+路由+TabBar (depends: 3,6) [visual-engineering]

Wave 4 (After Wave 3 — 集成 + 部署):
├── Task 21: 后端 Hono 入口集成 + 通知触发 (depends: 5,6,7,8,9,10,11,12,13,14) [unspecified-high]
├── Task 22: PWA 配置 — manifest + Service Worker (depends: 1) [quick]
├── Task 23: 关键路径测试 — 认证+点餐 (depends: 6,10) [deep]
├── Task 24: 备份脚本 (depends: 4) [quick]

Wave 5 (After Wave 4 — 部署上线):
├── Task 25: 后端部署 — PM2 + Cloudflare Tunnel 配置 (depends: 21) [unspecified-high]
├── Task 26: 前端部署 — Cloudflare Pages 配置 (depends: 20,21) [quick]

Wave 7 (协作框架基础):
├── Task 29: 框架基础构建 [Infrastructure]
├── Task 30: 需求摄入路由规范 [Infrastructure]
├── Task 31: 任务分解契约规范 [Infrastructure]
├── Task 32: 证据与记忆循环 [Infrastructure]
├── Task 33: 评审门禁规范 [Infrastructure]
└── Task 34: 框架试点应用 [Audit]

Wave FINAL (After ALL — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: T1 → T2 → T6 → T10 → T17 → T21 → T25 → F1-F4 → user okay
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 9 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 2-26 | 1 |
| 2 | - | 6-14 | 1 |
| 3 | - | 15-20 | 1 |
| 4 | - | 9, 24 | 1 |
| 5 | - | 21 | 1 |
| 6 | 1, 2 | 15, 19, 20, 21, 23 | 2 |
| 7 | 1, 2 | 16, 21 | 2 |
| 8 | 1, 2 | 16, 21 | 2 |
| 9 | 1, 2, 4 | 16, 21 | 2 |
| 10 | 1, 2 | 17, 21, 23 | 2 |
| 11 | 1, 2 | 18, 21 | 2 |
| 12 | 1, 2 | 18, 21 | 2 |
| 13 | 1, 2 | 18, 21 | 2 |
| 14 | 1, 2 | 19, 21 | 2 |
| 15 | 3, 6 | - | 3 |
| 16 | 3, 7, 8, 9 | - | 3 |
| 17 | 3, 10 | - | 3 |
| 18 | 3, 11, 12, 13 | - | 3 |
| 19 | 3, 6, 14 | - | 3 |
| 20 | 3, 6 | 26 | 3 |
| 21 | 5, 6-14 | 25, 26 | 4 |
| 22 | 1 | - | 4 |
| 23 | 6, 10 | - | 4 |
| 24 | 4 | - | 4 |
| 25 | 21 | - | 5 |
| 26 | 20, 21 | - | 5 |

### Agent Dispatch Summary

- **Wave 1**: **5 tasks** — T1 → `quick`, T2 → `quick`, T3 → `visual-engineering`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **9 tasks** — T6 → `deep`, T7 → `unspecified-high`, T8 → `quick`, T9 → `quick`, T10 → `unspecified-high`, T11 → `quick`, T12 → `quick`, T13 → `unspecified-high`, T14 → `quick`
- **Wave 3**: **6 tasks** — T15-T20 → `visual-engineering`
- **Wave 4**: **4 tasks** — T21 → `unspecified-high`, T22 → `quick`, T23 → `deep`, T24 → `quick`
- **Wave 5**: **2 tasks** — T25 → `unspecified-high`, T26 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. 项目脚手架 — monorepo 结构 + 所有配置文件

  **What to do**:
  - 创建顶层 `private-chef/` 项目结构，包含 `frontend/` 和 `backend/` 两个子项目
  - **前端初始化**: `npm create vite@latest frontend -- --template react-ts`，安装依赖：react-router@7, @tanstack/react-query@5, tailwindcss@3, autoprefixer, postcss, clsx, tailwind-merge, browser-image-compression
  - **后端初始化**: `npm init -y` in backend/，安装依赖：hono@4, @hono/node-server@1, better-sqlite3@9, drizzle-orm@0.30, lucia@3, @lucia-auth/adapter-sqlite@3, @node-rs/argon2@1, cos-nodejs-sdk-v5, zod@3。devDependencies：typescript, @types/better-sqlite3, drizzle-kit, vitest, tsx
  - 配置 `frontend/vite.config.ts`（React plugin + proxy /api to backend:3000）
  - 配置 `frontend/tailwind.config.ts`（content paths 指向 src/）
  - 配置 `frontend/tsconfig.json`（path aliases: @/ → src/）
  - 配置 `backend/tsconfig.json`（target: ES2022, module: ESNext, strict: true）
  - 配置 `backend/drizzle.config.ts`（SQLite driver, schema 指向 src/db/schema.ts）
  - 创建 `backend/src/index.ts` 最小 Hono 入口（导出 `AppType` 用于前端 RPC 类型推导）
  - 创建 `frontend/src/lib/api.ts` — Hono RPC 客户端，import `AppType` 从后端
  - 配置 `backend/package.json` scripts: `dev`, `build`, `db:generate`, `db:migrate`
  - 配置 `frontend/package.json` scripts: `dev`, `build`, `preview`
  - 创建 `.env.example` 环境变量模板（参照技术方案十五节）
  - 创建 `.gitignore`（node_modules, dist, .env, *.db, data/）
  - **Lucia v3 验证**：检查 `lucia@3` 是否可用。若已废弃，则改用手动 session 方案（better-sqlite3 存 session + argon2 哈希 + crypto.randomUUID 生成 session ID），并在 `backend/src/lib/auth.ts` 中封装
  - **关键**：后端 `index.ts` 必须通过 `.route()` 链式挂载路由并 `export type AppType = typeof app`，前端通过 `hc<AppType>` 获得类型安全客户端

  **Must NOT do**:
  - 不安装二期才需要的任何依赖
  - 不在 package.json 中添加 `"type": "module"` 之外的非标准字段
  - 不使用 monorepo 工具（turborepo/lerna 等），保持简单的两个独立 package.json

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯配置文件和脚手架，无复杂业务逻辑，但文件数量多
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 脚手架不涉及 UI 实现

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1，与 T2-T5 并行)
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: T2-T26 (所有后续任务)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 428-491 行 — 完整的目录结构定义
  - `私厨-技术方案.md` 第 99-127 行 — 前后端技术栈和版本号
  - `私厨-技术方案.md` 第 815-840 行 — `.env.example` 环境变量模板

  **External References**:
  - Hono RPC 类型安全客户端文档: https://hono.dev/docs/guides/rpc
  - Drizzle ORM SQLite 快速开始: https://orm.drizzle.team/docs/get-started-sqlite
  - Lucia v3 文档: https://lucia-auth.com/ — 若 404 或废弃，回退手动 session 方案

  **WHY Each Reference Matters**:
  - 目录结构定义确保脚手架与后续任务的文件路径预期一致
  - 技术栈版本号确保安装正确版本，避免 breaking changes
  - Hono RPC 是前后端类型共享的关键，必须在脚手架阶段正确设置

  **Acceptance Criteria**:

  - [ ] `cd frontend && npm run build` 成功产出 `dist/index.html`
  - [ ] `cd backend && npx tsc --noEmit` 无错误
  - [ ] `backend/src/index.ts` 导出 `AppType` 类型
  - [ ] `frontend/src/lib/api.ts` 可以 import `AppType`（类型检查通过）
  - [ ] `.env.example` 包含技术方案中所有环境变量

  **QA Scenarios**:

  ```
  Scenario: Backend Hono server starts and responds
    Tool: Bash (curl)
    Preconditions: backend dependencies installed, .env configured with defaults
    Steps:
      1. cd backend && npx tsx src/index.ts & (background, wait 3s)
      2. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
      3. kill the background process
    Expected Result: HTTP status 200 or 404 (server is running, route may not exist yet)
    Failure Indicators: Connection refused, process crash, port already in use
    Evidence: .sisyphus/evidence/task-1-backend-starts.txt

  Scenario: Frontend builds successfully with Vite
    Tool: Bash
    Preconditions: frontend dependencies installed
    Steps:
      1. cd frontend && npm run build
      2. ls dist/index.html
      3. Check dist/assets/ contains .js and .css files
    Expected Result: dist/index.html exists, assets directory has bundled files
    Failure Indicators: Build error, missing output files
    Evidence: .sisyphus/evidence/task-1-frontend-builds.txt

  Scenario: TypeScript strict mode catches errors
    Tool: Bash
    Preconditions: both tsconfig.json configured with strict: true
    Steps:
      1. cd backend && npx tsc --noEmit
      2. cd frontend && npx tsc --noEmit
    Expected Result: Zero type errors in both projects
    Failure Indicators: Any TS error output
    Evidence: .sisyphus/evidence/task-1-typecheck.txt
  ```

  **Commit**: YES
  - Message: `chore: init monorepo scaffolding with frontend and backend`
  - Files: all config files, package.json, tsconfig.json, vite.config.ts, etc.
  - Pre-commit: `cd frontend && npm run build && cd ../backend && npx tsc --noEmit`

- [ ] 2. Drizzle Schema + 迁移文件

  **What to do**:
  - 在 `backend/src/db/schema.ts` 中使用 Drizzle ORM 定义所有 13 张表（完全匹配技术方案第五节的 SQL 定义）:
    - `users` — id, username (unique), display_name, password_hash, role (admin/member), created_at
    - `families` — id, name, invite_code (unique), created_by (FK→users), created_at
    - `family_members` — family_id + user_id 联合主键, joined_at
    - `recipes` — id, family_id (FK), title, description, steps (JSON text), cook_minutes, servings, created_by (FK), created_at, updated_at
    - `recipe_images` — id, recipe_id (FK, CASCADE), url, thumb_url, sort_order, created_at
    - `tags` — id, family_id (FK), name, UNIQUE(family_id, name)
    - `recipe_tags` — recipe_id + tag_id 联合主键 (both CASCADE)
    - `cook_logs` — id, recipe_id (FK), cooked_by (FK), cooked_at, note
    - `ratings` — id, cook_log_id (FK, CASCADE), user_id (FK), score (1-5 CHECK), comment, created_at, UNIQUE(cook_log_id, user_id)
    - `wishes` — id, family_id (FK), user_id (FK), dish_name, note, status (pending/fulfilled/cancelled), recipe_id (FK nullable), created_at
    - `orders` — id, family_id (FK), user_id (FK), meal_type, meal_date, note, status (pending/confirmed/completed), created_at
    - `order_items` — id, order_id (FK, CASCADE), recipe_id (FK, **RESTRICT** 非 CASCADE), quantity
    - `favorites` — user_id + recipe_id 联合主键 (recipe CASCADE), created_at
    - `sessions` — id (TEXT PK), user_id (FK, CASCADE), expires_at (INTEGER)
  - **关键修正**: `order_items.recipe_id` 外键使用 `ON DELETE RESTRICT`（非 CASCADE），防止有活跃订单时删菜谱
  - 创建 `backend/src/db/index.ts` — DB 连接 + SQLite pragma 初始化（WAL, busy_timeout=5000, synchronous=NORMAL, foreign_keys=ON, cache_size=-8000）
  - 运行 `npx drizzle-kit generate` 生成迁移文件到 `backend/drizzle/` 目录
  - 创建 `backend/src/db/seed.ts` — 可选的种子数据脚本（创建测试用家庭 + 用户）
  - 导出所有表的 TypeScript 推导类型：`type User = typeof users.$inferSelect`

  **Must NOT do**:
  - 不使用 `CREATE TABLE IF NOT EXISTS` 内联建表
  - 不在 schema 中定义任何二期功能的表
  - `order_items.recipe_id` 不使用 CASCADE（必须 RESTRICT）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯数据定义，表结构已完全确定，无设计决策
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with T1, T3, T4, T5)
  - **Blocks**: T6-T14 (所有后端路由)
  - **Blocked By**: None (can start immediately, 但需要 T1 的 backend/package.json 已存在才能 npm install)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 145-278 行 — 完整 SQL DDL 定义（13张表）
  - `私厨-技术方案.md` 第 280-289 行 — SQLite 初始化 pragma 配置

  **External References**:
  - Drizzle ORM SQLite schema 定义: https://orm.drizzle.team/docs/column-types/sqlite
  - Drizzle 迁移: https://orm.drizzle.team/docs/migrations

  **WHY Each Reference Matters**:
  - SQL DDL 是表结构的权威来源，Drizzle schema 必须 1:1 映射
  - pragma 配置决定 SQLite 性能和并发安全

  **Acceptance Criteria**:

  - [ ] `backend/src/db/schema.ts` 定义 13+1(sessions) 张表
  - [ ] `npx drizzle-kit generate` 成功生成迁移 SQL 文件
  - [ ] `order_items.recipe_id` 外键为 RESTRICT（非 CASCADE）
  - [ ] `ratings` 表有 CHECK(score >= 1 AND score <= 5) 约束
  - [ ] DB index.ts 包含全部 5 个 pragma 设置

  **QA Scenarios**:

  ```
  Scenario: Database initializes with all tables
    Tool: Bash
    Preconditions: backend installed, no existing .db file
    Steps:
      1. cd backend && npx tsx -e "import './src/db'; console.log('DB init ok')"
      2. sqlite3 data/private-chef.db ".tables"
      3. Count table names in output
    Expected Result: 14 tables listed (13 business + sessions)
    Failure Indicators: Missing tables, pragma errors, file permission issues
    Evidence: .sisyphus/evidence/task-2-db-init.txt

  Scenario: Foreign key RESTRICT prevents recipe deletion with active orders
    Tool: Bash
    Preconditions: DB initialized with seed data (family, user, recipe, order with order_item)
    Steps:
      1. Insert test data: family → user → recipe → order → order_item
      2. Attempt DELETE FROM recipes WHERE id = ?
      3. Expect FOREIGN KEY constraint error
    Expected Result: SQLite FOREIGN KEY constraint failed error
    Failure Indicators: Recipe deleted successfully (CASCADE leak)
    Evidence: .sisyphus/evidence/task-2-fk-restrict.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add Drizzle schema and migrations for 13 tables`
  - Files: backend/src/db/schema.ts, backend/src/db/index.ts, backend/drizzle/*
  - Pre-commit: `cd backend && npx tsc --noEmit`

- [ ] 3. shadcn/ui 组件库初始化 + Apple 风全局样式

  **What to do**:
  - 运行 `npx shadcn-ui@latest init` 初始化 shadcn/ui（选择 TypeScript, Tailwind CSS, 默认配置）
  - 安装常用组件: `npx shadcn-ui@latest add button card input label textarea select dialog sheet tabs badge avatar toast`
  - 创建 `frontend/src/styles/globals.css` — Apple 风全局样式：
    - 系统字体栈: `font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
    - 全局背景: `background-color: #F5F5F7`
    - 大圆角 CSS 变量: `--radius-card: 1rem (rounded-2xl), --radius-modal: 1.5rem (rounded-3xl)`
    - 柔和阴影 token: `shadow-card: 0 2px 8px rgba(0,0,0,0.04), shadow-elevated: 0 8px 24px rgba(0,0,0,0.08)`
    - 毛玻璃工具类（用 @supports 包裹）:
      ```css
      @supports (backdrop-filter: blur(1px)) {
        .glass-card { backdrop-filter: blur(20px); background: rgba(255,255,255,0.7); }
        .glass-nav  { backdrop-filter: blur(12px); background: rgba(255,255,255,0.9); }
        .glass-modal { backdrop-filter: blur(16px); background: rgba(255,255,255,0.8); }
      }
      ```
    - 毛玻璃降级（@supports 外）: 纯白色背景
  - 配置 `tailwind.config.ts` 扩展 theme：添加上述 shadow、radius token
  - 创建 `frontend/src/lib/utils.ts` — cn() 工具函数（clsx + tailwind-merge）
  - 创建 `frontend/src/components/ui/` 目录 — shadcn/ui 组件存放处

  **Must NOT do**:
  - 不对 sticky 全宽元素（如未来的 TabBar）预设 backdrop-filter
  - 不使用 Tailwind v4（方案指定 v3）
  - 不安装额外 icon 库（使用 Lucide React，shadcn 内置）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 组件库初始化 + CSS 设计系统定义，属于视觉工程
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Apple 风格 CSS 需要设计感
  - **Skills Evaluated but Omitted**:
    - `playwright`: 此阶段无需浏览器验证

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with T1, T2, T4, T5)
  - **Blocks**: T15-T20 (所有前端页面)
  - **Blocked By**: None (can start immediately, 但需要 T1 的 frontend/package.json)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 407-423 行 — UI 风格要点（苹果风大框架 + 毛玻璃点缀）

  **External References**:
  - shadcn/ui 安装指南: https://ui.shadcn.com/docs/installation/vite
  - Tailwind CSS v3 配置: https://tailwindcss.com/docs/configuration

  **WHY Each Reference Matters**:
  - UI 风格定义是所有前端页面的基础，必须在此任务锁定

  **Acceptance Criteria**:

  - [ ] `frontend/src/components/ui/` 包含至少 10 个 shadcn 组件
  - [ ] globals.css 包含系统字体栈、#F5F5F7 背景、毛玻璃工具类
  - [ ] 毛玻璃 CSS 使用 `@supports (backdrop-filter: blur(1px))` 包裹
  - [ ] tailwind.config.ts 包含自定义 shadow 和 radius token
  - [ ] `cn()` 工具函数已导出

  **QA Scenarios**:

  ```
  Scenario: shadcn components import correctly
    Tool: Bash
    Preconditions: frontend dependencies installed, shadcn init completed
    Steps:
      1. cd frontend && npx tsc --noEmit
      2. Verify frontend/src/components/ui/button.tsx exists
      3. Verify frontend/src/components/ui/card.tsx exists
    Expected Result: TypeScript compilation succeeds, component files exist
    Failure Indicators: Import errors, missing component files
    Evidence: .sisyphus/evidence/task-3-shadcn-init.txt

  Scenario: Tailwind custom tokens available
    Tool: Bash
    Preconditions: tailwind.config.ts updated with custom tokens
    Steps:
      1. cd frontend && npm run build
      2. grep "backdrop-filter" dist/assets/*.css
      3. grep "#F5F5F7" dist/assets/*.css
    Expected Result: Custom CSS present in build output
    Failure Indicators: Custom styles missing from output
    Evidence: .sisyphus/evidence/task-3-tailwind-tokens.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): init shadcn/ui components with Apple-style theme`
  - Files: frontend/src/components/ui/*, frontend/src/styles/globals.css, tailwind.config.ts
  - Pre-commit: `cd frontend && npm run build`

- [ ] 4. 环境变量 + COS 预签名工具模块

  **What to do**:
  - 创建 `backend/src/lib/cos.ts` — 腾讯云 COS 预签名 URL 生成：
    - 使用 `cos-nodejs-sdk-v5` SDK
    - 从 .env 读取 COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION
    - 导出 `getPresignedUploadUrl(filename: string): Promise<{ url: string, key: string }>` 函数
    - URL 有效期 15 分钟
    - 文件 key 格式: `recipes/{timestamp}_{randomId}_{filename}`
  - 创建 `backend/src/lib/env.ts` — 统一环境变量加载和校验：
    - 使用 Zod schema 校验所有环境变量
    - 启动时校验必填项，缺失则 throw 明确错误
    - 导出类型安全的 `env` 对象

  **Must NOT do**:
  - 不硬编码任何密钥
  - 不在代码中留默认值用于密钥类变量

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一工具模块，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T5)
  - **Blocks**: T9 (图片上传路由), T24 (备份脚本)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 71-79 行 — 图片上传流程
  - `私厨-技术方案.md` 第 815-840 行 — 环境变量模板

  **External References**:
  - cos-nodejs-sdk-v5 预签名文档: https://cloud.tencent.com/document/product/436/64980

  **WHY Each Reference Matters**:
  - 图片上传流程定义了预签名 URL 的使用方式
  - 环境变量列表确保 Zod schema 完整

  **Acceptance Criteria**:

  - [ ] `backend/src/lib/cos.ts` 导出 `getPresignedUploadUrl` 函数
  - [ ] `backend/src/lib/env.ts` 使用 Zod 校验环境变量
  - [ ] 缺失必填环境变量时抛出明确错误信息
  - [ ] 无硬编码密钥

  **QA Scenarios**:

  ```
  Scenario: Environment validation catches missing vars
    Tool: Bash
    Preconditions: No .env file
    Steps:
      1. cd backend && npx tsx -e "import './src/lib/env'" 2>&1
      2. Check stderr for validation error
    Expected Result: Process exits with clear error listing missing variables
    Failure Indicators: No error, silent failure, or cryptic crash
    Evidence: .sisyphus/evidence/task-4-env-validation.txt

  Scenario: COS module exports correct interface
    Tool: Bash
    Preconditions: TypeScript compilation passes
    Steps:
      1. cd backend && npx tsc --noEmit
      2. grep "getPresignedUploadUrl" src/lib/cos.ts
    Expected Result: Function exported, TypeScript types correct
    Failure Indicators: Type errors, missing export
    Evidence: .sisyphus/evidence/task-4-cos-interface.txt
  ```

  **Commit**: YES (group with T5)
  - Message: `feat(infra): add COS presign util and WeChat webhook module`
  - Files: backend/src/lib/cos.ts, backend/src/lib/env.ts
  - Pre-commit: `cd backend && npx tsc --noEmit`

- [ ] 5. 企微 Webhook 推送模块

  **What to do**:
  - 创建 `backend/src/lib/wechat.ts` — 企业微信群机器人推送：
    - 从 .env 读取 WECHAT_WEBHOOK_URL
    - 实现消息队列 + 滑动窗口限流（间隔 3 秒发送，限流后等 60 秒重试）
    - 检查响应 body 的 `errcode`（企微总返回 200，不看 HTTP status）
    - 导出 `notify(content: string): void`（fire-and-forget，不阻塞请求）
    - 导出场景化通知函数：
      - `notifyNewOrder(userName: string, mealType: string, items: string[]): void`
      - `notifyNewRecipe(userName: string, recipeName: string, cookMinutes?: number): void`
      - `notifyNewWish(userName: string, dishName: string): void`
    - 代码实现参照技术方案第十节的 TypeScript 示例

  **Must NOT do**:
  - 不硬编码 Webhook URL
  - 企微 bot 不看 HTTP status（必须检查 body.errcode）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一模块，技术方案已给出完整代码示例
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T4)
  - **Blocks**: T21 (后端入口集成)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 588-629 行 — 企微 Webhook 完整 TypeScript 实现
  - `私厨-技术方案.md` 第 580-587 行 — 通知触发场景和消息模板

  **WHY Each Reference Matters**:
  - 代码示例包含限流逻辑，直接参照实现
  - 通知场景定义了需要导出的函数签名

  **Acceptance Criteria**:

  - [ ] `backend/src/lib/wechat.ts` 导出 notify + 3 个场景化函数
  - [ ] 消息队列间隔 3 秒发送
  - [ ] errcode === 45009 时等 60 秒重试
  - [ ] 检查 body.errcode 而非 HTTP status

  **QA Scenarios**:

  ```
  Scenario: WeChat module exports correct interface
    Tool: Bash
    Preconditions: TypeScript compilation
    Steps:
      1. cd backend && npx tsc --noEmit
      2. grep -c "export" src/lib/wechat.ts
    Expected Result: 4 exports (notify, notifyNewOrder, notifyNewRecipe, notifyNewWish)
    Failure Indicators: Missing exports, type errors
    Evidence: .sisyphus/evidence/task-5-wechat-interface.txt

  Scenario: Rate limiting logic handles errcode 45009
    Tool: Bash
    Preconditions: wechat.ts code review
    Steps:
      1. grep "45009" backend/src/lib/wechat.ts
      2. grep "60000" backend/src/lib/wechat.ts
      3. grep "3000" backend/src/lib/wechat.ts
    Expected Result: All three values present (rate limit code, 60s wait, 3s interval)
    Failure Indicators: Missing rate limit handling
    Evidence: .sisyphus/evidence/task-5-rate-limit.txt
  ```

  **Commit**: YES (group with T4)
  - Message: `feat(infra): add COS presign util and WeChat webhook module`
  - Files: backend/src/lib/wechat.ts
  - Pre-commit: `cd backend && npx tsc --noEmit`

- [ ] 6. 认证系统 — Lucia v3 + 注册/登录/登出 + 中间件

  **What to do**:
  - 创建 `backend/src/lib/lucia.ts` — Lucia v3 配置：
    - 使用 `@lucia-auth/adapter-sqlite` 连接 better-sqlite3
    - Session 存 SQLite sessions 表
    - Cookie 配置: HttpOnly, Secure, SameSite=Strict
    - 若 Lucia v3 不可用（T1 验证结果），使用手动方案：crypto.randomUUID 生成 session ID，argon2 哈希密码，手写 session CRUD
  - 创建 `backend/src/middleware/auth.ts` — 认证中间件：
    - 从 Cookie 读取 session ID
    - 验证 session 有效性（未过期）
    - 将 `user` 和 `familyId` 注入 Hono Context（`c.set('user', user); c.set('familyId', familyId)`）
    - **关键**: 所有受保护路由通过此中间件获取 familyId，用于后续 WHERE 查询
  - 创建 `backend/src/middleware/cors.ts` — CORS 配置：
    - 允许 FRONTEND_ORIGIN（从 .env 读取）
    - 允许 credentials（Cookie）
  - 创建 `backend/src/routes/auth.ts` — 认证路由：
    - `POST /api/auth/register` — 邀请码 + 用户名 + 昵称 + 密码注册
      - 验证邀请码对应的 family 存在
      - 用 argon2 哈希密码
      - 创建 user + family_member 关联
      - 创建 session，set Cookie
      - **特殊流程**: 若无任何家庭存在（首次使用），注册接口同时创建家庭（role=admin，自动生成 6 位邀请码）
    - `POST /api/auth/login` — 用户名 + 密码登录
    - `POST /api/auth/logout` — 清除 session + Cookie
    - `GET /api/auth/me` — 返回当前用户信息（id, username, display_name, role, familyId）
  - 所有输入用 Zod 校验

  **Must NOT do**:
  - 不在 localStorage 存 token（用 HttpOnly Cookie）
  - 不使用 JWT（方案指定 Session-based）
  - 不跳过密码哈希（即使是家庭应用）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 认证是安全关键模块，涉及 session 管理、密码哈希、Cookie 安全、IDOR 防护，需要深度思考
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2，与 T7-T14 并行)
  - **Parallel Group**: Wave 2
  - **Blocks**: T15 (前端认证页), T19 (个人中心), T20 (布局), T21 (后端集成), T23 (测试)
  - **Blocked By**: T1 (脚手架), T2 (DB schema)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 83-93 行 — 认证流程（邀请码注册、Session Cookie）
  - `私厨-技术方案.md` 第 296-302 行 — 认证 API 设计（4 个端点）
  - `私厨-技术方案.md` 第 474-476 行 — 后端文件结构（middleware/auth.ts, lib/lucia.ts）

  **External References**:
  - Lucia v3 SQLite 适配器: https://lucia-auth.com/database/sqlite
  - Hono 中间件指南: https://hono.dev/docs/guides/middleware
  - argon2 Node.js 用法: https://www.npmjs.com/package/@node-rs/argon2

  **WHY Each Reference Matters**:
  - 认证流程定义了注册/登录的完整逻辑，包括邀请码验证
  - 中间件文件位置确保与技术方案目录结构一致
  - Lucia v3 可能废弃，需要备选方案

  **Acceptance Criteria**:

  - [ ] 4 个认证端点全部实现
  - [ ] 注册时验证邀请码有效性
  - [ ] 密码使用 argon2 哈希
  - [ ] Session Cookie 设置 HttpOnly + Secure + SameSite=Strict
  - [ ] auth 中间件将 user 和 familyId 注入 Context
  - [ ] 首次注册（无家庭时）自动创建家庭

  **QA Scenarios**:

  ```
  Scenario: Full registration flow with invite code
    Tool: Bash (curl)
    Preconditions: Backend running, empty database
    Steps:
      1. POST /api/auth/register {"username":"chef","display_name":"大厨","password":"test1234"} (first user, no invite code needed)
      2. Assert response 200 with Set-Cookie header containing session ID
      3. GET /api/auth/me with the session cookie
      4. Assert response includes familyId and role="admin"
      5. Extract invite_code from GET /api/families/:id
      6. POST /api/auth/register {"username":"foodie","display_name":"吃货","password":"test5678","invite_code":"<code>"}
      7. Assert response 200, second user is role="member" with same familyId
    Expected Result: Two users registered, both in same family, first is admin
    Failure Indicators: 401/403/500, missing cookie, wrong role
    Evidence: .sisyphus/evidence/task-6-register-flow.txt

  Scenario: Login with wrong password returns 401
    Tool: Bash (curl)
    Preconditions: User "chef" exists
    Steps:
      1. POST /api/auth/login {"username":"chef","password":"wrongpass"}
      2. Assert HTTP 401
      3. Assert no Set-Cookie header
    Expected Result: 401 with error message, no session created
    Failure Indicators: 200 with session cookie
    Evidence: .sisyphus/evidence/task-6-login-fail.txt

  Scenario: Protected route rejects unauthenticated request
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. GET /api/auth/me without cookie
      2. Assert HTTP 401
    Expected Result: 401 Unauthorized
    Failure Indicators: 200 or 500
    Evidence: .sisyphus/evidence/task-6-unauth.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): implement session auth with invite codes`
  - Files: backend/src/routes/auth.ts, backend/src/middleware/auth.ts, backend/src/middleware/cors.ts, backend/src/lib/lucia.ts
  - Pre-commit: `cd backend && npx tsc --noEmit`

- [ ] 7. 菜谱 CRUD 路由

  **What to do**:
  - 创建 `backend/src/routes/recipes.ts` — 菜谱 CRUD：
    - `GET /api/recipes` — 菜谱列表：
      - 必须 WHERE family_id = 当前用户的 familyId（防 IDOR）
      - 支持 `?tag=` 标签筛选（JOIN recipe_tags + tags）
      - 支持 `?search=` 标题模糊搜索（LIKE）
      - 返回菜谱 + 首张图片 + 标签列表 + 平均评分
      - 分页: `?page=1&limit=20`
    - `POST /api/recipes` — 创建菜谱：
      - Zod 校验: title(必填), description, steps(JSON string[]), cook_minutes, servings
      - created_by = 当前用户 ID
      - family_id = 当前用户的 familyId
      - 支持同时创建 recipe_tags 关联
    - `GET /api/recipes/:id` — 菜谱详情：
      - WHERE family_id = familyId AND id = :id
      - 包含: 基础信息 + 所有图片 + 标签 + 最近烹饪日志 + 平均评分 + 当前用户是否已收藏
    - `PUT /api/recipes/:id` — 更新菜谱：
      - 验证 family_id 归属
      - 支持更新标签关联（先删后插）
    - `DELETE /api/recipes/:id` — 删除菜谱：
      - 验证 family_id 归属
      - 若有 order_items 引用则返回 409 Conflict（RESTRICT 外键会拦截，但需友好错误信息）
  - 所有查询避免 N+1：使用 JOIN 或子查询一次获取关联数据

  **Must NOT do**:
  - 不在循环中查询数据库（N+1）
  - 不跳过 family_id 校验
  - steps 字段存为 JSON TEXT，不拆独立表

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 最复杂的 CRUD 模块，涉及多表 JOIN、筛选、分页、N+1 防范
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2，与 T6, T8-T14 并行)
  - **Parallel Group**: Wave 2
  - **Blocks**: T16 (前端菜谱页面), T21 (后端集成)
  - **Blocked By**: T1 (脚手架), T2 (DB schema)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 314-321 行 — 菜谱 API 设计
  - `私厨-技术方案.md` 第 174-185 行 — recipes 表结构
  - `私厨-技术方案.md` 第 198-209 行 — tags 和 recipe_tags 表结构

  **WHY Each Reference Matters**:
  - API 设计定义端点签名，表结构定义查询字段

  **Acceptance Criteria**:

  - [ ] 5 个菜谱端点全部实现
  - [ ] 所有查询包含 WHERE family_id = ?
  - [ ] 列表支持标签筛选和搜索
  - [ ] 删除被引用菜谱返回 409
  - [ ] 零 N+1 查询

  **QA Scenarios**:

  ```
  Scenario: Create and retrieve recipe
    Tool: Bash (curl)
    Preconditions: Authenticated user with session cookie
    Steps:
      1. POST /api/recipes {"title":"红烧肉","description":"经典菜","steps":["切肉","炖煮"],"cook_minutes":60,"servings":4}
      2. Assert 201 with recipe id
      3. GET /api/recipes/:id
      4. Assert response contains title="红烧肉", steps array, cook_minutes=60
    Expected Result: Recipe created and retrieved with correct data
    Failure Indicators: 400/500, missing fields
    Evidence: .sisyphus/evidence/task-7-recipe-crud.txt

  Scenario: IDOR prevention - cannot access other family's recipes
    Tool: Bash (curl)
    Preconditions: Two families with different users, recipe in family A
    Steps:
      1. Login as family B user
      2. GET /api/recipes/:id (recipe belongs to family A)
      3. Assert 404 (not 200)
    Expected Result: 404 Not Found
    Failure Indicators: 200 with recipe data (IDOR vulnerability)
    Evidence: .sisyphus/evidence/task-7-idor.txt
  ```

  **Commit**: YES (group with T8, T9)
  - Message: `feat(api): add recipe CRUD, tags, and image upload routes`
  - Files: backend/src/routes/recipes.ts
  - Pre-commit: `cd backend && npx tsc --noEmit`

- [ ] 8. 标签系统路由

  **What to do**:
  - 创建 `backend/src/routes/tags.ts` — 标签 CRUD：
    - `GET /api/tags` — 当前家庭的标签列表 (WHERE family_id = familyId)
    - `POST /api/tags` — 创建标签 (family_id + name, UNIQUE 约束)
    - `DELETE /api/tags/:id` — 删除标签 (验证 family_id 归属，CASCADE 删除 recipe_tags 关联)
  - Zod 校验: name (必填, trim, 非空)

  **Must NOT do**:
  - 不跳过 family_id 校验
  - 不允许创建重复标签名（同一家庭内）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单 CRUD，3 个端点，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with T6, T7, T9-T14)
  - **Blocks**: T16 (前端菜谱页面), T21 (后端集成)
  - **Blocked By**: T1 (脚手架), T2 (DB schema)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 333-337 行 — 标签 API 设计
  - `私厨-技术方案.md` 第 198-209 行 — tags + recipe_tags 表

  **Acceptance Criteria**:

  - [ ] 3 个标签端点实现
  - [ ] UNIQUE(family_id, name) 约束生效
  - [ ] 所有查询带 family_id 过滤

  **QA Scenarios**:

  ```
  Scenario: Create tag and list
    Tool: Bash (curl)
    Preconditions: Authenticated user
    Steps:
      1. POST /api/tags {"name":"家常菜"}
      2. Assert 201
      3. GET /api/tags
      4. Assert array contains {"name":"家常菜"}
      5. POST /api/tags {"name":"家常菜"} (duplicate)
      6. Assert 409 Conflict
    Expected Result: Tag created, listed, duplicate rejected
    Evidence: .sisyphus/evidence/task-8-tags.txt
  ```

  **Commit**: YES (group with T7, T9)

- [ ] 9. 图片上传路由 — COS 预签名

  **What to do**:
  - 创建 `backend/src/routes/images.ts` — 图片上传路由：
    - `GET /api/upload/presign` — 获取 COS 预签名上传 URL：
      - 参数: `?filename=xxx.jpg&contentType=image/jpeg`
      - 调用 T4 的 `getPresignedUploadUrl`
      - 返回 `{ url, key }` 供前端 PUT 直传 COS
    - `POST /api/recipes/:id/images` — 保存图片 URL 到菜谱：
      - 验证 recipe 属于当前家庭
      - 保存 url, thumb_url, sort_order 到 recipe_images 表
    - `DELETE /api/images/:id` — 删除图片记录
      - 验证图片关联的 recipe 属于当前家庭
      - 删除 recipe_images 记录（COS 上的文件可暂不删除，二期再做清理）

  **Must NOT do**:
  - 不接收 Base64 编码图片
  - 图片不经后端传输（只传 URL）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3 个简单端点，主要逻辑在 T4 的 COS 模块中
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2
  - **Blocks**: T16 (前端菜谱页面), T21 (后端集成)
  - **Blocked By**: T1, T2, T4 (COS 工具模块)

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 324-329 行 — 图片 API 设计
  - `私厨-技术方案.md` 第 71-79 行 — 图片上传流程
  - `私厨-技术方案.md` 第 188-195 行 — recipe_images 表

  **Acceptance Criteria**:

  - [ ] 3 个图片端点实现
  - [ ] 预签名 URL 返回有效的 COS 地址
  - [ ] 图片保存验证 recipe 归属当前家庭

  **QA Scenarios**:

  ```
  Scenario: Get presigned URL
    Tool: Bash (curl)
    Preconditions: Authenticated user, COS env vars configured
    Steps:
      1. GET /api/upload/presign?filename=test.jpg&contentType=image/jpeg
      2. Assert response has url and key fields
      3. Assert url contains COS bucket domain
    Expected Result: Valid presigned URL returned
    Evidence: .sisyphus/evidence/task-9-presign.txt
  ```

  **Commit**: YES (group with T7, T8)

- [ ] 10. 点餐系统路由

  **What to do**:
  - 创建 `backend/src/routes/orders.ts` — 点餐 CRUD：
    - `GET /api/orders` — 点餐单列表：
      - WHERE family_id = familyId
      - 支持 `?status=` 筛选
      - 支持 `?meal_date=` 日期筛选
      - 返回订单 + order_items（含菜谱标题和首图）
    - `POST /api/orders` — 创建点餐单：
      - Zod 校验: meal_type (breakfast/lunch/dinner/snack), meal_date (YYYY-MM-DD), items (array of {recipe_id, quantity})
      - 事务: 创建 order + 批量插入 order_items
      - 触发企微通知（调用 T5 的 notifyNewOrder）
    - `GET /api/orders/:id` — 点餐单详情（含所有 items + 菜谱信息）
    - `PUT /api/orders/:id/status` — 更新状态 (pending → confirmed → completed)
      - 状态流转校验: 只允许单向 pending→confirmed→completed
  - 所有查询带 family_id 过滤

  **Must NOT do**:
  - 不允许状态回退（completed → pending）
  - 不在循环中查询 recipe 详情（JOIN）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及事务、状态流转、通知触发、多表 JOIN
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2
  - **Blocks**: T17 (前端点餐页面), T21 (后端集成), T23 (测试)
  - **Blocked By**: T1, T2

  **References**:

  **Pattern References**:
  - `私厨-技术方案.md` 第 363-369 行 — 点餐 API 设计
  - `私厨-技术方案.md` 第 245-262 行 — orders + order_items 表
  - `私厨-技术方案.md` 第 580-587 行 — 点餐通知场景

  **Acceptance Criteria**:

  - [ ] 4 个点餐端点实现
  - [ ] 创建订单使用事务（order + order_items 原子操作）
  - [ ] 状态流转单向：pending → confirmed → completed
  - [ ] 创建订单触发企微通知
  - [ ] 所有查询带 family_id

  **QA Scenarios**:

  ```
  Scenario: Create order and check status flow
    Tool: Bash (curl)
    Preconditions: Authenticated user, at least one recipe exists
    Steps:
      1. POST /api/orders {"meal_type":"dinner","meal_date":"2026-04-10","items":[{"recipe_id":1,"quantity":1}]}
      2. Assert 201 with order id
      3. PUT /api/orders/:id/status {"status":"confirmed"}
      4. Assert 200
      5. PUT /api/orders/:id/status {"status":"pending"} (rollback attempt)
      6. Assert 400 (invalid status transition)
    Expected Result: Order created, confirmed, rollback rejected
    Evidence: .sisyphus/evidence/task-10-order-flow.txt
  ```

  **Commit**: YES (group with T11, T12)
  - Message: `feat(api): add order, wish, and favorites routes`

- [ ] 11. 许愿菜单路由

  **What to do**:
  - 创建 `backend/src/routes/wishes.ts`：
    - `GET /api/wishes` — 许愿列表 (WHERE family_id = familyId，支持 ?status= 筛选)
    - `POST /api/wishes` — 许愿 (dish_name, note)，触发 notifyNewWish
    - `PUT /api/wishes/:id` — 更新状态 (pending/fulfilled/cancelled)，fulfilled 时可关联 recipe_id

  **Must NOT do**:
  - 不跳过 family_id 校验

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3 个简单端点
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2
  - **Blocks**: T18, T21
  - **Blocked By**: T1, T2

  **References**:
  - `私厨-技术方案.md` 第 355-360 行 — 许愿 API
  - `私厨-技术方案.md` 第 233-242 行 — wishes 表

  **Acceptance Criteria**:
  - [ ] 3 个许愿端点实现
  - [ ] 许愿触发企微通知
  - [ ] fulfilled 状态可关联 recipe_id

  **QA Scenarios**:

  ```
  Scenario: Create wish and fulfill
    Tool: Bash (curl)
    Steps:
      1. POST /api/wishes {"dish_name":"糖醋排骨","note":"想吃好久了"}
      2. Assert 201
      3. PUT /api/wishes/:id {"status":"fulfilled","recipe_id":1}
      4. Assert 200
    Expected Result: Wish created and fulfilled with recipe link
    Evidence: .sisyphus/evidence/task-11-wishes.txt
  ```

  **Commit**: YES (group with T10, T12)

- [ ] 12. 收藏路由

  **What to do**:
  - 创建 `backend/src/routes/favorites.ts`：
    - `GET /api/favorites` — 我的收藏列表 (WHERE user_id = 当前用户，JOIN recipes 获取菜谱信息)
    - `POST /api/favorites/:recipeId` — 收藏 (验证 recipe 属于当前家庭)
    - `DELETE /api/favorites/:recipeId` — 取消收藏

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: T18, T21
  - **Blocked By**: T1, T2

  **References**:
  - `私厨-技术方案.md` 第 371-377 行 — 收藏 API
  - `私厨-技术方案.md` 第 265-270 行 — favorites 表

  **Acceptance Criteria**:
  - [ ] 3 个收藏端点实现
  - [ ] 收藏前验证 recipe 属于当前家庭
  - [ ] 重复收藏返回 409

  **QA Scenarios**:

  ```
  Scenario: Favorite and unfavorite recipe
    Tool: Bash (curl)
    Steps:
      1. POST /api/favorites/1
      2. Assert 201
      3. GET /api/favorites
      4. Assert array contains recipe with id=1
      5. DELETE /api/favorites/1
      6. Assert 200
      7. GET /api/favorites
      8. Assert empty array
    Expected Result: Favorite toggle works correctly
    Evidence: .sisyphus/evidence/task-12-favorites.txt
  ```

  **Commit**: YES (group with T10, T11)

- [ ] 13. 烹饪日志 + 评分路由

  **What to do**:
  - 创建 `backend/src/routes/cook-logs.ts` — 烹饪日志：
    - `GET /api/recipes/:id/logs` — 某菜谱的烹饪日志 (family_id 过滤)
    - `POST /api/cook-logs` — 记录一次烹饪 (recipe_id, cooked_at, note)
    - `GET /api/cook-logs` — 全部烹饪日志时间线 (family_id 过滤, 按 cooked_at 倒序, 分页)
  - 创建 `backend/src/routes/ratings.ts` — 评分评论：
    - `POST /api/cook-logs/:id/ratings` — 评分 (score 1-5, comment)，UNIQUE(cook_log_id, user_id) 约束
    - `GET /api/cook-logs/:id/ratings` — 获取某次烹饪的所有评分

  **Must NOT do**:
  - 不允许同一用户对同次烹饪重复评分（UNIQUE 约束）
  - 不在循环中查关联数据

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及两个路由文件 + 多表关联查询
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: T18, T21
  - **Blocked By**: T1, T2

  **References**:
  - `私厨-技术方案.md` 第 339-352 行 — 烹饪日志 + 评分 API
  - `私厨-技术方案.md` 第 213-230 行 — cook_logs + ratings 表

  **Acceptance Criteria**:
  - [ ] 5 个端点实现（3 日志 + 2 评分）
  - [ ] 评分 CHECK(1-5) 约束生效
  - [ ] 重复评分返回 409
  - [ ] 烹饪日志时间线支持分页

  **QA Scenarios**:

  ```
  Scenario: Log cooking and rate it
    Tool: Bash (curl)
    Steps:
      1. POST /api/cook-logs {"recipe_id":1,"note":"今天做得不错"}
      2. Assert 201 with cook_log id
      3. POST /api/cook-logs/:id/ratings {"score":5,"comment":"太好吃了"}
      4. Assert 201
      5. POST /api/cook-logs/:id/ratings {"score":4,"comment":"再来一次"} (duplicate)
      6. Assert 409
    Expected Result: Cook log created, rated once, duplicate rejected
    Evidence: .sisyphus/evidence/task-13-cooklog-rating.txt
  ```

  **Commit**: YES (group with T14)
  - Message: `feat(api): add cook logs, ratings, and family management routes`

- [ ] 14. 家庭管理路由

  **What to do**:
  - 创建 `backend/src/routes/families.ts`：
    - `POST /api/families` — 创建家庭 (admin only, 生成 6 位随机邀请码)
    - `GET /api/families/:id` — 获取家庭信息 (含邀请码，仅本家庭成员可见)
    - `GET /api/families/:id/members` — 获取成员列表
    - `POST /api/families/join` — 通过邀请码加入家庭（可能主要在注册流程中用到，此处也提供独立端点）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: T19, T21
  - **Blocked By**: T1, T2

  **References**:
  - `私厨-技术方案.md` 第 304-311 行 — 家庭 API
  - `私厨-技术方案.md` 第 157-171 行 — families + family_members 表

  **Acceptance Criteria**:
  - [ ] 4 个家庭端点实现
  - [ ] 邀请码为 6 位随机字符串
  - [ ] 仅本家庭成员可查看家庭信息

  **QA Scenarios**:

  ```
  Scenario: Get family members
    Tool: Bash (curl)
    Steps:
      1. GET /api/families/:id/members (as family member)
      2. Assert response is array with member objects containing display_name
      3. GET /api/families/:otherId/members (as non-member)
      4. Assert 403
    Expected Result: Members listed for own family, forbidden for others
    Evidence: .sisyphus/evidence/task-14-family.txt
  ```

  **Commit**: YES (group with T13)

- [ ] 15. 前端认证页面 — 登录/注册

  **What to do**:
  - 创建 `frontend/src/pages/auth/Login.tsx` — 登录页：
    - 表单: 用户名 + 密码
    - 使用 shadcn/ui Input, Button, Card 组件
    - TanStack Query mutation 调用 POST /api/auth/login
    - 登录成功跳转首页
    - Apple 风格: 居中卡片、大圆角、柔和阴影
  - 创建 `frontend/src/pages/auth/Register.tsx` — 注册页：
    - 两种模式:
      1. 首次使用（创建家庭）: 用户名 + 昵称 + 密码
      2. 加入家庭: 邀请码 + 用户名 + 昵称 + 密码
    - 自动检测是否有家庭存在来决定模式
  - 创建 `frontend/src/hooks/useAuth.ts` — 认证 Hook：
    - `useCurrentUser()` — TanStack Query 缓存 GET /api/auth/me
    - `useLogin()` — mutation
    - `useLogout()` — mutation + invalidate queries
    - `useRegister()` — mutation
  - 创建 `frontend/src/lib/auth.ts` — 认证守卫：
    - `RequireAuth` 组件包裹受保护路由
    - 未登录重定向到 /login

  **Must NOT do**:
  - 不在 localStorage 存 token
  - 不使用裸 fetch（使用 T1 创建的 Hono RPC 客户端或封装的 api 模块）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端页面 + UI 实现
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Apple 风格登录页需要设计感

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3，与 T16-T20 并行)
  - **Parallel Group**: Wave 3
  - **Blocks**: -
  - **Blocked By**: T3 (shadcn/ui), T6 (认证后端)

  **References**:
  - `私厨-技术方案.md` 第 385-387 行 — auth 页面结构
  - `私厨-技术方案.md` 第 83-93 行 — 认证流程
  - `私厨-技术方案.md` 第 407-423 行 — UI 风格要点

  **Acceptance Criteria**:
  - [ ] 登录/注册两个页面组件实现
  - [ ] useAuth hook 封装所有认证操作
  - [ ] RequireAuth 守卫正确重定向
  - [ ] Apple 风格 UI（大圆角卡片、柔和阴影、系统字体）

  **QA Scenarios**:

  ```
  Scenario: Login page renders and submits
    Tool: Playwright
    Preconditions: Frontend dev server running, backend running
    Steps:
      1. Navigate to /login
      2. Assert page contains input[name="username"] and input[name="password"]
      3. Fill username="chef", password="test1234"
      4. Click submit button
      5. Wait for navigation to /
      6. Assert URL is / (home page)
    Expected Result: Successful login redirects to home
    Failure Indicators: Form validation error, 401, no redirect
    Evidence: .sisyphus/evidence/task-15-login.png

  Scenario: Unauthenticated access redirects to login
    Tool: Playwright
    Preconditions: Frontend dev server running, no active session
    Steps:
      1. Navigate to / (home)
      2. Assert redirect to /login
    Expected Result: Redirected to /login
    Evidence: .sisyphus/evidence/task-15-auth-guard.png
  ```

  **Commit**: YES (group with T16-T20)
  - Message: `feat(frontend): implement all pages with Apple-style UI`

- [ ] 16. 前端菜谱页面 — 列表+详情+表单

  **What to do**:
  - 创建 `frontend/src/pages/home/Home.tsx` — 首页（菜谱列表）：
    - 顶部搜索栏 + 标签筛选 chips
    - 菜谱卡片网格/列表（毛玻璃卡片: glass-card 类）
    - 每张卡片: 首图 + 菜名 + 标签 badges + 平均评分 + 耗时
    - TanStack Query 请求 GET /api/recipes + GET /api/tags
    - 下拉加载更多（分页）
    - 收藏按钮（乐观更新）
  - 创建 `frontend/src/pages/recipe/RecipeDetail.tsx` — 菜谱详情：
    - 图片轮播（多图）
    - 基础信息卡片: 耗时、份量、标签
    - 制作步骤列表
    - 烹饪日志时间线 + 评分
    - 操作按钮: 编辑、删除、收藏
  - 创建 `frontend/src/pages/recipe/RecipeForm.tsx` — 创建/编辑菜谱：
    - 标题、简介、份量、耗时输入
    - 步骤编辑器（动态添加/删除/排序步骤）
    - 多图上传（使用 browser-image-compression 压缩 → COS 预签名直传）
    - 标签多选
  - 创建 `frontend/src/components/recipe/RecipeCard.tsx` — 菜谱卡片组件
  - 创建 `frontend/src/components/recipe/StepEditor.tsx` — 步骤编辑器组件
  - 创建 `frontend/src/hooks/useRecipes.ts` — 菜谱相关 hooks
  - 创建 `frontend/src/lib/upload.ts` — 图片上传工具：
    - 前端 browser-image-compression 压缩至 ≤1MB
    - 请求 GET /api/upload/presign 获取预签名 URL
    - PUT 直传 COS（使用 XMLHttpRequest 获取上传进度）
    - 返回 COS URL
    - **关键**: 使用 XMLHttpRequest（fetch 无上传进度 API）
    - 创建的 URL.createObjectURL 必须 revokeObjectURL

  **Must NOT do**:
  - 图片上传不使用 Base64
  - 不使用 fetch 上传（无进度回调），用 XMLHttpRequest
  - URL.createObjectURL 后必须 revokeObjectURL
  - 不对全宽搜索栏加 backdrop-filter

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 最复杂的前端页面，涉及图片上传、步骤编辑器、卡片布局
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Parallel Group**: Wave 3
  - **Blocks**: -
  - **Blocked By**: T3, T7, T8, T9

  **References**:
  - `私厨-技术方案.md` 第 388-393 行 — 菜谱页面结构
  - `私厨-技术方案.md` 第 71-79 行 — 图片上传流程
  - `私厨-技术方案.md` 第 407-423 行 — UI 风格（毛玻璃卡片）
  - `私厨-技术方案.md` 第 655-672 行 — 代码注意事项（XMLHttpRequest, revokeObjectURL）

  **Acceptance Criteria**:
  - [ ] 首页展示菜谱卡片列表（毛玻璃效果）
  - [ ] 标签筛选和搜索功能正常
  - [ ] 菜谱详情展示所有信息
  - [ ] 图片上传使用 XMLHttpRequest + COS 预签名直传
  - [ ] URL.createObjectURL 有对应 revokeObjectURL

  **QA Scenarios**:

  ```
  Scenario: Home page shows recipe list with tag filter
    Tool: Playwright
    Preconditions: Backend with seed data (recipes + tags)
    Steps:
      1. Navigate to / (home)
      2. Assert recipe cards visible (at least 1 card with .recipe-card or similar selector)
      3. Click a tag chip
      4. Assert recipe list filtered (count changed or specific recipe visible/hidden)
    Expected Result: Recipes displayed and filtered by tag
    Evidence: .sisyphus/evidence/task-16-home.png

  Scenario: Create recipe with image upload
    Tool: Playwright
    Preconditions: Authenticated user
    Steps:
      1. Navigate to /recipe/new
      2. Fill title="测试菜谱", cook_minutes=30, servings=2
      3. Add step "第一步"
      4. Upload test image (mock file)
      5. Click submit
      6. Assert redirect to recipe detail page
    Expected Result: Recipe created with image and steps
    Evidence: .sisyphus/evidence/task-16-create-recipe.png
  ```

  **Commit**: YES (group with T15, T17-T20)

- [ ] 17. 前端点餐页面 — 点餐创建+列表

  **What to do**:
  - 创建 `frontend/src/pages/order/OrderCreate.tsx` — 点餐页：
    - 选择餐类 (早餐/午餐/晚餐/加餐) 和日期
    - 浏览菜谱列表（可按标签筛选）
    - 勾选菜品 + 设置数量
    - 提交点餐单
    - 提交成功后 Toast 提示
  - 创建 `frontend/src/pages/order/OrderList.tsx` — 点餐单列表：
    - 按日期分组展示
    - 状态 badge (pending/confirmed/completed)
    - 点击查看详情
  - 创建 `frontend/src/hooks/useOrders.ts` — 点餐 hooks

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: -
  - **Blocked By**: T3, T10

  **References**:
  - `私厨-技术方案.md` 第 394-395 行 — 点餐页面结构
  - `私厨-技术方案.md` 第 363-369 行 — 点餐 API

  **Acceptance Criteria**:
  - [ ] 点餐创建页支持选菜 + 设置数量
  - [ ] 点餐列表按日期分组
  - [ ] 状态 badge 颜色区分

  **QA Scenarios**:

  ```
  Scenario: Create order flow
    Tool: Playwright
    Preconditions: Authenticated user, recipes exist
    Steps:
      1. Navigate to /order/create
      2. Select meal_type="dinner"
      3. Check at least one recipe checkbox
      4. Click submit
      5. Assert success toast appears
      6. Navigate to /orders
      7. Assert new order visible in list with status "pending"
    Expected Result: Order created and visible in list
    Evidence: .sisyphus/evidence/task-17-order.png
  ```

  **Commit**: YES (group with T15-T16, T18-T20)

- [ ] 18. 前端许愿+收藏+烹饪日志页面

  **What to do**:
  - 创建 `frontend/src/pages/wish/WishList.tsx` — 许愿菜单：
    - 许愿列表（按状态分组: pending/fulfilled）
    - 添加许愿弹窗 (Dialog)
    - 状态切换
  - 创建 `frontend/src/pages/favorites/Favorites.tsx` — 我的收藏：
    - 收藏的菜谱卡片列表
    - 点击跳转菜谱详情
    - 取消收藏（滑动或按钮）
  - 在 RecipeDetail.tsx 中集成烹饪日志展示和评分功能（可能需要额外组件）:
    - 烹饪日志时间线
    - 评分星星 + 评论输入
    - 记录烹饪按钮
  - 创建相关 hooks: `useWishes.ts`, `useFavorites.ts`, `useCookLogs.ts`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: -
  - **Blocked By**: T3, T11, T12, T13

  **References**:
  - `私厨-技术方案.md` 第 396-399 行 — 许愿/收藏页面结构
  - `私厨-技术方案.md` 第 355-377 行 — 许愿/收藏/评分 API

  **Acceptance Criteria**:
  - [ ] 许愿列表含添加和状态切换
  - [ ] 收藏页展示菜谱卡片
  - [ ] 烹饪日志时间线 + 评分功能在详情页集成

  **QA Scenarios**:

  ```
  Scenario: Add wish and view list
    Tool: Playwright
    Steps:
      1. Navigate to /wishes
      2. Click "许愿" button
      3. Fill dish_name="糖醋排骨"
      4. Submit
      5. Assert "糖醋排骨" appears in wish list with status "pending"
    Expected Result: Wish added and displayed
    Evidence: .sisyphus/evidence/task-18-wish.png
  ```

  **Commit**: YES (group with T15-T17, T19-T20)

- [ ] 19. 前端个人中心+家庭管理页面

  **What to do**:
  - 创建 `frontend/src/pages/profile/Profile.tsx` — 个人中心：
    - 显示用户信息（头像/昵称/角色）
    - 家庭信息卡片（家庭名称、邀请码、成员数）
    - 邀请码展示 + 一键复制
    - 家庭成员列表
    - 登出按钮
  - 创建 `frontend/src/hooks/useFamily.ts` — 家庭 hooks

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: -
  - **Blocked By**: T3, T6, T14

  **References**:
  - `私厨-技术方案.md` 第 400-401 行 — 个人中心页面

  **Acceptance Criteria**:
  - [ ] 展示家庭信息和邀请码
  - [ ] 邀请码可一键复制
  - [ ] 成员列表展示
  - [ ] 登出功能正常

  **QA Scenarios**:

  ```
  Scenario: Profile shows family info
    Tool: Playwright
    Steps:
      1. Navigate to /profile
      2. Assert display_name visible
      3. Assert invite code visible (6 characters)
      4. Assert member list has at least 1 member
    Expected Result: Profile page displays all info
    Evidence: .sisyphus/evidence/task-19-profile.png
  ```

  **Commit**: YES (group with T15-T18, T20)

- [ ] 20. 前端布局+路由+TabBar

  **What to do**:
  - 创建 `frontend/src/pages/layout/AppLayout.tsx` — 全局布局：
    - 顶部区域（可选标题栏）
    - 内容区（Outlet）
    - 底部 TabBar
  - 创建 `frontend/src/pages/layout/TabBar.tsx` — 底部导航：
    - 4 个 Tab: 首页(菜谱)、点餐、许愿、我的
    - 使用 Lucide React 图标
    - 毛玻璃效果: glass-nav 类
    - 当前 Tab 高亮
    - **注意**: TabBar 是 fixed bottom 全宽元素，使用 glass-nav 而非重度 backdrop-filter
  - 配置 `frontend/src/App.tsx` — React Router 路由：
    - `/login` — Login
    - `/register` — Register
    - `/` — Home (菜谱列表)
    - `/recipe/:id` — RecipeDetail
    - `/recipe/new` — RecipeForm (新建)
    - `/recipe/:id/edit` — RecipeForm (编辑)
    - `/order/create` — OrderCreate
    - `/orders` — OrderList
    - `/wishes` — WishList
    - `/favorites` — Favorites
    - `/profile` — Profile
    - 受保护路由使用 RequireAuth 包裹
  - 配置 TanStack Query Provider（in App.tsx 或 main.tsx）

  **Must NOT do**:
  - TabBar 不使用重度 backdrop-filter（会导致严重卡顿）
  - 使用 glass-nav 类（较轻的 blur）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: T26 (前端部署)
  - **Blocked By**: T3, T6

  **References**:
  - `私厨-技术方案.md` 第 402-404 行 — 布局结构
  - `私厨-技术方案.md` 第 383-404 行 — 完整页面路由结构
  - `私厨-技术方案.md` 第 418-422 行 — 毛玻璃效果分级

  **Acceptance Criteria**:
  - [ ] 底部 TabBar 4 个 Tab 正确导航
  - [ ] 所有路由配置正确
  - [ ] 受保护路由未登录时重定向
  - [ ] TabBar 使用 glass-nav 毛玻璃效果

  **QA Scenarios**:

  ```
  Scenario: Tab navigation works
    Tool: Playwright
    Preconditions: Authenticated user
    Steps:
      1. Navigate to /
      2. Assert TabBar visible at bottom with 4 tabs
      3. Click "点餐" tab
      4. Assert URL is /order/create
      5. Click "许愿" tab
      6. Assert URL is /wishes
      7. Click "我的" tab
      8. Assert URL is /profile
    Expected Result: All tabs navigate correctly
    Evidence: .sisyphus/evidence/task-20-tabbar.png

  Scenario: Glass nav effect renders
    Tool: Playwright
    Steps:
      1. Navigate to /
      2. Take screenshot of bottom navigation area
      3. Assert TabBar has glass-nav CSS class or equivalent backdrop-filter style
    Expected Result: Translucent navigation bar visible
    Evidence: .sisyphus/evidence/task-20-glass-nav.png
  ```

  **Commit**: YES (group with T15-T19)

- [ ] 21. 后端 Hono 入口集成 + 通知触发

  **What to do**:
  - 更新 `backend/src/index.ts` — 集成所有路由模块：
    - 导入并 `.route()` 挂载所有路由: auth, recipes, images, tags, orders, wishes, favorites, cook-logs, ratings, families
    - 应用 CORS 中间件
    - 应用 auth 中间件到所有 `/api/*`（排除 /api/auth/register, /api/auth/login）
    - 添加全局错误处理中间件（catch Zod 校验错误返回 400，其他返回 500）
    - 确保 `export type AppType = typeof app` 正确导出（包含所有路由类型）
  - 在各路由中集成通知触发点：
    - `POST /api/orders` → `notifyNewOrder()`
    - `POST /api/recipes` → `notifyNewRecipe()`
    - `POST /api/wishes` → `notifyNewWish()`
  - 验证所有路由端点可通过 curl 访问
  - 启动命令: `@hono/node-server` 监听 PORT（默认 3000）

  **Must NOT do**:
  - 不遗漏任何路由模块的挂载
  - 不跳过 auth 中间件（除公开路由）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 集成所有模块，需仔细检查路由挂载和中间件应用
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Wave 2 全部完成)
  - **Parallel Group**: Wave 4 (with T22, T23, T24)
  - **Blocks**: T25 (后端部署), T26 (前端部署)
  - **Blocked By**: T5, T6, T7, T8, T9, T10, T11, T12, T13, T14

  **References**:
  - `私厨-技术方案.md` 第 478 行 — 后端入口文件
  - `私厨-技术方案.md` 第 296-377 行 — 所有 API 路由定义
  - `私厨-技术方案.md` 第 580-587 行 — 通知触发场景

  **Acceptance Criteria**:
  - [ ] 所有 10 个路由模块挂载到 Hono app
  - [ ] auth 中间件正确排除公开路由
  - [ ] 全局错误处理返回格式化错误
  - [ ] AppType 导出包含所有路由类型
  - [ ] 3 个通知触发点集成

  **QA Scenarios**:

  ```
  Scenario: All API endpoints accessible
    Tool: Bash (curl)
    Preconditions: Backend running with all modules
    Steps:
      1. Register + login to get session cookie
      2. curl GET /api/recipes → 200 (empty array)
      3. curl GET /api/tags → 200
      4. curl GET /api/orders → 200
      5. curl GET /api/wishes → 200
      6. curl GET /api/favorites → 200
      7. curl GET /api/cook-logs → 200
      8. curl GET /api/families/:id → 200
      9. curl GET /api/auth/me → 200
    Expected Result: All endpoints return 200 with correct shape
    Failure Indicators: 404 (route not mounted), 500 (integration error)
    Evidence: .sisyphus/evidence/task-21-integration.txt

  Scenario: Unauthenticated requests blocked (except public routes)
    Tool: Bash (curl)
    Steps:
      1. curl GET /api/recipes without cookie → 401
      2. curl POST /api/auth/login without cookie → 200/400 (not 401, it's public)
      3. curl POST /api/auth/register without cookie → 200/400 (not 401, it's public)
    Expected Result: Protected routes return 401, public routes accessible
    Evidence: .sisyphus/evidence/task-21-auth-guard.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): integrate all routes in Hono entry with notifications`
  - Files: backend/src/index.ts, route files (notification additions)
  - Pre-commit: `cd backend && npm run build && npx vitest run`

- [ ] 22. PWA 配置 — manifest + Service Worker

  **What to do**:
  - 更新 `frontend/vite.config.ts` — 添加 `vite-plugin-pwa` 配置：
    - `registerType: 'autoUpdate'`
    - manifest: name="私厨", short_name="私厨", theme_color="#F5F5F7", background_color="#F5F5F7", display="standalone"
    - icons: 192x192 + 512x512 (放在 frontend/public/icons/)
    - workbox 配置:
      - `/api/*` 使用 `NetworkFirst` 策略
      - 静态资源使用 `CacheFirst` 策略
      - 图片（COS URL）使用 `StaleWhileRevalidate`
  - 创建 PWA 图标占位（简单的彩色方块即可，后续替换）
  - 确保 `frontend/index.html` 包含 meta tags:
    - `<meta name="viewport" content="width=device-width, initial-scale=1">`
    - `<meta name="theme-color" content="#F5F5F7">`
    - `<link rel="apple-touch-icon" href="/icons/icon-192.png">`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocks**: -
  - **Blocked By**: T1

  **References**:
  - `私厨-技术方案.md` 第 105 行 — vite-plugin-pwa
  - `私厨-技术方案.md` 第 659 行 — Service Worker 对 /api/* 使用 NetworkFirst

  **Acceptance Criteria**:
  - [ ] manifest.webmanifest 生成在 dist/
  - [ ] Service Worker 注册成功
  - [ ] /api/* 使用 NetworkFirst 策略
  - [ ] PWA 图标存在

  **QA Scenarios**:

  ```
  Scenario: PWA manifest and SW exist in build output
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. ls dist/manifest.webmanifest
      3. ls dist/sw.js (or registerSW.js)
      4. cat dist/manifest.webmanifest | grep "私厨"
    Expected Result: manifest and SW present, app name correct
    Evidence: .sisyphus/evidence/task-22-pwa.txt
  ```

  **Commit**: YES (group with T24)
  - Message: `feat(infra): add PWA config and backup script`

- [ ] 23. 关键路径测试 — 认证+点餐

  **What to do**:
  - 配置 `backend/vitest.config.ts` — vitest 配置
  - 创建 `backend/src/__tests__/auth.test.ts` — 认证测试：
    - 测试注册流程（首个用户创建家庭 + 后续用户邀请码注册）
    - 测试登录（正确/错误密码）
    - 测试登出（session 清除）
    - 测试 auth 中间件（有/无 cookie）
    - 使用内存 SQLite 或临时文件 DB，每个测试前清空
  - 创建 `backend/src/__tests__/orders.test.ts` — 点餐测试：
    - 测试创建点餐单（事务完整性）
    - 测试状态流转（pending → confirmed → completed）
    - 测试非法状态回退（completed → pending 被拒绝）
    - 测试 family_id 隔离（不能看到其他家庭的订单）
  - 测试工具: 创建 `backend/src/__tests__/helpers.ts`：
    - 初始化测试 DB
    - 创建测试用户/家庭的 helper
    - 发送认证请求的 helper（自动携带 cookie）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 测试认证安全和数据隔离，需要深度理解业务逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4，与 T21, T22, T24 并行)
  - **Parallel Group**: Wave 4
  - **Blocks**: -
  - **Blocked By**: T6 (认证路由), T10 (点餐路由)

  **References**:
  - `私厨-技术方案.md` 第 83-93 行 — 认证流程（测试场景来源）
  - `私厨-技术方案.md` 第 363-369 行 — 点餐 API（测试场景来源）

  **Acceptance Criteria**:
  - [ ] `npx vitest run` 全部通过
  - [ ] 认证测试覆盖: 注册、登录、登出、中间件
  - [ ] 点餐测试覆盖: 创建、状态流转、family 隔离
  - [ ] 每个测试使用独立 DB（无状态污染）

  **QA Scenarios**:

  ```
  Scenario: All tests pass
    Tool: Bash
    Steps:
      1. cd backend && npx vitest run --reporter=verbose
      2. Assert exit code 0
      3. Count passed/failed tests
    Expected Result: All tests pass, 0 failures
    Failure Indicators: Any test failure, timeout
    Evidence: .sisyphus/evidence/task-23-tests.txt
  ```

  **Commit**: YES
  - Message: `test: add auth and order critical path tests`
  - Files: backend/vitest.config.ts, backend/src/__tests__/*
  - Pre-commit: `cd backend && npx vitest run`

- [ ] 24. 备份脚本

  **What to do**:
  - 创建 `backend/scripts/backup.sh` — SQLite 备份到 COS：
    - 使用 sqlite3 `.backup` 命令安全备份（不锁表）
    - 使用 coscli 上传到 COS
    - 保留最近 30 天备份
    - 完全参照技术方案第 9.4 节的脚本
  - 确保脚本有执行权限 (`chmod +x`)
  - 添加 cron 配置说明（注释形式，实际配置在部署阶段执行）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocks**: -
  - **Blocked By**: T4

  **References**:
  - `私厨-技术方案.md` 第 544-568 行 — 完整备份脚本

  **Acceptance Criteria**:
  - [ ] backup.sh 可执行
  - [ ] 脚本包含安全备份、上传、清理三步
  - [ ] 保留 30 天备份

  **QA Scenarios**:

  ```
  Scenario: Backup script has correct structure
    Tool: Bash
    Steps:
      1. cat backend/scripts/backup.sh
      2. grep ".backup" backend/scripts/backup.sh
      3. grep "coscli" backend/scripts/backup.sh
      4. grep "head -n -30" backend/scripts/backup.sh
      5. test -x backend/scripts/backup.sh
    Expected Result: Script contains backup, upload, cleanup commands and is executable
    Evidence: .sisyphus/evidence/task-24-backup.txt
  ```

  **Commit**: YES (group with T22)

- [ ] 25. 后端部署配置 — PM2 + Cloudflare Tunnel

  **What to do**:
  - 创建 `backend/ecosystem.config.js` — PM2 配置：
    - name: "private-chef-api"
    - script: "dist/index.js"
    - env_production: NODE_ENV=production
    - 日志路径配置
  - 创建 `backend/cloudflared-config.yml` — Cloudflare Tunnel 配置模板：
    - 指向 localhost:3000
    - 配置说明注释
  - 更新 `backend/package.json` — 添加 `start` 和 `deploy` 脚本：
    - `start`: `pm2 start ecosystem.config.js --env production`
    - `build`: 确保编译到 dist/
  - 创建 `backend/Dockerfile` (可选，备用) — 或简单部署脚本 `backend/scripts/deploy.sh`：
    - SSH 到服务器
    - git pull + npm install + npm run build + pm2 restart

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及部署配置和服务器环境
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 5，与 T26 并行)
  - **Parallel Group**: Wave 5
  - **Blocks**: -
  - **Blocked By**: T21 (后端集成)

  **References**:
  - `私厨-技术方案.md` 第 499-528 行 — 服务器初始化和后端部署
  - `私厨-技术方案.md` 第 129-138 行 — 部署方案

  **Acceptance Criteria**:
  - [ ] PM2 ecosystem.config.js 配置正确
  - [ ] Cloudflare Tunnel 配置模板就绪
  - [ ] 部署脚本可执行

  **QA Scenarios**:

  ```
  Scenario: PM2 config valid
    Tool: Bash
    Steps:
      1. cd backend && node -e "const c=require('./ecosystem.config.js'); console.log(JSON.stringify(c))"
      2. Assert output contains "private-chef-api"
      3. Assert output contains "dist/index.js"
    Expected Result: PM2 config parseable and correct
    Evidence: .sisyphus/evidence/task-25-pm2.txt
  ```

  **Commit**: YES (group with T26)
  - Message: `feat(deploy): add PM2 ecosystem and Cloudflare config`

- [ ] 26. 前端部署配置 — Cloudflare Pages

  **What to do**:
  - 创建 `frontend/wrangler.toml` (或 Cloudflare Pages 配置)：
    - 项目名称
    - 构建命令: `npm run build`
    - 输出目录: `dist`
  - 更新 `frontend/vite.config.ts` — 确保构建输出适合 Cloudflare Pages：
    - base: '/' (根路径)
    - SPA fallback: `_redirects` 文件（/* → /index.html 200）
  - 创建 `frontend/public/_redirects` — SPA 路由 fallback：
    - `/* /index.html 200`
  - 更新 `frontend/src/lib/api.ts` — API base URL 指向后端域名：
    - 开发环境: proxy (vite.config.ts)
    - 生产环境: `https://api.yourdomain.top` (从 env 读取)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 5, with T25)
  - **Blocks**: -
  - **Blocked By**: T20 (路由配置), T21 (后端集成)

  **References**:
  - `私厨-技术方案.md` 第 533-539 行 — 前端部署

  **Acceptance Criteria**:
  - [ ] _redirects 文件存在于 public/
  - [ ] API base URL 支持环境切换
  - [ ] `npm run build` 输出正确

  **QA Scenarios**:

  ```
  Scenario: SPA redirect file in build output
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. cat dist/_redirects
      3. Assert content is "/* /index.html 200"
    Expected Result: _redirects file present with SPA rule
    Evidence: .sisyphus/evidence/task-26-redirects.txt
  ```

  **Commit**: YES (group with T25)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns (as any, ts-ignore, localStorage token, etc.) — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` in both frontend/ and backend/. Run `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify all SQL queries are parameterized. Check N+1 patterns.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (fresh DB). Execute complete user flow: register first user → create family → get invite code → register second user with invite code → create recipe with images → browse recipes → filter by tag → add to favorites → create order → submit wish → rate cook log → verify WeChat notification logic. Capture screenshots for each step.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual files. Verify 1:1 match — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes. Specifically verify NO phase-2 features exist (家庭广场, AI许愿, 分享卡片).
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Tasks | Message | Files | Pre-commit |
|---|---|---|---|
| T1 | `chore: init monorepo scaffolding with frontend and backend` | all config files | `npm run build` both |
| T2 | `feat(db): add Drizzle schema and migrations for 13 tables` | backend/src/db/*, drizzle/* | `npx tsc --noEmit` |
| T3 | `feat(ui): init shadcn/ui components with Apple-style theme` | frontend/src/components/ui/*, globals.css | `npm run build` |
| T4+T5 | `feat(infra): add COS presign util and WeChat webhook module` | backend/src/lib/* | `npx tsc --noEmit` |
| T6 | `feat(auth): implement Lucia v3 session auth with invite codes` | backend/src/routes/auth.ts, middleware/*, lib/lucia.ts | `npx vitest run` |
| T7+T8+T9 | `feat(api): add recipe CRUD, tags, and image upload routes` | backend/src/routes/recipes,tags,images.ts | `npx tsc --noEmit` |
| T10+T11+T12 | `feat(api): add order, wish, and favorites routes` | backend/src/routes/orders,wishes,favorites.ts | `npx tsc --noEmit` |
| T13+T14 | `feat(api): add cook logs, ratings, and family management routes` | backend/src/routes/cook-logs,ratings,families.ts | `npx tsc --noEmit` |
| T15-T20 | `feat(frontend): implement all pages with Apple-style UI` | frontend/src/pages/*, components/*, hooks/* | `npm run build` |
| T21 | `feat(backend): integrate all routes in Hono entry with notifications` | backend/src/index.ts | `npm run build && npx vitest run` |
| T22+T24 | `feat(infra): add PWA config and backup script` | frontend/vite.config.ts, backend/scripts/* | `npm run build` |
| T23 | `test: add auth and order critical path tests` | backend/src/__tests__/* | `npx vitest run` |
| T25+T26 | `feat(deploy): add PM2 ecosystem and Cloudflare Pages config` | ecosystem.config.js, wrangler.toml | - |

---

## Success Criteria

### Verification Commands
```bash
cd backend && npm run build        # Expected: clean compilation
cd frontend && npm run build       # Expected: dist/ with index.html + assets
cd backend && npx vitest run       # Expected: all tests pass
curl -s http://localhost:3000/api/auth/me | jq .  # Expected: 401 unauthorized
ls frontend/dist/manifest.webmanifest  # Expected: file exists
ls frontend/dist/sw.js                 # Expected: service worker exists
```

### Final Checklist
- [ ] 所有 13 张数据表已通过 Drizzle 迁移创建
- [ ] 所有 ~30 个 API 端点已实现并返回正确状态码
- [ ] 认证系统完整：注册（邀请码）、登录、登出、会话管理
- [ ] 图片走 COS 预签名直传，不经后端
- [ ] 企微通知逻辑含限流处理
- [ ] 前端 13 个页面组件全部实现
- [ ] PWA manifest + Service Worker 配置完成
- [ ] Apple 风 UI：毛玻璃 + 大圆角 + 柔和阴影 + @supports 降级
- [ ] 后端部署配置（PM2 ecosystem）就绪
- [ ] 前端部署配置（Cloudflare Pages）就绪
- [ ] 备份脚本编写完成
- [ ] 所有路由强制 familyId 鉴权，无 IDOR 漏洞
- [ ] 零 `as any` / `@ts-ignore` / `localStorage` token
