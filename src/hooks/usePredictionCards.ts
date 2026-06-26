"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDismissedCardIds, getPicks, saveDismissedCardId } from "@/lib/storage";
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

type MergePredictionDeckInput = {
  currentDeck: PredictionCard[];
  incomingCards: PredictionCard[];
  dismissedIds: Set<string>;
  pickedIds: Set<string>;
  now?: number;
  prependIncoming?: boolean;
};

type FetchOptions = {
  silent?: boolean;
};

const MAX_DECK_SIZE = 80;
const LOW_WATERMARK = 6;

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

function hasExpired(card: PredictionCard, now: number) {
  return Boolean(card.expiresAt && new Date(card.expiresAt).getTime() <= now);
}

export function mergePredictionDeck({
  currentDeck,
  incomingCards,
  dismissedIds,
  pickedIds,
  now = Date.now(),
  prependIncoming = false,
}: MergePredictionDeckInput) {
  const hiddenIds = new Set([...dismissedIds, ...pickedIds]);
  const seenIds = new Set<string>();
  const nextDeck: PredictionCard[] = [];

  const addCard = (card: PredictionCard) => {
    if (hiddenIds.has(card.id) || seenIds.has(card.id) || hasExpired(card, now)) return;
    seenIds.add(card.id);
    nextDeck.push(card);
  };

  const first = prependIncoming ? incomingCards : currentDeck;
  const second = prependIncoming ? currentDeck : incomingCards;

  for (const card of first) addCard(card);
  for (const card of second) addCard(card);

  return nextDeck.slice(0, MAX_DECK_SIZE);
}

function pickedPredictionIds(walletAddress: string) {
  return new Set(getPicks(walletAddress).map((pick) => pick.predictionId));
}

function freshDismissedIds(walletAddress: string) {
  return new Set(getDismissedCardIds(walletAddress));
}

function visibleDeck(deck: PredictionCard[], dismissedIds: Set<string>, pickedIds: Set<string>) {
  const now = Date.now();
  return deck.filter((card) => !dismissedIds.has(card.id) && !pickedIds.has(card.id) && !hasExpired(card, now));
}

function documentIsHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function makeSimulatedCard(template: SimulatedMoment, index: number): PredictionCard {
  const now = new Date();
  const createdAt = now.toISOString();
  const matchName = `${template.homeTeam} vs ${template.awayTeam}`;

  return {
    id: `demo-sim-${template.eventLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${now.getTime()}-${index}`,
    matchId: template.matchId,
    competition: "World Cup",
    homeTeam: template.homeTeam,
    awayTeam: template.awayTeam,
    matchName,
    minute: Math.min(90, template.minute + (index % 4)),
    status: "live",
    eventContext: template.eventContext,
    eventLabel: template.eventLabel,
    predictionText: template.predictionText,
    odds: Number((template.odds + (index % 3) * 0.05).toFixed(2)),
    oddsTrend: template.oddsTrend,
    marketType: template.marketType,
    source: "demo",
    createdAt,
    expiresAt: new Date(now.getTime() + 12 * 60 * 1000).toISOString(),
    result: index % 4 === 0 ? "pending" : index % 2 === 0 ? "won" : "lost",
  };
}

export function usePredictionCards(walletAddress?: string) {
  const [deck, setDeck] = useState<PredictionCard[]>([]);
  const [mode, setMode] = useState<TxlineMode>("demo");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [newCardBurst, setNewCardBurst] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const simulatedMomentIndex = useRef(0);
  const inFlight = useRef(false);
  const pollAfterMs = useRef(10000);
  const deckRef = useRef<PredictionCard[]>([]);
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const pickedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  useEffect(() => {
    if (!walletAddress) {
      dismissedIdsRef.current = new Set();
      pickedIdsRef.current = new Set();
      const timeoutId = window.setTimeout(() => {
        setHiddenIds(new Set());
        setDeck([]);
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      dismissedIdsRef.current = freshDismissedIds(walletAddress);
      pickedIdsRef.current = pickedPredictionIds(walletAddress);
      setHiddenIds(new Set([...dismissedIdsRef.current, ...pickedIdsRef.current]));
      setDeck((current) =>
        mergePredictionDeck({
          currentDeck: current,
          incomingCards: [],
          dismissedIds: dismissedIdsRef.current,
          pickedIds: pickedIdsRef.current,
        }),
      );
      setIsLoading(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [walletAddress]);

  const activeCard = useMemo(() => deck.find((card) => !hiddenIds.has(card.id)), [deck, hiddenIds]);

  const syncStoredIds = useCallback((address: string) => {
    dismissedIdsRef.current = freshDismissedIds(address);
    pickedIdsRef.current = pickedPredictionIds(address);
    setHiddenIds(new Set([...dismissedIdsRef.current, ...pickedIdsRef.current]));

    return {
      dismissedIds: dismissedIdsRef.current,
      pickedIds: pickedIdsRef.current,
    };
  }, []);

  const showNewCardBurst = useCallback(() => {
    setNewCardBurst(true);
    window.setTimeout(() => setNewCardBurst(false), 1300);
  }, []);

  const fetchCards = useCallback(
    async ({ silent = false }: FetchOptions = {}) => {
      if (!walletAddress || inFlight.current || documentIsHidden()) return;

      inFlight.current = true;
      const hasCurrentDeck = deckRef.current.length > 0;
      setIsLoading(!silent && !hasCurrentDeck);
      setIsRefreshing(silent || hasCurrentDeck);

      try {
        const response = await fetch("/api/txline/cards", { cache: "no-store" });
        if (!response.ok) throw new Error(`Cards request failed with ${response.status}`);

        const data = (await response.json()) as CardsResponse;
        const { dismissedIds, pickedIds } = syncStoredIds(walletAddress);
        pollAfterMs.current = data.pollAfterMs ?? (data.mode === "demo" ? 10000 : 30000);

        setMode(data.mode);
        setLastUpdated(data.lastUpdated);
        setDeck((current) => {
          const next = mergePredictionDeck({
            currentDeck: current,
            incomingCards: data.cards,
            dismissedIds,
            pickedIds,
          });
          if (next.length > visibleDeck(current, dismissedIds, pickedIds).length) {
            showNewCardBurst();
          }
          return next;
        });
      } catch {
        setDeck((current) =>
          mergePredictionDeck({
            currentDeck: current,
            incomingCards: [],
            dismissedIds: dismissedIdsRef.current,
            pickedIds: pickedIdsRef.current,
          }),
        );
      } finally {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showNewCardBurst, syncStoredIds, walletAddress],
  );

  useEffect(() => {
    if (!walletAddress) return;

    let timeoutId: number | undefined;

    const schedule = (delay = 0) => {
      timeoutId = window.setTimeout(async () => {
        await fetchCards({ silent: deckRef.current.length > 0 });
        if (!documentIsHidden()) {
          schedule(pollAfterMs.current);
        }
      }, delay);
    };

    const resume = () => {
      if (!documentIsHidden()) {
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
      if (!walletAddress || dismissedIdsRef.current.has(cardId)) return;

      saveDismissedCardId(walletAddress, cardId);
      dismissedIdsRef.current = new Set([...dismissedIdsRef.current, cardId]);
      setHiddenIds(new Set([...dismissedIdsRef.current, ...pickedIdsRef.current]));

      const nextDeck = visibleDeck(deckRef.current, dismissedIdsRef.current, pickedIdsRef.current);
      setDeck(nextDeck);

      if (nextDeck.length <= LOW_WATERMARK) {
        void fetchCards({ silent: true });
      }
    },
    [fetchCards, walletAddress],
  );

  const simulateMatchEvent = useCallback(() => {
    if (!walletAddress) return;

    const template = simulatedMoments[simulatedMomentIndex.current % simulatedMoments.length];
    simulatedMomentIndex.current += 1;
    const card = makeSimulatedCard(template, simulatedMomentIndex.current);
    const createdAt = new Date().toISOString();

    const { dismissedIds, pickedIds } = syncStoredIds(walletAddress);
    setMode("demo");
    setLastUpdated(createdAt);
    setIsLoading(false);
    setDeck((current) =>
      mergePredictionDeck({
        currentDeck: current,
        incomingCards: [card],
        dismissedIds,
        pickedIds,
        prependIncoming: true,
      }),
    );
    showNewCardBurst();
  }, [showNewCardBurst, syncStoredIds, walletAddress]);

  const remainingCount = deck.length;
  const isEmpty = !isLoading && remainingCount === 0;

  return {
    activeCard,
    cards: deck,
    deck,
    dismissCard,
    isEmpty,
    isLoading,
    isRefreshing,
    lastUpdated,
    loading: isLoading,
    mode,
    newCardBurst,
    refresh: fetchCards,
    refreshCards: fetchCards,
    remainingCount,
    simulateMatchEvent,
  };
}
