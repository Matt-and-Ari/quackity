import { Elysia, t } from "elysia";

import { sendInviteEmail } from "../lib/email";
import { authPlugin, requireAuth } from "../plugins/auth";

export const inviteRoutes = new Elysia().use(authPlugin).post(
  "/invites/send-emails",
  async ({ authUser, body, set }) => {
    console.log("[invites/send-emails] Received request", {
      emails: body.emails,
      inviterName: body.inviterName,
      inviteUrl: body.inviteUrl,
      workspaceName: body.workspaceName,
      hasAuthUser: Boolean(authUser),
    });

    const unauthorized = requireAuth(authUser, set);

    if (unauthorized || !authUser) {
      console.warn("[invites/send-emails] Unauthorized request");
      return unauthorized ?? { error: "Unauthorized" };
    }

    console.log("[invites/send-emails] Auth passed, sending emails to:", body.emails);

    const results = await Promise.allSettled(
      body.emails.map((email) =>
        sendInviteEmail({
          inviterName: body.inviterName,
          inviteUrl: body.inviteUrl,
          recipientEmail: email,
          workspaceName: body.workspaceName,
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;

    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        console.error(`[invites/send-emails] Failed to send to ${body.emails[i]}:`, result.reason);
      } else {
        console.log(`[invites/send-emails] Sent to ${body.emails[i]}:`, result.value);
      }
    }

    console.log(
      `[invites/send-emails] Done: ${body.emails.length - failed} sent, ${failed} failed`,
    );

    return { ok: true, sent: body.emails.length - failed, failed };
  },
  {
    body: t.Object({
      emails: t.Array(t.String(), { minItems: 1 }),
      inviterName: t.String(),
      inviteUrl: t.String(),
      workspaceName: t.String(),
    }),
  },
);
