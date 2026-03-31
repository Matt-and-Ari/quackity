import { treaty } from "@elysiajs/eden";
import { getRuntimeEnv } from "./runtimeEnv";

const serverUrl = getRuntimeEnv("VITE_SERVER_URL") ?? "http://localhost:3001";

const client = treaty(serverUrl) as Record<string, any>;

export const api = {
  me(refreshToken: string) {
    return client.auth.me.get({
      headers: {
        authorization: `Bearer ${refreshToken}`,
      },
    });
  },
  sendInviteEmails(
    input: {
      emails: string[];
      inviterName: string;
      inviteUrl: string;
      workspaceName: string;
    },
    refreshToken: string,
  ) {
    return client.invites["send-emails"].post(input, {
      headers: {
        authorization: `Bearer ${refreshToken}`,
      },
    });
  },
  sendMagicCode(email: string) {
    return client["auth-send-magic-code"].get({
      query: {
        email,
      },
    });
  },
  verifyMagicCode(email: string, code: string) {
    return client["auth-verify-magic-code"].get({
      query: {
        code,
        email,
      },
    });
  },
};
