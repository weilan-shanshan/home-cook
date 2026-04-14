import COS from 'cos-nodejs-sdk-v5'
import { randomUUID } from 'crypto'
import { env } from './env.js'

function requireCosEnv() {
  const { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION } = env
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) {
    throw new Error('COS_SECRET_ID, COS_SECRET_KEY, and COS_BUCKET must be set')
  }
  return { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION }
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string = 'image/jpeg',
): Promise<{ url: string; key: string }> {
  const cosEnv = requireCosEnv()
  const cos = new COS({
    SecretId: cosEnv.COS_SECRET_ID,
    SecretKey: cosEnv.COS_SECRET_KEY,
  })

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
