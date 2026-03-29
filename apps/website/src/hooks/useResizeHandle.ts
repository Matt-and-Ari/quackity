import { useEffect, useRef, useState } from "react";

interface UseResizeHandleProps {
  defaultWidth: number;
  maxWidth: number;
  minWidth: number;
  side: "left" | "right";
}

export function useResizeHandle(props: UseResizeHandleProps) {
  const [width, setWidth] = useState(props.defaultWidth);
  const dragRef = useRef<{ startWidth: number; startX: number } | null>(null);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const drag = dragRef.current;

      if (!drag) {
        return;
      }

      const delta = event.clientX - drag.startX;
      const nextWidth = props.side === "right" ? drag.startWidth + delta : drag.startWidth - delta;
      setWidth(Math.max(props.minWidth, Math.min(props.maxWidth, nextWidth)));
    }

    function handleMouseUp() {
      if (!dragRef.current) {
        return;
      }

      dragRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [props.maxWidth, props.minWidth, props.side]);

  function startResize(event: React.MouseEvent) {
    event.preventDefault();
    dragRef.current = { startWidth: width, startX: event.clientX };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return {
    startResize,
    width,
  };
}
