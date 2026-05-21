const DISH_PALETTE = [
  { bg: 'bg-brand-300', text: 'text-white' },
  { bg: 'bg-sage-200', text: 'text-sage-700' },
  { bg: 'bg-mustard-300', text: 'text-ink-900' },
  { bg: 'bg-rust-300', text: 'text-white' },
  { bg: 'bg-cream-300', text: 'text-ink-900' },
  { bg: 'bg-brand-100', text: 'text-brand-700' },
] as const

export function dishColor(seed: string | number | undefined | null) {
  const key = String(seed ?? '')
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return DISH_PALETTE[Math.abs(h) % DISH_PALETTE.length]
}
