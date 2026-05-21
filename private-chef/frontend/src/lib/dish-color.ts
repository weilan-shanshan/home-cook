const DISH_PALETTE = [
  { bg: 'bg-brand-300', text: 'text-brand-700' },     /* 浅 sage */
  { bg: 'bg-brand-200', text: 'text-brand-700' },     /* 浅薄荷绿 */
  { bg: 'bg-honey-300', text: 'text-honey-700' },     /* 蜂蜜 */
  { bg: 'bg-blush-300', text: 'text-blush-700' },     /* 杏粉 */
  { bg: 'bg-sky-300', text: 'text-sky-700' },         /* 冰薄荷 */
  { bg: 'bg-butter-300', text: 'text-butter-700' },   /* 奶油 */
] as const

export function dishColor(seed: string | number | undefined | null) {
  const key = String(seed ?? '')
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return DISH_PALETTE[Math.abs(h) % DISH_PALETTE.length]
}
