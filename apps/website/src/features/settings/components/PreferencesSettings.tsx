import clsx from "clsx";

import { usePreferences } from "../../../hooks/usePreferences";

export function PreferencesSettings() {
  const { prefs, update } = usePreferences();

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold text-slate-900">Preferences</h3>
      <p className="mt-1 text-sm text-slate-500">
        Customize how Quackity looks and behaves for you.
      </p>

      <div className="mt-8 space-y-8">
        <PreferenceSection
          description="Control how you're notified about new messages and mentions."
          title="Notifications"
        >
          <ToggleRow
            description="Play a sound when you receive a mention or direct message."
            label="Sound effects"
            onChange={(v) => update("soundEffects", v)}
            value={prefs.soundEffects}
          />
          <ToggleRow
            description="Show browser notifications for mentions and DMs."
            label="Desktop notifications"
            onChange={(v) => update("desktopNotifications", v)}
            value={prefs.desktopNotifications}
          />
        </PreferenceSection>

        <PreferenceSection description="Adjust the chat experience to your liking." title="Chat">
          <ToggleRow
            description="Press Enter to send messages. When off, use Cmd+Enter or the send button."
            label="Enter to send"
            onChange={(v) => update("enterToSend", v)}
            value={prefs.enterToSend}
          />
          <ToggleRow
            description="See when others are typing a message in the current channel."
            label="Show typing indicators"
            onChange={(v) => update("showTypingIndicators", v)}
            value={prefs.showTypingIndicators}
          />
        </PreferenceSection>
      </div>
    </div>
  );
}

interface PreferenceSectionProps {
  children: React.ReactNode;
  description: string;
  title: string;
}

function PreferenceSection(props: PreferenceSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-800">{props.title}</h4>
      <p className="mt-0.5 text-xs text-slate-400">{props.description}</p>
      <div className="mt-4 divide-y divide-amber-100/60 rounded-xl border border-amber-200/50 bg-amber-50/30">
        {props.children}
      </div>
    </div>
  );
}

interface ToggleRowProps {
  description: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}

function ToggleRow(props: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{props.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{props.description}</p>
      </div>
      <button
        aria-checked={props.value}
        className={clsx(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-150",
          props.value ? "bg-amber-500" : "bg-slate-200",
        )}
        onClick={() => props.onChange(!props.value)}
        role="switch"
        type="button"
      >
        <span
          className={clsx(
            "inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform duration-150",
            props.value ? "translate-x-[1.125rem]" : "translate-x-[0.1875rem]",
          )}
        />
      </button>
    </label>
  );
}
