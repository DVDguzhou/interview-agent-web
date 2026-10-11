// REST / SSE 走同源 /api（由 next.config.ts rewrites 转发到后端）
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api'

// WebSocket 不经过 Next 的 rewrites：开发时直连后端，生产由 Nginx 同源反代 /ws
export function wsUrl(token?: string | null): string {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ??
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
