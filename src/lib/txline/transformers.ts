import type { NormalizedEvent, NormalizedMatch, NormalizedOdds, PredictionStatus } from "./types";

type LooseRecord = Record<string, unknown>;

function isRecord(value: unknown): value is LooseRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  for (const key of [
    "data",
    "fixtures",
    "Fixtures",
    "matches",
    "events",
    "Events",
    "actions",
    "Actions",
    "odds",
    "Odds",
    "markets",
    "Markets",
    "items",
    "results",
  ]) {
    const next = value[key];
    if (Array.isArray(next)) return next;
    if (isRecord(next)) {
      const nested = asArray(next);
      if (nested.length) return nested;
    }
  }

  return [];
}

function getPath(record: LooseRecord, path: string) {
  return path.split(".").reduce<unknown>((value, part) => {
    if (!isRecord(value)) return undefined;
    return value[part];
  }, record);
}

function recordsAt(record: LooseRecord, ...paths: string[]) {
  for (const path of paths) {
    const value = getPath(record, path);
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function number(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function token(value: unknown) {
  return text(value)?.toLowerCase().replace(/[^a-z0-9.]+/g, "_") ?? "";
}

function sideRecord(item: LooseRecord, side: "home" | "away") {
  const direct =
    side === "home"
      ? [item.homeTeam, item.home, item.Participant1, getPath(item, "teams.home"), getPath(item, "competitors.home")]
      : [item.awayTeam, item.away, item.Participant2, getPath(item, "teams.away"), getPath(item, "competitors.away")];

  for (const value of direct) {
    if (isRecord(value)) return value;
  }

  for (const team of recordsAt(item, "teams", "Teams", "competitors", "participants", "Participants")) {
    const qualifier = text(team.qualifier, team.side, team.homeAway, team.alignment, team.type)?.toLowerCase();
    if (qualifier === side || qualifier?.includes(side)) return team;
  }

  return undefined;
}

function teamName(item: LooseRecord, side: "home" | "away") {
  const sideTeam = sideRecord(item, side);
  const direct =
    side === "home"
      ? [
          getPath(item, "homeTeam.name"),
          getPath(item, "home.name"),
          getPath(item, "teams.home.name"),
          item.homeTeam,
          item.home,
          item.Participant1Name,
          item.participant1Name,
          item.Participant1,
        ]
      : [
          getPath(item, "awayTeam.name"),
          getPath(item, "away.name"),
          getPath(item, "teams.away.name"),
          item.awayTeam,
          item.away,
          item.Participant2Name,
          item.participant2Name,
          item.Participant2,
        ];

  return text(
    sideTeam?.name,
    sideTeam?.Name,
    sideTeam?.displayName,
    sideTeam?.shortName,
    getPath(sideTeam ?? {}, "team.name"),
    ...direct,
  );
}

function scoreSnapshot(item: LooseRecord) {
  const value = item.scoreSnapshot ?? item.ScoreSnapshot ?? item.score ?? item.Score;
  return isRecord(value) ? value : item;
}

function teamScore(item: LooseRecord, side: "home" | "away") {
  const sideTeam = sideRecord(item, side);
  const score = scoreSnapshot(item);
  const direct =
    side === "home"
      ? [
          item.homeScore,
          item.Participant1Score,
          item.participant1Score,
          getPath(score, "score.home"),
          getPath(score, "Score.Home"),
          getPath(score, "score.Participant1"),
          getPath(score, "Score.Participant1"),
          getPath(score, "goals.home"),
        ]
      : [
          item.awayScore,
          item.Participant2Score,
          item.participant2Score,
          getPath(score, "score.away"),
          getPath(score, "Score.Away"),
          getPath(score, "score.Participant2"),
          getPath(score, "Score.Participant2"),
          getPath(score, "goals.away"),
        ];

  return number(sideTeam?.score, sideTeam?.Score, getPath(sideTeam ?? {}, "scores.current"), ...direct);
}

function normalizeStatus(rawStatus?: string, minute?: number): PredictionStatus {
  const status = rawStatus?.toLowerCase() ?? "";

  if (
    status.includes("live") ||
    status.includes("in_progress") ||
    status.includes("inplay") ||
    status.includes("play") ||
    status.includes("1h") ||
    status.includes("2h") ||
    status.includes("half") ||
    status === "ht"
  ) {
    return "live";
  }

  if (
    status.includes("final") ||
    status.includes("ended") ||
    status.includes("complete") ||
    status.includes("closed") ||
    status.includes("settled")
  ) {
    return "settled";
  }

  if (minute && minute > 0 && minute < 130) return "live";
  if (status.includes("upcoming") || status.includes("scheduled") || status.includes("pre")) return "upcoming";
  return "pending";
}

export function normalizeMatches(input: unknown): NormalizedMatch[] {
  return asArray(input)
    .map((item, index) => {
      if (!isRecord(item)) return null;

      const homeTeam = teamName(item, "home");
      const awayTeam = teamName(item, "away");
      if (!homeTeam || !awayTeam) return null;

      const score = scoreSnapshot(item);
      const minute = number(
        item.minute,
        item.matchMinute,
        item.elapsed,
        item.elapsedMinutes,
        getPath(score, "minute"),
        getPath(score, "Minute"),
        getPath(score, "clock.minute"),
        getPath(score, "Clock.Minute"),
        getPath(score, "time.minute"),
        getPath(score, "GameClock.Minute"),
      );
      const rawStatus = text(
        item.status,
        item.Status,
        item.matchStatus,
        item.FixtureStatus,
        item.fixtureStatus,
        getPath(score, "status"),
        getPath(score, "Status"),
        getPath(score, "gameState"),
        getPath(score, "GameState"),
      );
      const startsAt = text(item.startTime, item.StartTime, item.startDate, item.StartDate, item.kickoffAt);

      return {
        id:
          text(item.id, item.Id, item.matchId, item.fixtureId, item.FixtureId, item.gameId, getPath(item, "fixture.id")) ??
          `${homeTeam}-${awayTeam}-${index}`,
        competition:
          text(
            item.competition,
            item.Competition,
            getPath(item, "competition.name"),
            getPath(item, "Competition.Name"),
            getPath(item, "tournament.name"),
            item.tournament,
          ) ?? "World Cup",
        homeTeam,
        awayTeam,
        homeScore: teamScore(item, "home") ?? 0,
        awayScore: teamScore(item, "away") ?? 0,
        minute,
        status: normalizeStatus(rawStatus, minute),
        startsAt,
      };
    })
    .filter(Boolean) as NormalizedMatch[];
}

function eventRows(input: unknown) {
  const rows: Array<{ parent?: LooseRecord; row: LooseRecord }> = [];

  for (const item of asArray(input)) {
    if (!isRecord(item)) continue;
    const actions = [
      ...recordsAt(item, "events", "Events"),
      ...recordsAt(item, "actions", "Actions"),
      ...recordsAt(item, "scoreEvents", "ScoreEvents"),
    ];

    if (actions.length) {
      for (const action of actions) rows.push({ parent: item, row: action });
    } else {
      rows.push({ row: item });
    }
  }

  return rows;
}

export function normalizeEvents(input: unknown): NormalizedEvent[] {
  return eventRows(input)
    .map(({ parent, row }, index) => {
      const rawType =
        text(
          row.type,
          row.Type,
          row.eventType,
          row.EventType,
          row.actionType,
          row.ActionType,
          row.kind,
          row.category,
          getPath(row, "event.type"),
          getPath(row, "card.color"),
        )?.toLowerCase() ?? "";

      const type: NormalizedEvent["type"] = rawType.includes("red")
        ? "red_card"
        : rawType.includes("pen")
          ? "penalty"
          : rawType.includes("half")
            ? "half_time"
            : rawType.includes("goal") || rawType.includes("score")
              ? "goal"
              : rawType.includes("odds") || rawType.includes("price") || rawType.includes("line")
                ? "odds_shift"
                : "pressure";
      const matchId = text(
        row.matchId,
        row.fixtureId,
        row.FixtureId,
        row.gameId,
        parent?.matchId,
        parent?.fixtureId,
        parent?.FixtureId,
        getPath(row, "match.id"),
        getPath(row, "fixture.id"),
      );

      if (!matchId) return null;

      return {
        id: text(row.id, row.Id, row.eventId, row.EventId) ?? `${matchId}-${type}-${index}`,
        matchId,
        type,
        minute: number(row.minute, row.Minute, row.matchMinute, row.elapsed, getPath(row, "clock.minute")),
        team: text(getPath(row, "team.name"), getPath(row, "participant.name"), row.team, row.Team, row.ParticipantName),
        description:
          text(row.description, row.Description, row.context, row.label, row.summary, row.name, row.Name) ??
          (type === "goal" ? "A goal changed the match" : "Momentum just shifted"),
      };
    })
    .filter(Boolean) as NormalizedEvent[];
}

function markets(item: LooseRecord) {
  return [
    ...recordsAt(item, "markets", "Markets", "odds.markets", "Odds.Markets", "consensus.markets"),
    ...recordsAt(item, "odds", "Odds", "gameOdds", "GameOdds", "superOdds", "SuperOdds"),
  ];
}

function outcomes(market: LooseRecord) {
  const direct = recordsAt(market, "outcomes", "Outcomes", "selections", "Selections", "prices", "Prices", "runners");
  if (direct.length) return direct;

  const priceNames = asArray(market.PriceNames ?? market.priceNames);
  const prices = asArray(market.Prices ?? market.prices);
  if (priceNames.length && prices.length) {
    return priceNames.map((name, index) => ({
      name,
      odds: prices[index],
      line: market.Line ?? market.line ?? market.MarketParameters,
    }));
  }

  if (isRecord(market.Prices)) {
    return Object.entries(market.Prices).map(([name, odds]) => ({ name, odds }));
  }

  return [];
}

function marketKey(market: LooseRecord) {
  return token(
    market.key ??
      market.type ??
      market.Type ??
      market.marketType ??
      market.MarketType ??
      market.SuperOddsType ??
      market.name ??
      market.Name ??
      market.label,
  );
}

function outcomeKey(outcome: LooseRecord) {
  return token(outcome.key ?? outcome.type ?? outcome.selection ?? outcome.name ?? outcome.Name ?? outcome.label ?? outcome.team);
}

function outcomePrice(outcome?: LooseRecord) {
  if (!outcome) return undefined;
  return number(outcome.odds, outcome.price, outcome.decimalOdds, outcome.consensus, getPath(outcome, "consensus.odds"));
}

function findMarket(item: LooseRecord, names: string[]) {
  const expected = names.map(token);
  return markets(item).find((market) => {
    const key = marketKey(market);
    return expected.some((name) => key === name || key.includes(name));
  });
}

function findOutcome(market: LooseRecord | undefined, names: string[], line?: number) {
  if (!market) return undefined;
  const expected = names.map(token);

  return outcomes(market).find((outcome) => {
    if (!isRecord(outcome)) return false;
    const key = outcomeKey(outcome);
    const outcomeLine = number(outcome.line, outcome.Line, outcome.handicap, outcome.total, getPath(outcome, "points"));
    const lineMatches = line === undefined || outcomeLine === undefined || Math.abs(outcomeLine - line) < 0.01;
    return lineMatches && expected.some((name) => key === name || key.includes(name));
  }) as LooseRecord | undefined;
}

function movementFromText(value?: string): NormalizedOdds["movement"] {
  const lower = value?.toLowerCase() ?? "";
  if (lower.includes("draw")) return "draw";
  if (lower.includes("away")) return "away";
  if (lower.includes("goal") || lower.includes("over")) return "goals";
  if (lower.includes("home")) return "home";
  return undefined;
}

export function normalizeOdds(input: unknown): NormalizedOdds[] {
  return asArray(input)
    .map((item) => {
      if (!isRecord(item)) return null;
      const matchId = text(item.matchId, item.fixtureId, item.FixtureId, item.gameId, getPath(item, "fixture.id"));
      if (!matchId) return null;

      const matchWinner = findMarket(item, ["match_winner", "match_winner_3_way", "1x2", "full_time_result", "moneyline"]);
      const totalGoals = findMarket(item, ["total_goals", "goals", "over_under", "goals_over_under", "total"]);
      const bothTeams = findMarket(item, ["both_teams_score", "both_teams_to_score", "btts"]);
      const nextGoal = findMarket(item, ["next_goal", "next_team_to_score"]);
      const movementText = text(item.movementText, item.trend, item.reason, getPath(item, "movement.text"));
      const movement = text(item.movement, item.shorteningSide, getPath(item, "movement.side")) as NormalizedOdds["movement"];

      return {
        matchId,
        homeWin: number(
          item.homeWin,
          item.home,
          item.Participant1,
          getPath(item, "markets.matchWinner.home"),
          outcomePrice(findOutcome(matchWinner, ["home", "home_win", "participant1", "1"])),
        ),
        draw: number(item.draw, getPath(item, "markets.matchWinner.draw"), outcomePrice(findOutcome(matchWinner, ["draw", "x"]))),
        awayWin: number(
          item.awayWin,
          item.away,
          item.Participant2,
          getPath(item, "markets.matchWinner.away"),
          outcomePrice(findOutcome(matchWinner, ["away", "away_win", "participant2", "2"])),
        ),
        over25: number(item.over25, outcomePrice(findOutcome(totalGoals, ["over", "over_2.5"], 2.5))),
        under25: number(item.under25, outcomePrice(findOutcome(totalGoals, ["under", "under_2.5"], 2.5))),
        bothTeamsScore: number(
          item.bothTeamsScore,
          getPath(item, "markets.bothTeamsScore.yes"),
          outcomePrice(findOutcome(bothTeams, ["yes", "both_teams_score"])),
        ),
        bothTeamsNo: number(item.bothTeamsNo, outcomePrice(findOutcome(bothTeams, ["no", "clean_sheet"]))),
        nextGoalHome: number(item.nextGoalHome, outcomePrice(findOutcome(nextGoal, ["home", "participant1", "1"]))),
        nextGoalAway: number(item.nextGoalAway, outcomePrice(findOutcome(nextGoal, ["away", "participant2", "2"]))),
        movement: movement ?? movementFromText(movementText),
        movementText,
      };
    })
    .filter(Boolean) as NormalizedOdds[];
}
