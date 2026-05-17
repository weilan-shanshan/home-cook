# Cook 设计系统 + 菜品流程重做 —— 设计文档

- 日期：2026-05-17
- 范围：`/Users/weilan/ali/ai/cook/private-chef`（前后端）
- 视觉参考：[docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html)
- Tokens 索引：[docs/design/README.md](../../design/README.md)
- 系列定位：3 份 spec 中的 **第 1 份**（design system + 菜品）；后续 spec 2 重做订单、spec 3 重做首页。

## 1. 背景

cook 当前的菜品管理存在 4 个并发问题：

1. **入口不明显 + 无法连续新增** — `MenuPage`（用户主要逛菜的页面）没有「+ 新菜」按钮；创建成功后只能「查看详情/关闭」，表单不会重置。
2. **图片删除无效** — 后端没有单图删除 API；前端 `removeImage` 只 splice 本地 state，已上传图刷新后回来。
3. **菜品删除失败提示不可用** — 后端 409 返回明确原因（被订单引用），但前端 `useDeleteRecipe` 把所有错误吞成"删除菜谱失败"。
4. **整体视觉过时 + 想统一升级** — 用户希望趁机重做整套 UI，建立可复用的 design system。

#4 是 #1–#3 的母任务：先把设计系统建立起来，菜品页作为首个落地点同时修掉 3 个 bug。

## 2. 目标

- **A. 建立可复用 Design System**：颜色 / 字体 / 间距 / 阴影 / 动效一套 token，统一 Tailwind 配置 + shadcn 组件主题；后续 spec 2/3 可直接复用。
- **B. 菜品流程重做**：
  - MenuPage 加「+ 新菜」入口（顶部按钮 + 右下 FAB），结构 / 视觉按 v1 mockup 重做
  - 新增菜品改为 bottom Sheet，提交后原地重置可连续录入
  - RecipeDetail 按 v1 mockup 重做（hero 大图 + 步骤时间线 + sticky 底部操作）
  - 编辑路径 `/recipe/:id/edit` 保留独立页面，复用同一表单内核
- **C. 修 4 个 bug**：
  - 已上传图片支持删除（后端新 API + 前端 confirm + UI 反馈）
  - 菜品被订单引用时给可操作的提示（弹窗列出引用单 + 跳订单列表）
  - 接单的 confirmed→confirmed 错误（已在前一个 commit 修复，不在本 spec 范围内）
  - 整体视觉升级到 v1 mockup（仅菜品相关页面 + AppLayout + Tab bar；订单 / 首页留给后续 spec）

## 3. 非目标 (YAGNI)

- ❌ 订单流程 / 首页（留给 spec 2、3）
- ❌ Profile 页重做（留给后续）
- ❌ 图片批量上传 / 拖拽排序
- ❌ 菜品的「强制删除」选项（产品决定只走「先从订单移除」）
- ❌ 主题切换（暗色模式）— 当前只做亮色，dark mode 等用户需要时再加
- ❌ 国际化 / 多语言

## 4. 设计系统（Design Tokens）

### 4.1 Tailwind 配置变更

修改 `private-chef/frontend/tailwind.config.ts`：

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50: '#FFF1EB', 100: '#FFDFCD', 200: '#FFC2A4',
          300: '#FB9670', 400: '#F37A4F',
          DEFAULT: '#EE6E47', 600: '#D6552F', 700: '#B23E1F',
        },
        // Surface
        cream: {
          50: '#FDFAF5', 100: '#FAF6EE', 200: '#F4EDDF',
          300: '#E8DFD3', 400: '#C9BCA8',
        },
        // Ink (warm dark text)
        ink: {
          900: '#1F1815', 800: '#2D2420', 700: '#3D332C',
          600: '#5C4F46', 500: '#7B6E63', 400: '#9C8E81',
        },
        // Accents
        sage: { 100: '#E8EDD8', 500: '#6B7B3C', 700: '#4A5A28' },
        amber: { 100: '#FCEFD0', 500: '#D97706' },
        rose: { 100: '#FCE4E4', 500: '#B91C1C' },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
      },
      borderRadius: {
        xl: '12px', '2xl': '16px', '3xl': '24px', '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(31, 24, 21, 0.04)',
        elevated: '0 8px 24px rgba(31, 24, 21, 0.08)',
        sheet: '0 -8px 32px rgba(31, 24, 21, 0.12)',
        button: '0 2px 0 rgba(178, 62, 31, 0.2)',
      },
      transitionDuration: { 250: '250ms' },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### 4.2 shadcn 全局 CSS 变量

更新 `private-chef/frontend/src/styles/globals.css` 的 `:root`：

```css
:root {
  --background: 30 30% 98%;          /* cream-50 */
  --foreground: 16 18% 11%;          /* ink-900 */
  --card: 0 0% 100%;
  --card-foreground: 16 18% 11%;
  --primary: 12 90% 58%;             /* brand DEFAULT, 保留 */
  --primary-foreground: 0 0% 100%;
  --secondary: 36 30% 95%;           /* cream-100 */
  --secondary-foreground: 16 18% 11%;
  --muted: 36 30% 95%;
  --muted-foreground: 24 13% 44%;    /* ink-500 */
  --accent: 12 90% 95%;              /* brand-50 */
  --accent-foreground: 12 73% 41%;   /* brand-700 */
  --destructive: 0 72% 41%;          /* rose-500 */
  --destructive-foreground: 0 0% 100%;
  --border: 36 25% 87%;              /* cream-300 */
  --input: 36 25% 87%;
  --ring: 12 90% 58%;                /* brand */
  --radius: 1rem;                    /* base, 各组件按需覆盖 */
}
```

**不动 dark mode 变量** —— 本 spec 不开启暗色，但保留 `.dark` 段，后续如需加可以补全。

### 4.3 字体加载

`private-chef/frontend/index.html` `<head>` 加：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;700;900&display=swap" rel="stylesheet">
```

> 字体走 Google Fonts CDN。如果有国内 CDN 偏好，后续可换 fontsource 自部署。本 spec 不引入这层复杂度。

### 4.4 shadcn 组件主题化（不重写组件，只调样式）

需要按新 token 调整 className 默认值（**通过修改 `src/components/ui/*.tsx` 的 cva variants**）：

| 组件 | 改动 |
|---|---|
| `button.tsx` | default 加 `shadow-button`；圆角 `rounded-full` 或 `rounded-2xl`（按 size 不同） |
| `card.tsx` | `rounded-3xl` + `shadow-card` + `border border-cream-300` |
| `dialog.tsx` | `rounded-3xl`；overlay 改 `bg-ink-900/40 backdrop-blur-sm` |
| `sheet.tsx` | `rounded-t-[32px]` + `shadow-sheet`；drag handle 元素 |
| `input.tsx` / `textarea.tsx` | `rounded-2xl` + `border-2 border-cream-300 focus:border-brand` |
| `badge.tsx` | `rounded-full text-[10px] font-bold`，3 个新 variant：`sage` / `amber` / `rose` |
| `toast.tsx` | `rounded-2xl`；success/destructive 用 sage/rose tone |

### 4.5 全局 Layout 与 Tab Bar

新组件：`src/pages/layout/BottomTabBar.tsx`

替换 `AppLayout.tsx` 现有底部导航。规范：
- 固定底部，`fixed bottom-0`，高度 `pb-7` 适配 iOS safe area
- 4 个 tab：首页 / 菜单 / 订单 / 我
- 选中态：brand 色 icon + brand 文字 + 上方 4px 高指示条
- 未选中：ink-400 icon
- 触控目标 ≥ 44×44

`AppLayout.tsx` 主内容区底部 padding 留 `pb-24` 避开 tab bar。

## 5. 菜品流程详细设计

### 5.1 组件拆分

```
src/components/recipe/
  ├── RecipeCard.tsx                 (改样式 → bento 风格)
  ├── RecipeFormCore.tsx             (新增 — 表单内核，框架无关)
  ├── RecipeSheet.tsx                (新增 — Sheet 容器，嵌 Core，连续新增逻辑)
  ├── RecipeImageGrid.tsx            (新增 — 图片上传/删除栅格，独立组件)
  ├── IngredientStep.tsx             (新增 — 步骤显示组件，带编号圆圈)
  └── RecipeReferencedDialog.tsx     (新增 — 「被 N 单引用」错误 Dialog)

src/hooks/
  ├── useRecipes.ts                  (修 useDeleteRecipe 解析 error body)
  ├── useDeleteRecipeImage.ts        (新增 — 单图删除 mutation)

src/pages/menu/MenuPage.tsx          (重做：加入口 + 视觉刷新)
src/pages/recipe/RecipeForm.tsx      (改为薄壳，仅 /recipe/:id/edit 用)
src/pages/recipe/RecipeDetail.tsx    (重做视觉 + 升级删除 Dialog)
src/pages/order/OrderList.tsx       (加 ?recipeId 查询参数支持)
```

### 5.2 `RecipeFormCore.tsx` —— 表单内核

接收完整 form state + onChange 回调，**纯受控**，不持有 mutation 逻辑。负责：
- 渲染所有 input/textarea/tag picker/image grid/step editor
- 字段 validation 提示
- 不渲染提交按钮（按钮由外层 RecipeSheet 或 RecipeForm 自管）

Props：

```ts
interface RecipeFormCoreProps {
  values: {
    title: string
    description: string
    cookMinutes: number | ''
    servings: number | ''
    steps: string[]
    tags: number[]
    images: ImageItem[]
  }
  onChange: (patch: Partial<RecipeFormCoreProps['values']>) => void
  imageActions: {
    pick: (file: File) => void           // 选了新图
    removeLocal: (localId: string) => void  // 删未上传图（直接前端移除）
    removeUploaded: (imageId: number) => void  // 删已上传图（调 API）
    retry: (localId: string) => void
  }
}

interface ImageItem {
  localId: string                   // 客户端临时 id
  serverId?: number                 // 上传后的后端 id
  url: string                       // 预览或 server url
  thumbUrl?: string
  status: 'picked' | 'uploading' | 'uploaded' | 'error' | 'deleting'
  progress?: number
  errorMessage?: string
}
```

### 5.3 `RecipeSheet.tsx` —— 连续新增容器

挂在 `MenuPage` 内，受控开关。

**状态机**（同 spec 第二段已对齐）：

```
[CLOSED] → 点击 [+ 新菜] → [ENTERING] → [EDITING]
[EDITING] → 提交 (创建并继续) → [SUBMITTING] → 成功 → [RESETTING]
                                                  ↓
                                       toast + 字段清空（保留标签）
                                                  ↓
                                              [EDITING]

[EDITING] → 提交 (创建并关闭) → [SUBMITTING] → 成功 → [EXITING] → [CLOSED]
```

**主提交按钮**：

```
┌──────────────────────────────────────┬──┐
│         创建并继续 →                  │ ▼│  ← 主按钮 + 下拉
└──────────────────────────────────────┴──┘
```

下拉菜单含：
- 创建并继续（默认）
- 创建并关闭
- 创建并查看详情

记忆最近一次选择到 `localStorage['cook.recipe.lastSubmitMode']`，下次预选。

**Toast 文案**：

| 模式 | 文案 |
|---|---|
| 创建并继续 | `✓ 已创建 #N，继续录入下一道` + （若图片在传）`图片在后台上传` |
| 创建并关闭 | `✓ 已创建 #N` + 自动关闭 |
| 创建并查看 | `✓ 已创建 #N` + 跳详情 |

**清空时保留**：
- ✅ 标签选择
- ✅ 默认份数（如果用户改过）

**清空**：标题 / 描述 / 步骤 / 图片队列 / 时长

### 5.4 `RecipeImageGrid.tsx` —— 图片上传/删除

**每张图片渲染逻辑**：

| 状态 | 视觉 | 右上角按钮 |
|---|---|---|
| `picked` | 缩略图 | × （直接移除，无 confirm） |
| `uploading` | 灰蒙 + spinner + `34%` | × （取消上传，无 confirm） |
| `uploaded` | 缩略图 + 右下绿色 ✓ icon | × （**弹 confirm Dialog**，确认后调 DELETE API） |
| `error` | 红蒙 + 左下「失败」 | 「重试」icon |
| `deleting` | 灰蒙 + spinner | （无按钮） |

**confirm Dialog 内容**：「删除这张图？删了不可恢复。」+ 「取消」/「删除」（destructive variant）

**上传队列规则**：
- 选图后立即生成 `ImageItem(status='picked')` 加入 state
- 用户提交表单后 `picked` → `uploading`（如 recipe 已创建）
- recipe 创建成功后，未上传的 `picked` 依次启动 `uploadSingleImage`
- 删除已上传图：`uploaded` → `deleting`，API 成功 → 从 state 移除；失败 → 回 `uploaded` + toast

### 5.5 `MenuPage` 重做

**布局**（按 mockup v1 第 2 张）：
```
顶部 (sticky)
  ┌─ "菜单" 大标题 ─── [+ 新菜] 黑色按钮 ─┐
  │  搜索框                                │
  │  标签 chip 横滑列表                    │
  └────────────────────────────────────────┘
  
内容
  2 列网格 bento 卡片
  
浮动
  右下角 FAB（圆形 brand 色，56×56）
  
底部
  已选购物 bar (sticky 在 tab bar 上方)
  Tab bar
```

**两个新增入口都打开同一个 `<RecipeSheet />`**。点击行为：
- 顶部「+ 新菜」：`setSheetOpen(true)`
- 右下 FAB：同上

FAB 永久显示，即使有已选购物 bar，FAB 也在购物 bar 右侧。

### 5.6 `RecipeDetail` 重做

**布局**（按 mockup v1 第 4 张）：
- 顶部：占满宽度的 hero 图（aspect-[4/3]），叠加返回按钮 + 收藏按钮 + 翻页 dots
- 标题区：陶土色 chip（家常 · 晚餐）+ 大粗黑标题 + 心形收藏（在右上角）
- 元数据 chips：时长 / 份数 / 已做 N 次
- 描述段
- 步骤区：每步左侧编号圆圈（brand 色）+ 文字
- 底部 sticky：[编辑] + [+ 加入点单] 主按钮

**删除按钮**改为「···」更多菜单触发（避免主区操作过满），菜单含「编辑」「删除」。

### 5.7 删除菜品错误 UX

**后端改造** `private-chef/backend/src/routes/recipes.ts` line 631-694：

```ts
recipesRouter.delete('/:id', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }
  const familyId = c.get('familyId')

  const [existing] = sqlite
    .prepare('SELECT id FROM recipes WHERE id = ? AND family_id = ?')
    .all(recipeId, familyId) as Array<{ id: number }>
  if (!existing) return c.json({ error: 'Recipe not found' }, 404)

  // 改成：前置查询关联订单（不再依赖 FOREIGN KEY catch）
  const referencingOrders = sqlite
    .prepare(`
      SELECT DISTINCT o.id, o.meal_date, o.meal_type, o.status
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.recipe_id = ? AND o.family_id = ?
      ORDER BY o.meal_date DESC, o.id DESC
      LIMIT 100
    `)
    .all(recipeId, familyId) as Array<{ id: number; meal_date: string; meal_type: string; status: string }>

  if (referencingOrders.length > 0) {
    return c.json({
      error: 'RECIPE_REFERENCED_BY_ORDERS',
      message: '该菜谱被订单引用，请先从订单移除',
      referencingOrders: referencingOrders.slice(0, 5),
      referencingOrderCount: referencingOrders.length,
    }, 409)
  }

  // 正常删除流程（原有的 transaction 保留）
  ...
})
```

**前端 hook 改造** `private-chef/frontend/src/hooks/useRecipes.ts`：

```ts
export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${baseUrl}/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: '删除失败' }))
        throw Object.assign(new Error(body.message || body.error || '删除失败'), { body })
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
```

**新组件 `RecipeReferencedDialog.tsx`**：当 `error.body.error === 'RECIPE_REFERENCED_BY_ORDERS'` 时，RecipeDetail 替换原有 confirm Dialog 内容：

```
⚠️ 删不了：「红烧肉」被 N 个订单引用

近 5 单：
  · 2026-05-14 晚餐 #128（已完成）
  · ...

[去看这些订单 →] [我知道了]
```

「去看这些订单」跳 `/orders?recipeId=42`。

### 5.8 `OrderList` 加 `?recipeId` 过滤

**前端**：`useOrders` hook 加 `recipeId` 参数，传到 query string。
**后端**：`/api/orders` 加可选 query param `recipeId`，join order_items 过滤。
**UI**：OrderList 顶部显示「筛选：包含『红烧肉』 [×]」chip，点 × 清除（清掉 query string 后重新加载）。

### 5.9 后端新接口：删除单张菜品图片

```
DELETE /api/recipes/:recipeId/images/:imageId

成功：
  200 { success: true }

错误：
  404 { error: 'Image not found' } — 图片不存在或不属于该菜谱
  403 { error: 'Forbidden' } — 跨家庭访问
```

**实现要点**：
- 校验 `recipe.familyId === user.familyId`
- 校验 `image.recipeId === recipeId`
- DELETE FROM `recipe_images` WHERE `id = ? AND recipe_id = ?`
- 不实际删 OSS 对象（懒删，避免外部依赖失败影响 DB 一致性）

## 6. 数据流

### 6.1 新增菜品（连续模式）

```
MenuPage
  ├─ 用户点 [+ 新菜] → setSheetOpen(true)
  │
  └─ <RecipeSheet>
        ├─ 持有 form state + ImageItem 队列
        ├─ <RecipeFormCore values onChange />
        ├─ <RecipeImageGrid items={images} actions={...} />
        └─ 用户点「创建并继续」
              ├─ createMutation.mutate(payload)
              │     └─ POST /api/recipes → { id }
              ├─ queuePendingUploads(id)
              │     └─ 对每张 picked 调 POST /api/recipes/:id/images
              ├─ toast「✓ 已创建 #N，继续录入下一道」
              └─ resetForm (保留标签)
                    └─ 滚顶 + title 聚焦
```

### 6.2 删除已上传图片

```
RecipeImageGrid
  └─ 用户点 uploaded 图右上 ×
      ├─ 弹 confirm Dialog
      └─ 确认 → setStatus('deleting')
            └─ deleteImageMutation.mutate({ recipeId, imageId })
                  ├─ DELETE /api/recipes/:rId/images/:iId
                  ├─ 成功 → 从队列移除
                  └─ 失败 → 回 'uploaded' + toast
```

### 6.3 删除菜品（被引用场景）

```
RecipeDetail
  └─ 用户点 ··· → 删除
      └─ <RecipeReferencedDialog mode="confirm">
            └─ 确认删除
                  ├─ deleteRecipeMutation.mutate(id)
                  └─ 409 → catch
                        └─ <RecipeReferencedDialog mode="blocked"
                                referencingOrders={...}
                                count={...}>
                              └─ 用户点「去看这些订单」
                                    └─ navigate(`/orders?recipeId=${id}`)
```

## 7. 错误处理

| 场景 | 处理 |
|---|---|
| 创建菜品失败（网络/校验） | 表单不重置，toast destructive，按钮回到可点状态 |
| 单图上传失败 | 该图变 `error`，其它图继续，可点重试 |
| 单图删除失败 | 状态回 `uploaded`，toast 提示「图片删除失败，请稍后重试」 |
| 删除菜品被引用 | 弹 RecipeReferencedDialog blocked 模式（不是 toast） |
| 删除菜品其它失败 | toast destructive |
| Sheet 关闭时表单有未保存改动 | 显示 confirm「放弃当前编辑？」+ 确认/继续编辑 |
| localStorage 不可用 | submitMode 退化为「创建并继续」默认值，不崩溃 |

## 8. 测试

cook 后端用 vitest + 集成测试；前端用 vitest + @testing-library/react + jsdom。

### 8.1 后端

- `recipes.test.ts` 新增：
  - DELETE recipe 被订单引用 → 409 with `referencingOrders` 数组（前 5 条） + `referencingOrderCount`
  - DELETE recipe 无引用 → 200，关联 tags/images/favorites/ratings/cookLogs 全部清理
  - DELETE recipe 不存在 → 404
  - DELETE recipe 跨家庭 → 404（owner check）
- `recipe-images.test.ts` 新建：
  - DELETE 自家菜谱的图 → 200 + DB 行消失
  - DELETE 跨家庭图 → 403
  - DELETE 不存在图 → 404
- `orders.test.ts` 增补：
  - GET `/api/orders?recipeId=42` 只返回包含该 recipe 的订单

### 8.2 前端

- `useDeleteRecipe.test.ts`：mock fetch 返回 409 with body，断言抛出的 error 带 `.body.referencingOrders`
- `RecipeReferencedDialog.test.tsx`：mode='blocked' 时渲染订单列表 + 跳转按钮 click 行为
- `RecipeImageGrid.test.tsx`：
  - 删 picked 状态图直接移除，不弹 confirm
  - 删 uploaded 状态图弹 confirm，确认后调 actions.removeUploaded(id)
- `RecipeSheet.test.tsx`：
  - 「创建并继续」成功后表单字段重置但标签保留
  - 「创建并关闭」成功后 onOpenChange(false) 被调用
  - lastSubmitMode 写入 localStorage

### 8.3 不写测试

- `RecipeFormCore.tsx`：纯受控组件，逻辑在父级
- `IngredientStep.tsx` / `BottomTabBar.tsx`：静态展示
- 视觉刷新（tailwind 类调整）：无业务逻辑

### 8.4 手动验证清单

实施后跑：
1. 桌面 + 手机视口（375 / 768） MenuPage 看入口齐全（顶部 + FAB），不互相遮挡
2. 点 + 新菜 → 弹 Sheet → 填表 → 创建并继续 → toast → 表单清空，标签保留，title focus
3. 在 Sheet 内删未上传图 → 立即消失无 confirm
4. 在编辑页删已上传图 → 弹 confirm → 删除成功
5. 删除有订单引用的菜品 → 看到 blocked Dialog → 点跳转按钮 → 到 `/orders?recipeId=N` 看到筛选 chip
6. 删除无引用菜品 → 正常删除
7. RecipeDetail 视觉：hero 图 / chip / 步骤编号 / sticky 底部操作 是否按 mockup
8. AppLayout 底部 tab bar 视觉是否按 mockup（不要遮挡内容，pb-24 留出来）

## 9. 部署 / 兼容

- 字体 CDN：`fonts.googleapis.com` —— cook 国内用户能不能稳定加载？提前测下；不行就退到 `font-display: swap` 自带 fallback
- shadcn 主题改动**不破坏现有组件**（class merge 仍生效），但所有页面会自动应用新视觉。订单 / 首页页面会先「半新半旧」（背景色 / 卡片样式变新，但布局结构旧），spec 2、3 落地后才完整统一
- 后端新 API 走现有 `authMiddleware`，无需额外鉴权设施

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| Tailwind config 改动导致已有页面（订单/首页）视觉错乱 | 自检清单：跑一遍所有页面截图对比；shadcn 主题改动谨慎，保留 fallback hsl 变量 |
| 字体下载慢影响首屏 | `font-display: swap`；首屏 fallback 用系统 sans/serif 不破坏布局 |
| 删除 recipe 的 referencingOrders 查询慢（大数据量） | join 走 `recipe_id` + `family_id` 索引；LIMIT 100；当前数据量无压力 |
| Sheet 内连续新增的图片上传 race | RecipeSheet 持有 imagesRef 跟踪当前 recipe 的图片；提交清空时旧 recipe 的上传任务仍能完成（用 closure 抓住 recipeId） |
| 用户在 Sheet 关闭时丢未保存改动 | confirm Dialog 拦截 |

## 11. 文件清单（实施时严格按此清单）

### 新增

- `private-chef/frontend/src/components/recipe/RecipeFormCore.tsx`
- `private-chef/frontend/src/components/recipe/RecipeSheet.tsx`
- `private-chef/frontend/src/components/recipe/RecipeImageGrid.tsx`
- `private-chef/frontend/src/components/recipe/IngredientStep.tsx`
- `private-chef/frontend/src/components/recipe/RecipeReferencedDialog.tsx`
- `private-chef/frontend/src/pages/layout/BottomTabBar.tsx`
- `private-chef/frontend/src/hooks/useDeleteRecipeImage.ts`
- `private-chef/backend/src/__tests__/recipe-images.test.ts`
- 测试文件若干（见 §8）

### 修改

- `private-chef/frontend/tailwind.config.ts`（design tokens）
- `private-chef/frontend/src/styles/globals.css`（shadcn CSS vars）
- `private-chef/frontend/index.html`（字体 link）
- `private-chef/frontend/src/components/ui/{button,card,dialog,sheet,input,textarea,badge,toast}.tsx`（cva variants）
- `private-chef/frontend/src/pages/menu/MenuPage.tsx`（入口 + 视觉重做）
- `private-chef/frontend/src/pages/recipe/RecipeForm.tsx`（薄壳，仅编辑路径用）
- `private-chef/frontend/src/pages/recipe/RecipeDetail.tsx`（视觉重做 + 删除 Dialog 升级）
- `private-chef/frontend/src/pages/layout/AppLayout.tsx`（接 BottomTabBar，主区 pb-24）
- `private-chef/frontend/src/pages/order/OrderList.tsx`（加 ?recipeId 支持）
- `private-chef/frontend/src/hooks/useRecipes.ts`（useDeleteRecipe 解析 error body）
- `private-chef/frontend/src/hooks/useOrders.ts`（加 recipeId 参数）
- `private-chef/backend/src/routes/recipes.ts`（删除接口增强 + 新增 DELETE image 路由）
- `private-chef/backend/src/routes/orders.ts`（GET 加 recipeId 过滤）

### 删除

- `private-chef/frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx`（被 RecipeSheet 内的 toast + 重置流程取代）
- `private-chef/frontend/src/components/recipe/RecipeUploadQueue.tsx`（功能并入 RecipeImageGrid）

## 12. 后续 spec

- **Spec 2**：订单流程重做（OrderList + OrderDetail + Home 活跃单卡），复用本 spec 的 design system
- **Spec 3**：首页 Home 重做（bento 模块 + 常做菜推荐），复用本 spec 的 design system

两份后续 spec 写时直接引用本 spec 的 §4 Design Tokens，不再重复定义。
