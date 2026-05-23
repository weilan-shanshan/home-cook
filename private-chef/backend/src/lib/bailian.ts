import { env } from './env.js'

// 阿里云百炼 (DashScope) OpenAI 兼容接口
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  model?: string
  responseFormat?: 'text' | 'json_object'
  temperature?: number
}

export interface ChatCompletionResult {
  content: string
  raw: unknown
}

export class BailianError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'BailianError'
    this.status = status
  }
}

export async function chatComplete(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  if (!env.BAILIAN_API_KEY) {
    throw new BailianError('BAILIAN_API_KEY is not configured', 503)
  }

  const body: Record<string, unknown> = {
    model: options.model ?? env.BAILIAN_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.4,
  }
  if (options.responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.BAILIAN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new BailianError(
      `Bailian request failed (${res.status}): ${text.slice(0, 300)}`,
      res.status,
    )
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json?.choices?.[0]?.message?.content ?? ''
  return { content, raw: json }
}
