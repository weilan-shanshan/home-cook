# Window 1 implementation knowledge base

This document summarizes the foundational implementation details from Window 1 (T01, T06, T07, T15, T21, T25). It serves as a technical handbook for AI agents to understand the system architecture, key contracts, and critical implementation decisions.

## Window 1 Ownership Summary
Window 1 built the core infrastructure of the Private Chef application, including:
- **T01/T06**: Manual auth system (cookie-based), DB schema, and session middleware.
- **T07**: Core Recipe API (CRUD, filtered list with complex JOINs).
- **T15**: Frontend Auth (Login/Register).
- **T21**: Backend route consolidation, global error handling, and `notifyNewRecipe` integration.
- **T25**: Production deployment templates and PM2 configuration.

---

## Domain & Production Assumptions
- **Frontend Domain**: `https://weilanshanshan.top`
- **API Domain**: `https://api.weilanshanshan.top`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Defined in `frontend/src/lib/api.ts` as `import.meta.env.VITE_API_BASE_URL || ''`.
  - **CAUTION**: There is a documented mismatch where `frontend/src/lib/api.ts` uses `VITE_API_BASE_URL`, but `.env.example` currently defines `VITE_API_URL=https://api.weilanshanshan.top`. Always verify the variable name in `api.ts` before use.
- **Development Proxy**: `vite.config.ts` includes a proxy for `/api` pointing to `http://localhost:3000`.

---

## Auth Architecture & Contracts
### Manual Session Management
Lucia was rejected due to deprecation. We use a manual session implementation in `backend/src/lib/auth.ts`.
- **Method**: Cookie-based sessions (not Bearer tokens).
- **Cookie Name**: `session`
- **Security**: HttpOnly, SameSite: Strict, Secure (in production).
- **Hashing**: `@node-rs/argon2` (v1.8.3).

### Auth Middleware & Scoping
- **Location**: `backend/src/middleware/auth.ts`
- **Context Injection**: Injects `user` (AuthUser) and `familyId` (number) into Hono context.
- **Access**: `c.get('user')` and `c.get('familyId')`.
- **Constraint**: Data (recipes, orders, etc.) is scoped by `familyId`.

---

## API Data Contracts
### Recipe List (`GET /api/recipes`)
- **Response Shape**: `{ data: Recipe[], total: number, page: number, limit: number }`
- **Notes**: Returns the object at root (no `recipes` key). Uses deterministic pagination via `ORDER BY created_at DESC, id DESC`. Includes complex JOINs for `first_image` and `avg_rating`.

### Recipe Create (`POST /api/recipes`)
- **Response Shape**: Returns the created recipe object at the root level: `{ id, title, ... }`.
- **Integration**: Triggers `notifyNewRecipe` (wechat notification) upon successful creation (T21).

### Global Error Handling
Consolidated in `backend/src/app.ts`:
- **400**: Zod validation errors (returns `details: error.flatten()`).
- **409**: SQLite UNIQUE constraint failures.
- **500**: Generic internal errors.

---

## Frontend Integration (T15)
### Auth Implementation
- **Pages**: Implemented `Login.tsx` and `Register.tsx`.
- **API Wrapper**: Uses a thin typed `client.api.auth` structure in `frontend/src/lib/api.ts` which wraps bare `fetch` calls.
- **Auth Persistence**: The `client` wrappers explicitly include `credentials: 'include'` for session cookie persistence.
- **Handoff Note**: To maintain stability and avoid dependency on backend type drift, T15 uses these manual wrappers rather than relying on full Hono `hc` type inference across the boundary.

---

## File Layout & Key Locations (Window 1)
### Backend
- `src/app.ts`: Canonical backend composition. Use `.route()` chaining to preserve `AppType` inference.
- `src/db/schema.ts`: Drizzle schema definitions.
- `src/lib/auth.ts`: Session lifecycle logic.
- `src/middleware/auth.ts`: Auth protection middleware.
- `src/routes/recipes.ts`: Recipe CRUD and list logic.

### Frontend
- `src/lib/api.ts`: Central location for `baseUrl`, `apiFetch` helper, and the typed `client` auth wrappers.
- `src/hooks/useAuth.ts`: Auth state management using the `client.api.auth` wrappers.

---

## Deployment & Build (T25)
### Package Structure
- **Root `backend/package.json`**: CommonJS (supports `ecosystem.config.js` requirements).
- **`backend/dist/package.json`**: `{ "type": "module" }` to allow ESM execution of compiled code.
- **PM2**: `backend/ecosystem.config.js` is the production config.

### Build/Deploy Order
1. `npm ci`
2. `npm run build`
3. `npm prune --omit=dev`

---

## Out of Scope / Do Not Attribute to Window 1
The following were **NOT** built by Window 1 and should not be assumed to be part of its baseline:
- `AppLayout.tsx`, `TabBar`, and navigation glass-nav styling.
- `useRecipes.ts` and general Infinite Query hooks.
- COS Bucket CORS configuration.
- Recipe Image upload flow/logic.

---

## Pitfalls & "Do Not Break"
1. **Don't switch to Lucia**: It's deprecated. Stick to the `backend/src/lib/auth.ts` logic.
2. **Session Cookies**: Always ensure `credentials: 'include'` in frontend requests or auth will fail.
3. **Cascade Deletes**: `recipes` deletion requires manual cleanup of ratings, logs, and setting wishes to NULL.
4. **AppType Exports**: Always chain route mounts in `app.ts`. Non-chained `app.route()` calls break route inference for the frontend.
5. **SameSite=Strict**: Auth cookies use `Strict` in production; ensure frontend requests are strictly same-site.
6. **VITE_API_BASE_URL**: Be precise with this env var name; do not assume `VITE_API_URL` is used.
