import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_PATH: z.string().default('./data/private-chef.db'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),

  SESSION_SECRET: z.string().min(16).optional(),
  COS_SECRET_ID: z.string().min(1).optional(),
  COS_SECRET_KEY: z.string().min(1).optional(),
  COS_BUCKET: z.string().min(1).optional(),
  COS_REGION: z.string().default('ap-guangzhou'),
  WECHAT_WEBHOOK_URL: z.string().url().optional(),

  // 阿里云百炼 (DashScope) — 用于「心愿单 AI 帮我选」功能
  BAILIAN_API_KEY: z.string().min(1).optional(),
  BAILIAN_MODEL: z.string().default('qwen-turbo'),
  // 单家庭每自然月可调用 AI 次数
  AI_MONTHLY_QUOTA: z.coerce.number().int().positive().default(8),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
