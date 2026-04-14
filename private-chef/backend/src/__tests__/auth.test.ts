import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext, getSessionCookie, readJson } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) {
      await cleanup()
    }
  }
})

describe.sequential('auth critical path', () => {
  test('create-mode register creates family and admin membership', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'chef-admin',
        display_name: '主厨',
        password: 'password123',
        mode: 'create',
      },
    })

    expect(response.status).toBe(201)
    expect(getSessionCookie(response)).toMatch(/^session=/)

    const body = await readJson<{
      id: number
      username: string
      display_name: string
      role: string
      familyId: number
      inviteCode: string
    }>(response)

    expect(body).toMatchObject({
      username: 'chef-admin',
      display_name: '主厨',
      role: 'admin',
    })
    expect(body.inviteCode).toHaveLength(6)

    const user = ctx.sqlite
      .prepare('SELECT id, role FROM users WHERE username = ?')
      .get('chef-admin') as { id: number; role: string }
    const family = ctx.sqlite
      .prepare('SELECT id, invite_code, created_by FROM families')
      .get() as { id: number; invite_code: string; created_by: number }
    const membership = ctx.sqlite
      .prepare('SELECT family_id, user_id FROM family_members WHERE user_id = ?')
      .get(user.id) as { family_id: number; user_id: number }

    expect(user.role).toBe('admin')
    expect(family.id).toBe(body.familyId)
    expect(family.invite_code).toBe(body.inviteCode)
    expect(family.created_by).toBe(user.id)
    expect(membership).toEqual({ family_id: family.id, user_id: user.id })
  })

  test('invite-code join registers member into existing family', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const firstRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'family-admin',
        display_name: '家长',
        password: 'password123',
        mode: 'create',
      },
    })
    const firstBody = await readJson<{ familyId: number; inviteCode: string }>(firstRegister)

    const secondRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'family-member',
        display_name: '家人',
        password: 'password123',
        mode: 'join',
        invite_code: firstBody.inviteCode,
      },
    })

    expect(secondRegister.status).toBe(201)
    expect(getSessionCookie(secondRegister)).toMatch(/^session=/)

    const secondBody = await readJson<{
      id: number
      role: string
      familyId: number
    }>(secondRegister)

    expect(secondBody.role).toBe('member')
    expect(secondBody.familyId).toBe(firstBody.familyId)

    const membershipCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM family_members WHERE family_id = ?')
      .get(firstBody.familyId) as { count: number }

    expect(membershipCount.count).toBe(2)
  })

  test('join-mode register normalizes invite code casing and whitespace', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const firstRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'normalized-admin',
        display_name: '标准化家长',
        password: 'password123',
        mode: 'create',
      },
    })
    const firstBody = await readJson<{ familyId: number; inviteCode: string }>(firstRegister)

    const secondRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'normalized-member',
        display_name: '标准化家人',
        password: 'password123',
        mode: 'join',
        invite_code: `  ${firstBody.inviteCode.toLowerCase()}  `,
      },
    })

    expect(secondRegister.status).toBe(201)

    const secondBody = await readJson<{
      role: string
      familyId: number
    }>(secondRegister)

    expect(secondBody.role).toBe('member')
    expect(secondBody.familyId).toBe(firstBody.familyId)
  })

  test('create-mode register still creates a new family after bootstrap', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const firstRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'status-admin',
        display_name: '状态管理员',
        password: 'password123',
        mode: 'create',
      },
    })

    const firstBody = await readJson<{ familyId: number }>(firstRegister)

    const secondRegister = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'second-admin',
        display_name: '第二个管理员',
        password: 'password123',
        mode: 'create',
      },
    })

    expect(secondRegister.status).toBe(201)

    const secondBody = await readJson<{
      role: string
      familyId: number
      inviteCode: string
    }>(secondRegister)

    expect(secondBody.role).toBe('admin')
    expect(secondBody.familyId).not.toBe(firstBody.familyId)
    expect(secondBody.inviteCode).toHaveLength(6)

    const familyCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM families')
      .get() as { count: number }

    expect(familyCount.count).toBe(2)
  })

  test('join-mode register requires invite code', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'join-without-code',
        display_name: '缺少邀请码',
        password: 'password123',
        mode: 'join',
      },
    })

    expect(response.status).toBe(400)
    expect(await readJson<{ error: string }>(response)).toEqual({
      error: 'Invite code is required',
    })
  })

  test('login succeeds with valid credentials', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'login-user',
        display_name: '登录用户',
        password: 'password123',
        mode: 'create',
      },
    })

    const response = await ctx.request('/api/auth/login', {
      method: 'POST',
      json: {
        username: 'login-user',
        password: 'password123',
      },
    })

    expect(response.status).toBe(200)
    expect(getSessionCookie(response)).toMatch(/^session=/)

    const body = await readJson<{
      id: number
      username: string
      display_name: string
      role: string
      familyId: number | null
    }>(response)

    expect(body).toMatchObject({
      username: 'login-user',
      display_name: '登录用户',
      role: 'admin',
    })
    expect(body.familyId).not.toBeNull()
  })

  test('login fails with invalid credentials', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'wrong-pass-user',
        display_name: '错误密码用户',
        password: 'password123',
        mode: 'create',
      },
    })

    const response = await ctx.request('/api/auth/login', {
      method: 'POST',
      json: {
        username: 'wrong-pass-user',
        password: 'bad-password',
      },
    })

    expect(response.status).toBe(401)
    expect(await readJson<{ error: string }>(response)).toEqual({
      error: 'Invalid username or password',
    })
  })

  test('logout clears session', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const registerResponse = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'logout-user',
        display_name: '退出用户',
        password: 'password123',
        mode: 'create',
      },
    })
    const sessionCookie = getSessionCookie(registerResponse)

    expect(sessionCookie).toMatch(/^session=/)

    const logoutResponse = await ctx.request('/api/auth/logout', {
      method: 'POST',
      cookie: sessionCookie!,
    })

    expect(logoutResponse.status).toBe(200)
    expect(logoutResponse.headers.get('set-cookie')).toContain('session=')

    const meResponse = await ctx.request('/api/auth/me', {
      cookie: sessionCookie!,
    })

    expect(meResponse.status).toBe(401)
    expect(await readJson<{ error: string }>(meResponse)).toEqual({
      error: 'Unauthorized',
    })
  })

  test('auth middleware accepts valid session cookie', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const registerResponse = await ctx.request('/api/auth/register', {
      method: 'POST',
      json: {
        username: 'me-user',
        display_name: '会话用户',
        password: 'password123',
        mode: 'create',
      },
    })
    const sessionCookie = getSessionCookie(registerResponse)

    const response = await ctx.request('/api/auth/me', {
      cookie: sessionCookie!,
    })

    expect(response.status).toBe(200)
    expect(await readJson<{
      username: string
      display_name: string
      role: string
      familyId: number
    }>(response)).toMatchObject({
      username: 'me-user',
      display_name: '会话用户',
      role: 'admin',
    })
  })

  test('auth middleware rejects missing session cookie', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/api/auth/me')

    expect(response.status).toBe(401)
    expect(await readJson<{ error: string }>(response)).toEqual({
      error: 'Unauthorized',
    })
  })
})
