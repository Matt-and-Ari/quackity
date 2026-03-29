import {
  ChannelCallMeeting,
  ChannelCallPrejoin,
  useChannelCall as useSharedChannelCall,
} from "@quack/calls";
import { useCallback, useState } from "react";
import clsx from "clsx";

type CallModalPhase = "idle" | "prejoin" | "joining" | "active";

interface UseChannelCallOptions {
  channelId: string;
  displayName?: string;
  refreshToken?: string;
  serverUrl: string;
}

export function useChannelCall(options: UseChannelCallOptions) {
  const shared = useSharedChannelCall(options);
  const [phase, setPhase] = useState<CallModalPhase>("idle");

  const join = useCallback(async () => {
    setPhase("joining");
    const nextSession = await shared.join();

    if (!nextSession) {
      setPhase("prejoin");
      return null;
    }

    setPhase("prejoin");
    return nextSession;
  }, [shared]);

  const openPrejoin = useCallback(() => {
    void join();
  }, [join]);

  const leave = useCallback(async () => {
    await shared.leave();
    setPhase("idle");
  }, [shared]);

  const dismiss = useCallback(() => {
    setPhase("idle");
    void shared.leave();
  }, [shared]);

  return {
    dismiss,
    error: shared.error,
    isInCall: shared.isInCall,
    isModalOpen: phase !== "idle",
    join,
    leave,
    meeting: shared.meeting,
    openPrejoin,
    phase,
    session: shared.session,
  };
}

/* ── Fullscreen Call Modal ── */

interface CallModalProps {
  error: string | null;
  meeting: React.ComponentProps<typeof ChannelCallMeeting>["meeting"];
  onDismiss: () => void;
  phase: CallModalPhase;
}

export function CallModal(props: CallModalProps) {
  if (props.phase === "idle") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-md">
      <div
        className={clsx(
          "relative overflow-hidden rounded-3xl border border-amber-200/30 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.18)]",
          props.meeting ? "h-[min(88vh,52rem)] w-[min(94vw,72rem)]" : "w-full max-w-md",
        )}
      >
        <button
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-xl bg-white/80 text-slate-400 shadow-sm transition-colors duration-100 hover:bg-white hover:text-slate-600"
          onClick={props.onDismiss}
          type="button"
        >
          <CloseIcon />
        </button>

        {props.meeting ? (
          <ChannelCallPrejoin meeting={props.meeting} />
        ) : (
          <div className="flex min-h-56 w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="size-7 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
            <p className="text-sm font-medium text-slate-700">
              {props.phase === "joining" ? "Preparing call controls..." : "Opening call..."}
            </p>
            {props.error ? <p className="max-w-sm text-sm text-rose-600">{props.error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Icons ── */

function CloseIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
