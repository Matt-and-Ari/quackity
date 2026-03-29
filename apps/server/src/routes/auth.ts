import { Elysia } from "elysia";

import { adminDB } from "../db";
import { authPlugin, requireAuth } from "../plugins/auth";

export const authRoutes = new Elysia()
  .use(authPlugin)
  .get("/auth-send-magic-code", async ({ request, set }) => {
    const email = new URL(request.url).searchParams.get("email");

    if (!email) {
      set.status = 400;

      return {
        error: "Email is required",
      };
    }

    await adminDB.auth.sendMagicCode(email);

    return {
      ok: true,
    };
  })
  .get("/auth-verify-magic-code", async ({ request, set }) => {
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");
    const code = searchParams.get("code");

    if (!email || !code) {
      set.status = 400;

      return {
        error: "Email and code are required",
      };
    }

    try {
      const { created, user } = await adminDB.auth.checkMagicCode(email, code);

      return {
        created,
        token: user.refresh_token,
        user: {
          email: user.email,
          id: user.id,
          isGuest: user.isGuest,
        },
      };
    } catch {
      set.status = 401;

      return {
        error: "Invalid magic code",
      };
    }
  })
  .get("/auth/me", ({ authUser, set }) => {
    const unauthorized = requireAuth(authUser, set);

    if (unauthorized) {
      return unauthorized;
    }

    return {
      user: authUser,
    };
  });
