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

EXPOSE 3000

CMD ["sh", "-c", "serve -s /app/dist -l ${PORT:-3000}"]
