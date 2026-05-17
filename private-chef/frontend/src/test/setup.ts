import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// Treat aria-hidden elements the same as script/style: excluded from getByText queries
configure({ defaultIgnore: 'script, style, [aria-hidden="true"]' })

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver
