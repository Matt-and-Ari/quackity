import { Elysia, t } from "elysia";

import { sendInviteEmail } from "../lib/email";
import { authPlugin, requireAuth } from "../plugins/auth";

export const inviteRoutes = new Elysia().use(authPlugin).post(
  "/invites/send-emails",
  async ({ authUser, body, set }) => {
    const unauthorized = requireAuth(authUser, set);

    if (unauthorized || !authUser) {
      return unauthorized ?? { error: "Unauthorized" };
    }

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
