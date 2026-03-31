import { useCallback, useSyncExternalStore } from "react";

export interface Preferences {
  desktopNotifications: boolean;
  enterToSend: boolean;
  showTypingIndicators: boolean;
  soundEffects: boolean;
}

const STORAGE_KEY = "quack:preferences";

const defaults: Preferences = {
  desktopNotifications: true,
  enterToSend: true,
  showTypingIndicators: true,
  soundEffects: true,
};

let cached: Preferences | null = null;
const listeners = new Set<() => void>();

function read(): Preferences {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = { ...defaults, ...JSON.parse(raw) };
    } else {
      cached = { ...defaults };
    }
  } catch {
    cached = { ...defaults };
  }
  return cached ?? defaults;
}

function write(next: Preferences) {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable
  }
  for (const fn of listeners) fn();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Preferences {
  return read();
}

export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = useCallback(function update<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    write({ ...read(), [key]: value });
  }, []);

  return { prefs, update };
}

export function getPreferences(): Preferences {
  return read();
}
