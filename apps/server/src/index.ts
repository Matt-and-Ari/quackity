import { Elysia } from "elysia";

import { serverEnv } from "./env";
import { authPlugin } from "./plugins/auth";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";

export const app = new Elysia()
  .use(authPlugin)
  .use(healthRoutes)
  .use(authRoutes)
  .get("/", () => ({
    name: "quack-server",
    ok: true,
  }))
  .listen(serverEnv.port);

console.log(`quack server listening on http://localhost:${app.server?.port}`);
