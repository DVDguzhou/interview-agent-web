'use client'

import { createContext, useContext, useEffect, type ReactNode, type RefObject } from 'react'
import { Sidebar } from './Sidebar'
import { LoginPage } from './LoginPage'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuthStore } from '../store/authStore'
import type { WSClient } from '../api/ws'

const WSContext = createContext<RefObject<WSClient | null> | null>(null)

export function useWS() {
  const ref = useContext(WSContext)
  if (!ref) throw new Error('useWS must be used within AppShell')
  return ref
}

/** 全局外壳：登录态守卫 + 跨页面复用的 WebSocket 连接 + 侧边栏 */
export function AppShell({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const wsRef = useWebSocket()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) {
    return <div className="h-screen bg-white" />
  }

  if (!token) {
    return <LoginPage />
  }

  return (
    <WSContext.Provider value={wsRef}>
      <div className="flex h-screen bg-white">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </WSContext.Provider>
  )
}
