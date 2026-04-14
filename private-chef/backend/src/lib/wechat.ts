import { env } from './env.js'

const SEND_INTERVAL = 3_000
const RATE_LIMIT_WAIT = 60_000

const queue: string[] = []
let sending = false

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function flush(): Promise<void> {
  if (sending) return
  sending = true

  while (queue.length > 0) {
    const content = queue.shift()!
    const url = env.WECHAT_WEBHOOK_URL

    if (!url) {
      console.warn('[wechat] WECHAT_WEBHOOK_URL not set, skipping:', content)
      await sleep(SEND_INTERVAL)
      continue
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content } }),
      })

      const body = (await res.json()) as { errcode?: number; errmsg?: string }

      if (body.errcode === 45009) {
        console.warn('[wechat] rate-limited (45009), retrying in 60s:', content)
        queue.unshift(content)
        await sleep(RATE_LIMIT_WAIT)
        continue
      }

      if (body.errcode && body.errcode !== 0) {
        console.error('[wechat] send failed:', body.errcode, body.errmsg)
      }
    } catch (err) {
      console.error('[wechat] fetch error:', err)
    }

    await sleep(SEND_INTERVAL)
  }

  sending = false
}

export function notify(content: string): void {
  queue.push(content)
  void flush()
}

export function notifyNewOrder(
  userName: string,
  mealType: string,
  items: string[],
): void {
  notify(`🍽️ ${userName}点了${mealType}：${items.join('、')}`)
}

export function notifyNewRecipe(
  userName: string,
  recipeName: string,
  cookMinutes?: number,
): void {
  let msg = `👨‍🍳 ${userName}新增菜谱：${recipeName}`
  if (cookMinutes !== undefined) {
    msg += `（预计${cookMinutes}分钟）`
  }
  notify(msg)
}

export function notifyNewWish(userName: string, dishName: string): void {
  notify(`🌟 ${userName}许愿想吃：${dishName}`)
}
