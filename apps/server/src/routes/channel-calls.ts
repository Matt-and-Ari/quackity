import { Elysia, t } from "elysia";

import { authPlugin, requireAuth } from "../plugins/auth";
import { issueChannelCallJoinToken } from "../lib/channel-calls";
import { CloudflareRealtimeError } from "../lib/cloudflare-realtime";

export const channelCallRoutes = new Elysia({ prefix: "/channels" }).use(authPlugin).post(
  "/:channelId/call/join",
  async ({ authUser, params, set }) => {
    const unauthorized = requireAuth(authUser, set);

    if (unauthorized || !authUser) {
      return unauthorized ?? { error: "Unauthorized" };
    }

    try {
      const result = await issueChannelCallJoinToken({
        authUser,
        channelId: params.channelId,
      });

      set.status = result.status;

      if ("error" in result) {
        return {
          error: result.error,
        };
      }

      return result;
    } catch (error) {
      if (error instanceof CloudflareRealtimeError) {
        set.status = 502;

        return {
          error: error.message,
        };
      }

      const message =
        error instanceof Error && error.message ? error.message : "Unable to join the channel call";

      console.error("channel call join failed", error);

      set.status = 500;

      return {
        error: message,
      };
    }
  },
  {
    params: t.Object({
      channelId: t.String(),
    }),
  },
);
