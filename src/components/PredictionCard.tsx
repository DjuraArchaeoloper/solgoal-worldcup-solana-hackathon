"use client";

import { motion } from "framer-motion";
import { Activity, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { PredictionCard as PredictionCardType, PredictionDecision } from "@/lib/txline/types";

const variants = {
  enter: { opacity: 0, y: 24, scale: 0.96 },
  center: { opacity: 1, y: 0, scale: 1, rotate: 0 },
  exit: (direction: "left" | "right") => ({
    opacity: 0,
    x: direction === "right" ? 460 : -460,
    rotate: direction === "right" ? 11 : -11,
    transition: { duration: 0.28 },
  }),
};

const MotionArticle = motion.article as ComponentType<Record<string, unknown>>;
const MotionSpan = motion.span as ComponentType<Record<string, unknown>>;

function statusLabel(card: PredictionCardType) {
  if (card.status === "live") return `LIVE${card.minute ? ` / ${card.minute}'` : ""}`;
  return card.status.toUpperCase();
}

function eventClasses(label?: PredictionCardType["eventLabel"]) {
  if (label === "GOAL") return "border-emerald-200/30 bg-emerald-300 text-black";
  if (label === "RED CARD") return "border-rose-200/30 bg-rose-400 text-white";
  if (label === "PENALTY") return "border-amber-200/30 bg-amber-300 text-black";
  if (label === "ODDS SHIFT") return "border-sky-200/30 bg-sky-300 text-black";
  if (label === "HALF TIME") return "border-white/15 bg-white/[0.12] text-white";
  return "border-orange-200/25 bg-orange-300 text-black";
}

export default function PredictionCard({
  card,
  exitDirection,
  onDecision,
}: {
  card: PredictionCardType;
  exitDirection: "left" | "right";
  onDecision: (decision: PredictionDecision) => void;
}) {
  const TrendIcon = card.oddsTrend === "up" ? TrendingUp : card.oddsTrend === "down" ? TrendingDown : Activity;

  return (
    <MotionArticle
      animate="center"
      className="relative min-h-[488px] overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(155deg,rgba(255,255,255,0.18),rgba(255,255,255,0.065)_42%,rgba(16,185,129,0.18))] p-5 shadow-2xl shadow-black/40 backdrop-blur"
      custom={exitDirection}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      exit="exit"
      initial="enter"
      key={card.id}
      onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
        if (info.offset.x > 80) onDecision("LOCK_IT");
        if (info.offset.x < -80) onDecision("NO_WAY");
      }}
      transition={{ type: "spring", stiffness: 330, damping: 30 }}
      variants={variants}
      whileTap={{ scale: 0.985 }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-200" />
      <div className="absolute -right-24 -top-20 size-64 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="absolute -bottom-28 left-10 size-56 rounded-full bg-sky-300/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
            card.status === "live"
              ? "bg-emerald-300 text-black"
              : "border border-white/10 bg-white/10 text-white/72",
          )}
        >
          <span className="size-2 rounded-full bg-current opacity-70 animate-pulse" />
          {statusLabel(card)}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/62">
          {card.competition}
        </span>
      </div>

      <div className="relative mt-9">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/44">{card.matchName}</p>
        <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-white/62">
          <Clock3 size={16} className="text-emerald-200" />
          <span>
            {card.homeTeam} {card.awayTeam ? "vs" : ""} {card.awayTeam}
          </span>
        </div>
      </div>

      {card.eventContext || card.eventLabel ? (
        <div className="relative mt-7 rounded-2xl border border-white/12 bg-black/[0.24] p-4 shadow-inner shadow-black/20">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide",
              eventClasses(card.eventLabel),
            )}
          >
            {card.eventLabel ?? "LIVE MOMENT"}
          </span>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/78">
            {card.eventContext ?? "The match just shifted. Trust your football read."}
          </p>
        </div>
      ) : null}

      <div className="relative mt-8">
        <h2 className="text-4xl font-black leading-[1.05] tracking-normal text-white">{card.predictionText}?</h2>
      </div>

      <div className="relative mt-9 flex flex-wrap items-center gap-3">
        {card.odds ? (
          <MotionSpan
            animate={card.oddsTrend === "steady" ? { scale: 1 } : { scale: [1, 1.05, 1] }}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black shadow-lg",
              card.oddsTrend === "up"
                ? "border-amber-200/25 bg-amber-300/[0.12] text-amber-100 shadow-amber-950/10"
                : "border-sky-300/25 bg-sky-300/[0.12] text-sky-100 shadow-sky-950/10",
            )}
            key={`${card.id}-${card.odds}`}
            transition={{ duration: 0.42 }}
          >
            <TrendIcon size={16} />
            Odds {card.odds.toFixed(2)}
            <span className="rounded-full bg-white/[0.12] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/62">
              {card.oddsTrend === "steady" ? "Live" : "Moved"}
            </span>
          </MotionSpan>
        ) : null}
        <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/62">
          {card.source === "demo" ? "Demo" : "TxLINE"}
        </span>
      </div>

      <p className="absolute bottom-5 left-0 right-0 px-5 text-center text-xs font-semibold text-white/38">
        Swipe right to Lock It. Swipe left for No Way.
      </p>
    </MotionArticle>
  );
}
