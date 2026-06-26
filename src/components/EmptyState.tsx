import Link from "next/link";
import { CircleOff } from "lucide-react";

export default function EmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/30">
      <CircleOff className="mx-auto text-white/42" size={34} />
      <h2 className="mt-5 text-2xl font-black text-white">No live cards right now.</h2>
      <p className="mt-3 text-sm leading-6 text-white/62">
        Cards appear when goals, pressure, or odds movement create a new football read.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {onRefresh ? (
          <button
            className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-black"
            onClick={onRefresh}
            type="button"
          >
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
