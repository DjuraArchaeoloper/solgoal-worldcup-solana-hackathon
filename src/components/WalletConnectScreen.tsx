"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Flame, Radio, ShieldCheck, Trophy, Users, WalletCards } from "lucide-react";

export default function WalletConnectScreen() {
  const { connecting } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.32),transparent_36%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.22),transparent_30%),linear-gradient(180deg,#07100c_0%,#050506_55%,#09120f_100%)]" />
      <div className="absolute inset-x-8 top-10 h-40 rounded-full border border-emerald-300/10" />
      <div className="absolute bottom-16 left-1/2 h-72 w-[34rem] max-w-[92vw] -translate-x-1/2 rounded-[50%] border border-white/10 opacity-50" />

      <section className="relative w-full max-w-md rounded-[28px] border border-white/12 bg-white/[0.075] p-6 shadow-2xl shadow-black/45 backdrop-blur">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-400 text-black">
              <Flame size={18} />
            </span>
            SolGoal
          </div>
          <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
            Live football data
          </span>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <h1 className="text-5xl font-black leading-[0.95] text-white">SolGoal</h1>
            <p className="text-xl font-semibold leading-7 text-emerald-100">
              The fastest way to test your football intuition.
            </p>
            <p className="text-base leading-7 text-white/68">
              Connect your Solana wallet as your fan pass. Swipe live World Cup predictions powered by match
              events and odds movement.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/[0.22] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-200" size={19} />
              <div>
                <p className="text-sm font-black text-white">Wallet-only sign up</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/56">
                  No email. No password. Your wallet keeps your Sports IQ portable.
                </p>
              </div>
            </div>
          </div>

          <button
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-5 text-base font-black uppercase tracking-wide text-black shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-200 active:scale-[0.98]"
            onClick={() => setVisible(true)}
            type="button"
          >
            <WalletCards size={20} />
            {connecting ? "Connecting" : "Connect Wallet"}
          </button>

          <p className="text-center text-sm font-medium text-white/58">
            No betting. No deposits. Just football intuition.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["Swipe live predictions", Radio],
            ["Build your Sports IQ", Trophy],
            ["Compete with fans", Users],
          ].map(([label, Icon]) => (
            <div key={label as string} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
              <Icon className="mx-auto mb-2 text-emerald-200" size={18} />
              <span className="text-xs font-semibold text-white/72">{label as string}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
