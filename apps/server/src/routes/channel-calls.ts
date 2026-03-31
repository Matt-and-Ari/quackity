import { Elysia, t } from "elysia";

import { authPlugin, requireAuth } from "../plugins/auth";
import { getWorkspaceChannelCallStatus, issueChannelCallJoinToken } from "../lib/channel-calls";
import { CloudflareRealtimeError } from "../lib/cloudflare-realtime";

export const channelCallRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/workspaces/:workspaceId/call/status",
    async ({ authUser, params, set }) => {
      const unauthorized = requireAuth(authUser, set);

      if (unauthorized || !authUser) {
        return unauthorized ?? { error: "Unauthorized" };
      }

      try {
        const result = await getWorkspaceChannelCallStatus({
          authUser,
          workspaceId: params.workspaceId,
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
          error instanceof Error && error.message
            ? error.message
            : "Unable to load channel call status";

        console.error("channel call status failed", error);

        set.status = 500;

        return {
          error: message,
        };
      }
    },
    {
      params: t.Object({
        workspaceId: t.String(),
      }),
    },
  )
  .post(
    "/channels/:channelId/call/join",
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
          error instanceof Error && error.message
            ? error.message
            : "Unable to join the channel call";

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
