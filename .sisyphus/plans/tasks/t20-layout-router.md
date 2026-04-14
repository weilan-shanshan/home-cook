# Task 20 — 前端布局+路由+TabBar

> **Wave**: 3 | **可并行**: 与 T15-T19 同时开始 | **预估**: 30 分钟
>
> **依赖**: T03（shadcn/ui）、T06（认证路由 — RequireAuth 需要）
>
> **后续任务等我完成**: T26（前端部署配置）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

实现前端全局布局（AppLayout + TabBar）和完整路由配置，将所有页面串联起来。

## 需要创建的文件

### 1. `frontend/src/pages/layout/AppLayout.tsx` — 全局布局

- 顶部区域（可选标题栏）
- 内容区（React Router Outlet）
- 底部 TabBar

### 2. `frontend/src/pages/layout/TabBar.tsx` — 底部导航

- 4 个 Tab:
  1. 首页（菜谱）— 图标: Home / ChefHat
  2. 点餐 — 图标: UtensilsCrossed
  3. 许愿 — 图标: Star / Sparkles
  4. 我的 — 图标: User
- 使用 **Lucide React** 图标
- 毛玻璃效果: 使用 **glass-nav** 类（较轻的 blur，非重度 backdrop-filter）
- 当前 Tab 高亮
- **注意**: TabBar 是 fixed bottom 全宽元素，使用 glass-nav 而非 glass-card

### 3. 更新 `frontend/src/App.tsx` — React Router 路由配置

```typescript
// 路由表:
// 公开路由
/login          → Login
/register       → Register

// 受保护路由（RequireAuth 包裹）
/               → Home (菜谱列表)
/recipe/:id     → RecipeDetail
/recipe/new     → RecipeForm (新建)
/recipe/:id/edit → RecipeForm (编辑)
/order/create   → OrderCreate
/orders         → OrderList
/wishes         → WishList
/favorites      → Favorites
/profile        → Profile
```

- 受保护路由使用 T15 的 `RequireAuth` 组件包裹
- 配置 TanStack Query Provider（QueryClientProvider in App.tsx 或 main.tsx）

## 技术方案参考

- `私厨-技术方案.md` 第 402-404 行 — 布局结构
- `私厨-技术方案.md` 第 383-404 行 — 完整页面路由结构
- `私厨-技术方案.md` 第 418-422 行 — 毛玻璃效果分级（glass-nav vs glass-card）

## 验收标准

- [ ] 底部 TabBar 4 个 Tab 正确导航
- [ ] 所有 11 个路由配置正确
- [ ] 受保护路由未登录时重定向到 /login
- [ ] TabBar 使用 **glass-nav** 毛玻璃效果（非 glass-card）
- [ ] TanStack Query Provider 配置就绪

## 禁止事项

- ❌ TabBar 不使用重度 backdrop-filter（会导致严重卡顿）
- ❌ 必须使用 glass-nav 类（较轻的 blur）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Tab navigation works
  Tool: Playwright
  Preconditions: Authenticated user
  Steps:
    1. Navigate to /
    2. Assert TabBar visible at bottom with 4 tabs
    3. Click "点餐" tab
    4. Assert URL is /order/create
    5. Click "许愿" tab
    6. Assert URL is /wishes
    7. Click "我的" tab
    8. Assert URL is /profile
  Expected Result: All tabs navigate correctly
  Evidence: .sisyphus/evidence/task-20-tabbar.png

Scenario: Glass nav effect renders
  Tool: Playwright
  Steps:
    1. Navigate to /
    2. Take screenshot of bottom navigation area
    3. Assert TabBar has glass-nav CSS class or equivalent backdrop-filter style
  Expected Result: Translucent navigation bar visible
  Evidence: .sisyphus/evidence/task-20-glass-nav.png
```

## 提交

- **Group**: 与 T15-T19 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
