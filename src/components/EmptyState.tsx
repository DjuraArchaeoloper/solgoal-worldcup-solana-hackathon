import Link from "next/link";
import { CircleOff, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function EmptyState({
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  lastUpdated?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/30">
      <div className="relative mx-auto flex size-14 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-300/10">
        <span className="absolute size-14 animate-ping rounded-full bg-emerald-300/10" />
        <CircleOff className="relative text-emerald-100/75" size={30} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-white">You are caught up.</h2>
      <p className="mt-3 text-sm leading-6 text-white/62">
        Waiting for the next live match moment...
      </p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-white/34">
        {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Checking for fresh cards"}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {onRefresh ? (
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-black transition active:scale-[0.98]"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        ) : null}
        <Link className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/75" href="/about">
          About
        </Link>
      </div>
    </div>
  );
}
