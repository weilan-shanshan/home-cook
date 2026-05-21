import type { OrderStatus } from '@/hooks/useOrders'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '等接手',
  submitted: '等接手',
  confirmed: '已接手',
  preparing: '正在做',
  completed: '做好了',
  cancelled: '已取消',
}

export const STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  'default' | 'sage' | 'amber' | 'secondary' | 'destructive'
> = {
  pending: 'default',
  submitted: 'default',
  confirmed: 'default',
  preparing: 'amber',
  completed: 'sage',
  cancelled: 'secondary',
}

export const ACTIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'submitted',
  'confirmed',
  'preparing',
])

export const TIMELINE_STAGES = ['submitted', 'confirmed', 'preparing', 'completed'] as const
export type TimelineStage = (typeof TIMELINE_STAGES)[number]

export const STAGE_LABEL: Record<TimelineStage, string> = {
  submitted: '已下单',
  confirmed: '已接手',
  preparing: '正在做',
  completed: '做好了',
}

export function statusToTimelineIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 0
    case 'confirmed':
      return 1
    case 'preparing':
      return 2
    case 'completed':
      return 3
    case 'cancelled':
      return -1
  }
}

export interface OrderActionContext {
  status: OrderStatus
  isMine: boolean
  hasCook: boolean
  isCook: boolean
}

export interface OrderAction {
  label: string
  next: 'confirmed' | 'preparing' | 'completed' | 'cancelled'
  variant: 'default' | 'destructive'
}

export function nextActionFor(ctx: OrderActionContext): OrderAction | null {
  const { status, isMine, hasCook } = ctx
  if ((status === 'submitted' || status === 'pending') && !isMine && !hasCook) {
    return { label: '我来做', next: 'confirmed', variant: 'default' }
  }
  if (status === 'confirmed') {
    return { label: '去做', next: 'preparing', variant: 'default' }
  }
  if (status === 'preparing') {
    return { label: '做好啦 ✓', next: 'completed', variant: 'default' }
  }
  return null
}

export function canCancel(status: OrderStatus): boolean {
  return status === 'submitted' || status === 'pending' || status === 'confirmed'
}

export function mealTypeLabel(mealType: string): string {
  switch (mealType) {
    case 'breakfast':
      return '早餐'
    case 'lunch':
      return '午餐'
    case 'dinner':
      return '晚餐'
    case 'snack':
      return '加餐'
    default:
      return mealType
  }
}
