import { Notice } from "../../../components/ui/FormFields";
import { HoverTooltip } from "../../../components/ui/HoverTooltip";
import { CallGlyph, HamburgerGlyph, HangUpGlyph, KebabGlyph } from "./WorkspaceGlyphs";

interface ChannelHeaderProps {
  callError: string | null;
  canManageChannels: boolean;
  channelId: string | undefined;
  channelName: string;
  channelTopic: string | undefined;
  errorMessage: string | null | undefined;
  hasRefreshToken: boolean;
  isDm?: boolean;
  isInCall: boolean;
  isMobile: boolean;
  notice: string | null;
  onEditChannel: () => void;
  onLeaveCall: () => void;
  onOpenPrejoin: () => void;
  onOpenSidebar: () => void;
}

export function ChannelHeader(props: ChannelHeaderProps) {
  return (
    <header className="select-none border-b border-amber-100/70 px-3 py-2.5 sm:px-5 sm:py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {props.isMobile ? (
            <button
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-700"
              onClick={props.onOpenSidebar}
              type="button"
            >
              <HamburgerGlyph />
            </button>
          ) : null}
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="shrink-0 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {props.channelName}
            </h2>
            {props.channelTopic && !props.isMobile ? (
              <p className="min-w-0 truncate text-sm text-slate-400">{props.channelTopic}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {props.isInCall ? (
            <HoverTooltip content="Leave call" side="bottom">
              <button
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition-colors duration-100 hover:bg-rose-50"
                onClick={props.onLeaveCall}
                type="button"
              >
                <HangUpGlyph />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </HoverTooltip>
          ) : (
            <HoverTooltip content="Start a call" side="bottom">
              <button
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-100 hover:bg-amber-50 hover:text-amber-700"
                disabled={!props.channelId || !props.hasRefreshToken}
                onClick={props.onOpenPrejoin}
                type="button"
              >
                <CallGlyph />
                <span className="hidden sm:inline">Call</span>
              </button>
            </HoverTooltip>
          )}
          {props.canManageChannels && props.channelId && !props.isDm ? (
            <HoverTooltip content="Channel settings" side="bottom">
              <button
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-600"
                onClick={props.onEditChannel}
                type="button"
              >
                <KebabGlyph />
              </button>
            </HoverTooltip>
          ) : null}
        </div>
      </div>

      {props.callError ? (
        <div className="mt-2">
          <Notice message={props.callError} tone="error" />
        </div>
      ) : null}
      {props.notice ? (
        <div className="mt-2">
          <Notice message={props.notice} tone="error" />
        </div>
      ) : null}
      {props.errorMessage ? (
        <div className="mt-2">
          <Notice message={props.errorMessage} tone="error" />
        </div>
      ) : null}
    </header>
  );
}
