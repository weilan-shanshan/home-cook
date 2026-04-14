## T02 Learnings (2026-04-10)

- `drizzle-kit@0.31.10` requires a newer `drizzle-orm` than `0.30.10`. Downgraded drizzle-kit to `0.21.4` which is the only stable version compatible with drizzle-orm `0.30.10`
- Exporting `new Database()` directly from `index.ts` causes TS4023 (`cannot be named`) when `declaration: true` is set. Fix: import the type explicitly: `import Database, { type Database as DatabaseType } from 'better-sqlite3'` and annotate the export
- `drizzle-kit migrate` does NOT create parent directories for the DB file. `db/index.ts` handles this with `mkdirSync(dir, { recursive: true })` but drizzle-kit doesn't — must `mkdir -p data/` before running `db:migrate`
- drizzle-kit 0.21.4 does NOT emit `check()` constraints in generated SQL. Must manually add CHECK constraints to the migration file after generation. The `check()` call in schema.ts still serves as documentation but won't auto-generate into SQL
- Timestamp text defaults must use `sql\`(datetime('now'))\`` (with parens) — the parens make it a SQL expression rather than a string literal
- `$inferSelect` and `$inferInsert` are available directly on table objects in drizzle-orm 0.30.x
- `drizzle.config.ts` sits outside `src/` (tsconfig `include` scope). Needs `/// <reference types="node" />` directive to resolve `process.env` types for LSP
- drizzle-kit version compatibility matrix for drizzle-orm 0.30.10: only 0.21.x works. 0.22.x+ all reject it with "requires newer version of drizzle-orm"

## T08 Learnings (2026-04-10)

- Hono `Context` type should be imported as `type Context` from `'hono'` — do NOT try to extract it from method signatures like `Parameters<Parameters<Hono['get']>[1]>[0]`, it resolves to `never`
- `validateSession()` in `auth.ts` takes raw `better-sqlite3` `Database` (the `sqlite` export), not the drizzle `db` wrapper
- SQLite UNIQUE constraint failures throw `Error` with message containing `'UNIQUE constraint failed'` — catch with `err.message.includes(...)` for 409 responses
- `resolveFamily` pattern: read session cookie → validate session → query `family_members` for userId → return familyId. This will be refactored into shared T06 middleware later
- Hono sub-router mounting: `app.route('/api/tags', tagsRouter)` — the sub-router handlers use relative paths (`'/'`, `'/:id'`)

## T09 Learnings (2026-04-10)

- Router mounted at `/api` (not `/api/images`) so that `/upload/presign`, `/recipes/:id/images`, and `/images/:id` all live under one router without a shared prefix
- `authMiddleware` from T06 uses `createMiddleware<AuthEnv>()` — consuming routers must declare the same `AuthEnv` type locally to get typed `c.get('user')` / `c.get('familyId')`
- `getPresignedUploadUrl` throws if COS env vars are missing — wrapping in try/catch at route level is required since COS config is optional in env schema
- `recipeImages` has no `familyId` column — ownership checks for DELETE must join through `recipes.familyId`
- Drizzle `innerJoin` + `where` works for ownership validation: `from(recipeImages).innerJoin(recipes, ...).where(and(imageId, familyId))`
- `contentType` param is optional in `getPresignedUploadUrl` (defaults to `image/jpeg`), so passing `undefined` from missing query param is safe

## T10 Learnings (2026-04-10)

- Drizzle `sql` tag from `drizzle-orm` is needed for dynamic IN clauses: `sql\`\${column} IN (\${sql.join(...)})\``
- `sql.join()` takes an array of `sql\`\${val}\`` fragments and a separator like `sql\`, \``
- For list endpoints with nested items, 2-query approach (orders, then joined items) grouped in memory avoids N+1 and is simpler than a single flattened join that requires de-duplication
- `sqlite.transaction(() => { ... })()` — note the trailing `()` for immediate invocation; the return value is the transaction function's return
- `notifyNewOrder` is fire-and-forget (returns `void`), safe to call outside transaction
- Left join on `recipeImages` with `sortOrder = 0` reliably gets first image; returns null columns when no image exists
- Status state machine: `VALID_TRANSITIONS` map enforces pending→confirmed→completed only; Zod enum on input restricts to valid target values, transition map rejects invalid jumps
- `orders.familyId` is the ownership column — all endpoints filter by it to enforce family isolation

## T10 Fix Learnings (2026-04-10)

- `inArray` from `drizzle-orm` handles both single and multi-value IN clauses cleanly — no need for `sql.join` or length-1 special-casing
- Query param validation should happen early with a known-values Set, not silently pass unknown values to WHERE clauses
- When recipe ownership is already validated before transaction, a Map lookup for titles is O(1) per item and avoids the possibility of fallback empty strings leaking into notifications
- Zod `.default(1)` on quantity makes the field optional in input but always populated in parsed output — matches DB column `DEFAULT 1`

### T16 Implementation Learnings
- Frontend Hono RPC `typeof app` types can be lost if routes are not chained in `backend/src/index.ts`. I had to fallback to manual typings via `fetch` inside `useRecipes.ts` and declare `client: any` to satisfy the strict frontend TS compilation.
- Gracefully handled the missing image association API in `recipes.ts` by performing the COS upload but continuing without throwing when associating to the recipe. 
- Implemented optimistic UI for the `favorite` mutation since there wasn't a dedicated endpoint described in the backend routes file.

### T16 Implementation Issues Fix
- When replacing Hono generic typings on the client, instead of exporting `export const client: any = hc(...)` which defeated typing, an exact local wrapper with typed `fetch` methods was defined in `api.ts`. This safely typed API calls natively, kept `upload.ts` happy, and adhered to `no-any` rules without backend changes.
- Discovered and fixed a memory/URL-revoke bug in `RecipeForm.tsx` where React's `useEffect` was revoking the `ObjectURL` directly on state array change (e.g. adding a second photo removed the preview of the first). Now, ObjectURLs are tracked through a mutable `useRef` and specifically only revoked upon component unmount and explicitly inside the `removeImage` action.

### T16 Final Logic Fixes
- `useRecipes` query correctly converted to `useInfiniteQuery` mapped to the `pageParam` cursor, fixing the Home "Load More" pagination bug (from resetting the DOM to actually appending via `pages.flatMap`).
- Migrated all loose native `fetch` operations across `api.ts` and `useRecipes.ts` to strictly append `{ credentials: 'include' }` and `${baseUrl}`. This natively integrates frontend requests with the cookie-based session logic across all environments.
- Implemented `useSaveRecipeImage` to trigger `POST /api/recipes/:id/images`. It runs post-creation or post-update over freshly uploaded objects resolving the "images unlinked to recipe" gap.

### T17 Frontend Orders Implemented (2026-04-11)
- Created `useOrders.ts` which provides `useOrders`, `useOrder`, `useCreateOrder`, and `useUpdateOrderStatus` using `@tanstack/react-query` based on T10's API contract.
- Added `OrderList.tsx` mapped to `/orders` which groups orders by `mealDate`, handles status transitions (pending -> confirmed -> completed), and renders items appropriately.
- Added `OrderCreate.tsx` mapped to `/order/create` which enables specifying meal type, date, note, and searching/selecting recipes with quantities.
- Integrated `/orders` into navigation in `layout.tsx` and protected routes in `App.tsx`.
- Ensured all typings are strict, removing `any` where applicable.
- Validated correct build logic via `cd frontend && npm run build` and `npm run lint`.

### T17 Bug Fix (2026-04-11)
- Fixed an issue where frontend orders hooks (`useOrders.ts`) were calling `/orders` instead of `/api/orders`. The API `baseUrl` environment variable acts only as the domain, so explicit `/api` pathing is required in all fetch routes, mimicking the established `useRecipes.ts` setup.

### T22 PWA Config - Node Version Compatibility
- The development environment runs Node `18.17.1`, which caused compatibility issues with `workbox-build@7.4.x` (requires `glob@11` which requires Node >= 20, leading to a `tracingChannel is not a function` error).
- **Solution:** Downgraded `vite-plugin-pwa` to `^0.17.0` along with an override for `glob: 10.4.5` (if needed) to ensure `npm run build` succeeds under Node 18 without breaking glob-based precache injection.

### T24 Backup Script Learnings (2026-04-11)
- Backend COS values are already named `COS_BUCKET` and `COS_REGION` in `backend/.env`, so the backup template can stay simple and env-driven while keeping the required order: `sqlite3 .backup` → `coscli cp` → `find -mtime +30 -delete`.

### T19: Profile/Family Page (Frontend)
- The React Query hook `useCurrentUser`'s returned `User` interface in `frontend/src/hooks/useAuth.ts` originally lacked `role` and `familyId`. They were returned by the `/api/auth/me` backend route but missing from the frontend type definition. Added them to support role and familyId logic in the frontend.
- Extracted shared fetching logic using `apiFetch` in new hooks like `useFamily` and `useFamilyMembers`. This kept things clean and adhered to the "no bare fetch" constraint.
- The `RequireAuth` component elegantly intercepts unauthenticated access, meaning `useLogout` invalidating the query safely redirects to `/login` without extra logic scattered around individual pages.

- For Chinese localized UI, ensure all user-facing notification messages like toast copy feedback strictly follow the requested copy (e.g., `已复制` instead of "Copied!") per plan requirements.

## T26 Learnings (2026-04-11)

- Cloudflare Pages SPA fallback is satisfied by `frontend/public/_redirects` with `/* /index.html 200`, and Vite carries it into `dist/_redirects` during build.
- Switching the frontend client from `VITE_API_URL` to `VITE_API_BASE_URL` keeps production configurable without disturbing the existing cookie-based `credentials: 'include'` request behavior.

### T16: Recipe Pages Completion
- Implemented multi-image carousel on the Recipe Detail page using React state (`currentImageIndex`).
- Optimistically updated favorites on the Home page/Recipe Listing without changing the backend API or `useRecipes` hooks by instead subscribing to `useFavorites()` and `useToggleFavorite()` in `RecipeCard.tsx` directly.
- Avoided removing or modifying `upload.ts` to preserve XHR progress functionalities for image uploads.
- Enhanced UI by adopting the `glass-card` styling for new components and integrating pagination directly with `useInfiniteQuery` via a "Load More" button.
