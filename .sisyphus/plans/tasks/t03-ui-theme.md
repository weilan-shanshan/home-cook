# Task 03 — shadcn/ui 组件库 + Apple 风全局样式

> **Wave**: 1 | **可并行**: 与 T01、T02 同时开始 | **预估**: 25 分钟
>
> **依赖**: T01（需要 frontend/package.json 已存在）
>
> **后续任务等我完成**: T15-T20（所有前端页面）

---

## 🔴 人工信息检查点

> 本任务**无需人工信息**，可直接执行。

---

## 目标

初始化 shadcn/ui 组件库，安装常用组件，创建 Apple 风全局样式系统（系统字体、大圆角、柔和阴影、毛玻璃效果 + 降级）。

## 具体步骤

### 1. 初始化 shadcn/ui

```bash
cd frontend
npx shadcn-ui@latest init
# 选择: TypeScript, Tailwind CSS, 默认风格
```

### 2. 安装常用组件

```bash
npx shadcn-ui@latest add button card input label textarea select dialog sheet tabs badge avatar toast separator dropdown-menu
```

### 3. 创建全局样式 `frontend/src/styles/globals.css`

Apple 风 5 个具体干预点：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Apple 风色彩 */
    --background: #F5F5F7;
    --foreground: #1D1D1F;
    --radius-card: 1rem;      /* rounded-2xl */
    --radius-modal: 1.5rem;   /* rounded-3xl */
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
    background-color: #F5F5F7;
    color: #1D1D1F;
    -webkit-font-smoothing: antialiased;
  }
}

/* 毛玻璃工具类 — 必须用 @supports 包裹 */
@supports (backdrop-filter: blur(1px)) {
  .glass-card {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.7);
  }
  .glass-nav {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.9);
  }
  .glass-modal {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.8);
  }
}

/* 毛玻璃降级 — @supports 外的默认 */
.glass-card { background: rgba(255, 255, 255, 0.95); }
.glass-nav { background: rgba(255, 255, 255, 0.98); }
.glass-modal { background: rgba(255, 255, 255, 0.96); }
```

### 4. 扩展 `tailwind.config.ts`

添加自定义 shadow 和 radius token：

```typescript
theme: {
  extend: {
    boxShadow: {
      'card': '0 2px 8px rgba(0,0,0,0.04)',
      'elevated': '0 8px 24px rgba(0,0,0,0.08)',
      'button': '0 1px 3px rgba(0,0,0,0.06)',
    },
    borderRadius: {
      'card': '1rem',
      'modal': '1.5rem',
    },
  }
}
```

### 5. 创建 `frontend/src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 验收标准

- [ ] `frontend/src/components/ui/` 包含 button, card, input, label, textarea, select, dialog, sheet, tabs, badge, avatar, toast 等组件
- [ ] `globals.css` 有系统字体栈、#F5F5F7 背景色
- [ ] 毛玻璃 CSS 用 `@supports (backdrop-filter: blur(1px))` 包裹
- [ ] `@supports` 外有纯色降级样式
- [ ] `tailwind.config.ts` 包含 shadow-card, shadow-elevated, rounded-card, rounded-modal
- [ ] `cn()` 工具函数正确导出
- [ ] `cd frontend && npm run build` 成功

## 禁止事项

- **不**对 sticky/fixed 全宽元素（TabBar）预设重度 backdrop-filter（会严重卡顿）
- 不使用 Tailwind v4
- 不安装额外 icon 库（用 Lucide React，shadcn 内置）
