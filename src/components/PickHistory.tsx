import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { UserPick } from "@/lib/txline/types";

function resultLabel(result: UserPick["result"]) {
  if (result === "pending") return "Pending";
  return result === "won" ? "Won" : "Lost";
}

function resultClasses(result: UserPick["result"]) {
  if (result === "won") return "border-emerald-200/20 bg-emerald-300/10 text-emerald-100";
  if (result === "lost") return "border-rose-200/20 bg-rose-300/10 text-rose-100";
  return "border-white/10 bg-white/[0.06] text-white/62";
}

export default function PickHistory({ picks }: { picks: UserPick[] }) {
  if (!picks.length) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/30">
        <h1 className="text-2xl font-black text-white">No picks yet.</h1>
        <p className="mt-3 text-sm text-white/58">Start swiping to build your Sports IQ.</p>
        <Link className="mt-6 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-black" href="/">
          Start swiping
        </Link>
      </section>
    );
  }

  const groupedPicks = Array.from(
    picks.reduce<Map<string, UserPick[]>>((groups, pick) => {
      const current = groups.get(pick.matchName) ?? [];
      current.push(pick);
      groups.set(pick.matchName, current);
      return groups;
    }, new Map()),
  );

  return (
    <section className="space-y-5">
      {groupedPicks.map(([matchName, matchPicks]) => (
        <div key={matchName} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">{matchName}</h2>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/42">
              {matchPicks.length} {matchPicks.length === 1 ? "pick" : "picks"}
            </span>
          </div>

          {matchPicks.map((pick) => {
            const ResultIcon = pick.result === "won" ? Check : pick.result === "lost" ? X : Clock;

            return (
              <article key={pick.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-lg shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/38">Prediction</p>
                    <h3 className="mt-2 text-base font-black leading-5 text-white">{pick.predictionText}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-white/70">
                    {pick.decision === "LOCK_IT" ? "Lock It" : "No Way"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${resultClasses(pick.result)}`}>
                    <ResultIcon size={14} />
                    {resultLabel(pick.result)}
                  </span>
                  {pick.odds ? (
                    <span className="rounded-full border border-sky-200/15 bg-sky-300/10 px-3 py-1 text-sky-100">
                      Odds {pick.odds.toFixed(2)}
                    </span>
                  ) : null}
                  <span className="ml-auto text-white/42">{formatTime(pick.pickedAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}
