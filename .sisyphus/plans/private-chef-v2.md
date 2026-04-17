# 私厨 V2 开发计划

## TL;DR

> **Quick Summary**: 将私厨从"家庭菜谱工具"升级为"以订单为核心的家庭私厨协作产品"，分 P0/P1/P2 三期落地。P0 打通主链路（TabBar 改版 + 订单详情页 + 通知落库），P1 实现互动能力（评论/评价/点赞），P2 完成家庭活跃机制（首页聚合/成就）。
>
> **Deliverables**:
> - 新 TabBar：首页/点菜/订单/我的
> - 新路由：`/menu` 点菜页、`/orders/:id` 订单详情页
> - 下单成功后跳转到订单详情
> - RecipeForm 上传解耦（菜品创建成功与图片上传状态分开）
> - 后端：`order_status_events`、`order_comments`、`order_reviews`、`order_likes`、`order_shares` 五张新表
> - 通知系统升级：事件落库 + 异步投递，替代纯内存队列
> - 订单详情 API 聚合增强
> - P1：评论/评价/点赞/分享 API 与前端
> - P2：首页聚合 API、我的页聚合 API、成就页
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 4 波次
> **Critical Path**: T1(DB迁移) → T2(通知服务) → T4(订单 API 增强) → T8(P1 互动表) → T10/T11/T12(互动 API) → T14(useOrderInteractions) → T13(订单详情互动 UI) → T15/T16/T17(P2 聚合 API) → T18/T19/T20(P2 前端) → F1-F4

---

## Context

### Original Request
将 `私厨-V2技术总方案.md` 拆成多个可独立执行的任务，建立任务进度管理文件，支持多窗口并行开发，完成后可标记，依赖追踪。

### 现有代码现状
- **执行前对齐规则**：以下为 V2 启动时的基线。若当前分支已经出现部分 V2 改动（例如 T1/T3 雏形），先以仓库现状做核验与收口，再决定是否直接标记完成。
- **前端路由** (`frontend/src/App.tsx`): `/`, `/orders`, `/order/create`, `/wishes`, `/favorites`, `/profile`, `/recipe/*`
- **TabBar** (`frontend/src/pages/layout/TabBar.tsx`): 首页/点餐/许愿/我的 四项，指向 `/order/create`
- **订单现状** (`frontend/src/hooks/useOrders.ts`): OrderStatus = `pending|confirmed|completed`，无 `cookUserId`，无 statusTimeline
- **后端订单路由** (`backend/src/routes/orders.ts`): GET/POST/GET:id/PUT:id/status，状态只有 pending→confirmed→completed
- **通知** (`backend/src/lib/wechat.ts`): 纯内存队列，无持久化，直接 webhook 广播
- **Schema** (`backend/src/db/schema.ts`): 无 `order_status_events`/`order_comments`/`order_reviews`/`order_likes`/`order_shares`/`notification_events`/`notification_deliveries`
- **后端路由文件**: auth, cook-logs, families, favorites, images, orders, ratings, recipes, tags, wishes（无 home/profile/achievements）

### Metis Review (内置分析)
**识别的关键约束**:
- DB 迁移必须用 Drizzle migration，保持与现有 schema.ts 一致
- `familyId` 边界：所有新接口必须校验 familyId
- 前端 `OrderStatus` 类型需同步扩展（影响多处 useOrders.ts）
- 通知系统升级需要先有 notification_events 表，再改 wechat.ts 逻辑
- P0 不引入评论/评价表，P1 才引入

---

## Work Objectives

### Core Objective
分三期（P0/P1/P2）将私厨升级为以订单为核心的协作产品，每期独立可交付。

### Must Have (P0)
- TabBar 改为：首页/点菜/订单/我的
- 新增 `/menu` 页（点菜入口，可复用现有 OrderCreate 逻辑或新建）
- 新增 `/orders/:id` 订单详情页
- 下单成功 → `navigate('/orders/${id}')`
- `orders` 表加 `cook_user_id`, `completed_at`, `cancelled_at`
- 新增 `order_status_events` 表 + Drizzle schema
- 订单状态扩展：submitted/confirmed/preparing/completed/cancelled
- 通知改为事件落库 + 异步投递（notification_events 表）
- `GET /api/orders/:id` 聚合增强（含 requester/items/timeline）
- RecipeForm 图片上传解耦（菜品创建成功与上传状态分开表达）

### Must Have (P1)
- `order_comments` / `order_reviews` / `order_likes` / `order_shares` 表
- 评论 API: GET/POST `/api/orders/:id/comments`
- 评价 API: GET/POST `/api/orders/:id/reviews`
- 点赞 API: POST/DELETE `/api/orders/:id/like`
- 分享 API: POST `/api/orders/:id/share`
- 订单详情页增加评论区、评价区、点赞/分享按钮
- "再来一单"按钮

### Must Have (P2)
- `GET /api/home/summary` 首页聚合接口
- `GET /api/profile/summary` 我的页聚合接口
- `GET /api/achievements/summary` + leaderboard
- HomeV2 前端（聚合首页）
- ProfileV2 前端（个人资产聚合页）
- 成就页前端

### Must NOT Have (Guardrails)
- 不推翻现有 Drizzle schema 中已有的表（只 ALTER/新增）
- 不引入除 React Query 外的全局状态库
- 不把图片上传失败等同于菜品保存失败
- 不跳过 `/orders/:id` 详情页，下单后必须跳过去
- 不破坏 familyId 访问边界（所有新接口都要 authMiddleware）
- 不把 V2 评论塞进 `ratings` / `cook_logs` 表语义里
- 不在 P0 就引入复杂的成就统计逻辑

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest，`backend/vitest.config.ts`；前端无独立测试配置)
- **Automated tests**: Tests-after（后端新路由写 vitest 测试，前端以 QA Scenarios 为主）
- **Framework**: vitest (backend)
- **Agent-Executed QA**: Playwright (frontend UI), curl (API), Bash (DB check)

### QA Policy
每个任务必须包含 agent 可执行的 QA Scenarios，证据保存到 `.sisyphus/evidence/task-{N}-{slug}.{ext}`。

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 — P0 基础设施 (可立即并行，互不依赖):
├── T1: DB Schema 扩展 + Drizzle migration [backend, quick]
├── T2: 通知系统升级（notification_events 表 + 服务层重构）[backend, unspecified-high]
└── T3: TabBar + 路由结构改版（前端导航骨架）[frontend, quick]

Wave 2 — P0 核心功能 (依赖 Wave 1):
├── T4: 订单 API 增强（状态扩展 + order_status_events + GET:id 聚合）[backend, unspecified-high] (依赖 T1, T2)
├── T5: RecipeForm 图片上传解耦 [frontend, unspecified-high] (依赖 T3)
└── T6: MenuPage（点菜页 `/menu`）[frontend, unspecified-high] (依赖 T3)

Wave 3 — P0 收尾 + P1 基础 (依赖 Wave 2):
├── T7: 订单详情页 OrderDetailV2（`/orders/:id`）[frontend, visual-engineering] (依赖 T4, T3)
├── T8: P1 互动 DB Schema（order_comments/reviews/likes/shares）+ Drizzle migration [backend, quick] (依赖 T1)
└── T9: CreateOrderV2（下单成功跳转 + 兼容旧路由）[frontend, quick] (依赖 T6, T4)

Wave 4 — P1 互动能力 (依赖 Wave 3):
├── T10: 评论 API（GET/POST `/api/orders/:id/comments`）[backend, unspecified-high] (依赖 T8)
├── T11: 评价 API（GET/POST `/api/orders/:id/reviews`）[backend, unspecified-high] (依赖 T8)
└── T12: 点赞/分享 API（like/unlike/share）[backend, unspecified-high] (依赖 T8)

Wave 5 — P1 前端互动 (依赖 Wave 4):
├── T13: 订单详情页增加评论/评价/点赞/分享/再来一单 [frontend, visual-engineering] (依赖 T10, T11, T12, T7)
└── T14: useOrderInteractions hooks（评论/评价/点赞 query+mutation）[frontend, quick] (依赖 T10, T11, T12)

Wave 6 — P2 聚合层 (依赖 Wave 5):
├── T15: 首页聚合 API（`GET /api/home/summary`）[backend, unspecified-high] (依赖 T4, T10)
├── T16: 我的页聚合 API（`GET /api/profile/summary`）[backend, unspecified-high] (依赖 T4, T10, T11, T12)
└── T17: 成就 API（summary + leaderboard）[backend, unspecified-high] (依赖 T8, T10, T11, T12)

Wave 7 — P2 前端 (依赖 Wave 6):
├── T18: HomeV2 前端（首页聚合重构）[frontend, visual-engineering] (依赖 T15)
├── T19: ProfileV2 前端（我的页聚合重构）[frontend, visual-engineering] (依赖 T16)
└── T20: 成就页前端 [frontend, visual-engineering] (依赖 T17)

Wave FINAL — 全面验收 (依赖所有任务完成):
├── F1: 计划合规审计 [oracle]
├── F2: 代码质量审查 [unspecified-high]
├── F3: 真实 QA 执行 [unspecified-high + playwright]
└── F4: 范围保真检查 [deep]
→ 展示结果 → 等待用户明确 OK
```

**建议开发窗口配置（P0 阶段）**:
- **窗口 A**: 后端（T1 → T2 → T4 → T8 → T10 → T11 → T12 → T15 → T16 → T17）
- **窗口 B**: 前端（T3 → T5 → T6 → T7 → T9 → T14 → T13 → T18 → T19 → T20）
- 两个窗口可同时启动 Wave 1 各自的任务，Wave 2 开始后窗口 A 先完成 T4 才能解锁窗口 B 的 T7

**Critical Path**: T1 → T4 → T8 → T10 → T15 → T18 → F1-F4

### Dependency Matrix

| Task | 依赖 | 被依赖 |
|------|------|--------|
| T1 | — | T4, T8 |
| T2 | — | T4 |
| T3 | — | T5, T6, T7, T9 |
| T4 | T1, T2 | T7, T9, T10(间接), T15, T16 |
| T5 | T3 | — |
| T6 | T3 | T9 |
| T7 | T4, T3 | T13 |
| T8 | T1 | T10, T11, T12, T17 |
| T9 | T6, T4 | — |
| T10 | T8 | T13, T14, T15, T16 |
| T11 | T8 | T13, T14, T16, T17 |
| T12 | T8 | T13, T14, T16, T17 |
| T13 | T10, T11, T12, T7 | — |
| T14 | T10, T11, T12 | T13 |
| T15 | T4, T10 | T18 |
| T16 | T4, T10, T11, T12 | T19 |
| T17 | T8, T10, T11, T12 | T20 |
| T18 | T15 | F3 |
| T19 | T16 | F3 |
| T20 | T17 | F3 |

---

## TODOs

---

- [ ] T1. DB Schema 扩展 + Drizzle migration (P0)

  **What to do**:
  1. 在 `backend/src/db/schema.ts` 中扩展 `orders` 表，新增字段：`cookUserId` (INTEGER, REFERENCES users.id)、`completedAt` (TEXT)、`cancelledAt` (TEXT)
  2. 新增 `orderStatusEvents` 表（含 id, orderId, fromStatus, toStatus, operatorId, note, createdAt）
  3. 新增 `notificationEvents` 表（含 id, familyId, eventType, entityType, entityId, payload, status, createdAt, sentAt, lastError）
  4. 新增 `notificationDeliveries` 表（含 id, notificationId, targetUserId, channel, status, attemptCount, lastError, createdAt, updatedAt）
  5. 运行 `npm run db:generate` 生成 Drizzle migration 文件
  6. 运行 `npm run db:migrate` 应用迁移
  7. 导出所有新类型（`OrderStatusEvent`, `NotificationEvent`, `NotificationDelivery`）

  **Must NOT do**:
  - 不删除或重命名现有字段（只 ADD）
  - 不修改现有表的约束
  - 不引入不兼容 SQLite 的语法

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯 schema 定义 + migration，模式固定，无复杂逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（与 T2、T3 同时）
  - **Blocks**: T4, T8
  - **Blocked By**: None（可立即开始）

  **References**:

  **Pattern References**:
  - `backend/src/db/schema.ts:204-233` — 现有 `orders` + `orderItems` 表定义模式，新字段用同样的 Drizzle DSL 风格
  - `backend/src/db/schema.ts:156-179` — `ratings` 表展示 `check` 约束写法
  - `backend/src/db/schema.ts:40-56` — `familyMembers` 展示 `primaryKey` 和外键写法
  - `backend/drizzle/0000_known_kinsey_walden.sql` — 查看现有 migration 文件格式作为参考
  - `backend/drizzle.config.ts` — migration 配置，确认 generate/migrate 命令路径

  **API/Type References**:
  - `私厨-V2技术总方案.md` 三、3.1～3.2 节 — orders 扩展字段和 order_status_events DDL
  - `私厨-V2技术总方案.md` 十、3 节 — notification_events + notification_deliveries DDL

  **Acceptance Criteria**:

  - [ ] `backend/src/db/schema.ts` 包含 `orderStatusEvents`, `notificationEvents`, `notificationDeliveries` 三个新表定义
  - [ ] `orders` 表新增 `cookUserId`, `completedAt`, `cancelledAt` 字段
  - [ ] 新 Drizzle migration 文件生成到 `backend/drizzle/` 目录
  - [ ] `npm run db:migrate` 执行成功（0 errors）
  - [ ] TypeScript 编译通过：`cd backend && npm run build`（0 errors）

  **QA Scenarios**:

  ```
  Scenario: 验证新表已创建
    Tool: Bash
    Preconditions: 迁移已运行
    Steps:
      1. sqlite3 /Users/weilan/ali/ai/cook/private-chef/backend/data/private-chef.db ".tables"
      2. 确认输出包含: order_status_events notification_events notification_deliveries
      3. sqlite3 ... "PRAGMA table_info(orders);" 确认包含 cook_user_id, completed_at, cancelled_at
    Expected Result: 所有新表和字段存在
    Evidence: .sisyphus/evidence/task-T1-db-tables.txt

  Scenario: 构建不报错
    Tool: Bash
    Preconditions: schema.ts 修改完毕
    Steps:
      1. cd backend && npm run build
      2. 检查 exit code = 0，无 TypeScript 错误
    Expected Result: Build succeeded with 0 errors
    Evidence: .sisyphus/evidence/task-T1-build.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add order_status_events and notification tables, extend orders schema`
  - Files: `backend/src/db/schema.ts`, `backend/drizzle/*.sql`, `backend/drizzle/meta/*.json`

---

- [ ] T2. 通知系统升级（notification_events 落库 + 异步投递重构）(P0)

  **What to do**:
  1. 新建 `backend/src/services/notification-service.ts`，实现：
     - `createNotificationEvent(db, { familyId, eventType, entityType, entityId, payload })` — 写入 `notification_events` 表，status='pending'
     - `deliverPendingEvents()` — 查询 status='pending' 的事件，生成 `notification_deliveries` 记录，调用 wechat webhook，更新 status 和 sentAt
     - 异步队列用 setTimeout/setInterval（不引入新依赖）
  2. 修改 `backend/src/lib/wechat.ts`：保留现有 `notify()` 函数（向下兼容），但将 `notifyNewOrder` 改为调用 `createNotificationEvent`，不再直接推内存队列
  3. 在 `notificationDeliveries` 中记录投递结果（成功/失败/lastError）
  4. payload JSON 字段中必须包含 `orderId` 字段（为未来 deeplink 预留）

  **Must NOT do**:
  - 不引入 Redis、Bull 等重型队列库
  - 不删除现有 `notify()` 函数（其他地方可能还在用）
  - P0 阶段不实现重试循环（记录失败即可）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要理解现有 wechat.ts 实现 + 设计新服务层，涉及异步投递和数据库写入
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（与 T1、T3 同时，但 T2 实际需要 T1 完成后才能用新表；可先写服务层代码，T1 完成后再运行）
  - **Blocks**: T4
  - **Blocked By**: T1（需要 notificationEvents 表）

  **References**:

  **Pattern References**:
  - `backend/src/lib/wechat.ts:1-83` — 现有通知实现全文，需理解内存队列逻辑再重构
  - `backend/src/routes/orders.ts:195` — `notifyNewOrder(user.displayName, meal_type, recipeTitles)` 调用点，需同步修改
  - `backend/src/db/schema.ts`（T1 完成后）— notificationEvents, notificationDeliveries 表类型

  **API/Type References**:
  - `私厨-V2技术总方案.md` 十、3-5 节 — 通知事件表设计、触发时机、实施策略

  **Acceptance Criteria**:

  - [ ] `backend/src/services/notification-service.ts` 文件存在
  - [ ] 下单时 `notification_events` 表有新记录写入（event_type='order_created'）
  - [ ] `notification_events.payload` JSON 包含 `orderId` 字段
  - [ ] 投递成功后 `notification_deliveries.status = 'sent'`
  - [ ] TypeScript 编译通过

  **QA Scenarios**:

  ```
  Scenario: 下单后通知事件落库
    Tool: Bash (curl + sqlite3)
    Preconditions: 后端运行中，T1 已完成
    Steps:
      1. curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"meal_type":"lunch","meal_date":"2026-04-15","items":[{"recipe_id":1,"quantity":1}]}' -b "session=test"
      2. sqlite3 .../private-chef.db "SELECT * FROM notification_events ORDER BY id DESC LIMIT 1;"
      3. 确认 event_type='order_created', status 为 'pending' 或 'sent'
      4. 确认 payload JSON 包含 orderId
    Expected Result: notification_events 有新记录，payload 含 orderId
    Evidence: .sisyphus/evidence/task-T2-notification-db.txt

  Scenario: 内存队列降级（WECHAT_WEBHOOK_URL 未配置时不崩溃）
    Tool: Bash
    Preconditions: 临时注释 WECHAT_WEBHOOK_URL 环境变量
    Steps:
      1. 触发下单请求
      2. 检查后端日志无 uncaught exception
      3. notification_events 仍写入，status='pending' 或 lastError 有记录
    Expected Result: 服务不崩溃，事件已落库
    Evidence: .sisyphus/evidence/task-T2-notification-fallback.txt
  ```

  **Commit**: YES
  - Message: `feat(notification): upgrade to event-sourced async delivery system`
  - Files: `backend/src/services/notification-service.ts`, `backend/src/lib/wechat.ts`, `backend/src/routes/orders.ts`

---

- [ ] T3. TabBar + 路由结构改版（前端导航骨架）(P0)

  **What to do**:
  1. 修改 `frontend/src/pages/layout/TabBar.tsx`：
     - 将四个 tab 改为：首页(`/`)、点菜(`/menu`)、订单(`/orders`)、我的(`/profile`)
     - 图标：Home / Utensils / ClipboardList / User（ClipboardList 来自 lucide-react）
  2. 修改 `frontend/src/App.tsx`：
     - 新增路由 `/menu`（指向新的 MenuPage，暂可先用占位组件）
     - 新增路由 `/orders/:id`（指向新的 OrderDetailV2，暂可先用占位组件）
     - 保留旧路由 `/order/create`（重定向到 `/menu` 或保持兼容）
     - 删除 `/wishes` 从 TabBar（保留路由，只是不在 TabBar 显示）
  3. 创建占位页 `frontend/src/pages/menu/MenuPage.tsx`（仅显示"点菜页（开发中）"文本，供 T6 填充）
  4. 创建占位页 `frontend/src/pages/order/OrderDetailV2.tsx`（仅显示"订单详情（开发中）"，供 T7 填充）

  **Must NOT do**:
  - 不删除 `/wishes` 路由（只从 TabBar 移除）
  - 不修改现有页面组件内容（只改导航和路由）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯导航文件改动，逻辑简单，2个文件
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（与 T1、T2 同时）
  - **Blocks**: T5, T6, T7, T9
  - **Blocked By**: None（可立即开始）

  **References**:

  **Pattern References**:
  - `frontend/src/pages/layout/TabBar.tsx:1-43` — 现有 TabBar 全文，直接在此基础上修改
  - `frontend/src/App.tsx:1-41` — 现有路由配置全文，新增路由在此文件
  - `frontend/src/pages/order/OrderList.tsx` — 参考现有页面文件结构作为占位组件模板

  **Acceptance Criteria**:

  - [ ] TabBar 显示：首页/点菜/订单/我的（不再有"许愿"）
  - [ ] 点击"点菜"跳转到 `/menu`，不是 `/order/create`
  - [ ] 点击"订单"跳转到 `/orders`
  - [ ] `/orders/:id` 路由可访问（显示占位内容，不 404）
  - [ ] 旧路由 `/order/create` 仍可访问（不报错）

  **QA Scenarios**:

  ```
  Scenario: TabBar 导航正确
    Tool: Playwright
    Preconditions: 前端开发服务器运行中，已登录
    Steps:
      1. page.goto('http://localhost:5173/')
      2. page.locator('nav a').filter({ hasText: '点菜' }).click()
      3. expect(page.url()).toContain('/menu')
      4. page.locator('nav a').filter({ hasText: '订单' }).click()
      5. expect(page.url()).toContain('/orders')
      6. page.locator('nav a[href="/"]').click()
      7. expect(page.url()).toBe('http://localhost:5173/')
    Expected Result: 所有 tab 跳转正确
    Evidence: .sisyphus/evidence/task-T3-tabbar.png

  Scenario: 旧路由兼容
    Tool: Playwright
    Preconditions: 前端运行中
    Steps:
      1. page.goto('http://localhost:5173/order/create')
      2. 确认不显示 404 页面（有内容渲染）
    Expected Result: /order/create 仍可访问
    Evidence: .sisyphus/evidence/task-T3-compat.png
  ```

  **Commit**: YES
  - Message: `feat(nav): update TabBar to 首页/点菜/订单/我的 with new routes`
  - Files: `frontend/src/pages/layout/TabBar.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/menu/MenuPage.tsx`, `frontend/src/pages/order/OrderDetailV2.tsx`

---

- [ ] T4. 订单 API 增强（状态扩展 + order_status_events + GET:id 聚合）(P0)

  **What to do**:
  1. 修改 `backend/src/routes/orders.ts`：
     - 扩展 `VALID_TRANSITIONS`：`submitted→confirmed→preparing→completed`，旧 `pending` 映射到 `submitted`（兼容层）
     - 扩展 `KNOWN_STATUSES`：加入 submitted/preparing/cancelled
     - `POST /api/orders`：创建后写入首条 `order_status_events`（from_status=null, to_status='submitted'）；调用 `createNotificationEvent`（event_type='order_created'）
     - `PUT /api/orders/:id/status`：更新后写入 `order_status_events`；调用 `createNotificationEvent`
     - `GET /api/orders/:id`：聚合返回增强，包含 requester（userId, displayName）、cook（cookUserId, displayName，可为 null）、items、statusTimeline（order_status_events 列表）
  2. 修改 `backend/src/db/schema.ts` 中 `orders.status` 默认值从 'pending' 改为 'submitted'
  3. 更新 `updateStatusSchema`：status enum 加入 `preparing`、`cancelled`
  4. 确保所有查询带 `familyId` 过滤

  **Must NOT do**:
  - 不破坏现有 GET /api/orders（列表接口）的返回格式（只能扩展字段，不能删除）
  - 不移除 `pending` 状态的处理（向后兼容旧数据）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 多处 SQL 查询修改 + 状态机扩展 + 聚合 JOIN 查询
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（串行）
  - **Parallel Group**: Wave 2
  - **Blocks**: T7, T9, T15, T16
  - **Blocked By**: T1（需要 order_status_events 表）、T2（需要 notification-service.ts）

  **References**:

  **Pattern References**:
  - `backend/src/routes/orders.ts:1-342` — 现有 orders 路由全文，在此基础上修改
  - `backend/src/routes/orders.ts:39-44` — `VALID_TRANSITIONS` 状态机定义，需扩展
  - `backend/src/routes/orders.ts:173-189` — SQLite transaction 写法，新增 order_status_events 写入在此 transaction 内
  - `backend/src/db/schema.ts:204-233` — orders + orderItems 表定义
  - `backend/src/services/notification-service.ts` (T2 完成后) — createNotificationEvent 函数签名

  **API/Type References**:
  - `私厨-V2技术总方案.md` 七、2 节 — V2 状态模型和兼容策略
  - `私厨-V2技术总方案.md` 九、1 节 — GET /api/orders/:id 返回结构设计

  **Acceptance Criteria**:

  - [ ] `GET /api/orders/:id` 返回包含 `statusTimeline` 数组字段
  - [ ] `GET /api/orders/:id` 返回包含 `requester.displayName` 字段
  - [ ] `POST /api/orders` 后 `order_status_events` 表有一条新记录
  - [ ] `PUT /api/orders/:id/status` 后 `order_status_events` 表有新记录
  - [ ] 旧 `GET /api/orders` 列表接口返回格式不变
  - [ ] TypeScript 编译通过

  **QA Scenarios**:

  ```
  Scenario: 下单后订单详情包含 timeline
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录（有 session cookie），T1 T2 完成
    Steps:
      1. ORDER_ID=$(curl -s -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -b "cookie.txt" -d '{"meal_type":"dinner","meal_date":"2026-04-15","items":[{"recipe_id":1,"quantity":1}]}' | jq '.id')
      2. curl -s http://localhost:3000/api/orders/$ORDER_ID -b "cookie.txt" | jq '.statusTimeline'
      3. 确认返回数组长度 >= 1，第一条 to_status='submitted'
      4. jq '.requester.displayName' 确认返回非 null 字符串
    Expected Result: statusTimeline 含初始事件，requester.displayName 存在
    Evidence: .sisyphus/evidence/task-T4-order-detail.json

  Scenario: 状态流转写入 timeline
    Tool: Bash (curl)
    Preconditions: 存在 status='submitted' 的订单
    Steps:
      1. curl -s -X PUT http://localhost:3000/api/orders/$ORDER_ID/status -H "Content-Type: application/json" -b "cookie.txt" -d '{"status":"confirmed"}'
      2. curl -s http://localhost:3000/api/orders/$ORDER_ID -b "cookie.txt" | jq '.statusTimeline | length'
      3. 确认 timeline 长度为 2
    Expected Result: 状态变更写入 timeline，长度增加
    Evidence: .sisyphus/evidence/task-T4-status-timeline.json
  ```

  **Commit**: YES
  - Message: `feat(orders): extend status model, add timeline events, enhance GET :id aggregation`
  - Files: `backend/src/routes/orders.ts`, `backend/src/db/schema.ts`

---

- [ ] T5. RecipeForm 图片上传解耦 (P0)

  **What to do**:
  1. 修改 `frontend/src/pages/recipe/RecipeForm.tsx`：
     - 拆分为两阶段：Phase 1（提交 recipe 元数据，成功后显示"菜品创建成功"Banner）；Phase 2（异步上传图片，每张独立状态）
     - 图片上传状态类型：`'idle' | 'compressing' | 'presigning' | 'uploading' | 'saving' | 'success' | 'error'`
     - 单张图片失败显示"重试"按钮，不影响其他图片状态
     - 整体页面不因图片失败而回滚到"创建失败"状态
  2. 新建 `frontend/src/components/recipe/RecipeUploadQueue.tsx` — 渲染上传队列，每项展示进度/状态/重试按钮
  3. 新建 `frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx` — 菜品创建成功提示（带"继续补图"和"去浏览"两个 CTA）
  4. 修改 `frontend/src/lib/upload.ts`（如需）：确认上传函数可逐张调用

  **Must NOT do**:
  - 不改变 POST /api/recipes 的调用方式
  - 不把图片失败的错误提示做成全屏错误页

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要重构现有 RecipeForm 状态机，涉及多图异步状态管理
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 上传进度 UI、状态指示器的视觉设计

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T4 并行）
  - **Parallel Group**: Wave 2
  - **Blocks**: —
  - **Blocked By**: T3（路由骨架，确保不破坏 /recipe/new 路由）

  **References**:

  **Pattern References**:
  - `frontend/src/pages/recipe/RecipeForm.tsx` — 现有表单全文，在此基础上改造
  - `frontend/src/lib/upload.ts` — 现有上传工具函数，了解 presign 流程
  - `frontend/src/components/ui/toast.tsx` — 使用现有 toast 显示成功/失败反馈
  - `frontend/src/hooks/useRecipes.ts` — 了解 createRecipe mutation 签名

  **API/Type References**:
  - `私厨-V2技术总方案.md` 八、2-4 节 — 图片上传解耦原则和 UploadStatus 类型定义

  **Acceptance Criteria**:

  - [ ] 菜品表单提交成功后立即显示"创建成功" Banner，不等待图片上传
  - [ ] 每张图片有独立的上传状态指示（loading/success/error）
  - [ ] 图片上传失败时有"重试"按钮
  - [ ] 图片上传失败不触发"创建菜品失败"的 toast
  - [ ] TypeScript 编译通过

  **QA Scenarios**:

  ```
  Scenario: 菜品创建成功，图片上传失败不影响成功状态
    Tool: Playwright
    Preconditions: 前端运行，已登录；模拟图片上传失败（可在 DevTools 中 block presign 请求）
    Steps:
      1. page.goto('http://localhost:5173/recipe/new')
      2. 填写菜品名称 "测试菜品" 到 input[name="title"]
      3. 上传一张测试图片（通过 file input）
      4. 在 DevTools 中拦截 /api/upload/presign 请求返回 500
      5. 点击"保存"按钮
      6. 等待 RecipeCreateSuccessBanner 出现（contains text "创建成功"）
      7. 确认图片显示错误状态 + "重试"按钮可见
    Expected Result: 菜品创建成功提示出现，同时图片显示失败状态
    Evidence: .sisyphus/evidence/task-T5-upload-decouple.png

  Scenario: 图片上传成功完整流程
    Tool: Playwright
    Preconditions: 前端运行，已登录，网络正常
    Steps:
      1. 创建新菜品并上传一张图片
      2. 等待所有图片状态变为 success（绿色/checkmark）
      3. 进入菜品详情页确认图片已显示
    Expected Result: 全流程成功，图片在详情页可见
    Evidence: .sisyphus/evidence/task-T5-upload-success.png
  ```

  **Commit**: YES
  - Message: `feat(recipe): decouple image upload from recipe creation success state`
  - Files: `frontend/src/pages/recipe/RecipeForm.tsx`, `frontend/src/components/recipe/RecipeUploadQueue.tsx`, `frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx`

---

- [ ] T6. MenuPage（点菜页 `/menu`）(P0)

  **What to do**:
  1. 实现 `frontend/src/pages/menu/MenuPage.tsx`，替换 T3 中的占位组件：
     - 顶部搜索栏
     - 标签筛选（复用现有 tags 接口）
     - 菜品列表（从现有 `useRecipes` hook 获取数据）
     - 每个菜品卡片右下角有"加入清单"按钮
     - 底部固定"待下单清单"浮层（显示已选菜品数量），点击进入确认下单页
  2. 菜品列表复用 `frontend/src/components/recipe/RecipeCard.tsx`（如适合）
  3. 选中状态用本地 `useState`（不需要全局 store）
  4. "去下单"按钮跳转到 `/menu/create-order`（或带 query 参数到 OrderCreate）
  5. 新增路由 `/menu/create-order` 在 `App.tsx` 中（指向现有 OrderCreate 组件，或新建）

  **Must NOT do**:
  - 不重写 `useRecipes` hook 的数据获取逻辑
  - 不引入复杂选中状态管理库（useState 足够）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 新页面 UI 设计，菜品列表 + 标签筛选 + 浮动清单，需要良好视觉
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T4 并行）
  - **Parallel Group**: Wave 2
  - **Blocks**: T9
  - **Blocked By**: T3（需要 `/menu` 路由已注册）

  **References**:

  **Pattern References**:
  - `frontend/src/pages/order/OrderCreate.tsx:1-305` — 现有点餐页全文，MenuPage 的菜品选择逻辑可参考此文件
  - `frontend/src/hooks/useRecipes.ts` — 获取菜品列表的 hook，了解 params 和返回格式
  - `frontend/src/components/recipe/RecipeCard.tsx` — 现有菜品卡片组件
  - `frontend/src/pages/favorites/Favorites.tsx` — 参考列表页布局模式

  **API/Type References**:
  - `私厨-V2技术总方案.md` 六、3 MenuPage 节 — 模块设计描述

  **Acceptance Criteria**:

  - [ ] `/menu` 页面有搜索栏，输入关键词后菜品列表过滤
  - [ ] 标签筛选可用（至少显示家庭标签列表）
  - [ ] 点击"加入清单"后底部清单计数+1
  - [ ] 清单浮层显示已选菜品列表
  - [ ] 点击"去下单"跳转到下单确认页

  **QA Scenarios**:

  ```
  Scenario: 搜索菜品并加入清单
    Tool: Playwright
    Preconditions: 前端运行，已登录，数据库有菜品数据
    Steps:
      1. page.goto('http://localhost:5173/menu')
      2. page.locator('input[type="search"]').fill('红烧')
      3. 等待菜品列表更新（wait for response）
      4. 点击第一个菜品的"加入清单"按钮
      5. 确认底部浮层显示数字 "1"
      6. 点击浮层"去下单"按钮
      7. 确认跳转到下单确认页面
    Expected Result: 搜索、加入清单、跳转均正常
    Evidence: .sisyphus/evidence/task-T6-menu-page.png

  Scenario: 标签筛选
    Tool: Playwright
    Preconditions: 数据库有带标签的菜品
    Steps:
      1. page.goto('http://localhost:5173/menu')
      2. 点击第一个标签
      3. 菜品列表刷新，显示的菜品减少或为该标签的菜品
    Expected Result: 标签筛选生效
    Evidence: .sisyphus/evidence/task-T6-menu-tags.png
  ```

  **Commit**: YES
  - Message: `feat(menu): implement /menu page with recipe browsing and cart`
  - Files: `frontend/src/pages/menu/MenuPage.tsx`, `frontend/src/App.tsx`

---

- [ ] T7. 订单详情页 OrderDetailV2（`/orders/:id`）(P0)

  **What to do**:
  1. 实现 `frontend/src/pages/order/OrderDetailV2.tsx`，替换 T3 的占位组件：
     - 订单基础信息（mealType、mealDate、note）
     - 订单状态时间线组件 `OrderStatusTimeline`（渲染 statusTimeline 数组）
     - 菜品列表（items，含缩略图）
     - 点单人信息（requester.displayName）
     - 操作按钮区：根据当前 status 显示可用操作（如"确认"/"开始制作"/"完成"）
  2. 新建 `frontend/src/components/order/OrderStatusTimeline.tsx`
  3. 新建 `frontend/src/components/order/OrderSummaryCard.tsx`（订单基础信息卡片）
  4. 更新 `frontend/src/hooks/useOrders.ts`：
     - 扩展 `OrderStatus` 类型：加入 `'submitted' | 'preparing' | 'cancelled'`
     - 扩展 `Order` 接口：加入 `statusTimeline`, `requester` 字段
  5. 调用 `useOrder(id)` hook（已存在）获取数据，id 来自 `useParams()`

  **Must NOT do**:
  - P0 阶段不实现评论/评价区（留给 T13）
  - 不在此文件写 API 请求逻辑（用 useOrder hook）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 核心产品页面，需要良好的时间线 UI 和状态可视化
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO（串行）
  - **Parallel Group**: Wave 3
  - **Blocks**: T13
  - **Blocked By**: T4（需要后端返回 statusTimeline 字段）、T3（路由已注册）

  **References**:

  **Pattern References**:
  - `frontend/src/hooks/useOrders.ts:1-132` — 现有 useOrder hook，需扩展 Order 类型
  - `frontend/src/pages/order/OrderList.tsx` — 现有订单列表页，参考数据获取模式
  - `frontend/src/components/ui/badge.tsx` — 用于状态标签
  - `frontend/src/components/ui/card.tsx` — 用于信息卡片布局
  - `frontend/src/pages/layout/TabBar.tsx` — 参考 pb-safe 的 bottom padding 模式

  **API/Type References**:
  - `私厨-V2技术总方案.md` 六、3 OrderDetailV2 节 — 页面结构设计
  - T4 完成后的 GET /api/orders/:id 返回结构

  **Acceptance Criteria**:

  - [ ] 访问 `/orders/:id` 显示订单详情（不 404）
  - [ ] 页面显示 mealType、mealDate、note（如有）
  - [ ] 页面显示状态时间线（至少一条事件）
  - [ ] 页面显示菜品列表（recipeTitle + 数量）
  - [ ] 根据状态显示正确的操作按钮
  - [ ] `useOrders.ts` 中 OrderStatus 包含 `submitted | preparing | cancelled`
  - [ ] TypeScript 编译通过

  **QA Scenarios**:

  ```
  Scenario: 访问订单详情页
    Tool: Playwright
    Preconditions: 前端运行，已登录，数据库有订单数据，T4 完成
    Steps:
      1. page.goto('http://localhost:5173/orders')
      2. 点击第一个订单卡片（或直接访问 /orders/1）
      3. 等待页面加载
      4. expect(page.locator('.order-status-timeline')).toBeVisible()
      5. expect(page.locator('.order-items-list')).toBeVisible()
      6. 确认 requester 名字显示
    Expected Result: 订单详情页完整渲染，时间线和菜品列表均可见
    Evidence: .sisyphus/evidence/task-T7-order-detail.png

  Scenario: 状态操作按钮正确
    Tool: Playwright
    Preconditions: 存在 status='submitted' 的订单
    Steps:
      1. 访问该订单的详情页
      2. 确认有"确认订单"按钮可见
      3. 确认无"完成"按钮（流转不能跳级）
    Expected Result: 按钮与状态匹配
    Evidence: .sisyphus/evidence/task-T7-action-buttons.png
  ```

  **Commit**: YES
  - Message: `feat(orders): implement OrderDetailV2 page at /orders/:id`
  - Files: `frontend/src/pages/order/OrderDetailV2.tsx`, `frontend/src/components/order/OrderStatusTimeline.tsx`, `frontend/src/components/order/OrderSummaryCard.tsx`, `frontend/src/hooks/useOrders.ts`

---

- [ ] T8. P1 互动 DB Schema（order_comments/reviews/likes/shares）+ migration (P1)

  **What to do**:
  1. 在 `backend/src/db/schema.ts` 中新增四张表：
     - `orderComments`（id, orderId→orders, userId→users, roleType, content, createdAt, updatedAt）
     - `orderReviews`（id, orderId, userId, score CHECK(1-5), tasteScore, portionScore, overallNote, createdAt，UNIQUE(orderId, userId)）
     - `orderLikes`（orderId, userId, createdAt，PRIMARY KEY(orderId, userId)）
     - `orderShares`（id, orderId, userId, shareType, channel, createdAt）
  2. 导出所有新类型
  3. 运行 `npm run db:generate` + `npm run db:migrate`

  **Must NOT do**:
  - 不修改已有 `ratings` 表（V2 评价用 orderReviews，不影响旧数据）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T7、T9 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: T10, T11, T12, T17
  - **Blocked By**: T1（需要 orders 表已存在且 migration 系统已建立）

  **References**:

  **Pattern References**:
  - `backend/src/db/schema.ts:156-179` — ratings 表的 check 约束和 unique 约束写法（orderReviews 参考）
  - `backend/src/db/schema.ts:238-257` — favorites 表的复合主键写法（orderLikes 参考）
  - `私厨-V2技术总方案.md` 七、3.3-3.6 节 — 四张表的 DDL 定义

  **Acceptance Criteria**:

  - [ ] 四张新表定义在 schema.ts 中
  - [ ] Drizzle migration 文件生成
  - [ ] `npm run db:migrate` 成功
  - [ ] `sqlite3 ... ".tables"` 输出包含 order_comments order_reviews order_likes order_shares
  - [ ] 编译通过

  **QA Scenarios**:

  ```
  Scenario: 验证互动表已创建
    Tool: Bash
    Steps:
      1. sqlite3 .../private-chef.db ".tables" | grep -E "order_(comments|reviews|likes|shares)"
      2. 确认四张表均存在
      3. sqlite3 ... "PRAGMA table_info(order_reviews);" 确认有 score, taste_score 字段
    Expected Result: 四张表存在，字段正确
    Evidence: .sisyphus/evidence/task-T8-interaction-tables.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add interaction tables (order_comments/reviews/likes/shares)`
  - Files: `backend/src/db/schema.ts`, `backend/drizzle/*.sql`

---

- [ ] T9. CreateOrderV2（下单成功跳转 + 兼容旧路由）(P0)

  **What to do**:
  1. 修改 `frontend/src/pages/order/OrderCreate.tsx`（或在 MenuPage 中内联）：
     - `createOrder.mutateAsync()` 成功后改为：`queryClient.invalidateQueries(['orders'])` → `navigate('/orders/${id}')`（而非 navigate('/orders')）
     - id 来自 mutation 返回值 `created.id`
  2. 在 `App.tsx` 中：保留 `/order/create` 路由（重定向到 `/menu` 或继续渲染 OrderCreate，保持向后兼容）
  3. 更新 `useCreateOrder` mutation 的 `onSuccess` 回调（已在 useOrders.ts 中）

  **Must NOT do**:
  - 不删除 `/order/create` 路由

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T8 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: —
  - **Blocked By**: T6（MenuPage 路由已建立）、T4（后端返回 order.id）

  **References**:

  **Pattern References**:
  - `frontend/src/pages/order/OrderCreate.tsx:93-107` — 现有 handleSubmit 成功后的 navigate 调用，改此处
  - `frontend/src/hooks/useOrders.ts:83-106` — useCreateOrder mutation，onSuccess 回调改这里

  **Acceptance Criteria**:

  - [ ] 下单成功后 URL 变为 `/orders/{newOrderId}`（而非 `/orders`）
  - [ ] 订单详情页正确展示新建订单内容
  - [ ] 旧路由 `/order/create` 仍可访问

  **QA Scenarios**:

  ```
  Scenario: 下单成功跳转到订单详情
    Tool: Playwright
    Preconditions: 前端运行，已登录，T7 已完成（订单详情页存在）
    Steps:
      1. page.goto('http://localhost:5173/menu') 或 /order/create
      2. 搜索菜品并添加一道
      3. 选择日期和餐次
      4. 点击"提交订单"
      5. waitForURL('/orders/**')
      6. expect(page.url()).toMatch(/\/orders\/\d+/)
      7. 确认页面显示刚创建的订单信息（菜品名称）
    Expected Result: URL 跳转到 /orders/{id}，页面显示订单详情
    Evidence: .sisyphus/evidence/task-T9-create-order-redirect.png
  ```

  **Commit**: YES
  - Message: `feat(orders): navigate to order detail after successful order creation`
  - Files: `frontend/src/pages/order/OrderCreate.tsx`, `frontend/src/hooks/useOrders.ts`

---

- [ ] T10. 评论 API（GET/POST `/api/orders/:id/comments`）(P1)

  **What to do**:
  1. 新建 `backend/src/routes/order-comments.ts`：
     - `GET /api/orders/:id/comments`：查询 order_comments，验证 familyId 边界（先查 order.familyId），join users 返回 displayName
     - `POST /api/orders/:id/comments`：验证 content 不为空（最大 500 字），插入 order_comments，触发 `createNotificationEvent`（event_type='order_comment_created'）
  2. 在 `backend/src/app.ts` 中注册路由：`app.route('/api/orders', orderCommentsRouter)`
  3. 写 vitest 测试：`backend/src/__tests__/order-comments.test.ts`（GET 列表、POST 创建、familyId 边界越权返回 404）

  **Must NOT do**:
  - 不允许不属于同 family 的用户查看或发布评论

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T11、T12 并行）
  - **Parallel Group**: Wave 4
  - **Blocks**: T13, T14, T15, T16
  - **Blocked By**: T8（需要 order_comments 表）

  **References**:

  **Pattern References**:
  - `backend/src/routes/orders.ts:240-289` — GET /api/orders/:id 的 familyId 边界校验模式
  - `backend/src/routes/ratings.ts` — 参考评分路由的结构模式
  - `backend/src/__tests__/orders.test.ts` — 参考现有测试结构和 helpers
  - `backend/src/__tests__/helpers.ts` — 测试 helper，createTestUser/createTestFamily 等

  **Acceptance Criteria**:

  - [ ] `GET /api/orders/:id/comments` 返回评论数组，含 displayName
  - [ ] `POST /api/orders/:id/comments` 创建成功返回 201
  - [ ] 跨 family 访问返回 404
  - [ ] vitest 测试通过（`npm test`）

  **QA Scenarios**:

  ```
  Scenario: 发布并获取评论
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，存在订单 ID=1
    Steps:
      1. curl -s -X POST http://localhost:3000/api/orders/1/comments -H "Content-Type: application/json" -b "cookie.txt" -d '{"content":"看起来很好吃！","roleType":"requester"}'
      2. 确认返回 HTTP 201
      3. curl -s http://localhost:3000/api/orders/1/comments -b "cookie.txt" | jq '.[0].content'
      4. 确认返回 "看起来很好吃！"
    Expected Result: 评论创建和查询正常
    Evidence: .sisyphus/evidence/task-T10-comments-api.json

  Scenario: familyId 边界验证
    Tool: Bash (curl)
    Preconditions: 另一个家庭的订单 ID=99 存在
    Steps:
      1. curl -s http://localhost:3000/api/orders/99/comments -b "cookie.txt"
      2. 确认返回 HTTP 404
    Expected Result: 跨 family 访问被拒绝
    Evidence: .sisyphus/evidence/task-T10-family-boundary.json
  ```

  **Commit**: YES
  - Message: `feat(api): add order comments endpoints with familyId boundary`
  - Files: `backend/src/routes/order-comments.ts`, `backend/src/app.ts`, `backend/src/__tests__/order-comments.test.ts`

---

- [ ] T11. 评价 API（GET/POST `/api/orders/:id/reviews`）(P1)

  **What to do**:
  1. 新建 `backend/src/routes/order-reviews.ts`：
     - `GET /api/orders/:id/reviews`：查询 order_reviews，join users，验证 familyId
     - `POST /api/orders/:id/reviews`：验证 score(1-5)，UNIQUE(orderId,userId) 冲突返回 409，成功后触发 `createNotificationEvent`（event_type='order_review_created'）
  2. 注册路由到 app.ts
  3. 写 vitest 测试（含重复评价返回 409 的边界测试）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T10、T12 并行）
  - **Parallel Group**: Wave 4
  - **Blocks**: T13, T14, T16, T17
  - **Blocked By**: T8

  **References**:
  - `backend/src/routes/order-comments.ts` (T10完成后) — 参考相同模式
  - `backend/src/db/schema.ts`（T8完成后）— orderReviews 表结构，注意 UNIQUE 约束
  - `私厨-V2技术总方案.md` 九、2 节 — 评价 API 设计

  **Acceptance Criteria**:

  - [ ] `POST /api/orders/:id/reviews` 成功返回 201
  - [ ] 同一用户对同一订单二次评价返回 409
  - [ ] score 不在 1-5 范围内返回 400
  - [ ] vitest 测试通过

  **QA Scenarios**:

  ```
  Scenario: 创建评价
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，存在当前 family 下的订单 ID=1，cookie 已保存到 cookie.txt
    Steps:
      1. curl -s -X POST http://localhost:3000/api/orders/1/reviews -H "Content-Type: application/json" -b "cookie.txt" -d '{"score":5,"tasteScore":5,"portionScore":4,"overallNote":"非常好吃"}'
      2. 确认返回 HTTP 201，响应体含 review id 或成功标记
      3. curl -s http://localhost:3000/api/orders/1/reviews -b "cookie.txt" | jq '.[0].score'
      4. 确认返回值为 5
    Expected Result: 评价创建成功，列表查询能返回新评价且分数字段正确
    Evidence: .sisyphus/evidence/task-T11-reviews-api.json

  Scenario: 重复评价返回 409
    Tool: Bash (curl)
    Preconditions: 当前用户已经对订单 ID=1 提交过一次评价
    Steps:
      1. 再次执行 POST http://localhost:3000/api/orders/1/reviews 并提交另一份评分
      2. 确认返回 HTTP 409
      3. 确认错误响应说明同一用户不可重复评价
    Expected Result: 后端正确拒绝重复评价，且不会新增第二条 review 记录
    Evidence: .sisyphus/evidence/task-T11-reviews-duplicate.json
  ```

  **Commit**: YES
  - Message: `feat(api): add order reviews endpoints`
  - Files: `backend/src/routes/order-reviews.ts`, `backend/src/app.ts`, `backend/src/__tests__/order-reviews.test.ts`

---

- [ ] T12. 点赞/分享 API（like/unlike/share）(P1)

  **What to do**:
  1. 新建 `backend/src/routes/order-interactions.ts`：
     - `POST /api/orders/:id/like`：插入 order_likes（忽略重复，不报错）
     - `DELETE /api/orders/:id/like`：删除 order_likes 记录
     - `POST /api/orders/:id/share`：插入 order_shares（shareType, channel 字段）
     - `GET /api/orders/:id/share-card`：返回分享卡所需数据（订单摘要，菜品列表，点赞数）
  2. 在 `GET /api/orders/:id` 响应中加入 `likeCount`、`isLikedByMe`、`shareCount` 字段（修改 T4 的成果）
  3. 注册路由到 app.ts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T10、T11 并行）
  - **Parallel Group**: Wave 4
  - **Blocks**: T13, T14, T16, T17
  - **Blocked By**: T8

  **References**:
  - `backend/src/routes/order-comments.ts` (T10完成后) — 相同的 familyId 边界模式
  - `backend/src/db/schema.ts`（T8完成后）— orderLikes、orderShares 表（复合主键）
  - `backend/src/routes/favorites.ts` — 参考 toggle 收藏的实现模式（类似 like/unlike）

  **Acceptance Criteria**:

  - [ ] `POST /api/orders/:id/like` 幂等（重复点赞不报错）
  - [ ] `DELETE /api/orders/:id/like` 成功
  - [ ] `GET /api/orders/:id` 返回 `likeCount` 和 `isLikedByMe`
  - [ ] `POST /api/orders/:id/share` 成功记录分享事件

  **QA Scenarios**:

  ```
  Scenario: 点赞幂等
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，存在当前 family 下的订单 ID=1，cookie 已保存到 cookie.txt
    Steps:
      1. curl -s -X POST http://localhost:3000/api/orders/1/like -b "cookie.txt"
      2. 再次执行同一个 POST 请求，确认仍返回 HTTP 200 或 201（不报 409）
      3. curl -s http://localhost:3000/api/orders/1 -b "cookie.txt" | jq '.likeCount'
      4. 确认 likeCount 为 1（不是 2）
    Expected Result: 重复点赞不会报错，也不会重复累加 likeCount
    Evidence: .sisyphus/evidence/task-T12-like-idempotent.json

  Scenario: 取消点赞
    Tool: Bash (curl)
    Preconditions: 当前用户已对订单 ID=1 点赞
    Steps:
      1. curl -s -X DELETE http://localhost:3000/api/orders/1/like -b "cookie.txt"
      2. curl -s http://localhost:3000/api/orders/1 -b "cookie.txt" | jq '.isLikedByMe'
      3. 确认返回 false，且 likeCount 已回落
    Expected Result: 取消点赞成功，订单详情中的 isLikedByMe=false 且计数同步减少
    Evidence: .sisyphus/evidence/task-T12-unlike.json

  Scenario: 分享事件落库
    Tool: Bash (curl + sqlite3)
    Preconditions: 后端运行，已登录，存在当前 family 下的订单 ID=1，cookie 已保存到 cookie.txt
    Steps:
      1. curl -s -X POST http://localhost:3000/api/orders/1/share -H "Content-Type: application/json" -b "cookie.txt" -d '{"shareType":"card","channel":"wechat"}'
      2. 确认返回 HTTP 200 或 201
      3. sqlite3 /Users/weilan/ali/ai/cook/private-chef/backend/data/private-chef.db "SELECT order_id, share_type, channel FROM order_shares ORDER BY id DESC LIMIT 1;"
      4. 确认最新一条记录对应 order_id=1 且 share_type/channel 正确
    Expected Result: 分享接口成功记录一条 order_shares 事件，并可用于后续 shareCount 聚合
    Evidence: .sisyphus/evidence/task-T12-share.json
  ```

  **Commit**: YES
  - Message: `feat(api): add order like/unlike/share endpoints`
  - Files: `backend/src/routes/order-interactions.ts`, `backend/src/app.ts`, `backend/src/routes/orders.ts`

---

- [ ] T13. 订单详情页增加评论/评价/点赞/分享/再来一单 (P1)

  **What to do**:
  1. 扩展 `frontend/src/pages/order/OrderDetailV2.tsx`（在 T7 基础上）：
     - 新增"评论区"：渲染 `OrderCommentThread` + `OrderCommentComposer`
     - 新增"评价区"（仅 status='completed' 时显示）：渲染 `OrderReviewCard` 或评价表单
     - 新增操作栏：点赞（心形按钮，乐观更新）、分享按钮、"再来一单"按钮
  2. 新建 `frontend/src/components/comment/OrderCommentThread.tsx`
  3. 新建 `frontend/src/components/comment/OrderCommentComposer.tsx`（输入框 + 发送按钮）
  4. 新建 `frontend/src/components/comment/OrderReviewCard.tsx`（星级评分 + 各维度分数）
  5. "再来一单"：复制当前订单的 items，跳转到 `/menu/create-order?from={orderId}`（或类似方案）
  6. 点赞使用乐观更新（先更新本地 count，失败后回滚）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO（串行）
  - **Parallel Group**: Wave 5
  - **Blocks**: —
  - **Blocked By**: T10, T11, T12, T7（所有互动 API 和基础详情页）

  **References**:
  - `frontend/src/pages/order/OrderDetailV2.tsx` (T7完成后) — 在此文件扩展
  - `frontend/src/hooks/useOrders.ts` — 现有 useOrder/useUpdateOrderStatus 模式
  - `frontend/src/components/ui/tabs.tsx` — 用于评论/评价 tab 切换
  - `frontend/src/components/ui/textarea.tsx` — 评论输入框
  - `private-chef/frontend/src/components/ui/badge.tsx` — 状态展示

  **Acceptance Criteria**:

  - [ ] 订单详情页底部有评论输入框
  - [ ] 发送评论后评论列表更新（无需刷新页面）
  - [ ] 点赞按钮点击后计数立即变化（乐观更新）
  - [ ] 已完成订单显示评价区（星级评分）
  - [ ] "再来一单"按钮可点击并跳转到点菜页（携带菜品数据）

  **QA Scenarios**:

  ```
  Scenario: 发送评论
    Tool: Playwright
    Preconditions: 前端运行，已登录，存在订单
    Steps:
      1. page.goto('/orders/1')
      2. page.locator('textarea.comment-input').fill('今天的饭真好吃！')
      3. page.locator('button[aria-label="发送评论"]').click()
      4. expect(page.locator('.comment-thread')).toContainText('今天的饭真好吃！')
    Expected Result: 评论即时出现在列表中
    Evidence: .sisyphus/evidence/task-T13-comment.png

  Scenario: 点赞乐观更新
    Tool: Playwright
    Steps:
      1. 记录当前 likeCount
      2. 点击点赞按钮（heart icon）
      3. 立即确认 likeCount + 1（不等待网络）
      4. 等待 500ms，确认 count 保持不变（网络确认成功）
    Expected Result: 点赞计数立即更新
    Evidence: .sisyphus/evidence/task-T13-like.png
  ```

  **Commit**: YES
  - Message: `feat(orders): add comments, reviews, likes, share, and reorder to order detail page`
  - Files: `frontend/src/pages/order/OrderDetailV2.tsx`, `frontend/src/components/comment/OrderCommentThread.tsx`, `frontend/src/components/comment/OrderCommentComposer.tsx`, `frontend/src/components/comment/OrderReviewCard.tsx`

---

- [ ] T14. useOrderInteractions hooks（评论/评价/点赞 query+mutation）(P1)

  **What to do**:
  1. 新建 `frontend/src/hooks/useOrderInteractions.ts`：
     - `useOrderComments(orderId)` — query: `['order-comments', orderId]`
     - `useCreateOrderComment(orderId)` — mutation，onSuccess invalidate comments
     - `useOrderReviews(orderId)` — query: `['order-reviews', orderId]`
     - `useCreateOrderReview(orderId)` — mutation
     - `useToggleOrderLike(orderId)` — mutation（乐观更新 `['order', orderId]` 中的 likeCount）
     - `useCreateOrderShare(orderId)` — mutation
  2. 所有接口 URL 对应 T10/T11/T12 实现的端点

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（可与 T13 并行，T13 最终依赖此文件）
  - **Parallel Group**: Wave 5
  - **Blocks**: T13
  - **Blocked By**: T10, T11, T12

  **References**:
  - `frontend/src/hooks/useOrders.ts:1-132` — 现有 hooks 模式（query + mutation + invalidate）
  - `frontend/src/hooks/useFavorites.ts` — toggle 收藏的乐观更新模式（参考 useToggleOrderLike）
  - T10/T11/T12 实现的 API 端点

  **Acceptance Criteria**:

  - [ ] `useOrderInteractions.ts` 文件存在，导出所有 6 个 hooks
  - [ ] `useOrderComments` queryKey 为 `['order-comments', orderId]`
  - [ ] `useToggleOrderLike` 实现乐观更新
  - [ ] TypeScript 编译通过（无 any 类型）

  **QA Scenarios**:

  ```
  Scenario: hooks 编译和类型检查
    Tool: Bash
    Preconditions: T10/T11/T12 相关接口类型已存在，frontend 依赖已安装
    Steps:
      1. cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run build
      2. 确认 0 TypeScript errors
    Expected Result: useOrderInteractions.ts 中 6 个 hooks 能通过类型检查与生产构建，无 any/@ts-ignore
    Evidence: .sisyphus/evidence/task-T14-build.txt
  ```

  **Commit**: YES (与 T13 合并)
  - Message: `feat(hooks): add useOrderInteractions for comments/reviews/likes/share`
  - Files: `frontend/src/hooks/useOrderInteractions.ts`

---

- [ ] T15. 首页聚合 API（`GET /api/home/summary`）(P2)

  **What to do**:
  1. 新建 `backend/src/services/home-summary-service.ts`：
     - `getHomeSummary(familyId, userId)` 返回：
       - `recommendedRecipes`: 最近未点过的 5 道菜（按点单量倒序）
       - `frequentRecipes`: 点单量 Top 5 的菜品
       - `recentOrders`: 最近 5 条订单（含状态 + 菜品名）
       - `recentComments`: 最近 3 条评论（含 displayName + content 摘要）
       - `achievementSummary`: 简单统计（totalOrders, totalCooks）
  2. 新建 `backend/src/routes/home.ts`：`GET /api/home/summary`（带 authMiddleware）
  3. 注册到 app.ts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T16、T17 并行）
  - **Parallel Group**: Wave 6
  - **Blocks**: T18
  - **Blocked By**: T4（orders 查询）、T10（comments 查询）

  **References**:
  - `backend/src/routes/orders.ts:69-140` — 参考 orders 列表查询的 JOIN 模式
  - `backend/src/routes/order-comments.ts` (T10完成后) — comments 查询模式
  - `私厨-V2技术总方案.md` 九、3 节 — 首页聚合接口返回字段设计

  **Acceptance Criteria**:

  - [ ] `GET /api/home/summary` 返回 200，包含 recommendedRecipes/frequentRecipes/recentOrders/recentComments/achievementSummary 五个字段
  - [ ] 所有数据限制在当前 familyId 范围内
  - [ ] 响应时间 < 500ms（单次 SQLite 聚合查询）

  **QA Scenarios**:

  ```
  Scenario: 首页聚合接口完整性
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，cookie 已保存到 cookie.txt，测试家庭至少有 1 条订单和评论数据
    Steps:
      1. curl -s http://localhost:3000/api/home/summary -b "cookie.txt" | jq 'keys'
      2. 确认返回的 keys 包含: recommendedRecipes, frequentRecipes, recentOrders, recentComments, achievementSummary
      3. jq '.recentOrders | length' 确认 <= 5
      4. jq '.recentComments | length' 确认 <= 3
    Expected Result: 首页聚合接口一次返回完整结构，且 recentOrders/recentComments 的条数符合约束
    Evidence: .sisyphus/evidence/task-T15-home-summary.json
  ```

  **Commit**: YES
  - Message: `feat(api): add home summary aggregation endpoint`
  - Files: `backend/src/services/home-summary-service.ts`, `backend/src/routes/home.ts`, `backend/src/app.ts`

---

- [ ] T16. 我的页聚合 API（`GET /api/profile/summary`）(P2)

  **What to do**:
  1. 新建 `backend/src/services/profile-summary-service.ts` + `backend/src/routes/profile.ts`：
     - `GET /api/profile/summary` 返回：
       - `myOrderStats`: { total, pending, completed }
       - `myFavoritesCount`
       - `myCommentsCount`
       - `orderedByMe`: 最近 3 条我点的订单
       - `cookedByMe`: 最近 3 条我做的订单（cookUserId = me）
       - `familyMembers`: 家庭成员列表（displayName + role）
  2. 注册到 app.ts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T15、T17 并行）
  - **Parallel Group**: Wave 6
  - **Blocks**: T19
  - **Blocked By**: T4, T10, T11, T12

  **References**:
  - `backend/src/routes/home.ts` (T15完成后) — 相同服务层模式
  - `backend/src/routes/families.ts` — 查询家庭成员的现有逻辑
  - `backend/src/db/schema.ts` — favorites 表（count 统计）

  **Acceptance Criteria**:

  - [ ] `GET /api/profile/summary` 返回 200，包含所有规定字段
  - [ ] `myOrderStats.total` 与实际 orders 数量一致
  - [ ] familyMembers 只包含当前 familyId 的成员

  **QA Scenarios**:

  ```
  Scenario: 我的页摘要数据验证
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，cookie 已保存到 cookie.txt
    Steps:
      1. curl -s http://localhost:3000/api/profile/summary -b "cookie.txt" | jq '.'
      2. 验证 myOrderStats.total >= 0，familyMembers 数组非空
      3. 验证 cookedByMe 只包含 cook_user_id = currentUserId 的订单
    Expected Result: profile summary 返回约定字段，统计值与当前用户/家庭边界一致
    Evidence: .sisyphus/evidence/task-T16-profile-summary.json
  ```

  **Commit**: YES
  - Message: `feat(api): add profile summary aggregation endpoint`
  - Files: `backend/src/services/profile-summary-service.ts`, `backend/src/routes/profile.ts`, `backend/src/app.ts`

---

- [ ] T17. 成就 API（summary + leaderboard）(P2)

  **What to do**:
  1. 新建 `backend/src/services/achievement-service.ts` + `backend/src/routes/achievements.ts`：
     - `GET /api/achievements/summary`：家庭整体统计（totalOrders, totalCooks, totalLikes, totalComments, totalShares）
     - `GET /api/achievements/leaderboard`：按成员统计（userId, displayName, orderCount, cookCount, likeCount, commentCount），按 orderCount+cookCount 倒序

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T15、T16 并行）
  - **Parallel Group**: Wave 6
  - **Blocks**: T20
  - **Blocked By**: T8, T10, T11, T12

  **References**:
  - `backend/src/routes/home.ts` (T15完成后)
  - `私厨-V2技术总方案.md` 十一、2 节 — 成就统计维度

  **Acceptance Criteria**:

  - [ ] `GET /api/achievements/summary` 返回统计数据
  - [ ] `GET /api/achievements/leaderboard` 返回成员排名数组
  - [ ] 所有数据限制在 familyId 范围内

  **QA Scenarios**:

  ```
  Scenario: 成就排行榜
    Tool: Bash (curl)
    Preconditions: 后端运行，已登录，cookie 已保存到 cookie.txt，家庭内已有互动数据
    Steps:
      1. curl -s http://localhost:3000/api/achievements/leaderboard -b "cookie.txt" | jq '.[0]'
      2. 确认第一名包含 userId, displayName, orderCount 字段
      3. curl -s http://localhost:3000/api/achievements/summary -b "cookie.txt" | jq 'keys'
      4. 确认 summary 中包含 totalOrders, totalCooks, totalLikes, totalComments, totalShares
    Expected Result: summary 与 leaderboard 两个接口都可访问，且只返回当前 family 的统计数据
    Evidence: .sisyphus/evidence/task-T17-leaderboard.json
  ```

  **Commit**: YES
  - Message: `feat(api): add achievements summary and leaderboard endpoints`
  - Files: `backend/src/services/achievement-service.ts`, `backend/src/routes/achievements.ts`, `backend/src/app.ts`

---

- [ ] T18. HomeV2 前端（首页聚合重构）(P2)

  **What to do**:
  1. 重构 `frontend/src/pages/home/Home.tsx`（或新建 HomeV2 后替换）：
     - 新建 `frontend/src/hooks/useHomeSummary.ts`：`queryKey: ['home-summary']`，调用 `GET /api/home/summary`
     - 渲染模块：今日推荐菜（recommendedRecipes）、常点菜（frequentRecipes）、最近订单动态（recentOrders）、最近评论（recentComments）、成就摘要卡片（achievementSummary）、快捷入口（点菜/我的订单/收藏/发布菜品）
     - 替换原来的多次独立请求为单次 `/api/home/summary`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 T19、T20 并行）
  - **Parallel Group**: Wave 7
  - **Blocks**: F3
  - **Blocked By**: T15

  **References**:
  - `frontend/src/pages/home/Home.tsx` — 现有首页全文（重构基础）
  - `frontend/src/pages/home/Home.tsx.bak` — 备份版本，了解历史改动
  - `frontend/src/hooks/useOrders.ts` — 参考 hook 定义模式
  - `frontend/src/components/recipe/RecipeCard.tsx` — 复用菜品卡片

  **Acceptance Criteria**:

  - [ ] 首页只发一次 `GET /api/home/summary` 请求（无 waterfall）
  - [ ] 显示"今日推荐"和"常点菜"两个菜品区块
  - [ ] 显示最近订单动态（带状态标签）
  - [ ] 快捷入口跳转正确（点菜→/menu，我的订单→/orders）

  **QA Scenarios**:

  ```
  Scenario: 首页加载和内容展示
    Tool: Playwright
    Preconditions: 前端运行，T15 完成，有数据
    Steps:
      1. page.goto('/')
      2. waitForResponse('**/api/home/summary')
      3. expect(page.locator('.recommended-recipes')).toBeVisible()
      4. expect(page.locator('.recent-orders')).toBeVisible()
      5. 检查 Network 面板，确认只有 1 次 /api/home/summary 请求（无多余聚合请求）
    Expected Result: 首页内容完整，无 waterfall 请求
    Evidence: .sisyphus/evidence/task-T18-home-v2.png

  Scenario: 快捷入口跳转
    Tool: Playwright
    Preconditions: 前端运行，首页聚合数据已加载
    Steps:
      1. 点击快捷入口"点菜" → 确认 URL = /menu
      2. 点击"我的订单" → 确认 URL = /orders
    Expected Result: 首页快捷入口跳转到正确路由，且跳转后页面正常渲染
    Evidence: .sisyphus/evidence/task-T18-home-shortcuts.png
  ```

  **Commit**: YES
  - Message: `feat(home): upgrade to HomeV2 with aggregated summary API`
  - Files: `frontend/src/pages/home/Home.tsx`, `frontend/src/hooks/useHomeSummary.ts`

---

- [ ] T19. ProfileV2 前端（我的页聚合重构）(P2)

  **What to do**:
  1. 重构 `frontend/src/pages/profile/Profile.tsx`：
     - 新建 `frontend/src/hooks/useProfileSummary.ts`：调用 `GET /api/profile/summary`
     - 渲染模块：我的订单统计（donut/数字）、我的收藏（跳转到 /favorites）、我的评论（跳转到评论中心）、我点过的/我做过的摘要、家庭成员列表、通知设置入口
  2. 家庭成员头像 fallback 到 Avatar 首字母

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7
  - **Blocks**: F3
  - **Blocked By**: T16

  **References**:
  - `frontend/src/pages/profile/Profile.tsx` — 现有我的页全文
  - `frontend/src/components/ui/avatar.tsx` — Avatar 组件
  - `frontend/src/hooks/useFamily.ts` — 现有家庭数据 hook

  **Acceptance Criteria**:

  - [ ] 我的页展示 myOrderStats（total/pending/completed）
  - [ ] 家庭成员列表可见，含头像（首字母 fallback）
  - [ ] 页面只发一次 `/api/profile/summary` 请求

  **QA Scenarios**:

  ```
  Scenario: 我的页内容完整
    Tool: Playwright
    Preconditions: 前端运行，已登录，T16 已完成，当前账号属于至少 1 个家庭
    Steps:
      1. page.goto('/profile')
      2. waitForResponse('**/api/profile/summary')
      3. expect(page.locator('.order-stats')).toBeVisible()
      4. expect(page.locator('.family-members')).toBeVisible()
      5. 确认 Network 中仅出现 1 次 /api/profile/summary 聚合请求
    Expected Result: ProfileV2 正常展示订单统计与家庭成员，并通过单次聚合请求完成渲染
    Evidence: .sisyphus/evidence/task-T19-profile-v2.png
  ```

  **Commit**: YES
  - Message: `feat(profile): upgrade to ProfileV2 with personal assets aggregation`
  - Files: `frontend/src/pages/profile/Profile.tsx`, `frontend/src/hooks/useProfileSummary.ts`

---

- [ ] T20. 成就页前端 (P2)

  **What to do**:
  1. 新建 `frontend/src/pages/achievements/AchievementsPage.tsx`：
     - 新建 `frontend/src/hooks/useAchievements.ts`：分别调用 summary + leaderboard 接口
     - 渲染：家庭整体统计卡片、排行榜（FamilyLeaderboard 组件）
  2. 新建 `frontend/src/components/achievement/FamilyLeaderboard.tsx`
  3. 新建 `frontend/src/components/achievement/AchievementSummaryCard.tsx`
  4. 在 `App.tsx` 注册路由 `/achievements`
  5. 在 ProfileV2 的"家庭成就"入口中跳转到 `/achievements`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7
  - **Blocked By**: T17, T19（需要 ProfileV2 中有入口）

  **References**:
  - `frontend/src/components/ui/card.tsx` — 统计卡片布局
  - `frontend/src/components/ui/avatar.tsx` — 排行榜成员头像
  - `private-chef/frontend/src/components/ui/badge.tsx` — 排名徽章

  **Acceptance Criteria**:

  - [ ] `/achievements` 路由可访问
  - [ ] 排行榜展示家庭成员及其统计数据，按分数倒序
  - [ ] ProfileV2 中有跳转到成就页的入口

  **QA Scenarios**:

  ```
  Scenario: 成就页排行榜
    Tool: Playwright
    Preconditions: 前端运行，T17/T19 已完成，当前家庭已有至少 1 名成员和统计数据
    Steps:
      1. page.goto('/achievements')
      2. expect(page.locator('.family-leaderboard')).toBeVisible()
      3. 确认排行榜至少有 1 条记录
      4. 从 /profile 的"家庭成就"入口点击进入，确认可跳转到 /achievements
    Expected Result: 成就页路由可访问，排行榜可见，且 ProfileV2 提供有效入口
    Evidence: .sisyphus/evidence/task-T20-achievements.png
  ```

  **Commit**: YES
  - Message: `feat(achievements): add achievements page with family leaderboard`
  - Files: `frontend/src/pages/achievements/AchievementsPage.tsx`, `frontend/src/components/achievement/FamilyLeaderboard.tsx`, `frontend/src/components/achievement/AchievementSummaryCard.tsx`, `frontend/src/hooks/useAchievements.ts`, `frontend/src/App.tsx`

---

## Final Verification Wave

> 4 个审查 agent 并行运行，全部通过后等待用户明确 OK。

- [ ] F1. **计划合规审计** — `oracle`
  逐条检查 Must Have，验证实现存在（读文件/curl 接口/运行命令）。逐条检查 Must NOT Have，搜索禁止模式。验证 `.sisyphus/evidence/` 证据文件存在。
  输出: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **代码质量审查** — `unspecified-high`
  - **建议工具**: Bash + Grep + Read
  - **执行步骤**:
    1. `cd /Users/weilan/ali/ai/cook/private-chef/backend && npm run build`
    2. `cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run build`
    3. 用 `grep`/`rg` 检查所有本轮新增或修改文件中是否存在 `as any`、`@ts-ignore`、`@ts-expect-error`、空 `catch {}`、残留 `console.log`
    4. 用 `read` spot-check 发现问题的文件，确认是否是真问题而非注释/文档
  - **预期输出**: `Build [PASS/FAIL] | Forbidden Patterns [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **真实 QA 执行** — `unspecified-high` + `playwright`
  - **建议工具**: Playwright + Bash (curl/sqlite3) + Read
  - **执行步骤**:
    1. 从干净会话重新登录，逐条执行 T1-T20 中已完成任务对应的 QA Scenarios
    2. 所有截图、JSON、日志证据统一保存到 `.sisyphus/evidence/final-qa/`
    3. 额外执行一条跨任务集成链路：完整下单 → 打开 `/orders/{id}` → 发表评论 → 提交评价 → 点赞/取消点赞 → 校验聚合页数据变化
    4. 用 `read` 核对 evidence 文件是否齐全，缺失即判失败
  - **预期输出**: `Scenarios [N/N pass] | Integration [N/N] | Evidence [PASS/FAIL] | VERDICT`

- [ ] F4. **范围保真检查** — `deep`
  - **建议工具**: Bash (git diff) + Read + Grep
  - **执行步骤**:
    1. 用 `git diff --stat` 和 `git diff` 对照每个任务的 **What to do**，确认实现与计划 1:1 对应
    2. 用 `grep` 搜索所有新增后端路由中的 `familyId` / `authMiddleware` / `eq(...familyId...)` 约束
    3. 用 `read` 核查存在差异或疑似越界的文件，确认是否为计划内扩展
  - **预期输出**: `Tasks [N/N compliant] | FamilyId boundary [PASS/FAIL] | Out-of-scope changes [0/N] | VERDICT`

---

## Commit Strategy

- T1: `feat(db): add order_status_events table and extend orders schema`
- T2: `feat(notification): upgrade to event-sourced async delivery system`
- T3: `feat(nav): update TabBar to 首页/点菜/订单/我的 with new routes`
- T4: `feat(orders): extend status model, add timeline, enhance GET :id`
- T5: `feat(recipe): decouple image upload from recipe creation`
- T6: `feat(menu): add /menu page as order entry point`
- T7: `feat(orders): add OrderDetailV2 page at /orders/:id`
- T8: `feat(db): add interaction tables (comments/reviews/likes/shares)`
- T9: `feat(orders): navigate to order detail after successful creation`
- T10: `feat(api): add order comments endpoints`
- T11: `feat(api): add order reviews endpoints`
- T12: `feat(api): add order like/share endpoints`
- T13: `feat(orders): add interaction UI to order detail page`
- T14: `feat(hooks): add useOrderInteractions for comments/reviews/likes`
- T15: `feat(api): add home summary aggregation endpoint`
- T16: `feat(api): add profile summary aggregation endpoint`
- T17: `feat(api): add achievements summary and leaderboard endpoints`
- T18: `feat(home): upgrade to HomeV2 with aggregated content`
- T19: `feat(profile): upgrade to ProfileV2 with personal assets aggregation`
- T20: `feat(achievements): add achievements page`

---

## Success Criteria

### Verification Commands
```bash
# 后端构建
cd /Users/weilan/ali/ai/cook/private-chef/backend && npm run build
# 预期: 0 errors

# 前端构建
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run build
# 预期: 0 errors

# 后端测试
cd /Users/weilan/ali/ai/cook/private-chef/backend && npm test
# 预期: all pass

# 验证新表存在
sqlite3 /Users/weilan/ali/ai/cook/private-chef/backend/data/private-chef.db ".tables"
# 预期: 包含 order_status_events order_comments order_reviews order_likes order_shares notification_events notification_deliveries
```

### Final Checklist
- [ ] TabBar 显示：首页/点菜/订单/我的
- [ ] 点菜 tab 进入 `/menu` 页面
- [ ] 下单成功后自动跳转到 `/orders/{id}`
- [ ] 订单详情页展示状态时间线
- [ ] 菜品创建时图片上传失败不影响菜品保存成功提示
- [ ] 所有新 API 强制 familyId 边界
- [ ] 通知事件写入数据库（notification_events 表有记录）
- [ ] P1：能在订单详情页发评论/评价/点赞
- [ ] P2：首页聚合接口返回完整结构
