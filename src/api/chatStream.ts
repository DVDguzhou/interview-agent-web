import { API_BASE, authHeaders } from '../lib/config'

export interface StreamHandlers {
  onDelta: (text: string) => void
  onDone: (full: string, source: 'llm' | 'skill') => void
  onError: (message: string) => void
}

/**
 * 解析 SSE 文本块，返回完整事件与剩余未完成的缓冲。
 * 事件以空行分隔，每行 `event:` / `data:`（多行 data 按换行拼接）。
 */
export function parseSSE(buffer: string): { events: { event: string; data: string }[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n')
  const rest = blocks.pop() ?? ''
  const events = blocks
    .map((block) => {
      let event = 'message'
      const data: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
      }
      return { event, data: data.join('\n') }
    })
    .filter((e) => e.data !== '')
  return { events, rest }
}

/** POST /api/chat/stream：用 fetch + ReadableStream 读取 SSE（EventSource 不支持 POST 与自定义 header） */
export async function streamChat(
  content: string,
  conversationId: string,
  token: string | null,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...authHeaders(token) },
      body: JSON.stringify({ content, conversation_id: conversationId }),
      signal,
    })
  } catch {
    handlers.onError('网络请求失败，请检查后端服务')
    return
  }
  if (!res.ok || !res.body) {
    handlers.onError(res.status === 401 ? '登录已失效，请重新登录' : `请求失败（${res.status}）`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSSE(buffer)
    buffer = rest
    for (const { event, data } of events) {
      const payload = JSON.parse(data)
      if (event === 'delta') handlers.onDelta(payload.content ?? '')
      else if (event === 'done') {
        finished = true
        handlers.onDone(payload.content ?? '', payload.source ?? 'llm')
      } else if (event === 'error') {
        finished = true
        handlers.onError(payload.message ?? '生成失败')
      }
    }
  }
  if (!finished) handlers.onError('连接中断')
}
