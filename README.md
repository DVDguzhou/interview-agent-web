# InterviewAgent Web

InterviewAgent 的 Web 前端，基于 **Next.js（App Router）+ React + TypeScript + Tailwind CSS**。面试流程通过 WebSocket 与后端实时交互，日常对话通过 SSE 流式输出，历史评估报告提供可视化分析。

## 功能

- **模拟面试**：上传 / 粘贴 JD 与简历，实时展示阶段进度、逐题提问、评分卡片（命中 / 遗漏要点）、评估报告与复习计划
- **流式对话**：日常技术问答走 `POST /api/chat/stream`（SSE），逐 token 渲染；命中 Skill（快速测验 / 概念教学等）时由后端状态机返回
- **题库上传**：PDF / TXT / MD，后端解析后写入题库与向量库
- **历史评估报告**（`/history`）：综合分趋势折线图、维度雷达图（对比历史平均）、高频薄弱点统计、按评级 / 薄弱点 / 分数区间筛选、逐题点评详情

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16（App Router，standalone 输出）+ React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 通信 | WebSocket（面试）、SSE over fetch（流式对话）、REST（登录 / 历史报告） |
| 可视化 | 原生 SVG 图表组件（无额外图表依赖） |

## 本地开发

前置：Node.js 20.9+，后端已在 `localhost:9090` 启动（见后端仓库 `interview-agent-java`）。

```bash
npm install
npm run dev          # http://localhost:3000
```

- `/api/*` 由 `next.config.ts` 的 rewrites 转发到 `BACKEND_URL`（默认 `http://localhost:9090`）
- WebSocket 在开发环境直连 `NEXT_PUBLIC_WS_URL`（见 `.env.development`），生产环境走同源 `/ws`，由 Nginx 反代

## 常用命令

```bash
npm run dev         # 开发服务器
npm run build       # 生产构建（.next/standalone）
npm run start       # 运行生产构建
npm run lint        # ESLint（eslint-config-next）
npm run typecheck   # tsc --noEmit
```

## 部署

```bash
docker build -t interview-agent-web .        # 国内网络：--build-arg BASE_REGISTRY=docker.m.daocloud.io/library/
```

推荐使用后端仓库中的 `docker compose --profile app up -d`，由 Nginx 统一暴露 `/`、`/api`、`/ws`。GitHub Actions 在每次 push 时执行 lint / typecheck / build，main 分支推送镜像到 `ghcr.io/<owner>/interview-agent-web`。

## 目录结构

```
src/
├── app/
│   ├── layout.tsx            # 根布局（AppShell：登录守卫 + WebSocket + 侧边栏）
│   ├── page.tsx              # 对话 / 模拟面试
│   └── history/page.tsx      # 历史评估报告
├── components/
│   ├── AppShell.tsx  ChatWindow.tsx  MessageBubble.tsx  Sidebar.tsx  LoginPage.tsx
│   ├── StageIndicator.tsx  ScoreCard.tsx  ReportCard.tsx  ReviewPlanCard.tsx  FileUpload.tsx
│   └── history/charts.tsx    # 趋势图 / 雷达图 / 薄弱点条形图
├── api/        auth.ts · ws.ts · chatStream.ts（SSE 解析）· interviews.ts
├── hooks/      useWebSocket.ts
├── store/      authStore.ts · chatStore.ts
├── lib/        config.ts
└── types/      message.ts
```

## 致谢

本前端在开源项目「AI 模拟面试官」（作者：公众号「IT杨秀才」，[golangstar.cn](https://golangstar.cn/)）的 Web 前端基础上二次开发：迁移到 Next.js、新增 SSE 流式对话、历史评估报告可视化与容器化部署。感谢原作者的开源分享。
