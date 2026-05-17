# PWA Install UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the PWA install gap in `private-chef/frontend` by adding a platform-aware install layer (singleton + React bridge + global prompt + Profile entry card + iOS guide) and fixing the maskable icon, modeled on the working Nestworth implementation.

**Architecture:** Framework-agnostic singleton owns UA detection and `beforeinstallprompt` capture; a React hook bridges it to components; three UI components handle global first-visit prompt, Profile-page entry card, and iOS step-by-step guide. A build script generates a padded maskable icon to fix the manifest icon violation.

**Tech Stack:** React 18.3 + react-router v7 + Vite 5 + vite-plugin-pwa 0.17 + shadcn/ui (Dialog, Card, Button, useToast) + Tailwind + vitest + @testing-library/react + sharp (new devDep).

**Spec:** [docs/superpowers/specs/2026-05-17-pwa-install-ux-design.md](../specs/2026-05-17-pwa-install-ux-design.md)

**Working directory for all paths:** `/Users/weilan/ali/ai/cook/private-chef/frontend` unless prefixed otherwise. Git operations run from `/Users/weilan/ali/ai/cook`.

---

## File Map

**New files:**
- `private-chef/frontend/src/lib/pwa-install.ts` — platform singleton
- `private-chef/frontend/src/lib/pwa-install.test.ts` — unit tests
- `private-chef/frontend/src/hooks/use-pwa-install.ts` — React bridge
- `private-chef/frontend/src/components/pwa/IOSInstallGuide.tsx` — step illustration
- `private-chef/frontend/src/components/pwa/InstallEntryCard.tsx` — Profile card
- `private-chef/frontend/src/components/pwa/PWAInstallPrompt.tsx` — global dialog
- `private-chef/frontend/src/components/pwa/PWAInstallPrompt.test.tsx` — render tests
- `private-chef/frontend/scripts/build-maskable-icon.mjs` — icon generator
- `private-chef/frontend/public/icons/icon-512-maskable.png` — script output (gitignored generation but checked in to avoid CI sharp dep failures)

**Modified files:**
- `private-chef/frontend/vite.config.ts` — maskable icon path + `includeAssets`
- `private-chef/frontend/package.json` — add `sharp` devDep + `icons:build` + `prebuild` script
- `private-chef/frontend/src/App.tsx` — mount `<PWAInstallPrompt />`
- `private-chef/frontend/src/pages/profile/Profile.tsx` — insert `<InstallEntryCard />` near top

---

## Task 1: Platform singleton `pwa-install.ts`

**Files:**
- Create: `private-chef/frontend/src/lib/pwa-install.ts`
- Test: `private-chef/frontend/src/lib/pwa-install.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `private-chef/frontend/src/lib/pwa-install.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/lib/pwa-install.test.ts
```

Expected: FAIL — `Cannot find module './pwa-install'` or similar.

- [ ] **Step 3: Implement `pwa-install.ts`**

Create `private-chef/frontend/src/lib/pwa-install.ts`:

```ts
/**
 * Framework-agnostic PWA install singleton.
 * Captures `beforeinstallprompt`, detects browser kind, and exposes a
 * `tryInstall` decision API for UI components to consume.
 */

export type InstallResult =
  | 'ACCEPTED'
  | 'DISMISSED'
  | 'IOS_SHOW_GUIDE'
  | 'OPEN_IN_BROWSER'
  | 'NO_PROMPT'

export type BrowserKind =
  | 'iosSafari'
  | 'androidChromium'
  | 'desktopChromium'
  | 'desktopSafari'
  | 'desktopFirefox'
  | 'wechat'
  | 'qq'
  | 'workWechat'
  | 'dingtalk'
  | 'feishu'
  | 'xiaohongshu'
  | 'douyin'
  | 'webview'
  | 'unknown'

export interface PwaInstallApi {
  isStandalone: boolean
  isIOS: boolean
  isAndroid: boolean
  isDesktopChromium: boolean
  isWeChat: boolean
  isInAppBrowser: boolean
  browserKind: BrowserKind
  hasNativePrompt: () => boolean
  onReady: (cb: () => void) => void
  onInstalled: (cb: () => void) => void
  tryInstall: () => Promise<InstallResult>
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
const readyCallbacks: Array<() => void> = []
const installedCallbacks: Array<() => void> = []

const hasWindow = typeof window !== 'undefined'
const ua = hasWindow ? window.navigator.userAgent : ''

const isIOS =
  /iPhone|iPad|iPod/.test(ua) &&
  !(hasWindow && (window as unknown as { MSStream?: unknown }).MSStream)
const isAndroid = /Android/.test(ua)
const isMobile = /Mobile/.test(ua) || isIOS || isAndroid

const isWeChat = /MicroMessenger\b/i.test(ua)
const isWorkWechat = /wxwork/i.test(ua)
const isQQEmbed = /\bQQ\/[\d.]+/i.test(ua) && !/MQQBrowser/i.test(ua)
const isDingTalk = /DingTalk/i.test(ua)
const isFeishu = /Lark|Feishu/i.test(ua)
const isXiaohongshu = /xhs/i.test(ua) || /XHS/.test(ua)
const isDouyin = /Aweme/i.test(ua)
const isInAppBrowser =
  isWeChat ||
  isWorkWechat ||
  isQQEmbed ||
  isDingTalk ||
  isFeishu ||
  isXiaohongshu ||
  isDouyin ||
  /; wv\)|FBAN|FBAV|Instagram|Line\//i.test(ua)

const isDesktopChromium =
  !isMobile &&
  !isInAppBrowser &&
  /Chrome|Chromium|Edg/.test(ua) &&
  !/Edge\/[0-9]/.test(ua)

const isDesktopSafari =
  !isMobile && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)

const isDesktopFirefox = /Firefox/.test(ua) && !isMobile

let browserKind: BrowserKind = 'unknown'
if (isWeChat) browserKind = 'wechat'
else if (isWorkWechat) browserKind = 'workWechat'
else if (isQQEmbed) browserKind = 'qq'
else if (isDingTalk) browserKind = 'dingtalk'
else if (isFeishu) browserKind = 'feishu'
else if (isXiaohongshu) browserKind = 'xiaohongshu'
else if (isDouyin) browserKind = 'douyin'
else if (isInAppBrowser) browserKind = 'webview'
else if (isIOS) browserKind = 'iosSafari'
else if (isAndroid && /Chrome|Chromium/.test(ua)) browserKind = 'androidChromium'
else if (isDesktopChromium) browserKind = 'desktopChromium'
else if (isDesktopSafari) browserKind = 'desktopSafari'
else if (isDesktopFirefox) browserKind = 'desktopFirefox'

const isStandalone =
  hasWindow &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true)

if (hasWindow) {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    readyCallbacks.splice(0).forEach(cb => cb())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installedCallbacks.slice().forEach(cb => cb())
  })
}

export const pwaInstall: PwaInstallApi = {
  isStandalone,
  isIOS,
  isAndroid,
  isDesktopChromium,
  isWeChat,
  isInAppBrowser,
  browserKind,

  hasNativePrompt: () => !!deferred,

  onReady(cb) {
    if (deferred) cb()
    else readyCallbacks.push(cb)
  },

  onInstalled(cb) {
    installedCallbacks.push(cb)
  },

  async tryInstall() {
    if (isInAppBrowser) return 'OPEN_IN_BROWSER'
    if (deferred) {
      try {
        await deferred.prompt()
        const choice = await deferred.userChoice
        const accepted = choice.outcome === 'accepted'
        deferred = null
        return accepted ? 'ACCEPTED' : 'DISMISSED'
      } catch {
        deferred = null
        return 'NO_PROMPT'
      }
    }
    if (isIOS) return 'IOS_SHOW_GUIDE'
    return 'NO_PROMPT'
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/lib/pwa-install.test.ts
```

Expected: PASS (all 11 cases green).

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/lib/pwa-install.ts private-chef/frontend/src/lib/pwa-install.test.ts
git commit -m "feat(pwa): add platform-aware install singleton"
```

---

## Task 2: React bridge hook `use-pwa-install.ts`

**Files:**
- Create: `private-chef/frontend/src/hooks/use-pwa-install.ts`

No tests for this task — it's a thin pass-through covered transitively by the PWAInstallPrompt tests in Task 4.

- [ ] **Step 1: Write the hook**

Create `private-chef/frontend/src/hooks/use-pwa-install.ts`:

```ts
import { useEffect, useState } from 'react'
import { pwaInstall } from '@/lib/pwa-install'

export function usePwaInstall() {
  const [promptReady, setPromptReady] = useState(pwaInstall.hasNativePrompt())
  const [installed, setInstalled] = useState(pwaInstall.isStandalone)

  useEffect(() => {
    pwaInstall.onReady(() => setPromptReady(true))
    pwaInstall.onInstalled(() => setInstalled(true))
  }, [])

  return {
    promptReady,
    installed,
    isIOS: pwaInstall.isIOS,
    isInAppBrowser: pwaInstall.isInAppBrowser,
    browserKind: pwaInstall.browserKind,
    tryInstall: pwaInstall.tryInstall,
  }
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
```

Expected: clean exit (no errors).

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/hooks/use-pwa-install.ts
git commit -m "feat(pwa): add usePwaInstall React bridge hook"
```

---

## Task 3: iOS step illustration `IOSInstallGuide.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/pwa/IOSInstallGuide.tsx`

Pure static SVG, no tests.

- [ ] **Step 1: Write the component**

Create `private-chef/frontend/src/components/pwa/IOSInstallGuide.tsx`:

```tsx
export function IOSInstallGuide() {
  return (
    <div className="flex flex-col gap-4 py-2">
      <Step
        index={1}
        title="点底部「分享」按钮"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />
      <Step
        index={2}
        title="向下滚动找到「添加到主屏幕」"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="11" width="18" height="4" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
        }
      />
      <Step
        index={3}
        title="右上角点「添加」"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8M12 8v8" strokeLinecap="round" />
          </svg>
        }
      />
      <p className="text-xs text-muted-foreground pt-1">
        装好后就能从桌面图标一键打开，不再走浏览器。
      </p>
    </div>
  )
}

function Step({ index, title, icon }: { index: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {index}
      </div>
      <div className="flex flex-1 items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="text-primary/80">{icon}</div>
        <span className="text-sm">{title}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
```

Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/pwa/IOSInstallGuide.tsx
git commit -m "feat(pwa): add iOS Safari install step guide component"
```

---

## Task 4: Global first-visit prompt `PWAInstallPrompt.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/pwa/PWAInstallPrompt.tsx`
- Test: `private-chef/frontend/src/components/pwa/PWAInstallPrompt.test.tsx`
- Modify: `private-chef/frontend/src/App.tsx`

Storage keys:
- `localStorage['cook.pwa.dismissed.permanent']` — permanent off
- `sessionStorage['cook.pwa.dismissed.session']` — session-only off

- [ ] **Step 1: Write the failing tests**

Create `private-chef/frontend/src/components/pwa/PWAInstallPrompt.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/pwa/PWAInstallPrompt.test.tsx
```

Expected: FAIL — `Cannot find module './PWAInstallPrompt'`.

- [ ] **Step 3: Implement the component**

Create `private-chef/frontend/src/components/pwa/PWAInstallPrompt.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { IOSInstallGuide } from './IOSInstallGuide'

const PERMANENT_KEY = 'cook.pwa.dismissed.permanent'
const SESSION_KEY = 'cook.pwa.dismissed.session'

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    /* private mode: silently degrade */
  }
}

export function PWAInstallPrompt() {
  const { installed, isIOS, isInAppBrowser, browserKind, tryInstall } = usePwaInstall()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (installed) return
    if (isInAppBrowser) return
    if (safeGetItem(localStorage, PERMANENT_KEY)) return
    if (safeGetItem(sessionStorage, SESSION_KEY)) return
    setOpen(true)
  }, [installed, isInAppBrowser])

  useEffect(() => {
    if (installed) {
      safeSetItem(localStorage, PERMANENT_KEY, '1')
      setOpen(false)
      toast({ description: '装好啦，下次直接从桌面打开 🎉' })
    }
  }, [installed, toast])

  const handleInstall = useCallback(async () => {
    const result = await tryInstall()
    if (result === 'ACCEPTED') {
      safeSetItem(localStorage, PERMANENT_KEY, '1')
      setOpen(false)
    } else if (result === 'DISMISSED') {
      safeSetItem(sessionStorage, SESSION_KEY, '1')
      setOpen(false)
    } else if (result === 'IOS_SHOW_GUIDE') {
      // Already showing IOSInstallGuide inline; nothing extra to do.
    } else if (result === 'NO_PROMPT') {
      toast({ description: '当前浏览器不支持自动安装，推荐用 Chrome/Edge 打开' })
    }
  }, [tryInstall, toast])

  const handleLater = useCallback(() => {
    safeSetItem(sessionStorage, SESSION_KEY, '1')
    setOpen(false)
  }, [])

  const handlePermanentDismiss = useCallback(() => {
    safeSetItem(localStorage, PERMANENT_KEY, '1')
    setOpen(false)
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      toast({ description: '已复制链接' })
    } catch {
      toast({ description: '复制失败，请手动复制地址栏', variant: 'destructive' })
    }
  }, [toast])

  if (installed) return null
  if (isInAppBrowser) return null
  if (safeGetItem(localStorage, PERMANENT_KEY)) return null
  if (safeGetItem(sessionStorage, SESSION_KEY)) return null
  if (!open) return null

  const isChromium = browserKind === 'desktopChromium' || browserKind === 'androidChromium'

  return (
    <Dialog open={open} onOpenChange={next => !next && handleLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isIOS ? 'iPhone 用户看这里' : '装到桌面，秒开私厨'}
          </DialogTitle>
          <DialogDescription>
            {isIOS
              ? '把私厨加到主屏幕，下次像 App 一样直接点开。'
              : '装到桌面后能离线打开、启动更快，不占空间。'}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <IOSInstallGuide />
        ) : isChromium ? null : (
          <p className="text-sm text-muted-foreground">
            推荐用 Chrome 或 Edge 浏览器打开本网站，即可直接安装到桌面。
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isChromium && (
            <Button onClick={handleInstall} className="w-full sm:w-auto">
              立即安装
            </Button>
          )}
          {!isChromium && !isIOS && (
            <Button onClick={copyLink} variant="outline" className="w-full sm:w-auto">
              复制链接
            </Button>
          )}
          <Button onClick={handleLater} variant="ghost" className="w-full sm:w-auto">
            稍后再说
          </Button>
          <Button
            onClick={handlePermanentDismiss}
            variant="ghost"
            className="w-full sm:w-auto text-muted-foreground"
          >
            不再提示
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run src/components/pwa/PWAInstallPrompt.test.tsx
```

Expected: PASS (all 6 cases green).

- [ ] **Step 5: Mount in App.tsx**

Read `private-chef/frontend/src/App.tsx`, then add the import and JSX. The change pattern:

Find:

```tsx
import { Toaster } from '@/components/ui/toaster'
```

Add immediately after:

```tsx
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
```

Find:

```tsx
      </Routes>
      <Toaster />
    </BrowserRouter>
```

Replace with:

```tsx
      </Routes>
      <Toaster />
      <PWAInstallPrompt />
    </BrowserRouter>
```

- [ ] **Step 6: Type check and re-run all tests**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean type check + all tests pass (existing + 17 new).

- [ ] **Step 7: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/pwa/PWAInstallPrompt.tsx \
        private-chef/frontend/src/components/pwa/PWAInstallPrompt.test.tsx \
        private-chef/frontend/src/App.tsx
git commit -m "feat(pwa): add global first-visit install prompt"
```

---

## Task 5: Profile install entry card `InstallEntryCard.tsx`

**Files:**
- Create: `private-chef/frontend/src/components/pwa/InstallEntryCard.tsx`
- Modify: `private-chef/frontend/src/pages/profile/Profile.tsx`

No standalone tests — render logic is a subset of PWAInstallPrompt's already-tested branches, and Profile.tsx itself has no existing test coverage to extend.

- [ ] **Step 1: Write the card component**

Create `private-chef/frontend/src/components/pwa/InstallEntryCard.tsx`:

```tsx
import { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Smartphone } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { IOSInstallGuide } from './IOSInstallGuide'

export function InstallEntryCard() {
  const { installed, promptReady, isIOS, isInAppBrowser, browserKind, tryInstall } = usePwaInstall()
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const { toast } = useToast()

  const handleClick = useCallback(async () => {
    if (isIOS) {
      setIosGuideOpen(true)
      return
    }
    const result = await tryInstall()
    if (result === 'ACCEPTED') {
      toast({ description: '已开始安装' })
    } else if (result === 'NO_PROMPT') {
      toast({ description: '当前浏览器不支持自动安装，推荐用 Chrome/Edge 打开' })
    }
  }, [isIOS, tryInstall, toast])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      toast({ description: '已复制链接' })
    } catch {
      toast({ description: '复制失败，请手动复制', variant: 'destructive' })
    }
  }, [toast])

  if (installed) return null

  const isChromium = browserKind === 'desktopChromium' || browserKind === 'androidChromium'

  let description = '装到桌面后能离线打开、启动更快'
  let buttonLabel = '立即安装'
  let buttonDisabled = false
  let onButtonClick: () => void = handleClick

  if (isInAppBrowser) {
    description = '当前浏览器装不了 PWA，请点右上角 ··· → 在浏览器打开'
    buttonLabel = '请在浏览器打开'
    buttonDisabled = true
    onButtonClick = () => undefined
  } else if (isIOS) {
    buttonLabel = '教我装'
  } else if (isChromium) {
    if (!promptReady) {
      description = '请先在应用里点几下，然后再回到这里安装'
      buttonLabel = '稍等再试'
      buttonDisabled = true
    }
  } else {
    description = '推荐用 Chrome 或 Edge 打开以装到桌面'
    buttonLabel = '复制链接'
    onButtonClick = copyLink
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {isIOS ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-base">装到桌面，秒开私厨</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onButtonClick}
            disabled={buttonDisabled}
            className="w-full sm:w-auto"
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>iPhone 安装指南</DialogTitle>
            <DialogDescription>三步把私厨加到主屏幕</DialogDescription>
          </DialogHeader>
          <IOSInstallGuide />
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Type check**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit
```

Expected: clean exit.

- [ ] **Step 3: Insert into Profile.tsx**

Read `private-chef/frontend/src/pages/profile/Profile.tsx` to find the main rendering area (after the loading/error returns, where the user info card or similar starts).

Add this import to the top of the file (group with other component imports):

```tsx
import { InstallEntryCard } from '@/components/pwa/InstallEntryCard'
```

In the JSX, place `<InstallEntryCard />` as the **first** child inside the outer page container — directly after the opening container `<div>` (or `<main>`/`<section>`) that wraps the user info card. The card auto-hides when standalone, so unconditional placement is safe.

Concretely: locate the JSX block that returns the page (not the loading state). It will look approximately like:

```tsx
return (
  <div className="...">
    <Card>...user info...</Card>
    ...
  </div>
)
```

Change to:

```tsx
return (
  <div className="...">
    <InstallEntryCard />
    <Card>...user info...</Card>
    ...
  </div>
)
```

If Profile uses a flex/grid layout with spacing utilities (`space-y-*` / `gap-*`), the card inherits spacing automatically. If not, wrap the card in a `<div className="mb-4">` to keep visual rhythm consistent with the rest of the page.

- [ ] **Step 4: Run all tests and type check**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx tsc -b --noEmit && npx vitest run
```

Expected: clean type check + all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/src/components/pwa/InstallEntryCard.tsx \
        private-chef/frontend/src/pages/profile/Profile.tsx
git commit -m "feat(pwa): add Profile install entry card"
```

---

## Task 6: Maskable icon — sharp script + vite config + package.json

**Files:**
- Create: `private-chef/frontend/scripts/build-maskable-icon.mjs`
- Create: `private-chef/frontend/public/icons/icon-512-maskable.png` (script output)
- Modify: `private-chef/frontend/vite.config.ts`
- Modify: `private-chef/frontend/package.json`

- [ ] **Step 1: Add `sharp` devDependency**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm install --save-dev sharp@^0.33.0
```

Expected: install succeeds. If sharp fails to install on your platform, rerun with `npm install --save-dev sharp@^0.33.0 --force` or check that libvips is available system-wide.

- [ ] **Step 2: Write the icon-build script**

Create `private-chef/frontend/scripts/build-maskable-icon.mjs`:

```js
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = resolve('public/icons/icon-512.png')
const OUT = resolve('public/icons/icon-512-maskable.png')
const SIZE = 512
const SAFE_RATIO = 0.8 // 内容缩到 80%，外圈 10% padding（满足 maskable safe-area 规范）
const inner = Math.round(SIZE * SAFE_RATIO)
const pad = Math.round((SIZE - inner) / 2)

if (!existsSync(SRC)) {
  console.error(`✗ Missing source: ${SRC}`)
  console.error('  请先放置 public/icons/icon-512.png（512x512 PNG）')
  process.exit(1)
}

await sharp(SRC)
  .resize(inner, inner, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: pad,
    bottom: pad,
    left: pad,
    right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(OUT)

console.log(`✓ Generated ${OUT} (${SIZE}x${SIZE}, ${SAFE_RATIO * 100}% safe area)`)
```

- [ ] **Step 3: Add npm scripts to package.json**

Read `private-chef/frontend/package.json` first, then edit the `"scripts"` block. The existing scripts are:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

Change to:

```json
"scripts": {
  "dev": "vite",
  "icons:build": "node scripts/build-maskable-icon.mjs",
  "prebuild": "node scripts/build-maskable-icon.mjs",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 4: Run the script to generate the icon**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run icons:build
ls -la public/icons/
```

Expected: `icon-512-maskable.png` exists in `public/icons/`. Open it in an image viewer; you should see the original logo shrunk and centered with transparent padding around it.

- [ ] **Step 5: Update vite.config.ts**

Edit `private-chef/frontend/vite.config.ts`. Find:

```ts
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
```

Replace with:

```ts
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
```

Find:

```ts
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
```

Replace with:

```ts
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
```

- [ ] **Step 6: Full build to verify**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run build
ls dist/icons/ && cat dist/manifest.webmanifest | head -40
```

Expected:
- Build succeeds (prebuild hook runs script first, then tsc + vite build).
- `dist/icons/icon-512-maskable.png` exists.
- `dist/manifest.webmanifest` shows the new icons array with one `purpose: 'maskable'` entry pointing to `icons/icon-512-maskable.png`.

- [ ] **Step 7: Commit**

```bash
cd /Users/weilan/ali/ai/cook
git add private-chef/frontend/scripts/build-maskable-icon.mjs \
        private-chef/frontend/public/icons/icon-512-maskable.png \
        private-chef/frontend/vite.config.ts \
        private-chef/frontend/package.json \
        private-chef/frontend/package-lock.json
git commit -m "feat(pwa): generate padded maskable icon via sharp"
```

---

## Task 7: Final integration verification

No new code — only verification that the whole stack works end-to-end.

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npx vitest run
```

Expected: all tests pass, including both new test files.

- [ ] **Step 2: Run lint**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run lint
```

Expected: no errors. Warnings about existing code may remain; new code in `src/lib/pwa-install.ts`, `src/hooks/use-pwa-install.ts`, and `src/components/pwa/*` must be clean.

- [ ] **Step 3: Full production build**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run build
```

Expected: success. The prebuild hook regenerates the maskable icon, then tsc + vite build complete without errors. `dist/` contains `sw.js`, `manifest.webmanifest`, and all three icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`).

- [ ] **Step 4: Preview and manual smoke test**

```bash
cd /Users/weilan/ali/ai/cook/private-chef/frontend
npm run preview
```

In a desktop Chrome window, open the preview URL (typically `http://localhost:4173`). Verify:

1. The install prompt dialog appears within a second of page load (assuming localStorage is empty).
2. Open DevTools → Application → Manifest. Confirm:
   - No red warnings.
   - Icons section shows all three icons; the maskable preview shows the logo fully inside the safe-area circle, not cropped.
3. Open DevTools → Application → Service Workers. Confirm `sw.js` is registered and activated.
4. Click "稍后再说" — dialog closes.
5. Refresh the page (still same tab) — dialog does NOT re-appear (sessionStorage flag).
6. Open a new incognito window with the same URL — dialog appears again (clean session).
7. Click "不再提示" — dialog closes.
8. Refresh — dialog does NOT appear.
9. Clear `localStorage` in DevTools, refresh. Dialog appears. Click "立即安装" — Chrome's native install dialog opens.
10. Install. Verify:
    - PWA window opens in standalone mode (no address bar).
    - Toast says "装好啦, 下次直接从桌面打开 🎉".
    - Permanent dismiss flag is set in localStorage.
11. Navigate to `/profile`. Verify:
    - In the standalone PWA window: the `InstallEntryCard` does NOT render (installed === true).
    - In a regular browser tab (after uninstalling or in a fresh profile): the card renders at the top with "立即安装" or appropriate branch.

If any of these fail, halt and debug before declaring complete. The most common issues:
- Native prompt doesn't fire on Chrome → user has dismissed it too many times for this site; clear site data and reload, or try a fresh Chrome profile.
- Manifest warning about icon → re-run `npm run icons:build` and rebuild.

- [ ] **Step 5: Optional final commit if no code changes**

Verification only — no commit needed unless you found and fixed issues during step 4. If you did fix anything, commit with:

```bash
cd /Users/weilan/ali/ai/cook
git add -A
git commit -m "fix(pwa): address issues found during integration verification"
```

---

## Done

After all 7 tasks complete, the PWA install layer is live: users get a first-visit dialog (with platform-appropriate UX), a persistent Profile entry card, and a properly-shaped maskable icon. SW registration was already working; this plan only adds the missing install UX.

**Next step (out of scope for this plan):** deploy and verify on the production domain. The spec section "Deployment validation" lists the checks to run against the live `manifest.webmanifest` Content-Type and SW scope.
