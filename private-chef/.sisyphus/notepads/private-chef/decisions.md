## T02 Decisions (2026-04-10)

- Named session type export `SessionRecord` (not `Session`) to avoid collision with `Session` type in `backend/src/lib/auth.ts`
- Used inline `.references()` on FK columns instead of `foreignKey()` in extraConfig — cleaner, sufficient for single-column FKs
- Composite unique constraints use explicit names (`tags_family_id_name_unique`, `ratings_cook_log_id_user_id_unique`) for stable migration diffs
- `seed.ts` creates a default admin user ("chef") with family "我们家" and invite code "888888" plus 8 default Chinese cuisine tags — strictly optional, for dev convenience
- Downgraded `drizzle-kit` from `0.31.10` to `0.21.4` to stay compatible with `drizzle-orm@0.30.10` (project spec)
- Manually added `CHECK(\`score\` >= 1 AND \`score\` <= 5)` to the generated migration SQL since drizzle-kit 0.21.4 doesn't emit check constraints. The `check()` in schema.ts remains as ORM-level documentation

## T08 Decisions (2026-04-10)

- Inlined `resolveFamily()` auth helper in `tags.ts` rather than creating shared middleware (T06 not yet done). Uses `Context` type from Hono for the parameter
- Family resolution picks the first `family_members` row for the user (`.limit(1)`). Multi-family support would need a family selector header/param, but current design assumes one family per user
- Tag creation catches SQLite UNIQUE constraint error by message string matching rather than error codes, since `better-sqlite3` doesn't expose structured error codes
- DELETE endpoint uses `db.delete().where(and(id, familyId)).returning()` as a single atomic ownership-check-and-delete query, returning 404 when no rows affected

### T16 Design Decisions
- Utilized TanStack Query for all recipes, tags, and optimistic fav interactions to ensure clean loading and error states.
- Followed React Router v7 data-router pattern with nested `<Outlet />` inside the custom `<Layout>` to share the `glass-nav`.
- `RecipeCard` implements `glass-card` classes with an elegant hover state over the whole card wrapper.
- Implemented multi-image upload progress through `browser-image-compression` and `XMLHttpRequest.upload.onprogress`. Object URLs are correctly revoked upon image removal or component unmount.
- Bypassed Hono generic typing `AppType` errors on the client side since the backend exports weren't chained, thereby maintaining the strict rule of NOT modifying backend files.

- [2026-04-11] Replaced HomePlaceholder with proper routing in App.tsx. Wrapped protected routes (/, /recipe/new, /recipe/:id, /recipe/:id/edit) with Layout inside a RequireAuth wrapper to restore the full application shell.
