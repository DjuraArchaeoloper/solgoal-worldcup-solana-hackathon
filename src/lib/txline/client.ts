import { getCached } from "./cache";
import { TxlineError, txlineLogger } from "./errors";

export const TXLINE_ENDPOINTS = {
  authGuestStart: "/auth/guest/start",
  fixturesSnapshot: "/api/fixtures/snapshot",
  scoreSnapshot: (fixtureId: string) => `/api/scores/snapshot/${encodeURIComponent(fixtureId)}`,
  oddsSnapshot: (fixtureId: string) => `/api/odds/snapshot/${encodeURIComponent(fixtureId)}`,
} as const;

type RequestOptions = {
  cacheTtlMs?: number;
  query?: Record<string, string | number | boolean | undefined>;
  retries?: number;
  timeoutMs?: number;
};

type GuestSessionResponse = {
  jwt?: string;
  token?: string;
  accessToken?: string;
  expiresAt?: string;
};

export function hasTxlineCredentials() {
  return Boolean((process.env.TXLINE_API_TOKEN ?? process.env.TXLINE_API_KEY) && process.env.TXLINE_BASE_URL);
}

export function isForcedDemoMode() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
}

function baseUrl() {
  const value = process.env.TXLINE_BASE_URL?.replace(/\/$/, "");
  if (!value) {
    throw new TxlineError("TXLINE_BASE_URL is not configured.", "CONFIG_MISSING");
  }
  return value;
}

function apiToken() {
  const value = process.env.TXLINE_API_TOKEN ?? process.env.TXLINE_API_KEY;
  if (!value) {
    throw new TxlineError("TXLINE_API_TOKEN is not configured.", "CONFIG_MISSING");
  }
  return value;
}

function withQuery(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${baseUrl()}${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function validateJson(value: unknown, path: string) {
  if (value === null || value === undefined) {
    throw new TxlineError(`TxLINE returned an empty response for ${path}.`, "INVALID_RESPONSE");
  }

  return value;
}

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const code = response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED";
      throw new TxlineError(
        `TxLINE request failed with ${response.status}: ${body.slice(0, 180)}`,
        code,
        response.status,
      );
    }

    return validateJson(await response.json(), url) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TxlineError("TxLINE request timed out.", "TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getGuestSessionToken() {
  return getCached("txline:guest-session", 20 * 60 * 1000, async () => {
    const url = withQuery(TXLINE_ENDPOINTS.authGuestStart);
    const data = await fetchJson<GuestSessionResponse>(
      url,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
        method: "POST",
      },
      5000,
    );

    const token = data.jwt ?? data.token ?? data.accessToken;
    if (!token) {
      throw new TxlineError("TxLINE guest session response did not include a token.", "AUTH_FAILED");
    }

    txlineLogger.debug("Guest session token refreshed");
    return token;
  });
}

async function requestWithRetries<T>(path: string, options: RequestOptions) {
  const retries = options.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const token = await getGuestSessionToken();
      const url = withQuery(path, options.query);

      return await fetchJson<T>(
        url,
        {
          cache: "no-store",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${token}`,
            "x-api-token": apiToken(),
          },
          method: "GET",
        },
        options.timeoutMs ?? 6000,
      );
    } catch (error) {
      lastError = error;

      if (error instanceof TxlineError && ["CONFIG_MISSING", "AUTH_FAILED", "RATE_LIMITED"].includes(error.code)) {
        break;
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function txlineGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const ttl = options.cacheTtlMs ?? 4000;
  const key = `txline:get:${path}:${JSON.stringify(options.query ?? {})}`;

  return getCached(key, ttl, () => requestWithRetries<T>(path, options));
}
