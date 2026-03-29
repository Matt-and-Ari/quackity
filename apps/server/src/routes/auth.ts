import { Elysia } from "elysia";

import { authPlugin, requireAuth } from "../plugins/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .get("/me", ({ authUser, set }) => {
    const unauthorized = requireAuth(authUser, set);

    if (unauthorized) {
      return unauthorized;
    }

    return {
      user: authUser,
    };
  });
