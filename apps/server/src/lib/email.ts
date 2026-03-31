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

  const subject = `${input.inviterName} invited you to ${input.workspaceName} on Quack`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin: 0 0 8px;">
        You've been invited to ${escapeHtml(input.workspaceName)}
      </h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        <strong style="color: #334155;">${escapeHtml(input.inviterName)}</strong> invited you to join
        <strong style="color: #334155;">${escapeHtml(input.workspaceName)}</strong> on Quack.
      </p>
      <a href="${escapeHtml(input.inviteUrl)}"
         style="display: inline-block; background: #f59e0b; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
        Accept invite
      </a>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; line-height: 1.5;">
        If you weren't expecting this invite, you can safely ignore this email.
      </p>
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
