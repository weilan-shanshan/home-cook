# Cook 视觉设计归档

留档目录，按时间排序保存历次视觉系统 / 关键页面 mockup 与设计决策。每次大改前后都新增一版，不删旧版（方便回看演进、对比）。

## 当前版本

**v1 · 2026-05-17 — 温暖陶土橙 + Bento 模块化**
- mockup：[2026-05-17-visual-system-v1.html](./2026-05-17-visual-system-v1.html)（浏览器打开看 6 个核心页同框）
- 出图工具：`10x-teams:ui-ux-pro-max` skill
- 风格融合：Nature Distilled（陶土暖色 / 自然质感）+ Bento Grid（模块化卡片）
- 决策对应的 spec：`docs/superpowers/specs/2026-05-17-design-system-and-recipe-flow-design.md`

## Design Tokens（v1）

### 颜色

| Role | Token | Hex | 用途 |
|---|---|---|---|
| Brand | `brand` | `#EE6E47` | 主操作按钮、链接、选中态、品牌图标 |
| Brand 浅 | `brand-100` | `#FFDFCD` | 标签背景、hover、提示卡 |
| Brand 深 | `brand-700` | `#B23E1F` | 文字在 brand-100 上、强调标题 |
| Surface 页底 | `cream-50` | `#FDFAF5` | 整体页面背景 |
| Surface 卡 | `cream-100` | `#FAF6EE` | 次级卡片、tag 输入框 |
| Surface 边框 | `cream-300` | `#E8DFD3` | 分隔线、卡片描边 |
| Ink 主文 | `ink-900` | `#1F1815` | 标题、加粗正文 |
| Ink 正文 | `ink-700` | `#3D332C` | 普通正文 |
| Ink 弱化 | `ink-500` | `#7B6E63` | 次要信息、placeholder |
| Accent 鼠尾草 | `sage-500` | `#6B7B3C` | 「已完成」「掌勺」等成就状态 |
| Accent 琥珀 | `amber-500` | `#D97706` | 「制作中」「warning」 |
| Accent 玫红 | `rose-500` | `#B91C1C` | 「删除」「错误」 |

### 字体

- **正文**：`Inter` + `PingFang SC` (fallback `Hiragino Sans GB` / `Heiti SC`)
- **强调中文标题**：`Noto Serif SC` (fallback `Songti SC` / `SimSun`) — 用在 logo 字、品牌强调位置（不是所有标题都用，过度会显笨重）
- 数字位 tabular nums

### 圆角

- 按钮 / chip：`rounded-full` 或 `rounded-2xl` (16px)
- 卡片 / sheet header：`rounded-3xl` (24px)
- 缩略图 / icon 容器：`rounded-xl` (12px) 或 `rounded-2xl`

### Shadow

- `shadow-card`：`0 2px 8px rgba(31, 24, 21, 0.04)` — 普通卡片
- `shadow-elevated`：`0 8px 24px rgba(31, 24, 21, 0.08)` — 浮起 / hero CTA
- `shadow-sheet`：`0 -8px 32px rgba(31, 24, 21, 0.12)` — bottom sheet
- `shadow-button`：`0 2px 0 rgba(178, 62, 31, 0.2)` — brand 按钮立体边

### 动效

- 微交互：150–200ms `ease-out`
- Sheet 上推：200–250ms `ease-out`，下拉关闭 180ms `ease-in`
- 卡片 hover：scale `1.02`，避免位移
- 严格遵守 `prefers-reduced-motion`

## 已落地的页面映射

| Mockup | 实现文件 | 状态 |
|---|---|---|
| Home | `src/pages/home/Home.tsx` | 待重做（spec 3） |
| MenuPage | `src/pages/menu/MenuPage.tsx` | 待重做（spec 1） |
| 新增 Sheet | `src/components/recipe/RecipeSheet.tsx` (新增) | 待新建（spec 1） |
| RecipeDetail | `src/pages/recipe/RecipeDetail.tsx` | 待重做（spec 1） |
| OrderList | `src/pages/order/OrderList.tsx` | 待重做（spec 2） |
| OrderDetail | `src/pages/order/OrderDetailV2.tsx` | 待重做（spec 2） |

## 分阶段实施计划

| Spec | 范围 | 文件 |
|---|---|---|
| 1 | Design system 落地（Tailwind config、theme tokens、shadcn 组件主题化、底部 tab bar）+ 菜品流程 + 4 个 bug 修复 | `docs/superpowers/specs/2026-05-17-design-system-and-recipe-flow-design.md` |
| 2 | 订单流程重做（复用 spec 1 的 design system） | 待写 |
| 3 | Home 首页重做（复用 spec 1 的 design system） | 待写 |

## 改 mockup 流程（后续）

1. 复制 `latest.html` 到 `YYYY-MM-DD-vN.html` 作为新版本
2. 改完后更新本 README「当前版本」段
3. 如果是大改（动 design tokens），把上一版的 token 表也保留在历史 section
