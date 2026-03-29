import { RealtimeKitProvider, useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import {
  RtkSimpleGrid,
  RtkControlbar,
  RtkParticipantsAudio,
} from "@cloudflare/realtimekit-react-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

export type ChannelCallSession = {
  channelId: string;
  meetingId: string;
  participantId: string;
  presetName: string;
  token: string;
};

type CallModalPhase = "idle" | "prejoin" | "joining" | "active";

interface JoinChannelCallInput {
  channelId: string;
  displayName?: string;
  refreshToken: string;
  serverUrl: string;
}

interface UseChannelCallOptions {
  channelId: string;
  displayName?: string;
  refreshToken?: string;
  serverUrl: string;
}

interface MeetingLifecycle {
  destroy?: () => Promise<unknown> | unknown;
  leave?: () => Promise<unknown> | unknown;
  leaveRoom?: () => Promise<unknown> | unknown;
}

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
  const [phase, setPhase] = useState<CallModalPhase>("idle");
  const [session, setSession] = useState<ChannelCallSession | null>(null);

  const openPrejoin = useCallback(() => {
    setError(null);
    setPhase("prejoin");
  }, []);

  const join = useCallback(async () => {
    if (!options.channelId || !options.refreshToken) {
      setError("A channel id and refresh token are required to join.");
      return null;
    }

    setError(null);
    setPhase("joining");

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
      setPhase("active");

      return nextSession;
    } catch (joinError) {
      setError(getErrorMessage(joinError));
      setPhase("prejoin");
      return null;
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
    setPhase("idle");
  }, [meeting]);

  const dismiss = useCallback(() => {
    if (phase === "prejoin") {
      setPhase("idle");
      setError(null);
    }
  }, [phase]);

  return {
    dismiss,
    error,
    isInCall: session !== null,
    isModalOpen: phase !== "idle",
    join,
    leave,
    meeting,
    openPrejoin,
    phase,
    session,
  };
}

/* ── Fullscreen Call Modal ── */

interface CallModalProps {
  channelName: string;
  displayName: string;
  error: string | null;
  meeting: ReturnType<typeof useRealtimeKitClient>[0];
  onDismiss: () => void;
  onJoin: () => void;
  onLeave: () => void;
  phase: CallModalPhase;
}

export function CallModal(props: CallModalProps) {
  if (props.phase === "idle") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
      <div
        className={clsx(
          "relative flex flex-col overflow-hidden rounded-3xl border border-amber-200/30 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.18)]",
          props.phase === "active"
            ? "h-[100dvh] w-screen sm:h-[calc(100vh-3rem)] sm:w-[calc(100vw-3rem)]"
            : "mx-4 w-full max-w-lg",
        )}
      >
        {props.phase === "active" && props.meeting ? (
          <ActiveCallView
            channelName={props.channelName}
            meeting={props.meeting}
            onLeave={props.onLeave}
          />
        ) : (
          <PrejoinView
            channelName={props.channelName}
            displayName={props.displayName}
            error={props.error}
            isJoining={props.phase === "joining"}
            onCancel={props.onDismiss}
            onJoin={props.onJoin}
          />
        )}
      </div>
    </div>
  );
}

/* ── Pre-join Screen ── */

function PrejoinView(props: {
  channelName: string;
  displayName: string;
  error: string | null;
  isJoining: boolean;
  onCancel: () => void;
  onJoin: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasCameraAccess(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setHasCameraAccess(false);
      }
    }

    void startPreview();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((t) => {
      t.enabled = camEnabled;
    });
  }, [camEnabled]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm">
            <CallIcon className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Join call</p>
            <p className="text-xs text-slate-400">#{props.channelName}</p>
          </div>
        </div>
        <button
          className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-600"
          onClick={props.onCancel}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Camera Preview */}
      <div className="px-6 pt-5 pb-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
          {hasCameraAccess && camEnabled ? (
            <video
              autoPlay
              className="size-full object-cover"
              muted
              playsInline
              ref={videoRef}
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2">
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-800">
                <span className="text-lg font-semibold text-slate-300">
                  {props.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {camEnabled ? "Camera unavailable" : "Camera off"}
              </p>
            </div>
          )}

          {/* Overlay controls */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-4">
            <button
              className={clsx(
                "flex size-11 items-center justify-center rounded-full border transition-colors duration-150",
                micEnabled
                  ? "border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                  : "border-rose-400/30 bg-rose-500/80 text-white hover:bg-rose-500",
              )}
              onClick={() => setMicEnabled((v) => !v)}
              type="button"
            >
              {micEnabled ? <MicIcon /> : <MicOffIcon />}
            </button>

            <button
              className={clsx(
                "flex size-11 items-center justify-center rounded-full border transition-colors duration-150",
                camEnabled
                  ? "border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                  : "border-rose-400/30 bg-rose-500/80 text-white hover:bg-rose-500",
              )}
              onClick={() => setCamEnabled((v) => !v)}
              type="button"
            >
              {camEnabled ? <CamIcon /> : <CamOffIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Join info */}
      <div className="px-6 pb-6">
        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50/60 px-4 py-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-slate-700">{props.displayName}</span>
        </div>

        {props.error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {props.error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-150",
              props.isJoining
                ? "cursor-wait bg-amber-300 text-amber-800"
                : "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
            )}
            disabled={props.isJoining}
            onClick={props.onJoin}
            type="button"
          >
            {props.isJoining ? (
              <>
                <Spinner />
                Joining...
              </>
            ) : (
              "Join call"
            )}
          </button>
          <button
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-700"
            disabled={props.isJoining}
            onClick={props.onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Active Call View ── */

function ActiveCallView(props: {
  channelName: string;
  meeting: NonNullable<ReturnType<typeof useRealtimeKitClient>[0]>;
  onLeave: () => void;
}) {
  return (
    <RealtimeKitProvider value={props.meeting}>
      <div className="flex size-full flex-col bg-slate-950">
        {/* Call header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-sm font-medium text-slate-300">#{props.channelName}</p>
          </div>
        </div>

        {/* Video grid */}
        <div className="relative min-h-0 flex-1 p-3">
          <RtkSimpleGrid
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          />
          <RtkParticipantsAudio />
        </div>

        {/* Custom control bar */}
        <div className="flex items-center justify-center gap-3 border-t border-white/5 px-5 py-4">
          <RtkControlbar
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "transparent",
              border: "none",
              padding: "0",
            }}
          />
          <button
            className="ml-3 flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-rose-600 active:bg-rose-700"
            onClick={props.onLeave}
            type="button"
          >
            <HangUpIcon />
            Leave
          </button>
        </div>
      </div>
    </RealtimeKitProvider>
  );
}

/* ── Icons ── */

function CallIcon(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M5.4 2.8A1.2 1.2 0 0 1 6.6 2h2.8a1.2 1.2 0 0 1 1.2 1.2V3a.8.8 0 0 1-.8.8H6.2a.8.8 0 0 1-.8-.8v-.2ZM3.5 6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v6.5a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3.5 12.5V6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="m1 1 22 22M9 9v3a3 3 0 0 0 5.12 2.12L9 9ZM15 9.34V4a3 3 0 0 0-5.94-.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.5-.35 2.18M12 19v4M8 23h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CamIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M23 7l-7 5 7 5V7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        height="14"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        width="15"
        x="1"
        y="5"
      />
    </svg>
  );
}

function CamOffIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="m1 1 22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1m16.73 11.73L23 7v10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M14.5 6H16a2 2 0 0 1 2 2v1.18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function HangUpIcon() {
  return (
    <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M2 8c0-.5.8-3 6-3s6 2.5 6 3v1.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V8.5m-4 0V9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        fill="currentColor"
      />
    </svg>
  );
}
