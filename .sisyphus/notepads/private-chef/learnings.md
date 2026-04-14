
## T01 Learnings (2026-04-10)

- Vite 5.x scaffolded project uses composite TypeScript (`tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`). Path aliases must go in `tsconfig.app.json` compilerOptions, not root `tsconfig.json`.
- drizzle-kit config: use `dialect: 'sqlite'` + `dbCredentials: { url: '...' }` for v0.30+. Old `driver: 'better-sqlite3'` format is deprecated.
- Backend `type: "module"` in package.json is required for ESNext module resolution with tsx/tsc.
- `@types/node` must be explicitly added to backend `tsconfig.json` types array when using `type: "module"` to get `process`, `crypto` globals.
- `crypto.randomUUID()` is available natively in Node 18+ without any import.

## T06 Learnings (2026-04-10)

- Hono has built-in `cors` middleware at `hono/cors` — no need to write custom CORS headers.
- Hono `createMiddleware<Env>` from `hono/factory` properly types `c.set()`/`c.get()` with `Variables` in the Env type parameter.
- `setCookie`/`getCookie`/`deleteCookie` from `hono/cookie` work well for session cookie management.
- Auth middleware pattern: `createMiddleware` that reads cookie → validates session → queries user + family membership → sets context variables. Sub-routers can apply it with `router.use('/path', authMiddleware)`.
- For transactions involving raw SQL inserts (user + family + membership bootstrap), use `sqlite.transaction()` directly since the session helpers already use raw `sqlite`.
- The `authRouter` is typed with `Hono<AuthEnv>` where `AuthEnv = { Variables: { user: AuthUser; familyId: number } }` — this makes `c.get('user')` and `c.get('familyId')` type-safe on protected routes.
- `deleteCookie` requires `{ path: '/' }` option to match the path used in `setCookie`, otherwise the cookie won't be cleared.

## T07 Learnings (2026-04-10)

- Raw `sqlite.prepare().all()/.get()` is the cleanest way to write complex JOINs with subqueries in better-sqlite3 + drizzle. The drizzle query builder doesn't support correlated subqueries well for avg/first-image patterns.
- For paginated list with tag filter + search, a 3-step approach works well: (1) count, (2) fetch IDs, (3) batch fetch details + tags. This avoids N+1 while keeping logic manageable.
- `better-sqlite3` `.all()` spread syntax requires `as [T, ...T[]]` type assertion to satisfy TypeScript's rest parameter typing.
- Delete cascade: `recipe_tags`, `recipe_images`, `favorites` have `onDelete: cascade` in schema, but `cook_logs` and `wishes` do NOT. Must explicitly delete ratings (via cook_log subquery), cook_logs, and SET NULL on wishes before deleting a recipe.
- `order_items.recipe_id` uses `onDelete: 'restrict'` — SQLite throws "FOREIGN KEY constraint failed" which maps to 409.
- The `recipes` schema does NOT have a `difficulty` column. The Zod schema includes it for future compatibility but the value is not stored.
- **List endpoint fix**: Replaced the fragile 3-step (count → IDs → batch) pattern with a 2-step approach: (1) count query, (2) subquery-paged main query with outer JOINs for first_image + avg_rating, followed by a single tags batch query. The subquery ensures deterministic pagination with `ORDER BY created_at DESC, id DESC`, and the outer query preserves that order.
- **Parameterized WHERE construction**: Use `filterWhere: string[]` + `filterParams: unknown[]` arrays, push conditionally, then `filterWhere.join(' AND ')`. Much safer than conditional ternary SQL interpolation.
- **Alias rewriting for subqueries**: When the subquery needs the same WHERE/JOIN clauses but with a different table alias (e.g., `sub` instead of `r`), use `.replace(/\br\./g, 'sub.')` on the filterSQL string. Works safely for simple column references.
- **Auth is cookie-based**: The app uses session cookies (`session` cookie), not Bearer tokens. Use `curl -c cookiejar -b cookiejar` for testing.
- **DB recreation**: When the SQLite DB file is deleted, `drizzle-kit push` recreates all tables from the schema. The server starts but returns 500s if tables are missing.
- **Create recipe response**: `POST /api/recipes` returns the recipe object at root level (`{id, title, ...}`), not wrapped in `.recipe`.
- **List response shape**: `GET /api/recipes` returns `{ data, total, page, limit }` — no `recipes` key, no `totalPages` field.
- **T15 Learnings:** When exporting `AppType` from Hono backend, if `app.route()` is called without chaining, the exported type resolves to `Hono<BlankEnv, BlankSchema, '/'>` losing all typed routes. The frontend then fails to typecheck `client.api` properties, resulting in `TS18046: 'client' is of type 'unknown'` errors. This requires either chaining routes in the backend or defining mock schemas in the frontend.
- **T15 Learnings (Fix):** Replacing the broken `AppType` with a tiny typed `fetch` wrapper mimicking the `client.api` structure avoids `any` entirely, keeping T15 perfectly decoupled from T16 backend/UI drift.
- **T15 Learnings (Fix Home.tsx):** When returning useInfiniteQuery from custom hooks like useRecipes, consumers must process .pages.flatMap(page => page.data) instead of directly accessing .data or .total to avoid Property does not exist on type InfiniteData errors.

## T23 Learnings (2026-04-11)

- For this backend, the safest real-DB Vitest pattern is: create temp SQLite path → set `process.env.DATABASE_PATH` and `NODE_ENV=development` → `vi.resetModules()` → dynamically import `src/db/index.ts`/`src/app.ts` so the singleton rebinds to that database.
- Importing `src/index.ts` is unsafe for tests because it starts the Hono server on import. Extracting the unchanged route wiring into `src/app.ts` keeps runtime behavior intact while giving tests a side-effect-free app import.
- `better-sqlite3` WAL mode leaves `test.db-wal` and `test.db-shm`; cleanup must close the sqlite handle first, then delete the DB, WAL, and SHM files to avoid leakage between suites.
- Node 18 + Vitest in this repo did not expose global `crypto` during the tests, so the test helper must install `globalThis.crypto = webcrypto` before importing modules that call `crypto.randomUUID()`.

## T21 Learnings (2026-04-11)

- Chaining Hono route mounts in `backend/src/app.ts` preserves `AppType` route inference better than imperative `app.route(...)`, and a single `app.onError(...)` can centralize Zod + SQLite UNIQUE handling without changing the route-level auth model.

## T25 Learnings (2026-04-11)

- In a backend package with `type: "module"`, an `ecosystem.config.js` template can stay practical by exporting a default object for ESM while also exposing `module.exports` behind a `typeof module !== 'undefined'` guard so PM2/CommonJS-style consumers still have a workable path.

## T18 Refactor Learnings (2026-04-11)

- Frontend `❌ 不使用裸 fetch` constraint: Direct `fetch` usage in hooks triggers AST-based rule violations in this codebase.
- Extracting a tiny typed `apiFetch` wrapper inside `frontend/src/lib/api.ts` that handles base URL prefixing, `credentials: 'include'`, and default `Content-Type: application/json` keeps the React Query hooks clean, avoids `any`/`@ts-ignore`, and satisfies the no-bare-fetch rule.
- This approach is minimally invasive and maintains the existing JSON error-handling pattern without redesigning the entire networking layer.

## T19 Learnings (2026-04-11)

- For plan-driven UI work, user-facing copy must match the spec exactly; even a working clipboard action was not acceptable until the toast feedback used the required Chinese text `已复制`.

- Implemented AppLayout and TabBar using glass-nav and fixed positioning. TabBar simplifies mobile-centric navigation replacing the old layout. RequireAuth is now baked into AppLayout.

## T24 Learnings (2026-04-11)

- SQLite backup automation must use `sqlite3 .backup` rather than file copy tools, and a minimal deploy-safe template can keep COS destination assembly in shell variables while still preserving the required backup -> upload -> cleanup order.

## T26 Learnings (2026-04-11)

- For Cloudflare Pages SPA deployment, a committed `public/_redirects` file is enough to carry the fallback rule into `dist/`, and the frontend API base should come from `VITE_API_BASE_URL` so development can keep using the local Vite proxy while production points at a real API domain.

## T16 Final Learnings (2026-04-11)

- The recipe create/upload flow was functionally blocked by COS bucket CORS rather than frontend code. Once the bucket allowed the frontend origin for browser XHR PUT uploads, the existing `upload.ts` flow completed successfully, recipe image records were persisted, and the new multi-image detail carousel could be verified on a real created recipe.

## T27 Learnings (2026-04-11)

- COS bucket `weilan-1254036222` CORS was set via `backend/node_modules/cos-nodejs-sdk-v5` and verified live. The working rule allows `http://127.0.0.1:5178`, `http://localhost:5173`, and `https://weilanshanshan.top` with `GET`, `PUT`, `POST`, `HEAD`, wildcard request headers, and exposed `ETag` / `Content-Length` / COS request IDs.
