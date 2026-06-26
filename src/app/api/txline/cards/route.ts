import { buildPredictionCards } from "@/lib/txline/adapter";
import { hasTxlineCredentials, isForcedDemoMode } from "@/lib/txline/client";
import { getDemoSnapshot } from "@/lib/txline/demo";
import { txlineLogger } from "@/lib/txline/errors";
import { fetchWorldCupData } from "@/lib/txline/worldcup";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isForcedDemoMode() && hasTxlineCredentials()) {
    try {
      const data = await fetchWorldCupData();
      const cards = buildPredictionCards(data.matches, data.events, data.odds, "txline");

      if (cards.length) {
        return Response.json({
          mode: "txline",
          cards,
          lastUpdated: data.lastUpdated,
          pollAfterMs: data.pollAfterMs,
        });
      }
    } catch (error) {
      txlineLogger.warn("Falling back to demo cards", error);
    }
  }

  const demo = getDemoSnapshot();
  const cards = buildPredictionCards(demo.matches, demo.events, demo.odds, "demo");

  return Response.json({
    mode: "demo",
    cards,
    lastUpdated: demo.lastUpdated,
    pollAfterMs: demo.pollAfterMs,
  });
}
