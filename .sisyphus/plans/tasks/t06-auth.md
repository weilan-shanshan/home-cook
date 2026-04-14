# Task 06 — 认证系统（注册/登录/登出 + 中间件）

> **Wave**: 2 | **可并行**: 与 T07-T14 同时开始 | **预估**: 45 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T15（前端认证页）、T19（个人中心）、T20（布局路由）、T21（后端集成）、T23（测试）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。
>
> 但需要先检查 T01 的 Lucia v3 验证结果：
> - 如果 `lucia@3` 安装成功 → 使用 Lucia
> - 如果 Lucia 已废弃 → 使用 T01 中创建的手动 session 方案 `backend/src/lib/auth.ts`

---

## 目标

实现完整认证系统：Session-based 认证（Lucia v3 或手动方案）、邀请码注册、登录/登出、认证中间件、CORS 中间件。

## 需要创建的文件

### 1. `backend/src/lib/lucia.ts` — Session 管理配置

**如果 Lucia v3 可用**：
```typescript
import { Lucia } from 'lucia'
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite'
import { sqlite } from '../db'

const adapter = new BetterSqlite3Adapter(sqlite, {
  user: 'users',
  session: 'sessions',
})

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  },
  getUserAttributes: (attributes) => ({
    username: attributes.username,
    displayName: attributes.display_name,
    role: attributes.role,
  }),
})
```

**如果 Lucia 废弃**：使用 T01 创建的手动方案 `backend/src/lib/auth.ts`。

### 2. `backend/src/middleware/auth.ts` — 认证中间件

```typescript
// 关键功能:
// 1. 从 Cookie 读取 session ID
// 2. 验证 session 有效性
// 3. 查询用户所属的 family_id
// 4. 注入到 Hono Context: c.set('user', user) + c.set('familyId', familyId)
//
// ⚠️ 所有受保护路由通过此中间件获取 familyId，用于 WHERE 查询防止 IDOR
```

### 3. `backend/src/middleware/cors.ts` — CORS 配置

```typescript
// 允许 FRONTEND_ORIGIN（从 env 读取）
// credentials: true（允许 Cookie）
// methods: GET, POST, PUT, DELETE, OPTIONS
```

### 4. `backend/src/routes/auth.ts` — 认证路由

**4 个端点**：

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 当前用户信息 |

**注册逻辑（关键）**：
1. Zod 校验输入: `{ username, display_name, password, invite_code? }`
2. **首次使用检测**: 查询 families 表，若为空 → 首个用户流程
   - 不需要 invite_code
   - 创建 user（role=admin）
   - 自动创建 family（生成 6 位随机邀请码）
   - 创建 family_member 关联
3. **后续用户**: 
   - 必须提供 invite_code
   - 验证邀请码对应的 family 存在
   - 创建 user（role=member）
   - 创建 family_member 关联
4. 密码使用 `@node-rs/argon2` 哈希
5. 创建 session，设置 Cookie（HttpOnly, Secure, SameSite=Strict）

**登录逻辑**：
1. 查找 username 对应的 user
2. 验证密码哈希
3. 创建 session + 设置 Cookie
4. 返回用户信息

**登出逻辑**：
1. 删除 session 记录
2. 清除 Cookie

**GET /me**：
1. 需要认证（经 auth 中间件）
2. 返回 `{ id, username, display_name, role, familyId }`

**邀请码生成**：
```typescript
// 6 位随机大写字母+数字
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉容易混淆的 I/O/0/1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

## 验收标准

- [ ] 4 个认证端点全部实现
- [ ] 首次注册（无家庭）自动创建家庭 + admin 角色
- [ ] 后续注册需要有效邀请码
- [ ] 密码使用 argon2 哈希（不明文存储）
- [ ] Cookie 设置 HttpOnly + Secure + SameSite=Strict
- [ ] auth 中间件注入 `user` 和 `familyId` 到 Context
- [ ] 无效 session / 无 cookie → 返回 401
- [ ] `npx tsc --noEmit` 通过

## 禁止事项

- 不在 localStorage 存 token（用 HttpOnly Cookie）
- 不使用 JWT（方案指定 Session-based）
- 不跳过密码哈希
- 不使用 `as any`
