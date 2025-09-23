# ---- Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# lock があれば一緒にコピー（* で存在しなくてもOK）
COPY package.json package-lock.json* ./

# lock があれば npm ci、無ければ npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 残りのソース
COPY . .

# Next.js を standalone 出力（next.config.js 側で output: 'standalone' にしておく）
RUN npm run build

# ---- Run stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# standalone 本体 + 静的アセット + public をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["node", "server.js"]