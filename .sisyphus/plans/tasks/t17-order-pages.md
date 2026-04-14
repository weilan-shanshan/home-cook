# Task 17 — 前端点餐页面（点餐创建+列表）

> **Wave**: 3 | **可并行**: 与 T15-T16, T18-T20 同时开始 | **预估**: 35 分钟
>
> **依赖**: T03（shadcn/ui）、T10（点餐路由）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

实现前端点餐相关页面：点餐创建（选菜+提交）和点餐单列表（按日期分组+状态展示）。

## 需要创建的文件

### 1. `frontend/src/pages/order/OrderCreate.tsx` — 点餐页

- 选择餐类: 早餐/午餐/晚餐/加餐（4 个选项卡或下拉）
- 选择日期（默认今天）
- 浏览菜谱列表（可按标签筛选）
- 勾选菜品 + 设置数量
- 提交点餐单
- 提交成功后 Toast 提示

### 2. `frontend/src/pages/order/OrderList.tsx` — 点餐单列表

- 按日期分组展示
- 状态 badge:
  - pending → 黄色/橙色
  - confirmed → 蓝色
  - completed → 绿色
- 点击查看详情（展开或跳转）

### 3. `frontend/src/hooks/useOrders.ts` — 点餐 hooks

```typescript
useOrders(params)       // GET /api/orders with filters
useOrder(id)            // GET /api/orders/:id
useCreateOrder()        // POST mutation
useUpdateOrderStatus()  // PUT mutation
```

## 技术方案参考

- `私厨-技术方案.md` 第 394-395 行 — 点餐页面结构
- `私厨-技术方案.md` 第 363-369 行 — 点餐 API

## 验收标准

- [ ] 点餐创建页支持选菜 + 设置数量
- [ ] 点餐列表按日期分组
- [ ] 状态 badge 颜色区分（pending/confirmed/completed）
- [ ] 提交成功 Toast 提示

## 禁止事项

- ❌ 不使用裸 fetch
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T15-T16, T18-T20 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
