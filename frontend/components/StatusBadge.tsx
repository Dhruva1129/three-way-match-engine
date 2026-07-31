import clsx from "clsx";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { MatchStatus } from "@/lib/types";

const STATUS_CONFIG: Record<MatchStatus, { label: string; classes: string; Icon: typeof CheckCircle2 }> = {
  matched: { label: "Matched", classes: "bg-ok-50 text-ok-700", Icon: CheckCircle2 },
  partially_matched: { label: "Partially Matched", classes: "bg-warn-50 text-warn-700", Icon: AlertTriangle },
  mismatch: { label: "Mismatch", classes: "bg-bad-50 text-bad-700", Icon: XCircle },
  insufficient_documents: { label: "Insufficient Documents", classes: "bg-slate-100 text-slate-600", Icon: HelpCircle },
};

export function StatusBadge({ status, size = "md" }: { status: MatchStatus; size?: "sm" | "md" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.insufficient_documents;
  return (
    <span className={clsx("status-pill", cfg.classes, size === "sm" && "px-2 py-0.5 text-[11px]")}>
      <cfg.Icon size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
