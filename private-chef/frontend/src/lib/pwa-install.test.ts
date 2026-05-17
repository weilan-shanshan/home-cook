import { afterEach, describe, expect, test, vi } from 'vitest'

const UA_DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const UA_IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const UA_ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const UA_WECHAT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42'
const UA_DINGTALK =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DingTalk/7.0'
const UA_FEISHU =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Lark/7.0'
const UA_DESKTOP_FIREFOX =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
const UA_IPAD_OS_13 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

function setUA(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

async function loadModule() {
  vi.resetModules()
  return await import('./pwa-install')
}

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: 0,
    configurable: true,
  })
})

describe('pwa-install browserKind detection', () => {
  test('detects desktop Chromium', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('desktopChromium')
    expect(pwaInstall.isInAppBrowser).toBe(false)
  })

  test('detects iOS Safari', async () => {
    setUA(UA_IOS_SAFARI)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('iosSafari')
    expect(pwaInstall.isIOS).toBe(true)
  })

  test('detects Android Chromium', async () => {
    setUA(UA_ANDROID_CHROME)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('androidChromium')
  })

  test('detects WeChat in-app webview', async () => {
    setUA(UA_WECHAT)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('wechat')
    expect(pwaInstall.isInAppBrowser).toBe(true)
  })

  test('detects DingTalk in-app webview', async () => {
    setUA(UA_DINGTALK)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('dingtalk')
    expect(pwaInstall.isInAppBrowser).toBe(true)
  })

  test('detects Feishu/Lark in-app webview', async () => {
    setUA(UA_FEISHU)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('feishu')
    expect(pwaInstall.isInAppBrowser).toBe(true)
  })

  test('detects desktop Firefox', async () => {
    setUA(UA_DESKTOP_FIREFOX)
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.browserKind).toBe('desktopFirefox')
  })

  test('detects iPadOS 13+ (Macintosh UA + touch points) as iOS', async () => {
    setUA(UA_IPAD_OS_13)
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    })
    const { pwaInstall } = await loadModule()
    expect(pwaInstall.isIOS).toBe(true)
    expect(pwaInstall.browserKind).toBe('iosSafari')
  })
})

describe('pwa-install.tryInstall branches', () => {
  test('returns OPEN_IN_BROWSER when in-app webview', async () => {
    setUA(UA_WECHAT)
    const { pwaInstall } = await loadModule()
    await expect(pwaInstall.tryInstall()).resolves.toBe('OPEN_IN_BROWSER')
  })

  test('returns IOS_SHOW_GUIDE on iOS without deferred prompt', async () => {
    setUA(UA_IOS_SAFARI)
    const { pwaInstall } = await loadModule()
    await expect(pwaInstall.tryInstall()).resolves.toBe('IOS_SHOW_GUIDE')
  })

  test('returns NO_PROMPT on desktop Chrome without deferred prompt', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    await expect(pwaInstall.tryInstall()).resolves.toBe('NO_PROMPT')
  })

  test('uses deferred prompt when available and returns ACCEPTED', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    const fakePrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakePrompt))
    expect(pwaInstall.hasNativePrompt()).toBe(true)
    await expect(pwaInstall.tryInstall()).resolves.toBe('ACCEPTED')
    expect(pwaInstall.hasNativePrompt()).toBe(false)
    expect(fakePrompt.prompt).toHaveBeenCalled()
  })

  test('uses deferred prompt and returns DISMISSED when user cancels', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    const fakePrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakePrompt))
    await expect(pwaInstall.tryInstall()).resolves.toBe('DISMISSED')
  })
})

describe('pwa-install.onReady / onInstalled', () => {
  test('onReady fires when beforeinstallprompt arrives', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    const cb = vi.fn()
    pwaInstall.onReady(cb)
    expect(cb).not.toHaveBeenCalled()
    const fakePrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakePrompt))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('onInstalled fires when appinstalled arrives', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    const cb = vi.fn()
    pwaInstall.onInstalled(cb)
    window.dispatchEvent(new Event('appinstalled'))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('onInstalled returns unsubscribe that prevents future fires', async () => {
    setUA(UA_DESKTOP_CHROME)
    const { pwaInstall } = await loadModule()
    const cb = vi.fn()
    const unsubscribe = pwaInstall.onInstalled(cb)
    unsubscribe()
    window.dispatchEvent(new Event('appinstalled'))
    expect(cb).not.toHaveBeenCalled()
  })
})
