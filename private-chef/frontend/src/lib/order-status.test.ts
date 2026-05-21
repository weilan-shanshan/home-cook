import { describe, expect, test } from 'vitest'
import {
  STATUS_LABEL,
  STATUS_BADGE_VARIANT,
  ACTIVE_STATUSES,
  TIMELINE_STAGES,
  STAGE_LABEL,
  statusToTimelineIndex,
  nextActionFor,
  canCancel,
} from './order-status'

describe('STATUS_LABEL', () => {
  test('covers all 6 statuses', () => {
    expect(STATUS_LABEL.pending).toBe('等接手')
    expect(STATUS_LABEL.submitted).toBe('等接手')
    expect(STATUS_LABEL.confirmed).toBe('已接手')
    expect(STATUS_LABEL.preparing).toBe('正在做')
    expect(STATUS_LABEL.completed).toBe('做好了')
    expect(STATUS_LABEL.cancelled).toBe('已取消')
  })
})

describe('STATUS_BADGE_VARIANT', () => {
  test('maps each status to a known badge variant', () => {
    expect(STATUS_BADGE_VARIANT.preparing).toBe('amber')
    expect(STATUS_BADGE_VARIANT.completed).toBe('sage')
    expect(STATUS_BADGE_VARIANT.cancelled).toBe('secondary')
    expect(STATUS_BADGE_VARIANT.submitted).toBe('default')
  })
})

describe('ACTIVE_STATUSES', () => {
  test('contains the four in-flight states', () => {
    expect(ACTIVE_STATUSES.has('pending')).toBe(true)
    expect(ACTIVE_STATUSES.has('submitted')).toBe(true)
    expect(ACTIVE_STATUSES.has('confirmed')).toBe(true)
    expect(ACTIVE_STATUSES.has('preparing')).toBe(true)
    expect(ACTIVE_STATUSES.has('completed')).toBe(false)
    expect(ACTIVE_STATUSES.has('cancelled')).toBe(false)
  })
})

describe('TIMELINE_STAGES', () => {
  test('lists 4 stages in order', () => {
    expect(TIMELINE_STAGES).toEqual(['submitted', 'confirmed', 'preparing', 'completed'])
    expect(STAGE_LABEL.submitted).toBe('已下单')
    expect(STAGE_LABEL.completed).toBe('做好了')
  })
})

describe('statusToTimelineIndex', () => {
  test('pending and submitted both map to 0', () => {
    expect(statusToTimelineIndex('pending')).toBe(0)
    expect(statusToTimelineIndex('submitted')).toBe(0)
  })
  test('confirmed → 1, preparing → 2, completed → 3', () => {
    expect(statusToTimelineIndex('confirmed')).toBe(1)
    expect(statusToTimelineIndex('preparing')).toBe(2)
    expect(statusToTimelineIndex('completed')).toBe(3)
  })
  test('cancelled → -1', () => {
    expect(statusToTimelineIndex('cancelled')).toBe(-1)
  })
})

describe('nextActionFor', () => {
  test('returns 我来做 when submitted, not mine, no cook', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: false, hasCook: false, isCook: false }),
    ).toEqual({ label: '我来做', next: 'confirmed', variant: 'default' })
  })
  test('returns null when submitted but is mine (cannot accept own)', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: true, hasCook: false, isCook: false }),
    ).toBeNull()
  })
  test('returns null when submitted but cook already assigned', () => {
    expect(
      nextActionFor({ status: 'submitted', isMine: false, hasCook: true, isCook: false }),
    ).toBeNull()
  })
  test('returns 去做 when confirmed (any member can advance)', () => {
    expect(
      nextActionFor({ status: 'confirmed', isMine: true, hasCook: true, isCook: false }),
    ).toEqual({ label: '去做', next: 'preparing', variant: 'default' })
    expect(
      nextActionFor({ status: 'confirmed', isMine: false, hasCook: true, isCook: true }),
    ).toEqual({ label: '去做', next: 'preparing', variant: 'default' })
  })
  test('returns 做好啦 ✓ when preparing', () => {
    expect(
      nextActionFor({ status: 'preparing', isMine: false, hasCook: true, isCook: true }),
    ).toEqual({ label: '做好啦 ✓', next: 'completed', variant: 'default' })
  })
  test('returns null on completed and cancelled', () => {
    expect(
      nextActionFor({ status: 'completed', isMine: false, hasCook: true, isCook: false }),
    ).toBeNull()
    expect(
      nextActionFor({ status: 'cancelled', isMine: false, hasCook: false, isCook: false }),
    ).toBeNull()
  })
})

describe('canCancel', () => {
  test('allows cancel during pending/submitted and confirmed', () => {
    expect(canCancel('pending')).toBe(true)
    expect(canCancel('submitted')).toBe(true)
    expect(canCancel('confirmed')).toBe(true)
  })
  test('disallows cancel during preparing (already cooking)', () => {
    expect(canCancel('preparing')).toBe(false)
  })
  test('disallows cancel after completion or cancellation', () => {
    expect(canCancel('completed')).toBe(false)
    expect(canCancel('cancelled')).toBe(false)
  })
})
