# Task 19 — 前端个人中心+家庭管理页面

> **Wave**: 3 | **可并行**: 与 T15-T18, T20 同时开始 | **预估**: 25 分钟
>
> **依赖**: T03（shadcn/ui）、T06（认证路由）、T14（家庭管理路由）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

实现前端个人中心页面：用户信息展示、家庭信息卡片、邀请码复制、成员列表、登出。

## 需要创建的文件

### 1. `frontend/src/pages/profile/Profile.tsx` — 个人中心

- 用户信息区域:
  - 头像占位（首字母圆形头像）
  - 昵称
  - 角色（admin / member）
- 家庭信息卡片:
  - 家庭名称
  - 邀请码展示 + 一键复制（点击复制到剪贴板，Toast 提示"已复制"）
  - 成员数量
- 家庭成员列表:
  - 每行: 头像/首字母 + 昵称 + 角色 badge
- 登出按钮（底部）

### 2. `frontend/src/hooks/useFamily.ts` — 家庭 hooks

```typescript
useFamily(id)        // GET /api/families/:id
useFamilyMembers(id) // GET /api/families/:id/members
```

## 技术方案参考

- `私厨-技术方案.md` 第 400-401 行 — 个人中心页面

## 验收标准

- [ ] 展示用户信息（昵称、角色）
- [ ] 展示家庭信息和邀请码
- [ ] 邀请码可一键复制（Clipboard API + Toast 反馈）
- [ ] 成员列表展示
- [ ] 登出功能正常（调用 useLogout，跳转 /login）

## 禁止事项

- ❌ 不使用裸 fetch
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Profile shows family info
  Tool: Playwright
  Steps:
    1. Navigate to /profile
    2. Assert display_name visible
    3. Assert invite code visible (6 characters)
    4. Assert member list has at least 1 member
  Expected Result: Profile page displays all info
  Evidence: .sisyphus/evidence/task-19-profile.png
```

## 提交

- **Group**: 与 T15-T18, T20 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
