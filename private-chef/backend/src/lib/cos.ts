import COS from 'cos-nodejs-sdk-v5'
import { randomUUID } from 'crypto'
import { env } from './env.js'

const READ_URL_EXPIRES_SECONDS = 60 * 60

function requireCosEnv() {
  const { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION } = env
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) {
    throw new Error('COS_SECRET_ID, COS_SECRET_KEY, and COS_BUCKET must be set')
  }
  return { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION }
}

function createCosClient(cosEnv: ReturnType<typeof requireCosEnv>) {
  return new COS({
    SecretId: cosEnv.COS_SECRET_ID,
    SecretKey: cosEnv.COS_SECRET_KEY,
  })
}

function extractCosObjectKey(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl)
    if (!parsedUrl.hostname.endsWith('.myqcloud.com')) {
      return null
    }

    const key = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''))
    return key.length > 0 ? key : null
  } catch {
    return null
  }
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string = 'image/jpeg',
): Promise<{ url: string; key: string }> {
  const cosEnv = requireCosEnv()
  const cos = createCosClient(cosEnv)

  const ext = filename.split('.').pop() || 'jpg'
  const key = `recipes/${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`

  const url = await new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: cosEnv.COS_BUCKET,
        Region: cosEnv.COS_REGION,
        Key: key,
        Method: 'PUT',
        Sign: true,
        Expires: 900,
        Headers: { 'Content-Type': contentType },
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data.Url)
      },
    )
  })

  return { url, key }
}

export async function getSignedReadUrl(rawUrl: string): Promise<string> {
  const key = extractCosObjectKey(rawUrl)
  if (!key) {
    return rawUrl
  }

  const cosEnv = requireCosEnv()
  const cos = createCosClient(cosEnv)

  return new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: cosEnv.COS_BUCKET,
        Region: cosEnv.COS_REGION,
        Key: key,
        Method: 'GET',
        Sign: true,
        Expires: READ_URL_EXPIRES_SECONDS,
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data.Url)
      },
    )
  })
}
