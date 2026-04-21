## 1. Spec Alignment

- [x] 1.1 Review `proposal.md`, `design.md`, and `specs/frontend/spec.md` together and confirm the final scope is limited to frontend shell refinement plus installability verification.
- [x] 1.2 Resolve whether this first pass will preserve browser-native install flows only or also add an explicit in-app install entry point.
- [x] 1.3 Confirm whether any authenticated pages beyond Home, Menu, and Profile must be included once shared shell rules are applied.

## 2. Shared Frontend Shell

- [x] 2.1 Refine `private-chef/frontend/src/pages/layout/AppLayout.tsx` so the authenticated shell uses app-like page framing on phone screens and intentional wider-screen behavior.
- [x] 2.2 Update `private-chef/frontend/src/pages/layout/TabBar.tsx` and shared bottom-spacing rules so persistent navigation, safe areas, and page-level bottom actions no longer compete.
- [x] 2.3 Adjust shared styling in `private-chef/frontend/src/styles/globals.css`, `tailwind.config.ts`, and related primitives to establish the spacing rhythm, surface treatment, and viewport behavior required by the new shell.

## 3. Key Page Refinement

- [x] 3.1 Rework `private-chef/frontend/src/pages/home/Home.tsx` to match the new mobile-first shell and reduce desktop-dashboard presentation.
- [x] 3.2 Rework `private-chef/frontend/src/pages/menu/MenuPage.tsx` so search, recipe browsing, and the floating order summary behave like one app flow within the refined shell.
- [x] 3.3 Rework `private-chef/frontend/src/pages/profile/Profile.tsx` so profile summary, family information, and settings sections follow the shared app-like visual system.

## 4. PWA And Installability Verification

- [x] 4.1 Review `private-chef/frontend/vite.config.ts`, `index.html`, icons, and `public/_redirects` and make only the minimal refinements needed to preserve standalone installation behavior.
- [x] 4.2 Verify that supported desktop browsers still present installability and that standalone launch behavior remains usable after the UI changes.
- [x] 4.3 Verify that direct-route access and refresh continue to work in installed and browser contexts without breaking SPA routing.

## 5. Validation And Handoff

- [x] 5.1 Run diagnostics or lint checks on all changed frontend files and address any issues introduced by the change.
- [x] 5.2 Run the frontend build and confirm the production bundle still succeeds with the existing PWA setup.
- [x] 5.3 Manually verify mobile-sized authenticated flows for Home, Menu, and Profile, including navigation, bottom spacing, and visual consistency.
- [x] 5.4 Update runbook or related docs only if deployment/installability behavior changed in a way operators must know.
- [ ] 5.5 Archive the change after implementation and verification are complete.
