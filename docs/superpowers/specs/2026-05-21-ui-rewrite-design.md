# COOK · 私厨 — 整体视觉系统 v1 重写设计

**Date:** 2026-05-21
**Scope:** `private-chef/frontend` 全站 UI 重写
**Branch:** `main` (直接 commit)
**Source of truth:** 用户提供的「整体视觉系统 v1」mockup（6 屏）

---

## 1. 目标与范围

### 1.1 目标
- 把 mockup 的 6 个核心屏（Home / Menu / 新增 Sheet / RecipeDetail / OrderList / OrderDetail）**像素级**还原
- 把同一套 design tokens、组件库、视觉语言推广到全站（Login / Register / Profile / Favorites / WishList / Achievements / OrderCreate / PublicSharePage）
- UI 优先原则：如果 mockup 与现有 API/状态/路由冲突，**改 API/状态/路由以适配 UI**

### 1.2 不做
- 后端 schema 变更（除非新 UI 必须）
- 重构数据层（React Query / hooks 保留）
- 引入新框架/库（继续 React 18 + Vite + Tailwind + Radix）

---

## 2. Design Tokens

### 2.1 色板（基于 mockup design tokens 行）

| 角色 | 角色描述 | 当前值 | 目标值 | 动作 |
|---|---|---|---|---|
| `brand-50` ~ `brand-700` | 主品牌橙 | 已有完整 7 阶 | 保持 | ✓ |
| `brand` (DEFAULT) | CTA / 强调 | `#EE6E47` | `#EE6E47` | ✓ |
| `cream-50` | App 底色 | `#FDFAF5` | `#FAF6EE` | **改** |
| `cream-100` | 卡片底 | `#FAF6EE` | `#F4EDDF` | **改** |
| `cream-200` | 软描边 / hover | `#F4EDDF` | `#E8DFD3` | **改** |
| `cream-300` | placeholder / 占位色块 | `#E8DFD3` | `#D9CCB8` | **改** |
| `cream-400` | 次要描边 | `#C9BCA8` | `#C9BCA8` | ✓ |
| `ink-900` | 主文本 | `#1F1815` | `#1F1815` | ✓ |
| `ink-700` | 副文本 | `#3D332C` | `#3D332C` | ✓ |
| `ink-500` | 弱文本 | `#7B6E63` | `#7B6E63` | ✓ |
| `ink-400` | 占位文本 | `#9C8E81` | `#9C8E81` | ✓ |
| `sage-200` | 鼠尾草绿底 | 暂无 | `#D9E2BB` | **新增** |
| `sage-500` | 鼠尾草绿 | `#6B7B3C` | `#6B7B3C` | ✓ |
| `mustard-500` | 沙米奶油芥末 | `amber-500 #D97706` | `#D97706` | 保持别名 |
| `rust-500` | 番茄/烧色 | 暂无 | `#B23E1F` | **新增** |
| `rose-500` | 备用红 | `#B91C1C` | `#B91C1C` | ✓ |

> 食材色块（菜品占位色）调色板：`brand-300 / sage-200 / mustard-100 / rust-300 / ink-300 / cream-300` 6 色循环。

### 2.2 字体
| 类型 | family |
|---|---|
| sans (UI / body) | `Inter, PingFang SC, Hiragino Sans GB, Heiti SC, sans-serif` |
| serif (中文标题 / 菜名) | `Noto Serif SC, Songti SC, SimSun, serif` |

### 2.3 圆角 / 阴影
- `--radius: 1rem` (16px) — 输入框 / chip
- `--radius-card: 1.5rem` (24px) — 卡片
- `--radius-modal: 2rem` (32px) — Sheet / 大卡
- `shadow-card` `shadow-elevated` `shadow-sheet` 保持

### 2.4 文件清单
- 改：`frontend/tailwind.config.ts` (色板加 sage/rust 阶 + cream 调暖)
- 改：`frontend/src/styles/index.css` (`--background` 改 36 30% 95%、body 背景色)

---

## 3. 组件库变更（src/components/ui/）

### 3.1 改造（保持 API 兼容）
| 文件 | 改动 |
|---|---|
| `button.tsx` | 加 `pill` size：`h-14 rounded-full px-8 text-base font-medium`；`brand` variant 默认带轻按下阴影 |
| `card.tsx` | 默认背景 `bg-white`，新增 `cream` variant (`bg-cream-100 border-cream-200`)；圆角默认 24 |
| `badge.tsx` | 新增 `chip` variant：胶囊形、12px text、`bg-brand text-white` 或 `bg-cream-200 text-ink-700` |
| `tabs.tsx` | 加 trigger 内可放数字 `<span className="badge">` 的样式 |
| `sheet.tsx` | 已 OK，确认 bottom 方向圆角顶 32px + 顶部 grab handle |
| `input.tsx` `textarea.tsx` | 高度统一 `h-12`，圆角 16，`bg-cream-100/60`，focus 边 brand |

### 3.2 新增组件
| 文件 | 用途 |
|---|---|
| `ui/chip-group.tsx` | 横滚分类 chip（菜单页分类、新增 sheet 标签） |
| `ui/floating-bar.tsx` | 底部 floating 操作栏（菜单"已选 N 道"、详情"加入点单"） |
| `home/HomeHeroCTA.tsx` | 「今晚吃什么」橙色大 CTA 卡（圆点装饰背景） |
| `home/HomePendingOrderCard.tsx` | 「等你接单」卡（菜品色块 row + 我来接单 CTA） |
| `home/StatTile.tsx` | 双格统计（本周 12 单 / 掌勺 5 次） |
| `home/RecentDishRail.tsx` | 横滚最近常做（圆角彩色块 + 标题） |
| `recipe/DishThumb.tsx` | 菜品色块缩略图（带 fallback 色） |
| `recipe/ImageUploadTile.tsx` | 4 格图片上传（含进度 / 删除） |
| `order/OrderColorChips.tsx` | 订单卡里的菜品色块 row（mockup 风：纯色，无文字） |
| `order/StatusStepBar.tsx` | 4-step 横向进度（已下单 / 已接单 / 制作中 / 已完成） |

### 3.3 删除/替换
| 文件 | 动作 |
|---|---|
| `home/HomeShortcuts.tsx` | 删除（mockup 无 4 格快捷） |
| `home/HomeRecentComments.tsx` `home/HomeCommentRow.tsx` | 迁移到 Profile 页 |
| `home/AchievementStats.tsx` | 删除（被 StatTile 替代） |
| `home/HomeRecipeRail.tsx` | 替换为 RecentDishRail |

---

## 4. 页面拆解（mockup 6 屏）

### 4.1 Home `pages/home/Home.tsx`
```
AppShell
├─ Top: 问候 + 「厨」椒色圆徽章 → onClick navigate('/profile')
├─ HomeHeroCTA: 「今晚吃什么 / 点单一下，厨房有人接 / 立即点单 →」
│   └─ onClick navigate('/menu')
├─ HomePendingOrderCard (条件: 有未接单订单)
│   └─ 我来接单 → mutation acceptOrder
├─ StatTile × 2 (本周单数 / 掌勺次数)
└─ RecentDishRail: 横滚 4 个菜品色块 + 「全部 →」
```
- 数据：复用 `useHomeSummary` / 现有 hooks
- 删除：HomeShortcuts、AchievementStats、HomeRecentComments

### 4.2 MenuPage `pages/menu/MenuPage.tsx`
```
AppShell
├─ Top: 「菜单」 + 右上 Pill「+ 新菜」(opens BottomSheet)
├─ Search input (圆角 16)
├─ ChipGroup: 全部 / 家常 / 早餐 / 午餐 / 晚餐 / 汤
├─ Grid 2 cols: DishCard (彩色块 + 菜名 + meta + 「+」 fab)
└─ FloatingBar (条件: 已选 ≥1)
    └─ 「已选 N 道 提交点单 →」→ navigate('/order/create?ids=...')
```

### 4.3 新增菜品 BottomSheet
**触发**：MenuPage 右上「+ 新菜」
**实现**：复用 `RecipeFormCore.tsx`，包在 `ui/sheet.tsx` 的 bottom Sheet 里
```
Sheet (rounded-t-[32px])
├─ Header: 「连续录入模式 / 新增菜品 / X」
├─ Body:
│   ├─ 菜名 input
│   ├─ ImageUploadTile × 4 (含上传进度 67% 显示)
│   ├─ 描述 textarea
│   ├─ 时长 / 份数 (2 col input)
│   ├─ 标签 ChipGroup + 「+ 添加」
└─ Footer: 「创建并继续 →」(pill) + 折叠 chevron
```
- "创建并继续"：mutation 成功后 form.reset()，sheet 保持打开
- 折叠 chevron：mutation 成功 + sheet 关闭

### 4.4 RecipeDetail `pages/recipe/RecipeDetail.tsx`
```
AppShell (no top padding)
├─ Hero (bg-brand 全宽 4:3): 图片 / fallback 大色块 + 分页点
│   └─ 左上 back 按钮 + 右上 「+」 按钮
├─ ContentCard (overlap hero, rounded-3xl bg-white):
│   ├─ chip "家常 · 晚餐"
│   ├─ <h1 font-serif> 红烧肉
│   ├─ meta chips: 45 分钟 / 2 人份 / 已做 8 次
│   └─ description (font-serif text-sm)
├─ StepsList:
│   ├─ "步骤" label
│   └─ Step row × N: 圆角橙色数字 + 描述
└─ Fixed bottom bar: [编辑] + [+ 加入点单] (pill)
```

### 4.5 OrderList `pages/order/OrderList.tsx`
```
AppShell
├─ Top: 「订单」
├─ Tabs (Radix): 全部 12 / 待接单 1 / 制作中 2 / 已完成 9
│   └─ trigger 内 badge 数字
├─ OrderCard × N:
│   ├─ status chip (左上) + 时间 (右上)
│   ├─ <h3> 晚餐 #128
│   ├─ meta: 爸·点单 · 尚无大厨
│   ├─ OrderColorChips: 3-4 个圆角色块（无文字）
│   └─ 主按钮 (按状态变化: 我来接单 / 出锅完成 ✓ / 已完成)
└─ TabBar (订单 tab 高亮)
```

### 4.6 OrderDetailV2 `pages/order/OrderDetailV2.tsx`
```
AppShell
├─ Top: back + 「晚餐 #128」 + 「今天 18:15 · 爸 点单」
├─ Status Card (bg-brand-50, rounded-3xl):
│   ├─ 「订单状态」+ "进行中" chip (右上)
│   ├─ <h2 font-serif text-brand> 等你接单
│   ├─ StatusStepBar 4 步: 已下单/已接单/制作中/已完成
│   └─ Pill 主按钮: 「我来接单」(按状态变化)
├─ Dishes Card:
│   ├─ "3 道菜" header
│   └─ DishRow × N: DishThumb + 菜名 + meta + × N
├─ Notes Card:
│   ├─ "备注 N 条"
│   └─ Note rows: avatar + name(chip) + content
└─ Fixed bottom: 备注输入框 + 圆角发送按钮
```

---

## 5. 非 mockup 页（套同套 tokens + 组件）

### 5.1 TabBar `pages/layout/TabBar.tsx`
- 4 项：首页 / 菜单 / 订单 / 我（mockup 第 1 屏可见）
- 激活态：橙色方块底 + 白色 icon；非激活态：cream-300 outline
- 高度保持 64px，safe-area-bottom

### 5.2 Profile (`pages/profile/Profile.tsx`) — 「我」tab 承载页
新结构：
```
AppShell
├─ User card: avatar + 昵称 + role chip
├─ StatTile 2×2: 总单数 / 总掌勺 / 待接单 / 收藏数
├─ Quick links card grid (Bento 2 col):
│   ├─ 收藏 → /favorites
│   ├─ 心愿单 → /wishes
│   ├─ 成就 → /achievements
│   └─ 分享空间 → /share/…
├─ RecentNotesCard (从 Home 迁来的 HomeRecentComments)
└─ Settings list: 退出登录 / 关于
```

### 5.3 Login / Register
- 居中卡片 (rounded-3xl bg-white shadow-elevated)
- 标题 font-serif text-2xl "COOK · 私厨"
- 输入框统一 cream-100 底
- 主按钮 pill brand

### 5.4 Favorites / WishList / Achievements / OrderCreate / PublicSharePage
- 统一套 `Card` cream variant + serif 标题
- 信息架构不变；只换视觉

---

## 6. 路由 / 状态变更清单

| 路由 | 变更 |
|---|---|
| `/` Home | CTA 不再链 `/order/create`，改链 `/menu` |
| `/menu` | 右上「+ 新菜」改为 sheet（不跳路由）；底部「提交点单」继续走 `/order/create?ids=` |
| `/recipe/new` | 保留 redirect → `/menu`（已有） |
| `/order/create` | 保留，简化为只接受 `ids=` query |
| 其它 | 不变 |

| 状态 | 变更 |
|---|---|
| `HomeRecentComments` 数据 | 从 Home 移到 Profile |
| menu 已选菜品 | 用现有 hook（如有）/ 否则用 URL search params 持久化 |

---

## 7. 实施顺序（增量 commit，每项一个 commit）

### Phase 1 — 基建（4-5 commits）
1. tokens：tailwind config + index.css 调整
2. ui/button.tsx + ui/card.tsx + ui/badge.tsx + ui/input.tsx 升级
3. ui/chip-group.tsx + ui/floating-bar.tsx 新增
4. home/StatTile + DishThumb + ImageUploadTile + OrderColorChips + StatusStepBar 新增
5. AppLayout + TabBar 4 项重写

### Phase 2 — mockup 6 屏（6 commits）
6. Home
7. MenuPage
8. 新增 Sheet（改造 RecipeForm 支持 sheet 模式）
9. RecipeDetail
10. OrderList
11. OrderDetailV2

### Phase 3 — 其它页（7 commits）
12. Profile（含 favorites/wishes/achievements 入口 + RecentNotes 迁入）
13. Login / Register
14. Favorites
15. WishList
16. Achievements
17. OrderCreate（简化版）
18. PublicSharePage

### Phase 4 — 验证（1 commit）
19. dev server 起服 + 6 屏 + 主要其它页截图对照 mockup，逐屏修复偏差

---

## 8. 验收标准

- [ ] mockup 6 屏在 mobile 375 视口下与设计稿一致（图片对比偏差 < 4px）
- [ ] 全站使用同一套 tokens（无散落 hex / 任意 rgb）
- [ ] 所有可点元素有 `cursor-pointer` + hover 反馈
- [ ] WCAG 4.5:1 文本对比度（brand 上的白字、cream 上的 ink-900）
- [ ] `npm run build` 无 type error / lint warning 不超过现状
- [ ] dev preview 主要交互（点单 / 接单 / 新增 / 编辑）行为正常

---

## 9. 风险与边界

- **数据 fallback**：mockup 显示的菜品色块要求图片 fallback 色，需为每道菜从其 id hash 出一个稳定色（写入 `DishThumb.tsx`）
- **图片上传进度**：mockup 显示 "67%"，复用 `browser-image-compression` 现有进度回调
- **空状态**：mockup 未画空菜单/空订单态，本次按现有空态文案套新视觉
- **暗色模式**：mockup 未提供暗色版，本次只做 light mode；保留 `darkMode: ['class']` 配置不动
- **PWA 图标**：现有 `scripts/build-app-icon.mjs` 不动，图标色已是 brand 橙
