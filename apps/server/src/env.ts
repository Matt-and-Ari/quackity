const env = {
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareRealtimeApiToken: process.env.CLOUDFLARE_REALTIME_API_TOKEN,
  cloudflareRealtimeAppId: process.env.CLOUDFLARE_REALTIME_APP_ID,
  cloudflareRealtimePresetName: process.env.CLOUDFLARE_REALTIME_PRESET_NAME,
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
  cloudflareAccountId: env.cloudflareAccountId,
  cloudflareRealtimeApiToken: env.cloudflareRealtimeApiToken,
  cloudflareRealtimeAppId: env.cloudflareRealtimeAppId,
  cloudflareRealtimePresetName: env.cloudflareRealtimePresetName,
  instantAppId: required("VITE_INSTANT_APP_ID", env.instantAppId),
  instantAdminSecret: required("INSTANT_ADMIN_SECRET", env.instantAdminSecret),
  port: Number.isFinite(env.port) ? env.port : 3001,
} as const;

export function getCloudflareRealtimeEnv() {
  return {
    accountId: required("CLOUDFLARE_ACCOUNT_ID", serverEnv.cloudflareAccountId),
    apiToken: required("CLOUDFLARE_REALTIME_API_TOKEN", serverEnv.cloudflareRealtimeApiToken),
    appId: required("CLOUDFLARE_REALTIME_APP_ID", serverEnv.cloudflareRealtimeAppId),
    presetName: required("CLOUDFLARE_REALTIME_PRESET_NAME", serverEnv.cloudflareRealtimePresetName),
  } as const;
}
