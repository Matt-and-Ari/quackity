interface LoadingCardProps {
  description: string;
  title: string;
}

export function LoadingCard(props: LoadingCardProps) {
  return (
    <section className="flex flex-1 items-center justify-center py-14">
      <div className="w-full max-w-md rounded-[1.45rem] border border-amber-200/60 bg-white/80 p-8 text-center shadow-[0_18px_50px_rgba(217,119,6,0.08)]">
        <p className="text-lg font-semibold text-slate-900">{props.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{props.description}</p>
      </div>
    </section>
  );
}
