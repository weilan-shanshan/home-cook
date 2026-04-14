import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) {
      await cleanup()
    }
  }
})

describe.sequential('cors origin matching', () => {
  test('allows configured apex domain', async () => {
    const ctx = await createTestContext({ frontendOrigin: 'https://weilanshanshan.top' })
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/', {
      headers: { Origin: 'https://weilanshanshan.top' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('https://weilanshanshan.top')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })

  test('allows configured subdomain', async () => {
    const ctx = await createTestContext({ frontendOrigin: 'https://weilanshanshan.top' })
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/', {
      headers: { Origin: 'https://www.weilanshanshan.top' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('https://www.weilanshanshan.top')
  })

  test('allows localhost development origin', async () => {
    const ctx = await createTestContext({ frontendOrigin: 'https://weilanshanshan.top' })
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/', {
      headers: { Origin: 'http://localhost:5173' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
  })

  test('rejects unrelated origin', async () => {
    const ctx = await createTestContext({ frontendOrigin: 'https://weilanshanshan.top' })
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/', {
      headers: { Origin: 'https://evil-example.com' },
    })

    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  test('preflight responds for allowed subdomain', async () => {
    const ctx = await createTestContext({ frontendOrigin: 'https://weilanshanshan.top' })
    cleanups.push(ctx.cleanup)

    const response = await ctx.request('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://cook.weilanshanshan.top',
        'Access-Control-Request-Method': 'POST',
      },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('https://cook.weilanshanshan.top')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })
})
