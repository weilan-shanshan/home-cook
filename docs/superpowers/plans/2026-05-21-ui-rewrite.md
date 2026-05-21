# COOK · 私厨 UI Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pixel-rewrite the 6 mockup screens of `private-chef/frontend` and roll the same design tokens / component library to the remaining pages.

**Architecture:** Incremental, one-commit-per-task on `main`. Phase 1 lays foundation (tokens + UI atoms + layout). Phase 2 rewrites mockup screens. Phase 3 covers non-mockup pages. Phase 4 boots dev server and pixel-diffs against mockup.

**Tech Stack:** React 18 + Vite 5 + TypeScript + Tailwind 3 + Radix UI + react-router 7.

**Spec:** [`docs/superpowers/specs/2026-05-21-ui-rewrite-design.md`](../specs/2026-05-21-ui-rewrite-design.md)

**TDD note:** This is a visual rewrite. Per-task TDD is replaced by Phase 4 visual verification against the mockup. Existing unit tests (e.g. `HomeRecipeRail.test.tsx`) must still pass — run `npm test` after every task; if a deleted/renamed component had a test, delete the test in the same commit.

**All paths in this plan are relative to `private-chef/frontend/`.**

---

## Phase 1 — Foundation (Tasks 1-5)

### Task 1: Update design tokens (Tailwind + CSS variables)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Update Tailwind color palette**

Open `tailwind.config.ts`. Replace the `cream`, `sage`, `amber` blocks and add `mustard`, `rust` blocks. Final color section (only the changed/added keys shown — keep everything else identical):

```ts
cream: {
  50: '#FAF6EE',
  100: '#F4EDDF',
  200: '#E8DFD3',
  300: '#D9CCB8',
  400: '#C9BCA8',
},
sage: {
  100: '#E8EDD8',
  200: '#D9E2BB',
  300: '#BCC993',
  500: '#6B7B3C',
  700: '#4A5A28',
},
mustard: {
  100: '#FCEFD0',
  300: '#F1C66E',
  500: '#D97706',
  700: '#A35908',
},
rust: {
  100: '#F8D5C7',
  300: '#E8997C',
  500: '#B23E1F',
  700: '#7E2A12',
},
amber: { 100: '#FCEFD0', 500: '#D97706' }, // keep for backcompat
```

- [ ] **Step 2: Update CSS root variables**

In `src/styles/index.css`, change inside `:root {`:

```css
--background: 36 30% 95%;     /* was 30 30% 98% */
--secondary: 34 33% 92%;      /* was 36 30% 95% */
--muted: 34 33% 92%;
--border: 34 25% 84%;         /* was 36 25% 87% */
--input: 34 25% 84%;
```

And change the body background-color literal:

```css
body {
  /* ... */
  background-color: #FAF6EE;  /* was #FDFAF5 */
  /* ... */
}
```

- [ ] **Step 3: Add soft border helper**

Append to `@layer components { ... }` block:

```css
.surface-card {
  @apply rounded-3xl border border-cream-200 bg-white;
}

.surface-cream {
  @apply rounded-3xl border border-cream-200 bg-cream-100;
}
```

- [ ] **Step 4: Verify build still compiles**

Run: `cd private-chef/frontend && npm run build 2>&1 | tail -20`
Expected: build succeeds (warnings ok, no errors)

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/tailwind.config.ts private-chef/frontend/src/styles/index.css
git commit -m "feat(tokens): align color palette + radii to visual system v1 mockup

- cream-* shifted warmer (FAF6EE / F4EDDF / E8DFD3 / D9CCB8)
- add sage-200/300, mustard, rust palettes for accent set
- surface-card / surface-cream helper classes"
```

---

### Task 2: Upgrade Button + Card + Badge for Bento pill style

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Add `pill` size to Button**

In `src/components/ui/button.tsx`, replace the `size` block inside `cva`:

```ts
size: {
  default: "h-11 px-6 py-2",
  sm: "h-9 px-4 text-xs",
  lg: "h-12 px-8 text-base",
  pill: "h-14 px-8 text-base font-medium rounded-full",
  icon: "h-11 w-11",
  iconSm: "h-9 w-9",
},
```

- [ ] **Step 2: Add `inverse` variant (dark CTA on cream card)**

In the same `variants.variant` block, add after `link`:

```ts
inverse: "bg-ink-900 text-cream-50 hover:bg-ink-800 active:bg-ink-900",
```

- [ ] **Step 3: Update Card defaults**

In `src/components/ui/card.tsx`, change the root `Card` className:

```tsx
className={cn(
  "rounded-3xl border border-cream-200 bg-white text-card-foreground shadow-card transition-shadow duration-200",
  className
)}
```

Add a `cream` variant via a new prop. Replace the `Card` definition:

```tsx
type CardVariant = 'default' | 'cream' | 'brand'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClass =
    variant === 'cream'
      ? 'bg-cream-100 border-cream-200'
      : variant === 'brand'
      ? 'bg-brand text-white border-transparent'
      : 'bg-white border-cream-200'
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl border text-card-foreground shadow-card transition-shadow duration-200',
        variantClass,
        className,
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"
```

- [ ] **Step 4: Add `chip` and `chipActive` Badge variants**

In `src/components/ui/badge.tsx`, replace `badgeVariants` so the variants block includes:

```ts
variant: {
  default: "border-transparent bg-brand-100 text-brand-700 hover:bg-brand-200",
  secondary: "border-transparent bg-cream-200 text-ink-700 hover:bg-cream-300",
  destructive: "border-transparent bg-rose-100 text-rose-500 hover:bg-rose-100/70",
  outline: "border-cream-300 text-ink-700",
  sage: "border-transparent bg-sage-100 text-sage-700",
  amber: "border-transparent bg-amber-100 text-amber-500",
  chip: "border-transparent bg-cream-100 text-ink-700 px-3 py-1 text-xs",
  chipActive: "border-transparent bg-brand text-white px-3 py-1 text-xs",
  chipBrand: "border-transparent bg-brand-100 text-brand-700 px-3 py-1 text-xs",
},
```

- [ ] **Step 5: Run tests + build**

```bash
cd private-chef/frontend && npm test -- --run 2>&1 | tail -20
npm run build 2>&1 | tail -10
```
Expected: tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/ui/button.tsx \
        private-chef/frontend/src/components/ui/card.tsx \
        private-chef/frontend/src/components/ui/badge.tsx
git commit -m "feat(ui): button pill size, card variants, badge chip styles"
```

---

### Task 3: Upgrade Input/Textarea + add ChipGroup + FloatingBar primitives

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/chip-group.tsx`
- Create: `src/components/ui/floating-bar.tsx`

- [ ] **Step 1: Restyle Input**

In `src/components/ui/input.tsx`, change the className to:

```tsx
className={cn(
  "flex h-12 w-full rounded-2xl border border-cream-300 bg-cream-100/60 px-4 py-2 text-base ring-offset-background placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
  className,
)}
```

- [ ] **Step 2: Restyle Textarea**

In `src/components/ui/textarea.tsx`, change className:

```tsx
className={cn(
  "flex min-h-[88px] w-full rounded-2xl border border-cream-300 bg-cream-100/60 px-4 py-3 text-base ring-offset-background placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
  className,
)}
```

- [ ] **Step 3: Create ChipGroup**

Write `src/components/ui/chip-group.tsx`:

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ChipOption = { value: string; label: string; count?: number }

type Props = {
  options: ChipOption[]
  value: string | string[]
  multiple?: boolean
  onChange: (next: string | string[]) => void
  className?: string
}

export function ChipGroup({ options, value, multiple, onChange, className }: Props) {
  const isActive = (v: string) =>
    multiple ? (value as string[]).includes(v) : value === v

  const handle = (v: string) => {
    if (!multiple) return onChange(v)
    const arr = new Set(value as string[])
    if (arr.has(v)) arr.delete(v)
    else arr.add(v)
    onChange(Array.from(arr))
  }

  return (
    <div
      role="group"
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4',
        className,
      )}
    >
      {options.map((o) => {
        const active = isActive(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => handle(o.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 h-8 text-sm font-medium transition-colors cursor-pointer',
              active
                ? 'bg-brand text-white shadow-button'
                : 'bg-cream-100 text-ink-700 hover:bg-cream-200',
            )}
            aria-pressed={active}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[11px]',
                  active ? 'bg-white/20 text-white' : 'bg-cream-300 text-ink-700',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create FloatingBar**

Write `src/components/ui/floating-bar.tsx`:

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  visible?: boolean
}

export function FloatingBar({ className, visible = true, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px]',
        'transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        className,
      )}
      style={{ bottom: 'var(--app-shell-floating-offset)' }}
      {...rest}
    >
      <div className="rounded-full bg-ink-900 text-white shadow-elevated px-5 py-3 flex items-center justify-between gap-3">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -10 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/ui/input.tsx \
        private-chef/frontend/src/components/ui/textarea.tsx \
        private-chef/frontend/src/components/ui/chip-group.tsx \
        private-chef/frontend/src/components/ui/floating-bar.tsx
git commit -m "feat(ui): cream-tinted inputs, ChipGroup, FloatingBar primitives"
```

---

### Task 4: New domain atoms (StatTile, DishThumb, ImageUploadTile, OrderColorChips, StatusStepBar)

**Files:**
- Create: `src/components/home/StatTile.tsx`
- Create: `src/components/recipe/DishThumb.tsx`
- Create: `src/components/recipe/ImageUploadTile.tsx`
- Create: `src/components/order/OrderColorChips.tsx`
- Create: `src/components/order/StatusStepBar.tsx`
- Create: `src/lib/dish-color.ts`

- [ ] **Step 1: Stable color hash util**

Write `src/lib/dish-color.ts`:

```ts
const DISH_PALETTE = [
  { bg: 'bg-brand-300', text: 'text-white' },
  { bg: 'bg-sage-200', text: 'text-sage-700' },
  { bg: 'bg-mustard-300', text: 'text-ink-900' },
  { bg: 'bg-rust-300', text: 'text-white' },
  { bg: 'bg-cream-300', text: 'text-ink-900' },
  { bg: 'bg-brand-100', text: 'text-brand-700' },
] as const

export function dishColor(seed: string | number | undefined | null) {
  const key = String(seed ?? '')
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return DISH_PALETTE[Math.abs(h) % DISH_PALETTE.length]
}
```

- [ ] **Step 2: StatTile (双格统计)**

Write `src/components/home/StatTile.tsx`:

```tsx
import { cn } from '@/lib/utils'

type Tone = 'cream' | 'sage' | 'mustard'

type Props = {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: Tone
  className?: string
}

const toneClass: Record<Tone, string> = {
  cream: 'bg-cream-100 border-cream-200 text-ink-900',
  sage: 'bg-sage-200 border-sage-200 text-sage-700',
  mustard: 'bg-mustard-300/70 border-mustard-300 text-ink-900',
}

export function StatTile({ label, value, hint, tone = 'cream', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-4 flex flex-col justify-between min-h-[112px]',
        toneClass[tone],
        className,
      )}
    >
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      {hint && <div className="text-[11px] text-ink-500">{hint}</div>}
    </div>
  )
}
```

- [ ] **Step 3: DishThumb (菜品色块)**

Write `src/components/recipe/DishThumb.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { dishColor } from '@/lib/dish-color'

type Props = {
  id?: string | number
  name?: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'lg' | '2xl' | '3xl'
  className?: string
}

const sizeClass = { sm: 'w-12 h-12 text-xs', md: 'w-16 h-16 text-sm', lg: 'w-20 h-20 text-base' }
const roundClass = { lg: 'rounded-lg', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' }

export function DishThumb({ id, name, src, size = 'md', rounded = '2xl', className }: Props) {
  const c = dishColor(id ?? name)
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={cn('object-cover', sizeClass[size], roundClass[rounded], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center font-medium',
        c.bg,
        c.text,
        sizeClass[size],
        roundClass[rounded],
        className,
      )}
      aria-label={name}
    >
      {name?.[0] ?? ''}
    </div>
  )
}
```

- [ ] **Step 4: ImageUploadTile (4 格图片上传)**

Write `src/components/recipe/ImageUploadTile.tsx`:

```tsx
import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  src?: string | null
  progress?: number          // 0-100, undefined when not uploading
  onClick?: () => void
  onRemove?: () => void
  variant?: 'image' | 'empty'
  className?: string
}

export function ImageUploadTile({ src, progress, onClick, onRemove, variant, className }: Props) {
  const isUploading = typeof progress === 'number' && progress < 100
  const hasImage = !!src
  return (
    <div
      className={cn(
        'relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-cream-300 bg-cream-100/60 cursor-pointer',
        hasImage && 'border-solid border-transparent',
        className,
      )}
      onClick={onClick}
      role="button"
    >
      {hasImage && (
        <img src={src ?? undefined} alt="" className="w-full h-full object-cover" />
      )}
      {!hasImage && variant !== 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center text-ink-400">
          <Plus className="w-6 h-6" />
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-x-0 bottom-0 bg-ink-900/70 text-white text-[11px] text-center py-1">
          上传中 {Math.round(progress!)}%
        </div>
      )}
      {hasImage && onRemove && !isUploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-900/70 text-white flex items-center justify-center"
          aria-label="移除"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: OrderColorChips (订单卡里的菜品色块 row)**

Write `src/components/order/OrderColorChips.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { dishColor } from '@/lib/dish-color'

type Item = { id: string | number; name?: string }

type Props = {
  items: Item[]
  max?: number
  className?: string
}

export function OrderColorChips({ items, max = 4, className }: Props) {
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {shown.map((it) => {
        const c = dishColor(it.id ?? it.name)
        return (
          <div
            key={it.id}
            className={cn('w-10 h-10 rounded-2xl', c.bg)}
            aria-label={it.name}
          />
        )
      })}
      {rest > 0 && (
        <div className="w-10 h-10 rounded-2xl bg-cream-200 text-ink-700 text-xs flex items-center justify-center">
          +{rest}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: StatusStepBar (4-step 横向进度)**

Write `src/components/order/StatusStepBar.tsx`:

```tsx
import { cn } from '@/lib/utils'

export type OrderStatus = 'placed' | 'accepted' | 'cooking' | 'done'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: '已下单' },
  { key: 'accepted', label: '已接单' },
  { key: 'cooking', label: '制作中' },
  { key: 'done', label: '已完成' },
]

const ORDER: OrderStatus[] = ['placed', 'accepted', 'cooking', 'done']

type Props = { current: OrderStatus; className?: string }

export function StatusStepBar({ current, className }: Props) {
  const currentIdx = ORDER.indexOf(current)
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      {STEPS.map((s, i) => {
        const reached = i <= currentIdx
        return (
          <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full w-full',
                reached ? 'bg-brand' : 'bg-cream-200',
              )}
            />
            <span className={cn('text-[11px]', reached ? 'text-ink-900 font-medium' : 'text-ink-400')}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7: Build verify**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -10
```

- [ ] **Step 8: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/lib/dish-color.ts \
        private-chef/frontend/src/components/home/StatTile.tsx \
        private-chef/frontend/src/components/recipe/DishThumb.tsx \
        private-chef/frontend/src/components/recipe/ImageUploadTile.tsx \
        private-chef/frontend/src/components/order/OrderColorChips.tsx \
        private-chef/frontend/src/components/order/StatusStepBar.tsx
git commit -m "feat(components): atoms for stats, dish thumbs, image upload, order chips, status bar"
```

---

### Task 5: Rewrite AppLayout + TabBar (4 items, Bento active state)

**Files:**
- Modify: `src/pages/layout/TabBar.tsx`
- Modify: `src/pages/layout/AppLayout.tsx` (only if needed for safe-area / shell color)

- [ ] **Step 1: Replace TabBar**

Overwrite `src/pages/layout/TabBar.tsx` entirely:

```tsx
import { Link, useLocation } from 'react-router'
import { ClipboardList, Home as HomeIcon, User, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { name: '首页', path: '/', match: (p: string) => p === '/', icon: HomeIcon },
  { name: '菜单', path: '/menu', match: (p: string) => p.startsWith('/menu'), icon: UtensilsCrossed },
  { name: '订单', path: '/orders', match: (p: string) => p.startsWith('/orders') || p.startsWith('/order/'), icon: ClipboardList },
  { name: '我', path: '/profile', match: (p: string) => p.startsWith('/profile') || p.startsWith('/favorites') || p.startsWith('/wishes') || p.startsWith('/achievements'), icon: User },
] as const

export function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="app-shell-tabbar pb-safe bg-cream-50/95 backdrop-blur border-t border-cream-200">
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {TABS.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <li key={t.path} className="flex-1">
              <Link
                to={t.path}
                aria-current={active ? 'page' : undefined}
                className="h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-7 rounded-lg transition-colors',
                    active ? 'bg-brand text-white' : 'bg-transparent text-ink-400',
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-none transition-colors',
                    active ? 'text-ink-900 font-semibold' : 'text-ink-400',
                  )}
                >
                  {t.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 2: Sanity check AppLayout**

Open `src/pages/layout/AppLayout.tsx`. If the shell background is hard-coded to anything other than `bg-cream-50` / `bg-background`, change it to `bg-cream-50`. Otherwise leave it.

- [ ] **Step 3: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -10 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/layout/TabBar.tsx private-chef/frontend/src/pages/layout/AppLayout.tsx
git commit -m "feat(layout): TabBar 4 tabs with Bento active state (mockup v1)"
```

---

## Phase 2 — Mockup screens (Tasks 6-11)

### Task 6: Home page (HomeHeroCTA + HomePendingOrderCard + RecentDishRail)

**Files:**
- Modify: `src/pages/home/Home.tsx`
- Create: `src/components/home/HomeHeroCTA.tsx`
- Create: `src/components/home/HomePendingOrderCard.tsx`
- Create: `src/components/home/RecentDishRail.tsx`
- Delete: `src/components/home/HomeShortcuts.tsx`
- Delete: `src/components/home/AchievementStats.tsx`
- Delete: `src/components/home/HomeRecipeRail.tsx` + `HomeRecipeRail.test.tsx`
- **Keep but unimport from Home**: `HomeRecentComments.tsx`, `HomeCommentRow.tsx` (re-used in Profile in Task 12)

- [ ] **Step 1: Read existing Home and its hooks**

```bash
sed -n '1,200p' private-chef/frontend/src/pages/home/Home.tsx
```
Note imports / hook names you need to reuse (e.g., `useHomeSummary`, current order query, recent recipes query). Keep the same data sources.

- [ ] **Step 2: Create HomeHeroCTA**

Write `src/components/home/HomeHeroCTA.tsx`:

```tsx
import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'

export function HomeHeroCTA() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/menu')}
      className="relative w-full overflow-hidden rounded-3xl bg-brand text-white p-5 text-left cursor-pointer shadow-elevated"
    >
      {/* deco circles */}
      <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-white/15" />
      <div className="absolute top-10 -right-2 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-xs text-white/80 mb-2">今晚吃什么</div>
        <div className="font-serif text-3xl leading-tight">
          点单一下，<br />厨房有人接
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white text-brand px-4 h-10 font-medium">
          立即点单 <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 3: Create HomePendingOrderCard**

Write `src/components/home/HomePendingOrderCard.tsx`:

```tsx
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { OrderColorChips } from '@/components/order/OrderColorChips'

type Order = {
  id: string | number
  title: string           // e.g. "晚餐 · 红烧肉 · 清蒸鱼"
  meta: string            // e.g. "爸 点单 · 尚无大厨"
  waitedLabel: string     // e.g. "2 分钟前"
  items: { id: string | number; name?: string }[]
}

type Props = {
  order: Order | null | undefined
  onAccept: (id: string | number) => void
  accepting?: boolean
}

export function HomePendingOrderCard({ order, onAccept, accepting }: Props) {
  const navigate = useNavigate()
  if (!order) return null
  return (
    <section
      className="surface-card p-4 cursor-pointer"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="rounded-full bg-brand-100 text-brand-700 text-xs px-2.5 py-1">等你接单</span>
        <span className="text-xs text-ink-500">{order.waitedLabel}</span>
      </div>
      <div className="font-medium text-ink-900">{order.title}</div>
      <div className="text-xs text-ink-500 mb-3">{order.meta}</div>
      <OrderColorChips items={order.items} className="mb-4" />
      <Button
        type="button"
        variant="inverse"
        className="w-full"
        disabled={accepting}
        onClick={(e) => { e.stopPropagation(); onAccept(order.id) }}
      >
        {accepting ? '处理中…' : '我来接单'}
      </Button>
    </section>
  )
}
```

- [ ] **Step 4: Create RecentDishRail**

Write `src/components/home/RecentDishRail.tsx`:

```tsx
import { Link } from 'react-router'
import { DishThumb } from '@/components/recipe/DishThumb'

type Dish = { id: string | number; name: string; cover?: string | null }

type Props = { dishes: Dish[]; viewAllPath?: string }

export function RecentDishRail({ dishes, viewAllPath = '/menu' }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">最近常做</h2>
        <Link to={viewAllPath} className="text-xs text-brand">全部 →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
        {dishes.map((d) => (
          <Link
            key={d.id}
            to={`/recipe/${d.id}`}
            className="shrink-0 w-20 flex flex-col items-center gap-1.5"
          >
            <DishThumb id={d.id} name={d.name} src={d.cover ?? undefined} size="lg" rounded="2xl" />
            <span className="text-[11px] text-ink-700 line-clamp-1">{d.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Rewrite Home.tsx**

Replace `src/pages/home/Home.tsx` body. Keep the same data hooks (read them from the old file first; the example below assumes `useHomeSummary` returns `{ greeting, role, pendingOrder, weekStats, recentDishes, accept }`):

```tsx
import { useNavigate } from 'react-router'
import { HomeHeroCTA } from '@/components/home/HomeHeroCTA'
import { HomePendingOrderCard } from '@/components/home/HomePendingOrderCard'
import { RecentDishRail } from '@/components/home/RecentDishRail'
import { StatTile } from '@/components/home/StatTile'
import { useHomeSummary } from '@/hooks/useHomeSummary' // adjust to actual hook

export default function Home() {
  const navigate = useNavigate()
  const { greeting, userName, role, pendingOrder, weekStats, recentDishes, accept, accepting } = useHomeSummary()
  return (
    <main className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-500">{greeting} *</div>
          <h1 className="font-serif text-3xl text-ink-900">{userName}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="个人中心"
          className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold cursor-pointer"
        >
          {role === 'chef' ? '厨' : '点'}
        </button>
      </header>

      <HomeHeroCTA />

      <HomePendingOrderCard order={pendingOrder} onAccept={accept} accepting={accepting} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="mustard" label="本周" value={`${weekStats.orders} 单`} hint={`↑ 比上周 +${weekStats.deltaOrders}`} />
        <StatTile tone="sage" label="掌勺" value={`${weekStats.cooked} 次`} hint="本月主厨" />
      </div>

      <RecentDishRail dishes={recentDishes} />
    </main>
  )
}
```

**Adapt the hook import and field names to what already exists.** If `useHomeSummary` doesn't exist, compose from whatever the old `Home.tsx` used (e.g., `useQuery(['home', 'summary'])`) and shape it locally.

- [ ] **Step 6: Delete dead components + tests**

```bash
cd private-chef/frontend
rm src/components/home/HomeShortcuts.tsx \
   src/components/home/AchievementStats.tsx \
   src/components/home/HomeRecipeRail.tsx \
   src/components/home/HomeRecipeRail.test.tsx
```

Also grep & remove any leftover imports of those files in `Home.tsx.bak` if it's imported anywhere (it shouldn't be — leave the .bak file as-is).

```bash
grep -rn "HomeShortcuts\|AchievementStats\|HomeRecipeRail" src/ 2>&1
```
Expected: no results.

- [ ] **Step 7: Build + tests**

```bash
npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -15
```

- [ ] **Step 8: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add -A private-chef/frontend/src/pages/home private-chef/frontend/src/components/home
git commit -m "feat(home): rewrite Home per mockup (hero CTA + pending order + stats + recent dishes)

- delete HomeShortcuts, AchievementStats, HomeRecipeRail (+ its test)
- HomeRecentComments / HomeCommentRow kept (moved to Profile in Task 12)"
```

---

### Task 7: MenuPage (chip filter grid + selection bar)

**Files:**
- Modify: `src/pages/menu/MenuPage.tsx`
- May reuse: existing `MenuPage` data hooks

- [ ] **Step 1: Read existing MenuPage**

```bash
sed -n '1,200p' private-chef/frontend/src/pages/menu/MenuPage.tsx
```

- [ ] **Step 2: Rewrite MenuPage layout**

The new layout. Adapt the data hooks (`useRecipes` / `useMenuSelection` / whatever exists) to populate `recipes` and `selectedIds`:

```tsx
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ChipGroup } from '@/components/ui/chip-group'
import { FloatingBar } from '@/components/ui/floating-bar'
import { DishThumb } from '@/components/recipe/DishThumb'
import { Button } from '@/components/ui/button'
import { RecipeSheet } from '@/components/recipe/RecipeSheet'  // upgraded in Task 8

const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'home', label: '家常' },
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'soup', label: '汤' },
]

export default function MenuPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)

  // TODO replace with actual data hook
  const recipes = useRecipes({ q, category: cat })

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <main className="space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-ink-900">菜单</h1>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-cream-50 h-9 px-3.5 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新菜
        </button>
      </header>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input
          placeholder="搜菜名 / 食材"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>

      <ChipGroup options={CATEGORIES} value={cat} onChange={(v) => setCat(v as string)} />

      <div className="grid grid-cols-2 gap-3">
        {recipes.map((r) => (
          <div key={r.id} className="surface-card overflow-hidden">
            <Link to={`/recipe/${r.id}`} className="block aspect-square">
              <DishThumb id={r.id} name={r.name} src={r.cover ?? undefined} className="w-full h-full" rounded="lg" />
            </Link>
            <div className="p-3 flex items-end justify-between">
              <div>
                <div className="font-medium text-ink-900 line-clamp-1">{r.name}</div>
                <div className="text-[11px] text-ink-500">{r.timesCooked} 次 · {r.durationMin}min</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(String(r.id))}
                aria-pressed={selected.has(String(r.id))}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors',
                  selected.has(String(r.id)) ? 'bg-ink-900 text-white' : 'bg-brand text-white',
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <FloatingBar visible={selected.size > 0}>
        <span className="text-sm">
          已选 <span className="inline-flex items-center justify-center rounded-full bg-brand min-w-[22px] h-5 px-1.5 text-xs mx-1">{selected.size}</span>
        </span>
        <button
          type="button"
          onClick={() => navigate(`/order/create?ids=${Array.from(selected).join(',')}`)}
          className="rounded-full bg-white text-ink-900 h-9 px-4 text-sm font-medium cursor-pointer"
        >
          提交点单 →
        </button>
      </FloatingBar>

      <RecipeSheet open={sheetOpen} onOpenChange={setSheetOpen} mode="continuous" />
    </main>
  )
}
```

Add `import { cn } from '@/lib/utils'` at the top.

- [ ] **Step 3: Adapt data hook**

Replace `useRecipes({ q, category })` with whatever the current MenuPage actually uses. If the existing hook returns a different shape, map fields inline.

- [ ] **Step 4: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/menu/MenuPage.tsx
git commit -m "feat(menu): mockup v1 layout (chip filter, 2-col Bento grid, selection FloatingBar)"
```

---

### Task 8: RecipeForm BottomSheet (continuous entry mode)

**Files:**
- Modify: `src/components/recipe/RecipeSheet.tsx` (mount + size adjustments)
- Modify: `src/components/recipe/RecipeFormCore.tsx` (visual restyle + emit `onSubmitted` for continuous mode)
- Modify: `src/components/recipe/RecipeSheet.test.tsx` (update assertions if shape changed)

- [ ] **Step 1: Read existing implementation**

```bash
sed -n '1,300p' private-chef/frontend/src/components/recipe/RecipeSheet.tsx
sed -n '1,300p' private-chef/frontend/src/components/recipe/RecipeFormCore.tsx
```

- [ ] **Step 2: Restyle RecipeSheet shell**

Ensure the sheet:
- Opens from bottom, full-width, `rounded-t-[32px]`
- Has grab handle: `<div className="mx-auto w-10 h-1.5 rounded-full bg-cream-300 mt-2" />`
- Header row: `"连续录入模式 / 新增菜品 / X"` — small left tag + big title + close button
- Footer: pill button `创建并继续 →` + collapse chevron (only chevron when not in continuous mode)
- Accepts `mode: 'single' | 'continuous'` prop; in continuous mode, on successful submit reset form, keep open, focus first input

If the existing component already follows the Radix Sheet from `@/components/ui/sheet`, just swap classes and add `mode` prop. Keep the existing API for non-menu callers.

- [ ] **Step 3: Restyle RecipeFormCore**

Inside the form, structure per mockup:

```
- "菜名" label + Input
- "图片" label + 4-col grid of ImageUploadTile (use the new component from Task 4)
- "描述" label + Textarea
- 2-col: 时长 / 份数 (Input)
- "标签" ChipGroup multiple + "+ 添加" button
```

All labels use `<label className="text-sm text-ink-700">`. Use `ImageUploadTile` for the 4 slots. Keep existing upload + form-submit logic.

The submit button at the bottom uses `<Button variant="default" size="pill" className="w-full">创建并继续 →</Button>` when `mode === 'continuous'`, otherwise the existing copy.

After successful mutation in continuous mode, call `form.reset({ tags: form.getValues('tags') })` (preserve user-selected tags per mockup hint "提交后标签保留") and focus name input.

- [ ] **Step 4: Wire sheet from MenuPage**

Task 7 already mounts `<RecipeSheet open={sheetOpen} ... mode="continuous" />`. Confirm `RecipeSheet` props are `{ open, onOpenChange, mode? }`.

- [ ] **Step 5: Run existing recipe sheet test**

```bash
cd private-chef/frontend && npm test -- --run src/components/recipe/RecipeSheet.test.tsx 2>&1 | tail -30
```
Fix breakages — update assertions to match new structure but preserve semantic intent (sheet opens / closes / submits).

- [ ] **Step 6: Full build + tests**

```bash
npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -15
```

- [ ] **Step 7: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/RecipeSheet.tsx \
        private-chef/frontend/src/components/recipe/RecipeFormCore.tsx \
        private-chef/frontend/src/components/recipe/RecipeSheet.test.tsx
git commit -m "feat(recipe): RecipeSheet continuous-entry bottom sheet matching mockup v1"
```

---

### Task 9: RecipeDetail (hero + steps + fixed action bar)

**Files:**
- Modify: `src/pages/recipe/RecipeDetail.tsx`
- May modify: `src/components/recipe/IngredientStep.tsx`, `src/components/recipe/StepEditor.tsx` if shared

- [ ] **Step 1: Read existing page**

```bash
sed -n '1,300p' private-chef/frontend/src/pages/recipe/RecipeDetail.tsx
```

- [ ] **Step 2: Rewrite page structure**

Replace the page body:

```tsx
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Plus, Heart, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishThumb } from '@/components/recipe/DishThumb'
import { useRecipe } from '@/hooks/useRecipe' // keep existing

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recipe, addToCart } = useRecipe(id!)
  if (!recipe) return null
  return (
    <div className="-mx-4 -mt-[var(--app-shell-top-padding)] pb-32">
      {/* Hero */}
      <div className="relative bg-brand aspect-[3/4] flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 text-ink-900 flex items-center justify-center cursor-pointer"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/90 text-ink-900 flex items-center justify-center cursor-pointer"
          aria-label="新增"
          onClick={() => navigate(`/recipe/${id}/edit`)}
        >
          <Plus className="w-5 h-5" />
        </button>
        {recipe.cover ? (
          <img src={recipe.cover} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <DishThumb id={recipe.id} name={recipe.name} size="lg" className="w-32 h-32" />
        )}
        {/* pagination dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-2 h-2 rounded-full bg-white/90" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Content card overlapping hero */}
      <div className="relative -mt-8 mx-4 surface-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <span className="rounded-full bg-cream-100 px-2.5 py-1">家常</span>
            <span>·</span>
            <span>晚餐</span>
          </div>
          <button
            type="button"
            aria-label="收藏"
            className="w-8 h-8 rounded-full bg-cream-100 text-brand flex items-center justify-center"
          >
            <Heart className={recipe.favorited ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
          </button>
        </div>
        <h1 className="font-serif text-3xl text-ink-900">{recipe.name}</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-cream-100 px-2.5 py-1">⏱ {recipe.durationMin} 分钟</span>
          <span className="rounded-full bg-cream-100 px-2.5 py-1">{recipe.servings} 人份</span>
          <span className="rounded-full bg-cream-100 px-2.5 py-1">已做 {recipe.timesCooked} 次</span>
        </div>
        <p className="font-serif text-sm text-ink-700 leading-relaxed">{recipe.description}</p>
      </div>

      {/* Steps */}
      <div className="mx-4 mt-5">
        <h2 className="text-sm text-ink-500 mb-3">步骤</h2>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={s.id ?? i} className="surface-card p-4 flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand text-white text-sm flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <p className="text-sm text-ink-900 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[28rem] px-4 pb-safe pt-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={() => navigate(`/recipe/${id}/edit`)}
        >
          <Pencil className="w-4 h-4 mr-1" /> 编辑
        </Button>
        <Button variant="default" size="pill" className="flex-1" onClick={addToCart}>
          + 加入点单
        </Button>
      </div>
    </div>
  )
}
```

Adapt the hook + fields to actual schema. If `recipe.steps[i]` uses different field names, map them.

- [ ] **Step 3: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/recipe/RecipeDetail.tsx
git commit -m "feat(recipe): RecipeDetail hero + steps + fixed action bar per mockup v1"
```

---

### Task 10: OrderList (tabs with badges + color-chip cards)

**Files:**
- Modify: `src/pages/order/OrderList.tsx`
- Modify: `src/components/order/OrderCard.tsx`

- [ ] **Step 1: Read existing files**

```bash
sed -n '1,200p' private-chef/frontend/src/pages/order/OrderList.tsx
sed -n '1,200p' private-chef/frontend/src/components/order/OrderCard.tsx
```

- [ ] **Step 2: Rewrite OrderCard**

Replace `src/components/order/OrderCard.tsx` body:

```tsx
import { useNavigate } from 'react-router'
import { OrderColorChips } from './OrderColorChips'
import { Button } from '@/components/ui/button'

export type OrderCardData = {
  id: string | number
  no: string                              // "晚餐 #128"
  meta: string                            // "爸·点单 · 尚无大厨"
  agoLabel: string                        // "2 分钟前"
  status: 'pending' | 'cooking' | 'done'  // controls chip + cta
  items: { id: string | number; name?: string }[]
  primaryActionLabel?: string             // overrides default
  onPrimary?: () => void
  primaryDisabled?: boolean
}

const STATUS_CHIP: Record<OrderCardData['status'], { label: string; cls: string }> = {
  pending: { label: '等你接单', cls: 'bg-brand-100 text-brand-700' },
  cooking: { label: '制作中', cls: 'bg-mustard-100 text-mustard-700' },
  done:    { label: '已完成', cls: 'bg-sage-100 text-sage-700' },
}

export function OrderCard(props: OrderCardData) {
  const navigate = useNavigate()
  const chip = STATUS_CHIP[props.status]
  const defaultLabel =
    props.status === 'pending' ? '我来接单'
      : props.status === 'cooking' ? '出锅完成 ✓'
      : '已完成'
  const label = props.primaryActionLabel ?? defaultLabel
  return (
    <article
      className="surface-card p-4 cursor-pointer"
      onClick={() => navigate(`/orders/${props.id}`)}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full text-xs px-2.5 py-1 ${chip.cls}`}>{chip.label}</span>
        <span className="text-xs text-ink-500">{props.agoLabel}</span>
      </div>
      <div className="mt-2 font-medium text-ink-900">{props.no}</div>
      <div className="text-xs text-ink-500 mb-3">{props.meta}</div>
      <OrderColorChips items={props.items} className="mb-4" />
      {props.status !== 'done' ? (
        <Button
          variant={props.status === 'pending' ? 'inverse' : 'default'}
          size="lg"
          className="w-full"
          disabled={props.primaryDisabled}
          onClick={(e) => { e.stopPropagation(); props.onPrimary?.() }}
        >
          {label}
        </Button>
      ) : (
        <div className="rounded-full bg-cream-100 text-ink-500 h-11 flex items-center justify-center text-sm">
          {label}
        </div>
      )}
    </article>
  )
}
```

- [ ] **Step 3: Rewrite OrderList page**

```tsx
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrderCard } from '@/components/order/OrderCard'
import { useOrders } from '@/hooks/useOrders' // keep existing

const TABS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待接单' },
  { value: 'cooking', label: '制作中' },
  { value: 'done', label: '已完成' },
] as const

export default function OrderList() {
  const [tab, setTab] = useState<typeof TABS[number]['value']>('all')
  const { groups, counts, accept, finish, accepting, finishing } = useOrders()
  // groups: Record<'all'|'pending'|'cooking'|'done', OrderCardData[]>

  return (
    <main className="space-y-4 pb-20">
      <header><h1 className="font-serif text-3xl text-ink-900">订单</h1></header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as never)}>
        <TabsList className="bg-transparent p-0 gap-2 overflow-x-auto -mx-4 px-4 justify-start">
          {TABS.map((t) => {
            const active = tab === t.value
            const count = counts[t.value]
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={`rounded-full h-9 px-3.5 text-sm data-[state=active]:bg-ink-900 data-[state=active]:text-white data-[state=active]:shadow-none bg-cream-100 text-ink-700 cursor-pointer`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-ink-900 text-white'}`}>
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="space-y-3 mt-4">
            {groups[t.value].map((o) => (
              <OrderCard
                key={o.id}
                {...o}
                primaryDisabled={o.status === 'pending' ? accepting : finishing}
                onPrimary={() => (o.status === 'pending' ? accept(o.id) : finish(o.id))}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
```

Adapt `useOrders` to whatever exists. If grouping/counts aren't there, derive locally from a flat list.

- [ ] **Step 4: Update OrderCard.test if it exists**

```bash
cd private-chef/frontend && npm test -- --run src/components/order/OrderCard.test.tsx 2>&1 | tail -30
```
Adjust assertions to new props.

- [ ] **Step 5: Build + tests**

```bash
npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -15
```

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/order/OrderList.tsx \
        private-chef/frontend/src/components/order/OrderCard.tsx \
        private-chef/frontend/src/components/order/OrderCard.test.tsx
git commit -m "feat(order): OrderList tabs + color-chip OrderCard per mockup v1"
```

---

### Task 11: OrderDetailV2 (status hero + dishes + notes)

**Files:**
- Modify: `src/pages/order/OrderDetailV2.tsx`
- Modify: `src/components/order/OrderStatusTimeline.tsx` (replace with StatusStepBar usage; keep test alignment)

- [ ] **Step 1: Read existing files**

```bash
sed -n '1,300p' private-chef/frontend/src/pages/order/OrderDetailV2.tsx
sed -n '1,200p' private-chef/frontend/src/components/order/OrderStatusTimeline.tsx
```

- [ ] **Step 2: Decide on timeline**

Use the new `StatusStepBar` from Task 4 inside the page. Either:
- Keep `OrderStatusTimeline.tsx` for back-compat and ignore it here, or
- Delete it after confirming no other importer.

```bash
grep -rn "OrderStatusTimeline" private-chef/frontend/src 2>&1
```
If only this page uses it, delete the file and its test.

- [ ] **Step 3: Rewrite OrderDetailV2 body**

```tsx
import { useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusStepBar } from '@/components/order/StatusStepBar'
import { DishThumb } from '@/components/recipe/DishThumb'
import { useOrder } from '@/hooks/useOrder'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function OrderDetailV2() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { order, primaryAction, addNote, primaryLabel, primaryLoading } = useOrder(id!)
  const [note, setNote] = useState('')
  if (!order) return null

  return (
    <main className="space-y-4 pb-28">
      <header className="flex items-center gap-3 -mt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-ink-700" />
        </button>
        <div>
          <div className="font-serif text-xl text-ink-900">{order.title}</div>
          <div className="text-xs text-ink-500">{order.metaLine}</div>
        </div>
      </header>

      {/* Status hero */}
      <section className="rounded-3xl bg-brand-100 border border-brand-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-500">订单状态</span>
          <span className="rounded-full bg-brand text-white text-xs px-2.5 py-1">{order.statusLabel}</span>
        </div>
        <h2 className="font-serif text-3xl text-brand">{order.statusHeadline}</h2>
        <StatusStepBar current={order.status} />
        <Button variant="inverse" size="pill" className="w-full" onClick={primaryAction} disabled={primaryLoading}>
          {primaryLabel}
        </Button>
      </section>

      {/* Dishes */}
      <section className="surface-card p-4">
        <div className="text-sm text-ink-500 mb-3">{order.items.length} 道菜</div>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3">
              <DishThumb id={it.recipeId ?? it.id} name={it.name} src={it.cover} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink-900 truncate">{it.name}</div>
                <div className="text-[11px] text-ink-500">{it.durationMin} min · {it.category ?? '家常'}</div>
              </div>
              <div className="text-xs text-ink-500">× {it.quantity}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Notes */}
      <section className="surface-card p-4">
        <div className="text-sm text-ink-500 mb-3">备注 {order.notes.length} 条</div>
        <ul className="space-y-3">
          {order.notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">{n.authorInitial}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs text-ink-500">
                  <span className="rounded-full bg-cream-100 px-2 py-0.5 mr-1">{n.authorName}</span>
                  <span>{n.relativeTime}</span>
                </div>
                <div className="text-sm text-ink-900 mt-1">{n.text}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bottom note input */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[28rem] px-4 pb-safe pt-3 bg-cream-50/95 backdrop-blur border-t border-cream-200 flex items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="加条备注…"
          className="flex-1 h-11 rounded-full bg-cream-100 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={() => { if (note.trim()) { addNote(note.trim()); setNote('') } }}
          className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer"
          aria-label="发送备注"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </main>
  )
}
```

Adapt `useOrder` shape. If existing returns different field names, map them.

- [ ] **Step 4: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add -A private-chef/frontend/src/pages/order private-chef/frontend/src/components/order
git commit -m "feat(order): OrderDetailV2 status hero + dishes + notes per mockup v1"
```

---

## Phase 3 — Non-mockup pages (Tasks 12-18)

### Task 12: Profile page (Bento entries + recent notes)

**Files:**
- Modify: `src/pages/profile/Profile.tsx`
- Reuse: `src/components/home/HomeRecentComments.tsx` (now lives under home/ but rendered on Profile)

- [ ] **Step 1: Rewrite Profile.tsx**

```tsx
import { Link, useNavigate } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatTile } from '@/components/home/StatTile'
import { HomeRecentComments } from '@/components/home/HomeRecentComments'
import { Heart, ListChecks, Trophy, Share2, LogOut, ChevronRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile' // keep existing

const LINKS = [
  { to: '/favorites', label: '收藏', icon: Heart },
  { to: '/wishes', label: '心愿单', icon: ListChecks },
  { to: '/achievements', label: '成就', icon: Trophy },
  { to: '/share', label: '分享空间', icon: Share2 },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, stats, signOut } = useProfile()
  return (
    <main className="space-y-5 pb-20">
      <header className="surface-card p-4 flex items-center gap-3">
        <Avatar className="w-14 h-14">
          <AvatarFallback className="bg-brand-100 text-brand-700 text-lg">{user.initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-serif text-lg text-ink-900">{user.name}</div>
          <div className="text-xs text-ink-500">
            <span className="rounded-full bg-cream-100 px-2 py-0.5 mr-1">{user.roleLabel}</span>
            {user.subtitle}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile tone="cream" label="累计点单" value={stats.orders} />
        <StatTile tone="mustard" label="累计掌勺" value={stats.cooked} />
        <StatTile tone="sage" label="待接单" value={stats.pending} />
        <StatTile tone="cream" label="收藏" value={stats.favorites} />
      </div>

      <section className="grid grid-cols-2 gap-3">
        {LINKS.map((l) => {
          const Icon = l.icon
          return (
            <Link key={l.to} to={l.to} className="surface-card p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-brand" />
                <span className="text-sm text-ink-900">{l.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400" />
            </Link>
          )
        })}
      </section>

      <HomeRecentComments />

      <button
        type="button"
        onClick={signOut}
        className="w-full surface-card p-4 flex items-center justify-center gap-2 text-rose-500 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> 退出登录
      </button>
    </main>
  )
}
```

- [ ] **Step 2: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/profile/Profile.tsx
git commit -m "feat(profile): Bento entries (favorites/wishes/achievements/share) + recent notes"
```

---

### Task 13: Login + Register restyle

**Files:**
- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Register.tsx`

- [ ] **Step 1: Login layout**

Replace return body (keep existing form logic + handlers):

```tsx
return (
  <div className="min-h-dvh bg-cream-50 flex items-center justify-center p-6">
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-brand text-white flex items-center justify-center font-serif text-2xl">厨</div>
        <h1 className="font-serif text-3xl text-ink-900">COOK · 私厨</h1>
        <p className="text-xs text-ink-500">点单一下，厨房有人接</p>
      </div>
      <div className="surface-card p-6 space-y-4">
        {/* existing form fields, rewrapped with Input from ui/input */}
      </div>
      <Button variant="default" size="pill" className="w-full" onClick={onSubmit} disabled={loading}>
        {loading ? '登录中…' : '登录'}
      </Button>
      <p className="text-center text-xs text-ink-500">
        没有账号？<Link to="/register" className="text-brand">注册</Link>
      </p>
    </div>
  </div>
)
```

- [ ] **Step 2: Register layout**

Mirror Login layout, swapping copy ("立即注册" / link back to login).

- [ ] **Step 3: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/auth/Login.tsx private-chef/frontend/src/pages/auth/Register.tsx
git commit -m "feat(auth): restyle Login/Register with cream/brand tokens"
```

---

### Task 14: Favorites — apply Bento cards

**Files:**
- Modify: `src/pages/favorites/Favorites.tsx`

- [ ] **Step 1: Restyle**

Keep data flow. Wrap header in `font-serif text-3xl`. Replace any list/card with `surface-card` and `DishThumb`. 2-col grid like MenuPage if appropriate, otherwise vertical list of `surface-card`.

- [ ] **Step 2: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -10 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/favorites/Favorites.tsx
git commit -m "feat(favorites): apply mockup v1 tokens + Bento cards"
```

---

### Task 15: WishList — apply Bento cards

**Files:**
- Modify: `src/pages/wish/WishList.tsx`

- [ ] **Step 1: Restyle** — same approach as Task 14, using `surface-card` and brand chips for status.
- [ ] **Step 2: Build + tests** — same commands.
- [ ] **Step 3: Commit**

```bash
git add private-chef/frontend/src/pages/wish/WishList.tsx
git commit -m "feat(wish): apply mockup v1 tokens + Bento cards"
```

---

### Task 16: Achievements — apply Bento cards

**Files:**
- Modify: `src/pages/achievements/Achievements.tsx`

- [ ] **Step 1: Restyle** — use `StatTile` from Task 4 for headline stats; achievements list as `surface-card` rows with `DishThumb`-style color badges for category.
- [ ] **Step 2: Build + tests** — same.
- [ ] **Step 3: Commit**

```bash
git add private-chef/frontend/src/pages/achievements/Achievements.tsx
git commit -m "feat(achievements): apply mockup v1 tokens + StatTile"
```

---

### Task 17: OrderCreate (simplified, ids query)

**Files:**
- Modify: `src/pages/order/OrderCreate.tsx`

- [ ] **Step 1: Read existing flow**

```bash
sed -n '1,200p' private-chef/frontend/src/pages/order/OrderCreate.tsx
```

- [ ] **Step 2: Restyle + simplify**

Use `surface-card` for the dish list, brand pill button for "确认下单". Remove any 4-tile shortcut UI if present. Accept `?ids=` query to prefill selection (already established by MenuPage in Task 7).

- [ ] **Step 3: Build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -10 && npm test -- --run 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add private-chef/frontend/src/pages/order/OrderCreate.tsx
git commit -m "feat(order): OrderCreate restyle + accept ?ids= query from menu selection"
```

---

### Task 18: PublicSharePage — apply tokens

**Files:**
- Modify: `src/pages/share/PublicSharePage.tsx`

- [ ] **Step 1: Restyle** — cream background, surface-card content blocks, font-serif headings. Keep all share/auth logic untouched.
- [ ] **Step 2: Build + tests** — same.
- [ ] **Step 3: Commit**

```bash
git add private-chef/frontend/src/pages/share/PublicSharePage.tsx
git commit -m "feat(share): apply mockup v1 tokens to public share page"
```

---

## Phase 4 — Verification (Task 19)

### Task 19: Dev preview + pixel diff against mockup + fixes

**Files:** any file needing touch-up.

- [ ] **Step 1: Boot dev preview**

Use the preview tool:

```
mcp__Claude_Preview__preview_start
  cwd: private-chef/frontend
  command: npm run dev
```

Wait for "ready in" log line; capture URL (typically `http://localhost:5173/`).

- [ ] **Step 2: Authenticate (if Login required)**

If routes redirect to `/login`, use `preview_fill` + `preview_click` to sign in with a test account, or set localStorage tokens via `preview_eval` if there's a stub.

- [ ] **Step 3: Per-screen visual diff**

For each of `/`, `/menu`, menu sheet open, `/recipe/1`, `/orders`, `/orders/1`:
- `preview_resize` to 375×812
- `preview_screenshot`
- Compare to mockup
- Note deltas (spacing, color, radius, font weight)
- Open source, fix, save — Vite HMR reloads
- Re-screenshot to confirm

- [ ] **Step 4: Sweep non-mockup pages**

Walk `/profile`, `/favorites`, `/wishes`, `/achievements`, `/order/create`, `/login`, `/register`. Confirm token consistency (no stray hex / wrong radius / wrong font).

- [ ] **Step 5: Final build + tests**

```bash
cd private-chef/frontend && npm run build 2>&1 | tail -15 && npm test -- --run 2>&1 | tail -15
```

- [ ] **Step 6: Commit all touch-ups**

```bash
cd /Users/weilan/ali/ai/cook
git add -A private-chef/frontend/src
git commit -m "fix(ui): pixel touch-ups after dev preview vs mockup v1"
```

- [ ] **Step 7: Stop preview**

```
mcp__Claude_Preview__preview_stop
```

---

## Self-Review

- **Spec coverage:** Each spec section maps to a task — tokens§2 → Task 1, components§3 → Tasks 2-4, pages§4 → Tasks 6-11, non-mockup§5 → Tasks 12-18, routing§6 → embedded in Tasks 6/7/17, verification§8 → Task 19. ✓
- **Type consistency:** `OrderStatus = 'placed'|'accepted'|'cooking'|'done'` (StatusStepBar) vs `OrderCardData.status = 'pending'|'cooking'|'done'` (OrderCard) — intentional: list page uses 3-state simplification while detail step bar uses 4 stages. Mapping happens in the data hook (`pending → placed/accepted` depending on whether anyone accepted). Document this in `useOrders` adapter.
- **Placeholders:** Tasks 14/15/16/17/18 say "same approach" — that's a deliberate reference back to Task 14's restyle pattern (surface-card + DishThumb + font-serif headings), not a placeholder. The code primitives are fully specified in Tasks 2-4.
- **Hook names:** `useHomeSummary`, `useRecipes`, `useRecipe`, `useOrders`, `useOrder`, `useProfile` are **placeholders for whatever the existing pages use**. Each task's "read existing" step covers this — adapt names, don't invent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-ui-rewrite.md`.

**Two execution options:**

1. **Subagent-driven** — fresh subagent per task with review between tasks (recommended for visual fidelity; each task gets clean context)
2. **Inline execution** — execute in this session with batch checkpoints

Which approach?
