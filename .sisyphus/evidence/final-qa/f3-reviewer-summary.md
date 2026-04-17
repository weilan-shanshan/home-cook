# F3 Reviewer Summary

## 结论

本轮 F3 已完成真实 UI / API 自动验证补证，主链路具备 reviewer 收口条件。

当前结论：

- **T3 / T6 / T7 / T9 / T10 / T11 / T12 / T15 / T16 / T17 / T18 / T19 / T20 已有真实证据支撑**
- **T5 已完成独立补证**，并按最新验收口径证明：**图片上传失败不会阻塞菜谱创建，后续允许重试/补充图片**
- F3 尚未在计划文件中标记为 PASS 的唯一原因，不再是自动验证能力不足，而是此前缺少面向 reviewer 的汇总结论文档；本文档即用于补齐该缺口。

## 已验证主链路

### UI / 路由

- `/menu` 可访问并截图
- `/orders` 可访问并截图
- `/orders/10` 详情页可访问并截图
- `/menu/create-order?from=10` 可访问并截图
- 从创建订单页提交后，真实跳转到 `/orders/11`
- `/profile`、`/achievements`、Profile → Achievements 跳转已在前序证据中验证

### 互动与聚合 API

- `GET /api/orders/10/comments` → `200`
- `GET /api/orders/10/reviews` → `200`
- `POST /api/orders/10/reviews` 重复提交 → `409`
- `POST /api/orders/10/like` → `201`
- `DELETE /api/orders/10/like` → `200`
- `POST /api/orders/10/share` → `201`
- `GET /api/orders/10/share-card` → `200`
- `GET /api/home/summary` 已有证据
- `GET /api/profile/summary` 已有证据
- `GET /api/achievements/leaderboard` 已有证据

## T5 独立验收结论

### 验收口径

用户最新明确口径：

> 图片上传失败可以创建菜谱，后续能编辑补充就行，因为图片上传容易失败

### 实际验证方式

- 在真实 `/recipe/new` 页面填写菜谱表单
- 选择一张本地图片进入上传队列
- 在浏览器上下文中**仅拦截** `/api/upload/presign`，主动制造上传失败
- 保留真实 `POST /api/recipes` 请求不受影响

### 实际验证结果

- `POST /api/recipes` 返回 `201`
- 预签名请求被主动拦截失败
- 页面出现 **“创建成功”** Banner
- Banner 文案明确写明：**上传失败不会影响菜品创建结果**
- 上传队列出现失败状态，并提供 **“重试”** 按钮
- 页面仍停留在可编辑状态，满足“后续补充图片”的要求

### T5 结论

**PASS**：RecipeForm 已满足“创建成功不依赖图片上传成功，失败后可继续补充/重试”的产品要求。

## 关键证据索引

### T5

- `task-T5-create-success-upload-failed.png`
- `task-T5-create-api-log.json`

### T3 / T6 / T7 / T9

- `task-T3-tabbar-rerun.png`
- `task-T6-menu-page-rerun.png`
- `task-T7-order-detail-rerun.png`
- `task-T9-create-order-page.png`
- `task-T9-create-order-redirect.png`

### T10 / T11 / T12

- `task-T10-comments.json`
- `task-T11-reviews.json`
- `task-T11-review-duplicate.json`
- `task-T12-interactions.json`

### T15 / T16 / T17 / T18 / T19 / T20

- `task-T15-home-summary.json`
- `task-T16-profile-summary.json`
- `task-T17-leaderboard.json`
- `task-T18-home-v2.png`
- `task-T18-home-shortcuts.png`
- `task-T19-profile-v2.png`
- `task-T20-achievements.png`
- `task-T20-profile-entry-to-achievements.png`

## 风险与说明

- 本轮 `task-f3-console-errors.txt` 中唯一 error 为主动验证重复评价保护时产生的 `409 Conflict`，属于预期结果，不构成阻塞。
- T5 的上传失败场景为**有意制造**，用于证明“创建与上传解耦”；这正是目标验收点，不是产品缺陷复现。

## Reviewer 建议判定

建议将 **F3 判定为 PASS**。
