
## T01 — Lucia v3 Decision (2026-04-10)

**Decision**: Use fallback manual session helper instead of Lucia v3.

**Reason**: Both `lucia@3.2.2` and `@lucia-auth/adapter-sqlite@3.0.2` are marked deprecated on npm with message "This package has been deprecated. Please see https://lucia-auth.com/lucia-v3/migrate." They were installed and immediately uninstalled.

**Fallback**: Created `backend/src/lib/auth.ts` with manual session management:
- `hashPassword(password)` — uses `@node-rs/argon2` hash()
- `verifyPassword(hash, password)` — uses `@node-rs/argon2` verify()  
- `generateSessionId()` — uses `crypto.randomUUID()`
- `sessionExpiresAt()` — returns Date 30 days from now

**Impact for T06**: T06 auth task MUST use the manual session approach. Do NOT attempt to use Lucia. The `sessions` table schema is already defined in `src/db/schema.ts`. Auth logic will use `generateSessionId()`, store in DB, and validate against DB directly.

## T01 Fix — Version Corrections (2026-04-10)

- `zod@4.3.6` → downgraded to `zod@3.25.76` (spec requires 3.x)
- `drizzle-orm@0.45.2` → downgraded to `drizzle-orm@0.30.10` (spec requires 0.30.x)
- Required `--legacy-peer-deps` due to vitest@4 peer dep conflict with @types/node@18
- drizzle-kit@0.31 remains — compatible with drizzle-orm@0.30

## T01 Fix — auth.ts session functions (2026-04-10)

Added three required session functions taking `db: Database.Database` as first param:
- `createSession(db, userId)` — inserts row, returns Session
- `validateSession(db, sessionId)` — returns Session or null, auto-deletes expired
- `deleteSession(db, sessionId)` — deletes row
Kept existing `hashPassword` and `verifyPassword`. Removed `generateSessionId` and `sessionExpiresAt` helpers (inlined into createSession).

## T01 Fix — @node-rs/argon2 downgrade (2026-04-10)

- `@node-rs/argon2@2.0.2` → downgraded to `@node-rs/argon2@1.8.3` (spec requires 1.x)
- v1 exports identical `hash` and `verify` functions — `backend/src/lib/auth.ts` unchanged

## T06 — Auth Middleware Pattern (2026-04-10)

**Decision**: Canonical auth middleware at `backend/src/middleware/auth.ts` using `createMiddleware<AuthEnv>` from `hono/factory`.

**Pattern**: Reads `session` cookie → validates via `validateSession(sqlite, sessionId)` → fetches user from `users` table → fetches family membership from `family_members` → injects `user: AuthUser` and `familyId: number` into Hono context.

**Exports**: `authMiddleware` (the middleware) and `AuthUser` type (for consumers).

**Usage**: Protected routes apply with `router.use('/path', authMiddleware)`. Unprotected routes (register, login, logout) are defined before middleware is applied.

**CORS**: Uses Hono built-in `cors()` from `hono/cors`, mounted globally as `app.use('*', corsMiddleware)` before any routes.

**Impact for T15+**: Frontend auth pages should POST to `/api/auth/register` and `/api/auth/login`, cookies are set automatically. Protected API routes will have `user` and `familyId` available via `c.get('user')` and `c.get('familyId')`.

## T23 — Testable App Bootstrap Decision (2026-04-11)

**Decision**: Extract the existing Hono route wiring from `backend/src/index.ts` into `backend/src/app.ts`, exporting `createApp()` and `app`, while leaving `src/index.ts` responsible only for `serve(...)` startup.

**Reason**: The backend entrypoint auto-started the server on import, which prevented isolated Vitest integration tests from importing the real routers/middleware safely after overriding `DATABASE_PATH`.

**Impact**: Production runtime behavior stays the same, but tests can now dynamically import `src/app.ts` after rebinding the SQLite singleton to a fresh temp database for each case.
