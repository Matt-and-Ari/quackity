import { usePreferences } from "../../hooks/usePreferences";
import type { TypingPeer } from "../../hooks/useTypingIndicator";

interface TypingIndicatorProps {
  activeTypers: TypingPeer[];
}

export function TypingIndicator(props: TypingIndicatorProps) {
  const { prefs } = usePreferences();

  if (!prefs.showTypingIndicators || props.activeTypers.length === 0) {
    return <div className="h-5" />;
  }

  const names = props.activeTypers.map((t) => t.displayName);

  return (
    <div className="flex h-5 items-center gap-1.5 px-1">
      <TypingDots />
      <span className="truncate text-xs text-slate-500">
        <span className="font-medium text-slate-600">
          {names.length === 1
            ? names[0]
            : names.length === 2
              ? `${names[0]} and ${names[1]}`
              : `${names[0]} and ${names.length - 1} others`}
        </span>{" "}
        {names.length === 1 ? "is" : "are"} typing
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden>
      <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_infinite] rounded-full bg-slate-400" />
      <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-slate-400" />
      <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-slate-400" />
    </span>
  );
}
