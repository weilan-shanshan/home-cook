import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { RecipeImageGrid, type ImageItem } from './RecipeImageGrid'

function makeItem(overrides: Partial<ImageItem>): ImageItem {
  return {
    localId: 'l1',
    url: 'https://example.com/a.png',
    status: 'picked',
    ...overrides,
  }
}

describe('RecipeImageGrid', () => {
  test('clicking × on picked image calls onRemoveLocal directly (no confirm)', () => {
    const onRemoveLocal = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', status: 'picked' })]}
        onPick={vi.fn()}
        onRemoveLocal={onRemoveLocal}
        onRemoveUploaded={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    expect(onRemoveLocal).toHaveBeenCalledWith('a')
  })

  test('clicking × on uploaded image opens confirm dialog; confirming calls onRemoveUploaded', async () => {
    const onRemoveUploaded = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', serverId: 42, status: 'uploaded' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={onRemoveUploaded}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    expect(await screen.findByText('删除这张图？')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(onRemoveUploaded).toHaveBeenCalledWith(42)
  })

  test('clicking × on uploaded image and canceling does NOT call onRemoveUploaded', async () => {
    const onRemoveUploaded = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'a', serverId: 42, status: 'uploaded' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={onRemoveUploaded}
        onRetry={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /移除图片 a/ }))
    fireEvent.click(await screen.findByRole('button', { name: '取消' }))
    expect(onRemoveUploaded).not.toHaveBeenCalled()
  })

  test('error item shows retry icon; clicking it calls onRetry with localId', () => {
    const onRetry = vi.fn()
    render(
      <RecipeImageGrid
        items={[makeItem({ localId: 'b', status: 'error', errorMessage: '网络中断' })]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={vi.fn()}
        onRetry={onRetry}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /重试图片 b/ }))
    expect(onRetry).toHaveBeenCalledWith('b')
  })

  test('renders an add tile that triggers file picker', () => {
    render(
      <RecipeImageGrid
        items={[]}
        onPick={vi.fn()}
        onRemoveLocal={vi.fn()}
        onRemoveUploaded={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /添加图片/ })).toBeInTheDocument()
  })
})
