FROM node:22-bookworm-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts


FROM oven/bun:1.2 AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app /app

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "src/index.ts"]
