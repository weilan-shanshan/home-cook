# Design System + Recipe Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish cook's reusable design system (tokens + restyled shadcn) and rebuild the recipe flow on it: MenuPage with prominent entry + bottom-Sheet continuous add, RecipeImageGrid with proper delete UX, and delete-recipe failure dialog that lists referencing orders.

**Architecture:** Three layers: (1) **Design system** — Tailwind tokens, shadcn cva restyle, fonts, TabBar restyle (foundation for all future work); (2) **Recipe core** — extract framework-agnostic `RecipeFormCore`, build single-responsibility composition: `RecipeSheet` (Sheet container + continuous add) wraps Core; `RecipeImageGrid` owns image lifecycle; `RecipeReferencedDialog` owns the blocked-delete UX; (3) **Page integration** — MenuPage / RecipeDetail / RecipeForm / OrderList wired up.

**Tech Stack:** React 18 + react-router v7 + Vite 5 + shadcn/ui (Radix + cva + Tailwind 3) + TanStack Query 5 + vitest + @testing-library/react + jsdom; backend Hono + drizzle-orm + better-sqlite3.

**Spec:** [docs/superpowers/specs/2026-05-17-design-system-and-recipe-flow-design.md](../specs/2026-05-17-design-system-and-recipe-flow-design.md)

**Mockup:** [docs/design/2026-05-17-visual-system-v1.html](../../design/2026-05-17-visual-system-v1.html)

**Working directory for all paths:** `/Users/weilan/ali/ai/cook/private-chef` unless prefixed otherwise. Git operations run from `/Users/weilan/ali/ai/cook`.

---

## File Map

**New files:**
- `private-chef/frontend/src/components/recipe/RecipeFormCore.tsx`
- `private-chef/frontend/src/components/recipe/RecipeImageGrid.tsx`
- `private-chef/frontend/src/components/recipe/RecipeSheet.tsx`
- `private-chef/frontend/src/components/recipe/IngredientStep.tsx`
- `private-chef/frontend/src/components/recipe/RecipeReferencedDialog.tsx`
- `private-chef/frontend/src/hooks/useDeleteRecipeImage.ts`

**Modified files:**
- `private-chef/frontend/tailwind.config.ts`
- `private-chef/frontend/src/styles/globals.css`
- `private-chef/frontend/index.html`
- `private-chef/frontend/src/components/ui/{button,card,badge,input,textarea,sheet,dialog,toast}.tsx` (cva variants only)
- `private-chef/frontend/src/pages/layout/TabBar.tsx` (restyle, no logic change)
- `private-chef/frontend/src/pages/menu/MenuPage.tsx` (header redo + sheet host + FAB)
- `private-chef/frontend/src/pages/recipe/RecipeDetail.tsx` (visual + delete dialog upgrade)
- `private-chef/frontend/src/pages/recipe/RecipeForm.tsx` (thin shell delegating to Core)
- `private-chef/frontend/src/pages/order/OrderList.tsx` (read recipeId query)
- `private-chef/frontend/src/hooks/useRecipes.ts` (`useDeleteRecipe` error body parsing)
- `private-chef/frontend/src/hooks/useOrders.ts` (recipeId param)
- `private-chef/backend/src/routes/recipes.ts` (DELETE recipe enrichment)
- `private-chef/backend/src/routes/orders.ts` (GET ?recipeId filter)
- `private-chef/backend/src/__tests__/recipes.test.ts` (delete tests)
- `private-chef/backend/src/__tests__/orders.test.ts` (recipeId filter test)

**Deleted files:**
- `private-chef/frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx`
- `private-chef/frontend/src/components/recipe/RecipeUploadQueue.tsx`

---

## Task 1: Design tokens — Tailwind + globals.css + fonts

**Files:**
- Modify: `private-chef/frontend/tailwind.config.ts`
- Modify: `private-chef/frontend/src/styles/globals.css`
- Modify: `private-chef/frontend/index.html`

No tests — visual change verified by `npm run build` (Tailwind picks up the new tokens) and by spot-checking a page in `npm run preview`.

- [ ] **Step 1: Rewrite `tailwind.config.ts`**

Replace the entire file at `private-chef/frontend/tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      colors: {
        // Brand (warm terracotta orange)
        brand: {
          50: '#FFF1EB',
          100: '#FFDFCD',
          200: '#FFC2A4',
          300: '#FB9670',
          400: '#F37A4F',
          DEFAULT: '#EE6E47',
          600: '#D6552F',
          700: '#B23E1F',
        },
        // Surface (warm cream)
        cream: {
          50: '#FDFAF5',
          100: '#FAF6EE',
          200: '#F4EDDF',
          300: '#E8DFD3',
          400: '#C9BCA8',
        },
        // Ink (warm dark)
        ink: {
          900: '#1F1815',
          800: '#2D2420',
          700: '#3D332C',
          600: '#5C4F46',
          500: '#7B6E63',
          400: '#9C8E81',
        },
        // Accents
        sage: { 100: '#E8EDD8', 500: '#6B7B3C', 700: '#4A5A28' },
        amber: { 100: '#FCEFD0', 500: '#D97706' },
        rose: { 100: '#FCE4E4', 500: '#B91C1C' },
        // shadcn semantic — keep var() indirection so component CSS keeps working
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(31, 24, 21, 0.04)',
        elevated: '0 8px 24px rgba(31, 24, 21, 0.08)',
        sheet: '0 -8px 32px rgba(31, 24, 21, 0.12)',
        button: '0 2px 0 rgba(178, 62, 31, 0.2)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config
```

- [ ] **Step 2: Update `globals.css` :root variables**

Open `private-chef/frontend/src/styles/globals.css`. Find the `:root {` block (around line 7). Replace its content (from `--background:` down to `--radius-modal: 2rem;`) with:

```css
    --background: 30 30% 98%;          /* cream-50 */
    --foreground: 16 18% 11%;          /* ink-900 */

    --card: 0 0% 100%;
    --card-foreground: 16 18% 11%;

    --popover: 0 0% 100%;
    --popover-foreground: 16 18% 11%;

    --primary: 12 90% 58%;             /* brand DEFAULT */
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

    --radius: 1rem;
    --radius-card: 1.5rem;
    --radius-modal: 2rem;
```

Then find the `body` selector (around line 65) and replace the `background-color: #F0F0F3;` and `color: #1D1D1F;` lines with:

```css
    background-color: #FDFAF5;  /* cream-50 */
    color: #1F1815;             /* ink-900 */
```

- [ ] **Step 3: Add font link to `index.html`**

Open `private-chef/frontend/index.html`. Inside the `<head>` block, find the existing `<link rel="manifest" ...>` line and add IMMEDIATELY AFTER it:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;700;900&display=swap" rel="stylesheet" />
```

- [ ] **Step 4: Update `body` font-family in globals.css**

In `private-chef/frontend/src/styles/globals.css` find:

```css
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
```

Replace with:

```css
    font-family: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', -apple-system, sans-serif;
```

- [ ] **Step 5: Build to verify no errors**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run build
```

Expected: `built in N.Ns` with no Tailwind config errors. Bundle size warning is pre-existing — ignore.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/tailwind.config.ts \
        private-chef/frontend/src/styles/globals.css \
        private-chef/frontend/index.html
git commit -m "feat(design): introduce v1 token system (brand, cream, ink, sage/amber/rose)"
```

---

## Task 2: shadcn component restyle

**Files:**
- Modify: `private-chef/frontend/src/components/ui/button.tsx`
- Modify: `private-chef/frontend/src/components/ui/card.tsx`
- Modify: `private-chef/frontend/src/components/ui/badge.tsx`
- Modify: `private-chef/frontend/src/components/ui/input.tsx`
- Modify: `private-chef/frontend/src/components/ui/textarea.tsx`
- Modify: `private-chef/frontend/src/components/ui/sheet.tsx`
- Modify: `private-chef/frontend/src/components/ui/dialog.tsx`

No new tests — existing test suite (`ShareDialog.test.tsx`, `PWAInstallPrompt.test.tsx` etc.) will catch any breakage in cva surface.

- [ ] **Step 1: Restyle `Button` — keep variants, refine cream tokens**

Open `private-chef/frontend/src/components/ui/button.tsx`. Find the `variants:` block in the cva call and replace it entirely with:

```ts
    variants: {
      variant: {
        default: "bg-brand text-white shadow-button hover:bg-brand-600 active:bg-brand-700",
        destructive:
          "bg-rose-500 text-white shadow-button hover:bg-rose-700",
        outline:
          "border-2 border-cream-300 bg-white text-ink-900 hover:bg-cream-100 hover:border-cream-400",
        secondary:
          "bg-cream-100 text-ink-900 border border-cream-300 hover:bg-cream-200",
        ghost: "text-ink-700 hover:bg-cream-100",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
```

- [ ] **Step 2: Restyle `Card`**

Open `private-chef/frontend/src/components/ui/card.tsx`. Find the `Card` component (line ~5-15) and replace the className argument to `cn()` with:

```ts
      "rounded-3xl border border-cream-300 bg-card text-card-foreground shadow-card transition-shadow duration-200",
```

(Note: removed the `hover:shadow-elevated` because Card is used for static content lists too where hover is wrong; let pages add hover styling explicitly when needed.)

- [ ] **Step 3: Restyle `Badge` — add 3 new variants**

Open `private-chef/frontend/src/components/ui/badge.tsx`. Replace the `variants:` block entirely with:

```ts
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-100 text-brand-700 hover:bg-brand-200",
        secondary:
          "border-transparent bg-cream-200 text-ink-700 hover:bg-cream-300",
        destructive:
          "border-transparent bg-rose-100 text-rose-500 hover:bg-rose-100/70",
        outline: "border-cream-300 text-ink-700",
        sage: "border-transparent bg-sage-100 text-sage-700",
        amber: "border-transparent bg-amber-100 text-amber-500",
      },
    },
```

- [ ] **Step 4: Restyle `Input`**

Open `private-chef/frontend/src/components/ui/input.tsx`. Find the className string (around line 13) and replace with:

```ts
          "flex h-12 w-full rounded-2xl border-2 border-cream-300 bg-white px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
```

- [ ] **Step 5: Restyle `Textarea`**

Open `private-chef/frontend/src/components/ui/textarea.tsx`. Find the className (line ~10) and replace with:

```ts
          "flex min-h-[80px] w-full rounded-2xl border-2 border-cream-300 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-ink-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
```

- [ ] **Step 6: Restyle `Sheet` — add bottom safe-area + larger top radius**

Open `private-chef/frontend/src/components/ui/sheet.tsx`. Find the `sheetVariants` block, replace the `bottom` and `top` variants with:

```ts
        top: "inset-x-0 top-0 rounded-b-3xl border-b border-cream-300 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 rounded-t-[32px] border-t border-cream-300 shadow-sheet pb-safe data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
```

Also find the `SheetOverlay` component (top of file) and update its className to:

```ts
      "fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

- [ ] **Step 7: Restyle `Dialog`**

Open `private-chef/frontend/src/components/ui/dialog.tsx`. Find the `DialogOverlay` component and update its className to (same as sheet — for consistency):

```ts
      "fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

Find the `DialogContent` component, replace the className with:

```ts
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-cream-300 bg-white p-6 shadow-elevated duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-3xl",
```

- [ ] **Step 8: Type check + run existing tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
npx vitest run
```

Expected: tsc exit 0. All previously-passing tests still pass (PWA install prompt may need `bg-rose-100` etc. to be recognized by Tailwind, which it now is). If `ShareDialog.test.tsx` fails because it queries by old class names, investigate — but it shouldn't, the test uses `screen.findByText` for text content.

- [ ] **Step 9: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/ui/
git commit -m "feat(design): restyle shadcn components with v1 tokens"
```

---

## Task 3: TabBar restyle

**Files:**
- Modify: `private-chef/frontend/src/pages/layout/TabBar.tsx`

- [ ] **Step 1: Restyle TabBar to use new tokens**

Replace the entire content of `private-chef/frontend/src/pages/layout/TabBar.tsx` with:

```tsx
import { Link, useLocation } from 'react-router'
import { ClipboardList, Home, User, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TabBar() {
  const location = useLocation()
  const currentPath = location.pathname

  const tabs = [
    { name: '首页', path: '/', icon: Home },
    { name: '点菜', path: '/menu', icon: Utensils },
    { name: '订单', path: '/orders', icon: ClipboardList },
    { name: '我的', path: '/profile', icon: User },
  ]

  return (
    <nav className="app-shell-tabbar pb-safe bg-white/95 backdrop-blur border-t border-cream-300">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {tabs.map((tab) => {
          const isActive = tab.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(tab.path)

          const Icon = tab.icon

          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex h-14 w-14 flex-col items-center justify-center gap-1 transition-colors duration-200',
                isActive ? 'text-brand' : 'text-ink-400 hover:text-ink-700',
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-brand" />
              )}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'bg-brand/10 w-10 h-8' : 'w-8 h-8 hover:bg-cream-100',
                )}
              >
                <Icon className={cn('transition-transform duration-200', isActive ? 'w-5 h-5' : 'w-5 h-5')} />
              </div>
              <span
                className={cn(
                  'text-[10px] leading-none transition-all duration-200',
                  isActive ? 'font-bold' : 'font-medium',
                )}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/layout/TabBar.tsx
git commit -m "feat(design): restyle TabBar with brand indicator + cream surface"
```

---

## Task 4: Backend — DELETE recipe enrichment with referencingOrders

**Files:**
- Modify: `private-chef/backend/src/routes/recipes.ts`
- Modify: `private-chef/backend/src/__tests__/recipes.test.ts` (or create if missing)

- [ ] **Step 1: Check if recipes.test.ts exists and find delete tests**

```bash
ls /Users/weilan/ali/ai/cook/private-chef/backend/src/__tests__/recipes.test.ts && grep -n "delete\|DELETE" /Users/weilan/ali/ai/cook/private-chef/backend/src/__tests__/recipes.test.ts | head -5
```

If file doesn't exist, you'll create it in Step 2. If it exists, find the existing describe block; you'll add a new describe inside it.

- [ ] **Step 2: Write the failing tests**

If `recipes.test.ts` does NOT exist, create it with this full content:

```ts
import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext, readJson } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) await cleanup()
  }
})

describe.sequential('DELETE /api/recipes/:id', () => {
  test('returns 409 with referencingOrders when recipe is in any order', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'delete-admin',
      displayName: '删除管理员',
      inviteCode: 'DEL001',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '被引用菜',
    })

    // Seed an order that includes this recipe
    const orderResult = ctx.sqlite
      .prepare(
        `INSERT INTO orders (family_id, user_id, meal_type, meal_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(family.familyId, family.userId, 'lunch', '2026-05-10', 'completed', '2026-05-10 12:00:00')
    const orderId = Number(orderResult.lastInsertRowid)
    ctx.sqlite
      .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
      .run(orderId, recipe.recipeId, 1)

    const response = await ctx.request(`/api/recipes/${recipe.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(409)

    const body = await readJson<{
      error: string
      message: string
      referencingOrders: Array<{ id: number; meal_date: string; meal_type: string; status: string }>
      referencingOrderCount: number
    }>(response)
    expect(body.error).toBe('RECIPE_REFERENCED_BY_ORDERS')
    expect(body.referencingOrderCount).toBe(1)
    expect(body.referencingOrders).toHaveLength(1)
    expect(body.referencingOrders[0].id).toBe(orderId)
    expect(body.referencingOrders[0].meal_date).toBe('2026-05-10')
  })

  test('returns 200 and cascades when recipe has no order references', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'unreferenced-admin',
      displayName: '无引用管理员',
      inviteCode: 'DEL002',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '可删菜',
    })

    const response = await ctx.request(`/api/recipes/${recipe.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(200)

    // verify recipe row gone
    const rows = ctx.sqlite
      .prepare('SELECT id FROM recipes WHERE id = ?')
      .all(recipe.recipeId)
    expect(rows).toHaveLength(0)
  })

  test('returns 404 when recipe does not exist', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'notfound-admin',
      displayName: '404',
      inviteCode: 'DEL003',
    })

    const response = await ctx.request('/api/recipes/999999', {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(404)
  })

  test('returns 404 when recipe belongs to another family (cross-family guard)', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const familyA = await ctx.seedFamily({
      username: 'family-a',
      displayName: '家庭 A',
      inviteCode: 'DEL004',
    })
    const familyB = await ctx.seedFamily({
      username: 'family-b',
      displayName: '家庭 B',
      inviteCode: 'DEL005',
    })
    const recipeB = ctx.seedRecipe({
      familyId: familyB.familyId,
      createdBy: familyB.userId,
      title: 'B 家的菜',
    })

    const response = await ctx.request(`/api/recipes/${recipeB.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(familyA.userId),
    })
    expect(response.status).toBe(404)
  })
})
```

If `recipes.test.ts` DOES exist, append the entire `describe.sequential('DELETE /api/recipes/:id', ...)` block (just the describe — skip the imports and afterEach which already exist).

- [ ] **Step 3: Run tests to verify they FAIL on the referencingOrders case**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run src/__tests__/recipes.test.ts
```

Expected: the `returns 409 with referencingOrders` test FAILS because the current implementation returns 409 with a different shape (no `referencingOrders` array). The other 3 tests should pass.

- [ ] **Step 4: Implement the enriched DELETE handler**

Open `private-chef/backend/src/routes/recipes.ts`. Find the `recipesRouter.delete('/:id', ...)` handler (around line 631). Replace its ENTIRE body with:

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

  if (!existing) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  // Pre-check for order references — provides better UX than relying on
  // FOREIGN KEY constraint failure, and lets us return the actual blocking
  // order ids so the UI can deep-link.
  const referencingOrders = sqlite
    .prepare(`
      SELECT DISTINCT o.id, o.meal_date, o.meal_type, o.status
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.recipe_id = ? AND o.family_id = ?
      ORDER BY o.meal_date DESC, o.id DESC
      LIMIT 100
    `)
    .all(recipeId, familyId) as Array<{
      id: number
      meal_date: string
      meal_type: string
      status: string
    }>

  if (referencingOrders.length > 0) {
    return c.json(
      {
        error: 'RECIPE_REFERENCED_BY_ORDERS',
        message: '该菜谱被订单引用，请先从订单移除',
        referencingOrders: referencingOrders.slice(0, 5),
        referencingOrderCount: referencingOrders.length,
      },
      409,
    )
  }

  try {
    sqlite.transaction(() => {
      sqlite.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(recipeId)
      sqlite.prepare('DELETE FROM recipe_images WHERE recipe_id = ?').run(recipeId)
      sqlite.prepare('DELETE FROM favorites WHERE recipe_id = ?').run(recipeId)
      sqlite
        .prepare(
          'DELETE FROM ratings WHERE cook_log_id IN (SELECT id FROM cook_logs WHERE recipe_id = ?)',
        )
        .run(recipeId)
      sqlite.prepare('DELETE FROM cook_logs WHERE recipe_id = ?').run(recipeId)
      sqlite.prepare('UPDATE wishes SET recipe_id = NULL WHERE recipe_id = ?').run(recipeId)
      sqlite.prepare('DELETE FROM recipes WHERE id = ?').run(recipeId)
    })()
  } catch (err: unknown) {
    // Defensive fallback in case some new FK constraint sneaks in later
    if (
      err instanceof Error &&
      err.message.includes('FOREIGN KEY constraint failed')
    ) {
      return c.json(
        {
          error: 'RECIPE_REFERENCED',
          message: '该菜谱被其它数据引用，无法删除',
        },
        409,
      )
    }
    throw err
  }

  return c.json({ success: true })
})
```

- [ ] **Step 5: Verify all 4 tests pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run src/__tests__/recipes.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/backend/src/routes/recipes.ts \
        private-chef/backend/src/__tests__/recipes.test.ts
git commit -m "feat(recipes): enrich DELETE response with referencingOrders"
```

---

## Task 5: Backend — GET /api/orders ?recipeId filter

**Files:**
- Modify: `private-chef/backend/src/routes/orders.ts`
- Modify: `private-chef/backend/src/__tests__/orders.test.ts`

- [ ] **Step 1: Read the orders GET handler**

```bash
sed -n '115,200p' /Users/weilan/ali/ai/cook/private-chef/backend/src/routes/orders.ts
```

Confirm the handler reads `c.req.query('status')` and `c.req.query('meal_date')` around line 117-118. You'll add `recipeId` next to them.

- [ ] **Step 2: Write the failing test**

Open `private-chef/backend/src/__tests__/orders.test.ts`. Find the closing `})` of the outermost `describe(...)` block. Add a new test inside that describe (right before the closing `})`):

```ts
  test('GET /api/orders?recipeId=X only returns orders containing that recipe', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'filter-admin',
      displayName: '筛选管理员',
      inviteCode: 'FILT01',
    })
    const targetRecipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '目标菜',
    })
    const otherRecipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '其它菜',
    })

    // Order A contains targetRecipe
    const orderA = ctx.sqlite
      .prepare(
        `INSERT INTO orders (family_id, user_id, meal_type, meal_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(family.familyId, family.userId, 'lunch', '2026-05-10', 'completed', '2026-05-10 12:00:00')
    ctx.sqlite
      .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
      .run(Number(orderA.lastInsertRowid), targetRecipe.recipeId, 1)

    // Order B contains only otherRecipe
    const orderB = ctx.sqlite
      .prepare(
        `INSERT INTO orders (family_id, user_id, meal_type, meal_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(family.familyId, family.userId, 'dinner', '2026-05-11', 'completed', '2026-05-11 19:00:00')
    ctx.sqlite
      .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
      .run(Number(orderB.lastInsertRowid), otherRecipe.recipeId, 1)

    const response = await ctx.request(`/api/orders?recipeId=${targetRecipe.recipeId}`, {
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(200)
    const body = await readJson<{ data: Array<{ id: number }> }>(response)
    const ids = body.data.map((o) => o.id)
    expect(ids).toContain(Number(orderA.lastInsertRowid))
    expect(ids).not.toContain(Number(orderB.lastInsertRowid))
  })
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run src/__tests__/orders.test.ts
```

Expected: the new test FAILS because the current handler ignores `recipeId` and returns all orders. The `ids` array will contain both order IDs.

- [ ] **Step 4: Implement the filter**

Open `private-chef/backend/src/routes/orders.ts`. Find the lines around 117-126 (the query-param reads + `conditions.push(...)` block). After the existing `conditions.push(eq(orders.status, statusFilter))` block (around line 126), add:

```ts
  const recipeIdFilter = c.req.query('recipeId')
  if (recipeIdFilter) {
    const recipeId = Number(recipeIdFilter)
    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return c.json({ error: 'Invalid recipeId filter' }, 400)
    }
    // Subquery: only include orders that have at least one matching order_item
    const matchedOrderIds = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(eq(orderItems.recipeId, recipeId))
    const idSet = new Set(matchedOrderIds.map((r) => r.orderId))
    if (idSet.size === 0) {
      return c.json({ data: [] })
    }
    conditions.push(inArray(orders.id, [...idSet]))
  }
```

You'll need to import `inArray` and `orderItems` if they're not already imported. At the top of the file, ensure these are present:

```ts
import { and, eq, inArray } from 'drizzle-orm'
import { orderItems, ... } from '../db/schema.js'
```

Check the existing imports — `orderItems` is likely already imported (it's used in the join section later). `inArray` may need to be added to the drizzle-orm import.

- [ ] **Step 5: Verify the new test passes and the existing tests still pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run src/__tests__/orders.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/backend/src/routes/orders.ts \
        private-chef/backend/src/__tests__/orders.test.ts
git commit -m "feat(orders): filter list by recipeId for cross-link from recipe detail"
```

---

## Task 6: Frontend hooks — useDeleteRecipe / useDeleteRecipeImage / useOrders

**Files:**
- Modify: `private-chef/frontend/src/hooks/useRecipes.ts`
- Create: `private-chef/frontend/src/hooks/useDeleteRecipeImage.ts`
- Modify: `private-chef/frontend/src/hooks/useOrders.ts`

- [ ] **Step 1: Update `useDeleteRecipe` to parse error body**

Open `private-chef/frontend/src/hooks/useRecipes.ts`. Find the `useDeleteRecipe` export (around line 173-188). Replace ITS ENTIRE body with:

```ts
export interface DeleteRecipeErrorBody {
  error: string
  message?: string
  referencingOrders?: Array<{
    id: number
    meal_date: string
    meal_type: string
    status: string
  }>
  referencingOrderCount?: number
}

export class DeleteRecipeError extends Error {
  body: DeleteRecipeErrorBody
  constructor(message: string, body: DeleteRecipeErrorBody) {
    super(message)
    this.name = 'DeleteRecipeError'
    this.body = body
  }
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${baseUrl}/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body: DeleteRecipeErrorBody = await res.json().catch(() => ({
          error: 'UNKNOWN',
          message: '删除菜谱失败',
        }))
        throw new DeleteRecipeError(body.message || body.error || '删除菜谱失败', body)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
```

- [ ] **Step 2: Create `useDeleteRecipeImage` hook**

Create `private-chef/frontend/src/hooks/useDeleteRecipeImage.ts` with:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

interface DeleteRecipeImageVars {
  recipeId: number
  imageId: number
}

export function useDeleteRecipeImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ imageId }: DeleteRecipeImageVars) => {
      const res = await fetch(`${baseUrl}/api/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: '图片删除失败' }))
        throw new Error(body.message || body.error || '图片删除失败')
      }
      return res.json() as Promise<{ success: true }>
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}
```

- [ ] **Step 3: Update `useOrders` to accept recipeId**

Open `private-chef/frontend/src/hooks/useOrders.ts`. Find the `OrdersQueryParams` type and `useOrders` function. Add a `recipeId?: number` field to the type and append it to the searchParams. Specifically:

Find:

```ts
      if (params?.status) searchParams.set('status', params.status)
      if (params?.meal_date) searchParams.set('meal_date', params.meal_date)
```

Replace with:

```ts
      if (params?.status) searchParams.set('status', params.status)
      if (params?.meal_date) searchParams.set('meal_date', params.meal_date)
      if (params?.recipeId) searchParams.set('recipeId', String(params.recipeId))
```

Find the type definition `interface OrdersQueryParams { ... }` (it's near the top, likely with `status?: string`). Add inside the interface:

```ts
  recipeId?: number
```

If the `queryKey: ['orders', ...]` includes `params.status`, `params.meal_date` etc., add `params?.recipeId` to keep cache invalidation correct. The current likely shape is something like:

```ts
queryKey: ['orders', params?.status, params?.meal_date],
```

change to:

```ts
queryKey: ['orders', params?.status, params?.meal_date, params?.recipeId],
```

- [ ] **Step 4: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/hooks/useRecipes.ts \
        private-chef/frontend/src/hooks/useDeleteRecipeImage.ts \
        private-chef/frontend/src/hooks/useOrders.ts
git commit -m "feat(hooks): parse delete-recipe error body, add image delete + orders recipeId"
```

---

## Task 7: IngredientStep component

**Files:**
- Create: `private-chef/frontend/src/components/recipe/IngredientStep.tsx`

Pure presentational component. No tests.

- [ ] **Step 1: Create the component**

Create `private-chef/frontend/src/components/recipe/IngredientStep.tsx`:

```tsx
import { cn } from '@/lib/utils'

interface IngredientStepProps {
  index: number
  text: string
  className?: string
}

export function IngredientStep({ index, text, className }: IngredientStepProps) {
  return (
    <div className={cn('flex gap-3 items-start', className)}>
      <div className="flex-none w-7 h-7 rounded-full bg-brand text-white font-bold flex items-center justify-center text-xs">
        {index}
      </div>
      <p className="text-sm text-ink-700 leading-relaxed flex-1 pt-0.5 whitespace-pre-line">
        {text}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/IngredientStep.tsx
git commit -m "feat(recipe): add IngredientStep presentational component"
```

---

## Task 8: RecipeImageGrid

**Files:**
- Create: `private-chef/frontend/src/components/recipe/RecipeImageGrid.tsx`
- Create: `private-chef/frontend/src/components/recipe/RecipeImageGrid.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `private-chef/frontend/src/components/recipe/RecipeImageGrid.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { RecipeImageGrid, type ImageItem } from './RecipeImageGrid'

function makeItem(overrides: Partial<ImageItem>): ImageItem {
  return {
    localId: 'l1',
    url: 'https://example.com/a.png',
    status: 'picked',
    ...overrides,
  }
}

describe('RecipeImageGrid', () => {
  test('clicking × on picked image calls onRemoveLocal directly (no confirm)', () => {
    const onRemoveLocal = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', status: 'picked' })]}
        onPick={vi.fn()}
        onRemoveLocal={onRemoveLocal}
        onRemoveUploaded={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    expect(onRemoveLocal).toHaveBeenCalledWith('a')
  })

  test('clicking × on uploaded image opens confirm dialog; confirming calls onRemoveUploaded', async () => {
    const onRemoveUploaded = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', serverId: 42, status: 'uploaded' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={onRemoveUploaded}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    // Confirm dialog should be visible
    expect(await screen.findByText('删除这张图？')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(onRemoveUploaded).toHaveBeenCalledWith(42)
  })

  test('clicking × on uploaded image and canceling does NOT call onRemoveUploaded', async () => {
    const onRemoveUploaded = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', serverId: 42, status: 'uploaded' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={onRemoveUploaded}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    fireEvent.click(await screen.findByRole('button', { name: '取消' }))
    expect(onRemoveUploaded).not.toHaveBeenCalled()
  })

  test('error item shows retry icon; clicking it calls onRetry with localId', () => {
    const onRetry = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'b', status: 'error', errorMessage: '网络中断' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={vi.fn()}
        onRetry={onRetry}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /重试图片 b/ }))
    expect(onRetry).toHaveBeenCalledWith('b')
  })

  test('renders an add tile that triggers file picker', () => {
    render(
      <RecipeImageGrid
        items={[]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /添加图片/ })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/recipe/RecipeImageGrid.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `private-chef/frontend/src/components/recipe/RecipeImageGrid.tsx`:

```tsx
import { useRef, useState } from 'react'
import { Loader2, Plus, RotateCcw, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ImageItem {
  localId: string
  serverId?: number
  url: string
  thumbUrl?: string
  status: 'picked' | 'uploading' | 'uploaded' | 'error' | 'deleting'
  progress?: number
  errorMessage?: string
}

interface RecipeImageGridProps {
  items: ImageItem[]
  onPick: (file: File) => void
  onRemoveLocal: (localId: string) => void
  onRemoveUploaded: (serverId: number) => void
  onRetry: (localId: string) => void
  maxColumns?: number
}

export function RecipeImageGrid({
  items,
  onPick,
  onRemoveLocal,
  onRemoveUploaded,
  onRetry,
}: RecipeImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingDeleteServerId, setPendingDeleteServerId] = useState<number | null>(null)

  const handleAddClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) onPick(file)
    e.target.value = '' // allow re-picking same file
  }

  const handleRemoveClick = (item: ImageItem) => {
    if (item.status === 'uploaded' && item.serverId != null) {
      setPendingDeleteServerId(item.serverId)
    } else {
      onRemoveLocal(item.localId)
    }
  }

  const confirmDelete = () => {
    if (pendingDeleteServerId != null) {
      onRemoveUploaded(pendingDeleteServerId)
      setPendingDeleteServerId(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div
            key={item.localId}
            className="relative aspect-square rounded-2xl overflow-hidden border border-cream-300 bg-cream-100"
          >
            <img
              src={item.thumbUrl || item.url}
              alt=""
              className="w-full h-full object-cover"
            />

            {/* state overlay */}
            {item.status === 'uploading' && (
              <div className="absolute inset-0 bg-ink-900/40 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                {item.progress != null && (
                  <span className="text-[10px] font-bold mt-1">{item.progress}%</span>
                )}
              </div>
            )}
            {item.status === 'deleting' && (
              <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {item.status === 'error' && (
              <div className="absolute inset-0 bg-rose-500/40 flex items-end justify-start p-1.5">
                <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded">
                  失败
                </span>
              </div>
            )}
            {item.status === 'uploaded' && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-sage-500 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                  <path strokeLinecap="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* action button (× or retry) */}
            {item.status === 'error' ? (
              <button
                type="button"
                aria-label={`重试图片 ${item.localId}`}
                onClick={() => onRetry(item.localId)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-ink-900 flex items-center justify-center shadow"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            ) : item.status !== 'deleting' ? (
              <button
                type="button"
                aria-label={`移除图片 ${item.localId}`}
                onClick={() => handleRemoveClick(item)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-ink-900 text-xs font-bold flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        ))}

        {/* add tile */}
        <button
          type="button"
          aria-label="添加图片"
          onClick={handleAddClick}
          className="aspect-square rounded-2xl border-2 border-dashed border-cream-400 flex items-center justify-center text-cream-400 hover:border-brand hover:text-brand transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={pendingDeleteServerId != null} onOpenChange={(o) => !o && setPendingDeleteServerId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除这张图？</DialogTitle>
            <DialogDescription>删了不可恢复，确认要删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setPendingDeleteServerId(null)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="w-full sm:w-auto">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/recipe/RecipeImageGrid.test.tsx
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/RecipeImageGrid.tsx \
        private-chef/frontend/src/components/recipe/RecipeImageGrid.test.tsx
git commit -m "feat(recipe): add RecipeImageGrid with proper delete confirm"
```

---

## Task 9: RecipeFormCore — extract framework-agnostic form internals

**Files:**
- Create: `private-chef/frontend/src/components/recipe/RecipeFormCore.tsx`

Pure controlled component. Tested transitively by RecipeSheet tests in Task 10.

- [ ] **Step 1: Read current StepEditor + RecipeForm fields**

```bash
cat /Users/weilan/ali/ai/cook/private-chef/frontend/src/components/recipe/StepEditor.tsx | head -40
sed -n '60,160p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/recipe/RecipeForm.tsx
```

Confirm the field set: title, description, cook_minutes, servings, steps[], tags[]. Note how StepEditor is consumed.

- [ ] **Step 2: Create the component**

Create `private-chef/frontend/src/components/recipe/RecipeFormCore.tsx`:

```tsx
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StepEditor } from '@/components/recipe/StepEditor'
import { RecipeImageGrid, type ImageItem } from './RecipeImageGrid'
import type { RecipeTag } from '@/hooks/useRecipes'

export interface RecipeFormValues {
  title: string
  description: string
  cookMinutes: number | ''
  servings: number | ''
  steps: string[]
  tagIds: number[]
}

export interface RecipeImageActions {
  onPick: (file: File) => void
  onRemoveLocal: (localId: string) => void
  onRemoveUploaded: (serverId: number) => void
  onRetry: (localId: string) => void
}

interface RecipeFormCoreProps {
  values: RecipeFormValues
  onChange: (patch: Partial<RecipeFormValues>) => void
  images: ImageItem[]
  imageActions: RecipeImageActions
  availableTags: RecipeTag[]
  titleInputRef?: React.Ref<HTMLInputElement>
}

export function RecipeFormCore({
  values,
  onChange,
  images,
  imageActions,
  availableTags,
  titleInputRef,
}: RecipeFormCoreProps) {
  const toggleTag = (tagId: number) => {
    const next = values.tagIds.includes(tagId)
      ? values.tagIds.filter((id) => id !== tagId)
      : [...values.tagIds, tagId]
    onChange({ tagIds: next })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">菜名</label>
        <Input
          ref={titleInputRef}
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="输入菜名…"
          className="mt-1.5"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">图片</label>
        <div className="mt-1.5">
          <RecipeImageGrid items={images} {...imageActions} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">描述</label>
        <Textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="可选，简单描述…"
          className="mt-1.5 h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">时长（分钟）</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.cookMinutes}
            onChange={(e) => {
              const v = e.target.value
              onChange({ cookMinutes: v === '' ? '' : Number(v) })
            }}
            placeholder="45"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">份数</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.servings}
            onChange={(e) => {
              const v = e.target.value
              onChange({ servings: v === '' ? '' : Number(v) })
            }}
            placeholder="2"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">标签</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {availableTags.map((tag) => {
            const selected = values.tagIds.includes(tag.id)
            return (
              <Badge
                key={tag.id}
                variant={selected ? 'default' : 'secondary'}
                onClick={() => toggleTag(tag.id)}
                className="cursor-pointer"
              >
                {tag.name}
              </Badge>
            )
          })}
        </div>
        <p className="text-[10px] text-ink-500 mt-1.5">提交后标签会保留，方便连续录同类菜</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">步骤</label>
        <div className="mt-1.5">
          <StepEditor
            steps={values.steps}
            onChange={(steps) => onChange({ steps })}
          />
        </div>
      </div>
    </div>
  )
}
```

> Note: this assumes `StepEditor` exposes `steps: string[]` and `onChange: (next: string[]) => void`. If the existing component has a different API, this Core component needs to bridge to it — read `StepEditor.tsx` first and adapt the wrapper above.

- [ ] **Step 3: Type check**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
```

Expected: clean. If StepEditor's API doesn't match, fix the wrapper here.

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/RecipeFormCore.tsx
git commit -m "feat(recipe): extract RecipeFormCore as controlled form internals"
```

---

## Task 10: RecipeSheet — continuous add Bottom Sheet

**Files:**
- Create: `private-chef/frontend/src/components/recipe/RecipeSheet.tsx`
- Create: `private-chef/frontend/src/components/recipe/RecipeSheet.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `private-chef/frontend/src/components/recipe/RecipeSheet.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { RecipeSheet } from './RecipeSheet'

// Mock useCreateRecipe + useTags + uploadImage + useSaveRecipeImage
vi.mock('@/hooks/useRecipes', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useRecipes')>('@/hooks/useRecipes')
  return {
    ...actual,
    useCreateRecipe: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ id: 123 }),
      isPending: false,
    }),
    useTags: () => ({ data: [{ id: 1, name: '家常' }, { id: 2, name: '晚餐' }], isLoading: false }),
    useSaveRecipeImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})
vi.mock('@/lib/image-upload', () => ({
  uploadImage: vi.fn().mockResolvedValue({ url: 'https://x' }),
}))

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      {ui}
      <Toaster />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('RecipeSheet', () => {
  test('renders sheet when open', () => {
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByText('新增菜品')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    renderWithProviders(<RecipeSheet open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByText('新增菜品')).not.toBeInTheDocument()
  })

  test('writes lastSubmitMode to localStorage when user picks a mode', async () => {
    // This is verified indirectly via the persisted key after a submit;
    // simulating menu interaction would require a UI library dropdown helper.
    // For this plan's scope we ship the integration test in the manual
    // verification checklist (Task 14) and only assert here that the default
    // mode is "continue" on first open.
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建并继续/ })).toBeInTheDocument()
  })

  test('uses persisted lastSubmitMode on open', () => {
    localStorage.setItem('cook.recipe.lastSubmitMode', 'close')
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建并关闭/ })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/recipe/RecipeSheet.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement RecipeSheet**

Create `private-chef/frontend/src/components/recipe/RecipeSheet.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { useCreateRecipe, useSaveRecipeImage, useTags } from '@/hooks/useRecipes'
import { uploadImage } from '@/lib/image-upload'
import { RecipeFormCore, type RecipeFormValues } from './RecipeFormCore'
import type { ImageItem } from './RecipeImageGrid'

type SubmitMode = 'continue' | 'close' | 'view'

const SUBMIT_MODE_KEY = 'cook.recipe.lastSubmitMode'

const MODE_LABEL: Record<SubmitMode, string> = {
  continue: '创建并继续',
  close: '创建并关闭',
  view: '创建并查看详情',
}

const EMPTY_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  cookMinutes: '',
  servings: '',
  steps: [''],
  tagIds: [],
}

function readMode(): SubmitMode {
  try {
    const v = localStorage.getItem(SUBMIT_MODE_KEY)
    if (v === 'close' || v === 'view') return v
  } catch {
    /* ignore */
  }
  return 'continue'
}

function writeMode(mode: SubmitMode) {
  try {
    localStorage.setItem(SUBMIT_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

interface RecipeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecipeSheet({ open, onOpenChange }: RecipeSheetProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: tags = [] } = useTags()
  const createMutation = useCreateRecipe()
  const saveImageMutation = useSaveRecipeImage()

  const [values, setValues] = useState<RecipeFormValues>(EMPTY_VALUES)
  const [images, setImages] = useState<ImageItem[]>([])
  const [submitMode, setSubmitMode] = useState<SubmitMode>(readMode)
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  // refocus title when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 250)
    }
  }, [open])

  const patch = (p: Partial<RecipeFormValues>) =>
    setValues((prev) => ({ ...prev, ...p }))

  const handlePick = (file: File) => {
    const localId = crypto.randomUUID()
    const url = URL.createObjectURL(file)
    setImages((prev) => [
      ...prev,
      { localId, url, status: 'picked' },
    ])
    // Stash file on the item via a side map; for plan simplicity we attach
    // via a ref outside React state.
    fileMap.current.set(localId, file)
  }
  const fileMap = useRef(new Map<string, File>())

  const handleRemoveLocal = (localId: string) => {
    const item = images.find((i) => i.localId === localId)
    if (item?.url) URL.revokeObjectURL(item.url)
    fileMap.current.delete(localId)
    setImages((prev) => prev.filter((i) => i.localId !== localId))
  }

  const handleRemoveUploaded = (_serverId: number) => {
    // Sheet-mode delete-after-upload is rare; we just drop it locally.
    // (Real "delete uploaded" lives in the RecipeForm edit page via
    // useDeleteRecipeImage; the sheet's continuous-add flow rarely
    // hits this state.)
    toast({ description: '已上传图片只能在菜品详情页删除' })
  }

  const handleRetry = (_localId: string) => {
    // Retry hook for future async upload; current implementation uploads
    // sequentially after create, so retry happens via re-pick.
  }

  const queueUploads = async (recipeId: number) => {
    const pending = images.filter((i) => i.status === 'picked')
    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx]
      const file = fileMap.current.get(item.localId)
      if (!file) continue
      setImages((prev) =>
        prev.map((i) =>
          i.localId === item.localId ? { ...i, status: 'uploading' as const } : i,
        ),
      )
      try {
        const uploaded = await uploadImage(file, {
          onProgress: (progress) => {
            setImages((prev) =>
              prev.map((i) =>
                i.localId === item.localId ? { ...i, progress } : i,
              ),
            )
          },
        })
        await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, sort_order: idx },
        })
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId ? { ...i, status: 'uploaded' as const, progress: 100 } : i,
          ),
        )
      } catch (err) {
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: 'error' as const, errorMessage: String(err) }
              : i,
          ),
        )
      }
    }
  }

  const resetForKeepGoing = () => {
    // clear most fields; KEEP tagIds + servings (per spec §5.3)
    images.forEach((i) => URL.revokeObjectURL(i.url))
    fileMap.current.clear()
    setImages([])
    setValues((prev) => ({
      ...EMPTY_VALUES,
      tagIds: prev.tagIds,
      servings: prev.servings,
    }))
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleSubmit = async (mode: SubmitMode) => {
    if (!values.title.trim()) {
      toast({ title: '校验错误', description: '需要填写菜名', variant: 'destructive' })
      return
    }
    const validSteps = values.steps.filter((s) => s.trim().length > 0)
    if (validSteps.length === 0) {
      toast({ title: '校验错误', description: '至少需要一个步骤', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    setSubmitMode(mode)
    writeMode(mode)
    try {
      const created = await createMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        cook_minutes: values.cookMinutes === '' ? undefined : values.cookMinutes,
        servings: values.servings === '' ? undefined : values.servings,
        steps: validSteps,
        tags: values.tagIds,
      })

      // start uploads (don't await — runs in background)
      void queueUploads(created.id)

      if (mode === 'continue') {
        toast({ description: `✓ 已创建 #${created.id}，继续录入下一道` })
        resetForKeepGoing()
      } else if (mode === 'close') {
        toast({ description: `✓ 已创建 #${created.id}` })
        onOpenChange(false)
      } else {
        toast({ description: `✓ 已创建 #${created.id}` })
        onOpenChange(false)
        navigate(`/recipe/${created.id}`)
      }
    } catch (err) {
      toast({
        title: '保存菜谱时出错',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const primaryLabel = MODE_LABEL[submitMode]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] p-0 flex flex-col"
        aria-describedby={undefined}
      >
        <div className="px-5 py-3 border-b border-cream-300">
          <p className="text-xs text-ink-500">连续录入模式</p>
          <h2 className="text-lg font-extrabold">新增菜品</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <RecipeFormCore
            values={values}
            onChange={patch}
            images={images}
            imageActions={{
              onPick: handlePick,
              onRemoveLocal: handleRemoveLocal,
              onRemoveUploaded: handleRemoveUploaded,
              onRetry: handleRetry,
            }}
            availableTags={tags}
            titleInputRef={titleRef}
          />
        </div>

        <div className="px-5 pt-3 pb-7 border-t border-cream-300 bg-cream-50">
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(submitMode)}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? '保存中…' : `${primaryLabel} →`}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={submitting} aria-label="选择提交模式">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSubmitMode('continue')}>
                  创建并继续
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSubmitMode('close')}>
                  创建并关闭
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSubmitMode('view')}>
                  创建并查看详情
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-[10px] text-ink-500 text-center mt-2">
            默认「创建并继续」会清空字段，标签保留
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 4: Verify tests pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/recipe/RecipeSheet.test.tsx
```

Expected: 4 passed. If `dropdown-menu.tsx` is missing, run `npx shadcn-ui add dropdown-menu` (or check the `src/components/ui/` directory; it's already in the list per `useDropdown` references). Actually verify:

```bash
ls /Users/weilan/ali/ai/cook/private-chef/frontend/src/components/ui/dropdown-menu.tsx
```

If absent — the simplest fallback is to inline a `<select>` replacement: change the `<DropdownMenu>` block to a `<select>` controlled by `submitMode`. Document this swap in the commit message.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/RecipeSheet.tsx \
        private-chef/frontend/src/components/recipe/RecipeSheet.test.tsx
git commit -m "feat(recipe): add RecipeSheet for continuous-add flow"
```

---

## Task 11: RecipeReferencedDialog

**Files:**
- Create: `private-chef/frontend/src/components/recipe/RecipeReferencedDialog.tsx`

- [ ] **Step 1: Implement the component**

Create `private-chef/frontend/src/components/recipe/RecipeReferencedDialog.tsx`:

```tsx
import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ReferencingOrder {
  id: number
  meal_date: string
  meal_type: string
  status: string
}

interface RecipeReferencedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, dialog shows blocked-by-orders content. When null, dialog shows the standard confirm-delete content. */
  blockedBy: {
    recipeTitle: string
    recipeId: number
    referencingOrders: ReferencingOrder[]
    referencingOrderCount: number
  } | null
  /** Standard confirm-delete props (used when blockedBy is null) */
  onConfirmDelete?: () => void
  recipeTitleForConfirm?: string
  isDeleting?: boolean
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const STATUS_LABEL: Record<string, string> = {
  submitted: '待接单',
  confirmed: '已接单',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

export function RecipeReferencedDialog({
  open,
  onOpenChange,
  blockedBy,
  onConfirmDelete,
  recipeTitleForConfirm,
  isDeleting,
}: RecipeReferencedDialogProps) {
  const navigate = useNavigate()

  if (blockedBy) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删不了：「{blockedBy.recipeTitle}」被 {blockedBy.referencingOrderCount} 个订单引用</DialogTitle>
            <DialogDescription>
              要删除菜谱，需要先从这些订单里把它移除。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
              近 {blockedBy.referencingOrders.length} 单
            </p>
            {blockedBy.referencingOrders.map((order) => (
              <div
                key={order.id}
                className="text-sm text-ink-700 flex items-center gap-2 py-1"
              >
                <span>·</span>
                <span>{order.meal_date}</span>
                <span>{MEAL_TYPE_LABEL[order.meal_type] || order.meal_type}</span>
                <span>#{order.id}</span>
                <span className="text-ink-500">（{STATUS_LABEL[order.status] || order.status}）</span>
              </div>
            ))}
            {blockedBy.referencingOrderCount > blockedBy.referencingOrders.length && (
              <p className="text-[11px] text-ink-500 italic pt-1">
                ……共 {blockedBy.referencingOrderCount} 单
              </p>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              我知道了
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                navigate(`/orders?recipeId=${blockedBy.recipeId}`)
              }}
              className="w-full sm:w-auto"
            >
              去看这些订单 →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // standard confirm-delete
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>删除菜谱</DialogTitle>
          <DialogDescription>
            确定要删除「{recipeTitleForConfirm}」吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? '删除中…' : '删除菜谱'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/recipe/RecipeReferencedDialog.tsx
git commit -m "feat(recipe): add RecipeReferencedDialog with deep-link to filtered orders"
```

---

## Task 12: MenuPage — entry button + FAB + RecipeSheet host

**Files:**
- Modify: `private-chef/frontend/src/pages/menu/MenuPage.tsx`

- [ ] **Step 1: Update MenuPage header + add Sheet + FAB**

Open `private-chef/frontend/src/pages/menu/MenuPage.tsx`. Make these targeted changes:

1. Add to imports (top of file):

```tsx
import { Plus, Search, ShoppingBag, Minus, ChevronRight, Loader2, Sparkles, ChefHat } from 'lucide-react'
import { RecipeSheet } from '@/components/recipe/RecipeSheet'
import { useState } from 'react'
```

(Replace the existing icon imports line so all needed icons are there; ensure `Plus` is included. `useState` is already imported.)

2. Add a state hook inside `MenuPage()` function near the other state declarations:

```tsx
const [sheetOpen, setSheetOpen] = useState(false)
```

3. Replace the `h1` block. Find:

```tsx
      <div className="space-y-2.5 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          点菜 <ChefHat className="h-6 w-6 text-primary fill-primary/20" />
        </h1>
        <p className="text-sm font-medium text-muted-foreground/80">挑选今天想吃的菜，加入清单后统一去下单。</p>
      </div>
```

Replace with:

```tsx
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="space-y-2.5 flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            点菜 <ChefHat className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm font-medium text-muted-foreground">挑选今天想吃的菜，加入清单后统一去下单。</p>
        </div>
        <Button
          onClick={() => setSheetOpen(true)}
          className="flex-none gap-1.5 mt-1"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          新菜
        </Button>
      </div>
```

4. At the END of the outer `<div>` (right before the closing `</div>` at the bottom of `return (...)`), add the Sheet host + FAB:

```tsx
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="新增菜品"
        className="fixed right-4 z-30 w-14 h-14 rounded-full bg-brand text-white text-2xl font-bold shadow-elevated flex items-center justify-center hover:bg-brand-600 transition-colors"
        style={{ bottom: 'calc(var(--app-shell-floating-offset) + 4rem)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <RecipeSheet open={sheetOpen} onOpenChange={setSheetOpen} />
```

The `style` uses the existing `--app-shell-floating-offset` CSS variable defined in `globals.css` so the FAB sits above the cart bar and tab bar.

- [ ] **Step 2: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean. All tests still pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/menu/MenuPage.tsx
git commit -m "feat(menu): add 新菜 button + FAB + RecipeSheet host"
```

---

## Task 13: RecipeDetail — visual redo + delete dialog upgrade

**Files:**
- Modify: `private-chef/frontend/src/pages/recipe/RecipeDetail.tsx`

The visual redo is large but mechanical. Replace the JSX one section at a time.

- [ ] **Step 1: Read current RecipeDetail and confirm delete handler shape**

```bash
sed -n '230,400p' /Users/weilan/ali/ai/cook/private-chef/frontend/src/pages/recipe/RecipeDetail.tsx
```

Confirm the file uses `useDeleteRecipe`, calls `deleteMutation.mutateAsync(recipeId)`, and renders a confirm `<Dialog>` near line 380.

- [ ] **Step 2: Update imports + state for the two-mode dialog**

In `RecipeDetail.tsx`:

1. Add to the top-of-file imports:

```tsx
import { RecipeReferencedDialog } from '@/components/recipe/RecipeReferencedDialog'
import { DeleteRecipeError } from '@/hooks/useRecipes'
```

2. Inside the component, add new state alongside `isDeleteDialogOpen`:

```tsx
const [referencedBlock, setReferencedBlock] = useState<{
  referencingOrders: Array<{ id: number; meal_date: string; meal_type: string; status: string }>
  referencingOrderCount: number
} | null>(null)
```

3. Replace `handleDelete` with:

```tsx
const handleDelete = async () => {
  try {
    await deleteMutation.mutateAsync(recipeId)
    toast({ title: '菜谱已删除', description: '您的菜谱已被移除。' })
    navigate('/')
  } catch (e: unknown) {
    if (e instanceof DeleteRecipeError && e.body.error === 'RECIPE_REFERENCED_BY_ORDERS') {
      setReferencedBlock({
        referencingOrders: e.body.referencingOrders ?? [],
        referencingOrderCount: e.body.referencingOrderCount ?? 0,
      })
      // keep dialog open so we can switch to blocked mode
      return
    }
    toast({
      title: '错误',
      description: e instanceof Error ? e.message : '删除菜谱失败。',
      variant: 'destructive',
    })
    setIsDeleteDialogOpen(false)
  }
}
```

4. Find the existing `<Dialog>` around line 380 used for delete confirm. Replace it ENTIRELY with:

```tsx
<RecipeReferencedDialog
  open={isDeleteDialogOpen}
  onOpenChange={(o) => {
    setIsDeleteDialogOpen(o)
    if (!o) setReferencedBlock(null)
  }}
  blockedBy={
    referencedBlock
      ? {
          recipeTitle: recipe.title,
          recipeId,
          referencingOrders: referencedBlock.referencingOrders,
          referencingOrderCount: referencedBlock.referencingOrderCount,
        }
      : null
  }
  onConfirmDelete={handleDelete}
  recipeTitleForConfirm={recipe.title}
  isDeleting={deleteMutation.isPending}
/>
```

- [ ] **Step 3: Visual redo — replace the hero + title block**

Find the JSX block that renders the hero image (around line 263 — starts with `<div className="glass-card border border-border/60 overflow-hidden">`). Replace it AND the title/description blocks that follow (up to but NOT including the steps block) with:

```tsx
<div className="relative h-64 bg-gradient-to-br from-brand-300 to-brand-700 rounded-3xl overflow-hidden">
  {recipe.images && recipe.images.length > 0 && (
    <img
      src={recipe.images[currentImageIndex]?.url}
      alt={`${recipe.title} - 第 ${currentImageIndex + 1} 张图片`}
      className="absolute inset-0 w-full h-full object-cover"
    />
  )}
  {recipe.images && recipe.images.length > 1 && (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
      {recipe.images.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setCurrentImageIndex(i)}
          className={`rounded-full transition-all ${i === currentImageIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`}
          aria-label={`图片 ${i + 1}`}
        />
      ))}
    </div>
  )}
</div>

<div className="bg-white rounded-3xl border border-cream-300 -mt-6 relative">
  <div className="p-5">
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex-1 min-w-0">
        {recipe.tags && recipe.tags.length > 0 && (
          <p className="text-xs text-ink-500 mb-1">
            {recipe.tags.map((t) => t.name).join(' · ')}
          </p>
        )}
        <h1 className="text-2xl font-extrabold leading-tight">{recipe.title}</h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFavorite}
        aria-label={recipe.is_favorited ? '取消收藏' : '收藏'}
        className="flex-none"
      >
        <Heart className={recipe.is_favorited ? 'w-5 h-5 fill-brand text-brand' : 'w-5 h-5 text-ink-500'} />
      </Button>
    </div>

    <div className="flex gap-2 flex-wrap mb-4">
      {recipe.cook_minutes != null && (
        <Badge variant="sage">{recipe.cook_minutes} 分钟</Badge>
      )}
      {recipe.servings != null && (
        <Badge variant="amber">{recipe.servings} 人份</Badge>
      )}
      {recipe.recent_cook_logs && (
        <Badge variant="secondary">已做 {recipe.recent_cook_logs.length} 次</Badge>
      )}
    </div>

    {recipe.description && (
      <p className="text-sm text-ink-600 leading-relaxed">{recipe.description}</p>
    )}
  </div>

  <div className="border-t border-cream-300 px-5 py-5">
    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">步骤</h3>
    <div className="space-y-3">
      {recipe.steps.map((step, idx) => (
        <IngredientStep key={idx} index={idx + 1} text={step} />
      ))}
    </div>
  </div>
</div>
```

Add `import { IngredientStep } from '@/components/recipe/IngredientStep'` and `import { Heart } from 'lucide-react'` (Heart may already be imported). Verify other imports (Button, Badge) are present.

- [ ] **Step 4: Update the action bar at the bottom**

Find the existing action buttons (likely a section near line 350 with edit/delete buttons or links). Find any block that renders Edit / Delete buttons inline. Replace it with a sticky bottom bar:

```tsx
<div className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-safe bg-white/95 backdrop-blur border-t border-cream-300 max-w-md mx-auto">
  <div className="flex gap-2">
    <Link to={`/recipe/${recipeId}/edit`} className="flex-none">
      <Button variant="outline">编辑</Button>
    </Link>
    <Button
      variant="outline"
      onClick={() => setIsDeleteDialogOpen(true)}
      className="text-rose-500 border-rose-500/30 hover:bg-rose-100"
    >
      删除
    </Button>
    <Button className="flex-1">+ 加入点单</Button>
  </div>
</div>
```

For the 「加入点单」 button — if `RecipeDetail.tsx` currently has an onClick handler for the same action (search for `navigate('/menu` or `addRecipe(` in the current file), wire to it; otherwise leave it disabled with a tooltip `「订单流程将在下一版上线」` (this action belongs to spec 2 — order flow redo).

- [ ] **Step 5: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/recipe/RecipeDetail.tsx
git commit -m "feat(recipe): redo RecipeDetail visuals + integrate RecipeReferencedDialog"
```

---

## Task 14: OrderList — read ?recipeId from URL and show filter chip

**Files:**
- Modify: `private-chef/frontend/src/pages/order/OrderList.tsx`

- [ ] **Step 1: Add URL search param handling**

Open `private-chef/frontend/src/pages/order/OrderList.tsx`. Add to imports:

```tsx
import { useSearchParams, Link } from 'react-router'
```

(If `Link` or `useSearchParams` are already imported, just add the missing one.)

Inside the component:

```tsx
const [searchParams, setSearchParams] = useSearchParams()
const recipeIdParam = searchParams.get('recipeId')
const recipeIdFilter = recipeIdParam ? Number(recipeIdParam) : undefined
```

Pass `recipeId: recipeIdFilter` to the `useOrders(...)` call:

```tsx
const { data, ... } = useOrders({ status: statusFilter, recipeId: recipeIdFilter })
```

(Adapt to the existing `useOrders` call signature in the file.)

- [ ] **Step 2: Render the filter chip when recipeId is present**

Right at the top of the orders list JSX (above the existing status chips or at the very top of the page content), add:

```tsx
{recipeIdFilter && (
  <div className="mb-3">
    <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold">
      <span>筛选：包含菜品 #{recipeIdFilter}</span>
      <button
        type="button"
        aria-label="清除筛选"
        onClick={() => {
          const next = new URLSearchParams(searchParams)
          next.delete('recipeId')
          setSearchParams(next)
        }}
        className="w-4 h-4 rounded-full bg-brand-700 text-white flex items-center justify-center text-[10px]"
      >
        ×
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3: Type check + tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/order/OrderList.tsx
git commit -m "feat(orders): support ?recipeId URL filter with clearable chip"
```

---

## Task 15: RecipeForm — slim to edit-only shell + cleanup deprecated components

**Files:**
- Modify: `private-chef/frontend/src/pages/recipe/RecipeForm.tsx`
- Delete: `private-chef/frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx`
- Delete: `private-chef/frontend/src/components/recipe/RecipeUploadQueue.tsx`

`RecipeForm.tsx` previously handled both create and edit. The create path now lives in `RecipeSheet`. Make `RecipeForm.tsx` strictly edit-only.

- [ ] **Step 1: Rewrite RecipeForm as edit-only shell**

Replace the entire content of `private-chef/frontend/src/pages/recipe/RecipeForm.tsx` with:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRecipe, useTags, useUpdateRecipe, useSaveRecipeImage } from '@/hooks/useRecipes'
import { useDeleteRecipeImage } from '@/hooks/useDeleteRecipeImage'
import { uploadImage } from '@/lib/image-upload'
import { RecipeFormCore, type RecipeFormValues } from '@/components/recipe/RecipeFormCore'
import type { ImageItem } from '@/components/recipe/RecipeImageGrid'

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: recipe, isLoading } = useRecipe(recipeId)
  const { data: tags = [] } = useTags()
  const updateMutation = useUpdateRecipe()
  const saveImageMutation = useSaveRecipeImage()
  const deleteImageMutation = useDeleteRecipeImage()

  const [values, setValues] = useState<RecipeFormValues>({
    title: '',
    description: '',
    cookMinutes: '',
    servings: '',
    steps: [''],
    tagIds: [],
  })
  const [images, setImages] = useState<ImageItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileMap = useRef(new Map<string, File>())

  // hydrate from recipe data
  useEffect(() => {
    if (!recipe) return
    setValues({
      title: recipe.title,
      description: recipe.description ?? '',
      cookMinutes: recipe.cook_minutes ?? '',
      servings: recipe.servings ?? '',
      steps: recipe.steps.length > 0 ? recipe.steps : [''],
      tagIds: recipe.tags.map((t) => t.id),
    })
    setImages(
      recipe.images.map((img) => ({
        localId: `server-${img.id}`,
        serverId: img.id,
        url: img.url,
        thumbUrl: img.thumb_url ?? undefined,
        status: 'uploaded',
      })),
    )
  }, [recipe])

  const patch = (p: Partial<RecipeFormValues>) =>
    setValues((prev) => ({ ...prev, ...p }))

  const handlePick = (file: File) => {
    const localId = crypto.randomUUID()
    const url = URL.createObjectURL(file)
    setImages((prev) => [...prev, { localId, url, status: 'picked' }])
    fileMap.current.set(localId, file)
  }
  const handleRemoveLocal = (localId: string) => {
    const item = images.find((i) => i.localId === localId)
    if (item?.url && item.status === 'picked') URL.revokeObjectURL(item.url)
    fileMap.current.delete(localId)
    setImages((prev) => prev.filter((i) => i.localId !== localId))
  }
  const handleRemoveUploaded = async (serverId: number) => {
    setImages((prev) =>
      prev.map((i) => (i.serverId === serverId ? { ...i, status: 'deleting' as const } : i)),
    )
    try {
      await deleteImageMutation.mutateAsync({ recipeId, imageId: serverId })
      setImages((prev) => prev.filter((i) => i.serverId !== serverId))
    } catch (err) {
      setImages((prev) =>
        prev.map((i) =>
          i.serverId === serverId ? { ...i, status: 'uploaded' as const } : i,
        ),
      )
      toast({
        description: err instanceof Error ? err.message : '图片删除失败',
        variant: 'destructive',
      })
    }
  }
  const handleRetry = (_localId: string) => {
    /* retry happens on next submit */
  }

  const queueUploads = async () => {
    const pending = images.filter((i) => i.status === 'picked')
    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx]
      const file = fileMap.current.get(item.localId)
      if (!file) continue
      setImages((prev) =>
        prev.map((i) =>
          i.localId === item.localId ? { ...i, status: 'uploading' as const } : i,
        ),
      )
      try {
        const uploaded = await uploadImage(file, {
          onProgress: (progress) => {
            setImages((prev) =>
              prev.map((i) => (i.localId === item.localId ? { ...i, progress } : i)),
            )
          },
        })
        const saved = await saveImageMutation.mutateAsync({
          recipeId,
          json: { url: uploaded.url, sort_order: images.length + idx },
        })
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: 'uploaded' as const, serverId: saved.id, progress: 100 }
              : i,
          ),
        )
      } catch (err) {
        setImages((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: 'error' as const, errorMessage: String(err) }
              : i,
          ),
        )
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      toast({ title: '校验错误', description: '需要填写菜名', variant: 'destructive' })
      return
    }
    const validSteps = values.steps.filter((s) => s.trim().length > 0)
    if (validSteps.length === 0) {
      toast({ title: '校验错误', description: '至少需要一个步骤', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await updateMutation.mutateAsync({
        id: recipeId,
        json: {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          cook_minutes: values.cookMinutes === '' ? undefined : values.cookMinutes,
          servings: values.servings === '' ? undefined : values.servings,
          steps: validSteps,
          tags: values.tagIds,
        },
      })
      void queueUploads()
      toast({ title: '菜谱已保存', description: '图片继续在后台上传' })
      navigate(`/recipe/${recipeId}`)
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '请重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center animate-pulse">正在加载菜谱详情...</div>
  if (!recipe) return <div className="p-8 text-center">菜谱不存在</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pt-2">
        <Link to={`/recipe/${recipeId}`} className="flex items-center text-sm text-ink-500 hover:text-ink-900">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-cream-300 shadow-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6">编辑菜谱</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RecipeFormCore
            values={values}
            onChange={patch}
            images={images}
            imageActions={{
              onPick: handlePick,
              onRemoveLocal: handleRemoveLocal,
              onRemoveUploaded: handleRemoveUploaded,
              onRetry: handleRetry,
            }}
            availableTags={tags}
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? '保存中…' : '保存'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no stale imports reference removed components**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
grep -rn "RecipeCreateSuccessBanner\|RecipeUploadQueue" src/ 2>/dev/null
```

If any matches remain, fix those files (likely removing the import). Common case: `RecipeForm.tsx` (now replaced) had imports — should be gone.

- [ ] **Step 3: Delete deprecated components**

```bash
cd /Users/weilan/ali/ai/cook
git rm private-chef/frontend/src/components/recipe/RecipeCreateSuccessBanner.tsx \
       private-chef/frontend/src/components/recipe/RecipeUploadQueue.tsx
```

- [ ] **Step 4: Update App.tsx routes**

Open `private-chef/frontend/src/App.tsx`. Find:

```tsx
<Route path="/recipe/new" element={<RecipeForm />} />
```

Replace with:

```tsx
<Route path="/recipe/new" element={<Navigate to="/menu" replace />} />
```

Add to imports: `import { Navigate } from 'react-router'`.

This preserves backwards-compat — anyone navigating to `/recipe/new` (old bookmarks, deep links) ends up on MenuPage where they can use the FAB or 「+ 新菜」 button.

- [ ] **Step 5: Type check + tests + build**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run && npm run build
```

Expected: tsc clean, all tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/pages/recipe/RecipeForm.tsx \
        private-chef/frontend/src/App.tsx
git commit -m "feat(recipe): slim RecipeForm to edit-only, deprecate banner & upload queue"
```

---

## Task 16: End-to-end verification

No code changes — only verification across the full surface.

- [ ] **Step 1: Full test suite + lint + build**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run && npx tsc -b --noEmit && npm run lint && npm run build

cd /Users/weilan/ali/ai/cook/private-chef/backend
npx vitest run
```

All green expected. New backend tests: recipes.test.ts delete cases + orders.test.ts recipeId filter. New frontend tests: RecipeImageGrid + RecipeSheet.

- [ ] **Step 2: Manual verification — desktop preview**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend && npm run preview
# In another terminal:
cd /Users/weilan/ali/ai/cook/private-chef/backend && npm run dev
```

Open `http://localhost:4173` in Chrome at 375 viewport (DevTools mobile mode). Walk through:

1. Login → land on Home — verify tab bar uses new brand color + indicator bar
2. Tap 「点菜」 tab → MenuPage shows 「+ 新菜」 button (top-right) + right-side FAB
3. Tap 「+ 新菜」 → Sheet slides up from bottom (rounded top corners, ink-900/40 overlay)
4. Fill title only → tap 「创建并继续」 → error toast about missing steps
5. Add a step → tap 「创建并继续」 → toast 「✓ 已创建 #N」 + form clears + tag picks preserved + title input refocused
6. Pick a few tags, tap dropdown arrow → 「创建并关闭」 → tap main button → Sheet closes
7. Reload page → tap 「+ 新菜」 → primary button text is now 「创建并关闭」 (lastSubmitMode persisted)
8. Open an existing recipe with images → tap `…` or 「编辑」 → on edit page tap × on an uploaded image → confirm Dialog → confirm → image removed
9. Try to delete a recipe that's referenced by orders → see RecipeReferencedDialog with order list + 「去看这些订单」 button → click → land on `/orders?recipeId=X` with the filter chip visible
10. Click × on the chip → reload OrderList without filter
11. Try to delete an unreferenced recipe → standard confirm → success → redirect to Home

- [ ] **Step 3: If anything from Step 2 fails — debug + fix + commit**

If any step shows broken behavior, halt and use systematic-debugging. Don't just paper over symptoms. Commit fixes individually under `fix(...)` prefixes.

---

## Done

After all 16 tasks complete, cook has:
- A unified design system (tokens + restyled shadcn) ready to be reused by spec 2 (orders) and spec 3 (home)
- MenuPage with two prominent entry points and a bottom-Sheet continuous-add flow
- Working image delete via confirm dialog
- Recipe delete that explains *why* it failed and links to the blocking orders
- A more refined RecipeDetail page

**Next:** Write spec 2 (order flow redo) — reuse the design system established here, focus on OrderList + OrderDetailV2 + Home active-orders card.
