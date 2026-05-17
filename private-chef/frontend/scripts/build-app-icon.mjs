/**
 * 生成 cook 的 PWA 主图标：
 *   - icon-192.png / icon-512.png：圆角方块 + 居中「厨」字（用于 purpose: 'any'）
 *   - icon-512-maskable.png：满版品牌色 + 中心 70% safe area 内放「厨」字
 *     （用于 purpose: 'maskable'，圆角/圆形遮罩由系统处理）
 *
 * 后续若设计师出了正式 logo，可以直接替换 SVG 内容或覆盖 PNG 文件。
 */
import sharp from 'sharp'
import { resolve } from 'node:path'

const PRIMARY = '#EE6E47' // = hsl(12 90% 58%), matches --primary in globals.css

function makeRoundedSvg(size) {
  const r = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.48)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${PRIMARY}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          font-family="'PingFang SC','Hiragino Sans GB','Heiti SC','Microsoft YaHei',-apple-system,sans-serif"
          font-weight="700" font-size="${fontSize}" fill="white">厨</text>
  </svg>`
}

function makeMaskableSvg(size) {
  // 满版铺色，无圆角；字号缩到 ~36% 确保字落在中心 70% 的 safe-area 圆内
  const fontSize = Math.round(size * 0.36)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${PRIMARY}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          font-family="'PingFang SC','Hiragino Sans GB','Heiti SC','Microsoft YaHei',-apple-system,sans-serif"
          font-weight="700" font-size="${fontSize}" fill="white">厨</text>
  </svg>`
}

const jobs = [
  { svg: makeRoundedSvg(192), out: 'public/icons/icon-192.png' },
  { svg: makeRoundedSvg(512), out: 'public/icons/icon-512.png' },
  { svg: makeMaskableSvg(512), out: 'public/icons/icon-512-maskable.png' },
]

for (const { svg, out } of jobs) {
  const absOut = resolve(out)
  await sharp(Buffer.from(svg)).png().toFile(absOut)
  console.log(`✓ ${absOut}`)
}
