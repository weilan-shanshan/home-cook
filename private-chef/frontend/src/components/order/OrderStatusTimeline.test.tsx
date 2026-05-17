import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { OrderStatusTimeline } from './OrderStatusTimeline'

describe('OrderStatusTimeline', () => {
  test('renders 4 stages with submitted at index 0 active', () => {
    const { container } = render(<OrderStatusTimeline status="submitted" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars).toHaveLength(4)
    expect(bars[0].className).toContain('bg-brand')
    expect(bars[1].className).toContain('bg-cream-300')
  })

  test('preparing lights first 3 bars', () => {
    const { container } = render(<OrderStatusTimeline status="preparing" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars[0].className).toContain('bg-brand')
    expect(bars[1].className).toContain('bg-brand')
    expect(bars[2].className).toContain('bg-brand')
    expect(bars[3].className).toContain('bg-cream-300')
  })

  test('completed lights all bars', () => {
    const { container } = render(<OrderStatusTimeline status="completed" />)
    const bars = container.querySelectorAll('.h-1\\.5')
    expect(bars).toHaveLength(4)
    bars.forEach((bar) => {
      expect(bar.className).toContain('bg-brand')
    })
  })

  test('cancelled renders a single rose-tinted block', () => {
    render(<OrderStatusTimeline status="cancelled" />)
    expect(screen.getByText('订单已取消')).toBeInTheDocument()
  })

  test('shows stage labels under bars', () => {
    render(<OrderStatusTimeline status="confirmed" />)
    expect(screen.getByText('已下单')).toBeInTheDocument()
    expect(screen.getByText('已接单')).toBeInTheDocument()
    expect(screen.getByText('制作中')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })
})
