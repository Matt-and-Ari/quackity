import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authPlugin } from "./plugins/auth";
import { authRoutes } from "./routes/auth";
import { channelCallRoutes } from "./routes/channel-calls.ts";
import { healthRoutes } from "./routes/health";

export const app = new Elysia()
  .use(cors())
  .use(authPlugin)
  .use(healthRoutes)
  .use(authRoutes)
  .use(channelCallRoutes)
  .get("/", () => ({
    name: "quack-server",
    ok: true,
  }));

export type App = typeof app;
