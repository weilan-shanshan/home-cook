import { getSignedReadUrl } from './cos.js'

// Tencent COS 数据万象 (CI) image processing pipeline.
// Appending this to a signed object URL serves a 600×600-fit JPEG version
// without affecting URL signing (image processing params are evaluated
// independently of auth params). Used as a fallback when a recipe image was
// uploaded before the client started producing dedicated thumbnails.
const CI_THUMB_QUERY = 'imageMogr2/thumbnail/!600x600|imageMogr2/quality/80'

function appendImageProcessing(signedUrl: string, query: string): string {
  return signedUrl.includes('?') ? `${signedUrl}&${query}` : `${signedUrl}?${query}`
}

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

  // Fall back to a COS-side CI thumbnail when no dedicated thumb_url exists.
  const finalThumbUrl = resolvedThumbUrl ?? appendImageProcessing(resolvedUrl, CI_THUMB_QUERY)

  return {
    url: resolvedUrl,
    thumbUrl: finalThumbUrl,
  }
}
