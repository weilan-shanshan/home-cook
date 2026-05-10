import { eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { notificationEvents } from '../db/schema.js'
import { env } from '../lib/env.js'

const DELIVERY_INTERVAL_MS = 3_000
const RATE_LIMIT_BACKOFF_MS = 60_000

type NotificationPayload = Record<string, unknown>

type CreateNotificationEventInput = {
  familyId: number
  eventType: string
  entityType: string
  entityId: number
  payload: NotificationPayload
}

let deliveryTimer: NodeJS.Timeout | null = null
let delivering = false
let rateLimitedUntil = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ensureDeliveryLoopStarted() {
  if (deliveryTimer) {
    return
  }

  // 立即触发一次，让进程重启后能立即冲刷掉历史 pending 事件。
  void deliverPendingEvents()

  deliveryTimer = setInterval(() => {
    void deliverPendingEvents()
  }, DELIVERY_INTERVAL_MS)
  deliveryTimer.unref?.()
}

function getPayloadContent(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as NotificationPayload
    const message = parsed.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }

    const orderId = parsed.orderId
    if (typeof orderId === 'number') {
      return `🍽️ 新订单提醒，订单 #${orderId}`
    }
  } catch {
    // ignore invalid payload json and fall back below
  }

  return '📣 收到一条新的家庭通知'
}

async function postWechatText(content: string): Promise<{
  ok: boolean
  rateLimited?: boolean
  error?: string
}> {
  const url = env.WECHAT_WEBHOOK_URL
  if (!url) {
    return { ok: false, error: 'WECHAT_WEBHOOK_URL not set' }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content } }),
    })

    if (!res.ok) {
      return { ok: false, error: `Webhook request failed: HTTP ${res.status}` }
    }

    const body = (await res.json()) as { errcode?: number; errmsg?: string }
    if (body.errcode === 45009) {
      return {
        ok: false,
        rateLimited: true,
        error: `Webhook rate-limited: ${body.errcode}${body.errmsg ? ` ${body.errmsg}` : ''}`,
      }
    }
    if (body.errcode && body.errcode !== 0) {
      return {
        ok: false,
        error: `Webhook rejected: ${body.errcode}${body.errmsg ? ` ${body.errmsg}` : ''}`,
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown webhook error',
    }
  }
}

export async function createNotificationEvent(input: CreateNotificationEventInput) {
  ensureDeliveryLoopStarted()

  const [created] = await db
    .insert(notificationEvents)
    .values({
      familyId: input.familyId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: JSON.stringify(input.payload),
      status: 'pending',
      lastError: null,
    })
    .returning({
      id: notificationEvents.id,
      familyId: notificationEvents.familyId,
      eventType: notificationEvents.eventType,
      entityType: notificationEvents.entityType,
      entityId: notificationEvents.entityId,
      payload: notificationEvents.payload,
      status: notificationEvents.status,
      createdAt: notificationEvents.createdAt,
      sentAt: notificationEvents.sentAt,
      lastError: notificationEvents.lastError,
    })

  void deliverPendingEvents()

  return created
}

export async function deliverPendingEvents(): Promise<void> {
  if (delivering) {
    return
  }
  if (Date.now() < rateLimitedUntil) {
    return
  }

  delivering = true

  try {
    const pendingEvents = await db
      .select({
        id: notificationEvents.id,
        familyId: notificationEvents.familyId,
        eventType: notificationEvents.eventType,
        payload: notificationEvents.payload,
      })
      .from(notificationEvents)
      .where(eq(notificationEvents.status, 'pending'))
      .orderBy(notificationEvents.id)
      .limit(20)

    if (pendingEvents.length === 0) {
      return
    }

    if (!env.WECHAT_WEBHOOK_URL) {
      console.warn('[notification] WECHAT_WEBHOOK_URL is not set; events stay pending')
      for (const event of pendingEvents) {
        await db
          .update(notificationEvents)
          .set({ lastError: 'WECHAT_WEBHOOK_URL not set' })
          .where(eq(notificationEvents.id, event.id))
      }
      return
    }

    for (const event of pendingEvents) {
      const content = getPayloadContent(event.payload)
      const result = await postWechatText(content)

      if (result.ok) {
        await db
          .update(notificationEvents)
          .set({
            status: 'sent',
            sentAt: sql`(datetime('now'))`,
            lastError: null,
          })
          .where(eq(notificationEvents.id, event.id))
        // 控制群机器人 QPS（企业微信 20 条/分钟），消息间隔 ~3s。
        await sleep(DELIVERY_INTERVAL_MS)
        continue
      }

      // 速率受限：暂停整个投递循环，过一分钟再来。事件保持 pending 等待重试。
      if (result.rateLimited) {
        await db
          .update(notificationEvents)
          .set({ lastError: result.error ?? 'rate limited' })
          .where(eq(notificationEvents.id, event.id))
        rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS
        console.error(
          `[notification] webhook rate-limited; backing off ${RATE_LIMIT_BACKOFF_MS}ms`,
        )
        return
      }

      // 永久性错误（webhook 拒绝/网络错误等）：标记失败避免无限重试，
      // 运维可以手工把 status 改回 pending 触发重投。
      await db
        .update(notificationEvents)
        .set({
          status: 'failed',
          lastError: result.error ?? 'Unknown delivery failure',
        })
        .where(eq(notificationEvents.id, event.id))

      console.error(
        `[notification] delivery failed for event ${event.id} (${event.eventType}): ${result.error}`,
      )
    }
  } finally {
    delivering = false
  }
}

export async function shutdownNotificationService(): Promise<void> {
  if (deliveryTimer) {
    clearInterval(deliveryTimer)
    deliveryTimer = null
  }

  while (delivering) {
    await sleep(10)
  }
}
