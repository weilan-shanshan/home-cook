# Task 10 — 点餐系统路由

> **Wave**: 2 | **可并行**: 与 T06-T09, T11-T14 同时开始 | **预估**: 40 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T17（前端点餐页面）、T21（后端集成）、T23（关键路径测试）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/orders.ts`，实现点餐系统 CRUD，包含事务创建（order + order_items 原子操作）、状态流转控制（单向 pending→confirmed→completed）、企微通知触发。

## 需要创建的文件

### `backend/src/routes/orders.ts`

4 个端点：

1. **`GET /api/orders`** — 点餐单列表
   - WHERE family_id = familyId
   - 支持 `?status=` 筛选
   - 支持 `?meal_date=` 日期筛选
   - 返回订单 + order_items（含菜谱标题和首图）
   - **JOIN 获取，禁止 N+1**

2. **`POST /api/orders`** — 创建点餐单
   - Zod 校验:
     ```typescript
     const createOrderSchema = z.object({
       meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
       meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
       items: z.array(z.object({
         recipe_id: z.number().int().positive(),
         quantity: z.number().int().positive().default(1),
       })).min(1),
     })
     ```
   - **事务**: 创建 order + 批量插入 order_items
   - 创建成功后调用 T05 的 `notifyNewOrder()` 触发企微通知

3. **`GET /api/orders/:id`** — 点餐单详情
   - 含所有 items + 菜谱信息
   - 验证 family_id 归属

4. **`PUT /api/orders/:id/status`** — 更新状态
   - 状态流转校验: 只允许单向 pending→confirmed→completed
   - 非法回退返回 400

## 技术方案参考

- `私厨-技术方案.md` 第 363-369 行 — 点餐 API 设计
- `私厨-技术方案.md` 第 245-262 行 — orders + order_items 表
- `私厨-技术方案.md` 第 580-587 行 — 点餐通知场景

## 验收标准

- [ ] 4 个点餐端点实现
- [ ] 创建订单使用事务（order + order_items 原子操作）
- [ ] 状态流转单向：pending → confirmed → completed，回退返回 400
- [ ] 创建订单触发企微通知（调用 notifyNewOrder）
- [ ] 所有查询带 family_id 过滤
- [ ] 列表使用 JOIN 获取菜谱信息，零 N+1

## 禁止事项

- ❌ 不允许状态回退（completed → pending）
- ❌ 不在循环中查询 recipe 详情（使用 JOIN）
- ❌ 不跳过 family_id 校验
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T11, T12 一起提交
- **Message**: `feat(api): add order, wish, and favorites routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
