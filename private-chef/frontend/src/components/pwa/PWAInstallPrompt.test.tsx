import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const UA_DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const UA_IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const UA_WECHAT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42'

function setUA(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

function setStandalone(value: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: value && query.includes('standalone'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

async function loadPrompt() {
  vi.resetModules()
  const mod = await import('./PWAInstallPrompt')
  return mod.PWAInstallPrompt
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  setStandalone(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PWAInstallPrompt', () => {
  test('renders nothing when already standalone', async () => {
    setUA(UA_DESKTOP_CHROME)
    setStandalone(true)
    const Prompt = await loadPrompt()
    const { container } = render(<Prompt />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing in WeChat in-app webview', async () => {
    setUA(UA_WECHAT)
    const Prompt = await loadPrompt()
    const { container } = render(<Prompt />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when permanent dismiss flag is set', async () => {
    setUA(UA_DESKTOP_CHROME)
    localStorage.setItem('cook.pwa.dismissed.permanent', '1')
    const Prompt = await loadPrompt()
    const { container } = render(<Prompt />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when session dismiss flag is set', async () => {
    setUA(UA_DESKTOP_CHROME)
    sessionStorage.setItem('cook.pwa.dismissed.session', '1')
    const Prompt = await loadPrompt()
    const { container } = render(<Prompt />)
    expect(container.firstChild).toBeNull()
  })

  test('renders install dialog on desktop Chrome', async () => {
    setUA(UA_DESKTOP_CHROME)
    const Prompt = await loadPrompt()
    render(<Prompt />)
    expect(await screen.findByText(/装到桌面/)).toBeInTheDocument()
  })

  test('renders iOS step guide on iOS Safari', async () => {
    setUA(UA_IOS_SAFARI)
    const Prompt = await loadPrompt()
    render(<Prompt />)
    expect(await screen.findByText(/iPhone 用户看这里/)).toBeInTheDocument()
    expect(screen.getByText(/点底部「分享」按钮/)).toBeInTheDocument()
  })
})
