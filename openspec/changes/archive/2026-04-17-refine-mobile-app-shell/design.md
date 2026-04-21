## Context

The current frontend already has the major building blocks of an app-like PWA: `vite-plugin-pwa` generates a standalone manifest, `index.html` includes Apple/PWA metadata, Cloudflare Pages uses `_redirects` for SPA route fallback, and the authenticated layout already uses a fixed bottom tab bar. The problem is not missing infrastructure; it is that the authenticated shell and key pages still mix mobile patterns with wide centered containers and dashboard-like composition, especially in `AppLayout.tsx`, `Home.tsx`, `MenuPage.tsx`, and `Profile.tsx`.

This change affects the frontend only. The main stakeholders are end users using the product daily on phones, plus users who may install the app from desktop browsers and expect the standalone launch to feel coherent rather than like a browser tab wrapped around a PC layout.

Constraints:
- The existing React + TypeScript + Vite + Tailwind + Radix stack should remain the implementation foundation.
- Existing backend APIs and auth/session behavior should remain unchanged.
- Cloudflare Pages deployment and SPA fallback are current production truth and should be preserved.
- The design should improve polish and app-like behavior without turning the change into a full information architecture rewrite.

## Goals / Non-Goals

**Goals:**
- Make the authenticated shell feel intentionally mobile-first, with consistent page framing, spacing, safe-area handling, and navigation behavior.
- Refine high-traffic authenticated pages so they feel like part of one app surface rather than independent dashboard panels.
- Preserve and verify installability in supported browsers by keeping the current manifest/service-worker foundation intact and ensuring standalone launches still work well.
- Define explicit acceptance criteria for layout polish, route resilience, and installed-app behavior.

**Non-Goals:**
- No backend route, payload, auth, or data-model changes.
- No full redesign of every authenticated page in one pass; this change centers on the shared shell and the most visible pages.
- No assumption that a custom in-app install banner must be added unless implementation proves it is valuable and low-risk.
- No deployment topology change away from Cloudflare Pages + backend tunnel.

## Decisions

### 1. Treat this as a shell-and-page refinement on top of the existing PWA foundation
- **Decision:** Reuse the current `vite-plugin-pwa` manifest, icon assets, standalone display mode, and Cloudflare Pages routing setup as the baseline.
- **Rationale:** `vite.config.ts`, `index.html`, and `_redirects` already establish the product as an installable SPA/PWA. The user problem is quality and intentionality, not lack of raw PWA infrastructure.
- **Alternative considered:** Rebuild the PWA setup or introduce a new install architecture.
- **Why not:** That would add risk and scope without addressing the main complaint about visual polish and app-like layout behavior.

### 2. Make the shared authenticated shell the primary unit of refinement
- **Decision:** Concentrate the design around `AppLayout.tsx`, `TabBar.tsx`, shared spacing tokens, viewport sizing, and safe-area behavior before tuning individual pages.
- **Rationale:** The current shell uses a wide `max-w-5xl` container that makes even mobile-first pages feel centered inside a desktop frame. Fixing shell rules first gives downstream pages a consistent mobile-app baseline.
- **Alternative considered:** Polish each page independently.
- **Why not:** That would produce local improvements while preserving the inconsistent outer frame that is currently making the app feel like a PC site.

### 3. Focus page redesign on Home, Menu, and Profile as the highest-leverage surfaces
- **Decision:** Treat `Home.tsx`, `MenuPage.tsx`, and `Profile.tsx` as the primary page-level targets in this change.
- **Rationale:** These files show the strongest evidence of desktop/dashboard composition today: wide grids, dashboard statistics blocks, and container widths that feel broader than a handheld app surface. They also represent the first impression and the most frequently revisited authenticated flows.
- **Alternative considered:** Include every authenticated page in scope.
- **Why not:** That would reduce delivery focus and make it harder to specify a clear implementation sequence.

### 4. Encode installability as preserve-and-verify behavior, not just configuration presence
- **Decision:** The change will explicitly require that supported desktop browsers can install the app, launch it in standalone mode, and open deep links without route breakage.
- **Rationale:** The current baseline spec says the frontend is a mobile-friendly PWA, but it does not make installed desktop behavior explicit. The user asked for “像 app 一样安装到桌面”, so the change needs acceptance criteria that go beyond “manifest exists”.
- **Alternative considered:** Leave installability implicit because the current plugin configuration already exists.
- **Why not:** That leaves the user requirement under-specified and easy to regress during later UI work.

### 5. Keep verification practical and frontend-centered
- **Decision:** Verification will rely on changed-file diagnostics, frontend build/lint, and manual checks for mobile shell behavior, deep-link refresh, and desktop install/standalone launch.
- **Rationale:** The frontend currently exposes build/lint scripts but no established automated UI test harness. The change should still define concrete verification steps instead of pretending automated coverage already exists.
- **Alternative considered:** Expand scope to include a full UI test harness in the same change.
- **Why not:** That may become a useful follow-up, but it should not block a focused shell/UI refinement unless implementation reveals an immediate need.

## Risks / Trade-offs

- **[Risk]** Refining toward a stronger mobile shell could make wide screens feel constrained. → **Mitigation:** Define explicit wider-screen behavior that still feels like an installed app surface rather than blindly stretching content edge to edge.
- **[Risk]** Visual polish work can drift into subjective redesign churn. → **Mitigation:** Anchor decisions to shared shell rules, targeted page scope, and measurable acceptance criteria around spacing, navigation, safe-area, and installability.
- **[Risk]** PWA behavior may appear “working” in config but fail in real installed flows. → **Mitigation:** Include manual verification for install prompt availability, standalone launch behavior, and route refresh after deployment/build verification.
- **[Risk]** Page-specific floating actions and bottom UI elements may conflict with the fixed tab bar and safe areas. → **Mitigation:** Consolidate spacing and bottom-offset rules in the shared shell and audit page-level bottom action treatments against those rules.

## Migration Plan

1. Finalize the frontend delta spec so shell quality and installability become explicit behavioral requirements.
2. Implement shared shell/layout updates first.
3. Update Home, Menu, and Profile against the new shell rules.
4. Run frontend lint/build and manual checks for mobile layout behavior, desktop installability, standalone launch, and deep-link refresh.
5. If regressions appear, roll back the frontend change set while keeping the existing PWA configuration untouched.

## Open Questions

- Should this change add an explicit in-app install entry point, or is preserving browser-native install flows sufficient for the first pass?
- Should any additional authenticated pages beyond Home, Menu, and Profile be included if the shared shell changes expose obvious inconsistencies there?
