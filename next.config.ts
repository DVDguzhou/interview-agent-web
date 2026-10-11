import type { NextConfig } from 'next'

// 后端地址：开发时默认本机 9090；容器部署时通过 BACKEND_URL 指向 backend 服务
const backend = process.env.BACKEND_URL ?? 'http://localhost:9090'

const nextConfig: NextConfig = {
  output: 'standalone',
  // SSE 流式响应不能被压缩缓冲
  compress: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
}

export default nextConfig
