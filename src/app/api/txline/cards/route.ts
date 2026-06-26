import { buildPredictionCards } from "@/lib/txline/adapter";
import { hasTxlineCredentials, isForcedDemoMode } from "@/lib/txline/client";
import { getDemoSnapshot } from "@/lib/txline/demo";
import { txlineLogger } from "@/lib/txline/errors";
import { fetchWorldCupData } from "@/lib/txline/worldcup";

export const dynamic = "force-dynamic";

function withDebug(request: Request, payload: Record<string, unknown>, diagnostics: Record<string, unknown>) {
  const url = new URL(request.url);
  if (url.searchParams.get("debug") !== "1") return Response.json(payload);

  return Response.json({
    ...payload,
    diagnostics,
  });
}

export async function GET(request: Request) {
  const forcedDemo = isForcedDemoMode();
  const credentialsPresent = hasTxlineCredentials();
  const diagnostics: Record<string, unknown> = {
    credentialsPresent,
    forcedDemo,
    fallbackReason: undefined,
  };

  if (!forcedDemo && credentialsPresent) {
    try {
      const data = await fetchWorldCupData();
      const cards = buildPredictionCards(data.matches, data.events, data.odds, "txline");
      diagnostics.txline = {
        cards: cards.length,
        events: data.events.length,
        matches: data.matches.length,
        odds: data.odds.length,
      };

      if (cards.length) {
        return withDebug(
          request,
          {
            mode: "txline",
            cards,
            lastUpdated: data.lastUpdated,
            pollAfterMs: data.pollAfterMs,
          },
          diagnostics,
        );
      }

      diagnostics.fallbackReason = "txline_returned_no_prediction_cards";
    } catch (error) {
      diagnostics.fallbackReason = "txline_request_failed";
      diagnostics.error = error instanceof Error ? error.message : String(error);
      txlineLogger.warn("Falling back to demo cards", error);
    }
  } else {
    diagnostics.fallbackReason = forcedDemo ? "forced_demo_mode" : "missing_txline_credentials";
  }

  const demo = getDemoSnapshot();
  const cards = buildPredictionCards(demo.matches, demo.events, demo.odds, "demo");

  return withDebug(
    request,
    {
      mode: "demo",
      cards,
      lastUpdated: demo.lastUpdated,
      pollAfterMs: demo.pollAfterMs,
    },
    diagnostics,
  );
}
