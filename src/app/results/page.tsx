"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import AppHeader from "@/components/AppHeader";
import LeaderboardPreview from "@/components/LeaderboardPreview";
import SportsIQSummary from "@/components/SportsIQSummary";
import WalletConnectScreen from "@/components/WalletConnectScreen";
import { usePicks } from "@/hooks/usePicks";
import { useSportsIQ } from "@/hooks/useSportsIQ";

export default function ResultsPage() {
  const { connected, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const { picks } = usePicks(walletAddress);
  const summary = useSportsIQ(picks);

  if (!connected) return <WalletConnectScreen />;

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_34%),linear-gradient(180deg,#07100c,#050807_55%,#07120f)]">
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-6">
        <AppHeader />
        <div className="space-y-4">
          <SportsIQSummary summary={summary} walletAddress={walletAddress} />
          <LeaderboardPreview sportsIQ={summary.sportsIQ} walletAddress={walletAddress} />
          <Link
            className="flex h-14 items-center justify-center rounded-2xl bg-emerald-300 text-sm font-black uppercase tracking-wide text-black"
            href="/"
          >
            Keep swiping
          </Link>
        </div>
      </div>
    </div>
  );
}
