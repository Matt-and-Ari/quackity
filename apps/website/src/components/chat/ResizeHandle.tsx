import clsx from "clsx";

interface ResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void;
  side: "left" | "right";
}

export function ResizeHandle(props: ResizeHandleProps) {
  return (
    <div
      className={clsx(
        "group absolute bottom-0 top-0 z-10 flex w-2 cursor-col-resize items-stretch",
        props.side === "right" ? "-right-1" : "-left-1",
      )}
      onMouseDown={props.onMouseDown}
    >
      <div className="mx-auto w-px bg-transparent transition-colors duration-75 group-hover:bg-amber-400 group-active:bg-amber-500" />
    </div>
  );
}
