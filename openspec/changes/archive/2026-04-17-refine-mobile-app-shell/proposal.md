## Why

The Private Chef frontend already ships as a mobile-oriented PWA, but the authenticated shell and several key pages still read more like a centered desktop dashboard than a refined handheld app. This change is needed now because the current UI quality and layout polish do not match the product’s everyday mobile use case, and the installable app experience should be preserved and made more intentional rather than treated as incidental.

## What Changes

- Refine the authenticated frontend shell so phone-sized screens feel like a coherent app surface instead of wide desktop content inside a mobile wrapper.
- Rework the visual hierarchy, spacing rhythm, and navigation treatment for high-traffic authenticated pages, especially Home, Menu, and Profile.
- Standardize app-like layout behaviors such as safe-area handling, page framing, persistent navigation, and bottom action placement where appropriate.
- Preserve and verify desktop/browser installability based on the existing Vite PWA setup, manifest, Cloudflare Pages SPA fallback, and standalone launch behavior.
- Define explicit acceptance criteria for mobile-first polish, route resilience, and installable PWA behavior without introducing backend feature scope.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `frontend`: Tighten the existing mobile-friendly PWA requirements so the authenticated app shell, key page layouts, and installable experience behave like a polished app across phone and desktop-installed contexts.

## Impact

- Affected code is concentrated in `private-chef/frontend`, especially `src/pages/layout/AppLayout.tsx`, `src/pages/layout/TabBar.tsx`, `src/pages/home/Home.tsx`, `src/pages/menu/MenuPage.tsx`, `src/pages/profile/Profile.tsx`, shared UI styling, and related layout primitives.
- Existing PWA configuration in `private-chef/frontend/vite.config.ts`, `index.html`, icon assets, and `public/_redirects` will likely be verified and potentially refined, but not replaced wholesale.
- No backend API contract changes are expected.
- Frontend specification deltas are required because the baseline behavior currently describes a general mobile-friendly shell, but this change makes the shell quality, layout behavior, and installable experience more explicit.
