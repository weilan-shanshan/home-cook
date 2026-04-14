# Task 28 — 前端文案中文化（默认中文，不引入完整 i18n）

> **Wave**: 6 | **可并行**: 可与 T27 独立推进 | **预估**: 45 分钟
>
> **依赖**: T15-T20（前端页面与布局已完成）
>
> **后续任务等我完成**: 如未来确需多语言，再单独新增 i18n 任务

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 前提：Wave 3 的页面与布局任务已经完成，当前前端可以成功构建并手动验证主要路由。

---

## 目标

将当前前端中面向用户的英文界面文案统一改为中文，保证默认体验为中文、术语一致、关键流程无残留英文。

**本任务聚焦“文案中文化”本身**，不额外引入完整国际化基础设施；若后续确定需要中英切换，再新增独立任务建设 i18n。

## 需要修改的文件

### 1. `frontend/src/pages/auth/Login.tsx`、`frontend/src/pages/auth/Register.tsx`

- 登录 / 注册页标题、副标题、按钮、表单标签、校验提示、跳转文案改为中文
- 保持现有交互和布局不变

### 2. `frontend/src/pages/home/Home.tsx`

- 首页标题、搜索占位文案、空状态、加载态、分页按钮改为中文
- 标签筛选相关辅助文案统一中文表达

### 3. `frontend/src/pages/recipe/RecipeForm.tsx`、`frontend/src/pages/recipe/RecipeDetail.tsx`

- 菜谱创建 / 编辑 / 详情页的按钮、表单项、对话框、加载态、空状态、评分提示改为中文
- 保持已有业务逻辑、上传逻辑、评分逻辑不变

### 4. `frontend/src/pages/order/*.tsx`、`frontend/src/pages/wish/WishList.tsx`、`frontend/src/pages/favorites/Favorites.tsx`、`frontend/src/pages/profile/Profile.tsx`

- 点餐、许愿、收藏、个人中心中的用户可见英文文案改为中文
- 统一常见动作词：创建 / 保存 / 取消 / 加载中 / 查看详情 / 退出登录 等

### 5. `frontend/src/components/**/*.tsx`、`frontend/src/lib/auth.tsx`

- 组件级空状态、辅助提示、按钮 title、认证校验提示中的英文文案改为中文
- `RequireAuth` / 认证 loading 提示改为中文

## 范围说明

### 本任务必须覆盖

- 页面标题、副标题
- 按钮文案
- 表单标签与 placeholder
- Loading / Empty / Error / Toast 文案
- 弹窗标题、说明、确认 / 取消按钮
- 组件内 title / aria-label（如果面向用户可感知）

### 本任务不要求覆盖

- 用户自己输入的自由文本
- 后端直接返回且当前前端未接管映射的原始错误文案
- 新增语言切换器
- 接入 `react-i18next`、`i18next`、字典 JSON、Provider 等完整 i18n 方案

## 推荐执行顺序

1. 先盘点核心路由仍然可见的英文文案（登录、注册、首页、菜谱、点餐、许愿、收藏、个人中心）
2. 再统一高频动作词和常见状态词，避免同义词混乱
3. 最后清理组件级残留英文文案，并做一次全局 grep 复查

## 技术方案参考

- `.sisyphus/plans/tasks/t15-auth-pages.md`
- `.sisyphus/plans/tasks/t16-recipe-pages.md`
- `.sisyphus/plans/tasks/t17-order-pages.md`
- `.sisyphus/plans/tasks/t18-wish-fav-log-pages.md`
- `.sisyphus/plans/tasks/t19-profile-page.md`
- `.sisyphus/plans/tasks/t20-layout-router.md`

## 验收标准

- [ ] 登录、注册、首页、菜谱、点餐、许愿、收藏、个人中心等主路径页面不再出现明显英文 UI 文案
- [ ] Loading / Empty / Toast / Dialog / Button 等高频交互文案统一为中文
- [ ] 已有中文区域（如 TabBar）与新增中文文案风格保持一致
- [ ] 不新增完整 i18n 依赖或 Provider
- [ ] `cd private-chef/frontend && npm run build` 成功

## 禁止事项

- ❌ 不为了本任务引入完整多语言框架，导致范围膨胀
- ❌ 不修改业务接口契约或后端返回结构
- ❌ 不顺手重构无关逻辑
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```text
Scenario: Core routes show Chinese UI copy
  Tool: Playwright
  Preconditions: Frontend dev server running, backend running
  Steps:
    1. Navigate to /login, /register, /, /order/create, /wishes, /favorites, /profile
    2. Confirm primary titles, buttons, and empty states are Chinese
    3. Record screenshots of at least login, home, and profile
  Expected Result: Main user-visible UI strings are Chinese across core routes
  Evidence: .sisyphus/evidence/task-28-core-routes-zh.png

Scenario: No obvious app-owned English copy remains
  Tool: Grep + manual spot check
  Steps:
    1. Search frontend source for common English UI phrases (Login, Register, Save, Cancel, Loading, Favorites, Wishlist, Profile, Create Order)
    2. Exclude dependency code and user data
    3. Review remaining matches manually
  Expected Result: No residual app-owned English UI copy in covered frontend files
  Evidence: .sisyphus/evidence/task-28-copy-audit.txt

Scenario: Frontend still builds after copy updates
  Tool: Bash
  Steps:
    1. cd private-chef/frontend && npm run build
  Expected Result: Build succeeds without new type or bundling errors
  Evidence: .sisyphus/evidence/task-28-frontend-build.txt
```

## 提交

- **Group**: 可单独提交，或与其他 Wave 6 文档/收尾任务一起提交
- **Message**: `docs(tasks): add frontend Chinese localization task`
- **Pre-commit**: `cd private-chef/frontend && npm run build`
