import { Skeleton, SkeletonCircle, SkeletonText } from "../ui/Skeleton";

const CHANNEL_WIDTHS = ["w-16", "w-20", "w-14", "w-24", "w-12"] as const;

export function WorkspaceShellLoading() {
  return (
    <div className="h-[100dvh] overflow-hidden p-1.5 sm:p-2 md:p-3">
      <div className="flex h-full gap-1.5 sm:gap-2 md:gap-3">
        <SidebarSkeleton />
        <MainPanelSkeleton />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-amber-50/75 shadow-[0_18px_50px_rgba(217,119,6,0.08)] md:flex">
      {/* Workspace header */}
      <div className="flex items-center gap-3 border-b border-amber-200/50 px-4 py-3.5">
        <Skeleton className="size-9 shrink-0 rounded-xl" tone="warm" />
        <Skeleton className="h-4 w-24 rounded" tone="warm" />
      </div>

      {/* Browse button */}
      <div className="border-b border-amber-200/50 px-2 py-2">
        <div className="flex items-center gap-2 rounded-xl px-2.5 py-2">
          <Skeleton className="size-4 rounded" tone="warm" />
          <Skeleton className="h-3.5 w-12 rounded" tone="warm" />
        </div>
      </div>

      {/* Channel list — matches ChannelLink: px-2.5 py-1.5, text-sm with # prefix */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 px-2 py-3">
        <div className="mb-1 px-2">
          <Skeleton className="h-2 w-14 rounded" tone="warm" />
        </div>
        {CHANNEL_WIDTHS.map((width, i) => (
          <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5" key={i}>
            <Skeleton className="h-3.5 w-3 shrink-0 rounded" tone="warm" />
            <Skeleton className={`h-3.5 ${width} rounded`} tone="warm" />
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-amber-200/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <SkeletonCircle className="size-8" tone="warm" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1.5 h-3.5 w-20 rounded" tone="warm" />
            <Skeleton className="h-2.5 w-28 rounded" tone="warm" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function MessageSkeleton(props: { short?: boolean }) {
  return (
    <div className="flex gap-3 px-2 py-2.5">
      <SkeletonCircle className="size-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
        <SkeletonText
          lines={props.short ? 1 : 2}
          widths={props.short ? ["w-1/3"] : ["w-full", "w-3/5"]}
        />
      </div>
    </div>
  );
}

function MainPanelSkeleton() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:rounded-[1.45rem]">
      {/* Channel header */}
      <header className="border-b border-amber-100/70 px-3 py-2.5 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded sm:w-36" />
            <Skeleton className="hidden h-3.5 w-48 rounded sm:block" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Messages area */}
      <section className="flex min-h-0 flex-1 flex-col-reverse overflow-hidden px-2 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-1">
          <MessageSkeleton />
          <MessageSkeleton short />
          <MessageSkeleton />
          <MessageSkeleton short />
          <MessageSkeleton />
          <MessageSkeleton short />
        </div>
      </section>

      {/* Message input */}
      <footer className="border-t border-amber-100/70 px-2 py-2 sm:px-4 sm:py-3">
        <Skeleton className="h-[42px] w-full rounded-xl" />
      </footer>
    </main>
  );
}
