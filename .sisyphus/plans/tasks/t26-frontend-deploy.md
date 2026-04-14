# Task 26 — 前端部署配置（Cloudflare Pages）

> **Wave**: 5 | **可并行**: 与 T25 同时开始 | **预估**: 15 分钟
>
> **依赖**: T20（路由配置完成）、T21（后端集成 — 需要知道 API 域名）
>
> **后续任务等我完成**: 无

---

## 当前状态

> ✅ **当前前端线上方案就是 Cloudflare Pages。**
>
> 本文档描述的是**当前正在使用 / 继续沿用**的前端部署路径，不是历史方案。
>
> 如无额外说明，当前前端发布、回滚、环境变量配置都应以 Cloudflare Pages 为准。

---

## 🔴 人工信息检查点

> ⚠️ **需要以下信息，请在执行前准备好：**
>
> ### 1. Cloudflare Pages 项目
> - **项目名称**: 例如 `private-chef`（在 Cloudflare Pages 创建）
>
> ### 2. 后端 API 域名
> - **VITE_API_BASE_URL**: 例如 `https://api.yourdomain.top`
> - 这是前端生产环境请求后端的地址
>
> ---
>
> **如果还没有这些信息**:
> - 本任务可以先用占位符，部署时替换
> - Cloudflare Pages 可通过 Dashboard 手动创建项目
> - 或使用 `wrangler pages deploy` 命令行部署

---

## 目标

配置前端项目适配 Cloudflare Pages 部署：SPA 路由 fallback、API 地址环境切换、构建输出验证。

> 说明：在当前项目状态下，这不是“备用方案”，而是**当前生效方案**。

## 需要创建/修改的文件

### 1. `frontend/public/_redirects` — SPA 路由 fallback

```
/* /index.html 200
```

> Cloudflare Pages 需要这个文件让所有路由指向 index.html（SPA 模式）。

### 2. 更新 `frontend/src/lib/api.ts` — API base URL 环境切换

```typescript
// 开发环境: 通过 vite proxy 转发到 localhost:3000
// 生产环境: 直接请求 API 域名
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// 如果使用 Hono RPC client:
export const client = hc<AppType>(API_BASE)

// 如果使用 fetch wrapper:
export async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include', // 携带 cookie
    ...opts,
  })
}
```

### 3. 创建 `frontend/.env.production` — 生产环境变量

```
VITE_API_BASE_URL=https://api.yourdomain.top
```

> ← 替换为实际 API 域名

### 4. 确认 `frontend/vite.config.ts` — 开发代理配置

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // ... 其他配置
})
```

## 技术方案参考

- `私厨-技术方案.md` 第 533-539 行 — 前端部署

## 验收标准

- [ ] `frontend/public/_redirects` 存在，内容为 `/* /index.html 200`
- [ ] API base URL 支持环境切换（开发用 proxy，生产用 env）
- [ ] `.env.production` 存在（含占位域名）
- [ ] `npm run build` 成功输出 dist/ 目录
- [ ] dist/_redirects 存在于构建输出中

## 禁止事项

- ❌ 不硬编码 API 地址（必须通过环境变量）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: SPA redirect file in build output
  Tool: Bash
  Steps:
    1. cd frontend && npm run build
    2. cat dist/_redirects
    3. Assert content is "/* /index.html 200"
  Expected Result: _redirects file present with SPA rule
  Evidence: .sisyphus/evidence/task-26-redirects.txt
```

## 提交

- **Group**: 与 T25 一起提交
- **Message**: `feat(deploy): add PM2 ecosystem and Cloudflare Pages config`
