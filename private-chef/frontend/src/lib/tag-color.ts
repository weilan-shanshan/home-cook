// Hash-based palette for tag chips. Maps each tag *name* to a stable pastel
// food-friendly color so the same tag always shows in the same tone across
// the app. Backgrounds are light enough to layer over dish photos; the text
// is the matching darker shade for contrast.

const TAG_PALETTE = [
  { bg: 'bg-honey-300',  text: 'text-honey-700',  ring: 'ring-honey-500/30'  }, /* 蜜糖黄 */
  { bg: 'bg-brand-200',  text: 'text-brand-700',  ring: 'ring-brand-500/30'  }, /* 沙绿 */
  { bg: 'bg-blush-300',  text: 'text-blush-700',  ring: 'ring-blush-500/30'  }, /* 桃粉 */
  { bg: 'bg-sky-300',    text: 'text-sky-700',    ring: 'ring-sky-500/30'    }, /* 天青 */
  { bg: 'bg-butter-300', text: 'text-butter-700', ring: 'ring-butter-500/30' }, /* 奶油 */
] as const

export type TagColor = (typeof TAG_PALETTE)[number]

export function tagColor(name: string): TagColor {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]
}
