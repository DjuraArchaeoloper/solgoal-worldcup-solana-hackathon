import { cn } from "@/lib/utils";
import { shortenWallet } from "@/lib/wallet";

export default function LeaderboardPreview({
  walletAddress,
  sportsIQ,
}: {
  walletAddress?: string;
  sportsIQ: number | null;
}) {
  const rows = [
    { name: "8xK2...pL91", score: 94, isYou: false },
    { name: "3mA9...vQ22", score: 91, isYou: false },
    { name: walletAddress ? `You - ${shortenWallet(walletAddress)}` : "You", score: sportsIQ ?? "Pending", isYou: true },
  ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Leaderboard</h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/50">Preview</span>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.name}
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 py-3",
              row.isYou ? "border border-emerald-200/20 bg-emerald-300/10" : "bg-black/20",
            )}
          >
            <span className="text-sm font-bold text-white/76">
              {index + 1}. {row.name}
            </span>
            <span className="text-sm font-black text-emerald-200">{row.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
