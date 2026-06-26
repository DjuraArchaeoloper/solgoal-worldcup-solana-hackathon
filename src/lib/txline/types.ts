export type PredictionDecision = "LOCK_IT" | "NO_WAY";

export type PredictionStatus = "live" | "upcoming" | "settled" | "pending";

export type PredictionEventLabel = "GOAL" | "RED CARD" | "PENALTY" | "HALF TIME" | "ODDS SHIFT" | "LATE PRESSURE";

export type PredictionCard = {
  id: string;
  matchId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  matchName: string;
  minute?: number;
  status: PredictionStatus;
  eventContext?: string;
  eventLabel?: PredictionEventLabel;
  predictionText: string;
  odds?: number;
  oddsTrend?: "up" | "down" | "steady";
  marketType:
    | "match_winner"
    | "goals"
    | "next_goal"
    | "both_teams_score"
    | "event_reaction"
    | "odds_movement";
  source: "txline" | "demo";
  createdAt: string;
  expiresAt?: string;
  result?: "won" | "lost" | "pending";
};

export type UserPick = {
  id: string;
  walletAddress: string;
  predictionId: string;
  decision: PredictionDecision;
  predictionText: string;
  matchName: string;
  odds?: number;
  pickedAt: string;
  source: "txline" | "demo";
  result: "won" | "lost" | "pending";
};

export type TxlineMode = "txline" | "demo";

export type NormalizedMatch = {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute?: number;
  status: PredictionStatus;
  startsAt?: string;
};

export type NormalizedEvent = {
  id: string;
  matchId: string;
  type: "goal" | "red_card" | "penalty" | "half_time" | "pressure" | "odds_shift";
  minute?: number;
  team?: string;
  description: string;
};

export type NormalizedOdds = {
  matchId: string;
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  over25?: number;
  under25?: number;
  bothTeamsScore?: number;
  bothTeamsNo?: number;
  nextGoalHome?: number;
  nextGoalAway?: number;
  movement?: "home" | "away" | "draw" | "goals";
  movementText?: string;
};

export type CardsResponse = {
  mode: TxlineMode;
  cards: PredictionCard[];
  lastUpdated: string;
  pollAfterMs?: number;
};

export type TxlineFixtureSnapshot = Record<string, unknown>;
export type TxlineScoreSnapshot = Record<string, unknown>;
export type TxlineOddsSnapshot = Record<string, unknown>;

export type WorldCupData = {
  matches: NormalizedMatch[];
  events: NormalizedEvent[];
  odds: NormalizedOdds[];
  pollAfterMs: number;
  lastUpdated: string;
};
