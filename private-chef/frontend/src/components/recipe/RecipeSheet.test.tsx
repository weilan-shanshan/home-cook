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
  test('renders sheet when open', () => {
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByText('新增菜品')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    renderWithProviders(<RecipeSheet open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByText('新增菜品')).not.toBeInTheDocument()
  })

  test('default primary button is 创建并继续', () => {
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建并继续/ })).toBeInTheDocument()
  })

  test('uses persisted lastSubmitMode on open', () => {
    localStorage.setItem('cook.recipe.lastSubmitMode', 'close')
    renderWithProviders(<RecipeSheet open onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /创建并关闭/ })).toBeInTheDocument()
  })
})
