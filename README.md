# Quackity

Quackity is a real-time team chat app built on InstantDB. It combines workspace-based messaging, threads, reactions, file attachments, invite-based onboarding, and channel calls in a single product.

## Project Overview

This repository is a pnpm monorepo with three main app layers:

- `apps/website`: the main React 19 + Vite Plus + Tailwind CSS web app. This includes the landing page, magic-code sign-in flow, onboarding, workspace chat UI, settings, and channel call UX.
- `apps/server`: a Bun + Elysia API used for auth helpers and channel-call endpoints. It sends and verifies Instant magic codes, resolves the current user from a refresh token, and issues Cloudflare Realtime join tokens for calls.
- `packages/schema`: the shared InstantDB schema and permissions files.
- `packages/data`: typed Instant queries, keys, constants, and transaction helpers shared by the apps.
- `packages/calls`: shared call-related React code used by the website.

At a high level, the website reads and writes most product data directly through InstantDB for real-time sync, while the server handles the pieces that need admin credentials or third-party server-side integration.

## Tech Stack

- `pnpm` workspaces
- React 19
- Vite Plus
- Tailwind CSS 4
- InstantDB
- Bun
- Elysia
- Cloudflare RealtimeKit

## Prerequisites

Install these before running the project:

- Node.js `>= 22.12.0`
- `pnpm@10.33.0`
- Bun

If you use Corepack, this is enough to align pnpm with the repo:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

## Environment Setup

Copy the template env file:

```bash
cp .env.template .env
```

Then fill in these values in `.env`:

```bash
VITE_INSTANT_APP_ID=
VITE_SERVER_URL=http://localhost:3001
INSTANT_ADMIN_SECRET=
INSTANT_SCHEMA_FILE_PATH=packages/schema/instant.schema.ts
INSTANT_PERMS_FILE_PATH=packages/schema/instant.perms.ts
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_REALTIME_API_TOKEN=
CLOUDFLARE_REALTIME_APP_ID=
CLOUDFLARE_REALTIME_PRESET_NAME=
```

Notes:

- `VITE_INSTANT_APP_ID` is required for the website to boot.
- `INSTANT_ADMIN_SECRET` is required for the local server auth endpoints.
- `CLOUDFLARE_*` values are only needed when developing or testing channel calls.
- `VITE_SERVER_URL` should usually stay at `http://localhost:3001` for local development.

## InstantDB Setup

If you already have the Quack Instant app credentials, add them to `.env` and continue.

If you need to point this repo at a fresh Instant app:

1. Create or log into an Instant account.
2. Create an app:

```bash
npx instant-cli init-without-files --title Quack
```

3. Put the returned app id into `VITE_INSTANT_APP_ID`.
4. Put the returned admin token into `INSTANT_ADMIN_SECRET`.
5. Make sure the schema and perms file paths in `.env` point at:
   `packages/schema/instant.schema.ts` and `packages/schema/instant.perms.ts`
6. Push the local schema and permissions:

```bash
pnpm instant:push
```

If the remote Instant app already exists and you want to pull its latest schema/perms into the repo:

```bash
pnpm instant:pull
```

## Install Dependencies

```bash
pnpm install
```

## Running Locally

### Full app

Run the website and server in separate terminals:

```bash
pnpm dev
```

```bash
pnpm dev:server
```

By default:

- website: `http://localhost:5173`
- server: `http://localhost:3001`

This is the normal setup if you want to use sign-in, onboarding, invites, workspace chat, and calls.

### Website only

If you are only working on frontend UI and do not need the local API:

```bash
pnpm dev:website
```

Keep in mind that magic-code auth and call-related flows depend on the server.

### Playground

There is also a separate playground app:

```bash
pnpm dev:playground
```

## Common Commands

Run the full repo readiness check:

```bash
pnpm ready
```

Run the website dev server:

```bash
pnpm dev:website
```

Run the API server:

```bash
pnpm dev:server
```

Build everything that participates in the workspace build graph:

```bash
pnpm -r build
```

Type-check the server only:

```bash
pnpm --filter server check
```

## Monorepo Layout

```text
apps/
  website/      Main Quack web app
  server/       Local API for auth + call tokens
  playground/   Separate sandbox app

packages/
  schema/       Instant schema + permissions
  data/         Shared queries + transactions
  calls/        Shared call-related React code
  utils/        Misc package utilities
```

## Development Notes

- The root `pnpm dev` command only starts the website.
- The server is started separately with `pnpm dev:server`.
- The website loads env vars from the repo root because `apps/website/vite.config.ts` uses `envDir: "../.."`.
- Most app state is stored in InstantDB, so schema or permission changes usually live in `packages/schema`.
- If you change the Instant schema or permissions locally, run `pnpm instant:push` before testing those changes end to end.
