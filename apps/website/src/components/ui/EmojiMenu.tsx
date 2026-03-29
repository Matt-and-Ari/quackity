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
  activity: { icon: "⚽", label: "Activity" },
  flags: { icon: "🏁", label: "Flags" },
  foods: { icon: "🍜", label: "Food & Drink" },
  nature: { icon: "🌿", label: "Nature" },
  objects: { icon: "💡", label: "Objects" },
  people: { icon: "🙂", label: "Smileys & People" },
  places: { icon: "🌆", label: "Travel & Places" },
  symbols: { icon: "🔣", label: "Symbols" },
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState(emojiCategories[0]?.id ?? "people");
  const [position, setPosition] = useState({ left: 0, maxHeight: 420, top: 0 });
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
      .slice(0, 180);
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
        offset: 12,
        preferredX: "end",
        preferredY: "bottom",
      }),
    );
  }, [props.anchor, props.isOpen]);

  if (!props.anchor || !props.isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={clsx(
        "fixed z-50 flex overflow-hidden border border-amber-200/80 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl",
        "max-md:inset-x-0 max-md:bottom-0 max-md:h-[70dvh] max-md:rounded-t-2xl max-md:border-b-0",
        "md:h-[30rem] md:w-[25rem] md:rounded-[1.35rem]",
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
      <div className="hidden w-14 flex-col items-center gap-1 border-r border-amber-100 bg-amber-50/70 p-2 md:flex">
        {emojiCategories.map((category) => (
          <button
            aria-label={category.label}
            className={clsx(
              "flex size-10 items-center justify-center rounded-xl text-base transition-colors duration-100",
              activeCategoryId === category.id
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-800",
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

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-amber-100 px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">Add reaction</div>
          <div className="mt-2">
            <input
              className="w-full rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2 text-sm text-slate-700 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-300 focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search all emoji"
              ref={searchInputRef}
              value={query}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {query.trim() ? (
            filteredSearchResults.length > 0 ? (
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Search results
                </div>
                <EmojiGrid emojis={filteredSearchResults} onSelect={props.onSelect} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-6 text-center text-sm text-slate-500">
                No emojis matched that search.
              </div>
            )
          ) : (
            <div className="flex flex-col gap-5">
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
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span className="text-sm">{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                    <EmojiGrid emojis={categoryEmojis} onSelect={props.onSelect} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
    <div className="grid grid-cols-8 gap-1.5">
      {props.emojis.map((emoji) => (
        <button
          aria-label={emoji.label}
          className="flex size-10 items-center justify-center rounded-xl text-xl transition-colors duration-100 hover:bg-amber-50"
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
