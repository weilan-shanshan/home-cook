# Task 18 — 前端许愿+收藏+烹饪日志页面

> **Wave**: 3 | **可并行**: 与 T15-T17, T19-T20 同时开始 | **预估**: 35 分钟
>
> **依赖**: T03（shadcn/ui）、T11（许愿路由）、T12（收藏路由）、T13（烹饪日志路由）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

实现前端许愿菜单、收藏列表、烹饪日志+评分相关的页面和组件。

## 需要创建的文件

### 1. `frontend/src/pages/wish/WishList.tsx` — 许愿菜单

- 许愿列表（按状态分组: pending / fulfilled）
- 添加许愿弹窗（shadcn/ui Dialog）
- 状态切换（pending → fulfilled/cancelled）

### 2. `frontend/src/pages/favorites/Favorites.tsx` — 我的收藏

- 收藏的菜谱卡片列表（复用 RecipeCard 组件）
- 点击跳转菜谱详情
- 取消收藏（按钮或滑动）

### 3. 在 RecipeDetail.tsx 中集成的组件

> 注意：RecipeDetail.tsx 由 T16 创建，本任务负责烹饪日志和评分的子组件

- 烹饪日志时间线组件
- 评分星星 + 评论输入组件
- 记录烹饪按钮

### 4. hooks 文件

```typescript
// frontend/src/hooks/useWishes.ts
useWishes(params)       // GET /api/wishes
useCreateWish()         // POST mutation
useUpdateWishStatus()   // PUT mutation

// frontend/src/hooks/useFavorites.ts
useFavorites()          // GET /api/favorites
useToggleFavorite()     // POST/DELETE mutation (乐观更新)

// frontend/src/hooks/useCookLogs.ts
useCookLogs(recipeId?)  // GET /api/cook-logs or /api/recipes/:id/logs
useCreateCookLog()      // POST mutation
useCreateRating()       // POST mutation
```

## 技术方案参考

- `私厨-技术方案.md` 第 396-399 行 — 许愿/收藏页面结构
- `私厨-技术方案.md` 第 355-377 行 — 许愿/收藏/评分 API

## 验收标准

- [ ] 许愿列表含添加弹窗和状态切换
- [ ] 收藏页展示菜谱卡片（复用 RecipeCard）
- [ ] 烹饪日志时间线在菜谱详情页可见
- [ ] 评分功能（1-5 星 + 评论）
- [ ] 记录烹饪按钮可用

## 禁止事项

- ❌ 不使用裸 fetch
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T15-T17, T19-T20 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
