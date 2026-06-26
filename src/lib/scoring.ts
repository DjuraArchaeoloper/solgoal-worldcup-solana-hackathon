import type { UserPick } from "./txline/types";

export type SportsIQScore = {
  sportsIQ: number | null;
  accuracy: number | null;
  totalPicks: number;
  settledPicks: number;
  pendingPicks: number;
  streak: number;
};

export function getCurrentStreak(picks: UserPick[]) {
  const settled = picks.filter((pick) => pick.result !== "pending");
  let streak = 0;

  for (const pick of settled) {
    if (pick.result !== "won") break;
    streak += 1;
  }

  return streak;
}

export function calculateSportsIQ(picks: UserPick[]): SportsIQScore {
  const settled = picks.filter((pick) => pick.result !== "pending");
  const wins = settled.filter((pick) => pick.result === "won").length;
  const pendingPicks = picks.length - settled.length;
  const streak = getCurrentStreak(picks);

  if (!settled.length) {
    return {
      sportsIQ: null,
      accuracy: null,
      totalPicks: picks.length,
      settledPicks: 0,
      pendingPicks,
      streak,
    };
  }

  const accuracy = Math.round((wins / settled.length) * 100);
  const sportsIQ = Math.min(100, Math.round(50 + accuracy * 0.5 + Math.min(10, streak)));

  return {
    sportsIQ,
    accuracy,
    totalPicks: picks.length,
    settledPicks: settled.length,
    pendingPicks,
    streak,
  };
}
