// 通过 vite-plugin-pwa 提供的 virtual module 显式注册 SW。
// 这样可以保证国内浏览器（QQ/UC/微信内置等）以及 iOS Safari 都能挂上 service worker，
// 而不是依赖默认的 inline 注入脚本（默认注入在某些 CSP/插件下会被拦截）。

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') {
    return
  }
  if (!('serviceWorker' in navigator)) {
    // 国内部分极轻浏览器、企业微信内置 webview 不支持 SW，静默跳过。
    return
  }

  // 动态 import 避免 SSR / 测试环境引入 virtual:pwa-register 失败。
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
          if (!registration) return
          // 每小时主动检查一次更新，避免长时间打开的 PWA 无法拉到新版本。
          setInterval(
            () => {
              registration.update().catch(() => undefined)
            },
            60 * 60 * 1000,
          )
        },
        onNeedRefresh() {
          updateSW(true).catch(() => undefined)
        },
        onOfflineReady() {
          if (import.meta.env.DEV) {
            console.info('[pwa] offline ready')
          }
        },
        onRegisterError(error) {
          console.warn('[pwa] service worker register failed:', error)
        },
      })
    })
    .catch((error) => {
      console.warn('[pwa] virtual:pwa-register import failed:', error)
    })
}
