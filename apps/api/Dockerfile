# Build từ thư mục gốc repo: docker build -f apps/api/Dockerfile .
FROM node:24-bookworm-slim AS base
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @pt/api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @pt/shared build \
  && pnpm --filter @pt/api exec prisma generate \
  && pnpm --filter @pt/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
USER node
EXPOSE 4000
# Áp migration (không xóa dữ liệu) rồi chạy API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
