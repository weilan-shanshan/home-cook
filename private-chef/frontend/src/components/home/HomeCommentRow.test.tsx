import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router'
import { HomeCommentRow } from './HomeCommentRow'

const sampleComment = {
  id: 1,
  orderId: 42,
  userId: 7,
  displayName: '爸',
  roleType: 'diner' as const,
  contentPreview: '今天这顿红烧肉真不错',
  createdAt: '2026-05-17 12:00:00',
}

describe('HomeCommentRow', () => {
  test('renders displayName, role chip, and content', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={sampleComment} />
      </MemoryRouter>,
    )
    expect(screen.getByText('爸')).toBeInTheDocument()
    expect(screen.getByText(/想吃的人/)).toBeInTheDocument()
    expect(screen.getByText('今天这顿红烧肉真不错')).toBeInTheDocument()
  })

  test('renders cook role chip when roleType is cook', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={{ ...sampleComment, roleType: 'cook' }} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/掌勺/)).toBeInTheDocument()
  })

  test('wraps in a Link to the related order detail page', () => {
    render(
      <MemoryRouter>
        <HomeCommentRow comment={sampleComment} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/orders/42')
  })
})
