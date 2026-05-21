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

async function loadBanner() {
  vi.resetModules()
  const mod = await import('./PWAInstallBanner')
  return mod.PWAInstallBanner
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  setStandalone(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PWAInstallBanner', () => {
  test('renders nothing when already standalone', async () => {
    setUA(UA_DESKTOP_CHROME)
    setStandalone(true)
    const Banner = await loadBanner()
    const { container } = render(<Banner />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing in WeChat in-app webview', async () => {
    setUA(UA_WECHAT)
    const Banner = await loadBanner()
    const { container } = render(<Banner />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when banner dismissed flag is set', async () => {
    setUA(UA_DESKTOP_CHROME)
    localStorage.setItem('cook.pwa.banner.dismissed', '1')
    const Banner = await loadBanner()
    const { container } = render(<Banner />)
    expect(container.firstChild).toBeNull()
  })

  test('renders install banner on desktop Chrome', async () => {
    setUA(UA_DESKTOP_CHROME)
    const Banner = await loadBanner()
    render(<Banner />)
    expect(await screen.findByText(/装到桌面，秒开私厨/)).toBeInTheDocument()
    expect(screen.getByText('立即安装')).toBeInTheDocument()
  })

  test('renders install banner on iOS Safari', async () => {
    setUA(UA_IOS_SAFARI)
    const Banner = await loadBanner()
    render(<Banner />)
    expect(await screen.findByText(/装到桌面，秒开私厨/)).toBeInTheDocument()
    expect(screen.getByText('立即安装')).toBeInTheDocument()
  })
})
