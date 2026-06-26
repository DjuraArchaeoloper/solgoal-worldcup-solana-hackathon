import Link from "next/link";
import { ShieldCheck, Sparkles, WalletCards } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_34%),linear-gradient(180deg,#07100c,#050807_55%,#07120f)] px-5 py-6">
      <section className="mx-auto w-full max-w-md space-y-5">
        <Link className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/64" href="/">
          Back
        </Link>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">About</p>
          <h1 className="mt-3 text-4xl font-black text-white">SwipeOdds</h1>
          <p className="mt-4 text-base leading-7 text-white/66">
            SwipeOdds is a football prediction game powered by live match data and consensus odds from TxLINE.
            Fans connect with Solana, swipe through prediction cards, and build a Sports IQ.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              [WalletCards, "Solana wallet is the only sign up."],
              [Sparkles, "Live match moments become simple prediction cards."],
              [ShieldCheck, "No betting, no deposits, no real-money predictions."],
            ].map(([Icon, text]) => (
              <div key={text as string} className="flex items-center gap-3 rounded-2xl bg-black/20 p-4">
                <Icon className="text-emerald-200" size={20} />
                <span className="text-sm font-semibold leading-5 text-white/72">{text as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200/18 bg-amber-200/10 p-5">
          <h2 className="text-lg font-black text-white">Disclaimer</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/76">
            SwipeOdds is not a betting platform. It does not accept deposits, wagers, or real-money predictions.
          </p>
        </div>
      </section>
    </main>
  );
}
