import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa'

// Take over scroll restoration ourselves (see useScrollRestoration).
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// PWA：注册 service worker。开发模式默认不注册（vite-plugin-pwa 行为）。
registerServiceWorker()
