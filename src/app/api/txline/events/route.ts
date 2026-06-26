import { hasTxlineCredentials, isForcedDemoMode } from "@/lib/txline/client";
import { getDemoSnapshot } from "@/lib/txline/demo";
import { txlineLogger } from "@/lib/txline/errors";
import { fetchWorldCupData } from "@/lib/txline/worldcup";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isForcedDemoMode() && hasTxlineCredentials()) {
    try {
      const data = await fetchWorldCupData();
      return Response.json({ mode: "txline", events: data.events, lastUpdated: data.lastUpdated });
    } catch (error) {
      txlineLogger.warn("Falling back to demo events", error);
    }
  }

  const demo = getDemoSnapshot();
  return Response.json({ mode: "demo", events: demo.events, lastUpdated: demo.lastUpdated });
}
