# Task 14 — 家庭管理路由

> **Wave**: 2 | **可并行**: 与 T06-T13 同时开始 | **预估**: 20 分钟
>
> **依赖**: T01（脚手架）、T02（DB schema）
>
> **后续任务等我完成**: T19（前端个人中心页面）、T21（后端集成）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

创建 `backend/src/routes/families.ts`，实现家庭管理功能（4 个端点），包含邀请码生成和家庭加入。

## 需要创建的文件

### `backend/src/routes/families.ts`

4 个端点：

1. **`POST /api/families`** — 创建家庭
   - admin only
   - 自动生成 6 位随机邀请码（字母+数字）
   - 创建者自动成为 admin 成员

2. **`GET /api/families/:id`** — 获取家庭信息
   - 含邀请码（仅本家庭成员可见）
   - 非本家庭成员返回 403

3. **`GET /api/families/:id/members`** — 获取成员列表
   - 返回 display_name, role, joined_at
   - 验证请求者是本家庭成员

4. **`POST /api/families/join`** — 通过邀请码加入家庭
   - 验证邀请码有效
   - 将用户加入对应家庭

### 邀请码生成

```typescript
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉易混淆的 I/O/0/1
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
```

## 技术方案参考

- `私厨-技术方案.md` 第 304-311 行 — 家庭 API
- `私厨-技术方案.md` 第 157-171 行 — families + family_members 表

## 验收标准

- [ ] 4 个家庭端点实现
- [ ] 邀请码为 6 位随机字符串（排除易混淆字符）
- [ ] 仅本家庭成员可查看家庭信息和成员列表
- [ ] 非成员访问返回 403

## 禁止事项

- ❌ 不跳过家庭成员身份验证
- ❌ 邀请码不使用易混淆字符（I/O/0/1）
- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: Get family members
  Tool: Bash (curl)
  Steps:
    1. GET /api/families/:id/members (as family member)
    2. Assert response is array with member objects containing display_name
    3. GET /api/families/:otherId/members (as non-member)
    4. Assert 403
  Expected Result: Members listed for own family, forbidden for others
  Evidence: .sisyphus/evidence/task-14-family.txt
```

## 提交

- **Group**: 与 T13 一起提交
- **Message**: `feat(api): add cook logs, ratings, and family management routes`
- **Pre-commit**: `cd backend && npx tsc --noEmit`
