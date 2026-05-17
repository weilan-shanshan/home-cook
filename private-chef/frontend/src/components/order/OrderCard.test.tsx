import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { OrderCard, type OrderCardData } from './OrderCard'

function makeOrder(overrides: Partial<OrderCardData>): OrderCardData {
  return {
    id: 1,
    status: 'submitted',
    mealType: 'lunch',
    mealDate: '2026-05-17',
    createdAt: '2026-05-17 12:00:00',
    isMine: false,
    hasCook: false,
    cookUserId: null,
    cookDisplayName: null,
    requesterDisplayName: '爸',
    items: [
      { recipeId: 1, recipeTitle: '红烧肉', image: null },
    ],
    ...overrides,
  }
}

function renderCard(props: Partial<React.ComponentProps<typeof OrderCard>> = {}) {
  return render(
    <MemoryRouter>
      <OrderCard
        order={makeOrder({})}
        currentUserId={2}
        mode="default"
        onAction={vi.fn()}
        isPending={false}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('OrderCard', () => {
  test('default mode renders item thumbnails', () => {
    renderCard({
      order: makeOrder({
        items: [
          { recipeId: 1, recipeTitle: '红烧肉', image: null },
          { recipeId: 2, recipeTitle: '清蒸鱼', image: null },
        ],
      }),
    })
    expect(screen.getByText(/午餐/)).toBeInTheDocument()
  })

  test('compact mode omits item thumbnails', () => {
    const { container } = renderCard({
      mode: 'compact',
      order: makeOrder({
        items: [{ recipeId: 1, recipeTitle: '红烧肉', image: null }],
      }),
    })
    expect(container.querySelector('[data-test="order-thumbnails"]')).toBeNull()
  })

  test('active status applies brand-200 border', () => {
    const { container } = renderCard({ order: makeOrder({ status: 'preparing' }) })
    expect(container.firstChild).toHaveClass('border-brand-200')
  })

  test('completed status applies muted styling', () => {
    const { container } = renderCard({ order: makeOrder({ status: 'completed' }) })
    expect((container.firstChild as HTMLElement).className).toContain('opacity-90')
  })

  test('clicking action button calls onAction with next status', () => {
    const onAction = vi.fn()
    renderCard({
      order: makeOrder({ status: 'confirmed', hasCook: true, cookDisplayName: '妈' }),
      onAction,
    })
    fireEvent.click(screen.getByRole('button', { name: /去制作/ }))
    expect(onAction).toHaveBeenCalledWith(1, 'preparing')
  })

  test('no action button when status is completed', () => {
    renderCard({ order: makeOrder({ status: 'completed' }) })
    expect(screen.queryByRole('button')).toBeNull()
  })
})
