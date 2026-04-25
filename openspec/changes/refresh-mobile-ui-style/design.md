## Context

The current frontend already has the right technical foundation for a visual refresh: Tailwind theme extensions, CSS custom properties, glass-card utilities, a mobile app shell, and reusable shadcn-style primitives. The issue is not missing infrastructure but inconsistent visual expression. `Home.tsx` and parts of `Achievements.tsx` already use color and softer surfaces, while `OrderList.tsx`, `WishList.tsx`, `Favorites.tsx`, `Profile.tsx`, base `Card`, and base `Button` still lean toward neutral utility styling.

The user wants the app to move closer to the supplied references: rounded mobile cards, brighter but soft palette accents, clearer visual grouping, friendlier empty states, and CTA treatments that feel expressive instead of plain. This change remains frontend-only and must preserve the existing React + TypeScript + Vite + Tailwind + Radix architecture, PWA shell behavior, and backend integration.

## Goals / Non-Goals

**Goals:**
- Establish a cohesive visual direction for the authenticated app that feels warmer, lighter, and more memorable while remaining readable and shippable.
- Extend the existing token system so the refreshed style is encoded as reusable color, radius, shadow, and surface rules rather than one-off page overrides.
- Upgrade shared UI primitives and shell affordances first, then align the most visible authenticated pages to that system.
- Make the intended visual expectations explicit in spec language so future implementation and review can distinguish success from subjective taste debates.

**Non-Goals:**
- No backend route, payload, auth, or data-model changes.
- No full information-architecture rewrite or large navigation restructuring.
- No attempt to exactly clone the provided references or turn the product into a pet app; the references inform mood, hierarchy, and styling only.
- No dark-mode redesign or theme-switching work in this change.

## Decisions

### 1. Treat this as a visual-system refresh, not a one-page restyling pass
- **Decision:** The implementation should begin with tokens and reusable primitives in `globals.css`, `tailwind.config.ts`, `button.tsx`, `card.tsx`, and other shared surface patterns before tuning individual pages.
- **Rationale:** The repo already mixes expressive pages with flatter ones. A system-first approach prevents the refresh from becoming inconsistent or expensive to maintain.
- **Alternative considered:** Redesign only the most obvious pages such as Orders and Profile.
- **Why not:** That would leave shared controls and adjacent pages visually mismatched, which is already part of the current problem.

### 2. Keep the existing shell architecture but shift its emotional tone
- **Decision:** Reuse the current app-shell structure and tab-bar placement while updating shell framing, surface tinting, active states, spacing rhythm, and floating-action presentation.
- **Rationale:** `AppLayout.tsx`, `TabBar.tsx`, and the shell tokens already solve the structural problem. The gap is emotional tone and hierarchy, not navigation mechanics.
- **Alternative considered:** Introduce a new shell layout or navigation pattern.
- **Why not:** That would expand scope into product structure rather than addressing the requested UI style refresh.

### 3. Encode the reference mood through controlled token changes
- **Decision:** Introduce a brighter supporting palette, softer multi-surface backgrounds, larger card/button radii, friendlier chip styling, and more expressive CTA states while preserving contrast and Chinese-content readability.
- **Rationale:** The references succeed because they combine rounded geometry, light backgrounds, playful accent blocks, and clear hierarchy—not because of any one illustration style. This can be translated into tokens without copying the artwork domain.
- **Alternative considered:** Add illustration-heavy decoration or many custom one-off gradients.
- **Why not:** That would create maintenance cost and visual noise while failing to improve the product's baseline component language.

### 4. Target the pages with the largest plain-vs-polished gap first
- **Decision:** Prioritize `OrderList.tsx`, `Profile.tsx`, `WishList.tsx`, `Favorites.tsx`, and supporting shared components, while also aligning `Home.tsx`, `MenuPage.tsx`, and `Achievements.tsx` to the refreshed system.
- **Rationale:** These surfaces either have flatter list/card treatments or already partial expressive styling that needs normalization. Together they define most daily user impressions.
- **Alternative considered:** Touch every page equally.
- **Why not:** That would dilute focus and make the change harder to verify as a cohesive first-pass refresh.

### 5. Keep accessibility and product seriousness as guardrails
- **Decision:** The refreshed style should allow brighter accents and softer cards, but interactive text, status cues, and structural labels must remain high-contrast and semantically clear.
- **Rationale:** The user asked for less plain UI, not lower readability. The references include playful color, but this product still supports real household planning flows and cannot sacrifice clarity.
- **Alternative considered:** Heavier pastel-on-pastel styling or icon-only emphasis.
- **Why not:** Those patterns would look trendy in screenshots but weaken usability in a production household workflow app.

## Risks / Trade-offs

- **[Risk]** Brighter colors and softer surfaces could reduce contrast or make status distinctions less clear. → **Mitigation:** Keep semantic text/status colors readable and require clearer visual hierarchy for badges, CTA buttons, and section titles.
- **[Risk]** A token refresh can create regressions across pages that were not explicitly redesigned. → **Mitigation:** Start with reusable primitives and audit all major authenticated pages after token changes.
- **[Risk]** The references may tempt the implementation toward decorative pet-app mimicry that clashes with Private Chef's domain. → **Mitigation:** Translate only the reusable qualities—rounded geometry, layered cards, soft accent blocks, approachable CTAs, and warmer spacing rhythm.
- **[Risk]** More expressive styling may conflict with current glass morphism utilities. → **Mitigation:** Keep glass utilities where they help depth, but allow slightly more opaque, tinted, and purpose-specific surfaces rather than applying one translucent treatment everywhere.

## Migration Plan

1. Finalize the frontend delta spec so the refreshed visual-system expectations are explicit and reviewable.
2. Update tokens and reusable primitives first.
3. Refine the shared shell and navigation active states.
4. Rework target pages to use the new system consistently, including loading, empty, and floating-action states.
5. Run frontend diagnostics/build and perform manual mobile-size review for readability, spacing, CTA emphasis, and cross-page consistency.
6. If the result becomes visually noisy or inconsistent, roll back page-level styling after preserving any safe shared token improvements that remain valid.

## Open Questions

- Should this first pass include auth pages such as `Login.tsx` and `Register.tsx`, or should the visual refresh remain focused on the authenticated in-app experience?
- Should the refresh introduce a small set of named accent surfaces (for example warm, mint, sky, peach) in tokens, or keep all supporting color variation local to page modules?
