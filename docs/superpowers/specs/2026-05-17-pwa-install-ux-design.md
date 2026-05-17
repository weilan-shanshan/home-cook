# PWA 安装体验补齐 —— 设计文档

- 日期：2026-05-17
- 范围：`/Users/weilan/ali/ai/cook/private-chef/frontend`
- 参考实现：`/Users/weilan/ali/ai/Nestworth`（同级仓库，PWA 安装层已跑通）

## 1. 背景

cook 当前已具备 PWA 底层能力：

- `vite-plugin-pwa` 已配，构建产物含 `sw.js` / `workbox-*.js` / `manifest.webmanifest`
- `src/lib/pwa.ts` 在 `main.tsx` 里手动注册 service worker
- manifest 含 `display: standalone`、`icons[]`、`start_url` 等必填字段

但用户层完全缺失「安装引导」：

- 无 `beforeinstallprompt` 捕获 → 浏览器没机会弹原生安装窗
- 无 iOS Safari 引导（iOS 必须手动「分享 → 添加到主屏幕」）
- 无微信/QQ/钉钉/飞书等 in-app webview 提示（这些环境装不了 PWA）
- 无设置页常驻入口，用户找不到「装到桌面」按钮

直接后果：

1. **「看不到安装入口」** —— 用户根本不知道可以装
2. **「装了打开还是网页态」** —— 浏览器不弹 "Install" 提示，用户只能用「创建快捷方式」兜底，快捷方式不走 manifest 的 `display: standalone`，自然还是网页态

同时 manifest 图标违反 maskable 规范：同一张普通 PNG 同时声明 `purpose: 'any'` 和 `purpose: 'maskable'`，Android 安装后图标会被裁切。

## 2. 目标

- 在桌面 Chrome / 桌面 Edge / Android Chrome：用户能点按钮触发原生安装窗，装完是 standalone
- 在 iOS Safari：用户能看到清晰的「分享 → 添加到主屏幕」三步引导
- 在桌面 Safari / Firefox：明确告知「请用 Chrome/Edge 打开以安装」
- 在微信/QQ/钉钉/飞书等 in-app webview：明确告知「请在外部浏览器打开」
- manifest 图标在 Android 上不再被裁切
- 已安装用户进入应用，不再被安装提示打扰

## 3. 非目标 (YAGNI)

- ❌ PWA 更新通知 UI（已有 `onNeedRefresh` 自动 reload，够用）
- ❌ 安装率埋点（cook 没埋点框架，先不引入）
- ❌ 安装引导文案 A/B 测试
- ❌ 「延迟到第 N 次访问才弹」逻辑（产品决策：首访就弹）
- ❌ 桌面端 install card 区分操作系统的差异化文案

## 4. 架构

### 4.1 文件结构

```
src/lib/
  ├── pwa.ts                  (已有，保留 SW 注册)
  └── pwa-install.ts          (新增，框架无关 TS 单例)

src/hooks/
  └── use-pwa-install.ts      (新增，React 桥)

src/components/pwa/
  ├── PWAInstallPrompt.tsx    (新增，全局首访弹窗，shadcn Dialog)
  ├── InstallEntryCard.tsx    (新增，Profile 顶部入口卡，shadcn Card)
  └── IOSInstallGuide.tsx     (新增，iOS 步骤图，inline SVG)

src/App.tsx                   (改，挂 <PWAInstallPrompt /> 到根)
src/pages/profile/Profile.tsx (改，顶部插 <InstallEntryCard />)

scripts/
  └── build-maskable-icon.mjs (新增，用 sharp 生成 padded maskable 图)

public/icons/
  └── icon-512-maskable.png   (脚本产物)

vite.config.ts                (改，maskable icon 指向新文件)
package.json                  (加 sharp devDep + icons:build script + prebuild hook)
```

### 4.2 分层职责

| 层 | 文件 | 职责 |
|---|---|---|
| 平台层 | `pwa-install.ts` | UA 检测、`beforeinstallprompt` 缓存、`tryInstall` 决策。不依赖 React |
| 桥接层 | `use-pwa-install.ts` | 把单例事件桥接到 React 响应式状态 |
| UI 层 | 三个组件 | 各自一职：全局弹窗、Profile 卡、iOS 步骤图 |

这样将来 cook 换框架（甚至搬到 RN Web）只需要重写桥和组件，平台层可复用。

## 5. 详细设计

### 5.1 `src/lib/pwa-install.ts`（核心单例）

完全移植 Nestworth 的 `/Users/weilan/ali/ai/Nestworth/src/lib/pwa-install.ts`，逻辑不变。导出：

```ts
export type BrowserKind =
  | 'iosSafari' | 'androidChromium' | 'desktopChromium'
  | 'desktopSafari' | 'desktopFirefox'
  | 'wechat' | 'qq' | 'workWechat' | 'dingtalk' | 'feishu'
  | 'xiaohongshu' | 'douyin' | 'webview' | 'unknown';

export type InstallResult =
  | 'ACCEPTED' | 'DISMISSED' | 'IOS_SHOW_GUIDE'
  | 'OPEN_IN_BROWSER' | 'NO_PROMPT';

export interface PwaInstallApi {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktopChromium: boolean;
  isWeChat: boolean;
  isInAppBrowser: boolean;
  browserKind: BrowserKind;
  hasNativePrompt: () => boolean;
  onReady: (cb: () => void) => void;
  onInstalled: (cb: () => void) => void;   // 新增：appinstalled 监听
  tryInstall: () => Promise<InstallResult>;
}

export const pwaInstall: PwaInstallApi;
```

模块顶层注册：

```ts
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; ... });
window.addEventListener('appinstalled', () => { deferred = null; installedCallbacks.forEach(cb => cb()); });
```

所有 `window` / `navigator` 访问加 `typeof` 守卫（防 SSR/测试环境）。

### 5.2 `src/hooks/use-pwa-install.ts`

```ts
export function usePwaInstall() {
  const [promptReady, setPromptReady] = useState(pwaInstall.hasNativePrompt());
  const [installed, setInstalled] = useState(pwaInstall.isStandalone);

  useEffect(() => {
    pwaInstall.onReady(() => setPromptReady(true));
    pwaInstall.onInstalled(() => setInstalled(true));
  }, []);

  return {
    promptReady,
    installed,
    isIOS: pwaInstall.isIOS,
    isInAppBrowser: pwaInstall.isInAppBrowser,
    browserKind: pwaInstall.browserKind,
    tryInstall: pwaInstall.tryInstall,
  };
}
```

### 5.3 `src/components/pwa/PWAInstallPrompt.tsx`（全局首访弹窗）

挂在 `App.tsx` 根（`<BrowserRouter>` 内、`<Routes>` 同级），shadcn `Dialog`。

**触发条件**（全部满足才打开）：

```
!installed
  && !isInAppBrowser
  && !localStorage['cook.pwa.dismissed.permanent']
  && !sessionStorage['cook.pwa.dismissed.session']
```

**按 `browserKind` 渲染**：

| browserKind | 内容 |
|---|---|
| `androidChromium` / `desktopChromium` | 标题「装到桌面，秒开私厨」+ 主按钮调 `tryInstall()` |
| `iosSafari` | 标题「iPhone 用户看这里」+ `<IOSInstallGuide />` |
| `desktopSafari` / `desktopFirefox` | 文案「推荐用 Chrome/Edge 打开以装到桌面」+ 复制链接按钮 |
| 其它（含 `unknown`） | 同上桌面 Safari 分支 |

**Dismiss 三档**：

- 「稍后再说」按钮 → `sessionStorage.setItem('cook.pwa.dismissed.session', '1')`，本会话不再弹
- 「不再提示」按钮 → `localStorage.setItem('cook.pwa.dismissed.permanent', '1')`，永久关闭
- 安装成功 → 同样写 permanent 标记。两条路径都要覆盖：
  - `tryInstall()` 返回 `ACCEPTED` → 立即写 + 关闭弹窗
  - `usePwaInstall().installed` 变 true（用户从浏览器菜单装的，appinstalled 兜底） → useEffect 监听变化，写标记 + 关闭弹窗 + Toast「装好啦」

### 5.4 `src/components/pwa/InstallEntryCard.tsx`（Profile 顶部入口）

shadcn `Card`。挂在 `Profile.tsx` 顶部（用户信息区下方第一张卡）。

**渲染规则**：

| 状态 | 表现 |
|---|---|
| `installed === true`（standalone） | 整张卡返回 null，不占位 |
| `isInAppBrowser` | 灰按钮 + 文案「请点右上角 ··· → 在浏览器打开」 |
| `isIOS` | 按钮「教我装」→ 弹同款 `<IOSInstallGuide />` 模态 |
| 桌面/Android Chrome 触发了 `promptReady` | 主按钮「立即安装」→ 调 `tryInstall()` |
| 桌面/Android Chrome 但 `promptReady === false` | 灰按钮 + 文案「请稍后再试或换 Chrome/Edge 打开」 |
| 桌面 Safari / Firefox | 文案「推荐用 Chrome/Edge 打开」+ 复制链接按钮 |

### 5.5 `src/components/pwa/IOSInstallGuide.tsx`

纯静态展示，inline SVG 三步图：

1. 「点底部分享按钮」（iOS share icon SVG）
2. 「往下滚动找『添加到主屏幕』」（list item SVG）
3. 「点右上角『添加』」（add button SVG）

用 inline SVG 而不是外链 PNG，避免微信/UC 缓存策略干扰。

### 5.6 `scripts/build-maskable-icon.mjs`

```js
import sharp from 'sharp';
import path from 'node:path';

const SRC = 'public/icons/icon-512.png';
const OUT = 'public/icons/icon-512-maskable.png';
const SIZE = 512;
const SAFE_RATIO = 0.8;   // 内容缩到 80%，外圈 10% padding
const inner = Math.round(SIZE * SAFE_RATIO);
const pad = Math.round((SIZE - inner) / 2);

await sharp(SRC)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: pad, bottom: pad, left: pad, right: pad,
            background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(OUT);

console.log(`✓ Generated ${OUT}`);
```

边界：

- `SRC` 不存在 → sharp 抛错退出，提示「请先放置 public/icons/icon-512.png」
- 脚本幂等，每次覆盖输出
- `package.json` 加 `"prebuild": "node scripts/build-maskable-icon.mjs"` 保证 build 前一定重生

### 5.7 `vite.config.ts` 改动

```diff
   icons: [
     { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
-    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
     { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
-    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
+    { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
   ],
```

并把 `includeAssets` 加入新图：

```diff
-  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
+  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
```

### 5.8 `package.json` 改动

```diff
   "scripts": {
+    "icons:build": "node scripts/build-maskable-icon.mjs",
+    "prebuild": "node scripts/build-maskable-icon.mjs",
     "build": "tsc -b && vite build",
     ...
   },
   "devDependencies": {
+    "sharp": "^0.33.0",
     ...
   }
```

## 6. 数据流

```
应用启动
  └─ pwa-install.ts 模块顶层执行
       ├─ window.addEventListener('beforeinstallprompt', defer)
       └─ window.addEventListener('appinstalled', notify)

App.tsx mount
  └─ <PWAInstallPrompt />
       └─ useEffect 一次：
            读 installed / isInAppBrowser / localStorage / sessionStorage
            → 决定 setOpen(true/false)
       └─ 用户点主按钮 → tryInstall() → 根据返回值 dismiss + 写 permanent 标记

Profile.tsx mount
  └─ <InstallEntryCard />
       └─ usePwaInstall() 订阅同一单例的 onReady / onInstalled
       └─ 按 browserKind 渲染对应分支
```

## 7. 错误处理

| 场景 | 处理 |
|---|---|
| `beforeinstallprompt` 始终未触发 | `tryInstall()` 返回 `NO_PROMPT` → UI 显示「当前浏览器不支持自动安装」+ 复制链接按钮 |
| localStorage 不可用（隐私模式） | try/catch；降级为不记忆 dismiss 状态，不崩溃 |
| sessionStorage 不可用 | 同上 |
| `deferred.prompt()` 抛错 | catch；Toast「安装失败，请稍后重试」 |
| navigator 在 SSR 期不存在 | 模块顶层 `typeof window !== 'undefined'` 守卫 |
| 用户在 prompt 弹出后切走 tab 再回来 | `userChoice` 是 Promise，await 不会丢；resolve 后正常处理 |
| sharp 装不上（构建机 OS 不兼容） | 提示用户用 `pnpm rebuild sharp` 或预装系统 libvips |

## 8. 测试

cook 已有 vitest + jsdom（`vite.config.ts:124-128`），沿用。

### 写测试

**`pwa-install.test.ts`**

- UA 解析：6 种 `browserKind` 各 1 case（mock `navigator.userAgent`）
- `isInAppBrowser` 识别：wechat / dingtalk / feishu 各 1 case
- `tryInstall` 分支：
  - 内嵌 → `OPEN_IN_BROWSER`
  - iOS → `IOS_SHOW_GUIDE`
  - 有 deferred prompt → 按 userChoice 返回 ACCEPTED/DISMISSED
  - 无 prompt 也非 iOS → `NO_PROMPT`
- localStorage 不可用降级：mock setItem 抛错，确认不崩溃

**`PWAInstallPrompt.test.tsx`**

- `installed === true` 时不渲染
- 内嵌环境时不渲染
- localStorage 有 permanent 标记时不渲染
- iOS Safari 时渲染 `<IOSInstallGuide />`
- 桌面 Chrome 点主按钮 → 调单例 `tryInstall`（spy）

### 不写测试

- `InstallEntryCard.tsx` —— 条件渲染逻辑跟 Prompt 重叠
- `IOSInstallGuide.tsx` —— 静态 SVG
- `use-pwa-install.ts` —— 简单 useState 桥
- `build-maskable-icon.mjs` —— 一次性脚本，手跑验证产物
- E2E —— 浏览器 native install prompt 自动化里没法触发

### 手动验证清单

实施完成后跑一遍：

1. 桌面 Chrome 打开 → 看到全局弹窗 → 点安装 → 系统弹原生窗 → 装到 dock/任务栏
2. 桌面 Safari 打开 → 看到「推荐用 Chrome 打开」分支
3. iPhone Safari 打开 → 看到 iOS 步骤图
4. 微信里打开 → 全局弹窗不出现，Profile 卡显示「请在浏览器打开」
5. 装好后再打开 → 弹窗不再出现，Profile 卡自动隐藏
6. DevTools → Application → Manifest → 无红色警告，maskable 图标预览正常（圆形遮罩内内容不被裁）
7. 装好后从桌面图标启动 → 无浏览器地址栏（display: standalone 生效）

## 9. 部署校验（不在本次实施范围，但建议同步检查）

线上链接打开 DevTools → Application → Manifest，确认：

- `manifest.webmanifest` Content-Type 为 `application/manifest+json`
- `sw.js` 注册成功且 scope = `/`
- 无 "Page does not work offline" / "Manifest icon missing or invalid" 警告

若 Content-Type 不对，在 Cloudflare/Netlify（看 `public/_redirects` 推断的部署方）配 header 规则。

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 首访就弹被嫌烦 | 提供「稍后」「不再提示」两档，安装成功永久关闭，14 天 ttl 不引入（用户选首访策略时已接受这风险） |
| 桌面 Chrome 没及时触发 `beforeinstallprompt`（需要满足"用户互动"启发式） | InstallEntryCard 持续监听 `onReady`，一旦触发立即解锁按钮 |
| sharp 在某些 CI 环境装失败 | prebuild 钩子失败 → build 失败 → 显式信号，不会带"老 maskable 图"上线 |
| 移植 Nestworth 单例的 Vue/TS 差异 | 该文件本身就是框架无关 TS，无 Vue API 依赖，可直接复制 |

## 11. 文件清单（实施时严格按此清单）

新增：

- `src/lib/pwa-install.ts`
- `src/hooks/use-pwa-install.ts`
- `src/components/pwa/PWAInstallPrompt.tsx`
- `src/components/pwa/InstallEntryCard.tsx`
- `src/components/pwa/IOSInstallGuide.tsx`
- `scripts/build-maskable-icon.mjs`
- `public/icons/icon-512-maskable.png`（脚本产物）
- `src/lib/pwa-install.test.ts`
- `src/components/pwa/PWAInstallPrompt.test.tsx`

修改：

- `src/App.tsx`（挂全局 PWAInstallPrompt）
- `src/pages/profile/Profile.tsx`（顶部插 InstallEntryCard）
- `vite.config.ts`（修 maskable 配置）
- `package.json`（加 sharp + 脚本）
