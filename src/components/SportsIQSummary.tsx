"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import type { SportsIQScore } from "@/lib/scoring";
import { shortenWallet } from "@/lib/wallet";

const MotionH1 = motion.h1 as ComponentType<Record<string, unknown>>;

export default function SportsIQSummary({
  summary,
  walletAddress,
}: {
  summary: SportsIQScore;
  walletAddress?: string;
}) {
  return (
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.075] p-6 text-center shadow-2xl shadow-black/35">
        <div className="absolute inset-x-10 -top-24 h-48 rounded-full bg-emerald-300/[0.14] blur-3xl" />
        <div className="relative mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-300 text-black shadow-lg shadow-emerald-950/30">
          {summary.sportsIQ === null ? <Sparkles size={22} /> : <Trophy size={22} />}
        </div>
        <p className="relative mt-4 text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Sports IQ</p>
        {summary.sportsIQ === null ? (
          <>
            <h1 className="relative mt-4 text-4xl font-black text-white">Sports IQ pending</h1>
            <p className="relative mt-3 text-sm leading-6 text-white/62">
              Your picks will settle after the match finishes.
            </p>
          </>
        ) : (
          <>
            <MotionH1
              animate={{ opacity: 1, scale: 1 }}
              className="relative mt-4 text-7xl font-black text-white"
              initial={{ opacity: 0, scale: 0.82 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              {summary.sportsIQ}
            </MotionH1>
            <p className="relative mt-3 text-sm leading-6 text-white/62">Your football intuition score for today.</p>
          </>
        )}
        {walletAddress ? (
          <p className="relative mt-5 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/52">
            {shortenWallet(walletAddress)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["Total picks", summary.totalPicks],
          ["Accuracy", summary.accuracy === null ? "Pending" : `${summary.accuracy}%`],
          ["Current streak", summary.streak],
          ["Pending picks", summary.pendingPicks],
          ["Settled picks", summary.settledPicks],
          ["Status", summary.sportsIQ === null ? "Pending" : "Updated"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/42">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
