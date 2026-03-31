import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string> {
  disabled?: boolean;
  label?: string;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  size?: "default" | "compact";
  value: T;
}

const sizeStyles = {
  default: {
    trigger: "rounded-xl px-3 py-2.5 text-sm",
    dropdown: "rounded-xl py-1",
    option: "px-3 py-2 text-sm",
  },
  compact: {
    trigger: "rounded-lg px-2 py-1 text-xs",
    dropdown: "rounded-lg py-0.5",
    option: "px-2.5 py-1.5 text-xs",
  },
} as const;

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const size = props.size ?? "default";
  const styles = sizeStyles[size];

  const selectedOption = props.options.find((o) => o.value === props.value);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {props.label ? (
        <span className="mb-1.5 block text-sm font-medium text-slate-600">{props.label}</span>
      ) : null}
      <button
        className={clsx(
          "flex w-full items-center justify-between gap-2 border bg-white text-left text-slate-900 outline-none transition-colors duration-100",
          styles.trigger,
          isOpen ? "border-amber-400" : "border-amber-200/80 hover:border-amber-300",
          props.disabled && "cursor-not-allowed opacity-60",
        )}
        disabled={props.disabled}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        <span className="truncate">{selectedOption?.label ?? props.value}</span>
        <svg
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
          fill="none"
          height={size === "compact" ? "12" : "14"}
          viewBox="0 0 14 14"
          width={size === "compact" ? "12" : "14"}
        >
          <path
            d="M3.5 5.25 7 8.75l3.5-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className={clsx(
            "absolute left-0 right-0 z-10 mt-1.5 overflow-hidden border border-amber-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.1)]",
            styles.dropdown,
          )}
        >
          {props.options.map((option) => (
            <button
              className={clsx(
                "flex w-full items-center justify-between text-left transition-colors duration-75",
                styles.option,
                option.value === props.value
                  ? "bg-amber-50/80 font-medium text-amber-700"
                  : "text-slate-700 hover:bg-amber-50/50",
              )}
              key={option.value}
              onClick={() => {
                props.onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === props.value ? (
                <svg
                  className="shrink-0 text-amber-500"
                  fill="none"
                  height={size === "compact" ? "12" : "14"}
                  viewBox="0 0 16 16"
                  width={size === "compact" ? "12" : "14"}
                >
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
