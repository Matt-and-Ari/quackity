import { init } from "@instantdb/react";
import { schema } from "@quack/schema";
import { getRuntimeEnv } from "./runtimeEnv";

const appId = getRuntimeEnv("VITE_INSTANT_APP_ID");

if (!appId) {
  throw new Error("Missing VITE_INSTANT_APP_ID");
}

export const instantDB = init({
  appId,
  schema,
});
