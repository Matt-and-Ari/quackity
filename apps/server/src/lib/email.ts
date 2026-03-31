import { Resend } from "resend";

import { serverEnv } from "../env";

const resend = serverEnv.resendApiKey ? new Resend(serverEnv.resendApiKey) : null;

console.log(
  "[email] Resend client initialized:",
  resend ? "yes" : "NO — RESEND_API_KEY is missing",
);

const FROM_ADDRESS = "Quack <noreply@invite.quackity.io>";

interface SendInviteEmailInput {
  inviterName: string;
  inviteUrl: string;
  recipientEmail: string;
  workspaceName: string;
}

export async function sendInviteEmail(input: SendInviteEmailInput) {
  console.log("[email.sendInviteEmail] Called with:", {
    recipientEmail: input.recipientEmail,
    inviterName: input.inviterName,
    workspaceName: input.workspaceName,
    inviteUrl: input.inviteUrl,
    hasResendClient: Boolean(resend),
  });

  if (!resend) {
    console.warn("[email.sendInviteEmail] Skipping — no Resend client (RESEND_API_KEY not set)");
    return;
  }

  const subject = `${input.inviterName} invited you to ${input.workspaceName} on Quackity`;

  const html = `
<div style="background-color: #fffbeb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(217, 119, 6, 0.15); box-shadow: 0 18px 50px rgba(217, 119, 6, 0.08); padding: 40px 32px; text-align: center;">
      <div style="margin: 0 auto 24px;">
        <img src="https://quackity.io/favicon.svg" alt="Quack" width="48" height="48" style="display: block; margin: 0 auto;" />
      </div>
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
        You're invited to ${escapeHtml(input.workspaceName)}
      </h1>
      <p style="margin: 0 0 28px; font-size: 15px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">${escapeHtml(input.inviterName)}</strong> invited you to join
        <strong style="color: #0f172a;">${escapeHtml(input.workspaceName)}</strong> on Quackity.
      </p>
      <div style="margin: 0 auto 28px;">
        <a href="${escapeHtml(input.inviteUrl)}"
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);">
          Accept invite
        </a>
      </div>
      <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
        This invite link will take you directly to the workspace.
      </p>
      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
        If you weren't expecting this, you can safely ignore this email.
      </p>
      <div style="border-top: 1px solid rgba(245, 158, 11, 0.12); margin: 28px 0 20px;"></div>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
        Sent to <span style="color: #94a3b8;">${escapeHtml(input.recipientEmail)}</span> by Quack
      </p>
    </div>
  </div>
</div>
  `.trim();

  console.log("[email.sendInviteEmail] Calling resend.emails.send for:", input.recipientEmail);

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    html,
    subject,
    to: input.recipientEmail,
  });

  console.log("[email.sendInviteEmail] Resend response:", JSON.stringify(result));

  if (result.error) {
    throw new Error(`Resend error (${result.error.name}): ${result.error.message}`);
  }

  return result;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
