import { RealtimeKitProvider, useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { useCallback, useRef, useState, type CSSProperties } from "react";

export type ChannelCallSession = {
  channelId: string;
  meetingId: string;
  participantId: string;
  presetName: string;
  token: string;
};

type JoinChannelCallInput = {
  channelId: string;
  displayName?: string;
  refreshToken: string;
  serverUrl: string;
};

type UseChannelCallOptions = {
  channelId: string;
  displayName?: string;
  refreshToken?: string;
  serverUrl: string;
};

type MeetingLifecycle = {
  destroy?: () => Promise<unknown> | unknown;
  leave?: () => Promise<unknown> | unknown;
  leaveRoom?: () => Promise<unknown> | unknown;
};

const channelCallThemeStyle: CSSProperties = {
  "--rtk-font-family":
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as CSSProperties;

function normalizeServerUrl(serverUrl: string) {
  return serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to join the channel call.";
}

export async function joinChannelCall(input: JoinChannelCallInput) {
  const response = await fetch(
    `${normalizeServerUrl(input.serverUrl)}/channels/${input.channelId}/call/join`,
    {
      headers: {
        Authorization: `Bearer ${input.refreshToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    channelId?: string;
    error?: string;
    meetingId?: string;
    participantId?: string;
    presetName?: string;
    token?: string;
  } | null;

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error ?? "Unable to join the channel call.");
  }

  if (
    !payload?.channelId ||
    !payload.meetingId ||
    !payload.participantId ||
    !payload.presetName ||
    !payload.token
  ) {
    throw new Error("The channel call response was incomplete.");
  }

  return payload as ChannelCallSession;
}

export function useChannelCall(options: UseChannelCallOptions) {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [session, setSession] = useState<ChannelCallSession | null>(null);
  const cleanupPromiseRef = useRef<Promise<void> | null>(null);

  const cleanupMeeting = useCallback(async (activeMeeting: MeetingLifecycle | null) => {
    await activeMeeting?.leave?.();
    await activeMeeting?.leaveRoom?.();
    await activeMeeting?.destroy?.();
  }, []);

  const leave = useCallback(async () => {
    const runningCleanup = cleanupPromiseRef.current;

    if (runningCleanup) {
      await runningCleanup;
      return;
    }

    const activeMeeting = meeting as MeetingLifecycle | null;

    const cleanupTask = (async () => {
      try {
        await cleanupMeeting(activeMeeting);
      } finally {
        setSession(null);
        setError(null);
        cleanupPromiseRef.current = null;
      }
    })();

    cleanupPromiseRef.current = cleanupTask;
    await cleanupTask;
  }, [cleanupMeeting, meeting]);

  const join = useCallback(async () => {
    if (!options.channelId || !options.refreshToken) {
      setError("A channel id and refresh token are required to join.");
      return null;
    }

    setError(null);
    setIsJoining(true);

    try {
      await leave();

      const nextSession = await joinChannelCall({
        channelId: options.channelId,
        displayName: options.displayName,
        refreshToken: options.refreshToken,
        serverUrl: options.serverUrl,
      });

      await initMeeting({
        authToken: nextSession.token,
        defaults: {
          // Let the setup screen own device opt-in; eager media startup is flaky on mobile web.
          audio: false,
          video: false,
        },
      });

      setSession(nextSession);

      return nextSession;
    } catch (joinError) {
      setError(getErrorMessage(joinError));
      return null;
    } finally {
      setIsJoining(false);
    }
  }, [
    initMeeting,
    options.channelId,
    options.displayName,
    options.refreshToken,
    options.serverUrl,
    leave,
  ]);

  return {
    error,
    isInCall: session !== null,
    isJoining,
    join,
    leave,
    meeting,
    session,
  };
}

export function ChannelCallMeeting(props: {
  meeting: ReturnType<typeof useRealtimeKitClient>[0];
  showSetupScreen?: boolean;
}) {
  if (!props.meeting) {
    return null;
  }

  return (
    <div className="size-full" style={channelCallThemeStyle}>
      <RealtimeKitProvider value={props.meeting}>
        <RtkMeeting meeting={props.meeting} mode="fill" showSetupScreen={props.showSetupScreen} />
      </RealtimeKitProvider>
    </div>
  );
}

export function ChannelCallPrejoin(props: { meeting: ReturnType<typeof useRealtimeKitClient>[0] }) {
  return <ChannelCallMeeting meeting={props.meeting} showSetupScreen />;
}
