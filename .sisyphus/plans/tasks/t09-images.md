# Task 09 — 图片上传路由（COS 预签名）

> **Wave**: 2 | **可并行**: 与 T06-T08, T10-T14 同时开始 | **预估**: 25 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）、T04（COS 工具模块）
>
> **后续任务等我完成**: T16（前端菜谱页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 但需确认 T04 已完成（COS 工具模块 `backend/src/lib/cos.ts` 存在且导出 `getPresignedUploadUrl`）。

---

## 目标

创建 `backend/src/routes/images.ts`，实现图片上传的预签名 URL 获取、图片 URL 保存、图片删除。图片不经后端传输，前端通过预签名 URL 直传 COS。

## 需要创建的文件

### `backend/src/routes/images.ts`

3 个端点：

1. **`GET /api/upload/presign`** — 获取 COS 预签名上传 URL
   - 参数: `?filename=xxx.jpg&contentType=image/jpeg`
   - 调用 T04 的 `getPresignedUploadUrl(filename, contentType)`
   - 返回 `{ url, key }` 供前端 PUT 直传 COS

2. **`POST /api/recipes/:id/images`** — 保存图片 URL 到菜谱
   - 验证 recipe 属于当前家庭（WHERE family_id = familyId AND id = recipeId）
   - 保存 url, thumb_url, sort_order 到 recipe_images 表

3. **`DELETE /api/images/:id`** — 删除图片记录
   - 验证图片关联的 recipe 属于当前家庭
   - 删除 recipe_images 记录
   - COS 上的文件暂不删除（二期再做清理）

## 技术方案参考

- `私厨-技术方案.md` 第 324-329 行 — 图片 API 设计
- `私厨-技术方案.md` 第 71-79 行 — 图片上传流程
- `私厨-技术方案.md` 第 188-195 行 — recipe_images 表

## 验收标准

- [ ] 3 个图片端点实现
- [ ] 预签名 URL 返回有效的 COS 地址（包含 bucket domain）
- [ ] 图片保存验证 recipe 归属当前家庭
- [ ] 删除只删 DB 记录，不删 COS 文件

## 禁止事项

- ❌ 不接收 Base64 编码图片
- ❌ 图片不经后端传输（只传 URL）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Get presigned URL
  Tool: Bash (curl)
  Preconditions: Authenticated user, COS env vars configured
  Steps:
    1. GET /api/upload/presign?filename=test.jpg&contentType=image/jpeg
    2. Assert response has url and key fields
    3. Assert url contains COS bucket domain
  Expected Result: Valid presigned URL returned
  Evidence: .sisyphus/evidence/task-9-presign.txt
```

## 提交

- **Group**: 与 T07, T08 一起提交
- **Message**: `feat(api): add recipe CRUD, tags, and image upload routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
