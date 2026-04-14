# Task 07 — 菜谱 CRUD 路由

> **Wave**: 2 | **可并行**: 与 T06, T08-T14 同时开始 | **预估**: 50 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T16（前端菜谱页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/recipes.ts`，实现菜谱的完整 CRUD，包含列表（分页+筛选+搜索）、详情（多表 JOIN）、创建、更新、删除（RESTRICT 保护）。这是最复杂的后端路由模块。

## 需要创建的文件

### `backend/src/routes/recipes.ts`

5 个端点：

1. **`GET /api/recipes`** — 菜谱列表
   - WHERE family_id = familyId
   - 支持 `?tag=` 标签筛选
   - 支持 `?q=` 标题搜索（LIKE）
   - 分页: `?page=1&limit=20`
   - 返回: 菜谱基础信息 + 首图 + 标签 + 平均评分
   - **使用 JOIN 一次获取，禁止 N+1**

2. **`GET /api/recipes/:id`** — 菜谱详情
   - WHERE family_id = familyId AND id = :id
   - 包含: 基础信息 + 所有图片 + 标签 + 最近烹饪日志 + 平均评分 + 当前用户是否已收藏
   - **使用 JOIN/子查询一次获取，禁止 N+1**

3. **`POST /api/recipes`** — 创建菜谱
   - Zod 校验: title (必填), description, steps (JSON array), cook_minutes, servings, difficulty
   - family_id 从认证中间件获取
   - 支持同时关联标签 (tags: number[])

4. **`PUT /api/recipes/:id`** — 更新菜谱
   - 验证 family_id 归属
   - 支持更新标签关联（先删后插 recipe_tags）

5. **`DELETE /api/recipes/:id`** — 删除菜谱
   - 验证 family_id 归属
   - 若有 order_items 引用则返回 409 Conflict（RESTRICT 外键拦截，需友好错误信息）

### Zod 校验 Schema

```typescript
const createRecipeSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  steps: z.array(z.string()).min(1),
  cook_minutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.number()).optional(), // tag IDs
})
```

## 技术方案参考

- `私厨-技术方案.md` 第 314-321 行 — 菜谱 API 设计
- `私厨-技术方案.md` 第 174-185 行 — recipes 表结构
- `私厨-技术方案.md` 第 198-209 行 — tags 和 recipe_tags 表结构

## 验收标准

- [ ] 5 个菜谱端点全部实现
- [ ] 所有查询包含 WHERE family_id = ?
- [ ] 列表支持标签筛选（`?tag=`）和搜索（`?q=`）
- [ ] 列表支持分页（`?page=&limit=`）
- [ ] 详情页一次查询获取关联数据（图片/标签/评分/收藏状态）
- [ ] 删除被 order_items 引用的菜谱返回 409
- [ ] 零 N+1 查询（不在循环中查数据库）
- [ ] steps 字段存为 JSON TEXT，不拆独立表

## 禁止事项

- ❌ 不在循环中查询数据库（N+1）
- ❌ 不跳过 family_id 校验（IDOR 漏洞）
- ❌ steps 字段不拆独立表，存为 JSON TEXT
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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
  Evidence: .sisyphus/evidence/task-7-recipe-crud.txt

Scenario: IDOR prevention - cannot access other family's recipes
  Tool: Bash (curl)
  Preconditions: Two families with different users, recipe in family A
  Steps:
    1. Login as family B user
    2. GET /api/recipes/:id (recipe belongs to family A)
    3. Assert 404 (not 200)
  Expected Result: 404 Not Found
  Evidence: .sisyphus/evidence/task-7-idor.txt
```

## 提交

- **Group**: 与 T08, T09 一起提交
- **Message**: `feat(api): add recipe CRUD, tags, and image upload routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
