"use client";

import { Flame, X } from "lucide-react";
import type { PredictionDecision } from "@/lib/txline/types";

export default function SwipeButtons({
  onDecision,
  disabled,
}: {
  onDecision: (decision: PredictionDecision) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-400/10 text-sm font-black uppercase tracking-wide text-rose-100 transition hover:bg-rose-400/16 active:scale-[0.98] disabled:opacity-40"
        disabled={disabled}
        onClick={() => onDecision("NO_WAY")}
        type="button"
      >
        <X size={21} />
        No Way
      </button>
      <button
        className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-300 text-sm font-black uppercase tracking-wide text-black shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-200 active:scale-[0.98] disabled:opacity-40"
        disabled={disabled}
        onClick={() => onDecision("LOCK_IT")}
        type="button"
      >
        <Flame size={21} />
        Lock It
      </button>
    </div>
  );
}
