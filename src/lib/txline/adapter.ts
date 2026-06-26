import type { NormalizedEvent, NormalizedMatch, PredictionCard, TxlineMode } from "./types";
import { normalizeEvents, normalizeMatches, normalizeOdds } from "./transformers";

export { normalizeEvents, normalizeMatches, normalizeOdds };

function hash(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function demoResult(id: string, source: TxlineMode): PredictionCard["result"] {
  if (source !== "demo") return "pending";
  const value = hash(id);
  if (value % 5 === 0) return "pending";
  return value % 2 === 0 ? "won" : "lost";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createCard(
  match: NormalizedMatch,
  source: TxlineMode,
  now: Date,
  data: Omit<
    PredictionCard,
    "id" | "competition" | "homeTeam" | "awayTeam" | "matchName" | "source" | "createdAt" | "result"
  >,
): PredictionCard {
  const minuteBucket = match.minute ? Math.floor(match.minute / 3) * 3 : match.startsAt ?? "pre";
  const id = [source, match.id, data.marketType, slug(data.predictionText), minuteBucket].join("-");

  return {
    ...data,
    id,
    competition: match.competition,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    matchName: `${match.homeTeam} vs ${match.awayTeam}`,
    source,
    createdAt: now.toISOString(),
    expiresAt: data.expiresAt ?? new Date(now.getTime() + 12 * 60 * 1000).toISOString(),
    result: demoResult(id, source),
  };
}

function eventContext(event?: NormalizedEvent) {
  return event?.description;
}

function eventLabel(event?: NormalizedEvent): PredictionCard["eventLabel"] {
  if (!event) return undefined;
  if (event.type === "goal") return "GOAL";
  if (event.type === "red_card") return "RED CARD";
  if (event.type === "penalty") return "PENALTY";
  if (event.type === "half_time") return "HALF TIME";
  if (event.type === "odds_shift") return "ODDS SHIFT";
  return "LATE PRESSURE";
}

function opponentFor(match: NormalizedMatch, team?: string) {
  if (!team) return match.awayTeam;
  const lower = team.toLowerCase();
  if (match.homeTeam.toLowerCase() === lower) return match.awayTeam;
  if (match.awayTeam.toLowerCase() === lower) return match.homeTeam;
  return match.awayTeam;
}

function sortMatches(matches: NormalizedMatch[]) {
  const rank = { live: 0, upcoming: 1, pending: 2, settled: 3 };
  return [...matches].sort((a, b) => {
    const statusDiff = rank[a.status] - rank[b.status];
    if (statusDiff) return statusDiff;
    return (b.minute ?? 0) - (a.minute ?? 0);
  });
}

function addIfUseful(cards: PredictionCard[], card: PredictionCard) {
  if (!card.predictionText.trim()) return;
  if (cards.some((item) => item.id === card.id)) return;
  cards.push(card);
}

export function buildPredictionCards(
  matchesInput: unknown,
  eventsInput: unknown,
  oddsInput: unknown,
  source: TxlineMode,
  now = new Date(),
): PredictionCard[] {
  const matches = sortMatches(normalizeMatches(matchesInput));
  const events = normalizeEvents(eventsInput);
  const odds = normalizeOdds(oddsInput);
  const cards: PredictionCard[] = [];

  for (const match of matches.filter((item) => item.status === "live" || item.status === "upcoming").slice(0, 8)) {
    const matchOdds = odds.find((item) => item.matchId === match.id);
    const latestEvent = events
      .filter((item) => item.matchId === match.id)
      .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0))[0];
    const context = eventContext(latestEvent);
    const label = eventLabel(latestEvent);
    const isLate = (match.minute ?? 0) >= 75;

    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: `${match.homeTeam} wins`,
        odds: matchOdds?.homeWin,
        oddsTrend: matchOdds?.movement === "home" ? "down" : "steady",
        marketType: "match_winner",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: `${match.awayTeam} wins`,
        odds: matchOdds?.awayWin,
        oddsTrend: matchOdds?.movement === "away" ? "down" : "steady",
        marketType: "match_winner",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: "Draw at full time",
        odds: matchOdds?.draw,
        oddsTrend: matchOdds?.movement === "draw" ? "down" : "steady",
        marketType: "match_winner",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: isLate ? "One more goal before full time" : "Over 2.5 goals",
        odds: matchOdds?.over25,
        oddsTrend: matchOdds?.movement === "goals" ? "down" : "steady",
        marketType: "goals",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: isLate ? "No more goals" : "Under 2.5 goals",
        odds: matchOdds?.under25,
        oddsTrend: matchOdds?.movement === "goals" ? "up" : "steady",
        marketType: "goals",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: "Both teams score",
        odds: matchOdds?.bothTeamsScore,
        oddsTrend: matchOdds?.movement === "goals" ? "down" : "steady",
        marketType: "both_teams_score",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText: `${match.homeTeam} keeps a clean sheet`,
        odds: matchOdds?.bothTeamsNo,
        oddsTrend: "steady",
        marketType: "both_teams_score",
      }),
    );
    addIfUseful(
      cards,
      createCard(match, source, now, {
        matchId: match.id,
        minute: match.minute,
        status: match.status,
        eventContext: context,
        eventLabel: label,
        predictionText:
          match.homeScore <= match.awayScore ? `${match.homeTeam} scores next` : `${match.awayTeam} scores next`,
        odds: match.homeScore <= match.awayScore ? matchOdds?.nextGoalHome : matchOdds?.nextGoalAway,
        oddsTrend: matchOdds?.movement === "home" || matchOdds?.movement === "away" ? "down" : "steady",
        marketType: "next_goal",
      }),
    );

    if (latestEvent) {
      const eventTeam = latestEvent.team ?? match.homeTeam;
      const opponent = opponentFor(match, latestEvent.team);
      const reaction =
        latestEvent.type === "red_card"
          ? `${eventTeam} survives with 10 men`
          : latestEvent.type === "goal"
            ? `${eventTeam} scores again after this goal`
            : latestEvent.type === "penalty"
              ? "Penalty changes the match"
              : latestEvent.type === "half_time"
                ? "Second half has more goals"
                : "One more corner before full time";

      addIfUseful(
        cards,
        createCard(match, source, now, {
          matchId: match.id,
          minute: match.minute,
          status: match.status,
          eventContext: context,
          eventLabel: label,
          predictionText: reaction,
          odds: matchOdds?.over25 ?? matchOdds?.homeWin,
          oddsTrend: latestEvent.type === "odds_shift" ? "down" : "steady",
          marketType: "event_reaction",
        }),
      );

      if (latestEvent.type === "goal") {
        addIfUseful(
          cards,
          createCard(match, source, now, {
            matchId: match.id,
            minute: match.minute,
            status: match.status,
            eventContext: context,
            eventLabel: label,
            predictionText: `${opponent} responds after conceding`,
            odds: eventTeam === match.homeTeam ? matchOdds?.nextGoalAway : matchOdds?.nextGoalHome,
            oddsTrend: "steady",
            marketType: "event_reaction",
          }),
        );
      }

      if (latestEvent.type === "red_card") {
        addIfUseful(
          cards,
          createCard(match, source, now, {
            matchId: match.id,
            minute: match.minute,
            status: match.status,
            eventContext: context,
            eventLabel: label,
            predictionText: `${opponent} scores next`,
            odds: eventTeam === match.homeTeam ? matchOdds?.nextGoalAway : matchOdds?.nextGoalHome,
            oddsTrend: "down",
            marketType: "next_goal",
          }),
        );
      }
    }

    if (matchOdds?.movementText) {
      addIfUseful(
        cards,
        createCard(match, source, now, {
          matchId: match.id,
          minute: match.minute,
          status: match.status,
          eventContext: matchOdds.movementText,
          eventLabel: "ODDS SHIFT",
          predictionText:
            matchOdds.movement === "draw"
              ? "Draw becoming more likely"
              : matchOdds.movement === "away"
                ? `Market now favors ${match.awayTeam}`
                : matchOdds.movement === "goals"
                  ? "One more goal is getting more likely"
                  : `Market now favors ${match.homeTeam}`,
          odds: matchOdds.homeWin ?? matchOdds.awayWin ?? matchOdds.draw,
          oddsTrend: "down",
          marketType: "odds_movement",
        }),
      );
    }
  }

  return cards.slice(0, 32);
}
