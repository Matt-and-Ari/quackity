import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import clsx from "clsx";

export interface EmojiSuggestionItem {
  emoji: string;
  id: string;
  name: string;
}

interface EmojiSuggestionListProps {
  command: (item: { id: string; emoji: string }) => void;
  items: EmojiSuggestionItem[];
}

export const EmojiSuggestionList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  EmojiSuggestionListProps
>(function EmojiSuggestionList(props, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown(keyProps: { event: KeyboardEvent }) {
      const { event } = keyProps;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const item = props.items[selectedIndex];
        if (item) {
          props.command({ id: item.id, emoji: item.emoji });
        }
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  function selectItem(index: number) {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, emoji: item.emoji });
    }
  }

  return (
    <div className="z-50 max-h-64 w-64 overflow-y-auto rounded-xl border border-amber-200/70 bg-white py-1 shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
      {props.items.map((item, index) => (
        <button
          className={clsx(
            "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors duration-75",
            index === selectedIndex
              ? "bg-amber-50 text-slate-900"
              : "text-slate-700 hover:bg-amber-50/60",
          )}
          key={item.id}
          onClick={() => selectItem(index)}
          type="button"
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="truncate text-slate-600">:{item.id}:</span>
        </button>
      ))}
    </div>
  );
});
