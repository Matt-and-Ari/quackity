import clsx from "clsx";

interface NoticeProps {
  message: string;
  tone?: "error" | "info";
}

interface InputFieldProps {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}

interface TextareaFieldProps {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function Notice(props: NoticeProps) {
  const toneClasses =
    props.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={clsx("rounded-xl border px-3 py-2.5 text-sm", toneClasses)}>
      {props.message}
    </div>
  );
}

export function InputField(props: InputFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{props.label}</span>
      <input
        autoComplete={props.type === "email" ? "email" : undefined}
        className="w-full rounded-xl border border-amber-200/70 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-400"
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        type={props.type ?? "text"}
        value={props.value}
      />
    </label>
  );
}

export function TextareaField(props: TextareaFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{props.label}</span>
      <textarea
        className="min-h-24 w-full rounded-xl border border-amber-200/70 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-400"
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        value={props.value}
      />
    </label>
  );
}
