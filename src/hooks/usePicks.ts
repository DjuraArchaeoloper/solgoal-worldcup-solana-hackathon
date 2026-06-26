"use client";

import { useCallback, useMemo, useState } from "react";
import { getPicks, savePick } from "@/lib/storage";
import type { PredictionCard, PredictionDecision, UserPick } from "@/lib/txline/types";

export function usePicks(walletAddress?: string) {
  const [version, setVersion] = useState(0);
  const picks = useMemo(() => {
    void version;
    return walletAddress ? getPicks(walletAddress) : [];
  }, [version, walletAddress]);

  const addPick = useCallback(
    (card: PredictionCard, decision: PredictionDecision) => {
      if (!walletAddress) return null;

      const pick: UserPick = {
        id: `${walletAddress}-${card.id}-${Date.now()}`,
        walletAddress,
        predictionId: card.id,
        decision,
        predictionText: card.predictionText,
        matchName: card.matchName,
        odds: card.odds,
        pickedAt: new Date().toISOString(),
        source: card.source,
        result: card.result ?? "pending",
      };

      savePick(walletAddress, pick);
      setVersion((current) => current + 1);
      return pick;
    },
    [walletAddress],
  );

  return { picks, addPick };
}
