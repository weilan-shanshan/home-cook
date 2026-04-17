# 私厨 V2 任务进度追踪

> 最后更新：2026-04-16  
> 主计划文件：`.sisyphus/plans/private-chef-v2.md`  
> 用法：完成任务后在下面把 `[ ]` 改为 `[x]`，并填写完成时间

> 仓库对齐备注（2026-04-16）：当前分支中 **T1 / T3 已出现代码雏形**（orders 扩展字段、`order_status_events`/`notification_events` 表、TabBar 新四项、`/menu` 与 `/orders/:id` 占位路由已存在），但尚未完成一次基于计划的完整核验与收口，因此进度先标为 `[~]`，待补齐 build / migrate / QA 证据后再改为 `[x]`。
>
> 收口补记（2026-04-16）：已补齐 T8 的 `order_comments.updated_at` 字段；新增 migration `backend/drizzle/0003_violet_steve_rogers.sql`，并已完成 `npm run db:migrate`、`npm run build`、`lsp_diagnostics` 验证。下一步进入 F1（oracle）复审，确认剩余 spec drift 是否仍成立。
>
> F1 偏差补记（2026-04-16）：已按 Oracle 复审意见继续对齐 T17/T19/T20——成就排行榜排序语义改为 `orderCount + cookCount`，ProfileV2 改为单次 `/api/profile/summary` 聚合并展示 `myOrderStats.total/pending/completed`，成就页排行榜补充成员统计数据展示。相关验证已完成：`backend/src/__tests__/achievements.test.ts`、`backend/src/__tests__/profile-summary.test.ts` 均通过，backend/frontend build 通过，相关文件 LSP 诊断为 0。下一步重跑 F1（oracle）。
>
> T17 契约补记（2026-04-16）：进一步将 `GET /api/achievements/leaderboard` 成员统计字段扁平为顶层 `orderCount/cookCount/reviewCount/commentCount/likeCount/favoriteCount/shareCount`，以对齐计划中的成员级排行榜契约；`summary.me` 保持原 `stats` 结构不变。相关验证已完成：`backend/src/__tests__/achievements.test.ts` 通过，backend/frontend build 通过，`backend/src/services/achievement-service.ts` LSP 诊断为 0。下一步再次重跑 F1（oracle）。
>
> F3 进展补记（2026-04-17）：已恢复 Playwright 可执行链路，并基于真实登录态完成一轮补证。已真实验证页面/路由：`/menu`、`/orders`、`/orders/10`、`/menu/create-order?from=10`，以及从创建订单提交后跳转到真实订单详情 `/orders/11`。已新增证据：`task-T3-tabbar-rerun.png`、`task-T6-menu-page-rerun.png`、`task-T7-order-detail-rerun.png`、`task-T9-create-order-page.png`、`task-T9-create-order-redirect.png`、`task-T10-comments.json`、`task-T11-reviews.json`、`task-T11-review-duplicate.json`、`task-T12-interactions.json`、`task-f3-console-errors.txt`。其中 T10/T11/T12 已分别拿到真实接口返回：评论列表 200、评价列表 200、重复评价 409、点赞 201 / 取消点赞 200 / 分享 201 / share-card 200。
>
> T5 补证补记（2026-04-17）：已按最新验收口径补齐 RecipeForm 图片上传解耦证据。真实验证路径：访问 `/recipe/new`，填写菜谱表单，选择本地图片进入上传队列，在浏览器上下文中仅拦截 `/api/upload/presign` 主动制造上传失败，同时保留真实 `POST /api/recipes` 请求。实测结果：`POST /api/recipes` 返回 `201`，页面出现“创建成功” Banner，Banner 文案明确提示“上传失败不会影响菜品创建结果”，上传队列显示失败状态并提供“重试”按钮，页面保持可继续编辑状态，满足“图片上传失败可以创建菜谱，后续能编辑补充就行”的验收口径。新增证据：`task-T5-create-success-upload-failed.png`、`task-T5-create-api-log.json`、`final-qa/f3-reviewer-summary.md`。
>
> 最终验收收口补记（2026-04-17）：已补齐验收阶段总收口文档 `final-qa/final-acceptance-summary.md`。当前结论：F1 计划合规审计已获 Oracle APPROVE；F2 代码质量经本地补跑确认通过（backend/frontend build、forbidden patterns、LSP clean）；F3 真实 QA 已通过 `final-qa/f3-reviewer-summary.md` 收口并正式判定 PASS；F4 范围保真经本地复核通过，familyId 边界与计划范围均保持成立。至此，私厨 V2 本轮计划 T1 ~ T20 与验收阶段 F1 ~ F4 全部收口完成。

---

## 状态图例

- `[ ]` 待开始
- `[~]` 进行中
- `[x]` 已完成
- `[!]` 被阻塞（注明原因）

---

## P0 — 主链路打通（建议先完成）

| 任务 | 描述 | 状态 | 依赖 | 被依赖 | 完成时间 |
|------|------|------|------|--------|---------|
| T1 | DB Schema 扩展 + migration（orders扩展/order_status_events/notification表） | `[x]` | — | T4, T8 | 2026-04-16 |
| T2 | 通知系统升级（notification_events落库 + 异步投递重构） | `[x]` | T1 | T4 | 2026-04-16 |
| T3 | TabBar + 路由骨架（首页/点菜/订单/我的） | `[x]` | — | T5, T6, T7, T9 | 2026-04-16 |
| T4 | 订单API增强（状态扩展 + timeline + GET:id聚合） | `[x]` | T1, T2 | T7, T9, T15, T16 | 2026-04-16 |
| T5 | RecipeForm 图片上传解耦 | `[x]` | T3 | — | 2026-04-16 |
| T6 | MenuPage（点菜页 /menu） | `[x]` | T3 | T9 | 2026-04-16 |
| T7 | 订单详情页 OrderDetailV2（/orders/:id） | `[x]` | T4, T3 | T13 | 2026-04-16 |
| T9 | CreateOrderV2（下单成功跳转订单详情） | `[x]` | T6, T4 | — | 2026-04-16 |

---

## P1 — 互动与复购

| 任务 | 描述 | 状态 | 依赖 | 被依赖 | 完成时间 |
|------|------|------|------|--------|---------|
| T8 | P1互动表 schema（comments/reviews/likes/shares）+ migration | `[x]` | T1 | T10, T11, T12, T17 | 2026-04-16 |
| T10 | 评论 API（GET/POST /api/orders/:id/comments） | `[x]` | T8 | T13, T14, T15, T16 | 2026-04-16 |
| T11 | 评价 API（GET/POST /api/orders/:id/reviews） | `[x]` | T8 | T13, T14, T16, T17 | 2026-04-16 |
| T12 | 点赞/分享 API（like/unlike/share） | `[x]` | T8 | T13, T14, T16, T17 | 2026-04-16 |
| T14 | useOrderInteractions hooks | `[x]` | T10, T11, T12 | T13 | 2026-04-16 |
| T13 | 订单详情页增加互动UI（评论/评价/点赞/分享/再来一单） | `[x]` | T10, T11, T12, T7, T14 | — | 2026-04-16 |

---

## P2 — 家庭活跃机制

| 任务 | 描述 | 状态 | 依赖 | 被依赖 | 完成时间 |
|------|------|------|------|--------|---------|
| T15 | 首页聚合 API（GET /api/home/summary） | `[x]` | T4, T10 | T18 | 2026-04-16 |
| T16 | 我的页聚合 API（GET /api/profile/summary） | `[x]` | T4, T10, T11, T12 | T19 | 2026-04-16 |
| T17 | 成就 API（summary + leaderboard） | `[x]` | T8, T10, T11, T12 | T20 | 2026-04-16 |
| T18 | HomeV2 前端（首页聚合重构） | `[x]` | T15 | — | 2026-04-16 |
| T19 | ProfileV2 前端（我的页聚合重构） | `[x]` | T16 | — | 2026-04-16 |
| T20 | 成就页前端 | `[x]` | T17, T19 | — | 2026-04-16 |

---

## 验收阶段

| 任务 | 描述 | 状态 | 依赖 | 完成时间 |
|------|------|------|------|---------|
| F1 | 计划合规审计（oracle） | `[x]` | 所有 T 任务 | 2026-04-17 |
| F2 | 代码质量审查（unspecified-high） | `[x]` | 所有 T 任务 | 2026-04-17 |
| F3 | 真实 QA 执行（unspecified-high + playwright） | `[x]` | 所有 T 任务 | 2026-04-17 |
| F4 | 范围保真检查（deep） | `[x]` | 所有 T 任务 | 2026-04-17 |

---

## Ready-to-Start 检查器

> 将已完成任务标记为 `[x]` 后，可用此区域快速判断哪些任务已 ready。

### 当前可立即开始（无依赖）

### 解锁条件
- **T2 ready**: T1 `[x]`（已完成）
- **T4 ready**: T1 `[x]` + T2 `[x]`（已完成）
- **T5 ready**: T3 `[x]`（已解锁）
- **T6 ready**: T3 `[x]`（已完成）
- **T7 ready**: T3 `[x]` + T4 `[x]`（已完成）
- **T8 ready**: T1 `[x]`（已完成）
- **T9 ready**: T6 `[x]` + T4 `[x]`（已完成）
- **T10 ready**: T8 `[x]`（已完成）
- **T11 ready**: T8 `[x]`（已完成）
- **T12 ready**: T8 `[x]`（已完成）
- **T13 ready**: T7 `[x]` + T10 `[x]` + T11 `[x]` + T12 `[x]` + T14 `[x]`（已完成）
- **T14 ready**: T10 `[x]` + T11 `[x]` + T12 `[x]`（已完成）
- **T15 ready**: T4 `[x]` + T10 `[x]`（已完成）
- **T16 ready**: T4 `[x]` + T10 `[x]` + T11 `[x]` + T12 `[x]`（已完成）
- **T17 ready**: T8 `[x]` + T10 `[x]` + T11 `[x]` + T12 `[x]`（已完成）
- **T18 ready**: T15 `[x]`（已完成）
- **T19 ready**: T16 `[x]`（已完成）
- **T20 ready**: T17 `[x]` + T19 `[x]`（已完成）
- **F1-F4 ready**: T1~T20 全部 `[x]`

---

## 开发窗口推荐配置

### 最优：2 个窗口并行（P0 阶段）

**窗口 A — 后端**（顺序执行）
```
T15 / T16 / T17（并行）
```

**窗口 B — 前端**（等待相应后端任务完成后执行）
```
T5 / T6（并行）→ T7（等 T4）→ T9 → T14 → T13 → T18 / T19 / T20（并行）
```

### 扩展：4 个窗口（P1 阶段加速）

当 T8 完成后，可同时开 3 个后端子窗口：
- **窗口 A1**: T10（评论 API）
- **窗口 A2**: T11（评价 API）
- **窗口 A3**: T12（点赞/分享 API）

---

## 每个窗口的参考提示词

### 窗口 A（后端），执行 T1

```
执行私厨 V2 任务 T1：DB Schema 扩展 + Drizzle migration

参考计划文件：.sisyphus/plans/private-chef-v2.md 中的 T1 任务。

工作目录：private-chef/backend/

具体操作：
1. 修改 backend/src/db/schema.ts，在 orders 表末尾新增三个字段（cookUserId, completedAt, cancelledAt）
2. 在 schema.ts 末尾新增 orderStatusEvents 表（参考方案文档 7.3.2 节）
3. 新增 notificationEvents 表（参考方案文档 10.3 节）
4. 新增 notificationDeliveries 表（参考方案文档 10.3 节）
5. 导出所有新类型
6. 运行 npm run db:generate 生成 migration
7. 运行 npm run db:migrate 应用
8. 运行 npm run build 确认编译通过

完成后更新 .sisyphus/plans/private-chef-v2-progress.md 中 T1 状态为 [x]
```

### 窗口 B（前端），执行 T3

```
执行私厨 V2 任务 T3：TabBar + 路由结构改版

参考计划文件：.sisyphus/plans/private-chef-v2.md 中的 T3 任务。

工作目录：private-chef/frontend/

具体操作：
1. 修改 frontend/src/pages/layout/TabBar.tsx：把 4 个 tab 改为 首页(/) / 点菜(/menu) / 订单(/orders) / 我的(/profile)，移除"许愿"tab
2. 修改 frontend/src/App.tsx：新增 /menu 路由（占位组件）、新增 /orders/:id 路由（占位组件）、保留 /order/create 兼容路由
3. 创建 frontend/src/pages/menu/MenuPage.tsx（占位：显示"点菜页开发中"）
4. 创建 frontend/src/pages/order/OrderDetailV2.tsx（占位：显示"订单详情开发中"）
5. 运行 npm run build 确认编译通过

完成后更新 .sisyphus/plans/private-chef-v2-progress.md 中 T3 状态为 [x]
```

### 窗口 A（后端），执行 T2（T1 完成后）

```
执行私厨 V2 任务 T2：通知系统升级

参考计划文件：.sisyphus/plans/private-chef-v2.md 中的 T2 任务。

工作目录：private-chef/backend/

前置条件：T1 已完成（notificationEvents 表已存在）

具体操作：
1. 新建 backend/src/services/notification-service.ts，实现 createNotificationEvent() 函数（写入 notification_events 表）和异步投递逻辑
2. 修改 backend/src/lib/wechat.ts：将 notifyNewOrder 改为调用 createNotificationEvent（保留原 notify 函数）
3. 修改 backend/src/routes/orders.ts：POST /api/orders 中替换 notifyNewOrder 调用
4. 确保 payload JSON 包含 orderId 字段
5. 运行 npm run build 确认编译通过

完成后更新 .sisyphus/plans/private-chef-v2-progress.md 中 T2 状态为 [x]
```

---

## 注意事项

1. **familyId 是硬边界**：所有新后端接口必须通过 `authMiddleware` 获取 `familyId`，查询时必须加 `eq(xxx.familyId, familyId)` 条件。
2. **TypeScript 零 any**：所有新文件不得使用 `as any` 或 `@ts-ignore`。
3. **不删除旧数据**：`ratings` 表、`cook_logs` 表保持不变，只新增 V2 表。
4. **图片上传**：RecipeForm 修改后，菜品创建成功标准是 `POST /api/recipes` 返回 201，不包括图片上传结果。
5. **迁移顺序**：T1 的 migration 必须在 T8 的 migration 之前（T8 依赖 T1 建立的 orders 表外键）。
