import { getSignedReadUrl } from './cos.js'

export async function resolveImageUrls(
  url: string | null,
  thumbUrl: string | null,
): Promise<{ url: string; thumbUrl: string | null } | null> {
  if (!url) {
    return null
  }

  const [resolvedUrl, resolvedThumbUrl] = await Promise.all([
    getSignedReadUrl(url),
    thumbUrl ? getSignedReadUrl(thumbUrl) : Promise.resolve(null),
  ])

  return {
    url: resolvedUrl,
    thumbUrl: resolvedThumbUrl,
  }
}
