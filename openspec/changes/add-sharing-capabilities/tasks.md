## 1. Spec And Contract Alignment

- [x] 1.1 Finalize the share target list, share channel vocabulary, and share-card field set across order, recipe, achievements, and daily menu flows.
- [x] 1.2 Review the frontend, backend, and shared delta specs with product expectations for public fields, WeChat copy tone, and poster-download behavior.
- [x] 1.3 Finalize the public share-page access model, URL shape, token strategy, and QR-code target behavior for external recipients.

## 2. Backend Sharing APIs

- [x] 2.1 Refactor order sharing to align its mutation, public share-page payload, and share-card responses with the unified sharing contract without breaking current family scoping.
- [x] 2.2 Add recipe share mutation and recipe share-card endpoints, including validation and family ownership checks.
- [x] 2.3 Add achievements share mutation and achievements share-card endpoints based on current summary and leaderboard data.
- [x] 2.4 Add daily menu share mutation and daily menu share-card endpoints based on current recommendation/menu summary data.
- [x] 2.5 Add public share-page retrieval endpoints or routes plus share metadata needed for SEO/WeChat previews and QR-code generation.
- [x] 2.6 Centralize shared share validation, channel handling, share-token resolution, and activity/notification recording where needed.

## 3. Frontend Sharing Experience

- [x] 3.1 Upgrade the order detail page from share logging to a visible share flow with share page creation, copy-link, WeChat, and poster-download actions.
- [x] 3.2 Add recipe sharing UI and hook support on the recipe detail surface.
- [x] 3.3 Add achievements sharing UI and hook support on the achievements page.
- [x] 3.4 Add daily menu/today recommendation sharing UI and hook support on the home or menu surface.
- [x] 3.5 Build public share-page routes and rendering components so shared links and QR-code scans open a branded share experience without login.
- [x] 3.6 Build a reusable share action sheet/dialog and shared data hook layer so the four targets use the same interaction model.
- [x] 3.7 Implement real-time frontend poster rendering and download flow, including QR-code embedding, export behavior, and device-quality verification.

## 4. Verification

- [x] 4.1 Add or update backend tests for order, recipe, achievements, and daily menu sharing routes, public share-page payloads, and share-card contracts.
- [ ] 4.2 Add or update frontend interaction coverage for share entry points, loading states, public share-page rendering, and successful share actions.
- [x] 4.3 Run relevant diagnostics, tests, and frontend/backend build commands for all changed modules.
- [ ] 4.4 Manually verify mobile-friendly share interactions on the key surfaces: order detail, recipe detail, achievements, and home/menu, plus QR-scan and shared-link open flows.
