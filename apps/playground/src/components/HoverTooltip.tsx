import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import { anchorFromElement, resolveFloatingPosition, type FloatingAnchor } from "./floating";

interface HoverTooltipProps {
  children: ReactNode;
  className?: string;
  content: ReactNode;
  disabled?: boolean;
  side?: "bottom" | "top";
}

const TOOLTIP_DELAY_MS = 120;

export function HoverTooltip(props: HoverTooltipProps) {
  const tooltipId = useId();
  const hostRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<FloatingAnchor | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || props.disabled) {
      return;
    }

    function handleWindowChange() {
      setAnchor(anchorFromElement(hostRef.current));
    }

    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [isOpen, props.disabled]);

  useLayoutEffect(() => {
    if (!isOpen || !anchor || !tooltipRef.current) {
      return;
    }

    const rect = tooltipRef.current.getBoundingClientRect();
    const nextPosition = resolveFloatingPosition({
      anchor,
      floatingHeight: rect.height,
      floatingWidth: rect.width,
      offset: 12,
      preferredX: "center",
      preferredY: props.side ?? "top",
    });

    setPosition({
      left: nextPosition.left,
      top: nextPosition.top,
    });
  }, [anchor, isOpen, props.side]);

  function clearTooltipTimer() {
    if (!timeoutRef.current) {
      return;
    }

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function showTooltip() {
    if (props.disabled) {
      return;
    }

    clearTooltipTimer();
    timeoutRef.current = window.setTimeout(() => {
      setAnchor(anchorFromElement(hostRef.current));
      setIsOpen(true);
    }, TOOLTIP_DELAY_MS);
  }

  function hideTooltip() {
    clearTooltipTimer();
    setIsOpen(false);
  }

  return (
    <>
      <span
        ref={hostRef}
        className={clsx("inline-flex", props.className)}
        onBlur={hideTooltip}
        onFocus={showTooltip}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        aria-describedby={isOpen ? tooltipId : undefined}
      >
        {props.children}
      </span>
      {isOpen
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-50 rounded-lg border border-slate-900/10 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]"
              style={{ left: position.left, top: position.top }}
            >
              {props.content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
