import clsx from "clsx";

type SkeletonTone = "neutral" | "warm";

const TONE_BG: Record<SkeletonTone, string> = {
  neutral: "bg-slate-200/50",
  warm: "bg-amber-200/50",
};

interface SkeletonProps {
  className?: string;
  tone?: SkeletonTone;
}

export function Skeleton(props: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md",
        TONE_BG[props.tone ?? "neutral"],
        props.className,
      )}
    />
  );
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
  tone?: SkeletonTone;
  widths?: string[];
}

export function SkeletonText(props: SkeletonTextProps) {
  const count = props.lines ?? 1;
  const widths = props.widths ?? [];

  return (
    <div className={clsx("flex flex-col gap-2", props.className)}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          className={clsx("h-3", widths[i] ?? (i === count - 1 && count > 1 ? "w-2/3" : "w-full"))}
          key={i}
          tone={props.tone}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle(props: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-full",
        TONE_BG[props.tone ?? "neutral"],
        props.className ?? "size-8",
      )}
    />
  );
}
