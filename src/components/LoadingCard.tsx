export default function LoadingCard() {
  return (
    <div className="min-h-[460px] rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="h-7 w-16 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-12 space-y-4">
        <div className="h-5 w-44 animate-pulse rounded-full bg-white/10" />
        <div className="h-9 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-9 w-4/5 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-20 h-24 animate-pulse rounded-3xl bg-white/10" />
      <div className="mt-10 grid grid-cols-2 gap-3">
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
