# Task 12 — 收藏路由

> **Wave**: 2 | **可并行**: 与 T06-T11, T13-T14 同时开始 | **预估**: 15 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T18（前端许愿+收藏+日志页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/favorites.ts`，实现收藏菜谱功能（3 个端点）。

## 需要创建的文件

### `backend/src/routes/favorites.ts`

3 个端点：

1. **`GET /api/favorites`** — 我的收藏列表
   - WHERE user_id = 当前用户
   - JOIN recipes 获取菜谱信息（标题、首图、标签等）

2. **`POST /api/favorites/:recipeId`** — 收藏菜谱
   - 验证 recipe 属于当前家庭
   - 重复收藏返回 409 Conflict

3. **`DELETE /api/favorites/:recipeId`** — 取消收藏
   - 验证归属后删除

## 技术方案参考

- `私厨-技术方案.md` 第 371-377 行 — 收藏 API
- `私厨-技术方案.md` 第 265-270 行 — favorites 表

## 验收标准

- [ ] 3 个收藏端点实现
- [ ] 收藏前验证 recipe 属于当前家庭
- [ ] 重复收藏返回 409
- [ ] 收藏列表 JOIN 菜谱信息

## 禁止事项

- ❌ 不跳过 family_id 校验
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T10, T11 一起提交
- **Message**: `feat(api): add order, wish, and favorites routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
