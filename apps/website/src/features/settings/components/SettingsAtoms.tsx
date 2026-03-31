export function MemberAvatar(props: { imageUrl?: string | null; name: string }) {
  const initial = props.name.trim().charAt(0).toUpperCase() || "?";

  if (props.imageUrl) {
    return (
      <img
        alt={props.name}
        className="size-9 shrink-0 rounded-xl object-cover"
        src={props.imageUrl}
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80 text-xs font-bold text-amber-600">
      {initial}
    </div>
  );
}

export function CameraGlyph(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M3 5.5a1 1 0 0 1 1-1h1.5l1-1.5h5l1 1.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
