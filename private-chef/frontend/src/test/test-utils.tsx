import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { render } from '@testing-library/react'
import { Toaster } from '@/components/ui/toaster'

export function renderWithProviders(
  ui: ReactNode,
  options?: { route?: string; path?: string },
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <MemoryRouter initialEntries={[options?.route ?? '/']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path={options?.path ?? '*'} element={ui} />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}
