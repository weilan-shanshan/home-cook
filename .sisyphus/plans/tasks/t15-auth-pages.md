# Task 15 — 前端认证页面（登录/注册）

> **Wave**: 3 | **可并行**: 与 T16-T20 同时开始 | **预估**: 40 分钟
>
> **依赖**: T03（shadcn/ui + Apple 风样式）、T06（认证后端）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 前提：T03 已完成（shadcn/ui 组件和 Apple 风格全局样式就绪）、T06 已完成（认证 API 可用）。

---

## 目标

实现前端认证系统：登录页、注册页（含首次创建家庭和邀请码加入两种模式）、认证 hooks、路由守卫。

## 需要创建的文件

### 1. `frontend/src/pages/auth/Login.tsx` — 登录页

- 表单: 用户名 + 密码
- 使用 shadcn/ui Input, Button, Card 组件
- TanStack Query mutation 调用 POST /api/auth/login
- 登录成功跳转首页 `/`
- **Apple 风格**: 居中卡片、大圆角（rounded-2xl）、柔和阴影

### 2. `frontend/src/pages/auth/Register.tsx` — 注册页

- **两种模式**:
  1. **首次使用（创建家庭）**: 用户名 + 昵称 + 密码（第一个用户自动创建家庭成为 admin）
  2. **加入家庭**: 邀请码 + 用户名 + 昵称 + 密码
- 自动检测是否有家庭存在来决定模式（或提供切换开关）
- TanStack Query mutation 调用 POST /api/auth/register

### 3. `frontend/src/hooks/useAuth.ts` — 认证 Hook

```typescript
// 需要导出的 hooks:
useCurrentUser()  // TanStack Query 缓存 GET /api/auth/me
useLogin()        // mutation
useLogout()       // mutation + invalidate queries
useRegister()     // mutation
```

### 4. `frontend/src/lib/auth.ts` — 认证守卫

```typescript
// RequireAuth 组件 — 包裹受保护路由
// 未登录时重定向到 /login
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}
```

## 技术方案参考

- `私厨-技术方案.md` 第 385-387 行 — auth 页面结构
- `私厨-技术方案.md` 第 83-93 行 — 认证流程
- `私厨-技术方案.md` 第 407-423 行 — UI 风格要点

## 验收标准

- [ ] 登录/注册两个页面组件实现
- [ ] useAuth hook 封装所有认证操作（useCurrentUser, useLogin, useLogout, useRegister）
- [ ] RequireAuth 守卫：未登录重定向到 /login
- [ ] Apple 风格 UI（大圆角卡片、柔和阴影、系统字体）
- [ ] 注册支持两种模式：创建家庭 / 邀请码加入

## 禁止事项

- ❌ 不在 localStorage 存 token（使用 httpOnly cookie，由后端管理）
- ❌ 不使用裸 fetch（使用 T01 创建的 Hono RPC 客户端或封装的 api 模块）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Login page renders and submits
  Tool: Playwright
  Preconditions: Frontend dev server running, backend running
  Steps:
    1. Navigate to /login
    2. Assert page contains input[name="username"] and input[name="password"]
    3. Fill username="chef", password="test1234"
    4. Click submit button
    5. Wait for navigation to /
    6. Assert URL is / (home page)
  Expected Result: Successful login redirects to home
  Evidence: .sisyphus/evidence/task-15-login.png

Scenario: Unauthenticated access redirects to login
  Tool: Playwright
  Preconditions: Frontend dev server running, no active session
  Steps:
    1. Navigate to / (home)
    2. Assert redirect to /login
  Expected Result: Redirected to /login
  Evidence: .sisyphus/evidence/task-15-auth-guard.png
```

## 提交

- **Group**: 与 T16-T20 一起提交
- **Message**: `feat(frontend): implement all pages with Apple-style UI`
- **Pre-commit**: `cd frontend && npm run build`
