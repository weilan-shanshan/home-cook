/**
 * COOK · 私厨 logo —— 圆胖橘猫端着一碗带蛋黄香葱的米饭。
 * 与 PWA icon 同款（scripts/build-app-icon.mjs）。
 *
 * 默认渲染 56×56 圆角方块。如需其它尺寸，传 `size`。
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
        <radialGradient id="cookBg" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#E0EBC8" />
          <stop offset="60%" stopColor="#B5D199" />
          <stop offset="100%" stopColor="#9CC084" />
        </radialGradient>
        <radialGradient id="cookSheen" cx="0.78" cy="0.2" r="0.55">
          <stop offset="0%" stopColor="#FCFAF3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FCFAF3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#cookBg)" />
      <rect width="512" height="512" rx="112" fill="url(#cookSheen)" />

      {/* Tail */}
      <path d="M 376 350 Q 432 340 428 290 Q 424 252 396 244" fill="none" stroke="#F0B564" strokeWidth="28" strokeLinecap="round" />

      {/* Body */}
      <path d="M 160 290 Q 160 230 204 210 Q 256 198 308 210 Q 352 230 352 290 L 352 416 Q 352 432 332 432 L 180 432 Q 160 432 160 416 Z" fill="#F0B564" />

      {/* Apron */}
      <path d="M 184 264 Q 256 250 328 264 L 336 412 Q 330 424 314 424 L 198 424 Q 182 424 180 412 Z" fill="#7AA468" />
      <path d="M 218 260 Q 230 218 256 216 Q 282 218 294 260" fill="none" stroke="#7AA468" strokeWidth="14" strokeLinecap="round" />
      <line x1="256" y1="266" x2="256" y2="416" stroke="#5E8C50" strokeWidth="2" opacity="0.4" />
      <rect x="220" y="350" width="72" height="44" rx="4" fill="#5E8C50" />

      {/* Paws extending forward */}
      <ellipse cx="200" cy="316" rx="22" ry="16" fill="#F0B564" />
      <ellipse cx="312" cy="316" rx="22" ry="16" fill="#F0B564" />

      {/* Bowl */}
      <ellipse cx="256" cy="302" rx="68" ry="11" fill="#8B5A1E" />
      <ellipse cx="256" cy="302" rx="62" ry="8" fill="#FCFAF3" />
      <path d="M 192 304 L 320 304 L 308 344 Q 304 354 296 354 L 216 354 Q 208 354 204 344 Z" fill="#FCFAF3" stroke="#8B5A1E" strokeWidth="3" />
      <line x1="200" y1="324" x2="312" y2="324" stroke="#8B5A1E" strokeWidth="1.5" opacity="0.3" />

      {/* Rice mound */}
      <path d="M 208 302 Q 218 286 232 282 Q 256 278 280 282 Q 294 286 304 302 Z" fill="#FDF1D9" stroke="#E8D9B8" strokeWidth="1.2" />
      <circle cx="228" cy="294" r="1.5" fill="#E8D9B8" opacity="0.7" />
      <circle cx="244" cy="290" r="1.5" fill="#E8D9B8" opacity="0.7" />
      <circle cx="262" cy="288" r="1.5" fill="#E8D9B8" opacity="0.7" />
      <circle cx="278" cy="290" r="1.5" fill="#E8D9B8" opacity="0.7" />
      <circle cx="292" cy="294" r="1.5" fill="#E8D9B8" opacity="0.7" />

      {/* Honey egg yolk */}
      <ellipse cx="256" cy="284" rx="11" ry="8" fill="#F0B564" />
      <ellipse cx="253" cy="282" rx="4" ry="3" fill="#FAC890" opacity="0.85" />

      {/* Scallion sprinkle */}
      <ellipse cx="234" cy="288" rx="4" ry="1.5" fill="#5E8C50" transform="rotate(-25 234 288)" />
      <ellipse cx="276" cy="288" rx="4" ry="1.5" fill="#5E8C50" transform="rotate(20 276 288)" />
      <ellipse cx="266" cy="296" rx="3.5" ry="1.4" fill="#5E8C50" />

      {/* Steam wisps */}
      <path d="M 244 264 Q 240 250 248 244 Q 244 232 250 224" stroke="#7AA468" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M 268 264 Q 272 250 264 244 Q 268 232 262 224" stroke="#7AA468" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55" />

      {/* Head */}
      <circle cx="256" cy="172" r="72" fill="#F0B564" />

      {/* Ears */}
      <path d="M 192 134 L 202 90 L 234 124 Z" fill="#F0B564" />
      <path d="M 320 134 L 310 90 L 278 124 Z" fill="#F0B564" />
      <path d="M 206 122 L 212 106 L 226 122 Z" fill="#F4D5C7" />
      <path d="M 306 122 L 300 106 L 286 122 Z" fill="#F4D5C7" />

      {/* Eyes (half-closed, looking down at bowl) */}
      <path d="M 220 174 Q 228 180 236 174" stroke="#1A1A18" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 276 174 Q 284 180 292 174" stroke="#1A1A18" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <ellipse cx="200" cy="200" rx="14" ry="8" fill="#F4D5C7" opacity="0.7" />
      <ellipse cx="312" cy="200" rx="14" ry="8" fill="#F4D5C7" opacity="0.7" />

      {/* Nose + smile */}
      <path d="M 250 196 L 256 204 L 262 196 Z" fill="#B47A22" />
      <path d="M 244 218 Q 256 226 268 218" stroke="#1A1A18" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Feet */}
      <ellipse cx="208" cy="438" rx="22" ry="12" fill="#F0B564" />
      <ellipse cx="304" cy="438" rx="22" ry="12" fill="#F0B564" />
    </svg>
  )
}
