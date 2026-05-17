# Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Home.tsx's 6 non-active-orders sections to Spec 1 design system, extract them into 6 small components under `src/components/home/`, and reuse Spec 2's `OrderCard` for the Recent Orders section.

**Architecture:** Bottom-up — build 6 leaf components first (each TDD where it has logic), then rewrite Home.tsx as a thin composition layer. No backend changes; no data flow changes.

**Tech Stack:** React 18 + react-router v7 + Vite 5 + shadcn/ui + Tailwind 3 (Spec 1 tokens: brand/cream/ink/sage/amber/rose) + TanStack Query + vitest + @testing-library/react.

**Spec:** [docs/superpowers/specs/2026-05-17-home-redesign.md](../specs/2026-05-17-home-redesign.md)

**Mockup reference:** [docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html) — page 1 (Home).

**Working dir:** `/Users/weilan/ali/ai/cook/private-chef/frontend` unless prefixed. Git ops from `/Users/weilan/ali/ai/cook`.

---

## File Map

**New:**
- `src/components/home/HomeHeader.tsx`
- `src/components/home/AchievementStats.tsx`
- `src/components/home/HomeShortcuts.tsx`
- `src/components/home/HomeRecipeRail.tsx`
- `src/components/home/HomeRecipeRail.test.tsx`
- `src/components/home/HomeRecentComments.tsx`
- `src/components/home/HomeCommentRow.tsx`
- `src/components/home/HomeCommentRow.test.tsx`

**Modified:**
- `src/pages/home/Home.tsx` (462 → ~130 lines; reuse new components + OrderCard for Recent Orders)

---

## Task 1: `HomeHeader.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/home/HomeHeader.tsx`

No tests (static markup).

- [ ] **Step 1: Create the component**

```tsx
import { Sparkles, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  displayName: string | null
  onShareMenu: () => void
}

export function HomeHeader({ displayName, onShareMenu }: Props) {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 flex items-center gap-2">
            私厨 <Sparkles className="h-6 w-6 text-brand" />
          </h1>
          <p className="text-ink-500 text-sm font-medium">
            {displayName ? `${displayName}，` : ''}今天想吃点什么？
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onShareMenu}
        >
          <Share2 className="h-4 w-4" />
          分享菜单
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/HomeHeader.tsx
git commit -m "feat(home): add HomeHeader component"
```

---

## Task 2: `AchievementStats.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/home/AchievementStats.tsx`

No tests (static markup).

- [ ] **Step 1: Create the component**

```tsx
import { Utensils, ChefHat } from 'lucide-react'

interface Props {
  totalOrders: number
  totalCooks: number
}

export function AchievementStats({ totalOrders, totalCooks }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-sage-100 rounded-3xl p-4">
        <div className="bg-white/60 w-8 h-8 rounded-full flex items-center justify-center mb-2">
          <Utensils className="h-4 w-4 text-sage-700" />
        </div>
        <p className="text-2xl font-extrabold text-sage-700">{totalOrders}</p>
        <p className="text-xs font-semibold text-ink-700 mt-0.5">总点餐数</p>
      </div>
      <div className="bg-amber-100 rounded-3xl p-4">
        <div className="bg-white/60 w-8 h-8 rounded-full flex items-center justify-center mb-2">
          <ChefHat className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-2xl font-extrabold text-amber-500">{totalCooks}</p>
        <p className="text-xs font-semibold text-ink-700 mt-0.5">被掌勺数</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/AchievementStats.tsx
git commit -m "feat(home): add AchievementStats bento card"
```

---

## Task 3: `HomeShortcuts.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/home/HomeShortcuts.tsx`

No tests (static markup + routes).

- [ ] **Step 1: Create the component**

```tsx
import { Link } from 'react-router'
import { Utensils, ClipboardList, Heart, PlusCircle } from 'lucide-react'

const SHORTCUTS = [
  { to: '/menu', label: '点菜', icon: Utensils },
  { to: '/orders', label: '我的订单', icon: ClipboardList },
  { to: '/favorites', label: '收藏', icon: Heart },
  { to: '/menu', label: '发布菜品', icon: PlusCircle },
] as const

export function HomeShortcuts() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {SHORTCUTS.map(({ to, label, icon: Icon }, idx) => (
        <Link
          key={`${to}-${idx}`}
          to={to}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-cream-100 transition-colors active:scale-95 duration-150"
        >
          <div className="bg-cream-100 p-3.5 rounded-2xl text-ink-700">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-ink-700">{label}</span>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/HomeShortcuts.tsx
git commit -m "feat(home): add HomeShortcuts 4-tile quick access grid"
```

---

## Task 4: `HomeRecipeRail.tsx` + tests

**Files:**
- Create: `private-chef/frontend/src/components/home/HomeRecipeRail.tsx`
- Create: `private-chef/frontend/src/components/home/HomeRecipeRail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Star } from 'lucide-react'
import { HomeRecipeRail } from './HomeRecipeRail'

const sampleRecipes = [
  { recipeId: 1, title: '红烧肉', orderCount: 5, image: null },
  { recipeId: 2, title: '清蒸鱼', orderCount: 3, image: { url: 'https://x', thumbUrl: null } },
  { recipeId: 3, title: '番茄炒蛋', orderCount: 8, image: null },
]

function renderRail(props: Partial<React.ComponentProps<typeof HomeRecipeRail>> = {}) {
  return render(
    <MemoryRouter>
      <HomeRecipeRail
        title="今日推荐"
        icon={<Star className="w-5 h-5" />}
        iconClassName="bg-amber-100 text-amber-500"
        recipes={sampleRecipes}
        countLabel={(n) => `点过 ${n} 次`}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('HomeRecipeRail', () => {
  test('returns null when recipes is empty', () => {
    const { container } = renderRail({ recipes: [] })
    expect(container.firstChild).toBeNull()
  })

  test('renders title and one link per recipe', () => {
    renderRail()
    expect(screen.getByText('今日推荐')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  test('renders each recipe with its title and count label', () => {
    renderRail()
    expect(screen.getByText('红烧肉')).toBeInTheDocument()
    expect(screen.getByText('点过 5 次')).toBeInTheDocument()
    expect(screen.getByText('点过 3 次')).toBeInTheDocument()
    expect(screen.getByText('点过 8 次')).toBeInTheDocument()
  })

  test('link href uses /recipe/:id', () => {
    renderRail()
    const links = screen.getAllByRole('link') as HTMLAnchorElement[]
    expect(links[0].getAttribute('href')).toBe('/recipe/1')
    expect(links[1].getAttribute('href')).toBe('/recipe/2')
  })
})
```

- [ ] **Step 2: Verify failing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/home/HomeRecipeRail.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
import { Link } from 'react-router'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeCardSummary } from '@/hooks/useHomeSummary'

interface Props {
  title: string
  icon: React.ReactNode
  iconClassName?: string
  recipes: RecipeCardSummary[]
  countLabel: (count: number) => string
}

export function HomeRecipeRail({
  title,
  icon,
  iconClassName,
  recipes,
  countLabel,
}: Props) {
  if (recipes.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg', iconClassName ?? 'bg-brand-100 text-brand-700')}>
          {icon}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      </div>
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-3 snap-x snap-mandatory hide-scrollbar">
        {recipes.map((recipe) => (
          <Link
            key={recipe.recipeId}
            to={`/recipe/${recipe.recipeId}`}
            className="flex-none w-[140px] snap-center group"
          >
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-brand-100 to-brand-300 overflow-hidden mb-2 border border-cream-300">
              {recipe.image ? (
                <img
                  src={recipe.image.thumbUrl || recipe.image.url}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70">
                  <Utensils className="h-8 w-8" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-sm line-clamp-1 text-ink-900 group-hover:text-brand transition-colors">
              {recipe.title}
            </h3>
            <p className="text-[10px] font-medium text-ink-500 mt-0.5">
              {countLabel(recipe.orderCount)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify passing + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/home/HomeRecipeRail.test.tsx
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/HomeRecipeRail.tsx \
        private-chef/frontend/src/components/home/HomeRecipeRail.test.tsx
git commit -m "feat(home): add HomeRecipeRail (recommended/frequent shared)"
```

---

## Task 5: `HomeCommentRow.tsx` + tests

**Files:**
- Create: `private-chef/frontend/src/components/home/HomeCommentRow.tsx`
- Create: `private-chef/frontend/src/components/home/HomeCommentRow.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router'
import { HomeCommentRow } from './HomeCommentRow'

const sampleComment = {
  id: 1,
  orderId: 42,
  userId: 7,
  displayName: '爸',
  roleType: 'diner' as const,
  contentPreview: '今天这顿红烧肉真不错',
  createdAt: '2026-05-17 12:00:00',
}

describe('HomeCommentRow', () => {
  test('renders displayName, role chip, and content', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={sampleComment} />
      </MemoryRouter>,
    )
    expect(screen.getByText('爸')).toBeInTheDocument()
    expect(screen.getByText(/点单人/)).toBeInTheDocument()
    expect(screen.getByText('今天这顿红烧肉真不错')).toBeInTheDocument()
  })

  test('renders cook role chip when roleType is cook', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={{ ...sampleComment, roleType: 'cook' }} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/掌勺/)).toBeInTheDocument()
  })

  test('wraps in a Link to the related order detail page', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={sampleComment} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/orders/42')
  })
})
```

- [ ] **Step 2: Verify failing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/home/HomeCommentRow.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
import { Link } from 'react-router'
import type { RecentCommentSummary } from '@/hooks/useHomeSummary'

interface Props {
  comment: RecentCommentSummary
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso.replace(' ', 'T')).getTime()
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function HomeCommentRow({ comment }: Props) {
  const roleLabel = comment.roleType === 'cook' ? '掌勺' : '点单人'
  const initial = comment.displayName.slice(0, 1)

  return (
    <Link
      to={`/orders/${comment.orderId}`}
      className="flex gap-3 p-3 rounded-2xl bg-white border border-cream-300 hover:border-brand-200 transition-colors"
    >
      <div className="flex-none w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
        {initial}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-ink-900">{comment.displayName}</span>
          <span className="text-ink-500 text-[10px] px-1.5 py-0.5 bg-cream-100 rounded-full">
            {roleLabel}
          </span>
          <span className="ml-auto text-[10px] text-ink-500">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-ink-700 line-clamp-2">{comment.contentPreview}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Verify passing + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/home/HomeCommentRow.test.tsx
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/HomeCommentRow.tsx \
        private-chef/frontend/src/components/home/HomeCommentRow.test.tsx
git commit -m "feat(home): add HomeCommentRow component"
```

---

## Task 6: `HomeRecentComments.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/home/HomeRecentComments.tsx`

No tests (covered by HomeCommentRow tests).

- [ ] **Step 1: Create the component**

```tsx
import { MessageSquare } from 'lucide-react'
import type { RecentCommentSummary } from '@/hooks/useHomeSummary'
import { HomeCommentRow } from './HomeCommentRow'

interface Props {
  comments: RecentCommentSummary[]
}

export function HomeRecentComments({ comments }: Props) {
  if (comments.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-sage-100 text-sage-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">最新评论</h2>
      </div>
      <div className="space-y-2">
        {comments.map((c) => (
          <HomeCommentRow key={c.id} comment={c} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/home/HomeRecentComments.tsx
git commit -m "feat(home): add HomeRecentComments container"
```

---

## Task 7: Rewrite `Home.tsx`

**Files:**
- Modify: `private-chef/frontend/src/pages/home/Home.tsx` (full replacement)

This is the integration task. The new Home.tsx composes the 6 new components plus the existing Spec 2 active-orders + OrderCard logic. Replace the ENTIRE file content.

- [ ] **Step 1: Replace Home.tsx with the new composition**

Open `/Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/home/Home.tsx` and replace its entire content with:

```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Star, ChefHat, HandPlatter, ClipboardList, AlertCircle, Utensils, Loader2 } from 'lucide-react'
import { useHomeSummary, type ActiveOrderSummary, type RecentOrderSummary } from '@/hooks/useHomeSummary'
import { useCurrentUser } from '@/hooks/useAuth'
import { useUpdateOrderStatus, type OrderStatus } from '@/hooks/useOrders'
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import { mealTypeLabel } from '@/lib/order-status'
import { Button } from '@/components/ui/button'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useToast } from '@/components/ui/use-toast'
import { HomeHeader } from '@/components/home/HomeHeader'
import { AchievementStats } from '@/components/home/AchievementStats'
import { HomeShortcuts } from '@/components/home/HomeShortcuts'
import { HomeRecipeRail } from '@/components/home/HomeRecipeRail'
import { HomeRecentComments } from '@/components/home/HomeRecentComments'

function activeToCardData(order: ActiveOrderSummary): OrderCardData {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: order.isMine,
    hasCook: order.cook != null,
    cookUserId: order.cook?.userId ?? null,
    cookDisplayName: order.cook?.displayName ?? null,
    requesterDisplayName: order.requester.displayName,
    items: order.items.map((it) => ({
      recipeId: it.recipeId,
      recipeTitle: it.recipeTitle,
      image: it.image,
    })),
  }
}

function recentToCardData(order: RecentOrderSummary, currentUserId: number | null): OrderCardData {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: !!currentUserId && order.requester.userId === currentUserId,
    hasCook: false,
    cookUserId: null,
    cookDisplayName: null,
    requesterDisplayName: order.requester.displayName,
    items: order.recipeTitles.map((title, idx) => ({
      recipeId: idx, // placeholder — RecentOrderSummary doesn't carry recipeId
      recipeTitle: title,
      image: null,
    })),
  }
}

export default function Home() {
  const { data, isLoading, isError } = useHomeSummary()
  const { data: currentUser } = useCurrentUser()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const handleUpdateStatus = (
    orderId: number,
    next: 'confirmed' | 'preparing' | 'completed' | 'cancelled',
  ) => {
    updateStatus(
      { id: orderId, status: next },
      {
        onSuccess: () => {
          const labelMap: Record<string, string> = {
            confirmed: '已接单',
            preparing: '已开火',
            completed: '已完成',
            cancelled: '已取消',
          }
          toast({
            title: '订单已更新',
            description: `状态已更新为 ${labelMap[next] ?? next}。`,
          })
          queryClient.invalidateQueries({ queryKey: ['home-summary'] })
        },
        onError: (err) => {
          toast({
            variant: 'destructive',
            title: '操作失败',
            description: (err as Error).message,
          })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-ink-500 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-sm font-medium">正在准备今日菜单...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
        <div className="bg-rose-100 text-rose-500 p-4 rounded-3xl mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-ink-900">哎呀，加载失败了</p>
        <p className="text-sm text-ink-500 mb-4">可能是网络开小差了，请刷新重试</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    )
  }

  const myActiveOrders = data.activeOrders.filter((order) => order.isMine)
  const acceptableOrders = data.activeOrders.filter((order) => order.canAccept)
  const otherActiveOrders = data.activeOrders.filter(
    (order) => !order.isMine && !order.canAccept,
  )
  const hasAnyActive = data.activeOrders.length > 0

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <HomeHeader
        displayName={currentUser?.display_name ?? null}
        onShareMenu={() => setShareDialogOpen(true)}
      />

      {hasAnyActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
                <HandPlatter className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink-900">进行中的点单</h2>
              <span className="text-xs font-semibold text-ink-500 bg-cream-100 px-2 py-0.5 rounded-full">
                {data.activeOrders.length}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-sm font-medium text-brand-700 hover:text-brand bg-brand-100 px-3 py-1 rounded-full transition-colors"
            >
              全部
            </Link>
          </div>

          {myActiveOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">我的点单</p>
              {myActiveOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}

          {acceptableOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">等你接单</p>
              {acceptableOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}

          {otherActiveOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">家人的点单</p>
              {otherActiveOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={activeToCardData(order)}
                  currentUserId={currentUser?.id ?? null}
                  mode="compact"
                  onAction={handleUpdateStatus}
                  isPending={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AchievementStats
        totalOrders={data.achievementSummary.totalOrders}
        totalCooks={data.achievementSummary.totalCooks}
      />

      <HomeShortcuts />

      <HomeRecipeRail
        title="今日推荐"
        icon={<Star className="w-5 h-5 fill-current" />}
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

      {data.recentOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cream-200 text-ink-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900">最近订单动态</h2>
          </div>
          <div className="space-y-2">
            {data.recentOrders.slice(0, 3).map((order) => (
              <OrderCard
                key={order.id}
                order={recentToCardData(order, currentUser?.id ?? null)}
                currentUserId={currentUser?.id ?? null}
                mode="default"
                onAction={handleUpdateStatus}
                isPending={isUpdating}
              />
            ))}
          </div>
        </div>
      )}

      <HomeRecentComments comments={data.recentComments} />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="分享今日菜单"
        shareCardEndpoint="/api/home/share-card"
        shareActionEndpoint="/api/home/share"
        invalidateKeys={[['home-summary']]}
      />
    </div>
  )
}
```

Note: `mealTypeLabel` from `@/lib/order-status` is imported but not directly used in the new Home.tsx (OrderCard renders meal types internally). Remove the import if tsc flags it as unused. The `Utensils` icon import is also probably unused; remove it too if unused. Run `npx tsc -b --noEmit` and prune accordingly.

- [ ] **Step 2: Run type check + full test suite**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run 2>&1 | tail -5
```

Expected: tsc clean, 62 tests pass (60 existing + 4 HomeRecipeRail + 3 HomeCommentRow).

If tsc complains about unused imports, prune them. Common candidates: `Utensils`, `mealTypeLabel`, possibly `Loader2` if not used.

- [ ] **Step 3: Run lint**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx eslint src/pages/home/Home.tsx src/components/home/ 2>&1 | tail -10
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/home/Home.tsx
git commit -m "feat(home): rewrite Home.tsx as thin composition of new home/* components"
```

---

## Task 8: End-to-end verification

No new code. Verify the whole stack.

- [ ] **Step 1: Full automated checks**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run 2>&1 | tail -5
npx tsc -b --noEmit 2>&1 | tail -3
npm run lint 2>&1 | tail -5
npm run build 2>&1 | tail -5

cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run 2>&1 | tail -5
```

Expected: all green.

- [ ] **Step 2: Manual smoke**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run preview
# in another tab:
cd /Users/weilan/ali/ai/cook/private-chef/backend && npm run dev
```

Open `http://localhost:4173` at 375 viewport. Verify:

1. Home loads — header shows "私厨 + Sparkles brand"; subtitle has user display name
2. 「分享菜单」outline button works → ShareDialog opens
3. Achievements: 2 cards bento — sage (orders) + amber (cooks)
4. Shortcuts: 4 cream-100 tiles, all functional links
5. Recommended Recipes: rail scrolls horizontally, cards have 4:5 aspect, recipe titles + "点过 N 次"
6. Frequent Recipes: same layout, "做过 N 次"
7. Active orders region: cards render via OrderCard (Spec 2 done already, untouched)
8. Recent Orders: shows up to 3 OrderCards with status badge + meal type + items list (no thumbnails since RecentOrderSummary has no image)
9. Recent Comments: rows with avatar initial + name + role chip + content preview + relative time, each links to /orders/:orderId
10. All page sections use brand/cream/ink tokens — no leftover `glass-card`, `bg-secondary`, blue/orange/red/green shortcut colors, or `dark:*` classes

- [ ] **Step 3: If anything fails, debug + fix + commit**

Don't paper over. Use systematic-debugging.

---

## Done

After 8 tasks complete, cook has:
- All Home sections on the unified design system
- Home.tsx reduced from 462 to ~280 lines (still has the active-orders block inline; the 6 leaf components are now reusable)
- Recent Orders section reusing Spec 2's `OrderCard`
- 7 new files under `src/components/home/`

**Series complete:** Spec 1 (design system + recipe flow), Spec 2 (order flow), Spec 3 (Home). The 3-spec series for cook visual overhaul is shipped.
