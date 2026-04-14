# Task 22 — PWA 配置（manifest + Service Worker）

> **Wave**: 4 | **可并行**: 与 T21, T23, T24 同时开始 | **预估**: 20 分钟
>
> **依赖**: T01（脚手架 — vite.config.ts 存在）
>
> **后续任务等我完成**: 无直接后续

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

配置 vite-plugin-pwa，生成 Web App Manifest 和 Service Worker，实现 PWA 安装和缓存策略。

## 需要修改/创建的文件

### 1. 更新 `frontend/vite.config.ts` — 添加 vite-plugin-pwa

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '私厨 — 家庭烹饪管理',
        short_name: '私厨',
        theme_color: '#F5F5F7',
        background_color: '#F5F5F7',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',      // API 优先网络
          },
          {
            urlPattern: /\.(?:js|css|html)$/,
            handler: 'CacheFirst',         // 静态资源缓存优先
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|gif)$/,
            handler: 'StaleWhileRevalidate', // 图片边用边更新
          },
        ],
      },
    }),
  ],
})
```

### 2. 创建 PWA 图标占位

- `frontend/public/icons/icon-192.png` — 192x192 简单彩色方块（后续替换）
- `frontend/public/icons/icon-512.png` — 512x512 简单彩色方块（后续替换）

> 可用 Canvas 生成或下载占位图片，不需要精美设计。

### 3. 更新 `frontend/index.html` — 添加 meta tags

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F5F5F7">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

## 技术方案参考

- `私厨-技术方案.md` 第 105 行 — vite-plugin-pwa
- `私厨-技术方案.md` 第 659 行 — Service Worker 对 /api/* 使用 NetworkFirst

## 验收标准

- [ ] `npm run build` 后 dist/ 中生成 manifest.webmanifest
- [ ] `npm run build` 后 dist/ 中生成 sw.js
- [ ] manifest 中 name="私厨" 或 "私厨 — 家庭烹饪管理"
- [ ] /api/* 使用 NetworkFirst 策略
- [ ] PWA 图标文件存在
- [ ] index.html 含 theme-color 和 apple-touch-icon

## 禁止事项

- ❌ 不使用 `as any` / `@ts-ignore`

## QA 场景

```
Scenario: PWA manifest and SW exist in build output
  Tool: Bash
  Steps:
    1. cd frontend && npm run build
    2. ls dist/manifest.webmanifest
    3. ls dist/sw.js (or registerSW.js)
    4. cat dist/manifest.webmanifest | grep "私厨"
  Expected Result: manifest and SW present, app name correct
  Evidence: .sisyphus/evidence/task-22-pwa.txt
```

## 提交

- **Group**: 与 T24 一起提交
- **Message**: `feat(infra): add PWA config and backup script`
- **Pre-commit**: `cd frontend && npm run build`
