import { Elysia } from "elysia";

import { adminDB, type InstantAuthUser } from "../db";

function getRefreshToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-instant-refresh-token");
}

async function verifyRefreshToken(refreshToken: string | null): Promise<InstantAuthUser | null> {
  if (!refreshToken) {
    return null;
  }

  try {
    return await adminDB.auth.verifyToken(refreshToken);
  } catch {
    return null;
  }
}

export const authPlugin = new Elysia({ name: "auth" })
  .decorate("verifyRefreshToken", verifyRefreshToken)
  .derive({ as: "scoped" }, async ({ request, verifyRefreshToken }) => {
    const refreshToken = getRefreshToken(request);
    const authUser = await verifyRefreshToken(refreshToken);

    return {
      authUser,
      refreshToken,
    };
  });

export function requireAuth(
  authUser: InstantAuthUser | null,
  set: {
    status?: number | string;
  },
) {
  if (!authUser) {
    set.status = 401;

    return {
      error: "Unauthorized",
    };
  }

  return null;
}
