import { Radio } from "lucide-react";

export default function DemoModeBadge({ mode }: { mode: "txline" | "demo" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-bold text-white/75">
      <Radio size={13} className={mode === "demo" ? "text-amber-200" : "text-emerald-200"} />
      {mode === "demo" ? "Demo Mode" : "TxLINE Live"}
    </span>
  );
}
