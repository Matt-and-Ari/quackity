import { useEffect, useState } from "react";

const ACTIVE_CALLS_POLL_INTERVAL_MS = 10_000;

interface UseActiveCallChannelsProps {
  refreshToken?: string;
  serverUrl: string;
  workspaceId: string;
}

export function useActiveCallChannels(props: UseActiveCallChannelsProps) {
  const [activeCallChannelIds, setActiveCallChannelIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!props.refreshToken) {
      setActiveCallChannelIds(new Set());
      return;
    }

    let isDisposed = false;

    async function loadActiveCalls() {
      try {
        const response = await fetch(
          `${props.serverUrl}/workspaces/${props.workspaceId}/call/status`,
          {
            headers: {
              Authorization: `Bearer ${props.refreshToken}`,
            },
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          channels?: Record<string, number>;
          error?: string;
        } | null;

        if (!response.ok || payload?.error || !payload?.channels) {
          return;
        }

        if (isDisposed) {
          return;
        }

        setActiveCallChannelIds(new Set(Object.keys(payload.channels)));
      } catch {
        // Preserve the previous poll result if the status request fails.
      }
    }

    void loadActiveCalls();

    const intervalId = window.setInterval(() => {
      void loadActiveCalls();
    }, ACTIVE_CALLS_POLL_INTERVAL_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [props.refreshToken, props.serverUrl, props.workspaceId]);

  return activeCallChannelIds;
}
