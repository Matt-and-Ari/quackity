type RuntimeEnvKey = "VITE_INSTANT_APP_ID" | "VITE_SERVER_URL";

declare global {
  interface Window {
    __ENV__?: Partial<Record<RuntimeEnvKey, string | undefined>>;
  }
}

function getWindowEnv(name: RuntimeEnvKey) {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__ENV__?.[name];
}

export function getRuntimeEnv(name: RuntimeEnvKey) {
  return getWindowEnv(name) ?? (import.meta.env[name] as string | undefined);
}
