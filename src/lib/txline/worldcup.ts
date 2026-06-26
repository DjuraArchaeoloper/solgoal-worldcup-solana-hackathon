import { getCached } from "./cache";
import { TXLINE_ENDPOINTS, txlineGet } from "./client";
import { txlineLogger } from "./errors";
import { normalizeEvents, normalizeMatches, normalizeOdds } from "./transformers";
import type { NormalizedMatch, TxlineFixtureSnapshot, TxlineOddsSnapshot, TxlineScoreSnapshot, WorldCupData } from "./types";

type FixtureRow = {
  id: string;
  raw: TxlineFixtureSnapshot;
  match: NormalizedMatch;
};

function utcEpochDay(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
}

function fixtureId(raw: TxlineFixtureSnapshot, match?: NormalizedMatch) {
  return (
    match?.id ??
    String(raw.FixtureId ?? raw.fixtureId ?? raw.id ?? raw.Id ?? raw.matchId ?? raw.gameId ?? "")
  );
}

function valueText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.toLowerCase();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function rawArray(value: unknown): TxlineFixtureSnapshot[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) return [];

  for (const key of ["data", "fixtures", "Fixtures", "items", "results"]) {
    const next = value[key];
    if (Array.isArray(next)) return next.filter(isRecord);
    const nested = rawArray(next);
    if (nested.length) return nested;
  }

  return [];
}

function isWorldCup(raw: TxlineFixtureSnapshot, match: NormalizedMatch) {
  const haystack = valueText(
    match.competition,
    raw.Competition,
    raw.competition,
    raw.League,
    raw.Tournament,
    raw.SportName,
  );

  return haystack.includes("world cup") || haystack.includes("fifa") || haystack.includes("international");
}

function sortRows(rows: FixtureRow[]) {
  const rank = { live: 0, upcoming: 1, pending: 2, settled: 3 };
  return [...rows].sort((a, b) => {
    const statusDiff = rank[a.match.status] - rank[b.match.status];
    if (statusDiff) return statusDiff;
    if (a.match.startsAt && b.match.startsAt) return a.match.startsAt.localeCompare(b.match.startsAt);
    return (b.match.minute ?? 0) - (a.match.minute ?? 0);
  });
}

function selectFixtures(fixtures: TxlineFixtureSnapshot[]) {
  const normalized = normalizeMatches(fixtures);
  const rows = fixtures
    .map((raw) => {
      const match = normalized.find((item) => item.id === fixtureId(raw));
      return match ? { id: fixtureId(raw, match), raw, match } : null;
    })
    .filter(Boolean) as FixtureRow[];

  const worldCupRows = rows.filter((row) => isWorldCup(row.raw, row.match));
  const eligibleRows = worldCupRows.length ? worldCupRows : rows;
  const sorted = sortRows(eligibleRows);
  const live = sorted.filter((row) => row.match.status === "live");
  const upcoming = sorted.filter((row) => row.match.status === "upcoming" || row.match.status === "pending");
  const settled = sorted.filter((row) => row.match.status === "settled");

  return [...live, ...upcoming, ...settled].slice(0, 8);
}

function pollAfterMs(matches: NormalizedMatch[]) {
  if (matches.some((match) => match.status === "live")) return 10_000;
  if (matches.some((match) => match.status === "upcoming" || match.status === "pending")) return 30_000;
  return 60_000;
}

async function optionalSnapshot<T>(description: string, fetcher: () => Promise<T>) {
  try {
    return await fetcher();
  } catch (error) {
    txlineLogger.warn(`${description} unavailable; continuing with partial data`, error);
    return undefined;
  }
}

export async function fetchWorldCupFixtures() {
  const startEpochDay = utcEpochDay() - 1;
  const data = await txlineGet<unknown>(TXLINE_ENDPOINTS.fixturesSnapshot, {
    cacheTtlMs: 15_000,
    query: { startEpochDay },
  });

  return rawArray(data);
}

export async function fetchWorldCupData(): Promise<WorldCupData> {
  return getCached("txline:worldcup:data", 3500, async () => {
    const fixtures = await fetchWorldCupFixtures();
    const selected = selectFixtures(fixtures);

    if (!selected.length) {
      return {
        matches: [],
        events: [],
        odds: [],
        pollAfterMs: 60_000,
        lastUpdated: new Date().toISOString(),
      };
    }

    const enriched = await Promise.all(
      selected.map(async (fixture) => {
        const [scoreSnapshot, oddsSnapshot] = await Promise.all([
          optionalSnapshot(`Score snapshot for fixture ${fixture.id}`, () =>
            txlineGet<TxlineScoreSnapshot>(TXLINE_ENDPOINTS.scoreSnapshot(fixture.id), { cacheTtlMs: 4000 }),
          ),
          optionalSnapshot(`Odds snapshot for fixture ${fixture.id}`, () =>
            txlineGet<TxlineOddsSnapshot>(TXLINE_ENDPOINTS.oddsSnapshot(fixture.id), { cacheTtlMs: 4000 }),
          ),
        ]);

        return {
          ...fixture.raw,
          fixtureId: fixture.id,
          FixtureId: fixture.id,
          scoreSnapshot,
          oddsSnapshot,
        };
      }),
    );

    const scores = enriched
      .map((item) => (item.scoreSnapshot ? { ...item.scoreSnapshot, fixtureId: item.fixtureId, FixtureId: item.fixtureId } : undefined))
      .filter(Boolean);
    const oddsSnapshots = enriched
      .map((item) => (item.oddsSnapshot ? { ...item.oddsSnapshot, fixtureId: item.fixtureId, FixtureId: item.fixtureId } : undefined))
      .filter(Boolean);
    const matches = normalizeMatches(enriched);
    const events = normalizeEvents(scores);
    const odds = normalizeOdds(oddsSnapshots);

    txlineLogger.debug("World Cup data normalized", {
      matches: matches.length,
      events: events.length,
      odds: odds.length,
    });

    return {
      matches,
      events,
      odds,
      pollAfterMs: pollAfterMs(matches),
      lastUpdated: new Date().toISOString(),
    };
  });
}
