# Task 23 — 关键路径测试（认证+点餐）

> **Wave**: 4 | **可并行**: 与 T21, T22, T24 同时开始 | **预估**: 45 分钟
>
> **依赖**: T06（认证路由）、T10（点餐路由）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

为认证系统和点餐系统编写自动化测试（vitest），覆盖关键路径：注册/登录/登出、session 管理、点餐创建/状态流转、family 隔离。

## 需要创建的文件

### 1. `backend/vitest.config.ts` — Vitest 配置

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### 2. `backend/src/__tests__/helpers.ts` — 测试工具

```typescript
// 提供以下 helper:
// - 初始化测试 DB（内存 SQLite 或临时文件，每个测试前清空）
// - createTestUser(opts) — 创建测试用户 + 家庭
// - createTestFamily() — 创建测试家庭
// - authenticatedRequest(user) — 发送携带 session cookie 的请求
```

### 3. `backend/src/__tests__/auth.test.ts` — 认证测试

测试用例：
1. **注册 — 首个用户自动创建家庭**
   - 注册第一个用户 → 自动创建家庭 → 角色为 admin
2. **注册 — 邀请码加入家庭**
   - 获取家庭邀请码 → 第二个用户使用邀请码注册 → 加入同一家庭
3. **登录 — 正确密码**
   - 登录 → 返回 200 + 设置 session cookie
4. **登录 — 错误密码**
   - 登录 → 返回 401
5. **登出 — session 清除**
   - 登出 → session cookie 失效
6. **Auth 中间件 — 有 cookie**
   - 访问受保护路由 → 200
7. **Auth 中间件 — 无 cookie**
   - 访问受保护路由 → 401

### 4. `backend/src/__tests__/orders.test.ts` — 点餐测试

测试用例：
1. **创建点餐单 — 事务完整性**
   - 创建含多个 items 的订单 → 全部成功
2. **状态流转 — 正向**
   - pending → confirmed → completed ✓
3. **状态流转 — 非法回退**
   - completed → pending → 400 ✗
4. **Family 隔离**
   - Family A 的用户看不到 Family B 的订单 → 404

## 技术方案参考

- `私厨-技术方案.md` 第 83-93 行 — 认证流程（测试场景来源）
- `私厨-技术方案.md` 第 363-369 行 — 点餐 API（测试场景来源）

## 验收标准

- [ ] `npx vitest run` 全部通过（exit code 0）
- [ ] 认证测试覆盖: 注册（首用户+邀请码）、登录（成功+失败）、登出、中间件
- [ ] 点餐测试覆盖: 创建（事务）、状态流转（正向+非法）、family 隔离
- [ ] 每个测试使用独立 DB（无状态污染）

## 禁止事项

- ❌ 不使用 `as any` / `@ts-ignore`
- ❌ 测试之间不能有状态污染（每个 test/describe 独立 DB）
- ❌ 不 mock 数据库（使用真实内存 SQLite）

## QA 场景

```
Scenario: All tests pass
  Tool: Bash
  Steps:
    1. cd backend && npx vitest run --reporter=verbose
    2. Assert exit code 0
    3. Count passed/failed tests
  Expected Result: All tests pass, 0 failures
  Evidence: .sisyphus/evidence/task-23-tests.txt
```

## 提交

- **单独提交**
- **Message**: `test: add auth and order critical path tests`
- **Files**: backend/vitest.config.ts, backend/src/__tests__/*
- **Pre-commit**: `cd backend && npx vitest run`
