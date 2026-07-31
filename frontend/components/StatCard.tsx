import clsx from "clsx";

export function StatCard({
  label,
  value,
  accent = "brand",
}: {
  label: string;
  value: string;
  accent?: "brand" | "ok" | "invoice";
}) {
  const accentClasses = {
    brand: "border-l-brand-500",
    ok: "border-l-ok-500",
    invoice: "border-l-[#8A5CF6]",
  }[accent];

  return (
    <div className={clsx("panel border-l-4 px-5 py-4", accentClasses)}>
      <div className="field-label">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-semibold text-ink-900">{value}</div>
    </div>
  );
}
