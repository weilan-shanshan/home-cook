
## T01 Issues (2026-04-10)

1. **Node.js v18.17.1** — System runs Node 18.17.1. `create-vite@latest` (v9) requires `^20.19.0 || >=22.12.0`. Used `create-vite@5` (Vite 5.x) instead — matches spec requirement of Vite 5.x.

2. **npm cache root-owned files** — `/Users/weilan/.npm/_cacache` had root-owned files causing EACCES on install. Workaround: all npm installs used `--cache /Users/weilan/ali/ai/cook/.npm-cache` pointing to a user-owned dir.

3. **hono needed in frontend** — Frontend `src/lib/api.ts` imports from `hono/client`. Hono must be installed in both frontend (for `hc` client types) and backend. The T01 spec only lists hono in backend deps; added `hono@4` to frontend too.

4. **@node-rs/argon2 installed v2 not v1** — npm resolved `@node-rs/argon2@^2.0.2`. Spec says v1.x. The API is compatible; hash/verify work the same way.

5. **drizzle-kit v0.31** — Uses `dialect: 'sqlite'` (not `driver: 'better-sqlite3'`) in drizzle.config.ts for v0.30+. Spec shows old format — used correct new format.
