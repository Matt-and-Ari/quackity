import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import clsx from "clsx";

export interface MentionSuggestionItem {
  displayName: string;
  id: string;
  imageUrl?: string;
}

interface MentionListProps {
  command: (item: { id: string; label: string }) => void;
  items: MentionSuggestionItem[];
}

export const MentionList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  MentionListProps
>(function MentionList(props, ref) {
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

      if (event.key === "Enter") {
        event.preventDefault();
        const item = props.items[selectedIndex];
        if (item) {
          props.command({ id: item.id, label: item.displayName });
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
      props.command({ id: item.id, label: item.displayName });
    }
  }

  return (
    <div className="z-50 max-h-64 w-56 overflow-y-auto rounded-xl border border-amber-200/70 bg-white py-1 shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
      {props.items.map((item, index) => (
        <button
          className={clsx(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-75",
            index === selectedIndex
              ? "bg-amber-50 text-slate-900"
              : "text-slate-700 hover:bg-amber-50/60",
          )}
          key={item.id}
          onClick={() => selectItem(index)}
          type="button"
        >
          {item.imageUrl ? (
            <img alt="" className="size-6 shrink-0 rounded-full object-cover" src={item.imageUrl} />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
              {item.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate font-medium">{item.displayName}</span>
        </button>
      ))}
    </div>
  );
});
