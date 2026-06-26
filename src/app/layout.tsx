import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "SolGoal | The fastest way to test your football intuition.",
  description:
    "SolGoal is a football prediction game powered by live match data and consensus odds from TxLINE. Fans connect with Solana, swipe through prediction cards, and build a Sports IQ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#050807] text-white">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
