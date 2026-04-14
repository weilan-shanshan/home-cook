# Task 21 — 后端 Hono 入口集成 + 通知触发

> **Wave**: 4 | **可并行**: 与 T22, T23, T24 同时开始 | **预估**: 35 分钟
>
> **依赖**: T05（企微 Webhook）、T06-T14（所有后端路由）
>
> **后续任务等我完成**: T25（后端部署）、T26（前端部署）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> **前提**: Wave 2 的所有后端路由任务（T06-T14）必须全部完成。

---

## 目标

将所有后端路由模块集成到 Hono 入口文件，应用中间件，集成通知触发点，导出 AppType。

## 需要修改/创建的文件

### 更新 `backend/src/index.ts` — Hono 入口

1. **导入并挂载所有路由模块**:
   ```typescript
   import authRoutes from './routes/auth'
   import recipeRoutes from './routes/recipes'
   import imageRoutes from './routes/images'
   import tagRoutes from './routes/tags'
   import orderRoutes from './routes/orders'
   import wishRoutes from './routes/wishes'
   import favoriteRoutes from './routes/favorites'
   import cookLogRoutes from './routes/cook-logs'
   import ratingRoutes from './routes/ratings'
   import familyRoutes from './routes/families'

   const app = new Hono()
     .route('/api/auth', authRoutes)
     .route('/api/recipes', recipeRoutes)
     .route('/api/upload', imageRoutes)  // presign 端点
     .route('/api/tags', tagRoutes)
     .route('/api/orders', orderRoutes)
     .route('/api/wishes', wishRoutes)
     .route('/api/favorites', favoriteRoutes)
     .route('/api/cook-logs', cookLogRoutes)
     .route('/api/families', familyRoutes)
     // ratings 挂在 cook-logs 下: /api/cook-logs/:id/ratings
   ```

2. **应用中间件**:
   - CORS 中间件（允许前端域名）
   - Auth 中间件到所有 `/api/*`（排除 /api/auth/register, /api/auth/login）
   
3. **全局错误处理中间件**:
   - Catch Zod 校验错误 → 400 + { error: "Validation failed", details: ... }
   - SQLite UNIQUE 约束错误 → 409
   - 其他 → 500 + { error: "Internal server error" }

4. **确保 AppType 导出**:
   ```typescript
   export type AppType = typeof app
   ```

5. **通知触发点集成确认**（应在各路由中已实现，此处验证）:
   - `POST /api/orders` → `notifyNewOrder()`
   - `POST /api/recipes` → `notifyNewRecipe()`
   - `POST /api/wishes` → `notifyNewWish()`

6. **启动服务器**:
   - 使用 `@hono/node-server` 监听 PORT（默认 3000）

## 技术方案参考

- `私厨-技术方案.md` 第 478 行 — 后端入口文件
- `私厨-技术方案.md` 第 296-377 行 — 所有 API 路由定义
- `私厨-技术方案.md` 第 580-587 行 — 通知触发场景

## 验收标准

- [ ] 所有 10 个路由模块挂载到 Hono app
- [ ] Auth 中间件正确排除公开路由（register, login）
- [ ] 全局错误处理: Zod→400, UNIQUE→409, 其他→500
- [ ] `export type AppType` 包含所有路由类型
- [ ] 3 个通知触发点已集成
- [ ] 服务器可启动并监听

## 禁止事项

- ❌ 不遗漏任何路由模块的挂载
- ❌ 不跳过 auth 中间件（除公开路由）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: All API endpoints accessible
  Tool: Bash (curl)
  Preconditions: Backend running with all modules
  Steps:
    1. Register + login to get session cookie
    2. curl GET /api/recipes → 200 (empty array)
    3. curl GET /api/tags → 200
    4. curl GET /api/orders → 200
    5. curl GET /api/wishes → 200
    6. curl GET /api/favorites → 200
    7. curl GET /api/cook-logs → 200
    8. curl GET /api/families/:id → 200
    9. curl GET /api/auth/me → 200
  Expected Result: All endpoints return 200 with correct shape
  Evidence: .sisyphus/evidence/task-21-integration.txt

Scenario: Unauthenticated requests blocked (except public routes)
  Tool: Bash (curl)
  Steps:
    1. curl GET /api/recipes without cookie → 401
    2. curl POST /api/auth/login without cookie → 200/400 (not 401, it's public)
    3. curl POST /api/auth/register without cookie → 200/400 (not 401, it's public)
  Expected Result: Protected routes return 401, public routes accessible
  Evidence: .sisyphus/evidence/task-21-auth-guard.txt
```

## 提交

- **单独提交**
- **Message**: `feat(backend): integrate all routes in Hono entry with notifications`
- **Files**: backend/src/index.ts + 各路由文件中的通知集成
- **Pre-commit**: `cd backend && npm run build && npx vitest run`
