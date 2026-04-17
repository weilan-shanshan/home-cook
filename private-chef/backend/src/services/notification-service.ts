import { and, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  familyMembers,
  notificationDeliveries,
  notificationEvents,
} from '../db/schema.js'
import { env } from '../lib/env.js'

const DELIVERY_INTERVAL_MS = 3_000

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureDeliveryLoopStarted() {
  if (deliveryTimer) {
    return
  }

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

async function postWechatText(content: string): Promise<{ ok: boolean; error?: string }> {
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

  delivering = true

  try {
    const pendingEvents = await db
      .select({
        id: notificationEvents.id,
        familyId: notificationEvents.familyId,
        payload: notificationEvents.payload,
      })
      .from(notificationEvents)
      .where(eq(notificationEvents.status, 'pending'))
      .orderBy(notificationEvents.id)

    if (pendingEvents.length === 0) {
      return
    }

    const webhookUrl = env.WECHAT_WEBHOOK_URL
    for (const event of pendingEvents) {
      if (!webhookUrl) {
        await db
          .update(notificationEvents)
          .set({ lastError: 'WECHAT_WEBHOOK_URL not set' })
          .where(eq(notificationEvents.id, event.id))
        continue
      }

      let deliveries = await db
        .select({
          id: notificationDeliveries.id,
          targetUserId: notificationDeliveries.targetUserId,
          status: notificationDeliveries.status,
          attemptCount: notificationDeliveries.attemptCount,
          lastError: notificationDeliveries.lastError,
        })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.notificationId, event.id))

      if (deliveries.length === 0) {
        const targets = await db
          .select({ userId: familyMembers.userId })
          .from(familyMembers)
          .where(eq(familyMembers.familyId, event.familyId))

        if (targets.length === 0) {
          await db
            .update(notificationEvents)
            .set({ lastError: 'No family members to notify' })
            .where(eq(notificationEvents.id, event.id))
          continue
        }

        await db.insert(notificationDeliveries).values(
          targets.map((target) => ({
            notificationId: event.id,
            targetUserId: target.userId,
            channel: 'wechat',
            status: 'pending',
            attemptCount: 0,
            lastError: null,
          })),
        )

        deliveries = await db
          .select({
            id: notificationDeliveries.id,
            targetUserId: notificationDeliveries.targetUserId,
            status: notificationDeliveries.status,
            attemptCount: notificationDeliveries.attemptCount,
            lastError: notificationDeliveries.lastError,
          })
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, event.id))
      }

      const content = getPayloadContent(event.payload)
      let lastError: string | null = null
      let hasPendingOrFailedDelivery = false

      for (const delivery of deliveries) {
        if (delivery.status === 'sent' || delivery.status === 'failed') {
          if (delivery.status === 'failed') {
            hasPendingOrFailedDelivery = true
            lastError = lastError ?? 'Previous delivery failed'
          }
          continue
        }

        const result = await postWechatText(content)
        const nextAttemptCount = delivery.attemptCount + 1

        if (result.ok) {
          await db
            .update(notificationDeliveries)
            .set({
              status: 'sent',
              attemptCount: nextAttemptCount,
              lastError: null,
              updatedAt: sql`(datetime('now'))`,
            })
            .where(eq(notificationDeliveries.id, delivery.id))
          continue
        }

        lastError = result.error ?? 'Unknown delivery failure'
        hasPendingOrFailedDelivery = true
        await db
          .update(notificationDeliveries)
          .set({
            status: 'failed',
            attemptCount: nextAttemptCount,
            lastError,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(notificationDeliveries.id, delivery.id))
      }

      await db
        .update(notificationEvents)
        .set(
          hasPendingOrFailedDelivery
            ? {
                status: 'pending',
                lastError,
              }
            : {
                status: 'sent',
                sentAt: sql`(datetime('now'))`,
                lastError: null,
              },
        )
        .where(
          and(
            eq(notificationEvents.id, event.id),
            eq(notificationEvents.status, 'pending'),
          ),
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
