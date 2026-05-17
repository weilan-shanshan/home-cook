# Cook 订单流程重做（Spec 2）

- 日期：2026-05-17
- 范围：`/Users/weilan/ali/ai/cook/private-chef/frontend` 的 OrderList / OrderDetailV2 / OrderCreate / Home 活跃单卡
- 视觉参考：[docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html) 第 5、6 张手机框（OrderList / OrderDetail）+ 第 1 张（Home 活跃单卡）
- 设计系统：复用 Spec 1（[../specs/2026-05-17-design-system-and-recipe-flow-design.md](./2026-05-17-design-system-and-recipe-flow-design.md)）建立的 brand/cream/ink/sage/amber/rose token + shadcn 组件主题
- 系列定位：3 份 spec 中的 **第 2 份**；Spec 1（设计系统 + 菜品）已落地，Spec 3（Home 首页其它区块）后续。

## 1. 背景

Spec 1 已经建立了设计系统并完成菜品页迁移，但订单流相关的 4 个页面（OrderList / OrderDetailV2 / OrderCreate / Home 活跃单卡）还停留在旧视觉（glass-card / `text-muted-foreground` 散布 / `bg-primary/10` 等）。同时这些页面有以下结构性问题：

1. **状态映射代码重复** —— `statusLabel` / `statusColor` 这套函数在 Home.tsx、OrderList.tsx、OrderDetailV2.tsx 三处各写一份，分支不一致：OrderDetailV2 包含 cancelled 分支，OrderList 没有；Home 的 statusLabel 用「等你接单」，OrderDetailV2 用「已提交」。
2. **OrderDetailV2 缺少进度时间线** —— 当前是孤立的状态 badge + 一个 sticky 底部按钮，用户看不到订单整体进度。
3. **Home 活跃单卡是 600 行 Home.tsx 内嵌结构** —— 不复用任何 OrderCard 组件，每次改动都要改两遍。
4. **CookLogsSection 等附属区块还用旧 token**（Spec 1 final review 提到的遗留）。

## 2. 目标

- **视觉统一**：4 个页面全部迁移到 Spec 1 token 系统
- **状态决策集中化**：建立 `lib/order-status.ts` 单一真相，下游组件只消费不重复实现
- **进度时间线**：OrderDetailV2 引入 4 段时间线 hero 卡片，把当前状态、下一步动作、整体进度收敛到一处
- **OrderCard 共享**：把 Home 活跃单和 OrderList 列表项统一为同一个组件的两种 mode
- **保留所有现有业务**：状态机不动；评论 / 评价 / 分享 / 备注等功能照旧

## 3. 非目标 (YAGNI)

- ❌ 修改订单状态机（保留 submitted → confirmed → preparing → completed + cancelled）
- ❌ 「我不接了」回退动作（用户选择不做）
- ❌ 订单友商改菜（加货/减货）
- ❌ Home 首页其他区块（推荐菜、评论流、成就 — 留给 Spec 3）
- ❌ OrderCreate 业务逻辑修改（仅视觉）

## 4. 状态系统（核心）

### 4.1 单一映射 `src/lib/order-status.ts`

集中 5 种状态（含历史 pending 别名）的所有 UI 维度：

```ts
import type { OrderStatus } from '@/hooks/useOrders'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待接单',
  submitted: '待接单',
  confirmed: '已接单',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

/** 用于 Badge variant；映射到 Spec 1 的 badge 三色调 */
export const STATUS_BADGE_VARIANT: Record<OrderStatus, 'default' | 'sage' | 'amber' | 'secondary' | 'destructive'> = {
  pending: 'default',      // brand 橙
  submitted: 'default',
  confirmed: 'default',
  preparing: 'amber',      // 琥珀
  completed: 'sage',       // 鼠尾草绿
  cancelled: 'secondary',  // 米灰
}

/** 是否「进行中」—— 影响外卡边框 + Home 是否显示 */
export const ACTIVE_STATUSES: ReadonlySet<OrderStatus> =
  new Set(['pending', 'submitted', 'confirmed', 'preparing'])

/** 时间线四段次序（cancelled 单独处理，不出现在线性进度里） */
export const TIMELINE_STAGES = ['submitted', 'confirmed', 'preparing', 'completed'] as const
export type TimelineStage = (typeof TIMELINE_STAGES)[number]

export const STAGE_LABEL: Record<TimelineStage, string> = {
  submitted: '已下单',
  confirmed: '已接单',
  preparing: '制作中',
  completed: '已完成',
}

/** Status → 当前在 timeline 中处于第几段（0-based）。cancelled = -1 */
export function statusToTimelineIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'submitted': return 0
    case 'confirmed': return 1
    case 'preparing': return 2
    case 'completed': return 3
    case 'cancelled': return -1
  }
}
```

### 4.2 动作决策 `nextActionFor()`

复用 Spec 1 修过的「任意家庭成员都能推进」逻辑。该函数集中"按当前状态 + 用户身份决定渲染哪个按钮"：

```ts
export interface OrderActionContext {
  status: OrderStatus
  isMine: boolean            // 我是否点单人
  hasCook: boolean           // 是否已有大厨
  isCook: boolean            // 我是否是大厨
}

export interface OrderAction {
  label: string
  next: 'confirmed' | 'preparing' | 'completed' | 'cancelled'
  variant: 'default' | 'destructive'
  /** 是否需要 confirm dialog */
  needsConfirm?: boolean
}

export function nextActionFor(ctx: OrderActionContext): OrderAction | null {
  const { status, isMine, hasCook } = ctx
  // 待接单：其他人可以「我来接单」
  if ((status === 'submitted' || status === 'pending') && !isMine && !hasCook) {
    return { label: '我来接单', next: 'confirmed', variant: 'default' }
  }
  // 已接单：任意成员推进到「去制作」
  if (status === 'confirmed') {
    return { label: '去制作', next: 'preparing', variant: 'default' }
  }
  // 制作中：任意成员推进到「出锅完成」
  if (status === 'preparing') {
    return { label: '出锅完成', next: 'completed', variant: 'default' }
  }
  return null
}

/** 「取消订单」的副动作（不放在主按钮位） */
export function canCancel(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.has(status) && status !== 'preparing'
  // preparing 期间不让取消（菜在做了）
}
```

## 5. 组件设计

### 5.1 `src/components/order/OrderStatusBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

interface Props { status: OrderStatus; className?: string }

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
```

### 5.2 `src/components/order/OrderStatusTimeline.tsx`

```tsx
import { TIMELINE_STAGES, STAGE_LABEL, statusToTimelineIndex } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'
import { cn } from '@/lib/utils'

interface Props {
  status: OrderStatus
  className?: string
}

export function OrderStatusTimeline({ status, className }: Props) {
  const currentIdx = statusToTimelineIndex(status)

  // cancelled — single rose-tinted stage rendering
  if (currentIdx === -1) {
    return (
      <div className={cn('rounded-2xl bg-rose-100 px-3 py-2 text-rose-500 text-sm font-bold', className)}>
        订单已取消
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-2">
        {TIMELINE_STAGES.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              idx <= currentIdx ? 'bg-brand' : 'bg-cream-300',
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-semibold">
        {TIMELINE_STAGES.map((stage, idx) => (
          <span
            key={stage}
            className={idx === currentIdx ? 'text-brand-700' : 'text-ink-500'}
          >
            {STAGE_LABEL[stage]}
          </span>
        ))}
      </div>
    </div>
  )
}
```

### 5.3 `src/components/order/OrderActionButton.tsx`

按当前状态 + 用户身份决定渲染哪个动作，封装 confirm 逻辑：

```tsx
interface Props {
  order: { id: number; status: OrderStatus; isMine: boolean; cook: { userId: number } | null }
  currentUserId: number | null
  isPending: boolean
  onAction: (next: OrderAction['next']) => void
  variant?: 'primary' | 'wide'   // wide 用于 hero 卡，primary 用于列表
  className?: string
}
```

内部用 `nextActionFor()` 决定按钮文案/颜色，没有匹配的状态返回 `null`（不渲染）。

### 5.4 `src/components/order/OrderItemRow.tsx`

菜品行，详情页菜品 list + OrderCreate 购物车共用：

```tsx
interface Props {
  item: {
    recipeId: number
    recipeTitle: string
    quantity: number
    image: { url: string; thumbUrl: string | null } | null
    cookMinutes?: number | null
  }
  /** 渲染数量输入器（仅 OrderCreate 用） */
  editable?: boolean
  onQuantityChange?: (delta: number) => void
}
```

### 5.5 `src/components/order/OrderCard.tsx`

通用订单卡 —— Home 和 OrderList 复用：

```tsx
interface Props {
  order: {
    id: number
    status: OrderStatus
    mealType: string
    mealDate: string
    createdAt: string
    isMine: boolean
    cook: { userId: number; displayName: string } | null
    requester: { displayName: string }
    items: Array<{ recipeId: number; recipeTitle: string; image: { thumbUrl: string | null; url: string } | null }>
  }
  currentUserId: number | null
  mode: 'compact' | 'default'
  onAction: (orderId: number, next: OrderAction['next']) => void
  isPending: boolean
}
```

**渲染逻辑**：
- 顶部 row：状态 Badge + 时间相对值 + 用户能否接单的话「等你接单」副 chip
- 中部：「{mealType} #{id}」标题 + 「{requester} 点单 · {cook ?? '尚无大厨'}」副标题
- `mode === 'default'` 额外渲染：菜品缩略图 row（最多 4 个 + 「+N」）
- 底部：`<OrderActionButton variant="wide" />`，无 action 时不渲染
- 整张卡 `<Link to={`/orders/${id}`}>` 包裹（除底部 action 按钮），mode=default 时点卡进详情

**外框样式**：
- `ACTIVE_STATUSES.has(status)` → `border-2 border-brand-200`
- 否则 → `border border-cream-300 opacity-90`（completed / cancelled 视觉退后）

## 6. 页面布局

### 6.1 OrderList

```
顶部
  "订单" 大标题
  状态过滤 chip 行：[全部 N] [待接单 N] [制作中 N] [已完成 N]
    （按 ACTIVE → 完成 → 取消 排序，数量 = 0 的状态不显示该 chip）
  [筛选：包含『红烧肉』 ×]（仅当 ?recipeId 时）

内容
  <OrderCard mode="default" /> × N
```

ChipFilter 用 `searchParams.get('status')`，复用现有 useOrders 已有的 status 参数。

### 6.2 OrderDetailV2

```
顶部 nav
  ‹ 返回   晚餐 #128
           今天 18:15 · 爸 点单

进度 hero 卡
  <OrderStatusTimeline />
  「等你接单」大字号
  <OrderActionButton variant="wide" />

3 道菜 区块
  <Card>
    <OrderItemRow /> × N
  </Card>

备注 区块（保留现有 OrderCommentThread）
评价 区块（保留现有 OrderReviewCard）

sticky 底部
  备注输入条（保留现有逻辑）
```

旧的状态徽章和单一 sticky 按钮被进度 hero 替代。

### 6.3 OrderCreate

```
顶部
  ‹ 返回   新建订单

餐次 + 日期 卡片
  [早餐 午餐 晚餐 加餐]（chip，单选）
  [日期 picker — 复用现有]

已选菜品 卡片
  <OrderItemRow editable /> × N
  空状态："还没选菜" + 「去点菜」按钮

备注 卡片
  Textarea，placeholder「比如：少放盐」

sticky 底部
  [取消] [提交点单] 主按钮
```

### 6.4 Home 活跃订单区

```
活跃订单数 === 0
  → 不显示这块（让位 hero CTA）

活跃订单数 === 1
  <OrderCard mode="compact" /> 单张（去掉菜品缩略图，仅状态 + 标题 + action）

活跃订单数 >= 2
  <OrderCard mode="compact" /> 横向 carousel，每张占 85% 视口宽
```

Home.tsx 600 行里把现有 ActiveOrderCard 拆掉，改用 `<OrderCard mode="compact" />`。

## 7. 数据流

```
OrderList
  └─ useOrders({ status, recipeId }) → orders[]
       └─ map → <OrderCard mode="default" onAction />
                  └─ onAction → useUpdateOrderStatus().mutate
                                  └─ 缓存自动 invalidate

OrderDetailV2
  └─ useOrder(id) → order detail
       ├─ <OrderStatusTimeline />
       ├─ <OrderActionButton onAction />
       ├─ <OrderItemRow /> × N
       └─ <OrderCommentThread orderId /> + <OrderReviewCard />

Home
  └─ useHomeSummary() → activeOrders[]
       └─ map → <OrderCard mode="compact" onAction />

OrderCreate
  └─ menu cart state (来自 MenuPage 传入)
       ├─ <OrderItemRow editable onQuantityChange />
       └─ submit → useCreateOrder().mutate → navigate(/orders/:id)
```

## 8. 错误处理

延续 Spec 1 模式：所有 mutation 失败 toast destructive + 不破坏列表。

特别处理：
- 状态转换返回 400「Cannot transition...」→ 应该不会发生（前端只在合法状态下渲染按钮），但仍 toast 错误内容 + invalidate 列表（拉取最新状态）
- Home / OrderList 列表中卡片操作失败 → 仅该卡片回滚视觉态，其他卡片不受影响

## 9. 测试

复用 Spec 1 的 vitest + RTL setup。

### 后端测试

无新接口，无需新测试。Spec 1 已有 orders ?recipeId 测试。

### 前端测试

**`src/lib/order-status.test.ts`** (新增)
- `STATUS_LABEL` 全状态映射存在
- `statusToTimelineIndex` 五种 status + cancelled 边界
- `nextActionFor`：
  - submitted + 别人 + 无大厨 → 「我来接单」
  - submitted + 自己 → null（不能接自己的单）
  - submitted + 已有大厨 → null
  - confirmed → 「去制作」（任意成员）
  - preparing → 「出锅完成」
  - completed / cancelled → null
- `canCancel`：preparing 返回 false，其他活跃状态返回 true

**`src/components/order/OrderStatusTimeline.test.tsx`** (新增)
- submitted → 第 1 段亮，其余暗
- preparing → 前 3 段亮
- completed → 全亮
- cancelled → 渲染「订单已取消」rose 块

**`src/components/order/OrderCard.test.tsx`** (新增)
- mode='default' 渲染菜品缩略图
- mode='compact' 不渲染缩略图
- active status → border-brand-200
- completed → opacity-90
- 点击主按钮触发 onAction 带正确 next

**不写测试**：
- `OrderItemRow.tsx`（纯展示）
- `OrderActionButton.tsx`（依赖 `nextActionFor()` 已测）
- `OrderStatusBadge.tsx`（纯展示）
- 页面集成测试（受现有 Home / OrderList 测试覆盖度限制；手动验证清单兜底）

### 手动验证清单

- [ ] 桌面 Chrome 375 viewport，登录后：
  - [ ] Home：1 个活跃单时显示一张大卡；改成多个时显示横滑
  - [ ] 点 OrderList，状态过滤 chip 正常切换
  - [ ] 点进任一活跃订单 → 进度时间线 hero 卡显示正确段
  - [ ] OrderList 卡片上「我来接单」点击成功，列表自动更新
  - [ ] OrderDetail 上「去制作」「出锅完成」点击成功
  - [ ] 点击 RecipeDetail 删除 → 被引用提示 → 跳 `/orders?recipeId=N`，列表筛选 chip 显示
  - [ ] OrderCreate 重做后从 MenuPage 进入正常工作

## 10. 文件清单

### 新增
- `private-chef/frontend/src/lib/order-status.ts`
- `private-chef/frontend/src/lib/order-status.test.ts`
- `private-chef/frontend/src/components/order/OrderStatusBadge.tsx`
- `private-chef/frontend/src/components/order/OrderStatusTimeline.tsx`
- `private-chef/frontend/src/components/order/OrderStatusTimeline.test.tsx`
- `private-chef/frontend/src/components/order/OrderActionButton.tsx`
- `private-chef/frontend/src/components/order/OrderItemRow.tsx`
- `private-chef/frontend/src/components/order/OrderCard.tsx`
- `private-chef/frontend/src/components/order/OrderCard.test.tsx`

### 修改
- `private-chef/frontend/src/pages/order/OrderList.tsx`（重做布局，复用 OrderCard）
- `private-chef/frontend/src/pages/order/OrderDetailV2.tsx`（重做布局，引入 timeline hero）
- `private-chef/frontend/src/pages/order/OrderCreate.tsx`（重做布局）
- `private-chef/frontend/src/pages/home/Home.tsx`（活跃订单区改用 OrderCard）

### 不动
- `src/hooks/useOrders.ts`、`src/hooks/useHomeSummary.ts`、`src/hooks/useOrderInteractions.ts`
- `src/components/comment/OrderCommentThread.tsx`、`OrderReviewCard.tsx`
- backend 所有 routes

## 11. 风险

| 风险 | 缓解 |
|---|---|
| Home.tsx 600 行重构容易破坏其他不相关功能（推荐菜 / 评论流） | 仅替换其内嵌的 ActiveOrder 卡区块，其它区不动 |
| `nextActionFor()` 行为偏差影响接单流 | 单测全 5 状态 × 3 身份矩阵 |
| OrderCard mode 切换出 bug | mode='compact' / 'default' 各写一个测试 |
| OrderCreate 视觉重做误伤现有提交逻辑 | 严格只改 className 和布局结构，不动 useCreateOrder / handle submit |

## 12. 后续

Spec 3 重做 Home 剩余区块（hero、推荐菜、评论流、成就），届时复用本 spec 的 `OrderCard`。
