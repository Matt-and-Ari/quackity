export interface FloatingAnchor {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface ResolveFloatingPositionProps {
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
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const fitsAbove = props.anchor.top - offset - props.floatingHeight >= viewportMargin;
  const fitsBelow =
    props.anchor.top + props.anchor.height + offset + props.floatingHeight <=
    viewportHeight - viewportMargin;

  const placeAbove = props.preferredY === "top" ? fitsAbove || !fitsBelow : !fitsBelow;

  const targetTop = placeAbove
    ? props.anchor.top - props.floatingHeight - offset
    : props.anchor.top + props.anchor.height + offset;

  let targetLeft = props.anchor.left;

  if (props.preferredX === "center") {
    targetLeft = props.anchor.left + props.anchor.width / 2 - props.floatingWidth / 2;
  } else if (props.preferredX === "end") {
    targetLeft = props.anchor.left + props.anchor.width - props.floatingWidth;
  }

  const left = clamp(
    targetLeft,
    viewportMargin,
    viewportWidth - props.floatingWidth - viewportMargin,
  );
  const top = clamp(
    targetTop,
    viewportMargin,
    viewportHeight - props.floatingHeight - viewportMargin,
  );

  return {
    left,
    maxHeight: Math.max(viewportHeight - top - viewportMargin, 160),
    top,
  };
}
