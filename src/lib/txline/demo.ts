import type { NormalizedEvent, NormalizedMatch, NormalizedOdds, WorldCupData } from "./types";

const demoMatches = [
  {
    id: "demo-arg-bra",
    competition: "World Cup",
    homeTeam: "Argentina",
    awayTeam: "Brazil",
    startMinute: 48,
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "demo-fra-eng",
    competition: "World Cup",
    homeTeam: "France",
    awayTeam: "England",
    startMinute: 62,
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "demo-esp-ger",
    competition: "World Cup",
    homeTeam: "Spain",
    awayTeam: "Germany",
    startMinute: 36,
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: "demo-por-ned",
    competition: "World Cup",
    homeTeam: "Portugal",
    awayTeam: "Netherlands",
    startMinute: 74,
    homeScore: 1,
    awayScore: 2,
  },
];

const eventRotation: Array<Omit<NormalizedEvent, "id" | "matchId">> = [
  {
    type: "goal",
    minute: 72,
    team: "Brazil",
    description: "Brazil just conceded and the tempo jumped",
  },
  {
    type: "red_card",
    minute: 64,
    team: "England",
    description: "England are down to 10 men",
  },
  {
    type: "penalty",
    minute: 39,
    team: "Spain",
    description: "Spain have a penalty check",
  },
  {
    type: "half_time",
    minute: 45,
    description: "Half time changed the rhythm",
  },
  {
    type: "pressure",
    minute: 84,
    team: "Portugal",
    description: "Portugal are pushing hard late",
  },
  {
    type: "odds_shift",
    minute: 68,
    team: "Argentina",
    description: "Argentina's edge is moving fast",
  },
];

export function getDemoSnapshot(now = new Date()): WorldCupData {
  const cycle = Math.floor(now.getTime() / 15000);

  const matches: NormalizedMatch[] = demoMatches.map((match, index) => {
    const minute = Math.min(90, match.startMinute + ((cycle + index * 3) % 18));
    const scoreLift = (cycle + index) % 7 === 0 ? 1 : 0;
    const lateAwayLift = (cycle + index) % 11 === 0 ? 1 : 0;

    return {
      id: match.id,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore + (index % 2 === 0 ? scoreLift : 0),
      awayScore: match.awayScore + (index % 2 === 1 ? scoreLift : lateAwayLift),
      minute,
      status: minute >= 90 ? "settled" : "live",
    };
  });

  const events: NormalizedEvent[] = matches.map((match, index) => {
    const template = eventRotation[(cycle + index) % eventRotation.length];
    return {
      ...template,
      id: `${match.id}-${template.type}-${cycle}`,
      matchId: match.id,
      minute: template.minute ?? match.minute,
      team: template.team ?? (index % 2 === 0 ? match.homeTeam : match.awayTeam),
    };
  });

  const odds: NormalizedOdds[] = matches.map((match, index) => {
    const drift = ((cycle + index) % 5) * 0.05;
    const homeLeads = match.homeScore > match.awayScore;
    const awayLeads = match.awayScore > match.homeScore;

    return {
      matchId: match.id,
      homeWin: Number((homeLeads ? 1.72 + drift : 2.15 + drift).toFixed(2)),
      draw: Number((match.homeScore === match.awayScore ? 2.8 - drift : 3.25 + drift).toFixed(2)),
      awayWin: Number((awayLeads ? 1.88 + drift : 2.45 + drift).toFixed(2)),
      over25: Number((2.05 - drift).toFixed(2)),
      under25: Number((1.9 + drift).toFixed(2)),
      bothTeamsScore: Number((1.82 + drift).toFixed(2)),
      bothTeamsNo: Number((2.08 - drift).toFixed(2)),
      nextGoalHome: Number((2.1 + drift).toFixed(2)),
      nextGoalAway: Number((2.35 - drift).toFixed(2)),
      movement: ["home", "away", "draw", "goals"][cycle % 4] as NormalizedOdds["movement"],
      movementText:
        cycle % 4 === 0
          ? `${match.homeTeam}'s odds just shortened`
          : cycle % 4 === 1
            ? `${match.awayTeam} are getting support`
            : cycle % 4 === 2
              ? "The draw is becoming more likely"
              : "One more goal is getting more likely",
    };
  });

  return {
    matches,
    events,
    odds,
    pollAfterMs: 10000,
    lastUpdated: now.toISOString(),
  };
}
