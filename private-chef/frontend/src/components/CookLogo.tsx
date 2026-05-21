/**
 * 嫩芽叶 logo —— 与 PWA icon 同款（scripts/build-app-icon.mjs）
 * 用于登录页、注册页等需要展示品牌 logo 的位置（无文字版）。
 *
 * 默认渲染为 56×56 圆角方块。如需其它尺寸，传 `size` 即可。
 */

type Props = {
  size?: number
  className?: string
}

export function CookLogo({ size = 56, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="COOK 私厨"
    >
      <defs>
        <linearGradient id="cookLogoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9CC084" />
          <stop offset="55%" stopColor="#7AA468" />
          <stop offset="100%" stopColor="#5E8C50" />
        </linearGradient>
        <radialGradient id="cookLogoSheen" cx="0.78" cy="0.18" r="0.6">
          <stop offset="0%" stopColor="#F0B564" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#F0B564" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#cookLogoBg)" />
      <rect width="512" height="512" rx="112" fill="url(#cookLogoSheen)" />

      {/* 叶 silhouette */}
      <path
        d="M 196 376 C 180 280, 250 200, 348 168 C 364 252, 304 348, 224 392 C 212 398, 196 392, 196 376 Z"
        fill="#FCFAF3"
      />
      {/* 主脉 */}
      <path
        d="M 210 372 Q 286 280 344 172"
        stroke="#5E8C50"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      {/* 侧脉 */}
      <path
        d="M 250 330 Q 272 318 288 302"
        stroke="#5E8C50"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M 280 290 Q 302 278 315 261"
        stroke="#5E8C50"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* 蜂蜜小阳光 */}
      <circle cx="348" cy="168" r="20" fill="#F0B564" />
    </svg>
  )
}
