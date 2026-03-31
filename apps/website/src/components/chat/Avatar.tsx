import { initials, nameFromEmail } from "../../lib/ui";
import type { InstantUserWithAvatar } from "../../types/quack";

export function Avatar(props: { user?: InstantUserWithAvatar | null }) {
  const name = nameFromEmail(props.user?.email);
  const avatarUrl = props.user?.avatar?.url ?? props.user?.imageURL;

  return (
    <div className="relative mt-0.5 size-8 shrink-0 select-none overflow-hidden rounded-lg bg-gradient-to-br from-amber-300 to-amber-500">
      {avatarUrl ? (
        <img alt={name} className="h-full w-full object-cover" draggable={false} src={avatarUrl} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
          {initials(name)}
        </div>
      )}
    </div>
  );
}
