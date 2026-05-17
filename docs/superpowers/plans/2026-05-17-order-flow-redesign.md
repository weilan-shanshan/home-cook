# Order Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 4 order-flow pages (OrderList / OrderDetailV2 / OrderCreate / Home active-orders) onto Spec 1's design system, centralize status decisions into `lib/order-status.ts`, and introduce a 4-stage progress timeline in OrderDetailV2.

**Architecture:** A single source of truth (`lib/order-status.ts`) owns label/badge-variant/timeline mappings and `nextActionFor()` decision logic. Five new components consume it: `OrderStatusBadge`, `OrderStatusTimeline`, `OrderActionButton`, `OrderItemRow`, `OrderCard`. The four pages compose these — no page reimplements status-aware logic.

**Tech Stack:** React 18 + react-router v7 + Vite 5 + shadcn/ui + Tailwind 3 (Spec 1 tokens) + TanStack Query 5 + vitest + @testing-library/react + jsdom. State machine is preserved; no backend changes.

**Spec:** [docs/superpowers/specs/2026-05-17-order-flow-redesign.md](../specs/2026-05-17-order-flow-redesign.md)

**Mockup:** [docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html) — pages 5 (OrderList), 6 (OrderDetail), 1 (Home active card)

**Working dir:** `/Users/weilan/ali/ai/cook/private-chef/frontend` unless prefixed. Git ops from `/Users/weilan/ali/ai/cook`.

---

## File Map

**New:**
- `private-chef/frontend/src/lib/order-status.ts`
- `private-chef/frontend/src/lib/order-status.test.ts`
- `private-chef/frontend/src/components/order/OrderStatusBadge.tsx`
- `private-chef/frontend/src/components/order/OrderStatusTimeline.tsx`
- `private-chef/frontend/src/components/order/OrderStatusTimeline.test.tsx`
- `private-chef/frontend/src/components/order/OrderActionButton.tsx`
- `private-chef/frontend/src/components/order/OrderItemRow.tsx`
- `private-chef/frontend/src/components/order/OrderCard.tsx`
- `private-chef/frontend/src/components/order/OrderCard.test.tsx`

**Modified:**
- `private-chef/frontend/src/pages/order/OrderList.tsx` (full rewrite consuming OrderCard)
- `private-chef/frontend/src/pages/order/OrderDetailV2.tsx` (hero timeline + visual redo)
- `private-chef/frontend/src/pages/order/OrderCreate.tsx` (visual redo)
- `private-chef/frontend/src/pages/home/Home.tsx` (replace inlined ActiveOrderCard with OrderCard)

---

## Task 1: `lib/order-status.ts` — single source of truth + tests

**Files:**
- Create: `private-chef/frontend/src/lib/order-status.ts`
- Test: `private-chef/frontend/src/lib/order-status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `private-chef/frontend/src/lib/order-status.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  STATUS_LABEL,
  STATUS_BADGE_VARIANT,
  ACTIVE_STATUSES,
  TIMELINE_STAGES,
  STAGE_LABEL,
  statusToTimelineIndex,
  nextActionFor,
  canCancel,
} from './order-status'

describe('STATUS_LABEL', () => {
  test('covers all 6 statuses', () => {
    expect(STATUS_LABEL.pending).toBe('待接单')
    expect(STATUS_LABEL.submitted).toBe('待接单')
    expect(STATUS_LABEL.confirmed).toBe('已接单')
    expect(STATUS_LABEL.preparing).toBe('制作中')
    expect(STATUS_LABEL.completed).toBe('已完成')
    expect(STATUS_LABEL.cancelled).toBe('已取消')
  })
})

describe('STATUS_BADGE_VARIANT', () => {
  test('maps each status to a known badge variant', () => {
    expect(STATUS_BADGE_VARIANT.preparing).toBe('amber')
    expect(STATUS_BADGE_VARIANT.completed).toBe('sage')
    expect(STATUS_BADGE_VARIANT.cancelled).toBe('secondary')
    expect(STATUS_BADGE_VARIANT.submitted).toBe('default')
  })
})

describe('ACTIVE_STATUSES', () => {
  test('contains the four in-flight states', () => {
    expect(ACTIVE_STATUSES.has('pending')).toBe(true)
    expect(ACTIVE_STATUSES.has('submitted')).toBe(true)
    expect(ACTIVE_STATUSES.has('confirmed')).toBe(true)
    expect(ACTIVE_STATUSES.has('preparing')).toBe(true)
    expect(ACTIVE_STATUSES.has('completed')).toBe(false)
    expect(ACTIVE_STATUSES.has('cancelled')).toBe(false)
  })
})

describe('TIMELINE_STAGES', () => {
  test('lists 4 stages in order', () => {
    expect(TIMELINE_STAGES).toEqual(['submitted', 'confirmed', 'preparing', 'completed'])
    expect(STAGE_LABEL.submitted).toBe('已下单')
    expect(STAGE_LABEL.completed).toBe('已完成')
  })
})

describe('statusToTimelineIndex', () => {
  test('pending and submitted both map to 0', () => {
    expect(statusToTimelineIndex('pending')).toBe(0)
    expect(statusToTimelineIndex('submitted')).toBe(0)
  })
  test('confirmed → 1, preparing → 2, completed → 3', () => {
    expect(statusToTimelineIndex('confirmed')).toBe(1)
    expect(statusToTimelineIndex('preparing')).toBe(2)
    expect(statusToTimelineIndex('completed')).toBe(3)
  })
  test('cancelled → -1', () => {
    expect(statusToTimelineIndex('cancelled')).toBe(-1)
  })
})

describe('nextActionFor', () => {
  test('returns 我来接单 when submitted, not mine, no cook', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: false, hasCook: false, isCook: false }),
    ).toEqual({ label: '我来接单', next: 'confirmed', variant: 'default' })
  })
  test('returns null when submitted but is mine (cannot accept own)', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: true, hasCook: false, isCook: false }),
    ).toBeNull()
  })
  test('returns null when submitted but cook already assigned', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: false, hasCook: true, isCook: false }),
    ).toBeNull()
  })
  test('returns 去制作 when confirmed (any member can advance)', () => {
    expect(
      nextActionFor({ status: 'confirmed', isMine: true, hasCook: true, isCook: false }),
    ).toEqual({ label: '去制作', next: 'preparing', variant: 'default' })
    expect(
      nextActionFor({ status: 'confirmed', isMine: false, hasCook: true, isCook: true }),
    ).toEqual({ label: '去制作', next: 'preparing', variant: 'default' })
  })
  test('returns 出锅完成 when preparing', () => {
    expect(
      nextActionFor({ status: 'preparing', isMine: false, hasCook: true, isCook: true }),
    ).toEqual({ label: '出锅完成', next: 'completed', variant: 'default' })
  })
  test('returns null on completed and cancelled', () => {
    expect(
      nextActionFor({ status: 'completed', isMine: false, hasCook: true, isCook: false }),
    ).toBeNull()
    expect(
      nextActionFor({ status: 'cancelled', isMine: false, hasCook: false, isCook: false }),
    ).toBeNull()
  })
})

describe('canCancel', () => {
  test('allows cancel during submitted and confirmed', () => {
    expect(canCancel('submitted')).toBe(true)
    expect(canCancel('confirmed')).toBe(true)
  })
  test('disallows cancel during preparing (already cooking)', () => {
    expect(canCancel('preparing')).toBe(false)
  })
  test('disallows cancel after completion or cancellation', () => {
    expect(canCancel('completed')).toBe(false)
    expect(canCancel('cancelled')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify failing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/lib/order-status.test.ts
```

Expected: FAIL — `Cannot find module './order-status'`.

- [ ] **Step 3: Implement the module**

Create `private-chef/frontend/src/lib/order-status.ts`:

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

export const STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  'default' | 'sage' | 'amber' | 'secondary' | 'destructive'
> = {
  pending: 'default',
  submitted: 'default',
  confirmed: 'default',
  preparing: 'amber',
  completed: 'sage',
  cancelled: 'secondary',
}

export const ACTIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'submitted',
  'confirmed',
  'preparing',
])

export const TIMELINE_STAGES = ['submitted', 'confirmed', 'preparing', 'completed'] as const
export type TimelineStage = (typeof TIMELINE_STAGES)[number]

export const STAGE_LABEL: Record<TimelineStage, string> = {
  submitted: '已下单',
  confirmed: '已接单',
  preparing: '制作中',
  completed: '已完成',
}

export function statusToTimelineIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 0
    case 'confirmed':
      return 1
    case 'preparing':
      return 2
    case 'completed':
      return 3
    case 'cancelled':
      return -1
  }
}

export interface OrderActionContext {
  status: OrderStatus
  isMine: boolean
  hasCook: boolean
  isCook: boolean
}

export interface OrderAction {
  label: string
  next: 'confirmed' | 'preparing' | 'completed' | 'cancelled'
  variant: 'default' | 'destructive'
}

export function nextActionFor(ctx: OrderActionContext): OrderAction | null {
  const { status, isMine, hasCook } = ctx
  if ((status === 'submitted' || status === 'pending') && !isMine && !hasCook) {
    return { label: '我来接单', next: 'confirmed', variant: 'default' }
  }
  if (status === 'confirmed') {
    return { label: '去制作', next: 'preparing', variant: 'default' }
  }
  if (status === 'preparing') {
    return { label: '出锅完成', next: 'completed', variant: 'default' }
  }
  return null
}

export function canCancel(status: OrderStatus): boolean {
  return status === 'submitted' || status === 'pending' || status === 'confirmed'
}

export function mealTypeLabel(mealType: string): string {
  switch (mealType) {
    case 'breakfast':
      return '早餐'
    case 'lunch':
      return '午餐'
    case 'dinner':
      return '晚餐'
    case 'snack':
      return '加餐'
    default:
      return mealType
  }
}
```

- [ ] **Step 4: Run tests to verify passing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/lib/order-status.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/lib/order-status.ts \
        private-chef/frontend/src/lib/order-status.test.ts
git commit -m "feat(order): centralize status labels, timeline, and action decisions"
```

---

## Task 2: `OrderStatusBadge.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/order/OrderStatusBadge.tsx`

Pure pass-through, no tests.

- [ ] **Step 1: Create the component**

```tsx
import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

interface Props {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/order/OrderStatusBadge.tsx
git commit -m "feat(order): add OrderStatusBadge component"
```

---

## Task 3: `OrderStatusTimeline.tsx` + tests

**Files:**
- Create: `private-chef/frontend/src/components/order/OrderStatusTimeline.tsx`
- Test: `private-chef/frontend/src/components/order/OrderStatusTimeline.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { OrderStatusTimeline } from './OrderStatusTimeline'

describe('OrderStatusTimeline', () => {
  test('renders 4 stages with submitted at index 0 active', () => {
    const { container } = render(<OrderStatusTimeline status="submitted" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars).toHaveLength(4)
    expect(bars[0].className).toContain('bg-brand')
    expect(bars[1].className).toContain('bg-cream-300')
  })

  test('preparing lights first 3 bars', () => {
    const { container } = render(<OrderStatusTimeline status="preparing" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars[0].className).toContain('bg-brand')
    expect(bars[1].className).toContain('bg-brand')
    expect(bars[2].className).toContain('bg-brand')
    expect(bars[3].className).toContain('bg-cream-300')
  })

  test('completed lights all bars', () => {
    const { container } = render(<OrderStatusTimeline status="completed" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars).toHaveLength(4)
    bars.forEach((bar) => {
      expect(bar.className).toContain('bg-brand')
    })
  })

  test('cancelled renders a single rose-tinted block', () => {
    render(<OrderStatusTimeline status="cancelled" />)
    expect(screen.getByText('订单已取消')).toBeInTheDocument()
  })

  test('shows stage labels under bars', () => {
    render(<OrderStatusTimeline status="confirmed" />)
    expect(screen.getByText('已下单')).toBeInTheDocument()
    expect(screen.getByText('已接单')).toBeInTheDocument()
    expect(screen.getByText('制作中')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify failing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/order/OrderStatusTimeline.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

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

  if (currentIdx === -1) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-rose-100 px-3 py-2 text-rose-500 text-sm font-bold',
          className,
        )}
      >
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

- [ ] **Step 4: Verify passing + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/order/OrderStatusTimeline.test.tsx
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/order/OrderStatusTimeline.tsx \
        private-chef/frontend/src/components/order/OrderStatusTimeline.test.tsx
git commit -m "feat(order): add OrderStatusTimeline (4-stage progress + cancelled)"
```

---

## Task 4: `OrderActionButton.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/order/OrderActionButton.tsx`

No tests — logic lives in `nextActionFor()` (Task 1) which is already tested.

- [ ] **Step 1: Create the component**

```tsx
import { Button } from '@/components/ui/button'
import { nextActionFor } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'
import type { OrderAction } from '@/lib/order-status'
import { cn } from '@/lib/utils'

interface Props {
  status: OrderStatus
  isMine: boolean
  hasCook: boolean
  isCook: boolean
  onAction: (next: OrderAction['next']) => void
  isPending?: boolean
  variant?: 'primary' | 'wide'
  className?: string
}

export function OrderActionButton({
  status,
  isMine,
  hasCook,
  isCook,
  onAction,
  isPending,
  variant = 'primary',
  className,
}: Props) {
  const action = nextActionFor({ status, isMine, hasCook, isCook })
  if (!action) return null

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation()
        onAction(action.next)
      }}
      disabled={isPending}
      variant={action.variant}
      className={cn(variant === 'wide' && 'w-full', className)}
    >
      {action.label} →
    </Button>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/order/OrderActionButton.tsx
git commit -m "feat(order): add OrderActionButton using nextActionFor"
```

---

## Task 5: `OrderItemRow.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/order/OrderItemRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Utensils, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  item: {
    recipeId: number
    recipeTitle: string
    quantity: number
    image?: { thumbUrl: string | null; url: string } | null
    cookMinutes?: number | null
  }
  editable?: boolean
  onQuantityChange?: (delta: number) => void
}

export function OrderItemRow({ item, editable, onQuantityChange }: Props) {
  const thumb = item.image?.thumbUrl || item.image?.url

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-12 h-12 flex-none rounded-2xl bg-cream-100 overflow-hidden flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={item.recipeTitle} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="w-5 h-5 text-cream-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink-900 truncate">{item.recipeTitle}</p>
        {item.cookMinutes != null && (
          <p className="text-[10px] text-ink-500">{item.cookMinutes} 分钟</p>
        )}
      </div>
      {editable && onQuantityChange ? (
        <div className="flex items-center gap-2 flex-none">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(-1)}
            aria-label={`减少 ${item.recipeTitle}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(1)}
            aria-label={`增加 ${item.recipeTitle}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <span className="text-sm font-bold text-brand flex-none">× {item.quantity}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/order/OrderItemRow.tsx
git commit -m "feat(order): add OrderItemRow (display + editable modes)"
```

---

## Task 6: `OrderCard.tsx` + tests

**Files:**
- Create: `private-chef/frontend/src/components/order/OrderCard.tsx`
- Test: `private-chef/frontend/src/components/order/OrderCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { OrderCard, type OrderCardData } from './OrderCard'

function makeOrder(overrides: Partial<OrderCardData>): OrderCardData {
  return {
    id: 1,
    status: 'submitted',
    mealType: 'lunch',
    mealDate: '2026-05-17',
    createdAt: '2026-05-17 12:00:00',
    isMine: false,
    hasCook: false,
    cookDisplayName: null,
    requesterDisplayName: '爸',
    items: [
      { recipeId: 1, recipeTitle: '红烧肉', image: null },
    ],
    ...overrides,
  }
}

function renderCard(props: Partial<React.ComponentProps<typeof OrderCard>> = {}) {
  return render(
    <MemoryRouter>
      <OrderCard
        order={makeOrder({})}
        currentUserId={2}
        mode="default"
        onAction={vi.fn()}
        isPending={false}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('OrderCard', () => {
  test('default mode renders item thumbnails', () => {
    renderCard({
      order: makeOrder({
        items: [
          { recipeId: 1, recipeTitle: '红烧肉', image: null },
          { recipeId: 2, recipeTitle: '清蒸鱼', image: null },
        ],
      }),
    })
    // Each item rendered as a thumbnail tile
    expect(screen.getAllByRole('img', { hidden: true }).length).toBeGreaterThanOrEqual(0)
    expect(screen.getByText(/午餐/)).toBeInTheDocument()
  })

  test('compact mode omits item thumbnails', () => {
    const { container } = renderCard({
      mode: 'compact',
      order: makeOrder({
        items: [
          { recipeId: 1, recipeTitle: '红烧肉', image: null },
        ],
      }),
    })
    // Compact mode → no thumbnail row class
    expect(container.querySelector('[data-test="order-thumbnails"]')).toBeNull()
  })

  test('active status applies brand-200 border', () => {
    const { container } = renderCard({ order: makeOrder({ status: 'preparing' }) })
    expect(container.firstChild).toHaveClass('border-brand-200')
  })

  test('completed status applies muted styling', () => {
    const { container } = renderCard({ order: makeOrder({ status: 'completed' }) })
    expect(container.firstChild?.className).toContain('opacity-90')
  })

  test('clicking action button calls onAction with next status', () => {
    const onAction = vi.fn()
    renderCard({
      order: makeOrder({ status: 'confirmed', hasCook: true, cookDisplayName: '妈' }),
      onAction,
    })
    fireEvent.click(screen.getByRole('button', { name: /去制作/ }))
    expect(onAction).toHaveBeenCalledWith(1, 'preparing')
  })

  test('no action button when status is completed', () => {
    renderCard({ order: makeOrder({ status: 'completed' }) })
    expect(screen.queryByRole('button')).toBeNull()
  })
})
```

- [ ] **Step 2: Verify failing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/order/OrderCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement OrderCard**

```tsx
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Utensils } from 'lucide-react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderActionButton } from './OrderActionButton'
import { ACTIVE_STATUSES, mealTypeLabel } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

export interface OrderCardData {
  id: number
  status: OrderStatus
  mealType: string
  mealDate: string
  createdAt: string
  isMine: boolean
  hasCook: boolean
  cookDisplayName: string | null
  requesterDisplayName: string
  items: Array<{
    recipeId: number
    recipeTitle: string
    image: { thumbUrl: string | null; url: string } | null
  }>
}

interface Props {
  order: OrderCardData
  currentUserId: number | null
  mode: 'compact' | 'default'
  onAction: (orderId: number, next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => void
  isPending: boolean
  className?: string
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

export function OrderCard({
  order,
  currentUserId,
  mode,
  onAction,
  isPending,
  className,
}: Props) {
  const isActive = ACTIVE_STATUSES.has(order.status)
  const isCook = !!currentUserId && order.cookDisplayName != null /* we don't have cookUserId here */

  const showThumbnails = mode === 'default' && order.items.length > 0
  const previewItems = order.items.slice(0, 4)
  const remaining = Math.max(order.items.length - previewItems.length, 0)

  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-4 transition-shadow',
        isActive ? 'border-2 border-brand-200 shadow-card' : 'border border-cream-300 opacity-90',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <OrderStatusBadge status={order.status} />
        <span className="text-[10px] text-ink-500">{formatRelativeTime(order.createdAt)}</span>
      </div>

      <Link to={`/orders/${order.id}`} className="block">
        <p className="font-extrabold text-base mb-1 text-ink-900">
          {mealTypeLabel(order.mealType)} #{order.id}
        </p>
        <p className="text-xs text-ink-500 mb-3">
          {order.isMine ? '我' : order.requesterDisplayName} 点单
          {order.hasCook ? (
            <>
              <span className="mx-1.5 text-ink-400">·</span>
              {order.cookDisplayName ?? '已被接'} 掌勺
            </>
          ) : (
            <span className="ml-1.5 text-brand font-semibold">尚无大厨</span>
          )}
        </p>

        {showThumbnails && (
          <div className="flex gap-2 mb-3" data-test="order-thumbnails">
            {previewItems.map((item) => (
              <div
                key={item.recipeId}
                className="w-12 h-12 rounded-xl bg-cream-100 overflow-hidden flex items-center justify-center flex-none"
              >
                {item.image ? (
                  <img
                    src={item.image.thumbUrl || item.image.url}
                    alt={item.recipeTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Utensils className="w-5 h-5 text-cream-400" />
                )}
              </div>
            ))}
            {remaining > 0 && (
              <div className="w-12 h-12 rounded-xl bg-cream-100 border border-dashed border-cream-400 flex items-center justify-center text-[10px] font-bold text-ink-500 flex-none">
                +{remaining}
              </div>
            )}
          </div>
        )}
      </Link>

      <OrderActionButton
        status={order.status}
        isMine={order.isMine}
        hasCook={order.hasCook}
        isCook={isCook}
        onAction={(next) => onAction(order.id, next)}
        isPending={isPending}
        variant="wide"
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify passing**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/order/OrderCard.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/order/OrderCard.tsx \
        private-chef/frontend/src/components/order/OrderCard.test.tsx
git commit -m "feat(order): add OrderCard with compact/default modes"
```

---

## Task 7: Rewrite `OrderList.tsx`

**Files:**
- Modify: `private-chef/frontend/src/pages/order/OrderList.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the ENTIRE content of `private-chef/frontend/src/pages/order/OrderList.tsx` with:

```tsx
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useOrders, useUpdateOrderStatus, type Order, type OrderStatus } from '@/hooks/useOrders'
import { useCurrentUser } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, ACTIVE_STATUSES } from '@/lib/order-status'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: Array<{ key: 'all' | OrderStatus; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'submitted', label: '待接单' },
  { key: 'confirmed', label: '已接单' },
  { key: 'preparing', label: '制作中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

function toCardData(order: Order, currentUserId: number | null): OrderCardData {
  return {
    id: order.id,
    status: order.status,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: !!currentUserId && order.userId === currentUserId,
    hasCook: order.cookUserId != null,
    cookDisplayName: null, // useOrders list doesn't include cook display name
    requesterDisplayName: order.userId === currentUserId ? '我' : '家人',
    items: order.items.map((it) => ({
      recipeId: it.recipeId,
      recipeTitle: it.recipeTitle,
      image: it.image,
    })),
  }
}

export default function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recipeIdParam = searchParams.get('recipeId')
  const recipeIdFilter = recipeIdParam ? Number(recipeIdParam) : undefined
  const statusParam = searchParams.get('status') as OrderStatus | null
  const statusFilter = statusParam && statusParam !== 'all' ? statusParam : undefined

  const { data: orders, isLoading, isError } = useOrders({ recipeId: recipeIdFilter, status: statusFilter })
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const { data: currentUser } = useCurrentUser()
  const { toast } = useToast()

  const counts = useMemo(() => {
    const map: Partial<Record<OrderStatus | 'all', number>> = { all: orders?.length ?? 0 }
    orders?.forEach((o) => {
      map[o.status] = (map[o.status] ?? 0) + 1
    })
    return map
  }, [orders])

  const handleAction = (orderId: number, next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => {
    updateStatus(
      { id: orderId, status: next },
      {
        onError: (err) => {
          toast({
            title: '状态更新失败',
            description: err instanceof Error ? err.message : '请重试',
            variant: 'destructive',
          })
        },
      },
    )
  }

  const setStatus = (next: 'all' | OrderStatus) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('status')
    else params.set('status', next)
    setSearchParams(params)
  }

  const clearRecipeFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('recipeId')
    setSearchParams(next)
  }

  const activeStatus: 'all' | OrderStatus = statusFilter ?? 'all'

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pt-2">
        {recipeIdFilter && (
          <Link to="/orders" className="flex items-center text-sm text-ink-500 hover:text-ink-900">
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Link>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">订单</h1>
      </div>

      {recipeIdFilter && (
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <span>筛选：包含菜品 #{recipeIdFilter}</span>
            <button
              type="button"
              aria-label="清除筛选"
              onClick={clearRecipeFilter}
              className="w-4 h-4 rounded-full bg-brand-700 text-white flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {STATUS_FILTERS.map((f) => {
          const n = counts[f.key] ?? 0
          if (f.key !== 'all' && n === 0) return null
          const active = activeStatus === f.key
          return (
            <Badge
              key={f.key}
              variant={active ? 'default' : 'outline'}
              onClick={() => setStatus(f.key)}
              className={cn(
                'cursor-pointer flex-none px-3 py-1.5 rounded-full text-xs font-bold',
                active && 'bg-ink-900 text-white',
              )}
            >
              {f.label} {n > 0 && <span className="ml-1 opacity-80">{n}</span>}
            </Badge>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-ink-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">正在加载订单...</span>
        </div>
      )}

      {isError && (
        <div className="text-center text-rose-500 text-sm py-12">订单加载失败</div>
      )}

      {!isLoading && !isError && (orders?.length ?? 0) === 0 && (
        <div className="text-center text-ink-500 text-sm py-12">
          还没有订单 — 去 <Link to="/menu" className="text-brand font-bold">点菜</Link> 吧
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((o) => (
          <OrderCard
            key={o.id}
            order={toCardData(o, currentUser?.id ?? null)}
            currentUserId={currentUser?.id ?? null}
            mode="default"
            onAction={handleAction}
            isPending={isUpdating}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify imports**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
grep -n "useCurrentUser" src/hooks/useAuth.ts | head -3
```

Verify `useCurrentUser` is exported. If the hook returns differently shaped data (no `id`), adapt the access path accordingly.

- [ ] **Step 3: Type check + test**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/order/OrderList.tsx
git commit -m "feat(order): rewrite OrderList using OrderCard + status filter chips"
```

---

## Task 8: Rewrite `OrderDetailV2.tsx` — timeline hero

**Files:**
- Modify: `private-chef/frontend/src/pages/order/OrderDetailV2.tsx`

This rewrite is substantial but mechanical. Preserve existing `OrderCommentThread`, `OrderReviewCard`, `ShareDialog`, like-button logic. Replace status helper functions, the hero card, and outer chrome.

- [ ] **Step 1: Read current file to understand sections to preserve**

```bash
wc -l /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderDetailV2.tsx
sed -n '60,150p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderDetailV2.tsx
sed -n '150,266p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderDetailV2.tsx
```

Note: like/share/comment/review handlers + their JSX. We'll keep them.

- [ ] **Step 2: Rewrite the file**

Replace `private-chef/frontend/src/pages/order/OrderDetailV2.tsx` ENTIRELY with:

```tsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ChevronLeft, Heart, Share2, Loader2 } from 'lucide-react'
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useToggleOrderLike } from '@/hooks/useOrderInteractions'
import { useCurrentUser } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { OrderCommentThread } from '@/components/comment/OrderCommentThread'
import { OrderReviewCard } from '@/components/comment/OrderReviewCard'
import { ShareDialog } from '@/components/share/ShareDialog'
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { OrderActionButton } from '@/components/order/OrderActionButton'
import { OrderItemRow } from '@/components/order/OrderItemRow'
import { STATUS_LABEL, mealTypeLabel } from '@/lib/order-status'

function formatDateTime(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'))
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function OrderDetailV2() {
  const { id } = useParams()
  const orderId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: order, isLoading, error } = useOrder(orderId)
  const { data: currentUser } = useCurrentUser()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()
  const toggleLike = useToggleOrderLike()
  const [shareOpen, setShareOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ink-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载中...
      </div>
    )
  }
  if (error || !order) {
    return (
      <div className="p-8 text-center text-rose-500">
        订单加载失败
        <div className="mt-4">
          <Link to="/orders" className="text-brand font-bold">返回订单列表</Link>
        </div>
      </div>
    )
  }

  const isMine = currentUser?.id === order.userId
  const hasCook = order.cook != null
  const isCook = currentUser?.id != null && order.cook?.userId === currentUser.id

  const handleAction = (next: 'confirmed' | 'preparing' | 'completed' | 'cancelled') => {
    updateStatus(
      { id: order.id, status: next },
      {
        onError: (err) => {
          toast({
            title: '状态更新失败',
            description: err instanceof Error ? err.message : '请重试',
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Top nav */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-900"
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold">
            {mealTypeLabel(order.mealType)} #{order.id}
          </h1>
          <p className="text-[11px] text-ink-500">
            {formatDateTime(order.createdAt)} · {order.requester.displayName} 点单
          </p>
        </div>
      </div>

      {/* Status hero card */}
      <div className="bg-gradient-to-br from-brand-50 to-cream-100 rounded-3xl p-5 border border-cream-300">
        <p className="text-xs text-ink-500 mb-2">订单状态</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-extrabold text-brand-700">
            {STATUS_LABEL[order.status]}
          </span>
          <span className="ml-auto">
            <OrderStatusBadge status={order.status} />
          </span>
        </div>
        <OrderStatusTimeline status={order.status} />
        <div className="mt-4">
          <OrderActionButton
            status={order.status}
            isMine={isMine}
            hasCook={hasCook}
            isCook={!!isCook}
            onAction={handleAction}
            isPending={isUpdating}
            variant="wide"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
          {order.items.length} 道菜
        </h2>
        <div className="bg-white rounded-3xl border border-cream-300 divide-y divide-cream-300 px-4">
          {order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={{
                recipeId: item.recipeId,
                recipeTitle: item.recipeTitle,
                quantity: item.quantity,
                image: item.image,
              }}
            />
          ))}
        </div>
        {order.note && (
          <div className="mt-3 bg-amber-100 text-ink-800 rounded-2xl px-4 py-3 text-sm">
            <span className="font-bold mr-1">备注:</span>
            {order.note}
          </div>
        )}
      </div>

      {/* Like / share row */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            toggleLike.mutate({ orderId: order.id, isLikedByMe: order.isLikedByMe })
          }
          className="flex-1 gap-2"
          aria-pressed={order.isLikedByMe}
        >
          <Heart
            className={
              order.isLikedByMe
                ? 'w-4 h-4 fill-brand text-brand'
                : 'w-4 h-4 text-ink-500'
            }
          />
          {order.likeCount}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShareOpen(true)}
          className="flex-1 gap-2"
        >
          <Share2 className="w-4 h-4" />
          分享
        </Button>
      </div>

      {/* Review (completed only) */}
      {order.status === 'completed' && <OrderReviewCard orderId={order.id} />}

      {/* Comments */}
      <OrderCommentThread orderId={order.id} />

      <ShareDialog
        targetType="order"
        targetId={order.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify `useCurrentUser` is imported correctly + tests pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
```

If tsc complains about `OrderReviewCard` props (e.g., expects different `orderId` shape), inspect:

```bash
grep -n "interface.*OrderReviewCard\|function OrderReviewCard\|export.*OrderReviewCard" src/components/comment/OrderReviewCard.tsx | head -5
```

Adapt the prop name as needed. Same for `OrderCommentThread`. The existing OrderDetailV2.tsx already called both; mimic that call signature.

If `ShareDialog` takes a different prop signature, check:
```bash
grep -n "interface.*ShareDialog\|^export function ShareDialog" src/components/share/ShareDialog.tsx | head -5
```
Adapt.

If `useToggleOrderLike` returns a function instead of a mutation object, look at its actual signature:
```bash
grep -n "export function useToggleOrderLike" src/hooks/useOrderInteractions.ts | head -3
sed -n '/export function useToggleOrderLike/,/^}/p' src/hooks/useOrderInteractions.ts | head -30
```
Adapt the call site.

- [ ] **Step 4: Run full tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run 2>&1 | tail -5
```

Expected: no regressions.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/order/OrderDetailV2.tsx
git commit -m "feat(order): redo OrderDetailV2 with progress timeline hero"
```

---

## Task 9: Rewrite `OrderCreate.tsx`

**Files:**
- Modify: `private-chef/frontend/src/pages/order/OrderCreate.tsx`

The existing file has full create-order business logic (meal type, date picker, items, note, submit). We're doing a visual-only rewrite — preserve all state + handlers, just restyle the JSX.

- [ ] **Step 1: Read current file**

```bash
sed -n '1,80p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderCreate.tsx
sed -n '80,200p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderCreate.tsx
sed -n '200,340p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/order/OrderCreate.tsx
```

Identify:
- State variables (meal type, date, items, note)
- Handlers (handleSubmit, handleQuantityChange, etc.)
- Where items come from (URL params? state from MenuPage?)
- Date picker library used

- [ ] **Step 2: Restyle in place (incremental Edits, not full rewrite)**

This is a visual refresh — KEEP all imports/state/handlers, only restructure JSX and update classNames.

Make these targeted edits:

**2a)** At the top of the return JSX (find the outermost wrapping `<div>`), change its className to:
```tsx
<div className="space-y-4 pb-24 animate-in fade-in duration-500">
```

**2b)** Replace the page header (first heading in the JSX) with:
```tsx
<div className="flex items-center gap-3 pt-2">
  <button
    type="button"
    onClick={() => navigate(-1)}
    className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-900"
    aria-label="返回"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>
  <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">新建订单</h1>
</div>
```

(Add `ChevronLeft` to lucide imports, `navigate` from useNavigate if not present.)

**2c)** Each section currently wrapped in `Card`/`glass-card` — replace with the new card primitive. Find each occurrence of `<Card>` (or `<div className="glass-card …">`) and change to:
```tsx
<div className="bg-white rounded-3xl border border-cream-300 p-4 space-y-3">
```

The matching closing tag becomes `</div>`. Don't forget to also remove `<CardHeader>`, `<CardContent>` wrappers if they exist — replace with plain `<div>` or simpler markup.

**2d)** Meal-type selection chips: find the row of buttons/badges for breakfast/lunch/dinner/snack. Replace its className row with:
```tsx
<div className="flex gap-2 flex-wrap">
  {/* each chip */}
</div>
```
And for each chip:
```tsx
<Badge
  variant={mealType === 'breakfast' ? 'default' : 'outline'}
  onClick={() => setMealType('breakfast')}
  className="cursor-pointer px-3 py-1.5 rounded-full text-sm font-bold"
>
  早餐
</Badge>
```
(Repeat for lunch / dinner / snack.)

**2e)** Items list — replace the existing item rendering with `<OrderItemRow editable />`. Add at the top:
```tsx
import { OrderItemRow } from '@/components/order/OrderItemRow'
```
And in the JSX where items render:
```tsx
{items.length === 0 ? (
  <div className="text-center text-ink-500 text-sm py-6">
    还没选菜 — <Link to="/menu" className="text-brand font-bold">去点菜</Link>
  </div>
) : (
  <div className="divide-y divide-cream-300">
    {items.map((item, idx) => (
      <OrderItemRow
        key={item.recipe_id ?? idx}
        item={{
          recipeId: item.recipe_id,
          recipeTitle: item.title,
          quantity: item.quantity,
          image: item.thumb_url ? { url: item.thumb_url, thumbUrl: item.thumb_url } : null,
        }}
        editable
        onQuantityChange={(delta) => handleQuantityChange(item.recipe_id, delta)}
      />
    ))}
  </div>
)}
```
Adapt field names to match the existing item shape (the current file might call it `recipe_id` or `recipeId`). Inspect first.

**2f)** Submit button row at bottom — wrap in a sticky bar:
```tsx
<div
  className="fixed left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur border-t border-cream-300 max-w-md mx-auto"
  style={{ bottom: 'var(--app-tabbar-height, 4rem)' }}
>
  <div className="flex gap-2">
    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
      取消
    </Button>
    <Button type="submit" disabled={isSubmitting || items.length === 0} className="flex-1">
      {isSubmitting ? '提交中...' : '提交点单'}
    </Button>
  </div>
</div>
```

- [ ] **Step 3: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run 2>&1 | tail -5
```

Expected: clean, no regressions.

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/order/OrderCreate.tsx
git commit -m "feat(order): redo OrderCreate visuals with cream/ink tokens"
```

---

## Task 10: Update `Home.tsx` active order region

**Files:**
- Modify: `private-chef/frontend/src/pages/home/Home.tsx`

Home.tsx has 600 lines. Only the inlined `ActiveOrderCard` (lines ~92-205) and its 3 call sites (lines ~334, ~349, ~364) need to change. Other sections (recommended recipes, comments stream, achievements) STAY untouched.

- [ ] **Step 1: Locate the section**

```bash
grep -n "ActiveOrderCard\|activeOrders" /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/home/Home.tsx
```

Note all line numbers.

- [ ] **Step 2: Delete the inlined `ActiveOrderCard` function**

Find the `function ActiveOrderCard({` definition (around line 92) and its closing `}`. Delete the ENTIRE function body. Also delete any helper functions inside the file that were ONLY used by `ActiveOrderCard` (e.g., `statusLabel`, `statusTone`, `formatRelativeTime` if they only serve the deleted component). Be careful: keep helpers that other sections (recommended/comments/achievements) still use.

- [ ] **Step 3: Add imports for the shared component**

At the top of Home.tsx:

```tsx
import { OrderCard, type OrderCardData } from '@/components/order/OrderCard'
import type { ActiveOrderSummary } from '@/hooks/useHomeSummary'
import type { OrderStatus } from '@/hooks/useOrders'
```

(Adjust based on existing imports — only add what's missing.)

- [ ] **Step 4: Add adapter function near the top of Home.tsx (after imports, before the default export)**

```tsx
function activeToCardData(order: ActiveOrderSummary, currentUserId: number | null): OrderCardData {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    mealType: order.mealType,
    mealDate: order.mealDate,
    createdAt: order.createdAt,
    isMine: order.isMine,
    hasCook: order.cook != null,
    cookDisplayName: order.cook?.displayName ?? null,
    requesterDisplayName: order.requester.displayName,
    items: order.items.map((it) => ({
      recipeId: it.recipeId,
      recipeTitle: it.recipeTitle,
      image: it.image,
    })),
  }
}
```

- [ ] **Step 5: Replace `<ActiveOrderCard ... />` call sites**

Find each `<ActiveOrderCard` call site. Replace with:

```tsx
<OrderCard
  order={activeToCardData(order, currentUser?.id ?? null)}
  currentUserId={currentUser?.id ?? null}
  mode="compact"
  onAction={handleUpdateStatus}
  isPending={isUpdating}
/>
```

Verify `handleUpdateStatus`, `isUpdating`, `currentUser` are already defined in Home.tsx — the existing component definitely has them since the old ActiveOrderCard used them.

The `handleUpdateStatus` signature was previously `(orderId, next: 'confirmed' | 'preparing' | 'completed') => void`. The new OrderCard's onAction has the same shape (4-status union including 'cancelled'). If TypeScript complains about widening, adapt the local handler signature in Home.tsx to accept the broader type, or cast at call site.

- [ ] **Step 6: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/home/Home.tsx
git commit -m "feat(home): migrate active orders to shared OrderCard component"
```

---

## Task 11: End-to-end verification

No new code. Verify the whole stack works.

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

Expected: all green; no new lint errors.

- [ ] **Step 2: Manual smoke (optional if backend services not running locally)**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run preview
# in another tab:
cd /Users/weilan/ali/ai/cook/private-chef/backend && npm run dev
```

Open `http://localhost:4173` at 375 viewport. Walk through:

1. Log in → Home → active orders region renders new OrderCard styling
2. Tap an active order card body → navigates to OrderDetailV2
3. OrderDetailV2 shows progress timeline hero at top with correct stage highlighted
4. Tap 「我来接单」 / 「去制作」 / 「出锅完成」 on respective states → status updates, timeline advances
5. Bottom Like + Share row works (counts update, share dialog opens)
6. Completed order shows OrderReviewCard
7. Tap 「订单」 tab → OrderList shows status filter chips with counts
8. Pick a status → filter applied, URL updates with `?status=X`
9. From RecipeDetail of a referenced recipe → trigger 「去看这些订单」 → land in OrderList with `?recipeId=N` + filter chip → click × → chip clears
10. MenuPage → select recipes → 「提交点单」 → OrderCreate renders new card styling → submit → land in OrderDetailV2

- [ ] **Step 3: If anything fails, debug + fix + commit individually**

Don't paper over symptoms. Use systematic-debugging if needed.

---

## Done

After 11 tasks complete, cook has:
- A single source of truth for order status decisions (`lib/order-status.ts`)
- 5 reusable order components (`OrderStatusBadge`, `OrderStatusTimeline`, `OrderActionButton`, `OrderItemRow`, `OrderCard`)
- Visually consistent OrderList + OrderDetailV2 + OrderCreate + Home active region using Spec 1 tokens
- A clear 4-stage progress timeline in OrderDetailV2 that lets users see where their order is at a glance

**Next:** Spec 3 — Home page redesign (hero, recommended recipes, comments stream, achievements) reusing this spec's `OrderCard`.
