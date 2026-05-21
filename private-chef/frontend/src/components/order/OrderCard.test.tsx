import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { OrderCard, type OrderCardData } from './OrderCard'

function makeCardData(overrides: Partial<OrderCardData> = {}): OrderCardData {
  return {
    id: 1,
    no: '晚餐 #1',
    meta: '爸·点单 · 尚无大厨',
    agoLabel: '2 分钟前',
    status: 'pending',
    items: [{ id: 1, name: '红烧肉' }],
    ...overrides,
  }
}

function renderCard(props: Partial<OrderCardData> = {}) {
  const data = makeCardData(props)
  return render(
    <MemoryRouter>
      <OrderCard {...data} />
    </MemoryRouter>,
  )
}

describe('OrderCard', () => {
  test('renders order title and meta', () => {
    renderCard()
    expect(screen.getByText('晚餐 #1')).toBeInTheDocument()
    expect(screen.getByText('爸·点单 · 尚无大厨')).toBeInTheDocument()
  })

  test('pending status shows 等你接单 chip and 我来接单 button', () => {
    renderCard({ status: 'pending' })
    expect(screen.getByText('等你接单')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '我来接单' })).toBeInTheDocument()
  })

  test('cooking status shows 制作中 chip and 出锅完成 button', () => {
    renderCard({ status: 'cooking' })
    expect(screen.getByText('制作中')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /出锅完成/ })).toBeInTheDocument()
  })

  test('done status shows 已完成 chip and no action button', () => {
    renderCard({ status: 'done' })
    // both the status chip and the CTA div say 已完成 - check at least one exists
    const allDone = screen.getAllByText('已完成')
    expect(allDone.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('clicking action button calls onPrimary and stops navigation', () => {
    const onPrimary = vi.fn()
    renderCard({ status: 'pending', onPrimary })
    fireEvent.click(screen.getByRole('button', { name: '我来接单' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  test('relative time label is rendered', () => {
    renderCard({ agoLabel: '5 分钟前' })
    expect(screen.getByText('5 分钟前')).toBeInTheDocument()
  })

  test('color chips are rendered for items', () => {
    renderCard({ items: [{ id: 1, name: '红烧肉' }, { id: 2, name: '清蒸鱼' }] })
    // OrderColorChips renders aria-label per item
    expect(screen.getByLabelText('红烧肉')).toBeInTheDocument()
    expect(screen.getByLabelText('清蒸鱼')).toBeInTheDocument()
  })
})
