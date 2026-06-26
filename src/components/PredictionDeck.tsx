"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Clock3, History, Info, Radio, Sparkles } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePicks } from "@/hooks/usePicks";
import { usePredictionCards } from "@/hooks/usePredictionCards";
import { useSportsIQ } from "@/hooks/useSportsIQ";
import { formatTime } from "@/lib/utils";
import type { PredictionDecision } from "@/lib/txline/types";
import DemoModeBadge from "./DemoModeBadge";
import EmptyState from "./EmptyState";
import LoadingCard from "./LoadingCard";
import PredictionCard from "./PredictionCard";
import SwipeButtons from "./SwipeButtons";

const MotionDiv = motion.div as ComponentType<Record<string, unknown>>;

function liveUpdateLabel(value?: string) {
  if (!value) return "Finding cards";

  const updatedAt = new Date(value).getTime();
  if (Number.isNaN(updatedAt)) return "Updated just now";

  const secondsAgo = Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
  if (secondsAgo < 20) return "Updated just now";
  if (secondsAgo < 60) return `Updated ${secondsAgo}s ago`;
  return `Updated ${formatTime(value)}`;
}

export default function PredictionDeck() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const { picks, addPick } = usePicks(walletAddress);
  const summary = useSportsIQ(picks);
  const { cards, mode, loading, lastUpdated, newCardBurst, dismissCard, refresh, simulateMatchEvent } =
    usePredictionCards(walletAddress);
  const activeCard = cards[0];
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const showDemoControl =
    mode === "demo" ||
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";

  function handleDecision(decision: PredictionDecision) {
    if (!activeCard) return;
    setExitDirection(decision === "LOCK_IT" ? "right" : "left");
    addPick(activeCard, decision);
    dismissCard(activeCard.id);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DemoModeBadge mode={mode} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)] animate-pulse" />
            LIVE
          </span>
        </div>
        <span className="text-xs font-semibold text-white/46">
          {liveUpdateLabel(lastUpdated)}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          ["Today", summary.totalPicks],
          ["Streak", summary.streak],
          ["Sports IQ", summary.sportsIQ ?? "Pending"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/38">{label}</p>
            <p className="mt-1 text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative flex-1">
        {newCardBurst ? (
          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-300 px-4 py-2 text-xs font-black text-black shadow-xl"
            initial={{ opacity: 0, y: -12 }}
          >
            <Sparkles size={14} />
            Live update
          </MotionDiv>
        ) : null}

        {loading ? (
          <LoadingCard />
        ) : activeCard ? (
          <AnimatePresence custom={exitDirection} mode="popLayout">
            <PredictionCard
              card={activeCard}
              exitDirection={exitDirection}
              key={activeCard.id}
              onDecision={handleDecision}
            />
          </AnimatePresence>
        ) : (
          <EmptyState onRefresh={() => void refresh()} />
        )}

        {showDemoControl ? (
          <button
            className="fixed bottom-[6.25rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200/25 bg-black/75 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-100 shadow-2xl shadow-black/45 backdrop-blur transition hover:border-emerald-200/50 hover:bg-emerald-300 hover:text-black active:scale-[0.98]"
            onClick={simulateMatchEvent}
            type="button"
          >
            <Radio size={15} />
            Simulate Match Event
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <SwipeButtons disabled={!activeCard} onDecision={handleDecision} />
      </div>

      <nav className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["/results", "Results", BarChart3],
          ["/history", "History", History],
          ["/about", "About", Info],
        ].map(([href, label, Icon]) => (
          <Link
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] text-xs font-bold text-white/62 transition hover:text-white"
            href={href as string}
            key={href as string}
          >
            <Icon size={15} />
            {label as string}
          </Link>
        ))}
      </nav>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-white/36">
        <Clock3 size={13} />
        New live cards can appear every few seconds during a match.
      </p>
    </main>
  );
}
