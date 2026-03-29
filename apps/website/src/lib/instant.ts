import { init } from "@instantdb/react";
import { schema } from "@quack/schema";

const appId = import.meta.env.VITE_INSTANT_APP_ID;

if (!appId) {
  throw new Error("Missing VITE_INSTANT_APP_ID");
}

export const instantDB = init({
  appId,
  schema,
});
