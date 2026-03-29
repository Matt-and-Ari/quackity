import { treaty } from "@elysiajs/eden";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

const client = treaty(serverUrl) as Record<string, any>;

export const api = {
  me(refreshToken: string) {
    return client.auth.me.get({
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
