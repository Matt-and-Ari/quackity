import clsx from "clsx";

const WORKSPACE_GRADIENT_PAIRS = [
  ["from-amber-400", "to-amber-500"],
  ["from-orange-400", "to-orange-500"],
  ["from-yellow-500", "to-amber-600"],
  ["from-amber-500", "to-orange-600"],
  ["from-rose-400", "to-rose-500"],
  ["from-emerald-400", "to-emerald-500"],
  ["from-teal-400", "to-teal-500"],
  ["from-sky-400", "to-sky-500"],
] as const;

export function getWorkspaceGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const pair = WORKSPACE_GRADIENT_PAIRS[Math.abs(hash) % WORKSPACE_GRADIENT_PAIRS.length];
  return `${pair[0]} ${pair[1]}`;
}

export function getWorkspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

export function WorkspaceIcon(props: {
  gradient: string;
  imageUrl?: string | null;
  label: string;
  size: "sm" | "lg";
}) {
  const sizeClass = props.size === "lg" ? "size-9 rounded-xl text-sm" : "size-8 rounded-lg text-xs";

  if (props.imageUrl) {
    return (
      <img
        alt={props.label}
        className={clsx("shrink-0 select-none object-cover shadow-sm", sizeClass)}
        draggable={false}
        src={props.imageUrl}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 select-none items-center justify-center bg-gradient-to-br font-bold text-white shadow-sm",
        sizeClass,
        props.gradient,
      )}
    >
      {getWorkspaceInitial(props.label)}
    </div>
  );
}

export function UserAvatar(props: { imageUrl?: string | null; name: string; size: "xs" | "sm" }) {
  const sizeClass = props.size === "xs" ? "size-5 text-[0.5rem]" : "size-8 text-xs";
  const initial = props.name.trim().charAt(0).toUpperCase() || "?";

  if (props.imageUrl) {
    return (
      <img
        alt={props.name}
        className={clsx("shrink-0 select-none rounded-full object-cover", sizeClass)}
        draggable={false}
        src={props.imageUrl}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-semibold text-white",
        sizeClass,
      )}
    >
      {initial}
    </div>
  );
}

interface MenuRowProps {
  label: string;
  onClick: () => void;
}

export function MenuRow(props: MenuRowProps) {
  return (
    <button
      className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-75 hover:bg-amber-50"
      onClick={props.onClick}
      type="button"
    >
      {props.label}
    </button>
  );
}
