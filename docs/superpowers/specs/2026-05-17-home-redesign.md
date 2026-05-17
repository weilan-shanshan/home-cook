# Cook 首页 Home 重做（Spec 3）

- 日期：2026-05-17
- 范围：`/Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/home/Home.tsx` + 新建 `src/components/home/*`
- 视觉参考：[docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html) 第 1 张手机框
- 设计系统：复用 Spec 1（token）+ Spec 2（OrderCard）
- 系列定位：3 份 spec 中的 **第 3 份**（也是最后一份），Spec 1/2 已落地。

## 1. 背景

Home.tsx 462 行，含 7 个 section。Spec 2 已迁移 active orders 区块到 `OrderCard`。剩余 6 段（Header、Achievements、Shortcuts、Recommended Recipes、Frequent Recipes、Recent Orders、Recent Comments）仍是 Spec 1 之前的旧视觉：`glass-card`、`bg-secondary`、单独彩色 shortcut、`text-foreground`/`text-muted-foreground` 等。

结构性问题：
1. Home.tsx 体量过大，所有 section 内联 JSX
2. `mealTypeLabel` 残留（Spec 2 final review 已修复一处，但 Recent Orders 内仍用本地的 `mealType` 字段直显示）
3. Recent Orders section 是手写订单卡片，没复用 Spec 2 的 OrderCard

## 2. 目标

- **视觉统一**：6 个未迁移 section 全部用 Spec 1 token
- **拆分 Home.tsx**：抽出 6 个小组件，Home.tsx 只负责数据 + 编排
- **复用 OrderCard**：Recent Orders 改用 `<OrderCard mode="default" />`
- **删除 `dark:*` 视觉杂音**：本 spec 暂不支持暗色，去掉散落的 `dark:` 类（让 globals.css `:root.dark` 后续接管）

## 3. 非目标 (YAGNI)

- ❌ 改首页业务逻辑（数据源、状态、跳转目标都不变）
- ❌ 新增 section（成就墙、推送等）
- ❌ 暗色模式落地
- ❌ 服务端推荐算法调整

## 4. 组件拆分

新增 6 个组件，全部放在 `src/components/home/`：

### 4.1 `HomeHeader.tsx`

```tsx
interface Props {
  displayName: string | null
  onShareMenu: () => void
}
```

- "私厨" 大标题（text-3xl font-extrabold）+ `Sparkles` icon brand 色
- 副标题: `"{displayName}，今天想吃点什么？"` (text-ink-500)
- 右上「分享菜单」outline 按钮，brand 色 text，点击触发 `onShareMenu`

### 4.2 `AchievementStats.tsx`

```tsx
interface Props {
  totalOrders: number
  totalCooks: number
}
```

2 列 bento，圆角 24px：
- 总点餐数: `bg-sage-100 text-sage-700 + Utensils icon`
- 被掌勺数: `bg-amber-100 text-amber-500 + ChefHat icon`

### 4.3 `HomeShortcuts.tsx`

4 列网格快捷入口。每个 item：圆角 16px 容器、cream-100 底、ink icon。

固定 4 项：
- 点菜 → `/menu`（Utensils）
- 我的订单 → `/orders`（ClipboardList）
- 收藏 → `/favorites`（Heart）
- 发布菜品 → `/menu`（PlusCircle）（Spec 1 已重定向 /recipe/new → /menu）

### 4.4 `HomeRecipeRail.tsx`

横向滚动菜品轨道，Recommended / Frequent 共用：

```tsx
interface Props {
  title: string                  // "今日推荐" / "常点好菜"
  icon: React.ReactNode           // 标题前的 icon
  iconClassName?: string          // icon 容器底色，默认 brand
  recipes: Array<{
    recipeId: number
    title: string
    image: { url: string; thumbUrl: string | null } | null
    orderCount: number
  }>
  countLabel: (count: number) => string  // "点过 N 次" / "做过 N 次"
}
```

- 标题行 + 横滑列表
- 卡片：4:5 比例 + brand-100→brand-300 渐变兜底 + 菜名 + count
- 空 list → 整段不渲染

### 4.5 `HomeRecentComments.tsx`

```tsx
interface Props {
  comments: RecentCommentSummary[]
}
```

包了标题 + 多行 `HomeCommentRow`。空 list 不渲染。

### 4.6 `HomeCommentRow.tsx`

单条评论卡片：
- 左侧 Avatar（color = brand-100 + brand-700 字）
- 右侧：displayName + role chip（点单人/掌勺）+ 内容预览（line-clamp-2）+ relative time

## 5. Home.tsx 重组

新结构（约 100-130 行）：

```tsx
import { HomeHeader, AchievementStats, HomeShortcuts, HomeRecipeRail, HomeRecentComments } from '@/components/home/*'
import { OrderCard } from '@/components/order/OrderCard'

export default function Home() {
  const { data, isLoading, isError } = useHomeSummary()
  const { data: currentUser } = useCurrentUser()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // handleUpdateStatus 保留（active orders 用）

  if (isLoading) return <Loading />
  if (isError || !data) return <ErrorView />

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <HomeHeader
        displayName={currentUser?.display_name ?? null}
        onShareMenu={() => setShareDialogOpen(true)}
      />

      {/* Active Orders — Spec 2 already shipped this section */}
      <ActiveOrdersSection ... />

      <AchievementStats
        totalOrders={data.achievementSummary.totalOrders}
        totalCooks={data.achievementSummary.totalCooks}
      />

      <HomeShortcuts />

      <HomeRecipeRail
        title="今日推荐"
        icon={<Star className="w-5 h-5" />}
        iconClassName="bg-amber-100 text-amber-500"
        recipes={data.recommendedRecipes}
        countLabel={(n) => `点过 ${n} 次`}
      />

      <HomeRecipeRail
        title="常点好菜"
        icon={<ChefHat className="w-5 h-5" />}
        iconClassName="bg-brand-100 text-brand-700"
        recipes={data.frequentRecipes}
        countLabel={(n) => `做过 ${n} 次`}
      />

      {/* Recent Orders — re-using Spec 2 OrderCard */}
      <RecentOrdersSection
        orders={data.recentOrders}
        currentUserId={currentUser?.id ?? null}
        onAction={handleUpdateStatus}
        isPending={isUpdating}
      />

      <HomeRecentComments comments={data.recentComments} />

      <ShareDialog ... />
    </div>
  )
}
```

`ActiveOrdersSection` 和 `RecentOrdersSection` 是 Home.tsx 内的小局部组件（不抽到 components/home/，因为只 Home 用），但 JSX 体量可控。

### 5.1 RecentOrdersSection 数据适配

`data.recentOrders` 类型 `RecentOrderSummary[]` 跟 `OrderCard` 需要的 `OrderCardData` 不完全一致：
- `RecentOrderSummary` 仅有 `id, mealType, mealDate, status, createdAt, requester, recipeTitles[]`（**没有 items 的图片**）
- 需要 adapter `recentToCardData(o)`，items 字段构造为 `recipeTitles.map(t => ({recipeId: 0, recipeTitle: t, image: null}))`
- `cook` 字段在 RecentOrderSummary 上不存在 → `hasCook: false`，`cookUserId: null`，`cookDisplayName: null`

Adapter 局限：Recent Orders 卡片显示的菜品缩略图全部 fallback 图标，无法显示真图。**这是产品方决策**：如果想显示真图，需扩展后端 RecentOrderSummary 字段。本 spec 暂不扩展（YAGNI）。最多 3 条订单显示有限影响。

## 6. 共用样式约定

所有 Home section 容器：
- 卡片底：`bg-white`
- 边框：`border border-cream-300`
- 圆角：`rounded-3xl`
- shadow：`shadow-card`（带 hover 时 `transition-shadow hover:shadow-elevated`）

文字：
- 标题：`text-xl font-bold tracking-tight text-ink-900`
- 副标题/二级：`text-xs font-bold uppercase tracking-wider text-ink-500`
- 正文：`text-sm text-ink-700`
- 提示：`text-[11px] text-ink-500`

Icon 容器：圆形 `bg-brand/10 p-1.5 rounded-lg` 或方形 `bg-cream-100 rounded-2xl p-3.5`

## 7. 数据流（不变）

```
Home
  ├─ useHomeSummary() → data
  │    ├─ data.activeOrders → ActiveOrdersSection（同 Spec 2）
  │    ├─ data.achievementSummary → AchievementStats
  │    ├─ data.recommendedRecipes → HomeRecipeRail
  │    ├─ data.frequentRecipes → HomeRecipeRail
  │    ├─ data.recentOrders → RecentOrdersSection
  │    └─ data.recentComments → HomeRecentComments
  ├─ useCurrentUser() → currentUser
  ├─ useUpdateOrderStatus() → mutation
  └─ ShareDialog 用 query string `/api/menu/share-card`
```

## 8. 错误处理

- 任何 mutation 失败 → toast destructive
- 空 list → 段落不渲染（不显示"暂无数据"占位，避免 Home 太空）
- `useHomeSummary` failure → 现有 Error view 保留（仅样式 token 化）

## 9. 测试

### 写测试

`HomeRecipeRail.test.tsx`：
- 空 recipes 数组 → 整段不渲染（返回 null）
- 3 个 recipe → 渲染 3 个 `<Link to="/recipe/N">` 卡片
- `countLabel` 函数被调用，结果显示

`HomeCommentRow.test.tsx`：
- 长内容 line-clamp-2
- displayName + roleType + contentPreview + 相对时间都显示

### 不写测试

- `HomeHeader.tsx` / `AchievementStats.tsx` / `HomeShortcuts.tsx`：纯静态展示
- `HomeRecentComments.tsx`：仅是 HomeCommentRow 的容器，逻辑覆盖在 HomeCommentRow 测试里
- Home.tsx 集成：现有也没有；手动验证清单兜底

### 手动验证

桌面 Chrome 375 viewport：
1. 登录后 Home → 看到 brand 色 hero + sage/amber 成就 + cream 快捷入口
2. 滚动一遍：今日推荐 / 常点好菜横滑 → 卡片样式一致
3. 最近订单 section 用 OrderCard 样式渲染（带状态 badge + 任意成员可推进按钮）
4. 评论 section 显示真实评论数据
5. 点 Header 的「分享菜单」→ ShareDialog 正常打开
6. Spec 2 OrderCard 的所有功能（点击进详情、状态推进按钮）仍正常

## 10. 文件清单

### 新增

- `src/components/home/HomeHeader.tsx`
- `src/components/home/AchievementStats.tsx`
- `src/components/home/HomeShortcuts.tsx`
- `src/components/home/HomeRecipeRail.tsx`
- `src/components/home/HomeRecipeRail.test.tsx`
- `src/components/home/HomeRecentComments.tsx`
- `src/components/home/HomeCommentRow.tsx`
- `src/components/home/HomeCommentRow.test.tsx`

### 修改

- `src/pages/home/Home.tsx`（大幅瘦身：462 → ~130 行）

### 删除

- 无

### 不动

- `src/hooks/useHomeSummary.ts`
- 后端所有路由

## 11. 风险

| 风险 | 缓解 |
|---|---|
| Home.tsx 拆分破坏现有功能（分享/active orders 等） | 严格保留 active orders 段（Spec 2 已稳）；ShareDialog 触发不变；hooks 完全不动 |
| 最近订单 OrderCard 显示缩略图 fallback 图标（RecentOrderSummary 无图片） | 已记录为已知限制；用户能看到菜名、状态、时间，缩略图 fallback 影响可接受 |
| 抽组件后 prop drilling 增加 | 每个新组件 props 都简单（≤ 4 个字段），不引入 prop drilling |

## 12. 后续

3 份 spec 完成后，cook 的设计系统 + 4 个核心页面 + Home 全部统一。后续可补：
- 暗色模式（globals.css `.dark` 段已预留）
- Profile 页视觉迁移
- 订单评论流的视觉迁移（OrderCommentThread / OrderReviewCard 当前还是旧风格）
