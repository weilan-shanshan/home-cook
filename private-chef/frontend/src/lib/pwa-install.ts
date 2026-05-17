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

const isIPad =
  /iPad/.test(ua) ||
  (hasWindow && /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1)
const isIOS =
  (/iPhone|iPod/.test(ua) || isIPad) &&
  !(hasWindow && (window as unknown as { MSStream?: unknown }).MSStream)
const isAndroid = /Android/.test(ua)
const isMobile = /Mobile/.test(ua) || isIOS || isAndroid

const isWeChat = /MicroMessenger\b/i.test(ua)
const isWorkWechat = /wxwork/i.test(ua)
const isQQEmbed = /\bQQ\/[\d.]+/i.test(ua) && !/MQQBrowser/i.test(ua)
const isDingTalk = /DingTalk/i.test(ua)
const isFeishu = /Lark|Feishu/i.test(ua)
const isXiaohongshu = /xhs/i.test(ua)
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
