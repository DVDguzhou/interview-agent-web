import type { ClientMessage, ServerMessage } from '../types/message'
import { wsUrl } from '../lib/config'

export class WSClient {
  private ws: WebSocket | null = null
  private onMessage: (msg: ServerMessage) => void
  private onStatusChange: (connected: boolean) => void
  private reconnectTimer: number | null = null
  private token: string | null = null

  constructor(
    onMessage: (msg: ServerMessage) => void,
    onStatusChange: (connected: boolean) => void,
  ) {
    this.onMessage = onMessage
    this.onStatusChange = onStatusChange
  }

  connect(token?: string) {
    if (token) {
      this.token = token
    }
    this.ws = new WebSocket(wsUrl(this.token))

    this.ws.onopen = () => {
      this.onStatusChange(true)
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    this.ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data)
      this.onMessage(msg)
    }

    this.ws.onclose = () => {
      this.onStatusChange(false)
      // 有 token 才自动重连（已登录状态）
      if (this.token) {
        this.reconnectTimer = window.setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  disconnect() {
    this.token = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.ws?.close()
  }
}
