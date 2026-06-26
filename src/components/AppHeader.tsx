"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { LogOut, Zap } from "lucide-react";
import { shortenWallet } from "@/lib/wallet";

export default function AppHeader() {
  const { publicKey, disconnect } = useWallet();
  const wallet = publicKey?.toBase58();

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4">
      <Link className="flex items-center gap-2 text-lg font-black text-white" href="/">
        <span className="flex size-8 items-center justify-center rounded-full bg-emerald-300 text-black">
          <Zap size={17} />
        </span>
        SwipeOdds
      </Link>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100 min-[380px]:flex">
          <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]" />
          LIVE
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/74">
          {shortenWallet(wallet)}
        </span>
        <button
          aria-label="Disconnect wallet"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/72 transition hover:text-white"
          onClick={() => void disconnect()}
          type="button"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
