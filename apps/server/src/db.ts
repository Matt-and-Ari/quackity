import { init } from "@instantdb/admin";
import { schema } from "@quack/schema";

import { serverEnv } from "./env";

export const adminDB = init({
  adminToken: serverEnv.instantAdminSecret,
  appId: serverEnv.instantAppId,
  schema,
});

export type AdminDB = typeof adminDB;
export type InstantAuthUser = Awaited<ReturnType<typeof adminDB.auth.verifyToken>>;
