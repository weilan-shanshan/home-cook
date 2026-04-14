# Task 11 — 许愿菜单路由

> **Wave**: 2 | **可并行**: 与 T06-T10, T12-T14 同时开始 | **预估**: 20 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T18（前端许愿+收藏+日志页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/wishes.ts`，实现许愿菜单功能（3 个端点），包含企微通知触发和状态管理。

## 需要创建的文件

### `backend/src/routes/wishes.ts`

3 个端点：

1. **`GET /api/wishes`** — 许愿列表
   - WHERE family_id = familyId
   - 支持 `?status=` 筛选 (pending/fulfilled/cancelled)

2. **`POST /api/wishes`** — 创建许愿
   - Zod 校验:
     ```typescript
     const createWishSchema = z.object({
       dish_name: z.string().trim().min(1),
       note: z.string().optional(),
     })
     ```
   - 创建成功后调用 T05 的 `notifyNewWish()` 触发企微通知

3. **`PUT /api/wishes/:id`** — 更新状态
   - 状态: pending / fulfilled / cancelled
   - fulfilled 时可关联 recipe_id（表示这个菜已经做了）
   - 验证 family_id 归属

## 技术方案参考

- `私厨-技术方案.md` 第 355-360 行 — 许愿 API
- `私厨-技术方案.md` 第 233-242 行 — wishes 表

## 验收标准

- [ ] 3 个许愿端点实现
- [ ] 许愿创建触发企微通知
- [ ] fulfilled 状态可关联 recipe_id
- [ ] 所有查询带 family_id 过滤

## 禁止事项

- ❌ 不跳过 family_id 校验
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T10, T12 一起提交
- **Message**: `feat(api): add order, wish, and favorites routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
