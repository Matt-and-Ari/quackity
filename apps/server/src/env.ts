const env = {
  instantAppId: process.env.VITE_INSTANT_APP_ID,
  instantAdminSecret: process.env.INSTANT_ADMIN_SECRET,
  port: Number(process.env.PORT ?? 3001),
} as const;

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const serverEnv = {
  instantAppId: required("VITE_INSTANT_APP_ID", env.instantAppId),
  instantAdminSecret: required("INSTANT_ADMIN_SECRET", env.instantAdminSecret),
  port: Number.isFinite(env.port) ? env.port : 3001,
} as const;
