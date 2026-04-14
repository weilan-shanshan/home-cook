# Deployment Runbook

> This file is the current deployment source of truth for `private-chef/`.
>
> If another document conflicts with this file on **current deployment reality**, use this file first.

---

## 1. Current Deployment Truth

### Frontend

- **Current production path**: Cloudflare Pages
- **Frontend app path**: `private-chef/frontend`
- **Build command**: `npm run build`
- **Build output**: `private-chef/frontend/dist`
- **SPA fallback file**: `private-chef/frontend/public/_redirects`

### Backend

- **Current backend app path**: `private-chef/backend`
- **Current deploy script**: `private-chef/backend/scripts/deploy.sh`
- **Current process manager in repo**: PM2 via `private-chef/backend/ecosystem.config.cjs`
- **Backend local service port**: `3000`
- **Public API hostname in repo config**: `https://api.weilanshanshan.top`
- **Cloudflare Tunnel config file**: `private-chef/backend/cloudflared-config.yml`

### Important current-state rule

- **Cloudflare Pages is the current frontend deployment path.**
- **Tencent Cloud integrated frontend+backend same-host deployment is not current reality.**
- If future docs discuss Nginx-hosted frontend on Tencent Cloud, treat that as a candidate/future path unless this runbook is updated.

---

## 2. Look Here First

Use this section for fast AI triage.

| Symptom | First check | Why |
|---|---|---|
| Frontend build fails | `private-chef/frontend/package.json` | Confirms build command and toolchain |
| Frontend deployed but API calls fail | `private-chef/frontend/.env.production` and `private-chef/frontend/src/lib/api.ts` | Confirms API base URL actually used in production |
| Login works locally but fails online | `private-chef/backend/src/middleware/cors.ts` and backend env `FRONTEND_ORIGIN` | CORS + credential cookies are the first likely cause |
| API hostname unreachable | `private-chef/backend/cloudflared-config.yml` | Confirms tunnel hostname and backend port mapping |
| Backend deploy fails | `private-chef/backend/scripts/deploy.sh` | Shows actual remote deploy steps |
| Backend process restarts badly or stays down | `private-chef/backend/ecosystem.config.cjs` | Confirms PM2 app name, entry file, and log paths |
| DB errors or migration issues | `private-chef/backend/src/lib/env.ts` and `private-chef/backend/drizzle.config.ts` | Confirms SQLite path source |
| Upload/presign fails | `private-chef/.env.example` and backend env file | COS variables are required |
| Frontend deep links 404 | `private-chef/frontend/public/_redirects` | Cloudflare Pages SPA fallback depends on this file |
| Auth request has no cookie | frontend `api.ts` + backend `cors.ts` | Frontend uses `credentials: 'include'`, backend must allow the origin |

---

## 3. Repo Files That Matter

| File | Purpose |
|---|---|
| `private-chef/frontend/package.json` | Frontend build and local preview commands |
| `private-chef/frontend/.env.production` | Production frontend API base URL |
| `private-chef/frontend/src/lib/api.ts` | Exact runtime API URL composition and cookie behavior |
| `private-chef/frontend/public/_redirects` | Cloudflare Pages SPA routing fallback |
| `private-chef/backend/package.json` | Backend build, local start, deploy, and migration commands |
| `private-chef/backend/scripts/deploy.sh` | Actual remote backend deploy steps |
| `private-chef/backend/ecosystem.config.cjs` | PM2 app name, script entry, log file locations |
| `private-chef/backend/cloudflared-config.yml` | Public API hostname → local backend port mapping |
| `private-chef/backend/src/lib/env.ts` | Backend env contract |
| `private-chef/backend/src/middleware/cors.ts` | Allowed frontend origin logic |
| `private-chef/backend/drizzle.config.ts` | SQLite migration DB path source |
| `private-chef/.env.example` | Shared env variable inventory |
| `private-chef/私厨-技术方案.md` | Historical design reference; do not use it over this runbook for current deployment truth |

---

## 4. Shared Environment And Config Inventory

Do not copy real secret values into this document. Use file paths and variable names only.

### Backend env

Defined in practice by `private-chef/.env.example` and validated by `private-chef/backend/src/lib/env.ts`:

- `PORT`
- `NODE_ENV`
- `DATABASE_PATH`
- `FRONTEND_ORIGIN`
- `SESSION_SECRET`
- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `COS_BUCKET`
- `COS_REGION`
- `WECHAT_WEBHOOK_URL`

Important distinction:

- `private-chef/backend/src/lib/env.ts` does **not** hard-require `SESSION_SECRET`, COS variables, or `WECHAT_WEBHOOK_URL` at startup.
- They are still operationally important for auth, upload, and webhook-related behavior.
- Do not assume “backend booted successfully” means these values are configured correctly.

### Frontend env

- `VITE_API_BASE_URL`

### Highest-risk env mismatches

- `VITE_API_BASE_URL` wrong → frontend points at wrong API host
- `FRONTEND_ORIGIN` wrong → browser login/auth requests fail due to CORS/cookie rejection
- `DATABASE_PATH` wrong → backend cannot read the expected SQLite DB
- Missing COS vars → upload / presign endpoints fail
- `COS_REGION` mismatch → upload flow may fail in confusing ways

### Backend runtime env source

- `private-chef/backend/scripts/deploy.sh` and `private-chef/backend/ecosystem.config.cjs` only make the PM2 start/restart path explicit.
- `ecosystem.config.cjs` injects `NODE_ENV` and `PORT`, but not the full production env set.
- Future AI operators should assume the remaining backend runtime values must come from the server environment and/or a backend `.env` file on the host, then verify that assumption on-server before changing anything.

### COS region note

- `private-chef/.env.example` shows `COS_REGION=ap-beijing`
- `private-chef/backend/src/lib/env.ts` defaults `COS_REGION` to `ap-guangzhou`
- If `COS_REGION` is omitted in production, code default and operator expectation may diverge.

---

## 5. Frontend Deployment

### Current truth

- Hosting: **Cloudflare Pages**
- App dir: `private-chef/frontend`
- Build command: `npm run build`
- Output dir: `dist`
- Production env file: `private-chef/frontend/.env.production`
- API URL source: `private-chef/frontend/src/lib/api.ts`

### How frontend API calls are built

`private-chef/frontend/src/lib/api.ts` uses:

- `import.meta.env.VITE_API_BASE_URL || ''`
- API requests use `credentials: 'include'`

This means:

- production must have the correct `VITE_API_BASE_URL`
- backend must allow the Cloudflare Pages origin via `FRONTEND_ORIGIN`
- auth failures are often backend-origin mismatches, not frontend code bugs
- if `VITE_API_BASE_URL` is missing, frontend requests fall back to relative paths such as `/api/...` against the Pages host, which is a specific misconfiguration pattern to check first

### Standard frontend deploy procedure

1. Confirm `private-chef/frontend/.env.production` has the intended production API host.
2. Run:

   ```bash
   cd private-chef/frontend
   npm run build
   ```

3. Confirm output exists:

   - `private-chef/frontend/dist`
   - `private-chef/frontend/dist/_redirects`

4. Deploy `dist/` through Cloudflare Pages using either:

   - GitHub-connected automatic deployment, or
   - `npx wrangler pages deploy dist`

5. After deploy, verify:

   - homepage loads
   - deep-link route does not 404
   - API requests hit the correct host
   - login/auth still works with cookies

### Frontend troubleshooting

#### A. Frontend build fails

Check in this order:

1. `private-chef/frontend/package.json`
2. TypeScript/Vite errors from `npm run build`
3. Whether recent code assumes missing env or server behavior

#### B. Frontend deployed but API requests fail

Check in this order:

1. `private-chef/frontend/.env.production`
2. `private-chef/frontend/src/lib/api.ts`
3. Browser network panel: actual request URL
4. Backend `FRONTEND_ORIGIN` value
5. Whether requests have silently become relative `/api/...` calls because `VITE_API_BASE_URL` resolved to `''`

#### C. Frontend route refresh returns 404

Check:

1. `private-chef/frontend/public/_redirects`
2. Whether Cloudflare Pages build output contains `_redirects`

#### D. Auth/login fails only in production

Check:

1. frontend request includes `credentials: 'include'`
2. backend CORS allows the request origin with the same protocol
3. `FRONTEND_ORIGIN` is set to the intended production frontend host
4. remember `private-chef/backend/src/middleware/cors.ts` allows localhost, exact configured host, or subdomains of the configured host
5. production API host is HTTPS and matches expected cookie flow

---

## 6. Backend Deployment

### Current truth

- Host type in repo docs: Tencent Cloud server
- App dir: `private-chef/backend`
- Deploy script: `private-chef/backend/scripts/deploy.sh`
- Remote repo dir in deploy script: `/data/private-chef`
- PM2 app name: `private-chef-api`
- PM2 entry file: `dist/index.js`
- PM2 log files:
  - `/data/private-chef/logs/error.log`
  - `/data/private-chef/logs/out.log`
- Backend listens on local port `3000`
- Tunnel routes `api.weilanshanshan.top` → `http://127.0.0.1:3000`
- Remote backend SSH target: `ubuntu@101.42.108.88:/data/private-chef/backend/`

### Standard backend deploy procedure

The repo’s current deploy path is encoded in `private-chef/backend/scripts/deploy.sh`.

It does this:

1. SSH to the configured server
2. `git pull --ff-only origin main`
3. create `/data/private-chef/logs`
4. `cd /data/private-chef/backend`
5. `npm ci`
6. `npm run build`
7. `npm prune --omit=dev`
8. `pm2 startOrRestart ecosystem.config.cjs --env production --update-env`

### Manual backend deploy commands

```bash
cd private-chef/backend
npm ci
npm run build
npm prune --omit=dev
pm2 startOrRestart ecosystem.config.cjs --env production --update-env
```

### Backend troubleshooting

#### A. Deploy script fails before restart

Check in this order:

1. SSH connectivity in `private-chef/backend/scripts/deploy.sh`
2. remote repo path `/data/private-chef`
3. `git pull --ff-only origin main`
4. `npm ci` output
5. `npm run build` output

#### B. PM2 process does not come up

Check:

1. `private-chef/backend/ecosystem.config.cjs`
2. whether `dist/index.js` exists
3. PM2 process name `private-chef-api`
4. PM2 logs in `/data/private-chef/logs/`

#### C. API hostname is down but backend port works locally

Check:

1. `private-chef/backend/cloudflared-config.yml`
2. tunnel hostname value
3. target service value `http://127.0.0.1:3000`
4. cloudflared service/process status on server

#### D. Browser says CORS or auth failed

Check:

1. `private-chef/backend/src/middleware/cors.ts`
2. backend `FRONTEND_ORIGIN`
3. whether request origin matches the configured hostname rules

#### E. DB or migration issues

Check:

1. `private-chef/backend/src/lib/env.ts`
2. `private-chef/backend/drizzle.config.ts`
3. actual `DATABASE_PATH`
4. file permissions for SQLite DB and parent directory

#### F. Upload/presign endpoint fails

Check:

1. COS env variables from `.env.example`
2. whether backend env contains all required COS values
3. whether COS region and bucket are correct

---

## 7. End-To-End Verification After Any Deploy

Run this checklist after frontend or backend changes.

1. Frontend homepage opens successfully.
2. Refreshing a deep-link route does not 404.
3. API base URL points to the intended production API.
4. `/api/auth/me` or equivalent authenticated check works after login.
5. Browser sends and receives cookies correctly.
6. If upload is in scope, presign/upload flow still works.

If a deploy “looks successful” but one of these fails, do not trust the deploy.

---

## 8. Rollback

### Frontend rollback

- Roll back to the last known good Cloudflare Pages deployment or last known good commit that triggered Pages deployment.
- After rollback, re-verify:
  - homepage
  - deep-link routing
  - API host correctness
  - login/auth

### Backend rollback

- Revert the remote backend repo to the last known good commit.
- Re-run the backend deploy steps.
- Re-check PM2 process and API reachability.

### Important rollback limitation

- This repo uses SQLite.
- Code rollback does **not** automatically roll back database state.
- If a bad migration or data mutation happened, treat DB recovery as a separate operation.

---

## 9. Historical Docs And Precedence

Use these as background only:

- `private-chef/私厨-技术方案.md`
- workspace planning docs under `.sisyphus/plans/tasks/`

Precedence rule:

1. `private-chef/DEPLOYMENT_RUNBOOK.md`
2. current repo scripts/config files
3. task docs / technical方案 docs

If the runbook and an older document disagree, verify against current repo files and then update the runbook.

---

## 10. AI Operator Notes

For future AI agents:

- Do **not** assume frontend is hosted on Tencent Cloud just because the repo also contains Tencent-related docs.
- Do **not** assume a future integrated deployment plan is active.
- Verify operational claims against these first:
  - `frontend/.env.production`
  - `frontend/src/lib/api.ts`
  - `backend/scripts/deploy.sh`
  - `backend/ecosystem.config.cjs`
  - `backend/cloudflared-config.yml`
  - `backend/src/lib/env.ts`
  - `backend/src/middleware/cors.ts`
- When deployment behavior changes, update this runbook first.
- Never copy secrets into docs.

---

## 11. Needs Manual Confirmation

These may exist in reality, but should be re-verified before operational changes:

- current Cloudflare Pages project name
- current Pages production domain if it changed
- whether backend process manager in production has diverged from repo PM2 config
- whether the remote server host/user/path in `backend/scripts/deploy.sh` is still current
- whether Cloudflare Tunnel is still the live edge path for the API

If any of these drift from reality, update this file after verification.
