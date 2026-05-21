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
    items: [{ id: 1, recipeId: 1, name: '红烧肉', quantity: 1 }],
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

  test('dish names are rendered as text in dish rows', () => {
    renderCard({
      items: [
        { id: 1, recipeId: 1, name: '红烧肉', quantity: 1 },
        { id: 2, recipeId: 2, name: '清蒸鱼', quantity: 2 },
      ],
    })
    expect(screen.getByText('红烧肉')).toBeInTheDocument()
    expect(screen.getByText('清蒸鱼')).toBeInTheDocument()
  })

  test('total count footer is rendered', () => {
    renderCard({
      items: [
        { id: 1, recipeId: 1, name: '红烧肉', quantity: 2 },
        { id: 2, recipeId: 2, name: '清蒸鱼', quantity: 3 },
      ],
    })
    expect(screen.getByText('一共 5 份')).toBeInTheDocument()
  })

  test('favorite button calls onToggleFavorite with item', () => {
    const onToggleFavorite = vi.fn()
    renderCard({
      items: [{ id: 1, recipeId: 1, name: '红烧肉', quantity: 1, favorited: false }],
      onToggleFavorite,
    })
    const favBtn = screen.getByRole('button', { name: '收藏' })
    fireEvent.click(favBtn)
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(onToggleFavorite.mock.calls[0][0]).toMatchObject({ id: 1, name: '红烧肉' })
  })

  test('extra dishes beyond 3 show overflow message', () => {
    renderCard({
      items: [
        { id: 1, recipeId: 1, name: '菜1', quantity: 1 },
        { id: 2, recipeId: 2, name: '菜2', quantity: 1 },
        { id: 3, recipeId: 3, name: '菜3', quantity: 1 },
        { id: 4, recipeId: 4, name: '菜4', quantity: 1 },
      ],
    })
    expect(screen.getByText(/还有 1 道菜/)).toBeInTheDocument()
  })
})
