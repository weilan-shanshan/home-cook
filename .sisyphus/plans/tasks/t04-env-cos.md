# Task 04 — 环境变量校验 + COS 预签名工具

> **Wave**: 1 | **可并行**: 与 T01、T02、T03 同时开始 | **预估**: 15 分钟
>
> **依赖**: T01（需要 backend 依赖已安装）
>
> **后续任务等我完成**: T09（图片上传路由）、T24（备份脚本）

---

## 🔴 人工信息检查点

> **执行到 COS 功能验证时需要暂停！**
>
> 当你写完代码、需要测试 COS 预签名 URL 是否可用时：
>
> ```
> ⏸️ 需要人工提供以下信息才能继续测试：
>
> 1. COS_SECRET_ID = ?
> 2. COS_SECRET_KEY = ?  
> 3. COS_BUCKET = ?（存储桶名称，如 private-chef-1234567890）
> 4. COS_REGION = ?（如 ap-guangzhou、ap-shanghai）
>
> 请在腾讯云控制台 → 对象存储 → 密钥管理 中获取。
> 如果还没开通 COS，请先完成技术方案 13.1 节 #5 步骤。
>
> 拿到后请粘贴给我，我会写入 backend/.env 继续测试。
> ```
>
> **如果暂时没有 COS 信息**：代码可以先写完，类型检查通过即可，跳过实际调用测试。

---

## 目标

创建 `backend/src/lib/env.ts`（Zod 环境变量校验）和 `backend/src/lib/cos.ts`（腾讯云 COS 预签名 URL 生成）。

## 具体步骤

### 1. 创建 `backend/src/lib/env.ts`

用 Zod 校验所有环境变量：

```typescript
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_PATH: z.string().default('./data/private-chef.db'),
  SESSION_SECRET: z.string().min(16),

  // 腾讯云 COS
  COS_SECRET_ID: z.string().min(1),
  COS_SECRET_KEY: z.string().min(1),
  COS_BUCKET: z.string().min(1),
  COS_REGION: z.string().default('ap-guangzhou'),

  // 企业微信
  WECHAT_WEBHOOK_URL: z.string().url(),

  // CORS
  FRONTEND_ORIGIN: z.string().url(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
```

> 启动时若缺少必填项，Zod 会抛出清晰的 `ZodError`，列出缺失字段。

### 2. 创建 `backend/src/lib/cos.ts`

```typescript
import COS from 'cos-nodejs-sdk-v5'
import { env } from './env'
import { randomUUID } from 'crypto'

const cos = new COS({
  SecretId: env.COS_SECRET_ID,
  SecretKey: env.COS_SECRET_KEY,
})

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<{ url: string; key: string }> {
  const ext = filename.split('.').pop() || 'jpg'
  const key = `recipes/${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`

  const url = await new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: env.COS_BUCKET,
        Region: env.COS_REGION,
        Key: key,
        Method: 'PUT',
        Sign: true,
        Expires: 900, // 15 分钟
        Headers: { 'Content-Type': contentType },
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data.Url)
      }
    )
  })

  return { url, key }
}
```

## 验收标准

- [ ] `backend/src/lib/env.ts` 导出类型安全的 `env` 对象
- [ ] 缺少必填变量时抛出明确错误（列出缺失字段名）
- [ ] `backend/src/lib/cos.ts` 导出 `getPresignedUploadUrl(filename, contentType)`
- [ ] 返回值包含 `{ url, key }`
- [ ] `cd backend && npx tsc --noEmit` 类型检查通过
- [ ] 代码中**零硬编码密钥**

## 禁止事项

- 不硬编码任何密钥
- 不给密钥类变量设默认值（必须从 .env 读取）
