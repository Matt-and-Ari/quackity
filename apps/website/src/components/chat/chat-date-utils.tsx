const dateHeadingFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function dateDayKey(timestamp: string | number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDateHeading(timestamp: string | number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = dateDayKey(now.getTime());
  const yesterday = dateDayKey(now.getTime() - 86_400_000);
  const key = dateDayKey(timestamp);

  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";

  const isSameYear = date.getFullYear() === now.getFullYear();
  if (!isSameYear) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return dateHeadingFormatter.format(date);
}

export const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function createFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  for (const file of files) {
    dt.items.add(file);
  }
  return dt.files;
}

export function DateHeading(props: { timestamp: string | number }) {
  return (
    <div
      className="relative flex items-center py-2 select-none"
      aria-label={formatDateHeading(props.timestamp)}
    >
      <div className="flex-1 border-t border-amber-200/50" />
      <span className="mx-3 shrink-0 rounded-full border border-amber-200/60 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {formatDateHeading(props.timestamp)}
      </span>
      <div className="flex-1 border-t border-amber-200/50" />
    </div>
  );
}
