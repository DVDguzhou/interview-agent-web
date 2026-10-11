import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppShell } from '../components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'InterviewAgent · AI 模拟面试',
  description: 'AI 模拟面试平台：简历解析、智能出题、实时面试、评估报告',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
