/**
 * 生成 cook 的 PWA 主图标（v3.3 Spring Palette）：
 *   - icon-192.png / icon-512.png：圆角方块 + 嫩芽叶 logo（purpose: 'any'）
 *   - icon-512-maskable.png：满版 sage 渐变 + 中心 70% safe-area 内 logo（purpose: 'maskable'）
 *
 * 设计语言（无文字 logo）：
 *   · 背景：sage 三阶渐变 #9CC084 → #7AA468 → #5E8C50
 *   · 主体：奶白嫩叶 #FCFAF3 + 深 sage 主脉/侧脉 #5E8C50
 *   · 点睛：蜂蜜小阳光 #F0B564 位于叶尖
 *
 * 后续若设计师出了正式 logo，可以直接替换 SVG 内容或覆盖 PNG 文件。
 */
import sharp from 'sharp'
import { resolve } from 'node:path'

// 固定 viewBox 512，所有坐标都按 512 设计；输出尺寸通过 sharp.resize 控制
function makeLeafSvg({ rounded = true, sheenIntensity = 0.30 } = {}) {
  const rx = rounded ? Math.round(512 * 0.22) : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9CC084"/>
        <stop offset="55%" stop-color="#7AA468"/>
        <stop offset="100%" stop-color="#5E8C50"/>
      </linearGradient>
      <radialGradient id="sheen" cx="0.78" cy="0.18" r="0.6">
        <stop offset="0%" stop-color="#F0B564" stop-opacity="${sheenIntensity}"/>
        <stop offset="100%" stop-color="#F0B564" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
    <rect width="512" height="512" rx="${rx}" fill="url(#sheen)"/>

    <!-- 嫩芽叶 silhouette: 从左下生长，向右上扬 -->
    <path d="
      M 196 376
      C 180 280, 250 200, 348 168
      C 364 252, 304 348, 224 392
      C 212 398, 196 392, 196 376
      Z
    " fill="#FCFAF3"/>

    <!-- 主脉 -->
    <path d="M 210 372 Q 286 280 344 172"
          stroke="#5E8C50" stroke-width="9" fill="none" stroke-linecap="round"/>

    <!-- 侧脉 -->
    <path d="M 250 330 Q 272 318 288 302"
          stroke="#5E8C50" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.75"/>
    <path d="M 280 290 Q 302 278 315 261"
          stroke="#5E8C50" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.75"/>

    <!-- 蜂蜜小阳光（叶尖） -->
    <circle cx="348" cy="168" r="20" fill="#F0B564"/>
  </svg>`
}

const jobs = [
  { size: 192, svg: makeLeafSvg({ rounded: true }),  out: 'public/icons/icon-192.png' },
  { size: 512, svg: makeLeafSvg({ rounded: true }),  out: 'public/icons/icon-512.png' },
  // maskable：满版铺色（圆角由系统裁剪），sheen 稍强
  { size: 512, svg: makeLeafSvg({ rounded: false, sheenIntensity: 0.40 }), out: 'public/icons/icon-512-maskable.png' },
]

for (const { size, svg, out } of jobs) {
  const absOut = resolve(out)
  // svg 内置 512×512，按 density 384 渲染（≈ 2x retina），再 resize 到目标尺寸
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toFile(absOut)
  console.log(`✓ ${absOut}`)
}
