"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import AppHeader from "@/components/AppHeader";
import PickHistory from "@/components/PickHistory";
import WalletConnectScreen from "@/components/WalletConnectScreen";
import { usePicks } from "@/hooks/usePicks";

export default function HistoryPage() {
  const { connected, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const { picks } = usePicks(walletAddress);

  if (!connected) return <WalletConnectScreen />;

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_34%),linear-gradient(180deg,#07100c,#050807_55%,#07120f)]">
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-6">
        <AppHeader />
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Today</p>
            <h1 className="mt-2 text-3xl font-black text-white">Pick history</h1>
          </div>
          <Link className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/62" href="/">
            Swipe
          </Link>
        </div>
        <PickHistory picks={picks} />
      </div>
    </div>
  );
}
