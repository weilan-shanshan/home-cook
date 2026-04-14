# Task 02 — Drizzle Schema + 迁移文件

> **Wave**: 1 | **可并行**: 与 T01、T03 同时开始 | **预估**: 20 分钟
>
> **依赖**: T01（需要 backend/package.json 已存在才能 npm install）
>
> **后续任务等我完成**: T06-T14（所有后端路由）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

在 `backend/src/db/` 中创建 Drizzle ORM 的完整 schema 定义（13 张业务表 + 1 张 session 表），配置 SQLite 连接和 pragma，生成迁移文件。

## 具体步骤

### 1. 创建 `backend/src/db/schema.ts`

定义以下 14 张表（完全匹配技术方案第五节 SQL DDL）：

| 表名 | 关键字段 | 特殊约束 |
|---|---|---|
| `users` | id, username(UNIQUE), display_name, password_hash, role(admin/member), created_at | |
| `families` | id, name, invite_code(UNIQUE), created_by→users, created_at | |
| `family_members` | family_id+user_id 联合PK, joined_at | |
| `recipes` | id, family_id→families, title, description, steps(TEXT/JSON), cook_minutes, servings, created_by→users, created_at, updated_at | |
| `recipe_images` | id, recipe_id→recipes(**CASCADE**), url, thumb_url, sort_order, created_at | |
| `tags` | id, family_id→families, name | UNIQUE(family_id, name) |
| `recipe_tags` | recipe_id+tag_id 联合PK | 两个 FK 都 CASCADE |
| `cook_logs` | id, recipe_id→recipes, cooked_by→users, cooked_at, note | |
| `ratings` | id, cook_log_id→cook_logs(**CASCADE**), user_id→users, score, comment, created_at | CHECK(score>=1 AND score<=5), UNIQUE(cook_log_id, user_id) |
| `wishes` | id, family_id→families, user_id→users, dish_name, note, status(pending/fulfilled/cancelled), recipe_id→recipes(nullable), created_at | |
| `orders` | id, family_id→families, user_id→users, meal_type, meal_date, note, status(pending/confirmed/completed), created_at | |
| `order_items` | id, order_id→orders(**CASCADE**), recipe_id→recipes(**⚠️ RESTRICT**), quantity | |
| `favorites` | user_id+recipe_id 联合PK, created_at | recipe FK CASCADE |
| `sessions` | id(TEXT PK), user_id→users(**CASCADE**), expires_at(INTEGER) | |

> **⚠️ 关键**: `order_items.recipe_id` 外键用 `ON DELETE RESTRICT`（**不是 CASCADE**），防止有活跃订单时删菜谱。

导出所有表的 TypeScript 推导类型：

```typescript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
// ... 每张表都导出 Select 和 Insert 类型
```

### 2. 创建 `backend/src/db/index.ts`

```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const dbPath = process.env.DATABASE_PATH || './data/private-chef.db'

// 确保 data 目录存在
import { mkdirSync } from 'fs'
import { dirname } from 'path'
mkdirSync(dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)

// SQLite 性能和安全配置（必须）
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('foreign_keys = ON')
sqlite.pragma('cache_size = -8000')

export const db = drizzle(sqlite, { schema })
export { sqlite }
```

### 3. 生成迁移文件

```bash
cd backend && npx drizzle-kit generate
```

确认 `backend/drizzle/` 目录下生成了 SQL 迁移文件。

### 4. 创建 `backend/src/db/seed.ts`（可选）

用于开发调试的种子数据脚本，创建一个测试家庭 + 用户。

## 验收标准

- [ ] `backend/src/db/schema.ts` 定义了 14 张表
- [ ] `order_items.recipe_id` 外键为 **RESTRICT**
- [ ] `ratings.score` 有 CHECK(1-5) 约束
- [ ] `npx drizzle-kit generate` 成功生成迁移文件
- [ ] `backend/src/db/index.ts` 包含全部 5 个 pragma
- [ ] 每张表导出 `$inferSelect` 和 `$inferInsert` 类型
- [ ] 初始化 DB 后 `sqlite3 data/private-chef.db ".tables"` 显示 14 张表

## 禁止事项

- 不使用 `CREATE TABLE IF NOT EXISTS` 内联建表
- 不定义任何二期功能的表
- `order_items.recipe_id` **不用 CASCADE**
