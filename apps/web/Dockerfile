# Build từ thư mục gốc repo: docker build -f apps/web/Dockerfile .
FROM node:24-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @pt/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
# Biến NEXT_PUBLIC_* được nhúng lúc build
ARG NEXT_PUBLIC_FIREBASE_API_KEY=""
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
ARG NEXT_PUBLIC_FIREBASE_APP_ID=""
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY=""
ARG API_ORIGIN=http://api:4000
ENV NEXT_TELEMETRY_DISABLED=1 API_ORIGIN=$API_ORIGIN
RUN pnpm --filter @pt/shared build && pnpm --filter @pt/web build

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
