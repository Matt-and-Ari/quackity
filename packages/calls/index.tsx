import { RealtimeKitProvider, useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { useCallback, useState } from "react";

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

  const join = useCallback(async () => {
    if (!options.channelId || !options.refreshToken) {
      setError("A channel id and refresh token are required to join.");
      return null;
    }

    setError(null);
    setIsJoining(true);

    try {
      const nextSession = await joinChannelCall({
        channelId: options.channelId,
        displayName: options.displayName,
        refreshToken: options.refreshToken,
        serverUrl: options.serverUrl,
      });

      await initMeeting({
        authToken: nextSession.token,
        defaults: {
          audio: true,
          video: true,
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
  ]);

  const leave = useCallback(async () => {
    const activeMeeting = meeting as MeetingLifecycle | null;

    await activeMeeting?.leave?.();
    await activeMeeting?.leaveRoom?.();
    await activeMeeting?.destroy?.();

    setSession(null);
    setError(null);
  }, [meeting]);

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

export function ChannelCallMeeting(props: { meeting: ReturnType<typeof useRealtimeKitClient>[0] }) {
  if (!props.meeting) {
    return null;
  }

  return (
    <RealtimeKitProvider value={props.meeting}>
      <RtkMeeting meeting={props.meeting} mode="fill" showSetupScreen />
    </RealtimeKitProvider>
  );
}
