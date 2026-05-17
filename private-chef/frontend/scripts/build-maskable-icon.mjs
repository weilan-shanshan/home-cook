import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = resolve('public/icons/icon-512.png')
const OUT = resolve('public/icons/icon-512-maskable.png')
const SIZE = 512
const SAFE_RATIO = 0.8 // 内容缩到 80%，外圈 10% padding（满足 maskable safe-area 规范）
const inner = Math.round(SIZE * SAFE_RATIO)
const pad = Math.round((SIZE - inner) / 2)

if (!existsSync(SRC)) {
  console.error(`✗ Missing source: ${SRC}`)
  console.error('  请先放置 public/icons/icon-512.png（512x512 PNG）')
  process.exit(1)
}

await sharp(SRC)
  .resize(inner, inner, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: pad,
    bottom: pad,
    left: pad,
    right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(OUT)

console.log(`✓ Generated ${OUT} (${SIZE}x${SIZE}, ${SAFE_RATIO * 100}% safe area)`)
