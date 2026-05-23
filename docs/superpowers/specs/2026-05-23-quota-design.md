# 免费版配额限制（菜品数 + 图片数）

- 状态：approved（设计已确认，等待落地）
- 作者：claude + weilan
- 创建：2026-05-23

## 背景与目标

为后续商业化做准备，对免费用户的菜谱数和图片上传数做硬上限。本期只做"卡限制 +
固定文案"，不铺付费升级入口、不做分级机制；现有数据库中的家庭一次性升级到最高
等级，无感。

### 约束

- 服务器：2c2g
- OSS：50G 总容量
- 数据库：SQLite（better-sqlite3，同步嵌入式）
- 后端栈：Hono + drizzle-orm
- 现有 schema 中没有"plan/tier"字段，菜谱/图片都挂在 `family_id` 上

### 不做

- 付费/升级流程、订单、外链客服入口
- 分级机制（free 之外只有 unlimited 这一档兜底，不暴露给新用户）
- 用 OSS 字节数做配额（只数图片张数，简单可控）
- 软删除/废纸篓（沿用现有硬删 + cascade 模式）

## 配额规则

| Plan        | 菜数上限 | 图片张数上限 |
|-------------|----------|--------------|
| `free`      | 30       | 60           |
| `unlimited` | 无       | 无           |

- **计数维度**：按 family。所有家庭成员共享一份配额。
- **菜数口径**：`COUNT(*) FROM recipes WHERE family_id = ?`，包含从公共菜广场
  `/square/recipes/:id/clone` 复制来的菜（`sourceRecipeId IS NOT NULL` 也算）。
- **图数口径**：跨 family 内所有 recipes 的 `recipe_images` 总和。
- **回收**：菜被硬删时，cascade 删图，配额自动减；不做"待清理"中间态。

## 数据模型

### families 表新增 `plan` 字段

```ts
plan: text('plan').notNull().default('free')  // 'free' | 'unlimited'
```

### Migration `0006_quota.sql`

```sql
-- 1) 加 plan 列
ALTER TABLE families ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
--> statement-breakpoint

-- 2) 现存所有家庭升级到 unlimited（一次性，老用户无感）
UPDATE families SET plan = 'unlimited';
--> statement-breakpoint

-- 3) 顺手补两个历史欠账索引（配额相关 COUNT/JOIN 都吃）
CREATE INDEX recipes_family_id_idx ON recipes (family_id);
--> statement-breakpoint
CREATE INDEX recipe_images_recipe_id_idx ON recipe_images (recipe_id);
```

> 索引说明：这两个不是配额引入的依赖（recipes 列表查询、图片 cascade 删除都吃
> 它们），但配额拦截会让 COUNT 频次上升，借这次一起补。补完后所有 quota COUNT
> 走索引，单次 < 1ms。

## Quota 模块

新建 `backend/src/lib/quota.ts`，单一职责，对外只导出 4 个函数 + 1 个错误类 + 1
个常量：

```ts
export const PLAN_LIMITS = {
  free:      { recipes: 30, images: 60 },
  unlimited: { recipes: null, images: null },
} as const

export type QuotaResource = 'recipes' | 'images'

export class QuotaExceededError extends Error {
  constructor(
    public resource: QuotaResource,
    public used: number,
    public limit: number,
  ) {
    super(`quota_exceeded:${resource}`)
  }
}

export function getFamilyPlan(familyId: number): 'free' | 'unlimited'
export function getQuotaUsage(familyId: number): {
  plan: 'free' | 'unlimited'
  recipes: { used: number; limit: number | null }
  images:  { used: number; limit: number | null }
}
export function assertCanCreateRecipe(familyId: number): void  // throws
export function assertCanUploadImage(familyId: number): void   // throws
```

### 计数 SQL（同步 better-sqlite3）

```sql
-- 菜数
SELECT COUNT(*) FROM recipes WHERE family_id = ?

-- 图数
SELECT COUNT(*) FROM recipe_images ri
JOIN recipes r ON ri.recipe_id = r.id
WHERE r.family_id = ?
```

### 设计取舍

- **不引入独立 counter 表**：免费上限只有 30/60，索引扫描毫秒级。`ai_usage` 那
  种计数器适合"日积月累、永不递减"的指标，配额要随删除回收，每次现算更准。
- **并发轻微超额可接受**：两个用户同时上传第 60 张图理论上可能都过 assert，最
  多多 1–2 条，不影响商业目标。需要严格时再用事务内 `COUNT + INSERT` 兜底。

## API/路由变更

### 三处写入点拦截

| 位置 | 函数 |
|---|---|
| `routes/recipes.ts` `POST /` | `assertCanCreateRecipe(familyId)` |
| `routes/square.ts` `POST /recipes/:id/clone` | `assertCanCreateRecipe(familyId)` |
| `routes/images.ts` `POST /recipes/:id/images` | `assertCanUploadImage(familyId)` |

拦截位置：在 schema 校验 / recipe 归属校验通过之后、INSERT 之前。

### 统一错误响应

在 `app.ts` 的 onError 里捕 `QuotaExceededError`：

```
HTTP 409 Conflict
{
  "error": "quota_exceeded",
  "resource": "recipes" | "images",
  "used": 30,
  "limit": 30,
  "message": "已达免费版上限"
}
```

> 选 409 而非 402（Payment Required）—— 本期不铺付费入口，409 语义上是"当前
> 状态拒绝"，前端只需弹固定文案。

### 新增配额查询接口

新建 `routes/quota.ts`：

```
GET /api/quota
→ 200 {
  plan: "free" | "unlimited",
  recipes: { used: 12, limit: 30 },   // unlimited 时 limit: null
  images:  { used: 35, limit: 60 }
}
```

## 前端集成

### API 层

`frontend/src/api/quota.ts`：

```ts
export type Quota = {
  plan: 'free' | 'unlimited'
  recipes: { used: number; limit: number | null }
  images:  { used: number; limit: number | null }
}
export function getQuota(): Promise<Quota>
```

用 react-query（沿用既有 pattern），stale time 30s。新增菜谱 / 上传图片成功
或失败后 invalidate。

### 显示点

- **新增菜谱页**：标题旁小字 `已用 12/30 道`，到上限时变橙色。
- **图片上传按钮**：旁边小字 `已用 35/60 张`，上限时按钮置灰 +
  tooltip "已达免费版上限"。
- `limit === null`（unlimited 家庭）时这两块全部不渲染，老用户视觉无感。

### 错误兜底

通用错误拦截器识别 `error === 'quota_exceeded'`，统一 toast：

- `resource: 'recipes'` → "免费版最多创建 30 道菜，已达上限"
- `resource: 'images'` → "免费版最多上传 60 张图，已达上限"

不放"升级"按钮（本期不铺付费入口）。

## 性能影响评估

| 场景 | 当前 | 加配额后 |
|---|---|---|
| `POST /recipes`（free 家庭 < 30 菜） | 1 INSERT | + 1 SELECT COUNT（< 0.1ms） |
| `POST /images/...`（free 家庭 < 60 图） | 1 SELECT + 1 INSERT | + 1 SELECT COUNT JOIN（< 0.5ms） |
| `GET /quota` | — | 2 SELECT COUNT，~1ms |
| unlimited 家庭 5 万条数据 COUNT | — | < 1ms（走 family_id 索引） |

加配额对端到端请求时延的影响 < 1ms，淹没在网络/序列化的 50ms 级噪声里。

## 测试策略

### Backend 单测（`backend/src/__tests__/quota.test.ts`）

- `assertCanCreateRecipe`：free 家庭 < 30 通过 / = 30 抛 `QuotaExceededError` /
  unlimited 任意通过
- `assertCanUploadImage`：同上，并验证 JOIN 跨多 recipe 的图数计算正确
- `getQuotaUsage`：返回结构正确，unlimited 时 limit 为 null
- 删菜后图 cascade 是否让计数下降

### Backend 集成测

- `POST /recipes` 第 31 次返回 409 + 约定 body 结构
- `POST /square/recipes/:id/clone` 同样卡在 30
- `POST /images/recipes/:id/images` 第 61 张返回 409
- `GET /quota` 返回值正确
- Migration 0006：测试 setup 内建一个 family，跑迁移，断言 `plan === 'unlimited'`

### 前端

不强求新增单测。生产上线后用真账号触发一次 quota 错误，确认 toast 文案 + 按钮
置灰即可。

## 部署/迁移顺序

避免新旧前后端 race condition：

1. **后端先合并 + 部署**（带 migration 0006）。
   - 老前端不显示 quota 文案，写入会被后端拦截；但所有旧家庭已 `plan='unlimited'`，
     无任何用户被卡。
2. **前端跟随合并 + 部署**，开始显示 quota 文案。
3. 后续注册的新家庭（默认 `plan='free'`）开始受限。

## 后续（不在本期）

- 付费升级流程 / 订单 / 客服外链
- 分级机制（如 free / pro / family）
- OSS 字节数维度的配额（如果发现张数控不住成本）
- 配额变更后端管理界面（目前只能直接改 DB）
