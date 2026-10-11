'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { href: '/', label: '对话 / 模拟面试' },
  { href: '/history', label: '历史评估报告' },
]

export function Sidebar() {
  const clearMessages = useChatStore((s) => s.clearMessages)
  const connected = useChatStore((s) => s.connected)
  const isInterviewing = useChatStore((s) => s.isInterviewing)
  const username = useAuthStore((s) => s.username)
  const logout = useAuthStore((s) => s.logout)
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">InterviewAgent</h1>
        <p className="text-xs text-gray-400 mt-1">AI 模拟面试系统</p>
      </div>

      <div className="p-3">
        <button
          onClick={() => {
            clearMessages()
            router.push('/')
          }}
          disabled={isInterviewing}
          className="w-full py-2 px-4 border border-gray-600 rounded-lg text-sm hover:bg-gray-800 transition disabled:opacity-40"
        >
          + 新建对话
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm transition ${
              pathname === item.href ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400">{connected ? '已连接' : '未连接'}</span>
        </div>
        {username && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">{username}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-400 transition"
            >
              退出
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
