# 私厨 — 任务索引 & 调度指南

> 共 **34 个任务**，分 **7 个 Wave**，可在多个 AI 窗口中并行执行。
>
> **同一 Wave 内的任务可同时开始**，不同 Wave 按顺序执行。
>
> 部署与线上排障请优先阅读：`private-chef/DEPLOYMENT_RUNBOOK.md`

---

## 快速调度表

| Wave | 任务 | 可并行数 | 预估总时间（串行） | 预估时间（全并行） |
|------|------|---------|-------------------|-------------------|
| 1 | T01-T05 | 5 | ~2.5h | ~40min |
| 2 | T06-T14 | 9 | ~4.5h | ~50min |
| 3 | T15-T20 | 6 | ~3.5h | ~60min |
| 4 | T21-T24 | 4 | ~2h | ~45min |
| 5 | T25-T26 | 2 | ~40min | ~25min |
| 6 | T27-T28 | 2 | ~4h | ~3.5h |
| 7 | T29-T34 | 6 | ~3h | ~45min |

**原始主线（T01-T26）总计串行**: ~13h | **全并行**: ~3.5h（约 **3.7x 加速**）

**Wave 6-7** 为后续演进与协作框架任务，按需追加执行，不计入原三窗口批处理总时长。

---

## 依赖关系图

```
Wave 1 (全部可并行，无外部依赖):
  T01 脚手架 ──────┐
  T02 DB Schema ───┤
  T03 UI 主题 ─────┤
  T04 COS 工具 ────┤
  T05 企微 Webhook ┘
          │
          ▼
Wave 2 (全部可并行，依赖 T01+T02):
  T06 认证系统 ────────┐ (依赖 T01, T02)
  T07 菜谱路由 ────────┤ (依赖 T01, T02)
  T08 标签路由 ────────┤ (依赖 T01, T02)
  T09 图片路由 ────────┤ (依赖 T01, T02, T04 ⚠️)
  T10 点餐路由 ────────┤ (依赖 T01, T02)
  T11 许愿路由 ────────┤ (依赖 T01, T02)
  T12 收藏路由 ────────┤ (依赖 T01, T02)
  T13 烹饪日志路由 ────┤ (依赖 T01, T02)
  T14 家庭管理路由 ────┘ (依赖 T01, T02)
          │
          ▼
Wave 3 (全部可并行，依赖 T03 + 对应后端路由):
  T15 前端认证页 ──────┐ (依赖 T03, T06)
  T16 前端菜谱页 ──────┤ (依赖 T03, T07, T08, T09)
  T17 前端点餐页 ──────┤ (依赖 T03, T10)
  T18 前端许愿收藏页 ──┤ (依赖 T03, T11, T12, T13)
  T19 前端个人中心 ────┤ (依赖 T03, T06, T14)
  T20 前端布局路由 ────┘ (依赖 T03, T06)
          │
          ▼
Wave 4 (可并行，各有不同依赖):
  T21 后端集成 ────────┐ (依赖 T05, T06-T14 全部)
  T22 PWA 配置 ────────┤ (依赖 T01)
  T23 关键路径测试 ────┤ (依赖 T06, T10)
  T24 备份脚本 ────────┘ (依赖 T04)
          │
          ▼
Wave 5 (可并行):
  T25 后端部署 ────────┐ (依赖 T21)
  T26 前端部署 ────────┘ (依赖 T20, T21)
          │
          ▼
Wave 6 (后续演进，可按需并行):
  T27 腾讯云一体化部署方案 ─┐ (依赖 T21，且当前前端构建已成功)
  T28 前端文案中文化 ───────┘ (依赖 T15, T16, T17, T18, T19, T20)
          │
          ▼
Wave 7 (协作框架，可并行):
  T29 框架基础构建 ────────┐ (Foundation)
  T30 需求摄入路由 ────────┤ (依赖 T29)
  T31 任务分解契约 ────────┤ (依赖 T30)
  T32 证据与记忆 ──────────┤ (依赖 T31)
  T33 评审门禁规范 ────────┤ (依赖 T32)
  T34 框架试点应用 ────────┘ (依赖 T33)
```

---

## ⚠️ 特殊依赖注意

- **T09（图片路由）** 额外依赖 **T04**（COS 工具模块），不仅仅是 T01+T02
- **T16（前端菜谱页）** 依赖最多后端路由: T07 + T08 + T09
- **T21（后端集成）** 必须等 **所有 Wave 2 任务完成**
- **T22/T23/T24** 可以在 Wave 2 部分完成后提前开始（看各自依赖）
- **T28（前端文案中文化）** 横跨 T15-T20 产出的多个页面，属于 Wave 3 完成后的统一收尾任务
- **Wave 7** 作为一个全新的 "框架 Wave"，其依赖于前面的 Wave 完成但逻辑上相对独立。

---

## 需要人工信息的任务

| 任务 | 需要的信息 | 何时需要 |
|------|-----------|---------|
| T04 | COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION | 执行时 |
| T05 | WECHAT_WEBHOOK_URL | 执行时 |
| T25 | 服务器 IP, API 域名, Cloudflare Tunnel Token | 执行时（可先用占位符） |
| T26 | VITE_API_BASE_URL (后端 API 域名) | 执行时（可先用占位符） |
| T27 | 主站域名、备案状态、腾讯云服务器信息、HTTPS 证书、GitHub Actions Secrets | 执行前需确认 |

---

## 任务文件列表

### Wave 1 — 基础设施（全部可并行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t01-scaffolding.md](t01-scaffolding.md) | 项目脚手架（monorepo + 依赖） | 40min |
| [t02-db-schema.md](t02-db-schema.md) | Drizzle Schema + 迁移（13 张表） | 35min |
| [t03-ui-theme.md](t03-ui-theme.md) | shadcn/ui + Apple 风格样式 | 25min |
| [t04-env-cos.md](t04-env-cos.md) | 环境变量 + COS 预签名工具 🔴 | 20min |
| [t05-wechat.md](t05-wechat.md) | 企微 Webhook 推送模块 🔴 | 20min |

### Wave 2 — 后端路由（全部可并行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t06-auth.md](t06-auth.md) | 认证系统（注册/登录/登出+中间件） | 45min |
| [t07-recipes.md](t07-recipes.md) | 菜谱 CRUD 路由（最复杂） | 50min |
| [t08-tags.md](t08-tags.md) | 标签系统路由 | 20min |
| [t09-images.md](t09-images.md) | 图片上传路由（COS 预签名） | 25min |
| [t10-orders.md](t10-orders.md) | 点餐系统路由 | 40min |
| [t11-wishes.md](t11-wishes.md) | 许愿菜单路由 | 20min |
| [t12-favorites.md](t12-favorites.md) | 收藏路由 | 15min |
| [t13-cooklogs-ratings.md](t13-cooklogs-ratings.md) | 烹饪日志 + 评分路由 | 30min |
| [t14-families.md](t14-families.md) | 家庭管理路由 | 20min |

### Wave 3 — 前端页面（全部可并行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t15-auth-pages.md](t15-auth-pages.md) | 前端认证页面（登录/注册） | 40min |
| [t16-recipe-pages.md](t16-recipe-pages.md) | 前端菜谱页面（最复杂，含图片上传） | 60min |
| [t17-order-pages.md](t17-order-pages.md) | 前端点餐页面 | 35min |
| [t18-wish-fav-log-pages.md](t18-wish-fav-log-pages.md) | 前端许愿+收藏+烹饪日志页面 | 35min |
| [t19-profile-page.md](t19-profile-page.md) | 前端个人中心+家庭管理页面 | 25min |
| [t20-layout-router.md](t20-layout-router.md) | 前端布局+路由+TabBar | 30min |

### Wave 4 — 集成 & 测试（可并行，各有不同依赖）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t21-backend-integration.md](t21-backend-integration.md) | 后端 Hono 入口集成 | 35min |
| [t22-pwa.md](t22-pwa.md) | PWA 配置 | 20min |
| [t23-tests.md](t23-tests.md) | 关键路径测试（认证+点餐） | 45min |
| [t24-backup.md](t24-backup.md) | 备份脚本 | 15min |

### Wave 5 — 部署（可并行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t25-backend-deploy.md](t25-backend-deploy.md) | 后端部署配置 🔴 | 25min |
| [t26-frontend-deploy.md](t26-frontend-deploy.md) | 前端部署配置（当前使用：Cloudflare Pages） 🔴 | 15min |

### Wave 6 — 后续演进（按需执行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t27-tencent-cloud-deploy.md](t27-tencent-cloud-deploy.md) | 腾讯云一体化部署方案（候选方案，当前不具备） 🔴 | 3-5h |
| [t28-frontend-localization.md](t28-frontend-localization.md) | 前端文案中文化（默认中文，不引入完整 i18n） | 45min |

### Wave 7 — 协作框架（以串行为主，局部并行）

| 文件 | 任务 | 预估 |
|------|------|------|
| [t29-framework-foundation.md](t29-framework-foundation.md) | 框架基础构建 | 30min |
| [t30-intake-routing.md](t30-intake-routing.md) | 需求摄入路由规范 | 30min |
| [t31-decomposition-contracts.md](t31-decomposition-contracts.md) | 任务分解契约规范 | 30min |
| [t32-evidence-memory.md](t32-evidence-memory.md) | 证据政策与记忆循环 | 30min |
| [t33-review-gates.md](t33-review-gates.md) | 评审门禁规范 | 30min |
| [t34-framework-pilot.md](t34-framework-pilot.md) | 框架试点应用 | 30min |


> 🔴 = 需要人工提供信息

---

## 三窗口并行执行方案（已选定）

### 窗口任务分配

```
窗口 1: T01 → T06 → T07 → T15 → T21 → T25          (6 个任务)
窗口 2: T02 → T08 → T09 → T10 → T16 → T17 → T22 → T23  (8 个任务)
窗口 3: T03 → T04 → T05 → T11 → T12 → T13 → T14 → T18 → T19 → T20 → T24 → T26  (12 个任务)
```

> 注：以上三窗口分配仅覆盖原始主线 **T01-T26**。`T27`、`T28` 属于后续演进任务，应在主线完成后按需单独调度。

---

## 三窗口协调协议

### 核心机制

三个窗口通过共享文件 `task-status.json`（与本 README 同目录）进行自动协调，**无需人工传话**。

### task-status.json 操作规范

**文件位置**: `.sisyphus/plans/tasks/task-status.json`

**状态值**:
- `"pending"` — 未开始
- `"in_progress"` — 正在执行中
- `"done"` — 已完成
- `"failed"` — 执行失败（需人工介入）

**每个任务开始前**:
1. 读取 `task-status.json`
2. 检查该任务的 `deps` 数组中所有依赖的 status 是否为 `"done"`
3. 如果全部就绪 → 将该任务 status 改为 `"in_progress"`，填入 `window` 和 `started_at`
4. 如果有依赖未就绪 → 输出 `"⏳ 等待 TXX, TYY 完成..."` 并暂停，等待用户指示重试

**每个任务完成后**:
1. 将该任务 status 改为 `"done"`
2. 填入 `completed_at`（ISO 8601 时间戳）
3. 向用户汇报完成情况
4. 自动读取下一个分配的任务，回到"开始前"流程

**JSON 更新示例**（以 T06 为例）:
```json
"T06": {
  "status": "in_progress",
  "window": 1,
  "started_at": "2026-04-10T15:30:00+08:00",
  "completed_at": null,
  "deps": ["T01", "T02"]
}
```
完成后更新为:
```json
"T06": {
  "status": "done",
  "window": 1,
  "started_at": "2026-04-10T15:30:00+08:00",
  "completed_at": "2026-04-10T16:15:00+08:00",
  "deps": ["T01", "T02"]
}
```

---

## 窗口启动指令

> 将以下 prompt 分别复制到三个 AI 窗口中启动。

### 窗口 1 启动 Prompt

```
你是「私厨」项目的开发窗口 1。

**首先**，阅读以下文件了解项目全貌：
1. `.sisyphus/plans/tasks/README.md` — 任务索引和协调协议
2. `私厨-技术方案.md` — 完整技术方案
3. `private-chef/DEPLOYMENT_RUNBOOK.md` — 部署、环境变量、Cloudflare Pages、PM2、Tunnel、CORS、线上排障（遇到部署/生产问题时优先看）

**你负责的任务队列**（按顺序执行）：
T01 → T06 → T07 → T15 → T21 → T25

**协调规则**：
1. 每次开始新任务前，读取 `.sisyphus/plans/tasks/task-status.json`，检查该任务的 deps 是否全部 "done"
2. 如果依赖未就绪，输出 "⏳ 等待 TXX 完成..." 并停下来等我指示
3. 开始执行时，将 task-status.json 中该任务 status 改为 "in_progress"，填入 "window": 1 和 started_at
4. 完成后将 status 改为 "done"，填入 completed_at
5. 向我汇报完成情况，然后自动开始下一个任务

**每个任务的详细说明**在 `.sisyphus/plans/tasks/tXX-名称.md` 文件中，执行前务必阅读对应文件。

**现在开始**：阅读 README 和技术方案，然后执行 T01（项目脚手架）。T01 无依赖，可以直接开始。
```

### 窗口 2 启动 Prompt

```
你是「私厨」项目的开发窗口 2。

**首先**，阅读以下文件了解项目全貌：
1. `.sisyphus/plans/tasks/README.md` — 任务索引和协调协议
2. `私厨-技术方案.md` — 完整技术方案
3. `private-chef/DEPLOYMENT_RUNBOOK.md` — 部署、环境变量、Cloudflare Pages、PM2、Tunnel、CORS、线上排障（遇到部署/生产问题时优先看）

**你负责的任务队列**（按顺序执行）：
T02 → T08 → T09 → T10 → T16 → T17 → T22 → T23

**协调规则**：
1. 每次开始新任务前，读取 `.sisyphus/plans/tasks/task-status.json`，检查该任务的 deps 是否全部 "done"
2. 如果依赖未就绪，输出 "⏳ 等待 TXX 完成..." 并停下来等我指示
3. 开始执行时，将 task-status.json 中该任务 status 改为 "in_progress"，填入 "window": 2 和 started_at
4. 完成后将 status 改为 "done"，填入 completed_at
5. 向我汇报完成情况，然后自动开始下一个任务

**每个任务的详细说明**在 `.sisyphus/plans/tasks/tXX-名称.md` 文件中，执行前务必阅读对应文件。

**现在开始**：阅读 README 和技术方案，然后执行 T02（DB Schema）。T02 无依赖，可以直接开始。
```

### 窗口 3 启动 Prompt

```
你是「私厨」项目的开发窗口 3。

**首先**，阅读以下文件了解项目全貌：
1. `.sisyphus/plans/tasks/README.md` — 任务索引和协调协议
2. `私厨-技术方案.md` — 完整技术方案
3. `private-chef/DEPLOYMENT_RUNBOOK.md` — 部署、环境变量、Cloudflare Pages、PM2、Tunnel、CORS、线上排障（遇到部署/生产问题时优先看）

**你负责的任务队列**（按顺序执行）：
T03 → T04 → T05 → T11 → T12 → T13 → T14 → T18 → T19 → T20 → T24 → T26

**协调规则**：
1. 每次开始新任务前，读取 `.sisyphus/plans/tasks/task-status.json`，检查该任务的 deps 是否全部 "done"
2. 如果依赖未就绪，输出 "⏳ 等待 TXX 完成..." 并停下来等我指示
3. 开始执行时，将 task-status.json 中该任务 status 改为 "in_progress"，填入 "window": 3 和 started_at
4. 完成后将 status 改为 "done"，填入 completed_at
5. 向我汇报完成情况，然后自动开始下一个任务

**每个任务的详细说明**在 `.sisyphus/plans/tasks/tXX-名称.md` 文件中，执行前务必阅读对应文件。

**现在开始**：阅读 README 和技术方案，然后执行 T03（UI 主题）。T03 无依赖，可以直接开始。
```

---

## 提交节点

每个 Wave 完成后建议做一次提交：
1. Wave 1 完成 → `chore: init monorepo scaffolding`
2. Wave 2 完成 → `feat(api): add all backend routes`（或按分组分多次提交）
3. Wave 3 完成 → `feat(frontend): implement all pages`
4. Wave 4 完成 → `feat: integration + tests + PWA`
5. Wave 5 完成 → `feat(deploy): deployment configs`
6. Wave 6 完成 → `docs(tasks): add follow-up deploy and localization plans`
7. Wave 7 完成 → `docs(framework): add agent operating framework rollout`
