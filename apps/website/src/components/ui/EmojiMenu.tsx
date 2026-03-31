import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";
import emojiDataJson from "@emoji-mart/data/sets/15/native.json";
import type { EmojiMartData } from "@emoji-mart/data";

import { resolveFloatingPosition, type FloatingAnchor } from "./floating";

interface EmojiMenuProps {
  anchor: FloatingAnchor | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  preferredX?: "center" | "end" | "start";
  preferredY?: "top" | "bottom";
}

interface EmojiCategorySection {
  emojiIds: string[];
  icon: string;
  id: string;
  label: string;
}

interface EmojiOption {
  emoji: string;
  id: string;
  keywords: string[];
  label: string;
}

const emojiData = emojiDataJson as EmojiMartData;

const categoryLabels: Record<string, { icon: string; label: string }> = {
  people: { icon: "🙂", label: "Smileys" },
  nature: { icon: "🌿", label: "Nature" },
  foods: { icon: "🍜", label: "Food" },
  activity: { icon: "⚽", label: "Activity" },
  places: { icon: "🌆", label: "Travel" },
  objects: { icon: "💡", label: "Objects" },
  symbols: { icon: "🔣", label: "Symbols" },
  flags: { icon: "🏁", label: "Flags" },
};

const emojiCategories: EmojiCategorySection[] = emojiData.categories
  .filter((category) => category.id in categoryLabels)
  .map((category) => ({
    emojiIds: category.emojis,
    icon: categoryLabels[category.id]?.icon ?? "🙂",
    id: category.id,
    label: categoryLabels[category.id]?.label ?? category.id,
  }));

const emojiOptionsById = new Map<string, EmojiOption>(
  Object.values(emojiData.emojis).flatMap((emoji) => {
    const native = emoji.skins[0]?.native;

    if (!native) {
      return [];
    }

    return [
      [
        emoji.id,
        {
          emoji: native,
          id: emoji.id,
          keywords: emoji.keywords,
          label: emoji.name,
        },
      ] satisfies [string, EmojiOption],
    ];
  }),
);

export function EmojiMenu(props: EmojiMenuProps) {
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState(emojiCategories[0]?.id ?? "people");
  const [position, setPosition] = useState({ left: 0, maxHeight: 380, top: 0 });
  const [query, setQuery] = useState("");

  const filteredSearchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return Object.values(emojiData.emojis)
      .map((emoji) => {
        const native = emoji.skins[0]?.native;

        if (!native) {
          return null;
        }

        return {
          emoji: native,
          id: emoji.id,
          label: emoji.name,
          searchText: `${emoji.name} ${emoji.keywords.join(" ")}`.toLowerCase(),
        };
      })
      .filter(
        (emoji): emoji is { emoji: string; id: string; label: string; searchText: string } =>
          emoji !== null && emoji.searchText.includes(normalizedQuery),
      )
      .map((emoji) => ({
        emoji: emoji.emoji,
        id: emoji.id,
        label: emoji.label,
      }))
      .slice(0, 120);
  }, [query]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    setQuery("");
    setActiveCategoryId(emojiCategories[0]?.id ?? "people");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      props.onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    function handleScroll(event: Event) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      props.onClose();
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", props.onClose);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", props.onClose);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [props.isOpen, props.onClose]);

  useLayoutEffect(() => {
    if (!containerRef.current || !props.anchor || !props.isOpen) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    setPosition(
      resolveFloatingPosition({
        anchor: props.anchor,
        floatingHeight: rect.height,
        floatingWidth: rect.width,
        offset: 8,
        preferredX: props.preferredX ?? "end",
        preferredY: props.preferredY ?? "bottom",
      }),
    );
  }, [props.anchor, props.isOpen, props.preferredX, props.preferredY]);

  if (!props.anchor || !props.isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={clsx(
        "fixed z-50 flex flex-col overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.12)]",
        "max-md:inset-x-0 max-md:bottom-0 max-md:h-[60dvh] max-md:rounded-b-none max-md:border-b-0",
        "md:h-[22rem] md:w-[20rem]",
      )}
      ref={containerRef}
      style={
        window.innerWidth >= 768
          ? {
              left: position.left,
              maxHeight: position.maxHeight,
              top: position.top,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 border-b border-amber-100/60 px-3 py-2">
        <svg className="size-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 16 16">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 11L14 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
        </svg>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search emoji…"
          ref={searchInputRef}
          value={query}
        />
      </div>

      {!query.trim() ? (
        <div className="flex gap-0.5 border-b border-amber-100/60 px-2 py-1">
          {emojiCategories.map((category) => (
            <button
              aria-label={category.label}
              className={clsx(
                "flex size-7 items-center justify-center rounded-lg text-sm transition-colors duration-100",
                activeCategoryId === category.id
                  ? "bg-amber-100 text-slate-900"
                  : "text-slate-400 hover:bg-amber-50 hover:text-slate-600",
              )}
              key={category.id}
              onClick={() => {
                setActiveCategoryId(category.id);
                categoryRefs.current[category.id]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              type="button"
            >
              {category.icon}
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2" ref={scrollRef}>
        {query.trim() ? (
          filteredSearchResults.length > 0 ? (
            <EmojiGrid emojis={filteredSearchResults} onSelect={props.onSelect} />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-400">
              No emoji found
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            {emojiCategories.map((category) => {
              const categoryEmojis = category.emojiIds
                .map((emojiId) => emojiOptionsById.get(emojiId))
                .filter((emoji): emoji is EmojiOption => Boolean(emoji));

              return (
                <div
                  key={category.id}
                  ref={(element) => {
                    categoryRefs.current[category.id] = element;
                  }}
                >
                  <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {category.label}
                  </div>
                  <EmojiGrid emojis={categoryEmojis} onSelect={props.onSelect} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface EmojiGridProps {
  emojis: Pick<EmojiOption, "emoji" | "id" | "label">[];
  onSelect: (emoji: string) => void;
}

function EmojiGrid(props: EmojiGridProps) {
  return (
    <div className="grid grid-cols-8 gap-px">
      {props.emojis.map((emoji) => (
        <button
          aria-label={emoji.label}
          className="flex size-8 items-center justify-center rounded-lg text-lg transition-colors duration-75 hover:bg-amber-50"
          key={emoji.id}
          onClick={() => props.onSelect(emoji.emoji)}
          title={emoji.label}
          type="button"
        >
          {emoji.emoji}
        </button>
      ))}
    </div>
  );
}
