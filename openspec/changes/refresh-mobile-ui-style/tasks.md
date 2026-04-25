## 1. Spec Alignment

- [x] 1.1 Review `proposal.md`, `design.md`, and `specs/frontend/spec.md` together and confirm the first pass stays frontend-only.
- [x] 1.2 Confirm the target visual direction translates the reference mood into Private Chef styling without copying unrelated pet-domain motifs.
- [x] 1.3 Decide whether auth pages are included in this first-pass refresh or deferred to a follow-up change.

## 2. Design Tokens And Shared Primitives

- [x] 2.1 Update `private-chef/frontend/src/styles/globals.css` and `private-chef/frontend/tailwind.config.ts` to add the refreshed palette, surface treatments, radius rules, and shadow hierarchy needed for the new visual system.
- [x] 2.2 Refine shared primitives such as `private-chef/frontend/src/components/ui/button.tsx`, `private-chef/frontend/src/components/ui/card.tsx`, badges, inputs, and related utility styles so primary/secondary/outline states match the refreshed direction.
- [x] 2.3 Audit reusable card-based modules such as `private-chef/frontend/src/components/recipe/RecipeCard.tsx` and align them to the updated token system.

## 3. Shared Shell And Navigation

- [x] 3.1 Update `private-chef/frontend/src/pages/layout/AppLayout.tsx`, `private-chef/frontend/src/pages/layout/TabBar.tsx`, and shared shell spacing so navigation and page framing reflect the more expressive mobile style.
- [x] 3.2 Rework floating-action, section-header, and active-tab treatments so they feel brighter and more intentional without reducing readability.

## 4. Page-Level Visual Refresh

- [x] 4.1 Refresh `private-chef/frontend/src/pages/home/Home.tsx` and `private-chef/frontend/src/pages/menu/MenuPage.tsx` to align existing expressive sections with the new token system.
- [x] 4.2 Refresh `private-chef/frontend/src/pages/order/OrderList.tsx` and related list states so grouped orders, badges, and CTAs feel less dashboard-like.
- [x] 4.3 Refresh `private-chef/frontend/src/pages/profile/Profile.tsx`, `private-chef/frontend/src/pages/wish/WishList.tsx`, and `private-chef/frontend/src/pages/favorites/Favorites.tsx` so profile/history/list surfaces use the same high-polish mobile language.
- [x] 4.4 Refresh `private-chef/frontend/src/pages/achievements/Achievements.tsx` and any adjacent shared surfaces so the richer style remains consistent instead of page-specific.
- [x] 4.5 Upgrade loading, empty, and lightweight feedback states on touched pages so they feel friendlier and more intentional than plain placeholders.

## 5. Validation And Handoff

- [x] 5.1 Run diagnostics or lint checks on all changed frontend files and fix issues introduced by the refresh.
- [x] 5.2 Run the frontend build and confirm the production bundle still succeeds with the updated visual system.
- [x] 5.3 Manually verify mobile-sized authenticated flows for contrast, spacing, scanability, bottom-action safety, and cross-page consistency.
- [x] 5.4 Update docs only if the refresh changes operator-visible behavior or establishes reusable design guidance that should be preserved.
- [ ] 5.5 Archive the change after implementation and verification are complete.
