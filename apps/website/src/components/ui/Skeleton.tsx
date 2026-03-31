import clsx from "clsx";

interface SkeletonProps {
  className?: string;
}

export function Skeleton(props: SkeletonProps) {
  return <div className={clsx("animate-pulse rounded-md bg-slate-200/60", props.className)} />;
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
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
        />
      ))}
    </div>
  );
}

export function SkeletonCircle(props: SkeletonProps) {
  return (
    <div
      className={clsx("animate-pulse rounded-full bg-slate-200/60", props.className ?? "size-8")}
    />
  );
}
