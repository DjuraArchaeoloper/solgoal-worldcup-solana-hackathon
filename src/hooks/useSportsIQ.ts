"use client";

import { useMemo } from "react";
import { calculateSportsIQ } from "@/lib/scoring";
import type { UserPick } from "@/lib/txline/types";

export function useSportsIQ(picks: UserPick[]) {
  return useMemo(() => calculateSportsIQ(picks), [picks]);
}
