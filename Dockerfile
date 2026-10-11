# 国内网络可传 --build-arg BASE_REGISTRY=docker.m.daocloud.io/library/
ARG BASE_REGISTRY=
# ---- Build ----
FROM ${BASE_REGISTRY}node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# rewrites 在构建期固化；生产环境 /api 通常已由 Nginx 直接转发到后端，这里只作兜底
ARG BACKEND_URL=http://backend:9090
ENV BACKEND_URL=$BACKEND_URL
# 生产环境 WebSocket 走同源 /ws（由 Nginx 反代），不注入 NEXT_PUBLIC_WS_URL
RUN rm -f .env.development && npm run build

# ---- Runtime（Next standalone 输出，镜像只含运行所需文件） ----
FROM ${BASE_REGISTRY}node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
