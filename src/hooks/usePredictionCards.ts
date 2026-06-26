"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDismissedCardIds, saveDismissedCardId } from "@/lib/storage";
import type { CardsResponse, PredictionCard, TxlineMode } from "@/lib/txline/types";

type SimulatedMoment = {
  eventLabel: NonNullable<PredictionCard["eventLabel"]>;
  eventContext: string;
  predictionText: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  minute: number;
  odds: number;
  oddsTrend: NonNullable<PredictionCard["oddsTrend"]>;
  marketType: PredictionCard["marketType"];
};

const simulatedMoments: SimulatedMoment[] = [
  {
    eventLabel: "GOAL",
    eventContext: "Brazil just conceded and the crowd noise jumped",
    predictionText: "Brazil responds after conceding",
    matchId: "demo-arg-bra",
    homeTeam: "Argentina",
    awayTeam: "Brazil",
    minute: 73,
    odds: 2.42,
    oddsTrend: "down",
    marketType: "next_goal",
  },
  {
    eventLabel: "RED CARD",
    eventContext: "England are down to 10 men with France pressing",
    predictionText: "England survives this pressure",
    matchId: "demo-fra-eng",
    homeTeam: "France",
    awayTeam: "England",
    minute: 66,
    odds: 3.05,
    oddsTrend: "up",
    marketType: "event_reaction",
  },
  {
    eventLabel: "PENALTY",
    eventContext: "Spain have a penalty check after a handball shout",
    predictionText: "This penalty changes the match",
    matchId: "demo-esp-ger",
    homeTeam: "Spain",
    awayTeam: "Germany",
    minute: 41,
    odds: 1.92,
    oddsTrend: "down",
    marketType: "event_reaction",
  },
  {
    eventLabel: "ODDS SHIFT",
    eventContext: "Argentina's edge just moved fast",
    predictionText: "Argentina's odds are moving fast",
    matchId: "demo-arg-bra",
    homeTeam: "Argentina",
    awayTeam: "Brazil",
    minute: 78,
    odds: 1.88,
    oddsTrend: "down",
    marketType: "odds_movement",
  },
  {
    eventLabel: "HALF TIME",
    eventContext: "Half time reset the rhythm after a wild first half",
    predictionText: "The second half has more goals",
    matchId: "demo-fra-eng",
    homeTeam: "France",
    awayTeam: "England",
    minute: 45,
    odds: 2.08,
    oddsTrend: "steady",
    marketType: "goals",
  },
  {
    eventLabel: "LATE PRESSURE",
    eventContext: "Portugal are throwing players forward late",
    predictionText: "One more goal before full time",
    matchId: "demo-por-ned",
    homeTeam: "Portugal",
    awayTeam: "Netherlands",
    minute: 86,
    odds: 2.22,
    oddsTrend: "down",
    marketType: "goals",
  },
];

function mergeCards(current: PredictionCard[], incoming: PredictionCard[], dismissed: Set<string>) {
  const map = new Map<string, PredictionCard>();

  for (const card of current) {
    if (!dismissed.has(card.id)) map.set(card.id, card);
  }

  for (const card of incoming) {
    if (!dismissed.has(card.id)) map.set(card.id, card);
  }

  return Array.from(map.values()).slice(0, 40);
}

export function usePredictionCards(walletAddress?: string) {
  const [cards, setCards] = useState<PredictionCard[]>([]);
  const [mode, setMode] = useState<TxlineMode>("demo");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [newCardBurst, setNewCardBurst] = useState(false);
  const simulatedMomentIndex = useRef(0);
  const inFlight = useRef(false);
  const pollAfterMs = useRef(10000);

  const showNewCardBurst = useCallback(() => {
    setNewCardBurst(true);
    window.setTimeout(() => setNewCardBurst(false), 1300);
  }, []);

  const fetchCards = useCallback(async () => {
    if (!walletAddress || inFlight.current || document.visibilityState === "hidden") return;

    inFlight.current = true;
    setLoading((current) => (cards.length ? current : true));

    try {
      const response = await fetch("/api/txline/cards", { cache: "no-store" });
      const data = (await response.json()) as CardsResponse;
      const dismissed = new Set(getDismissedCardIds(walletAddress));
      pollAfterMs.current = data.pollAfterMs ?? (data.mode === "demo" ? 10000 : 30000);

      setMode(data.mode);
      setLastUpdated(data.lastUpdated);
      setCards((current) => {
        const now = Date.now();
        const active = current.filter((card) => !card.expiresAt || new Date(card.expiresAt).getTime() > now);
        const next = mergeCards(active, data.cards, dismissed);
        if (next.length > current.length) {
          showNewCardBurst();
        }
        return next;
      });
    } catch {
      setCards((current) => current);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [cards.length, showNewCardBurst, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;

    let timeoutId: number | undefined;

    const schedule = (delay = 0) => {
      timeoutId = window.setTimeout(async () => {
        await fetchCards();
        if (document.visibilityState !== "hidden") {
          schedule(pollAfterMs.current);
        }
      }, delay);
    };

    const resume = () => {
      if (document.visibilityState === "visible") {
        if (timeoutId) window.clearTimeout(timeoutId);
        schedule(0);
      }
    };

    schedule(0);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [fetchCards, walletAddress]);

  const dismissCard = useCallback(
    (cardId: string) => {
      if (!walletAddress) return;
      saveDismissedCardId(walletAddress, cardId);
      setCards((current) => current.filter((card) => card.id !== cardId));
    },
    [walletAddress],
  );

  const simulateMatchEvent = useCallback(() => {
    const template = simulatedMoments[simulatedMomentIndex.current % simulatedMoments.length];
    simulatedMomentIndex.current += 1;

    const now = new Date();
    const createdAt = now.toISOString();
    const matchName = `${template.homeTeam} vs ${template.awayTeam}`;
    const card: PredictionCard = {
      id: `demo-sim-${template.eventLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${now.getTime()}`,
      matchId: template.matchId,
      competition: "World Cup",
      homeTeam: template.homeTeam,
      awayTeam: template.awayTeam,
      matchName,
      minute: Math.min(90, template.minute + (simulatedMomentIndex.current % 3)),
      status: "live",
      eventContext: template.eventContext,
      eventLabel: template.eventLabel,
      predictionText: template.predictionText,
      odds: Number((template.odds + (simulatedMomentIndex.current % 2) * 0.06).toFixed(2)),
      oddsTrend: template.oddsTrend,
      marketType: template.marketType,
      source: "demo",
      createdAt,
      expiresAt: new Date(now.getTime() + 12 * 60 * 1000).toISOString(),
      result:
        simulatedMomentIndex.current % 4 === 0
          ? "pending"
          : simulatedMomentIndex.current % 2 === 0
            ? "won"
            : "lost",
    };

    setMode("demo");
    setLastUpdated(createdAt);
    setLoading(false);
    setCards((current) => [card, ...current].slice(0, 40));
    showNewCardBurst();
  }, [showNewCardBurst]);

  return {
    cards,
    mode,
    loading,
    lastUpdated,
    newCardBurst,
    dismissCard,
    refresh: fetchCards,
    simulateMatchEvent,
  };
}
