# Task 13 — 烹饪日志 + 评分路由

> **Wave**: 2 | **可并行**: 与 T06-T12, T14 同时开始 | **预估**: 30 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T18（前端许愿+收藏+日志页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建两个路由文件：`cook-logs.ts`（烹饪日志 CRUD）和 `ratings.ts`（评分评论），共 5 个端点。

## 需要创建的文件

### 1. `backend/src/routes/cook-logs.ts` — 烹饪日志

3 个端点：

1. **`GET /api/recipes/:id/logs`** — 某菜谱的烹饪日志
   - WHERE family_id = familyId
   - 包含评分信息

2. **`POST /api/cook-logs`** — 记录一次烹饪
   - Zod 校验:
     ```typescript
     const createCookLogSchema = z.object({
       recipe_id: z.number().int().positive(),
       cooked_at: z.string().optional(), // 默认当前时间
       note: z.string().optional(),
     })
     ```
   - 验证 recipe 属于当前家庭

3. **`GET /api/cook-logs`** — 全部烹饪日志时间线
   - WHERE family_id = familyId
   - 按 cooked_at 倒序
   - 分页: `?page=&limit=`

### 2. `backend/src/routes/ratings.ts` — 评分评论

2 个端点：

1. **`POST /api/cook-logs/:id/ratings`** — 对某次烹饪评分
   - Zod 校验:
     ```typescript
     const createRatingSchema = z.object({
       score: z.number().int().min(1).max(5),
       comment: z.string().optional(),
     })
     ```
   - UNIQUE(cook_log_id, user_id) 约束 → 重复评分返回 409

2. **`GET /api/cook-logs/:id/ratings`** — 获取某次烹饪的所有评分

## 技术方案参考

- `私厨-技术方案.md` 第 339-352 行 — 烹饪日志 + 评分 API
- `私厨-技术方案.md` 第 213-230 行 — cook_logs + ratings 表

## 验收标准

- [ ] 5 个端点实现（3 日志 + 2 评分）
- [ ] 评分 score CHECK(1-5) 约束生效
- [ ] 重复评分（同用户同次烹饪）返回 409
- [ ] 烹饪日志时间线支持分页
- [ ] 所有查询带 family_id 过滤

## 禁止事项

- ❌ 不允许同一用户对同次烹饪重复评分（UNIQUE 约束）
- ❌ 不在循环中查关联数据
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Log cooking and rate it
  Tool: Bash (curl)
  Steps:
    1. POST /api/cook-logs {"recipe_id":1,"note":"今天做得不错"}
    2. Assert 201 with cook_log id
    3. POST /api/cook-logs/:id/ratings {"score":5,"comment":"太好吃了"}
    4. Assert 201
    5. POST /api/cook-logs/:id/ratings {"score":4,"comment":"再来一次"} (duplicate)
    6. Assert 409
  Expected Result: Cook log created, rated once, duplicate rejected
  Evidence: .sisyphus/evidence/task-13-cooklog-rating.txt
```

## 提交

- **Group**: 与 T14 一起提交
- **Message**: `feat(api): add cook logs, ratings, and family management routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
