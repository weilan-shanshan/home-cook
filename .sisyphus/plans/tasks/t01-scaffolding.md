# Task 01 — 项目脚手架搭建

> **Wave**: 1 | **可并行**: 与 T02、T03 同时开始 | **预估**: 30 分钟
>
> **依赖**: 无 — 可立即开始
>
> **后续任务等我完成**: T02, T03, T04, T05 以及所有后续任务

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `private-chef/` 项目的前后端 monorepo 结构，包含所有配置文件、依赖安装、TypeScript 配置、Hono RPC 类型导出。

## 技术栈版本

| 包 | 版本 |
|---|---|
| React | 18.x |
| Vite | 5.x |
| React Router | 7.x |
| TanStack Query | 5.x |
| Tailwind CSS | 3.x |
| Hono | 4.x |
| @hono/node-server | 1.x |
| better-sqlite3 | 9.x |
| Drizzle ORM | 0.30.x |
| Lucia | 3.x |
| @lucia-auth/adapter-sqlite | 3.x |
| @node-rs/argon2 | 1.x |
| cos-nodejs-sdk-v5 | latest |
| Zod | 3.x |

## 具体步骤

### 1. 前端初始化

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router@7 @tanstack/react-query@5 tailwindcss@3 autoprefixer postcss clsx tailwind-merge browser-image-compression
npm install -D @types/node
```

配置文件：
- `vite.config.ts` — React plugin + proxy `/api` → `http://localhost:3000`
- `tailwind.config.ts` — content: `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`
- `postcss.config.js` — tailwindcss + autoprefixer
- `tsconfig.json` — path alias `@/` → `src/`

### 2. 后端初始化

```bash
mkdir backend && cd backend && npm init -y
npm install hono@4 @hono/node-server@1 better-sqlite3@9 drizzle-orm zod cos-nodejs-sdk-v5 @node-rs/argon2
npm install -D typescript @types/better-sqlite3 drizzle-kit tsx vitest
```

配置文件：
- `tsconfig.json` — target: ES2022, module: ESNext, strict: true, outDir: dist
- `drizzle.config.ts` — driver: better-sqlite3, schema: src/db/schema.ts, out: drizzle
- `package.json` scripts:
  ```json
  {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
  ```

### 3. Lucia v3 验证

```bash
npm install lucia@3 @lucia-auth/adapter-sqlite@3
```

> **如果 `lucia@3` 安装失败或包已废弃**（npm warn deprecated），则：
> - 移除 lucia 相关依赖
> - 在 `backend/src/lib/auth.ts` 中自行实现 session 管理：
>   - `createSession(userId)` — crypto.randomUUID() 生成 ID，存入 sessions 表
>   - `validateSession(sessionId)` — 查 sessions 表，检查过期
>   - `deleteSession(sessionId)` — 删除 session
>   - `hashPassword(password)` — argon2.hash()
>   - `verifyPassword(hash, password)` — argon2.verify()
> - 在 T06 认证任务中告知执行者使用手动方案

### 4. 后端入口文件 — 关键！

创建 `backend/src/index.ts`：

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.json({ status: 'ok' }))

// 后续任务会通过 app.route() 挂载路由
// 保持此文件结构，其他任务只添加 .route() 调用

export type AppType = typeof app  // ← 前端 RPC 类型推导的关键

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})
```

### 5. 前端 API 客户端

创建 `frontend/src/lib/api.ts`：

```typescript
import { hc } from 'hono/client'
import type { AppType } from '../../../backend/src/index'

const baseUrl = import.meta.env.VITE_API_URL || ''
export const client = hc<AppType>(baseUrl)
```

### 6. 环境变量模板

创建 `.env.example`：

```bash
# --- 后端 ---
PORT=3000
NODE_ENV=production
DATABASE_PATH=./data/private-chef.db
SESSION_SECRET=your-random-secret-here

# 腾讯云 COS
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=your-cos-secret-key
COS_BUCKET=your-bucket-name
COS_REGION=ap-guangzhou

# 企业微信 Webhook
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx

# 前端域名（CORS 白名单）
FRONTEND_ORIGIN=https://your-app.pages.dev

# --- 前端 ---
VITE_API_URL=https://api.yourdomain.top
```

### 7. .gitignore

```
node_modules/
dist/
.env
*.db
data/
.DS_Store
```

## 目录结构

完成后目录应该是：

```
private-chef/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
├── .env.example
├── .gitignore
└── 私厨-技术方案.md
```

## 验收标准

- [ ] `cd frontend && npm run build` 成功
- [ ] `cd backend && npx tsc --noEmit` 无错误
- [ ] `cd backend && npx tsx src/index.ts` 启动后 `curl http://localhost:3000/` 返回 `{"status":"ok"}`
- [ ] `backend/src/index.ts` 有 `export type AppType`
- [ ] `.env.example` 包含所有环境变量

## 禁止事项

- 不使用 `as any`、`@ts-ignore`
- 不安装 monorepo 工具（turborepo/lerna）
- 不安装二期才需要的依赖
- 不在代码中硬编码任何密钥
