## Why

The Private Chef frontend already feels mobile-first in structure, but its visual language is still too restrained and uneven across core pages. This change is needed now because high-frequency surfaces such as orders, profile, wishes, and favorites feel functional rather than delightful, which weakens the product's everyday-app feel despite the existing PWA shell.

## What Changes

- Refresh the frontend visual system toward a softer, brighter, more playful mobile aesthetic built on rounded surfaces, warmer accent colors, and stronger card hierarchy.
- Extend the existing Tailwind/CSS-variable token layer so color, radius, shadows, surface tinting, and action emphasis support this upgraded style consistently instead of page-by-page ad hoc styling.
- Rework shared shell and reusable primitives such as buttons, cards, badges, tab states, floating actions, and empty-state treatments so the visual upgrade starts at the system level.
- Apply the refreshed visual language to the most visible authenticated surfaces, especially `Home.tsx`, `MenuPage.tsx`, `OrderList.tsx`, `Profile.tsx`, `WishList.tsx`, `Favorites.tsx`, and `Achievements.tsx`.
- Preserve current product behavior, routes, data flows, and backend contracts while making the frontend feel more polished, expressive, and app-like.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend`: The frontend requirements will explicitly cover a cohesive high-polish visual system, playful-but-readable mobile styling, and consistent treatment of key authenticated surfaces and feedback states.

## Impact

- Affected code is concentrated in `private-chef/frontend`, especially `src/styles/globals.css`, `tailwind.config.ts`, `src/pages/layout/AppLayout.tsx`, `src/pages/layout/TabBar.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/recipe/RecipeCard.tsx`, and page modules under `src/pages/`.
- No backend API, authentication, storage, or deployment contract changes are expected.
- Frontend spec deltas are required because the current baseline describes a polished app shell, but it does not yet make the richer visual-system expectations explicit enough to guide or review this style refresh.
