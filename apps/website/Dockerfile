FROM node:22-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter website build


FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN npm install --global serve

COPY --from=build /app/apps/website/dist ./dist
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -eu' \
  '' \
  "node <<'EOF'" \
  'const fs = require("node:fs");' \
  '' \
  'const env = {' \
  '  VITE_INSTANT_APP_ID: process.env.VITE_INSTANT_APP_ID,' \
  '  VITE_SERVER_URL: process.env.VITE_SERVER_URL,' \
  '};' \
  '' \
  'fs.writeFileSync("/app/dist/env.js", `window.__ENV__ = ${JSON.stringify(env, null, 2)};\n`);' \
  'EOF' \
  '' \
  'exec serve -s /app/dist -l "${PORT:-3000}"' \
  > /usr/local/bin/website-entrypoint \
  && chmod +x /usr/local/bin/website-entrypoint

EXPOSE 3000

CMD ["/usr/local/bin/website-entrypoint"]
