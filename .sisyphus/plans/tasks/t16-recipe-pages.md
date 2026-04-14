# Task 16 — 前端菜谱页面（列表+详情+表单）

> **Wave**: 3 | **可并行**: 与 T15, T17-T20 同时开始 | **预估**: 60 分钟
>
> **依赖**: T03（shadcn/ui）、T07（菜谱路由）、T08（标签路由）、T09（图片路由）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 这是前端最复杂的任务，涉及多个页面和组件。确保 T03, T07, T08, T09 均已完成。

---

## 目标

实现前端菜谱相关的全部页面：首页（菜谱列表+搜索+筛选）、菜谱详情、创建/编辑菜谱表单、图片上传（COS 直传）。

## 需要创建的文件

### 1. `frontend/src/pages/home/Home.tsx` — 首页（菜谱列表）

- 顶部搜索栏 + 标签筛选 chips
- 菜谱卡片网格/列表（使用 **glass-card** 类实现毛玻璃效果）
- 每张卡片: 首图 + 菜名 + 标签 badges + 平均评分 + 耗时
- TanStack Query 请求 GET /api/recipes + GET /api/tags
- 下拉加载更多（分页）
- 收藏按钮（乐观更新）

### 2. `frontend/src/pages/recipe/RecipeDetail.tsx` — 菜谱详情

- 图片轮播（多图）
- 基础信息卡片: 耗时、份量、标签
- 制作步骤列表
- 烹饪日志时间线 + 评分
- 操作按钮: 编辑、删除、收藏

### 3. `frontend/src/pages/recipe/RecipeForm.tsx` — 创建/编辑菜谱

- 标题、简介、份量、耗时输入
- 步骤编辑器（动态添加/删除/排序步骤）
- **多图上传**: browser-image-compression 压缩 → COS 预签名直传
- 标签多选

### 4. `frontend/src/components/recipe/RecipeCard.tsx` — 菜谱卡片组件

- 复用于首页和收藏页

### 5. `frontend/src/components/recipe/StepEditor.tsx` — 步骤编辑器组件

- 动态添加/删除/排序步骤

### 6. `frontend/src/hooks/useRecipes.ts` — 菜谱相关 hooks

```typescript
useRecipes(params)    // GET /api/recipes with filters
useRecipe(id)         // GET /api/recipes/:id
useCreateRecipe()     // POST mutation
useUpdateRecipe()     // PUT mutation
useDeleteRecipe()     // DELETE mutation
```

### 7. `frontend/src/lib/upload.ts` — 图片上传工具

```typescript
// 关键流程:
// 1. browser-image-compression 压缩至 ≤1MB
// 2. GET /api/upload/presign 获取预签名 URL
// 3. XMLHttpRequest PUT 直传 COS（获取上传进度）
// 4. 返回 COS URL
//
// 关键: 使用 XMLHttpRequest（fetch 无上传进度 API）
// 关键: URL.createObjectURL 后必须 revokeObjectURL
```

## 技术方案参考

- `私厨-技术方案.md` 第 388-393 行 — 菜谱页面结构
- `私厨-技术方案.md` 第 71-79 行 — 图片上传流程
- `私厨-技术方案.md` 第 407-423 行 — UI 风格（毛玻璃卡片 glass-card）
- `私厨-技术方案.md` 第 655-672 行 — 代码注意事项（XMLHttpRequest, revokeObjectURL）

## 验收标准

- [ ] 首页展示菜谱卡片列表（使用 glass-card 毛玻璃效果）
- [ ] 标签筛选和搜索功能正常
- [ ] 菜谱详情展示所有信息（图片、步骤、评分、日志）
- [ ] 图片上传使用 **XMLHttpRequest** + COS 预签名直传（有进度回调）
- [ ] 每个 URL.createObjectURL 有对应 revokeObjectURL
- [ ] 步骤编辑器支持动态添加/删除/排序
- [ ] 收藏按钮支持乐观更新

## 禁止事项

- ❌ 图片上传不使用 Base64
- ❌ 不使用 fetch 上传（无进度回调），**必须用 XMLHttpRequest**
- ❌ URL.createObjectURL 后**必须** revokeObjectURL
- ❌ 不对全宽搜索栏加 backdrop-filter（性能问题）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

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

## 提交

- **Group**: 与 T15, T17-T20 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
