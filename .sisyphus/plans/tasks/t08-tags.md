# Task 08 — 标签系统路由

> **Wave**: 2 | **可并行**: 与 T06, T07, T09-T14 同时开始 | **预估**: 20 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T16（前端菜谱页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/tags.ts`，实现标签 CRUD（3 个端点），支持家庭内标签唯一约束。

## 需要创建的文件

### `backend/src/routes/tags.ts`

3 个端点：

1. **`GET /api/tags`** — 当前家庭的标签列表
   - WHERE family_id = familyId

2. **`POST /api/tags`** — 创建标签
   - family_id + name
   - UNIQUE(family_id, name) 约束 → 重复返回 409

3. **`DELETE /api/tags/:id`** — 删除标签
   - 验证 family_id 归属
   - CASCADE 删除 recipe_tags 关联

### Zod 校验

```typescript
const createTagSchema = z.object({
  name: z.string().trim().min(1),
})
```

## 技术方案参考

- `私厨-技术方案.md` 第 333-337 行 — 标签 API 设计
- `私厨-技术方案.md` 第 198-209 行 — tags + recipe_tags 表

## 验收标准

- [ ] 3 个标签端点实现
- [ ] UNIQUE(family_id, name) 约束生效 → 重复返回 409
- [ ] 所有查询带 family_id 过滤
- [ ] 删除标签时 CASCADE 清理 recipe_tags

## 禁止事项

- ❌ 不跳过 family_id 校验
- ❌ 不允许创建重复标签名（同一家庭内）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T07, T09 一起提交
- **Message**: `feat(api): add recipe CRUD, tags, and image upload routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
