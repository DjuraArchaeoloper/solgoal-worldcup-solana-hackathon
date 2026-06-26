"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import AppHeader from "@/components/AppHeader";
import PredictionDeck from "@/components/PredictionDeck";
import WalletConnectScreen from "@/components/WalletConnectScreen";

export default function Home() {
  const { connected } = useWallet();

  if (!connected) return <WalletConnectScreen />;

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_34%),linear-gradient(180deg,#07100c,#050807_55%,#07120f)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <AppHeader />
        <PredictionDeck />
      </div>
    </div>
  );
}
