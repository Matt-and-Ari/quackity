export interface FloatingAnchor {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface ResolveFloatingPositionProps {
  anchor: FloatingAnchor;
  floatingHeight: number;
  floatingWidth: number;
  offset?: number;
  preferredX?: "center" | "end" | "start";
  preferredY?: "bottom" | "top";
  viewportMargin?: number;
}

export interface FloatingPosition {
  left: number;
  maxHeight: number;
  top: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function anchorFromElement(element: Element | null): FloatingAnchor | null {
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    left: rect.left,
    top: rect.top,
    width: rect.width,
  };
}

export function anchorFromPoint(left: number, top: number): FloatingAnchor {
  return {
    height: 0,
    left,
    top,
    width: 0,
  };
}

export function resolveFloatingPosition(props: ResolveFloatingPositionProps): FloatingPosition {
  const viewportMargin = props.viewportMargin ?? 12;
  const offset = props.offset ?? 10;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const fitsBelow =
    props.anchor.top + props.anchor.height + offset + props.floatingHeight <=
    viewportHeight - viewportMargin;
  const nextTop =
    props.preferredY === "top" || !fitsBelow
      ? props.anchor.top - props.floatingHeight - offset
      : props.anchor.top + props.anchor.height + offset;

  let nextLeft = props.anchor.left;

  if (props.preferredX === "center") {
    nextLeft = props.anchor.left + props.anchor.width / 2 - props.floatingWidth / 2;
  } else if (props.preferredX === "end") {
    nextLeft = props.anchor.left + props.anchor.width - props.floatingWidth;
  }

  const left = clamp(
    nextLeft,
    viewportMargin,
    viewportWidth - props.floatingWidth - viewportMargin,
  );
  const top = clamp(
    nextTop,
    viewportMargin,
    viewportHeight - props.floatingHeight - viewportMargin,
  );
  const maxHeight = Math.max(viewportHeight - top - viewportMargin, 160);

  return { left, maxHeight, top };
}
