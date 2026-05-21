import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { Toaster } from '@/components/ui/toaster'
import { RecipeSheet } from './RecipeSheet'

vi.mock('@/hooks/useRecipes', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useRecipes')>('@/hooks/useRecipes')
  return {
    ...actual,
    useCreateRecipe: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ id: 123 }),
      isPending: false,
    }),
    useTags: () => ({ data: [{ id: 1, name: '家常' }, { id: 2, name: '晚餐' }], isLoading: false }),
    useSaveRecipeImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})
vi.mock('@/lib/upload', () => ({
  uploadImage: vi.fn().mockResolvedValue({ url: 'https://x' }),
}))

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        {ui}
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('RecipeSheet', () => {
  test('renders sheet with title when open', () => {
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByText('新增菜品')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    renderWithProviders(<RecipeSheet open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByText('新增菜品')).not.toBeInTheDocument()
  })

  test('continuous mode shows 创建并继续 button', () => {
    renderWithProviders(<RecipeSheet open mode="continuous" onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建并继续/ })).toBeInTheDocument()
  })

  test('single mode shows 创建菜品 button', () => {
    renderWithProviders(<RecipeSheet open mode="single" onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建菜品/ })).toBeInTheDocument()
  })

  test('continuous mode shows 连续录入模式 chip', () => {
    renderWithProviders(<RecipeSheet open mode="continuous" onOpenChange={vi.fn()} />)
    expect(screen.getByText('连续录入模式')).toBeInTheDocument()
  })

  test('single mode does not show 连续录入模式 chip', () => {
    renderWithProviders(<RecipeSheet open mode="single" onOpenChange={vi.fn()} />)
    expect(screen.queryByText('连续录入模式')).not.toBeInTheDocument()
  })

  test('default mode (no prop) shows 创建菜品 button', () => {
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    // default mode is 'single'
    expect(screen.getByRole('button', { name: /创建菜品/ })).toBeInTheDocument()
  })
})
