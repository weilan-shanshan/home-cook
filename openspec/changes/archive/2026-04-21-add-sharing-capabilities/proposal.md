## Why

Private Chef already records order-share interactions, but the product does not yet provide a coherent sharing experience across the surfaces users naturally want to spread inside or outside the household. Users can currently view achievements, browse dishes, and see today's recommendations, but they cannot turn those moments into reusable public share pages, copyable links, WeChat-friendly shares, or downloadable share posters with QR codes.

## What Changes

- Add a unified sharing capability for orders, recipes, achievements, and today's menu recommendations.
- Upgrade order sharing from a recorded interaction into a usable share flow that produces a dedicated share page, supports copy link, supports WeChat distribution, and offers downloadable share posters with QR codes.
- Add recipe share entry points and recipe share-page/share-card payloads so individual dishes can be shared with title, imagery, and summary context.
- Add achievements sharing so users can share their household leaderboard or personal rank summary from the achievements surface through a dedicated share page and poster.
- Add today's menu sharing from the home/menu experience so users can share the current recommendation set as a compact daily menu page or poster.
- Standardize share metadata, share channels, poster generation semantics, QR-code behavior, and share analytics semantics across frontend and backend flows while preserving family scoping where appropriate.

## Capabilities

### New Capabilities
- `sharing`: Unified sharing behavior covering share entry points, dedicated share pages, copy/share actions, WeChat distribution, poster download with QR code, and share records for orders, recipes, achievements, and daily menu content.

### Modified Capabilities
- `frontend`: Authenticated UI behavior changes to expose sharing actions and share states across order detail, recipe detail, achievements, and home/menu surfaces, plus public-facing share-page rendering.
- `backend`: API behavior changes to expose sharing endpoints, share-page tokens or identifiers, share-card payloads, and poster/QR metadata beyond the current order-only contract.
- `shared`: Shared API contract changes for reusable share targets, channel vocabulary, public share-page payloads, poster metadata, and QR-code payload shapes across modules.

## Impact

- Frontend pages: `private-chef/frontend/src/pages/order/OrderDetailV2.tsx`, recipe detail flows, achievements page, home/menu surfaces, public share pages/routes, and related hooks/components.
- Backend routes/services: existing order interaction routes plus new share routes/services for recipes, achievements, daily menu content, share-page retrieval, and poster/QR metadata generation.
- Shared contracts: payload naming, target typing, public-share access shape, poster metadata, and response-shape consistency for share records and share-card APIs.
- Persistence and notifications: share records may expand beyond orders and may require share tokens or snapshots to support stable public share pages.
